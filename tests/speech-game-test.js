// SpeechGame 單元測試（Node，假 SpeechModule／DOM）：node tests/speech-game-test.js
'use strict';
const calls = [];
const els = {};
function mkEl(id) { return els[id] || (els[id] = { id, textContent: '', disabled: false, style: {}, cls: new Set(), classList: { add(c) { els[id].cls.add(c); }, remove(c) { els[id].cls.delete(c); }, contains(c) { return els[id].cls.has(c); } } }); }
global.document = { getElementById: id => mkEl(id) };
Object.defineProperty(global, 'navigator', { value: { vibrate: p => calls.push('vibrate') }, configurable: true });
global.confirm = () => global.__confirm;
let pending = null, listening = false, recording = false;
global.SpeechModule = {
    isListening: () => listening,
    init: async () => true,
    startListening: (target, cb, opts) => { listening = true; pending = { target, cb, opts }; calls.push('start:' + target + ':' + JSON.stringify(opts || {})); return true; },
    stopListening: () => { listening = false; calls.push('stop'); },
    speak: async t => { calls.push('speak:' + t); },
    hasRecording: () => recording,
    playRecording: async () => { calls.push('playRecording'); }
};
global.getEncouragement = () => '你好棒！';
global.createFireworks = n => calls.push('fireworks:' + n);
const SpeechGame = require('../js/speech-game.js');
let pass = 0, fail = 0;
function check(name, cond) { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name); } }
const fire = (k, a) => { listening = false; pending.cb[k](a); };

(async () => {
    console.log('listen：按鈕狀態、文案、回呼路由');
    let got = null;
    const ok = await SpeechGame.listen({ target: '蘋果', button: 'micBtn', status: 'msg', heard: 'heard', manualButton: 'manualBtn', passMode: 'voice',
        onPass: r => { got = ['pass', r]; }, onFail: r => { got = ['fail', r]; }, onNoVoice: i => { got = ['novoice', i]; } });
    check('回傳 true', ok === true);
    check('按鈕 disabled + listening', els.micBtn.disabled && els.micBtn.classList.contains('listening'));
    check('狀態「正在聽」', els.msg.textContent === SpeechGame.MSG.listening);
    check('passMode 轉給 SpeechModule', pending.opts.passMode === 'voice');
    fire('onVoiceDetected'); check('聽到了文案', els.msg.textContent === SpeechGame.MSG.voice);
    fire('onInterim', '平'); check('你說：中間結果', els.heard.textContent === '你說：平' && els.heard.classList.contains('show'));
    fire('onResult', { passed: true, similarity: 100, transcript: '蘋果' });
    check('onPass 收到結果', got && got[0] === 'pass' && got[1].transcript === '蘋果');
    check('按鈕恢復', !els.micBtn.disabled && !els.micBtn.classList.contains('listening'));
    check('你說：最終結果', els.heard.textContent === '你說：蘋果');

    await SpeechGame.listen({ target: '蘋果', button: 'micBtn', status: 'msg', onPass: () => {}, onFail: r => { got = ['fail', r]; }, onNoVoice: i => { got = ['novoice', i]; } });
    fire('onResult', { passed: false, similarity: 20, transcript: '西瓜' });
    check('不過關 → onFail', got[0] === 'fail' && got[1].similarity === 20);
    await SpeechGame.listen({ target: '蘋果', button: 'micBtn', status: 'msg', onNoVoice: i => { got = ['novoice', i]; } });
    fire('onTimeout', { hadVoice: false, noiseOnly: true });
    check('沒人聲（噪音）→ onNoVoice + 那不是說話聲', got[0] === 'novoice' && els.msg.textContent === SpeechGame.MSG.noiseOnly && els.micBtn.classList.contains('mic-highlight'));
    await SpeechGame.listen({ target: '蘋果', status: 'msg', onNoVoice: i => { got = ['novoice', i]; } });
    fire('onTimeout', { hadVoice: false, noiseOnly: false });
    check('沒人聲（安靜）→ 沒有聽到聲音', got[0] === 'novoice' && els.msg.textContent === SpeechGame.MSG.noVoice);
    await SpeechGame.listen({ target: '蘋果', status: 'msg', manualButton: 'manualBtn', onError: e => { got = ['error', e]; } });
    els.manualBtn.style.display = 'none';
    fire('onError', 'not-allowed');
    check('錯誤 → 文案 + 顯示我會唸', got[0] === 'error' && els.msg.textContent === SpeechGame.MSG.micError && els.manualBtn.style.display === 'inline-block' && els.manualBtn.classList.contains('highlight-btn'));
    let fnText = ''; await SpeechGame.listen({ target: 'ㄅ', status: t => { fnText = t; }, messages: { listening: '唸出來！' } });
    check('status 可為函式、文案可覆寫', fnText === '唸出來！');
    listening = true; check('正在聽時再呼叫 → false', (await SpeechGame.listen({ target: 'x' })) === false); listening = false;

    console.log('review：回放 → 正確示範 → 再試／我會唸');
    calls.length = 0; recording = true;
    await SpeechGame.review({ target: '蘋果', status: 'msg', retryCount: 1 });
    check('順序：回放再示範', calls.join(',') === 'playRecording,speak:蘋果');
    check('文案「再試一次」', els.msg.textContent === SpeechGame.MSG.retry);
    calls.length = 0; els.manualBtn.cls.clear();
    await SpeechGame.review({ target: 'ㄅ', status: 'msg', retryCount: 3, manualButton: 'manualBtn', playback: false, playTarget: async () => calls.push('mp3') });
    check('playback:false 不回放；playTarget 取代 TTS', calls.join(',') === 'mp3');
    check('第 3 次 → 提示我會唸並高亮', els.msg.textContent === SpeechGame.MSG.manual && els.manualBtn.classList.contains('highlight-btn'));

    console.log('celebrate：稱讚含煙火與 TTS');
    calls.length = 0;
    const praise = await SpeechGame.celebrate({ status: 'msg', fireworks: 20, manualButton: 'manualBtn' });
    check('回傳稱讚文字且顯示', praise === '你好棒！' && els.msg.textContent === '🎉 你好棒！ 🎉');
    check('震動、煙火、TTS', calls.includes('vibrate') && calls.includes('fireworks:20') && calls.includes('speak:你好棒！'));
    check('我會唸高亮取消', !els.manualBtn.classList.contains('highlight-btn'));
    calls.length = 0; await SpeechGame.celebrate({ status: 'msg', fireworks: 0, speak: false, suffix: '' });
    check('fireworks:0 / speak:false', !calls.some(c => /fireworks|speak/.test(c)) && els.msg.textContent === '🎉 你好棒！');

    console.log('manualConfirm / skip');
    calls.length = 0; global.__confirm = true; let yes = 0;
    SpeechGame.manualConfirm('蘋果', () => yes++, { status: 'msg' }); await new Promise(r => setTimeout(r, 10));
    check('確定 → onYes（先播示範）', yes === 1 && calls[0] === 'stop' && calls[1] === 'speak:蘋果');
    calls.length = 0; global.__confirm = false; let no = 0;
    SpeechGame.manualConfirm('蘋果', () => yes++, { status: 'msg', onNo: () => no++ }); await new Promise(r => setTimeout(r, 10));
    check('取消 → 沒關係再聽一次', yes === 1 && no === 1 && els.msg.textContent === SpeechGame.MSG.noWorries);
    calls.length = 0; let next = 0;
    SpeechGame.skip('蘋果', () => next++, { status: 'msg', delay: 0 }); await new Promise(r => setTimeout(r, 20));
    check('skip：停聽、唸答案、next', next === 1 && calls[0] === 'stop' && calls[1] === 'speak:蘋果' && els.msg.textContent === '跳過！答案是：蘋果');

    console.log(`\n${pass}/${pass + fail} 通過`);
    process.exit(fail ? 1 : 0);
})();
