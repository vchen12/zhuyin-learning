/**
 * 注音學習樂園 - 全域配置檔
 * v2.0.0
 */

const APP_CONFIG = {
    // 版本資訊
    version: '2.0.0',

    // 圖片模式：'private' 使用私人照片，'public' 使用公開圖庫
    imageMode: 'public',

    // 圖片路徑
    imagePaths: {
        private: '../images/private/',
        public: '../images/public/'
    },

    // 是否啟用語音辨識（某些裝置不支援）
    enableSpeechRecognition: true,

    // 是否啟用語音合成
    enableTTS: true,

    // 遊戲設定
    games: {
        // 選擇題選項數量
        choiceCount: 4,
        // 記憶遊戲配對數量
        memoryPairs: 6,
        // 賽車遊戲格數
        raceTrackLength: 10,
        // 寶物收集數量
        treasureGoal: 8
    },

    // 鼓勵語
    encouragements: {
        correct: [
            '太棒了！',
            '好厲害！',
            '答對了！',
            '真聰明！',
            '很棒喔！',
            '繼續加油！',
            '你好棒！',
            '太聰明了！',
            '完美！',
            '超級棒！'
        ],
        wrong: [
            '再試一次！',
            '沒關係，加油！',
            '慢慢來！',
            '你可以的！',
            '再想想看！'
        ],
        milestone: [
            '太厲害了！',
            '進步神速！',
            '越來越棒了！'
        ]
    }
};

/**
 * 取得圖片路徑
 * @param {string} category - 分類名稱
 * @param {string} filename - 檔案名稱
 * @returns {string} 完整圖片路徑
 */
function getImagePath(category, filename) {
    const basePath = APP_CONFIG.imagePaths[APP_CONFIG.imageMode];
    return `${basePath}${category}/${filename}`;
}

/**
 * 取得隨機鼓勵語
 * @param {string} type - 類型：'correct', 'wrong', 'milestone'
 * @returns {string} 鼓勵語
 */
function getEncouragement(type = 'correct') {
    const phrases = APP_CONFIG.encouragements[type] || APP_CONFIG.encouragements.correct;
    return phrases[Math.floor(Math.random() * phrases.length)];
}

/**
 * 語音合成
 * @param {string} text - 要說的文字
 * @param {object} options - 選項
 */
function speak(text, options = {}) {
    if (!APP_CONFIG.enableTTS || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.lang || 'zh-TW';
    utterance.rate = options.rate || 0.9;
    utterance.pitch = options.pitch || 1.1;
    window.speechSynthesis.speak(utterance);
}

/**
 * 播放注音音檔
 * @param {string} symbol - 注音符號
 * @returns {Promise} 播放完成的 Promise
 */
function playZhuyinSound(symbol) {
    const SOUND_MAP = {
        'ㄅ': 'F1', 'ㄆ': 'F2', 'ㄇ': 'F3', 'ㄈ': 'F4', 'ㄉ': 'F5',
        'ㄊ': 'F6', 'ㄋ': 'F7', 'ㄌ': 'F8', 'ㄍ': 'F9', 'ㄎ': 'F10',
        'ㄏ': 'F11', 'ㄐ': 'F12', 'ㄑ': 'F13', 'ㄒ': 'F14', 'ㄓ': 'F15',
        'ㄔ': 'F16', 'ㄕ': 'F17', 'ㄖ': 'F18', 'ㄗ': 'F19', 'ㄘ': 'F20',
        'ㄙ': 'F21', 'ㄚ': 'F22', 'ㄛ': 'F23', 'ㄜ': 'F24', 'ㄝ': 'F25',
        'ㄞ': 'F26', 'ㄟ': 'F27', 'ㄠ': 'F28', 'ㄡ': 'F29', 'ㄢ': 'F30',
        'ㄣ': 'F31', 'ㄤ': 'F32', 'ㄥ': 'F33', 'ㄦ': 'F34', 'ㄧ': 'F35',
        'ㄨ': 'F36', 'ㄩ': 'F37'
    };

    return new Promise((resolve, reject) => {
        const fileNum = SOUND_MAP[symbol];
        if (!fileNum) {
            reject(new Error('Unknown symbol'));
            return;
        }

        const audio = new Audio(`../sounds/${fileNum}.mp3`);
        audio.onended = resolve;
        audio.onerror = reject;
        audio.play().catch(reject);
    });
}

/**
 * 創建煙火效果
 * @param {number} count - 煙火數量
 * @param {HTMLElement} container - 容器元素
 */
function createFireworks(count = 20, container = null) {
    const targetContainer = container || document.getElementById('fireworks') || document.body;
    const emojis = ['✨', '🎉', '🎊', '⭐', '💫', '🌟', '🎈', '🏆'];

    for (let i = 0; i < count; i++) {
        const firework = document.createElement('div');
        firework.className = 'firework';
        firework.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        firework.style.cssText = `
            position: fixed;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            font-size: 2.5rem;
            pointer-events: none;
            z-index: 9999;
            animation: firework-explode 1s ease-out forwards;
            animation-delay: ${Math.random() * 0.5}s;
        `;
        targetContainer.appendChild(firework);
    }

    setTimeout(() => {
        targetContainer.querySelectorAll('.firework').forEach(el => el.remove());
    }, 2000);
}

/**
 * 洗牌函數
 * @param {Array} array - 要洗牌的陣列
 * @returns {Array} 洗牌後的新陣列
 */
function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

/**
 * 從陣列中隨機取得 n 個元素
 * @param {Array} array - 來源陣列
 * @param {number} n - 要取得的數量
 * @returns {Array} 隨機元素陣列
 */
function getRandomItems(array, n) {
    return shuffle(array).slice(0, n);
}

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { APP_CONFIG, getImagePath, getEncouragement, speak, playZhuyinSound, createFireworks, shuffle, getRandomItems };
}
