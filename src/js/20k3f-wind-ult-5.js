/* ---------- Wind, reworked: Dandelion Cyclone ----------
   A dandelion clock grows where you aim: a green stem climbs out of a rosette of serrated leaves and opens into a
   shaded spherical seed head (hundreds of fine white filaments, each ending in a feathery pappus, lit from the upper
   left, the back half seen faintly through the front, a green-gold receptacle at the heart) with soft pollen glow.
   Seeds lift off it in waves (the head visibly thins), are caught by four mint wind ribbons and swept out in elegant
   spirals round the stalk; group by group the spirals turn and converge on the monsters, each closing into a small
   glittering cyclone of seeds that strikes and bursts. Last, the bald head pops in a gust: a ring of seeds sweeps out
   across the ground, and everything drifts down and fades.
   Gameplay (as the first build, with evoK): 4 groups strike the 4 monsters nearest the aim at 2.0 / 2.4 / 2.8 / 3.2 s
   (radius 1.4, 1.6 x base x evoK each, the spot follows its monster), then the gust at 3.8 s over the whole area
   (radius 4.2 x K, 4 x base x evoK, kb 5, stun 0.3). Change from the first build: damage gains the usual evoK
   (1 + 0.08 x (evo - 1)); timings, targets and areas are unchanged; the drift-down exit (visual only) runs 1.7 s.
   Adept: more seeds, a second counter-wound ribbon on every stream, a halo of seeds orbiting the head. Celestial: a
   monumental head on a taller stem, the four streams open into the arms of a vast spiral galaxy of seeds over a
   turning floor spiral of light, before they converge.
   Built for the phone: the head (six depletion stages), the seeds (16 tilts x 2 views), the leaves, the floor lights
   are cached sprites baked a piece at a time (U.dandelion.warm bakes them in idle time); per frame only blits and a
   few ribbon strokes; floor marks are light only. */
(() => {
  const U = ELEM_IMPL.wind.ult, TAU = Math.PI * 2;
  const MINT = '#73E8B6', EMER = '#16A57B', PALE = '#E7FFF6', WHITE = '#FFFFFF', POLLEN = '#FFF1A8', GOLD = '#E9D66B';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const GY = 0.55;
  let H;

  /* ---- bake queue (jobs painted a step at a time) ---- */
  const BK = { q: [], keys: new Set(), done: new Map(), job: null, ms: 0, built: 0, maxSlice: 0 };
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  function want(key) { const s = BK.done.get(key); if (s) return s; if (!BK.keys.has(key) && BAKE[key]) { BK.keys.add(key); BK.q.push(key); } return null; }
  function bakeStep(budget) { const t0 = performance.now(); while ((BK.job || BK.q.length) && performance.now() - t0 < budget) { const s = performance.now();
      if (BK.job) { const j = BK.job; j.step(j.i++); if (j.i >= j.n) { BK.done.set(j.key, j.cv); BK.job = null; BK.built++; } }
      else { const k = BK.q.shift(), r = BAKE[k](); if (r.step) { r.key = k; r.i = 0; BK.job = r; } else { BK.done.set(k, r); BK.built++; } }
      const d = performance.now() - s; BK.ms += d; if (d > BK.maxSlice) { BK.maxSlice = d; BK.maxKey = (BK.job ? BK.job.key + ':' + BK.job.i : 'q' + BK.q.length); } } }
  const wantAll = () => { for (const k in BAKE) want(k); };

  /* ---- the seed head: a sphere of NF filaments (a Fibonacci sphere), each a fine line from the receptacle out to a
     small feathery pappus; drawn back to front in depth/light bands (one stroked path per band), the receptacle between
     the back and front halves, a faint translucent haze. Stage s keeps the filaments whose hash is under KEEP[s] ---- */
  const HS = 320, HC = HS / 2, HR = HS * 0.42, NF = 300, KEEP = [1, 0.78, 0.56, 0.36, 0.18, 0.04];
  const LV = (() => { const v = [-0.5, -0.72, 0.6], n = Math.hypot(...v); return v.map(q => q / n); })();
  const FIL = []; for (let i = 0; i < NF; i++) { const y = 1 - 2 * (i + 0.5) / NF, r = Math.sqrt(1 - y * y), p = i * 2.39996 + 0.3; const d = [Math.cos(p) * r, y, Math.sin(p) * r]; FIL.push({ d, h: R1(i * 7.13 + 1.7), lit: Math.max(0, d[0] * LV[0] + d[1] * LV[1] + d[2] * LV[2]), len: 0.9 + 0.1 * R1(i * 3.1) }); }
  function headBake(s) { const cv = mk(HS, HS), g = cv.getContext('2d'), k = KEEP[s], keep = FIL.filter(f => f.h < k), kb = 0.35 + 0.65 * k;
    const band = (z0, z1, l0, l1) => keep.filter(f => f.d[2] >= z0 && f.d[2] < z1 && f.lit >= l0 && f.lit < l1);
    // bands: [z0, z1, light0, light1, filament rgba, tuft rgba, width]: pearly white, the back half a little greyer
    const B = [[-1.01, -0.4, 0, 2, 'rgba(206,230,224,0.5)', 'rgba(222,242,236,0.62)', 1.8], [-0.4, 0.15, 0, 2, 'rgba(228,244,239,0.66)', 'rgba(238,250,246,0.76)', 2],
      [0.15, 1.01, 0, 0.35, 'rgba(232,246,242,0.9)', 'rgba(240,252,248,0.92)', 2.2], [0.15, 1.01, 0.35, 0.7, 'rgba(250,255,253,1)', 'rgba(252,255,254,1)', 2.3], [0.15, 1.01, 0.7, 2, 'rgba(255,255,255,1)', 'rgba(255,255,255,1)', 2.5]];
    const line = f => [HC + f.d[0] * HR * f.len, HC + f.d[1] * HR * f.len];
    const strokeSet = (set, fc, tc, w) => { if (!set.length) return;
      g.strokeStyle = fc; g.lineWidth = w; g.beginPath(); for (const f of set) { const [x1, y1] = line(f); g.moveTo(HC + f.d[0] * HR * 0.2, HC + f.d[1] * HR * 0.2); g.lineTo(x1, y1); } g.stroke();
      // the pappus at the tip: a little starburst of filaments, foreshortened toward the rim
      g.strokeStyle = tc; g.lineWidth = w * 0.7; g.beginPath(); for (const f of set) { const [x1, y1] = line(f), q = 0.35 + 0.65 * Math.abs(f.d[2]), tl = HR * 0.13; const a0 = Math.atan2(f.d[1], f.d[0]);
        for (let j = 0; j < 7; j++) { const b2 = a0 + (j / 7) * TAU + f.h * 3, ex = Math.cos(b2), ey = Math.sin(b2), out = 0.6 + 0.4 * (ex * f.d[0] + ey * f.d[1] > 0 ? 1 : 0.4); g.moveTo(x1, y1); g.lineTo(x1 + ex * tl * out * (q + (1 - q) * Math.abs(ey)), y1 + ey * tl * out * (q + (1 - q) * Math.abs(ex))); } } g.stroke();
      g.fillStyle = tc; for (const f of set) { const [x1, y1] = line(f); g.fillRect(x1 - 1.6, y1 - 1.6, 3.2, 3.2); } };
    const strokeBand = b => strokeSet(band(b[0], b[1], b[2], b[3]), b[4], b[5], b[6]);
    const rad = (x, y, r, stops) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(q => gr.addColorStop(q[0], q[1])); g.fillStyle = gr; g.fillRect(0, 0, HS, HS); };
    const steps = [
      // a soft dark halo just outside the silhouette (it reads against light floors), the pearly body, a bright rim
      () => { rad(HC, HC, HR * 1.18, [[0, 'rgba(20,45,40,0)'], [0.78, 'rgba(20,45,40,0)'], [0.86, `rgba(20,45,40,${0.26 * kb})`], [1, 'rgba(20,45,40,0)']]);
        const gr = g.createRadialGradient(HC - HR * 0.3, HC - HR * 0.35, HR * 0.05, HC, HC, HR * 1.02); gr.addColorStop(0, `rgba(255,255,255,${0.62 * kb})`); gr.addColorStop(0.5, `rgba(236,252,246,${0.42 * kb})`); gr.addColorStop(0.82, `rgba(206,236,226,${0.3 * kb})`); gr.addColorStop(0.95, `rgba(255,255,255,${0.42 * kb})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(HC, HC, HR * 1.02, 0, TAU); g.fill(); },
      // a subtle gold and mint glow inside
      () => rad(HC, HC, HR * 0.62, [[0, 'rgba(255,236,150,0.5)'], [0.35, 'rgba(200,240,170,0.3)'], [0.7, 'rgba(115,232,182,0.12)'], [1, 'rgba(115,232,182,0)']]),
      () => strokeBand(B[0]), () => strokeBand(B[1]),
      () => { // the receptacle: a green-gold dome lit from the upper left, pitted where seeds have left
        const rr = HR * 0.19, gr = g.createRadialGradient(HC - rr * 0.35, HC - rr * 0.4, rr * 0.08, HC, HC, rr); gr.addColorStop(0, '#F4EE9C'); gr.addColorStop(0.35, '#C8CF5A'); gr.addColorStop(0.75, '#7FA13A'); gr.addColorStop(1, '#4C7428'); g.fillStyle = gr; g.beginPath(); g.arc(HC, HC, rr, 0, TAU); g.fill();
        g.strokeStyle = 'rgba(40,70,25,0.7)'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = 'rgba(70,90,30,0.55)'; for (let i = 0; i < 26; i++) { const a = i * 2.39996, r = rr * 0.85 * Math.sqrt((i + 0.5) / 26); g.beginPath(); g.arc(HC + Math.cos(a) * r, HC + Math.sin(a) * r * 0.9, 1.1, 0, TAU); g.fill(); }
        g.fillStyle = 'rgba(255,252,220,0.7)'; g.beginPath(); g.ellipse(HC - rr * 0.38, HC - rr * 0.42, rr * 0.28, rr * 0.16, -0.6, 0, TAU); g.fill(); },
      () => strokeBand(B[2]), () => strokeBand(B[3]), () => strokeBand(B[4]),
      // the silhouette's spokes: filaments edge-on at the rim, crisp from the centre to their tufts
      () => strokeSet(keep.filter(f => Math.abs(f.d[2]) < 0.3), 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)', 2.4),
      // shading: darker toward the lower right (on what is drawn), then a soft white rim light on the lit side
      () => { g.globalCompositeOperation = 'source-atop'; const gs = g.createLinearGradient(HC - HR, HC - HR, HC + HR, HC + HR); gs.addColorStop(0, 'rgba(70,105,100,0)'); gs.addColorStop(0.5, 'rgba(70,105,100,0.06)'); gs.addColorStop(1, 'rgba(60,95,90,0.38)'); g.fillStyle = gs; g.fillRect(0, 0, HS, HS); g.globalCompositeOperation = 'source-over';
        const gl = g.createLinearGradient(HC - HR, HC - HR, HC + HR, HC + HR); gl.addColorStop(0, `rgba(255,255,255,${0.55 * kb})`); gl.addColorStop(0.55, `rgba(240,255,250,${0.18 * kb})`); gl.addColorStop(1, 'rgba(240,255,250,0.04)'); g.strokeStyle = gl; g.lineCap = 'round';
        for (const [w, r] of [[9, 1.0], [5, 1.0], [2, 1.01]]) { g.globalAlpha = w === 9 ? 0.35 : w === 5 ? 0.6 : 1; g.lineWidth = w; g.beginPath(); g.arc(HC, HC, HR * r, 0, TAU); g.stroke(); } g.globalAlpha = 1; } ];
    return { cv, n: steps.length, step(i) { steps[i](); } }; }
  /* a seed: a slim ribbed achene, a long beak, a feathery parachute crown with a soft glow; 16 tilts x 2 views
     (the crown from the side as an umbrella, or from below as a starburst), 48 px cells */
  const SN = 16, SS = 48;
  function seedBake(view) { const cv = mk(SS * SN, SS), g = cv.getContext('2d');
    return { cv, n: SN, step(i) { g.save(); g.translate(SS * i + SS / 2, SS / 2); g.rotate(i / SN * TAU); g.lineCap = 'round';
      const cy = view ? -6 : -9;
      // crown glow
      const gr = g.createRadialGradient(0, cy, 0, 0, cy, 15); gr.addColorStop(0, 'rgba(255,255,255,0.6)'); gr.addColorStop(0.35, 'rgba(240,255,250,0.2)'); gr.addColorStop(1, 'rgba(231,255,246,0)'); g.fillStyle = gr; g.fillRect(-15, cy - 15, 30, 30);
      // beak
      g.strokeStyle = 'rgba(224,216,180,0.95)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 7); g.lineTo(0, cy); g.stroke();
      // achene
      g.beginPath(); g.ellipse(0, 12, 2.1, 5, 0, 0, TAU); const ga = g.createLinearGradient(-2, 0, 2, 0); ga.addColorStop(0, '#E2BE6A'); ga.addColorStop(0.5, '#A97C34'); ga.addColorStop(1, '#5E431C'); g.fillStyle = ga; g.fill(); g.strokeStyle = 'rgba(60,40,15,0.7)'; g.lineWidth = 0.7; g.stroke();
      g.strokeStyle = 'rgba(255,236,170,0.55)'; g.beginPath(); g.moveTo(-0.6, 8.5); g.lineTo(-0.6, 15.5); g.stroke();
      // the crown
      const n = view ? 14 : 11;
      for (let j = 0; j < n; j++) { let ex, ey, L;
        if (view) { const b = j / n * TAU; ex = Math.cos(b); ey = Math.sin(b) * 0.5; L = 9.5; } else { const b = -Math.PI * (0.06 + 0.88 * j / (n - 1)); ex = Math.cos(b); ey = Math.sin(b) * 0.75 - 0.12; L = 10 + 1.5 * Math.sin(j); }
        const back = view && ey < 0; g.strokeStyle = back ? 'rgba(230,246,240,0.75)' : 'rgba(255,255,255,1)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(0, cy); g.quadraticCurveTo(ex * L * 0.55, cy + ey * L * 0.55 - (view ? 0 : 1.5), ex * L, cy + ey * L); g.stroke();
        g.fillStyle = back ? 'rgba(236,250,246,0.8)' : 'rgba(255,255,255,1)'; g.beginPath(); g.arc(ex * L, cy + ey * L, 1.4, 0, TAU); g.fill(); }
      g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.arc(0, cy, 1.1, 0, TAU); g.fill(); g.restore(); } }; }
  /* a rosette leaf (the dandelion's toothed leaf), lit, pointing +x from its base */
  function leafBake() { const W = 128, Hh = 48, cv = mk(W, Hh), g = cv.getContext('2d'), cy = Hh / 2, wd = u => 13 * Math.sin(Math.PI * (0.1 + 0.82 * u)) + 1.5; g.beginPath(); g.moveTo(4, cy);
    const N = 6; for (let i = 0; i < N; i++) { const u1 = (i + 1) / N, x1 = 4 + u1 * 118, w = wd(u1); g.lineTo(x1 - 7, cy - w * 0.8); g.lineTo(x1 - 2, cy - w); g.lineTo(x1, cy - w * 0.78); }
    g.lineTo(124, cy); for (let i = N - 1; i >= 0; i--) { const u1 = (i + 1) / N, x1 = 4 + u1 * 118, w = wd(u1); g.lineTo(x1, cy + w * 0.78); g.lineTo(x1 - 2, cy + w); g.lineTo(x1 - 7, cy + w * 0.8); } g.closePath();
    const gr = g.createLinearGradient(0, cy - 14, 0, cy + 14); gr.addColorStop(0, '#9AD878'); gr.addColorStop(0.45, '#5FAE45'); gr.addColorStop(1, '#2F6E2C'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(25,60,25,0.4)'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = 'rgba(225,252,205,0.8)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(4, cy); g.quadraticCurveTo(60, cy - 1.5, 120, cy); g.stroke();
    // feathered: fading in from the base and out toward the tip
    g.globalCompositeOperation = 'destination-in'; const gf = g.createLinearGradient(0, 0, W, 0); gf.addColorStop(0, 'rgba(0,0,0,0)'); gf.addColorStop(0.16, 'rgba(0,0,0,1)'); gf.addColorStop(0.62, 'rgba(0,0,0,1)'); gf.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gf; g.fillRect(0, 0, W, Hh); return cv; }
  function radialBake(stops, n) { const cv = mk(n, n), g = cv.getContext('2d'), gr = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); stops.forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, n, n); return cv; }
  /* the Celestial floor spiral: four soft arms of light (in the floor's plane, squashed when drawn) */
  function galaxyBake() { const S = 384, c0 = S / 2, cv = mk(S, S), g = cv.getContext('2d');
    return { cv, n: 4, step(a) { const a0 = a / 4 * TAU; for (const [col, al, wm] of [['22,165,123', 0.1, 1], ['115,232,182', 0.14, 0.55], ['231,255,246', 0.3, 0.2]]) { g.fillStyle = `rgba(${col},${al})`; g.beginPath(); const P = [];
        for (let i = 0; i <= 60; i++) { const u = i / 60, r = c0 * (0.08 + 0.88 * u), b = a0 + u * 3.6, w = 26 * Math.sin(Math.PI * u) * wm * (1 - 0.5 * u) + 0.5; P.push([c0 + Math.cos(b) * r, c0 + Math.sin(b) * r, Math.cos(b), Math.sin(b), w]); }
        P.forEach((p, i) => i ? g.lineTo(p[0] + p[2] * p[4], p[1] + p[3] * p[4]) : g.moveTo(p[0] + p[2] * p[4], p[1] + p[3] * p[4])); for (let i = P.length - 1; i >= 0; i--) g.lineTo(P[i][0] - P[i][2] * P[i][4], P[i][1] - P[i][3] * P[i][4]); g.closePath(); g.fill(); } } }; }
  const BAKE = {
    seedS: () => seedBake(0), seedT: () => seedBake(1),
    head0: () => headBake(0), head1: () => headBake(1), head2: () => headBake(2), head3: () => headBake(3), head4: () => headBake(4), head5: () => headBake(5),
    leaf: leafBake,
    pool: () => radialBake([[0, 'rgba(255,248,210,0.55)'], [0.3, 'rgba(115,232,182,0.28)'], [0.7, 'rgba(22,165,123,0.08)'], [1, 'rgba(22,165,123,0)']], 128),
    ring: () => radialBake([[0, 'rgba(115,232,182,0)'], [0.78, 'rgba(115,232,182,0)'], [0.9, 'rgba(115,232,182,0.4)'], [0.95, 'rgba(255,255,255,0.8)'], [0.985, 'rgba(231,255,246,0.2)'], [1, 'rgba(231,255,246,0)']], 256),
    galaxy: galaxyBake,
  };
  let warmT = 0;
  const warm = () => { wantAll(); if (warmT || !(BK.q.length || BK.job)) return; const step = () => { bakeStep(4); warmT = BK.q.length || BK.job ? setTimeout(step, 40) : 0; }; warmT = setTimeout(step, 60); };

  /* a soft additive blit */
  function glowB(c, img, x, y, r, a, sy) { if (!(a > 0.01) || r < 0.5) return; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - r, y - r * (sy || 1), r * 2, r * 2 * (sy || 1)); }
  /* a ribbon of air along screen points: a wide faint mint body and a bright pale core, both tapered by chunks */
  function ribbonAir(c, P, w, a, thin) { const n = P.length; if (n < 3 || a <= 0.01) return; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let k = 0; k < 3; k++) { const i0 = Math.floor((n - 1) * k / 3), i1 = Math.ceil((n - 1) * (k + 1) / 3), e = Math.sin(Math.PI * (k + 0.5) / 3); c.beginPath(); c.moveTo(P[i0][0], P[i0][1]); for (let i = i0 + 1; i <= i1; i++) c.lineTo(P[i][0], P[i][1]);
      if (!thin) { c.strokeStyle = MINT; c.globalAlpha = 0.22 * a * e; c.lineWidth = w * e; c.stroke(); } c.strokeStyle = PALE; c.globalAlpha = 0.6 * a * e; c.lineWidth = Math.max(0.8, w * 0.22 * e); c.stroke(); } }

  /* ================= Dandelion Cyclone ================= */
  U.dandelion = (C, h) => {
    H = h; wantAll();
    const me = H.me, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, evoK = 1 + 0.08 * (ev - 1);
    const x = C.tx, y = C.ty, R = 4.2 * C.K, G = 4, conv = [2.0, 2.4, 2.8, 3.2], FIN = 3.8, LIFE = FIN + 1.7;
    const HSC = (CEL ? 1.75 : ADE ? 1.3 : 1.05) * Math.sqrt(C.K), Z = (CEL ? 3.1 : ADE ? 2.5 : 2.2), RMAX = CEL ? 0.92 : 0.75;
    H.X.banner('DANDELION CYCLONE', '', C.col, 1.4); H.X.sfx.hum();
    // the targets: the four monsters nearest the aim (or four spots round it); a spot follows its monster while it lives
    const tg = H.sortNear(x, y).filter(m => Math.hypot(m.x - x, m.y - y) < R + 2).slice(0, G), spots = [];
    for (let i = 0; i < G; i++) { const m = tg.length ? tg[i % tg.length] : null; spots.push(m ? { m, x: m.x, y: m.y } : { x: x + Math.cos(i / G * TAU) * R * 0.5, y: y + Math.sin(i / G * TAU) * R * 0.4 }); }
    const spot = i => { const s = spots[i]; if (s.m && !s.m.dead) { s.x = s.m.x; s.y = s.m.y; } return s; };
    /* a group's stream centre at time t: the head, then out round the stalk in a widening spiral, then a closing dive
       onto its spot (frozen at the strike) */
    const hold = [];
    function gcen(g, t) { const tc = conv[g];
      if (t <= 0.8) return [x, y, Z];
      const spiral = tt => { const u = cl((tt - 0.8) / (tc - 1.2)), ang = g * Math.PI / 2 + u * TAU * (1.05 + 0.1 * g) + 0.4, rr = 0.4 + sm(u) * R * RMAX * (0.82 + 0.18 * Math.sin(g * 1.7)); return [x + Math.cos(ang) * rr, y + Math.sin(ang) * rr * 0.72, Z - u * (Z - 1.3) + Math.sin(ang * 2 + g) * 0.35]; };
      if (t < tc - 0.4) return spiral(t);
      const p = spiral(tc - 0.4), s = t >= tc && hold[g] ? hold[g] : spot(g), v = H.ease.in(cl((t - (tc - 0.4)) / 0.4)); return [lerp(p[0], s.x, v), lerp(p[1], s.y, v), lerp(p[2], 0.9, v)]; }
    /* the seeds: NS visual seeds, each in a group, lifting off in a wave from a point on the head */
    const NSD = H.n(CEL ? 160 : ADE ? 116 : 76), WAVES = CEL ? [0.8, 1.0, 1.2, 1.4] : [0.8, 1.05, 1.3], seeds = [];
    for (let i = 0; i < NSD; i++) { const f = FIL[Math.floor(R1(i * 3.7) * NF)], w = i % WAVES.length;
      seeds.push({ g: i % G, ts: WAVES[w] + R1(i * 1.3) * 0.18, d: f.d, lag: R1(i * 5.9) * (CEL ? 0.75 : 0.5), ro: 0.12 + R1(i * 2.2) * (CEL ? 0.55 : 0.4), ph: R1(i * 8.1) * TAU, w: 3 + R1(i * 4.4) * 4, fl: 3 + R1(i) * 5, s: 0.8 + R1(i * 6.6) * 0.45, view: R1(i * 9.9) < 0.3 ? 1 : 0 }); }
    // the head's halo seeds (Adept+) and the final ring of seeds across the ground
    const NH = ADE ? H.n(CEL ? 26 : 14) : 0, gust = [];
    const motes = []; for (let i = 0; i < H.n(CEL ? 18 : 10); i++) motes.push({ ph: R1(i * 3.3) * TAU, r: 0.5 + R1(i * 1.1) * 0.6, z: (R1(i * 7.7) - 0.5) * 0.9, w: 0.8 + R1(i * 2.9) * 0.9 });
    let struck = 0, popped = false;
    const headK = t => { if (t >= FIN) return 0; let n = 0; for (const s of seeds) if (t >= s.ts) n++; return 1 - n / seeds.length * 0.96; };
    const F = H.add({ life: LIFE, x, y, key: 'dandelion',
      update(dt, f) { bakeStep(2.5); const t = f.t;
        if (t > FIN && !popped) { popped = true; const ng = H.n(CEL ? 44 : 28); for (let i = 0; i < ng; i++) { const b = i / ng * TAU + Math.random() * 0.2, v = 3 + Math.random() * 3; gust.push({ x, y, z: Z * (0.6 + 0.4 * Math.random()), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 0.6 + Math.random(), a: 1, ph: Math.random() * TAU, view: i % 3 === 0 ? 1 : 0, s: 0.8 + Math.random() * 0.4 }); } }
        for (const s of gust) { s.x += s.vx * dt; s.y += s.vy * dt; s.z = Math.max(0.15, s.z + s.vz * dt); const k = Math.exp(-dt * 1.6); s.vx *= k; s.vy *= k; s.vz = s.vz * k - 0.45 * dt; s.ph += dt * 2; } },
      drawUnder(c, f, X, Y, T) { const t = f.t, A = sm(t / 0.4) * (1 - sm((t - FIN - 0.6) / 1.0)); if (A <= 0.01) return; c.globalCompositeOperation = 'lighter';
        // a pool of pollen light under the head, a ring of light round the area
        const pool = want('pool'); if (pool) { const pr = T * (1.6 + 0.8 * HSC) * (1 + 0.05 * Math.sin(t * 4)); glowB(c, pool, X, Y, pr, 0.7 * A * sm((t - 0.2) / 0.5), GY); }
        const ring = want('ring'); if (ring) { const rr = R * T * (0.6 + 0.4 * sm(t / 0.9)); glowB(c, ring, X, Y, rr, 0.22 * A * (1 - sm((t - 1.2) / 1.0)) + 0.06 * A, GY); }
        // Celestial: the floor spiral of the galaxy, turning
        if (CEL) { const gx = want('galaxy'); if (gx) { const ga = A * sm((t - 0.8) / 0.6) * (1 - sm((t - 2.4) / 1.2)), rr = R * T * 1.05; if (ga > 0.01) { c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(t * 0.9); c.globalAlpha = 0.8 * ga; c.drawImage(gx, -rr, -rr, rr * 2, rr * 2); c.restore(); } } }
        // a glow under each closing cyclone
        if (pool) for (let g = 0; g < G; g++) { const tc = conv[g], u = (t - (tc - 0.6)) / 1.0; if (u <= 0 || u >= 1) continue; const s = t >= tc && hold[g] ? hold[g] : spot(g); glowB(c, pool, H.sx(s.x), H.sy(s.y), T * 1.3 * (0.6 + 0.6 * u), Math.sin(Math.PI * u) * 0.8, GY); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        // the rosette of leaves round the stem's foot
        const lf = want('leaf'); if (lf) { const g2 = H.ease.back(cl(t / 0.45)) * (1 - sm((t - FIN - 0.6) / 0.9)); if (g2 > 0.01) { const L = T * 0.72 * Math.sqrt(HSC) * g2; for (let i = 0; i < 6; i++) { const b = i / 6 * TAU + 0.35; c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(b); c.globalAlpha = 0.8 * (1 - 0.5 * sm((t - 1.0) / 1.2)); c.drawImage(lf, 0, -L * 0.3, L, L * 0.6); c.restore(); } } } },
      draw(c, f, X, Y, T) { const t = f.t, cm = want('seedS'), ct = want('seedT'); if (!cm || !ct) return;
        const A = 1 - sm((t - FIN - 0.9) / 0.8), pg = want('pool'), gw = glowSprite(POLLEN);
        // the mint ribbons the seeds ride: one per group (two, counter-wound, from Adept), along the stream's path
        for (let g = 0; g < G; g++) { const tc = conv[g]; if (t < 0.85 || t > tc + 0.15) continue; const a = sm((t - 0.85) / 0.4) * (1 - sm((t - tc + 0.05) / 0.2)), P = [], Q = [];
          for (let j = 0; j <= 24; j++) { const tt = t - j * (CEL ? 0.034 : 0.026); if (tt < 0.82) break; const p = gcen(g, tt), sx = H.sx(p[0]), sy = H.sy(p[1]) - p[2] * T, q = j * 0.32 - t * 4, e = Math.sin(Math.PI * j / 24); P.push([sx + Math.cos(q) * T * 0.12 * e, sy + Math.sin(q) * T * 0.08 * e]); if (ADE) Q.push([sx - Math.cos(q) * T * 0.3 * e, sy - Math.sin(q) * T * 0.2 * e]); }
          c.globalCompositeOperation = 'lighter'; ribbonAir(c, P, T * 0.32, 0.9 * a); if (ADE) ribbonAir(c, Q, T * 0.5, 0.8 * a, true); }
        c.globalCompositeOperation = 'lighter';
        // pollen motes round the head
        const hz = headPos(t, T, X, Y); if (t < FIN + 0.3) for (const m of motes) { const b = m.ph + t * m.w, mx = hz.x + Math.cos(b) * hz.r * m.r * 1.3, my = hz.y + Math.sin(b) * hz.r * m.r * 0.5 + m.z * hz.r; glowB(c, gw, mx, my, T * 0.1, 0.7 * hz.a * (0.5 + 0.5 * Math.sin(t * 5 + m.ph)) * A); }
        c.globalCompositeOperation = 'source-over';
        // the seeds in flight
        for (const s of seeds) { if (t < s.ts) continue; const tc = conv[s.g], age = t - s.ts; let wx, wy, wz, a = A, tilt = 0;
          if (t < tc) { const v = cl((t - (tc - 0.4)) / 0.4), lg = s.lag * (1 - v), p = gcen(s.g, Math.max(0.81, t - lg)), sw = t * s.w * (1 + 2.5 * v) + s.ph, ro = s.ro * (1 - 0.55 * v) * (CEL ? 1.4 : 1);
            wx = p[0] + Math.cos(sw) * ro; wy = p[1] + Math.sin(sw) * ro * 0.6; wz = p[2] + Math.sin(sw * 0.7 + s.ph) * ro * 0.5 + v * (s.ph / TAU - 0.5) * 1.2;
            const lift = sm(age / 0.55); if (lift < 1) { const hx = x + s.d[0] * 0.6 * HSC, hy = y, hz2 = Z - s.d[1] * 0.6 * HSC; wx = lerp(hx, wx, lift); wy = lerp(hy + s.d[2] * 0.2, wy, lift); wz = lerp(hz2, wz, lift); }
            tilt = -Math.sin(sw) * 0.5; }
          else { // the strike scattered them: out and up, then drifting down, glittering as they go
            const u = t - tc, e = 1 - Math.exp(-u * 3.2), sp = hold[s.g] || spot(s.g), b = s.ph; wx = sp.x + Math.cos(b) * (0.3 + e * 1.4 * s.s); wy = sp.y + Math.sin(b) * (0.3 + e * 1.4 * s.s) * 0.6; wz = 0.9 + e * 0.9 * (0.5 + s.ro) - u * 0.3; a *= 1 - sm((u - 0.5) / 0.8); tilt = Math.sin(t * s.fl + s.ph) * 0.6; if (a <= 0.02) continue; }
          drawSeed(c, cm, ct, H.sx(wx), H.sy(wy) - wz * T, T * 0.86 * s.s, tilt, a, s.view, t * s.fl + s.ph); }
        // the gust's seeds sweeping out over the ground, settling
        for (const s of gust) { const a = A * (1 - sm((t - FIN - 0.8) / 0.8)); if (a <= 0.02) break; drawSeed(c, cm, ct, H.sx(s.x), H.sy(s.y) - s.z * T, T * 0.9 * s.s, Math.sin(s.ph) * 0.5 + s.vx * 0.06, a, s.view, s.ph * 2); }
        // glitter in the cyclones and at the strikes
        c.globalCompositeOperation = 'lighter'; for (let g = 0; g < G; g++) { const tc = conv[g], u = (t - (tc - 0.35)) / 0.9; if (u <= 0 || u >= 1) continue; const sp = t >= tc && hold[g] ? hold[g] : spot(g), SX = H.sx(sp.x), SY = H.sy(sp.y);
          for (let j = 0; j < 7; j++) { const b = j * 0.9 + t * 9, rr = T * (0.7 - 0.4 * cl(u * 2)), gx2 = SX + Math.cos(b) * rr, gy2 = SY - T * (0.3 + j * 0.15) + Math.sin(b) * rr * 0.4; glowB(c, glowSprite(WHITE), gx2, gy2, T * 0.08, Math.sin(Math.PI * u) * 0.9); }
          if (t >= tc && pg) glowB(c, pg, SX, SY - T * 0.5, T * (0.5 + 1.2 * (t - tc)), 0.9 * (1 - cl((t - tc) / 0.45))); }
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; } });
    // the stem and the head stand among the monsters (depth-sorted at the aim)
    function headPos(t, T, X, Y) { const grow = H.ease.out(cl(t / 0.8)), sway = Math.sin(t * 1.7) * 0.06 + (t > FIN ? 0 : 0), r = T * 0.62 * HSC * (0.25 + 0.75 * H.ease.back(cl((t - 0.2) / 0.6))), hx = X + Math.sin(sway) * T * Z * grow, hy = Y - T * Z * grow; const a = t < FIN ? 1 : 1 - sm((t - FIN) / 0.35); return { x: hx, y: hy, r, a, grow, sway }; }
    H.add({ life: LIFE, x, y, entY: y, key: 'dandelionHead',
      drawEnt(c) { const t = F.t, T = H.X.Tz(), X = H.sx(x), Y = H.sy(y), hp = headPos(t, T, X, Y), out = 1 - sm((t - FIN - 0.6) / 0.9); if (out <= 0.01) return;
        // the stem: dark green, a lit side, a highlight line; it droops a little once the head has gone
        const droop = t > FIN ? sm((t - FIN) / 0.8) : 0, tipX = hp.x + droop * T * 0.5, tipY = hp.y + T * 0.2 + droop * T * 0.4, mx = (X + tipX) / 2 + T * 0.38, my = (Y + tipY) / 2;
        c.globalAlpha = out; c.lineCap = 'round'; const sw = T * 0.075 * Math.sqrt(HSC);
        for (const [col, w, ox] of [['#2E6A2A', sw * 1.6, 0], ['#24561F', sw * 0.7, sw * 0.4], ['#62AE48', sw * 0.85, -sw * 0.25], ['rgba(214,250,186,0.8)', sw * 0.3, -sw * 0.48]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(X + ox, Y); c.quadraticCurveTo(mx + ox, my, tipX + ox, tipY); c.stroke(); }
        // bracts curling down under the head
        if (hp.a > 0.02 || droop < 1) { c.strokeStyle = '#4E8F38'; c.lineWidth = sw * 0.6; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(tipX, tipY); c.quadraticCurveTo(tipX + i * T * 0.12, tipY + T * 0.05, tipX + i * T * 0.16, tipY + T * 0.2); c.stroke(); } }
        if (hp.a <= 0.01) { c.globalAlpha = 1; return; }
        // the head: two depletion stages cross-faded, swaying with the stem
        const k = headK(t), si = (1 - k) * (KEEP.length - 1), s0 = Math.min(KEEP.length - 2, Math.floor(si)), fr = si - s0, im0 = want('head' + s0), im1 = want('head' + (s0 + 1));
        c.globalCompositeOperation = 'lighter'; glowB(c, glowSprite(MINT), hp.x, hp.y, hp.r * 1.6, 0.18 * hp.a * (0.6 + 0.4 * k)); glowB(c, glowSprite(POLLEN), hp.x, hp.y, hp.r * 0.7, 0.25 * hp.a); c.globalCompositeOperation = 'source-over';
        const D = hp.r / (HR / HS) ; c.save(); c.translate(hp.x, hp.y); c.rotate(hp.sway * 0.8 + Math.sin(t * 2.3) * 0.03); const pop = t > FIN ? 1 + 0.4 * sm((t - FIN) / 0.35) : 1; c.scale(pop, pop);
        if (im0) { c.globalAlpha = hp.a * (im1 ? 1 - fr : 1); c.drawImage(im0, -D / 2, -D / 2, D, D); } if (im1 && fr > 0.01) { c.globalAlpha = hp.a * fr; c.drawImage(im1, -D / 2, -D / 2, D, D); } if (im0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = hp.a * 0.4; c.drawImage(im0, -D / 2, -D / 2, D, D); c.globalCompositeOperation = 'source-over'; }
        c.restore();
        // Adept: a halo of seeds orbiting the head
        const cm = want('seedS'), ct = want('seedT'); if (NH && cm && ct) { const ha = hp.a * sm((t - 0.7) / 0.5); for (let i = 0; i < NH; i++) { const b = i / NH * TAU + t * (0.9 + 0.2 * (i % 3)), rr = hp.r * (1.35 + 0.15 * Math.sin(i * 2.1 + t)), sx = hp.x + Math.cos(b) * rr, sy = hp.y + Math.sin(b) * rr * 0.42 + Math.sin(b * 2 + i) * hp.r * 0.15; drawSeed(c, cm, ct, sx, sy, T * 0.8, -Math.cos(b) * 0.5, ha * (Math.sin(b) > 0 ? 1 : 0.55), i % 3 === 0 ? 1 : 0, t * 4 + i); } }
        c.globalAlpha = 1; } });
    /* a seed blitted from its atlas: tilt (rad from upright) bucketed, a flutter squash */
    function drawSeed(c, cm, ct, sx, sy, L, tilt, a, view, fl) { if (a <= 0.02) return; const ci = ((Math.round(tilt / TAU * SN) % SN) + SN) % SN, fy = 0.82 + 0.18 * Math.sin(fl); c.globalAlpha = Math.min(1, a); c.drawImage(view ? ct : cm, ci * SS, 0, SS, SS, sx - L / 2, sy - L * fy / 2, L, L * fy); }
    // the strikes: each group closes on its spot and strikes there (the spot is held from that moment)
    conv.forEach((t0, i) => H.X.after(t0, () => { const s = spot(i); hold[i] = { x: s.x, y: s.y }; struck++; H.hitArea(s.x, s.y, 1.4, C.base * 1.6 * evoK, C.dmgO({ kb: 2 }));
      H.add({ life: 0.45, x: s.x, y: s.y, drawUnder(c, f, X, Y, T) { const u = f.t / 0.45, rg = want('ring'); if (!rg) return; c.globalCompositeOperation = 'lighter'; glowB(c, rg, X, Y, T * (0.4 + u * 1.6), (1 - u) * 0.9, GY); } });
      for (let j = 0; j < H.n(6); j++) H.P({ kind: 'spark', x: s.x + (Math.random() - 0.5) * 0.8, y: s.y - 0.4, vx: (Math.random() - 0.5) * 3, vy: -1.5 - Math.random() * 2, life: 0.5, max: 0.5, size: 2, color: j % 2 ? PALE : POLLEN });
      H.X.shake(4, 0.1); H.X.sfx.whoosh(); }));
    H.X.after(FIN, () => { H.hitArea(x, y, R, C.base * 4.0 * evoK, C.dmgO({ kb: 5, stun: 0.3 }));
      H.add({ life: 0.8, x, y, drawUnder(c, f, X, Y, T) { const u = f.t / 0.8, rg = want('ring'); if (!rg) return; c.globalCompositeOperation = 'lighter'; glowB(c, rg, X, Y, T * (0.5 + u * R), (1 - u), GY); glowB(c, rg, X, Y, T * (0.3 + u * R * 0.7), (1 - u) * 0.5, GY); } });
      H.X.flash(0.2, PALE); H.X.shake(10, 0.3); H.X.hitstop(0.05); H.X.sfx.crash(); });
  };
  U.dandelion.warm = warm;
  U.dandelion.__dbg = { BK, bakeStep };
})();
