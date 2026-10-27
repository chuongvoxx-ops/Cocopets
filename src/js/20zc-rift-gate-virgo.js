/* ---------- Gate 07, Virgo: The Starseed Conservatory ----------
   A glass conservatory floating over the dream's ink. Planting beds lie in a square; each row and each column wants one
   of every kind of starseed (no kind twice in a row or column). A few beds are already planted (warded: they glow). Take
   a seed from a basket, walk onto a bed to plant it: a bed where it would clash shows a red cross and the sprout it
   clashes with. Walk onto your own sprout empty-handed to pull it up again. Seed weevils crawl in to eat sprouts:
   squash them. Round one is three by three (three seeds), round two four by four (four seeds); fill both and Virgo
   wakes. */
(() => {
  const TAU = Math.PI * 2, INK = '#2B2433';
  const SEEDS = [{ k: 'sun', name: 'SUN', col: '#FFC94A', hi: '#FFF1B8' }, { k: 'moon', name: 'MOON', col: '#9FB8FF', hi: '#E4ECFF' }, { k: 'star', name: 'STAR', col: '#4FD39A', hi: '#C8FFE4' }, { k: 'rose', name: 'DAWN', col: '#FF7FAE', hi: '#FFD6E6' }];
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  function seedIcon(c, s, x, y, r) { const S = SEEDS[s]; c.save(); c.fillStyle = S.col; c.strokeStyle = INK; c.lineWidth = 2;
    if (S.k === 'sun') { c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = i % 2 ? r * 0.62 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); }
    else if (S.k === 'moon') { c.beginPath(); c.arc(x, y, r * 0.85, 0.7, TAU - 0.7); c.arc(x + r * 0.42, y, r * 0.62, TAU - 1.0, 1.0, true); c.closePath(); c.fill(); c.stroke(); }
    else if (S.k === 'star') { c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.42 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); }
    else { c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; c.ellipse(x + Math.cos(a) * r * 0.42, y + Math.sin(a) * r * 0.42, r * 0.45, r * 0.3, a, 0, TAU); } c.fill(); c.stroke(); c.fillStyle = '#FFF1B8'; c.beginPath(); c.arc(x, y, r * 0.25, 0, TAU); c.fill(); }
    c.restore(); }
  // a Latin square: a cyclic one, its rows, columns and symbols shuffled
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function latin(n) { const r = shuffle([...Array(n).keys()]), cl = shuffle([...Array(n).keys()]), s = shuffle([...Array(n).keys()]); return r.map(i => cl.map(j => s[(i + j) % n])); }

  /* ---- the seed weevil: a little emerald beetle that crawls to the nearest sprout and eats it ---- */
  Object.assign(MON, { weevil: { name: 'Seed weevil', from: 999, hp: 150, spd: 1.6, r: 0.34, dmg: 10, xp: 6, coin: 0.3, color: '#2E8A6A', bio: ['archive'], tip: 'It crawls to the nearest sprout and eats it. Squash it first.', kit: [] } });
  DunArt.MP.weevil = (c, r, ph, o) => { const { lwOf, shade, stroke, LN } = DunArt, lw = lwOf(r), run = Math.sin(ph * TAU * 2), eat = o.mode === 'block';
    c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.7, r * 0.8, r * 0.22, 0, 0, TAU); c.fill();
    c.strokeStyle = LN; c.lineWidth = lw; for (let i = 0; i < 3; i++) { const x = -r * 0.4 + i * r * 0.4; c.beginPath(); c.moveTo(x, r * 0.2); c.lineTo(x - r * 0.25 + run * r * 0.1 * (i % 2 ? 1 : -1), r * 0.7); c.stroke(); }
    c.beginPath(); c.ellipse(-r * 0.1, 0, r * 0.75, r * 0.55, 0, 0, TAU); c.fillStyle = shade(c, o.color, r, -r * 0.3, -r * 0.3, 0.5); c.fill(); stroke(c, lw);
    c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-r * 0.1, -r * 0.52); c.lineTo(-r * 0.1, r * 0.5); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)'; c.beginPath(); c.ellipse(-r * 0.35, -r * 0.25, r * 0.18, r * 0.1, -0.4, 0, TAU); c.fill();
    c.beginPath(); c.arc(r * 0.62, -r * 0.05 + (eat ? Math.sin(ph * TAU * 6) * r * 0.06 : 0), r * 0.3, 0, TAU); c.fillStyle = '#1E5A46'; c.fill(); stroke(c, lw);
    c.strokeStyle = LN; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(r * 0.85, -r * 0.05); c.lineTo(r * 1.2, r * 0.05); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(r * 0.68, -r * 0.15, r * 0.07, 0, TAU); c.fill(); };
  Object.assign(DunArt.EXT, { weevil: 2.2 }); Object.assign(DunArt.NF, { weevil: 6 });
  DunAI.mon.weevil = (m, A, X) => { const tg = m.target; if (!tg || tg.s == null || tg.ward) { m.mode = null; if (A.d > 1.0) X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); else if (m.cd <= 0) { m.cd = 1.4; X.hurtPet(m.dmg, m); } return; }
    const dx = tg.x - m.x, dy = tg.y - m.y, d = Math.hypot(dx, dy) || 1; m.face = dx >= 0 ? 1 : -1;
    if (d > 0.45) { m.mode = null; m.eatT = 0; X.moveEnt(m, dx / d * A.sp * A.dt, dy / d * A.sp * A.dt); } else { m.mode = 'block'; m.eatT = (m.eatT || 0) + A.dt; } };

  defGate('library', {
    name: 'The Starseed Conservatory', biome: 'archive', goal: 'Plant the starseeds: one of each kind in every row and column', how: 'Planting beds lie in a square. Every row and every column wants ONE of each kind of starseed: no kind twice in a row or a column. Some beds are already planted and warded (they glow). Walk into a basket to take a seed of that kind, then walk onto an empty bed to plant it. If it would clash, the bed shows a red cross and lights the sprout it clashes with. Walk onto one of your own sprouts with empty paws to pull it up again. Seed weevils crawl in to eat your sprouts (not the warded ones): squash them. Round one is three by three, round two four by four.',
    layout: [
      '~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~....................~~',
      '~~....................~~',
      '~~....................~~',
      '~~....................~~',
      '~~....................~~',
      '~~.........O..........~~',
      '~~....................~~',
      '~~....................~~',
      '~~....................~~',
      '~~....................~~',
      '~~....................~~',
      '~~....................~~',
      '~~..1....2....3....4..~~',
      '~~....................~~',
      '~~.........S..........~~',
      '~~....................~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~~~~~~~~~~~~~~~~~~'],
    legend: { O: {}, 1: {}, 2: {}, 3: {}, 4: {} },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, mk = M.marks, O = mk.O[0], GAP = 2.3;
      const baskets = ['1', '2', '3', '4'].map((ch, i) => ({ i, x: mk[ch][0].x, y: mk[ch][0].y }));
      const S = { intro: true, round: 0, n: 3, beds: [], carry: null, weevils: [], spawnT: 10, won: false, clash: null, clashT: 0 };
      function deal(n) { S.n = n; S.beds = []; const sol = latin(n), clues = n === 3 ? 3 : 6, order = shuffle([...Array(n * n).keys()]), pick = new Set();
        // clues: spread over the rows first
        for (let r = 0; r < n && pick.size < clues; r++) pick.add(order.find(k => Math.floor(k / n) === r && !pick.has(k)));
        for (const k of order) { if (pick.size >= clues) break; pick.add(k); }
        for (let r = 0; r < n; r++) for (let cI = 0; cI < n; cI++) { const k = r * n + cI, ward = pick.has(k); S.beds.push({ r, c: cI, x: O.x + (cI - (n - 1) / 2) * GAP, y: O.y + (r - (n - 1) / 2) * GAP * 0.9 - 0.6, s: ward ? sol[r][cI] : null, ward, grow: ward ? 1 : 0, red: 0, lit: 0 }); }
        for (const m of S.weevils) if (!m.dead) X.killMon(m); S.carry = null; }
      deal(3);
      X.after(1.2, () => { S.intro = false; X.banner('THE STARSEED CONSERVATORY', 'One of EACH seed in every row and every column. Take seeds from the baskets; walk onto a bed to plant', '#C8FFE4', 3.6, true, true); });
      const clashWith = (b, s) => S.beds.find(q => q !== b && q.s === s && (q.r === b.r || q.c === b.c));
      const full = () => S.beds.every(b => b.s != null);
      function plant(b) {
        if (b.ward) { X.text(b.x, b.y - 1.3, 'Warded: it stays', '#C8FFE4', 12); return; }
        if (b.s != null) { if (S.carry == null) { S.carry = b.s; b.s = null; b.grow = 0; X.text(b.x, b.y - 1.3, 'Pulled up', '#FFF1B8', 12); } return; }
        if (S.carry == null) return;
        const q = clashWith(b, S.carry); if (q) { b.red = 1; q.lit = 1; X.text(b.x, b.y - 1.4, `Two ${SEEDS[S.carry].name}S in one ${q.r === b.r ? 'row' : 'column'}`, '#FF7A8A', 13); X.shake(3, 0.2); return; }
        b.s = S.carry; b.grow = 0.01; S.carry = null; X.ring(b.x, b.y, 0.2, 1.2, 0.3, SEEDS[b.s].col, 0.4); X.sfx.coin && X.sfx.coin();
        if (full()) { X.sfx.fanfare(); for (const q of S.beds) X.boom(q.x, q.y - 0.6, 0.9, SEEDS[q.s].col, '#FFFFFF', { n: 10, shake: 2 });
          if (S.round === 0) { S.round = 1; X.banner('THE BEDS BLOOM', 'Round two: four by four, and a fourth seed (DAWN)', '#C8FFE4', 2.8, true); X.after(1.6, () => deal(4)); }
          else win(); } }
      function win() { if (S.won) return; S.won = true; self.done = true; for (const m of S.weevils) if (!m.dead) X.killMon(m); X.flash(0.6, '#FFFFFF'); X.shake(6, 0.5); X.banner('VIRGO WAKES', 'Every bed in flower: the keeper of the starseeds answers', '#C8FFE4', 3, true, true); X.sfx.fanfare(); X.ring(O.x, O.y, 0.5, 7, 0.8, '#4FD39A', 0.5); X.after(2.8, () => X.winStage()); }
      // the baskets and the beds' sprouts (objects, so they stand among the monsters)
      baskets.forEach(bk => H.obj({ x: bk.x, y: bk.y, kind: 'basket', r: 0.1, h: 1.6, label: '', draw(c, Xs, Ys, T) { const on = bk.i < S.n, s = SEEDS[bk.i], t = g.t; if (!on) { c.save(); c.globalAlpha = 0.35; } c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.05, T * 0.85, T * 0.3, 0, 0, TAU); c.fill();
        c.fillStyle = '#8A6A44'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.7, Ys - T * 0.6); c.lineTo(Xs + T * 0.7, Ys - T * 0.6); c.lineTo(Xs + T * 0.5, Ys); c.lineTo(Xs - T * 0.5, Ys); c.closePath(); c.fill(); c.stroke();
        c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1.5; for (let i = 1; i < 4; i++) { c.beginPath(); c.moveTo(Xs - T * 0.7 + i * T * 0.35, Ys - T * 0.6); c.lineTo(Xs - T * 0.5 + i * T * 0.25, Ys); c.stroke(); }
        if (on) { glowAt(c, Xs, Ys - T * 0.8, T * 1.0, s.col, 0.45 + 0.15 * Math.sin(t * 4 + bk.i)); for (let j = 0; j < 3; j++) seedIcon(c, bk.i, Xs + (j - 1) * T * 0.32, Ys - T * (0.7 + (j % 2) * 0.12), T * 0.2); label(c, s.name, Xs, Ys + T * 0.55, T * 0.26, s.hi); }
        if (!on) c.restore(); } }));
      H.obj({ x: O.x, y: O.y + GAP * 2.2, kind: 'sprouts', r: 0.1, h: 0.1, label: '', draw(c) { const T = X.Tz(), t = g.t;
        for (const b of S.beds) { if (b.s == null) continue; const Xs = X.sx(b.x), Ys = X.sy(b.y), k = Math.min(1, b.grow), sd = SEEDS[b.s];
          // a stem with two leaves and the seed's starry flower, growing in; warded ones glow
          c.save(); c.strokeStyle = INK; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs, Ys - T * 1.0 * k); c.stroke(); c.strokeStyle = '#4E9A5A'; c.lineWidth = 3; c.stroke();
          for (const s2 of [-1, 1]) { c.fillStyle = '#5FB86A'; c.beginPath(); c.ellipse(Xs + s2 * T * 0.22 * k, Ys - T * 0.45 * k, T * 0.2 * k, T * 0.09 * k, s2 * 0.5, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 1.5; c.stroke(); }
          if (b.ward || b.lit > 0) glowAt(c, Xs, Ys - T * 1.1 * k, T * 1.1, b.lit > 0 ? '#FF5C7A' : sd.col, b.lit > 0 ? b.lit : 0.5 + 0.2 * Math.sin(t * 3 + b.r));
          seedIcon(c, b.s, Xs, Ys - T * 1.1 * k, T * 0.32 * k); c.restore();
          if (b.ward) { c.save(); c.strokeStyle = sd.hi; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.arc(Xs, Ys - T * 1.1, T * 0.5, 0, TAU); c.stroke(); c.restore(); } } } });
      return { S,
        cam() { return { x: O.x, y: O.y + 2.2, k: 0.12, zoom: S.n === 4 ? 0.64 : 0.7 }; },
        update(dt) { if (S.intro || S.won) return;
          for (const b of S.beds) { if (b.s != null && b.grow < 1) b.grow = Math.min(1, b.grow + dt * 2.5); if (b.red > 0) b.red -= dt; if (b.lit > 0) b.lit -= dt * 0.7;
            const d = Math.hypot(me.x - b.x, me.y - b.y); if (d < 0.75) { if (!b._on) { b._on = true; plant(b); } } else b._on = false; }
          for (const bk of baskets) { if (bk.i >= S.n) continue; if (Math.hypot(me.x - bk.x, me.y - bk.y) < 1.0) { if (S.carry !== bk.i) { S.carry = bk.i; X.text(bk.x, bk.y - 1.6, `${SEEDS[bk.i].name} seed`, SEEDS[bk.i].hi, 13); } } }
          // weevils: in from the rim now and then, each heading for the nearest unwarded sprout
          S.spawnT -= dt; if (S.spawnT <= 0) { S.spawnT = S.round ? 10 : 14; if (S.weevils.filter(m => !m.dead).length < (S.round ? 3 : 2)) {   /* (halved: half as often, fewer at once) */ const a = Math.random() * TAU, p = X.freeSpot(O.x + Math.cos(a) * 8, O.y + Math.sin(a) * 6, 0.4); if (p) { const m = X.spawnMon('weevil', p.x, p.y, { pack: 960, rift: true, aggro: true }); S.weevils.push(m); X.g.total++; } } }
          for (const m of S.weevils) { if (m.dead) continue; const own = S.beds.filter(b => b.s != null && !b.ward); if (!m.target || m.target.s == null || m.target.ward) m.target = own.sort((a, b) => Math.hypot(a.x - m.x, a.y - m.y) - Math.hypot(b.x - m.x, b.y - m.y))[0] || null;
            if (m.target && (m.eatT || 0) > 1.6) { const b = m.target; X.text(b.x, b.y - 1.3, 'Eaten!', '#FF9BB0', 13); X.boom(b.x, b.y - 0.4, 0.7, '#5FB86A', '#FFFFFF', { n: 8, shake: 2 }); b.s = null; b.grow = 0; m.eatT = 0; m.target = null; } }
          S.weevils = S.weevils.filter(m => !m.dead); },
        goal() { if (S.won) return 'Virgo wakes'; if (S.intro) return 'The Starseed Conservatory'; const n = S.beds.filter(b => b.s != null).length; return `Round ${S.round + 1}/2 · beds ${n}/${S.beds.length}${S.carry != null ? ` · carrying ${SEEDS[S.carry].name}` : ''}`; },
        hint() { return null; },
        drawGround(c) { const T = X.Tz(), t = g.t, n = S.n;
          // the conservatory frame: a pale glass floor panel under the grid with gilt row and column lines
          const x0 = X.sx(O.x - n / 2 * GAP), x1 = X.sx(O.x + n / 2 * GAP), y0 = X.sy(O.y - n / 2 * GAP * 0.9 - 0.6), y1 = X.sy(O.y + n / 2 * GAP * 0.9 - 0.6);
          c.save(); c.fillStyle = 'rgba(80,140,110,.18)'; c.strokeStyle = '#CFAD62'; c.lineWidth = 3; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.strokeRect(x0, y0, x1 - x0, y1 - y0); c.lineWidth = 1.5; c.globalAlpha = 0.7;
          for (let i = 1; i < n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); } c.restore();
          for (const b of S.beds) { const Xs = X.sx(b.x), Ys = X.sy(b.y); c.save(); c.fillStyle = '#5A3A2E'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys, T * 0.7, T * 0.32, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#3A2420'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.02, T * 0.52, T * 0.2, 0, 0, TAU); c.fill();
            // carrying a seed: legal beds glow green, clashing ones show a red cross
            if (S.carry != null && b.s == null) { const q = clashWith(b, S.carry); if (q) { c.strokeStyle = 'rgba(255,92,122,.75)'; c.lineWidth = 3; c.beginPath(); c.moveTo(Xs - T * 0.25, Ys - T * 0.12); c.lineTo(Xs + T * 0.25, Ys + T * 0.12); c.moveTo(Xs + T * 0.25, Ys - T * 0.12); c.lineTo(Xs - T * 0.25, Ys + T * 0.12); c.stroke(); } else { c.strokeStyle = SEEDS[S.carry].col; c.lineWidth = 2.5; c.setLineDash([5, 4]); c.lineDashOffset = -t * 15; c.beginPath(); c.ellipse(Xs, Ys, T * 0.82, T * 0.38, 0, 0, TAU); c.stroke(); } }
            if (b.red > 0) { c.globalAlpha = b.red; c.fillStyle = 'rgba(255,92,122,.5)'; c.beginPath(); c.ellipse(Xs, Ys, T * 0.85, T * 0.4, 0, 0, TAU); c.fill(); }
            c.restore(); }
          // the seed carried, bobbing over the pet
          if (S.carry != null) { const Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 1.6 - Math.sin(t * 4) * T * 0.08; glowAt(c, Xs, Ys, T * 0.7, SEEDS[S.carry].col, 0.6); seedIcon(c, S.carry, Xs, Ys, T * 0.28); } },
      };
    },
  });
})();
