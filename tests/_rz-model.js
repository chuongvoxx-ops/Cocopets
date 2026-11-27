// (v464 RZ-M) Raziel's model, the pure part (no browser): RAZIEL_GL.solve over many frames. Checks: exactly two heads (two mouths, two
// necks), every anchor finite for random poses, the heads aim at their targets (each mouth's direction toward its own target, crossing
// when the targets cross), planted feet (a foot in stance does not slide while the body walks), steps land, springs never snap (the
// largest jump of an anchor in one frame), the same motion at 30 and 60 fps (dt independence), the time a solve takes.
// usage: node tests/_rz-model.js
const fs = require('fs'), path = require('path');
const src = fs.readFileSync(path.join(__dirname, '../src/js/02f7-raziel-model.js'), 'utf8');
const RG = new Function('self', src + '\nreturn RAZIEL_GL;')({});
const out = {}; let fails = 0; const ok = (name, cond, info) => { out[name] = { pass: !!cond, info }; if (!cond) fails++; };
const TILE = 60, SIZE = 300;
const at = S => [S.x * TILE, S.y * TILE];   // (the camera fixed: the anima's screen point from its world position)
// 1. random poses: everything finite, two heads
{ let bad = 0, n = 0; const keys = ['jawL', 'jawR', 'chargeL', 'chargeR', 'recoilL', 'recoilR', 'coreDetach', 'coreAlign', 'coreUp', 'crownAlign', 'crownExpand', 'wing', 'beat', 'guard', 'fly', 'bank', 'walk', 'raise', 'meet', 'roar', 'stagger', 'final', 'enter', 'dissolve', 'coreOut', 'crownOut'];
  for (let evo of [1, 4, 7]) for (let r = 0; r < 60; r++) { const S = RG.idle(evo, 0); S.x = 10; S.y = 10; for (let f = 0; f < 20; f++) { S.t = f / 60; if (f === 0) for (const k of keys) S[k] = Math.random() * (k === 'bank' ? 2 : 1) - (k === 'bank' ? 1 : 0); S.face = Math.random() * 6.28; S.mode = r % 2 ? 'concord' : 'dissonance'; S.aimL = r % 3 ? { x: 10 + Math.random() * 10 - 5, y: 10 + Math.random() * 10 - 5 } : null; S.aimR = r % 4 ? { x: 10 + Math.random() * 10 - 5, y: 10 + Math.random() * 10 - 5 } : null;
      const [X, Y] = at(S), o = RG.solve(X, Y, SIZE, S, { tile: TILE }); n++;
      const pts = [o.mouthL, o.mouthR, o.coreL, o.coreR, o.crownL, o.crownR, o.wingTipL, o.wingTipR, o.tailTip, o.body, o.headL, o.headR, o.throatL, o.throatR, ...o.feet];
      if (pts.some(p => !p || !isFinite(p.x) || !isFinite(p.y)) || !isFinite(o.mouthL.dx) || !isFinite(o.mouthR.dy)) bad++; } }
  ok('finite anchors (180 random poses x 20 frames)', bad === 0, { bad, n }); }
{ const S = RG.idle(7, 0), o = RG.solve(400, 600, SIZE, S, { still: true }); ok('exactly two heads', o.mouthL && o.mouthR && o.headL && o.headR && !o.mouthC && Object.keys(o).filter(k => /^head[A-Z]$/.test(k)).length === 2, Object.keys(o).filter(k => /^head/.test(k))); }
// 2. aims: each mouth points at its own target (screen angle error), also when crossed
{ const errs = []; for (const [aL, aR, nm] of [[{ x: 4, y: 14 }, { x: 16, y: 14 }, 'apart'], [{ x: 16, y: 15 }, { x: 4, y: 15 }, 'crossed'], [{ x: 10, y: 17 }, { x: 10, y: 17 }, 'same']]) {
    const S = RG.idle(1, 0); S.x = 10; S.y = 10; S.aimL = aL; S.aimR = aR; S.jawL = S.jawR = 0.8; let o; for (let f = 0; f < 240; f++) { S.t = f / 60; o = RG.solve(600, 600, SIZE, S, { tile: TILE }); }
    for (const [m, a] of [[o.mouthL, aL], [o.mouthR, aR]]) { const tx = 600 + (a.x - 10) * TILE, ty = 600 + (a.y - 10) * TILE, want = Math.atan2(ty - m.y, tx - m.x), got = Math.atan2(m.dy, m.dx); let d = Math.abs(want - got) % 6.283; if (d > Math.PI) d = 6.283 - d; errs.push([nm, +d.toFixed(2)]); } }
  ok('heads aim at their own targets (screen angle error < 0.5 rad)', errs.every(e => e[1] < 0.5), errs); }
// 3. the walk: planted feet do not slide, steps land, the body moves
{ const S = RG.idle(1, 0); S.x = 10; S.y = 10; S.walk = 0.5; S.face = 1.98; const prev = [], slide = [0, 0, 0, 0]; let steps = 0, frames = 0;
  for (let f = 0; f < 360; f++) { S.t = f / 60; S.x += Math.cos(1.98) * 0.04; S.y += Math.sin(1.98) * 0.04; const [X, Y] = at(S), o = RG.solve(X, Y, SIZE, S, { tile: TILE }); steps += o.steps.length;
    if (f > 60) { frames++; o.feet.forEach((p, i) => { if (p.down && prev[i] && prev[i].down) slide[i] = Math.max(slide[i], Math.hypot(p.x - prev[i].x, p.y - prev[i].y)); prev[i] = { x: p.x, y: p.y, down: p.down }; }); } else o.feet.forEach((p, i) => { prev[i] = { x: p.x, y: p.y, down: p.down }; }); }
  ok('planted feet hold (max slide of a planted foot per frame < 1.2 px at 300 px tall)', Math.max(...slide) < 1.2, { slidePx: slide.map(v => +v.toFixed(2)), steps, frames });
  ok('the walk lands steps (>= 8 in 5 s)', steps >= 8, steps); }
// 4. springs: the largest one-frame jump of the mouth while every state switches at once (0 -> 1)
{ const S = RG.idle(4, 0); S.x = 10; S.y = 10; let last = null, mx = 0;
  for (let f = 0; f < 300; f++) { S.t = f / 60; if (f === 100) Object.assign(S, { roar: 1, raise: 1, coreDetach: 1, coreAlign: 1, crownAlign: 1, wing: 1, fly: 1, guard: 0, meet: 1, recoilL: 1, aimL: { x: 15, y: 15 } }); if (f === 200) Object.assign(S, { roar: 0, raise: 0, fly: 0, wing: 0, meet: 0, recoilL: 0, aimL: null });
    const o = RG.solve(600, 600, SIZE, S, { tile: TILE }); if (last && f > 2) mx = Math.max(mx, Math.hypot(o.mouthL.x - last.x, o.mouthL.y - last.y), Math.hypot(o.crownR.x - last.cx, o.crownR.y - last.cy)); last = { x: o.mouthL.x, y: o.mouthL.y, cx: o.crownR.x, cy: o.crownR.y }; }
  ok('no snapping (largest one-frame anchor jump < 12 px when every state flips)', mx < 12, +mx.toFixed(2)); }
// 5. dt independence: the same timeline at 60 and 30 fps ends in the same place
{ const run = fps => { const S = RG.idle(7, 0); S.x = 10; S.y = 10; let o; for (let f = 0; f <= 3 * fps; f++) { S.t = f / fps; S.aimL = { x: 14, y: 13 }; S.aimR = { x: 6, y: 13 }; S.wing = f / fps > 1 ? 1 : 0.3; S.coreDetach = f / fps > 1.5 ? 1 : 0; o = RG.solve(600, 600, SIZE, S, { tile: TILE }); } return o; };
  const a = run(60), b = run(30), d = Math.max(...['mouthL', 'mouthR', 'coreL', 'crownL', 'wingTipR'].map(k => Math.hypot(a[k].x - b[k].x, a[k].y - b[k].y)));
  ok('dt independence (60 vs 30 fps, end state within 3 px)', d < 3, +d.toFixed(2)); }
// 6. cost of a solve (pure JS, the anchors and every part's transform)
{ const S = RG.idle(7, 0); S.x = 10; S.y = 10; const t0 = process.hrtime.bigint(); for (let f = 0; f < 1200; f++) { S.t = f / 60; S.walk = 0.5; S.x += 0.01; RG.solve(600, 600, SIZE, S, { tile: TILE }); } const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 1200;
  ok('solve cost (ms per frame, L7, walking; solve allocates no GL)', ms < 2, +ms.toFixed(3)); }
// 7. (v465 RZ-M) camera independence: one pose drawn from two cameras each frame (panned, zoomed x0.82, another device scale, another
// view width): every anchor relative to the anima's feet (in tiles) must match within 0.01 tiles, through walking, flight, the ultimate's
// states, stagger and recoil
{ const S = RG.idle(7, 0); S.x = 10; S.y = 10; let worst = 0, wk = '';
  const KEYS = ['body', 'mouthL', 'mouthR', 'throatL', 'coreL', 'coreR', 'crownL', 'crownR', 'wingTipL', 'wingTipR', 'tailTip', 'headL', 'headR', 'shadow'];
  for (let f = 0; f < 900; f++) { const t = f / 60; Object.assign(S, { t, fly: t > 3 && t < 9 ? 1 : 0, speed: t > 5 ? 0.8 : 0, face: 1.8 + Math.sin(t) * 0.8, coreUp: t > 10 ? 1 : 0, crownExpand: t > 10 ? 1 : 0, roar: t > 12 ? 1 : 0, stagger: t > 13 ? 1 : 0, recoilL: t > 13.5 ? 1 : 0, walk: t < 3 ? 0.5 : 0, aimL: { x: 14, y: 13 }, x: 10 + t * 0.2 });
    const cams = [{ ox: 100, oy: 200, T: 47, vw: 390 }, { ox: -300, oy: 50, T: 47 * 0.82, vw: 476 }], O = cams.map(cm => { const X = cm.ox + S.x * cm.T, Y = cm.oy + S.y * cm.T, o = RG.solve(X, Y, cm.T * 3.1, S, { tile: cm.T, vw: cm.vw }); const r = {}; for (const k of KEYS) if (o[k]) r[k] = [(o[k].x - X) / cm.T, (o[k].y - Y) / cm.T]; o.feet.forEach((p, i) => { r['foot' + i] = [(p.x - X) / cm.T, (p.y - Y) / cm.T]; }); return r; });
    for (const k in O[0]) { const d = Math.hypot(O[0][k][0] - O[1][k][0], O[0][k][1] - O[1][k][1]); if (d > worst) { worst = d; wk = k + ' @ ' + t.toFixed(2); } } }
  ok('camera independence (every anchor relative to the feet, two cameras, < 0.01 tiles)', worst < 0.01, { worstTiles: +worst.toFixed(5), at: wk }); }
console.log(JSON.stringify(out, null, 1)); console.log(fails ? 'FAIL ' + fails : 'ALL PASS');
process.exit(fails ? 1 : 0);
