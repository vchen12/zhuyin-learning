/**
 * 注音學習樂園 - 全域配置檔
 * v5.4.0
 */

const APP_CONFIG = {
    // 版本資訊
    version: '5.4.0',

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

    // 公測回饋管道（feedback.html 依此顯示按鈕；空字串／null＝不顯示）
    // 開發者的聯絡資訊不會出現在介面上：使用者按「送出給開發者」，內容經 relay 直接送達。
    feedback: {
        // 自動轉送設定（擇一）：
        //   { type: 'web3forms', key: '<access key>' }
        //       → 送到註冊該 key 的信箱（key 可公開，不會洩漏信箱）。https://web3forms.com
        //   { type: 'googleForm', formId: '<e/ 後面那串>', fields: { where: 'entry.111', did: 'entry.222',
        //       saw: 'entry.333', want: 'entry.444', contact: 'entry.555', diag: 'entry.666' } }
        //       → 寫入您的 Google 表單回覆（試算表），可開啟「新回覆時寄 Email 通知」。
        relay: { type: 'web3forms', key: '607d16b7-6d49-48fd-9528-8f1fa703ceca' },
        githubRepo: 'vchen12/zhuyin-learning',   // GitHub Issues（回報者需 GitHub 帳號；repo 本來就是公開的）
        email: '',                                // 若填入會顯示「用 Email 寄出」按鈕（會露出信箱，建議留空改用 relay）
        formUrl: ''                               // 若填入會顯示「填寫回饋表單」按鈕（開新分頁）
    },

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

// ==========================================
// 共用底層（v5.4.0）：所有頁面一律使用這裡的版本，頁面內不得再各自實作
// ==========================================

/** 站台根路徑（由 config.js 的 script src 推得，供音檔等資源定位；Node 測試時為空字串） */
const APP_BASE = (function () {
    try {
        const sc = typeof document !== 'undefined' ? document.currentScript : null;
        const src = sc && sc.src ? sc.src : '';
        return src ? src.replace(/js\/config\.js(\?.*)?$/, '') : '';
    } catch (e) { return ''; }
})();

/** 注音符號 → 音檔編號（教育部《國語注音符號手冊》F1~F37） */
const ZHUYIN_SOUND_MAP = {
    'ㄅ': 'F1', 'ㄆ': 'F2', 'ㄇ': 'F3', 'ㄈ': 'F4', 'ㄉ': 'F5',
    'ㄊ': 'F6', 'ㄋ': 'F7', 'ㄌ': 'F8', 'ㄍ': 'F9', 'ㄎ': 'F10',
    'ㄏ': 'F11', 'ㄐ': 'F12', 'ㄑ': 'F13', 'ㄒ': 'F14', 'ㄓ': 'F15',
    'ㄔ': 'F16', 'ㄕ': 'F17', 'ㄖ': 'F18', 'ㄗ': 'F19', 'ㄘ': 'F20',
    'ㄙ': 'F21', 'ㄚ': 'F22', 'ㄛ': 'F23', 'ㄜ': 'F24', 'ㄝ': 'F25',
    'ㄞ': 'F26', 'ㄟ': 'F27', 'ㄠ': 'F28', 'ㄡ': 'F29', 'ㄢ': 'F30',
    'ㄣ': 'F31', 'ㄤ': 'F32', 'ㄥ': 'F33', 'ㄦ': 'F34', 'ㄧ': 'F35',
    'ㄨ': 'F36', 'ㄩ': 'F37'
};

let _zhVoiceCache = null;
function _zhVoice() {
    if (_zhVoiceCache) return _zhVoiceCache;
    try {
        const voices = speechSynthesis.getVoices();
        _zhVoiceCache = voices.find(v => /^zh[-_]TW/i.test(v.lang)) || voices.find(v => /^zh/i.test(v.lang)) || null;
    } catch (e) { _zhVoiceCache = null; }
    return _zhVoiceCache;
}

/**
 * 語音合成（唯一版本）
 * 相容兩種呼叫：speak(text, callback) 與 speak(text, { rate, pitch, volume, lang, timeoutMs })
 * - callback／Promise 只會觸發一次：onend、onerror、保險計時器三者只認第一個
 * - TTS 不可用、文字為空、被下一句打斷：都會結束流程，不會卡死
 * @returns {Promise<void>}
 */
function speak(text, a, b) {
    let callback = null, options = {};
    if (typeof a === 'function') { callback = a; options = b || {}; }
    else if (a && typeof a === 'object') { options = a; }
    return new Promise(resolve => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            try { if (callback) callback(); } catch (e) { console.error('speak callback 錯誤:', e); }
            resolve();
        };
        if (!APP_CONFIG.enableTTS || typeof speechSynthesis === 'undefined' || !text) { finish(); return; }
        try {
            speechSynthesis.cancel();   // 打斷上一句（上一句的 finish 會由其 onerror 觸發一次）
            const u = new SpeechSynthesisUtterance(String(text));
            u.lang = options.lang || 'zh-TW';
            u.rate = options.rate || 0.9;
            u.pitch = options.pitch || 1.1;
            u.volume = (options.volume !== undefined) ? options.volume : 1.0;
            const voice = _zhVoice();
            if (voice) u.voice = voice;
            u.onend = finish;
            u.onerror = finish;
            setTimeout(finish, options.timeoutMs || 8000);
            speechSynthesis.speak(u);
        } catch (e) { finish(); }
    });
}
/** 短提示（較小聲） */
function speakShort(text) { return speak(text, { volume: 0.8 }); }

let _zhuyinAudio = null;
/**
 * 播放注音音檔（唯一版本）：會停掉上一個、登記 SpeechModule.guardAudio（播放期間不算人聲）
 * @param {string} symbol - 注音符號
 * @param {function} [onDone] - 播完（或失敗／找不到）時呼叫一次
 * @returns {Promise<void>} 播完即 resolve（找不到或失敗也 resolve，不拋錯）
 */
function playZhuyinSound(symbol, onDone) {
    return new Promise(resolve => {
        let done = false;
        const finish = () => { if (done) return; done = true; try { if (onDone) onDone(); } catch (e) { console.error(e); } resolve(); };
        const fileNum = ZHUYIN_SOUND_MAP[symbol];
        if (!fileNum || typeof Audio === 'undefined') { console.warn('找不到音檔:', symbol); finish(); return; }
        try {
            if (_zhuyinAudio) { _zhuyinAudio.pause(); _zhuyinAudio.currentTime = 0; }
            const audio = new Audio(APP_BASE + 'sounds/' + fileNum + '.mp3');
            _zhuyinAudio = audio;
            if (typeof SpeechModule !== 'undefined' && SpeechModule.guardAudio) SpeechModule.guardAudio(audio);
            audio.onended = finish;
            audio.onerror = finish;
            audio.play().catch(err => { console.error('播放失敗:', err); finish(); });
        } catch (e) { finish(); }
    });
}
// 舊名稱相容（頁面若自行定義 playSound 做別的事，頁面版本會覆蓋這個）
function playSound(symbol, onDone) { return playZhuyinSound(symbol, onDone); }
function playSoundWithCallback(symbol, callback) { return playZhuyinSound(symbol, callback); }
function playSoundAsync(symbol) { return playZhuyinSound(symbol); }

/**
 * 煙火效果（唯一版本）
 * 使用頁面的 .firework 樣式；頁面沒有定義動畫時自動補上預設動畫
 * @param {number} [count=20]
 * @param {HTMLElement} [container] - 預設 #fireworks，否則 body
 */
function createFireworks(count, container) {
    if (typeof document === 'undefined') return;
    const n = (typeof count === 'number' && count > 0) ? count : 20;
    const target = container || document.getElementById('fireworks') || document.body;
    const emojis = ['✨', '🎉', '🎊', '⭐', '💫', '🌟'];
    let needFallback = false;
    for (let i = 0; i < n; i++) {
        const fw = document.createElement('div');
        fw.className = 'firework';
        fw.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        fw.style.left = Math.random() * 100 + '%';
        fw.style.top = Math.random() * 100 + '%';
        fw.style.fontSize = (2 + Math.random() * 2) + 'rem';
        fw.style.animationDelay = Math.random() * 0.5 + 's';
        fw.style.pointerEvents = 'none';
        target.appendChild(fw);
        if (i === 0) {
            const cs = getComputedStyle(fw);
            needFallback = (cs.animationName === 'none' || cs.position === 'static');
        }
        if (needFallback) {
            fw.style.position = 'fixed';
            fw.style.zIndex = '9999';
            fw.style.animation = 'fw-shared-pop 1.5s ease-out forwards';
        }
    }
    if (needFallback && !document.getElementById('fw-shared-style')) {
        const st = document.createElement('style'); st.id = 'fw-shared-style';
        st.textContent = '@keyframes fw-shared-pop{0%{transform:scale(0) rotate(0);opacity:1}50%{transform:scale(1.5) rotate(180deg);opacity:1}100%{transform:scale(0) rotate(360deg);opacity:0}}';
        document.head.appendChild(st);
    }
    setTimeout(() => { target.querySelectorAll('.firework').forEach(el => el.remove()); }, 2000);
}

/**
 * 洗牌（唯一版本）：Fisher–Yates，就地洗牌並回傳同一陣列（相容「用回傳值」與「就地」兩種呼叫）
 */
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const t = array[i]; array[i] = array[j]; array[j] = t;
    }
    return array;
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
 * 使用者模式：aphasia（失語症復健）或 child（一般兒童學習）
 */
function getUserMode() {
    return localStorage.getItem('userMode') || 'aphasia';
}

function setUserMode(mode) {
    localStorage.setItem('userMode', mode);
}

/**
 * 門檻預設等級定義
 *
 * 失語症模式：著重鼓勵發聲，門檻較低，辨識更寬鬆
 *   - 鼓勵 (0%)：有發聲即通過，適合初期連發聲都困難的患者
 *   - 起步 (20%)：輕微辨識，只要聲音大致接近就通過
 *   - 進步 (40%)：中度辨識，可辨認出大致正確的發音
 *   - 挑戰 (60%)：進階辨識，需要較清楚的發音
 *
 * 一般兒童模式：著重正確發音，門檻較高
 *   - 入門 (40%)：寬鬆辨識，適合初學者
 *   - 正常 (60%)：標準辨識，適合有基礎的兒童
 *   - 進階 (80%)：嚴格辨識，需要清楚正確的發音
 *   - 精準 (90%)：高標準，接近完全正確
 */
const THRESHOLD_PRESETS = {
    aphasia: [
        { label: '😊 鼓勵', value: 0, desc: '有發聲就通過' },
        { label: '🌱 起步', value: 20, desc: '聲音大致接近' },
        { label: '📈 進步', value: 40, desc: '發音大致正確' },
        { label: '🎯 挑戰', value: 60, desc: '發音較為清楚' }
    ],
    child: [
        { label: '📖 入門', value: 40, desc: '寬鬆辨識' },
        { label: '🎯 正常', value: 60, desc: '標準辨識' },
        { label: '⭐ 進階', value: 80, desc: '清楚正確' },
        { label: '🏆 精準', value: 90, desc: '接近完美' }
    ]
};

function getThresholdPresets() {
    return THRESHOLD_PRESETS[getUserMode()] || THRESHOLD_PRESETS.aphasia;
}

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
 * 人聲偵測靈敏度（v5.0）
 * 'high'：小聲也算（門檻低、需連續 4 幀）；'normal'：預設；'low'：吵雜環境用（門檻高、需連續 7 幀）
 * @returns {'high'|'normal'|'low'}
 */
function getVoiceSensitivity() {
    const v = localStorage.getItem('voiceSensitivity');
    return ['high', 'normal', 'low'].includes(v) ? v : 'normal';
}
function setVoiceSensitivity(v) {
    if (['high', 'normal', 'low'].includes(v)) localStorage.setItem('voiceSensitivity', v);
}

/**
 * 單音節目標（單字／注音拼寫）在門檻 > 0 時的判定方式（v5.0）
 * 'voice'：辨識命中即過；辨識無結果但確認有人聲且發聲夠長也過（預設，因 Web Speech API 對孤立音節不可靠）
 * 'strict'：完全由辨識相似度決定（會有大量誤拒，僅供進階測試）
 * @returns {'voice'|'strict'}
 */
function getSingleSyllableMode() {
    return localStorage.getItem('singleSyllableMode') === 'strict' ? 'strict' : 'voice';
}
function setSingleSyllableMode(v) {
    localStorage.setItem('singleSyllableMode', v === 'strict' ? 'strict' : 'voice');
}

/**
 * 是否顯示聆聽中的「聲音燈」HUD（v5.0）
 * @returns {boolean}
 */
function getShowVoiceHud() {
    return localStorage.getItem('showVoiceHud') !== '0';
}
function setShowVoiceHud(on) {
    localStorage.setItem('showVoiceHud', on ? '1' : '0');
}

/**
 * 取得失語症模式下的額外寬鬆度
 * 失語症患者發音較慢、較含糊，辨識時給予額外的寬鬆空間
 * @returns {number} 額外扣減的百分比（0-20）
 */
function getAphasiaBonus() {
    if (getUserMode() !== 'aphasia') return 0;
    const threshold = getSimilarityThreshold();
    // 門檻越低，額外寬鬆越多
    if (threshold <= 20) return 15;
    if (threshold <= 40) return 10;
    return 5;
}

/**
 * 常見語音辨識錯誤映射表
 * 中文語音辨識常會把某些字辨識成同音字
 */
const SPEECH_ERROR_MAP = {
    '爸爸': ['八八', '叭叭', '拔拔'],
    '媽媽': ['嗎嗎', '馬馬', '罵罵'],
    '哥哥': ['歌歌', '鴿鴿', '割割'],
    '姐姐': ['借借', '解解', '接接'],
    '弟弟': ['地地', '第第', '帝帝'],
    '妹妹': ['沒沒', '美美', '妺妺'],
    '爺爺': ['耶耶', '也也', '夜夜'],
    '奶奶': ['耐耐', '奈奈', '乃乃'],
    '叔叔': ['書書', '樹樹', '輸輸'],
    '阿姨': ['阿一', '阿宜', '啊姨'],
    '狗': ['夠', '購', '構', '溝'],
    '貓': ['毛', '矛', '茅', '錨'],
    '魚': ['雨', '與', '語', '羽', '于'],
    '鳥': ['尿', '裊'],
    '蘋果': ['拼過', '頻果', '瓶果'],
    '香蕉': ['相蕉', '想交', '鄉焦'],
    '西瓜': ['稀瓜', '希瓜', '吸瓜'],
    '草莓': ['操沒', '曹梅', '糙霉'],
    '太陽': ['抬樣', '台樣', '態揚'],
    '月亮': ['約量', '越亮', '悅量'],
    '星星': ['心心', '欣欣', '新新'],
    '我愛你': ['我矮你', '窩愛你', '我唉你'],
    '謝謝': ['寫寫', '些些', '謝ㄒㄧㄝˋ'],
    '你好': ['擬好', '妮好', '尼好']
};

/**
 * 計算兩個字串的相似度（改進版，針對中文語音辨識優化）
 * @param {string} str1 - 第一個字串（使用者發音辨識結果）
 * @param {string} str2 - 第二個字串（標準答案）
 * @returns {number} 0-100 的相似度百分比
 */
function calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;

    // 清理字串：移除空白和標點
    const clean1 = str1.replace(/[\s。，！？、～~]/g, '');
    const clean2 = str2.replace(/[\s。，！？、～~]/g, '');

    // 完全匹配
    if (clean1 === clean2) return 100;
    if (clean1.length === 0 || clean2.length === 0) return 0;

    // 檢查是否是常見的語音辨識錯誤
    const errorMappings = SPEECH_ERROR_MAP[clean2] || [];
    if (errorMappings.includes(clean1)) {
        return 95;  // 是已知的辨識錯誤，給高分
    }

    // 短詞特殊處理（1-2字）- 對失語症患者更寬容
    if (clean2.length <= 2) {
        // 辨識結果包含目標文字就給高分
        if (clean1.includes(clean2)) return 95;

        // 目標文字包含在辨識結果中
        if (clean2.includes(clean1) && clean1.length > 0) return 85;

        // 至少有一半以上字元匹配
        let matches = 0;
        for (const char of clean2) {
            if (clean1.includes(char)) matches++;
        }
        if (matches >= clean2.length * 0.5) return 80;
        if (matches > 0) return 60;  // 只要有匹配到一個字就給分
    }

    // 方法1：字元匹配度（雙向檢查）
    const chars1 = clean1.split('');
    const chars2 = clean2.split('');

    // 計算目標文字中有多少字元出現在辨識結果中
    let targetMatches = 0;
    for (const char of chars2) {
        if (clean1.includes(char)) targetMatches++;
    }

    // 計算辨識結果中有多少字元出現在目標文字中
    let resultMatches = 0;
    for (const char of chars1) {
        if (clean2.includes(char)) resultMatches++;
    }

    // 取較高的匹配率
    const targetMatchRate = (targetMatches / chars2.length) * 100;
    const resultMatchRate = chars1.length > 0 ? (resultMatches / chars1.length) * 100 : 0;
    const charSimilarity = Math.max(targetMatchRate, resultMatchRate);

    // 方法2：包含關係加分
    let containsBonus = 0;
    if (clean1.includes(clean2)) {
        containsBonus = 40;  // 辨識結果完整包含目標
    } else if (clean2.includes(clean1) && clean1.length >= clean2.length * 0.5) {
        containsBonus = 30;  // 目標包含辨識結果（且辨識結果夠長）
    }

    // 方法3：順序匹配（檢查字元是否按順序出現）
    let orderScore = 0;
    let lastIndex = -1;
    let orderedMatches = 0;
    for (const char of chars2) {
        const index = clean1.indexOf(char, lastIndex + 1);
        if (index > lastIndex) {
            orderedMatches++;
            lastIndex = index;
        }
    }
    if (orderedMatches > 0) {
        orderScore = (orderedMatches / chars2.length) * 100;
    }

    // 方法4：Levenshtein 距離（編輯距離）
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

    // 綜合計算：取最高分並加上額外獎勵
    const baseSimilarity = Math.max(charSimilarity, levenshteinSimilarity, orderScore);
    const finalScore = Math.min(100, baseSimilarity + containsBonus);

    console.log(`相似度計算: "${clean1}" vs "${clean2}"`, {
        charSimilarity: charSimilarity.toFixed(1),
        levenshteinSimilarity: levenshteinSimilarity.toFixed(1),
        orderScore: orderScore.toFixed(1),
        containsBonus,
        finalScore: finalScore.toFixed(1)
    });

    return finalScore;
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
    return (records[type] && records[type][target]) || null;
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
                lastAttempt: (data.history[0] && data.history[0].timestamp) || null
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
    // 失語症模式：額外降低門檻（患者發音較慢、較含糊）
    const effectiveThreshold = Math.max(0, threshold - getAphasiaBonus());
    return similarity >= effectiveThreshold;
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

/**
 * 家長長按按鈕（v5.2.1）
 * 標記 data-parent-longpress="函數名" 的按鈕要按住 1.2 秒才執行，短按無效。
 * 用於「我會唸」這類不需發聲就計分的家長判定功能——使用者敲一下不會過關。
 */
function initParentLongPress(root) {
    if (typeof document === 'undefined') return;
    const HOLD_MS = 1200;
    (root || document).querySelectorAll('[data-parent-longpress]').forEach(el => {
        if (el.__lpWired) return;
        el.__lpWired = true;
        const fnName = el.getAttribute('data-parent-longpress');
        let timer = null;
        el.title = '家長按住 1.2 秒';
        el.style.webkitTouchCallout = 'none';
        el.style.webkitUserSelect = 'none';
        const start = e => {
            e.preventDefault();
            el.style.opacity = '0.6';
            clearTimeout(timer);
            timer = setTimeout(() => {
                timer = null; el.style.opacity = '';
                const fn = window[fnName];
                if (typeof fn === 'function') fn();
            }, HOLD_MS);
        };
        const cancel = () => { el.style.opacity = ''; if (timer) { clearTimeout(timer); timer = null; } };
        el.addEventListener('pointerdown', start);
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => el.addEventListener(ev, cancel));
        el.addEventListener('click', e => e.preventDefault());
        el.addEventListener('contextmenu', e => e.preventDefault());
    });
}
if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initParentLongPress());
    else initParentLongPress();
}

// 匯出給其他模組使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        APP_CONFIG, getImagePath, getEncouragement, getEncouragementSimple,
        getUserName, getCustomWords, speak, speakShort, playZhuyinSound, playSound, createFireworks,
        shuffle, getRandomItems, ZHUYIN_SOUND_MAP, APP_BASE,
        // 語音相似度追蹤系統
        getUserMode, setUserMode, getThresholdPresets, getAphasiaBonus,
        getSimilarityThreshold, setSimilarityThreshold, calculateSimilarity,
        getVoiceSensitivity, setVoiceSensitivity, getSingleSyllableMode, setSingleSyllableMode,
        getShowVoiceHud, setShowVoiceHud, initParentLongPress,
        getPronunciationRecords, recordPronunciation, getPronunciationRecord,
        getPronunciationReport, clearPronunciationRecords, exportPronunciationRecords,
        passesSimilarityThreshold, getSimilarityLevel
    };
}

// ==========================================
// 全域錯誤紀錄（供 feedback.html 的診斷資訊使用；最多保留 30 筆）
// ==========================================
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    window.__logAppError = function (msg) {
        try {
            const log = JSON.parse(localStorage.getItem('errorLog') || '[]');
            log.push({ t: new Date().toISOString(), page: location.pathname.split('/').slice(-2).join('/'), msg: String(msg).slice(0, 300) });
            while (log.length > 30) log.shift();
            localStorage.setItem('errorLog', JSON.stringify(log));
        } catch (e) { /* ignore */ }
    };
    window.addEventListener('error', function (e) {
        const where = e.filename ? ' @' + e.filename.split('/').pop() + ':' + e.lineno : '';
        window.__logAppError((e.message || 'error') + where);
    });
    window.addEventListener('unhandledrejection', function (e) {
        const r = e.reason;
        window.__logAppError('unhandled: ' + (r && r.message ? r.message : String(r)));
    });
}
