// 體檢練習（v5.9.0）：色盲圖卡（程式產生的點狀色塊數字）與視力表（E／缺角圓圈 C）——出題、家長 👍 長按、看答案、稱讚、紀錄、選項
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
async function hold(page, sel, ms) { const bb = await (await page.$(sel)).boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(ms); await page.mouse.up(); }
const TTS_STUB = () => {
  window.__tts = [];
  const stub = { speaking: false, pending: false, paused: false, getVoices() { return []; }, cancel() {}, addEventListener() {},
    speak(u) { window.__tts.push({ text: u.text, active: navigator.userActivation.isActive }); setTimeout(() => { try { if (u.onend) u.onend(new Event('end')); } catch (e) {} }, 60); } };
  Object.defineProperty(window, 'speechSynthesis', { value: stub, configurable: true });
};
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/favicon|network/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  await page.addInitScript(TTS_STUB);

  console.log('色盲圖卡');
  await page.goto(BASE + '/exam/color.html'); await page.waitForTimeout(500);
  check('起始遮罩說明家長怎麼問', /這是幾/.test(await page.$eval('#startOverlay', e => e.textContent)));
  await page.click('#startBtn'); await page.waitForTimeout(300);
  const t0 = await page.evaluate(() => window.__tts[0]);
  check('開始：在點擊內同步講開場（iOS 解鎖語音）', t0 && /這是幾/.test(t0.text) && t0.active === true);
  const p1 = await page.evaluate(() => window.__plate);
  check('圖卡：數字為體檢常見數字、點 ≥ 500、數字區有點', [12, 8, 6, 29, 57, 5, 3, 15, 74, 2, 97, 45, 7, 16, 73, 26, 42, 35, 96].indexOf(p1.n) >= 0 && p1.dots >= 500 && p1.fig >= 60);
  check('畫布有畫（非空白）', await page.evaluate(() => { const c = document.getElementById('plate'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let colored = 0; for (let i = 0; i < d.length; i += 64) { if (d[i + 3] > 0 && Math.abs(d[i] - d[i + 1]) > 40) colored++; } return colored > 200; }));
  check('答案未揭示', !(await page.$eval('#answer', e => e.classList.contains('show'))));
  await page.click('#verdict .vbtn.ok'); await page.waitForTimeout(300);
  check('輕按 👍 不算（只提示）', !(await page.$eval('#answer', e => e.classList.contains('show'))) && await page.$eval('#parentHintToast', e => e.style.opacity === '1'));
  const n1 = p1.n;
  await hold(page, '#verdict .vbtn.ok', 1400); await page.waitForTimeout(300);
  const tts1 = await page.evaluate(() => window.__tts.map(x => x.text));
  check('按住 👍 → 顯示數字、稱讚＋「是 N」、煙火', (await page.$eval('#answer', e => e.classList.contains('show') && e.textContent)) === String(n1) && tts1.some(t => new RegExp('是 ' + n1).test(t) && t.length > ('是 ' + n1).length + 2) && (await page.$$eval('#fx .firework', f => f.length)) > 0);
  check('紀錄：答對 1 題', /答對 1 題/.test(await page.$eval('#stats', e => e.textContent)) && (await page.evaluate(() => JSON.parse(localStorage.getItem('exam.color.log')))).some(x => x.n === n1 && x.ok));
  await page.waitForTimeout(3000);
  const p2 = await page.evaluate(() => window.__plate);
  check('稱讚後自動換下一張（數字不同、答案收起）', p2.n !== n1 && !(await page.$eval('#answer', e => e.classList.contains('show'))));
  await page.click('#revealBtn'); await page.waitForTimeout(200);
  const tts2 = await page.evaluate(() => window.__tts.map(x => x.text));
  check('看答案：顯示數字、只唸「是 N」、不稱讚、記為看答案', (await page.$eval('#answer', e => e.textContent)) === String(p2.n) && tts2[tts2.length - 1] === '是 ' + p2.n && /看答案 1 題/.test(await page.$eval('#stats', e => e.textContent)));
  await page.click('#nextBtn'); await page.waitForTimeout(200);
  check('下一張：換題、答案收起', (await page.evaluate(() => window.__plate.n)) !== p2.n && !(await page.$eval('#answer', e => e.classList.contains('show'))));
  await page.click('.seg[data-opt=digits] button[data-v="1"]'); await page.waitForTimeout(200);
  let all1 = true; for (let i = 0; i < 6; i++) { await page.click('#nextBtn'); await page.waitForTimeout(120); if ((await page.evaluate(() => window.__plate.n)) >= 10) all1 = false; }
  check('選「1 位數」→ 都是個位數，選項有存', all1 && (await page.evaluate(() => JSON.parse(localStorage.getItem('exam.color.opts')).digits)) === '1');
  await page.click('.seg[data-opt=source] button[data-v=random]'); await page.click('.seg[data-opt=digits] button[data-v="2"]'); await page.waitForTimeout(200);
  let all2 = true; for (let i = 0; i < 6; i++) { await page.click('#nextBtn'); await page.waitForTimeout(120); const n = await page.evaluate(() => window.__plate.n); if (n < 10 || n > 99) all2 = false; }
  check('隨機＋2 位數 → 都是 10～99', all2);
  await page.click('.seg[data-opt=contrast] button[data-v=clear]'); await page.waitForTimeout(200);
  check('清楚模式有畫（深色數字點）', await page.evaluate(() => { const c = document.getElementById('plate'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let dark = 0; for (let i = 0; i < d.length; i += 64) { if (d[i + 3] > 0 && d[i] < 90 && d[i + 2] > 110) dark++; } return dark > 100; }));
  check('左上「← 返回」長按接線', await page.$eval('a.back', e => e.__lpWired === true));

  console.log('視力表');
  await page.goto(BASE + '/exam/eye.html'); await page.waitForTimeout(500);
  const rows = await page.$$eval('#chart .row', r => r.map(x => x.querySelectorAll('.sym').length));
  check('10 列、每列 1,2,3,4,5,6,7,8,8,8 個符號', rows.join(',') === '1,2,3,4,5,6,7,8,8,8');
  const sizes = await page.$$eval('#chart .row svg', s => s.map(x => parseInt(x.getAttribute('width'), 10)));
  check('由大到小、最小仍 ≥ 12px、表不溢出', sizes[0] > sizes[sizes.length - 1] * 5 && sizes[sizes.length - 1] >= 12 && await page.evaluate(() => { const c = document.getElementById('chart'); return c.scrollHeight <= c.clientHeight + 2; }));
  check('方向隨機（不只一種）', new Set(await page.$$eval('#chart .sym', s => s.map(x => x.dataset.dir))).size >= 2);
  await page.click('#startBtn'); await page.waitForTimeout(300);
  check('開始：在點擊內同步講開場', await page.evaluate(() => window.__tts[0] && /開口朝哪邊/.test(window.__tts[0].text) && window.__tts[0].active === true));
  const target = await page.$eval('.row:nth-child(4) .sym:nth-child(2)', e => e.dataset.dir);
  await page.click('.row:nth-child(4) .sym:nth-child(2)'); await page.waitForTimeout(300);
  check('點符號 → 放大、同方向、判定列出現', await page.$eval('#focus', e => e.classList.contains('show')) && (await page.$eval('#focusSym svg', e => e.dataset.dir)) === target && await page.$eval('#verdict', e => e.classList.contains('show')) && await page.$eval('.row:nth-child(4) .sym:nth-child(2)', e => e.classList.contains('cur')));
  const NAME = { up: '上', down: '下', left: '左', right: '右' };
  await hold(page, '#verdict .vbtn.ok', 1400); await page.waitForTimeout(300);
  const tts3 = await page.evaluate(() => window.__tts.map(x => x.text));
  check('按住 👍 → 箭頭＋「開口朝X」、稱讚、煙火、符號打勾', (await page.$eval('#arrowBox', e => e.classList.contains('show'))) && (await page.$eval('#arrowText', e => e.textContent)) === '開口朝' + NAME[target] && tts3.some(t => new RegExp('開口朝' + NAME[target] + '！').test(t) && t.length > 6) && (await page.$$eval('#fx .firework', f => f.length)) > 0 && await page.$eval('.row:nth-child(4) .sym:nth-child(2)', e => e.classList.contains('done')));
  await page.waitForTimeout(2800);
  check('稱讚後回到視力表、紀錄答對 1', !(await page.$eval('#focus', e => e.classList.contains('show'))) && (await page.evaluate(() => JSON.parse(localStorage.getItem('exam.eye.log')))).filter(x => x.ok).length === 1);
  await page.click('.seg[data-opt=type] button[data-v=C]'); await page.waitForTimeout(300);
  check('切換缺角圓圈 C：表重畫為圓弧、問句改「缺口」', (await page.$$eval('#chart .sym svg path', p => p.every(x => /A2 2/.test(x.getAttribute('d')) && x.getAttribute('stroke') === 'currentColor'))) && (await page.$eval('#fqText', e => e.textContent)) === '缺口朝哪邊？');
  await page.click('.row:nth-child(1) .sym'); await page.waitForTimeout(300);
  check('放大的 C 看得到（有描邊）', await page.$eval('#focusSym svg path', e => getComputedStyle(e).stroke !== 'none' && getComputedStyle(e).stroke !== ''));
  await page.click('#revealBtn'); await page.waitForTimeout(200);
  check('看答案：「缺口朝X」、不稱讚', /^缺口朝[上下左右]$/.test(await page.$eval('#arrowText', e => e.textContent)) && /^缺口朝[上下左右]$/.test((await page.evaluate(() => window.__tts[window.__tts.length - 1].text))));
  await page.click('#closeFocus'); await page.waitForTimeout(200);
  check('✕ 回視力表', !(await page.$eval('#focus', e => e.classList.contains('show'))) && !(await page.$eval('#verdict', e => e.classList.contains('show'))));
  const before = await page.$$eval('#chart .sym', s => s.map(x => x.dataset.dir).join(''));
  await page.click('#shuffleBtn'); await page.waitForTimeout(200);
  check('換一張表 → 方向重抽', (await page.$$eval('#chart .sym', s => s.map(x => x.dataset.dir).join(''))) !== before);
  await page.click('.seg[data-opt=mode] button[data-v=big]'); await page.waitForTimeout(300);
  check('大圖練習：直接出一個大符號、無「回視力表」', await page.$eval('#focus', e => e.classList.contains('show')) && await page.$eval('#closeFocus', e => e.style.display === 'none'));
  const d1 = await page.$eval('#focusSym svg', e => e.dataset.dir);
  await page.click('#nextBtn'); await page.waitForTimeout(200);
  let changed = (await page.$eval('#focusSym svg', e => e.dataset.dir)) !== d1;
  for (let i = 0; i < 5 && !changed; i++) { await page.click('#nextBtn'); await page.waitForTimeout(100); changed = (await page.$eval('#focusSym svg', e => e.dataset.dir)) !== d1; }
  check('大圖：下一個換符號', changed);
  await page.reload(); await page.waitForTimeout(400);
  check('選項記住（C、大圖）', await page.$eval('.seg[data-opt=type] button[data-v=C]', e => e.classList.contains('on')) && await page.$eval('.seg[data-opt=mode] button[data-v=big]', e => e.classList.contains('on')));

  console.log('主選單');
  await page.goto(BASE + '/index.html'); await page.waitForTimeout(300);
  check('主選單有兩張體檢練習卡', (await page.$$eval('a[href="exam/color.html"], a[href="exam/eye.html"]', a => a.length)) === 2);
  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
