// 測試二：端到端會話 —— 假麥克風 + 假辨識引擎，驗證判定流程
const SR_RATE = 48000, N = 2048;
let seed = 777;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
function voiceFrame(f0, amp) {
    const b = new Float32Array(N);
    for (let i = 0; i < N; i++) { const t = i / SR_RATE; let s = 0; for (let k = 1; k <= 10; k++) s += Math.sin(2 * Math.PI * k * f0 * t + k) / k; b[i] = amp * s * 0.5 + 0.0015 * rnd(); }
    return b;
}
function tapFrame(amp) { // 300Hz 阻尼共振 τ=8ms + 寬頻
    const b = new Float32Array(N);
    for (let i = 0; i < N; i++) { const t = i / SR_RATE; const env = Math.exp(-t / 0.008); b[i] = amp * env * (Math.sin(2 * Math.PI * 300 * t) + 0.8 * rnd()) + 0.0015 * rnd(); }
    return b;
}
function quietFrame() { const b = new Float32Array(N); for (let i = 0; i < N; i++) b[i] = 0.0015 * rnd(); return b; }

// ---- 假瀏覽器環境 ----
let frameProvider = () => quietFrame();
const fakeAnalyser = { fftSize: 2048, frequencyBinCount: 1024, smoothingTimeConstant: 0,
    getFloatTimeDomainData(buf) { buf.set(frameProvider()); }, getByteFrequencyData(b) { b.fill(0); } };
globalThis.AudioContext = class { constructor() { this.sampleRate = SR_RATE; this.state = 'running'; } createMediaStreamSource() { return { connect() {} }; } createAnalyser() { return fakeAnalyser; } async resume() {} };
Object.defineProperty(globalThis, 'navigator', { value: { mediaDevices: { getUserMedia: async () => ({}) } }, configurable: true, writable: true });
globalThis.MediaRecorder = class { static isTypeSupported() { return false; } constructor() { this.state = 'inactive'; } start() { this.state = 'recording'; } stop() { this.state = 'inactive'; if (this.onstop) this.onstop(); } };
globalThis.URL = globalThis.URL || {}; URL.createObjectURL = () => 'blob:x'; URL.revokeObjectURL = () => {};
globalThis.speechSynthesis = { cancel() {}, speaking: false };
globalThis.requestAnimationFrame = () => 0; globalThis.cancelAnimationFrame = () => {};
const store = {}; globalThis.localStorage = { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };

// 假辨識引擎：可腳本化
let srScript = null; // { text, finalAtMs } 或 null（不回傳任何結果）
let srInstances = 0;
class FakeSR {
    constructor() { srInstances++; this._t = null; }
    start() { if (this.onstart) this.onstart();
        if (srScript) this._t = setTimeout(() => { const alt = { transcript: srScript.text }; const res = [alt]; res.isFinal = true; if (this.onresult) this.onresult({ results: [res] }); }, srScript.finalAtMs); }
    stop() { clearTimeout(this._t); setTimeout(() => this.onend && this.onend(), 40); }
    abort() { clearTimeout(this._t); setTimeout(() => this.onend && this.onend(), 40); }
}
globalThis.webkitSpeechRecognition = FakeSR;

// 真正的 config.js 與模組
Object.assign(globalThis, require(require('path').join(__dirname, '../js/config.js')));
require(require('path').join(__dirname, '../js/speech-recognition.js'));
const SM = globalThis.SpeechModule;
console.log = () => {}; console.warn = () => {}; // 靜音模組 log
const out = (...a) => process.stdout.write(a.join(' ') + '\n');

function run(name, { threshold, target, timeline, sr, expect, setup }) {
    return new Promise(async (resolve) => {
        store.similarityThreshold = String(threshold);
        srScript = sr || null;
        await SM.init();
        const t0 = Date.now();
        if (setup) setup(t0);
        frameProvider = () => { const ms = Date.now() - t0; for (const seg of timeline) if (ms >= seg[0] && ms < seg[1]) return seg[2](); return quietFrame(); };
        let voiceDetectedAt = null, calls = [];
        const finish = (kind, payload) => {
            calls.push(kind);
            const elapsed = Date.now() - t0;
            setTimeout(() => { // 稍等，確認沒有第二次回呼
                const ok = expect(kind, payload, elapsed, voiceDetectedAt) && calls.length === 1;
                out(`${ok ? '✅' : '❌'} ${name}\n     → ${kind} passed=${payload.passed} basis=${payload.basis || '-'} hadVoice=${payload.hadVoice} noiseOnly=${payload.noiseOnly} voicedMs=${payload.voicedMs} 文字="${payload.transcript}" 相似=${Math.round(payload.similarity)} 耗時=${elapsed}ms 人聲確認@${voiceDetectedAt}ms 回呼次數=${calls.length}`);
                resolve(ok);
            }, 300);
        };
        SM.startListening(target, {
            onVoiceDetected: () => { voiceDetectedAt = Date.now() - t0; },
            onResult: r => finish('onResult', r),
            onTimeout: i => finish('onTimeout', Object.assign({ passed: false }, i)),
            onError: e => finish('onError', { error: e })
        });
    });
}

(async () => {
    const V = () => voiceFrame(320, 0.08), T = () => tapFrame(0.3);
    const results = [];
    // 敲擊：每 120ms 敲一下（脈衝佔 1 幀），持續 3 秒
    const taps = []; for (let t = 200; t < 3200; t += 120) taps.push([t, t + 26, T]);

    results.push(await run('A 鼓勵模式：連續敲螢幕 3 秒，不說話 → 不得過關，且提示「不是說話聲」',
        { threshold: 0, target: 'ㄅ', timeline: taps,
          expect: (k, p) => k === 'onTimeout' && p.passed === false && p.hadVoice === false && p.noiseOnly === true }));

    results.push(await run('B 鼓勵模式：說「ㄅ」約 400ms → 立即過關（< 900ms）',
        { threshold: 0, target: 'ㄅ', timeline: [[300, 700, V]],
          expect: (k, p, el, vd) => k === 'onResult' && p.passed && p.basis === 'voice' && el < 900 && vd !== null && vd < 500 }));

    results.push(await run('C 鼓勵模式：電視聲被辨識成文字、但沒有人聲 → 不得過關',
        { threshold: 0, target: 'ㄅ', timeline: [], sr: { text: '今天天氣真好', finalAtMs: 800 },
          expect: (k, p) => k === 'onTimeout' && p.passed === false && p.hadVoice === false }));

    results.push(await run('D 練習模式(50) 詞「爸爸」：說話 + 辨識命中 → 過關 (asr)',
        { threshold: 50, target: '爸爸', timeline: [[300, 1000, V]], sr: { text: '爸爸', finalAtMs: 900 },
          expect: (k, p, el) => k === 'onResult' && p.passed && p.basis === 'asr' && el < 1300 }));

    results.push(await run('E 練習模式(50) 詞「爸爸」：說話但辨識成「媽媽」→ 不過，回報有說話，說完約 1 秒內回應',
        { threshold: 50, target: '爸爸', timeline: [[300, 1000, V]], sr: { text: '媽媽', finalAtMs: 5000 },
          expect: (k, p, el) => k === 'onResult' && p.passed === false && p.hadVoice === true && el < 2600 }));

    results.push(await run('F 練習模式(50) 單音節「ㄅ」：說話、辨識無結果 → hybrid 以人聲過關',
        { threshold: 50, target: 'ㄅ', timeline: [[300, 650, V]], sr: null,
          expect: (k, p, el) => k === 'onResult' && p.passed && p.basis === 'voice' && el < 2600 }));

    results.push(await run('G 鼓勵模式：完全安靜 → 超時，提示「沒聽到聲音」（非敲打）',
        { threshold: 0, target: 'ㄅ', timeline: [],
          expect: (k, p) => k === 'onTimeout' && p.hadVoice === false && p.noiseOnly === false }));

    results.push(await run('H 鼓勵模式：敲一下後再說「ㄅ」→ 過關（敲擊不應阻擋真發聲）',
        { threshold: 0, target: 'ㄅ', timeline: [[200, 226, T], [600, 1000, V]],
          expect: (k, p) => k === 'onResult' && p.passed && p.basis === 'voice' }));

    results.push(await run('I 鼓勵模式：系統 TTS「請大聲唸」播 900ms（喇叭聲有基頻）→ 不得因此過關；TTS 結束後孩子說「ㄅ」→ 過關',
        { threshold: 0, target: 'ㄅ', timeline: [[0, 900, () => voiceFrame(210, 0.12)], [1300, 1700, V]],
          setup: () => { globalThis.speechSynthesis.speaking = true; setTimeout(() => { globalThis.speechSynthesis.speaking = false; }, 900); },
          expect: (k, p, el, vd) => k === 'onResult' && p.passed && p.basis === 'voice' && vd !== null && vd > 1300 && el > 1400 }));

    results.push(await run('J 鼓勵模式：TTS 播音期間孩子沒說話，之後也沒說 → 超時、不過關',
        { threshold: 0, target: 'ㄅ', timeline: [[0, 900, () => voiceFrame(210, 0.12)]],
          setup: () => { globalThis.speechSynthesis.speaking = true; setTimeout(() => { globalThis.speechSynthesis.speaking = false; }, 900); },
          expect: (k, p) => k === 'onTimeout' && p.hadVoice === false }));

    const n = results.filter(Boolean).length;
    out(`\n${n}/${results.length} 情境通過`);
    process.exit(n === results.length ? 0 : 1);
})();
