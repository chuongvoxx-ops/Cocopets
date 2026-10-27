/* ---------- Gate 03, Scorpio: The Amber Vigil ----------
   A low sandstone courtyard between two rock spines, its floor dark amber glass in broad hexagons. A bronze scorpion
   wraps the gate: pincers for pillars, a violet star held in its tail. Three watch-stones sweep slow sight cones across
   the floor (each cone is drawn, with where it turns next). Bring three star fragments back to the gate: cover rocks
   hide the pet; decoy chimes on safe pedestals turn a watch-stone away for a shown interval. Seen: a soft flash, the
   pet and the fragment it carries return to their start; banked fragments stay. No combat, no damage. */
(() => {
  const TAU = Math.PI * 2;
  BIOMES.vigil = { name: 'The Amber Vigil', rift: true, tile: 'desert', out: true, dark: 0.1, bg: '#2A1A2E', gap: 'pit', ambient: 'motes', accent: '#B983F5', light: '#FFD36B',
    floor: ['#8A5A1E', '#7E5219', '#946324'], grout: '#5A3A10', hi: '#B07A30', top: '#C9A06A', face: '#8E6A3E', faceD: '#6A4C2A', cliff: '#6A4C2A', deco: '#B983F5',
    props: [], hazard: 'spikes', grade: null, fog: '#2A1A2E', darkRGB: '42,26,46' };
  BIOME_ORDER.push('vigil');
  const AMBER = '#C98A2E', VIOLET = '#B983F5', INK = '#2B2433', BRONZE = '#957943';
  defGate('dunes', {
    name: 'The Amber Vigil', biome: 'vigil', goal: 'Bring the three star fragments back to the gate', how: 'Three watch-stones sweep sight cones across the floor (drawn, with where they turn next). Stay out of them, or behind a cover rock. The glowing sanctuary at the start (around the gate) is always safe. Stand at a decoy chime to turn its watch-stone away for eight seconds. Seen, the pet and the fragment it carries go back to the start; banked fragments stay. No combat.',
    layout: [
      '##############################',
      '#.....h.........h.......h....#',
      '#..1.........w......h...3....#',
      '#...............h............#',
      '#.........h..........w.......#',
      '#....d......................d#',
      '#.......w........h....2......#',
      '#....h.......................#',
      '#.........h.....d............#',
      '#............G...............#',
      '#............S...............#',
      '##############################'],
    legend: { h: {}, w: {}, d: {}, 1: {}, 2: {}, 3: {}, G: {} },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, gate = M.marks.G[0];
      const covers = M.marks.h.map(p => ({ x: p.x, y: p.y }));
      const watchers = M.marks.w.map((p, i) => ({ x: p.x, y: p.y, i, a: X.R() * TAU, w: 0.32 + i * 0.05, range: 8.5, half: 0.55, off: 0 }));
      const frags = [1, 2, 3].map(n => ({ n, x: M.marks[String(n)][0].x, y: M.marks[String(n)][0].y, home: { x: M.marks[String(n)][0].x, y: M.marks[String(n)][0].y }, carried: false, banked: false }));
      const S = { intro: true, flashT: 0, seenN: 0, carried: null };
      // each pedestal turns the watch-stone nearest it
      M.marks.d.forEach(p => { const w = watchers.reduce((b, q) => (Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(b.x - p.x, b.y - p.y) ? q : b)); H.obj({ x: p.x, y: p.y, kind: 'chime', r: 0.9, h: 1.3, label: o => (w.off > 0 ? `Watch-stone ${w.i + 1} looks away · ${Math.ceil(w.off)}s` : `Decoy chime · turns watch-stone ${w.i + 1}`), use(o) { w.off = 8; X.text(o.x, o.y - 1.2, `Watch-stone ${w.i + 1} turns to the chime`, VIOLET, 12); X.sfx.chirp(); X.ring(o.x, o.y, 0.3, 2.5, 0.6, VIOLET, 0.3); },
        draw(c, Xs, Ys, T) { c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, T * 0.12, T * 0.4, T * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = '#9E7A4A'; c.strokeStyle = INK; c.lineWidth = 2; GFX.rr(c, -T * 0.3, -T * 0.6, T * 0.6, T * 0.7, 4); c.fill(); c.stroke(); c.strokeStyle = BRONZE; c.lineWidth = 3; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * T * 0.14, -T * 0.6); c.lineTo(i * T * 0.14, -T * (0.95 + Math.abs(i) * 0.1)); c.stroke(); } c.fillStyle = VIOLET; c.beginPath(); c.arc(0, -T * 1.05, T * 0.08, 0, TAU); c.fill(); c.restore(); } }); });
      // the sanctuary at the start, around the gate: no watch-stone's sight reaches into it
      const safe = { x: M.start.x, y: M.start.y - 0.8, r: 2.0 };
      const inSafe = () => Math.hypot(me.x - safe.x, me.y - safe.y) < safe.r;
      const hidden = () => inSafe() || covers.some(cv => Math.hypot(me.x - cv.x, me.y - cv.y) < 1.0);
      const inSight = w => { if (w.off > 0) return false; const d = Math.hypot(me.x - w.x, me.y - w.y); if (d > w.range + me.r) return false; const a = Math.atan2(me.y - w.y, me.x - w.x); return Math.abs(DunAI.angTo(w.a, a)) < w.half + me.r / Math.max(0.5, d) && X.los(w.x, w.y, me.x, me.y); };
      const sendBack = () => { S.flashT = 0.6; S.seenN++; X.flash(0.45, '#FFFFFF'); X.sfx.wrong(); if (S.carried) { const f = S.carried; f.carried = false; f.x = f.home.x; f.y = f.home.y; S.carried = null; } me.x = M.start.x; me.y = M.start.y; me.vx = me.vy = 0; X.text(me.x, me.y - 1.2, 'Seen! Back to the start', VIOLET, 13); X.banner('SEEN', 'The watch-stone turns toward the gate; the fragment is back in its socket', VIOLET, 1.8, true); };
      X.after(1.2, () => { S.intro = false; X.banner('THE AMBER VIGIL', 'Keep out of the sight cones; cover rocks and the sanctuary hide you', VIOLET, 2.8, true, true); });
      return { S, watchers, frags, covers, hidden, inSight, safe, inSafe,
        update(dt) {
          if (S.intro || g.won) return;
          if (S.flashT > 0) S.flashT -= dt;
          for (const w of watchers) { if (w.off > 0) w.off -= dt; else w.a += w.w * dt; }
          if (!me.dead && S.flashT <= 0 && !hidden() && watchers.some(inSight)) { sendBack(); return; }
          for (const f of frags) { if (f.banked || f.carried) continue; if (Math.hypot(me.x - f.x, me.y - f.y) < 0.8 && !S.carried) { f.carried = true; S.carried = f; X.text(f.x, f.y - 1, `Fragment ${f.n} taken`, '#FFD36B', 12); X.sfx.chirp(); } }
          if (S.carried && Math.hypot(me.x - gate.x, me.y - gate.y) < 1.2) { const f = S.carried; f.banked = true; f.carried = false; f.x = gate.x + (f.n - 2) * 0.6; f.y = gate.y - 0.6; S.carried = null; X.sparks(gate.x, gate.y - 0.5, VIOLET, 16, 6); X.sfx.fanfare(); X.banner(`FRAGMENT ${f.n} BANKED`, `${frags.filter(q => q.banked).length} of 3 at the gate`, VIOLET, 2, true); }
          if (frags.every(f => f.banked) && !self.done) { self.done = true; X.banner('THE VIGIL ENDS', 'Scorpio\'s star lights above the gate', VIOLET, 2.8, true, true); X.flash(0.4, '#FFFFFF'); X.sfx.fanfare(); X.after(2.6, () => X.winStage()); }
        },
        goal: () => self.done ? 'Scorpio awakens' : S.intro ? 'The Amber Vigil' : `${frags.filter(f => f.banked).length} of 3 fragments banked${S.carried ? ` · carrying fragment ${S.carried.n}: back to the gate` : ''}${inSafe() ? ' · safe in the sanctuary' : hidden() ? ' · hidden' : ''}`,
        drawGround(c) {
          const T = X.Tz();
          // the hex floor: a faint lattice
          c.save(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5; for (let y = 1; y < M.MH - 1; y += 1.5) for (let x = 1 + ((y / 1.5) % 2 ? 0.9 : 0); x < M.MW - 1; x += 1.8) { const Xs = X.sx(x), Ys = X.sy(y); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; i ? c.lineTo(Xs + Math.cos(a) * T * 0.9, Ys + Math.sin(a) * T * 0.55) : c.moveTo(Xs + Math.cos(a) * T * 0.9, Ys + Math.sin(a) * T * 0.55); } c.closePath(); c.stroke(); } c.restore();
          // the sight cones, and where each turns next
          for (const w of watchers) { const Xs = X.sx(w.x), Ys = X.sy(w.y); c.save(); c.translate(Xs, Ys); if (w.off > 0) { c.globalAlpha = 0.12; c.fillStyle = VIOLET; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, w.range * T, w.a - w.half, w.a + w.half); c.closePath(); c.fill(); }
            else { c.globalAlpha = 0.1; c.fillStyle = '#FF9BD2'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, w.range * T, w.a + 0.9 - w.half, w.a + 0.9 + w.half); c.closePath(); c.fill(); c.globalAlpha = 0.28; c.fillStyle = '#FF5C7A'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, w.range * T, w.a - w.half, w.a + w.half); c.closePath(); c.fill(); c.globalAlpha = 0.7; c.strokeStyle = '#FF5C7A'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(w.a) * w.range * T, Math.sin(w.a) * w.range * T); c.stroke(); }
            c.restore(); }
          // the sanctuary: a warm disc the cones can't cross, ringed with little lanterns
          { const Xs = X.sx(safe.x), Ys = X.sy(safe.y), R = safe.r * T, pu = 0.5 + 0.5 * Math.sin(g.t * 2); c.save();
            c.fillStyle = 'rgba(244,224,182,.8)'; c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.fill();
            const gr = c.createRadialGradient(Xs, Ys, R * 0.1, Xs, Ys, R); gr.addColorStop(0, 'rgba(255,224,150,.42)'); gr.addColorStop(0.75, 'rgba(255,196,110,.22)'); gr.addColorStop(1, 'rgba(255,196,110,0)'); c.fillStyle = gr; c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.fill();
            c.strokeStyle = `rgba(214,160,70,${0.75 + 0.25 * pu})`; c.lineWidth = 3; c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.stroke();
            c.strokeStyle = 'rgba(160,110,50,.4)'; c.lineWidth = 1.5; c.setLineDash([5, 6]); c.beginPath(); c.arc(Xs, Ys, R * 0.82, 0, TAU); c.stroke(); c.setLineDash([]);
            for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + Math.PI / 6 + i * TAU / 6, lx = Xs + Math.cos(a) * R, ly = Ys + Math.sin(a) * R; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 + 0.25 * pu; blitSized(c, glowSprite('#FFD36B'), lx - T * 0.45, ly - T * 0.75, T * 0.9, T * 0.9); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = BRONZE; c.strokeStyle = INK; c.lineWidth = 1.5; c.fillRect(lx - T * 0.05, ly - T * 0.32, T * 0.1, T * 0.32); c.strokeRect(lx - T * 0.05, ly - T * 0.32, T * 0.1, T * 0.32); c.fillStyle = '#FFE9A8'; c.beginPath(); c.arc(lx, ly - T * 0.38, T * 0.11, 0, TAU); c.fill(); c.stroke(); }
            c.font = `800 ${Math.max(11, T * 0.32)}px system-ui, sans-serif`; c.textAlign = 'center'; c.fillStyle = '#7A5222'; c.strokeStyle = 'rgba(255,248,230,.85)'; c.lineWidth = 3; const ty = Ys + R * 0.62; c.strokeText('SAFE', Xs, ty); c.fillText('SAFE', Xs, ty);
            c.restore(); }
          // the gate: the bronze scorpion, pincers for pillars, the star in its tail
          { const Xs = X.sx(gate.x), Ys = X.sy(gate.y); c.save(); c.fillStyle = BRONZE; c.strokeStyle = INK; c.lineWidth = 2; GFX.rr(c, Xs - T * 1.6, Ys - T * 0.5, T * 3.2, T * 0.9, 8); c.fill(); c.stroke(); [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(Xs + sd * T * 1.5, Ys - T * 0.4); c.quadraticCurveTo(Xs + sd * T * 2.4, Ys - T * 1.4, Xs + sd * T * 1.7, Ys - T * 2.3); c.quadraticCurveTo(Xs + sd * T * 1.9, Ys - T * 1.2, Xs + sd * T * 1.1, Ys - T * 0.4); c.closePath(); c.fill(); c.stroke(); }); c.beginPath(); c.moveTo(Xs, Ys - T * 0.4); c.quadraticCurveTo(Xs + T * 0.3, Ys - T * 2.2, Xs, Ys - T * 2.9); c.strokeStyle = INK; c.lineWidth = T * 0.22; c.stroke(); c.strokeStyle = BRONZE; c.lineWidth = T * 0.12; c.stroke();
            const lit = frags.filter(f => f.banked).length; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.2 * lit + (self.done ? 0.3 * Math.sin(g.t * 4) : 0); blitSized(c, glowSprite(VIOLET), Xs - T, Ys - T * 4, T * 2, T * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = VIOLET; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? T * 0.14 : T * 0.32; c.lineTo(Xs + Math.cos(a) * k, Ys - T * 3 + Math.sin(a) * k); } c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); c.restore(); }
          // the cover rocks; the fragment sockets; the fragments
          for (const cv of covers) { const Xs = X.sx(cv.x), Ys = X.sy(cv.y); c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.3, T * 0.9, T * 0.35, 0, 0, TAU); c.fill(); c.fillStyle = '#8E6A3E'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.8, Ys + T * 0.2); c.lineTo(Xs - T * 0.5, Ys - T * 0.9); c.lineTo(Xs + T * 0.1, Ys - T * 1.1); c.lineTo(Xs + T * 0.8, Ys - T * 0.3); c.lineTo(Xs + T * 0.6, Ys + T * 0.25); c.closePath(); c.fill(); c.stroke(); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(Xs - T * 0.4, Ys - T * 0.7); c.lineTo(Xs + T * 0.05, Ys - T * 0.95); c.lineTo(Xs + T * 0.2, Ys - T * 0.5); c.closePath(); c.fill(); c.restore(); }
          for (const f of frags) { const Xs = X.sx(f.carried ? me.x : f.x), Ys = X.sy(f.carried ? me.y : f.y) - (f.carried ? T * 1.3 : 0); if (!f.banked && !f.carried) { c.save(); c.strokeStyle = 'rgba(255,211,107,.5)'; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, T * 0.5, T * 0.28, 0, 0, TAU); c.stroke(); c.restore(); } c.save(); c.translate(Xs, Ys - T * 0.25 - (f.carried ? 0 : Math.sin(g.t * 3 + f.n) * T * 0.06)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite('#FFD36B'), -T * 0.6, -T * 0.6, T * 1.2, T * 1.2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = '#FFE9A8'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -T * 0.3); c.lineTo(T * 0.18, -T * 0.05); c.lineTo(T * 0.1, T * 0.25); c.lineTo(-T * 0.14, T * 0.2); c.lineTo(-T * 0.2, -T * 0.08); c.closePath(); c.fill(); c.stroke(); c.restore(); }
          if (hidden() && !inSafe()) { c.save(); c.globalAlpha = 0.5; c.strokeStyle = '#8FE0A6'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.ellipse(X.sx(me.x), X.sy(me.y), T * 0.7, T * 0.4, 0, 0, TAU); c.stroke(); c.restore(); }
        },
      };
    },
  });
})();
