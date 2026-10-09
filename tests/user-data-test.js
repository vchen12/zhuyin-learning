// UserData（js/vocabulary.js 使用者資料層）單元測試：node tests/user-data-test.js
'use strict';
const store = {};
Object.defineProperty(global, 'localStorage', { value: {
    getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; }
}, configurable: true });
const { UserData, getEffectiveVocabulary, VOCABULARY } = require('../js/vocabulary.js');
let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name); } }
function reset() { Object.keys(store).forEach(k => delete store[k]); UserData._resetMigration(); }
const J = k => JSON.parse(store[k] || 'null');

console.log('全新裝置');
reset();
let fam = UserData.loadFamily();
check('14 個預設角色', fam.length === 14 && fam[0].name === '爸爸' && fam.every(m => m.enabled));
check('家人詞彙 14 個、注音來自字詞庫', getEffectiveVocabulary('family').length === 14 && getEffectiveVocabulary('family')[0].zhuyin === VOCABULARY.family.words[0].zhuyin);

console.log('舊資料遷移');
reset();
store.familySettings = JSON.stringify([{ id: 'dad', emoji: '👨', name: '爸爸', enabled: true, customImage: null }, { id: 'grandma', emoji: '👵', name: '阿嬤', enabled: true, customImage: 'data:img/grandma' }]);
store.vocabularyModifications = JSON.stringify({ deleted: { family: ['哥哥'], fruits: ['香蕉'] }, edited: { family: { '媽媽': { text: '媽咪', zhuyin: 'ㄇㄚ ㄇㄧ' } }, fruits: { '蘋果': { customImage: 'data:img/apple' } } }, added: { family: [{ text: '大舅', zhuyin: 'ㄉㄚˋ ㄐㄧㄡˋ', emoji: '👨', gender: 'male', customImage: 'data:img/uncle' }], animals: [{ text: '龍', zhuyin: 'ㄌㄨㄥˊ', emoji: '🐉' }] } });
store.customWords = JSON.stringify([{ id: 1, word: '毛巾', zhuyin: 'ㄇㄠˊ ㄐㄧㄣ', category: 'daily', image: 'data:img/towel' }, { id: 2, word: '表哥', zhuyin: '', category: 'family' }, { id: 3, word: '公園', zhuyin: '', category: 'place' }]);
fam = UserData.loadFamily();
const byName = n => fam.find(m => m.name === n);
check('預設角色補齊到 14 ＋ 新增 2（大舅、表哥）', fam.length === 16 && byName('大舅') && byName('表哥'));
check('改名保留（阿嬤＋照片）', byName('阿嬤') && byName('阿嬤').customImage === 'data:img/grandma');
check('edited.family → 改名媽咪與注音', byName('媽咪') && byName('媽咪').zhuyin === 'ㄇㄚ ㄇㄧ' && byName('媽咪').id === 'mom');
check('deleted.family → 哥哥停用', byName('哥哥') && byName('哥哥').enabled === false);
check('新增家人帶照片與 isAdded', byName('大舅').customImage === 'data:img/uncle' && byName('大舅').isAdded === true && byName('大舅').gender === 'male');
let mods = J('vocabularyModifications');
check('mods 不再有 family 項目', !mods.added.family && !mods.deleted.family && !mods.edited.family);
check('customWords 併入 added（daily→items、place→nature）且刪除舊鍵', !('customWords' in store) && mods.added.items.some(w => w.text === '毛巾' && w.customImage === 'data:img/towel') && mods.added.nature.some(w => w.text === '公園'));
check('其他類別修改原樣保留', mods.deleted.fruits[0] === '香蕉' && mods.edited.fruits['蘋果'].customImage === 'data:img/apple' && mods.added.animals[0].text === '龍');
const famWords = getEffectiveVocabulary('family');
check('家人有效詞彙：停用的不出現、新增的出現、注音可自動建議', !famWords.find(w => w.text === '哥哥') && famWords.find(w => w.text === '表哥') && famWords.find(w => w.text === '阿嬤').zhuyin.length > 0);
check('有照片的 emoji 為 null、customImage 帶出', famWords.find(w => w.text === '大舅').emoji === null && famWords.find(w => w.text === '大舅').customImage === 'data:img/uncle');
const fruits = getEffectiveVocabulary('fruits');
check('水果：香蕉刪除、蘋果有自訂圖、標記 isEdited', !fruits.find(w => w.text === '香蕉') && fruits.find(w => w.text === '蘋果').customImage === 'data:img/apple' && fruits.find(w => w.text === '蘋果').isEdited);
check('日常用品含遷移的毛巾（isAdded）', getEffectiveVocabulary('items').find(w => w.text === '毛巾' && w.isAdded));
UserData._resetMigration(); const fam2 = UserData.loadFamily();
check('再讀一次不重複（冪等）', fam2.length === 16);

console.log('家人操作');
const m = UserData.addFamilyMember(fam2, '二姑', 'ㄦˋ ㄍㄨ', '👩', 'female');
check('新增家人並存檔', m && m.isAdded && J('familySettings').find(x => x.name === '二姑'));
check('重複名稱拒絕', UserData.addFamilyMember(fam2, '二姑', '', '👩') === null);
check('預設角色不能刪', UserData.removeFamilyMember(fam2, 'dad') === false && fam2.find(x => x.id === 'dad'));
check('新增的可以刪', UserData.removeFamilyMember(fam2, m.id) === true && !J('familySettings').find(x => x.name === '二姑'));

console.log('字詞操作');
check('新增字詞', UserData.addWord('animals', { text: '麒麟', zhuyin: 'ㄑㄧˊ ㄌㄧㄣˊ' }) === 'added' && getEffectiveVocabulary('animals').find(w => w.text === '麒麟'));
check('重複拒絕', UserData.addWord('animals', { text: '麒麟' }) === 'exists' && UserData.addWord('fruits', { text: '蘋果' }) === 'exists');
check('刪過的系統詞 → 恢復', UserData.addWord('fruits', { text: '香蕉' }) === 'restored' && getEffectiveVocabulary('fruits').find(w => w.text === '香蕉'));
check('新增詞設圖片（寫在 added 本身）', UserData.setWordImage('animals', '麒麟', 'data:img/q') && J('vocabularyModifications').added.animals.find(w => w.text === '麒麟').customImage === 'data:img/q' && getEffectiveVocabulary('animals').find(w => w.text === '麒麟').customImage === 'data:img/q');
check('編輯新增詞保留圖片', UserData.editWord('animals', '麒麟', { zhuyin: 'x' }) && getEffectiveVocabulary('animals').find(w => w.text === '麒麟').customImage === 'data:img/q');
check('系統詞設圖片 → edited', UserData.setWordImage('animals', VOCABULARY.animals.words[0].text, 'data:img/a') && getEffectiveVocabulary('animals')[0].customImage === 'data:img/a');
check('系統詞清圖片 → 空的 edited 項目移除', UserData.clearWordImage('animals', VOCABULARY.animals.words[0].text) && !J('vocabularyModifications').edited.animals[VOCABULARY.animals.words[0].text] && !getEffectiveVocabulary('animals')[0].customImage);
check('刪新增詞', UserData.deleteWord('animals', '麒麟') && !getEffectiveVocabulary('animals').find(w => w.text === '麒麟'));
check('刪系統詞 → deleted', UserData.deleteWord('fruits', '香蕉') && !getEffectiveVocabulary('fruits').find(w => w.text === '香蕉'));
check('addedWords 總覽含類別', UserData.addedWords().some(w => w.category === 'items' && w.text === '毛巾'));
UserData.resetAll();
check('resetAll 清除三個鍵', !store.familySettings && !store.vocabularyModifications && !store.customWords);

console.log(`\n${pass}/${pass + fail} 通過`);
process.exit(fail ? 1 : 0);
