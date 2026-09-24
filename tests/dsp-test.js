// 測試一：幀分析 —— 合成訊號分類
require(require('path').join(__dirname, '../js/speech-recognition.js'));
const { analyzeFrame, classifyFrame, SENSITIVITY, F0_MIN, F0_MAX } = globalThis.SpeechModule.__dsp;
const SR = 48000, N = 2048;
let seed = 12345;
const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };

function voice(f0, amp, noiseAmp = 0, vibrato = 0) {
    const b = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        const t = i / SR;
        const f = f0 * (1 + vibrato * Math.sin(2 * Math.PI * 5 * t));
        let s = 0;
        for (let k = 1; k <= 10; k++) s += Math.sin(2 * Math.PI * k * f * t + k) / k;  // 諧波列，1/k 衰減
        b[i] = amp * s * 0.5 + noiseAmp * rnd();
    }
    return b;
}
function whiteBurst(amp, lenSamples = N) {
    const b = new Float32Array(N);
    for (let i = 0; i < Math.min(N, lenSamples); i++) b[i] = amp * rnd();
    return b;
}
function tapResonance(freq, amp, tauMs) {
    // 敲擊：短促寬頻脈衝 + 機殼阻尼共振
    const b = new Float32Array(N);
    for (let i = 0; i < N; i++) {
        const t = i / SR;
        const env = Math.exp(-t / (tauMs / 1000));
        b[i] = amp * env * (Math.sin(2 * Math.PI * freq * t) + 0.8 * rnd());
    }
    return b;
}
function silence(amp) { return whiteBurst(amp); }

const s = SENSITIVITY.normal;
const gate = 0.005 * 1; // 假設安靜環境 → gate = rmsFloor
const isVoiced = (a) => classifyFrame(a, gate, s, false);

const cases = [
    ['幼兒母音 320Hz', voice(320, 0.1), true],
    ['幼兒母音 450Hz（高音）', voice(450, 0.08), true],
    ['幼兒 320Hz + 顫音', voice(320, 0.1, 0, 0.03), true],
    ['幼兒 320Hz + 電視噪音 (SNR≈10dB)', voice(320, 0.1, 0.03), true],
    ['幼兒 小聲 320Hz (amp 0.02)', voice(320, 0.02), true],
    ['成人男 110Hz', voice(110, 0.1), true],
    ['成人女 220Hz', voice(220, 0.1), true],
    ['敲螢幕：白噪脈衝 (全窗)', whiteBurst(0.2), false],
    ['敲螢幕：白噪脈衝 (10ms)', whiteBurst(0.4, 480), false],
    ['敲螢幕：1500Hz 機殼共振 τ=5ms', tapResonance(1500, 0.3, 5), false],
    ['敲桌：300Hz 阻尼共振 τ=8ms', tapResonance(300, 0.3, 8), false],
    ['拍打：低頻悶響 55Hz τ=30ms', tapResonance(55, 0.3, 30), false],
    ['拍手：寬頻脈衝 τ=3ms', tapResonance(4000, 0.6, 3), false],
    ['雙擊：兩個脈衝相隔 15ms', (()=>{const b=new Float32Array(N);for(let i=0;i<N;i++){const t=i/SR;const e1=Math.exp(-t/0.004);const t2=t-0.015;const e2=t2>0?Math.exp(-t2/0.004):0;b[i]=0.4*(e1+e2)*rnd();}return b;})(), false],
    ['60Hz 電源哼聲（大聲）', voice(60, 0.1), false],
    ['母音起音幀（後半才有聲）', (()=>{const v=voice(320,0.1);for(let i=0;i<N/2;i++)v[i]*=i/(N/2);return v;})(), true],
    ['母音尾音幀（前半有聲、後半消失）', (()=>{const v=voice(320,0.1);for(let i=0;i<N;i++)v[i]*=Math.max(0,1-i/(N*0.6));return v;})(), false],
    ['環境安靜 (rms≈0.001)', silence(0.002), false],
    ['環境噪音 (rms≈0.01)', silence(0.017), false],
];

let pass = 0;
for (const [name, buf, expectVoiced] of cases) {
    const a = analyzeFrame(buf, SR);
    const v = isVoiced(a);
    const ok = v === expectVoiced;
    pass += ok;
    console.log(`${ok ? '✅' : '❌'} ${name.padEnd(30)} rms=${a.rms.toFixed(4)} clarity=${a.clarity.toFixed(2)} f0=${a.f0.toFixed(0).padStart(4)}Hz decay=${a.decay.toFixed(1).padStart(5)} → ${v ? '人聲' : '非人聲'}`);
}
console.log(`\n${pass}/${cases.length} 通過`);
// 效能：每幀耗時
const t0 = process.hrtime.bigint();
for (let i = 0; i < 400; i++) analyzeFrame(voice(320, 0.1), SR);
const us = Number(process.hrtime.bigint() - t0) / 400 / 1000;
console.log(`每幀分析耗時 ≈ ${us.toFixed(0)} µs（含合成），預算 25000 µs`);
process.exit(pass === cases.length ? 0 : 1);
