/* ---------- Gate 01, Cancer: The Oracle Shell ----------
   Beside the belfry, a shallow crescent pool inside an enormous open shell: pale pink sand, ivory ribs, and at its heart
   a giant clam that holds a pearl. Stand beside the clam and it opens: it asks three riddles, one after another, each
   with five answers to choose from (one right, four wrong). The riddles come in a different order every time, and the
   answers are shuffled every time a riddle is asked. A wrong answer and the clam snaps shut: all three begin again, in a
   new order. Three right in a row and Cancer wakes above the shell. */
const CANCER_RIDDLES = [
  { q: 'I\'m tall when I\'m young, and I\'m short when I\'m old. What am I?', a: 'A candle', wrong: ['A tree', 'A shadow', 'A mountain', 'A tower'] },
  { q: 'What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?', a: 'A river', wrong: ['A clock', 'A road', 'A bottle', 'A mountain'] },
  { q: 'Some try to hide, some try to cheat; but time will show, we always will meet. Try as you might to guess my name, I promise you\'ll know when I do claim. Who am I?', a: 'Death', wrong: ['Time', 'Fate', 'Love', 'Sleep'] },
];
(() => {
  const TAU = Math.PI * 2;
  BIOMES.nursery = { name: 'The Oracle Shell', rift: true, tile: 'heaven', out: true, dark: 0, bg: '#FFE4EC', gap: 'pond', ambient: 'motes', accent: '#FFB3C8', light: '#FFFFFF',
    floor: ['#F6D9CE', '#F2D0C4', '#F8DED3'], grout: '#E6B8AC', hi: '#FFF0EA', top: '#FFF4EE', face: '#D9A99C', faceD: '#C08E82', cliff: '#C08E82', deco: '#61D9D2',
    props: [], hazard: 'spikes', grade: null, fog: '#FFE4EC', darkRGB: '255,228,236' };
  BIOME_ORDER.push('nursery');
  const PINK = '#FFB3C8', INK = '#2B2433', PEARL = '#F4F0FF';
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  defGate('belfry', {
    name: 'The Oracle Shell', biome: 'nursery', goal: 'Answer the clam\'s three riddles', how: 'Stand beside the great clam to open it. It asks three riddles, each with five answers: choose the right one. The riddles come in a new order each time and the answers are shuffled. A wrong answer and the clam snaps shut: all three begin again. Answer all three in a row to wake Cancer.',
    layout: [
      '######################',
      '#.....~~~~~~~~~~.....#',
      '#....................#',
      '#.........O..........#',
      '#....................#',
      '#....................#',
      '#....................#',
      '#.........S..........#',
      '#.....~~~~~~~~~~.....#',
      '######################'],
    legend: { O: {} },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, at = M.marks.O[0];
      const R = { order: [], idx: 0, choices: [], open: false, el: null, tries: 0, lock: false, solved: 0, clamT: 0 };
      function deal() { R.order = shuffle([0, 1, 2]); R.idx = 0; R.solved = 0; ask(); }
      function ask() { const Q = CANCER_RIDDLES[R.order[R.idx]]; R.choices = shuffle([Q.a].concat(Q.wrong)); R.lock = false; render(); }
      const clam = H.obj({ x: at.x, y: at.y, kind: 'oracle', r: 1.2, h: 2.0, t: 0, label: () => (self.done ? 'Cancer wakes ✓' : R.open ? '' : 'The Oracle Shell: hear its riddles'), use() { if (!self.done) openBoard(); },
        draw(c, Xs, Ys, T, o) { const k = R.open ? 1 : Math.min(1, R.clamT); c.save(); c.translate(Xs, Ys);
          c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, T * 0.2, T * 1.3, T * 0.42, 0, 0, TAU); c.fill();
          // the lower shell, its ribs, the pearl, and the upper shell lifted as it opens
          const ribs = (y0, up) => { c.fillStyle = '#FFE9EF'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(-T * 1.15, y0); c.quadraticCurveTo(0, y0 + (up ? -1 : 1) * T * 1.0, T * 1.15, y0); c.quadraticCurveTo(0, y0 + (up ? -1 : 1) * T * 0.25, -T * 1.15, y0); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = 'rgba(217,169,156,.8)'; c.lineWidth = 1.4; for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(i * T * 0.1, y0 + (up ? -1 : 1) * T * 0.2); c.lineTo(i * T * 0.32, y0 + (up ? -1 : 1) * T * 0.7); c.stroke(); } };
          ribs(-T * 0.05, false);
          const lift = k * T * 0.75; glowAtC(c, 0, -T * 0.35, T * (0.6 + 0.5 * k), self.done ? '#FFE37A' : PINK, 0.25 + 0.45 * k + 0.1 * Math.sin(o.t * 3));
          const gr = c.createRadialGradient(-T * 0.08, -T * 0.42, T * 0.03, 0, -T * 0.3, T * 0.3); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.6, PEARL); gr.addColorStop(1, '#C9B8E8'); c.fillStyle = gr; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.arc(0, -T * 0.3, T * 0.26, 0, TAU); c.fill(); c.stroke();
          c.save(); c.translate(0, -lift); ribs(-T * 0.25, true); c.restore();
          if (R.open) { for (let i = 0; i < 3; i++) { c.fillStyle = i < R.solved ? '#8FE0A6' : 'rgba(255,255,255,.6)'; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc((i - 1) * T * 0.32, -T * 1.55 - lift * 0.3, T * 0.1, 0, TAU); c.fill(); c.stroke(); } }
          c.restore(); } });
      const glowAtC = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
      X.after(1.2, () => X.banner('THE ORACLE SHELL', 'Stand beside the great clam: answer its three riddles', PINK, 2.8, true, true));
      /* ---- the riddle card ---- */
      function openBoard() { if (R.open) return; R.open = true; document.querySelectorAll('.rift-riddle').forEach(e => e.remove()); const el = document.createElement('div'); el.className = 'arc-overlay rift-match rift-riddle'; el.id = 'riftRiddle'; R.el = el; document.getElementById('arcade').appendChild(el);
        el.addEventListener('click', ev => { const b = ev.target.closest('[data-ans]'); if (b) { answer(+b.dataset.ans); return; } if (ev.target.closest('.rm-close')) closeBoard(); });
        X.sfx.unlock(); deal(); }
      function closeBoard() { R.open = false; if (R.el) { R.el.remove(); R.el = null; } }
      function render(flash) { const el = R.el; if (!el) return; const Q = CANCER_RIDDLES[R.order[R.idx]];
        el.innerHTML = `<div class="rm-card rr-card${flash ? ' ' + flash : ''}"><div class="rm-head"><b>The Oracle Shell</b><button type="button" class="btn rm-close">Step away</button></div>
          <div class="rr-dots">${[0, 1, 2].map(i => `<i class="${i < R.solved ? 'on' : i === R.idx ? 'cur' : ''}"></i>`).join('')}<span>Riddle ${R.idx + 1} of 3</span></div>
          <p class="rr-q">${esc(Q.q)}</p>
          <div class="rr-list">${R.choices.map((a, i) => `<button type="button" class="rr-ans" data-ans="${i}"><span>${'ABCDE'[i]}</span>${esc(a)}</button>`).join('')}</div>
          <p class="rm-help">One answer is right. A wrong answer and all three begin again, in a new order.</p></div>`; }
      function answer(i) { if (R.lock || self.done) return; const Q = CANCER_RIDDLES[R.order[R.idx]], right = R.choices[i] === Q.a; R.lock = true; R.tries++;
        const btn = R.el && R.el.querySelector(`[data-ans="${i}"]`); if (btn) btn.classList.add(right ? 'right' : 'wrong');
        if (right) { R.solved++; X.sfx.chirp(); X.sparks(clam.x, clam.y - 1.2, '#8FE0A6', 10, 4);
          if (R.solved >= 3) { setTimeout(() => { closeBoard(); win(); }, 700); return; }
          setTimeout(() => { R.idx++; ask(); }, 650); }
        else { X.sfx.wrong(); X.shake(5, 0.2); setTimeout(() => { if (!R.el) return; X.banner('THE CLAM SNAPS SHUT', 'Wrong: the three riddles begin again', '#FF9BD2', 2.0, true); deal(); render('shake'); }, 750); } }
      function win() { if (self.done) return; self.done = true; X.banner('THE ORACLE IS ANSWERED', 'Cancer wakes above the shell', '#FFE37A', 2.8, true, true); X.flash(0.4, '#FFFFFF'); X.sfx.fanfare(); X.ring(clam.x, clam.y, 0.3, 5, 0.8, PINK, 0.4); X.after(2.6, () => X.winStage()); }
      return { R, clam, answer, openBoard, closeBoard, deal, riddles: CANCER_RIDDLES,
        hint() { return self.done || R.open ? null : clam; },
        update(dt) { clam.t += dt; R.clamT = Math.max(0, Math.min(1, R.clamT + (R.open ? dt * 3 : -dt * 2))); if (R.open && Math.hypot(me.x - clam.x, me.y - clam.y) > 4) closeBoard(); if (R.open && (me.dead || g.won)) closeBoard(); },
        goal: () => self.done ? 'Cancer wakes' : R.open ? `Riddle ${R.idx + 1} of 3 · ${R.solved} answered` : 'Stand beside the great clam to hear its riddles',
        drawGround(c) { const T = X.Tz(); if (R.open || self.done) return; const Xs = X.sx(clam.x), Ys = X.sy(clam.y); c.save(); c.globalAlpha = 0.3 + 0.15 * Math.sin(g.t * 3); c.strokeStyle = PINK; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.ellipse(Xs, Ys, T * 1.9, T * 1.0, 0, 0, TAU); c.stroke(); c.restore(); },
      };
    },
  });
})();
