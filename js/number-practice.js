/**
 * 數字練習（共用，v5.9.4）：第 1 關 0–9、第 2 關 0–30、第 3 關 0–99 是同一個遊戲換資料，這裡只有一份實作；
 * 頁面只留版面（導覽列、主題色）與資料，呼叫 NumberPractice.start(cfg)。
 *
 * 三種模式（切換立即開始，不再跳「確定」對話框、不再長篇說明）：
 *   📚 學習    ：大牌卡顯示數字（＋注音／國字），出現就自動發音；下方數字格點一個唸一個；按牌卡再唸一次
 *   👂 聽音選數：牌卡顯示「？」，自動唸題；按「？」或牌卡再唸一次；四選一
 *   🎤 看數唸出：牌卡顯示數字，自動開始聽（不必按麥克風）；按數字／牌卡 → 系統先示範一次 → 再自動聽；
 *               ✅ 我會唸（家長按一下，不必長按、沒有對話框）；⏭ 跳過
 * 實測回饋（v5.9.4）：數字太小、沒做成牌卡、沒自動發音；選模式還要按確定很擾人；按？或螢幕應重複發音；看數唸出應自動聽音、我會唸不必長按。
 *
 * cfg = { numbers: [{ num, text, zhuyin? }], storageKey, columns, rounds, mount }
 */
(function (global) {
    'use strict';
    const $ = id => document.getElementById(id);
    const CSS = `
        .np { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 1.6vmin; padding: 1.5vmin 2vmin 2vmin; min-height: 0; overflow: hidden; }
        .np-modes { display: flex; gap: 1.5vmin; flex-wrap: wrap; justify-content: center; }
        .np-mode { background: rgba(255,255,255,.25); color: #fff; border: 2px solid #fff; padding: 1.4vmin 2.6vmin; border-radius: 99px; font-size: 2.6vmin; font-weight: 800; cursor: pointer; }
        .np-mode.on { background: #fff; color: var(--np-c1, #667eea); transform: scale(1.06); }
        .np-progress { display: none; width: min(70vmin, 90vw); color: #fff; font-size: 2.4vmin; text-align: center; }
        .np-progress .bar { height: 1.6vmin; background: rgba(255,255,255,.25); border-radius: 99px; overflow: hidden; margin-top: .6vmin; }
        .np-progress .fill { height: 100%; width: 0; background: linear-gradient(90deg, #4facfe, #00f2fe); transition: width .3s; }
        .np-card { width: min(56vmin, 86vw); height: min(36vmin, 54vw); background: #fff; border-radius: 3vmin; box-shadow: 0 10px 30px rgba(0,0,0,.28);
                   display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; flex: none; -webkit-user-select: none; user-select: none; }
        .np-card:active { transform: scale(.97); }
        .np-card .digit { font-size: 24vmin; font-weight: 900; color: var(--np-c1, #667eea); line-height: 1; letter-spacing: .5vmin; }
        .np-card .zy { font-size: 4.6vmin; color: #556; margin-top: .6vmin; min-height: 5vmin; }
        .np-card.q .digit { color: #e0a800; }
        .np-status { color: #fff; font-size: 3vmin; font-weight: 700; text-align: center; min-height: 4vmin; text-shadow: 0 2px 4px rgba(0,0,0,.3); }
        .np-grid { display: none; grid-template-columns: repeat(var(--np-cols, 5), 1fr); gap: 1.2vmin; width: min(96vw, 110vmin); overflow-y: auto; -webkit-overflow-scrolling: touch; padding: .4vmin; min-height: 0; }
        .np-num { background: rgba(255,255,255,.22); border: 2px solid #fff; border-radius: 1.6vmin; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center;
                  min-height: 10vmin; padding: 1vmin .4vmin; cursor: pointer; font-weight: 900; font-size: 5vmin; line-height: 1.1; -webkit-user-select: none; user-select: none; }
        .np-num small { font-size: 2vmin; font-weight: 600; opacity: .9; }
        .np-num.mastered { background: rgba(76,175,80,.55); border-color: #4caf50; }
        .np-num:active { transform: scale(.95); }
        .np-options { display: none; grid-template-columns: 1fr 1fr; gap: 2vmin; width: min(70vmin, 90vw); }
        .np-opt { background: rgba(255,255,255,.3); color: #fff; border: 2px solid #fff; padding: 2.6vmin; border-radius: 2vmin; font-size: 6vmin; font-weight: 900; cursor: pointer; }
        .np-opt:disabled { opacity: .6; }
        .np-opt.correct { background: #4caf50; border-color: #4caf50; animation: np-pulse .5s; }
        .np-opt.wrong { background: #ff5252; border-color: #ff5252; animation: np-shake .5s; }
        @keyframes np-pulse { 50% { transform: scale(1.12); } }
        @keyframes np-shake { 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } }
        .np-actions { display: none; gap: 1.6vmin; flex-wrap: wrap; justify-content: center; }
        .np-actions button { padding: 1.8vmin 3.2vmin; font-size: 2.8vmin; font-weight: 800; border: none; border-radius: 99px; cursor: pointer; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,.2); }
        .np-actions button:active { transform: scale(.95); }
        .np-actions .mic { background: linear-gradient(135deg, #4facfe, #00f2fe); }
        .np-actions .mic.listening { animation: np-listen .6s infinite; }
        @keyframes np-listen { 50% { background: linear-gradient(135deg, #667eea, #764ba2); } }
        .np-actions .ok { background: linear-gradient(135deg, #84fab0, #8fd3f4); color: #223; }
        .np-actions .skip { background: linear-gradient(135deg, #fa709a, #fee140); color: #223; }
        .np-actions .play { background: rgba(255,255,255,.28); border: 2px solid #fff; }
        #fireworks { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1000; }
        .firework { position: absolute; animation: np-fw 2s ease-in forwards; }
        @keyframes np-fw { 0% { opacity: 1; transform: translateY(0) scale(1); } 100% { opacity: 0; transform: translateY(500px) scale(0); } }
        .np-done { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.7); z-index: 2000; align-items: center; justify-content: center; }
        .np-done.show { display: flex; }
        .np-done .box { background: #fff; padding: 5vmin; border-radius: 3vmin; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,.3); }
        .np-done h2 { color: var(--np-c1, #667eea); font-size: 5vmin; margin-bottom: 1.5vmin; }
        .np-done p { color: #333; font-size: 3.6vmin; margin-bottom: 3vmin; }
        .np-done button, .np-done a { display: inline-block; background: linear-gradient(135deg, var(--np-c1, #667eea), var(--np-c2, #764ba2)); color: #fff; padding: 2vmin 4vmin; font-size: 2.8vmin; font-weight: 800; border: none; border-radius: 99px; cursor: pointer; text-decoration: none; margin: 0 .8vmin; }
    `;
    const HTML = `
        <div class="np-modes">
            <button class="np-mode" data-mode="learn">📚 學習</button>
            <button class="np-mode" data-mode="listen">👂 聽音選數</button>
            <button class="np-mode" data-mode="speak">🎤 看數唸出</button>
        </div>
        <div class="np-progress" id="npProgress">第 <span id="npRound">0</span> / <span id="npTotal">10</span> 題<div class="bar"><div class="fill" id="npFill"></div></div></div>
        <div class="np-card" id="npCard"><div class="digit" id="npDigit">0</div><div class="zy" id="npZy"></div></div>
        <div class="np-status" id="npStatus"></div>
        <div class="np-options" id="npOptions"></div>
        <div class="np-actions" id="npLearnActions"><button class="play" id="npPlay">🔊 再聽一次</button><button class="play" id="npNext">⚡ 換一個</button></div>
        <div class="np-actions" id="npSpeakActions"><button class="mic" id="npMic">🎤 我來唸</button><button class="ok" id="npManual">✅ 我會唸</button><button class="skip" id="npSkip">⏭ 跳過</button></div>
        <div class="np-grid" id="npGrid"></div>
        <div id="fireworks"></div>
        <div class="np-done" id="npDone"><div class="box"><h2>🎉 完成了！</h2><p id="npDoneScore"></p><button id="npAgain">🔄 再玩一次</button><a href="../index.html" data-back>🏠 返回選單（按住）</a></div></div>
    `;

    function start(cfg) {
        const numbers = cfg.numbers, rounds = cfg.rounds || 10, storageKey = cfg.storageKey;
        const mount = cfg.mount || document.querySelector('main') || document.body;
        const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
        mount.classList.add('np'); mount.innerHTML = HTML;
        mount.style.setProperty('--np-cols', String(cfg.columns || 5));
        if (typeof initBackLongPress === 'function') initBackLongPress(mount);   // 「🏠 返回選單（按住）」

        let mode = null, cur = null, round = 0, score = 0, queue = [], busy = false, retry = 0, noVoice = 0, seq = 0;
        let mastered = new Set();
        try { mastered = new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')); } catch (e) { /* ignore */ }
        const say = (text, cb) => (typeof speak === 'function' ? speak(text, cb) : Promise.resolve().then(cb));
        const status = t => { $('npStatus').textContent = t || ''; };
        const setScore = () => { const el = $('npScore'); if (el) el.textContent = score; };

        // ---------- 牌卡 ----------
        function showCard(n, hidden) {
            $('npCard').classList.toggle('q', !!hidden);
            $('npDigit').textContent = hidden ? '?' : n.num;
            $('npZy').textContent = hidden ? '' : (n.zhuyin || n.text);
        }
        function sayCurrent(cb) { if (cur) say(cur.text, cb); }

        // ---------- 學習 ----------
        function renderGrid() {
            const g = $('npGrid'); g.innerHTML = '';
            numbers.forEach(n => {
                const c = document.createElement('div'); c.className = 'np-num' + (mastered.has(n.num) ? ' mastered' : '');
                c.innerHTML = '<span>' + n.num + '</span>' + (n.zhuyin ? '<small>' + n.zhuyin + '</small>' : '');
                c.addEventListener('click', () => { cur = n; showCard(n); sayCurrent(); });
                g.appendChild(c);
            });
        }
        function learnNext() { cur = numbers[Math.floor(Math.random() * numbers.length)]; showCard(cur); sayCurrent(); }

        // ---------- 題目序列（聽音選數／看數唸出共用） ----------
        function newQueue() {
            const pool = numbers.slice(); let out = [];
            while (out.length < rounds) { out = out.concat(typeof shuffle === 'function' ? shuffle(pool.slice()) : pool.slice()); }
            queue = out.slice(0, rounds); round = 0; score = 0; setScore();
            $('npTotal').textContent = rounds;
        }
        function progress() { $('npRound').textContent = round; $('npFill').style.width = ((round - 1) / rounds * 100) + '%'; }
        function finish() {
            busy = true; $('npDoneScore').textContent = '得分：' + score + ' 分'; $('npDone').classList.add('show');
            if (typeof createFireworks === 'function') createFireworks(40);
            say('太棒了！你得了' + score + '分！');
        }
        function markMastered(num) { mastered.add(num); try { localStorage.setItem(storageKey, JSON.stringify(Array.from(mastered))); } catch (e) { /* ignore */ } }

        // ---------- 聽音選數 ----------
        function listenNext() {
            if (round >= rounds) { finish(); return; }
            cur = queue[round++]; progress(); busy = false;
            showCard(cur, true); status('聽到幾？按下面的數字');
            const g = $('npOptions'); g.innerHTML = '';
            const opts = [cur]; while (opts.length < 4) { const r = numbers[Math.floor(Math.random() * numbers.length)]; if (!opts.some(o => o.num === r.num)) opts.push(r); }
            (typeof shuffle === 'function' ? shuffle(opts) : opts).forEach(o => {
                const b = document.createElement('button'); b.className = 'np-opt'; b.textContent = o.num;
                b.addEventListener('click', () => answer(b, o)); g.appendChild(b);
            });
            setTimeout(sayCurrent, 400);
        }
        function answer(btn, o) {
            if (busy) return;
            if (o.num === cur.num) {
                busy = true; document.querySelectorAll('.np-opt').forEach(b => { b.disabled = true; });
                btn.classList.add('correct'); score += 10; setScore(); markMastered(cur.num); showCard(cur);
                const praise = typeof getEncouragement === 'function' ? getEncouragement('correct') : '太棒了！';
                status('✨ ' + praise + ' ✨'); if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
                if (typeof createFireworks === 'function') createFireworks(20);
                Promise.all([say(praise), new Promise(r => setTimeout(r, 1800))]).then(listenNext);
            } else {
                btn.classList.add('wrong'); btn.disabled = true; status('再試一次！');
                say('再試一次！'); setTimeout(() => { btn.classList.remove('wrong'); btn.disabled = false; }, 900);
            }
        }

        // ---------- 看數唸出 ----------
        function speakNext() {
            if (round >= rounds) { finish(); return; }
            cur = queue[round++]; progress(); busy = false; retry = 0; noVoice = 0;
            showCard(cur); status('唸出這個數字 🎤'); $('npManual').style.display = '';
            setTimeout(() => listenNow(), 300);     // 自動開始聽，不必按麥克風
        }
        function listenNow() {
            if (mode !== 'speak' || busy || !cur) return;
            if (typeof SpeechGame === 'undefined') { status('這個裝置沒有語音辨識，請按「✅ 我會唸」'); return; }
            const my = ++seq, target = cur.text;
            SpeechGame.listen({
                target: target, button: 'npMic', status: 'npStatus', manualButton: 'npManual',
                onPass: () => { if (my === seq) correct(); },
                onFail: () => {
                    if (my !== seq) return; retry++;
                    SpeechGame.review({ target: target, status: 'npStatus', retryCount: retry, manualButton: 'npManual', messages: { retry: '再唸一次 🎤' } })
                        .then(() => { if (my === seq && mode === 'speak' && !busy) listenNow(); });   // 示範完自動再聽
                },
                onNoVoice: () => {
                    if (my !== seq) return; noVoice++;
                    if (noVoice < 3) setTimeout(() => { if (my === seq && !busy) listenNow(); }, 1000);
                    else status('沒聽到聲音。按一下數字，聽我唸一次 🔊');
                },
                onError: () => { if (my === seq) status('麥克風有問題。按一下數字再聽一次，或按「✅ 我會唸」'); }
            });
        }
        // 按數字／？／螢幕：先示範一次，再自動聽
        function modelThenListen() {
            if (!cur || busy) return;
            seq++; if (typeof SpeechModule !== 'undefined') SpeechModule.stopListening();
            status('聽我唸：' + cur.text);
            say(cur.text, () => { if (mode === 'speak' && !busy) setTimeout(listenNow, 150); });
        }
        function correct() {
            busy = true; seq++; score += 10; setScore(); markMastered(cur.num);
            const done = typeof SpeechGame !== 'undefined' ? SpeechGame.celebrate({ status: 'npStatus', fireworks: 20, manualButton: 'npManual' }) : Promise.resolve();
            Promise.all([done, new Promise(r => setTimeout(r, 1600))]).then(() => { if (mode === 'speak') speakNext(); });
        }

        // ---------- 模式切換（立即開始；開場語在點擊內同步講，iOS 才播得出聲） ----------
        function setMode(m, cue) {
            mode = m; busy = false; seq++;
            if (typeof SpeechModule !== 'undefined') SpeechModule.stopListening();
            document.querySelectorAll('.np-mode').forEach(b => b.classList.toggle('on', b.dataset.mode === m));
            $('npProgress').style.display = m === 'learn' ? 'none' : 'block';
            $('npGrid').style.display = m === 'learn' ? 'grid' : 'none';
            $('npOptions').style.display = m === 'listen' ? 'grid' : 'none';
            $('npLearnActions').style.display = m === 'learn' ? 'flex' : 'none';
            $('npSpeakActions').style.display = m === 'speak' ? 'flex' : 'none';
            $('npDone').classList.remove('show'); status('');
            if (m === 'learn') { renderGrid(); if (cue === false) learnNext(); else { cur = numbers[Math.floor(Math.random() * numbers.length)]; showCard(cur); say('學習！點數字聽發音。', () => sayCurrent()); } }
            else if (m === 'listen') { newQueue(); showCard(numbers[0], true); if (cue === false) listenNext(); else say('聽音選數！', listenNext); }
            else { newQueue(); if (cue === false) speakNext(); else say('看數唸出！', speakNext); }
        }
        document.querySelectorAll('.np-mode').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

        // 牌卡／螢幕：再唸一次（看數唸出：示範後自動聽）
        const repeat = () => { if (!cur || busy) return; if (mode === 'speak') modelThenListen(); else sayCurrent(); };
        $('npCard').addEventListener('click', repeat);
        mount.addEventListener('click', e => { if (e.target === mount || e.target.id === 'npStatus' || e.target.id === 'npProgress') repeat(); });
        $('npPlay').addEventListener('click', () => sayCurrent());
        $('npNext').addEventListener('click', learnNext);
        $('npMic').addEventListener('click', () => { if (mode === 'speak' && !busy) { seq++; SpeechModule.stopListening(); listenNow(); } });
        $('npManual').addEventListener('click', () => {   // 家長按一下：示範一次就算會唸（沒有對話框、不必長按）
            if (mode !== 'speak' || busy || !cur) return; seq++;
            if (typeof SpeechGame !== 'undefined') SpeechGame.manualConfirm(cur.text, correct, { status: 'npStatus', confirm: false });
            else correct();
        });
        $('npSkip').addEventListener('click', () => {
            if (mode !== 'speak' || busy || !cur) return; busy = true; seq++;
            if (typeof SpeechGame !== 'undefined') SpeechGame.skip(cur.text, () => { busy = false; speakNext(); }, { status: 'npStatus' });
            else { busy = false; speakNext(); }
        });
        $('npAgain').addEventListener('click', () => setMode(mode));

        setMode('learn', false);   // 一進來就是學習模式（開場不用語音：iOS 要先有一次點擊才播得出聲；按數字就會唸）
        return { setMode: setMode, get state() { return { mode: mode, cur: cur, round: round, score: score, busy: busy }; } };
    }
    global.NumberPractice = { start: start };
})(typeof window !== 'undefined' ? window : this);
