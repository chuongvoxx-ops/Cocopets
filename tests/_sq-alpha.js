const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const cut = +(process.argv[2] || 0.27);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), 110);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  const r = await page.evaluate((cut) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update, K = P.DunFiend.KIT; G.update = () => {};
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
    step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
    me.x = C.x; me.y = C.y + 5; step(1.2);
    const c = document.querySelector('canvas').getContext('2d'); G.draw(c);
    const L = K.LAYERS.get('fiend-akkorokamui'), cv = L.cv, g = cv.getContext('2d');
    // the alpha in the middle of the head
    const hx = FD.FX.sx(m.x) - L.x0, hy = FD.FX.sy(m.y) - L.y0 - 1.5 * FD.FX.Tz();
    const px = g.getImageData(Math.round(hx * L.k), Math.round(hy * L.k), 1, 1).data;
    const tr = c.getTransform(), mx = Math.round((FD.FX.sx(m.x)) * tr.a + tr.e), my = Math.round((FD.FX.sy(m.y) - 1.5 * FD.FX.Tz()) * tr.d + tr.f), main = Array.from(c.getImageData(mx, my, 1, 1).data);
    // what is drawn after the boss: stub pieces one at a time
    const probe = {}; const keep = {}; ['drawFx', 'drawHud'].forEach(k => { keep[k] = FD[k]; });
    FD.drawFx = () => {}; G.draw(c); probe.noFx = Array.from(c.getImageData(mx, my, 1, 1).data); FD.drawFx = keep.drawFx;
    D.SKIP.overlay = true; G.draw(c); probe.noOverlay = Array.from(c.getImageData(mx, my, 1, 1).data); D.SKIP.overlay = false;
    D.parts.length = 0; G.draw(c); probe.noParts = Array.from(c.getImageData(mx, my, 1, 1).data);
    return { main, probe, lv: FD.S.lv, buried: M.buried, furnace: M.furnace, act: m.act, flash: m.flash, alphaHead: Array.from(px), k: L.k, w: L.w, h: L.h, cvw: cv.width, step: L.step, enterT: FD.S.enterT, ga: c.globalAlpha };
  }, cut);
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
