// v439 SP (v441 FL: and the film look's layers take no taps): a resolution step (the visual quality's canvas cap: High 2, Balanced 1.5, Performance 1.25 device px a point) leaves taps where
// they were: the same screen point maps to the same world point, the canvas keeps its CSS size, and the pet's screen position and the HUD's
// buttons do not move. usage: HTML=<test html> node tests/_sp-ptr.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const html = process.env.HTML; await page.goto('file://' + (path.isAbsolute(html) ? html : path.resolve(__dirname, '..', html)));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(400);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.gq = 'auto'; P.dun.startDungeon(1); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 }); await page.waitForTimeout(1500);
  const rows = [];
  for (const L of [0, 1, 2, 3, 0]) {
    const r = await page.evaluate(L => { const P = window.__pp, D = P.arc.game._dbg, cv = document.getElementById('arcCanvas'); window.GQ.A = L; const b = cv.getBoundingClientRect();
      const w = D.toWorld(200, 400), o = D.toWorld(0, 0), me = [(D.me.x - o[0]) * (200 / (w[0] - o[0])), (D.me.y - o[1]) * (400 / (w[1] - o[1]))];   // (the pet's screen point, from the same mapping)
      return { level: window.GQ.name(), dpr: P.arc.dpr, backing: [cv.width, cv.height], css: [Math.round(b.width), Math.round(b.height)], world: [+w[0].toFixed(3), +w[1].toFixed(3)], pet: me && me.map(v => +v.toFixed(2)) }; }, L);
    rows.push(r); console.log(JSON.stringify(r)); await page.waitForTimeout(300);
  }
  const same = rows.every(r => JSON.stringify([r.css, r.world]) === JSON.stringify([rows[0].css, rows[0].world]));
  /* (v441 FL) the film look's layers lie over everything: at every quality level (and v440's, __FL_OFF) none of them takes a tap: the pause
     button, the canvas and a real tap on the pause button reach the game */
  let deaf = true;
  for (const [L, old] of [[0, 0], [1, 0], [2, 0], [0, 1]]) {
    const r = await page.evaluate(([L, old]) => { const P = window.__pp; P.st.retro = true; window.__FL_OFF = old; window.GQ.A = L; P.retro.frame();
      const fx = [...document.querySelectorAll('.retroFx')], pe = fx.map(e => getComputedStyle(e).pointerEvents), pb = document.getElementById('arcPauseBtn').getBoundingClientRect();
      const at = (x, y) => { const e = document.elementFromPoint(x, y); return !e ? null : e.closest('.retroFx') ? 'film layer' : e.closest('#arcPauseBtn') ? 'arcPauseBtn' : e.id || e.tagName; };
      return { L, old, layers: fx.length, pe: [...new Set(pe)], pause: at(pb.x + pb.width / 2, pb.y + pb.height / 2), mid: at(195, 420), btn: [pb.x + pb.width / 2, pb.y + pb.height / 2] }; }, [L, old]);
    const ok = r.layers > 0 && r.pe.length === 1 && r.pe[0] === 'none' && r.pause === 'arcPauseBtn' && r.mid === 'arcCanvas'; if (!ok) deaf = false; console.log('film layers', JSON.stringify(r), ok);
  }
  { const b = await page.evaluate(() => { window.__FL_OFF = 0; window.GQ.A = 0; window.__pp.retro.frame(); const pb = document.getElementById('arcPauseBtn').getBoundingClientRect(); return [pb.x + pb.width / 2, pb.y + pb.height / 2]; });
    await page.mouse.click(b[0], b[1]); await page.waitForTimeout(300); const paused = await page.evaluate(() => window.__pp.arc.paused); console.log('a tap on Pause through the film layers pauses the game:', paused); if (!paused) deaf = false; }
  console.log('taps map the same at every level:', same, '| film layers take no taps:', deaf, '| page errors', errors.length, errors.slice(0, 3)); await browser.close(); process.exit(same && deaf && !errors.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(2); });
