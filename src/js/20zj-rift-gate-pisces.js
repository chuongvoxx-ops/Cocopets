/* ---------- Gate 08, Pisces: The Silverline Basin ----------
   A ring of silver moon-dust round a still pool of starlight; the pool holds the reflection of Pisces, two fish joined
   by a cord, with every star dark. Star-fish leap out of the starlight onto the shore: a silver ripple shows where one will land.
   Stand in it when it lands to catch the star, and it flies up into the reflection. Dark eclipse eels leap too (a violet
   ripple): don't be under one. Twelve stars light the two fish; then the golden knot-fish leaps three times, one spot
   after another: catch it three times in a row to tie the cord, and Pisces wakes. */
(() => {
  const TAU = Math.PI * 2, INK = '#1E2030';
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const ell = (c, x, y, rx, ry) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); };
  const CX0 = 19, CY0 = 20, R_IN = 4.3, R_OUT = 10.5, N_STARS = 12, N_KNOT = 3;
  const LAYOUT = (() => { const W = 38, Hh = 40, g = Array.from({ length: Hh }, () => Array(W).fill('~'));
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x + 0.5 - CX0, y + 0.5 - CY0); if (d > R_IN && d < R_OUT) g[y][x] = '.'; }
    g[28][19] = 'S'; return g.map(r => r.join('')); })();
  // Pisces as the pool reflects it: two fish (six stars each) and the knot that ties their cord (tile offsets)
  const FISH = [[[-3.0, -1.5], [-2.3, -2.5], [-1.1, -2.6], [-0.5, -1.6], [-1.4, -0.7], [-2.6, -0.6]], [[0.7, 1.0], [1.6, 0.2], [2.8, 0.5], [3.2, 1.5], [2.3, 2.4], [1.1, 2.1]]], KNOT = [0.1, -0.2];
  function sparkle(c, x, y, r, col) { c.save(); c.fillStyle = col; c.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + i * Math.PI / 4, rr = i % 2 ? r * 0.3 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); c.restore(); }
  function fishShape(c, x, y, s, a, body, fin, glow) { c.save(); c.translate(x, y); c.rotate(a); if (glow) glowAt(c, 0, 0, s * 2.2, glow, 0.6);
    c.beginPath(); c.moveTo(s, 0); c.quadraticCurveTo(s * 0.2, -s * 0.55, -s * 0.6, 0); c.quadraticCurveTo(s * 0.2, s * 0.55, s, 0); c.closePath(); c.fillStyle = body; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke();
    c.beginPath(); c.moveTo(-s * 0.5, 0); c.lineTo(-s * 1.05, -s * 0.42); c.lineTo(-s * 0.9, 0); c.lineTo(-s * 1.05, s * 0.42); c.closePath(); c.fillStyle = fin; c.fill(); c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(s * 0.55, -s * 0.08, s * 0.08, 0, TAU); c.fill(); c.restore(); }
  function eelShape(c, x, y, s, a, t) { c.save(); c.translate(x, y); c.rotate(a); glowAt(c, 0, 0, s * 1.8, '#7A5AA0', 0.35);
    c.strokeStyle = INK; c.lineWidth = s * 0.5; c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 8; i++) { const u = i / 8, px = s * (1 - u * 2.2), py = Math.sin(u * 6 + t * 12) * s * 0.22; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
    c.strokeStyle = '#3A2A50'; c.lineWidth = s * 0.34; c.stroke(); c.fillStyle = '#FFF0B8'; c.beginPath(); c.arc(s * 0.85, -s * 0.06, s * 0.08, 0, TAU); c.fill(); c.restore(); }

  defGate('moon', {
    name: 'The Silverline Basin', biome: 'innertide', goal: 'Light the stars of Pisces', how: `A ring of silver moon-dust round a still pool of starlight; the pool holds the reflection of Pisces with every star dark. Star-fish leap out of the starlight onto the shore: a SILVER ripple on the sand shows where one will land. Stand in it as it lands to catch the star. A VIOLET ripple is an eclipse eel: don't be under it. ${N_STARS} stars light the two fish; then the golden knot-fish leaps ${N_KNOT} times, one spot after the next: catch it ${N_KNOT} times in a row (a miss starts the knot again) and Pisces wakes. Tidelings crawl out now and then.`,
    layout: LAYOUT, legend: {},
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g;
      // (the map gets a one-tile border round the layout: the pool's centre in map tiles)
      const CX = CX0 + (M.MW - LAYOUT[0].length) / 2, CY = CY0 + (M.MH - LAYOUT.length) / 2;
      // the shore: dust beside the starlight, inner (the pool) and outer (the sky beyond)
      const shore = [];
      for (let ty = 0; ty < M.MH; ty++) for (let tx = 0; tx < M.MW; tx++) { if (X.tileAt(tx, ty) !== T_FLOOR) continue; const x = tx + 0.5, y = ty + 0.5, d = Math.hypot(x - CX, y - CY);
        if (d < R_IN + 1.3) { const a = Math.atan2(y - CY, x - CX); shore.push({ x, y, sx: CX + Math.cos(a) * (R_IN - 1.2), sy: CY + Math.sin(a) * (R_IN - 1.2), inner: true }); }
        else if (d > R_OUT - 1.3) { const a = Math.atan2(y - CY, x - CX); shore.push({ x, y, sx: CX + Math.cos(a) * (R_OUT + 1.2), sy: CY + Math.sin(a) * (R_OUT + 1.2), inner: false }); } }
      const S = { intro: true, caught: [0, 0], knot: 0, phase: 'fish', leaps: [], spawnT: 2.2, flies: [], won: false, pests: [], pestT: 9, eelHits: 0, misses: 0 };
      const nCaught = () => S.caught[0] + S.caught[1];
      const starAt = (fi, i) => ({ x: CX + FISH[fi][i][0], y: CY + FISH[fi][i][1] });
      X.after(1.2, () => { S.intro = false; X.banner('THE SILVERLINE BASIN', 'Stand in a SILVER ripple as its star-fish lands to catch it. Keep out of the VIOLET ones', '#E2EEFF', 3.6, true, true); });
      function spot(minD, maxD) { const busy = p => S.leaps.some(l => Math.hypot(l.x - p.x, l.y - p.y) < 2.4); let list = shore.filter(p => { const d = Math.hypot(p.x - me.x, p.y - me.y); return d > minD && d < maxD && !busy(p); }); if (!list.length) list = shore.filter(p => !busy(p)); return list[Math.floor(Math.random() * list.length)] || shore[0]; }
      function leap(kind, minD, maxD) { const p = spot(minD, maxD), life = kind === 'knot' ? 1.3 : Math.max(1.12, 1.6 - nCaught() * 0.04); S.leaps.push({ kind, x: p.x, y: p.y, sx: p.sx, sy: p.sy, t: 0, life }); }
      function land(l) { const hit = !me.dead && Math.hypot(me.x - l.x, me.y - l.y) < 0.95 + (me.r || 0.4) * 0.5;
        if (l.kind === 'star') { if (!hit) { S.misses++; X.ring(l.x, l.y, 0.2, 1.0, 0.3, '#E2EEFF', 0.3); return; }
          const fi = S.caught[0] < 6 ? 0 : 1, idx = S.caught[fi]; S.caught[fi]++; S.flies.push({ x: l.x, y: l.y, fi, idx, t: 0 }); X.sfx.coin && X.sfx.coin(); X.text(l.x, l.y - 1.4, `A star! ${nCaught()}/${N_STARS}`, '#E2EEFF', 15);
          if (fi === 0 && S.caught[0] === 6) X.after(0.7, () => X.banner('THE FIRST FISH SHINES', 'Six more stars for the second', '#E2EEFF', 2.2, true));
          if (nCaught() >= N_STARS) { S.phase = 'knot'; S.leaps = S.leaps.filter(q => q.kind !== 'star'); X.after(0.8, () => X.banner('THE GOLDEN KNOT', `Catch the golden fish ${N_KNOT} times in a row: it leaps again as soon as it lands`, '#FFF0B8', 2.8, true)); X.after(2.4, () => leap('knot', 3, 7)); } }
        else if (l.kind === 'eel') { X.ring(l.x, l.y, 0.2, 1.1, 0.3, '#7A5AA0', 0.4); if (hit) { S.eelHits++; X.hurtPet(X.ST().hp * 0.1, null); X.boom(l.x, l.y - 0.4, 0.9, '#3A2A50', '#B9A6FF', { n: 10, shake: 3 }); X.text(l.x, l.y - 1.4, 'An eclipse eel!', '#B9A6FF', 14); } }
        else { if (hit) { S.knot++; X.sfx.coin && X.sfx.coin(); X.boom(l.x, l.y - 0.5, 1.0, '#E8C46A', '#FFFFFF', { n: 14, shake: 3 }); X.text(l.x, l.y - 1.5, `The knot ${S.knot}/${N_KNOT}`, '#FFF0B8', 16); if (S.knot >= N_KNOT) win(); else leap('knot', 4, 8); }
          else { S.knot = 0; X.text(l.x, l.y - 1.4, 'It slipped away: again!', '#FFF0B8', 14); X.after(0.9, () => { if (!S.won) leap('knot', 3, 7); }); } } }
      function win() { if (S.won) return; S.won = true; self.done = true; S.leaps = []; for (const m of S.pests) if (!m.dead) X.killMon(m); X.flash(0.5, '#FFFFFF'); X.shake(6, 0.5); X.sfx.fanfare && X.sfx.fanfare(); X.banner('PISCES WAKES', 'The two fish shine, the cord is tied: the keeper of the tides answers', '#E2EEFF', 3, true, true); X.ring(CX, CY, 0.5, 8, 0.8, '#E2EEFF', 0.5); X.after(2.8, () => X.winStage()); }
      return { S,
        cam() { return { x: CX, y: CY + 1.2, k: 0.3, zoom: 0.6 }; },
        update(dt) { if (S.intro || S.won) return;
          for (const f of S.flies) f.t += dt * 1.5; S.flies = S.flies.filter(f => f.t < 1);
          for (const l of S.leaps) l.t += dt; const due = S.leaps.filter(l => l.t >= l.life); S.leaps = S.leaps.filter(l => l.t < l.life); due.forEach(land);
          S.spawnT -= dt; if (S.spawnT <= 0) { const stars = S.leaps.filter(l => l.kind === 'star').length, eels = S.leaps.filter(l => l.kind === 'eel').length;
            if (S.phase === 'fish') { const maxN = nCaught() < 6 ? 2 : 3; S.spawnT = Math.max(0.55, 1.15 - nCaught() * 0.04); if (stars + eels < maxN) leap(!stars || Math.random() > 0.28 ? 'star' : 'eel', 2.5, 6.5); }
            else { S.spawnT = 1.6; if (eels < 1) leap('eel', 2, 6); } }
          S.pests = S.pests.filter(m => !m.dead); S.pestT -= dt; if (S.pestT <= 0) { S.pestT = 9; if (S.pests.length < 2) { const p = shore.filter(q => !q.inner && Math.hypot(q.x - me.x, q.y - me.y) > 6); const q = p[Math.floor(Math.random() * p.length)]; if (q) { const m = X.spawnMon('tideling', q.x, q.y, { pack: 970, rift: true, aggro: true }); X.g.total++; S.pests.push(m); } } } },
        goal() { if (S.won) return 'Pisces wakes'; if (S.intro) return 'The Silverline Basin'; if (S.phase === 'knot') return `The golden knot · ${S.knot}/${N_KNOT} in a row`; return `Stars of Pisces ${nCaught()}/${N_STARS} · stand in the silver ripples`; },
        hint() { if (S.won) return null; let best = null, bd = 1e9; for (const l of S.leaps) { if (l.kind === 'eel') continue; const d = Math.hypot(me.x - l.x, me.y - l.y); if (d < bd) { bd = d; best = l; } } return best && bd > 6 ? best : null; },
        drawGround(c) { const T = X.Tz(), t = g.t;
          // the reflection of Pisces in the pool
          c.save(); c.lineCap = 'round';
          for (let fi = 0; fi < 2; fi++) { const n = S.caught[fi], full = n >= 6; for (let i = 0; i < 6; i++) { if (i === 5 && !full) continue; const a = starAt(fi, i), b = starAt(fi, (i + 1) % 6), lit = full || i + 1 < n; c.strokeStyle = lit ? 'rgba(226,238,255,.75)' : 'rgba(226,238,255,.14)'; c.lineWidth = lit ? 2.5 : 1.5; c.setLineDash(lit ? [] : [3, 6]); c.beginPath(); c.moveTo(X.sx(a.x), X.sy(a.y)); c.lineTo(X.sx(b.x), X.sy(b.y)); c.stroke(); } }
          const kx = CX + KNOT[0], ky = CY + KNOT[1], cordK = S.won ? 1 : S.knot / N_KNOT; for (const [fi, i] of [[0, 3], [1, 0]]) { const a = starAt(fi, i); c.strokeStyle = `rgba(255,240,184,${0.12 + cordK * 0.6})`; c.lineWidth = 2; c.setLineDash(cordK >= 1 ? [] : [4, 6]); c.beginPath(); c.moveTo(X.sx(a.x), X.sy(a.y)); c.quadraticCurveTo(X.sx((a.x + kx) / 2 + 0.4), X.sy((a.y + ky) / 2), X.sx(kx), X.sy(ky)); c.stroke(); }
          c.restore();
          for (let fi = 0; fi < 2; fi++) for (let i = 0; i < 6; i++) { const p = starAt(fi, i), lit = i < S.caught[fi], Xs = X.sx(p.x), Ys = X.sy(p.y); if (lit) { glowAt(c, Xs, Ys, T * 0.9, '#A9C8F0', 0.6 + 0.2 * Math.sin(t * 3 + i)); sparkle(c, Xs, Ys, T * 0.28, '#FFFFFF'); } else { c.fillStyle = 'rgba(226,238,255,.3)'; c.beginPath(); c.arc(Xs, Ys, T * 0.08, 0, TAU); c.fill(); } }
          { const Xs = X.sx(kx), Ys = X.sy(ky); glowAt(c, Xs, Ys, T * (0.7 + cordK * 0.8), '#E8C46A', 0.25 + cordK * 0.5); sparkle(c, Xs, Ys, T * (0.16 + cordK * 0.2), cordK > 0 ? '#FFF0B8' : 'rgba(255,240,184,.4)'); }
          // the ripples on the sand where a fish will land (they close in as it comes), and a stir on the water where it leaves
          for (const l of S.leaps) { const Xs = X.sx(l.x), Ys = X.sy(l.y), u = Math.min(1, l.t / l.life), col = l.kind === 'eel' ? '#9A7AC8' : l.kind === 'knot' ? '#FFE08A' : '#E2EEFF', on = Math.hypot(me.x - l.x, me.y - l.y) < 0.95;
            c.save(); c.fillStyle = l.kind === 'eel' ? 'rgba(40,24,64,.35)' : l.kind === 'knot' ? 'rgba(232,196,106,.25)' : 'rgba(169,200,240,.22)'; ell(c, Xs, Ys, T * 0.95, T * 0.42); c.fill();
            c.strokeStyle = col; c.lineWidth = 3; c.setLineDash(l.kind === 'eel' ? [4, 5] : []); ell(c, Xs, Ys, T * 0.95, T * 0.42); c.stroke(); c.setLineDash([]);
            c.lineWidth = 2; c.globalAlpha = 0.8; ell(c, Xs, Ys, T * 0.95 * (1 - u * 0.85), T * 0.42 * (1 - u * 0.85)); c.stroke(); c.restore();
            if (l.kind !== 'eel') glowAt(c, Xs, Ys, T * 1.2, l.kind === 'knot' ? '#E8C46A' : '#A9C8F0', 0.25 + u * 0.3);
            if (l.kind === 'eel') { c.save(); c.strokeStyle = '#C8A8F0'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(Xs - T * 0.2, Ys - T * 0.1); c.lineTo(Xs + T * 0.2, Ys + T * 0.1); c.moveTo(Xs + T * 0.2, Ys - T * 0.1); c.lineTo(Xs - T * 0.2, Ys + T * 0.1); c.stroke(); c.restore(); }
            else if (on) label(c, 'CATCH!', Xs, Ys + T * 0.75, T * 0.26, col);
            if (u < 0.6) { const wx = X.sx(l.sx), wy = X.sy(l.sy); c.save(); c.strokeStyle = col; c.globalAlpha = 0.5; c.lineWidth = 1.5; for (let k = 0; k < 2; k++) { const r = ((t * 1.6 + k * 0.5) % 1); c.globalAlpha = 0.5 * (1 - r); ell(c, wx, wy, T * (0.2 + r * 0.7), T * (0.09 + r * 0.3)); c.stroke(); } c.restore(); } } },
        drawOver(c) { const T = X.Tz(), t = g.t;
          // the leaping fish, in the air over everything
          for (const l of S.leaps) { const u = (l.t - (l.life - 0.6)) / 0.6; if (u < 0) continue; const px = l.sx + (l.x - l.sx) * u, py = l.sy + (l.y - l.sy) * u, z = Math.sin(u * Math.PI) * 2.0, Xs = X.sx(px), Ys = X.sy(py) - z * T, a = Math.atan2(X.sy(l.y) - X.sy(l.sy) - Math.cos(u * Math.PI) * T * 2.4, X.sx(l.x) - X.sx(l.sx));
            if (l.kind === 'eel') eelShape(c, Xs, Ys, T * 0.5, a, t); else if (l.kind === 'knot') fishShape(c, Xs, Ys, T * 0.55, a, '#F2CF6A', '#FFF0B8', '#E8C46A'); else { fishShape(c, Xs, Ys, T * 0.42, a, '#E8EEF8', '#A9C8F0', '#A9C8F0'); sparkle(c, Xs, Ys, T * 0.14, '#FFFFFF'); } }
          // caught stars flying up into the reflection
          for (const f of S.flies) { const p = starAt(f.fi, f.idx), u = f.t, e = 1 - (1 - u) * (1 - u), x = f.x + (p.x - f.x) * e, y = f.y + (p.y - f.y) * e, Xs = X.sx(x), Ys = X.sy(y) - Math.sin(u * Math.PI) * T * 2.4; glowAt(c, Xs, Ys, T * 0.8, '#A9C8F0', 0.8 * (1 - u * 0.5)); sparkle(c, Xs, Ys, T * 0.22, '#FFFFFF'); } },
      };
    },
  });
})();
