/**
 * 注音學習樂園 - 句型產生器
 * v1.0.0
 *
 * 從字詞庫動態產生各遊戲所需的句子、問答、填空等資料
 * 依賴：vocabulary.js（必須先載入）
 */

// ==========================================
// 工具函數
// ==========================================

/**
 * 取得所有類別的有效字詞（含 category 標記）
 */
function getAllEffectiveWords() {
    const allWords = [];
    for (const catKey of Object.keys(VOCABULARY)) {
        const words = typeof getEffectiveVocabulary === 'function'
            ? getEffectiveVocabulary(catKey)
            : VOCABULARY[catKey].words;
        words.forEach(word => {
            allWords.push({ ...word, category: catKey });
        });
    }
    return allWords;
}

/**
 * 篩選指定類別的字詞
 */
function getWordsByCategories(categories) {
    return getAllEffectiveWords().filter(w => categories.includes(w.category));
}

/**
 * 隨機取 n 個（不重複）
 */
function pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(n, shuffled.length));
}

/**
 * 洗牌
 */
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/**
 * 統一圖片渲染：有 customImage 顯示照片，否則顯示 emoji
 * @param {Object} word - 字詞物件（含 emoji, customImage）
 * @param {number} size - 圖片大小（px）
 * @returns {string} HTML 字串
 */
function renderImageHtml(word, size) {
    size = size || 60;
    if (word && word.customImage) {
        return '<img src="' + word.customImage + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover;vertical-align:middle;">';
    }
    return word ? (word.emoji || '') : '';
}

/**
 * 組合多個字詞的圖片（用於場景顯示）
 * @param {Array} words - 字詞物件陣列
 * @param {number} size - 每個圖片大小
 * @returns {string} HTML 字串
 */
function buildSceneImageHtml(words, size) {
    size = size || 50;
    return words.map(function(w) { return renderImageHtml(w, size); }).join('');
}

// ==========================================
// 句型模板
// ==========================================

// SVO 模板：主語 + 動詞 + 賓語
var SVO_TEMPLATES = [
    { verb: '吃', verbEmoji: '🍽️', objectCats: ['fruits', 'food'], hint: '{subject}在吃什麼？' },
    { verb: '喝', verbEmoji: '🥤', objectTexts: ['牛奶', '果汁'], hint: '{subject}在喝什麼？' },
    { verb: '看', verbEmoji: '👀', objectTexts: ['書', '電視'], hint: '{subject}在看什麼？' }
];

// SV 模板：主語 + 「在」 + 動作
var SV_TEMPLATES = [
    { action: '跑', actionEmoji: '🏃', hint: '{subject}在做什麼？' },
    { action: '跳', actionEmoji: '🤸', hint: '{subject}在做什麼？' },
    { action: '睡覺', actionEmoji: '😴', hint: '{subject}在做什麼？' },
    { action: '唱歌', actionEmoji: '🎤', hint: '{subject}在做什麼？' },
    { action: '跳舞', actionEmoji: '💃', hint: '{subject}在做什麼？' },
    { action: '走', actionEmoji: '🚶', hint: '{subject}在做什麼？' }
];

// 描述模板：主語 + 形容
var DESC_TEMPLATES = [
    { pattern: '{word}很大', cats: ['nature'] },
    { pattern: '{word}很可愛', cats: ['animals'] },
    { pattern: '{word}很好吃', cats: ['fruits', 'food'] },
    { pattern: '{word}很漂亮', cats: ['nature'] }
];

// 填空模板
var FILL_TEMPLATES = [
    { pattern: '我愛吃___', categories: ['fruits', 'food'] },
    { pattern: '___很好吃', categories: ['fruits', 'food'] },
    { pattern: '我喜歡___', categories: ['fruits', 'food', 'animals'] },
    { pattern: '___在天上飛', fixedAnswers: ['鳥'] },
    { pattern: '___會汪汪叫', fixedAnswers: ['狗'] },
    { pattern: '___在水裡游', fixedAnswers: ['魚'] },
    { pattern: '我用___寫字', fixedAnswers: ['筆'] },
    { pattern: '我用___喝水', fixedAnswers: ['杯子'] },
    { pattern: '晚上可以看到___', fixedAnswers: ['月亮', '星星'] },
    { pattern: '___是紅色的', fixedAnswers: ['蘋果'] },
    { pattern: '我看到___', categories: ['animals', 'nature'] },
    { pattern: '___很可愛', categories: ['animals'] },
    { pattern: '我想吃___', categories: ['fruits', 'food'] },
    { pattern: '___在睡覺', categories: ['animals', 'family'] },
    { pattern: '___在跑', categories: ['animals', 'family'] },
    { pattern: '今天有___', fixedAnswers: ['太陽', '雲', '雨'] },
    { pattern: '___在唱歌', categories: ['family'] },
    { pattern: '我喜歡看___', fixedAnswers: ['書', '電視'] },
    { pattern: '___在吃飯', categories: ['family'] },
    { pattern: '我的___很厲害', categories: ['body'] }
];

// QA 問句映射
var QA_QUESTION_MAP = {
    animals: '這是什麼動物？',
    fruits: '這是什麼水果？',
    family: '這是誰？',
    food: '這是什麼食物？',
    items: '這是什麼？',
    body: '這是什麼？',
    nature: '這是什麼？',
    actions: '這是什麼動作？'
};

// ==========================================
// Generator 函數
// ==========================================

/**
 * 產生問答練習資料
 * @param {number} count - 需要的題數
 * @returns {Array} [{image, question, answer, keyword, _wordData}]
 */
function generateQAData(count) {
    count = count || 15;
    var allWords = getAllEffectiveWords();
    // 排除 actions（動作不適合「這是什麼？」）
    var qaWords = allWords.filter(function(w) { return w.category !== 'actions'; });
    var selected = pickRandom(qaWords, count);

    return selected.map(function(word) {
        var question = QA_QUESTION_MAP[word.category] || '這是什麼？';
        return {
            image: word.emoji || '',
            question: question,
            answer: '這是' + word.text,
            keyword: word.text,
            _wordData: word  // 攜帶完整字詞資料（含 customImage）
        };
    });
}

/**
 * 產生填空題資料
 * @param {number} count - 需要的題數
 * @returns {Array} [{sentence, options[], answer}]
 */
function generateFillBlankData(count) {
    count = count || 15;
    var allWords = getAllEffectiveWords();
    var results = [];

    // 洗牌模板
    var templates = shuffleArray(FILL_TEMPLATES);

    templates.forEach(function(tmpl) {
        if (results.length >= count * 2) return; // 產生多一點再取

        if (tmpl.fixedAnswers) {
            // 固定答案模板 - 找字詞庫中存在的答案
            tmpl.fixedAnswers.forEach(function(answerText) {
                var word = allWords.find(function(w) { return w.text === answerText; });
                if (word) {
                    var distractors = pickRandom(
                        allWords.filter(function(w) { return w.text !== answerText && w.category !== word.category; }),
                        3
                    ).map(function(w) { return w.text; });
                    if (distractors.length >= 2) {
                        results.push({
                            sentence: tmpl.pattern,
                            options: shuffleArray([answerText].concat(distractors)),
                            answer: answerText
                        });
                    }
                }
            });
        } else if (tmpl.categories) {
            // 類別模板 - 從對應類別隨機取答案
            var validWords = allWords.filter(function(w) { return tmpl.categories.includes(w.category); });
            if (validWords.length > 0) {
                var answer = pickRandom(validWords, 1)[0];
                var distractors = pickRandom(
                    allWords.filter(function(w) { return w.text !== answer.text; }),
                    3
                ).map(function(w) { return w.text; });
                if (distractors.length >= 2) {
                    results.push({
                        sentence: tmpl.pattern,
                        options: shuffleArray([answer.text].concat(distractors)),
                        answer: answer.text
                    });
                }
            }
        }
    });

    return pickRandom(results, count);
}

/**
 * 產生 SVO/SV 場景句（內部共用）
 * @returns {Array} [{sentence, image, hint, _subjectData, _objectData, _actionText}]
 */
function _generateSentences() {
    var subjects = getWordsByCategories(['family', 'animals']);
    var allWords = getAllEffectiveWords();
    var results = [];

    // SVO 句型：主語 + 動詞 + 賓語
    SVO_TEMPLATES.forEach(function(tmpl) {
        var objects;
        if (tmpl.objectTexts) {
            objects = allWords.filter(function(w) { return tmpl.objectTexts.includes(w.text); });
        } else {
            objects = allWords.filter(function(w) { return tmpl.objectCats.includes(w.category); });
        }

        pickRandom(subjects, 6).forEach(function(subj) {
            pickRandom(objects, 2).forEach(function(obj) {
                var sentence = subj.text + tmpl.verb + obj.text;
                var imageEmoji = (subj.emoji || '') + (obj.emoji || '');
                var hint = tmpl.hint.replace('{subject}', subj.text);
                results.push({
                    sentence: sentence,
                    image: imageEmoji,
                    hint: hint,
                    _subjectData: subj,
                    _objectData: obj,
                    _actionText: tmpl.verb
                });
            });
        });
    });

    // SV 句型：主語 + 「在」 + 動作
    SV_TEMPLATES.forEach(function(tmpl) {
        pickRandom(subjects, 4).forEach(function(subj) {
            var sentence = subj.text + '在' + tmpl.action;
            var imageEmoji = (subj.emoji || '') + tmpl.actionEmoji;
            var hint = tmpl.hint.replace('{subject}', subj.text);
            results.push({
                sentence: sentence,
                image: imageEmoji,
                hint: hint,
                _subjectData: subj,
                _objectData: null,
                _actionText: tmpl.action
            });
        });
    });

    // 描述句型
    DESC_TEMPLATES.forEach(function(tmpl) {
        var words = allWords.filter(function(w) { return tmpl.cats.includes(w.category); });
        pickRandom(words, 3).forEach(function(word) {
            var sentence = tmpl.pattern.replace('{word}', word.text);
            results.push({
                sentence: sentence,
                image: word.emoji || '',
                hint: '描述' + word.text,
                _subjectData: word,
                _objectData: null,
                _actionText: null
            });
        });
    });

    return results;
}

/**
 * 產生看圖說話資料
 * @param {number} count - 需要的場景數
 * @returns {Array} [{image, sentence, hint, _subjectData, _objectData}]
 */
function generateSceneData(count) {
    count = count || 12;
    var sentences = _generateSentences();
    var selected = pickRandom(sentences, count);
    return selected.map(function(s) {
        return {
            image: s.image,
            sentence: s.sentence,
            hint: s.hint,
            _subjectData: s._subjectData,
            _objectData: s._objectData
        };
    });
}

/**
 * 產生詞彙排序資料
 * @param {number} count - 需要的題數
 * @returns {Array} [{image, sentence, parts[]}]
 */
function generateWordOrderData(count) {
    count = count || 12;
    var subjects = getWordsByCategories(['family', 'animals']);
    var allWords = getAllEffectiveWords();
    var results = [];

    // SVO 拆分：[主語, 動詞, 賓語]
    SVO_TEMPLATES.forEach(function(tmpl) {
        var objects;
        if (tmpl.objectTexts) {
            objects = allWords.filter(function(w) { return tmpl.objectTexts.includes(w.text); });
        } else {
            objects = allWords.filter(function(w) { return tmpl.objectCats.includes(w.category); });
        }

        pickRandom(subjects, 4).forEach(function(subj) {
            pickRandom(objects, 2).forEach(function(obj) {
                results.push({
                    image: (subj.emoji || '') + (obj.emoji || ''),
                    sentence: subj.text + tmpl.verb + obj.text,
                    parts: [subj.text, tmpl.verb, obj.text],
                    _subjectData: subj,
                    _objectData: obj
                });
            });
        });
    });

    // SV 拆分：[主語, 在, 動作]
    SV_TEMPLATES.forEach(function(tmpl) {
        pickRandom(subjects, 3).forEach(function(subj) {
            results.push({
                image: (subj.emoji || '') + tmpl.actionEmoji,
                sentence: subj.text + '在' + tmpl.action,
                parts: [subj.text, '在', tmpl.action],
                _subjectData: subj,
                _objectData: null
            });
        });
    });

    return pickRandom(results, count);
}

/**
 * 產生聽句選圖資料
 * @param {number} count - 需要的題數
 * @returns {Array} [{sentence, correct:{image,desc}, wrongs:[{image,desc}]}]
 */
function generateListenSentenceData(count) {
    count = count || 12;
    var sentences = _generateSentences();
    var subjects = getWordsByCategories(['family', 'animals']);
    var allWords = getAllEffectiveWords();
    var results = [];

    sentences.forEach(function(s) {
        var wrongs = [];

        // 干擾 1：換主語
        var altSubjects = subjects.filter(function(w) {
            return w.text !== s._subjectData.text && w.category === s._subjectData.category;
        });
        if (altSubjects.length > 0) {
            var alt = pickRandom(altSubjects, 1)[0];
            if (s._objectData) {
                wrongs.push({
                    image: (alt.emoji || '') + (s._objectData.emoji || ''),
                    desc: alt.text + s._actionText + (s._objectData ? s._objectData.text : '')
                });
            } else if (s._actionText) {
                var actionTmpl = SV_TEMPLATES.find(function(t) { return t.action === s._actionText; });
                wrongs.push({
                    image: (alt.emoji || '') + (actionTmpl ? actionTmpl.actionEmoji : ''),
                    desc: alt.text + '在' + s._actionText
                });
            }
        }

        // 干擾 2：換動作
        if (s._actionText) {
            var altActions = SV_TEMPLATES.filter(function(t) { return t.action !== s._actionText; });
            if (altActions.length > 0) {
                var altAct = pickRandom(altActions, 1)[0];
                wrongs.push({
                    image: (s._subjectData.emoji || '') + altAct.actionEmoji,
                    desc: s._subjectData.text + '在' + altAct.action
                });
            }
        }

        // 干擾 3：換賓語
        if (s._objectData) {
            var altObjects = allWords.filter(function(w) {
                return w.text !== s._objectData.text && w.category === s._objectData.category;
            });
            if (altObjects.length > 0) {
                var altObj = pickRandom(altObjects, 1)[0];
                wrongs.push({
                    image: (s._subjectData.emoji || '') + (altObj.emoji || ''),
                    desc: s._subjectData.text + s._actionText + altObj.text
                });
            }
        }

        // 需要至少 3 個干擾項
        if (wrongs.length >= 2) {
            // 補足到 3 個
            while (wrongs.length < 3) {
                var randSubj = pickRandom(subjects, 1)[0];
                var randAct = pickRandom(SV_TEMPLATES, 1)[0];
                wrongs.push({
                    image: (randSubj.emoji || '') + randAct.actionEmoji,
                    desc: randSubj.text + '在' + randAct.action
                });
            }

            results.push({
                sentence: s.sentence,
                correct: {
                    image: s.image,
                    desc: s.sentence
                },
                wrongs: wrongs.slice(0, 3),
                _subjectData: s._subjectData,
                _objectData: s._objectData
            });
        }
    });

    return pickRandom(results, count);
}

/**
 * 產生動態故事（補充用）
 * @returns {Array} [{title, scenes:[{image, sentence, _wordData}]}]
 */
function generateStoryData() {
    var family = getWordsByCategories(['family']);
    var animals = getWordsByCategories(['animals']);
    var food = getWordsByCategories(['fruits', 'food']);
    var stories = [];

    // 故事模板 1：{family}的一天
    if (family.length >= 1 && food.length >= 1) {
        var member = pickRandom(family, 1)[0];
        var meal = pickRandom(food, 1)[0];
        var animal = animals.length > 0 ? pickRandom(animals, 1)[0] : null;

        var scenes = [
            { image: '🌅' + (member.emoji || ''), sentence: member.text + '起床了', _wordData: member },
            { image: (member.emoji || '') + (meal.emoji || ''), sentence: member.text + '吃' + meal.text, _wordData: member },
            { image: (member.emoji || '') + '🏃', sentence: member.text + '出去玩', _wordData: member }
        ];
        if (animal) {
            scenes.push({ image: (member.emoji || '') + (animal.emoji || ''), sentence: member.text + '看到' + animal.text, _wordData: member });
        }
        scenes.push({ image: (member.emoji || '') + '🏠', sentence: member.text + '回家了', _wordData: member });

        stories.push({
            title: member.text + '的一天',
            scenes: scenes
        });
    }

    // 故事模板 2：我的{animal}
    if (animals.length >= 1 && food.length >= 1) {
        var pet = pickRandom(animals, 1)[0];
        var petFood = pickRandom(food, 1)[0];

        stories.push({
            title: '我的' + pet.text,
            scenes: [
                { image: '🧒' + (pet.emoji || ''), sentence: '我有一隻' + pet.text, _wordData: pet },
                { image: (pet.emoji || '') + '😊', sentence: pet.text + '很可愛', _wordData: pet },
                { image: (pet.emoji || '') + (petFood.emoji || ''), sentence: pet.text + '喜歡吃' + petFood.text, _wordData: pet },
                { image: '🧒' + (pet.emoji || '') + '🎮', sentence: '我每天跟' + pet.text + '玩', _wordData: pet },
                { image: '❤️' + (pet.emoji || ''), sentence: '我很喜歡' + pet.text, _wordData: pet }
            ]
        });
    }

    return stories;
}

/**
 * 產生動態對話（補充用）
 * @returns {Array} [{title, image, lines:[{role, label, text}]}]
 */
function generateDialogData() {
    var fruits = getWordsByCategories(['fruits']);
    var food = getWordsByCategories(['food']);
    var animals = getWordsByCategories(['animals']);
    var dialogs = [];

    // 對話模板 1：買東西（用字詞庫的水果/食物）
    var buyItems = [].concat(fruits, food);
    if (buyItems.length >= 1) {
        var item = pickRandom(buyItems, 1)[0];
        dialogs.push({
            title: '買' + item.text,
            image: '🛒' + (item.emoji || ''),
            lines: [
                { role: 'A', label: '老闆', text: '你好，要買什麼？' },
                { role: 'B', label: '你', text: '我要買' + item.text + '。' },
                { role: 'A', label: '老闆', text: '好的，這是' + item.text + '。' },
                { role: 'B', label: '你', text: '謝謝！' },
                { role: 'A', label: '老闆', text: '不客氣！' }
            ],
            _wordData: item
        });
    }

    // 對話模板 2：看到動物
    if (animals.length >= 1) {
        var animal = pickRandom(animals, 1)[0];
        dialogs.push({
            title: '看到' + animal.text,
            image: '🧒' + (animal.emoji || ''),
            lines: [
                { role: 'A', label: '小美', text: '你看！那是什麼？' },
                { role: 'B', label: '你', text: '那是' + animal.text + '！' },
                { role: 'A', label: '小美', text: animal.text + '好可愛！' },
                { role: 'B', label: '你', text: '對啊，我很喜歡' + animal.text + '。' }
            ],
            _wordData: animal
        });
    }

    return dialogs;
}

/**
 * 產生動態短文（補充用）
 * @returns {Array} [{title, image, sentences:[], _wordData}]
 */
function generatePassageData() {
    var family = getWordsByCategories(['family']);
    var animals = getWordsByCategories(['animals']);
    var food = getWordsByCategories(['fruits', 'food']);
    var passages = [];

    // 短文模板 1：我的家人
    if (family.length >= 2) {
        var members = pickRandom(family, 2);
        var m1 = members[0];
        var m2 = members[1];
        passages.push({
            title: '我的家',
            image: '🏠' + (m1.emoji || '') + (m2.emoji || ''),
            sentences: [
                '我有一個家。',
                '家裡有' + m1.text + '。',
                '還有' + m2.text + '。',
                '我們每天在一起。',
                '我愛我的家。'
            ],
            _wordData: m1
        });
    }

    // 短文模板 2：我喜歡的食物
    if (food.length >= 2) {
        var foods = pickRandom(food, 2);
        var f1 = foods[0];
        var f2 = foods[1];
        passages.push({
            title: '好吃的食物',
            image: (f1.emoji || '') + (f2.emoji || ''),
            sentences: [
                '我喜歡吃東西。',
                '我最喜歡吃' + f1.text + '。',
                f1.text + '很好吃。',
                '我也喜歡' + f2.text + '。',
                '吃東西好開心。'
            ],
            _wordData: f1
        });
    }

    // 短文模板 3：可愛的動物
    if (animals.length >= 1) {
        var pet = pickRandom(animals, 1)[0];
        passages.push({
            title: '可愛的' + pet.text,
            image: (pet.emoji || '') + '❤️',
            sentences: [
                '我認識一隻' + pet.text + '。',
                pet.text + '很可愛。',
                pet.text + '喜歡玩。',
                '我很喜歡' + pet.text + '。',
                pet.text + '是我的好朋友。'
            ],
            _wordData: pet
        });
    }

    return passages;
}

// 匯出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        getAllEffectiveWords, getWordsByCategories, pickRandom, shuffleArray,
        renderImageHtml, buildSceneImageHtml,
        generateQAData, generateFillBlankData, generateSceneData,
        generateWordOrderData, generateListenSentenceData,
        generateStoryData, generateDialogData, generatePassageData
    };
}
