// Where a fiend floor's frame goes, piece by piece (each piece flushed and timed, summed per frame, medians over many
// frames), with the layers each fiend keeps and how often they repainted. usage: node tests/fiend-pieces.js floor [cut]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const fl0 = +(process.argv[2] || 120), cut = +(process.argv[3] || 1);
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
  const r = await page.evaluate((cut) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, FD = D.FD, M = FD.FX.mem, me = D.me, C = FD.FX.C, run = G.update, K = P.DunFiend.KIT, Dp = P.FIEND_DEFS[FD.S.D ? Object.keys(P.FIEND_DEFS).find(k => P.FIEND_DEFS[k] === FD.S.D) : ''] || {}; G.update = () => {};
    const step = s => { for (let i = 0; i < s * 60; i++) { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; } };
    step(5); const m = D.g.boss; if (cut < 1) { m.hp = m.maxhp * (cut - 0.04); step(5); }
    const c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1), acc = {};
    let cur = null; const wrap = (o, k, tag) => { const f = o && o[k]; if (typeof f !== 'function') return; o[k] = function () { fl(); const t0 = performance.now(); try { return f.apply(this, arguments); } finally { fl(); cur[tag] = (cur[tag] || 0) + performance.now() - t0; } }; };
    wrap(Dp, 'sky', 'sky'); wrap(Dp, 'overlay', 'overlay');
    ['drawArena', 'drawGround', 'drawBoss', 'drawObj', 'drawProp', 'drawFx', 'drawHud'].forEach(k => wrap(FD, k, k.replace('draw', '').toLowerCase()));
    for (let i = 0; i < 40; i++) { const a = i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); M.gap = 99; me.hp = D.ST.hp; cur = {}; c.save(); G.draw(c); c.restore(); }
    K.LAYERS.forEach(L => { L.n = 0; });
    const frames = [];
    for (let i = 0; i < 90; i++) { const a = 2 + i * 0.05; me.x = C.x + Math.cos(a) * 4; me.y = C.y + 4 + Math.sin(a) * 2; run(1 / 60); M.gap = 99; me.hp = D.ST.hp; cur = {}; fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); fl(); cur.frame = performance.now() - t0; frames.push(cur); }
    const keys = [...new Set(frames.flatMap(f => Object.keys(f)))], med = a => { const b = a.slice().sort((x, y) => x - y); return +b[b.length >> 1].toFixed(2); }, out = {};
    keys.forEach(k => { out[k] = med(frames.map(f => f[k] || 0)); });
    out.rest = +(out.frame - ['arena', 'ground', 'boss', 'obj', 'prop', 'fx', 'hud'].reduce((a, k) => a + (out[k] || 0), 0)).toFixed(2);
    const lay = {}; K.LAYERS.forEach((L, k) => { lay[k] = L.n + '/' + 90 + (L.why === 'stale' ? '!' : ''); });
    G.update = run; return { phase: FD.S.phase, out, lay, frames: frames.map(f => +f.frame.toFixed(0)).join(' ') };
  }, cut);
  console.log(fl0, 'phase', r.phase, JSON.stringify(r.out)); console.log('layers', JSON.stringify(r.lay)); console.log('frames', r.frames);
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
