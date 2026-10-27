/* ---------- Gate 04, Gemini: The Twin Reflection ----------
   A round hall of tall mirrors. Out of the great mirror steps a giant reflection of your own lead pet: your face, your
   shape, in cold glass colours, three times your size, cracks of light along it. A boss fight. It mirrors you: at first
   it walks where your reflection would stand across the hall. Its moves:
     Mirror Dash   a shown lane, then it flies along it
     Glass Fan     shards fanned out in three waves along shown cones
     Mirror Guard  a bright mirror aura: every blow you strike while it glows is thrown back at you (stop attacking)
     Echoes        (from the second phase) a ghost of you at each of your last three places, each bursting in turn
     Shatter Twins (at each new phase) shards of mirror split from it and hunt you
   It grows faster in its second and third phases. Its strength is measured from your own. Break it and Gemini wakes. */
(() => {
  const TAU = Math.PI * 2, INK = '#2B2433', GOLD_HI = '#E8CF8E', VIOLET_HI = '#C9B0FF', GLASS = '#BFEFFF', ICE = '#7FD3F2';
  BIOMES.twinhall = { name: 'The Twin Reflection', rift: true, tile: 'heaven', out: true, dark: 0.14, bg: '#0A0716', gap: 'void', ambient: 'motes', accent: GLASS, light: '#E8F4FF',
    floor: ['#3E3762', '#3A335C', '#433C69'], grout: '#2A2446', hi: '#5A5290', top: '#5A4E86', face: '#2E2850', faceD: '#1E1A38', cliff: '#2E2850', deco: GLASS,
    props: [], hazard: 'holy', grade: 'rgba(120,160,255,.08)', fog: '#0A0716', darkRGB: '8,6,20' };
  BIOME_ORDER.push('twinhall');
  if (typeof DARK_COL !== 'undefined') DARK_COL.twinhall = '8,6,20';
  BOSSES.push({ id: 'mirrorpet', rift: true, name: 'Reflection', title: 'Your reflection', hp: 60000, dmg: 30, r: 1.9, spd: 1.9, color: '#9FB8E8', glow: GLASS, biome: 'twinhall', el: 'light' });
  // the shards that split off it
  Object.assign(MON, { mirrorshard: { name: 'Mirror shard', from: 999, hp: 600, spd: 2.3, r: 0.4, dmg: 14, xp: 6, coin: 0.3, color: GLASS, bio: ['twinhall'], fly: true, tip: 'A splinter of your reflection: it darts in and cuts.', kit: [] } });
  const { MP, EXT, NF, lwOf, stroke } = DunArt;
  Object.assign(MP, { mirrorshard(c, r, ph, o) { const lw = lwOf(r), sp = ph * TAU; c.save(); c.translate(0, Math.sin(sp) * r * 0.15 - r * 0.3); c.rotate(Math.sin(sp) * 0.3);
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(GLASS), -r * 1.3, -r * 1.3, r * 2.6, r * 2.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    c.beginPath(); c.moveTo(0, -r * 1.1); c.lineTo(r * 0.55, -r * 0.1); c.lineTo(r * 0.1, r * 0.9); c.lineTo(-r * 0.5, 0); c.closePath(); const gr = c.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, GLASS); gr.addColorStop(1, '#4F7FB8'); c.fillStyle = gr; c.fill(); stroke(c, lw);
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(0, -r * 1.0); c.lineTo(-r * 0.05, r * 0.7); c.stroke(); c.restore(); } });
  Object.assign(EXT, { mirrorshard: 1.9 }); Object.assign(NF, { mirrorshard: 6 });
  Object.assign(DunAI.mon, { mirrorshard(m, A, X) { if (m.cutT > 0) { m.cutT -= A.dt; X.moveEnt(m, Math.cos(m.ca) * 12 * A.dt, Math.sin(m.ca) * 12 * A.dt); if (!m.chit && A.d < m.r + X.me.r + 0.2) { m.chit = true; X.hurtPet(m.dmg, m); } return; }
    if (A.d > 2) X.moveEnt(m, A.ux * A.sp * A.dt, A.uy * A.sp * A.dt); if (m.cd <= 0 && A.d < 4.5) { m.cd = 2.2 + Math.random(); m.ca = A.a; m.chit = false; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 4.5, w: 0.6, life: 0.45, max: 0.45, src: m, color: GLASS }); X.after(0.45, () => { if (!m.dead) m.cutT = 0.35; }); } } });
  // the reflection's moves
  const pick = (m, list) => { if (m.cd > 0) return; let a; do { a = list[Math.floor(Math.random() * list.length)]; } while (a === m.lastAct && list.length > 1); m.act = a; m.lastAct = a; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.65 : m.phase === 2 ? 0.85 : 1); m.actT = 0; m.step = 0; };
  Object.assign(DunAI.boss, {
    mirrorpet(m, A, X, B) {
      const me = X.me, C = m.mirrorC || { x: m.x, y: m.y };
      if (m.act === 'move') {
        // it walks where your reflection would stand across the hall (closer as it grows angrier)
        const tx = C.x * 2 - me.x, ty = me.y, k = m.phase >= 2 ? 0.55 : 1, gx = tx * k + me.x * (1 - k), gy = ty, dx = gx - m.x, dy = gy - m.y, d = Math.hypot(dx, dy);
        if (d > 0.3) { const sp = B.spd * (m.phase === 3 ? 1.5 : m.phase === 2 ? 1.2 : 1); X.moveEnt(m, dx / d * sp * A.dt * Math.min(1, d), dy / d * sp * A.dt * Math.min(1, d)); }
        m.face = me.x < m.x ? -1 : 1;
        return pick(m, m.phase >= 2 ? ['dash', 'fan', 'guard', 'echoes', 'dash'] : ['dash', 'fan', 'guard']); }
      const T = m.actT;
      switch (m.act) {
        case 'dash': { if (m.step === 0) { m.step = 1; m.ca = Math.atan2(me.y - m.y, me.x - m.x); m.face = Math.cos(m.ca) >= 0 ? 1 : -1; X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ca, len: 11, w: 2.0, life: 0.85, max: 0.85, src: m, color: GLASS }); X.say(m, 'Mirror.'); }
          if (T > 0.85 && T < 1.5) { X.moveEnt(m, Math.cos(m.ca) * 15 * A.dt, Math.sin(m.ca) * 15 * A.dt); if (Math.random() < A.dt * 30) X.part({ kind: 'star', x: m.x + (Math.random() - 0.5) * 2, y: m.y + (Math.random() - 0.5), vx: 0, vy: -0.6, life: 0.5, max: 0.5, size: 3, color: GLASS }); if (A.d < m.r + me.r + 0.3 && !m.chit) { m.chit = true; X.hurtPet(m.dmg * 1.6, m); X.push(m.ca, 2.2); } }
          if (T > 1.5 && m.step === 1 && m.phase >= 3) { m.step = 2; m.ca = Math.atan2(me.y - m.y, me.x - m.x); m.chit = false; X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ca, len: 11, w: 2.0, life: 0.6, max: 0.6, src: m, color: VIOLET_HI }); }
          if (m.step === 2 && T > 2.1 && T < 2.7) { X.moveEnt(m, Math.cos(m.ca) * 15 * A.dt, Math.sin(m.ca) * 15 * A.dt); if (A.d < m.r + me.r + 0.3 && !m.chit) { m.chit = true; X.hurtPet(m.dmg * 1.6, m); X.push(m.ca, 2.2); } }
          if (T > (m.step === 2 ? 3.0 : 1.9)) { m.chit = false; done(m, 1.4); } break; }
        case 'fan': { const waves = m.phase >= 2 ? 3 : 2; if (m.step < waves && T > m.step * 0.7) { const a = Math.atan2(me.y - m.y, me.x - m.x) + (m.step % 2 ? 0.22 : 0); m.face = Math.cos(a) >= 0 ? 1 : -1; m.step++;
            X.warn({ shape: 'cone', x: m.x, y: m.y, a, len: 7, spread: 0.7, life: 0.45, max: 0.45, src: m, color: GLASS }); X.after(0.45, () => { if (m.dead) return; for (let i = -3; i <= 3; i++) X.eshot(m.x, m.y - 0.8, a + i * 0.2, 8.5, { dmg: m.dmg * 0.7, color: GLASS, core: '#FFFFFF', r: 0.2, style: 'arrow', life: 1.3 }); X.sfx.twang && X.sfx.twang(); }); if (m.step === 1) X.say(m, 'Shatter.'); }
          if (T > waves * 0.7 + 0.6) done(m, 1.5); break; }
        case 'guard': { if (m.step === 0) { m.step = 1; m.reflectT = 0; X.say(m, 'Strike me.'); if (m.bannerFn) m.bannerFn('MIRROR GUARD', 'Every blow you strike now is thrown back at you: stop attacking!', GLASS, 2, true); m.guardIn = 0.7; }
          if (m.guardIn > 0) { m.guardIn -= A.dt; if (m.guardIn <= 0) m.reflectT = m.phase >= 2 ? 3.2 : 2.6; } else if (m.reflectT > 0) m.reflectT = Math.max(0, m.reflectT - A.dt);
          if (T > 0.7 + (m.phase >= 2 ? 3.2 : 2.6) + 0.3) { m.reflectT = 0; done(m, 1.2); } break; }
        case 'echoes': { if (m.step < 3 && T > m.step * 0.5) { m.step++; const px = me.x, py = me.y, n = m.step; X.zone({ kind: 'ghost', x: px, y: py, life: 1.4, max: 1.4, own: 'none', face: me.face, col: GLASS });
            X.warn({ x: px, y: py, r: 1.6, life: 1.4, max: 1.4, src: m, color: GLASS, fn: () => { if (Math.hypot(me.x - px, me.y - py) < 1.6 + me.r && !me.dodge) X.hurtPet(m.dmg * 1.2, m); X.ring(px, py, 0.2, 1.7, 0.35, GLASS, 0.35); X.sparks(px, py, GLASS, 10, 5); } }); if (n === 1) X.say(m, 'You were here.'); }
          if (T > 2.6) done(m, 1.4); break; }
        default: done(m, 1);
      }
    },
  });
  // a giant reflection of the lead pet: its own form in glass colours, drawn by the pet rig as the Rift-touched are
  function reflectionOf(P) { const f = JSON.parse(JSON.stringify(formOf(P))), p0 = f.pal || {}, cool = c2 => (typeof c2 === 'string' && c2[0] === '#' && c2.length === 7 ? mixHex(c2, '#9FC4F0', 0.55) : c2);
    f.pal = Object.assign({}, p0); for (const k in f.pal) f.pal[k] = cool(f.pal[k]); f.pal.iris = GLASS; f.pal.sec = cool(p0.sec || '#C9B0FF');
    const E = { form: f, acc: GLASS, name: `${P.name}'s Reflection`, sprites: null, ready: false };
    loadSprites(f, { brows: 'angry' }).then(sp => { E.sprites = sp; return makeRig(f, { brows: 'angry' }).then(rg => { sp.rig = rg; E.ready = true; }, () => { E.ready = true; }); }, () => {});
    return E; }
  const LAYOUT = (() => { const N = 21, C = 10, r = []; for (let y = 0; y < N; y++) { let t = ''; for (let x = 0; x < N; x++) { const d = Math.hypot(x - C, (y - C) * 1.05); let ch = d < 9.6 ? '.' : d < 10.4 ? '#' : '~'; if (d < 9.6 && d > 7.6 && [0, 1, 2, 3, 4, 5].some(k => { const a = k / 6 * TAU + Math.PI / 6; return Math.hypot(x - (C + Math.cos(a) * 8.4), y - (C + Math.sin(a) * 8.4)) < 0.6; })) ch = 'M'; if (x === C && y === C - 4) ch = 'O'; if (x === C && y === C + 5) ch = 'S'; t += ch; } r.push(t); } return r; })();
  defGate('sepulchre', {
    name: 'The Twin Reflection', biome: 'twinhall', goal: 'Defeat your reflection', how: 'A giant reflection of your own lead pet steps out of the great mirror: a boss fight. At first it walks where your reflection would stand. It dashes along shown lanes, fans glass shards along shown cones, and raises a Mirror Guard: while its aura glows, every blow you strike is thrown back at you, so stop attacking and dodge. Later it marks the places you just stood and bursts them in turn, and shards split off to hunt you. Its strength is measured from yours.',
    layout: LAYOUT, legend: { O: {}, M: { tile: T_SOLID } },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, O = M.marks.O[0], ST = X.ST();
      const S = { intro: true, boss: null, phase: 1, reflected: 0, lastRef: 0 };
      const B = BOSSES.find(b => b.id === 'mirrorpet');
      X.after(1.0, () => { S.intro = false;
        const m = X.lesserBoss(O.x, O.y, 1, '', B); S.boss = m; m.evil = reflectionOf(st); m.bname = m.evil.name; m.glow = GLASS; m.aggro = true; m.mirrorC = { x: O.x, y: O.y + 4 }; m.bannerFn = X.banner;
        // its strength is measured from yours: tough whatever your level
        m.hp = m.maxhp = Math.max(m.hp, Math.round(ST.atk * 420)); m.dmg = Math.max(m.dmg, ST.hp * 0.075);
        m.guardFn = (q, o) => { if (q.reflectT > 0) { const now = g.t; if (now - S.lastRef > 0.3) { S.lastRef = now; S.reflected++; X.hurtPet(ST.hp * 0.06, null); X.text(me.x, me.y - 1.4, 'Reflected!', GLASS, 14); X.ring(q.x, q.y, 0.4, 3, 0.3, GLASS, 0.35); } return 0; } return 1; };
        X.flash(0.5, '#FFFFFF'); X.shake(8, 0.5); X.sfx.hum && X.sfx.hum(); X.ring(O.x, O.y, 0.5, 6, 0.7, GLASS, 0.5);
        X.banner('THE TWIN REFLECTION', `${m.bname} steps out of the mirror`, GLASS, 3, true, true); });
      function split(n) { const m = S.boss; for (let i = 0; i < n; i++) { const a = i / n * TAU, q = X.freeSpot(m.x + Math.cos(a) * 2, m.y + Math.sin(a) * 2, 0.4); if (!q) continue; const s2 = X.spawnMon('mirrorshard', q.x, q.y, { aggro: true, pack: 820, rift: true }); s2.hp = s2.maxhp = Math.round(ST.atk * 9); s2.dmg = ST.hp * 0.04; X.g.total++; X.sparks(q.x, q.y, GLASS, 8, 4); } }
      return { S,
        update(dt) { const m = S.boss; if (!m) return;
          if (m.phase !== S.phase) { S.phase = m.phase; split(m.phase === 2 ? 3 : 5); X.text(m.x, m.y - 3.5, 'It splinters!', GLASS, 15); }
          if (m.dead && !self.done) { self.done = true; for (const q of X.mons) if (!q.dead && q.type === 'mirrorshard') X.killMon(q); X.banner('GEMINI WAKES', 'The reflection shatters; the twins meet in the mirror', GOLD_HI, 3, true, true); X.flash(0.6, '#FFFFFF'); X.sfx.fanfare(); X.after(2.8, () => X.winStage()); } },
        goal() { const m = S.boss; return self.done ? 'Gemini wakes' : !m ? 'The Twin Reflection' : `${m.bname} ${Math.max(0, Math.ceil(m.hp / m.maxhp * 100))}% · phase ${m.phase || 1}/3${m.reflectT > 0 ? ' · MIRROR GUARD: stop attacking' : ''}`; },
        drawGround(c) { const T = X.Tz(), m = S.boss;
          // the great mirror at the north of the hall, and the tall mirrors round the walls
          { const Xs = X.sx(O.x), Ys = X.sy(O.y - 3.2); c.save(); const gr = c.createLinearGradient(Xs - T * 1.6, 0, Xs + T * 1.6, 0); gr.addColorStop(0, 'rgba(127,211,242,.3)'); gr.addColorStop(0.5, 'rgba(232,244,255,.7)'); gr.addColorStop(1, 'rgba(127,211,242,.3)'); c.fillStyle = gr; c.beginPath(); c.ellipse(Xs, Ys, T * 1.5, T * 2.4, 0, 0, TAU); c.fill(); c.strokeStyle = GOLD_HI; c.lineWidth = 4; c.stroke(); if (!m || !m.dead) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.2 * Math.sin(g.t * 2); blitSized(c, glowSprite(GLASS), Xs - T * 2, Ys - T * 2.6, T * 4, T * 5.2); } c.restore(); }
          for (const p of M.marks.M || []) { const Xs = X.sx(p.x), Ys = X.sy(p.y); c.save(); const gr = c.createLinearGradient(Xs - T * 0.4, 0, Xs + T * 0.4, 0); gr.addColorStop(0, 'rgba(127,211,242,.35)'); gr.addColorStop(0.5, 'rgba(232,244,255,.85)'); gr.addColorStop(1, 'rgba(127,211,242,.35)'); c.fillStyle = gr; c.fillRect(Xs - T * 0.38, Ys - T * 2.2, T * 0.76, T * 2.5); c.strokeStyle = GOLD_HI; c.lineWidth = 2.5; c.strokeRect(Xs - T * 0.38, Ys - T * 2.2, T * 0.76, T * 2.5); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(Xs - T * 0.3, Ys - T * 2.1 + ((g.t * 0.6 + p.x) % 1) * T * 2, T * 0.6, T * 0.35); c.restore(); }
          // the Mirror Guard: a bright shell round it while it throws blows back
          if (m && !m.dead && (m.reflectT > 0 || m.guardIn > 0)) { const Xs = X.sx(m.x), Ys = X.sy(m.y) - T * 1.6, on = m.reflectT > 0, R = T * 3.2; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = on ? 0.55 + 0.2 * Math.sin(g.t * 12) : 0.25; blitSized(c, glowSprite(GLASS), Xs - R, Ys - R, R * 2, R * 2); c.restore(); c.save(); c.strokeStyle = on ? '#FFFFFF' : GLASS; c.lineWidth = on ? 4 : 2; c.setLineDash(on ? [] : [6, 6]); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + g.t * 0.8; c.beginPath(); c.moveTo(Xs + Math.cos(a) * R * 0.85, Ys + Math.sin(a) * R * 0.85); c.lineTo(Xs + Math.cos(a + TAU / 6) * R * 0.85, Ys + Math.sin(a + TAU / 6) * R * 0.85); c.stroke(); } c.restore(); }
          // cracks of light along it as it weakens
          if (m && !m.dead) { const k = 1 - m.hp / m.maxhp; if (k > 0.2) { const Xs = X.sx(m.x), Ys = X.sy(m.y) - T * 1.8; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(232,250,255,${0.3 + k * 0.5})`; c.lineWidth = 2; const n = Math.floor(k * 6); for (let i = 0; i < n; i++) { const a = i * 1.7; c.beginPath(); c.moveTo(Xs + Math.cos(a) * T * 0.3, Ys + Math.sin(a) * T * 0.5); c.lineTo(Xs + Math.cos(a + 0.3) * T * 1.2, Ys + Math.sin(a + 0.3) * T * 1.6); c.lineTo(Xs + Math.cos(a - 0.2) * T * 1.7, Ys + Math.sin(a - 0.2) * T * 2.0); c.stroke(); } c.restore(); } }
        },
      };
    },
  });
})();
