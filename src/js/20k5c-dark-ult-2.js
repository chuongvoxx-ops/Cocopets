/* ---------- Dark, reworked: Dark Side of the Moon (was Eclipse of the Hollow Moon) ----------
   A great dark sphere forms over the aim ringed by a silver corona; four pulses hammer the monsters beneath it, then it
   squeezes into a tiny bright marble, hangs trembling, expands past its size and bursts into negative energy, and the
   world turns negative for half a second. The pulses and damage are those of the first build (20k5-elem-dark.js: warn
   1.1 s, pulses at 1.1 / 1.5 / 1.9 / 2.3 for 1.6 x base each, the ring hit for 4.6 x base); the finale (round 4, the
   user's "squeeze into a tiny sphere, then expand and explode into negative energy"): squeeze 2.55-3.0 (uniform, eased
   in, the corona and fractures crushed with it, light leaking from the cracks brighter as it shrinks) to 0.12 of its
   size; the marble hangs 3.0-3.28 (trembling, a high whine); it expands to 1.35x by 3.42 and bursts: H.X.negative(0.5),
   a shell of negative energy (pale core, dark rim) rushing out with violet-black shards, the shockwave and the ring hit,
   all at 3.42.
   The sphere is a real shaded volume: a cached lit body (smoky violet on the lit side through plum to void at the dark
   limb, a reflected violet rim low right), slow dark currents under the surface (latitude bands and cells on a tilted,
   differentially turning globe, projected so they curve and foreshorten), a cached shade overlay that keeps the volume
   whatever moves beneath, a few luminous fractures laid on the globe's surface (hidden round the back, feathered at the
   limb) that brighten with each pulse, a soft specular, a thin #A55CFF limb; round it a silver corona of thin curved
   filaments with occasional flares (a second counter-turning violet layer from Adept), a void halo so it reads on a bright
   floor; shadow motes spiral up from the floor in six streams; the ground beneath is a violet-lit ring (light only).
   Each pulse: the sphere jolts, the fractures flash, a dark ring races across the floor and fades. Burst: the negative
   shell, curved dark-glass shards, a violet-black shockwave in the air and on the floor, smoke, a pale core flash. Celestial: a monumental sphere with
   five orbiting broken halo segments and a slow rain of dark fragments after. Near the pet the whole effect dims smoothly
   (no cut-out). No per-frame gradients, no shadowBlur; the gradient pieces are cached sprites. */
(() => {
  const U = ELEM_IMPL.dark.ult, TAU = Math.PI * 2;
  const P = { void: '#08050F', body: '#180B2E', plum: '#2B0B45', smoky: '#463052', energy: '#6D28A8', edge: '#A55CFF', accent: '#D0AEFF', silver: '#E4DCF2', white: '#FFFFFF' };
  let H;
  const cl = u => Math.max(0, Math.min(1, u));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  function floorLight(c, X, Y, r, a, col) { if (r < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }

  /* ---- cached sprites ---- */
  /* the sphere's lit body (r = 120 in a 256 box): light from the upper left, a reflected violet rim low right */
  const bodySpr = () => fxSprite('du2body', 256, 256, g => { const x = 128, y = 128, r = 120, gr = g.createRadialGradient(x - r * 0.32, y - r * 0.36, r * 0.04, x + r * 0.06, y + r * 0.08, r * 1.02);
    gr.addColorStop(0, '#5C4670'); gr.addColorStop(0.14, P.smoky); gr.addColorStop(0.4, P.plum); gr.addColorStop(0.72, P.body); gr.addColorStop(1, P.void); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.save(); g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip(); g.strokeStyle = rgbaS(P.energy, 0.28); g.lineWidth = r * 0.16; g.beginPath(); g.arc(x + r * 0.08, y + r * 0.1, r * 0.9, 0.25, 1.95); g.stroke(); g.strokeStyle = rgbaS(P.edge, 0.14); g.lineWidth = r * 0.06; g.beginPath(); g.arc(x + r * 0.08, y + r * 0.1, r * 0.95, 0.45, 1.75); g.stroke(); g.restore(); });
  /* the shade overlay: clear on the lit side, void toward the dark limb (keeps the volume over the moving currents) */
  const shadeSpr = () => fxSprite('du2shade', 256, 256, g => { const x = 128, y = 128, r = 120, gr = g.createRadialGradient(x - r * 0.28, y - r * 0.32, r * 0.1, x + r * 0.04, y + r * 0.06, r * 1.08);
    gr.addColorStop(0, 'rgba(8,5,15,0)'); gr.addColorStop(0.42, 'rgba(8,5,15,0.06)'); gr.addColorStop(0.72, 'rgba(8,5,15,0.4)'); gr.addColorStop(0.9, 'rgba(8,5,15,0.74)'); gr.addColorStop(1, 'rgba(8,5,15,0.9)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); });
  /* a dark halo round the sphere (the air darkened near it, so it reads on a bright floor), every edge soft */
  const haloSpr = () => fxSprite('du2halo', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(8,5,15,0.7)'); gr.addColorStop(0.45, 'rgba(14,8,26,0.4)'); gr.addColorStop(0.75, 'rgba(24,11,46,0.14)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  /* a band round a circle: a dark body with a violet luminous outer edge, feathered both sides (shockwaves, the pulse rings) */
  const bandSpr = () => fxSprite('du2band', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(24,11,46,0)'], [0.62, 'rgba(24,11,46,0)'], [0.74, 'rgba(24,11,46,0.5)'], [0.84, 'rgba(43,11,69,0.7)'], [0.9, 'rgba(109,40,168,0.75)'], [0.945, 'rgba(165,92,255,0.95)'], [0.975, 'rgba(208,174,255,0.5)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  /* the same band in light only (additive): the detonation's violet edge without the dark body */
  const bandLSpr = () => fxSprite('du2bandL', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(109,40,168,0)'], [0.7, 'rgba(109,40,168,0)'], [0.86, 'rgba(109,40,168,0.35)'], [0.94, 'rgba(165,92,255,0.8)'], [0.97, 'rgba(208,174,255,0.9)'], [1, 'rgba(208,174,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  /* the marble: the squeezed sphere's white-hot heart (pale centre, lilac, a violet rim; r = 56 in a 128 box) */
  const marbleSpr = () => fxSprite('du2marble', 128, 128, g => { const gr = g.createRadialGradient(54, 52, 2, 64, 64, 58);
    [[0, '#FFFFFF'], [0.3, '#F4ECFF'], [0.6, P.accent], [0.84, P.edge], [0.94, P.energy], [1, 'rgba(43,11,69,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 58, 0, TAU); g.fill(); });
  /* the negative shell: an inverted sphere of energy (a pale filmy interior brightening toward a dark rim, a violet
     luminous edge outside it), every edge feathered */
  const negSpr = () => fxSprite('du2neg', 256, 256, g => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    [[0, 'rgba(244,236,255,0.35)'], [0.4, 'rgba(236,224,255,0.5)'], [0.62, 'rgba(226,208,255,0.72)'], [0.72, 'rgba(208,174,255,0.6)'], [0.79, 'rgba(70,48,82,0.6)'], [0.86, 'rgba(8,5,15,0.9)'], [0.92, 'rgba(24,11,46,0.7)'], [0.955, 'rgba(165,92,255,0.65)'], [1, 'rgba(165,92,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); });
  /* a puff of violet smoke */
  const puffSpr = () => fxSprite('du2puff', 96, 96, g => { const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48); gr.addColorStop(0, 'rgba(70,48,82,0.55)'); gr.addColorStop(0.5, 'rgba(43,11,69,0.3)'); gr.addColorStop(1, 'rgba(24,11,46,0)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 96); });

  /* ---- the globe's surface: a point at (lon, lat) on a unit sphere whose axis leans toward the viewer by TILT ----
     returns [x, y, z] in sphere radii (screen x right, y down; z > 0 faces the viewer) */
  const TILT = 0.55, CT = Math.cos(TILT), ST = Math.sin(TILT);
  function proj(lon, lat) { const cL = Math.cos(lat), X = cL * Math.sin(lon), Y = Math.sin(lat), Z = cL * Math.cos(lon); return [X, -(Y * CT + Z * ST), Z * CT - Y * ST]; }
  /* the fractures: polylines on the globe in (lon, lat), with a branch each, fixed at the cast */
  function makeCracks(n, seed) { const out = []; for (let i = 0; i < n; i++) { const pts = []; let lon = R1(seed + i * 3.1) * TAU, lat = (R1(seed + i * 5.7) - 0.5) * 1.9, b = R1(seed + i * 7.3) * TAU; pts.push([lon, lat]); for (let k = 1; k <= 5; k++) { b += (R1(seed + i * 11 + k) - 0.5) * 1.5; lon += Math.cos(b) * 0.22; lat = Math.max(-1.3, Math.min(1.3, lat + Math.sin(b) * 0.18)); pts.push([lon, lat]); } const br = []; { const q = pts[2], bb = b + (R1(seed + i * 13) < 0.5 ? 1.4 : -1.4); br.push(q, [q[0] + Math.cos(bb) * 0.2, Math.max(-1.3, Math.min(1.3, q[1] + Math.sin(bb) * 0.16))], [q[0] + Math.cos(bb + 0.5) * 0.36, Math.max(-1.3, Math.min(1.3, q[1] + Math.sin(bb + 0.5) * 0.26))]); } out.push({ pts, br, ph: R1(seed + i * 17) * TAU }); } return out; }
  /* stroke a (lon, lat) polyline on the globe of radius r turned by rot: hidden round the back, feathered at the limb */
  function globePath(c, pts, r, rot, fn) { let last = null; for (let k = 0; k < pts.length; k++) { const p = proj(pts[k][0] + rot, pts[k][1]), vis = p[2] > 0.04; if (last && vis && last[2] > 0.04) { const a = cl(Math.min(p[2], last[2]) / 0.3); if (a > 0.02) fn(last[0] * r, last[1] * r, p[0] * r, p[1] * r, a); } last = p; } }

  /* ---- the sphere: origin (x, y), radius r (px), squashed vertically by sy (the compression), jolt 0..1, crack glow fl 0..1 ---- */
  function drawSphere(c, x, y, r, sy, t, f, fl, AL, ev) {
    if (r < 2 || AL <= 0.01) return;
    const cr = f.cracks, rot = f.rot;
    c.save(); c.translate(x, y); c.scale(1, sy);
    // the lit body
    c.globalAlpha = AL; c.drawImage(bodySpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
    c.save(); c.beginPath(); c.arc(0, 0, r * 0.995, 0, TAU); c.clip();
    // currents under the surface: latitude bands (each turning at its own speed) and dark cells drifting along them
    c.lineCap = 'round'; const lats = f.lats; for (let i = 0; i < lats.length; i++) { const L = lats[i], ro = rot * (1 + 0.35 * Math.sin(i * 2.3)) + i * 1.1; c.beginPath(); let pen = false; for (let k = 0; k <= 28; k++) { const p = proj(k / 28 * TAU + ro, L + Math.sin(k * 0.9 + i + t * 0.3) * 0.04); if (p[2] > 0.03) { if (pen) c.lineTo(p[0] * r, p[1] * r); else c.moveTo(p[0] * r, p[1] * r); pen = true; } else pen = false; } c.strokeStyle = rgbaS(P.void, 0.42); c.lineWidth = r * (0.07 + 0.03 * (i % 2)); c.stroke(); c.strokeStyle = rgbaS(i % 2 ? P.energy : P.smoky, 0.16); c.lineWidth = r * 0.025; c.stroke(); }
    c.fillStyle = rgbaS(P.void, 0.55); c.beginPath(); for (let i = 0; i < 9; i++) { const L = lats[i % lats.length] + 0.06 * (i % 3 - 1), p = proj(rot * (1 + 0.35 * Math.sin((i % lats.length) * 2.3)) + i * 2.1, L); if (p[2] <= 0.08) continue; const s = r * (0.09 + 0.05 * R1(i)) * Math.min(1, p[2] + 0.3); c.moveTo(p[0] * r + s, p[1] * r); c.ellipse(p[0] * r, p[1] * r, s, s * (0.45 + 0.4 * p[2]), 0, 0, TAU); } c.fill();
    c.fillStyle = rgbaS(P.smoky, 0.2); c.beginPath(); for (let i = 0; i < 5; i++) { const L = lats[(i + 2) % lats.length] - 0.05, p = proj(-rot * 0.8 + i * 2.6 + 0.7, L); if (p[2] <= 0.08) continue; const s = r * (0.12 + 0.05 * R1(i + 9)) * Math.min(1, p[2] + 0.3); c.moveTo(p[0] * r + s, p[1] * r); c.ellipse(p[0] * r, p[1] * r, s, s * 0.3, 0, 0, TAU); } c.fill();
    // the shade overlay: the volume stays whatever moved beneath
    c.drawImage(shadeSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
    // the luminous fractures: energy wide, edge thin, accent core when flashing; each breathes on its own phase
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const lw = Math.max(1, r * 0.012);
    for (const k of cr) { const br = 0.3 + 0.2 * Math.sin(t * 2.2 + k.ph) + fl * 0.7, draw = (col, w, a) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); globePath(c, k.pts, r, rot, (x0, y0, x1, y1, q) => { c.moveTo(x0, y0); c.lineTo(x1, y1); }); globePath(c, k.br, r, rot, (x0, y0, x1, y1, q) => { c.moveTo(x0, y0); c.lineTo(x1, y1); }); c.globalAlpha = AL * a; c.stroke(); };
      draw(P.energy, lw * (5 + 4 * fl), 0.3 * br); draw(P.edge, lw * (1.8 + 1.2 * fl), 0.65 * br); if (fl > 0.1) draw(P.accent, lw * 0.9, fl * 0.9); }
    // (the limb feathering: the fractures dim where the globe turns away, by the shade once more at a lower weight)
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = AL * 0.5; c.drawImage(shadeSpr(), -r * 128 / 120, -r * 128 / 120, r * 256 / 120, r * 256 / 120);
    // the specular: a soft pale ellipse high on the lit side, a smaller sharper one inside it
    c.globalAlpha = AL * 0.22; blitSized(c, glowSprite(P.accent), -r * 0.62, -r * 0.66, r * 0.7, r * 0.7); c.globalAlpha = AL * 0.5; c.fillStyle = P.accent; c.beginPath(); c.ellipse(-r * 0.36, -r * 0.4, r * 0.14, r * 0.07, -0.65, 0, TAU); c.fill();
    c.restore();
    // the thin violet limb, brighter toward the lit side
    c.globalAlpha = AL * 0.55; c.strokeStyle = P.edge; c.lineWidth = Math.max(1.2, r * 0.018); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.globalAlpha = AL * 0.6; c.strokeStyle = P.accent; c.lineWidth = Math.max(1, r * 0.012); c.beginPath(); c.arc(0, 0, r, Math.PI * 1.05, Math.PI * 1.7); c.stroke();
    c.restore();
  }
  /* the corona: n thin curved silver filaments off the limb, turning by dir, some flaring; a soft silver ring on the limb */
  function drawCorona(c, x, y, r, sy, t, n, dir, col, len0, AL, ph) {
    if (r < 2 || AL <= 0.01) return; c.save(); c.translate(x, y); c.scale(1, sy); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    c.globalAlpha = AL * 0.2; c.strokeStyle = col; c.lineWidth = r * 0.16; c.beginPath(); c.arc(0, 0, r * 1.06, 0, TAU); c.stroke(); c.globalAlpha = AL * 0.22; c.lineWidth = r * 0.06; c.beginPath(); c.arc(0, 0, r * 1.03, 0, TAU); c.stroke();
    const wide = Math.max(1.5, r * 0.03), thin = Math.max(0.8, r * 0.009);
    for (let i = 0; i < n; i++) { const b = i / n * TAU + t * 0.22 * dir + ph, fk = Math.sin(t * 1.7 + i * 2.39 + ph), flare = fk > 0.82 ? (fk - 0.82) / 0.18 : 0, len = r * len0 * (0.55 + 0.45 * Math.abs(Math.sin(i * 1.31 + t * 0.9 + ph))) * (1 + flare * 1.1), bend = 0.42 * dir * (1 + 0.3 * Math.sin(i + t)), x0 = Math.cos(b) * r * 1.02, y0 = Math.sin(b) * r * 1.02, x1 = Math.cos(b + bend * 0.45) * (r + len * 0.5), y1 = Math.sin(b + bend * 0.45) * (r + len * 0.5), x2 = Math.cos(b + bend) * (r + len), y2 = Math.sin(b + bend) * (r + len), al = 0.5 + 0.3 * Math.sin(t * 3 + i * 1.7) + flare * 0.4;
      c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(x1, y1, x2, y2); c.globalAlpha = AL * al * 0.3; c.strokeStyle = col; c.lineWidth = wide; c.stroke(); c.globalAlpha = AL * al; c.lineWidth = thin; c.stroke();
      if (flare > 0) { c.globalAlpha = AL * flare * 0.7; const gs = r * 0.22; blitSized(c, glowSprite(P.accent), x0 - gs, y0 - gs, gs * 2, gs * 2); } }
    c.restore();
  }
  /* a broken halo segment: a slab of dark stone on a tilted ring round the sphere, its lit top edge and violet outer rim */
  function haloSeg(c, x, y, rx, ry, a0, a1, w, AL, z) { c.save(); c.translate(x, y); c.globalAlpha = AL; c.lineCap = 'butt';
    c.strokeStyle = P.void; c.lineWidth = w * 1.25; c.beginPath(); c.ellipse(0, w * 0.18, rx, ry, 0, a0, a1); c.stroke();
    c.strokeStyle = z > 0 ? P.plum : P.body; c.lineWidth = w; c.beginPath(); c.ellipse(0, 0, rx, ry, 0, a0, a1); c.stroke();
    c.strokeStyle = rgbaS(P.smoky, 0.6); c.lineWidth = Math.max(1, w * 0.22); c.beginPath(); c.ellipse(0, -w * 0.32, rx, ry, 0, a0, a1); c.stroke();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL * (z > 0 ? 0.75 : 0.35); c.strokeStyle = P.edge; c.lineWidth = Math.max(1, w * 0.1); c.beginPath(); c.ellipse(0, 0, rx + w * 0.45, ry + w * 0.45 * ry / rx, 0, a0, a1); c.stroke(); c.restore(); }
  /* a curved shard of dark glass: an arc-shaped plate, plum body, violet edge, a pale glint on its outer curve */
  function glassShard(c, x, y, s, rot, AL, curve, dark) { c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = AL; const ro = s, ri = s * 0.62, a0 = -curve / 2, a1 = curve / 2;
    c.beginPath(); c.arc(0, 0, ro, a0, a1); c.arc(0, 0, ri, a1, a0, true); c.closePath(); c.fillStyle = dark ? P.void : P.plum; c.fill(); c.strokeStyle = rgbaS(P.edge, 0.85); c.lineWidth = 1.2; c.stroke();
    c.beginPath(); c.arc(0, 0, ro * 0.93, a0 + 0.1, a1 - 0.1); c.strokeStyle = rgbaS(P.accent, 0.6); c.lineWidth = 1; c.stroke(); c.restore(); }

  /* ================= D-U01 Eclipse of the Hollow Moon ================= */
  U.hollowmoon = (C, h) => {
    H = h; const me = H.me, x = C.tx, y = C.ty, ev = evoOf(C), CEL = ev >= 7, ADE = ev >= 4, R = 3.4 * C.K, Z = 3.15 - 0.05 * (ev - 1), pulses = [1.1, 1.5, 1.9, 2.3];
    // the finale: squeeze SQ0..SQ1 to MS of the size, the marble hangs to EX0, expands to BIG and bursts at FIN
    const SQ0 = 2.55, SQ1 = 3.0, EX0 = 3.28, FIN = 3.42, MS = 0.12, BIG = 1.35, LIFE = 4.65 + (CEL ? 0.9 : 0);
    const RB = 1.5 + 0.09 * (ev - 1), NC = 4 + ev, NCOR = 14 + 2 * Math.round((ev - 1) * 0.67), NL = 9 + ev, NIN = 12 + 2 * ev, seed = Math.random() * 100;
    const scaleAt = t => t < SQ0 ? 1 : t < SQ1 ? 1 - (1 - MS) * H.ease.in(cl((t - SQ0) / (SQ1 - SQ0))) : t < EX0 ? MS * (1 + 0.06 * Math.sin(t * 53)) : t < FIN ? MS + (BIG - MS) * H.ease.in(cl((t - EX0) / (FIN - EX0))) : BIG;
    const sqAt = t => t < SQ0 ? 0 : cl((t - SQ0) / (SQ1 - SQ0));
    H.warn(x, y, R, 1.1, C.col); H.X.banner('DARK SIDE OF THE MOON', '', C.col, 1.4); H.X.sfx.hum();
    const lats = [-0.95, -0.55, -0.2, 0.15, 0.5, 0.85];
    const streams = []; for (let i = 0; i < 6; i++) streams.push({ b: i / 6 * TAU + R1(seed + i) * 0.5, sp: 0.55 + 0.2 * R1(seed + i * 3), ph: R1(seed + i * 7) });
    const segs = CEL ? [0, 1, 2, 3, 4].map(i => ({ a: i / 5 * TAU + R1(seed + i * 2) * 0.4, len: 0.6 + R1(seed + i * 5) * 0.4 })) : [];
    const shards = [], frags = [];
    H.add({ life: LIFE, x, y, cracks: makeCracks(NC, seed), lats, rot: 0, jolt: 0, jt: -9, fl: 0,
      update(dt, f) {
        // it turns faster as it is squeezed (a spinning body pulled in)
        f.rot += dt * (0.14 + 0.12 * cl((f.t - 2.2) / 0.9) + 2.4 * H.ease.in(sqAt(f.t)) * (f.t < FIN ? 1 : 0));
        // a pulse: the jolt and the fracture flash decay from it
        let flash = 0; for (const t0 of pulses) if (f.t >= t0) flash = Math.max(flash, Math.max(0, 1 - (f.t - t0) / 0.55)); f.fl = flash; f.jolt = 0; for (const t0 of pulses) if (f.t >= t0 && f.t < t0 + 0.3) f.jolt = 1 - (f.t - t0) / 0.3;
        // shadow motes spiralling up from the floor toward the sphere (particles, thinned by Fewer effects)
        if (f.t > 0.3 && f.t < SQ0) { const k = 9 * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, d = R * (0.6 + Math.random() * 0.6), sx = x + Math.cos(b) * d, sy = y + Math.sin(b) * d * 0.6, life = 0.7 + Math.random() * 0.4, tx = x - sx + Math.cos(b + 1.4) * 0.8, ty = (y - Z * 0.9) - sy; H.P({ kind: Math.random() < 0.6 ? 'spark' : 'ember', x: sx, y: sy, vx: tx / life, vy: ty / life, g: 0, life, max: life, size: 1.6 + Math.random() * 1.6, color: Math.random() < 0.5 ? P.edge : Math.random() < 0.5 ? P.energy : P.smoky }); } }
        // the squeeze: sparks sucked in from all round toward the shrinking heart
        if (f.t > SQ0 && f.t < SQ1 - 0.08) { const k = 26 * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0); while (m-- > 0) { const b = Math.random() * TAU, d = RB * (1.6 + Math.random() * 0.9), life = 0.28 + Math.random() * 0.12; H.P({ kind: 'spark', x: x + Math.cos(b) * d, y: y - Z + Math.sin(b) * d, vx: -Math.cos(b) * d / life, vy: -Math.sin(b) * d / life, g: 0, life, max: life, size: 1.4 + Math.random() * 1.4, color: Math.random() < 0.5 ? P.accent : P.edge }); } }
        // the shards and fragments of the burst fly out and fall
        for (const s of shards) { s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.vz -= 9 * dt; s.rot += s.vr * dt; if (s.z < 0) { s.z = 0; s.vz *= -0.3; s.vx *= 0.6; s.vy *= 0.6; } s.a -= dt / 0.95; }
        for (const s of frags) { s.z -= s.vz * dt; s.rot += s.vr * dt; s.x += Math.sin(f.t * 1.3 + s.ph) * 0.3 * dt; }
      },
      drawUnder(c, f, X, Y, T, t) {
        const k = cl(Math.min(f.t / 0.5, (LIFE - f.t) / 0.7)) * (f.t > FIN ? Math.max(0, 1 - (f.t - FIN) / 0.9) : 1), RT = R * T, sq = sqAt(f.t), s = scaleAt(f.t);
        if (k > 0.01) {
          // the violet-lit ring on the floor (light only): a pool, the ring, two turning arcs and ticks
          floorLight(c, X, Y, RT * 1.15, 0.28 * k, P.energy); floorLight(c, X, Y, RT * 0.55, 0.2 * k, P.edge);
          c.save(); c.translate(X, Y); c.scale(1, H.GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          c.globalAlpha = 0.22 * k; c.strokeStyle = P.edge; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.arc(0, 0, RT, 0, TAU); c.stroke(); c.globalAlpha = 0.6 * k; c.lineWidth = 1.5; c.stroke();
          c.globalAlpha = 0.45 * k; c.strokeStyle = P.accent; c.lineWidth = 1.2; for (let i = 0; i < 2; i++) { const b = t * 0.5 * (i ? -1 : 1) + i * 2; c.beginPath(); c.arc(0, 0, RT * (0.72 - i * 0.18), b, b + 2.4); c.stroke(); }
          c.globalAlpha = 0.5 * k; c.strokeStyle = P.edge; c.beginPath(); for (let i = 0; i < 8; i++) { const b = i / 8 * TAU + t * 0.25; c.moveTo(Math.cos(b) * RT * 0.92, Math.sin(b) * RT * 0.92); c.lineTo(Math.cos(b) * RT * 1.0, Math.sin(b) * RT * 1.0); } c.stroke();
          c.restore();
          // the sphere's soft shadow on the floor, shrinking with the squeeze (gone with the burst); the marble lights the floor
          if (f.t < FIN) { H.softShadow(c, X, Y, T * RB * 1.15 * cl(f.t / 0.8) * Math.max(0.25, s), 0.28 * k * (1 - 0.5 * sq)); if (sq > 0) floorLight(c, X, Y, RT * (0.45 + 0.35 * sq), 0.4 * sq * k, P.accent); }
        }
        // each pulse: a dark ring races across the floor and fades (a transient band, never a mark)
        for (const t0 of pulses) { const u = (f.t - t0) / 0.5; if (u <= 0 || u >= 1) continue; const rr = RT * 1.1 * H.ease.out(u), a = (1 - u) * 0.85; c.save(); c.globalAlpha = a; c.drawImage(bandSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); c.restore(); }
        // the burst: a violet-black shockwave over the floor, then light rings
        if (f.t > FIN) { const post = f.t - FIN; for (const [d, sc, w] of [[0, 1.0, 1], [0.1, 1.35, 0.7], [0.28, 1.7, 0.45]]) { const q = cl((post - d) / 0.6); if (q > 0 && q < 1) { const rr = (R + 2.2) * T * sc * H.ease.out(q); c.save(); c.globalAlpha = (1 - q) * w; c.drawImage(d === 0 ? bandSpr() : bandLSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); c.restore(); } }
          floorLight(c, X, Y, RT * 1.4, 0.6 * Math.max(0, 1 - post / 0.8), P.accent); }
      },
      draw(c, f, X, Y, T, t) {
        const form = H.ease.out(cl(f.t / 0.8)), post = f.t - FIN, cy = Y - T * Z, r0 = T * RB * form, s = scaleAt(f.t), sq = sqAt(f.t), r = r0 * s;
        // near the pet the whole effect dims smoothly (never a cut-out)
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5, dP = Math.hypot(PX - X, PY - cy), AL = 0.25 + 0.75 * cl((dP - r0 * 0.7) / (r0 * 0.9 + T * 0.7));
        if (f.t < FIN) {
          // the jolt of a pulse; the trembling of the squeezed marble
          const tr = T * 0.035 * sq * (f.t > SQ1 ? 1.4 : 1), jx = f.jolt * Math.sin(f.t * 60) * T * 0.07 + tr * Math.sin(f.t * 83), jy = f.jolt * Math.cos(f.t * 47) * T * 0.05 + tr * Math.cos(f.t * 71), BX = X + jx, BY = cy + jy, inst = cl((f.t - 2.0) / 1.1);
          const ex = f.t > EX0 ? cl((f.t - EX0) / (FIN - EX0)) : 0, mk = f.t < EX0 ? cl((sq - 0.45) / 0.5) : (1 - ex) * (1 - ex);
          // the air darkened round it (pulled in with the squeeze), and the violet glow through it
          c.save(); c.globalAlpha = AL * 0.8 * form; const hr = Math.max(r * 2.2, r0 * 0.7); c.drawImage(haloSpr(), BX - hr, BY - hr, hr * 2, hr * 2); c.restore();
          glow(c, BX, BY, r * 2.4 + r0 * 0.3 * sq, P.energy, AL * (0.3 + 0.2 * f.fl + 0.1 * sq)); glow(c, BX, BY, r * 1.5 + r0 * 0.12 * sq, P.edge, AL * (0.12 + 0.25 * f.fl + 0.2 * sq));
          // the six streams of shadow motes spiralling up from the floor (points along a spiral, head first)
          if (f.t < SQ0) { c.save(); c.globalCompositeOperation = 'lighter'; const sa = AL * form * (f.t > SQ0 - 0.4 ? (SQ0 - f.t) / 0.4 : 1); for (const s of streams) { const head = (t * s.sp + s.ph) % 1; for (let j = 0; j < 8; j++) { const u = head - j * 0.045; if (u < 0 || u > 1) continue; const b = s.b + u * 3.2 + t * 0.4, rho = T * R * 0.95 * (1 - u) + r * 0.9 * u, px = X + Math.cos(b) * rho, py = (Y + Math.sin(b) * rho * H.GY) * (1 - u) + (BY + Math.sin(b) * rho * 0.5) * u, gs = T * (0.09 + 0.1 * u) * (1 - j / 10); c.globalAlpha = sa * (0.55 - j * 0.06); blitSized(c, glowSprite(j ? P.energy : P.accent), px - gs, py - gs, gs * 2, gs * 2); } } c.restore(); }
          // the squeeze: streaks of light drawn inward from all round toward the shrinking heart (gone once it hangs)
          if (sq > 0 && f.t < SQ1 + 0.15) { const ia = AL * Math.min(sq * 2, 1) * (f.t > SQ1 ? 1 - (f.t - SQ1) / 0.15 : 1); for (let i = 0; i < NIN; i++) { const ph = (f.t * 2.1 + R1(seed + i * 1.7)) % 1, b = R1(seed + i * 2.9) * TAU + f.rot * 0.4, rho = r + r0 * (1.9 - 1.9 * H.ease.in(ph)) * (0.8 + 0.4 * R1(seed + i * 4.1)), px = BX + Math.cos(b) * rho, py = BY + Math.sin(b) * rho, a = ia * Math.sin(ph * Math.PI) * 0.75; H.ray(c, px, py, b + Math.PI, Math.max(2, (rho - r) * 0.55), T * 0.16, i % 3 ? P.edge : P.accent, a); } }
          // Celestial: the broken halo's back segments (crushed with it)
          const HRX = r * 1.55, HRY = r * 0.42; if (CEL) for (let i = 0; i < segs.length; i++) { const sg = segs[i], a0 = sg.a + t * 0.55 + f.rot * 0.5; if (Math.sin(a0 + sg.len / 2) < 0) haloSeg(c, BX, BY, HRX, HRY + r * 0.02, a0, a0 + sg.len, r * 0.13, AL * form, -1); }
          // the corona behind the sphere (silver; a second counter-turning violet layer from Adept), crushed with it
          drawCorona(c, BX, BY, r, 1, t, NCOR, 1, P.silver, 0.55 + 0.1 * (ev - 1) / 6, AL * form * (1 - sq * 0.25), 0); if (ADE) drawCorona(c, BX, BY, r * 1.04, 1, t, Math.round(NCOR * 0.6), -1, P.edge, 0.38, AL * form * 0.8 * (1 - sq * 0.25), 1.3);
          // light leaking from the cracks: rays out of the rim, longer and brighter the smaller it gets, flaring on the expansion
          const lk = Math.max(H.ease.in(sq), ex); if (lk > 0.01) for (let i = 0; i < NL; i++) { const b = i / NL * TAU + R1(seed + i * 5) * 0.5 + f.rot * 0.6, L = r * 1.05 + T * (0.45 + 1.3 * R1(seed + i * 7)) * lk * (0.7 + 0.3 * Math.sin(t * 9 + i * 1.9)) * (1 + ex), w = T * (0.07 + 0.05 * lk) + r * 0.12; H.ray(c, BX, BY, b, L, w, i % 3 ? P.edge : P.accent, AL * lk * (0.45 + 0.25 * Math.sin(t * 13 + i))); }
          // the sphere itself (its fractures blaze as it is squeezed)
          drawSphere(c, BX, BY, Math.max(2.2, r), 1, t, f, Math.max(f.fl, inst * 0.35, sq), AL, ev);
          // the white-hot marble: a solid pale heart over the crushed globe, a violet rim, glow round it
          if (mk > 0.01) { const mr = Math.max(2.4, Math.min(r, r0 * MS * 1.15)) * 1.04, ms = mr * 128 / 56; c.save(); c.globalAlpha = AL * Math.min(1, mk * 1.2); c.drawImage(marbleSpr(), BX - ms / 2, BY - ms / 2, ms, ms); c.restore();
            glow(c, BX, BY, mr * 4.5 + T * 0.35, P.accent, AL * mk * 0.75); glow(c, BX, BY, mr * 2.2 + T * 0.08, P.white, AL * mk * 0.9); glow(c, BX, BY, mr * 9 + T * 0.5, P.edge, AL * mk * 0.3); glow(c, BX, BY, r0 * 1.1, P.energy, AL * mk * 0.22); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = AL * mk * 0.8; c.strokeStyle = P.accent; c.lineWidth = Math.max(1, mr * 0.12); c.beginPath(); c.arc(BX, BY, mr * 1.02, Math.PI * 1.0, Math.PI * 1.75); c.stroke(); c.restore(); }
          if (CEL) for (let i = 0; i < segs.length; i++) { const sg = segs[i], a0 = sg.a + t * 0.55 + f.rot * 0.5; if (Math.sin(a0 + sg.len / 2) >= 0) haloSeg(c, BX, BY, HRX, HRY + r * 0.02, a0, a0 + sg.len, r * 0.13, AL * form, 1); }
        } else {
          // the burst: the shell of negative energy rushing out (pale filmy interior, dark rim, violet edge), dimmed where it passes the pet
          const q = cl(post / 0.62); if (q < 1) { const rr = r0 * (BIG + 2.7 * H.ease.out(q)), AS = 0.3 + 0.7 * cl((dP - rr * 0.35) / (rr * 0.5 + T)); c.save(); c.globalAlpha = Math.pow(1 - q, 1.3) * AS; c.drawImage(negSpr(), X - rr, cy - rr, rr * 2, rr * 2); c.restore(); }
          // the core flash and rays, the air shockwave, the shards, the smoke
          const fl = Math.max(0, 1 - post / 0.3); if (fl > 0) { glow(c, X, cy, r0 * 3.2, P.accent, AL * fl); glow(c, X, cy, r0 * 1.4, P.white, AL * fl * 0.9); }
          const ra = Math.max(0, 1 - post / 0.7); if (ra > 0) { for (let i = 0; i < 10; i++) { const b = i / 10 * TAU + 0.3 + (i % 2) * 0.2, L = r0 * (2.6 + 0.8 * (i % 3)) * H.ease.out(cl(post / 0.3)); H.ray(c, X, cy, b, L, T * (0.35 + 0.2 * (i % 2)), i % 3 ? P.edge : P.accent, 0.55 * ra * AL); } }
          for (const [d, sc, w] of [[0.04, 1.0, 1], [0.16, 1.4, 0.6]]) { const q2 = cl((post - d) / 0.55); if (q2 > 0 && q2 < 1) { const rr = r0 * 3.4 * sc * H.ease.out(q2); c.save(); c.globalAlpha = (1 - q2) * w * AL; c.drawImage(bandSpr(), X - rr, cy - rr, rr * 2, rr * 2); c.restore(); } }
          // the smoke left hanging where it was, thinning
          const sm = Math.max(0, 1 - post / 1.4); if (sm > 0) { c.save(); for (let i = 0; i < 7; i++) { const b = i / 7 * TAU + R1(seed + i * 4) * 0.8, dd = r0 * (0.5 + 1.2 * H.ease.out(cl(post / 0.9))) * (0.7 + 0.5 * R1(seed + i)), pr = r0 * (0.7 + 0.4 * R1(seed + i * 9)) * (0.6 + 0.6 * cl(post / 0.5)); c.globalAlpha = sm * sm * 0.9 * AL; c.drawImage(puffSpr(), X + Math.cos(b) * dd - pr, cy + Math.sin(b) * dd * 0.7 - pr - post * T * 0.4, pr * 2, pr * 2); } c.restore(); }
          for (const s of shards) { if (s.a <= 0) continue; glassShard(c, H.sx(s.x), H.sy(s.y) - s.z * T, T * s.s, s.rot, Math.min(1, s.a * 3) * AL, s.curve, s.dark); }
        }
        // Celestial: a slow rain of dark fragments after
        for (const s of frags) { if (s.z <= 0.05) continue; const a = Math.min(1, s.z / 0.8) * cl((f.t - FIN - 0.3) / 0.3), sx2 = H.sx(s.x), sy2 = H.sy(s.y) - s.z * T, sz = T * s.s; c.save(); c.translate(sx2, sy2); c.rotate(s.rot); c.globalAlpha = a * AL; c.beginPath(); c.moveTo(sz, 0); c.lineTo(-sz * 0.6, sz * 0.5); c.lineTo(-sz * 0.4, -sz * 0.45); c.closePath(); c.fillStyle = P.body; c.fill(); c.strokeStyle = rgbaS(P.edge, 0.7); c.lineWidth = 1; c.stroke(); c.restore(); }
      } });
    // the four pulses: the hit, the floor ring, motes thrown up, a thud (as before)
    pulses.forEach((t0, i) => H.X.after(t0, () => { H.hitArea(x, y, R, C.base * 1.6, C.dmgO({ kb: 2 })); H.X.ring(x, y, 0.3, R, 0.4, i % 2 ? P.accent : P.edge, 0.5); for (let j = 0; j < H.n(10); j++) { const b = Math.random() * TAU, rr = Math.random() * R; H.P({ kind: 'spark', x: x + Math.cos(b) * rr, y: y + Math.sin(b) * rr * H.GY, vx: 0, vy: -5 - Math.random() * 3, life: 0.5, max: 0.5, size: 2, color: j % 3 ? P.edge : P.accent }); } H.X.shake(6, 0.15); H.X.light(x, y, R, 0.2); H.X.sfx.thud(); }));
    // the squeeze (a rising hum), the marble's high whine, the rush of the expansion
    const sfx = (k, ...a) => H.X.sfx[k] && H.X.sfx[k](...a);
    H.X.after(SQ0, () => sfx('hum')); H.X.after(SQ1, () => { sfx('note', 1320, 0.3, 'sine', 0.1, 2400); sfx('note', 1980, 0.26, 'sine', 0.05, 3200, 0.03); H.X.shake(2, 0.28); }); H.X.after(EX0, () => sfx('whoosh'));
    // the burst: the world turns negative for half a second, the boom, the shards, and the ring hit at the same moment
    H.X.after(FIN, () => { if (H.X.negative) H.X.negative(0.5); H.X.flash(0.12, P.accent); H.X.hitstop(0.08); H.X.sfx.crash(); H.X.boom(x, y, 1.6, P.edge, P.accent, { n: 30, shake: 16, smoke: 6 });
      H.hitRing(x, y, 0, R + 2.2, C.base * 4.6, C.dmgO({ kb: 7, stun: 0.5 })); H.X.ring(x, y, 0.5, R + 2.2, 0.6, P.edge, 0.55); H.X.ring(x, y, 0.3, R + 1.2, 0.45, P.accent, 0.35);
      for (let j = 0; j < H.n(12 + 2 * ev); j++) { const b = Math.random() * TAU, v = 3.5 + Math.random() * 5.5, d = RB * BIG * 0.6; shards.push({ x: x + Math.cos(b) * d, y: y + Math.sin(b) * d * 0.5, z: Z - Math.sin(b) * d * 0.5 + (Math.random() - 0.5) * 0.4, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.6, vz: 1 + Math.random() * 4, vr: (Math.random() - 0.5) * 12, rot: b + Math.PI / 2 + (Math.random() - 0.5) * 0.6, s: 0.2 + Math.random() * 0.22 + 0.02 * ev, curve: 0.9 + Math.random() * 0.8, a: 1, dark: j % 2 === 0 }); }
      for (let j = 0; j < H.n(8); j++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: x + Math.cos(b) * 0.5, y: y - Z + Math.sin(b) * 0.3, vx: Math.cos(b) * 1.4, vy: Math.sin(b) * 0.8 - 0.6, life: 1.3, max: 1.3, size: 0.7 + Math.random() * 0.5, color: 'rgba(70,48,82,' }); }
      for (let j = 0; j < H.n(30); j++) H.P({ kind: 'star', x: x + (Math.random() - 0.5) * R * 2, y: y - Z - 1 + Math.random() * 2, vx: 0, vy: 1.5 + Math.random(), life: 1.0, max: 1.0, size: 2.5 + Math.random() * 2, color: j % 2 ? P.accent : P.edge });
      if (CEL) for (let j = 0; j < H.n(18); j++) frags.push({ x: x + (Math.random() - 0.5) * R * 2.2, y: y + (Math.random() - 0.5) * R * 1.4, z: Z + 0.5 + Math.random() * 1.5, vz: 1.1 + Math.random() * 0.9, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 4, s: 0.12 + Math.random() * 0.12, ph: Math.random() * TAU }); });
  };
})();
