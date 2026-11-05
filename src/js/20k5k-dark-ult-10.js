/* ---------- Dark, new: Dead Scream ----------
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
    const R = (3.0 + 0.27 * (ev - 1)) * K, RF = R * 1.15, HS = [2.0, 2.15, 2.3, 2.55, 2.85, 3.2, 3.9][ev - 1], UT = HS / 2.6;   // UT: tiles per skull unit
    const TOT = [14, 16.7, 19.3, 22, 25.3, 28.7, 32][ev - 1] * DK, NS = CEL ? 3 : ADE ? 2 : 1, PD = TOT * 0.8 / NP, SPK = TOT * 0.2 / (NP * NS), FIN = 4 * DK, STUN = 0.32, FEAR = 1.0;
    const NFREE = CEL ? 14 : ADE ? 9 : 6, seed = Math.floor(Math.random() * 1000);
    const HAL = CEL ? 6 : 0, HRING = ADE ? (CEL ? 2 : 1) : 0;
    const halo = []; for (let i = 0; i < HAL; i++) halo.push({ a: i / HAL * TAU + R1(seed + i) * 0.4, span: 0.55 + 0.3 * R1(seed + i * 3.1), r: 1.62 + 0.12 * R1(seed + i * 5.3), w: 0.16 + 0.07 * R1(seed + i * 2.3), sp: 0.12 * (i % 2 ? 1 : 0.8) });
    const rings = []; for (let j = 0; j < HRING; j++) { const n = j ? 9 : 7, segs = []; for (let i = 0; i < n; i++) { const a0 = i / n * TAU + R1(seed + j * 40 + i) * 0.25, sp = TAU / n * (0.45 + 0.35 * R1(seed + j * 17 + i)); segs.push([a0, a0 + sp]); } rings.push({ r: j ? 1.98 : 1.45, sp: j ? -0.09 : 0.16, segs, w: j ? 0.04 : 0.06 }); }
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
      drawUnder(c, f, X, Y, T, t) {
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
      draw(c, f, X, Y, T, t) {
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
          if (HRING || HAL) { const hcY = SY - u * 0.18, sq = 0.96, ha = A0 * sm((t - 0.75) / 0.6);
            if (ha > 0.01) { c.save(); c.translate(SX, hcY); c.rotate(tilt * 0.5); c.lineJoin = 'round';
              for (const rg of rings) { const ro = t * rg.sp; c.globalCompositeOperation = 'lighter'; for (const sg of rg.segs) { crescent(c, 0, 0, rg.r * u, sq, sg[0] + ro, sg[1] + ro, rg.w * u * 3.2, 18); c.globalAlpha = ha * (0.24 + 0.16 * gk); c.fillStyle = ENERGY; c.fill(); crescent(c, 0, 0, rg.r * u, sq, sg[0] + ro, sg[1] + ro, rg.w * u, 18); c.globalAlpha = ha * (0.7 + 0.3 * gk); c.fillStyle = EDGE; c.fill(); crescent(c, 0, 0, rg.r * u, sq, sg[0] + ro + 0.04, sg[1] + ro - 0.04, Math.max(0.8, rg.w * u * 0.3), 14); c.globalAlpha = ha * 0.7 * (0.5 + 0.5 * gk); c.fillStyle = ACC; c.fill(); } }
              for (const hs of halo) { const a0 = hs.a + t * hs.sp, a1 = a0 + hs.span, rr = hs.r * u, ww = hs.w * u;
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
})();
