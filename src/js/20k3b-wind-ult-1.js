/* ---------- Wind, reworked: Flower Hurricane (a flower storm) ----------
   A delicate pink wreath turns on the floor beneath the pet, then bursts: a dense storm of blossoms (pink five-petal
   flowers, loose petals, a few white and lavender ones) sweeps out and whirls through the battlefield. The storm moves
   as several coherent streams, like a murmuration of blossoms: each follows a leader on broad curves through the monster
   groups, its flowers strung along the leader's wake in a corkscrewing ribbon that widens toward its tail, now and then
   dividing into two strands and merging again; it swirls round a monster it reaches before sweeping on. Thin mint wind
   streaks carry each stream (accents only, no funnels or columns). The flowers spin and flip edge-on like blades.
   Hatchling: 3 streams for 6 s. Adept: 5 streams for 8 s, with crossing passes. Celestial: 7 streams for 10 s, a vast
   storm that once forms a giant rotating seven-petal blossom over the monsters (its streams tracing the petals over a
   rose of light on the floor), and ends in a converging cutting rush through them. Then the storm loses speed; the
   flowers drift down, shrink and dissolve.
   Damage: each stream is one cutting volume (its head and wake, a few spheres along it, wider while it is split): every
   0.5 s of the game clock it cuts each monster inside it once (a pink slash and a burst of petals on contact). A
   monster held inside one stream the whole time takes ~12 / 16 / 20 x base (x C.K). The flowers themselves are visual.
   Built for the phone: the flowers are blits from small atlases baked once per cast size (4 tints x 4 tilts x 6 tilt
   axes x 4 spins), painted a few milliseconds a frame from the cast or in idle time (the .warm hook); no per-flower
   transform, path or gradient. */
(() => {
  const U = ELEM_IMPL.wind.ult, TAU = Math.PI * 2;
  delete U.carousel;
  let H;
  const MINT = '#73E8B6', EMER = '#16A57B', AIR = '#E7FFF6', PINK = '#FFAFD2', ROSE = '#DE5A9A', CREAM = '#FFF0C4';
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
  const wrapA = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const tierOf = ev => (ev >= 7 ? 3 : ev >= 4 ? 2 : 1);
  const durOf = ev => (ev <= 4 ? 6 + (ev - 1) * 2 / 3 : 8 + (ev - 4) * 2 / 3);
  const sizeOf = ev => (ev <= 4 ? 1 + (ev - 1) * 0.25 / 3 : 1.25 + (ev - 4) * 0.1);
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /* ================= cached sprites ================= */
  /* a five-petal blossom (2 tints), turned through its 72-degree repeat in NBR buckets */
  const NBR = 12, BSZ = 44;
  function petalPath(g, L) { g.beginPath(); g.moveTo(0, -L * 0.1); g.bezierCurveTo(-L * 0.55, -L * 0.28, -L * 0.6, -L * 0.88, -L * 0.17, -L * 1.0); g.lineTo(0, -L * 0.88); g.lineTo(L * 0.17, -L * 1.0); g.bezierCurveTo(L * 0.6, -L * 0.88, L * 0.55, -L * 0.28, 0, -L * 0.1); g.closePath(); }
  const blossomSpr = (v, b) => fxSprite('fhwB' + v + '|' + b, BSZ, BSZ, g => {
    const c0 = BSZ / 2, L = BSZ * 0.42, body = v ? '#FFD3E6' : PINK, deep = v ? '#F08CBF' : ROSE, tip = v ? '#FFF2F8' : '#FFE1EE';
    g.translate(c0, c0); g.rotate(b / NBR * TAU / 5);
    for (let i = 0; i < 5; i++) { g.save(); g.rotate(i * TAU / 5); petalPath(g, L);
      const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, deep); gr.addColorStop(0.35, body); gr.addColorStop(1, tip); g.fillStyle = gr; g.fill();
      g.strokeStyle = rgbaS(ROSE, 0.6); g.lineWidth = 1; g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.4)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, -L * 0.22); g.quadraticCurveTo(-L * 0.05, -L * 0.55, 0, -L * 0.78); g.stroke(); g.restore(); }
    // shade the lower right a little (the light from the upper left), lift the upper left
    g.globalCompositeOperation = 'source-atop'; let gr = g.createLinearGradient(-L, -L, L, L); gr.addColorStop(0, 'rgba(255,255,255,0.22)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(140,30,80,0.22)'); g.fillStyle = gr; g.fillRect(-c0, -c0, BSZ, BSZ); g.globalCompositeOperation = 'source-over';
    gr = g.createRadialGradient(-1, -1, 0, 0, 0, L * 0.26); gr.addColorStop(0, '#FFFBEA'); gr.addColorStop(0.55, CREAM); gr.addColorStop(1, '#E9B95A'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, L * 0.24, 0, TAU); g.fill();
    g.fillStyle = 'rgba(214,120,40,0.75)'; for (let i = 0; i < 5; i++) { const q = i * TAU / 5 + 0.6; g.beginPath(); g.arc(Math.cos(q) * L * 0.13, Math.sin(q) * L * 0.13, 0.9, 0, TAU); g.fill(); } });
  /* a single petal (2 tints) in 24 turning buckets, and a little leaf in 16 */
  const NPR = 24, PSZ = 22;
  const petalSpr = (v, b) => fxSprite('fhwP' + v + '|' + b, PSZ, PSZ, g => {
    const c0 = PSZ / 2, L = PSZ * 0.44; g.translate(c0, c0); g.rotate(b / NPR * TAU); g.translate(0, L * 0.5);
    petalPath(g, L); const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, v ? '#F59AC6' : ROSE); gr.addColorStop(0.4, v ? '#FFD6E9' : PINK); gr.addColorStop(1, '#FFF0F6'); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(ROSE, 0.5); g.lineWidth = 0.8; g.stroke(); });
  /* the wreath's light on the floor (a soft mint ring with a pink inner line) */
  const wreathSpr = () => fxSprite('fhwWr', 160, 160, (g, w) => {
    const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(115,232,182,0)'], [0.42, 'rgba(115,232,182,0.05)'], [0.6, 'rgba(115,232,182,0.32)'], [0.7, 'rgba(231,255,246,0.75)'], [0.76, 'rgba(255,175,210,0.45)'], [0.86, 'rgba(115,232,182,0.14)'], [1, 'rgba(115,232,182,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* Celestial: a loose seven-petal flower of light on the floor (a rose curve), drawn turning under the gathered twisters */
  const roseSpr = () => fxSprite('fhwRose', 256, 256, (g, w) => {
    const c0 = w / 2, R = c0 * 0.93; g.translate(c0, c0); g.lineJoin = 'round';
    const path = () => { g.beginPath(); for (let i = 0; i <= 420; i++) { const q = i / 420 * TAU, rr = R * (0.2 + 0.8 * Math.abs(Math.cos(3.5 * q))), x = Math.cos(q) * rr, y = Math.sin(q) * rr; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); };
    for (const [col, lw] of [['rgba(255,175,210,0.16)', 16], ['rgba(115,232,182,0.28)', 7], ['rgba(231,255,246,0.6)', 2.4]]) { path(); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, 'rgba(255,175,210,0.3)'); gr.addColorStop(0.3, 'rgba(115,232,182,0.1)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });

  /* a pink slash (a feathered crescent), drawn turned where a stream cuts */
  const slashSpr = () => fxSprite('fhwSlash', 96, 44, (g, w, h) => {
    g.translate(w / 2, h * 0.92);
    const cres = (R, th) => { g.beginPath(); g.arc(0, R * 0.95, R, -Math.PI / 2 - 0.95, -Math.PI / 2 + 0.95); g.arc(0, R * 0.95 + th, R + th * 0.15, -Math.PI / 2 + 0.85, -Math.PI / 2 - 0.85, true); g.closePath(); };
    for (const [R, th, col] of [[w * 0.47, h * 0.42, 'rgba(255,175,210,0.25)'], [w * 0.46, h * 0.28, 'rgba(255,175,210,0.55)'], [w * 0.45, h * 0.14, 'rgba(255,230,242,0.9)'], [w * 0.44, h * 0.05, 'rgba(255,255,255,1)']]) { cres(R, th); g.fillStyle = col; g.fill(); } });
  /* the flower atlases: one per tint and size, every tilt x tilt axis x spin (cells painted on demand or ahead in slices) */
  const NT = 4, NA = 6, NSP = 4, TILTS = [0, 0.8, 1.18, 1.43];
  const TINTS = [[PINK, ROSE, '#FFE6F1', CREAM], ['#FFD6E8', '#EE8ABD', '#FFF4F9', CREAM], ['#FFFFFF', '#E9AECB', '#FFFFFF', '#FFE59A'], ['#E4D6FF', '#9C82DA', '#F7F2FF', '#FFF2C8']];
  const ATL = new Map();
  function atlas(ti, R) { const k = ti + '|' + R; let A = ATL.get(k); if (A) return A; const CS = Math.ceil(R * 2.3) + 2, cv = document.createElement('canvas'); cv.width = CS * NA * NSP; cv.height = CS * NT;
    A = { cv, g: cv.getContext('2d'), CS, R, ti, done: new Uint8Array(NA * NSP * NT) }; ATL.set(k, A); if (ATL.size > 12) { const k0 = ATL.keys().next().value; ATL.delete(k0); } return A; }
  function paintCell(A, tt, ai, si) {
    const g = A.g, CS = A.CS, R = A.R, cx = (ai * NSP + si + 0.5) * CS, cy = (tt + 0.5) * CS, tau = TILTS[tt], ct = Math.cos(tau), az = ai / NA * Math.PI, sp = si / NSP * TAU / 5, [body, deep, tip, mid] = TINTS[A.ti];
    g.save(); g.beginPath(); g.rect(cx - CS / 2, cy - CS / 2, CS, CS); g.clip(); g.translate(cx, cy);
    g.save(); g.rotate(az); g.scale(1, ct); g.rotate(-az + sp);
    for (let i = 0; i < 5; i++) { g.save(); g.rotate(i * TAU / 5); petalPath(g, R); const gr = g.createLinearGradient(0, 0, 0, -R); gr.addColorStop(0, deep); gr.addColorStop(0.38, body); gr.addColorStop(1, tip); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(A.ti === 3 ? '#7A5FC0' : ROSE, 0.6); g.lineWidth = Math.max(0.8, R * 0.07); g.stroke(); g.restore(); }
    g.beginPath(); g.arc(0, 0, R * 0.22, 0, TAU); g.fillStyle = mid; g.fill(); g.strokeStyle = 'rgba(200,110,40,0.55)'; g.lineWidth = Math.max(0.6, R * 0.05); g.stroke();
    g.restore();
    // a tilted flower: its far half a little shaded, its upper edge catching the light like a blade
    if (tt > 0) { g.rotate(az); g.globalCompositeOperation = 'source-atop'; g.fillStyle = `rgba(120,30,80,${(0.22 * Math.sin(tau)).toFixed(3)})`; g.fillRect(-CS, 0, CS * 2, CS);
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.strokeStyle = `rgba(255,255,255,${(0.2 + 0.25 * tt).toFixed(3)})`; g.lineWidth = Math.max(1, R * 0.1); g.beginPath(); g.moveTo(-R * 0.75, -R * ct * 0.8 - 0.5); g.quadraticCurveTo(0, -R * ct - 1, R * 0.75, -R * ct * 0.8 - 0.5); g.stroke(); }
    g.restore(); A.done[(tt * NA + ai) * NSP + si] = 1; }
  function cellOf(A, tt, ai, si) { if (!A.done[(tt * NA + ai) * NSP + si]) paintCell(A, tt, ai, si); return (ai * NSP + si) * A.CS; }

  const dprOf = () => Math.min(2, Math.max(1, (typeof arc !== 'undefined' && arc.dpr) || (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)));
  const radOf = (T, S) => Math.max(5, Math.min(26, Math.round(T * 0.16 * Math.pow(S, 0.8) * dprOf())));
  /* everything a cast paints, smallest first, as little jobs (a slice of a few ms runs each frame, or in idle time) */
  function warmList(R) {
    const L = [() => wreathSpr(), () => slashSpr()];
    for (let b = 0; b < NBR; b++) { L.push(() => blossomSpr(0, b)); L.push(() => blossomSpr(1, b)); }
    for (let b = 0; b < NPR; b++) { L.push(() => petalSpr(0, b)); L.push(() => petalSpr(1, b)); }
    for (let ti = 0; ti < 4; ti++) for (let tt = 0; tt < NT; tt++) for (let ai = 0; ai < NA; ai++) for (let si = 0; si < NSP; si++) L.push(() => cellOf(atlas(ti, R), tt, ai, si));
    L.push(() => roseSpr());
    return L;
  }

  /* ================= Flower Hurricane ================= */
  U.flowerhurricane = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = tierOf(ev), D = durOf(ev), S = sizeOf(ev), KK = C.K || 1, SZ = S * KK;
    const NS = tier === 3 ? 7 : tier === 2 ? 5 : 3, TICK = 0.5, T_BURST = 0.55, tA = 0.8, EXIT = 1.6;
    let tE = tA + D; const LIFE = tE + 2.4;
    const V = 3.0 * (0.9 + 0.1 * S) * Math.sqrt(KK), LR = (3.6 + 0.7 * S) * KK, SEP = 1.3 * SZ, LAG = 0.9;
    /* one stream held on a monster the whole time: ~12 x base at Hatchling, ~16 at Adept, ~20 at Celestial (x C.K) */
    const evoK = 1 + 0.08 * (ev - 1), nT = Math.round(D / TICK), dmgT = C.base * KK * evoK * 12 * Math.pow(D / 6, 0.25) / nT;
    const T0 = H.X.Tz(), RA = radOf(T0, S), RC = RA / dprOf(), warm = warmList(RA), ATS = [0, 1, 2, 3].map(i => atlas(i, RA));
    H.X.banner('FLOWER HURRICANE', '', C.col, 1.4); H.X.sfx.hum();
    const dA = Math.hypot(C.tx - me.x, C.ty - me.y) || 1, aA = Math.atan2(C.ty - me.y, C.tx - me.x), anc = { x: me.x + (C.tx - me.x) * Math.min(1, 2.6 / dA), y: me.y + (C.ty - me.y) * Math.min(1, 2.6 / dA) };
    const free = (x, y) => !H.X.blocked || !H.X.blocked(x, y, 0.3, 0);
    const WR = 0.95, TR = 48, TRD = 0.025;
    /* the streams: a leader each, its wake kept as a ring of positions */
    const st = [];
    for (let i = 0; i < NS; i++) { const hd = aA + (i - (NS - 1) / 2) * (tier === 3 ? 0.55 : 0.75), x = me.x + Math.cos(hd) * 0.5, y = me.y + Math.sin(hd) * 0.5, tr = new Float32Array(TR * 2); for (let k = 0; k < TR; k++) { tr[k * 2] = me.x; tr[k * 2 + 1] = me.y; }
      st.push({ i, x, y, hd, tr, head: 0, lastS: 0, tgt: null, wp: null, re: 0, orbT: 0, orbC: 0, orb: null, xp: null, xpT: 0, cool: 0, split: 0, spT0: tA + 1.2 + 1.5 * R1(i * 3.3), spOn: false, sd: R1(i * 7.1) < 0.5 ? 1 : -1 }); }
    /* the flowers: each strung along its stream's wake (lag), corkscrewing round it, on one of two lanes */
    const fl = [], nF = H.n(tier === 3 ? 46 : tier === 2 ? 42 : 38), nP = H.n(tier === 3 ? 16 : 13);
    for (const S0 of st) for (let j = 0; j < nF + nP; j++) { const pet = j >= nF, lag = LAG * Math.pow((j + R1(S0.i * 31 + j)) / (nF + nP), 0.9), u = R1(S0.i * 13 + j * 1.7), tn = u < 0.52 ? 0 : u < 0.8 ? 1 : u < 0.9 ? 2 : 3, q0 = R1(S0.i * 5 + j * 2.3) * TAU;
      fl.push({ s: S0, pet, lag, side: R1(j * 4.4 + S0.i) < 0.5 ? -1 : 1, r: 0.25 + 0.75 * Math.sqrt(R1(j * 9.1 + S0.i * 2)), ph: q0, sw: (2.2 + 2.6 * R1(j * 3.7)) * (R1(j * 1.9) < 0.75 ? 1 : -1), z0: 0.45 + 0.6 * R1(j * 6.2 + S0.i), tn, sz: (pet ? 0.85 : 0.75) + 0.45 * R1(j * 8.8 + S0.i * 3), spin: R1(j * 2.1) * TAU, spW: (2 + 5 * R1(j * 5.5)) * (R1(j * 3.3) < 0.5 ? 1 : -1), fph: R1(j * 7.7) * TAU, fw: 0.8 + 2.2 * R1(j * 4.9), pb: R1(j * 6.6) * 24, pbw: 6 + 10 * R1(j * 2.8),
        t0: T_BURST + lag * 0.6 + 0.1 * R1(j * 1.3 + S0.i), wa: (S0.i * (nF + nP) + j) * 2.39996, x: me.x, y: me.y, z: 0.05, vx: 0, vy: 0, vz: 0, on: false, dr: false, dT: 0, dl: 1 }); }
    const parts = [], slashes = [];
    const tmp = { x: 0, y: 0, dx: 1, dy: 0 };
    function trailAt(S0, lag, o) { const fi = Math.min(TR - 2.001, lag / TRD), i0 = Math.floor(fi), u = fi - i0, a = ((S0.head - i0) % TR + TR) % TR, b = ((S0.head - i0 - 1) % TR + TR) % TR, c = ((S0.head - i0 - 3) % TR + TR) % TR, tr = S0.tr;
      o.x = tr[a * 2] + (tr[b * 2] - tr[a * 2]) * u; o.y = tr[a * 2 + 1] + (tr[b * 2 + 1] - tr[a * 2 + 1]) * u; let dx = tr[a * 2] - tr[c * 2], dy = tr[a * 2 + 1] - tr[c * 2 + 1]; const d = Math.hypot(dx, dy); if (d > 1e-4) { o.dx = dx / d; o.dy = dy / d; } else { o.dx = Math.cos(S0.hd); o.dy = Math.sin(S0.hd); } return o; }
    function retarget(o, t, L) {
      const taken = new Set(); for (const q of st) if (q !== o && q.tgt) taken.add(q.tgt);
      let best = null, bs = 1e9; for (const m of L) { if (Math.hypot(m.x - anc.x, m.y - anc.y) > LR + 2 + m.r) continue; const sc = Math.hypot(m.x - o.x, m.y - o.y) + (taken.has(m) ? 2.2 : 0) + (m === o.last ? 3 : 0) + R1(o.i * 3.7 + Math.floor(t * 3) + m.x) * 1.4; if (sc < bs) { bs = sc; best = m; } }
      o.re = t + 2.2 + R1(o.i + t) * 0.8;
      if (best) { o.tgt = best; o.last = best; o.wp = { x: best.x, y: best.y }; }
      else { const b = R1(o.i * 5 + t) * TAU, r = LR * (0.35 + 0.5 * R1(o.i + t * 2)); o.tgt = null; o.wp = { x: anc.x + Math.cos(b) * r, y: anc.y + Math.sin(b) * r }; } }
    const centroid = L => { let sx = 0, sy = 0, k = 0; for (const m of L) if (Math.hypot(m.x - anc.x, m.y - anc.y) < LR + 2) { sx += m.x; sy += m.y; k++; } return k ? { x: sx / k, y: sy / k } : { x: anc.x, y: anc.y }; };
    // Celestial: the giant blossom, then the converging rush
    const FW0 = tier >= 3 ? tA + Math.max(2.2, D * 0.42) : 1e9, FW1 = FW0 + 2.8, RU0 = tier >= 3 ? tE - 1.5 : 1e9; let fC = null, rC = null, rushHit = false;
    let nextTick = tA, nextCross = tA + 1.6, deadEnd = false;
    const puff = (m, n) => { for (let j = 0; j < n; j++) { const b = Math.random() * TAU, v = 1 + 1.4 * Math.random(); parts.push({ x: m.x, y: m.y, z: 0.45 + 0.3 * Math.random(), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 0.8 + Math.random() * 1.2, t: 0, life: 0.7, v: j & 1, b: Math.random() * 24, br: 12 }); } };
    function cutVolume(S0, m) { const sp = S0.split; for (let k = 0; k < 4; k++) { const lag = k * 0.2, P = trailAt(S0, lag, tmp), rr = (0.6 + 0.35 * k / 3) * SZ + m.r;
        for (const ln of (sp > 0.25 ? [-1, 1] : [0])) { const ox = -P.dy * ln * sp * 0.95 * SZ, oy = P.dx * ln * sp * 0.95 * SZ; if (Math.hypot(m.x - P.x - ox, m.y - P.y - oy) < rr) return true; } } return false; }

    H.add({ key: 'flowerhurricane', life: LIFE, wi: 0, st, fl, parts,
      update(dt, f) {
        if (f.wi < warm.length) { const t0 = now(); do warm[f.wi++](); while (f.wi < warm.length && now() - t0 < 3); }
        const t = f.t;
        if (me.dead && !deadEnd && t < tE) { deadEnd = true; tE = Math.max(tA, t); f.life = Math.min(f.life, tE + 2.4 - t); }
        if (t < T_BURST) return;
        const L = H.living(), act = t < tE;
        { const d = Math.hypot(me.x - anc.x, me.y - anc.y); if (d > LR * 0.8) { const k = Math.min(1, dt * 0.8); anc.x += (me.x - anc.x) * k; anc.y += (me.y - anc.y) * k; } }
        // Adept and up: two streams cross on purpose, each heading through the other's place
        if (act && tier >= 2 && t >= nextCross && t < Math.min(tE - 1.4, RU0 - 1)) { nextCross = t + 2.2; let pa = null, pd = 0; for (const a of st) for (const b of st) { if (a.i >= b.i || a.xp || b.xp) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d > 1.8 && d < 4.5 && d > pd) { pd = d; pa = [a, b]; } }
          if (pa && !(t >= FW0 - 1 && t < FW1)) { const [a, b] = pa, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1; a.wp = { x: b.x + dx / d * 1.4, y: b.y + dy / d * 1.4 }; b.wp = { x: a.x - dx / d * 1.4, y: a.y - dy / d * 1.4 }; a.tgt = b.tgt = null; a.re = b.re = t + 2.0; a.xp = b; b.xp = a; a.xpT = b.xpT = t + 1.8; a.orbT = b.orbT = 0; H.X.sfx.whoosh(); } }
        if (t >= FW0 && !fC) { fC = centroid(L); H.X.sfx.whoosh(); H.X.sfx.sparkle(); }
        if (t >= RU0 && !rC) { rC = centroid(L); for (const o of st) { const q = o.i * TAU / NS + 0.3; o.ra = { x: rC.x + Math.cos(q) * 3.2 * SZ, y: rC.y + Math.sin(q) * 3.2 * SZ }; o.rb = { x: rC.x - Math.cos(q) * 3.6 * SZ, y: rC.y - Math.sin(q) * 3.6 * SZ }; } H.X.sfx.hum(); }
        for (const o of st) {
          if (o.xp && t > o.xpT) o.xp = null;
          const ramp = act ? 1 : Math.max(0, 1 - (t - tE) / (EXIT * 0.8));
          const px = o.x, py = o.y;
          if (ramp > 0) {
            const inF = fC && t < FW1, inR = rC && act;
            if (inF) { // trace one petal of the giant blossom (out and back), the whole pattern turning
              const u = t - FW0, s = (u * 1.55 + o.i * 0.45) % Math.PI, al = o.i * TAU / NS + u * 0.5, Rf = 2.7 * SZ, r = Rf * (0.18 + 0.82 * Math.sin(s)), an = al + (s - Math.PI / 2) * 0.62, gx = fC.x + Math.cos(an) * r, gy = fC.y + Math.sin(an) * r, k = Math.min(1, dt * (u < 0.6 ? 3 : 9));
              o.x += (gx - o.x) * k; o.y += (gy - o.y) * k; if (u > 2.5) o.re = 0; }
            else if (inR) { const u = t - RU0; if (u < 0.55) { const k = Math.min(1, dt * 5); o.x += (o.ra.x - o.x) * k; o.y += (o.ra.y - o.y) * k; } else { const e = H.ease.io(cl((u - 0.55) / 0.8)); o.x = lerp(o.ra.x, o.rb.x, e); o.y = lerp(o.ra.y, o.rb.y, e); if (!rushHit && u > 0.95) { rushHit = true; H.X.light(rC.x, rC.y, 3, 0.4); H.X.shake(3, 0.15); H.X.sfx.crash(); H.X.ring(rC.x, rC.y, 0.3, 2.6 * SZ, 0.5, PINK, 0.12); } } }
            else {
              let gx, gy, turn = 2.6, sp = V;
              if (o.orb && t < o.orbT && !o.orb.dead) { const m = o.orb, q = Math.atan2(o.y - m.y, o.x - m.x) + 1.1 * o.sd; gx = m.x + Math.cos(q) * 0.9 * SZ; gy = m.y + Math.sin(q) * 0.9 * SZ; turn = 6.5; sp = V * 0.85; }
              else { if (o.orb) { o.orb = null; o.re = 0; o.orbC = t + 1.4; }
                if (!o.wp || t > o.re || Math.hypot(o.wp.x - o.x, o.wp.y - o.y) < 0.5 || (o.tgt && o.tgt.dead)) retarget(o, t, L);
                if (o.tgt && !o.xp) { o.wp.x = o.tgt.x; o.wp.y = o.tgt.y; if (Math.hypot(o.tgt.x - o.x, o.tgt.y - o.y) < 1.0 * SZ && t > o.orbC && act) { o.orb = o.tgt; o.orbT = t + 0.7 + 0.4 * R1(o.i + t); o.tgt = null; } }
                gx = o.wp.x; gy = o.wp.y; }
              let dx = gx - o.x, dy = gy - o.y; { const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; }
              for (const q of st) { if (q === o || o.xp === q) continue; const ex = o.x - q.x, ey = o.y - q.y, d = Math.hypot(ex, ey) || 0.01; if (d < SEP) { const k = (SEP - d) / SEP * 1.4; dx += ex / d * k; dy += ey / d * k; } }
              { const ex = o.x - anc.x, ey = o.y - anc.y, d = Math.hypot(ex, ey) || 0.01; if (d > LR) { dx -= ex / d * (d - LR) * 0.9; dy -= ey / d * (d - LR) * 0.9; } }
              const dh = wrapA(Math.atan2(dy, dx) - o.hd), mt = turn * dt; o.hd += Math.max(-mt, Math.min(mt, dh)) + Math.sin(t * 1.3 + o.i * 2) * 0.4 * dt;
              const step = sp * ramp * dt * Math.min(1, (t - T_BURST) / 0.3 + 0.3); let moved = false;
              for (const da of [0, 0.5, -0.5, 1.0, -1.0, 1.7, -1.7, 2.5, -2.5]) { const a = o.hd + da, nx = o.x + Math.cos(a) * step, ny = o.y + Math.sin(a) * step; if (free(nx, ny)) { o.x = nx; o.y = ny; if (da) o.hd += da * Math.min(1, dt * 8); moved = true; break; } }
              if (!moved) o.hd += Math.PI * 0.6 * dt; } }
          if (Math.hypot(o.x - px, o.y - py) > 1e-4 && (fC && t < FW1 || rC)) o.hd = Math.atan2(o.y - py, o.x - px);
          // its wake
          while (t - o.lastS >= TRD) { o.lastS += TRD; if (t - o.lastS > TRD * 4) o.lastS = t; o.head = (o.head + 1) % TR; o.tr[o.head * 2] = o.x; o.tr[o.head * 2 + 1] = o.y; }
          // now and then the stream divides into two strands and merges again
          if (act && !o.spOn && t >= o.spT0) { o.spOn = true; o.spT1 = t + 1.7; }
          if (o.spOn) { o.split = Math.sin(Math.PI * cl((t - (o.spT1 - 1.7)) / 1.7)); if (t >= o.spT1) { o.spOn = false; o.split = 0; o.spT0 = t + 2.2 + 2 * R1(o.i + t); } }
        }
        // the gameplay tick: each stream cuts every monster inside its volume once per 0.5 s of the game clock
        while (act && t >= nextTick && nextTick < tE - 1e-6) { nextTick += TICK; let np = 0;
          for (const o of st) for (const m of L) { if (m.dead || !cutVolume(o, m)) continue; H.X.hitMon(m, dmgT, C.dmgO()); if (np++ < 8) { slashes.push({ x: m.x, y: m.y - 0.35, a: Math.atan2(Math.sin(o.hd) * 0.55, Math.cos(o.hd)) + (Math.random() - 0.5) * 0.8, t: 0 }); puff(m, 3); } } }
        // the flowers follow their streams on springs; at the end they let go and drift down
        for (const q of fl) {
          if (t < q.t0) continue;
          if (!q.on) { q.on = true; const b = q.wa; q.x = me.x + Math.cos(b) * WR; q.y = me.y + Math.sin(b) * WR * 0.9; q.z = 0.1; q.vx = Math.cos(b) * 5; q.vy = Math.sin(b) * 5; q.vz = 2; }
          q.spin += q.spW * dt;
          if (!q.dr && t > tE + 0.15 + q.lag * 0.5) { q.dr = true; q.dT = t; q.dl = 1.0 + 0.8 * R1(q.ph); q.vx *= 0.7; q.vy *= 0.7; }
          if (q.dr) { const e = Math.exp(-dt * 1.4); q.vx = q.vx * e + Math.sin(t * 2.4 + q.ph) * 0.6 * dt; q.vy *= e; q.vz += (-0.55 - q.vz) * Math.min(1, dt * 2); q.x += q.vx * dt; q.y += q.vy * dt; q.z = Math.max(0, q.z + q.vz * dt); continue; }
          const P = trailAt(q.s, q.lag, tmp), ln = q.lag / LAG, W = (0.28 + 0.7 * ln) * SZ * (q.pet ? 1.15 : 1), sw = q.ph + t * q.sw, off = q.side * q.s.split * 0.95 * SZ + Math.cos(sw) * W * q.r, tx = P.x - P.dy * off, ty = P.y + P.dx * off, tz = q.z0 * SZ + Math.sin(sw) * W * q.r * 0.75;
          const k = q.pet ? 30 : 40, c = q.pet ? 9 : 11; q.vx += ((tx - q.x) * k - q.vx * c) * dt; q.vy += ((ty - q.y) * k - q.vy * c) * dt; q.vz += ((tz - q.z) * k - q.vz * c) * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; }
        for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; if (p.t >= p.life) { parts.splice(i, 1); continue; } p.vz -= 5 * dt; if (p.vz < -0.8) p.vz = -0.8; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.vx *= Math.exp(-dt * 1.5); p.vy *= Math.exp(-dt * 1.5); }
        for (let i = slashes.length - 1; i >= 0; i--) { slashes[i].t += dt; if (slashes[i].t > 0.3) slashes.splice(i, 1); }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t;
        // the wreath turning beneath the pet, its light on the floor and its blossoms, until it bursts
        if (t < T_BURST + 0.4) { const PX = H.sx(me.x), PY = H.sy(me.y), a = cl(t / 0.3) * (1 - cl((t - T_BURST) / 0.4)), r = WR * T * (0.75 + 0.25 * H.ease.out(cl(t / 0.4))) * 1.45 * (1 + 0.5 * H.ease.out(cl((t - T_BURST) / 0.4)));
          if (a > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * a; c.drawImage(wreathSpr(), PX - r, PY - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); }
          const rot = t * 1.8, gr = H.ease.out(cl(t / 0.4)), a0 = cl(t / 0.25) * (1 - cl((t - T_BURST) / 0.12));
          if (a0 > 0.02) for (let j = 0; j < 16; j++) { const q = j * TAU / 16 + rot, bx = PX + Math.cos(q) * WR * T * gr, by = PY + Math.sin(q) * WR * T * gr * H.GY, s = T * (j % 2 ? 0.26 : 0.34) * (0.6 + 0.4 * gr) * (1 + 0.15 * cl((t - T_BURST + 0.25) / 0.25)), bk = ((Math.floor((q * 2 + j) / (TAU / 5) * NBR) % NBR) + NBR) % NBR;
            if (j % 2 === 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * a0; c.drawImage(glowSprite(PINK), bx - s * 1.3, by - s * 0.8, s * 2.6, s * 1.6); c.restore(); }
            c.globalAlpha = a0; c.drawImage(blossomSpr(j & 1, bk), bx - s / 2, by - s * 0.32, s, s * 0.64); }
          c.globalAlpha = 1; }
        // Celestial: the rose of light under the giant blossom
        if (fC && t < FW1 + 0.6) { const u = t - FW0, a = sm(u / 0.7) * (1 - sm((u - 2.2) / 1.0)), R = 2.7 * SZ * T * 1.1; if (a > 0.01) { c.save(); c.translate(H.sx(fC.x), H.sy(fC.y)); c.scale(1, H.GY); c.rotate(u * 0.5); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * a; c.drawImage(roseSpr(), -R, -R, R * 2, R * 2); c.restore(); } }
        // a faint pink light on the floor under each stream's head
        if (t > T_BURST) { const a = sm((t - T_BURST) / 0.4) * (1 - sm((t - tE) / EXIT)); if (a > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; for (const o of st) for (let k = 0; k < 3; k++) { const P = trailAt(o, k * 0.3, tmp), r = T * SZ * (0.9 + 0.3 * k), X = H.sx(P.x), Y = H.sy(P.y); c.globalAlpha = 0.13 * a * (1 - k * 0.25); c.drawImage(glowSprite(PINK), X - r, Y - r * H.GY, r * 2, r * 2 * H.GY); } c.restore(); } }
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t; if (t < T_BURST) return;
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46, PR = T * 0.8, dpr = dprOf();
        const fade = 1 - sm((t - tE - 0.2) / 1.2);
        // the thin mint wind streaks that carry each stream (feathered at both ends)
        if (fade > 0.01) { c.save(); c.lineCap = 'round'; c.globalCompositeOperation = 'lighter';
          for (const o of st) for (let w = 0; w < 2; w++) { const NSG = 16, zz = (0.55 + 0.35 * w) * SZ, sg = w ? -1 : 1; let lx = 0, ly = 0;
            for (let k = 0; k <= NSG; k++) { const lag = k / NSG * LAG * 0.95, P = trailAt(o, lag, tmp), q = t * 3 + lag * 6 + o.i + w * 2, off = Math.sin(q) * 0.35 * SZ * sg + sg * o.split * 0.95 * SZ, X = H.sx(P.x - P.dy * off), Y = H.sy(P.y + P.dx * off) - zz * T;
              if (k) { const u = k / NSG, a = fade * Math.sin(Math.PI * u) * (1 - u * 0.4); c.globalAlpha = 0.16 * a; c.strokeStyle = MINT; c.lineWidth = T * 0.09; c.beginPath(); c.moveTo(lx, ly); c.lineTo(X, Y); c.stroke(); c.globalAlpha = 0.34 * a; c.strokeStyle = AIR; c.lineWidth = T * 0.02; c.stroke(); } lx = X; ly = Y; } }
          c.restore(); }
        // the flowers: atlas blits (tint x tilt x tilt axis x spin), petals from their sprites
        for (const q of fl) { if (!q.on) continue;
          let a = 1, sc = 1; if (q.dr) { const u = (t - q.dT) / q.dl; if (u >= 1) continue; a = 1 - sm((u - 0.45) / 0.55); sc = 1 - 0.55 * u; } else a = cl((t - q.t0) / 0.1);
          const X = H.sx(q.x), Y = H.sy(q.y) - q.z * T; { const d = Math.hypot(X - PX, (Y - PY) * 1.25); if (d < PR) a *= 0.3 + 0.7 * sm(d / PR); } if (a < 0.03) continue;
          c.globalAlpha = a;
          if (q.pet) { const s = T * 0.2 * Math.sqrt(SZ) * q.sz * sc, bk = ((Math.floor(q.pb + t * q.pbw) % NPR) + NPR) % NPR; c.drawImage(petalSpr(q.tn & 1, bk), X - s / 2, Y - s / 2, s, s); continue; }
          const A = ATS[q.tn], flip = Math.abs(Math.sin(q.fph + t * q.fw)), tt = flip < 0.5 ? 0 : flip < 0.82 || q.dr ? 1 : flip < 0.95 ? 2 : 3, va = Math.atan2(q.vy - q.vz * 0.5, q.vx), ai = ((Math.floor(((va % Math.PI) + Math.PI) % Math.PI / Math.PI * NA + 0.5) % NA) + NA) % NA, si = ((Math.floor(((q.spin % (TAU / 5)) + TAU / 5) % (TAU / 5) / (TAU / 5) * NSP)) % NSP + NSP) % NSP;
          const sx0 = cellOf(A, tt, ai, si), CS = A.CS, s = CS / dpr * (T * 0.17 * Math.pow(SZ, 0.8) * q.sz * sc / RC); c.drawImage(A.cv, sx0, tt * CS, CS, CS, X - s / 2, Y - s / 2, s, s); }
        // the petals of the cuts, and the slashes
        for (const p of parts) { const u = p.t / p.life, a = 1 - sm((u - 0.5) / 0.5); if (a < 0.03) continue; const s = T * 0.17, bk = ((Math.floor(p.b + p.t * p.br) % NPR) + NPR) % NPR; c.globalAlpha = a; c.drawImage(petalSpr(p.v, bk), H.sx(p.x) - s / 2, H.sy(p.y) - p.z * T - s / 2, s, s); }
        c.globalAlpha = 1;
        if (slashes.length) { c.save(); c.globalCompositeOperation = 'lighter'; for (const q of slashes) { const u = q.t / 0.3, w = T * (0.7 + 0.5 * u) * Math.sqrt(SZ), hgt = w * 0.46; c.save(); c.translate(H.sx(q.x), H.sy(q.y) - T * 0.2); c.rotate(q.a); c.globalAlpha = (1 - u) * 0.95; c.drawImage(slashSpr(), -w / 2, -hgt * 0.7, w, hgt); c.restore(); } c.restore(); }
      } });
    H.X.after(T_BURST, () => { H.X.sfx.whoosh(); H.X.sfx.sparkle(); H.X.light(me.x, me.y, 2.2, 0.3); H.X.ring(me.x, me.y, 0.4, 2.2, 0.45, PINK, 0.12); });
  };
  /* (idle time before the first cast: paint the pictures this pet's level will want, a few at a time) */
  U.flowerhurricane.warm = o => {
    const ev = Math.max(1, Math.min(7, Math.round((o && o.evo) || 1)));
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const L = warmList(radOf(T, sizeOf(ev))); let i = 0;
      const go = () => { if (i >= L.length) return; const t0 = now(); do L[i++](); while (i < L.length && now() - t0 < 3); if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 200 }); else setTimeout(go, 40); }; go(); }, 400);
  };
  U.flowerhurricane.__dbg = { atlas, cellOf, radOf, warmList, durOf, sizeOf, NT, NA, NSP };
})();
