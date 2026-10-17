// 可視高度測試（v5.7.5）：每一頁的全螢幕高度要等於瀏覽器實際可視高度（--vh 由 config.js 設定），不多出一截
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const PAGES = ['/index.html', '/level1/index.html', '/level1/games/shooting.html', '/level2/games/drag-match.html', '/level3/games/racing.html', '/level0/index.html', '/settings.html', '/voyage/index.html', '/board/index.html?set=iwant'];
let pass = 0, fail = 0;
function check(n, c) { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n); } }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--no-sandbox', '--disable-gpu'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 700 } });   // 刻意用非典型高度
  const page = await ctx.newPage();
  for (const p of PAGES) {
    await page.goto(BASE + p); await page.waitForTimeout(400);
    const r = await page.evaluate(() => {
      const vh = getComputedStyle(document.documentElement).getPropertyValue('--vh').trim();
      // 找出用了 --vh 的那個元素（body 或容器），量它的高度
      const els = [document.body, ...document.querySelectorAll('body > *')];
      const h = els.map(e => e.getBoundingClientRect().height);
      return { vh, innerH: window.innerHeight, bodyH: document.body.getBoundingClientRect().height, maxH: Math.max.apply(null, h), docH: document.documentElement.scrollHeight };
    });
    check(p + '：--vh=' + r.vh + '，body ' + Math.round(r.bodyH) + ' ≤ 可視 ' + r.innerH, r.vh === (r.innerH / 100) + 'px' && r.bodyH <= r.innerH + 1);
  }
  console.log(`\n${pass}/${pass + fail} 通過`);
  await browser.close(); process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
