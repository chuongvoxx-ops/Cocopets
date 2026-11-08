/* ---------- Lightning's Beast Machine (11th Thunder ult): §9 Judgement Day, the finisher ----------
   The machine, the ctx, the meter and the exit live in 20k9i (U.beastmachine); the Strongs in 20k9j. This file adds
   BEAST_MOVES.judgement(ctx), BEAST_MOVES.TUNE_J and BEAST_MOVES.warmJ (docs/THUNDER-BEAST-BRIEF.md). Every hit goes
   through ctx.hit / ctx.hitArea with noCharge. No timers: one "act" stepped by one fx, which checks ctx.alive() every frame
   and drops everything (and lets the machine down) the moment the form is cancelled.
   The sequence: the crimson fittings flare, the cannon banks fold into their brace and electricity gathers over the body
   while a landing marker and the sphere marks open on the floor; the machine launches high, hangs silhouetted against a
   branching lightning halo, then drops with one clawed hand driven into the ground (one hit in the marked landing area:
   ground fractures of light, shock rims, dust). From the planted hand electrical veins race over the floor to the marks
   and 5/6/7 great lightning spheres form there (a white-gold heart, a translucent blue shell lit from the upper left,
   plasma turning inside, violet filaments wheeling round it on tilted orbits, its back half behind the shell, arcs on its
   skin), arranged round the monsters first (bosses, then the nearest groups) and then in an even pattern over open floor,
   every one reachable by its vein; neighbours are joined by arcs. Four pulses: each lights every sphere's floor ring (the
   damage area, drawn the whole storm) and hits each monster inside any ring once per pulse, however many rings overlap.
   Then the filaments speed up and the outer light is pulled inward to the burst rings, and the field detonates once
   (one hit per monster inside any burst ring): shock rims, bolts climbing into the sky, fragments. The machine shudders
   and pops into a cartoon puff of smoke, loose bolts, nuts, gears and sparks (no damage), and the rider is thrown up and
   lands on standable, reachable floor nearby; then ctx.done(). Floor marks are light only; anything drawn over the
   actors is cut away round the pet; spheres are depth-sorted with the actors (one ent fx each). Sprites are baked once
   (lazily, a little each frame while the gather plays, or ahead through warmJ); particles are pooled. */
(() => {
  const BM = (self.BEAST_MOVES = self.BEAST_MOVES || {});
  const TAU = Math.PI * 2;
  const C = { white: '#FFFFFF', core: '#F4FBFF', cyan: '#5FE4FF', blue: '#3FA8FF', ice: '#BFF2FF', violet: '#8A5CFF', lilac: '#C9B2FF', deep: '#4A2BC8', gold: '#FFD266', amber: '#FFB238', wgold: '#FFF3C4', crimson: '#FF3048', ember: '#FF8A6B', bronze: '#B9803F' };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eio = u => { u = cl(u); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }, eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, ein = u => { u = cl(u); return u * u; };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaH = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };

  /* ---- the numbers (DK = base x K x (1 + 0.08 (evo - 1)); tiers: evo 1-3 / 4-6 / 7) ----
     timeline (s from the press): gather 0.6 | rise 0.42 | hang 0.34 | fall 0.24 -> impact 1.60 | veins 0.5 | form 0.45 |
     pulses at 2.70 3.30 3.90 4.50 | pull-in 0.75 -> burst 5.60 | shudder 0.6 -> pop 6.20 | ejection 1.0 + settle 0.3 ->
     done about 7.5 s (inside B1's ~10 s cap) */
  const TUNE = {
    gather: 0.6, rise: 0.42, hang: 0.34, fall: 0.24, peak: 3.6, range: 4.5, short: 1.8,
    impact: 4.0, impR: 2.4, impKb: 3,
    veins: 0.5, form: 0.45,
    spheres: [5, 6, 7], spread: 6.2, minCore: 1.9, minGap: 2.4, sphR: 1.55, sphVis: 0.86, sphZ: 1.45,
    pulses: 4, pulseDmg: 1.5, pulseIv: 0.6, pulse0: 0.15,
    pull: 0.75, pullGap: 0.35, burst: 10, burstR: 2.1, burstKb: 4,
    shudder: 0.6, eject: 1.0, ejectH: 2.8, ejectD: 2.0, settle: 0.3,
    shadow: true,   /* (draw the machine's own floor shadow while it is in the air; off if B1 draws one) */
  };

  /* ================= baked sprites ================= */
  function imgSprite(key, w, h, fn) { return fxSprite(key, w, h, (g) => { const im = g.createImageData(w, h), d = im.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = fn(x, y, w, h); if (!o) continue; const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[4] != null ? o[4] : 255 * cl(o[3]); } g.putImageData(im, 0, 0); }); }
  function radialSprite(key, w, prof) { const hit = fxCache.get(key); if (hit) return hit; const N = 512, LUT = []; for (let i = 0; i < N; i++) { const o = prof((i + 0.5) / N); if (o) o[4] = Math.round(255 * cl(o[3])); LUT.push(o); } return imgSprite(key, w, w, (x, y) => { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - w / 2) / (w / 2); return d >= 1 ? null : LUT[Math.min(N - 1, (d * N) | 0)]; }); }
  /* the sphere's shell: a translucent electric-blue glass ball lit from the upper left and front (fresnel rim, violet on
     the shadow side, a sharp specular and a soft reflected crescent low right), a feathered halo outside it. R = 50 of 64 */
  const SHR = 50;
  const sprShell = () => imgSprite('bmjShell', 128, 128, (x, y) => {
    const dx = (x + 0.5 - 64) / SHR, dy = (y + 0.5 - 64) / SHR, d = Math.hypot(dx, dy);
    if (d >= 1.26) return null;
    if (d >= 0.985) { const k = 1 - (d - 0.985) / 0.275; return [130, 205, 255, 0.3 * k * k * k]; }
    const nz = Math.sqrt(Math.max(0, 1 - d * d)), lam = cl(-0.5 * dx - 0.62 * dy + 0.6 * nz), fres = Math.pow(1 - nz, 2.2), sh = cl(0.62 * dx + 0.72 * dy) * fres;
    let r = lerp(52, 140, lam), g = lerp(120, 232, lam), b = 255;
    r = lerp(r, 160, sh); g = lerp(g, 96, sh);
    const rim = fres * (1 - sh) * 0.65; r = lerp(r, 214, rim); g = lerp(g, 246, rim);
    let a = 0.06 + 0.5 * fres + 0.1 * lam;
    const sx = dx + 0.38, sy = dy + 0.44, sp = Math.exp(-(sx * sx * 10 + sy * sy * 16)), ref = Math.exp(-Math.pow((d - 0.86) / 0.07, 2)) * cl(0.7 * dx + 0.7 * dy - 0.2) * 0.5;
    r = lerp(r, 255, Math.min(1, sp + ref)); g = lerp(g, 255, Math.min(1, sp + ref * 0.8)); a = Math.max(a, sp * 0.92, ref * 0.7);
    a *= lerp(0.5, 1, sm((0.985 - d) / 0.05)) ;
    return [r, g, b, a]; });
  /* the shell's light (additive): a cyan-white fresnel rim brightest on the lit upper left, a violet fringe on the shadow side */
  const sprRim = () => imgSprite('bmjRim', 128, 128, (x, y) => { const dx = (x + 0.5 - 64) / SHR, dy = (y + 0.5 - 64) / SHR, d = Math.hypot(dx, dy); if (d >= 1.12) return null;
    const lit = cl(0.5 - 0.6 * dx / (d || 1) - 0.7 * dy / (d || 1)), pk = Math.exp(-Math.pow((d - 0.95) / (d < 0.95 ? 0.09 : 0.05), 2)), s = pk * (0.45 + 0.55 * lit) + 0.06 * sm((d - 0.3) / 0.6) * (d < 1 ? 1 : 0); if (s < 0.004) return null;
    return [Math.round(lerp(150, 225, lit)), Math.round(lerp(110, 248, lit)), 255, Math.min(1, s)]; });
  /* plasma turning inside the shell (additive): two swirls of violet and cyan filaments, feathered to nothing */
  const sprSwirl = v => imgSprite('bmjSwirl' + v, 96, 96, (x, y) => {
    const dx = (x + 0.5 - 48) / 46, dy = (y + 0.5 - 48) / 46, d = Math.hypot(dx, dy); if (d >= 1) return null;
    const th = Math.atan2(dy, dx), k1 = v ? 3 : 4, w = Math.sin(k1 * th + (v ? -9 : 8) * d + 1.7 * Math.sin(2 * th + v)) * 0.5 + 0.5, s = Math.pow(w, v ? 5 : 6) * (1 - sm((d - 0.55) / 0.45)) * sm(d / 0.22);
    if (s < 0.01) return null; const k = cl(w * 1.2 - 0.2); return [Math.round(lerp(138, 190, k)), Math.round(lerp(92, 236, k)), 255, s * 0.85]; });
  /* the white-gold heart */
  const sprCore = () => radialSprite('bmjCore', 64, d => { const a = Math.exp(-d * d * 9) + 0.12 * Math.exp(-d * d * 3); const k = cl(1 - d * 2.6); return [255, Math.round(lerp(214, 255, k)), Math.round(lerp(110, 248, k)), Math.min(1, a) * sm((1 - d) / 0.2)]; });
  /* a four-point glint (additive) */
  const sprGlint = col => fxSprite('bmjGl' + col, 32, 32, g => { const [r, gg, b] = hexRGB(col); let gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${r},${gg},${b},0.45)`); gr.addColorStop(0.3, `rgba(${r},${gg},${b},0.15)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    g.fillStyle = 'rgba(255,252,246,0.95)'; for (const [ax, ay, L, W] of [[1, 0, 14, 2], [0, 1, 14, 2], [0.7, 0.7, 7, 1.2], [0.7, -0.7, 7, 1.2]]) { g.beginPath(); g.moveTo(16 + ax * L, 16 + ay * L); g.lineTo(16 - ay * W, 16 + ax * W); g.lineTo(16 - ax * L, 16 - ay * L); g.lineTo(16 + ay * W, 16 - ax * W); g.closePath(); g.fill(); } });
  /* a sphere's floor mark: two rings (cyan, violet dashes), six ticks, a gold hexagon; every line laid soft-wide then bright-thin */
  const sprMark = () => fxSprite('bmjMark', 128, 128, g => { g.lineCap = 'round'; g.lineJoin = 'round';
    const L2 = (fn, col, w) => { for (const [a, k] of [[0.14, 3.4], [0.36, 1.9], [1, 1]]) { fn(); g.strokeStyle = rgbaH(col, a); g.lineWidth = w * k; g.stroke(); } };
    L2(() => { g.beginPath(); g.arc(64, 64, 56, 0, TAU); }, C.cyan, 1.7); g.setLineDash([7, 6]); L2(() => { g.beginPath(); g.arc(64, 64, 45, 0, TAU); }, C.violet, 1.3); g.setLineDash([]);
    L2(() => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = i * TAU / 6; g.moveTo(64 + Math.cos(a) * 48, 64 + Math.sin(a) * 48); g.lineTo(64 + Math.cos(a) * 60, 64 + Math.sin(a) * 60); } }, C.ice, 1.3);
    L2(() => { g.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * TAU / 6 + Math.PI / 6, x = 64 + Math.cos(a) * 22, y = 64 + Math.sin(a) * 22; i ? g.lineTo(x, y) : g.moveTo(x, y); } }, C.gold, 1.4);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 30); gr.addColorStop(0, 'rgba(255,243,196,0.5)'); gr.addColorStop(1, 'rgba(95,228,255,0)'); g.fillStyle = gr; g.fillRect(30, 30, 68, 68); });
  /* the landing marker: a cyan ring with ticks, a dashed gold ring, a crimson-white claw sign in the middle */
  const sprLand = () => fxSprite('bmjLand', 160, 160, g => { g.lineCap = 'round'; g.lineJoin = 'round';
    const L2 = (fn, col, w) => { for (const [a, k] of [[0.14, 3.4], [0.36, 1.9], [1, 1]]) { fn(); g.strokeStyle = rgbaH(col, a); g.lineWidth = w * k; g.stroke(); } };
    L2(() => { g.beginPath(); g.arc(80, 80, 72, 0, TAU); }, C.cyan, 2); g.setLineDash([10, 7]); L2(() => { g.beginPath(); g.arc(80, 80, 60, 0, TAU); }, C.gold, 1.5); g.setLineDash([]);
    L2(() => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.moveTo(80 + Math.cos(a) * 63, 80 + Math.sin(a) * 63); g.lineTo(80 + Math.cos(a) * 76, 80 + Math.sin(a) * 76); } }, C.ice, 1.5);
    L2(() => { g.beginPath(); for (const o of [-14, 0, 14]) { g.moveTo(80 + o * 1.1, 60); g.quadraticCurveTo(80 + o * 1.3 + 4, 80, 80 + o * 0.8, 100); } }, C.crimson, 2.2);
    const gr = g.createRadialGradient(80, 80, 0, 80, 80, 44); gr.addColorStop(0, 'rgba(255,200,200,0.35)'); gr.addColorStop(1, 'rgba(255,48,72,0)'); g.fillStyle = gr; g.fillRect(36, 36, 88, 88); });
  /* rings, radially profiled: 'area' a damage ring (a thin bright rim, a faint haze inside), 'shock' a racing shock rim
     (white-cyan edge, violet haze inside), 'burst' the burst telegraph (a gold-white rim) */
  const sprRing = kind => radialSprite('bmjR' + kind, kind === 'shock' ? 160 : 176, d => {
    const edge = sm((1 - d) / 0.06);
    if (kind === 'shock') { const pk = Math.exp(-Math.pow((d - 0.88) / 0.04, 2)), hz = 0.3 * sm((d - 0.3) / 0.55) * (d < 0.88 ? 1 : 0.35), s = pk + hz; if (s < 0.004) return null; const k = pk / s; return [Math.round(lerp(150, 236, k)), Math.round(lerp(110, 250, k)), 255, Math.min(1, s) * edge]; }
    const gold = kind === 'burst', pk = Math.exp(-Math.pow((d - 0.9) / 0.03, 2)), halo = 0.35 * Math.exp(-Math.pow((d - 0.9) / 0.09, 2)), hz = 0.09 * sm((d - 0.35) / 0.5) * (d < 0.9 ? 1 : 0), s = pk + halo + hz; if (s < 0.004) return null; const k = pk / s;
    return gold ? [255, Math.round(lerp(196, 248, k)), Math.round(lerp(96, 214, k)), Math.min(1, s) * edge] : [Math.round(lerp(70, 226, k)), Math.round(lerp(170, 248, k)), 255, Math.min(1, s) * edge]; });
  /* branching floor fractures of light (impact and burst), and the halo: a jagged ring with branches out of it */
  function boltG(g, pts, w) { g.lineCap = 'round'; g.lineJoin = 'round'; for (const [col, k, a] of [[C.violet, 3.4, 0.28], [C.blue, 1.8, 0.5], [C.cyan, 1, 0.9], [C.white, 0.4, 1]]) { g.strokeStyle = rgbaH(col, a); g.lineWidth = Math.max(0.6, w * k); g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke(); } }
  function jag(x0, y0, x1, y1, s, jit, n) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, pts = [[x0, y0]]; for (let i = 1; i < n; i++) { const u = i / n, o = (R1(s * 7.13 + i * 3.37) - 0.5) * 2 * jit * Math.sqrt(Math.sin(u * Math.PI)); pts.push([x0 + dx * u + nx * o, y0 + dy * u + ny * o]); } pts.push([x1, y1]); return pts; }
  const sprCrack = v => fxSprite('bmjCrack' + v, 256, 256, g => { g.globalCompositeOperation = 'lighter';
    const N = 9; for (let i = 0; i < N; i++) { const a = i / N * TAU + (R1(i + v * 9) - 0.5) * 0.5, L = 70 + 52 * R1(i * 3 + v), x1 = 128 + Math.cos(a) * L, y1 = 128 + Math.sin(a) * L, p = jag(128 + Math.cos(a) * 10, 128 + Math.sin(a) * 10, x1, y1, i + v * 17, 12, 9); boltG(g, p, 2.2 - 0.6 * R1(i + 4));
      for (let k = 0; k < 2; k++) { const q = p[3 + k * 3], b = a + (R1(i * 5 + k + v) - 0.5) * 1.6, l2 = 22 + 26 * R1(i + k * 7 + v); boltG(g, jag(q[0], q[1], q[0] + Math.cos(b) * l2, q[1] + Math.sin(b) * l2, i * 13 + k + v, 6, 5), 1.1); } }
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 40); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(95,228,255,0)'); g.fillStyle = gr; g.fillRect(88, 88, 80, 80); });
  const sprHalo = v => fxSprite('bmjHalo' + v, 256, 256, g => { g.globalCompositeOperation = 'lighter';
    let gr = g.createRadialGradient(128, 128, 20, 128, 128, 128); gr.addColorStop(0, 'rgba(244,251,255,0.5)'); gr.addColorStop(0.45, 'rgba(95,228,255,0.24)'); gr.addColorStop(0.7, 'rgba(138,92,255,0.12)'); gr.addColorStop(1, 'rgba(138,92,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const R = 74, NS = 14, ring = []; for (let i = 0; i <= NS * 3; i++) { const a = i / (NS * 3) * TAU, r = R + (R1(i * 1.7 + v * 5) - 0.5) * 9; ring.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r]); } boltG(g, ring, 2.2);
    for (let i = 0; i < NS; i++) { const a = (i + 0.5) / NS * TAU + (R1(i + v) - 0.5) * 0.3, L = 26 + 26 * R1(i * 2.3 + v * 3), x0 = 128 + Math.cos(a) * R, y0 = 128 + Math.sin(a) * R, p = jag(x0, y0, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L, i * 3 + v * 11, 7, 6); boltG(g, p, 1.5);
      const q = p[3], b = a + (R1(i * 7 + v) - 0.5) * 1.4; boltG(g, jag(q[0], q[1], q[0] + Math.cos(b) * 14, q[1] + Math.sin(b) * 14, i * 5 + v, 4, 4), 0.8); } });
  /* soft cartoon smoke, pale grey-white with a slightly cooler underside (never a dark stain) */
  const sprSmoke = i => fxCache.get('bmjSm' + i) || imgSprite('bmjSm' + i, 64, 64, (() => { let s = 11 + i * 17; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const B = []; for (let k = 0; k < 7; k++) B.push([32 + (R() - 0.5) * 26, 32 + (R() - 0.5) * 22, 8 + R() * 9, 0.5 + R() * 0.6]);
    return (x, y) => { let v = 0; for (const b of B) { const dx = x - b[0], dy = y - b[1]; v += b[3] * Math.exp(-(dx * dx + dy * dy) / (b[2] * b[2])); } const r = Math.hypot(x - 32, y - 32) / 32, a = (1 - Math.exp(-v * 1.5)) * sm((1 - r) / 0.45); if (a < 0.004) return null; const k = cl(v / 1.6), lo = cl((y - 26) / 30) * 0.5; return [Math.round(lerp(176, 236, k) - 28 * lo), Math.round(lerp(176, 234, k) - 26 * lo), Math.round(lerp(196, 246, k) - 12 * lo), a * 0.88]; }; })());
  /* a loose hex nut / bolt and a little gear, bronze lit from the upper left */
  const sprNut = () => fxSprite('bmjNut', 28, 28, g => { const gr = g.createLinearGradient(4, 4, 24, 24); gr.addColorStop(0, '#FFE2A0'); gr.addColorStop(0.45, '#C8903F'); gr.addColorStop(1, '#6E4418'); g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; g.lineTo(14 + Math.cos(a) * 11, 14 + Math.sin(a) * 11); } g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = '#3A2410'; g.lineWidth = 1.4; g.stroke(); g.beginPath(); g.arc(14, 14, 4.2, 0, TAU); g.fillStyle = '#3A2410'; g.fill(); g.strokeStyle = 'rgba(255,240,200,0.7)'; g.lineWidth = 1; g.beginPath(); g.arc(14, 14, 8, 3.6, 4.9); g.stroke(); });
  const sprBolt = () => fxSprite('bmjBolt', 32, 32, g => { g.lineCap = 'round'; const gr = g.createLinearGradient(8, 6, 24, 26); gr.addColorStop(0, '#FFE9B0'); gr.addColorStop(0.5, '#C08A40'); gr.addColorStop(1, '#5E3A14'); g.save(); g.translate(16, 16); g.rotate(0.7); g.fillStyle = gr; g.fillRect(-2.6, -2, 5.2, 14); g.strokeStyle = '#3A2410'; g.lineWidth = 1.1; g.strokeRect(-2.6, -2, 5.2, 14); for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-2.6, 1 + k * 3); g.lineTo(2.6, 2.4 + k * 3); g.stroke(); } g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; g.lineTo(Math.cos(a) * 6.5, -5 + Math.sin(a) * 4); } g.closePath(); g.fillStyle = gr; g.fill(); g.stroke(); g.restore(); });
  const sprGear = () => fxSprite('bmjGear', 36, 36, g => { const gr = g.createLinearGradient(4, 4, 32, 32); gr.addColorStop(0, '#FFF0B8'); gr.addColorStop(0.45, '#E0A84A'); gr.addColorStop(1, '#7A4C18'); g.beginPath(); const n = 9; for (let i = 0; i < n * 2; i++) { const a0 = i / (n * 2) * TAU, r = i % 2 ? 11 : 15; g.lineTo(18 + Math.cos(a0 - 0.12) * r, 18 + Math.sin(a0 - 0.12) * r); g.lineTo(18 + Math.cos(a0 + 0.12) * r, 18 + Math.sin(a0 + 0.12) * r); } g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = '#3A2410'; g.lineWidth = 1.3; g.stroke(); g.beginPath(); g.arc(18, 18, 4.5, 0, TAU); g.fillStyle = '#3A2410'; g.fill(); g.strokeStyle = 'rgba(255,245,210,0.75)'; g.lineWidth = 1.2; g.beginPath(); g.arc(18, 18, 8, 3.5, 5.0); g.stroke(); });
  /* a streak (a fragment's or a speed line's tail): head at the right, white-cyan, tapering to nothing at the left */
  const sprStreak = () => imgSprite('bmjStreak', 128, 32, (x, y, w, h) => { const u = (x + 0.5) / w, hw = 0.1 + 0.9 * Math.pow(u, 0.75), v = (y + 0.5 - h / 2) / (h / 2), q = v / hw;
    if (q * q >= 1) return null; const across = (Math.exp(-q * q * 3.4) - Math.exp(-3.4)) / (1 - Math.exp(-3.4)), a = across * Math.pow(u, 1.6) * Math.min(1, (1 - u) / 0.05 + 0.4), k = cl(across * 1.25) * (0.25 + 0.75 * u);
    return [Math.round(lerp(120, 250, k)), Math.round(lerp(150, 252, k)), 255, a]; });
  const sprShadow = () => radialSprite('bmjShd', 64, d => [24, 18, 36, 0.5 * Math.pow(1 - sm(d), 1.4)]);
  const BAKE = [sprRim, sprMark, sprLand, () => sprRing('area'), () => sprRing('shock'), () => sprRing('burst'), () => sprGlint(C.cyan), () => sprGlint(C.gold), () => sprGlint(C.violet), () => sprGlint(C.crimson), sprShadow, sprStreak,
    () => sprHalo(0), () => sprHalo(1), () => sprCrack(0), () => sprCrack(1), sprShell, () => sprSwirl(0), () => sprSwirl(1), sprCore, () => sprSmoke(0), () => sprSmoke(1), () => sprSmoke(2), sprNut, sprBolt, sprGear,
    () => glowSprite(C.blue), () => glowSprite(C.cyan), () => glowSprite(C.violet), () => glowSprite(C.wgold), () => glowSprite(C.crimson), () => glowSprite(C.white), () => glowSprite(C.gold)];
  let baked = 0;
  function warm(budgetMs) { const t0 = performance.now(), B = budgetMs == null ? 4 : budgetMs; while (baked < BAKE.length && performance.now() - t0 < B) { try { BAKE[baked](); } catch (e) {} baked++; } return baked >= BAKE.length; }

  /* ================= drawing helpers ================= */
  function setT(c, B, x, y, rot, sy) { const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0, k = sy == null ? 1 : sy; c.setTransform(B.a * cs + B.c * k * sn, B.b * cs + B.d * k * sn, -B.a * sn + B.c * k * cs, -B.b * sn + B.d * k * cs, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f); }
  function put(c, B, img, x, y, w, h, a, rot, sy, add) { if (!(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, rot, sy); c.drawImage(img, -w / 2, -h / 2, w, h); }
  /* a light bolt: violet haze, cyan body, white core (additive, 3 strokes) along screen points */
  function strokePts(c, pts, n) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1]); }
  function bolt3(c, pts, w, a, gold, n) { n = n || pts.length; if (n < 2 || !(a > 0.01)) return; c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round'; strokePts(c, pts, n);
    c.globalAlpha = Math.min(1, 0.22 * a); c.strokeStyle = C.violet; c.lineWidth = w * 2.6; c.stroke(); c.globalAlpha = Math.min(1, 0.8 * a); c.strokeStyle = gold ? C.gold : C.cyan; c.lineWidth = w; c.stroke(); c.globalAlpha = Math.min(1, a); c.strokeStyle = C.white; c.lineWidth = Math.max(0.6, w * 0.38); c.stroke(); }
  /* clip the rest of a draw to everything except the pet's body */
  function petHole(c, S) { c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(S.PX, S.PY, S.PR * 0.68, S.PR * 0.8, 0, 0, TAU); c.clip('evenodd'); }

  /* ================= the per-transformation system: one act + pooled particles + depth-sorted ents ================= */
  const POOL = [];
  /* particle kinds: 0 cyan glint, 1 gold glint, 2 violet glint, 3 smoke, 4 streak, 5 flash (white-gold glow), 6 nut,
     7 bolt, 8 gear, 9 crimson glint, 10 dust (pale smoke, low), 11 shock ring pop (flat) */
  const ADD = [1, 1, 1, 0, 1, 1, 0, 0, 0, 1, 0, 1];
  function kitH(ctx) { return ctx.H && ctx.H.add ? ctx.H : ctx.X && ctx.X.add ? ctx.X : null; }
  function zk(ctx, T) { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 1; }
  function sysOf(ctx) {
    if (ctx._bmj && ctx._bmj.on) return ctx._bmj;
    const H = kitH(ctx); if (!H) return null;
    const S = { H, ctx, on: true, keep: false, acts: [], parts: [], ents: [], T: H.X.Tz(), ZT: H.X.Tz(), PX: 0, PY: -1e4, PR: 30 };
    ctx._bmj = S;
    function kill() { for (const a of S.acts) if (a.abort) try { a.abort(); } catch (e) {} S.acts.length = 0; for (const p of S.parts) POOL.push(p); S.parts.length = 0; for (const e of S.ents) e.life = 0; S.ents.length = 0; S.on = false; }
    S.kill = kill;
    S.fx = H.add({ key: 'beast-judgement', life: 1e9,
      update(dt, f) {
        if (!S.on) { f.life = 0; return; }
        let alive = true; try { alive = !ctx.alive || ctx.alive(); } catch (e) { alive = false; }
        if (!alive && !S.keep) { kill(); f.life = 0; return; }
        S.T = H.X.Tz(); S.ZT = S.T * zk(ctx, S.T);
        for (let i = S.acts.length - 1; i >= 0; i--) { const a = S.acts[i]; a.update(dt); if (a.dead) S.acts.splice(i, 1); }
        const P = S.parts; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); POOL.push(p); continue; }
          if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
          if (p.z < 0) { p.z = 0; if (p.bounce && p.vz < -1.2) { p.vz = -p.vz * p.bounce; p.vx *= 0.6; p.vy *= 0.6; p.vr *= 0.6; if (p.snd && p.nb++ < 1) S.bounceSfx = (S.bounceSfx || 0) + 1; } else p.vz = 0; } p.rot += p.vr * dt; }
        if (!S.acts.length && !P.length) { kill(); f.life = 0; }
      },
      drawUnder(c) { if (!S.on) return; petPos(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.under) a.under(c, B); drawParts(S, c, B, 1); c.restore(); },
      draw(c) { if (!S.on) return; petPos(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.over) a.over(c, B); drawParts(S, c, B, 0); c.restore(); },
      onEnd() { if (S.on) kill(); } });
    return S;
  }
  /* an actor-layer draw, depth-sorted with the monsters and the machine (20b sorts ELEM fx with drawEnt by entY) */
  function ent(S, y, fn) { const e = S.H.add({ key: 'beast-judgement-ent', life: 1e9, entY: y, update(dt, f) { if (!S.on) f.life = 0; }, drawEnt(c) { if (!S.on) return; const B = c.getTransform(); c.save(); try { fn(c, B, e); } catch (er) { if (!S.err) { S.err = 1; console.warn("bmj ent", er && er.stack); } } c.restore(); } }); S.ents.push(e); return e; }
  function anchorW(ctx, name) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x)) return p; } catch (e) {} const b = ctx.beast || {}, s = b.scale || 1, ca = Math.cos(b.a || 0), sa = Math.sin(b.a || 0);
    const L = { handL: [1.0, -0.75, 0.3], handR: [1.0, 0.75, 0.3], chest: [0.55, 0, 1.1], eyes: [1.15, 0, 1.15], seat: [-0.1, 0, 1.55], cannonL: [-0.35, -0.6, 1.9], cannonR: [-0.35, 0.6, 1.9], muzzleL: [-0.1, -0.6, 2.4], muzzleR: [-0.1, 0.6, 2.4] }[name] || [0, 0, 1];
    return { x: b.x + (ca * L[0] - sa * L[1]) * s, y: b.y + (sa * L[0] + ca * L[1]) * s * 0.55, z: (b.z || 0) + L[2] * s }; }
  function petPos(S) { const H = S.H, ctx = S.ctx, b = ctx.beast, T = S.T; S.PR = T * 0.95;
    if (ctx.ejecting && ctx.petX != null) { S.PX = H.sx(ctx.petX); S.PY = H.sy(ctx.petY) - ((ctx.petZ || 0) + 0.45) * S.ZT; }
    else if (b && !b.gone) { let s = null; try { s = ctx.seat ? ctx.seat() : null; } catch (e) {} if (!s || !isFinite(s.x)) s = anchorW(ctx, 'seat'); S.PX = H.sx(s.x); S.PY = H.sy(s.y) - ((s.z || 0) + 0.4) * S.ZT; }
    else { S.PX = H.sx(H.me.x); S.PY = H.sy(H.me.y) - 0.45 * T; } }
  const petK = (S, X, Y, lo) => { const d = Math.hypot(X - S.PX, (Y - S.PY) * 1.15) / S.PR; return d >= 1.4 ? 1 : (lo == null ? 0.3 : lo) + (1 - (lo == null ? 0.3 : lo)) * sm((d - 0.35) / 1.05); };
  function part(S, kind, x, y, z, vx, vy, vz, life, size, o) { if (!S || S.parts.length > (LOW() ? 280 : 620)) return null; const p = POOL.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.t = 0; p.size = size; p.g = 0; p.drag = 0; p.rot = 0; p.vr = 0; p.grow = 0; p.a = 1; p.u = 0; p.v = 0; p.fin = 0.1; p.flat = 0; p.bounce = 0; p.snd = 0; p.nb = 0;
    if (o) for (const k in o) p[k] = o[k]; S.parts.push(p); return p; }
  function partImg(p) { switch (p.kind) { case 0: return sprGlint(C.cyan); case 1: return sprGlint(C.gold); case 2: return sprGlint(C.violet); case 3: case 10: return sprSmoke(p.v); case 4: return sprStreak(); case 5: return glowSprite(C.wgold); case 6: return sprNut(); case 7: return sprBolt(); case 8: return sprGear(); case 9: return sprGlint(C.crimson); default: return sprRing('shock'); } }
  function drawParts(S, c, B, under) { const H = S.H, T = S.T, P = S.parts; if (!P.length) return;
    for (let pass = 0; pass < 2; pass++) { c.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      for (let i = 0; i < P.length; i++) { const p = P[i]; if (ADD[p.kind] !== pass || (p.u ? 1 : 0) !== under) continue;
        const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 3 || p.kind === 10 ? (1 - u) * (1 - u) : p.kind >= 6 && p.kind <= 8 ? 1 - sm((u - 0.75) / 0.25) : 1 - u * u); if (a < 0.015) continue;
        const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), img = partImg(p);
        const k = under ? 1 : petK(S, X, Y, pass ? 0.1 : 0.35); if (a * k < 0.015) continue;
        c.globalAlpha = a * k > 1 ? 1 : a * k;
        if (p.kind === 4) { const ang = Math.atan2(p.vy - p.vz * 0.9, p.vx); setT(c, B, X, Y, ang); c.drawImage(img, -s, -s * 0.11, s, s * 0.22); }
        else { setT(c, B, X, Y, p.rot, p.flat ? H.GY : 1); c.drawImage(img, -s / 2, -s / 2, s, s); } } }
    c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }

  /* ================= shared bits ================= */
  const sfx = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  const stand = (ctx, x, y) => { try { return ctx.canStand ? !!ctx.canStand(x, y) : true; } catch (e) { return false; } };
  function flowOf(ctx, H) { const f = ctx.flowAt || (H.X && H.X.flowAt); if (!f) return null; return (x, y) => { try { return f(x, y) < 9999; } catch (e) { return true; } }; }
  function walkTo(x0, y0, x1, y1, ok) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.2)); let bx = x0, by = y0; for (let i = 1; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); if (!ok(x, y)) break; bx = x; by = y; } return [bx, by]; }
  function nearest(ctx, x, y) { try { const p = ctx.nearestStand && ctx.nearestStand(x, y); if (p && isFinite(p.x)) return [p.x, p.y]; if (Array.isArray(p)) return p; } catch (e) {} return [x, y]; }
  function monsOf(ctx, H) { try { if (ctx.mons) { const L = ctx.mons(); if (L) return L; } } catch (e) {} return H.living(); }
  function setup(ctx) { const S = sysOf(ctx); if (!S) return null; const H = S.H, Cc = ctx.C || {}, ev = Math.max(1, Math.min(7, Math.round(ctx.evo || Cc.evo || 1)));
    const base = Cc.base != null ? Cc.base : (H.X.ST ? H.X.ST().atk : 10);
    return { S, H, X: H.X, me: H.me, bm: ctx.beast, ev, tier: ctx.tier != null ? ctx.tier : ev >= 7 ? 2 : ev >= 4 ? 1 : 0, DK: ctx.DK > 0 ? ctx.DK : base * (Cc.K || 1) * (1 + 0.08 * (ev - 1)) }; }
  const CH = ['crouch', 'armLRaise', 'armRRaise', 'armLSlam', 'armRSlam', 'armLReach', 'armRReach', 'cannonTilt', 'recoilL', 'recoilR', 'cannonFold', 'torsoDip', 'glow', 'charge', 'shudder', 'legsExt', 'handsIn'];

  /* ================= planning ================= */
  /* where the machine lands: a little short of the crowd round the target (the hand reaches it), held to range, walked
     back from the first spot it could not stand on (never through a wall), standable and reachable on foot */
  function planLanding(ctx, H, bm, L) {
    const x0 = bm.x, y0 = bm.y; let tg = null; try { tg = ctx.target && ctx.target(); } catch (e) {}
    let tx, ty;
    if (tg && tg.m && !tg.m.dead) { let sx = 0, sy = 0, n = 0; for (const m of L) if (Math.hypot(m.x - tg.m.x, m.y - tg.m.y) < 2.8) { sx += m.x; sy += m.y; n++; } tx = n ? sx / n : tg.m.x; ty = n ? sy / n : tg.m.y; }
    else if (tg && isFinite(tg.x)) { tx = tg.x; ty = tg.y; } else { tx = x0 + Math.cos(bm.a || 0) * 3; ty = y0 + Math.sin(bm.a || 0) * 3; }
    let dx = tx - x0, dy = ty - y0, d = Math.hypot(dx, dy);
    if (d < 0.05) { dx = Math.cos(bm.a || 0); dy = Math.sin(bm.a || 0); d = 1; }
    const want = Math.max(0, Math.min(TUNE.range, d - Math.min(TUNE.short, d * 0.5)));
    tx = x0 + dx / d * want; ty = y0 + dy / d * want;
    let reach = flowOf(ctx, H); if (reach && !reach(x0, y0)) reach = null;   /* (the flow field has not caught up with the machine) */
    const ok = (x, y) => stand(ctx, x, y) && (!reach || reach(x, y));
    let [lx, ly] = walkTo(x0, y0, tx, ty, ok);
    if (!ok(lx, ly)) { [lx, ly] = stand(ctx, x0, y0) ? [x0, y0] : nearest(ctx, x0, y0); }
    return { x: lx, y: ly, dir: Math.atan2(dy, dx) };
  }
  /* the sphere places: round the monsters first (bosses, then by distance; the centroid of a little group), then an
     even pattern (farthest-point) over open floor; each within `spread` of the landing point, at least `minCore` from
     it (the machine and the rider stay clear), `minGap` apart, on open floor, its vein clear of walls */
  function planSpheres(H, lx, ly, N, L) {
    const X = H.X, tu = TUNE, out = [];
    const open = (x, y) => { try { return !X.blocked(x, y, 0.35, 0); } catch (e) { return true; } };
    const clear = (x, y) => { const d = Math.hypot(x - lx, y - ly), n = Math.ceil(d / 0.3); for (let i = 1; i <= n; i++) { const u = i / n; try { if (X.blocked(lerp(lx, x, u), lerp(ly, y, u), 0.08, 1)) return false; } catch (e) { return true; } } return true; };
    const valid = (x, y, gap) => { const d = Math.hypot(x - lx, y - ly); if (d > tu.spread || d < tu.minCore) return false; for (const s of out) if (Math.hypot(s.x - x, s.y - y) < gap) return false; return open(x, y) && clear(x, y); };
    const cand = L.filter(m => Math.hypot(m.x - lx, m.y - ly) < tu.spread + 0.8).sort((p, q) => (q.boss ? 1 : 0) - (p.boss ? 1 : 0) || Math.hypot(p.x - lx, p.y - ly) - Math.hypot(q.x - lx, q.y - ly));
    const covered = m => out.some(s => Math.hypot(m.x - s.x, m.y - s.y) < tu.sphR + (m.r || 0.4) * 0.5);
    for (const m of cand) { if (out.length >= N) break; if (covered(m)) continue;
      let cx = 0, cy = 0, n = 0; for (const q of cand) if (!covered(q) && Math.hypot(q.x - m.x, q.y - m.y) < 1.3) { cx += q.x; cy += q.y; n++; } cx /= n; cy /= n;
      let d = Math.hypot(cx - lx, cy - ly); if (d < tu.minCore) { const a = d > 0.05 ? Math.atan2(cy - ly, cx - lx) : Math.random() * TAU; cx = lx + Math.cos(a) * tu.minCore; cy = ly + Math.sin(a) * tu.minCore; d = tu.minCore; }
      if (d > tu.spread) { cx = lx + (cx - lx) / d * tu.spread; cy = ly + (cy - ly) / d * tu.spread; }
      let put = null; if (valid(cx, cy, tu.minGap)) put = [cx, cy];
      else for (let k = 0; k < 12 && !put; k++) { const a = k / 12 * TAU, r = 0.6 + 0.35 * (k % 3); const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.8; if (Math.hypot(x - m.x, y - m.y) < tu.sphR * 0.85 && valid(x, y, tu.minGap)) put = [x, y]; }
      if (put) out.push({ x: put[0], y: put[1], foe: true }); }
    // the even pattern: rings of candidates round the landing point; each pick the one farthest from the others
    // (and a little toward the monsters' side), relaxing the spacing in a cramped room
    const C2 = []; for (const r of [3.0, 4.3, 5.4, 2.2]) for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + r; C2.push([lx + Math.cos(a) * r, ly + Math.sin(a) * r * 0.85]); }
    let fx = 0, fy = 0; for (const m of cand) { fx += m.x - lx; fy += m.y - ly; } const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
    for (const gap of [tu.minGap, tu.minGap * 0.8, tu.minGap * 0.62]) {
      while (out.length < N) { let best = null, bs = -1e9;
        for (const p of C2) { if (!valid(p[0], p[1], gap)) continue; let dm = 9; for (const s of out) dm = Math.min(dm, Math.hypot(s.x - p[0], s.y - p[1])); const sc = dm + 0.35 * ((p[0] - lx) * fx + (p[1] - ly) * fy) / Math.hypot(p[0] - lx, p[1] - ly) - 0.08 * Math.hypot(p[0] - lx, p[1] - ly); if (sc > bs) { bs = sc; best = p; } }
        if (!best) break; out.push({ x: best[0], y: best[1], foe: false }); }
      if (out.length >= N) break; }
    return out;
  }
  /* which spheres an arc joins: a spanning tree (nearest first) and up to two extra short links */
  function planEdges(sp) { const E = [], n = sp.length; if (n < 2) return E; const inT = [0], D = (i, j) => Math.hypot(sp[i].x - sp[j].x, sp[i].y - sp[j].y);
    while (inT.length < n) { let bi = -1, bj = -1, bd = 1e9; for (const i of inT) for (let j = 0; j < n; j++) if (!inT.includes(j) && D(i, j) < bd) { bd = D(i, j); bi = i; bj = j; } inT.push(bj); E.push([bi, bj]); }
    let extra = 0; for (let i = 0; i < n && extra < 2; i++) for (let j = i + 1; j < n && extra < 2; j++) if (D(i, j) < 3.4 && !E.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i))) { E.push([i, j]); extra++; }
    return E; }
  /* a vein over the floor (world points) from the hand to a mark, with a side branch or two */
  function planVein(x0, y0, x1, y1, s) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(6, Math.round(d / 0.35)), nx = -(y1 - y0) / (d || 1), ny = (x1 - x0) / (d || 1), pts = [], ds = [];
    for (let i = 0; i <= n; i++) { const u = i / n, o = i && i < n ? (R1(s * 3.1 + i * 1.93) - 0.5) * 0.55 * Math.sqrt(Math.sin(u * Math.PI)) : 0; pts.push([lerp(x0, x1, u) + nx * o, lerp(y0, y1, u) + ny * o]); ds.push(d * u); }
    const br = []; for (let k = 0; k < 2; k++) { const i = Math.floor(n * (0.3 + 0.35 * k)), p = pts[i], b = Math.atan2(y1 - y0, x1 - x0) + (k ? 1 : -1) * (0.6 + 0.5 * R1(s + k)), L = 0.6 + 0.6 * R1(s * 2 + k), q = []; for (let j = 0; j <= 4; j++) { const u = j / 4; q.push([p[0] + Math.cos(b) * L * u + (j && j < 4 ? (R1(s + k * 7 + j) - 0.5) * 0.25 : 0), p[1] + Math.sin(b) * L * u + (j && j < 4 ? (R1(s + k * 11 + j) - 0.5) * 0.25 : 0)]); } br.push({ at: ds[i], pts: q, L }); }
    return { pts, ds, d, br }; }

  /* ================= Judgement Day ================= */
  function judgement(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E || !E.bm) { done(); return; }
    const { S, H, X, me, bm, tier, DK } = E, tu = TUNE, K = TK.bind(H), NS = tu.spheres[tier];
    const pose = bm.pose || (bm.pose = {}); for (const k of CH) if (pose[k] == null) pose[k] = 0;
    bm.locked = true; bm.contact = false; bm.vx = bm.vy = 0; bm.scale0 = bm.scale || 1;
    const x0 = bm.x, y0 = bm.y, z0 = bm.z || 0, a0 = bm.a || 0;
    const L0 = monsOf(ctx, H), LP = planLanding(ctx, H, bm, L0), lx = LP.x, ly = LP.y;
    const sph = planSpheres(H, lx, ly, NS, L0).map((p, i) => ({ i, x: p.x, y: p.y, z: tu.sphZ, foe: p.foe, seed: i * 3.7 + 1.3, sc: 0, a: 0, pk: 0, on: false, t0: 0, vein: null, zap: [], ph: R1(i + 0.5) * TAU }));
    const edges = planEdges(sph);
    // the timeline
    const TG = tu.gather, TR = TG + tu.rise, TH = TR + tu.hang, TI = TH + tu.fall, TV = TI + tu.veins, TS = TV + tu.form, TPs = [];
    for (let k = 0; k < tu.pulses; k++) TPs.push(TS + tu.pulse0 + k * tu.pulseIv);
    const TP = TPs[TPs.length - 1] + tu.pullGap, TB = TP + tu.pull, TPOP = TB + tu.shudder;
    const dist = Math.hypot(lx - x0, ly - y0), aT = dist > 0.8 ? Math.atan2(ly - y0, lx - x0) : a0;
    let dA = aT - a0; while (dA > Math.PI) dA -= TAU; while (dA < -Math.PI) dA += TAU; if (Math.abs(dA) > 2.6) dA = 0;   /* (no implausible spin: from behind, it leaps without turning) */
    let t = 0, ph = 'gather', landed = false, burst = null, popped = null, ej = null, finished = false, lastP = -1, pIdx = 0, hand = 'R', handP = null, warmed = false;
    const veins = [], impacts = [], pulses = [], zaps = [];
    ctx.judgementPlan = { lx, ly, R: tu.impR, spheres: sph.map(s => ({ x: s.x, y: s.y, r: tu.sphR, rb: tu.burstR })) };   /* (for tests / B1's debugging; read-only) */
    sfx(X, 'note', 196, 0.9, 'sawtooth', 0.05, 784); sfx(X, 'note', 98, 0.9, 'sine', 0.2, 196); sfx(X, 'hiss', 0.6, 0.12, 2400); sfx(X, 'hum');
    const pose0 = {}; for (const k of CH) pose0[k] = pose[k];
    function setPose(o) { for (const k of CH) pose[k] = o[k] || 0; }
    const sphOf = () => sph;
    // ---- the spheres: one depth-sorted ent each (so the machine, the rider and the monsters sit in front of or behind them) ----
    for (const s of sph) s.ent = ent(S, s.y + 0.02, (c, B) => drawSphere(c, B, s));
    // the halo and the charge glow just behind the machine
    const back = ent(S, bm.y - 0.06, (c, B) => drawBack(c, B));

    const act = { update(dt) { t += dt;
        if (!warmed) warmed = warm(1.5);
        back.entY = bm.y - 0.06;
        if (!finished) stepMachine(dt);
        // veins grow, spheres form
        for (const v of veins) v.t += dt;
        for (const s of sph) { if (!s.on && s.vein && s.vein.t >= s.vein.arr) { s.on = true; s.t0 = t; formFx(s); }
          if (s.on) { const u = (t - s.t0) / tu.form; s.sc = burst ? Math.max(0, 1 - burst.t / 0.12) : u < 1 ? Math.max(0, H.ease.back(cl(u))) : 1; if (ph === 'pull') s.sc *= 1 - 0.14 * sm((t - TP) / tu.pull); s.a = Math.min(1, u * 2); }
          s.pk = Math.max(0, s.pk - dt * 4); s.z = tu.sphZ + 0.08 * Math.sin(t * 2.2 + s.ph); }
        // the pulses
        while (pIdx < TPs.length && t >= TPs[pIdx]) pulse(pIdx++);
        for (let i = pulses.length - 1; i >= 0; i--) { pulses[i].t += dt; if (pulses[i].t > 0.55) pulses.splice(i, 1); }
        for (let i = zaps.length - 1; i >= 0; i--) { zaps[i].t += dt; if (zaps[i].t > 0.24) zaps.splice(i, 1); }
        for (let i = impacts.length - 1; i >= 0; i--) { impacts[i].t += dt; if (impacts[i].t > 1.4) impacts.splice(i, 1); }
        if (ph === 'storm' && t >= TP) { ph = 'pull'; sfx(X, 'note', 300, tu.pull + 0.1, 'sawtooth', 0.06, 1800); sfx(X, 'note', 150, tu.pull, 'sine', 0.2, 600); sfx(X, 'hiss', tu.pull, 0.14, 3400); }
        if (ph === 'pull') pullFx(dt);
        if (ph === 'pull' && t >= TB) { ph = 'burst'; detonate(); }
        if (burst) { burst.t += dt; if (burst.t > 1.6) burst.done = true; }
        if (ph === 'burst' && t >= TPOP && !popped) pop();
        if (popped) popped.t += dt;
        if (ej) stepEject(dt);
        if (S.bounceSfx) { if (S.bounceSfx > 0 && Math.random() < 0.5) sfx(X, 'bounce', 0.12); S.bounceSfx = 0; }
        if (finished && (!burst || burst.done) && !ej && (!popped || popped.t > 1.2)) act.dead = true; },
      under(c, B) { drawUnder(c, B); c.setTransform(B); },
      over(c, B) { drawOver(c, B); c.setTransform(B); },
      abort() { if (!popped) { bm.z = 0; try { setPose(pose0); } catch (e) {} } } };
    S.acts.push(act);

    /* ---- the machine: gather, launch, hang, fall, impact, hold, shudder ---- */
    function stepMachine(dt) {
      const P = {};
      if (t < TG) { const u = t / TG; P.glow = sm(u / 0.35); P.cannonFold = eio(u / 0.8); P.charge = sm(u); P.crouch = 0.65 * eio(u); P.torsoDip = 0.3 * sm(u); P.handsIn = 0.3 * sm(u);
        bm.a = a0 + dA * eio(u); bm.z = z0 * (1 - sm(u / 0.4));
        gatherFx(dt, u); }
      else if (t < TR) { if (ph === 'gather') { ph = 'rise'; launchFx(); }
        const u = (t - TG) / tu.rise, e = eout(u); bm.x = lerp(x0, lerp(x0, lx, 0.62), e); bm.y = lerp(y0, lerp(y0, ly, 0.62), e); bm.z = tu.peak * e; bm.a = a0 + dA;
        P.glow = 1; P.cannonFold = 1; P.charge = 1; P.legsExt = sm(u / 0.5); P.handsIn = 0.6; P.crouch = 0.65 * (1 - sm(u / 0.25)); risingFx(dt); }
      else if (t < TH) { if (ph === 'rise') { ph = 'hang'; sfx(X, 'crack'); sfx(X, 'chime', 1318, 0.6); sfx(X, 'note', 1568, 0.4, 'sine', 0.06, 2093); X.light && X.light(bm.x, bm.y, 6, 0.4); }
        const u = (t - TR) / tu.hang; bm.x = lerp(lerp(x0, lx, 0.62), lerp(x0, lx, 0.82), u); bm.y = lerp(lerp(y0, ly, 0.62), lerp(y0, ly, 0.82), u); bm.z = tu.peak + 0.25 * Math.sin(u * Math.PI);
        P.glow = 1; P.cannonFold = 1; P.charge = 1; P.legsExt = 1; P.handsIn = 0.6 * (1 - u); P['arm' + hand + 'Raise'] = sm(u / 0.7); P.torsoDip = -0.0; }
      else if (t < TI) { if (ph === 'hang') { ph = 'fall'; sfx(X, 'whoosh'); sfx(X, 'note', 660, tu.fall + 0.1, 'sawtooth', 0.05, 160); }
        const u = (t - TH) / tu.fall, e = ein(u); bm.x = lerp(lerp(x0, lx, 0.82), lx, eout(u)); bm.y = lerp(lerp(y0, ly, 0.82), ly, eout(u)); bm.z = (tu.peak + 0) * (1 - e);
        P.glow = 1; P.cannonFold = 1; P.charge = 1; P.legsExt = 1 - u * 0.6; P['arm' + hand + 'Raise'] = 1 - sm(u / 0.6); P['arm' + hand + 'Slam'] = sm(u / 0.8); P.torsoDip = 0.4 * u; P['arm' + (hand === 'R' ? 'L' : 'R') + 'Reach'] = 0.3 * u; fallFx(dt); }
      else if (!popped) { if (!landed) impact();
        const u = t - TI, comp = Math.exp(-u * 5) * Math.cos(u * 14) * 0.5;
        bm.x = lx; bm.y = ly; bm.z = 0;
        P.glow = 1; P.cannonFold = 1; P['arm' + hand + 'Slam'] = 1; P['arm' + (hand === 'R' ? 'L' : 'R') + 'Slam'] = 0.22 * sm(u / 0.2); P.crouch = cl(0.5 + comp); P.torsoDip = cl(0.62 + comp);
        P.charge = ph === 'pull' ? 0.7 + 0.3 * sm((t - TP) / tu.pull) : ph === 'burst' ? Math.max(0, 1 - (t - TB) / 0.3) : 0.45 + 0.35 * (sph.length ? Math.max(...sph.map(s => s.pk)) : 0);
        if (ph === 'pull') { P.crouch = 0.5 + 0.25 * sm((t - TP) / tu.pull); P.torsoDip = 0.62 + 0.2 * sm((t - TP) / tu.pull); }
        if (ph === 'burst') { const v = (t - TB) / tu.shudder; P['arm' + hand + 'Slam'] = 1 - sm(v / 0.5); P.crouch = 0.4; P.torsoDip = 0.3; P.shudder = sm(v / 0.15); P.cannonFold = 1 - 0.5 * sm(v); shudderFx(dt, v); bm.scale = (bm.scale0 || 1) * (1 + 0.025 * Math.sin(t * 70) * sm(v / 0.2) + 0.12 * sm((v - 0.82) / 0.18)); } }
      if (!popped) setPose(P); }

    /* ---- effects ---- */
    function gatherFx(dt, u) { const ch = anchorW(ctx, 'chest'), q = LOW() ? 0.35 : 1;
      let k = 34 * dt * q + Math.random(); while (k-- >= 1) { const a = Math.random() * TAU, r = rnd(1.6, 2.8), z = rnd(0.2, 2.2), x = ch.x + Math.cos(a) * r, y = ch.y + Math.sin(a) * r * 0.7, life = rnd(0.28, 0.4);
        part(S, Math.random() < 0.7 ? 0 : 2, x, y, z, (ch.x - x) / life, (ch.y - y) / life, (ch.z - z) / life, life, rnd(0.22, 0.34), { fin: 0.05 }); }
      if (Math.random() < 12 * dt * q) { const nm = ['eyes', 'chest', 'cannonL', 'cannonR'][(Math.random() * 4) | 0], p = anchorW(ctx, nm); part(S, 9, p.x, p.y, p.z, 0, 0, 0.4, 0.22, rnd(0.35, 0.55), { fin: 0.03 }); }
      if (Math.floor(t / 0.12) !== Math.floor((t - dt) / 0.12)) sfx(X, 'note', 520 + 600 * u, 0.1, 'square', 0.025, 700 + 600 * u); }
    function launchFx() { sfx(X, 'whoosh'); sfx(X, 'thud'); sfx(X, 'note', 110, 0.5, 'sine', 0.4, 330); X.shake && X.shake(RM() ? 2 : 5, 0.18);
      const L = LOW(); for (let i = 0; i < (L ? 6 : 14); i++) { const a = i / 14 * TAU + Math.random() * 0.3, v = rnd(2, 3.6); part(S, 10, x0 + Math.cos(a) * 0.9, y0 + Math.sin(a) * 0.6, 0.1, Math.cos(a) * v, Math.sin(a) * v * 0.6, 0.3, rnd(0.6, 0.9), rnd(0.6, 0.9), { grow: 1.2, a: 0.55, u: 1, v: i % 3, drag: 2.4, rot: Math.random() * TAU }); }
      part(S, 11, x0, y0, 0.05, 0, 0, 0, 0.4, 1.6, { grow: 1.6, fin: 0.01, u: 1, flat: 1 });
      for (let i = 0; i < (L ? 6 : 16); i++) { const a = Math.random() * TAU, v = rnd(2, 5); part(S, i % 3 ? 0 : 1, x0, y0, 0.3, Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(2, 5), rnd(0.35, 0.6), 0.3, { g: 7, drag: 1.5 }); } }
    function risingFx(dt) { if (Math.random() < (LOW() ? 6 : 18) * dt) { const p = anchorW(ctx, Math.random() < 0.5 ? 'handL' : 'handR'); part(S, 4, p.x + rnd(-0.4, 0.4), p.y, p.z - 0.2, 0, 0, -9, 0.22, rnd(1.0, 1.6), { fin: 0.02 }); } }
    function fallFx(dt) { if (Math.random() < (LOW() ? 10 : 30) * dt) { const a = Math.random() * TAU, r = rnd(0.6, 1.4); part(S, 4, bm.x + Math.cos(a) * r, bm.y + Math.sin(a) * r * 0.5, (bm.z || 0) + rnd(1.0, 2.6), 0, 0, 11, 0.16, rnd(1.4, 2.2), { fin: 0.02 }); } }
    function impact() { landed = true; bm.x = lx; bm.y = ly; bm.z = 0; bm.vx = bm.vy = 0; handP = anchorW(ctx, 'hand' + hand);
      let n = 0; try { n = ctx.hitArea(lx, ly, tu.impR, DK * tu.impact, { noCharge: true, kb: tu.impKb }); } catch (e) {}
      impacts.push({ x: handP.x, y: handP.y, t: 0, R: tu.impR, cx: lx, cy: ly, v: (Math.random() * 2) | 0, rot: Math.random() * TAU });
      X.shake && X.shake(RM() ? 4 : 12, 0.35); X.flash && X.flash(RM() ? 0.08 : 0.18, '#DDF4FF'); X.hitstop && X.hitstop(n ? 0.07 : 0.03); X.light && X.light(lx, ly, 7, 0.55);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'stomp'); sfx(X, 'note', 55, 1.0, 'sine', 0.7, 30); sfx(X, 'note', 110, 0.6, 'triangle', 0.25, 55); sfx(X, 'crack');
      const L = LOW(), hx = handP.x, hy = handP.y;
      for (let i = 0; i < (L ? 6 : 14); i++) { const a = i / 14 * TAU + Math.random() * 0.3, v = rnd(2.5, 4.5); part(S, 10, hx + Math.cos(a) * 0.5, hy + Math.sin(a) * 0.35, 0.1, Math.cos(a) * v, Math.sin(a) * v * 0.6, 0.6, rnd(0.8, 1.2), rnd(0.7, 1.1), { grow: 1.3, a: 0.5, u: Math.random() < 0.6 ? 1 : 0, v: i % 3, drag: 2.2, rot: Math.random() * TAU }); }
      for (let i = 0; i < (L ? 10 : 26); i++) { const a = Math.random() * TAU, v = rnd(3, 8); part(S, i % 4 === 0 ? 1 : i % 4 === 1 ? 2 : 0, hx, hy, 0.2, Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(2, 7), rnd(0.4, 0.75), rnd(0.28, 0.42), { g: 9, drag: 1.4 }); }
      for (let i = 0; i < (L ? 6 : 14); i++) { const a = i / 14 * TAU, v = rnd(8, 12); part(S, 4, hx + Math.cos(a) * 0.4, hy + Math.sin(a) * 0.3, 0.2, Math.cos(a) * v, Math.sin(a) * v * 0.6, 0.5, 0.28, rnd(1.2, 1.8), { drag: 3, fin: 0.02 }); }
      // the veins set off from the planted hand: each arrives in turn (nearest first), the far ones a little later
      const md = Math.max(1, ...sph.map(s => Math.hypot(s.x - hx, s.y - hy)));
      for (const s of sph) { const v = planVein(hx, hy, s.x, s.y, s.seed * 5); v.t = 0; v.arr = 0.06 + (tu.veins - 0.06) * v.d / md; v.s = s; s.vein = v; veins.push(v); }
      sfx(X, 'hiss', 0.5, 0.18, 3000); ph = 'storm'; }
    function formFx(s) { const L = LOW(); part(S, 5, s.x, s.y, s.z, 0, 0, 0, 0.25, 2.2, { fin: 0.01 }); part(S, 11, s.x, s.y, 0.05, 0, 0, 0, 0.45, tu.sphR * 1.2, { grow: 1.0, fin: 0.01, u: 1, flat: 1 });
      for (let i = 0; i < (L ? 4 : 10); i++) { const a = Math.random() * TAU, v = rnd(2, 4.5); part(S, i % 3 ? 0 : 2, s.x, s.y, s.z, Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(-1, 3), rnd(0.3, 0.55), rnd(0.25, 0.4), { drag: 2.2 }); }
      X.light && X.light(s.x, s.y, 2.6, 0.3); sfx(X, 'chime', 880 * Math.pow(1.122, s.i), 0.35); if (s.i % 2 === 0) sfx(X, 'crack'); }
    /* a pulse: every monster inside any sphere's floor ring is hit once (a set for the pulse; the ring is the telegraph) */
    function pulse(k) { const hit = new Set(), live = sph.filter(s => s.on);
      for (const m of monsOf(ctx, H)) { if (m.dead) continue; for (const s of live) if (Math.hypot(m.x - s.x, m.y - s.y) < tu.sphR + (m.r || 0.4)) { if (!hit.has(m)) { hit.add(m); zaps.push({ s, m, x: m.x, y: m.y, t: 0, sd: Math.random() * 99 }); } break; } }
      let n = 0; for (const m of hit) { try { ctx.hit(m, DK * tu.pulseDmg, { noCharge: true, kb: 0.4 }); } catch (e) {} n++; part(S, 5, m.x, m.y, 0.6, 0, 0, 0, 0.18, 1.1, { fin: 0.01 }); for (let i = 0; i < (LOW() ? 2 : 5); i++) { const a = Math.random() * TAU, v = rnd(2, 5); part(S, i % 2, m.x, m.y, 0.5, Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(1, 4), rnd(0.3, 0.5), 0.3, { g: 8, drag: 1.5 }); } }
      for (const s of live) { s.pk = 1; pulses.push({ s, t: 0 }); }
      X.shake && X.shake(RM() ? 1.5 : 3 + k, 0.14); X.light && live.length && X.light(lx, ly, 6, 0.35); if (n) X.hitstop && X.hitstop(0.025);
      sfx(X, 'crack'); sfx(X, 'note', 220 * Math.pow(1.19, k), 0.35, 'square', 0.05, 110 * Math.pow(1.19, k)); sfx(X, 'note', 880 * Math.pow(1.19, k), 0.25, 'sine', 0.1, 1320); lastP = t; }
    function pullFx(dt) { const u = (t - TP) / tu.pull, q = LOW() ? 0.35 : 1;
      for (const s of sph) { if (!s.on) continue; let k = (10 + 22 * u) * dt * q + Math.random(); while (k-- >= 1) { const a = Math.random() * TAU, r = tu.burstR * rnd(1.0, 1.25), x = s.x + Math.cos(a) * r, y = s.y + Math.sin(a) * r * 0.85, z = rnd(0.1, 1.9), life = rnd(0.22, 0.34);
        part(S, 4, x, y, z, (s.x - x) / life, (s.y - y) / life, (s.z - z) / life, life, rnd(0.8, 1.3), { fin: 0.04 }); } }
      if (Math.floor((t - TP) / 0.11) !== Math.floor((t - TP - dt) / 0.11)) sfx(X, 'note', 700 * Math.pow(1.09, Math.floor((t - TP) / 0.11)), 0.1, 'sine', 0.06, 0); }
    /* the burst: one hit per monster inside any burst ring */
    function detonate() { const hit = new Set(), live = sph.filter(s => s.on);
      for (const m of monsOf(ctx, H)) { if (m.dead) continue; for (const s of live) if (Math.hypot(m.x - s.x, m.y - s.y) < tu.burstR + (m.r || 0.4)) { hit.add(m); break; } }
      for (const m of hit) { try { ctx.hit(m, DK * tu.burst, { noCharge: true, kb: tu.burstKb }); } catch (e) {} }
      burst = { t: 0, n: hit.size, rot: Math.random() * TAU, ups: live.map(s => [0, 1].map(j => ({ a: -Math.PI / 2 + (j - 0.5) * 0.5 + rnd(-0.12, 0.12), L: rnd(4.5, 7), sd: Math.random() * 99 }))) };
      X.shake && X.shake(RM() ? 5 : 16, 0.5); X.flash && X.flash(RM() ? 0.08 : 0.15, '#E6F6FF'); X.hitstop && X.hitstop(hit.size ? 0.09 : 0.03); X.light && X.light(lx, ly, 9, 0.7);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'note', 41, 1.6, 'sine', 0.85, 25); sfx(X, 'note', 82, 1.1, 'triangle', 0.3, 41); sfx(X, 'hiss', 1.2, 0.34, 700); sfx(X, 'crack'); sfx(X, 'chime', 523, 0.6);
      const L = LOW();
      for (const s of live) { part(S, 5, s.x, s.y, s.z, 0, 0, 0, 0.26, tu.burstR * 1.1, { fin: 0.01, a: 0.6 }); part(S, 11, s.x, s.y, 0.05, 0, 0, 0, 0.55, tu.burstR * 0.9, { grow: 1.6, fin: 0.01, u: 1, flat: 1 });
        for (let i = 0; i < (L ? 5 : 14); i++) { const a = Math.random() * TAU, v = rnd(4, 10); part(S, 4, s.x, s.y, s.z, Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(-2, 6), rnd(0.28, 0.42), rnd(1.2, 2), { drag: 2.4, fin: 0.02 }); }
        for (let i = 0; i < (L ? 5 : 14); i++) { const a = Math.random() * TAU, v = rnd(1.5, 6); part(S, i % 3 === 0 ? 1 : i % 3 === 1 ? 2 : 0, s.x, s.y, s.z, Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(1, 6), rnd(0.6, 1.2), rnd(0.3, 0.5), { g: 4, drag: 1.2, rot: Math.random() * TAU, vr: rnd(-6, 6) }); } } }
    function shudderFx(dt, v) { const q = LOW() ? 0.3 : 1; if (Math.random() < 26 * dt * q) { const nm = ['handL', 'handR', 'cannonL', 'cannonR', 'chest'][(Math.random() * 5) | 0], p = anchorW(ctx, nm); for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, w = rnd(1.5, 4); part(S, i ? 0 : 1, p.x, p.y, p.z, Math.cos(a) * w, Math.sin(a) * w * 0.6, rnd(1, 4), rnd(0.25, 0.45), 0.26, { g: 8, drag: 1.5 }); } }
      if (Math.random() < 8 * dt * q) { const p = anchorW(ctx, Math.random() < 0.5 ? 'cannonL' : 'cannonR'); part(S, 3, p.x, p.y, p.z, rnd(-0.4, 0.4), 0, 1.2, rnd(0.6, 0.9), rnd(0.5, 0.75), { grow: 1.2, a: 0.6, v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-1, 1) }); }
      if (Math.floor(v * 9) !== Math.floor((v - dt / tu.shudder) * 9)) { sfx(X, 'note', 140 + Math.random() * 120, 0.06, 'square', 0.06, 90); if (Math.random() < 0.4) sfx(X, 'squeak'); } }
    /* the cartoon pop: the machine is gone in a puff of smoke, loose bolts, nuts, gears and sparks (no damage) */
    function pop() { const cx = bm.x, cy = bm.y, ch = anchorW(ctx, 'chest'), L = LOW(); popped = { t: 0 };
      bm.gone = true; bm.vis = 0; ctx.vis = 0; if (bm.scale0 != null) bm.scale = bm.scale0;
      sfx(X, 'pop'); sfx(X, 'squeak'); sfx(X, 'note', 520, 0.18, 'square', 0.12, 1040); sfx(X, 'hiss', 0.35, 0.18, 1400); sfx(X, 'purr'); X.shake && X.shake(RM() ? 2 : 4, 0.15); X.light && X.light(cx, cy, 3.5, 0.3);
      for (let i = 0; i < (L ? 7 : 16); i++) { const a = i / 16 * TAU + Math.random() * 0.3, r = rnd(0.2, 0.9), v = rnd(1.2, 3); part(S, 3, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.6, rnd(0.4, 1.8), Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(0.2, 1.4), rnd(0.9, 1.4), rnd(1.0, 1.5), { grow: 0.8, a: 0.8, v: i % 3, drag: 2.6, rot: Math.random() * TAU, vr: rnd(-1.5, 1.5), fin: 0.05 }); }
      for (let i = 0; i < (L ? 6 : 14); i++) { const a = Math.random() * TAU, v = rnd(2, 5); part(S, 6 + (i % 3), ch.x, ch.y, rnd(0.6, 1.6), Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(4, 8), rnd(1.1, 1.6), i % 3 === 2 ? rnd(0.36, 0.48) : rnd(0.24, 0.34), { g: 16, drag: 0.5, bounce: 0.42, snd: 1, rot: Math.random() * TAU, vr: rnd(-14, 14) }); }
      for (let i = 0; i < (L ? 8 : 20); i++) { const a = Math.random() * TAU, v = rnd(2, 7); part(S, i % 4 === 0 ? 1 : 0, ch.x, ch.y, ch.z, Math.cos(a) * v, Math.sin(a) * v * 0.6, rnd(1, 6), rnd(0.35, 0.6), 0.3, { g: 9, drag: 1.4 }); }
      part(S, 5, cx, cy, 1.0, 0, 0, 0, 0.18, 1.5, { fin: 0.01, a: 0.7 });
      startEject(); }
    /* ---- the ejection: up out of the seat, down on standable floor the pet can walk from ---- */
    function startEject() { let s = null; try { s = ctx.seat ? ctx.seat() : null; } catch (e) {} if (!s || !isFinite(s.x)) s = anchorW(ctx, 'seat');
      const sx = s.x, sy = s.y, z0e = Math.max(0.3, s.z || 1.4), reach = flowOf(ctx, H), X2 = H.X, pr = Math.max(0.25, me.r || 0.35);
      const ok = (x, y) => { try { if (X2.blocked(x, y, pr, 0)) return false; } catch (e) {} return !reach || reach(x, y); };
      const air = (x, y) => { try { return !X2.blocked(x, y, 0.1, 1); } catch (e) { return true; } };
      const prefs = [Math.PI / 2, Math.PI / 2 - 0.7, Math.PI / 2 + 0.7, 0, Math.PI, -Math.PI / 2 + 0.7, -Math.PI / 2 - 0.7, -Math.PI / 2]; let Lp = null;
      for (const D of [tu.ejectD, 1.4, 2.8, 0.8]) { for (const a of prefs) { const px = sx + Math.cos(a) * D, py = sy + Math.sin(a) * D * 0.85; if (!ok(px, py)) continue; const w = walkTo(sx, sy, px, py, air); if (Math.hypot(w[0] - px, w[1] - py) < 0.05) { Lp = [px, py]; break; } } if (Lp) break; }
      if (!Lp) Lp = ok(sx, sy) ? [sx, sy] : nearest(ctx, sx, sy);
      ej = { t: 0, z0: z0e, x0: sx, y0: sy, x1: Lp[0], y1: Lp[1], tr: [], landed: false };
      ctx.ejecting = true; ctx.petX = sx; ctx.petY = sy; ctx.petZ = z0e; sfx(X, 'jump'); }
    function stepEject(dt) { ej.t += dt; const D = tu.eject;
      if (!ej.landed) { const u = cl(ej.t / D); ctx.petX = lerp(ej.x0, ej.x1, u); ctx.petY = lerp(ej.y0, ej.y1, u); ctx.petZ = ej.z0 * (1 - u) + tu.ejectH * 4 * u * (1 - u);
        ej.tr.unshift([ctx.petX, ctx.petY, ctx.petZ + 0.3, ej.t]); if (ej.tr.length > 14) ej.tr.pop();
        if (Math.random() < (LOW() ? 0.3 : 0.8)) part(S, Math.random() < 0.6 ? 0 : 1, ctx.petX + rnd(-0.25, 0.25), ctx.petY, ctx.petZ + rnd(0, 0.4), rnd(-0.5, 0.5), rnd(-0.3, 0.3), -1, rnd(0.3, 0.55), rnd(0.22, 0.34), { drag: 1.5 });
        if (u >= 1) { ej.landed = true; ej.lt = ej.t; ctx.petX = ej.x1; ctx.petY = ej.y1; ctx.petZ = 0; me.x = ej.x1; me.y = ej.y1; me.sq = Math.max(me.sq || 0, 0.7);
          sfx(X, 'bounce', 0.4); sfx(X, 'chime', 1318, 0.5); X.shake && X.shake(2, 0.1);
          for (let i = 0; i < (LOW() ? 4 : 9); i++) { const a = i / 9 * TAU; part(S, i % 2, ej.x1, ej.y1, 0.1, Math.cos(a) * 2.2, Math.sin(a) * 1.5, 1.2, 0.45, 0.32, { g: 5, drag: 2 }); } } }
      else if (ej.t - ej.lt >= tu.settle) { if (!finished) { finished = true; S.keep = true; done(); } }
      while (ej.tr.length && ej.t - ej.tr[ej.tr.length - 1][3] > 0.3) ej.tr.pop();
      if (ej.landed && ej.t - ej.lt > 0.8) ej = null; }

    /* ---- drawing ---- */
    const scr = (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * S.ZT];
    /* the floor (light only): landing marker, sphere marks, the airborne shadow, impact fractures, veins, rings */
    function drawUnder(c, B) { const T = S.T, GY = H.GY;
      const fade = burst ? Math.max(0, 1 - burst.t / 0.6) : 1;
      // the landing marker (in with the gather, tightening as the machine falls, gone at contact)
      if (!landed) { const fa = sm(t / 0.25), pul = 1 + 0.05 * Math.sin(t * 16), sz = 2 * tu.impR * T * (1.15 - 0.15 * sm((t - TG) / (TI - TG))) * pul; put(c, B, sprLand(), H.sx(lx), H.sy(ly), sz, sz, fa * 0.95, t * 1.2, GY, true); put(c, B, sprRing('area'), H.sx(lx), H.sy(ly), 2 * tu.impR * T * 1.1, 2 * tu.impR * T * 1.1, fa * 0.6, 0, GY, true); put(c, B, glowSprite(C.crimson), H.sx(lx), H.sy(ly), sz * 0.6, sz * 0.6, fa * 0.25, 0, GY, true); }
      // the sphere marks: from the launch, brightening as each vein arrives, gone with the burst
      if (t > TG * 0.5) for (const s of sph) { if (s.on && t - s.t0 > 0.4) continue; const fa = sm((t - TG * 0.5) / 0.4) * fade, on = s.on ? 1 : 0, X0 = H.sx(s.x), Y0 = H.sy(s.y), sz = T * tu.sphR * 2 * (0.7 + 0.08 * Math.sin(t * 5 + s.i)) * (on ? 0.85 : 1);
        put(c, B, sprMark(), X0, Y0, sz, sz, fa * (on ? 0.7 * (1 - (t - s.t0) / 0.4) : 0.7), t * (s.i % 2 ? 0.8 : -0.8), GY, true); }
      // the shadow while airborne (darker and tighter as it nears the floor)
      if (tu.shadow && t >= TG && !landed) { const z = bm.z || 0, s = T * 3.0 * (bm.scale || 1) * (1.15 - 0.05 * z); put(c, B, sprShadow(), H.sx(bm.x), H.sy(bm.y), s, s * 0.6, 0.7 - 0.08 * z, 0, 1, false); }
      // the impact: a flash, fractures of light, three shock rims, a crack glow under the hand
      for (const im of impacts) { const u = im.t, X0 = H.sx(im.x), Y0 = H.sy(im.y), Xc = H.sx(im.cx), Yc = H.sy(im.cy);
        if (u < 0.3) put(c, B, glowSprite(C.white), Xc, Yc, im.R * 2.2 * T, im.R * 2.2 * T, (1 - u / 0.3) * 0.4, 0, GY, true);
        const ca = (u < 0.08 ? u / 0.08 : 1) * Math.max(0, 1 - Math.max(0, u - 0.5) / 0.9); if (ca > 0.01) { const s = im.R * 2.3 * T; put(c, B, sprCrack(im.v), X0, Y0, s, s, ca, im.rot, GY, true); if (!LOW()) put(c, B, sprCrack(1 - im.v), X0, Y0, s * 0.7, s * 0.7, ca * 0.7, im.rot + 1.3, GY, true); }
        for (let k = 0; k < 3; k++) { const v = (u - k * 0.09) / (0.55 + 0.1 * k); if (v <= 0 || v >= 1) continue; const s = 2 * im.R * T * (1.25 - 0.15 * k) * eout(v); put(c, B, sprRing('shock'), Xc, Yc, s, s, (1 - v) * (k ? 0.75 : 1), 0, GY, true); }
        if (u < 0.6) put(c, B, glowSprite(C.cyan), X0, Y0, T * 2.4, T * 2.4, (1 - u / 0.6) * 0.6, 0, GY, true); }
      // the veins (bolts over the floor, growing from the hand; a pulse of light runs along each at every pulse)
      if (veins.length) { setT(c, B, 0, 0); const fv = burst ? fade : 1, w = Math.max(1, T * 0.05);
        for (const v of veins) { const reachD = v.d * cl(v.t / v.arr), n = v.pts.length; let m = 0; const SP = v.sp || (v.sp = v.pts.map(() => [0, 0]));
          for (let i = 0; i < n; i++) { if (v.ds[i] > reachD) { if (i > 0) { const u = (reachD - v.ds[i - 1]) / (v.ds[i] - v.ds[i - 1] || 1); SP[i][0] = H.sx(lerp(v.pts[i - 1][0], v.pts[i][0], u)); SP[i][1] = H.sy(lerp(v.pts[i - 1][1], v.pts[i][1], u)); m = i + 1; } break; } SP[i][0] = H.sx(v.pts[i][0]); SP[i][1] = H.sy(v.pts[i][1]); m = i + 1; }
          const fl = 0.75 + 0.25 * Math.sin(t * 31 + v.s.i * 2), grow = v.t < v.arr + 0.1, a = (grow ? 1 : 0.55 + 0.45 * v.s.pk) * fl * fv;
          bolt3(c, SP, w * (grow ? 1.3 : 1), a, false, m);
          for (const b of v.br) { if (reachD < b.at + 0.05) continue; const q = b.pts.map(p => [H.sx(p[0]), H.sy(p[1])]), k = cl((reachD - b.at) / b.L); bolt3(c, q, w * 0.6, a * 0.75, false, Math.max(2, Math.round(q.length * k))); }
          if (grow && m > 0) put(c, B, glowSprite(C.cyan), SP[m - 1][0], SP[m - 1][1], T * 1.2, T * 1.2, 0.8 * fv, 0, GY, true); } }
      // the sphere fields: floor light, the damage ring (the pulses' telegraph), each pulse racing out to it
      for (const s of sph) { if (!s.on) continue; const X0 = H.sx(s.x), Y0 = H.sy(s.y), f = s.a * fade, d = 2 * tu.sphR * T;
        if (s.pk > 0.05) put(c, B, glowSprite(C.blue), X0, Y0, d * 1.2, d * 1.2, 0.4 * s.pk * f, 0, GY, true);
        put(c, B, sprRing('area'), X0, Y0, d * 1.11, d * 1.11, (0.45 + 0.5 * s.pk) * f, 0, GY, true); }
      for (const p of pulses) { const u = p.t / 0.55, s = p.s, sz = 2 * tu.sphR * T * 1.12 * (0.25 + 0.75 * eout(u * 1.6)); put(c, B, sprRing('shock'), H.sx(s.x), H.sy(s.y), sz, sz, (1 - u) * fade, 0, GY, true); }
      // the pull-in: the burst rings (the burst's telegraph) brightening, light sliding inward
      if (ph === 'pull' || (burst && burst.t < 0.1)) { const u = sm((t - TP) / tu.pull), fa = burst ? 1 - burst.t / 0.1 : 1;
        for (const s of sph) { if (!s.on) continue; const X0 = H.sx(s.x), Y0 = H.sy(s.y), d = 2 * tu.burstR * T * 1.11;
          put(c, B, sprRing('burst'), X0, Y0, d, d, (0.35 + 0.65 * u) * fa * (0.85 + 0.15 * Math.sin(t * 40 + s.i)), 0, GY, true);
          for (let k = 0; k < 2; k++) { const v = ((t - TP) * 2.6 + k * 0.5 + s.i * 0.13) % 1, dd = d * lerp(1, 0.35, eio(v)); put(c, B, sprRing('area'), X0, Y0, dd, dd, sm(v / 0.2) * (1 - v) * 0.8 * fa, 0, GY, true); }
          put(c, B, glowSprite(C.wgold), X0, Y0, d * 0.7, d * 0.7, 0.25 * u * fa, 0, GY, true); } }
      // the burst on the floor: shock rims and fractures at every sphere
      if (burst && burst.t < 1.3) { const u0 = burst.t;
        for (const s of sph) { if (!s.on) continue; const X0 = H.sx(s.x), Y0 = H.sy(s.y);
          if (u0 < 0.35) put(c, B, glowSprite(C.white), X0, Y0, tu.burstR * 2.2 * T, tu.burstR * 2.2 * T, (1 - u0 / 0.35) * 0.35, 0, GY, true);
          for (let k = 0; k < 2; k++) { const v = (u0 - k * 0.1) / 0.6; if (v <= 0 || v >= 1) continue; const sz = 2 * tu.burstR * T * (1.3 - 0.2 * k) * eout(v); put(c, B, sprRing(k ? 'burst' : 'shock'), X0, Y0, sz, sz, 1 - v, 0, GY, true); }
          const ca = Math.max(0, 1 - u0 / 0.9); if (!LOW() && ca > 0.01) put(c, B, sprCrack((s.i + 1) % 2), X0, Y0, tu.burstR * 1.8 * T, tu.burstR * 1.8 * T, ca * ca * 0.5, s.ph, GY, true); } }
      // the ejection's landing glow and ring
      if (ej) { if (!ej.landed) put(c, B, glowSprite(C.cyan), H.sx(ej.x1), H.sy(ej.y1), T * 1.4, T * 1.4, 0.4 * sm(ej.t / 0.3), 0, GY, true); else { const u = (ej.t - ej.lt) / 0.5; if (u < 1) put(c, B, sprRing('shock'), H.sx(ej.x1), H.sy(ej.y1), T * 2 * eout(u), T * 2 * eout(u), 1 - u, 0, GY, true); }
        if (!ej.landed) { const z = ctx.petZ || 0, s = T * (0.9 - 0.08 * z); put(c, B, sprShadow(), H.sx(ctx.petX), H.sy(ctx.petY), s, s * 0.55, 0.55 - 0.1 * z, 0, 1, false); } } }
    /* just behind the machine: the charge glow while gathering, and the branching halo it is silhouetted against at the top */
    function drawBack(c, B) { if (popped) return; const T = S.T, ch = anchorW(ctx, 'chest'), [X0, Y0] = scr(ch.x, ch.y, ch.z), sc = bm.scale || 1;
      if (t < TR) { const u = sm(t / TG) * (t < TG ? 1 : 1 - sm((t - TG) / 0.2)); put(c, B, glowSprite(C.crimson), X0, Y0, T * 3.4 * sc, T * 3.4 * sc, 0.28 * u, 0, 1, true); put(c, B, glowSprite(C.blue), X0, Y0, T * 4.2 * sc, T * 4.2 * sc, 0.3 * u, 0, 1, true); }
      const hs = TR - 0.14, he = TH + 0.1; if (t > hs && t < he) { const u = (t - hs) / (he - hs), a = sm(u / 0.2) * (1 - sm((u - 0.75) / 0.25)), sz = T * 4.6 * sc * (0.75 + 0.3 * eout(u)), fl = 0.85 + 0.15 * Math.sin(t * 50);
        put(c, B, glowSprite(C.white), X0, Y0, sz * 0.9, sz * 0.9, 0.55 * a, 0, 1, true); put(c, B, glowSprite(C.blue), X0, Y0, sz * 1.5, sz * 1.5, 0.5 * a, 0, 1, true);
        put(c, B, sprHalo(Math.floor(t * 18) % 2), X0, Y0, sz, sz, a * fl, t * 0.9, 1, true); if (!LOW()) put(c, B, sprHalo(Math.floor(t * 18 + 1) % 2), X0, Y0, sz * 1.25, sz * 1.25, a * 0.45, -t * 0.6 + 1, 1, true);
        c.setTransform(B); const sd = K.seed(t, 7, 16); for (let i = 0; i < (LOW() ? 3 : 6); i++) { const b = i / 6 * TAU + R1(sd + i) * 0.6, r0 = sz * 0.3, r1 = sz * (0.62 + 0.25 * R1(sd + i * 3)); const pts = K.path(X0 + Math.cos(b) * r0, Y0 + Math.sin(b) * r0, X0 + Math.cos(b) * r1, Y0 + Math.sin(b) * r1, sd + i * 5, T * 0.25, 6); bolt3(c, pts, Math.max(1, T * 0.05), a * 0.9, i % 3 === 0); } } }
    /* one great sphere (an ent): back filaments, shell, plasma, white-gold heart, front filaments, inner and skin arcs */
    const FP = []; for (let i = 0; i < 64; i++) FP.push([0, 0, 0]);
    function filaments(s, X0, Y0, r, front, a) { const nq = LOW() ? 2 : 3, sp = ph === 'pull' ? 1 + 2.5 * sm((t - TP) / tu.pull) : 1, NP = 16; let k = 0;
      c0.beginPath();
      for (let q = 0; q < nq; q++) { const al = 0.5 + q * 1.05 + Math.sin(t * 0.7 + s.seed) * 0.3, be = t * (1.3 + 0.5 * q) * sp * (q % 2 ? -1 : 1) + s.seed + q * 2.1, ca = Math.cos(al), sa = Math.sin(al), cb = Math.cos(be), sb = Math.sin(be), st0 = t * (3.2 + q) * sp + q * 2, sd = K.seed(t, s.i * 7 + q, 18);
        let pen = false; for (let i = 0; i < NP; i++) { const th = st0 + i / (NP - 1) * TAU * 0.62, jr = r * (0.98 + 0.08 * q) + (R1(sd + i * 1.7) - 0.5) * r * 0.07, cx = Math.cos(th), cy = Math.sin(th), y1 = cy * ca, z1 = cy * sa, x2 = cx * cb + z1 * sb, z2 = -cx * sb + z1 * cb, P = FP[k++];
          P[0] = X0 + x2 * jr; P[1] = Y0 + y1 * jr; P[2] = z2;
          if ((z2 >= 0) === front) { pen ? c0.lineTo(P[0], P[1]) : c0.moveTo(P[0], P[1]); pen = true; } else pen = false; } }
      c0.globalCompositeOperation = 'lighter'; c0.lineCap = 'round'; c0.lineJoin = 'round';
      if (front) { c0.globalAlpha = Math.min(1, 0.35 * a); c0.strokeStyle = C.violet; c0.lineWidth = Math.max(1, r * 0.11); c0.stroke(); c0.globalAlpha = Math.min(1, 0.85 * a); c0.strokeStyle = C.lilac; c0.lineWidth = Math.max(0.7, r * 0.04); c0.stroke(); c0.globalAlpha = Math.min(1, 0.6 * a); c0.strokeStyle = C.white; c0.lineWidth = Math.max(0.5, r * 0.015); c0.stroke(); }
      else { c0.globalAlpha = Math.min(1, 0.3 * a); c0.strokeStyle = C.violet; c0.lineWidth = Math.max(0.7, r * 0.06); c0.stroke(); } }
    let c0 = null;
    function drawSphere(c, B, s) { if (!s.on || s.sc < 0.02) return; c0 = c; const T = S.T, [X0, Y0] = scr(s.x, s.y, s.z), pk = s.pk, pull = ph === 'pull' ? sm((t - TP) / tu.pull) : 0, r = T * tu.sphVis * s.sc * (1 + 0.1 * pk + 0.025 * Math.sin(t * 7 + s.seed)), a = s.a;
      c.setTransform(B); if (Math.hypot(X0 - S.PX, Y0 - S.PY) < r * 1.6 + S.PR) petHole(c, S);
      // the soft light it throws, a violet fringe
      put(c, B, glowSprite(C.blue), X0, Y0, r * 2.6, r * 2.6, (0.22 + 0.25 * pk + 0.2 * pull) * a, 0, 1, true);
      c.setTransform(B); filaments(s, X0, Y0, r, false, a);
      // the shell (glass), the plasma turning inside it, the heart
      put(c, B, sprShell(), X0, Y0, r * 128 / SHR, r * 128 / SHR, 0.9 * a, 0, 1, false);
      const sw = 1 + 1.6 * pull; put(c, B, sprSwirl(0), X0, Y0, r * 2.0, r * 2.0, (0.32 + 0.25 * pk) * a, t * 1.7 * sw + s.seed, 1, true); if (!LOW()) put(c, B, sprSwirl(1), X0, Y0, r * 1.7, r * 1.7, (0.28 + 0.25 * pk) * a, -t * 2.4 * sw + s.seed, 1, true);
      const cr = r * (0.85 + 0.1 * Math.sin(t * 11 + s.seed) + 0.3 * pk + 0.4 * pull); put(c, B, glowSprite(C.gold), X0, Y0, cr * 1.2, cr * 1.2, 0.38 * a, 0, 1, true); put(c, B, sprCore(), X0, Y0, cr, cr, a, t * 3, 1, true); put(c, B, glowSprite(C.white), X0, Y0, cr * 0.45, cr * 0.45, 0.9 * a, 0, 1, true);
      put(c, B, sprRim(), X0, Y0, r * 128 / SHR, r * 128 / SHR, (0.85 + 0.15 * pk) * a, 0, 1, true);
      c.setTransform(B); filaments(s, X0, Y0, r, true, a);
      // inner arcs from the heart to the shell, and arcs crawling over its skin
      const sd = K.seed(t, s.i * 13, 16); for (let j = 0; j < (LOW() ? 1 : 2); j++) { const b = R1(sd + j * 3.1) * TAU, rr = r * (0.82 + 0.12 * R1(sd + j)); bolt3(c, K.path(X0, Y0, X0 + Math.cos(b) * rr, Y0 + Math.sin(b) * rr, sd + j * 7, r * 0.18, 5), Math.max(0.8, r * 0.05), 0.85 * a, j === 1); }
      if (R1(sd + 40) < 0.55 + 0.4 * pk) { const b = R1(sd + 41) * TAU, b2 = b + 0.7 + R1(sd + 42) * 0.8, rr = r * 1.03; bolt3(c, K.path(X0 + Math.cos(b) * rr, Y0 + Math.sin(b) * rr, X0 + Math.cos(b2) * rr, Y0 + Math.sin(b2) * rr, sd + 43, r * 0.22, 6), Math.max(0.8, r * 0.045), 0.9 * a, false); }
      // a flicker of discharge down to the floor now and then (light only where it lands)
      if (R1(sd + 77) < 0.06 + 0.6 * pk) { const b = R1(sd + 78) * TAU, gx = H.sx(s.x + Math.cos(b) * tu.sphR * 0.8), gy = H.sy(s.y + Math.sin(b) * tu.sphR * 0.6); bolt3(c, K.path(X0, Y0 + r * 0.8, gx, gy, sd + 79, r * 0.3, 6), Math.max(0.8, r * 0.05), 0.75 * a, false); }
      if (burst && burst.t < 0.12) put(c, B, glowSprite(C.white), X0, Y0, r * 3, r * 3, 0.7 * (1 - burst.t / 0.12), 0, 1, true); }
    /* over everything (the pet cut out): the arcs between spheres, the pulse zaps, the charge over the body, the crimson
       flares, the bolts climbing out of the burst, the ejection's trail */
    function drawOver(c, B) { const T = S.T; c.setTransform(B); c.save(); petHole(c, S);
      // the charge: small arcs crawling between the machine's fittings while it gathers and through the leap
      if (!landed && !popped && t < TH) { const u = t < TG ? sm(t / TG) : 1, sd = K.seed(t, 3, 18), names = ['chest', 'handL', 'handR', 'eyes', 'cannonL', 'cannonR'];
        for (let i = 0; i < (LOW() ? 2 : 4); i++) { const A = anchorW(ctx, names[(R1(sd + i) * 6) | 0]), Bp = anchorW(ctx, names[(R1(sd + i + 9) * 6) | 0]); if (A === Bp) continue; const pa = scr(A.x, A.y, A.z), pb = scr(Bp.x, Bp.y, Bp.z); if (Math.hypot(pa[0] - pb[0], pa[1] - pb[1]) < T * 0.2) continue; bolt3(c, K.path(pa[0], pa[1], pb[0], pb[1], sd + i * 11, T * 0.18, 6), Math.max(0.8, T * 0.035), 0.85 * u, i === 0); }
        for (const nm of ['eyes', 'chest']) { const p = anchorW(ctx, nm), [x, y] = scr(p.x, p.y, p.z), fl = 0.8 + 0.2 * Math.sin(t * 37 + (nm === 'eyes' ? 0 : 2)); put(c, B, glowSprite(C.crimson), x, y, T * (nm === 'eyes' ? 1.3 : 1.6), T * (nm === 'eyes' ? 1.3 : 1.6), 0.6 * u * fl, 0, 1, true); put(c, B, sprGlint(C.crimson), x, y, T * 0.9 * u, T * 0.9 * u, 0.9 * u * fl, t * 2, 1, true); } c.setTransform(B); }
      // the arcs joining the spheres (decorative: they deal nothing)
      const sd = K.seed(t, 31, 14);
      for (let e = 0; e < edges.length; e++) { const p = sph[edges[e][0]], q = sph[edges[e][1]]; if (!p.on || !q.on) continue; const a = Math.min(p.a, q.a) * (burst ? Math.max(0, 1 - burst.t / 0.1) : 1); if (a < 0.02) continue;
        const [x1, y1] = scr(p.x, p.y, p.z), [x2, y2] = scr(q.x, q.y, q.z), dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy) || 1, r1 = T * tu.sphVis * p.sc * 0.9, r2 = T * tu.sphVis * q.sc * 0.9; if (d < r1 + r2 + 4) continue;
        const pk = Math.max(p.pk, q.pk), pull = ph === 'pull' ? sm((t - TP) / tu.pull) : 0, fl = 0.7 + 0.3 * R1(sd + e * 3);
        c.setTransform(B); K.arc(c, x1 + dx / d * r1, y1 + dy / d * r1, x2 - dx / d * r2, y2 - dy / d * r2, sd + e * 17, Math.max(1, T * (0.035 + 0.02 * pk + 0.015 * pull)), a * fl * (0.75 + 0.25 * pk), { forks: LOW() ? 0 : 1, jit: Math.min(T * 0.45, d * 0.1) });
        if (!LOW() && pk > 0.3) { c.setTransform(B); bolt3(c, K.path(x1 + dx / d * r1, y1 + dy / d * r1 - T * 0.1, x2 - dx / d * r2, y2 - dy / d * r2 - T * 0.1, sd + e * 29, Math.min(T * 0.8, d * 0.16), 8), Math.max(0.8, T * 0.03), a * 0.7, true); } }
      // the pulse zaps: from the sphere into each monster it hits
      for (const z of zaps) { const u = z.t / 0.24, s = z.s, [x1, y1] = scr(s.x, s.y, s.z), m = z.m, mx = H.sx(m && !m.dead ? m.x : z.x), my = H.sy(m && !m.dead ? m.y : z.y) - T * 0.4; c.setTransform(B); bolt3(c, K.path(x1, y1 + T * 0.3, mx, my, z.sd + Math.floor(z.t * 30), T * 0.35, 7), Math.max(1, T * 0.05), (1 - u) * 0.95, false); put(c, B, glowSprite(C.ice), mx, my, T * 1.1, T * 1.1, 0.7 * (1 - u), 0, 1, true); }
      // the burst: bolts climbing out of every sphere into the sky
      if (burst && burst.t < 0.55) { const u = burst.t / 0.55, live = sph.filter(s => s.on);
        live.forEach((s, i) => { const [x1, y1] = scr(s.x, s.y, s.z); for (const b of burst.ups[i]) { const L = b.L * T * eout(Math.min(1, u * 3)), x2 = x1 + Math.cos(b.a) * L * 0.35, y2 = y1 - L; c.setTransform(B); K.arc(c, x1, y1 - T * 0.6, x2, y2, b.sd + Math.floor(burst.t * 20), Math.max(1.1, T * 0.04), (1 - u) * (1 - u) * 0.95, { forks: LOW() ? 1 : 2, jit: T * 0.45, gold: b === burst.ups[i][1] }); } });
        if (!LOW()) for (const s of live) { const [x1, y1] = scr(s.x, s.y, s.z); put(c, B, glowSprite(C.wgold), x1, y1, tu.burstR * 1.6 * T * (0.6 + 0.6 * eout(u)), tu.burstR * 1.6 * T * (0.6 + 0.6 * eout(u)), (1 - u) * 0.3, 0, 1, true); } }
      // the ejection's trail (the pet itself is cut out)
      if (ej && ej.tr.length > 2) { const pts = ej.tr.map(p => scr(p[0], p[1], p[2])); c.setTransform(B); K.ribbon(c, pts.reverse(), Math.max(2, T * 0.16), 0.75, true); }
      c.restore(); }
  }

  BM.judgement = judgement;
  BM.TUNE_J = TUNE;
  BM.warmJ = warm;
  BM.__dbgJ = { sprShell, sprSwirl, sprCore, sprMark, sprHalo, sprCrack, sprRing, sprSmoke, sprNut, sprBolt, sprGear, planSpheres };
})();
