/* ---------- Dark, reworked: Doomsday (v391 U2: this 2D picture is now the FALLBACK; the GPU Doomsday is further down) ----------
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
   the soft pieces are cached sprites; the meteor's own textures are GeoKit's tiled patterns.
   (v391 U2) Kept unchanged as DOOM_2D.cast: U.doomsday (below) plays it whenever the GPU picture cannot run (no WebGL, a
   software rasteriser, a lost context, window.__DOOM_GL = 0). */
const DOOM_2D = {};
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
  DOOM_2D.cast = (C, h) => {
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
  DOOM_2D.__dbg = { drawMeteor, meteorModel, MAT, G: GeoKit };
})();

/* ---------- v391 U2: Doomsday, rebuilt on the GPU ----------
   One colossal meteor of dark energy tears out of a darkening sky and plunges onto the aim; the world turns negative for an
   instant at the impact. The gameplay is the earlier Doomsday's to the letter (one Dark AoE hit at IMP = 2.25 + 0.05 (evo - 1)
   s: 14 x base x K x evoK, radius (3.2 + 0.2 (evo - 1)) K, kb 7, stun 0.5; the same banner, warning, sounds, shakes, hitstop,
   flash and negative frame); only the picture is new.
     0.0  the sky darkens (a top-heavy shade over the whole view) and storm clouds gather, wheeling round a point high over the
          aim; 0.1 the sky tears open there: a jagged rift whose rims are soft overlapping beams of violet light, a swirling
          vortex deep inside it, crackling branches off its edges, a shaft of light down from it.
     0.3  the meteor pushes out of the tear: a real 3D mesh (GLM, material 135: craggy obsidian, glassy facets, a network of
          violet-hot fissures) spinning on two axes, in a plasma sheath (a turbulent energy orb, a comet-head teardrop of
          orbs behind it), the slow first second of its fall establishing its size; then it accelerates hard: a long comet
          trail (energy beams feathered at their far end, a column of dark smoke puffs left in the air, embers peeling off),
          a bow shock, real heat haze behind it (the scene refracted through a soft mask), its fissures brightening and its
          underside lit as the ground nears.
     on the ground meanwhile: a dark pressure mark (a soft shade, no edge), a soft ring marking the radius, soft rings
          contracting onto the centre, motes of light spiralling in, the meteor's shadow condensing; hairline cracks glow at
          the end.
     IMP  the hit; a blinding soft flash (white core, violet bloom over the whole view, an anamorphic streak), the negative
          frame, hitstop; a fireball; a soft dome shockwave (gaussian rings, the air refracted along its front) and rolling
          energy waves over the floor; GLM debris chunks (material 136) tumbling out, bouncing once, their fissures cooling;
          sparks and a ring of dust; a mushroom of violet smoke (a stem with energy rising inside it, a rolling cap lit from
          within); glowing cracks racing out over the floor; embers drifting down; the sky lightens again.
   Every light is an FGFX quad of a soft kind (glow, gaussian beam chains, energy orbs and waves, shimmer rings, smoke): no
   stroked circle, no sprite border. Smoke and the dark shades are laid over (they read on a light floor); light is added.
   Layers: drawUnder (the ground: 2D shades, then one FGFX pass), draw (the sky shade and the heat haze in 2D, an FGFX pass
   behind the meteor, the GLM meteor or debris, an FGFX pass in front). Particles live in typed arrays per cast.
   FALLBACK: when the GPU cannot draw it (no WebGL, a software rasteriser, window.__DOOM_GL = 0, or __NG_GL = 0) the cast is
   the earlier 2D Doomsday, unchanged (DOOM_2D.cast above). A context lost mid-cast draws soft 2D glows for the rest of it.
   Tests: window.__DOOM_GL = 1 (with __NG_GL = 1) forces the GPU picture on a software rasteriser; tests/_ult-doomsday.js. */
(() => {
  const U = ELEM_IMPL.dark.ult, TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eo = u => { u = cl(u); return 1 - (1 - u) * (1 - u) * (1 - u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const ZK = 0.814, GYM = 0.581;   // (height on the screen per tile up; the mesh's own floor squash: the camera ~36 degrees above the floor)
  const VOIDC = '#06030D', DEEP = '#4A1A96', ENERGY = '#8A3CFF', EDGE = '#A55CFF', PALE = '#CDA8FF', WHITE = '#FFFFFF', HOT = '#EEDDFF', SMK = '#2C1844', SMKL = '#432862', DUST = '#3A2C48', CLOUD = '#1A1230';
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const ST = { gpu: 0, glm: 0, fb: 0, lost: 0, casts: 0, maxQ: 0 };
  const OFF = k => typeof window !== 'undefined' && !!window.__DOOM_OFF && window.__DOOM_OFF.indexOf(k) >= 0;   // (tests: layers left out, to look at the others)
  const fg = () => { try { if (typeof window !== 'undefined' && window.__DOOM_GL === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  let NOGL = false, GLFAIL = 0;
  const glmOn = () => { try { if (NOGL || typeof GLM === 'undefined' || (typeof window !== 'undefined' && window.__DOOM_GL === 0)) return false; if (!GLM.ok()) return false; if (GLM.soft && !(typeof window !== 'undefined' && window.__DOOM_GL)) return false; return true; } catch (e) { return false; } };
  const gpuReady = () => !!fg() && glmOn() && !!meshes();
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }

  /* ---- 2D pieces: soft shades and masks (cached gradients: no edge anywhere) ---- */
  const skySpr = () => fxSprite('du6sky', 4, 256, g => { const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(5,2,12,0.78)'); gr.addColorStop(0.3, 'rgba(8,4,18,0.58)'); gr.addColorStop(0.65, 'rgba(12,5,26,0.36)'); gr.addColorStop(1, 'rgba(14,6,30,0.26)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 256); });
  const shadeSpr = () => fxSprite('du6shade', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(6,3,12,0.85)'); gr.addColorStop(0.35, 'rgba(8,4,16,0.6)'); gr.addColorStop(0.7, 'rgba(14,6,28,0.2)'); gr.addColorStop(1, 'rgba(14,6,28,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const maskE = () => fxSprite('du6maskE', 64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.45, 'rgba(0,0,0,0.85)'); gr.addColorStop(0.85, 'rgba(0,0,0,0.15)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const maskR = () => fxSprite('du6maskR', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(0,0,0,0)'); gr.addColorStop(0.74, 'rgba(0,0,0,0.9)'); gr.addColorStop(0.84, 'rgba(0,0,0,0.9)'); gr.addColorStop(0.97, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  /* the sky's shade over the whole view, with a soft opening over the aim so the pressure mark and the blast on the floor
     stay lit (a small canvas, stretched: the gradient and the hole are both smooth) */
  let SKY = null;
  function skyShade(c, SC, X, Y, RT, dk) {
    if (!SKY) { SKY = document.createElement('canvas'); SKY.width = 72; SKY.height = 156; }
    const g = SKY.getContext('2d'), w = SKY.width, h = SKY.height; g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h); g.drawImage(skySpr(), 0, 0, w, h);
    const hx = (X - SC.x0) / SC.w * w, hy = (Y - SC.y0) / SC.h * h, rx = RT * 1.7 / SC.w * w, ry = RT * 1.7 * 0.62 / SC.h * h; g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.72; g.drawImage(maskE(), hx - rx, hy - ry, rx * 2, ry * 2);
    blit(c, SKY, SC.x0 - 2, SC.y0 - 2, SC.w + 4, SC.h + 4, dk); }
  function blit(c, img, x, y, w, h, a, op) { if (!(a > 0.004) || w < 1 || h < 1) return; c.save(); if (op) c.globalCompositeOperation = op; c.globalAlpha = Math.min(1, a); c.drawImage(img, x, y, w, h); c.restore(); }
  /* heat haze: the scene inside an ellipse (cx, cy, rx, ry in the context's units) copied at half resolution, laid back in
     thin strips shifted sideways by a travelling wave of amp px, through a soft mask (an ellipse, or a ring when ring): a real
     refraction of what is behind, fading to the untouched scene with no edge */
  let HZ1 = null, HZ2 = null;
  function haze(c, cx, cy, rx, ry, amp, t, ring) {
    if (lowFx() || amp < 0.3 || rx < 4 || ry < 4) return;
    try { const m = c.getTransform(), cv = c.canvas, s = Math.hypot(m.a, m.b) || 1;
      let dx0 = Math.floor(m.a * (cx - rx) + m.e), dy0 = Math.floor(m.d * (cy - ry) + m.f), dw = Math.ceil(2 * rx * s), dh = Math.ceil(2 * ry * s);
      const ox = Math.max(0, -dx0), oy = Math.max(0, -dy0); if (dx0 + dw > cv.width) dw = cv.width - dx0; if (dy0 + dh > cv.height) dh = cv.height - dy0; if (dw - ox < 8 || dh - oy < 8) return;
      const k = Math.min(0.5, 360 / Math.max(dw, dh)), w2 = Math.max(4, Math.ceil(dw * k)), h2 = Math.max(4, Math.ceil(dh * k)), A = amp * s * k;
      if (!HZ1) { HZ1 = document.createElement('canvas'); HZ2 = document.createElement('canvas'); }
      if (HZ1.width < w2 || HZ1.height < h2) { HZ1.width = HZ2.width = Math.max(w2, HZ1.width); HZ1.height = HZ2.height = Math.max(h2, HZ1.height); }
      const g1 = HZ1.getContext('2d'), g2 = HZ2.getContext('2d'); g1.setTransform(1, 0, 0, 1, 0, 0); g1.clearRect(0, 0, w2, h2); g1.drawImage(cv, dx0 + ox, dy0 + oy, dw - ox, dh - oy, ox * k, oy * k, (dw - ox) * k, (dh - oy) * k);
      g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.globalAlpha = 1; g2.clearRect(0, 0, HZ2.width, HZ2.height);
      for (let y = 0; y < h2; y += 2) { const o = Math.sin(y * 0.42 / Math.max(0.6, k * 2) + t * 11) * A + Math.sin(y * 0.17 / Math.max(0.6, k * 2) - t * 6.3) * A * 0.6; g2.drawImage(HZ1, 0, y, w2, 2, o, y + Math.sin(y * 0.3 + t * 7) * A * 0.25, w2, 2); }
      g2.globalCompositeOperation = 'destination-in'; g2.drawImage(ring ? maskR() : maskE(), 0, 0, w2, h2); g2.globalCompositeOperation = 'source-over';
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(HZ2, 0, 0, w2, h2, dx0, dy0, w2 / k, h2 / k); c.restore(); } catch (e) { /* (a tainted or lost canvas: no haze) */ }
  }

  /* ---- the meshes (GLM): craggy rocks, each the hull of random planes (a faceted, convex mass) roughened by noise; the
     facet ridges ride in the second attribute, how proud the surface stands (crevice .. peak) in the third ---- */
  let MESH = null;
  function rockMesh(seed, nPl, g, sx, sy, sz, mat) {
    const B = GLM.builder(1), pl = [];
    for (let i = 0; i < nPl; i++) { const z = R1(seed + i * 3.7) * 2 - 1, a = R1(seed + i * 5.1) * TAU, q = Math.sqrt(1 - z * z); pl.push([q * Math.cos(a), q * Math.sin(a), z, 0.8 + 0.2 * R1(seed + i * 7.3)]); }
    const rad = d => { let m1 = 9, m2 = 9; for (const p of pl) { const c = p[0] * d[0] + p[1] * d[1] + p[2] * d[2]; if (c < 0.1) continue; const r = p[3] / c; if (r < m1) { m2 = m1; m1 = r; } else if (r < m2) m2 = r; } m1 = Math.min(m1, 1.22); m2 = Math.min(m2, 1.3);
      const n1 = Math.sin(d[0] * 7.3 + seed) * Math.sin(d[1] * 6.1 + seed * 1.7) * Math.sin(d[2] * 5.3 + seed * 2.3), n2 = Math.sin(d[0] * 17 + d[2] * 9 + seed) * Math.sin(d[1] * 15 - d[0] * 7 + seed);
      const gro = Math.max(0, 1 - Math.abs(Math.sin((d[0] * 3.1 + d[1] * 2.3 - d[2] * 1.7) * 3 + seed)) * 6) * 0.05;   // (a few grooves where fissures run)
      return [m1 * (1 + 0.045 * n1 + 0.015 * n2 - gro), cl(1 - (m2 - m1) / 0.07), cl((1 + 0.045 * n1 - gro * 1.5 - 0.92) / 0.16)]; };
    for (let ax = 0; ax < 3; ax++) for (const sg of [-1, 1]) {
      const G2 = [];   // (the grid's values first: position, ridge, proud)
      for (let j = 0; j <= g; j++) for (let i = 0; i <= g; i++) { const p = [0, 0, 0]; p[ax] = sg; p[(ax + 1) % 3] = (i / g * 2 - 1) * sg; p[(ax + 2) % 3] = j / g * 2 - 1; const l = Math.hypot(p[0], p[1], p[2]), d = [p[0] / l, p[1] / l, p[2] / l], r = rad(d); G2.push([[d[0] * r[0] * sx, d[1] * r[0] * sy, d[2] * r[0] * sz], r[1], r[2]]); }
      const at = (u, v) => G2[Math.round(v * g) * (g + 1) + Math.round(u * g)];
      B.surf((u, v) => at(u, v)[0], g, g, () => mat, { e: (u, v) => at(u, v)[1], a: (u, v) => at(u, v)[2] }); }
    return B.done(); }
  function meshes() {
    if (MESH) return MESH; if (typeof GLM === 'undefined') return null;
    try { MESH = { core: [rockMesh(11, 40, 18, 1, 1, 0.92, 135), rockMesh(47, 36, 18, 1.05, 0.95, 0.9, 135)], chunk: [rockMesh(3, 9, 6, 1, 0.7, 0.55, 136), rockMesh(19, 8, 6, 0.8, 0.9, 0.5, 136), rockMesh(29, 10, 6, 1.1, 0.6, 0.6, 136), rockMesh(71, 9, 6, 0.75, 0.75, 0.75, 136)] }; }
    catch (e) { NOGL = true; MESH = null; try { console.warn('Doomsday: meshes', e); } catch (e2) {} }
    return MESH; }
  /* rotations: 3x3 as three columns */
  const axisR = (a, ang) => { const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c, [x, y, z] = a; return [[t * x * x + c, t * x * y + s * z, t * x * z - s * y], [t * x * y - s * z, t * y * y + c, t * y * z + s * x], [t * x * z + s * y, t * y * z - s * x, t * z * z + c]]; };
  const mv = (M, v) => [M[0][0] * v[0] + M[1][0] * v[1] + M[2][0] * v[2], M[0][1] * v[0] + M[1][1] * v[1] + M[2][1] * v[2], M[0][2] * v[0] + M[1][2] * v[1] + M[2][2] * v[2]];
  const mm = (A, B) => [mv(A, B[0]), mv(A, B[1]), mv(A, B[2])];
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const LK = nrm([-0.5, 0.4, 0.78]), LS = nrm([-0.2, -0.3, 0.93]), LR = nrm([0.5, -0.7, 0.5]), UPW = [0, 0, 1], PX = [1, 0, 0], PY = [0, GYM, -ZK], PD = [0, ZK, GYM], RIMC = [0.9, 0.42, 1.7], AMBC = [1, 1, 1], OUTC = [0.03, 0.012, 0.055];
  const GI = [], GJ = [];
  /* one GLM pass: list = [{ M, R, s, p: [x, y, z] tiles from the origin, al, glow, glow2, spill, fx, wear }] drawn round the
     screen point (X0, Y0) of the origin at k px a tile */
  function glmPass(c, list, X0, Y0, k, t) {
    let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of list) { const sx = X0 + it.p[0] * k, sy = Y0 + (it.p[1] * GYM - it.p[2] * ZK) * k, rr = it.s * 1.4 * k + 2; bx0 = Math.min(bx0, sx - rr); bx1 = Math.max(bx1, sx + rr); by0 = Math.min(by0, sy - rr); by1 = Math.max(by1, sy + rr); }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform(), dev = Math.max(0.25, Math.hypot(m.a, m.b)) * (GLM.soft && !(typeof window !== 'undefined' && window.__DOOM_GLHQ) ? 0.5 : 1);
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, 1400 / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl));
    const bw = bx1 - bx0, bh = by1 - by0;
    const S = { px: PX, py: PY, pd: PD, cl: [2 * k / bw, 2 * (X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (Y0 - by0) / bh], v: PD, lk: LK, ls: LS, lr: LR, up: UPW, low: lowFx(), rim: RIMC, amb: AMBC, t, outline: Math.max(0.8, 1.0 * W / bw), outlineCol: OUTC };
    const items = GJ; items.length = 0; let n = 0;
    for (const it of list) { if (!(it.al > 0.004)) continue; const g = GI[n] || (GI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      for (let i = 0; i < 3; i++) { g.R0[i] = it.R[0][i] * it.s; g.R1[i] = it.R[1][i] * it.s; g.R2[i] = it.R[2][i] * it.s; g.T[i] = it.p[i]; }
      g.mesh = it.M; g.alpha = it.al > 0.995 ? 1 : it.al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.fx = it.fx || 0; g.kind = 0; g.wear = it.wear || 0; g.outline = it.al > 0.9 ? undefined : false; items.push(g); }
    if (!items.length) return false;
    items.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1));
    const cvs = GLM.render(W, H, S, items); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); ST.glm++; return true; }

  /* the fracture field: n cracks from the centre, each with a branch, in floor tiles (fixed at the cast) */
  function makeFractures(n, L, seed) { const out = []; for (let i = 0; i < n; i++) { let a = i / n * TAU + (R1(seed + i * 3.3) - 0.5) * 0.45, r = 0.25 + 0.2 * R1(seed + i), len = L * (0.6 + 0.5 * R1(seed + i * 5.1)); const pts = [[Math.cos(a) * r, Math.sin(a) * r]]; const N = 6; for (let k = 1; k <= N; k++) { a += (R1(seed + i * 11 + k) - 0.5) * 0.42; r += len / N * (0.7 + 0.6 * R1(seed + i * 7 + k)); pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const bk = 2 + Math.floor(R1(seed + i * 17) * 2), q = pts[bk], ba = Math.atan2(q[1], q[0]) + (R1(seed + i * 19) < 0.5 ? 0.75 : -0.75), bl = len * 0.35, br = [q]; for (let k = 1; k <= 3; k++) { const aa = ba + (R1(seed + i * 23 + k) - 0.5) * 0.4, rr = bl * k / 3; br.push([q[0] + Math.cos(aa) * rr, q[1] + Math.sin(aa) * rr]); }
    out.push({ pts, br, d: R1(seed + i * 31) * 0.12 }); } return out; }
  /* a chain of soft beams along screen points (overlapping so their fades sum; the last one's far end feathers out) */
  function chain(Q, P, n, w0, w1, col, a0, a1, kind, heat, seed) { for (let i = 0; i < n - 1; i++) { const u = i / Math.max(1, n - 2), x0 = P[i * 2], y0 = P[i * 2 + 1], x1 = P[i * 2 + 2], y1 = P[i * 2 + 3], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy); if (L < 0.5) continue; const w = lerp(w0, w1, u), e = 0.18 + w * 0.35 / L, ex = dx * e, ey = dy * e, a = lerp(a0, a1, u);
    if (kind === 20) Q.ebeam(x0 - ex, y0 - ey, x1 + ex, y1 + ey, w, col, heat, a, seed + i * 0.7, 5); else Q.beam(x0 - ex, y0 - ey, x1 + ex, y1 + ey, w, col, a); } }
  const CP = new Float32Array(64);
  /* a polyline in floor tiles about (X, Y), grown to g of its length, into CP (screen); returns its point count */
  function floorPts(pts, g, X, Y, T, GY) { const n = pts.length - 1; if (n < 1 || g <= 0) return 0; const k = g * n, m = Math.min(n, Math.floor(k)); let c = 0; for (let i = 0; i <= m; i++) { CP[c++] = X + pts[i][0] * T; CP[c++] = Y + pts[i][1] * T * GY; } if (m < n) { const e = k - m, a = pts[m], b = pts[m + 1]; CP[c++] = X + lerp(a[0], b[0], e) * T; CP[c++] = Y + lerp(a[1], b[1], e) * T * GY; } return c / 2; }

  /* ================= U.doomsday: the GPU picture where it can run, else the earlier 2D Doomsday ================= */
  U.doomsday = (C, H) => {
    if (!gpuReady()) { ST.fb++; return DOOM_2D.cast(C, H); }
    ST.casts++;
    const me = H.me, x = C.tx, y = C.ty, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), CEL = ev >= 7, ADE = ev >= 4, evoK = 1 + 0.08 * (ev - 1), K = C.K;
    const R = (3.2 + 0.2 * (ev - 1)) * K, DMG = C.base * 14 * K * evoK, S = (1 + 0.12 * (ev - 1)) * Math.sqrt(K), GY = H.GY;
    const TS = 1.0, IMP = 2.25 + 0.05 * (ev - 1), TA = IMP - TS, Q0 = 0.2, V0 = Q0 / TS, ACL = 2 * (1 - Q0 - V0 * TA) / (TA * TA), VI = V0 + ACL * TA;
    const LIFE = IMP + 2.7, HE = 2.4 + 0.5 * (ev - 1), RW = R * 1.3, NFR = 7 + Math.round((ev - 1) * 1.15), NTR = CEL ? 5 : ADE ? 4 : 3, seed = Math.floor(Math.random() * 1000);
    const MS = meshes(), MC = MS.core[seed & 1], FR = makeFractures(NFR, R * 1.15, seed), ax1 = nrm([0.6, 0.35, 0.72]), ax2 = nrm([-0.3, 0.8, 0.2]);
    let lean = 0.55 * (R1(seed) < 0.5 ? 1 : -1);   // (tiles aside at the start: set at the first frame to lean toward the middle of the view, the tear and the meteor kept on the screen)
    H.X.banner('DOOMSDAY', '', C.col, 1.5); H.X.sfx.hum(); H.warn(x, y, R, IMP, C.col);
    const zn = t => t <= 0 ? 1 : t < TS ? 1 - V0 * t : Math.max(0, 1 - Q0 - V0 * (t - TS) - 0.5 * ACL * (t - TS) * (t - TS));
    const vn = t => t <= 0 ? 0 : t < TS ? V0 : V0 + ACL * (t - TS);
    /* the particles: one pool per cast. kinds: 0 an ember (light), 1 trail smoke (laid over), 3 a spark streak (light), 4 dust (laid over) */
    const NP = 900, px = new Float32Array(NP), py = new Float32Array(NP), pz = new Float32Array(NP), pvx = new Float32Array(NP), pvy = new Float32Array(NP), pvz = new Float32Array(NP), pl = new Float32Array(NP), pm = new Float32Array(NP), ps = new Float32Array(NP), pd = new Float32Array(NP), pg = new Float32Array(NP), pk = new Uint8Array(NP), pc = new Uint8Array(NP); let pi = 0, acc0 = 0, acc1 = 0;
    const emit = (k, X, Y, Z, vx, vy, vz, life, size, drag, grav, col) => { const i = pi; pi = (pi + 1) % NP; px[i] = X; py[i] = Y; pz[i] = Z; pvx[i] = vx; pvy[i] = vy; pvz[i] = vz; pl[i] = life; pm[i] = life; ps[i] = size; pd[i] = drag; pg[i] = grav; pk[i] = k; pc[i] = col || 0; };
    const debris = [];
    const Qk = () => H.Q();
    const F = H.add({ life: LIFE, x, y, Z0: 0, rot: 0, lost: false,
      update(dt, f) {
        const t = f.t, Z0 = f.Z0 || 7;
        for (let i = 0; i < NP; i++) { if (pl[i] <= 0) continue; pl[i] -= dt; const dk = Math.max(0, 1 - pd[i] * dt); pvx[i] *= dk; pvy[i] *= dk; pvz[i] = pvz[i] * dk - pg[i] * dt; px[i] += pvx[i] * dt; py[i] += pvy[i] * dt; pz[i] += pvz[i] * dt; if (pz[i] < 0 && pk[i] !== 1) { pz[i] = 0; pvz[i] *= -0.25; pvx[i] *= 0.6; pvy[i] *= 0.6; } }
        if (t < IMP) {
          const z = zn(t) * Z0, v = vn(t) * Z0, spK = cl(v / (VI * Z0)), form = sm(0.3, 0.8, t); f.rot += dt * (0.6 + 1.6 * spK);
          const mx = x + lean * zn(t), r = S * (0.35 + 0.65 * form);
          if (form > 0.3) {
            // trail smoke left in the air (it stays where it was shed, swelling and thinning: the long comet trail)
            acc0 += (14 + 30 * spK) * dt * Qk() * form; while (acc0 >= 1) { acc0--; const b = Math.random() * TAU, d = r * 0.45 * Math.random(); emit(1, mx + Math.cos(b) * d, y + Math.sin(b) * d * 0.4, z + r * 0.3 + Math.random() * r * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.25, 0.2 + Math.random() * 0.3, 1.0 + Math.random() * 0.5, r * (0.55 + 0.3 * Math.random()), 0.6, 0, Math.random() < 0.3 ? 1 : 0); }
            // embers peeling off it
            acc1 += (20 + 70 * spK) * dt * Qk() * form; while (acc1 >= 1) { acc1--; const b = Math.random() * TAU, e = Math.random() * 2 - 1, q = Math.sqrt(1 - e * e); emit(0, mx + Math.cos(b) * q * r * 0.9, y + Math.sin(b) * q * r * 0.5, z + e * r * 0.9, Math.cos(b) * q * 1.4 - lean * v * 0.15, Math.sin(b) * q * 0.8, v * (0.15 + 0.35 * Math.random()) + 0.5, 0.45 + Math.random() * 0.55, 0.05 + 0.07 * Math.random(), 1.6, -0.6, Math.random() < 0.35 ? 1 : 0); }
          }
        } else {
          for (const d of debris) { d.age += dt; if (d.rest) continue; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.vz -= 14 * dt; d.ang += d.w * dt;
            if (d.z <= 0 && d.vz < 0) { d.z = 0; if (d.bn++ < 1) { d.vz *= -0.32; d.vx *= 0.5; d.vy *= 0.5; d.w *= 0.5; for (let j = 0; j < 4 * Qk(); j++) { const b = Math.random() * TAU; emit(3, d.x, d.y, 0.05, Math.cos(b) * 3, Math.sin(b) * 2, 1.5 + Math.random() * 2, 0.25 + Math.random() * 0.2, 0.05, 1, 9); } } else { d.rest = true; d.vx = d.vy = d.vz = 0; } } }
          // embers rising off the crater and the smoke for a while, drifting down later
          const post = t - IMP; if (post < 1.8) { acc1 += 26 * dt * Qk() * (1 - post / 1.8); while (acc1 >= 1) { acc1--; const b = Math.random() * TAU, rr = R * 0.35 * Math.random(); emit(0, x + Math.cos(b) * rr, y + Math.sin(b) * rr * 0.6, Math.random() * HE * 0.6, Math.cos(b) * 0.5, Math.sin(b) * 0.3, 0.6 + Math.random() * 1.2, 0.9 + Math.random() * 0.9, 0.05 + 0.06 * Math.random(), 0.8, 0.35, Math.random() < 0.4 ? 1 : 0); } }
        }
      },
      /* ---- the ground: the pressure mark, then the impact's floor ---- */
      drawUnder(c, f, X, Y, T, t) {
        const tt = f.t, RT = R * T, Z0 = f.Z0 || 7, Fq = fg(); if (!Fq) { f.lost = true; return; } if (OFF('ground')) return;
        if (tt < IMP) {
          const u = cl(tt / IMP), k = sm(0, 0.35, tt), z = zn(tt) * Z0, near = cl(1 - z / 3.6);
          // (2D) the pressure: a soft dark shade spreading over the floor; the meteor's shadow condensing on it
          const ms = RT * (0.75 + 0.45 * u); blit(c, shadeSpr(), X - ms, Y - ms * GY, ms * 2, ms * 2 * GY, 0.4 * k * (0.45 + 0.55 * u));
          const dx = lean * zn(tt) * T, ss = T * S * (2.2 - 1.1 * near); blit(c, shadeSpr(), X + dx * 0.4 - ss, Y - ss * GY, ss * 2, ss * 2 * GY, (0.12 + 0.6 * near) * k);
          const Q = Fq.begin(c, null);
          Q.glow(X, Y, RT * 1.25, DEEP, (0.18 + 0.22 * u + 0.4 * near) * k, GY); Q.glow(X, Y, RT * 0.55, ENERGY, (0.08 + 0.55 * near * near) * k, GY);
          Q.shimmer(X, Y, RT / 0.82, (0.22 + 0.2 * u) * k, GY, PALE);   // (the radius, as a soft ring)
          for (let i = 0; i < 3; i++) { const q = (tt * 0.85 + i / 3) % 1, rr = RT * (1.6 - 1.3 * q * q); Q.shimmer(X, Y, rr / 0.82, Math.sin(Math.PI * q) * (0.35 + 0.35 * u) * k, GY, i % 2 ? PALE : EDGE); }
          const NM = Math.round((16 + 2 * ev) * Qk()); for (let j = 0; j < NM; j++) { const q = (tt * 0.6 + j / NM + R1(seed + j) * 0.35) % 1, an = j / NM * TAU + R1(seed + j * 2) * 0.8 + (1 - q) * 2.4, rr = RT * 1.55 * Math.pow(1 - q, 1.25), a = Math.sin(Math.PI * q) * 0.85 * k, mx = X + Math.cos(an) * rr, my = Y + Math.sin(an) * rr * GY;
            Q.glow(mx, my, T * 0.2, ENERGY, a * 0.55); Q.glow(mx, my, T * 0.07, PALE, a * 0.55); }
          if (near > 0.55) { const g2 = (near - 0.55) / 0.45 * 0.35; for (const fr of FR) { const n = floorPts(fr.pts, g2, X, Y, T, GY); if (n > 1) chain(Q, CP, n, T * 0.14, T * 0.07, ENERGY, 0.5 * g2 / 0.35, 0.2, 2); } }
          Fq.flush(c); ST.gpu++;
          return;
        }
        const post = tt - IMP, endK = cl((LIFE - tt) / 0.6), fl = Math.exp(-post / 0.14);
        // (2D) the crater's scorch and the shade of the smoke over the floor
        const cs = RT * (0.55 + 0.25 * eo(post / 0.3)); blit(c, shadeSpr(), X - cs, Y - cs * GY, cs * 2, cs * 2 * GY, 0.7 * endK * (1 - sm(1.6, 2.6, post)));
        // (2D) the cracks' dark lines under their light, so they read on a pale floor
        const fg2 = eo(cl(post / 0.42)), fk = (1 - sm(1.3, 2.5, post)) * endK;
        if (fk > 0.01) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(14,6,26,0.55)'; c.lineWidth = Math.max(1.5, T * 0.07); c.globalAlpha = fk; c.beginPath();
          for (const fr of FR) for (const P of [fr.pts, fr.br]) { const gg = P === fr.pts ? cl((fg2 - fr.d) / (1 - fr.d)) : cl(cl((fg2 - fr.d) / (1 - fr.d)) * 1.6 - 0.5), n = floorPts(P, gg, X, Y, T, GY); for (let i = 0; i < n; i++) i ? c.lineTo(CP[i * 2], CP[i * 2 + 1]) : c.moveTo(CP[0], CP[1]); }
          c.stroke(); c.restore(); }
        const Q = Fq.begin(c, null);
        Q.glow(X, Y, RT * 1.8, PALE, 0.9 * fl, GY); Q.glow(X, Y, RT * 1.25, ENERGY, (0.4 * Math.max(0, 1 - post / 1.6) + 0.1) * endK, GY);
        for (const [d, sc, w] of CEL ? [[0, 1.05, 1], [0.1, 1.3, 0.75], [0.22, 1.6, 0.55]] : ADE ? [[0, 1.05, 1], [0.12, 1.35, 0.7]] : [[0, 1.05, 1], [0.14, 1.3, 0.6]]) { const q = cl((post - d) / 0.8); if (q > 0 && q < 1) Q.ewave(X, Y, RW * T * sc * eo(q), ENERGY, 0.95 - 0.3 * q, (1 - q) * w, seed * 0.1 + d * 10, GY, 0.22 + 0.1 * q); }
        if (fk > 0.01) { const pul = 0.8 + 0.2 * Math.sin(t * 7); for (const fr of FR) { const gg = cl((fg2 - fr.d) / (1 - fr.d)); let n = floorPts(fr.pts, gg, X, Y, T, GY); if (n > 1) { chain(Q, CP, n, T * 0.3, T * 0.16, ENERGY, 0.55 * fk * pul, 0.3 * fk, 2); chain(Q, CP, n, T * 0.08, T * 0.05, HOT, 0.85 * fk, 0.5 * fk, 2); }
          n = floorPts(fr.br, cl(gg * 1.6 - 0.5), X, Y, T, GY); if (n > 1) { chain(Q, CP, n, T * 0.2, T * 0.1, ENERGY, 0.45 * fk * pul, 0.25 * fk, 2); chain(Q, CP, n, T * 0.06, T * 0.04, HOT, 0.6 * fk, 0.4 * fk, 2); } } }
        const ca = (1 - sm(0.5, 2.2, post)) * endK; if (ca > 0.01) Q.quad(19, X, Y, RT * 0.42, 0, 0, RT * 0.42 * GY, ENERGY, 0.75 * ca, 0.75 + 0.3 * fl, seed * 0.3, 0.6);   // (the crater's glowing heart)
        Fq.flush(c); ST.gpu++;
      },
      /* ---- the sky, the meteor and the blast ---- */
      draw(c, f, X, Y, T, t) {
        const tt = f.t, SC = scr(c), PX0 = H.sx(me.x), PY0 = H.sy(me.y) - T * 0.5, low = lowFx();
        if (!f.Z0) { const room = Y - (SC.y0 + T * 3.1) - T * S * 0.9; f.Z0 = Math.max(3.4, Math.min(10, room / (ZK * T)));   // (the start height: the meteor and the tear always below the HUD)
          const cx = SC.x0 + SC.w / 2, sg = X > cx ? -1 : 1, lo = SC.x0 + T * S * 2.2, hi = SC.x0 + SC.w - T * S * 2.2; let lx = X + sg * 0.55 * T; lx = Math.max(lo, Math.min(hi, lx)); lean = Math.max(-3, Math.min(3, (lx - X) / T)); }
        const Z0 = f.Z0, Fq = fg(), post = tt - IMP, RT = R * T;
        // the sky darkens (lifting again after the blast)
        const dk = sm(0, 0.7, tt) * (1 - sm(IMP + 0.3, IMP + 2.0, tt)); if (dk > 0.01 && !OFF('sky')) skyShade(c, SC, X, Y, RT, dk);
        if (!Fq || !glmOn()) { f.lost = true; ST.lost++; drawLost(c, f, X, Y, T, tt); return; }
        // where the meteor is and how it moves on the screen
        const z = zn(tt) * Z0, v = vn(tt) * Z0, spK = cl(v / (VI * Z0)), near = cl(1 - z / 3.8), form = sm(0.3, 0.8, tt), MX = X + lean * zn(tt) * T, MY = Y - z * ZK * T, rM = S * T * (0.35 + 0.65 * form);
        const vx = -lean * v * T, vy = v * ZK * T, vl = Math.hypot(vx, vy) || 1, bx = -vx / vl, by = -vy / vl;   // (b: back along the trail)
        const dP = Math.hypot(PX0 - MX, PY0 - MY), AL = 0.3 + 0.7 * sm(-rM * 0.25, T * 1.0, dP - rM);
        const TX = X + lean * T, TY = Y - Z0 * ZK * T - T * 0.2, op = sm(0.1, 0.5, tt) * (1 - sm(1.1, 1.8, tt)), opG = eo(cl(tt / 0.5)) * (1 - 0.25 * sm(1.1, 1.8, tt));
        // (2D) heat haze: behind the falling meteor; along the dome's front; over the crater
        if (OFF('haze')) {} else if (tt < IMP && spK > 0.12 && form > 0.8) haze(c, MX + bx * rM * 2.4, MY + by * rM * 2.4, rM * 1.7, rM * (1.6 + 1.6 * spK), T * 0.05 * spK, t);
        if (post > 0 && post < 0.7 && !OFF('haze')) { const rd = RW * T * 1.1 * eo(post / 0.65); haze(c, X, Y - rd * 0.3, rd * 1.25, rd * 1.0, T * 0.09 * (1 - post / 0.7), t, true); }
        if (post > 0.3 && post < 2.2 && !OFF('haze')) haze(c, X, Y - T * 1.0, RT * 0.7, T * 1.4, T * 0.035 * (1 - sm(1.4, 2.2, post)), t);
        { const m = c.getTransform(), dv = (x2, y2) => [Math.round(m.a * x2 + m.c * y2 + m.e), Math.round(m.b * x2 + m.d * y2 + m.f)]; f.view = { aim: dv(X, Y), meteor: dv(MX, MY), tear: dv(TX, TY), rM: Math.round(rM * m.a), T: Math.round(T * m.a) }; }   // (tests: where things are, in canvas pixels)
        let Q = Fq.begin(c, [PX0, PY0, T * 0.75]);
        // the storm clouds wheeling round the tear, lit from within by its crackle
        if (dk > 0.01 && !OFF('clouds')) { const NC = low ? 3 : CEL ? 6 : 5, flk = Math.max(0, Math.sin(t * 13) * Math.sin(t * 7.3 + 1)) * op;
          for (let i = 0; i < NC; i++) { const an = i / NC * TAU + R1(seed + i * 2.2) * 0.6 + t * 0.12, rr = T * (2.2 + 2.6 * R1(seed + i * 4.4)) * (1.2 - 0.2 * dk), cr = T * S * (1.7 + 0.9 * R1(seed + i * 6.6));
            Q.quad(16, TX + Math.cos(an) * rr * 1.3, TY + Math.sin(an) * rr * 0.45 - T * 0.4, cr, 0, 0, cr * 0.62, CLOUD, 0.85 * dk, 0.45 * flk * (0.5 + 0.5 * R1(seed + i)), seed + i * 1.37); }
          for (let i = 0; i < (low ? 0 : 3); i++) { const cx = SC.x0 + SC.w * (i + 0.5) / 3, cr = T * (2.2 + 0.6 * R1(seed + i * 9)); Q.quad(16, cx + Math.sin(t * 0.3 + i) * T * 0.4, SC.y0 + T * (2.2 + 0.8 * R1(seed + i * 3)), cr, 0, 0, cr * 0.55, CLOUD, 0.7 * dk, 0, seed + 40 + i); } }
        // the tear in the sky
        if (op > 0.01 && !OFF('tear')) { const Wt = T * S * 3.0 * opG, hT = T * S * 1.0 * op, n = 9, up = new Float32Array(n * 2), dn = new Float32Array(n * 2), mid = new Float32Array(n * 2);
          for (let i = 0; i < n; i++) { const u = i / (n - 1) * 2 - 1, env = Math.pow(Math.max(0, Math.cos(u * Math.PI / 2)), 0.75), jy = (R1(seed + i * 3.1) - 0.5) * T * 0.55 * opG + u * T * 0.3 * lean, xx = TX + u * Wt / 2 + (R1(seed + i * 8.3) - 0.5) * T * 0.15;
            mid[i * 2] = xx; mid[i * 2 + 1] = TY + jy; up[i * 2] = xx; up[i * 2 + 1] = TY + jy - hT * env * (0.8 + 0.4 * R1(seed + i * 5.5)); dn[i * 2] = xx; dn[i * 2 + 1] = TY + jy + hT * env * 0.75 * (0.8 + 0.4 * R1(seed + i * 6.6)); }
          for (let i = 1; i < n - 1; i++) Q.smoke(mid[i * 2], mid[i * 2 + 1], Math.max(T * 0.35, (dn[i * 2 + 1] - up[i * 2 + 1]) * 0.95), op, seed + i, VOIDC, 0);   // (the void)
          Q.glow(TX, TY, Wt * 0.62, DEEP, 0.5 * op, 0.5); Q.glow(TX, TY, Wt * 0.35, ENERGY, 0.35 * op, 0.45); Q.evortex(TX, TY, Wt * 0.4, ENERGY, 0.7, 0.75 * op, seed * 0.7, 1.3, cl(hT * 1.5 / (Wt * 0.4) + 0.1));
          chain(Q, up, n, T * 0.34, T * 0.34, ENERGY, 0.45 * op, 0.45 * op, 2); chain(Q, dn, n, T * 0.3, T * 0.3, ENERGY, 0.4 * op, 0.4 * op, 2); chain(Q, up, n, T * 0.13, T * 0.13, PALE, 0.6 * op, 0.6 * op, 2); chain(Q, dn, n, T * 0.11, T * 0.11, PALE, 0.5 * op, 0.5 * op, 2);
          for (let b = 0; b < (low ? 2 : 5); b++) { const on = Math.max(0, Math.sin(t * (9 + b * 2.3) + b * 4.1)); if (on < 0.3) continue; const i = 1 + Math.floor(R1(seed + b * 7 + Math.floor(t * 6)) * (n - 2)), src = b % 2 ? up : dn, sg = b % 2 ? -1 : 1, P2 = new Float32Array(8); P2[0] = src[i * 2]; P2[1] = src[i * 2 + 1];
            for (let k = 1; k < 4; k++) { P2[k * 2] = P2[k * 2 - 2] + (R1(seed + b * 3 + k + Math.floor(t * 9)) - 0.5) * T * 0.8; P2[k * 2 + 1] = P2[k * 2 - 1] + sg * T * (0.25 + 0.3 * R1(seed + b + k * 7)); }
            chain(Q, P2, 4, T * 0.16, T * 0.09, EDGE, 0.6 * on * op, 0.25 * on * op, 2); }
          Q.beam(TX, TY, MX, Math.max(TY + T * 2, MY), Wt * 0.3, DEEP, 0.12 * op); Q.glow(TX, TY, Wt * 1.0, DEEP, 0.12 * op, 0.6); }
        // particles behind: the trail's smoke (laid over), the dust (laid over), embers and sparks (light)
        const n0 = Q.nl + Q.ns; if (!OFF('parts')) drawParts(Q, T, tt);
        // ---- the meteor (before the impact) ----
        let meteor = null;
        if (tt < IMP + 0.06 && form > 0.01 && !OFF('meteor')) {
          const al = AL * form * (1 - cl((tt - IMP) / 0.06));
          Q.glow(MX, MY, rM * 3.6, DEEP, 0.55 * al); Q.glow(MX, MY, rM * 2.1, ENERGY, (0.45 + 0.3 * near) * al);
          Q.eorb(MX, MY, rM * 1.45, ENERGY, 0.7 + 0.35 * near, 0.6 * al, seed * 0.13, 1.4);   // (the plasma sheath)
          if (spK > 0.03) { for (let j = 1; j <= 3; j++) Q.eorb(MX + bx * rM * 0.85 * j, MY + by * rM * 0.85 * j, rM * (1.3 - 0.24 * j), ENERGY, 0.75 - 0.12 * j, 0.45 * (1 - j / 4) * cl(spK * 3) * al, seed * 0.2 + j, 1.8);   // (a comet head)
            const L = rM * (2.2 + 8.5 * spK), P = new Float32Array(12); for (let i = 0; i < 6; i++) { const u = i / 5, sw = Math.sin(t * 5 + u * 3) * rM * 0.12 * u; P[i * 2] = MX + bx * L * u - by * sw; P[i * 2 + 1] = MY + by * L * u + bx * sw; }
            chain(Q, P, 6, rM * 1.05, rM * 0.35, ENERGY, 0.85 * al * cl(spK * 2.5), 0.25 * al, 20, 0.9, seed);   // (the trail's energy)
            chain(Q, P, 6, rM * 0.28, rM * 0.1, HOT, 0.75 * al * cl(spK * 2.5), 0.15 * al, 2);
            for (let j = 0; j < NTR; j++) { const o = ((j + 0.5) / NTR - 0.5) * rM * 1.6, Lj = L * (0.45 + 0.45 * R1(seed + j * 3)), P3 = new Float32Array(10);
              for (let i = 0; i < 5; i++) { const u = i / 4, sw = Math.sin(t * 8 + j * 1.7 + u * 4) * rM * 0.18 * u, oo = o * (1 + 0.6 * u) + sw; P3[i * 2] = MX + bx * Lj * u - by * oo; P3[i * 2 + 1] = MY + by * Lj * u + bx * oo; }
              chain(Q, P3, 5, rM * 0.3, rM * 0.12, j % 2 ? EDGE : PALE, 0.45 * al * spK, 0.1 * al, 2); } }
          if (tt < 0.9) { const q = (1 - sm(0.5, 0.9, tt)) * sm(0.2, 0.4, tt); for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + t * 2.2, rr = rM * (1.6 + 2.2 * (1 - form)); chain(Q, new Float32Array([MX + Math.cos(b) * rr, MY + Math.sin(b) * rr * 0.6, MX + Math.cos(b + 0.6) * rr * 0.5, MY + Math.sin(b + 0.6) * rr * 0.3, MX, MY]), 3, T * 0.12, T * 0.05, PALE, 0.6 * q, 0.2 * q, 2); } }   // (energy drawn in as it condenses)
          const comp = tt > IMP - 0.07 ? cl((tt - IMP + 0.07) / 0.13) : 0, Rm = mm(axisR(ax1, f.rot + seed), mm(axisR(ax2, f.rot * 0.41), axisR([1, 0, 0], 0.5)));
          meteor = { MX, MY: MY + rM * 0.4 * comp, al, R: comp > 0 ? mm([[1 + 0.35 * comp, 0, 0], [0, 1 + 0.35 * comp, 0], [0, 0, 1 - 0.45 * comp]], Rm) : Rm, s: S * (0.35 + 0.65 * form), glow: 0.9 + 1.0 * near + 0.6 * spK, glow2: comp * 1.2 + (1 - form) * 0.8, spill: near };
        }
        ST.maxQ = Math.max(ST.maxQ, Q.nl / 6 + Q.ns / 6); void n0;
        // ---- the blast: the fireball and the mushroom (behind the debris) ----
        if (post >= 0) { const endK = cl((LIFE - tt) / 0.6);
          const fb = (1 - sm(0.12, 0.75, post)) * endK; if (fb > 0.01) { const r0 = RT * 0.62 * eo(post / 0.14) * (1 + 0.4 * post); Q.eorb(X, Y - T * 0.6 - post * T * 1.2, r0, ENERGY, 1.05 - 0.4 * sm(0, 0.6, post), 0.95 * fb, seed * 0.5, 1.1); Q.glow(X, Y - T * 0.5, r0 * 1.8, PALE, 0.5 * fb); }
          if (!OFF('mush')) mushroom(Q, X, Y, T, post, endK);
          if (debris.length) for (const d of debris) { const hot = cl(1 - d.age / 1.3), a = (1 - sm(1.5, 2.1, d.age)) * hot; if (a > 0.02) Q.glow(H.sx(d.x), H.sy(d.y) - (d.z + d.s * 0.3) * ZK * T, T * d.s * 1.6, ENERGY, 0.35 * a); } }
        Fq.flush(c); ST.gpu++;
        // ---- the solid things: the meteor, or the debris ----
        if (meteor && meteor.al > 0.01) { let okm = false; try { okm = glmPass(c, [{ M: MC, R: meteor.R, s: meteor.s, p: [0, 0, 0], al: meteor.al, glow: meteor.glow, glow2: meteor.glow2, spill: meteor.spill, wear: seed % 7 }], meteor.MX, meteor.MY, T, t); } catch (e) { okm = false; if (++GLFAIL >= 3) NOGL = true; try { console.warn('Doomsday: GLM', e); } catch (e2) {} }
          if (!okm) blit(c, glowSprite(DEEP), meteor.MX - rM, meteor.MY - rM, rM * 2, rM * 2, meteor.al); }
        if (post >= 0 && debris.length) { const L2 = []; for (const d of debris) { const a = (1 - sm(1.5, 2.1, d.age)) * AL; if (a <= 0.01) continue; const sx = H.sx(d.x), sy = H.sy(d.y), sh = T * d.s * 1.1;
            blit(c, shadeSpr(), sx - sh, sy - sh * GY, sh * 2, sh * 2 * GY, 0.45 * a / (1 + d.z * 0.4));
            L2.push({ M: d.M, R: mm(axisR(d.axis, d.ang), d.R0), s: d.s, p: [d.x - x, d.y - y, d.z + d.s * 0.35], al: a, glow: 1.6 * cl(1 - d.age / 1.4) + 0.15, glow2: d.age < 0.08 ? 0.8 : 0, spill: 0.3 * cl(1 - d.age), fx: cl(d.age / 1.5), wear: d.i }); }
          if (L2.length) { try { glmPass(c, L2, X, Y, T, t); } catch (e) { if (++GLFAIL >= 3) NOGL = true; } } }
        // ---- in front: the meteor's rim and bow shock, the flash, the dome ----
        Q = Fq.begin(c, [PX0, PY0, T * 0.75]);
        if (meteor) { const al = meteor.al; Q.eorb(MX, MY, rM * 1.6, ENERGY, 0.55 + 0.3 * near, (0.22 + 0.2 * spK) * al, seed * 0.17 + 3, -1.1); Q.glow(MX, MY, rM * 1.25, PALE, (0.12 + 0.25 * near) * al); Q.glow(MX - bx * rM * 0.75, MY - by * rM * 0.75, rM * 1.0, PALE, (0.12 + 0.35 * spK) * al, 0.55); Q.shimmer(MX, MY, rM * 1.7, 0.35 * spK * al, 1, PALE);
          if (near > 0.5) Q.glow(MX, MY + rM * 0.6, rM * 1.6, ENERGY, 0.3 * (near - 0.5) * al, 0.5); }
        if (post >= 0) { const fl = Math.exp(-post / 0.11), endK = cl((LIFE - tt) / 0.6);
          if (fl > 0.01 && !OFF('flash')) { const gw = eo(post / 0.06); Q.glow(X, Y - T * 0.5, RT * 1.05 * (0.5 + 0.5 * gw), WHITE, 0.95 * fl); Q.glow(X, Y - T * 0.5, RT * 2.6, PALE, 0.65 * fl); Q.glow(X, Y - T * 0.4, Math.max(SC.w, SC.h) * 0.85, ENERGY, 0.4 * fl);
            Q.beam(X - SC.w * 0.75, Y - T * 0.5, X + SC.w * 0.75, Y - T * 0.5, T * 0.45, PALE, 0.7 * fl); Q.beam(X - SC.w * 0.5, Y - T * 0.5, X + SC.w * 0.5, Y - T * 0.5, T * 0.13, WHITE, 0.9 * fl); Q.beam(X, Y - T * 0.5 - RT * 0.9, X, Y - T * 0.5 + RT * 0.5, T * 0.3, PALE, 0.4 * fl); }
          for (const [d0, sc, w] of CEL ? [[0, 1.1, 1], [0.16, 1.45, 0.6]] : [[0, 1.1, 1]]) { const q = cl((post - d0) / 0.65); if (q > 0 && q < 1) { const rd = RW * T * sc * eo(q), a = Math.pow(1 - q, 1.3) * w * endK;
            Q.glow(X, Y - rd * 0.3, rd, ENERGY, 0.22 * a, 0.8); Q.shimmer(X, Y - rd * 0.32, rd * 1.22, 0.9 * a, 0.8, PALE); Q.shimmer(X, Y - rd * 0.3, rd * 1.12, 0.4 * a, 0.8, EDGE); } }
          if (!OFF('parts')) drawLight(Q, T, tt, 1); }
        Fq.flush(c); ST.gpu++;
      } });
    /* the particles: smoke and dust laid over, embers and sparks added (front: 1 only the bright cores again) */
    function drawParts(Q, T, tt) {
      for (let i = 0; i < NP; i++) { if (pl[i] <= 0) continue; const k = pk[i]; if (k !== 1 && k !== 4) continue; const u = 1 - pl[i] / pm[i], X = H.sx(px[i]), Y = H.sy(py[i]) - pz[i] * ZK * T;
        if (k === 1) Q.smoke(X, Y, T * ps[i] * (1 + 1.4 * u), 0.62 * Math.pow(1 - u, 1.4) * sm(0, 0.12, u), i * 0.37, pc[i] ? SMKL : SMK, 0);
        else Q.smoke(X, Y, T * ps[i] * (0.6 + 1.6 * u), 0.55 * (1 - u) * sm(0, 0.1, u), i * 0.53, DUST, 0); }
      drawLight(Q, T, tt, 0); }
    function drawLight(Q, T, tt, front) {
      for (let i = 0; i < NP; i++) { if (pl[i] <= 0) continue; const k = pk[i]; if (k === 1 || k === 4) continue; const u = 1 - pl[i] / pm[i], X = H.sx(px[i]), Y = H.sy(py[i]) - pz[i] * ZK * T;
        if (k === 0) { const a = (1 - u) * sm(0, 0.08, u); if (front) { if (u < 0.5) Q.glow(X, Y, T * ps[i] * 0.9, HOT, a); } else Q.glow(X, Y, T * ps[i] * (3.2 - u), pc[i] ? PALE : u > 0.6 ? DEEP : ENERGY, 0.55 * a); }
        else if (k === 3 && !front) { const L = 0.05, X1 = X - pvx[i] * L * T, Y1 = Y - (pvy[i] * GY - pvz[i] * ZK) * L * T; Q.beam(X1, Y1, X, Y, T * 0.1, PALE, (1 - u)); Q.beam(X1, Y1, X, Y, T * 0.035, WHITE, (1 - u)); } } }
    /* the mushroom: a stem of smoke with energy rising inside it, a cap rolling outward at its top, lit from within */
    function mushroom(Q, X, Y, T, post, endK) {
      const rise = eo(post / 0.75), late = cl((post - 0.7) / 1.6), A = (1 - sm(1.4, 2.55, post)) * endK * sm(0.02, 0.14, post); if (A < 0.01) return;
      const Hs = HE * T * ZK * rise * (1 + 0.15 * late) + T * 0.5 * late, top = Y - Hs, w = T * R * 0.17 * (0.6 + 0.4 * rise) * (1 + 0.5 * late), NS = lowFx() ? 5 : 8;
      for (let i = 0; i < NS; i++) { const v = i / (NS - 1), yy = Y - Hs * v * 0.92, rr = w * (1.15 - 0.35 * v + 0.25 * Math.sin(v * 6 + post * 2)), xx = X + Math.sin(v * 5 + post * 2.3 + seed) * w * 0.25;
        Q.smoke(xx, yy, rr * 1.35, 0.8 * A, seed + i * 1.3, v < 0.5 ? SMK : SMKL, 0); }
      const cs = eo(post / 0.95), rc = T * R * 0.5 * (0.25 + 0.75 * cs) * (1 + 0.35 * late), NCp = lowFx() ? 6 : 10, roll = post * 1.6, P2 = [];
      for (let k = 0; k < NCp; k++) { const ph = k / NCp * TAU + seed, rl = roll + k * 0.9; P2.push([X + Math.cos(ph) * rc, top + Math.sin(ph) * rc * 0.33 - Math.sin(rl) * rc * 0.12 - late * T * 0.4, rc * (0.55 + 0.1 * Math.cos(rl)), Math.sin(ph), k]); }
      P2.sort((a, b) => a[3] - b[3]);
      for (const p of P2) if (p[3] < 0) Q.smoke(p[0], p[1], p[2], 0.85 * A, seed + p[4] * 2.1, SMKL, 0);
      Q.smoke(X, top - rc * 0.2 - late * T * 0.4, rc * 0.95, 0.85 * A, seed + 50, SMKL, 0);
      for (const p of P2) if (p[3] >= 0) Q.smoke(p[0], p[1], p[2], 0.85 * A, seed + p[4] * 2.1, SMK, 0);
      const L = A * (1 - sm(0.3, 1.6, post));
      if (L > 0.01) { Q.ebeam(X, Y + T * 0.2, X, top, w * 1.1, ENERGY, 0.85, 0.65 * L, seed, 6); Q.ebeam(X, Y, X, top, w * 0.35, HOT, 0.9, 0.5 * L, seed + 3, 8);
        Q.glow(X, top - late * T * 0.4, rc * 1.5, ENERGY, 0.5 * L, 0.5); Q.glow(X, top + rc * 0.2, rc * 1.1, PALE, 0.35 * L, 0.4); Q.glow(X, Y - Hs * 0.5, w * 3, DEEP, 0.4 * L, 1.6); } }
    /* a context lost mid-cast: soft 2D glows stand in for the rest of it */
    function drawLost(c, f, X, Y, T, tt) { const z = zn(tt) * (f.Z0 || 7), MX = X + lean * zn(tt) * T, MY = Y - z * ZK * T, rM = S * T;
      c.save(); c.globalCompositeOperation = 'lighter'; if (tt < IMP) { c.globalAlpha = 0.6; blitSized(c, glowSprite(ENERGY), MX - rM * 2, MY - rM * 2, rM * 4, rM * 4); }
      else { const p = tt - IMP, a = Math.max(0, 1 - p / 1.2); c.globalAlpha = a; blitSized(c, glowSprite(PALE), X - R * T * 1.5, Y - R * T * 1.5, R * T * 3, R * T * 3); } c.restore(); }
    void F;
    // the timeline: the fall quickens with a whoosh; the impact (one hit, the negative frame, the shock); the eruption's thud
    H.X.after(TS, () => { H.X.sfx.whoosh(); H.X.shake(2, 0.6); });
    H.X.after(IMP - 0.35, () => H.X.shake(5, 0.35));
    H.X.after(IMP, () => {
      if (H.X.negative) H.X.negative(0.08);
      H.hitArea(x, y, R, DMG, C.dmgO({ kb: 7, stun: 0.5 }));
      H.X.flash(0.22, PALE); H.X.hitstop(0.1); H.X.sfx.crash(); H.X.shake(22 + 2 * ev, 0.45); H.X.light(x, y, R * 1.4, 0.4); H.X.light(x, y, R * 1.9, 0.4); H.X.shake(20, 0.22);
      // the debris: chunks of the meteor flung out, tumbling (GLM); sparks; a ring of dust; embers thrown up
      const ND = (CEL ? 14 : ADE ? 11 : 8); for (let i = 0; i < ND; i++) { const b = i / ND * TAU + Math.random() * 0.5, v = 2.6 + Math.random() * 3.6 + 0.2 * ev, big = i < 4;
        debris.push({ i, M: MS.chunk[i % MS.chunk.length], R0: axisR(nrm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]), Math.random() * TAU), x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2, z: 0.3 + Math.random() * 0.5, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 3.5 + Math.random() * 4.5, axis: nrm([Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5]), ang: 0, w: (Math.random() - 0.5) * 12, s: S * (big ? 0.38 + Math.random() * 0.14 : 0.16 + Math.random() * 0.12), age: 0, bn: 0, rest: false }); }
      const q = Qk();
      for (let j = 0; j < Math.round((40 + 4 * ev) * q); j++) { const b = Math.random() * TAU, v = 5 + Math.random() * 8; emit(3, x, y, 0.4, Math.cos(b) * v, Math.sin(b) * v * 0.7, 2 + Math.random() * 7, 0.35 + Math.random() * 0.35, 0.06, 1.2, 9); }
      for (let j = 0; j < Math.round((22 + 2 * ev) * q); j++) { const b = j / Math.round((22 + 2 * ev) * q) * TAU + Math.random() * 0.2, v = 5 + Math.random() * 3.5; emit(4, x + Math.cos(b) * R * 0.25, y + Math.sin(b) * R * 0.18, 0.15, Math.cos(b) * v, Math.sin(b) * v * 0.7, 0.3 + Math.random() * 0.5, 1.1 + Math.random() * 0.6, 0.45 + Math.random() * 0.25, 2.6, 0); }
      for (let j = 0; j < Math.round((50 + 6 * ev) * q); j++) { const b = Math.random() * TAU, v = 1 + Math.random() * 4; emit(0, x + Math.cos(b) * 0.4, y + Math.sin(b) * 0.3, 0.3 + Math.random() * 0.8, Math.cos(b) * v, Math.sin(b) * v * 0.7, 3 + Math.random() * 5, 1.3 + Math.random() * 1.3, 0.05 + 0.08 * Math.random(), 0.9, 3.2, Math.random() < 0.4 ? 1 : 0); }
    });
    H.X.after(IMP + 0.1, () => H.X.sfx.thud()); H.X.after(IMP + 0.3, () => { H.X.sfx.hum(); H.X.shake(6, 0.3); });
    if (CEL) H.X.after(IMP + 0.24, () => { H.X.sfx.whoosh(); H.X.shake(8, 0.25); });
  };
  U.doomsday.__dbg = { stats: ST, gpuReady, meshes, glmPass, rockMesh, legacy: DOOM_2D };
})();
