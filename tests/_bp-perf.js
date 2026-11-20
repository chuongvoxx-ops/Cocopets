// (v430 BP) Belial's ultimate, frame by frame: summons the Taurus Anima at form 3, lets its time run out (Dominion of the World Pillar),
// steps the game at 60 Hz and draws every 2nd frame on the GPU path (GLM + FGFX forced on the software rasteriser), timing each drawn
// frame (the whole G.draw), the logic step (G.update), and counting per drawn frame the painter flushes (whole-layer composites) and
// the model's GPU passes. usage: HTML=test-bp.html node tests/_bp-perf.js [every=2]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVERY = +(process.argv[2] || 2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__BL_GL = 0; window.__BL_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-bp.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'taurus'; P.st.animas.res = null; P.openMap(); });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const r = await page.evaluate(({ EVERY }) => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    AN.kit.main.id = 'taurus'; AN.kit.main.k = 3; AN.kit.res = null; AN.kit.resonance = null; D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null; Math.random = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -6; dx <= 7 && ok; dx++) for (let dy = -5; dy <= 5 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 2.5; me.y = best.y + 1.5; }
    const place = [[3.2, -0.6], [4.4, 0.4], [3.6, 1.4], [5.4, -1.0], [2.0, -1.8], [4.6, 2.2], [6.2, 0.8], [1.4, 2.0]];
    D.mons.filter(m => !m.boss).forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e7, maxhp: 1e7, still: false, spd: 0, atkCd: 99, dmg: 0, aggro: true }); else Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 }); });
    me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); AN.summon();
    const step = () => { D.eshots.length = 0; for (const m of D.mons) m.atkCd = 99; const t0 = performance.now(); G.update(1 / 60); return performance.now() - t0; };
    for (let i = 0; i < 200; i++) step();
    const ctx = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d'), F = self.NIDHOGG_MOVES.FGFX; let fl = 0, quads = 0, glm = 0;
    const f0 = F.flush; F.flush = function (c) { try { const S = F.stats || {}; void S; } catch (e) {} fl++; return f0.apply(this, arguments); };
    const BS = window.BELIAL_GL.STATS;   // (GLM is not reachable from here: the model's own pass count stands in)
    const drawOne = () => { window.__NG_GL = 1; window.__BL_GL = 1; fl = 0; const n0 = BS.n; const t0 = performance.now(); G.draw(ctx); const ms = performance.now() - t0; glm = BS.n - n0; window.__NG_GL = 0; window.__BL_GL = 0; return { ms, fl, glm, q: (F.stats && F.stats.maxQuads) || 0 }; };
    drawOne(); drawOne();   // (shaders compiled, buffers up)
    AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; });
    const rows = []; let n = 0, up = []; for (let i = 0; i < 60 * 16 && n < 2000; i++) { up.push(step()); const ul = AN.bl.ul; if (!ul && i > 120) { if (rows.length && !AN.S.list.length) break; } if (ul && i % EVERY === 0) { const d = drawOne(); d.t = +ul.t.toFixed(2); rows.push(d); n++; } }
    F.flush = f0;
    const ms = rows.map(r => r.ms).sort((a, b) => a - b), pc = p => ms[Math.min(ms.length - 1, Math.floor(ms.length * p))];
    const phase = (a, b) => { const q = rows.filter(r => r.t >= a && r.t < b).map(r => r.ms); return q.length ? +(q.reduce((s, v) => s + v, 0) / q.length).toFixed(1) : null; };
    const U = window.BELIAL_MOVES.UT; up.sort((a, b) => a - b);
    return { frames: rows.length, avg: +(ms.reduce((s, v) => s + v, 0) / ms.length).toFixed(1), p50: +pc(0.5).toFixed(1), p95: +pc(0.95).toFixed(1), max: +ms[ms.length - 1].toFixed(1),
      flushAvg: +(rows.reduce((s, r) => s + r.fl, 0) / rows.length).toFixed(2), flushMax: Math.max(...rows.map(r => r.fl)), glmAvg: +(rows.reduce((s, r) => s + r.glm, 0) / rows.length).toFixed(2), glmMax: Math.max(...rows.map(r => r.glm)),
      byPhase: { silence: phase(0, U.p1), pillars: phase(U.p1, U.p2), heaven: phase(U.p2, U.p3), compress: phase(U.p3, U.slam), dominion: phase(U.slam, U.p6), fall: phase(U.p6, U.len + 1) },
      update: { avg: +(up.reduce((s, v) => s + v, 0) / up.length).toFixed(2), p95: +up[Math.floor(up.length * 0.95)].toFixed(2), max: +up[up.length - 1].toFixed(2) }, worst: rows.slice().sort((a, b) => b.ms - a.ms).slice(0, 5).map(r => [r.t, Math.round(r.ms), r.fl, r.glm]) };
  }, { EVERY });
  console.log(JSON.stringify(r)); console.log('errors', errors.length, JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
