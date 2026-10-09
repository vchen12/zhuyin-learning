/**
 * SpeechGame — 語音遊戲共用流程（v5.5.0）
 *
 * 所有「出題 → 開聽 → 判定 → 回饋 → 下一題」的語音遊戲一律透過這裡呼叫 SpeechModule；
 * 頁面只保留版面、題庫與該遊戲專屬規則。同一件事出現第二份實作即視為 bug。
 *
 * 依賴：js/config.js（getEncouragement、createFireworks）、js/speech-recognition.js（SpeechModule）
 * 相容 iOS 12：不用 ?. 與 ??。
 *
 * 用法（典型）：
 *   SpeechGame.listen({ target: word, button: 'micBtn', status: 'resultMessage', heard: 'recognizedText',
 *                       manualButton: 'manualBtn', onPass: r => handleCorrect(r), onFail: r => handleWrong(r) });
 *   async function handleWrong(r) { retry++; await SpeechGame.review({ target: word, status: 'resultMessage', retryCount: retry, manualButton: 'manualBtn' }); }
 *   async function handleCorrect() { await SpeechGame.celebrate({ status: 'resultMessage' }); next(); }
 */
const SpeechGame = (function () {
    'use strict';

    /** 共用文案：同一種狀態在每個遊戲都講同一句話 */
    const MSG = {
        listening: '正在聽...🎙️',
        voice: '👂 聽到了，繼續說...',
        heard: '你說：',
        heardNone: '（聽到聲音）',
        heardNoText: '（有聲音，但辨識引擎沒有回傳文字）',
        asrError: '（辨識引擎錯誤：',
        noVoice: '沒有聽到聲音，再按麥克風試一次',
        noiseOnly: '🔊 那不是說話聲喔，用嘴巴說',
        micError: '❌ 麥克風無法使用，請按「✅ 我會唸」',
        yours: '🔊 聽聽你的發音...',
        correctIs: '🔊 正確的發音是...',
        retry: '再試一次！',
        manual: '再試一次，或請家長長按「✅ 我會唸」',
        skip: '跳過！答案是：',
        noWorries: '沒關係，再聽一次！'
    };
    const MANUAL_AFTER = 3;   // 連續幾次沒過關後提示「我會唸」

    function el(x) { return typeof x === 'string' ? document.getElementById(x) : (x || null); }
    /** status 可以是元素、id，或函式（例如遊戲自己的 showHint(text)） */
    function setText(e, t) {
        if (t === undefined || t === null) return;
        if (typeof e === 'function') { e(t); return; }
        e = el(e); if (e) e.textContent = t;
    }
    function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function vibrate(p) { if (navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } } }
    function showManual(btn) {
        btn = el(btn); if (!btn) return;
        if (btn.style.display === 'none') btn.style.display = 'inline-block';
        btn.classList.add('highlight-btn');
    }
    function hideManual(btn) { btn = el(btn); if (btn) btn.classList.remove('highlight-btn'); }
    function msgs(o) { return Object.assign({}, MSG, (o && o.messages) || {}); }
    /** 播正確示範：opts.playTarget（例如注音 mp3）優先，否則 TTS */
    function playTarget(opts) {
        const p = opts.playTarget ? opts.playTarget() : SpeechModule.speak(opts.target);
        return Promise.resolve(p);
    }

    /**
     * 聽一次。開聽前不播任何 TTS 提示（TTS 期間麥克風被閘門排除，只會延後聆聽）。
     * opts:
     *   target        要說的字／詞／句（必填）
     *   button        麥克風按鈕（元素或 id）：聆聽中 disabled + .listening，沒人聲時加 .mic-highlight
     *   status        狀態文字元素：正在聽／聽到了／沒聽到／那不是說話聲
     *   heard         「你說：…」元素（有則 .show）；沒有就寫進 status
     *   manualButton  「我會唸」按鈕：麥克風失敗時顯示並高亮
     *   messages      覆寫 MSG 的個別文案
     *   passMode / hud / waitForEnd / silenceEndMs  原樣轉給 SpeechModule.startListening
     *   onPass(result) / onFail(result)             result = { passed, similarity, transcript, basis, voicedMs, ... }
     *   onNoVoice(info)                             完全沒有人聲（info.noiseOnly 區分「那不是說話聲」）
     *   onVoice() / onInterim(text) / onError(err)  選用
     * @returns {Promise<boolean>} 是否真的開始聽（正在聽、處理中或麥克風失敗 → false）
     */
    async function listen(opts) {
        if (SpeechModule.isListening()) return false;
        const m = msgs(opts);
        const btn = el(opts.button), status = opts.status, heard = el(opts.heard), manual = el(opts.manualButton);
        const ok = await SpeechModule.init();
        if (!ok) {
            setText(status, m.micError); showManual(manual);
            if (opts.onError) opts.onError('mic-init');
            return false;
        }
        const done = function () { if (btn) { btn.disabled = false; btn.classList.remove('listening'); } };
        const showHeard = function (text) {
            if (heard) { heard.textContent = m.heard + text; heard.classList.add('show'); }
            else setText(status, '🎤 ' + m.heard + text);
        };
        const lo = {};
        ['passMode', 'hud', 'waitForEnd', 'silenceEndMs'].forEach(function (k) { if (opts[k] !== undefined) lo[k] = opts[k]; });

        const started = SpeechModule.startListening(opts.target, {
            onVoiceDetected: function () {
                setText(status, m.voice); vibrate(50);
                if (opts.onVoice) opts.onVoice();
            },
            onInterim: function (text) { showHeard(text); if (opts.onInterim) opts.onInterim(text); },
            onResult: function (result) {
                done();
                // 沒有文字時說明原因：引擎回錯誤碼（network／not-allowed…）或完全沒回傳，家長才知道該查「聽寫」與網路
                showHeard(result.transcript || (result.asrError ? m.asrError + result.asrError + '）' : (result.asrUsed && result.hadVoice ? m.heardNoText : m.heardNone)));
                if (result.passed) { if (opts.onPass) opts.onPass(result); }
                else if (opts.onFail) opts.onFail(result);
            },
            onTimeout: function (info) {
                done();
                if (info && info.hadVoice) {
                    // 保險：v5 有人聲而不過關應走 onResult(passed:false)
                    if (opts.onFail) opts.onFail({ passed: false, similarity: 0, transcript: '', basis: 'timeout', voicedMs: info.voicedMs || 0 });
                    return;
                }
                setText(status, info && info.noiseOnly ? m.noiseOnly : m.noVoice);
                if (btn) btn.classList.add('mic-highlight');
                if (opts.onNoVoice) opts.onNoVoice(info || {});
            },
            onError: function (err) {
                done();
                console.error('語音辨識錯誤:', err);
                setText(status, m.micError); showManual(manual);
                if (opts.onError) opts.onError(err);
            }
        }, lo);
        if (started === false) return false;
        if (btn) { btn.disabled = true; btn.classList.add('listening'); btn.classList.remove('mic-highlight'); }
        setText(status, m.listening);
        if (heard) heard.classList.remove('show');
        return true;
    }

    /**
     * 沒過關的回饋：先回放他的錄音（有的話）→「正確的發音是…」→ 播正確示範 → 提示再試；
     * 連續 MANUAL_AFTER 次後改提示家長長按「我會唸」。回傳 Promise（流程結束）。
     * opts: { target, status, retryCount, manualButton, playTarget, playback (false = 不回放錄音，節奏快的遊戲用), messages }
     */
    async function review(opts) {
        const m = msgs(opts), status = opts.status;
        if (opts.playback !== false && SpeechModule.hasRecording()) {
            setText(status, m.yours); await wait(300);
            await SpeechModule.playRecording(); await wait(300);
        }
        setText(status, m.correctIs); await wait(300);
        await playTarget(opts); await wait(300);
        if ((opts.retryCount || 0) >= MANUAL_AFTER) { setText(status, m.manual); showManual(opts.manualButton); }
        else setText(status, m.retry);
    }

    /**
     * 過關回饋：稱讚（含名字）顯示在 status、震動、煙火、TTS 唸出稱讚。
     * 鼓勵與稱讚是刻意的（給孩子與失語症患者），不要改成中性用語。
     * opts: { status, fireworks (數量；0 = 不放), container, speak (false = 不唸), prefix, suffix }
     * @returns {Promise<string>} 稱讚文字（TTS 結束後 resolve）
     */
    function celebrate(opts) {
        opts = opts || {};
        const praise = getEncouragement('correct');
        const prefix = opts.prefix === undefined ? '🎉 ' : opts.prefix, suffix = opts.suffix === undefined ? ' 🎉' : opts.suffix;
        setText(opts.status, prefix + praise + suffix);
        vibrate([100, 50, 100]);
        if (opts.fireworks !== 0 && typeof createFireworks === 'function') createFireworks(opts.fireworks || 15, opts.container);
        hideManual(opts.manualButton);
        const p = opts.speak === false ? Promise.resolve() : SpeechModule.speak(praise);
        return p.then(function () { return praise; });
    }

    /**
     * 家長長按「我會唸」：先播示範再 confirm；確定 → onYes()，取消 → 「沒關係，再聽一次」
     * opts: { status, playTarget, onNo }
     */
    function manualConfirm(target, onYes, opts) {
        opts = opts || {};
        const m = msgs(opts);
        SpeechModule.stopListening();
        playTarget(Object.assign({ target: target }, opts)).then(function () {
            if (confirm('你會唸「' + target + '」嗎？\n\n點「確定」表示會唸，點「取消」再練習一下')) { onYes(); return; }
            setText(opts.status, m.noWorries);
            SpeechModule.speak(m.noWorries);
            if (opts.onNo) opts.onNo();
        });
    }

    /**
     * 跳過：停止聆聽、顯示並唸出正確答案，再呼叫 next()
     * opts: { status, playTarget, delay (示範播完後再等多久，預設 800ms), messages }
     */
    function skip(target, next, opts) {
        opts = opts || {};
        const m = msgs(opts);
        SpeechModule.stopListening();
        setText(opts.status, m.skip + target);
        playTarget(Object.assign({ target: target }, opts))
            .then(function () { return wait(opts.delay === undefined ? 800 : opts.delay); })
            .then(function () { if (next) next(); });
    }

    const api = { listen, review, celebrate, manualConfirm, skip, MSG, MANUAL_AFTER, wait };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    return api;
})();
