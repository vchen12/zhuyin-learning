// 合成測試音軌：安靜 → 說詞 → 敲擊 → 說詞 …（48kHz 16-bit mono WAV）
const fs = require('fs');
const SR = 48000;
let seed = 4242; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
const segs = []; // {ms, fn(t)}
const quiet = ms => segs.push({ ms, fn: () => 0.0015 * rnd() });
const word = (ms, f0) => segs.push({ ms, fn: (t, i, n) => { const env = Math.min(1, i / (0.03 * SR), (n - i) / (0.05 * SR)); let s = 0; for (let k = 1; k <= 10; k++) s += Math.sin(2 * Math.PI * k * f0 * t + k) / k; return 0.12 * env * s * 0.5 + 0.0015 * rnd(); } });
const tap = () => segs.push({ ms: 60, fn: (t) => { const env = Math.exp(-t / 0.008); return 0.35 * env * (Math.sin(2 * Math.PI * 300 * t) + 0.8 * rnd()); } });
const taps = (n, gapMs) => { for (let i = 0; i < n; i++) { tap(); quiet(gapMs); } };

const mode = process.argv[2] || 'voyage';
if (mode === 'dudu') {
    // 兩音節短詞（嘟嘟／出發）：母音各 120ms、中間 80ms 不發聲的子音；之前只算有聲幀 ≥250ms 抵不了港
    quiet(1500);
    word(120, 300); quiet(80); word(120, 300);   // 1.5–1.82 → 說完 ≈2.3 → 航行動畫 → 抵港 ≈3.3，卡片到 ≈6.5
    quiet(5680);
    word(110, 320); quiet(90); word(110, 320);   // 7.5–7.81 第二個詞（卡片結束後）→ 抵港 ≈9.5
    quiet(3000);
} else if (mode === 'board') {
    // 說話板：一句四字固定句（≥660ms）→ 應得到報酬
    quiet(1500);
    word(500, 300);               // 1.5–2.0 「我要」
    quiet(800);                   //      停頓
    word(450, 300);               // 2.8–3.25 「尿尿」
    quiet(6000);
} else {
    // 時間軸（秒，相對 getUserMedia 開始）。說完（靜音 0.45s）→ 航行動畫（≤1.2s）→ 港口卡片 3.2s（期間忽略麥克風），敲擊段刻意放在卡片結束後。
    quiet(1500);                  // 0.0–1.5   安靜（校準）
    word(450, 320);               // 1.5–1.95  詞 1 → 說完 2.4 → 抵港 ≈3.2，卡片至 ≈6.4
    quiet(5150);                  //      –7.1
    taps(12, 100);                // 7.1–9.0   連續敲 12 下（卡片已結束）→ 船不得動
    quiet(400);                   //      –9.4
    word(500, 300);               // 9.4–9.9   詞 2 → 抵港 ≈11.2，卡片至 ≈14.4
    quiet(5000);                  //      –14.9
    word(120, 320);               // 14.9–15.02 太短的哼聲 → 不抵港
    quiet(680);                   //      –15.7
    word(600, 340);               // 15.7–16.3 詞 3 → 抵港 ≈17.5，卡片至 ≈20.7
    quiet(5200);                  //      –21.5
    word(450, 320);               // 21.5–21.95 詞 4 → 抵港 ≈23.2，卡片至 ≈26.4
    quiet(5050);                  //      –27.0
    word(1600, 310);              // 27.0–28.6 長句 → 詞 5（發聲 1.4s 走完航段）→ 抵港 ≈29.2 → 終點 ≈32.4
    quiet(5000);
}

const total = segs.reduce((a, s) => a + Math.round(s.ms / 1000 * SR), 0);
const pcm = new Int16Array(total);
let pos = 0;
for (const s of segs) { const n = Math.round(s.ms / 1000 * SR); for (let i = 0; i < n; i++) { const v = s.fn(i / SR, i, n); pcm[pos++] = Math.max(-1, Math.min(1, v)) * 32767; } }
const buf = Buffer.alloc(44 + pcm.length * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + pcm.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(pcm.length * 2, 40);
Buffer.from(pcm.buffer).copy(buf, 44);
const outName = mode === 'board' ? 'board-test.wav' : mode === 'dudu' ? 'dudu-test.wav' : 'voyage-test.wav';
fs.writeFileSync(outName, buf);
console.log(outName, '長度', (total / SR).toFixed(1), '秒');
