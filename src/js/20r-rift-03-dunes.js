/* ---------- Rift 3: The Mouth Beneath the Dunes (level 30, Earth and Wind, the Echo Sigil) ----------
   A desert swallowed by the fossilised jaw of something impossibly large. Six stages: the Buried Road (resonators
   reveal the buried stepping stones), Khess the Jawless, the Fossil Lock (rotate three ribs so a crossbar slides
   through their notches), Orryx the Listening Shell, the Burrow Hunt (secure three pylons while the sand hunts you),
   Ultharak the Sand Kraken, then the sealing. Original creatures: a burrowing cosmic brood and a sand kraken. */
(() => {
  const TAU = Math.PI * 2;
  /* ---- the land: ochre dunes, black basalt, bleached bone, cyan resonance ---- */
  BIOMES.dunes = { name: 'The Mouth Beneath the Dunes', rift: true, haze: { col: '214,140,70', veil: 0.26, edge: 0.45, tint: 0.1 }, tile: 'desert', out: true, dark: 0.05, bg: '#5A1E3A', gap: 'pit', mud: ['#C49652', '#CDA15E'], mudSpot: 'rgba(255,230,180,.22)', ambient: 'sand', accent: '#62BFC9', light: '#FFE9A8',
    floor: ['#E7D9B1', '#E0D0A6', '#ECE0BC'], grout: '#C7B88E', hi: '#F7EFD8', top: '#3A3540', face: '#28252F', faceD: '#1A171F', cliff: '#28252F', deco: '#62BFC9', path: ['#D9B978', '#CFAE6E'],
    props: ['dunerock', 'bones'], hazard: 'sandspout', grade: 'rgba(255,200,120,.08)', fog: '#3A1628', darkRGB: '40,20,30' };
  BIOME_ORDER.push('dunes');
  const OCHRE = '#CDA15E', BASALT = '#28252F', BONE = '#E7D9B1', CYAN = '#62BFC9', INK = '#2B2433', AMBER = '#E8A33A';
  /* ---- the brood ---- */
  Object.assign(MON, {
    skitter: { name: 'Dune skitter', from: 999, hp: 150, spd: 1.6, r: 0.4, dmg: 13, xp: 11, coin: 0.6, color: BONE, bio: ['dunes'], tip: 'Spreads its five legs, then a short swipe all round. Step out of its reach as it spreads.', kit: [] },
    grub: { name: 'Hollow grub', from: 999, hp: 260, spd: 1.4, r: 0.48, dmg: 15, xp: 14, coin: 0.8, color: '#EDE4CF', bio: ['dunes'], tip: 'Burrows along a drawn sand wake and bites where it surfaces. Strike it while it is up.', kit: [] },
    manta: { name: 'Echo manta', from: 999, hp: 90, spd: 1.5, r: 0.36, dmg: 7, xp: 9, coin: 0.6, color: '#1E1A26', bio: ['dunes'], fly: true, tip: 'Projects a circle under you that calls a grub. Hit it while it calls to interrupt.', kit: [] },
    mound: { name: 'Dune mound', from: 999, hp: 400, spd: 0, r: 0.6, dmg: 0, xp: 2, coin: 0, color: OCHRE, bio: ['dunes'], still: true, tip: 'One of three mounds hides the kraken. A resonator tells which.', kit: [] },
    anchor: { name: 'Tentacle anchor', from: 999, hp: 500, spd: 0, r: 0.55, dmg: 0, xp: 4, coin: 0, color: '#4A3A5C', bio: ['dunes'], still: true, tip: 'The exposed anchor of a sweeping tentacle. Break it to weaken the pull.', kit: [] },
  });
  const { LN, lwOf, shade, stroke, spec, MP, NF, EXT } = DunArt;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a flat five-legged star in bone plates with a small amber eye at its centre; the legs spread before a swipe */
    skitter(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sp = o.mode === 'block' ? 1.5 : 1 + 0.08 * Math.sin(ph * TAU);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5 + Math.sin(ph * TAU + i) * 0.08; limb(c, Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.2, Math.cos(a) * r * sp, Math.sin(a) * r * sp * 0.7, lw * 1.8, shadeC(col, -0.12)); c.fillStyle = BONE; c.beginPath(); c.moveTo(Math.cos(a) * r * sp, Math.sin(a) * r * sp * 0.7); c.lineTo(Math.cos(a + 0.25) * r * sp * 0.7, Math.sin(a + 0.25) * r * sp * 0.5); c.lineTo(Math.cos(a - 0.25) * r * sp * 0.7, Math.sin(a - 0.25) * r * sp * 0.5); c.closePath(); c.fill(); stroke(c, lw * 0.8); }
      c.beginPath(); c.ellipse(0, 0, r * 0.55, r * 0.4, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, -r * 0.15, 0.4); c.fill(); stroke(c, lw);
      glowAt(c, 0, -r * 0.05, r * 0.3, AMBER, 0.7); c.fillStyle = AMBER; c.beginPath(); c.arc(0, -r * 0.05, r * 0.16, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(r * 0.03, -r * 0.05, r * 0.07, 0, TAU); c.fill();
    },
    /* a thick segmented ivory cylinder with a black three-part mouth; under the sand only its wake shows */
    grub(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, up = o.mode !== 'dug', open = o.mode === 'bite' ? 0.5 : 0.1;
      if (!up) { c.fillStyle = 'rgba(120,90,40,.35)'; c.beginPath(); c.ellipse(0, r * 0.3, r * 1.3, r * 0.5, 0, 0, TAU); c.fill(); c.fillStyle = OCHRE; c.beginPath(); c.ellipse(0, r * 0.2, r * 0.9, r * 0.35, 0, 0, TAU); c.fill(); stroke(c, lw * 0.6); return; }
      for (let i = 3; i >= 0; i--) { const y = r * (0.5 - i * 0.45), w = r * (0.95 - i * 0.08); c.beginPath(); c.ellipse(0, y, w, r * 0.38, 0, 0, TAU); c.fillStyle = shade(c, col, w, -w * 0.3, y - r * 0.2, 0.4); c.fill(); stroke(c, lw); }
      // the mouth: three black petals
      const my = -r * 0.85; c.fillStyle = '#1A171F'; for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; c.beginPath(); c.moveTo(0, my); c.lineTo(Math.cos(a - 0.5) * r * (0.35 + open * 0.3), my + Math.sin(a - 0.5) * r * (0.3 + open * 0.3)); c.lineTo(Math.cos(a + 0.5) * r * (0.35 + open * 0.3), my + Math.sin(a + 0.5) * r * (0.3 + open * 0.3)); c.closePath(); c.fill(); stroke(c, lw * 0.7); }
      spec(c, -r * 0.4, -r * 0.5, r * 0.25, r * 0.4, 0.4);
    },
    /* a small black triangular ray a metre up with two long cyan whiskers */
    manta(c, r, ph, o) {
      const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.1, fl = Math.sin(ph * TAU * 2) * 0.25;
      c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, r * 1.1, r * 0.9, r * 0.3, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, bob); c.beginPath(); c.moveTo(0, -r * 0.5); c.quadraticCurveTo(r * 1.4, -r * 0.1 - fl * r, r * 1.5, r * 0.4 - fl * r); c.quadraticCurveTo(r * 0.4, r * 0.3, 0, r * 0.75); c.quadraticCurveTo(-r * 0.4, r * 0.3, -r * 1.5, r * 0.4 - fl * r); c.quadraticCurveTo(-r * 1.4, -r * 0.1 - fl * r, 0, -r * 0.5); c.closePath(); c.fillStyle = shade(c, o.color, r, 0, -r * 0.2, 0.5); c.fill(); stroke(c, lw);
      c.strokeStyle = CYAN; c.lineWidth = lw * 0.7; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(sd * r * 0.3, -r * 0.3); c.quadraticCurveTo(sd * r * 0.9, -r * 1.3, sd * r * 1.4, -r * 1.6 + Math.sin(ph * TAU + sd) * r * 0.15); c.stroke(); });
      if (o.mode === 'block') glowAt(c, 0, 0, r * 1.2, CYAN, 0.6); c.fillStyle = CYAN; c.beginPath(); c.ellipse(0, -r * 0.05, r * 0.18, r * 0.12, 0, 0, TAU); c.fill(); c.restore();
    },
    /* a dune mound: a heap of sand; its echo (an eye, or broken rings) once a resonator has sounded */
    mound(c, r, ph, o) {
      const lw = lwOf(r); c.beginPath(); c.moveTo(-r * 1.4, r * 0.5); c.quadraticCurveTo(-r * 0.6, -r * 0.9, 0, -r * 0.95); c.quadraticCurveTo(r * 0.6, -r * 0.9, r * 1.4, r * 0.5); c.closePath(); c.fillStyle = shade(c, OCHRE, r, 0, -r * 0.3, 0.4); c.fill(); stroke(c, lw);
      if (o.echo === 'eye') { c.strokeStyle = CYAN; c.lineWidth = lw; c.beginPath(); c.ellipse(0, -r * 0.2, r * 0.7, r * 0.35, 0, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(0, -r * 0.2, r * 0.4, r * 0.2, 0, 0, TAU); c.stroke(); c.fillStyle = CYAN; c.beginPath(); c.arc(0, -r * 0.2, r * 0.1, 0, TAU); c.fill(); }
      else if (o.echo === 'broken') { c.strokeStyle = CYAN; c.lineWidth = lw; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, -r * 0.2, r * (0.3 + i * 0.22), i * 1.1, i * 1.1 + 1.6); c.stroke(); c.beginPath(); c.arc(0, -r * 0.2, r * (0.3 + i * 0.22), i * 1.1 + 2.6, i * 1.1 + 3.9); c.stroke(); } }
    },
    /* the anchor of a tentacle: a knot of violet flesh with three ivory discs, driven into the rock */
    anchor(c, r, ph, o) {
      const lw = lwOf(r), col = o.color; c.beginPath(); c.ellipse(0, r * 0.1, r * 1.1, r * 0.8, 0, 0, TAU); c.fillStyle = shade(c, col, r, -r * 0.2, -r * 0.3, 0.4); c.fill(); stroke(c, lw);
      [[-0.5, -0.2], [0.2, -0.4], [0.5, 0.3]].forEach(([x, y]) => { c.fillStyle = BONE; c.beginPath(); c.ellipse(x * r, y * r, r * 0.26, r * 0.2, 0, 0, TAU); c.fill(); stroke(c, lw * 0.7); c.fillStyle = shadeC(col, -0.3); c.beginPath(); c.ellipse(x * r, y * r, r * 0.1, r * 0.08, 0, 0, TAU); c.fill(); });
      c.strokeStyle = LN; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(0, -r * 0.6); c.quadraticCurveTo(-r * 0.5, -r * 1.3, -r * 0.3, -r * 2.0); c.stroke(); c.strokeStyle = col; c.lineWidth = lw * 1.2; c.stroke();
    },
  });
  Object.assign(EXT, { skitter: 2.0, grub: 1.8, manta: 2.2, mound: 1.8, anchor: 2.4 });
  Object.assign(NF, { skitter: 6, grub: 4, manta: 6, mound: 2, anchor: 2 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    skitter(m, A, X) {
      // scuttles in; spreads its legs for a moment (they show it), then a swipe all round
      if (m.spread > 0) { m.spread -= A.dt; m.mode = 'block'; if (m.spread <= 0) { m.mode = null; X.ring(m.x, m.y, 0.3, 1.5, 0.25, BONE, 0.4); if (A.d < 1.5 + X.me.r) X.hurtPet(m.dmg * 1.3, m); m.cd = 2 + Math.random(); } return; }
      if (A.d > 1.1) { X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
      else if (m.cd <= 0) { m.spread = 0.6; X.warn({ x: m.x, y: m.y, r: 1.5, life: 0.6, max: 0.6, src: m, color: BONE }); }
    },
    grub(m, A, X) {
      // under the sand it cannot be struck; it draws a wake toward you, surfaces close by, bites, stays up a while
      m.guardFn = m.guardFn || (q => (q.mode === 'dug' ? 0 : 1));
      if (m.mode == null) { m.mode = 'dug'; m.upT = 0; }
      m.under = m.mode === 'dug';   // (under the sand it is out of reach: the aim passes over it)
      if (m.mode === 'dug') { if (A.d > 1.3) { X.moveEnt(m, A.ux * A.sp * 1.2 * A.dt, A.uy * A.sp * 1.2 * A.dt); if (Math.random() < A.dt * 6) X.part({ kind: 'smoke', x: m.x + (Math.random() - 0.5) * 0.6, y: m.y + 0.2, vx: 0, vy: -0.4, life: 0.45, max: 0.45, size: 0.35, color: 'rgba(205,161,94,' }); }
        else if (m.cd <= 0) { m.mode = 'rise'; m.riseT = 0.5; X.warn({ x: m.x, y: m.y, r: 1.3, life: 0.5, max: 0.5, src: m, color: OCHRE }); } return; }
      if (m.mode === 'rise') { m.riseT -= A.dt; if (m.riseT <= 0) { m.mode = 'bite'; m.upT = 0; X.sparks(m.x, m.y, OCHRE, 12, 5); if (A.d < 1.3 + X.me.r) X.hurtPet(m.dmg * 1.4, m); X.sfx.thud(); } return; }
      // up: slow, biting at reach; after three seconds it digs back down
      m.upT += A.dt; m.face = A.dx >= 0 ? 1 : -1; if (A.d > 1) X.moveEnt(m, A.ux * A.sp * 0.4 * A.dt, A.uy * A.sp * 0.4 * A.dt); else if (m.atkCd <= 0) { m.atkCd = 1.2; X.hurtPet(m.dmg, m); X.slash(m.x + A.ux * 0.5, m.y + A.uy * 0.5, Math.atan2(A.uy, A.ux), 0.8, BONE); }
      m.mode = m.upT > 0.4 && m.upT < 0.7 ? 'bite' : 'up'; if (m.upT > 3.2) { m.mode = 'dug'; m.cd = 1.5; X.part({ kind: 'smoke', x: m.x, y: m.y, vx: 0, vy: -0.5, life: 0.5, max: 0.5, size: 0.8, color: 'rgba(205,161,94,' }); }
    },
    manta(m, A, X) {
      // hangs off at range; every so often a circle under you: unless the manta is hit during the call, a grub erupts there
      if (m.call) { m.call.t -= A.dt; m.mode = 'block'; if (m.flash > 0.05 && m.callHit !== m.flash) { m.call = null; m.mode = null; m.cd = 3; X.text(m.x, m.y - m.r - 0.6, 'Interrupted!', '#FFFFFF', 12); return; }
        if (m.call.t <= 0) { const p = m.call; m.call = null; m.mode = null; m.cd = 5 + Math.random() * 2; const q = X.freeSpot(p.x, p.y, 0.4) || p; const gr = X.spawnMon('grub', q.x, q.y, { aggro: true, pack: 530 }); gr.mode = 'rise'; gr.riseT = 0.1; X.g.total++; X.text(p.x, p.y - 1, 'A grub answers', CYAN, 12); } return; }
      keepRange(m, A, X, 3, 5.5);
      if (m.cd <= 0 && A.d < 7 && A.los()) { m.call = { x: X.me.x, y: X.me.y, t: 2.4 }; m.callHit = m.flash; X.warn({ x: m.call.x, y: m.call.y, r: 1.6, life: 2.4, max: 2.4, src: m, color: CYAN }); X.text(m.x, m.y - m.r - 0.6, 'It calls', CYAN, 12); if (X.rift && X.rift.self.mod.onCall) X.rift.self.mod.onCall(m); }
    },
    mound(m, A, X) {}, anchor(m, A, X) {},
  });

  /* ---- the mini bosses' moves: Rift-touched Cocopets fighting with the desert's tricks ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'sandpet', rift: true, name: 'Sand', title: 'A Rift-touched Cocopet', hp: 26000, dmg: 22, r: 1.3, spd: 1.7, color: OCHRE, glow: AMBER, biome: 'dunes', el: 'gold' },
    { id: 'echopet', rift: true, name: 'Echo', title: 'A Rift-touched Cocopet', hp: 30000, dmg: 21, r: 1.25, spd: 1.9, color: '#1E1A26', glow: CYAN, biome: 'dunes', el: 'gold' },
    { id: 'jawpet', rift: true, name: 'Jaw', title: 'A Rift-touched Cocopet', hp: 38000, dmg: 25, r: 1.5, spd: 1.3, color: BONE, glow: '#E04FA3', biome: 'dunes', el: 'gold' });
  Object.assign(DunAI.boss, {
    /* Sand: dives under the dunes and surfaces under you; spouts of sand in a ring */
    sandpet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['burrow', 'spouts', 'burrow', 'burrow'] : ['burrow', 'spouts']); }
      const T = m.actT;
      switch (m.act) {
        case 'burrow': { if (m.step === 0) { m.step = 1; m.under = true; X.say(m, 'Hsss.'); X.sparks(m.x, m.y, OCHRE, 12, 4); }
          if (T > 0.4 && T < 1.6) { const d = Math.hypot(X.me.x - m.x, X.me.y - m.y) || 1; X.moveEnt(m, (X.me.x - m.x) / d * 7 * A.dt, (X.me.y - m.y) / d * 7 * A.dt, 1); if (Math.random() < A.dt * 8) X.part({ kind: 'sand', x: m.x, y: m.y, vx: 0, vy: -1, life: 0.5, max: 0.5, size: 3, color: OCHRE }); }
          if (T > 1.6 && m.step === 1) { m.step = 2; X.warn({ x: m.x, y: m.y, r: 2.0, life: 0.7, max: 0.7, src: m, color: AMBER }); }
          if (T > 2.3 && m.step === 2) { m.step = 3; m.under = false; X.slam(m.x, m.y, 2.0, m.dmg * 1.5, AMBER, m); X.shake(10, 0.3); X.sfx.crash(); }
          if (T > 2.8) done(m, 1.6); break; }
        case 'spouts': { if (m.step === 0) { m.step = 1; X.say(m, 'Spout.'); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + T, px = m.x + Math.cos(a) * 3.2, py = m.y + Math.sin(a) * 3.2; X.warn({ x: px, y: py, r: 1.1, life: 1.0, max: 1.0, src: m, color: AMBER, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.1 + X.me.r) X.hurtPet(m.dmg, m); X.sparks(px, py, OCHRE, 8, 5); } }); } }
          if (T > 1.3) done(m, 1.8); break; }
        default: done(m, 1);
      }
    },
    /* Echo: calls a grub under you with an echo ring, and screams a cone */
    echopet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3.5 ? 1 : 0.2)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['call', 'scream', 'scream', 'call'] : ['call', 'scream']); }
      const T = m.actT;
      switch (m.act) {
        case 'call': { if (m.step === 0) { m.step = 1; const cx = X.me.x, cy = X.me.y; X.say(m, 'Rise.'); X.warn({ x: cx, y: cy, r: 1.6, life: 1.4, max: 1.4, src: m, color: CYAN, fn: () => { const q = X.freeSpot(cx, cy, 0.4); if (q) { X.spawnMon('grub', q.x, q.y, { aggro: true, pack: 570 }); X.g.total++; } if (Math.hypot(X.me.x - cx, X.me.y - cy) < 1.6 + X.me.r) X.hurtPet(m.dmg * 0.8, m); } }); }
          if (T > 1.6) done(m, 2.0); break; }
        case 'scream': { if (m.step === 0) { m.step = 1; m.sa = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.sa) >= 0 ? 1 : -1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.sa, len: 7, w: 0.9, life: 0.9, max: 0.9, src: m, color: CYAN, fn: () => { if (X.inCone(m.x, m.y, m.sa, 7, 0.9)) { X.hurtPet(m.dmg * 1.2, m); X.push(m.sa, 1.5); } X.shake(6, 0.2); X.sfx.hum(); } }); X.say(m, 'EEEE.'); }
          if (T > 1.4) done(m, 1.5); break; }
        default: done(m, 1);
      }
    },
    /* Jaw: rows of bone spikes down the floor toward you, and a bite that lunges */
    jawpet(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['spikes', 'bite', 'spikes', 'spikes'] : ['spikes', 'bite']); }
      const T = m.actT;
      switch (m.act) {
        case 'spikes': { if (m.step === 0) { m.step = 1; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(a) >= 0 ? 1 : -1; X.say(m, 'Teeth.'); for (let k = 1; k <= 5; k++) { const px = m.x + Math.cos(a) * k * 1.6, py = m.y + Math.sin(a) * k * 1.6; X.warn({ x: px, y: py, r: 1.0, life: 0.5 + k * 0.2, max: 0.5 + k * 0.2, src: m, color: BONE, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.0 + X.me.r) X.hurtPet(m.dmg * 1.1, m); X.sparks(px, py, BONE, 6, 4); X.shake(3, 0.1); } }); } }
          if (T > 2) done(m, 1.6); break; }
        case 'bite': { if (m.step === 0) { m.step = 1; m.ca = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ca, len: 5, w: 1.6, life: 0.7, max: 0.7, src: m, color: '#E04FA3' }); X.say(m, 'Chomp.'); }
          if (T > 0.7 && T < 1.1) { X.moveEnt(m, Math.cos(m.ca) * 10 * A.dt, Math.sin(m.ca) * 10 * A.dt); if (A.d < m.r + X.me.r + 0.3 && !m.chit) { m.chit = true; X.hurtPet(m.dmg * 1.6, m); X.push(m.ca, 1.8); } }
          if (T > 1.4) { m.chit = false; done(m, 1.8); } break; }
        default: done(m, 1);
      }
    },
  });

  /* ---------- puzzle A: the Sandstorm Flight ----------
     Puff Flight's own flying, in the fossil canyon: your pet flies right on its own; tap anywhere to flap up, and
     gravity pulls it down between flaps. Fossil ribs reach down from the jaw and up from the sand with a gap between:
     fly through. Some ribs sway. Four hearts: a rib or the sand costs one (a moment's shield after), and out of hearts
     the storm carries you back to the last cairn with your hearts restored. Gusts blow up or down after a warning.
     Amber shards hang in some gaps for luck. Twenty gaps and the way opens */
  const GLIDE_LEN = 120, GLIDE_H = 11, GAPS = 20, FLAP = -6.0, GRAV = 19, FALL = 8.4, SPEED = 2.7;
  const glideLayout = (() => { const rows = []; for (let y = 0; y < GLIDE_H; y++) { let r = ''; for (let x = 0; x < GLIDE_LEN; x++) r += (y === 0 || y === GLIDE_H - 1 || x === 0 || x === GLIDE_LEN - 1) ? '#' : (x === 3 && y === 5) ? 'S' : (x === GLIDE_LEN - 3 && y === 5) ? 'E' : '.'; rows.push(r); } return rows; })();
  function makeGlide(X, self, H) {
    const marks = X.M.marks, me = X.me, g = X.g, M = X.M, start = { x: M.start.x, y: M.start.y }, END_X = marks.E[0].x, TOPY = 1.3, BOTY = GLIDE_H - 0.6;
    const R = { mode: 'intro', passed: 0, t: 0, cairn: null, wait: 0, hits: 0, hearts: 4, inv: 0, vy: 0, flapT: 0, wind: 0, windWarn: 0, windT: 6, windDir: 1, shards: 0, flaps: 0 };
    const ribs = [];
    function course() { ribs.length = 0; let x = start.x + 7, i = 0, prev = GLIDE_H / 2; while (x < END_X - 6) { const gap = Math.max(2.6, 3.1 - i * 0.025), lo = TOPY + gap / 2 + 0.2, hi = BOTY - gap / 2 - 0.2, sway = i > 2 && Math.random() < Math.min(0.45, 0.1 + i * 0.02) ? Math.min(1.1, (hi - lo) / 2) : 0; let base = Math.max(lo + sway, Math.min(hi - sway, prev + (Math.random() * 2 - 1) * 2.4)); prev = base;
        ribs.push({ x, base, gapY: base, gapH: gap, sway, ph: Math.random() * TAU, i, passed: false, hitT: 0, shard: Math.random() < 0.5 ? { got: false } : null }); x += 4.3; i++; } }
    H.setExit(END_X, marks.E[0].y, 'The way on');
    function toCairn(refill) { const c = R.cairn || start; me.x = c.x; me.y = c.y; R.vy = 0; me.vx = me.vy = 0; me.push = null; if (refill) R.hearts = 4; R.inv = 1.2; R.mode = 'ready'; R.wait = 1.2; }
    function begin() { R.mode = 'ready'; R.wait = 1.8; X.banner('THE SANDSTORM FLIGHT', 'Tap anywhere to flap · fly through the gaps in the ribs', CYAN, 3.0, true, true); }
    function flap() { if (R.mode === 'ready') { R.mode = 'run'; } if (R.mode !== 'run') return; R.vy = FLAP; R.flapT = 0.22; R.flaps++; X.sfx.boop(); for (let k = 0; k < 3; k++) X.part({ kind: 'sand', x: me.x - 0.3, y: me.y + 0.3, vx: -2 - Math.random() * 2, vy: 1 + Math.random(), life: 0.35, max: 0.35, size: 2.5, color: '#FFE9A8' }); }
    function hit(why) { if (R.inv > 0 || R.mode !== 'run') return; R.hearts--; R.hits++; R.inv = 1.6; X.shake(7, 0.2); X.sfx.crash(); X.boom(me.x, me.y, 0.8, BONE, '#FFFFFF', { n: 10, shake: 4 }); X.text(me.x, me.y - 1.6, why, '#FF9BD2', 13);
      if (R.hearts <= 0) { R.mode = 'rest'; X.banner('OUT OF HEARTS', 'The storm carries you back to the cairn, hearts restored', '#FF9BD2', 2.2, true); X.sfx.wrong(); X.after(1.6, () => { X.flash(0.25, OCHRE); toCairn(true); }); } }
    X.after(1.2, begin);
    return { R, ribs, course, flap,
      tap() { if (self.done || R.mode === 'intro' || R.mode === 'rest') return false; flap(); return true; },
      update(dt) { R.t += dt; for (const rb of ribs) { if (rb.hitT > 0) rb.hitT -= dt; rb.gapY = rb.base + (rb.sway ? Math.sin(R.t * 1.4 + rb.ph) * rb.sway : 0); }
        if (R.flapT > 0) R.flapT -= dt; if (R.inv > 0) R.inv -= dt;
        if (R.mode === 'ready') { if (!ribs.length) course(); R.wait -= dt; me.y = (R.cairn || start).y + Math.sin(R.t * 3) * 0.15; me.vx = me.vy = 0; if (R.wait <= 0) { R.mode = 'run'; X.text(me.x, me.y - 1.6, 'Tap to flap!', CYAN, 14); R.vy = FLAP * 0.6; } return; }
        if (R.mode !== 'run' || me.dead || g.won) return;
        // Puff Flight's flying: carried right, a flap kicks it up, gravity pulls it down; gusts blow after a warning
        R.windT -= dt; if (R.windT <= 0 && !R.windWarn && !R.wind) { R.windWarn = 1.2; R.windDir = Math.random() < 0.5 ? -1 : 1; X.text(me.x + 2, me.y - 2, R.windDir < 0 ? 'Updraft coming ↑' : 'Downdraft coming ↓', CYAN, 12); }
        if (R.windWarn > 0) { R.windWarn -= dt; if (R.windWarn <= 0) { R.windWarn = 0; R.wind = 1.6; } }
        if (R.wind > 0) { R.wind -= dt; R.vy += R.windDir * 6.8 * dt; if (Math.random() < dt * 20) X.part({ kind: 'sand', x: me.x + (Math.random() - 0.5) * 3, y: me.y + (Math.random() - 0.5) * 2, vx: -1, vy: R.windDir * 5, life: 0.4, max: 0.4, size: 2.5, color: CYAN }); if (R.wind <= 0) R.windT = 4 + Math.random() * 3; }
        R.vy = Math.min(R.vy + GRAV * dt, FALL);
        me.x += SPEED * dt; me.y += R.vy * dt; me.vx = me.vy = 0; me.ax = 1; me.ay = 0; me.face = 1; me.wph = (me.wph || 0) + dt * (R.flapT > 0 ? 30 : 12); me.bob += dt * 6;
        me.tilt = Math.max(-0.35, Math.min(0.5, R.vy * 0.06));
        if (me.y < TOPY) { me.y = TOPY; R.vy = Math.max(0, R.vy); }
        if (me.y > BOTY) { me.y = BOTY; R.vy = FLAP * 0.75; hit('The sand! −1 heart'); }
        for (const rb of ribs) { if (Math.abs(me.x - rb.x) > 0.62) { if (!rb.passed && me.x > rb.x + 0.62) { rb.passed = true; R.passed++; X.sfx.coin(); X.text(rb.x, rb.gapY - rb.gapH / 2 - 0.4, `${R.passed}/${GAPS}`, CYAN, 12); if (rb.i % 4 === 3) { R.cairn = { x: rb.x + 1.0, y: rb.gapY }; X.text(rb.x + 1, rb.gapY + 1, 'Cairn', BONE, 11); X.ring(rb.x + 1, rb.gapY, 0.3, 1.5, 0.4, BONE, 0.3); }
                if (R.passed >= GAPS && !self.done) { self.done = true; R.mode = 'won'; me.tilt = 0; H.setExit(Math.min(END_X, me.x + 3), 5.5, 'The way on'); X.banner('THROUGH THE STORM', 'Twenty gaps flown: the storm sets you down; the way opens just ahead', '#8FE0A6', 2.6, true, true); X.flash(0.35, CYAN); X.sfx.fanfare(); } } continue; }
          const inGap = me.y > rb.gapY - rb.gapH / 2 + 0.3 && me.y < rb.gapY + rb.gapH / 2 - 0.3;
          if (!inGap && rb.hitT <= 0 && R.inv <= 0) { rb.hitT = 1; hit('A rib! −1 heart'); }
          if (rb.shard && !rb.shard.got && Math.abs(me.y - rb.gapY) < 0.6) { rb.shard.got = true; R.shards++; X.sfx.sparkle(); X.sparks(rb.x, rb.gapY, AMBER, 8, 4); } }
        if (me.x > END_X - 3 && !self.done) { R.mode = 'rest'; X.banner('THE CANYON ENDS', `${R.passed} of ${GAPS} gaps: the storm turns you back for another pass`, '#FF9BD2', 2.4, true); X.sfx.wrong(); X.after(2.0, () => { R.cairn = null; R.passed = 0; course(); toCairn(true); }); }
      },
      goal() { if (self.done) return 'Through the storm · the way on'; if (R.mode === 'intro') return 'The Sandstorm Flight'; return `Tap to flap · gaps ${R.passed}/${GAPS} · ${'♥'.repeat(Math.max(0, R.hearts))}${'♡'.repeat(4 - Math.max(0, R.hearts))}`; },
      drawGround(c) { const T = X.Tz(), W = X.W();
        // the storm: light sand streaks blowing left
        c.save(); c.globalAlpha = 0.13; c.strokeStyle = '#FFE9A8'; c.lineWidth = 2; for (let i = 0; i < 20; i++) { const wy = 1 + ((i * 37) % 61) / 61 * (GLIDE_H - 2), ph = ((i * 53) % 97) / 97, wx = me.x + 9 - ((ph + R.t * 1.4 + i * 0.1) % 1) * 18; const Xs = X.sx(wx), Ys = X.sy(wy); if (Xs < -20 || Xs > W + 20) continue; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + T * 0.9, Ys); c.stroke(); } c.restore();
        if (R.windWarn > 0 || R.wind > 0) { c.save(); c.globalAlpha = R.wind > 0 ? 0.3 : 0.18 + 0.12 * Math.sin(R.t * 12); c.strokeStyle = CYAN; c.lineWidth = 2.5; for (let k = 0; k < 6; k++) { const xx = X.sx(me.x - 3 + k * 1.4), yy = X.sy(me.y) + (R.windDir < 0 ? 1 : -1) * ((R.t * 90 + k * 40) % 120 - 60); c.beginPath(); c.moveTo(xx - T * 0.3, yy + R.windDir * T * 0.25); c.lineTo(xx, yy - R.windDir * T * 0.15); c.lineTo(xx + T * 0.3, yy + R.windDir * T * 0.25); c.stroke(); } c.restore(); }
        // the ribs: bone pillars from the jaw above and the sand below; the gap between them glows faintly
        for (const rb of ribs) { const Xs = X.sx(rb.x); if (Xs < -60 || Xs > W + 60) continue; const yTop = X.sy(rb.gapY - rb.gapH / 2), yBot = X.sy(rb.gapY + rb.gapH / 2), y0 = X.sy(0.5), y1 = X.sy(GLIDE_H + 0.5), w = T * 0.95;
          c.save(); if (rb.hitT > 0.6) c.translate(Math.sin(R.t * 40) * 3, 0); c.fillStyle = rb.passed ? '#CFC2A0' : BONE; c.strokeStyle = INK; c.lineWidth = 2;
          [[y0, yTop, 1], [yBot, y1, -1]].forEach(([a, b, dir]) => { c.beginPath(); c.moveTo(Xs - w / 2, a); c.lineTo(Xs + w / 2, a); c.lineTo(Xs + w * 0.42, b - dir * T * 0.3); c.quadraticCurveTo(Xs, b + dir * T * 0.25, Xs - w * 0.42, b - dir * T * 0.3); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5; for (let j = 1; j < 4; j++) { const yy = a + (b - a) * j / 4; c.beginPath(); c.moveTo(Xs - w * 0.38, yy); c.lineTo(Xs + w * 0.38, yy); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 2; });
          if (!rb.passed) { c.globalAlpha = 0.14 + 0.06 * Math.sin(R.t * 4); c.fillStyle = CYAN; c.fillRect(Xs - w / 2, yTop + T * 0.2, w, yBot - yTop - T * 0.4); c.globalAlpha = 1; }
          if (rb.shard && !rb.shard.got) { const sy2 = X.sy(rb.gapY) + Math.sin(R.t * 3 + rb.ph) * T * 0.08; glowAt(c, Xs, sy2, T * 0.45, AMBER, 0.5); c.fillStyle = AMBER; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Xs, sy2 - T * 0.25); c.lineTo(Xs + T * 0.15, sy2); c.lineTo(Xs, sy2 + T * 0.25); c.lineTo(Xs - T * 0.15, sy2); c.closePath(); c.fill(); c.stroke(); }
          c.restore(); }
        if (R.cairn) { const Xs = X.sx(R.cairn.x), Ys = X.sy(R.cairn.y + 0.6); c.save(); c.fillStyle = BONE; c.strokeStyle = INK; c.lineWidth = 1.5; [[0, 0, 0.3], [0, -0.35, 0.22], [0, -0.6, 0.15]].forEach(([dx, dy, r]) => { c.beginPath(); c.ellipse(Xs + dx * T, Ys + dy * T, r * T, r * T * 0.7, 0, 0, TAU); c.fill(); c.stroke(); }); c.restore(); }
        // a blink while the pet is shielded after a hit
        if (R.inv > 0 && R.mode === 'run') { const Xs = X.sx(me.x), Ys = X.sy(me.y) - T * 0.5; c.save(); c.globalAlpha = 0.25 + 0.25 * Math.sin(R.t * 20); c.strokeStyle = '#FFFFFF'; c.lineWidth = 2; c.beginPath(); c.arc(Xs, Ys, T * 0.7, 0, TAU); c.stroke(); c.restore(); }
      },
      drawOver(c) { if (R.mode === 'intro' || self.done) return; const W = X.W(); c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, 10, 124, Math.min(250, W - 130), 22, 8); c.fill(); c.font = `800 11px ${arcFont}`; c.textAlign = 'left'; c.fillStyle = '#FFFFFF'; c.fillText(`Tap to flap · gaps ${R.passed}/${GAPS}`, 18, 139); c.fillStyle = '#FF7A9A'; c.fillText(`${'♥'.repeat(Math.max(0, R.hearts))}${'♡'.repeat(4 - Math.max(0, R.hearts))}`, 160, 139);
        if (R.mode === 'ready') { c.font = `800 16px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText('Tap to fly!', W / 2, X.H() * 0.72); c.fillText('Tap to fly!', W / 2, X.H() * 0.72); } c.restore(); },
    };
  }
  const GLIDE = { name: 'The Sandstorm Flight', goal: 'Fly through twenty gaps in the fossil ribs', how: `Puff Flight in the fossil canyon: your pet flies right on its own. Tap anywhere to flap up; between flaps it falls. Fossil ribs reach down from the jaw and up from the sand: fly through the gap in each (some sway). Four hearts: hitting a rib or the sand costs one, with a moment's shield after; out of hearts, the storm carries you back to the last cairn (every fourth gap) with your hearts restored. Gusts blow up or down after a warning. ${GAPS} gaps and the way opens.`,
    layout: glideLayout, legend: { E: {} }, make: makeGlide };

  /* ---------- puzzle B: the Echo Chamber ----------
     Six resonator stones round a bowl of sand. The jaw hums a sequence: the stones light and ring one after another.
     Repeat it: tap to shoot the stones in the same order. Four rounds, each a note longer. A wrong stone and the jaw
     hums the round again */
  const ECHO_ROUNDS = [3, 4, 5, 6], STONE_COL = ['#62BFC9', '#FFB347', '#B983F5', '#8FE0A6', '#FF8FB8', '#FFE37A'];
  function makeEcho(X, self, H) {
    const marks = X.M.marks, me = X.me, g = X.g, NOTES = ['C', 'D', 'E', 'G', 'A', 'C'];
    const stones = (marks.r || []).map((p, i) => H.obj({ x: p.x, y: p.y, kind: 'resonator', i, r: 0.9, h: 1.6, lit: 0, hitT: 0, label: () => '', draw: resDraw }));
    const R = { mode: 'intro', round: 0, seq: [], at: 0, playing: false, playI: 0, playT: 0, listenT: 0, t: 0, fails: 0 };
    H.setExit(marks.E[0].x, marks.E[0].y, 'The way on');
    function hum() { const n = ECHO_ROUNDS[R.round]; R.seq = []; for (let i = 0; i < n; i++) { let k; do { k = Math.floor(Math.random() * stones.length); } while (i && k === R.seq[i - 1]); R.seq.push(k); } R.at = 0; R.playing = true; R.playI = 0; R.playT = 0.6; X.banner(`ROUND ${R.round + 1} OF ${ECHO_ROUNDS.length}`, `Listen: ${n} notes. Then shoot the stones in that order`, CYAN, 2.2, true); }
    function ring(k, good) { const s = stones[k], SC = STONE_COL[k % 6]; s.lit = 1; s.hitT = 0.15; X.ring(s.x, s.y, 0.3, 2.0, 0.5, good === false ? '#FF5C5C' : SC, 0.35); X.sfx.chirp(); X.text(s.x, s.y - 1.9, good === false ? '✗' : `${k + 1}`, good === false ? '#FF5C5C' : SC, 15); }
    X.after(1.2, () => { R.mode = 'play'; X.banner('THE ECHO CHAMBER', 'The jaw hums a sequence; repeat it by shooting the stones', CYAN, 2.6, true, true); X.after(2.4, hum); });
    return { R, stones, hum, ring,
      hint() { return null; },
      update(dt) { R.t += dt; for (const s of stones) { if (s.lit > 0) s.lit = Math.max(0, s.lit - dt * 1.6); if (s.hitT > 0) s.hitT -= dt; } if (R.mode !== 'play' || g.won || me.dead) return;
        if (R.playing) { R.playT -= dt; if (R.playT <= 0) { if (R.playI < R.seq.length) { ring(R.seq[R.playI]); R.playI++; R.playT = 0.75; } else { R.playing = false; stones.forEach(q => { q.hitT = 0; }); X.text(me.x, me.y - 1.6, 'Your turn', '#FFFFFF', 13); } } return; }
        // the pet's bolts strike the stones
        for (const b of (X.shots || [])) { if (b.life <= 0) continue; for (const s of stones) if (s.hitT <= 0 && Math.hypot(b.x - s.x, b.y - s.y) < 0.75) { b.life = 0; const want = R.seq[R.at];
            if (s.i === want) { ring(s.i, true); R.at++; if (R.at >= R.seq.length) { R.round++; X.sfx.fanfare(); if (R.round >= ECHO_ROUNDS.length) { self.done = true; R.mode = 'won'; X.banner('THE JAW FALLS QUIET', 'Every echo answered: the way opens', '#8FE0A6', 2.6, true, true); X.flash(0.35, CYAN); stones.forEach(q => { q.lit = 1; }); } else { X.banner('ECHOED', `${R.round} of ${ECHO_ROUNDS.length} rounds`, '#8FE0A6', 1.6, true); R.playing = true; R.playI = 0; R.playT = 1.8; R.seq = []; X.after(1.6, hum); } } }
            else { ring(s.i, false); R.fails++; R.at = 0; X.sfx.wrong(); X.banner('A WRONG NOTE', 'The jaw hums the round again', '#FF9BD2', 1.6, true); R.playing = true; R.playI = 0; R.playT = 1.8; }
            break; } } },
      goal() { if (self.done) return 'The jaw falls quiet · the way on'; if (R.mode === 'intro') return 'The Echo Chamber'; return R.playing ? `Round ${R.round + 1} · listen…` : `Round ${R.round + 1} · shoot the stones in order · ${R.at}/${R.seq.length}`; },
      drawGround(c) { const T = X.Tz(); if (R.playing || self.done) return; for (let i = 0; i < R.at; i++) { const s = stones[R.seq[i]]; const Xs = X.sx(s.x), Ys = X.sy(s.y); c.save(); c.fillStyle = '#8FE0A6'; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(Xs, Ys + T * 0.5, T * 0.12, 0, TAU); c.fill(); c.stroke(); c.restore(); } },
    };
  }
  const resDraw = (c, Xs, Ys, T, o) => { const k = o.lit, SC = STONE_COL[o.i % 6]; c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, T * 0.15, T * 0.6, T * 0.22, 0, 0, TAU); c.fill(); glowAt(c, 0, -T * 0.8, T * (0.55 + k), SC, 0.12 + 0.6 * k); c.fillStyle = BASALT; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(-T * 0.45, 0); c.lineTo(-T * 0.3, -T * 1.5); c.lineTo(T * 0.3, -T * 1.5); c.lineTo(T * 0.45, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = k > 0 ? '#FFFFFF' : SC; c.globalAlpha = 0.75 + 0.25 * k; for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(0, -T * (0.4 + i * 0.4), T * (0.22 - i * 0.04), T * 0.08, 0, 0, TAU); c.fill(); } c.globalAlpha = 1; c.font = `800 ${Math.round(T * 0.26)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.fillStyle = SC; c.strokeText(`${o.i + 1}`, 0, -T * 1.75); c.fillText(`${o.i + 1}`, 0, -T * 1.75); c.restore(); };
  const ECHO = { name: 'The Echo Chamber', goal: 'Repeat the jaw\'s sequences on the resonator stones', how: 'Six resonator stones stand round the bowl. The jaw hums a sequence: the stones light and ring one after another. Then shoot the stones in the same order (tap toward a stone). Four rounds, each a note longer. Shoot a wrong stone and the jaw hums the round again.',
    layout: ['#############', '#.....E.....#', '#...........#', '#...r...r...#', '#...........#', '#..r..S..r..#', '#...........#', '#...r...r...#', '#...........#', '#############'],   // (six stones in a tight ring round the pet: all of them on a phone's screen at once)
    legend: { r: {}, E: {} }, make: makeEcho };

  /* ---------- puzzle C: the Grub Mounds ----------
     Thirteen sand mounds in the bowl. A mound trembles, then a hollow grub bursts up and sits for a moment before it dives:
     shoot it (or strike it) while it is up. Echo mantas rise too, hooded and glowing cyan: leave those be, hitting one
     costs two. Thirty grubs and the sand goes still */
  const GRUBS_NEED = 30;
  function makeMounds(X, self, H) {
    const marks = X.M.marks, me = X.me, g = X.g;
    const mounds = (marks.n || []).map((p, i) => ({ x: p.x, y: p.y, i, state: 'idle', t: 0, kind: 'grub' }));
    const R = { mode: 'intro', hits: 0, spawnT: 1.5, t: 0, streak: 0 };
    H.setExit(marks.E[0].x, marks.E[0].y, 'The way on');
    X.after(1.2, () => { R.mode = 'play'; X.banner('THE GRUB MOUNDS', `Grubs burst from the mounds: shoot them while they are up. Leave the cyan mantas. ${GRUBS_NEED} to still the sand`, AMBER, 3.0, true, true); });
    const hitMound = (mo, how) => { if (mo.kind === 'manta') { R.hits = Math.max(0, R.hits - 2); R.streak = 0; X.boom(mo.x, mo.y, 1.0, CYAN, '#FFFFFF', { n: 10, shake: 5 }); X.text(mo.x, mo.y - 1.4, 'A manta! −2', CYAN, 13); X.sfx.wrong(); } else { R.hits++; R.streak++; X.boom(mo.x, mo.y, 0.9, OCHRE, '#FFFFFF', { n: 10, shake: 2 }); X.sfx.pop(); X.text(mo.x, mo.y - 1.4, R.streak >= 5 && R.streak % 5 === 0 ? `${R.streak} in a row!` : `${R.hits}/${GRUBS_NEED}`, AMBER, 12); } mo.state = 'idle'; mo.t = 0;
      if (R.hits >= GRUBS_NEED && !self.done) { self.done = true; R.mode = 'won'; X.banner('THE SAND GOES STILL', 'Thirty grubs down: the way opens', '#8FE0A6', 2.6, true, true); X.flash(0.35, AMBER); X.sfx.fanfare(); } };
    return { R, mounds, hitMound,
      update(dt) { R.t += dt; if (R.mode !== 'play' || g.won || me.dead) return;
        R.spawnT -= dt; if (R.spawnT <= 0) { R.spawnT = Math.max(0.45, 1.3 - R.hits * 0.025); const idle = mounds.filter(m => m.state === 'idle'); if (idle.length) { const mo = idle[Math.floor(Math.random() * idle.length)]; mo.state = 'tremble'; mo.t = 0; mo.kind = R.hits >= 5 && Math.random() < 0.25 ? 'manta' : 'grub'; mo.up = Math.max(0.9, 1.7 - R.hits * 0.02); } }
        for (const mo of mounds) { mo.t += dt; if (mo.state === 'tremble' && mo.t > 0.6) { mo.state = 'up'; mo.t = 0; X.sparks(mo.x, mo.y, OCHRE, 6, 4); X.sfx.thud(); } else if (mo.state === 'up' && mo.t > mo.up) { mo.state = 'idle'; mo.t = 0; if (mo.kind === 'grub') { R.streak = 0; X.text(mo.x, mo.y - 1, 'Dived', '#CFC2A0', 11); } }
          if (mo.state === 'up' && Math.hypot(me.x - mo.x, me.y - mo.y) < 0.9 && mo.kind === 'grub' && (me.dodge || me.dash)) hitMound(mo, 'dash'); }
        for (const b of (X.shots || [])) { if (b.life <= 0) continue; for (const mo of mounds) if (mo.state === 'up' && Math.hypot(b.x - mo.x, b.y - mo.y) < 0.7) { b.life = 0; hitMound(mo, 'shot'); break; } } },
      goal() { if (self.done) return 'The sand goes still · the way on'; if (R.mode === 'intro') return 'The Grub Mounds'; return `Shoot the grubs as they surface · ${R.hits}/${GRUBS_NEED}${R.streak >= 3 ? ` · ${R.streak} in a row` : ''}`; },
      drawGround(c) { const T = X.Tz();
        for (const mo of mounds) { const Xs = X.sx(mo.x), Ys = X.sy(mo.y), tr = mo.state === 'tremble' ? Math.sin(R.t * 40) * 2 : 0; c.save(); c.translate(Xs + tr, Ys);
          c.fillStyle = OCHRE; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, 0, T * 0.7, T * 0.38, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#B8894A'; c.beginPath(); c.ellipse(0, -T * 0.05, T * 0.28, T * 0.14, 0, 0, TAU); c.fill();
          if (mo.state === 'tremble') { c.globalAlpha = 0.5 + 0.4 * Math.sin(R.t * 20); c.strokeStyle = mo.kind === 'manta' ? CYAN : AMBER; c.lineWidth = 2; c.beginPath(); c.ellipse(0, 0, T * 0.9, T * 0.5, 0, 0, TAU); c.stroke(); }
          if (mo.state === 'up') { const u = Math.min(1, mo.t * 6), h = T * 1.1 * u, left = 1 - mo.t / mo.up; c.save(); c.translate(0, -h * 0.1);
            if (mo.kind === 'manta') { glowAt(c, 0, -h * 0.7, T * 0.9, CYAN, 0.5); c.fillStyle = '#1E1A26'; c.strokeStyle = CYAN; c.lineWidth = 2; c.beginPath(); c.moveTo(-T * 0.8, -h * 0.5); c.quadraticCurveTo(0, -h * 1.2, T * 0.8, -h * 0.5); c.quadraticCurveTo(0, -h * 0.3, -T * 0.8, -h * 0.5); c.closePath(); c.fill(); c.stroke(); c.fillStyle = CYAN; c.beginPath(); c.arc(-T * 0.15, -h * 0.6, T * 0.06, 0, TAU); c.arc(T * 0.15, -h * 0.6, T * 0.06, 0, TAU); c.fill(); }
            else { const gr = c.createLinearGradient(0, -h, 0, 0); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, '#D8CDB0'); c.fillStyle = gr; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(-T * 0.32, 0); c.quadraticCurveTo(-T * 0.4, -h * 0.6, 0, -h); c.quadraticCurveTo(T * 0.4, -h * 0.6, T * 0.32, 0); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(-T * 0.28, -h * k / 4); c.lineTo(T * 0.28, -h * k / 4); c.stroke(); } c.fillStyle = AMBER; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -h * 0.75, T * 0.12, 0, TAU); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(0, -h * 0.75, T * 0.05, 0, TAU); c.fill();
              c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 4; c.beginPath(); c.arc(0, -h - T * 0.25, T * 0.2, 0, TAU); c.stroke(); c.strokeStyle = AMBER; c.lineWidth = 2.5; c.beginPath(); c.arc(0, -h - T * 0.25, T * 0.2, -Math.PI / 2, -Math.PI / 2 + TAU * left); c.stroke(); }
            c.restore(); }
          c.restore(); } },
    };
  }
  const MOUNDS = { name: 'The Grub Mounds', goal: 'Shoot the grubs as they surface', how: `Thirteen mounds in the bowl. One trembles, then a hollow grub bursts up and sits for a moment (a ring over it counts down) before it dives: tap toward it to shoot it while it is up, or dodge into it. Echo mantas rise too, hooded and glowing cyan: leave those be, hitting one costs two grubs. ${GRUBS_NEED} grubs and the sand goes still.`,
    layout: ['########################', '#...........E..........#', '#......................#', '#...n.....n.....n......#', '#......................#', '#.......n.....n........#', '#...n.....n.....n......#', '#......................#', '#.......n.....n........#', '#...n.....n.....n......#', '#......................#', '#...........S..........#', '########################'],
    legend: { n: {}, E: {} }, make: makeMounds };

  /* ---- the rift ---- */
  const SEALING = { fall: 'THE JAW CLOSES', sub: 'The sand runs out of the fossil mouth', sigil: 'THE ECHO SIGIL', name: 'The Mouth Beneath the Dunes', color: CYAN };
  defRift({
    ease: 0.6,   // (forty percent gentler than first built: health and blows of everything here)
    id: 'dunes', n: 3, name: 'The Mouth Beneath the Dunes', lvl: 30, sigil: 'Echo', biome: 'dunes', aff: ['earth', 'wind'], region: 'the desert',
    blurb: 'A desert swallowed by a fossil jaw. Glide its storms, answer its echoes, still its sands.', gate: { anima: 'scorpio', name: 'The Amber Vigil' },
    mons: ['skitter', 'grub', 'manta'], sealing: SEALING,
    stages: riftSections([
      { pattern: ['fight', 'fight', 'puzzle', 'boss'], mods: ['random', 'random'], fights: ['The Buried Road', 'The Tooth Courts'], minis: ['sandpet'], puzzles: [GLIDE], boss: 'sarrukh', bossName: 'Sarrukh the Bloom Serpent', bossRoom: 'The Gullet' },
      { biome: 'mesa', pattern: ['puzzle', 'fight', 'fight', 'boss'], mods: ['random', 'random'], fights: ['The Rust Flats', 'The Crystal Scar'], minis: ['echopet'], puzzles: [ECHO], boss: 'oneira', bossName: 'Oneira the Listening Shell', bossRoom: 'The Whorl' },
      { biome: 'nightdune', mobs: ['skelwar', 'skelarcher', 'skelwar', 'skitter'], pattern: ['fight', 'puzzle', 'fight', 'boss'], mods: ['random', 'random'], fights: ['The Moonlit Barrows', 'The Throat of Sand'], minis: ['jawpet'], puzzles: [MOUNDS], boss: 'thulammon', bossName: 'Thul-Ammon the Sand Kraken', bossRoom: 'The Pit Beneath the Jaw' },
    ]),
  });
})();
