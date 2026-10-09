/**
 * 注音學習樂園 - 詞彙資料庫
 * v2.0.0
 */

// 注音符號定義
const ZHUYIN_SYMBOLS = {
    // 聲母 (21個)
    initials: [
        'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ',
        'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ',
        'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ'
    ],
    // 韻母 (16個)
    finals: [
        'ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ',
        'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ', 'ㄧ', 'ㄨ', 'ㄩ'
    ],
    // 全部 (37個)
    all: [
        'ㄅ', 'ㄆ', 'ㄇ', 'ㄈ', 'ㄉ', 'ㄊ', 'ㄋ', 'ㄌ',
        'ㄍ', 'ㄎ', 'ㄏ', 'ㄐ', 'ㄑ', 'ㄒ', 'ㄓ', 'ㄔ',
        'ㄕ', 'ㄖ', 'ㄗ', 'ㄘ', 'ㄙ',
        'ㄚ', 'ㄛ', 'ㄜ', 'ㄝ', 'ㄞ', 'ㄟ', 'ㄠ', 'ㄡ',
        'ㄢ', 'ㄣ', 'ㄤ', 'ㄥ', 'ㄦ', 'ㄧ', 'ㄨ', 'ㄩ'
    ]
};

// 詞彙資料庫
const VOCABULARY = {
    family: {
        name: '家人',
        icon: '👨‍👩‍👧',
        color: '#FF6B6B',
        words: [
            { emoji: '👨', text: '爸爸', zhuyin: 'ㄅㄚˋ ㄅㄚ˙', image: 'dad.png' },
            { emoji: '👩', text: '媽媽', zhuyin: 'ㄇㄚ ㄇㄚ˙', image: 'mom.png' },
            { emoji: '👴', text: '爺爺', zhuyin: 'ㄧㄝˊ ㄧㄝ˙', image: 'grandpa.png' },
            { emoji: '👵', text: '奶奶', zhuyin: 'ㄋㄞˇ ㄋㄞ˙', image: 'grandma.png' },
            { emoji: '👴', text: '外公', zhuyin: 'ㄨㄞˋ ㄍㄨㄥ', image: 'grandpa2.png' },
            { emoji: '👵', text: '外婆', zhuyin: 'ㄨㄞˋ ㄆㄛˊ', image: 'grandma2.png' },
            { emoji: '👦', text: '哥哥', zhuyin: 'ㄍㄜ ㄍㄜ˙', image: 'brother.png' },
            { emoji: '👧', text: '姐姐', zhuyin: 'ㄐㄧㄝˇ ㄐㄧㄝ˙', image: 'sister.png' },
            { emoji: '👦', text: '弟弟', zhuyin: 'ㄉㄧˋ ㄉㄧ˙', image: 'young_brother.png' },
            { emoji: '👧', text: '妹妹', zhuyin: 'ㄇㄟˋ ㄇㄟ˙', image: 'young_sister.png' },
            { emoji: '👨', text: '叔叔', zhuyin: 'ㄕㄨˊ ㄕㄨ˙', image: 'uncle.png' },
            { emoji: '👩', text: '阿姨', zhuyin: 'ㄚ ㄧˊ', image: 'aunt.png' },
            { emoji: '👨', text: '舅舅', zhuyin: 'ㄐㄧㄡˋ ㄐㄧㄡ˙', image: 'uncle2.png' },
            { emoji: '👩', text: '姑姑', zhuyin: 'ㄍㄨ ㄍㄨ˙', image: 'aunt2.png' }
        ]
    },
    animals: {
        name: '動物',
        icon: '🐾',
        color: '#4ECDC4',
        words: [
            { emoji: '🐕', text: '狗', zhuyin: 'ㄍㄡˇ', image: 'dog.png' },
            { emoji: '🐈', text: '貓', zhuyin: 'ㄇㄠ', image: 'cat.png' },
            { emoji: '🐦', text: '鳥', zhuyin: 'ㄋㄧㄠˇ', image: 'bird.png' },
            { emoji: '🐟', text: '魚', zhuyin: 'ㄩˊ', image: 'fish.png' },
            { emoji: '🐰', text: '兔子', zhuyin: 'ㄊㄨˋ ㄗˇ', image: 'rabbit.png' },
            { emoji: '🐢', text: '烏龜', zhuyin: 'ㄨ ㄍㄨㄟ', image: 'turtle.png' },
            { emoji: '🐘', text: '大象', zhuyin: 'ㄉㄚˋ ㄒㄧㄤˋ', image: 'elephant.png' },
            { emoji: '🦁', text: '獅子', zhuyin: 'ㄕ ㄗˇ', image: 'lion.png' },
            { emoji: '🐵', text: '猴子', zhuyin: 'ㄏㄡˊ ㄗˇ', image: 'monkey.png' },
            { emoji: '🐷', text: '豬', zhuyin: 'ㄓㄨ', image: 'pig.png' },
            { emoji: '🐮', text: '牛', zhuyin: 'ㄋㄧㄡˊ', image: 'cow.png' },
            { emoji: '🐔', text: '雞', zhuyin: 'ㄐㄧ', image: 'chicken.png' },
            { emoji: '🐴', text: '馬', zhuyin: 'ㄇㄚˇ', image: 'horse.png' },
            { emoji: '🐑', text: '羊', zhuyin: 'ㄧㄤˊ', image: 'sheep.png' }
        ]
    },
    fruits: {
        name: '水果',
        icon: '🍎',
        color: '#FF6B6B',
        words: [
            { emoji: '🍎', text: '蘋果', zhuyin: 'ㄆㄧㄥˊ ㄍㄨㄛˇ', image: 'apple.png' },
            { emoji: '🍌', text: '香蕉', zhuyin: 'ㄒㄧㄤ ㄐㄧㄠ', image: 'banana.png' },
            { emoji: '🍊', text: '橘子', zhuyin: 'ㄐㄩˊ ㄗˇ', image: 'orange.png' },
            { emoji: '🍇', text: '葡萄', zhuyin: 'ㄆㄨˊ ㄊㄠˊ', image: 'grape.png' },
            { emoji: '🍉', text: '西瓜', zhuyin: 'ㄒㄧ ㄍㄨㄚ', image: 'watermelon.png' },
            { emoji: '🍓', text: '草莓', zhuyin: 'ㄘㄠˇ ㄇㄟˊ', image: 'strawberry.png' },
            { emoji: '🍑', text: '桃子', zhuyin: 'ㄊㄠˊ ㄗˇ', image: 'peach.png' },
            { emoji: '🍐', text: '梨子', zhuyin: 'ㄌㄧˊ ㄗˇ', image: 'pear.png' },
            { emoji: '🥭', text: '芒果', zhuyin: 'ㄇㄤˊ ㄍㄨㄛˇ', image: 'mango.png' },
            { emoji: '🍍', text: '鳳梨', zhuyin: 'ㄈㄥˋ ㄌㄧˊ', image: 'pineapple.png' },
            { emoji: '🍋', text: '檸檬', zhuyin: 'ㄋㄧㄥˊ ㄇㄥˊ', image: 'lemon.png' },
            { emoji: '🫐', text: '藍莓', zhuyin: 'ㄌㄢˊ ㄇㄟˊ', image: 'blueberry.png' }
        ]
    },
    items: {
        name: '日常用品',
        icon: '📦',
        color: '#95A5A6',
        words: [
            { emoji: '📚', text: '書', zhuyin: 'ㄕㄨ', image: 'book.png' },
            { emoji: '✏️', text: '筆', zhuyin: 'ㄅㄧˇ', image: 'pen.png' },
            { emoji: '🪑', text: '椅子', zhuyin: 'ㄧˇ ㄗˇ', image: 'chair.png' },
            { emoji: '🛏️', text: '床', zhuyin: 'ㄔㄨㄤˊ', image: 'bed.png' },
            { emoji: '🚪', text: '門', zhuyin: 'ㄇㄣˊ', image: 'door.png' },
            { emoji: '💡', text: '燈', zhuyin: 'ㄉㄥ', image: 'light.png' },
            { emoji: '📺', text: '電視', zhuyin: 'ㄉㄧㄢˋ ㄕˋ', image: 'tv.png' },
            { emoji: '📱', text: '手機', zhuyin: 'ㄕㄡˇ ㄐㄧ', image: 'phone.png' },
            { emoji: '🥤', text: '杯子', zhuyin: 'ㄅㄟ ㄗˇ', image: 'cup.png' },
            { emoji: '🍽️', text: '碗', zhuyin: 'ㄨㄢˇ', image: 'bowl.png' },
            { emoji: '🧸', text: '玩具', zhuyin: 'ㄨㄢˊ ㄐㄩˋ', image: 'toy.png' },
            { emoji: '👟', text: '鞋子', zhuyin: 'ㄒㄧㄝˊ ㄗˇ', image: 'shoes.png' }
        ]
    },
    food: {
        name: '食物',
        icon: '🍜',
        color: '#F39C12',
        words: [
            { emoji: '🍚', text: '飯', zhuyin: 'ㄈㄢˋ', image: 'rice.png' },
            { emoji: '🍜', text: '麵', zhuyin: 'ㄇㄧㄢˋ', image: 'noodles.png' },
            { emoji: '🥚', text: '蛋', zhuyin: 'ㄉㄢˋ', image: 'egg.png' },
            { emoji: '🥛', text: '牛奶', zhuyin: 'ㄋㄧㄡˊ ㄋㄞˇ', image: 'milk.png' },
            { emoji: '🍞', text: '麵包', zhuyin: 'ㄇㄧㄢˋ ㄅㄠ', image: 'bread.png' },
            { emoji: '🍦', text: '冰淇淋', zhuyin: 'ㄅㄧㄥ ㄑㄧˊ ㄌㄧㄣˊ', image: 'icecream.png' },
            { emoji: '🍪', text: '餅乾', zhuyin: 'ㄅㄧㄥˇ ㄍㄢ', image: 'cookie.png' },
            { emoji: '🍰', text: '蛋糕', zhuyin: 'ㄉㄢˋ ㄍㄠ', image: 'cake.png' },
            { emoji: '🧃', text: '果汁', zhuyin: 'ㄍㄨㄛˇ ㄓ', image: 'juice.png' },
            { emoji: '🍕', text: '披薩', zhuyin: 'ㄆㄧ ㄙㄚˋ', image: 'pizza.png' },
            { emoji: '🍔', text: '漢堡', zhuyin: 'ㄏㄢˋ ㄅㄠˇ', image: 'burger.png' },
            { emoji: '🍟', text: '薯條', zhuyin: 'ㄕㄨˇ ㄊㄧㄠˊ', image: 'fries.png' }
        ]
    },
    actions: {
        name: '動作',
        icon: '🏃',
        color: '#9B59B6',
        words: [
            { emoji: '🚶', text: '走', zhuyin: 'ㄗㄡˇ', image: 'walk.png' },
            { emoji: '🏃', text: '跑', zhuyin: 'ㄆㄠˇ', image: 'run.png' },
            { emoji: '🤸', text: '跳', zhuyin: 'ㄊㄧㄠˋ', image: 'jump.png' },
            { emoji: '😴', text: '睡覺', zhuyin: 'ㄕㄨㄟˋ ㄐㄧㄠˋ', image: 'sleep.png' },
            { emoji: '🍽️', text: '吃', zhuyin: 'ㄔ', image: 'eat.png' },
            { emoji: '🥤', text: '喝', zhuyin: 'ㄏㄜ', image: 'drink.png' },
            { emoji: '👀', text: '看', zhuyin: 'ㄎㄢˋ', image: 'look.png' },
            { emoji: '👂', text: '聽', zhuyin: 'ㄊㄧㄥ', image: 'listen.png' },
            { emoji: '✍️', text: '寫', zhuyin: 'ㄒㄧㄝˇ', image: 'write.png' },
            { emoji: '📖', text: '讀', zhuyin: 'ㄉㄨˊ', image: 'read.png' },
            { emoji: '🎤', text: '唱歌', zhuyin: 'ㄔㄤˋ ㄍㄜ', image: 'sing.png' },
            { emoji: '💃', text: '跳舞', zhuyin: 'ㄊㄧㄠˋ ㄨˇ', image: 'dance.png' }
        ]
    },
    body: {
        name: '身體',
        icon: '🧍',
        color: '#E74C3C',
        words: [
            { emoji: '👤', text: '頭', zhuyin: 'ㄊㄡˊ', image: 'head.png' },
            { emoji: '👀', text: '眼睛', zhuyin: 'ㄧㄢˇ ㄐㄧㄥ', image: 'eyes.png' },
            { emoji: '👂', text: '耳朵', zhuyin: 'ㄦˇ ㄉㄨㄛˇ', image: 'ears.png' },
            { emoji: '👃', text: '鼻子', zhuyin: 'ㄅㄧˊ ㄗˇ', image: 'nose.png' },
            { emoji: '👄', text: '嘴巴', zhuyin: 'ㄗㄨㄟˇ ㄅㄚ', image: 'mouth.png' },
            { emoji: '✋', text: '手', zhuyin: 'ㄕㄡˇ', image: 'hand.png' },
            { emoji: '🦶', text: '腳', zhuyin: 'ㄐㄧㄠˇ', image: 'foot.png' },
            { emoji: '💪', text: '手臂', zhuyin: 'ㄕㄡˇ ㄅㄧˋ', image: 'arm.png' },
            { emoji: '🦵', text: '腿', zhuyin: 'ㄊㄨㄟˇ', image: 'leg.png' },
            { emoji: '❤️', text: '心', zhuyin: 'ㄒㄧㄣ', image: 'heart.png' }
        ]
    },
    nature: {
        name: '自然',
        icon: '🌳',
        color: '#27AE60',
        words: [
            { emoji: '☀️', text: '太陽', zhuyin: 'ㄊㄞˋ ㄧㄤˊ', image: 'sun.png' },
            { emoji: '🌙', text: '月亮', zhuyin: 'ㄩㄝˋ ㄌㄧㄤˋ', image: 'moon.png' },
            { emoji: '⭐', text: '星星', zhuyin: 'ㄒㄧㄥ ㄒㄧㄥ', image: 'star.png' },
            { emoji: '☁️', text: '雲', zhuyin: 'ㄩㄣˊ', image: 'cloud.png' },
            { emoji: '🌧️', text: '雨', zhuyin: 'ㄩˇ', image: 'rain.png' },
            { emoji: '🌈', text: '彩虹', zhuyin: 'ㄘㄞˇ ㄏㄨㄥˊ', image: 'rainbow.png' },
            { emoji: '🌳', text: '樹', zhuyin: 'ㄕㄨˋ', image: 'tree.png' },
            { emoji: '🌸', text: '花', zhuyin: 'ㄏㄨㄚ', image: 'flower.png' },
            { emoji: '🌊', text: '海', zhuyin: 'ㄏㄞˇ', image: 'sea.png' },
            { emoji: '⛰️', text: '山', zhuyin: 'ㄕㄢ', image: 'mountain.png' },
            { emoji: '🌲', text: '森林', zhuyin: 'ㄙㄣ ㄌㄧㄣˊ', image: 'forest.png' },
            { emoji: '🏖️', text: '沙灘', zhuyin: 'ㄕㄚ ㄊㄢ', image: 'beach.png' }
        ]
    }
};

// 第三關用的句子資料
const SENTENCES = {
    simple: [
        { text: '我愛媽媽', parts: ['我', '愛', '媽媽'], image: 'love_mom.png' },
        { text: '爸爸吃飯', parts: ['爸爸', '吃', '飯'], image: 'dad_eat.png' },
        { text: '狗在跑', parts: ['狗', '在', '跑'], image: 'dog_run.png' },
        { text: '貓在睡覺', parts: ['貓', '在', '睡覺'], image: 'cat_sleep.png' },
        { text: '我喝水', parts: ['我', '喝', '水'], image: 'drink_water.png' },
        { text: '姐姐看書', parts: ['姐姐', '看', '書'], image: 'sister_read.png' },
        { text: '弟弟玩玩具', parts: ['弟弟', '玩', '玩具'], image: 'brother_play.png' },
        { text: '太陽很大', parts: ['太陽', '很', '大'], image: 'big_sun.png' }
    ],
    questions: [
        { question: '這是什麼？', answer: '這是蘋果', image: 'apple.png', word: '蘋果' },
        { question: '這是誰？', answer: '這是爸爸', image: 'dad.png', word: '爸爸' },
        { question: '他在做什麼？', answer: '他在吃飯', image: 'eating.png', word: '吃飯' },
        { question: '這是什麼動物？', answer: '這是狗', image: 'dog.png', word: '狗' },
        { question: '這是什麼顏色？', answer: '這是紅色', image: 'red.png', word: '紅色' }
    ],
    fillBlanks: [
        { sentence: '我愛吃___', options: ['蘋果', '椅子', '太陽', '書'], answer: '蘋果' },
        { sentence: '___在天上飛', options: ['魚', '鳥', '狗', '貓'], answer: '鳥' },
        { sentence: '我用___寫字', options: ['筆', '碗', '床', '門'], answer: '筆' },
        { sentence: '晚上可以看到___', options: ['太陽', '月亮', '雨', '雲'], answer: '月亮' },
        { sentence: '___會汪汪叫', options: ['貓', '鳥', '狗', '魚'], answer: '狗' }
    ],
    dialogs: [
        {
            title: '打招呼',
            scene: 'greeting.png',
            lines: [
                { role: 'A', text: '你好！' },
                { role: 'B', text: '你好！' },
                { role: 'A', text: '你叫什麼名字？' },
                { role: 'B', text: '我叫小明。' }
            ]
        },
        {
            title: '買東西',
            scene: 'shopping.png',
            lines: [
                { role: 'A', text: '我要買蘋果。' },
                { role: 'B', text: '好的，這是蘋果。' },
                { role: 'A', text: '謝謝！' },
                { role: 'B', text: '不客氣！' }
            ]
        }
    ]
};

// ==========================================
// 取得有效詞彙（考慮用戶修改）
// ==========================================

/**
 * 取得指定類別的有效詞彙列表
 * 會整合系統預設詞彙和用戶的修改（新增、編輯、刪除）
 *
 * @param {string} category - 類別名稱 (family, animals, fruits, etc.)
 * @returns {Array} 有效的詞彙列表
 */
function getEffectiveVocabulary(category) {
    const vocab = VOCABULARY[category];
    if (!vocab) return [];

    // 讀取用戶修改
    const modifications = JSON.parse(localStorage.getItem('vocabularyModifications') || '{"deleted":{},"edited":{},"added":{}}');
    const deletedWords = modifications.deleted[category] || [];
    const editedWords = modifications.edited[category] || {};
    const addedWords = modifications.added[category] || [];

    // 家人類別特殊處理：整合 familySettings
    if (category === 'family') {
        return getEffectiveFamilyVocabulary(vocab, deletedWords, editedWords, addedWords);
    }

    // 一般類別處理
    let effectiveWords = [];

    // 1. 處理系統詞彙（過濾已刪除、套用編輯）
    vocab.words.forEach(word => {
        // 跳過已刪除的
        if (deletedWords.includes(word.text)) return;

        // 檢查是否有編輯版本
        if (editedWords[word.text]) {
            effectiveWords.push({
                ...word,
                ...editedWords[word.text]
            });
        } else {
            effectiveWords.push({ ...word });
        }
    });

    // 2. 加入用戶新增的詞彙
    addedWords.forEach(word => {
        effectiveWords.push({ ...word, isAdded: true });
    });

    return effectiveWords;
}

/**
 * 家人類別專用：整合 familySettings 和 vocabularyModifications
 */
function getEffectiveFamilyVocabulary(vocab, deletedWords, editedWords, addedWords) {
    // 讀取 familySettings
    const familySettings = JSON.parse(localStorage.getItem('familySettings') || '[]');

    // 預設家人對應表（用於找到原始資料）
    const defaultFamilyMap = {
        'dad': '爸爸',
        'mom': '媽媽',
        'grandpa': '爺爺',
        'grandma': '奶奶',
        'grandpa2': '外公',
        'grandma2': '外婆',
        'brother': '哥哥',
        'sister': '姐姐',
        'young_brother': '弟弟',
        'young_sister': '妹妹',
        'uncle': '叔叔',
        'aunt': '阿姨',
        'uncle2': '舅舅',
        'aunt2': '姑姑'
    };

    let effectiveWords = [];

    // 1. 處理 familySettings 中已有的角色
    if (familySettings.length > 0) {
        familySettings.forEach(member => {
            // 跳過已停用的
            if (!member.enabled) return;

            // 找到原始詞彙資料
            const defaultName = defaultFamilyMap[member.id];
            const originalWord = vocab.words.find(w => w.text === defaultName);

            if (originalWord) {
                // 檢查是否被用戶刪除（透過 vocabularyModifications）
                if (deletedWords.includes(member.name) || deletedWords.includes(defaultName)) return;

                effectiveWords.push({
                    emoji: member.customImage ? null : member.emoji,
                    customImage: member.customImage,
                    text: member.name,  // 使用自訂名稱
                    // 改名時可一併改注音（v5.2.9）；舊資料改了名卻沒存注音 → 先試自動建議，再退回原始注音
                    zhuyin: member.zhuyin || (member.name !== defaultName ? suggestZhuyin(member.name) : '') || originalWord.zhuyin,
                    image: originalWord.image,
                    originalText: defaultName,  // 保留原始名稱供參考
                    gender: member.emoji === '👨' || member.emoji === '👴' || member.emoji === '👦' ? 'male' : 'female'
                });
            }
        });
    } else {
        // 沒有 familySettings，使用系統預設
        vocab.words.forEach(word => {
            if (deletedWords.includes(word.text)) return;

            if (editedWords[word.text]) {
                effectiveWords.push({
                    ...word,
                    ...editedWords[word.text],
                    gender: word.emoji === '👨' || word.emoji === '👴' || word.emoji === '👦' ? 'male' : 'female'
                });
            } else {
                effectiveWords.push({
                    ...word,
                    gender: word.emoji === '👨' || word.emoji === '👴' || word.emoji === '👦' ? 'male' : 'female'
                });
            }
        });
    }

    // 2. 加入用戶新增的家人（透過 vocabularyModifications.added）
    addedWords.forEach(word => {
        // 確保不重複
        if (!effectiveWords.find(w => w.text === word.text)) {
            effectiveWords.push({
                ...word,
                isAdded: true,
                gender: word.gender || 'unknown'
            });
        }
    });

    return effectiveWords;
}

/**
 * 取得所有類別的有效詞彙統計
 */
function getEffectiveVocabularyStats() {
    const stats = {};
    for (const category of Object.keys(VOCABULARY)) {
        const words = getEffectiveVocabulary(category);
        stats[category] = {
            name: VOCABULARY[category].name,
            count: words.length,
            icon: VOCABULARY[category].icon
        };
    }
    return stats;
}

// 匯出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZHUYIN_SYMBOLS, VOCABULARY, SENTENCES, getEffectiveVocabulary, getEffectiveFamilyVocabulary, getEffectiveVocabularyStats, suggestZhuyin };
}

// ==========================================
// 注音建議（v5.2.9）：由字詞庫既有詞彙建立「字 → 注音」對照，供改名／新增字詞時自動帶入
// ==========================================
const EXTRA_CHAR_ZHUYIN = {
    '阿': 'ㄚ', '嬤': 'ㄇㄚˋ', '公': 'ㄍㄨㄥ', '婆': 'ㄆㄛˊ', '爸': 'ㄅㄚˋ', '媽': 'ㄇㄚ', '爺': 'ㄧㄝˊ', '奶': 'ㄋㄞˇ',
    '哥': 'ㄍㄜ', '姐': 'ㄐㄧㄝˇ', '姊': 'ㄐㄧㄝˇ', '弟': 'ㄉㄧˋ', '妹': 'ㄇㄟˋ', '叔': 'ㄕㄨˊ', '姨': 'ㄧˊ', '舅': 'ㄐㄧㄡˋ',
    '姑': 'ㄍㄨ', '嬸': 'ㄕㄣˇ', '伯': 'ㄅㄛˊ', '丈': 'ㄓㄤˋ', '母': 'ㄇㄨˇ', '父': 'ㄈㄨˋ', '外': 'ㄨㄞˋ', '祖': 'ㄗㄨˇ',
    '乾': 'ㄍㄢ', '老': 'ㄌㄠˇ', '師': 'ㄕ', '寶': 'ㄅㄠˇ', '貝': 'ㄅㄟˋ', '哥': 'ㄍㄜ', '小': 'ㄒㄧㄠˇ', '大': 'ㄉㄚˋ',
    '姪': 'ㄓˊ', '孫': 'ㄙㄨㄣ', '女': 'ㄋㄩˇ', '兒': 'ㄦˊ', '子': 'ㄗˇ', '太': 'ㄊㄞˋ', '先': 'ㄒㄧㄢ', '生': 'ㄕㄥ',
    '同': 'ㄊㄨㄥˊ', '學': 'ㄒㄩㄝˊ', '朋': 'ㄆㄥˊ', '友': 'ㄧㄡˇ', '醫': 'ㄧ', '護': 'ㄏㄨˋ', '士': 'ㄕˋ', '看': 'ㄎㄢˋ'
};
let _charZhuyinMap = null;
function _buildCharZhuyinMap() {
    const map = {};
    if (typeof VOCABULARY !== 'undefined') {
        Object.keys(VOCABULARY).forEach(cat => {
            (VOCABULARY[cat].words || []).forEach(w => {
                if (!w.text || !w.zhuyin) return;
                const chars = Array.from(w.text);
                const parts = w.zhuyin.trim().split(/\s+/);
                if (chars.length !== parts.length) return;   // 字數與音節數不符就不採用
                chars.forEach((c, i) => { if (!map[c]) map[c] = parts[i]; });
            });
        });
    }
    Object.keys(EXTRA_CHAR_ZHUYIN).forEach(c => { map[c] = EXTRA_CHAR_ZHUYIN[c]; });
    return map;
}
/**
 * 依文字建議注音；任一字查不到則回傳空字串（讓使用者自行輸入）
 * 疊字第二字用輕聲（爸爸 → ㄅㄚˋ ㄅㄚ˙），與字詞庫慣例一致
 */
function suggestZhuyin(text) {
    if (!_charZhuyinMap) _charZhuyinMap = _buildCharZhuyinMap();
    const chars = Array.from((text || '').trim());
    if (!chars.length) return '';
    const parts = [];
    for (let i = 0; i < chars.length; i++) {
        const z = _charZhuyinMap[chars[i]];
        if (!z) return '';
        if (i > 0 && chars[i] === chars[i - 1]) parts.push(z.replace(/[ˊˇˋ˙]$/, '') + '˙');
        else parts.push(z);
    }
    return parts.join(' ');
}
