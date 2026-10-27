/* ---------- Rift 05, the Pale Aurora: crystal trees and frost tomatoes ----------
   icetree    a giant tree grown out of ice: a faceted trunk splitting into sharp spiked branches, shards at its roots
   frost tomatoes (every stage of the rift): giant glossy blue tomatoes sit about the floor. Walk near one and it
   swells and flashes: two seconds later it bursts in a ring of frost. Caught inside, the pet is frozen in a block of
   ice for a moment; monsters caught inside freeze too (lure them in). A burst tomato grows back after a while. */
(() => {
  const TAU = Math.PI * 2, { ICE, ICE_HI, GREEN_HI, INK } = AUR;
  const { PROPS } = DunWorld;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const rnd = s => { let x = (s * 2654435761) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };

  /* ---- the crystal tree ---- */
  // one faceted spike: a long thin diamond, its left face lit, its right face in shadow, a bright ridge between
  function spike(c, x, y, a, len, w, lw) { const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, tx = x + ca * len, ty = y + sa * len, mx = x + ca * len * 0.35, my = y + sa * len * 0.35;
    c.beginPath(); c.moveTo(x + nx * w * 0.55, y + ny * w * 0.55); c.lineTo(mx + nx * w, my + ny * w); c.lineTo(tx, ty); c.lineTo(x, y); c.closePath(); c.fillStyle = '#9FCBE2'; c.fill();
    c.beginPath(); c.moveTo(x - nx * w * 0.55, y - ny * w * 0.55); c.lineTo(mx - nx * w, my - ny * w); c.lineTo(tx, ty); c.lineTo(x, y); c.closePath(); c.fillStyle = '#E8F6FC'; c.fill();
    c.beginPath(); c.moveTo(x + nx * w * 0.55, y + ny * w * 0.55); c.lineTo(mx + nx * w, my + ny * w); c.lineTo(tx, ty); c.lineTo(mx - nx * w, my - ny * w); c.lineTo(x - nx * w * 0.55, y - ny * w * 0.55); c.closePath(); c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(x, y); c.lineTo(tx - ca * len * 0.08, ty - sa * len * 0.08); c.stroke(); return { tx, ty }; }
  function branch(c, R, x, y, a, len, w, depth, lw, tips) {
    // little side thorns first (behind), then the limb itself, then its children
    const kids = depth > 0 ? 2 + (R() < 0.45 ? 1 : 0) : 0, pts = [];
    for (let i = 0; i < kids; i++) { const u = 0.45 + R() * 0.4, sd = i % 2 ? 1 : -1; pts.push({ u, a: a + sd * (0.45 + R() * 0.45), l: len * (0.5 + R() * 0.25) }); }
    if (depth === 0) for (let i = 0; i < 2; i++) { const u = 0.3 + R() * 0.4; spike(c, x + Math.cos(a) * len * u, y + Math.sin(a) * len * u, a + (i ? 0.9 : -0.9), len * 0.32, w * 0.35, lw * 0.8); }
    const t = spike(c, x, y, a, len, w, lw); tips.push(t);
    for (const p of pts) branch(c, R, x + Math.cos(a) * len * p.u, y + Math.sin(a) * len * p.u, p.a, p.l, w * 0.62, depth - 1, lw * 0.9, tips);
  }
  PROPS.icetree = (c, T, v) => { const lw = lw0(T), R = rnd(31 + v * 977), H = T * (3.5 + (v % 3) * 0.3), tips = [];
    // shadow, a cold glow inside, the root shards
    c.fillStyle = 'rgba(20,40,80,.3)'; c.beginPath(); c.ellipse(0, T * 0.04, T * 1.1, T * 0.34, 0, 0, TAU); c.fill();
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite(ICE_HI), -T * 1.6, -H * 0.9 - T * 1.2, T * 3.2, T * 3.2); c.restore();
    for (const [dx, a, l] of [[-0.35, -2.5, 0.75], [0.4, -0.6, 0.7], [-0.1, -1.9, 0.55], [0.2, -1.2, 0.5]]) spike(c, dx * T, 0, a, l * T, T * 0.13, lw);
    // the trunk: two thick faceted spikes stacked and slightly kinked, then the crown of branches
    const k = (R() - 0.5) * 0.25; spike(c, -T * 0.05, T * 0.02, -Math.PI / 2 + k, H * 0.62, T * 0.3, lw);
    const top = { x: -T * 0.05 + Math.cos(-Math.PI / 2 + k) * H * 0.45, y: T * 0.02 + Math.sin(-Math.PI / 2 + k) * H * 0.45 };
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.48 + (R() - 0.5) * 0.2, len = H * (i === 2 ? 0.62 : 0.45 + R() * 0.12); branch(c, R, top.x, top.y + (Math.abs(i - 2)) * T * 0.15, a, len, T * 0.18, i === 2 ? 2 : 1, lw * 0.9, tips); }
    // a few lower limbs off the trunk
    for (const sd of [-1, 1]) branch(c, R, -T * 0.05, -H * 0.22 - R() * T * 0.3, -Math.PI / 2 + sd * (1.0 + R() * 0.25), H * 0.35, T * 0.14, 1, lw * 0.85, tips);
    // glints at the sharpest tips
    const tw = (Date.now() / 1000 + v) % 4; c.save(); c.globalCompositeOperation = 'lighter'; tips.slice(0, 6).forEach((p, i) => { const a = Math.max(0, Math.sin((tw + i * 0.7) * 1.6)); if (a < 0.1) return; c.globalAlpha = a * 0.9; c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(p.tx, p.ty - T * 0.14); c.lineTo(p.tx + T * 0.03, p.ty); c.lineTo(p.tx, p.ty + T * 0.14); c.lineTo(p.tx - T * 0.03, p.ty); c.closePath(); c.fill(); c.beginPath(); c.moveTo(p.tx - T * 0.14, p.ty); c.lineTo(p.tx, p.ty + T * 0.03); c.lineTo(p.tx + T * 0.14, p.ty); c.lineTo(p.tx, p.ty - T * 0.03); c.closePath(); c.fill(); }); c.restore(); };
  PROP_EXT.icetree = [5.0, 5.6];
  // the rift's lands: crystal trees instead of snow hills and blocks
  BIOMES.glacier.props = ['icetree', 'icetree', 'frozenvane', 'icetree', 'icetree']; BIOMES.glacier.propN = [4, 3];
  BIOMES.observatory.props = ['obsarch', 'telescope', 'icetree', 'obsarch', 'icetree']; BIOMES.observatory.propN = [4, 3];
  BIOMES.whiteout.props = ['icetree', 'stonearch', 'icetree', 'icetree']; BIOMES.whiteout.propN = [3, 3];

  /* ---- the frost tomatoes ---- */
  const FUSE = 2, BLAST = 2.5, WAKE = 1.7, REGROW = 14, FREEZE = 2.2;
  function drawTomato(c, Xs, Ys, T, t, k, flash) {
    const r = T * 1.0 * k, sq = 0.8; c.save();
    c.fillStyle = 'rgba(10,30,70,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.05, r * 1.05, r * 0.32, 0, 0, TAU); c.fill();
    const cy = Ys - r * sq; c.translate(Xs, cy); c.scale(1, sq);
    // the body: five soft lobes, a deep blue gloss
    c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU, rr = r * (1 + 0.045 * Math.cos(a * 5)); i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath();
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.05); g.addColorStop(0, '#BFE4FF'); g.addColorStop(0.35, '#5FA6EE'); g.addColorStop(0.8, '#2A5CB8'); g.addColorStop(1, '#173C86'); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = lw0(T) * 1.2; c.stroke();
    // the lobe creases, curving round the body like a real tomato
    c.strokeStyle = 'rgba(16,40,96,.22)'; c.lineWidth = lw0(T) * 1.6; for (const sx of [-0.6, 0.6]) { c.beginPath(); c.moveTo(sx * r * 0.25, -r * 0.95); c.quadraticCurveTo(sx * r * 0.95, -r * 0.3, sx * r * 0.8, r * 0.2); c.stroke(); }
    c.fillStyle = 'rgba(16,40,96,.35)'; c.beginPath(); c.ellipse(0, -r * 0.88, r * 0.3, r * 0.1, 0, 0, TAU); c.fill();
    // gloss, rime freckles
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-r * 0.38, -r * 0.48, r * 0.22, r * 0.12, -0.6, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(-r * 0.12, -r * 0.62, r * 0.05, 0, TAU); c.fill();
    c.fillStyle = 'rgba(232,248,255,.7)'; [[0.4, 0.2], [0.25, 0.55], [-0.5, 0.3], [0.6, -0.2], [-0.15, 0.7]].forEach(([x, y]) => { c.beginPath(); c.arc(x * r, y * r, r * 0.04, 0, TAU); c.fill(); });
    // armed: cracks of white light and a pulsing flash
    if (flash > 0) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = flash; c.fillStyle = '#E8F8FF'; c.fill(); c.globalAlpha = Math.min(1, flash * 2); c.strokeStyle = '#FFFFFF'; c.lineWidth = lw0(T) * 1.4; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2); c.lineTo(Math.cos(a + 0.25) * r * 0.6, Math.sin(a + 0.25) * r * 0.6); c.lineTo(Math.cos(a - 0.1) * r * 0.95, Math.sin(a - 0.1) * r * 0.95); c.stroke(); } c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    c.restore();
    // the calyx: a star of icy pale-green leaves and a curled stem
    c.save(); c.translate(Xs, cy - r * sq * 0.86); c.fillStyle = '#B8F5DA'; c.strokeStyle = INK; c.lineWidth = lw0(T); c.beginPath(); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 0, rr = i % 2 ? r * 0.12 : r * 0.42; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.45); } c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#4FA88A'; c.lineWidth = lw0(T) * 2; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(r * 0.05, -r * 0.35, r * 0.22, -r * 0.32); c.stroke(); c.restore(); }
  function frostTomatoes(X, self, H) {
    const { M, me, g, F } = X, S = { list: [], frz: 0, fx: 0, fy: 0, frozen: 0 };
    const kind = F.rift.kind, n = kind === 'fight' ? 9 + Math.floor(X.R() * 4) : kind === 'boss' ? 0 : 4;
    const MW = M.MW || (M.W), MH = M.MH || (M.H), far = (x, y) => Math.hypot(x - M.start.x, y - M.start.y) > 5 && !S.list.some(q => Math.hypot(q.x - x, q.y - y) < 5) && (!M.bossAt || Math.hypot(x - M.bossAt.x, y - M.bossAt.y) > 6) && !(H.exit && H.exit() && Math.hypot(x - H.exit().x, y - H.exit().y) < 5);
    for (let tries = 0; tries < 600 && S.list.length < n; tries++) { const tx = 1 + Math.floor(X.R() * (MW - 2)), ty = 1 + Math.floor(X.R() * (MH - 2)); let okT = true; for (let dy = -1; dy <= 1 && okT; dy++) for (let dx = -1; dx <= 1; dx++) if (X.tileAt(tx + dx, ty + dy) !== T_FLOOR) { okT = false; break; } if (!okT) continue;
      const x = tx + 0.5, y = ty + 0.5; if (!far(x, y)) continue; const q = X.freeSpot(x, y, 0.8); if (!q || Math.hypot(q.x - x, q.y - y) > 0.6) continue;
      const T0 = { x: q.x, y: q.y, st: 'idle', t: 0, wob: X.R() * TAU }; T0.obj = H.obj({ x: q.x, y: q.y, kind: 'tomato', r: 0.7, h: 2.0, label: () => (T0.st === 'armed' ? 'MOVE!' : T0.st === 'gone' ? '' : 'Frost tomato'), draw(c, Xs, Ys, T) { if (T0.st === 'gone') return; const u = T0.st === 'armed' ? T0.t / FUSE : 0, k = (T0.st === 'grow' ? Math.min(1, T0.t / 1.2) : 1) * (1 + u * 0.22 + Math.sin(g.t * (6 + u * 30)) * 0.03 * (u ? 1 : 0.4)), fl = u ? (0.25 + 0.5 * u) * (0.5 + 0.5 * Math.sin(g.t * (10 + u * 30))) : 0; drawTomato(c, Xs, Ys, T, g.t, k, fl); } }); S.list.push(T0); }
    function burst(q) { q.st = 'gone'; q.t = 0; X.boom(q.x, q.y - 0.4, BLAST, ICE_HI, '#FFFFFF', { n: 34, shake: 9 }); X.ring(q.x, q.y, 0.4, BLAST, 0.4, '#BFE4FF', 0.5); if (X.sfx.crash) X.sfx.crash(); X.zone({ kind: 'stall', x: q.x, y: q.y, r: BLAST * 0.8, life: 3, max: 3, own: 'enemy' });
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; X.part({ kind: 'spark', x: q.x, y: q.y - 0.5, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6 - 2, life: 0.6, max: 0.6, size: 3, color: i % 2 ? '#FFFFFF' : '#5FA6EE' }); }
      for (const m of X.mons) if (!m.dead && !m.boss && Math.hypot(m.x - q.x, m.y - q.y) < BLAST) m.freeze = Math.max(m.freeze || 0, 3);
      if (!me.dead && Math.hypot(me.x - q.x, me.y - q.y) < BLAST + me.r * 0.4 && !me.dodge) { S.frz = FREEZE; S.fx = me.x; S.fy = me.y; S.frozen++; X.hurtPet(X.ST().hp * 0.08, null); X.flash(0.3, '#E8F8FF'); X.text(me.x, me.y - 1.6, 'FROZEN!', '#BFE4FF', 16); } }
    return { S,
      update(dt) {
        for (const q of S.list) { q.t += dt;
          if (q.st === 'idle' && !me.dead && Math.hypot(me.x - q.x, me.y - q.y) < WAKE + me.r) { q.st = 'armed'; q.t = 0; X.text(q.x, q.y - 2.1, 'It swells… move!', '#BFE4FF', 14); if (X.sfx.boop) X.sfx.boop(); }
          else if (q.st === 'armed' && q.t >= FUSE) burst(q);
          else if (q.st === 'gone' && q.t >= REGROW && Math.hypot(me.x - q.x, me.y - q.y) > 4) { q.st = 'grow'; q.t = 0; }
          else if (q.st === 'grow' && q.t >= 1.2) { q.st = 'idle'; q.t = 0; } }
        if (S.frz > 0) { S.frz -= dt; if (Math.hypot(me.x - S.fx, me.y - S.fy) > 1.2) { S.fx = me.x; S.fy = me.y; } me.x = S.fx; me.y = S.fy; me.vx = me.vy = 0; me.dodge = null; me.push = null; }
      },
      drawGround(c) { const T = X.Tz();
        // the blast ring of an armed tomato fills toward the burst
        for (const q of S.list) { if (q.st !== 'armed') continue; const u = Math.min(1, q.t / FUSE), Xs = X.sx(q.x), Ys = X.sy(q.y); c.save(); c.globalAlpha = 0.25 + 0.2 * Math.sin(g.t * (8 + u * 20)); c.fillStyle = '#5FA6EE'; c.beginPath(); c.ellipse(Xs, Ys, BLAST * T, BLAST * T * 0.75, 0, 0, TAU); c.fill(); c.globalAlpha = 0.9; c.strokeStyle = '#E8F8FF'; c.lineWidth = 3; c.setLineDash([10, 7]); c.lineDashOffset = -g.t * 30; c.stroke(); c.setLineDash([]); c.globalAlpha = 0.4; c.fillStyle = '#BFE4FF'; c.beginPath(); c.ellipse(Xs, Ys, BLAST * T * u, BLAST * T * 0.75 * u, 0, 0, TAU); c.fill(); c.restore(); }
      },
      drawOver(c) { { const T = X.Tz();
        // the pet in a block of ice
        if (S.frz > 0) { const Xs = X.sx(me.x), Ys = X.sy(me.y), w = T * 0.85, h = T * 1.35, a = Math.min(1, S.frz / 0.3); c.save(); c.globalAlpha = 0.75 * a; c.fillStyle = 'rgba(191,228,255,.55)'; c.strokeStyle = '#E8F8FF'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(Xs - w, Ys + T * 0.15); c.lineTo(Xs - w * 1.05, Ys - h * 0.8); c.lineTo(Xs - w * 0.4, Ys - h); c.lineTo(Xs + w * 0.6, Ys - h * 0.95); c.lineTo(Xs + w, Ys - h * 0.5); c.lineTo(Xs + w * 0.9, Ys + T * 0.15); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(Xs - w * 0.7, Ys - h * 0.7); c.lineTo(Xs - w * 0.3, Ys - h * 0.9); c.stroke(); c.restore(); }
        }
        if (S.frz > 0) { const T = X.Tz(), Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 1.75; c.save(); c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#BFE4FF'; const s = `FROZEN ${S.frz.toFixed(1)}s`; c.strokeText(s, Xs, Ys); c.fillText(s, Xs, Ys); c.restore(); } },
    };
  }
  RIFT_BY_ID.aurora.everyStage = frostTomatoes; AUR.drawTomato = drawTomato;
})();
