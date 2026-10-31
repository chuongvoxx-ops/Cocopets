/* ---------- Water, reworked: Lotus Bloom, Aqua Rhapsody ----------
   Lotus Bloom: a ripple spreads round the pet and water rises from its rim into a closed lotus that turns where it was
   cast (it stays there if the pet walks away). Its petals are shaded water strips (a thick turquoise base, a
   translucent sapphire body, a luminous aqua rim, highlights flowing base to tip); they unfold one after another in a
   slight spiral, flare and burst: an aqua pressure ring races over the floor under a crown of splashes, then ribbons of
   water gather back into the heart and rebuild the petals while it keeps turning. 3 bursts at Hatchling, 4 at Adept,
   6 at Celestial (an accelerating rhythm; before the sixth the petals draw in, the turn slows, the heart blazes, then
   the largest bloom and the biggest burst, the greatest single hit). Extra petal layers (2 at Adept, 3 at Celestial)
   turn at their own speeds.
   Aqua Rhapsody: a calm healing aura that follows the pet: a blue glow and water sheen on the floor with ripples,
   luminous strings rising into undulating rings round it, glowing notes riding them and lifting away, bubbles; every
   second a soft ring flows in to the pet, the strings brighten, a few notes drift in and dissolve and the pet heals
   (40% of its max HP over 8 s at Hatchling .. 70% over 16 s at Celestial; no lump at the end), with a gentle ripple
   that touches nearby monsters. On the last tick the strings lift into a dome, the notes rise and it fades to light.
   Everything heavy is a cached sprite (petal frames, splash spouts, the floor band, bubbles, notes, the sheen). */
(() => {
  const U = ELEM_IMPL.water.ult, TAU = Math.PI * 2;
  let H, K;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const W = { white: '#FFFFFF', foam: '#E8FFFF', aqua: '#5FF0FF', turq: '#2FD4D0', blue: '#2C7BE0', sapph: '#1450B4', abyss: '#0A2A66', pearl: '#D8C8FF' };
  const sfx = (k) => { const S = H.X.sfx; if (S && S[k]) S[k](); };
  /* the pet's body on the screen, and a clip that keeps everything after it off the pet */
  function petHole(c, T) { const me = H.me, x = H.sx(me.x), y = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(x, y, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd'); }
  const glow = (c, x, y, r, col, a) => { if (r < 1 || !(a > 0.01)) return; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); };

  /* ---- cached sprites ---- */
  /* a petal of shaped water, base at (32,156), tip at (36,6); frame ph carries two highlights flowing base to tip */
  const NPH = 10;
  const petPath = g => { g.beginPath(); g.moveTo(32, 156); g.bezierCurveTo(6, 128, 0, 60, 36, 5); g.bezierCurveTo(60, 56, 62, 126, 32, 156); g.closePath(); };
  const petSpr = ph => fxSprite('wu2pet' + ph, 96, 184, g => {
    g.translate(16, 12); g.lineJoin = 'round';
    for (const [lw, a] of [[22, 0.05], [15, 0.07], [9, 0.1], [5, 0.14]]) { petPath(g); g.strokeStyle = `rgba(95,240,255,${a})`; g.lineWidth = lw; g.stroke(); }
    petPath(g); let gr = g.createLinearGradient(0, 156, 0, 5);
    [[0, 'rgba(47,212,208,0.97)'], [0.16, 'rgba(36,170,205,0.8)'], [0.42, 'rgba(20,80,180,0.45)'], [0.78, 'rgba(44,123,224,0.42)'], [1, 'rgba(150,245,255,0.75)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fill();
    g.save(); petPath(g); g.clip();
    gr = g.createLinearGradient(2, 0, 62, 0); gr.addColorStop(0, 'rgba(170,250,255,0.32)'); gr.addColorStop(0.45, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(10,42,102,0.4)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 160);
    gr = g.createRadialGradient(32, 160, 0, 32, 160, 56); gr.addColorStop(0, 'rgba(70,235,215,0.85)'); gr.addColorStop(0.6, 'rgba(47,212,208,0.3)'); gr.addColorStop(1, 'rgba(47,212,208,0)'); g.fillStyle = gr; g.fillRect(0, 90, 64, 70);
    g.globalCompositeOperation = 'lighter';
    for (const q of [ph / NPH, (ph / NPH + 0.5) % 1]) { const yy = 150 - q * 140, r = 16 + 10 * q; gr = g.createRadialGradient(30 + q * 5, yy, 0, 30 + q * 5, yy, r); gr.addColorStop(0, 'rgba(220,255,255,0.7)'); gr.addColorStop(0.4, 'rgba(95,240,255,0.3)'); gr.addColorStop(1, 'rgba(95,240,255,0)'); g.fillStyle = gr; g.fillRect(0, yy - r, 64, r * 2); }
    g.strokeStyle = 'rgba(255,255,255,0.32)'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(31, 148); g.quadraticCurveTo(24, 80, 35, 14); g.stroke();
    g.restore();
    petPath(g); g.lineJoin = 'round'; g.strokeStyle = 'rgba(95,240,255,0.95)'; g.lineWidth = 2; g.stroke();
    g.beginPath(); g.moveTo(32, 156); g.bezierCurveTo(6, 128, 0, 60, 36, 5); g.strokeStyle = 'rgba(255,255,255,0.6)'; g.lineWidth = 1; g.stroke(); });
  /* a splash spout: a narrow column of water, a rounded foaming head; base (16,124), head (16,6) */
  const spoutSpr = () => fxSprite('wu2spout', 32, 128, g => {
    const path = () => { g.beginPath(); g.moveTo(6, 124); g.quadraticCurveTo(9, 50, 11, 16); g.arc(16, 13, 6, Math.PI, 0); g.quadraticCurveTo(23, 50, 26, 124); g.closePath(); };
    path(); const gr = g.createLinearGradient(0, 124, 0, 6); gr.addColorStop(0, 'rgba(47,212,208,0)'); gr.addColorStop(0.25, 'rgba(36,150,215,0.5)'); gr.addColorStop(0.7, 'rgba(60,170,235,0.55)'); gr.addColorStop(1, 'rgba(200,255,255,0.9)'); g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(95,240,255,0.8)'; g.lineWidth = 1.5; g.stroke();
    g.globalCompositeOperation = 'lighter'; const gf = g.createRadialGradient(16, 12, 0, 16, 12, 10); gf.addColorStop(0, 'rgba(255,255,255,1)'); gf.addColorStop(0.5, 'rgba(232,255,255,0.6)'); gf.addColorStop(1, 'rgba(232,255,255,0)'); g.fillStyle = gf; g.fillRect(4, 0, 24, 24); });
  /* a band round a circle: clear inside, a translucent turquoise body, a bright aqua leading edge with a white line */
  const bandSpr = () => fxSprite('wu2band', 256, 256, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(20,80,180,0)'], [0.5, 'rgba(20,80,180,0)'], [0.68, 'rgba(20,80,180,0.18)'], [0.82, 'rgba(47,212,208,0.45)'], [0.91, 'rgba(95,240,255,0.85)'], [0.955, 'rgba(255,255,255,1)'], [0.98, 'rgba(200,255,255,0.4)'], [1, 'rgba(200,255,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* a pool of water light on the floor */
  const poolSpr = () => fxSprite('wu2pool', 128, 128, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0);
    [[0, 'rgba(150,245,255,0.6)'], [0.3, 'rgba(47,212,208,0.45)'], [0.65, 'rgba(20,80,180,0.3)'], [1, 'rgba(20,80,180,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  /* a water sheen seen from above: caustic arcs of light round a centre (squashed and turned when drawn) */
  const sheenSpr = () => fxSprite('wu2sheen', 192, 192, (g, w) => { const c0 = w / 2; g.translate(c0, c0); g.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const r = c0 * (0.2 + 0.75 * R1(i * 3.1)), a0 = R1(i * 7.7) * TAU, L = 0.3 + 0.6 * R1(i * 1.3); g.strokeStyle = i % 3 ? 'rgba(95,240,255,0.35)' : 'rgba(232,255,255,0.55)'; g.lineWidth = 1.2 + 2.2 * R1(i * 5.3); g.beginPath(); g.arc(0, 0, r, a0, a0 + L); g.stroke(); }
    g.globalCompositeOperation = 'destination-in'; const gr = g.createRadialGradient(0, 0, 0, 0, 0, c0); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.7, 'rgba(0,0,0,0.8)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(-c0, -c0, w, w); });
  /* a bubble: a clear centre, a pearlescent rim, a specular dot */
  const bubSpr = () => fxSprite('wu2bub', 32, 32, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0 - 1);
    [[0, 'rgba(150,240,255,0.04)'], [0.62, 'rgba(120,225,255,0.1)'], [0.84, 'rgba(110,230,255,0.5)'], [0.94, 'rgba(240,255,255,0.9)'], [1, 'rgba(240,255,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(216,200,255,0.55)'; g.beginPath(); g.arc(c0, c0, c0 - 3, 0.2, 1.5); g.stroke(); g.strokeStyle = 'rgba(255,215,240,0.35)'; g.beginPath(); g.arc(c0, c0, c0 - 3, 1.5, 2.4); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(c0 - 5, c0 - 6, 3, 2, -0.6, 0, TAU); g.fill(); });
  /* glowing musical notes: an eighth note and a beamed pair, white with aqua edges in an aqua halo */
  const noteSpr = v => fxSprite('wu2note' + v, 48, 48, g => {
    const gr = g.createRadialGradient(24, 26, 0, 24, 26, 24); gr.addColorStop(0, 'rgba(95,240,255,0.55)'); gr.addColorStop(0.5, 'rgba(47,212,208,0.2)'); gr.addColorStop(1, 'rgba(47,212,208,0)'); g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    const shape = () => { g.beginPath(); if (v === 0) { g.ellipse(18, 35, 6.5, 4.6, -0.45, 0, TAU); g.moveTo(23.5, 34); g.lineTo(23.5, 9); g.moveTo(23.5, 9); g.bezierCurveTo(28, 14, 34, 16, 31, 27); }
      else { g.ellipse(13, 37, 5.6, 4, -0.45, 0, TAU); g.moveTo(32, 33); g.ellipse(30, 33, 5.6, 4, -0.45, 0, TAU); g.moveTo(17.8, 36); g.lineTo(17.8, 12); g.moveTo(34.8, 32); g.lineTo(34.8, 8); } };
    const beam = () => { if (v === 1) { g.beginPath(); g.moveTo(17.8, 11); g.lineTo(34.8, 7); g.lineTo(34.8, 12); g.lineTo(17.8, 16); g.closePath(); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    shape(); g.strokeStyle = 'rgba(95,240,255,0.9)'; g.lineWidth = 5; g.stroke(); beam(); if (v === 1) { g.lineWidth = 4; g.stroke(); }
    shape(); g.fillStyle = '#FFFFFF'; g.fill(); g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.2; g.stroke(); beam(); if (v === 1) { g.fill(); } });
  /* draw a sprite whose base point (bx, by) in sprite px runs from screen (x0, y0) to (x1, y1), w px wide */
  function strip(c, spr, ax, ay, len, x0, y0, x1, y1, w, a) { const L = Math.hypot(x1 - x0, y1 - y0); if (L < 2 || !(a > 0.01) || w < 0.5) return;
    c.save(); c.translate(x0, y0); c.rotate(Math.atan2(y1 - y0, x1 - x0) + Math.PI / 2); c.scale(w / spr.width, L / len); c.globalAlpha = Math.min(1, a); c.drawImage(spr, -ax, -ay); c.restore(); }
  const drawBub = (c, x, y, r, a) => { if (r < 0.8 || !(a > 0.01)) return; c.globalAlpha = Math.min(1, a); c.drawImage(bubSpr(), x - r, y - r, r * 2, r * 2); };

  /* ================= Lotus Bloom ================= */
  U.lotusbloom = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, cx = me.x, cy = me.y, ev = K.evo(C), NB = K.lv(C, [3, 4, 6]), NL = K.lv(C, [1, 2, 3]), R = (2.2 + 0.1 * (ev - 1)) * (C.K > 1 ? 1.08 : 1), six = NB === 6;
    /* the bursts: an accelerating rhythm; the sixth after a held breath */
    const B = []; let tb = 1.75; for (let k = 0; k < NB; k++) { B.push(tb); tb += six && k === NB - 2 ? 2.0 : Math.max(0.85, 1.5 - 0.17 * k); }
    const LIFE = B[NB - 1] + 1.3;
    const wts = B.map((_, k) => six && k === 5 ? 2.6 : 1 + 0.07 * k), ws = wts.reduce((a, b) => a + b, 0), TOT = C.base * 14 * C.K * K.evoK(C);
    const LAY = [{ n: 8, len: 0.95, w: 0.62, rb: 0.16, phi: 1, sp: 1, off: 0 }, { n: 8, len: 0.72, w: 0.5, rb: 0.1, phi: 0.8, sp: -0.7, off: 0.39 }, { n: 6, len: 0.5, w: 0.38, rb: 0.05, phi: 0.6, sp: 1.45, off: 0.2 }].slice(0, NL);
    H.X.banner('LOTUS BLOOM', '', C.col, 1.6); sfx('bubble');
    /* the petals' state at time t: open (0 closed bud .. 1 bloomed .. 1.35 flared), len, alpha, size, the heart's glow */
    function pst(t) {
      let k = 0; while (k < NB && B[k] <= t) k++;
      if (k >= NB) { const pb = t - B[NB - 1]; return { open: 1.35 + pb * 0.3, len: Math.max(0, 1 - pb / 0.8) * (six ? 1.4 : 1), al: Math.max(0, 1 - pb / 0.9), sz: six ? 1.4 : 1, gl: Math.max(0, 1 - pb / 0.5) }; }
      const e = B[k];
      if (k === 0) { const len = H.ease.out(cl((t - 0.45) / 0.6)), u = cl((t - 1.0) / (e - 1.12)); let open = H.ease.io(u); if (t > e - 0.12) open = 1 + 0.3 * cl((t - e + 0.12) / 0.12); return { open, len, al: cl((t - 0.45) / 0.3), sz: 1, gl: 0.2 + 0.8 * u * u * u }; }
      const s = B[k - 1], u = (t - s) / (e - s);
      if (six && k === 5) { // the held breath before the sixth
        const v = u / 0.3, dip = Math.sin(Math.PI * cl(v));
        let open; if (u < 0.3) open = lerp(1.35, -0.1, H.ease.io(cl(v))); else if (u < 0.8) open = -0.1 - 0.05 * Math.sin((u - 0.3) * 30) * (u - 0.3); else open = lerp(-0.1, 1.3, H.ease.out(cl((u - 0.8) / 0.2)));
        return { open, len: 1 - 0.5 * (u < 0.3 ? dip : 0), al: 1 - 0.3 * (u < 0.3 ? dip : 0), sz: 1 + 0.4 * H.ease.out(cl((u - 0.8) / 0.2)), gl: 0.3 + 2.2 * H.ease.in(cl((u - 0.3) / 0.6)) };
      }
      const dip = Math.sin(Math.PI * cl(u / 0.42));
      let open = u < 0.4 ? lerp(1.35, 0, H.ease.io(u / 0.4)) : H.ease.io(cl((u - 0.4) / 0.52)); if (u > 0.92) open = 1 + 0.3 * cl((u - 0.92) / 0.08);
      return { open, len: 1 - 0.5 * dip, al: 1 - 0.35 * dip, sz: 1, gl: 0.3 + 0.7 * u * u * u };
    }
    const phiOf = o => o < 0 ? 0.08 : o <= 1 ? lerp(0.14, 1.15, o) : lerp(1.15, 1.48, cl((o - 1) / 0.35));
    function burst(k) {
      const big = six && k === 5, r = R * (big ? 1.65 : 1.2);
      H.hitArea(cx, cy, r, TOT * wts[k] / ws, C.dmgO({ kb: big ? 3 : 1.5 }));
      H.X.shake(big ? 14 : 5 + k, big ? 0.55 : 0.25); H.X.flash(big ? 0.45 : 0.12, '#BFF8FF'); H.X.light(cx, cy, R * (big ? 3.4 : 2), big ? 0.8 : 0.45); if (big) H.X.hitstop(0.08);
      sfx('whoosh'); if (big || k === NB - 1) sfx('crash'); else sfx('bubble');
      const nd = H.n(big ? 80 : 26);
      for (let i = 0; i < nd; i++) { const a = Math.random() * TAU, rr = R * (0.6 + 0.5 * Math.random()), v = (big ? 5 : 3) + Math.random() * (big ? 6 : 3);
        H.P({ kind: Math.random() < 0.55 ? 'spark' : 'ember', x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr - 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - (big ? 5 : 3.5) * Math.random(), g: 9, drag: 0.3, life: 0.6 + Math.random() * 0.6, max: 1.2, size: 2 + Math.random() * 2.5, color: [W.white, W.aqua, W.foam, W.turq][i & 3] }); }
    }
    H.add({ life: LIFE, x: cx, y: cy, nb: 0, rot: [0, 0, 0],
      update(dt, f) {
        while (f.nb < NB && f.t >= B[f.nb]) burst(f.nb++);
        const holding = six && f.nb === 5 && (f.t - B[4]) / (B[5] - B[4]) > 0.3 && (f.t - B[4]) / (B[5] - B[4]) < 0.85;
        const spd = (0.6 + 0.14 * Math.min(f.nb, 4)) * (holding ? 0.25 : 1) * (f.t < 0.6 ? 0 : 1);
        for (let L = 0; L < 3; L++) f.rot[L] += dt * spd * LAY[Math.min(L, LAY.length - 1)].sp;
        /* droplets flung from the turning tips, bubbles rising through the gaps */
        const s = pst(f.t); if (s.len > 0.3 && s.al > 0.3) {
          const k = 9 * NL * dt * H.Q(); let m = Math.floor(k) + (Math.random() < k % 1 ? 1 : 0);
          while (m-- > 0) { const Lq = LAY[Math.floor(Math.random() * LAY.length)], Li = LAY.indexOf(Lq), j = Math.floor(Math.random() * Lq.n), th = f.rot[Li] + j * TAU / Lq.n + Lq.off, ph = phiOf(s.open) * Lq.phi, Lp = R * Lq.len * s.len * s.sz, hz = R * Lq.rb + Lp * Math.sin(ph), vz = Lp * Math.cos(ph), sg = Math.sign(Lq.sp);
            H.P({ kind: Math.random() < 0.6 ? 'spark' : 'ember', x: cx + Math.cos(th) * hz, y: cy + Math.sin(th) * hz - vz, vx: -Math.sin(th) * 2.2 * sg + Math.cos(th) * 1.2, vy: Math.cos(th) * 2.2 * sg - 1, g: 6, drag: 0.4, life: 0.5 + Math.random() * 0.4, max: 0.9, size: 1.6 + Math.random() * 1.6, color: Math.random() < 0.5 ? W.white : W.aqua }); } }
      },
      drawUnder(c, f, X0, Y0, T) {
        const tt = f.t, X = H.sx(cx), Y = H.sy(cy), fa = cl(Math.min(tt / 0.3, (LIFE - tt) / 0.6)), s = pst(tt);
        c.save(); c.globalCompositeOperation = 'lighter';
        // the pool of water light and its sheen under the lotus
        const pr = T * R * 1.35 * (0.6 + 0.4 * cl(tt / 0.6)); c.globalAlpha = 0.5 * fa * (0.75 + 0.25 * Math.min(2, s.gl)); c.drawImage(poolSpr(), X - pr, Y - pr * H.GY, pr * 2, pr * 2 * H.GY);
        c.save(); c.translate(X, Y); c.scale(1, H.GY); c.rotate(tt * 0.35); c.globalAlpha = 0.45 * fa; const sr = T * R * 1.25; c.drawImage(sheenSpr(), -sr, -sr, sr * 2, sr * 2); c.restore();
        // turning ripples with reflections running round them
        c.lineWidth = Math.max(1, T * 0.05); for (let i = 0; i < 3; i++) { const rr = T * R * (0.55 + 0.32 * i) * (1 + 0.03 * Math.sin(tt * 2 + i)); c.globalAlpha = 0.35 * fa; c.strokeStyle = W.aqua; c.beginPath(); c.ellipse(X, Y, rr, rr * H.GY, 0, 0, TAU); c.stroke();
          for (let q = 0; q < 2; q++) { const b = tt * (0.8 - 0.3 * i) * (i % 2 ? -1 : 1) + q * Math.PI + i; glow(c, X + Math.cos(b) * rr, Y + Math.sin(b) * rr * H.GY, T * 0.3, W.white, 0.5 * fa); } }
        // the first ripple round the pet
        if (tt < 0.9) { const u = cl(tt / 0.75), rr = T * R * 1.25 * H.ease.out(u); c.globalAlpha = (1 - u) * 0.9; c.drawImage(bandSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); }
        // the pressure ring of each burst (the sixth: a thick surge and two more luminous rings)
        for (let k = 0; k < f.nb; k++) { const big = six && k === 5, pb = tt - B[k], rings = big ? [[0, 1.2, 4.2, 1], [0.12, 0.9, 3.4, 0.7], [0.3, 1.1, 4.8, 0.6]] : [[0, 0.75, 2.6, 1]];
          for (const [d0, du, rm, am] of rings) { const u = (pb - d0) / du; if (u < 0 || u > 1) continue; const rr = T * R * (0.5 + rm * H.ease.out(u)); c.globalAlpha = (1 - u) * am * (big ? 1 : 0.9); c.drawImage(bandSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); }
          if (big && pb < 1.4) { const u = pb / 1.4, rr = T * R * (0.6 + 2.6 * H.ease.out(u)); c.globalAlpha = 0.5 * (1 - u); c.drawImage(poolSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); } }
        c.restore();
        f.paint(c, f, T, true);
      },
      draw(c, f, X0, Y0, T) { f.paint(c, f, T, false); },
      /* under the pet: the back of the crown, the back petals, the heart and the bubbles; over it (kept off the pet):
         the gathering ribbons, the front petals and the front of the crown */
      paint(c, f, T, under) {
        const tt = f.t, X = H.sx(cx), Y = H.sy(cy), fa = cl(Math.min(tt / 0.3, (LIFE - tt) / 0.5)), s0 = pst(tt), S = s0.sz;
        const PX = H.sx(me.x), PY = H.sy(me.y), nearP = Math.abs(PX - X) < T * R * 2.6 && Math.abs(PY - Y) < T * R * 2.2;
        // the petals: each its own moment in the unfolding (a slight spiral, each following the previous)
        const pets = [];
        LAY.forEach((Lq, Li) => { for (let j = 0; j < Lq.n; j++) { const s = pst(Math.max(0, tt - j * 0.022 - Li * 0.05)); if (s.len <= 0.02 || s.al <= 0.01) continue;
          const th = f.rot[Li] + j * TAU / Lq.n + Lq.off, ph = phiOf(s.open) * Lq.phi, Lp = R * Lq.len * s.len * s.sz, rb = R * Lq.rb * s.sz, hz = rb + Lp * Math.sin(ph), vz = Lp * Math.cos(ph), sn = Math.sin(th);
          const wf = lerp(0.42 + 0.58 * Math.abs(sn), 1, Math.pow(Math.sin(ph), 2));
          pets.push({ d: sn * (hz + 0.2) - Li * 0.01, bx: X + Math.cos(th) * rb * T, by: Y + sn * rb * T * H.GY, tx: X + Math.cos(th) * hz * T, ty: Y + sn * hz * T * H.GY - vz * T, w: T * R * Lq.w * s.sz * wf * (0.55 + 0.45 * s.len), a: s.al * fa * (sn < 0 ? 0.78 : 0.95), ph: Math.floor(((tt * 1.1 + j * 0.17 + Li * 0.31) % 1) * NPH) }); } });
        pets.sort((p, q) => p.d - q.d);
        const drawPet = p => strip(c, petSpr(p.ph), 48, 168, 151, p.bx, p.by, p.tx, p.ty, p.w * 1.5, p.a);
        // the crown splash of each burst: spouts round the rim rising and falling, the sixth also towering curved sheets
        const crown = front => { for (let k = 0; k < f.nb; k++) { const big = six && k === 5, pb = tt - B[k], du = big ? 1.3 : 0.85; if (pb > du) continue; const u = pb / du, N = big ? 26 : 14, hh = T * R * (big ? 1.9 : 0.95) * Math.sin(Math.PI * Math.min(1, u * 1.15));
          for (let i = 0; i < N; i++) { const th = i / N * TAU + k * 0.7 + R1(i + k) * 0.2, sn = Math.sin(th); if ((sn >= 0) !== front) continue; const rr = R * (big ? 1.0 : 0.95) * (1 + 0.35 * u), x0 = X + Math.cos(th) * rr * T, y0 = Y + sn * rr * T * H.GY, hq = hh * (0.7 + 0.5 * R1(i * 3 + k)), lean = T * (0.25 + 0.6 * u) * (big ? 1.5 : 1);
            strip(c, spoutSpr(), 16, 124, 118, x0, y0, x0 + Math.cos(th) * lean, y0 + sn * lean * H.GY - hq, T * (big ? 0.6 : 0.4), fa * (1 - u * u) * (sn < 0 ? 0.75 : 1)); }
          if (big) for (let i = 0; i < 10; i++) { const th = i / 10 * TAU + 0.3, sn = Math.sin(th); if ((sn >= 0) !== front) continue; const rr = R * (1.25 + 0.6 * u), x0 = X + Math.cos(th) * rr * T, y0 = Y + sn * rr * T * H.GY, hq = T * R * 2.6 * Math.sin(Math.PI * Math.min(1, u * 1.05)), lean = T * R * (0.4 + 0.8 * u);
            strip(c, petSpr((i + Math.floor(tt * 8)) % NPH), 48, 168, 151, x0, y0, x0 + Math.cos(th) * lean, y0 + sn * lean * H.GY - hq, T * R * 1.35, 0.75 * fa * (1 - u) * (sn < 0 ? 0.7 : 1)); } } };
        // ribbons of water gathering back into the heart after a burst (when another remains)
        const ribbons = () => { const k = f.nb - 1; if (k < 0 || k >= NB - 1) return; const pb = tt - B[k], v = cl((pb - 0.12) / 0.6); if (v <= 0 || v >= 1) return; c.lineCap = 'round';
          for (let i = 0; i < 8; i++) { const a0 = i / 8 * TAU + k, dir = i % 2 ? 1 : -1, pts = []; for (let q = 0; q <= 12; q++) { const s = cl(v - 0.4 + q / 12 * 0.4), r = R * 1.4 * (1 - s) + 0.1, b = a0 + s * 4.2 * dir + f.rot[0], z = R * 0.5 * s * (1 - s) * 2; pts.push([X + Math.cos(b) * r * T, Y + Math.sin(b) * r * T * H.GY - z * T]); }
            const al = fa * Math.sin(Math.PI * v); for (const [col, lw, aa] of [[W.turq, T * 0.2, 0.3], [W.aqua, T * 0.08, 0.6], [W.white, T * 0.025, 0.55]]) { c.globalAlpha = al * aa; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); pts.forEach((p, q) => q ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } } };
        if (under) {
          // a soft magical halo round the whole flower and rays of light turning out of the heart
          c.save(); c.globalCompositeOperation = 'lighter'; const ha = fa * Math.min(1, s0.al + 0.3) * cl(tt / 0.8), hy0 = Y - T * R * 0.45 * S, glA = Math.min(2, s0.gl);
          glow(c, X, hy0, T * R * 1.9 * S, W.turq, 0.3 * ha); glow(c, X, hy0, T * R * 1.2 * S, W.aqua, (0.2 + 0.08 * glA) * ha); glow(c, X, Y, T * R * 1.6, W.blue, 0.25 * ha);
          for (let i = 0; i < 7; i++) { const a = f.rot[0] * 0.6 + i * TAU / 7 - Math.PI / 2, len = T * R * (1.3 + 0.35 * Math.sin(tt * 1.7 + i * 2)) * S; H.ray(c, X, hy0, a, len, T * 0.5, i % 2 ? W.aqua : W.foam, (0.12 + 0.1 * glA) * ha); }
          c.restore();
          crown(false);
          for (const p of pets) if (p.d < 0) drawPet(p);
          // the heart: a glowing core (blazing before the sixth) and bubbles rising through the gaps
          c.save(); c.globalCompositeOperation = 'lighter'; const hy = Y - T * R * 0.32 * S, gl = s0.gl * s0.al * fa; glow(c, X, hy, T * R * (0.7 + 0.35 * gl), W.turq, 0.35 + 0.2 * gl); glow(c, X, hy, T * R * 0.35 * (0.6 + 0.6 * gl), W.white, 0.25 + 0.4 * gl); if (gl > 1) glow(c, X, hy, T * R * 1.2 * (gl - 1), W.foam, 0.5 * (gl - 1)); c.restore();
          c.save(); const nbub = H.n(8 + 4 * NL); for (let i = 0; i < nbub; i++) { const P0 = 1.6 + R1(i * 2.3), u = ((tt + R1(i) * P0) % P0) / P0, b = i * 2.4 + f.rot[0] * 0.5, rr = R * (0.15 + 0.5 * R1(i * 5.1)) * T; drawBub(c, X + Math.cos(b) * rr + Math.sin(u * 9 + i) * T * 0.08, Y + Math.sin(b) * rr * H.GY - u * T * R * 1.1, T * (0.07 + 0.08 * R1(i * 7.7)), fa * s0.al * Math.sin(Math.PI * u) * 0.9); } c.restore();
          return; }
        c.save(); if (nearP) petHole(c, T);
        c.save(); c.globalCompositeOperation = 'lighter'; ribbons(); c.restore();
        for (const p of pets) if (p.d >= 0) drawPet(p);
        crown(true);
        // sparkles and motes drifting round the flower
        c.globalCompositeOperation = 'lighter'; const nm = H.n(14 + 6 * NL), gw = glowSprite(W.foam), ga = glowSprite(W.aqua);
        for (let i = 0; i < nm; i++) { const P0 = 3 + 2 * R1(i * 1.7), u = ((tt + R1(i * 2.9) * P0) % P0) / P0, b = R1(i * 4.1) * TAU + tt * (0.3 + 0.3 * R1(i)) * (i % 2 ? 1 : -1), rr = T * R * (0.6 + 0.9 * R1(i * 6.3)), x = X + Math.cos(b) * rr, y = Y + Math.sin(b) * rr * H.GY - T * R * (0.2 + 1.2 * u), tw = 0.5 + 0.5 * Math.sin(tt * 6 + i * 2.3), sz = T * (0.12 + 0.12 * R1(i * 8.9)) * (0.7 + 0.6 * tw);
          c.globalAlpha = fa * Math.sin(Math.PI * u) * (0.5 + 0.5 * tw); c.drawImage(i % 3 ? ga : gw, x - sz * 2, y - sz * 2, sz * 4, sz * 4); if (!(i % 3)) { c.globalAlpha *= 0.8; c.drawImage(gw, x - sz * 0.6, y - sz * 0.6, sz * 1.2, sz * 1.2); } }
        c.restore();
      } });
  };

  /* ================= Aqua Rhapsody ================= */
  U.rhapsody = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), D = 8 + (ev - 1) * 8 / 6, FR = 0.40 + 0.05 * (ev - 1), NS = K.lv(C, [2, 3, 5]), TI = 1.0, TE = D - 1.2;
    const ticks = []; for (let t = 0.8; t <= TE + 1e-6; t += TI) ticks.push(t);
    const healT = FR / ticks.length, dmgT = C.base * C.K * K.evoK(C) * 0.12;
    const ST = [{ r: 1.35, h: 0.55, tl: 0.07, n: 3, w: 1.2 }, { r: 1.05, h: 1.2, tl: -0.12, n: 4, w: -1.5 }, { r: 1.7, h: 0.85, tl: 0.16, n: 2, w: 0.9 }, { r: 0.85, h: 1.65, tl: -0.08, n: 5, w: 1.7 }, { r: 1.55, h: 0.3, tl: 0.1, n: 3, w: -1.1 }].slice(0, NS);
    ST.forEach((s, k) => { s.s0 = 0.15 + 0.22 * k; s.ps = R1(k * 4.3) * TAU; });
    const NN = H.n(K.lv(C, [6, 10, 16])), NBb = H.n(K.lv(C, [8, 12, 18]));
    H.X.banner('AQUA RHAPSODY', '', C.col, 1.6); sfx('sparkle');
    /* a point on string k at angle th (screen, relative to the pet's foot at X, Y) */
    function sPt(k, th, tt, T, X, Y, pulse) {
      const s = ST[k], age = tt - s.s0, rise = H.ease.out(cl(age / 0.9)), dk = H.ease.io(cl((tt - TE) / 1.0));
      const fk = (k + 0.5) / NS * 1.25, r = lerp(s.r, 1.7 * Math.cos(fk), dk), hh = lerp(s.h, 0.35 + 2.1 * Math.sin(fk), dk) * rise, tl = s.tl * (1 - dk);
      const pluck = 0.24 * Math.exp(-1.5 * Math.max(0, age)) * Math.sin(age * 13) + 0.12 * pulse * Math.sin(tt * 9 + th * 2);
      const wave = (0.06 + (ev >= 4 ? 0.02 : 0)) * Math.sin(s.n * th + tt * s.w + s.ps) + pluck * Math.sin(2 * th + s.ps);
      return [X + Math.cos(th) * r * T, Y + Math.sin(th) * r * T * H.GY - (hh + tl * Math.sin(th + s.ps) * r + wave * rise) * T];
    }
    H.add({ life: D, ti: 0, inN: [], lastT: -9, ended: false,
      update(dt, f) {
        while (f.ti < ticks.length && f.t >= ticks[f.ti]) { f.ti++; f.lastT = f.t;
          H.X.heal(H.X.ST().hp * healT);
          H.hitArea(me.x, me.y, 2.6, dmgT, C.dmgO({ kb: 0 }));
          if (f.ti % 3 === 1) sfx('sparkle');
          for (let q = 0; q < 3; q++) f.inN.push({ t0: f.t, k: (f.ti + q) % NS, th: R1(f.ti * 7 + q) * TAU, v: (f.ti + q) & 1 });
          if (f.ti === ticks.length) { f.ended = true; H.X.light(me.x, me.y, 4, 0.6); H.burst(me.x, me.y - 0.8, 'spark', 26, { v: 3.5, up: 3, g: 2, life: 1.1, size: 2.4, color: [W.white, W.aqua, W.foam, W.pearl] }); } }
        f.inN = f.inN.filter(n => f.t - n.t0 < 1.0);
        if (Math.random() < 6 * dt * H.Q() && f.t < D - 0.5) { const b = Math.random() * TAU, rr = 0.6 + Math.random() * 1.2; H.P({ kind: 'spark', x: me.x + Math.cos(b) * rr, y: me.y + Math.sin(b) * rr * 0.6 - 0.4 - Math.random() * 0.8, vx: 0, vy: -0.8, g: -0.2, drag: 0.5, life: 0.7, max: 0.7, size: 1.6 + Math.random(), color: Math.random() < 0.5 ? W.white : W.aqua }); }
      },
      drawUnder(c, f, X0, Y0, T) {
        const tt = f.t, X = H.sx(me.x), Y = H.sy(me.y), fa = cl(Math.min(tt / 0.6, (D - tt) / 0.9)), pulse = Math.exp(-(tt - f.lastT) * 3);
        c.save(); c.globalCompositeOperation = 'lighter';
        // the blue glow and the water sheen under the pet
        const pr = T * 2.3 * (0.7 + 0.3 * cl(tt / 0.8)); c.globalAlpha = (0.42 + 0.15 * pulse) * fa; c.drawImage(poolSpr(), X - pr, Y - pr * H.GY, pr * 2, pr * 2 * H.GY);
        c.save(); c.translate(X, Y); c.scale(1, H.GY); c.rotate(tt * 0.18); c.globalAlpha = 0.5 * fa; const sr = T * 2.1; c.drawImage(sheenSpr(), -sr, -sr, sr * 2, sr * 2); c.restore();
        // gentle ripples spreading out (overlapping sets at Adept and up)
        c.lineWidth = Math.max(1, T * 0.04); c.strokeStyle = W.aqua; const cen = ev >= 4 ? [[0, 0], [0.9, 0.25], [-0.85, -0.2]] : [[0, 0]];
        cen.forEach(([ox, oy], ci) => { for (let i = 0; i < 3; i++) { const u = (tt * 0.33 + i / 3 + ci * 0.17) % 1, rr = T * (0.35 + (ci ? 1.3 : 2.1) * u); c.globalAlpha = (1 - u) * 0.45 * fa * (ci ? 0.6 : 1); c.beginPath(); c.ellipse(X + ox * T, Y + oy * T * H.GY, rr, rr * H.GY, 0, 0, TAU); c.stroke(); } });
        // nested water rings turning under it (Celestial)
        if (ev >= 7) { c.lineCap = 'round'; for (let i = 0; i < 3; i++) { const rr = T * (0.7 + 0.42 * i), dir = i % 2 ? -1 : 1; for (let q = 0; q < 4; q++) { const a0 = tt * 0.7 * dir + q * TAU / 4 + i; c.globalAlpha = 0.5 * fa; c.strokeStyle = W.turq; c.lineWidth = T * 0.12; c.beginPath(); c.ellipse(X, Y, rr, rr * H.GY, 0, a0, a0 + 0.9); c.stroke(); c.globalAlpha = 0.8 * fa; c.strokeStyle = W.foam; c.lineWidth = T * 0.03; c.stroke(); } } }
        // each healing tick: a soft ring flowing in to the pet
        const pt = tt - f.lastT; if (pt < 0.85) { const u = pt / 0.85, rr = T * (2.5 - 2.0 * H.ease.out(u)); c.globalAlpha = Math.sin(Math.PI * u) * 0.7 * fa; c.drawImage(bandSpr(), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); }
        c.restore();
        f.strings(c, f, T, X, Y, fa, pulse, false);
        f.notes(c, f, T, X, Y, fa, false);
      },
      /* the strings' back halves (under the pet) or front halves (over it, kept off the pet) */
      strings(c, f, T, X, Y, fa, pulse, front) {
        const tt = f.t, endA = cl((D - tt) / 0.7); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (let k = 0; k < NS; k++) { if (tt < ST[k].s0) continue; const a = fa * endA * cl((tt - ST[k].s0) / 0.4) * (front ? 1 : 0.7) * (1 + 0.5 * pulse), pts = [];
          for (let q = 0; q <= 26; q++) { const th = (front ? 0 : Math.PI) + q / 26 * Math.PI; pts.push(sPt(k, th, tt, T, X, Y, pulse)); }
          for (const [col, lw, aa] of [[W.turq, T * 0.18, 0.22], [W.aqua, T * 0.06, 0.75], [W.white, T * 0.022, 0.9]]) { c.globalAlpha = Math.min(1, a * aa); c.strokeStyle = col; c.lineWidth = Math.max(0.6, lw); c.beginPath(); pts.forEach((p, q) => q ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); }
          // a glint travelling along it
          const gq = ((tt * 0.4 + k * 0.3) % 1) * Math.PI + (front ? 0 : Math.PI), gp = sPt(k, gq, tt, T, X, Y, pulse); glow(c, gp[0], gp[1], T * 0.28, W.white, 0.6 * a); }
        c.restore(); },
      /* the notes riding the strings, then lifting away; at the end they all ascend */
      notes(c, f, T, X, Y, fa, front) {
        const tt = f.t, dk = cl((tt - TE) / 1.2); c.save();
        for (let j = 0; j < NN; j++) { const P0 = 2.6 + R1(j) * 0.9, ph = (tt + R1(j * 3) * P0) % P0, born = tt - ph; if (born < 0.35 + (j % NS) * 0.2 || born > TE + 0.2) continue;
          const k = j % NS, dir = ST[k].w > 0 ? 1 : -1, th = R1(j * 5.7) * TAU + dir * ph * 0.8, sn = Math.sin(th); if ((sn >= 0) !== front) continue;
          const p = sPt(k, th, tt, T, X, Y, 0), lift = ph > 1.8 ? Math.pow(ph - 1.8, 1.5) * T * 1.4 : 0, sway = ev >= 7 ? Math.sin(ph * 4 + j) * T * 0.18 : ev >= 4 ? Math.sin(ph * 3 + j) * T * 0.08 : 0;
          const a = fa * cl(ph / 0.3) * cl((P0 - ph) / 0.4) * (front ? 1 : 0.75), sz = T * (0.62 + 0.2 * R1(j * 9.1)), x = p[0] + sway, y = p[1] - T * 0.22 - lift - dk * dk * T * 3;
          c.globalAlpha = Math.min(1, a); c.drawImage(noteSpr(j % 3 === 1 ? 1 : 0), x - sz / 2, y - sz / 2, sz, sz); }
        c.restore(); },
      draw(c, f, X0, Y0, T) {
        const tt = f.t, X = H.sx(me.x), Y = H.sy(me.y), fa = cl(Math.min(tt / 0.6, (D - tt) / 0.9)), pulse = Math.exp(-(tt - f.lastT) * 3);
        c.save(); petHole(c, T);
        f.strings(c, f, T, X, Y, fa, pulse, true);
        f.notes(c, f, T, X, Y, fa, true);
        // the notes a tick sends drifting in to dissolve round the pet
        for (const n of f.inN) { const u = (tt - n.t0) / 1.0, p0 = sPt(n.k, n.th, tt, T, X, Y, 0), bx = X + Math.cos(n.th) * T * 0.55, by = Y - T * 0.5 + Math.sin(n.th) * T * 0.3, e = H.ease.io(u), sz = T * 0.5 * (1 - 0.45 * u);
          c.globalAlpha = fa * Math.sin(Math.PI * Math.min(1, u * 1.3)); c.drawImage(noteSpr(n.v), lerp(p0[0], bx, e) - sz / 2, lerp(p0[1], by, e) - sz / 2, sz, sz); }
        // bubbles rising between the notes (and up through the centre at Celestial)
        for (let i = 0; i < NBb; i++) { const P0 = 2.2 + 1.2 * R1(i * 1.9), u = ((tt + R1(i) * P0) % P0) / P0, b = R1(i * 3.3) * TAU, rr = (ev >= 7 && i % 4 === 0 ? 0.15 : 0.5 + 1.3 * R1(i * 4.7)) * T;
          drawBub(c, X + Math.cos(b) * rr + Math.sin(u * 7 + i) * T * 0.1, Y + Math.sin(b) * rr * H.GY - u * T * 2.4, T * (0.07 + 0.09 * R1(i * 6.1)), fa * Math.sin(Math.PI * u) * 0.9); }
        c.restore();
      } });
  };

  /* ================= Bubble Reverie =================
     Large pearlescent bubbles (a clear centre, a thin shell, a crescent highlight running round it, a glowing aqua
     droplet inside with tiny satellite bubbles) rise round the pet into floating arcs of six, wobbling; one after
     another their droplets brighten, they stretch toward their target and launch along smooth curves, flatten against
     the monster and burst into a thin ring of water with spray, the satellites lingering a moment. 6 / 12 / 18 bubbles
     (one, two, three arcs; at Celestial the arcs turn round the pet and the shells part into two sheets on impact). */
  const bubLSpr = () => fxSprite('wu2bubL', 64, 64, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0 - 1);
    [[0, 'rgba(150,240,255,0.03)'], [0.7, 'rgba(110,210,255,0.08)'], [0.86, 'rgba(95,240,255,0.32)'], [0.94, 'rgba(235,255,255,0.8)'], [0.975, 'rgba(95,240,255,0.5)'], [1, 'rgba(95,240,255,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.lineWidth = 2.2; g.lineCap = 'round'; for (const [a0, a1, col] of [[0.1, 1.2, 'rgba(216,200,255,0.55)'], [1.2, 2.2, 'rgba(255,205,235,0.4)'], [3.4, 4.3, 'rgba(200,255,230,0.35)']]) { g.strokeStyle = col; g.beginPath(); g.arc(c0, c0, c0 - 4, a0, a1); g.stroke(); } });
  /* the crescent highlight that runs round a bubble's shell (at angle 0: the right side) */
  const hlSpr = () => fxSprite('wu2hl', 64, 64, (g, w) => { const c0 = w / 2; g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 6; g.beginPath(); g.arc(c0, c0, c0 - 7, -0.7, 0.7); g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = 2.4; g.beginPath(); g.arc(c0, c0, c0 - 7, -0.5, 0.5); g.stroke(); });
  U.bubblereverie = (C, h) => {
    H = h; K = IK.bind(H);
    const me = H.me, ev = K.evo(C), NA = K.lv(C, [1, 2, 3]), N = NA * 6, cel = ev >= 7, TOT = C.base * 14 * C.K * K.evoK(C), dmg = TOT / N, BR = 0.36 + 0.015 * (ev - 1);
    H.X.banner('BUBBLE REVERIE', '', C.col, 1.6); sfx('bubble');
    const bs = []; for (let a = 0; a < NA; a++) for (let j = 0; j < 6; j++) { const i = a * 6 + j; bs.push({ i, a, j, s: 0.15 + a * 0.25 + j * 0.07, L: 1.35 + a * 0.55 + j * 0.1, side: (i % 2 ? 1 : -1) * (1 + 0.5 * R1(i * 3.3)), x: me.x, y: me.y, z: 0, st: 0, dx: 1, dy: 0, ph: R1(i * 7.1) * TAU, sat: [R1(i) * TAU, R1(i * 2) * TAU, R1(i * 5) * TAU] }); }
    const LIFE = bs[N - 1].L + 0.75 + 1.0;
    function slot(b, t) { const Ra = 1.45 + 0.55 * b.a, hc = 0.55 + 0.5 * b.a, phi = Math.PI * (0.12 + 0.76 * b.j / 5) + 0.12 * Math.sin(t * 1.3 + b.a), psi = cel ? t * 0.55 * (b.a % 2 ? -1 : 1) + b.a * 1.05 : (b.a - (NA - 1) / 2) * 0.5 + 0.15 * Math.sin(t * 0.8 + b.a), cx = -Math.cos(phi) * Ra;
      return [me.x + cx * Math.cos(psi), me.y - 0.2 * b.a + cx * Math.sin(psi) * 0.45, hc + Math.sin(phi) * Ra * 0.6 + 0.08 * Math.sin(t * 2.2 + b.ph)]; }
    function pickTgt(b) { const L = H.sortNear(me.x, me.y).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 11); return L.length ? L[b.i % L.length] : null; }
    function popAt(b) { const big = cel; H.hitArea(b.x, b.y, 1.0, dmg, C.dmgO({ kb: 1.2 })); if (b.i % 3 === 0) sfx('bubble');
      H.burst(b.x, b.y - 0.4, 'spark', big ? 10 : 7, { v: 5, up: 2.5, g: 8, life: 0.55, size: 2.4, color: [W.white, W.aqua, W.foam, W.pearl] }); H.glowAt(b.x, b.y - 0.4, 1.4, 0.3, W.aqua, 0.6); }
    H.add({ life: LIFE,
      update(dt, f) { const t = f.t;
        for (const b of bs) {
          if (b.st === 0) { const [sx, sy, sz] = slot(b, t), u = H.ease.out(cl((t - b.s) / 0.55)); b.x = lerp(me.x, sx, u); b.y = lerp(me.y, sy, u); b.z = lerp(0.2, sz, u);
            if (t >= b.L - 0.3 && !b.tgt) { b.tgt = pickTgt(b); }
            if (b.tgt || t >= b.L - 0.3) { const ex = b.tgt ? b.tgt.x : C.tx, ey = b.tgt ? b.tgt.y : C.ty, d = Math.hypot(ex - b.x, ey - b.y) || 1; b.dx = (ex - b.x) / d; b.dy = (ey - b.y) / d; }
            if (t >= b.L) { b.st = 1; b.p0 = [b.x, b.y, b.z]; b.ex = b.tgt ? b.tgt.x : C.tx + (R1(b.i) - 0.5) * 2; b.ey = b.tgt ? b.tgt.y : C.ty + (R1(b.i * 9) - 0.5) * 2; const d = Math.hypot(b.ex - b.x, b.ey - b.y); b.dur = 0.38 + Math.min(0.35, d * 0.04); b.cv = Math.min(3, 0.35 * d + 0.8) * b.side * (cel ? 1 + 0.4 * (b.a - 1) : 1); } }
          else if (b.st === 1) { if (b.tgt && !b.tgt.dead) { b.ex = b.tgt.x; b.ey = b.tgt.y; } const u = cl((t - b.L) / b.dur), e = u * u * (1.6 - 0.6 * u), [x0, y0, z0] = b.p0, mx = (x0 + b.ex) / 2 - (b.ey - y0) / Math.max(0.1, Math.hypot(b.ex - x0, b.ey - y0)) * b.cv, my = (y0 + b.ey) / 2 + (b.ex - x0) / Math.max(0.1, Math.hypot(b.ex - x0, b.ey - y0)) * b.cv, q = 1 - e;
            const nx = q * q * x0 + 2 * q * e * mx + e * e * b.ex, ny = q * q * y0 + 2 * q * e * my + e * e * b.ey; const d = Math.hypot(nx - b.x, ny - b.y); if (d > 1e-4) { b.dx = (nx - b.x) / d; b.dy = (ny - b.y) / d; } b.x = nx; b.y = ny; b.z = lerp(z0, 0.45, e) + Math.sin(Math.PI * e) * 0.6;
            if (Math.random() < 0.5 * H.Q()) H.P({ kind: 'spark', x: b.x, y: b.y - b.z, vx: -b.dx * 1.5, vy: -b.dy * 1.5, g: 3, drag: 0.5, life: 0.35, max: 0.35, size: 1.6, color: Math.random() < 0.5 ? W.white : W.aqua });
            if (u >= 1) { b.st = 2; b.hitT = t; popAt(b); } }
        }
      },
      draw(c, f, X0, Y0, T) {
        const t = f.t, fa = cl((LIFE - t) / 0.4), gw = glowSprite(W.aqua), gf = glowSprite(W.foam), r0 = T * BR;
        c.save(); petHole(c, T);
        for (const b of bs) { const X = H.sx(b.x), Y = H.sy(b.y) - b.z * T;
          if (b.st < 2) { if (t < b.s) continue; const app = cl((t - b.s) / 0.35), pre = cl((t - (b.L - 0.32)) / 0.32), fly = b.st === 1, ang = Math.atan2(b.dy * 0.8, b.dx);
            const wob = 0.05 * Math.sin(t * 5 + b.ph), stx = 1 + 0.16 * pre + (fly ? 0.22 : 0) + wob, sty = 1 - 0.1 * pre - (fly ? 0.12 : 0) - wob, r = r0 * (0.55 + 0.45 * app);
            c.save(); c.translate(X, Y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 * app * fa; c.drawImage(gw, -r * 1.8, -r * 1.8, r * 3.6, r * 3.6);
            const dr = r * (0.28 + 0.12 * pre), da = (0.55 + 0.45 * pre + (fly ? 0.3 : 0)) * app * fa; c.globalAlpha = Math.min(1, da); c.drawImage(gw, -dr * 1.6, -dr * 1.6, dr * 3.2, dr * 3.2); c.globalAlpha = Math.min(1, da * 0.9); c.drawImage(gf, -dr * 0.6, -dr * 0.6, dr * 1.2, dr * 1.2);
            c.globalCompositeOperation = 'source-over';
            for (let q = 0; q < 3; q++) { const qa = b.sat[q] + t * (1.2 + q * 0.4), qr = r * 0.52; drawBub(c, Math.cos(qa) * qr, Math.sin(qa) * qr * 0.8, r * 0.1, 0.85 * app * fa); }
            c.rotate(ang); c.scale(stx, sty); c.globalAlpha = 0.95 * app * fa; c.drawImage(bubLSpr(), -r, -r, r * 2, r * 2);
            c.rotate(t * (fly ? 6 : 1.6) + b.ph); c.globalAlpha = 0.85 * app * fa; c.drawImage(hlSpr(), -r, -r, r * 2, r * 2); c.restore(); continue; }
          // the burst: the shell flattens on the impact plane, then a thin ring of water (two parting sheets at Celestial)
          const a = t - b.hitT; if (a > 0.7) continue; const ang = Math.atan2(b.dy * 0.8, b.dx);
          if (a < 0.09) { c.save(); c.translate(X, Y); c.rotate(ang); c.scale(0.55, 1.3); c.globalAlpha = fa; c.drawImage(bubLSpr(), -r0, -r0, r0 * 2, r0 * 2); c.globalCompositeOperation = 'lighter'; c.drawImage(hlSpr(), -r0, -r0, r0 * 2, r0 * 2); c.restore(); continue; }
          const u = cl((a - 0.09) / 0.4);
          if (u < 1) { c.save(); c.globalCompositeOperation = 'lighter'; const rr = r0 * (1 + 2.4 * H.ease.out(u)); c.globalAlpha = (1 - u) * fa; c.drawImage(bandSpr(), X - rr, Y + r0 * 0.6 - rr * H.GY, rr * 2, rr * 2 * H.GY);
            if (cel && u < 0.7) { const v = u / 0.7, sep = r0 * 1.4 * H.ease.out(v); c.lineCap = 'round'; for (const sd of [-1, 1]) { const ox = -Math.sin(ang) * sep * sd, oy = Math.cos(ang) * sep * sd; for (const [col, lw, aa] of [[W.turq, r0 * 0.3, 0.35], [W.aqua, r0 * 0.12, 0.8], [W.white, r0 * 0.04, 0.9]]) { c.globalAlpha = aa * (1 - v) * fa; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.arc(X + ox, Y + oy, r0 * (1 + 0.4 * v), ang + Math.PI / 2 * sd - 1.1, ang + Math.PI / 2 * sd + 1.1); c.stroke(); } } }
            c.restore(); }
          // the satellites linger, then pop
          for (let q = 0; q < 3; q++) { const qa = b.sat[q] + q * 2.1, qr = r0 * (0.6 + a * 1.2), pa = a < 0.45 ? 1 : cl(1 - (a - 0.45) / 0.15); drawBub(c, X + Math.cos(qa) * qr, Y + Math.sin(qa) * qr * 0.7 - a * T * 0.4, r0 * (0.13 + (a > 0.45 ? 0.1 * (a - 0.45) / 0.15 : 0)), pa * fa); } }
        c.restore();
      } });
  };

  /* the shared water pieces, for the reworked Strong attacks (20k7f) */
  globalThis.WU2K = { W, R1, cl, lerp, glow, strip, drawBub, petSpr, NPH, spoutSpr, bandSpr, poolSpr, sheenSpr, bubSpr, bubLSpr, hlSpr };
})();
