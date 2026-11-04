/* ---------- Light (pink) Strongs, reworked: Honey Sugar Heart Attack, Luv Me Luv Me Chain ----------
   Honey Sugar Heart Attack (replaces Prism Petal): small pink lights gather in front of the pet and trace a great
   tubular heart outline from its point up both sides; it closes with an elastic pulse, the pet thrusts, and the
   heart (open centre, translucent pink tube, pearl inner light, thin hot-pink rim, two fine strands winding along
   it, a moving highlight) accelerates away, banking gently, two ribbon trails stretching from its lower curves and
   little stars peeling off behind. It routes through nearby monsters (or the aim) and on contact compresses, bright
   cracks race round the tube and it breaks into curved luminous fragments over a circular pink shockwave, a
   heart-shaped floor ripple, a pearl contact core and a puff of tumbling love hearts. One AoE per heart. A heart
   that reaches its range without touching anything just fades. 1 heart / 2 at Adept (opposing banks) / 3 at
   Celestial (braided routes, the last larger with a rose-gold inner outline and star glints).
   Luv Me Luv Me Chain (replaces Dawnstep Spear): a small spinning heart at the pet's front unspools a chain of
   interlocking heart-outline links (alternately face-on and edge-on) ending in a larger thick heart charm with a
   short ribbon; the chain trails behind, then lashes: each sweep propagates from the root to the tip (the tip starts
   later and finishes with the root, so it is the fastest and leaves the brightest trail), slackens and reverses.
   One swept damage volume per lash (sub-stepped, one hit per monster per lash; links never multiply damage).
   2 lashes (left-right, right-left) / 3 at Adept (+ a diagonal over-the-top snap) / 5 at Celestial (+ two more
   alternating sweeps, the last the widest); reach 2H -> 2.6H -> 3.3H (H = the pet's height, scaled for the arena).
   Then it recoils into a hanging curve, is drawn back into the casting heart, the charm spins once and dissolves.
   Canvas 2D: the "3D" tube is a cached shaded stroke stack (deep side, lit gradient body, blossom inner, pearl core,
   rim) squashed by cos(bank) over a deep side copy offset by the bank; strands, highlight, cracks and fragments are
   live strokes along the cached heart curve. */
(() => {
  const S = ELEM_IMPL.light.strong, TAU = Math.PI * 2;
  delete S.prismpetal; delete S.dawnspear;
  const HOT = '#FF69B4', BLOS = '#FFB7D5', DEEPP = '#D94B91', PEARL = '#FFF0F7', LAV = '#D8B4FF', RGOLD = '#E8AFB8', ROSE = '#FF5CCB', CANDY = '#FF8FDB';
  const cl = u => Math.max(0, Math.min(1, u)), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const evoK = C => 1 + 0.08 * (evoOf(C) - 1);

  /* the heart curve (as the pink ults): index 0 the cleft, HHALF the point; centred so y spans about [-0.56, 1.15] */
  const HP = (() => { const N = 96, pts = []; for (let i = 0; i <= N; i++) { const t = i / N * TAU, s = Math.sin(t); pts.push([16 * s * s * s / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); } return pts; })();
  const HN = HP.length - 1, HHALF = HN / 2, HMID = 0.295;   // HMID: the curve's vertical middle
  const HNRM = HP.map((p, i) => { const a = HP[(i - 1 + HN) % HN], b = HP[(i + 1) % HN], tx = b[0] - a[0], ty = b[1] - a[1], L = Math.hypot(tx, ty) || 1; return [ty / L, -tx / L]; });
  const hp = (i, s) => { const p = HP[((i % HN) + HN) % HN]; return [p[0] * s, (p[1] - HMID) * s]; };
  function heartPath(g, s, ox, oy) { g.beginPath(); for (let i = 0; i < HN; i++) { const p = HP[i], x = ox + p[0] * s, y = oy + (p[1] - HMID) * s; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  function arcPath(g, s, i0, i1, jit, seed) { g.beginPath(); for (let i = i0; i <= i1; i++) { let [x, y] = hp(i, s); if (jit) { const n = HNRM[((i % HN) + HN) % HN], j = (R1(i * 1.7 + seed) - 0.5) * jit; x += n[0] * j; y += n[1] * j; } i === i0 ? g.moveTo(x, y) : g.lineTo(x, y); } }

  /* ---- cached sprites ---- */
  const TS = 256, TU = 88, TC = 128, TW = 24;   // tube sprite: heart unit TU px, centred at (TC, TC); tube TW px thick
  const THGT = 1.71 * TU;                       // the heart's height inside the sprite
  const tubeSpr = () => fxSprite('lsk_tube', TS, TS, g => {
    g.lineJoin = 'round'; g.lineCap = 'round';
    heartPath(g, TU, TC, TC); g.strokeStyle = DEEPP; g.lineWidth = TW; g.stroke();                    // the darker side of the tube
    let gr = g.createLinearGradient(TC - TU, TC - TU, TC + TU, TC + TU); gr.addColorStop(0, '#FF9ACF'); gr.addColorStop(0.45, HOT); gr.addColorStop(1, '#C93F86');
    heartPath(g, TU, TC - 1, TC - 1.4); g.strokeStyle = gr; g.globalAlpha = 0.88; g.lineWidth = TW * 0.78; g.stroke();   // translucent lit body
    g.globalAlpha = 0.75; heartPath(g, TU, TC - 1.6, TC - 2.2); g.strokeStyle = BLOS; g.lineWidth = TW * 0.4; g.stroke();     // blossom inner
    g.globalAlpha = 0.95; heartPath(g, TU, TC - 1.8, TC - 2.4); g.strokeStyle = PEARL; g.lineWidth = TW * 0.15; g.stroke();   // the pearly inner light
    g.globalAlpha = 0.9; heartPath(g, TU * (1 + TW * 0.48 / TU), TC, TC + 1); g.strokeStyle = '#FF3FA4'; g.lineWidth = 1.6; g.stroke();   // a thin hot-pink outer rim
    g.globalAlpha = 0.7; heartPath(g, TU * (1 - TW * 0.5 / TU), TC, TC); g.strokeStyle = '#A8336F'; g.lineWidth = 1.3; g.stroke();         // inner edge shade
    g.globalAlpha = 1; });
  const tubeSide = () => fxSprite('lsk_tubeS', TS, TS, g => { g.lineJoin = 'round'; heartPath(g, TU, TC, TC); g.strokeStyle = '#A8336F'; g.lineWidth = TW; g.stroke(); heartPath(g, TU, TC, TC); g.strokeStyle = DEEPP; g.lineWidth = TW * 0.6; g.stroke(); });
  const tubeGlow = () => fxSprite('lsk_tubeG', TS, TS, g => { g.lineJoin = 'round'; for (const [col, lw] of [['rgba(255,105,180,0.07)', 46], ['rgba(255,105,180,0.13)', 32], ['rgba(255,105,180,0.2)', 22], ['rgba(255,183,213,0.25)', 10]]) { heartPath(g, TU, TC, TC); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); } });
  /* a soft ring for floor shockwaves, feathered both sides */
  const ringSpr = () => fxSprite('lsk_ring', 160, 160, g => { const gr = g.createRadialGradient(80, 80, 0, 80, 80, 80); gr.addColorStop(0, 'rgba(255,105,180,0)'); gr.addColorStop(0.6, 'rgba(255,105,180,0)'); gr.addColorStop(0.78, 'rgba(255,105,180,0.55)'); gr.addColorStop(0.86, 'rgba(255,240,247,0.85)'); gr.addColorStop(0.93, 'rgba(255,105,180,0.35)'); gr.addColorStop(1, 'rgba(255,105,180,0)'); g.fillStyle = gr; g.fillRect(0, 0, 160, 160); });
  /* chain links: a small tube heart outline (face-on) and its darker edge-on band */
  const LS = 64, LU = 18, LC = 32;
  const linkSpr = () => fxSprite('lsk_link', LS, LS, g => { g.lineJoin = 'round'; g.lineCap = 'round'; heartPath(g, LU, LC, LC); g.strokeStyle = DEEPP; g.lineWidth = 6.4; g.stroke();
    const gr = g.createLinearGradient(LC - LU, LC - LU, LC + LU, LC + LU); gr.addColorStop(0, '#FFA6D4'); gr.addColorStop(0.5, HOT); gr.addColorStop(1, '#C93F86'); heartPath(g, LU, LC - 0.5, LC - 0.6); g.strokeStyle = gr; g.lineWidth = 4.4; g.stroke();
    heartPath(g, LU * 0.86, LC - 0.4, LC - 0.2); g.strokeStyle = 'rgba(255,183,213,0.9)'; g.lineWidth = 1.3; g.stroke();   // bright inner rim
    g.strokeStyle = PEARL; g.lineWidth = 1.6; g.save(); g.translate(LC - 0.6, LC - 0.8); arcPath(g, LU, HN - 26, HN - 9); g.stroke(); g.restore(); });
  const linkEdge = () => fxSprite('lsk_linkE', LS, LS, g => { g.lineJoin = 'round'; heartPath(g, LU, LC, LC); g.strokeStyle = '#A8336F'; g.lineWidth = 6.4; g.stroke(); heartPath(g, LU, LC, LC); g.strokeStyle = '#E0559F'; g.lineWidth = 3.6; g.stroke(); heartPath(g, LU, LC - 0.5, LC - 0.5); g.strokeStyle = 'rgba(255,240,247,0.85)'; g.lineWidth = 1.1; g.stroke(); });

  function blit(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || w < 0.5) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); }
  const glow = (c, x, y, r, col, a) => blit(c, glowSprite(col), x, y, r * 2, r * 2, a, true);
  const floorGlow = (H, c, x, y, r, col, a) => blit(c, glowSprite(col), x, y, r * 2, r * 2 * H.GY, a, true);
  /* a tapered trail through screen points (tail first): width and alpha fall to nothing at the tail */
  function taper(c, pts, w0, col, a) { const n = pts.length - 1; if (n < 1 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = col;
    for (let j = 1; j <= n; j++) { const u = j / n; c.globalAlpha = a * Math.pow(u, 0.9); c.lineWidth = Math.max(0.6, w0 * u); c.beginPath(); c.moveTo(pts[j - 1][0], pts[j - 1][1]); c.lineTo(pts[j][0], pts[j][1]); c.stroke(); } c.restore(); }
  /* the pet stays readable: anything bright near its screen body dims smoothly (no cut-outs) */
  function petDim(H, x, y, rad) { const T = H.X.Tz(), px = H.sx(H.me.x), py = H.sy(H.me.y) - T * 0.45, d = Math.hypot(x - px, (y - py) * 1.2); return 1 - 0.5 * (1 - sm((d - rad * 0.2) / (rad * 0.9 + T * 0.4))); }

  /* the tube heart drawn in local coords (already translated to its centre): k = px per sprite px; sx/sy squash */
  function drawTube(c, k, a, t, o) {
    const w = TS * k; o = o || {};
    if (o.side) { c.globalAlpha = a * 0.9; c.drawImage(tubeSide(), -w / 2 + o.side, -w / 2, w, w); }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (o.glowA == null ? 1 : o.glowA); c.drawImage(tubeGlow(), -w / 2, -w / 2, w, w);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.drawImage(tubeSpr(), -w / 2, -w / 2, w, w);
    const s = TU * k, tr = TW * 0.5 * k;
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    // a broad moving highlight sliding round the tube
    const j0 = Math.floor((t * 38) % HN); c.globalAlpha = a * 0.55; c.strokeStyle = PEARL; c.lineWidth = Math.max(1, tr * 0.7); c.save(); c.translate(-tr * 0.2, -tr * 0.25); arcPath(c, s, j0, j0 + 11); c.stroke(); c.restore();
    // two (Celestial ornate: four) fine strands winding along the outline
    const NSd = o.ornate ? 4 : 2;
    for (let q = 0; q < NSd; q++) { c.beginPath(); for (let i = 0; i <= HN; i++) { const p = hp(i, s), n = HNRM[i % HN], off = tr * 0.95 * Math.sin(i / HN * TAU * 7 + t * 9 + q * Math.PI * (2 / NSd) * (q < 2 ? 1 : 0.5) + (q >= 2 ? 1.2 : 0)); i ? c.lineTo(p[0] + n[0] * off, p[1] + n[1] * off) : c.moveTo(p[0] + n[0] * off, p[1] + n[1] * off); }
      c.globalAlpha = a * (o.strandA || 0.6); c.strokeStyle = q >= 2 ? LAV : q ? BLOS : PEARL; c.lineWidth = Math.max(0.8, k * 2.2); c.stroke(); }
    if (o.ornate) { // a rose-gold inner outline and star glints at the lobes and the point
      c.globalAlpha = a * 0.75; c.strokeStyle = RGOLD; c.lineWidth = Math.max(1, k * 3.2); heartPath(c, s * 0.7, 0, s * 0.06); c.stroke(); c.strokeStyle = PEARL; c.lineWidth = Math.max(0.7, k * 1.2); c.stroke();
      const K = globalThis.LU1; for (const [i, z] of [[14, 1], [HN - 14, 1], [HHALF, 0.8]]) { const p = hp(i, s), tw = 0.75 + 0.25 * Math.sin(t * 11 + i); K.blitC(c, K.starSpr(PEARL), p[0], p[1] - tr * 0.3, s * 0.42 * z * tw, s * 0.42 * z * tw, a * 0.9, true); } }
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
  }

  /* ================= Honey Sugar Heart Attack ================= */
  S.honeyheart = (C, H) => {
    const K = globalThis.LU1; K.setH(H);
    const me = H.me, ev = evoOf(C), NH = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, a0 = C.a;
    const HT = 0.9, HSZ = 1.6 * HT * (1 + 0.05 * (ev - 1));          // heart height in tiles: 1.6H, growing moderately
    const MAXR = 7.5 * Math.max(1, C.K * 0.9), R0 = 1.75 * (1 + 0.04 * (ev - 1));
    const TOT = C.base * 2.5 * C.K * evoK(C), SH = NH === 1 ? [1] : NH === 2 ? [0.55, 0.55] : [0.36, 0.36, 0.44];
    const SIDES = NH === 1 ? [0.5] : NH === 2 ? [1, -1] : [1, -1, 0.35];
    const FORM = 0.42, GAP = 0.32, LAUNCH = 0.55;
    const B = K.bits(), rings = [];
    // targets: the aimed monster first, then the nearest ones ahead
    const ahead = H.sortNear(me.x, me.y).filter(m => { const d = Math.hypot(m.x - me.x, m.y - me.y); return d < MAXR && Math.abs(H.wrap(Math.atan2(m.y - me.y, m.x - me.x) - a0)) < 1.25; });
    const t0 = C.A && C.A.t && !C.A.t.dead ? C.A.t : null; if (t0) { const i = ahead.indexOf(t0); if (i > 0) ahead.splice(i, 1); if (i !== 0) ahead.unshift(t0); }
    const hearts = [];
    for (let i = 0; i < NH; i++) { const big = ev >= 7 && i === NH - 1, lat = NH === 1 ? 0 : (i % 2 ? -0.35 : 0.35) * (i === 2 ? 0 : 1);
      hearts.push({ i, tf: i * GAP, tl: i * GAP + LAUNCH, st: 'wait', side: SIDES[i], size: HSZ * (big ? 1.15 : 1), ornate: big, dmg: TOT * SH[i], R: R0 * (big ? 1.1 : 1), lat, tgt: ahead.length ? ahead[i % ahead.length] : null, hist: [], trav: 0 }); }
    H.X.sfx.hum();
    const startPt = h => { const d = 1.05 + h.size * 0.15; return [me.x + Math.cos(a0) * d - Math.sin(a0) * h.lat, me.y + Math.sin(a0) * d + Math.cos(a0) * h.lat]; };
    const zOf = h => h.size * 0.55 + 0.12;
    function boom(h) {
      h.st = 'boom'; h.tb = F.t; h.bx = h.px; h.by = h.py;
      H.hitArea(h.px, h.py, h.R, h.dmg, C.dmgO({ kb: 3 }));
      rings.push({ x: h.px, y: h.py, t0: F.t, R: h.R });
      H.X.light(h.px, h.py, h.R * 1.6, 0.3); H.X.shake(3.5 + h.i, 0.12); H.X.hitstop(0.03); H.X.sfx.crash(); H.X.sfx.sparkle && H.X.sfx.sparkle();
      // a puff of love hearts from the contact point: a few large slow tumblers, many small quick ones, rising as they slow
      const n = H.n(16 + 3 * NH); for (let q = 0; q < n; q++) { const b = Math.random() * TAU, big = q < 4, sp = big ? 1.4 + Math.random() * 1.2 : 2.5 + Math.random() * 3.5;
        B.add(h.px, h.py, zOf(h) * 0.5, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.6, vz: 1 + Math.random() * 2.2, g: -0.9, drag: big ? 1.8 : 3.2, life: big ? 0.9 + Math.random() * 0.35 : 0.45 + Math.random() * 0.4, s: big ? 0.2 + Math.random() * 0.07 : 0.08 + Math.random() * 0.06, kind: big || q % 3 ? 'h' : 's', col: [HOT, BLOS, CANDY, PEARL, ROSE][q % 5], rot: big ? 0.6 : 0.3 }); }
      H.burst(h.px, h.py - 0.4, 'spark', H.n(8), { v: 6, up: 2, g: 8, life: 0.3, size: 1.8, color: [PEARL, BLOS, HOT] });
    }
    const F = H.add({ life: (NH - 1) * GAP + LAUNCH + MAXR / 12 + 1.8, x: me.x, y: me.y,
      update(dt, f) {
        const t = f.t; B.step(dt); let alive = 0;
        for (const h of hearts) {
          if (h.st === 'wait' && t >= h.tf) { h.st = 'form'; [h.px, h.py] = startPt(h); if (h.i) H.X.sfx.hum(); }
          if (h.st === 'form') { [h.px, h.py] = startPt(h);
            if (Math.random() < dt * 30 * H.Q()) { const b = Math.random() * TAU, r = 0.6 + Math.random() * 0.6; B.add(h.px + Math.cos(b) * r, h.py + Math.sin(b) * r * 0.4, zOf(h) + Math.sin(b) * r * 0.7, { vx: -Math.cos(b) * r * 3, vy: -Math.sin(b) * r * 1.2, vz: -Math.sin(b) * r * 2, drag: 3.5, life: 0.32, s: 0.07, kind: Math.random() < 0.5 ? 's' : 'h', col: Math.random() < 0.5 ? BLOS : HOT }); }
            if (t >= h.tl) { // the push: the pet thrusts and the heart takes off
              h.st = 'fly'; h.bx = h.px; h.by = h.py; me.sq = 0.7; me.castT = me.castM = 0.35; H.X.sfx.whoosh();
              const tp = h.tgt && !h.tgt.dead ? [h.tgt.x, h.tgt.y] : [me.x + Math.cos(a0) * MAXR, me.y + Math.sin(a0) * MAXR];
              const dx = tp[0] - h.bx, dy = tp[1] - h.by, d = Math.hypot(dx, dy) || 1; h.hx = dx / d; h.hy = dy / d; h.D0 = Math.max(1.2, d); h.amp = Math.min(1.1, h.D0 * 0.2) * h.side; } }
          if (h.st === 'fly') { const tau = t - h.tl, v = 3 + 14 * sm(tau / 0.28);
            if (h.tgt && !h.tgt.dead && h.trav < h.D0 - 0.25) { const dx = h.tgt.x - h.bx, dy = h.tgt.y - h.by, d = Math.hypot(dx, dy) || 1, k = Math.min(1, dt * 5); h.hx = lerp(h.hx, dx / d, k); h.hy = lerp(h.hy, dy / d, k); const L = Math.hypot(h.hx, h.hy) || 1; h.hx /= L; h.hy /= L; h.D0 = h.trav + d; }
            h.bx += h.hx * v * dt; h.by += h.hy * v * dt; h.trav += v * dt;
            const pr = cl(h.trav / h.D0), off = h.amp * Math.sin(Math.PI * pr); h.bank = h.amp * Math.cos(Math.PI * pr) * (pr < 1 ? 0.5 : 0);
            h.px = h.bx - h.hy * off; h.py = h.by + h.hx * off;
            h.hist.push([h.px, h.py, zOf(h)]); if (h.hist.length > 9 + ev) h.hist.shift();
            if (Math.random() < dt * 16 * H.Q()) B.add(h.px - h.hx * 0.3, h.py - h.hy * 0.3, zOf(h) + (Math.random() - 0.5) * h.size * 0.8, { vx: -h.hx * 1.2 + (Math.random() - 0.5), vy: -h.hy * 1.2, vz: 0.4, drag: 2, life: 0.45 + Math.random() * 0.25, s: 0.07 + Math.random() * 0.04, kind: 's', col: Math.random() < 0.6 ? PEARL : BLOS });
            // the collision volume covers the whole silhouette (no slipping through its open centre)
            const hw = h.size * 0.55; let hit = H.living().some(m => Math.abs(m.x - h.px) < hw + m.r && Math.abs(m.y - h.py) < 0.5 + m.r);
            if (!hit && H.X.blocked(h.px, h.py, 0.3, 0)) hit = true;
            if (hit) boom(h); else if (h.trav > MAXR) { h.st = 'fade'; h.tb = t; } }
          if ((h.st === 'boom' && t - h.tb > 0.85) || (h.st === 'fade' && t - h.tb > 0.4)) h.st = 'done';
          if (h.st !== 'done') alive++;
        }
        if (!alive && !B.L.length && f.life > 0.05) f.life = 0.05;
      },
      drawUnder(c, f, X, Y, T) { const t = f.t;
        for (const h of hearts) if (h.st === 'form' || h.st === 'fly') floorGlow(H, c, H.sx(h.px), H.sy(h.py), T * h.size * 0.55, HOT, 0.32 * (h.st === 'fly' ? 1 : cl((t - h.tf) / FORM)));
        for (const r of rings) { const u = (t - r.t0) / 0.55; if (u < 0 || u > 1) continue; const e = H.ease.out(u), x = H.sx(r.x), y = H.sy(r.y), rr = T * r.R * (0.25 + 0.85 * e);
          blit(c, ringSpr(), x, y, rr * 2, rr * 2 * H.GY, (1 - u) * 1.1, true); floorGlow(H, c, x, y, T * r.R * 0.9, HOT, 0.5 * (1 - u));
          const hs = T * r.R * (0.6 + 0.9 * e); blit(c, K.lineSpr(), x, y + hs * 0.05, hs, hs * H.GY * 1.05, (1 - u) * 0.85, true); } },
      draw(c, f, X, Y, T) { const t = f.t;
        for (const h of hearts) {
          if (h.st === 'wait' || h.st === 'done') continue;
          const hpx = T * h.size, k = hpx / THGT, sx = H.sx(h.px), sy = H.sy(h.py) - zOf(h) * T, dim = petDim(H, sx, sy, hpx * 0.6);
          // ribbon trails from the lower curves, and the stars peel off behind (particles)
          if (h.hist.length > 2 && (h.st === 'fly' || h.st === 'boom')) { const ta = h.st === 'boom' ? 1 - cl((t - h.tb) / 0.3) : 1;
            for (const sd of [-1, 1]) { const lp = hp(HHALF + sd * 13, TU * k), pts = h.hist.map(p => [H.sx(p[0]) + lp[0], H.sy(p[1]) - p[2] * T + lp[1]]); if (h.st === 'fly') pts.push([sx + lp[0], sy + lp[1]]);
              taper(c, pts, T * 0.16, HOT, 0.5 * ta * dim); taper(c, pts, T * 0.06, PEARL, 0.75 * ta * dim); } }
          c.save(); c.translate(sx, sy);
          if (h.st === 'form') { const u = cl((t - h.tf) / FORM), s = TU * k, wk = 0.45 + 0.55 * u;
            c.lineCap = 'round'; c.lineJoin = 'round';
            if (u < 1) { const kk = Math.max(1, Math.round(HHALF * sm(u))); const sub = () => arcPath(c, s, HHALF - kk, HHALF + kk);
              glow(c, 0, 0, hpx * 0.7 * u, HOT, 0.25 * dim);
              for (const [col, lw, al, add] of [[HOT, TW * 1.8, 0.18, 1], [DEEPP, TW, 0.95, 0], [HOT, TW * 0.78, 0.9, 0], [BLOS, TW * 0.4, 0.8, 0], [PEARL, TW * 0.15, 1, 0]]) { c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = al * dim; c.strokeStyle = col; c.lineWidth = lw * k * wk; sub(); c.stroke(); }
              c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
              for (const sd of [-1, 1]) { const p = hp(HHALF + sd * kk, s); glow(c, p[0], p[1], T * 0.35, HOT, 0.6 * dim); glow(c, p[0], p[1], T * 0.13, PEARL, 0.95 * dim); } }
            else { const tc = t - h.tf - FORM, pul = 1 + 0.13 * Math.exp(-7 * tc) * Math.sin(tc * 24); c.scale(pul, 2 - pul); drawTube(c, k, dim, t, { ornate: h.ornate, strandA: 0.45 + 0.04 * ev }); glow(c, 0, 0, hpx * 0.5, PEARL, 0.35 * Math.exp(-6 * tc) * dim); } }
          else if (h.st === 'fly') { const bank = h.bank || 0; c.rotate(bank * 0.32); c.scale(Math.cos(bank * 0.9), 1); drawTube(c, k, dim, t, { side: Math.sin(bank * 0.9) * hpx * 0.09, ornate: h.ornate, strandA: 0.45 + 0.04 * ev }); }
          else if (h.st === 'fade') { const u = cl((t - h.tb) / 0.4); c.scale(1 + 0.2 * u, 1 + 0.2 * u); drawTube(c, k, (1 - u) * dim, t, { ornate: h.ornate, glowA: 1 - u }); }
          else if (h.st === 'boom') { const tb = t - h.tb, s = TU * k, tr = TW * 0.5 * k;
            if (tb < 0.18) { const p = Math.sin(cl(tb / 0.18) * Math.PI); c.save(); c.translate(0, hpx * 0.12 * p); c.scale(1 + 0.16 * p, 1 - 0.2 * p); c.translate(0, -hpx * 0.12 * p); drawTube(c, k, dim, t, { ornate: h.ornate });
              // bright cracks racing round the tube from the contact point (the lower tip)
              const q = cl((tb - 0.02) / 0.14), kk = Math.round(HHALF * q); if (kk > 1) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
                for (const [col, lw, al] of [[HOT, tr * 1.6, 0.5], [PEARL, Math.max(1, tr * 0.45), 1]]) { c.strokeStyle = col; c.lineWidth = lw; c.globalAlpha = al * dim; arcPath(c, s, HHALF - kk, HHALF + kk, tr * 1.1, h.i * 7); c.stroke(); } c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
              c.restore(); }
            else { // curved luminous fragments fly apart, tumble and fade
              const u = cl((tb - 0.18) / 0.62), e = H.ease.out(u), NF = 7 + (h.ornate ? 2 : 0); c.lineCap = 'round'; c.lineJoin = 'round';
              for (let j = 0; j < NF; j++) { const i0 = Math.round(j * HN / NF) + 1, i1 = Math.round((j + 1) * HN / NF) - 1, mid = hp((i0 + i1) >> 1, s), dl = Math.hypot(mid[0], mid[1]) || 1, sp = 0.55 + 0.35 * R1(j + h.i * 3);
                c.save(); c.translate(mid[0] / dl * hpx * sp * e, mid[1] / dl * hpx * sp * e + hpx * 0.35 * u * u); c.translate(mid[0], mid[1]); c.rotate((R1(j * 2.3 + h.i) - 0.5) * 3 * e); c.translate(-mid[0], -mid[1]);
                const fa = Math.pow(1 - u, 1.3) * dim, wsh = 1 - 0.55 * u;
                for (const [col, lw, al, add] of [[HOT, TW * 1.6, 0.25, 1], [DEEPP, TW, 1, 0], [HOT, TW * 0.75, 1, 0], [PEARL, TW * 0.22, 1, 1]]) { c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = al * fa; c.strokeStyle = col; c.lineWidth = lw * k * wsh; arcPath(c, s, i0, i1); c.stroke(); }
                c.restore(); }
              c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
            // the contact core and its larger soft halo
            const hu = cl(tb / 0.5); glow(c, 0, hpx * 0.3, T * h.R * (0.6 + 0.5 * hu), HOT, 0.55 * (1 - hu) * dim); glow(c, 0, hpx * 0.3, T * 0.55 * (1 - hu * 0.6), PEARL, Math.max(0, 1 - tb / 0.28) * dim);
            if (tb < 0.25) K.blitC(c, K.starSpr(PEARL), 0, hpx * 0.3, T * (0.7 + 1.6 * tb / 0.25), T * (0.7 + 1.6 * tb / 0.25), (1 - tb / 0.25) * dim, true); }
          c.restore();
        }
        B.draw(c, T);
      } });
  };

  /* ================= Luv Me Luv Me Chain ================= */
  S.luvchain = (C, H) => {
    const K = globalThis.LU1; K.setH(H);
    const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, rk = (ev - 1) / 6, a0 = C.a;
    // reach: 2H / 2.6H / 3.3H (H = 0.9 tile), x1.2 for the arena; continuous between
    const HT = 0.9, REACH = (ev <= 4 ? lerp(2, 2.6, (ev - 1) / 3) : lerp(2.6, 3.3, (ev - 4) / 3)) * HT * 1.2;
    const SP0 = 0.2, NL = Math.ceil(REACH / SP0);
    const ALL = [[-1.15, 1.15, 'h'], [1.15, -1.15, 'h'], [-1.05, 0.45, 'd'], [1.25, -1.25, 'h'], [-1.75, 1.75, 'w']];
    const LASH = ALL.slice(0, tier === 3 ? 5 : tier === 2 ? 3 : 2), NLs = LASH.length;
    const D = lerp(0.32, 0.26, rk), G = lerp(0.16, 0.1, rk), W = 0.42, LAG = 0.4;
    LASH.forEach((l, k) => { l.t0 = W + k * (D + G); l.hits = new Set(); });
    const END = LASH[NLs - 1].t0 + D, REC = 0.3, RET = 0.42, SPIN = 0.32, LIFE = END + REC + RET + SPIN + 0.5;
    const TOT = C.base * 2.5 * C.K * evoK(C) * (1 + 0.08 * (NLs - 2)), WS = LASH.map((l, k) => (k === NLs - 1 ? 1.3 : 1)), WSUM = WS.reduce((p, q) => p + q, 0);
    const B = K.bits(), slashes = [], tipH = [];
    const easeS = u => { u = cl(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
    const FORMA = -2.4;   // the chain trails behind before the first swing
    /* the angle (relative to the aim) of the chain at fraction u along it, at time t: each lash sweeps from the root,
       the tip starting later and finishing with the root (so it moves fastest); between lashes it eases to the next start */
    function angU(u, t) {
      for (let k = 0; k < NLs; k++) { const l = LASH[k], s = l.t0 + LAG * D * u, e = l.t0 + D;
        if (t < s) { if (k === 0) return lerp(FORMA, l[0], sm((t - 0.12 - 0.1 * u) / (s - 0.12))); const pe = LASH[k - 1].t0 + D; return lerp(LASH[k - 1][1], l[0], sm((t - pe) / Math.max(0.01, s - pe))); }
        if (t <= e) return lerp(l[0], l[1], easeS((t - s) / Math.max(0.01, e - s))); }
      const q = sm((t - END - 0.03 * u) / REC), last = LASH[NLs - 1][1]; return lerp(last, last * 0.35, q) + 0.5 * Math.sin(Math.PI * u) * q * Math.sign(last || 1);
    }
    function lashAt(t) { for (let k = 0; k < NLs; k++) { const l = LASH[k]; if (t >= l.t0 - 0.02 && t <= l.t0 + D + 0.04) return k; } return -1; }
    function zTip(t) { const k = lashAt(t); if (k >= 0 && LASH[k][2] === 'd') { const u = cl((t - LASH[k].t0) / D); return lerp(1.7, 0.15, easeS(u)); }
      for (let j = 0; j < NLs; j++) if (LASH[j][2] === 'd' && t > LASH[j].t0 - G && t < LASH[j].t0) return lerp(0.35, 1.7, sm((t - LASH[j].t0 + G) / G));
      if (t > END) return lerp(0.35, 0.75, sm((t - END) / REC)); return 0.35; }
    function tension(t) { const k = lashAt(t); return k < 0 ? 0 : Math.sin(Math.PI * cl((t - LASH[k].t0) / (D + 0.04))); }
    // visible links: unspooled from the casting heart, then drawn back into it
    const extent = t => (t < W ? H.ease.out(cl((t - 0.06) / (W - 0.1))) : t < END + REC ? 1 : 1 - sm((t - END - REC) / RET));
    const root = () => [me.x + Math.cos(a0) * 0.32, me.y + Math.sin(a0) * 0.32];
    const Z0 = 0.5;
    function chain(t) { const [rx, ry] = root(), zt = zTip(t), tn = tension(t), sp = SP0 * (0.88 + 0.14 * tn), sag = 0.2 * (1 - tn), pts = [[rx, ry, Z0]]; let x = rx, y = ry;
      for (let k = 1; k <= NL; k++) { const u = k / NL, th = a0 + angU(u, t); x += Math.cos(th) * sp; y += Math.sin(th) * sp; pts.push([x, y, Math.max(0.06, lerp(Z0, zt, u) - sag * Math.sin(Math.PI * u))]); } return pts; }
    const segD = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1, q = cl(((px - a[0]) * dx + (py - a[1]) * dy) / L2); return Math.hypot(px - a[0] - dx * q, py - a[1] - dy * q); };
    H.X.sfx.hum();
    let fired = -1;
    const F = H.add({ life: LIFE, x: me.x, y: me.y, spin: 0, lastTip: null,
      update(dt, f) {
        const t = f.t; B.step(dt);
        for (let i = slashes.length - 1; i >= 0; i--) if (t - slashes[i].t > 0.32) slashes.splice(i, 1);
        // a lash begins: the pet twists into it
        for (let k = fired + 1; k < NLs; k++) if (t >= LASH[k].t0) { fired = k; me.sq = 0.78; me.castT = me.castM = 0.3; H.X.sfx.whoosh(); }
        // the swept damage volume: sub-stepped along the chain's analytic motion, one hit per monster per lash
        const ns = Math.max(1, Math.ceil(dt / 0.008));
        for (let j = 1; j <= ns; j++) { const ts = t - dt + dt * j / ns, k = lashAt(ts); if (k < 0) continue; const l = LASH[k], pts = chain(ts), nv = Math.floor(NL * extent(ts));
          for (const m of H.living()) { if (l.hits.has(m)) continue; let best = 1e9, bi = 0; for (let q = 1; q <= nv; q++) { if (pts[q][2] > 1.3) continue; const d = segD(m.x, m.y, pts[q - 1], pts[q]); if (d < best) { best = d; bi = q; } }
            if (best < 0.3 + m.r) { l.hits.add(m); H.X.hitMon(m, TOT * WS[k] / WSUM, C.dmgO({ kb: 1.5 }));
              const p1 = pts[bi], pv = chain(ts - 0.02)[bi], mv = Math.atan2((p1[1] - pv[1]) * H.GY, p1[0] - pv[0]);
              slashes.push({ x: m.x, y: m.y, a: mv, t, big: k === NLs - 1 });
              const n = H.n(6 + tier); for (let q = 0; q < n; q++) { const b = Math.random() * TAU, sp = 2 + Math.random() * 3; B.add(m.x, m.y, 0.45, { vx: Math.cos(b) * sp, vy: Math.sin(b) * sp * 0.6, vz: 1.2 + Math.random() * 2, g: -0.6, drag: 3, life: 0.45 + Math.random() * 0.35, s: q < 2 ? 0.17 : 0.09 + Math.random() * 0.05, kind: q % 4 === 3 ? 's' : 'h', col: [HOT, BLOS, PEARL, CANDY][q % 4], rot: 0.5 }); }
              H.X.light(m.x, m.y, 1.6, 0.18); H.X.sfx.sparkle && H.X.sfx.sparkle(); H.X.shake(k === NLs - 1 ? 3.5 : 2, 0.08); if (k === NLs - 1) H.X.hitstop(0.03); } } }
        // the tip's recent path (for its trail) and its spin
        const pts = chain(t), nv = NL * extent(t), ti = Math.max(1, Math.min(NL, Math.round(nv))), tp = pts[ti];
        tipH.push([tp[0], tp[1], tp[2], t]); while (tipH.length && t - tipH[0][3] > 0.16) tipH.shift();
        if (f.lastTip) { const v = Math.hypot(tp[0] - f.lastTip[0], tp[1] - f.lastTip[1]) / Math.max(dt, 1e-3); f.spin += dt * (2.5 + v * 0.5); f.tipV = v; } f.lastTip = tp;
        if (t > END + REC + RET && t < END + REC + RET + SPIN) f.spin += dt * TAU / SPIN;
        if (!f.gone && t > END + REC + RET + SPIN * 0.8) { f.gone = true; const [rx, ry] = root(); const n = H.n(12); for (let q = 0; q < n; q++) { const b = q / n * TAU; B.add(rx, ry, Z0, { vx: Math.cos(b) * 1.6, vy: Math.sin(b) * 0.9, vz: 0.6 + Math.random() * 1.2, g: -0.5, drag: 2, life: 0.6 + Math.random() * 0.3, s: q % 3 ? 0.08 : 0.15, kind: q % 2 ? 'h' : 's', col: q % 3 ? HOT : PEARL }); } H.X.sfx.sparkle && H.X.sfx.sparkle(); }
        if (Math.random() < dt * 10 * H.Q() && (f.tipV || 0) > 6) B.add(tp[0], tp[1], tp[2], { vx: (Math.random() - 0.5), vy: (Math.random() - 0.5) * 0.5, vz: 0.3, life: 0.4, s: 0.07, kind: 's', col: Math.random() < 0.5 ? PEARL : BLOS, drag: 2 });
      },
      drawUnder(c, f, X, Y, T) { const t = f.t; // pink ground light under the tip's sweep
        for (let i = 0; i < tipH.length; i += 2) { const p = tipH[i], u = (t - p[3]) / 0.16; floorGlow(H, c, H.sx(p[0]), H.sy(p[1]), T * 0.6, HOT, 0.22 * (1 - u) * cl(1.2 - p[2] * 0.5)); } },
      draw(c, f, X, Y, T) {
        const t = f.t, pts = chain(t), ex = extent(t), nv = NL * ex, fin = cl((t - END - REC - RET - SPIN * 0.6) / 0.35), A = cl(t / 0.12) * (1 - fin);
        const S2 = pts.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]);
        const lk = lashAt(t), wave = lk >= 0 ? (t - LASH[lk].t0) / (D * 0.75) : -9;
        c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
        // the tip's trail: brightest where it whips fastest
        if (tipH.length > 2) { const tr = tipH.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]), sp = cl(((f.tipV || 0) - 4) / 14);
          taper(c, tr, T * (0.1 + 0.14 * sp), HOT, (0.22 + 0.33 * sp) * A); taper(c, tr, T * (0.03 + 0.04 * sp), PEARL, (0.3 + 0.45 * sp) * A);
          if (tier >= 2) { const tr2 = tipH.map((p, i) => [H.sx(p[0]), H.sy(p[1]) - p[2] * T + Math.sin(i * 1.3 + t * 20) * T * 0.08]); taper(c, tr2, T * 0.03, LAV, 0.5 * rk * A); } }
        // the links: face-on and edge-on in turn so they interlock; a pulse of light runs from the root to the tip
        const L = T * SP0 * 1.55, lf = linkSpr(), le = linkEdge(), NV = Math.min(NL, Math.ceil(nv));
        for (let k = 1; k <= NV; k++) { const p = S2[k], pa = S2[k - 1], pb = S2[Math.min(NL, k + 1)], ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]), u = k / NL, part = cl(nv - k + 1);
          const la = A * part * petDim(H, p[0], p[1], T * 0.5) * (0.55 + 0.45 * sm((k * SP0) / 0.5));
          glow(c, p[0], p[1], L * 0.75, HOT, 0.22 * la);
          c.save(); c.translate(p[0], p[1]); c.rotate(ang - Math.PI / 2); c.globalAlpha = la; const sc = L / (LU * 1.71), hS = LS * sc, wS = hS * (k % 2 ? 1 : 0.36); c.drawImage(k % 2 ? lf : le, -wS / 2, -hS / 2, wS, hS); c.restore();
          const wv = Math.exp(-Math.pow((u - wave) / 0.14, 2)); if (wv > 0.03) glow(c, p[0], p[1], L * 0.6, PEARL, 0.7 * wv * la); }
        // Celestial (and richer as it grows): a rose-gold filament woven along the chain
        if (rk > 0.1 && NV > 2) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = RGOLD; c.lineWidth = Math.max(0.8, T * 0.02); c.globalAlpha = 0.6 * rk * A; c.beginPath(); for (let k = 0; k <= NV; k++) { const p = S2[k], o = Math.sin(k * 1.6 + t * 12) * T * 0.07; k ? c.lineTo(p[0], p[1] + o) : c.moveTo(p[0], p[1] + o); } c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
        // the terminal charm: a larger thick heart with a short trailing ribbon
        if (nv > 0.3) { const fi = Math.min(nv, NL), i0 = Math.floor(fi), q = fi - i0, a = S2[Math.max(0, i0)], b = S2[Math.min(NL, i0 + 1)], cx = lerp(a[0], b[0], q), cy = lerp(a[1], b[1], q), ch = T * (0.42 + 0.1 * rk) * (0.5 + 0.5 * cl(nv / 2));
          if (tipH.length > 2) { const rb = tipH.slice(-7).map((p, i) => [H.sx(p[0]) + Math.sin(t * 14 + i) * T * 0.05, H.sy(p[1]) - p[2] * T + ch * 0.35]); rb.push([cx, cy + ch * 0.35]); taper(c, rb, T * 0.09, BLOS, 0.7 * A); taper(c, rb, T * 0.03, PEARL, 0.8 * A); }
          K.thickHeart(c, cx, cy + ch * 0.15, ch, f.spin, 0.25 * Math.sin(t * 6), A * petDim(H, cx, cy, ch), lk >= 0 ? 0.35 * tension(t) : 0, tier >= 2 ? (t * 0.8) % 1 : null);
          glow(c, cx, cy, ch * 0.9, PEARL, 0.25 * A * tension(t)); }
        // the casting heart at the root: it unspools the chain and takes it back
        { const rp = S2[0], ca = cl(t / 0.15) * (1 - fin), rs = T * 0.3 * (0.6 + 0.4 * H.ease.back(cl(t / 0.25))); if (ca > 0.02) { glow(c, rp[0], rp[1], rs * 1.4, HOT, 0.35 * ca); K.thickHeart(c, rp[0], rp[1], rs, t * 3, 0, ca * petDim(H, rp[0], rp[1], rs) * 0.9, (t > END + REC && t < END + REC + RET) ? 0.4 : 0, null); } }
        // contact slashes: a thin pink crescent across the motion, and a quick pearly star flash
        c.globalCompositeOperation = 'lighter';
        for (const s of slashes) { const u = (t - s.t) / 0.32, x = H.sx(s.x), y = H.sy(s.y) - T * 0.45, r = T * (s.big ? 0.85 : 0.65) * (0.8 + 0.4 * u), sa = 1 - u;
          c.save(); c.translate(x, y); c.rotate(s.a); c.beginPath(); c.arc(0, 0, r, -1.1, 1.1); c.arc(-r * 0.22, 0, r * 0.93, 1.05, -1.05, true); c.closePath(); c.globalAlpha = 0.85 * sa; c.fillStyle = HOT; c.fill();
          c.beginPath(); c.arc(0, 0, r * 0.98, -0.85, 0.85); c.arc(-r * 0.1, 0, r * 0.93, 0.8, -0.8, true); c.closePath(); c.globalAlpha = sa; c.fillStyle = PEARL; c.fill(); c.restore();
          glow(c, x, y, T * 0.6, HOT, 0.45 * sa); if (u < 0.45) K.blitC(c, K.starSpr(PEARL), x, y, T * (0.5 + 1.2 * u), T * (0.5 + 1.2 * u), 1 - u / 0.45, true); }
        c.restore();
        B.draw(c, T);
      } });
  };
})();
