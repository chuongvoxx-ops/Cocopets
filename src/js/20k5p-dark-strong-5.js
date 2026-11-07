/* ---------- Dark Strong, new: Demon Blade ----------
   The pet tears a violet seam open beside it, a cursed greatsword of black crystal assembles out of it hilt to tip, and
   the pet braces under its weight and swings it through a flowing combo. Replaces Midnight Double (row in 20k1: key
   'demonblade', cost 28, cd 6, glyph 'crescent').
   Combos (C.evo; held until their breakpoints), exactly as the spec orders them, the overhead finisher always last:
     L1-3  opening cleave, returning cut, overhead finisher
     L4-6  opening cleave, returning cut, rising slash, reverse cleave, overhead finisher
     L7    opening cleave, returning cut, rising slash, reverse cleave, turning sweep, descending diagonal, finisher
   Hits: each swing is one Dark hit per monster, fired the frame the drawn blade's real sweep reaches it: the blade is
   sampled from the ricasso to the tip (9 points) between this frame's angle and the last (sub-stepped), each sample's
   floor point and height tested against every monster (floor distance <= m.r + 0.18, height below the monster's top);
   only while the blade is cutting (inside its arc and fast). Trails, smoke, fragments, the eruption and the fissure
   never hit. A monster is struck at most once per swing.
   Damage (DK = base x K x (1 + 0.1 (evo - 1))), for a monster struck by every swing: TOT = 2.6 / 3.8 / 5.0 DK at 3 / 5 / 7
   swings (2.6 / 4.94 / 8.0 x base x K at levels 1 / 4 / 7), split by weight 1 a swing and 1.6 / 1.7 / 1.8 for the finisher:
     L1  0.72, 0.72, 1.16       L4  0.67 x4, 1.13 (x1.3)       L7  0.64 x6, 1.15 (x1.6)        (x base x K)
   Health sacrifice: a swing that damaged at least one monster (hitMon > 0) costs the pet 2% of its max HP, once, at its
   first damaging contact, by a direct HP change (never hurtPet: no wards, counters, feathers or death); it never takes
   the pet below 1 HP (nonlethal; at 1 HP it costs nothing). A swing that strikes nothing costs nothing. A thin crimson
   thread runs from the pet into the hilt and the runes pulse when it is paid.
   Targeting (range 7 tiles): the first swing takes the aimed / selected monster (else the nearest), each later one the
   nearest at its wind-up; the swing's frame turns to it, the pet faces it and steps toward it (H.X.moveEnt, up to
   0.45 tiles a swing) if it stands beyond the blade's reach. No monster in range at a wind-up: the combo ends there and
   the sword breaks up.
   Choreography: summon 0.9 s (the seam, crystal fragments flying in, the sword forming hilt -> tip with each section's
   runes lighting as it locks), brace 0.45 s, the swings (each a wind-up that loads back past its start, an accelerating
   cut and a follow-through that flows into the next; the finisher raises the sword overhead while smoke is drawn to it
   and the runes light hilt -> tip, then crushes down), end 0.7 s (the sword breaks up tip -> hilt into black crystal).
   4.9 / 6.4 / 8.1 s in all at levels 1 / 4 / 7.
   Pet hooks (as Rocky / Fujin; it never turns in 3D): me.hopLean, me.hopDX / hopDY (a drawn lunge), me.hopSq, me.hopArmS
   (both arms on the grip, aimed at the hilt), the turning sweep's two quick flips of me.face behind a narrowing squash
   (a cartoon turn, no yaw); input held with me.push = hold (re-armed each frame, it lapses by itself) and the normal
   attacks / dodge waiting as Dracula. All reset on completion, early end, the pet's death and a party swap (seen as the live stats
   object H.X.ST() changing: H.X has no party accessor); the floor's
   end throws the game away.
   Pictures: the sword is a thickness field (pommel spike and claw-held gem, a wrapped grip with ferrules, a horned
   demonic guard with a crimson eye, a thick tapered blade with hooked teeth, edge bevels, a raised ridge, engraved
   channels framing two bands of recessed runes, scratches) ray-marched per pixel at the screen's scale for 7 view angles
   about its axis (face-on .. near edge-on; level 7 has its own, with a second pair of horns, spines, fangs, more and
   brighter runes), each a body, a gloss and an emissive layer, lazily in slices (1.1 ms a frame, 1.6 ms while the one on
   screen is missing; Strongs are not prewarmed), cheap fallbacks meanwhile; drawn by an affine of the blade's 3D axis.
   Trails are drawn in each swing's own 3D plane (one affine): crescents whose width follows the blade's speed, built of
   cumulative cross-section bands (0 at the inner edge -> translucent indigo -> a crisp violet-white edge) faded along
   their length by conic gradients, with flowing streaks and a crimson filament. Reduced motion: no camera shake. */
(() => {
  const S = ELEM_IMPL.dark.strong; delete S.double;
  const TAU = Math.PI * 2, GY = 0.55;
  const VOID = '#08050F', PLUM = '#2B0B45', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const CRIM = '#D0183F', RUBY = '#FF2D55', ROSE = '#FF8FA3';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgb = h => hexRGB(h), rgbaA = (A, a) => `rgba(${A[0]},${A[1]},${A[2]},${cl(a).toFixed(3)})`;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const hash2 = (x, y) => { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
  function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  const fbm = (x, y) => vnoise(x, y) * 0.5 + vnoise(x * 2.03 + 5.2, y * 2.03 + 1.3) * 0.3 + vnoise(x * 4.1 + 9.1, y * 4.1 + 7.7) * 0.2;
  // 3D (visual space: x right, d toward the viewer, z up; screen X = x, Y = d GY - z)
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const orth = (v, a) => { const k = dot(v, a); return nrm3([v[0] - a[0] * k, v[1] - a[1] * k, v[2] - a[2] * k]); };
  function slerp(a, b, u) { const c = Math.max(-1, Math.min(1, dot(a, b))); if (c > 0.9995) return nrm3([lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)]);
    let w = b; if (c < -0.999) { w = orth([0, 0, 1], a); if (Math.abs(dot(w, a)) > 0.9) w = orth([1, 0, 0], a); const th = Math.PI * u; return nrm3([a[0] * Math.cos(th) + w[0] * Math.sin(th), a[1] * Math.cos(th) + w[1] * Math.sin(th), a[2] * Math.cos(th) + w[2] * Math.sin(th)]); }
    const th = Math.acos(c), s = Math.sin(th), k0 = Math.sin((1 - u) * th) / s, k1 = Math.sin(u * th) / s; return nrm3([a[0] * k0 + b[0] * k1, a[1] * k0 + b[1] * k1, a[2] * k0 + b[2] * k1]); }
  const VV = nrm3([0, 1, GY]);   // toward the viewer
  let H = null;

  /* ================= the sword's model: a thickness field Th(u, a) (u along the sword from the pommel 0 to the tip 1,
     a across; the solid is |b| <= Th, b its thickness axis), in sword lengths. Globals of the last call: MAT, SV, RN ================= */
  const U0 = -0.045, U1 = 1.006, EXT = 0.215, TMX = 0.04, GRIPU = 0.125;
  let MAT = 0, SV = 0, RN = 0, CHN = 0, SC = 0, HV = 0;
  const MASK = { s: 0, tier: -1, rune: null, scr: null, rw: 0, rh: 0 };
  function bladeHW(u) {
    if (u < 0.285 || u > 1) return 0;
    let w; if (u < 0.31) w = 0.05 + 0.028 * sm((u - 0.285) / 0.025); else if (u < 0.86) w = lerp(0.078, 0.058, (u - 0.31) / 0.55); else { const x = (u - 0.86) / 0.14; w = 0.058 * Math.pow(Math.max(0, 1 - x), 0.82) * (1 + 0.25 * x * (1 - x)); }
    if (u > 0.325 && u < 0.425) { const f = ((u - 0.325) / 0.05) % 1; w += 0.022 * Math.pow(f, 0.85) * (f < 0.9 ? 1 : (1 - f) / 0.1) - 0.006; }   // (two hooked barbs on each edge, pointing to the tip)
    return w;
  }
  const maskAt = (M, a, u) => { if (!M) return 0; const x = Math.round((a + 0.09) * MASK.s), y = Math.round((U1 - u) * MASK.s); if (x < 0 || y < 0 || x >= MASK.rw || y >= MASK.rh) return 0; return M[y * MASK.rw + x] / 255; };
  function bladeTh(u, a) {
    const w = bladeHW(u); if (w <= 0) return 0; const s = Math.abs(a) / w; if (s >= 1) return 0;
    const t0 = lerp(0.027, 0.017, cl((u - 0.3) / 0.7)), te = t0 * 0.5; let th;
    if (s > 0.74) th = te * (1 - s) / 0.26; else if (s > 0.13) th = te + (t0 * 0.8 - te) * (0.74 - s) / 0.61; else th = t0 * (0.8 + 0.2 * (1 - (s / 0.13) * (s / 0.13)));
    const fu = sstep(0.34, 0.37, u) * (1 - sstep(MASK.tier ? 0.9 : 0.85, MASK.tier ? 0.93 : 0.88, u));
    let ch = 0; for (const c0 of [0.17, 0.66]) { const x = (s - c0) / 0.035; if (x > -1 && x < 1) ch = Math.max(ch, (1 - x * x) * (1 - x * x)); }
    ch *= fu; const rn = fu > 0 ? maskAt(MASK.rune, a, u) : 0, sc = maskAt(MASK.scr, a, u);
    th -= 0.0045 * ch + 0.0032 * rn + 0.0006 * sc;
    MAT = 1; SV = s; RN = rn; CHN = ch; SC = sc; return Math.max(0.0004, th);
  }
  // the guard: a skull-like boss with a crimson eye, horns sweeping out and up (level 7: a second pair curving down, spines, fangs)
  const HORN = {};
  function hornSet(tier) {
    if (HORN[tier]) return HORN[tier]; const L = [];
    const mkH = (f, n, r0, r1) => { const P = []; for (let i = 0; i <= n; i++) { const v = i / n, q = f(v); P.push([q[0], q[1], lerp(r0, r1, Math.pow(v, 0.9)), v]); } return P; };
    for (const sd of [-1, 1]) {
      L.push({ P: mkH(v => [sd * (0.045 + 0.15 * v), 0.245 + 0.028 * v + 0.085 * Math.pow(v, 2.4)], 14, 0.024, 0.0025), ring: 1 });
      L.push({ P: mkH(v => [sd * (0.03 + 0.022 * v), 0.212 - 0.032 * v], 4, 0.009, 0.0015), ring: 0 });   // (fangs down toward the grip)
      if (tier) {
        L.push({ P: mkH(v => [sd * (0.04 + 0.12 * v), 0.228 - 0.045 * Math.pow(v, 1.7)], 10, 0.016, 0.002), ring: 1 });
        for (const v0 of [0.3, 0.5, 0.7]) { const b = L[L.length - 3 + (sd < 0 ? 0 : 0)].P; void b; const x0 = sd * (0.045 + 0.15 * v0), y0 = 0.245 + 0.028 * v0 + 0.085 * Math.pow(v0, 2.4); L.push({ P: mkH(v => [x0 + sd * 0.012 * v, y0 - 0.012 - 0.022 * v], 3, 0.006, 0.001), ring: 0 }); }
        L.push({ P: mkH(v => [sd * (0.088 + 0.01 * v), 0.27 + 0.06 * v], 4, 0.009, 0.001), ring: 0 });   // (fangs up beside the blade's base)
      }
    }
    for (const h of L) { let x0 = 1, x1 = -1, y0 = 1, y1 = -1; for (const p of h.P) { x0 = Math.min(x0, p[0] - p[2]); x1 = Math.max(x1, p[0] + p[2]); y0 = Math.min(y0, p[1] - p[2]); y1 = Math.max(y1, p[1] + p[2]); } h.bb = [x0, x1, y0, y1]; }
    return (HORN[tier] = L);
  }
  function guardTh(u, a, tier) {
    let best = 0, mat = 0, hv = 0;
    { const du = (u - 0.236) / 0.034, da = a / 0.056, r2 = du * du + da * da; if (r2 < 1) { const t = 0.03 * Math.sqrt(1 - r2) * (1 - 0.18 * Math.exp(-Math.pow((Math.abs(a) - 0.024) / 0.007, 2)) * (du < 0.2 && du > -0.5 ? 1 : 0)); if (t > best) { best = t; mat = 2; hv = 0; } } }
    { const du = (u - 0.24) / 0.011, da = a / 0.013, r2 = du * du + da * da; if (r2 < 1) { const t = 0.033 + 0.004 * Math.sqrt(1 - r2); if (t > best) { best = t; mat = 5; } } }   // (the eye)
    for (const h of hornSet(tier)) { if (a < h.bb[0] || a > h.bb[1] || u < h.bb[2] || u > h.bb[3]) continue; const P = h.P;
      for (let i = 0; i < P.length - 1; i++) { const p = P[i], q = P[i + 1], ex = q[0] - p[0], ey = q[1] - p[1], L2 = ex * ex + ey * ey || 1e-9; let k = ((a - p[0]) * ex + (u - p[1]) * ey) / L2; k = k < 0 ? 0 : k > 1 ? 1 : k;
        const dx = a - (p[0] + ex * k), dy = u - (p[1] + ey * k), r = lerp(p[2], q[2], k), v = lerp(p[3], q[3], k), rr = h.ring ? r * (1 + 0.16 * Math.pow(Math.abs(Math.sin(v * 26)), 3) * (v < 0.85 ? 1 : 0)) : r, d2 = dx * dx + dy * dy;
        if (d2 < rr * rr) { const t = rr * 0.85 * Math.sqrt(1 - d2 / (rr * rr)); if (t > best) { best = t; mat = 2; hv = v; } } } }
    MAT = mat; HV = hv; return best;
  }
  function Th(u, a, tier) {
    if (u < U0 || u > U1 || a < -EXT || a > EXT) { MAT = 0; return 0; }
    let best = 0, mat = 0, hv = 0, s = 0, rn = 0, ch = 0, sc = 0;
    if (u > 0.28) { const t = bladeTh(u, a); if (t > 0) { best = t; mat = MAT; s = SV; rn = RN; ch = CHN; sc = SC; } }
    if (u > 0.17 && u < 0.4) { const t = guardTh(u, a, tier); if (t > best) { best = t; mat = MAT; hv = HV; } }
    if (u > 0.045 && u < 0.2) { const ferr = u < 0.062 || u > 0.18, r = ferr ? 0.023 : 0.0175 + 0.0026 * Math.pow(Math.abs(Math.sin(Math.PI * (u * 92 + a * 34))), 0.6); if (Math.abs(a) < r) { const t = Math.sqrt(r * r - a * a); if (t > best) { best = t; mat = ferr ? 4 : 3; } } }
    if (u < 0.05) {
      { const du = u - 0.022, r2 = 0.019 * 0.019 - a * a - du * du; if (r2 > 0) { const t = Math.sqrt(r2); if (t > best) { best = t; mat = 5; } } }
      for (const sd of [-1, 1]) for (const [u0, a0] of [[0.046, 0.011], [0.03, 0.025], [0.012, 0.024], [-0.002, 0.01]]) { void u0; void a0; }
      const cl2 = [[0.047, 0.011], [0.033, 0.026], [0.014, 0.025], [0.0, 0.01]];
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const p = cl2[i], q = cl2[i + 1], ex = sd * (q[1] - p[1]), ey = q[0] - p[0], L2 = ex * ex + ey * ey; let k = ((a - sd * p[1]) * ex + (u - p[0]) * ey) / L2; k = cl(k); const dx = a - (sd * p[1] + ex * k), dy = u - (p[0] + ey * k), r = 0.0062 - 0.0015 * (i + k), d2 = dx * dx + dy * dy; if (d2 < r * r) { const t = r * Math.sqrt(1 - d2 / (r * r)) + 0.004; if (t > best) { best = t; mat = 4; } } }
      if (u < 0.006) { const k = (0.006 - u) / 0.04, r = 0.011 * (1 - k); if (k < 1 && Math.abs(a) < r) { const t = Math.sqrt(r * r - a * a) * 0.9; if (t > best) { best = t; mat = 4; } } }
    }
    MAT = best > 0 ? mat : 0; SV = s; RN = rn; CHN = ch; SC = sc; HV = hv; return best;
  }
  // the rune and scratch masks (in the (a, u) plane, at the sprite's scale)
  function* masksGen(tier) {
    const s = BK.px; if (MASK.s === s && MASK.tier === tier && MASK.rune) return; const rw = Math.ceil(0.18 * s) + 1, rh = Math.ceil((U1 - U0) * s) + 1;
    const cr = mk(rw, rh), cs = mk(rw, rh), g = cr.getContext('2d'), h = cs.getContext('2d'), X = a => (a + 0.09) * s, Y = u => (U1 - u) * s;
    g.strokeStyle = '#fff'; g.lineCap = 'square'; g.lineJoin = 'miter'; g.lineWidth = Math.max(0.8, s * 0.0036);
    const n = tier ? 10 : 7, du = (tier ? 0.5 : 0.44) / n;
    for (const sd of [-1, 1]) for (let i = 0; i < n; i++) { const uc = 0.44 + (i + 0.5 + (sd > 0 ? 0.5 : 0)) * du, w = bladeHW(uc), ac = sd * 0.41 * w, hw = 0.12 * w, hh = du * 0.27, seed = i * 7.3 + (sd > 0 ? 3.1 : 0) + tier * 11;
      g.beginPath(); const st = 2 + Math.floor(R1(seed) * 3);
      g.moveTo(X(ac + (R1(seed + 1) - 0.5) * hw * 0.6), Y(uc - hh)); g.lineTo(X(ac + (R1(seed + 2) - 0.5) * hw * 0.6), Y(uc + hh));   // (a stem)
      for (let k = 0; k < st; k++) { const r = R1(seed + 4 + k * 3.3), uu = uc + (R1(seed + 5 + k) - 0.5) * hh * 1.6; if (r < 0.33) { g.moveTo(X(ac - hw), Y(uu + hh * 0.5)); g.lineTo(X(ac), Y(uu)); g.lineTo(X(ac + hw), Y(uu + hh * 0.5)); } else if (r < 0.66) { g.moveTo(X(ac - hw), Y(uu - hh * 0.4)); g.lineTo(X(ac + hw), Y(uu + hh * 0.4)); } else { g.moveTo(X(ac + sd * hw), Y(uu + hh * 0.6)); g.lineTo(X(ac), Y(uu)); g.lineTo(X(ac + sd * hw * 0.9), Y(uu - hh * 0.5)); } }
      g.stroke(); }
    yield 0;
    h.strokeStyle = '#fff'; h.lineWidth = Math.max(0.6, s * 0.003); h.lineCap = 'round';
    for (let i = 0; i < 46; i++) { const u = 0.32 + R1(i * 3.7 + 1) * 0.6, w = bladeHW(u), a = (R1(i * 5.3 + 2) * 2 - 1) * w * 0.85, L = 0.012 + R1(i * 1.9) * 0.05, an = Math.PI / 2 + (R1(i * 2.9) - 0.5) * 0.9; h.globalAlpha = 0.4 + 0.6 * R1(i * 4.1); h.beginPath(); h.moveTo(X(a), Y(u)); h.lineTo(X(a + Math.cos(an) * L * 0.4), Y(u + Math.sin(an) * L)); h.stroke(); }
    const A = (cv, c2) => { const d = c2.getImageData(0, 0, rw, rh).data, o = new Uint8Array(rw * rh); for (let i = 0; i < o.length; i++) o[i] = d[i * 4 + 3]; return o; };
    yield 0; MASK.rune = A(cr, g); yield 0; MASK.scr = A(cs, h); MASK.s = s; MASK.tier = tier; MASK.rw = rw; MASK.rh = rh;
  }

  /* ================= the picture cache (as Dracula's) ================= */
  const BK = { px: 0, spr: new Map(), queue: [], qset: new Set(), job: null, ms: 0, maxSlice: 0, miss: 0, built: 0 };
  function setScale(px) { if (BK.px && Math.abs(px / BK.px - 1) < 0.25) return; for (const k of [...BK.spr.keys()]) if (k[0] === 'S') BK.spr.delete(k); BK.queue = BK.queue.filter(k => k[0] !== 'S'); BK.qset = new Set(BK.queue); if (BK.job && BK.job.key[0] === 'S') BK.job = null; BK.px = px; MASK.s = 0; }
  function want(key, front) { if (BK.spr.has(key) || (BK.job && BK.job.key === key)) return; if (BK.qset.has(key)) { if (front) { const i = BK.queue.indexOf(key); if (i > 0) { BK.queue.splice(i, 1); BK.queue.unshift(key); } } return; } BK.qset.add(key); if (front) BK.queue.unshift(key); else BK.queue.push(key); }
  function genFor(key, res) { if (key[0] === 'S') return swordGen(+key[1], +key.slice(3), res); return fragGen(+key[2], res); }
  function bakeStep(ms) {
    const t0 = nowMs(), until = t0 + ms;
    while (nowMs() < until) {
      if (!BK.job) { let key = null; while (BK.queue.length && !key) { const k = BK.queue.shift(); BK.qset.delete(k); if (!BK.spr.has(k)) key = k; } if (!key) break; const res = {}; BK.job = { key, res, it: genFor(key, res) }; }
      const jb = BK.job; let done = false; while (nowMs() < until) { if (jb.it.next().done) { done = true; break; } }
      if (!done) break; BK.spr.set(jb.key, jb.res); BK.built++; BK.job = null;
    }
    const dt = nowMs() - t0; BK.ms += dt; if (dt > BK.maxSlice) BK.maxSlice = dt;
  }
  const RHO = [90, 70, 52, 37, 25, 15, 6].map(d => d * Math.PI / 180);
  const skey = (tier, rb) => 'S' + tier + '.' + rb;
  function plan(tier) { for (const rb of [0, 2, 1, 3, 4, 5, 6]) want(skey(tier, rb)); for (const k of ['FR0', 'FR1', 'FR2']) want(k); }

  /* ---- one view of the sword: ray-marched across its thickness for every pixel; three layers ---- */
  function* swordGen(tier, rb, res) {
    yield* masksGen(tier);
    const s = BK.px, pad = 3, W = Math.ceil(EXT * 2 * s) + pad * 2, Hh = Math.ceil((U1 - U0) * s) + pad * 2, ox = W / 2, oy = pad + U1 * s;
    const rho = RHO[rb], sr = Math.sin(rho), cr = Math.cos(rho);
    const cv = mk(W, Hh), gl = mk(W, Hh), em = mk(W, Hh), N = W * Hh;
    const Bd = new Float32Array(N * 4), Gd = new Float32Array(N), Ed = new Float32Array(N * 4), hitM = new Uint8Array(N), cov = new Float32Array(N);
    const L = nrm3([-0.32, 0.5, 0.8]), Hl = nrm3([L[0], L[1], L[2] + 1]), Lg = nrm3([0.6, -0.15, 0.78]), Hg = nrm3([Lg[0], Lg[1], Lg[2] + 1]);
    let ty = nowMs(); const due = () => nowMs() - ty > 0.7;
    // the march: the front-most |b| = Th along the ray a = x sr + tau cr, b = -x cr + tau sr (the viewer at +tau)
    function march(u, x, out) {
      if (cr < 1e-4) { const t = Th(u, x, tier); if (t <= 0) return false; out[0] = x; out[1] = t; return true; }
      let t0 = -1e9, t1 = 1e9; { const a0 = (x * cr - TMX) / sr, a1 = (x * cr + TMX) / sr; t0 = Math.max(t0, a0); t1 = Math.min(t1, a1); } { const a0 = (-EXT - x * sr) / cr, a1 = (EXT - x * sr) / cr; t0 = Math.max(t0, Math.min(a0, a1)); t1 = Math.min(t1, Math.max(a0, a1)); }
      if (t1 < t0) return false; let tau = t1, prev = t1, guard = 0;
      while (tau >= t0 && guard++ < 600) { const a = x * sr + tau * cr, b = -x * cr + tau * sr, th = Th(u, a, tier), d = Math.abs(b) - th;
        if (d <= 0 && th > 0) { let lo = tau, hi = prev; for (let k = 0; k < 7; k++) { const m = (lo + hi) / 2, a2 = x * sr + m * cr, b2 = -x * cr + m * sr; if (Math.abs(b2) - Th(u, a2, tier) <= 0) lo = m; else hi = m; } const a3 = x * sr + lo * cr, b3 = -x * cr + lo * sr; out[0] = a3; out[1] = b3; return true; }
        prev = tau; tau -= Math.max(0.0009, 0.45 * d / (sr + 1.6 * cr)); }
      return false;
    }
    const HP = [0, 0];
    function shade(u, i) {
      const a = HP[0], b = HP[1], th = Th(u, a, tier), mat = MAT, s0 = SV, rn = RN, ch = CHN, sc = SC, hv = HV, e = 0.7 / s;
      const dTa = (Th(u, a + e, tier) - Th(u, a - e, tier)) / (2 * e), dTu = (Th(u + e, a, tier) - Th(u - e, a, tier)) / (2 * e); void th;
      const sb = b >= 0 ? 1 : -1, n3 = nrm3([-dTa, sb, -dTu]);
      const n = [n3[0] * sr - n3[1] * cr, n3[2], n3[0] * cr + n3[1] * sr];   // (camera: x across the sprite, y toward the tip, z to the viewer)
      const ndl = Math.max(0, dot(n, L)), ndh = Math.max(0, dot(n, Hl)), fr = Math.pow(1 - Math.max(0, n[2]), 2.6), ndg = Math.max(0, dot(n, Hg));
      let R, G, B, sp, rim, gloss, er = 0, eg = 0, eb = 0, ea = 0;
      const nz = fbm(u * 34 + a * 9, a * 40 + 3.3), flow = fbm(u * 9 + Math.sin(a * 60) * 0.3, a * 22 + u * 4);
      if (mat === 1) {
        const rough = 0.35 + 0.65 * nz, band = sstep(0.55, 0.8, flow) * 0.6, edge = sstep(0.8, 0.98, s0), apex = sstep(0.94, 1, s0);
        R = 9 + 14 * band + 18 * edge; G = 6 + 8 * band + 14 * edge; B = 16 + 26 * band + 30 * edge;
        const dif = 0.3 + 0.7 * ndl; R *= dif; G *= dif; B *= dif;
        R *= 1 - 0.55 * ch - 0.6 * rn; G *= 1 - 0.55 * ch - 0.6 * rn; B *= 1 - 0.45 * ch - 0.6 * rn;
        sp = Math.pow(ndh, 26 + 70 * (1 - rough)) * (0.55 + 0.4 * (1 - rough)) * (1 - 0.7 * rn) + sc * 0.12 * Math.pow(ndh, 4);
        rim = fr * (0.65 + 0.5 * edge) + apex * 0.5; gloss = Math.pow(ndg, 30) * (0.7 + 0.3 * (1 - rough)) * (1 - 0.6 * ch) + apex * 0.25;
        R += sc * 16; G += sc * 12; B += sc * 22;
        if (rn > 0.05) { const k = rn * (tier ? 1 : 0.7); er = 255; eg = 45 + 120 * Math.max(0, rn - 0.6) * (tier ? 1.4 : 1); eb = 85 + 80 * Math.max(0, rn - 0.6); ea = k; }
        else if (ch > 0.05) { er = 200; eg = 24; eb = 64; ea = 0.12 * ch; }
      } else if (mat === 2) {
        const ring = hv > 0 ? Math.pow(Math.abs(Math.sin(hv * 26)), 3) : 0;
        R = 26 + 10 * nz; G = 20 + 6 * nz; B = 32 + 14 * nz; const dif = 0.28 + 0.72 * ndl; R *= dif; G *= dif; B *= dif; R *= 1 - 0.3 * ring; G *= 1 - 0.3 * ring; B *= 1 - 0.3 * ring;
        sp = Math.pow(ndh, 22) * 0.55 * (1 - 0.5 * ring); rim = fr * 0.75; gloss = Math.pow(ndg, 18) * 0.6;
      } else if (mat === 3) {
        R = 34; G = 16; B = 26; const dif = 0.35 + 0.65 * ndl; R *= dif; G *= dif; B *= dif; sp = Math.pow(ndh, 10) * 0.18; rim = fr * 0.35; gloss = Math.pow(ndg, 8) * 0.18;
      } else if (mat === 4) {
        R = 40; G = 32; B = 48; const dif = 0.3 + 0.7 * ndl; R *= dif; G *= dif; B *= dif; sp = Math.pow(ndh, 30) * 0.7; rim = fr * 0.6; gloss = Math.pow(ndg, 24) * 0.7;
      } else {
        R = 90 + 140 * ndl; G = 6 + 20 * ndl; B = 30 + 40 * ndl; sp = Math.pow(ndh, 50) * 0.9; rim = fr * 0.3; gloss = Math.pow(ndg, 40) * 0.8; er = 255; eg = 60; eb = 100; ea = 0.55 + 0.3 * (1 - fr);
      }
      R += 230 * sp + 165 * rim * 0.55; G += 215 * sp + 92 * rim * 0.55; B += 255 * sp + 255 * rim * 0.55;
      const o = i * 4; Bd[o] = R; Bd[o + 1] = G; Bd[o + 2] = B; Bd[o + 3] = 1; Gd[i] = cl(gloss); Ed[o] = er; Ed[o + 1] = eg; Ed[o + 2] = eb; Ed[o + 3] = ea;
    }
    // pass 1: the centre of every pixel
    for (let y = 0; y < Hh; y++) { const u = (oy - (y + 0.5)) / s; if (u < U0 - 0.01 || u > U1 + 0.01) continue;
      for (let x = 0; x < W; x++) { const X = (x + 0.5 - ox) / s; if (Math.abs(X) > EXT * sr + TMX * cr + 0.01) continue; if (march(u, X, HP)) { hitM[y * W + x] = 1; cov[y * W + x] = 1; shade(u, y * W + x); } if (due()) { yield 0; ty = nowMs(); } } }
    // pass 2: the silhouette's coverage (4 sub-samples on every pixel at an edge): feathered edges
    for (let y = 1; y < Hh - 1; y++) { for (let x = 1; x < W - 1; x++) { const i = y * W + x, m = hitM[i]; if (m === hitM[i - 1] && m === hitM[i + 1] && m === hitM[i - W] && m === hitM[i + W]) continue;
        let k = 0, first = -1; for (const [sx2, sy2] of [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]]) { const u = (oy - (y + 0.5 + sy2)) / s, X = (x + 0.5 + sx2 - ox) / s; if (march(u, X, HP)) { k++; if (first < 0) { first = 1; if (!m) shade(u, i); } } }
        cov[i] = k / 4; if (due()) { yield 0; ty = nowMs(); } } }
    // write: body (with its ink outline darkening the rim slightly), gloss, emissive with a soft halo (box blur)
    const g = cv.getContext('2d'), im = g.createImageData(W, Hh), d = im.data, gg = gl.getContext('2d'), gim = gg.createImageData(W, Hh), gd = gim.data, eg2 = em.getContext('2d'), eim = eg2.createImageData(W, Hh), ed = eim.data;
    ty = nowMs(); for (let i = 0; i < N; i++) { if ((i & 1023) === 0 && due()) { yield 0; ty = nowMs(); } const c = cov[i]; if (c <= 0) continue; const o = i * 4; d[o] = Bd[o]; d[o + 1] = Bd[o + 1]; d[o + 2] = Bd[o + 2]; d[o + 3] = 255 * c; gd[o] = 225; gd[o + 1] = 205; gd[o + 2] = 255; gd[o + 3] = 255 * Gd[i] * c; }
    yield 0;
    const A = new Float32Array(N), A2 = new Float32Array(N); for (let i = 0; i < N; i++) A[i] = Ed[i * 4 + 3] * cov[i];
    const rr = Math.max(2, Math.round(s * 0.012)), A3 = new Float32Array(N); ty = nowMs();
    for (const [src, dst, horiz] of [[A, A2, true], [A2, A3, false]]) for (let y = 0; y < Hh; y++) { for (let x = 0; x < W; x++) { let sum = 0, n = 0; for (let k = -rr; k <= rr; k++) { const xx = horiz ? x + k : x, yy = horiz ? y : y + k; if (xx < 0 || yy < 0 || xx >= W || yy >= Hh) continue; sum += src[yy * W + xx]; n++; } dst[y * W + x] = sum / n; } if (due()) { yield 0; ty = nowMs(); } }
    ty = nowMs(); for (let i = 0; i < N; i++) { if ((i & 1023) === 0 && due()) { yield 0; ty = nowMs(); } const o = i * 4, core = A[i], halo = A3[i] * 1.6; const a = cl(core + halo * 0.8); if (a <= 0.003) continue; const w = core / Math.max(1e-3, core + halo * 0.8);
      const r0 = core > 0 ? Ed[o] : 220, g0 = core > 0 ? Ed[o + 1] : 20, b0 = core > 0 ? Ed[o + 2] : 60; ed[o] = lerp(220, r0, w); ed[o + 1] = lerp(22, g0, w); ed[o + 2] = lerp(62, b0, w); ed[o + 3] = 255 * a; }
    g.putImageData(im, 0, 0); yield 0; gg.putImageData(gim, 0, 0); yield 0; eg2.putImageData(eim, 0, 0); yield 0;
    Object.assign(res, { cv, gl, em, s, ox, oy, W, H: Hh, rho, ready: true });
  }
  /* ---- black crystal fragments: a faceted shard with a violet rim ---- */
  function* fragGen(v, res) {
    const N = 48, cv = mk(N, N), g = cv.getContext('2d'); g.translate(N / 2, N / 2); g.lineJoin = 'round';
    const pts = [], n = 5 + v; for (let i = 0; i < n; i++) { const a = i / n * TAU + (R1(i * 3 + v) - 0.5) * 0.6, r = (i % 2 ? 12 : 20) * (0.7 + 0.5 * R1(i * 7.7 + v)) * (i === 0 ? 1.15 : 1); pts.push([Math.cos(a) * r * (v === 2 ? 0.6 : 1), Math.sin(a) * r]); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); const gr = g.createLinearGradient(-15, -20, 15, 20); gr.addColorStop(0, '#4A3466'); gr.addColorStop(0.35, '#1A0F28'); gr.addColorStop(1, '#06030A'); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 1.2; g.stroke();
    g.strokeStyle = 'rgba(208,174,255,0.5)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, 0); g.lineTo(pts[0][0], pts[0][1]); g.moveTo(0, 0); g.lineTo(pts[2][0], pts[2][1]); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(165,92,255,0.75)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(pts[n - 1][0], pts[n - 1][1]); g.lineTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.stroke();
    yield 0; Object.assign(res, { cv, ready: true });
  }

  /* ---- small effect sprites ---- */
  const radial = (g, S2, stops) => { const gr = g.createRadialGradient(S2 / 2, S2 / 2, 0, S2 / 2, S2 / 2, S2 / 2); for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(0, 0, S2, S2); };
  const mistSpr = v => fxSprite('dmb_mist' + v, 64, 64, g => { for (let i = 0; i < 6; i++) { const a = R1(i * 3 + v * 11) * TAU, d = 6 + R1(i + v) * 8, x = 32 + Math.cos(a) * d, y = 32 + Math.sin(a) * d, r = 14 + R1(i * 7 + v) * 10, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, v === 2 ? 'rgba(150,90,230,0.22)' : 'rgba(22,10,32,0.5)'); gr.addColorStop(0.6, v === 2 ? 'rgba(120,60,200,0.08)' : 'rgba(20,9,30,0.2)'); gr.addColorStop(1, 'rgba(20,9,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); } });
  const starSpr = () => fxSprite('dmb_star', 64, 64, g => { g.globalCompositeOperation = 'lighter'; radial(g, 64, [[0, 'rgba(255,255,255,1)'], [0.14, 'rgba(232,214,255,0.85)'], [0.45, 'rgba(165,92,255,0.28)'], [1, 'rgba(165,92,255,0)']]); for (let i = 0; i < 4; i++) { g.save(); g.translate(32, 32); g.rotate(i * Math.PI / 4 + 0.2); g.scale(1, i % 2 ? 0.04 : 0.07); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 31); gr.addColorStop(0, 'rgba(255,250,255,0.95)'); gr.addColorStop(1, 'rgba(165,92,255,0)'); g.fillStyle = gr; g.fillRect(-32, -32, 64, 64); g.restore(); } });
  const ringSpr = () => fxSprite('dmb_ring', 256, 256, g => radial(g, 256, [[0, 'rgba(165,92,255,0)'], [0.84, 'rgba(165,92,255,0)'], [0.9, 'rgba(120,60,220,0.35)'], [0.95, 'rgba(225,205,255,0.85)'], [0.98, 'rgba(165,92,255,0.35)'], [1, 'rgba(120,60,220,0)']]));
  const seamSpr = () => fxSprite('dmb_seam', 64, 256, g => { // (a vertical lens: a black slit with violet lips)
    for (const [w, col] of [[30, 'rgba(165,92,255,0.18)'], [18, 'rgba(165,92,255,0.45)'], [9, 'rgba(225,205,255,0.85)']]) { g.fillStyle = col; g.beginPath(); g.moveTo(32, 2); g.quadraticCurveTo(32 + w, 128, 32, 254); g.quadraticCurveTo(32 - w, 128, 32, 2); g.fill(); }
    g.fillStyle = '#05020A'; g.beginPath(); g.moveTo(32, 14); g.quadraticCurveTo(38, 128, 32, 242); g.quadraticCurveTo(26, 128, 32, 14); g.fill(); });
  const shadowSpr = () => fxSprite('dmb_horned', 160, 200, g => {   // (the Celestial's horned shadow: head, horns, shoulders; soft)
    g.translate(80, 0); const fill = (a) => { g.fillStyle = `rgba(10,4,18,${a})`; };
    for (const [k, a] of [[1.08, 0.18], [1.0, 0.55]]) { g.save(); g.scale(k, k); fill(a); g.beginPath(); g.ellipse(0, 78, 22, 25, 0, 0, TAU); g.fill();
      for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 12, 62); g.bezierCurveTo(sd * 30, 40, sd * 52, 34, sd * 58, 8); g.bezierCurveTo(sd * 46, 30, sd * 30, 46, sd * 20, 70); g.closePath(); g.fill(); }
      g.beginPath(); g.moveTo(-70, 200); g.bezierCurveTo(-64, 130, -40, 104, 0, 100); g.bezierCurveTo(40, 104, 64, 130, 70, 200); g.fill(); g.restore(); }
    g.globalCompositeOperation = 'lighter'; for (const sd of [-1, 1]) { const gr = g.createRadialGradient(sd * 9, 76, 0, sd * 9, 76, 7); gr.addColorStop(0, 'rgba(255,90,120,0.9)'); gr.addColorStop(1, 'rgba(208,24,63,0)'); g.fillStyle = gr; g.fillRect(sd * 9 - 8, 68, 16, 16); }
    g.strokeStyle = 'rgba(190,130,255,0.7)'; g.lineWidth = 2; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 12, 62); g.bezierCurveTo(sd * 30, 40, sd * 52, 34, sd * 58, 8); g.stroke(); g.beginPath(); g.arc(0, 78, 23, sd > 0 ? -1.2 : Math.PI + 0.2, sd > 0 ? -0.2 : Math.PI + 1.2); g.stroke(); g.beginPath(); g.moveTo(sd * 70, 200); g.bezierCurveTo(sd * 64, 130, sd * 40, 104, sd * 14, 101); g.stroke(); }
    g.globalCompositeOperation = 'destination-out'; const fd = g.createLinearGradient(0, 120, 0, 200); fd.addColorStop(0, 'rgba(0,0,0,0)'); fd.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = fd; g.fillRect(-80, 120, 160, 80); });
  function glowF(c, X, Y, r, col, a, gy) { if (r < 1 || !(a > 0.006)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (gy || 1); c.drawImage(glowSprite(col), X - r, Y - ry, r * 2, ry * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  const WARM = [() => shadowSpr(), () => mistSpr(0), () => mistSpr(1), () => mistSpr(2), () => starSpr(), () => ringSpr(), () => seamSpr(), () => glowSprite(EDGE), () => glowSprite(RUBY), () => glowSprite(CRIM), () => glowSprite(ACC)];

  /* ================= drawing the sword =================
     W: o (origin, the pommel end u = 0, screen), ey (screen vector of the axis, one sword length), ex (screen vector of
     the sprite's across axis, one sword length), rb (the view bucket), a, gloss, em (emissive strength), u0..u1 (the part
     drawn: forming hilt -> tip, breaking up tip -> hilt), runeU (the finisher's runes lit up to here), tier */
  function swordFrame(tier, rb) { let r = BK.spr.get(skey(tier, rb)); if (r) return r; want(skey(tier, rb), true); BK.miss++; for (let d = 1; d < RHO.length; d++) for (const q of [rb - d, rb + d]) { if (q < 0 || q >= RHO.length) continue; r = BK.spr.get(skey(tier, q)); if (r) return r; } return null; }
  function drawSword(c, Wd) {
    const spr = swordFrame(Wd.tier, Wd.rb), ex = Wd.ex, ey = Wd.ey, O = Wd.o;
    if (!spr) {   // (a fallback while the bake runs: a dark tapered blade with a violet edge)
      c.save(); c.transform(ex[0], ex[1], -ey[0], -ey[1], O[0], O[1]); const u0 = Math.max(Wd.u0, 0), u1 = Math.min(Wd.u1, 1); if (u1 <= u0) { c.restore(); return; } c.globalAlpha = Wd.a;
      c.fillStyle = '#120A1C'; c.beginPath(); c.moveTo(-0.07, Math.max(u0, 0.29)); c.lineTo(-0.055, Math.min(u1, 0.86)); c.lineTo(0, Math.min(u1, 1)); c.lineTo(0.055, Math.min(u1, 0.86)); c.lineTo(0.07, Math.max(u0, 0.29)); c.fill();
      c.fillRect(-0.16, 0.22, 0.32, 0.05); c.fillRect(-0.02, Math.max(0, u0), 0.04, 0.22); c.restore(); return; }
    const s = spr.s, rows = u => spr.oy - u * s;
    const u0 = Math.max(U0, Wd.u0), u1 = Math.min(U1, Wd.u1); if (u1 <= u0 + 0.002) return;
    const y0 = Math.max(0, Math.floor(rows(u1))), y1 = Math.min(spr.H, Math.ceil(rows(u0)));
    c.save(); c.transform(ex[0] / s, ex[1] / s, -ey[0] / s, -ey[1] / s, O[0] - ex[0] * spr.ox / s + ey[0] * spr.oy / s, O[1] - ex[1] * spr.ox / s + ey[1] * spr.oy / s);
    const lay = (img, ya, yb, a, mode) => { if (yb - ya < 0.5 || !(a > 0.004)) return; c.globalAlpha = Math.min(1, a); c.globalCompositeOperation = mode || 'source-over'; c.drawImage(img, 0, ya, spr.W, yb - ya, 0, ya, spr.W, yb - ya); };
    lay(spr.cv, y0, y1, Wd.a);
    if (Wd.gloss > 0.01) { lay(spr.gl, y0, y1, Wd.gloss * 0.6 * Wd.a, 'lighter');
      if (Wd.sheen != null) { for (let k = -2; k <= 2; k++) { const uc = Wd.sheen + k * 0.05, ya = Math.max(y0, rows(uc + 0.025)), yb = Math.min(y1, rows(uc - 0.025)); lay(spr.gl, ya, yb, Wd.gloss * Wd.a * (1 - Math.abs(k) / 2.6) * 0.9, 'lighter'); } } }
    let e = Wd.em; while (e > 0.004) { lay(spr.em, y0, y1, Math.min(1, e) * Wd.a, 'lighter'); e -= 1; }
    if (Wd.runeU > 0) { const yr = Math.max(y0, rows(Math.min(u1, Wd.runeU))); lay(spr.em, yr, y1, Wd.a * 0.9, 'lighter'); lay(spr.em, Math.max(y0, rows(Math.min(u1, Wd.runeU) + 0.004)), Math.max(y0, rows(Math.min(u1, Wd.runeU) - 0.05)), Wd.a, 'lighter'); }
    c.restore(); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  }

  /* ================= the swings (in the frame F forward to the target, N toward the viewer's side, U up) =================
     S the start direction, V a direction it sweeps toward (the plane and its sense), PH the sweep, ANT the load back
     before it, FO the follow-through past it; W wind-up, C cut, FT follow-through (s); body keys: lean (+ forward),
     sq (+ squash, - stretch), dx (lunge, pet heights) at the wind-up / the peak / the settle */
  const SW = {
    cleave:  { S: [-0.8, -0.58, 0.12], V: [0.05, 1, -0.06], PH: 3.92, ANT: 0.32, FO: 0.42, W: 0.3, C: 0.3, FT: 0.24, pz: 0.5, wnd: [-0.16, 0.28, -0.05], pk: [0.24, -0.12, 0.22], st: [0.06, 0.12, 0.1] },
    returning: { S: [0.32, -0.42, 0.85], V: [0.96, 0.22, -0.16], PH: 2.86, ANT: 0.3, FO: 0.34, W: 0.24, C: 0.25, FT: 0.2, pz: 0.56, wnd: [-0.12, -0.2, 0.0], pk: [0.3, 0.22, 0.2], st: [0.08, 0.1, 0.1] },
    rising:  { S: [0.25, 0.95, -0.16], V: [0.88, 0.0, 0.47], PH: 2.6, ANT: 0.26, FO: 0.36, W: 0.26, C: 0.27, FT: 0.22, pz: 0.44, wnd: [0.12, 0.42, 0.0], pk: [-0.1, -0.42, 0.16], st: [-0.04, 0.05, 0.08] },
    reverse: { S: [0.08, -1, 0.1], V: [1, 0.06, -0.08], PH: 3.75, ANT: 0.34, FO: 0.4, W: 0.25, C: 0.3, FT: 0.22, pz: 0.5, wnd: [0.1, 0.25, -0.04], pk: [-0.26, -0.18, 0.18], st: [-0.08, 0.12, 0.08], turnSq: 1 },
    turning: { S: [-0.95, 0.3, -0.1], V: [-0.3, -0.95, -0.1], PH: 6.15, ANT: 0.2, FO: 0.4, W: 0.22, C: 0.62, FT: 0.24, pz: 0.42, wnd: [0.0, 0.32, 0.0], pk: [0.12, 0.05, 0.1], st: [0.06, 0.15, 0.06], flips: 1 },
    descending: { S: [-0.38, -0.32, 0.87], V: [0.93, 0.24, -0.18], PH: 2.75, ANT: 0.3, FO: 0.22, W: 0.24, C: 0.25, FT: 0.14, pz: 0.6, wnd: [-0.2, -0.25, -0.04], pk: [0.34, 0.24, 0.24], st: [0.18, 0.2, 0.14] },
    finisher: { S: [-0.52, 0.04, 0.85], V: [0, 0, 1], PH: 0, ANT: 0.16, FO: 0, W: 0.62, C: 0.2, FT: 0.5, pz: 0.62, wnd: [-0.28, -0.34, -0.06], pk: [0.4, 0.55, 0.32], st: [0.2, 0.25, 0.26], hard: 1 },
  };
  const COMBO = { 3: ['cleave', 'returning', 'finisher'], 5: ['cleave', 'returning', 'rising', 'reverse', 'finisher'], 7: ['cleave', 'returning', 'rising', 'reverse', 'turning', 'descending', 'finisher'] };
  const SUMMON = 0.9, BRACE = 0.45, ENDD = 0.7, RANGE = 7, LSW = 2.85, GRIP = 0.34, TLIFE = 0.3;
  const bladeR = u => GRIP + (u - GRIPU) * LSW;   // (distance from the pivot to the point u of the sword, pet heights)

  S.demonblade = (C, h) => {
    H = h; const me = H.me, g = H.g, ev = evoOf(C), K = C.K || 1, evoK = 1 + 0.1 * (ev - 1), DK = C.base * K * evoK;
    const NS = ev >= 7 ? 7 : ev >= 4 ? 5 : 3, ORDER = COMBO[NS], TOTK = NS === 7 ? 5.0 : NS === 5 ? 3.8 : 2.6, WF = NS === 7 ? 1.8 : NS === 5 ? 1.7 : 1.6, WS = (NS - 1) + WF, tier = ev >= 7 ? 1 : 0;
    const hT = (() => { const SZ = Math.max(0.6, ((me.r || 0.3) - 0.2) / 0.1); return Math.max(0.8, Math.min(1.45, 1.02 * SZ * (g.pw && g.pw.giant ? 1.35 : 1) * (g.petK || 1))); })();
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, RES = Math.min(2, Math.max(1, dpr));
    setScale(H.X.Tz() * RES * LSW * hT); plan(tier); bakeStep(1.5);
    // (a party swap replaces the live stats object: the pet that cast is no longer the one on the field)
    const P0 = H.X.pet ? H.X.pet() : null, ST0 = H.X.ST(), swapped = () => P0 ? H.X.pet() !== P0 : H.X.ST() !== ST0,   /* (the pet on the field changed; ST alone also changes on a level-up) */ sfx = H.X.sfx, note = (...a) => sfx.note && sfx.note(...a), hiss = (...a) => sfx.hiss && sfx.hiss(...a);
    H.X.banner('DEMON BLADE', '', C.col, 1.2); me.castT = 0;
    hiss(0.6, 0.14, 380); note(98, 0.7, 'sine', 0.2, 62); note(196, 0.5, 'triangle', 0.06, 150, 0.15);
    const hold = { vx: 0, vy: 0, t: 0.12 };
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    const dbg = { swings: [], costs: [], early: false, interrupted: null, maxUpd: 0, maxDraw: 0, retargets: 0 };
    const PS = [], FREE = [], trails = [], floorFx = [], threads = [];
    const part = o => { const p = FREE.pop() || {}; p.x = 0; p.y = 0; p.z = 0; p.vx = 0; p.vy = 0; p.vz = 0; p.g = 0; p.drag = 1; p.t = 0; p.life = 1; p.s = 0.3; p.grow = 0; p.rot = Math.random() * TAU; p.vr = 0; p.v = 0; p.a = 1; p.att = null; p.path = null; Object.assign(p, o); PS.push(p); return p; };
    const kids = [];
    const F = H.add({ key: 'demonblade', life: 40, NS, ORDER, dbg, update, draw, drawUnder, onEnd() { clearPet(); for (const k of kids) k.life = 0; } });
    kids.push(H.add({ key: 'demonbladeB', life: 40, entY: me.y - 0.004, drawEnt: c => drawLayer(c, -1) }), H.add({ key: 'demonbladeF', life: 40, entY: me.y + 0.03, drawEnt: c => drawLayer(c, 1) }));
    F.dbgPh = () => ph; F.dbgK = () => k; F.dbgT0 = () => tK;

    /* ---- state ---- */
    let ph = 'summon', k = -1, tK = 0, lastT = 0, goneAt = 0, cur = null, prevPose = null, WI = 0, faceT = me.face || 1;
    const pose = { d: [0, 0, 1], n: [0, 1, 0], P: [0, 0, 0], u0: U0, u1: U0, a: 1, em: 0.35, runeU: 0, gloss: 0.6, sheen: null, ghost: 0 };
    const body = { lean: 0, sq: 0, dx: 0, arm: 0 }, bodyT = { lean: 0, sq: 0, dx: 0 };
    let pulseT = -9, flashEm = 0, depthS = 1;
    const frag = [];   // (Celestial: floating blade fragments that follow the sword)
    if (tier) for (let i = 0; i < 4; i++) frag.push({ u: 0.45 + i * 0.15, off: (i % 2 ? 1 : -1) * (0.16 + 0.04 * i), ph: i * 1.7, p: null, v: i % 3, s: 0.1 + 0.02 * (i % 2) });

    /* ---- pet hooks ---- */
    function clearPet() { me.hopLean = 0; me.hopDX = 0; me.hopDY = 0; me.hopSq = 0; me.hopArmS = null; if (me.push === hold) me.push = null; }
    function lockPet() { me.push = hold; hold.t = 0.12; hold.vx = 0; hold.vy = 0; g.normalT = Math.max(g.normalT || 0, 0.06); g.dodgeCd = Math.max(g.dodgeCd || 0, 0.06); }
    const moveBy = (dx, dy) => { if (Math.hypot(dx, dy) > 1e-4) H.X.moveEnt(me, dx, dy, 0); };

    /* ---- the frame toward a target ---- */
    let aimF = [me.face || 1, 0];
    function acquire(first) {
      const list = H.living().filter(m => valid(m) && Math.hypot(m.x - me.x, m.y - me.y) < RANGE + m.r); if (!list.length) return null;
      let best = null, bs = 1e9; for (const m of list) { let sc = Math.hypot(m.x - me.x, m.y - me.y); if (first && isFinite(C.tx) && isFinite(C.ty)) sc = 0.35 * sc + Math.hypot(m.x - C.tx, m.y - C.ty); if (sc < bs) { bs = sc; best = m; } }
      return best;
    }
    function frameOf(tg) {   // F, N in visual floor coordinates (x, d)
      let fx = aimF[0], fd = aimF[1]; if (tg) { const dx = tg.x - me.x, dd = (tg.y - me.y) / GY, l = Math.hypot(dx, dd); if (l > 0.05) { fx = dx / l; fd = dd / l; } }
      aimF = [fx, fd]; const face = Math.abs(fx) > 0.12 ? Math.sign(fx) : (me.face || 1); return { F: [fx, fd], N: [-fd * face, fx * face], face };
    }
    const toV = (fr, v) => [fr.F[0] * v[0] + fr.N[0] * v[1], fr.F[1] * v[0] + fr.N[1] * v[1], v[2]];
    function prepare(kk, t) {
      const kind = ORDER[kk], D = SW[kind], tg = acquire(kk === 0);
      if (!tg) return null;
      const fr = frameOf(tg), A = nrm3(toV(fr, D.S)), B = orth(nrm3(toV(fr, D.V)), A), Nrm = nrm3(cross(A, B));
      let PH = D.PH; if (kind === 'finisher') { // (it stops where the tip meets the floor)
        const zP = D.pz * hT, rT = bladeR(1) * hT; let th = 0.6; while (th < 3.4 && zP + rT * (A[2] * Math.cos(th) + B[2] * Math.sin(th)) > 0.04 * hT) th += 0.01; PH = th; }
      // the contact angle: where the blade is most nearly toward the target, low enough to cut it
      const Fv = toV(fr, [1, 0, 0]); let thc = PH * 0.5;
      if (!D.flips) { let bsc = -9; for (let th = 0; th <= PH; th += 0.02) { const d = nrm3([A[0] * Math.cos(th) + B[0] * Math.sin(th), A[1] * Math.cos(th) + B[1] * Math.sin(th), A[2] * Math.cos(th) + B[2] * Math.sin(th)]), sc = dot(d, Fv) - 0.6 * Math.max(0, d[2] - 0.15); if (sc > bsc) { bsc = sc; thc = th; } } }
      const dist = Math.hypot(tg.x - me.x, (tg.y - me.y) / GY), reach = bladeR(0.92) * hT * 0.82;
      const sw = { k: kk, kind, D, tg, fr, A, B, Nrm, PH, thc: Math.max(0.3, Math.min(PH + D.FO - 0.3, thc)), t0: t, hit: new Set(), n: 0, paid: false, cost: 0, dmg: TOTK * DK * (kind === 'finisher' ? WF : 1) / WS, step: Math.max(0, Math.min(0.45, dist - reach)), stepped: 0, thPrev: null, smp: [], fin: kind === 'finisher', impact: false, flips: 0, tEnd: D.W + D.C + D.FT };
      dbg.swings.push(sw); faceT = fr.face; return sw;
    }
    const dirAt = (sw, th) => nrm3([sw.A[0] * Math.cos(th) + sw.B[0] * Math.sin(th), sw.A[1] * Math.cos(th) + sw.B[1] * Math.sin(th), sw.A[2] * Math.cos(th) + sw.B[2] * Math.sin(th)]);
    // the angle in the cut + follow-through (x 0..1 over C + FT), and the finisher's hard strike
    function angleAt(sw, tau) {
      const D = sw.D; if (tau < D.W) return null;
      if (D.hard) { const u = (tau - D.W) / D.C; if (u < 1) return -D.ANT + (sw.PH + D.ANT) * Math.pow(u, 2.4); const v = tau - D.W - D.C; return sw.PH - 0.035 * Math.exp(-v * 9) * Math.sin(Math.min(Math.PI, v * 22)); }
      // accelerating to the contact angle at 55% of the cut, then decelerating through the follow-through (speed matched)
      const x = cl((tau - D.W) / (D.C + D.FT)), pc = 0.55, A1 = sw.thc + D.ANT, A2 = sw.PH + D.FO - sw.thc, p1 = 2.2, p2 = Math.max(1.2, Math.min(7, p1 * A1 * (1 - pc) / (pc * Math.max(0.05, A2))));
      return x < pc ? -D.ANT + A1 * Math.pow(x / pc, p1) : sw.thc + A2 * (1 - Math.pow(1 - (x - pc) / (1 - pc), p2));
    }
    const feet = () => [me.x + (me.hopDX || 0), (me.y + (me.hopDY || 0)) / GY, 0];
    function pivotOf(sw, pz) { const f = feet(), fr = sw ? sw.fr : frameOf(null); return [f[0] + fr.F[0] * (0.06 * hT), f[1] + fr.F[1] * (0.06 * hT), (pz || 0.5) * hT]; }
    const keyLerp = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

    /* ---- the update ---- */
    function update(dt, f) {
      const u0 = nowMs(), t = f.t; lastT = t;
      for (const kd of kids) kd.entY = me.y + (kd.key === 'demonbladeB' ? -0.004 : 0.03);
      if (ph !== 'gone' && ph !== 'break' && (me.dead || swapped())) { dbg.interrupted = me.dead ? 'death' : 'swap'; clearPet(); shatter(t, true); }
      if (ph === 'gone') { stepParts(dt, t); if (!PS.length && t > goneAt + 0.25) f.life = 0; return endFrame(dt, t, u0); }
      if (ph === 'break') { stepParts(dt, t); const u = (t - tK) / 0.35; pose.u1 = lerp(1, U0, sm(u)); spawnBreak(dt); if (u >= 1) { ph = 'gone'; goneAt = t; } return endFrame(dt, t, u0); }
      lockPet();
      const tau = t - tK; let lean = 0, sq = 0, dx = 0;
      if (ph === 'summon') {
        if (!cur) { cur = prepare(0, t); if (!cur) { dbg.early = true; ph = 'break'; tK = t; pose.u1 = U0; return endFrame(dt, t, u0); } me.face = cur.fr.face; }
        const fr = cur.fr, f0 = feet(), P = [f0[0] + fr.F[0] * 0.62 * hT - fr.N[0] * 0.4 * hT, f0[1] + fr.F[1] * 0.62 * hT - fr.N[1] * 0.4 * hT, 0.2 * hT];
        pose.P = P; pose.d = nrm3(toV(fr, [0.1, 0.05, 1])); pose.n = orth(VV, pose.d); pose.grip = 0;
        const uf = cl((tau / SUMMON - 0.24) / 0.56); pose.u0 = U0; pose.u1 = lerp(U0, U1, uf); pose.em = 0.25 + 0.5 * flashEm; pose.a = 1;
        lean = -0.06 * sm(tau / 0.3); sq = 0.06 * sm(tau / 0.3);
        summonFx(dt, t, tau);
        if (tau >= SUMMON) { ph = 'brace'; tK = t; prevPose = { d: pose.d, n: pose.n, P: pose.P.slice() }; note(110, 0.18, 'triangle', 0.16, 70); sfx.thud && sfx.thud(); }
      } else if (ph === 'brace') {
        const u = cl(tau / BRACE), e = sm(u), sw = cur, tgt = dirAt(sw, -sw.D.ANT * 0.6), P1 = pivotOf(sw, sw.D.pz);
        pose.d = slerp(prevPose.d, tgt, e); pose.n = orth(slerp(prevPose.n, sw.Nrm, e), pose.d); pose.P = keyLerp(prevPose.P, P1, e); pose.grip = e; pose.u1 = U1;
        const wob = Math.exp(-7 * tau) * Math.sin(tau * 19); sq = 0.42 * sstep(0, 0.35, u) - 0.1 * wob + 0.15 * (1 - u); lean = -0.14 * e + 0.08 * wob; dx = -0.04 * e;
        if (tau >= BRACE) { ph = 'swing'; k = 0; tK = t; cur.t0 = t; prevPose = { d: pose.d, n: pose.n, P: pose.P.slice() }; swingStart(cur); }
      } else if (ph === 'swing') {
        const sw = cur, D = sw.D;
        if (!valid(sw.tg) && tau < D.W) { const m = acquire(false); if (m) { sw.tg = m; dbg.retargets++; } }
        // the step toward a distant target (a real move, during the wind-up)
        if (sw.step > 0 && tau < D.W) { const want2 = sw.step * sm(tau / D.W) - sw.stepped; if (want2 > 1e-3) { const fr = sw.fr; moveBy(fr.F[0] * want2, fr.F[1] * GY * want2); sw.stepped += want2; } }
        const th = angleAt(sw, tau), P1 = pivotOf(sw, D.pz);
        if (th == null) {   // wind-up: from the last pose to the start, then loading back past it
          const u = tau / D.W, e1 = sm(u / 0.72), d1 = dirAt(sw, -D.ANT * 0.45), d2 = dirAt(sw, -D.ANT);
          pose.d = u < 0.72 ? slerp(prevPose.d, d1, e1) : slerp(d1, d2, 1 - Math.pow(1 - (u - 0.72) / 0.28, 2)); pose.n = orth(slerp(prevPose.n, sw.Nrm, sm(u / 0.6)), pose.d); pose.P = keyLerp(prevPose.P, P1, sm(u / 0.6));
          const kw = sm(u); lean = lerp(body.leanEnd || 0, D.wnd[0], kw); sq = lerp(body.sqEnd || 0, D.wnd[1], kw); dx = lerp(body.dxEnd || 0, D.wnd[2], kw);
          if (sw.fin) finWind(dt, t, u);
        } else {
          pose.d = dirAt(sw, th); pose.n = sw.Nrm; pose.P = P1;
          const prev = sw.thPrev == null ? -D.ANT : sw.thPrev, om = dt > 0 ? (th - prev) / dt : 0; sw.om = om;
          if (!sw.whoosh) { sw.whoosh = true; hiss(0.3, sw.fin ? 0.3 : 0.22, sw.fin ? 420 : 700); note(sw.fin ? 70 : 92, 0.28, 'sine', 0.2, sw.fin ? 36 : 52); sfx.whoosh && sfx.whoosh(); }
          cutHits(sw, prev, th, t);
          if (!sw.smp.length || th > sw.smp[sw.smp.length - 1].th + 1e-4) sw.smp.push({ th, t, w: cl((Math.abs(om) - 1.5) / 15) * 0.6 + 0.035 }); sw.thPrev = th;
          // the body: into the cut (peak at the fastest), then the settle
          const x = cl((tau - D.W) / (D.hard ? D.C : D.C + D.FT)), pkx = D.hard ? 1 : 0.55, kin = sm(x / pkx), kout = D.hard ? sm((tau - D.W - D.C) / D.FT) : sm((x - pkx) / (1 - pkx));
          lean = lerp(lerp(D.wnd[0], D.pk[0], kin), D.st[0], kout); sq = lerp(lerp(D.wnd[1], D.pk[1], kin), D.st[1], kout); dx = lerp(lerp(D.wnd[2], D.pk[2], kin), D.st[2], kout);
          if (D.hard && !sw.impact && tau >= D.W + D.C) finImpact(sw, t);
          if (D.hard && sw.impact) { const v = t - sw.impT; sq = D.pk[1] * Math.exp(-6 * v) * Math.cos(14 * v) + D.st[1] * (1 - Math.exp(-6 * v)); }
          if (D.turnSq) sq -= 0.35 * Math.exp(-Math.pow((x - 0.45) / 0.12, 2));
          if (D.flips) { for (const fx0 of [0.3, 0.62]) { sq -= 0.55 * Math.exp(-Math.pow((x - fx0) / 0.06, 2)); if (sw.flips < (fx0 === 0.3 ? 1 : 2) && x >= fx0) { sw.flips++; me.face = -(me.face || 1); } } }
          if (tau >= sw.tEnd) { if (D.flips && sw.flips % 2) me.face = -(me.face || 1); swingEnd(sw, t, lean, sq, dx); }
        }
        if (Math.abs(sw.fr.F[0]) > 0.12 && !D.flips) me.face = sw.fr.face;
      } else if (ph === 'end') {
        const u = cl(tau / ENDD); pose.u1 = lerp(U1, U0, sstep(0.12, 0.92, u)); spawnBreak(dt);
        lean = (body.leanEnd || 0) * (1 - sm(u / 0.5)); sq = (body.sqEnd || 0) * (1 - sm(u / 0.4)) - 0.2 * Math.exp(-5 * tau) * Math.sin(tau * 14) * sstep(0.1, 0.3, u); dx = (body.dxEnd || 0) * (1 - sm(u / 0.6));
        if (tau >= ENDD) { clearPet(); ph = 'gone'; goneAt = t; pose.u1 = U0; }
      }
      if (ph !== 'gone' && ph !== 'break') applyPet(dt, lean, sq, dx);
      // the emissive: idle pulse, the payment pulse, the summon's lock flashes
      const pz = t - pulseT; pose.em = (tier ? 0.55 : 0.4) + 0.12 * Math.sin(t * 5.5) + (pz < 0.6 ? 1.1 * Math.exp(-pz * 6) * sstep(0, 0.04, pz) : 0) + flashEm; flashEm = Math.max(0, flashEm - dt * 3);
      stepParts(dt, t);
      endFrame(dt, t, u0);
    }
    function applyPet(dt, lean, sq, dx) {
      const kk = Math.min(1, dt * 28); body.lean += (lean - body.lean) * kk; body.sq += (sq - body.sq) * Math.min(1, dt * 40); body.dx += (dx - body.dx) * kk;
      const fr = cur ? cur.fr : frameOf(null), lx = (me.face || 1) * (0.55 + 0.45 * Math.abs(fr.F[0]));
      me.hopLean = body.lean * lx * 1.3; me.hopSq = body.sq; me.hopDX = fr.F[0] * body.dx * hT; me.hopDY = fr.F[1] * GY * body.dx * hT;
      // both hands on the grip: the arms aimed at the hilt (screen), as the rig turns them (0 down, - forward)
      const T = H.X.Tz(), hp = handPt(), sh = scr([feet()[0], feet()[1], 0.45 * hT], T), ddx = hp[0] - sh[0], ddy = hp[1] - sh[1];
      if (ph === 'summon' && pose.u1 < 0.2) { me.hopArmS = null; return; }
      let a = Math.atan2(-ddx * (me.face || 1), ddy) * 180 / Math.PI; if (!isFinite(a)) a = 0;
      const wA = ph === 'summon' ? sstep(0.2, 0.6, pose.u1) : 1; a *= wA; body.arm += (a - body.arm) * Math.min(1, dt * 30); me.hopArmS = [body.arm, body.arm * 0.92 + 6];
    }
    function swingStart(sw) { const D = sw.D; hiss(D.W * 0.8, 0.07, 300); if (sw.fin) { hiss(0.5, 0.1, 240); note(70, 0.6, 'sine', 0.16, 110); } }
    function swingEnd(sw, t, lean, sq, dx) {
      sw.done = true; prevPose = { d: pose.d, n: pose.n, P: pose.P.slice() }; body.leanEnd = lean; body.sqEnd = sq; body.dxEnd = dx;
      k++; if (k >= NS) { ph = 'end'; tK = t; hiss(0.5, 0.12, 520); note(150, 0.45, 'sine', 0.12, 90); return; }
      const nx = prepare(k, t); if (!nx) { dbg.early = true; ph = 'end'; tK = t; return; }
      cur = nx; tK = t; swingStart(nx);
    }
    function shatter(t, quick) { ph = 'break'; tK = t; if (quick) for (const tr of trails) tr.dead = true; }

    /* ---- the cut's hits: the blade sampled between last frame's angle and this one's ---- */
    function cutHits(sw, th0, th1, t) {
      const D = sw.D, lo = -0.05, hi = sw.PH + (D.hard ? 0 : D.FO * 0.35); if (th1 <= lo || th0 >= hi || Math.abs(th1 - th0) < 1e-5) return;
      const fast = D.hard ? true : Math.abs(sw.om || 0) > 3; if (!fast) return;
      const a0 = Math.max(lo, th0), a1 = Math.min(hi, th1), nsub = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 0.07)), P = pose.P, mons = H.living();
      for (let i = 1; i <= nsub; i++) { const th = lerp(a0, a1, i / nsub), d = dirAt(sw, th);
        for (let j = 0; j < 9; j++) { const uu = 0.3 + 0.7 * j / 8, r = bladeR(uu) * hT, px = P[0] + d[0] * r, pd = P[1] + d[1] * r, pz = P[2] + d[2] * r, wy = pd * GY;
          for (const m of mons) { if (sw.hit.has(m) || !valid(m)) continue; const top = 0.45 + 2.2 * (m.r || 0.35); if (pz > top || pz < -0.6) continue; if (Math.hypot(px - m.x, wy - m.y) <= (m.r || 0.35) + 0.18) strike(sw, m, [px, pd, Math.max(0.15, Math.min(pz, top * 0.6))], t); } } }
    }
    function strike(sw, m, at, t) {
      sw.hit.add(m); const dealt = H.X.hitMon(m, sw.dmg, C.dmgO()); if (!(dealt > 0)) return; sw.n++;
      if (!sw.paid) { sw.paid = true; const max = H.X.ST().hp, before = me.hp, cost = 0.02 * max; me.hp = Math.max(Math.min(before, 1), before - cost); if (!(me.hp >= 1) && before >= 1) me.hp = 1; sw.cost = before - me.hp; dbg.costs.push({ k: sw.k, cost: sw.cost, want: cost, hp: me.hp }); pulseT = t; threads.push({ t0: t });
        if (sw.cost > 0.5 && H.X.text) H.X.text(me.x, me.y - 1.25 * hT, '-' + Math.round(sw.cost), RUBY, 11);
        note(55, 0.22, 'sine', 0.3, 38); note(620, 0.12, 'sine', 0.05, 880, 0.04);
        H.X.hitstop(sw.fin ? 0.07 : 0.035); if (!RM()) H.X.shake(sw.fin ? 6 : 2.5, sw.fin ? 0.2 : 0.1); }
      impactFx(m, at, sw, t); note(48 + 6 * R1(t), 0.16, 'sine', 0.38, 32);
    }

    /* ---- effects: summon, impacts, finisher, breaking up ---- */
    function summonFx(dt, t, tau) {
      if (!F.sumInit) { F.sumInit = true; const n = H.n(26); for (let i = 0; i < n; i++) { const uT = U0 + (U1 - U0) * (i + 0.5) / n; part({ k: 'xtal', life: SUMMON + 0.05, s: 0.1 + 0.06 * R1(i * 3.1) + (uT < 0.35 ? 0.03 : 0), uT, side: (R1(i * 5.7) - 0.5) * 0.9, t1: SUMMON * (0.24 + 0.56 * (uT - U0) / (U1 - U0)) + 0.02, t0: 0.08 + 0.12 * R1(i * 2.3), v: i % 3, src: R1(i * 9.1) }); } }
      // the section locks: runes flare as each section is complete
      for (const uq of [0.2, 0.3, 0.62, 1.0]) { const tq = SUMMON * (0.24 + 0.56 * (uq - U0) / (U1 - U0)); if (tau >= tq && tau - dt < tq) { flashEm = 1.2; note(240 + uq * 260, 0.12, 'triangle', 0.08, 200 + uq * 200); for (let i = 0; i < H.n(4); i++) { const p = swordPt(uq, (R1(i + uq * 9) - 0.5) * 0.2); part({ k: 'ember', x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5), vz: 0.8 + Math.random(), drag: 2, life: 0.5, s: 0.06 }); } } }
      if (tau < 0.05 && tau + dt >= 0) { hiss(0.3, 0.16, 900); }
      if (Math.random() < dt * 40 * H.Q() && tau < 0.7) { const p = swordPt(lerp(U0, U1, Math.random()), 0); part({ k: 'mist', x: p[0] + (Math.random() - 0.5) * 0.4, y: p[1], z: Math.random() * 1.6 * hT, vx: (Math.random() - 0.5) * 0.6, vy: 0, vz: 0.3, drag: 1.5, life: 0.6, s: 0.25, grow: 0.8, v: Math.random() < 0.3 ? 2 : 0, a: 0.6 }); }
    }
    function swordPt(u, across) { const r = (u - GRIPU) * LSW * hT, d = pose.d, P = hiltPt(); const t2 = cross(pose.n, d); return [P[0] + d[0] * r + t2[0] * across * LSW * hT, P[1] + d[1] * r + t2[1] * across * LSW * hT, P[2] + d[2] * r + t2[2] * across * LSW * hT]; }
    function hiltPt() { const P = pose.P, d = pose.d, gq = ph === 'summon' ? 0 : GRIP * hT * (pose.grip == null ? 1 : lerp(0, 1, pose.grip)); return [P[0] + d[0] * gq, P[1] + d[1] * gq, P[2] + d[2] * gq]; }
    function impactFx(m, at, sw, t) {
      const n = H.n(sw.fin ? 9 : 6), tg = sw.om ? Math.sign(sw.om) : 1, tv = cross(sw.Nrm, pose.d);   // (the blade's motion)
      part({ k: 'flash', x: at[0], y: at[1], z: at[2], life: 0.16, s: sw.fin ? 0.9 : 0.62 });
      part({ k: 'ripple', x: at[0], y: at[1], z: at[2], life: 0.3, s: sw.fin ? 1.5 : 1.05 });
      for (let i = 0; i < n; i++) { const sp = 4 + Math.random() * 5, jx = (Math.random() - 0.5) * 0.7, jy = (Math.random() - 0.5) * 0.7, jz = (Math.random() - 0.5) * 0.7; part({ k: 'spk', x: at[0], y: at[1], z: at[2], vx: (tv[0] * tg + jx) * sp, vy: (tv[1] * tg + jy) * sp, vz: (tv[2] * tg + jz) * sp + 1, g: 6, drag: 3, life: 0.2 + Math.random() * 0.14, s: 0.16 + Math.random() * 0.1, v: i % 3 }); }
      for (let i = 0; i < H.n(3); i++) part({ k: 'mist', x: at[0], y: at[1], z: at[2], vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 1.6, vz: 0.4, drag: 2.5, life: 0.5, s: 0.32, grow: 1, v: i === 0 ? 2 : 0, a: 0.7 });
      floorFx.push({ k: 'lit', x: at[0], y: at[1], t0: t, life: 0.35, r: sw.fin ? 1.8 : 1.15, m });
      if (H.X.light) H.X.light(m.x, m.y, sw.fin ? 2.6 : 1.7, sw.fin ? 0.32 : 0.2);
    }
    function finWind(dt, t, u) {   // the raised sword draws the smoke in; the runes light hilt -> tip
      pose.runeU = lerp(0.2, 1.0, sstep(0.25, 0.92, u));
      if (Math.random() < dt * 55 * H.Q() && u < 0.92) { const a = Math.random() * TAU, rr = (1.4 + Math.random() * 1.2) * hT, f0 = feet(); part({ k: 'mist', x: f0[0] + Math.cos(a) * rr, y: f0[1] + Math.sin(a) * rr, z: Math.random() * 0.8 * hT, att: Math.random(), life: 0.7, s: 0.28, grow: -0.4, v: Math.random() < 0.25 ? 2 : Math.random() < 0.5 ? 0 : 1, a: 0.75 }); }
      if (tier) pose.ghost = sstep(0.15, 0.6, u);
      if (u > 0.5 && !F.finNote) { F.finNote = true; note(82, 0.5, 'sawtooth', 0.05, 160); hiss(0.4, 0.1, 1800); }
    }
    function finImpact(sw, t) {
      sw.impact = true; sw.impT = t; const tip = swordPt(1, 0), fr = sw.fr, fl = [tip[0], tip[1], 0];
      // the fissure: jagged, along the strike, with branches (light only, fading)
      const pts = [], L = 2.8 * hT, n = 14; let off = 0; for (let i = 0; i <= n; i++) { const v = i / n; off += (Math.random() - 0.5) * 0.28 * hT; off *= 0.8; pts.push([fl[0] - fr.F[0] * 0.7 * hT + fr.F[0] * L * v + fr.N[0] * off, fl[1] - fr.F[1] * 0.7 * hT + fr.F[1] * L * v + fr.N[1] * off]); }
      const br = []; for (let b = 0; b < 3; b++) { const i0 = 3 + b * 3, sd = b % 2 ? 1 : -1, p0 = pts[i0], q = [p0]; let x = p0[0], y = p0[1]; for (let j = 0; j < 4; j++) { const a = Math.atan2(fr.F[1], fr.F[0]) + sd * (0.7 + Math.random() * 0.4); x += Math.cos(a) * 0.22 * hT + (Math.random() - 0.5) * 0.1; y += Math.sin(a) * 0.22 * hT; q.push([x, y]); } br.push(q); }
      floorFx.push({ k: 'fis', pts, br, t0: t, life: 1.6 }); floorFx.push({ k: 'lit', x: fl[0], y: fl[1], t0: t, life: 0.6, r: 2.6 });
      // the directional eruption of darkness, spectral fragments rising into embers
      for (let i = 0; i < H.n(18); i++) { const a = Math.atan2(fr.F[1], fr.F[0]) + (Math.random() - 0.5) * 1.1, v = (2.5 + Math.random() * 4) * hT, at = 0.4 + Math.random() * 1.8; part({ k: 'mist', x: fl[0] + Math.cos(a) * at * 0.5, y: fl[1] + Math.sin(a) * at * 0.5, z: 0.1, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 1 + Math.random() * 2.5, drag: 2.6, life: 0.7 + Math.random() * 0.4, s: 0.42 + Math.random() * 0.2, grow: 1.3, v: i % 4 === 0 ? 2 : i % 2, a: 0.85 }); }
      for (let i = 0; i < H.n(8); i++) { const a = Math.atan2(fr.F[1], fr.F[0]) + (Math.random() - 0.5) * 0.7; part({ k: 'jet', x: fl[0], y: fl[1], z: 0.15, vx: Math.cos(a) * (6 + Math.random() * 4), vy: Math.sin(a) * (6 + Math.random() * 4), vz: 2 + Math.random() * 3, drag: 3, life: 0.35, s: 0.5 }); }
      for (let i = 0; i < H.n(10); i++) { const a = Math.random() * TAU, d = Math.random() * 1.2 * hT; part({ k: 'spec', x: fl[0] + Math.cos(a) * d, y: fl[1] + Math.sin(a) * d * 0.7, z: 0.05, vx: Math.cos(a) * 0.4, vy: Math.sin(a) * 0.3, vz: 1.2 + Math.random() * 1.4, drag: 0.8, life: 0.9 + Math.random() * 0.5, s: 0.13 + Math.random() * 0.08, v: i % 3, vr: (Math.random() - 0.5) * 4 }); }
      part({ k: 'ripple', x: fl[0], y: fl[1], z: 0.1, life: 0.45, s: 2.4, floor: 1 }); part({ k: 'flash', x: fl[0], y: fl[1], z: 0.2, life: 0.2, s: 1.3 });
      note(40, 0.8, 'sine', 0.7, 24); sfx.crash && sfx.crash(); sfx.stomp && sfx.stomp(); hiss(0.7, 0.24, 200);
      if (!sw.paid) { H.X.hitstop(0.05); if (!RM()) H.X.shake(5, 0.18); }
      if (H.X.light) H.X.light(fl[0], fl[1] * GY, 3, 0.35);
    }
    function spawnBreak(dt) {   // black crystal fragments peel from the dissolving front
      if (pose.u1 <= U0 + 0.01) return; const n = Math.random() < dt * 55 * H.Q() ? 2 : 0;
      for (let i = 0; i < n; i++) { const p = swordPt(pose.u1 - 0.02, (Math.random() - 0.5) * 0.12); part({ k: 'frag', x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 1.4, vy: (Math.random() - 0.5) * 0.8, vz: 0.4 + Math.random() * 0.9, g: 0.6, drag: 1.2, life: 0.8 + Math.random() * 0.4, s: 0.07 + Math.random() * 0.06, v: i % 3, vr: (Math.random() - 0.5) * 6 }); if (Math.random() < 0.5) part({ k: 'ember', x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5), vy: 0, vz: 0.6, drag: 1.5, life: 0.5, s: 0.05 }); }
    }

    function endFrame(dt, t, u0) {
      if (WI < WARM.length && t > 0.02) { const t0 = nowMs(); while (WI < WARM.length && nowMs() - t0 < 0.5) WARM[WI++](); }
      if (BK.queue.length || BK.job) { const sync = typeof window !== 'undefined' && window.__dmbSync; bakeStep(sync ? 1e4 : BK.miss > 0 ? 1.6 : 1.1); BK.miss = 0; }
      const du = nowMs() - u0; if (du > dbg.maxUpd) dbg.maxUpd = du;
    }
    function stepParts(dt, t) {
      const hp = hiltPt(), d = pose.d;
      for (let i = PS.length - 1; i >= 0; i--) { const p = PS[i]; p.t += dt; if (p.t >= p.life) { PS[i] = PS[PS.length - 1]; PS.pop(); FREE.push(p); continue; }
        if (p.k === 'xtal') { continue; }
        if (p.att != null && ph === 'swing') { const r = (0.3 + 0.7 * p.att) * (LSW - GRIPU * LSW) * hT, tx = hp[0] + d[0] * r, ty = hp[1] + d[1] * r, tz = hp[2] + d[2] * r, k2 = Math.min(1, dt * 4.5); p.vx += (tx - p.x) * k2 * 6; p.vy += (ty - p.y) * k2 * 6; p.vz += (tz - p.z) * k2 * 6; p.vx *= 0.86; p.vy *= 0.86; p.vz *= 0.86; }
        const dg = Math.exp(-p.drag * dt); p.vx *= dg; p.vy *= dg; p.vz = p.vz * dg - p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.25; } }
      // trails: the cut's samples, aged; smoke wisps peel from the oldest
      if (cur && !cur.trail && cur.smp.length) { cur.trail = { sw: cur, smp: cur.smp, P: null }; trails.push(cur.trail); }
      for (let i = trails.length - 1; i >= 0; i--) { const tr = trails[i]; if (!tr.sw.done) tr.P = pose.P.slice(); while (tr.smp.length && t - tr.smp[0].t > TLIFE) tr.smp.shift();
        for (const s2 of tr.smp) if (!s2.wisp && t - s2.t > 0.1) { s2.wisp = true; if (s2.w > 0.12 && Math.random() < 0.45 * H.Q()) { const dd = dirAt(tr.sw, s2.th), r = (bladeR(1) - s2.w * LSW * 0.5) * hT, P = tr.P || pose.P; part({ k: 'mist', x: P[0] + dd[0] * r, y: P[1] + dd[1] * r, z: Math.max(0.05, P[2] + dd[2] * r), vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.4, vz: 0.35, drag: 1.2, life: 0.55 + Math.random() * 0.3, s: 0.22, grow: 1.1, v: Math.random() < 0.7 ? 0 : 1, a: 0.55 }); } }
        if ((tr.sw.done || tr.dead) && !tr.smp.length) trails.splice(i, 1); else if (tr.dead) tr.smp.length = 0; }
      // obsidian fragments flung from the tip on the fastest cuts, and the floating fragments (Celestial)
      if (ph === 'swing' && cur && Math.abs(cur.om || 0) > 9 && Math.random() < dt * 14 * H.Q()) { const p = swordPt(0.9 + Math.random() * 0.1, 0), tv = cross(cur.Nrm, pose.d), sg = Math.sign(cur.om); part({ k: 'frag', x: p[0], y: p[1], z: p[2], vx: tv[0] * sg * 3 + (Math.random() - 0.5), vy: tv[1] * sg * 3, vz: tv[2] * sg * 3 + 1, g: 7, drag: 1, life: 0.5, s: 0.06 + Math.random() * 0.04, v: Math.floor(Math.random() * 3), vr: (Math.random() - 0.5) * 12 }); }
      if (tier) for (const q of frag) { const w = swordPt(q.u, q.off + 0.02 * Math.sin(t * 2 + q.ph)); if (!q.p) q.p = w.slice(); else { const k2 = Math.min(1, dt * 9); for (let j = 0; j < 3; j++) q.p[j] += (w[j] - q.p[j]) * k2; } }
      for (let i = floorFx.length - 1; i >= 0; i--) if (t - floorFx[i].t0 > floorFx[i].life) floorFx.splice(i, 1);
      for (let i = threads.length - 1; i >= 0; i--) if (t - threads[i].t0 > 0.45) threads.splice(i, 1);
      if (ph === 'swing' && cur && !cur.fin) pose.runeU = Math.max(0, pose.runeU - dt * 2); if (pose.ghost > 0 && !(ph === 'swing' && cur && cur.fin)) pose.ghost = Math.max(0, pose.ghost - dt * 3);
      if (cur && cur.fin && cur.impact) pose.ghost = Math.max(0, 1 - (t - cur.impT) / 0.35) * (tier ? 1 : 0);
    }

    /* ---- drawing ---- */
    const scr = (p, T) => [H.sx(p[0]), H.sy(p[1] * GY) + 0.18 * T - p[2] * T];
    const prj = (v, T) => [v[0] * T, (v[1] * GY - v[2]) * T];
    function handPt() { return scr(hiltPt(), H.X.Tz()); }
    function swordView(T, d, n, scale) {   // the view bucket and the across vector, from the 3D axis and flat normal
      let nn = n, tt = cross(n, d); const vn = dot(VV, nn); if (vn < 0) nn = [-nn[0], -nn[1], -nn[2]]; let vt = dot(VV, tt); if (vt < 0) { tt = [-tt[0], -tt[1], -tt[2]]; vt = -vt; }
      const rho = Math.atan2(Math.abs(vn), vt); let rb = 0, bd = 9; RHO.forEach((r, i) => { const q = Math.abs(r - rho); if (q < bd) { bd = q; rb = i; } });
      const rr = RHO[rb], sr = Math.sin(rr), cr = Math.cos(rr), ex3 = [sr * tt[0] - cr * nn[0], sr * tt[1] - cr * nn[1], sr * tt[2] - cr * nn[2]];
      const kW = (Math.sin(rho) + 0.3 * Math.cos(rho)) / (sr + 0.3 * cr), Ls = LSW * hT * (scale || 1), ex = prj(ex3, T), ey = prj(d, T);
      return { rb, ex: [ex[0] * Ls * kW, ex[1] * Ls * kW], ey: [ey[0] * Ls, ey[1] * Ls], rho };
    }
    function swordDepth() { const m = swordPt(0.55, 0), f = feet(); return m[1] - f[1]; }
    function drawLayer(c, side) {
      if (ph === 'gone') return; const d0 = nowMs(), T = H.X.Tz(), t = lastT;
      const dep = swordDepth(); if (Math.abs(dep) > 0.08 * hT) depthS = dep > 0 ? 1 : -1;
      if (side < 0) {
        if (ph === 'summon') drawSeam(c, T, t - tK);
        if (pose.ghost > 0.01) drawGhost(c, T);
      }
      const q0 = nowMs(); for (const tr of trails) drawTrail(c, tr, T, t, side); const q1 = nowMs();
      if (depthS === side) drawBlade(c, T, t); const q2 = nowMs(); dbg.trMax = Math.max(dbg.trMax || 0, q1 - q0); dbg.blMax = Math.max(dbg.blMax || 0, q2 - q1);
      const dd = nowMs() - d0; if (dd > dbg.maxDraw) dbg.maxDraw = dd;
    }
    function drawBlade(c, T, t) {
      const hp = hiltPt(), O3 = [hp[0] - pose.d[0] * GRIPU * LSW * hT, hp[1] - pose.d[1] * GRIPU * LSW * hT, hp[2] - pose.d[2] * GRIPU * LSW * hT], O = scr(O3, T), V = swordView(T, pose.d, pose.n);
      if (ph === 'summon') { for (const p of PS) if (p.k === 'xtal') drawXtal(c, p, T, t); }
      const Lw = nrm3([-0.4, 0.3, 0.85]), Hv = nrm3([Lw[0] + VV[0], Lw[1] + VV[1], Lw[2] + VV[2]]), nf = dot(pose.n, VV) < 0 ? [-pose.n[0], -pose.n[1], -pose.n[2]] : pose.n, gl = 0.25 + 0.9 * Math.pow(Math.abs(dot(nf, Hv)), 6);
      const sheen = cur && ph === 'swing' && cur.om ? lerp(0.3, 1.0, ((t * 2.2) % 1)) : null;
      // a dark contact bloom round the blade (keeps it readable on dark floors), the sword
      glowF(c, O[0] + V.ey[0] * 0.6, O[1] + V.ey[1] * 0.6, T * hT * 0.9, EDGE, 0.06 * pose.a);
      drawSword(c, { tier, rb: V.rb, o: O, ex: V.ex, ey: V.ey, a: pose.a, gloss: gl, sheen, em: pose.em, u0: pose.u0, u1: pose.u1, runeU: pose.runeU });
      // the grip's tether: violet light where the paws hold it
      if (ph !== 'summon' || pose.u1 > 0.2) { const H2 = scr(hp, T); glowF(c, H2[0], H2[1], T * 0.32, EDGE, 0.28); glowF(c, H2[0], H2[1], T * 0.12, ACC, 0.35); }
      // the dissolving / forming front
      if (pose.u1 < U1 - 0.01 && pose.u1 > U0 + 0.01) { const p = scr(swordPt(pose.u1, 0), T); glowF(c, p[0], p[1], T * 0.38, EDGE, 0.45); glowF(c, p[0], p[1], T * 0.14, '#FFFFFF', 0.4); }
      // Celestial: the floating fragments
      if (tier && pose.u1 > 0.8) { for (const q of frag) { if (!q.p) continue; const fr2 = BK.spr.get('FR' + q.v), P = scr(q.p, T), r = T * q.s * hT; c.save(); c.translate(P[0], P[1]); c.rotate(t * 1.5 + q.ph); c.globalAlpha = 0.9 * pose.a; if (fr2) c.drawImage(fr2.cv, -r, -r, r * 2, r * 2); c.restore(); glowF(c, P[0], P[1], r * 1.8, EDGE, 0.2); } c.globalAlpha = 1; }
    }
    function drawXtal(c, p, T, t) {   // the assembly: a crystal shard flying out of the seam to its place on the forming sword
      const tau = t - tK, u = cl((tau - p.t0) / (p.t1 - p.t0)); if (u <= 0 || u >= 1) return; const fr = cur.fr, P = pose.P, sd = (p.src - 0.5) * 1.2 * hT;
      const A = [P[0] + fr.N[0] * 0.05, P[1] + fr.N[1] * 0.05, 0.2 * hT + p.src * 1.6 * hT], tgt = swordPt(p.uT, p.side * 0.12), mid = [lerp(A[0], tgt[0], 0.5) + fr.N[0] * sd * 0.6 + fr.F[0] * 0.5 * hT, lerp(A[1], tgt[1], 0.5) + fr.N[1] * sd * 0.6 + fr.F[1] * 0.5 * hT, lerp(A[2], tgt[2], 0.5) + 0.2 * hT];
      const e = 1 - Math.pow(1 - u, 2.2), q = [0, 1, 2].map(j => (1 - e) * (1 - e) * A[j] + 2 * (1 - e) * e * mid[j] + e * e * tgt[j]), S2 = scr(q, T), fr2 = BK.spr.get('FR' + p.v), r = T * p.s * hT * (0.6 + 0.4 * sm(u * 3));
      c.save(); c.translate(S2[0], S2[1]); c.rotate(p.rot + u * 6); c.globalAlpha = sm(u * 5); if (fr2) c.drawImage(fr2.cv, -r, -r, r * 2, r * 2); else { c.fillStyle = '#140A20'; c.fillRect(-r * 0.4, -r * 0.6, r * 0.8, r * 1.2); } c.restore(); c.globalAlpha = 1;
      if (u > 0.85) glowF(c, S2[0], S2[1], T * 0.25, RUBY, 0.4 * (u - 0.85) / 0.15);
    }
    function drawSeam(c, T, tau) {
      const k = sstep(0, 0.2, tau) * (1 - sstep(0.72, 0.95, tau / SUMMON)); if (k < 0.01 || !cur) return; const fr = cur.fr, P = pose.P;
      const bot = scr([P[0] + fr.F[0] * 0.25 * hT, P[1] + fr.F[1] * 0.25 * hT, 0.0], T), top = scr([P[0] + fr.F[0] * 0.25 * hT, P[1] + fr.F[1] * 0.25 * hT, 2.0 * hT], T), hgt = bot[1] - top[1], w = T * 0.9 * k;
      glowF(c, bot[0], bot[1] - hgt * 0.5, hgt * 0.6, EDGE, 0.35 * k); glowF(c, bot[0], bot[1] - hgt * 0.5, hgt * 0.25, ACC, 0.25 * k); c.globalAlpha = Math.min(1, k * 1.2); c.drawImage(seamSpr(), bot[0] - w / 2, top[1], w, hgt); c.globalAlpha = 1;
      glowF(c, bot[0], bot[1], T * 0.8, EDGE, 0.3 * k, 0.4);
    }
    function drawGhost(c, T) {   // the Celestial finisher: a faint horned shadow behind the pet, mirroring the strike with its own blade
      const a = pose.ghost * 0.6, f = feet(), Fp = scr(f, T), sc = 1.75, img = shadowSpr(), w = T * hT * 2.1, h2 = w * 200 / 160, y0 = Fp[1] - h2 * 0.92 - T * hT * 0.1;
      glowF(c, Fp[0], y0 + h2 * 0.42, w * 0.62, EDGE, 0.2 * pose.ghost); glowF(c, Fp[0], y0 + h2 * 0.36, w * 0.3, CRIM, 0.08 * pose.ghost);   // (a dim violet backlight the silhouette stands against)
      c.globalAlpha = a; c.drawImage(img, Fp[0] - w / 2, y0, w, h2); c.globalAlpha = 1;
      const hp = hiltPt(), pv = [f[0] + (hp[0] - f[0]) * sc, f[1] + (hp[1] - f[1]) * sc - 0.02, hp[2] * sc + 0.3 * hT], O3 = [pv[0] - pose.d[0] * GRIPU * LSW * hT * sc, pv[1] - pose.d[1] * GRIPU * LSW * hT * sc, pv[2] - pose.d[2] * GRIPU * LSW * hT * sc], V = swordView(T, pose.d, pose.n, sc);
      drawSword(c, { tier, rb: V.rb, o: scr(O3, T), ex: V.ex, ey: V.ey, a: a * 0.6, gloss: 0, em: 0.35, u0: U0, u1: U1, runeU: 0 });
    }
    /* the trail: in its swing's plane, a crescent from the recorded angles; cumulative cross-section bands, faded along
       its length by conic gradients; split by depth between the layers behind and in front of the pet */
    const BANDS = [[0.0, rgb('#1A0B2E'), 0.14, 0], [0.16, rgb('#22103C'), 0.2, 0], [0.32, rgb('#2E1458'), 0.26, 0], [0.48, rgb('#3C1A72'), 0.24, 0], [0.56, rgb(ENERGY), 0.2, 1], [0.68, rgb('#7A3FD0'), 0.2, 1], [0.8, rgb('#9A66F0'), 0.24, 1], [0.89, rgb(EDGE), 0.4, 1], [0.95, rgb(ACC), 0.65, 1]];
    const EDGEB = [0.982, rgb('#FFFFFF'), 0.75, 1], CRB = rgb(CRIM), STR = rgb('#9A66F0');
    const TH = [], WW = [], AL = [];
    function drawTrail(c, tr, T, t, side) {
      const sm2 = tr.smp; if (sm2.length < 2) return; const sw = tr.sw, P = tr.P || pose.P, Ro = bladeR(1) * hT, Lb = (1 - 0.3) * LSW * hT, fd = feet();
      TH.length = 0; WW.length = 0; AL.length = 0;
      for (let i = 0; i < sm2.length; i++) { const s2 = sm2[i], age = t - s2.t, al = Math.pow(cl(1 - age / TLIFE), 1.4);
        if (i > 0) { const p = sm2[i - 1], dth = s2.th - p.th, n = Math.min(6, Math.ceil(Math.abs(dth) / 0.08)); for (let j = 1; j < n; j++) { const v = j / n; TH.push(p.th + dth * v); WW.push(lerp(p.w, s2.w, v)); AL.push(lerp(Math.pow(cl(1 - (t - p.t) / TLIFE), 1.4), al, v)); } }
        TH.push(s2.th); WW.push(s2.w); AL.push(al); }
      // runs on this side of the pet (the depth of the blade's outer half at each angle)
      let i0 = -1; const n = TH.length;
      for (let i = 0; i <= n; i++) { let on = false; if (i < n) { const d = dirAt(sw, TH[i]), dp = P[1] + d[1] * Ro * 0.75 - fd[1]; on = side > 0 ? dp >= 0 : dp < 0; }
        if (on && i0 < 0) i0 = Math.max(0, i - 1); if ((!on || i === n) && i0 >= 0) { const i1 = on ? n - 1 : Math.min(n - 1, i); if (i1 > i0) ribbon(c, sw, P, i0, i1, Ro, Lb, T, t); i0 = -1; } }
    }
    function ribbon(c, sw, P, i0, i1, Ro, Lb, T, t) {
      const O = scr(P, T), a = prj(sw.A, T), b = prj(sw.B, T); if (Math.abs(a[0] * b[1] - a[1] * b[0]) < T * T * 0.02) return;
      const th0 = TH[i0], span = TH[i1] - th0; if (span <= 1e-3 || span > TAU * 0.95) return;
      c.save(); c.transform(a[0], a[1], b[0], b[1], O[0], O[1]);
      const hasCG = typeof c.createConicGradient === 'function';
      const fill = (f0, f1, col, alpha, add, mod) => {
        c.beginPath(); for (let i = i0; i <= i1; i++) { const r = Ro - WW[i] * Lb * (1 - f1); i === i0 ? c.moveTo(r * Math.cos(TH[i]), r * Math.sin(TH[i])) : c.lineTo(r * Math.cos(TH[i]), r * Math.sin(TH[i])); }
        for (let i = i1; i >= i0; i--) { const r = Ro - WW[i] * Lb * (1 - f0); c.lineTo(r * Math.cos(TH[i]), r * Math.sin(TH[i])); } c.closePath();
        if (hasCG) { const gr = c.createConicGradient(th0, 0, 0); let last = -1; for (let i = i0; i <= i1; i++) { const o = (TH[i] - th0) / TAU; if (o <= last) continue; last = o; const sk = add ? cl(WW[i] / 0.3) : 1; gr.addColorStop(Math.min(1, o), rgbaA(col, alpha * AL[i] * sk * (mod ? mod(i) : 1))); } gr.addColorStop(Math.min(1, last + 0.002), rgbaA(col, 0)); c.fillStyle = gr; c.globalAlpha = 1; }
        else { c.fillStyle = rgbaA(col, alpha * AL[i1]); }
        c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.fill(); };
      for (const [f0, col, al, add] of BANDS) fill(f0, 1, col, al, add);
      fill(EDGEB[0], 1, EDGEB[1], EDGEB[2], 1);
      for (const [fq, ph2] of [[0.46, 0], [0.63, 1.7], [0.8, 3.1]]) fill(fq, fq + 0.035, STR, 0.4, 1, i => 0.5 + 0.5 * Math.sin(TH[i] * 11 - t * 16 + ph2));
      fill(0.7, 0.718, CRB, 0.42, 1, i => 0.55 + 0.45 * Math.sin(TH[i] * 7 + t * 9));
      c.restore(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
    function drawUnder(c) {
      if (ph === 'gone' && !floorFx.length) return; const T = H.X.Tz(), t = lastT;
      // the sword's shadow on the floor, and the violet light of its edge on the floor under a fast cut
      if (ph !== 'gone' && pose.u1 > 0.3) { const hp = hiltPt(), tp = swordPt(Math.min(pose.u1, 1), 0), A = scr([hp[0], hp[1], 0], T), B = scr([tp[0], tp[1], 0], T), hk = 1 / (1 + Math.max(0, Math.min(hp[2], tp[2])) * 0.8);
        c.lineCap = 'round'; c.strokeStyle = `rgba(0,0,0,${0.22 * hk * pose.a})`; c.lineWidth = T * 0.16 * hT; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); c.strokeStyle = `rgba(0,0,0,${0.14 * hk})`; c.lineWidth = T * 0.3 * hT; c.stroke();
        if (cur && Math.abs(cur.om || 0) > 6) glowF(c, B[0], B[1], T * 0.9 * hT, EDGE, 0.18 * cl((Math.abs(cur.om) - 6) / 10), 0.5); }
      for (const q of floorFx) { const u = (t - q.t0) / q.life;
        if (q.k === 'lit') { const X = q.m && valid(q.m) ? H.sx(q.m.x) : H.sx(q.x), Y = q.m && valid(q.m) ? H.sy(q.m.y) + 0.12 * T : H.sy(q.y * GY) + 0.18 * T; glowF(c, X, Y, T * q.r, EDGE, 0.42 * (1 - u), 0.5); glowF(c, X, Y, T * q.r * 0.4, ACC, 0.3 * (1 - u) * (1 - u), 0.5); }
        else if (q.k === 'fis') { const a = (1 - sstep(0.35, 1, u)) * sstep(0, 0.04, t - q.t0), grow = sstep(0, 0.18, t - q.t0), nP = Math.max(2, Math.ceil(q.pts.length * grow));
          c.lineCap = 'round'; c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter';
          const path = (pts, m) => { c.beginPath(); for (let i = 0; i < Math.min(m, pts.length); i++) { const X = H.sx(pts[i][0]), Y = H.sy(pts[i][1] * GY) + 0.18 * T; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } };
          for (const [lw, col, al] of [[0.34, '208,24,63', 0.22], [0.14, '165,92,255', 0.55], [0.05, '255,225,240', 0.9]]) { c.strokeStyle = `rgba(${col},${al * a})`; c.lineWidth = Math.max(1, T * lw * hT * (1 - 0.3 * u)); path(q.pts, nP); c.stroke(); if (grow > 0.6) for (const b of q.br) { path(b, Math.ceil(b.length * sstep(0.6, 1, grow))); c.lineWidth *= 0.6; c.stroke(); c.lineWidth /= 0.6; } }
          c.globalCompositeOperation = 'source-over'; const p0 = q.pts[4]; glowF(c, H.sx(p0[0]), H.sy(p0[1] * GY) + 0.18 * T, T * 1.6 * hT, CRIM, 0.3 * a, 0.5); }
      }
      for (const p of PS) if (p.k === 'ripple' && p.floor) { const u = p.t / p.life, X = H.sx(p.x), Y = H.sy(p.y * GY) + 0.18 * T, r = T * p.s * (0.2 + 0.8 * (1 - Math.pow(1 - u, 2.2))); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * (1 - u); c.drawImage(ringSpr(), X - r, Y - r * GY, r * 2, r * 2 * GY); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    }
    function draw(c) {
      const d0 = nowMs(), T = H.X.Tz(), t = lastT;
      for (const p of PS) { const u = p.t / p.life, P = scr([p.x, p.y, p.z], T), X = P[0], Y = P[1];
        if (p.k === 'mist') { const r = T * p.s * Math.max(0.2, 1 + p.grow * u), a = Math.min(1, p.t / 0.08) * (1 - u) * p.a; c.globalAlpha = cl(a); if (p.v === 2) c.globalCompositeOperation = 'lighter'; c.drawImage(mistSpr(p.v), X - r, Y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; }
        else if (p.k === 'frag' || p.k === 'spec') { const fr = BK.spr.get('FR' + p.v), r = T * p.s * (p.k === 'spec' ? 1 - 0.5 * u : 1); c.save(); c.translate(X, Y); c.rotate(p.rot); if (p.k === 'spec') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * (1 - sstep(0.4, 0.8, u)); glowF(c, 0, 0, r * 2.2, EDGE, 0.35 * (1 - u)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * (1 - sstep(0.4, 0.8, u)); } else c.globalAlpha = 1 - sm((u - 0.6) / 0.4); if (fr) c.drawImage(fr.cv, -r, -r, r * 2, r * 2); c.restore(); c.globalCompositeOperation = 'source-over'; if (p.k === 'spec' && u > 0.55) glowF(c, X, Y, T * 0.12, RUBY, 0.8 * (1 - u) / 0.45); }
        else if (p.k === 'spk') { const sp = Math.hypot(p.vx, p.vy * GY - p.vz) || 1, ax = p.vx / sp, ay = (p.vy * GY - p.vz) / sp, L = T * p.s * (1 + sp * 0.06), w = L * 0.22; c.globalAlpha = 1 - u; c.fillStyle = '#0B0612'; c.beginPath(); c.moveTo(X + ax * L, Y + ay * L); c.lineTo(X - ay * w, Y + ax * w); c.lineTo(X - ax * L * 0.4, Y - ay * L * 0.4); c.lineTo(X + ay * w, Y - ax * w); c.closePath(); c.fill(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = p.v === 0 ? 'rgba(255,240,255,0.9)' : 'rgba(165,92,255,0.85)'; c.lineWidth = 1; c.beginPath(); c.moveTo(X + ax * L, Y + ay * L); c.lineTo(X - ax * L * 0.4, Y - ay * L * 0.4); c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
        else if (p.k === 'flash') { const r = T * p.s * (0.5 + 0.7 * u); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * (1 - u); c.drawImage(starSpr(), X - r, Y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
        else if (p.k === 'ripple' && !p.floor) { const r = T * p.s * (0.25 + 0.75 * (1 - Math.pow(1 - u, 2))); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * (1 - u); c.drawImage(ringSpr(), X - r, Y - r * 0.8, r * 2, r * 1.6); c.globalCompositeOperation = 'source-over'; c.strokeStyle = `rgba(0,0,0,${0.16 * (1 - u)})`; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.ellipse(X, Y, r * 1.08, r * 0.86, 0, 0, TAU); c.stroke(); c.globalAlpha = 1; }
        else if (p.k === 'ember') glowF(c, X, Y, T * p.s * 2.4, RUBY, 0.85 * (1 - u));
        else if (p.k === 'jet') { const ax = p.vx, ay = p.vy * GY - p.vz, l = Math.hypot(ax, ay) || 1, L = T * p.s * (1 - u * 0.5); c.save(); c.translate(X, Y); c.rotate(Math.atan2(ay, ax)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * (1 - u); c.drawImage(glowSprite(EDGE), -L, -L * 0.18, L * 2, L * 0.36); c.restore(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; void l; }
      }
      c.globalAlpha = 1;
      // the price: a thin crimson thread from the pet's chest into the hilt
      for (const q of threads) { const u = (t - q.t0) / 0.45, f = feet(), A = scr([f[0], f[1], 0.5 * hT], T), B = scr(hiltPt(), T), a = (1 - sm(u)) * sstep(0, 0.06, t - q.t0), mx = (A[0] + B[0]) / 2 + Math.sin(t * 30) * T * 0.08, my = (A[1] + B[1]) / 2 - T * 0.25;
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const [lw, col] of [[T * 0.09, `rgba(208,24,63,${0.35 * a})`], [Math.max(1, T * 0.025), `rgba(255,120,150,${0.95 * a})`]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(A[0], A[1]); c.quadraticCurveTo(mx, my, B[0], B[1]); c.stroke(); }
        const v = cl(u * 2.2), qx = (1 - v) * (1 - v) * A[0] + 2 * (1 - v) * v * mx + v * v * B[0], qy = (1 - v) * (1 - v) * A[1] + 2 * (1 - v) * v * my + v * v * B[1]; glowF(c, qx, qy, T * 0.22, RUBY, 0.8 * a); glowF(c, A[0], A[1], T * 0.3, CRIM, 0.4 * a); c.globalCompositeOperation = 'source-over'; }
      const dd = nowMs() - d0; if (dd > dbg.maxDraw) dbg.maxDraw = dd;
    }
    return F;
  };

  /* (checks and the model sheet) */
  S.demonblade.__dbg = { BK, bakeStep, setScale, plan, drawSword, RHO, SW, COMBO, Th, skey,
    bakeAll(px, tier) { setScale(px); plan(tier || 0); bakeStep(1e5); for (const f of WARM) f(); return BK.spr.size; },
    bakeCost(px, tier) { BK.spr.clear(); BK.queue = []; BK.qset = new Set(); BK.job = null; BK.px = 0; setScale(px); plan(tier || 0); const keys = BK.queue.slice(); BK.queue = []; BK.qset = new Set(); const out = {};
      for (const key of keys) { const res = {}, it = genFor(key, res); let tot = 0, mx = 0; for (;;) { const t0 = nowMs(), r = it.next(), d = nowMs() - t0; tot += d; mx = Math.max(mx, d); if (r.done) break; } BK.spr.set(key, res); out[key] = [+tot.toFixed(2), +mx.toFixed(2)]; } return out; } };
})();
