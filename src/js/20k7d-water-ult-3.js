/* ---------- Water, reworked: Shiny Aqua Illusion ----------
   Midnight-blue water spreads fast beneath the pet over a huge circle: moving aqua reflections, slow concentric currents
   and a thin luminous boundary. Star-shaped lights hang above it at different heights, drifting and turning, each casting
   a shimmering glint on the water. Every monster on the field when it is cast is cursed: a geometric sigil over it (two
   thin bands round a diamond and a star) and a luminous ring at its feet. A cursed monster is held still (a boss only
   briefly rooted, never moved), takes 20% more damage from any source and records the damage it actually takes (the
   hook is in hitMon, 20b-game-dungeon.js: `m.aquaCurse`). Each hit pulses into its sigil and leaves a light bead on the
   band; an outer ring drains with the time left. At expiry the sigil contracts, droplets converge and an aqua burst
   erupts from the monster for 10% of what it recorded (not recorded, not amplified). 5 s at Hatchling, 7 at Adept, 10 at
   Celestial (between, it interpolates). Celestial: layered counter-turning currents, constellation lines between the
   stars, a third counter-rotating band on the sigils and a floor sigil, and the stars brighten in the last second.
   Cheap: the pool, the sheen, the star, the glint and the sigil parts are cached sprites, only blitted and turned. */
(() => {
  const U = ELEM_IMPL.water.ult, TAU = Math.PI * 2;
  const cl = u => Math.max(0, Math.min(1, u));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const AQ = '#5FE8FF', TQ = '#3FD0E0', WH = '#FFFFFF', DEEP = '#123A8C';
  const rg = (g, x, y, r, stops) => { const q = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(s => q.addColorStop(s[0], s[1])); return q; };

  /* ---- cached sprites ---- */
  // the pool seen from above: deep midnight interior, sapphire toward the rim, a turquoise lip fading out
  const poolSpr = () => fxSprite('wu3pool', 256, 256, (g, w) => { const c0 = w / 2; g.fillStyle = rg(g, c0, c0, c0, [[0, 'rgba(4,9,34,0.84)'], [0.55, 'rgba(7,18,58,0.8)'], [0.84, 'rgba(14,44,112,0.74)'], [0.94, 'rgba(36,128,196,0.5)'], [1, 'rgba(95,232,255,0)']]); g.fillRect(0, 0, w, w); });
  // moving aqua reflections: soft wavy streaks (additive), tiled by drifting two copies
  const sheenSpr = () => fxSprite('wu3sheen', 256, 256, (g, w) => { g.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const x = R1(i * 3.1) * w, y = R1(i * 7.7 + 2) * w, L = 30 + 60 * R1(i * 1.3), k = R1(i * 5.9);
      for (const [col, lw] of [['rgba(63,208,224,0.16)', 7], ['rgba(95,232,255,0.32)', 2.6], ['rgba(232,251,255,0.5)', 0.9]]) { g.strokeStyle = col; g.lineWidth = lw * (0.6 + k * 0.6); g.beginPath();
        for (let j = 0; j <= 10; j++) { const u = j / 10, px = x - L / 2 + L * u, py = y + Math.sin(u * 6 + i) * 4; j ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); } } });
  // a star: aqua halo, a five-pointed body with a white heart and an aqua rim
  const starSpr = () => fxSprite('wu3star', 64, 64, (g, w) => { const c0 = w / 2;
    g.fillStyle = rg(g, c0, c0, c0, [[0, 'rgba(232,251,255,0.9)'], [0.18, 'rgba(95,232,255,0.55)'], [0.5, 'rgba(63,208,224,0.14)'], [1, 'rgba(63,208,224,0)']]); g.fillRect(0, 0, w, w);
    g.beginPath(); for (let i = 0; i < 10; i++) { const b = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 6.5 : 16; g.lineTo(c0 + Math.cos(b) * r, c0 + Math.sin(b) * r); } g.closePath();
    g.fillStyle = rg(g, c0, c0, 16, [[0, '#FFFFFF'], [0.45, '#E8FBFF'], [1, 'rgba(95,232,255,0.9)']]); g.fill(); g.strokeStyle = 'rgba(160,245,255,0.95)'; g.lineWidth = 1.2; g.stroke(); });
  // a glint on the water: a flat streak of light
  const glintSpr = () => fxSprite('wu3glint', 64, 16, (g, w, h) => { g.fillStyle = rg(g, w / 2, h / 2, w / 2, [[0, 'rgba(255,255,255,0.95)'], [0.2, 'rgba(160,245,255,0.6)'], [0.6, 'rgba(95,232,255,0.15)'], [1, 'rgba(95,232,255,0)']]); g.save(); g.translate(0, h / 2); g.scale(1, h / w); g.fillRect(0, -w / 2, w, w); g.restore(); });
  // the sigil's outer band: a thin double line with ticks and four small diamonds
  const bandA = () => fxSprite('wu3bandA', 128, 128, (g, w) => { const c0 = w / 2; g.translate(c0, c0);
    for (const [col, lw] of [['rgba(95,232,255,0.45)', 4], ['rgba(232,251,255,0.95)', 1.3]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, 54, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, 47, 0, TAU); g.stroke(); }
    g.strokeStyle = 'rgba(160,245,255,0.85)'; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i < 24; i++) { const b = i * TAU / 24, a = i % 2 ? 48 : 46; g.moveTo(Math.cos(b) * a, Math.sin(b) * a); g.lineTo(Math.cos(b) * 53, Math.sin(b) * 53); } g.stroke();
    g.fillStyle = 'rgba(232,251,255,0.95)'; for (let i = 0; i < 4; i++) { const b = i * TAU / 4; g.save(); g.rotate(b); g.beginPath(); g.moveTo(58, 0); g.lineTo(51, -3.5); g.lineTo(44, 0); g.lineTo(51, 3.5); g.closePath(); g.fill(); g.restore(); } });
  // the inner band: one thin ring with eight dots and short arcs
  const bandB = () => fxSprite('wu3bandB', 128, 128, (g, w) => { const c0 = w / 2; g.translate(c0, c0);
    for (const [col, lw] of [['rgba(63,208,224,0.4)', 3.5], ['rgba(200,250,255,0.9)', 1.1]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.arc(0, 0, 36, 0, TAU); g.stroke(); }
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(160,245,255,0.8)'; for (let i = 0; i < 8; i++) { const b = i * TAU / 8; g.beginPath(); g.arc(0, 0, 30, b + 0.12, b + 0.55); g.stroke(); g.fillStyle = '#E8FBFF'; g.beginPath(); g.arc(Math.cos(b) * 36, Math.sin(b) * 36, 2.2, 0, TAU); g.fill(); } });
  // the Celestial third band: a ring of open triangles
  const bandC = () => fxSprite('wu3bandC', 160, 160, (g, w) => { const c0 = w / 2; g.translate(c0, c0); g.strokeStyle = 'rgba(160,245,255,0.75)'; g.lineWidth = 1.1;
    g.beginPath(); g.arc(0, 0, 70, 0, TAU); g.stroke(); for (let i = 0; i < 12; i++) { const b = i * TAU / 12; g.save(); g.rotate(b); g.beginPath(); g.moveTo(70, -5); g.lineTo(78, 0); g.lineTo(70, 5); g.stroke(); g.restore(); } });
  // the heart of the sigil: a translucent diamond with a four-pointed star in it
  const coreSpr = () => fxSprite('wu3core', 64, 64, (g, w) => { const c0 = w / 2; g.fillStyle = rg(g, c0, c0, c0, [[0, 'rgba(95,232,255,0.5)'], [1, 'rgba(95,232,255,0)']]); g.fillRect(0, 0, w, w); g.translate(c0, c0);
    g.beginPath(); g.moveTo(0, -24); g.lineTo(15, 0); g.lineTo(0, 24); g.lineTo(-15, 0); g.closePath(); g.fillStyle = 'rgba(30,110,200,0.45)'; g.fill(); g.strokeStyle = 'rgba(232,251,255,0.95)'; g.lineWidth = 1.5; g.stroke();
    g.beginPath(); for (let i = 0; i < 8; i++) { const b = -Math.PI / 2 + i * Math.PI / 4, r = i % 2 ? 3 : 13; g.lineTo(Math.cos(b) * r, Math.sin(b) * r); } g.closePath(); g.fillStyle = '#FFFFFF'; g.fill(); });
  const blitR = (c, img, x, y, s, a, rot, sy) => { if (!(a > 0.01)) return; c.save(); c.translate(x, y); if (sy) c.scale(1, sy); if (rot) c.rotate(rot); c.globalAlpha = Math.min(1, a); c.drawImage(img, -s / 2, -s / 2, s, s); c.restore(); };

  U.aquaillusion = (C, H) => {
    const me = H.me, x = me.x, y = me.y, ev = Math.max(1, Math.min(7, C.evo || 1)), cel = ev >= 7;
    const DUR = ev <= 4 ? 5 + (ev - 1) * 2 / 3 : 7 + (ev - 4), T0 = 0.3, TB = T0 + DUR, LIFE = TB + 0.9;
    const R = (6 + 0.25 * (ev - 1)) * C.K, ek = 1 + 0.08 * (ev - 1), splash = C.base * C.K * ek * 3.2;
    H.X.banner('SHINY AQUA ILLUSION', '', C.col, 1.5); H.X.sfx.hum();
    [poolSpr, sheenSpr, starSpr, glintSpr, bandA, bandB, bandC, coreSpr].forEach(f => f());
    // the stars: spread over the pool, at different heights, drifting and turning slowly
    const NS = H.n(22 + 5 * ev), stars = [];
    for (let i = 0; i < NS; i++) { const b = R1(i * 2.3) * TAU, d = R * 0.92 * Math.sqrt(0.04 + 0.96 * R1(i * 5.7 + 1));
      stars.push({ x: x + Math.cos(b) * d, y: y + Math.sin(b) * d, z: 0.5 + 2.4 * R1(i * 3.3 + 2), sz: 0.3 + 0.32 * R1(i * 9.1), rot: R1(i) * TAU, vr: (R1(i * 4.4) - 0.5) * 0.8, ph: R1(i * 6.6) * TAU, s: 0.25 + 0.7 * R1(i * 8.2), vx: (R1(i * 1.9) - 0.5) * 0.3, vy: (R1(i * 2.9) - 0.5) * 0.2 }); }
    // the constellations (Celestial): each star to its nearest later neighbour, if near
    const links = []; if (ev >= 5) for (let i = 0; i < NS; i++) { let bj = -1, bd = 2.6; for (let j = i + 1; j < NS; j++) { const d = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y); if (d < bd) { bd = d; bj = j; } } if (bj >= 0 && links.length < NS * (cel ? 0.8 : 0.4)) links.push([i, bj]); }
    const marks = [];
    const finish = e => { if (e.m.aquaCurse === e.cu) delete e.m.aquaCurse; };
    H.add({ life: LIFE, x, y, cursed: false,
      update(dt, f) {
        const t = f.t;
        for (const s of stars) { s.x += (s.vx + Math.sin(t * 0.7 + s.ph) * 0.08) * dt; s.y += (s.vy + Math.cos(t * 0.6 + s.ph) * 0.06) * dt; s.rot += s.vr * dt; if (t > TB) s.z += dt * 1.2; }
        if (!f.cursed && t >= T0) { f.cursed = true;
          // the curse: every monster on the field now
          for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) > R + m.r || m.aquaCurse) continue;
            const cu = { rec: 0, end: H.g.t + DUR + 0.2 }; m.aquaCurse = cu; marks.push({ m, cu, last: 0, pulse: 0, beads: 0, ph: R1(marks.length * 3.7) * TAU, done: false });
            if (m.boss) { m.stun = Math.max(m.stun || 0, 0.6); m.chill = Math.max(m.chill || 0, 1.5); } }
          H.hitArea(x, y, R, splash, C.dmgO({}));
          H.X.ring(x, y, 0.4, R, 0.5, AQ, 0.2); H.X.shake(4, 0.2); H.X.sfx.splash && H.X.sfx.splash(); }
        for (const e of marks) { if (e.done) continue; const m = e.m;
          if (m.dead) { e.done = true; finish(e); continue; }
          if (!m.boss) m.stun = Math.max(m.stun || 0, 0.12);   // held still for the whole curse (a boss had its short root)
          if (e.cu.rec > e.last + 0.5) { e.last = e.cu.rec; e.pulse = 1; e.beads = Math.min(16, e.beads + 1); }
          e.pulse = Math.max(0, e.pulse - dt * 3.5);
          const tc = t - (TB - 0.45);
          if (tc > 0 && Math.random() < 0.8 * H.Q()) { const q = Math.random() * TAU, rr = 1.3 + m.r; H.P({ kind: 'spark', x: m.x + Math.cos(q) * rr, y: m.y + Math.sin(q) * rr * 0.6 - 0.4, vx: -Math.cos(q) * rr * 2.6, vy: -Math.sin(q) * rr * 1.6, life: 0.32, max: 0.32, size: 2.4, color: Math.random() < 0.5 ? AQ : WH }); }
          if (t >= TB) { e.done = true; e.bT = t; const amt = e.cu.rec * 0.1; finish(e);
            // the burst: 10% of what it recorded; not recorded itself, not amplified again
            if (amt > 0) H.X.hitMon(m, amt, C.dmgO({ aquaBurst: true, flat: true, noAggro: true }));
            H.X.boom(m.x, m.y, 1.1 + m.r * 0.5, AQ, WH, { n: 18, shake: 5 }); H.X.ring(m.x, m.y, 0.2, 1.8 + m.r, 0.45, AQ, 0.22);
            H.burst(m.x, m.y - 0.3, 'bubble', 10, { v: 4.5, up: 3, g: 9, life: 0.7, size: 4, color: ['#CFF6FF', AQ, WH] });
            H.burst(m.x, m.y - 0.6, 'spark', 12, { v: 6, life: 0.5, size: 2.6, color: [AQ, WH, '#E8FBFF'] }); } }
      },
      onEnd() { for (const e of marks) finish(e); },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, fa = cl(Math.min(t / 0.25, (LIFE - t) / 0.7)), sp = H.ease.out(cl(t / 0.45)), Rp = R * T * sp, GY = H.GY;
        if (Rp < 2) return;
        // the dark water
        c.save(); c.globalAlpha = fa; c.drawImage(poolSpr(), X - Rp * 1.04, Y - Rp * 1.04 * GY, Rp * 2.08, Rp * 2.08 * GY); c.restore();
        // moving reflections, clipped to the pool
        c.save(); H.floorEllipse(c, X, Y, Rp * 0.97); c.clip(); c.globalCompositeOperation = 'lighter';
        const sh = sheenSpr(), tw = Rp * 1.1;
        for (let k = 0; k < 2; k++) { const ox = ((t * (k ? -9 : 13) / tw) % 1) * tw; c.globalAlpha = fa * (k ? 0.26 : 0.38);
          for (let i = -2; i <= 1; i++) for (let j = -1; j <= 0; j++) c.drawImage(sh, X + ox + i * tw + (k ? tw * 0.5 : 0), Y + j * tw * GY + (k ? tw * GY * 0.3 : 0), tw, tw * GY); }
        // slow concentric currents (Celestial: more, and dashed arcs turning both ways)
        const NC = cel ? 6 : ev >= 4 ? 4 : 3;
        for (let k = 0; k < NC; k++) { const u = (t * 0.09 + k / NC) % 1, rr = Rp * (0.12 + 0.86 * u); c.globalAlpha = fa * 0.4 * Math.sin(u * Math.PI); c.strokeStyle = k % 2 ? AQ : TQ; c.lineWidth = 1.6; H.floorEllipse(c, X, Y, rr); c.stroke(); }
        if (ev >= 4) for (let k = 0; k < (cel ? 3 : 1); k++) { const rr = Rp * (0.35 + 0.22 * k), dir = k % 2 ? -1 : 1; c.strokeStyle = 'rgba(160,245,255,0.9)'; c.lineWidth = 1.2; c.globalAlpha = fa * 0.35;
          for (let s = 0; s < 4; s++) { const a0 = dir * t * (0.25 - 0.05 * k) + s * TAU / 4 + k; c.beginPath(); c.ellipse(X, Y, rr, rr * GY, 0, a0, a0 + 0.9); c.stroke(); } }
        // the star reflections: glints on the water under each star
        const gl = glintSpr(), late = cl((t - (TB - 1)) / 1), sfa = cl(Math.min((t - 0.25) / 0.6, (TB + 0.35 - t) / 0.35));
        for (const s of stars) { const a = sfa * fa * (0.3 + 0.35 * Math.sin(t * 2.4 + s.ph * 3)) * (1 + late * 0.8); if (a < 0.02) continue;
          const w = T * s.sz * (1.6 + 0.5 * Math.sin(t * 1.7 + s.ph)) * (1 + late * 0.4); c.globalAlpha = Math.min(1, a); c.drawImage(gl, H.sx(s.x) - w / 2, H.sy(s.y) - w * 0.125, w, w * 0.25); }
        c.restore();
        // the luminous boundary, its leading edge brighter while it spreads
        c.save(); c.globalCompositeOperation = 'lighter';
        c.globalAlpha = fa * (0.4 + 0.5 * (1 - sp)); c.strokeStyle = AQ; c.lineWidth = 4 + 6 * (1 - sp); H.floorEllipse(c, X, Y, Rp); c.stroke();
        c.globalAlpha = fa * 0.9; c.strokeStyle = '#E8FBFF'; c.lineWidth = 1.3; H.floorEllipse(c, X, Y, Rp); c.stroke();
        for (let k = 0; k < 3; k++) { const b = t * 0.5 + k * TAU / 3; H.glow(c, X + Math.cos(b) * Rp, Y + Math.sin(b) * Rp * GY, T * 0.35, AQ, fa * 0.7); }
        // the rings at the cursed monsters' feet (Celestial: a floor sigil turning the other way)
        for (const e of marks) { const m = e.m; if (m.dead && !e.bT) continue; const bt = e.bT ? t - e.bT : -1; if (bt > 0.5) continue;
          const mx = H.sx(m.x), r = m.r * T, my = H.sy(m.y) + r * 0.82, a = fa * cl((t - T0) / 0.3) * (bt >= 0 ? 1 - bt / 0.5 : 1), k = 1 + 0.15 * e.pulse + (bt >= 0 ? bt * 2 : 0);
          c.globalAlpha = a * 0.5; c.strokeStyle = AQ; c.lineWidth = 3.5; c.beginPath(); c.ellipse(mx, my, r * 1.25 * k, r * 0.42 * k, 0, 0, TAU); c.stroke();
          c.globalAlpha = a * 0.95; c.strokeStyle = WH; c.lineWidth = 1.2; c.stroke();
          H.glow(c, mx, my, r * 1.3, AQ, a * (0.25 + 0.3 * e.pulse));
          if (cel) blitR(c, bandC(), mx, my, r * 3.4 * k, a * 0.6, -t * 0.6 + e.ph, GY); }
        c.restore();
      },
      draw(c, f, X, Y, T) {
        const t = f.t, fa = cl(Math.min(t / 0.25, (LIFE - t) / 0.7)), late = cl((t - (TB - 1)) / 1), sfa = cl(Math.min((t - 0.25) / 0.6, (TB + 0.35 - t) / 0.35));
        // the stars, kept off the pet
        c.save(); const px = H.sx(me.x), py = H.sy(me.y) - T * 0.46; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 2e5); c.ellipse(px, py, T * 0.62, T * 0.74, 0, 0, TAU); c.clip('evenodd');
        c.globalCompositeOperation = 'lighter';
        if (links.length && sfa > 0.02) { c.strokeStyle = 'rgba(160,245,255,1)'; c.lineWidth = 1; for (const [i, j] of links) { const p = stars[i], q = stars[j], ap = cl(Math.min((t - 0.5 - p.s) / 0.5, (t - 0.5 - q.s) / 0.5)); if (ap <= 0) continue;
          c.globalAlpha = sfa * fa * ap * (0.18 + 0.12 * Math.sin(t * 1.3 + i)) * (1 + late); c.beginPath(); c.moveTo(H.sx(p.x), H.sy(p.y) - p.z * T); c.lineTo(H.sx(q.x), H.sy(q.y) - q.z * T); c.stroke(); } }
        const ss = starSpr();
        for (const s of stars) { const ap = cl((t - s.s) / 0.5) * sfa * fa; if (ap < 0.02) continue; const tw = 0.75 + 0.25 * Math.sin(t * 3 + s.ph * 2), sz = T * s.sz * 2 * (1 + late * 0.5) * (t > TB ? 1 - cl((t - TB) / 0.35) * 0.6 : 1);
          blitR(c, ss, H.sx(s.x), H.sy(s.y) - s.z * T, sz, ap * tw * (0.8 + late * 0.4), s.rot); }
        c.restore();
        // the sigils over the cursed monsters: two bands round a diamond and a star, beads, a draining outer ring
        if (t < T0) return;
        const A = bandA(), B = bandB(), Cc = bandC(), Co = coreSpr();
        for (const e of marks) { const m = e.m; if (e.bT != null) { const bt = t - e.bT; if (bt < 0.4) H.glow(c, H.sx(m.x), H.sy(m.y) - m.r * T, T * (1 + bt * 4), AQ, (1 - bt / 0.4) * 0.9); continue; } if (m.dead) continue;
          const r = m.r * T, mx = H.sx(m.x), my = H.sy(m.y) - (m.z || 0) * T - r - T * 0.62, tc = cl((t - (TB - 0.45)) / 0.45), con = 1 - 0.75 * H.ease.in(tc);
          const S = T * 0.8 * (1 + 0.22 * e.pulse) * con * H.ease.back(cl((t - T0) / 0.35)), a = fa * (0.85 + 0.15 * e.pulse + tc * 0.3);
          c.save(); c.globalCompositeOperation = 'lighter';
          H.glow(c, mx, my, S * 0.9, AQ, 0.25 + 0.5 * e.pulse + tc * 0.4);
          blitR(c, A, mx, my, S, a, t * 0.5 + e.ph, 0.9);
          blitR(c, B, mx, my, S, a, -t * 0.8 - e.ph, 0.9);
          if (cel) blitR(c, Cc, mx, my, S * 1.25, a * 0.7, t * 0.35 + e.ph * 2, 0.9);
          blitR(c, Co, mx, my, S * 0.5 * (1 + 0.3 * e.pulse), a, 0, 0);
          // the time left: the outer ring drains
          const rem = cl(1 - (t - T0) / DUR); c.globalAlpha = a; c.strokeStyle = AQ; c.lineWidth = 2.2; c.beginPath(); c.ellipse(mx, my, S * 0.56, S * 0.5, 0, -Math.PI / 2, -Math.PI / 2 + TAU * rem); c.stroke();
          c.strokeStyle = WH; c.lineWidth = 0.9; c.stroke();
          // the beads: one for each hit, collected along the band
          for (let i = 0; i < e.beads; i++) { const b = -Math.PI / 2 + (i + 0.5) * TAU / 16 + t * 0.3; H.glow(c, mx + Math.cos(b) * S * 0.37, my + Math.sin(b) * S * 0.33, T * 0.11, WH, a); }
          c.restore(); }
      } });
  };
})();
