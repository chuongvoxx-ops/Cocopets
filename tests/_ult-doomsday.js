// Doomsday (Dark Ult 'doomsday', 20k5f) cast on the GPU path and on the 2D fallback, at evo 1 / 4 / 7: the one Dark AoE hit
// lands at the same game time, centre, radius and damage on both paths (and, with BASE=, the same as a recorded baseline),
// the monsters inside the radius are hit once and the one outside is not, the effect cleans up, and no page errors.
// The game loop is driven by hand (game-time steps of 1/60 s); a frame is drawn every DRAW-th step (default 20; DRAW=0 skips the drawing), so the drawing runs too.
// usage: HTML=test-u2.html node tests/_ult-doomsday.js      env: EVOS=1,4,7  OUT=rec.json (write what was measured)
//        BASE=rec.json (compare with a recording, e.g. one made from the earlier build)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const EVOS = (process.env.EVOS || '1,4,7').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /Doomsday|GLM|GFX/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { window.__NG_GL = 0; window.__DOOM_GL = 0; });
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Doom'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
  async function fresh() {
    await page.evaluate(() => { const P = window.__pp; P.arc.paused = false; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 180000 });
    await page.evaluate(() => { const P = window.__pp; P.beginPlay(); P.arc.paused = true; const G = P.arc.game; for (let k = 0; k < 150; k++) G.update(1 / 60); });
  }
  await fresh();   // (one floor for every cast: each cast re-places the monsters and clears what the last one left)
  async function cast(evo, gpu) {
    return page.evaluate(([evo, gpu, DRAW]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; P.arc.paused = true;
      window.__NG_GL = gpu ? 1 : 0; window.__DOOM_GL = gpu ? 1 : 0;
      for (const f of D.ELEM.fx) f.life = 0; const Z = D.ELEM.H.X.zones; if (Z) Z.length = 0; for (let k = 0; k < 30; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
      if (!window.__spot) { let best = null; for (let k = 0; k < 1500; k++) { const sx = me.x + (Math.random() - 0.5) * 34, sy = me.y + (Math.random() - 0.5) * 34; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; } window.__spot = best || { x: me.x, y: me.y }; }
      me.x = window.__spot.x; me.y = window.__spot.y; me.hp = D.ST.hp; me.dead = false; me.mp = 999; g.cdU = 0; g.intro = 0; g.bossIntro = 0; me.face = 1;
      const live = D.mons.filter(m => !m.boss); if (live.length < 4) return { err: 'monsters ' + live.length };
      for (const m of D.mons) if (!m.boss) { m.dead = true; m.x = me.x + 80; m.y = me.y + 80; }
      const R = (3.2 + 0.2 * (evo - 1));   // (K = 1 here: the ability below is not upgraded)
      const place = [[3, 0], [4.2, -0.9], [3 + (R - 0.75), 0.2], [3, R + 2.2]], tags = ['target', 'near', 'edge', 'outside'];
      const M = live.slice(0, 4).map((m, i) => Object.assign(m, { dead: false, type: 'blob', x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, freeze: 0, stun: 0, chill: 0, burn: 0, venom: 0, falling: null, under: false, z: 0, lifted: false, kbx: 0, kby: 0, shield: 0, block: 0, guardFn: null, elite: false, affixes: null, _tag: tags[i] }));
      me.x0 = me.x; me.y0 = me.y;
      const mv = P.ELEM_LIST.dark.ey_doomsday, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo, sig: false });
      D.setKit('ult', ab); const base = D.ST.atk * ab.mult;
      const X = D.ELEM.H.X, h0 = X.hitArea, log = []; let t0 = 0;
      X.hitArea = (x, y, r, dmg, o) => { const n = h0(x, y, r, dmg, o), fd = D.ELEM.fx.find(f => 'Z0' in f); const inside = M.filter(m => Math.hypot(m.x - x, m.y - y) < r + (m.r || 0)).map(m => m._tag).sort().join(','); log.push({ inside, ft: fd ? +fd.t.toFixed(4) : null, t: +(g.t - t0).toFixed(4), dx: +(x - M[0].x).toFixed(3), dy: +(y - M[0].y).toFixed(3), r: +r.toFixed(4), xB: +(dmg / base).toFixed(4), kb: o && o.kb, stun: o && o.stun, el: o && o.el, n }); return n; };
      const R0 = Math.random; Math.random = () => 0.08 + 0.92 * R0();
      const ctx = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d');
      const hp0 = M.map(m => m.hp); let frames = 0, drawErr = null, fxMax = 0, lifeAt = null, tFx = null;
      try {
        { const d0 = P.ELEM_IMPL.dark.ult.doomsday.__dbg; if (d0 && d0.stats) for (const k in d0.stats) d0.stats[k] = 0; }
        t0 = g.t; D.useUlt();
        const f0 = D.ELEM.fx.slice(); fxMax = f0.length;
        const LIFE = 2.25 + 0.05 * (evo - 1) + 2.7;
        for (let k = 0; k < Math.ceil((LIFE + 0.6) * 60); k++) {
          M.forEach((m, i) => { m.x = me.x0 + place[i][0]; m.y = me.y0 + place[i][1]; m.stun = 0; m.dead = false; }); me.x = me.x0; me.y = me.y0; me.inv = 1; me.hp = Math.max(me.hp, D.ST.hp * 0.5); me.dead = false;
          G.update(1 / 60); fxMax = Math.max(fxMax, D.ELEM.fx.length); if (tFx == null && D.ELEM.fx.length) { tFx = g.t - t0 - 1 / 60; }
          if (lifeAt == null && !D.ELEM.fx.length) lifeAt = +(g.t - t0).toFixed(3);
          if (DRAW && k % DRAW === 0) { try { G.draw(ctx); frames++; } catch (e) { drawErr = String(e && e.stack || e).slice(0, 400); break; } }
        }
      } finally { Math.random = R0; X.hitArea = h0; }
      const dbg = P.ELEM_IMPL.dark.ult.doomsday.__dbg, stats = dbg && dbg.stats ? Object.assign({}, dbg.stats) : null;
            return { evo, gpu, log, hpLoss: Object.fromEntries(M.map((m, i) => [m._tag, +((hp0[i] - m.hp) / base).toFixed(3)])), frames, drawErr, fxLeft: D.ELEM.fx.length, lifeAt, stats, base };
    }, [evo, gpu, +(process.env.DRAW == null ? 20 : process.env.DRAW)]);
  }
  const rec = {};
  for (const evo of EVOS) for (const gpu of [true, false]) {
    const r = await cast(evo, gpu), k = evo + (gpu ? 'gpu' : '2d'); rec[k] = r;
    if (r.err) { ok(false, k + ' cast', r.err); continue; }
    console.log(k, JSON.stringify({ log: r.log, hp: r.hpLoss, frames: r.frames, life: r.lifeAt, stats: r.stats }));
    ok(!r.drawErr, k + ': frames drawn without errors', r.drawErr || r.frames);
    ok(r.log.length === 1, k + ': exactly one area hit', r.log.length);
    const IMP = 2.25 + 0.05 * (evo - 1), h = r.log[0] || {};
    ok(Math.abs(h.ft - IMP) < 1 / 60 + 1e-3, k + ': the hit lands at the impact, ' + IMP.toFixed(2) + ' s into the effect (its own clock; ' + h.t + ' s of game time after the button)', h.ft);
    ok(Math.abs(h.r - (3.2 + 0.2 * (evo - 1))) < 1e-3 && Math.abs(h.xB - 14 * (1 + 0.08 * (evo - 1))) < 1e-3 && h.kb === 7 && h.stun === 0.5, k + ': radius, damage (14 x base x evoK), kb 7, stun 0.5', h);
    ok(h.inside === 'edge,near,target' && h.n === 3, k + ': the three monsters inside the radius are hit, the one outside is not', { inside: h.inside, n: h.n, hpLoss: r.hpLoss });
    ok(r.fxLeft === 0, k + ': the effect has ended and cleaned up', { left: r.fxLeft, at: r.lifeAt });
    if (r.stats) ok(gpu ? r.stats.gpu > 0 && r.stats.glm > 0 : r.stats.gpu === 0 && r.stats.fb > 0, k + (gpu ? ': drawn on the GPU (FGFX quads and the GLM meteor)' : ': drawn by the 2D fallback'), r.stats);
  }
  for (const evo of EVOS) { const a = rec[evo + 'gpu'], b = rec[evo + '2d']; if (!a || !b || a.err || b.err) continue;
    ok(JSON.stringify(a.log) === JSON.stringify(b.log), `evo ${evo}: the GPU and 2D casts hit identically`, [a.log, b.log]); }
  if (process.env.BASE) { const B = JSON.parse(fs.readFileSync(process.env.BASE, 'utf8'));
    for (const k of Object.keys(rec)) { if (!B[k] || rec[k].err) continue; const s = l => JSON.stringify(l.map(h => [h.ft, h.t, h.r, h.xB, h.kb, h.stun, h.el]));
      ok(s(rec[k].log) === s(B[k].log), k + ': the hit matches the baseline build (time on the effect\'s clock and in game time, radius, damage, kb, stun, element)', [rec[k].log, B[k].log]); } }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(rec, null, 1));
  ok(!errors.length, 'no page errors', errors.slice(0, 6));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
