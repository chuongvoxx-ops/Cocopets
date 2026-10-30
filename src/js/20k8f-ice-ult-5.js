/* ---------- Ice, reworked: Catastrophe, Ice Age ----------
   Catastrophe: the sky turns cold and a vortex of light opens above the battlefield; swirling beams of ice-blue light
   fall out of it and sweep across the floor, freezing every monster they touch and leaving trails of frost light and
   little crystals behind them, while snow falls over the whole screen. 3 beams for 4 s at Hatchling, 7 for 5 s at
   Adept, 10 for 7 s at Celestial (its 21 s cooldown pays for it). Built for the phone: the beam column with its turning
   ribbons, the floor under each beam, the swirl's turn, the crown of shards and the trail crystals are cached pictures
   painted a few a tick from the cast; nearly everything is blitted unturned.
   Ice Age: the ultimate ice spell. A giant faceted crystal (a doubly-terminated hexagonal prism rendered in 3D: lit and
   shaded translucent facets, the back facets showing through, a glowing core and internal fractures, a crown of smaller
   crystals round its waist) forms in the sky out of streams of shards, turning, with rings of light round it; it drops
   onto the aim and bursts: a white flash, a pillar and rays of light, the crystal shattering into tumbling shards and
   waves of blue light rolling across the floor; then clusters of long thin ice spikes erupt from the ground under the
   monsters in rings, each ring bigger than the last. The burst deals the massive damage and freezes for 3 s (bosses ~1 s); the sprouted crystals
   deal more. Evolution: a bigger crystal, more crown crystals and rings, 2 / 3 / 5 waves and 8 / 14 / 24 crystals in
   1 / 2 / 3 rings (spike clusters of 2-4). Everything heavy is a cached sprite: the crystal's 3D frames, the beam column, the swirl, the wave
   band, the snowflakes. */
(() => {
  const U = ELEM_IMPL.ice.ult, TAU = Math.PI * 2;
  let H, K, P;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgb = h => hexRGB(h);
  const rgbaS = (h, a) => { const [r, g, b] = rgb(h); return `rgba(${r},${g},${b},${a})`; };
  /* the pet's body on the screen, and a clip that keeps everything after it off the pet */
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
  /* the visible screen in the current drawing coordinates */
  function scr(c) { const m = c.getTransform(), a = m.a || 1, d = m.d || 1; return { x0: -m.e / a, y0: -m.f / d, w: c.canvas.width / a, h: c.canvas.height / d }; }

  /* ---- cached sprites ---- */
  /* a column of light (vertical): gaussian across, white core, cyan, blue edges; fades in over its top tenth */
  const colSpr = () => fxSprite('iu5col', 64, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    [[0, 'rgba(59,142,224,0)'], [0.18, 'rgba(59,142,224,0.22)'], [0.33, 'rgba(95,232,255,0.55)'], [0.44, 'rgba(232,251,255,0.9)'], [0.5, 'rgba(255,255,255,1)'], [0.56, 'rgba(232,251,255,0.9)'], [0.67, 'rgba(95,232,255,0.55)'], [0.82, 'rgba(59,142,224,0.22)'], [1, 'rgba(59,142,224,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.15, 'rgba(0,0,0,0.25)'); gv.addColorStop(0.4, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  /* the same column in blue: no white core (the outer layers of a beam) */
  const colBSpr = () => fxSprite('iu5colB', 64, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    [[0, 'rgba(30,79,160,0)'], [0.2, 'rgba(30,79,160,0.3)'], [0.36, 'rgba(59,142,224,0.6)'], [0.5, 'rgba(95,232,255,0.85)'], [0.64, 'rgba(59,142,224,0.6)'], [0.8, 'rgba(30,79,160,0.3)'], [1, 'rgba(30,79,160,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.15, 'rgba(0,0,0,0.25)'); gv.addColorStop(0.4, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  /* a swirl of light seen from above: three spiral arms, cyan with white cores (squashed onto the floor when drawn) */
  const swirlSpr = () => fxSprite('iu5swirl', 192, 192, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let arm = 0; arm < 3; arm++) for (const [col, lw] of [['rgba(59,142,224,0.35)', 12], ['rgba(95,232,255,0.6)', 6], ['rgba(255,255,255,0.85)', 2.2]]) {
      g.strokeStyle = col; g.beginPath();
      for (let i = 0; i <= 40; i++) { const u = i / 40, r = c0 * 0.95 * u, b = arm * TAU / 3 + u * 4.2; g.lineWidth = lw * (0.3 + 0.7 * Math.sin(u * Math.PI)); if (i) g.lineTo(Math.cos(b) * r, Math.sin(b) * r); else g.moveTo(0, 0); }
      g.stroke(); }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); gr.addColorStop(0, 'rgba(232,251,255,0.7)'); gr.addColorStop(0.3, 'rgba(95,232,255,0.25)'); gr.addColorStop(1, 'rgba(95,232,255,0)'); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });
  /* a band of light round a circle: dark inside, a cyan band with a white leading edge (a floor wave) */
  const bandSpr = () => fxSprite('iu5band', 256, 256, (g, w) => {
    const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(59,142,224,0)'], [0.55, 'rgba(59,142,224,0)'], [0.74, 'rgba(59,142,224,0.28)'], [0.86, 'rgba(95,232,255,0.7)'], [0.93, 'rgba(255,255,255,1)'], [0.97, 'rgba(191,239,255,0.5)'], [1, 'rgba(191,239,255,0)']].forEach(s => gr.addColorStop(s[0], s[1]));
    g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* a snowflake: a soft disc with six fine arms */
  const flakeSpr = () => fxSprite('iu5flake', 32, 32, (g, w) => {
    const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.25, 'rgba(232,251,255,0.55)'); gr.addColorStop(1, 'rgba(191,239,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.2; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i < 6; i++) { const b = i * TAU / 6; g.moveTo(c0, c0); g.lineTo(c0 + Math.cos(b) * c0 * 0.8, c0 + Math.sin(b) * c0 * 0.8); } g.stroke(); });
  /* a cold dimming of the whole scene round a point (vignette: clear in the middle) */
  const vigSpr = () => fxSprite('iu5vig', 128, 128, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(6,20,52,0)'); gr.addColorStop(0.45, 'rgba(6,20,52,0.35)'); gr.addColorStop(1, 'rgba(6,20,52,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });

  /* ---- the 3D crystal: a doubly-terminated hexagonal prism, rendered once per turning step and size ----
     Model units: height 1 (top apex at -0.47, bottom point at +0.53), radius 0.17; tilted toward the viewer so the top
     facets show. Back facets first (deep, faint edges: seen through the glass), then the glowing core and fractures,
     then the lit translucent front facets with cyan edges, a bright ridge and a specular streak. Six-fold symmetric, so
     NF frames over 60 degrees make a smooth turn. */
  const NF = 12, crysCache = new Map();
  const LV = (() => { const v = [-0.82, -0.5, 0.42], n = Math.hypot(v[0], v[1], v[2]); return v.map(q => q / n); })();
  const RAMP = ['#0C2560', '#1846A0', '#2A7EE0', '#43B4F4', '#7FD6FF', '#B8EEFF'];
  function rampCol(k, d) { const x = cl(k) * (RAMP.length - 1), i = Math.min(RAMP.length - 2, Math.floor(x)), u = x - i, A = rgb(RAMP[i]), B = rgb(RAMP[i + 1]); const f = q => Math.round(cl((A[q] + (B[q] - A[q]) * u) / 255 + (d || 0)) * 255); return [f(0), f(1), f(2)]; }
  function crysFrame(i, PX) {
    i = ((i % NF) + NF) % NF; const key = i + '|' + PX; let cv = crysCache.get(key); if (cv) return cv;
    const r = 0.17, ht = 0.27, hp = 0.36, hb = 0.35, th = i / NF * (TAU / 6), tilt = 0.32, V = [];
    const put = (x, y, z) => { const ct = Math.cos(tilt), st2 = Math.sin(tilt); V.push([x, y * ct - z * st2, y * st2 + z * ct]); };
    put(0, -(hp / 2 + ht), 0); for (let k = 0; k < 6; k++) { const a = th + k * TAU / 6; put(Math.cos(a) * r, -hp / 2, Math.sin(a) * r); } for (let k = 0; k < 6; k++) { const a = th + k * TAU / 6; put(Math.cos(a) * r * 1.04, hp / 2, Math.sin(a) * r * 1.04); } put(0, hp / 2 + hb, 0);
    const F = []; for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; F.push([0, 1 + k, 1 + k2], [1 + k, 7 + k, 7 + k2, 1 + k2], [7 + k, 13, 7 + k2]); }
    const ctr = [0, 0.03 * Math.cos(tilt), 0.03 * Math.sin(tilt)];
    const faces = F.map((f, fi) => { const A = V[f[0]], B = V[f[1]], Cc = V[f[2]], u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], v = [Cc[0] - A[0], Cc[1] - A[1], Cc[2] - A[2]]; let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; const nl = Math.hypot(n[0], n[1], n[2]) || 1; n = n.map(q => q / nl); const m = [0, 0, 0]; f.forEach(j => { m[0] += V[j][0] / f.length; m[1] += V[j][1] / f.length; m[2] += V[j][2] / f.length; }); if ((m[0] - ctr[0]) * n[0] + (m[1] - ctr[1]) * n[1] + (m[2] - ctr[2]) * n[2] < 0) n = n.map(q => -q); return { f, n, m, z: m[2], fi, sh: cl((0.5 + 0.5 * (n[0] * LV[0] + n[1] * LV[1] + n[2] * LV[2]) - 0.22) / 0.68) }; });
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of V) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    const pad = Math.ceil(PX * 0.04) + 3, W = Math.ceil((x1 - x0) * PX) + pad * 2, Hh = Math.ceil((y1 - y0) * PX) + pad * 2;
    cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; const g = cv.getContext('2d'), ox = pad - x0 * PX, oy = pad - y0 * PX;
    const Q = j => [ox + V[j][0] * PX, oy + V[j][1] * PX], path = f => { g.beginPath(); f.forEach((j, q) => { const p = Q(j); if (q) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); };
    const back = faces.filter(f => f.n[2] < 0).sort((a, b) => a.z - b.z), front = faces.filter(f => f.n[2] >= 0).sort((a, b) => a.z - b.z), lw = Math.max(1, PX / 160);
    g.lineJoin = 'round'; g.lineCap = 'round';
    // the silhouette outline (stroked first; the facets cover its inner half)
    for (const f of front) { path(f.f); g.strokeStyle = 'rgba(18,46,102,0.75)'; g.lineWidth = lw * 3; g.stroke(); }
    // back facets: deep translucent blue, faint cyan edges
    for (const f of back) { path(f.f); const [r0, g0, b0] = rampCol(0.15 + 0.35 * f.sh); g.fillStyle = `rgba(${r0},${g0},${b0},0.55)`; g.fill(); }
    g.save(); g.globalCompositeOperation = 'lighter'; for (const f of back) { path(f.f); g.strokeStyle = 'rgba(95,232,255,0.35)'; g.lineWidth = lw; g.stroke(); } g.restore();
    // the glowing core and the internal fractures, inside the silhouette
    g.save(); g.beginPath(); for (const f of front) f.f.forEach((j, q) => { const p = Q(j); if (q) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.clip('nonzero');
    g.globalCompositeOperation = 'lighter'; const cx = ox, cy = oy + 0.04 * PX, gr = g.createRadialGradient(cx, cy, 0, cx, cy, PX * 0.36); gr.addColorStop(0, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.25, 'rgba(191,239,255,0.45)'); gr.addColorStop(0.6, 'rgba(95,232,255,0.16)'); gr.addColorStop(1, 'rgba(95,232,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    for (let q = 0; q < 6; q++) { let px = cx + (R1(q * 7.1) - 0.5) * PX * 0.2, py = oy + (R1(q * 3.3) - 0.45) * PX * 0.75, b = R1(q * 5.7) * TAU; g.beginPath(); g.moveTo(px, py); for (let s = 0; s < 4; s++) { b += (R1(q * 11 + s) - 0.5) * 1.6; px += Math.cos(b) * PX * 0.06; py += Math.sin(b) * PX * 0.08; g.lineTo(px, py); } g.strokeStyle = 'rgba(95,232,255,0.55)'; g.lineWidth = lw * 2.4; g.stroke(); g.strokeStyle = 'rgba(232,251,255,0.8)'; g.lineWidth = lw * 0.9; g.stroke(); }
    g.restore();
    // front facets: shaded translucent glass, lighter toward the top of each facet
    for (const f of front) { const pts = f.f.map(Q); let ya = 1e9, yb = -1e9; for (const p of pts) { ya = Math.min(ya, p[1]); yb = Math.max(yb, p[1]); } const k = f.sh, [ra, ga, ba] = rampCol(k + 0.12, 0.04), [rb, gb, bb] = rampCol(k - 0.1, -0.02), al = 0.58 + 0.3 * k, gg = g.createLinearGradient(0, ya, 0, yb); gg.addColorStop(0, `rgba(${ra},${ga},${ba},${al + 0.1})`); gg.addColorStop(1, `rgba(${rb},${gb},${bb},${al})`); path(f.f); g.fillStyle = gg; g.fill(); }
    // refracted light: a soft cyan sheen on the facets facing away from the light
    g.save(); g.globalCompositeOperation = 'lighter'; for (const f of front) if (f.sh < 0.45) { path(f.f); g.fillStyle = `rgba(95,232,255,${0.12 + 0.1 * (0.45 - f.sh)})`; g.fill(); }
    // the edges: cyan, a white ridge where a lit facet meets the light
    for (const f of front) { path(f.f); g.strokeStyle = `rgba(95,232,255,${0.55 + 0.35 * f.sh})`; g.lineWidth = lw * 1.3; g.stroke(); }
    const best = front.slice().sort((a, b) => b.sh - a.sh).slice(0, 2); for (const f of best) { const pts = f.f.map(Q); g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = lw * 2; g.stroke();
      // a specular streak across the brightest facet
      g.save(); path(f.f); g.clip(); const c0 = [ox + f.m[0] * PX, oy + f.m[1] * PX]; g.strokeStyle = 'rgba(255,255,255,0.55)'; g.lineWidth = PX * 0.035; g.beginPath(); g.moveTo(c0[0] - PX * 0.2, c0[1] + PX * 0.12); g.lineTo(c0[0] + PX * 0.2, c0[1] - PX * 0.16); g.stroke(); g.lineWidth = PX * 0.012; g.beginPath(); g.moveTo(c0[0] - PX * 0.2, c0[1] + PX * 0.2); g.lineTo(c0[0] + PX * 0.2, c0[1] - PX * 0.08); g.stroke(); g.restore(); }
    g.restore();
    cv._ox = ox; cv._oy = oy; cv._px = PX; if (crysCache.size > 80) crysCache.clear(); crysCache.set(key, cv); return cv; }
  /* draw a crystal whose model origin is at (x, y), h px tall, turned by spin (rad), leaning by ang (rad, screen) */
  function drawCrys(c, x, y, h, spin, ang, a, big, lit) {
    if (h < 2 || !(a > 0.01)) return; const fi = Math.round(((spin % (TAU / 6)) + TAU / 6) % (TAU / 6) / (TAU / 6) * NF), cv = crysFrame(fi, big ? 320 : 112), s = h / cv._px;
    c.save(); c.translate(x, y); if (ang) c.rotate(ang); c.globalAlpha = Math.min(1, a); c.drawImage(cv, -cv._ox * s, -cv._oy * s, cv.width * s, cv.height * s); if (lit) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * lit); c.drawImage(cv, -cv._ox * s, -cv._oy * s, cv.width * s, cv.height * s); } c.restore(); }
  /* a kit shard at a steady size, stretched along its own axis by k (growing or breathing): a size that changes every
     frame would make the kit paint a new sprite every frame */
  function shardK(c, x, y, w, h, ang, sd, a, t, k) { if (!(k > 0.02) || !(a > 0.01)) return; w = Math.round(w); h = Math.round(h); c.save(); c.translate(x, y); c.rotate(ang + Math.PI / 2); c.scale(1, k); K.shard(c, 0, 0, w, h, -Math.PI / 2, sd, a, t); c.restore(); }
  /* an ice spike: a long thin needle (height ~6.5x its base), a lit face and a shaded face on a bright ridge, a cyan
     edge, a glowing fracture up its core and a glowing tip; 4 variants, drawn stretched to any size (one blit) */
  const spikeSpr = v => fxSprite('iu5spike' + v, 40, 200, (g, W, Hh) => {
    const bw = 26, top = 16, bot = Hh - 3, cx = W / 2, tx = cx + (v - 1.5) * 1.6, fx = cx + 2 + (v % 2), fy = bot + 2;
    let gr = g.createLinearGradient(cx - bw / 2, 0, fx, 0); gr.addColorStop(0, 'rgba(232,251,255,0.95)'); gr.addColorStop(0.6, 'rgba(160,226,255,0.85)'); gr.addColorStop(1, 'rgba(110,196,245,0.8)');
    g.beginPath(); g.moveTo(cx - bw / 2, bot); g.lineTo(fx, fy); g.lineTo(tx, top); g.closePath(); g.fillStyle = gr; g.fill();
    gr = g.createLinearGradient(fx, 0, cx + bw / 2, 0); gr.addColorStop(0, 'rgba(42,126,224,0.85)'); gr.addColorStop(1, 'rgba(18,60,140,0.9)');
    g.beginPath(); g.moveTo(fx, fy); g.lineTo(cx + bw / 2, bot); g.lineTo(tx, top); g.closePath(); g.fillStyle = gr; g.fill();
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    g.strokeStyle = 'rgba(95,232,255,0.6)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(cx - 2, bot - 8); for (let k = 1; k <= 6; k++) g.lineTo(cx + (k % 2 ? 2.5 : -1.5) + (tx - cx) * k / 6, bot - 8 - (bot - top - 30) * k / 6); g.stroke();
    const gu = g.createLinearGradient(0, bot, 0, top); gu.addColorStop(0, 'rgba(95,232,255,0.35)'); gu.addColorStop(1, 'rgba(95,232,255,0)'); g.fillStyle = gu; g.beginPath(); g.moveTo(cx - bw / 2, bot); g.lineTo(cx + bw / 2, bot); g.lineTo(tx, top); g.closePath(); g.fill();
    g.restore();
    g.lineJoin = 'round'; g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 2; g.beginPath(); g.moveTo(fx, fy); g.lineTo(tx, top); g.stroke();
    g.strokeStyle = 'rgba(95,232,255,0.95)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(cx - bw / 2, bot); g.lineTo(tx, top); g.lineTo(cx + bw / 2, bot); g.stroke();
    g.strokeStyle = 'rgba(18,46,102,0.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(tx, top); g.lineTo(cx + bw / 2 + 0.8, bot); g.stroke();
    g.globalCompositeOperation = 'lighter'; const gt = g.createRadialGradient(tx, top + 2, 0, tx, top + 2, 15); gt.addColorStop(0, 'rgba(255,255,255,1)'); gt.addColorStop(0.3, 'rgba(191,239,255,0.6)'); gt.addColorStop(1, 'rgba(95,232,255,0)'); g.fillStyle = gt; g.fillRect(tx - 15, top - 13, 30, 30); });
  /* a spike standing at (x, y) (its base), h px tall, leaning ang rad from upright, grown by k (0..1+, stretched) */
  function spike(c, x, y, h, ang, v, a, k) { if (!(k > 0.02) || !(a > 0.01) || h < 3) return; const cv = spikeSpr(v & 3), s = h / 181; c.save(); c.translate(x, y); if (ang) c.rotate(ang); c.scale(s, s * k); c.globalAlpha = Math.min(1, a); c.drawImage(cv, -20, -197); c.restore(); }
  /* the floor snow-light round a point under something bright */
  const lightPool = (c, X, Y, r, a) => { K.floorLight(c, X, Y, r, a, P.ice); K.floorLight(c, X, Y, r * 0.5, a * 0.8, P.frost); };

  const tt0 = (o, f) => f.t < o.s || f.t > o.e;
  /* ---- Catastrophe's cached pieces (the look of the first build, painted once and blitted) ---- */
  const SPX = 2;   // sprite pixels per screen unit (sharp on a phone's 2-3x screen)
  /* a beam column at one turn of its ribbons: the blue outer light, the white core, two ribbons wound round it (back halves
     faint blue, front halves cyan with a white thread). 16 turning frames; drawn stretched to the beam, cross-faded */
  const NBF = 32;
  function beamFrame(fi, kq, bq) { return fxSprite('iu5bf|' + fi + '|' + kq + '|' + bq, 72, 384, (g, W, Hh) => {
    const w = W / 1.1, cx = W / 2, BRb = bq / 100, ph = fi / NBF * TAU; g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.62 * (0.45 + 0.55 * kq / 100); g.drawImage(colBSpr(), 0, 0, W, Hh); g.globalAlpha = 0.75; g.drawImage(colSpr(), cx - w * 0.11, 0, w * 0.22, Hh);
    g.lineCap = 'round'; const k = w / (1.4 * BRb);   // (screen T in sprite px: the first build's stroke widths were in T)
    for (let sd = 0; sd < 2; sd++) { const N = 40, back = [], front = []; for (let j = 0; j <= N; j++) { const u = j / N, q = u * 6 + ph + sd * Math.PI; (Math.cos(q) > 0 ? front : back).push([cx + Math.sin(q) * w * 0.5 * (0.6 + 0.4 * u), u * Hh, j]); }
      const run = (pts, col, lw, al) => { g.globalAlpha = al; g.beginPath(); let last = -9; for (const p of pts) { if (p[2] !== last + 1) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); last = p[2]; } g.strokeStyle = col; g.lineWidth = lw; g.stroke(); };
      run(back, rgbaS(P.blue, 0.8), k * 0.07, 0.45); run(front, rgbaS(P.cyan, 0.85), k * 0.1, 0.9); run(front, rgbaS(P.white, 0.95), k * 0.035, 0.9); } }); }
  /* the floor under a beam, in the floor's own plane (squashed and turned when drawn): the light pool, the swirl, the mist
     and the ice ring's light (additive), and the ring's glassy band (normal) */
  /* the swirl turned through its 120-degree repeat in 24 frames: drawn unturned (the cheap path), squashed as wanted */
  const NSF = 24;
  function swirlFrame(i) { return fxSprite('iu5sw|' + i, 160, 160, (g, W) => { g.translate(W / 2, W / 2); g.rotate(i / NSF * TAU / 3); g.drawImage(swirlSpr(), -W / 2, -W / 2, W, W); }); }
  const swirlAt = ang => swirlFrame(((Math.round(ang / (TAU / 3) * NSF) % NSF) + NSF) % NSF);
  function footAdd(kq, bq) { return fxSprite('iu5fa|' + kq + '|' + bq, 256, 256, (g, W) => {
    const R0 = W / 2 / 2.1, c0 = W / 2, kN = kq / 100, BRb = bq / 100; g.globalCompositeOperation = 'lighter'; g.translate(c0, c0);
    const gl = (col, r, a, x, y) => { g.globalAlpha = a; g.drawImage(glowSprite(col), (x || 0) - r, (y || 0) - r, r * 2, r * 2); };
    gl(P.ice, R0 * 2.5, 0.42 * kN); gl(P.frost, R0 * 1.43, 0.32 * kN);
    /* the splash of light where the beam meets the floor (was two upright glows) */
    gl(P.cyan, R0 * 1.5 / Math.sqrt(H.GY), 0.28 * kN, 0, 0); gl(P.white, R0 * 0.6 / Math.sqrt(H.GY), 0.4, 0, 0);
    for (let i = 0; i < 6; i++) { const b = i / 6 * TAU, r = R0 * 1.3; gl(P.frost, r * 0.6, 0.18 * 0.35 * kN * 1.4, Math.cos(b) * r * 0.8, Math.sin(b) * r * 0.8); }
    const rw = Math.max(2 / 40, 0.06 / BRb) * R0; g.globalAlpha = 0.7; g.strokeStyle = rgbaS(P.cyan, 0.8); g.lineWidth = Math.max(1, rw * 0.35); g.beginPath(); g.arc(0, 0, R0 * 0.95 - rw * 0.3, 0, TAU); g.stroke();
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.7; g.strokeStyle = rgbaS(P.deep, 0.3); g.lineWidth = rw * 1.4; g.beginPath(); g.arc(0, 0, R0 * 0.95, 0, TAU); g.stroke(); g.strokeStyle = rgbaS(P.pale, 0.85); g.lineWidth = rw; g.stroke(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.strokeStyle = rgbaS(P.cyan, 0.8); g.lineWidth = Math.max(1, rw * 0.35); g.beginPath(); g.arc(0, 0, R0 * 0.95 - rw * 0.3, 0, TAU); g.stroke(); }); }
  /* the crown of five shards turning round a beam's foot (72 degrees repeat: 12 frames), in screen units of T = tq */
  const NCF = 12;
  function crownFrame(fi, tq, bq, sd) { return fxSprite('iu5cr|' + fi + '|' + tq + '|' + bq + '|' + sd, Math.ceil(tq * bq / 100 * 2.4 * SPX), Math.ceil(tq * 1.7 * SPX), (g, W, Hh) => {
    const T = tq * SPX, R0 = T * bq / 100, ox = W / 2, oy = Hh - T * 0.7, items = [];
    for (let j = 0; j < 5; j++) { const q = j / 5 * TAU + fi / NCF * TAU / 5; items.push({ q, j, s: Math.sin(q) }); } items.sort((a, b) => a.s - b.s);
    for (const it of items) { const rx = Math.cos(it.q) * R0 * 0.85, ry = Math.sin(it.q) * R0 * 0.85 * H.GY; K.shard(g, ox + rx, oy + ry, Math.round(T * 0.16), Math.round(T * 0.42), -Math.PI / 2 + Math.cos(it.q) * 0.45, sd + it.j, 0.85, null); } }); }
  /* a pair of little crystals frozen in a beam's trail (4 variants) */
  function trailPair(v, tq) { return fxSprite('iu5tp|' + v + '|' + tq, Math.ceil(tq * SPX), Math.ceil(tq * 0.9 * SPX), (g, W, Hh) => {
    const T = tq * SPX, ox = W * 0.42, oy = Hh - T * 0.1; K.shard(g, ox, oy, Math.round(T * 0.2), Math.round(T * 0.5), -Math.PI / 2 - 0.3, v, 0.85, null); K.shard(g, ox + T * 0.14, oy + T * 0.04, Math.round(T * 0.15), Math.round(T * 0.32), -Math.PI / 2 + 0.45, v + 1, 0.8, null); }); }
  /* the frost veins round the aim, once grown (painted once at their size) */
  function veinSpr(rq, ev) { return fxSprite('iu5vein|' + rq + '|' + ev, Math.ceil(rq * 2.7 * SPX), Math.ceil(rq * 2.7 * H.GY * SPX), (g, W, Hh) => { g.scale(SPX, SPX); K.frostVeins(g, W / SPX / 2, Hh / SPX / 2, rq, 1, 0.25, 3, 8 + ev); }); }
  /* ================= 8. Catastrophe ================= */
  U.catastrophe = (C, h) => {
    H = h; K = IK.bind(H); P = K.P;
    /* 4 s at Hatchling, 5 at Adept, 7 at Celestial (the user asked for it 3 s shorter); 3 / 7 / 10 beams */
    const me = H.me, x = C.tx, y = C.ty, ev = K.evo(C), NB = K.evoN(C, 3, 10), D = ev <= 4 ? 4 + (ev - 1) / 3 : 5 + (ev - 4) * 2 / 3, D0 = 5 + 5 * (ev - 1) / 6, RX = (3.6 + 0.3 * (ev - 1)) * C.K, BR = 0.95 + 0.06 * (ev - 1), TICK = 0.4;
    H.X.banner('CATASTROPHE', '', C.col, 1.6); H.X.sfx.hum(); H.warn(x, y, RX, 0.9, C.col);
    const NFL = H.n(80 + 5 * ev), FL = []; for (let i = 0; i < NFL; i++) { const sz = 3.5 + 9 * R1(i * 1.7) * R1(i * 2.9 + 1); FL.push({ sz, sp: 30 + 50 * R1(i * 4.1) + sz * 6, w: 0.6 + R1(i) * 0.6, x: R1(i * 7.3), y: R1(i * 3.1) }); }
    const beams = [];
    for (let i = 0; i < NB; i++) { const s = 0.35 + i * Math.min(0.42, D * 0.3 / NB), e = D - 0.15 - (NB - 1 - i) * Math.min(0.15, 1.2 / NB), b0 = i / NB * TAU + 0.4 + Math.random() * 0.3, r0 = RX * (0.35 + 0.45 * R1(i * 3.7 + 1));
      beams.push({ i, s, e, x: x + Math.cos(b0) * r0, y: y + Math.sin(b0) * r0, vx: 0, vy: 0, tgt: null, re: 0, nt: s + 0.3, tr: [], trT: s, ph: R1(i * 5.1) * TAU, spin: i % 2 ? 1 : -1, sd: i * 13 + 5 }); }
    /* a tick of a beam: a monster swept by beams takes ~11 / 16 / 24 x base over the cast at Hatchling / Adept / Celestial (Ice
       Age stays above it); the shorter cast hits harder per tick (D0 / D) so the total stays. kN dims each beam's light as
       their number grows so ten never wash out into white */
    const dmgT = C.base * C.K * K.evoK(C) * 0.85 / Math.pow(NB / 3 * D0 / 5, 0.7) * D0 / D, kN = Math.min(1, Math.sqrt(3 / NB) * 1.15), kq = Math.round(kN * 100), bq = Math.round(BR * 100);
    /* the cached pictures, painted a few a tick from the cast (before the first beam lands), never all on one frame */
    const warm = [() => flakeSpr(), () => footAdd(kq, bq)]; for (let i = 0; i < NSF; i++) warm.push(() => swirlFrame(i)); for (let i = 0; i < NBF; i++) warm.push(() => beamFrame(i, kq, bq)); for (let i = 0; i < NCF; i++) warm.push(() => crownFrame(i, 48, bq, 1)); for (let i = 0; i < 4; i++) warm.push(() => trailPair(i, 48));
    H.add({ life: D + 0.9, x, y, wi: 0,
      update(dt, f) {
        for (let q = 0; q < 3 && f.wi < warm.length; q++) warm[f.wi++]();
        const live = H.living();
        for (const b of beams) { if (f.t < b.s || f.t > b.e + 0.5) continue; const on = f.t < b.e;
          // steer: toward its own monster (one each when there are enough), sweeping across it; held inside the area, away from the pet
          if (on && (!b.tgt || b.tgt.dead || f.t > b.re)) { b.re = f.t + 1.1 + R1(b.sd + f.t) * 0.6; const taken = new Set(beams.filter(q => q !== b && q.tgt).map(q => q.tgt)); const cand = live.filter(m => Math.hypot(m.x - x, m.y - y) < RX * 1.25 + m.r); const free = cand.filter(m => !taken.has(m)); const pool = free.length ? free : R1(b.sd + Math.floor(f.t)) < 0.35 ? cand : []; b.tgt = pool.length ? pool.sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0] : null; }
          const V = 1.7 + 0.08 * ev; let dx = 0, dy = 0;
          if (b.tgt && on) { const tx = b.tgt.x - b.x, ty = b.tgt.y - b.y, d = Math.hypot(tx, ty) || 1, k = Math.min(1, d / 1.2); dx = tx / d * V * k - ty / d * V * 0.55 * b.spin; dy = ty / d * V * k + tx / d * V * 0.55 * b.spin; }
          else { const ox = b.x - x, oy = b.y - y, d = Math.hypot(ox, oy) || 1; dx = -oy / d * V * b.spin + Math.cos(f.t * 0.9 + b.ph) * V * 0.4; dy = ox / d * V * b.spin + Math.sin(f.t * 1.1 + b.ph) * V * 0.4; }
          const cx = b.x - x, cy = b.y - y, dc = Math.hypot(cx, cy); if (dc > RX) { dx -= cx / dc * (dc - RX) * 3; dy -= cy / dc * (dc - RX) * 3; }
          const px = b.x - me.x, py = b.y - me.y, dp = Math.hypot(px, py) || 0.01; if (dp < 1.7) { dx += px / dp * (1.7 - dp) * 5; dy += py / dp * (1.7 - dp) * 5; }
          for (const o of beams) { if (o === b || tt0(o, f)) continue; const ex = b.x - o.x, ey = b.y - o.y, d2 = Math.hypot(ex, ey) || 0.01; if (d2 < 2.4) { dx += ex / d2 * (2.4 - d2) * 2.2; dy += ey / d2 * (2.4 - d2) * 2.2; } }
          const kk = Math.min(1, dt * 2.4); b.vx += (dx - b.vx) * kk; b.vy += (dy - b.vy) * kk; b.x += b.vx * dt; b.y += b.vy * dt;
          if (on && f.t - b.trT > 0.22) { b.trT = f.t; b.n = (b.n || 0) + 1; b.tr.push({ x: b.x, y: b.y, t: f.t, c: b.n % 2 === 0, n: b.n, sd: b.sd + b.n }); if (b.tr.length > 14) b.tr.shift(); }
          if (on && f.t >= b.nt) { b.nt += TICK; const k = H.hitArea(b.x, b.y, BR, dmgT, C.dmgO({ freeze: 1.1, chill: true })); if (k && Math.random() < 0.6 * kN) { K.glitter(b.x, b.y - 0.3, 4, 4); K.fragments(b.x, b.y - 0.2, 2, 3); } }
          if (on && Math.random() < 0.7 * H.Q() * kN) { const q = Math.random() * TAU, rr = BR * (0.4 + Math.random() * 0.6); H.P({ kind: Math.random() < 0.6 ? 'ember' : 'spark', x: b.x + Math.cos(q) * rr, y: b.y + Math.sin(q) * rr * 0.6, vx: -Math.sin(q) * 1.6 * b.spin, vy: -1.2 - Math.random() * 1.5, g: 0.1, drag: 0.6, life: 0.6 + Math.random() * 0.5, max: 1.1, size: 1.8 + Math.random() * 2, color: Math.random() < 0.5 ? P.white : Math.random() < 0.5 ? P.pale : P.cyan }); }
          if (on && Math.random() < 0.25 * H.Q()) K.snow(b.x, b.y - 0.2, 1, { v: 2 }); }
      },
      drawUnder(c, f, X, Y, T, t) {
        const fa = cl(Math.min(f.t / 0.6, (D + 0.9 - f.t) / 0.9)), S = scr(c), tt = f.t, m = T * 3;
        // the light leaves the floor: a cold blue dim over the battlefield
        c.save(); c.globalAlpha = 0.3 * fa; c.fillStyle = 'rgb(8,26,64)'; c.fillRect(S.x0, S.y0, S.w, S.h); c.restore();
        const Rv = T * RX * 1.05, gv = H.ease.out(cl(tt / 1.2)); if (gv < 1) K.frostVeins(c, X, Y, Rv, gv, 0.25 * fa, 3, 8 + ev); else { const rq = Math.round(Rv / 4) * 4, cv = veinSpr(rq, ev), k = Rv / rq; c.save(); c.globalAlpha = fa; c.drawImage(cv, X - cv.width / SPX / 2 * k, Y - cv.height / SPX / 2 * k, cv.width / SPX * k, cv.height / SPX * k); c.restore(); }
        const FA = footAdd(kq, bq);
        for (const b of beams) { if (tt < b.s) continue; const BX = H.sx(b.x), BY = H.sy(b.y), on = tt < b.e, a = cl((tt - b.s) / 0.35) * (on ? 1 : Math.max(0, 1 - (tt - b.e) / 0.45));
          // the frost light left along its path, fading
          for (let pi = 0; pi < b.tr.length; pi++) { const p = b.tr[pi], age = tt - p.t, k = Math.max(0, 1 - age / 1.3); if (k <= 0 || (p.n & 3)) continue; const qx = H.sx(p.x), qy = H.sy(p.y); if (qx < S.x0 - m || qx > S.x0 + S.w + m || qy < S.y0 - m || qy > S.y0 + S.h + m) continue; K.floorLight(c, qx, qy, T * BR * 1.9 * (0.6 + 0.4 * k), 0.36 * k * kN, P.pale); }
          if (a <= 0.01 || BX < S.x0 - m || BX > S.x0 + S.w + m || BY < S.y0 - m || BY > S.y0 + S.h + m) continue;
          // the floor under it (one cached picture in the floor's plane, turned): light pool, swirl, mist, the ice ring
          const br = 1 + 0.067 * Math.sin(tt * 3 + b.ph), sc = T * BR * 2.1 * br / 128, rot = tt * 2.6 * b.spin + b.ph, R0 = T * BR * br, rs = R0 * 1.5; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.65 * kN * a; c.drawImage(swirlAt(rot), BX - rs, BY - rs * H.GY, rs * 2, rs * 2 * H.GY);
          /* the ice ring's three glints running round it */
          const gq = Math.max(2, T * 0.06) * 2.5; c.globalAlpha = 0.42 * a; for (let i = 0; i < 3; i++) { const q = tt * 2 * b.spin + i * 2.1; c.drawImage(glowSprite(P.white), BX + Math.cos(q) * R0 * 0.95 - gq, BY + Math.sin(q) * R0 * 0.95 * H.GY - gq, gq * 2, gq * 2); } c.restore();
          c.save(); c.translate(BX, BY); c.scale(sc, sc * H.GY);
          c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(FA, -128, -128); c.restore(); }
      },
      draw(c, f, X, Y, T, t) {
        const fa = cl(Math.min(f.t / 0.6, (D + 0.9 - f.t) / 0.9)), S = scr(c), tt = f.t, topY = S.y0 - T * 0.5, m = T * 3;
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46;
        // (the pet is cut out only round the beams that come near it: a clip on everything costs every pixel)
        // the vortex in the sky the beams fall from
        const VX = X, VY = S.y0 + T * 0.6;
        K.glow(c, VX, VY, T * 7, P.blue, 0.4 * fa); K.glow(c, VX, VY, T * 3, P.cyan, 0.18 * fa);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * fa; const vr = T * 6.5; c.drawImage(swirlAt(-tt * 0.9), VX - vr, VY - vr * 0.38, vr * 2, vr * 2 * 0.38); c.globalAlpha = 0.35 * fa; c.drawImage(swirlAt(tt * 0.7), VX - vr * 0.6, VY - vr * 0.6 * 0.38, vr * 1.2, vr * 1.2 * 0.38); c.restore();
        const tq = 48, tk = T / tq, gw = glowSprite(P.white);
        // the beams
        for (const b of beams) { if (tt < b.s) continue; const on = tt < b.e, out = on ? 0 : cl((tt - b.e) / 0.45); if (out >= 1) continue;
          const BX = H.sx(b.x), BY = H.sy(b.y), grow = H.ease.in(cl((tt - b.s) / 0.32)), a = (0.35 + 0.65 * cl((tt - b.s - 0.2) / 0.3)) * (1 - out);
          const qa = b.ph + tt * 0.45 * b.spin, TY = topY; let TX = BX * 0.55 + VX * 0.45 + Math.cos(qa) * T * 1.6;
          /* a beam whose foot is in front of the pet leans aside so its column passes beside the pet, never over it */
          let over = false; { const u = (PY - TY) / (BY - TY); if (u > 0 && u < 1.05) { const need = T * BR * 0.75 + T * 0.75; if (u < 0.97) { const xu = TX + (BX - TX) * u, d = PX - xu; if (Math.abs(d) < need) { const xt = PX - (d >= 0 ? 1 : -1) * need; TX = Math.max(TX - T * 9, Math.min(TX + T * 9, (xt - BX * u) / (1 - u))); } } const u2 = Math.min(1, u); over = Math.abs(PX - (TX + (BX - TX) * u2)) < need; } }
          const w = T * BR * 1.4 * (on ? 1 : 1 - 0.7 * out) * (0.25 + 0.75 * cl((tt - b.s - 0.15) / 0.3)) * (1 + 0.06 * Math.sin(tt * 9 + b.ph));
          const offL = Math.max(TX, BX) + w < S.x0, offR = Math.min(TX, BX) - w > S.x0 + S.w;
          if (!offL && !offR) { const L = Math.hypot(BX - TX, BY - TY), ang = Math.atan2(BY - TY, BX - TX) - Math.PI / 2, Lg = L * grow, top0 = out * L;
            c.save(); if (over) petHole(c, T); c.translate(TX, TY); c.rotate(ang); c.globalCompositeOperation = 'lighter';
            // the column with its turning ribbons: one of 32 cached turning frames
            const ph = (((tt * 7 * b.spin) / TAU) % 1 + 1) % 1 * NBF;
            if (Lg - top0 > 1) { c.globalAlpha = a; c.drawImage(beamFrame(Math.round(ph) % NBF, kq, bq), -w * 0.55, top0, w * 1.1, Lg - top0); }
            // ice motes spiralling down inside it
            c.restore();
            // ice motes spiralling down inside it (placed along the beam, blitted unturned: the cheap path)
            if (Lg > T) { const mr = T * 0.22, ca = Math.cos(ang), sa = Math.sin(ang); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * a; for (let j = 0; j < 6; j++) { const u = (tt * 0.55 + j / 6 + b.i * 0.13) % 1, yy = top0 + (Lg - top0) * u, q = u * 12 + j * 1.3 - tt * 3 * b.spin, xx = Math.sin(q) * w * 0.45; if (yy > Lg) continue; c.drawImage(gw, TX + xx * ca - yy * sa - mr, TY + xx * sa + yy * ca - mr, mr * 2, mr * 2); } c.restore(); } }
          if (BX < S.x0 - m || BX > S.x0 + S.w + m || BY < S.y0 - m || BY > S.y0 + S.h + m * 2) continue;
          const nearP = Math.abs(BX - PX) < T * 5 && Math.abs(BY - PY) < T * 4; if (nearP) { c.save(); petHole(c, T); }
          // where it meets the floor: a splash of light, a slowly turning crown of shards (cached frames)
          if (grow >= 1 && a > 0.05) {
            const cp = (((tt * 1.8 * b.spin) / (TAU / 5)) % 1 + 1) % 1, cv = crownFrame(Math.floor(cp * NCF) % NCF, tq, bq, 1), cw = cv.width / SPX * tk, ch = cv.height / SPX * tk; c.save(); c.globalAlpha = a; c.drawImage(cv, BX - cw / 2, BY - ch + T * 0.7, cw, ch); c.restore(); }
          // little crystals frozen along its trail (one cached pair each, grown by stretching)
          for (const p of b.tr) { if (!p.c) continue; const age = tt - p.t, k = Math.min(cl(age / 0.18), Math.max(0, 1 - (age - 0.9) / 0.5)); if (k <= 0) continue; const sx2 = H.sx(p.x) + (R1(p.sd) - 0.5) * T * 0.6, sy2 = H.sy(p.y) + (R1(p.sd + 1) - 0.5) * T * 0.3; if (sx2 < S.x0 - m || sx2 > S.x0 + S.w + m || sy2 < S.y0 - m || sy2 > S.y0 + S.h + m) continue;
            const cv = trailPair(p.sd & 3, tq), cw = cv.width / SPX * tk, ch = cv.height / SPX * tk, gk = H.ease.back(cl(age / 0.18)); c.save(); c.translate(sx2, sy2 + ch * 0.1 / 0.9); c.scale(1, gk); c.globalAlpha = k; c.drawImage(cv, -cw * 0.42, -ch, cw, ch); c.restore(); }
          if (nearP) c.restore();
        }
        // snow falling over the whole screen: one cached flake, many small blits (two depths: far small and slow, near big and quick)
        if (fa > 0.01) { const fl = flakeSpr(); c.save(); c.globalAlpha = 0.9 * fa; for (let i = 0; i < NFL; i++) { const F = FL[i], fx2 = S.x0 + ((F.x * S.w + 18 * Math.sin(tt * F.w + i) + tt * 14) % S.w + S.w) % S.w, fy2 = S.y0 + ((F.y * S.h + tt * F.sp) % S.h); c.drawImage(fl, fx2 - F.sz, fy2 - F.sz, F.sz * 2, F.sz * 2); } c.restore(); }
      } });
    H.X.after(0.35, () => H.X.sfx.whoosh());
    for (let i = 0; i < NB; i++) H.X.after(beams[i].s + 0.32, () => { const b = beams[i]; H.X.light(b.x, b.y, 2.4, 0.35); H.X.shake(3, 0.12); H.X.sfx.crash(); K.glitter(b.x, b.y - 0.2, 8, 5); K.snow(b.x, b.y - 0.3, 6, { v: 2.5 }); H.X.ring(b.x, b.y, 0.2, BR * 1.6, 0.4, P.pale, 0.12); });
  };

  /* ================= 9. Ice Age ================= */
  U.iceage = (C, h) => {
    H = h; K = IK.bind(H); P = K.P;
    const me = H.me, x = C.tx, y = C.ty, ev = K.evo(C), RX = (3.6 + 0.3 * (ev - 1)) * C.K, CH = (4.2 + 0.4 * (ev - 1)) * Math.sqrt(C.K), ZF = CH * 0.55 + 2.0 + 0.1 * ev;
    const NW = K.lv(C, [2, 3, 5]), NR = K.lv(C, [1, 2, 3]), PER = K.lv(C, [[8], [6, 8], [6, 8, 10]]), NSAT = K.lv(C, [3, 5, 7]), NRING = K.lv(C, [2, 3, 4]), NSTR = K.lv(C, [14, 18, 26]);
    const FORM = 1.75, IMP = FORM + 0.42, SHAT = IMP + 0.16, SPR0 = IMP + 0.42, RGAP = 0.5, TOT = C.base * 16 * C.K * K.evoK(C), burstD = TOT * 0.55, sprD = TOT * 0.45 / NR;
    const near = Math.hypot(me.x - x, me.y - y) < RX + 2;
    H.X.banner('ICE AGE', '', C.col, 1.8); H.X.sfx.hum(); H.warn(x, y, RX, IMP, C.col);
    // the sprouted crystals, ring by ring: on the monsters first, the rest round the ring (never on the pet)
    const sprouts = [], pieces = [];
    const planSprouts = () => { const live = H.living().filter(m => Math.hypot(m.x - x, m.y - y) < RX * 1.1 + m.r);
      for (let r = 0; r < NR; r++) { const n = PER[r], ringR = RX * (NR === 1 ? 0.62 : 0.32 + 0.66 * r / (NR - 1)), t0 = SPR0 + r * RGAP, hh = (1.6 + 0.45 * r) * (1 + 0.05 * (ev - 1)), tg = live.slice().sort((p, q) => Math.abs(Math.hypot(p.x - x, p.y - y) - ringR) - Math.abs(Math.hypot(q.x - x, q.y - y) - ringR));
        for (let i = 0; i < n; i++) { let px, py; const m = tg[i % Math.max(1, tg.length)];
          if (m && i < tg.length + (r === NR - 1 ? 0 : 0) && i < Math.ceil(n / 2)) { px = m.x + (R1(i + r * 9) - 0.5) * 0.3; py = m.y + (R1(i * 2 + r) - 0.5) * 0.3; }
          else { const b = i / n * TAU + r * 0.37 + R1(i * 3 + r) * 0.3; px = x + Math.cos(b) * ringR * (0.85 + 0.3 * R1(i + r * 5)); py = y + Math.sin(b) * ringR * (0.85 + 0.3 * R1(i + r * 5)); }
          const dp = Math.hypot(px - me.x, py - me.y); if (dp < 1.6) { const k = 1.6 / Math.max(0.05, dp); px = me.x + (px - me.x) * k; py = me.y + (py - me.y) * k; }
          const out = Math.atan2(py - y, px - x), d = Math.hypot(px - x, py - y);
          const nsp = 2 + Math.floor(R1(i * 11 + r * 3) * 3), sp = []; for (let q = 0; q < nsp; q++) sp.push({ o: (q - (nsp - 1) / 2) * (0.32 + 0.12 * R1(q + i)) + (R1(q * 5 + i) - 0.5) * 0.15, k: q === Math.floor(nsp / 2) ? 1 : 0.55 + 0.3 * R1(q * 7 + i + r), dx: (q - (nsp - 1) / 2) * 0.12, v: (i + q) & 3, d: q * 0.035 });
          sprouts.push({ sp, r, x: px, y: py, t0: t0 + (d / Math.max(1, RX)) * 0.12 + R1(i * 7 + r) * 0.1, h: hh * (0.85 + 0.3 * R1(i * 5 + r)), lean: Math.cos(out) * (0.18 + 0.2 * R1(i + r)) + (R1(i * 9 + r) - 0.5) * 0.2, spin: R1(i * 4 + r) * TAU, hit: false, sd: i * 7 + r * 31 }); }
        const set = new Set(), mine = sprouts.filter(s => s.r === r); for (const s of mine) s.set = set; } };
    const END = SPR0 + (NR - 1) * RGAP + 0.3 + 1.45;
    H.add({ life: END + 0.6, x, y, spin: 0, wi: 0,
      update(dt, f) {
        const tt = f.t; f.spin += dt * (tt < FORM ? 0.9 + tt * 0.8 : 3);
        /* paint the crystal's turning frames a couple a tick while it forms, not all on one frame */
        for (let q = 0; q < 2 && f.wi < NF * 2; q++, f.wi++) crysFrame(f.wi % NF, f.wi < NF ? 320 : 112);
        if (tt < IMP) { K.aura(x, y - (f.zE || ZF), CH * 0.3, dt, 14, 0); if (Math.random() < 0.6 * H.Q()) K.snow(x + (Math.random() - 0.5) * RX * 1.6, y + (Math.random() - 0.5) * RX, 1, { v: 0.6, up: 0.2 }); }
        // the shattered crystal's big shards: ballistic, they burst into glitter where they land
        for (const p of pieces) { if (p.done) continue; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= 13 * dt; p.rot += p.vr * dt; if (p.z <= 0 && p.vz < 0) { p.done = true; K.glitter(p.x, p.y, 4, 3); if (Math.random() < 0.5) K.fragments(p.x, p.y, 2, 3); } }
        for (const s of sprouts) { if (s.hit || tt < s.t0 + 0.07) continue; s.hit = true;
          for (const m of H.near(s.x, s.y, 0.55 + s.h * 0.12)) { if (s.set.has(m)) continue; s.set.add(m); H.X.hitMon(m, sprD, C.dmgO({ freeze: 3, kb: 1, chill: true })); }
          K.glitter(s.x, s.y - 0.4, 6, 4); K.snow(s.x, s.y - 0.2, 3, { v: 1.5 }); if (Math.random() < 0.35) H.X.sfx.crack ? H.X.sfx.crack() : 0; }
        for (const s of sprouts) if (!s.gone && tt > s.t0 + 1.2) { s.gone = true; H.burst(s.x, s.y - s.h * 0.5, 'shard', 7, { v: 5, up: 3.5, g: 11, life: 0.55, size: 2.2, color: [P.white, P.pale, P.cyan, P.ice] }); K.fragments(s.x, s.y - s.h * 0.4, 4, 4); K.glitter(s.x, s.y - s.h * 0.5, 5, 4); }
        if (tt > IMP && tt < END && Math.random() < 1.2 * dt * 10 * H.Q()) { const q = Math.random() * TAU, rr = Math.sqrt(Math.random()) * RX; K.snow(x + Math.cos(q) * rr, y + Math.sin(q) * rr - 1.5, 1, { v: 0.5, up: 0.1, g: 0.5, life: 1.6 }); }
      },
      drawUnder(c, f, X, Y, T, t) {
        const tt = f.t, S = scr(c), endK = cl((END + 0.6 - tt) / 1.0), pre = tt < IMP, post = tt - IMP;
        // the world dims and turns cold as the crystal forms; the burst floods it with light
        const dim = pre ? 0.42 * H.ease.io(cl(tt / 1.3)) : 0.42 * Math.max(0, 1 - post / 0.5) * 0 + 0.18 * Math.max(0, 1 - post / 1.6);
        if (dim > 0.01) { const VR = T * 9, BX = X, BY = Y - T * ZF * 0.5; c.save(); c.globalAlpha = dim; c.drawImage(vigSpr(), BX - VR, BY - VR, VR * 2, VR * 2); c.fillStyle = 'rgb(6,20,52)'; c.fillRect(S.x0, S.y0, S.w, BY - VR - S.y0); c.fillRect(S.x0, BY + VR, S.w, S.y0 + S.h - BY - VR); c.fillRect(S.x0, BY - VR, BX - VR - S.x0, VR * 2); c.fillRect(BX + VR, BY - VR, S.x0 + S.w - BX - VR, VR * 2); c.restore(); }
        if (pre) { // light gathering on the floor below the crystal, a frost circle growing
          const g = cl(tt / FORM), fall = cl((tt - FORM) / (IMP - FORM)); lightPool(c, X, Y, T * RX * (0.4 + 0.5 * g + 0.3 * fall), 0.25 + 0.3 * g + 0.4 * fall);
          K.iceRing(c, X, Y, T * RX * H.ease.out(cl(tt / 0.9)), 0.55 * g, null, tt, Math.max(2, T * 0.05)); K.iceRing(c, X, Y, T * RX * 0.6 * H.ease.out(cl((tt - 0.3) / 0.9)), 0.45 * g, null, -tt, Math.max(2, T * 0.04));
          K.frostVeins(c, X, Y, T * RX, 0.25 * g + 0.4 * fall, 0.5 * g, 1, 8 + ev); return; }
        // the frozen field: frost veins racing out, a glassy pool, fading
        K.frostVeins(c, X, Y, T * RX * 1.15, H.ease.out(cl(post / 0.5)), 0.6 * endK, 1, 10 + ev * 1.2 | 0); K.frozenPool(c, X, Y, T * RX * 0.9 * H.ease.out(cl(post / 0.35)), 0.7 * endK, tt);
        lightPool(c, X, Y, T * RX * 1.3, 0.5 * Math.max(0, 1 - post / 1.1) + 0.12 * endK);
        // the waves of blue light rolling across the floor
        for (let k = 0; k < NW; k++) { const q = cl((post - k * 0.22) / (0.8 + 0.05 * k)); if (q <= 0 || q >= 1) continue; const R = T * RX * (0.95 + 0.14 * k) * H.ease.out(q), al = (1 - q) * (1 - 0.08 * k);
          c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, al * 0.85); c.drawImage(bandSpr(), X - R, Y - R * H.GY, R * 2, R * 2 * H.GY); c.globalAlpha = al * 0.35; c.drawImage(bandSpr(), X - R * 0.98, Y - R * H.GY - T * 0.35, R * 1.96, R * 1.96 * H.GY); c.restore(); }
        // light under every sprouted crystal
        for (const s of sprouts) { const a2 = tt - s.t0; if (a2 < 0 || a2 > 1.45) continue; const k = Math.min(cl(a2 / 0.1), cl((1.45 - a2) / 0.4)); const SX = H.sx(s.x), SY = H.sy(s.y); lightPool(c, SX, SY, T * s.h * 0.9, 0.6 * k); K.frostVeins(c, SX, SY, T * s.h * 0.8, H.ease.out(cl(a2 / 0.25)), 0.5 * k, s.sd, 5); }
      },
      draw(c, f, X, Y, T, t) {
        const tt = f.t, pre = tt < IMP, post = tt - IMP, g = H.ease.out(cl((tt - 0.1) / (FORM - 0.35))), fall = H.ease.in(cl((tt - FORM) / (IMP - FORM)));
        if (near) petHole(c, T);
        const S0 = scr(c), CYi = Y - T * (CH * 0.53 - 0.3), room = (CYi - T * 1.8) - (S0.y0 + T * 3.0), sk = Math.max(0.5, Math.min(1, room / (T * CH * 0.47))), hpx = T * CH * (0.15 + 0.85 * g) * lerp(sk, 1, tt < FORM ? 0 : fall);
        /* (where the sky is short, above an aim near the top of the screen, it forms smaller, as if higher, and grows as it falls) */
        const CYf = Math.min(CYi - T * 1.8, Math.max(Y - T * ZF, S0.y0 + T * 3.0 + T * CH * sk * 0.47)) + Math.sin(tt * 2.2) * T * 0.12, CX = X, CY = tt < FORM ? CYf : tt < IMP ? lerp(CYf, CYi, fall) : CYi; f.zE = (Y - CY) / T;
        if (tt < SHAT) {
          const inst = cl((tt - FORM + 0.6) / 0.6), fa = cl(tt / 0.25);
          // streams of shards spiralling in out of the air and joining the crystal
          if (tt < FORM + 0.1) { for (let i = 0; i < NSTR; i++) { const u = (tt * 0.8 + i / NSTR) % 1, live = Math.min(1, (FORM + 0.1 - tt) * 3), b = i * 2.4 + u * 3.2, rho = T * (7 - 6.2 * H.ease.in(u)), px = CX + Math.cos(b) * rho, py = CY + Math.sin(b) * rho * 0.55 + (1 - u) * T * 1.4, b2 = b + 0.12, px2 = CX + Math.cos(b2) * rho * 1.06, py2 = CY + Math.sin(b2) * rho * 0.58 + (1 - u) * T * 1.4, ang = Math.atan2(py - py2, px - px2), al = Math.sin(u * Math.PI) * live * fa;
              if (al < 0.03) continue; K.glow(c, px, py, T * 0.5, P.cyan, 0.4 * al); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * al; c.strokeStyle = P.pale; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(px, py); c.lineTo(px - Math.cos(ang) * T * 1.1, py - Math.sin(ang) * T * 1.1); c.stroke(); c.restore(); K.shard(c, px, py, T * 0.18, T * 0.5, ang, i, 0.9 * al, tt); } }
          // its light: a big cold glow, a white heart that brightens before it drops
          K.glow(c, CX, CY, hpx * 1.3, P.blue, 0.3 * fa); K.glow(c, CX, CY, hpx * 0.75, P.cyan, 0.12 * fa + 0.25 * inst);
          // falling: speed streaks above it
          if (!pre || tt > FORM) { const sp = cl((tt - FORM) / 0.15); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * sp; for (let j = 0; j < 4; j++) { const ox = (j - 1.5) * hpx * 0.12, L = hpx * (0.7 + 0.5 * R1(j)), w2 = T * (0.5 + 0.3 * R1(j + 4)); c.drawImage(colBSpr(), CX + ox - w2 / 2, CY - hpx * 0.35 - L, w2, L); } c.restore(); }
          // the rings of light round it: back halves behind the crystal
          const rings = []; for (let k = 0; k < NRING; k++) { const rr = hpx * (0.27 + 0.075 * k) * (0.7 + 0.3 * g), ry = rr * (0.24 + 0.05 * k), yo = (k - (NRING - 1) / 2) * hpx * 0.16, rot = (k % 2 ? 0.18 : -0.14) + Math.sin(tt * 0.8 + k) * 0.05, al = cl((tt - 0.25 - k * 0.15) / 0.4) * (pre ? 1 : 0); rings.push({ rr, ry, yo, rot, al, k }); }
          const ringHalf = (front) => { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const R of rings) { if (R.al <= 0) continue; c.globalAlpha = R.al * (front ? 0.95 : 0.45); c.beginPath(); c.ellipse(CX, CY + R.yo, R.rr, R.ry, R.rot, front ? 0 : Math.PI, front ? Math.PI : TAU); c.strokeStyle = rgbaS(P.cyan, 0.7); c.lineWidth = Math.max(2, T * 0.12); c.stroke(); c.strokeStyle = rgbaS(P.white, 0.9); c.lineWidth = Math.max(1, T * 0.04); c.stroke();
              for (let j = 0; j < 3; j++) { const q = tt * (1.6 + 0.3 * R.k) * (R.k % 2 ? -1 : 1) + j * TAU / 3, sn = Math.sin(q); if ((sn >= 0) !== front) continue; const ex = Math.cos(q) * R.rr, ey = sn * R.ry, cr = Math.cos(R.rot), sr = Math.sin(R.rot); K.glow(c, CX + ex * cr - ey * sr, CY + R.yo + ex * sr + ey * cr, T * 0.35, P.white, 0.8 * R.al); } } c.restore(); };
          ringHalf(false);
          // the crown of smaller crystals round its waist, turning with it (the ones behind first)
          const sats = []; for (let i = 0; i < NSAT; i++) { const q = f.spin * 0.5 + i * TAU / NSAT, sn = Math.sin(q); sats.push({ q, sn, i }); } sats.sort((a, b) => a.sn - b.sn);
          const drawSat = s => { const gs = cl((g - 0.25 - s.i * 0.04) / 0.5); if (gs <= 0) return; const cq = Math.cos(s.q), sh = hpx * (0.3 + 0.06 * R1(s.i * 3)) * H.ease.back(gs), lean = cq * 0.75 + (s.i % 2 ? 0.06 : -0.06), dx = cq * hpx * 0.15, dy = -hpx * 0.02 + s.sn * hpx * 0.06; drawCrys(c, CX + dx + Math.sin(lean) * sh * 0.4, CY + dy - Math.cos(lean) * sh * 0.4, sh, f.spin * 1.3 + s.i, lean, (0.75 + 0.25 * s.sn) * fa, false, 0.12); };
          for (const s of sats) if (s.sn < 0) drawSat(s);
          // the great crystal
          drawCrys(c, CX, CY, hpx, f.spin, Math.sin(tt * 1.3) * 0.04 * (pre && tt < FORM ? 1 : 0), fa, true, 0.3 + 0.2 * inst); K.glow(c, CX, CY + hpx * 0.05, hpx * 0.45, P.cyan, 0.22 * fa);
          if (tt >= IMP) { const cr = cl((tt - IMP) / (SHAT - IMP)); K.glow(c, CX, CY, hpx * 0.7, P.white, 0.9 * cr); }
          for (const s of sats) if (s.sn >= 0) drawSat(s);
          ringHalf(true);
          // a lavender glint sliding down its face, its white heart
          const u = (tt * 0.7) % 1; K.glow(c, CX - hpx * 0.05, CY - hpx * 0.42 + u * hpx * 0.9, hpx * 0.18, P.lav, 0.55 * Math.sin(u * Math.PI) * fa); K.glow(c, CX, CY + hpx * 0.03, hpx * 0.16, P.white, (0.3 + 0.45 * inst) * fa);
        }
        if (pre) return;
        // the burst: a white flash, a pillar of light, rays, the crystal's shards tumbling out
        const fl = Math.max(0, 1 - post / 0.35); if (fl > 0) { K.glow(c, X, Y - T * 1.2, T * RX * 0.9, P.white, 0.55 * fl); K.glow(c, X, Y - T * 0.5, T * RX * 1.1, P.cyan, 0.45 * fl); }
        const pil = Math.max(0, 1 - post / 0.6); if (pil > 0) { const S = scr(c), Lp = Y - S.y0 + T, w = T * CH * 0.28 * (0.4 + 0.6 * pil) * (1 + 0.2 * H.ease.out(cl(post / 0.2))); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = pil * 0.7; c.drawImage(colSpr(), X - w, Y - Lp, w * 2, Lp); c.globalAlpha = pil * 0.9; c.drawImage(colSpr(), X - w * 0.3, Y - Lp, w * 0.6, Lp); c.restore(); }
        const ra = Math.max(0, 1 - post / 1.0); if (ra > 0) { const NRY = 10 + 2 * ev; for (let i = 0; i < NRY; i++) { const b = -Math.PI + (i + 0.5) / NRY * Math.PI + Math.sin(i * 7.3) * 0.08, L = T * RX * (1.0 + 0.5 * R1(i * 3)) * H.ease.out(cl(post / 0.3)); H.ray(c, X, Y - T * 0.4, b, L, T * (0.35 + 0.3 * R1(i)), i % 3 ? P.cyan : P.white, 0.6 * ra); } }
        for (const p of pieces) { if (p.done) continue; const a2 = cl((tt - p.t0) / 0.05); K.shard(c, H.sx(p.x), H.sy(p.y) - p.z * T, T * p.w, T * p.h, p.rot, p.sd, 0.95 * a2, tt); K.glow(c, H.sx(p.x), H.sy(p.y) - p.z * T, T * p.w * 1.5, P.cyan, 0.25 * a2); }
        // the sprouted spikes: clusters of long ice needles erupting out of the frozen floor with a quick overshoot, fanning
        // outward from one base, glowing at the tips, then shattering
        for (const s of sprouts) { const a2 = tt - s.t0; if (a2 < 0 || a2 > 1.25) continue; const k = cl((1.25 - a2) / 0.2), SX = H.sx(s.x), SY = H.sy(s.y), hh = T * s.h * 1.15;
          if (SX < -hh * 2 || SY < -hh * 2) continue;
          K.glow(c, SX, SY - hh * 0.3, hh * 0.55, P.cyan, 0.35 * k); if (a2 < 0.2) K.glow(c, SX, SY, hh * 0.55, P.white, 0.7 * (1 - a2 / 0.2));
          for (const q of s.sp) { const u = cl((a2 - q.d) / 0.11), gr = u < 1 ? u * 1.18 : 1 + 0.18 * Math.max(0, 1 - (a2 - q.d - 0.11) / 0.12); spike(c, SX + q.dx * hh * 0.18, SY, hh * q.k, s.lean + q.o, q.v, k, gr); } }
      } });
    H.X.after(0.9, () => { H.X.shake(2, 0.5); H.X.sfx.hum(); });
    H.X.after(FORM, () => { H.X.sfx.whoosh(); planSprouts(); });
    H.X.after(IMP, () => {
      H.hitArea(x, y, RX, burstD, C.dmgO({ freeze: 3, kb: 2, chill: true })); for (const m of H.near(x, y, RX)) if (m.boss && !m.dead) m.freeze = Math.max(m.freeze || 0, 1);
      H.X.flash(0.28, '#E8FBFF'); H.X.shake(18, 0.45); H.X.hitstop(0.12); H.X.sfx.crash(); H.X.light(x, y, RX * 1.3, 0.35);
      H.X.ring(x, y, 0.3, RX, 0.55, P.white, 0.14); H.X.ring(x, y, 0.3, RX * 1.2, 0.8, P.cyan, 0.1);
      K.glitter(x, y - 0.5, 26, 8); K.fragments(x, y - 0.4, 18, 7); K.snow(x, y - 0.5, 14, { v: 4, up: 2 });
      for (let k = 1; k < NW; k++) H.X.after(k * 0.22, () => { H.X.shake(5 + k, 0.15); H.X.sfx.whoosh(); for (const m of H.near(x, y, RX * (0.95 + 0.14 * k))) H.slow(m, 2); });
    });
    H.X.after(SHAT, () => { const NP = K.lv(C, [12, 16, 22]); H.X.sfx.crash(); H.X.shake(8, 0.2);
      for (let i = 0; i < H.n(NP); i++) { const b = i / NP * TAU + Math.random() * 0.4, v = 2.5 + Math.random() * 3.5 * Math.sqrt(C.K) + 0.2 * ev; pieces.push({ x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2, z: CH * (0.15 + 0.6 * Math.random()), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 3 + Math.random() * 4, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 9, w: 0.22 + 0.2 * Math.random() * (1 + 0.08 * ev), h: 0.55 + 0.6 * Math.random() * (1 + 0.08 * ev), sd: i, t0: SHAT, done: false }); } });
    for (let r = 0; r < NR; r++) H.X.after(SPR0 + r * RGAP, () => { H.X.shake(6 + 3 * r, 0.2); H.X.sfx.crash(); });
  };
})();
