// What the Watching Sky's gazes cost to draw on floor 100's canvas: three on the floor, and their light from the sky
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => { window.__pp.dun.startDungeon(100, 7); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const r = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, run = window.__run; for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
    const FD = D.FD, FX = FD.FX, C = FX.C, M = FX.mem, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), Dp = P.FIEND_DEFS.pale, T = FX.Tz();
    for (let i = 0; i < 300; i++) { run(1 / 60); M.gap = 99; } c.save(); G.draw(c); c.restore();
    const gz = [0, 1, 2].map(i => ({ x: C.x + Math.cos(i * 2.1) * 4, y: C.y + 3 + Math.sin(i * 2.1) * 3, r: 1.9, hold: 0.5, lock: i === 0 ? 1 : 0, open: 1, gone: 0, look: [0, 1], i }));
    const N = 40, tr = c.getTransform(), time = fn => { fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) { c.save(); c.setTransform(tr); fn(i); c.restore(); } fl(); return +((performance.now() - t0) / N).toFixed(2); };
    const floor = time(i => gz.forEach(g => Dp._t.drawGaze(c, FX, g, T, 3 + i / 60)));
    const keep = M.watch; M.watch = { gz, t: 1 }; const vf = M.vfx; M.vfx = [];
    const air = time(() => Dp._t.drawAir(c, FX, M, T, 3)); M.watch = null; const air0 = time(() => Dp._t.drawAir(c, FX, M, T, 3)); M.watch = keep; M.vfx = vf;
    const X = FX.sx(gz[1].x), Y = FX.sy(gz[1].y), rr = 1.9 * T;
    const pool = time(() => { for (let k = 0; k < 3; k++) Dp._t.GK.glow(c, X + k * 30, Y, rr * 1.3, '#F4EEFF', 0.32); });
    const ring = time(() => { for (let k = 0; k < 3; k++) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = 'rgba(244,238,255,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(X + k * 30, Y, rr, 0, 6.283); c.stroke(); c.strokeStyle = '#E87AFF'; c.lineWidth = 4; c.beginPath(); c.arc(X + k * 30, Y, rr, -1.57, 1.5); c.stroke(); } });
    const eye = time(() => { for (let k = 0; k < 3; k++) { const w = T * 0.62, x = X + k * 30; c.fillStyle = 'rgba(250,244,255,.92)'; c.beginPath(); c.moveTo(x - w, Y); c.quadraticCurveTo(x, Y - w * 0.8, x + w, Y); c.quadraticCurveTo(x, Y + w * 0.8, x - w, Y); c.fill(); c.fillStyle = '#6A2AB0'; c.beginPath(); c.arc(x, Y, w * 0.36, 0, 6.283); c.fill(); c.fillStyle = '#05020A'; c.beginPath(); c.arc(x, Y, w * 0.17, 0, 6.283); c.fill(); } });
    return { floor3: floor, pool, ring, eye, airWith: air, airWithout: air0 };
  });
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
