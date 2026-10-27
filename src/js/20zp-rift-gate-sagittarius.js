/* ---------- Gate 10, Sagittarius: The Archer's Horizon ----------
   A field of glass mirrors on posts at the edge of the world. Stand on an archer's plate and a bolt of light flies from it
   every second and a half, straight up the field; it turns ninety degrees at every mirror it meets (a mirror leans one
   way or the other: walk up to a mirror to flip it). The bolt's whole path is always shown as a dotted line. Star targets
   float over the field: a bolt that passes through one lights it, and lit stars stay lit. Light every star; three rounds,
   more mirrors and stars each time (the last with two plates to shoot from). */
(() => {
  const TAU = Math.PI * 2, INK = '#1C1A26';
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
  // the field: a lattice of 7×7 nodes, three tiles apart; the plates stand below the bottom row
  const N = 7, SP = 3, OX = 4, OY = 5;
  const LAYOUT = (() => { const W = OX * 2 + SP * (N - 1) + 1, Hh = OY + SP * (N - 1) + 9, g = Array.from({ length: Hh }, () => Array(W).fill('~'));
    for (let y = OY - 2; y <= OY + SP * (N - 1) + 5; y++) for (let x = OX - 2; x <= OX + SP * (N - 1) + 2; x++) g[y][x] = '.';
    g[OY + SP * (N - 1) + 4][OX + SP * 3] = 'S'; return g.map(r => r.join('')); })();
  // rounds: plates (columns), mirrors { i, j, s: '/' or '\\' as first set }, targets { i, j }
  const ROUNDS = [
    { plates: [3], mirrors: [{ i: 3, j: 2, s: '\\' }], stars: [{ i: 6, j: 2 }] },
    { plates: [1], mirrors: [{ i: 1, j: 5, s: '\\' }, { i: 5, j: 5, s: '\\' }, { i: 5, j: 1, s: '/' }, { i: 3, j: 3, s: '/' }], stars: [{ i: 3, j: 5 }, { i: 5, j: 3 }] },
    { plates: [0, 6], mirrors: [{ i: 0, j: 3, s: '\\' }, { i: 3, j: 3, s: '\\' }, { i: 6, j: 4, s: '/' }, { i: 3, j: 1, s: '/' }, { i: 6, j: 1, s: '/' }], stars: [{ i: 2, j: 3 }, { i: 3, j: 2 }, { i: 4, j: 4 }] },
  ];
  // the path a bolt takes from a plate: up its column, turning at each mirror, until it leaves the field
  function trace(R, mir, col) { const pts = [{ i: col, j: N }], hits = []; let i = col, j = N, dx = 0, dy = -1;
    for (let k = 0; k < 60; k++) { i += dx; j += dy; if (i < 0 || i >= N || j < 0 || j >= N) { pts.push({ i, j }); break; }
      R.stars.forEach((s, n) => { if (s.i === i && s.j === j && !hits.includes(n)) hits.push(n); });
      const m = mir.find(q => q.i === i && q.j === j); if (m) { pts.push({ i, j }); if (m.s === '/') { const t = dx; dx = -dy; dy = -t; } else { const t = dx; dx = dy; dy = t; } } }
    return { pts, hits }; }

  defGate('colours', {
    name: "The Archer's Horizon", biome: 'greyshore', goal: 'Light every star with a bolt', how: 'Glass mirrors stand on posts across the field, each leaning one way. Stand on an archer\'s plate (below the field) and a bolt of light flies from it every second and a half, straight up; at every mirror it turns ninety degrees. The bolt\'s whole path is always shown as a dotted line. Stand at a mirror\'s foot a moment to flip it the other way (step off and back to flip it again). Star targets float over the field: a bolt through one lights it, and lit stars stay lit. Light every star. Three rounds; the last has two plates to shoot from.',
    layout: LAYOUT, legend: {},
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, ox = (M.MW - LAYOUT[0].length) / 2, oy = (M.MH - LAYOUT.length) / 2, C = COL;
      const at = (i, j) => ({ x: ox + OX + i * SP + 0.5, y: oy + OY + j * SP + 0.5 });
      const S = { intro: true, round: 0, mir: [], lit: [], bolts: [], fireT: 1.2, plate: null, won: false, flips: 0, shots: 0, pests: [], pestT: 14 };
      function deal(r) { S.round = r; const R = ROUNDS[r]; S.mir = R.mirrors.map(m => Object.assign({}, m, { flip: 0, _on: false })); S.lit = R.stars.map(() => false); S.bolts = []; S.plate = null; }
      deal(0);
      X.after(1.2, () => { S.intro = false; X.banner("THE ARCHER'S HORIZON", 'Stand on a plate to loose bolts; stand at a mirror to flip it. The dotted line shows where the bolt goes', '#FFF0B8', 3.8, true, true); });
      const plates = () => ROUNDS[S.round].plates.map(col => { const p = at(col, N - 1); return { col, x: p.x, y: p.y + SP * 0.95 }; });
      function fire(pl) { const R = ROUNDS[S.round], tr = trace(R, S.mir, pl.col); S.shots++; S.bolts.push({ pts: tr.pts.map(p => p.j === N ? { x: pl.x, y: pl.y } : at(p.i, p.j)), t: 0, hits: tr.hits }); X.sfx.tick && X.sfx.tick(); }
      function starLit(n) { if (S.lit[n]) return; S.lit[n] = true; const s = ROUNDS[S.round].stars[n], p = at(s.i, s.j); X.boom(p.x, p.y - 1.2, 1.2, '#FFE37A', '#FFFFFF', { n: 16, shake: 3 }); X.sfx.coin && X.sfx.coin(); X.text(p.x, p.y - 2.4, `STAR ${S.lit.filter(Boolean).length}/${S.lit.length}`, '#FFF0B8', 15);
        if (S.lit.every(Boolean)) { if (S.round < ROUNDS.length - 1) { X.banner(`ROUND ${S.round + 1} OF 3 · EVERY STAR LIT`, 'The field shifts: more mirrors, more stars', '#FFF0B8', 2.6, true); X.sfx.fanfare && X.sfx.fanfare(); X.after(2.0, () => deal(S.round + 1)); } else win(); } }
      function win() { if (S.won) return; S.won = true; self.done = true; for (const m of S.pests) if (!m.dead) X.killMon(m); X.flash(0.5, '#FFFFFF'); X.shake(6, 0.5); X.sfx.fanfare && X.sfx.fanfare(); X.banner('SAGITTARIUS WAKES', 'Every star struck: the archer of the horizon answers', '#FFF0B8', 3, true, true); X.after(2.8, () => X.winStage()); }
      return { S, at, trace: col => trace(ROUNDS[S.round], S.mir, col), plates, ROUNDS,
        cam() { return { x: me.x, y: me.y - 1.5, k: 0.25, zoom: 0.6 }; },
        update(dt) { if (S.intro || S.won) return;
          // mirrors flip as you walk up to them
          for (const m of S.mir) { const p = at(m.i, m.j), d = Math.hypot(me.x - p.x, me.y - (p.y + 0.6)); if (d < 0.95) { m.hold = (m.hold || 0) + dt; if (m.hold >= 0.45 && !m._on) { m._on = true; m.s = m.s === '/' ? '\\' : '/'; m.flip = 1; S.flips++; X.sfx.tick && X.sfx.tick(); } } else { m.hold = 0; m._on = false; } if (m.flip > 0) m.flip -= dt * 3; }
          const pl = plates().find(p => Math.hypot(me.x - p.x, me.y - p.y) < 1.1); S.plate = pl ? pl.col : null;
          if (pl) { S.fireT -= dt; if (S.fireT <= 0) { S.fireT = 1.5; fire(pl); } } else S.fireT = Math.min(S.fireT, 0.5);
          // bolts in flight: they light the stars they pass
          for (const b of S.bolts) { b.t += dt * 14; let acc = 0; for (let k = 1; k < b.pts.length; k++) acc += Math.hypot(b.pts[k].x - b.pts[k - 1].x, b.pts[k].y - b.pts[k - 1].y); b.len = acc;
            const R = ROUNDS[S.round]; for (const n of b.hits) { if (S.lit[n]) continue; const s = R.stars[n], p = at(s.i, s.j); let walked = 0, reach = Infinity; for (let k = 1; k < b.pts.length; k++) { const a = b.pts[k - 1], c2 = b.pts[k], L = Math.hypot(c2.x - a.x, c2.y - a.y), ux = (c2.x - a.x) / (L || 1), uy = (c2.y - a.y) / (L || 1), u = (p.x - a.x) * ux + (p.y - a.y) * uy, off = Math.abs(-(p.x - a.x) * uy + (p.y - a.y) * ux); if (off < 0.3 && u >= -0.1 && u <= L + 0.1) { reach = walked + u; break; } walked += L; } if (b.t >= reach) starLit(n); } }
          S.bolts = S.bolts.filter(b => b.t < (b.len || 99) + 2);
          S.pests = S.pests.filter(m => !m.dead); S.pestT -= dt; if (S.pestT <= 0) { S.pestT = 14; if (S.pests.length < 2) { const p = at(Math.random() < 0.5 ? 0 : N - 1, Math.floor(Math.random() * N)); const q = X.freeSpot(p.x + (Math.random() < 0.5 ? -1.5 : 1.5), p.y, 0.45); if (q) { const m = X.spawnMon('greyling', q.x, q.y, { pack: 975, rift: true, aggro: true }); X.g.total++; S.pests.push(m); } } } },
        goal() { if (S.won) return 'Sagittarius wakes'; if (S.intro) return "The Archer's Horizon"; return `Round ${S.round + 1}/3 · stars ${S.lit.filter(Boolean).length}/${S.lit.length}${S.plate == null ? ' · stand on a plate' : ''}`; },
        hint() { if (S.won || S.plate != null) return null; const ps = plates(); let best = null, bd = 1e9; for (const p of ps) { const d = Math.hypot(me.x - p.x, me.y - p.y); if (d < bd) { bd = d; best = p; } } return bd > 6 ? best : null; },
        drawGround(c) { const T = X.Tz(), t = g.t, R = ROUNDS[S.round];
          // the lattice: faint gold nodes
          c.save(); c.fillStyle = 'rgba(255,240,184,.25)'; for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { const p = at(i, j); c.beginPath(); c.arc(X.sx(p.x), X.sy(p.y), T * 0.07, 0, TAU); c.fill(); } c.restore();
          // the plates, and each plate's predicted path (bright for the plate you stand on)
          for (const pl of plates()) { const Xs = X.sx(pl.x), Ys = X.sy(pl.y), on = S.plate === pl.col, tr = trace(R, S.mir, pl.col);
            c.save(); c.strokeStyle = on ? 'rgba(255,240,184,.9)' : 'rgba(255,240,184,.35)'; c.lineWidth = on ? 3 : 2; c.setLineDash([6, 7]); c.lineDashOffset = -t * 24; c.beginPath(); c.moveTo(Xs, Ys); for (const q of tr.pts.slice(1)) { const p = q.i < 0 || q.i >= N || q.j < 0 || q.j >= N ? at(Math.max(-0.6, Math.min(N - 0.4, q.i)), Math.max(-0.6, Math.min(N - 0.4, q.j))) : at(q.i, q.j); c.lineTo(X.sx(p.x), X.sy(p.y)); } c.stroke(); c.restore();
            c.save(); c.fillStyle = on ? 'rgba(255,240,184,.45)' : 'rgba(255,240,184,.2)'; c.strokeStyle = '#E8C46A'; c.lineWidth = 3; ell(c, Xs, Ys, T * 0.95, T * 0.38); c.fill(); c.stroke();
            c.strokeStyle = '#FFF0B8'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(Xs, Ys - T * 0.25); c.lineTo(Xs, Ys - T * 0.75); c.moveTo(Xs - T * 0.15, Ys - T * 0.6); c.lineTo(Xs, Ys - T * 0.78); c.lineTo(Xs + T * 0.15, Ys - T * 0.6); c.stroke(); c.restore();
            label(c, on ? 'LOOSING…' : 'STAND HERE', Xs, Ys + T * 0.8, T * 0.26, '#FFF0B8'); } },
        drawOver(c) { const T = X.Tz(), t = g.t, R = ROUNDS[S.round];
          // the mirrors: a pane of glass on a post, leaning / or \ (flipping animates)
          for (const m of S.mir) { const p = at(m.i, m.j), Xs = X.sx(p.x), Ys = X.sy(p.y), sgn = m.s === '/' ? 1 : -1, k = Math.max(0, m.flip);
            c.save(); c.fillStyle = 'rgba(14,16,30,.3)'; ell(c, Xs, Ys + T * 0.6, T * 0.6, T * 0.2); c.fill();
            c.strokeStyle = INK; c.lineWidth = T * 0.1 + 3; c.beginPath(); c.moveTo(Xs, Ys + T * 0.6); c.lineTo(Xs, Ys); c.stroke(); c.strokeStyle = '#B8B8C2'; c.lineWidth = T * 0.1; c.stroke();
            c.translate(Xs, Ys - T * 0.2); c.scale(1 - k * 0.8, 1); c.rotate(sgn * -Math.PI / 4);
            const gr = c.createLinearGradient(-T * 0.9, 0, T * 0.9, 0); gr.addColorStop(0, '#F2FFFF'); gr.addColorStop(0.5, C.GLASS); gr.addColorStop(1, C.GLASS_D); c.fillStyle = gr; c.globalAlpha = 0.92; c.fillRect(-T * 0.9, -T * 0.14, T * 1.8, T * 0.28); c.globalAlpha = 1; c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(-T * 0.9, -T * 0.14, T * 1.8, T * 0.28);
            c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(-T * 0.8, -T * 0.1, T * 1.6, T * 0.05); c.restore();
            if (Math.hypot(me.x - p.x, me.y - (p.y + 0.6)) < 2.2) { label(c, m._on ? 'FLIPPED · STEP OFF' : 'STAND TO FLIP', Xs, Ys + T * 1.15, T * 0.22, '#FFFFFF'); if (m.hold > 0 && !m._on) { c.save(); c.strokeStyle = '#FFFFFF'; c.lineWidth = 3; c.beginPath(); c.arc(Xs, Ys + T * 0.6, T * 0.45, -Math.PI / 2, -Math.PI / 2 + Math.min(1, m.hold / 0.45) * TAU); c.stroke(); c.restore(); } } }
          // the stars over the field
          R.stars.forEach((s, n) => { const p = at(s.i, s.j), Xs = X.sx(p.x), Ys = X.sy(p.y) - T * 0.3 + Math.sin(t * 2 + n) * T * 0.08, lit = S.lit[n];
            glowAt(c, Xs, Ys, T * (lit ? 1.4 : 0.9), '#FFE37A', lit ? 0.8 : 0.3 + 0.15 * Math.sin(t * 4 + n)); c.save(); c.translate(Xs, Ys); c.rotate(t * 0.6); c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? T * 0.17 : T * 0.42; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fillStyle = lit ? '#FFF0B8' : 'rgba(255,240,184,.25)'; c.fill(); c.strokeStyle = lit ? '#FFFFFF' : '#E8C46A'; c.lineWidth = 2; c.stroke(); c.restore(); });
          // bolts of light running their paths: a bright head and a soft fading tail
          for (const b of S.bolts) { let walked = 0; const pos = d => { let w = 0; for (let k = 1; k < b.pts.length; k++) { const a = b.pts[k - 1], c2 = b.pts[k], L = Math.hypot(c2.x - a.x, c2.y - a.y); if (w + L >= d) { const u = (d - w) / (L || 1); return { x: a.x + (c2.x - a.x) * u, y: a.y + (c2.y - a.y) * u }; } w += L; } return b.pts[b.pts.length - 1]; }; void walked;
            if (b.t > (b.len || 0) + 0.5) continue; for (let k = 0; k < 6; k++) { const d = b.t - k * 0.35; if (d < 0) continue; const q = pos(Math.min(d, b.len || d)); glowAt(c, X.sx(q.x), X.sy(q.y) - T * 0.3, T * (0.6 - k * 0.07), '#FFF0B8', 0.75 - k * 0.12); } } },
      };
    },
  });
})();
