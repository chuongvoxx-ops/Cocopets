/* ---------- Gate 02, Taurus: The Constellation That Cannot Be Broken ----------
   A dark floor of night-blue moss. Luminous stars stand on it, joined by faint dotted lines. Your pet carries a strand
   of golden light: stand beside a star to begin there, then walk to a star joined to it and the line between them is
   traced in solid gold. Every line must be traced exactly once without lifting the thread: a star may be visited
   again, a line may not be walked twice. The thread continues from its last star, wherever your pet wanders. Undo takes
   the last line back; Start over clears the sky. Three constellations: five stars; six stars with a star you must
   begin at; seven stars with a bridge that must be crossed before a dark star wakes. Trace all three and Taurus stands
   among the stars. */
(() => {
  const TAU = Math.PI * 2;
  BIOMES.meadow = { name: 'The Unbroken Constellation', rift: true, tile: 'bloom', out: true, dark: 0.35, bg: '#0E1030', gap: 'pond', ambient: 'sparkles', accent: '#FFD36B', light: '#FFF4C0',
    floor: ['#1E2452', '#1A2049', '#222858'], grout: '#141838', hi: '#2E3570', top: '#2A3068', face: '#161A3C', faceD: '#0E1030', cliff: '#161A3C', deco: '#FFD36B',
    props: [], hazard: 'spikes', grade: null, fog: '#0E1030', darkRGB: '14,16,48' };
  BIOME_ORDER.push('meadow');
  const GOLD = '#FFD36B', INK = '#2B2433', DIM = 'rgba(200,210,255,.45)', PALE = '#DCE8FF';
  /* the three skies: stars in a 12×9 field (tile units), lines as pairs of star indices; start: a star to begin at;
     bridge: [line, star] the line to cross before the star wakes */
  const SKIES = [
    { name: 'The Lantern', stars: [[3, 7], [9, 7], [9, 3], [3, 3], [6, 1]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3], [3, 4], [4, 2]], tip: 'Five stars, eight lines. Two stars have an odd number of lines: the thread must begin at one of them' },
    { name: 'The Twin Horns', stars: [[2, 6], [4, 2], [6, 5], [8, 2], [10, 6], [6, 8]], lines: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 2], [4, 5], [5, 0]], start: 0, tip: 'Begin at the bright star. Eight lines through six stars; one wrong turn strands a horn' },
    { name: 'The Bull\'s Eye', stars: [[2, 3], [2, 7], [5, 5], [8, 5], [11, 3], [11, 7], [8, 1]], lines: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 3], [3, 6], [6, 4]], bridge: [3, 6], tip: 'Nine lines. The dark star wakes only once the bridge between the two eyes is crossed' },
  ];
  const layout = (() => { const rows = ['##############']; for (let y = 0; y < 9; y++) rows.push('#............#'); rows.push('#......S.....#', '##############'); return rows; })();
  defGate('garden', {
    name: 'The Unbroken Constellation', biome: 'meadow', goal: 'Trace every line of three constellations without lifting the thread', how: 'Stars stand on the floor, joined by dotted lines. Stand beside a star to begin the thread there, then walk to a star joined to it: the line between them turns to solid gold. Trace every line exactly once. You may come back to a star as often as you like; you may never walk a line twice. The thread goes on from its last star, wherever your pet is. Stranded with lines left? Use Undo to take the last line back (or Start over). Three skies: a small one; one with a star you must begin at; one with a bridge that must be crossed before a dark star wakes.',
    layout, legend: {},
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g;
      const R = { sky: 0, path: [], used: new Set(), t: 0, mode: 'intro', el: null, flashT: 0, msgT: 0 };
      let K = null, stars = [], lines = [];
      const at = i => ({ x: stars[i].x, y: stars[i].y });
      const degree = i => lines.filter(l => l.a === i || l.b === i).length;
      const lineBetween = (i, j) => lines.find(l => (l.a === i && l.b === j) || (l.a === j && l.b === i));
      const end = () => (R.path.length ? R.path[R.path.length - 1] : -1);
      const awake = i => !(K.bridge && i === K.bridge[1] && !R.used.has(K.bridge[0]));
      function load(n) { K = SKIES[n]; R.sky = n; R.path = []; R.used = new Set(); stars = K.stars.map(([x, y], i) => ({ x: x + 1.5, y: y + 1.5, i })); lines = K.lines.map(([a, b], i) => ({ a, b, i }));
        X.banner(K.name.toUpperCase(), `Sky ${n + 1} of 3 · ${K.tip}`, GOLD, 3.2, true, true); X.sfx.chirp(); buttons(); }
      function msg(s, col) { X.text(me.x, me.y - 1.6, s, col || PALE, 12); }
      /* the pet beside a star: the thread begins there, or goes on along an untraced line from its last star */
      function visit(i) { const e = end();
        if (e < 0) { if (K.start != null && i !== K.start) { msg('The thread must begin at the bright star', '#FF9BD2'); X.sfx.wrong(); return; } if (!awake(i)) { msg('That star is dark: cross the bridge first', '#B98BE0'); X.sfx.wrong(); return; } R.path.push(i); X.sfx.sparkle(); X.ring(stars[i].x, stars[i].y, 0.3, 1.6, 0.4, GOLD, 0.3); msg('The thread begins', GOLD); buttons(); return; }
        if (i === e) return;
        const L = lineBetween(e, i);
        if (!L) { msg('No line joins those two stars', '#FF9BD2'); X.sfx.wrong(); return; }
        if (R.used.has(L.i)) { msg('That line is already traced: a line is never walked twice', '#FF9BD2'); X.sfx.wrong(); return; }
        if (!awake(i)) { msg('That star is dark until the bridge is crossed', '#B98BE0'); X.sfx.wrong(); return; }
        R.used.add(L.i); R.path.push(i); X.sfx.coin(); X.sparks(stars[i].x, stars[i].y - 0.4, GOLD, 8, 4); R.flashT = 0.4; buttons();
        if (K.bridge && L.i === K.bridge[0]) { X.banner('THE BRIDGE IS CROSSED', 'The dark star wakes', GOLD, 1.8, true); X.ring(stars[K.bridge[1]].x, stars[K.bridge[1]].y, 0.3, 2, 0.5, GOLD, 0.3); }
        if (R.used.size === lines.length) { done(); return; }
        // stranded: no untraced line leaves the thread's end
        const open = lines.some(l => !R.used.has(l.i) && (l.a === i || l.b === i) && awake(l.a === i ? l.b : l.a));
        if (!open) { X.banner('STRANDED', `${lines.length - R.used.size} line${lines.length - R.used.size === 1 ? '' : 's'} left and none from here · Undo`, '#FF9BD2', 2.2, true); X.sfx.wrong(); } }
      function undo() { if (R.path.length <= 1) { R.path = []; buttons(); return; } const i = R.path.pop(), e = end(), L = lineBetween(e, i); if (L) R.used.delete(L.i); X.sfx.boop(); msg('Undone', PALE); buttons(); }
      function restart() { R.path = []; R.used = new Set(); X.sfx.whoosh(); msg('The sky is cleared', PALE); buttons(); }
      function done() { X.banner(`${K.name.toUpperCase()} SHINES`, R.sky < 2 ? 'Every line traced · the next sky' : 'Every line traced', '#8FE0A6', 2.4, true); X.sfx.fanfare(); X.flash(0.3, GOLD); for (const s of stars) X.sparks(s.x, s.y - 0.4, GOLD, 6, 4);
        if (R.sky < 2) { R.mode = 'between'; X.after(2.6, () => { R.mode = 'play'; load(R.sky + 1); }); } else { self.done = true; R.mode = 'won'; buttons(); X.after(1.2, () => { X.banner('THE CONSTELLATION HOLDS', 'Taurus stands among the stars', GOLD, 2.8, true, true); X.sfx.fanfare(); }); X.after(3.8, () => X.winStage()); } }
      /* the Undo and Start over buttons over the play area */
      function buttons() { let el = R.el; if (!el) { el = document.createElement('div'); el.className = 'rift-match rift-trace'; el.id = 'riftTrace'; document.querySelectorAll('.rift-trace').forEach(e => e.remove()); document.getElementById('arcade').appendChild(el); R.el = el; el.addEventListener('click', ev => { if (ev.target.closest('[data-undo]')) undo(); else if (ev.target.closest('[data-restart]')) restart(); }); }
        if (self.done) { el.remove(); R.el = null; return; } el.innerHTML = `<button type="button" class="btn" data-undo ${R.path.length ? '' : 'disabled'}>↶ Undo</button><button type="button" class="btn" data-restart ${R.path.length ? '' : 'disabled'}>Start over</button>`; }
      X.after(1.2, () => { R.mode = 'play'; load(0); });
      // each star is an object the pet uses by standing beside it (the channel is quick here)
      const starObjs = [];
      for (let i = 0; i < 7; i++) starObjs.push(H.obj({ x: -9, y: -9, kind: 'star', i, r: 0.9, h: 1.3, label: o => (stars[o.i] ? (end() < 0 ? (K.start === o.i ? 'The bright star: begin here' : K.start != null ? '' : 'Begin here') : end() === o.i ? 'The thread ends here' : '') : ''), use(o) { if (R.mode === 'play' && stars[o.i]) visit(o.i); }, draw() {} }));
      return { R, SKIES, visit, undo, restart, load, get stars() { return stars; }, get lines() { return lines; }, end,
        hint() { if (R.mode !== 'play') return null; const e = end(); if (e < 0) return K.start != null ? { x: stars[K.start].x, y: stars[K.start].y, kind: 'star', label: 'Begin here' } : null; return null; },
        update(dt) { R.t += dt; if (R.flashT > 0) R.flashT -= dt; for (const o of starObjs) { const s = stars[o.i]; if (s) { o.x = s.x; o.y = s.y; o.used = o.used && Math.hypot(me.x - s.x, me.y - s.y) < 1.4; } else { o.x = -9; o.y = -9; } } },
        goal: () => self.done ? 'Taurus awakens' : R.mode === 'intro' ? 'The Unbroken Constellation' : `${K.name} · ${R.used.size}/${lines.length} lines traced${end() < 0 ? ' · stand by a star to begin' : ''}`,
        drawGround(c) { if (!K) return; const T = X.Tz();
          // the lines: dotted until traced, then a solid golden beam; the thread's growing end glows
          for (const l of lines) { const A = at(l.a), B = at(l.b), x0 = X.sx(A.x), y0 = X.sy(A.y) - T * 0.3, x1 = X.sx(B.x), y1 = X.sy(B.y) - T * 0.3, on = R.used.has(l.i), bridge = K.bridge && l.i === K.bridge[0];
            c.save(); if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.strokeStyle = GOLD; c.lineWidth = T * 0.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.strokeStyle = GOLD; c.lineWidth = T * 0.1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.03; c.stroke(); }
            else { c.strokeStyle = bridge ? '#B98BE0' : DIM; c.lineWidth = bridge ? 3 : 2; c.setLineDash([6, 8]); c.lineDashOffset = -R.t * 12; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); if (bridge) { c.setLineDash([]); c.font = `800 ${Math.round(T * 0.24)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#B98BE0'; c.strokeText('bridge', (x0 + x1) / 2, (y0 + y1) / 2 - 6); c.fillText('bridge', (x0 + x1) / 2, (y0 + y1) / 2 - 6); } }
            c.restore(); }
          // the stars: luminous points, the thread's end brightest, a dark one asleep behind the bridge, the bright start
          stars.forEach((s, i) => { const Xs = X.sx(s.x), Ys = X.sy(s.y) - T * 0.3, isEnd = end() === i, inPath = R.path.includes(i), dark = !awake(i), bright = K.start === i, r = T * (bright ? 0.36 : 0.28), deg = degree(i);
            c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(Xs, X.sy(s.y) + T * 0.1, r, r * 0.4, 0, 0, TAU); c.fill();
            if (!dark) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = isEnd ? 0.8 + 0.2 * Math.sin(R.t * 6) : inPath ? 0.45 : 0.3; blitSized(c, glowSprite(bright && !inPath ? '#FFFFFF' : GOLD), Xs - r * 2.4, Ys - r * 2.4, r * 4.8, r * 4.8); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
            c.translate(Xs, Ys); c.rotate(R.t * (isEnd ? 1.2 : 0.3)); c.fillStyle = dark ? '#2A2050' : isEnd ? '#FFFFFF' : inPath ? GOLD : '#FFF4C0'; c.strokeStyle = dark ? '#5A4A90' : INK; c.lineWidth = 1.5; c.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); c.rotate(-R.t * (isEnd ? 1.2 : 0.3));
            // the number of lines at this star (the odd ones are where a thread can begin or end)
            c.font = `800 ${Math.round(T * 0.22)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = deg % 2 ? '#FFB3C8' : PALE; c.strokeText(`${deg}`, 0, -r - 6); c.fillText(`${deg}`, 0, -r - 6);
            if (dark) { c.fillStyle = '#B98BE0'; c.font = `800 ${Math.round(T * 0.2)}px ${arcFont}`; c.strokeText('asleep', 0, r + T * 0.3); c.fillText('asleep', 0, r + T * 0.3); }
            c.restore(); });
          // the thread from its last star to the pet
          const e = end(); if (e >= 0 && !self.done) { const s = stars[e], x0 = X.sx(s.x), y0 = X.sy(s.y) - T * 0.3, x1 = X.sx(me.x), y1 = X.sy(me.y) - T * 0.6; c.save(); c.globalAlpha = 0.5 + 0.2 * Math.sin(R.t * 5); c.strokeStyle = GOLD; c.lineWidth = 2; c.setLineDash([3, 5]); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, Math.min(y0, y1) - T * 0.5, x1, y1); c.stroke(); c.restore(); }
        },
        drawOver(c) { if (!K || self.done) return; const W = X.W(), bw = Math.min(268, W - 130); c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, 10, 124, bw, 40, 8); c.fill(); c.font = `800 10.5px ${arcFont}`; c.textAlign = 'left'; c.fillStyle = '#FFFFFF'; c.fillText('Trace every line once. Stars may be', 18, 139); c.fillText('revisited; a line may never be walked twice.', 18, 151); c.fillStyle = GOLD; c.fillText(`${K.name} · ${R.used.size} of ${lines.length} lines`, 18, 161); c.restore(); },
        leave() { if (R.el) R.el.remove(); },
      };
    },
  });
})();
