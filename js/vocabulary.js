/**
 * 注音學習樂園 - 詞彙資料庫
 * v2.1.0（v5.6.0 起含使用者資料層 UserData）
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

// ==========================================
// 使用者資料層（v5.6.0）：familySettings／vocabularyModifications 唯一的讀寫入口
// 頁面不得自行 localStorage.getItem/setItem 這兩個鍵；舊版分散的 customWords、
// vocabularyModifications.*.family 在第一次讀取時自動併入（一次性遷移）。
// ==========================================
const UserData = (function () {
    const FAMILY_KEY = 'familySettings', MODS_KEY = 'vocabularyModifications', LEGACY_CUSTOM_KEY = 'customWords';
    /** 預設家人角色（唯一定義；settings 頁與遊戲都用這份） */
    const DEFAULT_FAMILY = [
        { id: 'dad', emoji: '👨', name: '爸爸' }, { id: 'mom', emoji: '👩', name: '媽媽' },
        { id: 'grandpa', emoji: '👴', name: '爺爺' }, { id: 'grandma', emoji: '👵', name: '奶奶' },
        { id: 'grandpa2', emoji: '👴', name: '外公' }, { id: 'grandma2', emoji: '👵', name: '外婆' },
        { id: 'brother', emoji: '👦', name: '哥哥' }, { id: 'sister', emoji: '👧', name: '姐姐' },
        { id: 'young_brother', emoji: '👦', name: '弟弟' }, { id: 'young_sister', emoji: '👧', name: '妹妹' },
        { id: 'uncle', emoji: '👨', name: '叔叔' }, { id: 'aunt', emoji: '👩', name: '阿姨' },
        { id: 'uncle2', emoji: '👨', name: '舅舅' }, { id: 'aunt2', emoji: '👩', name: '姑姑' }
    ].map(function (m) { return { id: m.id, emoji: m.emoji, name: m.name, zhuyin: '', enabled: true, customImage: null }; });
    const LEGACY_CATEGORY = { daily: 'items', place: 'nature', sentence: 'items', family: 'family' };

    function storage() { try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; } }
    function readJson(key, fallback) { try { const st = storage(); const v = st && st.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
    function writeJson(key, val) { const st = storage(); if (!st) return false; try { st.setItem(key, JSON.stringify(val)); return true; } catch (e) { console.error('UserData 儲存失敗', key, e); return false; } }
    function normMods(m) { if (!m || typeof m !== 'object') m = {}; ['deleted', 'edited', 'added'].forEach(function (k) { if (!m[k] || typeof m[k] !== 'object') m[k] = {}; }); return m; }
    function isMale(emoji) { return emoji === '👨' || emoji === '👴' || emoji === '👦'; }
    function isFemale(emoji) { return emoji === '👩' || emoji === '👵' || emoji === '👧'; }
    function defaultName(id) { const d = DEFAULT_FAMILY.find(function (m) { return m.id === id; }); return d ? d.name : ''; }
    function copy(o) { return JSON.parse(JSON.stringify(o)); }
    function newMember(name, zhuyin, emoji, gender, customImage) {
        return {
            id: 'add_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: name, zhuyin: zhuyin || '', emoji: emoji || '👤',
            gender: gender || (isMale(emoji) ? 'male' : isFemale(emoji) ? 'female' : 'unknown'),
            enabled: true, customImage: customImage || null, isAdded: true
        };
    }

    /** 家人名單：預設角色補齊（新版本加的角色也會出現）＋使用者新增；只在這裡讀 */
    function readFamily() {
        let list = readJson(FAMILY_KEY, null);
        let changed = false;
        if (!Array.isArray(list)) { list = []; changed = true; }
        DEFAULT_FAMILY.forEach(function (d) { if (!list.find(function (m) { return m.id === d.id; })) { list.push(copy(d)); changed = true; } });
        return { list: list, changed: changed };
    }

    let migrated = false;
    /** 一次性遷移舊資料：customWords → added；vocabularyModifications 的 family 項目 → familySettings */
    function migrate() {
        if (migrated) return; migrated = true;
        const st = storage(); if (!st) return;
        const mods = normMods(readJson(MODS_KEY, null));
        let modsChanged = false;
        const legacy = readJson(LEGACY_CUSTOM_KEY, null);
        if (Array.isArray(legacy)) {
            legacy.forEach(function (w) {
                if (!w || !w.word) return;
                const cat = LEGACY_CATEGORY[w.category] || 'items';
                if (!mods.added[cat]) mods.added[cat] = [];
                if (mods.added[cat].find(function (x) { return x.text === w.word; })) return;
                mods.added[cat].push({ text: w.word, zhuyin: w.zhuyin || '', emoji: '📝', customImage: w.image || null });
            });
            try { st.removeItem(LEGACY_CUSTOM_KEY); } catch (e) { /* ignore */ }
            modsChanged = true;
        }
        if (mods.edited.family || mods.deleted.family || mods.added.family) {
            const fam = readFamily(); const list = fam.list;
            const edited = mods.edited.family || {};
            Object.keys(edited).forEach(function (text) {
                const e = edited[text]; const m = list.find(function (x) { return defaultName(x.id) === text; });
                if (!m || !e) return;
                if (e.text) m.name = e.text; if (e.zhuyin) m.zhuyin = e.zhuyin; if (e.customImage) m.customImage = e.customImage;
            });
            (mods.deleted.family || []).forEach(function (text) {
                const m = list.find(function (x) { return x.name === text || defaultName(x.id) === text; });
                if (m) m.enabled = false;
            });
            (mods.added.family || []).forEach(function (w) {
                if (!w || !w.text || list.find(function (x) { return x.name === w.text; })) return;
                list.push(newMember(w.text, w.zhuyin, w.emoji, w.gender, w.customImage));
            });
            delete mods.edited.family; delete mods.deleted.family; delete mods.added.family;
            writeJson(FAMILY_KEY, list); modsChanged = true;
        }
        if (modsChanged) writeJson(MODS_KEY, mods);
    }

    // ---------- 家人 ----------
    function loadFamily() { migrate(); const r = readFamily(); if (r.changed) writeJson(FAMILY_KEY, r.list); return r.list; }
    function saveFamily(list) { return writeJson(FAMILY_KEY, list); }
    function addFamilyMember(list, name, zhuyin, emoji, gender) {
        name = (name || '').trim(); if (!name) return null;
        if (list.find(function (m) { return m.name === name; })) return null;
        const m = newMember(name, zhuyin, emoji, gender, null); list.push(m); saveFamily(list); return m;
    }
    /** 只能刪使用者新增的；預設角色用「停用」 */
    function removeFamilyMember(list, id) {
        const i = list.findIndex(function (m) { return m.id === id && m.isAdded; });
        if (i < 0) return false; list.splice(i, 1); saveFamily(list); return true;
    }
    /** 家人 → 遊戲用詞彙（text/zhuyin/emoji/customImage/gender） */
    function familyWord(member) {
        const dn = defaultName(member.id);
        const orig = VOCABULARY.family.words.find(function (w) { return w.text === dn; });
        const renamed = !orig || member.name !== dn;
        return {
            text: member.name,
            // 改名時可一併改注音（v5.2.9）；沒存注音 → 先試自動建議，再退回原始注音
            zhuyin: member.zhuyin || (renamed ? suggestZhuyin(member.name) : '') || (orig ? orig.zhuyin : ''),
            emoji: member.customImage ? null : member.emoji,
            customImage: member.customImage || null,
            image: orig ? orig.image : null,
            originalText: dn || undefined,
            gender: member.gender || (isMale(member.emoji) ? 'male' : 'female'),
            isAdded: !!member.isAdded
        };
    }
    function familyWords() { return loadFamily().filter(function (m) { return m.enabled !== false; }).map(familyWord); }

    // ---------- 一般字詞的修改（新增／編輯／刪除／自訂圖片） ----------
    function loadMods() { migrate(); return normMods(readJson(MODS_KEY, null)); }
    function saveMods(mods) { return writeJson(MODS_KEY, normMods(mods)); }
    function findAdded(mods, category, text) { return (mods.added[category] || []).find(function (w) { return w.text === text; }) || null; }
    /** 新增字詞；系統詞被刪過則改為恢復。回傳 'added' | 'restored' | 'exists' | 'invalid' */
    function addWord(category, word) {
        const text = ((word && word.text) || '').trim(); if (!text || !VOCABULARY[category]) return 'invalid';
        const mods = loadMods();
        const inSystem = VOCABULARY[category].words.some(function (w) { return w.text === text; });
        const deleted = mods.deleted[category] || [];
        if (findAdded(mods, category, text) || (inSystem && deleted.indexOf(text) < 0)) return 'exists';
        if (inSystem) { mods.deleted[category] = deleted.filter(function (t) { return t !== text; }); saveMods(mods); return 'restored'; }
        if (!mods.added[category]) mods.added[category] = [];
        mods.added[category].push({ text: text, zhuyin: word.zhuyin || '', emoji: word.emoji || '📝', customImage: word.customImage || null });
        saveMods(mods); return 'added';
    }
    /** 編輯字詞（text／zhuyin／emoji／customImage 擇要給）；新增的詞直接改，系統詞記在 edited */
    function editWord(category, text, patch) {
        const mods = loadMods();
        const added = findAdded(mods, category, text);
        if (added) { Object.assign(added, patch); }
        else {
            if (!VOCABULARY[category] || !VOCABULARY[category].words.some(function (w) { return w.text === text; })) return false;
            if (!mods.edited[category]) mods.edited[category] = {};
            mods.edited[category][text] = Object.assign({}, mods.edited[category][text] || {}, patch);
        }
        return saveMods(mods);
    }
    function deleteWord(category, text) {
        const mods = loadMods();
        if (findAdded(mods, category, text)) {
            mods.added[category] = mods.added[category].filter(function (w) { return w.text !== text; });
        } else {
            if (!mods.deleted[category]) mods.deleted[category] = [];
            if (mods.deleted[category].indexOf(text) < 0) mods.deleted[category].push(text);
            if (mods.edited[category]) delete mods.edited[category][text];
        }
        return saveMods(mods);
    }
    function setWordImage(category, text, dataUrl) { return editWord(category, text, { customImage: dataUrl }); }
    function clearWordImage(category, text) {
        const mods = loadMods();
        const added = findAdded(mods, category, text);
        if (added) { added.customImage = null; return saveMods(mods); }
        const e = mods.edited[category] && mods.edited[category][text];
        if (!e) return true;
        delete e.customImage;
        if (!Object.keys(e).length) delete mods.edited[category][text];
        return saveMods(mods);
    }
    /** 使用者新增的所有字詞（各類別），給設定頁總覽 */
    function addedWords() {
        const mods = loadMods(); const out = [];
        Object.keys(mods.added).forEach(function (cat) { (mods.added[cat] || []).forEach(function (w) { out.push(Object.assign({ category: cat, isAdded: true }, w)); }); });
        return out;
    }
    function resetAll() { const st = storage(); if (!st) return; [FAMILY_KEY, MODS_KEY, LEGACY_CUSTOM_KEY].forEach(function (k) { try { st.removeItem(k); } catch (e) { /* ignore */ } }); }

    return { DEFAULT_FAMILY: DEFAULT_FAMILY, loadFamily: loadFamily, saveFamily: saveFamily, addFamilyMember: addFamilyMember, removeFamilyMember: removeFamilyMember,
             familyWord: familyWord, familyWords: familyWords, defaultName: defaultName,
             loadMods: loadMods, saveMods: saveMods, addWord: addWord, editWord: editWord, deleteWord: deleteWord, setWordImage: setWordImage, clearWordImage: clearWordImage,
             addedWords: addedWords, resetAll: resetAll, _resetMigration: function () { migrated = false; } };
})();

/**
 * 取得指定類別的有效詞彙列表：系統預設 ＋ 使用者的修改（新增、編輯、刪除、自訂圖片）；家人類別來自 familySettings
 * @param {string} category - 類別名稱 (family, animals, fruits, etc.)
 * @returns {Array} 有效的詞彙列表
 */
function getEffectiveVocabulary(category) {
    const vocab = VOCABULARY[category];
    if (!vocab) return [];
    if (category === 'family') return UserData.familyWords();
    const mods = UserData.loadMods();
    const deletedWords = mods.deleted[category] || [];
    const editedWords = mods.edited[category] || {};
    const addedWords = mods.added[category] || [];
    const out = [];
    vocab.words.forEach(function (word) {
        if (deletedWords.indexOf(word.text) >= 0) return;
        out.push(editedWords[word.text] ? Object.assign({}, word, editedWords[word.text], { isEdited: true }) : Object.assign({}, word));
    });
    addedWords.forEach(function (word) { out.push(Object.assign({}, word, { isAdded: true })); });
    return out;
}

/** 相容舊名稱：家人類別的有效詞彙（參數已不需要） */
function getEffectiveFamilyVocabulary() { return UserData.familyWords(); }

/**
 * 取得所有類別的有效詞彙統計
 */
function getEffectiveVocabularyStats() {
    const stats = {};
    for (const category of Object.keys(VOCABULARY)) {
        const words = getEffectiveVocabulary(category);
        stats[category] = { name: VOCABULARY[category].name, count: words.length, icon: VOCABULARY[category].icon };
    }
    return stats;
}

// 匯出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZHUYIN_SYMBOLS, VOCABULARY, SENTENCES, UserData, getEffectiveVocabulary, getEffectiveFamilyVocabulary, getEffectiveVocabularyStats, suggestZhuyin };
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
    '同': 'ㄊㄨㄥˊ', '學': 'ㄒㄩㄝˊ', '朋': 'ㄆㄥˊ', '友': 'ㄧㄡˇ', '醫': 'ㄧ', '護': 'ㄏㄨˋ', '士': 'ㄕˋ', '看': 'ㄎㄢˋ',
    // 生活用詞（語言障礙者常用的功能性單詞）
    '毛': 'ㄇㄠˊ', '巾': 'ㄐㄧㄣ', '尿': 'ㄋㄧㄠˋ', '便': 'ㄅㄧㄢˋ', '衛': 'ㄨㄟˋ', '紙': 'ㄓˇ', '走': 'ㄗㄡˇ', '路': 'ㄌㄨˋ',
    '坐': 'ㄗㄨㄛˋ', '休': 'ㄒㄧㄡ', '息': 'ㄒㄧˊ', '要': 'ㄧㄠˋ', '園': 'ㄩㄢˊ', '喝': 'ㄏㄜ', '洗': 'ㄒㄧˇ', '澡': 'ㄗㄠˇ',
    '睡': 'ㄕㄨㄟˋ', '覺': 'ㄐㄧㄠˋ', '痛': 'ㄊㄨㄥˋ', '藥': 'ㄧㄠˋ', '出': 'ㄔㄨ', '去': 'ㄑㄩˋ', '玩': 'ㄨㄢˊ', '郵': 'ㄧㄡˊ',
    '輪': 'ㄌㄨㄣˊ', '船': 'ㄔㄨㄢˊ', '車': 'ㄔㄜ', '飛': 'ㄈㄟ', '機': 'ㄐㄧ', '回': 'ㄏㄨㄟˊ', '家': 'ㄐㄧㄚ', '廁': 'ㄘㄜˋ', '所': 'ㄙㄨㄛˇ'
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
