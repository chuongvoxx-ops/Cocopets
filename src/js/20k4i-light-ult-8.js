/* ---------- Light (pink), reworked: Love Sanctuary ----------
   A rose circle draws itself on the floor where the pet stands at the cast and becomes a glistening magic circle: a
   transparent pink disc under a faint pearly dome, a bright pink outer edge with a sheen sliding round it, a big love heart
   at its centre that beats with a small luminous pulse, light bands orbiting along its rim, tiny hearts and stars drifting
   up round its boundary. The ward stays where it was cast. While the played pet stands inside it, every hit on the pet
   (contact, shots, zones, boss attacks: all of them go through hurtPet in 20b-game-dungeon.js, whose ward hook this sets
   with X.setWard) is taken from one shared, finite shield pool instead of the pet's health: a heart-shaped ripple spreads
   from the impact across the ward, the nearby light bands brighten and flow toward it, then settle back into orbit.
   The pool shows only as the edge's brightness and thickness. Pool: 1.5 x the pet's max HP at level 1 rising evenly to
   4 x at Celestial; when it runs out the ward breaks early in a pop of hearts and the rest of the hit goes through.
   Duration 10 s at level 1, 15 s at Adept (4), 20 s at Celestial (7), even steps between; at normal expiry the ward
   dissolves into floating hearts. Adept: a second inner ring with star glints, more bands, a double ripple.
   Celestial: three luminous bands turn round the dome at different tilts, and absorbed impacts send delicate waves of
   hearts and star glints across its surface. No damage to monsters. */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2;
  delete U.unsettingsun;
  let H, liveWard = null;   // the ward function currently set in the game's hurtPet hook (this file's latest cast)
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73', LAV = '#D5C4FF';
  const cl = u => Math.max(0, Math.min(1, u));
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const mixS = (h1, h2, k) => { const a = hexRGB(h1), b = hexRGB(h2); return '#' + [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k).toString(16).padStart(2, '0')).join(''); };
  const wrapA = d => { d = (d + Math.PI) % TAU; if (d < 0) d += TAU; return d - Math.PI; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const COSE = 0.835;   // the dome's height on screen per unit radius (the floor's tilt GY = 0.55 is its sine)

  /* ---- the heart curve (as in 20k4b): lobes up, point down, centred; index 0 the cleft, HHALF the point ---- */
  const HP = (() => { const N = 96, pts = []; for (let i = 0; i <= N; i++) { const t = i / N * TAU, s = Math.sin(t); pts.push([16 * s * s * s / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); } return pts; })();
  const HN = HP.length - 1, HHALF = HN / 2;
  function heartPath(g, s, ox, oy, sy) { g.beginPath(); for (let i = 0; i < HN; i++) { const p = HP[i]; const x = (ox || 0) + p[0] * s, y = (oy || 0) + p[1] * s * (sy || 1); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  function partHeart(c, s, ox, oy, sy, u) { const k = Math.round(HHALF * cl(u)); if (k < 1) return false; c.beginPath(); for (let i = HHALF - k; i <= HHALF + k; i++) { const p = HP[i]; const x = ox + p[0] * s, y = oy + p[1] * s * sy; i === HHALF - k ? c.moveTo(x, y) : c.lineTo(x, y); } return true; }

  /* ---- cached sprites (own keys; the 20k4b/f look): 160 px square, heart unit 64 px, centre (80, 74) ---- */
  const SW = 160, SU = 64, SCX = 80, SCY = 74;
  const lineSpr = () => fxSprite('lu8line', SW, SW, g => { g.translate(SCX, SCY); g.lineJoin = 'round'; for (const [col, lw] of [['rgba(255,92,203,0.18)', 16], ['rgba(255,92,203,0.35)', 9], ['rgba(255,143,219,0.8)', 4.5], ['rgba(255,244,252,1)', 1.8]]) { heartPath(g, SU * 0.9); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); } });
  const fillSpr = () => fxSprite('lu8fill', SW, SW, g => { g.translate(SCX, SCY); for (let k = 0; k < 5; k++) { heartPath(g, SU * (1.02 - k * 0.12), 0, SU * k * 0.03); g.fillStyle = `rgba(255,92,203,${0.09 + k * 0.03})`; g.fill(); } const gr = g.createRadialGradient(0, SU * 0.2, 0, 0, SU * 0.2, SU * 0.6); gr.addColorStop(0, 'rgba(255,244,252,0.7)'); gr.addColorStop(0.5, 'rgba(255,212,238,0.28)'); gr.addColorStop(1, 'rgba(255,212,238,0)'); heartPath(g, SU * 0.8, 0, SU * 0.05); g.fillStyle = gr; g.fill(); });
  const smallSpr = col => fxSprite('lu8sh' + col, 40, 40, g => { let gr = g.createRadialGradient(20, 20, 0, 20, 20, 20); gr.addColorStop(0, rgbaS(col, 0.55)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 40, 40); gr = g.createRadialGradient(17, 17, 0, 20, 21, 10); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, mixS(col, DEEP, 0.35)); heartPath(g, 10, 20, 19); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.6); g.lineWidth = 1; g.stroke(); });
  const starSpr = col => fxSprite('lu8st' + col, 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, rgbaS(col, 0.7)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8.5, b = -Math.PI / 2 + i * Math.PI / 5; i ? g.lineTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r) : g.moveTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r); } g.closePath(); g.fillStyle = PEARL; g.fill(); g.strokeStyle = rgbaS(col, 0.9); g.lineWidth = 1; g.stroke(); });
  /* the transparent floor disc: an even blush body, a brighter rose band near the rim, feathered to nothing at the edge */
  const discSpr = () => fxSprite('lu8disc', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,212,238,0.30)'); gr.addColorStop(0.55, 'rgba(255,143,219,0.26)'); gr.addColorStop(0.86, 'rgba(255,92,203,0.42)'); gr.addColorStop(0.95, 'rgba(255,92,203,0.2)'); gr.addColorStop(1, 'rgba(255,92,203,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  /* the dome's body: nearly clear in the middle, a soft fresnel brightening toward its edge, feathered out */
  const domeSpr = () => fxSprite('lu8dome', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,212,238,0.05)'); gr.addColorStop(0.6, 'rgba(255,143,219,0.07)'); gr.addColorStop(0.86, 'rgba(255,92,203,0.2)'); gr.addColorStop(0.95, 'rgba(255,143,219,0.24)'); gr.addColorStop(1, 'rgba(255,143,219,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  function blitC(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || w < 0.5) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); }
  const glowC = (c, x, y, r, col, a) => blitC(c, glowSprite(col), x, y, r * 2, r * 2, a, true);
  /* little hearts and stars in the world (x, y tiles, z height) */
  function bits() { const L = []; return { L,
    add(x, y, z, o) { L.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.18, col: ROSE, kind: 'h', rot: 0, g: 0, drag: 1.2 }, o)); },
    step(dt) { for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.t += dt; if (p.t >= p.life) { L.splice(i, 1); continue; } const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); } },
    draw(c, T, fa) { for (const p of L) { if (p.t < 0) continue; const u = p.t / p.life, a = Math.min(1, u * 6) * (1 - u) * (fa == null ? 1 : fa), r = p.s * T * (p.kind === 'h' ? 1.6 : 1.3) * (1 - 0.3 * u); if (a < 0.02) continue;
      c.save(); c.globalAlpha = a; c.globalCompositeOperation = p.kind === 'h' ? 'source-over' : 'lighter'; c.translate(H.sx(p.x), H.sy(p.y) - p.z * T); if (p.rot) c.rotate(p.rot * Math.sin(p.t * 3)); c.drawImage(p.kind === 'h' ? smallSpr(p.col) : starSpr(p.col), -r, -r, r * 2, r * 2); c.restore(); } } }; }
  /* a feathered arc of the floor ellipse (rx, ry) from a0 over len radians: alpha rises and falls along it */
  function arcSeg(c, X, Y, rx, ry, a0, len, w, col, a, N) { if (!(a > 0.01)) return; N = N || 12; c.strokeStyle = col; c.lineWidth = w; for (let i = 0; i < N; i++) { const e = Math.sin(Math.PI * (i + 0.5) / N); c.globalAlpha = Math.min(1, a * e); c.beginPath(); c.ellipse(X, Y, rx, ry, 0, a0 + len * i / N, a0 + len * (i + 1) / N + 0.004); c.stroke(); } }

  /* ================= Love Sanctuary ================= */
  U.lovesanctuary = (C, h) => {
    H = h; const me = H.me, X0 = H.X, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const DUR = 10 + (ev - 1) * 10 / 6, OUT = 1.2, BRK = 0.9;               // 10 s / 15 s at Adept / 20 s at Celestial
    const POOLK = 1.5 + (ev - 1) * 2.5 / 6, ST = X0.ST ? X0.ST() : { hp: 100 }; // the shield pool: 1.5 x .. 4 x the pet's max HP
    const R = 2.5 + 0.1 * (ev - 1), FORM = 0.9;                            // the ward's radius (tiles), its drawing-on time
    const pool0 = POOLK * ST.hp; let pool = pool0, qs = 1, state = 'on', endT = 0, lastSfx = -9;
    const wx = me.x, wy = me.y, B = bits(), hits = [];
    const NSTREAK = [2, 3, 4][tier - 1], streaks = []; for (let k = 0; k < NSTREAK; k++) streaks.push({ a0: k / NSTREAK * TAU + 0.4, w: 0.55 + 0.08 * k, len: 0.75 + 0.15 * (k % 2), col: k % 2 ? BLUSH : CANDY });
    const bands = tier === 3 ? [{ tilt: 0.55, w: 0.45, p0: 0.3, r: 0.97, col: CANDY }, { tilt: 0.95, w: -0.32, p0: 2.2, r: 0.9, col: BLUSH }, { tilt: 1.3, w: 0.24, p0: 4.1, r: 0.82, col: LAV }] : [];
    X0.banner('LOVE SANCTUARY', '', ROSE, 1.4); X0.sfx.hum();
    const env = age => sm(age / 0.16) * (1 - sm((age - 0.3) / 0.75));   // how strongly an impact pulls and brightens the bands
    function absorbed(a, src) {
      const t = F.t, ai = src && src.x != null ? Math.atan2(src.y - wy, src.x - wx) : Math.atan2(me.y - wy, me.x - wx) || 0;
      hits.push({ t, ai, x: me.x, y: me.y }); if (hits.length > 8) hits.shift();
      X0.light(me.x, me.y, 2.4, 0.22); if (t - lastSfx > 0.3) { lastSfx = t; X0.sfx.sparkle && X0.sfx.sparkle(); }
      // a little scatter of hearts from the impact; a wave of hearts and star glints across the surface (more by level)
      const nh = H.n(3 + tier * 2); for (let q = 0; q < nh; q++) { const b = q / nh * TAU + Math.random() * 0.4, v = 1.6 + tier * 0.5; B.add(me.x, me.y, 0.25, { vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 0.4 + Math.random() * 0.5, drag: 2.2, life: 0.7 + Math.random() * 0.3, s: 0.06 + Math.random() * 0.03, kind: q % (tier === 3 ? 2 : 3) ? 'h' : 's', col: [CANDY, BLUSH, PEARL, ROSE][q % 4], rot: 0.4 }); }
      if (tier === 3) for (let q = 0; q < H.n(8); q++) { const b = ai + Math.PI + (q - 3.5) * 0.28; B.add(wx + Math.cos(ai) * R * 0.95, wy + Math.sin(ai) * R * 0.95, 0.6 + 0.4 * Math.sin(q), { vx: Math.cos(b) * 3.2, vy: Math.sin(b) * 2.2, vz: -0.2, drag: 1.6, life: 0.8, s: 0.05, kind: 's', col: q % 2 ? PEARL : LAV, t: -q * 0.02 }); }
    }
    function release() { if (liveWard === ward) { liveWard = null; if (X0.setWard) X0.setWard(null); } }
    function shatter() {
      state = 'broken'; endT = F.t; F.life = BRK; release();
      X0.text(wx, wy - 1.4, 'Sanctuary broken', BLUSH, 14); X0.light(wx, wy, R * 1.6, 0.5); X0.sfx.chirp && X0.sfx.chirp();
      const n = H.n(26 + 8 * tier); for (let q = 0; q < n; q++) { const b = q / n * TAU + Math.random() * 0.2, v = 2.6 + Math.random() * 2.2; B.add(wx + Math.cos(b) * R, wy + Math.sin(b) * R, 0.2 + Math.random() * 1.4, { vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 1.2 + Math.random() * 1.2, g: 2.2, drag: 1.4, life: 0.7 + Math.random() * 0.4, s: 0.07 + Math.random() * 0.04, kind: q % 3 ? 'h' : 's', col: [ROSE, CANDY, BLUSH, PEARL][q % 4], rot: 0.6 }); }
    }
    // (the hook: called by hurtPet with the damage after mitigation; returns what the pet still takes)
    const ward = (d, src) => {
      if (state !== 'on' || me.dead || !(d > 0)) return d;
      if (Math.hypot(me.x - wx, me.y - wy) > R) return d;   // only inside the ward
      const a = Math.min(pool, d); pool -= a; absorbed(a, src);
      if (pool <= 1e-6) { pool = 0; shatter(); }
      return d - a;
    };
    const F = H.add({ life: DUR + OUT, x: wx, y: wy,
      update(dt, f) {
        const t = f.t; B.step(dt); qs += (pool / pool0 - qs) * (1 - Math.exp(-dt * 6));
        if (state === 'on' && t >= DUR) {   // normal expiry: the ward lets go and dissolves into floating hearts
          state = 'end'; endT = t; f.life = OUT; release();
          const n = H.n(24 + 8 * tier); for (let q = 0; q < n; q++) { const b = Math.random() * TAU, r = q % 2 ? R * (0.9 + 0.1 * Math.random()) : Math.sqrt(Math.random()) * R * 0.8; B.add(wx + Math.cos(b) * r, wy + Math.sin(b) * r, 0.05 + Math.random() * 0.3, { vz: 0.6 + Math.random() * 0.8, vx: (Math.random() - 0.5) * 0.3, drag: 0.4, life: 1.0 + Math.random() * 0.7, s: 0.06 + Math.random() * 0.05, kind: q % 3 ? 'h' : 's', col: [CANDY, BLUSH, PEARL, tier === 3 ? LAV : ROSE][q % 4], rot: 0.4, t: -Math.random() * 0.3 }); }
        }
        // tiny hearts and stars drifting up round its boundary
        if (state === 'on' && t > FORM * 0.6 && Math.random() < dt * (3 + 2 * tier) * H.Q()) { const b = Math.random() * TAU, r = R * (0.92 + 0.08 * Math.random()); B.add(wx + Math.cos(b) * r, wy + Math.sin(b) * r, 0.05, { vz: 0.25 + Math.random() * 0.35, vx: -Math.sin(b) * 0.25, vy: Math.cos(b) * 0.15, drag: 0.3, life: 1.5 + Math.random() * 0.8, s: 0.05 + Math.random() * 0.035, kind: Math.random() < 0.55 ? 'h' : 's', col: [CANDY, BLUSH, PEARL, tier === 3 ? LAV : ROSE][Math.floor(Math.random() * 4)], rot: 0.3 }); }
      },
      onEnd() { release(); },
      drawUnder(c, f, X, Y, T, t) {
        t = f.t; const fa = fadeOf(t), Rr = R * T, ry = Rr * H.GY, uL = sm(t / FORM), uF = sm((t - 0.35) / 0.6), k = 0.45 + 0.55 * qs;
        const low = qs < 0.25 ? 0.85 + 0.15 * Math.sin(t * 13) : 1, bu = state === 'broken' ? cl((t - endT) / 0.5) : 0;
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
        // the transparent pink disc and the dome's body (under the pet, so they never cover it)
        c.globalAlpha = 0.75 * uF * fa; c.drawImage(discSpr(), X - Rr * 1.04, Y - ry * 1.04, Rr * 2.08, ry * 2.08);
        const Hd = Rr * COSE, dh = (Hd + ry) / 2; c.globalAlpha = 0.9 * uF * fa * (0.7 + 0.3 * k); c.drawImage(domeSpr(), X - Rr * 1.03, Y - (Hd - ry) / 2 - dh * 1.03, Rr * 2.06, dh * 2.06);
        // the outer edge draws itself round from the front; its glow and thickness show the pool that is left
        const a0 = Math.PI / 2, sweep = TAU * uL;
        for (const [col, lw, al] of [[ROSE, 5 + 9 * k, 0.28], [CANDY, 1.4 + 2.6 * k, 0.85], [PEARL, 0.7 + 0.6 * k, 0.75]]) { c.globalAlpha = al * fa * low * (0.55 + 0.45 * k); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(X, Y, Rr, ry, 0, a0, a0 + sweep); c.stroke(); }
        if (uL < 1) { const hx = X + Math.cos(a0 + sweep) * Rr, hy = Y + Math.sin(a0 + sweep) * ry; glowC(c, hx, hy, T * 0.5, PEARL, fa); }
        // a faint pearly sheen sliding round the edge
        arcSeg(c, X, Y, Rr, ry, t * 0.9, 1.1, 2.2 + 1.5 * k, PEARL, 0.6 * uL * fa * k, 14);
        // inner rings and their glints (the magic circle)
        const ui = sm((t - 0.3) / 0.6);
        for (const [rr, col, lw, al, tt] of [[0.86, BLUSH, 1.1, 0.55, 1], [0.72, CANDY, 0.9, 0.45, 2]]) { if (tier < tt) continue; c.globalAlpha = al * ui * fa; c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.ellipse(X, Y, Rr * rr, ry * rr, 0, a0, a0 + TAU * ui); c.stroke(); c.globalAlpha = 0.18 * ui * fa; c.strokeStyle = ROSE; c.lineWidth = lw * 5; c.stroke(); }
        const NG = [8, 10, 12][tier - 1]; for (let q = 0; q < NG; q++) { const b = q / NG * TAU - t * 0.18, gx = X + Math.cos(b) * Rr * 0.86, gy = Y + Math.sin(b) * ry * 0.86, tw = 0.6 + 0.4 * Math.sin(t * 2.4 + q * 1.7);
          if (q % 2 === 0 && tier >= 2) blitC(c, starSpr(q % 4 ? BLUSH : PEARL), gx, gy, T * 0.3, T * 0.3, tw * ui * fa, true); else glowC(c, gx, gy, T * 0.12, PEARL, 0.7 * tw * ui * fa); }
        if (tier === 3) for (let q = 0; q < 4; q++) { const b = q / 4 * TAU + t * 0.12 + Math.PI / 4; blitC(c, smallSpr(CANDY), X + Math.cos(b) * Rr * 0.72, Y + Math.sin(b) * ry * 0.72, T * 0.32, T * 0.32, 0.8 * ui * fa, false); }
        // the love heart at its centre: its line draws from the point up both sides, soft light fills it, it beats
        const s = Rr * 0.6, cy = Y - s * 0.2 * H.GY, v = (t % 1.3) / 1.3, beat = Math.pow(Math.max(0, 1 - v * 4), 2) + 0.5 * Math.pow(Math.max(0, 1 - Math.abs(v - 0.3) * 6), 2), ps = 1 + 0.035 * beat;
        if (uF > 0) { const kk = s / (SU * 0.94) * 1.02 * ps; c.save(); c.translate(X, cy); c.scale(kk, kk * H.GY); c.globalAlpha = (0.55 + 0.2 * beat) * uF * fa; c.drawImage(fillSpr(), -SCX, -SCY); c.restore(); }
        glowC(c, X, cy + s * 0.15 * H.GY, s * (0.55 + 0.12 * beat), PEARL, (0.18 + 0.3 * beat) * uF * fa);
        if (partHeart(c, s * ps, X, cy, H.GY, sm((t - 0.15) / 0.75))) { for (const [col, lw, al] of [[ROSE, 8, 0.32], [CANDY, 2.4, 0.9], [PEARL, 0.9, 0.8]]) { c.globalAlpha = al * fa * (0.85 + 0.15 * beat); c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); } }
        // the light bands orbiting the rim: on an impact they brighten and flow toward it, then settle back
        for (const st of streaks) { const base = st.a0 + t * st.w; let off = 0, boost = 0; for (const hh of hits) { const e = env(t - hh.t); if (e <= 0) continue; off += wrapA(hh.ai - base) * 0.85 * e; boost += e; }
          const ac = base + off, ln = st.len * (1 + 0.5 * Math.min(1, boost)), al = (0.55 + 0.45 * Math.min(1, boost)) * uL * fa;
          arcSeg(c, X, Y, Rr * 0.94, ry * 0.94, ac - ln / 2, ln, 7, ROSE, 0.3 * al, 10); arcSeg(c, X, Y, Rr * 0.94, ry * 0.94, ac - ln / 2, ln, 2 + Math.min(1, boost) * 1.5, st.col, al, 10); arcSeg(c, X, Y, Rr * 0.94, ry * 0.94, ac - ln * 0.3, ln * 0.6, 0.9, PEARL, al, 6); }
        // the absorbed impacts: a heart-shaped ripple spreading across the ward from the impact, and the edge flaring there
        if (hits.length) { c.save(); H.floorEllipse(c, X, Y, Rr * 0.99); c.clip();
          for (const hh of hits) { for (let w2 = 0; w2 < (tier >= 2 ? 2 : 1); w2++) { const u = cl((t - hh.t - w2 * 0.14) / 0.95); if (u <= 0 || u >= 1) continue; const hs = T * (0.35 + R * 1.15 * H.ease.out(u)), a = (1 - u) * (1 - u) * fa * (w2 ? 0.55 : 1), hx = H.sx(hh.x), hy = H.sy(hh.y) - hs * 0.2 * H.GY;
            for (const [col, lw, al] of [[ROSE, 10 * (1 - u) + 3, 0.35], [w2 ? BLUSH : CANDY, 2.4, 0.9], [PEARL, 0.9, 0.85]]) { heartPath(c, hs, hx, hy, H.GY); c.globalAlpha = al * a; c.strokeStyle = col; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }
            if (!w2) { c.globalAlpha = 0.3 * a; c.drawImage(glowSprite(CANDY), hx - hs * 0.8, hy + hs * 0.15 * H.GY - hs * 0.8 * H.GY, hs * 1.6, hs * 1.6 * H.GY); } } }
          c.restore();
          for (const hh of hits) { const e = env(t - hh.t); if (e <= 0) continue; arcSeg(c, X, Y, Rr, ry, hh.ai - 0.7, 1.4, 9, ROSE, 0.35 * e * fa, 12); arcSeg(c, X, Y, Rr, ry, hh.ai - 0.6, 1.2, 2.6, PEARL, 0.9 * e * fa, 12); glowC(c, X + Math.cos(hh.ai) * Rr, Y + Math.sin(hh.ai) * ry, T * 0.6, CANDY, 0.5 * e * fa); } }
        // breaking: the edge flashes and swells outward as it lets go
        if (state === 'broken') { const rr = 1 + 0.25 * H.ease.out(bu), a = (1 - bu) * (1 - bu); c.globalAlpha = 0.4 * a; c.strokeStyle = ROSE; c.lineWidth = 14; H.floorEllipse(c, X, Y, Rr * rr); c.stroke(); c.globalAlpha = 0.9 * a; c.strokeStyle = PEARL; c.lineWidth = 2; c.stroke(); }
        // Celestial: the back halves of the three tilted bands
        c.restore();
        if (bands.length) drawBands(c, X, Y, T, t, fa, false);
      },
      draw(c, f, X, Y, T, t) {
        t = f.t; const fa = fadeOf(t), Rr = R * T, Hd = Rr * COSE, k = 0.45 + 0.55 * qs, uD = sm((t - 0.5) / 0.6);
        // the dome's edge: a thin translucent arc over the ward, faded where the pet stands so it never covers it
        if (uD > 0) { const mask = petMask(T), N = 40; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
          let flare = 0, fa2 = 0; for (const hh of hits) { const e = env(t - hh.t); if (e > flare) { flare = e; fa2 = Math.acos(Math.max(-1, Math.min(1, Math.cos(hh.ai)))); } }
          for (let i = 0; i < N; i++) { const b0 = i / N * Math.PI, b1 = (i + 1) / N * Math.PI, bm = (b0 + b1) / 2, p0 = [X + Math.cos(b0) * Rr, Y - Math.sin(b0) * Hd], p1 = [X + Math.cos(b1) * Rr, Y - Math.sin(b1) * Hd];
            const m = mask((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2) * sm(Math.min(bm, Math.PI - bm) / 0.25), fl = flare * Math.max(0, 1 - Math.abs(bm - fa2) / 0.8), sh = Math.max(0, Math.cos(bm * 2 - t * 0.8)) ** 6, a = uD * fa * m;
            if (a < 0.02) continue;
            for (const [col, lw, al] of [[ROSE, 6, 0.12 + 0.25 * fl], [CANDY, 1.2 + 0.6 * k + 1.5 * fl, (0.3 + 0.2 * k) + 0.5 * fl], [PEARL, 0.8, 0.25 * sh + 0.6 * fl]]) { c.globalAlpha = Math.min(1, al * a); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); c.stroke(); } }
          c.restore(); }
        if (bands.length) drawBands(c, X, Y, T, t, fa, true);
        B.draw(c, T);
      } });
    liveWard = ward; if (X0.setWard) X0.setWard(ward);
    function fadeOf(t) { return sm(t / 0.25) * (state === 'end' ? 1 - sm((t - endT) / OUT) : state === 'broken' ? 1 - sm((t - endT) / (BRK * 0.55)) : 1); }
    // 0 near the pet's body on screen, 1 away from it (the dome's edge and the bands fade round the pet instead of covering it)
    function petMask(T) { const px = H.sx(me.x), py = H.sy(me.y) - T * 0.55; return (x, y) => cl((Math.hypot(x - px, (y - py) * 0.85) - T * 0.7) / (T * 0.6)); }
    // Celestial: three luminous bands turning round the dome at different tilts (back halves under the pet, front over it)
    function drawBands(c, X, Y, T, t, fa, front) {
      const Rr = R * T, zc = R * 0.32, ub = sm((t - 0.6) / 0.8), N = 48, mask = front ? petMask(T) : null; if (ub <= 0) return;
      let flare = 0; for (const hh of hits) flare = Math.max(flare, env(t - hh.t));
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';
      for (const bd of bands) { const ps = bd.p0 + t * bd.w, ct = Math.cos(bd.tilt), stl = Math.sin(bd.tilt), cp = Math.cos(ps), sp = Math.sin(ps), rr = R * bd.r;
        const P = b => { const lx = rr * Math.cos(b), ly = rr * Math.sin(b) * ct, lz = rr * Math.sin(b) * stl, x = lx * cp - ly * sp, y = lx * sp + ly * cp, z = zc + lz; return [X + x * T, Y + y * T * H.GY - z * T * COSE, y, z]; };
        let q0 = P(0);
        for (let i = 1; i <= N; i++) { const q1 = P(i / N * TAU), dy = (q0[2] + q1[2]) / 2; if ((dy > 0) !== front) { q0 = q1; continue; }
          const z = (q0[3] + q1[3]) / 2, mx = (q0[0] + q1[0]) / 2, my = (q0[1] + q1[1]) / 2, gl = Math.max(0, Math.cos(i / N * TAU * 2 - t * 1.6 + bd.p0)) ** 4;
          const a = ub * fa * sm(z / (R * 0.22)) * (front ? 1 : 0.55) * (mask ? mask(mx, my) : 1) * (1 + 0.6 * flare); if (a < 0.02) { q0 = q1; continue; }
          for (const [col, lw, al] of [[ROSE, 6, 0.14], [bd.col, 1.6, 0.6], [PEARL, 0.8, 0.2 + 0.7 * gl]]) { c.globalAlpha = Math.min(1, al * a); c.strokeStyle = col; c.lineWidth = lw; c.beginPath(); c.moveTo(q0[0], q0[1]); c.lineTo(q1[0], q1[1]); c.stroke(); }
          q0 = q1; } }
      c.restore();
    }
  };
})();
