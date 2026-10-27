/* ---------- Rift 04, the Sepulchre: two action stages ----------
   SEP_STAGES.SIEGE  The Three Statues: wake each great statue and smash it while a mob pours in to kill you and to
                     mend it (200, then 300, then 400 of them; never more than a few dozen at once)
   SEP_STAGES.ROLL   The Rolling Hour: your blows do nothing here; the dodge roll is the weapon. Two hundred come;
                     roll through them. GIANT makes you huge, FIRE sets you blazing with a burning trail.
   Engine hooks used (20b): g.rollOnly (only o.roll hits land), g.dodgeK (dodge cooldown scale), g.petK (pet size). */
(() => {
  const TAU = Math.PI * 2;
  const P = () => SEP;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const { LN, shade, stroke, spec, lwOf, MP, EXT, NF } = DunArt;
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  // a bar across the top of the play area
  function topBar(c, X, y, frac, col, txt) { const W = X.W(), x0 = 18, w = W - 36, h = 14; c.save(); c.fillStyle = 'rgba(20,16,30,.8)'; GFX.rr(c, x0 - 3, y - 3, w + 6, h + 6, 9); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; GFX.rr(c, x0, y, w, h, 7); c.fill(); c.fillStyle = col; GFX.rr(c, x0, y, Math.max(h, w * Math.max(0, Math.min(1, frac))), h, 7); c.fill(); c.restore(); label(c, txt, W / 2, y + h + 17, 13, '#FFFFFF'); }
  // the edges of the floor: where the mob comes in from
  function edgeSpots(M) { const out = []; for (let y = 1; y < M.MH - 1; y++) for (let x = 1; x < M.MW - 1; x++) { const k = y * M.MW + x; if (M.G[k] !== T_FLOOR) continue; let edge = false; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (M.G[(y + dy) * M.MW + x + dx] !== T_FLOOR) edge = true; if (edge) out.push({ x: x + 0.5, y: y + 0.5 }); } return out; }

  /* ======================= THE THREE STATUES ======================= */
  Object.assign(MON, {
    sepstatue: { name: 'Hour statue', from: 999, hp: 5000, spd: 0, r: 1.5, dmg: 0, xp: 40, coin: 3, color: '#D8D0BE', bio: ['twoages'], still: true, tip: 'A great statue that bears an hourglass. Wake it, then smash it while its masons try to mend it.', kit: [] },
    tombmason: { name: 'Tomb mason', from: 999, hp: 70, spd: 2.3, r: 0.36, dmg: 6, xp: 3, coin: 0.15, color: '#8A92A6', bio: ['twoages'], tip: 'A little stone mason with a glowing gold hammer. It runs to the statue and mends it: strike it down first.', kit: [] },
  });
  Object.assign(MP, {
    /* a hooded stone figure on a square plinth, holding an hourglass up over its head; awake its eyes and glass burn gold,
       and cracks run through it as it is broken */
    sepstatue(c, r, ph, o) {
      const lw = lwOf(r), md = o.mode || 'dormant', awake = md !== 'dormant', cr = awake ? +md.slice(1) || 0 : 0, { GOLD, GOLD_HI, INK } = P();
      c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, r * 0.9, r * 1.15, r * 0.32, 0, 0, TAU); c.fill();
      // plinth
      c.fillStyle = '#B8AE98'; c.beginPath(); c.rect(-r * 0.95, r * 0.35, r * 1.9, r * 0.55); c.fill(); stroke(c, lw); c.fillStyle = '#D8D0BE'; c.beginPath(); c.rect(-r * 0.95, r * 0.22, r * 1.9, r * 0.16); c.fill(); stroke(c, lw); c.fillStyle = GOLD; c.fillRect(-r * 0.95, r * 0.52, r * 1.9, r * 0.06);
      // robed body
      c.beginPath(); c.moveTo(-r * 0.62, r * 0.22); c.quadraticCurveTo(-r * 0.7, -r * 0.5, -r * 0.35, -r * 0.85); c.lineTo(r * 0.35, -r * 0.85); c.quadraticCurveTo(r * 0.7, -r * 0.5, r * 0.62, r * 0.22); c.closePath(); c.fillStyle = shade(c, '#CFC6B2', r, -r * 0.2, -r * 0.3, 0.35); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(90,80,60,.35)'; c.lineWidth = lw * 0.7; [-0.3, 0, 0.3].forEach(x => { c.beginPath(); c.moveTo(x * r, -r * 0.6); c.lineTo(x * r * 1.3, r * 0.2); c.stroke(); });
      // arms raised to the hourglass
      [-1, 1].forEach(sd => limb(c, sd * r * 0.38, -r * 0.7, sd * r * 0.5, -r * 1.45, lw * 2.6, '#C4BBA6'));
      // the hood and face
      c.beginPath(); c.moveTo(-r * 0.38, -r * 0.72); c.quadraticCurveTo(-r * 0.42, -r * 1.25, 0, -r * 1.3); c.quadraticCurveTo(r * 0.42, -r * 1.25, r * 0.38, -r * 0.72); c.closePath(); c.fillStyle = shade(c, '#BDB39C', r * 0.5, 0, -r * 1.05, 0.35); c.fill(); stroke(c, lw);
      c.fillStyle = '#2A2433'; c.beginPath(); c.ellipse(0, -r * 0.98, r * 0.22, r * 0.17, 0, 0, TAU); c.fill();
      if (awake) { [-1, 1].forEach(sd => { glowAt(c, sd * r * 0.09, -r * 0.99, r * 0.16, GOLD_HI, 0.9); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(sd * r * 0.09, -r * 0.99, r * 0.035, 0, TAU); c.fill(); }); }
      // the hourglass, held overhead
      const hy = -r * 1.75; c.fillStyle = GOLD; c.fillRect(-r * 0.42, hy - r * 0.42, r * 0.84, r * 0.09); c.fillRect(-r * 0.42, hy + r * 0.33, r * 0.84, r * 0.09); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.strokeRect(-r * 0.42, hy - r * 0.42, r * 0.84, r * 0.09); c.strokeRect(-r * 0.42, hy + r * 0.33, r * 0.84, r * 0.09);
      c.beginPath(); c.moveTo(-r * 0.32, hy - r * 0.33); c.lineTo(r * 0.32, hy - r * 0.33); c.lineTo(r * 0.05, hy); c.lineTo(r * 0.32, hy + r * 0.33); c.lineTo(-r * 0.32, hy + r * 0.33); c.lineTo(-r * 0.05, hy); c.closePath(); c.fillStyle = awake ? 'rgba(255,230,160,.55)' : 'rgba(210,220,235,.35)'; c.fill(); stroke(c, lw * 0.8);
      if (awake) glowAt(c, 0, hy, r * 0.75, GOLD_HI, 0.55 + 0.25 * Math.sin(ph * TAU));
      // cracks, deeper as it is broken
      if (cr > 0) { c.strokeStyle = '#3A3028'; c.lineWidth = lw * (0.8 + cr * 0.25); c.lineJoin = 'round'; const C = [[[-0.2, -0.7], [-0.05, -0.35], [-0.25, -0.05], [-0.1, 0.2]], [[0.3, -0.5], [0.12, -0.2], [0.35, 0.1]], [[-0.45, 0.4], [-0.2, 0.55], [0.1, 0.45], [0.4, 0.7]], [[0.05, -1.2], [-0.1, -1.0]]]; C.slice(0, cr + 1).forEach(pts => { c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x * r, y * r) : c.moveTo(x * r, y * r)); c.stroke(); }); }
    },
    /* a small stone mason: a round grey body, a little hood, a gold hammer that glows; raised as it mends */
    tombmason(c, r, ph, o) {
      const lw = lwOf(r), run = Math.sin(ph * TAU), mend = o.mode === 'block', { GOLD_HI } = P();
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 0.7, r * 0.22, 0, 0, TAU); c.fill();
      [-1, 1].forEach(s => { c.fillStyle = '#5A6070'; c.beginPath(); c.ellipse(s * r * 0.3 + run * s * r * 0.12, r * 0.85, r * 0.2, r * 0.12, 0, 0, TAU); c.fill(); stroke(c, lw * 0.6); });
      c.beginPath(); c.ellipse(0, r * 0.25, r * 0.62, r * 0.66, 0, 0, TAU); c.fillStyle = shade(c, o.color, r, -r * 0.2, 0, 0.35); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-r * 0.5, -r * 0.1); c.quadraticCurveTo(0, -r * 1.05, r * 0.5, -r * 0.1); c.closePath(); c.fillStyle = '#4A5062'; c.fill(); stroke(c, lw * 0.8);
      c.fillStyle = GOLD_HI; [-0.16, 0.16].forEach(x => { c.beginPath(); c.arc(x * r, r * 0.08, r * 0.07, 0, TAU); c.fill(); });
      // the hammer
      const a = mend ? -1.9 + Math.sin(ph * TAU * 2) * 0.9 : -0.6 + run * 0.2; c.save(); c.translate(r * 0.55, r * 0.15); c.rotate(a); glowAt(c, 0, -r * 0.95, r * 0.55, GOLD_HI, mend ? 0.95 : 0.55); limb(c, 0, 0, 0, -r * 0.8, lw * 0.9, '#7A5A36'); c.fillStyle = GOLD_HI; c.fillRect(-r * 0.25, -r * 1.05, r * 0.5, r * 0.28); stroke(c, lw * 0.7); c.restore();
    },
  });
  Object.assign(EXT, { sepstatue: 2.6, tombmason: 2.2 }); Object.assign(NF, { sepstatue: 4, tombmason: 6 });
  let SIEGE_AT = null;   // the statue being smashed (the masons run to it)
  Object.assign(DunAI.mon, {
    sepstatue(m, A, X) {},
    tombmason(m, A, X) {
      const S = SIEGE_AT; if (!S || S.dead) { if (A.d > 1) X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); return; }
      const dx = S.x - m.x, dy = S.y - m.y, d = Math.hypot(dx, dy) || 1;
      if (d > S.r + m.r + 0.35) { m.mode = null; m.mending = false; X.moveEnt(m, dx / d * A.sp * A.dt, dy / d * A.sp * A.dt); m.face = dx >= 0 ? 1 : -1; return; }
      m.mode = 'block'; m.mending = true; m.face = dx >= 0 ? 1 : -1; if (S.mend) S.mend(m, A.dt);
    },
  });
  const SIEGE_N = [200, 300, 400], SIEGE_CAP = 42;
  function makeSiege(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, SILVER_HI, VIOLET_HI, INK } = P();
    const E = mk.E[0]; H.setExit(E.x, E.y, 'To the raised gallery');
    const edges = edgeSpots(M).filter(p => Math.hypot(p.x - me.x, p.y - me.y) > 6);
    const atk = () => X.ST().atk;
    const S = { cur: -1, poured: 0, mob: [], intro: true, spawnT: 0, broken: 0 };
    const statues = ['1', '2', '3'].map((ch, i) => { const p = mk[ch][0]; const m = X.spawnMon('sepstatue', p.x, p.y, { pack: 760 + i, rift: true }); m.under = true; m.awake = false; m.statueI = i; m.guardFn = q => (q.awake ? 0.5 : 0); m.mode = 'dormant';
      m.hp = m.maxhp = Math.round(atk() * (55 + i * 18) * 1.6); m.mendK = atk() * 0.16; return m; });
    g.total = X.mons.length;
    // waking a statue: stand at it
    const wake = statues.map((m, i) => H.obj({ x: m.x, y: m.y + 2.1, kind: 'wake', r: 0.9, h: 1.0, label: () => (m.dead || m.awake ? '' : S.cur >= 0 ? '' : i === S.broken ? 'Wake the statue (the mob will come)' : ''), use() { if (m.dead || m.awake || S.cur >= 0 || i !== S.broken) return; begin(i); } }));
    function begin(i) { const m = statues[i]; S.cur = i; S.poured = 0; S.mob = []; m.awake = true; m.under = false; SIEGE_AT = m; m.mend = (q, dt) => { if (m.dead) return; m.hp = Math.min(m.maxhp, m.hp + m.mendK * dt); if (Math.random() < dt * 2) X.sparks(m.x + (Math.random() - 0.5) * 1.6, m.y - 1 - Math.random(), GOLD_HI, 2, 2); };
      X.flash(0.3, '#FFE9B0'); X.shake(8, 0.5); X.sfx.hum && X.sfx.hum(); X.banner(`THE ${['FIRST', 'SECOND', 'THIRD'][i]} STATUE WAKES`, `${SIEGE_N[i]} pour in: strike down the masons, smash the statue`, GOLD_HI, 2.8, true, true); }
    function spawnOne() { const i = S.cur, p = edges[Math.floor(Math.random() * edges.length)]; if (!p) return; const r = Math.random(), t = r < 0.45 ? 'tombmason' : r < 0.72 ? 'cornerpup' : r < 0.88 ? 'seceater' : 'mourndisc';
      const m = X.spawnMon(t, p.x, p.y, { aggro: true, pack: 770 + i, rift: true }); if (t !== 'tombmason') { m.hp = m.maxhp = Math.round(m.maxhp * 0.55); m.xpK = 0.3; } S.mob.push(m); S.poured++; g.total++; }
    X.after(1.2, () => { S.intro = false; X.banner('THE THREE STATUES', 'Wake a statue, then break it before its masons mend it', GOLD_HI, 3, true, true); });
    return { S, statues,
      update(dt) { if (S.intro) return;
        if (S.cur < 0) return;
        const m = statues[S.cur];
        // the mob pours in: never more than a few dozen at once
        S.mob = S.mob.filter(q => !q.dead);
        S.spawnT -= dt; while (S.spawnT <= 0 && S.mob.length < SIEGE_CAP && S.poured < SIEGE_N[S.cur]) { S.spawnT += 0.09; spawnOne(); } if (S.spawnT < 0) S.spawnT = 0;
        // its cracks show how far it is broken
        const k = 1 - m.hp / m.maxhp; m.mode = 'a' + Math.min(3, Math.floor(k * 4));
        if (m.dead) { S.broken++; X.boom(m.x, m.y - 1, 3, GOLD_HI, '#FFFFFF', { n: 50, shake: 14 }); X.sfx.crash(); for (const q of S.mob) if (!q.dead) { X.sparks(q.x, q.y, '#E9E3D5', 3, 2); X.killMon(q); } S.mob = []; SIEGE_AT = null; S.cur = -1;
          if (S.broken >= 3) { self.done = true; X.banner('THE THREE ARE BROKEN', 'The gallery is quiet: the way is open', GOLD_HI, 2.8, true, true); X.sfx.fanfare(); }
          else X.banner('THE STATUE FALLS', `${3 - S.broken} left: wake the next`, GOLD_HI, 2.2, true); }
      },
      goal() { if (self.done) return 'The way is open'; if (S.intro) return 'The Three Statues'; if (S.cur < 0) return `Statue ${S.broken + 1} of 3 · stand at it to wake it`; const m = statues[S.cur]; return `Statue ${S.cur + 1} · ${Math.ceil(m.hp / m.maxhp * 100)}% · poured in ${S.poured}/${SIEGE_N[S.cur]}`; },
      hint() { if (self.done) return null; if (S.cur < 0) return wake[S.broken]; return null; },
      drawGround(c) { const T = X.Tz();
        // a gold ring on the floor before the statue to be woken; mending beams from the masons to the statue
        if (S.cur < 0 && !self.done) { const w = wake[S.broken], Xs = X.sx(w.x), Ys = X.sy(w.y); c.save(); c.strokeStyle = GOLD_HI; c.lineWidth = 3; c.globalAlpha = 0.5 + 0.3 * Math.sin(g.t * 4); c.beginPath(); c.ellipse(Xs, Ys, T * 0.9, T * 0.45, 0, 0, TAU); c.stroke(); c.restore(); }
        if (S.cur >= 0) { const m = statues[S.cur], sx = X.sx(m.x), sy = X.sy(m.y) - T * 1.2; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; for (const q of S.mob) if (!q.dead && q.mending) { const qx = X.sx(q.x), qy = X.sy(q.y) - T * 0.6; c.strokeStyle = `rgba(232,207,142,${0.35 + 0.25 * Math.sin(g.t * 9 + q.x)})`; c.lineWidth = 3; c.beginPath(); c.moveTo(qx, qy); c.quadraticCurveTo((qx + sx) / 2, Math.min(qy, sy) - T, sx, sy); c.stroke(); } c.restore(); } },
      drawOver(c) { if (S.cur < 0 || S.intro) return; const m = statues[S.cur], menders = S.mob.filter(q => !q.dead && q.mending).length; topBar(c, X, 128, m.hp / m.maxhp, menders ? '#E8CF8E' : '#FF8A6A', `Statue ${S.cur + 1}: ${Math.ceil(m.hp / m.maxhp * 100)}%${menders ? ` · ${menders} mending!` : ''} · ${S.poured}/${SIEGE_N[S.cur]} poured in`); },
    };
  }
  const ring = (w, h, extra) => { const r = []; for (let y = 0; y < h; y++) { let s = ''; for (let x = 0; x < w; x++) s += (y === 0 || y === h - 1 || x === 0 || x === w - 1) ? '~' : '.'; r.push(s.split('')); } (extra || []).forEach(([x, y, ch]) => { r[y][x] = ch; }); return r.map(a => a.join('')); };
  SEP_STAGES.SIEGE = { name: 'The Three Statues', goal: 'Break the three statues', how: 'Three great statues bear the hours of the gallery. Stand at one to wake it: a mob pours in from the edges (200 for the first, 300 for the second, 400 for the third). Some come for you; the stone masons with gold hammers run to the statue and mend it while they stand beside it. Strike the masons down and smash the statue with everything you have. A broken statue takes its mob with it.',
    layout: ring(28, 24, [[6, 7, '1'], [21, 7, '2'], [14, 16, '3'], [14, 3, 'E'], [14, 11, 'S']]), legend: { 1: {}, 2: {}, 3: {}, E: {} }, make: makeSiege };

  /* ======================= THE ROLLING HOUR ======================= */
  const ROLL_N = 200, ROLL_CAP = 45;
  function makeRoll(X, self, H) {
    const M = X.M, me = X.me, g = X.g, { GOLD_HI, VIOLET_HI, INK } = P();
    const E = M.marks.E[0]; H.setExit(E.x, E.y, 'To the final sanctuary');
    const edges = edgeSpots(M);
    g.rollOnly = true; g.dodgeK = 0.32;
    const S = { intro: true, poured: 0, smashed: 0, mob: [], spawnT: 1, pw: [], pwT: 6, giant: 0, fire: 0, trail: [], trailT: 0, combo: 0, comboT: 0, best: 0, fireTick: 0 };
    function spawnOne() { const p = edges[Math.floor(Math.random() * edges.length)]; if (!p || Math.hypot(p.x - me.x, p.y - me.y) < 4) return; const r = Math.random(), t = r < 0.55 ? 'cornerpup' : r < 0.8 ? 'seceater' : 'mourndisc';
      const m = X.spawnMon(t, p.x, p.y, { aggro: true, pack: 790, rift: true }); m.hp = m.maxhp = Math.round(m.maxhp * 0.5); S.mob.push(m); S.poured++; g.total++; X.ring(p.x, p.y, 0.2, 1, 0.3, VIOLET_HI, 0.25); }
    function smash(m, how) { if (m.dead) return; X.hitMon(m, m.hp + 10, { roll: true, flat: true, noCrit: true }); if (!m.dead) return; S.smashed++; S.combo++; S.comboT = 1.4; S.best = Math.max(S.best, S.combo);
      X.sparks(m.x, m.y, how === 'fire' ? '#FF9F43' : '#FFFFFF', 8, 6); X.ring(m.x, m.y, 0.2, 1.1, 0.25, how === 'fire' ? '#FF9F43' : GOLD_HI, 0.25); if (S.combo % 10 === 0) { X.text(me.x, me.y - 1.6, `${S.combo} SMASHED!`, GOLD_HI, 18); X.shake(6, 0.2); } }
    function spawnPw() { const kinds = ['giant', 'fire']; const kind = kinds[Math.floor(Math.random() * 2)]; for (let t = 0; t < 20; t++) { const x = 3 + Math.random() * (M.MW - 6), y = 3 + Math.random() * (M.MH - 6); if (X.tileAt(Math.floor(x), Math.floor(y)) !== T_FLOOR || Math.hypot(x - me.x, y - me.y) < 3) continue; S.pw.push({ kind, x, y, t: 0 }); X.ring(x, y, 0.2, 1.4, 0.4, kind === 'fire' ? '#FF9F43' : GOLD_HI, 0.35); return; } }
    X.after(1.2, () => { S.intro = false; X.banner('THE ROLLING HOUR', 'Your blows do nothing here: ROLL into them with DODGE', GOLD_HI, 3.2, true, true); });
    return { S,
      update(dt) {
        if (self.done || S.intro) { g.petK = 1; return; }
        S.mob = S.mob.filter(q => !q.dead);
        S.spawnT -= dt; const rate = 0.28 - Math.min(0.18, S.smashed / ROLL_N * 0.18); while (S.spawnT <= 0 && S.mob.length < ROLL_CAP && S.poured < ROLL_N) { S.spawnT += rate; spawnOne(); } if (S.spawnT < 0) S.spawnT = 0;
        // power-ups: one now and then, big glowing orbs
        S.pwT -= dt; if (S.pwT <= 0 && S.pw.length < 2) { S.pwT = 9 + Math.random() * 4; spawnPw(); }
        for (let i = S.pw.length - 1; i >= 0; i--) { const p = S.pw[i]; p.t += dt; if (Math.hypot(p.x - me.x, p.y - me.y) < 1.1 + me.r * (g.petK || 1)) { S.pw.splice(i, 1); X.sfx.fanfare(); X.flash(0.25, p.kind === 'fire' ? '#FFB066' : '#FFE9A8');
            if (p.kind === 'giant') { S.giant = 8; X.banner('GIANT!', 'Huge for eight seconds: a wider roll', GOLD_HI, 1.6, true); } else { S.fire = 8; X.banner('ON FIRE!', 'Blazing for eight seconds: a burning trail', '#FF9F43', 1.6, true); } } else if (p.t > 14) S.pw.splice(i, 1); }
        if (S.giant > 0) S.giant -= dt; if (S.fire > 0) S.fire -= dt;
        const want = S.giant > 0 ? 1.85 : 1; g.petK = (g.petK || 1) + (want - (g.petK || 1)) * Math.min(1, dt * 6);
        // the roll smashes what it touches
        const reach = me.r * (g.petK || 1) + (S.giant > 0 ? 0.9 : 0.35);
        if (me.dodge) for (const m of S.mob) if (!m.dead && Math.hypot(m.x - me.x, m.y - me.y) < reach + m.r) smash(m, 'roll');
        // a burning trail behind a blazing pet
        if (S.fire > 0) { S.trailT -= dt; if (S.trailT <= 0) { S.trailT = 0.12; S.trail.push({ x: me.x, y: me.y, life: 2.4 }); X.zone({ kind: 'fire', x: me.x, y: me.y, r: 0.9, life: 2.4, max: 2.4, own: 'none' }); }
          if (Math.random() < dt * 30) X.part({ kind: 'smoke', x: me.x + (Math.random() - 0.5) * 0.6, y: me.y - 0.3, vx: 0, vy: -1.6, life: 0.4, max: 0.4, size: 0.25, color: 'rgba(255,150,60,' }); }
        S.fireTick -= dt; const tick = S.fireTick <= 0; if (tick) S.fireTick = 0.2;
        for (let i = S.trail.length - 1; i >= 0; i--) { const f = S.trail[i]; f.life -= dt; if (f.life <= 0) { S.trail.splice(i, 1); continue; } if (tick) for (const m of S.mob) if (!m.dead && Math.hypot(m.x - f.x, m.y - f.y) < 0.9 + m.r) { X.hitMon(m, m.maxhp * 0.34, { roll: true, dot: true, dotC: '#FFB066' }); if (m.dead) { S.smashed++; S.combo++; S.comboT = 1.4; } } }
        if (S.comboT > 0) { S.comboT -= dt; if (S.comboT <= 0) S.combo = 0; }
        if (S.smashed >= ROLL_N && !self.done) { self.done = true; g.rollOnly = false; g.dodgeK = 1; S.giant = 0; S.fire = 0; X.banner('THE HOUR IS ROLLED AWAY', `${ROLL_N} smashed · best chain ${S.best}`, GOLD_HI, 2.8, true, true); X.sfx.fanfare(); for (const q of S.mob) if (!q.dead) X.killMon(q); }
      },
      goal() { return self.done ? 'The way is open' : S.intro ? 'The Rolling Hour' : `Roll with DODGE · ${S.smashed}/${ROLL_N} smashed${S.combo > 2 ? ` · chain ${S.combo}` : ''}`; },
      drawGround(c) { const T = X.Tz();
        for (const p of S.pw) { const Xs = X.sx(p.x), Ys = X.sy(p.y) - T * 0.6 - Math.sin(g.t * 4 + p.x) * T * 0.15, col = p.kind === 'fire' ? '#FF9F43' : GOLD_HI, blink = p.t > 11 && Math.floor(g.t * 8) % 2;
          if (blink) continue; c.save(); glowAt(c, Xs, Ys, T * 1.3, col, 0.75); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.arc(Xs, Ys, T * 0.45, 0, TAU); c.fill(); c.stroke();
          if (p.kind === 'fire') { c.fillStyle = '#FFF2C8'; c.beginPath(); c.moveTo(Xs, Ys - T * 0.3); c.quadraticCurveTo(Xs + T * 0.22, Ys, Xs, Ys + T * 0.25); c.quadraticCurveTo(Xs - T * 0.22, Ys, Xs, Ys - T * 0.3); c.fill(); }
          else { c.strokeStyle = INK; c.lineWidth = 3; c.beginPath(); c.moveTo(Xs - T * 0.2, Ys + T * 0.05); c.lineTo(Xs, Ys - T * 0.2); c.lineTo(Xs + T * 0.2, Ys + T * 0.05); c.moveTo(Xs, Ys - T * 0.2); c.lineTo(Xs, Ys + T * 0.25); c.stroke(); }
          label(c, p.kind === 'fire' ? 'FIRE' : 'GIANT', Xs, Ys - T * 0.75, T * 0.32, col); c.restore(); }
        // the blaze about a pet on fire, the gold aura of a giant
        if (S.fire > 0 || S.giant > 0) { const Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 0.5 * (g.petK || 1); if (S.fire > 0) glowAt(c, Xs, Ys, T * 1.6 * (g.petK || 1), '#FF7A2A', 0.6 + 0.2 * Math.sin(g.t * 14)); if (S.giant > 0) glowAt(c, Xs, Ys, T * 1.8 * (g.petK || 1), GOLD_HI, 0.35); }
      },
      drawOver(c) { if (S.intro || self.done) return; topBar(c, X, 128, S.smashed / ROLL_N, '#C9B0FF', `${S.smashed}/${ROLL_N} smashed${S.giant > 0 ? ` · GIANT ${Math.ceil(S.giant)}s` : ''}${S.fire > 0 ? ` · FIRE ${Math.ceil(S.fire)}s` : ''}`);
        if (S.combo > 2) { const W = X.W(); label(c, `CHAIN ×${S.combo}`, W - 70, 190, 18 + Math.min(10, S.combo * 0.2), S.combo >= 20 ? '#FF9F43' : GOLD_HI); } },
    };
  }
  SEP_STAGES.ROLL = { name: 'The Rolling Hour', goal: 'Roll through two hundred', how: 'In this hall your blows and skills do nothing: only your DODGE roll hurts, and it is quick to come back. Two hundred pour in. Roll through them; anything the rolling pet touches is smashed. Grab GIANT to grow huge with a wider roll, and FIRE to blaze with a trail that burns them. They still bite: keep rolling.',
    layout: ring(24, 24, [[12, 2, 'E'], [12, 12, 'S']]), legend: { E: {} }, make: makeRoll };
})();
