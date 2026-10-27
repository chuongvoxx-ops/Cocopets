/* ---------- Rift 05, the Pale Aurora: the summit's big beasts (third section) ----------
   yeti      a hulking shaggy snow beast with curled ice horns and a navy face. It leaps onto a shown circle and
             slams (the landing chills), and at range it hurls a heavy snowball.
   icegolem  a slow giant of stacked ice blocks round a green core. Two seconds of wind-up, then a ground slam that
             sends out a ring of ice spikes; its armour of ice halves blows until its core is cracked open by hits.
             (Both also come pouring out of Ahuul in the horde.) */
(() => {
  const TAU = Math.PI * 2, { ICE, ICE_HI, GREEN, GREEN_HI, NAVY } = AUR;
  const { MP, EXT, NF, lwOf, stroke, shade, LN } = DunArt;
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  Object.assign(MON, {
    yeti: { name: 'Yeti', from: 999, hp: 520, spd: 1.75, r: 0.62, dmg: 20, xp: 26, coin: 1.4, color: '#F4F8FA', bio: ['whiteout'], tip: 'Leaps onto a shown circle and slams down (the landing chills). At range it hurls a heavy snowball: sidestep it.', kit: [] },
    icegolem: { name: 'Ice golem', from: 999, hp: 1100, spd: 0.85, r: 0.78, dmg: 26, xp: 40, coin: 2, color: '#B4DAEB', bio: ['whiteout'], tip: 'Its ice armour halves your blows until its green core cracks open. It raises its fists, then slams a ring of ice spikes: get out of the ring.', kit: [] },
  });
  /* the yeti: a big rounded body of shaggy white fur (scalloped edge), long arms to the knuckles, a navy face with
     green eyes and a heavy brow, two curled horns of ice */
  function furBlob(c, cx, cy, rx, ry, n, col, lw, jag) { c.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = 1 + (i % 2 ? jag : -jag * 0.3); const x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw); }
  Object.assign(MP, {
    yeti(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU), crouch = 0, air = o.mode === 'air' ? 1 : 0, throwK = o.mode === 'throw' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.22)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 1.05, r * 0.3, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, crouch * r * 0.18); c.scale(1 + crouch * 0.08, 1 - crouch * 0.1);
      // legs: short, thick
      for (const sd of [-1, 1]) furBlob(c, sd * r * 0.38, r * 0.62 + (sd < 0 ? run : -run) * r * 0.04, r * 0.26, r * 0.3, 10, '#E4EDF0', lw, 0.12);
      // the back arm (behind the body)
      const armUp = air ? -0.9 : throwK ? -1.2 : 0; c.save(); c.translate(-r * 0.62, -r * 0.05); c.rotate(0.25 + armUp * 0.6 + run * 0.15); furBlob(c, 0, r * 0.42, r * 0.2, r * 0.48, 10, '#D6E4EA', lw, 0.14); c.fillStyle = NAVY; c.beginPath(); c.ellipse(0, r * 0.88, r * 0.17, r * 0.12, 0, 0, TAU); c.fill(); stroke(c, lw * 0.8); c.restore();
      // the body: shaggy, white, soft blue in its shadow side
      furBlob(c, 0, r * 0.05, r * 0.78, r * 0.72, 22, '#F4F8FA', lw, 0.07);
      c.save(); c.clip(); c.fillStyle = 'rgba(134,183,208,.35)'; c.beginPath(); c.ellipse(r * 0.45, r * 0.25, r * 0.6, r * 0.7, 0, 0, TAU); c.fill(); c.restore();
      c.strokeStyle = 'rgba(134,183,208,.6)'; c.lineWidth = lw * 0.7; for (let i = 0; i < 6; i++) { const x = -r * 0.5 + i * r * 0.2, y = r * (0.1 + (i % 2) * 0.2); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + r * 0.05, y + r * 0.12, x - r * 0.02, y + r * 0.22); c.stroke(); }
      // the face: a navy mask, heavy white brow, two green eyes, a wide mouth with two blunt fangs
      const fy = -r * 0.25; c.fillStyle = NAVY; c.beginPath(); c.ellipse(r * 0.08, fy, r * 0.42, r * 0.34, 0, 0, TAU); c.fill(); stroke(c, lw);
      furBlob(c, r * 0.08, fy - r * 0.22, r * 0.46, r * 0.14, 12, '#FFFFFF', lw * 0.8, 0.12);
      glowIn(c, r * 0.08, fy, r * 0.4, GREEN, 0.35); for (const ex of [-0.08, 0.26]) { c.fillStyle = GREEN_HI; c.beginPath(); c.ellipse(ex * r, fy - r * 0.02, r * 0.07, r * 0.05, 0, 0, TAU); c.fill(); }
      c.fillStyle = '#0A1426'; c.beginPath(); c.ellipse(r * 0.09, fy + r * 0.17, r * 0.2, r * (0.07 + throwK * 0.05 + air * 0.05), 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; for (const tx of [-0.02, 0.2]) { c.beginPath(); c.moveTo(tx * r - r * 0.04, fy + r * 0.12); c.lineTo(tx * r, fy + r * 0.22); c.lineTo(tx * r + r * 0.04, fy + r * 0.12); c.closePath(); c.fill(); }
      // horns: curled, of pale ice
      for (const sd of [-1, 1]) { const hx = r * 0.08 + sd * r * 0.36, hy = fy - r * 0.3; c.beginPath(); c.moveTo(hx, hy); c.bezierCurveTo(hx + sd * r * 0.35, hy - r * 0.15, hx + sd * r * 0.42, hy - r * 0.5, hx + sd * r * 0.18, hy - r * 0.55); c.lineTo(hx + sd * r * 0.1, hy - r * 0.36); c.bezierCurveTo(hx + sd * r * 0.2, hy - r * 0.3, hx + sd * r * 0.12, hy - r * 0.1, hx - sd * r * 0.16, hy + r * 0.08); c.closePath(); c.fillStyle = shade(c, ICE, r * 0.3, hx, hy - r * 0.3, 0.3); c.fill(); stroke(c, lw * 0.8); }
      // the front arm (over the body), with a snowball when it throws
      c.save(); c.translate(r * 0.62, -r * 0.05); c.rotate(-0.25 - armUp * 0.7 - run * 0.15); furBlob(c, 0, r * 0.42, r * 0.22, r * 0.5, 10, '#EEF4F7', lw, 0.14); c.fillStyle = NAVY; c.beginPath(); c.ellipse(0, r * 0.9, r * 0.19, r * 0.13, 0, 0, TAU); c.fill(); stroke(c, lw * 0.8);
      if (throwK) { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, r * 1.05, r * 0.3, 0, TAU); c.fill(); stroke(c, lw); }
      c.restore(); c.restore(); },
    /* the ice golem: hips and legs of block ice, a broad chest of bevelled ice slabs round a green core, a small
       head block with a slit of light, great fists */
    icegolem(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU), up = o.mode === 'block' || o.mode === 'blockc' ? 1 : 0, cracked = o.mode === 'cracked' || o.mode === 'blockc' ? 1 : 0;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 1.1, r * 0.3, 0, 0, TAU); c.fill();
      const slab = (pts, col) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * r, y * r) : c.moveTo(x * r, y * r))); c.closePath(); c.fillStyle = col; c.fill(); stroke(c, lw); };
      // legs
      for (const sd of [-1, 1]) { const k = (sd < 0 ? run : -run) * 0.05; slab([[sd * 0.15, 0.4], [sd * 0.6, 0.38], [sd * 0.62, 0.95 + k], [sd * 0.12, 0.95 + k]], sd < 0 ? '#9CC6DC' : '#B4DAEB'); }
      // fists raised for the slam, or hanging
      const fy = up ? -1.25 : 0.25 + run * 0.04;
      for (const sd of [-1, 1]) { slab([[sd * 0.7, -0.6], [sd * 1.02, -0.66], [sd * 1.12, fy + 0.02], [sd * 0.86, fy + 0.04]], '#A4CCE0'); slab([[sd * 0.78, fy - 0.05], [sd * 1.22, fy - 0.1], [sd * 1.26, fy + 0.38], [sd * 0.8, fy + 0.4]], sd < 0 ? '#8FBAD2' : '#C2E2F0'); }
      // crystal spikes jutting from its shoulders and back
      const spike = (x, y, h, w, a) => { c.save(); c.translate(x * r, y * r); c.rotate(a); c.beginPath(); c.moveTo(-w * r, 0); c.lineTo(0, -h * r); c.lineTo(w * r, 0); c.closePath(); c.fillStyle = '#E8F6FC'; c.fill(); stroke(c, lw); c.beginPath(); c.moveTo(0, -h * r); c.lineTo(w * r, 0); c.lineTo(0, 0); c.closePath(); c.fillStyle = '#8FBAD2'; c.fill(); stroke(c, lw * 0.6); c.restore(); };
      spike(-0.55, -0.78, 0.75, 0.13, -0.35); spike(-0.3, -0.9, 0.55, 0.1, -0.15); spike(0.55, -0.76, 0.85, 0.14, 0.35); spike(0.85, -0.62, 0.5, 0.1, 0.7); spike(-0.85, -0.6, 0.45, 0.09, -0.75);
      // the chest: three slabs round the core
      slab([[-0.75, -0.75], [0.0, -0.95], [0.0, 0.45], [-0.62, 0.42]], '#CFE8F4'); slab([[0.0, -0.95], [0.78, -0.72], [0.65, 0.42], [0.0, 0.45]], '#9CC6DC');
      c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.moveTo(-r * 0.68, -r * 0.7); c.lineTo(-r * 0.1, -r * 0.86); c.lineTo(-r * 0.15, -r * 0.7); c.closePath(); c.fill();
      // the core: green light in a socket of ice (cracked open, it blazes)
      const cy = -r * 0.2; c.fillStyle = '#0E1A2E'; c.beginPath(); c.moveTo(0, cy - r * 0.3); c.lineTo(r * 0.24, cy); c.lineTo(0, cy + r * 0.3); c.lineTo(-r * 0.24, cy); c.closePath(); c.fill(); stroke(c, lw);
      glowIn(c, 0, cy, r * (0.55 + cracked * 0.4), GREEN, 0.6 + cracked * 0.35 + 0.15 * Math.sin(ph * TAU * 2)); c.fillStyle = cracked ? '#FFFFFF' : GREEN_HI; c.beginPath(); c.moveTo(0, cy - r * 0.16); c.lineTo(r * 0.12, cy); c.lineTo(0, cy + r * 0.16); c.lineTo(-r * 0.12, cy); c.closePath(); c.fill();
      if (cracked) { c.strokeStyle = GREEN_HI; c.lineWidth = lw; c.beginPath(); c.moveTo(0, cy - r * 0.3); c.lineTo(-r * 0.15, -r * 0.7); c.moveTo(r * 0.24, cy); c.lineTo(r * 0.55, -r * 0.45); c.moveTo(0, cy + r * 0.3); c.lineTo(r * 0.1, r * 0.4); c.stroke(); }
      // the head: a small block with a slit of light, frost on top
      slab([[-0.3, -0.95], [0.32, -0.98], [0.3, -1.38], [-0.28, -1.36]], '#B4DAEB'); c.fillStyle = GREEN_HI; c.fillRect(-r * 0.18, -r * 1.2, r * 0.36, r * 0.07); glowIn(c, 0, -r * 1.17, r * 0.3, GREEN, 0.5);
      c.fillStyle = '#F6FAFC'; c.beginPath(); c.moveTo(-r * 0.3, -r * 1.36); c.quadraticCurveTo(0, -r * 1.5, r * 0.3, -r * 1.38); c.lineTo(r * 0.26, -r * 1.3); c.quadraticCurveTo(0, -r * 1.38, -r * 0.28, -r * 1.3); c.closePath(); c.fill(); },
  });
  Object.assign(EXT, { yeti: 2.4, icegolem: 2.8 }); Object.assign(NF, { yeti: 8, icegolem: 6 });
  const { mon, keepRange, startHop, hopTick } = DunAI;
  Object.assign(mon, {
    yeti(m, A, X) {
      if (m.hop) { m.mode = m.hop.t < m.hop.wind ? null : 'air'; hopTick(m, A, X, () => { m.mode = null; m.cd = 2.4 + Math.random(); X.zone({ kind: 'stall', x: m.x, y: m.y, r: 1.6, life: 2, max: 2, own: 'enemy' }); X.boom && X.boom(m.x, m.y, 1.2, ICE_HI, '#FFFFFF', { n: 12, shake: 4 }); }); return; }
      if (m.throwT > 0) { m.throwT -= A.dt; m.mode = 'throw'; if (m.throwT <= 0) { m.mode = null; X.eshot(m.x, m.y - 0.6, m.ta, 7, { dmg: m.dmg * 1.1, color: '#FFFFFF', core: ICE_HI, r: 0.32, life: 1.4 }); m.atkCd = 3 + Math.random(); } return; }
      m.mode = null;
      if (m.cd <= 0 && A.d < 6.5 && A.d > 1.6) { startHop(m, X, X.me.x, X.me.y, { r: 1.5, h: 2.2, wind: 0.6, dur: 0.6, mul: 1.3 }); return; }
      if (m.atkCd <= 0 && A.d > 3 && A.d < 8 && A.los()) { m.throwT = 0.55; m.ta = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 8, w: 0.7, life: 0.55, max: 0.55, src: m, color: '#FFFFFF' }); return; }
      if (A.d > 1.2) X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt);
      else if (m.atkCd <= 0) { m.atkCd = 1.3; X.hurtPet(m.dmg, m); }
    },
    icegolem(m, A, X) {
      // its armour: half damage until the core cracks (after a third of its health is gone)
      if (!m._golemG) { m._golemG = true; const old = m.guardFn; m.guardFn = (q, o) => ((q.hp > q.maxhp * 0.66 ? 0.5 : 1) * (old ? old(q, o) : 1)); }
      if (!m.cracked && m.hp <= m.maxhp * 0.66) { m.cracked = true; X.text(m.x, m.y - 2, 'Its core cracks open!', GREEN_HI, 14); X.sparks && X.sparks(m.x, m.y - 1, GREEN_HI, 12, 5); }
      if (m.slamT > 0) { m.slamT -= A.dt; m.mode = m.cracked ? 'blockc' : 'block'; if (m.slamT <= 0) { m.mode = m.cracked ? 'cracked' : null; m.cd = 3.2 + Math.random(); X.shake(6, 0.3); X.slam(m.x, m.y, 2.6, m.dmg * 1.4, ICE_HI, m); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; X.part({ kind: 'shard', x: m.x + Math.cos(a) * 1.8, y: m.y + Math.sin(a) * 1.8 - 0.2, vx: Math.cos(a) * 3, vy: -3, g: 9, life: 0.6, max: 0.6, size: 5, rot: a, vr: 5, color: ICE_HI }); } } return; }
      if (m.cd <= 0 && A.d < 2.8) { m.slamT = 1.4; X.warn({ x: m.x, y: m.y, r: 2.6, life: 1.4, max: 1.4, src: m, color: ICE_HI }); return; }
      m.mode = m.cracked ? 'cracked' : null; if (A.d > 1.4) X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt);
    },
  });
  // the third section's dungeon: the summit's own beasts in among the brood
  const sec = RIFT_BY_ID.aurora.stages.find(s => s.kind === 'fight' && s.biome === 'whiteout'); if (sec) sec.mobs = ['yeti', 'icegolem', 'rimescuttler', 'yeti', 'veilray', 'icegolem', 'frostlantern'];
})();
