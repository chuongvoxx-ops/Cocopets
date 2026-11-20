/* ---------- (v426 BL) Belial, the World Pillar: the Taurus Anima (Zodiac Anima No. 02) as a real 3D model on GLM ----------
   A colossal biomechanical bull fused with a fortress and divine gravitational machinery (the user's concept, 2026-11-19):
   four pillar legs (an armoured upper leg, a fluted column of masonry blocks round a dark core with a turning stabiliser
   ring, a stepped sacred plinth for a hoof with segmented toes, a piston on each knee that really compresses), a broad
   obsidian barrel under three rows of overlapping ivory stone-ceramic plates with gilded rims, shoulder bastions like the
   walls of a keep (layered pauldrons, a rampart with lit windows, a turret), haunch armour, a neck of armoured vertebrae,
   an angular bull skull (an ivory faceplate with a ridge and engraved gold, deep amber eyes under brow plates, layered cheek
   armour, a segmented muzzle, vents, the Taurus sign on its brow, a jaw that drops to show the gravitational engine glowing
   inside), two crescent gravitational-engine horns (eight overlapping engraved gold segments round a glowing amber core, a
   dark runic band along the outside, gilded joint rims; the segments unfold to bare the core; rings orbit them at their own
   angles and speeds with stone fragments), the Core of Dominion in its chest (a dense banded planet with amber fissures in a
   transparent amber field, an armillary of gold rings - toothed, runic, double-railed - turning on their own axes, a
   stabiliser cage, orbiting fragments, in a toothed gold frame ringed by gate plates), a citadel on its back (a platform,
   crenellated walls with lit arcades, buttresses onto the flanks, corner turrets, a pillared temple hall under an upturned
   tiled roof, and by its form an upper tier, towers, gothic spires, a central spire), six hinged fortress plates on the
   flanks that rise into a defensive array, a segmented tail ending in a floating gravitational anchor, maroon banners with
   the sign, floating monoliths and, at the last form, a celestial halo.
   Forms (the Anima's ascension: k 1 base, 2 level 4, 3 level 7): Belial (the fortress-bull, its hall and two spires, two
   rings a horn), Ascended Belial (more fortress armour, more horn machinery, an upper tier, towers, three secondary
   monoliths, more core rings) and Celestial Belial (the full citadel, six great monoliths, four horn rings, the brightest
   core, gold light through the skeleton, the halo). Materials: GLM ids 280..299 (20k5uz).
   Everything is procedural geometry built once in idle-time slices into GLM meshes (sides mirrored), posed every frame from a
   pose P (idlePose; 20g3-belial-moves.js drives it): a heavy four-beat walk with planted feet (two-bone IK per leg; the
   front legs take the weight and compress, the hind legs push), the head (dip, raise, look), the jaw, the horns (unfold,
   ring speed), the core (brightness, opening), the citadel (the carapace array, the ultimate's extension), the bastions,
   monoliths, a dissolve into gold dust and an assembly (the summoning). life(P) lays its living motion over any pose.
   draw(c, o) renders it on the GPU at its screen size and lays the image on the canvas, returning the screen points the
   effects need; drawParts(c, list) draws effect meshes (the World Pillars, rocks, gravity rings, monoliths) in screen space.
   Pure: no game state is read or written (the boss fight can reuse every piece). release() frees the GPU buffers (they
   upload again on the next draw). Real-GPU WebGL only, like Abaddon (window.__BL_GL = 1 / __NG_GL = 1 force it on a software
   rasteriser for the tests; __BL_GL = 0 turns it off): without it AnimaArt draws the cel model (02f2 MODELS.taurus).
   v430 BP (the animation polish; shared with the boss, 20q2, through the same calls):
   - gait(ph, mv, gk): a diagonal-couplet walk (the diagonal pairs a fifth of a cycle apart), stances that match the body's travel
     exactly (no foot slides), swings on a mechanical arc (toe-off flex, high early, reach, a vertical plant); gk the stride (P.gaitK).
   - motion(inst, P) NEW HOOK: the per-instance motion (inst.blM), stepped by draw() itself whenever o.inst is given (so nothing new to
     call): planted feet that keep their place on the floor (turning twists the body over them; settle steps after a stop, a turn in
     place or a wider stance), the body's inertia (footfall dip, the lurch and settle of a stop, the turn's sway), the head leading
     into turns, the tail's lagging chain, the citadel's restrained sway. draw()'s result adds r.steps (feet landed this frame) and r.lifts.
   - new pose keys (idlePose defaults, all neutral): spread (stance width), shift (weight sideways), mech (machinery working), gaitK.
   - draw(): weight transfer (the body shifts off a lifted leg, sags over it), shoulders and haunches riding their legs, idle weight
     shifts and deliberate neck adjustments (life(P): shift, neckL, neckH, armour), horn segments turning on their own, debris
     orbiting the Core, the citadel's tiers rising in turn, its plates unlatching, overshooting and chattering, an ankle on each hoof. */
const BELIAL_GL = (() => {
  const TAU = Math.PI * 2, EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL);
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const I3 = [1, 0, 0, 0, 1, 0, 0, 0, 1], MY = [1, 0, 0, 0, -1, 0, 0, 0, 1];
  const mm = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const scl3 = k => [k, 0, 0, 0, k, 0, 0, 0, k];
  function axisR(u, a) { const [x, y, z] = norm(u), c = Math.cos(a), s = Math.sin(a), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; }
  // a turn taking z to the direction d (its x as near xh as it can be)
  function frameZ(d, xh) { const z = norm(d); let x = sub(xh || [1, 0, 0], mul(z, dot(z, xh || [1, 0, 0]))); if (len(x) < 1e-4) x = sub([0, 1, 0], mul(z, z[1])); x = norm(x); const y = cross(z, x); return [x[0], y[0], z[0], x[1], y[1], z[1], x[2], y[2], z[2]]; }
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const WS = 0.1;   // GLM world units a model unit
  /* the materials (20k5uz, ids 280..299; a fraction picks a variant < 0.5) */
  const MT = { IV: 280, OB: 281, BZ: 282, GD: 283, AM: 284, EYE: 285, PLAN: 286, SHELL: 287, RING: 288, LRING: 289, WALL: 290, ROOF: 291, CLOTH: 292, STONE: 293 };
  const bz = (P, u) => { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };
  const bzd = (P, u) => { const v = 1 - u, a = -3 * v * v, b = 3 * v * v - 6 * u * v, c = 6 * u * v - 3 * u * u, d = 3 * u * u; return [0, 1, 2].map(i => a * P[0][i] + b * P[1][i] + c * P[2][i] + d * P[3][i]); };

  /* ================= the mesh helpers ================= */
  /* an armour plate: a thick curved shell along a centreline (4 cubic points o.c, or a function o.cf), half width o.w(u) across
     (S = T x nrm), cupped by o.cup, thickness o.th(u, v), rounded rims; edge 1 on its rims (the material's gilded trim) */
  function plate(B, o) {
    const P = o.c, nu = o.nu || 14, nv = o.nv || 5, cup = o.cup || 0, N0 = norm(o.nrm || [0, 0, 1]), shf = o.shift || 0, lft = o.lift || 0, m = o.mat == null ? MT.IV : o.mat;
    const cf = o.cf || (u => bz(P, u)), cd = o.cf ? (u => sub(o.cf(Math.min(1, u + 0.003)), o.cf(Math.max(0, u - 0.003)))) : (u => bzd(P, Math.min(0.995, Math.max(0.005, u))));
    const FR = []; for (let i = 0; i <= nu; i++) { const u = i / nu, C = cf(u), T = norm(cd(u)); let S = cross(T, N0); if (len(S) < 1e-4) S = cross(T, [0, 0, 1]); S = norm(S); FR.push({ C, T, S, N: cross(S, T) }); }
    const F = u => FR[Math.max(0, Math.min(nu, Math.round(u * nu)))];
    const wid = u => Math.max(0.004, o.w(u)), thk = (u, v) => Math.max(0.01, o.th ? o.th(u, v) : 0.12);
    const mid = (u, v) => { const f = F(u), w = wid(u); return add(add(f.C, mul(f.S, w * (v + shf))), mul(f.N, cup * w * (v * v - 0.35) + lft)); };
    const t0 = o.trim0 == null ? 0.8 : o.trim0, trim = v => sstep(t0, 0.985, Math.abs(v));
    const face = (sg, mt) => B.surf((u, s) => { const v = s * 2 - 1, f = F(u); return add(mid(u, v), mul(f.N, sg * thk(u, v) * 0.5)); }, nu, nv, () => mt, { flip: sg > 0, e: (u, s) => Math.max(trim(s * 2 - 1), o.endTrim ? sstep(0.92, 1, Math.abs(u * 2 - 1)) : 0) });
    face(1, m); face(-1, o.under == null ? MT.OB : o.under);
    const rim = (vs, flip) => B.surf((u, s) => { const f = F(u), th = thk(u, vs), a = Math.PI * s; return add(add(mid(u, vs), mul(f.N, Math.cos(a) * th * 0.5)), mul(f.S, vs * Math.sin(a) * th * 0.42)); }, nu, 3, () => o.rimMat == null ? m : o.rimMat, { flip, e: () => 1 });
    rim(-1, false); rim(1, true);
    if (o.caps !== false) for (const ue of [0, 1]) if (wid(ue) > 0.03) B.surf((v01, s2) => { const v = v01 * 2 - 1, f = F(ue); return add(mid(ue, v), mul(f.N, (s2 - 0.5) * thk(ue, v))); }, 5, 1, () => o.rimMat == null ? m : o.rimMat, { flip: ue === 1, e: () => 1 });
    return FR;
  }
  /* a strip on a surface along a polyline (normals nrm(i)), w wide; aux 0..1 along it, edge 0..1 across */
  function strip(B, pts, nrm, w, mat, lift) {
    const n = pts.length, lf = lift == null ? 0.02 : lift;
    B.surf((u, v) => { const i = Math.round(u * (n - 1)), p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], T = norm(sub(b, a)), N = nrm(i), S = norm(cross(T, N)), tp = Math.min(1, Math.min(i, n - 1 - i) * 0.6 + 0.4);
      return add(add(p, mul(N, lf)), mul(S, (v - 0.5) * w * tp)); }, n - 1, 1, () => mat, { flip: true, e: (u, v) => v, a: u => u });
  }
  // lathes: about z up from c (prof [[h, r, mat]]), about -z down from c, about x
  const latheZ = (B, prof, m, seg, c, edge) => { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: edge || (j => (prof[j][3] || 0)) }); B.pop(); };
  const latheD = (B, prof, m, seg, c) => { B.push([0, 0, -1], [0, 1, 0], [1, 0, 0], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  const latheX = (B, prof, m, seg, c) => { B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], c || [0, 0, 0]); B.lathe(prof, m, { seg: seg || 18, edge: j => (prof[j][3] || 0) }); B.pop(); };
  // the Taurus sign (a circle under an upward crescent) in a frame at o: up its up, nrm out of it; s its size
  function glyph(B, o, up, nrm, s, mat) { const x = norm(cross(up, nrm)); B.push(x, norm(up), norm(nrm), o); B.tor([0, -0.32 * s, 0], 0.36 * s, 0.075 * s, mat, { seg: 22, rseg: 5 }); B.tor([0, 0.32 * s, 0], 0.42 * s, 0.07 * s, mat, { seg: 16, rseg: 5, ph0: Math.PI + 0.25, ph1: TAU - 0.25 }); B.pop(); }
  /* an upturned hip roof (a temple's): eaves the rectangle hx x hy about (cx, cy) at z0, the ridge from -rl..rl at rz; the
     corners curl up by curl; the profile concave (steep at the ridge, flat at the eaves); gilded along its eaves and hips */
  function hipRoof(B, cx, cy, z0, hx, hy, rz0, rl, curl, m, q) {
    const nn = Math.max(4, Math.round(10 * (q || 1)));
    const panel = (E, Rg) => { const pos = (s, t) => { const e = E(s), r = Rg(s), tt = Math.pow(t, 1.55), cu = curl * Math.pow(Math.abs(s * 2 - 1), 3) * (1 - t) * (1 - t); return [lerp(e[0], r[0], t), lerp(e[1], r[1], t), lerp(z0, rz0, tt) + cu]; };
      const a = pos(0.45, 0.5), b = pos(0.55, 0.5), c2 = pos(0.5, 0.55), nz = cross(sub(b, a), sub(c2, a))[2];
      B.surf(pos, nn, Math.max(4, Math.round(7 * (q || 1))), () => m, { flip: nz < 0, e: (s, t) => Math.max(1 - sstep(0, 0.09, t), sstep(0.9, 1, Math.abs(s * 2 - 1)) * (1 - t * 0.3)) }); };
    panel(s => [cx + lerp(-hx, hx, s), cy + hy], s => [cx + lerp(-rl, rl, s), cy, rz0]);
    panel(s => [cx + lerp(hx, -hx, s), cy - hy], s => [cx + lerp(rl, -rl, s), cy, rz0]);
    panel(s => [cx + hx, cy + lerp(hy, -hy, s)], () => [cx + rl, cy, rz0]);
    panel(s => [cx - hx, cy + lerp(-hy, hy, s)], () => [cx - rl, cy, rz0]);
    if (rl > 0.01) B.tube([cx - rl - 0.06, cy, rz0 + 0.02], [cx + rl + 0.06, cy, rz0 + 0.02], 0.05, 0.05, MT.GD, { seg: 6 });
    for (const sx of [1, -1]) B.crystal([cx + sx * rl, cy, rz0], [cx + sx * (rl + 0.12), cy, rz0 + 0.42], 0.06, MT.GD, { n: 4, bend: -0.3 * sx, up: [0, 1, 0] });
    for (const sx of [1, -1]) for (const sy of [1, -1]) B.crystal([cx + sx * hx, cy + sy * hy, z0 + curl], [cx + sx * (hx + 0.12), cy + sy * (hy + 0.12), z0 + curl + 0.28], 0.04, MT.GD, { n: 4 });
  }

  /* ================= the anatomy ================= */
  /* the barrel: cross-sections along x (x, half width, half height, centre height): front-heavy and hulking, the shoulders the
     highest and widest, the back sloping down to the haunches, the chest deep (nearly to the knees); a superellipse (a fortress) */
  const TB = [[-3.75, 1.5, 1.45, 6.35], [-3.1, 2.1, 1.85, 6.25], [-1.9, 2.3, 2.0, 6.2], [-0.3, 2.4, 2.2, 6.3], [1.2, 2.7, 2.55, 6.45], [2.3, 2.8, 2.72, 6.5], [3.2, 2.4, 2.5, 6.3], [3.75, 1.65, 1.85, 6.1]];
  function tb(x) { if (x <= TB[0][0]) return TB[0].slice(1); for (let i = 1; i < TB.length; i++) if (x <= TB[i][0]) { const a = TB[i - 1], b = TB[i], u = sstep(a[0], b[0], x); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return TB[TB.length - 1].slice(1); }
  const SPX = 3.2, se = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
  const bodyPt = (x, ph, o) => { const [w, h, zc] = tb(x); return [x, (w + (o || 0)) * se(Math.cos(ph), SPX), zc + (h + (o || 0)) * se(Math.sin(ph), SPX)]; };
  const sideY = (x, c) => tb(x)[0] * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(c), SPX)), 1 / SPX);
  const BODYC = [0.0, 0, 6.3];                         // the body's pivot (it pitches and banks about it)
  const CORE = [4.05, 0, 5.25], CORER = 0.95, CF = CORER / 0.62;   // the Core of Dominion (CF: its scale over the parts built at 0.62)
  const BASTP = [2.05, 2.3, 8.55], HAUNP = [-2.55, 2.05, 7.75], BSC = 1.35;   // the shoulder bastions' and the haunches' pivots (+y side), the bastions' scale
  const NECK0 = [3.05, 0, 8.0], HEADP = [4.35, 0, 8.3], HS = 1.25;          // the neck's root, the head's pivot (at rest), the head's scale
  const HORNM = [0.15, 0.98, 0.8];                     // the horn's mount, head local (+y side)
  const TAIL0 = [-3.95, 0, 7.15];
  const CITF = 9.1, CITR = 8.2, CITZ = CITR;           // the citadel's floors: the front keep over the shoulders, the rear terrace
  const L1 = 2.3, L2 = 2.25, HOOFH = 0.62;             // upper leg, lower leg, hoof (before its scale)
  /* v430 BP: a heavy diagonal-couplet walk: the diagonal pairs (hind +y with front -y, hind -y with front +y) step a fifth of a cycle
     apart (the hind leading), the pairs half a cycle apart: never two legs of a side together, never a pair in step */
  const LEGS = [   // the hip (x, y, z), side, front, the gait's phase offset, the leg's thickness, the hoof's scale, the foot's y
    { x: 2.2, hy: 1.9, z: 5.45, s: 1, f: 1, off: 0.7, w: 1.75, hs: 1.8, fy: 2.25 }, { x: 2.2, hy: 1.9, z: 5.45, s: -1, f: 1, off: 0.2, w: 1.75, hs: 1.8, fy: 2.25 },
    { x: -2.45, hy: 1.75, z: 5.35, s: 1, f: 0, off: 0.0, w: 1.5, hs: 1.55, fy: 2.0 }, { x: -2.45, hy: 1.75, z: 5.35, s: -1, f: 0, off: 0.5, w: 1.5, hs: 1.55, fy: 2.0 }];
  const STRIDE = 2.1, SWING = 0.28;                    // stride (model units), the swing's share of a step cycle
  // the horn: a crescent rising from the mount out and up round a centre above it, its tip curling in over the head (horn local: x forward, y out, z up)
  const HA0 = -Math.PI / 2, HA1 = HA0 + 2.45, HRY = 1.95, HRZ = 1.7, HCN = [0.5, 0, HRZ];   // (a 140 deg crescent: out sideways from the mount, up, curling in at the tip, and leaning forward as it rises)
  const hornP = u => { const a = HA0 + (HA1 - HA0) * u; return [0.7 * Math.pow(u, 1.4), HRY * Math.cos(a), HRZ * (1 + Math.sin(a))]; };
  const hornR = u => 0.5 * (1 - 0.78 * u) + 0.04;
  function hornF(u) { const T = norm(sub(hornP(Math.min(1, u + 0.004)), hornP(Math.max(0, u - 0.004)))); let Bn = norm(sub([1, 0, 0], mul(T, T[0]))), N = cross(T, Bn); const p = hornP(u), out = sub(p, HCN); if (dot(N, out) < 0) { Bn = mul(Bn, -1); N = mul(N, -1); } return { P: p, T, N, Bn }; }
  const hornQ = (u, ph, k) => { const f = hornF(u), r = hornR(u) * k, c = se(Math.cos(ph), 3.2), s = se(Math.sin(ph), 3.2); return add(f.P, add(mul(f.N, c * r), mul(f.Bn, s * r * 0.84))); };
  const NHS = 8, HSEG = [];
  for (let i = 0; i < NHS; i++) { const um = (i + 0.5) / NHS, f = hornF(um); HSEG.push({ c: f.P, o: f.N, t: f.T }); }
  const HRINGS = [   // the horn's rings: on the arc (u: its place, k: radius over the horn's, ax: its tilt), or great rings round it (c, ax, R)
    { u: 0.36, k: 1.75, ax: [0.5, 0.1, 0], sp: 1.1 }, { u: 0.56, k: 2.0, ax: [-0.6, 0.25, 0], sp: -1.45 }, { u: 0.74, k: 2.3, ax: [0.65, -0.2, 0], sp: 1.8 },
    { u: 0.47, k: 3.0, ax: [-0.9, 0.3, 0], sp: 0.5 }];
  const HRUSE = [[], [0, 3], [0, 1, 3], [0, 1, 2, 3]];
  const CRINGS = [{ R: 0.98, ax: [0.2, 1, 0.1], sp: 0.7, m: 0 }, { R: 1.08, ax: [1, 0.15, 0.6], sp: -0.5, m: 1 }, { R: 0.9, ax: [0.1, 0.5, 1], sp: 1.1, m: 2 }, { R: 1.18, ax: [0.7, -0.6, 0.4], sp: -0.85, m: 0 }, { R: 0.82, ax: [-0.5, 0.2, 1], sp: 1.5, m: 1 }];
  const NCR = [0, 3, 4, 5];
  const MONOS = [   // floating monoliths: angle round it, radius, height, scale (the first three the secondary ones)
    { a: 2.5, r: 5.8, z: 11.2, s: 1.0 }, { a: -2.3, r: 5.6, z: 11.8, s: 0.95 }, { a: 0.55, r: 6.0, z: 12.2, s: 0.9 }, { a: 1.6, r: 6.6, z: 13.1, s: 1.3 }, { a: -1.25, r: 6.8, z: 12.7, s: 1.35 }, { a: 3.35, r: 6.3, z: 13.6, s: 1.25 }];
  const NMONO = [0, 0, 3, 6];
  const HEIGHT = [0, 12.4, 13.6, 15.0];   // each form's height (model units) for its size

  let D = null;
  function* gen() {
    const q = lowFx() ? 0.7 : 1, M = {}, Q = n => Math.max(3, Math.round(n * q));
    const mk = f => { const B = GLM.builder(q); f(B); return B.done(); };
    /* ---- the barrel: a dominant obsidian substructure under rows of angular, bevelled, pointed ivory slabs (gilded on their sides, an
       engraved gold line across each), the obsidian showing between them; a gold trim line and an amber channel along each flank,
       gold bands, bronze ribs under the belly; the Core's gate (a toothed gold frame, clamps, angular gate plates radiating round it) ---- */
    M.torso = mk(B => {
      B.surf((u, v) => bodyPt(lerp(-3.75, 3.75, u), v * TAU), Q(26), Q(32), () => MT.OB, { flip: true, e: () => 0 });
      B.ell([-3.75, 0, 6.35], [0.55, 1.5, 1.45], MT.OB, { seg: 22, rings: 10 }); B.ell([3.72, 0, 6.1], [0.55, 1.65, 1.85], MT.OB, { seg: 24, rings: 10 });
      const slab = (x, s, c0, wx, hy, tilt, mat) => { const [, h, zc] = tb(x), y0 = sideY(x, c0), z0 = zc + h * c0, n = norm([0, s, c0 * 0.85 - tilt]), xa = [1, 0, 0], ya = cross(n, xa), up = ya[2] < 0 ? -1 : 1;
        const pts = [[-wx, hy], [wx, hy], [wx * 1.06, -hy * 0.25], [0, -hy * 1.25], [-wx * 1.06, -hy * 0.25]].map(p => [p[0], p[1] * up]);
        B.push(xa, ya, n, [x, s * (y0 - 0.02), z0]); B.prism(pts, 0, 0.17, mat, { b: 0.04, backM: MT.OB }); B.box([0, 0.35 * hy * up, 0.175], [wx * 0.7, 0.025, 0.012], 0.006, MT.GD); B.pop(); };
      for (const s of [1, -1]) {
        for (let x = -3.1, j = 0; x <= 1.4; x += 1.32, j++) slab(x, s, 0.3, 0.62, 0.95, 0.2, MT.IV + (j % 2 ? 0.3 : 0));
        for (let x = -2.45, j = 0; x <= 2.8; x += 1.32, j++) slab(x, s, -0.62, 0.62, 0.42, 0.08, MT.IV + (j % 2 ? 0 : 0.3));
                { const pts = []; for (let i = 0; i <= 16; i++) { const x = lerp(-3.4, 3.3, i / 16), [, h, zc] = tb(x); pts.push([x, s * (sideY(x, -0.3) + 0.01), zc - h * 0.3]); } strip(B, pts, () => [0, s, -0.1], 0.07, MT.AM, 0.015); } }
      for (let x = -3.1; x <= 3.0; x += 0.6) B.surf((u, v) => bodyPt(x + (v - 0.5) * 0.14, lerp(-2.35, -0.8, u), 0.03 + 0.07 * Math.sin(v * Math.PI)), Q(10), 2, () => MT.BZ, { flip: true, e: () => 0.3 });
      const CX = CORE[0] - 0.22, CZ = CORE[2];
      B.ell([CX - 0.15, 0, CZ], [0.45, 1.18 * CF, 1.18 * CF], MT.OB + 0.2, { seg: 30, rings: 10 });
      B.torX([CX, 0, CZ], 1.3 * CF, 0.17 * CF, MT.GD, { seg: 60, rseg: 6, teeth: 30, tooth: 0.09 }); B.torX([CX + 0.08, 0, CZ], 1.12 * CF, 0.06 * CF, MT.BZ, { seg: 48, rseg: 5 }); B.torX([CX - 0.08, 0, CZ], 1.5 * CF, 0.07 * CF, MT.GD + 0.2, { seg: 60, rseg: 5 });
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, c = Math.cos(a), s = Math.sin(a); B.push([1, 0, 0], [0, c, s], [0, -s, c], [CX, 0, CZ]); B.box([0.05, 1.42 * CF, 0], [0.18, 0.2 * CF, 0.1 * CF], 0.04, MT.BZ); B.box([0.15, 1.42 * CF, 0], [0.06, 0.08 * CF, 0.06 * CF], 0.02, MT.GD); B.pop(); }
      for (const a0 of [0.5, Math.PI / 2, Math.PI - 0.5, Math.PI + 0.62, TAU - 0.62]) { const c = Math.cos(a0), s = Math.sin(a0), ta = [0, -s, c], ra = [0, c, s], big = Math.abs(a0 - Math.PI / 2) < 0.1, k2 = big ? 1.2 : 1;
        B.push(ta, ra, cross(ta, ra), [CX - 0.1, ra[1] * 1.62 * CF, CZ + ra[2] * 1.62 * CF]); B.prism([[-0.38 * k2, 0], [0.38 * k2, 0], [0.58 * k2, 0.85 * k2], [-0.58 * k2, 0.85 * k2]], -0.24, 0.02, MT.IV, { b: 0.04, backM: MT.OB }); B.pop(); }
      B.tube([CX + 0.05, -0.5, CZ - 1.62 * CF], [CX + 0.05, 0.5, CZ - 1.62 * CF], 0.06, 0.06, MT.GD, { seg: 6 });
      for (let i = 0; i < 5; i++) B.box([3.3 + i * 0.14, 0, 8.2 - i * 0.05], [0.045, 0.6, 0.07], 0.015, i % 2 ? MT.GD : MT.OB);
    }); yield;
    /* ---- a shoulder bastion (+y side; mirrored; drawn at BSC): an obsidian core grown from the shoulder, layered angular pauldrons over the
       leg (faceted, gilded rims), a rampart with lit windows, merlons, a gold string course, turrets ---- */
    const bastion = (B, n, two) => {
      B.box([0.0, -0.4, -0.55], [1.2, 0.5, 0.62], 0.07, MT.OB); B.box([0.0, 0.12, -0.55], [1.22, 0.04, 0.5], 0.01, MT.GD);
      for (let i = n - 1; i >= 0; i--) { const dz = -i * 0.38, dy = i * 0.27, k = 1 + i * 0.11;
        plate(B, { c: [[-1.28 * k, dy - 0.15, dz - 0.45], [-0.5 * k, dy + 0.18, dz + 0.3], [0.5 * k, dy + 0.18, dz + 0.3], [1.28 * k, dy - 0.15, dz - 0.45]], nrm: [0, 0.6, 1], w: u => 0.47 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.12), cup: -0.24, th: () => 0.13, nu: Q(12), nv: 3, mat: MT.IV + (i % 2 ? 0.3 : 0), trim0: 0.8, endTrim: true }); }
      B.box([0, -0.28, 0.68], [1.05, 0.2, 0.24], 0.04, MT.WALL); B.box([0, -0.28, 0.44], [1.08, 0.23, 0.035], 0.01, MT.GD);
      for (let i = 0; i < 6; i++) B.box([-0.9 + i * 0.36, -0.28, 1.0], [0.1, 0.2, 0.09], 0.03, MT.IV);
      const tur = x => { latheZ(B, [[0, 0.32, MT.OB], [0.08, 0.37, MT.GD, 1], [0.14, 0.33, MT.WALL], [0.95, 0.3, MT.WALL], [0.98, 0.36, MT.GD, 1], [1.05, 0.38, MT.ROOF, 1], [1.65, 0.03, MT.ROOF]], MT.WALL, Q(14), [x, -0.25, 0.42]); B.spike([x, -0.25, 2.05], [x, -0.25, 2.55], 0.05, MT.GD); };
      tur(1.12); if (two) tur(-1.12);
    };
    M.bast = [null, mk(B => bastion(B, 2, 0)), mk(B => bastion(B, 3, 1)), mk(B => bastion(B, 4, 1))];
    M.haunch = mk(B => { B.box([0, -0.35, -0.45], [0.95, 0.42, 0.5], 0.06, MT.OB);
      for (let i = 1; i >= 0; i--) plate(B, { c: [[-1.05, i * 0.22 - 0.1, -i * 0.4 - 0.35], [-0.4, i * 0.22 + 0.15, -i * 0.4 + 0.25], [0.4, i * 0.22 + 0.15, -i * 0.4 + 0.25], [1.05, i * 0.22 - 0.1, -i * 0.4 - 0.35]], nrm: [0, 0.6, 1], w: u => 0.42 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.12), cup: -0.22, th: () => 0.13, nu: Q(10), nv: 3, mat: MT.IV + i * 0.3, trim0: 0.8, endTrim: true });
      B.box([0, -0.25, 0.55], [0.8, 0.18, 0.2], 0.04, MT.WALL); for (let i = 0; i < 5; i++) B.box([-0.72 + i * 0.36, -0.25, 0.82], [0.09, 0.18, 0.08], 0.03, MT.IV); B.box([0, -0.25, 0.34], [0.83, 0.2, 0.03], 0.01, MT.GD); }); yield;
    /* ---- the legs (drawn thickened per leg): an armoured upper leg, a column of masonry blocks round a fluted bronze core widening downward,
       a stabiliser ring, a hoof like the stepped, plated base of a fortress tower, pistons ---- */
    M.thigh = mk(B => {
      B.sph([0, 0, 0], 0.64, MT.OB, 16); B.torY([0, 0, 0], 0.66, 0.06, MT.GD, { seg: 24, rseg: 5 });
      latheD(B, [[0.25, 0.58, MT.OB], [0.55, 0.64, MT.OB], [0.58, 0.68, MT.GD, 1], [0.7, 0.68, MT.GD, 1], [0.73, 0.6, MT.OB], [1.5, 0.56, MT.OB], [1.53, 0.62, MT.GD, 1], [1.65, 0.62, MT.GD, 1], [1.68, 0.52, MT.OB], [2.25, 0.5, MT.OB]], MT.OB, Q(18));
      plate(B, { c: [[0.62, 0, -0.1], [0.82, 0, -0.85], [0.8, 0, -1.5], [0.64, 0, -2.15]], nrm: [1, 0, 0], w: u => 0.6 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.15), cup: -0.6, th: () => 0.13, nu: Q(10), nv: 4, mat: MT.IV, trim0: 0.78, endTrim: true });
      plate(B, { c: [[0.1, 0.64, -0.15], [0.1, 0.82, -0.9], [0.0, 0.8, -1.5], [-0.1, 0.66, -2.05]], nrm: [0, 1, 0], w: u => 0.5 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.15), cup: -0.5, th: () => 0.12, nu: Q(10), nv: 3, mat: MT.IV + 0.3, trim0: 0.78, endTrim: true });
      for (const z of [-0.4, -1.1]) B.box([-0.5, 0.42, z], [0.13, 0.13, 0.16], 0.04, MT.BZ);
    });
    M.shin = mk(B => {
      B.sph([0, 0, 0], 0.5, MT.OB, 16); B.torY([0, 0, 0], 0.53, 0.07, MT.GD, { seg: 24, rseg: 5 });
      B.surf((u, v) => { const z = -0.3 - u * (L2 - 0.4), ph = v * TAU, r0 = lerp(0.4, 0.52, u), fl = 1 - 0.07 * (0.5 + 0.5 * Math.cos(ph * 12)); return [Math.cos(ph) * r0 * fl, Math.sin(ph) * r0 * fl, z]; }, Q(6), Q(48), () => MT.BZ, { e: () => 0.2 });
      latheD(B, [[0.22, 0.5, MT.GD, 1], [0.34, 0.5, MT.GD, 1]], MT.GD, Q(20)); latheD(B, [[0.47 * L2, 0.52, MT.GD, 1], [0.47 * L2 + 0.08, 0.52, MT.GD, 1]], MT.GD, Q(20)); latheD(B, [[0.84 * L2, 0.58, MT.GD, 1], [0.84 * L2 + 0.14, 0.6, MT.GD, 1]], MT.GD, Q(20));
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, c = Math.cos(a), s = Math.sin(a); B.push([c, s, 0], [-s, c, 0], [0, 0, 1], [0, 0, 0]); B.box([0.5, 0, -0.5 * L2 - 0.08], [0.12, 0.25, 0.36 * L2], 0.06, MT.IV + (i % 2 ? 0.3 : 0)); B.pop(); }
      plate(B, { c: [[0.5, 0, 0.32], [0.64, 0, 0.0], [0.62, 0, -0.32], [0.52, 0, -0.62]], nrm: [1, 0, 0], w: u => 0.42 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.15), cup: -0.5, th: () => 0.13, nu: Q(8), nv: 4, mat: MT.IV, trim0: 0.78, endTrim: true });
      B.box([-0.42, 0.36, -0.9], [0.12, 0.12, 0.15], 0.04, MT.BZ);
    });
    M.stab = mk(B => { B.tor([0, 0, 0], 0.64, 0.055, MT.BZ, { seg: 32, rseg: 5, teeth: 16, tooth: 0.05 }); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; B.box([Math.cos(a) * 0.64, Math.sin(a) * 0.64, 0], [0.07, 0.07, 0.09], 0.02, MT.GD); } });
    M.hoof = mk(B => {
      latheD(B, [[0, 0.44, MT.OB], [0.04, 0.52, MT.GD, 1], [0.1, 0.52, MT.GD, 1], [0.12, 0.6, MT.IV], [0.4, 0.86, MT.IV, 0.4], [0.42, 0.9, MT.GD, 1], [0.47, 0.9, MT.GD, 1], [0.49, 0.95, MT.IV], [0.6, 0.98, MT.IV, 0.6], [0.62, 0.0, MT.OB]], MT.OB, Q(24));
      B.tor([0, 0, -0.18], 0.66, 0.025, MT.RING, { seg: 32, rseg: 4 });
      for (const a of [-1.15, -0.4, 0.4, 1.15, Math.PI - 0.5, Math.PI + 0.5]) { const c = Math.cos(a), s = Math.sin(a); B.push([c, s, 0], [-s, c, 0], [0, 0, 1], [0, 0, 0]); B.box([0.84, 0, -0.45], [0.15, 0.17, 0.17], 0.05, MT.IV + 0.3); B.box([0.84, 0, -0.27], [0.15, 0.17, 0.03], 0.01, MT.GD); B.pop(); }
    });
    M.pS = mk(B => { B.tube([0, 0, 0], [1, 0, 0], 0.11, 0.1, MT.BZ, { seg: 10, cap0: 'flat', cap1: 'flat' }); B.torX([0.95, 0, 0], 0.12, 0.03, MT.GD, { seg: 12, rseg: 4 }); B.torX([0.05, 0, 0], 0.12, 0.03, MT.GD, { seg: 12, rseg: 4 }); });
    M.pR = mk(B => { B.tube([0, 0, 0], [1, 0, 0], 0.05, 0.05, MT.GD, { seg: 8, cap0: 'flat', cap1: 'round' }); B.sph([0, 0, 0], 0.09, MT.BZ, 8); }); yield;
    /* ---- a neck vertebra (built along x; drawn big: a short massive neck) ---- */
    M.vert = mk(B => { latheX(B, [[-0.3, 0.6, MT.OB], [-0.24, 0.7, MT.OB], [-0.21, 0.72, MT.GD, 1], [-0.12, 0.72, MT.GD, 1], [-0.1, 0.66, MT.OB], [0.2, 0.6, MT.OB], [0.3, 0.48, MT.OB]], MT.OB, Q(18));
      plate(B, { c: [[-0.4, 0, 0.6], [-0.12, 0, 0.88], [0.15, 0, 0.88], [0.4, 0, 0.6]], nrm: [0, 0, 1], w: u => 0.6 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.15), cup: -0.45, th: () => 0.12, nu: Q(8), nv: 3, mat: MT.IV, trim0: 0.78, endTrim: true });
      B.crystal([0, 0, 0.88], [-0.2, 0, 1.25], 0.12, MT.IV + 0.3, { n: 4, thin: 0.5 }); }); yield;
    /* ---- the head (about its pivot; x forward): a heavy angular wedge of obsidian (a near-rectangular section, bevelled) under an ivory
       faceplate with a ridge, engraved gold lines and an amber channel, heavy brow ridges over deep-set amber eyes, three layers of angular
       cheek armour a side, a segmented muzzle, vents, the Taurus sign on the forehead, toothed gold horn mounts ---- */
    const SKT = [[-0.6, 0.78, 0.7, 0.12], [0.35, 0.98, 0.84, 0.1], [1.25, 0.8, 0.68, -0.22], [2.05, 0.58, 0.52, -0.5], [2.55, 0.46, 0.42, -0.66]];
    const sk = x => { if (x <= SKT[0][0]) return SKT[0].slice(1); for (let i = 1; i < SKT.length; i++) if (x <= SKT[i][0]) { const a = SKT[i - 1], b = SKT[i], u = (x - a[0]) / (b[0] - a[0]); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; } return SKT[SKT.length - 1].slice(1); };
    const B0 = [0.2, 0, 0.98], M0 = [2.5, 0, -0.2], fpP = u => add(lerp3(B0, M0, u), [0, 0, 0.1 * Math.sin(Math.PI * u)]), fpW = u => lerp(1.04, 0.5, Math.pow(u, 0.85));
    const fp = (u, v) => { const P = fpP(u); return [P[0] - 0.06 * v * v, v * fpW(u), P[2] + 0.18 * Math.pow(1 - Math.abs(v), 1.2) * (1 - 0.5 * u) - 0.3 * v * v]; };
    M.head = mk(B => {
      B.surf((u, v) => { const x = lerp(-0.6, 2.55, u), [w, h, zc] = sk(x), ph = v * TAU; return [x, w * se(Math.cos(ph), 5), zc + h * se(Math.sin(ph), 5)]; }, Q(12), Q(28), () => MT.OB, { flip: true, e: () => 0 });
      B.ell([-0.6, 0, 0.12], [0.3, 0.78, 0.7], MT.OB, { seg: 18, rings: 8 }); B.ell([2.55, 0, -0.66], [0.2, 0.46, 0.42], MT.OB, { seg: 16, rings: 8 });
      B.surf((u, s) => fp(u, s * 2 - 1), Q(12), 6, () => MT.IV + 0.1, { e: (u, s) => Math.max(sstep(0.8, 1, Math.abs(s * 2 - 1)), sstep(0.94, 1, u) * 0.8) });
      for (const v of [0.6, -0.6]) { const pts = []; for (let i = 0; i <= 8; i++) pts.push(add(fp(0.1 + i * 0.1, v), [0, 0, 0.03])); strip(B, pts, () => norm([0.4, v * 0.4, 1]), 0.06, MT.GD, 0.01); }
      { const pts = []; for (let i = 0; i <= 8; i++) pts.push(add(fp(0.32 + i * 0.08, 0), [0, 0, 0.02])); strip(B, pts, () => norm([0.5, 0, 1]), 0.07, MT.AM, 0.01); }
      glyph(B, add(fp(0.15, 0), [0.03, 0, 0.06]), norm([-0.8, 0, 0.55]), norm([0.55, 0, 0.83]), 0.3, MT.AM);
      for (const s of [1, -1]) {
        B.ell([0.95, s * 0.86, 0.26], [0.26, 0.13, 0.14], MT.OB + 0.2, { seg: 12, rings: 6 });
        strip(B, [[0.76, s * 0.88, 0.33], [0.95, s * 0.96, 0.29], [1.16, s * 0.95, 0.2]], () => norm([0.35, s * 0.95, 0.05]), 0.13, MT.EYE, 0.012);
        plate(B, { c: [[0.3, s * 0.45, 1.0], [0.68, s * 0.84, 0.8], [1.05, s * 1.04, 0.56], [1.38, s * 1.06, 0.36]], nrm: [0.4, s * 0.6, 1], w: () => 0.21, cup: 0, th: () => 0.22, nu: Q(8), nv: 2, mat: MT.IV, trim0: 0.75 });
        plate(B, { c: [[0.55, s * 0.98, 0.05], [1.0, s * 1.07, -0.2], [1.5, s * 0.95, -0.45], [1.95, s * 0.72, -0.62]], nrm: [0, s, -0.1], w: u => 0.3 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.2), cup: 0, th: () => 0.12, nu: Q(8), nv: 2, mat: MT.IV + 0.3, trim0: 0.78, endTrim: true });
        plate(B, { c: [[0.35, s * 1.03, -0.32], [0.8, s * 1.12, -0.55], [1.25, s * 1.02, -0.75], [1.6, s * 0.82, -0.86]], nrm: [0, s, -0.35], w: u => 0.22 * Math.pow(Math.sin(Math.PI * (0.04 + 0.92 * u)), 0.2), cup: 0, th: () => 0.11, nu: Q(8), nv: 2, mat: MT.IV, trim0: 0.78, endTrim: true });
        plate(B, { c: [[0.2, s * 0.98, 0.5], [-0.15, s * 1.13, 0.55], [-0.45, s * 1.18, 0.45], [-0.72, s * 1.1, 0.28]], nrm: [0, s, 0.4], w: u => 0.22 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.2), cup: 0, th: () => 0.11, nu: Q(8), nv: 2, mat: MT.IV + 0.3, trim0: 0.78, endTrim: true });
        B.ell([HORNM[0], s * HORNM[1], HORNM[2]], [0.3, 0.24, 0.3], MT.BZ, { seg: 14, rings: 8 }); B.torY([HORNM[0], s * (HORNM[1] + 0.06), HORNM[2]], 0.4, 0.09, MT.GD, { seg: 24, rseg: 5, teeth: 12, tooth: 0.05 });
      }
      B.box([2.42, 0, -0.55], [0.32, 0.5, 0.38], 0.12, MT.IV + 0.1); B.box([2.72, 0, -0.66], [0.18, 0.42, 0.28], 0.08, MT.OB); B.box([2.18, 0, -0.55], [0.05, 0.53, 0.41], 0.02, MT.GD);
      for (const s of [1, -1]) B.box([2.88, s * 0.18, -0.64], [0.05, 0.1, 0.08], 0.02, MT.OB + 0.2);
      B.torX([2.95, 0, -0.95], 0.24, 0.045, MT.GD, { seg: 18, rseg: 5 });
      for (let i = 0; i < 5; i++) B.box([0.05 + i * 0.16, 0, -0.72], [0.05, 0.5 - i * 0.03, 0.07], 0.015, i % 2 ? MT.GD : MT.OB);
    });
    M.jaw = mk(B => { B.box([0.85, 0, -0.16], [0.88, 0.5, 0.15], 0.06, MT.OB);
      plate(B, { c: [[0.0, 0, -0.3], [0.6, 0, -0.42], [1.2, 0, -0.4], [1.8, 0, -0.26]], nrm: [0, 0, -1], w: u => 0.56 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.2), cup: -0.2, th: () => 0.12, nu: Q(10), nv: 3, mat: MT.IV, trim0: 0.78 });
      B.box([1.78, 0, -0.12], [0.16, 0.36, 0.15], 0.06, MT.GD); for (let i = 0; i < 5; i++) B.box([0.45 + i * 0.27, 0, 0.0], [0.07, 0.42, 0.04], 0.02, MT.GD); });
    M.maw = mk(B => { B.sph([0, 0, 0], 0.32, MT.AM, 14); B.torX([0, 0, 0], 0.4, 0.04, MT.GD, { seg: 20, rseg: 4, teeth: 8, tooth: 0.04 }); B.torZ([0, 0, 0], 0.36, 0.03, MT.RING, { seg: 18, rseg: 4 }); }); yield;
    /* ---- the horns: eight overlapping engraved gold segments round an amber core, a dark runic band outside, gilded rims, a gold point ---- */
    M.hseg = [];
    for (let i = 0; i < NHS; i++) { M.hseg.push(mk(B => {
      const u0 = Math.max(0, i / NHS - 0.012), u1 = Math.min(1, (i + 1) / NHS + 0.02), sc = w => 1.1 - 0.12 * w, nv = Q(18);
      B.surf((w, v) => hornQ(lerp(u0, u1, w), v * TAU, sc(w)), Q(7), nv, () => MT.GD + 0.2, { e: (w) => Math.max(sstep(0.82, 1, w), sstep(0.18, 0, w)) * 0.95 });
      for (const [ue, k0] of [[u0, sc(0)], [u1, sc(1)]]) B.surf((s2, v) => hornQ(ue, v * TAU, lerp(k0, k0 * 0.6, s2)), 1, nv, () => MT.GD, { flip: ue === u1, e: () => 1 });
      B.surf((w, v) => hornQ(lerp(u0, u1, w), v * TAU, sc(w) * 0.6), Q(5), nv, () => MT.OB + 0.2, { flip: true, e: () => 0 });
      const pts = []; for (let j = 0; j <= 6; j++) { const u = lerp(u0 + 0.01, u1 - 0.015, j / 6); pts.push(hornQ(u, 0, sc(j / 6) * 1.0)); } strip(B, pts, j => hornF(lerp(u0, u1, j / 6)).N, hornR((u0 + u1) / 2) * 0.95, MT.RING + 0.3, 0.012);
      if (i === NHS - 1) { const f = hornF(1); B.crystal(add(f.P, mul(f.T, -0.08)), add(f.P, mul(f.T, 0.62)), hornR(1) * 1.15, MT.GD, { n: 6, belly: 0.15, base: 1 }); }
      if (i % 2 === 0) { const f = hornF(u1); B.push(...(() => { const z = f.T, x = norm(cross(f.Bn, z)); return [x, cross(z, x), z]; })(), f.P); B.tor([0, 0, 0], hornR(u1) * 1.18, 0.035, MT.BZ, { seg: 18, rseg: 4, teeth: 9, tooth: 0.03 }); B.pop(); }
    })); if (i % 2) yield; }
    M.hcore = mk(B => B.surf((u, v) => hornQ(u, v * TAU, 0.46), Q(40), Q(8), () => MT.AM, { a: u => u, e: () => 0 }));
    M.hring = mk(B => { B.tor([0, 0, 0], 1, 0.045, MT.RING, { seg: 72, rseg: 5 }); for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; B.sph([Math.cos(a), Math.sin(a), 0], 0.075, MT.GD, 6); } B.tor([0, 0, 0], 0.92, 0.012, MT.GD, { seg: 64, rseg: 3 }); });
    M.lring = mk(B => B.tor([0, 0, 0], 1, 0.022, MT.LRING, { seg: 72, rseg: 4 }));
    M.frag = mk(B => { B.crystal([0, 0, -0.5], [0, 0, 0.55], 0.4, MT.STONE, { n: 5, belly: 0.45, base: 0.5, seed: 3 }); });
    M.frag2 = mk(B => { B.crystal([0, 0, -0.4], [0.1, 0, 0.5], 0.35, MT.BZ, { n: 4, belly: 0.5, base: 0.7, seed: 7 }); }); yield;
    /* ---- the Core of Dominion: the planet, its amber field, the armillary (toothed, runic band, double rail), the stabiliser cage ---- */
    M.planet = mk(B => B.ell([0, 0, 0], [CORER, CORER, CORER], MT.PLAN, { seg: 32, rings: 20 }));
    M.cshell = mk(B => B.ell([0, 0, 0], [CORER * 1.38, CORER * 1.38, CORER * 1.38], MT.SHELL, { seg: 30, rings: 18 }));
    M.cring = [mk(B => B.tor([0, 0, 0], 1, 0.045, MT.RING, { seg: 64, rseg: 5, teeth: 32, tooth: 0.035 })),
      mk(B => { B.tube([0, 0, -0.07], [0, 0, 0.07], 1, 1, MT.RING + 0.3, { seg: 64, cap0: false, cap1: false }); B.tor([0, 0, 0.075], 1, 0.02, MT.GD, { seg: 64, rseg: 3 }); B.tor([0, 0, -0.075], 1, 0.02, MT.GD, { seg: 64, rseg: 3 }); }),
      mk(B => { B.tor([0, 0, 0.06], 1, 0.025, MT.GD, { seg: 64, rseg: 4 }); B.tor([0, 0, -0.06], 1, 0.025, MT.BZ, { seg: 64, rseg: 4 }); for (let j = 0; j < 12; j++) { const a = j / 12 * TAU; B.tube([Math.cos(a), Math.sin(a), -0.08], [Math.cos(a), Math.sin(a), 0.08], 0.018, 0.018, MT.GD, { seg: 4, cap0: false, cap1: false }); } })];
    M.cstab = mk(B => { B.tor([0, 0, 0], 1.22, 0.04, MT.BZ, { seg: 48, rseg: 4 }); for (let j = 0; j < 4; j++) { const a = j / 4 * TAU + 0.4, c = Math.cos(a), s = Math.sin(a); B.tube([c * 0.92, s * 0.92, 0], [c * 1.28, s * 1.28, 0], 0.045, 0.045, MT.BZ, { seg: 6 }); B.push([c, s, 0], [-s, c, 0], [0, 0, 1], [c * 0.9, s * 0.9, 0]); B.box([0, 0, 0], [0.06, 0.12, 0.1], 0.02, MT.GD); B.pop(); } }); yield;
    /* ---- the citadel grows out of the body: a front keep high over the shoulders (the tallest, tiered by form) and a rear terrace stepping
       down the slope of the back; obsidian floors with gilded courses, walls with lit arcades and merlons, the keep's back wall rising from
       the terrace, buttresses running down the flanks into the armour, corner turrets ---- */
    M.cit = mk(B => {
      B.box([1.75, 0, CITF - 0.2], [1.3, 1.62, 0.3], 0.08, MT.OB); B.box([1.75, 0, CITF + 0.08], [1.2, 1.52, 0.03], 0.01, MT.GD);
      B.box([-1.4, 0, CITR - 0.2], [2.0, 1.5, 0.3], 0.08, MT.OB); B.box([-1.4, 0, CITR + 0.08], [1.92, 1.42, 0.03], 0.01, MT.GD);
      const wall = (x0, x1, y, z0, h) => { const cx = (x0 + x1) / 2, hx = (x1 - x0) / 2; B.box([cx, y, z0 + h], [hx, 0.13, h], 0.04, MT.WALL); B.box([cx, y * 1.02, z0 + 0.22], [hx + 0.02, 0.16, 0.035], 0.01, MT.GD); for (let x = x0 + 0.15; x <= x1 - 0.1; x += 0.35) B.box([x, y, z0 + 2 * h + 0.1], [0.1, 0.14, 0.1], 0.03, MT.IV); };
      for (const s of [1, -1]) { wall(0.55, 2.95, s * 1.5, CITF, 0.42); wall(-3.35, 0.55, s * 1.4, CITR, 0.38); }
      const ewall = (x, hy, z0, h) => { B.box([x, 0, z0 + h], [0.13, hy, h], 0.04, MT.WALL); for (let y = -hy + 0.15; y <= hy - 0.1; y += 0.38) B.box([x, y, z0 + 2 * h + 0.1], [0.14, 0.1, 0.1], 0.03, MT.IV); };
      ewall(2.95, 1.4, CITF, 0.42); ewall(-3.35, 1.3, CITR, 0.38); ewall(0.55, 1.4, CITR, (CITF - CITR) / 2 + 0.42);
      for (const s of [1, -1]) for (const [x, z] of [[-2.8, CITR], [-1.6, CITR], [-0.4, CITR], [1.0, CITF], [2.3, CITF]]) { B.push([0, s, 0], [0, 0, 1], [s, 0, 0], [x, s * 1.52, z + 0.7]); B.prism([[0, 0], [0, -1.8], [0.85, -1.8]], -0.11, 0.11, MT.IV + 0.3, { b: 0.025 }); B.pop(); B.box([x, s * 2.0, z - 1.0], [0.14, 0.14, 0.06], 0.02, MT.GD); }
      const turret = (x, y, z0, hh) => { latheZ(B, [[0, 0.32, MT.OB], [0.05, 0.35, MT.IV], [hh, 0.33, MT.WALL], [hh + 0.03, 0.4, MT.GD, 1], [hh + 0.11, 0.4, MT.GD, 1], [hh + 0.13, 0.38, MT.ROOF, 1], [hh + 0.8, 0.02, MT.ROOF]], MT.WALL, Q(12), [x, y, z0 - 0.1]); B.spike([x, y, z0 + hh + 0.65], [x, y, z0 + hh + 1.15], 0.045, MT.GD); };
      for (const s of [1, -1]) { turret(2.95, s * 1.5, CITF, 1.4); turret(0.55, s * 1.5, CITF, 1.25); turret(-3.35, s * 1.4, CITR, 1.05); }
    }); yield;
    /* the keep's temple over the shoulders (all forms): podium, gilded steps, lit walls, colonnades, the upturned roof; its upper tier (L4) and
       crowning tier with the great spire (L7); the long hall of the rear terrace */
    M.hall = mk(B => { const cx = 1.75, z = CITF;
      B.box([cx, 0, z + 0.3], [1.05, 1.2, 0.14], 0.05, MT.IV); B.box([cx, 0, z + 0.18], [1.18, 1.32, 0.05], 0.02, MT.GD);
      B.box([cx, 0, z + 0.92], [0.82, 0.95, 0.48], 0.04, MT.WALL);
      for (const x of [cx - 0.9, cx - 0.3, cx + 0.3, cx + 0.9]) for (const s of [1, -1]) { B.tube([x, s * 1.08, z + 0.44], [x, s * 1.08, z + 1.38], 0.075, 0.07, MT.IV + 0.1, { seg: Q(8), cap0: false, cap1: false }); B.box([x, s * 1.08, z + 1.4], [0.11, 0.11, 0.04], 0.015, MT.GD); }
      for (const y of [-0.5, 0, 0.5]) { B.tube([cx + 0.95, y, z + 0.44], [cx + 0.95, y, z + 1.38], 0.075, 0.07, MT.IV + 0.1, { seg: Q(8), cap0: false, cap1: false }); B.box([cx + 0.95, y, z + 1.4], [0.11, 0.11, 0.04], 0.015, MT.GD); }
      B.box([cx, 0, z + 1.46], [1.02, 1.17, 0.06], 0.02, MT.GD);
      hipRoof(B, cx, 0, z + 1.52, 1.34, 1.48, z + 2.35, 0.28, 0.32, MT.ROOF, q); });
    M.hall2 = mk(B => { const cx = 1.75, z = CITF; B.box([cx, 0, z + 2.36], [0.66, 0.76, 0.06], 0.02, MT.GD); B.box([cx, 0, z + 2.72], [0.56, 0.64, 0.32], 0.04, MT.WALL);
      for (const s of [1, -1]) for (const x of [cx - 0.5, cx, cx + 0.5]) B.tube([x, s * 0.72, z + 2.42], [x, s * 0.72, z + 3.04], 0.055, 0.055, MT.IV + 0.1, { seg: 6, cap0: false, cap1: false });
      hipRoof(B, cx, 0, z + 3.06, 0.98, 1.08, z + 3.68, 0.14, 0.26, MT.ROOF, q); });
    M.crown = mk(B => { const cx = 1.75, z = CITF; B.box([cx, 0, z + 3.7], [0.42, 0.48, 0.05], 0.02, MT.GD); B.box([cx, 0, z + 3.96], [0.36, 0.42, 0.24], 0.04, MT.WALL);
      hipRoof(B, cx, 0, z + 4.2, 0.64, 0.7, z + 4.62, 0.0, 0.2, MT.ROOF, q * 0.8);
      latheZ(B, [[0, 0.2, MT.GD, 1], [0.08, 0.18, MT.OB], [0.5, 0.14, MT.OB], [0.53, 0.18, MT.GD, 1], [0.6, 0.18, MT.GD, 1], [0.62, 0.13, MT.IV], [1.25, 0.07, MT.IV], [1.28, 0.1, MT.GD, 1], [1.35, 0.04, MT.GD]], MT.OB, Q(14), [cx, 0, z + 4.55]);
      B.crystal([cx, 0, z + 5.85], [cx, 0, z + 6.55], 0.09, MT.GD, { n: 6, belly: 0.2 }); for (let j = 0; j < 4; j++) { const a = j / 4 * TAU + 0.785; B.spike([cx + Math.cos(a) * 0.18, Math.sin(a) * 0.18, z + 5.15], [cx + Math.cos(a) * 0.23, Math.sin(a) * 0.23, z + 5.6], 0.04, MT.GD); } });
    M.rhall = mk(B => { const cx = -1.75, z = CITR;
      B.box([cx, 0, z + 0.28], [1.15, 0.95, 0.12], 0.05, MT.IV); B.box([cx, 0, z + 0.78], [0.95, 0.72, 0.38], 0.04, MT.WALL);
      for (const x of [cx - 0.8, cx - 0.27, cx + 0.27, cx + 0.8]) for (const s of [1, -1]) { B.tube([x, s * 0.84, z + 0.4], [x, s * 0.84, z + 1.15], 0.06, 0.055, MT.IV + 0.1, { seg: Q(8), cap0: false, cap1: false }); B.box([x, s * 0.84, z + 1.17], [0.09, 0.09, 0.035], 0.012, MT.GD); }
      B.box([cx, 0, z + 1.22], [1.1, 0.92, 0.05], 0.02, MT.GD); hipRoof(B, cx, 0, z + 1.27, 1.32, 1.1, z + 1.92, 0.5, 0.22, MT.ROOF, q); });
    M.tower = mk(B => { B.box([0, 0, 0.75], [0.34, 0.34, 0.75], 0.04, MT.WALL); B.box([0, 0, 1.52], [0.38, 0.38, 0.04], 0.012, MT.GD); B.box([0, 0, 0.05], [0.4, 0.4, 0.08], 0.03, MT.IV); hipRoof(B, 0, 0, 1.56, 0.52, 0.52, 2.15, 0.0, 0.16, MT.ROOF, q * 0.7); B.spike([0, 0, 2.12], [0, 0, 2.6], 0.045, MT.GD); });
    M.spire = mk(B => { latheZ(B, [[0, 0.15, MT.OB], [0.1, 0.17, MT.GD, 1], [0.16, 0.13, MT.IV], [0.9, 0.09, MT.IV], [0.93, 0.12, MT.GD, 1], [0.98, 0.12, MT.GD, 1], [1.0, 0.09, MT.OB], [1.7, 0.0, MT.OB]], MT.IV, Q(10)); B.crystal([0, 0, 1.6], [0, 0, 1.95], 0.035, MT.GD, { n: 4 });
      for (let j = 0; j < 4; j++) { const a = j / 4 * TAU; B.spike([Math.cos(a) * 0.13, Math.sin(a) * 0.13, 0.9], [Math.cos(a) * 0.16, Math.sin(a) * 0.16, 1.22], 0.03, MT.GD); } });
    /* a fortress plate (+y side): hinged along its top at the origin, hanging down its outer face; a gilded hinge and the sign lit amber */
    M.cplate = mk(B => { plate(B, { c: [[-1.0, 0, 0], [-0.33, 0.1, 0.04], [0.33, 0.1, 0.04], [1.0, 0, 0]], nrm: [0, 1, 0], w: u => 0.58 * Math.pow(Math.sin(Math.PI * (0.03 + 0.94 * u)), 0.12), shift: -1, cup: 0.06, th: () => 0.14, nu: Q(10), nv: 3, mat: MT.IV, trim0: 0.8, endTrim: true });
      glyph(B, [0, 0.19, -0.58], [0, 0, 1], [0, 1, 0], 0.3, MT.AM); B.tube([-0.95, 0, 0.02], [0.95, 0, 0.02], 0.08, 0.08, MT.GD, { seg: 8 }); });
    M.halo = mk(B => { B.tor([0, 0, 0], 3.0, 0.075, MT.RING, { seg: 120, rseg: 5 }); B.tor([0, 0, 0], 2.75, 0.03, MT.LRING, { seg: 110, rseg: 4 }); B.tor([0, 0, 0], 3.2, 0.025, MT.GD, { seg: 120, rseg: 3 });
      for (let j = 0; j < 16; j++) { const a = j / 16 * TAU, L = j % 4 === 0 ? 0.75 : 0.32; B.crystal([Math.cos(a) * 3.05, Math.sin(a) * 3.05, 0], [Math.cos(a) * (3.05 + L), Math.sin(a) * (3.05 + L), 0], 0.06 + (j % 4 === 0 ? 0.04 : 0), MT.GD, { n: 4, thin: 0.5 }); } }); yield;
    /* ---- the tail: a segment (along -x), the floating anchor ---- */
    M.tseg = mk(B => { latheX(B, [[0.05, 0.4, MT.OB], [0, 0.46, MT.GD, 1], [-0.08, 0.46, MT.GD, 1], [-0.1, 0.42, MT.OB], [-0.55, 0.36, MT.OB], [-0.62, 0.28, MT.OB]], MT.OB, Q(14));
      plate(B, { c: [[0.05, 0, 0.42], [-0.15, 0, 0.55], [-0.4, 0, 0.52], [-0.6, 0, 0.4]], nrm: [0, 0, 1], w: u => 0.38 * Math.pow(Math.sin(Math.PI * (0.05 + 0.9 * u)), 0.4), cup: -0.4, th: () => 0.1, nu: Q(6), nv: 4, mat: MT.IV }); });
    M.mace = mk(B => { B.crystal([0, 0, 0], [0, 0, 0.6], 0.36, MT.OB, { n: 6, belly: 0.0, base: 1, jit: 0 }); B.crystal([0, 0, 0], [0, 0, -0.95], 0.36, MT.OB, { n: 6, belly: 0.0, base: 1, jit: 0 });
      B.tor([0, 0, 0], 0.48, 0.055, MT.GD, { seg: 28, rseg: 5, teeth: 12, tooth: 0.04 }); B.tor([0, 0, -0.3], 0.3, 0.03, MT.RING, { seg: 20, rseg: 4 });
      for (let j = 0; j < 3; j++) { const a = j / 3 * TAU; B.crystal([Math.cos(a) * 0.2, Math.sin(a) * 0.2, -0.55], [Math.cos(a) * 0.75, Math.sin(a) * 0.75, -0.95], 0.1, MT.GD, { n: 4, bend: 0.25, up: [0, 0, 1] }); } });
    /* ---- a monolith, a banner ---- */
    M.mono = mk(B => { B.box([0, 0, 0], [0.11, 0.45, 1.3], 0.05, MT.OB); B.box([0, 0, 1.33], [0.15, 0.49, 0.06], 0.02, MT.GD); B.box([0, 0, -1.33], [0.15, 0.49, 0.06], 0.02, MT.GD); B.crystal([0, 0, 1.38], [0, 0, 2.0], 0.3, MT.GD, { n: 4, thin: 0.35 });
      for (const sx of [1, -1]) { glyph(B, [sx * 0.12, 0, 0.45], [0, 0, 1], [sx, 0, 0], 0.26, MT.AM); const pts = []; for (let j = 0; j <= 6; j++) pts.push([sx * 0.112, 0, -1.15 + j * 0.2]); strip(B, pts, () => [sx, 0, 0], 0.16, MT.RING + 0.3, 0.004); } });
    M.ban = mk(B => { B.surf((u, v) => { const zb = -1.75 - 0.3 * (1 - Math.abs(u * 2 - 1)); return [0.02 * Math.sin(v * 5 + u), (u - 0.5) * 0.55, lerp(0, zb, v)]; }, 4, Q(10), () => MT.CLOTH, { e: (u, v) => Math.max(sstep(0.82, 1, Math.abs(u * 2 - 1)), sstep(0.92, 1, v)) });
      B.tube([0, -0.33, 0.03], [0, 0.33, 0.03], 0.04, 0.04, MT.GD, { seg: 6 }); for (const s of [1, -1]) B.sph([0, s * 0.35, 0.03], 0.06, MT.GD, 6); }); yield;
    /* ---- the effect meshes: the World Pillar (plinth, four drums, capital, its ring), a rock, a gravity ring ---- */
    M.pbase = mk(B => { latheZ(B, [[0, 1.05, MT.STONE], [0.26, 1.05, MT.STONE, 0.7], [0.28, 0.88, MT.GD, 1], [0.34, 0.88, MT.GD, 1], [0.36, 0.8, MT.STONE], [0.56, 0.76, MT.STONE, 0.7], [0.58, 0.64, MT.STONE], [0.72, 0.6, MT.STONE]], MT.STONE, Q(20)); B.tor([0, 0, 0.13], 1.06, 0.03, MT.RING, { seg: 40, rseg: 4 }); });
    M.drum = mk(B => { B.surf((u, v) => { const ph = v * TAU, fl = 1 - 0.07 * (0.5 + 0.5 * Math.cos(ph * 16)); return [Math.cos(ph) * 0.55 * fl, Math.sin(ph) * 0.55 * fl, 0.04 + u * 0.92]; }, 3, Q(48), () => MT.STONE + 0.3, { e: () => 0.1 });
      for (const z of [0.0, 0.96]) B.tor([0, 0, z + 0.02], 0.56, 0.05, MT.GD, { seg: 32, rseg: 4 });
      for (let j = 0; j < 4; j++) { const a = j / 4 * TAU + 0.2, c = Math.cos(a), s = Math.sin(a), pts = []; for (let i = 0; i <= 5; i++) pts.push([c * 0.52, s * 0.52, 0.1 + i * 0.16]); strip(B, pts, () => [c, s, 0], 0.07, MT.AM, 0.01); } });
    M.pcap = mk(B => { latheZ(B, [[0, 0.56, MT.STONE], [0.1, 0.7, MT.GD, 1], [0.18, 0.74, MT.GD, 1], [0.2, 0.86, MT.STONE], [0.42, 0.96, MT.STONE, 0.7], [0.45, 0.88, MT.GD, 1], [0.52, 0.0, MT.GD]], MT.STONE, Q(18)); B.crystal([0, 0, 0.5], [0, 0, 1.15], 0.18, MT.GD, { n: 6, belly: 0.25 }); });
    M.rock = mk(B => { const h3 = (x, y, z) => 0.22 * Math.sin(x * 3.1 + y * 1.7) * Math.cos(z * 2.3 + x) + 0.12 * Math.sin(y * 5.3 + z * 3.7);
      B.surf((u, v) => { const th = u * Math.PI, ph = v * TAU, d = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], r = 1 + h3(d[0], d[1], d[2]); return [d[0] * r * 1.1, d[1] * r * 0.9, d[2] * r * 0.85]; }, 7, 9, () => MT.STONE, { flip: true, e: (u, v) => 0.6 * Math.abs(Math.sin(v * 9 + u * 4)) }); });
    M.gring = mk(B => { B.tor([0, 0, 0], 1, 0.035, MT.RING, { seg: 80, rseg: 5, teeth: 40, tooth: 0.025 }); B.tor([0, 0, 0], 0.88, 0.016, MT.LRING, { seg: 72, rseg: 4 }); B.tor([0, 0, 0.05], 0.94, 0.012, MT.GD, { seg: 72, rseg: 3 });
      for (let j = 0; j < 8; j++) { const a = j / 8 * TAU; B.crystal([Math.cos(a) * 1.04, Math.sin(a) * 1.04, 0], [Math.cos(a) * 0.86, Math.sin(a) * 0.86, 0], 0.05, MT.GD, { n: 4 }); } });
    const bsph = m => { let cx = 0, cy = 0, cz = 0; const n = m.nv; for (let i = 0; i < n; i++) { cx += m.pos[i * 3]; cy += m.pos[i * 3 + 1]; cz += m.pos[i * 3 + 2]; } cx /= n; cy /= n; cz /= n; let r = 0; for (let i = 0; i < n; i++) r = Math.max(r, Math.hypot(m.pos[i * 3] - cx, m.pos[i * 3 + 1] - cy, m.pos[i * 3 + 2] - cz)); m.bs = [cx, cy, cz, r]; };
    eachOf(M, bsph);
    D.M = M; let nv = 0; eachOf(M, m => { nv += m.nv; }); D.nv = nv; D.ready = true; D.msBuilt = nowMs();
  }
  function eachOf(M, f) { for (const k in M) { const v = M[k]; if (Array.isArray(v)) v.forEach(m => { if (m) f(m); }); else if (v) f(v); } }
  function data() { return D || (D = { ready: false, up: false, it: null, ms: 0 }); }
  function step(ms) { const d = data(); if (d.ready) return true; if (typeof GLM === 'undefined') return false; d.it = d.it || gen(); const t0 = nowMs(), until = t0 + ms; while (!d.ready && nowMs() < until) d.it.next(); d.ms += nowMs() - t0; return d.ready; }

  /* ================= the GPU's state ================= */
  let NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
  const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Belial GL: ' + String(e && e.message || e)); } catch (e2) {} };
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  function usable() {
    if (NOGL || (RETRY && nowMs() < RETRY) || flag('__BL_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
    if (GLM.soft && !(flag('__BL_GL') === 1 || flag('__NG_GL') === 1)) return false;
    return true;
  }
  let IDLE = 0;
  function warm() {
    if (!usable()) return false; const d = data(); if (d.up || IDLE) return true; IDLE = 1;
    const go = () => { const run = ms => { try { if (!step(ms)) return go(); if (!d.up) upload(); } catch (e) { fail(e); } IDLE = 0; };
      if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => run(dl.didTimeout ? 3 : Math.max(1, Math.min(8, dl.timeRemaining() - 1))), { timeout: 200 }); else setTimeout(() => run(3), 30); };
    go(); return true;
  }
  function upload() { const d = data(); if (d.up || !d.ready || !GLM.ok()) return; const items = [];
    eachOf(D.M, mesh => items.push({ mesh, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 }));
    GLM.render(4, 4, { px: [1, 0, 0], py: [0, 1, 0], pd: [0, 0, 1], cl: [1, 0, 1, 0], v: [0, 0, 1], lk: [0, 0, 1], ls: [0, 0, 1], lr: [1, 0, 0], up: [0, 0, 1], low: lowFx(), t: 0 }, items); d.up = true; }
  function ensure() { if (!usable()) return false; const d = data(); if (!d.ready) { try { step(1e9); } catch (e) { fail(e); return false; } } return d.ready; }
  /* free every GPU buffer (the meshes stay in memory and upload again when next drawn): a dismissal, the stage's end */
  function release() { if (!D || !D.M) return 0; let n = 0; eachOf(D.M, m => { if (m.gl) { n++; if (typeof GLM !== 'undefined' && GLM.free) GLM.free(m); else m.gl = null; } }); D.up = false; return n; }
  const gpuCount = () => { let n = 0; if (D && D.M) eachOf(D.M, m => { if (m.gl) n++; }); return n; };

  /* ================= the pose ================= */
  /* the resting pose of a form at time t (o: overrides) */
  function idlePose(k, t, o) {
    return Object.assign({ k: k || 3, t: t || 0, yaw: 0, bank: 0, pitch: 0, lift: 0, dx: 0, crouch: 0, rear: 0, head: 0, look: 0, jaw: 0, horn: 0, ringK: 1, ringOut: 0, core: 0.85, coreOpen: 0, cit: 0, citUp: 0, bast: 0, mono: 0, monoIn: 0, glow: 0, live: 1, ph: 0, mv: 0, feet: null, tail: 0, stagger: 0, dis: 0, asm: 1, halo: 1, hornAlign: 0, eye: 1, plant: 0,
      spread: 0, shift: 0, mech: 0, gaitK: 1 /* v430 BP: the stance's width (model units: feet step out to it), the weight shifted sideways (-1..1), the machinery working (0..1), the stride's length (x STRIDE) */ }, o || {});
  }
  /* v430 BP: a deliberate wandering value: it moves to a new place every period s (eased over the first share ease of it) and holds there */
  const hold = (t, per, sd, ease) => { const u = t / per + sd, n = Math.floor(u), f = u - n, a = hash(n * 1.37 + sd * 7.1) * 2 - 1, b = hash((n + 1) * 1.37 + sd * 7.1) * 2 - 1; return lerp(a, b, sstep(0, ease || 0.4, f)); };
  /* its life, laid over any pose (pure; drives the cel model too): breathing, the head lowering now and then, the horns' slow turn
     and their rings, the core's pulse, the plates shifting, the stabilisers adjusting, the tail swaying, the monoliths drifting;
     every 5.2 s a flourish (a slow nod of the head, a shrug of the bastions, a turn of the horns, a sweep of the tail) with its
     anticipation and settle. P.live (0..1) scales it */
  const FLP = 5.2;
  function life(P) {
    const t = (P && P.t) || 0, lv = P && P.live != null ? cl(P.live) : 1, s1 = Math.sin;
    const n = Math.floor((t + 1.3) / FLP), ft = t + 1.3 - n * FLP, typ = ((n % 4) + 4) % 4;
    const pre = ft < 0.5 ? s1(Math.PI * ft / 0.5) : 0, main = sstep(0.4, 1.1, ft) * (1 - sstep(1.7, 2.7, ft)), set = ft > 2.4 && ft < 4 ? Math.exp(-(ft - 2.4) * 2.6) * s1((ft - 2.4) * 6) : 0;
    return { typ, fl: main,
      breath: s1(t * 0.9) * lv, bob: (0.04 * s1(t * 0.9) + 0.015 * s1(t * 2.1)) * lv,
      head: (0.05 * s1(t * 0.37) + (typ === 0 ? 0.32 * main - 0.06 * pre + 0.05 * set : 0)) * lv, look: (0.12 * s1(t * 0.23) + (typ === 2 ? 0.25 * main : 0)) * lv,
      bast: (0.04 * s1(t * 0.6) + (typ === 1 ? 0.22 * main - 0.05 * pre + 0.06 * set : 0)) * lv, plates: 0.03 * s1(t * 0.8) * lv,
      horn: (typ === 2 ? 0.25 * main : 0.04 * (0.5 + 0.5 * s1(t * 0.5))) * lv, hornTurn: (0.03 * s1(t * 0.31) + (typ === 2 ? 0.06 * main : 0)) * lv,
      core: (0.12 * s1(t * 1.6) + 0.06 * s1(t * 3.3)) * lv, tail: (0.18 * s1(t * 0.7) + (typ === 3 ? 0.5 * main - 0.15 * pre + 0.1 * set : 0)) * lv, tailY: 0.08 * s1(t * 1.1) * lv,
      stab: t * 0.6, piston: 0.04 * s1(t * 1.3) * lv, mono: 0.25 * s1(t * 0.4) * lv, jaw: (typ === 0 ? 0.08 * main : 0) * lv,
      /* v430 BP: its slow weight shifts (side to side, held between), small deliberate adjustments of the neck, the armour's slow settle */
      shift: 0.55 * hold(t, 7.3, 0.21, 0.45) * lv, neckL: 0.06 * hold(t, 3.7, 1.13, 0.35) * lv, neckH: 0.045 * hold(t, 4.9, 2.37, 0.4) * lv, armour: 0.5 + 0.5 * s1(t * 0.9 - 0.6) };
  }
  /* the gait: each leg's foot (forward offset, lift) and its load, from the step phase ph (radians) and the walk's amount mv */
  /* v430 BP: no foot slides: in its stance a foot travels back exactly as far as the body goes forward (the moves advance the phase a
     cycle per STRIDE x max(0.3, mv) x gk walked), so its stance spans STRIDE x max(0.3, mv) x (1 - SWING); the swing is a mechanical arc:
     the heel peels up and the hoof flexes back (toe-off), the foot rises high early and swings through, reaches, then comes straight
     down flat in the last fifth (the plant). gk: the stride's length (P.gaitK, 1 the walk). Returns per leg dx, lift, load, sw, w (the
     swing's progress), pitch (the hoof's flex about its ankle) */
  const swF = w => sstep(0.04, 0.82, w);                                                         // (forward, done before the plant)
  const swL = w => (w < 0.38 ? Math.sin(Math.PI / 2 * w / 0.38) : Math.pow(Math.cos(Math.PI / 2 * (w - 0.38) / 0.62), 1.35));   // (up early, down late)
  const swP = w => 0.62 * Math.sin(Math.PI * cl(w / 0.5)) * (w < 0.5 ? 1 : 0) - 0.2 * Math.sin(Math.PI * cl((w - 0.5) / 0.45));  // (toe-off flex, then the reach)
  function gait(ph, mv, gk) {
    const out = [], mvp = Math.max(0.3, mv) * sstep(0, 0.3, mv), kk = gk || 1;
    for (const L of LEGS) { let q = ph / TAU + L.off; q -= Math.floor(q); const sw = q >= 1 - SWING, w = sw ? (q - (1 - SWING)) / SWING : 0, D = STRIDE * kk * mvp * (1 - SWING);
      const dx = sw ? -D / 2 + D * swF(w) : D / 2 - D * (q / (1 - SWING)), lift = sw ? swL(w) * (0.55 + 0.25 * L.f) * Math.min(1, mv * 1.6) * (1 + 0.25 * (kk - 1)) : 0;
      const load = !sw && q < 0.16 ? Math.sin(Math.PI * q / 0.16) * mv : 0;   // (just landed: the weight comes onto it)
      out.push({ dx, lift, load, sw, w, pitch: sw ? swP(w) * Math.min(1, mv * 1.6) : 0 }); }
    return out;
  }
  /* the legs that landed as the phase went from ph0 to ph1 (their indices, front legs flagged): footfalls for the effects */
  function footfalls(ph0, ph1) { const out = []; if (!(ph1 > ph0)) return out; for (let i = 0; i < 4; i++) { const L = LEGS[i], a = ph0 / TAU + L.off, b = ph1 / TAU + L.off; if (Math.floor(b) > Math.floor(a)) out.push({ i, f: !!L.f }); } return out; }
  /* tail and banner springs kept on the instance (they swing with inertia from the body's acceleration) */
  function springs(inst, ax, ay, dt) {
    let S = inst.blS; if (!S) S = inst.blS = new Float32Array(16);
    dt = Math.min(0.05, Math.max(0, dt || 0));
    for (let i = 0; i < 4; i++) { const o = i * 4, kx = 14 + i * 4, dmp = 2.6; S[o + 1] += (-ax * 0.03 - S[o] * kx - S[o + 1] * dmp) * dt; S[o] += S[o + 1] * dt; S[o + 3] += (-ay * 0.03 - S[o + 2] * kx - S[o + 3] * dmp) * dt; S[o + 2] += S[o + 3] * dt; S[o] = Math.max(-0.6, Math.min(0.6, S[o])); S[o + 2] = Math.max(-0.6, Math.min(0.6, S[o + 2])); }
    return S;
  }
  /* ---- v430 BP: the motion an instance keeps (inst.blM), stepped by draw() from the pose alone (its time P.t, yaw, ph, mv, gaitK,
     spread, feet, rear), so the Anima and the boss both get it without a call of their own (BELIAL_GL.motion(inst, P) steps it by
     hand; a second draw in the same frame does not step it again):
     - the feet are PLANTED: a foot on the floor keeps its place on the floor (in the ground's frame round the body's floor point),
       so the body really travels and twists over planted feet when it turns; the gait's phase lifts each leg in turn and swings it
       to its landing a half-stance ahead; at a standstill or turning in place, a foot left out of line steps back under its hip
       (one or a diagonal two at a time: the stop's settle, the turn's shuffle, a widened stance's step out); each landing is
       recorded in M.steps (i, f front, idle) for the effects
     - the body's inertia: a vertical spring kicked down by every landing (the weight coming onto a leg, with a little rebound), a
       fore-aft spring driven by the walk's acceleration (it lurches on as it stops, overshoots and settles; it lags as it starts),
       a lateral spring from the turn (centripetal sway), the turn's rate (the head leads into it, the tail swings out)
     - the citadel's restrained sway (a stiff, lightly damped spring kicked by the footfalls and the lurches) and the tail's chain
       (each segment following the one before it a little late) ---- */
  const ISD = 0.42;                                                          // an idle step's length (s)
  const homeOf = (i, P) => { const L = LEGS[i]; return [L.x, L.s * (L.fy + (P.spread || 0) * (L.f ? 1 : 0.85))]; };
  const angDf = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  function newM(P) { const yaw = P.yaw || 0, c = Math.cos(yaw), s = Math.sin(yaw), F = [];
    for (let i = 0; i < 4; i++) { const h = homeOf(i, P); F.push({ gx: c * h[0] - s * h[1], gy: s * h[0] + c * h[1], sw: 0, w0: 0, p: 0, dir: 1, s0x: h[0], s0y: h[1], tx: h[0], ty: h[1], bx: h[0], by: h[1], lift: 0, l0: 0, pitch: 0, ld: 0, cyc: Math.floor((P.ph || 0) / TAU + LEGS[i].off), H: 0 }); }
    return { t: P.t || 0, yaw, ph: P.ph || 0, mv: cl(P.mv || 0), h: 0, yr: 0, acc: 0, sx: 0, vx: 0, sy: 0, vy: 0, sz: 0, vz: 0, cp: 0, cpv: 0, cr: 0, crv: 0, F, tail: new Float32Array(6), tailP: new Float32Array(6), steps: [], n: 0 }; }
  function motion(inst, P) {
    if (!inst || !P) return null; const t = P.t || 0; let M = inst.blM; const dt = M ? t - M.t : 0;
    if (!M || dt < -1e-3 || dt > 0.6) { M = inst.blM = newM(P); return M; }
    M.h = 0; if (dt < 1e-5) return M;
    M.steps.length = 0; const h = Math.min(dt, 0.05); M.h = h; M.t = t;
    const yaw = P.yaw || 0, ph = P.ph || 0, mv = cl(P.mv || 0), gk = P.gaitK || 1, c = Math.cos(yaw), s = Math.sin(yaw), dph = ph - M.ph, walking = Math.abs(dph) / TAU / dt > 0.3 /* (a creep slower than this steps like a standstill: no leg left hovering) */, dir = dph >= 0 ? 1 : -1;
    M.yr += (angDf(yaw, M.yaw) / dt - M.yr) * Math.min(1, h * 7); M.acc += ((mv - M.mv) / dt - M.acc) * Math.min(1, h * 9); M.yaw = yaw; M.ph = ph; M.mv = mv;
    const mvp = Math.max(0.3, mv), tr = dph / TAU * STRIDE * gk * mvp, mx = c * tr, my = s * tr, D = STRIDE * gk * mvp * (1 - SWING), toB = (x, y) => [c * x + s * y, -s * x + c * y];
    const rear = cl(P.rear || 0), fe = P.feet;
    let nIdle = 0, idleP = 1; for (const f of M.F) if (f.sw === 2) { nIdle++; idleP = Math.min(idleP, f.p); }
    for (let i = 0; i < 4; i++) {
      const L = LEGS[i], f = M.F[i], hm = homeOf(i, P); let q = ph / TAU + L.off; const cyc = Math.floor(q); q -= cyc; const inW = q >= 1 - SWING, w = inW ? (q - (1 - SWING)) / SWING : 0, Hs = (0.55 + 0.25 * L.f) * Math.min(1, mv * 1.6 + 0.25) * (1 + 0.25 * (gk - 1));
      f.ld = Math.max(0, f.ld - h / 0.28);
      const land = (x, y, idle) => { const gx = c * x - s * y, gy = s * x + c * y; f.gx = gx; f.gy = gy; f.sw = 0; f.lift = 0; f.pitch = 0; f.ld = 1; f.cyc = cyc; f.bx = x; f.by = y;
        const kick = (L.f ? 0.62 : 0.42) * (idle ? 0.55 : 0.55 + 0.45 * mv) * (1 + 0.35 * (gk - 1)); M.vz -= kick; M.cpv += (L.f ? -1 : 0.7) * kick * 0.06; M.crv += L.s * kick * 0.05; M.steps.push({ i, f: !!L.f, idle: !!idle }); M.n++; };
      if (f.sw === 0) { f.gx -= mx; f.gy -= my; const b = toB(f.gx, f.gy); f.bx = b[0]; f.by = b[1];
        if (walking && inW) { f.sw = 1; f.dir = dir; f.w0 = dir > 0 ? w : 1 - w; f.s0x = f.bx; f.s0y = f.by; }
        else if (walking && dir > 0 && cyc !== f.cyc && !inW) land(hm[0] + D / 2, hm[1], false);   // (its whole swing inside one frame: a very fast stride)
        else if (!walking) f.cyc = cyc; }
      if (f.sw === 1) {
        if (!walking) { f.sw = 2; f.p = 0; f.dur = 0.3; f.l0 = f.lift; f.s0x = f.bx; f.s0y = f.by; nIdle++; idleP = 0; }
        else if (!inW) land(hm[0] + f.dir * D / 2, hm[1], false);
        else { const pr = cl(((f.dir > 0 ? w : 1 - w) - f.w0) / Math.max(0.05, 1 - f.w0)); f.tx = hm[0] + f.dir * D / 2; f.ty = hm[1]; f.bx = lerp(f.s0x, f.tx, swF(pr)); f.by = lerp(f.s0y, f.ty, swF(pr)); f.lift = swL(pr) * Hs; f.pitch = swP(pr) * f.dir; f.H = Hs; }
      }
      if (f.sw === 2) { f.p = Math.min(1, f.p + h / (f.dur || ISD)); const pr = f.p, Hi = 0.3 + 0.14 * L.f; f.bx = lerp(f.s0x, hm[0], swF(pr)); f.by = lerp(f.s0y, hm[1], swF(pr)); f.lift = Math.max(swL(pr) * Hi, f.l0 * (1 - sstep(0, 0.6, pr))); f.pitch = swP(pr) * 0.6;
        if (pr >= 1) land(hm[0], hm[1], true); }
    }
    // a foot left out of line steps back under its hip (the stop's settle, the turn's shuffle, the stance widening); a teleport snaps them
    if (!walking) {
      let best = -1, be = 0; for (let i = 0; i < 4; i++) { const f = M.F[i], L = LEGS[i]; if (f.sw !== 0) continue; const hm = homeOf(i, P), e = Math.hypot(f.bx - hm[0], f.by - hm[1]);
        if (e > 4) { const gx = c * hm[0] - s * hm[1], gy = s * hm[0] + c * hm[1]; f.gx = gx; f.gy = gy; f.bx = hm[0]; f.by = hm[1]; continue; }
        if ((L.f && rear > 0.05) || (fe && fe[i] && (Math.abs(fe[i][0]) + Math.abs(fe[i][2])) > 0.01)) continue;
        const mate = M.F[3 - i];   // (a leg's diagonal partner: 0-3, 1-2)
        if (nIdle >= 2 || (nIdle === 1 && !(mate.sw === 2 || idleP > 0.55))) continue;
        if (e > 0.24 + (nIdle ? 0.1 : 0) && e > be) { be = e; best = i; } }
      if (best >= 0) { const f = M.F[best]; f.sw = 2; f.p = 0; f.dur = ISD * (be > 0.9 ? 1 : 0.85); f.l0 = 0; f.s0x = f.bx; f.s0y = f.by; }
    }
    // the body's inertia: vertical (footfalls), fore-aft (the walk's acceleration), lateral (the turn); the citadel's sway
    const spr = (x, v, k, z, F) => v + (-k * x - 2 * z * Math.sqrt(k) * v + F) * h;
    M.vz = spr(M.sz, M.vz, 110, 0.5, 0); M.sz += M.vz * h;
    M.vx = spr(M.sx, M.vx, 26, 0.36, -M.acc * 1.1); M.sx += M.vx * h;
    M.vy = spr(M.sy, M.vy, 24, 0.45, mv * M.yr * 0.7); M.sy += M.vy * h;
    M.cpv = spr(M.cp, M.cpv, 58, 0.2, -M.vx * 0.12); M.cp += M.cpv * h; M.crv = spr(M.cr, M.crv, 52, 0.22, M.vy * 0.1); M.cr += M.crv * h;
    M.sz = Math.max(-0.5, Math.min(0.3, M.sz)); M.sx = Math.max(-0.6, Math.min(0.6, M.sx)); M.sy = Math.max(-0.5, Math.min(0.5, M.sy)); M.cp = Math.max(-0.08, Math.min(0.08, M.cp)); M.cr = Math.max(-0.08, Math.min(0.08, M.cr));
    return M;
  }
  /* two-bone IK in the leg's plane (x, z): hip H, ankle A; the knee bends toward kd (+1 forward, -1 back) */
  function ik(H, A, kd) { let d = sub(A, H); const dl = Math.min(L1 + L2 - 0.002, Math.max(0.4, len(d))); d = mul(norm(d), dl); const a = Math.acos(cl((L1 * L1 + dl * dl - L2 * L2) / (2 * L1 * dl))), dn = norm(d), side = norm(cross(dn, [0, 1, 0])), K = add(H, add(mul(dn, Math.cos(a) * L1), mul(side, kd * Math.sin(a) * L1)));
    return { K, A: add(H, d) }; }
  const segR = (from, to) => { const d = norm(sub(to, from)), a = Math.atan2(-d[0], -d[2]), R0 = ry(a), dz = mv(R0, [0, 0, -1]); const tilt = Math.atan2(d[1], Math.hypot(d[0], d[2])) * (dz[2] < 0 ? 1 : 1); return mm(rx(tilt), R0); };

  /* ================= drawing ================= */
  const LW = norm([-0.45, 0.42, 0.8]), SBW = norm([-0.3, -0.2, 0.92]), RIMW = norm([0.65, -0.62, 0.42]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
  const RIMC = [1.35, 1.0, 0.55], AMBC = [1.25, 1.18, 1.08], OUTC = [0.035, 0.022, 0.012], GLCAP = 1600;
  const POOL = [], ITEMS = [], TRANS = []; let NP = 0;
  const LGS = [{}, {}, {}, {}], ZM = { sx: 0, sy: 0, sz: 0, cp: 0, cr: 0, yr: 0, h: 0, F: null, steps: null };   // v430 BP: the legs' working state (reused), no motion
  const item = () => { const g = POOL[NP] || (POOL[NP] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); NP++; return g; };
  const STATS = { ms: 0, n: 0, items: 0, W: 0, H: 0 };
  const RES = { k: 1 }; const profile = () => (lowFx() ? 'low' : RES.k < 0.95 ? 'medium' : 'high');
  /* o: X, Y (the floor point under its middle, on screen), K (px a model unit), P (a pose), k (form), alpha, ink, inst (springs), dt.
     Returns its screen points or null */
  function draw(c, o) {
    const d = data(); if (!d.ready || NOGL) return null;
    try {
      const P = o.P || idlePose(o.k || 3, o.t || 0), k = P.k || o.k || 3, t = P.t || 0, sw = WS * (o.scale || 1), K = o.K, kk = K / WS, X0 = o.X, Y0 = o.Y, M = D.M, low = lowFx() || o.low;
      const LF = life(P), lv = P.live == null ? 1 : cl(P.live);
      const Rroot = mm([1, 0, 0, 0, 1, 0, 0, 0, 1.08], rz(P.yaw || 0));
      const W3 = p => { const q = mv(Rroot, p); return [q[0] * sw, q[1] * sw, q[2] * sw]; };
      const SX = w => X0 + w[0] * kk, SY = w => Y0 + (w[1] * SE - w[2] * CE) * kk, scr = p => { const w = W3(p); return [SX(w), SY(w)]; };
      ITEMS.length = 0; TRANS.length = 0; NP = 0; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
      const box = (p, r) => { const w = W3(p), x = SX(w), y = SY(w), rr = r * K * (o.scale || 1); if (x - rr < bx0) bx0 = x - rr; if (x + rr > bx1) bx1 = x + rr; if (y - rr < by0) by0 = y - rr; if (y + rr > by1) by1 = y + rr; };
      const glow = (P.glow || 0) + (k === 3 ? 0.25 : 0), dis = cl(P.dis || 0), asm = P.asm == null ? 1 : cl(P.asm);
      /* put a mesh: R its turn (model space, may mirror or scale), T its origin, sc its scale, ord its place in the assembly (0 first .. 1 last) */
      const put = (mesh, R, T, sc, gl, op, ord) => {
        if (!mesh) return null; sc = sc || 1;
        if (asm < 0.999) { const a0 = (ord || 0) * 0.72, a = sstep(a0, a0 + 0.28, asm); if (a < 0.02) return null; const dir = sub(T, [BODYC[0], 0, 2.5]), ax = norm([hash(T[0] * 3.1 + T[2]) - 0.5, hash(T[1] * 5.7 + 1) - 0.5, 0.6]);
          T = add(T, add(mul(dir, (1 - a) * 0.9), [0, 0, (1 - a) * 2.4])); R = mm(axisR(ax, (1 - a) * 2.6), R); sc *= 0.55 + 0.45 * a; }
        const g = item(), Rm = mm(Rroot, R), Tw = W3(T), z = sw * sc;
        for (let i = 0; i < 3; i++) { g.R0[i] = Rm[i * 3] * z; g.R1[i] = Rm[i * 3 + 1] * z; g.R2[i] = Rm[i * 3 + 2] * z; g.T[i] = Tw[i]; }
        g.mesh = mesh; g.alpha = op && op.alpha != null ? op.alpha : 1; g.glow = gl || 0; g.glow2 = (op && op.glow2) || 0; g.spill = op && op.spill != null ? op.spill : dis > 0 ? dis * (op && op.disK != null ? op.disK : 1) : 0; g.kind = (op && op.kind) || 0; g.wear = 1; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = !(op && op.noInk) && !(g.spill > 0.001);   // (no ink hull while it dissolves: the hull cannot follow the holes)
        (g.alpha < 0.995 ? TRANS : ITEMS).push(g);
        if (mesh.bs) { const bs = mesh.bs, c3 = add(T, mv(R, mul(bs, sc))), sk = Math.max(Math.hypot(R[0], R[3], R[6]), Math.hypot(R[1], R[4], R[7]), Math.hypot(R[2], R[5], R[8])); box(c3, bs[3] * sc * sk * 1.03 + 0.05); }
        return g; };
      /* the body's frame: pitch (nose down +), bank, lift, a sway forward; the gait's dip as the front feet take the weight */
      const G = gait(P.ph || 0, cl(P.mv || 0), P.gaitK || 1), feet = P.feet, MS = o.inst ? motion(o.inst, P) : null, dyn = MS || ZM, mvv = cl(P.mv || 0);
      /* v430 BP: each leg's foot (body frame) and its swing: the motion's planted feet with an instance, else the pure gait; the weight
         moves off a lifted leg (the body shifts toward its support and sags a little over the lifted corner), lands with each footfall
         (the vertical spring) and lurches with the walk's acceleration; the idle's slow weight shifts (held, then moved on) */
      for (let i = 0; i < 4; i++) { const q = LGS[i], L = LEGS[i]; if (MS) { const f = MS.F[i]; q.bx = f.bx; q.by = f.by; q.lift = f.lift; q.pitch = f.pitch; q.load = f.ld * (L.f ? 1 : 0.8) * Math.max(0.35, mvv); }
        else { const g = G[i], hm = homeOf(i, P); q.bx = hm[0] + g.dx; q.by = hm[1]; q.lift = g.lift; q.pitch = g.pitch; q.load = g.load; } }
      let dip = 0, push = 0, wr = 0, wy = 0, wp = 0; for (let i = 0; i < 4; i++) { const L = LEGS[i], q = LGS[i], lf = cl(q.lift / 0.6); if (L.f) dip += q.load * 0.13; else push += q.load * 0.05; wr -= lf * L.s * 0.024; wy -= lf * L.s * 0.075; wp += lf * (L.f ? 0.018 : -0.012); }
      const rear = cl(P.rear || 0), crouch = P.crouch || 0, sh = (P.shift || 0) + LF.shift * (1 - mvv) * (1 - rear);
      const pitch = (P.pitch || 0) + dip * 0.12 - push * 0.4 + crouch * 0.1 - rear * 0.42 + (P.stagger || 0) * 0.08 + wp + dyn.sx * 0.07, bank = (P.bank || 0) + wr - dyn.sy * 0.05 - sh * 0.035;
      const lift = (P.lift || 0) + LF.bob - (MS ? dip * 0.35 : dip) + dyn.sz * 1.9 - crouch * 0.35 + rear * 0.55;
      const Mb = mm(rx(bank), ry(pitch)), tbo = [(P.dx || 0) + rear * -0.35 + dyn.sx * 0.85, wy + dyn.sy * 0.55 + sh * 0.3, lift];
      const BP = p => add(add(mv(Mb, sub(p, BODYC)), BODYC), tbo), BR = R => mm(Mb, R);
      const br = LF.breath * 0.012;
      /* the torso */
      put(M.torso, BR([1, 0, 0, 0, 1 + br, 0, 0, 0, 1 + br]), BP([0, 0, 0]), 1, glow, null, 0.32);
      /* the core: the planet, its field, the rings (an armillary on their own axes), the cage; opening throws the rings out */
      const cp = BP(CORE), co = P.coreOpen || 0, cg = (P.core == null ? 0.85 : P.core) + LF.core, rk = (P.ringK || 1);
      put(M.planet, BR(rz(t * 0.25)), cp, 1 + co * 0.25, cg, { glow2: Math.max(0, cg - 1.2) * 0.6, noInk: true }, 0.85);
      put(M.cshell, BR(rz(-t * 0.4)), cp, 1 + co * 0.35, cg, { alpha: 0.99, noInk: true }, 0.85);
      const ncr = Math.min(CRINGS.length, NCR[k] - (low && k === 3 ? 1 : 0));
      for (let i = 0; i < ncr; i++) { const C = CRINGS[i], ax = norm(add(C.ax, [0.2 * Math.sin(t * 0.3 + i), 0.15 * Math.cos(t * 0.4 + i), 0])), Rt = mm(frameZ(ax), rz(t * C.sp * rk + i * 1.3)), rr = C.R * (1 + co * (0.35 + i * 0.12)) * CORER / 0.62;
        put(M.cring[C.m], BR(Rt), cp, rr, glow + cg * 0.4, { kind: i, glow2: cg, noInk: true }, 0.9); }
      const mech = cl(P.mech || 0); if (MS) { MS.mA = (MS.mA || 0) + MS.h * (0.2 + 2.6 * mech) * rk; }   // v430 BP: the machinery's own turn (integrated: no jump as it speeds up)
      put(M.cstab, BR(mm(ry(Math.PI / 2), rz(-t * 0.2 * rk - (MS ? MS.mA : 0)))), add(cp, mv(Mb, [-0.05, 0, 0])), CF * (1 + co * 0.3), glow, null, 0.9);
      /* v430 BP: debris held round the Core of Dominion by its gravity: stone and bronze shards on tilted orbits, slower farther out,
         thrown wider as it opens, drawn in as it compresses (P.monoIn) */
      if (!low || k === 3) { const nd = [0, 3, 4, 6][k] - (low ? 2 : 0), mi0 = cl(P.monoIn || 0);
        for (let j = 0; j < nd; j++) { const a = t * (0.62 - j * 0.06) * (0.6 + 0.4 * rk) + j * 2.39, R0 = CORER * (1.75 + 0.32 * j) * (1 + co * 0.45) * (1 - 0.35 * mi0), tl = 0.5 + 0.35 * Math.sin(j * 2.1), ca = Math.cos(a), sa = Math.sin(a);
          const off = [0.35 * sa * Math.sin(tl) + 0.25, ca * R0, sa * R0 * Math.cos(tl) * 0.85 + 0.1 * Math.sin(t * 0.7 + j)];
          put(j % 2 ? M.frag2 : M.frag, BR(mm(rz(a * 1.7 + j), rx(a * 1.3))), add(cp, mv(Mb, off)), 0.15 + 0.05 * ((j * 7) % 3), glow + 0.15, null, 0.9); } }
      box(cp, 1.7 * CF + co * 0.8);
      /* the bastions and haunches (mirrored): they rise (P.bast) */
      const bastA = (P.bast || 0) + LF.bast;
      for (const s of [1, -1]) { const Mi = s > 0 ? I3 : MY, bp = [BASTP[0], s * BASTP[1], BASTP[2]];
        // v430 BP: each shoulder rides its foreleg (it rocks back as the leg reaches, lifts with it) and the haunch its hind leg; the armour settles with the breath
        const qf = LGS[s > 0 ? 0 : 1], qh = LGS[s > 0 ? 2 : 3], df = qf.bx - LEGS[0].x, dh = qh.bx - LEGS[2].x, ar = 0.025 * LF.armour * lv;
        put(M.bast[k], BR(mm(ry(-df * 0.055), mm(Mi, rx(-bastA * 0.5 - qf.lift * 0.05)))), BP(add(bp, [-df * 0.04, 0, bastA * 0.45 + qf.lift * 0.1 + ar])), BSC, glow, null, 0.45);
        put(M.haunch, BR(mm(ry(-dh * 0.05), mm(Mi, rx(-bastA * 0.3 - qh.lift * 0.05)))), BP([HAUNP[0] - dh * 0.035, s * HAUNP[1], HAUNP[2] + bastA * 0.25 + qh.lift * 0.08 + ar * 0.7]), 1.15, glow, null, 0.42); }
      /* the citadel: the keep's tiers by form; the ultimate extends it skyward (citUp), the carapace lifts it a little (cit) */
      const cit = cl(P.cit || 0), up = cl(P.citUp || 0);
      /* v430 BP: the citadel's tiers sway a little on their own bases (the higher, the more), late behind the body's lurches and footfalls,
         a breath of idle drift; they rise in turn (the keep's tiers, then its towers and spires one by one) rather than all together */
      const swP = dyn.cp + 0.004 * Math.sin(t * 0.83) * lv, swR = dyn.cr + 0.004 * Math.sin(t * 0.61 + 1) * lv;
      const swy = (pv, kq, off, mesh, ord) => { const R = mm(ry(swP * kq), rx(swR * kq)); put(mesh, BR(R), BP(add(sub(pv, mv(R, pv)), off)), 1, glow, null, ord); };
      const upI = (i, n) => sstep(i / (n + 2), (i + 2.2) / (n + 2), up);
      put(M.cit, BR(I3), BP([0, 0, up * 0.15]), 1, glow, null, 0.6);
      swy([1.75, 0, CITF], 1.6, [0, 0, upI(0, 4) * 0.55 + cit * 0.12], M.hall, 0.66);
      swy([-1.75, 0, CITR], 1.4, [0, 0, upI(0, 4) * 0.35 + cit * 0.1], M.rhall, 0.64);
      if (k >= 2) swy([1.75, 0, CITF + 2.3], 2.6, [0, 0, upI(1, 4) * 1.1 + cit * 0.25], M.hall2, 0.7);
      if (k >= 3) swy([1.75, 0, CITF + 3.6], 3.6, [0, 0, upI(2, 4) * 1.7 + cit * 0.35], M.crown, 0.74);
      const TOW = k === 3 ? [[-0.15, 0.82, 0.85], [-0.15, -0.82, 0.85], [-3.0, 0.82, 0.9], [-3.0, -0.82, 0.9], [-3.15, 0, 1.2]] : k === 2 ? [[-0.15, 0.82, 0.85], [-0.15, -0.82, 0.85]] : [];
      TOW.forEach((w, i) => { const R = mm(ry(swP * 3 + 0.05 * cit * (w[0] > -1 ? 1 : -1)), rx(swR * 3 + 0.06 * cit * Math.sign(w[1]))); put(M.tower, BR(R), BP([w[0], w[1], CITR + 0.1 + upI(i, TOW.length) * (0.6 + 0.25 * i) + cit * 0.2]), w[2], glow, null, 0.7); });
      const SPI = [[1.75, 1.5, CITF, 0.9], [1.75, -1.5, CITF, 0.9], [-1.6, 1.4, CITR, 0.85], [-1.6, -1.4, CITR, 0.85], [-2.6, 1.4, CITR, 0.8], [-2.6, -1.4, CITR, 0.8], [-0.6, 1.4, CITR, 0.8], [-0.6, -1.4, CITR, 0.8]];
      const nsp = [0, 2, 4, 8][k]; for (let i = 0; i < nsp; i++) { const w = SPI[i], R = mm(ry(swP * 4), rx(swR * 4 + 0.1 * cit * Math.sign(w[1]))); put(M.spire, BR(R), BP([w[0], w[1], w[2] + 0.95 + upI(i, nsp) * 0.4]), w[3], glow, null, 0.72); }
      /* the fortress plates: hinged along the walls; the carapace raises them past upright and swings them out into an array */
      const pls = LF.plates;
      for (const s of [1, -1]) for (let i = 0; i < 3; i++) { const xi = [-2.35, -0.65, 1.75][i], zf = i === 2 ? CITF : CITR, lag = sstep(i * 0.12 + (s < 0 ? 0.05 : 0), 0.64 + i * 0.12 + (s < 0 ? 0.05 : 0), cit), op = sstep(0, 1, lag);
        // v430 BP: the plates unlatch (a small kick back against the hinge), swing up past upright with an overshoot that settles, and
        // chatter on their hinges while the machinery works
        const ov = 0.22 * Math.sin(Math.PI * cl((lag - 0.55) / 0.45)) * (lag > 0.55 ? 1 : 0), unl = 0.12 * Math.sin(Math.PI * cl(lag / 0.18)) * (lag < 0.18 ? 1 : 0), chat = mech * 0.035 * Math.sin(t * 11 + i * 2.1 + s);
        const hinge = [xi + op * (i - 1) * 0.6, s * (1.62 + op * 0.7), zf + 0.55 + op * (1.0 + 0.3 * Math.abs(i - 1)) + up * 0.3];
        const Rr = mm(s > 0 ? I3 : MY, mm(rz(op * (i - 1) * 0.35), rx(0.95 - op * 2.45 - ov + unl + chat + pls + up * 0.3)));
        put(M.cplate, BR(Rr), BP(hinge), 1.15, glow + op * 0.6, null, 0.55); }
      /* the neck and head: the head hangs low and forward on a short massive neck; it dips (P.head +) and looks about; it lowers for the charge, raises for the crown */
      // v430 BP: the head leads into a turn, keeps its level against the body's footfall bob and lurch (a stabilised gaze, a beat
      // late), counters the body's roll, and makes its own small deliberate adjustments at rest
      const lead = Math.max(-0.32, Math.min(0.32, dyn.yr * 0.28)), hd = (P.head || 0) + LF.head + LF.neckH * (1 - mvv) - wp * 1.2 - dyn.sx * 0.12, look = (P.look || 0) + LF.look + LF.neckL * (1 - mvv) + lead - bank * 0.8, stg = P.stagger || 0;
      const HP = add(HEADP, [0.3 * hd, -wy * 0.6 - sh * 0.15, -0.7 * hd + 0.1 * stg - dyn.sz * 1.1]), Rh = mm(rz(look * 0.55), mm(rx(-bank * 0.7), ry(0.2 + 0.42 * hd - 0.25 * stg))), hpW = BP(HP), RhW = BR(Rh), RhS = mm(Rh, scl3(HS));
      for (let i = 0; i < 3; i++) { const u = (i + 0.5) / 3, a = NECK0, b = add(HP, mv(RhS, [-0.5, 0, 0.05])), m3 = lerp3(a, b, u); m3[2] += 0.15 * Math.sin(Math.PI * u) * (1 - hd * 0.5);
        const dirN = norm(sub(b, a)), Rv = mm(rz(look * 0.55 * u), ry(-Math.atan2(dirN[2], dirN[0]))); put(M.vert, BR(Rv), BP(m3), 1.75 - u * 0.25, glow, null, 0.7); }
      put(M.head, RhW, hpW, HS, glow, { glow2: (P.eye == null ? 1 : P.eye) }, 0.8);
      const jaw = cl((P.jaw || 0) + LF.jaw), jawP = add(HP, mv(RhS, [0.45, 0, -0.68]));
      put(M.jaw, BR(mm(Rh, ry(jaw * 0.5))), BP(jawP), HS, glow, null, 0.8);
      if (jaw > 0.04) put(M.maw, BR(mm(Rh, rx(t * 2))), BP(add(HP, mv(RhS, [1.2, 0, -0.72]))), (0.8 + jaw * 0.4) * HS, 0.6 + jaw * 2 + glow, { noInk: true }, 0.8);
      box(hpW, 3.2 * HS);
      /* the horns: segments unfold off the core; rings turn round them; fragments orbit */
      const hn = cl((P.horn || 0) + LF.horn), hk = [0, 1.35, 1.65, 1.9][k], hal = P.hornAlign || 0, out = { hornTips: [], hornRings: [], eyes: [], feet: [], monos: [] };
      for (const s of [1, -1]) {
        const Mi = s > 0 ? I3 : MY, mount = add(HP, mv(RhS, [HORNM[0], s * HORNM[1], HORNM[2]])), Rhn = mm(Rh, mm(Mi, mm(rz(0.05 + hal * 0.3), mm(rx(-0.12 - hal * 0.5), ry(-0.2 + LF.hornTurn - hal * 0.6)))));
        const H3 = p => BP(add(mount, mv(Rhn, mul(p, hk)))), HR3 = R => BR(mm(Rhn, R));
        put(M.hcore, HR3(I3), H3([0, 0, 0]), hk, 0.7 + hn * 1.6 + glow, { noInk: true }, 0.95);
        for (let i = 0; i < NHS; i++) { const S = HSEG[i], o2 = hn * (0.16 + 0.05 * Math.sin(i * 1.7)) * hornR(0.5) * 1.6 * (1 + 0.15 * mech * Math.sin(t * 7 + i * 1.3)),
            tw = hn * 0.12 * (i % 2 ? 1 : -1) + (0.035 * lv + 0.1 * mech) * Math.sin(t * (0.33 + 0.07 * i) * (1 + 2.5 * mech) + i * 1.9 + s);   // v430 BP: each segment turns on its own, faster as the engine works
          const Rs = mm(axisR(S.t, tw), I3), piv = S.c, T = add(sub(piv, mv(Rs, piv)), mul(S.o, o2));
          put(M.hseg[i], HR3(Rs), H3(T), hk, glow + hn * 0.8, null, 0.97); }
        const tip = H3(add(hornP(1), mul(hornF(1).T, 0.5))); out.hornTips.push(scr(tip)); box(H3(hornP(0.5)), 2.4 * hk);
        const nr = HRUSE[k].length - (low && k === 3 ? 1 : 0);
        for (let j = 0; j < nr; j++) { const RG = HRINGS[HRUSE[k][j]], spin = t * RG.sp * rk + j * 2.1 + s; let c3, Rt, rr;
          if (RG.big) { c3 = RG.c; rr = RG.R * (1 + (P.ringOut || 0) * 0.35); Rt = mm(frameZ(norm(add(RG.ax, [0.15 * Math.sin(t * 0.35 + j), 0.1 * Math.cos(t * 0.27 + j), 0]))), rz(spin)); }
          else { const f = hornF(RG.u); c3 = add(f.P, mul(f.N, (P.ringOut || 0) * 0.5)); rr = hornR(RG.u) * RG.k * (1 + (P.ringOut || 0) * 0.4); Rt = mm(frameZ(norm(add(f.T, mul(f.N, RG.ax[0])))), rz(spin)); }
          put(M.hring, HR3(Rt), H3(c3), rr * hk, glow + 0.4 + hn * 1.2 + (rk - 1) * 0.3, { kind: j + (s > 0 ? 0 : 5), glow2: 0.5 + hn, noInk: true }, 1);
          if (k === 3 && j === 3 && !low) put(M.lring, HR3(mm(Rt, rz(-spin * 2))), H3(c3), rr * hk * 1.07, 0.6 + hn, { alpha: 0.99, kind: j, noInk: true }, 1);
          out.hornRings.push(scr(H3(c3))); }
        if (!low) for (let j = 0; j < (k + 2); j++) { const a = t * (0.7 + j * 0.13) * rk + j * 2.4, rad = 1.2 + 0.35 * Math.sin(j * 1.9) + hn * 0.6, f = hornF(0.5), c3 = add(HCN, mul([Math.cos(a) * 0.4, Math.cos(a), Math.sin(a)], rad));
          put(j % 2 ? M.frag2 : M.frag, HR3(mm(rz(a * 2), rx(a))), H3(add(c3, [f.P[0] * 0.3, 0, 0])), 0.13 + 0.05 * (j % 3), glow, null, 1); }
      }
      /* the eyes, the core and the mouth on screen */
      out.eyes = [1, -1].map(s => scr(BP(add(HP, mv(RhS, [0.96, s * 0.95, 0.29])))));
      /* the tail: segments hanging and swaying (its spring), the anchor floating below its tip */
      const Sp = o.inst && o.inst.blS ? o.inst.blS : null, tsw = (P.tail || 0) + LF.tail + (Sp ? Sp[0] : 0), tup = LF.tailY + (Sp ? Sp[2] : 0);
      { const n = 6;
        // v430 BP: a chain: each segment follows the one before it a little late (with an instance), so a swing travels down the tail;
        // it swings out of a turn and lifts and drops with the body's footfalls and lurches
        if (MS && MS.h > 0) { const d0 = tsw - Math.max(-0.5, Math.min(0.5, dyn.yr * 0.4)) + dyn.sy * 0.7, d1 = tup - dyn.sz * 1.8 + dyn.sx * 0.35; for (let i = 0; i < n; i++) { const r2 = Math.min(1, MS.h * (10 - i * 1.25)); MS.tail[i] += ((i ? MS.tail[i - 1] : d0) - MS.tail[i]) * r2; MS.tailP[i] += ((i ? MS.tailP[i - 1] : d1) - MS.tailP[i]) * r2; } }
        const tA = i => (MS ? MS.tail[i] : tsw), tP = i => (MS ? MS.tailP[i] : tup);
        let p = TAIL0, R = mm(rz(tA(0) * 0.25), ry(-0.55 - tP(0) * 0.4));
        for (let i = 0; i < n; i++) { const sc = (1 - i * 0.08) * 1.35; put(M.tseg, BR(R), BP(p), sc, glow, null, 0.35); p = add(p, mv(R, [-0.62 * sc, 0, 0])); const j = Math.min(n - 1, i + 1); R = mm(R, mm(rz(tA(j) * 0.22 + 0.06 * Math.sin(t * 0.9 - i * 0.6) * lv), ry(-0.17 - tP(j) * 0.1))); }
        const mp = add(p, mv(R, [-0.7, 0, -0.45])); mp[2] += 0.15 * Math.sin(t * 1.4);
        put(M.mace, BR(mm(rz(t * 0.8), rx(0.15 * Math.sin(t * 0.9)))), BP(mp), 1.35, glow + 0.4, null, 0.35); out.mace = scr(BP(mp)); out.tailTip = scr(BP(p)); box(BP(mp), 1.9); }
      /* the legs: hips on the body, feet planted on the floor (the gait, or P.feet), the knees by IK; massive (each thickened by w), pistons that compress */
      const stabA = LF.stab;
      for (let i = 0; i < 4; i++) {
        const L = LEGS[i], s = L.s, Mi = s > 0 ? I3 : MY, H = BP([L.x, s * L.hy, L.z]), g = LGS[i], fo = feet && feet[i] ? feet[i] : null, hh = HOOFH * L.hs, Wd = [L.w, 0, 0, 0, L.w, 0, 0, 0, 1];
        let fx = g.bx + (fo ? fo[0] : 0), fz = g.lift + (fo ? fo[2] : 0); if (L.f && rear > 0) { fx += rear * 1.2; fz = Math.max(fz, rear * 2.6); }
        const footY = g.by + s * (fo ? fo[1] : 0), Aw = [fx, footY, hh + fz];
        const J = ik(H, Aw, L.f ? 1 : -1), Rt = segR(H, J.K), Rs = segR(J.K, J.A), RtW = mm(Rt, Wd), RsW = mm(Rs, Wd);
        put(M.thigh, mm(RtW, Mi), H, 1, glow, null, 0.18); put(M.shin, mm(RsW, Mi), J.K, 1, glow, null, 0.12);
        put(M.stab, mm(RsW, rz(stabA * (i % 2 ? 1 : -1) * (1 + mvv) + g.lift * 1.6 * (i % 2 ? 1 : -1))), add(J.K, mv(Rs, [0, 0, -0.55 * L2])), 1.04, glow, null, 0.12);
        // v430 BP: the ankle: flat on the floor when planted; in the air the hoof flexes back at toe-off, reaches, and levels before it lands
        const shA = Math.atan2(J.A[0] - J.K[0], J.K[2] - J.A[2]), air = sstep(0.0, 0.18, fz), hoofR = air > 0.001 ? mm(ry(g.pitch * air - shA * 0.3 * air), Mi) : Mi; put(M.hoof, hoofR, J.A, L.hs, glow, null, 0.0);
        const a1 = add(H, mv(RtW, [-0.5, s * 0.42, -0.4])), a2 = add(J.K, mv(RsW, [-0.42, s * 0.36, -0.9])), dv = sub(a2, a1), dl = len(dv), dn = norm(dv), Rp = frameZ(dn), Rx = [Rp[2], Rp[0], Rp[1], Rp[5], Rp[3], Rp[4], Rp[8], Rp[6], Rp[7]], pw = L.w * 0.8;
        put(M.pS, mm(Rx, [dl * 0.58 / pw, 0, 0, 0, 1, 0, 0, 0, 1]), a1, pw, glow, null, 0.15); put(M.pR, mm(Rx, [dl * 0.62 / pw, 0, 0, 0, 1, 0, 0, 0, 1]), add(a2, mul(dn, -dl * 0.62)), pw, glow, null, 0.15);
        out.feet.push(scr([fx, footY, 0])); box(H, 1.2 * L.w); box(Aw, 1.0 * L.hs);
      }
      /* banners: from the chest under the core, from each bastion (swinging with the springs) */
      const bsw2 = (Sp ? Sp[6] : 0) * 0.6;
      put(M.ban, BR(rx((Sp ? Sp[4] : 0) * 0.4)), BP([CORE[0] - 0.1, 0, CORE[2] - 1.62 * CF]), 1.2, glow, null, 0.9);
      for (const s of [1, -1]) put(M.ban, BR(mm(rz(Math.PI / 2), mm(ry(-0.12 + bsw2 * s), rx(0.05 * Math.sin(t * 1.3 + s))))), BP([BASTP[0] + 0.15, s * (BASTP[1] + 0.85 * BSC), BASTP[2] - 0.75 * BSC]), 1.0, glow, null, 0.5);
      /* the monoliths: they drift round it; P.mono throws them out into an array (the carapace, the ultimate), monoIn draws them in */
      const nmo = NMONO[k] - (low && k === 3 ? 2 : 0), mo = P.mono || 0, mi = cl(P.monoIn || 0);
      for (let i = 0; i < nmo; i++) { const Mo = MONOS[i], a = Mo.a + t * 0.05 * (i % 2 ? 1 : -1) + mo * 0.6 * (i % 2 ? 1 : -1), r = Mo.r * (1 + mo * 0.25) * (1 - mi * 0.85), z = Mo.z + LF.mono * (i % 2 ? 1 : -1) * 0.3 + mo * 0.8 - mi * (Mo.z - CORE[2]) * 0.8;
        const c3 = [0.2 + Math.cos(a) * r, Math.sin(a) * r * 0.85, z + 0.2 * Math.sin(t * 0.6 + i)]; put(M.mono, mm(rz(a + Math.PI / 2 + t * 0.03), rx(0.08 * Math.sin(t * 0.5 + i))), c3, Mo.s, glow + 0.3 + (P.monoDis || 0) * 2, P.monoDis > 0 ? { spill: Math.max(dis, P.monoDis) } : null, 0.6); out.monos.push(scr(c3)); }
      /* the halo (the last form), above the keep */
      if (k === 3 && (P.halo == null || P.halo > 0.01)) { const hc = BP([1.2, 0, CITF + 7.0 + up * 1.8]); put(M.halo, BR(mm(rx(0.5), rz(t * 0.12))), hc, 1.15 * (P.halo == null ? 1 : P.halo) * (1 + up * 0.3), glow + 0.5, { kind: 3, noInk: true }, 1); out.halo = scr(hc); box(hc, 4.8); }
      if (!(bx1 > bx0) || !ITEMS.length) return null;
      for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__BL_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : RES.k);
      bx0 = Math.floor(bx0) - 3; by0 = Math.floor(by0) - 3; bx1 = Math.ceil(bx1) + 3; by1 = Math.ceil(by1) + 3;
      let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const bw = bx1 - bx0, bh = by1 - by0;
      const S = { px: PXW, py: PYW, pd: PDW, cl: [2 * kk / bw, 2 * (X0 - bx0) / bw - 1, -2 * kk / bh, 1 - 2 * (Y0 - by0) / bh], v: PDW, lk: LW, ls: SBW, lr: RIMW, up: UPW, low, rim: o.rim || RIMC, amb: o.amb || AMBC, t: nowMs() / 1000 % 1000,
        outline: o.ink === false || low ? 0 : Math.max(0.6, 0.7 * (W / bw)), outlineCol: OUTC, outlineBias: 0.0025, clip: null };
      const t0 = nowMs(), cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return null;
      const alp = o.alpha == null ? 1 : o.alpha; if (alp > 0.004) { c.save(); c.globalAlpha = Math.min(1, alp); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
      STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; if (!GLM.soft && STATS.n > 20) RES.k = STATS.ms > 7 ? Math.max(0.6, RES.k - 0.02) : STATS.ms < 3.5 ? Math.min(1, RES.k + 0.01) : RES.k; STATS.items = ITEMS.length; STATS.W = W; STATS.H = H;
      out.bb = [bx0, by0, bx1, by1]; out.unit = K * (o.scale || 1); out.core = scr(cp); out.coreR = CORER * (1 + co * 0.25) * out.unit; out.head = scr(hpW); out.mouth = scr(BP(add(HP, mv(RhS, [2.0, 0, -0.95])))); out.back = scr(BP([0.4, 0, CITF + 1.2])); out.top = scr(BP([1.75, 0, CITF + 4.6 + up * 1.7]));
      out.steps = MS ? MS.steps : null; out.lifts = LGS.map(q => q.lift);   // v430 BP: the feet that landed this frame ({ i, f, idle }), each foot's height
      out.ground = [X0, Y0]; out.coreVis = cl((Math.sin(P.yaw || 0) * CE + 0.45) / 0.7); out.chest = scr(BP([CORE[0], 0, CORE[2] - 1.5 * CF]));
      return out;
    } catch (e) { fail(e); return null; }
  }
  /* AnimaArt's route: the Anima at (x, y) (its feet), size px tall, at time t; o.blP (a pose from the fight) or the form's idle */
  function drawAnima(c, k, x, y, size, t, o) {
    o = o || {}; if (!ensure()) return false;
    const ip = o.inst && o.inst.blP, P = o.blP || ip || idlePose(k, t), fk = o.fk != null ? o.fk : o.flip ? -1 : 1; if (!o.blP && !ip) P.yaw = fk < 0 ? Math.PI - 0.62 : 0.62;
    const K = size / HEIGHT[k];
    const r = draw(c, { X: x, Y: y, K, P, k: P.k || k, alpha: o.alpha == null ? 1 : o.alpha, inst: o.inst });
    if (o.out) o.out.r = r; if (o.inst && ip) o.inst.blOut = { r };
    if (r && !ip && !o.blP && o.light !== false && size >= 60) coreLight(c, r, P, o.alpha == null ? 1 : o.alpha);
    return !!r;
  }
  /* the Core's light on the shared GPU painter (FGFX 201), for stills and menus */
  function coreLight(c, r, P, al) {
    try { const N = typeof self !== 'undefined' && self.NIDHOGG_MOVES, F = N && N.FGFX; if (!F || !F.usable()) return false;
      const t = P.t || 0, pl = 0.5 + 0.5 * Math.sin(t * 1.6), R = Math.max(r.coreR * 3.2, 6);
      F.flush(c); const Q = F.begin(c, null); Q.quad(201, r.core[0], r.core[1], R, 0, 0, R, '#FFB347', al * (r.coreVis == null ? 1 : r.coreVis), r.coreR / R, pl, 0.55 + 0.25 * cl((P.core || 0.85) - 0.6));
      for (const e of r.eyes) Q.glow(e[0], e[1], r.unit * 0.6, '#FFA030', 0.45 * al);
      F.flush(c); F.begin(c, null); return true; } catch (e) { return false; }
  }
  /* effect meshes in screen space (one GLM pass): list of { m: 'pillar' | 'rock' | 'gring' | 'mono' | 'frag', X, Y (screen px: a
     pillar's foot, else its centre), s (px a model unit), yaw, tilt (about the screen's x), a (alpha), gl, g2, dis (dissolve),
     z (depth: larger nearer; default Y), and for a pillar: h (its rise 0..1), drums [ { lift px, rot, off: [dx, dy] } x4 ] } */
  const SV = [0, 0, 1], SUP = [0, -1, 0], SLK = norm([-0.45, -0.7, 0.55]), SLS = norm([-0.2, -0.85, 0.5]), SLR = norm([0.65, 0.45, -0.2]), PX2 = [1, 0, 0], PY2 = [0, 1, 0], PD2 = [0, 0, 1];
  const CAM = [1, 0, 0, 0, SE, -CE, 0, CE, SE];   // (model x, depth y, up z -> screen x, y down, z toward the viewer)
  function drawParts(c, list, o) {
    const d = data(); if (!d.ready || NOGL || !list || !list.length) return false; o = o || {};
    try { ITEMS.length = 0; TRANS.length = 0; NP = 0; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const M = D.M;
      const box = (x, y, r) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
      const put = (mesh, R, T, al, gl, g2, dis, kind) => { const g = item(); for (let i = 0; i < 3; i++) { g.R0[i] = R[i * 3] * 0.01; g.R1[i] = R[i * 3 + 1] * 0.01; g.R2[i] = R[i * 3 + 2] * 0.01; g.T[i] = T[i] * 0.01; }
        g.mesh = mesh; g.alpha = al; g.glow = gl || 0; g.glow2 = g2 || 0; g.spill = dis || 0; g.kind = kind || 0; g.wear = 1; g.fx = 0; g.first = 0; g.cnt = 0; g.outline = !(dis > 0.001); (al < 0.995 ? TRANS : ITEMS).push(g); };
      for (const e of list) {
        const s = e.s, al = e.a == null ? 1 : e.a; if (!(al > 0.01) || !(s > 0.05)) continue;
        const Rb = mm(CAM, mm(rx(e.tilt || 0), mm(ry(e.lean || 0), rz(e.yaw || 0)))), zz = e.z == null ? e.Y : e.z, at = (lx, ly, lz) => { const v = mv(Rb, [lx, ly, lz]); return [e.X + v[0] * s, e.Y + v[1] * s, zz + v[2] * s]; };
        const R = sc => [Rb[0] * s * sc, Rb[1] * s * sc, Rb[2] * s * sc, Rb[3] * s * sc, Rb[4] * s * sc, Rb[5] * s * sc, Rb[6] * s * sc, Rb[7] * s * sc, Rb[8] * s * sc];
        if (e.m === 'pillar') { const h = Math.max(0, Math.min(1.1, e.h == null ? 1 : e.h)) /* v430 BP: a little past risen (its emergence's overshoot) */, sink = (1 - h) * 5.8, dr = e.drums || [];
          put(M.pbase, R(1), at(0, 0, -sink), al, e.gl, e.g2, e.dis);
          for (let i = 0; i < 4; i++) { const q = dr[i] || {}, lz = 0.72 + i * 1.0 - sink, of = q.off || [0, 0]; const Rd = mm(Rb, mm(rz(q.rot || 0), rx(q.tip || 0))), Rds = Rd.map(v => v * s);
            const T = at(of[0], of[1], lz); T[1] -= q.lift || 0; put(M.drum, Rds, T, al, (e.gl || 0) + (q.gl || 0), e.g2, Math.max(e.dis || 0, q.dis || 0)); }
          const q4 = dr[4] || {}, Tc = at((q4.off || [0, 0])[0], (q4.off || [0, 0])[1], 4.72 - sink); Tc[1] -= q4.lift || 0; put(M.pcap, mm(Rb, rz(q4.rot || 0)).map(v => v * s), Tc, al, (e.gl || 0) + 0.3, e.g2, Math.max(e.dis || 0, q4.dis || 0));
          if (h > 0.6) { const Tr = at(0, 0, 4.1 - sink + 0.3 * Math.sin((e.t || 0) * 2)); Tr[1] -= q4.lift || 0; put(M.gring, mm(Rb, mm(rx(0.1), rz((e.t || 0) * 1.4))).map(v => v * s * 1.25), Tr, al, 0.8 + (e.gl || 0), 1, e.dis, 2); }
          const top = at(0, 0, 6.2 - sink); box(e.X, e.Y, s * 1.5); box(top[0], top[1] - (q4.lift || 0), s * 1.6); }
        else { const mesh = e.m === 'rock' ? M.rock : e.m === 'gring' ? M.gring : e.m === 'mono' ? M.mono : e.m === 'frag' ? M.frag : e.m === 'lring' ? M.lring : M.rock; if (!mesh) continue;
          put(mesh, R(1), [e.X, e.Y, zz], al, e.gl, e.g2, e.dis, e.kind || 0); box(e.X, e.Y, s * (mesh.bs ? mesh.bs[3] + len(mesh.bs) : 2) * 1.05); }
      }
      if (!(x1 > x0) || !(ITEMS.length + TRANS.length)) return false; for (const g of TRANS) ITEMS.push(g);
      const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !flag('__BL_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.5 : 1) * (o.res || (lowFx() ? 0.6 : 0.85));
      x0 = Math.floor(x0) - 2; y0 = Math.floor(y0) - 2; x1 = Math.ceil(x1) + 2; y1 = Math.ceil(y1) + 2; const bw = x1 - x0, bh = y1 - y0;
      let W = Math.ceil(bw * dev), H = Math.ceil(bh * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
      const S = { px: PX2, py: PY2, pd: PD2, cl: [200 / bw, -2 * x0 / bw - 1, -200 / bh, 1 + 2 * y0 / bh], v: SV, lk: SLK, ls: SLS, lr: SLR, up: SUP, low: lowFx(), rim: RIMC, amb: AMBC, t: nowMs() / 1000 % 1000, outline: lowFx() ? 0 : Math.max(0.5, 0.6 * (W / bw)), outlineCol: OUTC, outlineBias: 0.002 };
      const cvs = GLM.render(W, H, S, ITEMS); if (!cvs) return false; c.save(); c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.drawImage(cvs, 0, 0, W, H, x0, y0, bw, bh); c.restore(); return true;
    } catch (e) { fail(e); return false; }
  }
  if (typeof window !== 'undefined') setTimeout(() => { try { warm(); } catch (e) {} }, 1500);   // (prepared at load, in idle time)
  return { usable, warm, ensure, step, release, gpuCount, draw, drawAnima, drawParts, coreLight, idlePose, life, gait, footfalls, springs, profile, motion /* v430 BP */, SWING, RES, STATS, MT, WS, HEIGHT, STRIDE, LEGS, CORE, BODYC, NMONO,
    ready: () => !!(D && D.ready), get up() { return !!(D && D.up); }, get nv() { return D ? D.nv : 0; }, get off() { return NOGL; } };
})();
if (typeof self !== 'undefined') self.BELIAL_GL = BELIAL_GL;
