// Big renders of bosses at in-game size. usage: node tests/boss-closeup.js [ids,...]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const only = process.argv[2] ? process.argv[2].split(',') : null;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const url = await page.evaluate(({ only, R, CELL }) => {
    const P = window.__pp; if (!P.st) P.quickStart('Bot');
    const list = only ? P.BOSSES.filter(b => only.includes(b.id)) : P.BOSSES.slice(0, 8);
    const cols = 4, cell = CELL, cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = Math.ceil(list.length / cols) * cell;
    const c = cv.getContext('2d'); const bg = c.createLinearGradient(0, 0, 0, cv.height); bg.addColorStop(0, '#3A2F55'); bg.addColorStop(1, '#1D1830'); c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height);
    list.forEach((B, i) => { const x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * cell + cell * 0.58, r = R; c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(x, y + r * 0.85, r * 1.1, r * 0.3, 0, 0, 6.283); c.fill(); const m = { bk: B, color: B.color, glow: B.glow, x: x / 40, y: y / 40, phase: 1, act: 'move', t: 1, boss: B.id, r: r / 40, hp: 1, maxhp: 1, z: 0 }; try { P.DunBoss.draw(c, m, x, y, r, 1.3, { x: x / 40 + 2, y: y / 40 }, v => v * 40, v => v * 40, 40); } catch (e) { c.fillStyle = '#F00'; c.font = '12px sans-serif'; c.fillText('ERR ' + e.message, x - 100, y); } c.fillStyle = '#FFF'; c.font = '800 13px sans-serif'; c.textAlign = 'center'; c.fillText(B.name, x, y + cell * 0.38); });
    return cv.toDataURL();
  }, { only, R: +(process.env.BOSS_R || 62), CELL: +(process.env.BOSS_CELL || 300) });
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/boss-closeup.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('saved; errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
