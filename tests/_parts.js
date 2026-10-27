// A fiend's drawing, live, with parts taken away one at a time (the fiend reads FX.mem.skipP): round-robin over the
// variants, one flushed draw each, medians over many rounds. usage: node tests/_parts.js floor cut '{"name":{"part":1},...}'
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 40), cut = +(process.argv[3] || 1), V = JSON.parse(process.argv[4] || '{}');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), fl0);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = 2; });
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  const r = await page.evaluate(([cut, V0]) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update, Q = P.DunFiend.KIT.Q; G.update = () => {};
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
    step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(6); } me.x = C.x; me.y = C.y + 5; step(0.5);
    const c = document.querySelector('canvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), rec = {};
    const V = Object.assign({ all: null }, V0), X = FD.FX.sx(m.x), Y = FD.FX.sy(m.y);
    Q.live = true;
    for (let i = 0; i < 30; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; for (const k in V) { M.skipP = V[k]; fl(); const t0 = performance.now(); FD.drawBoss(c, m, FD.FX.sx(m.x), FD.FX.sy(m.y)); fl(); (rec[k] = rec[k] || []).push(performance.now() - t0); } }
    M.skipP = null; Q.live = false; G.update = run;
    const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; }, out = { phase: FD.S.phase, all: +med(rec.all).toFixed(2) };
    for (const k in V) if (k !== 'all') out['-' + k] = +(med(rec.all) - med(rec[k])).toFixed(2);
    return out;
  }, [cut, V]);
  console.log(fl0, JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
