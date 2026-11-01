/* ---------- Light (pink), reworked: Salvation ----------
   A luminous heart draws itself on the floor beneath the pet (from its point up both sides to the cleft) and fills with
   soft light; thin pink ribbons rise from its rim and curve out to every teammate: the summoned Animas on the field, and
   the benched or fallen party members up in the switch strip of the HUD (the ribbon ends on the pet's little card there).
   The centre fills with pearl-white light and releases a broad, gentle pink pulse: at that moment every pet in the party
   is restored to full health and every fallen one is revived at full health (restoreParty in 20b-game-dungeon.js, at
   every level). The caster and the living get a soft heart halo and rising stars; each revived pet's card gets a
   brighter heart outline under a short column of pink light with sparkles rising, and the game's switch-in chime.
   Adept: a ring seal under the heart, three pulse rings, broader ribbons, a rising heart outline at each revival.
   Celestial: a grand five-pointed seal beneath the heart, seven light rings, broad two-tone ribbons, rising heart
   outlines and spiralling pearl stars at each revival, ending in a gentle shower of pink motes. No damage. */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2;
  delete U.solarengine;
  let H;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73', LAV = '#D5C4FF';
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const mixS = (h1, h2, k) => { const a = hexRGB(h1), b = hexRGB(h2); return '#' + [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k).toString(16).padStart(2, '0')).join(''); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));

  /* ---- the heart curve (as in 20k4b): lobes up, point down, centred; index 0 the cleft, HHALF the point ---- */
  const HP = (() => { const N = 96, pts = []; for (let i = 0; i <= N; i++) { const t = i / N * TAU, s = Math.sin(t); pts.push([16 * s * s * s / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); } return pts; })();
  const HN = HP.length - 1, HHALF = HN / 2;
  function heartPath(g, s, ox, oy, sy) { g.beginPath(); for (let i = 0; i < HN; i++) { const p = HP[i]; const x = (ox || 0) + p[0] * s, y = (oy || 0) + p[1] * s * (sy || 1); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  function partHeart(c, s, ox, oy, sy, u) { const k = Math.round(HHALF * cl(u)); if (k < 1) return false; c.beginPath(); for (let i = HHALF - k; i <= HHALF + k; i++) { const p = HP[i]; const x = ox + p[0] * s, y = oy + p[1] * s * sy; i === HHALF - k ? c.moveTo(x, y) : c.lineTo(x, y); } return true; }

  /* ---- cached sprites (own keys; copies of 20k4b's look): 160 px square, heart unit 64 px, centre (80, 74) ---- */
  const SW = 160, SU = 64, SCX = 80, SCY = 74;
  const lineSpr = () => fxSprite('lu5line', SW, SW, g => { g.translate(SCX, SCY); g.lineJoin = 'round'; for (const [col, lw] of [['rgba(255,92,203,0.18)', 16], ['rgba(255,92,203,0.35)', 9], ['rgba(255,143,219,0.8)', 4.5], ['rgba(255,244,252,1)', 1.8]]) { heartPath(g, SU * 0.9); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); } });
  const fillSpr = () => fxSprite('lu5fill', SW, SW, g => { g.translate(SCX, SCY); for (let k = 0; k < 5; k++) { heartPath(g, SU * (1.02 - k * 0.12), 0, SU * k * 0.03); g.fillStyle = `rgba(255,92,203,${0.1 + k * 0.03})`; g.fill(); } const gr = g.createRadialGradient(0, SU * 0.2, 0, 0, SU * 0.2, SU * 0.6); gr.addColorStop(0, 'rgba(255,244,252,0.75)'); gr.addColorStop(0.5, 'rgba(255,212,238,0.3)'); gr.addColorStop(1, 'rgba(255,212,238,0)'); heartPath(g, SU * 0.8, 0, SU * 0.05); g.fillStyle = gr; g.fill(); });
  const smallSpr = col => fxSprite('lu5sh' + col, 40, 40, g => { let gr = g.createRadialGradient(20, 20, 0, 20, 20, 20); gr.addColorStop(0, rgbaS(col, 0.55)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 40, 40); gr = g.createRadialGradient(17, 17, 0, 20, 21, 10); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, mixS(col, DEEP, 0.35)); heartPath(g, 10, 20, 19); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.6); g.lineWidth = 1; g.stroke(); });
  const starSpr = col => fxSprite('lu5st' + col, 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, rgbaS(col, 0.7)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8.5, b = -Math.PI / 2 + i * Math.PI / 5; i ? g.lineTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r) : g.moveTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r); } g.closePath(); g.fillStyle = PEARL; g.fill(); g.strokeStyle = rgbaS(col, 0.9); g.lineWidth = 1; g.stroke(); });
  /* a short column of pink light, feathered at both ends and both sides, a pearl core (revivals) */
  const colSpr = () => fxSprite('lu5col', 48, 160, g => { for (let y = 0; y < 160; y++) { const v = y / 159, a = sm(v / 0.35) * sm((1 - v) / 0.12); const gr = g.createLinearGradient(0, 0, 48, 0); gr.addColorStop(0, 'rgba(255,92,203,0)'); gr.addColorStop(0.25, `rgba(255,92,203,${0.35 * a})`); gr.addColorStop(0.42, `rgba(255,143,219,${0.75 * a})`); gr.addColorStop(0.5, `rgba(255,244,252,${0.95 * a})`); gr.addColorStop(0.58, `rgba(255,143,219,${0.75 * a})`); gr.addColorStop(0.75, `rgba(255,92,203,${0.35 * a})`); gr.addColorStop(1, 'rgba(255,92,203,0)'); g.fillStyle = gr; g.fillRect(0, y, 48, 1); } });
  function blitC(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || w < 0.5) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); }
  const glowC = (c, x, y, r, col, a) => blitC(c, glowSprite(col), x, y, r * 2, r * 2, a, true);
  /* little hearts and stars: in the world (x, y tiles, z height) or on the screen (scr: x, y pixels, z unused) */
  function bits(scr) { const L = []; return { L,
    add(x, y, z, o) { L.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.18, col: ROSE, kind: 'h', rot: 0, g: 0, drag: 1.2, sp: 0, sr: 0 }, o)); },
    step(dt) { for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.t += dt; if (p.t >= p.life) { L.splice(i, 1); continue; } const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = scr ? p.z + p.vz * dt : Math.max(0, p.z + p.vz * dt); } },
    draw(c, T, fa) { for (const p of L) { const u = p.t / p.life, a = Math.min(1, u * 6) * (1 - u) * (fa == null ? 1 : fa), r = p.s * T * (p.kind === 'h' ? 1.6 : 1.3) * (1 - 0.3 * u); if (a < 0.02) continue;
      let X, Y; if (scr) { const sa = p.sp * p.t; X = p.x + Math.cos(sa) * p.sr; Y = p.y - p.z + Math.sin(sa) * p.sr * 0.4; } else { X = H.sx(p.x); Y = H.sy(p.y) - p.z * T; }
      c.save(); c.globalAlpha = a; c.globalCompositeOperation = p.kind === 'h' ? 'source-over' : 'lighter'; c.translate(X, Y); if (p.rot) c.rotate(p.rot * Math.sin(p.t * 3)); c.drawImage(p.kind === 'h' ? smallSpr(p.col) : p.kind === 'o' ? lineSpr() : starSpr(p.col), -r, -r, r * 2, r * 2); c.restore(); } } }; }

  /* a ribbon of light along screen points pts (feathered at both ends): a rose glow, a candy (or two-tone twisting) body,
     a pearl core line; grow 0..1 is how far along it has reached, from 0..1 the tail retracts toward the end */
  function ribbon(c, pts, wid, a, grow, from, t, broad, clipA) {
    const N = pts.length - 1, n1 = Math.max(1, Math.round(N * cl(grow))), n0 = Math.min(n1, Math.round(N * cl(from)));
    if (n1 - n0 < 1 || !(a > 0.01)) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'butt';   // (butt ends: round caps overlapping under 'lighter' bead the strip)
    for (let L = 0; L < 3; L++) for (let i = n0; i < n1; i++) {
      const u = (i - n0 + 0.5) / Math.max(1, n1 - n0), fe = sm(u / 0.15) * sm((1 - u) / 0.15) * (clipA ? clipA(pts[i]) : 1), w0 = i / N;
      if (fe < 0.02) continue;
      const tw = Math.cos(w0 * 9 - t * 3.2), ws = broad ? 0.55 + 0.45 * Math.abs(tw) : 1;
      c.beginPath(); c.moveTo(pts[i][0], pts[i][1]); c.lineTo(pts[i + 1][0], pts[i + 1][1]);
      if (L === 0) { c.globalAlpha = 0.22 * a * fe; c.strokeStyle = ROSE; c.lineWidth = wid * 3.2 * ws; }
      else if (L === 1) { c.globalAlpha = 0.75 * a * fe; c.strokeStyle = broad ? (tw > 0 ? CANDY : MAG) : CANDY; c.lineWidth = wid * ws; }
      else { c.globalAlpha = 0.9 * a * fe; c.strokeStyle = broad && tw < 0 ? BLUSH : PEARL; c.lineWidth = Math.max(0.8, wid * 0.32 * ws); }
      c.stroke(); }
    c.restore();
  }
  /* a cubic from a, through b and c, to d (screen points) */
  const cub = (a, b, c2, d, N) => { const out = []; for (let i = 0; i <= N; i++) { const q = i / N, m = 1 - q; out.push([m * m * m * a[0] + 3 * m * m * q * b[0] + 3 * m * q * q * c2[0] + q * q * q * d[0], m * m * m * a[1] + 3 * m * m * q * b[1] + 3 * m * q * q * c2[1] + q * q * q * d[1]]); } return out; };

  /* ================= Salvation ================= */
  U.salvation = (C, h) => {
    H = h; const me = H.me, X0 = H.X, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const GR = 1.45 + 0.08 * (ev - 1), TP = [1.5, 1.6, 1.75][tier - 1], END = TP + [2.0, 2.2, 2.6][tier - 1];
    const NRING = [1, 3, 7][tier - 1], RGAP = tier === 3 ? 0.16 : 0.22, RMAX = 5 + 0.45 * ev, RW = [3, 5, 9][tier - 1], NDEC = [2, 4, 6][tier - 1];
    H.X.banner('SALVATION', '', ROSE, 1.4); H.X.sfx.hum();
    const B = bits(false), S = bits(true), rings = [];
    let hx = me.x, hy = me.y, done = null, revN = 0;
    // who the ribbons reach: the benched or fallen party members (their cards in the HUD's switch strip), and Animas
    const party = X0.party ? X0.party() : [], mates = [];
    party.forEach((m, i) => { if (X0.partySlot && X0.partySlot(i)) mates.push({ kind: 'slot', i, down: !!m.down, sd: i * 3.7 + 1, rev: false }); });
    const anim = X0.animas ? X0.animas() : []; anim.forEach((a, k) => { if (a.st !== 'leave') mates.push({ kind: 'anima', a, sd: k * 5.3 + 9 }); });
    const dec = []; for (let k = 0; k < NDEC; k++) dec.push({ side: k % 2 ? 1 : -1, j: Math.floor(k / 2), sd: k * 2.9 + 4 });
    // the end of a teammate's ribbon, in screen pixels
    const endOf = m => { if (m.kind === 'slot') { const s = X0.partySlot(m.i); return s ? [s.x, s.y + 6] : null; } return [H.sx(m.a.x), H.sy(m.a.y) - H.X.Tz() * 0.5]; };
    // a point on the floor heart's rim facing screen direction (dx, dy), relative to its centre (screen)
    const rimAt = (cx, cy, s, dx, dy) => { let best = 0, bd = -2; const L = Math.hypot(dx, dy) || 1; for (let i = 0; i < HN; i += 2) { const p = HP[i], l = Math.hypot(p[0], p[1] * H.GY) || 1, d = (p[0] * dx + p[1] * H.GY * dy) / (l * L); if (d > bd) { bd = d; best = i; } } const p = HP[best]; return [cx + p[0] * s, cy + p[1] * s * H.GY]; };
    function pulse() {
      const res = X0.restoreParty ? X0.restoreParty() : (() => { H.X.heal(H.X.ST().hp * 2, true); return [{ mine: true, down: false, gain: 0 }]; })();
      done = res; H.X.light(hx, hy, 6, 0.6); H.X.sfx.sparkle && H.X.sfx.sparkle();
      for (let k = 0; k < NRING; k++) rings.push({ t: -k * RGAP, k });
      const mine = res.find(r => r.mine); if (mine && mine.gain >= 1) H.X.text(me.x, me.y - 1.3, '+' + Math.round(mine.gain), BLUSH, 15);
      for (const r of res) if (r.down) { revN++; const m = mates.find(q => q.kind === 'slot' && q.i === r.i); if (m) m.rev = true; }
      if (revN) { H.X.sfx.chirp && H.X.sfx.chirp(); H.X.text(me.x, me.y - 1.75, revN > 1 ? revN + ' revived!' : 'Revived!', PEARL, 14); }
      // the caster's halo stars, rising
      const nb = H.n(10 + 4 * tier); for (let q = 0; q < nb; q++) { const b = q / nb * TAU, r = 0.35 + Math.random() * 0.3; B.add(me.x + Math.cos(b) * r, me.y + Math.sin(b) * r * 0.6, 0.1 + Math.random() * 0.4, { vz: 1.1 + Math.random() * 1.0, vx: Math.cos(b) * 0.3, life: 1.0 + Math.random() * 0.6, s: 0.07 + Math.random() * 0.05, kind: q % 3 ? 's' : 'h', col: [PEARL, BLUSH, CANDY, tier === 3 ? LAV : ROSE][q % 4], drag: 0.6, rot: 0.4 }); }
      // the Animas' halos
      for (const m of mates) if (m.kind === 'anima') for (let q = 0; q < H.n(8); q++) { const b = Math.random() * TAU; B.add(m.a.x + Math.cos(b) * 0.4, m.a.y + Math.sin(b) * 0.25, 0.3, { vz: 1 + Math.random(), life: 1 + Math.random() * 0.5, s: 0.07, kind: q % 2 ? 's' : 'h', col: q % 2 ? PEARL : CANDY, drag: 0.6 }); }
      // the cards in the strip: stars rise round the living; sparkles (and from Adept heart outlines) round the revived
      for (const m of mates) { if (m.kind !== 'slot') continue; const e = endOf(m); if (!e) continue;
        const ns = H.n(m.rev ? 14 + 4 * tier : 7); for (let q = 0; q < ns; q++) S.add(e[0] + (Math.random() - 0.5) * 30, e[1] + 4, 0, { vz: (m.rev ? 26 : 18) + Math.random() * 26, vx: (Math.random() - 0.5) * 8, life: 0.9 + Math.random() * 0.7, s: 4 + Math.random() * 3, kind: q % 3 ? 's' : 'h', col: [PEARL, BLUSH, CANDY][q % 3], drag: 0.4, rot: 0.4 });
        if (m.rev && tier >= 2) for (let q = 0; q < (tier === 3 ? 3 : 1); q++) S.add(e[0], e[1] - 2, 0, { vz: 30, life: 1.2 + q * 0.15, s: 9 - q, kind: 'o', drag: 0.2, t: -q * 0.22 });
        if (m.rev && tier === 3) for (let q = 0; q < H.n(8); q++) S.add(e[0], e[1], 0, { vz: 22 + q * 3, life: 1.4, s: 3.5, kind: 's', col: PEARL, sp: 6 + q * 0.3, sr: 14, drag: 0, t: -q * 0.06 }); }
    }
    H.add({ life: END, x: hx, y: hy,
      update(dt, f) {
        const t = f.t, wasPre = t - dt < TP; B.step(dt); S.step(dt);
        if (!me.dead) { const k = 1 - Math.exp(-dt * 10); hx += (me.x - hx) * k; hy += (me.y - hy) * k; } f.x = hx; f.y = hy;
        for (const r of rings) r.t += dt;
        if (wasPre && t >= TP && !done) pulse();
        // tiny hearts rise from the floor heart while it gathers; motes shower over the revived at the end (Celestial)
        if (t < TP && Math.random() < dt * (5 + 3 * tier) * H.Q()) { const b = Math.random() * TAU, r = Math.sqrt(Math.random()) * GR * 0.75; B.add(hx + Math.cos(b) * r, hy + Math.sin(b) * r * 0.6, 0.05, { vz: 0.5 + Math.random() * 0.6, life: 0.9 + Math.random() * 0.5, s: 0.06 + Math.random() * 0.04, kind: Math.random() < 0.6 ? 'h' : 's', col: Math.random() < 0.6 ? CANDY : BLUSH, drag: 0.5, rot: 0.3 }); }
        if (tier === 3 && done && t > TP + 1.0 && t < TP + 1.9) for (const m of mates) if (m.rev && Math.random() < dt * 18 * H.Q()) { const e = endOf(m); if (e) S.add(e[0] + (Math.random() - 0.5) * 50, e[1] - 50 - Math.random() * 20, 0, { vz: -(18 + Math.random() * 20), vx: (Math.random() - 0.5) * 10, life: 0.9, s: 2.5 + Math.random() * 1.5, kind: 's', col: Math.random() < 0.6 ? CANDY : BLUSH, drag: 0.2 }); }
      },
      drawUnder(c, f, X, Y, T, t) {
        t = f.t; const fa = sm(t / 0.2) * (1 - sm((t - END + 0.8) / 0.8)), s = GR * T / 0.94, cy = Y - s * 0.2 * H.GY;
        const uL = sm(t / 0.75), uF = sm((t - 0.4) / 0.6), uC = sm((t - 0.85) / (TP - 0.85)), aft = done ? cl((t - TP) / 0.5) : 0;
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        c.globalAlpha = 0.45 * fa; c.drawImage(glowSprite(ROSE), X - s * 1.6, cy - s * 1.6 * H.GY, s * 3.2, s * 3.2 * H.GY);
        // the seal beneath the heart: a ring with star glints (Adept), a grand five-pointed seal in a double ring (Celestial)
        if (tier >= 2) { const us = sm((t - 0.1) / 0.8), sr = s * (tier === 3 ? 1.75 : 1.5) * (0.9 + 0.1 * us), ro = t * 0.25, sa = us * fa * (1 - 0.4 * aft);
          for (const [rr, lw, col, al] of [[1, 6, ROSE, 0.3], [1, 1.8, CANDY, 0.85], [0.9, 1.1, BLUSH, tier === 3 ? 0.7 : 0]]) { if (!al) continue; c.globalAlpha = al * sa; c.strokeStyle = col; c.lineWidth = lw; H.floorEllipse(c, X, cy, sr * rr); c.stroke(); }
          if (tier === 3) { const pts = []; for (let k = 0; k < 5; k++) { const b = ro - Math.PI / 2 + k * TAU / 5; pts.push([X + Math.cos(b) * sr * 0.9, cy + Math.sin(b) * sr * 0.9 * H.GY]); }
            c.beginPath(); for (let k = 0; k <= 5; k++) { const p = pts[(k * 2) % 5]; k ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); }
            c.globalAlpha = 0.3 * sa; c.strokeStyle = ROSE; c.lineWidth = 6; c.stroke(); c.globalAlpha = 0.8 * sa; c.strokeStyle = BLUSH; c.lineWidth = 1.5; c.stroke();
            for (const p of pts) { glowC(c, p[0], p[1], T * 0.45, CANDY, 0.5 * sa); blitC(c, starSpr(PEARL), p[0], p[1], T * 0.5, T * 0.5, sa, true); } }
          else for (let k = 0; k < 5; k++) { const b = ro + k * TAU / 5; blitC(c, starSpr(BLUSH), X + Math.cos(b) * sr, cy + Math.sin(b) * sr * H.GY, T * 0.36, T * 0.36, 0.85 * sa, true); } }
        // the floor heart: its line draws from the point up both sides; soft light fills it; the centre gathers pearl light
        if (uF > 0) { const k = s / (SU * 0.94) * 1.02, ps = 0.94 + 0.05 * Math.sin(t * 3) + 0.1 * (done ? Math.max(0, 1 - (t - TP) / 0.4) : 0); c.save(); c.translate(X, cy); c.scale(k * ps, k * ps * H.GY); c.globalAlpha = (0.6 + 0.25 * uC) * uF * fa; c.drawImage(fillSpr(), -SCX, -SCY); c.restore(); }
        const pc = uC * (1 - aft * 0.7) + (done ? Math.max(0, 1 - (t - TP) / 0.35) * 0.8 : 0);
        if (pc > 0.01) { c.globalAlpha = Math.min(1, 0.85 * pc) * fa; c.drawImage(glowSprite(PEARL), X - s * 0.7, cy + s * 0.1 * H.GY - s * 0.7 * H.GY, s * 1.4, s * 1.4 * H.GY); }
        const lines = tier === 3 ? [1, 0.8] : tier === 2 ? [1, 0.84] : [1];
        lines.forEach((ls, li) => { if (!partHeart(c, s * ls, X, cy + s * (1 - ls) * 0.2 * H.GY, H.GY, uL)) return; c.globalAlpha = 0.35 * fa; c.strokeStyle = ROSE; c.lineWidth = 8 - li * 3; c.stroke(); c.globalAlpha = 0.9 * fa; c.strokeStyle = li ? BLUSH : CANDY; c.lineWidth = 2.4 - li * 0.6; c.stroke(); c.globalAlpha = 0.8 * fa; c.strokeStyle = PEARL; c.lineWidth = 0.9; c.stroke();
          const kk = Math.round(HHALF * uL); if (uL < 1) { for (const j of [HHALF - kk, HHALF + kk]) { const p = HP[j]; glowC(c, X + p[0] * s * ls, cy + p[1] * s * ls * H.GY, T * 0.4, PEARL, fa); } }
          else for (let q = 0; q < 2; q++) { const idx = Math.floor((t * (li ? -0.3 : 0.3) + q / 2) * HN), p = HP[((idx % HN) + HN) % HN]; glowC(c, X + p[0] * s * ls, cy + p[1] * s * ls * H.GY + s * (1 - ls) * 0.2 * H.GY, T * 0.3, PEARL, 0.8 * fa); } });
        // the pulse: a broad gentle pink wave on the floor, then rings of light (1 / 3 / 7)
        for (const r of rings) { if (r.t <= 0) continue; const u = cl(r.t / 1.3), rr = T * (GR * 0.6 + (RMAX - (tier === 3 ? r.k * 0.35 : 0)) * H.ease.out(u)), a = (1 - u) * (1 - u);
          if (r.k === 0) { c.globalAlpha = 0.42 * a; c.drawImage(glowSprite(CANDY), X - rr, Y - rr * H.GY, rr * 2, rr * 2 * H.GY); }
          c.globalAlpha = 0.3 * a; c.strokeStyle = ROSE; c.lineWidth = (r.k ? 5 : 12) * (1 - u) + 2; H.floorEllipse(c, X, Y, rr); c.stroke();
          c.globalAlpha = 0.8 * a; c.strokeStyle = r.k % 2 ? BLUSH : CANDY; c.lineWidth = (r.k ? 1.4 : 2.4); c.stroke();
          c.globalAlpha = 0.6 * a; c.strokeStyle = PEARL; c.lineWidth = 0.8; c.stroke(); }
        c.restore();
        // the ribbons, on the floor layer so they never cover the pet (the ends up in the strip are redrawn over the HUD)
        const uR = sm((t - 0.35) / 0.95), uOut = done ? sm((t - TP - 0.35) / 0.9) : 0, rA = fa * (1 - uOut * 0.2);
        for (const m of mates) { const e = endOf(m); if (!e) continue; const p0 = rimAt(X, cy, s, e[0] - X, e[1] - cy), ox = p0[0] - X, oy = p0[1] - cy, ol = Math.hypot(ox, oy) || 1, wv = Math.sin(t * 2.2 + m.sd) * T * 0.4;
          const pts = cub(p0, [p0[0] + ox / ol * T * 1.2, p0[1] - T * 2.2], [e[0] - (e[0] - X) * 0.25 + wv, e[1] + T * 2.0], e, 34); m.pts = pts;
          ribbon(c, pts, RW, rA, uR, uOut, t + m.sd, tier === 3);
          if (uR > 0 && uR < 1) { const hp = pts[Math.round(uR * 34)]; glowC(c, hp[0], hp[1], T * 0.35, PEARL, 0.9 * fa); } }
        for (const d of dec) { const b = d.side * (0.55 + d.j * 0.45), p0 = rimAt(X, cy, s, Math.sin(b), -Math.cos(b) * 0.3), sw2 = Math.sin(t * 1.8 + d.sd) * T * 0.3, ht = T * (2.3 + 0.5 * d.j + 0.4 * R1(d.sd));
          const pts = cub(p0, [p0[0] + d.side * T * (0.9 + d.j * 0.3), p0[1] - ht * 0.35], [p0[0] + d.side * T * (0.2 + 0.4 * d.j) + sw2, p0[1] - ht * 0.8], [p0[0] - d.side * T * 0.35 + sw2, p0[1] - ht], 24);
          ribbon(c, pts, RW * 0.7, fa * 0.8 * (1 - uOut), sm((t - 0.3 - d.j * 0.08) / 0.9), done ? uOut : 0, t + d.sd, tier === 3, p => cl(Math.hypot(p[0] - H.sx(me.x), (p[1] - (H.sy(me.y) - T * 0.5)) * 0.8) / (T * 0.9) - 0.15)); }
      },
      draw(c, f, X, Y, T, t) {
        t = f.t; if (!done) { B.draw(c, T); return; }
        // the caster's soft heart halo: a heart outline round its feet that swells and fades, under rising stars
        const u = cl((t - TP) / 1.2), px = H.sx(me.x), py = H.sy(me.y);
        if (u < 1) { const k = T * (1.3 + 0.5 * H.ease.out(u)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * (1 - u); c.translate(px, py - T * 0.05); c.scale(k / SU, k / SU * H.GY); c.drawImage(lineSpr(), -SCX, -SCY); c.restore(); }
        for (const m of mates) if (m.kind === 'anima' && u < 1) { const ax = H.sx(m.a.x), ay = H.sy(m.a.y), k = T * (1.1 + 0.4 * u); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * (1 - u); c.translate(ax, ay); c.scale(k / SU, k / SU * H.GY); c.drawImage(lineSpr(), -SCX, -SCY); c.restore(); }
        B.draw(c, T);
      },
      drawHud(c, f, X, Y, T, t) {
        t = f.t; const fa = 1 - sm((t - END + 0.8) / 0.8);
        // the ribbons' ends, over the strip
        const uR = sm((t - 0.35) / 0.95), uOut = done ? sm((t - TP - 0.35) / 0.9) : 0;
        mates.forEach(m => { if (m.kind !== 'slot' || !m.pts || !endOf(m)) return; const pts = m.pts, e = pts[pts.length - 1];
          ribbon(c, pts, RW, fa, uR, uOut, t + m.sd, tier === 3, p => cl(1 - Math.hypot(p[0] - e[0], p[1] - e[1]) / 70)); });
        for (const m of mates) { if (m.kind !== 'slot') continue; const e = endOf(m); if (!e) continue;
          if (!done) { const a = sm((t - 1.1) / 0.4) * fa; glowC(c, e[0], e[1] - 4, 22, ROSE, 0.35 * a); continue; }
          const v = t - TP;
          if (m.rev) { // the revived: a brighter heart outline under a short column of light
            const ca = sm(v / 0.15) * (1 - sm((v - 0.8) / 0.7)), ch = 70 * H.ease.out(cl(v / 0.3));
            blitC(c, colSpr(), e[0], e[1] - ch / 2 + 6, 26, ch, ca * fa, true);
            const ha = sm(v / 0.12) * (1 - sm((v - 1.2) / 0.8)), hs = 34 + 4 * Math.sin(v * 8);
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = ha * fa; c.translate(e[0], e[1] + 4); c.scale(hs / SU, hs / SU * 0.55); c.drawImage(lineSpr(), -SCX, -SCY); c.drawImage(lineSpr(), -SCX, -SCY); c.restore();
            glowC(c, e[0], e[1] - 6, 30, CANDY, 0.5 * ca * fa); if (v < 0.15) glowC(c, e[0], e[1] - 6, 26, PEARL, 0.9 * (1 - v / 0.15));
          } else { // the living: a soft heart halo
            const ha = sm(v / 0.2) * (1 - sm((v - 0.6) / 0.7)), hs = 26 + 10 * H.ease.out(cl(v / 1.2));
            blitC(c, lineSpr(), e[0], e[1] - 6, hs * 1.6, hs * 1.6, 0.75 * ha * fa, true); glowC(c, e[0], e[1] - 6, 22, ROSE, 0.35 * ha * fa); } }
        S.draw(c, 1, fa);
      } });
  };
})();
