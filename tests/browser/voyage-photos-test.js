// 郵輪照片儲存測試（v5.6.1）：裁切後存 IndexedDB、舊 dataURL 自動搬移、重開仍在、⚓ 家長設定鈕、?setup=1、← 返回
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const IMG = path.resolve(__dirname, 'board-reward.png');
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', d => { errors.push('DIALOG ' + d.message().slice(0, 60)); d.accept(); });
  // 舊資料：localStorage 直接塞 dataURL（1x1 JPEG）
  const tiny = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
  await page.addInitScript((tiny) => {
    if (localStorage.getItem('__seeded')) return;
    localStorage.setItem('voyage.data', JSON.stringify({ ship: tiny, ports: [{ name: '基隆', imgs: [tiny, tiny] }], words: ['郵輪'] }));
    localStorage.setItem('__seeded', '1');
  }, tiny);
  await page.goto(BASE + '/voyage/index.html'); await page.waitForTimeout(900);
  console.log('舊資料搬移');
  const d1 = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.data')));
  check('localStorage 只剩參照（idb:voyage/…）', /^idb:voyage\/ship$/.test(d1.ship) && d1.ports[0].imgs.length === 2 && d1.ports[0].imgs.every(r => /^idb:voyage\/p0\//.test(r)));
  check('localStorage 體積小', (await page.evaluate(() => localStorage.getItem('voyage.data').length)) < 2000);
  const idbCount = await page.evaluate(() => new Promise(res => { const r = indexedDB.open('zhuyin-media', 1); r.onsuccess = () => { const c = r.result.transaction('media').objectStore('media').count(); c.onsuccess = () => res(c.result); }; }));
  check('IndexedDB 有 3 筆', idbCount === 3);
  check('船圖顯示（objectURL）', await page.$eval('#shipPhoto', e => e.style.display === 'block' && e.src.indexOf('blob:') === 0));
  check('左上「← 返回」、右上 ⚓、沒有 🏠', await page.$eval('.back-btn', e => e.textContent.trim() === '← 返回' && e.getAttribute('href') === '../index.html') && (await page.$('#home')) === null && await page.$eval('#anchor', e => getComputedStyle(e).right !== 'auto'));
  console.log('起始畫面 ⚓ 家長設定（長按才開，輕按只提示）');
  await page.click('#setupBtn'); await page.waitForTimeout(300);
  check('輕按不開面板、顯示提示', !(await page.$eval('#parentPanel', e => e.classList.contains('show'))) && await page.$eval('#parentHintToast', e => e.style.opacity === '1' && /按住/.test(e.textContent)));
  { const bb = await (await page.$('#setupBtn')).boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(1400); await page.mouse.up(); await page.waitForTimeout(300); }
  const p0thumbs = await page.$$eval('#portSlots .slot:first-child .thumbs img', i => i.map(x => x.src.indexOf('blob:') === 0));   // 其他港口可能有本機 manifest 的網址照片
  check('面板開啟、基隆兩張縮圖用 blob', await page.$eval('#parentPanel', e => e.classList.contains('show')) && p0thumbs.length === 2 && p0thumbs.every(Boolean));
  // 加一張到港口 2（日本福岡）
  const inputs = await page.$$('#portSlots input[type=file]');
  await inputs[1].setInputFiles(IMG); await page.waitForTimeout(700);
  check('出現裁切框', await page.$eval('#photoCropModal', e => getComputedStyle(e).display !== 'none'));
  await page.click('#photoCropModal >> text=確認'); await page.waitForTimeout(700);
  const d2 = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.data')));
  check('福岡多一張且為 idb 參照', d2.ports[1].imgs.length === 1 && /^idb:voyage\/p1\//.test(d2.ports[1].imgs[0]));
  // 刪基隆第一張
  await page.click('#portSlots .del >> nth=0'); await page.waitForTimeout(400);
  const d3 = await page.evaluate(() => JSON.parse(localStorage.getItem('voyage.data')));
  const idbCount2 = await page.evaluate(() => new Promise(res => { const r = indexedDB.open('zhuyin-media', 1); r.onsuccess = () => { const c = r.result.transaction('media').objectStore('media').count(); c.onsuccess = () => res(c.result); }; }));
  check('刪除後 localStorage 與 IndexedDB 都少一筆', d3.ports[0].imgs.length === 1 && idbCount2 === 3);
  await page.click('#closePanel'); await page.waitForTimeout(200);
  console.log('重開頁面');
  await page.reload(); await page.waitForTimeout(900);
  check('重開後船圖與港口照片都還在', await page.$eval('#shipPhoto', e => e.style.display === 'block' && e.src.indexOf('blob:') === 0) && (await page.evaluate(() => Object.keys(media).length)) === 3);
  await page.goto(BASE + '/voyage/index.html?setup=1'); await page.waitForTimeout(900);
  check('?setup=1 直接開家長面板', await page.$eval('#parentPanel', e => e.classList.contains('show')));
  console.log('說話板 setup 與返回');
  await page.goto(BASE + '/board/index.html?set=iwant&setup=1'); await page.waitForTimeout(900);
  check('說話板 ?setup=1 開面板、返回文字一致', await page.$eval('#panel', e => e.classList.contains('show')) && await page.$eval('header .back', e => e.textContent.trim() === '← 返回'));
  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
