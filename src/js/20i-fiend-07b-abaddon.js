/* ---------- ABADDON, the Final Division ----------
   A vast black octahedron, two pyramids joined at their bases, floating point-down over a square platform cut into a
   clear four-by-four grid above a red abyss. A thin crimson seam divides its halves; four long blades hover round it,
   pointing in. Polished obsidian scored with broad silver scratches, red light along every edge; no eyes, no mouth. It
   turns only in exact quarter turns and stops dead, and before it strikes its blades take the shape of the cut to come.
   I, the Measured Cut: Bisection (two blades in a line; the same line lights across the floor and rises as a plane of
   light), Cross Examination (a cross of blades; two cuts in turn; the corners stay safe), Pinpoint (its tip hunts you, a
   diamond locks under you, it drops, and while its point is in the stone it is open), and Fault Lines (three lanes
   lit at once and cut one after another, its blades flashing in the same order: cross into each lane as it clears).
   II, the Broken Equation: it parts into two pyramids, turning against each other. The upper calls the first cut and
   the lower the second (Contradiction); its cuts now leave fissures that bar the way for one more attack (never more
   than two at once); Closing Argument (four blades close in from the edges and one stops short: the gap is the way
   out); Reassembly (the halves charge each other down a marked corridor and the seam stays open on the core).
   III, Absolute Zero: pale silver with black edges, its blades locked in a crown, everything quicker. Final Proof:
   three formations shown over it in order (their symbols stay beside the arena), cut in that order, then it opens to
   strike the whole floor: break into the core to stop it. A failed proof hurts badly and leaves it spent; every proof
   after is longer and quicker. Beaten, its blades fall into one vertical line through it, and the body parts cleanly
   into eight pieces that fall without a sound. */
FIEND_DEFS.abaddon = (() => {
  const GK = GeoKit, TAU = Math.PI * 2, PI2 = Math.PI / 2, HS = 10, CELL = 5, W = 2.4, HT = 3.0, HB = 3.4, HZ = 5.4, BL = 4.2;
  const RED = '#FF2A3A', EMBER = '#FF7A3A', PALE = '#E8ECF4';
  const { lerp, clamp01, ease, snap } = GK;
  /* ---- the solids ---- */
  const TOP = GK.pyramid(4, W, HT), BOT = GK.pyramid(4, W, -HB), CORE = GK.bipyramid(4, 0.9, 1.1, 1.2, { a0: Math.PI / 4 });
  TOP.mat[0] = 1; BOT.mat[0] = 1;   // the faces they part along: the core's light
  const BLADE = GK.mesh([[BL, 0, 0], [BL * 0.14, 0.85, 0], [0, 0.42, 0], [0, -0.42, 0], [BL * 0.14, -0.85, 0], [BL * 0.06, 0, 0.17], [BL * 0.06, 0, -0.17]], [[0, 1, 5], [1, 2, 5], [2, 3, 5], [3, 4, 5], [4, 0, 5], [0, 6, 1], [1, 6, 2], [2, 6, 3], [3, 6, 4], [4, 6, 0]]);
  const bladeEdge = (a, b) => a < 5 && b < 5 && !(a === 2 && b === 3), baseEdge = (a, b) => a < 4 && b < 4;
  // its eight faces, each as a thin slab, for the end
  const PIECES = [TOP, BOT].flatMap((Ms, h) => Ms.f.slice(1).map(F => { const P = F.map(i => Ms.v[i]), cen = GK.mul(GK.add(GK.add(P[0], P[1]), P[2]), 1 / 3), n = GK.norm(GK.cross(GK.sub(P[1], P[0]), GK.sub(P[2], P[0]))), loc = P.map(p => GK.sub(p, cen)), inn = loc.map(p => GK.sub(GK.mul(p, 0.86), GK.mul(n, 0.28))); return { mesh: GK.mesh(loc.concat(inn), [[0, 1, 2], [3, 4, 5], [0, 1, 4, 3], [1, 2, 5, 4], [2, 0, 3, 5]]), cen, n, h }; }));
  const OBS = ['#050409', '#120F18', '#2B2633'], SIL = ['#5C626E', '#A2A8B4', '#DEE2EA'], BLD = ['#060509', '#16131C', '#3C3846'];
  function mats(M) {
    const s = M.silver || 0, tone = (A, B) => A.map((c, i) => GK.mixC(c, B[i], s)), e = s > 0.6 ? null : RED;
    return {
      body: [{ c: tone(OBS, SIL), tex: 'obsidian', texA: 0.95 - s * 0.25, texS: 3.6, gloss: 0.9 - s * 0.25, glint: '#E8ECF6', under: '#FF1E2E', edge: e, edgeA: 0.42 * (1 - s) },
        { c: ['#3A030C', '#9A0C1A', '#FF3A46'], tex: 'crystal', texA: 0.55, texS: 3, gloss: 0.5, glint: '#FFD6DA' }],
      blade: [{ c: tone(BLD, SIL), tex: 'metal', texA: 0.85, texS: 2.4, gloss: 1, glint: '#F2F5FF', under: '#FF2030', edge: e, edgeA: 0.32 * (1 - s) }],
      core: [{ c: ['#C0101E', '#FF3A46', '#FFC8CC'], tex: 'crystal', texA: 0.6, texS: 2, gloss: 0.6 }],
    };
  }
  /* ---- the platform and the grid ---- */
  const cellOf = v => clamp01((v + HS) / (HS * 2)) * 3.999 | 0, cellC = k => -HS + CELL * (k + 0.5);
  // the stretch of a line through (px, py) at angle a that lies on the platform
  function lineThrough(C, px, py, a) {
    const ca = Math.cos(a), sa = Math.sin(a), lo = [], hi = [];
    [[px - C.x, ca], [py - C.y, sa]].forEach(([p, d]) => { if (Math.abs(d) < 1e-6) { lo.push(-1e9); hi.push(1e9); } else { const s1 = (-HS - p) / d, s2 = (HS - p) / d; lo.push(Math.min(s1, s2)); hi.push(Math.max(s1, s2)); } });
    const s0 = Math.max(lo[0], lo[1]), s1 = Math.min(hi[0], hi[1]);
    return { x0: px + ca * s0, y0: py + sa * s0, x1: px + ca * s1, y1: py + sa * s1, px, py, a };
  }
  const tk = FX => (1 / FX.S.fast) * (FX.S.lv >= 3 ? 0.8 : 1);
  const sfx = FX => FX.H.sfx || {};
  function chime(FX, f, k) { const S = sfx(FX); if (S.chime) S.chime(f, k); }
  /* ---- its pose: the body's quarter turns, height, the halves, the blades ---- */
  function ensure(M, m) {
    if (M.bl) return;
    Object.assign(M, { yaw: M.yaw || 0, yawTo: M.yaw || 0, yawFrom: M.yaw || 0, yawK: 1, tyaw: 0, byaw: 0, tyT: 0, byT: 0, tyF: 0, byF: 0, tyK: 1, byK: 1, hz: M.hz == null ? HZ : M.hz, split: M.split || 0, gapW: 1.8, silver: M.silver || 0, seam: M.seam || 0, coreK: M.coreK || 0, form: M.form || 'rest', formArg: M.formArg || {}, formT: 1, formDur: 0.42, bg: [0, 0, 0, 0], hg: [0, 0], vfx: [], fis: [], walls: [], idleT: 2 });
    M.bl = targets(M, m, 0); M.from = M.bl.map(p => Object.assign({}, p));
  }
  function turn(M, q) { M.yawFrom = M.yaw; M.yawTo = (M.yawK < 1 ? M.yawTo : M.yaw) + q * PI2; M.yawK = 0; }
  function setForm(M, f, arg, dur) { M.from = M.bl.map(p => Object.assign({}, p)); M.form = f; M.formArg = arg || {}; M.formT = 0; M.formDur = dur || 0.42; }
  function targets(M, m, t) {
    const f = M.form || 'rest', A = M.formArg || {}, bx = m.x, by = m.y, hz = M.hz == null ? HZ : M.hz, y0 = M.yaw || 0, sp = (M.split || 0) * (M.gapW || 1.8) / 2, out = [];
    const P = (px, py, pz, d, u, len) => ({ x: bx + px, y: by + py * GK.SE, z: hz + pz, d, u, len: len || 1 });
    const ring = (i, r, pz) => { const a = y0 + Math.PI / 4 + i * PI2, ca = Math.cos(a), sa = Math.sin(a); return P(ca * r, sa * r, pz, GK.norm([-ca, -sa, -0.1]), [0, 0, 1]); };
    const tuck = i => { const a = y0 + Math.PI / 4 + i * PI2, ca = Math.cos(a), sa = Math.sin(a); return P(ca * 2.9, sa * 2.9, -0.6, GK.norm([ca * 0.12, sa * 0.12, -1]), [-sa, ca, 0]); };
    const pair = (a, z) => { const ca = Math.cos(a), sa = Math.sin(a); return [P(ca * 0.15, sa * 0.15, z, [ca, sa, 0], [-sa, ca, 0]), P(-ca * 0.15, -sa * 0.15, z, [-ca, -sa, 0], [-sa, ca, 0])]; };
    switch (f) {
      case 'rest': for (let i = 0; i < 4; i++) out.push(ring(i, 4.8, 0.3 + Math.sin(t * 1.2 + i * 1.6) * 0.05)); break;
      case 'line': out.push(...pair(A.a, HT + 1.4 + sp), tuck(2), tuck(3)); break;
      case 'cross': for (let i = 0; i < 4; i++) { const a = (A.a0 || 0) + i * PI2, ca = Math.cos(a), sa = Math.sin(a); out.push(P(ca * 0.35, sa * 0.35, HT + 1.3 + sp, [ca, sa, 0], [-sa, ca, 0])); } break;
      case 'pin': for (let i = 0; i < 4; i++) { const a = y0 + Math.PI / 4 + i * PI2, ca = Math.cos(a), sa = Math.sin(a); out.push(P(ca * 1.15, sa * 1.15, HT * 0.3 + sp, GK.norm([ca * 0.28, sa * 0.28, 1]), [-sa, ca, 0])); } break;
      case 'lanes': { const z = HT + 1.6 + sp, ax = A.axis === 'x'; for (let j = 0; j < 3; j++) { const o = (j - 1) * 1.7; out.push(ax ? P(o, -BL / 2, z, [0, 1, 0], [0, 0, 1]) : P(-BL / 2, o, z, [1, 0, 0], [0, 0, 1])); } out.push(tuck(3)); break; }
      case 'contra': out.push(...pair(A.a1, sp + HT + 1.1), ...pair(A.a2, -sp - HB - 0.2)); break;
      case 'crown': for (let i = 0; i < 4; i++) { const a = y0 + Math.PI / 4 + i * PI2, ca = Math.cos(a), sa = Math.sin(a); out.push(P(ca * 1.45, sa * 1.45, HT * 0.55 + sp, GK.norm([ca * 0.32, sa * 0.32, 1]), [ca, sa, -0.3])); } break;
      case 'final': for (let i = 0; i < 4; i++) out.push(P(0, 0, HT + 0.5 + BL * 0.55 + i * (BL * 0.55 + 0.3) + (A.drop || 0), [0, 0, -1], [Math.cos(i * 0.8), Math.sin(i * 0.8), 0], 0.55)); break;
      case 'floor': return (M.floorPoses || []).map((p, i) => p || ring(i, 4.8, 0.3));
    }
    return out;
  }
  function blendPose(a, b, u) { let d = GK.lerp3(a.d, b.d, u); if (GK.len(d) < 0.2) d = GK.add(d, [0, 0, 0.3]); let w = GK.lerp3(a.u, b.u, u); if (GK.len(w) < 0.2) w = GK.add(w, [0.3, 0.1, 0]); return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), d: GK.norm(d), u: GK.norm(w), len: lerp(a.len, b.len, u) }; }
  // the two halves: where each is anchored, how high, and how it is turned
  function halves(M, m) {
    if (M.re && M.re.H) return M.re.H;
    const gap = (M.split || 0) * (M.gapW || 1.8) + (M.seam || 0) * 0.85;
    return [{ x: m.x, y: m.y, z: M.hz + gap / 2, R: GK.rz(M.yaw + M.tyaw) }, { x: m.x, y: m.y, z: M.hz - gap / 2, R: GK.rz(M.yaw + M.byaw) }];
  }
  function stepPose(FX, m, dt) {
    const M = FX.mem, t = FX.S.t;
    if (M.yawK < 1) { M.yawK = Math.min(1, M.yawK + dt / 0.26); M.yaw = lerp(M.yawFrom, M.yawTo, snap(M.yawK)); }
    if (M.tyK < 1) { M.tyK = Math.min(1, M.tyK + dt / 0.3); M.tyaw = lerp(M.tyF, M.tyT, snap(M.tyK)); }
    if (M.byK < 1) { M.byK = Math.min(1, M.byK + dt / 0.3); M.byaw = lerp(M.byF, M.byT, snap(M.byK)); }
    if (M.mv) { const V = M.mv; V.k = Math.min(1, V.k + dt / V.dur); const u = (V.ease || snap)(V.k); m.x = lerp(V.x0, V.x1, u); m.y = lerp(V.y0, V.y1, u); if (V.k >= 1) M.mv = null; }
    if (M.hzTo != null) { const d = M.hzTo - M.hz, s = M.hzV || 6; M.hz += Math.sign(d) * Math.min(Math.abs(d), s * dt); if (Math.abs(d) < 1e-3) M.hzTo = null; }
    M.formT = Math.min(1, M.formT + dt / M.formDur);
    const tg = targets(M, m, t), u = ease(M.formT);
    M.bl = tg.map((p, i) => M.formT < 1 && M.from[i] ? blendPose(M.from[i], p, u) : p);
    for (let i = 0; i < 4; i++) M.bg[i] = Math.max(0, M.bg[i] - dt * 2.2);
    M.hg[0] = Math.max(0, M.hg[0] - dt * 2); M.hg[1] = Math.max(0, M.hg[1] - dt * 2);
    M.H = halves(M, m);
  }
  function moveBody(M, m, x, y, dur, e) { M.mv = { x0: m.x, y0: m.y, x1: x, y1: y, k: 0, dur: Math.max(0.05, dur), ease: e }; }
  function counterTurn(M) { M.tyF = M.tyaw; M.tyT = M.tyaw + PI2; M.tyK = 0; M.byF = M.byaw; M.byT = M.byaw - PI2; M.byK = 0; }
  /* ---- the cuts ---- */
  // a cut along a line: the line lights across the floor, then a plane of light rises from it
  function cut(FX, M, L, t, dmg, o) {
    o = o || {}; const col = o.col || RED, hw = o.hw || 1.2;
    return GK.warn(FX, { shape: 'band', x0: L.x0, y0: L.y0, x1: L.x1, y1: L.y1, hw, t, dmg, col, label: o.label, grow: 'len', fn: () => {
      GK.vfx(M, { kind: 'plane', x0: L.x0, y0: L.y0, x1: L.x1, y1: L.y1, h: o.h || 8, w: hw, col, life: 0.6 });
      FX.H.shake(o.big ? 12 : 7, 0.3); const S = sfx(FX); if (S.crack) S.crack(); if (S.note) S.note(o.pitch || 180, 0.35, 'sawtooth', 0.12, (o.pitch || 180) * 0.5);
      if (o.blades) o.blades.forEach(i => { M.bg[i] = 1; });
      if (o.fis) fissure(FX, M, L);
      if (o.after) o.after();
    } });
  }
  // a cell-wide band (rows or columns of the grid), cut as a broad sheet
  function bandCut(FX, M, x0, y0, x1, y1, hw, t, dmg, label, blades) {
    return GK.warn(FX, { shape: 'band', x0, y0, x1, y1, hw, t, dmg, col: RED, label, grow: 'len', fn: () => { GK.vfx(M, { kind: 'plane', x0, y0, x1, y1, h: 9, w: hw, col: RED, life: 0.65 }); FX.H.shake(10, 0.35); const S = sfx(FX); if (S.crack) S.crack(); if (S.thud) S.thud(); (blades || []).forEach(i => { M.bg[i] = 1; }); } });
  }
  /* Severed Ground: a cut that leaves a glowing fissure, which bars the way for one more attack. At most two */
  function fissure(FX, M, L) {
    if (FX.S.lv !== 2) return;
    const ca = Math.cos(L.a), sa = Math.sin(L.a), C = FX.C, half = 4.5, cl = (v, c0) => Math.max(c0 - HS + 0.3, Math.min(c0 + HS - 0.3, v));
    const f = { x0: cl(L.px - ca * half, C.x), y0: cl(L.py - sa * half, C.y), x1: cl(L.px + ca * half, C.x), y1: cl(L.py + sa * half, C.y), hw: 0.32, left: 1, k: 0, gone: 0, seed: Math.random() * 1000 };
    M.fis.push(f); while (M.fis.filter(q => !q.gone).length > 2) { const q = M.fis.find(q2 => !q2.gone); q.gone = 0.01; }
    FX.H.text((f.x0 + f.x1) / 2, (f.y0 + f.y1) / 2 - 0.8, 'The ground is severed', EMBER, 12);
  }
  /* ---- the attacks ---- */
  function bisection(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, k = tk(FX) * (o.k || 1), a = o.a != null ? o.a : [0, PI2, Math.PI / 4, -Math.PI / 4][Math.random() * 4 | 0];
    const ev = [[0, () => { setForm(M, 'line', { a }); chime(FX, 620); }], [0.42 * k, () => { const L = lineThrough(FX.C, me.x, me.y, a); cut(FX, M, L, 1.25 * k, m.dmg * 1.3, { blades: [0, 1], fis: o.fis, label: o.label }); }]];
    if (o.twice) ev.push([0.42 * k + 1.05 * k, () => { const b = a + PI2; setForm(M, 'line', { a: b }, 0.3); const L = lineThrough(FX.C, me.x, me.y, b); cut(FX, M, L, 1.0 * k, m.dmg * 1.3, { blades: [0, 1], label: '2' }); }]);
    return GK.job(ev, 0.42 * k + (o.twice ? 2.15 : 1.25) * k + 0.45);
  }
  function crossExam(FX, m, o) {
    o = o || {}; const M = FX.mem, C = FX.C, k = tk(FX) * (o.k || 1), first = 1.5 * k, second = first + 0.9 * k;
    return GK.job([[0, () => { setForm(M, 'cross', { a0: 0 }); chime(FX, 520); turn(M, 1); }],
      [0.5 * k, () => { bandCut(FX, M, C.x - HS, C.y, C.x + HS, C.y, CELL, first, m.dmg * 1.2, '1', [0, 2]); bandCut(FX, M, C.x, C.y - HS, C.x, C.y + HS, CELL, second, m.dmg * 1.2, '2', [1, 3]); FX.H.text(C.x, C.y + HS + 0.8, 'The corners stand', PALE, 12); }]], 0.5 * k + second + 0.4);
  }
  function pinpoint(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), C = FX.C, lockT = 1.7 * k, strike = lockT + 0.7 * k, rise = strike + 2.4;
    return GK.job([[0, () => { setForm(M, 'pin', {}); M.mark = { x: me.x, y: me.y, lock: 0 }; chime(FX, 760); }],
      [lockT, (F2, m2, J) => { M.mark.lock = 1; J.tx = M.mark.x; J.ty = M.mark.y; moveBody(M, m, J.tx, J.ty, 0.22); const S = sfx(FX); if (S.note) S.note(1180, 0.12, 'square', 0.1);
        GK.warn(FX, { shape: 'circle', x: J.tx, y: J.ty, r: 2.1, t: 0.7 * k, dmg: m.dmg * 1.6, col: RED, grow: true, fn: () => { FX.H.boom(J.tx, J.ty, 2.2, RED, '#FFFFFF', { n: 22, shake: 14, smoke: 8 }); FX.H.ring(J.tx, J.ty, 0.4, 4.2, 0.5, RED, 0.3); const S2 = sfx(FX); if (S2.thud) S2.thud(); M.open = 2.4; FX.H.text(J.tx, J.ty - 1.6, 'Its point is in the stone: strike!', PALE, 13); M.mark = null; } }); }],
      [strike - 0.13, () => { M.hzTo = HB + 0.05; M.hzV = 40; }],
      [rise, () => { M.hzTo = HZ; M.hzV = 7; }],
      [rise + 0.6, () => { moveBody(M, m, C.x, C.y - 1, 0.7); setForm(M, FX.S.lv >= 3 ? 'crown' : 'rest', {}); turn(M, -1); }]],
      rise + 1.4, { tick: (F2, m2, J, dt) => { if (M.mark && !M.mark.lock) { M.mark.x += (me.x - M.mark.x) * Math.min(1, dt * 5); M.mark.y += (me.y - M.mark.y) * Math.min(1, dt * 5); const dx = M.mark.x - m.x, dy = M.mark.y - m.y, d = Math.hypot(dx, dy); if (d > 0.05) { const s = Math.min(d, 6.5 * dt); m.x += dx / d * s; m.y += dy / d * s; } } } });
  }
  function faultLines(FX, m) {
    const M = FX.mem, C = FX.C, k = tk(FX), axis = Math.random() < 0.5 ? 'x' : 'y', order = [0, 1, 2].sort(() => Math.random() - 0.5), gap = 1.15 * k, lw = HS * 2 / 3, first = 1.9 * k;
    const ev = [[0, () => { setForm(M, 'lanes', { axis, order }); FX.H.banner('FAULT LINES', 'Three cuts, one after another. Cross into each lane as it clears.', RED, 2.2, true); chime(FX, 440); }]];
    order.forEach((L, j) => ev.push([0.6 + j * 0.34, () => { M.bg[L] = 1; chime(FX, 520 + j * 120, 0.7); }]));
    ev.push([0.6, () => order.forEach((L, j) => { const c0 = -HS + lw * (L + 0.5); const S = axis === 'x' ? [C.x + c0, C.y - HS, C.x + c0, C.y + HS] : [C.x - HS, C.y + c0, C.x + HS, C.y + c0]; bandCut(FX, M, S[0], S[1], S[2], S[3], lw / 2, first + j * gap, m.dmg * 1.3, String(j + 1), [L]); })]);
    return GK.job(ev, 0.6 + first + 2 * gap + 0.5);
  }
  /* Contradiction: the upper half calls a straight cut, the lower a diagonal one; high note first, low note second */
  function contradiction(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), a1 = Math.random() < 0.5 ? 0 : PI2, a2 = Math.random() < 0.5 ? Math.PI / 4 : -Math.PI / 4, crown = FX.S.lv >= 3;
    return GK.job([[0, (F2, m2, J) => { J.px = me.x; J.py = me.y; if (!crown) setForm(M, 'contra', { a1, a2 }); }],
      [0.2, () => { M.hg[0] = 1; if (crown) { M.bg[0] = M.bg[1] = 1; } chime(FX, 880); }],
      [0.55, () => { M.hg[1] = 1; if (crown) { M.bg[2] = M.bg[3] = 1; } chime(FX, 440); }],
      [0.6, (F2, m2, J) => { const fis = FX.S.lv === 2; cut(FX, M, lineThrough(FX.C, J.px, J.py, a1), 1.35 * k, m.dmg * 1.3, { label: '1', blades: [0, 1], fis, pitch: 330 }); cut(FX, M, lineThrough(FX.C, J.px, J.py, a2), 2.25 * k, m.dmg * 1.3, { label: '2', blades: [2, 3], fis, col: EMBER, pitch: 150 }); }]], 0.6 + 2.25 * k + 0.5);
  }
  /* Closing Argument: the four blades come down at the edges and close in; one stops short */
  function closing(FX, m) {
    const M = FX.mem, me = FX.me, C = FX.C, k = tk(FX), dx = me.x - C.x, dy = me.y - C.y;
    const q = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0), desc = 0.9 * k, dur = 3.3 * k, s0 = HS - 0.5, stop = 4.2;
    const sideOf = (i, s) => { const c = C; return [[c.x - s, c.y - s, c.x + s, c.y - s], [c.x + s, c.y - s, c.x + s, c.y + s], [c.x + s, c.y + s, c.x - s, c.y + s], [c.x - s, c.y + s, c.x - s, c.y - s]][i]; };
    const pose = (i, s, z) => { const [x0, y0, x1, y1] = sideOf(i, Math.max(0.05, s)), L = Math.hypot(x1 - x0, y1 - y0), d = [(x1 - x0) / L, (y1 - y0) / L, 0], pk = Math.hypot(d[0], d[1] * GK.SE) || 1; return { x: x0, y: y0, z, d, u: [-d[1], d[0], 0], len: Math.max(0.05, L / BL / pk) }; };
    return GK.job([[0, (F2, m2, J) => { J.s = [s0, s0, s0, s0]; J.hit = [0, 0, 0, 0]; M.sq = { q, stop, s: J.s, t: 0 }; M.floorPoses = [0, 1, 2, 3].map(i => pose(i, s0, 0.7)); setForm(M, 'floor', {}, desc); M.bladeProps = true; syncProps(FX, M);
        FX.H.banner('CLOSING ARGUMENT', 'Four blades close in. One stops short: that is the way out.', RED, 2.2, true); chime(FX, 300); }],
      [desc, () => { const S = sfx(FX); if (S.whoosh) S.whoosh(); }],
      [desc + dur, () => { FX.H.boom(C.x, C.y, 1.6, RED, '#FFFFFF', { n: 18, shake: 12, smoke: 6 }); const S = sfx(FX); if (S.crash) S.crash(); }],
      [desc + dur + 0.6, () => { M.sq = null; M.bladeProps = false; syncProps(FX, M); setForm(M, FX.S.lv >= 3 ? 'crown' : 'rest', {}, 0.6); }]], desc + dur + 1.3,
      { tick: (F2, m2, J, dt) => { if (!J.s) return; const T0 = J.t - desc; if (T0 < 0) return; for (let i = 0; i < 4; i++) { const target = Math.max(i === q ? stop : 0, s0 - (s0 * T0 / dur)), was = J.s[i]; J.s[i] = target; M.floorPoses[i] = pose(i, J.s[i], 0.7);
          // a moving blade cuts whatever it passes over
          if (was - J.s[i] > 1e-3) { const [x0, y0, x1, y1] = sideOf(i, J.s[i]); if (GK.segD(me.x, me.y, x0, y0, x1, y1) < 0.55 + me.r && FX.S.t - J.hit[i] > 0.7) { J.hit[i] = FX.S.t; GK.hurt(FX, m.dmg * 1.5); } } } } });
  }
  /* Reassembly: the halves fly to the ends of a corridor down the grid, tip over to face each other, and charge.
     Both halves hang on one axis through a shared centre: the tilt turns that axis from upright to along the corridor,
     and the separation along it runs from their hover, out to the corridor's length, to nothing at the collision */
  function placeHalves(M, cx, cy, cz, tilt, sep) {
    const R0 = tilt, up = GK.mv(R0, [0, 0, sep / 2]), mk = (s, yaw) => ({ x: cx + up[0] * s, y: cy + up[1] * s * GK.SE, z: cz + up[2] * s, R: GK.mm(R0, GK.rz(yaw)) });
    return [mk(1, M.yaw + M.tyaw), mk(-1, M.yaw + M.byaw)];
  }
  function reassembly(FX, m) {
    const M = FX.mem, me = FX.me, C = FX.C, k = tk(FX), horiz = Math.random() < 0.5, lane = horiz ? cellOf(me.y - C.y) : cellOf(me.x - C.x), cc = cellC(lane), zc = W + 0.3, out = 1.0, charge = 1.85 * k, hit = 2.25 * k;
    const mid = horiz ? [C.x, C.y + cc] : [C.x + cc, C.y], Lc = (HS - 1.6) * 2, tiltOf = u => horiz ? GK.ry(-PI2 * u) : GK.rx(PI2 * u);
    return GK.job([[0, (F2, m2, J) => { J.bx = m.x; J.by = m.y; J.bz = M.hz; J.g0 = (M.split || 0) * (M.gapW || 1.8); M.re = { H: null }; FX.H.banner('REASSEMBLY', 'The halves charge down the marked corridor. Leave it, then strike the open seam.', RED, 2.4, true); chime(FX, 260); setForm(M, 'rest', {}, 0.5); }],
      [0.45, () => { const b = horiz ? [C.x - HS, C.y + cc, C.x + HS, C.y + cc] : [C.x + cc, C.y - HS, C.x + cc, C.y + HS]; GK.warn(FX, { shape: 'band', x0: b[0], y0: b[1], x1: b[2], y1: b[3], hw: CELL / 2 - 0.2, t: hit - 0.45, dmg: m.dmg * 2.0, col: RED, label: 'CORRIDOR', grow: false }); }],
      [hit, () => { FX.H.boom(mid[0], mid[1], 2.6, RED, '#FFFFFF', { n: 34, shake: 18, smoke: 10 }); FX.H.flash(0.3, RED); const S = sfx(FX); if (S.crash) S.crash(); M.seam = 1; M.coreK = 1; M.open = 5; FX.H.banner('THE SEAM IS OPEN', 'Strike the core', PALE, 1.8); }],
      [hit + 5, () => { M.seam = 0; M.coreK = 0; M.open = 0; M.re = null; moveBody(M, m, C.x, C.y - 1, 0.8); }]], hit + 6,
      { tick: (F2, m2, J, dt) => {
        if (!M.re) return;
        if (J.t < hit) {
          const u = ease(clamp01(J.t / out)), tilt = ease(clamp01((J.t - 0.25) / 0.6)), c = J.t < charge ? 0 : clamp01((J.t - charge) / (hit - charge));
          const cx = lerp(J.bx, mid[0], u), cy = lerp(J.by, mid[1], u), cz = lerp(J.bz, zc, u), sep = lerp(J.g0, Lc, u) * (1 - c * c);
          m.x = cx; m.y = cy; M.re.H = placeHalves(M, cx, cy, cz, tiltOf(tilt), sep);
          if (c > 0 && !J.wh) { J.wh = 1; const S = sfx(FX); if (S.whoosh) S.whoosh(); }
        } else {
          // joined where they met, the seam left open; they lie a moment, then rise upright, parting to their hover
          const back = ease(clamp01((J.t - hit - 0.6) / 0.7)), cz = lerp(zc, M.hz, back), sep = 0.85 * M.seam + (M.split || 0) * (M.gapW || 1.8) * back;
          m.x = mid[0]; m.y = mid[1]; M.re.H = placeHalves(M, mid[0], mid[1], cz, tiltOf(1 - back), sep); if (back >= 1 && J.t > hit + 1.4) M.re.H = null;
        }
      } });
  }
  /* Final Proof: formations shown in order, cut in that order, then it opens to strike everything: break the core */
  const PROOF = ['h', 'v', 'd1', 'd2', 'x'], PROOF_A = { h: 0, v: PI2, d1: Math.PI / 4, d2: -Math.PI / 4 };
  function finalProof(FX, m) {
    const M = FX.mem, me = FX.me, C = FX.C, k = tk(FX), rep = M.proofN = (M.proofN || 0) + 1, n = Math.min(5, 2 + rep), seq = [];
    for (let i = 0; i < n; i++) { let g; do { g = PROOF[Math.random() * PROOF.length | 0]; } while (i && g === seq[i - 1]); seq.push(g); }
    const show = 0.5, step = 0.55, tc = show + n * step + 0.5, gapC = 1.05 * k, open = tc + n * gapC + 0.4, castT = Math.max(3.4, 5.2 - 0.45 * (rep - 1));
    M.proof = { seq, shown: 0, done: 0, cast: 0, castT, got: 0, need: FX.S.barHP * 0.42 * (1 + 0.1 * (rep - 1)), rep };
    const ev = [[0, () => { FX.H.banner('FINAL PROOF', n > 3 ? `${n} cuts this time. Remember the order; then break the core.` : 'Remember the order. Then break the core before it strikes.', PALE, 2.6, true); M.bg = [1, 1, 1, 1]; }]];
    seq.forEach((g, i) => ev.push([show + i * step, () => { M.proof.shown = i + 1; chime(FX, 520 + i * 110); }]));
    seq.forEach((g, i) => ev.push([tc + i * gapC, () => { M.proof.done = i; if (g === 'x') { bandCut(FX, M, C.x - HS, C.y, C.x + HS, C.y, CELL, 0.95 * k, m.dmg * 1.25, String(i + 1), [0, 2]); bandCut(FX, M, C.x, C.y - HS, C.x, C.y + HS, CELL, 0.95 * k, m.dmg * 1.25, '', [1, 3]); } else cut(FX, M, lineThrough(C, me.x, me.y, PROOF_A[g]), 0.95 * k, m.dmg * 1.3, { label: String(i + 1), blades: [0, 1, 2, 3], pitch: 200 + i * 40 }); }]));
    ev.push([open, () => { M.proof.done = n; M.proof.cast = 0.001; M.split = 1; M.gapW = 2.4; M.coreK = 1; FX.H.banner('IT OPENS', 'Break into the core before the proof completes', RED, 1.8, true); const S = sfx(FX); if (S.hum) S.hum(); }]);
    return GK.job(ev, open + castT + 0.2, { hold: true, tick: (F2, m2, J, dt) => {
      const P = M.proof; if (!P || !P.cast) return; P.cast += dt;
      if (P.got >= P.need) { proofEnd(FX, m, true); J.hold = false; J.end = 0; return; }
      if (P.cast >= P.castT) { proofEnd(FX, m, false); J.hold = false; J.end = 0; }
    } });
  }
  function proofEnd(FX, m, broke) {
    const M = FX.mem, C = FX.C; M.coreK = 0; M.split = 0; M.gapW = 1.8; FX.weak('core', 0, 0, 0, 0, false);
    if (broke) { m.stunT = 3.6; FX.H.banner('PROOF REFUTED', 'It reels: strike now', PALE, 2, true); FX.H.boom(m.x, m.y - 1, 3, PALE, RED, { n: 30, shake: 14, smoke: 6 }); const S = sfx(FX); if (S.crack) S.crack(); }
    else { const rep = (M.proof && M.proof.rep) || 1; FX.H.flash(0.8, '#FFFFFF'); FX.H.shake(26, 0.8); for (let i = 0; i < 5; i++) GK.vfx(M, { kind: 'plane', x0: C.x - HS, y0: C.y - HS + i * CELL, x1: C.x + HS, y1: C.y - HS + i * CELL, h: 11, w: CELL / 2, col: RED, life: 0.9 }); GK.hurt(FX, m.dmg * 3.0 * (1 + 0.12 * (rep - 1))); m.stunT = 2.2; FX.H.banner('Q.E.D.', 'The proof completes. It is spent for a moment.', RED, 1.8, true); const S = sfx(FX); if (S.crash) S.crash(); }
    M.proof = null;
  }
  /* ---- choosing ---- */
  function pickJob(FX, m, lv) {
    const M = FX.mem, i = M.cyc++, nm = (n, J) => { J.name = n; return J; };
    if (lv === 1) { if (M.sigCd <= 0) { M.sigCd = 17; return nm('faultLines', faultLines(FX, m)); } return [() => nm('bisection', bisection(FX, m)), () => nm('cross', crossExam(FX, m)), () => nm('pinpoint', pinpoint(FX, m))][i % 3](); }
    if (lv === 2) return [() => nm('contradiction', contradiction(FX, m)), () => nm('bisection', bisection(FX, m, { fis: true })), () => nm('closing', closing(FX, m)), () => nm('reassembly', reassembly(FX, m))][i % 4]();
    if (M.sigCd <= 0) { M.sigCd = 26; return nm('finalProof', finalProof(FX, m)); }
    return [() => nm('bisection2', bisection(FX, m, { twice: true })), () => nm('cross', crossExam(FX, m)), () => nm('contradiction', contradiction(FX, m)), () => nm('pinpoint', pinpoint(FX, m)), () => nm('faultLines', faultLines(FX, m))][i % 5]();
  }
  function endJob(FX) {
    const M = FX.mem, lv = FX.S.lv; if (M.job && M.job.stop) M.job.stop(FX, M.job); M.job = null; M.gap = lv >= 3 ? 0.85 : lv === 2 ? 1.15 : 1.45;
    // a fissure bars the way for one attack after the one that made it
    M.fis.forEach(f => { if (!f.gone) { f.left--; if (f.left < 0) f.gone = 0.01; } });
  }
  // blades lying on the floor are drawn as props, so the pet passes in front of them and behind them properly
  function syncProps(FX, M) { const P = FX.S.props; for (let i = P.length - 1; i >= 0; i--) if (P[i].kind === 'abBlade') P.splice(i, 1); if (M.bladeProps) for (let i = 0; i < 4; i++) P.push({ kind: 'abBlade', i, x: 0, y: 0 }); }
  function bodyParts(FX, m) {
    const M = FX.mem; if (M.end || !M.H) return; const CE = GK.CE;
    FX.parts(M.H.map((h, i) => ({ key: 'h' + i, dx: h.x - m.x, dy: (h.y - m.y) - (h.z + (i ? -HB : HT) * 0.42) * CE, r: 1.9 })));
    if (M.coreK > 0.5) { const H = M.H, cx = (H[0].x + H[1].x) / 2, cy = (H[0].y + H[1].y) / 2, cz = (H[0].z + H[1].z) / 2; FX.weak('core', cx, cy - cz * CE, 1.2, M.proof ? 2.6 : 2.4, true); }
    else FX.weak('core', 0, 0, 0, 0, false);
  }
  /* ---- painting ---- */
  function drawAbaddon(c, FX, m, X, Y, T, t) {
    const M = FX.mem; ensure(M, m); if (!M.H) M.H = halves(M, m);
    // positions on screen are taken from the anchor it is drawn at, so the painting works anywhere it is placed
    const P = { sx: x => X + (x - m.x) * T, sy: y => Y + (y - m.y) * T, Tz: () => T };
    const MT = mats(M), sil = M.silver || 0, ink = sil > 0.5 ? '#000000' : '#06040A', lw = 0.07 + sil * 0.04, flash = FX.K.Q.flash;
    // the abyss's light behind it and its shadow on the stone
    const H0 = M.H[1]; GK.shadow(c, P.sx(H0.x), P.sy(H0.y), T * 3.4, T * 1.5, H0.z, 0.6);
    GK.glow(c, X, Y - M.hz * GK.CE * T, T * 7, sil > 0.5 ? '#C8D4FF' : '#FF2030', 0.16 + 0.1 * Math.sin(t * 1.3));
    const items = [];
    // stacked one over the other, the upper half is always painted last (joined, it hides the lower half's cut face)
    const stacked = Math.abs(M.H[0].x - M.H[1].x) + Math.abs(M.H[0].y - M.H[1].y) < 0.02;
    M.H.forEach((h, i) => items.push({ dep: h.y * GK.CE / GK.SE + h.z * GK.SE + (stacked && !i ? 50 : 0), f: () => { const cm = GK.cam(P.sx(h.x), P.sy(h.y), T); GK.solid(c, cm, i ? BOT : TOP, { R: h.R, t: [0, 0, h.z] }, { mats: MT.body, ink, lw, seam: baseEdge, seamK: 0.8 + (M.hg[i] || 0) * 1.6 + (M.seam || 0), flash: Math.max(flash, (M.hg[i] || 0) * 0.5) }); } }));
    if (M.coreK > 0.02 || (M.split || 0) > 0.05) { const h0 = M.H[0], h1 = M.H[1], cx = (h0.x + h1.x) / 2, cy = (h0.y + h1.y) / 2, cz = (h0.z + h1.z) / 2; items.push({ dep: cy * GK.CE / GK.SE + cz * GK.SE + 0.01, f: () => { const p = GK.at(P, cx, cy, cz); GK.glow(c, p[0], p[1], T * (2 + 2.5 * M.coreK), RED, 0.35 + 0.4 * M.coreK + 0.15 * Math.sin(t * 6)); if (M.coreK > 0.02) { const cm = GK.cam(P.sx(cx), P.sy(cy), T); GK.solid(c, cm, CORE, { R: GK.rz(t * 1.5), t: [0, 0, cz], s: 0.6 + 0.4 * M.coreK }, { mats: MT.core, ink: '#3A0008', alpha: Math.min(1, M.coreK * 1.5) }); GK.glow(c, p[0], p[1], T * 1.2, '#FFFFFF', 0.5 * M.coreK); } } }); }
    if (!M.bladeProps) M.bl.forEach((b, i) => items.push({ dep: bladeDep(b), f: () => drawBlade(c, P, M, MT, b, i, T, ink) }));
    items.sort((a, b) => a.dep - b.dep).forEach(it => it.f());
  }
  function bladeDep(b) { const cx = b.x + b.d[0] * BL * b.len * 0.5, cy = b.y + b.d[1] * BL * b.len * 0.5 * GK.SE, cz = b.z + b.d[2] * BL * b.len * 0.5; return cy * GK.CE / GK.SE + cz * GK.SE; }
  function drawBlade(c, P, M, MT, b, i, T, ink) {
    const cm = GK.cam(P.sx(b.x), P.sy(b.y), T), g = M.bg[i] || 0;
    GK.solid(c, cm, BLADE, { R: GK.frame(b.d, b.u), t: [0, 0, b.z], s: [b.len, 1, 1] }, { mats: MT.blade, ink, lw: 0.06, seam: bladeEdge, seamCol: (M.silver || 0) > 0.6 ? '#FFFFFF' : RED, seamK: 0.35 + g * 1.4, flash: g * 0.6 });
    if (g > 0.05) { const p = GK.at(P, b.x + b.d[0] * BL * b.len * 0.5, b.y + b.d[1] * BL * b.len * 0.5 * GK.SE, b.z + b.d[2] * BL * b.len * 0.5); GK.glow(c, p[0], p[1], T * 2.4 * Math.max(1, b.len * 0.5), RED, g * 0.55); }
  }
  // the ground layer: fissures, the diamond of Pinpoint, Closing Argument's stop line, Final Proof's symbols
  function drawFloorMarks(c, FX, M, T, t) {
    const C = FX.C;
    for (const f of M.fis || []) {
      const a = f.gone ? 1 - clamp01(f.gone / 0.5) : Math.min(1, f.k / 0.3); if (a <= 0) continue; const R = mulberry32(f.seed | 0), n = 14, pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n, j = i && i < n ? (R() - 0.5) * 0.5 : 0, nx = -(f.y1 - f.y0), ny = f.x1 - f.x0, L = Math.hypot(nx, ny) || 1; pts.push([FX.sx(lerp(f.x0, f.x1, u) + nx / L * j), FX.sy(lerp(f.y0, f.y1, u) + ny / L * j)]); }
      c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round'; const path = () => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); };
      path(); c.strokeStyle = '#050103'; c.lineWidth = T * 0.75; c.stroke(); c.globalCompositeOperation = 'lighter'; path(); c.strokeStyle = GK.rgba(EMBER, 0.45); c.lineWidth = T * 0.5; c.stroke(); path(); c.strokeStyle = GK.rgba('#FFD0A0', 0.85 + 0.15 * Math.sin(t * 9 + f.seed)); c.lineWidth = Math.max(1.5, T * 0.12); c.stroke();
      for (let i = 1; i < n; i += 3) GK.glow(c, pts[i][0], pts[i][1], T * 0.9, EMBER, 0.35); c.restore();
    }
    if (M.mark) { const X = FX.sx(M.mark.x), Y = FX.sy(M.mark.y), s = T * 0.9 * (M.mark.lock ? 1.2 : 1), r = t * (M.mark.lock ? 0 : 2.5); c.save(); c.translate(X, Y); c.scale(1, 0.62); c.rotate(r); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GK.rgba(M.mark.lock ? '#FFFFFF' : RED, 0.9); c.lineWidth = 3; c.beginPath(); c.moveTo(0, -s); c.lineTo(s, 0); c.lineTo(0, s); c.lineTo(-s, 0); c.closePath(); c.stroke(); c.globalAlpha = 0.5; blitSized(c, glowSprite(RED), -s * 1.6, -s * 1.6, s * 3.2, s * 3.2); c.restore(); }
    if (M.sq) { const q = M.sq.q, s = M.sq.stop, P = [[[-s, -s], [s, -s]], [[s, -s], [s, s]], [[s, s], [-s, s]], [[-s, s], [-s, -s]]][q], tri = [P[0], P[1], [0, 0]];
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = GK.rgba('#FFFFFF', 0.08 + 0.05 * Math.sin(t * 5)); c.beginPath(); tri.forEach((p, i) => i ? c.lineTo(FX.sx(C.x + p[0]), FX.sy(C.y + p[1])) : c.moveTo(FX.sx(C.x + p[0]), FX.sy(C.y + p[1]))); c.closePath(); c.fill();
      c.strokeStyle = GK.rgba('#FFFFFF', 0.85); c.lineWidth = 3; c.setLineDash([T * 0.5, T * 0.3]); c.beginPath(); c.moveTo(FX.sx(C.x + P[0][0]), FX.sy(C.y + P[0][1])); c.lineTo(FX.sx(C.x + P[1][0]), FX.sy(C.y + P[1][1])); c.stroke(); c.setLineDash([]);
      c.globalCompositeOperation = 'source-over'; c.font = `900 ${Math.round(T * 0.55)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; const lx = FX.sx(C.x + (P[0][0] + P[1][0]) * 0.32), ly = FX.sy(C.y + (P[0][1] + P[1][1]) * 0.32); c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText('GAP', lx, ly); c.fillStyle = '#FFFFFF'; c.fillText('GAP', lx, ly); c.restore(); }
    if (M.proof) { const P = M.proof, n = P.seq.length; for (let i = 0; i < Math.min(n, P.shown); i++) { const x = C.x + (i - (n - 1) / 2) * 3.1, y = C.y - HS - 1.7, X = FX.sx(x), Y = FX.sy(y), act = P.cast ? false : i === P.done, done = i < P.done || P.cast > 0; GK.glyph(c, P.seq[i], X, Y, T * (act ? 1.05 : 0.85), act ? '#FFFFFF' : RED, done ? 0.4 : 1); c.save(); c.font = `900 ${Math.round(T * 0.42)}px ${arcFont}`; c.textAlign = 'center'; c.fillStyle = '#FFFFFF'; c.globalAlpha = done ? 0.4 : 1; c.fillText(String(i + 1), X, Y + T * 1.45); c.restore(); } }
  }
  // the air layer: light from the cuts, the formation symbols over it, the core's meter, the end
  function drawAir(c, FX, M, T, t) {
    GK.drawVfx(c, FX, M, T);
    const m = FX.m;
    if (M.proof && m && !M.end) {
      const P = M.proof, n = P.seq.length, Wd = FX.H.W ? FX.H.W() : c.canvas.width;
      // shown in order over it as they are revealed (kept on screen)...
      if (!P.cast && P.done === 0 && P.shown < n + 1) { const top = GK.at(FX, m.x, m.y, M.hz + HT + 5.2), y = Math.max(222, top[1]); for (let i = 0; i < P.shown; i++) { const x = top[0] + (i - (n - 1) / 2) * T * 1.9; GK.glyph(c, P.seq[i], x, y, T * 0.8, i === P.shown - 1 ? '#FFFFFF' : RED, 1); } }
      // ...and held in a row at the top of the view until the proof is over, the next cut lit
      const y0 = 146, gw = 15, x0 = Wd / 2 - (n - 1) / 2 * gw * 2.3;
      c.save(); c.globalCompositeOperation = 'source-over'; c.font = `900 9px ${arcFont}`; c.textAlign = 'right'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText('PROOF', x0 - gw - 4, y0); c.fillStyle = '#FFFFFF'; c.fillText('PROOF', x0 - gw - 4, y0); c.restore();
      for (let i = 0; i < n; i++) { const x = x0 + i * gw * 2.3, act = !P.cast && i === P.done && P.shown > n - 1, done = P.cast || i < P.done, shown = i < P.shown; if (!shown) { c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y0 - gw); c.lineTo(x + gw, y0); c.lineTo(x, y0 + gw); c.lineTo(x - gw, y0); c.closePath(); c.stroke(); c.restore(); continue; } GK.glyph(c, P.seq[i], x, y0, gw * (act ? 1.15 : 1), act ? '#FFFFFF' : RED, done ? 0.4 : 1); }
      if (P.cast) { const H = M.H, p = GK.at(FX, (H[0].x + H[1].x) / 2, (H[0].y + H[1].y) / 2, (H[0].z + H[1].z) / 2), w = T * 4, py = Math.max(186, p[1] - T * 2.6); FiendBeast.meter(c, p[0], py, w, P.got / P.need, PALE, 'BREAK THE CORE'); FiendBeast.meter(c, p[0], py - T * 0.7, w, 1 - P.cast / P.castT, RED, 'PROOF'); }
    }
    if (M.end) drawEnd(c, FX, M, T, t);
  }
  /* ---- the end: its blades fall into one vertical line over it and drop straight through; the body parts cleanly
     into its eight faces, which fall without a sound and lie on the stone; the last blade stands where it struck ---- */
  const DROP0 = 0.5 + BL * 0.55, DSTEP = BL * 0.55 + 0.3;
  function stepEnd(FX, M, dt) {
    const E = M.end; E.t += dt;
    if (!E.aligned) { E.aligned = true; E.hz = M.hz; setForm(M, 'final', { drop: 0 }, 1.0); }
    if (E.t > 1.05) { const u = clamp01((E.t - 1.05) / 0.45), dropF = 1.6 - (E.hz + HT + DROP0 + 3 * DSTEP); M.formArg = { drop: u * u * dropF }; if (!E.cutS) { E.cutS = 1; const S = sfx(FX); if (S.note) S.note(90, 1.4, 'sine', 0.3, 55); FX.H.flash(0.35, '#FFFFFF'); } if (u >= 1 && !E.planted) { E.planted = 1; FX.H.shake(10, 0.4); FX.H.ring(FX.m.x, FX.m.y, 0.2, 2.6, 0.5, RED, 0.2); const S = sfx(FX); if (S.thud) S.thud(); } }
    if (E.t >= 1.28 && !E.pieces) {
      E.pieces = PIECES.map((P, i) => { const h = M.H[P.h], R = h.R, o = GK.mv(R, P.cen), n = GK.mv(R, P.n); return { i, mesh: P.mesh, R, x: h.x, y: h.y, z: h.z, o, v: GK.add(GK.mul(n, 0.8 + Math.random() * 0.5), [0, 0, 0.4]), w: GK.norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]), a: 0, spin: 0.5 + Math.random() * 0.7, rest: false }; });
      const S = sfx(FX); if (S.crack) S.crack();
    }
    if (E.pieces) for (const p of E.pieces) { if (p.rest) continue; if (E.t - 1.28 > 0.35) p.v[2] -= 9 * dt; p.o = GK.add(p.o, GK.mul(p.v, dt)); p.v[0] *= 0.985; p.v[1] *= 0.985; p.a += p.spin * dt; if (p.z + p.o[2] < 0.3) { p.o[2] = 0.3 - p.z; p.rest = true; const S = sfx(FX); if (S.thud) S.thud(); } }
  }
  function drawEnd(c, FX, M, T, t) {
    const E = M.end, MT = mats(M), ink = (M.silver || 0) > 0.5 ? '#000000' : '#06040A', m = FX.m, fade = clamp01(1 - (E.t - 1.3) / 5);
    MT.body[0].edgeA = (MT.body[0].edgeA || 0) * fade; MT.blade[0].edgeA = (MT.blade[0].edgeA || 0) * fade;
    const items = [];
    if (!E.pieces) M.H.forEach((h, i) => items.push({ dep: h.y * GK.CE / GK.SE + h.z * GK.SE + (i ? 0 : 50), f: () => { const cm = GK.cam(FX.sx(h.x), FX.sy(h.y), T); GK.solid(c, cm, i ? BOT : TOP, { R: h.R, t: [0, 0, h.z] }, { mats: MT.body, ink, seam: baseEdge, seamCol: E.t > 1 ? '#FFFFFF' : RED, seamK: 1 + clamp01(E.t - 0.6) * 1.5 }); } }));
    else E.pieces.forEach(p => items.push({ dep: (p.y + p.o[1] * GK.SE) * GK.CE / GK.SE + (p.z + p.o[2]) * GK.SE, f: () => { const cm = GK.cam(FX.sx(p.x + p.o[0]), FX.sy(p.y + p.o[1] * GK.SE), T); GK.solid(c, cm, p.mesh, { R: GK.mm(GK.axisR(p.w, p.a), p.R), t: [0, 0, p.z + p.o[2]] }, { mats: MT.body, ink, lw: 0.06 }); } }));
    // the blades, hidden below the stone once they strike it
    M.bl.forEach((b, i) => items.push({ dep: bladeDep(b), f: () => { c.save(); c.beginPath(); c.rect(-1e4, -1e4, 2e4, 1e4 + FX.sy(m.y)); c.clip(); drawBlade(c, FX, M, MT, b, i, T, ink); c.restore(); } }));
    items.sort((a, b) => a.dep - b.dep).forEach(it => it.f());
    if (E.t > 1.05 && E.t < 1.7) { const p = GK.at(FX, m.x, m.y, E.hz), k = 1 - clamp01((E.t - 1.05) / 0.65); c.save(); c.globalCompositeOperation = 'lighter'; softRay(c, p[0], p[1] - T * 9, p[0], p[1] + T * 3, 9, '#FFFFFF', k); c.restore(); }
  }

  return {
    arenaR: 15, firstAct: 'float', artY: 0.86, ambient: 'embers',
    // for the tests: its attacks, to be played one at a time
    _t: { bisection, crossExam, pinpoint, faultLines, contradiction, closing, reassembly, finalProof, HS, CELL },
    artPoses: [{ name: 'hovering, blades inward', mem: { form: 'rest' } }, { name: 'Bisection', mem: { form: 'line', formArg: { a: 0.3 } } }, { name: 'Cross Examination', mem: { form: 'cross', formArg: { a0: 0 } } }, { name: 'Pinpoint', mem: { form: 'pin' } },
      { name: 'Fault Lines', mem: { form: 'lanes', formArg: { axis: 'x' } } }, { name: 'II · Contradiction', mem: { split: 1, form: 'contra', formArg: { a1: 0, a2: Math.PI / 4 } }, lv: 2 }, { name: 'II · the seam open', mem: { split: 0, seam: 1, coreK: 1, form: 'rest' }, lv: 2 },
      { name: 'III · Absolute Zero', mem: { silver: 1, form: 'crown' }, lv: 3 }, { name: 'III · Final Proof, open', mem: { silver: 1, split: 1, coreK: 1, form: 'crown' }, lv: 3 }],
    phaseNames: ['The Measured Cut', 'The Broken Equation', 'Absolute Zero'],
    start(C) { return { x: C.x + 0.5, y: C.y + HS - 2.4 }; },
    carve(set, C) { for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) { const wx = C.x + x + 0.5, wy = C.y + y + 0.5; if (Math.hypot(wx - C.x, wy - C.y) >= C.R) continue; if (Math.abs(wx - C.x) > HS || Math.abs(wy - C.y) > HS) set(Math.floor(wx), Math.floor(wy), T_GAP); } },
    /* ---- the platform: sixteen basalt cells scored by old cuts, deep grooves with the abyss's light in them ---- */
    paintGround(c, A) {
      const rnd = A.rnd;
      // the slab's face toward us, and its shadow on the haze far below
      let g = c.createLinearGradient(0, HS, 0, HS + 2.2); g.addColorStop(0, '#2C2228'); g.addColorStop(0.25, '#140E12'); g.addColorStop(1, 'rgba(10,4,6,0)'); c.fillStyle = g; c.fillRect(-HS, HS, HS * 2, 2.2);
      for (let x = -HS; x < HS; x += 0.55) { c.fillStyle = `rgba(0,0,0,${0.2 + rnd() * 0.35})`; c.fillRect(x, HS, 0.07, 0.5 + rnd() * 1.2); }
      g = c.createLinearGradient(0, HS + 0.9, 0, HS + 2.2); g.addColorStop(0, 'rgba(255,40,50,0)'); g.addColorStop(1, 'rgba(255,40,50,.18)'); c.fillStyle = g; c.fillRect(-HS, HS + 0.9, HS * 2, 1.3);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
        const x0 = -HS + i * CELL + 0.12, y0 = -HS + j * CELL + 0.12, w = CELL - 0.24, tone = 25 + Math.floor(rnd() * 9);
        const cg = c.createLinearGradient(x0, y0, x0 + w, y0 + w); cg.addColorStop(0, `rgb(${tone + 15},${tone + 9},${tone + 15})`); cg.addColorStop(1, `rgb(${tone - 7},${tone - 10},${tone - 5})`); c.fillStyle = cg; c.fillRect(x0, y0, w, w);
        c.save(); c.beginPath(); c.rect(x0, y0, w, w); c.clip();
        c.globalAlpha = 0.95; c.fillStyle = GK.pat('stone', 4 / 256, i * 1.37, j * 2.11); c.fillRect(x0, y0, w, w); c.globalAlpha = 0.5; c.fillStyle = GK.pat('stain', 6 / 256, i * 0.9, j * 1.7); c.fillRect(x0, y0, w, w); c.globalAlpha = 1;
        // old cuts: straight grooves with a bright lip and a dark floor
        for (let k = 0; k < 3; k++) { const a = [0, PI2, Math.PI / 4, -Math.PI / 4][rnd() * 4 | 0], cx = x0 + rnd() * w, cy = y0 + rnd() * w, L = 0.8 + rnd() * 3, dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2; c.lineCap = 'round'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 0.09; c.beginPath(); c.moveTo(cx - dx, cy - dy); c.lineTo(cx + dx, cy + dy); c.stroke(); c.strokeStyle = 'rgba(220,210,220,.22)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(cx - dx - 0.04, cy - dy - 0.04); c.lineTo(cx + dx - 0.04, cy + dy - 0.04); c.stroke(); }
        c.restore();
        // a bevel: light on the top and left edges, dark below and right
        c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x0, y0, w, 0.12); c.fillRect(x0, y0, 0.12, w); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(x0, y0 + w - 0.15, w, 0.15); c.fillRect(x0 + w - 0.15, y0, 0.15, w);
      }
      // the grooves: deep, with a thread of red light from below in each
      c.fillStyle = '#030103'; for (let k = 0; k <= 4; k++) { c.fillRect(-HS + k * CELL - 0.12, -HS, 0.24, HS * 2); c.fillRect(-HS, -HS + k * CELL - 0.12, HS * 2, 0.24); }
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,40,52,.45)'; c.lineWidth = 0.06; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-HS + k * CELL, -HS); c.lineTo(-HS + k * CELL, HS); c.moveTo(-HS, -HS + k * CELL); c.lineTo(HS, -HS + k * CELL); c.stroke(); }
      for (let k = 1; k < 4; k++) for (let l = 1; l < 4; l++) { const gx = -HS + k * CELL, gy = -HS + l * CELL, gg = c.createRadialGradient(gx, gy, 0, gx, gy, 0.7); gg.addColorStop(0, 'rgba(255,60,60,.35)'); gg.addColorStop(1, 'rgba(255,60,60,0)'); c.fillStyle = gg; c.fillRect(gx - 0.7, gy - 0.7, 1.4, 1.4); }
      c.globalCompositeOperation = 'source-over';
      // the rim: dark iron round the slab, riveted
      c.strokeStyle = '#2E262C'; c.lineWidth = 0.34; c.strokeRect(-HS + 0.17, -HS + 0.17, HS * 2 - 0.34, HS * 2 - 0.34); c.strokeStyle = 'rgba(255,255,255,.1)'; c.lineWidth = 0.05; c.strokeRect(-HS + 0.05, -HS + 0.05, HS * 2 - 0.1, HS * 2 - 0.1);
      c.fillStyle = '#5A4A52'; for (let k = 0; k <= 20; k++) for (const [x, y] of [[-HS + k, -HS + 0.17], [-HS + k, HS - 0.17], [-HS + 0.17, -HS + k], [HS - 0.17, -HS + k]]) { c.beginPath(); c.arc(x, y, 0.07, 0, TAU); c.fill(); }
    },
    /* ---- the abyss: black above, the red of something burning far below, black shards drifting in it ---- */
    sky(c, W2, H2, t, cam, T, FX) {
      const px = cam ? (cam.x - 28) * T : 0, py = cam ? (cam.y - 28) * T : 0;
      let g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, '#040105'); g.addColorStop(0.4, '#15030A'); g.addColorStop(0.75, '#3E0711'); g.addColorStop(1, '#7E121C'); c.fillStyle = g; c.fillRect(0, 0, W2, H2);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const y = H2 * (0.5 + i * 0.11) + Math.sin(t * 0.4 + i) * 12 - py * 0.05, gr = c.createLinearGradient(0, y - 50, 0, y + 50); gr.addColorStop(0, 'rgba(255,40,40,0)'); gr.addColorStop(0.5, `rgba(255,60,50,${0.05 + i * 0.022})`); gr.addColorStop(1, 'rgba(255,40,40,0)'); c.fillStyle = gr; c.fillRect(0, y - 50, W2, 100); }
      for (let i = 0; i < 4; i++) { const x = ((i * 260 + 80 - px * 0.1) % (W2 + 300) + W2 + 300) % (W2 + 300) - 150, gr = c.createLinearGradient(x - 40, 0, x + 40, 0); gr.addColorStop(0, 'rgba(255,50,40,0)'); gr.addColorStop(0.5, `rgba(255,70,50,${0.07 + 0.03 * Math.sin(t * 0.7 + i)})`); gr.addColorStop(1, 'rgba(255,50,40,0)'); c.fillStyle = gr; c.fillRect(x - 40, 0, 80, H2); }
      c.restore();
      // far shards: small black octahedra drifting, rimmed with red
      for (let i = 0; i < 10; i++) { const dpt = 0.12 + (i % 3) * 0.1, x = ((i * 173 + t * 5 * (1 + i % 2) - px * dpt) % (W2 + 200) + W2 + 200) % (W2 + 200) - 100, y = H2 * (0.18 + ((i * 37) % 64) / 100) - py * dpt * 0.4 + Math.sin(t * 0.5 + i) * 8, s = 10 + (i % 4) * 8, r = t * 0.3 + i;
        c.save(); c.translate(x, y); c.fillStyle = '#060206'; c.beginPath(); c.moveTo(0, -s * 1.2); c.lineTo(s * Math.cos(r) * 0.8 + s * 0.2, 0); c.lineTo(0, s * 1.35); c.lineTo(-s * 0.8 * Math.cos(r) - s * 0.2, 0); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,50,60,.45)'; c.lineWidth = 1.2; c.stroke(); c.restore(); }
      // ash rising
      c.fillStyle = 'rgba(255,120,90,.45)'; for (let i = 0; i < 50; i++) { const x = ((i * 97 - px * 0.15) % W2 + W2) % W2, y = H2 - ((i * 53 + t * (14 + (i % 5) * 6)) % (H2 + 20)); c.fillRect(x, y, 1.5, 1.5); }
    },
    overlay(c, FX, t, T) { const M = FX.mem; if (!M.bl) return; drawFloorMarks(c, FX, M, T, t); },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m, C = FX.C; m.x = C.x; m.y = C.y - 1; m.noTouch = true; m.r = 2.4;
      ensure(M, m); Object.assign(M, { cyc: 0, gap: 1.6, sigCd: 10, job: null, open: 0 });
    },
    phase(FX, p, lv) {
      const M = FX.mem, m = FX.m; if (M.job) { M.job = null; } GK.clearWarns(FX); M.sq = null; M.mark = null; M.re = null; M.proof = null; M.bladeProps = false; syncProps(FX, M); M.cyc = 0; M.gap = 0.6; M.open = 0; M.coreK = 0; M.seam = 0; M.mv = null; M.hzTo = HZ; M.hzV = 6;
      if (lv === 2) { M.trans = { k: 'split', t: 0 }; setForm(M, 'rest', {}, 0.6); FX.H.banner('THE BROKEN EQUATION', 'It divides. The upper half calls the first cut; the lower, the second.', RED, 3, true); }
      if (lv === 3) { M.trans = { k: 'zero', t: 0 }; M.fis.forEach(f => { f.gone = f.gone || 0.01; }); M.sigCd = 5; FX.H.banner('ABSOLUTE ZERO', 'Pale and quick. Its blades lock into a crown; read the floor.', PALE, 3, true); }
      moveBody(M, m, FX.C.x, FX.C.y - 1, 0.6);
    },
    ai(FX, m, dt) {
      const M = FX.mem; M.gap -= dt; M.sigCd -= dt; M.idleT -= dt;
      if (M.trans) { bodyParts(FX, m); return; }
      if (M.job) { if (GK.stepJob(FX, m, M.job, dt)) endJob(FX); }
      else if (M.gap <= 0) M.job = pickJob(FX, m, FX.S.lv);
      // at rest it turns, a quarter at a time; parted, the halves turn against each other
      if (M.idleT <= 0) { M.idleT = 1.4 + Math.random() * 1.2; if (!M.job || M.form === 'rest' || M.form === 'crown') { if ((M.split || 0) > 0.5) counterTurn(M); else turn(M, Math.random() < 0.5 ? 1 : -1); } }
      bodyParts(FX, m);
    },
    stunned(FX, m, dt) { bodyParts(FX, m); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return; ensure(M, m);
      if (M.trans) { const T2 = M.trans; T2.t += dt;
        if (T2.k === 'split') { M.split = ease(clamp01((T2.t - 0.4) / 1.0)); if (T2.t < 1.4) M.seam = Math.sin(clamp01(T2.t / 1.4) * Math.PI) * 0.3; if (T2.t > 0.5 && !T2.turned) { T2.turned = 1; counterTurn(M); } if (T2.t > 1.6) { M.trans = null; M.seam = 0; } }
        else { M.split = 1 - ease(clamp01(T2.t / 0.5)); M.silver = ease(clamp01((T2.t - 0.5) / 1.1)); if (T2.t > 0.5 && !T2.slam) { T2.slam = 1; FX.H.flash(0.5, PALE); FX.H.shake(16, 0.5); setForm(M, 'crown', {}, 0.7); const S = sfx(FX); if (S.crack) S.crack(); } if (T2.t > 1.8) M.trans = null; }
      }
      if (M.open > 0) M.open -= dt;
      stepPose(FX, m, dt); GK.stepVfx(M, dt);
      // the blades on the floor follow their poses as props
      if (M.bladeProps) FX.S.props.forEach(p => { if (p.kind === 'abBlade') { const b = M.bl[p.i]; if (b) { p.x = b.x + b.d[0] * BL * b.len * 0.5; p.y = b.y + b.d[1] * BL * b.len * 0.5 + 0.01; } } });
      // fissures: they open, bar the way, and close
      M.fis.forEach(f => { f.k += dt; if (f.gone) f.gone += dt; }); M.fis = M.fis.filter(f => !(f.gone > 0.5));
      M.walls = M.fis.filter(f => !f.gone && f.k > 0.15); GK.walls(FX, M.walls);
      if (M.end) stepEnd(FX, M, dt);
    },
    // the camera looks up at its body rather than at its feet, and stays on it while it falls apart
    camFocus(FX, m) { const M = FX.mem; if (!M.bl) return null; if (M.end) return M.end.t < 9 ? { x: m.x, y: m.y - 2.4, k: 0.72, zoom: 0.7 } : null; if (m.dead || m.act === 'enter') return null; return { x: m.x, y: m.y - M.hz * GK.CE * 0.85, k: 0.38, zoom: 0.62 }; },
    dmgK(FX, m, o) { const M = FX.mem; if (M.end) return 0; if (M.proof && M.proof.cast) return 0.25; if (m.stunT > 0) return 1.1; if (M.open > 0) return 1.5; return 0.55; },
    onWeakHit(FX, key, dmg) { const M = FX.mem; if (key === 'core' && M.proof && M.proof.cast) M.proof.got += dmg; },
    draw(c, FX, m, X, Y, T, t) { if (FX.mem.end) return; drawAbaddon(c, FX, m, X, Y, T, t); },
    drawProp(c, FX, p, X, Y, T, t) { const M = FX.mem; if (p.kind !== 'abBlade' || !M.bl || !M.bladeProps) return; drawBlade(c, FX, M, mats(M), M.bl[p.i], p.i, T, (M.silver || 0) > 0.5 ? '#000000' : '#06040A'); },
    drawFx(c, FX, T, t) { const M = FX.mem; if (!M.bl) return; drawAir(c, FX, M, T, t); },
    ending(FX, m) { const M = FX.mem; ensure(M, m); GK.clearWarns(FX); M.job = null; M.sq = null; M.mark = null; M.proof = null; M.re = null; M.bladeProps = false; syncProps(FX, M); M.fis.forEach(f => { f.gone = f.gone || 0.01; }); M.split = 0; M.coreK = 0; M.seam = 0; M.end = { t: 0 }; M.walls = [];
      return { title: 'ABADDON IS DIVIDED', sub: 'Eight pieces fall without a sound', col: '#FF8A90', delay: 7.5, bannerAt: 3.4, fanfareAt: 3.4, quiet: true, slow: 0.4 }; },
  };
})();
