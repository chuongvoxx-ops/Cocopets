/* ---------- Dark, new: Dead Scream ----------
   v391 U4: rebuilt on the GPU. The skull is a real 3D model (DEADSCREAM_SKULL, 20k5k2: weathered bone with micro detail,
   deep orbits burning with violet soul fire, cracks that leak light and spread as the end nears, a hinged jaw that drops
   on every scream, a broken obsidian crown); it forms from gathering smoke, hovers and shivers, shakes harder toward
   the end and bursts into bone shards and violet ash. Round it, through the shared FGFX painter: a smoky aura, violet
   light spilling on the floor, every scream's soft shock rings, sinking shells and a cone of rippling air (a real
   screen-space distortion), ghostly wisps streaming to the monsters, dark particles, fear and stun marks. The gameplay
   is unchanged. Where the GPU cannot draw, the original 2D picture below is drawn, as it was (under2D / draw2D).
   The original notes:
   A huge vibrating skull hovers over the pet and screams pulses of dark energy into the monsters round it.
   Formation (1.1 s, before the window): a knot of dark smoke gathers over the pet; a violet contour sketches the dome,
   then the cheekbones and sockets, then the jaw; the surface fills in (dark obsidian bone, fissures) and violet light
   wakes in the sockets. Active window: 7 s at level 1, 8.5, 10, 12 at Adept, 14.5, 17, 20 at Celestial. The skull
   follows the pet smoothly, always hovering clearly above it (its chin well over the pet's head), with small controlled
   vibrations and a slow unsettling tilt. Every 0.5 s a pulse: the jaw lowers, light gathers in the sockets and between
   the teeth, the skull jolts and screams: one Dark hit over the area round the pet (it follows the pet), a short stun
   (0.32 s; the game quarters it on bosses) and FEAR (m.fearT, the hook in 20b: the monster flees from the pet for 1 s,
   bosses and fixed monsters excepted). Jagged sparks thrown from the jaw and cheekbones are real hits: each strikes the
   monster it reaches with its own small damage event (at most `ns` spark hits per monster per pulse, ns = 1 / 2 at
   Adept / 3 at Celestial, so the totals stay exact). The scream is a broad dark-purple ring racing over the floor, with
   light-only ripples from beneath the pet (two staggered at Adept), shadow drifting down; the glow recedes between
   pulses. Expiry: the jaw closes, the socket light draws inward, then the FINISHING EXPLOSION round the pet (its own
   hit) as the skull disintegrates into rising smoke and fragments.
   Damage (DK = base x K x evoK), for a monster in range the whole time: pulses + sparks = 14 / 22 at Adept / 32 at
   Celestial x DK (80 % pulses, 20 % sparks; levels between interpolate), plus the finisher 4 x DK (kb 6, stun 0.6).
   The skull is a real shaded relief rendered once per size into cached sprites (cranium and a separate jaw): a height
   field built from smooth-unioned ellipsoids (dome, brow ridges, cheekbones, zygomatic arches, maxilla, teeth, the
   mandible) with carved sockets and nasal cavity, lit per pixel (soft cel bands, obsidian gloss, a violet bounce rim,
   cavity occlusion, roughness noise, a soft ink edge), engraved fissures, and separate additive layers for the socket
   light and the crack light. Adept: branching fissures, a fragmented thin halo behind it. Celestial: monumental,
   layered socket shadow, light travelling through the cracks, broken obsidian halo segments rotating, a thick low wave
   with sparks and ash. No per-frame gradients, no shadowBlur; every edge feathered; floor marks are light only. */
(() => {
  const U = ELEM_IMPL.dark.ult; delete U.leviathan;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF', WHITE = '#FFFFFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  let H;
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorSpr(c, img, X, Y, r, a, add) { if (r < 1 || !(a > 0.01)) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d, k: a }; }

  /* ---- cached soft sprites ---- */
  const airSpr = () => fxSprite('dskair', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(8,5,15,0.6)'); gr.addColorStop(0.45, 'rgba(14,8,26,0.34)'); gr.addColorStop(0.75, 'rgba(24,11,46,0.1)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  // a band round a circle: dark body, violet luminous edge, feathered both sides (the scream ring)
  const bandSpr = () => fxSprite('dskband', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.5, 'rgba(24,11,46,0)'], [0.68, 'rgba(14,7,26,0.32)'], [0.82, 'rgba(43,11,69,0.62)'], [0.9, 'rgba(109,40,168,0.7)'], [0.945, 'rgba(165,92,255,0.8)'], [0.975, 'rgba(208,174,255,0.35)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // the same in light only (ripples, the aura's rim)
  const bandLSpr = () => fxSprite('dskbandL', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(109,40,168,0)'], [0.66, 'rgba(109,40,168,0)'], [0.84, 'rgba(109,40,168,0.28)'], [0.93, 'rgba(165,92,255,0.7)'], [0.965, 'rgba(208,174,255,0.75)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  // a wide soft band (the Celestial low wave's body): dark, feathered far inside and outside
  const wideSpr = () => fxSprite('dskwide', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.42, 'rgba(24,11,46,0)'], [0.66, 'rgba(18,9,34,0.42)'], [0.84, 'rgba(43,11,69,0.62)'], [0.93, 'rgba(70,40,110,0.45)'], [1, 'rgba(70,40,110,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  const puffSpr = () => fxSprite('dskpuff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(98,70,128,0.42)'); gr.addColorStop(0.45, 'rgba(70,48,82,0.24)'); gr.addColorStop(1, 'rgba(43,11,69,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  const dpuffSpr = () => fxSprite('dskdpuff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(14,7,26,0.7)'); gr.addColorStop(0.45, 'rgba(43,11,69,0.38)'); gr.addColorStop(0.8, 'rgba(70,48,82,0.08)'); gr.addColorStop(1, 'rgba(70,48,82,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });
  // the mouth's hollow (behind the teeth): a soft dark oval
  const mouthSpr = () => fxSprite('dskmouth', 128, 64, g => { g.save(); g.scale(1, 0.5); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(8,5,15,0.96)'); gr.addColorStop(0.6, 'rgba(10,6,20,0.88)'); gr.addColorStop(0.85, 'rgba(24,11,46,0.4)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); g.restore(); });

  /* ---- the skull: a relief built from smooth-unioned ellipsoids. Units: the cranium is 2 wide; x right, y down,
     z toward the viewer. p = [cx, cy, rx, ry, rz, rot] ---- */
  const BW = 2.3, BH = 2.85, OYU = 1.38;   // the sprite box in units; unit (0, 0) sits OYU below its top
  const CRAN = [[0, -0.28, 0.94, 0.86, 1.0], [0, 0.32, 0.8, 0.58, 0.8], [-0.5, 0.45, 0.26, 0.2, 0.86], [0.5, 0.45, 0.26, 0.2, 0.86], [-0.72, 0.36, 0.2, 0.12, 0.62, -0.25], [0.72, 0.36, 0.2, 0.12, 0.62, 0.25],
    [0, 0.7, 0.44, 0.27, 0.84], [-0.37, -0.03, 0.34, 0.12, 1.0, 0.08], [0.37, -0.03, 0.34, 0.12, 1.0, -0.08]];
  const TUP = [], TLO = []; for (let i = 0; i < 8; i++) { const x = -0.3 + i * 0.0857, can = i === 1 || i === 6; TUP.push([x, 0.9 + (can ? 0.01 : 0), 0.043, can ? 0.11 : 0.1, 0.66]); TLO.push([x * 0.95, 0.955, 0.04, 0.075, 0.6]); }
  const JAW = [[0, 1.15, 0.34, 0.17, 0.7], [-0.38, 1.04, 0.2, 0.17, 0.62, 0.3], [0.38, 1.04, 0.2, 0.17, 0.62, -0.3], [-0.52, 0.84, 0.12, 0.26, 0.36, 0.2], [0.52, 0.84, 0.12, 0.26, 0.36, -0.2]];
  // the carved holes: [cx, cy, rx, ry, depth, rot, kind 0 socket / 1 nasal]
  const HOLES = [[-0.36, 0.21, 0.28, 0.24, 0.85, -0.22, 0], [0.36, 0.21, 0.28, 0.24, 0.85, 0.22, 0], [-0.045, 0.49, 0.065, 0.13, 0.55, -0.3, 1], [0.045, 0.49, 0.065, 0.13, 0.55, 0.3, 1]];
  let EQ = 0, EZ = 0, ED = 0;
  function ell(p, x, y) { let dx = x - p[0], dy = y - p[1]; if (p[5]) { const co = p.co != null ? p.co : (p.co = Math.cos(p[5])), si = p.si != null ? p.si : (p.si = Math.sin(p[5])), t = dx * co + dy * si; dy = -dx * si + dy * co; dx = t; } const q = dx * dx / (p[2] * p[2]) + dy * dy / (p[3] * p[3]), sq = Math.sqrt(q); EQ = q; EZ = q < 1 ? p[4] * Math.sqrt(1 - q) : -(sq - 1) * p[4] * 2; ED = (1 - sq) * Math.min(p[2], p[3]); }
  const smax = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.max(a, b) + h * h * k * 0.25; };
  const HT = (() => { const a = new Float32Array(4096); for (let i = 0; i < 4096; i++) a[i] = R1(i * 1.618 + 0.5); return a; })(), hash2 = (i, j) => HT[((i * 73856093) ^ (j * 19349663)) & 4095];
  function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy), a = hash2(i, j), b = hash2(i + 1, j), c = hash2(i, j + 1), d = hash2(i + 1, j + 1); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
  // is a point on the cranium's solid surface (inside it, away from the holes)?
  function solidAt(x, y, margin) { let d = -9; for (const p of CRAN) { ell(p, x, y); if (ED > d) d = ED; } if (d < margin) return false; for (const h of HOLES) { ell(h, x, y); if (EQ < 1.5) return false; } return y < 0.62; }
  // the fissures: random walks over the dome and cheeks; branches from Adept, sub-branches at Celestial
  function makeCracks(n, br, seed) { const out = []; let s = seed;
    const walk = (x, y, b, steps, len) => { const pts = [[x, y]]; for (let k = 0; k < steps; k++) { b += (R1(s += 1.3) - 0.5) * 1.1; const nx = x + Math.cos(b) * len * (0.7 + 0.6 * R1(s += 0.7)), ny = y + Math.sin(b) * len * (0.7 + 0.6 * R1(s += 0.9)); if (!solidAt(nx, ny, 0.06)) break; x = nx; y = ny; pts.push([x, y]); } return pts; };
    for (let i = 0, tries = 0; i < n && tries < 400; tries++) { const x = (R1(s += 2.1) - 0.5) * 1.6, y = -1.05 + R1(s += 1.7) * 1.55; if (!solidAt(x, y, 0.1)) continue;
      const pts = walk(x, y, R1(s += 3.3) * TAU, 6 + Math.floor(R1(s += 1.1) * 5), 0.12); if (out.some(o => Math.hypot(o.pts[0][0] - x, o.pts[0][1] - y) < 0.38)) continue; if (pts.length < 3) continue; const c = { pts, br: [] };
      if (br) { const nb = br > 1 ? 2 : 1; for (let j = 0; j < nb; j++) { const q = pts[1 + Math.floor(R1(s += 4.4) * (pts.length - 2))], b2 = walk(q[0], q[1], R1(s += 2.2) * TAU, br > 1 ? 4 : 3, 0.08); if (b2.length > 1) { c.br.push(b2); if (br > 1 && b2.length > 2) { const q2 = b2[1], b3 = walk(q2[0], q2[1], R1(s += 5.5) * TAU, 2, 0.06); if (b3.length > 1) c.br.push(b3); } } } }
      c.my = pts.reduce((a, p) => a + p[1], 0) / pts.length; c.ph = R1(s += 6.1); out.push(c); i++; }
    return out; }

  /* build the skull's sprites at PX pixels across the box: the cranium, the jaw (each shaded), the socket light, the
     crack light, sample points for the disintegration */
  function* buildSkull(PX, lv, cracks, res) {
    const s = PX / BW, W = Math.round(PX), Hh = Math.round(BH * s), N = W * Hh, CEL = lv >= 7;
    const L = (() => { const l = [-0.5, -0.62, 0.6], k = Math.hypot(l[0], l[1], l[2]); return l.map(v => v / k); })(), Hv = (() => { const h = [L[0], L[1], L[2] + 1], k = Math.hypot(h[0], h[1], h[2]); return h.map(v => v / k); })();
    const RAMP = [[8, 5, 15], [22, 11, 40], [43, 18, 66], [80, 64, 100], [138, 124, 158]];
    Object.assign(res, { s, W, H: Hh, oy: OYU * s, pts: [] });
    for (const part of ['cran', 'jaw']) {
      const prims = part === 'cran' ? CRAN : JAW, teeth = part === 'cran' ? TUP : TLO;
      const Z = new Float32Array(N), D = new Float32Array(N), HM = new Float32Array(N), SK = new Float32Array(N), TM = new Float32Array(N);
      const y0 = part === 'cran' ? -9 : 0.42, y1 = part === 'cran' ? 1.08 : 9;
      for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) { const x = (px + 0.5) / s - BW / 2, y = (py + 0.5) / s - OYU, i = py * W + px; if (y < y0 || y > y1) { D[i] = -9; continue; }
        let z = -9, d = -9, tm = 0;
        for (let pi = 0; pi < prims.length; pi++) { const p = prims[pi], br = p.br || (p.br = Math.max(p[2], p[3]) * 1.25 + 0.2); if (pi && (Math.abs(x - p[0]) > br || Math.abs(y - p[1]) > br)) continue; ell(p, x, y); z = z < -8 ? EZ : smax(z, EZ, 0.16); if (ED > d) d = ED; }
        if (py % 10 === 0 && px === 0) yield 0;
        if (d < -4 / s) { Z[i] = 0; D[i] = d; continue; }
        if (y > 0.7 && y < 1.15) for (const p of teeth) { if (Math.abs(x - p[0]) > 0.12) continue; ell(p, x, y); z = smax(z, EZ, 0.025); if (ED > d) d = ED; if (ED > -0.01) tm = Math.max(tm, sstep(-0.01, 0.025, ED)); }
        let hm = 0, sk = 0;
        if (part === 'cran' && y > -0.1 && y < 0.72) for (const h of HOLES) { ell(h, x, y); if (EQ < 1.6) { const sq = Math.sqrt(EQ), hf = Math.pow(sm((1 - EQ) / 0.7), 0.8); z += -h[4] * hf + 0.025 * Math.exp(-Math.pow((sq - 1.12) / 0.14, 2)); if (hf > hm) hm = hf; const cq = cl(1 - EQ) * (h[6] ? 0.6 : 1); if (cq > sk) sk = cq; } }
        Z[i] = d > 0 ? Math.max(0, z) : 0; D[i] = d; HM[i] = hm; SK[i] = sk; TM[i] = tm; }
      yield 0;
      // cavity occlusion: the height blurred against itself
      const B = Z.slice(), tmp = new Float32Array(N), r = Math.max(2, Math.round(0.1 * s));
      for (let pass = 0; pass < 2; pass++) {
        for (let py = 0; py < Hh; py++) { let acc = 0; const o = py * W; for (let px = -r; px < W + r; px++) { if (px + r < W) acc += B[o + Math.min(W - 1, px + r)]; if (px - r - 1 >= 0) acc -= B[o + px - r - 1]; if (px >= 0 && px < W) tmp[o + px] = acc / (2 * r + 1); } }
        for (let px = 0; px < W; px++) { let acc = 0; for (let py = -r; py < Hh + r; py++) { if (py + r < Hh) acc += tmp[Math.min(Hh - 1, py + r) * W + px]; if (py - r - 1 >= 0) acc -= tmp[(py - r - 1) * W + px]; if (py >= 0 && py < Hh) B[py * W + px] = acc / (2 * r + 1); } } }
      const cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'), im = g.createImageData(W, Hh), dd = im.data;
      const lc = document.createElement('canvas'); lc.width = W; lc.height = Hh; const lg = lc.getContext('2d'), lim = lg.createImageData(W, Hh), ld = lim.data;
      yield 0; const NZ = new Float32Array(N); res['nz' + part] = NZ;
      for (let py = 1; py < Hh - 1; py++) for (let px = 1; px < W - 1; px++) { if (px === 1 && py % 10 === 0) yield 0; const i = py * W + px, dpx = D[i] * s; if (dpx < -0.6) continue;
        const x = (px + 0.5) / s - BW / 2, y = (py + 0.5) / s - OYU;
        const gx = (Z[i + 1] - Z[i - 1]) * s / 2, gy = (Z[i + W] - Z[i - W]) * s / 2; let nx = -gx, ny = -gy, nz = 1; const nk = Math.hypot(nx, ny, nz); nx /= nk; ny /= nk; nz /= nk;
        const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), ndh = Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]);
        const n1 = vnoise(x * 7 + 3, y * 7), n2 = vnoise(x * 23, y * 23 + 7), cav = B[i] - Z[i], hq = 1 - sm(HM[i] * 2.5), ao = Math.max(0.22, Math.min(1, 1 - cav * 2.6)), wear = Math.max(0, -cav) * 1.2 * hq;
        const bands = 0.25 * sstep(0.08, 0.22, ndl) + 0.35 * sstep(0.38, 0.52, ndl) + 0.4 * sstep(0.7, 0.82, ndl);
        let b = (0.62 * bands + 0.38 * ndl) * (0.82 + 0.3 * n1) * ao + 0.22 * TM[i] * (0.4 + ndl) + wear * 0.35;
        let bb = cl(0.08 + 0.9 * b) * 4; const ri = Math.min(3, Math.floor(bb)), rf = bb - ri, RA = RAMP[ri], RB2 = RAMP[ri + 1];
        let cr = RA[0] + (RB2[0] - RA[0]) * rf, cg = RA[1] + (RB2[1] - RA[1]) * rf, cb = RA[2] + (RB2[2] - RA[2]) * rf;
        // gloss: a tight obsidian highlight (broken by the roughness) and a broad sheen
        const n4 = ndh * ndh * ndh * ndh, n32 = n4 * n4 * n4 * n4 * n4 * n4 * n4 * n4, spec = n32 * ndh * ndh * (0.45 + 0.55 * n2) * ao * hq, sheen = n4 * ndh * ndh * 0.1 * ao;
        cr += 210 * spec + 120 * sheen; cg += 194 * spec + 100 * sheen; cb += 255 * spec + 170 * sheen;
        // the violet bounce from below and right (grazing angles), a cold rim top left
        const fr = Math.pow(1 - nz, 2.2) * (0.25 + 0.75 * hq), rim = fr * cl(0.25 + ny * 0.9 + nx * 0.35) * (0.6 + 0.4 * ao) * 0.75, cold = fr * cl(-ny * 0.8 - nx * 0.5) * 0.25;
        cr += 140 * rim + 120 * cold; cg += 70 * rim + 110 * cold; cb += 230 * rim + 150 * cold;
        // the holes: void, layered shadow at Celestial, a restrained violet depth
        const hm = HM[i]; if (hm > 0) { let k = hm * 0.92; if (CEL) k *= 0.82 + 0.18 * Math.cos(hm * TAU * 1.5); cr = lerp(cr, 8, k); cg = lerp(cg, 5, k); cb = lerp(cb, 15, k); const vi = Math.pow(hm, 3) * (CEL ? 0.3 : 0.22); cr += 109 * vi; cg += 40 * vi; cb += 168 * vi; }
        // a soft ink edge so it reads on a bright floor
        const ink = 0.28 + 0.72 * sstep(0, 2.6, dpx); cr *= ink; cg *= ink; cb *= ink;
        const a = cl(dpx + 0.5), o = i * 4; dd[o] = cr; dd[o + 1] = cg; dd[o + 2] = cb; dd[o + 3] = a * 255;
        // the socket / nasal light (added on its own): deep violet to lavender toward the back of the hole
        if (hm > 0.02 && part === 'cran') { const sk = SK[i], e = 1, lc0 = Math.pow(sk, 1.6), lc1 = Math.pow(sk, 3), lc2 = Math.pow(sk, 6); ld[o] = Math.min(255, 109 * lc0 * 0.7 + 165 * lc1 * 0.5 + 208 * lc2 * 0.6); ld[o + 1] = Math.min(255, 40 * lc0 * 0.7 + 92 * lc1 * 0.5 + 174 * lc2 * 0.6); ld[o + 2] = Math.min(255, 168 * lc0 * 0.7 + 255 * lc1 * 0.5 + 255 * lc2 * 0.6); ld[o + 3] = Math.min(255, 255 * a * e * cl(lc0 * 1.2)); }
        NZ[i] = vnoise(px * 9 / W + 7, py * 9 / W) * 0.62 + vnoise(px * 28 / W, py * 28 / W + 7) * 0.18 + (1 - py / Hh) * 0.2;
        if (a > 0.95 && hm < 0.1 && ((px * 7 + py * 13) % 53 === 0)) res.pts.push([x, y, part === 'jaw' ? 1 : 0]); }
      g.putImageData(im, 0, 0);
      if (part === 'cran') {
        // the engraved fissures: a dark cut with a faint lit lip below it
        g.save(); g.globalCompositeOperation = 'source-atop'; g.translate(W / 2, OYU * s); g.lineCap = 'round'; g.lineJoin = 'round';
        const path = (list, dy) => { g.beginPath(); for (const pl of list) { g.moveTo(pl[0][0] * s, pl[0][1] * s + dy); for (let k = 1; k < pl.length; k++) g.lineTo(pl[k][0] * s, pl[k][1] * s + dy); } };
        const all = []; for (const c of cracks) { all.push(c.pts); for (const b of c.br) all.push(b); }
        path(all, Math.max(0.8, s * 0.012)); g.strokeStyle = 'rgba(150,130,190,0.22)'; g.lineWidth = Math.max(0.8, s * 0.014); g.stroke();
        path(all, 0); g.strokeStyle = 'rgba(6,4,10,0.85)'; g.lineWidth = Math.max(1, s * 0.02); g.stroke();
        g.restore();
        lg.putImageData(lim, 0, 0); res.light = lc;
        // the crack light (added): energy, edge, a hot core, cut to the skull
        const cc = document.createElement('canvas'); cc.width = W; cc.height = Hh; const c2 = cc.getContext('2d'); c2.translate(W / 2, OYU * s); c2.lineCap = 'round'; c2.lineJoin = 'round';
        for (const [col, lw] of [['rgba(109,40,168,0.32)', 0.075], ['rgba(109,40,168,0.5)', 0.04], ['rgba(165,92,255,0.85)', 0.018], ['rgba(222,200,255,0.8)', 0.007]]) { c2.beginPath(); for (const pl of all) { c2.moveTo(pl[0][0] * s, pl[0][1] * s); for (let k = 1; k < pl.length; k++) c2.lineTo(pl[k][0] * s, pl[k][1] * s); } c2.strokeStyle = col; c2.lineWidth = Math.max(0.8, lw * s); c2.stroke(); }
        c2.setTransform(1, 0, 0, 1, 0, 0); c2.globalCompositeOperation = 'destination-in'; c2.drawImage(cv, 0, 0); res.crack = cc; res.cran = cv;
      } else res.jaw = cv;
    }
    res.ready = true;
  }
  const SKC = {};
  function skullFor(PX, lv, seed) { const key = PX + ':' + lv; if (SKC[key]) return SKC[key]; const cr = makeCracks(lv >= 7 ? 9 : lv >= 4 ? 8 : 6, lv >= 7 ? 2 : lv >= 4 ? 1 : 0, 31 + lv * 7); const S = { cracks: cr, dis: [], ready: false }; const it = buildSkull(PX, lv, cr, S); S.step = ms => { const t0 = performance.now(); while (!S.ready && performance.now() - t0 < ms) it.next(); }; SKC[key] = S; return S; }
  // a crumbling copy of a sprite: the pixels go by noise (the top first), a violet ember line at the crumbling edge
  function dissolve(img, th, NZ) { const W = img.width, Hh = img.height, cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'); g.drawImage(img, 0, 0); const im = g.getImageData(0, 0, W, Hh), d = im.data;
    for (let i = 0, o = 0; i < W * Hh; i++, o += 4) { if (!d[o + 3]) continue; const n = NZ[i], e = n - th * 1.05;
      if (e < 0) { d[o + 3] = 0; continue; } const k = sstep(0, 0.07, e); if (k < 1) { const gl = 1 - k; d[o] = Math.min(255, d[o] + 190 * gl); d[o + 1] = Math.min(255, d[o + 1] + 100 * gl); d[o + 2] = Math.min(255, d[o + 2] + 255 * gl); d[o + 3] *= sstep(0, 0.02, e) * 0.7 + 0.3 * k; } }
    g.putImageData(im, 0, 0); return cv; }

  /* a softly ending path: a stroke stamped as glow sprites, fading in and out at both ends (no hard ends) */
  function softPath(c, pts, w, col, a) { if (pts.length < 2 || !(a > 0.01)) return; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(l); L += l; } if (L < 1) return;
    const step = Math.max(1.5, w * 0.35), img = glowSprite(col); c.save(); c.globalCompositeOperation = 'lighter'; let i = 0, acc = 0;
    for (let d = 0; d <= L; d += step) { while (i < seg.length - 1 && acc + seg[i] < d) { acc += seg[i]; i++; } const e = seg[i] ? (d - acc) / seg[i] : 0, x = lerp(pts[i][0], pts[i + 1][0], e), y = lerp(pts[i][1], pts[i + 1][1], e), u = d / L, env = Math.min(1, u / 0.15, (1 - u) / 0.15);
      c.globalAlpha = Math.min(1, a * env); c.drawImage(img, x - w, y - w, w * 2, w * 2); }
    c.restore(); }
  // a crescent (a halo segment): between angles a0 and a1 on a circle of radius r (ry squash), width w, tapering to points
  function crescent(c, cx, cy, r, sq, a0, a1, w, n) { c.beginPath(); for (let k = 0; k <= n; k++) { const u = k / n, b = lerp(a0, a1, u), rr = r + w * 0.5 * Math.pow(Math.sin(u * Math.PI), 0.7); k ? c.lineTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr * sq) : c.moveTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr * sq); }
    for (let k = n; k >= 0; k--) { const u = k / n, b = lerp(a0, a1, u), rr = r - w * 0.5 * Math.pow(Math.sin(u * Math.PI), 0.7); c.lineTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr * sq); } c.closePath(); }

  /* ================= D-U10 Dead Scream ================= */
  U.deadscream = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K, evoK = 1 + 0.08 * (ev - 1), DK = C.base * K * evoK;
    const W = [7, 8.5, 10, 12, 14.5, 17, 20][ev - 1], FORM = 1.1, PER = 0.5, P0 = FORM + 0.3, NP = Math.floor((W - 0.3) / PER) + 1, TE = FORM + W, TB = TE + 0.5, LIFE = TB + 2.0;
    const R = (3.0 + 0.27 * (ev - 1)) * K, RF = R * 1.15, HS = [2.0, 2.15, 2.3, 2.55, 2.85, 3.2, 3.12][ev - 1], UT = HS / 2.6;   // UT: tiles per skull unit
    const TOT = [14, 16.7, 19.3, 22, 25.3, 28.7, 32][ev - 1] * DK, NS = CEL ? 3 : ADE ? 2 : 1, PD = TOT * 0.8 / NP, SPK = TOT * 0.2 / (NP * NS), FIN = 4 * DK, STUN = 0.32, FEAR = 1.0;
    const NFREE = CEL ? 14 : ADE ? 9 : 6, seed = Math.floor(Math.random() * 1000);
    const HAL = CEL ? 6 : 0, HRING = ADE ? (CEL ? 2 : 1) : 0;
    const halo = []; for (let i = 0; i < HAL; i++) halo.push({ a: i / HAL * TAU + R1(seed + i) * 0.4, span: 0.55 + 0.3 * R1(seed + i * 3.1), r: 1.62 + 0.12 * R1(seed + i * 5.3), w: 0.16 + 0.07 * R1(seed + i * 2.3), sp: 0.12 * (i % 2 ? 1 : 0.8) });
    const rings = []; for (let j = 0; j < HRING; j++) { const n = j ? 9 : 7, segs = []; for (let i = 0; i < n; i++) { const a0 = i / n * TAU + R1(seed + j * 40 + i) * 0.25, sp = TAU / n * (0.45 + 0.35 * R1(seed + j * 17 + i)); segs.push([a0, a0 + sp]); } rings.push({ r: j ? 1.98 : 1.45, sp: j ? -0.09 : 0.16, segs, w: j ? 0.04 : 0.06 }); }
    const BR = rings.length ? rings : [{ r: 1.45, sp: 0.16, w: 0.06, segs: Array.from({ length: 7 }, (_, i) => { const a0 = i / 7 * TAU + R1(seed + 90 + i) * 0.25; return [a0, a0 + TAU / 7 * (0.45 + 0.3 * R1(seed + 70 + i))]; }) }];
    const sparks = [], puffs = [], frags = [], ash = [], knot = [];
    let next = 0, fin = false, TD = TB, died = false, hx = me.x, hy = me.y, S = null, PXk = 0, lastPulse = -1;
    const hitsBy = new Map();   // pulse index -> Map(monster -> spark hits)
    H.X.banner('DEAD SCREAM', '', C.col, 1.4); H.X.sfx.hum();
    // the pulse at time t: k its index, pre (the gather before it), post (the release after it)
    const pulseAt = t => { if (t < P0 - 0.3 || t > TE + 0.1) return { k: -1, pre: 0, post: 0, d: 9, open: 0 }; const k = Math.max(0, Math.min(NP - 1, Math.round((t - P0) / PER))), d = t - (P0 + k * PER);
      const pre = d < 0 ? sm((d + 0.22) / 0.22) : 0, post = d >= 0 ? Math.exp(-d * 7) : 0, open = d < 0 ? sm((d + 0.22) / 0.22) : Math.max(0, 1 - d / 0.26) * (1 - sm((d - 0.2) / 0.06)); return { k, pre, post, d, open }; };
    // the pet: things in the air dim smoothly near it
    const pfAt = (px, py, T, PX, PY) => 0.25 + 0.75 * sstep(0.4 * T, 1.3 * T, Math.hypot(px - PX, (py - PY) * 1.2));
    // a point of the skull (units) in the world (tiles; z is height)
    const wp = (f, ux, uy) => [hx + ux * UT, hy + 0.02, (f.HZ || 3) - uy * UT];
    function pulse(f, k) {
      const x = me.x, y = me.y; H.hitArea(x, y, R, PD, C.dmgO({ stun: STUN }));
      for (const m of H.near(x, y, R)) if (!m.boss && !m.still && !m.fiend) { m.fearT = Math.max(m.fearT || 0, FEAR); m.fearX = x; m.fearY = y; }
      (k % 2 ? H.X.sfx.whoosh : H.X.sfx.thud)(); H.X.shake(1.4 + (CEL ? 0.8 : 0), 0.1); H.X.light(x, y, R * 0.9, 0.25);
      // the sparks from the jaw and cheekbones: aimed ones at each monster in range (ns each), free ones scattering
      const hm = new Map(); hitsBy.set(k, hm); if (hitsBy.size > 4) hitsBy.delete(hitsBy.keys().next().value);
      const src = [[-0.42, 1.04], [0.42, 1.04], [-0.55, 0.5], [0.55, 0.5], [-0.2, 1.12], [0.2, 1.12]];
      const tg = H.sortNear(x, y, H.near(x, y, R)).slice(0, 8);
      for (const m of tg) for (let j = 0; j < NS; j++) { const s0 = src[(j * 2 + (m.x > x ? 1 : 0)) % src.length], p = wp(f, s0[0], s0[1]); sparks.push({ x: p[0], y: p[1], z: p[2], x0: p[0], y0: p[1], z0: p[2], m, k, t: -j * 0.05, dur: 0.22 + 0.03 * Math.hypot(m.x - p[0], m.y - p[1]) + Math.random() * 0.06, bend: (Math.random() - 0.5) * 2.2, up: 0.5 + Math.random() * 0.9, tr: [], ph: Math.random() * 99 }); }
      for (let j = 0; j < H.n(NFREE); j++) { const s0 = src[j % src.length], p = wp(f, s0[0], s0[1]), b = (s0[0] > 0 ? 0 : Math.PI) + (Math.random() - 0.5) * 2.2 + (j % 3 === 2 ? Math.PI / 2 : 0), v = 2.6 + Math.random() * 3;
        sparks.push({ x: p[0], y: p[1], z: p[2], vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: -0.5 + Math.random() * 2, k, t: 0, life: 0.35 + Math.random() * 0.25, tr: [], ph: Math.random() * 99, free: true }); }
      // shadow drifting down into the area, ash at Celestial
      for (let j = 0; j < H.n(ADE ? 5 : 3); j++) { const p = wp(f, (Math.random() - 0.5) * 1.2, 1.1); puffs.push({ x: p[0], y: p[1] + (Math.random() - 0.5) * 0.6, z: p[2], vx: (Math.random() - 0.5) * 1.6, vy: (Math.random() - 0.5) * 0.6, vz: -0.9 - Math.random() * 0.8, t: 0, life: 0.9 + Math.random() * 0.5, s: 0.35 + Math.random() * 0.3 + 0.03 * ev, d: 1 }); }
      if (CEL) for (let j = 0; j < H.n(10); j++) { const b = Math.random() * TAU, rr = R * (0.3 + 0.7 * Math.random()); ash.push({ x: x + Math.cos(b) * rr * 0.4, y: y + Math.sin(b) * rr * 0.25, z: 0.3 + Math.random() * 1.6, vx: Math.cos(b) * (0.6 + Math.random()), vy: Math.sin(b) * 0.4, vz: 0.15 + Math.random() * 0.3, t: 0, life: 1.6 + Math.random() * 1.2, r: Math.random() * TAU, s: 0.03 + Math.random() * 0.03 }); }
    }
    function sparkHit(sp, m) { if (!m || m.dead) return false; let hm = hitsBy.get(sp.k); if (!hm) return false; const n = hm.get(m) || 0; if (n >= NS) return false; hm.set(m, n + 1); H.X.hitMon(m, SPK, C.dmgO({})); return true; }
    function finisher(f) {
      const x = me.x, y = me.y; H.hitArea(x, y, RF, FIN, C.dmgO({ kb: 6, stun: 0.6 }));
      H.X.flash(0.16, ACC); H.X.hitstop(0.06); H.X.sfx.crash(); H.X.shake(12 + 2 * ev, 0.4); H.X.light(x, y, RF * 1.3, 0.45);
      H.burst(x, y - 0.3, 'spark', 18 + 3 * ev, { v: 8, up: 2, g: 4, life: 0.55, size: 2.2, color: [EDGE, ACC, ENERGY] });
      for (let i = 0; i < H.n(10 + 2 * ev); i++) { const b = i / (10 + 2 * ev) * TAU + Math.random() * 0.3, v = 2.2 + Math.random() * 2; puffs.push({ x: x + Math.cos(b) * 0.4, y: y + Math.sin(b) * 0.25, z: 0.3 + Math.random() * 0.5, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.55, vz: 0.4 + Math.random() * 0.6, t: 0, life: 0.9 + Math.random() * 0.5, s: 0.5 + Math.random() * 0.35 + 0.04 * ev, d: i % 2, drag: 2.2 }); }
    }
    function disintegrate(f) {
      if (!S || !S.ready) return; const n = H.n(CEL ? 90 : ADE ? 70 : 50), P = S.pts;
      for (let i = 0; i < n && P.length; i++) { const q = P[Math.floor(Math.random() * P.length)], p = wp(f, q[0], q[1] + (q[2] ? 0.03 : 0)); frags.push({ x: p[0], y: p[1], z: p[2], vx: q[0] * (0.5 + Math.random()) * UT * 0.8, vy: (Math.random() - 0.5) * 0.4, vz: 0.6 + Math.random() * 1.4, t: -Math.random() * 0.5 * (1 - (q[1] + 1.4) / 2.8), life: 1.0 + Math.random() * 0.8, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, s: (0.04 + Math.random() * 0.06) * Math.sqrt(HS / 2) }); }
      for (let i = 0; i < H.n(12 + ev); i++) { const p = wp(f, (Math.random() - 0.5) * 1.8, (Math.random() - 0.4) * 2.2); puffs.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 0.8, vy: 0, vz: 0.5 + Math.random() * 0.7, t: -Math.random() * 0.35, life: 1.2 + Math.random() * 0.6, s: 0.45 + Math.random() * 0.4 + 0.04 * ev, d: i % 3 ? 1 : 0 }); }
    }
    /* ================= v391 U4: the GPU picture =================
       The skull is DEADSCREAM_SKULL (20k5k2: a 3D model on GLM); everything round it goes through the shared FGFX painter
       (20k6h): a pass on the floor (drawUnder) and two in the air (behind the skull, over it), plus a screen-space ripple
       read from the canvas itself (the scream's rings and the cone of disturbed air under the mouth; off with Fewer
       effects). Light is soft gaussian glow and beams laid as overlapping chains whose fades sum to one (no ends, no cut
       edges); the solid parts (smoke, the dark ring, shadow) are FGFX smoke so they read on a pale floor. The gameplay
       above (pulses, sparks, fear, stun, the finisher) is untouched: this only draws it. Where the GPU cannot draw (no
       WebGL, a lost context, a software rasteriser without the test flags, window.__DS_GL = 0), the original 2D
       picture (under2D / draw2D, below, unchanged) is drawn instead, frame by frame. */
    let RS = (seed * 2654435761) >>> 0 || 1; const rnd = () => { RS ^= RS << 13; RS >>>= 0; RS ^= RS >>> 17; RS ^= RS << 5; RS >>>= 0; return RS / 4294967296; };   // (the picture's own random numbers: the game's stream stays the same on both paths)
    const SKL = () => DEADSCREAM_SKULL;
    const lowQ = () => typeof st !== 'undefined' && st && !!st.lowFx;
    const FGX = () => { try { return self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; } catch (e) { return null; } };
    const VIO = '#7C3AED', VIOD = '#4C1D95', VIOL = '#B794FF', PALE = '#EBDDFF', SMK = '#1A0C2A';
    function gpuMode(t) { let fl = null; try { fl = window.__DS_GL; } catch (e) {} if (fl === 0) return false; const FG = FGX(); if (!FG || !FG.usable() || !SKL().ok()) return false; SKL().prepare(t < 0.45 ? 5 : 8); return true; }   // (the model builds a few ms a frame; until it is ready the skull stays hidden in its smoke)
    let GP = null; const GS = { lt: null, lp: -1, parts: [], shards: [], burst: null, wisp: 0, chip: 0, emb: 0 };
    for (let i = 0; i < 260; i++) GS.parts.push({ on: false });
    function emit(o) { for (const p of GS.parts) if (!p.on) { Object.assign(p, { on: true, t: 0, vx: 0, vy: 0, vz: 0, drag: 1.2, g: 0 }, o); return p; } return null; }
    // the pose and every number the GPU passes share, once a frame
    function gpose(c, f, X, Y, T) {
      const t = f.t; if (GP && GP.t === t && GP.T === T && GP.X === X && GP.Y === Y) return GP;
      const SC = scr(c), P = pulseAt(t), u = HS * T / 2.6, chin = 1.42 * u, top = 1.32 * u, hzW = (T * 1.75 + chin) / T, room = (Y - (SC.y0 + T * 2.6) - top) / T; f.HZ = Math.max(hzW, Math.min(hzW + 0.5, room));
      const close = sm((t - TE) / 0.25), drw = sm((t - TE - 0.05) / 0.4), dis = died ? cl((t - TD) / 0.9) : 0, EW = Math.min(3, W * 0.3);
      const jolt = P.post * (P.d >= 0 && P.d < 0.3 ? 1 : 0), endK = sm((t - (TE - EW)) / EW) * (1 - dis), surge = t > TE ? sm((t - TE) / (TB - TE)) : 0;
      const shiv = T * 0.018 * (1 + 2 * jolt + 1.6 * endK + 3 * surge);
      const tilt = 0.06 * Math.sin(t * 0.55 + seed) + 0.025 * Math.sin(t * 1.7) + 0.012 * Math.sin(t * 23) * (1 + jolt) + (0.02 * endK + 0.05 * surge) * Math.sin(t * 37);
      const SX = X + (Math.sin(t * 47) + Math.sin(t * 31.7)) * shiv * 0.5, SY = Y - f.HZ * T + Math.sin(t * 1.3) * T * 0.05 + (Math.sin(t * 41) + Math.sin(t * 29.3)) * shiv * 0.4 - jolt * u * 0.05;
      const form = sm((t - 0.45) / 0.6), scl = (0.86 + 0.14 * form) * (1 + 0.045 * jolt - 0.02 * P.pre) * (1 + 0.04 * close + 0.05 * surge);
      const open = (1 - close) * P.open * (t >= FORM ? 1 : 0), gk = (t < TE ? 0.25 + 0.75 * Math.max(P.pre, P.post) : 0.55 + 1.1 * surge) * (1 - dis);
      if (GS.rt == null && SKL().ready) GS.rt = t; const f0 = Math.max(0.42, GS.rt == null ? 1e9 : GS.rt), spill = fin && !died ? 1 : Math.max(1 - sm((t - f0) / 0.62), dis), fire = sm((t - 0.85) / 0.3) * (t < TE ? 1 : 1 - 0.7 * drw) * (1 - dis);
      const crack = Math.min(1, 0.3 + 0.5 * Math.pow(cl((t - FORM) / W), 1.6) + 0.15 * endK + 0.35 * surge), k = u * scl;
      const pose = { yaw: 0.16 * Math.sin(t * 0.41 + seed) + 0.05 * Math.sin(t * 1.3) + 0.03 * endK * Math.sin(t * 29), pitch: -0.1 + 0.16 * open + 0.03 * Math.sin(t * 0.9) - 0.06 * P.pre, roll: tilt, jaw: open * (0.85 + 0.15 * jolt), glow: 0.3 + gk, crack, spill, fire, t };
      const Fr = SKL().frame(pose), at = (p, jaw) => SKL().toScreen(p, jaw, SX, SY, k, pose, Fr);
      GP = { t, T, X, Y, u, k, SX, SY, P, jolt, open, gk, close, drw, dis, endK, surge, pose, fire, crack, A: 1 - spill, AIR: cl(f.life / 0.5), Fr, at,
        eyes: [at([-0.33, 0.66, -0.14]), at([0.33, 0.66, -0.14])], mouth: (() => { const a = at([0, 0.62, -0.92]), b = at([0, 0.58, -1.0], true); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; })(), throat: (() => { const a = at([0, 0.3, -0.93]), b = at([0, 0.3, -1.04], true); return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; })() };
      return GP; }
    // a soft ring of light round (x, y) (floor squash sy): overlapping gaussian beams whose end fades sum to one
    function lring(Q, x, y, r, sy, w, col, a) { if (!(a > 0.004) || r < 2) return; const n = Math.max(16, Math.min(56, Math.round(TAU * r / Math.max(4, w * 1.4))));
      for (let i = 0; i < n; i++) { const b0 = i / n * TAU, b1 = (i + 1) / n * TAU, x0 = x + Math.cos(b0) * r, y0 = y + Math.sin(b0) * r * sy, x1 = x + Math.cos(b1) * r, y1 = y + Math.sin(b1) * r * sy, ex = (x1 - x0) * 0.125, ey = (y1 - y0) * 0.125, bm = (b0 + b1) / 2, ww = w * Math.sqrt(Math.cos(bm) ** 2 * sy * sy + Math.sin(bm) ** 2 * (0.35 + 0.65 * sy));
        Q.beam(x0 - ex, y0 - ey, x1 + ex, y1 + ey, ww, col, a); } }
    // a ring of dark smoke on the floor (the scream's body: it reads on a pale floor)
    function sring(Q, x, y, r, sy, s, col, a, sd) { if (!(a > 0.01) || r < 2) return; const n = H.n(Math.max(10, Math.min(26, Math.round(TAU * r / Math.max(6, s * 1.3)))));
      for (let i = 0; i < n; i++) { const b = (i + 0.5 * (sd % 1)) / n * TAU; Q.quad(9, x + Math.cos(b) * r, y + Math.sin(b) * r * sy, s, 0, 0, s * (0.5 + 0.5 * sy), col, a, 0, sd + i * 0.37); } }
    // a soft chain of beams through screen points (a wisp): width and strength by place along it (0 tail .. 1 head)
    function chain(Q, pts, w, col, a, wf) { for (let i = 0; i < pts.length - 1; i++) { const p = pts[i], q = pts[i + 1], v = (i + 1) / (pts.length - 1), ex = (q[0] - p[0]) * 0.125, ey = (q[1] - p[1]) * 0.125; if (Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]) < 0.5) continue; Q.beam(p[0] - ex, p[1] - ey, q[0] + ex, q[1] + ey, w * (wf ? wf(v) : 1), col, a * v); } }
    /* ---- the screen-space ripple: what is already drawn, read back and laid over itself displaced ---- */
    let WA = null, WB = null;
    const wcv = (cv, w, h) => { if (!cv) { cv = document.createElement('canvas'); } if (cv.width < w || cv.height < h) { cv.width = Math.max(cv.width, w); cv.height = Math.max(cv.height, h); } return cv; };
    const annSpr = () => fxSprite('dskann', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); [[0, 'rgba(0,0,0,0)'], [0.62, 'rgba(0,0,0,0)'], [0.8, 'rgba(0,0,0,0.75)'], [0.87, 'rgba(0,0,0,1)'], [0.93, 'rgba(0,0,0,0.6)'], [1, 'rgba(0,0,0,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
    const coneSpr = () => fxSprite('dskcone', 64, 128, g => { const im = g.createImageData(64, 128), d = im.data; for (let y = 0; y < 128; y++) for (let x = 0; x < 64; x++) { const v = y / 127, hw = 0.12 + 0.88 * v, ax = Math.abs((x - 31.5) / 32) / hw, a = (1 - sstep(0.35, 1, ax)) * sstep(0, 0.25, v) * (1 - sstep(0.75, 1, v)); d[(y * 64 + x) * 4 + 3] = Math.round(255 * a); } g.putImageData(im, 0, 0); });
    function warpRing(c, cx, cy, r, sy, amp, a) {
      if (!(a > 0.02) || r < 8 || lowQ()) return; const m = c.getTransform(), kx = m.a, ky = m.d, X0 = kx * cx + m.e, Y0 = ky * cy + m.f, RX = r * kx * 1.15, RY = r * sy * ky * 1.15, cw = c.canvas.width, ch = c.canvas.height;
      const x0 = Math.max(0, Math.floor(X0 - RX)), y0 = Math.max(0, Math.floor(Y0 - RY)), x1 = Math.min(cw, Math.ceil(X0 + RX)), y1 = Math.min(ch, Math.ceil(Y0 + RY)), w = x1 - x0, h = y1 - y0; if (w < 8 || h < 8 || w * h > 4e6) return;
      WA = wcv(WA, w, h); const g = WA.getContext('2d'), s = 1 + amp; g.save(); g.globalCompositeOperation = 'copy'; g.globalAlpha = 1;
      // (the region, magnified about the ring's centre: what lies under the ring is pushed outward)
      const sx0 = X0 + (x0 - X0) / s, sy0 = Y0 + (y0 - Y0) / s; g.drawImage(c.canvas, sx0, sy0, w / s, h / s, 0, 0, w, h);
      g.globalCompositeOperation = 'destination-in'; g.globalAlpha = Math.min(1, a); g.drawImage(annSpr(), X0 - RX - x0, Y0 - RY - y0, RX * 2, RY * 2); g.restore();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.drawImage(WA, 0, 0, w, h, x0, y0, w, h); c.restore(); }
    function warpCone(c, mx, my, fx, fy, hw, amp, a, t) {
      if (!(a > 0.02) || lowQ()) return; const m = c.getTransform(), kx = m.a, ky = m.d, cw = c.canvas.width, ch = c.canvas.height, X0 = kx * mx + m.e, Y0 = ky * my + m.f, Y1 = ky * fy + m.f, HW = hw * kx;
      const x0 = Math.max(0, Math.floor(X0 - HW)), x1 = Math.min(cw, Math.ceil(X0 + HW)), y0 = Math.max(0, Math.floor(Y0)), y1 = Math.min(ch, Math.ceil(Y1)), w = x1 - x0, h = y1 - y0; if (w < 8 || h < 8) return;
      WB = wcv(WB, w, h); const g = WB.getContext('2d'), n = Math.min(56, Math.max(8, Math.round(h / 4))), sh = h / n, A = amp * kx; g.save(); g.globalCompositeOperation = 'copy'; g.drawImage(c.canvas, x0, y0, w, h, 0, 0, w, h); g.globalCompositeOperation = 'source-over';
      for (let i = 0; i < n; i++) { const v = (i + 0.5) / n, dx = A * Math.sin(v * 17 - t * 26) * v; g.drawImage(c.canvas, x0, y0 + i * sh, w, sh + 1, dx, i * sh, w, sh + 1); }
      g.globalCompositeOperation = 'destination-in'; g.globalAlpha = Math.min(1, a); g.drawImage(coneSpr(), X0 - HW - x0, Y0 - y0, HW * 2, Y1 - Y0); g.restore();
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(WB, 0, 0, w, h, x0, y0, w, h); c.restore(); }
    // the fear mark: a small pale skull, softly lit violet (baked once)
    const fearSpr = () => fxSprite('dskfear', 64, 64, g => { g.save(); g.translate(32, 31); g.shadowColor = 'rgba(139,92,246,0.95)'; g.shadowBlur = 9; g.fillStyle = 'rgba(234,224,255,0.93)';
      g.beginPath(); g.ellipse(0, -3, 12.5, 12, 0, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-8.5, 4); g.quadraticCurveTo(-8, 15, 0, 15.5); g.quadraticCurveTo(8, 15, 8.5, 4); g.closePath(); g.fill(); g.shadowBlur = 0;
      g.fillStyle = '#1A0B2E'; g.beginPath(); g.ellipse(-4.9, -1.5, 3.7, 4.3, 0.35, 0, TAU); g.fill(); g.beginPath(); g.ellipse(4.9, -1.5, 3.7, 4.3, -0.35, 0, TAU); g.fill(); g.beginPath(); g.moveTo(0, 3.5); g.lineTo(-1.7, 7.2); g.lineTo(1.7, 7.2); g.closePath(); g.fill();
      g.fillStyle = 'rgba(26,11,46,0.75)'; for (let i = -2; i <= 2; i++) g.fillRect(i * 2.7 - 0.6, 9.6, 1.2, 4.6); g.fillStyle = '#C9A2FF'; g.beginPath(); g.arc(-4.6, -1, 1.25, 0, TAU); g.fill(); g.beginPath(); g.arc(4.6, -1, 1.25, 0, TAU); g.fill(); g.restore(); });
    // rotation (columns) about a unit axis
    const axRot = (a, ang) => { const c0 = Math.cos(ang), s0 = Math.sin(ang), t0 = 1 - c0, [x, y, z] = a; return [[t0 * x * x + c0, t0 * x * y + s0 * z, t0 * x * z - s0 * y], [t0 * x * y - s0 * z, t0 * y * y + c0, t0 * y * z + s0 * x], [t0 * x * z + s0 * y, t0 * y * z - s0 * x, t0 * z * z + c0]]; };
    const mm3 = (A, B) => B.map(v => [A[0][0] * v[0] + A[1][0] * v[1] + A[2][0] * v[2], A[0][1] * v[0] + A[1][1] * v[1] + A[2][1] * v[2], A[0][2] * v[0] + A[1][2] * v[1] + A[2][2] * v[2]]);
    const mv3 = (A, v) => [A[0][0] * v[0] + A[1][0] * v[1] + A[2][0] * v[2], A[0][1] * v[0] + A[1][1] * v[1] + A[2][1] * v[2], A[0][2] * v[0] + A[1][2] * v[1] + A[2][2] * v[2]];
    // a screen point to the world (x, y on the floor below it at the skull's ground point, z its height in tiles)
    const toW = (sx, sy, T) => { const gx = H.sx(hx), gy = H.sy(hy); return { x: hx + (sx - gx) / T, y: hy + 0.02, z: Math.max(0.05, (gy - sy) / T) }; };
    // the burst: the skull breaks into bone shards (GLM) and violet ash; or, the pet down, it dissolves
    function burst(g, T, dying) {
      const pts = SKL().pts || [], n = dying ? H.n(8) : H.n(CEL ? 38 : ADE ? 32 : 26), Fr = g.Fr, gx = H.sx(hx), gy = H.sy(hy);
      GS.burst = { x: hx, y: hy, hz: (gy - g.SY) / T, ku: g.k / T, t0: g.t, dying };
      for (let i = 0; i < n && pts.length; i++) { const q = pts[(i * 37 + 11) % pts.length], jaw = q[6], p = jaw ? mv3(Fr.Rj, q).map((v, j) => v + Fr.Tj[j]) : mv3(Fr.Rs, q), nn = jaw ? mv3(Fr.Rj, [q[3], q[4], q[5]]) : mv3(Fr.Rs, [q[3], q[4], q[5]]), sp = dying ? 0.4 + rnd() * 0.5 : 1.6 + rnd() * 2.2;
        const ax = [rnd() - 0.5, rnd() - 0.5, rnd() - 0.5], al = Math.hypot(ax[0], ax[1], ax[2]) || 1;
        GS.shards.push({ m: i % 6, p, v: [nn[0] * sp + p[0] * 0.8, nn[1] * sp + p[1] * 0.5, nn[2] * sp + (dying ? 0.6 : 1.3) + rnd()], ax: ax.map(v => v / al), ang: 0, va: (rnd() - 0.5) * 14, R0: axRot([0, 0, 1], rnd() * TAU), s: (0.75 + rnd() * 0.6) * (dying ? 0.7 : 1), t: -rnd() * 0.06, life: 1.0 + rnd() * 0.7, glow: 1 }); }
      const nA = H.n(dying ? 30 : CEL ? 70 : 55); for (let i = 0; i < nA; i++) { const b = rnd() * TAU, rr = rnd(), w0 = toW(g.SX + Math.cos(b) * g.k * rr, g.SY + Math.sin(b) * g.k * rr * 1.2 - g.k * 0.1, T), v = dying ? 0.4 : 1.2 + rnd() * 2.6;
        emit({ kind: i % 3 ? 'ash' : 'sp', x: w0.x, y: w0.y, z: w0.z, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.4, vz: (dying ? 0.6 : 0.4) + rnd() * 1.2, drag: 1.6, life: 1.0 + rnd() * 1.1, s: 0.8 + rnd() * 0.8, sd: rnd() * 9, g: -0.25 }); }
    }
    function simulate(g, T, dt) {
      const t = g.t, lo = lowQ();
      for (const p of GS.parts) { if (!p.on) continue; p.t += dt; if (p.t >= p.life) { p.on = false; continue; } const dr = Math.exp(-p.drag * dt); p.vx *= dr; p.vy *= dr; p.vz = p.vz * dr - (p.g || 0) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0.03, p.z + p.vz * dt); }
      for (let i = GS.shards.length - 1; i >= 0; i--) { const s = GS.shards[i]; s.t += dt; if (s.t < 0) continue; if (s.t >= s.life) { GS.shards.splice(i, 1); continue; } const dr = Math.exp(-0.9 * dt); s.v[0] *= dr; s.v[1] *= dr; s.v[2] = s.v[2] * dr - 3.4 * dt; for (let j = 0; j < 3; j++) s.p[j] += s.v[j] * dt; s.ang += s.va * dt;
        const fl = -GS.burst.hz / GS.burst.ku; if (s.p[2] < fl) { s.p[2] = fl; s.v[2] = Math.abs(s.v[2]) * 0.3; s.va *= 0.6; } }
      if (g.A < 0.02 || t < 0.8) return;
      // the soul fire breathes wisps up out of the orbits; chips and embers fall from the cracks as the end nears
      GS.wisp += dt * (lo ? 2.5 : 6) * g.fire * (0.6 + g.gk); while (GS.wisp > 1) { GS.wisp -= 1; const e = g.eyes[rnd() < 0.5 ? 0 : 1], w0 = toW(e[0], e[1], T); emit({ kind: 'ws', x: w0.x + (rnd() - 0.5) * 0.1, y: w0.y, z: w0.z, vx: (rnd() - 0.5) * 0.3, vz: 0.7 + rnd() * 0.6, drag: 0.6, life: 0.7 + rnd() * 0.5, s: 0.7 + rnd() * 0.6, sd: rnd() * 9 }); }
      GS.chip += dt * (lo ? 4 : 12) * (g.endK + g.surge); while (GS.chip > 1) { GS.chip -= 1; const b = rnd() * TAU, w0 = toW(g.SX + Math.cos(b) * g.k * 0.7, g.SY - g.k * (0.2 + rnd() * 0.8), T); emit({ kind: rnd() < 0.55 ? 'sp' : 'dk', x: w0.x, y: w0.y, z: w0.z, vx: (rnd() - 0.5) * 0.8, vz: -0.2 - rnd() * 0.6, g: 2.5, drag: 0.8, life: 0.5 + rnd() * 0.5, s: 0.6 + rnd() * 0.4, sd: rnd() * 9 }); }
    }
    function newPulse(g, T) {
      const m0 = toW(g.mouth[0], g.mouth[1], T), n = H.n(ADE ? 18 : 13);
      for (let i = 0; i < n; i++) { const b = i / n * TAU + rnd() * 0.5, v = 2.2 + rnd() * 2.6; emit({ kind: i % 5 < 3 ? 'dk' : 'sp', x: m0.x, y: m0.y, z: m0.z, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: -0.6 + rnd() * 0.9, drag: 1.5, g: 0.6, life: 0.55 + rnd() * 0.45, s: 0.8 + rnd() * 0.6, sd: rnd() * 9 }); }
      for (const e of g.eyes) for (let j = 0; j < 2; j++) { const w0 = toW(e[0], e[1], T); emit({ kind: 'ws', x: w0.x, y: w0.y, z: w0.z, vx: (rnd() - 0.5) * 1.4, vz: 1 + rnd() * 0.8, drag: 1, life: 0.6 + rnd() * 0.4, s: 1.1, sd: rnd() * 9 }); }
    }
    function drawParts(Q, T, AIR) {
      for (const p of GS.parts) { if (!p.on || p.t < 0) continue; const q = p.t / p.life, a = Math.sin(Math.min(1, q * 4) * Math.PI / 2) * (1 - q) * AIR, x = H.sx(p.x), y = H.sy(p.y) - p.z * T, s = p.s || 1;
        if (p.kind === 'dk') { Q.smoke(x, y, T * 0.13 * s * (1 + q), a * 0.75, p.sd, SMK); Q.glow(x, y, T * 0.2 * s, VIO, a * 0.18); }
        else if (p.kind === 'sp') { Q.glow(x, y, T * 0.15 * s, '#9B5CFF', a * 0.5); Q.star(x, y, T * 0.06 * s, a * 0.85, PALE); }
        else if (p.kind === 'ws') { Q.glow(x, y, T * 0.24 * s * (0.6 + q), VIO, a * 0.32); Q.glow(x, y, T * 0.08 * s, PALE, a * 0.45); }
        else { Q.smoke(x, y, T * 0.075 * s, a * 0.7, p.sd, '#2A1E36'); if ((p.sd * 10 | 0) % 3 === 0) Q.star(x, y, T * 0.045 * s, a * 0.7, '#C9A2FF'); } } }
    function gpuUnder(c, f, X, Y, T) {
      const t = f.t, FG = FGX(), g = gpose(c, f, X, Y, T), P = g.P, on = sm((t - 0.3) / 0.8) * (1 - sm((t - TD) / 0.6)), RP = R * T, gy = H.GY, Q = FG.begin(c, null);
      const gk2 = 0.5 + 0.5 * Math.max(P.pre, P.post);
      // the skull's soft shadow, the area's light and its rim, the violet light spilling down under the skull
      Q.quad(9, X, Y + T * 0.05, T * 1.25, 0, 0, T * 1.25 * gy, '#0E0618', 0.32 * g.A * g.AIR, 0, seed);
      if (on > 0.01) { Q.glow(X, Y, RP * 1.12, '#6D28A8', on * (0.15 + 0.12 * gk2), gy); lring(Q, X, Y, RP, gy, T * 0.34, '#5B21B6', on * (0.16 + 0.12 * gk2)); lring(Q, X, Y, RP * 1.005, gy, T * 0.08, VIOL, on * (0.1 + 0.12 * gk2)); if (CEL) lring(Q, X, Y, RP * 0.62, gy, T * 0.16, VIO, on * 0.1 * gk2); }
      Q.glow(X, Y, T * 1.9, '#9B5CFF', (0.18 + 0.3 * g.gk) * g.fire * g.A, gy); Q.glow(X, Y, T * 0.9, '#D4B8FF', (0.08 + 0.22 * g.gk * g.open) * g.A, gy);
      // the formation: light drawn inward over the floor
      if (t < FORM + 0.2) for (let i = 0; i < 3; i++) { const q = (t * 1.3 + i / 3) % 1; lring(Q, X, Y, RP * (1.05 - 0.85 * q), gy, T * 0.22, VIO, 0.4 * Math.sin(q * Math.PI) * cl(t / 0.3) * (1 - sm((t - FORM) / 0.2))); }
      // each scream: a ring of dark smoke racing out over the floor, soft light on it and a pale crest; ripples from beneath (two at Adept); Celestial: a thick low wave
      for (let kk = Math.max(0, lastPulse - 2); kk <= lastPulse; kk++) { const d = t - (P0 + kk * PER); if (d < 0 || d > 1.0) continue;
        const q = cl(d / 0.62); if (q < 1) { const rr = RP * (0.3 + 0.82 * H.ease.out(q)), a = (1 - q) * sstep(0, 0.12, q);
          sring(Q, X, Y, rr, gy, T * (0.36 + 0.3 * q), SMK, a * (CEL ? 0.6 : 0.48), kk * 1.7 + seed);
          lring(Q, X, Y, rr, gy, T * (0.42 + 0.3 * q), '#6D28D9', a * 0.42); lring(Q, X, Y, rr * 1.01, gy, T * 0.1, PALE, a * 0.5);
          if (CEL) for (let j = 1; j < 4; j++) lring(Q, X, Y - j * T * 0.12 * (1 - q * 0.5), rr * (1 - j * 0.03), gy, T * (0.3 - j * 0.05), VIOD, a * (0.3 - j * 0.06)); }
        for (let j = 0; j < (ADE ? 2 : 1); j++) { const q2 = cl((d - j * 0.16) / 0.75); if (q2 <= 0 || q2 >= 1) continue; lring(Q, X, Y, RP * 0.75 * H.ease.out(q2) + 3, gy, T * 0.14, VIOL, (1 - q2) * 0.4 * sstep(0, 0.1, q2)); } }
      // the finisher on the floor: a flash, a violet-black shockwave, rings of light after it
      if (fin && !died) { const p = t - TB, RR = RF * T; Q.glow(X, Y, RR, '#D0AEFF', 0.5 * Math.max(0, 1 - p / 0.35), gy); Q.glow(X, Y, RR * 1.3, '#6D28A8', 0.4 * Math.max(0, 1 - p / 0.7), gy);
        const waves = CEL ? [[0, 1.05, 1], [0.08, 1.25, 0.7], [0.2, 1.5, 0.5]] : ADE ? [[0, 1.05, 1], [0.1, 1.25, 0.7]] : [[0, 1.0, 1], [0.12, 1.15, 0.6]];
        waves.forEach(([d, sc, w], j) => { const q = cl((p - d) / 0.7); if (q <= 0 || q >= 1) return; const rr = RR * sc * H.ease.out(q) + 4, a = (1 - q) * w * sstep(0, 0.08, q); if (!j) sring(Q, X, Y, rr, gy, T * (0.45 + 0.4 * q), SMK, a * 0.6, seed + 5); lring(Q, X, Y, rr, gy, T * (0.5 + 0.3 * q), '#6D28D9', a * 0.45); lring(Q, X, Y, rr, gy, T * 0.12, PALE, a * 0.5); }); }
      FG.flush(c);
    }
    function gpuDraw(c, f, X, Y, T) {
      const t = f.t, FG = FGX(), g = gpose(c, f, X, Y, T), A = g.A, AIR = g.AIR, gy = H.GY, k = g.k, RP = R * T, PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5;
      const dt = GS.lt == null ? 0 : Math.max(0, Math.min(0.1, t - GS.lt)); GS.lt = t;
      if (lastPulse !== GS.lp && lastPulse >= 0 && !fin) { GS.lp = lastPulse; if (A > 0.3) newPulse(g, T); }
      if ((fin || died) && !GS.burst) burst(g, T, died);
      simulate(g, T, dt);
      // the ripple of the scream through the air and over the floor (read back from what is drawn; before anything of ours)
      for (let kk = Math.max(0, lastPulse - 1); kk <= lastPulse; kk++) { const d = t - (P0 + kk * PER); if (d < 0 || d > 0.7 || t > TE + 0.1) continue; const q = cl(d / 0.62), rr = RP * (0.3 + 0.82 * H.ease.out(q));
        warpRing(c, X, Y, rr, gy, 0.045 * (1 - q), (1 - q) * sstep(0, 0.1, q) * 0.9);
        if (d < 0.42) warpCone(c, g.mouth[0], g.mouth[1], X, Y + T * 0.3, RP * 0.55, T * 0.05, Math.sin(cl(d / 0.42) * Math.PI) * 0.85 * A, t); }
      if (fin && !died) { const p = t - TB, q = cl(p / 0.7); if (q < 1) warpRing(c, X, Y, RF * T * 1.05 * H.ease.out(q) + 4, gy, 0.06 * (1 - q), (1 - q) * sstep(0, 0.06, q)); }
      // ---- behind the skull: its dark aura, smoke round it, the formation's knot, the mouth's hollow
      let Q = FG.begin(c, null);
      if (A > 0.01 || t < FORM + 0.3) { const fa = Math.max(A, sm(t / 0.6) * (1 - A)) * AIR;
        Q.glow(g.SX, g.SY + k * 0.15, k * 2.4, '#3B1166', 0.42 * fa); Q.glow(g.SX, g.SY, k * 1.45, '#6D28A8', (0.1 + 0.16 * g.gk) * A * AIR);
        const N = H.n(10); for (let i = 0; i < N; i++) { const cyc = (t * 0.2 + i / N + R1(seed + i) * 0.3) % 1, ang = i * 2.39996 + seed + t * 0.28 * (i % 2 ? 1 : -1), rr = k * (1.0 + 0.4 * cyc);
          Q.smoke(g.SX + Math.cos(ang) * rr * 1.05, g.SY + k * 0.05 + Math.sin(ang) * rr * 0.95 - cyc * k * 0.35, k * (0.5 + 0.4 * cyc), Math.sin(cyc * Math.PI) * 0.55 * fa, i * 1.7 + seed, SMK); } }
      for (const q of knot) { const a = Math.sin(cl(q.t / q.life) * Math.PI) * (1 - A * 0.85), r = T * q.s * (0.9 + 0.6 * q.t) * 1.25, qx = g.SX + Math.cos(q.b) * q.r * g.u * 0.8, qy = g.SY - g.u * 0.15 + Math.sin(q.b) * q.r * g.u * 0.5 + q.z * g.u * 0.3; Q.smoke(qx, qy, r, a * 0.85, q.b * 3.1, '#170A26'); Q.glow(qx, qy, r * 0.8, VIOD, a * 0.12); }
      if (t < FORM + 0.4) Q.glow(g.SX, g.SY, g.u * 1.3, VIO, 0.4 * Math.sin(cl(t / (FORM + 0.4)) * Math.PI));
      for (const p of puffs) { if (p.t < 0) continue; const q = p.t / p.life, px = H.sx(p.x), py = H.sy(p.y) - p.z * T, r = T * p.s * (0.6 + 0.8 * q) * 0.9; Q.smoke(px, py, r, Math.sin(Math.min(1, q * 3) * Math.PI / 2) * (1 - q) * 0.75 * pfAt(px, py, T, PX, PY), p.x * 3.7, p.d ? '#160A24' : '#3A2C4E'); }
      if (g.open > 0.03 && A > 0.01) { Q.smoke(g.throat[0], g.throat[1], k * 0.36 * (0.5 + g.open), 0.95 * g.open * A, seed, '#06030B'); Q.glow(g.throat[0], g.throat[1], k * 0.42, '#7B33D6', 0.55 * g.open * g.gk * A); }
      FG.flush(c);
      // ---- the skull, and the burst's shards
      if (A > 0.004) SKL().draw(c, g.SX, g.SY, k, g.pose);
      if (GS.shards.length && GS.burst) { const B = GS.burst, bx = H.sx(B.x), by = H.sy(B.y) - B.hz * T, bk = B.ku * T, L = [];
        for (const s of GS.shards) { if (s.t < 0) continue; const q = s.t / s.life; L.push({ m: s.m, R: mm3(axRot(s.ax, s.ang), s.R0), p: s.p, s: s.s, spill: sm((q - 0.55) / 0.45), glow: Math.max(0, 1 - q * 1.6) * 1.2 }); }
        SKL().drawShards(c, bx, by, bk, L, t); }
      // ---- over it: the soul fire, the cracks' bloom, the mouth's light, the scream, the wisps, the marks
      Q = FG.begin(c, null);
      if (A > 0.01) { const fa = g.fire * A * AIR, pr = 1 - 0.7 * g.drw, gk = g.gk;
        g.eyes.forEach((e, i) => { Q.glow(e[0], e[1], k * 0.66 * pr, '#5B1FA8', 0.3 * fa * (0.6 + 0.6 * gk)); Q.glow(e[0], e[1], k * 0.3 * pr, '#A46BFF', 0.45 * fa * (0.5 + 0.6 * gk)); Q.glow(e[0], e[1], k * 0.11 * pr, '#F3E8FF', 0.5 * fa * (0.4 + 0.8 * gk));
          Q.etongue(e[0], e[1] + k * 0.05, k * 0.11 * pr, k * (0.28 + 0.3 * gk) * pr, -g.pose.roll, '#8B4DFF', 0.65 + 0.35 * gk, 0.38 * fa, seed + i * 3.3); });
        Q.glow(g.SX, g.SY - k * 0.5, k * 1.15, '#7A3CD0', 0.1 * g.crack * (0.5 + gk) * A);
        if (g.open > 0.03) { Q.glow(g.mouth[0], g.mouth[1], k * 0.6 * (0.4 + g.open), '#8E4BFF', 0.42 * g.open * gk * A); Q.glow(g.mouth[0], g.mouth[1], k * 0.2, PALE, 0.42 * g.open * gk * A); } }
      // the scream in the air: soft shells thrown from the mouth, widening and sinking toward the floor, a faint cone of light under them
      for (let kk = Math.max(0, lastPulse - 1); kk <= lastPulse; kk++) { const d = t - (P0 + kk * PER); if (d < 0 || d > 0.5 || t > TE) continue; const q = d / 0.5, a = (1 - q) * sstep(0, 0.15, q) * A * AIR;
        for (let e = 0; e < (CEL ? 3 : 2); e++) { const qe = cl(q - e * 0.14); if (qe <= 0) continue; const rr = k * (0.35 + 2.3 * H.ease.out(qe)), my = g.mouth[1] + (0.2 + 1.3 * qe) * k; lring(Q, g.mouth[0], my, rr, 0.34, k * (0.18 + 0.12 * qe), '#7C3AED', a * (0.5 - e * 0.13)); lring(Q, g.mouth[0], my, rr, 0.34, k * 0.05, PALE, a * (0.42 - e * 0.1)); }
        if (d < 0.35) { const ca = Math.sin(cl(d / 0.35) * Math.PI) * A * AIR; for (let j = -2; j <= 2; j++) { const ex = X + j * RP * 0.32, ey = Y + T * 0.1; Q.beam(g.mouth[0], g.mouth[1], ex, ey, k * 0.42, VIOD, ca * 0.12); } } }
      // the sparks: aimed ones as ghostly wisps streaming to their monster, a bright head; free ones as dark motes
      for (const s of sparks) { if (s.t < 0) continue; const hx2 = H.sx(s.x), hy2 = H.sy(s.y) - s.z * T, fade = (s.free ? 1 - sstep(s.life - 0.15, s.life, s.t) : s.done ? 1 - cl((s.t - s.end) / 0.12) : 1) * AIR;
        s.wt = s.wt || []; if (s.wtT !== t) { s.wtT = t; s.wt.push([hx2, hy2]); if (s.wt.length > (s.free ? 5 : 10)) s.wt.shift(); }
        const pts = s.wt.map((p, i) => { const n = s.wt.length, v = i / Math.max(1, n - 1), o = Math.sin(i * 1.4 + t * 19 + s.ph) * T * 0.07 * (1 - v); return [p[0] + o, p[1] + o * 0.5]; });
        if (s.free) { chain(Q, pts, T * 0.12, VIOD, fade * 0.5, v => 0.3 + 0.7 * v); Q.smoke(hx2, hy2, T * 0.1, 0.55 * fade, s.ph, SMK); Q.glow(hx2, hy2, T * 0.16, VIO, 0.35 * fade); continue; }
        chain(Q, pts, T * 0.34, '#5B21B6', fade * 0.3, v => 0.25 + 0.75 * v); chain(Q, pts, T * 0.09, '#D8B4FE', fade * 0.6, v => 0.3 + 0.7 * v);
        Q.glow(hx2, hy2, T * 0.34, '#8B5CF6', 0.5 * fade); Q.glow(hx2, hy2, T * 0.11, '#F5EDFF', 0.7 * fade); }
      // ash (Celestial), the particles, the shards' glow
      for (const a of ash) { const ax = H.sx(a.x), ay = H.sy(a.y) - a.z * T, al = Math.sin(cl(a.t / a.life) * Math.PI) * 0.65 * pfAt(ax, ay, T, PX, PY); Q.smoke(ax, ay, Math.max(1.5, a.s * T * 1.6), al, a.r, '#2E2440'); }
      drawParts(Q, T, AIR);
      if (GS.burst && GS.shards.length) { const B = GS.burst, bx = H.sx(B.x), by = H.sy(B.y) - B.hz * T, bk = B.ku * T; for (const s of GS.shards) { if (s.t < 0) continue; const q = s.t / s.life, sx2 = bx + s.p[0] * bk, sy2 = by + (s.p[1] * 0.27 - s.p[2] * 0.96) * bk; Q.glow(sx2, sy2, bk * 0.32 * s.s, VIO, 0.3 * (1 - q)); } }
      // the finisher in the air: a hot core, soft violet rays, a ring rushing out round the pet
      if (fin && !died) { const p = t - TB, bx = H.sx(me.x), by = H.sy(me.y) - T * 0.6, fl = Math.max(0, 1 - p / 0.3), B = GS.burst, sx0 = B ? H.sx(B.x) : bx, sy0 = B ? H.sy(B.y) - B.hz * T : by - T * 2;
        if (fl > 0) { Q.glow(bx, by, RF * T * (0.5 + 0.4 * H.ease.out(cl(p / 0.12))), '#D0AEFF', 0.42 * fl); Q.glow(bx, by, RF * T * 0.9, '#6D28A8', 0.38 * fl); Q.glow(sx0, sy0, g.u * 2.2, PALE, 0.6 * fl); Q.glow(sx0, sy0, g.u * 3.4, VIO, 0.45 * fl); }
        const ra = Math.max(0, 1 - p / 0.45); if (ra > 0) { const NR = 8 + ev; for (let i = 0; i < NR; i++) { const b = i / NR * TAU + R1(seed + i * 3) * 0.5, Lr = RF * T * (0.5 + 0.4 * R1(seed + i * 5)) * H.ease.out(cl(p / 0.22)), r0 = T * 0.6; chain(Q, [[bx + Math.cos(b) * r0, by + Math.sin(b) * r0 * 0.6], [bx + Math.cos(b) * (r0 + Lr * 0.5), by + Math.sin(b) * (r0 + Lr * 0.5) * 0.6], [bx + Math.cos(b) * (r0 + Lr), by + Math.sin(b) * (r0 + Lr) * 0.6]], T * (0.3 + 0.25 * R1(seed + i)), i % 3 ? '#9B5CFF' : PALE, 0.5 * ra, v => 1.2 - 0.7 * v); } }
        const q = cl(p / 0.55); if (q < 1) { const rr = RF * T * 1.1 * H.ease.out(q); lring(Q, bx, by, rr, 0.42, T * (0.5 + 0.4 * q), '#6D28D9', (1 - q) * 0.5 * sstep(0, 0.1, q)); lring(Q, bx, by, rr, 0.42, T * 0.12, PALE, (1 - q) * 0.5); } }
      // fear and stun on the monsters: a soft violet light over the head (the pale skull mark is laid after), motes circling a stunned one
      const marks = []; if (t < LIFE) for (const m of H.living()) { const fe = m.fearT > 0 ? Math.min(1, m.fearT / 0.3) : 0, stn = m.stun > 0 && Math.hypot(m.x - me.x, m.y - me.y) < R + m.r + 1 && t < TB + 0.8 ? Math.min(1, m.stun / 0.12) : 0; if (fe < 0.01 && stn < 0.01) continue;
        const mx = H.sx(m.x), my = H.sy(m.y) - ((m.z || 0) + (m.liftZ || 0)) * T - m.r * T * 1.25, a = AIR;
        if (stn > 0) for (let i = 0; i < 3; i++) { const b = t * 5.5 + i * TAU / 3 + m.x, ox = Math.cos(b) * m.r * T * 0.9, oy = Math.sin(b) * m.r * T * 0.28; Q.glow(mx + ox, my + oy, T * 0.16, '#8B5CF6', 0.45 * stn * a); Q.star(mx + ox, my + oy, T * 0.07, 0.8 * stn * a, PALE); }
        if (fe > 0) { const hy3 = my - T * 0.42 + Math.sin(t * 4 + m.x) * T * 0.05, hx3 = mx + Math.sin(t * 31 + m.y * 7) * T * 0.02; Q.glow(hx3, hy3, T * 0.5, '#6D28A8', 0.4 * fe * a); marks.push([hx3, hy3, fe * a]); } }
      FG.flush(c);
      if (marks.length) { const sp = fearSpr(); c.save(); for (const [mx, my, a] of marks) { const s = T * 0.62; c.globalAlpha = Math.min(1, a * 0.92); c.drawImage(sp, mx - s / 2, my - s / 2, s, s); } c.restore(); }
      f.dbg = { gpu: true, pulses: next, shards: GS.shards.length, parts: GS.parts.filter(p => p.on).length, skull: SKL().stats() };
    }
    const F = H.add({ life: LIFE, x: me.x, y: me.y, HZ: 0,
      update(dt, f) {
        const t = f.t;
        if (!me.dead) { const k = 1 - Math.exp(-dt * 7); hx += (me.x - hx) * k; hy += (me.y - hy) * k; } f.x = hx; f.y = hy;
        if (!f.HZ) f.HZ = 1.75 + 1.4 * UT;
        // the pet down: no more screams, no finisher; the skull simply crumbles
        if (me.dead && !died && t < TD) { died = true; TD = t; fin = true; f.life = Math.min(f.life, 2.0); disintegrate(f); }
        if (!died) { while (next < NP && t >= P0 + next * PER) { pulse(f, next); lastPulse = next; next++; } }
        if (!fin && t >= TB) { fin = true; finisher(f); disintegrate(f); }
        if (t > TE - 0.05 && t < TE + 0.05 && !f.closed) { f.closed = true; H.X.sfx.crack(); }
        // the crumbling frames, built one per frame once the end is near
        if (S && S.ready && t > TE - 0.4 && S.dis.length < 6) S.dis.push(dissolve(S.cran, (S.dis.length + 1) / 7, S.nzcran));
        if (S && S.ready && t > TE - 0.4 && S.dis.length >= 6 && (!S.jdis || S.jdis.length < 6)) { S.jdis = S.jdis || []; S.jdis.push(dissolve(S.jaw, (S.jdis.length + 1) / 7, S.nzjaw)); }
        // formation: the smoke knot
        if (t < FORM - 0.2 && Math.random() < dt * 30 * H.Q()) { const b = Math.random() * TAU, r = 1.4 + Math.random() * 1.2; knot.push({ b, r, z: (Math.random() - 0.5) * 1.2, t: 0, life: 0.55 + Math.random() * 0.35, sw: (Math.random() < 0.5 ? -1 : 1) * (1.5 + Math.random()), s: 0.35 + Math.random() * 0.35 }); }
        for (let i = knot.length - 1; i >= 0; i--) { const q = knot[i]; q.t += dt; q.b += q.sw * dt; q.r *= Math.exp(-dt * 2.6); if (q.t >= q.life) knot.splice(i, 1); }
        // sparks: aimed ones curve onto their monster and strike; free ones scatter and strike what they pass through
        const L = sparks.length ? H.living() : null;
        for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.t += dt; if (s.t < 0) continue;
          s.tr.push([s.x, s.y, s.z]); if (s.tr.length > 6) s.tr.shift();
          if (s.free) { s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vz -= 6 * dt; if (s.z < 0.05) { s.z = 0.05; s.vz = Math.abs(s.vz) * 0.3; }
            if (!s.done && s.z < 1.3) for (const m of L) { if (Math.hypot(m.x - s.x, m.y - s.y) < m.r + 0.2) { if (sparkHit(s, m)) { s.done = true; s.life = Math.min(s.life, s.t + 0.05); H.burst(s.x, s.y - s.z, 'spark', 4, { v: 3, life: 0.3, size: 1.5, color: [EDGE, ACC] }); } break; } }
            if (s.t >= s.life) sparks.splice(i, 1); continue; }
          const m = s.m, u = cl(s.t / s.dur), e = u * u * (3 - 2 * u), tx = m.dead ? s.lx || s.x0 : m.x, ty = m.dead ? s.ly || s.y0 : m.y; s.lx = tx; s.ly = ty;
          const mx = (s.x0 + tx) / 2 + (ty - s.y0) * s.bend * 0.25, my = (s.y0 + ty) / 2 - (tx - s.x0) * s.bend * 0.25, mz = Math.max(s.z0, 0.6) + s.up, w0 = (1 - e) * (1 - e), w1 = 2 * (1 - e) * e, w2 = e * e;
          s.x = w0 * s.x0 + w1 * mx + w2 * tx; s.y = w0 * s.y0 + w1 * my + w2 * ty; s.z = w0 * s.z0 + w1 * mz + w2 * 0.45;
          if (u >= 1 && !s.done) { s.done = true; s.end = s.t; if (sparkHit(s, m)) H.burst(tx, ty - 0.45, 'spark', 5, { v: 3.5, life: 0.3, size: 1.6, color: [EDGE, ACC] }); }
          if (s.done && s.t - s.end > 0.12) sparks.splice(i, 1); }
        for (let i = puffs.length - 1; i >= 0; i--) { const p = puffs[i]; p.t += dt; if (p.t < 0) continue; const dr = Math.exp(-(p.drag || 0.8) * dt); p.vx *= dr; p.vy *= dr; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0.05, p.z + p.vz * dt); if (p.t >= p.life) puffs.splice(i, 1); }
        for (let i = frags.length - 1; i >= 0; i--) { const q = frags[i]; q.t += dt; if (q.t < 0) continue; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz += 0.4 * dt; q.rot += q.vr * dt; if (q.t >= q.life) frags.splice(i, 1); }
        for (let i = ash.length - 1; i >= 0; i--) { const a = ash[i]; a.t += dt; a.x += a.vx * dt; a.y += a.vy * dt; a.z += a.vz * dt; a.vx *= Math.exp(-dt); a.r += dt * 2; if (a.t >= a.life) ash.splice(i, 1); }
        // the living skull sheds a little shadow from its jaw now and then
        if (t > FORM && t < TD && Math.random() < dt * (2 + ev * 0.4) * H.Q()) { const p = wp(f, (Math.random() - 0.5) * 0.9, 1.15); puffs.push({ x: p[0], y: p[1], z: p[2], vx: (Math.random() - 0.5) * 0.4, vy: 0, vz: -0.5 - Math.random() * 0.4, t: 0, life: 0.9, s: 0.25 + Math.random() * 0.2, d: 1 }); }
      },
      /* v391 U4: the GPU picture where it can be drawn, else the original 2D one (under2D / draw2D, unchanged) */
      drawUnder(c, f, X, Y, T, t) { if (gpuMode(f.t)) { try { gpuUnder(c, f, X, Y, T); return; } catch (e) { if (typeof console !== 'undefined') console.warn('Dead Scream: GPU floor', e); } } this.under2D(c, f, X, Y, T, t); },
      draw(c, f, X, Y, T, t) { if (gpuMode(f.t)) { try { gpuDraw(c, f, X, Y, T); return; } catch (e) { if (typeof console !== 'undefined') console.warn('Dead Scream: GPU draw', e); } } this.draw2D(c, f, X, Y, T, t); f.dbg = { gpu: false, pulses: next }; },
      under2D(c, f, X, Y, T, t) {
        t = f.t; const P = pulseAt(t), on = sm((t - 0.3) / 0.8) * (1 - sm((t - TD) / 0.6)), RP = R * T;
        // the aura: a single clear field of violet light round the pet, its boundary a soft rim (light only)
        if (on > 0.01) { const gk = 0.5 + 0.5 * Math.max(P.pre, P.post);
          floorSpr(c, glowSprite(ENERGY), X, Y, RP * 1.1, on * (0.1 + 0.1 * gk), true);
          floorSpr(c, bandLSpr(), X, Y, RP * 1.03, on * (0.16 + 0.14 * gk), true);
          if (CEL) floorSpr(c, bandLSpr(), X, Y, RP * 0.62, on * 0.1 * gk, true); }
        // formation: light gathering inward under the pet
        if (t < FORM + 0.2) for (let i = 0; i < 3; i++) { const q = (t * 1.3 + i / 3) % 1, rr = RP * (1.05 - 0.85 * q); floorSpr(c, bandLSpr(), X, Y, rr, 0.35 * Math.sin(q * Math.PI) * cl(t / 0.3) * (1 - sm((t - FORM) / 0.2)), true); }
        // the screams: the broad dark-purple ring; light ripples from beneath the pet (two staggered at Adept);
        // Celestial: a thick low dark wave (the band stacked a little way up, feathered)
        for (let k = Math.max(0, lastPulse - 2); k <= lastPulse; k++) { const d = t - (P0 + k * PER); if (d < 0 || d > 1.0) continue;
          const q = cl(d / 0.62); if (q < 1) { const rr = RP * (0.3 + 0.82 * H.ease.out(q)), a = (1 - q) * sstep(0, 0.12, q);
            if (CEL) { const wv = wideSpr(); for (let j = 0; j < 4; j++) { const hz = j * T * 0.12 * (1 - q * 0.5); c.save(); c.globalAlpha = a * (0.55 - j * 0.11); c.drawImage(wv, X - rr, Y - hz - rr * H.GY, rr * 2, rr * 2 * H.GY); c.restore(); } }
            floorSpr(c, bandSpr(), X, Y, rr, a * (CEL ? 0.85 : 0.7));
            floorSpr(c, bandLSpr(), X, Y - (CEL ? T * 0.36 * (1 - q * 0.5) : 0), rr * 0.995, a * (CEL ? 0.55 : 0.4), true); }
          for (let j = 0; j < (ADE ? 2 : 1); j++) { const q2 = cl((d - j * 0.16) / 0.75); if (q2 <= 0 || q2 >= 1) continue; floorSpr(c, bandLSpr(), X, Y, RP * 0.75 * H.ease.out(q2) + 3, (1 - q2) * 0.5 * sstep(0, 0.1, q2), true); } }
        // the finisher on the floor: a flash, a violet-black shockwave, light rings after it
        if (fin && !died) { const p = t - TB, RR = RF * T; floorSpr(c, glowSprite(ACC), X, Y, RR * 1.0, 0.5 * Math.max(0, 1 - p / 0.35), true); floorSpr(c, glowSprite(ENERGY), X, Y, RR * 1.3, 0.35 * Math.max(0, 1 - p / 0.7), true);
          const waves = CEL ? [[0, 1.05, 1, 0], [0.08, 1.25, 0.7, 1], [0.2, 1.5, 0.5, 1]] : ADE ? [[0, 1.05, 1, 0], [0.1, 1.25, 0.7, 1]] : [[0, 1.0, 1, 0], [0.12, 1.15, 0.6, 1]];
          for (const [d, sc, w, Lt] of waves) { const q = cl((p - d) / 0.7); if (q > 0 && q < 1) floorSpr(c, Lt ? bandLSpr() : bandSpr(), X, Y, RR * sc * H.ease.out(q) + 4, (1 - q) * w * sstep(0, 0.08, q), !!Lt); } }
      },
      draw2D(c, f, X, Y, T, t) {
        t = f.t; const SC = scr(c), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5, P = pulseAt(t), u = HS * T / 2.6;   // u: px per skull unit
        // the skull's sprites at its size on this screen (built once, cached)
        const want = Math.max(96, Math.min(480, Math.round(BW * u * SC.k / 24) * 24)); if (!S || PXk !== want) { S = skullFor(want, ev, seed); PXk = want; } if (!S.ready) S.step(t > 0.6 ? 1e9 : 5);
        // its height: the chin clearly over the pet's head; the dome under the HUD band
        const chin = 1.42 * u, top = 1.32 * u, hzW = (T * 1.75 + chin) / T, room = (Y - (SC.y0 + T * 2.6) - top) / T; f.HZ = Math.max(hzW, Math.min(hzW + 0.5, room));
        const end = t > TE ? 1 : 0, close = sm((t - TE) / 0.25), draw = sm((t - TE - 0.05) / 0.4);
        const form = sm((t - 0.55) / 0.5), fill = sm((t - 0.62) / 0.45), dis = t >= TD ? cl((t - TD) / 0.9) : 0, alive = (1 - dis);
        const jolt = P.post * (P.d >= 0 && P.d < 0.3 ? 1 : 0), shiv = T * 0.018 * (1 + 2 * jolt + 1.5 * close * (1 - dis));
        const tilt = 0.06 * Math.sin(t * 0.55 + seed) + 0.025 * Math.sin(t * 1.7) + 0.012 * Math.sin(t * 23) * (1 + jolt);
        const SX = X + (Math.sin(t * 47) + Math.sin(t * 31.7)) * shiv * 0.5, SY = Y - f.HZ * T + Math.sin(t * 1.3) * T * 0.05 + (Math.sin(t * 41) + Math.sin(t * 29.3)) * shiv * 0.4 - jolt * u * 0.05;
        const scl = (0.86 + 0.14 * form) * (1 + 0.045 * jolt - 0.02 * P.pre) * (1 + 0.04 * close);
        const open = (1 - close) * P.open * (t >= FORM ? 1 : 0), gk = (t < TE ? 0.25 + 0.75 * Math.max(P.pre, P.post) : (1 - draw)) * (1 - dis);
        const hpf = 0.3 + 0.7 * sstep(0.1 * T, 1.0 * T, (PY - SY) - chin * 0.9);   // (it never comes down onto the pet; this only guards a squeezed screen)
        const k = u / S.s * scl;   // sprite px -> screen px
        const AIR = cl((f.life) / 0.5);
        // the smoke knot of the formation
        if (knot.length) { const sp = dpuffSpr(); c.save(); for (const q of knot) { const a = Math.sin(cl(q.t / q.life) * Math.PI) * (1 - fill * 0.85), r = T * q.s * (0.8 + 0.5 * q.t), qx = SX + Math.cos(q.b) * q.r * u * 0.8, qy = SY - u * 0.15 + Math.sin(q.b) * q.r * u * 0.5 + q.z * u * 0.3; c.globalAlpha = a * 0.9; c.drawImage(sp, qx - r, qy - r, r * 2, r * 2); } c.restore(); }
        // shadow drifting down, smoke rising (behind the skull)
        { const sp = dpuffSpr(), lp = puffSpr(); c.save(); for (const p of puffs) { if (p.t < 0) continue; const q = p.t / p.life, px = H.sx(p.x), py = H.sy(p.y) - p.z * T, r = T * p.s * (0.6 + 0.8 * q); c.globalAlpha = Math.sin(Math.min(1, q * 3) * Math.PI / 2) * (1 - q) * 0.8 * pfAt(px, py, T, PX, PY); c.drawImage(p.d ? sp : lp, px - r, py - r, r * 2, r * 2); } c.restore(); }
        const A0 = Math.max(form * 0.9, fill) * alive * hpf;
        if (A0 > 0.01 || (t < FORM + 0.3)) {
          // the air darkened round it and a restrained violet bloom
          c.save(); c.globalAlpha = Math.min(1, (0.25 + 0.6 * fill) * alive * hpf); c.drawImage(airSpr(), SX - u * 1.9, SY - u * 1.85, u * 3.8, u * 3.6); c.restore();
          glow(c, SX, SY + u * 0.2, u * (1.6 + 0.3 * gk), ENERGY, (0.08 + 0.18 * gk) * A0);
          // Adept: a fragmented thin halo behind; Celestial: broken obsidian segments turning, two broken rings
          { const hcY = SY - u * 0.18, sq = 0.96, ha = A0 * sm((t - 0.75) / 0.6);
            // the lines shiver all the time, harder as it gathers and screams; each scream also throws copies of them outward that fade (the sound leaving)
            const vib = i => u * (0.014 + 0.05 * jolt + 0.016 * P.pre) * (Math.sin(t * 53 + i * 2.1) + 0.6 * Math.sin(t * 37.3 + i * 4.7)), push = 1 + 0.07 * jolt - 0.03 * P.pre;
            if (ha > 0.01) { c.save(); c.translate(SX, hcY); c.rotate(tilt * 0.5); c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter';
              for (let pk = Math.max(0, lastPulse - 1); pk <= lastPulse; pk++) { const d = t - (P0 + pk * PER); if (d < 0 || d > 0.55 || t > TE + 0.1) continue;
                for (let e = 0; e < (CEL ? 2 : 1); e++) { const q = cl((d - e * 0.09) / 0.46); if (q <= 0 || q >= 1) continue; const es = 1.05 + (CEL ? 1.0 : 0.85) * H.ease.out(q), ea = ha * Math.pow(1 - q, 1.4) * sstep(0, 0.12, q) * (e ? 0.6 : 1);
                  for (const rg of BR) { const ro = t * rg.sp + (pk % 2 ? 0.2 : -0.2) * q; let i = 0; for (const sg of rg.segs) { i++; const rr = rg.r * u * es + vib(i * 3 + pk), ww = rg.w * u * (1 + 0.8 * q);
                    crescent(c, 0, 0, rr, sq, sg[0] + ro, sg[1] + ro, ww * 3.4, 18); c.globalAlpha = ea * 0.3; c.fillStyle = ENERGY; c.fill();
                    crescent(c, 0, 0, rr, sq, sg[0] + ro + 0.03, sg[1] + ro - 0.03, ww, 18); c.globalAlpha = ea * 0.85; c.fillStyle = EDGE; c.fill(); } }
                  if (HAL) for (const hs of halo) { const a0 = hs.a + t * hs.sp, rr = hs.r * u * (es * 0.92 + 0.08) + vib(hs.a * 9), ww = hs.w * u * 0.45 * (1 + 0.5 * q);
                    crescent(c, 0, 0, rr, sq, a0 - 0.04, a0 + hs.span + 0.04, ww * 3, 20); c.globalAlpha = ea * 0.28; c.fillStyle = ENERGY; c.fill();
                    crescent(c, 0, 0, rr + ww * 0.3, sq, a0 + 0.04, a0 + hs.span - 0.04, Math.max(0.8, ww * 0.4), 18); c.globalAlpha = ea * 0.8; c.fillStyle = EDGE; c.fill(); } } }
              c.globalCompositeOperation = 'source-over';
              let vi = 0; for (const rg of rings) { const ro = t * rg.sp; c.globalCompositeOperation = 'lighter'; for (const sg of rg.segs) { const rR = rg.r * u * push + vib(vi++); crescent(c, 0, 0, rR, sq, sg[0] + ro, sg[1] + ro, rg.w * u * 3.2, 18); c.globalAlpha = ha * (0.24 + 0.16 * gk); c.fillStyle = ENERGY; c.fill(); crescent(c, 0, 0, rR, sq, sg[0] + ro, sg[1] + ro, rg.w * u, 18); c.globalAlpha = ha * (0.7 + 0.3 * gk); c.fillStyle = EDGE; c.fill(); crescent(c, 0, 0, rR, sq, sg[0] + ro + 0.04, sg[1] + ro - 0.04, Math.max(0.8, rg.w * u * 0.3), 14); c.globalAlpha = ha * 0.7 * (0.5 + 0.5 * gk); c.fillStyle = ACC; c.fill(); } }
              for (const hs of halo) { const a0 = hs.a + t * hs.sp, a1 = a0 + hs.span, rr = hs.r * u * push + vib(vi++ + 7) * 0.7, ww = hs.w * u;
                c.globalCompositeOperation = 'lighter'; crescent(c, 0, 0, rr, sq, a0 - 0.06, a1 + 0.06, ww * 2.4, 22); c.globalAlpha = ha * (0.12 + 0.12 * gk); c.fillStyle = ENERGY; c.fill();
                c.globalCompositeOperation = 'source-over'; crescent(c, 0, 0, rr, sq, a0, a1, ww, 22); c.globalAlpha = ha * 0.95; c.fillStyle = BODY; c.fill();
                crescent(c, 0, 0, rr - ww * 0.14, sq, a0 + 0.03, a1 - 0.03, ww * 0.5, 18); c.globalAlpha = ha * 0.8; c.fillStyle = PLUM; c.fill();
                c.globalCompositeOperation = 'lighter'; crescent(c, 0, 0, rr + ww * 0.36, sq, a0 + 0.02, a1 - 0.02, Math.max(1, ww * 0.16), 18); c.globalAlpha = ha * (0.6 + 0.4 * gk); c.fillStyle = EDGE; c.fill();
                crescent(c, 0, 0, rr - ww * 0.3, sq, a0 + 0.1, a1 - 0.1, Math.max(0.7, ww * 0.07), 14); c.globalAlpha = ha * 0.35 * (0.5 + gk); c.fillStyle = ACC; c.fill(); }
              c.restore(); } }
          // the skull: the mouth's hollow and its light behind the teeth, the jaw (lowered on the pulse), the cranium
          c.save(); c.translate(SX, SY); c.rotate(tilt); c.scale(k, k);
          const ox = -S.W / 2, oy = -S.oy, s = S.s, fa = fill * alive * hpf;
          const di = dis > 0 ? Math.min(5, Math.floor(dis * 6.99) - 1) : -1, cranImg = di >= 0 && S.dis[di] ? S.dis[di] : S.cran, jawImg = di >= 0 && S.jdis && S.jdis[di] ? S.jdis[di] : S.jaw;
          const disA = di >= 0 ? (di >= 5 ? 1 - cl((dis - 0.86) / 0.14) : 1) : 1;
          if (fa > 0.01 && S.ready) {
            const mo = open * 0.24 * s;
            c.globalAlpha = fa * Math.min(1, 0.6 + open); c.drawImage(mouthSpr(), -0.42 * s, (0.9 + 0.12 * open) * s - (0.07 + 0.16 * open) * s, 0.84 * s, (0.14 + 0.32 * open) * s);
            c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, fa * (0.25 + 0.75 * gk) * (0.5 + 0.5 * open)); c.drawImage(glowSprite(EDGE), -0.36 * s, (0.97 + 0.12 * open) * s - (0.07 + 0.12 * open) * s, 0.72 * s, (0.14 + 0.24 * open) * s);
            c.globalAlpha = Math.min(1, fa * gk * 0.8 * open); c.drawImage(glowSprite(ACC), -0.2 * s, (0.98 + 0.12 * open) * s - 0.06 * s, 0.4 * s, 0.12 * s); c.globalCompositeOperation = 'source-over';
            c.globalAlpha = fa * disA; c.drawImage(jawImg, ox, oy + mo); c.drawImage(cranImg, ox, oy);
            // the crack light: a breath, the pulse; Celestial: bands of light travelling through them
            c.globalCompositeOperation = 'lighter'; const ck = (ADE ? 0.35 : 0.25) + 0.55 * gk + 0.3 * (1 - fill) * form; c.globalAlpha = Math.min(1, fa * disA * ck); c.drawImage(S.crack, ox, oy);
            if (ADE && dis < 0.3) { const nb = CEL ? 3 : 1; for (const cr of S.cracks) { const P2 = cr.pts; for (let b = 0; b < nb; b++) { const uu = ((t * (CEL ? 0.55 : 0.35) + cr.ph + b / nb) % 1), fpos = uu * (P2.length - 1), i0 = Math.floor(fpos), e = fpos - i0, p0 = P2[i0], p1 = P2[Math.min(P2.length - 1, i0 + 1)], bx = lerp(p0[0], p1[0], e) * s, by = lerp(p0[1], p1[1], e) * s, ba = Math.sin(uu * Math.PI);
              c.globalAlpha = Math.min(1, fa * ba * (CEL ? 0.75 : 0.5) * (0.6 + 0.4 * gk)); c.drawImage(glowSprite(EDGE), bx - 0.07 * s, by - 0.07 * s, 0.14 * s, 0.14 * s); if (CEL) { c.globalAlpha = Math.min(1, fa * ba * 0.6); c.drawImage(glowSprite(ACC), bx - 0.03 * s, by - 0.03 * s, 0.06 * s, 0.06 * s); } } } }
            // the socket light: restrained at rest, gathering before the scream; at the end it draws inward
            const sl = (0.22 + 0.6 * gk) * fa * disA * (1 - 0.6 * draw); c.globalAlpha = Math.min(1, sl); c.drawImage(S.light, ox, oy);
            for (const sx0 of [-0.37, 0.37]) { const pr = 1 - 0.75 * draw; c.globalAlpha = Math.min(1, fa * disA * (0.06 + 0.34 * gk + 0.6 * draw * (1 - draw) * 2)); c.drawImage(glowSprite(EDGE), sx0 * s - 0.17 * s * pr, 0.23 * s - 0.15 * s * pr, 0.34 * s * pr, 0.3 * s * pr); c.globalAlpha = Math.min(1, fa * disA * (0.1 + 0.45 * gk * gk + 0.5 * draw)); c.drawImage(glowSprite(ACC), sx0 * s - 0.05 * s * pr, 0.25 * s - 0.045 * s * pr, 0.1 * s * pr, 0.09 * s * pr); }
            c.globalCompositeOperation = 'source-over'; }
          c.restore();
          // the contour that sketches the skull (the dome, then cheekbones and sockets, then the jaw), fading as it fills
          if (t < FORM + 0.25) { const fo = 1 - sm((t - 0.85) / 0.35), sk = (a, b2) => sm((t - a) / (b2 - a));
            const tr = (ux, uy) => { const co = Math.cos(tilt), si = Math.sin(tilt), x = ux * u * scl, y = uy * u * scl; return [SX + x * co - y * si, SY + x * si + y * co]; };
            const arc = (cx, cy, rx, ry, a0, a1, uu) => { const pts = [], n = 28; for (let i = 0; i <= n; i++) { const b = lerp(a0, lerp(a0, a1, uu), i / n); pts.push(tr(cx + Math.cos(b) * rx, cy + Math.sin(b) * ry)); } return pts; };
            const lines = []; const u1 = sk(0.2, 0.55), u2 = sk(0.4, 0.75), u3 = sk(0.55, 0.88);
            if (u1 > 0) { lines.push(arc(0, -0.3, 1.0, 0.95, -Math.PI / 2, -Math.PI / 2 - 2.1, u1)); lines.push(arc(0, -0.3, 1.0, 0.95, -Math.PI / 2, -Math.PI / 2 + 2.1, u1)); }
            if (u2 > 0) { for (const sx0 of [-1, 1]) { lines.push(arc(sx0 * 0.37, 0.21, 0.27, 0.24, -Math.PI / 2, -Math.PI / 2 + sx0 * TAU, u2)); lines.push(arc(sx0 * 0.5, 0.45, 0.28, 0.22, sx0 > 0 ? -0.5 : Math.PI + 0.5, sx0 > 0 ? 1.6 : Math.PI - 1.6, u2)); } lines.push(arc(0, 0.5, 0.1, 0.14, -Math.PI / 2, Math.PI * 1.5, u2)); }
            if (u3 > 0) { const jaw = [[-0.66, 0.6], [-0.62, 0.92], [-0.48, 1.16], [-0.24, 1.3], [0, 1.33], [0.24, 1.3], [0.48, 1.16], [0.62, 0.92], [0.66, 0.6]], n = Math.max(2, Math.round(jaw.length * u3)), mid = 4, lo = Math.max(0, mid - Math.ceil(n / 2)), hi = Math.min(jaw.length - 1, mid + Math.ceil(n / 2)); lines.push(jaw.slice(lo, hi + 1).map(p => tr(p[0], p[1] + open * 0.24))); }
            for (const pl of lines) { softPath(c, pl, Math.max(3, u * 0.16), ENERGY, 0.22 * fo * hpf); softPath(c, pl, Math.max(1.6, u * 0.055), EDGE, 0.5 * fo * hpf); softPath(c, pl, Math.max(1, u * 0.022), ACC, 0.55 * fo * hpf); }
            glow(c, SX, SY, u * 1.2, ENERGY, 0.35 * Math.sin(cl(t / FORM) * Math.PI) * hpf); }
          // the scream itself in the air: shells of dark energy thrown from the mouth
          for (let kk = Math.max(0, lastPulse - 1); kk <= lastPulse; kk++) { const d = t - (P0 + kk * PER); if (d < 0 || d > 0.45 || t > TE) continue; const q = d / 0.45, mx = SX, my = SY + (1.15 + 0.5 * q) * u * scl, rr = u * (0.45 + 1.7 * H.ease.out(q)), a = (1 - q) * sstep(0, 0.15, q) * A0;
            c.save(); c.globalAlpha = Math.min(1, a * 0.4); c.drawImage(bandSpr(), mx - rr, my - rr * 0.32, rr * 2, rr * 0.64); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * 0.35); c.drawImage(bandLSpr(), mx - rr * 0.92, my - rr * 0.3, rr * 1.84, rr * 0.6); c.restore(); }
        }
        // the sparks: thin jagged streaks, a hot head
        if (sparks.length) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
          for (const s of sparks) { if (s.t < 0 || s.tr.length < 2) continue; const fade = s.free ? 1 - sstep(s.life - 0.15, s.life, s.t) : s.done ? 1 - cl((s.t - s.end) / 0.12) : 1; const pts = s.tr.map((p, i) => { const j = (i && i < s.tr.length - 1) ? (R1(s.ph + i * 3.1 + Math.floor(t * 30)) - 0.5) * T * 0.18 : 0; return [H.sx(p[0]) + j, H.sy(p[1]) - p[2] * T + j * 0.6]; });
            pts.push([H.sx(s.x), H.sy(s.y) - s.z * T]); const hx2 = pts[pts.length - 1][0], hy2 = pts[pts.length - 1][1], pf = pfAt(hx2, hy2, T, PX, PY) * fade * AIR;
            for (let i = 1; i < pts.length; i++) { const v = i / (pts.length - 1); c.globalAlpha = pf * 0.22 * v; c.strokeStyle = ENERGY; c.lineWidth = Math.max(1.5, T * 0.07 * v); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); c.globalAlpha = pf * 0.9 * v; c.strokeStyle = v > 0.6 ? ACC : EDGE; c.lineWidth = Math.max(0.8, T * 0.03 * v); c.stroke(); }
            c.globalAlpha = pf * 0.8; c.drawImage(glowSprite(EDGE), hx2 - T * 0.16, hy2 - T * 0.16, T * 0.32, T * 0.32); c.globalAlpha = pf; c.drawImage(glowSprite(ACC), hx2 - T * 0.06, hy2 - T * 0.06, T * 0.12, T * 0.12); }
          c.restore(); }
        // the disintegration: fragments of the skull rising, tumbling, fading
        if (frags.length) { c.save(); for (const q of frags) { if (q.t < 0) continue; const qx = H.sx(q.x), qy = H.sy(q.y) - q.z * T, a = (1 - sm((q.t - q.life * 0.5) / (q.life * 0.5))) * pfAt(qx, qy, T, PX, PY), sz = q.s * T; if (a < 0.02) continue;
          c.save(); c.translate(qx, qy); c.rotate(q.rot); c.globalAlpha = a; c.beginPath(); c.moveTo(sz, 0); c.lineTo(-sz * 0.6, sz * 0.55); c.lineTo(-sz * 0.45, -sz * 0.5); c.closePath(); c.fillStyle = BODY; c.fill(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.35; c.drawImage(glowSprite(EDGE), -sz * 1.4, -sz * 1.4, sz * 2.8, sz * 2.8); c.restore(); } c.restore(); }
        // the finisher in the air: a hot core, violet rays, a dark ring rushing out round the pet
        if (fin && !died) { const p = t - TB, bx = H.sx(me.x), by = H.sy(me.y) - T * 0.6, fl = Math.max(0, 1 - p / 0.3);
          if (fl > 0) { glow(c, bx, by, RF * T * (0.5 + 0.4 * H.ease.out(cl(p / 0.12))), ACC, 0.45 * fl); glow(c, bx, by, RF * T * 0.9, ENERGY, 0.4 * fl); }
          const ra = Math.max(0, 1 - p / 0.45); if (ra > 0) { const NR = 8 + ev; for (let i = 0; i < NR; i++) { const b = i / NR * TAU + R1(seed + i * 3) * 0.5, Lr = RF * T * (0.5 + 0.4 * R1(seed + i * 5)) * H.ease.out(cl(p / 0.22)), r0 = T * 0.7; H.ray(c, bx + Math.cos(b) * r0, by + Math.sin(b) * r0 * 0.6, b, Lr, T * (0.2 + 0.2 * R1(seed + i)), i % 3 ? EDGE : ACC, 0.45 * ra); } }
          const q = cl(p / 0.55); if (q < 1) { const rr = RF * T * 1.1 * H.ease.out(q), ry = rr * 0.42; c.save(); c.globalAlpha = (1 - q) * 0.7 * sstep(0, 0.1, q); c.drawImage(bandSpr(), bx - rr, by - ry, rr * 2, ry * 2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - q) * 0.5; c.drawImage(bandLSpr(), bx - rr * 0.9, by - ry * 0.9, rr * 1.8, ry * 1.8); c.restore(); } }
        // ash (Celestial): fine flakes drifting
        if (ash.length) { c.save(); for (const a of ash) { const ax = H.sx(a.x), ay = H.sy(a.y) - a.z * T, al = Math.sin(cl(a.t / a.life) * Math.PI) * 0.7 * pfAt(ax, ay, T, PX, PY), s = Math.max(1, a.s * T); c.globalAlpha = al; c.fillStyle = a.r % 2 > 1 ? '#5A4870' : '#2E2440'; c.fillRect(ax - s / 2, ay - s * 0.3 * Math.abs(Math.cos(a.r)) - 0.5, s, Math.max(0.8, s * 0.6 * Math.abs(Math.cos(a.r)))); } c.restore(); }
        void end;
      } });
    void F;
  };
  Object.defineProperty(U.deadscream, 'skull', { get: () => DEADSCREAM_SKULL });   // (v391 U4: the model, for tests and studio renders)
})();
