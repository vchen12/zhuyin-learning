/**
 * 語音辨識共用模組 v2.0
 * 包含 VAD（語音活動偵測）、錄音回放、和 Web Speech API 整合
 * 針對失語症患者優化
 */

// ==========================================
// VAD（語音活動偵測）相關變數
// ==========================================
let vadAudioContext = null;
let vadAnalyser = null;
let vadMicrophone = null;
let vadStream = null;  // 保存 stream 供錄音使用
let vadInterval = null;
let vadHasDetectedVoice = false;
let vadVoiceStartTime = null;
let vadTotalVoiceDuration = 0;  // 累計聲音長度（毫秒）

// VAD 門檻設定（提高以過濾背景噪音）
const VAD_THRESHOLD = 50;           // 音量門檻（0-255），過濾風扇聲等背景噪音
const VAD_MIN_VOICE_DURATION = 300; // 最少要持續 300ms 才算有效聲音

// ==========================================
// 錄音相關變數
// ==========================================
let mediaRecorder = null;
let audioChunks = [];
let lastRecordedAudioUrl = null;
let isRecording = false;

// ==========================================
// 語音辨識相關變數
// ==========================================
let sharedRecognition = null;
let sharedRecognitionFailed = false;
let sharedRecognitionTimeout = null;
let sharedHasReceivedResult = false;
let sharedLastTranscript = '';
let sharedIsRecognizing = false;
let sharedIsProcessing = false;
let sharedCurrentTarget = '';  // 目前要辨識的目標文字

// 回調函數
let onVoiceDetectedCallback = null;
let onResultCallback = null;
let onTimeoutCallback = null;
let onErrorCallback = null;
let onVoiceDurationUpdateCallback = null;  // 聲音長度更新回調

// ==========================================
// 初始化函數
// ==========================================

/**
 * 初始化 VAD（語音活動偵測）和錄音功能
 */
async function initSharedVAD() {
    if (vadAudioContext && vadStream) return true;

    try {
        vadAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        vadStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        vadMicrophone = vadAudioContext.createMediaStreamSource(vadStream);
        vadAnalyser = vadAudioContext.createAnalyser();
        vadAnalyser.fftSize = 256;
        vadAnalyser.smoothingTimeConstant = 0.5;
        vadMicrophone.connect(vadAnalyser);

        // 初始化錄音器
        await initRecorder(vadStream);

        console.log('✅ VAD 和錄音功能初始化成功');
        return true;
    } catch (error) {
        console.error('VAD 初始化失敗:', error);
        return false;
    }
}

/**
 * 初始化錄音器
 */
async function initRecorder(stream) {
    try {
        // 檢查瀏覽器支援的格式
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                        MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '';

        if (mimeType) {
            mediaRecorder = new MediaRecorder(stream, { mimeType });
        } else {
            mediaRecorder = new MediaRecorder(stream);
        }

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            if (audioChunks.length > 0) {
                const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
                // 釋放之前的 URL
                if (lastRecordedAudioUrl) {
                    URL.revokeObjectURL(lastRecordedAudioUrl);
                }
                lastRecordedAudioUrl = URL.createObjectURL(audioBlob);
                console.log('✅ 錄音已儲存');
            }
        };

        console.log('✅ 錄音器初始化成功，格式:', mediaRecorder.mimeType);
        return true;
    } catch (error) {
        console.error('錄音器初始化失敗:', error);
        return false;
    }
}

// ==========================================
// VAD 偵測函數
// ==========================================

/**
 * 開始 VAD 偵測和錄音
 */
function startSharedVAD() {
    if (!vadAnalyser) return;

    vadHasDetectedVoice = false;
    vadVoiceStartTime = null;
    vadTotalVoiceDuration = 0;

    // 開始錄音
    startRecording();

    const dataArray = new Uint8Array(vadAnalyser.frequencyBinCount);
    let lastVoiceTime = null;

    vadInterval = setInterval(() => {
        vadAnalyser.getByteFrequencyData(dataArray);

        // 計算平均音量
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        const average = sum / dataArray.length;

        // 偵測到聲音
        if (average > VAD_THRESHOLD) {
            const now = Date.now();

            if (!vadVoiceStartTime) {
                vadVoiceStartTime = now;
            }

            // 累計聲音長度
            if (lastVoiceTime) {
                vadTotalVoiceDuration += (now - lastVoiceTime);
            }
            lastVoiceTime = now;

            // 聲音持續超過門檻，確認有效
            if (now - vadVoiceStartTime > VAD_MIN_VOICE_DURATION && !vadHasDetectedVoice) {
                vadHasDetectedVoice = true;
                if (onVoiceDetectedCallback) {
                    onVoiceDetectedCallback();
                }
            }

            // 回報聲音長度更新
            if (onVoiceDurationUpdateCallback) {
                onVoiceDurationUpdateCallback(vadTotalVoiceDuration);
            }
        } else {
            // 沒有聲音，但保留累計的長度
            lastVoiceTime = null;
            // 不重置 vadVoiceStartTime，只有在連續靜音超過一定時間才重置
        }
    }, 50); // 每 50ms 檢查一次
}

/**
 * 停止 VAD 偵測和錄音
 */
function stopSharedVAD() {
    if (vadInterval) {
        clearInterval(vadInterval);
        vadInterval = null;
    }
    // 停止錄音
    stopRecording();
}

// ==========================================
// 錄音控制函數
// ==========================================

/**
 * 開始錄音
 */
function startRecording() {
    if (!mediaRecorder) return;

    audioChunks = [];
    if (mediaRecorder.state === 'inactive') {
        try {
            mediaRecorder.start();
            isRecording = true;
            console.log('🎙️ 開始錄音');
        } catch (error) {
            console.error('開始錄音失敗:', error);
        }
    }
}

/**
 * 停止錄音
 */
function stopRecording() {
    if (!mediaRecorder) return;

    if (mediaRecorder.state === 'recording') {
        try {
            mediaRecorder.stop();
            isRecording = false;
            console.log('⏹️ 停止錄音');
        } catch (error) {
            console.error('停止錄音失敗:', error);
        }
    }
}

/**
 * 回放上次錄音
 * @returns {Promise} 播放完成的 Promise
 */
function playbackRecording() {
    return new Promise((resolve, reject) => {
        if (!lastRecordedAudioUrl) {
            console.log('沒有可回放的錄音');
            resolve();
            return;
        }

        const audio = new Audio(lastRecordedAudioUrl);
        audio.onended = () => {
            console.log('🔊 錄音回放完成');
            resolve();
        };
        audio.onerror = (error) => {
            console.error('錄音回放失敗:', error);
            resolve(); // 即使失敗也繼續
        };

        console.log('🔊 開始回放錄音');
        audio.play().catch(error => {
            console.error('無法播放錄音:', error);
            resolve();
        });
    });
}

/**
 * 檢查是否有錄音可回放
 */
function hasRecording() {
    return !!lastRecordedAudioUrl;
}

// ==========================================
// 聆聽時間和聲音長度計算
// ==========================================

/**
 * 根據內容長度決定聆聽時間（為失語症患者適度延長）
 * @param {string} text - 要辨識的文字
 * @returns {number} 聆聽時間（毫秒）
 */
function getListenDuration(text) {
    if (!text) return 10000;
    const len = text.length;
    // 單字需要唸 2-3 次，所以給更多時間
    if (len === 1) return 10000;     // 單字：10秒（唸2-3次）
    // 詞語/句子
    if (len <= 3) return 8000;       // 2-3字：8秒
    if (len <= 6) return 10000;      // 4-6字：10秒
    if (len <= 10) return 12000;     // 7-10字：12秒
    return 15000;                     // 更長：15秒
}

/**
 * 計算目標文字需要的最小聲音長度
 * @param {string} text - 目標文字
 * @returns {number} 最小聲音長度（毫秒）
 */
function getMinVoiceDuration(text) {
    if (!text) return 500;
    // 每個字至少需要 0.4 秒（考慮失語症患者可能說得較慢）
    return Math.max(400, text.length * 400);
}

/**
 * 檢查聲音長度是否足夠
 * @param {string} targetText - 目標文字
 * @returns {boolean} 是否足夠
 */
function isVoiceDurationSufficient(targetText) {
    const minDuration = getMinVoiceDuration(targetText);
    return vadTotalVoiceDuration >= minDuration;
}

/**
 * 取得目前累計的聲音長度
 * @returns {number} 聲音長度（毫秒）
 */
function getVoiceDuration() {
    return vadTotalVoiceDuration;
}

/**
 * 根據內容長度取得提示文字
 * @param {string} text - 要辨識的文字
 * @returns {object} { display: 顯示文字, speak: 語音文字 }
 */
function getPromptByLength(text) {
    const len = text ? text.length : 0;
    if (len <= 1) {
        return {
            display: '請唸 2~3 次！🎤',
            speak: '請唸兩到三次'
        };
    } else {
        return {
            display: '請跟著唸！🎤',
            speak: '請跟著唸'
        };
    }
}

// ==========================================
// 語音辨識核心函數
// ==========================================

/**
 * 初始化語音辨識
 */
function initSharedRecognition() {
    if (sharedRecognition) return true;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.error('瀏覽器不支援語音辨識');
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    sharedRecognition = new SpeechRecognition();
    sharedRecognition.lang = 'zh-TW';
    sharedRecognition.continuous = true;
    sharedRecognition.interimResults = true;
    sharedRecognition.maxAlternatives = 5;

    sharedRecognition.onstart = () => {
        sharedIsRecognizing = true;
        sharedHasReceivedResult = false;
        sharedLastTranscript = '';
        console.log('🎤 辨識已啟動');

        // 設定超時
        const listenDuration = getListenDuration(sharedCurrentTarget);
        sharedRecognitionTimeout = setTimeout(() => {
            if (sharedIsRecognizing && !sharedHasReceivedResult) {
                console.log('辨識超時，停止');
                try { sharedRecognition.stop(); } catch(e) {}
            }
        }, listenDuration);
    };

    sharedRecognition.onaudiostart = () => {
        console.log('onaudiostart');
    };

    sharedRecognition.onspeechstart = () => {
        console.log('onspeechstart');
    };

    sharedRecognition.onspeechend = () => {
        console.log('onspeechend');
    };

    sharedRecognition.onresult = (event) => {
        const lastResult = event.results[event.results.length - 1];
        const transcript = lastResult[0].transcript.trim();
        const isFinal = lastResult.isFinal;

        console.log('onresult:', transcript, 'isFinal:', isFinal);

        if (sharedHasReceivedResult || sharedIsProcessing) {
            return;
        }

        // 過濾掉系統語音
        if (transcript.includes('請跟著') || transcript.includes('跟著唸') ||
            transcript.includes('請唸') || transcript.includes('兩到三次') ||
            transcript.includes('2到3次')) {
            console.log('過濾系統語音:', transcript);
            return;
        }

        if (transcript) {
            sharedLastTranscript = transcript;
            processSharedResult(transcript, isFinal ? 'final' : 'immediate');
        }
    };

    sharedRecognition.onerror = (event) => {
        clearTimeout(sharedRecognitionTimeout);
        console.error('語音辨識錯誤:', event.error);

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
            sharedRecognitionFailed = true;
            sharedIsRecognizing = false;
            if (onErrorCallback) {
                onErrorCallback(event.error);
            }
        }
    };

    sharedRecognition.onend = () => {
        clearTimeout(sharedRecognitionTimeout);
        stopSharedVAD();
        const wasRecognizing = sharedIsRecognizing;
        sharedIsRecognizing = false;

        console.log('recognition.onend - wasRecognizing:', wasRecognizing, 'hasReceivedResult:', sharedHasReceivedResult);

        if (sharedHasReceivedResult || sharedIsProcessing) {
            return;
        }

        if (sharedRecognitionFailed) {
            return;
        }

        if (sharedLastTranscript && wasRecognizing) {
            processSharedResult(sharedLastTranscript, 'onend');
        } else if (wasRecognizing && onTimeoutCallback) {
            onTimeoutCallback();
        }
    };

    return true;
}

/**
 * 處理辨識結果
 */
function processSharedResult(transcript, source) {
    if (sharedHasReceivedResult || sharedIsProcessing) return;

    sharedHasReceivedResult = true;
    clearTimeout(sharedRecognitionTimeout);
    stopSharedVAD();
    try { sharedRecognition.stop(); } catch(e) {}
    sharedIsRecognizing = false;
    console.log(`辨識結果 (${source}):`, transcript);
    console.log(`累計聲音長度: ${vadTotalVoiceDuration}ms`);

    if (onResultCallback) {
        onResultCallback(transcript);
    }
}

/**
 * 開始聆聽
 * @param {string} targetText - 目標文字（用於決定聆聽時間）
 * @param {object} callbacks - 回調函數 { onVoiceDetected, onResult, onTimeout, onError, onVoiceDurationUpdate }
 */
function startSharedListening(targetText, callbacks = {}) {
    if (sharedIsRecognizing) {
        console.log('已經在辨識中，跳過');
        return false;
    }
    if (sharedIsProcessing) {
        console.log('正在處理結果，跳過');
        return false;
    }
    if (!sharedRecognition) {
        if (!initSharedRecognition()) {
            console.log('無法初始化語音辨識');
            return false;
        }
    }

    // 設定回調
    onVoiceDetectedCallback = callbacks.onVoiceDetected || null;
    onResultCallback = callbacks.onResult || null;
    onTimeoutCallback = callbacks.onTimeout || null;
    onErrorCallback = callbacks.onError || null;
    onVoiceDurationUpdateCallback = callbacks.onVoiceDurationUpdate || null;

    // 重置狀態
    sharedCurrentTarget = targetText || '';
    sharedLastTranscript = '';
    sharedHasReceivedResult = false;
    vadHasDetectedVoice = false;
    vadTotalVoiceDuration = 0;

    // 啟動 VAD（會同時開始錄音）
    startSharedVAD();

    try {
        console.log('🚀 啟動語音辨識...');
        sharedRecognition.start();
        return true;
    } catch (error) {
        console.error('啟動辨識失敗:', error);
        sharedIsRecognizing = false;
        stopSharedVAD();
        return false;
    }
}

/**
 * 停止聆聽
 */
function stopSharedListening() {
    clearTimeout(sharedRecognitionTimeout);
    stopSharedVAD();
    if (sharedRecognition && sharedIsRecognizing) {
        try { sharedRecognition.stop(); } catch(e) {}
    }
    sharedIsRecognizing = false;
}

/**
 * 重置狀態（用於下一題）
 */
function resetSharedRecognitionState() {
    sharedHasReceivedResult = false;
    sharedLastTranscript = '';
    sharedIsProcessing = false;
    vadHasDetectedVoice = false;
    vadTotalVoiceDuration = 0;
}

/**
 * 設定處理中狀態
 */
function setSharedProcessing(value) {
    sharedIsProcessing = value;
}

/**
 * 取得是否正在辨識
 */
function isSharedRecognizing() {
    return sharedIsRecognizing;
}

/**
 * 取得是否辨識失敗
 */
function isSharedRecognitionFailed() {
    return sharedRecognitionFailed;
}

/**
 * 取得是否已偵測到聲音
 */
function hasDetectedVoice() {
    return vadHasDetectedVoice;
}

// ==========================================
// 語音合成輔助函數
// ==========================================

/**
 * 播放語音（返回 Promise）
 * @param {string} text - 要播放的文字
 * @returns {Promise} 播放完成的 Promise
 */
function speakAsync(text) {
    return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
            resolve();
            return;
        }

        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.85;  // 稍慢一點
        utterance.pitch = 1.1;
        utterance.volume = 1.0;

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        window.speechSynthesis.speak(utterance);
    });
}

// ==========================================
// 匯出給全域使用
// ==========================================
window.SpeechModule = {
    // 初始化
    initVAD: initSharedVAD,
    initRecognition: initSharedRecognition,

    // 聆聽控制
    startListening: startSharedListening,
    stopListening: stopSharedListening,
    resetState: resetSharedRecognitionState,
    setProcessing: setSharedProcessing,

    // 狀態查詢
    isRecognizing: isSharedRecognizing,
    isFailed: isSharedRecognitionFailed,
    hasDetectedVoice: hasDetectedVoice,

    // 聆聽時間和聲音長度
    getListenDuration: getListenDuration,
    getPromptByLength: getPromptByLength,
    getMinVoiceDuration: getMinVoiceDuration,
    isVoiceDurationSufficient: isVoiceDurationSufficient,
    getVoiceDuration: getVoiceDuration,

    // 錄音功能
    playbackRecording: playbackRecording,
    hasRecording: hasRecording,

    // 語音合成
    speakAsync: speakAsync,

    // 常數（供外部參考）
    VAD_THRESHOLD: VAD_THRESHOLD,
    VAD_MIN_VOICE_DURATION: VAD_MIN_VOICE_DURATION
};
