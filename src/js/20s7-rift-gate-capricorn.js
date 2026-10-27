/* ---------- Gate 05, Capricorn: The Crownstep Ascent ----------
   A tall ice cliff above the aurora. Ledges of packed snow climb it in a zig-zag, joined by narrow bridges of old ice
   that crack under your weight: stand still on one and it shatters (it re-forms a few seconds later). Icicles fall
   from the overhang onto shown circles, faster the higher you climb. Gusts sweep across the bridges (a dashed outline
   warns first): pushed against the edge you are blown off. A fall returns you to the last cairn you lit, hurt. At the
   top waits a crown of ice horns on a pedestal: reach it and Capricorn wakes. */
(() => {
  const TAU = Math.PI * 2, INK = '#1A2438', ICE_HI = '#CFE8F4', ICE = '#86B7D0', EMER = '#4FE0A0', EMER_HI = '#B8F5DA', WARM = '#FFE9A8';
  // the cliff, built bottom-up: a start ledge, six ledges in a zig-zag joined by crumbling ice bridges, then the crown
  const LAYOUT = (() => { const W = 19, rows = [], row = f => { let t = ''; for (let x = 0; x < W; x++) t += f(x); rows.push(t); };
    row(() => '#'); for (let y = 0; y < 4; y++) row(x => (x >= 3 && x <= 15 ? (y === 1 && x === 9 ? 'S' : '.') : '~'));
    const cx = [9, 5, 12, 6, 13, 7, 11]; // ledge centres; cx[0] is the start ledge
    for (let i = 1; i < cx.length; i++) { const mid = Math.round((cx[i - 1] + cx[i]) / 2);
      for (let y = 0; y < 4; y++) row(x => (x === mid - 1 || x === mid ? (i === 1 ? 'b' : 'c') : y === 1 && i >= 3 && x === 1 ? 'w' : '~'));
      for (let y = 0; y < 3; y++) row(x => (Math.abs(x - cx[i]) <= 3 ? (y === 1 && x === cx[i] && i % 2 === 1 ? 'k' : y === 1 && (i === 2 || i === 4 || i === 6) && Math.abs(x - cx[i]) === 2 ? 'q' : '.') : '~')); }
    const mid = Math.round((cx[cx.length - 1] + 9) / 2); for (let y = 0; y < 4; y++) row(x => (x === mid - 1 || x === mid ? 'c' : y === 1 && x === 1 ? 'w' : '~'));
    for (let y = 0; y < 4; y++) row(x => (x >= 4 && x <= 14 ? (y === 1 && x === 9 ? 'O' : '.') : '~')); row(() => '#');
    return rows.reverse(); })();
  defGate('aurora', {
    name: 'The Crownstep Ascent', biome: 'glacier', goal: 'Climb the ice cliff to the crown', how: 'Climb the ledges to the crown at the top. The ice bridges between ledges crack under your weight: keep moving, because a bridge you stand still on shatters (it re-forms a few seconds later). Icicles fall onto shown circles, faster the higher you climb: dodge out of them. Gusts sweep across the upper bridges; a dashed outline warns first, and if it pins you against the edge you are blown off. A fall sends you back to the last cairn you reached. Stand by a cairn to light it.',
    layout: LAYOUT, legend: { O: {}, k: {}, q: {}, w: { tile: T_GAP }, b: { tile: T_BRIDGE }, c: { tile: T_BRIDGE } },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, O = M.marks.O[0], ST = X.ST(), start = { x: M.start.x, y: M.start.y };
      // the crumbling bridges, one plank (a row of two tiles) at a time
      const planks = []; { const by = {}; for (const p of M.marks.c || []) (by[p.ty] = by[p.ty] || []).push(p); for (const ty in by) planks.push({ ty: +ty, tiles: by[ty], x0: Math.min(...by[ty].map(t => t.tx)), x1: Math.max(...by[ty].map(t => t.tx)) + 1, t: 0, gone: 0 }); }
      const cairns = (M.marks.k || []).slice().sort((a, b) => b.y - a.y).map(p => ({ x: p.x, y: p.y, lit: false }));
      const gusts = (M.marks.w || []).map((p, i) => ({ y: p.y, dir: i % 2 ? -1 : 1, per: 5.5 + (i % 2), off: i * 1.3, st: 'still', k: 0 }));
      const S = { intro: true, last: start, falls: 0, icT: 2.5, icN: 0, hits: 0, won: false, top: 0, guards: [] };
      (M.marks.q || []).forEach(p => { const q = X.freeSpot(p.x, p.y, 0.45) || p; const m = X.spawnMon('rimescuttler', q.x, q.y, { pack: 900, rift: true }); m.optional = true; S.guards.push(m); });
      cairns.forEach((cn, i) => { cn.obj = H.obj({ x: cn.x, y: cn.y, kind: 'cairn', r: 0.8, h: 1.4, label: () => (cn.lit ? `Cairn ${i + 1}: you return here` : `Light cairn ${i + 1}`), use() { if (cn.lit) return; cn.lit = true; S.last = { x: cn.x, y: cn.y + 0.9 }; X.text(cn.x, cn.y - 1.6, 'A fall returns you here', EMER_HI, 13); X.sfx.chirp(); X.ring(cn.x, cn.y, 0.3, 2.4, 0.5, EMER, 0.35); },
        draw(c, Xs, Ys, T) { c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 0.45, T * 0.16, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; [[0, 0.45, 0.2], [0, 0.32, 0.55], [0.02, 0.22, 0.85]].forEach(([dx, r, y]) => { c.fillStyle = '#5A6478'; c.beginPath(); c.ellipse(Xs + dx * T, Ys - y * T, r * T, r * T * 0.7, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#F6FAFC'; c.beginPath(); c.ellipse(Xs + dx * T, Ys - y * T - r * T * 0.45, r * T * 0.8, r * T * 0.25, 0, 0, TAU); c.fill(); });
          if (cn.lit) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(EMER), Xs - T, Ys - T * 2.1, T * 2, T * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = EMER_HI; const fy = Ys - T * 1.05, fh = T * (0.55 + 0.08 * Math.sin(g.t * 9)); c.beginPath(); c.moveTo(Xs, fy - fh); c.quadraticCurveTo(Xs + T * 0.25, fy - fh * 0.3, Xs, fy); c.quadraticCurveTo(Xs - T * 0.25, fy - fh * 0.3, Xs, fy - fh); c.fill(); } c.restore(); } }); });
      const crown = H.obj({ x: O.x, y: O.y, kind: 'crown', r: 1.1, h: 2.2, label: () => (S.won ? 'Capricorn wakes' : 'The crown of ice horns'), use() { win(); }, draw(c, Xs, Ys, T) { drawCrown(c, Xs, Ys, T); } });
      function drawCrown(c, Xs, Ys, T) { c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.15, T * 0.9, T * 0.3, 0, 0, TAU); c.fill();
        c.fillStyle = '#4A5468'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.75, Ys); c.lineTo(Xs - T * 0.55, Ys - T * 0.9); c.lineTo(Xs + T * 0.55, Ys - T * 0.9); c.lineTo(Xs + T * 0.75, Ys); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#F6FAFC'; c.beginPath(); c.ellipse(Xs, Ys - T * 0.92, T * 0.62, T * 0.16, 0, 0, TAU); c.fill(); c.stroke();
        const cy = Ys - T * 1.35 + Math.sin(g.t * 1.6) * T * 0.08; c.globalCompositeOperation = 'lighter'; c.globalAlpha = S.won ? 1 : 0.6 + 0.2 * Math.sin(g.t * 2.4); blitSized(c, glowSprite(EMER), Xs - T * 1.8, cy - T * 1.8, T * 3.6, T * 3.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
        // a band of ice with two great curling horns, and an emerald set in front
        c.fillStyle = ICE_HI; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, cy, T * 0.5, T * 0.18, 0, 0, TAU); c.fill(); c.stroke();
        for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(Xs + sd * T * 0.25, cy - T * 0.08); c.bezierCurveTo(Xs + sd * T * 0.4, cy - T * 1.1, Xs + sd * T * 1.3, cy - T * 1.0, Xs + sd * T * 1.05, cy - T * 0.25); c.bezierCurveTo(Xs + sd * T * 0.95, cy - T * 0.55, Xs + sd * T * 0.6, cy - T * 0.6, Xs + sd * T * 0.48, cy - T * 0.05); c.closePath(); const gr = c.createLinearGradient(Xs, cy - T, Xs + sd * T, cy); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, ICE); c.fillStyle = gr; c.fill(); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.2; for (let k = 1; k < 4; k++) { const u = k / 4; c.beginPath(); c.arc(Xs + sd * T * (0.35 + u * 0.55), cy - T * (0.3 + Math.sin(u * Math.PI) * 0.5), T * 0.1, 0, Math.PI); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 2; }
        c.fillStyle = EMER; c.beginPath(); c.moveTo(Xs, cy - T * 0.2); c.lineTo(Xs + T * 0.14, cy); c.lineTo(Xs, cy + T * 0.2); c.lineTo(Xs - T * 0.14, cy); c.closePath(); c.fill(); c.stroke(); c.restore(); }
      function fall(why) { S.falls++; X.flash(0.35, '#FFFFFF'); X.hurtPet(ST.hp * 0.12, null); X.banner(why === 'wind' ? 'BLOWN OFF THE CLIFF' : 'THE ICE GIVES WAY', S.last === start ? 'Back to the foot of the cliff' : 'Back to the last cairn you lit', '#FF9BD2', 1.8, true); X.sfx.wrong(); me.x = S.last.x; me.y = S.last.y; me.vx = me.vy = 0; me.push = null; me.dodge = null; S.icT = Math.max(S.icT, 1.5); }
      function win() { if (S.won) return; S.won = true; self.done = true; X.flash(0.6, '#FFFFFF'); X.shake(6, 0.5); X.banner('CAPRICORN WAKES', 'The crown of ice horns answers: the climber of the cold heights', EMER_HI, 3, true, true); X.sfx.fanfare(); X.ring(O.x, O.y, 0.5, 6, 0.8, EMER, 0.5); X.after(2.8, () => X.winStage()); }
      function icicle() { const k = S.top; S.icN++; const lead = 0.5 + Math.random() * 0.6, x = me.x + (me.vx || 0) * lead + (Math.random() - 0.5) * 2.4, y = me.y + (me.vy || 0) * lead + (Math.random() - 0.5) * 2.0, r = 0.95, wind = 0.95 - k * 0.2;
        X.warn({ x, y, r, life: wind, max: wind, color: ICE_HI, fn: () => { X.boom(x, y, r, ICE_HI, '#FFFFFF', { n: 12, shake: 3 }); X.sfx.thud && X.sfx.thud(); if (!me.dead && !me.dodge && Math.hypot(me.x - x, me.y - y) < r + me.r * 0.6) { S.hits++; X.hurtPet(ST.hp * 0.1, null); X.push(Math.atan2(me.y - y, me.x - x), 1.4); } } }); }
      X.after(1.0, () => { S.intro = false; X.banner('THE CROWNSTEP ASCENT', 'Climb to the crown · keep moving on the ice', EMER_HI, 3, true, true); });
      const tileOf = (x, y) => X.tileAt(Math.floor(x), Math.floor(y));
      return { S, planks, cairns, gusts,
        update(dt) { if (S.intro || S.won) return;
          S.top = Math.max(0, Math.min(1, (start.y - me.y) / (start.y - O.y)));
          // the planks crack under you and re-form
          let dirty = false;
          for (const p of planks) { const on = me.y >= p.ty && me.y < p.ty + 1 && me.x > p.x0 - 0.1 && me.x < p.x1 + 0.1 && !me.dead;
            if (p.gone > 0) { p.gone -= dt; if (p.gone <= 0) { p.gone = 0; p.t = 0; if (!on) { p.tiles.forEach(t => X.setTile(t.tx, t.ty, T_BRIDGE)); dirty = true; } else p.gone = 0.3; } continue; }
            if (on) { p.t += dt; if (p.t >= 0.95) { p.gone = 4.5; p.tiles.forEach(t => X.setTile(t.tx, t.ty, T_GAP)); dirty = true; X.boom((p.x0 + p.x1) / 2, p.ty + 0.5, 0.8, ICE_HI, '#FFFFFF', { n: 10, shake: 2 }); } }
            else p.t = Math.max(0, p.t - dt * 0.6); }
          if (dirty) X.retile();
          if (!me.dead && !me.dodge && tileOf(me.x, me.y) === T_GAP) fall('ice');
          // the gusts across the upper bridges
          for (const G of gusts) { const u = ((g.t + G.off) % G.per) / G.per; G.st = u < 0.5 ? 'still' : u < 0.64 ? 'warn' : 'blow'; G.k += ((G.st === 'blow' ? 1 : 0) - G.k) * Math.min(1, dt * 6); }
          const gu = gusts.find(G => G.st === 'blow' && Math.abs(me.y - G.y) < 1.6);
          if (gu && !me.dodge && !me.dead) { X.moveEnt(me, gu.dir * 2.6 * dt, 0); const edge = tileOf(me.x + gu.dir * (me.r + 0.15), me.y) === T_GAP; S.gustExp = (S.gustExp || 0) + dt * (edge ? 1.3 : 0); if (S.gustExp >= 1) { S.gustExp = 0; fall('wind'); } } else S.gustExp = Math.max(0, (S.gustExp || 0) - dt * 2);
          // the icicles: faster the higher you climb
          S.icT -= dt; if (S.icT <= 0) { S.icT = 1.7 - S.top * 0.9; icicle(); if (S.top > 0.55) icicle(); }
          if (!S.won && Math.hypot(me.x - O.x, me.y - O.y) < 1.6) win(); },
        goal() { if (S.won) return 'Capricorn wakes'; if (S.intro) return 'The Crownstep Ascent'; return `Climb to the crown · ${Math.round(S.top * 100)}% of the way · cairns ${cairns.filter(q => q.lit).length}/${cairns.length}`; },
        hint() { if (S.won) return null; const cn = cairns.find(q => !q.lit && q.y < me.y + 0.5 && q.y > me.y - 9); return cn ? cn.obj : crown; },
        drawGround(c) { const T = X.Tz();
          // cracks spreading over a plank under weight; a re-forming plank glints
          for (const p of planks) { const X0 = X.sx(p.x0), Y0 = X.sy(p.ty), w = (p.x1 - p.x0) * T; if (p.gone > 0) { if (p.gone < 1) { c.save(); c.globalAlpha = (1 - p.gone) * 0.6; c.strokeStyle = ICE_HI; c.lineWidth = 2; c.setLineDash([5, 5]); c.strokeRect(X0 + 2, Y0 + 2, w - 4, T - 4); c.restore(); } continue; }
            const k = p.t / 0.95; if (k > 0.05) { c.save(); c.strokeStyle = `rgba(20,40,70,${0.35 + k * 0.5})`; c.lineWidth = 1.5 + k * 1.5; const n = 2 + Math.floor(k * 5); for (let i = 0; i < n; i++) { const sx = X0 + w * ((i * 0.37 + 0.15) % 1), sy = Y0 + T * ((i * 0.61 + 0.2) % 1); c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + (i % 2 ? 1 : -1) * T * 0.35 * k, sy + T * 0.25 * k); c.lineTo(sx + (i % 2 ? 1 : -1) * T * 0.15 * k, sy + T * 0.5 * k); c.stroke(); } if (k > 0.55) { c.fillStyle = `rgba(255,120,170,${(k - 0.55) * 0.5 + 0.1 * Math.sin(g.t * 20)})`; c.fillRect(X0, Y0, w, T); } c.restore(); } }
          // the gusts: a warning outline, then streaming arrows
          for (const G of gusts) { const Y0 = X.sy(G.y - 1.5), Y1 = X.sy(G.y + 1.5); c.save(); if (G.st === 'warn') { c.globalAlpha = 0.5 + 0.4 * Math.sin(g.t * 16); c.strokeStyle = WARM; c.lineWidth = 3; c.setLineDash([10, 8]); c.strokeRect(0, Y0, X.W(), Y1 - Y0); }
            if (G.k > 0.05) { c.globalAlpha = 0.18 * G.k; c.fillStyle = '#FFFFFF'; c.fillRect(0, Y0, X.W(), Y1 - Y0); c.globalAlpha = 0.85 * G.k; c.strokeStyle = '#F4FBFF'; c.lineWidth = 2; const off = (g.t * 4) % 1.4; for (let d = off; d < X.W() / T + 2; d += 1.4) for (const yy of [-0.9, 0, 0.9]) { const Xs = G.dir > 0 ? d * T : X.W() - d * T, Ys = X.sy(G.y + yy); c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + G.dir * T * 0.6, Ys); c.lineTo(Xs + G.dir * T * 0.42, Ys - T * 0.12); c.moveTo(Xs + G.dir * T * 0.6, Ys); c.lineTo(Xs + G.dir * T * 0.42, Ys + T * 0.12); c.stroke(); } }
            c.restore(); }
          if ((S.gustExp || 0) > 0.03) { const Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 1.55, w = T * 1.4; c.save(); c.fillStyle = 'rgba(10,20,40,.75)'; GFX.rr(c, Xs - w / 2 - 2, Ys - 6, w + 4, 12, 6); c.fill(); c.fillStyle = '#FF9BD2'; GFX.rr(c, Xs - w / 2, Ys - 4, w * Math.min(1, S.gustExp), 8, 4); c.fill(); c.restore(); } },
        drawOver(c) { const T = X.Tz();
          // a climb gauge down the left edge: you, the cairns, the crown
          const x = 14, y0 = X.H ? X.H() * 0.3 : 260, h = T * 7; c.save(); c.fillStyle = 'rgba(10,20,40,.6)'; GFX.rr(c, x - 5, y0 - 8, 10, h + 16, 5); c.fill(); c.fillStyle = EMER; GFX.rr(c, x - 3, y0 + h * (1 - S.top), 6, h * S.top, 3); c.fill();
          cairns.forEach(cn => { const u = (start.y - cn.y) / (start.y - O.y); c.fillStyle = cn.lit ? EMER_HI : '#8A94A8'; c.beginPath(); c.arc(x, y0 + h * (1 - u), 4, 0, TAU); c.fill(); }); c.fillStyle = WARM; c.beginPath(); c.arc(x, y0 - 2, 5, 0, TAU); c.fill(); c.restore(); },
      };
    },
  });
})();
