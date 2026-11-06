/* ---------- Wind, reworked: Flower Hurricane ----------
   Seven separate flower-filled twisters roam the battlefield. A delicate pink wreath turns on the floor beneath the pet;
   seven bright flower clusters lift off it and arc out to seven nearby spots; over 0.7 s a narrow rising current
   catches each cluster, its petals climb an invisible corkscrew and mint wind ribbons widen into a full twister (about
   2H tall: a broad, readable upper funnel on a narrow, wandering ground contact). The seven then travel smooth separate
   routes through the monsters (broad curves, banking: the top lags the ground contact), kept spread apart; now and then
   two braid round each other and part. Each funnel: translucent curved wind bands, bright pressure streaks, a paler
   inner current and a feathered rim; pink five-petal blossoms enter near the floor, spiral up and peel away at the top
   (big ones tumbling slowly outside, tiny petals racing near the core), and a low spiral of leaves, petals and dust
   follows the contact. Adept: a second, counter-wound ribbon layer and coordinated crossing paths. Celestial: a pale
   mint inner spiral and a distinct pink outer stream in every funnel, and once the seven gather into a loose rotating
   flower round the monsters before spreading again. The end: the ribbons unwind upward into seven blossom fountains and
   the petals drift down. Always 7 twisters; 6 s / 8 s / 10 s (Hatchling / Adept / Celestial); size 1 / 1.25 / 1.55.
   Damage: each twister strikes the monsters inside its area on a fixed 0.5 s tick of the game clock (one hit per
   twister per tick); one twister kept on a monster the whole time deals ~12 / 16 / 20 x base (x C.K). The exit deals
   nothing. Built for the phone: each funnel is one of 24 cached turning frames (2-fold symmetric, so a half turn loops),
   drawn in a few sheared strips so it bends and leans; flowers, petals, leaves and floor swirls are cached sprites in
   rotation buckets, blitted unturned; nothing is gradient-filled per frame. */
(() => {
  const U = ELEM_IMPL.wind.ult, TAU = Math.PI * 2;
  delete U.carousel;
  let H;
  const MINT = '#73E8B6', EMER = '#16A57B', AIR = '#E7FFF6', PINK = '#FFAFD2', ROSE = '#DE5A9A', JADE = '#3FC89A', LEAFC = '#58BF7E', CREAM = '#FFF0C4';
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

  /* ================= cached sprites ================= */
  /* the funnel, in sprite pixels: Hs tall, its axis from the floor (u 0) to the rim (u 1); the radius widens with height */
  const NFR = 24, PADT = 0.075, PADB = 0.04, EY = 0.27, WK = 0.88;
  const rOf = u => { u = Math.max(0, Math.min(1.06, u)); return 0.03 + 0.085 * u + 0.215 * Math.pow(u, 2.4); };
  /* the band layout of a tier (seeded: every funnel the same; each band paired with its twin half a turn round, so half
     a turn of the frames loops) */
  const SPEC = {};
  function specs(tier) {
    if (SPEC[tier]) return SPEC[tier];
    const L = [], pair = b => { L.push(b); L.push(Object.assign({}, b, { a0: b.a0 + Math.PI })); };
    [0.0, 0.12, 0.25, 0.37, 0.5, 0.62, 0.74].forEach((u0, i) => pair({ k: 'band', u0, du: 0.26 + 0.12 * R1(i * 3.1 + 1), a0: R1(i * 7.7 + 2) * TAU, da: Math.PI * (0.9 + 0.4 * R1(i * 5.3 + 3)), w: 0.05 + 0.03 * R1(i * 2.2 + 4), rf: 1, sp: 1, col: i % 3 === 1 ? JADE : MINT, al: 0.5 }));
    for (let i = 0; i < 9; i++) pair({ k: 'streak', u0: 0.05 + i * 0.1 + 0.04 * R1(i * 9.1), du: 0.1 + 0.08 * R1(i * 1.3), a0: R1(i * 4.4 + 2) * TAU, da: Math.PI * (0.45 + 0.3 * R1(i * 6.6)), w: 0.009, rf: 1.035, sp: 1, col: AIR, al: 1 });
    if (tier >= 2) for (let i = 0; i < 5; i++) pair({ k: 'r2', u0: 0.1 + i * 0.165, du: 0.15, a0: R1(i * 8.8 + 3) * TAU, da: -Math.PI * (0.85 + 0.35 * R1(i * 1.9)), w: 0.02, rf: 1.09, sp: 1, col: AIR, al: 0.42 });
    if (tier >= 3) { pair({ k: 'inner', u0: 0.03, du: 0.94, a0: 0.3, da: TAU * 2.4, w: 0.011, rf: 0.42, sp: 2, col: AIR, al: 0.85 }); pair({ k: 'pink', u0: 0.1, du: 0.9, a0: 1.9, da: Math.PI * 1.6, w: 0.05, rf: 1.13, sp: 1, col: PINK, al: 0.62 }); }
    return (SPEC[tier] = L);
  }
  /* the fill passes of a band on its front / back half: [thickness k, alpha, colour] (feathered: wide faint, narrow bright) */
  const PASS = {
    band: [[[1, 0.16, EMER], [0.5, 0.2, EMER]], [[1, 0.5, null], [0.6, 0.55, null], [0.16, 0.8, AIR]]],
    streak: [[[1, 0.18, AIR]], [[1.4, 0.4, AIR], [0.6, 0.9, AIR], [0.3, 1, '#FFFFFF']]],
    r2: [[[1, 0.28, MINT]], [[1, 0.5, AIR], [0.35, 0.85, '#FFFFFF']]],
    inner: [[[2.4, 0.12, AIR], [1, 0.42, MINT]], [[2.4, 0.2, AIR], [1, 0.8, AIR], [0.4, 0.9, '#FFFFFF']]],
    pink: [[[1, 0.26, ROSE], [0.4, 0.3, PINK]], [[1.25, 0.22, ROSE], [1, 0.45, PINK], [0.55, 0.6, PINK], [0.16, 0.8, '#FFF0F6']]] };
  /* the body of the funnel (the same in every turning frame): a translucent sheath, brighter toward its edges, feathered at them */
  const bodySpr = (W, Hs) => fxSprite('fhwBody|' + Hs, W, Hs, g => {
    const cx = W / 2, yb = Hs * (1 - PADB), hh = Hs * (1 - PADB - PADT), yA = u => yb - u * hh, R = u => rOf(u) * Hs;
    const y0 = Math.floor(yA(1.02)), y1 = Math.ceil(yA(0)); for (let y = y0; y < y1; y += 2) { const u = (yb - y - 1) / hh, r = R(Math.max(0, u)) * 1.02; if (r < 1) continue;
        const gr = g.createLinearGradient(cx - r, 0, cx + r, 0); gr.addColorStop(0, 'rgba(231,255,246,0)'); gr.addColorStop(0.04, 'rgba(231,255,246,0.5)'); gr.addColorStop(0.12, 'rgba(140,236,196,0.3)'); gr.addColorStop(0.3, 'rgba(115,232,182,0.12)'); gr.addColorStop(0.55, 'rgba(90,200,160,0.06)'); gr.addColorStop(0.78, 'rgba(22,165,123,0.2)'); gr.addColorStop(0.93, 'rgba(14,120,92,0.42)'); gr.addColorStop(0.97, 'rgba(14,120,92,0.3)'); gr.addColorStop(1, 'rgba(14,120,92,0)'); g.fillStyle = gr; g.fillRect(cx - r, y, r * 2, 2); }
    // the silhouette: a bright pale rim on the lit (left) edge, a deep emerald line on the shaded one, each feathered
    g.lineJoin = 'round'; g.lineCap = 'round'; for (const sd of [-1, 1]) for (const [lw, col] of (sd < 0 ? [[0.03, 'rgba(231,255,246,0.18)'], [0.012, 'rgba(231,255,246,0.55)'], [0.004, 'rgba(255,255,255,0.8)']] : [[0.03, 'rgba(14,110,84,0.2)'], [0.012, 'rgba(14,120,92,0.5)']])) { g.beginPath(); for (let i = 0; i <= 40; i++) { const u = 0.03 + 0.99 * i / 40; g.lineTo(cx + sd * R(u) * 0.99, yA(u)); } g.strokeStyle = col; g.lineWidth = Hs * lw; g.stroke(); }
  });
  function paintFunnel(g, W, Hs, tier, ph) {
    const cx = W / 2, yb = Hs * (1 - PADB), hh = Hs * (1 - PADB - PADT), yA = u => yb - u * hh, R = u => rOf(u) * Hs, L = specs(tier);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const band = (B, side) => {
      const N = 44, runs = []; let run = null, last = -1;
      for (let i = 0; i <= N; i++) { const s = i / N, u = Math.min(1.03, B.u0 + B.du * s), th = B.a0 + ph * B.sp + B.da * s, c = Math.cos(th), fr = c > 0 ? 1 : 0;
        const r = R(u) * B.rf, p = [cx + r * Math.sin(th), yA(u) + r * EY * c, B.w * Hs * (0.45 + 0.55 * u) * Math.pow(Math.sin(Math.PI * s), 0.75), r];
        if (fr !== side) { if (run && last === i - 1) run.push(p); run = null; continue; }
        if (!run) { run = []; runs.push(run); if (i > 0) { const s0 = (i - 1) / N, u0 = Math.min(1.03, B.u0 + B.du * s0), t0 = B.a0 + ph * B.sp + B.da * s0, r0 = R(u0) * B.rf; run.push([cx + r0 * Math.sin(t0), yA(u0) + r0 * EY * Math.cos(t0), B.w * Hs * (0.45 + 0.55 * u0) * Math.pow(Math.sin(Math.PI * s0), 0.75), r0]); } }
        run.push(p); last = i; }
      const ps = PASS[B.k][side];
      for (const rn of runs) { if (rn.length < 2) continue; const Rm = rn[rn.length >> 1][3] || 1;
        for (const [kw, al, col0] of ps) { const col = col0 || B.col, a = al * B.al, gr = g.createLinearGradient(cx - Rm, 0, cx + Rm, 0);
          const lit = side && B.k !== 'pink' && B.k !== 'streak'; gr.addColorStop(0, rgbaS(lit ? AIR : col, a)); gr.addColorStop(0.18, rgbaS(col, a * 0.95)); gr.addColorStop(0.5, rgbaS(col, a * 0.7)); gr.addColorStop(0.82, rgbaS(lit ? EMER : col, a * 0.9)); gr.addColorStop(1, rgbaS(lit ? '#0E7A5C' : col, a));
          g.beginPath(); for (let i = 0; i < rn.length; i++) { const p = rn[i]; if (i) g.lineTo(p[0], p[1] - p[2] * kw / 2); else g.moveTo(p[0], p[1] - p[2] * kw / 2); } for (let i = rn.length - 1; i >= 0; i--) { const p = rn[i]; g.lineTo(p[0], p[1] + p[2] * kw / 2); } g.closePath(); g.fillStyle = gr; g.fill(); } } };
    // the back halves of the bands, faint through the air
    for (const B of L) if (B.k !== 'inner') band(B, 0);
    // the body: a translucent sheath of moving air, brighter toward its edges (seen edge-on), feathered at them
    { g.drawImage(bodySpr(W, Hs), 0, 0);
      // the inner current: a paler, less saturated column inside with slow soft streaks
      for (let q = 0; q < 2; q++) { g.beginPath(); for (let i = 0; i <= 40; i++) { const u = 0.04 + 0.9 * i / 40, th = q * Math.PI + ph * 2 + u * TAU * 1.3, r = R(u) * 0.45; const x = cx + r * Math.sin(th), y = yA(u) + r * EY * Math.cos(th); if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.strokeStyle = 'rgba(206,236,226,0.04)'; g.lineWidth = Hs * 0.022; g.stroke(); g.strokeStyle = 'rgba(231,255,246,0.08)'; g.lineWidth = Hs * 0.008; g.stroke(); } }
    // the inner pale spiral (Celestial): back then front, inside the bands
    for (const B of L) if (B.k === 'inner') band(B, 0);
    for (const B of L) if (B.k === 'inner') band(B, 1);
    // the front halves
    for (const B of L) if (B.k !== 'inner') band(B, 1);
    // the rim: a soft lip round the top (faint behind, brighter in front) and two bright gusts running round it
    { const y1 = yA(1), r1 = R(1);
      g.beginPath(); g.ellipse(cx, y1, r1, r1 * EY, 0, Math.PI, TAU); g.strokeStyle = rgbaS(MINT, 0.1); g.lineWidth = Hs * 0.03; g.stroke();
      g.beginPath(); g.ellipse(cx, y1, r1, r1 * EY, 0, 0, Math.PI); g.strokeStyle = rgbaS(MINT, 0.16); g.lineWidth = Hs * 0.04; g.stroke(); g.strokeStyle = rgbaS(AIR, 0.16); g.lineWidth = Hs * 0.014; g.stroke();
      g.lineCap = 'butt'; for (let q = 0; q < 2; q++) for (const [lw, col, a] of [[0.032, MINT, 0.3], [0.013, AIR, 0.6], [0.005, '#FFFFFF', 0.85]]) { const a0 = ph + q * Math.PI, N = 18; for (let i = 0; i < N; i++) { const s0 = i / N, s1 = (i + 1) / N, t0 = a0 + s0 * 2.0, t1 = a0 + s1 * 2.0, c0 = Math.cos(t0), w = Math.sin(Math.PI * (s0 + s1) / 2); if (c0 < -0.1) continue;
          g.beginPath(); g.moveTo(cx + r1 * 1.01 * Math.sin(t0), y1 + r1 * EY * c0); g.lineTo(cx + r1 * 1.01 * Math.sin(t1), y1 + r1 * EY * Math.cos(t1)); g.strokeStyle = rgbaS(col, a * w * cl(c0 + 0.4)); g.lineWidth = Hs * lw * (0.4 + 0.6 * w); g.stroke(); } } }
    // feather the top and the floor contact
    g.globalCompositeOperation = 'destination-in'; const gm = g.createLinearGradient(0, 0, 0, Hs);
    gm.addColorStop(0, 'rgba(0,0,0,0)'); gm.addColorStop(PADT * 0.45, 'rgba(0,0,0,0.55)'); gm.addColorStop(PADT * 1.1, 'rgba(0,0,0,1)'); gm.addColorStop(1 - PADB - 0.12 * (1 - PADB - PADT), 'rgba(0,0,0,1)'); gm.addColorStop(1 - PADB, 'rgba(0,0,0,0.45)'); gm.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gm; g.fillRect(0, 0, W, Hs); g.globalCompositeOperation = 'source-over';
  }
  const funnelFrame = (tier, Hs, fi) => fxSprite('fhwF|' + tier + '|' + Hs + '|' + fi, Math.round(Hs * WK), Hs, (g, W, Hh) => paintFunnel(g, W, Hh, tier, fi / NFR * Math.PI));

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
  const NLR = 16, LSZ = 18;
  const leafSpr = b => fxSprite('fhwL|' + b, LSZ, LSZ, g => {
    const c0 = LSZ / 2, L = LSZ * 0.42; g.translate(c0, c0); g.rotate(b / NLR * TAU);
    g.beginPath(); g.moveTo(0, L); g.quadraticCurveTo(L * 0.7, 0, 0, -L); g.quadraticCurveTo(-L * 0.7, 0, 0, L); g.closePath(); const gr = g.createLinearGradient(-L, 0, L, 0); gr.addColorStop(0, '#9BE8A8'); gr.addColorStop(0.5, LEAFC); gr.addColorStop(1, EMER); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(20,90,60,0.6)'; g.lineWidth = 0.8; g.stroke(); g.strokeStyle = 'rgba(230,255,240,0.55)'; g.beginPath(); g.moveTo(0, L * 0.8); g.lineTo(0, -L * 0.75); g.stroke(); });
  /* the floor swirl under a twister (in the floor's own plane, squashed when drawn): three light arms, turned in 16 steps of its 120-degree repeat */
  const NSW = 16;
  const swirlBase = () => fxSprite('fhwSwB', 128, 128, (g, w) => {
    const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    let gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); gr.addColorStop(0, 'rgba(231,255,246,0.4)'); gr.addColorStop(0.35, 'rgba(115,232,182,0.16)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w);
    for (let arm = 0; arm < 3; arm++) for (const [col, lw] of [['rgba(115,232,182,0.28)', 10], ['rgba(231,255,246,0.55)', 3.6], ['rgba(255,175,210,0.5)', 1.4]]) {
      for (let i = 1; i <= 36; i++) { const u0 = (i - 1) / 36, u = i / 36, f = q => [Math.cos(arm * TAU / 3 + q * 3.6) * c0 * 0.92 * (0.12 + 0.88 * q), Math.sin(arm * TAU / 3 + q * 3.6) * c0 * 0.92 * (0.12 + 0.88 * q)], p0 = f(u0), p1 = f(u); g.strokeStyle = col; g.lineWidth = lw * Math.pow(Math.sin(Math.PI * u), 0.8) + 0.3; g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); } } });
  const swirlFrame = i => fxSprite('fhwSw|' + i, 128, 128, (g, w) => { g.translate(w / 2, w / 2); g.rotate(-i / NSW * TAU / 3); g.drawImage(swirlBase(), -w / 2, -w / 2); });
  /* a soft contact shadow (dark centre, feathered to nothing) */
  const shadowSpr = () => fxSprite('fhwSh', 64, 64, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(10,30,26,0.75)'); gr.addColorStop(0.45, 'rgba(10,30,26,0.35)'); gr.addColorStop(1, 'rgba(10,30,26,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* the wreath's light on the floor (a soft mint ring with a pink inner line) */
  const wreathSpr = () => fxSprite('fhwWr', 160, 160, (g, w) => {
    const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(115,232,182,0)'], [0.42, 'rgba(115,232,182,0.05)'], [0.6, 'rgba(115,232,182,0.32)'], [0.7, 'rgba(231,255,246,0.75)'], [0.76, 'rgba(255,175,210,0.45)'], [0.86, 'rgba(115,232,182,0.14)'], [1, 'rgba(115,232,182,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* a narrow rising current (vertical, feathered at both ends) */
  const curSpr = () => fxSprite('fhwCur', 24, 128, (g, w, h) => {
    for (let y = 0; y < h; y += 2) { const v = y / (h - 1), a = sm(v / 0.4) * sm((1 - v) / 0.15), gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(115,232,182,0)'); gr.addColorStop(0.3, `rgba(115,232,182,${0.35 * a})`); gr.addColorStop(0.5, `rgba(231,255,246,${0.95 * a})`); gr.addColorStop(0.7, `rgba(115,232,182,${0.35 * a})`); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, y, w, 2); } });
  /* Celestial: a loose seven-petal flower of light on the floor (a rose curve), drawn turning under the gathered twisters */
  const roseSpr = () => fxSprite('fhwRose', 256, 256, (g, w) => {
    const c0 = w / 2, R = c0 * 0.93; g.translate(c0, c0); g.lineJoin = 'round';
    const path = () => { g.beginPath(); for (let i = 0; i <= 420; i++) { const q = i / 420 * TAU, rr = R * (0.2 + 0.8 * Math.abs(Math.cos(3.5 * q))), x = Math.cos(q) * rr, y = Math.sin(q) * rr; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); };
    for (const [col, lw] of [['rgba(255,175,210,0.16)', 16], ['rgba(115,232,182,0.28)', 7], ['rgba(231,255,246,0.6)', 2.4]]) { path(); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, R); gr.addColorStop(0, 'rgba(255,175,210,0.3)'); gr.addColorStop(0.3, 'rgba(115,232,182,0.1)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });

  /* the sprite sizes for a cast: funnel frames painted near the pixels they are shown at */
  const dprOf = () => Math.min(2, Math.max(1, (typeof arc !== 'undefined' && arc.dpr) || (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1)));
  const hsOf = (T, SZ) => Math.max(128, Math.min(320, Math.round(2 * T * SZ * dprOf() / (1 - PADB - PADT) / 32) * 32));
  /* the work of painting every picture a cast needs, smallest first (so a slice of a few ms can run each frame or in idle time) */
  function warmList(tier, Hs) {
    const L = [() => wreathSpr(), () => shadowSpr(), () => curSpr(), () => swirlBase()];
    for (let b = 0; b < NBR; b++) { L.push(() => blossomSpr(0, b)); L.push(() => blossomSpr(1, b)); }
    for (let b = 0; b < NPR; b++) { L.push(() => petalSpr(0, b)); L.push(() => petalSpr(1, b)); }
    for (let b = 0; b < NLR; b++) L.push(() => leafSpr(b));
    for (let i = 0; i < NSW; i++) L.push(() => swirlFrame(i));
    if (tier >= 3) L.push(() => roseSpr());
    for (let i = 0; i < NFR; i++) L.push(() => funnelFrame(tier, Hs, i));
    return L;
  }
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /* ================= Flower Hurricane ================= */
  U.flowerhurricane = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = tierOf(ev), D = durOf(ev), S = sizeOf(ev), KK = C.K || 1, SZ = S * KK;
    const N = 7, TICK = 0.5, T_LIFT = 0.45, T_LAND = 1.0, T_FORM = 0.7, tA = T_LAND + T_FORM, EXIT = 1.1;
    let tE = tA + D; const LIFE = tE + 2.9;
    const RH = 0.72 * SZ, V = 2.0 * (0.85 + 0.15 * S) * Math.sqrt(KK), LR = (3.5 + 0.7 * S) * KK, SEP = 1.55 * SZ;
    /* one twister held on a monster the whole time: ~12 x base at Hatchling, ~16 at Adept, ~20 at Celestial (x C.K) */
    const evoK = 1 + 0.08 * (ev - 1), nT = Math.round(D / TICK), dmgT = C.base * KK * evoK * 12 * Math.pow(D / 6, 0.25) / nT;
    const T0 = H.X.Tz(), Hs = hsOf(T0, SZ), warm = warmList(tier, Hs);
    H.X.banner('FLOWER HURRICANE', '', C.col, 1.4); H.X.sfx.hum();
    // where the fight is: between the pet and the aim (the twisters are kept round it)
    const dA = Math.hypot(C.tx - me.x, C.ty - me.y) || 1, aA = Math.atan2(C.ty - me.y, C.tx - me.x), anc = { x: me.x + (C.tx - me.x) * Math.min(1, 2.4 / dA), y: me.y + (C.ty - me.y) * Math.min(1, 2.4 / dA) };
    const free = (x, y) => !H.X.blocked || !H.X.blocked(x, y, 0.35, 0);
    /* seven nearby spots, fanned toward the aim */
    const tw = [];
    for (let i = 0; i < N; i++) { const b = aA + (i - 3) * 0.6 + (R1(i * 3.3) - 0.5) * 0.15; let r = 1.9 + (i % 2) * 0.55, x = me.x + Math.cos(b) * r, y = me.y + Math.sin(b) * r; while (r > 0.6 && !free(x, y)) { r -= 0.25; x = me.x + Math.cos(b) * r; y = me.y + Math.sin(b) * r; }
      const fl = [], nB = H.n(8 + 2 * tier), nS = H.n(13 + 4 * tier), gd = [], nG = H.n(5 + tier);
      for (let j = 0; j < nB; j++) fl.push({ big: 1, off: (j + R1(i * 9 + j)) / nB, rate: 0.2 + 0.05 * R1(i * 5 + j * 2.1), rad: 1.02 + 0.12 * R1(j * 4.7 + i), a0: R1(i * 7 + j * 3.3) * TAU, w: 0.55 + 0.15 * R1(j * 1.7), tum: R1(j * 6.1 + i) * TAU, tw: 1.4 + 1.6 * R1(j * 2.9 + i), v: (i + j) & 1, b0: R1(j * 8.3 + i * 2) * 60, br: 3 + 4 * R1(j * 3.9), sz: 0.85 + 0.3 * R1(j * 5.5 + i) });
      for (let j = 0; j < nS; j++) fl.push({ big: 0, off: (j + R1(i * 11 + j)) / nS, rate: 0.55 + 0.35 * R1(i * 3 + j * 1.3), rad: 0.32 + 0.4 * R1(j * 2.3 + i * 5), a0: R1(i * 13 + j * 2.7) * TAU, w: 1.5 + 0.6 * R1(j * 4.1), tum: R1(j * 3.7) * TAU, tw: 3 + 4 * R1(j * 1.1 + i), v: (i + j) & 1, b0: R1(j * 6.7 + i) * 60, br: 8 + 8 * R1(j * 7.3), sz: 0.8 + 0.4 * R1(j * 9.9 + i) });
      for (let j = 0; j < nG; j++) gd.push({ k: j % 3, off: (j + R1(i * 17 + j)) / nG, rate: 0.45 + 0.25 * R1(j * 3.1 + i), a0: R1(j * 5.9 + i * 3) * TAU, b0: R1(j * 2.3 + i) * 40, br: 6 + 6 * R1(j * 7.7) });
      tw.push({ i, x, y, sx: x, sy: y, hd: Math.atan2(y - me.y, x - me.x), tx: x, ty: y, ph: R1(i * 5.7) * TAU, tgt: null, wp: null, re: 0, br: null, xp: null, xpT: 0, cool: 0, fl, gd, fo: false, spin: 5.2 + 0.6 * R1(i * 2.2) }); }
    /* the seven wreath clusters: where on the wreath, and their flight out */
    const WR = 0.95;
    const parts = [];   // blossom fountains, drifting petals, hit puffs: { x, y, z, vx, vy, vz, t, life, k (0 blossom 1 petal 2 leaf), v, b, br, tum, tw, sz }
    const live = () => H.living();
    function retarget(o, t, L) {
      const taken = new Set(); for (const q of tw) if (q !== o && q.tgt) taken.add(q.tgt);
      const cand = L.filter(m => Math.hypot(m.x - anc.x, m.y - anc.y) < LR + 2 + m.r);
      let best = null, bs = 1e9; for (const m of cand) { const sc = Math.hypot(m.x - o.x, m.y - o.y) + (taken.has(m) ? 2.6 : 0) + (m === o.last ? 3 : 0) + R1(o.i * 3.7 + Math.floor(t * 3) + m.x) * 1.4; if (sc < bs) { bs = sc; best = m; } }
      o.re = t + 2.0 + R1(o.i + t) * 0.8;
      if (best) { const dx = best.x - o.x, dy = best.y - o.y, d = Math.hypot(dx, dy) || 1, k = 1.1 + 0.4 * R1(o.i * 2 + t); o.tgt = best; o.last = best; o.wp = { x: best.x + dx / d * k + (-dy / d) * (R1(o.i + t * 1.3) - 0.5) * 0.8, y: best.y + dy / d * k + (dx / d) * (R1(o.i + t * 1.3) - 0.5) * 0.8 }; }
      else { const b = R1(o.i * 5 + t) * TAU, r = LR * (0.35 + 0.5 * R1(o.i + t * 2)); o.tgt = null; o.wp = { x: anc.x + Math.cos(b) * r, y: anc.y + Math.sin(b) * r }; } }
    // the Celestial gathering: a loose rotating flower round the monsters, then spreading again
    const FW0 = tier >= 3 ? tA + Math.max(1.8, D * 0.38) : 1e9, FW1 = FW0 + 2.7; let fC = null;
    let nextTick = tA, nextBraid = tA + 1.1, nextCross = tA + 1.8, deadEnd = false;
    const spawnFountain = o => { const T = H.X.Tz(), top = 2 * SZ * 1.45, nb = H.n(9 + 3 * tier), np = H.n(12 + 4 * tier); void T;
      for (let j = 0; j < nb + np; j++) { const big = j < nb, b = R1(o.i * 31 + j * 1.7) * TAU, vh = (big ? 0.9 : 1.1) + 1.9 * R1(o.i + j * 2.9);
        parts.push({ x: o.x + (o.tx - o.x) * 0.8, y: o.y + (o.ty - o.y) * 0.8, z: top * (0.7 + 0.35 * R1(j)), vx: Math.cos(b) * vh, vy: Math.sin(b) * vh * 0.8, vz: 1.4 + 2.4 * R1(o.i * 7 + j), t: -0.35 * R1(j * 7.7 + o.i), life: 2.0 + 0.8 * R1(j * 3.3 + o.i), k: big ? 0 : (j % 5 === 0 ? 2 : 1), v: j & 1, b: R1(j * 4.1) * 60, br: big ? 3 + 3 * R1(j) : 8 + 8 * R1(j), tum: R1(j * 2.2) * TAU, tw: big ? 2 + 2 * R1(j * 5) : 5 + 4 * R1(j * 5), sz: big ? 0.9 + 0.35 * R1(j * 6.6) : 0.9 + 0.4 * R1(j * 6.6), fl: 1 }); } };
    const puff = (m, o) => { for (let j = 0; j < 3; j++) { const b = R1(m.x * 3 + j + o.i) * TAU, v = 1 + 1.2 * R1(j * 2 + m.y); parts.push({ x: m.x, y: m.y, z: 0.5 + 0.3 * R1(j), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 1.2 + R1(j * 5) * 1.2, t: 0, life: 0.75, k: j === 2 ? 2 : 1, v: j & 1, b: R1(j * 3.1 + m.x) * 60, br: 10, tum: 0, tw: 7, sz: 0.85, fl: 0 }); } };

    H.add({ key: 'flowerhurricane', life: LIFE, wi: 0, tw, parts,
      update(dt, f) {
        // the pictures, a few milliseconds a frame from the cast (the funnels are needed 1 s in)
        if (f.wi < warm.length) { const t0 = now(); do warm[f.wi++](); while (f.wi < warm.length && now() - t0 < 3.5); }
        const t = f.t;
        if (me.dead && !deadEnd && t < tE) { deadEnd = true; tE = Math.max(tA, t); f.life = Math.min(f.life, tE + 2.9 - t); }
        if (t < T_LAND - 0.05) return;
        const L = live(), act = t < tE;
        // the anchor follows the pet if it wanders far
        { const d = Math.hypot(me.x - anc.x, me.y - anc.y); if (d > LR * 0.8) { const k = Math.min(1, dt * 0.8); anc.x += (me.x - anc.x) * k; anc.y += (me.y - anc.y) * k; } }
        // braids: two near twisters swirl round each other for a moment and part; Adept and up also cross paths on purpose
        if (act && t >= nextBraid && t < tE - 1.6) { nextBraid = t + (tier >= 2 ? 1.7 : 2.6); let pa = null, pd = 3.2; for (const a of tw) for (const b of tw) { if (a.i >= b.i || a.br || b.br || a.cool > t || b.cool > t) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < pd) { pd = d; pa = [a, b]; } }
          if (pa && !(t >= FW0 - 1.5 && t < FW1)) { const [a, b] = pa, B = { a, b, t0: t, dur: 1.5, mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, q0: Math.atan2(a.y - b.y, a.x - b.x), dx: Math.cos(a.hd) + Math.cos(b.hd), dy: Math.sin(a.hd) + Math.sin(b.hd) }; const dd = Math.hypot(B.dx, B.dy) || 1; B.dx /= dd; B.dy /= dd; a.br = B; b.br = B; H.X.sfx.whoosh(); } }
        if (act && tier >= 2 && t >= nextCross && t < tE - 1.4) { nextCross = t + 2.3; let pa = null, pd = 0; for (const a of tw) for (const b of tw) { if (a.i >= b.i || a.br || b.br || a.xp || b.xp) continue; const d = Math.hypot(a.x - b.x, a.y - b.y); if (d > 1.8 && d < 4.2 && d > pd) { pd = d; pa = [a, b]; } }
          if (pa && !(t >= FW0 - 1.2 && t < FW1)) { const [a, b] = pa, dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, sd = (a.i + b.i) % 2 ? 1 : -1; a.wp = { x: b.x + dx / d * 1.2 - dy / d * 0.35 * sd, y: b.y + dy / d * 1.2 + dx / d * 0.35 * sd }; b.wp = { x: a.x - dx / d * 1.2 + dy / d * 0.35 * sd, y: a.y - dy / d * 1.2 - dx / d * 0.35 * sd }; a.tgt = b.tgt = null; a.re = b.re = t + 2.0; a.xp = b; b.xp = a; a.xpT = b.xpT = t + 1.7; } }
        if (tier >= 3 && t >= FW0 && !fC) { let sx = 0, sy = 0, k = 0; for (const m of L) if (Math.hypot(m.x - anc.x, m.y - anc.y) < LR + 2) { sx += m.x; sy += m.y; k++; } fC = k ? { x: sx / k, y: sy / k } : { x: anc.x, y: anc.y }; H.X.sfx.whoosh(); }
        for (const o of tw) {
          if (o.br && t > o.br.t0 + o.br.dur) { const B = o.br, q = Math.atan2(o.y - B.my, o.x - B.mx); o.hd = q + (o === B.a ? 0.5 : -0.5); o.br = null; o.cool = t + 2.5; o.re = 0; }
          if (o.xp && t > o.xpT) o.xp = null;
          if (t < tA - 0.25) continue;
          const ramp = act ? cl((t - tA + 0.25) / 0.7) : Math.max(0, 1 - (t - tE) / (EXIT * 0.9));
          if (ramp <= 0) { o.tx += (o.x - o.tx) * Math.min(1, dt * 3); o.ty += (o.y - o.ty) * Math.min(1, dt * 3); continue; }
          let gx, gy, turn = 2.3, sp = V;
          const inF = fC && t < FW1;
          if (inF) { const u = t - FW0, q = o.i * TAU / N + u * 1.05, Rf = 2.0 * SZ * (1 + 0.12 * Math.sin(u * 2.2 + o.i * 2.1));
            if (u < 2.1) { gx = fC.x + Math.cos(q) * Rf; gy = fC.y + Math.sin(q) * Rf; turn = 5.5; const d = Math.hypot(gx - o.x, gy - o.y); sp = V * Math.min(1.35, 0.55 + d * 0.5); }
            else { gx = fC.x + Math.cos(q) * (Rf + 4); gy = fC.y + Math.sin(q) * (Rf + 4); turn = 3.5; if (u > 2.6) o.re = 0; } }
          else if (o.br) { const B = o.br, u = (t - B.t0) / B.dur; B.mx += B.dx * V * 0.45 * dt * 0.5; B.my += B.dy * V * 0.45 * dt * 0.5; const q = B.q0 + u * 4.6, rb = 0.25 + 0.5 * Math.sin(Math.PI * u) * SZ, sg = o === B.a ? 1 : -1; gx = B.mx + Math.cos(q) * rb * sg + B.dx * 0.6; gy = B.my + Math.sin(q) * rb * sg + B.dy * 0.6; turn = 6; sp = V * 0.9; }
          else { if (!o.wp || t > o.re || Math.hypot(o.wp.x - o.x, o.wp.y - o.y) < 0.6 || (o.tgt && o.tgt.dead)) retarget(o, t, L); gx = o.wp.x; gy = o.wp.y; if (o.tgt && Math.hypot(o.tgt.x - o.x, o.tgt.y - o.y) < 1.2) sp = V * 0.8; }
          let dx = gx - o.x, dy = gy - o.y; { const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d; }
          // kept apart (a braiding or crossing partner excepted), off the pet, inside the field
          for (const q of tw) { if (q === o || (o.br && q.br === o.br) || o.xp === q) continue; const ex = o.x - q.x, ey = o.y - q.y, d = Math.hypot(ex, ey) || 0.01, sep = inF ? SEP * 0.7 : SEP; if (d < sep) { const k = (sep - d) / sep * 1.8; dx += ex / d * k; dy += ey / d * k; } }
          { const ex = o.x - me.x, ey = o.y - me.y, d = Math.hypot(ex, ey) || 0.01; if (d < 1.3) { dx += ex / d * (1.3 - d) * 2.2; dy += ey / d * (1.3 - d) * 2.2; } }
          { const ex = o.x - anc.x, ey = o.y - anc.y, d = Math.hypot(ex, ey) || 0.01; if (d > LR) { dx -= ex / d * (d - LR) * 0.9; dy -= ey / d * (d - LR) * 0.9; } }
          const want = Math.atan2(dy, dx), dh = wrapA(want - o.hd), mt = turn * dt;
          o.turn = Math.max(-mt, Math.min(mt, dh)) / Math.max(dt, 1e-4);
          o.hd += Math.max(-mt, Math.min(mt, dh)) + Math.sin(t * 1.1 + o.ph) * 0.45 * dt;
          const step = sp * ramp * dt; let moved = false;
          for (const da of [0, 0.45, -0.45, 0.9, -0.9, 1.5, -1.5, 2.3, -2.3, Math.PI]) { const a = o.hd + da, nx = o.x + Math.cos(a) * step, ny = o.y + Math.sin(a) * step; if (free(nx, ny)) { o.x = nx; o.y = ny; if (da) o.hd += da * Math.min(1, dt * 8); moved = true; break; } }
          if (!moved) o.hd += Math.PI * 0.5 * dt;
          // the top follows the ground contact with a lag (the funnel leans into its turns)
          const kL = 1 - Math.exp(-dt * 2.6); o.tx += (o.x - o.tx) * kL; o.ty += (o.y - o.ty) * kL;
          // the floor dust and leaves it kicks up
          if (act && Math.random() < dt * 5 * H.Q()) { const b = Math.random() * TAU; H.P({ kind: 'spark', x: o.x + Math.cos(b) * 0.35 * SZ, y: o.y + Math.sin(b) * 0.25 * SZ, vx: -Math.sin(b) * 1.6, vy: Math.cos(b) * 0.9 - 0.6, g: 0, drag: 1.2, life: 0.5, max: 0.5, size: 1.6 + Math.random() * 1.4, color: Math.random() < 0.5 ? AIR : '#EADFC6' }); }
        }
        // the gameplay tick: every 0.5 s of the game clock, each twister strikes the monsters inside its area once
        while (act && t >= nextTick && nextTick < tE - 1e-6) { nextTick += TICK; let np = 0;
          for (const o of tw) { const k = H.hitArea(o.x, o.y, RH, dmgT, C.dmgO()); if (k && np < 6) for (const m of H.near(o.x, o.y, RH)) { if (np++ >= 6) break; puff(m, o); } } }
        // the end: each funnel unwinds upward into a blossom fountain
        if (t >= tE + EXIT * 0.32) for (const o of tw) if (!o.fo) { o.fo = true; spawnFountain(o); if (o.i === 0) { H.X.sfx.sparkle(); H.X.sfx.whoosh(); } }
        // the petals in the air: blossoms tumble out of the fountains, slow, and drift down to settle
        for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; if (p.t >= p.life) { parts.splice(i, 1); continue; } if (p.t < 0) continue;
          if (p.z > 0) { p.vz -= 6.5 * dt; const term = p.k === 0 ? -1.1 : -0.75; if (p.vz < term) p.vz = term; const dr = Math.exp(-dt * (p.vz < 0 ? 1.4 : 0.5)); p.vx *= dr; p.vy *= dr; p.x += (p.vx + (p.vz < 0 ? Math.sin(p.t * 2.6 + p.b) * 0.6 : 0)) * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); } }
      },
      drawUnder(c, f, X0, Y0, T) {
        const t = f.t;
        // the wreath turning beneath the pet, its light on the floor
        if (t < T_LAND + 0.45) { const PX = H.sx(me.x), PY = H.sy(me.y), a = cl(t / 0.3) * (1 - cl((t - T_LIFT - 0.1) / 0.85)), r = WR * T * (0.75 + 0.25 * H.ease.out(cl(t / 0.4))) * 1.45;
          if (a > 0.01) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * a; c.drawImage(wreathSpr(), PX - r, PY - r * H.GY, r * 2, r * 2 * H.GY); c.restore(); } 
          const WX = PX, WY = PY, rot = t * 1.6, gr = H.ease.out(cl(t / 0.4)), a0 = cl(t / 0.25);  // the wreath's blossoms, on the floor round the pet
          for (let j = 0; j < 14; j++) { const cluster = j % 2 === 0, q = j * TAU / 14 + rot, lifted = cluster && t > T_LIFT, a = a0 * (cluster ? (lifted ? 0 : 1) : 1 - cl((t - T_LIFT) / 0.7)); if (a < 0.02) continue;
            const bx = WX + Math.cos(q) * WR * T * gr, by = WY + Math.sin(q) * WR * T * gr * H.GY, s = T * (cluster ? 0.34 : 0.24) * (0.6 + 0.4 * gr), bk = ((Math.floor((q * 2 + j) / (TAU / 5) * NBR) % NBR) + NBR) % NBR;
            if (cluster) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * a; c.drawImage(glowSprite(PINK), bx - s * 1.3, by - s * 0.8, s * 2.6, s * 1.6); c.restore(); }
            c.save(); c.globalAlpha = a; c.drawImage(blossomSpr(j & 1, bk), bx - s / 2, by - s * 0.32, s, s * 0.64); c.restore(); }
        }
        // Celestial: the loose flower of light under the gathered seven
        if (fC && t < FW1 + 0.6) { const u = t - FW0, a = sm(u / 0.7) * (1 - sm((u - 2.1) / 1.0)), R = 2.0 * SZ * T * 1.35; if (a > 0.01) { c.save(); c.translate(H.sx(fC.x), H.sy(fC.y)); c.scale(1, H.GY); c.rotate(u * 1.05); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * a; c.drawImage(roseSpr(), -R, -R, R * 2, R * 2); c.restore(); } }
        if (t < T_LAND) return;
        // a soft contact shadow under each twister's base
        for (const o of tw) { const g = cl((t - T_LAND) / T_FORM), ex = cl((t - tE) / EXIT), a = sm(g * 1.5) * (1 - sm(ex)); if (a < 0.01) continue; const BX = H.sx(o.x), BY = H.sy(o.y), r = T * SZ * 0.62 * (0.6 + 0.4 * g);
          c.globalAlpha = 0.42 * a; c.drawImage(shadowSpr(), BX - r, BY - r * H.GY, r * 2, r * 2 * H.GY); }
        c.globalAlpha = 1;
        // the swirl under each twister (light only), following the contact
        c.save(); c.globalCompositeOperation = 'lighter';
        for (const o of tw) { const g = cl((t - T_LAND) / T_FORM), ex = cl((t - tE) / EXIT), a = sm(g * 1.5) * (1 - sm(ex)); if (a < 0.01) continue; const BX = H.sx(o.x), BY = H.sy(o.y), r = T * SZ * (0.7 + 0.1 * Math.sin(t * 2.3 + o.ph)) * (0.5 + 0.5 * g);
          c.globalAlpha = 0.1 * a; c.drawImage(glowSprite(MINT), BX - r * 1.5, BY - r * 1.5 * H.GY, r * 3, r * 3 * H.GY);
          const fi = ((Math.floor((t * o.spin * 0.55 + o.ph) / (TAU / 3) * NSW) % NSW) + NSW) % NSW; c.globalAlpha = 0.65 * a; c.drawImage(swirlFrame(fi), BX - r, BY - r * H.GY, r * 2, r * 2 * H.GY); }
        c.restore();
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t;
        const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.46;
        // the seven clusters flying out of the wreath (dimmed where they pass over the pet)
        if (t < T_LAND + 0.3) {
          if (t > T_LIFT) for (const o of tw) { const u = cl((t - T_LIFT) / (T_LAND - T_LIFT)), e = H.ease.io(u), q = o.i * 2 * TAU / 14 + T_LIFT * 1.6, sx0 = me.x + Math.cos(q) * WR, sy0 = me.y + Math.sin(q) * WR, wx = lerp(sx0, o.sx, e), wy = lerp(sy0, o.sy, e), z = Math.sin(Math.PI * u) * 0.9 + 0.15 * u, X = H.sx(wx), Y = H.sy(wy) - z * T, a = (1 - cl((t - T_LAND - 0.05) / 0.25)) * (0.3 + 0.7 * sm(Math.hypot(X - PX, (Y - PY) * 1.2) / (T * 0.9) - 0.2));
            if (a < 0.02) continue; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * a; const gs = T * 0.55; c.drawImage(glowSprite(PINK), X - gs, Y - gs, gs * 2, gs * 2); c.globalAlpha = 0.6 * a; c.drawImage(glowSprite(AIR), X - gs * 0.4, Y - gs * 0.4, gs * 0.8, gs * 0.8); c.restore();
            c.save(); c.globalAlpha = a; for (let k = 0; k < 3; k++) { const b = k * TAU / 3 + t * 5 + o.i, s = T * 0.3, bx = X + Math.cos(b) * T * 0.16, by = Y + Math.sin(b) * T * 0.09, bk = ((Math.floor(t * 8 + k * 3 + o.i) % NBR) + NBR) % NBR; c.drawImage(blossomSpr((k + o.i) & 1, bk), bx - s / 2, by - s / 2, s, s); } c.restore(); } }
        if (t >= T_LAND) {
          const order = tw.slice().sort((a, b) => a.y - b.y);
          for (const o of order) drawTwister(c, o, T, t, PX, PY);
        }
        // the petals in the air (fountains, hit puffs)
        for (const p of parts) { if (p.t < 0) continue; const u = p.t / p.life, a = cl(p.t / 0.12) * (1 - sm((u - 0.7) / 0.3)); if (a < 0.02) continue; const X = H.sx(p.x), Y = H.sy(p.y) - p.z * T, tum = p.tum + p.t * p.tw, fy = 0.35 + 0.65 * Math.abs(Math.cos(tum));
          c.globalAlpha = a; if (p.k === 0) { const s = T * 0.34 * SZ * p.sz, bk = ((Math.floor(p.b + p.t * p.br) % NBR) + NBR) % NBR; c.drawImage(blossomSpr(p.v, bk), X - s / 2, Y - s * fy / 2, s, s * fy); }
          else if (p.k === 1) { const s = T * 0.2 * Math.sqrt(SZ) * p.sz, bk = ((Math.floor(p.b + p.t * p.br) % NPR) + NPR) % NPR; c.drawImage(petalSpr(p.v, bk), X - s / 2, Y - s * fy / 2, s, s * fy); }
          else { const s = T * 0.18 * p.sz, bk = ((Math.floor(p.b + p.t * p.br) % NLR) + NLR) % NLR; c.drawImage(leafSpr(bk), X - s / 2, Y - s * fy / 2, s, s * fy); } }
        c.globalAlpha = 1;
      } });

    /* one twister: the flowers behind it, the funnel in sheared strips (bending, leaning, its contact wandering), then the flowers and the leaves in front */
    function drawTwister(c, o, T, t, PX, PY) {
      const g = cl((t - T_LAND) / T_FORM), ex = cl((t - tE) / EXIT), BX = H.sx(o.x), BY = H.sy(o.y), Hscr = 2 * T * SZ, hh = Hs * (1 - PADB - PADT), k = Hscr / hh;
      const ky = 1 + 0.8 * H.ease.in(ex), kx = (0.3 + 0.7 * H.ease.out(cl((g - 0.2) / 0.8))) * (1 + 0.045 * Math.sin(t * 2.3 + o.ph)) * (1 - 0.25 * ex);
      const lean = Math.max(-0.9, Math.min(0.9, (o.tx - o.x) * 0.9 - (o.turn || 0) * 0.08)) * T * SZ, ph = o.ph, wob = T * SZ;
      const off = u => { u = Math.max(0, Math.min(1.1, u)); const v = 1 - Math.min(1, u); return lean * Math.pow(u, 1.3) + wob * (0.07 * Math.sin(t * 1.9 + ph + u * 2.4) * u + (0.085 * Math.sin(t * 6.1 + ph) + 0.05 * Math.sin(t * 9.7 + ph * 2)) * v * v * v); };
      // dim smoothly where it passes over the pet
      let na = 1; { const u = (BY - PY) / (Hscr * ky); if (u > -0.3 && u < 1.15) { const hw = rOf(Math.max(0, Math.min(1, u))) * Hs * k * kx + T * 0.55, d = Math.abs(PX - (BX + off(u))) - hw, dv = Math.max(0, -u * Hscr, (u - 1) * Hscr); na = 0.3 + 0.7 * sm(Math.max(d, dv) / (T * 0.8) + 0.15); } }
      const fa = na * (1 - sm((ex - 0.55) / 0.45));
      const uLim = g < 1 ? g * 1.2 : 9, uSh = ex * 0.9, spinA = t * o.spin + ph;
      const flowers = side => {
        for (const q of o.fl) { const cy = (t * q.rate + q.off) % 1, u = (q.big ? cy * 1.25 - 0.06 : Math.pow(cy, 0.8) * 1.2 - 0.04) + uSh; if (u > uLim || u < -0.05) continue;
          const peel = cl((u - 1) / 0.22), th = q.a0 + spinA * q.w * (q.big ? 1 : 1 + 0.6 * cy), cs = Math.cos(th); if ((cs > 0 ? 1 : 0) !== side) continue;
          const uu = Math.min(u, 1.05), r = rOf(uu) * Hs * k * kx * q.rad * (1 + peel * 1.1), x = BX + off(uu) + r * Math.sin(th), y = BY - uu * hh * k * ky - peel * T * 0.35 * SZ + r * EY * cs;
          const a = fa * cl((u + 0.05) / 0.12) * (1 - peel) * (side ? 1 : 0.55) * (g < 1 ? cl((uLim - u) / 0.15) : 1) * (1 - sm((ex - 0.35) / 0.4)); if (a < 0.03) continue;
          const tum = q.tum + t * q.tw, fy = 0.35 + 0.65 * Math.abs(Math.cos(tum)), dep = side ? 1 : 0.85;
          c.globalAlpha = a;
          if (q.big) { const s = T * 0.36 * SZ * q.sz * dep, bk = ((Math.floor(q.b0 + t * q.br) % NBR) + NBR) % NBR; c.drawImage(blossomSpr(q.v, bk), x - s / 2, y - s * fy / 2, s, s * fy); }
          else { const s = T * 0.17 * Math.sqrt(SZ) * q.sz * dep, bk = ((Math.floor(q.b0 + t * q.br) % NPR) + NPR) % NPR; c.drawImage(petalSpr(q.v, bk), x - s / 2, y - s * fy / 2, s, s * fy); } }
        // the low spiral of leaves, petals and dust round the contact, drawn in towards it and lifted
        const ga = fa * sm(g * 2) * (1 - sm(ex * 1.6));
        if (ga > 0.03) for (const q of o.gd) { const cy = (t * q.rate + q.off) % 1, th = q.a0 + spinA * 0.9 + cy * 4, cs = Math.cos(th); if ((cs > 0 ? 1 : 0) !== side) continue;
          const r = T * SZ * (0.95 * (1 - cy) + 0.18), x = BX + off(cy * 0.15) + r * Math.sin(th), y = BY - cy * cy * T * 0.5 * SZ + r * 0.42 * cs, a = ga * sm(cy / 0.15) * (1 - sm((cy - 0.75) / 0.25)); if (a < 0.03) continue; c.globalAlpha = a;
          if (q.k === 0) { const s = T * 0.17, bk = ((Math.floor(q.b0 + t * q.br) % NLR) + NLR) % NLR; c.drawImage(leafSpr(bk), x - s / 2, y - s / 2, s, s * 0.7); }
          else if (q.k === 1) { const s = T * 0.15, bk = ((Math.floor(q.b0 + t * q.br) % NPR) + NPR) % NPR; c.drawImage(petalSpr(1, bk), x - s / 2, y - s / 2, s, s * 0.7); }
          else { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.5; const s = T * 0.22; c.drawImage(glowSprite('#EADFC6'), x - s / 2, y - s / 4, s, s / 2); c.globalCompositeOperation = 'source-over'; } }
        c.globalAlpha = 1; };
      c.save();
      flowers(0);
      // the rising current that catches the cluster
      if (g < 1) { const a = fa * sm(g / 0.15) * (1 - sm((g - 0.55) / 0.45)), hc = Hscr * Math.min(1, g * 1.5), w = T * 0.22 * SZ; if (a > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(curSpr(), BX + off(0.5) * 0.5 - w / 2, BY - hc, w, hc); c.globalCompositeOperation = 'source-over'; } }
      // the funnel: one cached turning frame, drawn in sheared strips so it bends with its axis
      const fA = fa * sm((g - 0.12) / 0.45);
      if (fA > 0.01) {
        const fi = ((Math.floor(spinA / Math.PI * NFR) % NFR) + NFR) % NFR, cv = funnelFrame(tier, Hs, fi), W = cv.width, yb = Hs * (1 - PADB), NS = 7, rev = g < 1 ? g * 1.25 : 9, m = c.getTransform();
        for (let j = 0; j < NS; j++) { let s0 = Hs * j / NS; const s1 = Hs * (j + 1) / NS, u1 = (yb - s1) / hh; let u0 = (yb - s0) / hh; if (u1 > rev) continue; if (u0 > rev) { s0 = yb - rev * hh; u0 = rev; } if (s1 - s0 < 1) continue;
          const um = (u0 + u1) / 2, ea = ex > 0 ? cl((um - (ex * 1.5 - 0.4)) / 0.4) : 1, a = fA * ea * (g < 1 ? cl((rev - um) / 0.2 + 0.3) : 1); if (a < 0.01) continue;
          const d0 = off(u0), d1 = off(u1), sh = -(d0 - d1) / (s1 - s0);
          c.setTransform(m); c.globalAlpha = Math.min(1, a);
          c.transform(k * kx, 0, sh, k * ky, BX - W / 2 * k * kx + d1 + (d0 - d1) * s1 / (s1 - s0), BY - yb * k * ky);
          c.drawImage(cv, 0, s0, W, s1 - s0, 0, s0, W, s1 - s0); }
        c.setTransform(m); c.globalAlpha = 1; }
      // where the cluster landed: its glow, fading into the contact
      if (g < 1) { const a = fa * (1 - sm(g / 0.6)); if (a > 0.02) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * a; const gs = T * 0.5; c.drawImage(glowSprite(PINK), BX - gs, BY - T * 0.2 - gs, gs * 2, gs * 2); c.globalCompositeOperation = 'source-over'; } }
      flowers(1);
      c.restore();
    }
    H.X.after(T_LIFT, () => H.X.sfx.whoosh());
    H.X.after(T_LAND + 0.1, () => { H.X.sfx.whoosh(); for (const o of tw) H.X.light(o.x, o.y, 1.6, 0.25); });
    H.X.after(tA - 0.05, () => { H.X.sfx.hum(); H.X.shake(2, 0.15); });
  };
  /* (idle time before the first cast: paint the pictures this pet's level will want, a few at a time) */
  U.flowerhurricane.warm = o => {
    const ev = Math.max(1, Math.min(7, Math.round((o && o.evo) || 1)));
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const L = warmList(tierOf(ev), hsOf(T, sizeOf(ev))); let i = 0;
      const go = () => { if (i >= L.length) return; const t0 = now(); do L[i++](); while (i < L.length && now() - t0 < 3); if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 200 }); else setTimeout(go, 40); }; go(); }, 400);
  };
  U.flowerhurricane.__dbg = { funnelFrame, blossomSpr, petalSpr, leafSpr, hsOf, warmList, durOf, sizeOf };
})();
