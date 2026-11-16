/* ---------- Rift 0, the Blackfire Caldera: IFRIT, Heart of the Volcano (worker I) ----------
   The rift's last boss, in the Crucible: a broad circular basalt platform (arena radius 15) ringed by a lava moat, with
   lavafalls pouring down the caldera walls beyond it. His throne of basalt columns stands on the north rim, almost one
   with the rock; two black-fire crystal growths stand near the north-west and north-east edge; two protected frost wells
   (the snowflake emblem of Fire Flan's arena) stand south-west and south-east.
   The body is an ORIGINAL design from the spec's words (docs/RIFT0-BRIEF.md, the art rule): a huge hunched humanoid of
   rock and fire. Thick stone limbs of cooled basalt with glowing fissures; overlapping basalt plates (rough, sooty,
   cooled crust) over a blazing molten core that shows through every seam; heat from the jaw, the shoulders and the plate
   seams; two rough obsidian horns with red-hot edges, thick and forward-curving like a bull's (no mane, no crest);
   clawed stone hands. Drawn live on the GPU with GLM (20k5uz, materials 90..96 between the CAL-IFRIT-MAT markers) as
   Fenrir, Jaws and the Beast Machine are: meshes built once, rigid parts posed each frame, one composite drawImage; a
   2D picture of the same rig when WebGL is missing or software (window.__IFRIT_GL = 1 forces the GPU there, tests).
   I   BASALT TYRANT (100-70%): Titan Fist (a high lift, one marked slam, a long recovery with the chest exposed), Cinder
       Breath (a frontal cone that tracks during the wind-up, then locks; a panting recovery, chest exposed), Fault Line
       (a glowing crack runs out in a straight line, then a narrow eruption along it).
   II  CROWN OF BLACKFIRE (70-35%): the horns flare; both perimeter crystal growths tether to him (each 20% damage
       reduction, 40% at most); ordinary attacks break them (a short stagger, that side of his armour dims, no respawn).
       Burning Cleave (a broad sweep) and a small set of marked falling lava rocks join his set.
   III HEART OF THE VOLCANO (below 35%): his outer armour fractures away, the molten chest bare, fire streaming up from
       his shoulders; any crystal link collapses. Attacks a little faster, and periodically Hellfire: hands planted for
       8 s, lava climbs the walls, the whole floor warns, both frost wells wake (stand still beside one for 0.75 s: a
       marked cold refuge); the wall of flame crosses the arena; the refuge protects; a missed shelter is a heavy hit
       (never a full-health kill, no lingering burn); then he overheats and kneels for 6 s, his core open.
   His fall: the core dims and he settles into a dark inert statue; the lava calms, the crystals go dark; the sealing.
   CAL_IFRIT is the interface: { MODEL, def, make (the arena: CAL.bossMake.califrit), ARENA }. */
const CAL_IFRIT = (() => {
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;   // (the game camera, as Fenrir's: orthographic, about 46 degrees above the floor)
  const VIS = 1.45;   // (he is drawn half again as big as his rig's tiles: a colossus beside the pet)

  /* ================= vectors and rotations (a rotation: its three columns) ================= */
  const hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
  const vadd = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vmul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = a => hyp3(a[0], a[1], a[2]);
  const vnrm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vlerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const M3 = (x, y, z) => ({ x, y, z }), I3 = () => M3([1, 0, 0], [0, 1, 0], [0, 0, 1]);
  const mv = (M, v) => [M.x[0] * v[0] + M.y[0] * v[1] + M.z[0] * v[2], M.x[1] * v[0] + M.y[1] * v[1] + M.z[1] * v[2], M.x[2] * v[0] + M.y[2] * v[1] + M.z[2] * v[2]];
  const mm = (A, B) => M3(mv(A, B.x), mv(A, B.y), mv(A, B.z));
  const rotX = a => { const c = Math.cos(a), s = Math.sin(a); return M3([1, 0, 0], [0, c, s], [0, -s, c]); };
  const rotY = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };   // (+a: x toward -z, a forward bow)
  const rotZ = a => { const c = Math.cos(a), s = Math.sin(a); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  function rotAxis(n, a) { n = vnrm(n); const c = Math.cos(a), s = Math.sin(a), t = 1 - c, [x, y, z] = n;
    return M3([t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]); }
  function frameXZ(xd, zh) { const x = vnrm(xd); let y = vcross(zh, x); if (vlen(y) < 1e-6) y = vcross([0, 0, 1], x); if (vlen(y) < 1e-6) y = [0, 1, 0]; y = vnrm(y); return M3(x, y, vcross(x, y)); }
  /* two-bone reach from S toward T (bones a, b), the middle joint toward `pole` */
  function ik2(S, T, a, b, pole) {
    const d0 = vsub(T, S), L = vlen(d0) || 1e-6, d = Math.max(Math.abs(a - b) + 1e-3, Math.min(a + b - 1e-4, L)), e = vmul(d0, 1 / L);
    let p = vsub(pole, vmul(e, vdot(pole, e))); if (vlen(p) < 1e-6) p = Math.abs(e[2]) < 0.9 ? vcross(e, [0, 0, 1]) : vcross(e, [1, 0, 0]); p = vnrm(p);
    const ca = (a * a + d * d - b * b) / (2 * a * d), sa = Math.sqrt(Math.max(0, 1 - ca * ca));
    return { E: vadd(S, vadd(vmul(e, a * ca), vmul(p, a * sa))), W: vadd(S, vmul(e, d)) };
  }
  /* value noise (for the rock's lumps and ragged plate rims; the mesh is built once) */
  const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
  function vnoise(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const h = (a, b, c) => hash3(xi + a, yi + b, zi + c), l1 = (b, c) => lerp(h(0, b, c), h(1, b, c), u), l2 = c => lerp(l1(0, c), l1(1, c), v); return lerp(l2(0), l2(1), w); }
  const fbm = (x, y, z) => vnoise(x, y, z) * 0.55 + vnoise(x * 2.07 + 5.1, y * 2.07 + 1.3, z * 2.07 + 7.7) * 0.3 + vnoise(x * 4.3 + 2.2, y * 4.3 + 9.4, z * 4.3 + 3.3) * 0.15;

  /* ================= materials (GLM's ids: the CAL-IFRIT-MAT block) =================
     90 basalt plate (rough cooled crust, soot, vesicles, ash on top; its rims glow with the core's heat; uSpill = the
        blackfire the crystal tethers pour into it, uGlow2 = cracks spreading before it breaks away)
     91 basalt flesh (the limbs and the body under the plates: darker rock, a fissure network glowing with uGlow)
     92 molten core (turbulent lava, crusting where it cools; uGlow = its heat: the breath swells it)
     93 obsidian (kind 0: the horns, rough black glass, red-hot ridges and tips, uGlow2 = the flare; kind 1: a black-fire
        crystal growth, deep violet glass with smouldering fractures and slow circulating light, uGlow = alive)
     94 claws (obsidian, glossy, the tips warm)
     95 throne and arena basalt (columnar, dusty; faint seams glowing with uGlow)
     96 lava light (the eyes, the mouth, the vents: emissive, flickering) */
  const M_PLATE = 90, M_ROCK = 91, M_CORE = 92, M_OBS = 93, M_CLAW = 94, M_THRONE = 95, M_LAVA = 96;

  /* ================= the rig's measures (tiles; the model is drawn VIS times this) ================= */
  const HZ = 2.6;                                        // the pelvis above the floor, standing
  const LT = 1.46, LSH = 1.44;                           // thigh, shin
  const LU = 1.5, LF = 1.56;                            // upper arm, forearm (to the wrist)
  const SH = s => [-0.04, s * 1.24, 2.46], HIP = s => [0, s * 0.6, -0.08];
  const NECK = [0.2, 0, 2.78], HEAD = [0.4, 0, 3.22], HS = 1.22;
  const PEC = s => [0.6, s * 0.86, 2.24];               // a pectoral plate's hinge (its outer edge), torso frame

  /* ================= meshes ================= */
  /* the trunk's surface: v 0 (the waist) .. 1 (the neck), phi round it (0 forward, + toward its right, y+) */
  const TRV = [[0, -0.2, 0.5, 0.48, 0.42], [0.12, 0.25, 0.58, 0.54, 0.46], [0.3, 0.86, 0.7, 0.62, 0.52], [0.5, 1.48, 0.9, 0.78, 0.6], [0.66, 1.98, 1.04, 0.86, 0.66], [0.8, 2.38, 1.1, 0.8, 0.68], [0.9, 2.64, 0.98, 0.66, 0.6], [0.97, 2.84, 0.7, 0.48, 0.44], [1, 2.94, 0.36, 0.28, 0.28]];
  function trvAt(v) { let i = 0; while (i < TRV.length - 2 && TRV[i + 1][0] < v) i++; const a = TRV[i], b = TRV[i + 1], u = ease((v - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u), lerp(a[4], b[4], u)]; }
  const sePow = (c, p) => Math.sign(c) * Math.pow(Math.abs(c), 2 / p);
  function trunkPt(ph, v, lift) { const [z, yw, xf, xb] = trvAt(v), c = Math.cos(ph), s = Math.sin(ph), sc = sePow(c, 2.5), ss = sePow(s, 2.5);
    const hunch = 0.16 * sstep(0.55, 1, v) * (c < 0 ? 1 : 0.3);   // (a heavy hunch: the upper back rounded forward)
    const bump = (fbm(ph * 2.2 + 3, v * 5, 1.7) - 0.5) * 0.08;
    const k = 1 + bump + (lift || 0);
    return [sc * (c > 0 ? xf : xb) * k + hunch * 0.4, ss * yw * k, z + (c < 0 ? hunch * 0.35 : 0)]; }
  function trunkNrm(ph, v) { const e = 0.01, a = trunkPt(ph + e, v), b = trunkPt(ph - e, v), c = trunkPt(ph, Math.min(1, v + e)), d = trunkPt(ph, Math.max(0, v - e)); let n = vcross(vsub(a, b), vsub(c, d)); const p = trunkPt(ph, v), ax = [0, 0, p[2]]; if (vdot(n, vsub(p, ax)) < 0) n = vmul(n, -1); return vnrm(n); }
  /* a thick plate on a surface: S(u, v) -> [point, outward normal] over u, v in [0, 1]; th its thickness; its outline
     rounded at the corners and ragged (rough rock), its face lumpy. The rims carry the edge weight (the seams' glow) */
  function plate(B, S, nu, nv, th, seed, m, o) {
    o = o || {}; const rag = o.rag == null ? 0.07 : o.rag, round = o.round == null ? 0.22 : o.round, lump = o.lump == null ? 0.05 : o.lump, sd = seed * 7.31;
    // the plate's outline in (s, t) in [-1, 1]: corners pulled in, the rim jittered
    const map = (s, t) => { const sr = s * (1 - round * t * t), tr = t * (1 - round * s * s), j = (fbm(sd + s * 2.3 + 11, sd + t * 2.3, sd) - 0.5) * rag * 2; const k = Math.max(Math.abs(s), Math.abs(t)); return [(sr * (1 + j * k) + 1) / 2, (tr * (1 + j * k) + 1) / 2]; };
    const at = (s, t, h) => { const [u, v] = map(s, t), [p, n] = S(cl(u), cl(v)), bl = (fbm(sd + u * 4.1, v * 4.1 + sd, 3.3) - 0.5) * lump, k = Math.max(Math.abs(s), Math.abs(t)), bev = h > 0 ? 1 - 0.55 * sstep(0.82, 1, k) : 1, dh = h > 0 ? h * bev + bl : h; return vadd(p, vmul(n, dh)); };
    const edgeOf = (s, t) => sstep(0.84, 1, Math.max(Math.abs(s), Math.abs(t)));
    B.surf((u, v) => at(u * 2 - 1, v * 2 - 1, th), nu, nv, () => m, { e: (u, v) => edgeOf(u * 2 - 1, v * 2 - 1) });
    if (o.inner !== false) B.surf((u, v) => at(u * 2 - 1, v * 2 - 1, 0.004), Math.max(3, nu >> 1), Math.max(3, nv >> 1), () => o.innerM || m, { e: () => 1, flip: true });
    // the rim: round the outline from the face down to the inner side
    const ring = []; const N = 2 * (nu + nv); for (let i = 0; i < N; i++) { const q = i / N * 4; let s, t; if (q < 1) { s = q * 2 - 1; t = -1; } else if (q < 2) { s = 1; t = (q - 1) * 2 - 1; } else if (q < 3) { s = 1 - (q - 2) * 2; t = 1; } else { s = -1; t = 1 - (q - 3) * 2; } ring.push([s, t]); } ring.push(ring[0]);
    B.surf((u, v) => { const r = ring[Math.min(ring.length - 1, Math.round(u * (ring.length - 1)))]; return at(r[0], r[1], v < 0.5 ? th : 0.004); }, ring.length - 1, 1, () => o.rimM || m, { e: () => 1 });
    return B;
  }
  /* a lumpy rock tube along x from 0 to L: radius r(u) (u 0..1), squashed by sq across z; fissures are the shader's */
  function rockTube(B, L, r, m, o) { o = o || {}; const nu = o.nu || 10, nv = o.nv || 14, sd = o.seed || 0, sq = o.sq || 1;
    B.surf((u, v) => { const a = v * TAU, rr = r(u) * (1 + (fbm(u * 3.1 + sd, Math.cos(a) * 1.3 + sd, Math.sin(a) * 1.3) - 0.5) * (o.lump == null ? 0.22 : o.lump)); return [u * L, Math.cos(a) * rr, Math.sin(a) * rr * sq]; }, nu, nv, o.mf || (() => m));
    return B; }
  /* a thick plate on a tapered cylinder round x (a limb's armour): x from x0 to x1, angle a0..a1 (0 = +z, the top) */
  const cylS = (x0, x1, a0, a1, r0, r1) => (u, v) => { const x = lerp(x0, x1, v), a = lerp(a0, a1, u), r = lerp(r0, r1, v); return [[x, Math.sin(a) * r, Math.cos(a) * r], [0, Math.sin(a), Math.cos(a)]]; };
  /* a thick plate on a sphere about c (radius r): polar t0..t1 from +z, azimuth p0..p1 from +x */
  const sphS = (c, r, t0, t1, p0, p1, ry) => (u, v) => { const t = lerp(t0, t1, v), p = lerp(p0, p1, u), n = [Math.sin(t) * Math.cos(p), Math.sin(t) * Math.sin(p), Math.cos(t)]; return [[c[0] + n[0] * r, c[1] + n[1] * r * (ry || 1), c[2] + n[2] * r], vnrm([n[0], n[1] / (ry || 1), n[2]])]; };
  /* a rough faceted horn along a curve: P(u) its spine, r(u) its radius; k ridges round it (their sharp crests carry the
     edge weight: the red-hot edges), lumps and growth bands */
  function horn(B, P, r, m, o) { o = o || {}; const nu = o.nu || 18, k = o.k || 7, sd = o.seed || 0;
    const fr = u => { const a = P(Math.max(0, u - 0.01)), b = P(Math.min(1, u + 0.01)); return frameXZ(vsub(b, a), o.up || [0, 0, 1]); };
    B.surf((u, v) => { const F = fr(u), a = v * TAU, fa = (a * k / TAU) % 1, rid = 1 - Math.abs(fa - 0.5) * 2, rr = r(u) * (0.86 + 0.2 * rid + (fbm(u * 6 + sd, v * 5, sd) - 0.5) * 0.24) * (1 - 0.06 * Math.sin(u * 40)); const p = P(u); return vadd(p, vadd(vmul(F.y, Math.cos(a) * rr), vmul(F.z, Math.sin(a) * rr))); },
      nu, k * 2, () => m, { e: (u, v) => { const rid = 1 - Math.abs(((v * k) % 1) - 0.5) * 2; return Math.max(sstep(0.8, 1, rid) * (0.2 + 0.8 * u * u), sstep(0.78, 1, u)); }, a: u => 1 - u });
    return B; }
  /* a column of basalt: a hexagonal prism from z0 to z1 at (x, y), its top bevelled and tilted */
  function column(B, x, y, z0, z1, r, rot, tilt, m, sd) { const pts = []; for (let i = 0; i < 6; i++) { const a = rot + i / 6 * TAU; pts.push([Math.cos(a) * r * (0.92 + 0.16 * hash3(sd, i, 1)), Math.sin(a) * r * (0.92 + 0.16 * hash3(sd, i, 2))]); }
    const tx = Math.cos(tilt[0]) * tilt[1], ty = Math.sin(tilt[0]) * tilt[1]; B.push([1, 0, 0], [0, 1, 0], [tx, ty, 1], [x, y, z0]); B.prism(pts, 0, z1 - z0, m, { b: Math.min(0.06, r * 0.18) }); B.pop(); }

  /* ---- the spikes: big jagged shards of obsidian and basalt (dark glassy bodies, red-hot edges and tips), erupting from
     both shoulders (the largest), a ragged ridge down the spine, shorter shards on the forearms, the outer elbows, the
     knuckle backs and the knees. Fixed by seed; each list belongs to the rigid part it is baked into (part frame):
     [base, tip, radius, seed]. The outer shoulder clusters and every other spine shard (spikesB) break away with the
     outer armour in the third act; the 2D picture draws the same list ---- */
  let SPK = null;
  function spikeSet() { if (SPK) return SPK; const S = {}, Rh = (i, k) => hash3(i * 1.37 + 0.5, k * 2.11 + 0.3, 7.7);
    const add = (name, a, d, len, r, sd) => { const dn = vnrm(d); (S[name] = S[name] || []).push([a, vadd(a, vmul(dn, len)), r, sd]);
      if (Rh(sd, 9) < 0.5) { const d2 = vnrm(vadd(dn, [(Rh(sd, 10) - 0.5) * 1.3, (Rh(sd, 11) - 0.5) * 1.3, (Rh(sd, 12) - 0.5) * 0.7])), a2 = vadd(a, vmul(dn, len * 0.1)); S[name].push([a2, vadd(a2, vmul(d2, len * (0.3 + 0.28 * Rh(sd, 13)))), r * 0.62, sd + 50]); } };
    for (const s of [-1, 1]) { const sn = s < 0 ? 'L' : 'R';
      for (let i = 0; i < 7; i++) { const sd = 100 + i + (s > 0 ? 20 : 0), th = 0.15 + 0.85 * Rh(sd, 1), ph = s * Math.PI / 2 + (Rh(sd, 2) - 0.5) * 2.2, n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
        add('paulO' + sn, vmul(n, 0.72), vadd(n, [(Rh(sd, 3) - 0.5) * 0.6, s * 0.15, 0.6 + 0.6 * Rh(sd, 4)]), (0.85 + 1.0 * Rh(sd, 5)) * (i < 3 ? 1.25 : 0.75), 0.19 + 0.11 * Rh(sd, 6), sd); }
      for (let i = 0; i < 4; i++) { const sd = 150 + i + (s > 0 ? 20 : 0), th = 0.7 + 0.6 * Rh(sd, 1), ph = s * Math.PI / 2 + (Rh(sd, 2) - 0.5) * 1.8, n = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)];
        add('paulI' + sn, vmul(n, 0.6), vadd(n, [0, 0, 0.7 + 0.4 * Rh(sd, 4)]), 0.42 + 0.35 * Rh(sd, 5), 0.1 + 0.05 * Rh(sd, 6), sd); } }
    for (let i = 0; i < 9; i++) { const v = 0.3 + i * 0.075, sd = 200 + i, ph = Math.PI + (Rh(sd, 1) - 0.5) * 0.3 + (i % 2 ? 0.2 : -0.2), p = trunkPt(ph, v, 0.1), n = trunkNrm(ph, v), len = (0.55 + 0.7 * Rh(sd, 3)) * (0.55 + 0.7 * Math.sin(Math.PI * (i + 1) / 10));
      add(i % 2 ? 'spikesB' : 'back', p, vadd(n, [-0.05, 0, 0.95 + 0.35 * Rh(sd, 2)]), len * 1.15, 0.15 + 0.08 * Rh(sd, 4), sd); }
    for (let i = 0; i < 4; i++) { const sd = 300 + i, a0 = (Rh(sd, 1) - 0.5) * 1.3; add('farm', [0.25 + i * 0.34, Math.sin(a0) * 0.5, Math.cos(a0) * 0.5], [-0.5, Math.sin(a0) * 0.7, 1], 0.28 + 0.28 * Rh(sd, 2), 0.07 + 0.04 * Rh(sd, 3), sd); }
    add('farm', [0.02, 0.05, 0.34], [-1, 0.1, 0.55], 0.5, 0.1, 320);   // (the outer elbow)
    [-0.21, -0.07, 0.07, 0.21].forEach((y, i) => { add('hand', [0.4, y, 0.15], [0.35, y * 0.6, 1], 0.17 + 0.14 * Rh(400 + i, 1), 0.05, 400 + i); add('fist', [0.55, y, 0.13], [0.65, y * 0.6, 1], 0.17 + 0.14 * Rh(410 + i, 1), 0.05, 410 + i); });
    [-0.17, 0.17].forEach((y, i) => add('shin', [0.0, y, 0.48], [-0.55, y * 1.8, 1], 0.32 + 0.18 * Rh(500 + i, 1), 0.08, 500 + i));
    /* all over him: dense clusters of mixed sizes (big, medium, small chips) on the limbs, hips, flanks, chest edges, neck
       and round the horns' roots; the chest's middle is left clear for the furnace */
    const cyl = (name, n, x0, x1, a0, a1, rad, l0, l1, r0, r1, sd0, back) => { for (let i = 0; i < n; i++) { const sd = sd0 + i, x = lerp(x0, x1, (i + Rh(sd, 1)) / n), a = lerp(a0, a1, Rh(sd, 2)), big = Rh(sd, 3), k = big > 0.75 ? 1 : big > 0.35 ? 0.6 : 0.32;
      add(name, [x, Math.sin(a) * rad, Math.cos(a) * rad], [back * (0.3 + 0.4 * Rh(sd, 4)), Math.sin(a) * 1.1, Math.cos(a) * 1.1 + 0.2], lerp(l0, l1, k), lerp(r0, r1, k), sd); } };
    cyl('uarm', 7, 0.15, LU * 0.85, -1.3, 1.3, 0.44, 0.16, 0.5, 0.045, 0.09, 600, -1);
    cyl('farm', 6, 0.4, LF * 0.95, -1.5, 1.5, 0.48, 0.14, 0.42, 0.04, 0.08, 620, -1);
    cyl('farm', 3, LF * 0.9, LF * 1.0, -1.8, 1.8, 0.36, 0.1, 0.25, 0.035, 0.06, 640, -1);   // (the wrists)
    cyl('thigh', 8, 0.12, LT * 0.85, -1.6, 1.6, 0.5, 0.16, 0.5, 0.045, 0.1, 660, -1);
    cyl('shin', 7, 0.3, LSH * 0.9, -1.4, 1.4, 0.42, 0.14, 0.42, 0.04, 0.085, 680, -1);
    [-0.18, 0, 0.18].forEach((y, i) => add('hand', [0.14, y + 0.04, 0.16], [-0.3, y * 0.8, 1], 0.14 + 0.1 * Rh(700 + i, 1), 0.04, 700 + i));
    [-0.18, 0, 0.18].forEach((y, i) => add('fist', [0.16, y + 0.04, 0.17], [-0.3, y * 0.8, 1], 0.14 + 0.1 * Rh(710 + i, 1), 0.04, 710 + i));
    // the hips: clusters off the tassets' outer sides
    for (const s of [-1, 1]) for (let i = 0; i < 5; i++) { const sd = 720 + i + (s > 0 ? 10 : 0), a = s * (0.9 + 0.9 * Rh(sd, 1)), z = -0.05 - 0.35 * Rh(sd, 2), big = Rh(sd, 3), k = big > 0.7 ? 1 : big > 0.3 ? 0.6 : 0.3;
      add('pelvis', [Math.cos(a) * 0.62, Math.sin(a) * 0.78, z], [Math.cos(a) * 0.6, Math.sin(a), 0.35 - 0.2 * Rh(sd, 4)], lerp(0.14, 0.48, k), lerp(0.04, 0.1, k), sd); }
    // the flanks and ribs, the base of the neck (its sides and back): the back mesh (trunk frame)
    for (const s of [-1, 1]) for (let i = 0; i < 9; i++) { const sd = 760 + i + (s > 0 ? 20 : 0), v = 0.22 + 0.62 * Rh(sd, 1), ph = s * (1.15 + 0.85 * Rh(sd, 2)), p = trunkPt(ph, v, 0.12), n = trunkNrm(ph, v), big = Rh(sd, 3), k = big > 0.72 ? 1 : big > 0.32 ? 0.6 : 0.3;
      add('back', p, vadd(n, [-0.2, 0, 0.45 + 0.4 * Rh(sd, 4)]), lerp(0.16, 0.6, k), lerp(0.045, 0.11, k), sd); }
    for (let i = 0; i < 9; i++) { const sd = 800 + i, ph = Math.PI + (i / 8 - 0.5) * 3.6 * (Rh(sd, 5) > 0.5 ? 1 : 0.9), v = 0.9 + 0.08 * Rh(sd, 1); if (Math.cos(ph) > 0.2) continue; const p = trunkPt(ph, v, 0.14), n = trunkNrm(ph, v), k = Rh(sd, 3) > 0.6 ? 1 : 0.5;
      add('back', p, vadd(n, [0, 0, 1.0]), lerp(0.18, 0.55, k), lerp(0.05, 0.1, k), sd); }
    // the chest plates' outer edges (they break away with the plates); the pectorals' frame is their hinge
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) { const sd = 840 + i + (s > 0 ? 10 : 0), v = 0.62 + 0.3 * (i / 5), ph = s * (0.85 + 0.2 * Rh(sd, 2)), p = trunkPt(ph, v, 0.2), n = trunkNrm(ph, v), k = Rh(sd, 3) > 0.6 ? 1 : Rh(sd, 3) > 0.25 ? 0.6 : 0.3;
      add(s < 0 ? 'pecL' : 'pecR', vsub(p, PEC(s)), vadd(n, [0.1, s * 0.5, 0.5 + 0.4 * Rh(sd, 4)]), lerp(0.14, 0.45, k), lerp(0.04, 0.09, k), sd); }
    // round the horns' roots: small chips (the horns stay the head's own feature)
    for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const sd = 880 + i + (s > 0 ? 10 : 0), a = (i / 4) * TAU + Rh(sd, 1), c = [0.0, s * 0.32, 0.3], d = [Math.cos(a) * 0.8, s * 0.6 + Math.sin(a) * 0.4, 0.6]; add('head', vadd(c, vmul(vnrm(d), 0.2)), d, 0.09 + 0.09 * Rh(sd, 2), 0.035, sd); }
    return (SPK = S); }
  function shards(B, name) { for (const [a, b, r, sd] of (spikeSet()[name] || [])) { const h = hash3(sd, 1.1, 2.2); B.crystal(a, b, r, M_OBS, { n: 5 + (sd % 2), belly: 0.12 + 0.3 * h, base: 0.72 + 0.3 * hash3(sd, 3, 1), seed: sd, jit: 0.38, thin: 0.7 + 0.3 * hash3(sd, 5, 2), bend: (hash3(sd, 7, 3) - 0.5) * 0.3 }); } }

  let MESH = null, MESH_MS = 0;
  function buildMeshes() {
    const DQ = lowFx() ? 0.6 : 1, nb = () => GLM.builder(DQ), out = {}, q = n => Math.max(3, Math.round(n * DQ));
    const fin = (name, B) => { out[name] = B.done(); };
    /* ---- the trunk: molten in front and down the flanks (the furnace the plates close over), rock down the spine ---- */
    { const B = nb(); B.surf((u, v) => trunkPt(u * TAU, v), q(36), q(22), (u, v) => { const c = Math.cos(u * TAU); return c > -0.25 && v > 0.08 && v < 0.94 ? M_CORE : M_ROCK; });
      // the neck: a short thick column of rock up into the head
      B.at([0.12, 0, 2.62]); B.tube([0, 0, 0], [0.26, 0, 0.58], 0.42, 0.36, M_ROCK, { seg: q(14), cap0: 'flat', cap1: 'round' }); B.pop();
      fin('trunk', B); }
    /* ---- the plates that close over the furnace ---- */
    const TS = (p0, p1, v0, v1, lift) => (u, v) => { const ph = lerp(p0, p1, u), vv = lerp(v0, v1, v); return [trunkPt(ph, vv, lift || 0.02), trunkNrm(ph, vv)]; };
    // the pectorals: two great slabs, each built about its hinge on its outer edge (they swing open: the chest exposed)
    for (const s of [-1, 1]) { const B = nb(), hg = PEC(s); B.at(vmul(hg, -1)); plate(B, TS(s > 0 ? 0.06 : -1.08, s > 0 ? 1.08 : -0.06, 0.6, 0.9, 0.05), q(14), q(10), 0.17, 1 + s, M_PLATE, { rag: 0.1, round: 0.28 });
      plate(B, TS(s > 0 ? 0.2 : -0.86, s > 0 ? 0.86 : -0.2, 0.84, 0.97, 0.18), q(10), q(5), 0.12, 5 + s, M_PLATE, { rag: 0.12 }); B.pop(); shards(B, s < 0 ? 'pecL' : 'pecR'); fin(s < 0 ? 'pecL' : 'pecR', B); }
    // the belly: three bands of broken slabs, each band in two or three pieces, overlapping downward
    { const B = nb(); [[0.42, 0.56, [[-1.0, -0.32], [-0.36, 0.36], [0.32, 1.0]]], [0.27, 0.43, [[-0.92, -0.02], [0.02, 0.92]]], [0.12, 0.28, [[-0.86, -0.3], [-0.34, 0.34], [0.3, 0.86]]]].forEach(([v0, v1, segs], bi) => segs.forEach(([p0, p1], i) => plate(B, TS(p0, p1, v0, v1, 0.03 + bi * 0.012), q(9), q(5), 0.13, 10 + bi * 3 + i, M_PLATE, { rag: 0.14, round: 0.3 })));
      fin('abs', B); }
    // the flanks and the back: big plates, the inner armour (kept when the outer breaks away)
    { const B = nb(); for (const s of [-1, 1]) { plate(B, TS(s * 1.02, s * 1.98, 0.22, 0.62, 0.02), q(9), q(8), 0.15, 20 + s, M_PLATE, { rag: 0.12 }); plate(B, TS(s * 1.1, s * 1.9, 0.56, 0.86, 0.06), q(9), q(7), 0.14, 23 + s, M_PLATE, { rag: 0.12 }); }
      [[0.08, 0.36], [0.3, 0.6], [0.54, 0.82], [0.76, 0.98]].forEach(([v0, v1], i) => { plate(B, TS(Math.PI - 1.25, Math.PI - 0.05, v0, v1, 0.03 + i * 0.015), q(9), q(7), 0.17, 30 + i, M_PLATE, { rag: 0.12 }); plate(B, TS(Math.PI + 0.05, Math.PI + 1.25, v0 + 0.03, v1 + 0.02, 0.035 + i * 0.015), q(9), q(7), 0.17, 40 + i, M_PLATE, { rag: 0.12 }); });
      // the collar: a ring of heavy slabs round the neck's root
      for (let i = 0; i < 5; i++) { const p0 = -1.45 + i * 0.6; plate(B, TS(p0, p0 + 0.66, 0.9, 1.0, 0.06), q(6), q(4), 0.12, 50 + i, M_PLATE, { rag: 0.14 }); }
      shards(B, 'back'); fin('back', B); }
    { const B = nb(); shards(B, 'spikesB'); fin('spikesB', B); }
    /* ---- the pelvis: a block of rock under hanging slabs (the tassets) ---- */
    { const B = nb(); B.ell([0, 0, 0.0], [0.56, 0.74, 0.48], M_ROCK, { seg: q(16), rings: q(9) });
      [[-1.62, -0.52], [-0.58, 0.58], [0.52, 1.62]].forEach(([p0, p1], i) => plate(B, sphS([0.04, 0, 0.12], 0.64, 1.05, 2.35, p0, p1, 1.12), q(9), q(8), 0.12, 60 + i, M_PLATE, { rag: 0.12 }));
      shards(B, 'pelvis'); fin('pelvis', B); }
    /* ---- the shoulders: an inner shell and an outer slab over each (built about the shoulder joint) ---- */
    for (const s of [-1, 1]) { const sn = s < 0 ? 'L' : 'R', B = nb(), Bo = nb();
      B.sph([0, 0, 0], 0.5, M_ROCK, q(14));
      plate(B, sphS([0, 0, 0], 0.55, 0.15, 1.45, s * Math.PI / 2 - 1.5, s * Math.PI / 2 + 1.5), q(12), q(9), 0.11, 70 + s, M_PLATE, { rag: 0.1 });
      // the outer pauldron: two stacked slabs, the heat venting between them (the shoulder's fire)
      plate(Bo, sphS([0, s * 0.08, 0.02], 0.62, 0.0, 1.2, s * Math.PI / 2 - 1.6, s * Math.PI / 2 + 1.6, 1.05), q(14), q(9), 0.15, 74 + s, M_PLATE, { rag: 0.14, round: 0.3 });
      plate(Bo, sphS([0, s * 0.1, -0.1], 0.68, 1.0, 1.7, s * Math.PI / 2 - 1.2, s * Math.PI / 2 + 1.2, 1.05), q(12), q(6), 0.13, 77 + s, M_PLATE, { rag: 0.14 });
      shards(B, 'paulI' + sn); shards(Bo, 'paulO' + sn); fin('paulI' + sn, B); fin('paulO' + sn, Bo); }
    /* ---- the limbs: thick lumpy stone with plates on the outside ---- */
    { const B = nb(); rockTube(B, LU, u => 0.36 + 0.07 * Math.sin(u * Math.PI) - 0.05 * u, M_ROCK, { seed: 1, nu: q(9), nv: q(14) }); B.sph([LU, 0, 0], 0.33, M_ROCK, q(12));
      plate(B, cylS(0.05, LU * 0.7, -1.1, 1.1, 0.44, 0.41), q(9), q(7), 0.1, 80, M_PLATE, { rag: 0.12 }); shards(B, 'uarm'); fin('uarm', B); }
    { const B = nb(); rockTube(B, LF, u => 0.38 + 0.1 * Math.sin(u * Math.PI * 0.8) - 0.1 * u, M_ROCK, { seed: 2, nu: q(10), nv: q(14) });
      // the vambraces: three heavy overlapping slabs up the outside of the forearm
      for (let i = 0; i < 3; i++) plate(B, cylS(0.08 + i * 0.44, 0.6 + i * 0.44, -1.4 + i * 0.1, 1.2 - i * 0.05, 0.5 - i * 0.03, 0.46 - i * 0.04), q(9), q(6), 0.1, 82 + i, M_PLATE, { rag: 0.14 });
      shards(B, 'farm'); fin('farm', B); }
    { const B = nb(); rockTube(B, LT, u => 0.47 - 0.1 * u + 0.05 * Math.sin(u * Math.PI), M_ROCK, { seed: 3, nu: q(9), nv: q(14) }); B.sph([LT, 0, 0], 0.38, M_ROCK, q(12));
      plate(B, cylS(0.1, LT * 0.75, -1.3, 1.3, 0.53, 0.45), q(9), q(7), 0.11, 86, M_PLATE, { rag: 0.12 }); shards(B, 'thigh'); fin('thigh', B); }
    { const B = nb(); rockTube(B, LSH, u => 0.4 - 0.1 * u, M_ROCK, { seed: 4, nu: q(9), nv: q(14) });
      plate(B, sphS([0.02, 0, 0.1], 0.42, 0.0, 1.4, -1.4, 1.4), q(9), q(7), 0.12, 88, M_PLATE, { rag: 0.12 });   // the knee cap
      plate(B, cylS(0.25, LSH * 0.95, -1.15, 1.15, 0.44, 0.34), q(9), q(7), 0.1, 89, M_PLATE, { rag: 0.12 }); shards(B, 'shin'); fin('shin', B); }
    /* the foot: a heavy wedge of rock, three toes with obsidian claws (frame: x forward, the ankle at the origin) */
    { const B = nb(); B.box([0.18, 0, -0.1], [0.42, 0.34, 0.16], 0.1, M_ROCK); B.sph([0, 0, 0], 0.3, M_ROCK, q(10));
      for (const y of [-0.22, 0, 0.22]) { B.tube([0.4, y, -0.16], [0.72, y * 1.2, -0.2], 0.12, 0.09, M_ROCK, { seg: q(8) }); B.spike([0.7, y * 1.2, -0.2], [0.98, y * 1.3, -0.24], 0.085, M_CLAW, { seg: 5 }); }
      fin('foot', B); }
    /* the hands (frame: x out of the wrist, z the back of the hand, y across): open (claws spread, for planting and
       sweeping) and a fist (the Titan Fist). Built big: these are the hands that break the platform */
    const finger = (B, base, dirs, rs, claw) => { let p = base; dirs.forEach((d, i) => { const q2 = vadd(p, d); B.tube(p, q2, rs[i], rs[i + 1], M_ROCK, { seg: 7, cap0: 'round', cap1: 'round' }); p = q2; }); const dl = vnrm(dirs[dirs.length - 1]); B.spike(vsub(p, vmul(dl, 0.04)), vadd(p, vmul(dl, claw)), rs[rs.length - 1] * 0.95, M_CLAW, { seg: 5 }); };
    { const B = nb(); B.box([0.22, 0, 0], [0.26, 0.3, 0.13], 0.08, M_ROCK); plate(B, (u, v) => [[lerp(0.02, 0.44, v), lerp(-0.27, 0.27, u), 0.13], [0, 0, 1]], q(6), q(5), 0.06, 91, M_PLATE, { rag: 0.18, inner: false });
      [-0.21, -0.07, 0.07, 0.21].forEach((y, i) => finger(B, [0.45, y, 0], [[0.2, y * 0.25, -0.04], [0.18, y * 0.2, -0.12], [0.12, 0, -0.14]], [0.085, 0.08, 0.07, 0.06], 0.2 - 0.02 * Math.abs(i - 1.5)));
      finger(B, [0.12, -0.3, -0.04], [[0.12, -0.16, -0.06], [0.14, -0.08, -0.08]], [0.09, 0.08, 0.07], 0.16);
      shards(B, 'hand'); fin('hand', B); }
    { const B = nb(); B.box([0.22, 0, 0], [0.26, 0.3, 0.14], 0.08, M_ROCK); plate(B, (u, v) => [[lerp(0.02, 0.44, v), lerp(-0.28, 0.28, u), 0.14], [0, 0, 1]], q(6), q(5), 0.07, 92, M_PLATE, { rag: 0.18, inner: false });
      // the curled fingers: a row of knuckles, the claws turned in under the fist
      [-0.21, -0.07, 0.07, 0.21].forEach(y => { B.tube([0.46, y, 0.04], [0.6, y, -0.02], 0.1, 0.095, M_ROCK, { seg: 7 }); B.tube([0.6, y, -0.02], [0.52, y, -0.2], 0.095, 0.085, M_ROCK, { seg: 7 }); B.spike([0.48, y, -0.21], [0.3, y, -0.23], 0.07, M_CLAW, { seg: 5 }); });
      B.box([0.62, 0, 0.0], [0.07, 0.3, 0.1], 0.05, M_PLATE);   // (the knuckle ridge: the striking face)
      finger(B, [0.12, -0.3, -0.04], [[0.14, -0.06, -0.12], [0.18, 0.12, -0.04]], [0.09, 0.08, 0.07], 0.12);
      shards(B, 'fist'); fin('fist', B); }
    /* ---- the head: a heavy blunt skull of plates, the brow a ledge over two deep slits of light; the jaw a separate slab
       (the mouth's heat between them); two thick rough obsidian horns rising from the temples, curving forward ---- */
    { const B = nb();
      B.ell([0.0, 0, 0.1], [0.46, 0.42, 0.42], M_ROCK, { seg: q(16), rings: q(10) });
      B.box([0.24, 0, -0.06], [0.24, 0.3, 0.16], 0.08, M_ROCK);   // (the face's block: cheekbones and muzzle)
      // the eyes: two slits of molten light set deep under the brow
      for (const s of [-1, 1]) { B.push([0.95, s * 0.3, 0.1], [-s * 0.3, 0.95, 0.06], [0, 0, 1], [0.44, s * 0.17, 0.1]); B.box([0, 0, 0], [0.05, 0.11, 0.035], 0.02, M_LAVA); B.pop(); }
      // the brow: a ledge of slab across the front, the crown plates behind it
      plate(B, sphS([0.0, 0, 0.1], 0.5, 0.75, 1.32, -1.25, 1.25, 0.92), q(12), q(5), 0.13, 100, M_PLATE, { rag: 0.12, round: 0.15 });
      plate(B, sphS([-0.04, 0, 0.12], 0.46, 0.0, 0.8, -2.6, 2.6, 0.95), q(12), q(6), 0.1, 101, M_PLATE, { rag: 0.14 });
      for (const s of [-1, 1]) plate(B, sphS([0.12, 0, -0.04], 0.44, 1.35, 2.05, s > 0 ? 0.3 : -1.25, s > 0 ? 1.25 : -0.3, 0.95), q(7), q(5), 0.09, 102 + s, M_PLATE, { rag: 0.14 });   // (the cheek plates)
      B.box([0.47, 0, -0.04], [0.08, 0.1, 0.1], 0.05, M_PLATE);   // (a blunt nose ridge)
      // the mouth's glow behind the jaw line: a deep slot of lava
      B.box([0.3, 0, -0.24], [0.16, 0.24, 0.05], 0.03, M_LAVA);
      // the horns
      for (const s of [-1, 1]) { const P = u => { const a = [0.0, s * 0.3, 0.3], b = [-0.06, s * 0.8, 0.62], c = [0.0, s * 1.02, 1.45], d = [0.24, s * 0.86, 2.0]; const w = 1 - u; return [w * w * w * a[0] + 3 * w * w * u * b[0] + 3 * w * u * u * c[0] + u * u * u * d[0], w * w * w * a[1] + 3 * w * w * u * b[1] + 3 * w * u * u * c[1] + u * u * u * d[1], w * w * w * a[2] + 3 * w * w * u * b[2] + 3 * w * u * u * c[2] + u * u * u * d[2]]; };
        horn(B, P, u => 0.3 * Math.pow(1 - u, 0.72) + 0.012, M_OBS, { nu: q(22), k: 7, seed: s + 3 });
        plate(B, sphS([0.02, s * 0.32, 0.3], 0.25, 0.3, 1.6, -Math.PI, Math.PI), q(8), q(5), 0.06, 110 + s, M_PLATE, { rag: 0.2 }); }   // (the rough collar the horn grows from)
      shards(B, 'head'); fin('head', B); }
    { const B = nb(); B.box([0.2, 0, -0.08], [0.26, 0.3, 0.1], 0.06, M_ROCK); plate(B, (u, v) => [[lerp(-0.04, 0.48, v), lerp(-0.3, 0.3, u), -0.18], [0, 0, -1]], q(7), q(5), 0.07, 120, M_PLATE, { rag: 0.16, inner: false });
      plate(B, (u, v) => [[0.47, lerp(-0.26, 0.26, u), lerp(-0.2, 0.02, v)], [1, 0, 0]], q(6), q(4), 0.06, 121, M_PLATE, { rag: 0.18, inner: false });   // (the chin's slab)
      B.box([0.24, 0, 0.0], [0.16, 0.22, 0.03], 0.02, M_LAVA);   // (the jaw's own glowing floor of the mouth)
      fin('jaw', B); }
    /* ---- the throne: a broken mass of basalt columns, a low seat and a tall back, almost one with the rock ---- */
    { const B = nb(); let sd = 1;
      const rnd = () => hash3(sd++, 3.3, 7.7);
      // the back: tall columns in a curved rank
      for (let i = 0; i < 9; i++) { const a = -0.95 + i / 8 * 1.9, R = 1.75 + rnd() * 0.15, x = -Math.cos(a) * R * 0.75 - 0.35, y = Math.sin(a) * R * 1.05, h = 3.0 + 2.2 * Math.cos(a * 1.4) + rnd() * 0.6; column(B, x, y, 0, h, 0.34 + rnd() * 0.06, rnd() * 1, [rnd() * TAU, 0.06], M_THRONE, sd); }
      // the seat: shorter columns, their tops the seat
      for (let i = 0; i < 6; i++) { const x = -0.2 + (i % 2) * 0.55, y = -0.75 + Math.floor(i / 2) * 0.75; column(B, x, y, 0, 1.38 + rnd() * 0.12, 0.38, rnd(), [rnd() * TAU, 0.04], M_THRONE, sd); }
      // the arms: two stout columns each side
      for (const s of [-1, 1]) { column(B, 0.35, s * 1.45, 0, 1.95, 0.36, rnd(), [s, 0.05], M_THRONE, sd); column(B, -0.3, s * 1.55, 0, 2.3, 0.33, rnd(), [s, 0.04], M_THRONE, sd); }
      // rubble round its foot
      for (let i = 0; i < 10; i++) { const a = rnd() * TAU, d = 1.9 + rnd() * 0.9, x = Math.cos(a) * d * 0.8, y = Math.sin(a) * d; column(B, x, y, 0, 0.25 + rnd() * 0.4, 0.2 + rnd() * 0.15, rnd(), [rnd() * TAU, 0.3], M_THRONE, sd); }
      fin('throne', B); }
    /* ---- a black-fire crystal growth: a cluster of long faceted shards from a rough base ---- */
    { const B = nb(); B.ell([0, 0, 0.0], [0.95, 0.85, 0.35], M_THRONE, { seg: q(14), rings: q(6), th1: Math.PI / 2 });
      const sh = [[0, 0, 3.2, 0.42, 0], [0.45, 0.3, 2.2, 0.3, 0.32], [-0.4, 0.35, 2.4, 0.32, -0.3], [0.2, -0.45, 1.9, 0.28, 0.4], [-0.35, -0.3, 1.6, 0.26, -0.45], [0.6, -0.1, 1.2, 0.2, 0.6], [-0.6, 0.0, 1.35, 0.22, -0.65]];
      sh.forEach(([x, y, h, r, lean], i) => { const tip = [x + Math.sin(lean) * h * 0.45, y + Math.sin(lean * 0.6 + i) * h * 0.18, h]; B.crystal([x * 0.6, y * 0.6, -0.1], tip, r, M_OBS, { n: 6, belly: 0.35, base: 0.8, seed: i + 1, jit: 0.18 }); });
      fin('crystal', B); }
    { const B = nb(); B.ell([0, 0, 0.0], [0.95, 0.85, 0.35], M_THRONE, { seg: q(14), rings: q(6), th1: Math.PI / 2 });
      [[0, 0, 0.9, 0.42], [0.45, 0.3, 0.6, 0.3], [-0.4, 0.35, 0.75, 0.32], [0.2, -0.45, 0.5, 0.28], [-0.35, -0.3, 0.45, 0.26]].forEach(([x, y, h, r], i) => B.crystal([x * 0.6, y * 0.6, -0.1], [x * 0.7 + 0.1, y * 0.7, h], r, M_OBS, { n: 6, belly: 0.7, base: 0.85, seed: i + 7, jit: 0.3 }));
      fin('crystalBroken', B); }
    return out;
  }

  /* ================= the pose ================= */
  /* channels (all 0..1 unless said): sit (on the throne), crouch, kneel (one knee down: the overheat, the statue), plant
     (both hands driven into the platform: Hellfire), lean (rad, the torso bowed forward), twist (rad), liftL / liftR (an
     arm raised high: the Titan Fist's wind-up), slamL / slamR (that fist driven to the floor at slamX, slamY: body
     frame), fistL / fistR (the hand closed), cleaveW (the right arm drawn back across the body), cleaveS (its sweep,
     0 .. 1 left to right), breath (the head thrust forward, the claws up), jaw, inhale (the chest swells, its light),
     open (the pectorals swing apart: the core exposed), gait (strides, turns) and gaitK, look (rad, the head's yaw),
     nod (rad), shout (the head thrown back, the arms wide: a roar), recoil (and recoilS, the side struck), heat (the
     core's light: 0.5 idle, 1 bright), flare (the horns), bfL / bfR (the blackfire in each side's armour), frac (the
     outer armour breaking away: 0 whole, 1 gone), cracks (glowing cracks across the outer plates before they go),
     dead (0 .. 1 cooling to a dark statue), alpha.
     The motion (v387): aim (rad, the torso turned ahead of the hips toward what he means to strike), tilt (rad, the head
     cocked as he studies the pet), arch (the back bowed, the head thrown up: Hellfire's roar), drop (the hips sinking as
     a foot takes his weight), shift (-1..1, the weight over the right / left foot), swing (-1..1, the arms' swing with the
     stride), menace (0..1: the idle's shoulder roll and claw flex), claw (0..1 the claws curled), drag (the right hand
     trailing along the floor: the third act's prowl), cleaveR (the cleave's arm drawn back in after its follow-through),
     fL / fR ([x, y, lift, yaw] each foot in the body frame, planted on the floor by the fight's stepping) */
  const CH = ['sit', 'crouch', 'kneel', 'plant', 'lean', 'twist', 'liftL', 'liftR', 'slamL', 'slamR', 'fistL', 'fistR', 'cleaveW', 'cleaveS', 'breath', 'jaw', 'inhale', 'open', 'gaitK', 'look', 'nod', 'shout', 'recoil', 'heat', 'flare', 'bfL', 'bfR', 'frac', 'cracks', 'dead', 'aim', 'tilt', 'arch', 'drop', 'shift', 'swing', 'menace', 'claw', 'drag', 'cleaveR', 'sway'];
  function blankPose() { const P = { alpha: 1, gait: 0, slamX: 2.9, slamY: 0, recoilS: 1 }; for (const k of CH) P[k] = 0; P.heat = 0.6; return P; }
  /* debris: where each outer plate flies as the armour breaks (body frame, per tile of its own): out, up, a tumble */
  const FLY = { pecL: [[1.6, -1.2, 1.4], [0.6, 1.0, 0.3]], pecR: [[1.6, 1.2, 1.2], [-0.5, 1.0, -0.4]], abs: [[1.8, 0.2, 0.6], [0.3, 1.2, 0.2]], paulOL: [[-0.2, -1.9, 1.6], [1.1, 0.2, 0.6]], paulOR: [[0.2, 1.9, 1.8], [-1.0, 0.3, -0.5]], spikesB: [[-1.7, 0.3, 1.5], [0.4, 1.0, 0.2]] };
  function rig(P, t) {
    const inst = [], A = {}, dead = cl(P.dead || 0), live = 1 - dead;
    const I = (name, part, R, o, ex) => { const it = { name, part, R, o, s: 1, al: 1, glow: 0, glow2: 0, spill: 0, kind: 0 }; if (ex) Object.assign(it, ex); inst.push(it); return it; };
    const br = Math.sin(t * 1.25) * live, br2 = Math.sin(t * 0.61 + 1) * live;
    const sit = ease(P.sit || 0), kn = ease(P.kneel || 0), pl = ease(P.plant || 0), cr = P.crouch || 0, sl = Math.max(P.slamL || 0, P.slamR || 0), lift = Math.max(P.liftL || 0, P.liftR || 0), sh = ease(P.shout || 0), rc = (P.recoil || 0) * (P.recoilS || 1);
    const gk = (P.gaitK || 0) * (1 - sit) * (1 - kn) * (1 - pl), planted = !!P.fL, gph = (P.gait || 0) * TAU;
    // (planted feet: the stride's swing and weight come from the stepping; else, for the art poses, a stride of its own)
    const swing = planted ? (P.swing || 0) : Math.sin(gph) * gk, shift = planted ? (P.shift || 0) : 0, drop = P.drop || 0, arch = P.arch || 0, men = (P.menace || 0) * live;
    /* the pelvis and the torso */
    // (a far blow: the whole body lunges after the fist, the hips thrown forward, the torso bowed over it, so the knuckles meet the marked spot)
    const reachK = sl * cl(((P.slamX == null ? 2.9 : P.slamX) - 1.4) / 2.0);
    let hz = HZ - 0.34 * cr - 0.3 * sl - 0.28 * reachK - (planted ? 0.15 * drop : 0.05 * Math.abs(Math.sin(gph)) * gk * 2) + 0.16 * lift;
    hz = lerp(hz, 1.62, sit); hz = lerp(hz, 1.5, kn); hz = lerp(hz, 1.85, pl);
    const sway = P.sway || 0, P0 = [lerp(0, -0.32, sit) + 0.18 * pl - 0.1 * kn + 1.2 * reachK - 0.25 * lift + (planted ? 0 : 0.04 * Math.sin(gph * 2) * gk), (planted ? 0.13 * shift : 0.05 * Math.sin(gph) * gk) + 0.14 * sway, hz + 0.02 * br - 0.04 * Math.abs(sway)];
    const tw = (P.twist || 0) + (P.aim || 0) + 0.1 * swing - 0.18 * rc;
    const pitch = (P.lean || 0) + 0.7 * pl + 0.42 * kn - 0.14 * sit + 0.025 * br + 0.42 * sl + 0.5 * reachK - 0.16 * lift - 0.32 * sh + 0.1 * (P.breath || 0) + 0.06 * gk - 0.12 * Math.abs(rc) + 0.06 * (P.cleaveS > 0 ? Math.sin(P.cleaveS * Math.PI) : 0) - 0.4 * arch + 0.04 * drop;
    const roll = 0.05 * swing + 0.07 * shift + 0.06 * sway + 0.08 * rc + 0.1 * kn;
    const Rp = rotZ((P.twist || 0) * 0.35 + (P.aim || 0) * 0.3 + 0.06 * swing), Rt = mm(rotZ(tw), mm(rotX(roll), rotY(pitch)));
    const ts = 1 + 0.045 * (P.inhale || 0) + 0.006 * br;
    const toT = p => vadd(P0, mv(Rt, vmul(p, ts)));
    const heat = Math.max(0, (P.heat == null ? 0.6 : P.heat)) * live, core = heat * (1 + 0.55 * (P.inhale || 0) + 0.35 * (P.open || 0)) * (1 + 0.06 * br);
    const bfL = cl(P.bfL || 0) * live, bfR = cl(P.bfR || 0) * live, bfM = (bfL + bfR) / 2, cracks = cl(P.cracks || 0), frac = cl(P.frac || 0), flare = cl(P.flare || 0) * live;
    const plateEx = (side) => ({ glow: heat, glow2: cracks, spill: side < 0 ? bfL : side > 0 ? bfR : bfM, fx: dead });
    /* the outer armour flying off (frac): each outer piece flung out and tumbling, gone by the end */
    const fly = (name, R, o) => { if (frac <= 0) return { R, o, al: 1 }; const F = FLY[name], f = ease(frac), tt = frac * 1.2; if (frac >= 1) return null;
      const d = vadd(vmul(F[0], tt), [0, 0, -2.2 * tt * tt]); return { R: mm(rotAxis(F[1], tt * 2.6), R), o: vadd(o, d), al: 1 - sstep(0.6, 1, f) }; };
    I('trunk', 'trunk', Rt, P0, { s: ts, glow: core, glow2: 0, spill: bfM, fx: dead });
    I('back', 'back', Rt, P0, Object.assign({ s: ts }, plateEx(0)));
    { const q = fly('spikesB', Rt, P0); if (q) I('spikesB', 'spikesB', q.R, q.o, Object.assign({ s: ts, al: q.al }, plateEx(0))); }
    { const q = fly('abs', Rt, P0); if (q) I('abs', 'abs', q.R, q.o, Object.assign({ s: ts, al: q.al }, plateEx(0))); }
    for (const s of [-1, 1]) { const sn = s < 0 ? 'L' : 'R', op = ease(P.open || 0), R0 = mm(Rt, mm(rotZ(s * op * 0.62), rotX(s * op * 0.18))), o0 = toT(PEC(s)), q = fly('pec' + sn, R0, o0); if (q) I('pec' + sn, 'pec' + sn, q.R, q.o, Object.assign({ s: ts, al: q.al }, plateEx(s))); }
    I('pelvis', 'pelvis', Rp, vsub(P0, [0, 0, 0.02]), Object.assign({}, plateEx(0)));
    A.core = toT([0.7, 0, 1.6]); A.chest = toT([0.85, 0, 1.7]); A.pelvis = P0;
    /* the head */
    const N = toT(NECK), Hh = toT(HEAD), look = P.look || 0, nod = (P.nod || 0) - pitch * 0.62 - sh * 0.55 + 0.22 * (P.breath || 0) - 0.08 * (P.inhale || 0) + 0.03 * br2 + 0.25 * kn * dead - 0.3 * arch;
    const Rh = mm(Rt, mm(rotZ(look), mm(rotX(P.tilt || 0), rotY(nod))));
    I('head', 'head', Rh, Hh, { s: HS, glow: heat * (1 + 0.3 * (P.breath || 0)), glow2: flare, spill: bfM, fx: dead, kind: 2 });
    const jaw = cl((P.jaw || 0) + 0.08 * Math.max(0, br) * live), Rj = mm(Rh, rotY(jaw * 0.5)), Jo = vadd(Hh, mv(Rh, vmul([0.06, 0, -0.14], HS)));
    I('jaw', 'jaw', Rj, Jo, { s: HS, glow: heat * (1 + 0.8 * jaw), fx: dead });
    A.head = Hh; A.mouth = vadd(Jo, mv(Rh, vmul([0.52, 0, -0.08], HS))); A.mouthDir = mv(Rh, [1, 0, -0.15]);
    for (const s of [-1, 1]) { A[s < 0 ? 'eyeL' : 'eyeR'] = vadd(Hh, mv(Rh, vmul([0.5, s * 0.17, 0.1], HS))); A[s < 0 ? 'hornL' : 'hornR'] = vadd(Hh, mv(Rh, vmul([0.24, s * 0.86, 2.0], HS))); }
    A.neck = N;
    /* the arms */
    for (const s of [-1, 1]) { const sn = s < 0 ? 'L' : 'R', roll2 = men * Math.sin(t * 0.85 + (s > 0 ? 0 : 2.2)), S = toT(vadd(SH(s), [0.13 * roll2, 0, 0.13 * roll2 + 0.05 * men + 0.1 * (P.inhale || 0)]));
      // where the hand goes: blended from the poses, in the body frame (x forward); the arms swing against the stride
      const sw = s * swing;
      let h = [0.5 + 0.06 * br2 + 0.42 * sw * gk + 0.08 * roll2, s * 1.58, 1.82 + 0.05 * br + 0.12 * Math.abs(sw) * gk];
      if (s > 0) h = vlerp(h, [1.05, 1.62, 0.25], cl(P.drag || 0));
      h = vlerp(h, [1.15, s * 1.3, 3.0], cl(P.breath || 0));
      h = vlerp(h, [0.5, s * 1.55, 2.05], sit);
      h = vlerp(h, [0.55, s * 2.5, 4.6], sh);
      h = vlerp(h, s < 0 ? [1.5, -1.15, 0.26] : [1.0, 0.7, 1.75], kn);
      h = vlerp(h, [2.3, s * 0.95, 0.24], pl);
      const lf = ease(s < 0 ? P.liftL || 0 : P.liftR || 0), sm = ease(s < 0 ? P.slamL || 0 : P.slamR || 0);
      h = vlerp(h, [0.35, s * 1.55, 7.5], lf);
      h = vlerp(h, [P.slamX == null ? 2.9 : P.slamX, (P.slamY || 0) + s * 0.25, 0.42], sm);
      if (s > 0 && (P.cleaveW > 0 || P.cleaveS > 0)) { const w = ease(P.cleaveW || 0), u = cl(P.cleaveS || 0), a = lerp(-1.95, 1.65, ease(u)), sw = [Math.cos(a) * 2.9, Math.sin(a) * 2.9, 1.3 + 0.4 * Math.sin(u * Math.PI)];
        h = vlerp(h, [-0.55, -1.75, 4.6], w * (1 - sstep(0, 0.15, u)) * (1 - cl(P.cleaveR || 0))); if (u > 0) h = vlerp(h, sw, sstep(0, 0.12, u) * (1 - sstep(0.92, 1, u) * 0.3) * (1 - ease(cl(P.cleaveR || 0)))); }
      // claws spread when the hand is open; the fist for the slam
      const fist = cl((s < 0 ? P.fistL : P.fistR) || 0);
      const pole = vadd([-0.7, s * 1.0, -0.25], [0, 0, lf * 0.6]), J = ik2(S, h, LU, LF, mv(Rt, pole)); const E = J.E, W = J.W;
      const ud = vsub(E, S), fd = vsub(W, E), out = mv(Rt, [0, s, 0]);
      I('uarm' + sn, 'uarm', frameXZ(ud, vadd(out, [0, 0, 0.4])), S, { glow: heat, spill: s < 0 ? bfL : bfR, fx: dead });
      I('farm' + sn, 'farm', frameXZ(fd, vadd(mv(Rt, [-0.5, s, 0.25]), [0, 0, 0.1])), E, { glow: heat, spill: s < 0 ? bfL : bfR, fx: dead });
      const hz2 = sm > 0.5 ? vadd(mv(Rt, [0.6, 0, 0.6]), [0, 0, 0]) : vadd(out, [0, 0, 0.35 + 0.5 * pl]);
      const flex = (cl(P.claw || 0) * 0.6 + men * 0.32 * Math.sin(t * 1.6 + s * 1.3)) * (fist > 0.5 ? 0 : 1);   // (the claws curl and flex: the hand bent at the wrist)
      I('hand' + sn, fist > 0.5 ? 'fist' : 'hand', mm(frameXZ(fd, hz2), rotY(flex)), W, { glow: heat, spill: s < 0 ? bfL : bfR, fx: dead });
      A['hand' + sn] = vadd(W, vmul(vnrm(fd), 0.5)); A['wrist' + sn] = W; A['elbow' + sn] = E; A['sh' + sn] = S;
      // the shoulder: the inner shell turns a little with the arm, the outer slab rides on it
      const Rs = Rt;
      I('paulI' + sn, 'paulI' + sn, Rs, S, Object.assign({}, plateEx(s)));
      { const up = sstep(0, 1, lf) * 0.5, Ro = mm(Rs, rotX(-s * up * 0.5)), q = fly('paulO' + sn, Ro, vadd(S, mv(Rt, [0, s * 0.04, 0.05 + up * 0.15]))); if (q) I('paulO' + sn, 'paulO' + sn, q.R, q.o, Object.assign({ al: q.al }, plateEx(s))); }
      A['vent' + sn] = vadd(S, mv(Rt, [-0.05, s * 0.35, 0.72]));
    }
    /* the legs */
    for (const s of [-1, 1]) { const sn = s < 0 ? 'L' : 'R', Hp = vadd(P0, mv(Rp, HIP(s))), g = gph + (s > 0 ? Math.PI : 0);
      const PF = s < 0 ? P.fL : P.fR;
      let f = PF ? [PF[0], PF[1], 0.3 + PF[2]] : [0.12 + 0.6 * gk * Math.sin(g), s * (0.84 + 0.14 * cr), 0.3 + 0.32 * gk * Math.max(0, Math.cos(g))];
      f = vlerp(f, [1.15, s * 0.85, 0.3], sit);
      f = vlerp(f, s < 0 ? [-1.2, -0.7, 0.32] : [0.9, 0.86, 0.3], kn);
      f = vlerp(f, [-0.45, s * 1.1, 0.3], pl);
      const J = ik2(Hp, f, LT, LSH, [1, s * 0.25, 0.1]), K = J.E, An = J.W;
      I('thigh' + sn, 'thigh', frameXZ(vsub(K, Hp), [1, 0, 0.3]), Hp, { glow: heat, spill: s < 0 ? bfL : bfR, fx: dead });
      I('shin' + sn, 'shin', frameXZ(vsub(An, K), [1, 0, 0.2]), K, { glow: heat, spill: s < 0 ? bfL : bfR, fx: dead });
      const fy = PF ? lerp(PF[3] || 0, s * 0.14, Math.max(sit, kn, pl)) : s * 0.14, fp = PF ? 0.6 * Math.min(0.35, PF[2]) : 0;   // (a lifted foot's toes hang a little)
      I('foot' + sn, 'foot', mm(rotZ(fy), rotY(fp)), An, { glow: heat, fx: dead });
      A['foot' + sn] = An; A['knee' + sn] = K; }
    A.top = vadd(Hh, mv(Rh, [0.4, 0, 1.3]));
    return { inst, A, P0, Rt, heat, core };
  }

  /* ================= drawing ================= */
  const CW = [0, VY, VZ], EXW = [1, 0, 0];
  const LW = vnrm([-0.45, 0.42, 0.78]), SBW = vnrm([-0.2, -0.38, 0.9]), RIMW = vnrm([0.4, -0.8, 0.45]), UPW = [0, 0, 1];
  /* the view of one draw: the model's frame -> the world (heading a, in the model's own angle) -> the screen */
  function mkView(x, y, z, a, o) {
    const T = o.T, sc = (o.scale || 1) * VIS, k = T * sc, Rh = rotZ(a), X0 = o.sx(x), Y0 = o.sy(y) - z * ZK * T;
    const toS = p => { const w = mv(Rh, p); return [X0 + w[0] * k, Y0 + (w[1] * GY - w[2] * ZK) * k]; };
    const toW = p => { const w = mv(Rh, p); return { x: x + w[0] * sc, y: y + w[1] * GY * sc, z: z + w[2] * sc }; };
    const depth = p => vdot(mv(Rh, p), CW);
    return { T, sc, k, Rh, toS, toW, depth, x, y, z, a };
  }
  /* the world's floor angle -> the model's heading (the model's y is foreshortened by GY on the floor) and back */
  const headOf = th => Math.atan2(Math.sin(th) / GY, Math.cos(th));
  const floorAng = a => Math.atan2(Math.sin(a) * GY, Math.cos(a));
  /* a world floor point -> the body frame (x forward) of a model at (x, y) with heading a */
  function toBody(wx, wy, x, y, a, sc) { sc = (sc || 1) * VIS; const dx = (wx - x) / sc, dy = (wy - y) / (GY * sc), c = Math.cos(a), s = Math.sin(a); return [dx * c + dy * s, -dx * s + dy * c]; }
  const PARTB = {};   // each mesh's bounding sphere (its own frame): [centre, radius]
  function bounds(name) { let b = PARTB[name]; if (b) return b; const M = MESH && MESH[name]; if (!M) return [[0, 0, 0], 1.2]; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9; const p = M.pos;
    for (let i = 0; i < p.length; i += 3) { x0 = Math.min(x0, p[i]); x1 = Math.max(x1, p[i]); y0 = Math.min(y0, p[i + 1]); y1 = Math.max(y1, p[i + 1]); z0 = Math.min(z0, p[i + 2]); z1 = Math.max(z1, p[i + 2]); }
    const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], r = hyp3(x1 - x0, y1 - y0, z1 - z0) / 2; return (PARTB[name] = [c, r]); }
  let NOGL = false, GLFAIL = 0, GLRETRY = 0, GLLAST = 0, GLMS = 0, GLN = 0, GLBOX = null; const GLI = [], GLJ = [], OCC = new Float32Array(48);
  const glFail = () => { const t = nowMs(); if (t - GLLAST > 20000) GLFAIL = 0; GLLAST = t; GLFAIL++; if (GLFAIL >= 3) NOGL = true; else GLRETRY = t + 1500; };
  const glOn = () => { if (NOGL || (GLRETRY && nowMs() < GLRETRY) || typeof GLM === 'undefined' || !GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__IFRIT_GL)) return false;
    if (!MESH) { try { const t0 = nowMs(); MESH = buildMeshes(); MESH_MS = nowMs() - t0; } catch (e) { NOGL = true; if (typeof console !== 'undefined') console.warn('Ifrit: meshes', e); return false; } } return true; };
  const GLCAP = 1700, RIMC = [1.5, 0.5, 0.16], AMBC = [1, 1, 1], OUTC = [0.035, 0.012, 0.01];
  /* one GPU pass: the parts in list (each { part, R, o, s, al, glow, glow2, spill, kind, fx }) drawn into the box round them */
  function glPass(c, V, list, al0, o) {
    const k = V.k, X0 = V.toS([0, 0, 0]), PX = EXW, PY = [0, GY, -ZK], PD = CW;
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const [bc, br] = bounds(it.part), rr = br * it.s * 1.05 * k, w = mv(V.Rh, vadd(it.o, mv(it.R, vmul(bc, it.s)))), sx = X0[0] + vdot(w, PX) * k, sy = X0[1] + vdot(w, PY) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr < by0) by0 = sy - rr; if (sy + rr > by1) by1 = sy + rr; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !(typeof window !== 'undefined' && window.__IFRIT_GLHQ), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0[0] - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (X0[1] - by0) / bh], v: PD, lk: LW, ls: SBW, lr: RIMW, up: UPW, low: o.low != null ? o.low : lowFx(), rim: RIMC, amb: AMBC, t: o.t || 0,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.2 * (W / bw)), outlineCol: OUTC };
    if (o.occ && o.occ.length) { let n2 = 0; for (const [p, r] of o.occ) { if (n2 >= 12) break; const w = mv(V.Rh, p); OCC[n2 * 4] = w[0]; OCC[n2 * 4 + 1] = w[1]; OCC[n2 * 4 + 2] = w[2]; OCC[n2 * 4 + 3] = r; n2++; } S.occ = OCC; S.nocc = n2; }
    let n = 0; const items = GLJ; items.length = 0;
    for (const it of list) { const mesh = MESH[it.part]; if (!mesh) continue; const al = al0 * (it.al == null ? 1 : it.al); if (!(al > 0.004)) continue; const Rw = mm(V.Rh, it.R), s2 = it.s || 1, Tt = mv(V.Rh, it.o);
      const g = GLI[n] || (GLI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      g.mesh = mesh; for (let i = 0; i < 3; i++) { g.R0[i] = Rw.x[i] * s2; g.R1[i] = Rw.y[i] * s2; g.R2[i] = Rw.z[i] * s2; g.T[i] = Tt[i]; }
      g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = 1; g.fx = it.fx || 0; g.outline = it.outline; g.d = vdot(Tt, PD); items.push(g); }
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    if (o.into) { o.into(cvs, W, H, bx0, by0, bw, bh); } else c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh);
    GLMS = GLMS * 0.9 + (nowMs() - t0) * 0.1; GLN++; GLBOX = [W, H]; return true;
  }
  /* ---- the low-detail picture (no WebGL): the same rig as shaded capsules, far to near ---- */
  const C_ROCK = '#2A2220', C_PLATE = '#3A302B', C_CORE = '#FF7A1E', C_OBS = '#120D10', C_HOT = '#FFB347';
  const FBC = { spikesB: [],   // per part: capsules [a, b, r, colour] in its own frame
    trunk: [[[0.05, 0, 0.3], [0.1, 0, 2.3], 1.0, C_CORE]], back: [[[-0.25, 0, 0.4], [-0.15, 0, 2.4], 0.95, C_PLATE]], abs: [[[0.45, 0, 0.4], [0.5, 0, 1.15], 0.62, C_PLATE]],
    pecL: [[[-0.25, 0.55, 0.05], [-0.2, 0.25, 0.1], 0.45, C_PLATE]], pecR: [[[-0.25, -0.55, 0.05], [-0.2, -0.25, 0.1], 0.45, C_PLATE]], pelvis: [[[0, -0.45, 0], [0, 0.45, 0], 0.62, C_PLATE]],
    head: [[[0, 0, 0], [0.35, 0, 0.0], 0.45, C_ROCK], [[0.0, -0.3, 0.32], [0.1, -0.85, 1.2], 0.17, C_OBS], [[0.1, -0.85, 1.2], [0.62, -0.58, 1.78], 0.09, C_OBS], [[0.0, 0.3, 0.32], [0.1, 0.85, 1.2], 0.17, C_OBS], [[0.1, 0.85, 1.2], [0.62, 0.58, 1.78], 0.09, C_OBS]],
    jaw: [[[0.0, 0, -0.08], [0.4, 0, -0.1], 0.22, C_ROCK]], paulIL: [[[0, 0, 0], [0, -0.1, 0.15], 0.66, C_PLATE]], paulIR: [[[0, 0, 0], [0, 0.1, 0.15], 0.66, C_PLATE]], paulOL: [[[0, -0.2, 0.25], [0, -0.35, 0.1], 0.72, C_PLATE]], paulOR: [[[0, 0.2, 0.25], [0, 0.35, 0.1], 0.72, C_PLATE]],
    uarm: [[[0, 0, 0], [LU, 0, 0], 0.44, C_ROCK]], farm: [[[0, 0, 0], [LF, 0, 0], 0.5, C_PLATE]], hand: [[[0.1, 0, 0], [0.7, 0, -0.1], 0.32, C_ROCK]], fist: [[[0.1, 0, 0], [0.55, 0, -0.05], 0.36, C_ROCK]],
    thigh: [[[0, 0, 0], [LT, 0, 0], 0.52, C_ROCK]], shin: [[[0, 0, 0], [LSH, 0, 0], 0.44, C_PLATE]], foot: [[[0, 0, -0.05], [0.7, 0, -0.15], 0.3, C_ROCK]],
    throne: [[[-0.6, -1.2, 0.3], [-0.6, -1.2, 3.6], 0.5, '#2E2724'], [[-0.9, 0, 0.3], [-0.9, 0, 4.8], 0.6, '#2E2724'], [[-0.6, 1.2, 0.3], [-0.6, 1.2, 3.6], 0.5, '#2E2724'], [[0.1, -0.8, 0.6], [0.1, 0.8, 0.6], 0.7, '#2E2724']],
    crystal: [[[0, 0, 0], [0.4, 0, 3.0], 0.4, '#1A0E26'], [[0.4, 0.3, 0], [0.9, 0.3, 2.0], 0.28, '#1A0E26'], [[-0.4, 0.3, 0], [-0.9, 0.4, 2.2], 0.28, '#1A0E26']], crystalBroken: [[[0, 0, 0], [0.1, 0, 0.8], 0.42, '#130B18']],
  };
  const FB = [];
  function drawFallback(c, V, list, al0) {
    FB.length = 0; const k = V.k;
    for (const it of list) { const caps = FBC[it.part]; if (!caps || !((it.al == null ? 1 : it.al) > 0.01)) continue; const s2 = it.s || 1;
      for (const [a, b, r] of (spikeSet()[it.part] || [])) { const A2 = vadd(it.o, mv(it.R, vmul(a, s2))), B2 = vadd(it.o, mv(it.R, vmul(b, s2))); FB.push({ d: (V.depth(A2) + V.depth(B2)) / 2 + 0.01, A: V.toS(A2), B: V.toS(B2), w: r * s2 * 2 * k, spk: 1, al: it.al == null ? 1 : it.al, hot: it.glow }); }
      for (const [a, b, r, col] of caps) { const A2 = vadd(it.o, mv(it.R, vmul(a, s2))), B2 = vadd(it.o, mv(it.R, vmul(b, s2))); FB.push({ d: (V.depth(A2) + V.depth(B2)) / 2, A: V.toS(A2), B: V.toS(B2), w: r * s2 * 2 * k, col: col === C_CORE ? (it.glow > 0.05 ? C_CORE : '#3A2A22') : col, al: it.al == null ? 1 : it.al, hot: it.glow, part: it.part }); } }
    FB.sort((p, q) => p.d - q.d); c.save(); c.lineCap = 'round';
    for (const f of FB) { c.globalAlpha = al0 * f.al;
      if (f.spk) { const dx = f.B[0] - f.A[0], dy = f.B[1] - f.A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * f.w * 0.5, ny = dx / L * f.w * 0.5; c.beginPath(); c.moveTo(f.A[0] + nx, f.A[1] + ny); c.lineTo(f.B[0], f.B[1]); c.lineTo(f.A[0] - nx, f.A[1] - ny); c.closePath(); c.fillStyle = C_OBS; c.fill(); c.lineJoin = 'round'; c.lineWidth = Math.max(1, f.w * 0.16); c.strokeStyle = f.hot > 0.05 ? `rgba(255,${Math.round(90 + 60 * Math.min(1, f.hot))},30,${Math.min(0.9, 0.35 + f.hot * 0.4)})` : '#2A2024'; c.stroke(); continue; }
      c.strokeStyle = '#0B0605'; c.lineWidth = f.w + 2.5; c.beginPath(); c.moveTo(f.A[0], f.A[1]); c.lineTo(f.B[0] + 0.01, f.B[1]); c.stroke();
      c.strokeStyle = f.col; c.lineWidth = f.w; c.beginPath(); c.moveTo(f.A[0], f.A[1]); c.lineTo(f.B[0] + 0.01, f.B[1]); c.stroke();
      if (f.col !== C_CORE && f.hot > 0.05) { c.strokeStyle = `rgba(255,110,30,${Math.min(0.55, f.hot * 0.35)})`; c.lineWidth = Math.max(1, f.w * 0.12); c.setLineDash([f.w * 0.3, f.w * 0.5]); c.beginPath(); c.moveTo(f.A[0], f.A[1] + f.w * 0.15); c.lineTo(f.B[0] + 0.01, f.B[1] + f.w * 0.15); c.stroke(); c.setLineDash([]); }
      c.strokeStyle = 'rgba(255,190,150,.16)'; c.lineWidth = Math.max(1, f.w * 0.28); c.beginPath(); c.moveTo(f.A[0], f.A[1] - f.w * 0.24); c.lineTo(f.B[0] + 0.01, f.B[1] - f.w * 0.24); c.stroke(); }
    c.restore();
  }
  /* the soft ground shadow: blobs under the parts, painted small and laid down at once */
  let SHC = null, BLOB = null;
  function drawShadow(c, V, list, al) {
    if (!BLOB) { BLOB = document.createElement('canvas'); BLOB.width = BLOB.height = 64; const g = BLOB.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; const proj = [];
    for (const it of list) { if (it.part === 'jaw' || it.part === 'abs' || it.part.startsWith('pec')) continue; const [bc, br] = bounds(it.part), p = vadd(it.o, mv(it.R, vmul(bc, it.s || 1))), g = V.toS([p[0], p[1], 0]), h = Math.max(0, p[2]), rr = br * 0.55 * V.k * (1 + h * 0.08), w = (it.al == null ? 1 : it.al) / (1 + h * 0.18);
      x0 = Math.min(x0, g[0] - rr); x1 = Math.max(x1, g[0] + rr + h * 0.2 * V.k); y0 = Math.min(y0, g[1] - rr); y1 = Math.max(y1, g[1] + rr); proj.push([g[0] + h * 0.14 * V.k, g[1] + h * 0.04 * V.k, rr, w]); }
    if (!proj.length) return;
    const sc = 0.25, W = Math.max(8, Math.ceil((x1 - x0) * sc) + 4), H = Math.max(8, Math.ceil((y1 - y0) * sc) + 4);
    if (!SHC || SHC.width < W || SHC.height < H) { SHC = document.createElement('canvas'); SHC.width = Math.max(W, SHC ? SHC.width : 0); SHC.height = Math.max(H, SHC ? SHC.height : 0); }
    const g = SHC.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, SHC.width, SHC.height);
    for (const [px, py, rr, w] of proj) { const r2 = rr * sc; g.globalAlpha = Math.min(1, 0.42 * w); g.drawImage(BLOB, (px - x0) * sc + 2 - r2, (py - y0) * sc + 2 - r2 * GY, r2 * 2, r2 * 2 * GY); }
    c.save(); c.globalAlpha = al * 0.6; c.imageSmoothingEnabled = true; c.drawImage(SHC, 0, 0, W, H, x0 - 2 / sc, y0 - 2 / sc, W / sc, H / sc); c.restore();
  }
  /* the occluders: spheres inside the big parts, posed with them (each part darkened where the others overhang it) */
  function occOf(R) { const A = R.A, o = [[vadd(R.P0, mv(R.Rt, [0.05, 0, 0.7])), 0.62], [vadd(R.P0, mv(R.Rt, [0.05, 0, 1.8])), 0.8], [A.head, 0.42], [A.shL, 0.52], [A.shR, 0.52]];
    for (const sn of ['L', 'R']) { o.push([vlerp(A['elbow' + sn], A['wrist' + sn], 0.5), 0.42]); o.push([A['hand' + sn], 0.32]); o.push([vlerp(R.P0, A['knee' + sn], 0.6), 0.45]); } o.push([R.P0, 0.6]); return o; }
  /* draw(c, x, y, a, P, o): the model at world (x, y) (its feet), heading a (the model's own angle: headOf(floor angle)),
     pose P. o = { T, sx, sy, t, scale, low, shadow (draw its ground shadow first), noGL }. Returns the rig */
  let LAST = null;
  function draw(c, x, y, a, P, o) {
    o = o || {}; const t = o.t != null ? o.t : nowMs() / 1000, R = rig(P, t), V = mkView(x, y, 0, a, o), al0 = P.alpha == null ? 1 : P.alpha; LAST = { R, V };
    if (!(al0 > 0.01)) return R;
    const list = R.inst;
    if (o.shadow !== false) drawShadow(c, V, list, al0);
    if (!o.noGL && glOn()) { let ok = false; try { ok = glPass(c, V, list, al0, { t, low: o.low, occ: o.low ? null : occOf(R) }); } catch (e) { glFail(); if (typeof console !== 'undefined') console.warn('Ifrit: draw', e); ok = false; } if (ok) return R; }
    drawFallback(c, V, list, al0); return R;
  }
  /* a still prop (the throne, a crystal growth) rendered once at a size into its own picture and laid down after; its
     key names the state that changes it. Returns false when it drew nothing (the caller paints its 2D picture) */
  const PROPC = new Map();
  function drawProp(c, part, x, y, a, o) {
    o = o || {}; const T = o.T, m0 = c.getTransform ? c.getTransform() : null, dev = m0 ? Math.max(0.25, Math.hypot(m0.a, m0.b)) : 1, key = `${part}|${o.key || ''}|${Math.round(T * dev * 4)}|${o.scale || 1}|${(+a || 0).toFixed(2)}`;   // (the angle too: the two crystal growths face different ways)
    const it = { part, R: I3(), o: [0, 0, 0], s: 1, al: 1, glow: o.glow || 0, glow2: o.glow2 || 0, spill: 0, kind: o.kind || 0, fx: o.fx || 0 };
    let P = PROPC.get(key);
    if (!P) { if (!glOn()) { const V = mkView(x, y, 0, a, o); drawFallback(c, V, [it], 1); return true; }
      // render about a fixed origin, keep the picture and where its origin falls in it
      const V0 = mkView(0, 0, 0, a, { T, sx: v => v, sy: v => v, scale: o.scale });
      let pic = null; try { glPass(c, V0, [it], 1, { t: 0, low: o.low, outline: 1, into: (cvs, W, H, bx0, by0, bw, bh) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(cvs, 0, 0); pic = { cv, bx0, by0, bw, bh }; } }); } catch (e) { glFail(); }
      if (!pic) { const V = mkView(x, y, 0, a, o); drawFallback(c, V, [it], 1); return true; }
      P = pic; if (PROPC.size > 40) PROPC.clear(); PROPC.set(key, P); }
    c.drawImage(P.cv, 0, 0, P.cv.width, P.cv.height, o.sx(x) + P.bx0, o.sy(y) + P.by0, P.bw, P.bh); return true;
  }
  /* anchors of the last draw, in the world (tiles; z above the floor) */
  function anchor(name) { if (!LAST) return null; const p = LAST.R.A[name]; return p ? LAST.V.toW(p) : null; }
  /* the same for a pose without drawing (logic that runs before the frame) */
  function anchorAt(name, x, y, a, P, sc, t) { const R = rig(P, t || 0), p = R.A[name]; if (!p) return null; const w = mv(rotZ(a), p), s2 = (sc || 1) * VIS; return { x: x + w[0] * s2, y: y + w[1] * GY * s2, z: w[2] * s2 }; }
  const MODEL = { draw, drawProp, rig, anchor, anchorAt, blankPose, CH, headOf, floorAng, toBody, VIS, VIEW: { GY, ZK },
    warm() { return glOn(); },
    __dbg: { get gl() { return glOn(); }, set noGL(v) { NOGL = !!v; }, get MESH() { return MESH; }, get glStats() { const s2 = typeof GLM !== 'undefined' ? GLM.stats : {}; return Object.assign({}, s2, { ms: +GLMS.toFixed(2), frames: GLN, box: GLBOX, meshMs: +MESH_MS.toFixed(1), meshTris: MESH ? Object.values(MESH).reduce((a2, m) => a2 + (m ? m.ntri : 0), 0) : 0 }); } } };

  /* ================= the arena ================= */
  const AR = 15;
  const ARENA = { R: AR,
    throne: C => ({ x: C.x, y: C.y - AR + 1.25 }),
    seat: C => ({ x: C.x, y: C.y - AR + 1.62 }),
    crystals: C => [-1, 1].map((s, i) => { const a = -Math.PI / 2 + s * 0.95; return { i, x: C.x + Math.cos(a) * 12.3, y: C.y + Math.sin(a) * 12.3 }; }),
    wells: C => [-1, 1].map((s, i) => { const a = Math.PI / 2 - s * 0.86; return { i, x: C.x + Math.cos(a) * 11.6, y: C.y + Math.sin(a) * 11.6 }; }),
    start: C => ({ x: C.x + 0.5, y: C.y + AR - 3.2 }),
    REFUGE: 2.7 };
  /* the stage's module (when the rift's boss stage makes this arena) is found through the game it runs in */
  let STAGE = null;
  const modOf = FX => (STAGE && FX && STAGE.g === FX.g ? STAGE.mod : null);
  const rxOf = FX => (STAGE && FX && STAGE.g === FX.g ? STAGE.X : null);

  /* ================= the fight ================= */
  const WARN = '#FF5A1E', HOT = '#FFB347', FROST = '#BFEFFF', FROST_HI = '#F2FCFF', BF = '#9B4DFF', BF_HI = '#E2B8FF';
  const CYC = { 1: ['fist', 'breath', 'fault', 'fist', 'fault', 'breath'], 2: ['cleave', 'fist', 'rocks', 'breath', 'cleave', 'fault', 'rocks', 'fist'], 3: ['fist', 'cleave', 'breath', 'rocks', 'fault', 'cleave', 'fist', 'rocks'] };
  const TUNE = { hp: 74250, dmg: 18,   /* (v389: 9 bars, each as big as v388's 4: x2.25; the user; crystHp scaled to match) */   /* (v388: health doubled at the user's request; crystHp halved so the crystals stay as tough) */   /* (QA v386: was 8000 / 11, for a level-1 pet; the pet arrives here at about level 10, HP ~200) */ crystHp: 0.012 * 33000 / 74250, hellEvery: 24, hellFirst: 3.5, hellCharge: 8, kneel: 6, missK: 0.5, stagger: 1.8 };
  const sf = (FX, k, ...a) => { const s = FX.H && FX.H.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k);
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, max) => a + Math.max(-max, Math.min(max, angTo(a, b)));
  const say = (FX, key, s, sub, col, dur) => { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub || '', col || HOT, first ? (dur || 2.6) : 1.4, true); };
  const ST = FX => { try { return FX.H.ST ? FX.H.ST() : null; } catch (e) { return null; } };
  const sp = FX => (FX.S.lv >= 3 ? 1.15 : 1);
  /* where a body point of his shows (the floor point a tap there lands on): the model's (x, y) and height z */
  const vis = (p, m) => ({ x: p.x, y: p.y - p.z * ZK * 1.0 });
  function anc(FX, m, name) { const M = FX.mem; return MODEL.anchorAt(name, m.x, m.y, MODEL.headOf(M.th), M.P, 1, M.bt || 0) || { x: m.x, y: m.y, z: 2 }; }
  function crystalsLive(M) { return (M.crys || []).filter(c => c.alive).length; }

  const def = {
    arenaR: AR, firstAct: 'rise', ambient: 'embers', floorDisc: true,
    carve(set, C) { /* the platform is the whole disc; the throne stands on its rim (drawn, not solid) */ },
    start(C) { return ARENA.start(C); },
    phaseNames: ['Basalt Tyrant', 'Crown of Blackfire', 'Heart of the Volcano'],
    props(C) { const T0 = ARENA.throne(C), out = [{ kind: 'throne', x: T0.x, y: T0.y }]; ARENA.crystals(C).forEach(c => out.push({ kind: 'crystal', i: c.i, x: c.x, y: c.y })); return out; },
    artPoses: [
      { name: 'dormant on the throne: a distant furnace', mem: { P: { sit: 1, heat: 0.18 }, throne: 1 } },
      { name: 'he breathes: the light swells', mem: { P: { sit: 0.7, heat: 1.0, inhale: 1, nod: -0.1 }, throne: 1 } },
      { name: 'standing: the Basalt Tyrant', mem: { P: { heat: 0.65 } } },
      { name: 'walking', mem: { P: { heat: 0.65, gaitK: 1, gait: 0.2 } } },
      { name: 'Titan Fist: the high lift', mem: { P: { liftR: 1, fistR: 1, heat: 0.8, look: -0.1 } } },
      { name: 'Titan Fist: the slam, the chest exposed', mem: { P: { slamR: 1, fistR: 1, open: 1, heat: 1.0, slamX: 2.8 } } },
      { name: 'Cinder Breath: the inhale (tracking)', mem: { P: { breath: 0.6, inhale: 1, heat: 1.2 } } },
      { name: 'Cinder Breath: the gout', mem: { P: { breath: 1, jaw: 1, heat: 1.3 } } },
      { name: 'Fault Line: the claw drives in', mem: { P: { slamR: 1, slamX: 1.9, crouch: 0.6, heat: 0.8 } } },
      { name: 'Crown of Blackfire: horns flared, tethered', mem: { P: { heat: 0.9, flare: 1, bfL: 1, bfR: 1, shout: 0.5 } } },
      { name: 'one tether cut: the left side dims', mem: { P: { heat: 0.9, flare: 1, bfL: 0, bfR: 1, recoil: 1 } } },
      { name: 'Burning Cleave: drawn back', mem: { P: { cleaveW: 1, heat: 1, flare: 1 } } },
      { name: 'Burning Cleave: the sweep', mem: { P: { cleaveS: 0.6, heat: 1, flare: 1 } } },
      { name: 'Heart of the Volcano: the armour breaks away', mem: { P: { frac: 0.35, heat: 1.4, shout: 0.8, cracks: 1 } } },
      { name: 'Heart of the Volcano: bare molten chest', mem: { P: { frac: 1, heat: 1.5, open: 0.3 } } },
      { name: 'Hellfire: hands planted, charging', mem: { P: { frac: 1, plant: 1, heat: 1.9, inhale: 1 } } },
      { name: 'overheated: kneeling, the core open', mem: { P: { frac: 1, kneel: 1, heat: 2.0, open: 0.6 } } },
      { name: 'fallen: a dark inert statue', mem: { P: { frac: 1, kneel: 1, heat: 0, dead: 1 } } }],
    /* ---- the painting ---- */
    paintGround(c, A2) { paintFloor(c, A2); },
    sky(c, W, H, t, cam, T) { paintCaldera(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    drawProp(c, FX, p, X, Y, T, t) { drawPropArt(c, FX, p, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { /* the growths are drawn as props; their hit bodies are invisible */ },
    camFocus(FX, m) { const M = FX.mem; if (!M.ok) return null; const C = FX.C, me = FX.me;
      if (m.dead) return M.deadT != null && M.deadT < 5 ? { x: m.x, y: m.y - 2.5, k: 0.7, zoom: 0.42 } : null;
      if (m.act === 'enter' || m.act === 'rise') return { x: m.x, y: m.y - 2.2, k: 0.82, zoom: 0.4 };
      if (M.A && M.A.kind === 'hellfire') return { x: (C.x + me.x) / 2, y: (C.y + me.y) / 2 + 1, k: 0.55, zoom: 0.36 };
      return { x: m.x, y: m.y - 3.0, k: 0.34, zoom: 0.42 }; },
    keep: null,
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C, S0 = ARENA.seat(C); m.act = 'enter'; m.noTouch = true; m.touchK = 0; m.x = S0.x; m.y = S0.y;
      Object.assign(M, { ok: 1, bt: 0, P: Object.assign(blankPose(), { sit: 1, heat: 0.15 }), W: null, th: Math.PI / 2, A: null, pick: 0, idleT: 0, seen: {}, hfT: TUNE.hellFirst, p3: false,
        crys: ARENA.crystals(C).map(c => ({ i: c.i, x: c.x, y: c.y, alive: false, dormant: true, broken: false, glow: 0.25, obj: null, pulse: 0 })), wells: null, refuge: null, fx: [], rocks: [], calm: 0, climb: 0, warnK: 0, statue: null, fracT: -1, lastStep: 0,
        stat: { fist: 0, fistHit: 0, breath: 0, breathHit: 0, fault: 0, faultHit: 0, cleave: 0, cleaveHit: 0, rocks: 0, rockHit: 0, hell: 0, hellSafe: 0, hellHit: 0, kneel: 0, cryst: 0, exposed: 0, phase2At: null, phase3At: null, t0: null } });
      M.stat.t0 = FX.S.t; wellsOf(FX); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; endAct(FX, m, true); M.phT = 0; M.flinch = 1;
      if (lv === 2) { M.stat.phase2At = FX.S.t; say(FX, 'p2', 'CROWN OF BLACKFIRE', 'His horns flare; two crystal growths feed his armour. Break them!', BF_HI, 3.2);
        M.crys.forEach(cr => { cr.dormant = false; cr.alive = true; cr.obj = FX.obj({ kind: 'cryst', x: cr.x, y: cr.y - 0.7, r: 1.25, hp: m.maxhp * TUNE.crystHp, key: 'cryst' + cr.i, onHit: o => { o.flash = 0.12; sf(FX, 'tick'); }, onKill: () => crystalBroken(FX, cr) }); });
        sf(FX, 'hum'); M.pick = 0; }
      if (lv >= 3) { M.stat.phase3At = FX.S.t; M.p3 = true; M.fracT = 0; M.hfT = TUNE.hellFirst; say(FX, 'p3', 'HEART OF THE VOLCANO', 'His armour breaks away. Watch for Hellfire: the frost wells will wake.', HOT, 3.2);
        M.crys.forEach(cr => { if (cr.alive) { cr.alive = false; cr.broken = true; cr.collapsed = true; if (cr.obj && !cr.obj.dead) { cr.obj.dead = true; } burst(FX, cr.x, cr.y - 1.5, BF, 16); } });
        FX.H.boom(m.x, m.y - 1, 2.5, HOT, '#FFFFFF', { n: 30, shake: 14, smoke: 8 }); sf(FX, 'crash'); M.pick = 0; } },
    ai(FX, m, dt) { const M = FX.mem; if (!M.ok) return; m.actT += dt; m.noTouch = true;
      if (m.act === 'rise') { riseTick(FX, m, dt); return; }
      if (!M.A) { idleTick(FX, m, dt); return; }
      const A = M.A; A.t += dt;
      const done = A.kind === 'fist' ? fistTick(FX, m, A, dt) : A.kind === 'breath' ? breathTick(FX, m, A, dt) : A.kind === 'fault' ? faultTick(FX, m, A, dt) : A.kind === 'cleave' ? cleaveTick(FX, m, A, dt) : A.kind === 'rocks' ? rocksTick(FX, m, A, dt) : A.kind === 'hellfire' ? hellTick(FX, m, A, dt) : true;
      if (done) endAct(FX, m); },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; if (M.stunKind === 'kneel' && Math.random() < dt * 8) steam(FX, m); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.ok) return; M.bt += dt;
      if (m.dead) { deadTick(FX, m, dt); easePose(FX, m, dt); return; }
      if (m.stunT > 0) { if (!M.wasStun) { M.wasStun = true; } } else if (M.wasStun) { M.wasStun = false; if (M.stunKind === 'kneel') { FX.H.text(m.x, m.y - 5, 'He rises', HOT, 13); M.hfT = TUNE.hellEvery; } M.stunKind = null; }
      if (M.p3 && !(M.A && M.A.kind === 'hellfire') && !(m.stunT > 0)) M.hfT -= dt;
      if (M.fracT >= 0 && M.fracT < 1.6) { const was = M.fracT; M.fracT += dt; if (was < 0.15 && M.fracT >= 0.15) { for (let i = 0; i < 5; i++) FX.H.after(i * 0.12, () => FX.H.boom(m.x + FX.rnd(-2, 2), m.y + FX.rnd(-1, 1), 1.2, HOT, '#FFE9C0', { n: 10, shake: 6, smoke: 3 })); } }
      // the crystal growths pulse toward him while they live; their glow
      for (const cr of M.crys) { cr.glow = toward(cr.glow, cr.alive ? 1 : cr.dormant ? 0.28 : 0, dt, 2); if (cr.alive) { cr.pulse = (cr.pulse + dt * 0.8) % 1; } }
      wellsTick(FX, m, dt);
      { const d = (M.lastHp == null ? m.hp : M.lastHp) - m.hp; M.lastHp = m.hp; if (d > 0) { const key = m.stunT > 0 ? (M.stunKind || 'stun') : M.weakK > 0 ? 'open' : 'closed'; M.stat.dmg = M.stat.dmg || {}; M.stat.dmg[key] = Math.round((M.stat.dmg[key] || 0) + d); } }
      weakPoints(FX, m, M);
      FX.parts(partsOf(FX, m, M));
      // he is walked round, not through: the pet eased out from under his feet
      const me = FX.me; if (!me.dead && m.act !== 'enter') { const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = 2.1; if (d < r0 && d > 1e-4) FX.push(dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6); }
      // embers off his seams, more as he heats
      // the motion: the phase moment's clock, the stepping (the feet held still while he sits, kneels or plants his hands), a
      // knuckle-crack now and then while he studies the pet
      if (M.phT != null) M.phT += dt;
      { const P = M.P, lock = m.act === 'enter' || (m.act === 'rise' && m.actT < 3.3) || (P.sit || 0) > 0.2 || (P.kneel || 0) > 0.3 || (P.plant || 0) > 0.3; locoTick(FX, m, dt, lock); }
      M.crackT = Math.max(0, (M.crackT || 0) - dt);
      if (!M.A && !(m.stunT > 0) && m.act === 'fight' && !M.stalk) { M.nextCrack = (M.nextCrack == null ? 5 : M.nextCrack) - dt; if (M.nextCrack <= 0) { M.nextCrack = 6 + Math.random() * 6; M.crackT = 0.7; FX.H.after(0.25, () => { sf(FX, 'tick'); const h = anc(FX, m, 'handR'); if (h) FX.H.sparks(h.x, h.y - h.z * ZK, '#FFB347', 5, 2); }); } }
      // embers off his shoulders and spikes, and a few off his seams, more as he heats
      if (!lowFx() && m.act !== 'enter' && Math.random() < dt * (2 + 3 * (M.P.heat || 0))) { const v = anc(FX, m, Math.random() < 0.5 ? 'ventL' : 'ventR'); FX.H.part({ kind: 'ember', x: v.x + FX.rnd(-0.6, 0.6), y: v.y - v.z * ZK, vx: FX.rnd(-0.3, 0.3), vy: FX.rnd(-1.8, -0.8), life: 1.5, max: 1.5, size: 1.6 + Math.random() * 1.4, color: Math.random() < 0.7 ? '#FF8A2A' : '#FFD27A' }); }
      if (!lowFx() && m.act !== 'enter' && Math.random() < dt * (2 + 4 * (M.P.heat || 0))) { const a = FX.rnd(-1.4, 1.4); FX.H.part({ kind: 'ember', x: m.x + Math.cos(a) * 1.2, y: m.y - FX.rnd(1.5, 3.6), vx: FX.rnd(-0.3, 0.3), vy: FX.rnd(-1.6, -0.6), life: 1.4, max: 1.4, size: 2 + Math.random() * 1.5, color: Math.random() < 0.7 ? '#FF8A2A' : '#FFD27A' }); }
      M.climb = toward(M.climb, M.A && M.A.kind === 'hellfire' && M.A.phase === 'charge' ? cl(M.A.t / TUNE.hellCharge) : 0, dt, 1.5);
      easePose(FX, m, dt); },
    dmgK(FX, m, o) { const M = FX.mem; flinch(FX, m, 0.05);
      let k = M.p3 ? 0.5 : FX.S.lv === 2 ? 0.6 : 0.45; if (m.stunT > 0 && M.stunKind === 'kneel') k = 0.9; else if (m.stunT > 0) k = 0.55;
      return k * drK(FX) * stackK(FX, o); },
    onWeakHit(FX) { const M = FX.mem; flinch(FX, FX.m, 0.14); M.stat.exposed++; stackK(FX, null); },
    draw(c, FX, m, X, Y, T, t) { c.globalAlpha = 1; Y += (m.z || 0) * T * 4; paintBoss(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };
  /* one blow over the whole colossus (a burst that takes in his body, his hit proxies and his chest at once) counts about
     once: in a frame, the hits that come through a proxy after the first are worth 0.3 */
  function stackK(FX, o) { const M = FX.mem, t = FX.g.t; if (M.hitT !== t) { M.hitT = t; M.hitN = 0; } M.hitN++; return M.hitN > 1 && o && o.viaProxy ? 0.3 : 1; }
  /* the crystals' share of protection: 20% each while they live, 40% at most */
  function drK(FX) { const M = FX.mem; if (FX.S.lv !== 2) return 1; return 1 - Math.min(0.4, 0.2 * crystalsLive(M)); }
  function crystalBroken(FX, cr) { const M = FX.mem, m = FX.m; if (!cr.alive) return; cr.alive = false; cr.broken = true; M.stat.cryst++; if (typeof BREAK_FX !== 'undefined') try { BREAK_FX.burst(null, cr.x, cr.y, { kind: 'bigcrystal', mat: 'blackfire', size: 2.5 }); } catch (e) { /* (v388: the shared break effect) */ }
    burst(FX, cr.x, cr.y - 1.4, BF, 22); FX.H.boom(cr.x, cr.y - 0.6, 1.6, BF_HI, '#FFFFFF', { n: 18, shake: 9, smoke: 4 }); sf(FX, 'crash');
    if (m && !m.dead && FX.S.lv === 2) { m.stunT = Math.max(m.stunT || 0, TUNE.stagger); M.stunKind = 'stagger'; M.flinch = 1; M.recoilS = cr.x < m.x ? 1 : -1; FX.H.after(0.45, () => { if (!m.dead) { sf(FX, 'thud'); for (let i = 0; i < 6; i++) FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-1.4, 1.4), y: m.y + FX.rnd(-0.3, 0.4), vx: FX.rnd(-1, 1), vy: -0.3, life: 1, max: 1, size: 0.8, color: '#5A4A44' }); } });
      FX.H.text(m.x, m.y - 5.6, `Tether cut! Armour −20% (${Math.round((1 - drK(FX)) * 100)}% left)`, BF_HI, 14);
      if (crystalsLive(M) === 0) say(FX, 'crysAll', 'THE CROWN IS BROKEN', 'No growth feeds his armour now', BF_HI, 2.2); } }
  function burst(FX, x, y, col, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; FX.H.part({ kind: 'shard', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, g: 9, life: 0.9, max: 0.9, size: 3 + Math.random() * 3, rot: Math.random() * 6, color: Math.random() < 0.5 ? col : '#1A0E26' }); } }
  function steam(FX, m) { FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-1.6, 1.6), y: m.y - FX.rnd(1.5, 3.2), vx: FX.rnd(-0.3, 0.3), vy: -1.4, life: 1.6, max: 1.6, size: 1.2 + Math.random() * 0.8, color: '#B8AFAA' }); }
  /* the hit proxies: his torso, his legs, his head (where they show) */
  function partsOf(FX, m, M) { if (m.act === 'enter') return []; const ch = vis(anc(FX, m, 'chest'), m), hd = vis(anc(FX, m, 'head'), m);
    return [{ key: 'torso', dx: ch.x - m.x, dy: ch.y - m.y, r: 1.7 }, { key: 'legs', dx: 0, dy: -0.9, r: 1.5 }, { key: 'head', dx: hd.x - m.x, dy: hd.y - m.y, r: 0.9 }]; }
  /* the weak point: the chest, while it shows (a recovery, the bare chest of the third act, the overheat) */
  function weakPoints(FX, m, M) { const A = M.A, rec = A && A.exposed, kneel = m.stunT > 0 && M.stunKind === 'kneel';
    let k = 0; if (kneel) k = 1.9; else if (rec) k = 1.6; else if (M.p3 && M.fracT > 1.0) k = 0.9; else if (m.stunT > 0 && M.stunKind === 'stagger') k = 1.2;
    if (k > 0 && m.act !== 'enter' && m.act !== 'rise') { const p = vis(anc(FX, m, 'core'), m); FX.weak('chest', p.x, p.y, kneel ? 1.9 : 1.55, k * drK(FX), true); M.weakK = k; }
    else { FX.weak('chest', 0, 0, 0, 0, false); M.weakK = 0; } }
  /* ---- moving: a heavy walk, the heading eased; the gait drives the stride and each footfall shakes the floor ---- */
  /* ---- moving like a colossus (v387): heavy to start and heavy to stop; the hips turn slowly behind the torso and the
     head (aim, look); the feet are planted on the floor and stepped one at a time (a step when a foot falls too far from
     where it should stand, so he shuffles round when he turns), the body surging while a foot swings; each footfall a
     thud, a puff of ash, the hips sinking onto it and the faintest tremor ---- */
  const STEP = { thr: 0.5, D: 0.78, D3: 0.6, lift: 0.5 };
  function homeOf(m, th, s, fwd) { const a = MODEL.headOf(th), p0 = 0.12 + (fwd || 0), p1 = s * 0.86, c = Math.cos(a), sn = Math.sin(a); return { x: m.x + (p0 * c - p1 * sn) * VIS, y: m.y + (p0 * sn + p1 * c) * GY * VIS }; }
  function locoInit(FX, m) { const M = FX.mem, L = M.loco = { vx: 0, vy: 0, want: null, aim: M.th, feet: {}, lastPlant: -9, drop: 0, n: 0, lastSide: 'R' };
    for (const s2 of [-1, 1]) { const h = homeOf(m, M.th, s2); L.feet[s2 < 0 ? 'L' : 'R'] = { s: s2, x: h.x, y: h.y, yaw: M.th, t: -1, fx: h.x, fy: h.y, fyaw: M.th }; } return L; }
  const locoOf = (FX, m) => FX.mem.loco || locoInit(FX, m);
  function walk(FX, m, tx, ty, spd) { const L = locoOf(FX, m); L.want = { tx, ty, spd: spd * 1.15 }; L.aim = Math.atan2(ty - m.y, tx - m.x); }
  function face(FX, m, tx, ty) { locoOf(FX, m).aim = Math.atan2(ty - m.y, tx - m.x); }
  function aimAt(FX, m, a) { locoOf(FX, m).aim = a; }
  function footfalls() { /* (the footfalls come from the steps: locoTick) */ }
  function locoTick(FX, m, dt, lock) {
    const M = FX.mem, L = locoOf(FX, m), t = FX.g.t, D = M.p3 ? STEP.D3 : STEP.D;
    const w = L.want; L.want = null; let dvx = 0, dvy = 0;
    if (w && !lock) { const dx = w.tx - m.x, dy = w.ty - m.y, d = Math.hypot(dx, dy); if (d > 0.2) { const s2 = w.spd * Math.min(1, d / 1.2); dvx = dx / d * s2; dvy = dy / d * s2; } }
    const go = dvx || dvy; L.vx = toward(L.vx, dvx, dt, go ? 1.5 : 2.6); L.vy = toward(L.vy, dvy, dt, go ? 1.5 : 2.6);
    const stp = L.feet.L.t >= 0 ? L.feet.L : L.feet.R.t >= 0 ? L.feet.R : null, su = stp ? cl(stp.t / D) : 0, surge = stp ? 0.5 + 1.0 * Math.sin(Math.PI * su) : 0.5;
    if (!lock) { const x0 = m.x, y0 = m.y; FX.H.moveEnt(m, L.vx * surge * dt, L.vy * surge * dt, 1); FX.clampArena(m, 2.6); M.spd = Math.hypot(m.x - x0, m.y - y0) / Math.max(dt, 1e-4); }
    else { L.vx = L.vy = 0; M.spd = 0; }
    // the hips: toward where he walks while he walks (a little toward his aim), else toward his aim; slowly
    const v = Math.hypot(L.vx, L.vy), mvA = Math.atan2(L.vy, L.vx), want = v > 0.35 ? mvA + Math.max(-0.45, Math.min(0.45, angTo(mvA, L.aim))) : L.aim;
    if (!lock) M.th = turnTo(M.th, want, dt * (M.p3 ? 1.3 : 1.0) * Math.min(1, 0.3 + Math.abs(angTo(M.th, want)) * 1.3));
    L.drop = Math.max(0, L.drop - dt * 3.2);
    if (lock) { for (const k of ['L', 'R']) { const f = L.feet[k], h = homeOf(m, M.th, f.s); f.x = h.x; f.y = h.y; f.yaw = M.th; f.t = -1; } return L; }
    const lead = Math.min(0.75, v * D * 0.5 / VIS);
    for (const k of ['L', 'R']) { const f = L.feet[k], h = homeOf(m, M.th, f.s); if (Math.hypot(f.x - h.x, f.y - h.y) > 2.4) { f.x = f.fx = h.x; f.y = f.fy = h.y; f.yaw = M.th; f.t = -1; } }   // (a foot left far behind, were he ever moved at once, is brought home rather than stretched)
    for (const k of ['L', 'R']) { const f = L.feet[k]; if (f.t < 0) continue; f.t += dt; const u = cl(f.t / D), h = homeOf(m, M.th, f.s, lead), e = ease(u);
      f.x = f.fx + (h.x - f.fx) * e; f.y = f.fy + (h.y - f.fy) * e; f.yaw = f.fyaw + angTo(f.fyaw, M.th) * e;
      if (u >= 1) { f.t = -1; f.x = h.x; f.y = h.y; f.yaw = M.th; L.lastPlant = t; L.drop = 1; L.n++; footfall(FX, m, f); } }
    if (L.feet.L.t < 0 && L.feet.R.t < 0 && t - L.lastPlant > 0.06) {
      let best = null, be = 0;
      for (const k of ['L', 'R']) { const f = L.feet[k], h = homeOf(m, M.th, f.s, lead), e = Math.hypot(f.x - h.x, f.y - h.y) + Math.abs(angTo(f.yaw, M.th)) * 0.9 - (k === L.lastSide ? 0.08 : 0); if (e > be) { be = e; best = f; } }
      if (best && be > STEP.thr) { best.t = 0; best.fx = best.x; best.fy = best.y; best.fyaw = best.yaw; L.lastSide = best.s < 0 ? 'L' : 'R'; } }
    return L; }
  function footfall(FX, m, f) { const M = FX.mem, heavy = Math.min(1, 0.35 + (M.spd || 0) / 2.2); sf(FX, 'thud');
    if (lowFx()) return; FX.H.shake(1 + 1.2 * heavy, 0.09);
    for (let i = 0; i < 4; i++) { const a = Math.random() * TAU; FX.H.part({ kind: 'smoke', x: f.x + Math.cos(a) * 0.55, y: f.y + Math.sin(a) * 0.28, vx: Math.cos(a) * 0.9, vy: Math.sin(a) * 0.4 - 0.25, life: 0.9, max: 0.9, size: 0.5 + Math.random() * 0.45, color: Math.random() < 0.5 ? '#5A4A44' : '#7A6A62' }); }
    if (Math.random() < 0.6) FX.H.part({ kind: 'ember', x: f.x + FX.rnd(-0.3, 0.3), y: f.y - 0.1, vx: FX.rnd(-0.4, 0.4), vy: -1.2, life: 0.6, max: 0.6, size: 2, color: '#FF8A2A' }); }
  /* the stepping's picture for the rig: each foot in the body frame (lifted mid-step), the weight shift, the arm swing */
  function locoPose(FX, m, M, P) { const L = M.loco; if (!L) return; const a = MODEL.headOf(M.th), D = M.p3 ? STEP.D3 : STEP.D; let shift = 0, swing = 0;
    for (const k of ['L', 'R']) { const f = L.feet[k], b = toBody(f.x, f.y, m.x, m.y, a), u = f.t >= 0 ? cl(f.t / D) : 0, lift = f.t >= 0 ? Math.sin(Math.PI * u) * STEP.lift * (M.p3 ? 0.8 : 1) : 0;
      (P['f' + k] || (P['f' + k] = [0, 0, 0, 0])).splice(0, 4, b[0], b[1], lift, angTo(M.th, f.yaw) * 0.8);
      if (f.t >= 0) { const k2 = Math.sin(Math.PI * u); shift += (f.s < 0 ? 1 : -1) * k2; swing += (f.s < 0 ? 1 : -1) * k2; } }
    P.shift = toward(P.shift, shift, 1 / 60, 8); P.swing = toward(P.swing, swing, 1 / 60, 8); P.drop = toward(P.drop, L.drop, 1 / 60, 14); }
  /* ---- the rise from the throne ---- */
  function riseTick(FX, m, dt) { const M = FX.mem, C = FX.C;
    if (m.actT < 1.4) return;   // (he breathes first: the light swells; see poseOf)
    if (m.actT < 3.3) { if (!M.rose) { M.rose = true; sf(FX, 'crack'); FX.H.shake(lowFx() ? 4 : 9, 1.2); }
      // dust and grit falling off him and the throne as he heaves himself up
      if (!lowFx() && Math.random() < dt * 22) FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-2.2, 2.2), y: m.y - FX.rnd(2.5, 6), vx: FX.rnd(-0.2, 0.2), vy: 1.6 + Math.random(), life: 1.6, max: 1.6, size: 0.6 + Math.random() * 0.6, color: Math.random() < 0.5 ? '#4A3C36' : '#6A5A52' });
      if (m.actT > 2.6 && !M.roared) { M.roared = true; sf(FX, 'hum'); FX.H.shake(lowFx() ? 3 : 7, 0.8); } return; }
    walk(FX, m, C.x, C.y - 8.5, 1.4, dt);
    if (Math.hypot(m.x - C.x, m.y - (C.y - 8.5)) < 0.4 || m.actT > 9) { m.act = 'fight'; M.idleT = 0.6; say(FX, 'p1', 'BASALT TYRANT', 'Dodge the marked blows; strike his chest when it opens', HOT, 2.6); } }
  /* ---- between blows: he closes in, faces the pet, then picks the next one ---- */
  function idleTick(FX, m, dt) { const M = FX.mem, me = FX.me, lv = FX.S.lv, d = Math.hypot(me.x - m.x, me.y - m.y);
    face(FX, m, me.x, me.y);
    M.stalk = d > 5.6 || (M.stalk && d > 4.7); if (M.stalk) walk(FX, m, me.x, me.y, lv >= 3 ? 2.0 : 1.7);
    M.idleT -= dt * sp(FX); if (M.idleT > 0) return;
    if (M.p3 && M.hfT <= 0 && !FX.S.tele.length) { begin(FX, m, 'hellfire'); return; }
    const cyc = CYC[Math.min(3, lv)]; const kind = cyc[M.pick % cyc.length]; M.pick++; begin(FX, m, kind); }
  function begin(FX, m, kind) { const M = FX.mem; M.A = { kind, t: 0, phase: 'wind' }; m.actT = 0; M.stat[kind === 'hellfire' ? 'hell' : kind]++; }
  function endAct(FX, m, cut) { const M = FX.mem, A = M.A; if (A && A.tele) A.tele.done = true; M.A = null; M.idleT = FX.S.lv >= 3 ? 1.1 : FX.S.lv === 2 ? 1.25 : 1.5; if (cut) { FX.S.tele.length = 0; } }
  /* ---- Titan Fist: approach, a high lift (the circle tracks the pet a moment, then holds), one slam, a long recovery ---- */
  function fistTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, k = sp(FX);
    if (A.phase === 'wind' && !A.tele) { const d = Math.hypot(me.x - m.x, me.y - m.y); if (d > 5.0 && A.t < 3) { walk(FX, m, me.x, me.y, 1.9, dt); footfalls(FX, m, M); face(FX, m, me.x, me.y, dt); return false; }
      A.t = 0; A.side = (M.fistSide = -(M.fistSide || 1)); A.W = 1.95 / k; const p = reach(FX, m, me.x, me.y, 4.6);
      A.tele = FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 2.3, t: A.W, dmg: m.dmg * 1.25, label: '', fn: s => fistLand(FX, m, A, s) }); sf(FX, 'whoosh'); }
    const s = A.tele;
    if (A.phase === 'wind') { if (A.t < 0.75) { const p = reach(FX, m, me.x, me.y, 4.6); s.x += (p.x - s.x) * Math.min(1, dt * 5); s.y += (p.y - s.y) * Math.min(1, dt * 5); } face(FX, m, s.x, s.y, dt, 3); A.at = { x: s.x, y: s.y };
      if (A.t >= A.W) { A.phase = 'rec'; A.t = 0; A.exposed = true; } return false; }
    if (A.phase === 'rec') { if (A.t >= 2.8 / Math.sqrt(k)) { A.phase = 'back'; A.t = 0; A.exposed = false; } return false; }
    return A.t >= 0.55; }
  function fistLand(FX, m, A, s) { const M = FX.mem; FX.H.boom(s.x, s.y, 2.0, WARN, '#FFE2B0', { n: 26, shake: 16, smoke: 8 }); FX.H.ring(s.x, s.y, 0.4, 3.4, 0.5, HOT, 0.35); sf(FX, 'crash');
    if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.fistHit++;
    groundFx(FX, { fx: 'scar', x: s.x, y: s.y, r: 2.0, life: 3.2, seed: Math.random() * 50 });
    if (!M.seen.exposed) { M.seen.exposed = true; FX.H.text(m.x, m.y - 5.4, 'His chest is open: strike it!', HOT, 15); } }
  /* a floor point toward (x, y) no farther than his reach from him */
  function reach(FX, m, x, y, R) { const dx = x - m.x, dy = y - m.y, d = Math.hypot(dx, dy) || 1, k = Math.min(1, R / d), p = { x: m.x + dx * k, y: m.y + dy * k }; return FX.clampArena(p, 1.2); }
  /* ---- Cinder Breath: the cone tracks while he draws breath, then locks; the gout; a panting recovery ---- */
  const BR_LEN = 9.5, BR_SP = 0.38;
  function breathTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, k = sp(FX), track = 1.55 / k, lock = 0.75 / k;
    if (!A.tele) { A.a = Math.atan2(me.y - m.y, me.x - m.x); const o = mouthFloor(FX, m, A.a); A.tele = FX.tele({ shape: 'cone', x: o.x, y: o.y, a: A.a, len: BR_LEN, spread: BR_SP, t: track + lock, dmg: m.dmg * 0.9, label: '', fn: s => breathFire(FX, m, A, s) }); sf(FX, 'hum'); }
    const s = A.tele;
    if (A.phase === 'wind') { if (A.t < track) { A.a = turnTo(A.a, Math.atan2(me.y - m.y, me.x - m.x), dt * 0.85); } else if (!A.locked) { A.locked = true; s.label = 'LOCKED'; sf(FX, 'tick'); }
      aimAt(FX, m, A.a); const o = mouthFloor(FX, m, A.a); s.x = o.x; s.y = o.y; s.a = A.a;
      if (A.t >= track + lock) { A.phase = 'fire'; A.t = 0; } return false; }
    if (A.phase === 'fire') { if (A.t >= 1.1) { A.phase = 'rec'; A.t = 0; A.exposed = true; } return false; }
    if (A.phase === 'rec') { if (A.t >= 2.3 / Math.sqrt(k)) { A.phase = 'back'; A.t = 0; A.exposed = false; } return false; }
    return A.t >= 0.4; }
  function mouthFloor(FX, m, a) { return { x: m.x + Math.cos(a) * 2.0, y: m.y + Math.sin(a) * 2.0 }; }
  function breathFire(FX, m, A, s) { const M = FX.mem; if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.breathHit++; sf(FX, 'crash'); FX.H.shake(8, 0.5);
    FX.hz({ shape: 'cone', x: s.x, y: s.y, a: s.a, len: BR_LEN, spread: BR_SP, life: 1.1, dps: m.dmg * 0.55, tick: 0.25, col: WARN, draw() {} });
    M.fx.push({ kind: 'gout', x: s.x, y: s.y, a: s.a, t: 0, life: 1.25 }); }
  /* ---- Fault Line: he drives a claw into the floor; a glowing crack runs out in a straight line, then erupts ---- */
  const FL_W = 1.3, FL_V = 7.5;
  function faultTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, k = sp(FX), W = 1.05 / k;
    if (A.phase === 'wind') { face(FX, m, me.x, me.y, dt, 2.4); if (A.t >= W) { A.phase = 'run'; A.t = 0; const a = Math.atan2(me.y - m.y, me.x - m.x), x0 = m.x + Math.cos(a) * 1.9, y0 = m.y + Math.sin(a) * 1.9; let L = 15; for (let i = 0; i < 40; i++) { if (FX.inArena(x0 + Math.cos(a) * L, y0 + Math.sin(a) * L, 0.6)) break; L -= 0.4; }
        const run = L / FL_V; A.line = { x: x0, y: y0, a, len: L, run };
        A.tele = FX.tele({ shape: 'line', x: x0, y: y0, a, len: L, w: FL_W, t: run + 0.65, dmg: m.dmg * 1.0, label: '', fn: s => { if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.faultHit++; M.fx.push({ kind: 'erupt', x: s.x, y: s.y, a: s.a, len: s.len, t: 0, life: 0.9 }); sf(FX, 'crash'); FX.H.shake(10, 0.4); } });
        groundFx(FX, { fx: 'crack', x: x0, y: y0, a, len: L, run, life: run + 1.6, seed: Math.random() * 50 }); FX.H.boom(x0, y0, 1.0, HOT, '#FFE2B0', { n: 10, shake: 8, smoke: 4 }); sf(FX, 'crack'); } return false; }
    if (A.phase === 'run') { if (A.t >= A.line.run + 0.65) { A.phase = 'back'; A.t = 0; } return false; }
    return A.t >= 1.0; }
  /* ---- Burning Cleave: the right arm drawn back across the body, then one broad sweep in front ---- */
  const CV_LEN = 6.8, CV_SP = 1.18;
  function cleaveTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, k = sp(FX);
    if (!A.tele) { const d = Math.hypot(me.x - m.x, me.y - m.y); if (d > 5.6 && A.t < 3) { walk(FX, m, me.x, me.y, 2.0, dt); footfalls(FX, m, M); face(FX, m, me.x, me.y, dt); return false; }
      A.t = 0; A.W = 2.0 / k; A.a = Math.atan2(me.y - m.y, me.x - m.x); A.tele = FX.tele({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: CV_LEN, spread: CV_SP, t: A.W + 0.2, dmg: m.dmg * 1.1, label: '', fn: s => { if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.cleaveHit++; sf(FX, 'whoosh'); FX.H.shake(9, 0.3); } }); sf(FX, 'hum'); }
    aimAt(FX, m, A.a);
    if (A.phase === 'wind') { if (A.t >= A.W) { A.phase = 'sweep'; A.t = 0; M.fx.push({ kind: 'arc', x: m.x, y: m.y, a: A.a, t: 0, life: 0.8 }); } return false; }
    if (A.phase === 'sweep') { if (A.t >= 0.5) { A.phase = 'back'; A.t = 0; } return false; }
    return A.t >= 1.5 / Math.sqrt(k); }
  /* ---- falling lava rocks: he roars up at the caldera, and a few marked rocks come down round the pet ---- */
  function rocksTick(FX, m, A, dt) { const M = FX.mem, me = FX.me;
    face(FX, m, me.x, me.y, dt);
    if (A.phase === 'wind' && A.t >= 0.9) { A.phase = 'fall'; A.t = 0; const n = FX.S.lv >= 3 ? 6 : 5, pts = [{ x: me.x, y: me.y }]; let tries = 0;
      while (pts.length < n && tries++ < 200) { const a = Math.random() * TAU, r = 2.2 + Math.random() * 4.6, p = { x: me.x + Math.cos(a) * r, y: me.y + Math.sin(a) * r }; if (!FX.inArena(p.x, p.y, 1.6)) continue; if (pts.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 2.6)) continue; if (Math.hypot(p.x - m.x, p.y - m.y) < 2.5) continue; pts.push(p); }
      pts.forEach((p, i) => { const tt = 1.9 + i * 0.3, rock = { x: p.x, y: p.y, t: 0, T: tt, seed: Math.random() * 50, done: false }; M.rocks.push(rock);
        FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.35, t: tt, dmg: m.dmg * 0.8, label: '', fn: s => { rock.done = true; if (FX.inShape(s, FX.me.x, FX.me.y, FX.me.r)) M.stat.rockHit++; FX.H.boom(s.x, s.y, 1.3, WARN, '#FFD9A0', { n: 14, shake: 7, smoke: 4 }); sf(FX, 'thud'); groundFx(FX, { fx: 'scar', x: s.x, y: s.y, r: 1.1, life: 2.2, seed: Math.random() * 50 }); } }); });
      sf(FX, 'whoosh'); return false; }
    if (A.phase === 'fall') return A.t >= 1.2;
    return false; }
  /* ---- Hellfire: hands planted, an 8 s charge; the floor warns, the lava climbs, the wells wake; the wall of flame
     crosses the arena; the refuge protects; then he overheats and kneels ---- */
  function hellTick(FX, m, A, dt) { const M = FX.mem, me = FX.me, C = FX.C;
    if (A.phase === 'wind') { A.phase = 'charge'; A.t = 0; A.hit = false; M.stat.hellSafe0 = M.stat.hellSafe; wake(FX, true); groundFx(FX, { fx: 'hellwarn', x: FX.C.x, y: FX.C.y, life: TUNE.hellCharge + 0.35 });
      say(FX, 'hell', 'HELLFIRE', 'Take shelter: stand still beside a frost well', FROST_HI, 3.0); FX.H.flash(0.3, WARN); sf(FX, 'hum'); FX.H.shake(10, 1.0); }
    if (A.phase === 'charge') { A.left = TUNE.hellCharge - A.t; if (Math.random() < dt * 6) FX.H.shake(3 + 6 * cl(A.t / TUNE.hellCharge), 0.2);
      if (Math.floor(A.left) !== A.lastS && A.left > 0) { A.lastS = Math.floor(A.left); if (A.lastS <= 3) sf(FX, 'tick'); }
      if (A.t >= TUNE.hellCharge) { A.phase = 'wall'; A.t = 0; M.stat.walls = (M.stat.walls || 0) + 1; A.y = C.y - AR - 1.5; FX.H.flash(0.5, '#FFD9A0'); sf(FX, 'crash'); FX.H.shake(18, 2.6); } return false; }
    if (A.phase === 'wall') { const v = 11.5; A.y += v * dt;
      if (!A.hit && !me.dead && Math.abs(me.y - A.y) < 1.15 + me.r) { if (sheltered(FX, me.x, me.y)) { if (!A.safe) { A.safe = true; M.stat.hellSafe++; FX.H.text(me.x, me.y - 1.6, 'Sheltered!', FROST_HI, 15); sf(FX, 'chime', 1046, 0.6); } }
        else { A.hit = true; M.stat.hellHit++; const s2 = ST(FX), mx = s2 ? s2.hp : 100; let d = mx * TUNE.missK; if (me.hp >= mx * 0.97) d = Math.min(d, me.hp - 1); FX.H.hurtPet(d, m, { hellfire: true }); FX.H.text(me.x, me.y - 1.8, 'Caught by Hellfire!', WARN, 15); } }
      if (A.y > C.y + AR + 2) { A.phase = 'over'; A.t = 0; wake(FX, false, true); M.stat.kneel++; m.stunT = TUNE.kneel; M.stunKind = 'kneel'; M.flinch = 1; FX.H.after(0.6, () => { if (!m.dead) { sf(FX, 'thud'); if (!lowFx()) FX.H.shake(5, 0.3); } }); FX.H.text(m.x, m.y - 5, 'Overheated! His core is open', HOT, 16); sf(FX, 'hum'); return true; }
      return false; }
    return true; }
  /* ---- the frost wells ---- */
  function wellsOf(FX) { const M = FX.mem, mod = modOf(FX); if (mod && mod.wells) { M.wells = mod.wells; return M.wells; } if (!M.wells) M.wells = ARENA.wells(FX.C).map(w => ({ i: w.i, x: w.x, y: w.y, awake: false, on: false, ch: 0, used: false, own: true, k: 0, onK: 0 })); return M.wells; }
  function wake(FX, on, after) { const M = FX.mem; for (const w of wellsOf(FX)) { if (on) { w.awake = true; w.on = false; w.used = false; w.ready = true; } else { w.awake = false; if (after) { w.offT = 1.0; } else w.on = false; } } if (on) sf(FX, 'chime', 1318, 0.5); }
  function useWell(FX, w) { if (!w.awake || w.on) return false; w.on = true; w.ready = false; FX.H.text(w.x, w.y - 1.6, 'Cold refuge!', FROST_HI, 16); sf(FX, 'chime', 1568, 0.7); FX.H.ring(w.x, w.y, 0.3, ARENA.REFUGE, 0.6, FROST, 0.35); for (let i = 0; i < 14; i++) { const a = Math.random() * TAU; FX.H.part({ kind: 'snow', x: w.x + Math.cos(a) * 1.2, y: w.y + Math.sin(a) * 1.2, vx: Math.cos(a) * 2, vy: Math.sin(a) * 2 - 1, life: 1.2, max: 1.2, size: 2 + Math.random() * 2 }); } return true; }
  function sheltered(FX, x, y) { for (const w of wellsOf(FX)) if (w.on && Math.hypot(x - w.x, y - w.y) < ARENA.REFUGE) return true; return false; }
  function wellsTick(FX, m, dt) { const M = FX.mem, me = FX.me;
    for (const w of wellsOf(FX)) { w.k = toward(w.k, w.awake || w.on ? 1 : 0, dt, 3); w.onK = toward(w.onK, w.on ? 1 : 0, dt, 4); if (w.offT > 0) { w.offT -= dt; if (w.offT <= 0) w.on = false; }
      // (without the stage's objects, the well's own channel: stand still beside it for 0.75 s)
      if (w.own) { const d = Math.hypot(me.x - w.x, me.y - w.y), moving = Math.abs(me.vx || 0) + Math.abs(me.vy || 0) > 0.3; if (w.awake && !w.on && d < 1.75 && !moving && !me.dead) { w.ch += dt; if (w.ch >= 0.75) { w.ch = 0; useWell(FX, w); } } else w.ch = 0; } } }
  /* ---- the fall: the core dims, he settles into a dark statue, the lava calms, the crystals go dark ---- */
  function deadTick(FX, m, dt) { const M = FX.mem;
    if (M.deadT == null) { M.deadT = 0; M.A = null; FX.weak('chest', 0, 0, 0, 0, false); FX.noParts(); for (const w of wellsOf(FX)) { w.awake = false; w.on = false; } for (const cr of M.crys) { if (cr.alive) { cr.alive = false; cr.broken = true; } } M.rocks.length = 0;
      M.statue = { kind: 'statue', x: m.x, y: m.y + 0.31 }; FX.S.props.push(M.statue); M.flinch = 1; FX.H.text(m.x, m.y - 5, 'The core dims...', HOT, 15); }
    M.deadT += dt; M.calm = toward(M.calm, 1, dt, 0.8); for (const w of wellsOf(FX)) { w.k = toward(w.k, 0, dt, 3); w.onK = toward(w.onK, 0, dt, 3); } for (const cr of M.crys) cr.glow = toward(cr.glow, 0, dt, 1.2);
    if (Math.random() < dt * 4 * (1 - cl(M.deadT / 4))) steam(FX, m); }
  /* ---- the pose: each act's wanted pose, eased ---- */
  const RATE = { sway: 2, aim: 3, tilt: 2, arch: 2.5, menace: 1.5, claw: 4, drag: 2.5, cleaveR: 6, sit: 1.4, crouch: 5, kneel: 2.5, plant: 3, lean: 4, twist: 4, liftL: 4, liftR: 4, slamL: 9, slamR: 9, fistL: 8, fistR: 8, cleaveW: 4, cleaveS: 14, breath: 4, jaw: 7, inhale: 2.4, open: 4, gaitK: 4, look: 4, nod: 3, shout: 3.5, recoil: 6, heat: 2, flare: 2.5, bfL: 2, bfR: 2, frac: 99, cracks: 2, dead: 1.3 };
  function poseOf(FX, m, M) { const W = blankPose(), A = M.A, lv = FX.S.lv, me = FX.me, L = M.loco, t = M.bt || 0, k = sp(FX); W._snap = {};
    const snap = (key, v) => { W[key] = v; W._snap[key] = true; };
    W.heat = lv >= 3 ? 1.35 : lv === 2 ? 0.9 : 0.7; W.flare = lv === 2 ? 1 : lv >= 3 ? 0.6 : 0;
    const crys = M.crys || []; if (lv === 2) for (const cr of crys) if (cr.alive) W[crySide(m, M, cr) > 0 ? 'bfR' : 'bfL'] = 1;
    W.frac = M.fracT >= 0 ? cl((M.fracT - 0.25) / 1.3) : 0; W.cracks = M.fracT >= 0 ? cl(M.fracT * 4) : 0;
    W.gaitK = cl((M.spd || 0) / 1.7); W.gait = M.gait || 0;
    // the torso turned ahead of the hips toward his aim; the head ahead of both, locked on the pet
    if (L) { W.aim = clamp2(angTo(M.th, L.aim), -0.55, 0.55); W.look = clamp2(angTo(M.th + W.aim, Math.atan2(me.y - m.y, me.x - m.x)), -0.6, 0.6); }
    // the breath: slow and deep, the chest swelling and the core and seams brightening on the inhale
    const inh = 0.5 + 0.5 * Math.sin(t * TAU / 4.6); W.inhale = 0.32 * inh; W.heat += 0.16 * inh;
    W.recoil = Math.min(0.6, (M.flinch || 0) * 0.75); W.recoilS = M.recoilS || 1;
    // the third act: hunched and predatory, a hand trailing along the floor as he prowls
    if (lv >= 3) { W.lean = 0.16; W.crouch = 0.2; W.drag = 0.7 * W.gaitK; W.claw = 0.5; }
    if (m.act === 'enter') { W.sit = 1; snap('sit', 1); W.heat = 0.15 + 0.08 * Math.sin(t * 1.3); W.nod = 0.25; W.inhale = 0.15 * inh; W.look = 0; W.aim = 0; return W; }
    if (m.act === 'rise') { const e = m.actT, up = cl((e - 1.4) / 1.5);
      snap('sit', 1 - ease(up)); W.heat = e < 1.4 ? 0.15 + 0.9 * sstep(0.1, 1.2, e) : 0.8; W.inhale = e < 2.6 ? sstep(0.1, 1.1, e) * (1 - 0.5 * up) : 0.3 * inh;
      W.nod = -0.12 * (1 - up); W.arch = 0.22 * sstep(0.2, 1.2, e) * (1 - up); W.lean = 0.42 * Math.sin(Math.PI * up); W.claw = 0.6 * up;
      if (e > 2.7 && e < 3.6) { W.shout = 0.85; W.jaw = 1; W.arch = 0.25; } return W; }
    if (m.dead) { W.kneel = 1; W.dead = cl((M.deadT || 0) / 3.2); W.heat = 0.9 * (1 - cl((M.deadT || 0) / 2.5)); W.frac = M.P.frac; W.flare = 0; W.aim = 0; W.look = 0; W.inhale = 0; return W; }
    // a new phase: he staggers under it, then roars
    if (M.phT != null && M.phT < 2.25) { const pt = M.phT; if (pt < 0.6) { W.recoil = 1; W.crouch = 0.55; W.kneel = 0.3 * Math.sin(Math.PI * pt / 0.6); W.lean = -0.08; }
      else { W.shout = 1; W.jaw = 1; W.arch = 0.32; W.heat += 0.6; W.flare = 1; W.crouch = 0.12; W.claw = 1; } return W; }
    if (m.stunT > 0 && M.stunKind === 'kneel') { W.kneel = 1; W.heat = 2.0; W.open = 0.7; W.nod = 0.3; W.inhale = 0.5 + 0.5 * Math.sin(t * 4); W.gaitK = 0; W.claw = 0.6; W.lean = 0.05; return W; }
    if (m.stunT > 0 && M.stunKind === 'stagger') { W.recoil = 1; W.kneel = 0.5; W.crouch = 0.3; W.open = 0.5; W.gaitK = 0; return W; }
    if (m.stunT > 0) { W.recoil = 0.75; W.crouch = 0.28; W.gaitK = 0; W.claw = 0.5; W.inhale = 0.3 + 0.3 * Math.sin(t * 3); W.shout = 0.2; return W; }   // (held by the pet's stun: braced and straining against it, not dropping to a knee)
    if (!A) { // the idle's menace: shoulders rolling, claws flexing, the head cocked as he studies the pet; a knuckle-crack now and then
      const still = 1 - W.gaitK * 0.7; W.menace = still; W.tilt = 0.26 * Math.sin(t * 0.45) * still; W.sway = 0.65 * Math.sin(t * TAU / 6.5) * still; W.twist = 0.1 * Math.sin(t * TAU / 5.3 + 1) * still; W.lean += 0.06 * Math.sin(t * TAU / 4.6) * still; W.claw = Math.max(W.claw, 0.3 + 0.25 * Math.sin(t * 1.1)); if (M.crackT > 0) W.fistR = 1; return W; }
    const side = A.side || 1, sn = side < 0 ? 'L' : 'R';
    if (A.kind === 'fist') {
      if (A.phase === 'wind' && A.tele) { const Wd = A.W, up = ease(cl(A.t / (0.55 * Wd))), s1 = cl((A.t - 0.8 * Wd) / (0.2 * Wd)), b = toBody(A.at.x, A.at.y, m.x, m.y, MODEL.headOf(M.th), 1);
        // he gathers (a dip), rises up onto the blow and hangs there, weight thrown back; then all of it comes down
        snap('lift' + sn, up * (1 - s1)); snap('slam' + sn, s1 * s1); W['fist' + sn] = 1;
        W.crouch = 0.28 * (1 - up) * cl(A.t / 0.2) + 0.4 * s1; W.lean = -0.22 * up * (1 - s1) + 0.12 * s1; W.inhale = up; W.heat += 0.4 * up; W.twist = side * (-0.18 * up * (1 - s1) + 0.2 * s1);
        if (up > 0.95 && s1 <= 0) W.tilt = 0.025 * Math.sin(t * 31);
        snap('slamX', clamp2(b[0], 1.6, 3.6)); snap('slamY', clamp2(b[1], -1.8, 1.8)); }
      else if (A.phase === 'rec') { const b = toBody(A.at.x, A.at.y, m.x, m.y, MODEL.headOf(M.th), 1); snap('slam' + sn, 1); W['fist' + sn] = 1; W.open = 1; W.heat += 0.25; snap('slamX', clamp2(b[0], 1.6, 3.6)); snap('slamY', clamp2(b[1], -1.8, 1.8));
        W.crouch = 0.3 + 0.35 * Math.exp(-A.t * 4); W.lean = 0.1; W.twist = side * 0.2; W.inhale = 0.5 + 0.5 * Math.sin(t * 3); W.claw = 0.8; }
      else if (A.phase === 'back') { const u = ease(cl(A.t / 0.5)); snap('slam' + sn, 1 - u); W['fist' + sn] = u < 0.6 ? 1 : 0; W.crouch = 0.3 * (1 - u); W.open = 0.4 * (1 - u); W.twist = side * 0.2 * (1 - u); } }
    else if (A.kind === 'breath') { const track = 1.55 / k, lock = 0.75 / k;
      if (A.phase === 'wind') { if (A.t < track) { const r = ease(cl(A.t / 0.9)); W.lean = -0.24 * r; W.shout = 0.35 * r; W.inhale = 1; W.open = 0.35 * r; W.heat += 0.65 * r; W.jaw = 0.15 * r; W.claw = 0.7; }
        else { const q = cl((A.t - track) / lock); W.lean = -0.24 + 0.36 * q * q; W.shout = 0.35 * (1 - q); W.inhale = 1; W.open = 0.35; W.heat += 0.65; W.jaw = 0.25 + 0.3 * q; W.breath = 0.45 * q; W.claw = 0.7; } }
      else if (A.phase === 'fire') { W.breath = 1; W.jaw = 1; W.lean = 0.24; W.crouch = 0.22; W.heat += 0.75; W.open = 0.3; W.claw = 0.9; }
      else if (A.phase === 'rec') { W.open = 1; W.inhale = 0.5 + 0.5 * Math.sin(t * 5); W.jaw = 0.4; W.nod = 0.18; W.crouch = 0.3; W.lean = 0.12; } }
    else if (A.kind === 'fault') { const Wd = 1.05 / k;
      if (A.phase === 'wind') { const u = A.t / Wd; if (u < 0.55) { const r = ease(u / 0.55); W.liftR = 0.55 * r; W.crouch = 0.4 * r; W.twist = 0.3 * r; W.lean = -0.08; W.claw = 1; }
        else { const v = ease((u - 0.55) / 0.45); snap('slamR', v); W.liftR = 0.55 * (1 - v); snap('slamX', 2.7 - 0.3 * v); snap('slamY', 0.7); W.crouch = 0.45; W.lean = 0.3 * v; W.twist = 0.3 - 0.4 * v; W.claw = 1; } }
      else if (A.phase === 'run') { const r = ease(cl(A.t / 0.55)), rel = ease(cl((A.t - 0.6) / 0.5)); snap('slamR', 1 - rel); snap('slamX', 2.4 - 1.3 * r); snap('slamY', 0.7); W.crouch = 0.45 - 0.25 * r; W.lean = 0.3 * (1 - rel); W.twist = -0.1; W.claw = 1; } }
    else if (A.kind === 'cleave') {
      if (A.phase === 'wind' && A.tele) { const c = ease(cl(A.t / (0.75 * A.W))); snap('cleaveW', c); W.twist = 0.7 * c; W.lean = -0.12 * c; W.crouch = 0.28 * c; W.heat += 0.35 * c; if (A.t > 0.75 * A.W) W.tilt = 0.02 * Math.sin(t * 29); }
      else if (A.phase === 'sweep') { const q = cl(A.t / 0.32), e = q < 0.5 ? 2 * q * q : 1 - 2 * (1 - q) * (1 - q); snap('cleaveW', 1); snap('cleaveS', e); snap('twist', 0.7 - 1.35 * e); W.lean = 0.22 * e; W.crouch = 0.28; }
      else if (A.phase === 'back') { const r = cl(A.t / (1.5 / Math.sqrt(k))); snap('cleaveW', 1); snap('cleaveS', 1); snap('cleaveR', ease(cl((A.t - 0.25) / 0.85))); snap('twist', -0.65 * (1 - ease(r))); W.lean = 0.2 * (1 - r); W.crouch = 0.28 * (1 - r); } }
    else if (A.kind === 'rocks') { if (A.phase === 'wind') { const r = ease(cl(A.t / 0.6)); W.shout = r; W.jaw = r; W.arch = 0.4 * r; W.heat += 0.35; W.claw = 1; } else { const r = 1 - ease(cl(A.t / 0.9)); W.shout = r; W.jaw = r; W.arch = 0.4 * r; } }
    else if (A.kind === 'hellfire') {
      if (A.phase === 'charge') { const e = cl(A.t / TUNE.hellCharge), hv = Math.sin(t * 2.6); W.plant = 1; W.arch = 0.25 + 0.35 * ease(cl((A.t - 0.8) / 2.5)); W.shout = 0.6 + 0.2 * hv; W.jaw = 0.75 + 0.25 * hv; W.inhale = 0.5 + 0.5 * Math.sin(t * TAU / 1.3); W.heat = 1.4 + 0.8 * e; W.flare = 1; W.aim = 0; }
      else if (A.phase === 'wall') { W.plant = 1; W.shout = 1; W.arch = 0.7; W.jaw = 1; W.heat = 2.2; W.aim = 0; } }
    return W; }
  const clamp2 = (v, a, b) => v < a ? a : v > b ? b : v;
  /* which side of him a growth stands on (its tether goes to that shoulder, and that side's armour carries its fire) */
  function crySide(m, M, cr) { return toBody(cr.x, cr.y, m.x, m.y, MODEL.headOf(M.th))[1] > 0 ? 1 : -1; }
  function flinch(FX, m, k) { const M = FX.mem; if (!(M.flinch > 0.08)) M.recoilS = FX.me.x < m.x ? 1 : -1; M.flinch = Math.min(1, (M.flinch || 0) + k); }
  function easePose(FX, m, dt) { const M = FX.mem, W = poseOf(FX, m, M), P = M.P, sn = W._snap || {};
    for (const k in RATE) { const w = W[k] == null ? 0 : W[k]; P[k] = sn[k] ? w : toward(P[k], w, dt, RATE[k]); }
    P.slamX = sn.slamX ? W.slamX : toward(P.slamX, W.slamX, dt, 8); P.slamY = sn.slamY ? W.slamY : toward(P.slamY, W.slamY, dt, 8); P.gait = W.gait; P.recoilS = W.recoilS || P.recoilS || 1;
    if (!(W.cleaveS > 0) && P.cleaveR > 0.85) { P.cleaveS = 0; P.cleaveR = 0; P.cleaveW = 0; }   // (the cleave's arm is home: its sweep put away without running back)
    M.flinch = Math.max(0, (M.flinch || 0) - dt * 1.3);
    locoPose(FX, m, M, P);
    for (let i = M.fx.length - 1; i >= 0; i--) { const f = M.fx[i]; f.t += dt; if (f.t >= f.life) M.fx.splice(i, 1); }
    for (let i = M.rocks.length - 1; i >= 0; i--) { const r = M.rocks[i]; r.t += dt; if (r.done || r.t > r.T + 0.2) M.rocks.splice(i, 1); } }
  /* ================= the painting ================= */
  const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  const gl2 = (c, x, y, r, col, a) => { if (!(r > 0) || !(a > 0.003)) return; if (typeof glowSprite === 'function' && typeof blitSized === 'function') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); } else { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); } };
  const fg = () => { try { if (typeof window !== 'undefined' && window.__IFRIT_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  /* a snowflake emblem: six arms, each with two pairs of branches (the frost wells' mark, as in Fire Flan's arena) */
  function snowflake(c, x, y, r, col, lw) { c.save(); c.translate(x, y); c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(0, 0); c.lineTo(ca * r, sa * r);
      for (const [u, l] of [[0.45, 0.32], [0.72, 0.22]]) for (const sg of [-1, 1]) { const b = a + sg * 0.75; c.moveTo(ca * r * u, sa * r * u); c.lineTo(ca * r * u + Math.cos(b) * r * l, sa * r * u + Math.sin(b) * r * l); } }
    c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.13, 0, TAU); c.fillStyle = col; c.fill(); c.restore(); }
  /* ---- the platform (painted once per zoom, world units centred on the arena): columnar basalt tops, a broken rim,
     the lava moat beyond; the cracked ring of basalt round the throne; the growths' scorched feet; a few deep-red seams
     (kept dim, so nothing on the floor reads as a warning but the warnings) ---- */
  function paintFloor(c, A2) { const R = A2.R, rnd = A2.rnd;
    // the moat
    let g = c.createRadialGradient(0, 0, R - 0.4, 0, 0, R + 1.6); g.addColorStop(0, '#FF8A2A'); g.addColorStop(0.35, '#E04A10'); g.addColorStop(0.75, '#7A1A06'); g.addColorStop(1, '#2A0A04'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.6, 0, TAU); c.fill();
    for (let i = 0; i < 70; i++) { const a = rnd() * TAU, d = R + 0.35 + rnd() * 1.1, s = 0.2 + rnd() * 0.45; c.fillStyle = `rgba(30,10,6,${0.45 + rnd() * 0.4})`; c.beginPath(); for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + rnd() * 0.5, rr = s * (0.6 + rnd() * 0.5); const px = Math.cos(a) * d + Math.cos(b) * rr, py = Math.sin(a) * d + Math.sin(b) * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill(); }
    // the floor: hexagonal column tops, each its own shade, dark joints between
    c.save(); c.beginPath(); c.arc(0, 0, R - 0.05, 0, TAU); c.clip();
    c.fillStyle = '#2B2321'; c.fillRect(-R, -R, R * 2, R * 2);
    const hs = 0.92, hw = hs * Math.sqrt(3);
    for (let row = -Math.ceil(R / (hs * 1.5)) - 1; row <= Math.ceil(R / (hs * 1.5)) + 1; row++) for (let col = -Math.ceil(R / hw) - 1; col <= Math.ceil(R / hw) + 1; col++) {
      const cx = col * hw + (row & 1 ? hw / 2 : 0), cy = row * hs * 1.5, d = Math.hypot(cx, cy); if (d > R + 1) continue;
      const v = rnd(), warm = rnd(), ash = cy < -R * 0.6 ? 0.06 : 0, base = 50 + v * 22 + ash * 60;
      c.fillStyle = `rgb(${Math.round(base + 6 + warm * 6)},${Math.round(base - 4)},${Math.round(base - 8)})`;
      c.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k / 6 * TAU, rr = hs * (0.9 + rnd() * 0.06); const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.closePath(); c.fill();
      // a soft lit face and a dark lower edge (each column a hair proud of the next)
      const gr = c.createLinearGradient(cx, cy - hs, cx, cy + hs); gr.addColorStop(0, 'rgba(255,230,210,.07)'); gr.addColorStop(0.6, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.28)'); c.fillStyle = gr; c.fill();
      c.strokeStyle = 'rgba(12,6,5,.75)'; c.lineWidth = 0.075; c.stroke();
      if (rnd() < 0.22) { c.strokeStyle = 'rgba(10,5,4,.55)'; c.lineWidth = 0.035; c.beginPath(); let px = cx + (rnd() - 0.5) * hs, py = cy + (rnd() - 0.5) * hs; c.moveTo(px, py); for (let k = 0; k < 3; k++) { px += (rnd() - 0.5) * hs * 0.9; py += (rnd() - 0.5) * hs * 0.9; c.lineTo(px, py); } c.stroke(); }
      if (rnd() < 0.18) { c.fillStyle = `rgba(0,0,0,${0.12 + rnd() * 0.15})`; c.beginPath(); c.ellipse(cx + (rnd() - 0.5) * hs * 0.6, cy + (rnd() - 0.5) * hs * 0.6, hs * 0.5, hs * 0.35, rnd() * 3, 0, TAU); c.fill(); } }
    // soot pooled toward the rim, a faint warm sheen toward the moat
    g = c.createRadialGradient(0, 0, R * 0.35, 0, 0, R); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.8, 'rgba(8,3,2,.18)'); g.addColorStop(1, 'rgba(255,90,20,.16)'); c.fillStyle = g; c.fillRect(-R, -R, R * 2, R * 2);
    // a few deep seams of old heat (dim red, thin)
    for (let i = 0; i < 7; i++) { let a = rnd() * TAU, d = 3 + rnd() * (R - 5), px = Math.cos(a) * d, py = Math.sin(a) * d; c.beginPath(); c.moveTo(px, py); for (let k = 0; k < 7; k++) { a += (rnd() - 0.5) * 1.1; px += Math.cos(a) * 0.7; py += Math.sin(a) * 0.7; c.lineTo(px, py); }
      c.strokeStyle = 'rgba(60,8,4,.7)'; c.lineWidth = 0.14; c.stroke(); c.strokeStyle = 'rgba(200,50,14,.32)'; c.lineWidth = 0.05; c.stroke(); }
    // the cracked ring round the throne (north), and the growths' scorched feet
    const Ty = -R + 1.25; c.strokeStyle = 'rgba(14,7,6,.85)'; c.lineWidth = 0.55; c.beginPath(); c.arc(0, Ty, 3.6, 0.15, Math.PI - 0.15); c.stroke(); c.strokeStyle = 'rgba(92,76,70,.6)'; c.lineWidth = 0.32; c.beginPath(); c.arc(0, Ty, 3.6, 0.15, Math.PI - 0.15); c.stroke();
    for (let k = 0; k < 12; k++) { const a = 0.2 + k / 11 * (Math.PI - 0.4); c.strokeStyle = 'rgba(10,4,3,.9)'; c.lineWidth = 0.07; c.beginPath(); c.moveTo(Math.cos(a) * 3.3, Ty + Math.sin(a) * 3.3); c.lineTo(Math.cos(a + 0.03) * 3.95, Ty + Math.sin(a + 0.03) * 3.95); c.stroke(); }
    for (const cr of ARENA.crystals({ x: 0, y: 0 })) { g = c.createRadialGradient(cr.x, cr.y, 0, cr.x, cr.y, 2.4); g.addColorStop(0, 'rgba(12,4,18,.75)'); g.addColorStop(0.6, 'rgba(30,8,40,.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(cr.x, cr.y, 2.4, 0, TAU); c.fill(); }
    for (const w of ARENA.wells({ x: 0, y: 0 })) { g = c.createRadialGradient(w.x, w.y, 0.8, w.x, w.y, 3.2); g.addColorStop(0, 'rgba(190,230,255,.22)'); g.addColorStop(0.55, 'rgba(150,200,240,.08)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(w.x, w.y, 3.2, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(210,240,255,.18)'; c.lineWidth = 0.04; for (let k = 0; k < 9; k++) { const a = k / 9 * TAU + rnd() * 0.3; c.beginPath(); c.moveTo(w.x + Math.cos(a) * 1.2, w.y + Math.sin(a) * 1.2); c.lineTo(w.x + Math.cos(a) * (2.0 + rnd()), w.y + Math.sin(a) * (2.0 + rnd())); c.stroke(); } }
    c.restore();
    // the rim: a ring of broken basalt blocks, lit orange from the moat below
    for (let i = 0; i < 64; i++) { const a0 = i / 64 * TAU, a1 = a0 + TAU / 64 * (0.82 + rnd() * 0.1), r0 = R - 0.55 - rnd() * 0.15, r1 = R + 0.08 + rnd() * 0.12;
      c.beginPath(); c.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); c.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0); c.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1); c.lineTo(Math.cos(a0) * r1, Math.sin(a0) * r1); c.closePath();
      const sh = 38 + rnd() * 16; c.fillStyle = `rgb(${sh + 8},${sh},${sh - 4})`; c.fill(); c.strokeStyle = 'rgba(10,4,3,.85)'; c.lineWidth = 0.06; c.stroke();
      c.strokeStyle = 'rgba(255,120,40,.45)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(Math.cos(a0) * r1, Math.sin(a0) * r1); c.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1); c.stroke(); } }
  /* ---- the caldera beyond (a still backdrop): the crater's walls, its smoke, the glow of the lava far below ---- */
  function paintCaldera(c, W, H, T) { const rnd = mulb(31);
    let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120605'); g.addColorStop(0.45, '#2A0B06'); g.addColorStop(0.8, '#4A1408'); g.addColorStop(1, '#1A0604'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    // the far walls: three ranks of jagged rock, nearer ones darker, rivulets of lava down their faces
    for (let rank = 0; rank < 3; rank++) { const y0 = H * (0.16 + rank * 0.1), col = ['#2A100C', '#1C0A08', '#120605'][rank]; c.fillStyle = col; c.beginPath(); c.moveTo(0, H); let x = -10; c.lineTo(x, y0);
      while (x < W + 20) { x += 14 + rnd() * 30; c.lineTo(x, y0 - rnd() * H * 0.08 + (rnd() < 0.15 ? -H * 0.05 : 0)); } c.lineTo(W + 20, H); c.closePath(); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6 + rank * 2; i++) { let rx = rnd() * W, ry = y0 + rnd() * 20; c.strokeStyle = `rgba(255,${80 + rnd() * 60},20,${0.18 + rank * 0.06})`; c.lineWidth = 1 + rank; c.beginPath(); c.moveTo(rx, ry); for (let k = 0; k < 8; k++) { rx += (rnd() - 0.5) * 8; ry += 8 + rnd() * 12; c.lineTo(rx, ry); } c.stroke(); } c.restore(); }
    // smoke banks and the lava's glow under them
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) gl2(c, rnd() * W, H * (0.55 + rnd() * 0.4), W * (0.25 + rnd() * 0.2), '#FF5A14', 0.14); c.restore();
    for (let i = 0; i < 14; i++) { const x = rnd() * W, y = H * (0.05 + rnd() * 0.3), r = 30 + rnd() * 60; g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(40,24,22,.35)'); g.addColorStop(1, 'rgba(40,24,22,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } }
  function mulb(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* ---- over the ground every frame: the moat's flowing light, the lavafalls down the caldera walls (north), the lava
     climbing the walls during Hellfire, distant eruptions; all of it outside the platform, never over its floor ---- */
  const FALLS = [-2.55, -2.1, -1.72, -1.4, -1.0, -0.6, 2.4, 0.75];
  function drawOverlay(c, FX, t, T) { const C = FX.C, M = FX.mem || {}, calm = M.calm || 0, climb = M.climb || 0, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), R = C.R * T, cv = c.canvas, m0 = c.getTransform(), W = cv.width / (m0.a || 1), H = cv.height / (m0.d || 1), sx0 = -m0.e / (m0.a || 1), sy0 = -m0.f / (m0.d || 1);
    const lf = lowFx(), act = 1 - 0.7 * calm;
    c.save(); c.beginPath(); c.rect(sx0 - 10, sy0 - 10, W + 20, H + 20); c.arc(X0, Y0, R - 2, 0, TAU, true); c.clip('evenodd');
    // the moat breathes and flows
    c.globalCompositeOperation = 'lighter';
    const pul = 0.5 + 0.5 * Math.sin(t * 1.3);
    c.strokeStyle = `rgba(255,110,30,${(0.12 + 0.1 * pul) * act + 0.35 * climb})`; c.lineWidth = T * 0.9; c.beginPath(); c.arc(X0, Y0, R + T * 0.75, 0, TAU); c.stroke();
    if (!lf) { c.lineWidth = Math.max(1, T * 0.08); for (let i = 0; i < 3; i++) { const a = t * 0.06 * (i + 1) * (i % 2 ? -1 : 1) + i * 2; c.strokeStyle = `rgba(255,200,90,${0.16 * act})`; c.beginPath(); c.arc(X0, Y0, R + T * (0.45 + i * 0.35), a, a + 1.2); c.stroke(); } }
    // the lava climbing the walls: a hot band rising up the caldera's inner face, from the moat outward
    if (climb > 0.01) { const rr = R + T * (1.6 + climb * 5); const g = c.createRadialGradient(X0, Y0, R + T * 0.8, X0, Y0, rr); g.addColorStop(0, `rgba(255,90,20,${0.55 * climb})`); g.addColorStop(0.7, `rgba(255,60,10,${0.35 * climb})`); g.addColorStop(1, 'rgba(255,40,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(X0, Y0, rr, 0, TAU); c.fill(); }
    // the lavafalls: streams pouring down the walls behind the north rim into the moat
    for (let i = 0; i < FALLS.length; i++) { const a = FALLS[i], bx = X0 + Math.cos(a) * (R + T * 1.1), by = Y0 + Math.sin(a) * (R + T * 1.1); if (by > Y0 - R * 0.1) continue; const top = Math.min(sy0 - 10, by - T * 30), w = T * (0.55 + 0.25 * (i % 3)) * (1 + 0.6 * climb);
      if (bx < sx0 - w * 3 || bx > sx0 + W + w * 3 || by < sy0 - 20) continue;
      const L = by - top, sh = (y, k) => Math.sin(y * 0.02 + t * 1.3 + i * 2) * w * 0.12 * k;
      for (const [kw, a0, a1, c0, c1] of [[1.6, 0.0, 0.16, '255,60,10', '255,90,20'], [1.0, 0.25, 0.5, '255,110,30', '255,150,50'], [0.42, 0.35, 0.8, '255,190,90', '255,236,170']]) {
        const g = c.createLinearGradient(0, top, 0, by); g.addColorStop(0, `rgba(${c0},${a0 * act})`); g.addColorStop(0.6, `rgba(${c0},${(a0 + a1) / 2 * act + 0.2 * climb})`); g.addColorStop(1, `rgba(${c1},${a1 * act + 0.3 * climb})`); c.fillStyle = g;
        c.beginPath(); for (let k = 0; k <= 10; k++) { const y = top + L * k / 10, ww = w * kw * (0.35 + 0.65 * k / 10) / 2; c.lineTo(bx - ww + sh(y, 1), y); } for (let k = 10; k >= 0; k--) { const y = top + L * k / 10, ww = w * kw * (0.35 + 0.65 * k / 10) / 2; c.lineTo(bx + ww + sh(y, 1), y); } c.closePath(); c.fill(); }
      if (!lf) { c.fillStyle = `rgba(255,236,180,${0.3 * act})`; for (let k = 0; k < 5; k++) { const y = top + (((t * (60 + i * 7) * (1 - 0.6 * calm) + k * 97 + i * 31) % (L + 60)) + (L + 60)) % (L + 60), ww = w * (0.35 + 0.65 * (y - top) / L) * 0.18; c.fillRect(bx - ww + sh(y, 1), y, ww * 2, T * 0.8); } }
      gl2(c, bx, by, T * 2.2 * (1 + climb), '#FF6A1E', (0.35 + 0.2 * pul) * act + 0.3 * climb); }
    // distant eruptions: a burst of light and a fountain beyond the rim now and then
    if (!lf && calm < 0.5) { const per = 6.5, k0 = Math.floor(t / per), u = (t / per) % 1; if (u < 0.45) { const r2 = mulb(k0 * 13 + 7), a = -Math.PI * (0.15 + 0.7 * r2()), ex = X0 + Math.cos(a) * (R + T * 6), ey = Y0 + Math.sin(a) * (R + T * 6), e = Math.sin(u / 0.45 * Math.PI);
        gl2(c, ex, ey - T * 2 * e, T * 5 * e, '#FF7A2E', 0.5 * e); for (let j = 0; j < 7; j++) { const b = -Math.PI / 2 + (r2() - 0.5) * 1.2, v = T * (5 + r2() * 5), ut = u / 0.45, px = ex + Math.cos(b) * v * ut, py = ey + Math.sin(b) * v * ut + T * 9 * ut * ut; gl2(c, px, py, T * 0.6, '#FFC27A', 0.6 * (1 - ut)); } } }
    c.restore(); }
  /* ---- the props: the throne, the growths (both rendered once on the GPU at a size and laid down); the statue ---- */
  function drawPropArt(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, o = { T, sx: FX.sx, sy: FX.sy };
    if (p.kind === 'throne') { const k = M.statue ? 0.05 : 0.35; MODEL.drawProp(c, 'throne', p.x, p.y, MODEL.headOf(Math.PI / 2), Object.assign(o, { glow: k, key: 't' + k })); return; }
    if (p.kind === 'crystal') { const cr = (M.crys || [])[p.i] || { glow: 0.28, alive: false, broken: false, pulse: 0 }, g = Math.round(cr.glow * 8) / 8;
      if (!lowFx() && cr.glow > 0.05) { gl2(c, X, Y - T * 0.2, T * 2.6, BF, 0.22 * cr.glow); gl2(c, X, Y - T * 1.3, T * 1.6, '#FF5A1E', 0.12 * cr.glow); }
      MODEL.drawProp(c, cr.broken ? 'crystalBroken' : 'crystal', p.x, p.y, MODEL.headOf(Math.PI / 2 + p.i * 0.7), Object.assign(o, { glow: g, glow2: 0, kind: 1, key: 'c' + g, scale: 0.75 }));
      if (cr.alive && !lowFx()) { // light circling up inside the shards, and flickers of black fire at their feet
        for (let k = 0; k < 3; k++) { const u = (cr.pulse + k / 3) % 1, y = Y - T * (0.3 + u * 2.6), x = X + Math.sin(u * 9 + k) * T * 0.25; gl2(c, x, y, T * 0.45, BF_HI, 0.35 * Math.sin(u * Math.PI)); }
        for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + t * 0.7, x = X + Math.cos(a) * T * 0.8, y = Y + Math.sin(a) * T * 0.4, h = T * (0.6 + 0.35 * Math.sin(t * 5 + k)); c.save(); c.globalCompositeOperation = 'lighter'; const g2 = c.createLinearGradient(x, y, x, y - h); g2.addColorStop(0, 'rgba(120,40,200,.45)'); g2.addColorStop(1, 'rgba(60,10,90,0)'); c.fillStyle = g2; c.beginPath(); c.moveTo(x - T * 0.16, y); c.quadraticCurveTo(x - T * 0.1, y - h * 0.6, x + Math.sin(t * 3 + k) * T * 0.1, y - h); c.quadraticCurveTo(x + T * 0.12, y - h * 0.5, x + T * 0.16, y); c.closePath(); c.fill(); c.restore(); } }
      return; }
    if (p.kind === 'statue' && FX.m) { const m = FX.m; MODEL.draw(c, m.x, m.y, MODEL.headOf(M.th), M.P, { T, sx: FX.sx, sy: FX.sy, t: M.bt }); lights(c, FX, m, M, T); } }
  /* ---- the boss: the model, then its lights laid over (the chest's furnace, the eyes, the mouth, the horns) ---- */
  function demoMem(FX, m) { const M = FX.mem || (FX.mem = {}); if (!M.ok) { M.P = Object.assign(blankPose(), M.P || {}); if (M.th == null) M.th = Math.PI / 2 + 0.25; M.bt = M.bt || 2.0; M.crys = M.crys || []; M.fx = M.fx || []; M.rocks = M.rocks || []; M.demo = 1; } return M; }
  function paintBoss(c, FX, m, X, Y, T, t) { const started = FX.S && FX.S.started, M = started ? FX.mem : demoMem(FX, m); if (!M.P) return;
    const o = { T, sx: v => X + (v - m.x) * T, sy: v => Y + (v - m.y) * T, t: M.bt || t };
    if (!started && M.throne) { const C0 = { x: m.x, y: m.y + AR - 1.62 }, Tp = ARENA.throne(C0); MODEL.drawProp(c, 'throne', Tp.x, Tp.y, MODEL.headOf(Math.PI / 2), { T, sx: o.sx, sy: o.sy, glow: 0.35, key: 'demo' }); }
    MODEL.draw(c, m.x, m.y, MODEL.headOf(M.th == null ? Math.PI / 2 : M.th), M.P, o);
    lights(c, Object.assign({}, FX, { sx: o.sx, sy: o.sy }), m, M, T); }
  function lights(c, FX, m, M, T) { const P = M.P, heat = (P.heat || 0) * (1 - (P.dead || 0)); if (heat < 0.02 || lowFx() && heat < 0.5) return;
    const a = MODEL.headOf(M.th == null ? Math.PI / 2 : M.th), at = n => { const q = MODEL.anchorAt(n, m.x, m.y, a, P, 1, M.bt || 0); return q ? [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T, q] : null; };
    const core = at('chest'), open = Math.max(P.open || 0, P.frac || 0), inh = P.inhale || 0;
    // (the chest faces away when he turns his back: its light only where it shows)
    const fwd = Math.sin(a) > -0.2 ? 1 : 0.25;
    if (core) { gl2(c, core[0], core[1], T * (1.4 + 1.6 * open + 0.8 * inh) * Math.min(1.6, heat), '#FF6A1E', (0.22 + 0.35 * open + 0.25 * inh) * Math.min(1.4, heat) * fwd); gl2(c, core[0], core[1], T * (0.6 + 0.6 * open), '#FFD9A0', (0.1 + 0.4 * open + 0.2 * inh) * Math.min(1.2, heat) * fwd); }
    for (const n of ['eyeL', 'eyeR']) { const e = at(n); if (e) gl2(c, e[0], e[1], T * 0.45, '#FFB347', 0.5 * Math.min(1.3, heat) * fwd); }
    for (const sn of ['L', 'R']) { const lf = Math.max(P['lift' + sn] || 0, sn === 'R' ? (P.cleaveW || 0) * (1 - (P.cleaveR || 0)) : 0), sm = P['slam' + sn] || 0; if (lf > 0.2 || sm > 0.5) { const h = at('hand' + sn); if (h) { gl2(c, h[0], h[1], T * (0.9 + 0.6 * lf), '#FF6A1E', 0.35 * Math.max(lf, sm * 0.6)); gl2(c, h[0], h[1], T * 0.45, '#FFD9A0', 0.3 * lf); } } }
    const mo = at('mouth'); if (mo && (P.jaw || 0) > 0.2) gl2(c, mo[0], mo[1], T * (0.6 + 0.8 * P.jaw), '#FF8A2A', 0.5 * P.jaw * Math.min(1.3, heat));
    if ((P.flare || 0) > 0.05) for (const n of ['hornL', 'hornR']) { const h = at(n); if (h) { gl2(c, h[0], h[1], T * (0.5 + 0.5 * P.flare), '#FF5A1E', 0.45 * P.flare); gl2(c, h[0], h[1], T * 0.25, '#FFE2B0', 0.5 * P.flare); } }
    if ((P.bfL || 0) + (P.bfR || 0) > 0.05) { const s1 = at('shL'), s2 = at('shR'); if (s1) gl2(c, s1[0], s1[1], T * 1.4, BF, 0.22 * (P.bfL || 0)); if (s2) gl2(c, s2[0], s2[1], T * 1.4, BF, 0.22 * (P.bfR || 0)); } }
  /* ---- the effects over everything: the tethers, the gout of the breath, the eruptions, the cleave's arc, the falling
     rocks, the wall of Hellfire (the refuges' frost domes hold over it), the fire streaming from his shoulders ---- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!M || !M.ok || !m) return; const lf = lowFx(), F = fg(), Q = F ? F.begin(c, null) : null, me = FX.me;
    try {
      const a = MODEL.headOf(M.th), at = n => { const q = MODEL.anchorAt(n, m.x, m.y, a, M.P, 1, M.bt || 0); return q ? [FX.sx(q.x), FX.sy(q.y) - q.z * ZK * T] : null; };
      // the tethers: black fire from each living growth's crown into his armour, pulses running to him
      if (FX.S.lv === 2 && !m.dead) for (const cr of M.crys) { if (!cr.alive) continue; const x0 = FX.sx(cr.x), y0 = FX.sy(cr.y) - T * 2.6, tgt = at(crySide(m, M, cr) > 0 ? 'shR' : 'shL') || [FX.sx(m.x), FX.sy(m.y) - T * 3], x1 = tgt[0], y1 = tgt[1];
        const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - T * 1.6, P2 = u => [(1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * mx + u * u * x1, (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * my + u * u * y1];
        if (Q) { let p = P2(0); for (let i = 1; i <= 10; i++) { const q = P2(i / 10); Q.ebeam(p[0], p[1], q[0], q[1], T * 0.32, '#8A3CFF', 0.8, 0.9, i * 0.7 + cr.i * 5, 4); Q.ebeam(p[0], p[1], q[0], q[1], T * 0.1, '#FF6A2A', 0.9, 0.55, i * 0.7, 5); p = q; } }
        else { c.save(); c.lineCap = 'round'; for (const [w, col] of [[T * 0.42, 'rgba(20,6,30,.65)'], [T * 0.24, 'rgba(140,60,255,.7)'], [T * 0.08, 'rgba(255,140,80,.9)']]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke(); } c.restore(); }
        for (let k = 0; k < 3; k++) { const u = (cr.pulse * 1.6 + k / 3) % 1, p = P2(u); gl2(c, p[0], p[1], T * 0.55, BF_HI, 0.6 * Math.sin(u * Math.PI)); }
        gl2(c, x0, y0, T * 1.0, BF, 0.5); }
      // the gout: a cone of fire rolling out of his mouth
      for (const f of M.fx) { const u = f.t / f.life;
        if (f.kind === 'gout') { const env = Math.min(1, f.t / 0.15) * (1 - sstep(0.75, 1, u)), mo = at('mouth'); for (let i = 0; i < 16; i++) { const k = ((i / 16 + f.t * 1.8) % 1), d = k * BR_LEN, w = 0.3 + d * Math.tan(BR_SP) * 0.85, fx2 = FX.sx(f.x + Math.cos(f.a) * d), fy2 = FX.sy(f.y + Math.sin(f.a) * d) - T * 0.5, j = sstep(0, 0.55, k), x = mo ? lerp(mo[0], fx2, j) : fx2, y = mo ? lerp(mo[1], fy2, j) : fy2;   // (out of his mouth, down onto the floor and along it)
            if (Q) Q.fire(x, y, w * T, 0.25 + k * 0.6, env * 0.85, i * 1.3); else { gl2(c, x, y, w * T * 1.2, '#FF6A1E', 0.55 * env); gl2(c, x, y, w * T * 0.5, '#FFE2B0', 0.5 * env * (1 - k)); } } }
        else if (f.kind === 'erupt') { const env = Math.sin(Math.min(1, u * 1.4) * Math.PI); for (let d = 0.4; d < f.len; d += 0.9) { const x = FX.sx(f.x + Math.cos(f.a) * d), y = FX.sy(f.y + Math.sin(f.a) * d), h = T * (2.2 + 1.2 * Math.sin(d * 3.1 + f.t * 9)) * env;
            if (Q) { Q.tongue(x, y, T * 0.55, h, 0, 0.3, env, d); Q.glow(x, y, T * 1.2, '#FF5A1E', 0.4 * env, 0.5); } else { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(x, y, x, y - h); g.addColorStop(0, `rgba(255,200,120,${0.9 * env})`); g.addColorStop(0.5, `rgba(255,90,20,${0.6 * env})`); g.addColorStop(1, 'rgba(255,40,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - T * 0.45, y); c.quadraticCurveTo(x - T * 0.2, y - h * 0.5, x, y - h); c.quadraticCurveTo(x + T * 0.2, y - h * 0.5, x + T * 0.45, y); c.fill(); c.restore(); } } }
        else if (f.kind === 'arc') { const env = Math.sin(Math.min(1, u) * Math.PI); for (let i = 0; i <= 14; i++) { const b = f.a - CV_SP + (i / 14) * 2 * CV_SP * Math.min(1, u * 2.2), r = CV_LEN * 0.8, x = FX.sx(f.x + Math.cos(b) * r), y = FX.sy(f.y + Math.sin(b) * r) - T * 0.8;
            if (Q) Q.fire(x, y, T * 0.8, 0.45, env * 0.8, i); else gl2(c, x, y, T * 1.0, '#FF6A1E', 0.6 * env); } } }
      // the falling rocks: each comes down out of the dark onto its mark, trailing fire
      for (const r of M.rocks) { const u = cl(r.t / r.T); if (u < 0.35) continue; const k = (u - 0.35) / 0.65, h = (1 - k) * 14, x = FX.sx(r.x) + (1 - k) * T * 2.5, y = FX.sy(r.y) - h * T, rr = T * 0.55;
        if (Q) { Q.trail([[x, y], [x + T * 1.2, y - T * 3], [x + T * 2.2, y - T * 6]], 3, rr * 1.6, 0.6, 0.8, r.seed); Q.fire(x, y, rr * 1.4, 0.4, 0.8, r.seed); }
        else { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,120,40,.5)'; c.lineWidth = rr; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + T * 2, y - T * 5); c.stroke(); c.restore(); gl2(c, x, y, rr * 2.2, '#FF6A1E', 0.7); }
        c.fillStyle = '#1C1210'; c.beginPath(); c.arc(x, y, rr * 0.8, 0, TAU); c.fill(); c.strokeStyle = 'rgba(255,140,60,.9)'; c.lineWidth = Math.max(1, T * 0.06); c.stroke(); }
      // Hellfire: the wall of flame crossing the arena; the frost domes hold over it
      const A = M.A; if (A && A.kind === 'hellfire' && A.phase === 'wall') hellWall(c, FX, Q, A.y, T, t);
      for (const w of wellsOf(FX)) if (w.onK > 0.02) frostDome(c, FX, w, T, t, A && A.kind === 'hellfire' && A.phase === 'wall' ? 1 : 0);
      // the third act: fire streaming up from his shoulders
      if (M.p3 && !m.dead && M.fracT > 0.6) for (const n of ['ventL', 'ventR']) { const v = at(n); if (!v) continue; const env = Math.min(1, (M.fracT - 0.6) * 2);
        if (Q) { for (let i = 0; i < 3; i++) Q.tongue(v[0] + (i - 1) * T * 0.25, v[1], T * 0.38, T * (1.4 + 0.5 * Math.sin(t * 7 + i * 2)), (i - 1) * 0.15, 0.2, 0.85 * env, i + (n === 'ventL' ? 0 : 9)); }
        else { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const x = v[0] + (i - 1) * T * 0.25, h = T * (1.3 + 0.5 * Math.sin(t * 7 + i * 2)), g = c.createLinearGradient(x, v[1], x, v[1] - h); g.addColorStop(0, 'rgba(255,220,140,.85)'); g.addColorStop(0.4, 'rgba(255,110,30,.6)'); g.addColorStop(1, 'rgba(255,40,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - T * 0.25, v[1]); c.quadraticCurveTo(x - T * 0.1 + Math.sin(t * 9 + i) * T * 0.15, v[1] - h * 0.6, x, v[1] - h); c.quadraticCurveTo(x + T * 0.15, v[1] - h * 0.5, x + T * 0.25, v[1]); c.fill(); } c.restore(); }
        gl2(c, v[0], v[1], T * 1.0, '#FF7A2E', 0.4 * env); }
    } finally { if (Q) F.flush(c); } }
  function hellWall(c, FX, Q, wy, T, t) { const C = FX.C, R = C.R, dy = wy - C.y; if (Math.abs(dy) > R + 1.5) return; const half = Math.sqrt(Math.max(0, (R + 1.2) * (R + 1.2) - dy * dy)), x0 = FX.sx(C.x - half), x1 = FX.sx(C.x + half), y = FX.sy(wy);
    c.save(); c.globalCompositeOperation = 'lighter'; let g = c.createLinearGradient(0, y - T * 1.6, 0, y + T * 1.4); g.addColorStop(0, 'rgba(255,60,10,0)'); g.addColorStop(0.45, 'rgba(255,120,30,.75)'); g.addColorStop(0.7, 'rgba(255,220,150,.85)'); g.addColorStop(1, 'rgba(255,60,10,0)'); c.fillStyle = g; c.fillRect(x0, y - T * 1.6, x1 - x0, T * 3.0); c.restore();
    const n = Math.ceil((x1 - x0) / (T * 0.9));
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, h = T * (3.6 + 1.6 * Math.sin(i * 1.7 + t * 8) + 0.8 * Math.sin(i * 0.6 - t * 5));
      if (Q) { Q.tongue(x, y + T * 0.6, T * 0.75, h, Math.sin(i + t * 3) * 0.12, 0.15, 0.95, i * 0.9); if (i % 2 === 0) Q.billow(x, y - T * 0.4, T * 1.1, 0.4, 0.6, i); }
      else { c.save(); c.globalCompositeOperation = 'lighter'; g = c.createLinearGradient(x, y + T * 1.1, x, y + T * 1.1 - h); g.addColorStop(0, 'rgba(255,230,160,0)'); g.addColorStop(0.14, 'rgba(255,230,160,.75)'); g.addColorStop(0.4, 'rgba(255,120,30,.6)'); g.addColorStop(1, 'rgba(255,40,0,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x - T * 0.6, y + T * 1.1); c.quadraticCurveTo(x - T * 0.3 + Math.sin(t * 7 + i) * T * 0.3, y - h * 0.4, x + Math.sin(t * 5 + i) * T * 0.3, y + T * 0.6 - h); c.quadraticCurveTo(x + T * 0.4, y - h * 0.3, x + T * 0.6, y + T * 1.1); c.fill(); c.restore(); } } }
  function frostDome(c, FX, w, T, t, hold) { const X = FX.sx(w.x), Y = FX.sy(w.y), R = ARENA.REFUGE * T, k = w.onK;
    c.save(); c.globalAlpha = k; const g = c.createRadialGradient(X, Y - R * 0.3, R * 0.2, X, Y - R * 0.2, R * 1.05); g.addColorStop(0, `rgba(230,248,255,${0.05 + 0.12 * hold})`); g.addColorStop(0.8, `rgba(170,225,255,${0.12 + 0.2 * hold})`); g.addColorStop(1, 'rgba(170,225,255,0)'); c.fillStyle = g;
    c.beginPath(); c.ellipse(X, Y, R, R * 0.55, 0, Math.PI, TAU); c.ellipse(X, Y - R * 0.05, R, R * 1.05, 0, 0, Math.PI, true); c.fill();
    c.strokeStyle = `rgba(220,245,255,${0.55 + 0.35 * hold})`; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.ellipse(X, Y, R, R * 1.05, 0, Math.PI, TAU); c.stroke();
    c.strokeStyle = `rgba(220,245,255,${0.25 + 0.2 * Math.sin(t * 3)})`; c.lineWidth = Math.max(1, T * 0.03); for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(X, Y, R * (i / 4), R * 1.05, 0, Math.PI, TAU); c.stroke(); }
    c.restore(); }
  /* ---- the ground effects (hazards with a picture only: no harm): the scar of a blow, the travelling crack, the
     floor's Hellfire warning with the refuges ---- */
  function groundFx(FX, o) { return FX.hz(Object.assign({ shape: 'circle', r: 0.01, tick: 9, draw: (c, z, FX2, T, t) => drawGroundFx(c, z, FX2, T, t) }, o)); }
  function drawGroundFx(c, z, FX, T, t) { const u = z.age / z.life;
    if (z.fx === 'scar') { const X = FX.sx(z.x), Y = FX.sy(z.y), k = 1 - u; c.globalCompositeOperation = 'lighter'; const r2 = mulb(z.seed | 0); c.lineCap = 'round';
      for (let i = 0; i < 9; i++) { let a = i / 9 * TAU + r2(), x = X, y = Y; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { a += (r2() - 0.5) * 0.8; const l = z.r * T * (0.25 + r2() * 0.3); x += Math.cos(a) * l; y += Math.sin(a) * l; c.lineTo(x, y); } c.strokeStyle = `rgba(255,${100 + 80 * k},40,${0.75 * k})`; c.lineWidth = Math.max(1, T * 0.09 * k + 1); c.stroke(); }
      gl2(c, X, Y, z.r * T * 1.2, '#FF5A1E', 0.35 * k); return; }
    if (z.fx === 'crack') { const fr = cl(z.age / z.run), L = z.len * fr, erupt = z.age > z.run, k = erupt ? 1 - cl((z.age - z.run - 0.6) / 1.0) : 1; if (k <= 0) return; c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
      const pts = []; const r2 = mulb(z.seed | 0); for (let d = 0; d <= L + 0.01; d += 0.45) { const off = (r2() - 0.5) * 0.4; pts.push([FX.sx(z.x + Math.cos(z.a) * d - Math.sin(z.a) * off), FX.sy(z.y + Math.sin(z.a) * d + Math.cos(z.a) * off)]); }
      for (const [w, col] of [[T * 0.5, `rgba(255,70,15,${0.35 * k})`], [T * 0.2, `rgba(255,170,70,${0.85 * k})`], [T * 0.07, `rgba(255,240,200,${0.9 * k})`]]) { c.strokeStyle = col; c.lineWidth = Math.max(1, w); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
      if (!erupt && pts.length) { const p = pts[pts.length - 1]; gl2(c, p[0], p[1], T * 1.1, '#FFB347', 0.8); } return; }
    if (z.fx === 'hellwarn') { const C = FX.C, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), R = C.R * T, k = Math.min(1, z.age / 0.6), left = Math.max(0, z.life - z.age), pul = 0.5 + 0.5 * Math.sin(t * (6 + 10 * (1 - left / z.life)));
      c.save(); c.beginPath(); c.arc(X0, Y0, R - 2, 0, TAU); for (const w of wellsOf(FX)) { if (!w.awake && !w.on) continue; c.moveTo(FX.sx(w.x) + ARENA.REFUGE * T, FX.sy(w.y)); c.arc(FX.sx(w.x), FX.sy(w.y), ARENA.REFUGE * T, 0, TAU, true); } c.clip('evenodd');
      c.fillStyle = `rgba(30,4,2,${0.25 * k})`; c.fillRect(X0 - R, Y0 - R, R * 2, R * 2);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,70,20,${(0.1 + 0.14 * pul) * k})`; c.fillRect(X0 - R, Y0 - R, R * 2, R * 2);
      // bands sweeping south: the way the wall will come
      c.strokeStyle = `rgba(255,140,60,${0.22 * k})`; c.lineWidth = T * 0.35; for (let i = 0; i < 8; i++) { const y = Y0 - R + ((t * T * 3 + i * R / 4) % (R * 2)); c.beginPath(); c.moveTo(X0 - R, y); c.lineTo(X0 + R, y); c.stroke(); }
      c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(255,90,30,${(0.5 + 0.4 * pul) * k})`; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.arc(X0, Y0, R - 2, 0, TAU); c.stroke(); c.restore();
      if (!modOf(FX)) for (const w of wellsOf(FX)) refugeArt(c, FX, w, T, t); return; } }
  /* ---- a frost well: a ring of pale carved stone round a cluster of white-blue frost crystal, the snowflake on its face;
     awake, it shines and its refuge's ring is drawn; on, the refuge is a frost disc ---- */
  function wellArt(c, X, Y, T, w, t) { const k = w.k || 0, on = w.onK || 0, s = T;
    // (the caldera's own frost well, the same as Fire Flan's, where the core provides it: the emblem, the rime, the cue)
    if (typeof CAL !== 'undefined' && CAL.frostWellArt) { try { if (k > 0.02) gl2(c, X, Y - s * 0.7, s * (1.8 + 0.8 * on), '#9FDFFF', 0.2 + 0.3 * k); CAL.frostWellArt(c, X, Y, T, { k: Math.max(k, on), awake: w.awake && !w.on }); return; } catch (e) { /* our own picture below */ } }
    c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(X, Y + s * 0.15, s * 1.25, s * 0.5, 0, 0, TAU); c.fill();
    if (k > 0.02) gl2(c, X, Y - s * 0.7, s * (1.8 + 0.8 * on), '#9FDFFF', 0.25 + 0.35 * k + 0.2 * Math.sin(t * 4) * k);
    // the stone ring: its back half, the frost crystals inside, its front half with the emblem
    const ring = (front) => { c.beginPath(); c.ellipse(X, Y - s * 0.05, s * 1.05, s * 0.45, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.lineTo(X + (front ? -1 : 1) * s * 1.05, Y - s * 0.62); c.ellipse(X, Y - s * 0.62, s * 1.05, s * 0.45, 0, front ? Math.PI : TAU, front ? 0 : Math.PI, true); c.closePath(); };
    ring(false); c.fillStyle = '#8D8A90'; c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1.5, s * 0.05); c.stroke();
    c.beginPath(); c.ellipse(X, Y - s * 0.62, s * 0.86, s * 0.33, 0, 0, TAU); c.fillStyle = '#1C2A36'; c.fill();
    const shards = [[0, 1.45, 0.2], [-0.32, 1.05, 0.15], [0.34, 1.1, 0.16], [-0.12, 0.85, 0.12], [0.18, 0.78, 0.12]];
    for (const [dx, h, r] of shards) { const bx = X + dx * s, by = Y - s * 0.62, tx = bx + dx * s * 0.35, ty = by - h * s * (0.85 + 0.15 * k); const g = c.createLinearGradient(bx - r * s, 0, bx + r * s, 0); g.addColorStop(0, '#EAF8FF'); g.addColorStop(0.5, k > 0.3 ? '#BFEFFF' : '#9FC4D8'); g.addColorStop(1, '#5E8FB0');
      c.beginPath(); c.moveTo(bx - r * s, by); c.lineTo(tx - r * s * 0.3, ty + h * s * 0.2); c.lineTo(tx, ty); c.lineTo(tx + r * s * 0.3, ty + h * s * 0.2); c.lineTo(bx + r * s, by); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = '#2B3E52'; c.lineWidth = Math.max(1, s * 0.035); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1, s * 0.025); c.beginPath(); c.moveTo(bx - r * s * 0.3, by - s * 0.05); c.lineTo(tx - r * s * 0.08, ty + h * s * 0.15); c.stroke(); }
    ring(true); const g = c.createLinearGradient(X - s * 1.05, 0, X + s * 1.05, 0); g.addColorStop(0, '#B9B6BC'); g.addColorStop(0.55, '#8D8A90'); g.addColorStop(1, '#55525A'); c.fillStyle = g; c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1.5, s * 0.05); c.stroke();
    c.strokeStyle = 'rgba(40,36,48,.5)'; c.lineWidth = Math.max(1, s * 0.03); for (const dx of [-0.62, 0.62]) { c.beginPath(); c.moveTo(X + dx * s, Y - s * 0.24 + Math.abs(dx) * s * 0.1); c.lineTo(X + dx * s, Y + s * 0.18 - Math.abs(dx) * s * 0.1); c.stroke(); }
    // the snowflake emblem on its face (white-blue, lit when awake)
    c.beginPath(); c.arc(X, Y - s * 0.12, s * 0.3, 0, TAU); c.fillStyle = '#2E4258'; c.fill(); c.strokeStyle = '#D9F3FF'; c.lineWidth = Math.max(1, s * 0.03); c.stroke();
    snowflake(c, X, Y - s * 0.12, s * 0.24, k > 0.3 ? '#FFFFFF' : '#BFE4F5', Math.max(1, s * 0.04));
    if (k > 0.02) gl2(c, X, Y - s * 0.12, s * 0.6, '#BFEFFF', 0.4 * k);
    c.restore(); }
  /* the refuge on the floor: awake, its ring dashed with snowflakes round it; on, a frost disc and the emblem */
  function refugeArt(c, FX, w, T, t) { const k = w.k || 0, on = w.onK || 0; if (k < 0.02 && on < 0.02) return; const X = FX.sx(w.x), Y = FX.sy(w.y), R = ARENA.REFUGE * T;
    c.save();
    if (on > 0.02 && typeof CAL !== 'undefined' && CAL.coldField && FX.Tz) { try { CAL.coldField(c, FX, w.x, w.y, ARENA.REFUGE, on, { refuge: true }); c.globalAlpha = on; snowflake(c, X, Y + T * 0.9, T * 1.0, 'rgba(255,255,255,.75)', Math.max(1.5, T * 0.07)); c.restore(); return; } catch (e) { c.restore(); c.save(); } }
    if (on > 0.02) { const g = c.createRadialGradient(X, Y, R * 0.2, X, Y, R); g.addColorStop(0, `rgba(235,250,255,${0.42 * on})`); g.addColorStop(0.75, `rgba(170,225,255,${0.3 * on})`); g.addColorStop(1, `rgba(170,225,255,${0.06 * on})`); c.fillStyle = g; c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fill();
      c.globalAlpha = on; snowflake(c, X, Y + T * 0.9, T * 1.0, 'rgba(255,255,255,.75)', Math.max(1.5, T * 0.07)); c.globalAlpha = 1; }
    c.strokeStyle = `rgba(225,247,255,${(0.55 + 0.35 * Math.sin(t * 5)) * Math.max(k, on)})`; c.lineWidth = Math.max(2, T * 0.1); if (on < 0.5) c.setLineDash([T * 0.5, T * 0.3]); c.beginPath(); c.arc(X, Y, R, 0, TAU); c.stroke(); c.setLineDash([]);
    if (on < 0.5) for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.4; snowflake(c, X + Math.cos(a) * R, Y + Math.sin(a) * R, T * 0.28, 'rgba(235,250,255,.9)', Math.max(1, T * 0.04)); }
    c.restore(); }

  /* ================= the stage (the rift's boss stage: CAL.bossMake.califrit) ================= */
  /* make(X, self, H): the Crucible's objects: the two frost wells (stand still beside one for 0.75 s while it is awake: a
     cold refuge), their refuges drawn on the floor, the pointer to the nearest well during Hellfire. The fight reaches
     all of it through the stage module X.rift.self.mod = { C, wells: [{ i, x, y, awake, on, k, onK, obj }], ARENA } */
  function make(X, self, H) {
    // (the lead: his health is set in absolute terms like the flan's: four bars holding TUNE.hp in all, whatever the rift's ease)
    { const F = X.F; if (F && F.fiend && F.fiend.id === 'califrit' && !F.calHp && typeof BOSS_HP_MEAN !== 'undefined') { const FD = F.fiend, per = 20 * BOSS_HP_MEAN * F.hpMul * (1 + 0.3 * (F.loop || 0) + 0.5 * (FD.cycle || 0)) / (FD.baseBars || FD.bars), tot = per * FD.bars; if (tot > 0) { F.hpMul *= TUNE.hp / tot; F.calHp = true; } } }
    const FC = X.M && X.M.FC, C = FC ? { x: FC.x, y: FC.y, R: FC.R } : { x: X.M.MW / 2, y: X.M.MH / 2, R: AR };
    const wells = ARENA.wells(C).map(w => ({ i: w.i, x: w.x, y: w.y, awake: false, on: false, k: 0, onK: 0, ch: 0, ready: false, offT: 0 }));
    const st0 = { g: X.g, X, mod: null, FX: null };
    for (const w of wells) w.obj = H.obj({ x: w.x, y: w.y, kind: 'frostwell', r: 1.15, h: 2.3, label: () => w.on ? 'Cold refuge' : w.awake ? 'Hold still: frost well' : 'Frost well',
      use: () => { const FX = st0.FX; if (FX) useWell(FX, w); }, draw(c, Xs, Ys, T) { wellArt(c, Xs, Ys, T, w, X.g.t); } });
    const mod = { C, wells, ARENA, CAL_IFRIT: null,
      update(dt) { for (const w of wells) { w.obj.busy = !(w.awake && !w.on); } },
      hint() { if (!wells.some(w => w.awake)) return null; if (wells.some(w => w.on && Math.hypot(X.me.x - w.x, X.me.y - w.y) < ARENA.REFUGE)) return null; let best = null, bd = 1e9; for (const w of wells) { if (!w.awake || w.on) continue; const d = Math.hypot(X.me.x - w.x, X.me.y - w.y); if (d < bd) { bd = d; best = w.obj; } } return best; },
      drawGround(c) { const T = X.Tz(); for (const w of wells) refugeArt(c, { sx: X.sx, sy: X.sy, Tz: X.Tz, g: X.g }, w, T, X.g.t); } };
    st0.mod = mod; STAGE = st0;
    return mod;
  }
  /* the fight finds the stage's module when it starts (and tells it who it is: the wells' use needs the fight) */
  const _init = def.init; def.init = FX => { if (STAGE && STAGE.g === FX.g) STAGE.FX = FX; _init(FX); };
  const _phase = def.phase; def.phase = (FX, p, lv) => _phase(FX, p, lv);
  return { MODEL, def, make, ARENA, TUNE, groundFx, CYC, test: { begin, endAct, wellsOf, useWell, sheltered, drK } };
})();
/* the tuning: Ifrit is set in absolute terms for an ordinary level-1 starter (TUNE.hp health in all, blows of about TUNE.dmg),
   whatever ease the rift gives its monsters: his bars and his blows are worked out, when his stage starts, from the floor
   that stage plays as (riftDef) and the rift's ease and scale. (The rift does need an ease for its bars to mean anything at
   level 1: at ease 1 a bar of a floor-7 fiend is some 23,000 health, and he keeps one of them.) */
const CAL_IFRIT_BARS = 9;   // (v389: the user)
const CAL_IFRIT_K = kind => { try { const T = CAL_IFRIT.TUNE, Rf = RIFT_BY_ID.caldera, E = ((Rf && Rf.ease) || 1) * ((Rf && Rf.scale) || 1);
  let n = 7; if (Rf && Rf.stages) { const i = Rf.stages.findIndex(s => s.boss === 'califrit'); if (i >= 0) n = Math.max(1, (Rf.lvl || 1) + (riftStagePos(Rf, i).sec - 1) * 3); }
  const F = floorDef(n);
  if (kind === 'hp') { const base = Math.round(n / 5) + 2, more = n < 50 ? Math.round(10 + 15 * Math.min(1, Math.max(0, (n - 10) / 30))) : Math.round(30 + 20 * Math.min(1, (n - 50) / Math.max(10, TOWER_TOP - 50))), bar = 20 * BOSS_HP_MEAN * F.hpMul * E / base;
    return (CAL_IFRIT_BARS + 0.2) / (base + more); }
  const hit = n < 50 ? 1.3 : 1.5, lvK = 1 + (n / 10 - 1) * 0.06; return T.dmg / (15 * F.dmgMul * E * 1.25 * 1.1 * lvK * hit); } catch (e) { return 1; } };
RiftFiend.define({ id: 'califrit', name: 'Ifrit', title: 'Heart of the Volcano', color: '#2A1D1A', glow: '#FF5A1E', accent: '#FFC27A', biome: typeof BIOMES !== 'undefined' && BIOMES.calderapit ? 'calderapit' : 'volcano', r: 2.2, els: ['fire', 'earth'], phases: 3, cuts: [1, 0.7, 0.35],
  get hpK() { return CAL_IFRIT_K('hp'); }, get dmgK() { return CAL_IFRIT_K('dmg'); } }, CAL_IFRIT.def);
FIEND_DEFS.califrit.stageMake = CAL_IFRIT.make; FIEND_DEFS.califrit.IFRIT = CAL_IFRIT;
if (typeof CAL !== 'undefined') { CAL.bossMake = CAL.bossMake || {}; CAL.bossMake.califrit = CAL_IFRIT.make; }
