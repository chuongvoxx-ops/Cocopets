/* ---------- Rift 04, the Sepulchre: its dungeons with challenges of their own, and its puzzles ----------
   SEP_STAGES.COURT   The Hour Court: dodge-roll through thrown time-balls while gathering crystals
   SEP_STAGES.BEAST   The Borrowed Beast: bait three creatures into breaking the crystals that hold a guardian asleep
   SEP_STAGES.AGES    The Hall in Two Ages: turn the hall between Past and Present; carry a bridge across time
   SEP_STAGES.REMEMBER The Room That Remembers: change the Past (seed, stream, shelter) to make a road through the Present
   (SIEGE and ROLL, the two mob stages, live in 20s1b)
   (the palette SEP and the brood live in 20s2; these make() functions only run once a stage starts) */
const SEP_STAGES = {};
(() => {
  const TAU = Math.PI * 2;
  const P = () => SEP;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  /* a ghost of the pet that we move ourselves: a long-lived 'ghost' zone kept alive each frame */
  function ghost(X, col, a) { let z = null; return {
    set(x, y, face, alpha) { if (!z || z.life <= 0) { z = { kind: 'ghost', x, y, life: 1, max: 2, own: 'none', col, a: a || 0.5, face: face || 1 }; X.zone(z); } z.x = x; z.y = y; z.life = 1; z.max = 2; z.face = face || z.face; z.a = alpha == null ? (a || 0.5) : alpha; },
    kill() { if (z) z.life = 0; z = null; }, get on() { return !!z && z.life > 0; } }; }
  /* a row of door tiles: shut (solid) or open; drawn as a square gold-banded portcullis while shut */
  function door(X, marks) { const tiles = (marks || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y })); const D = { tiles, open: false, latched: false, k: 0,
    set(open) { if (D.latched && !open) return; if (open === D.open) return; D.open = open; tiles.forEach(t => X.setTile(t.tx, t.ty, open ? T_FLOOR : T_SOLID)); X.retile(); X.sfx[open ? 'unlock' : 'thud'](); },
    update(dt) { D.k += ((D.open ? 1 : 0) - D.k) * Math.min(1, dt * 6); },
    draw(c) { const T = X.Tz(), { GOLD, GOLD_HI, INK, VIOLET } = P(); for (const t of tiles) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty), lift = D.k * T * 0.95; c.save(); c.beginPath(); c.rect(Xs, Ys - T * 1.1, T, T * 1.1 + T); c.clip(); c.fillStyle = '#1B2130'; c.fillRect(Xs + 1, Ys - T * 0.9 - lift, T - 2, T * 1.7); c.strokeStyle = GOLD; c.lineWidth = 2; for (let i = 0; i < 3; i++) { const xx = Xs + T * (0.2 + i * 0.3); c.beginPath(); c.moveTo(xx, Ys - T * 0.9 - lift); c.lineTo(xx, Ys + T * 0.8 - lift); c.stroke(); } c.fillStyle = GOLD_HI; c.fillRect(Xs + 1, Ys + T * 0.55 - lift, T - 2, T * 0.12); c.strokeStyle = INK; c.lineWidth = 1.5; c.strokeRect(Xs + 1, Ys - T * 0.9 - lift, T - 2, T * 1.7); c.restore(); } } }; tiles.forEach(t => X.setTile(t.tx, t.ty, T_SOLID)); return D; }
  /* a guard out of a glowing corner (or simply out of the dark) */
  function emerge(X, type, x, y, list) { const q = X.freeSpot(x, y, 0.45) || { x, y }; X.ring(q.x, q.y, 0.2, 1.3, 0.45, P().VIOLET_HI, 0.35); X.sparks(q.x, q.y, P().VIOLET_HI, 10, 4); const m = X.spawnMon(type, q.x, q.y, { aggro: true, pack: 700, rift: true }); X.g.total++; if (list) list.push(m); return m; }
  const alive = list => list.filter(m => !m.dead).length;
  /* a pressure plate: a square gold-edged slab that sinks and lights when something stands on it */
  function drawPlate(c, X, p, on, num, col) { const T = X.Tz(), Xs = X.sx(p.x), Ys = X.sy(p.y), { GOLD, GOLD_HI, INK } = P(), s = T * 0.82; c.save(); if (on) glowAt(c, Xs, Ys, T * 1.1, col || GOLD_HI, 0.6); c.fillStyle = on ? '#5A4A28' : '#3A4258'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - s / 2, Ys - s / 2 + (on ? 2 : 0), s, s); c.strokeRect(Xs - s / 2, Ys - s / 2 + (on ? 2 : 0), s, s); c.strokeStyle = on ? (col || GOLD_HI) : GOLD; c.lineWidth = 2.5; c.strokeRect(Xs - s / 2 + 4, Ys - s / 2 + 4 + (on ? 2 : 0), s - 8, s - 8); if (num) label(c, String(num), Xs, Ys + T * 0.12 + (on ? 2 : 0), T * 0.42, on ? '#FFFFFF' : GOLD_HI); c.restore(); }
  /* footprints: a dotted trail of small paired marks along a path of points */
  function drawTrail(c, X, pts, from, col, a, step) { const T = X.Tz(); c.save(); c.fillStyle = col; for (let i = Math.max(0, from); i < pts.length; i += step || 3) { const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], ang = Math.atan2(q.y - p.y, q.x - p.x), sd = (i / (step || 3)) % 2 ? 1 : -1, ox = Math.cos(ang + Math.PI / 2) * 0.13 * sd, oy = Math.sin(ang + Math.PI / 2) * 0.13 * sd; c.globalAlpha = a * (0.5 + 0.5 * (i - from) / Math.max(1, pts.length - from)); c.beginPath(); c.ellipse(X.sx(p.x + ox), X.sy(p.y + oy), T * 0.13, T * 0.085, ang, 0, TAU); c.fill(); } c.restore(); }

  /* ======================= THE HALL IN TWO AGES =======================
     One gallery in two states. In the Past its silver bridge is whole but a wall blocks the way out; in the Present the
     wall has fallen but the bridge is broken. A gold hourglass lever turns the age (one each side, on safe platforms; the
     pieces that will change are outlined first). Cross in the Past, fix the bridge catch on its far end (the braced
     bridge stands outside time), then turn the far lever to the Present: the wall falls and the bridge stays. */
  function makeAges(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, SILVER, SILVER_HI, VIOLET, VIOLET_HI, INK } = P();
    const E = mk.E[0]; H.setExit(E.x, E.y, 'To the raised gallery');
    const bridge = mk.b.map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y })), wall = mk.w.map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
    const by0 = Math.min(...bridge.map(t => t.ty)), by1 = Math.max(...bridge.map(t => t.ty));
    const S = { age: 'present', braced: false, intro: true, near: [], far: [], farOn: false, k: 0, flashT: 0 };
    function apply(first) {
      const past = S.age === 'past';
      bridge.forEach(t => X.setTile(t.tx, t.ty, past || S.braced ? T_FLOOR : T_GAP));
      wall.forEach(t => X.setTile(t.tx, t.ty, past ? T_SOLID : T_FLOOR));
      if (first) return;   // (made before the ground is first drawn)
      X.retile();
      // nothing is left standing in a wall or over the drop
      for (const m of X.mons) if (!m.dead && !m.boss) X.unstick(m);
      if (!past && !S.braced) for (const m of X.mons) if (!m.dead && !MON[m.type].fly && m.y > by0 - 0.5 && m.y < by1 + 1.5 && bridge.some(t => Math.abs(m.x - t.x) < 1.2)) { const q = X.freeSpot(m.x, m.y < (by0 + by1) / 2 ? by0 - 1 : by1 + 2, 0.45); if (q) { m.x = q.x; m.y = q.y; } }
    }
    function turn(to) { if (S.age === to) return; S.age = to; S.flashT = 0.6; apply(); const past = to === 'past'; X.flash(0.35, past ? '#FFE9B0' : '#B8A8E0'); X.sfx.hum && X.sfx.hum(); X.shake(4, 0.25);
      X.banner(past ? 'THE PAST' : 'THE PRESENT', past ? 'The bridge is whole; the wall stands' : S.braced ? 'The wall falls; the braced bridge stays' : 'The wall falls; the bridge breaks', past ? GOLD_HI : VIOLET_HI, 2, true);
      if (!past && S.braced) wall.forEach(t => X.sparks(t.x, t.y, '#E9E3D5', 6, 4)); }
    const lever = (p, side) => H.obj({ x: p.x, y: p.y, kind: 'agelever', r: 0.85, h: 1.7, side, label: () => (S.age === 'past' ? 'Hourglass lever: turn to the Present' : 'Hourglass lever: turn to the Past'), use() { turn(S.age === 'past' ? 'present' : 'past'); },
      draw(c, Xs, Ys, T) { const past = S.age === 'past', a = past ? -0.7 : 0.7; c.save(); glowAt(c, Xs, Ys - T * 0.6, T * 1.0, past ? GOLD_HI : VIOLET_HI, 0.35); c.fillStyle = '#C9C0AE'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.45, Ys - T * 0.35, T * 0.9, T * 0.35); c.strokeRect(Xs - T * 0.45, Ys - T * 0.35, T * 0.9, T * 0.35);
        c.translate(Xs, Ys - T * 0.35); c.rotate(a); c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 0.9); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 3; c.stroke();
        c.translate(0, -T * 1.05); c.fillStyle = GOLD_HI; c.beginPath(); c.moveTo(-T * 0.18, -T * 0.2); c.lineTo(T * 0.18, -T * 0.2); c.lineTo(-T * 0.18, T * 0.2); c.lineTo(T * 0.18, T * 0.2); c.closePath(); c.fill(); c.lineWidth = 1.5; c.stroke(); c.restore(); } });
    const L1 = lever(mk.L[0], 'near'), L2 = lever(mk.M[0], 'far');
    const cp = mk.C[0];
    const catchObj = H.obj({ x: cp.x, y: cp.y, kind: 'catch', r: 0.9, h: 1.4, label: () => (S.braced ? 'The bridge is braced: it stands outside time' : S.age === 'past' ? 'Bridge catch: brace the bridge' : ''), use() { if (S.braced || S.age !== 'past') return; S.braced = true; X.banner('BRACED', 'The catch holds the bridge outside time', GOLD_HI, 2.2, true); X.sfx.unlock(); bridge.forEach(t => X.sparks(t.x, t.y, GOLD_HI, 4, 3)); },
      draw(c, Xs, Ys, T) { c.save(); if (S.braced) glowAt(c, Xs, Ys - T * 0.3, T * 1.1, GOLD_HI, 0.5 + 0.2 * Math.sin(g.t * 3)); c.fillStyle = '#8A6A3A'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.5, Ys - T * 0.5, T, T * 0.5); c.strokeRect(Xs - T * 0.5, Ys - T * 0.5, T, T * 0.5); c.fillStyle = S.braced ? GOLD_HI : '#5A4426'; c.beginPath(); c.moveTo(Xs - T * 0.35, Ys - T * 0.5); c.lineTo(Xs, Ys - T * (S.braced ? 0.62 : 0.95)); c.lineTo(Xs + T * 0.35, Ys - T * 0.5); c.closePath(); c.fill(); c.stroke(); c.restore(); } });
    // guards: three pups at the near lever now; the far platform's when you first cross
    (mk.p || []).forEach((q, i) => S.near.push(X.spawnMon('cornerpup', q.x, q.y, { pack: 720 + i, rift: true })));
    g.total = X.mons.length;
    apply(true);
    X.after(1.2, () => { S.intro = false; X.banner('THE HALL IN TWO AGES', 'Turn the hourglass lever: the Past keeps the bridge, the Present drops the wall', GOLD_HI, 3.2, true, true); });
    const nearLever = () => [L1, L2].some(o => Math.hypot(me.x - o.x, me.y - o.y) < 3.2);
    return { S, bridge, wall, turn, L1, L2, catchObj,
      update(dt) { if (S.intro) return; S.k += ((S.age === 'past' ? 1 : 0) - S.k) * Math.min(1, dt * 3); S.flashT -= dt;
        if (!S.farOn && me.y < by0 - 0.5) { S.farOn = true; (mk.f || []).forEach((q, i) => emerge(X, i === 0 ? 'seceater' : 'mourndisc', q.x, q.y, S.far)); X.banner('THE FAR PLATFORM', 'Its guards wake', VIOLET_HI, 1.8, true); }
        if (!self.done && S.braced && S.age === 'present' && S.farOn && alive(S.far) === 0) { self.done = true; X.banner('A PATH ACROSS TIME', 'The bridge braced, the wall down: the way is open', GOLD_HI, 2.6, true, true); X.sfx.fanfare(); } },
      goal() { if (self.done) return 'The raised gallery'; if (S.intro) return 'The Hall in Two Ages';
        const ag = S.age === 'past' ? 'Past' : 'Present';
        if (!S.farOn) return `${ag} · ${S.age === 'past' ? 'cross the bridge' : 'turn the lever to the Past to mend the bridge'}`;
        if (!S.braced) return `${ag} · brace the bridge at its far end${S.age === 'past' ? '' : ' (turn back to the Past first)'}`;
        if (S.age === 'past') return 'Braced · turn the far lever to the Present to drop the wall';
        const n = alive(S.far); return n ? `${n} guards on the far platform` : 'The way is open'; },
      hint() { if (self.done) return null; if (!S.farOn) return S.age === 'past' ? null : L1; if (!S.braced) return S.age === 'past' ? catchObj : (me.y < by0 ? L2 : L1); if (S.age === 'past') return L2; return null; },
      drawGround(c) { const T = X.Tz(), past = S.age === 'past';
        // the bridge: a silver deck with rails; broken stubs when it is gone; gold struts once braced
        const cols = [...new Set(bridge.map(t => t.tx))].sort((a, b) => a - b), x0 = X.sx(cols[0]), x1 = X.sx(cols[cols.length - 1] + 1);
        const deck = (ya, yb) => { c.fillStyle = '#C9D2E0'; c.fillRect(x0 + 3, ya, x1 - x0 - 6, yb - ya); c.strokeStyle = 'rgba(80,90,110,.5)'; c.lineWidth = 1.5; for (let y = ya + T * 0.25; y < yb; y += T * 0.33) { c.beginPath(); c.moveTo(x0 + 3, y); c.lineTo(x1 - 3, y); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0 + 3, ya, x1 - x0 - 6, yb - ya); c.fillStyle = SILVER_HI; c.fillRect(x0, ya, 4, yb - ya); c.fillRect(x1 - 4, ya, 4, yb - ya); };
        c.save();
        if (past || S.braced) deck(X.sy(by0), X.sy(by1 + 1));
        else { deck(X.sy(by0), X.sy(by0) + T * 0.7); deck(X.sy(by1 + 1) - T * 0.7, X.sy(by1 + 1)); c.fillStyle = 'rgba(40,30,60,.5)'; [[0.2, 0.8], [0.55, 0.9], [0.8, 0.75]].forEach(([u, v]) => { c.beginPath(); c.moveTo(x0 + (x1 - x0) * u, X.sy(by0) + T * 0.7); c.lineTo(x0 + (x1 - x0) * (u + 0.1), X.sy(by0) + T * v); c.lineTo(x0 + (x1 - x0) * (u + 0.18), X.sy(by0) + T * 0.7); c.fill(); }); }
        if (S.braced) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(232,207,142,${0.55 + 0.2 * Math.sin(g.t * 3)})`; c.lineWidth = 4; [x0 + 6, x1 - 6].forEach(xx => { c.beginPath(); c.moveTo(xx, X.sy(by0)); c.lineTo(xx, X.sy(by1 + 1)); c.stroke(); }); c.globalCompositeOperation = 'source-over'; }
        // the wall in the Present: fallen stones
        if (!past) wall.forEach((t, i) => { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); c.fillStyle = '#9AA3B2'; c.strokeStyle = INK; c.lineWidth = 1.5; [[0.2, 0.6, 0.28], [0.65, 0.4, 0.22], [0.5, 0.8, 0.18]].forEach(([u, v, r], k) => { if ((i + k) % 3 === 2) return; c.beginPath(); c.rect(Xs + T * (u - r / 2), Ys + T * (v - r / 2), T * r, T * r * 0.8); c.fill(); c.stroke(); }); });
        // the preview: near a lever, what turning it will change
        if (nearLever() && !self.done) { c.setLineDash([6, 5]); c.lineWidth = 2.5;
          const toPast = !past;
          c.strokeStyle = toPast ? GOLD_HI : VIOLET_HI; if (!S.braced) { c.strokeRect(x0 + 2, X.sy(by0) + 2, x1 - x0 - 4, X.sy(by1 + 1) - X.sy(by0) - 4); label(c, toPast ? 'bridge returns' : 'bridge breaks', (x0 + x1) / 2, X.sy((by0 + by1) / 2), T * 0.32, toPast ? GOLD_HI : VIOLET_HI); }
          wall.forEach(t => c.strokeRect(X.sx(t.tx) + 2, X.sy(t.ty) - T * 0.6, T - 4, T * 1.5)); label(c, toPast ? 'wall rises' : 'wall falls', X.sx(wall[Math.floor(wall.length / 2)].tx) + T / 2, X.sy(wall[0].ty) - T * 0.8, T * 0.32, toPast ? GOLD_HI : VIOLET_HI); c.setLineDash([]); }
        c.restore(); },
      drawOver(c) { const W = X.W(), Hh = X.H(); c.save(); c.globalAlpha = 0.12 * S.k + 0.0; c.fillStyle = '#FFD890'; c.fillRect(0, 0, W, Hh); c.globalAlpha = 0.16 * (1 - S.k); c.fillStyle = '#6A5A9A'; c.fillRect(0, 0, W, Hh); if (S.flashT > 0) { c.globalAlpha = S.flashT; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, Hh); } c.restore();
        c.save(); const past = S.age === 'past', txt = past ? 'PAST' : 'PRESENT', x = W - 64, y = 150; c.fillStyle = 'rgba(20,16,30,.7)'; GFX.rr(c, x - 50, y - 16, 100, 30, 12); c.fill(); label(c, txt, x, y + 5, 15, past ? GOLD_HI : VIOLET_HI); c.restore(); },
    };
  }
  SEP_STAGES.AGES = { name: 'The Hall in Two Ages', goal: 'Carry the bridge across time', how: 'The gallery exists in two ages. In the Past its silver bridge is whole but a wall blocks the way out; in the Present the wall has fallen but the bridge is broken. Stand at a gold hourglass lever to turn the age (outlines show what will change). Cross in the Past, brace the bridge with the catch at its far end (a braced bridge stands outside time), then turn the far lever to the Present: the wall falls and the bridge stays. Guards keep their health whatever the age.',
    layout: [
      '~~~~~~~.......~~~~~~~~',
      '~~~~~~~...E...~~~~~~~~',
      '~~~~~~~.......~~~~~~~~',
      '~~~~~~~wwwwwww~~~~~~~~',
      '~~..............f.....',
      '~~..M......C.....f....',
      '~~...............f....',
      '~~~~~~~~~~bbb~~~~~~~~~',
      '~~~~~~~~~~bbb~~~~~~~~~',
      '~~~~~~~~~~bbb~~~~~~~~~',
      '~~~~~~~~~~bbb~~~~~~~~~',
      '~~~~~~~~~~bbb~~~~~~~~~',
      '~~~~~~~~~~bbb~~~~~~~~~',
      '~~....................',
      '~~..p........p........',
      '~~.....L.....p........',
      '~~.........S..........',
      '~~....................',
      '~~~~~~~~~~~~~~~~~~~~~~'],
    legend: { E: {}, w: {}, b: {}, M: {}, L: {}, C: {}, f: {}, p: {} },
    make: makeAges };

  /* ======================= THE BORROWED BEAST =======================
     A sleeping stone guardian fills the doorway out; three growths reinforce it and ordinary blows do nothing to them.
     Three creatures do: a tomb ram's charge shatters cracked crystal, a lantern eye's beam melts blue crystal, a slab
     mole's eruption heaves heavy stone plates. Three small rooms teach one each (their own obstacle blocks the way on);
     the court before the guardian has all three, and all three creatures. Bait each into the growth that matches it:
     every growth carries the same symbol as its creature's warning. Creatures come back from their glowing nests. */
  Object.assign(MON, {
    tombram: { name: 'Tomb ram', from: 999, hp: 420, spd: 1.4, r: 0.55, dmg: 17, xp: 12, coin: 0.6, color: '#7A8296', bio: ['sepulchre'], tip: 'Lowers its head (a lane of chevrons shows its charge), then charges until it hits something. Its charge shatters cracked crystal.', kit: [] },
    tombeye: { name: 'Lantern eye', from: 999, hp: 240, spd: 1.2, r: 0.42, dmg: 13, xp: 10, coin: 0.6, color: '#3A4560', bio: ['sepulchre'], fly: true, tip: 'Narrows (a line with an eye shows its beam), then a beam that runs on past you. The beam melts blue crystal.', kit: [] },
    tombmole: { name: 'Slab mole', from: 999, hp: 300, spd: 1.6, r: 0.5, dmg: 16, xp: 11, coin: 0.6, color: '#6A5A48', bio: ['sepulchre'], tip: 'Tunnels under you (rings ripple out), then bursts up. Its eruption heaves heavy stone plates.', kit: [] },
  });
  const SYM = { crack: 'chevron', blue: 'eye', plate: 'ripple' };
  function drawSym(c, kind, x, y, s, col) { c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = Math.max(2, s * 0.16); c.lineCap = 'round'; c.lineJoin = 'round';
    if (kind === 'chevron') { [-0.3, 0.15].forEach(dx => { c.beginPath(); c.moveTo((dx - 0.2) * s, -0.35 * s); c.lineTo((dx + 0.15) * s, 0); c.lineTo((dx - 0.2) * s, 0.35 * s); c.stroke(); }); }
    else if (kind === 'eye') { c.beginPath(); c.moveTo(-0.5 * s, 0); c.quadraticCurveTo(0, -0.42 * s, 0.5 * s, 0); c.quadraticCurveTo(0, 0.42 * s, -0.5 * s, 0); c.stroke(); c.beginPath(); c.arc(0, 0, 0.14 * s, 0, TAU); c.fill(); }
    else { [0.18, 0.34, 0.5].forEach(r => { c.beginPath(); c.ellipse(0, 0, r * s, r * s * 0.55, 0, 0, TAU); c.stroke(); }); }
    c.restore(); }
  const { LN: BLN, shade: bshade, stroke: bstroke, spec: bspec, lwOf: blw, MP: BMP, EXT: BEXT, NF: BNF } = DunArt;
  Object.assign(BMP, {
    /* a stone ram: a blocky grey body, curled horns tipped with amber crystal */
    tombram(c, r, ph, o) { const lw = blw(r), run = Math.sin(ph * TAU), low = o.mode === 'block' || o.mode === 'lunge' ? 1 : 0, dazed = o.mode === 'daze';
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 1.1, r * 0.3, 0, 0, TAU); c.fill();
      [[-0.55, 1], [-0.2, -1], [0.3, 1], [0.6, -1]].forEach(([x, s]) => { c.fillStyle = '#4A5062'; c.beginPath(); c.rect(x * r - r * 0.1 + run * s * r * 0.08, r * 0.35, r * 0.2, r * 0.6); c.fill(); bstroke(c, lw * 0.8); });
      c.beginPath(); c.moveTo(-r * 0.9, -r * 0.1); c.lineTo(-r * 0.75, -r * 0.55); c.lineTo(r * 0.45, -r * 0.6); c.lineTo(r * 0.7, r * 0.0); c.lineTo(r * 0.55, r * 0.45); c.lineTo(-r * 0.8, r * 0.45); c.closePath(); c.fillStyle = bshade(c, o.color, r, -r * 0.2, -r * 0.3, 0.35); c.fill(); bstroke(c, lw);
      c.strokeStyle = 'rgba(30,30,40,.4)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-r * 0.3, -r * 0.55); c.lineTo(-r * 0.2, r * 0.4); c.moveTo(r * 0.15, -r * 0.58); c.lineTo(r * 0.2, r * 0.4); c.stroke();
      c.save(); c.translate(r * 0.7, -r * 0.2 + low * r * 0.25); c.beginPath(); c.moveTo(-r * 0.15, -r * 0.35); c.lineTo(r * 0.45, -r * 0.1); c.lineTo(r * 0.42, r * 0.25); c.lineTo(-r * 0.1, r * 0.3); c.closePath(); c.fillStyle = bshade(c, '#8A92A6', r * 0.5, 0, 0, 0.35); c.fill(); bstroke(c, lw);
      c.lineWidth = r * 0.16 + 2; c.strokeStyle = BLN; c.beginPath(); c.arc(-r * 0.02, -r * 0.18, r * 0.3, Math.PI * 0.9, Math.PI * 2.3); c.stroke(); c.lineWidth = r * 0.16; c.strokeStyle = '#C9B08A'; c.stroke();
      c.fillStyle = '#FFC86A'; c.beginPath(); c.moveTo(r * 0.28, -r * 0.08); c.lineTo(r * 0.5, -r * 0.22); c.lineTo(r * 0.42, r * 0.02); c.closePath(); c.fill(); bstroke(c, lw * 0.6);
      c.fillStyle = low ? '#FF9B6A' : '#FFE9A8'; c.beginPath(); c.arc(r * 0.18, -r * 0.05, r * 0.06, 0, TAU); c.fill(); c.restore();
      if (dazed) { c.fillStyle = '#FFE37A'; for (let i = 0; i < 3; i++) { const a = ph * TAU + i * 2.1; c.beginPath(); c.arc(Math.cos(a) * r * 0.5 + r * 0.3, -r * 0.95 + Math.sin(a) * r * 0.15, r * 0.08, 0, TAU); c.fill(); } } },
    /* a floating lantern eye: a dark iron cage round one huge blue eye */
    tombeye(c, r, ph, o) { const lw = blw(r), bob = Math.sin(ph * TAU) * r * 0.12, narrow = o.mode === 'block';
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, r * 1.2, r * 0.6, r * 0.2, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob - r * 0.3);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = narrow ? 0.9 : 0.45; blitSized(c, glowSprite('#7FD3F2'), -r * 1.2, -r * 1.2, r * 2.4, r * 2.4); c.restore();
      c.beginPath(); c.arc(0, 0, r * 0.75, 0, TAU); c.fillStyle = '#EAF6FF'; c.fill(); bstroke(c, lw);
      c.fillStyle = '#2F80B7'; c.beginPath(); c.ellipse(0, 0, r * 0.38, r * (narrow ? 0.14 : 0.38), 0, 0, TAU); c.fill(); c.fillStyle = '#0B1620'; c.beginPath(); c.ellipse(0, 0, r * 0.14, r * (narrow ? 0.06 : 0.16), 0, 0, TAU); c.fill();
      c.strokeStyle = '#3A4560'; c.lineWidth = lw * 1.4; for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; c.beginPath(); c.ellipse(0, 0, r * 0.8 * Math.abs(Math.cos(a)) + 1, r * 0.8, 0, 0, TAU); c.stroke(); }
      c.fillStyle = '#3A4560'; c.fillRect(-r * 0.2, -r * 1.0, r * 0.4, r * 0.2); bspec(c, -r * 0.3, -r * 0.35, r * 0.12, r * 0.08, 0.7); c.restore(); },
    /* a slab mole: a heavy brown digger with spade claws; under the ground only rings of earth show */
    tombmole(c, r, ph, o) { const lw = blw(r);
      if (o.mode === 'dug') { c.strokeStyle = 'rgba(140,120,90,.7)'; c.lineWidth = lw; [0.4, 0.7].forEach((k, i) => { c.beginPath(); c.ellipse(0, r * 0.4, r * (k + 0.15 * Math.sin(ph * TAU + i)), r * (k * 0.45), 0, 0, TAU); c.stroke(); }); c.fillStyle = '#6A5A48'; c.beginPath(); c.ellipse(0, r * 0.4, r * 0.35, r * 0.15, 0, 0, TAU); c.fill(); return; }
      c.beginPath(); c.ellipse(0, r * 0.1, r * 0.8, r * 0.75, 0, 0, TAU); c.fillStyle = bshade(c, o.color, r, -r * 0.2, -r * 0.2, 0.35); c.fill(); bstroke(c, lw);
      c.beginPath(); c.ellipse(r * 0.2, -r * 0.35, r * 0.35, r * 0.25, 0, 0, TAU); c.fillStyle = '#E8B8A8'; c.fill(); bstroke(c, lw * 0.8);
      [-1, 1].forEach(sd => { c.save(); c.translate(sd * r * 0.75, r * 0.3); c.rotate(sd * 0.5); c.beginPath(); c.moveTo(0, -r * 0.2); c.lineTo(sd * r * 0.4, -r * 0.1); c.lineTo(sd * r * 0.45, r * 0.15); c.lineTo(0, r * 0.2); c.closePath(); c.fillStyle = '#D8D0BE'; c.fill(); bstroke(c, lw * 0.8); c.restore(); });
      c.fillStyle = '#1A1420'; [-0.2, 0.25].forEach(x => { c.beginPath(); c.arc(x * r, -r * 0.05, r * 0.06, 0, TAU); c.fill(); }); },
  });
  Object.assign(BEXT, { tombram: 2.1, tombeye: 2.0, tombmole: 1.9 }); Object.assign(BNF, { tombram: 6, tombeye: 6, tombmole: 4 });
  // the creatures act through the stage (it knows the obstacles): DunAI hands each to BEAST_AI when set
  let BEAST_AI = null;
  Object.assign(DunAI.mon, { tombram(m, A, X) { if (BEAST_AI) BEAST_AI.ram(m, A, X); }, tombeye(m, A, X) { if (BEAST_AI) BEAST_AI.eye(m, A, X); }, tombmole(m, A, X) { if (BEAST_AI) BEAST_AI.mole(m, A, X); } });
  function makeBeast(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, SILVER_HI, VIOLET_HI, INK } = P();
    const E = mk.E[0]; H.setExit(E.x, E.y, 'To the tomb court');
    // the obstacles: tiles of one letter in one place make one group
    const groups = [];
    const addGroups = (ch, type, area) => { const pts = (mk[ch] || []).slice(); while (pts.length) { const grp = [pts.shift()]; for (let k = 0; k < grp.length; k++) for (let j = pts.length - 1; j >= 0; j--) if (Math.abs(pts[j].tx - grp[k].tx) + Math.abs(pts[j].ty - grp[k].ty) === 1) grp.push(pts.splice(j, 1)[0]); groups.push({ type, area, tiles: grp, broken: false, x: grp.reduce((s, p) => s + p.x, 0) / grp.length, y: grp.reduce((s, p) => s + p.y, 0) / grp.length, t: 0 }); grp.forEach(p => X.setTile(p.tx, p.ty, T_SOLID)); } };
    addGroups('c', 'crack', 1); addGroups('v', 'blue', 2); addGroups('d', 'plate', 3); addGroups('K', 'crack', 4); addGroups('U', 'blue', 4); addGroups('D', 'plate', 4);
    const guard = (mk.G || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y })); guard.forEach(p => X.setTile(p.tx, p.ty, T_SOLID));
    const S = { intro: true, court: false, wake: 0, woke: false, taught: {} };
    function breakGroup(G, by) { if (G.broken) return; G.broken = true; G.tiles.forEach(p => X.setTile(p.tx, p.ty, T_FLOOR)); X.retile(); const col = G.type === 'crack' ? '#FFC86A' : G.type === 'blue' ? '#7FD3F2' : '#B8A890';
      X.boom(G.x, G.y, 1.4, col, '#FFFFFF', { n: 22, shake: 7 }); X.sfx.crash(); if (G.area < 4) X.after(0.8, () => nests.filter(N => N.area === G.area && N.m && !N.m.dead).forEach(N => { X.ring(N.m.x, N.m.y, 0.2, 1.2, 0.4, VIOLET_HI, 0.3); X.killMon(N.m); })); X.banner(G.type === 'crack' ? 'SHATTERED' : G.type === 'blue' ? 'MELTED' : 'HEAVED', G.area === 4 ? `${groups.filter(q => q.area === 4 && !q.broken).length} growths left on the guardian` : 'The way on is open', col, 1.8, true); }
    const near = (G, x, y, r) => !G.broken && G.tiles.some(p => Math.hypot(p.x - x, p.y - y) < r);
    // the nests: each creature comes back from its nest while what it is needed for still stands
    const nests = [['a', 'tombram', 1], ['e', 'tombeye', 2], ['o', 'tombmole', 3], ['A', 'tombram', 4], ['Y', 'tombeye', 4], ['O', 'tombmole', 4]].filter(([ch]) => mk[ch]).map(([ch, type, area]) => ({ x: mk[ch][0].x, y: mk[ch][0].y, type, area, m: null, t: 0, need: () => groups.some(q => q.area === area && !q.broken && q.type === ({ tombram: 'crack', tombeye: 'blue', tombmole: 'plate' })[type]) }));
    const spawnAt = N => { N.m = X.spawnMon(N.type, N.x, N.y, { pack: 740 + N.area, rift: true, aggro: N.area === 4 }); X.ring(N.x, N.y, 0.2, 1.3, 0.4, VIOLET_HI, 0.3); g.total = X.mons.length; };
    nests.filter(N => N.area < 4).forEach(spawnAt);
    BEAST_AI = {
      ram(m, A, X2) {
        if (m.dazeT > 0) { m.dazeT -= A.dt; m.mode = 'daze'; if (m.dazeT <= 0) m.mode = null; return; }
        if (m.chargeT > 0) { m.chargeT -= A.dt; m.mode = 'lunge'; const v = 11, hit = X2.moveEnt(m, Math.cos(m.cha) * v * A.dt, Math.sin(m.cha) * v * A.dt); m.face = Math.cos(m.cha) >= 0 ? 1 : -1;
          if (!m.chit && Math.hypot(me.x - m.x, me.y - m.y) < m.r + me.r + 0.15 && !me.dodge) { m.chit = true; X2.hurtPet(m.dmg * 1.5, m); X2.push(m.cha, 1.6); }
          const fx = m.x + Math.cos(m.cha) * (m.r + 0.4), fy = m.y + Math.sin(m.cha) * (m.r + 0.4);
          for (const G of groups) if (G.type === 'crack' && near(G, fx, fy, 1.15)) { breakGroup(G, m); m.chargeT = 0; m.dazeT = 1.6; m.mode = 'daze'; return; }
          if (hit || m.chargeT <= 0) { if (hit) { X2.shake(5, 0.2); X2.sfx.thud(); for (const G of groups) if (!G.broken && G.type !== 'crack' && near(G, fx, fy, 1.2)) X2.text(G.x, G.y - 1.2, G.type === 'blue' ? 'Blue crystal: the charge only bounces off' : 'A plate: too heavy to charge through', '#FFFFFF', 12); } m.chargeT = 0; m.dazeT = hit ? 1.2 : 0.3; m.cd = 2.6; } return; }
        if (m.windT > 0) { m.windT -= A.dt; m.mode = 'block'; if (m.windT <= 0) { m.chargeT = 0.85; m.chit = false; X2.sfx.whoosh(); } return; }
        if (A.d > 6.5 || !A.los()) { X2.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
        if (m.cd <= 0 && A.d < 8.5 && A.los()) { m.windT = 1.0; m.cha = A.a; m.face = Math.cos(A.a) >= 0 ? 1 : -1; m.lane = { x: m.x, y: m.y, a: A.a, t: 1.0, kind: 'chevron' }; X2.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 9.5, w: 1.1, life: 1.0, max: 1.0, src: m, color: '#FFC86A' }); }
      },
      eye(m, A, X2) {
        if (m.aimT > 0) { m.aimT -= A.dt; m.mode = 'block'; if (m.aimT <= 0) { m.mode = null; m.cd = 3.4 + Math.random(); const a = m.ea, len = 11; let end = len;
            for (let k = 0.4; k <= len; k += 0.25) { const x = m.x + Math.cos(a) * k, y = m.y + Math.sin(a) * k, tx = Math.floor(x), ty = Math.floor(y); const G = groups.find(q => q.type === 'blue' && !q.broken && q.tiles.some(p => p.tx === tx && p.ty === ty)); if (G) { breakGroup(G, m); end = k; break; } if (X.tileAt(tx, ty) === T_SOLID) { end = k; const G2 = groups.find(q => !q.broken && q.tiles.some(p => p.tx === tx && p.ty === ty)); if (G2) X2.text(G2.x, G2.y - 1.2, G2.type === 'crack' ? 'The beam glances off cracked crystal' : 'The beam scorches the plate', '#FFFFFF', 12); break; } }
            X2.beamFx(m.x, m.y - 0.3, a, end, '#7FD3F2'); X2.sfx.zap && X2.sfx.zap();
            const px = me.x - m.x, py = me.y - m.y, along = px * Math.cos(a) + py * Math.sin(a), off = Math.abs(-px * Math.sin(a) + py * Math.cos(a)); if (along > 0 && along < end && off < 0.55 + me.r && !me.dodge) X2.hurtPet(m.dmg * 1.4, m); }
          return; }
        DunAI.keepRange(m, A, X2, 3.5, 6.5);
        if (m.cd <= 0 && A.d < 9 && A.los()) { m.aimT = 1.1; m.ea = A.a; m.lane = { x: m.x, y: m.y, a: A.a, t: 1.1, kind: 'eye' }; X2.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 11, w: 0.8, life: 1.1, max: 1.1, src: m, color: '#7FD3F2' }); }
      },
      mole(m, A, X2) {
        m.guardFn = m.guardFn || (q => (q.mode === 'dug' ? 0 : 1)); if (m.mode == null) m.mode = 'dug'; m.under = m.mode === 'dug';
        if (m.mode === 'dug') { if (A.d > 0.6) X2.moveEnt(m, A.ux * A.sp * 1.15 * A.dt, A.uy * A.sp * 1.15 * A.dt);
          if (A.d < 1.1 && m.cd <= 0) { m.mode = 'rise'; m.riseT = 0.85; m.rx = me.x; m.ry = me.y; m.lane = { x: m.rx, y: m.ry, t: 0.85, kind: 'ripple' }; X2.warn({ x: m.rx, y: m.ry, r: 1.6, life: 0.85, max: 0.85, src: m, color: '#C8B28A' }); } return; }
        if (m.mode === 'rise') { m.riseT -= A.dt; if (m.riseT <= 0) { m.mode = 'up'; m.upT = 0; m.x = m.rx; m.y = m.ry; X2.unstick(m); X2.sparks(m.rx, m.ry, '#C8B28A', 16, 6); X2.shake(6, 0.25); X2.sfx.crash();
            if (Math.hypot(me.x - m.rx, me.y - m.ry) < 1.6 + me.r && !me.dodge) X2.hurtPet(m.dmg * 1.4, m);
            for (const G of groups) if (G.type === 'plate' && near(G, m.rx, m.ry, 2.0)) breakGroup(G, m);
            for (const G of groups) if (G.type !== 'plate' && near(G, m.rx, m.ry, 1.6)) X2.text(G.x, G.y - 1.2, 'The eruption shakes it, but only a plate will heave', '#FFFFFF', 12); } return; }
        m.upT += A.dt; m.face = A.dx >= 0 ? 1 : -1; if (m.upT > 2.4) { m.mode = 'dug'; m.cd = 2.2; }
      },
    };
    X.after(1.2, () => { S.intro = false; X.banner('THE BORROWED BEAST', 'Your blows do nothing to crystal: let its creatures break it', GOLD_HI, 3, true, true); });
    const courtY = Math.max(...groups.filter(q => q.area === 3).map(q => q.y)) - 0.6;
    return { S, groups, nests, guard,
      update(dt) { if (S.intro) return;
        if (!S.court && groups.filter(q => q.area < 4).every(q => q.broken) && me.y < courtY) { S.court = true; nests.filter(N => N.area === 4).forEach(spawnAt); X.banner('THE GUARDIAN', 'All three growths at once: the ram, the eye and the mole are loose', VIOLET_HI, 2.6, true); }
        for (const N of nests) { if ((N.area === 4) !== S.court && N.area === 4) continue; if (N.m && !N.m.dead) continue; if (!N.need()) continue; if (N.area === 4 && !S.court) continue; N.t += dt; if (N.t > 4) { N.t = 0; spawnAt(N); X.text(N.x, N.y - 1.2, 'From its nest', VIOLET_HI, 12); } }
        if (!S.woke && groups.filter(q => q.area === 4).every(q => q.broken)) { S.woke = true; X.banner('THE GUARDIAN WAKES', 'It rises, and steps aside', GOLD_HI, 2.6, true, true); X.sfx.fanfare(); X.shake(8, 0.6); X.after(1.6, () => { guard.forEach(p => X.setTile(p.tx, p.ty, T_FLOOR)); X.retile(); self.done = true; for (const N of nests) if (N.m && !N.m.dead) X.killMon(N.m); }); }
        if (S.woke) S.wake = Math.min(1, S.wake + dt / 1.6);
        for (const m of X.mons) if (m.lane && m.lane.t > 0) m.lane.t -= dt; },
      goal() { if (self.done) return 'The tomb court'; if (S.intro) return 'The Borrowed Beast';
        const room = groups.find(q => q.area < 4 && !q.broken); if (room) return room.type === 'crack' ? 'Stand before the cracked crystal; let the ram charge through you (dodge)' : room.type === 'blue' ? 'Stand before the blue crystal; let the eye\'s beam pass you' : 'Stand by the heavy plate; let the mole erupt under you';
        return `The guardian · ${groups.filter(q => q.area === 4 && !q.broken).length} growths left`; },
      hint() { const G = groups.find(q => !q.broken && (q.area < 4 || S.court)); return self.done ? null : G ? { x: G.x, y: G.y + 1.1, h: 0.5, label: '' } : null; },
      drawGround(c) { const T = X.Tz();
        // the nests
        for (const N of nests) { if (N.area === 4 && !S.court) continue; const Xs = X.sx(N.x), Ys = X.sy(N.y), on = N.need(); c.save(); glowAt(c, Xs, Ys, T * 1.0, VIOLET_HI, on ? 0.4 : 0.12); c.strokeStyle = on ? VIOLET_HI : 'rgba(201,176,255,.3)'; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.ellipse(Xs, Ys, T * 0.8, T * 0.4, 0, 0, TAU); c.stroke(); c.setLineDash([]); drawSym(c, SYM[({ tombram: 'crack', tombeye: 'blue', tombmole: 'plate' })[N.type]], Xs, Ys, T * 0.5, on ? VIOLET_HI : 'rgba(201,176,255,.4)'); c.restore(); }
        // the warnings carry the same symbol as what they break
        for (const m of X.mons) if (!m.dead && m.lane && m.lane.t > 0) { const L = m.lane, k = m.lane.kind; if (k === 'ripple') drawSym(c, 'ripple', X.sx(L.x), X.sy(L.y), T * 1.1, '#FFE9C8'); else for (let d = 1.5; d < (k === 'eye' ? 10 : 9); d += 2) drawSym(c, k, X.sx(L.x + Math.cos(L.a) * d), X.sy(L.y + Math.sin(L.a) * d), T * 0.55, k === 'eye' ? '#BFEFFF' : '#FFE0A0'); }
        // the guardian: a sleeping stone beast lying across the doorway
        if (guard.length && S.wake < 1) { const x0 = Math.min(...guard.map(p => p.tx)), x1 = Math.max(...guard.map(p => p.tx)) + 1, y0 = Math.min(...guard.map(p => p.ty)), cx = X.sx((x0 + x1) / 2), cy = X.sy(y0 + 1) - T * 0.1 - S.wake * T * 0.6, W2 = (x1 - x0) * T / 2;
          c.save(); c.globalAlpha = 1 - S.wake;
          c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(cx, cy + T * 0.1, W2 * 1.05, T * 0.5, 0, 0, TAU); c.fill();
          c.beginPath(); c.moveTo(cx - W2, cy); c.quadraticCurveTo(cx - W2 * 1.05, cy - T * 1.6, cx - W2 * 0.4, cy - T * 2.0); c.quadraticCurveTo(cx, cy - T * 2.5, cx + W2 * 0.4, cy - T * 2.0); c.quadraticCurveTo(cx + W2 * 1.05, cy - T * 1.6, cx + W2, cy); c.closePath(); c.fillStyle = bshade(c, '#5A6478', W2, cx - W2 * 0.3, cy - T * 1.6, 0.35); c.fill(); bstroke(c, 2.5);
          // the face: a broad brow, closed eyes (open as it wakes), a muzzle on its paws
          c.strokeStyle = INK; c.lineWidth = 3; [-1, 1].forEach(sd => { c.beginPath(); if (S.woke) { c.fillStyle = GOLD_HI; c.ellipse(cx + sd * W2 * 0.32, cy - T * 1.45, T * 0.22, T * 0.14, 0, 0, TAU); c.fill(); c.stroke(); } else { c.arc(cx + sd * W2 * 0.32, cy - T * 1.5, T * 0.22, 0.2, Math.PI - 0.2); c.stroke(); } });
          c.beginPath(); c.ellipse(cx, cy - T * 0.75, W2 * 0.32, T * 0.42, 0, 0, TAU); c.fillStyle = '#6A7488'; c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.ellipse(cx, cy - T * 0.95, T * 0.16, T * 0.1, 0, 0, TAU); c.fill();
          [-1, 1].forEach(sd => { c.beginPath(); c.ellipse(cx + sd * W2 * 0.72, cy - T * 0.2, W2 * 0.26, T * 0.32, 0, 0, TAU); c.fillStyle = '#5A6478'; c.fill(); c.stroke(); });
          c.strokeStyle = GOLD; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - W2 * 0.5, cy - T * 2.05); c.quadraticCurveTo(cx, cy - T * 2.35, cx + W2 * 0.5, cy - T * 2.05); c.stroke();
          if (!S.woke) label(c, 'z', cx + W2 * 0.75, cy - T * 2.2 - Math.sin(g.t * 2) * T * 0.15, T * 0.4, SILVER_HI);
          c.restore(); }
        // the growths and obstacles, each with its symbol
        for (const G of groups) { if (G.broken) continue; for (const p of G.tiles) { const Xs = X.sx(p.tx), Ys = X.sy(p.ty), cx = Xs + T / 2; c.save();
          if (G.type === 'crack') { glowAt(c, cx, Ys - T * 0.1, T * 0.9, '#FFC86A', 0.35); [[-0.25, 1.05, 0.2], [0.15, 1.35, 0.24], [0.32, 0.85, 0.16]].forEach(([dx, h, w]) => { c.beginPath(); c.moveTo(cx + (dx - w) * T, Ys + T * 0.6); c.lineTo(cx + (dx - w) * T, Ys + T * (0.6 - h * 0.7)); c.lineTo(cx + dx * T, Ys + T * (0.6 - h)); c.lineTo(cx + (dx + w) * T, Ys + T * (0.6 - h * 0.7)); c.lineTo(cx + (dx + w) * T, Ys + T * 0.6); c.closePath(); c.fillStyle = '#F2C27A'; c.fill(); bstroke(c, 2); }); c.strokeStyle = '#7A4A1A'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(cx - T * 0.2, Ys - T * 0.3); c.lineTo(cx + T * 0.05, Ys + T * 0.05); c.lineTo(cx - T * 0.05, Ys + T * 0.3); c.stroke(); }
          else if (G.type === 'blue') { glowAt(c, cx, Ys - T * 0.1, T * 0.9, '#7FD3F2', 0.45); [[-0.22, 1.2, 0.22], [0.18, 1.45, 0.24], [0.36, 0.9, 0.15]].forEach(([dx, h, w]) => { c.beginPath(); c.moveTo(cx + (dx - w) * T, Ys + T * 0.6); c.lineTo(cx + (dx - w) * T, Ys + T * (0.6 - h * 0.7)); c.lineTo(cx + dx * T, Ys + T * (0.6 - h)); c.lineTo(cx + (dx + w) * T, Ys + T * (0.6 - h * 0.7)); c.lineTo(cx + (dx + w) * T, Ys + T * 0.6); c.closePath(); const gr = c.createLinearGradient(cx - T * 0.4, 0, cx + T * 0.4, 0); gr.addColorStop(0, '#D8F4FF'); gr.addColorStop(0.5, '#7FD3F2'); gr.addColorStop(1, '#2F80B7'); c.fillStyle = gr; c.fill(); bstroke(c, 2); }); }
          else { c.fillStyle = '#7A6E5C'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs + 2, Ys - T * 0.35, T - 4, T * 0.95); c.strokeRect(Xs + 2, Ys - T * 0.35, T - 4, T * 0.95); c.fillStyle = '#9A8E78'; c.fillRect(Xs + 2, Ys - T * 0.5, T - 4, T * 0.18); c.strokeRect(Xs + 2, Ys - T * 0.5, T - 4, T * 0.18); }
          c.restore(); }
          drawSym(c, SYM[G.type], X.sx(G.x), X.sy(G.y) - T * 0.2, T * 0.55, G.type === 'crack' ? '#7A3A10' : G.type === 'blue' ? '#0B3A5A' : '#2B2433'); }
      },
    };
  }
  SEP_STAGES.BEAST = { name: 'The Borrowed Beast', goal: 'Wake the stone guardian', how: 'A stone guardian sleeps across the way out, reinforced by three growths that your blows cannot touch. Its creatures can: a tomb ram\'s charge shatters cracked crystal (chevrons), a lantern eye\'s beam melts blue crystal (an eye), a slab mole\'s eruption heaves heavy plates (rings). Each warning shows the same symbol as the growth it breaks. Stand so the attack runs on into the right growth, and dodge at the last moment. Three small rooms teach one each; the court has all three. Creatures come back from their glowing nests if you defeat them too soon.',
    layout: [
      '########################',
      '#########......#########',
      '#########..E...#########',
      '#########GGGGGG#########',
      '###......K.DD.U.......##',
      '###...................##',
      '###.A..............Y..##',
      '###...................##',
      '###...................##',
      '###........O..........##',
      '###...................##',
      '###########dd###########',
      '#####..............#####',
      '#####.o............#####',
      '#####..............#####',
      '#####..............#####',
      '###########vv###########',
      '#####..............#####',
      '#####..............#####',
      '#####...........e..#####',
      '#####..............#####',
      '###########cc###########',
      '#####..............#####',
      '#####..............#####',
      '#####.a............#####',
      '#####..............#####',
      '#########......#########',
      '#########..S...#########',
      '########################'],
    legend: { E: {}, G: {}, K: {}, U: {}, D: {}, c: {}, v: {}, d: {}, a: {}, e: {}, o: {}, A: {}, Y: {}, O: {} },
    make: makeBeast };


  /* ======================= THE HOUR COURT =======================
     A square court ringed by stone hourglass throwers. They hurl time-balls at the pet: each thrower glows and shows
     its aim, then the ball flies and bounces off the walls. Gather thirty crystals while dodging: a ball that hits
     knocks three crystals loose (they land on the floor to be picked up again); rolling through a ball at the last
     moment is a Perfect Dodge and is worth a crystal. Faster and fuller as the count rises: split balls, then great
     slow balls. No monsters: just you, the dodge button and the balls. */
  const COURT_NEED = 30;
  function makeCourt(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, SILVER_HI, VIOLET, VIOLET_HI, INK } = P();
    const C = mk.E[0]; const throwers = (mk.t || []).map((p, i) => ({ i, x: p.x, y: p.y, glow: 0 }));
    const S = { intro: true, got: 0, gems: [], balls: [], next: 2.2, last: -1, hits: 0, perfect: 0, aim: [] };
    const free = (x, y, r) => { for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) { if (X.tileAt(Math.floor(x + ox), Math.floor(y + oy)) !== T_FLOOR) return false; } return true; };
    const gemSpot = () => { for (let k = 0; k < 40; k++) { const x = C.x + (Math.random() - 0.5) * 13, y = C.y + (Math.random() - 0.5) * 11; if (free(x, y, 0.4) && throwers.every(t => Math.hypot(t.x - x, t.y - y) > 2.2) && Math.hypot(me.x - x, me.y - y) > 2) return { x, y }; } return { x: C.x, y: C.y }; };
    const addGem = (p, loose) => S.gems.push({ x: p.x, y: p.y, t: 0, loose: !!loose, ph: Math.random() * 6 });
    for (let i = 0; i < 4; i++) addGem(gemSpot());
    X.after(1.2, () => { S.intro = false; X.banner('THE HOUR COURT', `Gather ${COURT_NEED} crystals · roll (DODGE) through the time-balls`, GOLD_HI, 3, true, true); });
    function throwBall() { const pool = throwers.filter(t => t.i !== S.last); const T0 = pool[Math.floor(Math.random() * pool.length)] || throwers[0]; S.last = T0.i; T0.glow = 1;
      const kind = S.got >= 20 && Math.random() < 0.3 ? 'big' : S.got >= 10 && Math.random() < 0.4 ? 'split' : 'ball';
      const lead = 0.25 + Math.random() * 0.25, tx = me.x + (me.vx || 0) * lead, ty = me.y + (me.vy || 0) * lead, a = Math.atan2(ty - T0.y, tx - T0.x);
      S.aim.push({ x: T0.x, y: T0.y, a, t: 0.7, kind, T0 });
      X.after(0.7, () => { if (self.done) return; const v = (kind === 'big' ? 5.2 : 7 + S.got * 0.12) * (1 + Math.min(0.3, S.got * 0.008)); S.balls.push({ x: T0.x + Math.cos(a) * 0.9, y: T0.y + Math.sin(a) * 0.9, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: kind === 'big' ? 0.85 : 0.42, kind, bounces: S.got >= 15 ? 3 : 2, life: 6, near: false, trail: [] }); X.sfx.whoosh(); }); }
    function hitPet(B) { S.hits++; X.hurtPet(X.ST().hp * (B.kind === 'big' ? 0.12 : 0.07), null); X.push(Math.atan2(B.vy, B.vx), 1.2); X.shake(5, 0.2);
      const lose = Math.min(3, S.got); S.got -= lose; for (let i = 0; i < lose; i++) { const a = Math.random() * TAU, d = 1.2 + Math.random() * 1.6, x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d; addGem(free(x, y, 0.35) ? { x, y } : gemSpot(), true); }
      if (lose) X.text(me.x, me.y - 1.3, `-${lose} crystals`, '#FF9BD2', 14); }
    return { S,
      update(dt) { if (S.intro) return;
        for (const t of throwers) t.glow = Math.max(0, t.glow - dt * 1.4);
        for (let i = S.aim.length - 1; i >= 0; i--) { S.aim[i].t -= dt; if (S.aim[i].t <= 0) S.aim.splice(i, 1); }
        if (self.done) { S.balls.length = 0; return; }
        S.next -= dt; if (S.next <= 0) { throwBall(); if (S.got >= 8 && Math.random() < 0.35) X.after(0.3, throwBall); S.next = Math.max(0.55, 1.55 - S.got * 0.033); }
        // the balls: fly, bounce off the walls, split, and fade
        for (let i = S.balls.length - 1; i >= 0; i--) { const B = S.balls[i]; B.life -= dt; B.trail.push({ x: B.x, y: B.y }); if (B.trail.length > 8) B.trail.shift();
          let nx = B.x + B.vx * dt, ny = B.y + B.vy * dt, bounced = false;
          if (!free(nx, B.y, B.r * 0.7)) { B.vx = -B.vx; nx = B.x; bounced = true; } if (!free(nx, ny, B.r * 0.7)) { B.vy = -B.vy; ny = B.y; bounced = true; }
          B.x = nx; B.y = ny;
          if (bounced) { B.bounces--; X.sparks(B.x, B.y, GOLD_HI, 5, 3); if (B.kind === 'split' && !B.split) { B.split = true; for (const da of [-0.5, 0.5]) { const sp = Math.hypot(B.vx, B.vy), a = Math.atan2(B.vy, B.vx) + da; S.balls.push({ x: B.x, y: B.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 0.34, kind: 'ball', bounces: 1, life: 3, near: false, trail: [], split: true }); } } }
          const d = Math.hypot(B.x - me.x, B.y - me.y);
          if (me.dodge && d < B.r + me.r + 0.7 && !B.near) { B.near = true; S.got = Math.min(COURT_NEED, S.got + 1); S.perfect++; X.text(me.x, me.y - 1.4, 'Perfect dodge! +1', GOLD_HI, 15); X.g.slowT = Math.max(X.g.slowT, 0.25); X.sfx.chirp(); }
          if (d < B.r + me.r * 0.9 && !me.dodge && !(me.inv > 0) && !me.dead) { hitPet(B); S.balls.splice(i, 1); continue; }
          if (B.bounces < 0 || B.life <= 0) { X.sparks(B.x, B.y, VIOLET_HI, 8, 3); S.balls.splice(i, 1); } }
        // the crystals
        for (let i = S.gems.length - 1; i >= 0; i--) { const G = S.gems[i]; G.t += dt; if (G.loose && G.t > 7) { S.gems.splice(i, 1); continue; } if (G.t > 0.3 && Math.hypot(G.x - me.x, G.y - me.y) < 0.8 && !me.dead) { S.got++; S.gems.splice(i, 1); X.sfx.coin(); X.sparks(G.x, G.y - 0.3, GOLD_HI, 6, 3); } }
        while (S.gems.filter(q => !q.loose).length < 4) addGem(gemSpot());
        if (S.got >= COURT_NEED && !self.done) { self.done = true; S.balls.length = 0; X.banner('THE COURT FALLS STILL', `${COURT_NEED} crystals · ${S.perfect} perfect dodges`, GOLD_HI, 2.6, true, true); X.sfx.fanfare(); X.flash(0.3, '#FFFFFF'); H.setExit(C.x, C.y, 'To the Borrowed Beast'); }
      },
      goal() { return self.done ? 'The way on' : S.intro ? 'The Hour Court' : `Crystals ${S.got}/${COURT_NEED} · roll through the balls (DODGE)${S.perfect ? ` · ${S.perfect} perfect` : ''}`; },
      drawGround(c) { const T = X.Tz();
        // the court's dial: a great clock face inlaid in the floor
        { const Xs = X.sx(C.x), Ys = X.sy(C.y); c.save(); c.strokeStyle = 'rgba(178,150,93,.5)'; c.lineWidth = 3; c.beginPath(); c.arc(Xs, Ys, T * 5.2, 0, TAU); c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; c.beginPath(); c.moveTo(Xs + Math.cos(a) * T * 4.6, Ys + Math.sin(a) * T * 4.6); c.lineTo(Xs + Math.cos(a) * T * 5.2, Ys + Math.sin(a) * T * 5.2); c.stroke(); } const u = S.got / COURT_NEED; c.strokeStyle = GOLD_HI; c.lineWidth = 6; c.beginPath(); c.arc(Xs, Ys, T * 5.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore(); }
        // aim lines
        for (const A of S.aim) { c.save(); c.globalAlpha = 0.5 + 0.4 * Math.sin(g.t * 20); c.strokeStyle = A.kind === 'big' ? '#FF9BD2' : GOLD_HI; c.lineWidth = A.kind === 'big' ? 6 : 3; c.setLineDash([8, 7]); c.beginPath(); c.moveTo(X.sx(A.x), X.sy(A.y)); c.lineTo(X.sx(A.x + Math.cos(A.a) * 9), X.sy(A.y + Math.sin(A.a) * 9)); c.stroke(); c.restore(); }
        // the crystals
        for (const G of S.gems) { const Xs = X.sx(G.x), Ys = X.sy(G.y) - T * 0.3 - Math.sin(g.t * 3 + G.ph) * T * 0.08, k = G.loose ? Math.min(1, (7 - G.t) / 1.5) : 1; c.save(); c.globalAlpha = k; glowAt(c, Xs, Ys, T * 0.6, GOLD_HI, 0.6); c.fillStyle = '#FFE9A8'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Xs, Ys - T * 0.3); c.lineTo(Xs + T * 0.18, Ys); c.lineTo(Xs, Ys + T * 0.28); c.lineTo(Xs - T * 0.18, Ys); c.closePath(); c.fill(); c.stroke(); c.restore(); }
        // the throwers: tall stone hourglasses at the walls, lit as they wind up
        for (const t of throwers) { const Xs = X.sx(t.x), Ys = X.sy(t.y); c.save(); glowAt(c, Xs, Ys - T * 0.8, T * (0.8 + t.glow), GOLD_HI, 0.2 + t.glow * 0.7); c.fillStyle = '#3A4560'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.4, Ys - T * 0.2, T * 0.8, T * 0.3); c.strokeRect(Xs - T * 0.4, Ys - T * 0.2, T * 0.8, T * 0.3); c.fillRect(Xs - T * 0.4, Ys - T * 1.7, T * 0.8, T * 0.2); c.strokeRect(Xs - T * 0.4, Ys - T * 1.7, T * 0.8, T * 0.2);
          c.beginPath(); c.moveTo(Xs - T * 0.3, Ys - T * 1.5); c.lineTo(Xs + T * 0.3, Ys - T * 1.5); c.lineTo(Xs + T * 0.05, Ys - T * 0.85); c.lineTo(Xs + T * 0.3, Ys - T * 0.2); c.lineTo(Xs - T * 0.3, Ys - T * 0.2); c.lineTo(Xs - T * 0.05, Ys - T * 0.85); c.closePath(); c.fillStyle = 'rgba(200,215,235,.35)'; c.fill(); c.stroke(); c.fillStyle = t.glow > 0.1 ? GOLD_HI : GOLD; c.beginPath(); c.arc(Xs, Ys - T * (0.5 + t.glow * 0.5), T * 0.13, 0, TAU); c.fill(); c.restore(); }
        // the balls
        for (const B of S.balls) { c.save(); c.globalCompositeOperation = 'lighter'; B.trail.forEach((p, i) => { c.globalAlpha = i / B.trail.length * 0.35; blitSized(c, glowSprite(B.kind === 'big' ? '#FF9BD2' : GOLD_HI), X.sx(p.x) - T * B.r, X.sy(p.y) - T * (B.r + 0.4), T * B.r * 2, T * B.r * 2); }); c.restore();
          const Xs = X.sx(B.x), Ys = X.sy(B.y) - T * 0.4; c.save(); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(Xs, X.sy(B.y) + T * 0.1, T * B.r, T * B.r * 0.35, 0, 0, TAU); c.fill(); glowAt(c, Xs, Ys, T * B.r * 1.8, B.kind === 'big' ? '#FF9BD2' : GOLD_HI, 0.6);
          const gr = c.createRadialGradient(Xs - T * B.r * 0.3, Ys - T * B.r * 0.3, 1, Xs, Ys, T * B.r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, B.kind === 'big' ? '#FFB8DA' : '#FFE9A8'); gr.addColorStop(1, B.kind === 'big' ? '#C0407A' : '#B2965D'); c.fillStyle = gr; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(Xs, Ys, T * B.r, 0, TAU); c.fill(); c.stroke();
          c.strokeStyle = INK; c.lineWidth = 2; const ang = g.t * 6; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + Math.cos(ang) * T * B.r * 0.6, Ys + Math.sin(ang) * T * B.r * 0.6); c.moveTo(Xs, Ys); c.lineTo(Xs + Math.cos(ang * 0.2) * T * B.r * 0.4, Ys + Math.sin(ang * 0.2) * T * B.r * 0.4); c.stroke(); c.restore(); } },
    };
  }
  SEP_STAGES.COURT = { name: 'The Hour Court', goal: 'Gather the crystals, dodge the balls', how: `Stone hourglasses round the court hurl time-balls at you: each one glows and shows its aim, then the ball flies and bounces off the walls. Gather ${COURT_NEED} crystals. A hit knocks three crystals loose (pick them up again before they fade). Press DODGE to roll through a ball just as it reaches you: a Perfect Dodge, worth a crystal. Later balls split when they bounce, and great pink balls come slow and wide.`,
    layout: [
      '###################',
      '#t.......t.......t#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#t.......E.......t#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#.................#',
      '#........S........#',
      '#t.......t.......t#',
      '###################'],
    legend: { t: {}, E: {} }, make: makeCourt };


  /* ======================= THE ROOM THAT REMEMBERS =======================
     One chamber in two ages. In the Present: a chasm, a solid old wall, a collapsed door, a crumbled statue and a shut
     gate. In the Past: a river where the chasm will be, the door open, the statue standing in the rain. Switch at the
     glowing memory anchors; whatever the pet carries goes through time with it. What was done in the Past is what the
     Present remembers when you come back:
       a seed planted in the riverside bed, with the water running to the garden  -> a giant root across the chasm
       the sluice turned to send the river against the wall                       -> the wall worn through
       a roof slab set over the statue                                            -> the statue, and its switch, survive
     and the catch: water sent to the garden floods the hollow where the root lands, unless the drain was opened first. */
  function makeRemember(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, { GOLD, GOLD_HI, SILVER_HI, VIOLET, VIOLET_HI, INK } = P();
    const tiles = ch => (mk[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
    const R = { era: 'present', carry: null, seedAt: 'ruin', slabAt: 'ruin', planted: false, sheltered: false, sluice: 'pool', drain: false, root: false, eroded: false, flooded: false, gate: false, intro: true, k: 0, flashT: 0, msg: '' };
    const T_ = { root: tiles('r'), flood: tiles('f'), wall: tiles('w'), door: tiles('d'), gate: tiles('g') };
    const at = ch => mk[ch][0], E = at('E');
    function apply(first) { const past = R.era === 'past';
      T_.root.forEach(t => X.setTile(t.tx, t.ty, !past && R.root ? T_FLOOR : T_GAP));
      T_.flood.forEach(t => X.setTile(t.tx, t.ty, !past && R.flooded ? T_GAP : T_FLOOR));
      T_.wall.forEach(t => X.setTile(t.tx, t.ty, !past && R.eroded ? T_FLOOR : T_SOLID));
      T_.door.forEach(t => X.setTile(t.tx, t.ty, past ? T_FLOOR : T_SOLID));
      T_.gate.forEach(t => X.setTile(t.tx, t.ty, !past && R.gate ? T_FLOOR : T_SOLID));
      if (first) return; X.retile(); X.unstick(me); }
    // the Present remembers what the Past left: worked out each time you come back
    function remember() { const notes = [];
      if (!R.root && R.planted && R.sluice === 'garden') { R.root = true; notes.push('a great root has grown across the chasm'); }
      if (!R.eroded && R.sluice === 'wall') { R.eroded = true; notes.push('the river has worn the old wall through'); }
      const fl = R.root && !R.drain && R.sluice === 'garden'; if (fl && !R.flooded) notes.push('but the garden water has flooded the hollow beyond'); if (!fl && R.flooded) notes.push('the hollow has drained'); R.flooded = fl;
      if (R.sheltered && !R.statueKept) { R.statueKept = true; notes.push('the sheltered statue still stands, its switch whole'); }
      return notes; }
    function switchEra() { if (R.flashT > 0) return; const to = R.era === 'past' ? 'present' : 'past'; R.era = to; R.flashT = 0.7; let notes = [];
      if (to === 'present') notes = remember();
      apply(); X.flash(0.45, to === 'past' ? '#FFE9B0' : '#B8A8E0'); X.shake(4, 0.25); if (X.sfx.hum) X.sfx.hum();
      X.banner(to === 'past' ? 'THE PAST' : 'THE PRESENT', to === 'past' ? (R.carry ? `Your ${R.carry} came with you` : 'The room as it was, centuries ago') : notes.length ? cap1(notes[0]) + (notes.length > 1 ? ` (+${notes.length - 1} more)` : '') : 'Nothing here remembers a change', to === 'past' ? GOLD_HI : VIOLET_HI, notes.length ? 3.2 : 2.2, true);
      notes.forEach((n, i) => X.after(0.6 + i * 0.9, () => X.text(me.x, me.y - 1.6, cap1(n), i % 2 ? GOLD_HI : '#FFFFFF', 13, { life: 2.6, max: 2.6, vy: -0.4 }))); }
    const cap1 = t => t.replace(/^but /, '').replace(/^./, ch => ch.toUpperCase());
    const anchors = ['Q', 'Y'].map(ch => at(ch)).map(p => H.obj({ x: p.x, y: p.y, kind: 'anchor', r: 0.9, h: 1.8, label: () => (R.era === 'past' ? 'Memory anchor: back to the Present' : 'Memory anchor: into the Past') + (R.carry ? ` (with the ${R.carry})` : ''), use() { switchEra(); }, draw(c, Xs, Ys, T) { drawAnchor(c, Xs, Ys, T); } }));
    // things to carry (both lie in the Present's ruins) and the places they go (in the Past)
    const seedP = at('s'), slabP = at('k');
    const seedObj = H.obj({ x: seedP.x, y: seedP.y, kind: 'seed', r: 0.8, h: 1.0, label: () => (R.era === 'present' && R.seedAt === 'ruin' && !R.carry ? 'A seed that survived the ages: take it' : ''), use() { if (R.era !== 'present' || R.seedAt !== 'ruin' || R.carry) return; R.carry = 'seed'; R.seedAt = 'pet'; X.sfx.boop(); X.text(me.x, me.y - 1.3, 'The seed: carry it into the Past', GOLD_HI, 13); }, draw(c, Xs, Ys, T) { if (R.era === 'present' && R.seedAt === 'ruin') drawSeed(c, Xs, Ys - T * 0.3, T); } });
    const slabObj = H.obj({ x: slabP.x, y: slabP.y, kind: 'slab', r: 0.8, h: 1.0, label: () => (R.era === 'present' && R.slabAt === 'ruin' && !R.carry ? 'An unbroken roof slab: take it' : ''), use() { if (R.era !== 'present' || R.slabAt !== 'ruin' || R.carry) return; R.carry = 'slab'; R.slabAt = 'pet'; X.sfx.boop(); X.text(me.x, me.y - 1.3, 'A roof slab: something in the Past needs shelter', GOLD_HI, 13); }, draw(c, Xs, Ys, T) { if (R.era === 'present' && R.slabAt === 'ruin') drawSlab(c, Xs, Ys, T, 1); } });
    const bedP = at('p'), bed = H.obj({ x: bedP.x, y: bedP.y, kind: 'bed', r: 0.9, h: 1.0, label: () => (R.era !== 'past' ? '' : R.planted ? (R.sluice === 'garden' ? 'The seed, watered' : 'The seed: it needs the water') : R.carry === 'seed' ? 'Plant the seed here' : 'A soft riverside bed'), use() { if (R.era !== 'past' || R.planted || R.carry !== 'seed') return; R.planted = true; R.carry = null; R.seedAt = 'bed'; X.sparks(bedP.x, bedP.y, '#8FE0A6', 14, 4); X.sfx.chirp(); X.text(bedP.x, bedP.y - 1.3, 'Planted', '#8FE0A6', 14); }, draw(c, Xs, Ys, T) { if (R.era === 'past') drawBed(c, Xs, Ys, T); } });
    const uP = at('u'), sluice = H.obj({ x: uP.x, y: uP.y, kind: 'sluice', r: 0.9, h: 1.6, label: () => (R.era !== 'past' ? '' : `Sluice: the river runs ${R.sluice === 'pool' ? 'to the pool' : R.sluice === 'garden' ? 'to the garden' : 'against the wall'} · turn it`), use() { if (R.era !== 'past') return; R.sluice = R.sluice === 'pool' ? 'garden' : R.sluice === 'garden' ? 'wall' : 'pool'; X.sfx.unlock(); X.text(uP.x, uP.y - 1.6, R.sluice === 'garden' ? 'Water to the garden' : R.sluice === 'wall' ? 'Water against the old wall' : 'Water to the pool', '#7FD3F2', 13); }, draw(c, Xs, Ys, T) { if (R.era === 'past') drawSluice(c, Xs, Ys, T); } });
    const nP = at('n'), drain = H.obj({ x: nP.x, y: nP.y, kind: 'drain', r: 0.8, h: 1.0, label: () => (R.era !== 'past' ? '' : R.drain ? 'The drain is open' : 'A drain, stopped with a stone plug: pull it'), use() { if (R.era !== 'past' || R.drain) return; R.drain = true; X.sfx.whoosh(); X.text(nP.x, nP.y - 1.2, 'The drain runs free', '#7FD3F2', 13); }, draw(c, Xs, Ys, T) { if (R.era === 'past') drawDrain(c, Xs, Ys, T); } });
    const tP = at('t'), statue = H.obj({ x: tP.x, y: tP.y + 0.9, kind: 'statue', r: 0.9, h: 2.8, label: () => (R.era === 'past' ? (R.sheltered ? 'Sheltered from the rain' : R.carry === 'slab' ? 'Set the slab over the statue' : 'A statue holding a switch, wearing away in the rain') : R.statueKept ? (R.gate ? 'The gate is open' : 'Pull the statue\'s switch') : 'A crumbled statue: whatever it held is gone'),
      use() { if (R.era === 'past') { if (R.sheltered || R.carry !== 'slab') return; R.sheltered = true; R.carry = null; R.slabAt = 'roof'; X.sfx.chirp(); X.sparks(tP.x, tP.y - 2, GOLD_HI, 12, 4); X.text(tP.x, tP.y - 2.4, 'Sheltered', GOLD_HI, 14); return; } if (R.statueKept && !R.gate) { R.gate = true; apply(); X.banner('THE GATE OPENS', 'The switch the statue kept for you', GOLD_HI, 2.4, true, true); X.sfx.fanfare(); self.done = true; H.setExit(E.x, E.y, 'To the Rolling Hour'); } },
      draw(c, Xs, Ys, T) { drawStatue(c, X.sx(tP.x), X.sy(tP.y), T); } });
    apply(true);
    X.after(1.2, () => { R.intro = false; X.banner('THE ROOM THAT REMEMBERS', 'Change the Past to make a road through the Present', GOLD_HI, 3, true, true); });
    // ---- pictures ----
    function drawAnchor(c, Xs, Ys, T) { const k = 0.5 + 0.5 * Math.sin(g.t * 3); c.save(); glowAt(c, Xs, Ys - T * 0.5, T * 1.3, R.era === 'past' ? GOLD_HI : VIOLET_HI, 0.35 + 0.2 * k); c.strokeStyle = R.era === 'past' ? GOLD_HI : VIOLET_HI; c.lineWidth = 3; c.beginPath(); c.ellipse(Xs, Ys, T * 0.85, T * 0.4, 0, 0, TAU); c.stroke(); c.lineWidth = 1.5; c.setLineDash([4, 4]); c.beginPath(); c.ellipse(Xs, Ys, T * 0.65, T * 0.3, 0, 0, TAU); c.stroke(); c.setLineDash([]);
      c.translate(Xs, Ys - T * 1.1 - k * T * 0.1); c.rotate(g.t * 0.6); c.fillStyle = GOLD_HI; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-T * 0.2, -T * 0.28); c.lineTo(T * 0.2, -T * 0.28); c.lineTo(-T * 0.2, T * 0.28); c.lineTo(T * 0.2, T * 0.28); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    function drawSeed(c, Xs, Ys, T) { c.save(); glowAt(c, Xs, Ys, T * 0.6, '#8FE0A6', 0.6); c.fillStyle = '#8A6A3A'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.ellipse(Xs, Ys, T * 0.2, T * 0.26, 0.3, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = '#8FE0A6'; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs, Ys - T * 0.22); c.quadraticCurveTo(Xs + T * 0.15, Ys - T * 0.45, Xs + T * 0.25, Ys - T * 0.38); c.stroke(); c.restore(); }
    function drawSlab(c, Xs, Ys, T, a) { c.save(); c.globalAlpha = a; c.fillStyle = '#6A6488'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.6, Ys - T * 0.2); c.lineTo(Xs + T * 0.6, Ys - T * 0.2); c.lineTo(Xs + T * 0.45, Ys - T * 0.5); c.lineTo(Xs - T * 0.45, Ys - T * 0.5); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#4A4468'; c.fillRect(Xs - T * 0.6, Ys - T * 0.2, T * 1.2, T * 0.14); c.strokeRect(Xs - T * 0.6, Ys - T * 0.2, T * 1.2, T * 0.14); c.restore(); }
    function drawBed(c, Xs, Ys, T) { c.save(); c.fillStyle = '#5A4630'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys, T * 0.85, T * 0.42, 0, 0, TAU); c.fill(); c.stroke(); if (R.sluice === 'garden') { c.fillStyle = 'rgba(127,211,242,.45)'; c.beginPath(); c.ellipse(Xs, Ys, T * 0.6, T * 0.28, 0, 0, TAU); c.fill(); }
      if (R.planted) { c.strokeStyle = '#4E9E44'; c.lineWidth = 3; c.beginPath(); c.moveTo(Xs, Ys); c.quadraticCurveTo(Xs - T * 0.1, Ys - T * 0.4, Xs + T * 0.05, Ys - T * 0.65); c.stroke(); c.fillStyle = '#8FE0A6'; [[-0.18, -0.45], [0.2, -0.55]].forEach(([dx, dy]) => { c.beginPath(); c.ellipse(Xs + dx * T, Ys + dy * T, T * 0.14, T * 0.07, dx > 0 ? -0.5 : 0.5, 0, TAU); c.fill(); }); } c.restore(); }
    function drawSluice(c, Xs, Ys, T) { c.save(); c.fillStyle = '#7A6E5C'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.45, Ys - T * 0.4, T * 0.9, T * 0.45); c.strokeRect(Xs - T * 0.45, Ys - T * 0.4, T * 0.9, T * 0.45); const a = R.sluice === 'pool' ? 0 : R.sluice === 'garden' ? -0.8 : 0.8; c.translate(Xs, Ys - T * 0.4); c.rotate(a); c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 0.9); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 3; c.stroke(); c.fillStyle = '#7FD3F2'; c.beginPath(); c.arc(0, -T * 0.95, T * 0.14, 0, TAU); c.fill(); c.restore(); }
    function drawDrain(c, Xs, Ys, T) { c.save(); c.fillStyle = '#2A2440'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs, Ys, T * 0.45, T * 0.22, 0, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = '#9AA3B2'; c.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(Xs + i * T * 0.12, Ys - T * 0.18); c.lineTo(Xs + i * T * 0.12, Ys + T * 0.18); c.stroke(); }
      if (!R.drain) { c.fillStyle = '#8A8070'; c.beginPath(); c.ellipse(Xs, Ys - T * 0.15, T * 0.32, T * 0.22, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.stroke(); } else if (R.sluice === 'garden') { c.strokeStyle = 'rgba(127,211,242,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(Xs, Ys, T * (0.2 + (g.t % 1) * 0.25), 0, TAU); c.stroke(); } c.restore(); }
    function drawStatue(c, Xs, Ys, T) { const past = R.era === 'past', whole = past || R.statueKept; c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.15, T * 0.8, T * 0.3, 0, 0, TAU); c.fill();
      if (whole) { c.fillStyle = past ? '#8E96A8' : '#6A7284'; c.strokeStyle = INK; c.lineWidth = 2; c.fillRect(Xs - T * 0.55, Ys - T * 0.35, T * 1.1, T * 0.4); c.strokeRect(Xs - T * 0.55, Ys - T * 0.35, T * 1.1, T * 0.4); c.beginPath(); c.moveTo(Xs - T * 0.35, Ys - T * 0.35); c.lineTo(Xs - T * 0.3, Ys - T * 1.6); c.quadraticCurveTo(Xs, Ys - T * 2.1, Xs + T * 0.3, Ys - T * 1.6); c.lineTo(Xs + T * 0.35, Ys - T * 0.35); c.closePath(); c.fill(); c.stroke();
        // the switch it holds out
        const lit = !past && R.gate; c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.moveTo(Xs + T * 0.3, Ys - T * 1.1); c.lineTo(Xs + T * 0.85, Ys - T * (lit ? 0.75 : 1.45)); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 3; c.stroke(); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(Xs + T * 0.85, Ys - T * (lit ? 0.75 : 1.45), T * 0.12, 0, TAU); c.fill();
        if (past) { // the shelter frame (and the roof, once set); the rain on it otherwise
          c.strokeStyle = '#5A4630'; c.lineWidth = 4; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(Xs + sd * T * 0.9, Ys); c.lineTo(Xs + sd * T * 0.9, Ys - T * 2.5); c.stroke(); });
          if (R.sheltered) drawSlab(c, Xs, Ys - T * 2.15, T * 1.5, 1);
          else { c.strokeStyle = 'rgba(160,200,255,.6)'; c.lineWidth = 1.5; for (let i = 0; i < 9; i++) { const rx = Xs - T * 0.8 + ((i * 0.37 + g.t * 0.9) % 1) * T * 1.6, ry = Ys - T * 2.6 + ((g.t * 2.5 + i * 0.29) % 1) * T * 2.4; c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx - T * 0.05, ry + T * 0.25); c.stroke(); } } } }
      else { c.fillStyle = '#5A6074'; c.strokeStyle = INK; c.lineWidth = 2; [[-0.4, -0.1, 0.35], [0.3, -0.05, 0.3], [0, -0.35, 0.28], [0.5, -0.3, 0.18]].forEach(([dx, dy, r]) => { c.beginPath(); c.moveTo(Xs + dx * T - r * T, Ys + dy * T + r * T * 0.4); c.lineTo(Xs + dx * T - r * T * 0.6, Ys + dy * T - r * T * 0.6); c.lineTo(Xs + dx * T + r * T * 0.7, Ys + dy * T - r * T * 0.4); c.lineTo(Xs + dx * T + r * T, Ys + dy * T + r * T * 0.4); c.closePath(); c.fill(); c.stroke(); }); }
      c.restore(); }
    const next = () => { if (R.gate) return 'The way on'; if (!R.root) { if (R.era === 'present') return R.carry === 'seed' || R.planted ? 'Into the Past at the anchor' : 'Find something that could grow across the chasm'; return !R.planted ? (R.carry === 'seed' ? 'Plant the seed in the riverside bed' : 'Something from the Present could grow here') : R.sluice !== 'garden' ? 'The seed needs water: turn the sluice to the garden' : !R.drain ? 'Garden water will flood the far hollow: the drain…' : 'Back to the Present'; }
      if (R.flooded) return R.era === 'past' ? 'Pull the drain plug, then back to the Present' : 'The hollow is flooded: the Past has a drain';
      if (!R.eroded) return R.era === 'past' ? 'Turn the sluice against the old wall, then back' : 'The old wall: what could wear it away?';
      if (!R.statueKept) return R.era === 'past' ? (R.carry === 'slab' ? 'Shelter the statue (through the open door)' : 'The statue needs shelter: bring something from the Present') : (R.carry === 'slab' ? 'Take the slab into the Past' : 'The statue is crumbled: shelter it in the Past (a slab lies in the ruins)');
      return 'Pull the statue\'s switch'; };
    return { R, switchEra, anchors,
      cam: () => ({ x: me.x, y: me.y, zoom: 0.78, k: 0 }),
      update(dt) { if (R.flashT > 0) R.flashT -= dt; R.k += ((R.era === 'past' ? 1 : 0) - R.k) * Math.min(1, dt * 3); },
      goal() { return self.done ? 'The way on' : R.intro ? 'The Room That Remembers' : `${R.era === 'past' ? 'Past' : 'Present'} · ${next()}${R.carry ? ` · carrying the ${R.carry}` : ''}`; },
      hint() { return null; },
      drawGround(c) { const T = X.Tz(), past = R.era === 'past';
        // the river of the Past, flowing where the chasm will be (and its channel to the garden or the wall)
        if (past) { c.save(); for (const t of T_.root) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); c.fillStyle = '#3A78A8'; c.fillRect(Xs, Ys, T + 0.5, T + 0.5); } c.restore(); }
        // the root across the chasm
        if (!past && R.root) { const xs = T_.root.map(t => t.tx), ys = T_.root.map(t => t.ty), x0 = Math.min(...xs), x1 = Math.max(...xs) + 1, y0 = Math.min(...ys), y1 = Math.max(...ys) + 1, X0 = X.sx(x0), X1 = X.sx(x1), Y0 = X.sy(y0) - T * 0.3, Y1 = X.sy(y1) + T * 0.3;
          c.save(); c.fillStyle = '#6A4A2A'; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.moveTo(X0 + T * 0.3, Y0); c.bezierCurveTo(X0 - T * 0.2, (Y0 + Y1) / 2, X0 + T * 0.6, (Y0 + Y1) / 2, X0 + T * 0.2, Y1); c.lineTo(X1 - T * 0.2, Y1); c.bezierCurveTo(X1 - T * 0.6, (Y0 + Y1) / 2, X1 + T * 0.2, (Y0 + Y1) / 2, X1 - T * 0.3, Y0); c.closePath(); c.fill(); c.stroke();
          c.strokeStyle = 'rgba(30,20,10,.5)'; c.lineWidth = 2; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(X0 + T * (0.5 + k * 0.55), Y0 + 4); c.bezierCurveTo(X0 + T * (0.2 + k * 0.6), (Y0 + Y1) / 2, X0 + T * (0.8 + k * 0.5), (Y0 + Y1) / 2, X0 + T * (0.5 + k * 0.55), Y1 - 4); c.stroke(); } c.fillStyle = '#8FE0A6'; [[0.2, 0.3], [0.85, 0.6], [0.4, 0.8]].forEach(([u, v]) => { c.beginPath(); c.ellipse(X0 + (X1 - X0) * u, Y0 + (Y1 - Y0) * v, T * 0.16, T * 0.08, 0.4, 0, TAU); c.fill(); }); c.restore(); }
        // the flooded hollow
        if (!past && R.flooded) { c.save(); for (const t of T_.flood) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); c.fillStyle = 'rgba(58,120,168,.85)'; c.fillRect(Xs, Ys, T + 0.5, T + 0.5); c.strokeStyle = 'rgba(200,235,255,.5)'; c.lineWidth = 1.5; c.beginPath(); c.arc(Xs + T * 0.5, Ys + T * 0.5, T * (0.15 + ((g.t + t.tx * 0.3) % 1) * 0.3), 0, TAU); c.stroke(); } c.restore(); }
        // the worn wall's rubble, the collapsed door's rubble
        if (!past && R.eroded) for (const t of T_.wall) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); c.fillStyle = '#5A5478'; [[0.25, 0.7, 0.22], [0.7, 0.4, 0.18]].forEach(([u, v, r]) => { c.beginPath(); c.arc(Xs + u * T, Ys + v * T, r * T, 0, TAU); c.fill(); }); }
        if (past) for (const t of T_.door) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); c.save(); c.strokeStyle = GOLD; c.lineWidth = 3; c.strokeRect(Xs + 2, Ys - T * 0.2, T - 4, T * 1.1); c.restore(); }
        // the sluice's water line: where the river is sent
        if (past && R.sluice !== 'pool') { const from = sluice, to = R.sluice === 'garden' ? bed : { x: T_.wall[2].x, y: T_.wall[2].y + 0.8 }; c.save(); c.strokeStyle = 'rgba(127,211,242,.75)'; c.lineWidth = 5; c.setLineDash([10, 8]); c.lineDashOffset = -g.t * 30; c.beginPath(); c.moveTo(X.sx(from.x), X.sy(from.y)); c.lineTo(X.sx(to.x), X.sy(to.y)); c.stroke(); c.restore(); }
        // what is carried, over the pet
        if (R.carry === 'seed') drawSeed(c, X.sx(me.x), X.sy(me.y) - T * 1.3, T); else if (R.carry === 'slab') drawSlab(c, X.sx(me.x), X.sy(me.y) - T * 0.9, T * 0.8, 0.95); },
      drawOver(c) { const W = X.W(), Hh = X.H(); c.save(); c.globalAlpha = 0.14 * R.k; c.fillStyle = '#FFD890'; c.fillRect(0, 0, W, Hh); if (R.flashT > 0) { c.globalAlpha = R.flashT * 0.8; c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, Hh); } c.restore();
        c.save(); const past = R.era === 'past', x = W - 64, y = 150; c.fillStyle = 'rgba(20,16,30,.7)'; GFX.rr(c, x - 50, y - 16, 100, 30, 12); c.fill(); label(c, past ? 'PAST' : 'PRESENT', x, y + 5, 15, past ? GOLD_HI : VIOLET_HI); c.restore(); },
    };
  }
  SEP_STAGES.REMEMBER = { name: 'The Room That Remembers', goal: 'Change the Past to open the Present', how: 'This chamber exists in two ages. Switch between them at the glowing memory anchors: whatever your pet carries goes through time with it. What you do in the Past is what the Present remembers when you come back. A seed planted in the riverside bed, with the river running to the garden, grows into a root across the chasm. The sluice can send the river against the old wall, wearing it through. A statue left in the rain crumbles; shelter it and its switch survives to open the gate. But water sent to the garden floods the hollow where the root lands, unless the drain was opened first.',
    layout: [
      '#######################',
      '#########..E..#########',
      '#########ggggg#########',
      '######...........######',
      '######.....t.....######',
      '######...........######',
      '######wwwww#ddd########',
      '###.................####',
      '###..k.......Y......####',
      '###.................####',
      '###.ffffffffff......####',
      '~~~~~~~~rrr~~~~~~~~~~~~~',
      '~~~~~~~~rrr~~~~~~~~~~~~~',
      '~~~~~~~~rrr~~~~~~~~~~~~~',
      '###.....p.............##',
      '###..u.......n........##',
      '###...s.......Q.......##',
      '###..................S##',
      '########################'],
    legend: { E: {}, g: {}, t: {}, w: {}, d: {}, k: {}, Y: {}, f: {}, r: {}, p: {}, u: {}, n: {}, s: {}, Q: {} }, make: makeRemember };
})();
