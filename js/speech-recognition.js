/**
 * 語音辨識核心模組 v5.0
 * 統一所有遊戲的語音辨識流程
 *
 * v5.0 核心變更（解決「沒有即時回應」與「敲螢幕就過關」）：
 * 1. 人聲偵測取代能量偵測 —— 以時域自相關（NSDF）抓基頻 F0。
 *    人只要發出注音，母音段必有聲帶振動 → 訊號有穩定週期性；
 *    敲擊、拍打是非週期脈衝 → 抓不到穩定基頻。這是「說話」與「敲打」的物理差異。
 * 2. 零死區啟動 —— 噪音底線在背景持續校準，按下麥克風立刻開始聽。
 * 3. 即時回應 —— 確認人聲約 125ms，鼓勵模式在約 220ms 發聲後立即過關，不等辨識引擎。
 * 4. 說完即判 —— 偵測到說話結束（靜音 700ms）就強制辨識引擎收尾，不再空等 7 秒。
 * 5. 內建「聲音燈」HUD —— 所有遊戲不需修改即得到即時的音量／人聲視覺回饋。
 * 6. API 與 v4.0 相容：init / startListening / stopListening / playRecording / speak ...
 *
 * 判定模式（由目標文字與全域門檻決定）：
 *   voice  ：門檻 = 0（鼓勵模式）→ 確認人聲且發聲夠長即過；辨識到文字只是加分。
 *   hybrid ：單音節目標（單字或注音拼寫）且門檻 > 0 → 辨識命中即過；
 *            辨識無結果但確認人聲且夠長也過（Web Speech API 對孤立音節不可靠）。
 *   speech ：詞／句且門檻 > 0 → 完全由辨識相似度決定。
 *   無論哪個模式，「沒有人聲」一律不過關 —— 敲打、電視聲不再能矇混。
 */

(function (global) {
    'use strict';

    // ==========================================
    // 狀態變數
    // ==========================================
    let audioContext = null;
    let analyser = null;
    let micStream = null;
    let sampleRate = 48000;

    // 分析緩衝區（重複使用，避免 GC）
    let timeBuf = null;        // Float32Array(WIN_SAMPLES)
    let decBuf = null;         // 降取樣後
    let nsdfBuf = null;        // 自相關結果
    let byteBuf = null;        // 舊版 getAudioLevel 相容用

    // 錄音
    let mediaRecorder = null;
    let audioChunks = [];
    let lastRecordedUrl = null;

    // 語音辨識
    let recognition = null;
    let recognitionSupported = false;
    let isListening = false;
    let isProcessing = false;
    let currentSession = null;

    // 噪音底線（RMS，背景持續校準）
    let noiseRms = 0.004;
    let noiseHistory = [];
    let noiseTimer = null;
    let noiseFloor = 30;       // 舊版相容：byte 頻譜平均

    // HUD
    let hudEnabled = true;
    let hudEl = null;
    let hudRing = null;
    let hudText = null;
    let hudRaf = null;
    let hudHideTimer = null;
    let hudLevel = 0;          // 0~1
    let hudVoiced = false;

    // ==========================================
    // 常數
    // ==========================================
    const FRAME_MS = 25;                 // 分析週期
    const WIN_SAMPLES = 2048;            // 時域窗長（48kHz ≈ 43ms）
    const DECIM = 4;                     // 降取樣倍數（48k → 12k）
    const F0_MIN = 70;                   // 基頻下限 Hz（成年男性）
    const F0_MAX = 600;                  // 基頻上限 Hz（幼兒）
    const F0_JITTER_MAX = 0.35;          // 相鄰幀基頻相對變動上限（防敲擊共振）
    const DECAY_MAX = 3.5;               // 窗內前/後 1/4 能量比上限（≈11dB）；超過視為敲擊餘響
    const RMS_MARGIN = 2.2;              // 有效聲音需超過噪音底線倍數
    const SILENCE_END_MS = 700;          // 說完後靜音多久判定「說完了」
    const ASR_GRACE_MS = 1500;           // 說完後給辨識引擎收尾的時間
    const MIN_VOICED_SINGLE_MS = 220;    // 單音節最少發聲時間
    const MIN_VOICED_PER_CHAR_MS = 110;  // 多字：每字加多少
    const MIN_VOICED_CAP_MS = 900;       // 多字上限
    const NOISE_ONLY_MS = 150;           // 有聲響但非人聲累計超過此值 → 判為「敲打／雜音」
    const ASR_STRONG_SIM = 60;           // voice/hybrid 模式的安全閥：辨識明確命中即過
    const NOISE_HISTORY_LEN = 40;        // 背景噪音樣本數（約 4 秒）
    const NOISE_SAMPLE_MS = 100;
    const TTS_TAIL_MS = 250;             // TTS 結束後再忽略的尾音時間

    // 靈敏度預設（可由 config.js getVoiceSensitivity() 切換）
    const SENSITIVITY = {
        high:   { clarityOn: 0.45, clarityOff: 0.32, confirmFrames: 4, rmsFloor: 0.0035 },
        normal: { clarityOn: 0.55, clarityOff: 0.40, confirmFrames: 5, rmsFloor: 0.0050 },
        low:    { clarityOn: 0.65, clarityOff: 0.50, confirmFrames: 7, rmsFloor: 0.0090 }
    };

    const ZHUYIN_RE = /^[ㄅ-ㄯˊˇˋ˙]+$/;

    // ==========================================
    // 設定讀取（依賴 config.js，皆有預設值）
    // ==========================================
    function _threshold() {
        return typeof getSimilarityThreshold === 'function' ? getSimilarityThreshold() : 0;
    }
    function _sensitivity() {
        const key = typeof getVoiceSensitivity === 'function' ? getVoiceSensitivity() : 'normal';
        return SENSITIVITY[key] || SENSITIVITY.normal;
    }
    function _singleSyllableMode() {
        return typeof getSingleSyllableMode === 'function' ? getSingleSyllableMode() : 'voice';
    }
    function _hudWanted() {
        if (!hudEnabled) return false;
        return typeof getShowVoiceHud === 'function' ? getShowVoiceHud() : true;
    }

    // ==========================================
    // DSP：人聲偵測
    // ==========================================

    /**
     * 分析一幀：回傳 RMS、週期清晰度（0~1）、估計基頻 Hz、包絡衰減比
     * 純函數，可獨立測試
     * @param {Float32Array} src - 時域樣本
     * @param {number} sr - 取樣率
     * @returns {{rms:number, clarity:number, f0:number, decay:number}}
     */
    function analyzeFrame(src, sr) {
        const n = Math.floor(src.length / DECIM);
        if (!decBuf || decBuf.length !== n) decBuf = new Float32Array(n);

        // 盒狀濾波 + 降取樣（兼作簡易抗混疊）
        let mean = 0;
        for (let i = 0; i < n; i++) {
            let s = 0;
            const base = i * DECIM;
            for (let k = 0; k < DECIM; k++) s += src[base + k];
            const v = s / DECIM;
            decBuf[i] = v;
            mean += v;
        }
        mean /= n;

        // 去直流 + RMS + 包絡衰減比（前 1/4 vs 後 1/4 能量；敲擊急速衰減、母音持續）
        const q = n >> 2;
        let energy = 0, eHead = 0, eTail = 0;
        for (let i = 0; i < n; i++) {
            decBuf[i] -= mean;
            const e = decBuf[i] * decBuf[i];
            energy += e;
            if (i < q) eHead += e;
            else if (i >= n - q) eTail += e;
        }
        const rms = Math.sqrt(energy / n);
        const decay = eTail > 1e-12 ? Math.sqrt(eHead / eTail) : 99;
        if (rms < 1e-5) return { rms: rms, clarity: 0, f0: 0, decay: decay };

        const dsr = sr / DECIM;
        const maxLag = Math.min(n - 32, Math.ceil(dsr / F0_MIN));
        const startLag = 2; // 從極短 lag 起算，供零交越與高頻餘響判斷
        if (maxLag <= startLag + 2) return { rms: rms, clarity: 0, f0: 0, decay: decay };

        if (!nsdfBuf || nsdfBuf.length < maxLag + 2) nsdfBuf = new Float32Array(maxLag + 2);

        // NSDF（McLeod 正規化平方差）：週期訊號在真實週期處接近 1
        for (let lag = startLag; lag <= maxLag; lag++) {
            let ac = 0, m = 0;
            const lim = n - lag;
            for (let i = 0; i < lim; i++) {
                const a = decBuf[i], b = decBuf[i + lag];
                ac += a * b;
                m += a * a + b * b;
            }
            nsdfBuf[lag] = m > 0 ? (2 * ac) / m : 0;
        }

        // McLeod 峰值選取：NSDF 必須先轉負（跨過半週期），之後的局部極大值才算候選。
        // 低頻悶響在短 lag 處相鄰樣本高度相關、看似週期 → 未轉負即排除。
        let lag = startLag;
        while (lag <= maxLag && nsdfBuf[lag] > 0) lag++;
        if (lag > maxLag) return { rms: rms, clarity: 0, f0: 0, decay: decay };

        let gmax = 0;
        for (let l = lag; l <= maxLag; l++) if (nsdfBuf[l] > gmax) gmax = nsdfBuf[l];
        if (gmax <= 0) return { rms: rms, clarity: 0, f0: 0, decay: decay };

        // 第一個 ≥ 0.85×最大值的局部極大值（減少八度誤判）。
        // 若它落在 F0_MAX 之上（如 1500Hz 機殼餘響），f0 會超出範圍而被呼叫端排除。
        let bestLag = 0, bestVal = 0;
        for (let l = lag + 1; l < maxLag; l++) {
            const v = nsdfBuf[l];
            if (v >= gmax * 0.85 && v > nsdfBuf[l - 1] && v >= nsdfBuf[l + 1]) { bestLag = l; bestVal = v; break; }
        }
        if (!bestLag) return { rms: rms, clarity: gmax, f0: 0, decay: decay };
        return { rms: rms, clarity: bestVal, f0: dsr / bestLag, decay: decay };
    }

    /**
     * 單幀人聲判定（純函數；_tick、getVoiceState 與測試共用同一套規則）
     * @param {object} a - analyzeFrame 結果
     * @param {number} gate - RMS 門檻
     * @param {object} sens - 靈敏度參數
     * @param {boolean} relaxed - 已確認人聲後採用較低的清晰度門檻（遲滯）
     */
    function classifyFrame(a, gate, sens, relaxed) {
        if (a.rms <= gate) return false;
        if (a.f0 < F0_MIN || a.f0 > F0_MAX) return false;
        if (a.decay > DECAY_MAX) return false;       // 窗內急速衰減 → 敲擊餘響
        return a.clarity >= (relaxed ? sens.clarityOff : sens.clarityOn);
    }

    /**
     * 是否為單音節目標（單一國字，或一組注音拼寫如「ㄇㄚˊ」）
     */
    function isSingleSyllable(text) {
        const t = (text || '').replace(/[\s。，！？、～~　,.!?]/g, '');
        if (!t) return false;
        if (ZHUYIN_RE.test(t)) return true;
        return [...t].length === 1;
    }

    /**
     * 目標文字需要的最少發聲時間
     */
    function minVoicedMs(text) {
        if (isSingleSyllable(text)) return MIN_VOICED_SINGLE_MS;
        const len = (text || '').replace(/[\s。，！？、～~　,.!?]/g, '').length || 1;
        return Math.min(MIN_VOICED_CAP_MS, MIN_VOICED_SINGLE_MS + MIN_VOICED_PER_CHAR_MS * len);
    }

    // ==========================================
    // 初始化
    // ==========================================

    /**
     * 初始化（麥克風 + 分析器 + 錄音器 + 辨識引擎），可重複呼叫
     * @returns {Promise<boolean>}
     */
    async function init() {
        if (!audioContext || !micStream) {
            try {
                audioContext = new (global.AudioContext || global.webkitAudioContext)();
                micStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,   // 避免收到自己播放的 TTS
                        noiseSuppression: false,  // 抑噪會削掉短促子音，關閉
                        autoGainControl: false    // AGC 會讓噪音底線飄移，關閉
                    }
                });
                sampleRate = audioContext.sampleRate || 48000;
                const source = audioContext.createMediaStreamSource(micStream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = WIN_SAMPLES;
                analyser.smoothingTimeConstant = 0;
                source.connect(analyser);

                timeBuf = new Float32Array(analyser.fftSize);
                byteBuf = new Uint8Array(analyser.frequencyBinCount);

                _initRecorder(micStream);
                _startNoiseTracking();

                console.log(`✅ SpeechModule v5: 麥克風就緒 (sr=${sampleRate})`);
            } catch (err) {
                console.error('❌ SpeechModule: 麥克風初始化失敗', err);
                return false;
            }
        }
        if (audioContext && audioContext.state === 'suspended') {
            try { await audioContext.resume(); } catch (e) { /* ignore */ }
        }

        if (!recognition) {
            const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
            if (SR) {
                recognition = new SR();
                recognitionSupported = true;
                console.log('✅ SpeechModule: 語音辨識引擎就緒');
            } else {
                recognitionSupported = false;
                console.warn('⚠️ SpeechModule: 瀏覽器不支援語音辨識，僅用人聲偵測');
            }
        }
        return true;
    }

    function _initRecorder(stream) {
        if (typeof MediaRecorder === 'undefined') {
            console.warn('⚠️ 此瀏覽器沒有 MediaRecorder，無法錄音回放（iOS 14.5 以下）');
            return;
        }
        try {
            const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm'
                       : MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';
            mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime })
                                : new MediaRecorder(stream);
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
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
    // 背景噪音追蹤（不聆聽時持續進行 → 按下即聽，零死區）
    // ==========================================
    let byteTimeBuf = null;
    function _readFrame() {
        if (typeof analyser.getFloatTimeDomainData === 'function') {
            analyser.getFloatTimeDomainData(timeBuf);
        } else {
            // iOS 12 Safari 等舊瀏覽器沒有 getFloatTimeDomainData，用 8-bit 版本轉換
            if (!byteTimeBuf) byteTimeBuf = new Uint8Array(timeBuf.length);
            analyser.getByteTimeDomainData(byteTimeBuf);
            for (let i = 0; i < byteTimeBuf.length; i++) timeBuf[i] = (byteTimeBuf[i] - 128) / 128;
        }
        return analyzeFrame(timeBuf, sampleRate);
    }

    function _startNoiseTracking() {
        if (noiseTimer) clearInterval(noiseTimer);
        noiseTimer = setInterval(() => {
            if (!analyser || isListening) return;
            // TTS 播放中的聲音不算環境噪音
            if (global.speechSynthesis && global.speechSynthesis.speaking) return;
            const a = _readFrame();
            noiseHistory.push(a.rms);
            if (noiseHistory.length > NOISE_HISTORY_LEN) noiseHistory.shift();
            // 取 30 百分位數：對偶發的大聲響（關門、對話）不敏感
            const sorted = noiseHistory.slice().sort((x, y) => x - y);
            noiseRms = sorted[Math.floor(sorted.length * 0.3)] || noiseRms;
        }, NOISE_SAMPLE_MS);
    }

    /** 當前聲音門檻（RMS） */
    function _gate() {
        return Math.max(_sensitivity().rmsFloor, noiseRms * RMS_MARGIN);
    }

    // ==========================================
    // 錄音控制
    // ==========================================
    function _startRecording() {
        if (!mediaRecorder) return;
        audioChunks = [];
        if (mediaRecorder.state === 'inactive') {
            try { mediaRecorder.start(); } catch (e) { /* ignore */ }
        }
    }
    function _stopRecording() {
        if (!mediaRecorder) return;
        if (mediaRecorder.state === 'recording') {
            try { mediaRecorder.stop(); } catch (e) { /* ignore */ }
        }
    }
    function playRecording() {
        return new Promise((resolve) => {
            if (!lastRecordedUrl) { resolve(); return; }
            const audio = new Audio(lastRecordedUrl);
            audio.onended = () => resolve();
            audio.onerror = () => resolve();
            audio.play().catch(() => resolve());
        });
    }
    function hasRecording() { return !!lastRecordedUrl; }

    // ==========================================
    // 語音合成（TTS）
    // ==========================================
    function speak(text, rate) {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in global) || !text) { resolve(); return; }
            global.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-TW';
            u.rate = rate || 0.85;
            u.pitch = 1.1;
            u.volume = 1.0;
            const timer = setTimeout(() => resolve(), 5000); // Safari 保險
            u.onend = () => { clearTimeout(timer); resolve(); };
            u.onerror = () => { clearTimeout(timer); resolve(); };
            global.speechSynthesis.speak(u);
        });
    }

    // ==========================================
    // 相似度比對
    // ==========================================
    function _isSystemVoice(text) {
        const patterns = ['請跟著', '跟著唸', '請唸', '兩到三次', '2到3次',
                         '再試一次', '加油', '很棒', '太棒', '對了', '大聲唸', '唸出來'];
        return patterns.some(p => text.includes(p));
    }

    function _calculateSimilarity(transcript, target) {
        if (typeof calculateSimilarity === 'function') {
            return calculateSimilarity(transcript, target);
        }
        if (!transcript || !target) return 0;
        const t = transcript.replace(/[\s。，！？、～~　]/g, '');
        const g = target.replace(/[\s。，！？、～~　]/g, '');
        if (t === g) return 100;
        if (!t || !g) return 0;
        if (g.length === 1) {
            if (t.includes(g)) return 95;
            if (t.length === 1) return 0;
        }
        if (t.includes(g)) return 95;
        if (g.includes(t) && t.length >= g.length * 0.5) return 85;
        let matches = 0;
        for (const ch of g) if (t.includes(ch)) matches++;
        const charScore = (matches / g.length) * 100;
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

    function _findBestMatch(results, target) {
        let bestTranscript = '', bestSimilarity = 0;
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            for (let j = 0; j < result.length; j++) {
                const text = result[j].transcript.trim();
                if (!text || _isSystemVoice(text)) continue;
                const sim = _calculateSimilarity(text, target);
                if (sim > bestSimilarity) { bestSimilarity = sim; bestTranscript = text; }
                if (sim >= 95) return { transcript: text, similarity: sim };
            }
        }
        return { transcript: bestTranscript, similarity: bestSimilarity };
    }

    // ==========================================
    // HUD（聲音燈）—— 所有遊戲共用的即時視覺回饋
    // ==========================================
    function _ensureHud() {
        if (hudEl || typeof document === 'undefined') return;
        hudEl = document.createElement('div');
        hudEl.id = 'speech-hud';
        hudEl.setAttribute('aria-live', 'polite');
        hudEl.style.cssText = [
            'position:fixed', 'left:50%', 'bottom:max(14px, env(safe-area-inset-bottom))',
            'transform:translateX(-50%)', 'z-index:2147483000', 'pointer-events:none',
            'display:none', 'align-items:center', 'gap:12px',
            'padding:10px 18px 10px 12px', 'border-radius:999px',
            'background:rgba(30,30,40,0.88)', 'color:#fff',
            'font:600 18px/1.2 system-ui,-apple-system,"Noto Sans TC",sans-serif',
            'box-shadow:0 6px 24px rgba(0,0,0,0.35)', 'max-width:92vw',
            'transition:opacity .15s'
        ].join(';');

        hudRing = document.createElement('div');
        hudRing.style.cssText = [
            'width:34px', 'height:34px', 'border-radius:50%', 'flex:none',
            'background:#9e9e9e', 'box-shadow:0 0 0 0 rgba(76,175,80,0)',
            'transition:background .12s, box-shadow .12s'
        ].join(';');

        hudText = document.createElement('div');
        hudText.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis';

        hudEl.appendChild(hudRing);
        hudEl.appendChild(hudText);
        document.body.appendChild(hudEl);
    }

    function _hudShow(text) {
        if (!_hudWanted()) return;
        _ensureHud();
        if (!hudEl) return;
        if (hudHideTimer) { clearTimeout(hudHideTimer); hudHideTimer = null; } // 取消上一題排程中的隱藏
        hudText.textContent = text;
        hudEl.style.display = 'flex';
        hudEl.style.opacity = '1';
        if (!hudRaf) _hudLoop();
    }

    function _hudSetText(text) {
        if (hudEl && hudEl.style.display !== 'none') hudText.textContent = text;
    }

    function _hudLoop() {
        hudRaf = requestAnimationFrame(_hudLoop);
        if (!hudRing) return;
        const scale = 1 + Math.min(1, hudLevel) * 0.9;
        hudRing.style.transform = `scale(${scale.toFixed(2)})`;
        if (hudVoiced) {
            hudRing.style.background = '#4caf50';
            hudRing.style.boxShadow = `0 0 0 ${Math.round(6 + hudLevel * 14)}px rgba(76,175,80,0.35)`;
        } else if (hudLevel > 0.15) {
            hudRing.style.background = '#ffb74d';
            hudRing.style.boxShadow = '0 0 0 4px rgba(255,183,77,0.3)';
        } else {
            hudRing.style.background = '#9e9e9e';
            hudRing.style.boxShadow = '0 0 0 0 rgba(0,0,0,0)';
        }
    }

    function _hudHide(delayMs) {
        if (!hudEl) return;
        if (hudHideTimer) { clearTimeout(hudHideTimer); hudHideTimer = null; }
        const doHide = () => {
            hudHideTimer = null;
            hudEl.style.display = 'none';
            if (hudRaf) { cancelAnimationFrame(hudRaf); hudRaf = null; }
        };
        if (delayMs) hudHideTimer = setTimeout(doHide, delayMs); else doHide();
    }

    // ==========================================
    // 核心聆聽
    // ==========================================

    /** 沒有任何聲音時的最長等待（有說話會提早結束） */
    function _getListenDuration(text) {
        const len = (text || '').length;
        if (len <= 1) return 6000;
        if (len <= 3) return 7000;
        if (len <= 6) return 8000;
        if (len <= 10) return 10000;
        return 12000;
    }

    /**
     * 開始聆聽並辨識
     * @param {string} targetText - 目標文字
     * @param {object} callbacks
     *   onVoiceDetected()          - 確認聽到人聲（約 125ms 內）
     *   onVoiceLevel({level, voiced, voicedMs}) - 每 25ms 的即時音量／人聲狀態（選用）
     *   onSpeechEnd()              - 偵測到說完了（選用）
     *   onInterim(transcript)      - 辨識中間結果
     *   onResult(result)           - { transcript, similarity, passed, basis, hadVoice, hasVoice, voiceDuration, voicedMs }
     *   onTimeout(info)            - 沒聽到人聲 { hadVoice, hasVoice, voiceDuration, noiseOnly, peakLevel }
     *   onError(error)
     * @returns {boolean}
     */
    function startListening(targetText, callbacks) {
        if (isListening || isProcessing) {
            console.log('⚠️ 已經在聆聽/處理中');
            return false;
        }
        if (!analyser) {
            console.error('❌ 未初始化，請先呼叫 init()');
            if (callbacks && callbacks.onError) callbacks.onError('not-initialized');
            return false;
        }
        const threshold = _threshold();
        const single = isSingleSyllable(targetText);
        let passMode = 'speech';
        if (threshold === 0) passMode = 'voice';
        else if (single && _singleSyllableMode() !== 'strict') passMode = 'hybrid';

        const sens = _sensitivity();
        const session = {
            target: targetText || '',
            callbacks: callbacks || {},
            passMode: passMode,
            threshold: threshold,
            sens: sens,
            gate: _gate(),
            minVoicedMs: minVoicedMs(targetText),
            startTime: Date.now(),
            // 人聲追蹤
            voicedRun: 0,
            voicedMs: 0,
            loudMs: 0,
            lastVoicedAt: 0,
            lastF0: 0,
            voiceConfirmed: false,
            speechEnded: false,
            peakLevel: 0,
            ttsUntil: 0,          // 此時間點前的幀視為系統播音，不算人聲
            // 辨識
            best: { transcript: '', similarity: 0 },
            lastTranscript: '',
            asrStopRequested: false,
            // 計時器
            frameTimer: null,
            timeout: null,
            graceTimer: null,
            resolved: false
        };
        currentSession = session;
        isListening = true;
        isProcessing = false;

        console.log(`🎧 開始聆聽「${session.target}」 模式=${passMode} 門檻=${threshold} ` +
                    `gate=${session.gate.toFixed(4)} 需發聲≥${session.minVoicedMs}ms`);

        _startRecording();
        hudLevel = 0; hudVoiced = false;
        _hudShow('🎤 我在聽…說出來吧');
        if (global.speechSynthesis && global.speechSynthesis.speaking) session.ttsUntil = Date.now() + TTS_TAIL_MS;

        session.frameTimer = setInterval(() => _tick(session), FRAME_MS);
        session.timeout = setTimeout(() => _end(session, 'timeout'), _getListenDuration(targetText));

        if (recognitionSupported && recognition) {
            _startSpeechRecognition(session);
        }
        return true;
    }

    /**
     * 每 25ms 一幀：人聲判定與流程推進
     */
    function _tick(session) {
        if (session.resolved) return;
        const now = Date.now();
        const a = _readFrame();
        const cb = session.callbacks;
        const sens = session.sens;

        if (a.rms > session.peakLevel) session.peakLevel = a.rms;

        // 系統正在播 TTS（如「請大聲唸」）：喇叭放出的合成人聲也有基頻，必須排除
        if (global.speechSynthesis && global.speechSynthesis.speaking) session.ttsUntil = now + TTS_TAIL_MS;
        if (now < session.ttsUntil) {
            hudLevel = 0; hudVoiced = false;
            session.voicedRun = 0; session.lastF0 = 0;
            return;
        }
        const loud = a.rms > session.gate;

        // 人聲判定：夠大聲 + 基頻在人聲範圍 + 週期清晰 + 非衰減餘響 + 基頻不亂跳
        let voiced = classifyFrame(a, session.gate, sens, session.voiceConfirmed);
        if (voiced && session.lastF0 && Math.abs(a.f0 - session.lastF0) / session.lastF0 > F0_JITTER_MAX) {
            voiced = false;
        }

        if (voiced) {
            session.voicedRun++;
            session.voicedMs += FRAME_MS;
            session.lastVoicedAt = now;
            session.lastF0 = a.f0;
            if (!session.voiceConfirmed && session.voicedRun >= sens.confirmFrames) {
                session.voiceConfirmed = true;
                _hudSetText('👂 聽到你的聲音了！');
                if (cb.onVoiceDetected) cb.onVoiceDetected();
            }
        } else {
            session.voicedRun = 0;
            if (!loud) session.lastF0 = 0;
            if (loud) session.loudMs += FRAME_MS;
        }

        // HUD 與即時回報
        hudLevel = Math.min(1, a.rms / Math.max(session.gate * 6, 0.02));
        hudVoiced = voiced;
        if (!session.voiceConfirmed && session.loudMs >= NOISE_ONLY_MS && !voiced) {
            _hudSetText('🔊 那不是說話聲喔，用嘴巴說說看');
        }
        if (cb.onVoiceLevel) cb.onVoiceLevel({ level: hudLevel, voiced: voiced, voicedMs: session.voicedMs });
        if (cb.onVoiceDuration && session.voiceConfirmed) cb.onVoiceDuration(session.voicedMs);

        // 鼓勵模式：發聲夠長就立即過關，不等辨識引擎
        if (session.passMode === 'voice' && session.voiceConfirmed && session.voicedMs >= session.minVoicedMs) {
            _end(session, 'voice');
            return;
        }

        // 說完了：靜音超過 SILENCE_END_MS → 叫辨識引擎收尾，最多再等 ASR_GRACE_MS
        if (session.voiceConfirmed && !session.speechEnded && now - session.lastVoicedAt > SILENCE_END_MS) {
            session.speechEnded = true;
            if (cb.onSpeechEnd) cb.onSpeechEnd();
            if (recognitionSupported && recognition && !session.asrStopRequested) {
                session.asrStopRequested = true;
                try { recognition.stop(); } catch (e) { /* ignore */ }
                session.graceTimer = setTimeout(() => _end(session, 'evaluate'), ASR_GRACE_MS);
            } else {
                _end(session, 'evaluate');
            }
        }
    }

    /**
     * Web Speech API
     */
    function _startSpeechRecognition(session) {
        recognition.lang = 'zh-TW';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;

        recognition.onstart = () => console.log('🎤 語音辨識已啟動');

        recognition.onresult = (event) => {
            if (session.resolved) return;
            const match = _findBestMatch(event.results, session.target);
            if (match.similarity > session.best.similarity) session.best = match;

            const last = event.results[event.results.length - 1];
            const latestText = last[0].transcript.trim();
            if (latestText && !_isSystemVoice(latestText)) {
                session.lastTranscript = latestText;
                if (!last.isFinal && session.callbacks.onInterim) session.callbacks.onInterim(latestText);
            }

            // 辨識明確命中 → 立即結束（不用等說完）
            const sim = session.best.similarity;
            if (session.best.transcript && sim > 0) {
                const strong = sim >= ASR_STRONG_SIM;
                const passesCfg = typeof passesSimilarityThreshold === 'function'
                    ? passesSimilarityThreshold(sim) : sim >= session.threshold;
                if (session.passMode === 'speech' ? passesCfg : (strong || (session.passMode === 'hybrid' && passesCfg))) {
                    // voice 模式仍要求有人聲，避免電視聲直接過關
                    if (session.passMode !== 'voice' || session.voiceConfirmed || strong) {
                        _end(session, 'asr');
                        return;
                    }
                }
            }
            if (last.isFinal) {
                console.log(`📝 最終辨識: "${latestText}" (最佳: "${session.best.transcript}" ${session.best.similarity.toFixed(0)})`);
                // 已說完且最終結果不過關 → 不再等待
                if (session.speechEnded) _end(session, 'evaluate');
            }
        };

        recognition.onerror = (event) => {
            if (event.error === 'aborted' || event.error === 'no-speech') return;
            console.warn('⚠️ 語音辨識錯誤:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
                _end(session, 'error', event.error);
            }
        };

        recognition.onend = () => {
            if (session.resolved) return;
            if (session.asrStopRequested) {
                // 我們主動叫停的：結果都到了，直接判定
                _end(session, 'evaluate');
                return;
            }
            // 引擎自己結束（常見於單音節無結果）→ 若還在聆聽就重啟
            if (isListening) {
                try { recognition.start(); console.log('🔄 重啟語音辨識'); }
                catch (e) { /* 等 VAD/超時處理 */ }
            }
        };

        try { recognition.start(); }
        catch (e) { console.error('啟動語音辨識失敗:', e); }
    }

    /**
     * 綜合判定
     */
    function _evaluate(s) {
        const sim = s.best.similarity || 0;
        const hasText = !!s.best.transcript && sim > 0;
        const voiceOk = s.voiceConfirmed && s.voicedMs >= s.minVoicedMs;
        const passesCfg = hasText && (typeof passesSimilarityThreshold === 'function'
            ? passesSimilarityThreshold(sim) : sim >= s.threshold);

        let passed = false, basis = 'none';
        if (s.passMode === 'speech') {
            if (passesCfg) { passed = true; basis = 'asr'; }
        } else {
            if (voiceOk) { passed = true; basis = 'voice'; }
            else if (hasText && sim >= ASR_STRONG_SIM) { passed = true; basis = 'asr'; } // 安全閥：VAD 漏掉但辨識明確
            else if (s.passMode === 'hybrid' && passesCfg) { passed = true; basis = 'asr'; }
        }
        return { passed: passed, basis: basis, hasText: hasText, voiceOk: voiceOk };
    }

    /**
     * 結束會話並回報
     */
    function _end(session, reason, errorCode) {
        if (session.resolved) return;
        session.resolved = true;

        clearInterval(session.frameTimer);
        clearTimeout(session.timeout);
        clearTimeout(session.graceTimer);
        _stopRecording();
        if (recognition && recognitionSupported) {
            try { recognition.abort(); } catch (e) { /* ignore */ }
        }
        isListening = false;
        currentSession = null;

        const cb = session.callbacks;
        const noiseOnly = !session.voiceConfirmed && session.loudMs >= NOISE_ONLY_MS;
        const base = {
            transcript: session.best.transcript || '',
            similarity: session.best.similarity || 0,
            hadVoice: session.voiceConfirmed,
            hasVoice: session.voiceConfirmed,     // shooting.html 用此名
            voiceDuration: session.voicedMs,
            voicedMs: session.voicedMs,
            noiseOnly: noiseOnly,
            peakLevel: session.peakLevel,
            elapsedMs: Date.now() - session.startTime
        };

        if (reason === 'error') {
            _hudHide();
            if (cb.onError) cb.onError(errorCode);
            return;
        }
        if (reason === 'stopped') { _hudHide(); return; }

        const ev = _evaluate(session);
        // 'voice' / 'asr' 是即時通過路徑；'evaluate' / 'timeout' 走綜合判定
        const passed = (reason === 'voice' || reason === 'asr') ? true : ev.passed;
        const basis = reason === 'voice' ? 'voice' : reason === 'asr' ? 'asr' : ev.basis;

        console.log(`📊 結束 reason=${reason} passed=${passed} basis=${basis} ` +
                    `文字="${base.transcript}" 相似=${base.similarity.toFixed(0)} ` +
                    `人聲=${session.voiceConfirmed} 發聲=${session.voicedMs}ms/${session.minVoicedMs}ms ` +
                    `雜音=${session.loudMs}ms 耗時=${base.elapsedMs}ms`);

        isProcessing = true;
        try {
            if (passed) {
                _hudSetText('✅ 很棒！'); _hudHide(900);
                if (cb.onResult) cb.onResult(Object.assign({ passed: true, basis: basis }, base));
            } else if (session.voiceConfirmed) {
                // 有說話，但不對／聽不清 → 交給遊戲顯示錯誤與回放
                _hudSetText('🤔 有聽到，再說清楚一點'); _hudHide(900);
                if (cb.onResult) cb.onResult(Object.assign({ passed: false, basis: 'none' }, base));
            } else {
                // 完全沒有人聲（含只有敲打聲）
                _hudSetText(noiseOnly ? '🔊 那不是說話聲，用嘴巴說說看' : '🔇 沒聽到聲音，再試一次');
                _hudHide(1400);
                if (cb.onTimeout) cb.onTimeout(base);
                else if (cb.onResult) cb.onResult(Object.assign({ passed: false, basis: 'none' }, base));
            }
        } finally {
            isProcessing = false;
        }
    }

    function stopListening() {
        if (currentSession && !currentSession.resolved) _end(currentSession, 'stopped');
        isListening = false;
        isProcessing = false;
        _hudHide();
    }

    function resetState() {
        if (currentSession && !currentSession.resolved) {
            clearInterval(currentSession.frameTimer);
            clearTimeout(currentSession.timeout);
            clearTimeout(currentSession.graceTimer);
            currentSession.resolved = true;
        }
        isListening = false;
        isProcessing = false;
        currentSession = null;
        _hudHide();
    }

    // ==========================================
    // 工具
    // ==========================================
    function isSupported() {
        return !!(global.SpeechRecognition || global.webkitSpeechRecognition);
    }

    /** 舊版相容：byte 頻譜平均音量 */
    function getAudioLevel() {
        if (!analyser || !byteBuf) return 0;
        analyser.getByteFrequencyData(byteBuf);
        let sum = 0;
        for (let i = 0; i < byteBuf.length; i++) sum += byteBuf[i];
        const avg = sum / byteBuf.length;
        noiseFloor = avg; // 讓 getNoiseFloor 仍有意義
        return avg;
    }

    /** 即時人聲狀態（給麥克風測試頁／進階用途） */
    function getVoiceState() {
        if (!analyser) return { rms: 0, clarity: 0, f0: 0, decay: 0, gate: _gate(), voiced: false };
        const a = _readFrame();
        const s = _sensitivity();
        const voiced = classifyFrame(a, _gate(), s, false);
        return { rms: a.rms, clarity: a.clarity, f0: a.f0, decay: a.decay, gate: _gate(), noiseRms: noiseRms, voiced: voiced };
    }

    function getThresholdLabel() {
        const t = _threshold();
        if (t === 0) return '鼓勵模式';
        if (t <= 30) return '簡單';
        if (t <= 50) return '練習';
        if (t <= 70) return '標準';
        if (t <= 90) return '挑戰';
        return '精準';
    }

    function getPromptText(text) {
        const len = text ? text.length : 0;
        if (len <= 1) return { display: '按麥克風，大聲唸 🎤', speak: '請大聲唸' };
        if (len <= 3) return { display: '按麥克風，跟著唸 🎤', speak: '請跟著唸' };
        return { display: '按麥克風，唸出來 🎤', speak: '請唸出來' };
    }

    function setHud(on) { hudEnabled = !!on; if (!on) _hudHide(); }

    // ==========================================
    // 公開 API（與 v4 相容）
    // ==========================================
    global.SpeechModule = {
        init: init,
        startListening: startListening,
        stopListening: stopListening,
        resetState: resetState,

        isListening: function () { return isListening; },
        isProcessing: function () { return isProcessing; },
        isSupported: isSupported,

        playRecording: playRecording,
        hasRecording: hasRecording,
        speak: speak,

        getThresholdLabel: getThresholdLabel,
        getPromptText: getPromptText,
        isSingleSyllable: isSingleSyllable,

        getAudioLevel: getAudioLevel,
        getNoiseFloor: function () { return noiseFloor; },
        getVoiceState: getVoiceState,
        setHud: setHud,

        // 純函數，供測試
        __dsp: { analyzeFrame: analyzeFrame, classifyFrame: classifyFrame, minVoicedMs: minVoicedMs,
                 F0_MIN: F0_MIN, F0_MAX: F0_MAX, DECAY_MAX: DECAY_MAX, SENSITIVITY: SENSITIVITY }
    };
})(typeof window !== 'undefined' ? window : globalThis);
