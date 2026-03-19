/**
 * 語音辨識核心模組 v4.0
 * 統一所有遊戲的語音辨識流程
 *
 * 核心改進：
 * 1. 動態噪音底線 - 自動適應環境噪音，過濾電視/他人說話聲
 * 2. 單音節強化辨識 - 使用所有候選結果 + 寬鬆匹配
 * 3. 門檻=0 智慧模式 - 需按鈕觸發 + 最低聲量/持續時間要求
 * 4. 自動重試機制 - 失敗時自動重播正確發音並重試
 * 5. 所有遊戲統一使用此模組
 */

window.SpeechModule = (function () {
    'use strict';

    // ==========================================
    // 狀態變數
    // ==========================================
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let vadInterval = null;

    // 錄音
    let mediaRecorder = null;
    let audioChunks = [];
    let lastRecordedUrl = null;
    let isRecording = false;

    // 語音辨識
    let recognition = null;
    let recognitionSupported = false;
    let isListening = false;
    let isProcessing = false;
    let currentSession = null; // 當前辨識會話

    // 動態噪音底線
    let noiseFloor = 30;
    let noiseSamples = [];
    let noiseCalibrated = false;

    // ==========================================
    // 常數
    // ==========================================
    const NOISE_CALIBRATION_MS = 400;    // 噪音底線校準時間
    const NOISE_SAMPLE_INTERVAL = 50;    // 噪音取樣間隔
    const NOISE_MULTIPLIER = 2.0;        // 聲音需超過噪音底線的倍數
    const NOISE_MIN_THRESHOLD = 25;      // 最低 VAD 門檻
    const NOISE_MAX_THRESHOLD = 120;     // 最高 VAD 門檻
    const MIN_VOICE_MS_PER_CHAR = 350;   // 每字最少聲音持續毫秒
    const MIN_VOICE_MS_FLOOR = 400;      // 最低聲音持續毫秒
    const POST_BUTTON_IGNORE_MS = 150;   // 按鈕點擊後忽略的毫秒（避免點擊聲）
    const MAX_AUTO_RETRIES = 2;          // 自動重試次數

    // ==========================================
    // 初始化
    // ==========================================

    /**
     * 初始化語音辨識模組（VAD + 錄音 + 語音辨識）
     * @returns {Promise<boolean>} 是否成功
     */
    async function init() {
        // 初始化音訊上下文和麥克風
        if (!audioContext || !micStream) {
            try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                const source = audioContext.createMediaStreamSource(micStream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.4;
                source.connect(analyser);

                // 初始化錄音器
                _initRecorder(micStream);

                console.log('✅ SpeechModule: 麥克風與 VAD 初始化成功');
            } catch (err) {
                console.error('❌ SpeechModule: 麥克風初始化失敗', err);
                return false;
            }
        }

        // 初始化語音辨識引擎
        if (!recognition) {
            const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SR) {
                recognition = new SR();
                recognitionSupported = true;
                console.log('✅ SpeechModule: 語音辨識引擎初始化成功');
            } else {
                recognitionSupported = false;
                console.warn('⚠️ SpeechModule: 瀏覽器不支援語音辨識');
            }
        }

        return true;
    }

    /**
     * 初始化錄音器
     */
    function _initRecorder(stream) {
        try {
            const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
                       : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
            mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime })
                                : new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };
            mediaRecorder.onstop = () => {
                if (audioChunks.length > 0) {
                    const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                    if (lastRecordedUrl) URL.revokeObjectURL(lastRecordedUrl);
                    lastRecordedUrl = URL.createObjectURL(blob);
                }
            };
        } catch (err) {
            console.warn('⚠️ 錄音器初始化失敗:', err);
        }
    }

    // ==========================================
    // VAD（語音活動偵測）
    // ==========================================

    /**
     * 取得當前音量平均值
     */
    function _getAudioLevel() {
        if (!analyser) return 0;
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i];
        return sum / data.length;
    }

    /**
     * 校準噪音底線
     * @returns {Promise<number>} 噪音底線值
     */
    function _calibrateNoiseFloor() {
        return new Promise((resolve) => {
            noiseSamples = [];
            noiseCalibrated = false;
            const startTime = Date.now();
            const interval = setInterval(() => {
                noiseSamples.push(_getAudioLevel());
                if (Date.now() - startTime >= NOISE_CALIBRATION_MS) {
                    clearInterval(interval);
                    if (noiseSamples.length > 0) {
                        // 取中位數作為噪音底線（比平均值更穩定）
                        const sorted = noiseSamples.slice().sort((a, b) => a - b);
                        const median = sorted[Math.floor(sorted.length / 2)];
                        noiseFloor = Math.max(NOISE_MIN_THRESHOLD,
                                    Math.min(NOISE_MAX_THRESHOLD, median * NOISE_MULTIPLIER + 15));
                        noiseCalibrated = true;
                        console.log(`🔇 噪音底線校準: 中位數=${median.toFixed(1)}, 門檻=${noiseFloor.toFixed(1)}`);
                    }
                    resolve(noiseFloor);
                }
            }, NOISE_SAMPLE_INTERVAL);
        });
    }

    /**
     * 開始 VAD 監測
     * @param {object} session - 辨識會話
     */
    function _startVAD(session) {
        if (!analyser) return;

        session.vadActive = true;
        session.voiceDetected = false;
        session.voiceStartTime = null;
        session.totalVoiceDuration = 0;
        session.lastVoiceTime = null;
        session.peakLevel = 0;

        // 開始錄音
        _startRecording();

        vadInterval = setInterval(() => {
            if (!session.vadActive) return;

            const level = _getAudioLevel();
            if (level > session.peakLevel) session.peakLevel = level;

            // 忽略按鈕點擊後的短暫噪音
            if (Date.now() - session.startTime < POST_BUTTON_IGNORE_MS) return;

            if (level > noiseFloor) {
                const now = Date.now();
                if (!session.voiceStartTime) session.voiceStartTime = now;

                if (session.lastVoiceTime) {
                    session.totalVoiceDuration += (now - session.lastVoiceTime);
                }
                session.lastVoiceTime = now;

                const elapsed = now - session.voiceStartTime;
                if (elapsed >= 300 && !session.voiceDetected) {
                    session.voiceDetected = true;
                    if (session.callbacks.onVoiceDetected) {
                        session.callbacks.onVoiceDetected();
                    }
                }

                // 回報聲音長度
                if (session.callbacks.onVoiceDuration) {
                    session.callbacks.onVoiceDuration(session.totalVoiceDuration);
                }
            } else {
                // 靜音超過 500ms 重置連續計時（但保留累計）
                if (session.lastVoiceTime && Date.now() - session.lastVoiceTime > 500) {
                    session.lastVoiceTime = null;
                }
            }
        }, NOISE_SAMPLE_INTERVAL);
    }

    function _stopVAD() {
        if (vadInterval) {
            clearInterval(vadInterval);
            vadInterval = null;
        }
        _stopRecording();
    }

    // ==========================================
    // 錄音控制
    // ==========================================

    function _startRecording() {
        if (!mediaRecorder) return;
        audioChunks = [];
        if (mediaRecorder.state === 'inactive') {
            try {
                mediaRecorder.start();
                isRecording = true;
            } catch (e) { /* ignore */ }
        }
    }

    function _stopRecording() {
        if (!mediaRecorder) return;
        if (mediaRecorder.state === 'recording') {
            try {
                mediaRecorder.stop();
                isRecording = false;
            } catch (e) { /* ignore */ }
        }
    }

    /**
     * 回放上次錄音
     */
    function playRecording() {
        return new Promise((resolve) => {
            if (!lastRecordedUrl) { resolve(); return; }
            const audio = new Audio(lastRecordedUrl);
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            audio.play().catch(() => resolve());
        });
    }

    function hasRecording() {
        return !!lastRecordedUrl;
    }

    // ==========================================
    // 語音合成（TTS）
    // ==========================================

    function speak(text, rate) {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window) || !text) { resolve(); return; }
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-TW';
            u.rate = rate || 0.85;
            u.pitch = 1.1;
            u.volume = 1.0;
            u.onend = () => resolve();
            u.onerror = () => resolve();
            // Safari workaround: 如果 5 秒內沒結束就強制 resolve
            const timer = setTimeout(() => resolve(), 5000);
            u.onend = () => { clearTimeout(timer); resolve(); };
            window.speechSynthesis.speak(u);
        });
    }

    // ==========================================
    // 相似度比對（增強版）
    // ==========================================

    /**
     * 檢查辨識結果是否為系統語音
     */
    function _isSystemVoice(text) {
        const patterns = ['請跟著', '跟著唸', '請唸', '兩到三次', '2到3次',
                         '再試一次', '加油', '很棒', '太棒', '對了'];
        return patterns.some(p => text.includes(p));
    }

    /**
     * 增強版相似度計算 - 特別針對單音節和短詞優化
     * @param {string} transcript - 辨識結果
     * @param {string} target - 目標文字
     * @returns {number} 0-100 相似度
     */
    function _calculateSimilarity(transcript, target) {
        // 如果 config.js 的 calculateSimilarity 存在，用它
        if (typeof calculateSimilarity === 'function') {
            return calculateSimilarity(transcript, target);
        }

        if (!transcript || !target) return 0;
        const t = transcript.replace(/[\s。，！？、～~　]/g, '');
        const g = target.replace(/[\s。，！？、～~　]/g, '');
        if (t === g) return 100;
        if (!t || !g) return 0;

        // 單字特殊處理
        if (g.length === 1) {
            if (t.includes(g)) return 95;
            if (t.length === 1) return 0;
        }

        // 包含關係
        if (t.includes(g)) return 95;
        if (g.includes(t) && t.length >= g.length * 0.5) return 85;

        // 字元匹配
        let matches = 0;
        for (const ch of g) {
            if (t.includes(ch)) matches++;
        }
        const charScore = (matches / g.length) * 100;

        // Levenshtein
        const m = [];
        for (let i = 0; i <= t.length; i++) m[i] = [i];
        for (let j = 0; j <= g.length; j++) m[0][j] = j;
        for (let i = 1; i <= t.length; i++) {
            for (let j = 1; j <= g.length; j++) {
                const cost = t[i - 1] === g[j - 1] ? 0 : 1;
                m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + cost);
            }
        }
        const levScore = (1 - m[t.length][g.length] / Math.max(t.length, g.length)) * 100;

        return Math.max(charScore, levScore);
    }

    /**
     * 從多個候選結果中找最佳匹配
     * @param {SpeechRecognitionResultList} results - 辨識結果
     * @param {string} target - 目標文字
     * @returns {{ transcript: string, similarity: number }}
     */
    function _findBestMatch(results, target) {
        let bestTranscript = '';
        let bestSimilarity = 0;

        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            for (let j = 0; j < result.length; j++) {
                const text = result[j].transcript.trim();
                if (!text || _isSystemVoice(text)) continue;

                const sim = _calculateSimilarity(text, target);
                if (sim > bestSimilarity) {
                    bestSimilarity = sim;
                    bestTranscript = text;
                }

                // 完全匹配就直接返回
                if (sim >= 95) return { transcript: text, similarity: sim };
            }
        }

        return { transcript: bestTranscript, similarity: bestSimilarity };
    }

    // ==========================================
    // 核心聆聽功能
    // ==========================================

    /**
     * 計算聆聽時間
     */
    function _getListenDuration(text) {
        if (!text) return 8000;
        const len = text.length;
        if (len <= 1) return 7000;     // 單字：7秒
        if (len <= 3) return 7000;     // 短詞：7秒
        if (len <= 6) return 9000;     // 中等：9秒
        if (len <= 10) return 11000;   // 長句：11秒
        return 14000;                   // 很長：14秒
    }

    /**
     * 計算最短聲音持續時間
     */
    function _getMinVoiceDuration(text) {
        if (!text) return MIN_VOICE_MS_FLOOR;
        return Math.max(MIN_VOICE_MS_FLOOR, text.length * MIN_VOICE_MS_PER_CHAR);
    }

    /**
     * 開始聆聽並辨識
     *
     * @param {string} targetText - 目標文字（要辨識的內容）
     * @param {object} callbacks - 回調函數：
     *   onVoiceDetected()        - 偵測到有效聲音
     *   onVoiceDuration(ms)      - 聲音持續時間更新
     *   onInterim(transcript)    - 即時中間結果
     *   onResult(result)         - 最終結果 { transcript, similarity, passed, hadVoice, voiceDuration }
     *   onTimeout(info)          - 超時 { hadVoice, voiceDuration }
     *   onError(error)           - 錯誤
     * @returns {boolean} 是否成功啟動
     */
    function startListening(targetText, callbacks) {
        if (isListening || isProcessing) {
            console.log('⚠️ 已經在聆聽/處理中');
            return false;
        }

        if (!analyser) {
            console.error('❌ 未初始化，請先呼叫 init()');
            if (callbacks.onError) callbacks.onError('not-initialized');
            return false;
        }

        // 建立辨識會話
        const session = {
            target: targetText || '',
            callbacks: callbacks || {},
            startTime: Date.now(),
            vadActive: false,
            voiceDetected: false,
            voiceStartTime: null,
            totalVoiceDuration: 0,
            lastVoiceTime: null,
            peakLevel: 0,
            hasResult: false,
            lastTranscript: '',
            bestMatch: { transcript: '', similarity: 0 },
            timeout: null,
            resolved: false
        };

        currentSession = session;
        isListening = true;
        isProcessing = false;

        // 取得門檻（依賴 config.js）
        const threshold = typeof getSimilarityThreshold === 'function'
            ? getSimilarityThreshold() : 0;

        // 校準噪音底線，然後開始辨識
        _calibrateNoiseFloor().then(() => {
            if (session.resolved) return;

            // 門檻=0 時提高 VAD 門檻，要求更明確的聲音
            if (threshold === 0) {
                noiseFloor = Math.max(noiseFloor, 40);
            }

            // 啟動 VAD
            session.startTime = Date.now(); // 重置開始時間（排除校準時間）
            _startVAD(session);

            // 設定超時
            const duration = _getListenDuration(targetText);
            session.timeout = setTimeout(() => {
                _handleSessionEnd(session, 'timeout');
            }, duration);

            // 啟動語音辨識
            if (recognitionSupported && recognition) {
                _startSpeechRecognition(session, threshold);
            } else {
                // 不支援語音辨識，只靠 VAD
                console.log('📢 語音辨識不可用，僅使用 VAD');
            }
        });

        return true;
    }

    /**
     * 啟動 Web Speech API 辨識
     */
    function _startSpeechRecognition(session, threshold) {
        // 重新配置辨識器
        recognition.lang = 'zh-TW';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;

        // 清除舊事件
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;

        recognition.onstart = () => {
            console.log('🎤 語音辨識已啟動');
        };

        recognition.onresult = (event) => {
            if (session.resolved) return;

            // 遍歷所有結果找最佳匹配
            const match = _findBestMatch(event.results, session.target);

            if (match.similarity > session.bestMatch.similarity) {
                session.bestMatch = match;
            }

            // 取最新的 transcript 用於即時顯示
            const lastResult = event.results[event.results.length - 1];
            const latestText = lastResult[0].transcript.trim();
            const isFinal = lastResult.isFinal;

            if (latestText && !_isSystemVoice(latestText)) {
                session.lastTranscript = latestText;

                if (!isFinal && session.callbacks.onInterim) {
                    session.callbacks.onInterim(latestText);
                }

                if (isFinal) {
                    // 最終結果 - 立即處理
                    console.log(`📝 最終辨識: "${latestText}" (最佳匹配: "${session.bestMatch.transcript}" 相似度: ${session.bestMatch.similarity.toFixed(0)})`);

                    // 如果相似度夠高，立即成功
                    const passed = typeof passesSimilarityThreshold === 'function'
                        ? passesSimilarityThreshold(session.bestMatch.similarity)
                        : session.bestMatch.similarity >= threshold;

                    if (passed && session.bestMatch.similarity > 0) {
                        _handleSessionEnd(session, 'success');
                        return;
                    }

                    // 門檻=0 時：有辨識到任何文字就通過
                    if (threshold === 0 && session.bestMatch.transcript) {
                        _handleSessionEnd(session, 'success');
                        return;
                    }
                }
            }
        };

        recognition.onerror = (event) => {
            console.warn('⚠️ 語音辨識錯誤:', event.error);

            if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
                _handleSessionEnd(session, 'error', event.error);
                return;
            }

            // no-speech 不是致命錯誤，繼續等待
            if (event.error === 'no-speech') {
                // 如果 VAD 偵測到聲音，Web Speech API 可能漏掉了
                if (session.voiceDetected && threshold === 0) {
                    const minDur = _getMinVoiceDuration(session.target);
                    if (session.totalVoiceDuration >= minDur) {
                        _handleSessionEnd(session, 'voice-only');
                        return;
                    }
                }
            }
        };

        recognition.onend = () => {
            console.log('🎤 語音辨識已結束');

            if (session.resolved) return;

            // 辨識結束但還沒超時 - 檢查是否有足夠資料判定
            if (session.bestMatch.transcript) {
                const passed = typeof passesSimilarityThreshold === 'function'
                    ? passesSimilarityThreshold(session.bestMatch.similarity)
                    : session.bestMatch.similarity >= threshold;

                if (passed || (threshold === 0 && session.bestMatch.transcript)) {
                    _handleSessionEnd(session, 'success');
                    return;
                }
            }

            // 門檻=0 且有聲音活動
            if (threshold === 0 && session.voiceDetected) {
                const minDur = _getMinVoiceDuration(session.target);
                if (session.totalVoiceDuration >= minDur) {
                    _handleSessionEnd(session, 'voice-only');
                    return;
                }
            }

            // 嘗試重啟辨識（如果還在聆聽時間內）
            if (!session.resolved && isListening) {
                try {
                    recognition.start();
                    console.log('🔄 重啟語音辨識...');
                } catch (e) {
                    // 如果無法重啟，等超時處理
                    console.log('無法重啟辨識，等待超時');
                }
            }
        };

        try {
            recognition.start();
        } catch (e) {
            console.error('啟動語音辨識失敗:', e);
            // 繼續使用 VAD 模式
        }
    }

    /**
     * 處理辨識會話結束
     */
    function _handleSessionEnd(session, reason, errorCode) {
        if (session.resolved) return;
        session.resolved = true;

        // 清理
        clearTimeout(session.timeout);
        _stopVAD();
        if (recognition && isListening) {
            try { recognition.stop(); } catch (e) { /* ignore */ }
        }
        isListening = false;

        const threshold = typeof getSimilarityThreshold === 'function'
            ? getSimilarityThreshold() : 0;
        const minDuration = _getMinVoiceDuration(session.target);

        console.log(`📊 會話結束 reason=${reason}, 最佳="${session.bestMatch.transcript}", ` +
                    `相似度=${session.bestMatch.similarity.toFixed(0)}, ` +
                    `聲音=${session.totalVoiceDuration}ms, 最低需要=${minDuration}ms`);

        switch (reason) {
            case 'success': {
                isProcessing = true;
                const result = {
                    transcript: session.bestMatch.transcript,
                    similarity: session.bestMatch.similarity,
                    passed: true,
                    hadVoice: session.voiceDetected,
                    voiceDuration: session.totalVoiceDuration
                };
                if (session.callbacks.onResult) {
                    session.callbacks.onResult(result);
                }
                isProcessing = false;
                break;
            }

            case 'voice-only': {
                // VAD 偵測到聲音但辨識器沒有結果（常見於單音節）
                isProcessing = true;
                const result = {
                    transcript: session.bestMatch.transcript || '',
                    similarity: session.bestMatch.similarity || 0,
                    passed: (threshold === 0 && session.voiceDetected &&
                            session.totalVoiceDuration >= minDuration),
                    hadVoice: true,
                    voiceDuration: session.totalVoiceDuration
                };
                if (session.callbacks.onResult) {
                    session.callbacks.onResult(result);
                }
                isProcessing = false;
                break;
            }

            case 'timeout': {
                // 超時
                const hasUsableResult = session.bestMatch.transcript &&
                    (typeof passesSimilarityThreshold === 'function'
                        ? passesSimilarityThreshold(session.bestMatch.similarity)
                        : session.bestMatch.similarity >= threshold);

                // 門檻=0 時：有聲音且持續夠久就過
                const voicePass = threshold === 0 && session.voiceDetected &&
                                  session.totalVoiceDuration >= minDuration;

                if (hasUsableResult || voicePass) {
                    isProcessing = true;
                    const result = {
                        transcript: session.bestMatch.transcript || '',
                        similarity: session.bestMatch.similarity || 0,
                        passed: true,
                        hadVoice: session.voiceDetected,
                        voiceDuration: session.totalVoiceDuration
                    };
                    if (session.callbacks.onResult) {
                        session.callbacks.onResult(result);
                    }
                    isProcessing = false;
                } else {
                    // 真正的超時/失敗
                    if (session.bestMatch.transcript) {
                        // 有辨識結果但不過門檻
                        isProcessing = true;
                        const result = {
                            transcript: session.bestMatch.transcript,
                            similarity: session.bestMatch.similarity,
                            passed: false,
                            hadVoice: session.voiceDetected,
                            voiceDuration: session.totalVoiceDuration
                        };
                        if (session.callbacks.onResult) {
                            session.callbacks.onResult(result);
                        }
                        isProcessing = false;
                    } else if (session.callbacks.onTimeout) {
                        session.callbacks.onTimeout({
                            hadVoice: session.voiceDetected,
                            voiceDuration: session.totalVoiceDuration,
                            peakLevel: session.peakLevel
                        });
                    }
                }
                break;
            }

            case 'error': {
                if (session.callbacks.onError) {
                    session.callbacks.onError(errorCode);
                }
                break;
            }

            case 'stopped': {
                // 手動停止
                break;
            }
        }

        currentSession = null;
    }

    /**
     * 停止聆聽
     */
    function stopListening() {
        if (currentSession && !currentSession.resolved) {
            _handleSessionEnd(currentSession, 'stopped');
        }
        isListening = false;
        isProcessing = false;
    }

    /**
     * 重置狀態
     */
    function resetState() {
        isListening = false;
        isProcessing = false;
        currentSession = null;
    }

    // ==========================================
    // 工具函數
    // ==========================================

    /**
     * 檢查是否支援語音辨識
     */
    function isSupported() {
        return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    }

    /**
     * 取得門檻文字描述
     */
    function getThresholdLabel() {
        const t = typeof getSimilarityThreshold === 'function' ? getSimilarityThreshold() : 0;
        if (t === 0) return '鼓勵模式';
        if (t <= 30) return '簡單';
        if (t <= 50) return '練習';
        if (t <= 70) return '標準';
        if (t <= 90) return '挑戰';
        return '精準';
    }

    /**
     * 取得提示文字
     */
    function getPromptText(text) {
        const len = text ? text.length : 0;
        if (len <= 1) return { display: '按麥克風，唸 2~3 次 🎤', speak: '請唸兩到三次' };
        if (len <= 3) return { display: '按麥克風，跟著唸 🎤', speak: '請跟著唸' };
        return { display: '按麥克風，唸出來 🎤', speak: '請跟著唸' };
    }

    // ==========================================
    // 匯出公開 API
    // ==========================================
    return {
        // 初始化
        init: init,

        // 聆聽控制
        startListening: startListening,
        stopListening: stopListening,
        resetState: resetState,

        // 狀態查詢
        isListening: function () { return isListening; },
        isProcessing: function () { return isProcessing; },
        isSupported: isSupported,

        // 錄音
        playRecording: playRecording,
        hasRecording: hasRecording,

        // TTS
        speak: speak,

        // 工具
        getThresholdLabel: getThresholdLabel,
        getPromptText: getPromptText,

        // 暴露給進階用途
        getAudioLevel: _getAudioLevel,
        getNoiseFloor: function () { return noiseFloor; }
    };
})();
