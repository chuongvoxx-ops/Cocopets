/* ---------- Rift 2: The Garden of Unborn Stars (level 20, Earth and Dark, the Bloom Sigil) ----------
   A botanical garden replaced by a forest that grows eggs instead of fruit. Six stages: the Light Orchard (route a
   seed-lamp's beam through prism flowers to grow a root bridge), Oruun the Cradle Tick, the Grafting Beds (match living
   seeds to their beds), Velis the Glasswing, the Seedling Pilgrimage (escort a seedling from patch to patch), Vhorru the
   Root of a Thousand Young (shelter in the one open blossom), then the sealing. Original creatures: the Black Goat's
   alien fertility, as a garden. */
(() => {
  const TAU = Math.PI * 2;
  /* ---- the land: near-black plum floors, dusty rose, muted jade, warm cream ---- */
  BIOMES.garden = { name: 'The Garden of Unborn Stars', rift: true, tile: 'forest', out: true, dark: 0.18, bg: '#B9A6D8', gap: 'pit', mud: ['#3A2047', '#452A54'], mudSpot: 'rgba(242,216,161,.18)', ambient: 'motes', accent: '#A85E87', light: '#F2D8A1',
    floor: ['#3A2449', '#402A50', '#352042'], grout: '#2A1634', hi: '#5A3F6B', top: '#4A8D7B', face: '#2F183A', faceD: '#1E0F26', cliff: '#2F183A', deco: '#F2D8A1',
    props: ['oak', 'fern', 'stump'], hazard: 'thorns', grade: 'rgba(168,94,135,.08)', fog: '#1E0F26', darkRGB: '30,15,38' };
  BIOME_ORDER.push('garden');
  const PLUM = '#2F183A', ROSE = '#A85E87', JADE = '#4A8D7B', CREAM = '#F2D8A1', GOLD = '#FFD36B', INK = '#2B2433';
  /* ---- the roster ---- */
  Object.assign(MON, {
    thornling: { name: 'Thornling', from: 999, hp: 120, spd: 1.3, r: 0.36, dmg: 11, xp: 9, coin: 0.5, color: '#7A4C9E', bio: ['garden'], tip: 'Hunches, then fires one thorn straight ahead. Step aside as it hunches.', kit: [] },
    milkcap: { name: 'Milkcap grazer', from: 999, hp: 320, spd: 1.1, r: 0.55, dmg: 13, xp: 14, coin: 0.8, color: JADE, bio: ['garden'], tip: 'Soaks damage from the front while others hide behind it. After a failed charge its underside is exposed.', kit: [] },
    pollenmoth: { name: 'Star pollen moth', from: 999, hp: 70, spd: 1.5, r: 0.32, dmg: 6, xp: 8, coin: 0.5, color: '#2B2433', bio: ['garden'], fly: true, tip: 'Draws a golden line to a lamp, then drains it. Kill it before the lamp goes dark.', kit: [] },
    egg: { name: 'Unborn egg', from: 999, hp: 90, spd: 0, r: 0.4, dmg: 0, xp: 3, coin: 0, color: CREAM, bio: ['garden'], still: true, tip: 'Hatches a thornling unless broken first.', kit: [] },
  });
  const { LN, lwOf, shade, stroke, spec, MP, NF, EXT } = DunArt;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const tri = (c, x, y, r, a) => { c.beginPath(); for (let i = 0; i < 3; i++) { const q = a + i * TAU / 3; i ? c.lineTo(x + Math.cos(q) * r, y + Math.sin(q) * r) : c.moveTo(x + Math.cos(q) * r, y + Math.sin(q) * r); } c.closePath(); };
  Object.assign(MP, {
    /* a knee-high purple seed pod on three triangular feet, one thorn pointing forward; it hunches before firing */
    thornling(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, hunch = o.mode === 'block' ? 1 : 0, sq = 1 - hunch * 0.2, dir = 1;
      [[-0.6, 0.7], [0.1, 0.85], [0.7, 0.65]].forEach(([x, y]) => { c.fillStyle = shadeC(col, -0.25); tri(c, x * r, y * r, r * 0.3, -Math.PI / 2); c.fill(); stroke(c, lw * 0.8); });
      c.beginPath(); c.ellipse(0, r * 0.1 * (1 + hunch), r * 0.8, r * 0.9 * sq, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.45); c.fill(); stroke(c, lw);
      c.strokeStyle = shadeC(col, -0.3); c.lineWidth = lw * 0.8; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * r * 0.35, -r * 0.7); c.quadraticCurveTo(i * r * 0.45, 0, i * r * 0.3, r * 0.8); c.stroke(); }
      // the thorn: longer as it hunches
      const tl = r * (0.9 + hunch * 0.5); c.fillStyle = CREAM; c.beginPath(); c.moveTo(r * 0.6, -r * 0.05); c.lineTo(r * 0.6 + tl, 0); c.lineTo(r * 0.6, r * 0.15); c.closePath(); c.fill(); stroke(c, lw * 0.8);
      c.fillStyle = GOLD; c.beginPath(); c.arc(r * 0.25, -r * 0.2, r * 0.13, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(r * 0.29, -r * 0.2, r * 0.06, 0, TAU); c.fill();
      spec(c, -r * 0.3, -r * 0.5, r * 0.25, r * 0.15, 0.4);
    },
    /* a broad jade mushroom body on four stubby legs under a cream dome cap; the cap tips forward to block */
    milkcap(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, st2 = Math.sin(ph * TAU), tip = o.mode === 'block' ? 0.25 : 0, flipped = o.mode === 'flip';
      [[-0.7, 0.75], [-0.25, 0.85], [0.25, 0.85], [0.7, 0.75]].forEach(([x, y], i) => limb(c, x * r * 0.7, r * 0.3, x * r + (i % 2 ? st2 : -st2) * r * 0.08, y * r, lw * 1.6, shadeC(col, -0.2)));
      c.beginPath(); c.ellipse(0, r * 0.25, r * 0.75, r * 0.5, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, 0, 0.4); c.fill(); stroke(c, lw);
      if (flipped) { c.fillStyle = '#F7E9C8'; c.beginPath(); c.ellipse(0, r * 0.2, r * 0.55, r * 0.32, 0, 0, TAU); c.fill(); stroke(c, lw * 0.8); c.strokeStyle = ROSE; c.lineWidth = lw * 0.7; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * 0.2, -r * 0.05); c.lineTo(i * r * 0.22, r * 0.45); c.stroke(); } }
      c.save(); c.translate(0, -r * 0.35 + tip * r); c.rotate(tip * 0.9);
      c.beginPath(); c.moveTo(-r * 1.1, 0); c.quadraticCurveTo(-r * 1.0, -r * 1.0, 0, -r * 1.05); c.quadraticCurveTo(r * 1.0, -r * 1.0, r * 1.1, 0); c.closePath(); c.fillStyle = shade(c, '#F2E4C4', r, -r * 0.3, -r * 0.6, 0.4); c.fill(); stroke(c, lw);
      c.fillStyle = 'rgba(168,94,135,.35)'; [[-0.5, -0.5, 0.18], [0.2, -0.7, 0.14], [0.6, -0.35, 0.12]].forEach(([x, y, k]) => { c.beginPath(); c.arc(x * r, y * r, r * k, 0, TAU); c.fill(); });
      c.restore();
      [[-0.3, 0.05], [0.3, 0.05]].forEach(([x, y]) => { c.fillStyle = INK; c.beginPath(); c.arc(x * r, y * r, r * 0.08, 0, TAU); c.fill(); });
    },
    /* a small dark diamond with two oversized pale triangular wings and a luminous abdomen */
    pollenmoth(c, r, ph, o) {
      const lw = lwOf(r), fl = Math.sin(ph * TAU * 2) * 0.35, bob = Math.sin(ph * TAU) * r * 0.08;
      glowAt(c, 0, r * 0.5 + bob, r * 0.9, GOLD, 0.5);
      [-1, 1].forEach(sd => { c.save(); c.translate(0, bob); c.scale(sd, 1); c.fillStyle = shade(c, '#F3E7D3', r * 1.6, r * 0.6, -r * 0.3, 0.3); c.beginPath(); c.moveTo(r * 0.1, 0); c.lineTo(r * 1.7, -r * (1.2 - fl)); c.lineTo(r * 1.4, r * 0.6); c.closePath(); c.fill(); stroke(c, lw * 0.9); c.fillStyle = 'rgba(168,94,135,.35)'; c.beginPath(); c.arc(r * 1.05, -r * 0.2, r * 0.2, 0, TAU); c.fill(); c.restore(); });
      c.fillStyle = o.color; c.beginPath(); c.moveTo(0, -r * 0.8 + bob); c.lineTo(r * 0.3, bob); c.lineTo(0, r * 0.5 + bob); c.lineTo(-r * 0.3, bob); c.closePath(); c.fill(); stroke(c, lw);
      c.fillStyle = GOLD; c.beginPath(); c.ellipse(0, r * 0.55 + bob, r * 0.22, r * 0.3, 0, 0, TAU); c.fill(); stroke(c, lw * 0.7);
      c.strokeStyle = INK; c.lineWidth = lw * 0.6; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(0, -r * 0.7 + bob); c.quadraticCurveTo(sd * r * 0.4, -r * 1.2 + bob, sd * r * 0.55, -r * 1.3 + bob); c.stroke(); });
    },
    /* a cream egg in four plum plates; the eye kind carries a closed eye */
    egg(c, r, ph, o) {
      const lw = lwOf(r), wob = o.mode === 'block' ? Math.sin(ph * TAU * 6) * 0.12 : 0;
      c.save(); c.rotate(wob); c.beginPath(); c.ellipse(0, 0, r * 0.75, r * 0.95, 0, 0, TAU); c.fillStyle = shade(c, CREAM, r, -r * 0.2, -r * 0.4, 0.4); c.fill(); stroke(c, lw);
      c.strokeStyle = PLUM; c.lineWidth = lw * 1.2; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.cos(a) * r * 0.5, Math.sin(a) * r * 0.6, Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.9); c.stroke(); }
      if (o.eye) { c.strokeStyle = INK; c.lineWidth = lw * 1.3; c.beginPath(); c.arc(0, -r * 0.1, r * 0.3, 0.2, Math.PI - 0.2); c.stroke(); c.fillStyle = GOLD; c.beginPath(); c.arc(0, -r * 0.1, r * 0.08, 0, TAU); c.fill(); }
      c.restore(); spec(c, -r * 0.3, -r * 0.55, r * 0.22, r * 0.14, 0.45);
    },
  });
  Object.assign(EXT, { thornling: 2.0, milkcap: 2.0, pollenmoth: 2.2, egg: 1.6 });
  Object.assign(NF, { thornling: 4, milkcap: 6, pollenmoth: 6, egg: 4 });
  const { mon, keepRange } = DunAI;
  const lampsOf = X => (X.rift && X.rift.self.mod.lamps) || [];
  Object.assign(mon, {
    thornling(m, A, X) {
      // keeps a little way off, hunches (its thorn lengthens), then one straight thorn
      if (m.hunch > 0) { m.hunch -= A.dt; m.mode = 'block'; m.face = A.dx >= 0 ? 1 : -1; if (m.hunch <= 0) { const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.eshot(m.x, m.y, a, 7, { r: 0.2, dmg: m.dmg, color: '#B98BE0', core: CREAM, style: 'orb', src: m }); m.cd = 2.4 + Math.random(); m.mode = null; } return; }
      if (A.d > 4.5) { X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
      else if (A.d < 2) { X.moveEnt(m, -A.ux * A.sp * 0.6 * A.dt, -A.uy * A.sp * 0.6 * A.dt); }
      if (m.cd <= 0 && A.d < 7 && A.los()) { m.hunch = 0.7; X.warn({ shape: 'line', x: m.x, y: m.y, a: Math.atan2(X.me.y - m.y, X.me.x - m.x), len: 7, w: 0.5, life: 0.7, max: 0.7, src: m, color: '#B98BE0' }); }
    },
    milkcap(m, A, X) {
      // walks at you with its cap tipped forward (a third of the damage from the front); every so often a charge, and
      // if the charge misses it tumbles and lies cap-down for a moment, its underside open
      if (m.flipT > 0) { m.flipT -= A.dt; m.mode = 'flip'; if (m.flipT <= 0) { m.mode = null; m.cd = 2; } return; }
      if (m.charge) { m.charge.t += A.dt; m.mode = 'block'; const ch = m.charge; X.moveEnt(m, Math.cos(ch.a) * 6 * A.dt, Math.sin(ch.a) * 6 * A.dt); m.face = Math.cos(ch.a) >= 0 ? 1 : -1;
        if (A.d < m.r + X.me.r + 0.2 && !ch.hit) { ch.hit = true; X.hurtPet(m.dmg * 1.5, m); X.push(ch.a, 1.5); }
        if (ch.t > 0.75) { m.charge = null; if (!ch.hit) { m.flipT = 2.4; X.text(m.x, m.y - m.r - 0.5, 'Tumbled!', '#FFFFFF', 12); } else m.cd = 2.5; } return; }
      m.mode = A.d < 5 ? 'block' : null; m.guardFn = m.guardFn || ((q, o) => (q.mode === 'block' && Math.abs(DunAI.angTo(q.face >= 0 ? 0 : Math.PI, Math.atan2(X.me.y - q.y, X.me.x - q.x))) < 1.3 ? 0.33 : q.mode === 'flip' ? 2 : 1));
      if (A.d > 1.4) { X.moveEnt(m, A.ux * A.sp * 0.8 * A.dt, A.uy * A.sp * 0.8 * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
      else if (m.atkCd <= 0) { X.hurtPet(m.dmg, m); m.atkCd = 1.4; X.slash(m.x + A.ux * 0.6, m.y + A.uy * 0.6, Math.atan2(A.uy, A.ux), 0.8, CREAM); }
      if (m.cd <= 0 && A.d > 2.5 && A.d < 7 && A.los()) { m.cd = 5; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'line', x: m.x, y: m.y, a, len: 5, w: 1.2, life: 0.6, max: 0.6, src: m, color: CREAM }); X.after(0.6, () => { if (!m.dead) m.charge = { a, t: 0, hit: false }; }); }
    },
    pollenmoth(m, A, X) {
      // tethers to the nearest lit lamp and drains it; with no lamp to drain, it hangs near you and sips your MP
      const lamps = lampsOf(X).filter(l => l.charge > 0 && !l.broken), L = lamps.length ? lamps.reduce((b, l) => (Math.hypot(l.x - m.x, l.y - m.y) < Math.hypot(b.x - m.x, b.y - m.y) ? l : b)) : null;
      m.tether = null;
      if (L) { const d = Math.hypot(L.x - m.x, L.y - m.y); if (d > 2.2) { X.moveEnt(m, (L.x - m.x) / d * A.sp * A.dt, (L.y - m.y) / d * A.sp * A.dt, 1); m.face = L.x >= m.x ? 1 : -1; }
        else { m.tether = L; L.charge = Math.max(0, L.charge - 0.14 * A.dt); L.drainT = 0.3; if (L.charge <= 0 && !L.dark) { L.dark = true; X.text(L.x, L.y - 1.2, 'The lamp goes dark', '#B98BE0', 12); } } return; }
      keepRange(m, A, X, 2.5, 4.5);
      if (A.d < 4.5 && A.los()) { m.tether = X.me; X.me.mp = Math.max(0, X.me.mp - 2.5 * A.dt); }
    },
    egg(m, A, X) { m.life = (m.life == null ? 6.5 : m.life) - A.dt; m.mode = m.life < 1.5 ? 'block' : null; },
  });

  /* ---- the mini bosses' moves: Rift-touched Cocopets (RiftEvil) fighting with the garden's own tricks ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'briarpet', rift: true, name: 'Briar', title: 'A Rift-touched Cocopet', hp: 19000, dmg: 19, r: 1.3, spd: 1.6, color: '#7A4C9E', glow: ROSE, biome: 'garden', el: 'leaf' },
    { id: 'dustpet', rift: true, name: 'Dust', title: 'A Rift-touched Cocopet', hp: 23000, dmg: 18, r: 1.25, spd: 2.0, color: '#4A4458', glow: GOLD, biome: 'garden', el: 'leaf' },
    { id: 'rootpet', rift: true, name: 'Root', title: 'A Rift-touched Cocopet', hp: 30000, dmg: 22, r: 1.5, spd: 1.2, color: '#1C1020', glow: '#E04FA3', biome: 'garden', el: 'leaf' });
  Object.assign(DunAI.boss, {
    /* Briar: a ring of thorns, then a charge that leaves a thorn trail */
    briarpet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['ring', 'charge', 'charge', 'ring'] : ['ring', 'charge']); }
      const T = m.actT;
      switch (m.act) {
        case 'ring': { if (m.step === 0) { m.step = 1; X.say(m, 'Thorns.'); X.warn({ x: m.x, y: m.y, r: 2.4, life: 0.9, max: 0.9, src: m, color: ROSE }); }
          if (T > 0.9 && m.step === 1) { m.step = 2; for (let i = 0; i < 12; i++) X.eshot(m.x, m.y, i / 12 * TAU + T, 5, { r: 0.2, dmg: m.dmg * 0.7, color: '#B98BE0', core: '#FFFFFF', style: 'bolt', src: m }); X.sfx.whoosh(); }
          if (T > 1.4) done(m, 1.6); break; }
        case 'charge': { if (m.step === 0) { m.step = 1; m.ca = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.ca) >= 0 ? 1 : -1; X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ca, len: 9, w: 1.6, life: 0.8, max: 0.8, src: m, color: ROSE }); X.say(m, 'Hup!'); }
          if (T > 0.8 && T < 1.7) { X.moveEnt(m, Math.cos(m.ca) * 9 * A.dt, Math.sin(m.ca) * 9 * A.dt); if (A.d < m.r + X.me.r + 0.3 && !m.chit) { m.chit = true; X.hurtPet(m.dmg * 1.4, m); X.push(m.ca, 1.6); } if (Math.random() < A.dt * 6) X.zone({ kind: 'thorns', x: m.x, y: m.y, r: 0.7, life: 4, max: 4, dps: m.dmg * 0.35, tick: 0.3, own: 'enemy', color: '#7A4C9E' }); }
          if (T > 1.9) { m.chit = false; done(m, 1.8); } break; }
        default: done(m, 1);
      }
    },
    /* Dust: dashes through you leaving pollen, and throws a fan of pollen bolts */
    dustpet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3.2 ? 1 : 0.2)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['dash', 'fan', 'dash', 'dash'] : ['dash', 'fan']); }
      const T = m.actT;
      switch (m.act) {
        case 'dash': { if (m.step === 0) { m.step = 1; m.ca = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ca, len: 8, w: 1.2, life: 0.7, max: 0.7, src: m, color: GOLD }); X.say(m, 'Dust.'); }
          if (T > 0.7 && T < 1.3) { X.moveEnt(m, Math.cos(m.ca) * 11 * A.dt, Math.sin(m.ca) * 11 * A.dt, 1); if (Math.random() < A.dt * 10) X.zone({ kind: 'poison', x: m.x, y: m.y, r: 0.8, life: 3.5, max: 3.5, dps: m.dmg * 0.4, tick: 0.25, own: 'enemy', color: '#E6C86A' }); if (A.d < m.r + X.me.r + 0.3 && !m.chit) { m.chit = true; X.hurtPet(m.dmg, m); } }
          if (T > 1.5) { m.chit = false; done(m, 1.3); } break; }
        case 'fan': { if (m.step === 0) { m.step = 1; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); for (let i = -2; i <= 2; i++) X.eshot(m.x, m.y, a + i * 0.22, 5.5, { r: 0.2, dmg: m.dmg * 0.6, color: GOLD, core: '#FFFFFF', style: 'orb', src: m }); X.sfx.whoosh(); }
          if (T > 0.6) done(m, 1.4); break; }
        default: done(m, 1);
      }
    },
    /* Root: three root lanes raked from its feet, and eggs that hatch thornlings unless broken */
    rootpet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3.5 ? 1 : 0)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['rake', 'eggs', 'rake', 'rake'] : ['rake', 'eggs']); }
      const T = m.actT;
      switch (m.act) {
        case 'rake': { if (m.step === 0) { m.step = 1; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(a) >= 0 ? 1 : -1; [-0.55, 0, 0.55].forEach(off => { const q = a + off; X.warn({ shape: 'line', x: m.x, y: m.y, a: q, len: 10, w: 1.1, life: 1.6, max: 1.6, src: m, color: '#E04FA3', fn: () => { if (X.inLine(m.x, m.y, q, 10, 1.1)) X.hurtPet(m.dmg * 1.2, m); X.shake(6, 0.2); } }); }); X.say(m, 'Rake.'); }
          if (T > 2) done(m, 1.6); break; }
        case 'eggs': { if (m.step === 0) { m.step = 1; X.say(m, 'Grow.'); for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, q = X.freeSpot(m.x + Math.cos(a) * 2.5, m.y + Math.sin(a) * 2.5, 0.4); if (q) { const e = X.spawnMon('egg', q.x, q.y, { aggro: true, pack: 560 }); e.life = 5; X.g.total++; } } }
          if (T > 1) done(m, 2.2); break; }
        default: done(m, 1);
      }
    },
  });
  // an egg that lives out its time hatches a thornling
  const eggAI = mon.egg; mon.egg = (m, A, X) => { eggAI(m, A, X); if (m.life <= 0 && !m.dead) { m.dead = true; m.hp = 0; const t = X.spawnMon('thornling', m.x, m.y, { aggro: true, pack: 561 }); X.g.total++; X.sparks(m.x, m.y, CREAM, 10, 4); X.text(m.x, m.y - 1, 'Hatched!', CREAM, 11); } };

  /* ---------- puzzle 1: the Seedling March, an army run up the moss lane ----------
     A long straight lane of moss over the starry void, up to the Garden's heart. The march never stops: the pet leads a
     crowd of seedling sprites up it and the player only steers, left and right (the move stick or the keys; a dodge is a
     quick side-step). Every seedling shoots up the lane by itself, so the bigger the army, the more bolts fly. Gate pairs
     stand across the lane: green ones grow the army (+N, ×N), rose ones shrink it (−N, ÷N); the army takes the one it
     runs through. Stone blocks show a number: shoot it to nothing and what sits on top is yours (the seed crossbow, the
     thorn spread, more seedlings); a block that reaches the army unbroken crushes those that run into it. Thornling
     crowds carry a count of their own: shoot them thin, and when the two crowds meet the numbers eat each other down.
     Thorn hedges and rolling moss boulders thin the army. Two bloom posts are checkpoints. At the end, the Milkcap
     Colossus: a big number to shoot down and then hack at, while roots burst and spores fall in rose rings. Lose every
     seedling and the pet marches alone on three hearts; out of hearts, the march begins again at the last bloom post */
  const ML = 200, LX0 = 4, LX1 = 12, LXM = 8, M_SPD = 3.6, M_TREAD = 2.4, M_CAP = 90, M_SP = 0.25, GA = Math.PI * (3 - Math.sqrt(5)), BOSS_HP = 12000, B_CONTACT = 2.9, TOUGH = 3;
  const MINT = '#6FE3B4', BAD = '#FF6A8E', MOSS = '#3F7B61';
  const marchLayout = (() => { const rows = []; for (let y = 0; y < ML; y++) { let r = ''; for (let x = 0; x < 14; x++) r += x < 3 || x > 10 ? '~' : y === ML - 4 && x === 7 ? 'S' : '.'; rows.push(r); } return rows; })();
  // the course, by distance up the lane from the start (L and R: the left and right gate of a pair, [op, n])
  const M_COURSE = [
    { d: 10, k: 'gate', L: ['+', 10], R: ['-', 5], tip: ['PICK THE GREEN GATE', 'Green grows your army · rose shrinks it'] },
    { d: 22, k: 'block', x: 8, hp: 15, gift: 'bow', tip: ['SHOOT THE BLOCK', 'Steer under it · break it to win its prize'] },
    { d: 34, k: 'gate', L: ['+', 6], R: ['x', 2] },
    { d: 46, k: 'crowd', x: 8, n: 30, tip: ['THORNLINGS!', 'Shoot them thin, then crash in: number against number'] },
    { d: 57, k: 'hedge', x0: 4, x1: 8.4 },
    { d: 66, k: 'boulder', x: 10, hp: 6 },
    { d: 72, k: 'gate', L: ['/', 2], R: ['+', 12] },
    { d: 80, k: 'cp' },
    { d: 92, k: 'block', x: 5.8, hp: 34, gift: 'spread' },
    { d: 94, k: 'crowd', x: 10.6, n: 12 },
    { d: 106, k: 'gate', L: ['-', 20], R: ['x', 2] },
    { d: 118, k: 'crowd', x: 8, n: 60, egg: true },
    { d: 124, k: 'boulder', x: 5.4, hp: 8 }, { d: 129, k: 'boulder', x: 10.6, hp: 8 },
    { d: 136, k: 'hedge', x0: 4, x1: 6.0 }, { d: 136, k: 'hedge', x0: 10.0, x1: 12 },
    { d: 146, k: 'block', x: 10, hp: 30, gift: 'troop' },
    { d: 154, k: 'gate', L: ['+', 20], R: ['x', 2] },
    { d: 166, k: 'crowd', x: 8, n: 90, egg: true },
    { d: 174, k: 'cp' },
    { d: 178, k: 'boss' },
  ];
  const GIFTS = { bow: { name: 'SEED CROSSBOW', sub: 'Faster, piercing bolts: twice the punch', col: GOLD }, spread: { name: 'THORN SPREAD', sub: 'Every seedling fires three thorns', col: '#C9A0FF' }, troop: { name: '+25 SEEDLINGS', sub: 'Fresh sprouts join the march', col: MINT } };
  const OPS = { '+': (n, v) => n + v, '-': (n, v) => Math.max(0, n - v), x: (n, v) => n * v, '/': (n, v) => Math.floor(n / v) }, GLYPH = { '+': '+', '-': '−', x: '×', '/': '÷' };
  const hsh = v => { const s = Math.sin(v * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  /* a seedling sprite: a plump pale-green seed on two little feet, two leaves sprouting from its head */
  MP.seedling = (c, r, ph, o) => { const lw = lwOf(r), st2 = Math.sin(ph * TAU);
    [-1, 1].forEach(s => { c.fillStyle = '#2F5E52'; c.beginPath(); c.ellipse(s * r * 0.36, r * 0.8 + s * st2 * r * 0.08, r * 0.24, r * 0.15, 0, 0, TAU); c.fill(); stroke(c, lw * 0.8); });
    c.strokeStyle = LN; c.lineWidth = lw * 1.8; c.beginPath(); c.moveTo(0, -r * 0.55); c.quadraticCurveTo(r * 0.05, -r * 0.85, 0, -r * 0.95); c.stroke(); c.strokeStyle = '#3E9A63'; c.lineWidth = lw * 0.9; c.stroke();
    [-1, 1].forEach(s => { c.save(); c.translate(s * r * 0.08, -r * 0.92); c.rotate(s * (0.75 + st2 * 0.12)); c.beginPath(); c.ellipse(0, -r * 0.3, r * 0.2, r * 0.36, 0, 0, TAU); c.fillStyle = s < 0 ? '#7FD98F' : '#5CC47A'; c.fill(); stroke(c, lw * 0.85); c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -r * 0.05); c.lineTo(0, -r * 0.55); c.stroke(); c.restore(); });
    c.beginPath(); c.ellipse(0, r * 0.15, r * 0.72, r * 0.74, 0, 0, TAU); c.fillStyle = shade(c, o.color || '#C8EEB4', r, -r * 0.2, -r * 0.25, 0.42); c.fill(); stroke(c, lw);
    c.fillStyle = INK; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * r * 0.24, r * 0.08, r * 0.09, r * 0.12, 0, 0, TAU); c.fill(); });
    c.fillStyle = 'rgba(255,143,184,.55)'; [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * r * 0.44, r * 0.3, r * 0.12, r * 0.07, 0, 0, TAU); c.fill(); });
    c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.beginPath(); c.arc(0, r * 0.26, r * 0.1, 0.3, Math.PI - 0.3); c.stroke();
    spec(c, -r * 0.3, -r * 0.2, r * 0.2, r * 0.12, 0.5); };
  EXT.seedling = 1.9; NF.seedling = 4;
  function makeMarch(X, self, H) {
    const me = X.me, g = X.g, Y0 = X.M.start.y, SK = () => Math.min((typeof arc !== 'undefined' && arc.dpr) || 1, 2);
    const S = { mode: 'intro', t: 0, d: 0, y: Y0, n: 8, hearts: 3, inv: 0, bow: false, spread: false, fireT: 0.6, vol: 0, phase: 'course', clash: null, clashT: 0, tread: 0, scroll: 0, next: 0, wait: 0, alone: false, restarts: 0,
      ax: LXM, cx: LXM, cy: Y0, R: 1, compT: 0, popT: 0, best: 8, gates: 0, blocks: 0, crowds: 0, clashes: 0, exitY: null, cp: { d: 0, n: 8, bow: false, spread: false } };
    const sol = [], bolts = [], jumps = [], flyers = [], rings = [], floats = {};
    let E = [], B = null, uid = 0, order = [];
    me.x = LXM; me.y = Y0;
    /* ---- the army: a sunflower of seedlings round a point just behind the pet; each keeps its own place, holes close up ---- */
    const slotXY = s => { const r = M_SP * Math.sqrt(s + 0.5), a = s * GA; return [Math.cos(a) * r, Math.sin(a) * r * 0.72]; };
    const wpos = q => [Math.max(LX0 + 0.24, Math.min(LX1 - 0.24, S.cx + q.ox)), S.cy + q.oy];
    function freeSlot() { const used = new Set(sol.map(q => q.s)); let s = 0; while (used.has(s)) s++; return s; }
    function addSol(k, fx, fy) { for (let i = 0; i < k && sol.length < M_CAP; i++) { const s = freeSlot(), [tx, ty] = slotXY(s), q = { s, ox: tx, oy: ty, k: 0, ph: Math.random() }; if (fx != null) { q.ox = fx - S.cx + (Math.random() - 0.5) * 2.4; q.oy = fy - S.cy + (Math.random() - 0.5) * 0.6; q.k = 0.2; } sol.push(q); } }
    function pop(q, col) { const [x, y] = wpos(q); if (S.popT < 14) { S.popT++; X.sparks(x, y - 0.2, col || MINT, 4, 3); X.part({ kind: 'confetti', x, y: y - 0.2, vx: (Math.random() - 0.5) * 3, vy: -2 - Math.random() * 2, g: 9, life: 0.6, max: 0.6, size: 3, rot: Math.random() * 6, vr: 8, color: Math.random() < 0.5 ? '#7FD98F' : '#C8EEB4' }); } }
    function sync() { const V = Math.min(S.n, M_CAP); if (sol.length < V) addSol(V - sol.length); while (sol.length > V) { let hi = 0; for (let i = 1; i < sol.length; i++) if (sol[i].s > sol[hi].s) hi = i; pop(sol.splice(hi, 1)[0]); } }
    // (holes left by the fallen are filled from the rim, so the crowd closes its ranks)
    function compact() { if (!sol.length) return; const used = new Set(sol.map(q => q.s)); let f = 0; for (let k = 0; k < 6; k++) { while (used.has(f)) f++; let hi = sol[0]; for (const q of sol) if (q.s > hi.s) hi = q; if (hi.s < f) break; used.delete(hi.s); hi.s = f; used.add(f); } }
    function float(key, x, y, v, col) { const f = floats[key] || (floats[key] = { x, y, v: 0, t: 0.28, col }); f.v += v; f.x = x; f.y = y; }
    function afterLoss() { if (S.n <= 0 && !S.alone) { S.n = 0; S.alone = true; X.banner('MARCHING ALONE', 'Every seedling is lost · three hearts · a green gate regrows your army', BAD, 2.6, true); X.sfx.wrong(); } }
    // seedlings at places that match pred are crushed (each stands for more than one when the army is bigger than the crowd drawn)
    function crush(pred, col, key, most) { if (!S.n || !sol.length || most <= 0) return 0; let hit = sol.filter(q => { const [x, y] = wpos(q); return pred(x, y); }); if (!hit.length) return 0; const per = S.n / sol.length; if (most != null && hit.length * per > most) hit = hit.slice(0, Math.max(1, Math.floor(most / per))); const lost = Math.min(S.n, most != null ? most : 1e9, Math.max(hit.length, Math.round(hit.length * per)));
      for (const q of hit) { pop(q, col); sol.splice(sol.indexOf(q), 1); } S.n -= lost; S.pulse = Math.max(S.pulse || 0, 0.6); S.pulseC = BAD; const [px, py] = wpos(hit[0]); float(key, px, py - 1, -lost, BAD); afterLoss(); return lost; }
    // n lost from the front of the army, leaping at (tx, ty)
    function loseFront(k, tx, ty) { S.n = Math.max(0, S.n - k); const drop = sol.length - Math.min(S.n, M_CAP); if (drop > 0) { const front = sol.slice().sort((a, b) => wpos(a)[1] - wpos(b)[1]).slice(0, drop); for (const q of front) { const [x, y] = wpos(q); if (jumps.length < 40) jumps.push({ x, y, tx: tx + (Math.random() - 0.5) * 1.6, ty: ty + (Math.random() - 0.5) * 0.4, t: 0, ph: q.ph }); sol.splice(sol.indexOf(q), 1); } } afterLoss(); }
    function grow(k, fx, fy) { const was = S.n; S.n += k; if (S.n > 0 && S.alone) { S.alone = false; X.text(me.x, me.y - 2.2, 'Your seedlings regrow!', MINT, 15); } addSol(Math.min(S.n, M_CAP) - sol.length, fx, fy); S.best = Math.max(S.best, S.n); return S.n - was; }
    function loseHeart(why) { if (S.inv > 0 || S.mode !== 'run') return false; S.hearts--; S.inv = 1.4; X.shake(10, 0.3); X.flash(0.3, BAD); X.sfx.crash(); X.text(me.x, me.y - 1.8, why, BAD, 16); X.sparks(me.x, me.y - 0.4, BAD, 16, 6);
      if (S.hearts <= 0) { S.mode = 'lost'; S.clash = null; X.banner('THE MARCH FALTERS', 'Back to the last bloom post · your seedlings regrow', BAD, 2.2, true); X.sfx.wrong(); X.after(1.6, restart); } return true; }
    /* ---- the things on the lane, each drawn as an object so it stands in depth among the seedlings ---- */
    function objOf(e) { e.o = H.obj({ x: e.x == null ? LXM : e.x, y: e.y, kind: 'march', r: 0, label: '', draw: (c, Xs, Ys, T) => DRAW[e.k](c, e, Xs, Ys, T) }); }
    function unobj(e) { if (!e.o) return; const i = self.objs.indexOf(e.o); if (i >= 0) self.objs.splice(i, 1); e.o = null; }
    function remove(e) { e.gone = true; unobj(e); if (S.clash === e) S.clash = null; }
    function spawn(it, y) { const e = Object.assign({ id: ++uid, t: 0, hitT: 0 }, JSON.parse(JSON.stringify(it)), { y: y != null ? y : Y0 - it.d }); if (e.k === 'crowd') { e.n0 = e.n; e.hp = e.n * TOUGH; } if (e.k === 'block') e.hp0 = e.hp; if (e.k === 'boulder') { e.hp0 = e.hp = e.hp || 6; e.rot = 0; e.r = 0.62; e.on = false; } if (e.k === 'hedge') e.x = (e.x0 + e.x1) / 2; E.push(e); objOf(e); return e; }
    const crowdR = e => 0.26 * Math.sqrt(Math.max(1, Math.min(e.n, 80))) + 0.34;
    function clearLane() { for (const e of E) unobj(e); E = []; B = null; bolts.length = 0; jumps.length = 0; flyers.length = 0; rings.length = 0; S.clash = null; }
    function place(d) { S.d = d; S.y = Y0 - d; me.y = S.y; S.next = M_COURSE.findIndex(it => it.d > d); if (S.next < 0) S.next = M_COURSE.length; }
    function restart() { clearLane(); const cp = S.cp; place(cp.d); me.x = LXM; S.ax = LXM; S.n = cp.n; S.bow = cp.bow; S.spread = cp.spread; S.hearts = 3; S.inv = 1.2; S.alone = false; S.phase = 'course'; S.tread = 0; sol.length = 0; sync(); for (const q of sol) q.k = 0;
      S.restarts++; S.mode = 'ready'; S.wait = 1.5; X.flash(0.4, MINT); X.banner('THE MARCH BEGINS AGAIN', `From the bloom post · ${S.n} seedlings`, MINT, 1.8, true); X.sfx.chime(); }
    function apply(e, side) { const [op, v] = e[side], was = S.n, now = OPS[op](S.n, v), px = side === 'L' ? (LX0 + LXM) / 2 : (LXM + LX1) / 2; e.pick = side; e.pt = 0; S.gates++;
      if (now > was) { grow(now - was, px, e.y); S.pulse = 1; S.pulseC = MINT; X.text(px, e.y - 0.9, `${GLYPH[op]}${v}`, MINT, 26); X.sparks(px, e.y - 0.8, MINT, 18, 6); X.ring(px, e.y - 0.3, 0.3, 2.4, 0.4, MINT, 0.3); X.sfx.coin(); X.sfx.chime(); }
      else if (now < was) { S.n = now; const drop = sol.length - Math.min(now, M_CAP); for (let i = 0; i < drop; i++) { const q = sol.splice(Math.floor(Math.random() * sol.length), 1)[0]; pop(q, BAD); } S.pulse = 1; S.pulseC = BAD; X.text(px, e.y - 0.9, `${GLYPH[op]}${v}`, BAD, 26); X.sparks(px, e.y - 0.8, BAD, 14, 5); X.shake(5, 0.2); X.sfx.wrong(); afterLoss(); }
      else X.text(px, e.y - 0.9, `${GLYPH[op]}${v}`, '#FFFFFF', 18); }
    function breakBlock(e, gift) { e.dead = true; X.boom(e.x, e.y - 0.5, 1.5, '#A79BC4', '#FFFFFF', { n: 18, shake: 8 }); for (let i = 0; i < 12; i++) { const a = -Math.random() * Math.PI; X.part({ kind: 'confetti', x: e.x + (Math.random() - 0.5) * 1.6, y: e.y - 0.6, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5, g: 12, life: 0.8, max: 0.8, size: 5 + Math.random() * 3, rot: Math.random() * 6, vr: 9, color: Math.random() < 0.5 ? '#7E739A' : JADE }); } X.sfx.crack();
      if (gift) { flyers.push({ kind: e.gift, x: e.x, y: e.y - 1.6, t: 0 }); X.sfx.sparkle(); } remove(e); }
    function grant(kind) { const G = GIFTS[kind]; S.blocks++; if (kind === 'bow') S.bow = true; else if (kind === 'spread') S.spread = true; else { grow(25, me.x, me.y - 1); X.text(me.x, me.y - 2.2, '+25', MINT, 22); }
      S.tip = null; X.banner(G.name + '!', G.sub, G.col, 1.7, true); X.flash(0.25, G.col); X.ring(me.x, me.y, 0.3, 3, 0.5, G.col, 0.3); X.sfx.fanfare(); }
    function killCrowd(e, how) { X.boom(e.x, e.y, 1.0 + crowdR(e), '#B98BE0', CREAM, { n: 18, shake: 7 }); for (let i = 0; i < 14; i++) { const a = Math.random() * TAU; X.part({ kind: 'confetti', x: e.x, y: e.y, vx: Math.cos(a) * 6, vy: Math.sin(a) * 6 - 2, g: 9, life: 0.8, max: 0.8, size: 4, rot: a, vr: 9, color: Math.random() < 0.5 ? '#7A4C9E' : CREAM }); } X.text(e.x, e.y - 1.4, how, MINT, 18); X.sfx.crash(); S.crowds++; remove(e); }
    function startBoss() { S.phase = 'boss'; B = spawn({ k: 'boss', x: LXM }, S.y - 15); Object.assign(B, { gap: 13, want: 7, hp: BOSS_HP, hp0: BOSS_HP, atkT: 3.4, act: null, acts: 0, lift: 0, sq: 0, contact: false, hackT: 0, recruitT: 5.5, enter: true });
      X.banner('THE MILKCAP COLOSSUS', 'Shoot its number down · keep out of the rose rings', BAD, 3.2, true, true); X.shake(10, 0.9); X.sfx.hum(); }
    function bossDown() { const e = B; e.dead = true; e.fallT = 0; S.phase = 'exit'; self.done = true; S.exitY = S.y - 7; H.setExit(LXM, S.exitY, 'The Garden\'s heart'); rings.length = 0;
      for (const q of E) if (q.k === 'crowd' && !q.gone) killCrowd(q, ''); X.flash(0.8, '#FFFFFF'); X.sfx.fanfare(); X.banner('THE COLOSSUS FALLS', 'The Garden\'s heart is open · march on', MINT, 3, true, true);
      for (let i = 0; i < 8; i++) X.after(i * 0.14, () => X.boom(e.x + (Math.random() - 0.5) * 3.5, e.y - 1 - Math.random() * 2.5, 1.6, i % 2 ? CREAM : ROSE, '#FFFFFF', { n: 20, shake: 12 }));
      for (let i = 0; i < 40; i++) { const a = Math.random() * TAU; X.part({ kind: 'confetti', x: e.x, y: e.y - 2, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8 - 4, g: 9, life: 1.4, max: 1.4, size: 5, rot: a, vr: 9, color: [MINT, GOLD, '#F7B8D8', CREAM][i % 4] }); }
      X.after(1.3, () => remove(e)); }
    // the Colossus: roots burst under a ring round the army, spores rain on three more, and thornling squads run at you
    function bossAct(e) { const acts = e.contact ? ['roots', 'spores'] : ['roots', 'spores', 'squad', 'roots', 'squad', 'spores'], a = acts[e.acts++ % acts.length], tx = S.n ? S.cx : me.x, ty = S.n ? S.cy : me.y, hard = e.hp < e.hp0 * 0.5;
      if (a === 'roots') { rings.push({ kind: 'roots', x: Math.max(LX0 + 1.6, Math.min(LX1 - 1.6, tx)), y: ty, r: 1.75, t: 0, warn: hard ? 0.95 : 1.15 }); e.lift = 1; X.sfx.grumble && X.sfx.grumble(); }
      else if (a === 'spores') { for (let i = 0; i < (hard ? 4 : 3); i++) rings.push({ kind: 'spore', x: LX0 + 1 + Math.random() * (LX1 - LX0 - 2), y: ty + (Math.random() - 0.5) * 2, r: 1.05, t: -i * 0.18, warn: 1.3, fx: e.x + (i - 1) * 0.8, fy: e.y - 3.2 }); X.sfx.whoosh(); }
      else { const sq = spawn({ k: 'crowd', x: Math.max(LX0 + 1.5, Math.min(LX1 - 1.5, e.x + (Math.random() - 0.5) * 3)), n: 8 + Math.round((1 - e.hp / e.hp0) * 16) }, e.y + 1.6); sq.squad = true; X.text(sq.x, sq.y - 1.4, 'A thornling squad!', BAD, 14); X.sfx.stomp(); }
      e.atkT = hard ? 2.2 : 2.8; }
    function fire(x, y, dmg, pet, base) { const fan = S.spread ? [-0.17, 0, 0.17] : [0]; for (const a of fan) { if (bolts.length > 280) bolts.shift(); bolts.push({ x, y, vx: Math.sin(a) * 16, vy: -Math.cos(a) * 16, dmg, base: base == null ? dmg : base, life: 0.6, bow: S.bow, pet }); } }
    // what a bolt at (x, y) strikes
    function hitTest(x, y) { for (const e of E) { if (e.gone || e.dead) continue;
        if (e.k === 'block' && Math.abs(x - e.x) < 1.0 && y < e.y + 0.1 && y > e.y - 1.3) return e;
        if (e.k === 'crowd' && Math.hypot(x - e.x, y - e.y) < crowdR(e)) return e;
        if (e.k === 'boulder' && e.on && Math.hypot(x - e.x, y - e.y) < e.r + 0.15) return e;
        if (e.k === 'boss' && !e.enter && Math.abs(x - e.x) < 2.0 && y < e.y + 0.4 && y > e.y - 3) return e; } return null; }
    function damage(e, b) { e.hitT = 0.1;
      if (e.k === 'block') { e.hp -= b.dmg; if (Math.random() < 0.4) X.sparks(b.x, e.y - 0.3, GOLD, 3, 3); if (e.hp <= 0) breakBlock(e, true); }
      else if (e.k === 'crowd') { e.hp -= b.base != null ? b.base : b.dmg;   /* (crowds are fought number against number: the army's full volley is for blocks and the Colossus) */ e.n = Math.max(0, Math.ceil(e.hp / TOUGH)); X.sparks(b.x, b.y, '#B98BE0', 3, 3); if (S.popT < 14) { S.popT++; X.part({ kind: 'confetti', x: b.x, y: b.y, vx: (Math.random() - 0.5) * 4, vy: -3, g: 9, life: 0.5, max: 0.5, size: 3, rot: 0, vr: 9, color: '#7A4C9E' }); } if (e.n <= 0) killCrowd(e, 'SCATTERED!'); }
      else if (e.k === 'boulder') { e.hp -= b.dmg; X.sparks(b.x, b.y, '#8FB89A', 3, 3); if (e.hp <= 0) { X.boom(e.x, e.y - 0.4, 1.2, '#8FB89A', '#FFFFFF', { n: 14, shake: 5 }); for (let i = 0; i < 8; i++) { const a = Math.random() * TAU; X.part({ kind: 'confetti', x: e.x, y: e.y - 0.4, vx: Math.cos(a) * 5, vy: Math.sin(a) * 5 - 2, g: 10, life: 0.7, max: 0.7, size: 5, rot: a, vr: 8, color: Math.random() < 0.5 ? JADE : '#2F5F4E' }); } X.text(e.x, e.y - 1.2, 'SMASHED!', CREAM, 15); X.sfx.crack(); remove(e); } }
      else if (e.k === 'boss') { e.hp -= b.dmg; if (Math.random() < 0.25) X.sparks(b.x, b.y, CREAM, 3, 3); if (e.hp <= 0 && !e.dead) bossDown(); } }
    X.after(1.2, () => { X.banner('THE SEEDLING MARCH', 'Steer left and right · green gates grow your army · your seedlings shoot by themselves', MINT, 3.6, true, true); X.sfx.chirp(); S.mode = 'ready'; S.wait = 2.6; });
    sync();
    /* ---- each kind of thing on the lane, frame by frame ---- */
    const UPD = {
      gate(e, dt) { if (e.pick) { e.pt += dt; return; } if (S.y <= e.y + 0.05) { if (S.y < e.y - 1.6) { e.pick = 'none'; e.pt = 9; return; } apply(e, me.x < LXM ? 'L' : 'R'); } },
      block(e) { if (e.dead) return; if (e.y >= S.y - 0.35 && e.y < S.y + 1.2) { const lost = crush((x) => Math.abs(x - e.x) < 0.95, BAD, e.id, Math.ceil(S.n * 0.5)), bonk = !S.n && Math.abs(me.x - e.x) < 1.25; if (bonk) loseHeart('Bonk!'); if (lost || bonk) { X.text(e.x, e.y - 1.8, 'It crushes them!', BAD, 14); breakBlock(e, false); } } },
      crowd(e, dt) { if (e.dead || S.clash === e) return; const ahead = S.y - e.y, rc = crowdR(e);
        if (ahead < 13) { const want = Math.max(LX0 + rc, Math.min(LX1 - rc, S.cx)); e.x += Math.max(-1, Math.min(1, want - e.x)) * 1.1 * dt; e.y += (e.squad ? 1.6 : 0.9) * dt; }
        if (e.y + rc * 0.8 >= S.y - 0.55 && e.y < S.y + 1) { const meets = Math.abs(e.x - S.cx) < rc + S.R * 0.85 || Math.abs(e.x - me.x) < rc + 0.4; if (!meets) return;
          if (S.n > 0 && S.mode === 'run') { S.clash = e; S.clashT = 0; e.clashN = e.n; e.armyN = S.n; S.clashes++; X.sfx.stomp(); X.shake(7, 0.3); X.flash(0.15, '#FFFFFF'); }
          else if (S.mode === 'run') { loseHeart('Overrun!'); killCrowd(e, ''); } } },
      boulder(e, dt) { if (!e.on) { if (S.y - e.y < 15) { e.on = true; X.text(e.x, e.y - 1.3, 'BOULDER!', CREAM, 15); X.sfx.hollow && X.sfx.hollow(); } return; }
        e.y += 2.8 * dt; e.rot += 2.8 * dt / e.r; if (Math.random() < dt * 8) X.part({ kind: 'smoke', x: e.x + (Math.random() - 0.5) * 0.8, y: e.y - 0.6, vx: 0, vy: -0.6, life: 0.5, max: 0.5, size: 0.3, color: 'rgba(143,184,154,' });
        if (e.left == null && S.n && Math.abs(e.x - S.cx) < S.R + e.r && e.y > S.y - 0.5) e.left = Math.max(5, Math.ceil(S.n * 0.25));
        if (e.left != null) { e.left -= crush((x, y) => Math.hypot(x - e.x, y - e.y) < e.r + 0.2, '#8FB89A', e.id, e.left); if (e.left <= 0 && !e.gone) { X.boom(e.x, e.y - 0.4, 1.2, '#8FB89A', '#FFFFFF', { n: 14, shake: 6 }); X.text(e.x, e.y - 1.3, 'Stopped!', MINT, 15); X.sfx.crack(); remove(e); return; } }
        if (!S.n && !e.hitPet && Math.hypot(me.x - e.x, me.y - e.y) < e.r + 0.35) { e.hitPet = true; loseHeart('Bowled over!'); } },
      hedge(e) { crush((x, y) => x > e.x0 && x < e.x1 && Math.abs(y - e.y) < 0.45, ROSE, e.id); if (!S.n && !e.hitPet && me.x > e.x0 - 0.2 && me.x < e.x1 + 0.2 && Math.abs(me.y - e.y) < 0.5) { e.hitPet = true; loseHeart('Thorns!'); } },
      cp(e) { if (e.done || S.y > e.y) return; e.done = true; S.cp = { d: e.d, n: Math.max(S.n, 12), bow: S.bow, spread: S.spread }; S.hearts = 3; S.tip = { a: 'BLOOM POST · CHECKPOINT', b: 'If the march falters, it begins again here', col: MINT, t: 0 }; X.sfx.chime(); X.ring(LXM, e.y, 0.3, 4, 0.6, MINT, 0.3); },
      boss(e, dt) { if (e.dead) { e.fallT += dt; return; }
        if (e.enter) { e.gap += (e.want - e.gap) * Math.min(1, dt * 1.2); if (Math.random() < dt * 3) X.shake(4, 0.15); if (e.gap < e.want + 0.4) { e.enter = false; X.sfx.stomp(); X.shake(9, 0.4); } }
        else { e.want = S.n > 0 ? Math.max(B_CONTACT, e.want - 0.42 * dt) : Math.min(7, e.want + 3 * dt); e.gap += (e.want - e.gap) * Math.min(1, dt * 1.6); }
        e.y = S.y - e.gap; e.x += (LXM + Math.sin(e.t * 0.6) * 1.0 - e.x) * Math.min(1, dt * 2); e.lift = Math.max(0, e.lift - dt * 1.1); e.sq = Math.max(0, e.sq - dt * 3);
        e.contact = !e.enter && S.n > 0 && e.gap <= B_CONTACT + 0.2;
        if (e.contact && S.mode === 'run') { e.hackT -= dt; while (e.hackT <= 0 && S.n > 0 && e.hp > 0) { e.hackT += 0.07; const k = Math.max(1, Math.ceil(S.n / 30)); loseFront(k, e.x, e.y - 0.2); e.hp -= k * 12; float('boss', e.x + (Math.random() - 0.5) * 2, e.y - 3.6, -k * 12, GOLD); X.sparks(e.x + (Math.random() - 0.5) * 2.4, e.y - 0.4, CREAM, 4, 4); if (Math.random() < 0.3) X.sfx.pop(); } if (e.hp <= 0) { bossDown(); return; } }
        if (!e.enter && S.mode === 'run') { e.atkT -= dt; if (e.atkT <= 0) bossAct(e); e.recruitT -= dt; if (e.recruitT <= 0 && e.gap > 5.2) { e.recruitT = S.n < 15 ? 3.6 : 6; const gq = spawn({ k: 'gate', L: S.n ? (Math.random() < 0.5 ? ['x', 2] : ['-', 10]) : ['+', 15], R: S.n ? ['+', 12] : ['+', 6] }, e.y + 1.4); if (Math.random() < 0.5) { const t2 = gq.L; gq.L = gq.R; gq.R = t2; } } } },
    };
    /* the SUPER SHOT: the march's one button. A great glowing seed comet flies up the lane, piercing everything it
       passes once; its blow grows with the army (60 + 4 a seedling); then an 8 s cooldown */
    const SUPER_CD = 8, supers = [];
    function superShot() { if (S.mode !== 'run' || S.phase === 'exit' || (S.superCd || 0) > 0) return false; S.superCd = SUPER_CD;
      supers.push({ x: me.x, y: me.y - 0.6, t: 0, hit: new Set(), dmg: 60 + 4 * S.n }); X.shake(5, 0.15); X.flash && X.flash(0.08, MINT); X.sfx.whoosh && X.sfx.whoosh(); X.ring(me.x, me.y, 0.3, 1.6, 0.3, MINT, 0.5); return true; }
    const mod = { S, sol, bolts, rings,
      hud() { return S.mode === 'run' || S.mode === 'ready' ? { label: 'SUPER SHOT', cd: Math.max(0, S.superCd || 0), max: SUPER_CD, col: MINT } : null; },
      act: superShot, get E() { return E; }, get B() { return B; }, course: M_COURSE, Y0, loseHeart, restart, sync,
      // (for the tests: put the army at a distance up the lane, the course behind it cleared)
      warp(d) { clearLane(); place(d); S.phase = 'course'; S.mode = 'run'; S.tread = 0; },
      setN(n) { S.n = n; S.alone = n <= 0; sync(); },
      cam() { return { x: LXM, y: S.y - (S.phase === 'boss' || S.phase === 'exit' ? 0.24 : 0.15) * X.H() / Math.max(10, X.Tz()), k: 1, zoom: 0.78 }; },   // (the camera looks well ahead: the army sits low, over the empty footer, the lane and the Colossus above)
      hint() { return null; },
      update(dt) { S.t += dt; if (S.inv > 0) S.inv -= dt; if (S.pulse > 0) S.pulse = Math.max(0, S.pulse - dt * 3); S.popT = Math.max(0, S.popT - dt * 60);
        for (const k in floats) { const f = floats[k]; f.t -= dt; if (f.t <= 0) { X.text(f.x, f.y, `${f.v > 0 ? '+' : '−'}${Math.abs(Math.round(f.v))}`, f.col, 18); delete floats[k]; } }
        // the pet steers (the engine moves it from the stick after this; a little more is added here so the lane feels quick)
        if (S.mode === 'run' && S.phase !== 'exit' && !me.dodge) me.x += (me.vx || 0) * dt * 0.55;
        if (S.phase === 'exit') me.x += (LXM - me.x) * Math.min(1, dt * 3);
        me.x = Math.max(LX0 + 0.4, Math.min(LX1 - 0.4, me.x));
        // the formation
        S.R = M_SP * Math.sqrt(Math.max(1, sol.length)) + 0.2; S.ax += (Math.max(LX0 + S.R * 0.95, Math.min(LX1 - S.R * 0.95, me.x)) - S.ax) * Math.min(1, dt * 10); S.cx = S.ax; S.cy = S.y + 0.45 + (S.R - 0.2) * 0.72;
        for (const q of sol) { const [tx, ty] = slotXY(q.s); q.ox += (tx - q.ox) * Math.min(1, dt * 7); q.oy += (ty - q.oy) * Math.min(1, dt * 7); q.k = Math.min(1, q.k + dt * 3.5); q.ph += dt * 1.8; }
        S.compT -= dt; if (S.compT <= 0) { S.compT = 0.3; compact(); }
        for (let i = jumps.length - 1; i >= 0; i--) { const j = jumps[i]; j.t += dt; if (j.t >= 0.24) { X.sparks(j.tx, j.ty - 0.2, MINT, 3, 4); if (S.popT < 14) { S.popT++; X.sparks(j.tx, j.ty - 0.2, '#B98BE0', 3, 4); } jumps.splice(i, 1); } }
        for (let i = flyers.length - 1; i >= 0; i--) { const f = flyers[i]; f.t += dt; if (f.t >= 0.6) { flyers.splice(i, 1); grant(f.kind); } }
        order = sol.map(q => [wpos(q), q]).sort((a, b) => a[0][1] - b[0][1]); armyTick();
        if (S.mode === 'intro' || S.mode === 'lost') { me.y = S.y; return; }
        if (S.mode === 'ready') { S.wait -= dt; me.y = S.y; if (S.wait <= 0) { S.mode = 'run'; S.goT = 0; X.sfx.whoosh(); } return; }
        // the march: up the lane; still while crowds clash; on the spot (the moss running under it) while the Colossus backs away
        const halt = !!S.clash || (B && B.contact && !B.dead);
        let adv = S.phase === 'course' && !halt ? M_SPD : 0; const tread = S.phase === 'boss' && !halt ? M_TREAD : 0;
        if (S.phase === 'exit') adv = S.y > S.exitY + 0.05 ? M_SPD * 0.8 : 0;
        S.y -= adv * dt; S.d += adv * dt; S.tread += tread * dt; S.scroll += (adv + tread) * dt; me.y = S.y; me.vy = 0;
        if (adv + tread > 0) { me.wph = (me.wph || 0) + dt * 7; me.bob += dt * 10; }
        for (const e of E) if (e.k !== 'boss') e.y += tread * dt;
        // what comes into view
        while (S.phase === 'course' && S.next < M_COURSE.length && M_COURSE[S.next].d - S.d < 21) { const it = M_COURSE[S.next]; if (it.k === 'boss') { if (S.d >= it.d) { S.next++; startBoss(); } break; } const e = spawn(it); S.next++; if (it.tip) e.tip = it.tip; }
        for (const e of E) if (e.tip && !e.tipped && S.y - e.y < 10) { e.tipped = true; S.tip = { a: e.tip[0], b: e.tip[1], col: e.k === 'crowd' ? BAD : e.k === 'block' ? GOLD : MINT, t: 0 }; X.sfx.chirp(); }
        if (S.tip) { S.tip.t += dt; if (S.tip.t > 3) S.tip = null; }
        for (const e of E) { if (e.gone) continue; e.t += dt; if (e.hitT > 0) e.hitT -= dt; UPD[e.k](e, dt); if (!e.gone && e.k !== 'boss' && e.y > S.y + 9) remove(e); if (e.o) { e.o.x = e.x == null ? LXM : e.x; e.o.y = e.k === 'hedge' ? e.y + 0.45 : e.y; } }
        E = E.filter(e => !e.gone);
        // the clash: number against number
        if (S.clash && S.mode === 'run') { const c0 = S.clash, cx = (c0.x + S.cx) / 2, cy = S.y - 0.7; S.clashT -= dt;
          while (S.clashT <= 0 && c0.n > 0 && S.n > 0) { S.clashT += 0.05; const k = Math.min(Math.max(1, Math.ceil(Math.min(S.n, c0.n) / 22)), S.n, c0.n); c0.n -= k; c0.hp = c0.n * TOUGH; loseFront(k, cx, cy); X.sparks(cx + (Math.random() - 0.5) * 2, cy - 0.2, Math.random() < 0.5 ? '#B98BE0' : MINT, 4, 5); if (Math.random() < 0.35) X.sfx.pop(); }
          if (c0.n <= 0) { S.clash = null; killCrowd(c0, 'CRUSHED!'); } else if (S.n <= 0) { S.clash = null; loseHeart('Overrun!'); killCrowd(c0, ''); } }
        // the volleys: more seedlings, more bolts
        if (S.mode === 'run' && S.phase !== 'exit') { const iv = S.bow ? 0.28 : 0.4, dk = S.bow ? 2 : 1, sh = S.n ? Math.min(16, 2 + Math.floor(Math.sqrt(S.n) * 1.1)) : 0;
          S.fireAcc = (S.fireAcc || 0) + dt * sh / iv; const per = 0.5 * dk * Math.max(1, S.n / Math.max(1, sh));   /* (the army's whole volley: every seedling's 0.5, the drawn bolts capped and each carrying its share) */ while (S.fireAcc >= 1 && sol.length) { S.fireAcc -= 1; const [x, y] = wpos(sol[Math.floor(Math.random() * sol.length)]); fire(x, y - 0.4, per, false, 0.5 * dk); }
          S.fireT -= dt; if (S.fireT <= 0) { S.fireT = iv; S.vol++; fire(me.x, me.y - 0.8, (S.n ? 1.5 : 5) * dk, true); if (S.vol % 3 === 0) X.sfx.blip && X.sfx.blip(); } }
        for (const b of bolts) { if (b.life <= 0) continue; b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.x < LX0 || b.x > LX1) b.life = 0; if (b.life <= 0) continue; const e = hitTest(b.x, b.y); if (e) { damage(e, b); b.life = 0; } }
        for (let i = bolts.length - 1; i >= 0; i--) if (bolts[i].life <= 0) bolts.splice(i, 1);
        if (S.superCd > 0) S.superCd = Math.max(0, S.superCd - dt);
        for (let i = supers.length - 1; i >= 0; i--) { const q = supers[i]; q.t += dt; q.y -= 13 * dt; q.x += (me.x - q.x) * 0; if (Math.random() < 0.9) X.part({ kind: 'ember', x: q.x + (Math.random() - 0.5) * 0.6, y: q.y + 0.3, vx: (Math.random() - 0.5) * 2, vy: 2, g: 0, life: 0.5, max: 0.5, size: 4, color: Math.random() < 0.5 ? MINT : GOLD });
          for (const e of E) { if (e.gone || e.dead || q.hit.has(e)) continue; const near = e.k === 'boss' ? (!e.enter && Math.abs(q.x - e.x) < 2.2 && q.y < e.y + 0.6 && q.y > e.y - 3) : Math.abs(q.x - e.x) < 1.6 && Math.abs(q.y - e.y) < 1.2; if (near) { q.hit.add(e); damage(e, { x: q.x, y: q.y, dmg: q.dmg, bow: true }); X.ring(q.x, q.y, 0.2, 1.4, 0.3, GOLD, 0.5); X.sparks(q.x, q.y, GOLD, 10, 6); X.shake(4, 0.1); } }
          if (q.t > 2.2) supers.splice(i, 1); }
        // the pet's own taps and powers strike too
        for (const b of (X.shots || [])) { if (b.life <= 0 || b.own === 'enemy') continue; const e = hitTest(b.x, b.y); if (e) { damage(e, { x: b.x, y: b.y, dmg: 3, bow: false }); b.life = 0; } }
        // the Colossus's rings: a warning, then roots burst or a spore lands
        for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t >= r.warn && !r.hit) { r.hit = true; const inR = (x, y) => Math.hypot(x - r.x, y - r.y) < r.r;
            crush(inR, r.kind === 'roots' ? ROSE : GOLD, 'ring' + i); if (!S.n && inR(me.x, me.y)) loseHeart(r.kind === 'roots' ? 'Roots!' : 'Spored!');
            if (r.kind === 'roots') { X.shake(11, 0.3); X.sfx.stomp(); if (B) B.sq = 1; X.boom(r.x, r.y, r.r, ROSE, CREAM, { n: 16, shake: 9 }); } else { X.boom(r.x, r.y, r.r, GOLD, CREAM, { n: 12, shake: 5 }); X.sfx.splash(); } }
          if (r.t > r.warn + 0.5) rings.splice(i, 1); } },
      goal() { if (self.done) return 'The Colossus falls · march into the Garden\'s heart'; if (S.mode === 'intro') return 'The Seedling March';
        const hearts = '♥'.repeat(Math.max(0, S.hearts)) + '♡'.repeat(Math.max(0, 3 - S.hearts)), kit = (S.bow ? ' · crossbow' : '') + (S.spread ? ' · spread' : '');
        if (S.phase === 'boss' && B) return `Milkcap Colossus ${Math.max(0, Math.ceil(B.hp))} · seedlings ${S.n}${S.n ? '' : ' ' + hearts}`;
        return S.n ? `Seedlings ${S.n}${kit} · steer for the green gates` : `Marching alone ${hearts} · find a green gate`; },
      drawGround(c) { paintLane(c); const T = X.Tz(), t = S.t; if (self.done && S.exitY != null) riftGate(c, X.sx(LXM), X.sy(S.exitY), T, true, t, 'The Garden\'s heart');
        // the rings where roots will burst or spores land
        for (const r of rings) { if (r.t < 0) continue; const Xs = X.sx(r.x), Ys = X.sy(r.y), R = r.r * T, u = Math.min(1, r.t / r.warn), col = r.kind === 'roots' ? BAD : GOLD;
          if (!r.hit) { c.save(); c.globalAlpha = 0.16 + 0.22 * u; c.fillStyle = col; c.beginPath(); c.arc(Xs, Ys, R * u, 0, TAU); c.fill(); c.globalAlpha = 0.75 + 0.25 * Math.sin(t * 22); c.strokeStyle = col; c.lineWidth = 3; c.setLineDash([9, 7]); c.lineDashOffset = -t * 30; c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.stroke(); c.restore(); label(c, '!', Xs, Ys + T * 0.15, T * 0.55, col); }
          else if (r.kind === 'roots') { const k = Math.sin(Math.min(1, (r.t - r.warn) / 0.5) * Math.PI); for (let j = 0; j < 9; j++) { const a = j * 2.4 + r.x, d = R * 0.75 * Math.sqrt((j + 0.5) / 9), px = Xs + Math.cos(a) * d, py = Ys + Math.sin(a) * d * 0.8, hh = T * (0.7 + (j % 3) * 0.25) * k; c.fillStyle = '#5A3570'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px - T * 0.14, py); c.quadraticCurveTo(px - T * 0.05, py - hh * 0.5, px + T * 0.02, py - hh); c.lineTo(px + T * 0.14, py); c.closePath(); c.fill(); c.stroke(); c.fillStyle = CREAM; c.beginPath(); c.arc(px + T * 0.02, py - hh, T * 0.04, 0, TAU); c.fill(); } } }
        // the bolts
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        for (const q of supers) { const Xs = X.sx(q.x), Ys = X.sy(q.y) - T * 0.4, r = T * 0.55; c.globalAlpha = 1; blitSized(c, glowSprite(MINT), Xs - r * 3, Ys - r * 3, r * 6, r * 6); c.strokeStyle = 'rgba(120,255,200,.55)'; c.lineWidth = r * 1.2; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs, Ys + T * 2.2); c.stroke(); c.strokeStyle = 'rgba(255,240,170,.8)'; c.lineWidth = r * 0.5; c.stroke(); c.fillStyle = '#FFFBEA'; c.beginPath(); c.arc(Xs, Ys, r * 0.55, 0, 6.283); c.fill(); }
        for (const b of bolts) { const Xs = X.sx(b.x), Ys = X.sy(b.y) - T * 0.35, l = T * (b.pet ? 0.7 : b.bow ? 0.5 : 0.36), w = b.pet ? 1.5 : 1; c.strokeStyle = b.bow ? 'rgba(255,190,70,.6)' : 'rgba(80,235,175,.55)'; c.lineWidth = T * 0.15 * w; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs - b.vx / 16 * l, Ys - b.vy / 16 * l); c.stroke(); c.strokeStyle = b.bow ? '#FFF1C0' : '#E6FFF4'; c.lineWidth = T * 0.05 * w; c.stroke(); c.fillStyle = b.bow ? GOLD : MINT; c.beginPath(); c.arc(Xs, Ys, T * (b.bow ? 0.1 : 0.08) * w, 0, TAU); c.fill(); }
        c.restore(); },
      drawOver(c) { const T = X.Tz(), Hh = X.H(), W = X.W(), t = S.t;
        // spores in flight, arcing from the Colossus's cap
        for (const r of rings) { if (r.kind !== 'spore' || r.hit || r.t < 0) continue; const u = Math.min(1, r.t / r.warn), x = r.fx + (r.x - r.fx) * u, y = r.fy + (r.y - r.fy) * u, Xs = X.sx(x), Ys = X.sy(y) - Math.sin(u * Math.PI) * T * 3.5; if (Ys < 150) continue; glowAt(c, Xs, Ys, T * 0.7, GOLD, 0.6); c.save(); c.fillStyle = '#F7E2B0'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.arc(Xs, Ys, T * 0.26, 0, TAU); c.fill(); c.stroke(); c.fillStyle = ROSE; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(Xs + Math.cos(k * 2.1 + t * 5) * T * 0.12, Ys + Math.sin(k * 2.1 + t * 5) * T * 0.12, T * 0.06, 0, TAU); c.fill(); } c.restore(); }
        // seedlings leaping into a clash
        for (const j of jumps) { const u = j.t / 0.24, x = j.x + (j.tx - j.x) * u, y = j.y + (j.ty - j.y) * u; seedAt(c, X.sx(x), X.sy(y) - Math.sin(u * Math.PI) * T * 0.9, T, j.ph, 1 - u * 0.3); }
        // gifts flying home from a broken block
        for (const f of flyers) { const u = f.t / 0.6, x = f.x + (me.x - f.x) * u, y = f.y + (me.y - 1 - f.y) * u, Xs = X.sx(x), Ys = X.sy(y) - Math.sin(u * Math.PI) * T * 1.6; glowAt(c, Xs, Ys, T * 1.1, GIFTS[f.kind].col, 0.8); giftIcon(c, f.kind, Xs, Ys, T * (0.55 + 0.2 * Math.sin(u * Math.PI))); }
        // the army's number, big over the crowd (and the hearts, marching alone)
        // the clash: a burst of light where the two crowds meet
        if (S.clash) { const cx = X.sx((S.clash.x + S.cx) / 2), cy = X.sy(S.y - 0.75), p = 0.5 + 0.5 * Math.sin(t * 28); glowAt(c, cx, cy, T * (1.6 + p * 0.5), GOLD, 0.7); glowAt(c, cx, cy, T * 0.8, '#FFFFFF', 0.9); c.save(); c.translate(cx, cy); c.rotate(t * 3); c.strokeStyle = '#FFF6D8'; c.lineWidth = 3; c.lineCap = 'round'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r0 = T * 0.4, r1 = T * (0.9 + 0.4 * ((i + Math.floor(t * 20)) % 3) / 2); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0 * 0.6); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1 * 0.6); c.stroke(); } c.restore(); }
        S.pillK = (S.pillK || 0) + ((S.clash ? 1 : 0) - (S.pillK || 0)) * Math.min(1, 1 / 60 * 10);
        if (S.mode !== 'intro' || S.t > 0.5) { const Xs = X.sx(me.x + (S.cx - me.x) * S.pillK), Ys = (X.sy(S.y) - T * 2.05) * (1 - S.pillK) + X.sy(S.cy + (S.R - 0.2) * 0.72 + 1.05) * S.pillK;
          if (S.n > 0) { const pu = S.pulse || 0, w = pill(c, Xs, Ys, `${S.n}`, pu > 0.5 && S.pulseC === BAD ? '#FFB3C6' : pu > 0.5 ? '#D6FFF0' : MINT, INK, T * 0.72 * (1 + pu * 0.35)); let bx = Xs + w / 2 + T * 0.38; for (const k of ['bow', 'spread']) if (S[k]) { c.save(); c.fillStyle = 'rgba(43,36,51,.8)'; c.strokeStyle = GIFTS[k].col; c.lineWidth = 2; c.beginPath(); c.arc(bx, Ys, T * 0.34, 0, TAU); c.fill(); c.stroke(); c.restore(); giftIcon(c, k, bx, Ys, T * 0.3); bx += T * 0.76; } }
          else pill(c, Xs, Ys, '♥'.repeat(Math.max(0, S.hearts)) + '♡'.repeat(Math.max(0, 3 - S.hearts)), BAD, '#FFFFFF', T * 0.6); }
        if (S.inv > 0 && !S.n) { c.save(); c.globalAlpha = 0.3 + 0.3 * Math.sin(t * 24); c.strokeStyle = '#FFFFFF'; c.lineWidth = 2.5; c.beginPath(); c.arc(X.sx(me.x), X.sy(me.y) - T * 0.5, T * 0.75, 0, TAU); c.stroke(); c.restore(); }
        if (S.tip) { const a = Math.min(1, S.tip.t * 5, (3 - S.tip.t) * 3), y = 150, w = Math.min(W - 24, 360); c.save(); c.globalAlpha = a; c.translate(W / 2, y); c.scale(0.9 + 0.1 * Math.min(1, S.tip.t * 6), 0.9 + 0.1 * Math.min(1, S.tip.t * 6)); c.fillStyle = 'rgba(20,12,30,.82)'; GFX.rr(c, -w / 2, -26, w, 52, 14); c.fill(); c.strokeStyle = S.tip.col; c.lineWidth = 2.5; c.stroke(); label(c, S.tip.a, 0, -9, 17, S.tip.col); c.font = `800 12px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText(S.tip.b, 0, 13, w - 20); c.restore(); }
        if (S.goT != null && S.goT < 1.1) { S.goT += 1 / 60; const u = S.goT / 1.1, sc = u < 0.15 ? 0.5 + u / 0.15 * 0.7 : 1.2 - (u - 0.15) * 0.25; c.save(); c.globalAlpha = Math.min(1, (1 - u) * 3); c.translate(W / 2, Hh * 0.36); c.scale(sc, sc); label(c, 'MARCH!', 0, 0, 46, MINT); c.restore(); }
        if (S.mode === 'ready') { const k = 0.5 + 0.5 * Math.sin(t * 6), y = Hh * 0.69; c.save(); c.fillStyle = 'rgba(20,12,30,.6)'; GFX.rr(c, W / 2 - 150, y - 22, 300, 58, 16); c.fill(); c.restore(); label(c, '◀  STEER  ▶', W / 2 + Math.sin(t * 3) * 12, y, 22, '#FFFFFF'); c.save(); c.globalAlpha = 0.65 + 0.35 * k; label(c, 'hold the stick · the march goes by itself', W / 2, y + 23, 12, MINT); c.restore(); }
        // a red edge while the pet marches alone
        if (S.alone && S.mode === 'run') { c.save(); c.globalAlpha = 0.18 + 0.08 * Math.sin(t * 6); const gg = c.createRadialGradient(W / 2, Hh / 2, Math.min(W, Hh) * 0.35, W / 2, Hh / 2, Math.max(W, Hh) * 0.7); gg.addColorStop(0, 'rgba(255,106,142,0)'); gg.addColorStop(1, 'rgba(255,106,142,1)'); c.fillStyle = gg; c.fillRect(0, 0, W, Hh); c.restore(); } },
    };
    /* ---- drawing ---- */
    function label(c, s, x, y, size, col) { c.save(); c.font = `900 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.2); c.strokeStyle = INK; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); }
    function pill(c, x, y, s, bg, fg, size) { c.save(); c.font = `900 ${Math.round(size)}px ${arcFont}`; const w = Math.max(size * 1.6, c.measureText(s).width + size * 0.9), h = size * 1.3; c.fillStyle = 'rgba(0,0,0,.35)'; GFX.rr(c, x - w / 2 + 2, y - h / 2 + 3, w, h, h / 2); c.fill(); c.fillStyle = bg; GFX.rr(c, x - w / 2, y - h / 2, w, h, h / 2); c.fill(); c.lineWidth = 2.5; c.strokeStyle = INK; c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; GFX.rr(c, x - w / 2 + 4, y - h / 2 + 3, w - 8, h * 0.32, h * 0.16); c.fill(); c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, x, y + size * 0.05); c.restore(); return w; }
    function sprite(type, rt, ph, col, T) { const k = SK(); return [DunArt.monSprite(type, Math.round(rt * T * k), ph, col, '', false), 1 / k]; }
    function seedAt(c, Xs, Ys, T, ph, k) { const [s, k2] = sprite('seedling', 0.3, ph, '#C8EEB4', T), w = s.half * k2 * (k == null ? 1 : k); c.drawImage(s.cv, Xs - w, Ys - w, w * 2, w * 2); }
    function giftIcon(c, kind, x, y, s) { c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round';
      if (kind === 'bow') { c.strokeStyle = INK; c.lineWidth = s * 0.34; c.beginPath(); c.arc(0, s * 0.55, s * 0.85, -Math.PI * 0.85, -Math.PI * 0.15); c.stroke(); c.strokeStyle = '#B9774A'; c.lineWidth = s * 0.18; c.stroke(); c.strokeStyle = '#F7E9C8'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Math.cos(-Math.PI * 0.85) * s * 0.85, s * 0.55 + Math.sin(-Math.PI * 0.85) * s * 0.85); c.lineTo(0, s * 0.3); c.lineTo(Math.cos(-Math.PI * 0.15) * s * 0.85, s * 0.55 + Math.sin(-Math.PI * 0.15) * s * 0.85); c.stroke();
        c.fillStyle = '#8A5A3C'; c.strokeStyle = INK; c.lineWidth = 1.5; c.fillRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.95); c.strokeRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.95); c.fillStyle = GOLD; c.beginPath(); c.moveTo(0, -s * 0.85); c.lineTo(s * 0.17, -s * 0.45); c.lineTo(-s * 0.17, -s * 0.45); c.closePath(); c.fill(); c.stroke(); }
      else if (kind === 'spread') { for (const a of [-0.5, 0, 0.5]) { c.save(); c.rotate(a); c.fillStyle = '#C9A0FF'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -s * 0.95); c.lineTo(s * 0.18, s * 0.2); c.lineTo(0, s * 0.45); c.lineTo(-s * 0.18, s * 0.2); c.closePath(); c.fill(); c.stroke(); c.fillStyle = CREAM; c.beginPath(); c.moveTo(0, -s * 0.95); c.lineTo(s * 0.09, -s * 0.5); c.lineTo(-s * 0.09, -s * 0.5); c.closePath(); c.fill(); c.restore(); } }
      else { c.restore(); seedAt(c, x, y, s * 2.4, 0, 1); label(c, '+25', x + s * 0.9, y - s * 0.7, s * 0.75, MINT); return; }
      c.restore(); }
    // the void and the moss lane over it, everything scrolling as the army marches
    function paintLane(c) { const T = X.Tz(), W = X.W(), Hh = X.H(), t = S.t, par = S.scroll * T;
      c.save(); const vg = c.createLinearGradient(0, 0, 0, Hh); vg.addColorStop(0, '#0D0717'); vg.addColorStop(0.55, '#1C0F2D'); vg.addColorStop(1, '#2B1541'); c.fillStyle = vg; c.fillRect(0, 0, W, Hh);
      c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const span = Hh * 1.8, yy = ((hsh(i + 9) * span + par * 0.12) % span) - Hh * 0.4, xx = i % 2 ? W * (0.02 + hsh(i) * 0.1) : W * (0.88 + hsh(i) * 0.1); c.globalAlpha = 0.28; blitSized(c, glowSprite(i % 3 === 1 ? '#6E4FB0' : i % 3 ? '#4A8D7B' : ROSE), xx - T * 4.5, yy - T * 4.5, T * 9, T * 9); }
      for (let i = 0; i < 80; i++) { const h1 = hsh(i * 3.1), h2 = hsh(i * 7.7 + 1), h3 = hsh(i * 1.3 + 5), span = Hh * 1.2, xx = h1 * W, yy = ((h2 * span + par * (0.2 + h3 * 0.35)) % span) - Hh * 0.1, tw = 0.5 + 0.5 * Math.sin(t * (1 + h3 * 3) + i);
        c.globalAlpha = 0.3 + 0.6 * tw; c.fillStyle = h3 > 0.82 ? GOLD : h3 > 0.62 ? '#F7B8D8' : '#FFFFFF'; const s = 0.6 + h3 * 1.3; c.fillRect(xx - s, yy - s, s * 2, s * 2); if (h3 > 0.9) { c.globalAlpha = 0.5 * tw; c.fillRect(xx - s * 4, yy - 0.5, s * 8, 1); c.fillRect(xx - 0.5, yy - s * 4, 1, s * 8); } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      const Xa = X.sx(LX0), Xb = X.sx(LX1), Yt = Math.max(-20, X.sy(1)), Yb = Math.min(Hh + 20, X.sy(ML + 1)), wy = ys => S.y + (ys - X.sy(S.y)) / T;
      if (Yb > Yt) {
        // the earth under the lane's lip, falling away into the void
        for (const [x0, dir] of [[Xa, -1], [Xb, 1]]) { const gg = c.createLinearGradient(x0, 0, x0 + dir * T * 1.1, 0); gg.addColorStop(0, '#0B0612'); gg.addColorStop(1, 'rgba(11,6,18,0)'); c.fillStyle = gg; c.fillRect(Math.min(x0, x0 + dir * T * 1.1), Yt, T * 1.1, Yb - Yt); }
        const lg = c.createLinearGradient(Xa, 0, Xb, 0); lg.addColorStop(0, '#24483C'); lg.addColorStop(0.12, '#346A55'); lg.addColorStop(0.5, MOSS); lg.addColorStop(0.88, '#346A55'); lg.addColorStop(1, '#24483C'); c.fillStyle = lg; c.fillRect(Xa, Yt, Xb - Xa, Yb - Yt);
        // bands, tufts, star flowers and glowing moss (fixed to the lane, so they run past as it marches)
        const q0 = Math.floor(wy(Math.max(0, Yt)) - S.tread) - 1, q1 = Math.ceil(wy(Math.min(Hh, Yb)) - S.tread) + 1;
        for (let q = q0; q <= q1; q++) { const y = q + S.tread; if (y < 1 || y > ML + 1) continue; const Ys = X.sy(y);
          if (((q % 2) + 2) % 2 === 0) { c.fillStyle = 'rgba(255,255,255,.05)'; c.fillRect(Xa, Ys, Xb - Xa, T); }
          c.fillStyle = 'rgba(242,216,161,.16)'; c.beginPath(); c.ellipse(X.sx(LXM), Ys + T * 0.5, T * 0.09, T * 0.06, 0, 0, TAU); c.fill();
          for (let k = 0; k < 3; k++) { const h = hsh(q * 13.1 + k * 5.7), px = X.sx(LX0 + 0.35 + hsh(q * 3.3 + k * 1.9) * (LX1 - LX0 - 0.7)), py = Ys + hsh(q * 9.1 + k) * T;
            if (h < 0.34) { c.strokeStyle = '#4E8A72'; c.lineWidth = 2; c.beginPath(); for (let j = -1; j <= 1; j++) { c.moveTo(px + j * T * 0.08, py); c.lineTo(px + j * T * 0.14, py - T * 0.2); } c.stroke(); }
            else if (h < 0.46) { c.fillStyle = hsh(q + k) < 0.5 ? '#F7B8D8' : CREAM; for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; c.beginPath(); c.arc(px + Math.cos(a) * T * 0.07, py + Math.sin(a) * T * 0.07, T * 0.05, 0, TAU); c.fill(); } c.fillStyle = GOLD; c.beginPath(); c.arc(px, py, T * 0.035, 0, TAU); c.fill(); }
            else if (h < 0.56) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 3 + q); blitSized(c, glowSprite(GOLD), px - T * 0.3, py - T * 0.3, T * 0.6, T * 0.6); c.restore(); }
            else if (h < 0.7) { c.fillStyle = 'rgba(0,0,0,.13)'; c.beginPath(); c.ellipse(px, py, T * 0.3, T * 0.13, 0, 0, TAU); c.fill(); } }
          // the lip: a bright moss rim, roots curling off it into the void, and now and then a glowing bud
          for (const [x0, dir] of [[Xa, -1], [Xb, 1]]) { const hr = hsh(q * 4.7 + dir); if (hr < 0.45) { c.strokeStyle = '#1F3D35'; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, Ys + T * 0.3); c.quadraticCurveTo(x0 + dir * T * 0.35, Ys + T * 0.5, x0 + dir * T * (0.2 + hr * 0.6), Ys + T * (0.9 + hr)); c.stroke(); }
            if (hr > 0.86) { const bx = x0 - dir * T * 0.18, by = Ys + T * 0.5, col = hr > 0.93 ? ROSE : GOLD; glowAt(c, bx, by, T * 0.55, col, 0.55 + 0.2 * Math.sin(t * 4 + q)); c.fillStyle = col; c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.arc(bx, by, T * 0.1, 0, TAU); c.fill(); c.stroke(); } } }
        c.strokeStyle = '#5FA88A'; c.lineWidth = 3; c.beginPath(); c.moveTo(Xa + 1.5, Yt); c.lineTo(Xa + 1.5, Yb); c.moveTo(Xb - 1.5, Yt); c.lineTo(Xb - 1.5, Yb); c.stroke();
        if (Yb < Hh) { c.fillStyle = '#1F3D35'; c.fillRect(Xa, Yb - 3, Xb - Xa, 6); }
      }
      // the Garden's heart, far up the lane: a great blossom of light
      { const Xs = X.sx(LXM), Ys = X.sy(3.5); if (Ys > -T * 6) { glowAt(c, Xs, Ys, T * 7, ROSE, 0.5); glowAt(c, Xs, Ys, T * 3.5, GOLD, 0.6); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.1; c.fillStyle = i % 2 ? '#F7B8D8' : ROSE; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(Xs + Math.cos(a) * T * 1.4, Ys + Math.sin(a) * T * 1.0, T * 1.1, T * 0.55, a, 0, TAU); c.fill(); c.stroke(); } c.fillStyle = GOLD; c.beginPath(); c.arc(Xs, Ys, T * 0.7, 0, TAU); c.fill(); c.stroke(); } }
      c.restore(); }
    function drawArmy(c, side) { const T = X.Tz(), t = S.t, k = SK(), marching = S.mode === 'run';
      if (side < 0 && sol.length) { glowAt(c, X.sx(S.cx), X.sy(S.cy), T * (S.R + 1.2), MINT, 0.22); }
      for (const [[x, y], q] of order) { if (side < 0 ? y >= S.y : y < S.y) continue; const Xs = X.sx(x), Ys = X.sy(y), hop = marching ? Math.abs(Math.sin(t * 11 + q.ph * TAU)) * T * 0.1 : 0, sc = q.k;
        c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.2, T * 0.22 * sc, T * 0.08 * sc, 0, 0, TAU); c.fill();
        const s = DunArt.monSprite('seedling', Math.round(0.3 * T * k), q.ph, '#C8EEB4', '', false), w = s.half / k * sc; c.drawImage(s.cv, Xs - w, Ys - hop - w * 0.95, w * 2, w * 2); } }
    const armyObjs = [-1, 1].map(side => H.obj({ x: LXM, y: Y0, kind: 'march-army', r: 0, label: '', draw: c => drawArmy(c, side) }));
    const armyTick = () => { armyObjs[0].x = armyObjs[1].x = me.x; armyObjs[0].y = S.y - 0.03; armyObjs[1].y = S.y + 0.05; };
    const DRAW = {
      gate(c, e, Xs, Ys, T) { const top = Ys - T * 1.6, bot = Ys - T * 0.06;
        c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(X.sx(LX0), Ys - T * 0.08, X.sx(LX1) - X.sx(LX0), T * 0.22);
        for (const side of ['L', 'R']) { const [op, v] = e[side], good = op === '+' || op === 'x', col = good ? MINT : BAD, x0 = X.sx(side === 'L' ? LX0 + 0.14 : LXM + 0.1), x1 = X.sx(side === 'L' ? LXM - 0.1 : LX1 - 0.14), mid = (x0 + x1) / 2;
          let a = 1; if (e.pick) a = e.pick === side ? Math.max(0, 1 - e.pt / 0.45) : Math.max(0, 0.45 - e.pt * 0.8); if (a <= 0) continue;
          c.save(); c.globalAlpha = a; if (e.pick === side) { c.translate(mid, bot); c.scale(1 + e.pt * 0.6, 1 + e.pt * 0.6); c.translate(-mid, -bot); }
          const gg = c.createLinearGradient(0, top, 0, bot); gg.addColorStop(0, good ? 'rgba(80,235,175,.78)' : 'rgba(255,80,125,.78)'); gg.addColorStop(1, good ? 'rgba(80,235,175,.32)' : 'rgba(255,80,125,.32)'); c.fillStyle = gg; c.fillRect(x0, top, x1 - x0, bot - top);
          c.save(); c.beginPath(); c.rect(x0, top, x1 - x0, bot - top); c.clip(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.16)'; const sh = ((S.t * 0.6 + e.id * 0.3) % 1.6 - 0.3) * (x1 - x0); c.beginPath(); c.moveTo(x0 + sh, bot); c.lineTo(x0 + sh + T * 0.5, bot); c.lineTo(x0 + sh + T * 1.3, top); c.lineTo(x0 + sh + T * 0.8, top); c.closePath(); c.fill(); c.restore();
          c.strokeStyle = INK; c.lineWidth = 5; c.strokeRect(x0, top, x1 - x0, bot - top); c.strokeStyle = col; c.lineWidth = 3; c.strokeRect(x0, top, x1 - x0, bot - top);
          c.fillStyle = col; c.fillRect(x0, top - T * 0.12, x1 - x0, T * 0.16); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0, top - T * 0.12, x1 - x0, T * 0.16);
          label(c, `${GLYPH[op]}${v}`, mid, (top + bot) / 2, T * 0.92, '#FFFFFF');
          c.restore(); }
        // vine posts at the edges and the middle, a glowing bud on each
        for (const px of [LX0 + 0.1, LXM, LX1 - 0.1]) { const Xp = X.sx(px), col = px === LXM ? CREAM : (px < LXM ? (e.L[0] === '+' || e.L[0] === 'x' ? MINT : BAD) : (e.R[0] === '+' || e.R[0] === 'x' ? MINT : BAD)); c.strokeStyle = INK; c.lineWidth = T * 0.24; c.lineCap = 'round'; c.beginPath(); c.moveTo(Xp, Ys); c.lineTo(Xp, top - T * 0.2); c.stroke(); c.strokeStyle = '#3E7A5E'; c.lineWidth = T * 0.14; c.stroke();
          c.fillStyle = '#5CC47A'; c.strokeStyle = INK; c.lineWidth = 1.3; for (const [dy, sd] of [[0.35, 1], [0.8, -1], [1.2, 1]]) { c.beginPath(); c.ellipse(Xp + sd * T * 0.16, Ys - T * dy, T * 0.15, T * 0.08, sd * 0.5, 0, TAU); c.fill(); c.stroke(); }
          glowAt(c, Xp, top - T * 0.3, T * 0.6, col, 0.6); c.fillStyle = col; c.beginPath(); c.arc(Xp, top - T * 0.3, T * 0.14, 0, TAU); c.fill(); c.lineWidth = 1.5; c.stroke(); } },
      block(c, e, Xs, Ys, T) { const w = T * 1.9, h = T * 1.05, dep = T * 0.5, x0 = Xs - w / 2, jig = e.hitT > 0 ? (Math.random() - 0.5) * 3 : 0, k = Math.max(0, e.hp / e.hp0);
        c.save(); c.translate(jig, 0); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.05, w * 0.6, T * 0.2, 0, 0, TAU); c.fill();
        const fg = c.createLinearGradient(0, Ys - h, 0, Ys); fg.addColorStop(0, '#6D6286'); fg.addColorStop(1, '#4A4060'); c.fillStyle = fg; c.fillRect(x0, Ys - h, w, h); c.strokeStyle = INK; c.lineWidth = 2; c.strokeRect(x0, Ys - h, w, h);
        c.fillStyle = '#8C81AA'; c.fillRect(x0, Ys - h - dep, w, dep); c.strokeRect(x0, Ys - h - dep, w, dep);
        c.fillStyle = JADE; for (let i = 0; i < 6; i++) { c.beginPath(); c.ellipse(x0 + w * (i + 0.5) / 6, Ys - h, w / 11, T * 0.1 + (i % 2) * T * 0.06, 0, 0, Math.PI); c.fill(); }
        c.strokeStyle = 'rgba(20,12,30,.7)'; c.lineWidth = 2; if (k < 0.67) { c.beginPath(); c.moveTo(x0 + w * 0.2, Ys - h); c.lineTo(x0 + w * 0.32, Ys - h * 0.5); c.lineTo(x0 + w * 0.24, Ys); c.stroke(); } if (k < 0.34) { c.beginPath(); c.moveTo(x0 + w * 0.8, Ys - h); c.lineTo(x0 + w * 0.66, Ys - h * 0.45); c.lineTo(x0 + w * 0.78, Ys); c.stroke(); }
        if (e.hitT > 0) { c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(x0, Ys - h - dep, w, h + dep); }
        label(c, `${Math.max(0, Math.ceil(e.hp))}`, Xs, Ys - h * 0.5, T * 0.66, '#FFFFFF');
        const iy = Ys - h - dep * 0.5 - T * 0.75 + Math.sin(S.t * 3 + e.id) * T * 0.08; glowAt(c, Xs, iy, T * 1.1, GIFTS[e.gift].col, 0.55); giftIcon(c, e.gift, Xs, iy, T * 0.5); c.restore(); },
      crowd(c, e, Xs, Ys, T) { const n = Math.min(80, Math.max(0, Math.ceil(e.n))), k = SK(), t = S.t, sp = 0.26, clash = S.clash === e;
        if (e._n !== n) { e._n = n; e._ord = []; for (let i = 0; i < n; i++) { const r = sp * Math.sqrt(i + 0.5), a = i * GA; e._ord.push([Math.cos(a) * r, Math.sin(a) * r * 0.82, i]); } e._ord.sort((a, b) => a[1] - b[1]); }
        glowAt(c, Xs, Ys, T * (crowdR(e) + 1), '#7A4C9E', 0.3);
        for (const [ox, oy, i] of e._ord) { const px = Xs + ox * T + (clash ? Math.sin(t * 30 + i) * 2 : 0), py = Ys + oy * T - Math.abs(Math.sin(t * 9 + i * 1.7)) * T * 0.06, egg = e.egg && i % 4 === 3;
          c.fillStyle = 'rgba(0,0,0,.28)'; c.beginPath(); c.ellipse(px, py + T * 0.2, T * 0.22, T * 0.08, 0, 0, TAU); c.fill();
          const s = DunArt.monSprite(egg ? 'egg' : 'thornling', Math.round(0.32 * T * k), egg ? 0 : (t * 0.8 + i * 0.37) % 1, egg ? CREAM : '#7A4C9E', '', e.hitT > 0 && i % 6 === 0), w = s.half / k;
          if (!egg && i % 2) { c.save(); c.translate(px, py); c.scale(-1, 1); c.drawImage(s.cv, -w, -w * 0.95, w * 2, w * 2); c.restore(); } else c.drawImage(s.cv, px - w, py - w * 0.95, w * 2, w * 2); }
        pill(c, Xs, Ys - (crowdR(e) * 0.82 + 0.95) * T, `${Math.max(0, Math.ceil(e.n))}`, BAD, '#FFFFFF', T * 0.62); },
      boulder(c, e, Xs, Ys, T) { if (!e.on) return; const r = e.r * T; c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.15, r * 1.1, r * 0.4, 0, 0, TAU); c.fill(); c.translate(Xs, Ys - r * 0.7); c.rotate(e.rot);
        const gr = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#9FC9A8'); gr.addColorStop(0.6, JADE); gr.addColorStop(1, '#2F5F4E'); c.fillStyle = e.hitT > 0 ? '#DFF5E6' : gr; c.strokeStyle = INK; c.lineWidth = 2.5; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
        c.fillStyle = 'rgba(0,0,0,.22)'; [[0.3, -0.2, 0.2], [-0.35, 0.25, 0.16], [0.1, 0.45, 0.12], [-0.2, -0.45, 0.1]].forEach(([x, y, q]) => { c.beginPath(); c.arc(x * r, y * r, q * r, 0, TAU); c.fill(); }); c.restore();
        pill(c, Xs, Ys - r * 2.2, `${Math.max(0, Math.ceil(e.hp))}`, '#A79BC4', '#FFFFFF', T * 0.42); },
      hedge(c, e, Xs, Ys, T) { const xa = X.sx(e.x0), xb = X.sx(e.x1), yb = Ys, n = Math.max(2, Math.round((e.x1 - e.x0) * 1.6));
        c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(xa, yb - T * 0.1, xb - xa, T * 0.2); glowAt(c, (xa + xb) / 2, yb - T * 0.3, (xb - xa) * 0.7, BAD, 0.3 + 0.1 * Math.sin(S.t * 5));
        for (let i = 0; i < n; i++) { const px = xa + (xb - xa) * (i + 0.5) / n, py = yb - T * 0.35, rr = (xb - xa) / n * 0.62; c.fillStyle = i % 2 ? '#3F3A5A' : '#4A3D63'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.ellipse(px, py, rr, T * 0.42, 0, 0, TAU); c.fill(); c.stroke();
          c.fillStyle = CREAM; for (let j = 0; j < 4; j++) { const a = -Math.PI * (0.15 + j * 0.23), tx = px + Math.cos(a) * rr * 0.9, ty = py + Math.sin(a) * T * 0.4; c.beginPath(); c.moveTo(tx - T * 0.06, ty); c.lineTo(tx + Math.cos(a) * T * 0.22, ty + Math.sin(a) * T * 0.22); c.lineTo(tx + T * 0.06, ty); c.closePath(); c.fill(); c.lineWidth = 1; c.stroke(); }
          c.fillStyle = ROSE; c.beginPath(); c.arc(px + rr * 0.3, py + T * 0.05, T * 0.07, 0, TAU); c.fill(); } },
      cp(c, e, Xs, Ys, T) { const on = e.done; for (const px of [LX0 + 0.35, LX1 - 0.35]) { const Xp = X.sx(px), col = on ? MINT : GOLD; c.strokeStyle = INK; c.lineWidth = T * 0.18; c.lineCap = 'round'; c.beginPath(); c.moveTo(Xp, Ys); c.quadraticCurveTo(Xp + T * 0.2, Ys - T * 1, Xp, Ys - T * 1.9); c.stroke(); c.strokeStyle = '#3E7A5E'; c.lineWidth = T * 0.1; c.stroke();
          glowAt(c, Xp, Ys - T * 2.1, T * 1.1, col, 0.7 + 0.2 * Math.sin(S.t * 4)); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU - Math.PI / 2; c.fillStyle = on ? '#BFF5DE' : '#F7B8D8'; c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.ellipse(Xp + Math.cos(a) * T * 0.2, Ys - T * 2.1 + Math.sin(a) * T * 0.2, T * 0.17, T * 0.1, a, 0, TAU); c.fill(); c.stroke(); } c.fillStyle = col; c.beginPath(); c.arc(Xp, Ys - T * 2.1, T * 0.12, 0, TAU); c.fill(); }
        c.save(); c.globalAlpha = 0.6; c.strokeStyle = on ? MINT : GOLD; c.lineWidth = 3; c.setLineDash([8, 8]); c.lineDashOffset = -S.t * 20; c.beginPath(); c.moveTo(X.sx(LX0 + 0.35), Ys - T * 0.1); c.lineTo(X.sx(LX1 - 0.35), Ys - T * 0.1); c.stroke(); c.restore(); label(c, on ? 'BLOOM POST ✓' : 'BLOOM POST', Xs, Ys - T * 0.5, T * 0.3, on ? MINT : GOLD); },
      boss(c, e, Xs, Ys, T) { const R = T * 1.95, fall = e.dead ? Math.min(1, e.fallT / 1.2) : 0, t = S.t;
        c.save(); c.globalAlpha = 1 - fall * 0.85; c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, R * 1.25, R * 0.38, 0, 0, TAU); c.fill(); glowAt(c, Xs, Ys - R * 1.2, R * 2.4, ROSE, 0.35);
        c.translate(Xs, Ys - R * 0.85 + fall * R * 0.6); c.rotate(fall * 0.5); c.translate(0, -e.lift * R * 0.28 * (0.5 + 0.5 * Math.sin(t * 30))); c.scale(1 + e.sq * 0.14, 1 - e.sq * 0.12 + Math.sin(t * 2) * 0.02);
        MP.milkcap(c, R, (t * 0.7) % 1, { color: JADE, mode: e.lift > 0.3 ? 'block' : null });
        // a crown of thorns along the cap, and two burning eyes
        for (let i = 0; i < 7; i++) { const u = (i - 3) / 3, px = u * R * 0.85, py = -R * 1.25 + Math.abs(u) * R * 0.45; c.fillStyle = '#7A4C9E'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(px - R * 0.1, py + R * 0.05); c.lineTo(px + u * R * 0.12, py - R * 0.38); c.lineTo(px + R * 0.1, py + R * 0.05); c.closePath(); c.fill(); c.stroke(); }
        c.fillStyle = INK; c.beginPath(); c.moveTo(-R * 0.34, R * 0.3); for (let i = 0; i <= 6; i++) c.lineTo(-R * 0.34 + i * R * 0.113, R * (i % 2 ? 0.4 : 0.3) + Math.sin(t * 6) * R * 0.02); c.lineTo(R * 0.3, R * 0.48); c.quadraticCurveTo(0, R * 0.62, -R * 0.3, R * 0.48); c.closePath(); c.fill(); c.fillStyle = CREAM; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-R * 0.26 + i * R * 0.17, R * 0.34); c.lineTo(-R * 0.2 + i * R * 0.17, R * 0.44); c.lineTo(-R * 0.14 + i * R * 0.17, R * 0.35); c.closePath(); c.fill(); }
        c.strokeStyle = INK; c.lineWidth = R * 0.07; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(sd * R * 0.48, -R * 0.12); c.lineTo(sd * R * 0.14, R * 0.0); c.stroke(); }
        for (const [px, py, rr] of [[-0.55, -0.85, 0.13], [0.3, -1.0, 0.1], [0.62, -0.6, 0.09], [-0.15, -1.1, 0.08]]) glowAt(c, px * R, py * R, rr * R * 2.5, ROSE, 0.5 + 0.3 * Math.sin(t * 3 + px * 5));
        for (const sd of [-1, 1]) { glowAt(c, sd * R * 0.3, R * 0.05, R * 0.35, BAD, 0.9); c.fillStyle = '#FFE3F0'; c.beginPath(); c.arc(sd * R * 0.3, R * 0.05, R * 0.06, 0, TAU); c.fill(); }
        if (e.hitT > 0 && !e.dead) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; blitSized(c, glowSprite('#FFFFFF'), -R * 1.2, -R * 1.5, R * 2.4, R * 2.4); }
        c.restore();
        if (!e.dead) { const py = Ys - R * 1.55 - e.lift * R * 0.1; pill(c, Xs, py, `${Math.max(0, Math.ceil(e.hp))}`, BAD, '#FFFFFF', T * 0.85); c.save(); const bw = R * 1.7; c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(Xs - bw / 2, py + T * 0.65, bw, 6); c.fillStyle = BAD; c.fillRect(Xs - bw / 2, py + T * 0.65, bw * Math.max(0, e.hp / e.hp0), 6); c.restore(); } },
    };
    return mod;
  }
  const MARCH = { name: 'The Seedling March', goal: 'Lead the seedling army up the lane and fell the Milkcap Colossus', how: 'Lead an army of seedling sprites up a long moss lane over the void. The march goes by itself: you only steer, left and right (the move stick or the arrow keys; dodge for a quick side-step). Every seedling shoots up the lane on its own, so the bigger your army, the more bolts fly. Gates stand across the lane in pairs: run through the green one (+ adds seedlings, × multiplies them), not the rose one (− takes them away, ÷ divides them). A stone block shows how tough it is: steer under it and shoot it down to win what sits on top (the seed crossbow: faster bolts that each fell two; the thorn spread: three thorns from every seedling; or more seedlings). A block that reaches you unbroken crushes the seedlings that run into it. Thornling crowds carry a number too: shoot them thin, then the two crowds clash and the numbers eat each other down. Thorn hedges and rolling moss boulders (shoot them!) thin your army: steer round them. Bloom posts are checkpoints. At the end waits the Milkcap Colossus: shoot its big number down, and when your army reaches it the seedlings charge and hack at it. Step out of the rose rings where its roots burst and its spores land. Lose every seedling and your pet marches alone on three hearts (a green gate regrows the army); out of hearts, the march starts again from the last bloom post.',
    layout: marchLayout, legend: {}, make: makeMarch };

  /* ---------- puzzle 2: the Falling Nursery, catching the stars ----------
     Unborn stars drop from the branches: a ring on the moss shows where each will land and shrinks as it falls. Be
     under it when it lands and it is caught. Void shards fall among them, dark ones: let those hit the ground, a caught
     shard spills two stars. Catch enough and the star-bud at the end of the bed blooms, and the way opens */
  const STAR_NEED = 24;
  function makeStarfall(X, self, H) {
    const marks = X.M.marks, me = X.me, g = X.g, bud = marks.C[0], NEED = self.S.need || STAR_NEED;
    const R = { caught: 0, lost: 0, spawnT: 2.5, t: 0, mode: 'intro', streak: 0 };
    const stars = [];
    const budObj = H.obj({ x: bud.x, y: bud.y, kind: 'starbud', r: 1.0, h: 2.0, t: 0, label: () => (self.done ? 'The star-bud blooms ✓' : `The star-bud · ${R.caught}/${NEED} stars`), draw(c, Xs, Ys, T, o) { const k = Math.min(1, R.caught / NEED); c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, T * 0.15, T * 0.6, T * 0.22, 0, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = T * 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.15, -T * 0.7, 0, -T * 1.3); c.stroke(); c.strokeStyle = JADE; c.lineWidth = T * 0.08; c.stroke(); glowAt(c, 0, -T * 1.5, T * (0.6 + k), GOLD, 0.2 + 0.6 * k + (self.done ? 0.2 * Math.sin(o.t * 4) : 0)); const open = self.done ? 1 : k * 0.6; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, sp = T * (0.2 + open * 0.3); c.fillStyle = i % 2 ? '#F7B8D8' : ROSE; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.ellipse(Math.cos(a) * sp, -T * 1.5 + Math.sin(a) * sp * 0.8, T * 0.22, T * 0.13, a, 0, TAU); c.fill(); c.stroke(); } c.fillStyle = self.done ? '#FFFFFF' : GOLD; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? T * 0.1 : T * 0.22; c.lineTo(Math.cos(a) * rr, -T * 1.5 + Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); c.restore(); } });
    H.setExit(marks.E[0].x, marks.E[0].y, 'The way on');
    X.after(1.2, () => { X.banner('THE FALLING NURSERY', `Stand under the stars as they land: catch ${NEED}. Let the dark shards fall`, GOLD, 3.0, true, true); R.mode = 'run'; });
    function drop() { const n = R.caught >= 8 ? (Math.random() < 0.35 ? 2 : 1) : 1; for (let k = 0; k < n; k++) { const a = Math.random() * TAU, d = 1.5 + Math.random() * 4; let p = X.freeSpot(me.x + Math.cos(a) * d, me.y + Math.sin(a) * d, 0.3); if (!p) p = { x: me.x, y: me.y }; const shard = R.caught >= 6 && Math.random() < 0.28; stars.push({ x: p.x, y: p.y, t: 0, dur: Math.max(1.5, 2.4 - R.caught * 0.03), shard, ph: Math.random() * TAU }); } }
    return { R, stars, bud: budObj, drop,
      hint() { return self.done ? null : null; },
      update(dt) { R.t += dt; budObj.t += dt; if (R.mode !== 'run' || g.won || me.dead) return;
        R.spawnT -= dt; if (R.spawnT <= 0) { R.spawnT = Math.max(0.7, 1.6 - R.caught * 0.03); drop(); }
        for (let i = stars.length - 1; i >= 0; i--) { const s = stars[i]; s.t += dt; if (s.t < s.dur) continue; stars.splice(i, 1);
          const near = Math.hypot(me.x - s.x, me.y - s.y) < 0.95;
          if (s.shard) { if (near) { const lost = Math.min(R.caught, 2); R.caught -= lost; R.streak = 0; X.boom(s.x, s.y, 1.0, '#3A2047', '#B98BE0', { n: 12, shake: 5 }); X.text(me.x, me.y - 1.6, lost ? `Void shard! −${lost}` : 'Void shard!', '#B98BE0', 13); X.sfx.crack(); } else { X.sparks(s.x, s.y, '#5A3570', 6, 3); X.sfx.thud(); } continue; }
          if (near) { R.caught++; R.streak++; X.sparks(s.x, s.y - 0.4, GOLD, 8, 4); X.sfx.coin(); X.text(me.x, me.y - 1.6, R.streak >= 5 && R.streak % 5 === 0 ? `${R.streak} in a row!` : `${R.caught}/${NEED}`, GOLD, 12); if (R.caught >= NEED && !self.done) { self.done = true; R.mode = 'rest'; X.banner('THE STAR-BUD BLOOMS', 'Every star caught: the way opens', '#8FE0A6', 2.6, true, true); X.flash(0.35, GOLD); X.sfx.fanfare(); X.ring(bud.x, bud.y, 0.3, 5, 0.8, GOLD, 0.4); } }
          else { R.lost++; R.streak = 0; X.sparks(s.x, s.y, '#FFFFFF', 5, 3); X.sfx.pop(); } } },
      goal() { if (self.done) return 'The star-bud blooms · through the door'; if (R.mode === 'intro') return 'The Falling Nursery'; return `Catch the falling stars · ${R.caught}/${NEED}${R.streak >= 3 ? ` · ${R.streak} in a row` : ''}`; },
      drawGround(c) { const T = X.Tz();
        for (const s of stars) { const u = s.t / s.dur, Xs = X.sx(s.x), Ys = X.sy(s.y), col = s.shard ? '#B98BE0' : GOLD, rr = T * (1.3 - u * 0.9);
          c.save(); c.globalAlpha = 0.35 + 0.4 * u; c.strokeStyle = col; c.lineWidth = 2 + u * 2; c.beginPath(); c.ellipse(Xs, Ys, rr, rr * 0.55, 0, 0, TAU); c.stroke(); c.globalAlpha = 0.12 + 0.25 * u; c.fillStyle = s.shard ? '#3A2047' : col; c.fill(); c.restore(); } },
      drawObj(c) {},
      drawOver(c) { const T = X.Tz(), Hh = X.H();
        // the stars in the air: high over their landing ring, falling faster near the end
        for (const s of stars) { const u = s.t / s.dur, Xs = X.sx(s.x), Ys = X.sy(s.y), z = (1 - u * u) * Math.max(T * 6, Hh * 0.5), y = Ys - z; if (y < -40) continue; const col = s.shard ? '#5A3570' : GOLD, r = T * (s.shard ? 0.26 : 0.3);
          c.save(); c.translate(Xs, y); c.rotate(s.ph + s.t * 4); if (!s.shard) glowAt(c, 0, 0, r * 2.2, GOLD, 0.6); c.fillStyle = s.shard ? '#3A2047' : '#FFFFFF'; c.strokeStyle = s.shard ? '#B98BE0' : INK; c.lineWidth = 1.5; c.beginPath(); if (s.shard) { c.moveTo(0, -r); c.lineTo(r * 0.6, 0); c.lineTo(0, r); c.lineTo(-r * 0.6, 0); c.closePath(); } else for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.fill(); c.stroke(); if (!s.shard) { c.fillStyle = GOLD; c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fill(); } c.restore();
          c.save(); c.globalAlpha = 0.25; c.strokeStyle = col; c.lineWidth = 1.5; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(Xs, y + r); c.lineTo(Xs, Ys); c.stroke(); c.restore(); } },
    };
  }
  const STARFALL = { name: 'The Falling Nursery', goal: 'Catch the unborn stars as they fall', how: `Unborn stars drop from the branches. A ring on the moss shows where each will land and shrinks as the star falls: stand inside it when it lands to catch it. Dark void shards fall among them: let those hit the ground (catching one spills two of your stars). Catch ${STAR_NEED} and the star-bud at the end of the bed blooms.`,
    layout: ['######################', '#....................#', '#.........E..........#', '#.........C..........#', '#....................#', '#....................#', '#....................#', '#....................#', '#....................#', '#....................#', '#....................#', '#.........S..........#', '#....................#', '######################'],
    legend: { C: {}, E: {} }, make: makeStarfall, need: STAR_NEED };

  /* ---------- puzzle 3: the Seedshot Gallery, a shooting game ----------
     A long bed of moon-moss with three lanes of drifting seed pods above it: tap to shoot them (your pet's own bolts).
     Plain pods pop in one; tough green buds take two; a golden pod is worth three and darts. Pods that get across come
     back round the other way. Pop enough and the thorn hedge at the end withers */
  const POD_NEED = 24;
  function makeGallery(X, self, H) {
    const marks = X.M.marks, me = X.me, g = X.g, NEED = self.S.need || POD_NEED, M = X.M;
    const R = { pops: 0, t: 0, mode: 'intro', spawnT: 1.0, combo: 0, comboT: 0 };
    const pods = [], LANES = [3.5, 5.5, 7.5], hedge = (marks.h || []);
    H.setExit(marks.E[0].x, marks.E[0].y, 'The way on');
    X.after(1.2, () => { X.banner('THE SEEDSHOT GALLERY', `Tap to shoot the drifting pods: pop ${NEED}. Green buds take two; gold is worth three`, GOLD, 3.0, true, true); R.mode = 'run'; });
    function spawn() { const lane = Math.floor(Math.random() * 3), dir = Math.random() < 0.5 ? 1 : -1, kind = R.pops >= 4 && Math.random() < 0.25 ? 'bud' : R.pops >= 8 && Math.random() < 0.15 ? 'gold' : 'pod'; pods.push({ x: dir > 0 ? 1.5 : M.MW - 1.5, y: LANES[lane], dir, kind, hp: kind === 'bud' ? 2 : 1, spd: (kind === 'gold' ? 4.2 : 2.2 + R.pops * 0.04) * (0.9 + Math.random() * 0.3), ph: Math.random() * TAU, t: 0, hitT: 0 }); }
    const COL = { pod: '#B98BE0', bud: JADE, gold: GOLD };
    return { R, pods, spawn,
      update(dt) { R.t += dt; if (R.comboT > 0) { R.comboT -= dt; if (R.comboT <= 0) R.combo = 0; } if (R.mode !== 'run' || g.won || me.dead) return;
        R.spawnT -= dt; if (R.spawnT <= 0 && pods.length < 7) { R.spawnT = Math.max(0.6, 1.4 - R.pops * 0.025); spawn(); }
        for (const p of pods) { p.t += dt; if (p.hitT > 0) p.hitT -= dt; p.x += p.dir * p.spd * dt; if (p.kind === 'gold') p.y = LANES[1] + Math.sin(p.t * 3) * 2; if (p.x < 1.2 || p.x > M.MW - 1.2) { p.dir = -p.dir; p.x = Math.max(1.2, Math.min(M.MW - 1.2, p.x)); } }
        // the pet's bolts pop them
        const shots = X.shots || [];
        for (const b of shots) { if (b.life <= 0 || b.own === 'enemy') continue; for (const p of pods) { if (p.dead) continue; if (Math.hypot(b.x - p.x, b.y - p.y) < 0.55 + (b.r || 0.14)) { p.hp--; p.hitT = 0.25; if (!b.pierce) b.life = 0; X.sparks(p.x, p.y, COL[p.kind], 6, 3);
              if (p.hp <= 0) { p.dead = true; const worth = p.kind === 'gold' ? 3 : 1; R.pops += worth; R.combo++; R.comboT = 2.2; X.boom(p.x, p.y, 0.8, COL[p.kind], '#FFFFFF', { n: 10, shake: 2 }); X.sfx.pop(); X.text(p.x, p.y - 0.8, worth > 1 ? `+${worth}!` : R.combo >= 3 ? `${R.combo} combo` : `${Math.min(R.pops, NEED)}/${NEED}`, COL[p.kind], 12);
                if (R.pops >= NEED && !self.done) { self.done = true; R.mode = 'rest'; hedge.forEach(h => X.setTile(h.tx, h.ty, T_FLOOR)); X.retile(); X.banner('THE HEDGE WITHERS', 'Enough pods popped: the way opens', '#8FE0A6', 2.6, true, true); X.flash(0.35, GOLD); X.sfx.fanfare(); hedge.forEach(h => X.sparks(h.x, h.y, JADE, 6, 3)); } }
              else X.sfx.thud(); break; } } }
        for (let i = pods.length - 1; i >= 0; i--) if (pods[i].dead) pods.splice(i, 1); },
      goal() { if (self.done) return 'The hedge withers · through the door'; if (R.mode === 'intro') return 'The Seedshot Gallery'; return `Tap to shoot the pods · ${Math.min(R.pops, NEED)}/${NEED}${R.combo >= 3 ? ` · ${R.combo} combo` : ''}`; },
      drawGround(c) { const T = X.Tz(); c.save(); c.globalAlpha = 0.1; c.strokeStyle = GOLD; c.lineWidth = 1.5; c.setLineDash([T * 0.3, T * 0.5]); for (const ly of LANES) { c.beginPath(); c.moveTo(X.sx(1), X.sy(ly)); c.lineTo(X.sx(M.MW - 1), X.sy(ly)); c.stroke(); } c.restore();
        for (const h of hedge) { if (self.done) continue; const Xs = X.sx(h.x), Ys = X.sy(h.y); c.save(); c.translate(Xs, Ys); c.fillStyle = '#3F5F3A'; c.strokeStyle = INK; c.lineWidth = 1.5; for (let k = 0; k < 5; k++) { const a = k / 5 * TAU + h.x; c.beginPath(); c.ellipse(Math.cos(a) * T * 0.25, -T * 0.3 + Math.sin(a) * T * 0.15, T * 0.3, T * 0.22, a, 0, TAU); c.fill(); c.stroke(); } c.fillStyle = '#C9B8E8'; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo((k - 1) * T * 0.3, -T * 0.4); c.lineTo((k - 1) * T * 0.3 + T * 0.08, -T * 0.75); c.lineTo((k - 1) * T * 0.3 + T * 0.14, -T * 0.4); c.closePath(); c.fill(); c.stroke(); } c.restore(); } },
      drawOver(c) { const T = X.Tz();
        for (const p of pods) { const Xs = X.sx(p.x), Ys = X.sy(p.y) - T * 0.9 - Math.sin(p.t * 4 + p.ph) * T * 0.1, r = T * (p.kind === 'bud' ? 0.34 : 0.3), col = COL[p.kind]; c.save(); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(Xs, X.sy(p.y) + T * 0.1, r, r * 0.4, 0, 0, TAU); c.fill(); c.translate(Xs, Ys); c.rotate(p.dir * 0.2 + Math.sin(p.t * 5) * 0.1); if (p.kind === 'gold') glowAt(c, 0, 0, r * 2, GOLD, 0.5); if (p.hitT > 0) { c.scale(1.2, 0.85); }
          const gr = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, col); gr.addColorStop(1, shadeC(col, -0.3)); c.fillStyle = gr; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.ellipse(0, 0, r, r * 1.15, 0, 0, TAU); c.fill(); c.stroke();
          c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, -r * 1.1); c.quadraticCurveTo(r * 0.3, -r * 1.5, r * 0.5, -r * 1.3); c.stroke(); c.fillStyle = JADE; c.beginPath(); c.ellipse(r * 0.55, -r * 1.35, r * 0.25, r * 0.12, -0.5, 0, TAU); c.fill(); c.stroke();
          if (p.kind === 'bud') { c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.2; for (let k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * r * 0.35, -r * 0.9); c.quadraticCurveTo(k * r * 0.5, 0, k * r * 0.35, r * 0.9); c.stroke(); } if (p.hp === 1) { c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-r * 0.3, -r * 0.2); c.lineTo(0, r * 0.1); c.lineTo(r * 0.25, -r * 0.4); c.stroke(); } }
          c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.ellipse(-r * 0.3, -r * 0.45, r * 0.22, r * 0.14, -0.6, 0, TAU); c.fill(); c.restore(); } },
    };
  }
  const GALLERY = { name: 'The Seedshot Gallery', goal: 'Shoot the drifting seed pods', how: `Three lanes of seed pods drift over the moss bed. Tap anywhere to shoot with your pet's own bolts. A plain pod pops in one hit; a green bud takes two; a darting golden pod is worth three. Pods that get across come back the other way. Pop ${POD_NEED} and the thorn hedge withers.`,
    layout: ['##################', '#................#', '#................#', '#................#', '#................#', '#................#', '#................#', '#................#', '#................#', '#................#', '#.......S........#', '#................#', '#hhhhhhhhhhhhhhhh#', '#................#', '#.......E........#', '##################'],
    legend: { h: { tile: T_SOLID }, E: {} }, make: makeGallery, need: POD_NEED };

  /* ---- the rift ---- */
  const SEALING = { fall: 'THE ROOT WITHERS', sub: 'The eggs go dark on their branches', sigil: 'THE BLOOM SIGIL', name: 'The Garden of Unborn Stars', color: ROSE };
  defRift({
    ease: 0.6,   // (forty percent gentler than first built: health and blows of everything here)
    id: 'garden', n: 2, name: 'The Garden of Unborn Stars', lvl: 20, sigil: 'Bloom', biome: 'garden', aff: ['earth', 'dark'], region: 'the forest',
    blurb: 'A forest that grows eggs instead of fruit under three unmoving moons. March its seedlings, catch its stars.', gate: { anima: 'taurus', name: 'The Unbroken Constellation' },
    mons: ['thornling', 'milkcap', 'pollenmoth'], sealing: SEALING,
    stages: riftSections([
      { pattern: ['fight', 'puzzle', 'fight', 'boss'], mods: ['random', 'random'], fights: ['The Egg Orchard', 'The Moss Terraces'], minis: ['briarpet'], puzzles: [MARCH], boss: 'orrubel', bossName: 'Orrubel the Seed-Mother', bossRoom: 'The Cradle Bed' },
      { pattern: ['fight', 'fight', 'puzzle', 'boss'], mods: ['random', 'random'], fights: ['The Glassless Conservatory', 'The Pollen Galleries'], minis: ['dustpet'], puzzles: [STARFALL], boss: 'ambrel', bossName: 'Ambrel the Void Moth', bossRoom: 'The Lantern Bower' },
      { pattern: ['puzzle', 'fight', 'fight', 'boss'], mods: ['random', 'random'], fights: ['The Thorn Walks', 'The Root Cellars'], minis: ['rootpet'], puzzles: [GALLERY], boss: 'calyx', bossName: 'Calyx Astrum the Starborn Vine', bossRoom: 'The Hollow Under the Moons' },
    ]),
  });
})();
