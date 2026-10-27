/* ---------- Gate 06, Aquarius: The Raincatcher Array ----------
   On the crash site's flat roof stand three great receiver dishes, each tuned to one colour of star: teal, violet,
   gold. Stars rain down out of the night: each one's landing spot shows first as a growing ring with its colour.
   Stand in the ring as it lands to catch it (you can carry up to three; a caught star slowly dims, so deliver it soon). Walk into a dish of the same colour to deliver. Red falling debris lands on rings
   too: don't be under it. Fill all three dishes (four stars each) and Aquarius wakes. */
(() => {
  const TAU = Math.PI * 2, INK = '#2B2433', COLS = [{ k: 'teal', col: '#3FE0C8', hi: '#B8FFF2' }, { k: 'violet', col: '#C452FF', hi: '#E8B8FF' }, { k: 'gold', col: '#FFC94A', hi: '#FFF1B8' }], NEED = 4;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  function starPath(c, x, y, r, n) { c.beginPath(); for (let i = 0; i < (n || 10); i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); }
  defGate('yuggoth', {
    name: 'The Raincatcher Array', biome: 'wreckfield', goal: 'Fill the three receiver dishes with falling stars', how: 'Stars fall out of the night: a growing ring of the star\'s colour shows where each will land. Stand in the ring as it lands to catch it. You can carry three (a caught star slowly dims: deliver it before it goes out). Walk into the dish of the same colour to deliver. Red debris falls on red rings: stay out from under it. Four stars fill a dish; fill all three.',
    layout: [
      '#######################',
      '#.....................#',
      '#..1...............2..#',
      '#.....................#',
      '#.....................#',
      '#.....................#',
      '#.....................#',
      '#.....................#',
      '#..........S..........#',
      '#.....................#',
      '#.....................#',
      '#.....................#',
      '#.....................#',
      '#..........3..........#',
      '#.....................#',
      '#######################'],
    legend: { 1: {}, 2: {}, 3: {} },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, ST = X.ST(), W0 = 21, H0 = 14;
      const dishes = ['1', '2', '3'].map((ch, i) => ({ i, x: M.marks[ch][0].x, y: M.marks[ch][0].y, C: COLS[i], n: 0, flash: 0 }));
      const S = { intro: true, drops: [], carry: [], dropT: 1.2, t: 0, caught: 0, missed: 0, burnt: 0, won: false, hitT: 0 };
      const total = () => dishes.reduce((a, d) => a + Math.min(NEED, d.n), 0);
      dishes.forEach(d => H.obj({ x: d.x, y: d.y, kind: 'dish', r: 0.1, h: 3.2, label: '', draw(c, Xs, Ys, T) { drawDish(c, d, Xs, Ys, T); } }));
      function drawDish(c, d, Xs, Ys, T) { const t = g.t, full = d.n >= NEED, col = d.C.col; c.save();
        c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 1.4, T * 0.45, 0, 0, TAU); c.fill();
        // the receiving ring on the floor (walk into it to deliver)
        c.strokeStyle = col; c.lineWidth = 3; c.setLineDash([8, 6]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 1.9, T * 0.75, 0, 0, TAU); c.stroke(); c.setLineDash([]);
        // a steel mast and a tilted parabolic dish
        c.fillStyle = '#2A2F3E'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.16, Ys - T * 1.7, T * 0.32, T * 1.7); c.strokeRect(Xs - T * 0.16, Ys - T * 1.7, T * 0.32, T * 1.7);
        c.save(); c.translate(Xs, Ys - T * 2.1); c.rotate(-0.25); c.beginPath(); c.ellipse(0, 0, T * 1.25, T * 0.55, 0, 0, TAU); const gr = c.createRadialGradient(-T * 0.3, -T * 0.15, T * 0.1, 0, 0, T * 1.3); gr.addColorStop(0, '#C8D0E0'); gr.addColorStop(1, '#4A5268'); c.fillStyle = gr; c.fill(); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; for (const k of [0.4, 0.75]) { c.beginPath(); c.ellipse(0, 0, T * 1.25 * k, T * 0.55 * k, 0, 0, TAU); c.stroke(); }
        // the feed horn with the stars delivered so far round it
        c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 0); c.lineTo(T * 0.1, -T * 0.9); c.stroke(); glowAt(c, T * 0.1, -T * 0.95, T * (0.6 + d.n * 0.2 + d.flash), col, 0.5 + d.n * 0.1 + d.flash); c.fillStyle = full ? '#FFFFFF' : d.C.hi; c.beginPath(); c.arc(T * 0.1, -T * 0.95, T * 0.16, 0, TAU); c.fill(); c.restore();
        // pips: stars delivered out of four
        for (let k = 0; k < NEED; k++) { const px = Xs + (k - 1.5) * T * 0.42, py = Ys + T * 0.95; c.fillStyle = k < d.n ? col : 'rgba(20,20,30,.6)'; c.strokeStyle = INK; c.lineWidth = 1.5; starPath(c, px, py, T * 0.17); c.fill(); c.stroke(); }
        if (full) { glowAt(c, Xs, Ys - T * 1.8, T * 2.6, col, 0.35 + 0.15 * Math.sin(t * 3)); label(c, 'FULL', Xs, Ys - T * 3.6, T * 0.34, d.C.hi); }
        c.restore(); }
      function spawnDrop() { const harder = Math.min(1, S.t / 70); let x, y; for (let k = 0; k < 20; k++) { x = 1.6 + Math.random() * (W0 - 1.2); y = 1.8 + Math.random() * (H0 - 1.8); if (!dishes.some(d => Math.hypot(d.x - x, d.y - y) < 2.4) && !S.drops.some(q => Math.hypot(q.x - x, q.y - y) < 1.8)) break; }
        const bad = Math.random() < 0.22 + harder * 0.18, need = dishes.filter(d => d.n < NEED), C = need.length ? need[Math.floor(Math.random() * need.length)].C : COLS[0];
        S.drops.push({ x, y, bad, C, t: 0, fall: 1.9 - harder * 0.5, r: bad ? 1.15 : 0.95 }); }
      X.after(1.0, () => { S.intro = false; X.banner('THE RAINCATCHER ARRAY', 'Stand in a star\'s ring as it lands to catch it; carry it to the dish of its colour', COLS[0].hi, 3.2, true, true); });
      return { S, dishes,
        cam() { return { x: W0 / 2 + 1, y: H0 / 2 + 1, k: 0.45, zoom: 0.62 }; },
        update(dt) { if (S.intro || S.won) return; S.t += dt; const harder = Math.min(1, S.t / 70);
          // the rain: steady at first, heavier as it goes
          S.dropT -= dt; if (S.dropT <= 0) { S.dropT = 1.05 - harder * 0.45; spawnDrop(); if (harder > 0.5 && Math.random() < 0.4) spawnDrop(); }
          for (const q of S.drops) { q.t += dt; if (q.t >= q.fall && !q.done) { q.done = true; const inside = !me.dead && Math.hypot(me.x - q.x, (me.y - q.y) * 1.2) < q.r + me.r * 0.5;
              if (q.bad) { X.boom(q.x, q.y, 1.2, '#FF6A4A', '#FFE0C8', { n: 16, shake: 5 }); X.sfx.crash && X.sfx.crash(); if (inside && !me.dodge) { X.hurtPet(ST.hp * 0.12, null); S.burnt++; if (S.carry.length) { const lost = S.carry.pop(); X.text(me.x, me.y - 1.4, 'Hit! You dropped a star', '#FF9BD2', 13); } } }
              else if (inside && S.carry.length < 3) { S.carry.push({ C: q.C, life: 14 }); S.caught++; X.sfx.chirp(); X.sparks && X.sparks(q.x, q.y, q.C.hi, 14, 5); X.text(me.x, me.y - 1.5, `Caught! ${S.carry.length}/3`, q.C.hi, 13); }
              else { S.missed++; X.sparks && X.sparks(q.x, q.y, q.C.hi, 10, 4); if (inside) X.text(me.x, me.y - 1.4, 'Your arms are full', '#FFFFFF', 12); } } }
          S.drops = S.drops.filter(q => !q.done || q.t < q.fall + 0.4);
          // carried stars dim, and slow you a little
          for (const s2 of S.carry) s2.life -= dt; const gone = S.carry.filter(s2 => s2.life <= 0).length; if (gone) { S.carry = S.carry.filter(s2 => s2.life > 0); X.text(me.x, me.y - 1.4, 'A star went out', '#FF9BD2', 12); }
          // delivering: walk into a dish's ring with stars of its colour
          for (const d of dishes) { d.flash = Math.max(0, d.flash - dt * 2); if (Math.hypot(me.x - d.x, (me.y - d.y) * 1.4) < 2.1) { const mine = S.carry.filter(s2 => s2.C === d.C && d.n < NEED); if (mine.length) { for (const s2 of mine) { if (d.n >= NEED) break; d.n++; S.carry.splice(S.carry.indexOf(s2), 1); } d.flash = 1; X.sfx.fanfare(); X.ring(d.x, d.y - 2, 0.3, 3, 0.4, d.C.col, 0.4); X.text(d.x, d.y - 3.6, d.n >= NEED ? `${d.C.k.toUpperCase()} DISH FULL` : `${d.n}/${NEED}`, d.C.hi, 15); } } }
          if (!S.won && dishes.every(d => d.n >= NEED)) { S.won = true; self.done = true; S.drops.length = 0; X.flash(0.6, '#FFFFFF'); X.banner('AQUARIUS WAKES', 'Three dishes full of starlight: the water-bearer answers', COLS[0].hi, 3, true, true); X.sfx.fanfare(); for (const d of dishes) X.ring(d.x, d.y - 2, 0.4, 5, 0.8, d.C.col, 0.5); X.after(2.8, () => X.winStage()); } },
        goal() { if (S.won) return 'Aquarius wakes'; if (S.intro) return 'The Raincatcher Array'; return `Stars delivered ${total()}/${NEED * 3} · carrying ${S.carry.length}/3`; },
        hint() { if (S.won || !S.carry.length) return null; const d = dishes.find(q => q.C === S.carry[0].C && q.n < NEED); return d ? { x: d.x, y: d.y, label: 'Deliver it here', h: 3 } : null; },
        drawGround(c) { const T = X.Tz(), t = g.t;
          // the landing rings: they close in as the star falls; red for debris
          for (const q of S.drops) { if (q.done) continue; const u = Math.min(1, q.t / q.fall), Xs = X.sx(q.x), Ys = X.sy(q.y), col = q.bad ? '#FF5A4A' : q.C.col; c.save(); c.globalAlpha = 0.25 + u * 0.35; c.fillStyle = col; c.beginPath(); c.ellipse(Xs, Ys, q.r * T * u, q.r * T * 0.8 * u, 0, 0, TAU); c.fill(); c.globalAlpha = 0.9; c.strokeStyle = col; c.lineWidth = 2.5; c.setLineDash(q.bad ? [5, 4] : []); c.beginPath(); c.ellipse(Xs, Ys, q.r * T, q.r * T * 0.8, 0, 0, TAU); c.stroke(); c.restore(); }
          // the falling stars and debris, streaking down onto their rings
          for (const q of S.drops) { if (q.done) continue; const u = Math.min(1, q.t / q.fall), Xs = X.sx(q.x) + (1 - u) * T * 3, Ys = X.sy(q.y) - (1 - u) * T * 12, col = q.bad ? '#FF6A4A' : q.C.col;
            c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = col; c.globalAlpha = 0.6; c.lineWidth = T * 0.18; c.lineCap = 'round'; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + T * 1.2, Ys - T * 3.2); c.stroke(); c.restore(); glowAt(c, Xs, Ys, T * 0.9, col, 0.8);
            c.save(); if (q.bad) { c.fillStyle = '#5A2A20'; c.strokeStyle = '#FF6A4A'; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.3, Ys - T * 0.1); c.lineTo(Xs - T * 0.05, Ys - T * 0.35); c.lineTo(Xs + T * 0.3, Ys - T * 0.15); c.lineTo(Xs + T * 0.2, Ys + T * 0.25); c.lineTo(Xs - T * 0.2, Ys + T * 0.25); c.closePath(); c.fill(); c.stroke(); } else { c.fillStyle = q.C.hi; c.strokeStyle = INK; c.lineWidth = 1.5; starPath(c, Xs, Ys, T * 0.35); c.fill(); c.stroke(); } c.restore(); }
          // the stars you carry, bobbing round you, dimming as they go
          S.carry.forEach((s2, i) => { const a = t * 2.2 + i * TAU / 3, Xs = X.sx(me.x) + Math.cos(a) * T * 0.7, Ys = X.sy(me.y) - T * 1.3 + Math.sin(a) * T * 0.25, k = Math.min(1, s2.life / 5); glowAt(c, Xs, Ys, T * 0.6, s2.C.col, 0.4 + 0.4 * k); c.save(); c.globalAlpha = 0.35 + 0.65 * k; c.fillStyle = s2.C.hi; c.strokeStyle = INK; c.lineWidth = 1.5; starPath(c, Xs, Ys, T * 0.24); c.fill(); c.stroke(); c.restore(); }); },
      };
    },
  });
})();
