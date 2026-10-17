// 麥克風測試紀錄（v5.7.6）：設定頁／mic-test 測試成功後記在 localStorage micTestOk，下次進來顯示「上次測試成功」；主選單指引卡第 3 步標示已完成
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const path = require('path');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const wav = path.resolve(__dirname, 'voyage-test.wav');   // 有人聲的假麥克風輸入（循環播放）
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + wav,
           '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 }, permissions: ['microphone'] });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/google|gstatic|network|favicon/.test(m.text())) errors.push('CONSOLE ' + m.text()); });
  page.on('dialog', d => d.accept());
  const rec = () => page.evaluate(() => JSON.parse(localStorage.getItem('micTestOk') || 'null'));

  console.log('設定頁');
  await page.goto(BASE + '/settings.html'); await page.waitForTimeout(600);
  check('沒有紀錄：尚未測試麥克風', (await page.$eval('#micStatus', e => e.textContent.trim())) === '尚未測試麥克風');
  await page.click('#testMicBtn'); await page.waitForTimeout(3000);
  const r1 = await rec();
  check('測試中：記下權限與收音', r1 && r1.items.permission > 0 && r1.items.volume > 0);
  await page.click('#testMicBtn'); await page.waitForTimeout(300);   // 停止
  const s1 = await page.$eval('#micStatus', e => e.textContent);
  check('停止後顯示上次測試成功（不是「測試已停止」）', /上次測試成功/.test(s1) && /收音/.test(s1) && !/已停止/.test(s1));
  await page.reload(); await page.waitForTimeout(600);
  const s2 = await page.$eval('#micStatus', e => e.textContent);
  check('重新進入設定頁仍顯示上次測試成功', /✅ 上次測試成功：\d+\/\d+ \d\d:\d\d/.test(s2) && /可以直接去玩/.test(s2));

  console.log('麥克風診斷頁');
  await page.goto(BASE + '/mic-test.html'); await page.waitForTimeout(600);
  check('第 1、2 項顯示上次成功，第 3、4 項尚未', /上次成功/.test(await page.$eval('#permissionStatus', e => e.textContent)) && /上次成功/.test(await page.$eval('#volumeStatus', e => e.textContent))
    && /尚未/.test(await page.$eval('#speechStatus', e => e.textContent)) && /尚未/.test(await page.$eval('#voiceStatus', e => e.textContent)));
  check('日誌有紀錄', /上次測試成功/.test(await page.$eval('#log', e => e.textContent)));
  await page.click('text=測試麥克風權限'); await page.waitForTimeout(800);
  check('第 1 項重測 → 權限已授予', /權限已授予/.test(await page.$eval('#permissionStatus', e => e.textContent)));
  await page.click('#voiceBtn'); await page.waitForTimeout(6000);
  const r2 = await rec(); const counter = await page.$eval('#voiceCounter', e => e.textContent);
  console.log('    ', counter);
  check('第 4 項人聲偵測：有人聲幀並記下 voice', /人聲幀：[1-9]/.test(counter) && r2 && r2.items.voice > 0);
  await page.click('#voiceBtn'); await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(600);
  check('重新進入：第 4 項顯示上次成功', /上次成功/.test(await page.$eval('#voiceStatus', e => e.textContent)));

  console.log('主選單指引卡');
  await page.goto(BASE + '/index.html'); await page.waitForTimeout(600);
  check('第 3 步標示已完成（日期）', /✅ 已完成（\d+\/\d+ \d\d:\d\d）/.test(await page.$eval('#onbMicDone', e => e.textContent)));
  await page.evaluate(() => { const r = JSON.parse(localStorage.getItem('micTestOk')); delete r.items.voice; localStorage.setItem('micTestOk', JSON.stringify(r)); });
  await page.reload(); await page.waitForTimeout(400);
  check('只測過收音：標示已測過、第 4 項還沒測', /麥克風已測過/.test(await page.$eval('#onbMicDone', e => e.textContent)) && /第 4 項還沒測/.test(await page.$eval('#onbMicDone', e => e.textContent)));

  console.log('沒有紀錄的新裝置');
  const ctx2 = await browser.newContext({ viewport: { width: 1024, height: 900 }, permissions: ['microphone'] });
  const p2 = await ctx2.newPage(); p2.on('pageerror', e => errors.push('PAGEERROR2 ' + e.message));
  await p2.goto(BASE + '/index.html'); await p2.waitForTimeout(400);
  check('指引卡第 3 步沒有標示', (await p2.$eval('#onbMicDone', e => e.textContent)) === '');
  await p2.goto(BASE + '/mic-test.html'); await p2.waitForTimeout(400);
  check('診斷頁四項都尚未', (await p2.$$eval('#permissionStatus, #volumeStatus, #speechStatus, #voiceStatus', es => es.map(e => e.textContent))).every(t => /尚未/.test(t)));

  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
