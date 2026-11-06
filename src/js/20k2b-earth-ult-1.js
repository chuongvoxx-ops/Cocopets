/* ---------- Earth, reworked: Shockwave Trampoline ----------
   The pet itself bounces with crushing weight: a crouch, a quick stretched launch, a brief ease at the apex, an
   accelerating fall and a heavy squashing landing, its arms flung up and its feet dangling as it flies (the pet's own
   rig, through the small hooks me.z / me.hopSq / me.hopArm / me.hopFoot in 20b and 12-arcade). Every landing sends one
   travelling shockwave across the floor from where the pet came down: a small bright amber contact core, a thick
   expanding ring of lifted stone chips (real shaded 3D rock chips, rendered once per shape and turn), pale golden
   pressure ripples and hairline cracks lighting through the ground behind the leading edge, and a low dust sheet that
   follows the ring and settles. The centre stays clear for the next jump.
   Jumps: 3 at level 1, 3, 4, 5 at Adept, 5, 6, 7 at Celestial, ~0.75 s apart; the final jump crouches longer, flies
   twice as high, hangs a moment at its apex and comes down hardest: a 1.3x wider wave, heavier chips and the strongest
   hit. Reach 3 / 3.75 / 4.5 tiles x K (levels between interpolate). Adept: wedge-shaped stone plates (textured, lit 3D
   slabs hinged in the floor) lift at the moving front and fall back; Celestial: two rings of plates, and successive
   impacts build a layered amber fracture web that fades after the final ring has passed.
   The wave is drawn as the floor ellipse (y squashed by GY) and hits by that same shape: a monster takes its one hit
   from a wave the moment the drawn front reaches its feet. Damage (DK = base x K x (1 + 0.08 (evo - 1))), for a monster
   inside the reach for the whole cast: 13 / 14 / 14 x DK at levels 1 / 4 / 7 (13, 17.4, 20.7 x base x K), split over
   the waves with the final wave weighing 2.2 normal ones (stun 0.6, knockback); the others stagger briefly.
   No invulnerability, no change of targeting: the pet keeps moving by the game's own rules and each wave starts where
   it lands. Floor marks are light only and fade; everything heavy is a cached sprite. */
(() => {
  const U = ELEM_IMPL.earth.ult; delete U.cathedral;
  const TAU = Math.PI * 2;
  const DEEP = '#2A2118', CHAR = '#3A3028', UMBER = '#5C4126', EARTH = '#7A5218', AMBER = '#D98A1E', GOLD = '#F2B73A', HONEY = '#FFCF5C', PALE = '#FFE9B8', EMBER = '#FFF4D6';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const HT = (() => { const a = new Float32Array(4096); for (let i = 0; i < 4096; i++) a[i] = R1(i * 1.618 + 0.5); return a; })();
  const hash2 = (i, j) => HT[((i * 73856093) ^ (j * 19349663)) & 4095];
  function vnoise(x, y, p) { let i = Math.floor(x), j = Math.floor(y); const fx = x - i, fy = y - j, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    let i1 = i + 1, j1 = j + 1; if (p) { i = ((i % p) + p) % p; j = ((j % p) + p) % p; i1 = ((i1 % p) + p) % p; j1 = ((j1 % p) + p) % p; }
    const a = hash2(i, j), b = hash2(i1, j), c = hash2(i, j1), d = hash2(i1, j1); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; }
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  let H;

  /* ---- cached soft sprites ---- */
  const BWS = [0.05, 0.09, 0.15, 0.24, 0.38];   // band thickness buckets (of the radius)
  // e: the leading edge (additive amber to pale gold), r: a pressure ripple (additive, symmetric), d: the dust sheet (normal)
  const bandSpr = (kind, b) => fxSprite('etrb' + kind + b, 320, 320, g => { const w = BWS[b], gr = g.createRadialGradient(160, 160, 0, 160, 160, 160);
    const S = kind === 'e' ? [[0, 'rgba(217,128,24,0)'], [1 - w, 'rgba(217,128,24,0)'], [1 - 0.62 * w, 'rgba(217,128,24,0.35)'], [1 - 0.32 * w, 'rgba(240,170,50,0.85)'], [1 - 0.16 * w, 'rgba(255,214,120,0.95)'], [1 - 0.05 * w, 'rgba(242,170,50,0.35)'], [1, 'rgba(242,170,50,0)']]
      : kind === 'r' ? [[0, 'rgba(230,150,40,0)'], [1 - w, 'rgba(230,150,40,0)'], [1 - 0.7 * w, 'rgba(230,150,40,0.25)'], [1 - 0.5 * w, 'rgba(255,214,130,0.75)'], [1 - 0.3 * w, 'rgba(230,150,40,0.25)'], [1, 'rgba(230,150,40,0)']]
      : [[0, 'rgba(120,92,62,0)'], [1 - w, 'rgba(120,92,62,0)'], [1 - 0.72 * w, 'rgba(120,92,62,0.22)'], [1 - 0.45 * w, 'rgba(170,134,92,0.5)'], [1 - 0.2 * w, 'rgba(200,166,118,0.42)'], [1 - 0.06 * w, 'rgba(214,184,138,0.12)'], [1, 'rgba(214,184,138,0)']];
    S.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 320, 320); });
  // a dust puff, lit from the upper left (warm tan, darker umber below)
  const puffSpr = () => fxSprite('etrpuff', 64, 64, g => { let gr = g.createRadialGradient(32, 34, 0, 32, 34, 30); gr.addColorStop(0, 'rgba(110,82,54,0.55)'); gr.addColorStop(0.55, 'rgba(110,82,54,0.28)'); gr.addColorStop(1, 'rgba(110,82,54,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    gr = g.createRadialGradient(25, 24, 0, 28, 28, 24); gr.addColorStop(0, 'rgba(232,206,160,0.6)'); gr.addColorStop(0.5, 'rgba(200,166,118,0.3)'); gr.addColorStop(1, 'rgba(200,166,118,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  // the contact core: a hot white point, honey and amber round it, six soft short rays
  const coreSpr = () => fxSprite('etrcore', 128, 128, g => { g.globalCompositeOperation = 'lighter'; let gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    [[0, 'rgba(255,255,255,1)'], [0.1, 'rgba(255,244,214,0.95)'], [0.25, 'rgba(255,207,92,0.6)'], [0.5, 'rgba(217,138,30,0.22)'], [1, 'rgba(217,138,30,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 6; i++) { g.save(); g.translate(64, 64); g.rotate(i / 6 * TAU + 0.3); g.scale(1, 0.09); gr = g.createRadialGradient(0, 0, 0, 0, 0, 62); gr.addColorStop(0, 'rgba(255,233,184,0.7)'); gr.addColorStop(0.5, 'rgba(242,183,58,0.25)'); gr.addColorStop(1, 'rgba(242,183,58,0)'); g.fillStyle = gr; g.fillRect(-64, -64, 128, 128); g.restore(); } });
  // a vertical streak of light (the falls)
  const streakSpr = () => fxSprite('etrstreak', 24, 128, g => { const gx = g.createLinearGradient(0, 0, 24, 0); gx.addColorStop(0, 'rgba(242,183,58,0)'); gx.addColorStop(0.4, 'rgba(255,207,92,0.5)'); gx.addColorStop(0.5, 'rgba(255,244,214,0.9)'); gx.addColorStop(0.6, 'rgba(255,207,92,0.5)'); gx.addColorStop(1, 'rgba(242,183,58,0)'); g.fillStyle = gx; g.fillRect(0, 0, 24, 128);
    g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, 0, 0, 128); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.6, 'rgba(0,0,0,0.6)'); gy.addColorStop(0.92, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gy; g.fillRect(0, 0, 24, 128); });
  const shadowSpr = () => fxSprite('etrshadow', 64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(20,14,8,0.5)'); gr.addColorStop(0.6, 'rgba(20,14,8,0.2)'); gr.addColorStop(1, 'rgba(20,14,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  function pickBand(t, r) { const q = t / Math.max(1, r); let b = 0; for (let i = 1; i < BWS.length; i++) if (Math.abs(BWS[i] - q) < Math.abs(BWS[b] - q)) b = i; return b; }
  // a band on the floor round (X, Y): outer radius r px, thickness ~t px
  function band(c, kind, X, Y, r, t, a) { if (r < 2 || !(a > 0.01)) return; const add = kind === 'r'; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(bandSpr(kind, pickBand(t, r)), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
  function glowF(c, X, Y, r, col, a, gy) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (gy || 1); c.drawImage(glowSprite(col), X - r, Y - ry, r * 2, ry * 2); c.restore(); }

  /* ---- the stone chips: faceted rocks (a convex pyramid of facets cut by a tilted top facet), lit per pixel with soft
     cel bands, grain, a warm amber bounce from the glowing ground, a small gloss and a soft ink edge; odd shapes carry a
     glowing gold seam. Rendered once per shape and per turn (the light stays put while the rock turns) ---- */
  const NSH = 8, NRT = 12, CPX = 56, CHIPS = {};
  const SHAPES = []; for (let k = 0; k < NSH; k++) { const m = 5 + (k % 3), a0 = R1(k * 3.1) * TAU, el = 0.15 + 0.25 * R1(k * 5.3), F = [];
    for (let j = 0; j < m; j++) { const a = j / m * TAU + (R1(k * 7 + j * 1.3) - 0.5) * 0.7, rho = (0.62 + 0.3 * R1(k * 11 + j * 2.1)) * (1 + el * Math.cos(2 * (a - a0))) / (1 + el); F.push([Math.cos(a), Math.sin(a), rho, 1.1 + 1.0 * R1(k * 13 + j * 3.7)]); }
    SHAPES.push({ F, top: 0.42 + 0.3 * R1(k * 17.1), tx: (R1(k * 19.3) - 0.5) * 0.5, ty: (R1(k * 23.9) - 0.5) * 0.5 - 0.15, seam: k % 2 === 1, sa: R1(k * 29.7) * Math.PI }); }
  function chipFrame(k, ri) { const key = k * NRT + ri; if (CHIPS[key]) return CHIPS[key];
    const S = CPX, cv = mk(S, S), g = cv.getContext('2d'), im = g.createImageData(S, S), d = im.data, sh = SHAPES[k], R = S * 0.46, be = ri / NRT * TAU, cb = Math.cos(be), sb = Math.sin(be);
    const L = (() => { const l = [-0.5, -0.66, 0.58], q = Math.hypot(...l); return l.map(v => v / q); })(), Hv = (() => { const h = [L[0], L[1], L[2] + 1], q = Math.hypot(...h); return h.map(v => v / q); })();
    const RAMP = [[30, 23, 17], [50, 40, 31], [84, 60, 37], [128, 95, 60], [190, 154, 104]];
    let E = 0; const zAt = (ux, uy) => { const x = ux * cb + uy * sb, y = -ux * sb + uy * cb; let z = 9, e = 9; for (const f of sh.F) { const dd = f[2] - (x * f[0] + y * f[1]); if (dd < e) e = dd; const zz = f[3] * dd; if (zz < z) z = zz; } const zt = sh.top + sh.tx * x + sh.ty * y; E = e; return Math.min(z, zt); };
    const h = 1 / R;
    for (let py = 0; py < S; py++) for (let px = 0; px < S; px++) { const ux = (px + 0.5 - S / 2) / R, uy = (py + 0.5 - S / 2) / R, z = zAt(ux, uy), e = E, epx = e * R; if (epx < -1) continue;
      const gx = (zAt(ux + h, uy) - zAt(ux - h, uy)) / (2 * h), gy = (zAt(ux, uy + h) - zAt(ux, uy - h)) / (2 * h); let nx = -gx, ny = -gy, nz = 1; const nk = Math.hypot(nx, ny, nz); nx /= nk; ny /= nk; nz /= nk;
      const x = ux * cb + uy * sb, y = -ux * sb + uy * cb, n1 = vnoise(x * 6 + k * 7, y * 6), n2 = vnoise(x * 19 + 3, y * 19 + k);
      const ndl = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2]), ndh = Math.max(0, nx * Hv[0] + ny * Hv[1] + nz * Hv[2]);
      const bands = 0.28 * sstep(0.1, 0.2, ndl) + 0.36 * sstep(0.42, 0.52, ndl) + 0.36 * sstep(0.74, 0.82, ndl);
      const b = cl((0.6 * bands + 0.4 * ndl) * (0.78 + 0.34 * n1) + 0.06 * (n2 - 0.5)), bb = b * 3.999, ri2 = Math.floor(bb), rf = bb - ri2, A = RAMP[ri2], B = RAMP[ri2 + 1];
      let r = lerp(A[0], B[0], rf), gg = lerp(A[1], B[1], rf), bl = lerp(A[2], B[2], rf);
      const n8 = Math.pow(ndh, 24) * (0.4 + 0.6 * n2); r += 150 * n8; gg += 130 * n8; bl += 90 * n8;
      // the warm bounce from the lit ground (low right), a faint cool rim top left
      const fr = Math.pow(1 - nz, 1.8), rim = fr * cl(0.25 + ny * 0.9 + nx * 0.4); r += 200 * rim; gg += 115 * rim; bl += 25 * rim;
      // a bevel glint on the edges between facets (where the slope turns)
      if (sh.seam && z > 0.04) { const dl = Math.abs(x * Math.sin(sh.sa) - y * Math.cos(sh.sa) + 0.16 * (vnoise(x * 4 + k, y * 4) - 0.5)), core = 1 - sstep(0.012, 0.05, dl), halo = 1 - sstep(0.03, 0.12, dl);
        r = lerp(r, 255, core * 0.95) + 170 * halo * 0.5; gg = lerp(gg, 214, core * 0.95) + 100 * halo * 0.5; bl = lerp(bl, 120, core * 0.9) + 10 * halo * 0.5; }
      const ink = 0.35 + 0.65 * sstep(0, 2.4, epx), a = cl(epx + 0.6), o = (py * S + px) * 4;
      d[o] = Math.min(255, r * ink); d[o + 1] = Math.min(255, gg * ink); d[o + 2] = Math.min(255, bl * ink); d[o + 3] = a * 255; }
    g.putImageData(im, 0, 0); return (CHIPS[key] = cv); }

  /* ---- a tileable stone texture for the plates: mottled charcoal and umber, grain, pits, faint strata, gold flecks ---- */
  let TEX = null;
  function stoneTex() { if (TEX) return TEX; const S = 128, cv = mk(S, S), g = cv.getContext('2d'), im = g.createImageData(S, S), d = im.data;
    const fb = (u, v) => 0.5 * vnoise(u * 4, v * 4, 4) + 0.3 * vnoise(u * 8 + 3, v * 8, 8) + 0.2 * vnoise(u * 16, v * 16 + 5, 16);
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = x / S, v = y / S, e = 1 / S;
      const f = fb(u, v), gr = vnoise(u * 48, v * 48, 48), rd = 1 - Math.abs(2 * vnoise(u * 6 + 7, v * 6 + 1, 6) - 1), vein = sstep(0.9, 0.97, rd);
      // a relief: the mottled height lit from the upper left (embossed), fine grain, pits, dark hairline veins, gold flecks
      const hx = fb(u - e * 1.5, v - e * 1.5) - fb(u + e * 1.5, v + e * 1.5), lit = cl(0.5 + hx * 9);
      let r = lerp(38, 88, f), g2 = lerp(31, 70, f), b = lerp(26, 52, f); const k = (0.78 + 0.34 * gr) * (0.7 + 0.6 * lit); r *= k; g2 *= k; b *= k;
      const pit = sstep(0.74, 0.82, vnoise(u * 24 + 9, v * 24, 24)); r *= 1 - 0.5 * pit; g2 *= 1 - 0.5 * pit; b *= 1 - 0.5 * pit;
      r *= 1 - 0.55 * vein; g2 *= 1 - 0.55 * vein; b *= 1 - 0.55 * vein;
      const fl = sstep(0.93, 0.97, vnoise(u * 40 + 1, v * 40 + 2, 40) * gr); r += 190 * fl; g2 += 140 * fl; b += 40 * fl;
      const o = (y * S + x) * 4; d[o] = Math.min(255, r); d[o + 1] = Math.min(255, g2); d[o + 2] = Math.min(255, b); d[o + 3] = 255; }
    g.putImageData(im, 0, 0); return (TEX = cv); }
  function texPat(c) { if (c._etrPat) return c._etrPat; const p = c.createPattern(stoneTex(), 'repeat'); if (p.setTransform) p.setTransform(new DOMMatrix().scale(1 / 96)); return (c._etrPat = p); }

  /* ---- hairline cracks: radial walks with branches and short concentric links, in four rings (each lights as the front
     passes it); feathered (a wide faint stroke, a middle and a hot core). Unit circle = the wave's reach ---- */
  const CRK = {}, CS = 384;
  function crackSet(seed) { if (CRK[seed]) return CRK[seed]; let s = seed * 31.7 + 3; const rnd = () => R1(s += 1.37), segs = [];
    const walk = (x, y, a, steps, depth) => { for (let i = 0; i < steps; i++) { const r = Math.hypot(x, y); if (r > 0.99) break; const ra = Math.atan2(y, x); let da = ra - a; while (da > Math.PI) da -= TAU; while (da < -Math.PI) da += TAU; a += da * 0.25 + (rnd() - 0.5) * 0.7; const L = 0.035 + 0.03 * rnd(), nx = x + Math.cos(a) * L, ny = y + Math.sin(a) * L; segs.push([x, y, nx, ny, depth]); x = nx; y = ny; if (depth < 2 && rnd() < 0.11) walk(x, y, a + (rnd() < 0.5 ? -1 : 1) * (0.5 + 0.4 * rnd()), 4 + Math.floor(rnd() * 6), depth + 1); } };
    const NR = 13, roots = []; for (let i = 0; i < NR; i++) { const a = i / NR * TAU + (rnd() - 0.5) * 0.35, r0 = 0.12 + 0.08 * rnd(); roots.push(a); walk(Math.cos(a) * r0, Math.sin(a) * r0, a, 40, 0); }
    for (let i = 0; i < NR; i++) if (rnd() < 0.55) { const a0 = roots[i], a1 = roots[(i + 1) % NR] + (i === NR - 1 ? TAU : 0), rr = 0.3 + 0.6 * rnd(); let px = Math.cos(a0) * rr, py = Math.sin(a0) * rr; for (let k = 1; k <= 5; k++) { const a = lerp(a0, a1, k / 5), r2 = rr * (1 + (rnd() - 0.5) * 0.08), nx = Math.cos(a) * r2, ny = Math.sin(a) * r2; segs.push([px, py, nx, ny, 1]); px = nx; py = ny; } }
    const out = []; for (let b = 0; b < 4; b++) out.push(mk(CS, CS));
    const sc = CS / 2 * 0.98;
    for (const [col, lw] of [['rgba(217,120,20,0.2)', 8], ['rgba(235,160,40,0.6)', 2.8], ['rgba(255,218,130,0.95)', 1.1]]) for (const q of segs) { const r = Math.hypot((q[0] + q[2]) / 2, (q[1] + q[3]) / 2), b = Math.min(3, Math.floor(r * 4)), g = out[b].getContext('2d');
      g.strokeStyle = col; g.lineCap = 'round'; g.lineWidth = lw * (1.15 - 0.55 * r) * (q[4] ? 0.75 : 1); g.beginPath(); g.moveTo(CS / 2 + q[0] * sc, CS / 2 + q[1] * sc); g.lineTo(CS / 2 + q[2] * sc, CS / 2 + q[3] * sc); g.stroke(); }
    return (CRK[seed] = out); }

  /* ---- Celestial: the layered fracture web: layer i is a jagged ring at radius 0.22 + 0.105 i joined to the ring inside
     it by kinked spokes; successive impacts add the layers outward ---- */
  const FRL = {}, FS = 384;
  function fracLayer(i) { if (FRL[i]) return FRL[i]; let s = i * 17.3 + 5; const rnd = () => R1(s += 1.91), cv = mk(FS, FS), g = cv.getContext('2d'), sc = FS / 2 * 0.97, segs = [], nodes = [];
    const rr = q => 0.22 + 0.105 * q, M = 9 + 2 * i, ring = [];
    for (let k = 0; k < M; k++) { const a = (k + rnd() * 0.5) / M * TAU, r = rr(i) * (1 + (rnd() - 0.5) * 0.14); ring.push([Math.cos(a) * r, Math.sin(a) * r, a]); }
    for (let k = 0; k < M; k++) { const p = ring[k], q = ring[(k + 1) % M], mx = (p[0] + q[0]) / 2 * (1 + (rnd() - 0.5) * 0.08), my = (p[1] + q[1]) / 2 * (1 + (rnd() - 0.5) * 0.08); segs.push([p[0], p[1], mx, my], [mx, my, q[0], q[1]]); nodes.push(p); }
    for (let k = 0; k < M; k++) { if (rnd() < 0.3) continue; const p = ring[k], a = p[2] + (rnd() - 0.5) * 0.25, r0 = i ? rr(i - 1) : 0.06, km = (Math.hypot(p[0], p[1]) + r0) / 2, ka = a + (rnd() - 0.5) * 0.3; const m = [Math.cos(ka) * km, Math.sin(ka) * km]; segs.push([p[0], p[1], m[0], m[1]], [m[0], m[1], Math.cos(a) * r0, Math.sin(a) * r0]);
      if (rnd() < 0.5) { const b = p[2] + (rnd() - 0.5) * 0.5, l = 0.04 + 0.04 * rnd(); segs.push([p[0], p[1], p[0] + Math.cos(b) * l, p[1] + Math.sin(b) * l]); } }
    g.translate(FS / 2, FS / 2); g.lineCap = 'round'; g.lineJoin = 'round';
    for (const [col, lw] of [['rgba(217,120,20,0.12)', 13], ['rgba(217,120,20,0.3)', 5.5], ['rgba(235,160,40,0.7)', 2.2], ['rgba(255,218,130,0.95)', 0.9]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); for (const q of segs) { g.moveTo(q[0] * sc, q[1] * sc); g.lineTo(q[2] * sc, q[3] * sc); } g.stroke(); }
    g.globalCompositeOperation = 'lighter'; for (const p of nodes) { const gr = g.createRadialGradient(p[0] * sc, p[1] * sc, 0, p[0] * sc, p[1] * sc, 9); gr.addColorStop(0, 'rgba(255,233,184,0.6)'); gr.addColorStop(1, 'rgba(242,183,58,0)'); g.fillStyle = gr; g.fillRect(p[0] * sc - 9, p[1] * sc - 9, 18, 18); }
    return (FRL[i] = cv); }

  /* ---- a wedge plate (Adept): a textured slab hinged at its inner edge in the floor, the outer edge lifting by phi.
     The floor's circle space (u right, v toward the viewer) maps to the screen as X = X0 + u T, Y = Y0 + v T GY - z T,
     so each flat face is an exact affine image: the top face is filled with the stone pattern through that affine (its
     grain foreshortens with the tilt), shaded flat by its normal; the exposed sides are lit polygons; a gold seam runs
     along it and its outer lip catches the light. The slot beneath glows amber while it is open ---- */
  const LV = (() => { const l = [-0.45, -0.38, 0.81], q = Math.hypot(...l); return l.map(v => v / q); })();
  function plate(c, X0, Y0, T, p, phi, hop, a) { const GY = H.GY, ct = Math.cos(p.th), st = Math.sin(p.th), cf = Math.cos(phi), sf = Math.sin(phi), r0 = p.r0, Lp = p.L, a0 = p.a0, a1 = p.a1;
    const bx = r0 * Math.cos(p.pa), by = r0 * Math.sin(p.pa); const P3 = (w, s, dz) => { const u = bx + s * cf * ct - w * st, v = by + s * cf * st + w * ct, z = s * sf + hop + (dz || 0); return [X0 + u * T, Y0 + v * T * GY - Math.max(0, z) * T]; };
    const ex = -st * T, ey = ct * T * GY, sx2 = cf * ct * T, sy2 = cf * st * T * GY - sf * T, ox = X0 + bx * T, oy = Y0 + by * T * GY - hop * T;
    c.save(); c.globalAlpha = a;
    // the open slot's light
    if (phi > 0.02) { const k = cl(phi / 0.4), mx = X0 + (bx + Lp * 0.5 * ct) * T, my = Y0 + (by + Lp * 0.5 * st) * T * GY; glowF(c, mx, my, T * Lp * 0.9, AMBER, 0.75 * k * a, GY); glowF(c, mx, my, T * Lp * 0.45, HONEY, 0.55 * k * a, GY); c.globalAlpha = a; }
    const shade = (nx, ny, nz) => Math.max(0, nx * LV[0] + ny * LV[1] + nz * LV[2]);
    const face = (pts, lit) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = texPat(c); c.fill(); c.fillStyle = lit < 0.55 ? `rgba(12,8,4,${(0.55 - lit) * 1.25})` : `rgba(255,214,150,${(lit - 0.55) * 0.5})`; c.fill(); c.strokeStyle = 'rgba(16,11,6,0.55)'; c.lineWidth = Math.max(1, T * 0.02); c.stroke(); };
    const TH = p.th2;
    // the sides that face the viewer (V = (0, 0.835, 0.55)): the end face, then the radial sides
    const nE = [cf * ct, cf * st, sf]; if (nE[1] * 0.835 + nE[2] * 0.55 > 0.02 && phi > 0.01) face([P3(-a1, Lp), P3(a1, Lp), P3(a1, Lp, -TH), P3(-a1, Lp, -TH)], shade(...nE) * 0.8);
    for (const sd of [-1, 1]) { const nx = -st * sd, ny = ct * sd; if (ny * 0.835 > 0.04 && phi > 0.01) face([P3(sd * a0, 0), P3(sd * a1, Lp), P3(sd * a1, Lp, -TH), P3(sd * a0, 0, -TH)], shade(nx, ny, 0) * 0.75); }
    // the top face through its affine, textured; its shade by its tilted normal; the seam and the lip
    const nT = [-sf * ct, -sf * st, cf], lt = shade(...nT);
    // (the pattern is shifted per plate: the face is drawn offset by (tu, tv) in a space moved back by it)
    const tu = p.tu, tv = p.tv, M = (x, y) => (c.lineTo(x + tu, y + tv)), M0 = (x, y) => (c.moveTo(x + tu, y + tv));
    c.save(); c.transform(ex, ey, sx2, sy2, ox, oy); c.translate(-tu, -tv); c.beginPath(); M0(-a0, 0); M(a0, 0); M(a1, Lp); M(-a1, Lp); c.closePath();
    c.fillStyle = texPat(c); c.fill();
    c.fillStyle = lt < 0.62 ? `rgba(12,8,4,${(0.62 - lt) * 1.1})` : `rgba(255,220,160,${(lt - 0.62) * 0.9})`; c.fill();
    c.lineJoin = 'round'; c.lineCap = 'round';
    // a bevel: the face's own rim lit inside it (clipped to the face)
    c.save(); c.clip(); c.strokeStyle = 'rgba(255,222,165,0.2)'; c.lineWidth = 0.14; c.stroke(); c.strokeStyle = 'rgba(255,233,184,0.25)'; c.lineWidth = 0.05; c.stroke(); c.restore();
    c.strokeStyle = 'rgba(255,233,184,0.5)'; c.lineWidth = 0.05; c.beginPath(); M0(-a1 * 0.92, Lp - 0.02); M(a1 * 0.92, Lp - 0.02); c.stroke();
    c.strokeStyle = 'rgba(16,11,6,0.6)'; c.lineWidth = 0.028; c.beginPath(); M0(-a0, 0); M(a0, 0); M(a1, Lp); M(-a1, Lp); c.closePath(); c.stroke();
    const sp = p.seam; c.globalCompositeOperation = 'lighter';
    for (const [col, lw] of [['rgba(217,138,30,0.35)', 0.1], ['rgba(242,183,58,0.75)', 0.04], ['rgba(255,244,214,0.95)', 0.014]]) { c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); M0(sp[0][0], sp[0][1]); for (let i = 1; i < sp.length; i++) M(sp[i][0], sp[i][1]); c.stroke(); }
    c.restore(); c.restore(); }

  U.trampoline = (C, h) => {
    H = h; const me = H.me, GY = H.GY, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), ADEPT = ev >= 4, CEL = ev >= 7;
    const NJ = [3, 3, 4, 5, 5, 6, 7][ev - 1], R = (3 + 0.25 * (ev - 1)) * C.K, RF = R * 1.3, FO = 0.18;
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), TOT = DK * (ev <= 4 ? 13 + (ev - 1) / 3 : 14), W1 = TOT / (NJ - 1 + 2.2), WF = W1 * 2.2;
    H.X.banner('SHOCKWAVE TRAMPOLINE', '', C.col, 1.4); H.X.sfx.hum(); me.castT = 0;
    // the jumps: 0.25 s on the ground between them (squash, crouch), 0.5 s in the air; the final one crouches longer,
    // flies twice as high and hangs at its apex
    const J = []; { let t = 0.34; for (let j = 0; j < NJ; j++) { const fin = j === NJ - 1; if (fin && j) t += 0.17; const A = fin ? 0.95 : 0.5; J.push({ j, L: t, D: t + A, A, zmax: fin ? 2.3 : 1.15, fin, up: false, landed: false }); t += A + 0.25; } }
    const LAST = J[NJ - 1], END = LAST.D + 2.0;
    // the cached pictures, a few a tick from the cast (before the first landing)
    const warm = [() => stoneTex(), () => coreSpr(), () => puffSpr(), () => streakSpr(), () => shadowSpr()];
    for (let k = 0; k < NSH; k++) for (let r = 0; r < NRT; r++) warm.push(() => chipFrame(k, r));
    for (const kd of ['e', 'r', 'd']) for (let b = 0; b < BWS.length; b++) warm.push(() => bandSpr(kd, b));
    warm.push(() => crackSet(1), () => crackSet(2)); if (CEL) for (let i = 0; i < NJ; i++) warm.push(() => fracLayer(i));
    const waves = [], frac = []; let wi = 0, lastLand = -9;
    // the pose: lifted, squashed (+) or stretched (-), arms (degrees, + up), feet (+ dangle down) at cast time tt
    function groundS(q, tau, nx) { const S0 = q.fin ? 1.35 : 1.0, gap = nx ? nx.L - q.D : 1; return S0 * Math.exp(-6.5 * tau) * Math.cos(16 * tau) + (nx ? 0.42 * sm(tau / gap) * (1 - Math.exp(-8 * tau)) : 0); }
    function poseAt(tt) {
      if (tt < J[0].L) { const k = sm(tt / J[0].L); return [0, 0.5 * k, -32 * k, 0]; }
      let j = 0; while (j + 1 < NJ && tt >= J[j + 1].L) j++; const q = J[j], nx = J[j + 1];
      if (tt < q.D) { const u = (tt - q.L) / q.A, ua = q.fin ? 0.36 : 0.44, uf = q.fin ? 0.6 : 0.44, pre = j ? groundS(J[j - 1], q.L - J[j - 1].D, q) : 0.5; let z, s, arm, ft;
        if (u < ua) { const k = u / ua; z = q.zmax * (1 - Math.pow(1 - k, 2.2)); s = u < 0.06 ? lerp(pre, -0.6, sm(u / 0.06)) : -0.6 * (1 - sm((u - 0.06) / (ua - 0.02))); arm = u < 0.16 ? lerp(-32, 100, sm(u / 0.16)) : lerp(100, 55, sm((u - 0.16) / (ua - 0.16))); ft = lerp(4.5, -1.5, sm(k)); }
        else if (u < uf) { const k = (u - ua) / (uf - ua); z = q.zmax * (1 + 0.035 * Math.sin(k * Math.PI)); s = 0.07 * Math.sin(k * Math.PI); arm = 55 + 12 * Math.sin(k * Math.PI); ft = -1.5; }
        else { const v = (u - uf) / (1 - uf); z = q.zmax * (1 - Math.pow(v, 2.2)); s = -0.38 * sm(v * 1.2); arm = lerp(55, 128, sm(v)); ft = lerp(-1.5, 3.5, sm(v * 1.4)); }
        return [z, s, arm, ft]; }
      const tau = tt - q.D, s = groundS(q, tau, nx), gap = nx ? nx.L - q.D : 1, arm = -42 + 170 * Math.exp(-18 * tau), cr = nx ? -32 * sm(tau / gap) : 0;
      return [0, q.fin ? s * (1 - sm((tau - 0.5) / 0.4)) : s, (q.fin ? arm * (1 - sm(tau / 0.7)) : arm * (1 - sm(tau / gap)) + cr), 0]; }
    function spawnWave(q) {
      const fin = q.fin, x = me.x, y = me.y, Rw = fin ? RF : R, DW = fin ? 0.85 : 0.62, sd = ++wi;
      const w = { x, y, t0: q.D, Rw, DW, fin, hit: new Set(), dmg: fin ? WF : W1, chips: [], puffs: [], plates: [], crk: crackSet(1 + (sd % 2)), flip: (sd >> 1) % 2 ? -1 : 1 };
      const NC = H.n((fin ? 34 + 4 * ev : 20 + 3 * ev) * (CEL ? 1.1 : 1));
      for (let i = 0; i < NC; i++) { const big = fin && i < 7; w.chips.push({ a: (i + R1(sd * 7 + i)) / NC * TAU, k: 0.86 + 0.2 * R1(sd * 3 + i * 1.7), sz: (big ? 0.34 + 0.14 * R1(i * 9.1) : 0.11 + 0.13 * R1(sd + i * 4.3)) * (fin ? 1.3 : 1) * (0.9 + 0.04 * ev), t0: 0.02 + 0.12 * R1(sd * 5 + i * 2.9), v0: (big ? 4.2 : 2.4 + 2.8 * R1(sd * 11 + i)) * (fin ? 1.25 : 1), out: R1(i * 3.3 + sd) < 0.35 ? 0.6 + 1.4 * R1(i * 5.5) : 0, sh: Math.floor(R1(sd * 13 + i * 7.7) * NSH), r0: R1(i * 2.2 + sd) * TAU, spin: (R1(i * 6.6 + sd) - 0.5) * 22, big }); }
      const NP = H.n((fin ? 22 : 13) + ev);
      for (let i = 0; i < NP; i++) w.puffs.push({ a: (i + R1(sd * 17 + i)) / NP * TAU, ts: 0.08 + DW * 0.85 * R1(sd * 19 + i * 3.1), sz: (0.55 + 0.5 * R1(i * 4.4 + sd)) * (fin ? 1.3 : 1), life: 1.0 + 0.5 * R1(i * 8.8), dr: 0.3 + 0.5 * R1(i * 1.9) });
      if (ADEPT) { const rings = CEL || ev >= 6 ? [0.5, 0.82] : [0.62];
        rings.forEach((rc, ri) => { const NPL = Math.round((6 + (ev - 4)) * (ri ? 1.3 : 1) * (fin ? 1.2 : 1)), Lb = (0.5 + 0.04 * (ev - 4)) * (fin ? 1.3 : 1) * (ri ? 1.1 : 1);
          for (let i = 0; i < NPL; i++) { const q1 = R1(sd * 23 + i * 1.7 + ri * 9), q2 = R1(sd * 41 + i * 2.3), q3 = R1(sd * 43 + i * 3.1); if (q3 < 0.14) continue;
            const Lp = Lb * (0.75 + 0.45 * q2), pa = (i + 0.5 * ri + 0.3 * (q1 - 0.5)) / NPL * TAU, th = pa + (q2 - 0.5) * 0.35, r0 = rc * Rw - Lp * 0.5 + (q1 - 0.5) * 0.3, aw = Math.PI / NPL * (0.45 + 0.35 * q3), seam = [];
            for (let k = 0; k <= 5; k++) seam.push([(R1(sd * 31 + i * 5 + k) - 0.5) * 0.08 * Lp, 0.08 * Lp + k / 5 * 0.84 * Lp]);
            w.plates.push({ th, pa, r0, L: Lp, a0: Math.tan(aw) * r0 * (0.8 + 0.25 * q1), a1: Math.tan(aw) * (r0 + Lp) * (0.85 + 0.2 * q2), th2: 0.13 * (fin ? 1.3 : 1), tp: tAt(w, rc * Rw) - 0.04, phiM: (0.26 + 0.16 * q1) * (fin ? 1.2 : 1), hop: 0.04 + 0.05 * q2, tu: q1 * 2, tv: q3 * 2, seam }); } }); }
      waves.push(w);
      if (CEL) frac.push({ x, y, t0: q.D, i: frac.length });
      // the landing: the contact core, chips flung from the feet, the jolt
      for (let i = 0; i < H.n(fin ? 22 : 10); i++) { const a = Math.random() * TAU, v = (fin ? 7 : 5) * (0.6 + Math.random() * 0.6); H.P({ kind: 'spark', x: x + Math.cos(a) * 0.55, y: y + Math.sin(a) * 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.55 - 1, g: 6, life: 0.45, max: 0.45, size: 1.8, color: [HONEY, GOLD, PALE][i % 3] }); }
      H.X.light(x, y, Rw * (fin ? 1.1 : 0.7), fin ? 0.5 : 0.28);
      if (fin) { H.X.shake(13 + ev * 0.6, 0.45); H.X.hitstop(0.07); H.X.flash(0.16, HONEY); H.X.sfx.crash(); H.X.sfx.stomp(); } else { H.X.shake(5 + ev * 0.3, 0.18); H.X.sfx.stomp(); }
      lastLand = q.D;
    }
    // the radius of a wave's front tau after its landing, and the inverse
    const front = (w, tau) => w.Rw * (1 - Math.pow(1 - cl(tau / w.DW), 2.3));
    function tAt(w, r) { const k = cl(r / w.Rw); return w.DW * (1 - Math.pow(1 - k, 1 / 2.3)); }

    H.add({ life: END, wi: 0, etr: true,
      update(dt, f) {
        const tt = f.t;
        { const t0 = performance.now(); while (f.wi < warm.length && (performance.now() - t0 < 3 || tt > J[0].D - 0.1)) warm[f.wi++](); }   // (about 3 ms a frame; whatever is left is finished before the first landing)
        if (me.dead) { f.life = 0; return; }
        // the pet's body
        if (tt < LAST.D + 0.95) { const P = poseAt(tt), kq = Math.min(1, dt * 30); me.z = P[0]; me.hopSq = (me.hopSq || 0) + (P[1] - (me.hopSq || 0)) * Math.min(1, dt * 45); me.hopArm = (me.hopArm || 0) + (P[2] - (me.hopArm || 0)) * kq; me.hopFoot = (me.hopFoot || 0) + (P[3] - (me.hopFoot || 0)) * kq; }
        else if (!f.rest) { f.rest = true; me.z = 0; me.hopSq = 0; me.hopArm = 0; me.hopFoot = 0; }
        for (const q of J) {
          if (!q.up && tt >= q.L) { q.up = true; H.X.sfx[q.fin ? 'whoosh' : 'jump'](); H.burst(me.x, me.y, 'spark', q.fin ? 10 : 5, { v: 3, up: 1.5, g: 6, life: 0.4, size: 1.6, color: [GOLD, PALE] });
            waves.push({ x: me.x, y: me.y, t0: q.L, Rw: 0.7, DW: 0.35, launch: true, hit: null, chips: Array.from({ length: H.n(q.fin ? 10 : 6) }, (_, i) => ({ a: (i + R1(q.j * 7 + i)) / (q.fin ? 10 : 6) * TAU, k: 0.6 + 0.5 * R1(i * 3.1 + q.j), sz: 0.07 + 0.06 * R1(i * 5.7), t0: 0.0, v0: 2 + 1.5 * R1(i * 2.3), out: 0.4, sh: i % NSH, r0: i, spin: 12 })), puffs: Array.from({ length: H.n(q.fin ? 8 : 5) }, (_, i) => ({ a: (i + 0.5) / (q.fin ? 8 : 5) * TAU, ts: 0.02, sz: 0.4 + 0.2 * R1(i), life: 0.7, dr: 0.5 })), plates: [] }); }
          if (!q.landed && tt >= q.D) { q.landed = true; spawnWave(q); }
        }
        // each wave: one hit per monster, the moment its drawn front (the floor ellipse) reaches the monster's feet
        const live = H.living();
        for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i], tau = tt - w.t0;
          if (w.hit && tau <= w.DW + 0.05) { const rf = front(w, tau);
            for (const m of live) { if (w.hit.has(m)) continue; const de = Math.hypot(m.x - w.x, (m.y - w.y) / GY); if (de - m.r * 0.8 <= rf && de - m.r <= w.Rw) { w.hit.add(m); H.X.hitMon(m, w.dmg, C.dmgO(w.fin ? { stun: 0.6, kb: 4 } : { stun: 0.14, kb: 1.2 }));
              H.burst(m.x, m.y - 0.1, 'spark', w.fin ? 7 : 4, { v: 4, up: 3.5, g: 10, life: 0.45, size: 1.8, color: [GOLD, HONEY, PALE] }); } } }
          if (tau > w.DW + 1.7) waves.splice(i, 1); }
      },
      onEnd() { me.z = 0; me.hopSq = 0; me.hopArm = 0; me.hopFoot = 0; waves.length = 0; frac.length = 0; },
      drawUnder(c, f, _X, _Y, T) {
        const tt = f.t;
        // Celestial: the fracture web, each layer at its own landing, re-lit by every new impact; it fades after the final ring
        if (frac.length) { const fade = 1 - sm((tt - LAST.D - 0.85) / 1.1); if (fade > 0.01) { c.save();
          const kick = Math.exp(-(tt - lastLand) * 2.6);
          for (const q of frac) { const age = tt - q.t0, g0 = sm(age / 0.35), X = H.sx(q.x), Y = H.sy(q.y) + FO * T, r = R * 1.05 * T * (0.85 + 0.15 * g0) * (q.i === NJ - 1 ? 1.12 : 1), a = fade * g0 * (0.26 + 0.3 * kick + 0.06 * Math.sin(tt * 3 + q.i)); if (a < 0.01) continue;
            c.globalAlpha = Math.min(1, a); c.drawImage(fracLayer(q.i), X - r, Y - r * GY, r * 2, r * 2 * GY); }
          c.restore(); } }
        // the landing mark while the pet is in the air: a ring of light that tightens and brightens as it falls
        { let j = 0; while (j + 1 < NJ && tt >= J[j + 1].L) j++; const q = J[j]; if (tt >= q.L && tt < q.D) { const u = (tt - q.L) / q.A, X = H.sx(me.x), Y = H.sy(me.y) + FO * T, k = sm((u - 0.15) / 0.85);
          band(c, 'e', X, Y, T * lerp(1.0, 0.5, k) * (q.fin ? 1.3 : 1), T * 0.14, (0.25 + 0.6 * k) * (q.fin ? 1.2 : 1)); glowF(c, X, Y, T * 0.8, AMBER, 0.25 * k, GY);
          if (q.fin && u > 0.3) { const kk = sm((u - 0.3) / 0.25) * (1 - 0.5 * sm((u - 0.8) / 0.2)); band(c, 'r', X, Y, RF * T, T * 0.35, 0.3 * kk); } } }
        for (const w of waves) { const tau = tt - w.t0; if (tau < 0) continue; const X = H.sx(w.x), Y = H.sy(w.y) + FO * T, rf = front(w, tau), RP = rf * T, end = cl(1 - (tau - w.DW * 0.75) / (w.DW * 0.6)), big = w.fin ? 1.3 : 1;
          if (!w.launch) {
            // the contact core: a small bright point at the feet, fading fast
            const ck = Math.exp(-tau * 7); if (ck > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ck; const cr = T * 0.9 * big * (0.7 + 0.5 * (1 - ck)); c.drawImage(coreSpr(), X - cr, Y - cr * GY, cr * 2, cr * 2 * GY); c.restore(); glowF(c, X, Y, T * 1.6 * big, AMBER, 0.45 * ck, GY); }
            // hairline cracks lighting through the ground behind the leading edge, ring by ring
            const CR = w.Rw * T; c.save();
            for (let b = 0; b < 4; b++) { const tb = tAt(w, w.Rw * (b + 0.35) / 4), k = tau < tb ? 0 : sm((tau - tb) / 0.06) * Math.exp(-(tau - tb) * (w.fin ? 1.6 : 2.4)); if (k < 0.02) continue; c.save(); c.globalAlpha = Math.min(1, k * (w.fin ? 1 : 0.85)); c.translate(X, Y); c.scale(w.flip, GY); c.drawImage(w.crk[b], -CR / 0.98, -CR / 0.98, CR * 2 / 0.98, CR * 2 / 0.98);   /* (mirrored, never turned: a turned copy costs a phone several plain ones) */ c.restore(); }
            c.restore();
            // pale golden pressure ripples behind the front (a second at Adept)
            const ra = end * (0.7 + 0.3 * (1 - cl(tau / w.DW)));
            band(c, 'r', X, Y, RP * 0.8, T * 0.3, 0.55 * ra); band(c, 'r', X, Y, RP * 0.62, T * 0.26, 0.35 * ra); if (ADEPT) band(c, 'r', X, Y, RP * 0.45, T * 0.22, 0.25 * ra);
            // the leading edge's light and the dust sheet riding just behind it
            if (rf > 0.35) { band(c, 'e', X, Y, RP + T * 0.08, T * 0.42 * big, 0.9 * end); band(c, 'd', X, Y, RP * 0.98, T * (0.6 + 0.08 * ev) * big * (0.6 + 0.4 * cl(tau / w.DW)), 0.6 * cl(1 - (tau - w.DW) / 0.9)); }
            // the plates: lifted at the passing front, falling back (far ones first)
            if (w.plates.length) { const ps = w.plates.slice().sort((p, q) => Math.sin(p.pa) - Math.sin(q.pa));
              for (const p of ps) { const u = tau - p.tp; if (u < -0.02 || u > 0.75) continue; const up = sm(u / 0.1), dn = u > 0.16 ? sm((u - 0.16) / 0.26) : 0, bounce = u > 0.42 ? 0.12 * Math.abs(Math.sin((u - 0.42) * 14)) * Math.exp(-(u - 0.42) * 9) : 0;
                const phi = p.phiM * (up * (1 - dn) + bounce), hop = p.hop * up * (1 - dn); plate(c, X, Y, T, p, phi, hop, sm((u + 0.02) / 0.08) * (1 - sm((u - 0.45) / 0.28))); } }   /* (they rise out of the floor and sink back into it) */
          }
          drawPuffs(c, w, tau, X, Y, T, false); drawChips(c, w, tau, X, Y, T, false); }
      },
      draw(c, f, _X, _Y, T) {
        const tt = f.t;
        for (const w of waves) { const tau = tt - w.t0; if (tau < 0) continue; const X = H.sx(w.x), Y = H.sy(w.y) + FO * T; drawPuffs(c, w, tau, X, Y, T, true); drawChips(c, w, tau, X, Y, T, true); }
        // falling: soft streaks of light beside the pet
        let j = 0; while (j + 1 < NJ && tt >= J[j + 1].L) j++; const q = J[j];
        if (tt >= q.L && tt < q.D) { const u = (tt - q.L) / q.A, uf = q.fin ? 0.6 : 0.44; if (u > uf) { const v = (u - uf) / (1 - uf), z = (me.z || 0) * T, X = H.sx(me.x), Y = H.sy(me.y) + FO * T - z, a = sm(v * 1.5) * (q.fin ? 0.75 : 0.45);
          c.save(); c.globalCompositeOperation = 'lighter'; const sp = streakSpr(), hh = T * (0.9 + 1.4 * v) * (q.fin ? 1.4 : 1);
          for (const [dx, k] of [[-0.42, 1], [0.44, 0.85], [-0.2, 0.55], [0.22, 0.5]]) { c.globalAlpha = a * k; c.drawImage(sp, X + dx * T - T * 0.08, Y - T * 0.95 - hh, T * 0.16, hh); }
          c.restore(); } }
      } });

    // the dust sheet: puffs left along the front that drift on, rise a little and settle (far half under, near half over)
    function drawPuffs(c, w, tau, X, Y, T, near) { const img = puffSpr(), PX = H.sx(me.x), PY = H.sy(me.y) + FO * T - (me.z || 0) * T - T * 0.5;
      for (const p of w.puffs) { const age = tau - p.ts; if (age < 0 || age > p.life) continue; const sn = Math.sin(p.a); if ((sn > 0) !== near) continue;
        const r0 = w.launch ? 0.35 + p.dr * age : front(w, p.ts) * 0.97 + p.dr * age, u = age / p.life, px = X + Math.cos(p.a) * r0 * T, py = Y + sn * r0 * T * GY - T * (0.12 + 0.35 * u) * p.sz, s = T * p.sz * (0.7 + 0.9 * sm(u));
        let a = 0.55 * sm(age / 0.12) * (1 - sm(u)); if (near) { const dd = Math.hypot(px - PX, py - PY); a *= 0.25 + 0.75 * sstep(T * 0.35, T * 0.9, dd); } if (a < 0.02) continue;
        c.globalAlpha = a; c.drawImage(img, px - s, py - s * 0.7, s * 2, s * 1.4); }
      c.globalAlpha = 1; }
    // the chips: riding the front in short weighted hops, tumbling (a turned picture each), thrown ones flying on; they
    // settle and fade as the wave dies. The centre stays clear
    function drawChips(c, w, tau, X, Y, T, near) { const PX = H.sx(me.x), PY = H.sy(me.y) + FO * T - (me.z || 0) * T - T * 0.5, end = w.launch ? 0.35 : w.DW, sh = shadowSpr();
      for (const p of w.chips) { const age = tau - p.t0; if (age < 0) continue; const sn = Math.sin(p.a); if ((sn > 0) !== near) continue;
        const g = 17, t1 = 2 * p.v0 / g; let z; if (age < t1) z = p.v0 * age - g * age * age / 2; else { const v1 = p.v0 * 0.3, a2 = age - t1, t2 = 2 * v1 / g; z = a2 < t2 ? v1 * a2 - g * a2 * a2 / 2 : 0; }
        const rr = (w.launch ? 0.3 + p.k * 0.5 * cl(age / 0.3) : front(w, Math.min(tau, end)) * p.k) + p.out * Math.min(age, 0.9) * (w.launch ? 1 : 0.8), fa = 1 - sm((tau - end - 0.25) / 0.45), cen = w.launch ? 1 : p.big ? sstep(0.9, 1.5, rr) : sstep(0.45, 0.95, rr);
        let a = fa * cen * sm(age / 0.05); if (a < 0.02) continue;
        const px = X + Math.cos(p.a) * rr * T, gy0 = Y + sn * rr * T * GY, py = gy0 - z * T, s = p.sz * T;
        if (near) { const dd = Math.hypot(px - PX, py - PY); a *= 0.2 + 0.8 * sstep(T * 0.3, T * 0.85, dd); }
        if (p.big || s > T * 0.2) { c.globalAlpha = a * 0.5 * (1 - cl(z / 1.5)); const ss = s * (1.1 - 0.3 * cl(z)); c.drawImage(sh, px - ss, gy0 - ss * 0.45, ss * 2, ss * 0.9); }
        const rot = p.r0 + p.spin * Math.min(age, t1 + 0.2), ri = ((Math.floor(rot / TAU * NRT) % NRT) + NRT) % NRT;
        c.globalAlpha = a; c.drawImage(chipFrame(p.sh, ri), px - s, py - s, s * 2, s * 2); }
      c.globalAlpha = 1; }
  };
})();
