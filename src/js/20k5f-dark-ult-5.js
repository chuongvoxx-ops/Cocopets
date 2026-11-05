/* ---------- Dark, reworked: Doomsday ----------
   One enormous meteor of dark energy plunges from the sky onto the aim and detonates; the world turns negative for an
   instant at the impact. A dark pressure mark forms on the ground (a violet ring, ticks converging, a pulse contracting
   onto it) while, high above, the meteor condenses out of black energy: a real GeoKit volume, a faceted near-black core
   (an irregular bipyramid, obsidian-textured, violet light in every crease) with three to five uneven shell plates round
   it, the light buried in the seams between them; it tumbles slowly as it falls. The descent is slow for a second, to
   establish its size, then it accelerates hard: long dark streaks tear off its rear along the real screen velocity, a
   wide column of shadow behind, violet sparks and dissolving fragments, and the fractures brighten (and its underside
   lights up) as the ground nears. Impact: the body compresses, H.X.negative(0.08) once, ONE Dark AoE hit (14 x base x K
   x evoK, kb 7, stun 0.5, R = 3.2 K .. 4.4 K at Celestial), a bright #D0AEFF core flash, a thick violet shockwave over
   the floor and a low one in the air, a dark eruption rising from the centre with currents climbing it and a cloud at
   its top, a field of glowing fractures (light only, gone within ~2 s), low mist, the shell plates flung out as
   tumbling solids, small fragments, smoke. Nothing stays on the floor; no decorative layer hits. Adept: four plates,
   broader trailing streams, more fractures and debris. Celestial: a colossal meteor whose five plates visibly shift
   round the core with violet currents running between them, the widest low shockwave, a towering eruption, a broad
   fracture field. Near the pet the whole effect dims smoothly (never a cut-out). No per-frame gradients, no shadowBlur:
   the soft pieces are cached sprites; the meteor's own textures are GeoKit's tiled patterns. */
(() => {
  const U = ELEM_IMPL.dark.ult; delete U.forgottenkings;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF', WHITE = '#FFFFFF', INK = '#06040A';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const G = () => GeoKit;
  let H;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  // the visible canvas in the context's own units
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }

  /* ---- cached sprites (every edge soft) ---- */
  // a dark halo: the air darkened round the meteor, so it reads on a bright floor
  const haloSpr = () => fxSprite('du5halo', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(8,5,15,0.75)'); gr.addColorStop(0.4, 'rgba(14,8,26,0.45)'); gr.addColorStop(0.72, 'rgba(24,11,46,0.16)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // a streak: strongest at its left end, fading along its length, gaussian across (the trails torn off the rear)
  function streakSpr(key, r, g2, b, a0) { return fxSprite('du5streak' + key, 256, 64, g => { const gr = g.createLinearGradient(0, 0, 256, 0); gr.addColorStop(0, `rgba(${r},${g2},${b},${a0})`); gr.addColorStop(0.35, `rgba(${r},${g2},${b},${a0 * 0.7})`); gr.addColorStop(0.75, `rgba(${r},${g2},${b},${a0 * 0.28})`); gr.addColorStop(1, `rgba(${r},${g2},${b},0)`); g.fillStyle = gr; g.fillRect(0, 0, 256, 64);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, 64); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.3, 'rgba(0,0,0,0.6)'); gv.addColorStop(0.5, 'rgba(0,0,0,1)'); gv.addColorStop(0.7, 'rgba(0,0,0,0.6)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, 256, 64); }); }
  const darkStreak = () => streakSpr('D', 8, 5, 15, 0.95), plumStreak = () => streakSpr('P', 43, 11, 69, 0.9), vioStreak = () => streakSpr('V', 109, 40, 168, 0.9), accStreak = () => streakSpr('A', 208, 174, 255, 0.9);
  // a band round a circle: dark body, violet luminous outer edge, feathered both sides (the shockwaves)
  const bandSpr = () => fxSprite('du5band', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.72, 'rgba(24,11,46,0)'], [0.8, 'rgba(24,11,46,0.45)'], [0.87, 'rgba(43,11,69,0.7)'], [0.92, 'rgba(109,40,168,0.8)'], [0.955, 'rgba(165,92,255,0.95)'], [0.98, 'rgba(208,174,255,0.5)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // the same in light only (additive)
  const bandLSpr = () => fxSprite('du5bandL', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(109,40,168,0)'], [0.68, 'rgba(109,40,168,0)'], [0.85, 'rgba(109,40,168,0.35)'], [0.94, 'rgba(165,92,255,0.8)'], [0.97, 'rgba(208,174,255,0.9)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // a puff of violet smoke
  const puffSpr = () => fxSprite('du5puff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(70,48,82,0.6)'); gr.addColorStop(0.5, 'rgba(43,11,69,0.32)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  // a darker puff (the mist close to the ground, the cloud at the eruption's top)
  const dpuffSpr = () => fxSprite('du5dpuff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(24,11,46,0.7)'); gr.addColorStop(0.45, 'rgba(43,11,69,0.4)'); gr.addColorStop(0.8, 'rgba(70,48,82,0.1)'); gr.addColorStop(1, 'rgba(70,48,82,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  // the pressure mark: a soft dark disc
  const markSpr = () => fxSprite('du5mark', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(8,5,15,0.6)'); gr.addColorStop(0.55, 'rgba(8,5,15,0.4)'); gr.addColorStop(0.85, 'rgba(24,11,46,0.12)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // the eruption column: dark, soft at both sides, feathered at the top and lightly at the foot
  const colSpr = () => fxSprite('du5col', 128, 256, g => { const gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(24,11,46,0)'); gr.addColorStop(0.22, 'rgba(24,11,46,0.7)'); gr.addColorStop(0.45, 'rgba(8,5,15,0.95)'); gr.addColorStop(0.6, 'rgba(24,11,46,0.9)'); gr.addColorStop(0.8, 'rgba(43,11,69,0.55)'); gr.addColorStop(1, 'rgba(43,11,69,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, 256); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.3, 'rgba(0,0,0,0.85)'); gv.addColorStop(0.85, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = gv; g.fillRect(0, 0, 128, 256); });
  // the violet light running up its heart (additive)
  const colLSpr = () => fxSprite('du5colL', 64, 256, g => { const gr = g.createLinearGradient(0, 0, 64, 0); gr.addColorStop(0, 'rgba(109,40,168,0)'); gr.addColorStop(0.35, 'rgba(109,40,168,0.6)'); gr.addColorStop(0.5, 'rgba(165,92,255,0.9)'); gr.addColorStop(0.65, 'rgba(109,40,168,0.6)'); gr.addColorStop(1, 'rgba(109,40,168,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, 256); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.45, 'rgba(0,0,0,0.7)'); gv.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gv; g.fillRect(0, 0, 64, 256); });

  /* ---- the meteor: materials and meshes (meteor-local units: tiles at size 1) ---- */
  const MAT = {
    core: { c: ['#07050E', '#170C2A', '#3A2452'], tex: 'obsidian', texA: 0.5, texS: 1.4, gloss: 0.5, glint: '#8E62D8', glintA: 0.9, edge: EDGE, edgeA: 0.3, under: ENERGY, backA: 0.6 },
    shell: { c: ['#120C1E', '#221636', '#4A3860'], tex: 'obsidian', texA: 0.55, texS: 1.1, gloss: 0.4, glint: '#B8A0E0', glintA: 1.35, under: ENERGY, backA: 0.6 },
  };
  // a unit direction from an azimuth and an elevation
  const dirOf = (az, el) => [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
  /* the model: a faceted core and n shell plates round it, each plate flat across its own radial direction */
  function meteorModel(n, seed) {
    const g = G(), core = g.bipyramid(7, 0.62, 0.85, 0.72, { jit: 0.55, jitR: 0.35, jitZ: 0.4, seed: 11 + seed, tx: 0.1, ty: -0.06, bx: -0.08, by: 0.05 });
    const shells = [];
    for (let i = 0; i < n; i++) { const az = i / n * TAU + (R1(seed + i * 3.1) - 0.5) * 0.7, el = (R1(seed + i * 5.3) - 0.5) * 1.3 + (i % 2 ? 0.25 : -0.25), dir = dirOf(az, el);
      const M = g.bipyramid(5 + (i % 2), 0.56, 0.17, 0.1, { jit: 0.6, jitR: 0.4, seed: 20 + i + seed, sx: 1.25, sy: 0.95, a0: R1(seed + i) * TAU });
      // local z of the plate maps to its radial direction (ry(pi/2) turns z onto x; frame() turns x onto dir)
      shells.push({ M, dir, R0: g.mm(g.frame(dir), g.ry(Math.PI / 2)), r: 0.8 + 0.05 * (R1(seed + i * 7) - 0.5), ph: R1(seed + i * 9) * TAU, spin: (R1(seed + i * 13) - 0.5) * 0.8, i }); }
    return { core, shells };
  }
  /* paint the meteor at camera cm, placed at t0 (anchor space) turned by Rm; P = { s, form 0..1 (condensing), near 0..1
     (toward the ground), alpha, cel, t (time), T (px a tile) }. Core and plates are depth-sorted; the light buried in the
     seams is a glow drawn right after the core, so it leaks out between the plates; at Celestial the plates shift round
     the core and violet currents run between them */
  function drawMeteor(c, cm, MD, Rm, t0, P) {
    const g = G(), S = P.s, items = [], form = g.ease(P.form), spread = 1 + 2.8 * (1 - form);
    items.push({ kind: 'core', R: Rm, t: t0, s: S * (0.4 + 0.6 * form), M: MD.core, mat: MAT.core, dep: cm.dep(t0), a: P.alpha * cl(P.form * 2) });
    for (const sh of MD.shells) { const shift = P.cel ? 1 + 0.1 * Math.sin(P.t * 2.1 + sh.ph) : 1, off = g.mul(sh.dir, sh.r * spread * shift * S), Rs = g.mm(Rm, P.cel ? g.mm(sh.R0, g.rz(P.t * sh.spin)) : sh.R0), tw = g.add(t0, g.mv(Rm, off));
      items.push({ kind: 'shell', R: Rs, t: tw, s: S * (0.7 + 0.3 * form), M: sh.M, mat: MAT.shell, dep: cm.dep(tw), a: P.alpha * form, sh, tw }); }
    items.sort((a, b) => a.dep - b.dep);
    MAT.core.edgeA = 0.25 + 0.45 * P.near;
    const cp = cm.P(t0), rpx = S * P.T * 0.8, a0 = P.alpha * cl(P.form * 2);
    // the light buried in the cracks: under the core (it leaks out round it and between the plates), a little over it
    glow(c, cp[0], cp[1], rpx * 1.2, ENERGY, a0 * (0.35 + 0.45 * P.near)); glow(c, cp[0], cp[1], rpx * 0.6, EDGE, a0 * (0.25 + 0.45 * P.near));
    for (const it of items) {
      if (it.a <= 0.01) continue;
      g.solid(c, cm, it.M, { R: it.R, t: it.t, s: it.s }, { mat: it.mat, force: true, ink: INK, lw: 0.05, lwI: 0.016, inkIA: it.kind === 'core' ? 0.6 : 0.3, alpha: it.a, underK: P.near * 0.35 });
      if (it.kind === 'core') glow(c, cp[0], cp[1], rpx * 0.4, EDGE, it.a * (0.1 + 0.3 * P.near));
    }
    // Celestial: fine violet currents between neighbouring plates, a bright bead travelling each
    if (P.cel && form > 0.9) { const sh = items.filter(it => it.kind === 'shell'); sh.sort((a, b) => a.sh.i - b.sh.i); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (let i = 0; i < sh.length; i++) { const A = sh[i], B = sh[(i + 1) % sh.length], mid = g.add(t0, g.mul(g.norm(g.sub(g.lerp3(A.tw, B.tw, 0.5), t0)), S * 1.05)); if (g.dot(g.sub(mid, t0), g.V) < -0.1 * S) continue;
        const pa = cm.P(A.tw), pb = cm.P(B.tw), pm = cm.P(mid), ph = (P.t * 1.4 + i * 0.37) % 1, k = 0.5 + 0.5 * Math.sin(P.t * 3 + i * 2.1);
        c.globalAlpha = P.alpha * (0.3 + 0.3 * k + 0.3 * P.near); c.strokeStyle = EDGE; c.lineWidth = Math.max(1, P.T * 0.03); c.beginPath(); c.moveTo(pa[0], pa[1]); c.quadraticCurveTo(pm[0], pm[1], pb[0], pb[1]); c.stroke(); c.globalAlpha = P.alpha * 0.22; c.lineWidth = Math.max(2, P.T * 0.1); c.stroke();
        const u = ph, q = 1 - u, bx = q * q * pa[0] + 2 * q * u * pm[0] + u * u * pb[0], by = q * q * pa[1] + 2 * q * u * pm[1] + u * u * pb[1]; c.globalAlpha = P.alpha * 0.8; blitSized(c, glowSprite(ACC), bx - P.T * 0.16, by - P.T * 0.16, P.T * 0.32, P.T * 0.32); }
      c.restore(); }
    return cp;
  }
  // the debris plates: the shell material without its texture and gloss (ten tumbling solids a frame stay cheap)
  const MAT_FLAT = { c: MAT.shell.c, backA: 0.6 };
  // a small dark fragment: a triangle with a violet edge (debris in the air, pieces on the ground)
  function frag(c, x, y, s, rot, a, flat) { c.save(); c.translate(x, y); if (flat) c.scale(1, H.GY); c.rotate(rot); c.globalAlpha = a; c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, s * 0.5); c.lineTo(-s * 0.4, -s * 0.45); c.closePath(); c.fillStyle = BODY; c.fill(); c.strokeStyle = rgba(EDGE, 0.7); c.lineWidth = 1; c.stroke(); c.restore(); }
  // a polyline in floor space (tiles about the origin) grown to g of its length
  function growPath(c, pts, g, T) { const n = pts.length - 1; if (n < 1 || g <= 0) return; const k = g * n, m = Math.min(n, Math.floor(k)); c.moveTo(pts[0][0] * T, pts[0][1] * T); for (let i = 1; i <= m; i++) c.lineTo(pts[i][0] * T, pts[i][1] * T); if (m < n) { const e = k - m, a = pts[m], b = pts[m + 1]; c.lineTo(lerp(a[0], b[0], e) * T, lerp(a[1], b[1], e) * T); } }
  // the fracture field: n cracks from the centre, each with a branch, in floor tiles (fixed at the cast)
  function makeFractures(n, L, seed) { const out = []; for (let i = 0; i < n; i++) { let a = i / n * TAU + (R1(seed + i * 3.3) - 0.5) * 0.45, r = 0.2 + 0.2 * R1(seed + i), len = L * (0.65 + 0.5 * R1(seed + i * 5.1)); const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; const N = 6; for (let k = 1; k <= N; k++) { a += (R1(seed + i * 11 + k) - 0.5) * 0.42; r += len / N * (0.7 + 0.6 * R1(seed + i * 7 + k)); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const bk = 2 + Math.floor(R1(seed + i * 17) * 2), q = pts[bk], ba = Math.atan2(q[1], q[0]) + (R1(seed + i * 19) < 0.5 ? 0.75 : -0.75), bl = len * 0.35, br = [q]; for (let k = 1; k <= 3; k++) { const aa = ba + (R1(seed + i * 23 + k) - 0.5) * 0.4, rr = bl * k / 3; br.push([q[0] + Math.cos(aa) * rr, q[1] + Math.sin(aa) * rr]); }
    out.push({ pts, br, ph: R1(seed + i * 29) * TAU, d: R1(seed + i * 31) * 0.12 }); } return out; }

  /* ================= D-U06 Doomsday ================= */
  U.doomsday = (C, h) => {
    H = h; const g = G(), CE = g.CE, SE = g.SE, me = H.me, x = C.tx, y = C.ty, ev = evoOf(C), CEL = ev >= 7, ADE = ev >= 4, evoK = 1 + 0.08 * (ev - 1), K = C.K;
    const R = (3.2 + 0.2 * (ev - 1)) * K, DMG = C.base * 14 * K * evoK, S = (1 + 0.12 * (ev - 1)) * Math.sqrt(K);
    const TS = 1.0, IMP = 2.25 + 0.05 * (ev - 1), TA = IMP - TS, Q0 = 0.2, V0 = Q0 / TS, ACL = 2 * (1 - Q0 - V0 * TA) / (TA * TA), VI = V0 + ACL * TA;   // the normalized fall: z/Z0 against time
    const LIFE = IMP + 2.7, NSH = CEL ? 5 : ADE ? 4 : 3, NTR = CEL ? 7 : ADE ? 5 : 3, HE = 2.4 + 0.5 * (ev - 1), RW = R * 1.3, NFR = 7 + Math.round((ev - 1) * 1.15), seed = Math.floor(Math.random() * 1000);
    const MD = meteorModel(NSH, seed), FR = makeFractures(NFR, R * 1.15, seed), ax1 = g.norm([0.6, 0.35, 0.72]), ax2 = g.norm([-0.3, 0.8, 0.2]), lean = 0.55 * (R1(seed) < 0.5 ? 1 : -1);
    H.X.banner('DOOMSDAY', '', C.col, 1.5); H.X.sfx.hum(); H.warn(x, y, R, IMP, C.col);
    // the normalized height (1 at the start, 0 at the impact) and its rate
    const zn = t => t <= 0 ? 1 : t < TS ? 1 - V0 * t : Math.max(0, 1 - Q0 - V0 * (t - TS) - 0.5 * ACL * (t - TS) * (t - TS));
    const vn = t => t <= 0 ? 0 : t < TS ? V0 : V0 + ACL * (t - TS);
    const mist = [], ground = [], debris = [], flying = [];
    for (let i = 0; i < H.n(10 + 2 * ev); i++) mist.push({ a: i / (10 + 2 * ev) * TAU + R1(seed + i) * 0.5, r0: R * (0.1 + 0.2 * R1(seed + i * 2)), v: R * (0.55 + 0.5 * R1(seed + i * 3)), s: 0.55 + 0.45 * R1(seed + i * 5), ph: R1(seed + i * 7) * TAU });
    for (let i = 0; i < H.n(8 + 2 * ev); i++) ground.push({ a: R1(seed + i * 4.2) * TAU, r: R * (0.25 + 0.7 * R1(seed + i * 6.1)), rot: R1(seed + i * 8.3) * TAU, s: 0.1 + 0.1 * R1(seed + i * 9.7), d: R1(seed + i * 3.3) * 0.2 });
    const F = H.add({ life: LIFE, x, y, Z0: 0, rot: 0, spd: 0,
      update(dt, f) {
        const t = f.t, Z0 = f.Z0 || 7;
        if (t < IMP) {
          const z = zn(t) * Z0, v = vn(t) * Z0, spK = cl(v / (VI * Z0)); f.spd = spK; f.rot += dt * (0.5 + 0.5 * spK);
          const dx = lean * zn(t), px = x + dx, py = y - z * CE, r = S * 1.0;
          // condensing: black energy and violet motes drawn in to it
          if (t < 0.7) { const k = 7 * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, d = r * (1.8 + Math.random() * 1.8), life = 0.35 + Math.random() * 0.25; H.P({ kind: Math.random() < 0.5 ? 'spark' : 'ember', x: px + Math.cos(b) * d, y: py + Math.sin(b) * d * 0.7, vx: -Math.cos(b) * d / life, vy: -Math.sin(b) * d * 0.7 / life, g: 0, life, max: life, size: 1.5 + Math.random() * 1.5, color: Math.random() < 0.4 ? EDGE : Math.random() < 0.5 ? ENERGY : SMOKE }); } }
          // sparks, ash and dissolving fragments torn from the rear as it falls (more as it quickens)
          if (t > 0.4) { const k = (3 + 16 * spK) * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, d = r * (0.5 + Math.random() * 0.6), q = Math.random(); if (q < 0.45) H.P({ kind: 'spark', x: px + Math.cos(b) * d, y: py - r * 0.6 + Math.sin(b) * d * 0.5, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 2.5 * spK, g: -1, life: 0.3 + Math.random() * 0.25, max: 0.5, size: 1.4 + Math.random() * 1.6, color: Math.random() < 0.5 ? EDGE : ACC });
              else if (q < 0.75) H.P({ kind: 'shard', x: px + Math.cos(b) * d, y: py - r * 0.5 + Math.sin(b) * d * 0.5, vx: (Math.random() - 0.5) * 3, vy: -1 - Math.random() * 2 * spK, g: 2, life: 0.35 + Math.random() * 0.3, max: 0.6, size: 2 + Math.random() * 2.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, color: Math.random() < 0.5 ? PLUM : SMOKE });
              else H.P({ kind: 'smoke', x: px + Math.cos(b) * d * 0.6, y: py - r * 0.8, vx: (Math.random() - 0.5) * 1.2, vy: -0.6 - Math.random() * 1.2, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 0.25 + 0.2 * S, color: 'rgba(36,20,56,' }); } }
        } else {
          // the debris: the shell plates and core shards tumble out, fall, bounce once and settle; the small fragments too
          for (const d of debris) { d.age += dt; if (d.rest) continue; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.vz -= 14 * dt; d.ang += d.w * dt; if (d.z <= 0 && d.vz < 0) { d.z = 0; if (d.bn++ < 1) { d.vz *= -0.3; d.vx *= 0.5; d.vy *= 0.5; d.w *= 0.5; if (Math.random() < 0.6) H.burst(d.x, d.y, 'spark', 3, { v: 3, life: 0.3, size: 1.4, color: [EDGE, ACC] }); } else { d.rest = true; d.vx = d.vy = d.vz = 0; } } }
          for (const p of flying) { if (p.rest) continue; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 11 * dt; p.rot += p.vr * dt; if (p.z <= 0 && p.vz < 0) { p.z = 0; p.rest = true; } }
          // smoke drifting off the eruption, embers rising in it
          const post = t - IMP; if (post < 1.6 && Math.random() < 3 * dt * H.Q() * (1 - post / 1.6) * 10) { const b = Math.random() * TAU, hh = Math.random() * HE * 0.8; H.P({ kind: Math.random() < 0.6 ? 'smoke' : 'ember', x: x + Math.cos(b) * R * 0.2, y: y - hh * CE + Math.sin(b) * 0.2, vx: Math.cos(b) * 0.8, vy: -0.8 - Math.random() * 1.2, g: 0, life: 0.6 + Math.random() * 0.5, max: 1.1, size: Math.random() < 0.6 ? 0.3 + 0.15 * ev : 1.6, color: Math.random() < 0.6 ? 'rgba(40,25,60,' : Math.random() < 0.5 ? EDGE : SMOKE }); }
        }
      },
      drawUnder(c, f, X, Y, T, t) {
        const tt = f.t, RT = R * T, Z0 = f.Z0 || 7;
        if (tt < IMP) {
          // the pressure mark: a soft dark disc, a violet ring, ticks converging, a contracting pulse, inner broken arcs
          const u = cl(tt / IMP), k = cl(tt / 0.3), z = zn(tt) * Z0, near = cl(1 - z / 3.5);
          c.save(); c.globalAlpha = 0.65 * k * (0.45 + 0.55 * u); const ms = RT * (0.7 + 0.35 * u); c.drawImage(markSpr(), X - ms, Y - ms * H.GY, ms * 2, ms * 2 * H.GY); c.restore();
          floorLight(c, X, Y, RT * 1.0, (0.1 + 0.2 * u + 0.3 * near) * k, ENERGY);
          c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          c.globalAlpha = (0.15 + 0.15 * u) * k; c.strokeStyle = EDGE; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.arc(0, 0, RT, 0, TAU); c.stroke(); c.globalAlpha = (0.35 + 0.45 * u) * k; c.lineWidth = 1.5; c.stroke();
          c.globalAlpha = 0.6 * k; c.strokeStyle = EDGE; c.lineWidth = 1.4; c.beginPath(); for (let i = 0; i < 12; i++) { const b = i / 12 * TAU + t * 0.3, r1 = RT * (1.42 - 0.36 * u), r0 = RT * (1.2 - 0.16 * u); c.moveTo(Math.cos(b) * r1, Math.sin(b) * r1); c.lineTo(Math.cos(b) * r0, Math.sin(b) * r0); } c.stroke();
          c.globalAlpha = 0.45 * k; c.strokeStyle = ACC; c.lineWidth = 1.2; for (let i = 0; i < 3; i++) { const b = t * 0.6 * (i % 2 ? -1 : 1) + i * 2.1; c.beginPath(); c.arc(0, 0, RT * (0.75 - i * 0.17), b, b + 1.9); c.stroke(); }
          const pq = ((tt * 1.6) % 1); c.globalAlpha = (1 - pq) * 0.4 * k; c.strokeStyle = EDGE; c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.arc(0, 0, RT * (1.5 - 0.5 * pq), 0, TAU); c.stroke();
          c.restore();
          // the meteor's shadow, denser and larger as it nears; the air pressed under it in the last moments
          const dx = lean * zn(tt) * T; g.shadow(c, X + dx * 0.3, Y, T * S * 1.15, T * S * 1.15 * H.GY, z * 1.6, 0.15 + 0.5 * near * k);
          if (near > 0.5) { const q = (near - 0.5) / 0.5, rr = RT * (0.3 + 0.5 * q); c.save(); c.globalAlpha = 0.5 * q; c.drawImage(bandLSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); c.restore(); }
          return;
        }
        const post = tt - IMP, endK = cl((LIFE - tt) / 0.5);
        // the floor flash and the violet pool, fading
        floorLight(c, X, Y, RT * 1.1, 0.5 * Math.max(0, 1 - post / 0.35), ACC); floorLight(c, X, Y, RT * 1.1, (0.22 * Math.max(0, 1 - post / 1.6) + 0.08) * endK, ENERGY);
        // the shockwaves over the floor: a thick violet band, a light-only one after it, and (Celestial) the widest low one last
        for (const [d, sc, w, L] of CEL ? [[0, 1.0, 1, 0], [0.1, 1.2, 0.7, 1], [0.24, 1.45, 0.5, 1]] : [[0, 1.0, 1, 0], [0.12, 1.25, 0.7, 1]]) { const q = cl((post - d) / 0.7); if (q > 0 && q < 1) { const rr = RW * T * sc * H.ease.out(q); c.save(); c.globalAlpha = (1 - q) * w; c.drawImage(L ? bandLSpr() : bandSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); c.restore(); } }
        // the fracture field: light only, racing out, glowing, gone within two seconds
        const fg = H.ease.out(cl(post / 0.45)), fk = (1 - cl((post - 0.55) / 1.55)) * endK;
        if (fk > 0.01) { c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
          const layers = [[ENERGY, Math.max(3, T * 0.24), 0.4], [EDGE, Math.max(1.5, T * 0.075), 0.85], [ACC, 1.2, 0.6]];
          for (const [col, lw, al] of layers) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); for (const k of FR) { const gg = cl((fg - k.d) / (1 - k.d)); growPath(c, k.pts, gg, T); growPath(c, k.br, cl(gg * 1.6 - 0.5), T); } c.globalAlpha = al * fk * (0.75 + 0.25 * Math.sin(t * 6)); c.stroke(); }
          c.restore(); }
        // low mist rolling out from the centre, thinning; small fragments lying where they fell, fading with the mist
        const mk = (1 - cl((post - 0.4) / 1.9)) * endK; if (mk > 0.01) { const sp = dpuffSpr(); c.save(); for (const m of mist) { const d = m.r0 + m.v * H.ease.out(cl(post / 1.3)), px = X + Math.cos(m.a) * d * T, py = Y + Math.sin(m.a) * d * T * H.GY - post * T * 0.1, pr = T * m.s * (0.7 + 0.8 * cl(post / 0.8)) * (1 + 0.1 * Math.sin(t * 2 + m.ph)); c.globalAlpha = mk * 0.75 * cl(post / 0.2); c.drawImage(sp, px - pr, py - pr * 0.55, pr * 2, pr * 1.1); } c.restore();
          for (const q of ground) { const a = cl((post - q.d - 0.1) / 0.15) * (1 - cl((post - 1.3) / 0.6)) * endK; if (a <= 0.01) continue; frag(c, X + Math.cos(q.a) * q.r * T, Y + Math.sin(q.a) * q.r * T * H.GY, T * q.s, q.rot, a, true); } }
      },
      draw(c, f, X, Y, T, t) {
        const tt = f.t, SC = scr(c), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5;
        // the start height: the meteor's centre just inside the top of the play area (never under the HUD), 5.5..10 tiles up
        if (!f.Z0) { const room = Y - (SC.y0 + T * 3.1) - T * S * 0.9; f.Z0 = Math.max(5.5, Math.min(10, room / (CE * T))); }
        const Z0 = f.Z0;
        if (tt < IMP + 0.08) {
          const z = zn(tt) * Z0, v = vn(tt) * Z0, spK = cl(v / (VI * Z0)), near = cl(1 - z / 3.8), form = cl(tt / 0.5), dx = lean * zn(tt), MX = X + dx * T, MY = Y - z * CE * T, r = S * T * 1.05;
          // near the pet the whole meteor dims smoothly (never a cut-out)
          const dP = Math.hypot(PX - MX, PY - MY), AL = 0.25 + 0.75 * sstep(-r * 0.25, T * 1.0, dP - r), fa = cl(tt / 0.25);
          // the air darkened round it, the violet glow through it
          c.save(); c.globalAlpha = AL * fa * 0.8; const hr = r * 2.0; c.drawImage(haloSpr(), MX - hr, MY - hr, hr * 2, hr * 2); c.restore();
          glow(c, MX, MY, r * 2.2, ENERGY, AL * fa * (0.22 + 0.3 * near)); glow(c, MX, MY, r * 1.3, EDGE, AL * fa * (0.08 + 0.3 * near));
          // the trails torn off its rear, along the real screen velocity (up and slightly aside): a wide column of shadow,
          // dark streaks, two violet ones and a pale thread, their lengths growing with the speed
          const vx = -lean * vn(tt) * Z0 * T, vy = v * CE * T, vl = Math.hypot(vx, vy) || 1, ux = -vx / vl, uy = -vy / vl, ang = Math.atan2(uy, ux);
          if (spK > 0.02 && form > 0.6) { c.save(); c.translate(MX, MY); c.rotate(ang); const Lb = r * (1.2 + 3.2 * spK);
            c.globalAlpha = AL * 0.75 * spK; c.drawImage(darkStreak(), -r * 0.3, -r * 1.1, Lb, r * 2.2);
            for (let j = 0; j < NTR; j++) { const o = ((j + 0.5) / NTR - 0.5) * r * 1.5, L = r * (1.2 + 3.0 * spK) * (0.6 + 0.6 * R1(seed + j * 3)), w = r * (0.26 + 0.26 * R1(seed + j * 5)), sway = Math.sin(t * 9 + j * 1.7) * 0.07 * spK; c.save(); c.translate(r * 0.25 * (1 - Math.abs(o) / r), o); c.rotate(sway); c.globalAlpha = AL * (0.8 + 0.2 * spK); c.drawImage(j % 3 === 1 ? plumStreak() : darkStreak(), -r * 0.4, -w / 2, L, w); c.restore(); }
            c.globalCompositeOperation = 'lighter'; for (let j = 0; j < 2 + (ADE ? 1 : 0); j++) { const o = (j - 1) * r * 0.5 + Math.sin(t * 7 + j) * r * 0.08, L = r * (0.8 + 2.2 * spK), w = r * 0.16; c.globalAlpha = AL * (0.3 + 0.6 * spK); c.drawImage(vioStreak(), -r * 0.2, o - w / 2, L, w); }
            c.globalAlpha = AL * 0.7 * spK; c.drawImage(accStreak(), 0, -r * 0.04, r * (0.6 + 1.8 * spK), r * 0.08);
            c.restore(); }
          // the meteor itself: condensing out of black energy, tumbling slowly, compressing at the impact
          const Rm = g.mm(g.axisR(ax1, f.rot + seed), g.mm(g.axisR(ax2, f.rot * 0.37), g.rx(0.5)));
          const comp = tt > IMP - 0.07 ? cl((tt - IMP + 0.07) / 0.15) : 0;
          c.save(); if (comp > 0) { c.translate(MX, MY + r * 0.45 * comp); c.scale(1 + 0.3 * comp, 1 - 0.45 * comp); c.translate(-MX, -MY); }
          const cm = g.cam(X, Y, T); drawMeteor(c, cm, MD, Rm, [dx, 0, z], { s: S, form, near, alpha: AL * fa * (1 - cl((tt - IMP) / 0.08)), cel: CEL, t: tt, T });
          c.restore();
          // the energy gathering while it condenses: a swirl of violet light drawn in to it
          if (tt < 0.7) { const q = 1 - cl((tt - 0.4) / 0.3); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + t * 2.2, rr = r * (1.3 + 1.6 * (1 - form)), xx = MX + Math.cos(b) * rr, yy = MY + Math.sin(b) * rr * 0.6; c.globalAlpha = AL * q * 0.6; c.strokeStyle = i % 2 ? EDGE : ENERGY; c.lineWidth = Math.max(1, T * 0.06); c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(MX + Math.cos(b + 0.6) * rr * 0.5, MY + Math.sin(b + 0.6) * rr * 0.3, MX, MY); c.stroke(); } c.restore(); glow(c, MX, MY, r * 1.6 * (1 + (1 - form)), ENERGY, AL * q * 0.4); }
          if (tt < IMP) return;
        }
        const post = tt - IMP, AL = 0.2 + 0.8 * sstep(T * 0.9, T * 2.4, g.segD(PX, PY, X, Y, X, Y - HE * CE * T));
        // the impact: the core flash, rays, the low shockwave in the air
        const fl = Math.max(0, 1 - post / 0.3); if (fl > 0) { glow(c, X, Y - T * 0.5, R * T * 0.75 * (0.6 + 0.4 * H.ease.out(cl(post / 0.1))), ACC, AL * fl * 0.8); glow(c, X, Y - T * 0.3, R * T * 0.3, WHITE, AL * fl * 0.7); }
        const ra = Math.max(0, 1 - post / 0.75); if (ra > 0) { const NR = 8 + 2 * ev; for (let i = 0; i < NR; i++) { const b = -Math.PI + (i + 0.5) / NR * Math.PI + Math.sin(i * 7.3) * 0.1, L = R * T * (0.9 + 0.6 * R1(seed + i * 3)) * H.ease.out(cl(post / 0.3)); H.ray(c, X, Y - T * 0.3, b, L, T * (0.3 + 0.3 * R1(seed + i)), i % 3 ? EDGE : ACC, 0.55 * ra * AL); } }
        { const q = cl(post / 0.55); if (q > 0 && q < 1) { const rr = R * T * 1.3 * H.ease.out(q), ry = rr * 0.42; c.save(); c.globalAlpha = (1 - q) * 0.7 * AL; c.drawImage(bandLSpr(), X - rr, Y - T * 0.6 - ry, rr * 2, ry * 2); c.restore(); } }
        // the eruption: a dark column rising from the centre, violet light up its heart, currents climbing it, dark rings
        // riding up it, a cloud spreading at its top; it slows, widens, lifts and thins away
        const rise = H.ease.out(cl(post / 0.5)), late = cl((post - 0.5) / 1.6), fadeK = (1 - cl((post - 0.8) / 1.4)) * AL;
        if (fadeK > 0.01 && rise > 0.02) { const hpx = T * HE * rise * (1 + 0.15 * late), w = T * R * 0.3 * (0.55 + 0.45 * rise) * (1 + 0.45 * late), lift = T * 0.7 * late, top = Y - hpx - lift;
          c.save(); c.globalAlpha = fadeK * 0.92; c.drawImage(colSpr(), X - w, top, w * 2, hpx + lift * 0.5); c.restore();
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fadeK * (0.35 + 0.45 * (1 - cl(post / 0.7))); c.drawImage(colLSpr(), X - w * 0.42, top, w * 0.84, hpx + lift * 0.5); c.lineCap = 'round';
          for (let i = 0; i < 3 + (ev >> 1); i++) { c.beginPath(); for (let k = 0; k <= 10; k++) { const u = k / 10, xx = X + Math.sin(u * 5.5 + post * 7 + i * 2.1) * w * (0.25 + 0.4 * u), yy = Y - (hpx + lift * 0.5) * u - lift * 0.5 * u; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.globalAlpha = fadeK * 0.45; c.strokeStyle = EDGE; c.lineWidth = Math.max(1, T * 0.05); c.stroke(); c.globalAlpha = fadeK * 0.5; c.strokeStyle = ACC; c.lineWidth = 1; c.stroke(); }
          c.restore();
          c.save(); c.lineCap = 'butt'; for (let i = 0; i < 3; i++) { const hq = ((post * 0.9 + i / 3) % 1), hy = Y - hq * (hpx + lift * 0.5), rx = w * (1.05 + 0.35 * hq), ry = rx * 0.3; c.globalAlpha = fadeK * (1 - hq) * 0.8; c.strokeStyle = VOID; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.ellipse(X, hy, rx, ry, 0, 0, TAU); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = EDGE; c.lineWidth = 1.2; c.globalAlpha = fadeK * (1 - hq) * 0.55; c.stroke(); c.globalCompositeOperation = 'source-over'; } c.restore();
          const cs = cl((post - 0.25) / 0.6); if (cs > 0) { const sp = dpuffSpr(); c.save(); for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + R1(seed + i * 4) * 0.8, dd = w * (0.3 + 1.3 * H.ease.out(cs)) * (0.6 + 0.6 * R1(seed + i)), pr = w * (0.6 + 0.5 * R1(seed + i * 9)) * (0.5 + 0.7 * cs); c.globalAlpha = fadeK * 0.85; c.drawImage(sp, X + Math.cos(b) * dd - pr, top + Math.sin(b) * dd * 0.45 - pr - cs * T * 0.3, pr * 2, pr * 2); } c.restore(); }
        }
        // the smoke left hanging over the impact, thinning
        const sm = Math.max(0, 1 - post / 1.5) * AL; if (sm > 0) { const sp = puffSpr(); c.save(); for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + R1(seed + i * 5) * 0.9, dd = R * T * (0.25 + 0.6 * H.ease.out(cl(post / 0.9))) * (0.7 + 0.5 * R1(seed + i * 2)), pr = R * T * (0.28 + 0.2 * R1(seed + i * 9)) * (0.6 + 0.6 * cl(post / 0.5)); c.globalAlpha = sm * sm * 0.8; c.drawImage(sp, X + Math.cos(b) * dd - pr, Y + Math.sin(b) * dd * 0.5 - pr - post * T * 0.35, pr * 2, pr * 2); } c.restore(); }
        // the debris: the shell plates and core shards as tumbling solids, the small fragments as dark triangles
        const list = debris.filter(d => d.age < 1.9).sort((a, b) => a.y - b.y);
        for (const d of list) { const a = (1 - cl((d.age - 1.3) / 0.6)) * AL; if (a <= 0.01) continue; const cm = g.cam(H.sx(d.x), H.sy(d.y), T); g.shadow(c, cm.X, cm.Y, T * d.s * 0.8, T * d.s * 0.8 * H.GY, d.z * 1.5, 0.3 * a);
          g.solid(c, cm, d.M, { R: g.mm(g.axisR(d.axis, d.ang), d.R0), t: [0, 0, d.z + d.s * 0.2], s: d.s }, { mat: MAT_FLAT, ink: INK, lw: 0.05, lwI: 0.016, inkIA: 0.3, alpha: a }); }
        for (const p of flying) { const a = (1 - cl((post - 1.2) / 0.5)) * AL; if (a <= 0.01) continue; frag(c, H.sx(p.x), H.sy(p.y) - p.z * CE * T, T * p.s, p.rot, a, p.rest); }
      } });
    void F;
    // the timeline: the fall quickens with a whoosh; the impact (one hit, the negative frame, the shock); the eruption's thud
    H.X.after(TS, () => { H.X.sfx.whoosh(); H.X.shake(2, 0.6); });
    H.X.after(IMP - 0.35, () => H.X.shake(5, 0.35));
    H.X.after(IMP, () => {
      if (H.X.negative) H.X.negative(0.08);
      H.hitArea(x, y, R, DMG, C.dmgO({ kb: 7, stun: 0.5 }));
      H.X.flash(0.22, ACC); H.X.hitstop(0.1); H.X.sfx.crash(); H.X.shake(22 + 2 * ev, 0.45); H.X.light(x, y, R * 1.4, 0.4);
      H.X.boom(x, y, R * 0.8, EDGE, ACC, { n: 30 + 2 * ev, shake: 20, smoke: 8 }); H.X.ring(x, y, 0.4, RW, 0.6, EDGE, 0.5); H.X.ring(x, y, 0.3, RW * 0.6, 0.45, ACC, 0.3);
      // the plates and core shards fly out from where the meteor struck, the small fragments after them
      for (let i = 0; i < NSH + 2 + (ev >> 1); i++) { const sh = MD.shells[i % NSH], b = i / (NSH + 2 + (ev >> 1)) * TAU + Math.random() * 0.5, v = 3 + Math.random() * 3.5 + 0.2 * ev, core = i >= NSH; debris.push({ M: sh.M, R0: sh.R0, x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2, z: 0.4 + Math.random() * 0.5, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 3.5 + Math.random() * 4, axis: g.norm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]), ang: Math.random() * TAU, w: (Math.random() - 0.5) * 12, s: S * (core ? 0.45 + Math.random() * 0.2 : 0.75 + Math.random() * 0.2), age: 0, bn: 0, rest: false }); }
      for (let i = 0; i < H.n(14 + 3 * ev); i++) { const b = Math.random() * TAU, v = 2.5 + Math.random() * 5; flying.push({ x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2, z: 0.3 + Math.random() * 0.8, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 3 + Math.random() * 5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, s: 0.1 + Math.random() * 0.14 + 0.01 * ev, rest: false }); }
      for (let j = 0; j < H.n(26 + 3 * ev); j++) { const b = Math.random() * TAU, v = 4 + Math.random() * 7; H.P({ kind: 'spark', x, y: y - 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6 - 2, g: 4, life: 0.45 + Math.random() * 0.3, max: 0.75, size: 2 + Math.random() * 1.5, color: j % 3 ? EDGE : ACC }); }
      for (let j = 0; j < H.n(12); j++) { const b = Math.random() * TAU; H.P({ kind: 'shard', x: x + Math.cos(b) * 0.4, y: y - 0.3, vx: Math.cos(b) * (3 + Math.random() * 4), vy: Math.sin(b) * 2.5 - 3 - Math.random() * 3, g: 9, life: 0.6 + Math.random() * 0.4, max: 1, size: 3 + Math.random() * 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, color: j % 2 ? PLUM : SMOKE }); }
      for (let j = 0; j < H.n(8); j++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + Math.cos(b) * 0.5, y: y - 0.4 + Math.sin(b) * 0.3, vx: Math.cos(b) * 1.6, vy: Math.sin(b) * 0.9 - 0.7, life: 1.2, max: 1.2, size: 0.6 + 0.4 * Math.random() + 0.05 * ev, color: 'rgba(70,48,82,' }); }
    });
    H.X.after(IMP + 0.1, () => H.X.sfx.thud()); H.X.after(IMP + 0.3, () => { H.X.sfx.hum(); H.X.shake(6, 0.3); });
    if (CEL) H.X.after(IMP + 0.24, () => { H.X.sfx.whoosh(); H.X.shake(8, 0.25); });
  };
  // the debug door for the harness: the model alone
  U.doomsday.__dbg = { drawMeteor, meteorModel, MAT, G: GeoKit };
})();
