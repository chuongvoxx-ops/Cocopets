// The crystal prompt at the top of the Tower lobby: shows the balance, opens a test purchase, and lands back in the
// lobby with the new balance. usage: node tests/crystal-prompt.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.crystals = 120; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.waitForTimeout(400);
  const top = await page.evaluate(() => { const s = document.querySelector('#dunInner > section'); const r = s.getBoundingClientRect(); return { cls: s.className, txt: s.textContent.replace(/\s+/g, ' ').trim(), y: Math.round(r.y), h: Math.round(r.height), w: Math.round(r.width) }; });
  check(top.cls.includes('dun-crys') && /120 crystals/.test(top.txt) && /test purchase/.test(top.txt), 'the first thing in the lobby is the crystal prompt, with the balance and a test-purchase label');
  check(top.y < 140, 'the prompt sits at the very top');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/crys-top.png'), clip: { x: 0, y: 0, width: 390, height: 360 } });
  await page.click('[data-dun="crystals"]'); await page.waitForTimeout(350);
  const sheet = await page.evaluate(() => ({ kind: window.__pp.sheetKind, txt: (document.querySelector('#sheet, .sheet') || document.body).textContent.replace(/\s+/g, ' ') }));
  check(sheet.kind === 'crystals' && /Test purchase/.test(sheet.txt), 'tapping it opens the test-purchase confirmation');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/crys-confirm.png') });
  await page.evaluate(() => document.querySelector('[data-go="crystal-confirm"]').click()); await page.waitForTimeout(400);
  const after = await page.evaluate(() => ({ c: window.__pp.st.crystals, kind: window.__pp.sheetKind, txt: document.querySelector('#dunInner > section').textContent.replace(/\s+/g, ' ') }));
  check(after.c === 5120, 'the pack adds 5000 crystals');
  check(!after.kind && /5,?120 crystals/.test(after.txt), 'and lands back in the lobby with the new balance');
  console.log(JSON.stringify({ top, sheet: sheet.kind, after }));
  console.log(fails.length ? 'crystal-prompt FAIL: ' + fails.join('; ') : 'crystal-prompt OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
