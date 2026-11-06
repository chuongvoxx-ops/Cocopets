/* ---------- Earth, reworked: Titan ----------
   A colossal stone golem rises from an amber sigil beside the pet and fights with it for 5 s (8 s at Adept, 12 s at
   Celestial, evenly between), then ends with
   Worldbreaker. Replaces Heart of the Mountain (row in 20k1: cost 100, cd 57, glyph 'fist').
   The golem is a true 3D model drawn live every frame: ~120 convex rock solids (each the intersection of jittered
   planes: faces, chamfered edges, cut corners and random chips, so every stone has thickness, bevels and broken corners)
   hung on a rig (hips, chest, head, clavicles, upper arms, forearms, hands with four three-segment fingers and a
   two-segment thumb, thighs, shins, feet with three toes). Joints only rotate: no stone ever stretches. Each solid is cel
   shaded by its true normal (deep / shadow / base / light), mapped with a worn-stone texture that turns with it (pits,
   scratches, mottling; one pattern transform per local axis), carries irregular moss patches (a mossy pattern on the
   faces that look up or out, per part, plus a few raised clumps), pale worn edges where a lit facet meets a darker one,
   and an ink silhouette. A charcoal core shows through the deep gaps between plates. Fractures are drawn on the stones
   (dark), and light with golden Earth energy during attacks (region by region: chest, shoulders, forearms, fists); at
   Celestial engraved markings glow faintly. The eyes are small white-green lights deep under a heavy brow. Parts are
   depth-sorted (painter's, per part) and the whole is baked into cached pictures (see Performance), so a fade near the
   pet never shows its inside; rising, it is clipped at the floor under a band of dust. The game sorts it among the
   monsters and the pet by its feet (a one-line hook in 20b: kind 12, an ELEM effect's drawEnt at entY).
   Levels: Adept larger shoulders and forearms, more glow; Celestial a monumental guardian (x1.12), layered shoulder
   stones, engraved markings, golden light moving in its fractures, the widest slams and a towering ridge.
   Behaviour: an ally actor (not damageable: the game has no summon system for this), it follows the pet and keeps to its
   side or behind it, walks to the nearest monster within reach of the party, and attacks: heavy punch (either arm),
   sweeping backhand (an arc in front), ground slam (a shockwave ring that hits each monster once when its front reaches
   it); damage on the contact frame. Earth damage, DK = base x K x (1 + 0.08 (evo - 1)), each blow x DM = 25 / fight
   length (x5 at L1, x3.13 at L4, x2.08 at L7: the short fight deals what a 25 s one did): punch 4.4 DK (others within
   0.75 of the fist 1.5 DK), backhand 3.8 DK to each in its arc (1.9 tiles, +-75 degrees), slam 5.4 DK in its ring
   (radius 1.9 / 2.17 / 2.44 x K at L1 / 4 / 7, each monster once when the front reaches it), all x DM. Measured on one
   monster beside the pet: ~65-80 DK over the fight at every level (as the 25 s fight's ~2.7 DK/s did). Attacks play
   ~12% faster at L1, ~27% at L7. The fight's timer starts when it has risen (2.6 s).
   Worldbreaker (when the fight's time runs out, ~2.9 s; not scaled): it turns to the nearest monster, plants its feet wide, golden light runs
   chest -> shoulders -> forearms -> fists, stones lift and spiral into two gauntlets, a golden fracture spreads; fists
   raised overhead, held; a two-fisted slam: an impact hit round the fists (6 DK, radius 1.9 / 2.1 / 2.3 x K) and a
   travelling earthquake ridge of rock slabs (5 DK, each monster once as the front reaches it, reach 4 / 4.75 / 5.5 x K);
   decorative debris never hits. Then the gauntlets break, the light drains, the eyes dim and it settles into loose stone.
   No monster within 12 tiles: a peaceful departure (it bows its head and settles).
   Performance: the model is never drawn live in play. Its key poses (idle 2, walk 6, punch 4, backhand 4, slam 4, rise 4,
   Worldbreaker 5, departure 1) are baked per level tier and facing (8 facings; mirrored where the pose allows) at 1.2x
   the screen size into cached pictures, in slices of ~1.2 ms a frame (a pose's setup a slice of its own; textures and
   stone shapes warmed the same way), only the facings in use: the cast's facing and its two neighbours up front, others
   when first seen, the Worldbreaker's 3 s before it. A floor that starts with Titan in a kit prepares in idle time
   (U.titan.warm, a hook in 20b). Each frame lays one or two pictures down; glows, trails and the crumble's tumbling
   rocks are sprites on top. Cache kept between casts, capped at 32 MB (a typical cast ~10-16 MB).
   Pet death or floor change: it crumbles / is cleared with the game. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.mountainheart;
  const TAU = Math.PI * 2, GK = GeoKit, SE = GK.SE, CE = GK.CE, LDW = GK.LD;
  const { add, sub, mul, dot, cross, norm, mm, mv } = GK;
  const AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', EMBER = '#FFF4D6', INK = '#120E0B';
  const EYE = '#F4FFEE', EYEG = '#B4F2A6';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const rngOf = s => { let x = (Math.floor(s * 1000) >>> 0) || 7; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };
  const eul = (a, b, c) => mm(GK.rz(c || 0), mm(GK.ry(b || 0), GK.rx(a || 0)));   // rx first, then ry, then rz
  const tr = M => [M[0], M[3], M[6], M[1], M[4], M[7], M[2], M[5], M[8]];
  let H;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);

  /* ================= solids: convex polytopes cut from planes ================= */
  function clipPoly(P, pl) { const out = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], da = a[0] * pl[0] + a[1] * pl[1] + a[2] * pl[2] - pl[3], db = b[0] * pl[0] + b[1] * pl[1] + b[2] * pl[2] - pl[3]; if (da <= 0) out.push(a); if ((da <= 0) !== (db <= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } } return out; }
  function polytope(planes) {
    const V = [], F = [], FN = [];
    const vid = p => { for (let i = 0; i < V.length; i++) { const q = V[i]; if (Math.abs(q[0] - p[0]) < 1e-5 && Math.abs(q[1] - p[1]) < 1e-5 && Math.abs(q[2] - p[2]) < 1e-5) return i; } V.push(p); return V.length - 1; };
    planes.forEach((pl, i) => {
      const n = [pl[0], pl[1], pl[2]], a = Math.abs(n[0]) < 0.8 ? [1, 0, 0] : [0, 1, 0], u = norm(cross(n, a)), v = cross(n, u), c0 = mul(n, pl[3]), B = 300;
      let P = [[-B, -B], [B, -B], [B, B], [-B, B]].map(([s, t]) => add(c0, add(mul(u, s), mul(v, t))));
      for (let j = 0; j < planes.length && P.length > 2; j++) if (j !== i) P = clipPoly(P, planes[j]);
      if (P.length < 3) return;
      const ids = []; for (const p of P) { const k = vid(p); if (ids[ids.length - 1] !== k && !ids.includes(k)) ids.push(k); }
      if (ids.length < 3) return;
      let A = [0, 0, 0]; for (let k = 1; k < ids.length - 1; k++) A = add(A, cross(sub(V[ids[k]], V[ids[0]]), sub(V[ids[k + 1]], V[ids[0]])));
      const ar = dot(A, n); if (Math.abs(ar) < 2e-3) return;
      if (ar < 0) ids.reverse();
      F.push(ids); FN.push(n);
    });
    // keep only the corners some face uses, renumbered
    const used = new Map(), V2 = []; F.forEach(f => f.forEach((i, k) => { if (!used.has(i)) { used.set(i, V2.length); V2.push(V[i]); } f[k] = used.get(i); }));
    const E = new Map(); F.forEach((f, fi) => f.forEach((a, k) => { const b = f[(k + 1) % f.length], lo = Math.min(a, b), hi = Math.max(a, b), key = lo * 4096 + hi, e = E.get(key); if (e) e[3] = fi; else E.set(key, [lo, hi, fi, -1]); }));
    const cen = mul(V2.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / Math.max(1, V2.length));
    const fc = F.map(f => mul(f.reduce((s, i) => add(s, V2[i]), [0, 0, 0]), 1 / f.length));
    const area = F.map((f, fi) => { let A = [0, 0, 0]; for (let k = 1; k < f.length - 1; k++) A = add(A, cross(sub(V2[f[k]], V2[f[0]]), sub(V2[f[k + 1]], V2[f[0]]))); return Math.abs(dot(A, FN[fi])) / 2; });
    let rad = 0; for (const p of V2) rad = Math.max(rad, Math.hypot(p[0] - cen[0], p[1] - cen[1], p[2] - cen[2]));
    return { v: V2, f: F, fn: FN, e: [...E.values()], cen, fc, area, rad };
  }
  /* a rough stone: a box (half sizes e; its top scaled by tx/ty and shifted by shx/shy, its bottom scaled by bx/by) whose
     faces are tilted a little, every edge chamfered (bev), every corner cut (bevC) and a few random chips taken off */
  function rock(o) {
    const R = rngOf(o.seed || 1), [a, b, c] = o.e, tx = o.tx == null ? 1 : o.tx, ty = o.ty == null ? tx : o.ty, bx = o.bx == null ? 1 : o.bx, by = o.by == null ? bx : o.by;
    const cor = []; for (const z of [-1, 1]) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) cor.push([sx * a * (z > 0 ? tx : bx) + (z > 0 ? (o.shx || 0) : 0), sy * b * (z > 0 ? ty : by) + (z > 0 ? (o.shy || 0) : 0), z * c]);
    const cen = mul(cor.reduce((s, p) => add(s, p), [0, 0, 0]), 1 / 8), sup = n => { let s = -1e9; for (const p of cor) { const d = dot(n, p); if (d > s) s = d; } return s; };
    const QF = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    const fnm = QF.map(q => { let n = norm(cross(sub(cor[q[1]], cor[q[0]]), sub(cor[q[2]], cor[q[0]]))); if (dot(n, sub(cor[q[0]], cen)) < 0) n = mul(n, -1); return n; });
    const planes = [], J = o.jit == null ? 0.12 : o.jit, bev = o.bev == null ? 0.2 : o.bev, bevC = o.bevC == null ? 0.3 : o.bevC;
    const P = (n, k) => { n = norm(n); const s = sup(n), m = dot(n, cen); planes.push([n[0], n[1], n[2], m + (s - m) * (1 - k)]); };
    const jt = n => norm(add(n, [(R() - 0.5) * J, (R() - 0.5) * J, (R() - 0.5) * J]));
    fnm.forEach(n => P(jt(n), R() * 0.04));
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (QF[i].filter(k => QF[j].includes(k)).length === 2) P(jt(add(fnm[i], fnm[j])), bev * (0.45 + R() * 1.1));
    for (let k = 0; k < 8; k++) { let s = [0, 0, 0]; QF.forEach((q, i) => { if (q.includes(k)) s = add(s, fnm[i]); }); P(jt(s), bevC * (0.5 + R() * 1.0)); }
    const nch = o.chips == null ? 2 : o.chips; for (let k = 0; k < nch; k++) P([R() * 2 - 1, R() * 2 - 1, R() * 2 - 1], 0.08 + R() * 0.16);
    return polytope(planes);
  }

  /* ================= surfaces ================= */
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  let STONE = null, MOSS = null, CLUMP = null;
  // worn stone, as overlays of light and dark (so one tile serves every tone): mottling with a brown undertone, grit,
  // pits with a lit lip, scratches in two grains, hairline cracks
  let STG = null, MSG = null;
  function* stoneGen() {
    const S = 256, cv = mk(S, S), g = cv.getContext('2d'), R = rngOf(91);
    const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(ox, oy); f(); g.restore(); } };
    const blob = (x, y, r, col) => wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); });
    for (let i = 0; i < 46; i++) { if (i % 10 === 9) yield; blob(R() * S, R() * S, 14 + R() * 44, R() < 0.45 ? `rgba(255,250,240,${0.05 + R() * 0.07})` : `rgba(0,0,0,${0.07 + R() * 0.11})`); }
    yield;
    for (let i = 0; i < 14; i++) blob(R() * S, R() * S, 20 + R() * 50, `rgba(120,78,34,${0.06 + R() * 0.07})`);
    yield;
    for (let i = 0; i < 3200; i++) { if (i === 1600) yield; g.fillStyle = R() < 0.55 ? `rgba(0,0,0,${0.1 + R() * 0.18})` : `rgba(255,248,236,${0.05 + R() * 0.1})`; g.fillRect(R() * S, R() * S, 1 + R() * 1.2, 1 + R() * 1.2); }
    for (let i = 0; i < 110; i++) { const x = R() * S, y = R() * S, r = 0.8 + R() * 2.6; wrap(() => { g.fillStyle = 'rgba(0,0,0,.42)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,250,236,.28)'; g.lineWidth = 0.8; g.beginPath(); g.arc(x + 0.4, y + 0.4, r, 0.2, 1.9); g.stroke(); }); }
    yield;
    g.lineCap = 'round';
    for (let i = 0; i < 46; i++) { const x = R() * S, y = R() * S, an = (R() < 0.6 ? 0.5 : -0.9) + (R() - 0.5) * 0.4, L = 10 + R() * 46, n = R() < 0.35 ? 3 : 1;
      for (let k = 0; k < n; k++) { const ox = -Math.sin(an) * k * 2.2, oy = Math.cos(an) * k * 2.2; wrap(() => { g.strokeStyle = 'rgba(0,0,0,.32)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x + ox + 0.7, y + oy + 0.7); g.lineTo(x + ox + Math.cos(an) * L + 0.7, y + oy + Math.sin(an) * L + 0.7); g.stroke(); g.strokeStyle = `rgba(255,250,236,${0.16 + R() * 0.2})`; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(an) * L, y + oy + Math.sin(an) * L); g.stroke(); }); } }
    const crack = (x, y, an, L, w, d) => { const pts = [[x, y]]; let cx = x, cy = y, ca = an; for (let i = 0; i < 6; i++) { ca += (R() - 0.5) * 0.9; const l = L / 6 * (0.6 + R() * 0.8); cx += Math.cos(ca) * l; cy += Math.sin(ca) * l; pts.push([cx, cy]); }
      wrap(() => { g.strokeStyle = 'rgba(0,0,0,.5)'; g.lineWidth = w; g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.stroke(); }); if (d > 0) { const p = pts[2 + Math.floor(R() * 3)]; crack(p[0], p[1], ca + (R() - 0.5) * 2, L * 0.5, w * 0.7, d - 1); } };
    yield;
    for (let i = 0; i < 7; i++) crack(R() * S, R() * S, R() * TAU, 60 + R() * 70, 1 + R() * 0.6, 1);
    STONE = cv;
  }
  function stoneTile() { if (!STONE) { STG = STG || stoneGen(); while (!STONE) STG.next(); } return STONE; }
  const stoneStep = () => { if (STONE) return true; STG = STG || stoneGen(); STG.next(); return !!STONE; };
  // moss: irregular clustered patches (about half the tile bare), shaded in three tones, with dark speckles and pale tufts
  function* mossGen() {
    const S = 256, R = rngOf(57), mask = mk(S, S), g = mask.getContext('2d');
    const wrapc = (x, y, r) => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.beginPath(); g.arc(x + ox, y + oy, r, 0, TAU); g.fill(); } };
    g.fillStyle = '#000';
    for (let k = 0; k < 7; k++) { const cx = R() * S, cy = R() * S, rr = 26 + R() * 40; for (let i = 0; i < 40; i++) { const an = R() * TAU, d = Math.pow(R(), 0.8) * rr, r = (6 + R() * 10) * (1 - d / rr * 0.6); wrapc(cx + Math.cos(an) * d, cy + Math.sin(an) * d * (0.6 + R() * 0.6), r); } }
    for (let i = 0; i < 14; i++) wrapc(R() * S, R() * S, 2 + R() * 3);
    const tones = [['#284A16', '#3B6620', '#1A3010', '#5F8F2E'], ['#3F7A1E', '#5A9E2A', '#26481A', '#9ACB45'], ['#6AAA2C', '#8DCB3E', '#3F7322', '#C9EA6E']];
    yield; const out = [];
    for (let ti = 0; ti < 3; ti++) { yield; const [b0, b1, dk, tuft] = tones[ti], cv = mk(S, S), q = cv.getContext('2d'), Rr = rngOf(77 + ti);
      q.drawImage(mask, 0, 0); q.globalCompositeOperation = 'source-in'; q.fillStyle = b0; q.fillRect(0, 0, S, S);
      q.globalCompositeOperation = 'source-atop';
      for (let i = 0; i < 420; i++) { const x = Rr() * S, y = Rr() * S, r = 1.5 + Rr() * 4; q.fillStyle = Rr() < 0.5 ? b1 : dk; q.beginPath(); q.arc(x, y, r, 0, TAU); q.fill(); }
      for (let i = 0; i < 260; i++) { const x = Rr() * S, y = Rr() * S; q.fillStyle = tuft; q.globalAlpha = 0.5 + Rr() * 0.5; q.fillRect(x, y, 1.2, 1.2); }
      q.globalAlpha = 1; out.push(cv); }
    MOSS = out;
  }
  function mossTiles() { if (!MOSS) { MSG = MSG || mossGen(); while (!MOSS) MSG.next(); } return MOSS; }
  const mossStep = () => { if (MOSS) return true; MSG = MSG || mossGen(); MSG.next(); return !!MOSS; };
  // a raised moss clump: a cushion of little domes, lit from the upper left, an ink rim
  function clumpSpr() {
    if (CLUMP) return CLUMP; const W = 48, Hh = 32, cv = mk(W, Hh), g = cv.getContext('2d'), R = rngOf(13), D = [];
    for (let i = 0; i < 9; i++) D.push([10 + R() * 28, 12 + R() * 12, 5 + R() * 5]);
    g.fillStyle = INK; for (const [x, y, r] of D) { g.beginPath(); g.arc(x, y, r + 1.4, 0, TAU); g.fill(); }
    for (const [x, y, r] of D) { const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.5, 0, x, y, r); gr.addColorStop(0, '#B6E05A'); gr.addColorStop(0.45, '#5E9E28'); gr.addColorStop(1, '#2C5418'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(220,250,150,.7)'; for (let i = 0; i < 30; i++) g.fillRect(6 + R() * 36, 6 + R() * 16, 1.2, 1.2);
    return (CLUMP = cv);
  }
  // (patterns made from bitmaps once they exist: a pattern over a canvas may copy that canvas at every use)
  let BMP = null, BMPv = 0;
  function bitmaps() { if (BMP || typeof createImageBitmap !== 'function') return; BMP = {}; Promise.all([stoneTile(), ...mossTiles()].map(cv => createImageBitmap(cv))).then(a => { BMP.stone = a[0]; BMP.moss = a.slice(1); BMPv++; }).catch(() => {}); }
  function pats(c) {
    bitmaps(); if (c._ttnP && c._ttnPv === BMPv) return c._ttnP; c._ttnPv = BMPv;
    const st = BMP && BMP.stone ? BMP.stone : stoneTile(), ms = BMP && BMP.moss ? BMP.moss : mossTiles();
    return (c._ttnP = { stone: c.createPattern(st, 'repeat'), moss: ms.map(t => c.createPattern(t, 'repeat')) });
  }
  // the cel tones [deep, shadow, base, light], two variants each (a warmer and a cooler stone)
  const MATS = {
    stone: [['#201C19', '#3C3732', '#655F57', '#9A9387'], ['#241F1B', '#433C35', '#6D655B', '#A39A8C']],
    dark: [['#100E0C', '#1A1714', '#28241F', '#3A352F'], ['#120F0C', '#1D1915', '#2C2722', '#3F3932']],
    gaunt: [['#1C1815', '#322C27', '#4F473F', '#76695B'], ['#1E1916', '#362F28', '#554A40', '#7E7060']],
    crys: [['#6A3E0C', '#B06A14', '#EAA431', '#FFE6A6'], ['#6A3E0C', '#B06A14', '#EAA431', '#FFE6A6']],
  };

  /* ================= the rig ================= */
  const SIDES = [[1, 'L'], [-1, 'R']];
  const D0 = { HIP: 11.6, WAIST: 2.8, NECK: [4.0, 0, 9.5], SHX: -0.3, SHY: 8.6, SHZ: 7.6, LU: 5.6, LF: 6.8, KN: 3.7, FX: [1.62, 0.55, -0.55, -1.62], FL: [1.75, 1.45, 1.2], CURL: [1.4, 1.65, 1.3], HPY: 3.9, HPZ: 0.5, LT: 5.3, LS: 4.6, AH: 1.35 };
  const PK = ['rx', 'ry', 'rz', 'yaw', 'hipP', 'hipR', 'hipY', 'lean', 'roll', 'tw', 'hP', 'hY'];
  for (const [, s] of SIDES) { for (const k of ['sw', 'ab', 'tw', 'el', 'wp', 'wr', 'cu']) PK.push('a' + s + k); for (const k of ['sw', 'ab', 'kn', 'fp']) PK.push('l' + s + k); }
  const BASE = { rx: 0, ry: 0, rz: 0, yaw: 0, hipP: 0.1, hipR: 0, hipY: 0, lean: 0.46, roll: 0, tw: 0, hP: -0.45, hY: 0 };
  for (const [, s] of SIDES) Object.assign(BASE, { ['a' + s + 'sw']: 0.26, ['a' + s + 'ab']: 0.2, ['a' + s + 'tw']: 0.2, ['a' + s + 'el']: 0.5, ['a' + s + 'wp']: 0.12, ['a' + s + 'wr']: 0, ['a' + s + 'cu']: 0.55, ['l' + s + 'sw']: 0.1, ['l' + s + 'ab']: 0.11, ['l' + s + 'kn']: 0.3, ['l' + s + 'fp']: 0 });
  const KP = o => Object.assign({}, BASE, o);
  const both = (o, k, v) => { o['aL' + k] = v; o['aR' + k] = v; return o; };
  const legs = (o, k, v) => { o['lL' + k] = v; o['lR' + k] = v; return o; };
  function blendP(a, b, u) { const o = {}; for (const k of PK) o[k] = a[k] + (b[k] - a[k]) * u; return o; }
  function mirrorP(p) { const o = Object.assign({}, p); for (const k of PK) { if ((k[0] === 'a' || k[0] === 'l') && (k[1] === 'L' || k[1] === 'R')) { const s = k[1], kk = k[0] + (s === 'L' ? 'R' : 'L') + k.slice(2); o[k] = p[kk]; } } for (const k of ['ry', 'hipR', 'hipY', 'roll', 'tw', 'hY', 'yaw']) o[k] = -p[k]; return o; }
  function kfPose(KF, t) {
    if (t <= KF[0][0]) return KF[0][1];
    for (let i = 0; i < KF.length - 1; i++) if (t < KF[i + 1][0]) { let u = (t - KF[i][0]) / (KF[i + 1][0] - KF[i][0]); const e = KF[i + 1][2]; u = e === 'in' ? u * u * u : e === 'out' ? 1 - Math.pow(1 - u, 3) : e === 'lin' ? u : u * u * (3 - 2 * u); return blendP(KF[i][1], KF[i + 1][1], u); }
    return KF[KF.length - 1][1];
  }
  // forward kinematics: every bone's turn (R) and origin (t) in the model's space (x forward, y left, z up; u units)
  function rig(P, D) {
    const B = {}, rx = GK.rx, ry = GK.ry, rz = GK.rz;
    const root = { R: rz(P.yaw), t: [P.rx, P.ry, 0] };
    const hips = B.hips = { R: mm(root.R, mm(rz(P.hipY), mm(ry(P.hipP), rx(P.hipR)))), t: add(root.t, mv(root.R, [0, 0, D.HIP])) };
    const chest = B.chest = { R: mm(hips.R, mm(rz(P.tw), mm(ry(P.lean), rx(P.roll)))), t: add(hips.t, mv(hips.R, [0, 0, D.WAIST])) };
    B.head = { R: mm(chest.R, mm(rz(P.hY), ry(P.hP))), t: add(chest.t, mv(chest.R, D.NECK)) };
    for (const [q, s] of SIDES) {
      const g = k => P['a' + s + k], sh = add(chest.t, mv(chest.R, [D.SHX, q * D.SHY, D.SHZ])), sw = g('sw'), ab = g('ab');
      B['clav' + s] = { R: mm(chest.R, mm(rx(q * Math.max(-0.2, ab) * 0.3), ry(-Math.max(-0.4, Math.min(1.6, sw)) * 0.2))), t: sh };
      const ua = B['ua' + s] = { R: mm(chest.R, mm(rx(q * ab), mm(ry(-sw), rz(q * g('tw'))))), t: sh };
      const el = add(sh, mv(ua.R, [0, 0, -D.LU])), fa = B['fa' + s] = { R: mm(ua.R, ry(-g('el'))), t: el };
      const wr = add(el, mv(fa.R, [0, 0, -D.LF])), hand = B['hand' + s] = { R: mm(fa.R, mm(rz(q * g('wr')), ry(-g('wp')))), t: wr };
      const cu = g('cu');
      for (let i = 0; i < 4; i++) { let R = mm(hand.R, rx(q * (i - 1.5) * 0.05 * (1 - cu))), base = add(hand.t, mv(hand.R, [D.FX[i], 0, -D.KN]));
        for (let k = 0; k < 3; k++) { R = mm(R, rx(-q * (cu * D.CURL[k] * (1 - 0.06 * Math.abs(i - 1.5)) + 0.1))); B['f' + i + k + s] = { R, t: base }; base = add(base, mv(R, [0, 0, -D.FL[k]])); } }
      { let R = mm(hand.R, mm(rx(-q * (0.55 + 0.75 * cu)), ry(-0.75 + 1.25 * cu))); const base = add(hand.t, mv(hand.R, [1.95, -q * 0.75, -1.5])); B['t0' + s] = { R, t: base }; const b2 = add(base, mv(R, [0, 0, -1.9])); R = mm(R, rx(-q * (0.2 + 0.7 * cu))); B['t1' + s] = { R, t: b2 }; }
      const l = k => P['l' + s + k], hj = add(hips.t, mv(hips.R, [0, q * D.HPY, -D.HPZ]));
      const th = B['th' + s] = { R: mm(hips.R, mm(rx(q * l('ab')), ry(-l('sw')))), t: hj };
      const kn = add(hj, mv(th.R, [0, 0, -D.LT])), shn = B['sh' + s] = { R: mm(th.R, ry(l('kn'))), t: kn };
      const an = add(kn, mv(shn.R, [0, 0, -D.LS]));
      B['ft' + s] = { R: mm(root.R, mm(rz(q * 0.12), ry(-l('fp')))), t: an };
    }
    // the feet stay on the floor: the whole body rides on the lower foot, then the pose's own lift (rz)
    const zf = Math.min(B.ftL.t[2], B.ftR.t[2]) - D.AH, dz = -zf + P.rz;
    for (const k in B) B[k].t = [B[k].t[0], B[k].t[1], B[k].t[2] + dz];
    return B;
  }

  /* ================= the model: parts on bones ================= */
  const MODELS = {};
  function model(tier) {
    if (MODELS[tier]) return MODELS[tier];
    const parts = [], T2 = tier >= 2, T3 = tier >= 3, SHK = T3 ? 1.22 : T2 ? 1.12 : 1, FAK = T3 ? 1.18 : T2 ? 1.1 : 1;
    let seed = 3;
    /* a stone on bone b: e half sizes, t its centre and r its turn (x, y, z angles) in the bone's frame, mat; moss {d, th,
       p}: the faces looking along d (bone frame) are mossy; crack n: fractures on the faces looking along cd; gg: the glow
       region; clumps; eyes; dep: a depth nudge */
    const part = (b, o) => {
      if (b === 'head') { const hs = 1.22, S3 = v => v.map(x => x * hs); o = Object.assign({}, o, { e: S3(o.e), t: S3(o.t || [0, 0, 0]) }); if (o.seam) o.seam = o.seam.map(L => L.map(S3)); if (o.eyes) { parts.push({ b, eyesP: o.eyes.map(S3), t: [0, 0, 0], dep: 3.2, ey: true }); delete o.eyes; } }
      // (the stone itself is cut later, a few at a time, when it is first needed: P.fin)
      const sd = seed++, R = o.r ? eul(o.r[0], o.r[1], o.r[2]) : GK.I3(), t = o.t || [0, 0, 0];
      const P = { b, R, t, lazy: true, mat: o.mat || 'stone', dep: o.dep || 0, gg: o.gg || null, gaunt: o.gaunt || 0, tex: o.tex !== false, texA: o.texA == null ? 0.72 : o.texA, sid: sd + 1 };
      P.fin = () => {
      const m = P.m = rock({ e: o.e, tx: o.tx, ty: o.ty, bx: o.bx, by: o.by, shx: o.shx, shy: o.shy, bev: o.bev, bevC: o.bevC, chips: o.chips, jit: o.jit, seed: sd * 7.31 + tier * 0.17 + 0.5 });
      const Rt = tr(R), rnd = rngOf((sd + 1) * 3.7 + 11), nf = m.f.length; P.lazy = false;
      P.grp = new Uint8Array(nf); P.var = new Uint8Array(nf); P.moss = new Uint8Array(nf);
      const fnB = m.fn.map(n => mv(R, n));   // face normals in the bone's frame
      for (let i = 0; i < nf; i++) { const n = m.fn[i], ax = [Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])]; P.grp[i] = ax[0] >= ax[1] && ax[0] >= ax[2] ? 0 : ax[1] >= ax[2] ? 1 : 2; P.var[i] = rnd() < 0.5 ? 1 : 0; }
      if (o.moss) for (const ms of [].concat(o.moss)) { const d = norm(ms.d); for (let i = 0; i < nf; i++) if (dot(fnB[i], d) > (ms.th == null ? 0.45 : ms.th) && rnd() < (ms.p == null ? 0.85 : ms.p) && m.area[i] > 0.15) P.moss[i] = 1; }
      // the faces most along a direction (largest first)
      const facesAlong = (d, n) => { d = norm(d); return m.f.map((_, i) => i).filter(i => dot(fnB[i], d) > 0.35 && m.area[i] > 0.4).sort((i, j) => (m.area[j] * (0.5 + dot(fnB[j], d))) - (m.area[i] * (0.5 + dot(fnB[i], d)))).slice(0, n); };
      const inr = fi => { const f = m.f[fi], c = m.fc[fi]; let r = 1e9; for (let k = 0; k < f.length; k++) { const a = m.v[f[k]], b2 = m.v[f[(k + 1) % f.length]], e = sub(b2, a), L = Math.hypot(e[0], e[1], e[2]) || 1, w = sub(c, a), cr = cross(e, w); r = Math.min(r, Math.hypot(cr[0], cr[1], cr[2]) / L); } return r; };
      P.cr = []; P.en = []; P.cl = []; P.seam = [];
      if (o.crack) for (const fi of facesAlong(o.cd || [1, 0, 0], o.crack)) {
        const f = m.f[fi], pts = f.map(i => m.v[i]), n = m.fn[fi], k = pts.length, i0 = Math.floor(rnd() * k), i1 = (i0 + Math.max(1, Math.floor(k / 2) + (rnd() < 0.5 ? 0 : -1 + Math.floor(rnd() * 2)))) % k;
        const s0 = GK.lerp3(pts[i0], pts[(i0 + 1) % k], 0.2 + rnd() * 0.6), s1 = GK.lerp3(pts[i1], pts[(i1 + 1) % k], 0.2 + rnd() * 0.6), L = [];
        for (let j = 0; j <= 5; j++) { const p = GK.lerp3(s0, s1, j / 5), q = j === 0 || j === 5 ? p : GK.lerp3(p, pts[Math.floor(rnd() * k)], rnd() * 0.3); L.push(add(q, mul(n, 0.04))); }
        P.cr.push({ fi, pts: L, ph: rnd() });
        if (rnd() < 0.7) { const p = L[2 + Math.floor(rnd() * 2)], q = GK.lerp3(p, pts[Math.floor(rnd() * k)], 0.55 + rnd() * 0.3); P.cr.push({ fi, pts: [p, GK.lerp3(p, q, 0.5), add(q, mul(n, 0.04))], ph: rnd(), br: 1 }); }
      }
      if (o.eng && T3) for (const fi of facesAlong(o.ed || o.cd || [1, 0, 0], 1)) {
        // an engraved Earth marking: a diamond with a stroke through it and two ticks, small in the middle of the face
        const f = m.f[fi], n = m.fn[fi], c = add(m.fc[fi], mul(n, 0.03)), u = norm(sub(m.v[f[1]], m.v[f[0]])), v = cross(n, u), r = inr(fi) * 0.55, P2 = (a, b2) => add(c, add(mul(u, a * r), mul(v, b2 * r)));
        P.en.push({ fi, pts: [P2(0, 1), P2(0.62, 0), P2(0, -1), P2(-0.62, 0), P2(0, 1)] }, { fi, pts: [P2(0, 0.62), P2(0, -0.62)] }, { fi, pts: [P2(-0.95, 0.35), P2(-0.78, 0.15)] }, { fi, pts: [P2(0.95, 0.35), P2(0.78, 0.15)] });
      }
      if (o.clumps) { const mf = m.f.map((_, i) => i).filter(i => P.moss[i]).sort((i, j) => m.area[j] - m.area[i]); for (let k = 0; k < o.clumps && mf.length; k++) { const fi = mf[k % mf.length], f = m.f[fi]; P.cl.push({ fi, p: add(GK.lerp3(m.fc[fi], m.v[f[Math.floor(rnd() * f.length)]], 0.25 + rnd() * 0.4), mul(m.fn[fi], 0.12)), s: 0.8 + rnd() * 0.5 }); } }
      P.nm = P.moss.some(v => v);
      if (o.eyes) P.eyes = o.eyes.map(p => mv(Rt, sub(p, t)));
      if (o.seam) P.seam = o.seam.map(L => L.map(p => mv(Rt, sub(p, t))));
      // the crumble: a delay, a drift outward, a tumble
      P.cd = rnd() * 0.35; P.cdx = (rnd() - 0.5) * 6; P.cdy = (rnd() - 0.5) * 6; P.cax = norm([rnd() - 0.5, rnd() - 0.5, rnd() - 0.5]); P.cang = (rnd() - 0.5) * 3; P.rest = Math.min(o.e[0], o.e[1], o.e[2]) * 0.9;
      const nv = m.v.length; P.sx = new Float32Array(nv); P.sy = new Float32Array(nv); P.vis = new Uint8Array(nf); P.band = new Uint8Array(nf);
      };
      parts.push(P); return P;
    };
    const ST = 'stone', DK = 'dark';
    /* ---- pelvis ---- */
    part('hips', { e: [2.9, 4.4, 1.9], t: [0, 0, 0.2], mat: DK, tex: false });
    for (const [q] of SIDES) part('hips', { e: [2.3, 2.0, 1.7], t: [0.2, q * 4.0, -0.3], r: [q * 0.25, 0.1, 0], moss: { d: [0, q, 0.6], th: 0.55, p: 0.5 } });
    part('hips', { e: [0.75, 2.2, 2.3], t: [2.5, 0, -1.5], r: [0, -0.12, 0], bx: 0.75, by: 0.6, crack: 1, cd: [1, 0, 0] });   // the hanging front stone
    part('hips', { e: [1.5, 3.6, 1.8], t: [-2.4, 0, 0.3], r: [0, 0.2, 0] });
    /* ---- the torso ---- */
    part('chest', { e: [4.4, 6.0, 5.5], t: [0, 0, 5.0], bx: 0.82, by: 0.72, mat: DK, tex: false });   // the charcoal core, broad at the top
    for (const [q] of SIDES) {
      part('chest', { e: [1.35, 3.5, 2.7], t: [4.25, q * 3.25, 7.9], r: [q * 0.08, -0.22, -q * 0.28], bev: 0.24, crack: 1, cd: [1, 0, 0.2], gg: 'chest', eng: 1, ed: [1, 0, 0] });   // the breast slabs
      part('chest', { e: [2.5, 0.95, 2.9], t: [0.4, q * 5.9, 4.8], r: [q * 0.14, 0, 0], moss: { d: [0, q, 0.3], th: 0.6, p: 0.4 } });   // the ribs
      part('chest', { e: [2.6, 1.5, 3.0], t: [-1.4, q * 5.7, 8.0], r: [q * -0.1, 0.1, 0] });   // the lats
      part('chest', { e: [1.25, 3.1, 2.8], t: [-4.3, q * 3.1, 8.6], r: [q * 0.1, 0.25, q * 0.25], moss: { d: [-0.6, 0, 0.9], th: 0.4, p: 0.9 }, clumps: q > 0 ? 1 : 0 });   // the shoulder blades
      for (let k = 0; k < 3; k++) part('chest', { e: [1.15, 1.65 - k * 0.22, 1.25], t: [3.95 - k * 0.32, q * (1.75 - k * 0.3), 4.6 - k * 2.1], r: [0, -0.14 - k * 0.05, -q * 0.1], bev: 0.28, crack: k === 0 ? 1 : 0, cd: [1, 0, 0], gg: 'chest', moss: k === 2 ? { d: [0.3, 0, 1], th: 0.6, p: 0.6 } : null });   // the stepped belly plates
    }
    part('chest', { e: [1.3, 4.4, 1.0], t: [1.4, 0, 10.4], r: [0, 0.55, 0], crack: 1, cd: [1, 0, 0.5], gg: 'chest' });   // the collar
    part('chest', { e: [1.9, 4.8, 1.7], t: [-3.0, 0, 10.4], r: [0, -0.45, 0], moss: { d: [-0.3, 0, 1], th: 0.4, p: 0.95 }, clumps: 2 });   // the upper back
    for (let k = 0; k < 4; k++) part('chest', { e: [1.35, 1.15 - k * 0.1, 1.15], t: [-4.7 + k * 0.15, 0, 9.0 - k * 2.4], r: [0, -0.3, 0.1 * (k % 2 ? 1 : -1)], tx: 0.55, ty: 0.7, bev: 0.25, moss: k === 0 ? { d: [0, 0, 1], th: 0.5 } : null });   // the spine ridge
    part('chest', { e: [1.2, 3.8, 1.9], t: [-3.9, 0, 2.6], r: [0, 0.1, 0] });   // the lower back
    if (T2) for (const [q] of SIDES) part('chest', { e: [1.0, 2.2, 1.0], t: [3.6, q * 4.6, 9.6], r: [q * 0.3, 0.4, -q * 0.4], crack: 1, cd: [1, 0, 0.5], gg: 'chest' });
    /* ---- the head: small, low between the shoulders; a heavy brow, deep sockets, broad cheeks, a squared jaw ---- */
    part('head', { e: [2.1, 1.95, 2.0], t: [0.1, 0, 0.5], bev: 0.25, eyes: [[2.25, 0.82, 0.38], [2.25, -0.82, 0.38]] });
    part('head', { e: [0.85, 2.15, 0.62], t: [1.95, 0, 1.55], r: [0, 0.3, 0], bev: 0.3, dep: 0.4, moss: { d: [0, 0, 1], th: 0.6, p: 0.5 } });   // the brow
    for (const [q] of SIDES) part('head', { e: [0.95, 0.8, 0.85], t: [1.85, q * 1.6, -0.75], r: [0, 0, q * 0.45], dep: 0.2 });   // the cheeks
    part('head', { e: [1.25, 1.55, 0.85], t: [1.55, 0, -1.45], r: [0, -0.1, 0], bx: 0.85, by: 0.85, dep: 0.25, seam: [[[2.78, -0.75, -1.35], [2.84, 0, -1.28], [2.78, 0.75, -1.35]]] });   // the jaw
    part('head', { e: [0.55, 0.42, 0.5], t: [2.4, 0, 0.1], r: [0, 0.2, 0], dep: 0.3 });   // the muzzle ridge
    for (const [q] of SIDES) part('head', { e: [0.95, 0.9, 0.75], t: [-0.6, q * 0.85, 2.55], r: [0.3 * q, -0.2, 0.5], moss: { d: [0, 0, 1], th: 0.5, p: 0.6 } });   // the crown stones
    /* ---- shoulders: the largest masses after the torso, overlapping boulders with broad faces and blunt projections ---- */
    for (const [q, s] of SIDES) {
      const b = 'clav' + s, k = SHK;
      part(b, { e: [3.7 * k, 3.4 * k, 3.1 * k], t: [-0.2, q * 1.1 * k, 2.1 * k], r: [q * 0.35, 0.08, 0], bev: 0.22, bevC: 0.34, chips: 3, crack: 1, cd: [0.4, q, 0.4], gg: 'sh', moss: { d: [0.1, q * 0.35, 1], th: 0.35, p: 0.95 }, clumps: 3, eng: 1, ed: [0.5, q * 0.6, 0.6] });
      part(b, { e: [2.5 * k, 2.6 * k, 2.3 * k], t: [1.9 * k, q * 2.3 * k, -0.4], r: [q * 0.6, -0.2, q * 0.2], crack: 1, cd: [1, q * 0.4, 0], gg: 'sh', moss: { d: [0.2, q, 0.8], th: 0.5, p: 0.7 } });
      part(b, { e: [2.4 * k, 2.2 * k, 1.9 * k], t: [-2.2 * k, q * 2.0 * k, 0.4], r: [q * 0.4, 0.25, -q * 0.2], moss: { d: [-0.3, q * 0.5, 1], th: 0.4, p: 0.8 } });   // the back of the shoulder
      part(b, { e: [0.75, 0.75, 1.3], t: [-1.2 * k, q * 2.6 * k, 5.0 * k], r: [q * 0.5, -0.3, 0], tx: 0.35, bevC: 0.2 });   // blunt projections
      part(b, { e: [0.6, 0.6, 1.05], t: [1.2 * k, q * 1.3 * k, 4.8 * k], r: [q * 0.25, 0.35, 0], tx: 0.35, bevC: 0.2 });
      if (T3) {   // Celestial: the layered shoulder stones
        part(b, { e: [3.0, 2.7, 0.95], t: [-1.0, q * 2.2, 5.6], r: [q * 0.5, 0.15, q * 0.1], crack: 1, cd: [0, 0, 1], gg: 'sh', eng: 1, ed: [0, q * 0.3, 1], moss: { d: [0, q * 0.2, 1], th: 0.6, p: 0.5 } });
        part(b, { e: [2.4, 2.2, 0.85], t: [2.2, q * 3.6, 3.0], r: [q * 0.85, -0.2, q * 0.3], crack: 1, cd: [0.5, q, 0.5], gg: 'sh' });
        part(b, { e: [0.5, 0.5, 1.5], t: [-2.6, q * 3.6, 5.6], r: [q * 0.7, -0.4, 0], tx: 0.3, bevC: 0.2 });
      }
    }
    /* ---- arms: thick upper arms, an elbow knob, forearms that grow toward the wrist, sheathed in long plates ---- */
    for (const [q, s] of SIDES) {
      const k = FAK;
      part('ua' + s, { e: [1.9, 1.9, 3.1], t: [0, 0, -2.8], mat: DK, tex: false });
      part('ua' + s, { e: [1.8, 1.0, 2.7], t: [0.2, q * 1.6, -3.0], r: [q * 0.1, 0, 0], moss: { d: [0, q, 0.5], th: 0.55, p: 0.7 } });
      part('ua' + s, { e: [1.0, 1.7, 2.6], t: [1.55, 0, -3.1], r: [0, 0.08, 0] });
      part('ua' + s, { e: [0.9, 1.6, 2.4], t: [-1.5, 0, -2.8], r: [0, -0.06, 0] });
      part('fa' + s, { e: [1.55, 1.55, 1.3], t: [-0.6, 0, 0.1], r: [0.2, 0.3, 0], bevC: 0.35 });   // the elbow
      part('fa' + s, { e: [1.9 * k, 1.9 * k, 3.4], t: [0, 0, -3.5], bx: 1.3, by: 1.3, mat: DK, tex: false });
      part('fa' + s, { e: [2.15 * k, 1.05 * k, 3.3], t: [0, q * 2.35 * k, -3.7], bx: 1.25, by: 1.0, r: [q * 0.05, 0, 0], crack: 1, cd: [0, q, 0], gg: 'arm', moss: { d: [0.3, q, 0.6], th: 0.4, p: 0.9 }, clumps: q > 0 ? 1 : 0 });   // outer plate
      part('fa' + s, { e: [1.05 * k, 2.0 * k, 3.2], t: [2.25 * k, 0, -3.8], bx: 1.0, by: 1.25, r: [0, 0.06, 0], crack: 1, cd: [1, 0, 0], gg: 'arm', moss: { d: [1, 0, 0.4], th: 0.75, p: 0.35 } });   // front plate
      part('fa' + s, { e: [1.0 * k, 1.9 * k, 3.0], t: [-2.2 * k, 0, -3.5], bx: 1.0, by: 1.2, r: [0, -0.06, 0] });   // back plate
      part('fa' + s, { e: [1.7 * k, 0.9 * k, 2.8], t: [0, -q * 2.1 * k, -3.4], bx: 1.2, by: 1.0 });   // inner plate
      part('fa' + s, { e: [2.55 * k, 2.55 * k, 0.95], t: [0, 0, -6.95], r: [0.08, -0.05, 0.3], bevC: 0.38, crack: 1, cd: [1, 0, 0], gg: 'arm' });   // the wrist cuff
      if (T2) part('fa' + s, { e: [1.5, 0.8, 2.0], t: [1.2 * k, q * 2.6 * k, -2.0], r: [q * 0.3, 0.2, q * 0.6], crack: 1, cd: [0, q, 0], gg: 'arm' });
    }
    /* ---- hands: a palm, a back plate, four fingers of three thick segments and a thumb of two; they open and close ---- */
    for (const [q, s] of SIDES) {
      part('hand' + s, { e: [2.3, 1.35, 1.9], t: [0, 0, -1.9], bev: 0.26, gg: 'fist', crack: 1, cd: [0, q, 0] });
      part('hand' + s, { e: [2.0, 0.75, 1.55], t: [0, q * 1.3, -1.95], r: [q * 0.08, 0, 0], gg: 'fist', moss: { d: [0, q, 0.4], th: 0.6, p: 0.5 } });
      for (let i = 0; i < 4; i++) for (let k = 0; k < 3; k++) { const L = D0.FL[k] / 2, w = k === 2 ? 0.56 : 0.64; part('f' + i + k + s, { e: [w, w + 0.06, L * (k === 2 ? 1.0 : 1.08)], t: [0, k === 0 ? q * 0.08 : 0, -L], bev: 0.28, bevC: 0.4, chips: k === 2 ? 1 : 0, tex: false, gg: 'fist', bx: k === 2 ? 0.75 : 1, by: k === 2 ? 0.8 : 1 }); }
      part('t0' + s, { e: [0.75, 0.8, 1.0], t: [0, 0, -0.95], bev: 0.28, bevC: 0.4, chips: 0, tex: false, gg: 'fist' });
      part('t1' + s, { e: [0.62, 0.68, 0.78], t: [0, 0, -0.72], bx: 0.75, bev: 0.3, bevC: 0.42, chips: 1, tex: false, gg: 'fist' });
    }
    /* ---- legs: thick thighs, large angular knees, short powerful shins, broad feet with chunky toes ---- */
    for (const [q, s] of SIDES) {
      part('th' + s, { e: [2.3, 2.3, 2.8], t: [0, 0, -2.7], mat: DK, tex: false });
      part('th' + s, { e: [1.05, 2.15, 2.6], t: [2.0, 0, -2.6], r: [0, 0.1, 0], moss: { d: [0.5, 0, 1], th: 0.5, p: 0.4 } });
      part('th' + s, { e: [1.95, 1.0, 2.5], t: [0, q * 2.15, -2.5], moss: { d: [0, q, 0.6], th: 0.5, p: 0.8 } });
      part('sh' + s, { e: [1.55, 1.75, 1.6], t: [1.15, 0, -0.15], r: [0, 0.35, 0], tx: 0.75, bevC: 0.35, crack: 1, cd: [1, 0, 0.3], gg: 'leg', moss: { d: [0, 0, 1], th: 0.5, p: 0.6 } });   // the knee
      part('sh' + s, { e: [1.9, 1.9, 2.4], t: [0, 0, -2.45], bx: 1.15, by: 1.15, mat: DK, tex: false });
      part('sh' + s, { e: [0.9, 1.75, 2.1], t: [1.7, 0, -2.6], bx: 1.1, by: 1.1, r: [0, 0.05, 0] });
      part('sh' + s, { e: [1.5, 0.85, 2.0], t: [0, q * 1.85, -2.7], bx: 1.1 });
      part('ft' + s, { e: [2.55, 2.05, 0.72], t: [0.9, 0, -0.62], tx: 0.92, bevC: 0.3 });
      part('ft' + s, { e: [1.6, 1.65, 0.9], t: [-0.4, 0, 0.2], bevC: 0.35 });
      for (let k = 0; k < 3; k++) part('ft' + s, { e: [0.78, 0.6, 0.52], t: [3.55, (k - 1) * 1.3, -0.78], r: [0, 0.18, (k - 1) * 0.22], bev: 0.3, bevC: 0.4, chips: 0, tex: false });
    }
    /* ---- the Worldbreaker gauntlets: rocks that lock round each fist (hidden until they assemble), a glowing core ---- */
    for (const [q, s] of SIDES) {
      const n = T3 ? 10 : T2 ? 9 : 8, gk = T3 ? 1.25 : T2 ? 1.12 : 1, cen = [0, 0, -2.9];
      parts.push({ b: 'hand' + s, core: true, t: cen, gaunt: 1, dep: 0, rr: 2.3 * gk, gi: 0, gs: [(q * 0.3), 0.6] });
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + q * 0.4, el = (i % 3 - 1) * 0.55, d = [Math.cos(a) * Math.cos(el), Math.sin(a) * Math.cos(el), Math.sin(el)], rad = 2.55 * gk;
        const P = part('hand' + s, { e: [1.25 * gk, 1.05 * gk, 0.9 * gk], t: add(cen, add(mul(d, rad), [0, 0, -0.2])), r: [Math.atan2(d[1], d[2]) * 0.7, Math.atan2(d[0], 1) * 0.9, a], mat: T3 && i % 3 === 1 ? 'crys' : 'gaunt', gaunt: 1, crack: T3 && i % 3 === 1 ? 0 : 1, cd: d, gg: 'gaunt', bevC: 0.38, chips: 2 });
        P.gi = i / n; P.gd = d;
      }
      // the knuckle cap: a heavy slab over the front of the fist
      const P = part('hand' + s, { e: [1.4 * gk, 2.0 * gk, 1.8 * gk], t: [0, 0, -5.4 * gk], r: [0, 0, 0], mat: 'gaunt', gaunt: 1, crack: 2, cd: [0, 0, -1], gg: 'gaunt', bevC: 0.35 }); P.gi = 0.95; P.gd = [0, 0, -1];
    }
    const M = { parts, D: D0, tier };
    return (MODELS[tier] = M);
  }

  /* ================= painting ================= */
  /* one stone: Rm, tm its turn and place in the model; VW the view (X, Y the anchor on screen, A the model -> screen map,
     Vm, Lm the view and the light in the model's space, k pixels per unit, glow by region) */
  function paintPart(c, P, Rm, tm, VW, PT) {
    const m = P.m, A = VW.A, nv = m.v.length, nf = m.f.length, sx = P.sx, sy = P.sy;
    // the part's own map to the screen (2 x 3) and its offset
    const Q0 = A[0] * Rm[0] + A[1] * Rm[3] + A[2] * Rm[6], Q1 = A[0] * Rm[1] + A[1] * Rm[4] + A[2] * Rm[7], Q2 = A[0] * Rm[2] + A[1] * Rm[5] + A[2] * Rm[8];
    const Q3 = A[3] * Rm[0] + A[4] * Rm[3] + A[5] * Rm[6], Q4 = A[3] * Rm[1] + A[4] * Rm[4] + A[5] * Rm[7], Q5 = A[3] * Rm[2] + A[4] * Rm[5] + A[5] * Rm[8];
    const qx = VW.X + A[0] * tm[0] + A[1] * tm[1] + A[2] * tm[2], qy = VW.Y + A[3] * tm[0] + A[4] * tm[1] + A[5] * tm[2];
    for (let i = 0; i < nv; i++) { const v = m.v[i]; sx[i] = qx + Q0 * v[0] + Q1 * v[1] + Q2 * v[2]; sy[i] = qy + Q3 * v[0] + Q4 * v[1] + Q5 * v[2]; }
    const Vm = VW.Vm, Lm = VW.Lm, vr = [Rm[0] * Vm[0] + Rm[3] * Vm[1] + Rm[6] * Vm[2], Rm[1] * Vm[0] + Rm[4] * Vm[1] + Rm[7] * Vm[2], Rm[2] * Vm[0] + Rm[5] * Vm[1] + Rm[8] * Vm[2]];
    const lr = [Rm[0] * Lm[0] + Rm[3] * Lm[1] + Rm[6] * Lm[2], Rm[1] * Lm[0] + Rm[4] * Lm[1] + Rm[7] * Lm[2], Rm[2] * Lm[0] + Rm[5] * Lm[1] + Rm[8] * Lm[2]], zr = [Rm[6], Rm[7], Rm[8]];
    const vis = P.vis, band = P.band, VL = P.vl || (P.vl = new Int16Array(nf)); let any = 0;
    for (let i = 0; i < nf; i++) { const n = m.fn[i], vd = n[0] * vr[0] + n[1] * vr[1] + n[2] * vr[2]; vis[i] = vd > 0.015 ? 1 : 0; if (!vis[i]) continue; VL[any++] = i; const l = n[0] * lr[0] + n[1] * lr[1] + n[2] * lr[2], nz = n[0] * zr[0] + n[1] * zr[1] + n[2] * zr[2]; band[i] = nz < -0.42 && l < 0.3 ? 0 : l > 0.52 ? 3 : l > 0.06 ? 2 : 1; }
    if (!any) return;
    const path = i => { const f = m.f[i]; c.moveTo(sx[f[0]], sy[f[0]]); for (let k = 1; k < f.length; k++) c.lineTo(sx[f[k]], sy[f[k]]); c.closePath(); };
    const MT = MATS[P.mat] || MATS.stone, al = VW.alpha == null ? 1 : VW.alpha;
    c.globalAlpha = al;
    const MV = MT[P.sid & 1];
    const nb = [0, 0, 0, 0]; for (let j = 0; j < any; j++) nb[band[VL[j]]]++;
    for (let b = 0; b < 4; b++) { if (!nb[b]) continue; c.beginPath(); for (let j = 0; j < any; j++) { const i = VL[j]; if (band[i] === b) path(i); } c.fillStyle = MV[b]; c.fill(); }
    // the surface: one texture map per local axis (the faces facing mostly along it), turning with the stone
    const ku = VW.texK;
    if (P.tex && PT && VW.k * m.rad > 7) {
      const QX = [Q0, Q1, Q2], QY = [Q3, Q4, Q5], o0 = (P.sid * 37) % 256, o1 = (P.sid * 91) % 256;
      // (at most two maps: the axis the most visible faces look along takes every face but those of a strong second one)
      const wg = [0, 0, 0]; for (let i = 0; i < nf; i++) if (vis[i]) { const n = m.fn[i]; wg[P.grp[i]] += m.area[i] * (n[0] * vr[0] + n[1] * vr[1] + n[2] * vr[2]); }
      const g1 = wg[0] >= wg[1] && wg[0] >= wg[2] ? 0 : wg[1] >= wg[2] ? 1 : 2, w2 = wg.map((w, i) => (i === g1 ? -1 : w)), g2 = w2[0] >= w2[1] && w2[0] >= w2[2] ? 0 : w2[1] >= w2[2] ? 1 : 2, two = wg[g2] > wg[g1] * 0.45 && m.rad * VW.k > 14;
      for (const gx of two ? [g1, g2] : [g1]) {
        let n = 0; c.beginPath(); for (let i = 0; i < nf; i++) if (vis[i] && (P.grp[i] === gx || (gx === g1 && !(two && P.grp[i] === g2)))) { path(i); n++; } if (!n) continue;
        const ia = gx === 0 ? 1 : 0, ib = gx === 2 ? 1 : 2;
        PT.stone.setTransform(new DOMMatrix([QX[ia] * ku, QY[ia] * ku, QX[ib] * ku, QY[ib] * ku, qx + (QX[ia] * o0 + QX[ib] * o1) * ku, qy + (QY[ia] * o0 + QY[ib] * o1) * ku]));
        c.globalAlpha = al * P.texA; c.fillStyle = PT.stone; c.fill();
      }
      c.globalAlpha = al;
    }
    // moss: the mossy faces, a patchy cushion in the face's own tone
    if (PT && VW.k > 0.9 && !VW.noMoss && P.nm) {
      const QX = [Q0, Q1, Q2], QY = [Q3, Q4, Q5], mk2 = ku * 0.8, o0 = (P.sid * 53) % 256;
      for (let gx = 0; gx < 3; gx++) for (let bd = 0; bd < 3; bd++) {
        let n = 0; c.beginPath(); for (let i = 0; i < nf; i++) if (P.moss[i] && vis[i] && P.grp[i] === gx && Math.max(0, band[i] - 1) === bd) { path(i); n++; } if (!n) continue;
        const ia = gx === 0 ? 1 : 0, ib = gx === 2 ? 1 : 2, pt = PT.moss[bd];
        pt.setTransform(new DOMMatrix([QX[ia] * mk2, QY[ia] * mk2, QX[ib] * mk2, QY[ib] * mk2, qx + QX[ia] * o0 * mk2, qy + QY[ia] * o0 * mk2])); c.fillStyle = pt; c.fill();
      }
    }
    // worn edges (a lit facet against a darker one) and the ink round the silhouette
    const lw = Math.max(0.7, VW.k * 0.16), wn = new Path2D(), ink = new Path2D(); let nw = 0;
    const EA = m.ea || (m.ea = Int32Array.from(m.e.flat()));
    for (let ei = 0; ei < EA.length; ei += 4) { const a = EA[ei], b = EA[ei + 1], f1 = EA[ei + 2], f2 = EA[ei + 3];
      const v1 = vis[f1] === 1, v2 = f2 >= 0 && vis[f2] === 1;
      if (v1 !== v2) { ink.moveTo(sx[a], sy[a]); ink.lineTo(sx[b], sy[b]); }
      else if (v1 && v2 && band[f1] !== band[f2] && (band[f1] === 3 || band[f2] === 3)) { wn.moveTo(sx[a], sy[a]); wn.lineTo(sx[b], sy[b]); nw++; }
    }
    if (nw && VW.k * m.rad > 9 && !VW.noWorn) { c.strokeStyle = P.mat === 'dark' ? 'rgba(120,110,96,0.35)' : 'rgba(222,214,196,0.42)'; c.lineWidth = lw * 0.75; c.stroke(wn); }
    c.lineCap = 'square'; if (!VW.noInk) { c.strokeStyle = INK; c.lineWidth = lw; c.stroke(ink); } c.lineCap = 'butt';
    // fractures: dark always; golden while the region glows (Celestial: the light moves inside them)
    const tp = (p, o) => { o[0] = qx + Q0 * p[0] + Q1 * p[1] + Q2 * p[2]; o[1] = qy + Q3 * p[0] + Q4 * p[1] + Q5 * p[2]; return o; }, tmp = [0, 0];
    const line = L => { c.beginPath(); L.forEach((p, j) => { tp(p, tmp); j ? c.lineTo(tmp[0], tmp[1]) : c.moveTo(tmp[0], tmp[1]); }); };
    if (P.cr.length) {
      const gv = VW.glow ? (VW.glow[P.gg] || 0) : 0;
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (const cr of P.cr) { if (!vis[cr.fi]) continue; line(cr.pts); c.strokeStyle = 'rgba(14,10,8,0.85)'; c.lineWidth = lw * (cr.br ? 0.8 : 1.1); c.stroke();
        if (gv > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * gv * 0.35; c.strokeStyle = AMBER; c.lineWidth = lw * 3.2; c.stroke(); c.globalAlpha = al * gv; c.strokeStyle = GOLD; c.lineWidth = lw * 1.1; c.stroke();
          if (VW.tier >= 3) { c.setLineDash([VW.k * 0.9, VW.k * 2.2]); c.lineDashOffset = -(VW.t * 3 + cr.ph * 6) * VW.k; c.strokeStyle = EMBER; c.lineWidth = lw * 0.8; c.stroke(); c.setLineDash([]); }
          else if (gv > 0.5) { c.globalAlpha = al * (gv - 0.5) * 1.6; c.strokeStyle = EMBER; c.lineWidth = lw * 0.5; c.stroke(); }
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; } }
    }
    if (P.en.length) { const gv = VW.glow ? (VW.glow[P.gg] || 0) : 0; c.lineCap = 'round'; c.lineJoin = 'round';
      for (const en of P.en) { if (!vis[en.fi]) continue; line(en.pts); c.strokeStyle = 'rgba(14,10,8,0.7)'; c.lineWidth = lw * 1.2; c.stroke(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * (0.3 + 0.7 * gv); c.strokeStyle = GOLD; c.lineWidth = lw * 0.6; c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = al; } }
    if (P.seam.length) for (const L of P.seam) { line(L); c.strokeStyle = 'rgba(10,8,6,0.9)'; c.lineWidth = lw * 1.3; c.stroke(); }
    // the eyes: deep sockets, small white-green lights (recorded for their halo)
    if (P.eyes) { const fwd = Rm[0] * Vm[0] + Rm[3] * Vm[1] + Rm[6] * Vm[2]; if (fwd > -0.25) for (const e of P.eyes) { tp(e, tmp); const r = VW.k * 0.62, f = cl((fwd + 0.25) / 0.5);
      c.globalAlpha = al * f; c.fillStyle = '#060404'; c.beginPath(); c.ellipse(tmp[0], tmp[1], r, r * 0.72, 0, 0, TAU); c.fill();
      const ek = VW.eye == null ? 1 : VW.eye; if (ek > 0.02) { c.fillStyle = rgba(EYEG, 0.9 * ek); c.beginPath(); c.arc(tmp[0], tmp[1] + r * 0.05, r * 0.42, 0, TAU); c.fill(); c.fillStyle = rgba(EYE, ek); c.beginPath(); c.arc(tmp[0], tmp[1] + r * 0.05, r * 0.24, 0, TAU); c.fill(); }
      c.globalAlpha = al; if (VW.out) VW.out.eyes.push([tmp[0], tmp[1], f]); } }
    if (P.cl.length && VW.k > 1.4) for (const q of P.cl) { if (!vis[q.fi]) continue; tp(q.p, tmp); const w = VW.k * 2.1 * q.s, h = w * 0.66; c.drawImage(clumpSpr(), tmp[0] - w / 2, tmp[1] - h * 0.7, w, h); }
  }

  /* the golem with its feet at screen (X, Y): T px a tile, sc tiles a unit, yaw its facing on the floor (radians, 0 =
     +x), P the pose; o: tier, glow {chest, sh, arm, fist, leg, gaunt}, eye (0..1), gaunt (assembly 0..1), gbreak
     (gauntlets breaking 0..), t, out (filled with screen points). prepGolem poses and sorts the stones; paintGolem paints
     them in order, as many as a time budget allows (a bake can be spread over several frames) */
  function prepGolem(X, Y, T, sc, yaw, P, o) {
    o = o || {}; const M = model(o.tier || 1), B = rig(P, M.D), cy = Math.cos(yaw), sy = Math.sin(yaw), k = T * sc;
    const A = [k * cy, -k * sy, 0, k * sy * SE, k * cy * SE, -k * CE];
    const Vm = [sy * CE, cy * CE, SE], Lm = [cy * LDW[0] + sy * LDW[1], -sy * LDW[0] + cy * LDW[1], LDW[2]];
    const out = o.out || {}; out.eyes = []; out.bb = [1e9, 1e9, -1e9, -1e9];
    const VW = { X, Y, A, Vm, Lm, k, glow: o.glow, tier: M.tier, t: o.t || 0, alpha: 1, eye: o.eye, out, texK: 1 / 26, noInk: o.noInk, noMoss: o.noMoss, noWorn: o.noWorn };
    const list = [], gA = o.gaunt || 0, gB = o.gbreak || 0;
    for (const Pt of M.parts) {
      if (Pt.lazy) Pt.fin();
      let gk = 1;
      if (Pt.gaunt) { if (gA <= 0.001) continue; gk = cl((gA - Pt.gi * 0.45) / 0.55); if (gk <= 0.001 || gB > 1.2) continue; }
      const b = B[Pt.b]; let Rm = Pt.m ? mm(b.R, Pt.R) : b.R, tm = add(b.t, mv(b.R, Pt.t));
      if (Pt.gaunt && Pt.m) {
        // assembling: lifted from the floor beside the feet, spiralling in, tumbling, locking on
        if (gk < 1) { const e = 1 - Math.pow(1 - gk, 2.2), sa = Pt.gi * TAU + (Pt.b === 'handL' ? 0 : Math.PI), r0 = 12 + 6 * Pt.gi, p0 = [Math.cos(sa + (1 - e) * 2.5) * r0 * (1 - e), Math.sin(sa + (1 - e) * 2.5) * r0 * (1 - e), 0];
          tm = add(GK.lerp3([p0[0], p0[1], 0.6], tm, e), [0, 0, Math.sin(e * Math.PI) * 4]); Rm = mm(Rm, GK.axisR([1, 0.4, 0.2], (1 - e) * 5)); }
        // breaking: thrown off outward and down, tumbling
        if (gB > 0) { const d = mv(b.R, Pt.gd), u = gB; tm = add(tm, [d[0] * u * 7, d[1] * u * 7, d[2] * u * 4 + u * 5 - u * u * 18]); Rm = mm(Rm, GK.axisR([0.3, 1, 0.5], u * 4)); if (tm[2] < 0.5) tm[2] = 0.5; }
      }
      const cen = Pt.m ? add(tm, mv(Rm, Pt.m.cen)) : tm;
      list.push([Vm[0] * cen[0] + Vm[1] * cen[1] + Vm[2] * cen[2] + Pt.dep, Pt, Rm, tm, gk]);
    }
    list.sort((p, q) => p[0] - q[0]);
    // the screen box of it all (for a bake's canvas): every corner projected
    const bx = [1e9, 1e9, -1e9, -1e9];
    for (const [, Pt, Rm, tm] of list) { if (!Pt.m) { const p = [X + A[0] * tm[0] + A[1] * tm[1] + A[2] * tm[2], Y + A[3] * tm[0] + A[4] * tm[1] + A[5] * tm[2]], r = (Pt.rr || 3) * k * 1.6; bx[0] = Math.min(bx[0], p[0] - r); bx[2] = Math.max(bx[2], p[0] + r); bx[1] = Math.min(bx[1], p[1] - r); bx[3] = Math.max(bx[3], p[1] + r); continue; }
      const Q0 = A[0] * Rm[0] + A[1] * Rm[3] + A[2] * Rm[6], Q1 = A[0] * Rm[1] + A[1] * Rm[4] + A[2] * Rm[7], Q2 = A[0] * Rm[2] + A[1] * Rm[5] + A[2] * Rm[8], Q3 = A[3] * Rm[0] + A[4] * Rm[3] + A[5] * Rm[6], Q4 = A[3] * Rm[1] + A[4] * Rm[4] + A[5] * Rm[7], Q5 = A[3] * Rm[2] + A[4] * Rm[5] + A[5] * Rm[8], qx = X + A[0] * tm[0] + A[1] * tm[1] + A[2] * tm[2], qy = Y + A[3] * tm[0] + A[4] * tm[1] + A[5] * tm[2];
      for (const v of Pt.m.v) { const x = qx + Q0 * v[0] + Q1 * v[1] + Q2 * v[2], y = qy + Q3 * v[0] + Q4 * v[1] + Q5 * v[2]; if (x < bx[0]) bx[0] = x; if (x > bx[2]) bx[2] = x; if (y < bx[1]) bx[1] = y; if (y > bx[3]) bx[3] = y; } }
    // the points the effects need: fists, feet, head, chest (on screen and in the model)
    const sp = p => [X + A[0] * p[0] + A[1] * p[1] + A[2] * p[2], Y + A[3] * p[0] + A[4] * p[1] + A[5] * p[2]];
    for (const [, s] of SIDES) { const h = B['hand' + s], fp = add(h.t, mv(h.R, [0, 0, -3.8])); out['fist' + s] = sp(fp); out['fist' + s + 'm'] = fp; out['foot' + s] = sp(B['ft' + s].t); out['foot' + s + 'm'] = B['ft' + s].t; }
    out.head = sp(B.head.t); out.chest = sp(add(B.chest.t, mv(B.chest.R, [3, 0, 6.5]))); out.chestm = add(B.chest.t, mv(B.chest.R, [3, 0, 6.5]));
    return { list, i: 0, VW, o, X, Y, A, Vm, k, gB, out, bx };
  }
  function paintGolem(c, J, until) {
    const { list, VW, o, X, Y, A, Vm, k, gB, out } = J, PT = o.noTex ? null : pats(c);
    c.save(); c.lineJoin = 'miter'; c.lineCap = 'butt'; c.miterLimit = 2;
    while (J.i < list.length) {
      const [, Pt, Rm, tm, gk] = list[J.i++];
      if (Pt.ey) {   // the eyes: deep dark sockets under the brow, small white-green lights (recorded for their halo)
        const fw = Rm[0] * Vm[0] + Rm[3] * Vm[1] + Rm[6] * Vm[2]; if (fw < -0.2) continue; const f = cl((fw + 0.2) / 0.45), ek = o.eye == null ? 1 : o.eye, r = k * 0.7;
        for (const e of Pt.eyesP) { const p = add(tm, mv(Rm, e)), ex = X + A[0] * p[0] + A[1] * p[1] + A[2] * p[2], ey = Y + A[3] * p[0] + A[4] * p[1] + A[5] * p[2];
          c.globalAlpha = f; c.fillStyle = '#050303'; c.beginPath(); c.ellipse(ex, ey, r, r * 0.68, 0, 0, TAU); c.fill();
          if (ek > 0.02) { c.fillStyle = rgba(EYEG, 0.85 * ek); c.beginPath(); c.arc(ex, ey + r * 0.06, r * 0.46, 0, TAU); c.fill(); c.fillStyle = rgba(EYE, ek); c.beginPath(); c.arc(ex, ey + r * 0.06, r * 0.26, 0, TAU); c.fill(); }
          out.eyes.push([ex, ey, f]); }
        c.globalAlpha = 1; continue;
      }
      if (Pt.core) {   // the gauntlet's core: molten amber light between the plates
        const sx2 = X + A[0] * tm[0] + A[1] * tm[1] + A[2] * tm[2], sy2 = Y + A[3] * tm[0] + A[4] * tm[1] + A[5] * tm[2], r = Pt.rr * k * (0.4 + 0.6 * gk) * (gB > 0 ? Math.max(0, 1 - gB * 1.5) : 1);
        if (r > 0.5) { const gv = o.glow ? (o.glow.gaunt || 0) : 0; c.globalAlpha = 0.95; c.fillStyle = gv > 0.5 ? HONEY : AMBER; c.beginPath(); c.arc(sx2, sy2, r * 0.82, 0, TAU); c.fill(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.5 * gv; blitSized(c, glowSprite(GOLD), sx2 - r * 1.6, sy2 - r * 1.6, r * 3.2, r * 3.2); c.globalAlpha = gv; blitSized(c, glowSprite(EMBER), sx2 - r * 0.7, sy2 - r * 0.7, r * 1.4, r * 1.4); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
          const bb = out.bb; bb[0] = Math.min(bb[0], sx2 - r * 1.6); bb[2] = Math.max(bb[2], sx2 + r * 1.6); bb[1] = Math.min(bb[1], sy2 - r * 1.6); bb[3] = Math.max(bb[3], sy2 + r * 1.6); }
        continue;
      }
      paintPart(c, Pt, Rm, tm, VW, PT);
      const bb = out.bb, xs = Pt.sx, ys = Pt.sy; for (let i = 0; i < xs.length; i++) { if (xs[i] < bb[0]) bb[0] = xs[i]; if (xs[i] > bb[2]) bb[2] = xs[i]; if (ys[i] < bb[1]) bb[1] = ys[i]; if (ys[i] > bb[3]) bb[3] = ys[i]; }
      if (until && performance.now() > until) break;
    }
    c.restore();
    return J.i >= list.length;
  }
  function drawGolem(c, X, Y, T, sc, yaw, P, o) { const J = prepGolem(X, Y, T, sc, yaw, P, o); paintGolem(c, J, 0); return J.out; }

  /* ================= the poses ================= */
  // walking: the torso shifts over the planted foot before the other leg swings through; arms swing late
  function walkPose(ph, amt) {
    const p = KP({}), s = Math.sin(TAU * ph), co = Math.cos(TAU * ph);
    for (const [q, sd] of SIDES) { const f = ph + (q > 0 ? 0 : 0.5), sw = Math.sin(TAU * f), lift = Math.max(0, Math.cos(TAU * f));
      p['l' + sd + 'sw'] = 0.1 + 0.4 * sw; p['l' + sd + 'kn'] = 0.32 + 0.85 * lift * lift + 0.12 * Math.max(0, -sw); p['l' + sd + 'fp'] = -0.18 * lift + 0.12 * Math.max(0, -Math.cos(TAU * f + 0.6));
      p['a' + sd + 'sw'] = BASE.aLsw - 0.3 * Math.sin(TAU * f - 0.55); p['a' + sd + 'el'] = BASE.aLel + 0.14 * Math.max(0, Math.sin(TAU * f - 0.55)); p['a' + sd + 'ab'] = 0.2 + 0.04 * lift; }
    p.ry = -0.55 * co; p.hipR = 0.06 * co; p.roll = -0.04 * co; p.tw = 0.1 * s; p.hipY = -0.07 * s; p.hP = BASE.hP + 0.03 * Math.sin(2 * TAU * ph); p.lean = BASE.lean + 0.04;
    return amt >= 1 ? p : blendP(KP({}), p, amt);
  }
  const idlePose = t => KP({ lean: BASE.lean + 0.025 * Math.sin(t * 1.3), hP: BASE.hP - 0.02 * Math.sin(t * 1.3 + 0.4), aLcu: 0.55 + 0.08 * Math.sin(t * 0.9), aRcu: 0.55 + 0.08 * Math.sin(t * 0.9 + 2), aLsw: BASE.aLsw + 0.02 * Math.sin(t * 1.3 - 0.6), aRsw: BASE.aRsw + 0.02 * Math.sin(t * 1.3 - 0.7), rz: -0.08 * (1 + Math.sin(t * 1.3)) });
  // the heavy punch (right arm; mirrored for the left): pull the shoulder back, twist, drive the fist forward
  const PUNCH = (() => { const wind = KP({ tw: -0.5, hipY: -0.16, lean: 0.24, rx: -0.6, aRsw: -0.45, aRab: 0.32, aRel: 1.75, aRcu: 1, aRwp: 0.2, aLsw: 0.32, aLel: 0.85, aLcu: 0.85, lLsw: 0.32, lLkn: 0.38, lRsw: -0.1 });
    const hit = KP({ tw: 0.5, hipY: 0.18, lean: 0.5, rx: 0.9, aRsw: 1.32, aRab: 0.1, aRel: 0.08, aRcu: 1, aRwr: 1.2, aRwp: 0.1, aLsw: 0.05, aLab: 0.3, aLel: 0.95, aLcu: 0.9, lLsw: 0.48, lLkn: 0.5, lRsw: -0.22, lRkn: 0.35, hP: -0.2 });
    return { T: 1.05, hit: 0.5, KF: [[0, KP({})], [0.38, wind], [0.5, hit, 'in'], [0.66, Object.assign({}, hit, { rx: 1.2, lean: 0.44 })], [1.05, KP({})]] }; })();
  // the sweeping backhand (left arm): rotate through the hips and shoulders, one arm through a broad arc
  const BACKHAND = (() => { const wind = KP({ tw: -0.62, hipY: -0.2, lean: 0.3, aLsw: 1.0, aLab: -0.5, aLel: 1.35, aLcu: 1, aLtw: 0.4, aRsw: 0.0, aRel: 0.6, lRsw: 0.3, lRkn: 0.42 });
    const mid = KP({ tw: 0.1, hipY: 0.05, lean: 0.38, aLsw: 1.35, aLab: 0.32, aLel: 0.3, aLcu: 1, aLtw: 0.1, aLwr: -0.6, aRsw: 0.2, aRel: 0.7, lLsw: 0.25, lLkn: 0.4 });
    const fol = KP({ tw: 0.68, hipY: 0.26, lean: 0.32, aLsw: 0.95, aLab: 1.2, aLel: 0.18, aLcu: 1, aLwr: -0.9, aRsw: 0.35, aRel: 0.8, lLsw: 0.3, lLkn: 0.45, lRsw: -0.1 });
    return { T: 1.2, hit: 0.56, KF: [[0, KP({})], [0.42, wind], [0.56, mid, 'in'], [0.72, fol, 'out'], [1.2, KP({})]] }; })();
  // the ground slam: both fists raised, held a beat, smashed into the floor
  const SLAM = (() => { const up = both(legs(KP({ lean: -0.26, hipP: -0.04, hP: -0.5, rz: 0.4 }), 'kn', 0.2), 'sw', 2.75); both(up, 'ab', 0.22); both(up, 'el', 0.55); both(up, 'cu', 1); both(up, 'wp', -0.2);
    const hold = Object.assign({}, up, { lean: -0.32, hP: -0.55 });
    const down = both(both(both(both(legs(legs(KP({ lean: 0.7, hipP: 0.3, hP: 0.05, rz: -2.0 }), 'kn', 0.4), 'sw', 0.4), 'sw', 0.85), 'ab', -0.6), 'el', 0.1), 'cu', 1); both(down, 'wp', 0.3);
    return { T: 1.6, hit: 0.86, KF: [[0, KP({})], [0.5, up, 'out'], [0.68, hold], [0.86, down, 'in'], [1.1, Object.assign({}, down, { rz: -1.8 })], [1.6, KP({})]] }; })();
  // rising out of the floor: shoulders and head first, one hand planted, torso and legs, pushed upright
  const RISE = (() => { const lo = (o, z) => KP(Object.assign({ rz: z }, o));
    const a = lo({ lean: 0.95, hP: -0.75, aLsw: 0.8, aLab: 0.35, aLel: 1.0, aRsw: 0.6, aRel: 0.9, lLsw: 0.9, lRsw: 0.9, lLkn: 1.5, lRkn: 1.5 }, -20);
    const b = lo({ lean: 0.85, hP: -0.65, aLsw: 1.1, aLab: 0.3, aLel: 0.6, aLcu: 0.3, aRsw: 0.5, aRel: 1.0, lLsw: 0.9, lRsw: 0.9, lLkn: 1.5, lRkn: 1.5 }, -8.5);
    const plant = lo({ lean: 0.75, hP: -0.6, aLsw: 1.2, aLab: 0.3, aLel: 0.1, aLcu: 0.1, aLwp: -0.6, aRsw: 0.45, aRel: 1.0, lLsw: 0.9, lRsw: 0.9, lLkn: 1.5, lRkn: 1.5 }, -2.4);
    const push = lo({ lean: 0.72, hP: -0.5, aLsw: 1.0, aLab: 0.3, aLel: 0.35, aLcu: 0.2, aLwp: -0.6, aRsw: 0.3, aRel: 0.8, lLsw: 0.6, lRsw: 0.4, lLkn: 1.0, lRkn: 0.8 }, -1.0);
    const up = lo({ lean: 0.55, hP: -0.48, aLsw: 0.4, aLel: 0.5, aRsw: 0.3, aRel: 0.6, lLkn: 0.45, lRkn: 0.4 }, -0.3);
    return [[0, a], [0.6, b, 'out'], [1.0, plant], [1.25, Object.assign({}, plant, { rz: -2.2, lean: 0.78 })], [1.65, push], [1.95, up], [2.25, KP({})]]; })();
  // Worldbreaker: plant wide and gather; raise overhead and arch back, held; drive both fists down; kneel embedded
  const WB = (() => {
    const gath = both(both(both(both(legs(legs(legs(KP({ lean: 0.45, hipP: 0.18, rz: -0.9, hP: -0.35 }), 'ab', 0.32), 'kn', 0.8), 'sw', 0.18), 'sw', 0.35), 'ab', 0.5), 'el', 0.95), 'cu', 1);
    const up = both(both(both(both(legs(legs(KP({ lean: -0.32, hipP: -0.04, hP: -0.6, rz: 0.3 }), 'ab', 0.24), 'kn', 0.32), 'sw', 2.85), 'ab', 0.2), 'el', 0.45), 'cu', 1); both(up, 'wp', -0.25);
    const hold = Object.assign({}, up, { lean: -0.4, hP: -0.65 });
    const down = both(both(both(both(legs(legs(legs(KP({ lean: 0.55, hipP: 0.35, hP: 0.1, rz: -1.5 }), 'ab', 0.36), 'kn', 0.8), 'sw', 0.45), 'sw', 0.72), 'ab', -0.58), 'el', 0.12), 'cu', 1); both(down, 'wp', 0.35);
    const kneel = Object.assign({}, down, { rz: -1.7, lean: 0.6, hP: 0.2 });
    return { KF: [[0, KP({})], [0.6, gath], [1.05, up, 'out'], [1.3, hold], [1.45, down, 'in'], [2.0, kneel]], HIT: 1.45 }; })();
  const PEACE = [[0, KP({})], [0.6, KP({ lean: 0.55, hP: 0.25, aLsw: 0.05, aRsw: 0.05, aLcu: 0.3, aRcu: 0.3, rz: -0.6 })]];

  /* ================= the frame cache: the model baked into pictures ================= */
  /* Each clip is a few key poses; each pose is baked once per level tier and facing (8 facings, 45 degrees apart) into
     its own tightly cropped canvas (texture, moss, fractures, the clip's golden light and the eyes baked in) and laid
     down with one drawImage. The symmetric clips are baked only for the five facings with a rightward or straight
     component and mirrored for the other three (the walk with its phase shifted half a cycle); the one-armed clips
     (punch: right arm, backhand: left arm) are baked in all eight and mirrored for the other arm. Bakes run in slices
     of a small time budget each frame (a bake's stones painted in order over several frames if need be), first what is
     on screen, then a queue laid out at the cast; a missing picture falls back to the nearest one baked. The cache is
     kept between casts (cleared when the zoom changes a lot) and capped at CAP_MB, least recently used first.
     Memory: a picture is about 190 x 210 px at L1 (1.5x the screen size), ~160 KB; all 213 of a tier ~34 MB, but a
     cast typically bakes 60-120 of them. */
  const DIRS = 8, DA = TAU / DIRS, CAP_MB = 32, BUDGET = 1.2;
  const rightD = d => Math.cos(d * DA) > -1e-6, mirD = d => ((4 - d) % 8 + 8) % 8;
  function wbState(w, tier) {   // the Worldbreaker's light, gauntlets and eyes at w s
    const drain = 1 - sstep(1.75, 2.35, w), gl = { chest: sstep(0.05, 0.35, w) * drain, sh: sstep(0.2, 0.5, w) * drain, arm: sstep(0.35, 0.65, w) * drain, fist: sstep(0.5, 0.8, w) * drain, leg: 0.5 * sstep(0.1, 0.5, w) * drain, gaunt: sstep(0.55, 1.2, w) * (1 - sstep(1.6, 1.95, w)) };
    return { glow: gl, gaunt: sstep(0.12, 0.95, w), gbreak: w > 1.62 ? (w - 1.62) / 0.45 : 0, eye: 1 - sstep(2.1, 2.4, w) };
  }
  const atkGlow = (u, T, tier) => { const g = (0.25 + 0.35 * (tier - 1) / 2) * Math.sin(cl(u / T) * Math.PI); return { chest: g, sh: g, arm: g * 1.3, fist: g * 1.3, leg: g * 0.5, gaunt: 0 }; };
  const CLIPS = {
    idle: { sym: 1, ts: [0, 1], pose: i => idlePose((i ? 1.5 : 0.5) * Math.PI / 1.3) },
    walk: { sym: 1, ts: [0, 1, 2, 3, 4, 5], mf: i => (i + 3) % 6, pose: i => walkPose(i / 6, 1) },
    punch: { sym: 0, canon: 'R', ts: [0.36, 0.5, 0.66, 0.88], KF: PUNCH.KF, T: PUNCH.T },
    back: { sym: 0, canon: 'L', ts: [0.4, 0.56, 0.72, 0.98], KF: BACKHAND.KF, T: BACKHAND.T },
    slam: { sym: 1, ts: [0.52, 0.76, 0.86, 1.2], KF: SLAM.KF, T: SLAM.T },
    rise: { sym: 1, ts: [0.6, 1.0, 1.6, 2.0], KF: RISE, eye: [0, 0, 0.1, 0.6] },
    wb: { sym: 1, ts: [0.5, 1.05, 1.3, 1.45, 1.85], KF: WB.KF, wb: 1 },
    peace: { sym: 1, ts: [0.6], KF: PEACE, eye: [0.3] },
  };
  function clipPose(name, i, tier) {
    const C = CLIPS[name], t = C.ts[i], P = C.pose ? C.pose(i) : kfPose(C.KF, t), o = { tier, eye: C.eye ? C.eye[i] : 1, t: 1 + i * 0.37 };
    if (C.wb) Object.assign(o, wbState(t, tier)); else if (C.T) o.glow = atkGlow(t, C.T, tier);
    return [P, o];
  }
  const FC = { tasks: [], tp: 0, tq: 0, tf: 0, T0: 0, res: 1, sc: 0, frames: new Map(), queue: [], qset: new Set(), job: null, bytes: 0, built: 0, bakeMs: 0, maxSlice: 0, JOB: null, jbb: null };
  const fkey = (tier, clip, i, d) => tier + '|' + clip + '|' + i + '|' + d;
  // where a request (clip, frame, facing, which arm) is found: the stored key and whether it is mirrored
  function locate(tier, clip, i, yaw, side) {
    const C = CLIPS[clip], d = ((Math.round(yaw / DA) % DIRS) + DIRS) % DIRS;
    if (C.sym) return rightD(d) ? [fkey(tier, clip, i, d), false] : [fkey(tier, clip, C.mf ? C.mf(i) : i, mirD(d)), true];
    return side === C.canon ? [fkey(tier, clip, i, d), false] : [fkey(tier, clip, i, mirD(d)), true];
  }
  function want(key, front) { if (FC.frames.has(key) || (FC.job && FC.job.key === key)) return; if (FC.qset.has(key)) { if (front) { const k = FC.queue.indexOf(key); if (k > 0) { FC.queue.splice(k, 1); FC.queue.unshift(key); } } return; } FC.qset.add(key); if (front) FC.queue.unshift(key); else FC.queue.push(key); }
  function setScale(T, sc, dpr) {
    const res = Math.min(Math.max(1, dpr || 1), 1.2);
    if (FC.T0 && Math.abs(T * sc / (FC.T0 * FC.sc) - 1) < 0.22 && FC.res === res) return;
    FC.frames.clear(); FC.queue.length = 0; FC.qset.clear(); FC.job = null; FC.bytes = 0; FC.T0 = T; FC.sc = sc; FC.res = res;
  }
  // a slice of baking: start or continue the current bake, until the time is up
  function bakeStep(ms) {
    const t0 = performance.now(), until = t0 + ms;
    while (performance.now() < until) {
      if (FC.tasks.length) { FC.tasks.shift()(); continue; }   // (the warm-up: textures, stones, sprites, one small piece at a time)
      if (!FC.job) {
        let key = null; while (FC.queue.length && !key) { const k = FC.queue.shift(); FC.qset.delete(k); if (!FC.frames.has(k)) key = k; } if (!key) break;
        const [tier, clip, i, d] = key.split('|'), [P, o] = clipPose(clip, +i, +tier), res = FC.res;
        // posed and sorted at the feet (0, 0); its own canvas sized to its box, painted straight into
        const J = prepGolem(0, 0, FC.T0, FC.sc, +d * DA, P, o), bx = J.bx, pad = 4, x0 = Math.floor((bx[0] - pad) * res), y0 = Math.floor((bx[1] - pad) * res), w = Math.max(1, Math.ceil((bx[2] + pad) * res) - x0), h = Math.max(1, Math.ceil((bx[3] + pad) * res) - y0);
        const cv = mk(w, h), g = cv.getContext('2d');
        FC.job = { key, J, cv, g, res, x0, y0 };
        FC.tp += performance.now() - t0;
        if (performance.now() > t0 + ms * 0.5) break;   // (a pose's setup is a slice of its own when it ran long)
      }
      const tq0 = performance.now(), jb = FC.job; jb.g.setTransform(jb.res, 0, 0, jb.res, -jb.x0, -jb.y0);
      const dn = paintGolem(jb.g, jb.J, until); FC.tq += performance.now() - tq0; if (!dn) break;
      // done: keep it, with its points relative to the feet
      const out = jb.J.out, rel = p => [p[0], p[1]];
      const fr = { cv: jb.cv, ax: -jb.x0, ay: -jb.y0, res: jb.res, k0: FC.T0 * FC.sc, used: performance.now(), bytes: jb.cv.width * jb.cv.height * 4,
        out: { fistL: rel(out.fistL), fistR: rel(out.fistR), footL: rel(out.footL), footR: rel(out.footR), chest: rel(out.chest), head: rel(out.head), eyes: out.eyes.map(e => [e[0], e[1], e[2]]), bb: out.bb.slice() } };
      FC.frames.set(jb.key, fr); FC.bytes += fr.bytes; FC.built++;
      if (FC.bytes > CAP_MB * 1048576) { const all = [...FC.frames.entries()].sort((a, b) => a[1].used - b[1].used); for (const [k, f] of all) { if (FC.bytes <= CAP_MB * 0.8 * 1048576) break; FC.frames.delete(k); FC.bytes -= f.bytes; } }
      FC.job = null;
    }
    const dt = performance.now() - t0; FC.bakeMs += dt; if (dt > FC.maxSlice) FC.maxSlice = dt;
  }
  // the picture for a request, or the nearest one baked: [frame, mirrored]
  function frameFor(tier, clip, i, yaw, side, front) {
    const [key, flip] = locate(tier, clip, i, yaw, side); let fr = FC.frames.get(key);
    if (fr) { fr.used = performance.now(); return [fr, flip]; }
    want(key, front);
    const n = CLIPS[clip].ts.length; for (let k = 1; k < n; k++) for (const j of [i - k, i + k]) { if (j < 0 || j >= n) continue; const [k2, f2] = locate(tier, clip, j, yaw, side), f = FC.frames.get(k2); if (f) return [f, f2]; }
    for (const c2 of ['idle', 'walk', 'rise']) { const [k2, f2] = locate(tier, c2, 0, yaw, 'R'), f = FC.frames.get(k2); if (f) return [f, f2]; }
    for (const [k2, f] of FC.frames) if (k2[0] === String(tier)) return [f, false];
    return [null, false];
  }
  // lay a picture down with its feet at (X, Y) (K1 px a model unit), mirrored or not; clipY: nothing below that screen line
  function blitFrame(c, fr, X, Y, K1, flip, alpha, clipY, sy) {
    if (!fr || !(alpha > 0.01)) return; const s = K1 / fr.k0, k = s / fr.res, B = K1 * 80;
    c.save(); if (clipY != null) { c.beginPath(); c.rect(X - B, Y - B, B * 2, clipY - (Y - B)); c.clip(); }
    c.globalAlpha = Math.min(1, alpha); c.translate(X, Y); c.scale(flip ? -k : k, k * (sy || 1)); c.drawImage(fr.cv, -fr.ax, -fr.ay); c.restore();
  }
  // a baked picture's points on the screen
  function frameOut(fr, X, Y, K1, flip) {
    const s = K1 / fr.k0, f = flip ? -1 : 1, P = p => [X + f * p[0] * s, Y + p[1] * s], o = fr.out, bb = o.bb;
    return { fistL: P(flip ? o.fistR : o.fistL), fistR: P(flip ? o.fistL : o.fistR), footL: P(o.footL), footR: P(o.footR), chest: P(o.chest), head: P(o.head), eyes: o.eyes.map(e => [X + f * e[0] * s, Y + e[1] * s, e[2]]), bb: flip ? [X - bb[2] * s, Y + bb[1] * s, X - bb[0] * s, Y + bb[3] * s] : [X + bb[0] * s, Y + bb[1] * s, X + bb[2] * s, Y + bb[3] * s] };
  }
  // the bake order laid out at a cast: what the entrance and the first steps need, then the rest
  function planBakes(tier, yaw, wb) {
    const d0 = ((Math.round(yaw / DA) % DIRS) + DIRS) % DIRS, Y = d => d * DA, near = [d0, (d0 + 1) % 8, (d0 + 7) % 8];
    const add = (clip, d, side) => CLIPS[clip].ts.forEach((_, i) => want(locate(tier, clip, i, Y(d), side)[0], false));
    if (wb) { for (const d of near) add('wb', d); return; }
    add('rise', d0); add('idle', d0); add('walk', d0);
    add('punch', d0, 'R'); add('punch', d0, 'L'); add('back', d0, 'L'); add('back', d0, 'R'); add('slam', d0);
    for (const d of near.slice(1)) { add('idle', d); add('walk', d); add('punch', d, 'R'); add('punch', d, 'L'); add('back', d, 'L'); add('back', d, 'R'); add('slam', d); }
  }


  /* ================= cached sprites for the effects ================= */
  const puffSpr = () => fxSprite('ttnpuff', 64, 64, g => { let gr = g.createRadialGradient(32, 34, 0, 32, 34, 30); gr.addColorStop(0, 'rgba(104,92,78,0.55)'); gr.addColorStop(0.55, 'rgba(104,92,78,0.26)'); gr.addColorStop(1, 'rgba(104,92,78,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    gr = g.createRadialGradient(25, 24, 0, 28, 28, 24); gr.addColorStop(0, 'rgba(214,202,180,0.55)'); gr.addColorStop(0.5, 'rgba(180,166,142,0.28)'); gr.addColorStop(1, 'rgba(180,166,142,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const shadowSpr = () => fxSprite('ttnshadow', 64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(12,9,6,0.55)'); gr.addColorStop(0.55, 'rgba(12,9,6,0.28)'); gr.addColorStop(1, 'rgba(12,9,6,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const BWS = [0.06, 0.12, 0.2, 0.32];
  // a ring band on the floor: e the lit leading edge (additive), d the dust that follows it (normal)
  const bandSpr = (kind, b) => fxSprite('ttnband' + kind + b, 320, 320, g => { const w = BWS[b], gr = g.createRadialGradient(160, 160, 0, 160, 160, 160);
    const S = kind === 'e' ? [[0, 'rgba(217,128,24,0)'], [1 - w, 'rgba(217,128,24,0)'], [1 - 0.6 * w, 'rgba(217,128,24,0.3)'], [1 - 0.3 * w, 'rgba(242,176,58,0.85)'], [1 - 0.14 * w, 'rgba(255,224,150,0.95)'], [1 - 0.04 * w, 'rgba(242,170,50,0.3)'], [1, 'rgba(242,170,50,0)']]
      : [[0, 'rgba(110,98,82,0)'], [1 - w, 'rgba(110,98,82,0)'], [1 - 0.72 * w, 'rgba(110,98,82,0.22)'], [1 - 0.42 * w, 'rgba(150,136,114,0.5)'], [1 - 0.18 * w, 'rgba(186,172,148,0.4)'], [1 - 0.05 * w, 'rgba(200,188,166,0.1)'], [1, 'rgba(200,188,166,0)']];
    S.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 320, 320); });
  function band(c, kind, X, Y, r, t, a) { if (r < 2 || !(a > 0.01)) return; const q = t / r; let b = 0; for (let i = 1; i < BWS.length; i++) if (Math.abs(BWS[i] - q) < Math.abs(BWS[b] - q)) b = i; c.save(); if (kind === 'e') c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(bandSpr(kind, b), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function glowF(c, X, Y, r, col, a, gy) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (gy || 1); c.drawImage(glowSprite(col), X - r, Y - ry, r * 2, ry * 2); c.restore(); }
  /* the amber sigil: rings, runes and spokes, light only (additive), feathered by a soft wide stroke under each line */
  const sigilSpr = () => fxSprite('ttnsigil', 384, 384, g => { const C = 192, R = 186; g.translate(C, C); g.lineCap = 'round'; g.lineJoin = 'round';
    const st = (w, a, f) => { for (const [ww, aa, col] of [[w * 4, a * 0.18, '217,138,30'], [w * 2, a * 0.4, '242,183,58'], [w, a, '255,233,184']]) { g.strokeStyle = `rgba(${col},${aa})`; g.lineWidth = ww; g.beginPath(); f(); g.stroke(); } };
    st(2.4, 0.9, () => g.arc(0, 0, R * 0.93, 0, TAU)); st(1.6, 0.8, () => g.arc(0, 0, R * 0.8, 0, TAU)); st(1.4, 0.7, () => g.arc(0, 0, R * 0.42, 0, TAU));
    st(1.4, 0.75, () => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, b = a + TAU / 6; g.moveTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); g.lineTo(Math.cos(b) * R * 0.8, Math.sin(b) * R * 0.8); } });
    st(1.2, 0.6, () => { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + TAU / 12; g.moveTo(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42); g.lineTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); } });
    st(1.3, 0.85, () => { for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, r0 = R * 0.84, r1 = R * 0.9; g.save(); g.rotate(a); g.moveTo(r0, -4); g.lineTo(r1, 0); g.lineTo(r0, 4); if (i % 3 === 0) { g.moveTo(r0 - 2, 0); g.lineTo(r0 - 8, 0); } g.restore(); } });
    st(1.2, 0.7, () => { for (let i = 0; i < 3; i++) { const a = i / 3 * TAU - Math.PI / 2; g.moveTo(Math.cos(a) * R * 0.28, Math.sin(a) * R * 0.28); g.lineTo(Math.cos(a + 2.1) * R * 0.28, Math.sin(a + 2.1) * R * 0.28); } });
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, 'rgba(242,183,58,0.22)'); gr.addColorStop(0.6, 'rgba(217,138,30,0.08)'); gr.addColorStop(1, 'rgba(217,138,30,0)'); g.fillStyle = gr; g.fillRect(-C, -C, C * 2, C * 2); });
  /* branching amber cracks in four rings (each lights as the wave front reaches it); unit circle = the reach */
  const CRK = {}, CS = 384;
  function crackSet(seed) {
    if (CRK[seed]) return CRK[seed]; let s = seed * 31.7 + 3; const rnd = () => R1(s += 1.37), segs = [];
    const walk = (x, y, a, steps, depth) => { for (let i = 0; i < steps; i++) { const r = Math.hypot(x, y); if (r > 0.97) break; const ra = Math.atan2(y, x); let da = ra - a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; a += da * 0.25 + (rnd() - 0.5) * 0.7; const L = 0.035 + 0.03 * rnd(), nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L; segs.push([x, y, nx, ny, depth]); x = nx; y = ny; if (depth < 2 && rnd() < 0.12) walk(x, y, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + 0.4 * rnd()), 4 + Math.floor(rnd() * 6), depth + 1); } };
    const NR = 11 + (seed % 3); for (let i = 0; i < NR; i++) { const a = i / NR * TAU + (rnd() - 0.5) * 0.35, r0 = 0.08 + 0.06 * rnd(); walk(Math.cos(a) * r0, Math.sin(a) * r0, a, 40, 0); }
    const out = []; for (let b = 0; b < 4; b++) out.push(mk(CS, CS)); const sc = CS / 2 * 0.98;
    for (const [col, lw] of [['rgba(217,120,20,0.2)', 8], ['rgba(235,160,40,0.6)', 2.8], ['rgba(255,218,130,0.95)', 1.1]]) for (const q of segs) { const r = Math.hypot((q[0] + q[2]) / 2, (q[1] + q[3]) / 2), b = Math.min(3, Math.floor(r * 4)), g = out[b].getContext('2d');
      g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = lw * (1.15 - 0.55 * r) * (q[4] ? 0.75 : 1); g.beginPath(); g.moveTo(CS / 2 + q[0] * sc, CS / 2 + q[1] * sc); g.lineTo(CS / 2 + q[2] * sc, CS / 2 + q[3] * sc); g.stroke(); }
    return (CRK[seed] = out);
  }
  // the cracks out to radius r (tiles), each ring lit as the front reaches it, all fading by a
  function drawCracks(c, X, Y, T, R, front, a, seed) { if (a < 0.01) return; const set = crackSet(seed), rp = R * T; c.save(); c.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 4; b++) { const k = cl((front / R - b / 4) / 0.25); if (k <= 0) continue; c.globalAlpha = Math.min(1, a * k); c.drawImage(set[b], X - rp, Y - rp * H.GY, rp * 2, rp * 2 * H.GY); } c.restore(); }
  /* rock slabs for the earthquake ridge: real stones from the same kit, painted once each, standing up (feet at the
     bottom of the picture) */
  const SLABS = [];
  function slabSpr(i) {
    if (SLABS[i]) return SLABS[i]; const S = 96, cv = mk(S, S * 1.25), g = cv.getContext('2d');
    const m = rock({ e: [0.7 + R1(i) * 0.4, 0.55 + R1(i + 3) * 0.3, 1.5 + R1(i + 7) * 0.5], tx: 0.45 + R1(i + 9) * 0.3, ty: 0.6, shx: (R1(i + 11) - 0.5) * 0.6, bev: 0.18, bevC: 0.35, chips: 3, seed: 400 + i * 13 });
    const P = { m, R: GK.I3(), t: [0, 0, 0], mat: i % 4 === 3 ? 'gaunt' : 'stone', dep: 0, tex: true, texA: 0.75, sid: 70 + i, grp: new Uint8Array(m.f.length), var: new Uint8Array(m.f.length), moss: new Uint8Array(m.f.length), cr: [], en: [], cl: [], seam: [], sx: new Float32Array(m.v.length), sy: new Float32Array(m.v.length), vis: new Uint8Array(m.f.length), band: new Uint8Array(m.f.length) };
    for (let f = 0; f < m.f.length; f++) { const n = m.fn[f], ax = [Math.abs(n[0]), Math.abs(n[1]), Math.abs(n[2])]; P.grp[f] = ax[0] >= ax[1] && ax[0] >= ax[2] ? 0 : ax[1] >= ax[2] ? 1 : 2; P.var[f] = (f + i) % 2; }
    const k = S * 0.22, yaw = R1(i + 5) * TAU, cy = Math.cos(yaw), sy = Math.sin(yaw), A = [k * cy, -k * sy, 0, k * sy * SE, k * cy * SE, -k * CE];
    const VW = { X: S / 2, Y: S * 1.25 - k * 2.6, A, Vm: [sy * CE, cy * CE, SE], Lm: [cy * LDW[0] + sy * LDW[1], -sy * LDW[0] + cy * LDW[1], LDW[2]], k, texK: 1 / 26, tier: 1, t: 0 };
    const Rm = eul((R1(i + 13) - 0.5) * 0.3, (R1(i + 15) - 0.5) * 0.4, 0);
    g.lineJoin = 'round'; paintPart(g, P, Rm, [0, 0, 0], VW, pats(g));
    return (SLABS[i] = cv);
  }

  const COMBAT_S = [5, 6, 7, 8, 28 / 3, 32 / 3, 12];
  function warmTasks(tier, seed) {
    if (FC.warmed && FC.warmed[tier]) return; (FC.warmed = FC.warmed || {})[tier] = 1;
    const M = model(tier), again = st => { const f = () => { if (!st()) FC.tasks.unshift(f); }; return f; };
    FC.tasks.push(sigilSpr, () => crackSet((seed + 2) % 5), again(stoneStep), again(mossStep), clumpSpr);
    for (const p of M.parts) if (p.lazy) FC.tasks.push(() => p.lazy && p.fin());
    for (let i = 0; i < 8; i++) FC.tasks.push(() => slabSpr(i));
    for (let k = 0; k < 8; k++) FC.tasks.push(() => crackSet(k));
  }
  /* idle-time preparation: called when a floor starts with Titan in a kit; bakes the cast's first pictures in the gaps
     between frames (requestIdleCallback where there is one, else a 1 ms slice every 40 ms), so a cast bakes little */
  let IDLE = false;
  function idleBake() {
    if (IDLE || !(FC.queue.length || FC.tasks.length || FC.job)) return; IDLE = true;
    const go = () => { IDLE = false; idleBake(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => { bakeStep(dl.didTimeout ? 1 : Math.max(0.5, Math.min(4, dl.timeRemaining() - 1))); go(); }, { timeout: 120 });
    else setTimeout(() => { bakeStep(1); go(); }, 40);
  }
  /* ================= the move ================= */
  U.titan = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, K = C.K || 1, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const S = 1 + 0.02 * (ev - 1), SC = 0.103 * S;   // tiles per model unit (about 2.7 tiles tall at L1, 3.0 at L7)
    // the fight lasts 5 s (L1), 8 s (Adept), 12 s (Celestial), evenly between; its blows are scaled by 25 / that, so a
    // shorter fight deals what the first 25 s one did (x5, x4.17, x3.57, x3.13, x2.68, x2.34, x2.08); Worldbreaker as it was
    const COMBAT = COMBAT_S[ev - 1], DM = 25 / COMBAT;
    const ENTER = 2.6, END0 = ENTER + COMBAT, SPD = 1.12 + 0.025 * (ev - 1);
    const DMG = { punch: 4.4 * DK * DM, splash: 1.5 * DK * DM, back: 3.8 * DK * DM, slam: 5.4 * DK * DM, wbImp: 6 * DK, wbWave: 5 * DK };
    const R_SLAM = (1.9 + 0.09 * (ev - 1)) * K, R_IMP = (1.9 + 0.067 * (ev - 1)) * K, R_WAVE = (4 + 0.25 * (ev - 1)) * K, LEASH = 6.5, REACH = 1.55 * S;
    const seed = Math.floor(Math.random() * 1000);
    // the warm-up (if the kit's idle-time preparation has not done it): textures, stone shapes, sprites, a piece at a time
    warmTasks(tier, seed);
    H.X.banner('TITAN', '', C.col, 1.5); H.X.sfx.rumble ? H.X.sfx.rumble() : H.X.sfx.hum(); H.X.shake(3, 0.4);
    // the summon spot: toward the aim and a little aside, on walkable floor, clear of the pet
    const aim = Math.atan2(C.ty - me.y, C.tx - me.x), side = Math.cos(aim) >= 0 ? -1 : 1;
    let spot = null; for (const [d, da] of [[2.1, 0.55 * side], [2.1, -0.55 * side], [1.9, 0], [2.4, Math.PI / 2], [2.4, -Math.PI / 2], [1.6, Math.PI]]) { const p = H.walk(me.x + Math.cos(aim + da) * d, me.y + Math.sin(aim + da) * d); if (Math.hypot(p.x - me.x, p.y - me.y) > 1.2) { spot = p; break; } }
    if (!spot) spot = { x: me.x + Math.cos(aim) * 1.8, y: me.y + Math.sin(aim) * 1.8 };
    const G = { lastPick: null, x: spot.x, y: spot.y, r: 0.4, face: aim, st: 'enter', u: 0, ph: 0, atk: null, cool: 0.4, tgt: null, retT: 0, combo: 0, slamCd: 2, trail: [], moving: 0, eye: 0, prog: 0, progT: 0, stuckT: 0, dimA: 1, lastOut: null, rT: -1 };
    setScale(H.X.Tz(), SC, typeof devicePixelRatio === 'number' ? devicePixelRatio : 1); planBakes(tier, aim);
    const waves = [], vfx = [], pebs = [];
    let gl = { chest: 0, sh: 0, arm: 0, fist: 0, leg: 0, gaunt: 0 }, gaunt = 0, gbreak = 0, crumble = -1, wbT = -1, peace = false, ended = false, life0 = END0 + 6, gone = false, alphaEnd = 1;
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj && !(m.boss && (m.act === 'enter' || m.act === 'sleep'));
    const living = () => H.living().filter(valid);
    const fwd = () => [Math.cos(G.face), Math.sin(G.face)];
    const knock = (m, ox, oy, f) => { if (!m || m.dead || m.still) return; const a = Math.atan2(m.y - oy, m.x - ox), k = f * (m.boss ? 0.12 : 1); m.kbx = (m.kbx || 0) + Math.cos(a) * k; m.kby = (m.kby || 0) + Math.sin(a) * k; };
    const F = H.add({ key: 'titan', life: life0, x: G.x, y: G.y, entY: G.y, G, waves, vfx, update, draw, drawUnder, drawEnt, onEnd() { ended = true; }, ENTER, END0, hits: { punch: 0, back: 0, slam: 0, wbImp: 0, wbWave: 0 } });
    /* ---- the AI ---- */
    function pickTarget() {
      let best = null, bs = 1e9;
      for (const m of living()) { const dp = Math.hypot(m.x - me.x, m.y - me.y), dg = Math.hypot(m.x - G.x, m.y - G.y); if (dp > LEASH + m.r && dg > 3.5) continue; const s = dg + (m === G.tgt ? -0.8 : 0) + (m.boss ? -0.3 : 0); if (s < bs) { bs = s; best = m; } }
      return best;
    }
    function step(gx, gy, spd, dt) { const dx = gx - G.x, dy = gy - G.y, d = Math.hypot(dx, dy); if (d < 0.05) return 0; const s = Math.min(d, spd * dt), x0 = G.x, y0 = G.y; H.X.moveEnt(G, dx / d * s, dy / d * s, 0); return Math.hypot(G.x - x0, G.y - y0); }
    function turnTo(a, dt, rate) { let d = a - G.face; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; const m = Math.min(Math.abs(d), rate * dt); G.face += Math.sign(d) * m; return Math.abs(d) - m; }
    function chooseAttack(m) {
      const f = fwd(), near = living().filter(o => Math.hypot(o.x - G.x - f[0] * 0.7 * S, o.y - G.y - f[1] * 0.7 * S) < R_SLAM * 0.9 + o.r).length;
      const arc = living().filter(o => { const d = Math.hypot(o.x - G.x, o.y - G.y), a = Math.atan2(o.y - G.y, o.x - G.x) - G.face; return d < 1.9 * S + o.r && Math.cos(a) > Math.cos(1.25); }).length;
      if (G.slamCd <= 0 && (near >= 3 || (near >= 2 && G.combo >= 2) || G.combo >= 4)) return 'slam';
      if (arc >= 2 && G.combo % 3 !== 2) return 'back';
      if (G.combo % 3 === 2) return arc >= 1 ? 'back' : 'punch';
      return 'punch';
    }
    function startAttack(kind) {
      const def = kind === 'punch' ? PUNCH : kind === 'back' ? BACKHAND : SLAM, mir = kind === 'punch' ? (G.combo % 2 === 1) : kind === 'back' ? (R1(G.combo + seed) < 0.5) : false;
      G.atk = { kind, def, u: 0, hit: false, mir, KF: mir ? def.KF.map(e => [e[0], mirrorP(e[1]), e[2]]) : def.KF }; G.combo++; G.trail.length = 0;
      if (kind === 'slam') G.slamCd = 4.2 - 0.15 * (ev - 1);
      if (kind !== 'punch') H.X.sfx.whoosh();
    }
    function chips(x, y, n, up, sz) { for (let j = 0; j < H.n(n); j++) { const b = Math.random() * TAU, v = 1.5 + Math.random() * 3; H.P({ kind: 'shard', x: x + Math.cos(b) * 0.15, y, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5 - (up || 3) - Math.random() * 2, g: 10, life: 0.5 + Math.random() * 0.35, max: 0.85, size: (sz || 3) + Math.random() * 2.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, color: ['#77716A', '#5A544D', '#A39C90', '#47423D'][j % 4] }); } }
    function dust(x, y, n, sp, sz) { for (let j = 0; j < H.n(n); j++) { const b = Math.random() * TAU, v = (sp || 1) * (0.4 + Math.random()); H.P({ kind: 'smoke', x: x + Math.cos(b) * 0.2, y: y + Math.sin(b) * 0.1, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5 - 0.25, life: 0.7 + Math.random() * 0.4, max: 1.1, size: (sz || 0.3) * (0.7 + Math.random() * 0.6), color: 'rgba(150,136,116,' }); } }
    function landHit() {
      const A = G.atk, f = fwd(), kind = A.kind; A.hit = true;
      if (kind === 'punch') {
        const px = G.x + f[0] * REACH, py = G.y + f[1] * REACH; let n = 0; const tg = G.tgt;
        for (const m of living()) { const d = Math.hypot(m.x - px, m.y - py); if (d < 0.75 + m.r) { H.X.hitMon(m, m === tg || n === 0 ? DMG.punch : DMG.splash, C.dmgO({ stun: 0.25 })); knock(m, G.x, G.y, 4); n++; } }
        F.hits.punch += n; vfx.push({ kind: 'flash', x: px, y: py, z: 1.0 * S, t0: F.t, life: 0.3, r: 0.9 + 0.1 * tier }); chips(px, py - 0.5, 7 + tier * 2, 2, 3); dust(px, py, 3, 1.2, 0.3);
        H.X.shake(3 + tier, 0.15); H.X.sfx.thud(); if (n) H.X.hitstop && H.X.hitstop(0.03);
      } else if (kind === 'back') {
        let n = 0; for (const m of living()) { const d = Math.hypot(m.x - G.x, m.y - G.y), a = Math.atan2(m.y - G.y, m.x - G.x) - G.face; if (d < 1.9 * S + m.r && Math.cos(a) > Math.cos(1.3)) { H.X.hitMon(m, DMG.back, C.dmgO({ stun: 0.2 })); knock(m, G.x, G.y, 5); n++; vfx.push({ kind: 'flash', x: m.x, y: m.y, z: 0.9 * S, t0: F.t, life: 0.22, r: 0.6 }); } }
        F.hits.back += n; H.X.shake(2 + tier, 0.15); H.X.sfx.thud();
      } else if (kind === 'slam') {
        const cx = G.x + f[0] * 0.75 * S, cy = G.y + f[1] * 0.75 * S;
        waves.push({ x: cx, y: cy, r: 0, R: R_SLAM, v: R_SLAM / 0.38, dmg: DMG.slam, hit: new Set(), o: C.dmgO({ stun: 0.4 }), kb: 3, t0: F.t, kind: 'slam', tag: 'slam' });
        vfx.push({ kind: 'cracks', x: cx, y: cy, R: R_SLAM * 1.05, t0: F.t, life: 1.3, seed: seed % 5, sp: 0.38 }); vfx.push({ kind: 'flash', x: cx, y: cy, z: 0.25, t0: F.t, life: 0.35, r: 1.4 + 0.15 * tier });
        for (let j = 0; j < H.n(10 + 3 * tier); j++) { const b = j / (10 + 3 * tier) * TAU + Math.random() * 0.4, d = R_SLAM * (0.3 + Math.random() * 0.6); H.P({ kind: 'shard', x: cx + Math.cos(b) * d, y: cy + Math.sin(b) * d * 0.8, vx: Math.cos(b) * 1.5, vy: -3.5 - Math.random() * 3, g: 11, life: 0.6 + Math.random() * 0.3, max: 0.9, size: 4 + Math.random() * 4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, color: ['#77716A', '#5A544D', '#A39C90'][j % 3] }); }
        dust(cx, cy, 8 + tier * 2, 2.2, 0.42); H.X.shake(7 + 2 * tier, 0.3); H.X.sfx.crash(); H.X.light && H.X.light(cx, cy, R_SLAM * 1.2, 0.25);
      }
    }
    function waveStep(w, dt) {
      w.r = Math.min(w.R, w.r + w.v * dt);
      for (const m of living()) { if (w.hit.has(m)) continue; const d = Math.hypot(m.x - w.x, (m.y - w.y)); if (d <= w.r + m.r * 0.5 && d <= w.R + m.r) { w.hit.add(m); H.X.hitMon(m, w.dmg, w.o); knock(m, w.x, w.y, w.kb || 3); F.hits[w.tag === 'wb' ? 'wbWave' : 'slam']++; } }
      // the ridge: rock fragments thrown up at the front (decoration: they never hit)
      if (w.kind === 'wb' && w.r < w.R && Math.random() < dt * 40 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'shard', x: w.x + Math.cos(b) * w.r, y: w.y + Math.sin(b) * w.r, vx: Math.cos(b) * 2.5, vy: Math.sin(b) * 1.2 - 4 - Math.random() * 3, g: 11, life: 0.7, max: 0.7, size: 4 + Math.random() * 4 * (0.6 + 0.2 * tier), rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, color: ['#77716A', '#5A544D', '#A39C90', '#3A342E'][Math.floor(Math.random() * 4)] }); }
    }
    /* ---- the update ---- */
    function update(dt, f) {
      const t = f.t;
      if (ended) return;
      G.deadT = me.dead ? (G.deadT || 0) + dt : 0;
      if (G.deadT > 0.25 && G.st !== 'crumble' && G.st !== 'gone') { G.st = 'crumble'; crumble = 0; G.atk = null; waves.length = 0; H.X.sfx.thud(); }
      G.cool -= dt; G.slamCd -= dt;
      for (const w of waves) waveStep(w, dt);
      for (let i = waves.length - 1; i >= 0; i--) if (waves[i].r >= waves[i].R && t - waves[i].t0 > waves[i].R / waves[i].v + 0.8) waves.splice(i, 1);
      for (let i = vfx.length - 1; i >= 0; i--) if (t - vfx[i].t0 > vfx[i].life) vfx.splice(i, 1);
      for (let i = pebs.length - 1; i >= 0; i--) { const p = pebs[i]; p.u += dt / p.d; if (p.u >= 1) pebs.splice(i, 1); }
      if (G.st === 'enter') {
        // the sigil spreads, pebbles shake, the golem rises
        if (t < 2.2 && Math.random() < dt * 14 * H.Q()) { const b = Math.random() * TAU, d = Math.random() * 1.5; H.P({ kind: 'shard', x: G.x + Math.cos(b) * d, y: G.y + Math.sin(b) * d * 0.8, vx: (Math.random() - 0.5) * 0.6, vy: -1.6 - Math.random() * 1.6, g: 12, life: 0.35, max: 0.35, size: 2 + Math.random() * 2, rot: Math.random() * TAU, vr: 6, color: ['#77716A', '#5A544D', '#A39C90'][Math.floor(Math.random() * 3)] }); }
        if (t > 0.5 && t < 2.3 && Math.random() < dt * 10 * H.Q()) dust(G.x + (Math.random() - 0.5) * 1.6, G.y + (Math.random() - 0.5) * 0.8, 1, 0.8, 0.4);
        if (!G._e1 && t > 0.9) { G._e1 = 1; H.X.sfx.thud(); H.X.shake(3, 0.25); }
        if (!G._e2 && t > 1.5) { G._e2 = 1; chips(G.x + Math.cos(G.face) * 1.2, G.y + Math.sin(G.face) * 1.2, 6, 2, 3); dust(G.x + Math.cos(G.face + 0.4) * 1.0, G.y + Math.sin(G.face + 0.4) * 1.0, 4, 1, 0.4); H.X.sfx.thud(); }
        if (!G._e3 && t > 2.2) { G._e3 = 1; chips(G.x, G.y - 1.6 * S, 10, 1, 3); }
        G.eye = sstep(2.1, 2.45, t);
        if (!G._e4 && t > 2.45) { G._e4 = 1; H.X.sfx.stomp ? H.X.sfx.stomp() : H.X.sfx.thud(); H.X.shake(6, 0.3); vfx.push({ kind: 'ring', x: G.x, y: G.y, R: 1.9 * S, t0: t, life: 0.7 }); dust(G.x, G.y, 10, 2.2, 0.45); }
        if (t >= ENTER) { G.st = 'fight'; }
      } else if (G.st === 'fight') {
        if (!G._wbq && t > END0 - 3) { G._wbq = 1; planBakes(tier, G.face, true); }
        if (t >= END0) {   // the fight's time is over: Worldbreaker, or the peaceful departure when no monster is left
          G.atk = null; wbT = t; if (living().some(m => Math.hypot(m.x - G.x, m.y - G.y) < 12)) { G.st = 'wb'; H.X.sfx.hum(); } else { G.st = 'peace'; peace = true; }
        } else fight(dt, t);
      }
      if (G.st === 'wb') worldbreaker(dt, t);
      if (G.st === 'peace') { const w = t - wbT; G.eye = 1 - sstep(0.5, 1.0, w); if (w > 0.7 && crumble < 0) { crumble = 0; H.X.sfx.thud(); } }
      if (crumble >= 0 && !G._cr) { G._cr = 1; crumbleRocks(); }
      if (crumble >= 0) { crumble += dt; if (Math.random() < dt * 18 * H.Q() && crumble < 1.2) dust(G.x + (Math.random() - 0.5) * 1.8 * S, G.y + (Math.random() - 0.5) * 0.8, 1, 0.6, 0.55); alphaEnd = 1 - sstep(1.0, 1.55, crumble); if (crumble > 1.6) gone = true; }
      // the glow fades back unless an attack keeps it
      const tgtGlow = G.st === 'wb' ? null : G.atk ? (0.25 + 0.35 * (tier - 1) / 2) * Math.sin(cl(G.atk.u / G.atk.def.T) * Math.PI) : 0;
      if (tgtGlow != null) for (const k in gl) gl[k] += ((k === 'gaunt' ? 0 : tgtGlow * (k === 'fist' || k === 'arm' ? 1.3 : k === 'leg' ? 0.5 : 1)) - gl[k]) * Math.min(1, dt * 6);
      // the pictures still to bake, a slice at a time
      if (FC.queue.length || FC.job || FC.tasks.length) bakeStep(typeof window !== 'undefined' && window.__ttnSync ? 1e4 : BUDGET);
      f.x = G.x; f.y = G.y; f.entY = G.y + 0.05;
      if (gone && !waves.length) { f.life = Math.min(f.life, 0.05); f.entY = null; }
      else if (gone) f.entY = null;
    }
    function fight(dt, t) {
      // keep up: a golem left far behind sinks and rises again beside the pet
      const dp = Math.hypot(me.x - G.x, me.y - G.y);
      if (dp > 11 && !G.atk) { const p = H.walk(me.x - Math.cos(G.face) * 1.6, me.y - 0.8); dust(G.x, G.y, 8, 2, 0.5); G.x = p.x; G.y = p.y; dust(G.x, G.y, 8, 2, 0.5); chips(G.x, G.y, 8, 3, 3); H.X.sfx.thud(); }
      G.retT -= dt; if (!valid(G.tgt) || G.retT <= 0) { G.tgt = pickTarget(); G.retT = 0.6; }
      const m = valid(G.tgt) ? G.tgt : null;
      if (G.atk) {
        G.atk.u += dt * SPD; const A = G.atk;
        if (!A.hit && A.u >= A.def.hit) landHit();
        if (A.u >= A.def.T) { G.atk = null; G.cool = 0.05 + Math.random() * 0.12; }
        G.moving = Math.max(0, G.moving - dt * 4);
        if (m && A.u < A.def.hit - 0.15) turnTo(Math.atan2(m.y - G.y, m.x - G.x), dt, 2.4);
        return;
      }
      let gx, gy, spd = 1.45 * S;
      if (m) {
        const d = Math.hypot(m.x - G.x, m.y - G.y), a = Math.atan2(m.y - G.y, m.x - G.x), want = m.r + REACH * 0.85;
        const rem = turnTo(a, dt, G.moving > 0.3 ? 2.2 : 3.0);
        if (d <= want + 0.45 && G.cool <= 0 && rem < 0.6) { startAttack(chooseAttack(m)); return; }
        if (d > want) { gx = m.x - Math.cos(a) * want; gy = m.y - Math.sin(a) * want; } else { gx = G.x; gy = G.y; }
      } else {
        // beside the pet, a little behind it: the side it is already on
        const sd = G.x >= me.x ? 1 : -1; gx = me.x + sd * 1.7; gy = me.y - 0.75;
        if (Math.hypot(gx - G.x, gy - G.y) < 0.5) { gx = G.x; gy = G.y; turnTo(Math.atan2(me.y + 1.5 - G.y, me.x + (me.face || 1) * 1.2 - G.x), dt, 1.2); }
        if (dp > 5) spd = 2.6 * S;
      }
      const dg = Math.hypot(gx - G.x, gy - G.y);
      if (dg > 0.08) {
        const a = Math.atan2(gy - G.y, gx - G.x); const rem = turnTo(a, dt, 2.6);
        const go = rem < 0.9 ? spd * (1 - rem / 0.9 * 0.6) : 0, s = go > 0 ? step(gx, gy, go * G.moving, dt) : 0;
        G.moving = Math.min(1, G.moving + dt * 3);
        const ph0 = G.ph; G.ph += (s / (1.45 * S)) + (s === 0 && rem > 0.1 ? dt * 0.5 : 0);
        // a footfall: dust and a few displaced pebbles where the foot lands
        for (const [q, at] of [[1, 0.3], [-1, 0.8]]) { const a0 = ((ph0 - at) % 1 + 1) % 1, a1 = ((G.ph - at) % 1 + 1) % 1; if (a1 < a0 && G.ph - ph0 < 0.5) { const fa = G.face, fx = G.x + Math.cos(fa) * 0.25 * S - Math.sin(fa) * q * 0.4 * S, fy = G.y + Math.sin(fa) * 0.25 * S + Math.cos(fa) * q * 0.4 * S; dust(fx, fy, 3, 0.9, 0.32); if (!lowFx()) chips(fx, fy, 2, 1.2, 2); vfx.push({ kind: 'step', x: fx, y: fy, t0: F.t, life: 0.5 }); } }
        G.progT += dt; G.prog += s; if (G.progT > 0.8) { G.stuckT = G.prog < 0.1 && go > 0 ? G.stuckT + G.progT : 0; G.prog = 0; G.progT = 0; }
        if (G.stuckT > 2.2 && m) { G.tgt = null; G.retT = 1.5; G.stuckT = 0; }
      } else G.moving = Math.max(0, G.moving - dt * 3);
    }
    /* ---- Worldbreaker ---- */
    function worldbreaker(dt, t) {
      const w = t - wbT, f = fwd(), cx = G.x + f[0] * 0.72 * S, cy = G.y + f[1] * 0.72 * S;
      // the light travels: chest, shoulders, forearms, fists, gauntlets; drains after the slam
      const drain = 1 - sstep(1.75, 2.35, w);
      gl.chest = sstep(0.05, 0.35, w) * drain; gl.sh = sstep(0.2, 0.5, w) * drain; gl.arm = sstep(0.35, 0.65, w) * drain; gl.fist = sstep(0.5, 0.8, w) * drain; gl.leg = 0.5 * sstep(0.1, 0.5, w) * drain; gl.gaunt = sstep(0.55, 1.2, w) * (1 - sstep(1.6, 1.95, w));
      gaunt = sstep(0.12, 0.95, w); gbreak = w > 1.62 ? (w - 1.62) / 0.45 : 0; G.eye = 1 - sstep(2.1, 2.4, w);
      if (!G._w0) { G._w0 = 1; H.X.sfx.rumble ? H.X.sfx.rumble() : H.X.sfx.hum(); const nm = H.sortNear(G.x, G.y, living())[0]; G.wbA = nm ? Math.atan2(nm.y - G.y, nm.x - G.x) : G.face; }
      if (w < 1.3) turnTo(G.wbA, dt, 2.5);
      // dust sliding outward from the feet, stones lifting and spiralling up to the arms
      if (w < 1.0 && Math.random() < dt * 22 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: G.x + Math.cos(b) * 0.5, y: G.y + Math.sin(b) * 0.3, vx: Math.cos(b) * 2.2, vy: Math.sin(b) * 1.1, life: 0.9, max: 0.9, size: 0.32 + Math.random() * 0.2, color: 'rgba(150,136,116,' }); }
      if (w > 0.1 && w < 1.3 && Math.random() < dt * (14 + 6 * tier) * H.Q()) { const b = Math.random() * TAU, d = 1.2 + Math.random() * 1.6; pebs.push({ x0: G.x + Math.cos(b) * d, y0: G.y + Math.sin(b) * d * 0.8, a: b, side: Math.random() < 0.5 ? 'L' : 'R', u: 0, d: 0.7 + Math.random() * 0.4, s: 0.06 + Math.random() * 0.07, sp: (Math.random() < 0.5 ? 1 : -1) * (2 + Math.random() * 2) }); }
      if (!G._w1 && w > 1.0) { G._w1 = 1; H.X.sfx.whoosh(); H.X.shake(3, 0.4); }
      if (!G._w2 && w >= WB.HIT) {
        G._w2 = 1;
        // the impact near the fists, then the earthquake travelling out (each monster once by each)
        const n = H.hitArea(cx, cy, R_IMP, DMG.wbImp, C.dmgO({ stun: 0.6 })); F.hits.wbImp += n || 0; for (const m of living()) if (Math.hypot(m.x - cx, m.y - cy) < R_IMP + m.r) knock(m, cx, cy, 5);
        waves.push({ x: cx, y: cy, r: 0, R: R_WAVE, v: R_WAVE / 0.85, dmg: DMG.wbWave, hit: new Set(), o: C.dmgO({ stun: 0.5 }), kb: 4, t0: t, kind: 'wb', tag: 'wb' });
        vfx.push({ kind: 'cracks', x: cx, y: cy, R: R_WAVE * 1.02, t0: t, life: 2.4, seed: 5 + seed % 3, sp: 0.85 }); vfx.push({ kind: 'flash', x: cx, y: cy, z: 0.2, t0: t, life: 0.5, r: 2.4 + 0.3 * tier });
        if (tier >= 3) vfx.push({ kind: 'spires', x: cx, y: cy, t0: t, life: 1.6 });
        H.X.flash && H.X.flash(0.18, HONEY); H.X.hitstop && H.X.hitstop(0.09); H.X.sfx.crash(); H.X.shake(16 + 3 * tier, 0.55); H.X.light && H.X.light(cx, cy, R_WAVE, 0.45);
        chips(cx, cy, 16 + 4 * tier, 4, 4); dust(cx, cy, 12 + 3 * tier, 3, 0.55);
        for (let j = 0; j < H.n(16 + 8 * tier); j++) { const b = Math.random() * TAU, v = 2 + Math.random() * 5; H.P({ kind: 'spark', x: cx + Math.cos(b) * 0.4, y: cy - 0.2, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 2.5, g: 1.2, drag: 1.5, life: 0.9 + Math.random() * 0.8, max: 1.7, size: 2 + Math.random() * 1.6, color: j % 3 ? GOLD : HONEY }); }
      }
      if (!G._w3 && w > 1.75) { G._w3 = 1; H.X.sfx.thud(); }
      if (w > 2.05 && crumble < 0) { crumble = 0; H.X.sfx.crash(); }
      // the hanging golden mineral sparks over the impact (Celestial: a dense shower)
      if (w > WB.HIT && w < WB.HIT + 1.2 && Math.random() < dt * (10 + 14 * (tier - 1)) * H.Q()) { const b = Math.random() * TAU, d = Math.random() * R_WAVE * 0.6; H.P({ kind: 'spark', x: cx + Math.cos(b) * d, y: cy + Math.sin(b) * d * 0.7 - 0.5, vx: (Math.random() - 0.5) * 0.5, vy: -0.5 - Math.random() * 0.6, g: 0.3, life: 0.8 + Math.random() * 0.6, max: 1.4, size: 1.6 + Math.random() * 1.4, color: Math.random() < 0.5 ? GOLD : PALE }); }
    }

    /* ---- drawing ---- */
    let lastT = 0;
    // the body settling into loose stone: baked rocks thrown from where the golem stood, tumbling down and settling
    function crumbleRocks() {
      const O = G.lastOut, T = H.X.Tz(), X = H.sx(G.x), Y = H.sy(G.y); if (!O) return; const bb = O.bb, n = H.n(16 + 4 * tier), R = [];
      for (let i = 0; i < n; i++) { const px = lerp(bb[0], bb[2], 0.15 + 0.7 * Math.random()), py = lerp(bb[1], bb[3], 0.1 + 0.8 * Math.random()); R.push({ x: (px - X) / T, h: Math.max(0.1, (Y - py) / T), vx: (px - X) / T * (0.6 + Math.random()), vh: Math.random() * 1.5, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, s: (0.35 + Math.random() * 0.35) * S, k: i % 8, d: Math.random() * 0.25 }); }
      vfx.push({ kind: 'rocks', x: G.x, y: G.y, t0: F.t, life: 2.0, R, last: F.t });
    }
    function petDim(out) {
      if (!out) return 1; const T = H.X.Tz(), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45, bb = out.bb;
      const dx = Math.max(bb[0] - PX, 0, PX - bb[2]), dy = Math.max(bb[1] - PY, 0, PY - bb[3]); return 0.32 + 0.68 * sstep(0, T * 0.9, Math.hypot(dx, dy));
    }
    // the picture of the moment: [clip, frame, arm, extra sink in units, lunge in tiles]
    const nearest = (ts, u) => { let b = 0; for (let i = 1; i < ts.length; i++) if (Math.abs(ts[i] - u) < Math.abs(ts[b] - u)) b = i; return b; };
    function pick(t) {
      if (G.st === 'enter') { const kt = t - 0.35; return ['rise', nearest(CLIPS.rise.ts, kt), 'R', kt < 0.55 ? (0.55 - kt) / 0.55 * 16 : 0, 0]; }
      if (G.st === 'wb') { const w = t - wbT; return ['wb', w > 1.85 ? 4 : nearest(CLIPS.wb.ts, w), 'R', 0, 0]; }
      if (G.st === 'peace') return t - wbT < 0.3 ? ['idle', 0, 'R', 0, 0] : ['peace', 0, 'R', 0, 0];
      if (G.st === 'crumble') return G.lastPick || ['idle', 0, 'R', 0, 0];
      if (G.atk) { const A = G.atk, u = A.u, cl2 = A.kind === 'punch' ? 'punch' : A.kind === 'back' ? 'back' : 'slam', side = A.kind === 'punch' ? (A.mir ? 'L' : 'R') : A.kind === 'back' ? (A.mir ? 'R' : 'L') : 'R';
        const lunge = A.kind === 'punch' ? 0.24 * S * (sstep(0.36, 0.5, u) - sstep(0.66, 0.95, u)) : A.kind === 'slam' ? 0.12 * S * (sstep(0.7, 0.86, u) - sstep(1.1, 1.5, u)) : 0;
        return [cl2, nearest(CLIPS[cl2].ts, u), side, 0, lunge]; }
      if (G.moving > 0.5) return ['walk', Math.floor(((G.ph % 1) + 1) % 1 * 6 + 0.5) % 6, 'R', 0, 0];
      return ['idle', -1, 'R', 0, 0];
    }
    function drawEnt(c, f) {
      if (gone || G.st === 'gone') return; const T = H.X.Tz(), t = F.t, K1 = T * SC; lastT = t;
      setScale(T, SC, (() => { const m = c.getTransform(); return Math.hypot(m.a, m.b) || 1; })());
      const pk = pick(t); G.lastPick = pk;
      const X = H.sx(G.x) + Math.cos(G.face) * pk[4] * T, Y = H.sy(G.y) + Math.sin(G.face) * pk[4] * T * H.GY;
      // in front of the pet (nearer the viewer) it dims smoothly where it would cover it
      const inFront = G.y > me.y - 0.05; const dimT = inFront ? petDim(G.lastOut) : 1; G.dimA += (dimT - G.dimA) * 0.25;
      const sync = typeof window !== 'undefined' && window.__ttnSync;
      const get = i => { const r = frameFor(tier, pk[0], i, G.face, pk[2], true); if (sync && FC.queue.length && !FC.frames.has(locate(tier, pk[0], i, G.face, pk[2])[0])) { bakeStep(1e4); return frameFor(tier, pk[0], i, G.face, pk[2], true); } return r; };
      const cut = G.st === 'enter' && t < 2.3 ? Y + 6 * K1 * SE : null, sink = pk[3] * CE * K1, a = G.dimA * alphaEnd;
      const sq = crumble >= 0 ? 1 - 0.3 * sstep(0.1, 1.2, crumble) : 1;
      let fr, flip;
      if (pk[1] < 0) {   // idle: two breaths cross-faded
        const w = (1 - Math.sin(t * 1.3)) / 2; [fr, flip] = get(0); const [f2, fl2] = get(1);
        blitFrame(c, fr, X, Y, K1, flip, a, cut, sq); if (f2 && w > 0.02) blitFrame(c, f2, X, Y, K1, fl2, a * w, cut, sq);
      } else { [fr, flip] = get(pk[1]); blitFrame(c, fr, X, Y + sink, K1, flip, a, cut, sq); }
      if (!fr) return;
      const out = frameOut(fr, X, Y + sink, K1, flip); G.lastOut = out;
      if (cut != null) { const sp = puffSpr(); c.save(); for (let j = 0; j < 7; j++) { const px = X + (j - 3) * K1 * 4.2 + Math.sin(t * 2 + j) * K1, pr = K1 * (5 + 2 * Math.sin(j * 2.3 + t)); c.globalAlpha = 0.75 * (1 - sstep(1.9, 2.3, t)); c.drawImage(sp, px - pr, cut - pr * 0.55, pr * 2, pr * 1.1); } c.restore(); }
      // the eyes' faint halo (white-green), the fists' light while they glow
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const e of out.eyes) { const r = T * 0.22 * S, a = G.eye * e[2] * G.dimA * alphaEnd; if (a > 0.02) { c.globalAlpha = 0.55 * a; blitSized(c, glowSprite(EYEG), e[0] - r, e[1] - r, r * 2, r * 2); } }
      for (const s of ['L', 'R']) { const p = out['fist' + s], gv = Math.max(gl.fist * 0.6, gl.gaunt); if (p && gv > 0.03) { const r = T * (0.5 + 0.35 * gv) * S * (G.st === 'wb' ? 1.4 + 0.2 * tier : 1); c.globalAlpha = 0.5 * gv * G.dimA * alphaEnd; blitSized(c, glowSprite(GOLD), p[0] - r, p[1] - r, r * 2, r * 2); } }
      // Celestial windup: golden energy from the fractures of the gauntlets to the chest
      if (tier >= 3 && G.st === 'wb') { const w = t - wbT, k = sstep(0.75, 1.0, w) * (1 - sstep(1.4, 1.5, w)); if (k > 0.02 && out.chest) { c.lineCap = 'round'; for (const s of ['L', 'R']) { const p = out['fist' + s]; if (!p) continue; for (let j = 0; j < 3; j++) { const mx = (p[0] + out.chest[0]) / 2 + Math.sin(t * 9 + j * 2.1) * T * 0.18, my = (p[1] + out.chest[1]) / 2 + Math.cos(t * 7 + j) * T * 0.12; c.globalAlpha = k * 0.35; c.strokeStyle = AMBER; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.moveTo(p[0], p[1]); c.quadraticCurveTo(mx, my, out.chest[0], out.chest[1]); c.stroke(); c.globalAlpha = k * 0.85; c.strokeStyle = PALE; c.lineWidth = Math.max(1, T * 0.035); c.stroke();
        const uu = (t * 1.8 + j / 3) % 1, q = 1 - uu, bx = q * q * p[0] + 2 * q * uu * mx + uu * uu * out.chest[0], by = q * q * p[1] + 2 * q * uu * my + uu * uu * out.chest[1], gs = T * 0.14; c.globalAlpha = k; blitSized(c, glowSprite(HONEY), bx - gs, by - gs, gs * 2, gs * 2); } } glowF(c, out.chest[0], out.chest[1], T * 0.9, GOLD, k * 0.6); } }
      c.restore();
      // the backhand's trail: dust and golden sparks behind the fist
      if (G.atk && G.atk.kind === 'back') { const s = G.atk.mir ? 'fistR' : 'fistL', p = out[s]; if (p && G.atk.u > 0.4 && G.atk.u < 0.85) { G.trail.push({ x: p[0] - X, y: p[1] - Y, t }); if (Math.random() < 0.6) H.P({ kind: 'spark', x: G.x + (p[0] - X) / T, y: G.y + (p[1] - Y) / T, vx: (Math.random() - 0.5) * 2, vy: -0.5 - Math.random(), g: 2, life: 0.4, max: 0.4, size: 2 + Math.random(), color: Math.random() < 0.5 ? GOLD : HONEY }); } }
      if (G.trail.length) { while (G.trail.length && t - G.trail[0].t > 0.28) G.trail.shift(); if (G.trail.length > 2) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; for (let i = 1; i < G.trail.length; i++) { const a = G.trail[i - 1], b = G.trail[i], k = (1 - (t - b.t) / 0.28) * G.dimA; c.globalAlpha = 0.35 * k; c.strokeStyle = 'rgb(150,136,116)'; c.lineWidth = T * 0.5 * k; c.beginPath(); c.moveTo(X + a.x, Y + a.y); c.lineTo(X + b.x, Y + b.y); c.stroke(); } c.globalCompositeOperation = 'lighter'; for (let i = 1; i < G.trail.length; i++) { const a = G.trail[i - 1], b = G.trail[i], k = (1 - (t - b.t) / 0.28) * G.dimA; c.globalAlpha = 0.6 * k; c.strokeStyle = GOLD; c.lineWidth = Math.max(1, T * 0.07 * k); c.beginPath(); c.moveTo(X + a.x, Y + a.y); c.lineTo(X + b.x, Y + b.y); c.stroke(); } c.restore(); } }
    }
    function drawUnder(c, f, X0, Y0, T, tg) {
      const t = F.t, X = H.sx(G.x), Y = H.sy(G.y);
      // the sigil (light only), cracks branching from it, the soft dark of the opening (fades)
      { const sk = sstep(0, 0.6, t) * (1 - sstep(2.6, 3.4, t)); if (sk > 0.01) { const r = T * 1.9 * S * (0.5 + 0.5 * H.ease.out(cl(t / 0.6))); c.save(); c.translate(X, Y); c.rotate(0); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = sk * (0.75 + 0.15 * Math.sin(t * 5)); c.rotate(t * 0.25); c.drawImage(sigilSpr(), -r, -r, r * 2, r * 2); c.restore(); glowF(c, X, Y, T * 2.2 * S, AMBER, sk * 0.35, H.GY);
        drawCracks(c, X, Y, T, 2.3 * S, cl(t / 0.9) * 2.3 * S, sk * 0.8, (seed + 2) % 5);
        const hk = sstep(0.3, 0.7, t) * (1 - sstep(2.0, 2.7, t)); if (hk > 0.01) { c.save(); c.globalAlpha = hk * 0.85; c.drawImage(shadowSpr(), X - T * 1.5 * S, Y - T * 1.5 * S * H.GY, T * 3 * S, T * 3 * S * H.GY); c.restore(); } } }
      // the contact shadow under the golem and its feet
      if (!gone && G.st !== 'gone' && t > 0.6) { const a = (crumble >= 0 ? 1 - sstep(0.8, 1.5, crumble) : 1) * sstep(0.6, 1.4, t) * G.dimA; c.save(); c.globalAlpha = 0.75 * a; const w = T * 2.6 * S; c.drawImage(shadowSpr(), X - w / 2, Y - w * 0.25, w, w * 0.5); if (G.lastOut) for (const s of ['footL', 'footR']) { const p = G.lastOut[s]; if (p) { c.globalAlpha = 0.6 * a; c.drawImage(shadowSpr(), p[0] - T * 0.55 * S, p[1] + T * 0.08 - T * 0.25 * S, T * 1.1 * S, T * 0.5 * S); } } c.restore(); }
      // the Worldbreaker gather: a golden fracture spreading across the target area, under the feet
      if (G.st === 'wb' || (wbT > 0 && !peace)) { const w = t - wbT; if (w > 0 && w < 1.8) { const fw = fwd(), cx = H.sx(G.x + fw[0] * 0.8 * S), cy = H.sy(G.y + fw[1] * 0.8 * S); drawCracks(c, cx, cy, T, R_WAVE * 0.7, sstep(0.1, 1.2, w) * R_WAVE * 0.7, 0.6 * (1 - sstep(1.45, 1.8, w)), (seed + 4) % 5); glowF(c, cx, cy, T * 1.6 * S, AMBER, 0.3 * sstep(0.2, 1.2, w) * (1 - sstep(1.4, 1.6, w)), H.GY); } }
      for (const v of vfx) { const lt = t - v.t0, u = lt / v.life, vx = H.sx(v.x), vy = H.sy(v.y);
        if (v.kind === 'cracks') { const front = cl(lt / v.sp) * v.R; drawCracks(c, vx, vy, T, v.R, front, (1 - sstep(0.45, 1, u)) * 0.9, v.seed); glowF(c, vx, vy, T * v.R * 0.5, AMBER, 0.35 * (1 - sstep(0, 0.4, u)), H.GY); }
        else if (v.kind === 'ring') { const r = T * v.R * H.ease.out(cl(u / 0.8)); band(c, 'd', vx, vy, r, r * 0.28, (1 - u) * 0.9); }
        else if (v.kind === 'step') { glowF(c, vx, vy, T * 0.45 * S, '#C8B496', 0.12 * (1 - u), H.GY); }
      }
      // the waves on the floor: the dust band behind, the lit leading edge, the light ripples
      for (const w of waves) { const lt = t - w.t0, rp = w.r * T, X1 = H.sx(w.x), Y1 = H.sy(w.y), done = w.r >= w.R ? cl((lt - w.R / w.v) / 0.6) : 0, a = 1 - done;
        if (rp > 2) { band(c, 'd', X1, Y1, rp * 1.02, rp * (w.kind === 'wb' ? 0.3 : 0.24), a * 0.95); band(c, 'e', X1, Y1, rp, Math.max(T * 0.3, rp * 0.08), a * (w.kind === 'wb' ? 1 : 0.8)); if (w.kind === 'wb') band(c, 'e', X1, Y1, rp * 0.82, rp * 0.05, a * 0.4); }
        // rolling dust behind the front
        if (w.kind === 'wb' && rp > 4) { const sp = puffSpr(), n = 18 + 6 * tier; c.save(); for (let i = 0; i < n; i++) { const b = i / n * TAU + R1(seed + i) * 0.3, rr = rp * (0.82 + 0.1 * R1(i * 3 + seed)) - T * 0.3, pr = T * (0.55 + 0.35 * R1(i * 7)) * (0.7 + 0.5 * cl(lt)); c.globalAlpha = 0.55 * a * (1 - cl(lt / 1.8)); c.drawImage(sp, X1 + Math.cos(b) * rr - pr, Y1 + Math.sin(b) * rr * H.GY - pr * 0.6, pr * 2, pr * 1.2); } c.restore(); }
        if (w.kind === 'wb') ridge(c, w, T, t, true);
      }
      for (const v of vfx) if (v.kind === 'spires') spires(c, v, T, t, true);
    }
    /* the travelling ridge: heavy rock slabs standing up along the front (rising as it arrives), a second lower row behind;
       the far half drawn under everything, the near half over (dimmed where it would cover the pet) */
    function ridge(c, w, T, t, back) {
      const lt = t - w.t0, rp = w.r * T, X1 = H.sx(w.x), Y1 = H.sy(w.y), done = w.r >= w.R ? cl((lt - w.R / w.v) / 0.45) : 0; if (rp < 3 || done >= 1) return;
      const N = 30 + 8 * tier, hk = (0.85 + 0.25 * tier) * (1 - 0.45 * w.r / w.R) * (1 - done) * sstep(0, 0.12, lt), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45;
      for (const row of [1, 0]) for (let i = 0; i < N; i++) {
        const b = (i + (row ? 0.5 : 0)) / N * TAU + R1(i * 5 + seed) * 0.08, isBack = Math.sin(b) < 0; if (isBack !== back) continue;
        const rr = rp * (row ? 0.86 : 1) + T * (R1(i * 11 + seed) - 0.5) * 0.25, x = X1 + Math.cos(b) * rr, y = Y1 + Math.sin(b) * rr * H.GY;
        const spr = slabSpr((i + row * 3) % 8), hh = T * hk * (row ? 0.6 : 1) * (0.75 + 0.5 * R1(i * 13 + seed)), ww = hh * 0.8 * spr.width / spr.height * 1.6, show = cl(0.35 + 0.65 * (1 - done));
        let a = 1; if (!back) a = 0.3 + 0.7 * sstep(T * 0.3, T * 1.1, Math.hypot(x - PX, y - hh * 0.5 - PY));
        c.save(); c.globalAlpha = a * (1 - done * done); c.drawImage(spr, 0, 0, spr.width, spr.height * show, x - ww / 2, y - hh * show, ww, hh * show); c.restore();
      }
    }
    // Celestial: a towering jagged ridge of spires thrown up round the impact, collapsing back
    function spires(c, v, T, t, back) {
      const lt = t - v.t0, u = lt / v.life; if (u >= 1) return; const X1 = H.sx(v.x), Y1 = H.sy(v.y), N = 12, rise = H.ease.out(cl(lt / 0.18)) * (1 - sstep(0.55, 1, u)), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45;
      for (let i = 0; i < N; i++) { const b = i / N * TAU + 0.2, isBack = Math.sin(b) < 0; if (isBack !== back) continue; const rr = T * (1.25 + 0.2 * R1(i + seed)) * (1 + 0.3 * u), x = X1 + Math.cos(b) * rr, y = Y1 + Math.sin(b) * rr * H.GY, spr = slabSpr(i % 8), hh = T * (1.4 + 0.6 * R1(i * 3 + seed)) * rise, ww = T * 0.9;
        if (hh < 1) continue; let a = 1; if (!back) a = 0.3 + 0.7 * sstep(T * 0.3, T * 1.1, Math.hypot(x - PX, y - hh * 0.5 - PY));
        c.save(); c.globalAlpha = a; c.drawImage(spr, x - ww / 2, y - hh, ww, hh); c.restore(); if (!back) glowF(c, x, y - hh * 0.3, T * 0.4, GOLD, 0.3 * rise * a); }
    }
    function draw(c, f, X0, Y0, T, tg) {
      const t = F.t;
      // the near half of the ridge and the spires, flashes at the contacts, the pebbles spiralling to the fists
      for (const w of waves) if (w.kind === 'wb') ridge(c, w, T, t, false);
      for (const v of vfx) if (v.kind === 'spires') spires(c, v, T, t, false);
      const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.45;
      for (const v of vfx) { if (v.kind !== 'rocks') continue; const dt = Math.min(0.05, t - v.last), X = H.sx(v.x), Y = H.sy(v.y), lt = t - v.t0, a = 1 - sstep(1.4, 2.0, lt); v.last = t;
        for (const r of v.R) { if (lt < r.d) continue; r.vh -= 9 * dt; r.h += r.vh * dt; if (r.h < 0) { r.h = 0; r.vh = -r.vh * 0.25; r.vx *= 0.5; r.vr *= 0.5; } r.x += r.vx * dt * 0.6; r.r += r.vr * dt;
          const spr = slabSpr(r.k), w = T * r.s, hh = w * spr.height / spr.width, px = X + r.x * T, py = Y - r.h * T * CE; c.save(); c.globalAlpha = a; c.translate(px, py); c.rotate(r.r); c.drawImage(spr, -w / 2, -hh * 0.6, w, hh); c.restore(); } }
      for (const v of vfx) { if (v.kind !== 'flash') continue; const u = (t - v.t0) / v.life, x = H.sx(v.x), y = H.sy(v.y) - v.z * CE * T, a = (1 - u) * (0.35 + 0.65 * sstep(T * 0.3, T * 1.2, Math.hypot(x - PX, y - PY))); glowF(c, x, y, T * v.r * (0.6 + 0.4 * u), AMBER, a * 0.8); glowF(c, x, y, T * v.r * 0.35, EMBER, a * 0.9); }
      if (pebs.length && G.lastOut) { const O = G.lastOut; c.save(); for (const p of pebs) { const tgt = O['fist' + p.side]; if (!tgt) continue; const e = p.u * p.u * (3 - 2 * p.u), sx0 = H.sx(p.x0), sy0 = H.sy(p.y0), sw = Math.sin(p.u * Math.PI) * T * 0.7, ang = p.a + p.sp * p.u, x = lerp(sx0, tgt[0], e) + Math.cos(ang) * sw, y = lerp(sy0, tgt[1], e) + Math.sin(ang) * sw * 0.5 - Math.sin(p.u * Math.PI) * T * 0.4, s = T * p.s * 1.3;
        const ro = p.a + p.u * p.sp * 2, cr = Math.cos(ro), sr = Math.sin(ro), pt = (u, v) => [x + (u * cr - v * sr) * s, y + (u * sr + v * cr) * s];
        c.globalAlpha = Math.min(1, p.u * 5) * G.dimA; c.fillStyle = p.side === 'L' ? '#6A635A' : '#4F4943'; c.strokeStyle = INK; c.lineWidth = 0.8; c.beginPath(); [[1, 0], [0.2, 0.8], [-0.8, 0.5], [-0.6, -0.6], [0.3, -0.7]].forEach((q, j) => { const P2 = pt(q[0], q[1]); j ? c.lineTo(P2[0], P2[1]) : c.moveTo(P2[0], P2[1]); }); c.closePath(); c.fill(); c.stroke(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= 0.35; blitSized(c, glowSprite(AMBER), x - s * 1.6, y - s * 1.6, s * 3.2, s * 3.2); c.globalCompositeOperation = 'source-over'; } c.restore(); }
      // the windup: thin streams of mineral light rising from the ground toward the arms
      if (G.st === 'wb' && G.lastOut) { const w = t - wbT, k = sstep(0.7, 1.0, w) * (1 - sstep(1.35, 1.5, w)); if (k > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let j = 0; j < 6 + 2 * tier; j++) { const s = j % 2 ? 'L' : 'R', p = G.lastOut['fist' + s]; if (!p) continue; const b = j * 2.4 + seed, bx = H.sx(G.x + Math.cos(b) * 1.8 * S), by = H.sy(G.y + Math.sin(b) * 1.2 * S), uu = (t * 0.9 + j * 0.17) % 1, mx = lerp(bx, p[0], uu), my = lerp(by, p[1], uu); c.globalAlpha = k * 0.5 * Math.sin(uu * Math.PI); c.strokeStyle = HONEY; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(lerp(bx, p[0], Math.max(0, uu - 0.25)), lerp(by, p[1], Math.max(0, uu - 0.25))); c.lineTo(mx, my); c.stroke(); } c.restore(); } }
    }
    return F;
  };
  U.titan.warm = o => {
    const ev = Math.max(1, Math.min(7, Math.round(o.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; setScale(T, 0.103 * (1 + 0.02 * (ev - 1)), typeof devicePixelRatio === 'number' ? devicePixelRatio : 1); warmTasks(tier, 0); planBakes(tier, Math.PI / 2); idleBake(); }, 300);
  };
  // the debug door for the harness: the model alone, the poses
  U.titan.__dbg = { FC, CLIPS, bakeStep, planBakes, frameFor, blitFrame, setScale, clipPose, drawGolem, prepGolem, paintGolem, model, rig, kfPose, walkPose, idlePose, mirrorP, KP, POSES: { PUNCH, BACKHAND, SLAM, RISE, WB, PEACE }, D0 };
})();
