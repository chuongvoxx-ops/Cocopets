// The vehicle models never fly apart: with the GPU model forced, posed across every channel's extremes and with the
// long-running phases (the wing-beat phase, the ring's spin, the model clock) run up to about 6000, every part's
// farthest point stays within its bound (the worst found at ordinary phases + 15 %), and the exports the tests and the
// game read are there. A model that reads a growing phase as a distance (the Jaws plates of v322) fails here.
// usage: HTML=test-xyz.html KEYS=nidhogg node tests/extent.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
/* per model: how to reach it, the exports it must have, its bound in tiles (worst at ordinary phases + 15 %), its phases and channel extremes */
const M = {
  nidhogg: { get: 'P.nidhogg', flag: '__NIDHOGG_GL', exports: ['create', 'draw', 'rig', 'blankPose', 'CH', 'SIZE', 'VIS', 'COUNTS', 'anchor'], bound: 10.4,
    phases: { flap: [0.13, 0.41, 0.77], ringSpin: [0.5, 2.9], t: [0.3, 1.7] },
    ext: { pitch: [-0.6, 0.6], bank: [-0.8, 0.8], headYaw: [-1, 1], headPitch: [-0.6, 0.6], neckCurve: [-1, 1], tailSwing: [-1, 1], tailLift: [-1, 1], spread: [0, 1], fold: [0, 1], jaw: [0, 1], legs: [0, 1], downFlex: [-1, 1], flapAmp: [0, 1] } },
  /* Beast Machine's GPU model is posed by the session itself (20k9i's rig): measured in play, through every move and the
     finisher, once on a fresh clock and once with the game clock 6000 s on; M's worst was 3.61 (the fling) */
  /* Genbu (I's GENBU_MODEL, reached through the core's __dbg): rigOf at xf 0, 0.5, 1, the roll tucked, no crumble, the
     gait phase and the drill's spin run large */
  genbu: { rig: true, get: "(P.ELEM_IMPL.earth.ult.genbu.__dbg || {}).MODEL", flag: '__GENBU_GL', exports: ['create', 'draw', 'rigOf', 'blankPose', 'anchorAt', 'SIZE', 'PARTS', 'COUNTS'], bound: 4.35 /* (worst 3.78 at the drill in drill form, + 15 %) */ },
  beastmachine: { ingame: true, el: 'thunder', gk: '_beast', flag: '__BEAST_GL', bound: 4.15, presses: ['dodge', 'jump', 'strong', 'strong2', 'ult'] },
};
(async () => {
  const keys = (process.env.KEYS || Object.keys(M).join(',')).split(',');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.addInitScript(fl => { for (const f of fl) window[f] = 1; }, keys.map(k => M[k].flag).concat(['__NG_GL', '__BM_GL']));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  async function ingame(key, C) {
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Ext'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.arc.paused = false; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 180000 }); await page.evaluate(() => window.__pp.beginPlay());
    return page.evaluate(([key, C]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; P.arc.paused = true;
      const I = P.ELEM_IMPL[C.el].ult[key], GL = I.__dbg && I.__dbg.GL; if (!GL) return { missing: true }; const GLM = P.susano.__dbg.GLM;
      const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const c = cv.getContext('2d');
      const step = (s, f) => { const t1 = g.t + s; let k = 0; while (g.t < t1 && k++ < 9000) { me.inv = 1; me.hp = Math.max(me.hp, D.ST.hp * 0.5); me.mp = 999; G.update(1 / 60); if (f && k % 6 === 0) f(); } };
      const run = big => { for (const m of D.mons) { m.hp = m.maxhp = 1e9; m.dmg = 0; m.atkCd = 99; } D.setKit('ult', Object.assign(P.elemAbility(P.ELEM_LIST[C.el]['ey_' + key], 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo: 7 })); g.intro = 0; g.bossIntro = 0; g.cleared = true; step(1); g.cdU = 0; me.mp = 999; g.t += big;
        D.useUlt(); let S = null; { const t1 = g.t + 15; while (g.t < t1 && !((S = g[C.gk]) && !S.released && /ride|drive|fly/.test(S.phase))) { me.inv = 1; G.update(1 / 60); } } if (!S) return { err: 'no session' }; step(0.5); let worst = 0, by = '', n = 0, on = GL.on();
        /* the pose of each sample is set up by the draw; the GPU render itself is skipped (it is slow under software GL and not needed for the extents) */
        const r0 = GLM.render; GLM.render = () => null; const sample = tag => { try { GL.draw(c, S, 40, {}); } catch (e) {} const e = GL.__dbg.extent(S.ag); if (e) { n++; if (e.max > worst) { worst = e.max; by = tag; } } };
        try { for (const b of C.presses) { if (b === 'ult') S.charge = 1; if (b === 'dodge') D.dodge(); else if (b === 'jump') { if (D.VEH && D.VEH.jump) D.VEH.jump(0, 0); } else if (b === 'ult') D.useUlt(); else D.useStrong(b); step(b === 'ult' ? 9 : 2.5, () => sample(b)); } } finally { GLM.render = r0; }
        if (!S.released) { S.left = 0; step(3); } return { worst: +worst.toFixed(2), by, n, on }; };
      return { gl: !!GL.on(), normal: run(0), big: run(6000) }; }, [key, C]); }
  for (const key of keys) { const C = M[key];
    if (C.rig) { const r = await page.evaluate(C => { const P = window.__pp, MD = eval(C.get); if (!MD) return { missing: true }; const exp = C.exports.filter(k => MD[k] == null);
        const p0 = MD.blankPose(), k0 = MD.anchorAt('seat', 0, 0, 0, 0, p0).z / MD.rigOf(p0).A.seat[2];
        const run = big => { let worst = 0, at = null; for (const xf of [0, 0.5, 1]) for (const roll of [0, 1]) for (const ph of [0, 1.3, 2.9, 4.4]) for (const bank of [-0.4, 0, 0.4]) for (const pitch of [-0.3, 0, 0.3]) for (const crouch of [0, 1]) {
          const P = Object.assign(MD.blankPose(), { xf, roll, crumble: 0, walk: ph + big, walkK: 1, drillSpin: ph * 3 + big, bank, pitch, crouch, drillGlow: 1, glow: 1 }), R = MD.rigOf(P);
          for (const it of R.list) { const Pt = MD.PARTS[it.part]; if (!Pt || !Pt.c) continue; const c = [0, 1, 2].map(i => it.o[i] + it.R.x[i] * Pt.c[0] * it.s + it.R.y[i] * Pt.c[1] * it.s + it.R.z[i] * Pt.c[2] * it.s), d = Math.hypot(c[0], c[1], c[2]) * k0; if (d > worst) { worst = d; at = { part: it.part, xf, roll, ph, big }; } } } return { worst: +worst.toFixed(2), at }; };
        return { exp, k0, normal: run(0), big: run(6000), bigger: run(60000) }; }, C);
      if (r.missing) { ok(false, key + ': model not found'); continue; } const bound = C.bound || +(r.normal.worst * 1.15).toFixed(2);
      ok(r.exp.length === 0, `${key}: the exports are there (rigOf among them)`, r.exp);
      ok(r.normal.worst <= bound && r.big.worst <= bound && r.bigger.worst <= bound && Math.abs(r.big.worst - r.normal.worst) < 0.05 * r.normal.worst + 0.05, `${key}: every part within ${bound} tiles (worst + 15 %) in both forms, rolled or not, with the gait and drill phases at 6000 and 60000`, r); continue; }
    if (C.ingame) { const r = await ingame(key, C); if (r.missing) { ok(false, key + ': the GPU model is not reachable'); continue; }
      ok(r.gl && r.normal.n > 10 && r.big.n > 10, `${key}: the GPU model is on (forced) and posed through every move and the finisher`, { gl: r.gl, samples: [r.normal.n, r.big.n] });
      ok(r.normal.worst <= C.bound && r.big.worst <= C.bound, `${key}: every part within ${C.bound} tiles, on a fresh clock and 6000 s on`, r);
      ok(Math.abs(r.big.worst - r.normal.worst) < 0.1 * r.normal.worst + 0.05, `${key}: the extent does not grow with the clock`, [r.normal.worst, r.big.worst]); continue; }
    const r = await page.evaluate(C => { const P = window.__pp, MD = eval(C.get); if (!MD) return { missing: true };
      const exp = C.exports.filter(k => MD[k] == null); const cv = document.createElement('canvas'); cv.width = 600; cv.height = 600; const c = cv.getContext('2d');
      const GLD = MD.__dbg && MD.__dbg.GL, ext = () => (GLD && GLD.extent ? GLD.extent() : null);
      const pose = (ph, big, flip) => { const p = MD.blankPose(); for (const [k, v] of Object.entries(C.ext)) p[k] = v[flip % 2 ? 1 : 0] * (k.length % 3 === flip % 3 ? 1 : 0.5); for (const [k, v] of Object.entries(C.phases)) if (k !== 't') p[k] = v[ph % v.length] + big; return p; };
      const run = big => { let worst = 0, at = null, seat = 1e9, n = 0; for (let ph = 0; ph < 3; ph++) for (let flip = 0; flip < 6; flip++) { const p = pose(ph, big, flip), t = C.phases.t[ph % C.phases.t.length] + big; MD.draw(c, 300, 300, 0, flip * 1.05, p, { T: 40, t }); const e = ext(); if (!e) continue; n++; if (e.max > worst) { worst = e.max; at = { part: Object.entries(e.parts).sort((a, b) => b[1] - a[1])[0][0], ph, flip }; } seat = Math.min(seat, e.seatClear); } return { worst: +worst.toFixed(2), at, seat: +seat.toFixed(3), n }; };
      return { gl: !!MD.gl, exp, normal: run(0), big: run(6000), bigger: run(60000) }; }, C);
    if (r.missing) { ok(false, key + ': model not found'); continue; }
    ok(r.exp.length === 0, `${key}: the exports are there`, r.exp);
    ok(r.gl && r.normal.n > 0, `${key}: the GPU model draws (forced) and reports its extents`, { gl: r.gl, poses: r.normal.n });
    ok(r.normal.worst <= C.bound && r.big.worst <= C.bound && r.bigger.worst <= C.bound, `${key}: every part within ${C.bound} tiles at ordinary and at very long phases (6000, 60000)`, { normal: r.normal, big: r.big, bigger: r.bigger });
    ok(Math.abs(r.big.worst - r.normal.worst) < 0.05 * r.normal.worst + 0.05, `${key}: the extent does not grow with the phases`, [r.normal.worst, r.big.worst, r.bigger.worst]);
  }
  ok(!errors.length, 'no page errors', errors.slice(0, 3));
  await browser.close(); console.log(bad ? `FAILED ${bad}` : 'all passed'); process.exit(bad ? 1 : 0);
})();
