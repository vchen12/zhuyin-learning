// 合成測試音軌：安靜 → 說詞 → 敲擊 → 說詞 …（48kHz 16-bit mono WAV）
const fs = require('fs');
const SR = 48000;
let seed = 4242; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 * 2 - 1; };
const segs = []; // {ms, fn(t)}
const quiet = ms => segs.push({ ms, fn: () => 0.0015 * rnd() });
const word = (ms, f0) => segs.push({ ms, fn: (t, i, n) => { const env = Math.min(1, i / (0.03 * SR), (n - i) / (0.05 * SR)); let s = 0; for (let k = 1; k <= 10; k++) s += Math.sin(2 * Math.PI * k * f0 * t + k) / k; return 0.12 * env * s * 0.5 + 0.0015 * rnd(); } });
const tap = () => segs.push({ ms: 60, fn: (t) => { const env = Math.exp(-t / 0.008); return 0.35 * env * (Math.sin(2 * Math.PI * 300 * t) + 0.8 * rnd()); } });
const taps = (n, gapMs) => { for (let i = 0; i < n; i++) { tap(); quiet(gapMs); } };

// 時間軸（秒，相對 getUserMedia 開始）。港口卡片會佔 3.2 秒（期間忽略麥克風），敲擊段刻意放在卡片結束後。
quiet(1500);                  // 0.0–1.5   安靜（校準）
word(450, 320);               // 1.5–1.95  詞 1 → 抵港 ≈2.4，卡片至 ≈5.6
quiet(3950);                  //      –5.9
taps(12, 100);                // 5.9–7.8   連續敲 12 下（卡片已結束）→ 船不得動
quiet(400);                   //      –8.2
word(500, 300);               // 8.2–8.7   詞 2 → 抵港 ≈9.2，卡片至 ≈12.4
quiet(4000);                  //      –12.7
word(120, 320);               // 12.7–12.82 太短的哼聲 → 不抵港
quiet(680);                   //      –13.5
word(600, 340);               // 13.5–14.1 詞 3 → 抵港 ≈14.6，卡片至 ≈17.8
quiet(3900);                  //      –18.0
word(450, 320);               // 18.0–18.45 詞 4 → 抵港 ≈18.9，卡片至 ≈22.1
quiet(3850);                  //      –22.3
word(1600, 310);              // 22.3–23.9 長句 → 詞 5 → 終點
quiet(3000);

const total = segs.reduce((a, s) => a + Math.round(s.ms / 1000 * SR), 0);
const pcm = new Int16Array(total);
let pos = 0;
for (const s of segs) { const n = Math.round(s.ms / 1000 * SR); for (let i = 0; i < n; i++) { const v = s.fn(i / SR, i, n); pcm[pos++] = Math.max(-1, Math.min(1, v)) * 32767; } }
const buf = Buffer.alloc(44 + pcm.length * 2);
buf.write('RIFF', 0); buf.writeUInt32LE(36 + pcm.length * 2, 4); buf.write('WAVE', 8); buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
buf.write('data', 36); buf.writeUInt32LE(pcm.length * 2, 40);
Buffer.from(pcm.buffer).copy(buf, 44);
fs.writeFileSync('voyage-test.wav', buf);
console.log('wav 長度', (total / SR).toFixed(1), '秒');
