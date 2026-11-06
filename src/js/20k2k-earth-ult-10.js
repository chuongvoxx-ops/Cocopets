/* ---------- Earth, reworked: Rocky ----------
   Two giant stone fists (a left and a right) form beside the pet and throw a punching combination that the pet mirrors.
   Replaces the Earth Burning Mandala (row in 20k1: key 'rocky', cost 100, cd 22, glyph 'fist').
   Formation (~1.05 s): pebbles rise beside the pet and spiral into two loose clusters; the large pieces lock first (palm,
   back plate, knuckles), then the fingers and thumb, then the wrist and its broken cuff; each fist turns into its guard
   while thin golden strands join the pet's hands to the stone wrists and the pet lowers into a fighting stance.
   Combos (exactly 2 / 4 / 7 damaging strikes at levels 1 / 4 / 7; levels between hold: 2 2 2 4 4 4 7):
     L1-3  left uppercut, right uppercut
     L4-6  left uppercut, right uppercut (both stay raised a beat), left downward punch, right downward punch (heavier)
     L7    left uppercut, right uppercut (heavier, lifts), left hook, right hook, sinking left body blow, right overhead
           punch (rises, turns knuckles down, crashes), final colossal straight right: both fists recoil, loose rocks rush
           into the right fist (bigger knuckles, extra plates, x1.3), light runs wrist -> knuckles, the pet braces and
           lunges and the fist drives straight through: the combo's largest Earth explosion.
   Every strike: windup, a short deliberate hold, a sharp acceleration, contact, recoil, transition; the fists follow
   the pet's gesture with a small lag (the pet's pose leads by 0.07 s). Each strike deals its hit once per monster in
   its own area, at the moment the drawn fist reaches it: uppercut / downward / overhead a circle at the contact point
   (1.15 / 1.25 (4th 1.6) / 1.35 x K tiles); hooks a sweep round the pet (each monster when the fist passes its bearing);
   the body blow a band driven forward (each monster when the knuckles pass it); the final punch a forward sector
   (+-0.62 rad, reach D + 2.6 x K) whose front is the fist, then its shockwave. Trails, chips and fragments never hit.
   Damage (DK = base x K x (1 + 0.08 (evo - 1))), per monster in the area, per strike:
     2 strikes: 6.5, 7.5 (14 DK)        4 strikes: 3.3, 3.5, 3.4, 4.6 (14.8 DK)
     7 strikes: 2.3, 2.6, 2.3, 2.3, 2.6, 2.9, 5.6 (20.6 DK: the final punch the strongest)
   Uppercuts lift (H.lift: bosses are only stunned briefly), downward blows stun, hooks / the body blow / the final
   punch push a little (H.push: never a boss). Earth damage through hitMon.
   The pet mirrors each punch through small rig hooks: me.hopArmS (each arm's own swing, 12-arcade drawPetRig), me.hopLean
   (a lean added to its tilt) and me.hopDX / hopDY (a short lunge, drawn only) in 20b, with the existing me.z / me.hopSq
   (rise, crouch). It never turns (no pose.yaw).
   Ending: the pet relaxes, the fists pull back, their veins dim, the fingers loosen and each fist splits into its own
   stones (cut from its picture by part), which fall a short way and crumble into dust.
   Models: ray-cast per pixel (the EARTHC view and noise from 20k2e): ~30 convex stones per fist (palm, layered back
   plates, four three-segment fingers with broad knuckles, a thick thumb folded across them, the wrist, a broken cuff of
   six chunks; Adept adds knuckle plates, Celestial layered plates, a knuckle ridge and denser veins), each a box cut by
   jittered planes (chamfered edges, cut corners, chips), with rounded bevels, an object-space bump and grain, charcoal
   cel bands, pale worn edges, a warm bounce from below, recessed amber veins (a cellular network), dark crevices between
   the stones with amber light inside them (brightest between the knuckles), an ink silhouette; and a separate emissive
   layer with a baked halo. Performance: no live 3D in play. Each fist orientation (16 headings x 7 pitches, knuckles up
   to knuckles down, the left fist the mirror of the right) is baked once per level tier into a small cached picture,
   lazily, a slice at a time (~0.7 ms a frame; 3 ms while what is on screen is still missing), most urgent first, and
   cross-faded between neighbours; a floor that starts with Rocky in a kit bakes them all in idle time (U.rocky.warm, the
   hook in 20b). Effects are cached sprites; particles via H.n / H.Q. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.mandala;
  const E = EARTHC, TAU = Math.PI * 2, GY = 0.55, { cl, lerp, sstep, R1, vn3, vor3, nrm } = E;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', EMBER = '#FFF4D6';
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, w); cv.height = Math.max(1, h); return cv; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const mvm = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  const mmm = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; }, ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; }, rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const eul = r => mmm(rz(r[2] || 0), mmm(ry(r[1] || 0), rx(r[0] || 0)));
  const rngOf = s => { let x = (Math.floor(s * 1000) >>> 0) || 7; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };
  const wrapA = a => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  let H = null;

  /* ================= the ray caster (the EARTHC view: x right, y toward the viewer, z up; screen X = x, Y = y GY - z) ================= */
  const LIT = nrm([-0.55, 0.5, 0.78]), VIEW = nrm([0, 0.84, 0.55]), HV = nrm([LIT[0] + VIEW[0], LIT[1] + VIEW[1], LIT[2] + VIEW[2]]), RAYK = Math.hypot(1, GY);
  function prep(pl) { const n = pl.length, F = () => new Float64Array(n), P = { n, NX: F(), NY: F(), NZ: F(), D: F(), A: F(), GX: F(), GZ: F() };
    pl.forEach((p, k) => { P.NX[k] = p.n[0]; P.NY[k] = p.n[1]; P.NZ[k] = p.n[2]; P.D[k] = p.d; const a = p.n[1] + p.n[2] * GY; P.A[k] = a; P.GX[k] = Math.abs(a) > 1e-5 ? -p.n[0] / a : 0; P.GZ[k] = Math.abs(a) > 1e-5 ? p.n[2] / a : 0; }); return P; }
  // one ray through a convex stone: the front face, the next one (edge distance), the back, the silhouette distance (px)
  const O = { i1: 0, i2: -1, jl: 0, y: 0, th: 0, sil: 0, ed: 0 };
  function cast(P, sx, sy, S) {
    let u1 = 1e9, i1 = -1, u2 = 1e9, i2 = -1, lo = -1e9, jl = -1; const NX = P.NX, NZ = P.NZ, D = P.D, A = P.A;
    for (let k = 0; k < P.n; k++) { const a = A[k], r = D[k] - NX[k] * sx + NZ[k] * sy;
      if (a > 1e-5) { const v = r / a; if (v < u1) { u2 = u1; i2 = i1; u1 = v; i1 = k; } else if (v < u2) { u2 = v; i2 = k; } }
      else if (a < -1e-5) { const v = r / a; if (v > lo) { lo = v; jl = k; } }
      else if (r < 0) return false; }
    if (i1 < 0 || jl < 0) return false;
    const gs = Math.min(6, Math.hypot(P.GX[i1] - P.GX[jl], P.GZ[i1] - P.GZ[jl])) || 1; O.sil = (u1 - lo) / gs * S;
    if (i2 >= 0) { const ge = Math.hypot(P.GX[i2] - P.GX[i1], P.GZ[i2] - P.GZ[i1]) || 1; O.ed = (u2 - u1) / ge * S; } else O.ed = 1e9;
    O.i1 = i1; O.i2 = i2; O.jl = jl; O.y = u1; O.th = (u1 - lo) * RAYK; return true; }
  function blur(A, W, Hh, r) { const tmp = new Float32Array(W * Hh);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < Hh; y++) { let acc = 0; const o = y * W; for (let x = -r; x < W + r; x++) { if (x + r < W) acc += A[o + Math.min(W - 1, x + r)]; if (x - r - 1 >= 0) acc -= A[o + x - r - 1]; if (x >= 0 && x < W) tmp[o + x] = acc / (2 * r + 1); } }
      for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y < Hh + r; y++) { if (y + r < Hh) acc += tmp[Math.min(Hh - 1, y + r) * W + x]; if (y - r - 1 >= 0) acc -= tmp[(y - r - 1) * W + x]; if (y >= 0 && y < Hh) A[y * W + x] = acc / (2 * r + 1); } } } }
  // the emissive layer: amber -> honey -> ember white by intensity, a soft halo round it (drawn additively)
  function glowRows(Em, B, d, W, y1, y0, halo) { for (let i = y0 * W, o = i * 4; i < y1 * W; i++, o += 4) { const e = Em[i], a = cl(e + halo * B[i]); if (a < 0.004) continue; const k = cl(e * 1.15);
      d[o] = 217 + 38 * sm(k * 2); d[o + 1] = k < 0.5 ? 138 + 69 * sm(k * 2) : 207 + 37 * sm(k * 2 - 1); d[o + 2] = k < 0.5 ? 30 + 62 * sm(k * 2) : 92 + 122 * sm(k * 2 - 1); d[o + 3] = a * 255; } }
  function glowCanvas(Em, B, W, Hh, halo) { const cv = mk(W, Hh), g = cv.getContext('2d'), im = g.createImageData(W, Hh), d = im.data;
    for (let i = 0, o = 0; i < W * Hh; i++, o += 4) { const e = Em[i], a = cl(e + halo * B[i]); if (a < 0.004) continue; const k = cl(e * 1.15);
      d[o] = 217 + 38 * sm(k * 2); d[o + 1] = k < 0.5 ? 138 + 69 * sm(k * 2) : 207 + 37 * sm(k * 2 - 1); d[o + 2] = k < 0.5 ? 30 + 62 * sm(k * 2) : 92 + 122 * sm(k * 2 - 1); d[o + 3] = a * 255; }
    g.putImageData(im, 0, 0); return cv; }

  /* ================= the fist: stones on a hand (fist units: x toward the knuckles, y to the pinky side, z the back of
     the hand; a right fist, its thumb on -y) ================= */
  /* a stone: a box (half sizes e; its +x end scaled by tp, its -x end by tn) whose faces tilt a little, every edge
     chamfered (bev), every corner cut (bevC) and a few chips taken off; turned by r, placed at c. Planes n.p <= d */
  function stone(o, seed) {
    const R = rngOf(seed), [a, b, c] = o.e, tp = o.tp == null ? 1 : o.tp, tn = o.tn == null ? 1 : o.tn;
    const cor = []; for (const x of [-1, 1]) for (const [sy, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const k = x > 0 ? tp : tn; cor.push([x * a, sy * b * k, sz * c * k]); }
    const sup = n => { let s = -1e9; for (const p of cor) { const d = dot3(n, p); if (d > s) s = d; } return s; };
    const QF = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const fnm = QF.map(q => { let n = nrm(cross3(sub3(cor[q[1]], cor[q[0]]), sub3(cor[q[2]], cor[q[0]]))); if (dot3(n, cor[q[0]]) < 0) n = mul3(n, -1); return n; });
    const pl = [], J = o.jit == null ? 0.1 : o.jit, bev = o.bev == null ? 0.25 : o.bev, bevC = o.bevC == null ? 0.35 : o.bevC;
    const P = (n, k) => { n = nrm(n); const s = sup(n); pl.push({ n, d: s * (1 - k) }); };
    const jt = n => nrm(add3(n, [(R() - 0.5) * J, (R() - 0.5) * J, (R() - 0.5) * J]));
    fnm.forEach(n => P(jt(n), R() * 0.03));
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (QF[i].filter(k => QF[j].includes(k)).length === 2) P(jt(add3(fnm[i], fnm[j])), bev * (0.5 + R() * 1.0));
    for (let k = 0; k < 8; k++) { let s = [0, 0, 0]; QF.forEach((q, i) => { if (q.includes(k)) s = add3(s, fnm[i]); }); P(jt(s), bevC * (0.5 + R() * 0.9)); }
    const nch = o.chips == null ? 1 : o.chips; for (let k = 0; k < nch; k++) P([R() * 2 - 1, R() * 2 - 1, R() * 2 - 1], 0.07 + R() * 0.14);
    // into the fist's frame
    const Rm = eul(o.r || [0, 0, 0]), C0 = o.c;
    const planes = pl.map(p => { const n = mvm(Rm, p.n); return { n, d: p.d + dot3(n, C0) }; });
    const corners = cor.map(p => add3(mvm(Rm, p), C0));
    return { pl: planes, cor: corners, c: C0 };
  }
  /* groups (for the crevice light and the end's split): 1 palm, 2 back plates, 3..6 the fingers (index..pinky), 7 the
     thumb, 8 the wrist, 9..14 the cuff's chunks, 15 extra plates. kind: 'full', 's1' (palm, plates, knuckles),
     's2' (+ fingers, thumb), 'big' (the final punch's reinforced fist) */
  const MODELS = {};
  function model(tier, kind) {
    const key = tier + kind; if (MODELS[key]) return MODELS[key];
    const parts = [], big = kind === 'big', T2 = tier >= 2 || big, T3 = tier >= 3 || big; let sd = 11;
    const put = (grp, mat, o, lv) => { if (kind === 's1' && lv > 1) return; if (kind === 's2' && lv > 2) return; o = Object.assign({}, o, { e: o.e.map(v => v * 1.1), bev: (o.bev == null ? 0.25 : o.bev) * 0.62, bevC: (o.bevC == null ? 0.35 : o.bevC) * 0.6 }); const s = stone(o, (sd++) * 7.13 + tier * 0.31 + (big ? 0.5 : 0)); parts.push(Object.assign(s, { grp, mat, em: o.em == null ? 1 : o.em, vk: o.vk || 0 })); };
    // the palm and one broad smooth plate over the back of the hand, rising to the knuckle ridge
    put(1, 'stone', { c: [-0.05, 0.0, -0.06], e: [0.48, 0.55, 0.32], tp: 0.97, tn: 0.9, bev: 0.32, bevC: 0.42, chips: 1, jit: 0.07, vk: 0.35 }, 1);
    put(2, 'plate', { c: [-0.1, 0.02, 0.3], e: [0.46, 0.57, 0.12], r: [0, -0.1, 0], tn: 0.92, bev: 0.45, bevC: 0.52, chips: 1, jit: 0.05, vk: 1 }, 1);
    if (T2) put(2, 'plate', { c: [0.16, 0.0, 0.41], e: [0.1, 0.52, 0.07], r: [0, -0.25, 0], bev: 0.5, bevC: 0.55, chips: 1, jit: 0.05, vk: 0.6 }, 1);   // Adept: a ridge plate behind the knuckles
    if (T3) { put(2, 'plate', { c: [-0.34, 0.0, 0.43], e: [0.2, 0.47, 0.08], r: [0, -0.06, 0], bev: 0.5, bevC: 0.55, chips: 1, jit: 0.05, vk: 1 }, 1); put(15, 'plate', { c: [-0.1, 0.6, 0.02], e: [0.34, 0.07, 0.24], bev: 0.45, bevC: 0.55, chips: 1, vk: 0.6 }, 3); }
    // the row of four big rounded knuckles, the curled finger fronts stepping down below them as four bars
    const FY = [-0.42, -0.14, 0.14, 0.41], FW = [0.15, 0.155, 0.15, 0.135], FX = [0, 0.03, 0, -0.06], FZ = [0, 0.02, 0, -0.04], KB = big ? 1.3 : 1;
    for (let i = 0; i < 4; i++) {
      const y = FY[i], w = FW[i], x = FX[i], z = FZ[i], g = 3 + i;
      put(g, 'knuck', { c: [0.47 + x + (big ? 0.06 : 0), y, 0.19 + z + (big ? 0.03 : 0)], e: [0.25 * KB, w * (big ? 1.06 : 1), 0.23 * KB], r: [0, 0.22, (i - 1.5) * 0.04], bev: 0.52, bevC: 0.62, chips: 0, jit: 0.07, em: 1.3 }, 1);
      put(g, 'stone', { c: [0.7 + x + (big ? 0.08 : 0), y, -0.19 + z], e: [0.15, w * 0.94, 0.22], r: [0, -0.2, 0], bev: 0.42, bevC: 0.5, chips: 0, jit: 0.07, em: 1.15 }, 2);
    }
    // the thick thumb: a heavy base on the side, wrapped across the fronts of the index and middle fingers
    put(7, 'stone', { c: [0.12, -0.6, -0.1], e: [0.3, 0.18, 0.21], r: [0.2, 0.1, 0.45], bev: 0.42, bevC: 0.5, chips: 0, jit: 0.07 }, 2);
    put(7, 'knuck', { c: [0.86, -0.27, -0.3], e: [0.14, 0.28, 0.15], r: [0, 0.05, 0.3], bev: 0.48, bevC: 0.58, chips: 0, jit: 0.06, em: 1.1 }, 2);
    // the wrist narrows; a short broken cuff of four chunks (one fallen out)
    put(8, 'stone', { c: [-0.72, 0.0, -0.02], e: [0.26, 0.38, 0.3], tn: 0.88, bev: 0.36, bevC: 0.46, chips: 1, jit: 0.07 }, 3);
    const CK = big ? 1.12 : 1;
    for (const k of [0, 1, 2, 4]) { const an = k / 5 * TAU + 0.5, rr = 0.44 * CK, jag = R1(k * 3.3 + tier) - 0.5;
      put(9 + k, 'plate', { c: [-0.93 + jag * 0.06, Math.cos(an) * rr, Math.sin(an) * rr * 0.95], e: [0.14 + 0.03 * jag, 0.25 * CK, 0.11], r: [an - Math.PI / 2, 0.15 * jag, 0], tp: 0.8 + 0.25 * jag, bev: 0.32, bevC: 0.5, chips: 2, jit: 0.18, em: 0.7 }, 3); }
    if (big) { put(15, 'plate', { c: [0.0, 0.05, 0.47], e: [0.3, 0.42, 0.08], r: [0.06, -0.12, 0.12], bev: 0.5, bevC: 0.55, chips: 1, vk: 1 }, 1); put(15, 'stone', { c: [-0.48, -0.36, 0.33], e: [0.16, 0.15, 0.12], r: [0.3, 0.2, 0.5], chips: 1 }, 3); }
    return (MODELS[key] = { parts, tier, kind, veins: T3 ? 1.4 : T2 ? 1.2 : 1 });
  }
  /* an orientation (psi: heading on the floor, phi: 0 knuckles up .. PI knuckles down) as the fist frame's axes in the
     world: d (knuckles), y (pinky side), b (back of the hand). The hand rolls with the pitch: knuckles up the palm faces
     the pet, straight out the thumb is on top (a vertical fist), knuckles down the palm faces the pet again */
  function orient(psi, phi) {
    const f = [Math.cos(psi), Math.sin(psi), 0], up = [0, 0, 1], c = Math.cos(phi), s = Math.sin(phi);
    const d = add3(mul3(up, c), mul3(f, s)), b0 = sub3(mul3(f, c), mul3(up, s)), y0 = cross3(b0, d), b = sub3(mul3(b0, Math.cos(2 * phi)), mul3(y0, Math.sin(2 * phi))), y = cross3(b, d);
    return [d[0], y[0], b[0], d[1], y[1], b[1], d[2], y[2], b[2]];
  }
  const NPSI = 12, NPHI = 5, DPSI = TAU / NPSI, DPHI = Math.PI / (NPHI - 1);
  const PAL = { stone: [[14, 13, 13], [33, 32, 31], [58, 56, 53], [94, 90, 85], [140, 134, 125]], plate: [[18, 17, 16], [43, 41, 38], [73, 69, 64], [114, 108, 100], [166, 158, 145]], knuck: [[16, 15, 14], [39, 37, 35], [68, 64, 60], [108, 102, 95], [158, 150, 138]] };
  const fin = g => g >= 3 && g <= 7;   // (a finger or the thumb)
  /* bake one picture: the fist turned by Mw at Spx pixels per fist unit. A generator, a few rows a step. Body, emissive
     layer and, per pixel, its stone's group (for the end's split). Its anchor (the fist's origin) at cx, cy */
  function* fistGen(md, Mw, Spx, res) {
    const Mt = [Mw[0], Mw[3], Mw[6], Mw[1], Mw[4], Mw[7], Mw[2], Mw[5], Mw[8]], vk = md.veins;
    const PP = md.parts.map(pt => { const P = prep(pt.pl.map(p => ({ n: mvm(Mw, p.n), d: p.d }))), b = [1e9, 1e9, -1e9, -1e9];
      for (const p0 of pt.cor) { const p = mvm(Mw, p0), X = p[0], Y = p[1] * GY - p[2]; if (X < b[0]) b[0] = X; if (X > b[2]) b[2] = X; if (Y < b[1]) b[1] = Y; if (Y > b[3]) b[3] = Y; }
      return { pt, P, b, R: { i1: 0, i2: -1, jl: 0, y: 0, th: 0, sil: 0, ed: 0 } }; });
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const q of PP) { x0 = Math.min(x0, q.b[0]); y0 = Math.min(y0, q.b[1]); x1 = Math.max(x1, q.b[2]); y1 = Math.max(y1, q.b[3]); }
    const pad = 3, W = Math.ceil((x1 - x0) * Spx) + pad * 2, Hh = Math.ceil((y1 - y0) * Spx) + pad * 2, cx = -x0 * Spx + pad, cy = -y0 * Spx + pad, N = W * Hh;
    const cv = mk(W, Hh), g = cv.getContext('2d'), im = g.createImageData(W, Hh), dd = im.data, Em = new Float32Array(N), G = new Uint8Array(N), C0 = [0, 0, 0, 0], C1 = [0, 0, 0, 0];
    const bands = ndl => 0.3 * sstep(0.04, 0.18, ndl) + 0.35 * sstep(0.34, 0.48, ndl) + 0.35 * sstep(0.66, 0.78, ndl), bw = Math.max(1.1, Spx * 0.075);
    // shade stone q at screen (sx, sy) into out [r, g, b, emissive]
    function shade(q, sx, sy, out) {
      const R = q.R, P = q.P, wx = sx, wy = R.y, wz = wy * GY - sy, qx = Mt[0] * wx + Mt[1] * wy + Mt[2] * wz, qy = Mt[3] * wx + Mt[4] * wy + Mt[5] * wz, qz = Mt[6] * wx + Mt[7] * wy + Mt[8] * wz, sdd = q.pt.grp * 3.1;
      let nx = P.NX[R.i1], ny = P.NY[R.i1], nz = P.NZ[R.i1];
      const bwq = q.pt.mat === 'knuck' ? bw * 2.1 : q.pt.mat === 'plate' ? bw * 1.4 : bw * 1.2;
      if (R.ed < bwq && R.i2 >= 0) { const w = 0.5 * (1 - sm(R.ed / bwq)); nx += (P.NX[R.i2] - nx) * w; ny += (P.NY[R.i2] - ny) * w; nz += (P.NZ[R.i2] - nz) * w; }
      // the bump: a noise slope in the fist's frame, carried into the world
      { const f = 6.5, e0 = vn3(qx * f, qy * f, qz * f), ex = 0.12, gx = (vn3(qx * f + ex, qy * f, qz * f) - e0) / ex, gy = (vn3(qx * f, qy * f + ex, qz * f) - e0) / ex, gz = (vn3(qx * f, qy * f, qz * f + ex) - e0) / ex, k = 0.09;
        nx -= (Mw[0] * gx + Mw[1] * gy + Mw[2] * gz) * k; ny -= (Mw[3] * gx + Mw[4] * gy + Mw[5] * gz) * k; nz -= (Mw[6] * gx + Mw[7] * gy + Mw[8] * gz) * k; }
      { const k = Math.hypot(nx, ny, nz); nx /= k; ny /= k; nz /= k; }
      const ndl = Math.max(0, nx * LIT[0] + ny * LIT[1] + nz * LIT[2]), ndv = Math.max(0, nx * VIEW[0] + ny * VIEW[1] + nz * VIEW[2]), ndh = Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]);
      const t1 = vn3(qx * 2.6 + sdd, qy * 2.6, qz * 2.6), t2 = vn3(qx * 9 + 3, qy * 9 + sdd, qz * 9), t3 = vn3(qx * 24, qy * 24, qz * 24 + sdd);
      // the veins: a cellular network in the stone, in patches; recessed, amber
      let V = 0, VW = 0;
      { const pv = q.pt.vk, dens = pv > 0 ? sstep(0.5 - 0.08 * (vk - 1), 0.64 - 0.08 * (vk - 1), vn3(qx * 1.2 + 20, qy * 1.2, qz * 1.2 + sdd * 0.2)) * pv : 0;
        if (dens > 0) { const wv = (0.03 + 0.03 * t1) * dens, wq = vn3(qx * 2.2 + 3, qy * 2.2, qz * 2.2 + 1) - 0.5, fv = vor3(qx * 1.7 + wq * 0.9, qy * 1.7 - wq * 0.7, qz * 1.7 + 5);
          V = (1 - sstep(wv * 0.3, wv, fv)) * dens; VW = (1 - sstep(wv, wv * 2.6 + 0.02, fv)) * dens; } }
      // (some fractures dark, some lit from inside)
      const lit = sstep(0.4, 0.6, vn3(qx * 1.6 + 40, qy * 1.6, qz * 1.6));
      const edge = R.i2 >= 0 ? 1 - sstep(0.35, 1.7, R.ed) : 0;
      const alb = 0.82 + 0.34 * (t1 - 0.5) + 0.26 * (t2 - 0.5) + 0.2 * (t3 - 0.5) - (t3 > 0.8 ? 0.25 : 0);
      const b = cl(((0.58 * bands(ndl) + 0.42 * ndl) * alb * (1 - 0.55 * VW) + 0.06) * 1.02), bb = b * 4, ri = Math.min(3, Math.floor(bb)), rf = bb - ri, PL = PAL[q.pt.mat] || PAL.stone, RA = PL[ri], RB = PL[ri + 1];
      let cr = RA[0] + (RB[0] - RA[0]) * rf, cg = RA[1] + (RB[1] - RA[1]) * rf, cb = RA[2] + (RB[2] - RA[2]) * rf;
      // pale worn edges where the light catches them; a matte sheen; warm amber light from below; a cool rim above
      const wk = edge * cl(ndl * 1.8) * (0.55 + 0.35 * t1) * (q.pt.mat === 'stone' ? 0.6 : 0.8); cr = lerp(cr, 176, wk); cg = lerp(cg, 168, wk); cb = lerp(cb, 152, wk);
      const fr = Math.pow(1 - ndv, 2.4), under = cl(-nz * 1.1 + 0.2), sky = cl(nz * 1.2 - 0.3), spec = Math.pow(ndh, 24) * 0.16 * (0.4 + t2);
      cr += 160 * fr * under * 0.5 + 34 * fr * sky * 0.35 + 220 * spec; cg += 90 * fr * under * 0.5 + 38 * fr * sky * 0.35 + 205 * spec; cb += 20 * fr * under * 0.5 + 48 * fr * sky * 0.35 + 180 * spec;
      if (V > 0.01) { cr = lerp(cr, lerp(14, 176, lit), V); cg = lerp(cg, lerp(11, 86, lit), V); cb = lerp(cb, lerp(9, 14, lit), V); }
      out[0] = cr; out[1] = cg; out[2] = cb; out[3] = V * 0.95 * lit * (0.75 + 0.25 * t1); }
    const NP = PP.length;
    const row = (py, xa, xb) => {
      for (let px = xa; px < xb; px++) {
        const sx = (px + 0.5 - cx) / Spx, sy = (py + 0.5 - cy) / Spx; let f = null, s2 = null;
        for (let qi = 0; qi < NP; qi++) { const q = PP[qi], b = q.b; if (sx < b[0] - 0.02 || sx > b[2] + 0.02 || sy < b[1] - 0.02 || sy > b[3] + 0.02) continue; if (!cast(q.P, sx, sy, Spx) || O.sil < -0.7) continue; const R = q.R; R.i1 = O.i1; R.i2 = O.i2; R.jl = O.jl; R.y = O.y; R.th = O.th; R.sil = O.sil; R.ed = O.ed;
          if (!f || R.y > f.R.y) { s2 = f; f = q; } else if (!s2 || R.y > s2.R.y) s2 = q; }
        if (!f) continue;
        const i = py * W + px, o = i * 4, a0 = cl(f.R.sil + 0.5); shade(f, sx, sy, C0);
        let r = C0[0], gg = C0[1], b = C0[2], em = C0[3], al = a0;
        // a crevice: the rim of a stone with another just behind it (the deeper, the darker), amber light inside;
        // brightest between the knuckles and fingers
        const near = s2 ? cl(1 - (f.R.y - s2.R.y) / 0.45) : 0;
        if (s2 && near > 0) {
          const ck = (1 - sstep(0.2, 2.2, f.R.sil)) * near, fg = f.pt.grp, sg = s2.pt.grp, pair = fg !== sg && fin(fg) && fin(sg) ? 1 : fg !== sg && (fin(fg) || fin(sg)) && (fg === 15 || sg === 15 || fg === 2 || sg === 2) ? 0.6 : 0, hot = (1 - sstep(0.2, 2.6 + Spx * 0.02, f.R.sil)) * near * pair;
          if (a0 < 0.999) { shade(s2, sx, sy, C1); const occ = 0.42; r = lerp(C1[0] * occ, r, a0); gg = lerp(C1[1] * occ, gg, a0); b = lerp(C1[2] * occ, b, a0); em = lerp(C1[3], em, a0); al = a0 + cl(s2.R.sil + 0.5) * (1 - a0); }
          const dk = 1 - 0.72 * ck; r *= dk; gg *= dk; b *= dk;
          r = lerp(r, 214, hot * 0.75); gg = lerp(gg, 122, hot * 0.75); b = lerp(b, 24, hot * 0.75); em = Math.max(em, hot * 1.0);
        } else {
          if (a0 < 0.999 && s2) { shade(s2, sx, sy, C1); r = lerp(C1[0], r, a0); gg = lerp(C1[1], gg, a0); b = lerp(C1[2], b, a0); em = lerp(C1[3], em, a0); al = a0 + cl(s2.R.sil + 0.5) * (1 - a0); }
          // the outer silhouette: ink, so it reads on any floor
          if (!s2) { const ink = 0.28 + 0.72 * sstep(0, 2.2, f.R.sil); r *= ink; gg *= ink; b *= ink; em = Math.max(em, (1 - sstep(0.5, 3.2, f.R.sil)) * 0.32); }   // (a faint warm rim: readable on a dark floor)
        }
        dd[o] = r; dd[o + 1] = gg; dd[o + 2] = b; dd[o + 3] = al * 255; Em[i] = em * al; G[i] = f.pt.grp; } };
    // (a strip of ~24 pixels a step: no step takes long, however big the picture)
    const SW = 24; for (let py = 0; py < Hh; py++) for (let xa = 0; xa < W; xa += SW) { yield 0; row(py, xa, Math.min(W, xa + SW)); }
    yield 0; g.putImageData(im, 0, 0); yield 0;
    const B = Em.slice(), br = Math.max(2, Math.round(Spx * 0.075)); blur(B, W, Hh, br); yield 0;
    // (the emissive layer a band of rows a step, then laid down)
    const glow = mk(W, Hh), gq = glow.getContext('2d'), gim = gq.createImageData(W, Hh), gd = gim.data;
    for (let y0 = 0; y0 < Hh; y0 += 16) { glowRows(Em, B, gd, W, Math.min(Hh, y0 + 16), y0, 0.95); yield 0; }
    gq.putImageData(gim, 0, 0); yield 0;
    Object.assign(res, { body: cv, glow, W, H: Hh, cx, cy, S: Spx, G, ready: true });
  }
  // a baked picture cut into its stones (by group), for the end
  function chunksOf(res) {
    if (res.chunks) return res.chunks; const { W, H: Hh, G } = res, src = res.body.getContext('2d').getImageData(0, 0, W, Hh).data, out = [], by = new Map();
    for (let i = 0; i < W * Hh; i++) { if (src[i * 4 + 3] < 10) continue; const g = G[i]; let b = by.get(g); if (!b) by.set(g, b = { x0: W, y0: Hh, x1: -1, y1: -1, sx: 0, sy: 0, n: 0 }); const x = i % W, y = (i - x) / W; if (x < b.x0) b.x0 = x; if (x > b.x1) b.x1 = x; if (y < b.y0) b.y0 = y; if (y > b.y1) b.y1 = y; b.sx += x; b.sy += y; b.n++; }
    for (const [g, b] of by) { if (b.n < 6) continue; const w = b.x1 - b.x0 + 1, h = b.y1 - b.y0 + 1, cv = mk(w, h), q = cv.getContext('2d'), im = q.createImageData(w, h), d = im.data;
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) { const i = y * W + x; if (G[i] !== g) continue; const o = ((y - b.y0) * w + (x - b.x0)) * 4, s = i * 4; d[o] = src[s]; d[o + 1] = src[s + 1]; d[o + 2] = src[s + 2]; d[o + 3] = src[s + 3]; }
      q.putImageData(im, 0, 0); out.push({ g, cv, x0: b.x0, y0: b.y0, w, h, mx: b.sx / b.n, my: b.sy / b.n }); }
    return (res.chunks = out);
  }

  /* ================= the picture cache ================= */
  const UNIT = 0.7;   // tiles per fist unit (a fist with its cuff is ~2 units long: about the pet's whole body)
  const FC = { frames: new Map(), queue: [], qset: new Set(), job: null, spx: 0, tier: 0, bytes: 0, built: 0, bakeMs: 0, maxSlice: 0, need: 0, miss: 0 };
  const fkey = (tier, kind, k, j) => tier + '|' + kind + '|' + k + '|' + j;
  function want(key, front) { if (FC.frames.has(key) || (FC.job && FC.job.key === key)) return; if (FC.qset.has(key)) { if (front) { const i = FC.queue.indexOf(key); if (i > 0) { FC.queue.splice(i, 1); FC.queue.unshift(key); } } return; } FC.qset.add(key); if (front) FC.queue.unshift(key); else FC.queue.push(key); }
  function setScale(T, SZ, res) {
    const spx = T * UNIT * SZ * res; if (FC.spx && Math.abs(spx / FC.spx - 1) < 0.2) return;
    FC.frames.clear(); FC.queue.length = 0; FC.qset.clear(); FC.job = null; FC.bytes = 0; FC.spx = spx;
  }
  function bakeStep(ms) {
    const t0 = performance.now(), until = t0 + ms;
    while (performance.now() < until) {
      if (!FC.job) {
        let key = null; while (FC.queue.length && !key) { const k = FC.queue.shift(); FC.qset.delete(k); if (!FC.frames.has(k)) key = k; } if (!key) break;
        const [tier, kind, k, j] = key.split('|'), res = {}, M = orient(+k * DPSI, +j * DPHI);
        FC.job = { key, res, it: fistGen(model(+tier, kind), M, FC.spx * (kind === 'big' ? 1.3 : 1), res) };
        if (performance.now() > t0 + ms * 0.5) break;   // (a new model's stones are a slice of their own)
      }
      const jb = FC.job; let done = false; while (performance.now() < until) { if (jb.it.next().done) { done = true; break; } }
      if (!done) break;
      FC.frames.set(jb.key, jb.res); FC.bytes += jb.res.W * jb.res.H * 9; FC.built++; FC.job = null;
    }
    const dt = performance.now() - t0; FC.bakeMs += dt; if (dt > FC.maxSlice) FC.maxSlice = dt;
  }
  let IDLE = false;
  function idleBake() {
    if (IDLE || !(FC.queue.length || FC.job)) return; IDLE = true;
    const go = () => { IDLE = false; idleBake(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => { bakeStep(dl.didTimeout ? 1 : Math.max(0.5, Math.min(5, dl.timeRemaining() - 1))); go(); }, { timeout: 150 });
    else setTimeout(() => { bakeStep(1.5); go(); }, 40);
  }
  const kOf = psi => ((Math.round(psi / DPSI) % NPSI) + NPSI) % NPSI;
  // the bake order: the formation and the guards of this aim first, then the rest nearest the aim first
  function plan(tier, A) {
    const kR = kOf(A), kL = kOf(Math.PI - A), dk = k => Math.min(...[kR, kL].map(q => { const d = Math.abs(k - q) % NPSI; return Math.min(d, NPSI - d); }));
    for (const s of [-1, 1]) { const g = s > 0 ? kOf(A - 0.42 + 0.8) : kOf(Math.PI - (A + 0.42 - 0.8)); for (const kind of ['s1', 's2', 'full']) want(fkey(tier, kind, g, 1), false); }
    for (const s of [-1, 1]) { const g = s > 0 ? kOf(A - 0.42) : kOf(Math.PI - (A + 0.42)); want(fkey(tier, 'full', g, 1), false); want(fkey(tier, 'full', g, 0), false); }
    // (then the first strike, a left uppercut: knuckles up, about the aim)
    for (const k of [kOf(Math.PI - A), kOf(Math.PI - A) + 1, kOf(Math.PI - A) + NPSI - 1]) for (const j of [0, 1]) want(fkey(tier, 'full', k % NPSI, j), false);
    const all = []; for (let k = 0; k < NPSI; k++) for (let j = 0; j < NPHI; j++) all.push([dk(k) + j * 0.35, k, j]);
    all.sort((a, b) => a[0] - b[0]); for (const [, k, j] of all) want(fkey(tier, 'full', k, j), false);
    if (tier >= 3) { const ks = []; for (let k = 0; k < NPSI; k++) ks.push(k); ks.sort((a, b) => dk(a) - dk(b)); for (const k of ks) want(fkey(tier, 'big', k, 2), false); }
    for (let k = 0; k < NPSI; k++) for (const kind of ['s1', 's2', 'full']) want(fkey(tier, kind, k, 1), false);
  }
  // the picture for (kind, k, j), or the nearest one baked
  function frame(tier, kind, k, j) {
    const key = fkey(tier, kind, k, j), fr = FC.frames.get(key); if (fr) return fr;
    want(key, true); FC.miss++;
    for (let r = 1; r <= 8; r++) for (const [dk, dj] of [[r, 0], [-r, 0], [0, r], [0, -r], [r, r], [-r, -r], [r, -r], [-r, r]]) { const j2 = j + dj; if (j2 < 0 || j2 >= NPHI) continue; const f = FC.frames.get(fkey(tier, kind, ((k + dk) % NPSI + NPSI) % NPSI, j2)); if (f) return f; }
    if (kind !== 'full') return frame(tier, 'full', k, j);
    return null;
  }
  // a fist drawn with its origin at (X, Y): upx screen px per fist unit, side -1 left (a mirrored right fist), a alpha,
  // gk its veins' light; kind / rf as above (rf: the reinforced fist over it). Returns the picture used
  function drawFist(c, tier, side, X, Y, psi, phi, upx, a, gk, kind, rf) {
    const ps = side < 0 ? Math.PI - psi : psi, kf = ((ps / DPSI) % NPSI + NPSI) % NPSI, k0 = Math.floor(kf), fk = kf - k0, k1 = (k0 + 1) % NPSI;
    const jf = cl(phi / DPHI / (NPHI - 1)) * (NPHI - 1), j0 = Math.min(NPHI - 2, Math.floor(jf)), fj = jf - j0;
    const kA = fk < 0.5 ? k0 : k1, kB = fk < 0.5 ? k1 : k0, ak = Math.min(fk, 1 - fk), jA0 = fj < 0.5 ? j0 : j0 + 1, jB = fj < 0.5 ? j0 + 1 : j0, aj0 = Math.min(fj, 1 - fj);
    const lay = (fr, al) => { if (!fr || al < 0.01) return; const s = upx / fr.S; c.globalAlpha = Math.min(1, al); c.drawImage(fr.body, X - fr.cx * s, Y - fr.cy * s, fr.W * s, fr.H * s); };
    const set = (kd, al) => { const big = kd === 'big', jA = big ? 2 : jA0, aj = big ? 0 : aj0, A0 = frame(tier, kd, kA, jA); if (!A0) return null; c.save(); if (side < 0) { c.translate(X, 0); c.scale(-1, 1); c.translate(-X, 0); } lay(A0, al); if (ak > 0.06) lay(frame(tier, kd, kB, jA), al * ak); if (aj > 0.06) lay(frame(tier, kd, kA, jB), al * aj);
      if (gk > 0.01) { const s = upx / A0.S; c.globalCompositeOperation = 'lighter'; let g = gk * al; while (g > 0.004) { c.globalAlpha = Math.min(1, g); c.drawImage(A0.glow, X - A0.cx * s, Y - A0.cy * s, A0.W * s, A0.H * s); g -= 1; } }
      c.restore(); return A0; };
    const fr = set(kind || 'full', a); if (rf > 0.01 && tier >= 3) set('big', a * rf);
    return fr;
  }

  /* ================= effect sprites ================= */
  const chipSet = () => E.chips(28);
  // a soft streak (pressure lines): light along x, feathered all round
  const streakSpr = () => fxSprite('rkystreak', 96, 16, g => { const im = g.createImageData(96, 16), d = im.data; for (let y = 0; y < 16; y++) for (let x = 0; x < 96; x++) { const v = (y + 0.5 - 8) / 8, u = (x + 0.5) / 96, a = Math.exp(-v * v * 5) * Math.min(1, u / 0.6) * Math.min(1, (1 - u) / 0.1), o = (y * 96 + x) * 4; d[o] = 255; d[o + 1] = 226; d[o + 2] = 160; d[o + 3] = 255 * cl(a); } g.putImageData(im, 0, 0); });
  // a floor glow (squashed, light only) and an air glow
  function glowF(c, X, Y, r, col, a, gy) { if (r < 1 || !(a > 0.004)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (gy || 1); c.drawImage(glowSprite(col), X - r, Y - ry, r * 2, ry * 2); c.restore(); }

  /* ================= the move ================= */
  const SPEC = { 2: [['up', -1, 6.5], ['up', 1, 7.5]], 4: [['up', -1, 3.3], ['up', 1, 3.5], ['down', -1, 3.4], ['down', 1, 4.6]], 7: [['up', -1, 2.3], ['up', 1, 2.6], ['hook', -1, 2.3], ['hook', 1, 2.3], ['body', -1, 2.6], ['over', 1, 2.9], ['final', 1, 5.6]] };
  const DUR = { up: 0.74, down: 0.68, hook: 0.62, body: 0.64, over: 0.76, final: 1.6 };
  const CT = { up: 0.52, down: 0.52, hook: 0.52, body: 0.52, over: 0.58, final: 1.0 / 1.6 };
  const FORM = 1.05, ENDD = 1.3, LEAD = 0.07;
  U.rocky = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const SZ = 1 + 0.06 * (ev - 1), NS = ev >= 7 ? 7 : ev >= 4 ? 4 : 2, SPD = ev >= 7 ? 0.84 : ev >= 4 ? 0.92 : 1;
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, RES = Math.min(2, Math.max(1, dpr));
    setScale(H.X.Tz(), SZ, RES);
    let A = Math.atan2(C.ty - me.y, C.tx - me.x); if (!isFinite(A)) A = 0;
    plan(tier, A);
    H.X.banner('ROCKY', '', C.col, 1.4); H.X.sfx.rumble ? H.X.sfx.rumble() : H.X.sfx.hum(); H.X.shake(2, 0.3);
    // the schedule
    const strikes = []; { let t = FORM; SPEC[NS].forEach(([type, side, dk], i) => { const d = DUR[type] * (type === 'final' ? 1 : SPD); strikes.push({ i, type, side, dk, s: t, d, ct: CT[type], hit: new Set(), n: 0, on: false, fired: false }); t += d + (NS === 4 && i === 1 ? 0.2 : 0); }); }
    let END0 = strikes[strikes.length - 1].s + strikes[strikes.length - 1].d, endAt = END0;
    const LIFE = END0 + ENDD + 0.9;
    const anc = { x: me.x, y: me.y };
    const living = () => H.living();
    const fwd = () => [Math.cos(A), Math.sin(A)], sideV = () => [-Math.sin(A), Math.cos(A)];
    const D0 = 1.75 * SZ;
    // rest poses in the aim's frame (u forward, v to the right, z up; yr heading, ph pitch)
    const guard = s => ({ u: 0.45 * SZ, v: 0.95 * s * SZ, z: 0.78, yr: -0.42 * s, ph: 0.55, sc: 1, rf: 0 });
    const elev = s => ({ u: 0.95 * SZ, v: 0.85 * s * SZ, z: 1.75, yr: -0.2 * s, ph: 0.45, sc: 1, rf: 0 });
    const loose = s => ({ u: 0.25 * SZ, v: 1.08 * s * SZ, z: 0.55, yr: -0.45 * s, ph: 1.35, sc: 1, rf: 0 });
    const P = (o, base) => Object.assign({ sc: 1, rf: 0 }, base || {}, o);
    const pol = p => Object.assign({}, p, { th: Math.atan2(p.v, p.u), rr: Math.hypot(p.u, p.v) });
    const EASE = { io: sm, in: u => u * u * u, out: u => 1 - Math.pow(1 - u, 3), lin: u => u };
    function kfEval(KF, u) {
      if (u <= KF[0][0]) return KF[0][1];
      for (let i = 0; i < KF.length - 1; i++) if (u < KF[i + 1][0]) { const a = KF[i][1], b = KF[i + 1][1], e = (EASE[KF[i + 1][2]] || sm)((u - KF[i][0]) / (KF[i + 1][0] - KF[i][0])), o = {};
        for (const k in b) if (typeof b[k] === 'number' && typeof a[k] === 'number') o[k] = a[k] + (b[k] - a[k]) * e; else o[k] = b[k];
        if (a.th != null && b.th != null) { o.u = o.rr * Math.cos(o.th); o.v = o.rr * Math.sin(o.th); }
        return o; }
      return KF[KF.length - 1][1];
    }
    // the rest each fist is in before / after each strike
    const restBefore = [], restAfter = [];
    strikes.forEach((S, i) => { const prev = i ? restAfter[i - 1] : { '-1': 'G', '1': 'G' }, aft = Object.assign({}, prev);
      if (NS === 4 && S.type === 'up') aft[S.side] = 'E'; else if (S.type === 'final') aft[S.side] = 'X'; else aft[S.side] = 'G';
      restBefore.push(prev); restAfter.push(aft); });
    const restPose = (code, s, S) => code === 'E' ? elev(s) : code === 'X' ? P({ u: S.D * 0.75, v: 0.5 * s, z: 0.72, yr: 0, ph: Math.PI / 2 }) : guard(s);
    // pick the strike's target: the nearest monster in reach (its bearing and distance), else straight on
    function aimStrike(S) {
      let best = null, bd = 1e9; for (const m of living()) { const d = Math.hypot(m.x - me.x, m.y - me.y); if (d > 5.5) continue; const da = Math.abs(wrapA(Math.atan2(m.y - me.y, m.x - me.x) - A)), sc = d + da * 0.8; if (sc < bd) { bd = sc; best = m; } }
      // (the middle of the group round it, so one blow takes in as many as it can)
      let gx = 0, gy = 0, gn = 0; if (best) for (const m of living()) { const d = Math.hypot(m.x - best.x, m.y - best.y); if (d < 1.3) { const w = 1 - d / 1.6; gx += m.x * w; gy += m.y * w; gn += w; } }
      if (gn > 0) { gx /= gn; gy /= gn; }
      S.aimT = best ? Math.atan2(gy - me.y, gx - me.x) : A; S.D = best ? Math.max(1.25 * SZ, Math.min(2.3 * SZ, Math.hypot(gx - me.x, gy - me.y))) : D0;
    }
    // the keyframes of a strike for the striking fist (KF), the other (KP) and the pet (PK)
    function build(S) {
      const s = S.side, D = S.D, st = restPose(restBefore[S.i][s], s, S), en = restPose(restAfter[S.i][s], s, S), o = -s, ost = restPose(restBefore[S.i][o], o, S), oen = restPose(restAfter[S.i][o], o, S);
      S.KP = [[0, ost], [S.ct, P({ u: ost.u - 0.12, z: ost.z + 0.04 }, ost), 'out'], [1, oen, 'io']];
      const pk = (arm, arm2, lean, sq, z, dx) => ({ arm, arm2, lean, sq, z, dx });
      const ST0 = pk(32, 32, 0, 0.15, 0, 0);
      if (S.type === 'up') {
        S.KF = [[0, st], [0.3, P({ u: 0.5 * SZ, v: 0.78 * s * SZ, z: 0.12, yr: -0.15 * s, ph: 0.42 }), 'io'], [0.4, P({ u: 0.42 * SZ, v: 0.74 * s * SZ, z: 0.07, yr: -0.1 * s, ph: 0.3 }), 'io'],
          [0.52, P({ u: D - 0.1, v: 0.3 * s, z: 0.62, yr: -0.05 * s, ph: 0.1 }), 'in'], [0.64, P({ u: D + 0.1, v: 0.26 * s, z: 1.75, yr: 0, ph: 0 }), 'out'], [1, en, 'io']];
        S.PK = [[0, ST0], [0.3, pk(-25, 38, -0.2, 0.4, 0, -0.05)], [0.4, pk(-32, 40, -0.24, 0.44, 0, -0.06)], [0.5, pk(140, 30, 0.3, -0.25, 0.26, 0.2), 'in'], [0.62, pk(150, 28, 0.22, -0.15, 0.3, 0.2), 'out'], [0.8, pk(80, 32, 0.08, 0.05, 0.06, 0.08)], [1, ST0]];
        S.R = 1.15 * K * (0.9 + 0.1 * SZ); S.at = 0;
      } else if (S.type === 'down') {
        S.KF = [[0, st], [0.32, P({ u: D * 0.7, v: 0.5 * s * SZ, z: 2.55, yr: -0.1 * s, ph: 2.2 }), 'io'], [0.42, P({ u: D * 0.66, v: 0.5 * s * SZ, z: 2.78, yr: -0.1 * s, ph: 2.75 }), 'io'],
          [0.52, P({ u: D, v: 0.25 * s, z: 0.2, yr: 0, ph: 3.08 }), 'in'], [0.62, P({ u: D + 0.03, v: 0.25 * s, z: 0.12, yr: 0, ph: 3.12 }), 'out'], [1, en, 'io']];
        S.PK = [[0, ST0], [0.32, pk(150, 40, -0.18, -0.15, 0.12, -0.05)], [0.42, pk(162, 40, -0.24, -0.18, 0.16, -0.06)], [0.52, pk(-5, 34, 0.36, 0.42, 0, 0.22), 'in'], [0.66, pk(-12, 32, 0.28, 0.3, 0, 0.18), 'out'], [1, ST0]];
        S.R = (S.i === 3 ? 1.6 : 1.25) * K * (0.9 + 0.1 * SZ); S.at = 0;
      } else if (S.type === 'hook') {
        const rr = D * 0.92, ps = pol(st), pe = pol(en), PH = (th, z, ph, rq) => ({ th, rr: rq || rr, z, ph, yr: th - s * 1.25, sc: 1, rf: 0 });
        // (the guard is at a bearing of about 64 degrees to its side: the sweep starts behind it and ends across)
        S.KF = [[0, ps], [0.34, PH(2.05 * s, 0.8, Math.PI / 2, rr * 0.85), 'io'], [0.42, PH(2.2 * s, 0.82, Math.PI / 2, rr * 0.85), 'io'], [0.62, PH(-0.85 * s, 0.75, Math.PI / 2), 'in'], [0.7, PH(-1.05 * s, 0.74, Math.PI / 2, rr * 0.95), 'out'], [1, pe, 'io']];
        S.PK = [[0, ST0], [0.34, pk(20, 40, 0.3, 0.25, 0, -0.04)], [0.42, pk(8, 42, 0.34, 0.28, 0, -0.05)], [0.56, pk(98, 30, -0.32, 0.12, 0, 0.14), 'in'], [0.7, pk(104, 28, -0.36, 0.1, 0, 0.14), 'out'], [1, ST0]];
        S.th0 = 2.2 * s; S.rr = rr;
      } else if (S.type === 'body') {
        S.KF = [[0, st], [0.32, P({ u: 0.05, v: 0.75 * s * SZ, z: 0.38, yr: -0.2 * s, ph: Math.PI / 2 }), 'io'], [0.4, P({ u: -0.1, v: 0.7 * s * SZ, z: 0.36, yr: -0.15 * s, ph: Math.PI / 2 }), 'io'],
          [0.52, P({ u: D + 0.35, v: 0.1 * s, z: 0.4, yr: 0, ph: Math.PI / 2 }), 'in'], [0.62, P({ u: D + 0.6, v: 0.08 * s, z: 0.42, yr: 0, ph: Math.PI / 2 }), 'out'], [1, en, 'io']];
        S.PK = [[0, ST0], [0.3, pk(12, 40, -0.1, 0.48, 0, -0.06)], [0.4, pk(5, 42, -0.12, 0.52, 0, -0.08)], [0.52, pk(78, 34, 0.32, 0.45, 0, 0.3), 'in'], [0.66, pk(80, 32, 0.28, 0.38, 0, 0.28), 'out'], [1, ST0]];
        S.hw = 0.85 * K;
      } else if (S.type === 'over') {
        S.KF = [[0, st], [0.3, P({ u: 0.4 * SZ, v: 0.65 * s * SZ, z: 2.6, yr: -0.2 * s, ph: 1.0 }), 'io'], [0.42, P({ u: 0.55 * SZ, v: 0.55 * s * SZ, z: 3.0, yr: -0.1 * s, ph: 2.6 }), 'io'], [0.48, P({ u: 0.75 * SZ, v: 0.45 * s * SZ, z: 3.05, yr: 0, ph: 2.95 }), 'io'],
          [0.58, P({ u: D, v: 0.15 * s, z: 0.18, yr: 0, ph: 3.12 }), 'in'], [0.68, P({ u: D + 0.03, v: 0.15 * s, z: 0.1, yr: 0, ph: 3.13 }), 'out'], [1, en, 'io']];
        S.PK = [[0, ST0], [0.3, pk(130, 36, -0.16, -0.15, 0.12, -0.05)], [0.48, pk(166, 38, -0.24, -0.22, 0.22, -0.06)], [0.58, pk(8, 34, 0.38, 0.45, 0, 0.24), 'in'], [0.7, pk(0, 32, 0.3, 0.32, 0, 0.2), 'out'], [1, ST0]];
        S.R = 1.35 * K * (0.9 + 0.1 * SZ); S.at = 0;
      } else {   // the final straight
        const c = S.ct;
        S.KF = [[0, st], [0.16, P({ u: -0.38, v: 0.72 * s * SZ, z: 0.86, yr: -0.1 * s, ph: Math.PI / 2 }), 'out'], [0.56, P({ u: -0.46, v: 0.7 * s * SZ, z: 0.9, yr: -0.08 * s, ph: Math.PI / 2, sc: 1.3, rf: 1 }), 'lin'],
          [c, P({ u: D + 1.0, v: 0.12 * s, z: 0.66, yr: 0, ph: Math.PI / 2, sc: 1.3, rf: 1 }), 'in'], [0.76, P({ u: D + 1.15, v: 0.1 * s, z: 0.64, yr: 0, ph: Math.PI / 2, sc: 1.3, rf: 1 }), 'out'], [1, P({ u: D * 0.78, v: 0.45 * s, z: 0.72, yr: 0, ph: Math.PI / 2, sc: 1.3, rf: 1 }), 'io']];
        S.KP = [[0, ost], [0.16, P({ u: -0.02, v: 1.05 * o * SZ, z: 0.86, yr: 0.35 * o * -1, ph: 1.2 }), 'out'], [c, P({ u: -0.12, v: 1.1 * o * SZ, z: 0.8, yr: 0.3 * -o, ph: 1.25 }), 'io'], [1, P({ u: 0.1, v: 1.1 * o * SZ, z: 0.78, yr: 0.3 * -o, ph: 1.25 }), 'io']];
        S.PK = [[0, ST0], [0.16, pk(42, 42, -0.22, 0.3, 0, -0.1)], [0.56, pk(18, 46, -0.32, 0.48, 0, -0.16), 'lin'], [c, pk(96, 30, 0.42, -0.12, 0.06, 0.45), 'in'], [0.76, pk(100, 28, 0.36, 0.0, 0.03, 0.46), 'out'], [1, pk(60, 32, 0.1, 0.12, 0, 0.2)]];
        S.RF = (D + 2.6) * K; S.spread = 0.62;
      }
    }
    // the fists' state this frame (aim frame), and in the world
    const FS = { '-1': null, '1': null };
    function poseAt(s, t) {
      if (t < FORM) { const g = guard(s), e = sstep(0.82, 1.05, t), lift = 1 - Math.pow(1 - sstep(0.05, 0.75, t), 2); return Object.assign({}, g, { z: g.z * (0.35 + 0.65 * lift), yr: g.yr + 0.8 * s * (1 - e), ph: lerp(DPHI, g.ph, e), form: t }); }
      if (t >= endAt) { const base = lastPose[s] || guard(s), u = sstep(0, 0.27, t - endAt), L = loose(s), o = {}; for (const k in L) o[k] = lerp(base[k] == null ? L[k] : base[k], L[k], u); o.sc = lerp(base.sc || 1, 1, sstep(0.1, 0.4, t - endAt)); o.rf = (base.rf || 0) * (1 - sstep(0.1, 0.4, t - endAt)); return o; }
      const S = strikes[curIdx(t)]; if (!S.on) return lastPose[s] || guard(s);
      const u = cl((t - S.s) / S.d); return kfEval(S.side === s ? S.KF : S.KP, u);
    }
    const curIdx = t => { let i = 0; while (i < strikes.length - 1 && t >= strikes[i + 1].s) i++; return i; };
    const lastPose = { '-1': null, '1': null };
    const world = p => { const f = fwd(), sv = sideV(); return [anc.x + f[0] * p.u + sv[0] * p.v, anc.y + f[1] * p.u + sv[1] * p.v, p.z]; };
    // a point of the fist (fist units) as a world offset in tiles
    function fistPt(s, p, lp) { const psi = A + p.yr, M = orient(s < 0 ? Math.PI - psi : psi, p.ph), w = mvm(M, lp), k = UNIT * SZ * p.sc; return [(s < 0 ? -w[0] : w[0]) * k, w[1] * k * GY, w[2] * k]; }   // (its depth squashed as the picture's is)
    // screen point of a world point (x, y, height z)
    const scr = (x, y, z, T) => [H.sx(x), H.sy(y) - z * T];
    /* ---- the pet's gesture ---- */
    const pet = { arm: 0, arm2: 0, lean: 0, sq: 0, z: 0, dx: 0, side: 1, lx: 1 };
    const scrSide = s => { const sv = sideV(), f = fwd(), x = s * sv[0] + (Math.abs(sv[0]) < 0.35 ? -s * f[0] * 0.5 : 0); return x < 0 ? -1 : 1; };
    function petPose(t) {
      const ST0 = { arm: 32, arm2: 32, lean: 0, sq: 0.12, z: 0, dx: 0 };
      if (t < FORM) { const k = sstep(0.55, 1.0, t); return { arm: 32 * k + 40 * sstep(0.2, 0.6, t) * (1 - k), arm2: 32 * k + 40 * sstep(0.2, 0.6, t) * (1 - k), lean: 0, sq: 0.12 * k, z: 0, dx: 0, side: 1 }; }
      if (t >= endAt) { const k = 1 - sstep(0.05, 0.5, t - endAt); return { arm: 32 * k, arm2: 32 * k, lean: 0, sq: 0.12 * k, z: 0, dx: 0, side: pet.side }; }
      const S = strikes[curIdx(t)]; if (!S.on) return Object.assign({ side: 1 }, ST0);
      // (the lean goes into the punch: toward the aim's side of the screen, or the punching fist's when the aim is up or down; a hook sweeps across)
      const c = Math.cos(A), lx = S.type === 'hook' ? scrSide(S.side) : Math.abs(c) >= 0.35 ? Math.sign(c) * (0.6 + 0.4 * Math.abs(c)) : scrSide(S.side) * 0.7;
      return Object.assign({ side: scrSide(S.side), lx }, kfEval(S.PK, cl((t - S.s + LEAD) / S.d)));
    }
    function applyPet(dt, t) {
      const q = petPose(t), k = Math.min(1, dt * 30);
      if (q.lx == null) q.lx = pet.lx; for (const key of ['arm', 'arm2', 'lean', 'sq', 'z', 'dx', 'lx']) pet[key] += (q[key] - pet[key]) * k; pet.side = q.side;
      const L = pet.side < 0 ? pet.arm : pet.arm2, R = pet.side < 0 ? pet.arm2 : pet.arm, flip = me.face < 0;
      me.hopArmS = flip ? [R, L] : [L, R]; me.hopLean = pet.lean * pet.lx; me.hopSq = pet.sq; me.z = Math.max(0, pet.z); me.hopDX = Math.cos(A) * pet.dx; me.hopDY = Math.sin(A) * pet.dx;
    }
    function clearPet() { me.hopArmS = null; me.hopLean = 0; me.hopSq = 0; me.z = 0; me.hopDX = 0; me.hopDY = 0; }
    /* ---- effects ---- */
    const fx = { chipT: {}, trails: { '-1': [], '1': [] }, flashes: [], marks: [], debris: [], rocks: [], chunks: [], streaks: [], frags: { '-1': [], '1': [] } };
    const CH = chipSet();
    function debris(x, y, z, n, o) { o = o || {}; for (let j = 0; j < H.n(n); j++) { const b = (o.dir != null ? o.dir + (Math.random() - 0.5) * (o.spread || 1.2) : Math.random() * TAU), v = (o.v || 2.5) * (0.4 + Math.random() * 0.8);
      fx.debris.push({ x, y, z, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: (o.up || 3) * (0.5 + Math.random() * 0.8), r: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, s: (o.s || 0.14) * (0.6 + Math.random() * 0.8), k: j % CH.length, life: 0.7 + Math.random() * 0.4, t: 0, hot: Math.random() < 0.4 }); } }
    function dust(x, y, n, sp, sz) { for (let j = 0; j < H.n(n); j++) { const b = Math.random() * TAU, v = (sp || 1) * (0.4 + Math.random()); H.P({ kind: 'smoke', x: x + Math.cos(b) * 0.2, y: y + Math.sin(b) * 0.1, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5 - 0.2, life: 0.7 + Math.random() * 0.4, max: 1.1, size: (sz || 0.3) * (0.7 + Math.random() * 0.6), color: 'rgba(138,124,104,' }); } }
    function sparks(x, y, n, up) { for (let j = 0; j < H.n(n); j++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 3; H.P({ kind: 'spark', x, y, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - (up || 2), g: 6, life: 0.35 + Math.random() * 0.3, max: 0.65, size: 1.5 + Math.random() * 1.5, color: Math.random() < 0.5 ? GOLD : HONEY }); } }
    // formation: pebbles that rise and spiral in, the big ones first (locking the palm and knuckles), then the small
    for (const s of [-1, 1]) { const n = H.n(14 + 3 * tier); for (let j = 0; j < n; j++) { const bigR = j < n * 0.35, a0 = Math.random() * TAU, d0 = 0.5 + Math.random() * 0.9;
      fx.rocks.push({ s, a0, d0, t0: 0.02 + Math.random() * 0.2, t1: bigR ? 0.4 + Math.random() * 0.14 : 0.58 + Math.random() * 0.28, sp: (1.5 + Math.random()) * (Math.random() < 0.5 ? 1 : -1), s0: bigR ? 0.2 + Math.random() * 0.08 : 0.1 + Math.random() * 0.06, k: j % CH.length,
        lp: bigR ? [(Math.random() - 0.3) * 1.0, (Math.random() - 0.5) * 1.0, (Math.random() - 0.2) * 0.8] : [-0.9 + Math.random() * 1.8, (Math.random() - 0.5) * 1.1, (Math.random() - 0.5) * 0.8] }); } }
    // the cuff's hovering fragments
    for (const s of [-1, 1]) { const n = 3 + tier; for (let j = 0; j < n; j++) fx.frags[s].push({ a: j / n * TAU + Math.random() * 0.5, sp: 1.4 + Math.random() * 0.9, r: 0.62 + Math.random() * 0.22, ax: -0.95 - Math.random() * 0.25, k: (j + (s > 0 ? 3 : 0)) % CH.length, s: 0.09 + Math.random() * 0.05 + (tier >= 3 ? 0.02 : 0), lag: 7 + Math.random() * 7, p: null }); }
    const F = H.add({ key: 'rocky', life: LIFE, x: me.x, y: me.y, update, draw, drawUnder, get fxs() { return fx; }, strikes, hits: [], tier, NS, DK, onEnd() { clearPet(); for (const c of kids) c.life = 0; } });
    const kids = [-1, 1].map(s => H.add({ key: 'rockyFist', life: LIFE, side: s, entY: null, drawEnt: (c, f) => drawEnt(c, f, s) }));
    const lastFr = { '-1': null, '1': null }, pcFr = { '-1': null, '1': null }; let glowK = 0, dimA = { '-1': 1, '1': 1 }, ended = false, shattered = false, lastT = 0, finalCharge = 0;
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    function hit(S, m, extra) {
      if (S.hit.has(m) || !valid(m)) return false; S.hit.add(m); S.n++; F.hits.push([S.i, m]);
      const o = { stun: S.type === 'down' || S.type === 'over' ? 0.35 : S.type === 'final' ? 0.5 : 0.2 };
      H.X.hitMon(m, DK * S.dk, C.dmgO(o));
      if (S.type === 'up') H.lift(m, S.i >= 1 && NS === 7 ? 0.55 : 0.45, S.i >= 1 && NS === 7 ? 0.85 : 0.65);
      else if (S.type === 'hook' || S.type === 'body') H.push(m, anc.x, anc.y, 0.32);
      else if (S.type === 'final') H.push(m, anc.x, anc.y, 0.85);
      if (extra) extra(m); return true;
    }
    const tasks = [];
    function prepMarks(S) { const T = H.X.Tz(); if (S.type === 'down' || S.type === 'over') { const big = (NS === 4 && S.i === 3) || S.type === 'over', R = S.R * (big ? 1.25 : 1.05) * T; tasks.push(() => E.cracks(S.i * 3 + 1, R * (big ? 0.75 : 0.7), big ? 9 : 6, big ? 2 : 1)); }
      if (S.type === 'final') tasks.push(() => E.cracks(7, 2.0 * K * T * 0.75, 9, 2), () => streakSpr()); }
    function flash(x, y, z, r, life, big) { fx.flashes.push({ x, y, z, r, life, t: 0, big }); }
    /* the contact of a strike that lands at one moment (uppercut, downward, overhead) */
    function landAt(S, wp) {
      const R = S.R, cx = anc.x + fwd()[0] * S.D + sideV()[0] * S.at, cy = anc.y + fwd()[1] * S.D + sideV()[1] * S.at; let n = 0;
      for (const m of living()) if (Math.hypot(m.x - cx, m.y - cy) < R + m.r * 0.6) { if (hit(S, m)) n++; }
      const heavy = S.type !== 'up' || (NS === 7 && S.i === 1);
      if (S.type === 'up') { flash(wp[0], wp[1], wp[2], 0.75 + 0.1 * tier, 0.28); debris(wp[0], wp[1], Math.max(0.3, wp[2] - 0.2), 7 + 2 * tier, { up: 5, v: 1.6, s: 0.12 }); sparks(wp[0], wp[1] - wp[2], 6); H.X.sfx.thud(); H.X.shake(heavy ? 5 : 3.5, 0.15); }
      else { const big = (NS === 4 && S.i === 3) || S.type === 'over'; flash(wp[0], wp[1], 0.25, big ? 1.25 : 0.95, 0.32, big); fx.marks.push({ x: cx, y: cy, R: R * (big ? 1.25 : 1.05), t: 0, life: big ? 1.4 : 1.1, seed: S.i * 3 + 1, ring: true, big });
        debris(wp[0], wp[1], 0.2, (big ? 14 : 9) + 2 * tier, { up: 3.2, v: big ? 3.6 : 2.8, s: big ? 0.17 : 0.14 }); dust(cx, cy, big ? 10 : 6, big ? 2.4 : 1.8, 0.4); sparks(cx, cy - 0.3, big ? 10 : 6, 2.5);
        H.X.sfx.crash(); H.X.shake(big ? 9 : 6, big ? 0.3 : 0.22); H.X.light && H.X.light(cx, cy, R * 1.2, 0.22); }
      if (n && H.X.hitstop) H.X.hitstop(heavy ? 0.05 : 0.035);
    }
    /* ---- the update ---- */
    function update(dt, f) {
      const t = f.t; lastT = t;
      if (me.dead && endAt > t) endAt = t;   // (the pet falls: the fists let go at once)
      anc.x += (me.x - anc.x) * Math.min(1, dt * 14); anc.y += (me.y - anc.y) * Math.min(1, dt * 14); f.x = anc.x; f.y = anc.y;
      // strikes: switch on (aim at the nearest monster), turn toward it in the windup, land
      for (const S of strikes) { if (t >= S.s && !S.on && S.s < endAt) { S.on = true; aimStrike(S); build(S); prepMarks(S); if (S.type !== 'final') H.X.sfx.whoosh(); else H.X.sfx.hum(); } }
      const S = strikes[curIdx(t)];
      if (S.on && t < endAt) {
        const u = (t - S.s) / S.d; if (u < 0.45) { const da = wrapA(S.aimT - A); A += Math.sign(da) * Math.min(Math.abs(da), dt * 7); }
        if (S.type === 'final' && u > 0.16 && u < S.ct) { finalCharge = sstep(0.16, 0.56, u); if (Math.random() < dt * 30 * H.Q()) { const wp = world(FS['1'] || guard(1)), b = Math.random() * TAU, d = 0.9 + Math.random() * 0.8; fx.rocks.push({ s: 1, a0: b, d0: d, t0: t, t1: t + 0.32 + Math.random() * 0.12, fin: 1, sp: 3 * (Math.random() < 0.5 ? 1 : -1), s0: 0.12 + Math.random() * 0.1, k: Math.floor(Math.random() * CH.length), lp: [0.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.9, (Math.random() - 0.2) * 0.6], ox: wp[0], oy: wp[1] }); } }
        else if (S.type !== 'final') finalCharge = 0;
        // the moving hits
        if (S.type === 'hook' && u >= 0.34 && u <= 0.74) {
          const p = kfEval(S.KF, u), th = p.th, prev = S.thPrev == null ? S.th0 : S.thPrev; S.thPrev = th;
          for (const m of living()) { if (S.hit.has(m)) continue; const dx = m.x - anc.x, dy = m.y - anc.y, d = Math.hypot(dx, dy); if (d < 0.3 || d > S.rr + 1.0 * K + m.r) continue; const ang = wrapA(Math.atan2(dy, dx) - A), lo = Math.min(prev, th) - 0.12, hi = Math.max(prev, th) + 0.12;
            if (ang >= lo && ang <= hi) hit(S, m, mm => { flash(mm.x, mm.y, 0.75, 0.55, 0.22); debris(mm.x, mm.y, 0.6, 4 + tier, { up: 2.5, v: 2.5, dir: A + th - S.side * Math.PI / 2, spread: 1 }); sparks(mm.x, mm.y - 0.6, 5); }); }
          if (!S.sw && u > 0.5) { S.sw = 1; H.X.shake(4, 0.14); H.X.sfx.thud(); }
        }
        if (S.type === 'body' && u >= 0.38 && u <= 0.72) {
          const p = kfEval(S.KF, u), front = p.u + 0.55 * SZ, f2 = fwd(), sv = sideV();
          for (const m of living()) { if (S.hit.has(m)) continue; const dx = m.x - anc.x, dy = m.y - anc.y, al = dx * f2[0] + dy * f2[1], of = dx * sv[0] + dy * sv[1]; if (al > 0.1 && al < front + m.r * 0.5 && Math.abs(of - p.v) < S.hw + m.r) hit(S, m, mm => { flash(mm.x, mm.y, 0.45, 0.6, 0.24); debris(mm.x, mm.y, 0.4, 5 + tier, { up: 2.2, v: 3, dir: A, spread: 0.9 }); sparks(mm.x, mm.y - 0.4, 6); }); }
          if (!S.sw && u > 0.52) { S.sw = 1; H.X.shake(5, 0.16); H.X.sfx.thud(); }
        }
        if (S.type === 'final' && u >= S.ct - 0.06) {
          const p = kfEval(S.KF, Math.min(u, S.ct)), tc = S.s + S.d * S.ct, front = u < S.ct ? p.u + 0.6 * SZ * 1.3 : Math.min(S.RF, (S.D + 1.6) + 11 * (t - tc));
          for (const m of living()) { if (S.hit.has(m)) continue; const dx = m.x - anc.x, dy = m.y - anc.y, d = Math.hypot(dx, dy), ang = Math.abs(wrapA(Math.atan2(dy, dx) - A)); if (d <= front + m.r * 0.5 && d <= S.RF + m.r && ang < S.spread + Math.asin(Math.min(1, m.r / Math.max(d, m.r))) * 0.7) hit(S, m, mm => { flash(mm.x, mm.y, 0.6, 0.55, 0.22); }); }
        }
        // the moment of contact
        if (!S.fired && u >= S.ct) { S.fired = true; const p = kfEval(S.KF, S.ct), wp = world(p), kn = fistPt(S.side, p, [1.0, 0, 0.05]), kp = [wp[0] + kn[0], wp[1] + kn[1], wp[2] + kn[2]];
          if (S.type === 'up' || S.type === 'down' || S.type === 'over') landAt(S, kp);
          if (S.type === 'final') { const f2 = fwd(); flash(kp[0], kp[1], kp[2], 1.9, 0.5, true); fx.marks.push({ x: kp[0] + f2[0] * 0.5, y: kp[1] + f2[1] * 0.5, R: 2.0 * K, t: 0, life: 1.6, seed: 7, ring: true, big: true, fwd: true, a: A });
            debris(kp[0], kp[1], kp[2], 20, { up: 3.5, v: 5.2, dir: A, spread: 1.4, s: 0.2 }); debris(kp[0], kp[1], kp[2], 8, { up: 4, v: 2.2, s: 0.14 }); dust(kp[0] + f2[0] * 0.8, kp[1] + f2[1] * 0.8, 14, 3, 0.5); sparks(kp[0], kp[1] - kp[2], 16, 3);
            for (let j = 0; j < H.n(14); j++) fx.streaks.push({ x: kp[0], y: kp[1], z: kp[2] * (0.4 + Math.random() * 0.9), a: A + (Math.random() - 0.5) * 0.9, v: 7 + Math.random() * 6, t: -Math.random() * 0.08, life: 0.32 + Math.random() * 0.2, w: 0.5 + Math.random() * 0.6 });
            H.X.sfx.crash(); H.X.sfx.thud(); H.X.shake(13, 0.4); H.X.light && H.X.light(kp[0], kp[1], 3, 0.35); H.X.hitstop && H.X.hitstop(0.07); }
          if (S.type === 'hook' || S.type === 'body') sparks(kp[0], kp[1] - kp[2], 4);
        }
      }
      // the fists this frame
      for (const s of [-1, 1]) { const p = poseAt(s, t); FS[s] = p; if (t < endAt) lastPose[s] = p; const wp = world(p); kids[s < 0 ? 0 : 1].entY = shattered ? null : wp[1] + 0.02; kids[s < 0 ? 0 : 1].x = wp[0]; kids[s < 0 ? 0 : 1].y = wp[1];
        // the knuckles' trail while it moves fast
        const kn = fistPt(s, p, [1.0, 0, 0.05]), kp = [wp[0] + kn[0], wp[1] + kn[1], wp[2] + kn[2]], tr = fx.trails[s], last = tr[tr.length - 1];
        const sp = last ? Math.hypot(kp[0] - last.x, kp[1] - last.y, kp[2] - last.z) / Math.max(1e-3, t - last.t) : 0, St = strikes[curIdx(t)], act = St.on && St.side === s && t < endAt;
        if (act && sp > 3.2 && t >= FORM) { tr.push({ x: kp[0], y: kp[1], z: kp[2], t, k: St.type }); if (Math.random() < dt * 40 * H.Q()) H.P({ kind: 'spark', x: kp[0], y: kp[1] - kp[2], vx: (Math.random() - 0.5) * 1.5, vy: -0.6 - Math.random(), g: 3, life: 0.4, max: 0.4, size: 1.6 + Math.random(), color: Math.random() < 0.5 ? GOLD : HONEY });
          if (Math.random() < dt * 14 * H.Q()) H.P({ kind: 'smoke', x: kp[0], y: kp[1] - kp[2] * 0.9, vx: (Math.random() - 0.5) * 0.4, vy: -0.2, life: 0.55, max: 0.55, size: 0.18 + Math.random() * 0.1, color: 'rgba(196,160,98,' }); }
        else if (!last || t - last.t > 0.02) tr.push({ x: kp[0], y: kp[1], z: kp[2], t, k: 'end', gap: !act || sp <= 3.2 });
        if (act && sp > 3.2 && t >= FORM && t - (fx.chipT[s] || 0) > 0.045) { fx.chipT[s] = t; debris(kp[0], kp[1], Math.max(0.1, kp[2] - 0.1), 1, { up: 0.6, v: 0.7, s: 0.075 }); }
        while (tr.length && (t - tr[0].t > 0.35 || tr.length > 48)) tr.shift();
        // the cuff's fragments lag behind the wrist
        for (const q of fx.frags[s]) { const an = q.a + t * q.sp, lp = [q.ax, Math.cos(an) * q.r, Math.sin(an) * q.r * 0.9], o = fistPt(s, p, lp), tg = [wp[0] + o[0], wp[1] + o[1], wp[2] + o[2] + 0.04 * Math.sin(t * 3 + q.a)];
          if (!q.p) q.p = tg.slice(); else { const k = Math.min(1, dt * q.lag); q.p[0] += (tg[0] - q.p[0]) * k; q.p[1] += (tg[1] - q.p[1]) * k; q.p[2] += (tg[2] - q.p[2]) * k; }
          q.dep = mvm(orient(s < 0 ? Math.PI - (A + p.yr) : A + p.yr, p.ph), lp); q.front = (s < 0 ? 1 : 1) * (q.dep[1] * 0.84 + q.dep[2] * 0.55) > 0; } }
      // the veins' light: a breath while it fights, brighter as each blow lands, dimming at the end
      { let g = 0.55 + 0.1 * Math.sin(t * 4) + 0.15 * (tier - 1); const St = strikes[curIdx(t)]; if (St.on && t < endAt) { const u = (t - St.s) / St.d; g += 0.6 * Math.exp(-Math.pow((u - St.ct) / 0.08, 2)) + (St.type === 'final' ? 0.9 * finalCharge : 0); }
        if (t < FORM) g *= sstep(0.4, 0.95, t); if (t >= endAt) g *= 1 - sstep(0.05, 0.4, t - endAt); glowK += (g - glowK) * Math.min(1, dt * 12); }
      applyPet(dt, t);
      // (what the blows and the end will need, made a piece a frame ahead of time: no hitch when they come)
      if (tasks.length) tasks.shift()();
      if (!shattered && t >= endAt + 0.28 && !F._pc) { F._pc = 1; for (const s of [-1, 1]) tasks.push(() => { if (lastFr[s]) { pcFr[s] = lastFr[s]; try { chunksOf(lastFr[s]); } catch (e) { /* (drawn whole then) */ } } }); }
      if (!shattered && t >= endAt + 0.38) { shattered = true; shatter(t); }
      // the effects age
      for (const q of fx.flashes) q.t += dt; fx.flashes = fx.flashes.filter(q => q.t < q.life);
      for (const q of fx.marks) q.t += dt; fx.marks = fx.marks.filter(q => q.t < q.life);
      for (const q of fx.streaks) q.t += dt; fx.streaks = fx.streaks.filter(q => q.t < q.life);
      for (const q of fx.debris) { q.t += dt; q.vz -= 11 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.r += q.vr * dt; if (q.z < 0) { q.z = 0; q.vz = -q.vz * 0.3; q.vx *= 0.55; q.vy *= 0.55; q.vr *= 0.6; } } fx.debris = fx.debris.filter(q => q.t < q.life);
      fx.rocks = fx.rocks.filter(q => !q.fin || t < q.t1 + 0.05);
      for (const q of fx.chunks) { const w = t - q.t0 - q.d; if (w <= 0) continue; if (w < 0.16) { q.ox = q.dx * sm(w / 0.16); q.oy = q.dy * sm(w / 0.16); } else { q.vz -= 7 * dt; q.z = Math.max(q.zmin, q.z + q.vz * dt); q.rot += q.vr * dt; } if (!q.dusted && w > 0.42) { q.dusted = 1; dust(q.wx, q.wy, 2, 0.6, 0.26); } }
      if (t > endAt + ENDD && !ended) { ended = true; f.life = Math.min(f.life, 0.45); for (const c of kids) c.life = Math.min(c.life, 0.45); clearPet(); }
      // the pictures still to bake, a slice at a time (more while what is on screen is missing)
      if (FC.queue.length || FC.job) { const sync = typeof window !== 'undefined' && window.__rkySync; bakeStep(sync ? 1e4 : FC.miss > 0 ? 2 : 0.7); FC.miss = 0; }
    }
    // the end: each fist split into its stones, which loosen (the fingers first), drop a short way and crumble to dust
    function shatter(t) {
      const T = H.X.Tz();
      for (const s of [-1, 1]) { const fr = pcFr[s] || lastFr[s]; if (!fr) continue; const p = FS[s], wp = world(p), upx = T * UNIT * SZ * p.sc, sc = upx / fr.S;
        let pieces; try { pieces = chunksOf(fr); } catch (e) { pieces = []; }
        for (const q of pieces) { const gx = (s < 0 ? (fr.W - q.mx) - (fr.W - fr.cx) : q.mx - fr.cx) * sc / T, gy = (q.my - fr.cy) * sc / T, fing = q.g >= 3 && q.g <= 7;
          fx.chunks.push({ s, q, fr, flip: s < 0, sc, wx: wp[0] + gx, wy: wp[1], z: wp[2] - gy, zmin: Math.max(0.02, wp[2] - gy - 0.5), vz: 0.3 + Math.random() * 0.5, dx: gx * 0.12 + (Math.random() - 0.5) * 0.04, dy: -0.02 * Math.random(), ox: 0, oy: 0, rot: 0, vr: (Math.random() - 0.5) * (fing ? 4 : 2.2), t0: t, d: fing ? 0 : q.g >= 9 ? 0.05 : 0.1 + Math.random() * 0.06 }); }
        sparks(wp[0], wp[1] - wp[2], 5, 1); }
      H.X.sfx.thud();
    }
    /* ---- drawing ---- */
    function petBox(T) { return [H.sx(me.x + (me.hopDX || 0)), H.sy(me.y + (me.hopDY || 0)) - T * 0.5 - (me.z || 0) * T]; }
    const nearPet = (x, y, T) => { const pb = petBox(T); return 0.35 + 0.65 * sstep(T * 0.35, T * 1.1, Math.hypot(x - pb[0], y - pb[1])); };
    function drawEnt(c, f, s) {
      if (shattered) return; const p = FS[s]; if (!p) return; const T = H.X.Tz(), t = lastT, wp = world(p), X = H.sx(wp[0]), Y = H.sy(wp[1]) - wp[2] * T, upx = T * UNIT * SZ * p.sc;
      setScale(T, SZ, (() => { const m = c.getTransform(); return Math.min(2, Math.max(1, Math.hypot(m.a, m.b) || 1)); })());
      // in front of the pet it dims smoothly where it would cover it
      const inFront = wp[1] > me.y + 0.02, dt = inFront ? nearPet(X, Y, T) : 1; dimA[s] += (dt - dimA[s]) * 0.25; const a = dimA[s];
      const sync = typeof window !== 'undefined' && window.__rkySync; if (sync && (FC.queue.length || FC.job)) bakeStep(1e4);
      // the fragments behind, the fist, the fragments in front
      const frag = front => { for (const q of fx.frags[s]) { if (!q.p || q.front !== front) continue; const fa = t < FORM ? sstep(0.75, 1.0, t) : 1, rs = CH[q.k], sz = q.s * T * SZ * 1.15, x = H.sx(q.p[0]), y = H.sy(q.p[1]) - q.p[2] * T; if (fa < 0.02) continue; c.save(); c.globalAlpha = a * fa; c.translate(x, y); c.rotate(t * 1.3 + q.a); c.drawImage(rs.body, -sz / 2, -sz / 2 * rs.H / rs.W, sz, sz * rs.H / rs.W); c.restore(); glowF(c, x, y, sz * 1.1, AMBER, 0.28 * a * fa * (0.4 + glowK * 0.6)); } };
      frag(false);
      if (t < FORM) {   // assembling: the stages lock in, then it turns into its guard
        const a1 = sstep(0.36, 0.5, t), a2 = sstep(0.56, 0.7, t), a3 = sstep(0.76, 0.88, t);
        c.save(); if (a1 > 0.01 && a3 < 0.99) drawFist(c, tier, s, X, Y, A + p.yr, p.ph, upx, a * a1, glowK, 's1', 0); if (a2 > 0.01 && a3 < 0.99) drawFist(c, tier, s, X, Y, A + p.yr, p.ph, upx, a * a2, glowK, 's2', 0); if (a3 > 0.01) lastFr[s] = drawFist(c, tier, s, X, Y, A + p.yr, p.ph, upx, a * a3, glowK, 'full', 0); c.restore();
        for (const [t0, k] of [[0.5, 0.5], [0.7, 0.4], [0.88, 0.45]]) { const w = t - t0; if (w > -0.05 && w < 0.25) glowF(c, X, Y, upx * 1.4, GOLD, a * k * (1 - Math.abs(w + 0.05) / 0.3)); }
      } else {
        // the final punch's charge: the fist trembles; light runs from the wrist to the knuckles
        let jx = 0, jy = 0; if (s > 0 && finalCharge > 0.01 && finalCharge < 0.999) { jx = Math.sin(t * 61) * T * 0.02 * finalCharge; jy = Math.cos(t * 47) * T * 0.015 * finalCharge; }
        c.save(); lastFr[s] = drawFist(c, tier, s, X + jx, Y + jy, A + p.yr, p.ph, upx, a, glowK * (s > 0 ? 1 + finalCharge * 0.6 : 1), 'full', p.rf || 0); c.restore();
        if (s > 0 && finalCharge > 0.02) { const w0 = fistPt(s, p, [-0.8, 0, 0]), k0 = fistPt(s, p, [0.95, 0, 0.1]), u = sstep(0.15, 0.95, finalCharge), x = X + lerp(w0[0], k0[0], u) * T, y = Y + (lerp(w0[1], k0[1], u) - lerp(w0[2], k0[2], u)) * T;
          glowF(c, x, y, upx * (0.55 + 0.5 * u), HONEY, a * 0.7 * Math.sin(Math.PI * cl(finalCharge * 1.05))); glowF(c, X + k0[0] * T, Y + (k0[1] - k0[2]) * T, upx * 0.9 * u, GOLD, a * 0.5 * u); }
      }
      frag(true);
    }
    function drawUnder(c, f, X0, Y0, T, tg) {
      const t = lastT;
      // the formation's light on the floor where the stones gather
      if (t < FORM + 0.3) for (const s of [-1, 1]) { const g = guard(s), wp = world(g), k = sstep(0, 0.3, t) * (1 - sstep(FORM - 0.1, FORM + 0.3, t)); glowF(c, H.sx(wp[0]), H.sy(wp[1]), T * 1.1 * SZ, AMBER, 0.32 * k, GY); }
      // soft shadows under the fists (fainter and smaller the higher they are)
      if (!shattered) for (const s of [-1, 1]) { const p = FS[s]; if (!p) continue; const wp = world(p), k = 1 / (1 + wp[2] * 0.7), a = (t < FORM ? sstep(0.4, 0.9, t) : 1) * dimA[s] * (t >= endAt ? 1 - sstep(0.2, 0.5, t - endAt) : 1), w = T * 0.95 * SZ * p.sc * k;
        c.save(); c.globalAlpha = 0.5 * a * k; c.drawImage(E.shade(), H.sx(wp[0]) - w, H.sy(wp[1]) - w * GY * 0.8, w * 2, w * 2 * GY * 0.8); c.restore(); glowF(c, H.sx(wp[0]), H.sy(wp[1]), w * 0.8, AMBER, 0.12 * glowK * a * k, GY); }
      // the marks of the blows: light only, fading (cracks, an amber ring and a dust ring; the final one stretched forward)
      for (const q of fx.marks) { const u = q.t / q.life, X = H.sx(q.x), Y = H.sy(q.y), Rp = q.R * T;
        c.save(); c.translate(X, Y); if (q.fwd) { c.scale(1, GY); c.rotate(q.a); c.scale(1.45, 1); c.rotate(-q.a); c.scale(1, 1 / GY); }
        const ck = (1 - sstep(0.4, 1, u)) * sstep(0, 0.06, q.t), img = E.cracks(q.seed, Rp * (q.big ? 0.75 : 0.7), q.big ? 9 : 6, q.big ? 2 : 1), kk = 1; c.globalCompositeOperation = 'lighter'; c.globalAlpha = ck * 0.7; c.drawImage(img, -img.width / 2 * kk, -img.height / 2 * kk, img.width * kk, img.height * kk);
        if (q.ring) { const r = Rp * (0.25 + 0.95 * (1 - Math.pow(1 - cl(u / 0.45), 2))), ra = (1 - sstep(0.25, 0.75, u)); c.globalAlpha = ra * 0.6; c.drawImage(E.amberBand(), -r, -r * GY, r * 2, r * 2 * GY); c.globalCompositeOperation = 'source-over'; c.globalAlpha = ra * 0.38; const r2 = r * 0.92; c.drawImage(E.dustBand(), -r2, -r2 * GY, r2 * 2, r2 * 2 * GY); }
        c.restore(); glowF(c, X, Y, Rp * 0.6, AMBER, 0.38 * (1 - sstep(0, 0.45, u)), GY); }
    }
    function draw(c, f, X0, Y0, T, tg) {
      const t = lastT, pb = petBox(T);
      // the formation's pebbles: up from the floor, spiralling into the cluster, onto their place in the stone
      for (const q of fx.rocks) { const p = FS[q.s]; if (!p) continue; if (!q.fin && t > q.t1 + 0.05) continue; if (t < q.t0) continue;
        const u = cl((t - q.t0) / (q.t1 - q.t0)), e = sm(u), wp = world(p), lp = fistPt(q.s, p, q.lp), tx = wp[0] + lp[0], ty = wp[1] + lp[1], tz = wp[2] + lp[2];
        const ox = q.fin ? q.ox : world(guard(q.s))[0], oy = q.fin ? q.oy : world(guard(q.s))[1], ang = q.a0 + q.sp * u * TAU * 0.6, rr = q.d0 * (1 - e), x = lerp(ox + Math.cos(q.a0) * q.d0, tx, e) + Math.cos(ang) * rr * 0.6, y = lerp(oy + Math.sin(q.a0) * q.d0 * 0.6, ty, e) + Math.sin(ang) * rr * 0.4, z = lerp(0.02, tz, e) + Math.sin(u * Math.PI) * 0.5;
        const X = H.sx(x), Y = H.sy(y) - z * T, rs = CH[q.k], sz = q.s0 * T * SZ * 1.3 * (q.fin ? 1 : 1 - 0.3 * e), al = Math.min(1, (t - q.t0) / 0.08) * (u >= 1 ? 1 - cl((t - q.t1) / 0.05) : 1) * nearPet(X, Y, T);
        c.save(); c.globalAlpha = al; c.translate(X, Y); c.rotate(q.a0 + u * q.sp * 3); c.drawImage(rs.body, -sz / 2, -sz / 2 * rs.H / rs.W, sz, sz * rs.H / rs.W); c.restore(); glowF(c, X, Y, sz * 1.2, u < 1 ? AMBER : HONEY, 0.35 * al * (0.4 + 0.6 * e)); }
      // the energy strands: from the pet's hands to the stone wrists (formation; the strongest gestures at Celestial)
      { let k = sstep(0.62, 0.85, t) * (1 - sstep(1.2, 1.45, t)); const St = strikes[curIdx(t)];
        if (tier >= 3 && St.on && t < endAt) { const u = (t - St.s) / St.d; if (St.type === 'final') k = Math.max(k, 0.9 * sstep(0.1, 0.25, u) * (1 - sstep(St.ct + 0.05, St.ct + 0.2, u))); else if (St.type === 'over' || (St.type === 'up' && St.i === 1)) k = Math.max(k, 0.6 * Math.exp(-Math.pow((u - St.ct) / 0.12, 2))); }
        if (NS < 7 && t > FORM) k = Math.max(k, 0);
        if (k > 0.02 && !shattered) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          for (const s of [-1, 1]) { const p = FS[s]; if (!p) continue; const wp = world(p), wr = fistPt(s, p, [-0.75, 0, 0]), ex = H.sx(wp[0] + wr[0]), ey = H.sy(wp[1] + wr[1]) - (wp[2] + wr[2]) * T, sx0 = pb[0] + scrSideX(s) * T * 0.34, sy0 = pb[1] + T * 0.08;
            for (let j = 0; j < 3; j++) { const ph = t * (5 + j) + j * 2.1 + s, mx = (sx0 + ex) / 2 + Math.sin(ph) * T * 0.16, my = (sy0 + ey) / 2 - T * 0.25 + Math.cos(ph * 0.8) * T * 0.12;
              c.globalAlpha = k * 0.28; c.strokeStyle = AMBER; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.moveTo(sx0, sy0); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
              c.globalAlpha = k * 0.85; c.strokeStyle = j ? HONEY : PALE; c.lineWidth = Math.max(0.8, T * 0.022); c.stroke();
              const uu = (t * 1.6 + j / 3) % 1, qq = 1 - uu, bx = qq * qq * sx0 + 2 * qq * uu * mx + uu * uu * ex, by = qq * qq * sy0 + 2 * qq * uu * my + uu * uu * ey, gs = T * 0.11; c.globalAlpha = k; c.drawImage(glowSprite(HONEY), bx - gs, by - gs, gs * 2, gs * 2); }
            c.globalAlpha = k * 0.6; c.drawImage(glowSprite(GOLD), ex - T * 0.3, ey - T * 0.3, T * 0.6, T * 0.6); c.drawImage(glowSprite(GOLD), sx0 - T * 0.18, sy0 - T * 0.18, T * 0.36, T * 0.36); }
          c.restore(); } }
      // the knuckles' wakes: broad feathered ribbons of dust and gold, widest at the knuckles, tapering behind (rising
      // curves for uppercuts, broad arcs for hooks, long wakes for the straight, the body blow and the downward blows)
      for (const s of [-1, 1]) { const tr = fx.trails[s]; if (tr.length < 2) continue;
        const wide = tr.some(q => q.k === 'hook') ? 1.35 : tr.some(q => q.k === 'final') ? 1.6 : 1, W0 = T * 0.62 * SZ * wide, runs = []; let run = [];
        for (const q of tr) { if (q.gap) { if (run.length > 1) runs.push(run); run = []; continue; } const k = 1 - (t - q.t) / 0.35; if (k <= 0) continue; run.push([H.sx(q.x), H.sy(q.y) - q.z * T, k]); }
        if (run.length > 1) runs.push(run);
        for (const R of runs) {
          const n = R.length, NX = new Array(n), NY = new Array(n); for (let i = 0; i < n; i++) { const a = R[Math.max(0, i - 1)], b = R[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; NX[i] = -dy / l; NY[i] = dx / l; }
          const head = R[n - 1], dim = nearPet(head[0], head[1], T);
          const ribbon = wk => { c.beginPath(); for (let i = 0; i < n; i++) { const w = W0 * wk * Math.pow(R[i][2], 1.3) * 0.5; i ? c.lineTo(R[i][0] + NX[i] * w, R[i][1] + NY[i] * w) : c.moveTo(R[i][0] + NX[i] * w, R[i][1] + NY[i] * w); } for (let i = n - 1; i >= 0; i--) { const w = W0 * wk * Math.pow(R[i][2], 1.3) * 0.5; c.lineTo(R[i][0] - NX[i] * w, R[i][1] - NY[i] * w); } c.closePath(); c.fill(); };
          c.save();
          for (const [wk, ak, col, add] of [[1.4, 0.08, 'rgb(132,114,90)', 0], [1.05, 0.1, 'rgb(150,130,100)', 0], [0.75, 0.12, 'rgb(170,148,112)', 0], [1.15, 0.07, AMBER, 1], [0.8, 0.1, AMBER, 1], [0.52, 0.14, GOLD, 1], [0.28, 0.18, HONEY, 1], [0.1, 0.3, PALE, 1]]) {
            c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = ak * dim; c.fillStyle = col; ribbon(wk); }
          c.restore(); } }
      // tumbling stone chips
      for (const q of fx.debris) { const X = H.sx(q.x), Y = H.sy(q.y) - q.z * T, rs = CH[q.k], sz = q.s * T * 1.4, al = (1 - sstep(0.65, 1, q.t / q.life)) * nearPet(X, Y, T);
        c.save(); c.globalAlpha = al; c.translate(X, Y); c.rotate(q.r); c.drawImage(rs.body, -sz / 2, -sz / 2 * rs.H / rs.W, sz, sz * rs.H / rs.W); c.restore(); if (q.hot && q.t < 0.35) glowF(c, X, Y, sz, AMBER, 0.4 * al * (1 - q.t / 0.35)); }
      // the final punch's pressure: streaks of light flying forward
      for (const q of fx.streaks) { if (q.t < 0) continue; const u = q.t / q.life, d = q.v * q.t, x = q.x + Math.cos(q.a) * d, y = q.y + Math.sin(q.a) * d, X = H.sx(x), Y = H.sy(y) - q.z * T * (1 - u * 0.5), L = T * (1.2 + 1.2 * q.w) * (1 - u * 0.4), dx = Math.cos(q.a), dy = Math.sin(q.a), ang = Math.atan2(dy, dx);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * 0.8 * nearPet(X, Y, T); c.translate(X, Y); c.rotate(ang); c.drawImage(streakSpr(), -L, -T * 0.06 * q.w - T * 0.03, L, T * 0.12 * q.w + T * 0.06); c.restore(); }
      // the contact flashes: a compact solid core under the light, so it reads as a hit, not a hole
      for (const q of fx.flashes) { const u = q.t / q.life, X = H.sx(q.x), Y = H.sy(q.y) - q.z * T, a = (1 - u) * nearPet(X, Y, T), r = q.r * T * (0.6 + 0.5 * Math.pow(u, 0.5));
        glowF(c, X, Y, r * 1.6, AMBER, a * 0.7); glowF(c, X, Y, r, GOLD, a * 0.9);
        if (u < 0.45) { c.save(); c.globalAlpha = a * (1 - u / 0.45) * 0.85; c.fillStyle = EMBER; c.beginPath(); c.arc(X, Y, r * 0.22 * (1 - u), 0, TAU); c.fill(); c.restore(); }
        glowF(c, X, Y, r * 0.45, EMBER, a); if (q.big) glowF(c, X, Y, r * 2.4, AMBER, a * 0.35); }
      // the end: the stones of each fist, loosening, dropping, crumbling
      for (const q of fx.chunks) { const w = t - q.t0, al = 1 - sstep(0.45, 0.85, w - q.d); if (al <= 0.01) continue; const X = H.sx(q.wx + q.ox), Y = H.sy(q.wy) - q.z * T + q.oy * T, k = q.sc, cw = q.q.w * k, chh = q.q.h * k;
        c.save(); c.globalAlpha = al; c.translate(X, Y); c.rotate(q.rot); if (q.flip) c.scale(-1, 1); c.drawImage(q.q.cv, -cw / 2 - (q.q.mx - q.q.x0 - q.q.w / 2) * k, -chh / 2 - (q.q.my - q.q.y0 - q.q.h / 2) * k, cw, chh); c.restore(); }
    }
    const scrSideX = s => scrSide(s);
    return F;
  };
  U.rocky.warm = o => {
    const ev = Math.max(1, Math.min(7, Math.round(o.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, SZ = 1 + 0.06 * (ev - 1);
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1; setScale(T, SZ, Math.min(2, Math.max(1, dpr))); try { chipSet(); } catch (e) { /* (the chips are made at the cast then) */ } plan(tier, Math.PI / 2); idleBake(); }, 300);
  };
  // the debug door for the harness: the model alone
  U.rocky.__dbg = { FC, model, orient, fistGen, drawFist, bakeStep, setScale, plan, chunksOf, NPSI, NPHI, DPSI, DPHI, UNIT };
})();
