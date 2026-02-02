/**
 * 語音辨識共用模組
 * 包含 VAD（語音活動偵測）和 Web Speech API 整合
 * 針對失語症患者優化
 */

// VAD（語音活動偵測）相關變數
let vadAudioContext = null;
let vadAnalyser = null;
let vadMicrophone = null;
let vadInterval = null;
let vadHasDetectedVoice = false;
let vadVoiceStartTime = null;
const VAD_THRESHOLD = 35;      // 音量門檻（0-255），避免風扇聲誤觸發
const VAD_MIN_VOICE_DURATION = 200; // 最少要持續 200ms 才算有效聲音

// 語音辨識相關變數
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

/**
 * 初始化 VAD（語音活動偵測）
 */
async function initSharedVAD() {
    if (vadAudioContext) return true;

    try {
        vadAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        vadMicrophone = vadAudioContext.createMediaStreamSource(stream);
        vadAnalyser = vadAudioContext.createAnalyser();
        vadAnalyser.fftSize = 256;
        vadAnalyser.smoothingTimeConstant = 0.5;
        vadMicrophone.connect(vadAnalyser);
        console.log('✅ VAD 初始化成功');
        return true;
    } catch (error) {
        console.error('VAD 初始化失敗:', error);
        return false;
    }
}

/**
 * 開始 VAD 偵測
 */
function startSharedVAD() {
    if (!vadAnalyser) return;

    vadHasDetectedVoice = false;
    vadVoiceStartTime = null;

    const dataArray = new Uint8Array(vadAnalyser.frequencyBinCount);

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
            if (!vadVoiceStartTime) {
                vadVoiceStartTime = Date.now();
            } else if (Date.now() - vadVoiceStartTime > VAD_MIN_VOICE_DURATION && !vadHasDetectedVoice) {
                // 聲音持續超過門檻，確認有效
                vadHasDetectedVoice = true;
                if (onVoiceDetectedCallback) {
                    onVoiceDetectedCallback();
                }
            }
        } else {
            // 沒有聲音，重置計時
            vadVoiceStartTime = null;
        }
    }, 50); // 每 50ms 檢查一次
}

/**
 * 停止 VAD 偵測
 */
function stopSharedVAD() {
    if (vadInterval) {
        clearInterval(vadInterval);
        vadInterval = null;
    }
}

/**
 * 根據內容長度決定聆聽時間（為失語症患者延長時間）
 * @param {string} text - 要辨識的文字
 * @returns {number} 聆聽時間（毫秒）
 */
function getListenDuration(text) {
    if (!text) return 8000;
    const len = text.length;
    // 單字需要唸 2-3 次，所以給更多時間
    if (len === 1) return 8000;      // 單字：8秒（要唸2-3次）
    // 詞語/句子只需唸一次
    if (len <= 3) return 6000;       // 2-3字：6秒
    if (len <= 6) return 8000;       // 4-6字：8秒
    return 10000;                     // 更長：10秒
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

    if (onResultCallback) {
        onResultCallback(transcript);
    }
}

/**
 * 開始聆聽
 * @param {string} targetText - 目標文字（用於決定聆聽時間）
 * @param {object} callbacks - 回調函數 { onVoiceDetected, onResult, onTimeout, onError }
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

    // 重置狀態
    sharedCurrentTarget = targetText || '';
    sharedLastTranscript = '';
    sharedHasReceivedResult = false;
    vadHasDetectedVoice = false;

    // 啟動 VAD
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

// 匯出給全域使用
window.SpeechModule = {
    initVAD: initSharedVAD,
    initRecognition: initSharedRecognition,
    startListening: startSharedListening,
    stopListening: stopSharedListening,
    resetState: resetSharedRecognitionState,
    setProcessing: setSharedProcessing,
    isRecognizing: isSharedRecognizing,
    isFailed: isSharedRecognitionFailed,
    getListenDuration: getListenDuration,
    getPromptByLength: getPromptByLength
};
