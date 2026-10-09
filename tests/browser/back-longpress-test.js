// 返回鈕長按測試（v5.6.2）：輕按不離開且顯示提示；按住 1.2 秒才回上一頁（遊戲頁、關卡頁、說話板）
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
let pass = 0, fail = 0; const errors = [];
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, permissions: ['microphone'] });   // 說話板按「開始」要開麥克風
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message));
  page.on('dialog', d => d.accept());
  const cases = [
    { url: '/level1/games/shooting.html', sel: 'a.back-btn', to: '/level1/index.html' },
    { url: '/level0/index.html', sel: '#stageMenu a.back-btn', to: '/index.html' },
    { url: '/level0/index.html', sel: 'button.back-btn', to: '/level0/index.html', pre: '#stage1Card', after: () => document.getElementById('stageMenu').className.indexOf('hidden') < 0 },   // 階段內的返回＝goHome() 回階段選單
    { url: '/level2/index.html', sel: 'a.back-btn', to: '/index.html' },
    { url: '/board/index.html?set=iwant', sel: 'header a.back', to: '/index.html', pre: '#startBtn' },   // 起始遮罩蓋住表頭，先按開始
    { url: '/voyage/index.html', sel: 'a.back-btn', to: '/index.html' }
  ];
  for (const c of cases) {
    await page.goto(BASE + c.url); await page.waitForTimeout(600);
    if (c.pre) { await page.click(c.pre); await page.waitForTimeout(500); }
    let el = null; for (const cand of await page.$$(c.sel)) { if (await cand.isVisible()) { el = cand; break; } }
    if (!el) el = await page.$(c.sel);
    if (!el) { check(c.url + ' 找到返回鈕', false); continue; }
    if (!(await el.isVisible())) {   // 有些遊戲有起始遮罩，先按開始
      const sb = await page.$('#startOverlay .start-btn, #startOverlay button, #startBtn'); if (sb) { await sb.click(); await page.waitForTimeout(500); }
      el = await page.$(c.sel);
    }
    if (!(await el.isVisible())) { check(c.url + '：返回鈕可見', false); continue; }
    await el.click({ force: true }); await page.waitForTimeout(400);
    const stayed = new URL(page.url()).pathname === c.url.split('?')[0];
    const hint = await page.$eval('#parentHintToast', e => e.style.opacity === '1' && /按住/.test(e.textContent)).catch(() => false);
    check(c.url + '：輕按不離開且顯示提示', stayed && hint);
    const bb = await el.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(1400); await page.mouse.up();
    await page.waitForLoadState('load').catch(() => {}); await page.waitForTimeout(300);
    check(c.url + '：長按回 ' + c.to, new URL(page.url()).pathname === c.to && (!c.after || await page.evaluate(c.after)));
  }
  console.log('錯誤：', errors.length ? errors : '無');
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
