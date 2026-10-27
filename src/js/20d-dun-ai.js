/* ---------- Dungeon monster and boss behaviour. Every attack is telegraphed (a red warning shape fills up
   before it lands), so a quick step or a dodge roll always gets you out. X is the running game; A holds
   this monster's distance and direction to the pet for this frame.
   Every monster has a basic behaviour (mon.*) plus a kit of two strong moves and an ult from the shared
   move library (SK), fired on their own timers. Ults are announced with a purple "!!". ---------- */
const DunAI = (() => {
  const PI = Math.PI;
  const angTo = (a, b) => { let d = b - a; while (d > PI) d -= 6.283; while (d < -PI) d += 6.283; return d; };
  /* a hop: wind up on a warning circle, then arc through the air and land on it */
  function startHop(m, X, tx, ty, o) {
    const p = X.walkPoint(tx, ty, m);
    m.hop = Object.assign({ t: 0, wind: 0.45, dur: 0.55, sx: m.x, sy: m.y, tx: p.x, ty: p.y, r: 1.1, h: 1.3 }, o || {});
    X.warn({ x: p.x, y: p.y, r: m.hop.r, life: m.hop.wind + m.hop.dur, max: m.hop.wind + m.hop.dur, src: m });
  }
  function hopTick(m, A, X, onLand) {
    const H = m.hop; H.t += A.dt;
    if (H.t < H.wind) { m.squash = H.t / H.wind; return true; }
    const u = Math.min(1, (H.t - H.wind) / H.dur);
    m.squash = 0; m.x = H.sx + (H.tx - H.sx) * u; m.y = H.sy + (H.ty - H.sy) * u; m.z = Math.sin(u * PI) * H.h;
    if (u >= 1) {
      m.z = 0; m.hop = null; X.unstick(m);
      X.slam(m.x, m.y, H.r, m.dmg * (H.mul || 1.2), m.color, m);
      if (onLand) onLand();
    }
    return true;
  }
  const keepRange = (m, A, X, lo, hi) => {
    if (A.d > hi || !A.los()) A.steer(A.sp);
    else if (A.d < lo) X.moveEnt(m, -A.ux * A.sp * A.dt, -A.uy * A.sp * A.dt);
    else { const s = Math.sin(m.t * 0.9 + m.wob) > 0 ? 1 : -1; X.moveEnt(m, -A.uy * s * A.sp * 0.55 * A.dt, A.ux * s * A.sp * 0.55 * A.dt); }
  };
  const chaseHit = (m, A, X, mul) => { if (A.d < m.r + X.me.r + 0.25 && m.atkCd <= 0) { X.hurtPet(m.dmg * (mul || 1.2), m); m.atkCd = 0.6; } };
  const aimAt = (m, X) => Math.atan2(X.me.y - m.y, X.me.x - m.x);

  /* ---------- the shared move library. run() returns true while the move is still going ---------- */
  const SK = {
    volley: { range: 8, run(m, A, X, S) { if (S.step === 0) { S.step = 1; S.a = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 4, spread: 0.35, life: 0.4, max: 0.4, src: m }); } if (S.t > 0.4 && S.step === 1) { S.step = 2; const a = aimAt(m, X); for (let i = -1; i <= 1; i++) X.eshot(m.x, m.y - 0.2, a + i * 0.22, 6, { dmg: m.dmg * 0.75, color: m.color }); X.sfx.pop(); } return S.t < 0.7; } },
    fan: { range: 8, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 5, spread: 0.6, life: 0.45, max: 0.45, src: m }); } if (S.t > 0.45 && S.step === 1) { S.step = 2; const a = aimAt(m, X); for (let i = -2; i <= 2; i++) X.eshot(m.x, m.y - 0.2, a + i * 0.26, 5.5, { dmg: m.dmg * 0.7, color: m.color }); X.sfx.pop(); } return S.t < 0.75; } },
    ring: { range: 6, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.warn({ x: m.x, y: m.y, r: 1.1, life: 0.5, max: 0.5, src: m, follow: m, color: m.color }); } if (S.t > 0.5 && S.step === 1) { S.step = 2; const n = S.ult ? 14 : 8; for (let i = 0; i < n; i++) X.eshot(m.x, m.y, i / n * 6.283 + m.t, 3.6, { dmg: m.dmg * 0.65, color: m.color }); X.ring(m.x, m.y, 0.2, 1.4, 0.3, m.color); X.sfx.pop(); } return S.t < 0.8; } },
    leap: { range: 6, run(m, A, X, S) { if (S.step === 0) { S.step = 1; if (m.still) return false; startHop(m, X, X.me.x, X.me.y, { r: 1.2 + m.r * 0.6, h: 1.5, mul: 1.3 }); } if (m.hop) return hopTick(m, A, X); return false; } },
    dash: { range: 7, run(m, A, X, S) {
      if (S.step === 0) { S.step = 1; S.a = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 6.5, w: m.r * 2.2, life: 0.5, max: 0.5, src: m }); }
      if (S.t > 0.5 && S.t < 0.95) { const hit = X.moveEnt(m, Math.cos(S.a) * 13 * A.dt, Math.sin(S.a) * 13 * A.dt); chaseHit(m, A, X, 1.3); if (Math.random() < 0.5) X.part({ kind: 'afterM', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: m.r, color: m.color, m }); if (hit) S.t = 0.95; }
      return S.t < 1.1; } },
    tripledash: { range: 8, run(m, A, X, S) {
      if (S.step % 2 === 0 && S.t >= (S.step / 2) * 0.85) { S.step++; S.a = aimAt(m, X); X.warn({ shape: 'line', x: m.x, y: m.y, a: S.a, len: 6, w: m.r * 2.2, life: 0.4, max: 0.4, src: m }); }
      const k = Math.floor(S.step / 2), on = S.t - k * 0.85;
      if (S.step % 2 === 1 && on > 0.4) { if (on < 0.8) { const hit = X.moveEnt(m, Math.cos(S.a) * 13 * A.dt, Math.sin(S.a) * 13 * A.dt); chaseHit(m, A, X, 1.3); X.part({ kind: 'afterM', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: m.r, color: m.color, m }); if (hit) S.t = k * 0.85 + 0.8; } else S.step++; }
      return S.step < 6; } },
    lobfire: { range: 9, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.lob(m.x, m.y - 0.3, X.me.x, X.me.y, { dur: 0.95, r: 1.05, dmg: m.dmg, kind: 'fire', fire: 2.2, src: m }); } return S.t < 0.4; } },
    lobpoison: { range: 9, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.lob(m.x, m.y - 0.3, X.me.x, X.me.y, { dur: 1.0, r: 1.1, dmg: m.dmg * 0.9, kind: 'poison', poison: 3, src: m }); } return S.t < 0.4; } },
    lobbubble: { range: 9, run(m, A, X, S) { if (S.step === 0) { S.step = 1; [[0, 0], [1.6, 0.8], [-1.4, 1.2]].forEach(([ox, oy], i) => X.after(i * 0.12, () => { if (!m.dead) X.lob(m.x, m.y - 0.3, X.me.x + ox, X.me.y + oy, { dur: 1.0, r: 0.95, dmg: m.dmg, kind: 'bubble', src: m }); })); } return S.t < 0.5; } },
    barrage: { range: 10, noLos: true, run(m, A, X, S) { const n = S.ult ? 7 : 4; if (S.t > S.step * 0.18 && S.step < n) { S.step++; const x = X.me.x + (Math.random() - 0.5) * 5, y = X.me.y + (Math.random() - 0.5) * 5; X.lob(m.x, m.y - 0.3, x, y, { dur: 0.9, r: 1.1, dmg: m.dmg * 0.9, kind: 'fire', fire: 1.6, src: m }); } return S.t < n * 0.18 + 0.3; } },
    cloud: { range: 5, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; const x = m.x, y = m.y; X.warn({ x, y, r: 1.6, life: 0.6, max: 0.6, src: m, color: '#9BE07A', fn: () => X.zone({ kind: 'poison', x, y, r: 1.6, life: 3.5, max: 3.5, dps: m.dmg * 0.8, tick: 0.3, own: 'enemy' }) }); } return S.t < 0.7; } },
    rain: { range: 9, noLos: true, run(m, A, X, S) { const n = S.ult ? 9 : 5; if (S.t > S.step * 0.16 && S.step < n) { S.step++; const x = X.me.x + (Math.random() - 0.5) * 4.5, y = X.me.y + (Math.random() - 0.5) * 4.5; X.warn({ x, y, r: 0.9, life: 0.8, max: 0.8, color: m.color, fn: () => { X.boom(x, y, 0.9, m.color, '#FFFFFF', { n: 8, shake: 2, smoke: 1 }); if (Math.hypot(X.me.x - x, X.me.y - y) < 0.9 + X.me.r) X.hurtPet(m.dmg * 0.8, m); } }); } return S.t < n * 0.16 + 1; } },
    tongue: { range: 4.2, run(m, A, X, S) { if (S.step === 0) { S.step = 1; S.a = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 4.2, w: 0.55, life: 0.5, max: 0.5, src: m }); } if (S.t > 0.5 && S.step === 1) { S.step = 2; X.sfx.twang(); if (X.inLine(m.x, m.y, S.a, 4.2, 0.55) && X.hurtPet(m.dmg, m)) X.pull(m.x, m.y, 1.8); } return S.t < 0.85; } },
    quake: { range: 3.5, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; m.squash = 1; X.warn({ x: m.x, y: m.y, r: 2.3, life: 0.7, max: 0.7, src: m, follow: m }); } if (S.t > 0.7 && S.step === 1) { S.step = 2; m.squash = 0; X.slam(m.x, m.y, 2.3, m.dmg * 1.3, m.color, m); for (let i = 0; i < 2; i++) X.after(0.2 + i * 0.15, () => X.rockFall(X.me.x + (Math.random() - 0.5) * 3, X.me.y + (Math.random() - 0.5) * 3, m.dmg)); } return S.t < 1.1; } },
    rocks: { range: 10, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; for (let i = 0; i < 6; i++) X.after(i * 0.18, () => X.rockFall(X.me.x + (Math.random() - 0.5) * 4, X.me.y + (Math.random() - 0.5) * 4, m.dmg)); X.shake(5, 0.3); } return S.t < 1.4; } },
    spikes: { range: 4, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; const x = m.x, y = m.y, rr = 2.4; X.warn({ x, y, r: rr, life: 0.75, max: 0.75, src: m, follow: m, color: '#C9A24A', fn: () => { for (let i = 0; i < 12; i++) { const aa = i / 12 * 6.283; X.part({ kind: 'spike', x: m.x + Math.cos(aa) * (rr - 0.6), y: m.y + Math.sin(aa) * (rr - 0.6), vx: 0, vy: 0, life: 0.5, max: 0.5, size: 0.7, color: m.color }); } if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < rr + X.me.r && Math.hypot(X.me.x - m.x, X.me.y - m.y) > 0.5) X.hurtPet(m.dmg * 1.1, m); X.ring(m.x, m.y, 0.3, rr, 0.25, m.color); X.sfx.crack(); } }); } return S.t < 0.9; } },
    mines: { range: 8, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; for (let i = 0; i < 3; i++) { const x = X.me.x + (Math.random() - 0.5) * 4, y = X.me.y + (Math.random() - 0.5) * 4; X.warn({ x, y, r: 0.8, life: 0.6, max: 0.6, color: '#FF7A3D', fn: () => { X.zone({ kind: 'efire', x, y, r: 0.9, life: 3.5, max: 3.5, dps: m.dmg * 0.7, tick: 0.2, own: 'enemy' }); X.sparks(x, y, '#FF9F43', 6, 4); } }); } } return S.t < 0.8; } },
    nova: { range: 5, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; const rr = S.ult ? 3.4 : 2.6; X.warn({ x: m.x, y: m.y, r: rr, life: 1.1, max: 1.1, src: m, follow: m, color: '#B983F5', fn: () => { if (m.dead) return; X.boom(m.x, m.y, rr, m.color, '#FFFFFF', { n: 22, shake: 7, smoke: 3 }); if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < rr + X.me.r) X.hurtPet(m.dmg * 1.4, m); } }); } return S.t < 1.3; } },
    shriek: { range: 4, run(m, A, X, S) { if (S.step === 0) { S.step = 1; S.a = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 3.6, spread: 0.6, life: 0.5, max: 0.5, src: m, color: '#E07BF0' }); } if (S.t > 0.5 && S.step === 1) { S.step = 2; if (X.inCone(m.x, m.y, S.a, 3.6, 0.6)) { X.hurtPet(m.dmg * 0.6, m); X.push(S.a, 2.6); } X.ring(m.x, m.y, 0.3, 3.2, 0.35, '#E07BF0', 0.2); X.sfx.whoosh(); } return S.t < 0.8; } },
    gust: { range: 6, run(m, A, X, S) { if (S.step === 0) { S.step = 1; S.a = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 4.6, spread: 0.6, life: 0.7, max: 0.7, src: m, color: '#7FD3F2' }); } if (S.t > 0.7 && S.step === 1) { S.step = 2; if (X.inCone(m.x, m.y, S.a, 4.6, 0.6)) { X.hurtPet(m.dmg * 0.6, m); X.push(S.a, 3.2); } for (let i = 0; i < 16; i++) { const aa = S.a + (Math.random() - 0.5) * 1.1, v = 7 + Math.random() * 5; X.part({ kind: 'wind', x: m.x, y: m.y, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, life: 0.45, max: 0.45, size: 3, color: '#E8F6FF', drag: 1 }); } X.sfx.whoosh(); } return S.t < 1; } },
    swarm: { range: 9, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; if (X.mons.filter(o => !o.dead).length < 70) { const t = MON[m.type] && !MON[m.type].still ? m.type : 'bat'; for (let i = 0; i < 2; i++) { const c = X.spawnMon(t, m.x + (i ? 0.7 : -0.7), m.y + 0.4, { aggro: true, pack: m.pack, room: m.room }); c.xp *= 0.3; c.hp *= 0.6; c.maxhp = c.hp; X.g.total++; X.ring(c.x, c.y, 0.1, 1, 0.3, m.color); } X.sfx.hum(); } } return S.t < 0.6; } },
    split: { range: 9, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; for (let i = 0; i < 2; i++) { const c = X.spawnMon('jelly', m.x + (i ? 0.5 : -0.5), m.y, { aggro: true, pack: m.pack }); c.kbx = i ? 3 : -3; c.xp *= 0.4; X.g.total++; } X.sparks(m.x, m.y, m.color, 12, 5); } return S.t < 0.4; } },
    storm: { range: 9, noLos: true, run(m, A, X, S) { const n = S.ult ? 7 : 4; if (S.t > S.step * 0.14 && S.step < n) { S.step++; const x = X.me.x + (Math.random() - 0.5) * 4.5, y = X.me.y + (Math.random() - 0.5) * 4.5; X.warn({ x, y, r: 1.0, life: 0.85, max: 0.85, color: '#FFE37A', fn: () => { X.bolt(x, y, '#FFE37A'); if (Math.hypot(X.me.x - x, X.me.y - y) < 1.0 + X.me.r) X.hurtPet(m.dmg, m); X.boom(x, y, 1.0, '#FFE37A', '#FFFFFF', { n: 8, shake: 3, smoke: 1 }); } }); } return S.t < n * 0.14 + 1; } },
    shards: { range: 8, run(m, A, X, S) { if (S.step === 0) { S.step = 1; const a = A.a; [-0.22, 0, 0.22].forEach(o => X.eshot(m.x, m.y, a + o, 7.5, { dmg: m.dmg * 0.8, style: 'shard', color: '#BFEFFF', chill: 1.2, r: 0.14 })); X.sfx.sparkle(); } return S.t < 0.35; } },
    ringwave: { range: 7, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.warn({ x: m.x, y: m.y, r: 1.2, life: 0.65, max: 0.65, src: m, follow: m, color: m.color }); } if (S.t > 0.65 && S.step === 1) { S.step = 2; X.ringWave(m.x, m.y, { speed: 4.4, gaps: 3, dmg: m.dmg, color: m.color, life: 1.7, w: 0.42, chill: m.type === 'frost' || m.type === 'penguin' ? 1.4 : 0 }); X.sfx.sparkle(); } return S.t < 0.9; } },
    blizzard: { range: 8, noLos: true, run(m, A, X, S) { if (S.t > S.step * 0.6 && S.step < 2) { S.step++; X.ringWave(m.x, m.y, { speed: 4.2, gaps: 2 + S.step, dmg: m.dmg, chill: 1.8, color: '#BFEFFF', life: 2, w: 0.45 }); for (let i = 0; i < 14; i++) X.part({ kind: 'snow', x: m.x + (Math.random() - 0.5) * 6, y: m.y - 4 + Math.random() * 2, vx: -1, vy: 5 + Math.random() * 3, life: 1.2, max: 1.2, size: 2 + Math.random() * 3, color: '#FFFFFF' }); X.sfx.sparkle(); } return S.t < 1.6; } },
    blink: { range: 9, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.ring(m.x, m.y, 0.2, 1.4, 0.35, m.color); X.sparks(m.x, m.y, m.color, 12, 5); } if (S.t > 0.3 && S.step === 1) { S.step = 2; for (let i = 0; i < 20; i++) { const a = Math.random() * 6.283, d = 2.5 + Math.random() * 2, x = X.me.x + Math.cos(a) * d, y = X.me.y + Math.sin(a) * d; if (!X.blocked(x, y, m.r, m.mv || 0)) { m.x = x; m.y = y; break; } } X.ring(m.x, m.y, 1.4, 0.2, 0.35, m.color); X.sparks(m.x, m.y, m.color, 12, 5); } return S.t < 0.5; } },
    shield: { range: 12, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; m.shieldMax = Math.max(m.shieldMax || 0, m.maxhp * 0.3); m.shield = Math.min(m.shieldMax, (m.shield || 0) + m.maxhp * 0.3); m.shieldT = 4; X.ring(m.x, m.y, 0.3, m.r * 2, 0.4, '#8FE3F0', 0.15); X.sfx.bubble(); } return S.t < 0.5; } },
    heal: { range: 12, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; let best = null, bf = 0.9; for (const o of X.mons) { if (o === m || o.dead || o.boss || o.type === 'gremlin') continue; const f = o.hp / o.maxhp; if (f < bf && Math.hypot(o.x - m.x, o.y - m.y) < 7) { bf = f; best = o; } } if (best) { const n = best.maxhp * 0.3; best.hp = Math.min(best.maxhp, best.hp + n); X.healBeam(m, best); X.text(best.x, best.y - best.r - 0.4, '+' + Math.round(n), '#8FE0A6', 13); } else return false; } return S.t < 0.5; } },
    pillars: { range: 9, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; for (let i = 0; i < 3; i++) X.after(i * 0.18, () => { if (m.dead) return; const x = X.me.x + (i ? (Math.random() - 0.5) * 3 : 0), y = X.me.y + (i ? (Math.random() - 0.5) * 3 : 0); X.pillar(x, y, 0.95, m.dmg, 1.0); }); } return S.t < 0.8; } },
    judgment: { range: 8, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.zone({ kind: 'sweep', own: 'enemy', src: m, x: m.x, y: m.y, a: A.a - 0.6, va: 1.1, len: 7, w: 1.0, life: 2.0, max: 2.0, warm: 0.8, dmg: m.dmg * 0.8, hitT: 0 }); } return S.t < 2.1; } },
    homing: { range: 9, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; [-0.5, 0.5].forEach(o => X.eshot(m.x, m.y, A.a + o, 2.6, { dmg: m.dmg * 0.7, home: 1.7, life: 4, color: '#B983F5', core: '#FFFFFF', r: 0.2 })); X.sfx.pop(); } return S.t < 0.4; } },
    laser: { range: 9, run(m, A, X, S) {
      if (S.step === 0) { S.step = 1; m.laser = { t: 0, st: 'aim', len: 9 }; m.la = A.a; }
      const L = m.laser; if (!L) return false;
      if (S.t < 0.8) { m.la += Math.max(-1.4 * A.dt, Math.min(1.4 * A.dt, angTo(m.la, A.a))); L.st = 'aim'; }
      else if (S.t < 1.05) L.st = 'lock';
      else if (S.t < 1.5) { if (L.st !== 'fire') { L.st = 'fire'; X.sfx.crash(); X.shake(3, 0.15); L.hit = 0; } L.hit -= A.dt; if (L.hit <= 0 && X.inLine(m.x, m.y, m.la, L.len, 0.55)) { L.hit = 0.3; X.hurtPet(m.dmg, m); } }
      else { m.laser = null; return false; }
      L.len = X.rayLen(m.x, m.y, m.la, 9); return true; } },
    sweep: { range: 8, run(m, A, X, S) {
      if (S.step === 0) { S.step = 1; m.laser = { t: 0, st: 'aim', len: 8 }; m.la = A.a - 0.9; }
      const L = m.laser; if (!L) return false;
      if (S.t < 0.7) L.st = 'aim'; else if (S.t < 0.9) L.st = 'lock';
      else if (S.t < 2.4) { if (L.st !== 'fire') { L.st = 'fire'; X.sfx.crash(); L.hit = 0; } m.la += 1.25 * A.dt; L.hit -= A.dt; if (L.hit <= 0 && X.inLine(m.x, m.y, m.la, L.len, 0.55)) { L.hit = 0.35; X.hurtPet(m.dmg * 0.9, m); } }
      else { m.laser = null; return false; }
      L.len = X.rayLen(m.x, m.y, m.la, 8); return true; } },
    boomerang: { range: 7, run(m, A, X, S) { if (S.step === 0) { S.step = 1; S.a = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5, w: 0.5, life: 0.35, max: 0.35, src: m }); } if (S.t > 0.35 && S.step === 1) { S.step = 2; X.eshot(m.x, m.y, S.a, 7.5, { dmg: m.dmg, style: m.type === 'gearbug' ? 'gear' : 'bone', color: m.type === 'gearbug' ? '#C9A24A' : '#EDE6D6', r: 0.22, life: 3, boomer: { out: 0.7, home: m }, keep: true }); X.sfx.whoosh(); } return S.t < 0.6; } },
    cone: { range: 5, run(m, A, X, S) {
      if (S.step === 0) { S.step = 1; S.a = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 4.5, spread: 0.5, life: 0.6, max: 0.6, src: m, color: m.color }); }
      if (S.t > 0.6 && S.t < 1.8) { S.hit = (S.hit || 0) - A.dt; for (let i = 0; i < 2; i++) X.part({ kind: 'ember', x: m.x + Math.cos(S.a) * m.r, y: m.y + Math.sin(S.a) * m.r - 0.2, vx: Math.cos(S.a + (Math.random() - 0.5) * 0.5) * 7, vy: Math.sin(S.a + (Math.random() - 0.5) * 0.5) * 7, life: 0.6, max: 0.6, size: 5 + Math.random() * 4, color: m.color, drag: 0.6 }); if (S.hit <= 0 && X.inCone(m.x, m.y, S.a, 4.5, 0.5)) { S.hit = 0.35; X.hurtPet(m.dmg * 0.6, m); } }
      return S.t < 1.9; } },
    web: { range: 8, run(m, A, X, S) { if (S.step === 0) { S.step = 1; const x = X.me.x, y = X.me.y; X.warn({ x, y, r: 1.4, life: 0.7, max: 0.7, src: m, color: '#E8E8F8', fn: () => { X.zone({ kind: 'web', x, y, r: 1.4, life: 5, max: 5, own: 'enemy' }); X.sfx.twang(); } }); } return S.t < 0.5; } },
    howl: { range: 12, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; for (const o of X.mons) if (!o.dead && !o.boss && Math.hypot(o.x - m.x, o.y - m.y) < 7) { o.hasted = 3; if (!o.aggro) { o.aggro = true; } } X.ring(m.x, m.y, 0.3, 4, 0.5, '#CFE2FF', 0.25); X.say(m, 'Awooo!'); X.sfx.hum(); } return S.t < 0.6; } },
    spin: { range: 3.2, noLos: true, run(m, A, X, S) { if (S.step === 0) { S.step = 1; X.warn({ x: m.x, y: m.y, r: 2.0, life: 0.6, max: 0.6, src: m, follow: m }); } if (S.t > 0.6 && S.step === 1) { S.step = 2; m.spinFx = 0; X.slam(m.x, m.y, 2.0, m.dmg * 1.2, '#E8EEF8', m, true); X.sfx.whoosh(); } if (S.step === 2) m.spinFx = (m.spinFx || 0) + A.dt * 20; return S.t < 1.05; } },
  };
  /* fires a monster's kit moves on their own timers; returns true while a move is running (the basic behaviour pauses) */
  function kit(m, A, X) {
    const D = MON[m.type], K = D && D.kit;
    if (!K || !K.length) return false;
    if (m.sk) { const S = m.sk; S.t += A.dt; const mv = SK[S.key]; const busy = mv ? mv.run(m, A, X, S) : false; if (!busy) m.sk = null; return busy; }
    if (!m.aggro || m.pile || m.fuse != null || m.hop || (m.z || 0) > 0.3 || m.laser || m.tongue || m.gust > 0 || (m.swoop > 0) || (m.charge > 0)) return false;
    if (m.kitT == null) { m.kitT = 1.6 + Math.random() * 2.2; m.ultT = 7 + Math.random() * 5; m.kitI = Math.floor(Math.random() * 2); }
    m.kitT -= A.dt; m.ultT -= A.dt;
    const start = (key, ult) => { if (!SK[key]) return false; m.sk = { key, t: 0, step: 0, ult: !!ult }; if (ult) { X.text(m.x, m.y - m.r - 0.9, '!!', '#E07BF0', 19, { crit: true, life: 0.8, max: 0.8 }); m.ultFx = 0.9; } return true; };
    if (m.ultT <= 0 && A.d < 9.5 && K[2]) { m.ultT = 10 + Math.random() * 5; m.kitT = Math.max(m.kitT, 2.2); if (start(K[2], true)) return true; }
    if (m.kitT <= 0) {
      const key = K[m.kitI & 1] || K[0], mv = SK[key];
      if (mv && A.d < (mv.range || 7) && (mv.noLos || A.los())) { m.kitT = 3.0 + Math.random() * 1.8; m.kitI = (m.kitI || 0) + 1; if (start(key, false)) return true; }
    }
    return false;
  }

  const mon = {
    blob(m, A, X) {
      if (m.hop) return hopTick(m, A, X, () => { if (m.elite) for (let i = 0; i < 6; i++) X.eshot(m.x, m.y, i / 6 * 6.283 + m.t, 3.4, { dmg: m.dmg * 0.6, color: m.color }); });
      A.steer(A.sp);
      if (A.d < 3.4 && A.d > 0.9 && m.cd <= 0 && A.los()) { m.cd = 2.8 + Math.random(); startHop(m, X, X.me.x, X.me.y, { r: m.elite ? 1.5 : 1.05 }); }
    },
    jelly(m, A, X) { A.steer(A.sp); },
    bat(m, A, X) {
      if (m.swoop > 0) { m.swoop -= A.dt; if (m.swoop > 0.38) return; X.moveEnt(m, m.svx * A.dt, m.svy * A.dt); return; }
      A.steer(A.sp); const w = Math.sin(m.t * 7 + m.wob) * 1.6; X.moveEnt(m, -A.uy * w * A.dt, A.ux * w * A.dt);
      if (A.d < 3.4 && m.cd <= 0 && A.los()) { m.cd = 2.2 + Math.random(); m.swoop = 0.38 + 0.32; m.svx = A.ux * 9; m.svy = A.uy * 9; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 3.6, w: 0.8, life: 0.32, max: 0.32, src: m }); }
    },
    spore(m, A, X) {
      if (A.d > 5.2 || !A.los()) A.steer(A.sp);
      else if (A.d < 3) X.moveEnt(m, -A.ux * A.sp * A.dt, -A.uy * A.sp * A.dt);
      if (m.cd <= 0 && A.d < 8 && A.los()) {
        m.cd = 2.2 + Math.random() * 0.6;
        (X.F.n >= 6 ? [-0.25, 0, 0.25] : [0]).forEach(o => X.eshot(m.x, m.y - 0.2, A.a + o, 4.2, { dmg: m.dmg, color: '#D98BFF', style: 'spore' }));
        X.sparks(m.x, m.y - 0.3, '#D98BFF', 4, 3);
      }
    },
    toad(m, A, X) {
      if (m.hop) return hopTick(m, A, X);
      if (m.tongue) {
        const T = m.tongue; T.t += A.dt;
        if (T.t > T.wind && !T.done) { T.done = true; X.sfx.twang(); if (X.inLine(m.x, m.y, T.a, 4, 0.55)) { if (X.hurtPet(m.dmg, m)) X.pull(m.x, m.y, 1.8); } }
        if (T.t > T.wind + 0.35) m.tongue = null;
        return;
      }
      m.hopT = (m.hopT || 0) - A.dt;
      if (m.hopT <= 0) m.hopT = 0.75;
      if (m.hopT > 0.45) { A.steer(A.sp * 2.2); m.z = Math.sin((0.75 - m.hopT) / 0.3 * PI) * 0.25; } else m.z = 0;
      if (m.cd <= 0 && A.los()) {
        if (A.d < 3.8) { m.cd = 2.8 + Math.random(); m.tongue = { t: 0, wind: 0.5, a: A.a }; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 4, w: 0.55, life: 0.5, max: 0.5, src: m }); }
        else if (A.d < 6.5) { m.cd = 3.4 + Math.random(); startHop(m, X, X.me.x, X.me.y, { r: 1.5, wind: 0.5, dur: 0.6, h: 1.8, mul: 1.4 }); }
      }
    },
    roller(m, A, X) {
      if (m.act === 'curl') { m.st -= A.dt; m.spin = (m.spin || 0) + A.dt * 10 * (1 - m.st); if (m.st <= 0) { m.act = 'roll'; m.st = 1.5; m.hitT = 0; } return; }
      if (m.act === 'roll') {
        m.st -= A.dt; m.spin += A.dt * 16; m.hitT -= A.dt;
        const hit = X.moveEnt(m, m.rx * 8.5 * A.dt, m.ry * 8.5 * A.dt);
        if (m.hitT <= 0 && A.d < m.r + X.me.r + 0.1) { m.hitT = 0.5; X.hurtPet(m.dmg * 1.3, m); }
        if (Math.random() < 0.5) X.part({ kind: 'smoke', x: m.x - m.rx * m.r, y: m.y + m.r * 0.6, vx: 0, vy: -0.4, life: 0.4, max: 0.4, size: 0.18, color: 'rgba(160,140,120,' });
        if (hit) { m.act = 'dizzy'; m.st = 1.1; X.boom(m.x + m.rx * m.r, m.y + m.ry * m.r, 0.9, '#B7836B', '#FFE3C2', { n: 10, shake: 4, smoke: 3 }); X.text(m.x, m.y - m.r - 0.4, 'Dizzy!', '#FFE37A', 13); X.sfx.thud(); }
        else if (m.st <= 0) m.act = 'move';
        return;
      }
      if (m.act === 'dizzy') { m.st -= A.dt; if (m.st <= 0) m.act = 'move'; return; }
      A.steer(A.sp);
      if (A.d < 7 && A.d > 1.5 && m.cd <= 0 && A.los()) { m.cd = 3.4 + Math.random(); m.act = 'curl'; m.st = 0.7; m.rx = A.ux; m.ry = A.uy; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 9, w: m.r * 2.2, life: 0.7, max: 0.7, src: m }); }
    },
    bomb(m, A, X) {
      if (m.fuse != null) { m.fuse -= A.dt; if (m.fuse <= 0) X.explodeBomb(m); return; }
      A.steer(A.sp * (A.d < 4 ? 1.35 : 1));
      if (A.d < 1.3) { m.fuse = 0.8; X.sfx.twang(); X.warn({ x: m.x, y: m.y, r: 1.8, life: 0.8, max: 0.8, src: m, follow: m }); }
    },
    splitter(m, A, X) {
      if (m.hop) return hopTick(m, A, X);
      A.steer(A.sp);
      if (A.d < 3.5 && A.d > 1 && m.cd <= 0 && A.los()) { m.cd = 3.6 + Math.random(); startHop(m, X, X.me.x, X.me.y, { r: 1.3, h: 1.0, mul: 1.1 }); }
    },
    harpy(m, A, X) {
      if (m.gust) {
        m.gust -= A.dt;
        if (m.gust <= 0) { m.gust = 0; if (X.inCone(m.x, m.y, m.ga, 4.6, 0.6)) { X.hurtPet(m.dmg * 0.6, m); X.push(m.ga, 3.2); } for (let i = 0; i < 16; i++) { const aa = m.ga + (Math.random() - 0.5) * 1.1, v = 7 + Math.random() * 5; X.part({ kind: 'wind', x: m.x, y: m.y, vx: Math.cos(aa) * v, vy: Math.sin(aa) * v, life: 0.45, max: 0.45, size: 3, color: '#E8F6FF', drag: 1 }); } X.sfx.whoosh(); }
        return;
      }
      keepRange(m, A, X, 3.2, 5.5);
      if (m.cd <= 0 && A.d < 7 && A.los()) {
        m.cd = 2.8 + Math.random();
        if (Math.random() < 0.55) { X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 3, spread: 0.5, life: 0.35, max: 0.35, src: m }); X.after(0.35, () => { if (m.dead) return; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); for (let i = -2; i <= 2; i++) X.eshot(m.x, m.y, a + i * 0.2, 6.5, { dmg: m.dmg * 0.8, style: 'feather', color: '#9FB8F0', r: 0.15 }); X.sfx.whoosh(); }); }
        else { m.gust = 0.7; m.ga = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 4.6, spread: 0.6, life: 0.7, max: 0.7, src: m, color: '#7FD3F2' }); }
      }
    },
    golem(m, A, X) {
      if (m.state === 'wind') { m.st -= A.dt; if (m.st <= 0) { m.state = 'charge'; m.st = 0.62; } return; }
      if (m.state === 'charge') { m.st -= A.dt; const hit = X.moveEnt(m, m.cx * 8 * A.dt, m.cy * 8 * A.dt); X.smashPots(m); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.2, m); m.atkCd = 0.8; } if (hit || m.st <= 0) { m.state = 'rest'; m.st = 0.9; if (hit) { X.shake(4, 0.15); X.sparks(m.x, m.y, '#B7836B', 10, 4); } } return; }
      if (m.state === 'slam') { m.st -= A.dt; if (m.st <= 0) { m.state = 'rest'; m.st = 0.7; X.slam(m.x, m.y, 2.3, m.dmg * 1.3, '#B7836B', m); } return; }
      if (m.state === 'rest') { m.st -= A.dt; if (m.st <= 0) m.state = 'move'; return; }
      A.steer(A.sp);
      if (m.cd <= 0 && A.los()) {
        if (A.d < 2.4) { m.cd = 3.2; m.state = 'slam'; m.st = 0.8; X.warn({ x: m.x, y: m.y, r: 2.3, life: 0.8, max: 0.8, src: m, follow: m }); }
        else if (A.d < 5.5) { m.cd = 3.5; m.state = 'wind'; m.st = 0.8; m.cx = A.ux; m.cy = A.uy; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5.5, w: m.r * 2, life: 0.8, max: 0.8, src: m }); }
      }
    },
    crab(m, A, X) {
      if (m.block > 0) { m.block -= A.dt; return; }
      if (A.d > 4.5 || !A.los()) A.steer(A.sp); else if (A.d < 2.5) X.moveEnt(m, -A.ux * A.sp * 0.6 * A.dt, -A.uy * A.sp * 0.6 * A.dt);
      if (m.cd <= 0 && A.d < 8 && A.los()) {
        m.cd = 3.4 + Math.random();
        const pts = [[X.me.x, X.me.y], [X.me.x + (Math.random() - 0.5) * 2.6, X.me.y + (Math.random() - 0.5) * 2.6], [X.me.x + (Math.random() - 0.5) * 2.6, X.me.y + (Math.random() - 0.5) * 2.6]];
        pts.forEach(([x, y], i) => X.after(i * 0.12, () => { if (!m.dead) X.lob(m.x, m.y - 0.3, x, y, { dur: 1.0, r: 0.95, dmg: m.dmg, kind: 'bubble', src: m }); }));
        X.sfx.bubble();
      }
    },
    frost(m, A, X) {
      if (m.charge > 0) {
        m.charge -= A.dt; m.spinFx = (m.spinFx || 0) + A.dt * 12;
        if (m.charge <= 0) { X.ringWave(m.x, m.y, { speed: 4.2, gaps: 3, dmg: m.dmg, chill: 1.6, color: '#BFEFFF', life: 1.7, w: 0.42 }); X.sfx.sparkle(); }
        return;
      }
      keepRange(m, A, X, 3, 5);
      if (m.cd <= 0 && A.d < 7 && A.los()) {
        m.cd = 3.4 + Math.random();
        if (Math.random() < 0.55) { m.charge = 0.65; X.warn({ x: m.x, y: m.y, r: 1.2, life: 0.65, max: 0.65, src: m, follow: m, color: '#7FD3F2' }); }
        else [-0.22, 0, 0.22].forEach(o => X.eshot(m.x, m.y, A.a + o, 7.5, { dmg: m.dmg * 0.8, style: 'shard', color: '#BFEFFF', chill: 1.2, r: 0.14 }));
      }
    },
    imp(m, A, X) {
      keepRange(m, A, X, 3, 6);
      if (m.cd <= 0 && A.d < 8.5 && A.los()) {
        m.cd = 2.6 + Math.random();
        const n = X.F.n >= 14 ? 2 : 1;
        for (let i = 0; i < n; i++) X.lob(m.x, m.y - 0.3, X.me.x + (i ? (Math.random() - 0.5) * 2.4 : 0), X.me.y + (i ? (Math.random() - 0.5) * 2.4 : 0), { dur: 0.95, r: 1.05, dmg: m.dmg, kind: 'fire', fire: 2.2, src: m });
        if (Math.random() < 0.3) X.text(m.x, m.y - m.r - 0.5, 'Hee hee!', '#FFB066', 12);
      }
    },
    nest(m, A, X) {
      if (m.cd <= 0 && A.d < 9 && m.kids < 3) { m.cd = 3.6; m.kids++; const c = X.spawnMon('blob', m.x + (Math.random() - 0.5), m.y + 0.6, { parent: m, aggro: true }); c.xp *= 0.5; X.g.total++; X.sparks(m.x, m.y, '#9C88D6', 10, 4); X.ring(m.x, m.y, 0.2, 1.2, 0.3, '#9C88D6'); }
    },
    cherub(m, A, X) {
      keepRange(m, A, X, 4, 6.5);
      m.healT = (m.healT || 2) - A.dt;
      if (m.healT <= 0) {
        m.healT = 4;
        let best = null, bf = 0.85;
        for (const o of X.mons) { if (o === m || o.dead || o.boss || o.type === 'gremlin') continue; const f = o.hp / o.maxhp; if (f < bf && Math.hypot(o.x - m.x, o.y - m.y) < 6) { bf = f; best = o; } }
        if (best) { const n = best.maxhp * 0.3; best.hp = Math.min(best.maxhp, best.hp + n); X.healBeam(m, best); X.text(best.x, best.y - best.r - 0.4, '+' + Math.round(n), '#8FE0A6', 13); }
      }
      if (m.cd <= 0 && A.d < 8 && A.los()) {
        m.cd = 3.2 + Math.random();
        for (let i = 0; i < 3; i++) X.after(i * 0.18, () => { if (m.dead) return; const x = X.me.x + (i ? (Math.random() - 0.5) * 3 : 0), y = X.me.y + (i ? (Math.random() - 0.5) * 3 : 0); X.pillar(x, y, 0.95, m.dmg, 1.0); });
      }
    },
    wisp(m, A, X) {
      if (m.charge > 0) { m.charge -= A.dt; if (m.charge <= 0) { const n = X.F.n >= 12 ? 8 : 6; for (let i = 0; i < n; i++) X.eshot(m.x, m.y, i / n * 6.283 + m.t, 3.3, { dmg: m.dmg, color: '#7FD3F2', core: '#FFFFFF' }); X.ring(m.x, m.y, 0.2, 1.4, 0.3, '#7FD3F2'); } return; }
      A.steer(A.sp * (0.7 + 0.3 * Math.sin(m.t * 2)));
      if (m.cd <= 0 && A.d < 7) { m.cd = 3 + Math.random(); m.charge = 0.5; X.warn({ x: m.x, y: m.y, r: 0.9, life: 0.5, max: 0.5, src: m, follow: m, color: '#7FD3F2' }); }
    },
    eye(m, A, X) {
      const L = m.laser;
      if (L) {
        L.t += A.dt;
        if (L.t < 0.95) { m.la += Math.max(-1.3 * A.dt, Math.min(1.3 * A.dt, angTo(m.la, A.a))); L.st = 'aim'; }
        else if (L.t < 1.25) L.st = 'lock';
        else if (L.t < 1.75) { if (L.st !== 'fire') { L.st = 'fire'; X.sfx.crash(); X.shake(3, 0.15); L.hit = 0; } L.hit -= A.dt; if (L.hit <= 0 && X.inLine(m.x, m.y, m.la, L.len, 0.55)) { L.hit = 0.3; X.hurtPet(m.dmg, m); } }
        else { m.laser = null; m.cd = 2.6 + Math.random(); }
        if (m.laser) m.laser.len = X.rayLen(m.x, m.y, m.la, 9);
        return;
      }
      keepRange(m, A, X, 3.5, 6.5);
      if (m.cd <= 0 && A.d < 8 && A.los()) { m.laser = { t: 0, st: 'aim', len: 9 }; m.la = A.a + (Math.random() - 0.5) * 0.6; }
    },
    knight(m, A, X) {
      if (m.act === 'spinw') { m.st -= A.dt; if (m.st <= 0) { m.act = 'spin'; m.st = 0.45; X.slam(m.x, m.y, 1.9, m.dmg * 1.2, '#E8EEF8', m, true); X.sfx.whoosh(); } return; }
      if (m.act === 'spin') { m.st -= A.dt; m.spinFx = (m.spinFx || 0) + A.dt * 20; if (m.st <= 0) m.act = 'move'; return; }
      if (m.act === 'lungew') { m.st -= A.dt; if (m.st <= 0) { m.act = 'lunge'; m.st = 0.36; m.hitT = 0; } return; }
      if (m.act === 'lunge') { m.st -= A.dt; m.hitT -= A.dt; X.moveEnt(m, m.lx * 12 * A.dt, m.ly * 12 * A.dt); if (m.hitT <= 0 && A.d < m.r + X.me.r + 0.25) { m.hitT = 0.6; X.hurtPet(m.dmg * 1.3, m); } if (m.st <= 0) { m.act = 'move'; m.cd = Math.max(m.cd, 1.6); } return; }
      A.steer(A.sp);
      if (m.cd <= 0 && A.los()) {
        if (A.d < 2.4) { m.cd = 3; m.act = 'spinw'; m.st = 0.6; X.warn({ x: m.x, y: m.y, r: 1.9, life: 0.6, max: 0.6, src: m, follow: m }); }
        else if (A.d < 5) { m.cd = 3.4; m.act = 'lungew'; m.st = 0.55; m.lx = A.ux; m.ly = A.uy; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 4.6, w: 1.1, life: 0.55, max: 0.55, src: m }); }
      }
    },
    skull(m, A, X) {
      if (m.pile) { m.pileT -= A.dt; if (m.pileT <= 0) { m.pile = false; m.rose = true; m.hp = m.maxhp * 0.5; X.text(m.x, m.y - m.r - 0.4, 'Rattle!', '#EDE6D6', 14); X.sparks(m.x, m.y, '#EDE6D6', 10, 4); X.sfx.twang(); } return; }
      keepRange(m, A, X, 2.8, 5);
      if (m.cd <= 0 && A.d < 6.5 && A.los()) { m.cd = 3.2 + Math.random(); X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5, w: 0.5, life: 0.35, max: 0.35, src: m }); const a = A.a; X.after(0.35, () => { if (!m.dead && !m.pile) X.eshot(m.x, m.y, a, 7.5, { dmg: m.dmg, style: 'bone', color: '#EDE6D6', r: 0.22, life: 3, boomer: { out: 0.7, home: m }, keep: true }); }); }
    },
    totem(m, A, X) {
      for (const o of X.mons) if (!o.dead && o !== m && !o.boss && Math.hypot(o.x - m.x, o.y - m.y) < 4.5) o.hasted = 0.25;
      if (m.cd <= 0 && A.d < 9) { m.cd = 3.8; X.warn({ x: m.x, y: m.y, r: 3.0, life: 1.0, max: 1.0, src: m, color: '#B983F5', fn: () => { if (m.dead) return; X.boom(m.x, m.y, 3, '#B983F5', '#FFFFFF', { n: 18, shake: 5, smoke: 2 }); if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 3.0 + X.me.r) X.hurtPet(m.dmg, m); } }); }
    },
    gremlin(m, A, X) {
      m.life -= A.dt;
      if (m.life <= 0) { X.gremlinEscape(m); return; }
      const s = A.d < 10 ? X.fleeStep(m) : null;
      const sp = A.sp * (A.d < 3 ? 1.15 : 1);
      if (s) { const dx = s[0] - m.x, dy = s[1] - m.y, dd = Math.hypot(dx, dy) || 1; X.moveEnt(m, dx / dd * sp * A.dt, dy / dd * sp * A.dt); m.face = dx >= 0 ? 1 : -1; }
      else if (A.d < 10) X.moveEnt(m, -A.ux * sp * A.dt, -A.uy * sp * A.dt);
      if (Math.random() < 0.08) X.part({ kind: 'spark', x: m.x, y: m.y - 0.2, vx: (Math.random() - 0.5) * 2, vy: -2, life: 0.4, max: 0.4, size: 2, color: '#FFD447' });
    },
    /* ---- new lands ---- */
    scorpion(m, A, X) { A.steer(A.sp * (A.d < 3 ? 1.3 : 1)); chaseHit(m, A, X, 1.1); },
    cactus(m, A, X) { if (m.cd <= 0 && A.d < 7 && A.los()) { m.cd = 2.4 + Math.random(); const a = A.a; [-0.15, 0.15].forEach(o => X.eshot(m.x, m.y - 0.3, a + o, 7, { dmg: m.dmg * 0.8, style: 'shard', color: '#C8F0A8', r: 0.13 })); X.sfx.pop(); } },
    penguin(m, A, X) {
      if (m.slide > 0) { m.slide -= A.dt; const hit = X.moveEnt(m, m.svx * A.dt, m.svy * A.dt); chaseHit(m, A, X, 1.2); if (hit) m.slide = 0; m.squash = 0.6; return; }
      m.squash = 0; A.steer(A.sp);
      if (A.d < 5 && A.d > 1.2 && m.cd <= 0 && A.los()) { m.cd = 3 + Math.random(); X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5.5, w: 0.9, life: 0.45, max: 0.45, src: m, color: '#BFEFFF' }); const a = A.a; X.after(0.45, () => { if (!m.dead) { m.slide = 0.6; m.svx = Math.cos(a) * 9; m.svy = Math.sin(a) * 9; X.sfx.whoosh(); } }); }
    },
    magmite(m, A, X) {
      if (m.hop) return hopTick(m, A, X, () => X.zone({ kind: 'efire', x: m.x, y: m.y, r: 0.9, life: 2.2, max: 2.2, dps: m.dmg * 0.6, tick: 0, own: 'enemy' }));
      A.steer(A.sp);
      if (Math.random() < A.dt * 3) X.part({ kind: 'ember', x: m.x + (Math.random() - 0.5) * m.r, y: m.y - m.r * 0.5, vx: 0, vy: -2, life: 0.5, max: 0.5, size: 3, color: '#FF9F43' });
      if (A.d < 3.6 && A.d > 0.9 && m.cd <= 0 && A.los()) { m.cd = 3 + Math.random(); startHop(m, X, X.me.x, X.me.y, { r: 1.2, h: 1.4, mul: 1.2 }); }
    },
    goat(m, A, X) {
      if (m.state === 'wind') { m.st -= A.dt; if (m.st <= 0) { m.state = 'charge'; m.st = 0.55; } return; }
      if (m.state === 'charge') { m.st -= A.dt; const hit = X.moveEnt(m, m.cx * 10 * A.dt, m.cy * 10 * A.dt); chaseHit(m, A, X, 1.3); if (hit || m.st <= 0) { m.state = 'move'; m.cd = 2.6 + Math.random(); if (hit) { X.shake(3, 0.12); X.sparks(m.x, m.y, '#B9B2A6', 8, 4); } } return; }
      A.steer(A.sp);
      if (m.cd <= 0 && A.d < 6 && A.d > 1.5 && A.los()) { m.state = 'wind'; m.st = 0.55; m.cx = A.ux; m.cy = A.uy; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 6, w: m.r * 2, life: 0.55, max: 0.55, src: m }); }
    },
    drone(m, A, X) {
      if (m.laser) { const L = m.laser; L.t += A.dt; if (L.t < 0.7) { m.la += Math.max(-1.6 * A.dt, Math.min(1.6 * A.dt, angTo(m.la, A.a))); L.st = 'aim'; } else if (L.t < 0.9) L.st = 'lock'; else if (L.t < 1.3) { if (L.st !== 'fire') { L.st = 'fire'; X.sfx.crash(); L.hit = 0; } L.hit -= A.dt; if (L.hit <= 0 && X.inLine(m.x, m.y, m.la, L.len, 0.45)) { L.hit = 0.3; X.hurtPet(m.dmg * 0.9, m); } } else { m.laser = null; m.cd = 2.8 + Math.random(); } if (m.laser) m.laser.len = X.rayLen(m.x, m.y, m.la, 8); return; }
      keepRange(m, A, X, 3.5, 6);
      if (m.cd <= 0 && A.d < 7.5 && A.los()) { m.laser = { t: 0, st: 'aim', len: 8 }; m.la = A.a + (Math.random() - 0.5) * 0.5; }
    },
    bot(m, A, X) {
      A.steer(A.sp);
      if (m.cd <= 0 && A.d < 8 && A.los()) { m.cd = 3 + Math.random(); const a = A.a; [-0.3, 0.3].forEach((o, i) => X.after(i * 0.15, () => { if (!m.dead) X.eshot(m.x, m.y - 0.3, a + o, 5, { dmg: m.dmg * 0.8, home: 1.4, life: 3, color: '#FF7A3D', core: '#FFE37A', r: 0.18, style: 'fire' }); })); X.sfx.pop(); }
    },
    gearbug(m, A, X) { const w = Math.sin(m.t * 5 + m.wob) * 1.4; A.steer(A.sp); X.moveEnt(m, -A.uy * w * A.dt, A.ux * w * A.dt); chaseHit(m, A, X, 1); },
    spiderling(m, A, X) {
      if (m.hop) return hopTick(m, A, X);
      keepRange(m, A, X, 2.5, 5);
      if (m.cd <= 0 && A.d < 4.5 && A.los()) { m.cd = 3 + Math.random(); startHop(m, X, X.me.x, X.me.y, { r: 1.1, h: 1.1, mul: 1.2, wind: 0.4, dur: 0.45 }); }
    },
    wolf(m, A, X) {
      if (m.state === 'wind') { m.st -= A.dt; if (m.st <= 0) { m.state = 'pounce'; m.st = 0.4; } return; }
      if (m.state === 'pounce') { m.st -= A.dt; X.moveEnt(m, m.cx * 11 * A.dt, m.cy * 11 * A.dt); chaseHit(m, A, X, 1.3); if (m.st <= 0) { m.state = 'move'; m.cd = 2.4 + Math.random(); } return; }
      // circle the pet, then pounce from the side
      if (A.d > 4.5 || !A.los()) A.steer(A.sp); else { const s = m.wob > 3 ? 1 : -1; X.moveEnt(m, (-A.uy * s * 0.9 + A.ux * 0.3) * A.sp * A.dt, (A.ux * s * 0.9 + A.uy * 0.3) * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; }
      if (m.cd <= 0 && A.d < 4.8 && A.los()) { m.state = 'wind'; m.st = 0.45; m.cx = A.ux; m.cy = A.uy; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 4.6, w: m.r * 2, life: 0.45, max: 0.45, src: m }); }
    },
    bee(m, A, X) {
      if (m.swoop > 0) { m.swoop -= A.dt; if (m.swoop > 0.3) return; X.moveEnt(m, m.svx * A.dt, m.svy * A.dt); chaseHit(m, A, X, 1.1); return; }
      keepRange(m, A, X, 1.8, 3.5); const w = Math.sin(m.t * 9 + m.wob) * 1.2; X.moveEnt(m, -A.uy * w * A.dt, A.ux * w * A.dt);
      if (A.d < 3.2 && m.cd <= 0 && A.los()) { m.cd = 2.4 + Math.random(); m.swoop = 0.3 + 0.3; m.svx = A.ux * 9; m.svy = A.uy * 9; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 3.4, w: 0.7, life: 0.3, max: 0.3, src: m, color: '#FFD447' }); }
    },
    tulip(m, A, X) { if (m.cd <= 0 && A.d < 7 && A.los()) { m.cd = 2.6 + Math.random(); const a = A.a; [-0.2, 0, 0.2].forEach(o => X.eshot(m.x, m.y - 0.4, a + o, 5.5, { dmg: m.dmg * 0.75, style: 'spore', color: '#FF9BD2' })); X.sfx.pop(); } },
    goblin(m, A, X) {
      keepRange(m, A, X, 3.5, 6);
      if (m.cd <= 0 && A.d < 8 && A.los()) { m.cd = 2.8 + Math.random(); X.lob(m.x, m.y - 0.4, X.me.x + (Math.random() - 0.5) * 1.5, X.me.y + (Math.random() - 0.5) * 1.5, { dur: 0.9, r: 1.1, dmg: m.dmg, kind: 'fire', src: m }); if (Math.random() < 0.35) X.say(m, ['Hehe!', 'Catch!', 'Boom!'][Math.floor(Math.random() * 3)]); }
    },
    kitten(m, A, X) {
      if (m.hop) return hopTick(m, A, X);
      keepRange(m, A, X, 2.5, 5);
      if (m.cd <= 0 && A.d < 4.5 && A.los()) { m.cd = 3 + Math.random(); startHop(m, X, X.me.x, X.me.y, { r: 1.1, h: 1.3, mul: 1.2, wind: 0.4, dur: 0.45 }); if (Math.random() < 0.4) X.say(m, 'Mrow!'); }
    },
  };
  /* elite powers */
  function affix(m, A, X, k) {
    if (k === 'molten') { m.trailT = (m.trailT || 0) - A.dt; if (m.trailT <= 0 && m.moved) { m.trailT = 0.35; X.zone({ kind: 'efire', x: m.x, y: m.y, r: 0.6, life: 2.2, max: 2.2, dps: m.dmg * 0.7, tick: 0, own: 'enemy' }); } }
    else if (k === 'frozen') { m.novaT = (m.novaT == null ? 2 + Math.random() * 2 : m.novaT) - A.dt; if (m.novaT <= 0 && A.d < 6) { m.novaT = 4.2; X.warn({ x: m.x, y: m.y, r: 2.4, life: 0.85, max: 0.85, src: m, follow: m, color: '#7FD3F2', fn: () => { if (m.dead) return; X.boom(m.x, m.y, 2.4, '#7FD3F2', '#FFFFFF', { n: 16, shake: 4 }); if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 2.4 + X.me.r && X.hurtPet(m.dmg, m)) X.chillPet(1.8); } }); } }
    else if (k === 'swift') { if (m.moved && Math.random() < 0.3) X.part({ kind: 'afterM', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: m.r, color: AFFIXES.swift.color, m }); }
    else if (k === 'shielded') { m.shieldT = (m.shieldT || 0) - A.dt; if (m.shieldT <= 0 && m.shield < m.shieldMax) m.shield = Math.min(m.shieldMax, m.shield + m.shieldMax * 0.25 * A.dt); }
    else if (k === 'arcane') { m.arcT = (m.arcT == null ? 1.5 + Math.random() * 2 : m.arcT) - A.dt; if (m.arcT <= 0 && A.d < 8) { m.arcT = 3.2; [-0.5, 0.5].forEach(o => X.eshot(m.x, m.y, A.a + o, 2.6, { dmg: m.dmg * 0.7, home: 1.6, life: 4, color: '#B983F5', core: '#FFFFFF', r: 0.2 })); } }
  }

  /* ---------- bosses ---------- */
  const elCol = B => ({ fire: '#FF7A3D', frost: '#BFEFFF', spark: '#FFE37A', leaf: '#9BE07A', shadow: '#E07BF0' }[B.el] || B.glow);
  const boss = {
    king(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.2 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['jump', 'jump', 'spit', 'summon', 'ring'] : ['jump', 'spit', 'summon']); }
      const T = m.actT;
      switch (m.act) {
        case 'jump': {
          if (m.step === 0) { m.step = 1; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; m.sx = m.x; m.sy = m.y; X.warn({ x: m.jx, y: m.jy, r: 2.4, life: 1.15, max: 1.15 }); X.say(m, 'Boing!'); }
          if (T < 0.25) { m.squash = T / 0.25; break; }
          const u = Math.min(1, (T - 0.25) / 0.9);
          m.x = m.sx + (m.jx - m.sx) * u; m.y = m.sy + (m.jy - m.sy) * u; m.z = Math.sin(u * PI) * 4; m.squash = 0;
          if (u >= 1 && m.step === 1) { m.step = 2; m.z = 0; X.unstick(m); X.slam(m.x, m.y, 2.4, m.dmg * 1.6, '#B39CFF', m); X.boom(m.x, m.y, 2.4, '#B39CFF', '#FFFFFF', { n: 24, shake: 12, smoke: 8 }); const n = m.phase >= 2 ? 14 : 8; for (let i = 0; i < n; i++) X.eshot(m.x, m.y, i / n * 6.283 + m.t, m.phase >= 2 ? 4 : 3.4, { dmg: m.dmg * 0.75 }); X.sfx.crash(); }
          if (T > 1.6) done(m, 1.4);
          break;
        }
        case 'spit': if (T > m.step * 0.38 && m.step < (m.phase >= 2 ? 3 : 2)) { m.step++; for (let i = -2; i <= 2; i++) X.eshot(m.x, m.y, A.a + i * 0.2, 5, { dmg: m.dmg * 0.6 }); X.sfx.pop(); } if (T > 1.3) done(m, 1.2); break;
        case 'summon': if (m.step === 0) { m.step = 1; summon(m, X, m.phase >= 2 ? ['blob', 'blob', 'bat', 'blob', 'bat'] : ['blob', 'bat', 'blob']); X.say(m, 'Minions!'); } if (T > 1) done(m, 1.6); break;
        case 'ring': if (m.step === 0) { m.step = 1; for (let i = 0; i < 3; i++) X.after(i * 0.4, () => X.ringWave(m.x, m.y, { speed: 5, gaps: 4, dmg: m.dmg, color: '#B39CFF', life: 1.4, w: 0.42 })); } if (T > 1.6) done(m, 1.2); break;
        default: done(m, 1);
      }
    },
    hydra(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 4 ? 1 : 0.2)); return pick(m, X, m.phase >= 2 ? ['bite', 'bite', 'spit', 'dive', 'summon'] : ['bite', 'spit', 'dive']); }
      const T = m.actT, heads = X.hydraHeads(m);
      switch (m.act) {
        case 'bite': {
          const n = m.phase >= 2 ? 3 : 2;
          if (m.step < n && T > m.step * 0.55) {
            const h = heads[(m.step + (m.seed || 0)) % heads.length], a = Math.atan2(X.me.y - h.y, X.me.x - h.x), i = m.step;
            m.step++; m.bites = m.bites || []; m.bites[i] = { a, t: 0, hx: h.x, hy: h.y, k: (i + (m.seed || 0)) % heads.length };
            X.warn({ shape: 'line', x: h.x, y: h.y, a, len: 7, w: 1.15, life: 0.6, max: 0.6, fn: () => { if (X.inLine(h.x, h.y, a, 7, 1.15)) X.hurtPet(m.dmg * 1.3, m); X.shake(5, 0.15); X.sfx.crash(); if (m.bites && m.bites[i]) m.bites[i].snap = 0.3; } });
          }
          if (T > n * 0.55 + 0.9) { m.bites = null; m.seed = (m.seed || 0) + 1; done(m, 1.1); }
          break;
        }
        case 'spit': if (m.step === 0) { m.step = 1; heads.forEach((h, i) => { const k = m.phase >= 2 ? 2 : 1; for (let j = 0; j < k; j++) X.after(i * 0.2 + j * 0.3, () => { const x = X.me.x + (Math.random() - 0.5) * 3.5, y = X.me.y + (Math.random() - 0.5) * 3.5; X.lob(h.x, h.y, x, y, { dur: 1.0, r: 1.15, dmg: m.dmg * 0.9, kind: 'poison', poison: 3.2, src: m }); }); }); X.say(m, 'Hssss!'); } if (T > 1.6) done(m, 1.2); break;
        case 'dive': {
          if (m.step === 0) { m.step = 1; m.under = true; X.splash(m.x, m.y, 2); X.say(m, 'Blub!'); }
          if (m.step === 1 && T > 0.5) { m.step = 2; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; X.warn({ x: p.x, y: p.y, r: 2.3, life: 1.1, max: 1.1, fn: () => { m.x = m.jx; m.y = m.jy; X.unstick(m); m.under = false; X.splash(m.x, m.y, 2.6); X.slam(m.x, m.y, 2.3, m.dmg * 1.5, '#9BE07A', m); for (let i = 0; i < 10; i++) X.eshot(m.x, m.y, i / 10 * 6.283, 3.6, { dmg: m.dmg * 0.6, color: '#9BE07A', style: 'spore' }); } }); }
          if (T > 2.1) done(m, 1.3);
          break;
        }
        case 'summon': if (m.step === 0) { m.step = 1; summon(m, X, ['toad', 'blob', 'toad']); X.say(m, 'Come, children!'); } if (T > 1) done(m, 1.4); break;
        default: done(m, 1);
      }
    },
    moth(m, A, X, B) {
      const r0 = home(X, m);
      if (m.act === 'move') { const tx = r0.x + Math.sin(X.g.t * 0.7) * 4.5, ty = r0.y - 2 + Math.sin(X.g.t * 1.4) * 2; X.moveEnt(m, (tx - m.x) * 1.5 * A.dt, (ty - m.y) * 1.5 * A.dt); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['swoop', 'spiral', 'dust', 'swoop'] : ['swoop', 'spiral', 'dust']); }
      const T = m.actT;
      switch (m.act) {
        case 'swoop':
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 11, w: 1.6, life: 0.75, max: 0.75 }); }
          if (T > 0.75 && T < 1.45) { const hit = X.moveEnt(m, Math.cos(m.sa) * 14 * A.dt, Math.sin(m.sa) * 14 * A.dt); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.3, m); m.atkCd = 0.6; } if (Math.random() < 0.6) X.part({ kind: 'glow', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: 1, color: '#FF9BD2' }); if (hit) m.actT = 1.45; }
          if (T > 1.8) done(m, 1.1);
          break;
        case 'spiral': spiral(m, A, X, '#D98BFF'); break;
        case 'dust': if (m.step === 0) { m.step = 1; for (let i = 0; i < (m.phase >= 2 ? 6 : 4); i++) { const x = X.me.x + (Math.random() - 0.5) * 5, y = X.me.y + (Math.random() - 0.5) * 5; X.warn({ x, y, r: 1.4, life: 0.7, max: 0.7, fn: () => X.zone({ kind: 'poison', x, y, r: 1.4, life: 4, max: 4, dps: m.dmg * 0.9, tick: 0, own: 'enemy' }) }); } } if (T > 1) done(m, 1.4); break;
        default: done(m, 1);
      }
    },
    titan(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.2 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['charge', 'slam', 'rocks', 'slam', 'pools'] : ['charge', 'slam', 'rocks']); }
      const T = m.actT, col = elCol(B);
      switch (m.act) {
        case 'charge':
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 14, w: m.r * 2, life: 1, max: 1 }); X.say(m, 'RRRAH!'); }
          if (T > 1 && m.step === 1) { const hit = X.moveEnt(m, Math.cos(m.sa) * 11 * A.dt, Math.sin(m.sa) * 11 * A.dt); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.5, m); m.atkCd = 0.8; } if (hit || T > 2.6) { m.step = 2; X.shake(12, 0.4); X.boom(m.x + Math.cos(m.sa) * m.r, m.y + Math.sin(m.sa) * m.r, 1.8, '#B7836B', '#FFE3C2', { n: 18, smoke: 8 }); m.stunT = 1.6; m.act = 'stunned'; X.text(m.x, m.y - m.r - 0.6, 'STUNNED!', '#FFE37A', 18); for (let i = 0; i < 5; i++) X.after(0.2 + i * 0.12, () => X.rockFall(X.me.x + (Math.random() - 0.5) * 6, X.me.y + (Math.random() - 0.5) * 6, m.dmg)); } }
          break;
        case 'stunned': if (m.stunT <= 0) done(m, 0.8); else m.stunT -= A.dt; break;
        case 'slam': if (m.step === 0) { m.step = 1; m.squash = 1; X.say(m, 'SMASH!'); } if (T > 0.6 && m.step === 1) { m.step = 2; m.squash = 0; X.shake(12, 0.4); for (let i = 0; i < 3; i++) X.after(i * 0.45, () => X.ringWave(m.x, m.y, { speed: 6, gaps: 4, dmg: m.dmg, color: col, life: 1.3, w: 0.45, chill: B.el === 'frost' ? 1.4 : 0 })); X.sfx.crash(); } if (T > 2.2) done(m, 1.2); break;
        case 'rocks': if (m.step === 0) { m.step = 1; const n = m.phase >= 2 ? 6 : 4; for (let i = 0; i < n; i++) X.after(i * 0.2, () => X.rockFall(X.me.x + (Math.random() - 0.5) * 3, X.me.y + (Math.random() - 0.5) * 3, m.dmg)); } if (T > 1.6) done(m, 1.2); break;
        case 'pools': if (m.step === 0) { m.step = 1; for (let i = 0; i < 4; i++) { const x = X.me.x + (Math.random() - 0.5) * 5, y = X.me.y + (Math.random() - 0.5) * 5; X.warn({ x, y, r: 1.3, life: 0.8, max: 0.8, color: col, fn: () => X.zone({ kind: B.el === 'frost' ? 'poison' : 'efire', x, y, r: 1.3, life: 4, max: 4, dps: m.dmg * 0.8, tick: 0, own: 'enemy' }) }); } X.say(m, B.el === 'frost' ? 'Shatter!' : 'Burn!'); } if (T > 1.2) done(m, 1.2); break;
        default: done(m, 1);
      }
    },
    wizard(m, A, X, B) {
      if (m.act === 'move') { m.x += Math.sin(X.g.t * 1.3) * 0.6 * A.dt; m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['spiral', 'homing', 'summon', 'storm', 'blink', 'ice'] : ['spiral', 'homing', 'summon', 'blink', 'ice']); }
      const T = m.actT;
      switch (m.act) {
        case 'spiral': spiral(m, A, X, '#7FD3F2'); break;
        case 'homing': if (m.step === 0) { m.step = 1; for (let i = 0; i < 5; i++) X.eshot(m.x, m.y, A.a + (i - 2) * 0.5, 2.4, { dmg: m.dmg * 0.8, home: 1.8, life: 4.5, r: 0.22, color: '#B983F5', core: '#FFFFFF' }); X.say(m, 'Seek!'); } if (T > 1.4) done(m, 1.4); break;
        case 'summon': if (m.step === 0) { m.step = 1; summon(m, X, m.phase >= 2 ? ['frost', 'wisp', 'frost'] : ['frost', 'wisp']); X.say(m, 'Arise!'); } if (T > 1) done(m, 1.6); break;
        case 'storm': if (m.step === 0) { m.step = 1; for (let i = 0; i < 6; i++) { const x = X.me.x + (Math.random() - 0.5) * 4.5, y = X.me.y + (Math.random() - 0.5) * 4.5; X.warn({ x, y, r: 1.1, life: 0.85 + i * 0.08, max: 0.85 + i * 0.08, fn: () => { X.bolt(x, y, '#7FD3F2'); if (Math.hypot(X.me.x - x, X.me.y - y) < 1.1 + X.me.r) X.hurtPet(m.dmg, m); X.boom(x, y, 1.1, '#7FD3F2', '#FFFFFF', { n: 8, shake: 4, smoke: 1 }); } }); } } if (T > 1.6) done(m, 1.2); break;
        case 'ice': if (m.step === 0) { m.step = 1; X.ringWave(m.x, m.y, { speed: 3.8, gaps: m.phase >= 2 ? 2 : 3, dmg: m.dmg, chill: 1.8, color: '#BFEFFF', life: 2.4, w: 0.45 }); X.say(m, 'Freeze!'); } if (T > 1.2) done(m, 1.0); break;
        case 'blink': {
          if (m.step === 0) { m.step = 1; X.ring(m.x, m.y, 0.2, 2, 0.4, '#7FD3F2'); X.sparks(m.x, m.y, '#7FD3F2', 16, 6); }
          if (T > 0.35 && m.step === 1) { m.step = 2; for (let i = 0; i < 30; i++) { const a = Math.random() * 6.283, d = 3.5 + Math.random() * 3, x = X.me.x + Math.cos(a) * d, y = X.me.y + Math.sin(a) * d; if (!X.blocked(x, y, m.r, 0)) { m.x = x; m.y = y; break; } } X.ring(m.x, m.y, 2, 0.2, 0.4, '#7FD3F2'); X.sparks(m.x, m.y, '#7FD3F2', 16, 6); }
          if (T > 0.7) done(m, 0.6);
          break;
        }
        default: done(m, 1);
      }
    },
    dragon(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.2 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['breath', 'tail', 'fireballs', 'dive', 'breath'] : ['breath', 'tail', 'fireballs']); }
      const T = m.actT, col = elCol(B), col2 = B.el === 'frost' ? '#FFFFFF' : B.el === 'spark' ? '#FFFFFF' : B.el === 'leaf' ? '#D8FF8A' : '#FF9F43';
      switch (m.act) {
        case 'breath': {
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 7, spread: 0.55, life: 0.9, max: 0.9, color: col }); X.say(m, B.el === 'frost' ? 'FWOOOSH' : B.el === 'spark' ? 'KRAKOOM' : B.el === 'leaf' ? 'HSSSSS' : 'FWOOOSH'); }
          if (T > 0.9 && T < 2.9) { const aa = m.sa + Math.sin((T - 0.9) * 2.4) * 0.5; m.ba = aa; for (let i = 0; i < 3; i++) X.part({ kind: 'ember', x: m.x + Math.cos(aa) * m.r, y: m.y + Math.sin(aa) * m.r, vx: Math.cos(aa + (Math.random() - 0.5) * 0.5) * 9, vy: Math.sin(aa + (Math.random() - 0.5) * 0.5) * 9, life: 0.75, max: 0.75, size: 7 + Math.random() * 5, color: Math.random() < 0.5 ? col : col2, drag: 0.6 }); if (Math.abs(angTo(aa, Math.atan2(X.me.y - m.y, X.me.x - m.x))) < 0.3 && A.d < 7 && m.atkCd <= 0) { if (X.hurtPet(m.dmg * 0.7, m) && B.el === 'frost') X.chillPet(1.2); m.atkCd = 0.35; } X.light(m.x + Math.cos(aa) * 3, m.y + Math.sin(aa) * 3, 3.5, 0.1); }
          if (T > 3.2) { m.ba = null; done(m, 1.2); }
          break;
        }
        case 'tail': if (m.step === 0) { m.step = 1; X.warn({ x: m.x, y: m.y, r: 3.2, life: 0.7, max: 0.7, follow: m, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 3.2 + X.me.r) X.hurtPet(m.dmg * 1.3, m); X.ring(m.x, m.y, 0.5, 3.4, 0.35, col, 0.5); X.shake(8, 0.25); X.sparks(m.x, m.y, col, 16, 8); } }); } if (T > 1.2) done(m, 1); break;
        case 'fireballs': if (m.step === 0) { m.step = 1; const n = m.phase >= 2 ? 8 : 6; for (let i = 0; i < n; i++) X.after(i * 0.15, () => X.lob(m.x, m.y - m.r, X.me.x + (Math.random() - 0.5) * 6, X.me.y + (Math.random() - 0.5) * 6, { dur: 0.9, r: 1.2, dmg: m.dmg, kind: B.el === 'leaf' ? 'poison' : 'fire', fire: B.el === 'fire' ? 3 : 0, poison: B.el === 'leaf' ? 3 : 0, src: m, color: col })); } if (T > 2) done(m, 1.2); break;
        case 'dive': {
          if (m.step === 0) { m.step = 1; m.z = 0; X.say(m, 'From above!'); }
          if (T < 0.5) m.z = T * 18;
          else if (m.step === 1) { m.step = 2; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; X.warn({ x: m.jx, y: m.jy, r: 2.6, life: 1, max: 1 }); }
          if (m.step === 2 && T > 1.5) { m.step = 3; m.x = m.jx; m.y = m.jy; m.z = 0; X.unstick(m); X.slam(m.x, m.y, 2.6, m.dmg * 1.6, col, m); X.boom(m.x, m.y, 2.6, col, '#FFE37A', { n: 30, shake: 14, smoke: 10 }); for (let i = 0; i < 14; i++) X.eshot(m.x, m.y, i / 14 * 6.283, 4.2, { dmg: m.dmg * 0.7, color: col, style: B.el === 'fire' ? 'fire' : 'orb' }); }
          if (T > 2.1) done(m, 1.2);
          break;
        }
        default: done(m, 1);
      }
    },
    seraph(m, A, X, B) {
      const r0 = home(X, m);
      if (m.act === 'move') { const tx = r0.x + Math.sin(X.g.t * 0.6) * 4, ty = r0.y - 2.5 + Math.cos(X.g.t * 0.9) * 1.5; X.moveEnt(m, (tx - m.x) * 1.4 * A.dt, (ty - m.y) * 1.4 * A.dt); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['pillars', 'feathers', 'halo', 'judgment', 'summon'] : ['pillars', 'feathers', 'halo']); }
      const T = m.actT;
      switch (m.act) {
        case 'pillars': if (m.step === 0) { m.step = 1; const a = A.a, n = m.phase >= 2 ? 9 : 7; for (let i = 0; i < n; i++) X.after(i * 0.12, () => { const d = 1.2 + i * 1.1, x = m.x + Math.cos(a) * d, y = m.y + Math.sin(a) * d; X.pillar(x, y, 1.0, m.dmg, 0.85); if (m.phase >= 2) X.pillar(m.x + Math.cos(a + 0.6) * d, m.y + Math.sin(a + 0.6) * d, 0.9, m.dmg, 0.85); }); X.say(m, 'Behold!'); } if (T > 2) done(m, 1.1); break;
        case 'feathers': if (T > m.step * 0.5 && m.step < 3) { const off = m.step * 0.13; m.step++; for (let i = 0; i < 16; i++) X.eshot(m.x, m.y, i / 16 * 6.283 + off, 4, { dmg: m.dmg * 0.6, style: 'feather', color: '#FFE7A8', r: 0.15 }); X.sfx.whoosh(); } if (T > 1.8) done(m, 1.1); break;
        case 'halo': if (m.step === 0) { m.step = 1; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 8, w: 0.9, life: 0.5, max: 0.5 }); const a = A.a; X.after(0.5, () => { if (!m.dead) X.eshot(m.x, m.y - m.r, a, 9, { dmg: m.dmg * 1.1, style: 'halo', color: '#FFE37A', r: 0.42, life: 3.5, boomer: { out: 0.85, home: m }, keep: true }); }); X.say(m, 'Catch!'); } if (T > 2.4) done(m, 0.9); break;
        case 'judgment': if (m.step === 0) { m.step = 1; const a0 = A.a - 0.7; X.zone({ kind: 'sweep', own: 'enemy', src: m, x: m.x, y: m.y, a: a0, va: 0.95, len: 13, w: 1.3, life: 2.6, max: 2.6, warm: 0.9, dmg: m.dmg * 0.8, hitT: 0 }); X.say(m, 'JUDGMENT!'); } if (T > 2.8) done(m, 1.2); break;
        case 'summon': if (m.step === 0) { m.step = 1; summon(m, X, ['cherub', 'cherub']); X.say(m, 'Little ones!'); } if (T > 1) done(m, 1.4); break;
        default: done(m, 1);
      }
    },
    shade(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.4)); return pick(m, X, m.phase >= 2 ? ['lunge', 'clones', 'rain', 'void', 'lunge'] : ['lunge', 'clones', 'rain']); }
      const T = m.actT;
      switch (m.act) {
        case 'lunge': {
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 7, w: 1.4, life: 0.6, max: 0.6 }); X.say(m, 'Kneel!'); }
          if (T > 0.6 && T < 1.05) { const hit = X.moveEnt(m, Math.cos(m.sa) * 15 * A.dt, Math.sin(m.sa) * 15 * A.dt); if (A.d < m.r + X.me.r + 0.2 && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.3, m); m.atkCd = 0.6; } X.part({ kind: 'afterM', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.3, max: 0.3, size: m.r, color: '#E07BF0', m }); if (hit) m.actT = 1.05; }
          if (T >= 1.05 && m.step === 1) { m.step = 2; const a = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'cone', x: m.x, y: m.y, a, len: 3.4, spread: 0.9, life: 0.4, max: 0.4, fn: () => { if (X.inCone(m.x, m.y, a, 3.4, 0.9)) X.hurtPet(m.dmg * 1.2, m); X.slash(m.x, m.y, a, 3.4, '#E07BF0'); X.sfx.whoosh(); } }); }
          if (T > 1.9) done(m, m.phase >= 2 ? 0.6 : 1.0);
          break;
        }
        case 'clones': {
          if (m.step === 0) {
            m.step = 1; const r0 = home(X, m);
            const spots = [[r0.x - 5, r0.y - 4], [r0.x + 5, r0.y - 4], [r0.x - 5, r0.y + 4], [r0.x + 5, r0.y + 4]];
            spots.forEach(([x, y], i) => { const p = X.walkPoint(x, y, m); x = p.x; y = p.y; const a = Math.atan2(X.me.y - y, X.me.x - x); X.zone({ kind: 'clone', own: 'enemy', x, y, a, life: 1.4, max: 1.4 }); X.warn({ shape: 'line', x, y, a, len: 16, w: 1.0, life: 1.1 + i * 0.08, max: 1.1 + i * 0.08, fn: () => { X.beamFx(x, y, a, 16, '#E07BF0'); if (X.inLine(x, y, a, 16, 1.0)) X.hurtPet(m.dmg, m); } }); });
            X.say(m, 'Shadows!'); X.ring(m.x, m.y, 0.2, 2, 0.4, '#E07BF0');
          }
          if (T > 1.8) done(m, 1.0);
          break;
        }
        case 'rain': if (m.step === 0) { m.step = 1; const n = m.phase >= 2 ? 14 : 10; for (let i = 0; i < n; i++) X.after(i * 0.11, () => { const x = X.me.x + (Math.random() - 0.5) * 5, y = X.me.y + (Math.random() - 0.5) * 5; X.warn({ x, y, r: 0.85, life: 0.75, max: 0.75, color: '#E07BF0', fn: () => { X.bolt(x, y, '#E07BF0'); if (Math.hypot(X.me.x - x, X.me.y - y) < 0.85 + X.me.r) X.hurtPet(m.dmg * 0.9, m); X.boom(x, y, 0.85, '#E07BF0', '#FFFFFF', { n: 6, shake: 2, smoke: 1 }); } }); }); X.say(m, 'Fall!'); } if (T > 2) done(m, 1.0); break;
        case 'void': if (m.step === 0) { m.step = 1; for (let i = 0; i < 3; i++) { const x = X.me.x + (Math.random() - 0.5) * 6, y = X.me.y + (Math.random() - 0.5) * 6; X.warn({ x, y, r: 1.5, life: 0.8, max: 0.8, color: '#B07CF0', fn: () => X.zone({ kind: 'evoid', x, y, r: 1.6, life: 4, max: 4, dps: m.dmg * 0.8, tick: 0, own: 'enemy', pull: 1.6 }) }); } summon(m, X, ['knight']); } if (T > 1.2) done(m, 1.0); break;
        default: done(m, 1);
      }
    },
    /* ---- the new bosses ---- */
    sandworm(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['burrow', 'spit', 'sweep', 'burrow', 'storm'] : ['burrow', 'spit', 'sweep']); }
      const T = m.actT;
      switch (m.act) {
        case 'burrow': {
          if (m.step === 0) { m.step = 1; m.under = true; X.ring(m.x, m.y, 0.5, 2.2, 0.4, '#D9B36B', 0.3); for (let i = 0; i < 14; i++) { const a = Math.random() * 6.283; X.part({ kind: 'shard', x: m.x, y: m.y, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4 - 2, g: 9, life: 0.6, max: 0.6, size: 5, rot: a, vr: 9, color: '#D9B36B' }); } X.say(m, 'Grrrrl...'); X.sfx.thud(); }
          if (m.step === 1 && T > 0.6) { m.step = 2; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; X.warn({ x: p.x, y: p.y, r: 2.5, life: 1.2, max: 1.2, color: '#D9B36B', fn: () => { m.x = m.jx; m.y = m.jy; X.unstick(m); m.under = false; X.slam(m.x, m.y, 2.5, m.dmg * 1.5, '#D9B36B', m); X.boom(m.x, m.y, 2.5, '#D9B36B', '#FFF0C2', { n: 26, shake: 12, smoke: 10 }); const n = m.phase >= 2 ? 12 : 8; for (let i = 0; i < n; i++) X.eshot(m.x, m.y, i / n * 6.283, 3.8, { dmg: m.dmg * 0.65, color: '#D9B36B', core: '#FFF0C2' }); } }); }
          if (T > 2.3) done(m, 1.2);
          break;
        }
        case 'spit': if (T > m.step * 0.4 && m.step < (m.phase >= 2 ? 3 : 2)) { m.step++; for (let i = -2; i <= 2; i++) X.eshot(m.x, m.y - m.r * 0.6, A.a + i * 0.22, 5.5, { dmg: m.dmg * 0.65, color: '#D9B36B', core: '#FFF0C2' }); X.sfx.pop(); } if (T > 1.4) done(m, 1.1); break;
        case 'sweep': {
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 12, w: m.r * 2, life: 0.9, max: 0.9, color: '#D9B36B' }); X.say(m, 'RRAAAH!'); }
          if (T > 0.9 && T < 2.0) { const hit = X.moveEnt(m, Math.cos(m.sa) * 10 * A.dt, Math.sin(m.sa) * 10 * A.dt); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.3, m); m.atkCd = 0.7; } if (Math.random() < 0.7) X.part({ kind: 'smoke', x: m.x - Math.cos(m.sa) * m.r, y: m.y, vx: 0, vy: -0.5, life: 0.5, max: 0.5, size: 0.3, color: 'rgba(217,179,107,' }); if (hit) m.actT = 2.0; }
          if (T > 2.3) done(m, 1.1);
          break;
        }
        case 'storm': if (m.step === 0) { m.step = 1; X.zone({ kind: 'sweep', own: 'enemy', src: m, x: m.x, y: m.y, a: A.a - 0.8, va: 1.0, len: 10, w: 1.2, life: 2.6, max: 2.6, warm: 0.9, dmg: m.dmg * 0.8, hitT: 0 }); X.say(m, 'Sandstorm!'); } if (T > 2.8) done(m, 1.2); break;
        default: done(m, 1);
      }
    },
    bigfoot(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.4 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['charge', 'pound', 'boulders', 'roar', 'pound'] : ['charge', 'pound', 'boulders']); }
      const T = m.actT, col = elCol(B);
      switch (m.act) {
        case 'charge':
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 12, w: m.r * 2, life: 0.9, max: 0.9 }); X.say(m, 'ROOOAR!'); }
          if (T > 0.9 && m.step === 1) { const hit = X.moveEnt(m, Math.cos(m.sa) * 12 * A.dt, Math.sin(m.sa) * 12 * A.dt); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.5, m); m.atkCd = 0.8; } if (hit || T > 2.3) { m.step = 2; X.shake(10, 0.35); X.boom(m.x + Math.cos(m.sa) * m.r, m.y + Math.sin(m.sa) * m.r, 1.6, col, '#FFFFFF', { n: 16, smoke: 6 }); if (hit) { m.stunT = 1.4; m.act = 'stunned'; X.text(m.x, m.y - m.r - 0.6, 'STUNNED!', '#FFE37A', 18); } else done(m, 1); } }
          break;
        case 'stunned': if (m.stunT <= 0) done(m, 0.8); else m.stunT -= A.dt; break;
        case 'pound': if (m.step === 0) { m.step = 1; m.squash = 1; } if (T > 0.6 && m.step === 1) { m.step = 2; m.squash = 0; X.shake(12, 0.4); for (let i = 0; i < 2; i++) X.after(i * 0.5, () => X.ringWave(m.x, m.y, { speed: 5.5, gaps: 3, dmg: m.dmg, color: col, life: 1.4, w: 0.45, chill: B.el === 'frost' ? 1.5 : 0 })); X.sfx.crash(); } if (T > 1.9) done(m, 1.2); break;
        case 'boulders': if (m.step === 0) { m.step = 1; const n = m.phase >= 2 ? 4 : 3; for (let i = 0; i < n; i++) X.after(i * 0.3, () => { if (m.dead) return; X.lob(m.x, m.y - m.r, X.me.x + (i ? (Math.random() - 0.5) * 4 : 0), X.me.y + (i ? (Math.random() - 0.5) * 4 : 0), { dur: 1.0, r: 1.3, dmg: m.dmg * 1.1, kind: 'rock', src: m, color: B.el === 'frost' ? '#BFEFFF' : '#8C7B6B' }); }); X.say(m, 'Catch!'); } if (T > 1.8) done(m, 1.1); break;
        case 'roar': if (m.step === 0) { m.step = 1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 6, spread: 0.8, life: 0.7, max: 0.7, color: col }); const a = A.a; X.after(0.7, () => { if (m.dead) return; if (X.inCone(m.x, m.y, a, 6, 0.8)) { X.hurtPet(m.dmg * 0.8, m); X.push(a, 4); } X.ring(m.x, m.y, 0.5, 6, 0.5, col, 0.3); X.shake(8, 0.3); summon(m, X, B.el === 'frost' ? ['penguin', 'wolf'] : ['wolf', 'goat']); }); X.say(m, 'RAAAWR!'); } if (T > 1.3) done(m, 1.2); break;
        default: done(m, 1);
      }
    },
    fatcat(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.4 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['flop', 'yarn', 'pointer', 'kittens', 'hairball'] : ['flop', 'yarn', 'pointer']); }
      const T = m.actT, col = elCol(B);
      switch (m.act) {
        case 'flop': {
          if (m.step === 0) { m.step = 1; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; m.sx = m.x; m.sy = m.y; X.warn({ x: m.jx, y: m.jy, r: 2.8, life: 1.2, max: 1.2 }); X.say(m, 'Hup!'); }
          if (T < 0.3) { m.squash = T / 0.3; break; }
          const u = Math.min(1, (T - 0.3) / 0.9);
          m.x = m.sx + (m.jx - m.sx) * u; m.y = m.sy + (m.jy - m.sy) * u; m.z = Math.sin(u * PI) * 4.5; m.squash = 0;
          if (u >= 1 && m.step === 1) { m.step = 2; m.z = 0; X.unstick(m); X.slam(m.x, m.y, 2.8, m.dmg * 1.6, col, m); X.boom(m.x, m.y, 2.8, col, '#FFFFFF', { n: 26, shake: 13, smoke: 9 }); X.say(m, 'Oof.'); }
          if (T > 1.8) done(m, 1.3);
          break;
        }
        case 'yarn': if (T > m.step * 0.3 && m.step < (m.phase >= 2 ? 4 : 3)) { m.step++; const a = A.a + (m.step - 2) * 0.35; X.eshot(m.x, m.y - m.r * 0.5, a, 5.5, { dmg: m.dmg * 0.8, color: ['#FF9BD2', '#7FD3F2', '#FFE37A', '#B983F5'][m.step % 4], core: '#FFFFFF', r: 0.28, bounce: 3, life: 5, style: 'yarn' }); X.sfx.pop(); } if (T > 1.5) done(m, 1.1); break;
        case 'pointer': {
          if (m.step === 0) { m.step = 1; m.laser = { t: 0, st: 'aim', len: 10 }; m.la = A.a; X.say(m, 'Hehe.'); }
          const L = m.laser; if (!L) { done(m, 1); break; }
          if (T < 1.1) { m.la += Math.max(-1.6 * A.dt, Math.min(1.6 * A.dt, angTo(m.la, A.a))); L.st = 'aim'; }
          else if (T < 1.35) L.st = 'lock';
          else if (T < 2.4) { if (L.st !== 'fire') { L.st = 'fire'; X.sfx.crash(); X.shake(3, 0.15); L.hit = 0; } m.la += Math.max(-0.5 * A.dt, Math.min(0.5 * A.dt, angTo(m.la, A.a))); L.hit -= A.dt; if (L.hit <= 0 && X.inLine(m.x, m.y, m.la, L.len, 0.6)) { L.hit = 0.3; X.hurtPet(m.dmg * 0.9, m); } }
          else { m.laser = null; done(m, 1.1); break; }
          L.len = X.rayLen(m.x, m.y, m.la, 10);
          break;
        }
        case 'kittens': if (m.step === 0) { m.step = 1; summon(m, X, ['kitten', 'kitten']); X.say(m, 'Get them, kids.'); } if (T > 1) done(m, 1.4); break;
        case 'hairball': if (m.step === 0) { m.step = 1; X.warn({ x: m.x, y: m.y, r: 3.4, life: 1.0, max: 1.0, follow: m, color: col, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 3.4 + X.me.r) X.hurtPet(m.dmg * 1.2, m); X.boom(m.x, m.y, 3.4, col, '#FFFFFF', { n: 24, shake: 8 }); for (let i = 0; i < 12; i++) X.eshot(m.x, m.y, i / 12 * 6.283, 4, { dmg: m.dmg * 0.7, color: col }); } }); X.say(m, 'HRK-'); } if (T > 1.4) done(m, 1.2); break;
        default: done(m, 1);
      }
    },
    goblinking(m, A, X, B) {
      if (m.act === 'move') { keepRange(m, Object.assign({}, A, { sp: B.spd, steer: A.walk }), X, 3, 6); return pick(m, X, m.phase >= 2 ? ['bombs', 'rocket', 'gears', 'summon', 'bigbomb'] : ['bombs', 'rocket', 'gears', 'summon']); }
      const T = m.actT, col = elCol(B);
      switch (m.act) {
        case 'bombs': if (T > m.step * 0.22 && m.step < (m.phase >= 2 ? 6 : 4)) { m.step++; X.lob(m.x, m.y - m.r, X.me.x + (Math.random() - 0.5) * 5, X.me.y + (Math.random() - 0.5) * 5, { dur: 0.9, r: 1.2, dmg: m.dmg, kind: 'fire', fire: 1.5, src: m }); if (m.step === 1) X.say(m, 'Bombs away!'); } if (T > 1.9) done(m, 1.1); break;
        case 'rocket': {
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 11, w: m.r * 2.4, life: 0.7, max: 0.7, color: col }); X.say(m, 'WHEEE!'); }
          if (T > 0.7 && T < 1.5) { const hit = X.moveEnt(m, Math.cos(m.sa) * 13 * A.dt, Math.sin(m.sa) * 13 * A.dt); if (A.d < m.r + X.me.r + 0.2 && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.3, m); m.atkCd = 0.6; } m.trailT = (m.trailT || 0) - A.dt; if (m.trailT <= 0) { m.trailT = 0.12; X.zone({ kind: 'efire', x: m.x, y: m.y, r: 0.7, life: 2, max: 2, dps: m.dmg * 0.6, tick: 0, own: 'enemy' }); } for (let i = 0; i < 2; i++) X.part({ kind: 'ember', x: m.x - Math.cos(m.sa) * m.r, y: m.y, vx: -Math.cos(m.sa) * 3, vy: -1, life: 0.4, max: 0.4, size: 5, color: '#FF9F43' }); if (hit) m.actT = 1.5; }
          if (T > 1.8) done(m, 1.1);
          break;
        }
        case 'gears': if (m.step === 0) { m.step = 1; [-0.4, 0, 0.4].forEach((o, i) => X.after(i * 0.15, () => { if (!m.dead) X.eshot(m.x, m.y - m.r * 0.5, Math.atan2(X.me.y - m.y, X.me.x - m.x) + o, 7, { dmg: m.dmg * 0.9, style: 'gear', color: '#C9A24A', r: 0.26, life: 3, boomer: { out: 0.75, home: m }, keep: true }); })); X.sfx.whoosh(); } if (T > 2.2) done(m, 1.1); break;
        case 'summon': if (m.step === 0) { m.step = 1; summon(m, X, m.phase >= 2 ? ['goblin', 'goblin', 'gearbug'] : ['goblin', 'gearbug']); X.say(m, 'Lads!'); } if (T > 1) done(m, 1.4); break;
        case 'bigbomb': if (m.step === 0) { m.step = 1; const p = X.walkPoint(X.me.x, X.me.y, m); X.warn({ x: p.x, y: p.y, r: 3.4, life: 1.6, max: 1.6, color: '#FF7A3D', fn: () => { X.boom(p.x, p.y, 3.4, '#FF7A3D', '#FFE37A', { n: 40, shake: 14, smoke: 12 }); if (Math.hypot(X.me.x - p.x, X.me.y - p.y) < 3.4 + X.me.r) X.hurtPet(m.dmg * 1.6, m); X.zone({ kind: 'efire', x: p.x, y: p.y, r: 2, life: 3, max: 3, dps: m.dmg * 0.7, tick: 0, own: 'enemy' }); } }); X.eshot(m.x, m.y - m.r, 0, 0, { lob: { sx: m.x, sy: m.y - m.r, tx: p.x, ty: p.y, dur: 1.6, h: 4 }, r: 0.45, life: 1.6, dmg: 0, color: '#2B2433', core: '#FF7A3D', style: 'bomb' }); X.say(m, 'The BIG one!'); } if (T > 1.9) done(m, 1.3); break;
        default: done(m, 1);
      }
    },
    spider(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['webs', 'pounce', 'venom', 'spiderlings', 'silk'] : ['webs', 'pounce', 'venom']); }
      const T = m.actT, col = elCol(B);
      switch (m.act) {
        case 'webs': if (m.step === 0) { m.step = 1; for (let i = 0; i < 3; i++) { const x = X.me.x + (i ? (Math.random() - 0.5) * 4 : 0), y = X.me.y + (i ? (Math.random() - 0.5) * 4 : 0); X.warn({ x, y, r: 1.5, life: 0.7 + i * 0.1, max: 0.7 + i * 0.1, color: '#E8E8F8', fn: () => { X.zone({ kind: 'web', x, y, r: 1.5, life: 6, max: 6, own: 'enemy' }); X.sfx.twang(); } }); } X.say(m, 'Sssstick around.'); } if (T > 1.2) done(m, 1.1); break;
        case 'pounce': {
          if (m.step === 0) { m.step = 1; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; m.sx = m.x; m.sy = m.y; X.warn({ x: m.jx, y: m.jy, r: 2.4, life: 0.95, max: 0.95 }); }
          if (T < 0.25) { m.squash = T / 0.25; break; }
          const u = Math.min(1, (T - 0.25) / 0.7);
          m.x = m.sx + (m.jx - m.sx) * u; m.y = m.sy + (m.jy - m.sy) * u; m.z = Math.sin(u * PI) * 3; m.squash = 0;
          if (u >= 1 && m.step === 1) { m.step = 2; m.z = 0; X.unstick(m); X.slam(m.x, m.y, 2.4, m.dmg * 1.5, col, m); for (let i = 0; i < 8; i++) X.eshot(m.x, m.y, i / 8 * 6.283 + 0.3, 3.5, { dmg: m.dmg * 0.6, color: col, style: 'spore' }); }
          if (T > 1.4) done(m, 1.1);
          break;
        }
        case 'venom': if (T > m.step * 0.45 && m.step < 2) { m.step++; for (let i = -3; i <= 3; i++) X.eshot(m.x, m.y - m.r * 0.4, A.a + i * 0.2, 5.5, { dmg: m.dmg * 0.7, color: col, style: 'spore', chill: B.el === 'frost' ? 1 : 0 }); X.sfx.pop(); } if (T > 1.3) done(m, 1.1); break;
        case 'spiderlings': if (m.step === 0) { m.step = 1; summon(m, X, ['spiderling', 'spiderling', 'spiderling']); X.say(m, 'My babies!'); } if (T > 1) done(m, 1.4); break;
        case 'silk': if (m.step === 0) { m.step = 1; X.zone({ kind: 'sweep', own: 'enemy', src: m, x: m.x, y: m.y, a: A.a - 0.9, va: 1.2, len: 9, w: 1.1, life: 2.2, max: 2.2, warm: 0.8, dmg: m.dmg * 0.8, hitT: 0 }); X.say(m, 'Silk storm!'); } if (T > 2.4) done(m, 1.2); break;
        default: done(m, 1);
      }
    },
    snake(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.35)); return pick(m, X, m.phase >= 2 ? ['lunge', 'spit', 'coil', 'constrict', 'tail'] : ['lunge', 'spit', 'coil']); }
      const T = m.actT, col = elCol(B);
      switch (m.act) {
        case 'lunge': {
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 8, w: 1.3, life: 0.6, max: 0.6, color: col }); X.say(m, 'Hsss!'); }
          if (T > 0.6 && T < 1.1) { const hit = X.moveEnt(m, Math.cos(m.sa) * 15 * A.dt, Math.sin(m.sa) * 15 * A.dt); if (A.d < m.r + X.me.r + 0.2 && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.3, m); m.atkCd = 0.6; } X.part({ kind: 'afterM', x: m.x, y: m.y, vx: 0, vy: 0, life: 0.25, max: 0.25, size: m.r, color: col, m }); if (hit) m.actT = 1.1; }
          if (T > 1.5) done(m, m.phase >= 2 ? 0.7 : 1.0);
          break;
        }
        case 'spit': if (m.step === 0) { m.step = 1; for (let i = -2; i <= 2; i++) X.after(Math.abs(i) * 0.1, () => { if (!m.dead) X.lob(m.x, m.y - m.r * 0.6, X.me.x + i * 1.3, X.me.y + (Math.random() - 0.5) * 2, { dur: 0.9, r: 1.0, dmg: m.dmg * 0.9, kind: 'poison', poison: 2.5, src: m, color: col }); }); } if (T > 1.4) done(m, 1.1); break;
        case 'coil': if (m.step === 0) { m.step = 1; X.say(m, 'Coil!'); } if (T > 0.5 && m.step === 1) { m.step = 2; for (let i = 0; i < 2; i++) X.after(i * 0.55, () => X.ringWave(m.x, m.y, { speed: 5, gaps: 3, dmg: m.dmg, color: col, life: 1.5, w: 0.42 })); } if (T > 1.9) done(m, 1.1); break;
        case 'constrict': if (m.step === 0) { m.step = 1; const x = X.me.x, y = X.me.y; X.warn({ x, y, r: 2, life: 0.8, max: 0.8, color: col, fn: () => X.zone({ kind: 'evoid', x, y, r: 2, life: 4, max: 4, dps: m.dmg * 0.8, tick: 0, own: 'enemy', pull: 2 }) }); X.say(m, 'Squeeze!'); } if (T > 1.1) done(m, 1.1); break;
        case 'tail': if (m.step === 0) { m.step = 1; X.warn({ x: m.x, y: m.y, r: 3.2, life: 0.7, max: 0.7, follow: m, fn: () => { if (Math.hypot(X.me.x - m.x, X.me.y - m.y) < 3.2 + X.me.r) X.hurtPet(m.dmg * 1.3, m); X.ring(m.x, m.y, 0.5, 3.4, 0.35, col, 0.5); X.shake(8, 0.25); } }); } if (T > 1.1) done(m, 1); break;
        default: done(m, 1);
      }
    },
    skeleking(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['bones', 'summon', 'sweep', 'rain', 'wall'] : ['bones', 'summon', 'sweep']); }
      const T = m.actT, col = elCol(B);
      switch (m.act) {
        case 'bones': if (m.step === 0) { m.step = 1; [-0.4, 0, 0.4].forEach((o, i) => X.after(i * 0.15, () => { if (!m.dead) X.eshot(m.x, m.y - m.r * 0.4, Math.atan2(X.me.y - m.y, X.me.x - m.x) + o, 7, { dmg: m.dmg * 0.9, style: 'bone', color: '#EDE6D6', r: 0.26, life: 3, boomer: { out: 0.75, home: m }, keep: true }); })); X.say(m, 'Bone to pick!'); } if (T > 2.2) done(m, 1.1); break;
        case 'summon': if (m.step === 0) { m.step = 1; summon(m, X, m.phase >= 2 ? ['skull', 'skull', 'knight'] : ['skull', 'skull']); X.say(m, 'Rise!'); } if (T > 1) done(m, 1.4); break;
        case 'sweep': if (m.step === 0) { m.step = 1; X.zone({ kind: 'sweep', own: 'enemy', src: m, x: m.x, y: m.y, a: A.a - 0.8, va: 1.1, len: 8, w: 1.2, life: 2.2, max: 2.2, warm: 0.8, dmg: m.dmg * 0.9, hitT: 0 }); X.say(m, 'Kneel!'); } if (T > 2.4) done(m, 1.1); break;
        case 'rain': if (m.step === 0) { m.step = 1; const n = m.phase >= 2 ? 12 : 8; for (let i = 0; i < n; i++) X.after(i * 0.12, () => { const x = X.me.x + (Math.random() - 0.5) * 5, y = X.me.y + (Math.random() - 0.5) * 5; X.warn({ x, y, r: 0.9, life: 0.8, max: 0.8, color: col, fn: () => { X.boom(x, y, 0.9, '#EDE6D6', '#FFFFFF', { n: 8, shake: 2, smoke: 1 }); if (Math.hypot(X.me.x - x, X.me.y - y) < 0.9 + X.me.r) X.hurtPet(m.dmg * 0.9, m); } }); }); } if (T > 2) done(m, 1.0); break;
        case 'wall': if (m.step === 0) { m.step = 1; const a = A.a + PI / 2; for (let i = -3; i <= 3; i++) { const x = X.me.x + Math.cos(a) * i * 1.1, y = X.me.y + Math.sin(a) * i * 1.1; X.pillar(x, y, 0.8, m.dmg, 1.0); } X.say(m, 'Bone wall!'); } if (T > 1.3) done(m, 1.1); break;
        default: done(m, 1);
      }
    },
    /* ---- the titans ---- */
    octopus(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.25)); return pick(m, X, m.phase >= 2 ? ['tentacles', 'ink', 'spin', 'squirt', 'tentacles'] : ['tentacles', 'ink', 'spin']); }
      const T = m.actT, col = '#FF8FB1';
      switch (m.act) {
        case 'tentacles': {
          const n = m.phase >= 2 ? 6 : 4;
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.say(m, 'Grrlblb!'); for (let i = 0; i < n; i++) { const a = A.a + (i - (n - 1) / 2) * 0.42; X.after(i * 0.12, () => { if (m.dead) return; X.warn({ shape: 'line', x: m.x, y: m.y, a, len: 6.5, w: 1.1, life: 0.75, max: 0.75, color: col, fn: () => { if (X.inLine(m.x, m.y, a, 6.5, 1.1)) X.hurtPet(m.dmg * 1.2, m); X.shake(4, 0.12); X.sfx.crash(); for (let k = 1; k < 6; k++) X.part({ kind: 'smoke', x: m.x + Math.cos(a) * k, y: m.y + Math.sin(a) * k, vx: 0, vy: -1, life: 0.4, max: 0.4, size: 6, color: '#8E2F4A' }); } }); }); } }
          if (T > n * 0.12 + 1.3) done(m, 1.2);
          break;
        }
        case 'ink': if (m.step === 0) { m.step = 1; const k = m.phase >= 2 ? 4 : 3; for (let i = 0; i < k; i++) { const x = X.me.x + (i ? (Math.random() - 0.5) * 5 : 0), y = X.me.y + (i ? (Math.random() - 0.5) * 5 : 0); X.warn({ x, y, r: 1.7, life: 0.7, max: 0.7, color: '#3A1A40', fn: () => X.zone({ kind: 'poison', col: '#2A1636', x, y, r: 1.7, life: 4.5, max: 4.5, dps: m.dmg * 0.7, tick: 0, own: 'enemy' }) }); } X.say(m, 'Ink!'); X.sfx.hum(); } if (T > 1.1) done(m, 1.3); break;
        case 'spin': if (m.step === 0) { m.step = 1; for (let i = 0; i < 3; i++) X.after(i * 0.45, () => { if (!m.dead) X.ringWave(m.x, m.y, { speed: 4.8, gaps: 4, dmg: m.dmg, color: col, life: 1.5, w: 0.45 }); }); X.say(m, 'Whirl!'); } if (T > 1.9) done(m, 1.1); break;
        case 'squirt': if (T > m.step * 0.35 && m.step < 3) { m.step++; for (let i = -3; i <= 3; i++) X.eshot(m.x, m.y - m.r * 0.5, A.a + i * 0.18, 5.2, { dmg: m.dmg * 0.6, color: '#2A1636', core: '#B983F5' }); X.sfx.pop(); } if (T > 1.5) done(m, 1.1); break;
        default: done(m, 1);
      }
    },
    behemoth(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['charge', 'stomp', 'gore', 'meteor', 'charge'] : ['charge', 'stomp', 'gore']); }
      const T = m.actT, col = '#FF9F43';
      switch (m.act) {
        case 'charge':
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 13, w: m.r * 2.1, life: 1.0, max: 1.0, color: col }); X.say(m, 'HRRRAAAGH'); }
          if (T > 1.0 && m.step === 1) { const hit = X.moveEnt(m, Math.cos(m.sa) * 13 * A.dt, Math.sin(m.sa) * 13 * A.dt); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.6, m); m.atkCd = 0.8; } if (Math.random() < 0.8) X.part({ kind: 'smoke', x: m.x - Math.cos(m.sa) * m.r, y: m.y + 0.4, vx: 0, vy: -0.6, life: 0.5, max: 0.5, size: 8, color: '#9A8A7A' }); if (hit || T > 2.4) { m.step = 2; X.shake(12, 0.4); X.boom(m.x, m.y, 2.2, col, '#FFE37A', { n: 20, shake: 10, smoke: 8 }); m.stunT = hit ? 1.3 : 0.4; m.act = 'stunned'; } }
          break;
        case 'stunned': if (m.stunT <= 0) done(m, 0.8); else m.stunT -= A.dt; break;
        case 'stomp': if (m.step === 0) { m.step = 1; m.squash = 1; } if (T > 0.65 && m.step === 1) { m.step = 2; m.squash = 0; X.shake(14, 0.45); for (let i = 0; i < 3; i++) X.after(i * 0.4, () => { if (!m.dead) X.ringWave(m.x, m.y, { speed: 5.5, gaps: 3, dmg: m.dmg * 1.1, color: col, life: 1.6, w: 0.5 }); }); X.boom(m.x, m.y, 2.4, '#9A8A7A', '#FFE37A', { n: 26, shake: 10, smoke: 12 }); } if (T > 1.9) done(m, 1.2); break;
        case 'gore': if (m.step === 0) { m.step = 1; const a = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a, len: 5.5, spread: 0.7, life: 0.75, max: 0.75, color: col, fn: () => { if (X.inCone(m.x, m.y, a, 5.5, 0.7)) X.hurtPet(m.dmg * 1.5, m); X.shake(8, 0.25); X.sfx.crash(); } }); } if (T > 1.2) done(m, 1.0); break;
        case 'meteor': if (m.step === 0) { m.step = 1; const n = m.phase >= 3 ? 7 : 5; for (let i = 0; i < n; i++) X.after(i * 0.25, () => { if (m.dead) return; X.lob(m.x, m.y - m.r * 1.2, X.me.x + (i ? (Math.random() - 0.5) * 6 : 0), X.me.y + (i ? (Math.random() - 0.5) * 6 : 0), { dur: 1.1, r: 1.5, dmg: m.dmg * 1.1, kind: 'fire', src: m, color: col }); }); X.say(m, 'Meteor!'); } if (T > 2.4) done(m, 1.4); break;
        default: done(m, 1);
      }
    },
    kingape(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.4 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['leap', 'barrage', 'beat', 'rampage', 'leap'] : ['leap', 'barrage', 'beat']); }
      const T = m.actT, col = '#FFD447';
      switch (m.act) {
        case 'leap': {
          if (m.step === 0) { m.step = 1; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; m.sx = m.x; m.sy = m.y; X.warn({ x: m.jx, y: m.jy, r: 2.8, life: 1.2, max: 1.2, color: col }); X.say(m, 'HOO HOO!'); }
          if (T < 0.3) { m.squash = T / 0.3; break; }
          const u = Math.min(1, (T - 0.3) / 0.9);
          m.x = m.sx + (m.jx - m.sx) * u; m.y = m.sy + (m.jy - m.sy) * u; m.z = Math.sin(u * PI) * 5; m.squash = 0;
          if (u >= 1 && m.step === 1) { m.step = 2; m.z = 0; X.unstick(m); X.slam(m.x, m.y, 2.8, m.dmg * 1.7, col, m); X.boom(m.x, m.y, 2.8, '#9A8A7A', col, { n: 30, shake: 16, smoke: 12 }); X.ringWave(m.x, m.y, { speed: 6, gaps: 4, dmg: m.dmg * 0.9, color: col, life: 1.3, w: 0.45 }); }
          if (T > 1.8) done(m, 1.3);
          break;
        }
        case 'barrage': if (m.step === 0) { m.step = 1; const n = m.phase >= 2 ? 6 : 4; for (let i = 0; i < n; i++) X.after(i * 0.22, () => { if (m.dead) return; X.lob(m.x, m.y - m.r * 1.3, X.me.x + (i ? (Math.random() - 0.5) * 5 : 0), X.me.y + (i ? (Math.random() - 0.5) * 5 : 0), { dur: 0.95, r: 1.3, dmg: m.dmg * 1.0, kind: 'rock', src: m }); }); } if (T > 2.2) done(m, 1.2); break;
        case 'beat': if (m.step === 0) { m.step = 1; m.beat = 1.4; X.say(m, 'OOOH OOH AAH!'); X.sfx.hum(); for (let i = 0; i < 4; i++) X.after(i * 0.35, () => { if (m.dead) return; X.shake(6, 0.15); X.ringWave(m.x, m.y, { speed: 5, gaps: 5, dmg: m.dmg * 0.7, color: col, life: 1.3, w: 0.38 }); }); if (m.phase >= 2) X.after(0.6, () => { if (!m.dead) summon(m, X, ['wolf', 'goat', 'wolf']); }); } if (T > 1.9) { m.beat = 0; done(m, 1.2); } break;
        case 'rampage':
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 12, w: m.r * 2, life: 0.9, max: 0.9, color: col }); }
          if (T > 0.9 && m.step === 1) { const hit = X.moveEnt(m, Math.cos(m.sa) * 12 * A.dt, Math.sin(m.sa) * 12 * A.dt); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.5, m); m.atkCd = 0.8; } if (hit || T > 2.2) { m.step = 2; X.shake(10, 0.35); X.boom(m.x, m.y, 2, col, '#FFFFFF', { n: 16, shake: 8, smoke: 6 }); m.stunT = hit ? 1.1 : 0.3; m.act = 'stunned'; } }
          break;
        case 'stunned': if (m.stunT <= 0) done(m, 0.8); else m.stunT -= A.dt; break;
        default: done(m, 1);
      }
    },
    squid(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.25)); return pick(m, X, m.phase >= 2 ? ['lash', 'jet', 'ink', 'grab', 'lash'] : ['lash', 'jet', 'ink']); }
      const T = m.actT, col = '#BFEFFF';
      switch (m.act) {
        case 'lash': if (m.step === 0) { m.step = 1; X.zone({ kind: 'sweep', own: 'enemy', src: m, x: m.x, y: m.y, a: A.a - 0.9, va: 1.1, len: 9, w: 1.2, life: 2.4, max: 2.4, warm: 0.8, dmg: m.dmg * 0.9, hitT: 0 }); X.say(m, 'Thwip!'); } if (T > 2.6) done(m, 1.1); break;
        case 'jet': {
          if (m.step === 0) { m.step = 1; m.sa = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 11, w: m.r * 1.6, life: 0.8, max: 0.8, color: col }); }
          if (T > 0.8 && T < 1.8) { X.moveEnt(m, Math.cos(m.sa) * 11 * A.dt, Math.sin(m.sa) * 11 * A.dt); if (A.d < m.r + X.me.r && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.2, m); if (X.chillPet) X.chillPet(1); m.atkCd = 0.6; } if (Math.random() < 0.8) X.part({ kind: 'smoke', x: m.x - Math.cos(m.sa) * m.r, y: m.y, vx: -Math.cos(m.sa) * 2, vy: -Math.sin(m.sa) * 2, life: 0.5, max: 0.5, size: 7, color: '#9FD8F0' }); }
          if (T > 2.1) done(m, 1.1);
          break;
        }
        case 'ink': if (m.step === 0) { m.step = 1; for (let i = 0; i < (m.phase >= 2 ? 4 : 3); i++) { const x = X.me.x + (i ? (Math.random() - 0.5) * 5 : 0), y = X.me.y + (i ? (Math.random() - 0.5) * 5 : 0); X.warn({ x, y, r: 1.6, life: 0.7, max: 0.7, color: '#1A2A40', fn: () => X.zone({ kind: 'poison', col: '#1A2236', x, y, r: 1.6, life: 4, max: 4, dps: m.dmg * 0.7, tick: 0, own: 'enemy' }) }); } } if (T > 1.1) done(m, 1.2); break;
        case 'grab': if (m.step === 0) { m.step = 1; const x = X.me.x, y = X.me.y; X.warn({ x, y, r: 2.1, life: 0.8, max: 0.8, color: col, fn: () => X.zone({ kind: 'evoid', x, y, r: 2.1, life: 3.5, max: 3.5, dps: m.dmg * 0.8, tick: 0, own: 'enemy', pull: 2.2 }) }); X.say(m, 'Mine!'); } if (T > 1.1) done(m, 1.3); break;
        default: done(m, 1);
      }
    },
    demonlion(m, A, X, B) {
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.4 ? 1 : 0.3)); return pick(m, X, m.phase >= 2 ? ['pounce', 'flames', 'roar', 'dive', 'pounce'] : ['pounce', 'flames', 'roar']); }
      const T = m.actT, col = '#FF7A3D';
      switch (m.act) {
        case 'pounce': {
          if (m.step === 0) { m.step = 1; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; m.sx = m.x; m.sy = m.y; X.warn({ x: m.jx, y: m.jy, r: 2.4, life: 0.9, max: 0.9, color: col }); X.say(m, 'GRAAAWR'); }
          if (T < 0.22) { m.squash = T / 0.22; break; }
          const u = Math.min(1, (T - 0.22) / 0.65);
          m.x = m.sx + (m.jx - m.sx) * u; m.y = m.sy + (m.jy - m.sy) * u; m.z = Math.sin(u * PI) * 3.2; m.squash = 0;
          if (u >= 1 && m.step === 1) { m.step = 2; m.z = 0; X.unstick(m); X.slam(m.x, m.y, 2.4, m.dmg * 1.5, col, m); X.boom(m.x, m.y, 2.4, col, '#FFE37A', { n: 22, shake: 10, smoke: 6 }); for (let i = 0; i < 6; i++) X.eshot(m.x, m.y, i / 6 * 6.283 + 0.2, 4, { dmg: m.dmg * 0.6, color: col, core: '#FFE37A' }); }
          if (T > 1.4) done(m, 1.0);
          break;
        }
        case 'flames': if (T > m.step * 0.4 && m.step < (m.phase >= 2 ? 3 : 2)) { m.step++; for (let i = -2; i <= 2; i++) X.eshot(m.x, m.y - m.r * 0.5, A.a + i * 0.24, 5.5, { dmg: m.dmg * 0.7, color: col, core: '#FFE37A', style: 'ember' }); X.sfx.pop(); } if (T > 1.5) done(m, 1.1); break;
        case 'roar': if (m.step === 0) { m.step = 1; const a = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a, len: 6.5, spread: 0.85, life: 0.7, max: 0.7, color: col, fn: () => { if (X.inCone(m.x, m.y, a, 6.5, 0.85)) X.hurtPet(m.dmg * 1.2, m); X.shake(9, 0.3); X.sfx.hum(); for (let k = 0; k < 10; k++) X.part({ kind: 'ember', x: m.x + Math.cos(a) * m.r, y: m.y + Math.sin(a) * m.r, vx: Math.cos(a + (Math.random() - 0.5) * 0.9) * 8, vy: Math.sin(a + (Math.random() - 0.5) * 0.9) * 8, life: 0.6, max: 0.6, size: 7, color: col, drag: 0.6 }); } }); X.say(m, 'ROOOOAR'); } if (T > 1.2) done(m, 1.0); break;
        case 'dive': {
          if (m.step === 0) { m.step = 1; m.z = 0; X.say(m, 'From the sky!'); }
          if (T < 0.5) m.z = T * 16;
          else if (m.step === 1) { m.step = 2; const p = X.walkPoint(X.me.x, X.me.y, m); m.jx = p.x; m.jy = p.y; X.warn({ x: m.jx, y: m.jy, r: 2.6, life: 1, max: 1, color: col }); }
          if (m.step === 2 && T > 1.5) { m.step = 3; m.x = m.jx; m.y = m.jy; m.z = 0; X.unstick(m); X.slam(m.x, m.y, 2.6, m.dmg * 1.6, col, m); X.boom(m.x, m.y, 2.6, col, '#FFE37A', { n: 30, shake: 14, smoke: 10 }); X.ringWave(m.x, m.y, { speed: 5.5, gaps: 4, dmg: m.dmg * 0.8, color: col, life: 1.3, w: 0.45 }); }
          if (T > 2.1) done(m, 1.2);
          break;
        }
        default: done(m, 1);
      }
    },
  };
  /* where a flying boss hovers: around the arena it woke in (or wherever it appeared) */
  function home(X, m) { if (!m.home) m.home = { x: m.x, y: m.y + 1 }; return m.home; }
  function pick(m, X, list) {
    if (m.cd > 0) return;
    m.actT = 0; m.step = 0;
    let a = list[Math.floor(Math.random() * list.length)];
    if (a === m.lastAct && list.length > 1) a = list[Math.floor(Math.random() * list.length)];
    m.lastAct = a; m.act = a;
  }
  function glowPulse(m, X, T, col) { if (Math.random() < 0.5) X.part({ kind: 'star', x: m.x + (Math.random() - 0.5) * 3, y: m.y - 1 - Math.random() * 2, vx: 0, vy: -2, life: 0.5, max: 0.5, size: 4, color: col || '#BFEFFF' }); X.light(m.x, m.y, 4 + T, 0.3); }
  function done(m, cd) { m.act = 'move'; m.cd = cd * (m.phase >= 3 ? 0.65 : 1); m.z = 0; }
  function summon(m, X, types) {
    if (X.mons.filter(o => !o.dead).length > 80) return;
    types.forEach((t, i) => {
      const aa = i / types.length * 6.283, c = X.spawnMon(t, m.x + Math.cos(aa) * (m.r + 0.9), m.y + Math.sin(aa) * (m.r + 0.9), { aggro: true });
      if (X.blocked(c.x, c.y, c.r, c.mv)) { c.x = m.x; c.y = m.y + m.r + 0.6; X.unstick(c); }
      c.xp *= 0.5; X.g.total++; X.ring(c.x, c.y, 0.1, 1, 0.3, '#B39CFF');
    });
    X.sfx.hum();
  }
  function spiral(m, A, X, col) {
    const T = m.actT; m.emit = (m.emit || 0) - A.dt;
    if (m.emit <= 0 && T < 2.8) { m.emit = 0.09; const arms = m.phase >= 2 ? 3 : 2; for (let i = 0; i < arms; i++) X.eshot(m.x, m.y, T * 2.6 + i / arms * 6.283, 3.6, { dmg: m.dmg * 0.6, color: col, r: 0.15 }); }
    if (T > 3.2) done(m, 1.2);
  }
  return { mon, boss, affix, angTo, SK, kit, keepRange, chaseHit, startHop, hopTick };
})();
