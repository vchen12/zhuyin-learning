/**
 * 注音學習樂園 - 全域配置檔
 * v3.1.0
 */

const APP_CONFIG = {
    // 版本資訊
    version: '3.6.0',

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
 * 取得使用者名稱
 * @returns {string} 使用者名稱，如果未設定則返回空字串
 */
function getUserName() {
    return localStorage.getItem('userName') || '';
}

/**
 * 取得自訂字詞列表
 * @param {string} category - 分類：'all', 'daily', 'family', 'place', 'sentence'
 * @returns {Array} 自訂字詞陣列
 */
function getCustomWords(category = 'all') {
    const customWords = JSON.parse(localStorage.getItem('customWords') || '[]');
    if (category === 'all') {
        return customWords;
    }
    return customWords.filter(w => w.category === category);
}

/**
 * 取得帶有使用者名稱的隨機鼓勵語
 * @param {string} type - 類型：'correct', 'wrong', 'milestone'
 * @returns {string} 鼓勵語（如有設定名稱，會加入名稱）
 */
function getEncouragement(type = 'correct') {
    const phrases = APP_CONFIG.encouragements[type] || APP_CONFIG.encouragements.correct;
    const phrase = phrases[Math.floor(Math.random() * phrases.length)];
    const userName = getUserName();

    if (!userName) {
        return phrase;
    }

    // 隨機決定名稱的位置
    const patterns = [
        `${userName}，${phrase}`,      // 小乖，太棒了！
        `${phrase.replace('！', '')}，${userName}！`,  // 太棒了，小乖！
        `${userName} ${phrase}`        // 小乖 太棒了！
    ];

    return patterns[Math.floor(Math.random() * patterns.length)];
}

/**
 * 取得隨機鼓勵語（不含名稱）
 * @param {string} type - 類型：'correct', 'wrong', 'milestone'
 * @returns {string} 鼓勵語
 */
function getEncouragementSimple(type = 'correct') {
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

// ============================================
// 語音相似度追蹤系統 - 用於失語症患者復健紀錄
// ============================================

/**
 * 取得語音相似度過關門檻
 * @returns {number} 0-100 的數值，0 表示只要有發聲就過關
 */
function getSimilarityThreshold() {
    return parseInt(localStorage.getItem('similarityThreshold') || '0');
}

/**
 * 設定語音相似度過關門檻
 * @param {number} threshold - 0-100 的數值
 */
function setSimilarityThreshold(threshold) {
    localStorage.setItem('similarityThreshold', Math.max(0, Math.min(100, threshold)).toString());
}

/**
 * 計算兩個字串的相似度（Levenshtein 距離為基礎）
 * @param {string} str1 - 第一個字串（使用者發音辨識結果）
 * @param {string} str2 - 第二個字串（標準答案）
 * @returns {number} 0-100 的相似度百分比
 */
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    // 清理字串：移除空白和標點
    const clean1 = str1.replace(/[\s。，！？、]/g, '');
    const clean2 = str2.replace(/[\s。，！？、]/g, '');

    if (clean1 === clean2) return 100;
    if (clean1.length === 0 || clean2.length === 0) return 0;

    // 方法1：字元匹配度
    const chars1 = clean1.split('');
    const chars2 = clean2.split('');
    let matches = 0;

    for (const char of chars1) {
        if (chars2.includes(char)) matches++;
    }

    const charSimilarity = (matches / Math.max(chars1.length, chars2.length)) * 100;

    // 方法2：包含關係加分
    let containsBonus = 0;
    if (clean1.includes(clean2) || clean2.includes(clean1)) {
        containsBonus = 30;
    }

    // 方法3：Levenshtein 距離
    const matrix = [];
    const len1 = clean1.length;
    const len2 = clean2.length;

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = clean1[i - 1] === clean2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }

    const levenshteinSimilarity = (1 - matrix[len1][len2] / Math.max(len1, len2)) * 100;

    // 綜合計算：取最高分
    return Math.min(100, Math.max(charSimilarity, levenshteinSimilarity) + containsBonus);
}

/**
 * 取得所有發音紀錄
 * @returns {Object} 發音紀錄物件
 */
function getPronunciationRecords() {
    return JSON.parse(localStorage.getItem('pronunciationRecords') || '{}');
}

/**
 * 記錄一次發音練習
 * @param {string} type - 類型：'zhuyin'（注音）, 'word'（字詞）, 'number'（數字）, 'sentence'（句子）
 * @param {string} target - 目標發音（標準答案）
 * @param {string} transcript - 使用者實際發音（辨識結果）
 * @param {number} similarity - 相似度 0-100
 */
function recordPronunciation(type, target, transcript, similarity) {
    const records = getPronunciationRecords();
    const timestamp = new Date().toISOString();
    const userName = getUserName() || '未命名使用者';

    // 確保類型分類存在
    if (!records[type]) {
        records[type] = {};
    }

    // 確保目標項目存在
    if (!records[type][target]) {
        records[type][target] = {
            bestScore: 0,
            attempts: 0,
            history: []
        };
    }

    const item = records[type][target];

    // 更新最佳分數
    if (similarity > item.bestScore) {
        item.bestScore = similarity;
    }

    // 增加嘗試次數
    item.attempts++;

    // 記錄歷史（最多保留 50 筆）
    item.history.unshift({
        timestamp,
        transcript,
        similarity,
        userName
    });

    if (item.history.length > 50) {
        item.history = item.history.slice(0, 50);
    }

    // 儲存
    localStorage.setItem('pronunciationRecords', JSON.stringify(records));

    return {
        bestScore: item.bestScore,
        attempts: item.attempts,
        currentScore: similarity
    };
}

/**
 * 取得特定項目的發音紀錄
 * @param {string} type - 類型
 * @param {string} target - 目標發音
 * @returns {Object|null} 發音紀錄
 */
function getPronunciationRecord(type, target) {
    const records = getPronunciationRecords();
    return records[type]?.[target] || null;
}

/**
 * 取得發音統計報告
 * @returns {Object} 統計報告
 */
function getPronunciationReport() {
    const records = getPronunciationRecords();
    const report = {
        summary: {
            totalItems: 0,
            totalAttempts: 0,
            averageBestScore: 0,
            excellentCount: 0,  // >= 90
            goodCount: 0,       // >= 70
            needsWorkCount: 0   // < 70
        },
        byType: {},
        needsImprovement: [],  // 需要加強的項目
        recentProgress: []      // 最近進步的項目
    };

    let totalBestScore = 0;

    for (const [type, items] of Object.entries(records)) {
        report.byType[type] = {
            count: 0,
            attempts: 0,
            averageBestScore: 0,
            items: []
        };

        let typeTotal = 0;

        for (const [target, data] of Object.entries(items)) {
            report.summary.totalItems++;
            report.summary.totalAttempts += data.attempts;
            totalBestScore += data.bestScore;
            typeTotal += data.bestScore;

            report.byType[type].count++;
            report.byType[type].attempts += data.attempts;

            const itemInfo = {
                target,
                bestScore: data.bestScore,
                attempts: data.attempts,
                lastAttempt: data.history[0]?.timestamp || null
            };

            report.byType[type].items.push(itemInfo);

            // 分類
            if (data.bestScore >= 90) {
                report.summary.excellentCount++;
            } else if (data.bestScore >= 70) {
                report.summary.goodCount++;
            } else {
                report.summary.needsWorkCount++;
                report.needsImprovement.push({
                    type,
                    target,
                    bestScore: data.bestScore,
                    attempts: data.attempts
                });
            }

            // 檢查最近進步
            if (data.history.length >= 2) {
                const recent = data.history[0].similarity;
                const previous = data.history[1].similarity;
                if (recent > previous) {
                    report.recentProgress.push({
                        type,
                        target,
                        improvement: recent - previous,
                        currentScore: recent
                    });
                }
            }
        }

        if (report.byType[type].count > 0) {
            report.byType[type].averageBestScore = Math.round(typeTotal / report.byType[type].count);
        }
    }

    if (report.summary.totalItems > 0) {
        report.summary.averageBestScore = Math.round(totalBestScore / report.summary.totalItems);
    }

    // 排序需要加強的項目（分數低的排前面）
    report.needsImprovement.sort((a, b) => a.bestScore - b.bestScore);

    // 排序最近進步的項目（進步多的排前面）
    report.recentProgress.sort((a, b) => b.improvement - a.improvement);

    return report;
}

/**
 * 清除所有發音紀錄
 */
function clearPronunciationRecords() {
    localStorage.removeItem('pronunciationRecords');
}

/**
 * 匯出發音紀錄為 JSON
 * @returns {string} JSON 字串
 */
function exportPronunciationRecords() {
    const records = getPronunciationRecords();
    const report = getPronunciationReport();
    const userName = getUserName();

    return JSON.stringify({
        exportDate: new Date().toISOString(),
        userName: userName || '未命名使用者',
        report,
        records
    }, null, 2);
}

/**
 * 檢查是否通過相似度門檻
 * @param {number} similarity - 計算出的相似度
 * @returns {boolean} 是否通過
 */
function passesSimilarityThreshold(similarity) {
    const threshold = getSimilarityThreshold();
    // 門檻為 0 時，只要有發聲就通過
    if (threshold === 0) return true;
    return similarity >= threshold;
}

/**
 * 取得相似度等級描述
 * @param {number} similarity - 相似度
 * @returns {Object} 等級資訊
 */
function getSimilarityLevel(similarity) {
    if (similarity >= 90) {
        return { level: 'excellent', label: '非常標準', emoji: '🌟', color: '#4caf50' };
    } else if (similarity >= 80) {
        return { level: 'good', label: '很好', emoji: '⭐', color: '#8bc34a' };
    } else if (similarity >= 70) {
        return { level: 'fair', label: '不錯', emoji: '👍', color: '#ffeb3b' };
    } else if (similarity >= 50) {
        return { level: 'needsWork', label: '繼續加油', emoji: '💪', color: '#ff9800' };
    } else {
        return { level: 'practice', label: '多多練習', emoji: '🎯', color: '#f44336' };
    }
}

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_CONFIG, getImagePath, getEncouragement, getEncouragementSimple,
        getUserName, getCustomWords, speak, playZhuyinSound, createFireworks,
        shuffle, getRandomItems,
        // 語音相似度追蹤系統
        getSimilarityThreshold, setSimilarityThreshold, calculateSimilarity,
        getPronunciationRecords, recordPronunciation, getPronunciationRecord,
        getPronunciationReport, clearPronunciationRecords, exportPronunciationRecords,
        passesSimilarityThreshold, getSimilarityLevel
    };
}
