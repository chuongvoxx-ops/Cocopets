/* ---------- Rift 1: The Drowned Belfry (level 10, Water and Dark, the Tide Sigil) ----------
   A coastal bell tower sunk halfway into an alien sea. Fourteen stages in three sections:
     1  the Flooded Narthex (Kharrox) > the Clapper Counterweights > the Choir Stalls > the Rising Tide Walk > THALASSOR
     2  the Drowned Cloister (Nhalu) > the Wardstone Vestibule (three crystals, 20 s each) > the Organ Loft > the Rushing
        Gallery (a runner: gather the drowned light) > VEILWRACK
     3  the Rising Galleries (a boon on the monsters; Uldroth) > the Drowned Mosaic (match three with the party's pets) >
        the Belfry Stair (a curse on the party) > ULVORA, and the sealing.
   Original creatures: the brood of a drowned thing. */
(() => {
  const TAU = Math.PI * 2;
  /* ---- the land ---- */
  BIOMES.belfry = { name: 'The Drowned Belfry', rift: true, tile: 'halls', out: false, dark: 0.22, bg: '#0A2432', gap: 'water', mud: ['#1D4A5E', '#27657C'], mudSpot: 'rgba(120,210,235,.22)', ambient: 'motes', accent: '#61D9D2', light: '#9FE8FF',
    floor: ['#C8CCBC', '#C0C5B5', '#B8BDAE'], grout: '#8E9A93', hi: '#E2E6D8', top: '#3E6F7A', face: '#1F4552', faceD: '#123C52', cliff: '#123C52', deco: '#957943',
    props: ['pillar', 'brokenpillar', 'barrel'], hazard: 'spikes', grade: 'rgba(40,120,150,.08)', fog: '#06141C', darkRGB: '6,20,30' };
  BIOME_ORDER.push('belfry');
  /* ---- the brood ---- */
  Object.assign(MON, {
    crawler: { name: 'Brine crawler', from: 999, hp: 110, spd: 1.7, r: 0.42, dmg: 11, xp: 9, coin: 0.5, color: '#4F7F8C', bio: ['belfry'], tip: 'Sidesteps, raises both claws, then pinches straight ahead. Step to its side.', kit: [] },
    leech: { name: 'Bell leech', from: 999, hp: 70, spd: 0.5, r: 0.3, dmg: 8, xp: 6, coin: 0.4, color: '#6B4FA8', bio: ['belfry'], still: true, tip: 'Clings to a valve and spits slow droplets. A valve cannot be turned while a leech holds it.', kit: [] },
    reeflantern: { name: 'Reef lantern', from: 999, hp: 60, spd: 1.2, r: 0.34, dmg: 6, xp: 7, coin: 0.5, color: '#9FD8F0', bio: ['belfry'], fly: true, tip: 'Brightens, then heals every monster near it. Hit it while it brightens to stop the pulse.', kit: [] },
  });
  const { LN, lwOf, shade, stroke, spec, MP, NF, EXT } = DunArt;
  const glowAt = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a flattened hexagonal crab: four short legs, two rectangular claws, one turquoise eye under its front lip */
    crawler(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, st2 = Math.sin(ph * TAU), raise = o.mode === 'block' ? 1 : 0.35 + 0.25 * st2;
      [[-0.5, 0.55], [-0.15, 0.7], [0.2, 0.7], [0.55, 0.55]].forEach(([x, y], i) => limb(c, x * r, r * 0.2, x * r + (i % 2 ? st2 : -st2) * r * 0.12, y * r + r * 0.25, lw * 1.3, shadeC(col, -0.15)));
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6, x = Math.cos(a) * r * 1.05, y = Math.sin(a) * r * 0.62; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath();
      c.fillStyle = shade(c, col, r, 0, -r * 0.15, 0.45); c.fill(); stroke(c, lw);
      c.fillStyle = shadeC(col, 0.25); c.beginPath(); c.ellipse(-r * 0.1, -r * 0.2, r * 0.55, r * 0.22, 0, 0, TAU); c.fill();
      // the claws: rectangles on short arms, raised before a pinch
      [-1, 1].forEach(sd => { const ax = r * 0.75, ay = sd * r * 0.5, cx = r * 1.35, cy = sd * r * (0.55 - raise * 0.3); limb(c, ax, ay, cx - r * 0.2, cy, lw * 1.2, shadeC(col, -0.1));
        c.fillStyle = shade(c, shadeC(col, 0.1), r * 0.3, cx, cy, 0.4); c.beginPath(); c.rect(cx - r * 0.22, cy - r * 0.2, r * 0.5, r * 0.4); c.fill(); stroke(c, lw * 0.9); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(cx + r * 0.28, cy); c.lineTo(cx + r * 0.02, cy); c.stroke(); });
      glowAt(c, r * 0.7, r * 0.12, r * 0.3, '#61D9D2', 0.8); c.fillStyle = '#61D9D2'; c.beginPath(); c.arc(r * 0.7, r * 0.12, r * 0.13, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(r * 0.66, r * 0.08, r * 0.05, 0, TAU); c.fill();
    },
    /* a violet teardrop with a round pale mouth, a brass ring round its neck */
    leech(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, sq = 1 + 0.08 * Math.sin(ph * TAU);
      c.beginPath(); c.moveTo(-r * 1.3, 0); c.quadraticCurveTo(-r * 0.6, -r * 0.9 * sq, r * 0.3, -r * 0.75 * sq); c.quadraticCurveTo(r * 1.05, -r * 0.45, r * 1.05, 0); c.quadraticCurveTo(r * 1.05, r * 0.45, r * 0.3, r * 0.75 * sq); c.quadraticCurveTo(-r * 0.6, r * 0.9 * sq, -r * 1.3, 0); c.closePath();
      c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.45); c.fill(); stroke(c, lw);
      c.strokeStyle = '#957943'; c.lineWidth = lw * 1.6; c.beginPath(); c.ellipse(-r * 0.35, 0, r * 0.18, r * 0.62, 0, 0, TAU); c.stroke(); c.strokeStyle = '#FFE9A8'; c.lineWidth = lw * 0.5; c.stroke();
      c.fillStyle = '#F2E8FF'; c.beginPath(); c.arc(r * 0.75, 0, r * 0.3, 0, TAU); c.fill(); stroke(c, lw * 0.8); c.fillStyle = '#2B2433'; c.beginPath(); c.arc(r * 0.78, 0, r * 0.14, 0, TAU); c.fill();
      spec(c, -r * 0.1, -r * 0.4, r * 0.3, r * 0.14, 0.5);
    },
    /* a floating pale pear with three short tassels; its heart brightens before a healing pulse */
    reeflantern(c, r, ph, o) {
      const lw = lwOf(r), col = o.color, bob = Math.sin(ph * TAU) * r * 0.06, bright = o.mode === 'block' ? 1 : 0.35;
      glowAt(c, 0, bob, r * 1.6, '#BFEFFF', 0.25 + 0.45 * bright);
      [-0.3, 0, 0.3].forEach((x, i) => { c.strokeStyle = '#957943'; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(x * r, r * 0.7 + bob); c.quadraticCurveTo(x * r + Math.sin(ph * TAU + i) * r * 0.12, r * 1.1 + bob, x * r, r * 1.4 + bob); c.stroke(); });
      c.beginPath(); c.moveTo(0, -r * 1.05 + bob); c.quadraticCurveTo(r * 0.75, -r * 0.7 + bob, r * 0.8, r * 0.15 + bob); c.quadraticCurveTo(r * 0.8, r * 0.8 + bob, 0, r * 0.8 + bob); c.quadraticCurveTo(-r * 0.8, r * 0.8 + bob, -r * 0.8, r * 0.15 + bob); c.quadraticCurveTo(-r * 0.75, -r * 0.7 + bob, 0, -r * 1.05 + bob); c.closePath();
      c.fillStyle = shade(c, col, r, 0, -r * 0.1 + bob, 0.5); c.fill(); stroke(c, lw);
      glowAt(c, 0, r * 0.1 + bob, r * 0.55, '#FFF4C0', 0.5 + 0.5 * bright); c.fillStyle = `rgba(255,244,192,${0.6 + 0.4 * bright})`; c.beginPath(); c.arc(0, r * 0.1 + bob, r * 0.28, 0, TAU); c.fill();
      spec(c, -r * 0.3, -r * 0.45 + bob, r * 0.2, r * 0.3, 0.5);
    },
  });
  Object.assign(EXT, { crawler: 1.9, leech: 1.7, reeflantern: 1.9 });
  Object.assign(NF, { crawler: 6, leech: 4, reeflantern: 6 });
  const { mon, keepRange, chaseHit } = DunAI;
  Object.assign(mon, {
    crawler(m, A, X) {
      // sidesteps toward you, raises both claws (its claws show it), then a narrow pinch straight ahead
      if (m.pinch > 0) { m.pinch -= A.dt; m.face = A.dx >= 0 ? 1 : -1; if (m.pinch <= 0) { const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.slash(m.x + Math.cos(a) * 0.8, m.y + Math.sin(a) * 0.8, a, 0.9, '#9FE8FF'); if (X.inCone(m.x, m.y, a, 1.7, 0.42)) X.hurtPet(m.dmg * 1.3, m); m.cd = 2.2 + Math.random(); } return; }
      m.side = m.side || (Math.random() < 0.5 ? 1 : -1); m.sideT = (m.sideT || 0) - A.dt; if (m.sideT <= 0) { m.sideT = 1.2 + Math.random(); m.side *= -1; }
      if (A.d > 1.5) { const sx2 = -A.uy * m.side * 0.5 + A.ux, sy2 = A.ux * m.side * 0.5 + A.uy, n = Math.hypot(sx2, sy2) || 1; X.moveEnt(m, sx2 / n * A.sp * A.dt, sy2 / n * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
      else if (m.cd <= 0 && A.los()) { m.pinch = 0.6; m.mode = 'block'; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'cone', x: m.x, y: m.y, a, len: 1.8, spread: 0.42, life: 0.6, max: 0.6, src: m, color: '#9FE8FF' }); }
    },
    leech(m, A, X) {
      // held to its spot; spits slow droplets at you when you come near
      m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd <= 0 && A.d < 6.5 && A.los()) { m.cd = 2.6 + Math.random(); X.lob(m.x, m.y - 0.2, X.me.x, X.me.y, { dur: 1.4, r: 0.8, dmg: m.dmg, kind: 'bubble', src: m, color: '#B6A2F0' }); }
    },
    reeflantern(m, A, X) {
      // hangs back; every few seconds brightens for a moment, then heals every monster near it, unless struck while bright
      if (m.pulse > 0) { m.pulse -= A.dt; m.mode = 'block'; if (m.flash > 0.05 && m.pulseHit !== m.flash) { m.pulse = 0; m.cd = 3; X.text(m.x, m.y - m.r - 0.5, 'Interrupted!', '#FFFFFF', 12); return; }
        if (m.pulse <= 0) { let n = 0; for (const o of X.mons) { if (o === m || o.dead || o.boss) continue; if (Math.hypot(o.x - m.x, o.y - m.y) < 4) { o.hp = Math.min(o.maxhp, o.hp + o.maxhp * 0.25); X.healBeam(m, o); n++; } } X.ring(m.x, m.y, 0.3, 4, 0.5, '#FFF4C0', 0.35); m.cd = 4.5 + Math.random(); } return; }
      keepRange(m, A, X, 3.5, 6);
      if (m.cd <= 0 && X.mons.some(o => o !== m && !o.dead && !o.boss && o.hp < o.maxhp * 0.9 && Math.hypot(o.x - m.x, o.y - m.y) < 4)) { m.pulse = 1.2; m.pulseHit = m.flash; X.text(m.x, m.y - m.r - 0.5, 'It brightens', '#FFF4C0', 12); }
    },
  });

  /* ---- the bosses ---- */
  BOSSES.push(
    { id: 'kharrox', rift: true, name: 'Kharrox the Bellback', title: 'Boss of the baptism floor', hp: 10500, dmg: 15, r: 1.45, spd: 1.35, color: '#2F4F8A', glow: '#61D9D2', biome: 'belfry', el: 'frost' },
    { id: 'nhalu', rift: true, name: 'Nhalu the Lantern Eel', title: 'Boss of the submerged nave', hp: 13000, dmg: 14, r: 1.25, spd: 2.4, color: '#3B2F7A', glow: '#FFC857', biome: 'belfry', el: 'spark', fly: true },
    { id: 'uldroth', rift: true, name: 'Uldroth the Drowned Herald', title: 'Herald of the drowned thing', hp: 26000, dmg: 17, r: 1.7, spd: 1.25, color: '#4C6B5A', glow: '#61D9D2', biome: 'belfry', el: 'bubble' });
  const PT = DunBoss.parts;
  Object.assign(DunBoss.P, {
    /* a crab carrying an upside-down bronze bell as its shell: squat, chipped, three bands; six ivory legs; the left
       claw twice the right; a turquoise eye on a stalk through the bell's crack */
    kharrox(c, m, r, t, me, lw) {
      const col = m.bk.color, rock = Math.sin(t * 2.2) * 0.06, raise = m.act === 'sweep' ? Math.min(1, (m.actT || 0) / 1.2) : 0;
      for (let i = 0; i < 3; i++) [-1, 1].forEach(sd => { const bx = (-0.6 + i * 0.6) * r, by = r * 0.55, ex = bx + sd * r * 0.25 + Math.sin(t * 6 + i) * r * 0.05, ey = r * 0.95; PT.limb(c, bx, by, ex, ey, r * 0.16, r * 0.1, '#E7D9B1', { lw }); });
      PT.orb(c, 0, r * 0.3, r * 1.15, r * 0.5, col, { lw, hi: shadeC(col, 0.3) });
      // the bell, mouth up, chipped on one side
      c.save(); c.translate(0, -r * 0.15); c.rotate(rock);
      c.beginPath(); c.moveTo(-r * 0.95, -r * 0.1); c.quadraticCurveTo(-r * 1.0, -r * 0.9, -r * 0.55, -r * 1.25); c.lineTo(r * 0.5, -r * 1.25); c.lineTo(r * 0.62, -r * 1.05); c.lineTo(r * 0.5, -r * 1.2); c.quadraticCurveTo(r * 1.0, -r * 0.9, r * 0.95, -r * 0.1); c.quadraticCurveTo(0, r * 0.2, -r * 0.95, -r * 0.1); c.closePath();
      c.fillStyle = PT.lit ? '#957943' : '#957943'; c.fillStyle = shade(c, '#957943', r, -r * 0.2, -r * 0.6, 0.45); c.fill(); c.strokeStyle = LN; c.lineWidth = lw * 1.3; c.stroke();
      for (let i = 0; i < 3; i++) { const y = -r * (0.35 + i * 0.28), vib = m.act === 'toll' ? Math.sin(t * 40 + i) * r * 0.02 : 0; c.strokeStyle = '#6A5430'; c.lineWidth = lw * 1.1; c.beginPath(); c.moveTo(-r * (0.86 - i * 0.08) + vib, y); c.lineTo(r * (0.86 - i * 0.08) + vib, y); c.stroke(); c.strokeStyle = '#D9B35F'; c.lineWidth = lw * 0.4; c.beginPath(); c.moveTo(-r * 0.6, y - lw * 0.5); c.lineTo(r * 0.3, y - lw * 0.5); c.stroke(); }
      c.strokeStyle = '#2B2433'; c.lineWidth = lw; c.beginPath(); c.moveTo(r * 0.3, -r * 0.6); c.lineTo(r * 0.42, -r * 0.95); c.lineTo(r * 0.3, -r * 1.2); c.stroke();
      c.restore();
      // the eye on its stalk, through the crack
      const ex = r * 0.4, ey = -r * 0.85; PT.limb(c, r * 0.3, -r * 0.3, ex, ey, r * 0.1, r * 0.08, '#E7D9B1', { lw }); PT.eye(c, ex, ey, r * 0.17, { sclera: '#DFFFF8', iris: '#61D9D2', lookX: me.x > m.x ? 1 : -1, lookY: 0, glow: '#61D9D2' });
      // the claws: the left twice the right, raised for a sweep
      [[-1, 1.0], [1, 0.55]].forEach(([sd, k]) => { const ax = sd * r * 0.9, ay = r * 0.25, cx = sd * r * (1.45 + 0.25 * k), cy = r * (0.35 - raise * 0.9 * k); PT.limb(c, ax, ay, cx, cy, r * 0.22 * k, r * 0.16 * k, '#E7D9B1', { lw });
        c.save(); c.translate(cx, cy); c.rotate(sd * (-0.3 - raise * 0.6)); PT.plate(c, 0, 0, r * 0.9 * k, r * 0.5 * k, r * 0.08, '#D8C9A0', { lw }); c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(sd * r * 0.45 * k, 0); c.lineTo(-sd * r * 0.1 * k, 0); c.stroke(); c.restore(); });
    },
    /* an eel of five curved segments tapering to a paddle tail, milk-white below and indigo above, three amber bulbs
       down its spine, a blunt wedge head with a hinged jaw and two whiskers */
    nhalu(c, m, r, t, me, lw) {
      const col = m.bk.color, dir = m.face || 1, sw = Math.sin(t * 5), lit = m.bulb != null ? m.bulb : -1;
      const pts = []; for (let i = 0; i < 6; i++) { const u = i / 5; pts.push([-dir * r * (0.2 + u * 2.6), Math.sin(t * 5 - u * 4) * r * 0.22]); }
      // the tail paddle
      const tl = pts[5]; c.fillStyle = shadeC(col, -0.1); c.beginPath(); c.ellipse(tl[0] - dir * r * 0.3, tl[1], r * 0.45, r * 0.28, 0.3 * sw, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
      for (let i = 4; i >= 0; i--) { const p = pts[i], w = r * (0.55 - i * 0.07); PT.orb(c, p[0], p[1], w * 1.1, w * 0.8, col, { lw, hi: shadeC(col, 0.35) }); c.fillStyle = '#F2F0FF'; c.beginPath(); c.ellipse(p[0], p[1] + w * 0.35, w * 0.8, w * 0.3, 0, 0, TAU); c.fill();
        if (i < 3) { const on = lit === i, a = on ? 0.95 : 0.5; PT.glow(c, p[0], p[1] - w * 0.6, w * (on ? 1.6 : 0.8), '#FFC857', a * 0.6); c.fillStyle = on ? '#FFE9A8' : '#E0A33A'; c.beginPath(); c.arc(p[0], p[1] - w * 0.6, w * 0.3, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.stroke(); } }
      // the head: a blunt wedge, the jaw hinged open for a bite
      const open = m.act === 'bite' ? 0.5 : 0.12; c.save(); c.translate(dir * r * 0.45, 0); c.scale(dir, 1);
      c.beginPath(); c.moveTo(-r * 0.55, -r * 0.5); c.lineTo(r * 0.75, -r * 0.3); c.quadraticCurveTo(r * 0.95, -r * 0.1, r * 0.75, r * 0.05); c.lineTo(-r * 0.55, r * 0.15); c.closePath(); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.4); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
      c.beginPath(); c.moveTo(-r * 0.5, r * 0.1); c.lineTo(r * 0.7, r * 0.1 + open * r); c.lineTo(r * 0.5, r * 0.3 + open * r); c.lineTo(-r * 0.5, r * 0.4); c.closePath(); c.fillStyle = '#F2F0FF'; c.fill(); c.stroke();
      PT.eye(c, r * 0.2, -r * 0.2, r * 0.13, { sclera: '#FFF8E0', iris: '#FFC857', glow: '#FFC857' });
      c.strokeStyle = '#F2F0FF'; c.lineWidth = lw * 0.7; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(r * 0.8, -r * 0.1); c.quadraticCurveTo(r * 1.2, -r * 0.1 + sd * r * 0.25, r * 1.35, sd * r * 0.1 + sw * r * 0.05); c.stroke(); });
      c.restore();
    },
    /* a pear-shaped amphibious beast on four flippers: a flat anglerfish head with a massive lower jaw, tiny far-set eyes,
       one hooked lure, three ribbed gill fins like a broken crown; slate green, pale below, turquoise throat slits */
    uldroth(c, m, r, t, me, lw) {
      const col = m.bk.color, breath = 1 + 0.05 * Math.sin(t * 1.4), dir = m.face || 1, jaw = m.act === 'jaw' ? Math.min(0.6, (m.actT || 0) * 0.4) : 0.1;
      [[-0.9, 0.6], [0.9, 0.6], [-0.6, 0.85], [0.6, 0.85]].forEach(([x, y], i) => { c.fillStyle = shadeC(col, -0.15); c.beginPath(); c.ellipse(x * r, y * r + Math.sin(t * 2 + i) * r * 0.02, r * 0.5, r * 0.2, x * 0.4, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke(); });
      PT.orb(c, 0, r * 0.1, r * 1.05 * breath, r * 0.9 * breath, col, { lw, hi: shadeC(col, 0.3) });
      c.fillStyle = '#B9C4B8'; c.beginPath(); c.ellipse(0, r * 0.5, r * 0.75 * breath, r * 0.4 * breath, 0, 0, TAU); c.fill();
      for (let i = -1; i <= 1; i++) { PT.glow(c, i * r * 0.28, r * 0.35, r * 0.25, '#61D9D2', 0.5 + 0.3 * Math.sin(t * 3 + i)); c.fillStyle = '#61D9D2'; c.beginPath(); c.ellipse(i * r * 0.28, r * 0.35, r * 0.06, r * 0.2, 0, 0, TAU); c.fill(); }
      // the gill fins behind the head
      for (let i = 0; i < 3; i++) { const a = -1.9 + i * 0.5; c.fillStyle = shadeC(col, 0.1); c.beginPath(); c.moveTo(0, -r * 0.6); c.lineTo(Math.cos(a) * r * 1.1, -r * 0.6 + Math.sin(a) * r * 1.1); c.lineTo(Math.cos(a + 0.3) * r * 0.9, -r * 0.6 + Math.sin(a + 0.3) * r * 0.9); c.closePath(); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke(); }
      // the head: flattened, with the great lower jaw
      c.save(); c.translate(dir * r * 0.25, -r * 0.55); c.scale(dir, 1);
      c.beginPath(); c.ellipse(0, 0, r * 0.95, r * 0.45, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.45); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
      c.beginPath(); c.moveTo(-r * 0.7, r * 0.15); c.quadraticCurveTo(r * 0.3, r * (0.2 + jaw * 1.2), r * 1.05, r * (0.05 + jaw * 0.6)); c.quadraticCurveTo(r * 0.5, r * 0.35, -r * 0.7, r * 0.15); c.closePath(); c.fillStyle = '#A7B8AE'; c.fill(); c.stroke();
      PT.teeth(c, r * 0.3, r * (0.2 + jaw * 0.5), r * 0.7, r * 0.2, Math.PI + 0.3, TAU - 0.3, 7, r * 0.14, '#F2EFE4', true);
      PT.eye(c, -r * 0.55, -r * 0.15, r * 0.07, { sclera: '#FFFFFF', iris: '#1C2E2A' }); PT.eye(c, r * 0.55, -r * 0.15, r * 0.07, { sclera: '#FFFFFF', iris: '#1C2E2A' });
      c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(r * 0.2, -r * 0.4); c.quadraticCurveTo(r * 0.5, -r * 1.1, r * 0.95, -r * 0.95); c.stroke(); PT.glow(c, r * 0.95, -r * 0.95, r * 0.35, '#9FE8FF', 0.8); c.fillStyle = '#DFFFF8'; c.beginPath(); c.arc(r * 0.95, -r * 0.95, r * 0.1, 0, TAU); c.fill();
      c.restore();
    },
  });
  Object.assign(DunBoss.REACH, { kharrox: 3.4, nhalu: 3.6, uldroth: 3.4 });

  /* ---- how they fight (the stage module holds the arena's valves and water: X.rift) ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.65 : 1); m.actT = 0; m.step = 0; };
  Object.assign(DunAI.boss, {
    kharrox(m, A, X, B) {
      const RT = X.rift && X.rift.self.mod;
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; if (m.phase >= 2 && !m.summoned && m.cd <= 0) { m.summoned = true; m.act = 'summon'; m.actT = 0; m.step = 0; return; } return pick(m, X, m.phase >= 2 ? ['sweep', 'toll', 'sweep', 'toll'] : ['sweep', 'toll', 'sweep']); }
      const T = m.actT;
      switch (m.act) {
        case 'sweep': {   // the great claw rises for 2.5 s, then a 120-degree sweep in front: get behind the smaller claw
          if (m.step === 0) { m.step = 1; m.sa = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.sa) >= 0 ? 1 : -1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.sa, len: 4.2, spread: 1.05, life: 2.5, max: 2.5, src: m, color: '#9FE8FF', follow: m, fn: () => { if (X.inCone(m.x, m.y, m.sa, 4.2, 1.05)) X.hurtPet(m.dmg * 1.6, m); X.slash(m.x + Math.cos(m.sa) * 2, m.y + Math.sin(m.sa) * 2, m.sa, 2.6, '#DFFFF8'); X.shake(10, 0.4); X.sfx.crash(); } }); X.say(m, 'Clack.'); }
          if (T > 2.9) done(m, 1.6); break; }
        case 'toll': {   // the bands vibrate, then a widening ring with one opening: walk through it
          if (m.step === 0) { m.step = 1; X.say(m, 'Tolling...'); X.ring(m.x, m.y, 0.3, 1.2, 1.1, '#FFC857', 0.3); }
          if (T > 1.1 && m.step === 1) { m.step = 2; X.ringWave(m.x, m.y, { speed: 3.6, gaps: 1, dmg: m.dmg * 1.3, color: '#957943', life: 2.4, w: 0.5 }); X.shake(8, 0.3); X.sfx.hum(); }
          if (T > 1.6) done(m, 2.2); break; }
        case 'summon': { if (m.step === 0) { m.step = 1; X.say(m, 'Brood, come.'); for (let i = 0; i < 2; i++) { const a = i * Math.PI + 0.8, p = X.walkPoint(m.x + Math.cos(a) * 2.2, m.y + Math.sin(a) * 2.2, m); const c2 = X.spawnMon('crawler', p.x, p.y, { aggro: true, pack: 500 }); X.g.total++; X.sparks(p.x, p.y, '#61D9D2', 10, 5); } } if (T > 1) done(m, 1.4); break; }
        default: done(m, 1);
      }
    },
    nhalu(m, A, X, B) {
      const RT = X.rift && X.rift.self.mod, lanes = RT && RT.lanes;
      if (m.beachT > 0) { m.beachT -= A.dt; m.bulb = -1; if (m.beachT <= 0) { X.say(m, 'It slips back.'); done(m, 1); } return; }
      // swims the lanes: keeps to the water, out of your reach but never far
      if (m.act === 'move') { const ty = lanes ? lanes.yOf(m.lane == null ? (m.lane = 1) : m.lane) : X.me.y; const dx = X.me.x - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1; X.moveEnt(m, dx / d * B.spd * A.dt * (Math.abs(dx) > 3 ? 1 : 0.4), dy / d * B.spd * A.dt, 1); m.face = dx >= 0 ? 1 : -1; m.bulb = -1;
        if (m.cd <= 0 && m.laneT == null) m.laneT = 0; return pick(m, X, m.phase >= 2 ? ['hunt', 'bite', 'hunt'] : ['hunt', 'bite']); }
      const T = m.actT;
      switch (m.act) {
        case 'hunt': {   // a bulb lights and throws its symbol onto the next charged lane: leave it before the discharge
          if (m.step === 0) { m.step = 1; m.bulb = Math.floor(Math.random() * 3); const n = m.phase >= 2 ? 2 : 1, first = lanes ? lanes.laneOf(X.me.y) : 0; m.hunt = [first]; if (n > 1) m.hunt.push((first + 1 + Math.floor(Math.random() * 2)) % 3);
            m.hunt.forEach((ln, i) => { X.after(i * 1.4, () => { if (m.dead || !lanes) return; const y = lanes.yOf(ln); X.warn({ shape: 'line', x: lanes.x0, y, a: 0, len: lanes.len, w: lanes.w, life: 2.5, max: 2.5, src: m, color: '#FFC857', fn: () => { if (X.inLine(lanes.x0, y, 0, lanes.len, lanes.w)) X.hurtPet(m.dmg * 1.7, m); X.beamFx(lanes.x0, y, 0, lanes.len, '#FFE9A8'); X.bolt(lanes.x0 + lanes.len * 0.5, y, '#FFE9A8'); X.sfx.zap && X.sfx.zap(); X.shake(7, 0.3); } }); }); });
            X.say(m, 'Thunderwater.'); }
          if (T > 3.2 + (m.phase >= 2 ? 1.4 : 0)) done(m, 1.8); break; }
        case 'bite': {   // a lunge along its lane at you
          if (m.step === 0) { m.step = 1; m.ba = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ba, len: 5, w: 1.1, life: 0.8, max: 0.8, src: m, color: '#F2F0FF' }); }
          if (T > 0.8 && T < 1.4) { X.moveEnt(m, Math.cos(m.ba) * 9 * A.dt, Math.sin(m.ba) * 9 * A.dt, 1); m.face = Math.cos(m.ba) >= 0 ? 1 : -1; if (A.d < m.r + X.me.r + 0.2 && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.3, m); m.atkCd = 1; } }
          if (T > 1.6) done(m, 1.6); break; }
        default: done(m, 1);
      }
    },
    uldroth(m, A, X, B) {
      const RT = X.rift && X.rift.self.mod;
      if (RT && RT.bossTick) RT.bossTick(m, A.dt);
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.25)); m.face = A.dx >= 0 ? 1 : -1;
        const list = m.phase === 1 ? ['jaw', 'undertow', 'jaw'] : m.phase === 2 ? ['jaw', 'bell', 'undertow', 'bell'] : ['halves', 'jaw', 'halves', 'bell'];
        if (RT && RT.flood > 0 && list.includes('bell')) return pick(m, X, ['jaw', 'undertow']);
        return pick(m, X, list); }
      const T = m.actT;
      switch (m.act) {
        case 'jaw': {   // Jaw of the Deep: a long cone in front, 2.5 s coming
          if (m.step === 0) { m.step = 1; m.ja = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.ja) >= 0 ? 1 : -1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.ja, len: 7, spread: 0.5, life: 2.5, max: 2.5, src: m, color: '#9FE8FF', follow: m, fn: () => { if (X.inCone(m.x, m.y, m.ja, 7, 0.5)) X.hurtPet(m.dmg * 1.8, m); X.beamFx(m.x, m.y, m.ja, 7, '#61D9D2'); X.shake(10, 0.4); X.sfx.crash(); } }); X.say(m, 'Hrrrooom.'); }
          if (T > 2.9) done(m, 1.5); break; }
        case 'undertow': {   // a pull toward it, then a burst at its feet: run outward while the pull is weak
          if (m.step === 0) { m.step = 1; X.warn({ x: m.x, y: m.y, r: 3.2, life: 1.8, max: 1.8, src: m, follow: m, color: '#7FD3F2', fn: () => { if (A.d < 3.2 + X.me.r) X.hurtPet(m.dmg * 2, m); X.boom(m.x, m.y, 3.2, '#7FD3F2', '#FFFFFF', { n: 30, shake: 12 }); X.splash(m.x, m.y, 3); } }); X.say(m, 'Come down...'); }
          if (T < 1.8 && T > 0.2) { const a = Math.atan2(m.y - X.me.y, m.x - X.me.x); X.me.x += Math.cos(a) * 1.3 * A.dt; X.me.y += Math.sin(a) * 1.3 * A.dt; }
          if (T > 2.2) done(m, 1.6); break; }
        case 'bell': {   // Drowning Bell: the water rises; turn the lit valve to raise its refuge and shelter on it
          if (m.step === 0) { m.step = 1; if (RT && RT.drowningBell) RT.drowningBell(m); X.say(m, 'The bell drowns.'); }
          if (T > 1.2) done(m, 3.5); break; }
        case 'halves': {   // half the arena at a time, the marked half
          if (m.step === 0) { m.step = 1; if (RT && RT.halfWave) RT.halfWave(m); X.say(m, 'Break.'); }
          if (T > 1.4) done(m, 2.6); break; }
        default: done(m, 1);
      }
    },
  });

  /* ---- the stages ---- */
  const KC = '#61D9D2', BRASS = '#957943';
  /* a brass wheel beside a pipe, turned by standing at it */
  const wheelDraw = (c, Xs, Ys, T, o) => { const r = T * 0.32, a = o.spin || 0; c.save(); c.translate(Xs, Ys - T * 0.25);
    c.fillStyle = '#3A4466'; c.strokeStyle = LN; c.lineWidth = 1.5; GFX.rr(c, -T * 0.42, -T * 0.08, T * 0.84, T * 0.3, 4); c.fill(); c.stroke();
    c.rotate(a); c.strokeStyle = LN; c.lineWidth = r * 0.32; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = o.on ? '#D9B35F' : BRASS; c.lineWidth = r * 0.2; c.stroke();
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * Math.PI / 2) * r, Math.sin(i * Math.PI / 2) * r); c.strokeStyle = LN; c.lineWidth = r * 0.24; c.stroke(); c.strokeStyle = o.on ? '#D9B35F' : BRASS; c.lineWidth = r * 0.12; c.stroke(); }
    c.fillStyle = o.on ? '#FFE9A8' : BRASS; c.beginPath(); c.arc(0, 0, r * 0.22, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = 1.2; c.stroke(); c.restore(); };
  const leechHolds = (X, o) => X.mons.some(m => !m.dead && m.type === 'leech' && Math.hypot(m.x - o.x, m.y - o.y) < 2.2);
  const row = (a, n) => a.repeat(n);
  const PACK = { c: { mons: ['crawler', 'crawler', 'crawler', 'reeflantern'] }, d: { mons: ['crawler', 'crawler'] }, l: { mons: ['leech', 'leech'] }, k: { mons: ['crawler', 'crawler', 'crawler', 'reeflantern'] }, j: { mons: ['leech', 'reeflantern'] }, h: { mons: ['crawler', 'crawler', 'crawler'] } };


  /* ---- the puzzles (each section has its own kind, played twice: the second room harder) ---- */
  /* the Wardstones: four crystals asleep in the chamber. Stand beside one to wake it: it charges for sixty seconds
     while the brood comes for it in waves; monsters at the crystal chip its ten lights, and at none the charge is
     lost (wake it again). Light all four and the door opens. A wall shuts off half the chamber: a lever drops it */
  const crystalDraw = (c, Xs, Ys, T, o) => { const lit = o.state === 'lit', ch = o.state === 'charging', k = ch ? o.charge / o.need : lit ? 1 : 0, col = lit ? '#8FE0A6' : ch ? KC : '#4A6A78', hi = lit ? '#DFFFF8' : ch ? '#DFFFF8' : '#7A9AA8'; c.save(); c.translate(Xs, Ys);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, T * 0.15, T * 0.6, T * 0.22, 0, 0, TAU); c.fill(); c.fillStyle = '#3E4F58'; c.strokeStyle = LN; c.lineWidth = 1.5; c.beginPath(); c.ellipse(0, T * 0.05, T * 0.55, T * 0.2, 0, 0, TAU); c.fill(); c.stroke();
    if (k > 0) glowAt(c, 0, -T * 0.7, T * (1.0 + k * 0.6), col, 0.35 + 0.4 * k + (ch ? 0.15 * Math.sin(o.t * 6) : 0));
    [[0, -1.5, 0.28], [-0.32, -1.0, 0.18], [0.3, -1.15, 0.2]].forEach(([dx, dy, w]) => { c.fillStyle = shade(c, col, T * 0.6, dx * T, dy * T, 0.4); c.strokeStyle = LN; c.lineWidth = 1.4; c.beginPath(); c.moveTo((dx - w) * T, 0); c.lineTo((dx - w * 0.6) * T, dy * T * 0.85); c.lineTo(dx * T, dy * T); c.lineTo((dx + w * 0.6) * T, dy * T * 0.85); c.lineTo((dx + w) * T, 0); c.closePath(); c.fill(); c.stroke(); c.fillStyle = hi; c.globalAlpha = 0.5; c.beginPath(); c.moveTo((dx - w * 0.5) * T, 0); c.lineTo((dx - w * 0.3) * T, dy * T * 0.8); c.lineTo((dx - w * 0.05) * T, dy * T * 0.9); c.lineTo((dx - w * 0.2) * T, 0); c.closePath(); c.fill(); c.globalAlpha = 1; });
    if (ch) { c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 5; c.beginPath(); c.arc(0, -T * 0.7, T * 1.1, 0, TAU); c.stroke(); c.strokeStyle = KC; c.lineWidth = 3; c.beginPath(); c.arc(0, -T * 0.7, T * 1.1, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i - 4.5) * 0.2; c.fillStyle = i < o.hp ? '#FFFFFF' : 'rgba(255,255,255,.2)'; c.beginPath(); c.arc(Math.cos(a) * T * 1.35, -T * 0.7 + Math.sin(a) * T * 1.35, 2.5, 0, TAU); c.fill(); }
      c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText(`${Math.ceil(o.need - o.charge)}s`, 0, -T * 0.6); c.fillText(`${Math.ceil(o.need - o.charge)}s`, 0, -T * 0.6); }
    if (lit) { c.fillStyle = '#8FE0A6'; c.strokeStyle = LN; c.lineWidth = 1.5; c.beginPath(); c.arc(0, -T * 2.0, T * 0.22, 0, TAU); c.fill(); c.stroke(); c.strokeStyle = '#1A3A2A'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(-T * 0.1, -T * 2.0); c.lineTo(-T * 0.02, -T * 1.9); c.lineTo(T * 0.12, -T * 2.1); c.stroke(); }
    c.restore(); };
  const leverDraw = (c, Xs, Ys, T, o) => { c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, T * 0.12, T * 0.4, T * 0.16, 0, 0, TAU); c.fill(); c.fillStyle = '#6A6660'; c.strokeStyle = LN; c.lineWidth = 2; GFX.rr(c, -T * 0.35, -T * 0.2, T * 0.7, T * 0.3, 4); c.fill(); c.stroke(); c.strokeStyle = LN; c.lineWidth = T * 0.14; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -T * 0.05); c.lineTo((o.on ? 1 : -1) * T * 0.35, -T * 0.6); c.stroke(); c.strokeStyle = o.on ? '#8FE0A6' : BRASS; c.lineWidth = T * 0.08; c.stroke(); c.restore(); };
  function makeWards(X, self, H) {
    const marks = X.M.marks, me = X.me, S = self.S, NEED = S.need || 25, WAVE = S.wave || 8, IDS = S.crystals || ['A', 'B', 'C', 'D'], NC = IDS.length, WORD = ['', 'one', 'two', 'three', 'four'][NC], order = S.order || ['A', 'B', 'L', 'C', 'D'], walls = {};
    for (const ch of ['x', 'y']) walls[ch] = marks[ch] || [];
    let active = null, waveT = 0, lit = 0;
    const crystals = IDS.map((ch, i) => H.obj({ x: marks[ch][0].x, y: marks[ch][0].y, kind: 'crystal', id: ch, i, state: 'asleep', charge: 0, need: NEED, hp: 10, t: 0, r: 1.0, h: 2.2, draw: crystalDraw, label: o => (o.state === 'lit' ? `Wardstone ${i + 1}: lit ✓` : o.state === 'charging' ? `Guard it · ${Math.ceil(o.need - o.charge)}s` : active ? `Wardstone ${i + 1} (guard the other first)` : `Wardstone ${i + 1}: wake it`),
      use(o) { if (o.state !== 'asleep') return; if (active) { X.text(o.x, o.y - 1.8, 'One at a time: guard the lit one', '#FFFFFF', 12); X.sfx.wrong(); return; } o.state = 'charging'; o.charge = 0; o.hp = 10; active = o; waveT = 1.5; X.banner(`WARDSTONE ${i + 1} WAKES`, `Guard it for ${NEED} seconds: the brood comes for it`, KC, 2.4, true); X.sfx.hum(); X.ring(o.x, o.y, 0.3, 3, 0.6, KC, 0.4); } }));
    const levers = ['L', 'K'].filter(ch => marks[ch]).map((ch, i) => H.obj({ x: marks[ch][0].x, y: marks[ch][0].y, kind: 'lever', id: ch, on: false, h: 1.2, label: o => (o.on ? 'The wall is down' : 'Lever: drop the wall'), draw: leverDraw, use(o) { if (o.on) return; o.on = true; const W = walls[o.id === 'L' ? 'x' : 'y']; W.forEach(p => X.setTile(p.tx, p.ty, T_FLOOR)); X.retile(); X.banner('THE WALL DROPS', 'The way to the far wardstones is open', '#8FE0A6', 2.2, true); X.shake(8, 0.4); X.sfx.crash(); for (const p of W) X.sparks(p.x, p.y, '#C8CCBC', 4, 3); } }));
    H.spawnPacks(); H.setExit(marks.E[0].x, marks.E[0].y, 'The way on');
    X.after(2.4, () => X.banner('THE WARDSTONES', `Wake a crystal and guard it for ${NEED} seconds; light all ${WORD}`, KC, 2.8, true, true));
    const wave = o => { const n = S.waveN || 3, kinds = S.waveKinds || ['crawler', 'crawler', 'crawler', 'reeflantern']; for (let k = 0; k < n; k++) { const a = Math.random() * TAU, q = X.freeSpot(o.x + Math.cos(a) * 4.5, o.y + Math.sin(a) * 4.5, 0.4) || X.freeSpot(o.x + Math.cos(a) * 2.5, o.y + Math.sin(a) * 2.5, 0.4); if (!q) continue; const m = X.spawnMon(kinds[k % kinds.length], q.x, q.y, { aggro: true, pack: 540, ward: o, elite: S.elites && k === 0 }); m.chipT = 0; X.g.total++; X.sparks(q.x, q.y, '#B6A2F0', 8, 4); } X.text(o.x, o.y - 2.2, 'A wave comes for the stone', '#B6A2F0', 12); };
    return { crystals, levers,
      hint() { for (const ch of order) { if (ch === 'L' || ch === 'K') { const lv = levers.find(l => l.id === ch); if (lv && !lv.on) return lv; continue; } const cr = crystals.find(q => q.id === ch); if (cr.state === 'charging') return cr; if (cr.state === 'asleep') return active ? active : cr; } return null; },
      update(dt) {
        for (const o of crystals) o.t += dt;
        if (active) { const o = active; o.charge += dt; waveT -= dt; if (waveT <= 0) { waveT = WAVE; wave(o); }
          // the wave goes for the stone unless the pet is close by; monsters at the stone chip it
          for (const m of X.mons) { if (m.dead || m.boss) continue; const dc = Math.hypot(m.x - o.x, m.y - o.y); if (m.ward === o && dc > 1.4 && Math.hypot(m.x - me.x, m.y - me.y) > 3.5 && !m.still) X.moveEnt(m, (o.x - m.x) / dc * m.spd * 1.1 * dt, (o.y - m.y) / dc * m.spd * 1.1 * dt); if (dc < 1.7) { m.chipT = (m.chipT || 0) - dt; if (m.chipT <= 0) { m.chipT = 0.9; o.hp--; X.sparks(o.x, o.y - 0.8, KC, 6, 3); X.shake(3, 0.1); if (o.hp <= 0) { o.state = 'asleep'; o.charge = 0; active = null; X.banner('THE WARDSTONE BREAKS', 'Its charge is lost: clear the brood and wake it again', '#FF9BD2', 2.4, true); X.sfx.wrong(); X.boom(o.x, o.y, 1.5, KC, '#FFFFFF', { n: 16, shake: 8 }); break; } } } }
          if (active && o.charge >= o.need) { o.state = 'lit'; o.charge = o.need; active = null; lit++; X.banner(`WARDSTONE ${o.i + 1} LIT`, lit < NC ? `${NC - lit} to go` : `All ${WORD} shine: the door opens`, '#8FE0A6', 2.2, true); X.flash(0.3, '#8FE0A6'); X.sfx.fanfare(); X.ring(o.x, o.y, 0.3, 4, 0.7, '#8FE0A6', 0.4); } }
        if (lit >= NC && !self.done) { self.done = true; }
      },
      goal() { if (self.done) return `All ${WORD} wardstones lit · through the door`; if (active) return `Guard wardstone ${active.i + 1} · ${Math.ceil(active.need - active.charge)}s · ${active.hp}/10 lights · ${lit}/${NC} lit`; const h = this.hint ? this.hint() : null; return h && h.kind === 'lever' ? `Pull the lever to drop the wall (arrow) · ${lit}/${NC} lit` : `Wake the next wardstone (arrow) · ${lit}/${NC} lit`; },
      drawGround(c) { const T = X.Tz(); if (!active) return; const Xs = X.sx(active.x), Ys = X.sy(active.y); c.save(); c.globalAlpha = 0.35 + 0.15 * Math.sin(X.g.t * 4); c.strokeStyle = KC; c.lineWidth = 2; c.setLineDash([6, 6]); c.beginPath(); c.ellipse(Xs, Ys, T * 1.7, T * 1.0, 0, 0, TAU); c.stroke(); c.restore(); },
    };
  }
  const WARDS = { name: 'The Wardstone Vestibule', goal: 'Wake the three wardstones and guard each for 20 seconds', how: 'Stand beside a sleeping crystal to wake it. It charges for 20 seconds while the brood comes for it in waves: monsters touching the stone put out its lights, and at none its charge is lost. Light all three to open the door. A wall shuts off two of them: a lever drops it. The arrow always points to the next thing to do.',
    layout: [
      '##############################',
      '#S.......c.......x...........#',
      '#...A............x....B......#',
      '#................x...........#',
      '#.......d....L...x......d....#',
      '#................x...........#',
      '#..........c.....x.....C.....#',
      '#................x........E..#',
      '##############################'],
    legend: Object.assign({ A: {}, B: {}, C: {}, L: {}, x: { tile: T_SOLID }, E: {} }, PACK), make: makeWards, need: 20, crystals: ['A', 'B', 'C'], order: ['A', 'L', 'B', 'C'] };
  /* the Rushing Gallery: a long drowned nave the tide sweeps you down. You run on your own; steer between the three
     lanes to gather drowned light (golden motes) and miss the wrecked pews (a crate hit spills four lights; a dodge
     vaults one). The dark crystal at the far end lights when it has been given enough light: short of it, the tide
     carries you back to the start, light kept, for another run down a fresh course */
  const RUSH_NEED = 36, LANES = [3.5, 5.5, 7.5];
  const rushLayout = (() => { const rows = ['#########', '#...E...#', '#.......#', '#...C...#', '#.......#', '#.......#']; for (let i = 0; i < 54; i++) rows.push('#.......#'); rows.push('#.......#', '#...S...#', '#.......#', '#########'); return rows; })();
  const crateDraw = (c, Xs, Ys, T, o) => { c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, T * 0.1, T * 0.75, T * 0.28, 0, 0, TAU); c.fill();
    if (o.broken) { c.globalAlpha = Math.max(0, 1 - o.broken * 2); }
    // a wrecked pew: a dark plank box, barnacled, a warning glow at its foot
    glowAt(c, 0, -T * 0.3, T * 1.1, '#FF9BD2', 0.18 + 0.1 * Math.sin(o.t * 6));
    c.fillStyle = '#4A3A3A'; c.strokeStyle = LN; c.lineWidth = 2; GFX.rr(c, -T * 0.7, -T * 0.95, T * 1.4, T * 0.95, 4); c.fill(); c.stroke(); c.fillStyle = '#6A5050'; GFX.rr(c, -T * 0.7, -T * 1.1, T * 1.4, T * 0.3, 4); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { c.beginPath(); c.moveTo(i * T * 0.4, -T * 0.8); c.lineTo(i * T * 0.4, -T * 0.05); c.stroke(); }
    c.fillStyle = '#C8CCBC'; [[-0.45, -0.5], [0.3, -0.25], [0.5, -0.7]].forEach(([x, y]) => { c.beginPath(); c.arc(x * T, y * T, T * 0.07, 0, TAU); c.fill(); });
    c.fillStyle = '#FF9BD2'; c.beginPath(); c.moveTo(-T * 0.5, -T * 1.1); c.lineTo(-T * 0.3, -T * 1.1); c.lineTo(-T * 0.4, -T * 1.3); c.closePath(); c.fill(); c.beginPath(); c.moveTo(T * 0.3, -T * 1.1); c.lineTo(T * 0.5, -T * 1.1); c.lineTo(T * 0.4, -T * 1.3); c.closePath(); c.fill();
    c.restore(); };
  const moteDraw = (c, Xs, Ys, T, o) => { const bob = Math.sin(o.t * 5 + o.ph) * T * 0.08, r = T * 0.26; c.save(); c.translate(Xs, Ys - T * 0.55 + bob); c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(0, T * 0.55 - bob, r * 0.9, r * 0.35, 0, 0, TAU); c.fill(); glowAt(c, 0, 0, r * 2.2, '#FFE37A', 0.55); const gr = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, '#FFE37A'); gr.addColorStop(1, '#D9A020'); c.fillStyle = gr; c.strokeStyle = LN; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke(); c.fillStyle = '#D9A020'; c.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5, a2 = a + TAU / 10; c.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); c.lineTo(Math.cos(a2) * r * 0.25, Math.sin(a2) * r * 0.25); } c.closePath(); c.fill(); c.restore(); };
  function makeRush(X, self, H) {
    const marks = X.M.marks, me = X.me, g = X.g, S = self.S, NEED = S.need || RUSH_NEED, start = { x: marks.S ? marks.S[0].x : X.M.start.x, y: X.M.start.y }, cry = marks.C[0], TOP = cry.y + 3.5;
    const R = { mode: 'intro', energy: 0, runs: 0, t: 0, speed: 5.5, wait: 0, got: 0, best: 0 };
    const crates = [], motes = [];
    const crystal = H.obj({ x: cry.x, y: cry.y, kind: 'crystal', id: 'C', i: 0, state: 'asleep', charge: 0, need: NEED, hp: 10, t: 0, r: 1.0, h: 2.2, draw: (c, Xs, Ys, T, o) => { crystalDraw(c, Xs, Ys, T, o); if (o.state !== 'lit') { const k = Math.min(1, R.energy / NEED); c.save(); c.translate(Xs, Ys); glowAt(c, 0, -T * 0.7, T * (0.8 + k), '#FFE37A', 0.15 + 0.5 * k); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 5; c.beginPath(); c.arc(0, -T * 0.7, T * 1.1, 0, TAU); c.stroke(); c.strokeStyle = '#FFE37A'; c.lineWidth = 3; c.beginPath(); c.arc(0, -T * 0.7, T * 1.1, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText(`${R.energy}/${NEED}`, 0, -T * 0.6); c.fillText(`${R.energy}/${NEED}`, 0, -T * 0.6); c.restore(); } },
      label: o => (o.state === 'lit' ? 'The crystal shines ✓' : `Dark crystal · ${R.energy}/${NEED} light`) });
    H.setExit(marks.E[0].x, marks.E[0].y, 'The way on');
    /* a fresh course: blocks of four rows, each a run of motes down a lane or a row of wrecked pews with motes in the free lane */
    function course() {
      crates.length = 0; motes.length = 0; let lane = 1, y = start.y - 6, n = 0, lastPew = 0;
      while (y > TOP + 4) {
        const u = 1 - (y - TOP) / (start.y - TOP), pew = n >= 2 && (n - lastPew >= 3 || Math.random() < 0.3 + 0.35 * u);
        if (pew) { const two = Math.random() < 0.25 + 0.45 * u, free = Math.floor(Math.random() * 3), blocked = two ? [0, 1, 2].filter(l => l !== free) : [Math.random() < 0.5 ? free : (free + 1 + Math.floor(Math.random() * 2)) % 3].filter(l => l !== free);
          for (const l of blocked) crates.push({ x: LANES[l], y, t: Math.random() * 6, hit: false, broken: 0 });
          for (let k = 1; k <= 2; k++) motes.push({ x: LANES[free], y: y - k, t: 0, ph: k, got: false }); lane = free; lastPew = n; }
        else { const nl = Math.random() < 0.6 ? lane : Math.max(0, Math.min(2, lane + (Math.random() < 0.5 ? -1 : 1))); for (let k = 0; k < 4; k++) { const l = k < 2 ? lane : nl; motes.push({ x: LANES[l], y: y - k, t: 0, ph: k, got: false }); } lane = nl; }
        y -= 4; n++; }
      R.avail = motes.length;
    }
    function toStart() { me.x = start.x; me.y = start.y; me.vx = me.vy = 0; me.dodge = null; me.push = null; me.dash = null; me.leap = null; X.retile(); }
    function go() { course(); R.mode = 'ready'; R.wait = 1.6; R.runs++; R.got = 0; X.banner(R.runs === 1 ? 'THE TIDE TAKES YOU' : `RUN ${R.runs}`, `Steer between the lanes · gather ${NEED - R.energy} more light`, '#FFE37A', 2.0, true); X.sfx.whoosh(); }
    X.after(1.0, () => X.banner('THE RUSHING GALLERY', 'The tide runs you down the nave: gather the drowned light, miss the wrecked pews', '#FFE37A', 3.0, true, true));
    X.after(3.6, go);
    return { R, crates, motes, crystal,
      hint() { return self.done ? null : R.mode === 'rest' ? null : crystal; },
      update(dt) {
        R.t += dt; crystal.t += dt; for (const o of crates) { o.t += dt; if (o.hit) o.broken += dt; } for (const o of motes) o.t += dt;
        if (R.mode === 'ready') { R.wait -= dt; if (R.wait <= 0) { R.mode = 'run'; X.text(me.x, me.y - 1.6, 'Go!', '#FFE37A', 15); } return; }
        if (R.mode !== 'run' || me.dead || g.won) return;
        // the tide: the pet is carried up the nave, faster the farther it gets; the stick steers
        const u = Math.max(0, Math.min(1, 1 - (me.y - TOP) / (start.y - TOP))); R.speed = 5.4 + 2.2 * u;
        X.moveEnt(me, 0, -R.speed * dt, 0); me.bob += dt * 10; me.wph = (me.wph || 0) + dt * 9; if (Math.abs(me.vx) < 0.3) { me.ax = 0; me.ay = -1; }
        if (Math.random() < dt * 20) X.part({ kind: 'smoke', x: me.x + (Math.random() - 0.5) * 0.5, y: me.y + 0.2, vx: 0, vy: 2.5, life: 0.35, max: 0.35, size: 0.08, color: 'rgba(170,220,235,' });
        for (const o of motes) if (!o.got && Math.abs(o.y - me.y) < 0.75 && Math.abs(o.x - me.x) < 0.85) { o.got = true; R.energy++; R.got++; X.sparks(o.x, o.y - 0.5, '#FFE37A', 6, 3); X.sfx.coin(); if (R.energy === NEED) X.text(me.x, me.y - 1.8, 'Enough light! Reach the crystal', '#8FE0A6', 13); else if (R.got % 10 === 0) X.text(me.x, me.y - 1.6, `${R.got} this run`, '#FFE37A', 12); }
        for (const o of crates) if (!o.hit && Math.abs(o.y - me.y) < 0.7 && Math.abs(o.x - me.x) < 0.95) {
          if (me.dodge) { o.hit = true; X.text(me.x, me.y - 1.6, 'Vaulted!', '#8FE0A6', 13); X.sfx.whoosh(); continue; }
          o.hit = true; const lost = Math.min(R.energy, 4); R.energy -= lost; me.inv = Math.max(me.inv, 0.5); me.push = { vx: 0, vy: 3.5, t: 0.25 }; X.boom(o.x, o.y, 1.2, '#6A5050', '#FFFFFF', { n: 14, shake: 7 }); X.sfx.crash(); X.text(me.x, me.y - 1.6, lost ? `Crash! −${lost} light` : 'Crash!', '#FF9BD2', 13); g.combo = 0;
          if (lost) X.sparks(me.x, me.y - 0.5, '#FFE37A', lost * 3, 6); }
        if (me.y < TOP) { R.mode = 'rest'; me.vx = me.vy = 0;
          if (R.energy >= NEED) { crystal.state = 'lit'; self.done = true; X.banner('THE CRYSTAL SHINES', 'The drowned light fills it: the door opens', '#8FE0A6', 2.6, true, true); X.flash(0.35, '#FFE37A'); X.sfx.fanfare(); X.ring(cry.x, cry.y, 0.3, 5, 0.8, '#FFE37A', 0.4); }
          else { X.banner('NOT ENOUGH LIGHT', `${R.energy} of ${NEED} · the tide carries you back for another run`, '#FF9BD2', 2.4, true); X.sfx.wrong(); X.after(2.0, () => { X.flash(0.3, '#61D9D2'); toStart(); go(); }); } }
      },
      goal() { if (self.done) return 'The crystal shines · through the door'; if (R.mode === 'intro') return 'The Rushing Gallery'; return `Gather the drowned light · ${R.energy}/${NEED} · run ${R.runs}`; },
      drawGround(c) {
        const T = X.Tz(), W = X.W(), Hh = X.H();
        // the tide: pale streaks flowing up the nave while the run is on
        if (R.mode === 'run' || R.mode === 'ready') { c.save(); c.globalAlpha = 0.18; c.strokeStyle = '#DFFFF8'; c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 26; i++) { const wx = 2.2 + ((i * 37) % 61) / 61 * 6.6, ph = ((i * 53) % 97) / 97, wy = me.y - 9 + ((ph + R.t * 1.1 + i * 0.13) % 1) * 18; const Xs = X.sx(wx), Ys = X.sy(wy); if (Ys < -20 || Ys > Hh + 20) continue; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs, Ys + T * 0.8); c.stroke(); } c.restore(); }
        // the lanes, faint on the stone
        c.save(); c.globalAlpha = 0.12; c.strokeStyle = '#FFE37A'; c.lineWidth = 1.5; c.setLineDash([T * 0.3, T * 0.5]); for (const lx of LANES) { const Xs = X.sx(lx); c.beginPath(); c.moveTo(Xs, 0); c.lineTo(Xs, Hh); c.stroke(); } c.restore();
        for (const o of motes) if (!o.got) { const Ys = X.sy(o.y); if (Ys < -40 || Ys > Hh + 40) continue; moteDraw(c, X.sx(o.x), Ys, T, o); }
        for (const o of crates) { if (o.broken > 0.5) continue; const Ys = X.sy(o.y); if (Ys < -60 || Ys > Hh + 40) continue; crateDraw(c, X.sx(o.x), Ys, T, o); }
      },
      drawOver(c) {
        if (self.done || R.mode === 'intro') return; const W = X.W(), k = Math.min(1, R.energy / NEED), bw = Math.min(260, W - 40), x0 = (W - bw) / 2, y0 = 98;
        c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, x0 - 4, y0 - 4, bw + 8, 22, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; GFX.rr(c, x0, y0, bw, 14, 6); c.fill(); if (k > 0) { c.fillStyle = k >= 1 ? '#8FE0A6' : '#FFE37A'; GFX.rr(c, x0, y0, bw * k, 14, 6); c.fill(); }
        c.font = `800 11px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; const s = k >= 1 ? 'Enough light · reach the crystal' : `Drowned light ${R.energy}/${NEED}`; c.strokeText(s, W / 2, y0 + 11); c.fillText(s, W / 2, y0 + 11); c.restore();
      },
    };
  }
  const RUSH = { name: 'The Rushing Gallery', goal: 'Gather enough drowned light to wake the crystal', how: 'The tide runs you down the long nave on its own: steer left and right between the three lanes. Gather the golden motes of drowned light and miss the wrecked pews (a crash spills four lights; dodging through a pew vaults it). The dark crystal at the far end lights once it has been given 36 lights. Short of it, the tide carries you back for another run: the light you gathered is kept.',
    layout: rushLayout, legend: { C: {}, E: {} }, make: makeRush, need: RUSH_NEED };
      /* the Clapper Counterweights: two scale pans, three clappers of one, two and three rings. Load both pans to
         exactly three: the three-ring one alone, the one and the two together */
    const CLAPPERS = { name: 'The Clapper Counterweights', goal: 'Balance the two scale pans: each must hold exactly three rings of weight', how: 'Three bell clappers lie about, weighing 1, 2 and 3 rings. Stand beside one to pick it up, then stand beside a pan to set it down. Each pan must read 3: the 3-ring clapper alone on one pan, the 1 and the 2 together on the other. The yellow arrow shows what to pick up and where to put it.',
        layout: [
          '##########################################',
          '#S.......................................#',
          '#..........L...........R.................#',
          '#........................................#',
          '#..~~~~..........................~~~~....#',
          '#..~~~~.....k....................~~~~....#',
          '#........................................#',
          '#.....1.......................2..........#',
          '#.........k.............................E#',
          '#........................................#',
          '#..................l.....................#',
          '#..................3.....................#',
          '#........................................#',
          '##########################################'],
        legend: Object.assign({ L: {}, R: {}, 1: {}, 2: {}, 3: {}, E: {} }, PACK),
        make(X, self, H) {
          const M = X.M, marks = M.marks, me = X.me, want = self.S.want || 3, ns = self.S.ns || [1, 2, 3], PLAN = self.S.plan || [[3, 0], [1, 1], [2, 1]], pans = [{ x: marks.L[0].x, y: marks.L[0].y, w: 0, items: [] }, { x: marks.R[0].x, y: marks.R[0].y, w: 0, items: [] }];
          let carrying = null, finalPair = false, open = false;
          const clapDraw = (c, Xs, Ys, T, o) => { if (o.taken) return; const r = T * 0.22; c.save(); c.translate(Xs, Ys - T * 0.3); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, T * 0.3, r * 1.3, r * 0.4, 0, 0, TAU); c.fill();
            c.beginPath(); c.moveTo(-r * 0.7, -r * 1.2); c.lineTo(r * 0.7, -r * 1.2); c.lineTo(r, r * 0.9); c.lineTo(-r, r * 0.9); c.closePath(); c.fillStyle = shade(c, BRASS, r * 1.5, -r * 0.3, -r * 0.5, 0.45); c.fill(); c.strokeStyle = LN; c.lineWidth = 1.5; c.stroke();
            for (let i = 0; i < o.n; i++) { c.strokeStyle = '#5A4322'; c.lineWidth = 2; c.beginPath(); c.moveTo(-r * 0.8, -r * 0.5 + i * r * 0.5); c.lineTo(r * 0.85, -r * 0.5 + i * r * 0.5); c.stroke(); }
            c.restore(); };
          const claps = ns.map(n => H.obj({ x: marks[String(n)][0].x, y: marks[String(n)][0].y, kind: 'clapper', n, taken: false, label: o => (o.taken ? '' : `Clapper · ${n} ring${n > 1 ? 's' : ''}`), h: 1.1, draw: clapDraw,
            use(o) { if (carrying) { X.text(me.x, me.y - 1.1, 'Hands full', '#FFFFFF', 12); return; } if (n === 3 && leechHolds(X, o)) { X.text(o.x, o.y - 1, 'Leeches hold it to the rack!', '#B6A2F0', 12); X.sfx.wrong(); return; } o.taken = true; carrying = o; o.use = null; X.text(me.x, me.y - 1.1, `Took the ${n}-ring clapper`, '#FFE9A8', 12); X.sfx.chirp(); } }));
          const panDraw = (c, Xs, Ys, T, o) => { const P2 = pans[o.i], r = T * 0.6; c.save(); c.translate(Xs, Ys);
            c.strokeStyle = LN; c.lineWidth = 3; c.beginPath(); c.moveTo(0, -T * 1.6); c.lineTo(0, -T * 0.2); c.stroke(); c.strokeStyle = BRASS; c.lineWidth = 1.6; c.stroke();
            c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(0, T * 0.15, r, r * 0.35, 0, 0, TAU); c.fill();
            c.fillStyle = shade(c, '#6E5A3A', r, 0, -T * 0.1, 0.4); c.beginPath(); c.ellipse(0, -T * 0.1 + P2.w * T * 0.04, r, r * 0.4, 0, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = 1.5; c.stroke();
            P2.items.forEach((n, i) => { c.save(); c.translate((i - 0.5) * T * 0.3, -T * 0.35 + P2.w * T * 0.04); c.scale(0.7, 0.7); clapDraw(c, 0, T * 0.3, T, { n }); c.restore(); });
            // the needle and the target engraved above
            c.fillStyle = '#2B2433'; c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.fillStyle = P2.w === want ? '#8FE0A6' : '#FFFFFF'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.strokeText(`${P2.w} / ${want}`, 0, -T * 1.75); c.fillText(`${P2.w} / ${want}`, 0, -T * 1.75);
            c.restore(); };
          const panObjs = pans.map((P2, i) => H.obj({ x: P2.x, y: P2.y, kind: 'pan', i, r: 1.1, label: i ? 'RIGHT pan' : 'LEFT pan', h: 2.0, draw: panDraw, use(o) {
            if (carrying) { P2.items.push(carrying.n); P2.w += carrying.n; const cl = carrying; carrying = null; X.text(o.x, o.y - 1.9, `+${cl.n}`, '#FFE9A8', 14); X.sfx.chirp(); if (P2.w === want && !finalPair) { finalPair = true; X.banner('A PAN BALANCES', 'Two more crawlers climb from the cistern', '#FFE9A8', 2, true); [[-1.5, 0], [1.5, 0]].forEach(([dx, dy]) => { const p = X.freeSpot(o.x + dx, o.y + dy + 2, 0.4) || o; const m2 = X.spawnMon('crawler', p.x, p.y, { aggro: true, pack: 501 }); X.g.total++; X.sparks(p.x, p.y, KC, 10, 5); }); } }
            else if (P2.items.length) { const n = P2.items.pop(); P2.w -= n; const cl = claps.find(q => q.n === n); cl.taken = false; cl.x = me.x; cl.y = me.y + 0.6; cl.use = cl.use0; X.text(o.x, o.y - 1.9, `-${n}: taken off`, '#FFFFFF', 12); } } }));
          claps.forEach(cl => { cl.use0 = cl.use; });
          H.spawnPacks(); H.setExit(marks.E[0].x, marks.E[0].y, 'The lift');
          return {
            update(dt) { if (!open && pans[0].w === want && pans[1].w === want && finalPair && H.monstersLeft() === 0) { open = true; self.done = true; X.banner('THE LIFT UNLOCKS', `Both pans read ${want}`, '#8FE0A6', 2.4, true); X.flash(0.3, '#FFE9A8'); X.sfx.fanfare(); } },
            hint() { if (open) return null; if (carrying) { const step = PLAN.find(([n]) => n === carrying.n); return panObjs[step ? step[1] : 0]; } const next = PLAN.find(([n]) => !pans.some(P2 => P2.items.includes(n))); return next ? claps.find(q => q.n === next[0]) : null; },
            goal() { if (open) return 'Take the lift'; if (carrying) { const step = PLAN.find(([n]) => n === carrying.n); return `Set the ${carrying.n}-ring clapper on the ${step && step[1] ? 'RIGHT' : 'LEFT'} pan (arrow) · pans ${pans[0].w}/${want} and ${pans[1].w}/${want}`; } const next = PLAN.find(([n]) => !pans.some(P2 => P2.items.includes(n))); return next ? `Pick up the ${next[0]}-ring clapper (arrow) · pans ${pans[0].w}/${want} and ${pans[1].w}/${want}` : finalPair && H.monstersLeft() ? `Both pans read ${want} · ${H.monstersLeft()} crawlers to beat` : `Pans ${pans[0].w}/${want} and ${pans[1].w}/${want}`; },
            drawOver(c) { if (!carrying) return; const T = X.Tz(); clapDraw(c, X.sx(me.x), X.sy(me.y) - T * 1.3 - Math.sin(X.g.t * 3) * T * 0.05, T, carrying); },
          };
        } };

  /* the bell rack: four clappers (one to four rings), two pans that must each read five: one and four, two and three */
  const CLAPPERS2 = Object.assign({}, CLAPPERS, { name: 'The Bell Rack', goal: 'Load both pans to five weights',
    layout: [
      '##########################################',
      '#S.......................................#',
      '#..........L...........R.................#',
      '#........................................#',
      '#..~~~~..........................~~~~....#',
      '#..~~~~.....k....................~~~~....#',
      '#........................................#',
      '#.....1.......4...............2..........#',
      '#.........k.............................E#',
      '#........................................#',
      '#..................l.....................#',
      '#..................3.....................#',
      '#........................................#',
      '##########################################'],
    legend: Object.assign({ L: {}, R: {}, 1: {}, 2: {}, 3: {}, 4: {}, E: {} }, PACK), want: 5, ns: [1, 2, 3, 4], plan: [[1, 0], [4, 0], [2, 1], [3, 1]], goal: 'Balance the two pans: each must hold exactly five rings of weight', how: 'Four clappers of 1, 2, 3 and 4 rings. Each pan must read 5: the 1 and the 4 on one pan, the 2 and the 3 on the other. Follow the arrow.' });
      /* the Rising Tide Walk: a long ramp with three landings; the tide surges up it; reach each landing, clear it
         and turn its refuge valve before the surge */
    const TIDE = { name: 'The Rising Tide Walk', goal: 'Climb the ramp landing by landing, turning each refuge valve before the tide surges', how: 'The tide surges up the ramp on a timer (shown in the goal). Reach the next landing, clear its monsters, and stand beside its valve to turn it: that landing is then safe. Caught by the surge, you are swept back to the last safe landing. The arrow points to the next valve.',
        layout: [
          '################################################################',
          '#S.........h.............j......................h..............#',
          '#..........................................................E...#',
          '#....................v...............v...............v.........#',
          '#..............................................................#',
          '################################################################'],
        legend: Object.assign({ v: {}, E: {} }, PACK),
        make(X, self, H) {
          const marks = X.M.marks, me = X.me, valves = marks.v.map((p, i) => H.obj({ x: p.x, y: p.y, kind: 'valve', i, spin: 0, on: false, label: o => (o.on ? 'Refuge secured' : `Refuge valve ${i + 1}`), h: 1.3, draw: wheelDraw, use(o) {
            if (leg !== i) return; o.on = true; o.spin += Math.PI / 2; o.use = null; last = i; leg = i + 1; surge = -1; X.banner(`LANDING ${i + 1} SECURED`, i < LAST ? 'The next surge is coming' : 'The upper doors open', '#8FE0A6', 2, true); X.sfx.fanfare(); X.ring(o.x, o.y, 0.3, 3, 0.6, '#9FE8FF', 0.3);
            if (i < LAST) X.after(2.5, () => { surge = SURGE_T; X.banner('THE TIDE RISES', `${SURGE_T} seconds to the next landing`, '#7FD3F2', 2, true); }); else { self.done = true; } } }));
          const SURGE_T = self.S.surgeT || 32, LAST = valves.length - 1; let leg = 0, last = -1, surge = SURGE_T, tideX = 0, hurtT = 0;
          H.spawnPacks(); H.setExit(marks.E[0].x, marks.E[0].y, 'The bell platform');
          X.after(2.6, () => X.banner('THE TIDE RISES', `${SURGE_T} seconds to the first landing`, '#7FD3F2', 2, true));
          return {
            update(dt) {
              if (surge > 0) { surge -= dt; if (surge <= 0) { surge = 0; tideX = 2; X.banner('SURGE!', 'The water sweeps the ramp', '#7FD3F2', 1.8, true); X.shake(10, 0.5); X.sfx.crash(); } }
              if (surge === 0) { tideX += 9 * dt; const vx = valves[leg] ? valves[leg].x : 99; if (tideX >= vx + 1) { surge = SURGE_T; tideX = 0; if (hurtT <= 0) {} }
                if (me.x < tideX && !me.dead && hurtT <= 0) { hurtT = 1; X.hurtPet(X.ST().hp * 0.25, null); const back = last >= 0 ? valves[last] : { x: X.M.start.x, y: X.M.start.y }; me.x = back.x; me.y = back.y + 0.5; X.text(me.x, me.y - 1.2, 'Swept back!', '#7FD3F2', 14); X.splash(me.x, me.y, 1.5); } }
              if (hurtT > 0) hurtT -= dt;
            },
            hint() { return self.done ? null : valves[leg] || null; },
            goal() { return self.done ? 'Climb to the bell platform' : `Landing ${leg + 1} of ${valves.length}: turn its valve (arrow)${surge > 0 ? ` · SURGE in ${Math.ceil(surge)}s` : surge === 0 ? ' · SURGE!' : ''}`; },
            drawGround(c) { const T = X.Tz(); if (surge === 0 && tideX > 0) { const Xs = X.sx(tideX); c.save(); c.globalAlpha = 0.55; c.fillStyle = '#2F80B7'; c.fillRect(0, 0, Xs, X.H()); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, columnSprite('#9FE8FF'), Xs - T * 0.6, 0, T * 1.2, X.H()); c.restore(); }
              if (surge > 0 && surge < 6) { c.save(); c.globalAlpha = 0.25 + 0.25 * Math.sin(X.g.t * 8); c.fillStyle = '#61D9D2'; c.fillRect(0, 0, T * 0.4, X.H()); c.restore(); } },
          };
        } };

  /* the drowned stair: four landings, and the tide comes sooner */
  const TIDE2 = Object.assign({}, TIDE, { name: 'The Drowned Stair', goal: 'Four landings, and the tide comes sooner',
    layout: [
      '################################################################################',
      '#S.........h.............j......................h..............j...............#',
      '#..........................................................................E...#',
      '#....................v...............v...............v...............v.........#',
      '#..............................................................................#',
      '################################################################################'],
    surgeT: 24 });

  /* the sealing of the rift (after the third boss) */
  const SEALING = { fall: 'THE CHOIR FALLS SILENT', sub: 'The sea drains away from the belfry', sigil: 'THE TIDE SIGIL', name: 'The Drowned Belfry', color: KC };

  const MOSAIC = riftMatch({ name: 'The Drowned Mosaic', fillers: ['pearl', 'coin', 'crystal'] });
  defRift({
    id: 'belfry', n: 1, name: 'The Drowned Belfry', lvl: 10, sigil: 'Tide', biome: 'belfry', aff: ['water', 'dark'], region: 'the coast',
    blurb: 'A coastal bell tower sunk halfway into an alien sea. Flood and drain its chambers.', gate: { anima: 'cancer', name: 'The Oracle Shell' },
    mons: ['crawler', 'leech', 'reeflantern'], sealing: SEALING,
    scale: 0.5,   // (half the health and blows it was first built with: its monsters, mini bosses and bosses alike)
    stages: riftSections([
      { fights: ['The Flooded Narthex', 'The Choir Stalls'], minis: ['kharrox'], puzzles: [CLAPPERS, TIDE], boss: 'thalassor', bossName: 'Thalassor the Bell-Carrier', bossRoom: 'The Baptism Font' },
      { fights: ['The Drowned Cloister', 'The Organ Loft'], minis: ['nhalu'], puzzles: [WARDS, RUSH], boss: 'veilwrack', bossName: 'Veilwrack the Lantern Eel', bossRoom: 'The Submerged Nave' },
      { fights: ['The Rising Galleries', 'The Belfry Stair'], minis: ['uldroth'], puzzles: [MOSAIC], boss: 'ulvora', bossName: 'Ulvora the Sunken Choir', bossRoom: 'The Bell Platform' },
    ]),
  });
})();
