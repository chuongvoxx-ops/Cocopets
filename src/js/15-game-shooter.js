/* ---------- Star Blaster: a space battle where every pet fights with its own ability ---------- */
const SHOOTER_WAVES = [
  [[0, 'line', 'puff', 5], [5, 'vee', 'puff', 5], [10, 'snakeL', 'puff', 6], [15.5, 'snakeR', 'puff', 6], [21, 'line', 'puff', 7], [27, 'vee', 'puff', 7]],
  [[0, 'line', 'puff', 6], [4, 'rain', 'comet', 6], [10, 'wing', 'fighter', 3], [15, 'rain', 'comet', 8], [20, 'pair', 'jelly', 2], [26, 'vee', 'puff', 7], [31, 'wing', 'fighter', 4]],
  [[0, 'pair', 'jelly', 2], [5, 'wing', 'fighter', 4], [9.5, 'line', 'jelly', 3], [15, 'solo', 'spinner', 1], [20, 'rain', 'comet', 10], [26, 'wing', 'fighter', 5], [30, 'snakeL', 'puff', 8], [34, 'solo', 'spinner', 1]],
  [[0, 'line', 'puff', 6], [5, 'wing', 'fighter', 4], [11, 'boss', 'boss', 1]],
];
const SHOT_RATE = { twin: 0.17, volley: 0.22, spread: 0.26, lance: 0.22, seeker: 0.24, wave: 0.2, burst: 0.12, chain: 0.26, orbit: 0.24, bouncer: 0.3, boomerang: 0.42, shard: 0.26 };
GAMES.shooter = {
  create(api) {
    const S = api.def, waves = SHOOTER_WAVES[S.waves] || SHOOTER_WAVES[0];
    const AB = Object.assign(applyAbOv(petAbility(api.form, st && st.dna ? st.dna.seed : api.form.seed), st), GAMES.shooter.override || {});
    const pal = api.form.pal;
    const g = { s: 1, VW: 360, VH: 640, t: 0, wi: 0, x: 180, y: 520, hearts: 3, inv: 0, score: 0, fireT: 0, over: 0, guard: 0, en: [], bl: [], eb: [], it: [], stars: [], zaps: [], meteors: [], won: false, dead: false, boss: null, kills: 0, spawnQ: [],
      charge: 35, shieldT: 0, cloneT: 0, warpT: 0, beamT: 0, novaT: 0, flash: 0, orbHit: new Map(), introT: 2.4, readyPing: false };
    const layout = () => { g.s = api.W / g.VW; g.VH = api.H / g.s; g.y = Math.min(g.y, g.VH - 70); };
    layout();
    g.y = g.VH - 100;
    for (let i = 0; i < 80; i++) g.stars.push({ x: Math.random() * g.VW, y: Math.random() * g.VH, z: 0.3 + Math.random() * 1.2 });
    const HP = { puff: 1, comet: 2, jelly: 3, spinner: 6, fighter: 3, boss: 160 };
    const PTS = { puff: 10, comet: 20, jelly: 35, spinner: 60, fighter: 40, boss: 600 };
    const RAD = { puff: 15, comet: 13, jelly: 17, spinner: 19, fighter: 16, boss: 52 };
    const hud = () => api.hud({ score: g.score, hearts: g.hearts, max: 3, goal: g.boss ? `Gloom Moon ${Math.max(0, Math.ceil(g.boss.hp / HP.boss * 100))}%` : `Wave ${Math.min(g.wi + (g.wi < waves.length ? 1 : 0), waves.length)} of ${waves.length} · ${AB.name}`, prog: g.boss ? 1 - g.boss.hp / HP.boss : g.wi / waves.length });
    hud();
    const btn = () => ({ x: g.VW - 46, y: g.VH - 48, r: 30 });
    function enemy(type, x, y, o) { const e = Object.assign({ type, x, y, hp: HP[type], r: RAD[type], t: 0, vx: 0, vy: 0, shootT: 1 + Math.random() * 1.5, ph: Math.random() * 6.28, mode: 'down' }, o || {}); g.en.push(e); return e; }
    function spawnWave(w) {
      const [, pat, type, n] = w, VW = g.VW;
      if (pat === 'line') for (let i = 0; i < n; i++) enemy(type, 40 + i * (VW - 80) / Math.max(1, n - 1), -30 - (i % 2) * 24, { vy: 55, sway: 26 });
      else if (pat === 'vee') for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; enemy(type, VW / 2 + k * 44, -30 - Math.abs(k) * 34, { vy: 62, sway: 0 }); }
      else if (pat === 'snakeL' || pat === 'snakeR') for (let i = 0; i < n; i++) g.spawnQ.push({ at: g.t + i * 0.45, f: () => enemy(type, pat === 'snakeL' ? -20 : VW + 20, 60, { mode: 'snake', dir: pat === 'snakeL' ? 1 : -1, vy: 34 }) });
      else if (pat === 'rain') for (let i = 0; i < n; i++) g.spawnQ.push({ at: g.t + i * (S.waves >= 2 ? 0.5 : 0.65), f: () => { const x = 30 + Math.random() * (VW - 60); enemy(type, x, -24, { mode: 'comet', vx: (Math.random() - 0.5) * 90, vy: 210 + Math.random() * 60 }); } });
      else if (pat === 'pair') [0.28, 0.72].forEach(f => enemy(type, VW * f, -30, { mode: 'hover', ty: g.VH * 0.2 + Math.random() * 40, vy: 90 }));
      else if (pat === 'solo') enemy(type, VW / 2, -30, { mode: 'hover', ty: g.VH * 0.18, vy: 80 });
      else if (pat === 'wing') for (let i = 0; i < n; i++) g.spawnQ.push({ at: g.t + i * 0.6, f: () => enemy(type, 50 + (i % 2 ? VW - 100 : 0) + (Math.random() - 0.5) * 40, -30, { mode: 'fighter', ty: g.VH * (0.14 + 0.1 * (i % 3)), vy: 200, life: 9 + i * 0.5 }) });
      else if (pat === 'boss') { g.boss = enemy('boss', VW / 2, -70, { mode: 'boss', ty: Math.min(150, g.VH * 0.24), vy: 60, phase: 1 }); api.sfx.hum(); api.pop(VW / 2 * g.s, 80, 'The Gloom Moon!', '#FFD447', 22); }
    }
    function shootAt(e, sp, spread, kind) {
      const a = Math.atan2(g.y - 20 - e.y, g.x - e.x);
      (spread || [0]).forEach(d => g.eb.push({ x: e.x, y: e.y + e.r * 0.5, vx: Math.cos(a + d) * sp, vy: Math.sin(a + d) * sp, r: 5, kind: kind || 'orb' }));
    }
    function ring(e, n, sp, off) { for (let i = 0; i < n; i++) { const a = off + i / n * 6.283; g.eb.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 5, kind: 'orb' }); } }
    function hurt() {
      if (g.inv > 0 || g.dead || g.won || g.shieldT > 0) return;
      if (g.guard > 0) { g.guard = 0; g.inv = 1; api.sfx.pop(); api.burst(g.x * g.s, (g.y - 20) * g.s, '#7FD3F2', 12); return; }
      g.hearts--; g.inv = 1.6; api.shake(8); api.burst(g.x * g.s, (g.y - 20) * g.s, '#FF8FB1', 14); api.sfx.squeak(); buzz(40); api.miss(); hud();
      if (g.hearts <= 0) { g.dead = true; setTimeout(() => api.lose('Your ship was knocked out!', g.score), 1000); }
    }
    function kill(e) {
      if (e.dead) return;
      e.dead = true; g.kills++; g.score += api.hit(e.x * g.s, e.y * g.s, PTS[e.type]); if (e.type === 'boss') api.hitstop(0.5); hud();
      api.burst(e.x * g.s, e.y * g.s, e.type === 'boss' ? '#FFD447' : AB.color, e.type === 'boss' ? 40 : 10, e.type === 'boss' ? 260 : 150);
      api.sfx.pop();
      g.it.push({ kind: 'dust', x: e.x, y: e.y, vy: 60 });
      const r = Math.random();
      if (e.type !== 'boss') { if (r < 0.07) g.it.push({ kind: 'over', x: e.x, y: e.y, vy: 70 }); else if (r < 0.12) g.it.push({ kind: 'guard', x: e.x, y: e.y, vy: 70 }); else if (r < 0.145 && g.hearts < 3) g.it.push({ kind: 'heart', x: e.x, y: e.y, vy: 70 }); }
      if (e.type === 'boss') { g.won = true; api.shake(12, 0.6); api.sfx.fanfare(); setTimeout(() => api.win(g.hearts, g.score + g.hearts * 100), 1300); }
    }
    function damage(e, d, noCharge) {
      if (e.dead) return;
      e.hp -= d; e.flash = 0.08;
      if (!noCharge) g.charge = Math.min(100, g.charge + d * 2.6);
      if (e.hp <= 0) kill(e); else if (e.type === 'boss') hud();
    }
    const alive = () => g.en.filter(e => !e.dead && e.y > -20);
    function nearest(x, y, skip, maxD) {
      let best = null, bd = maxD || Infinity;
      for (const e of g.en) { if (e.dead || e === skip || e.y < -10) continue; const d = hyp(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } }
      return best;
    }
    /* the pet's own ability fires from (ox, oy) */
    function P(x, y, vx, vy, o) { const b = Object.assign({ x, y, vx, vy, r: 4, dmg: 1, t: 0 }, o); if (b.pierce) b.hitSet = new Set(); g.bl.push(b); return b; }
    function fire(ox, oy) {
      const pw = AB.power, sp = 560 * AB.speed, sz = AB.size, n = AB.count;
      switch (AB.shot) {
        case 'twin': [-7, 7].forEach(dx => P(ox + dx, oy, 0, -sp, { r: 4 * sz, dmg: pw })); break;
        case 'volley': [-13, 0, 13].forEach(dx => P(ox + dx, oy, 0, -sp, { r: 4 * sz, dmg: pw * 0.8 })); break;
        case 'spread': for (let i = 0; i < n; i++) { const a = (i - (n - 1) / 2) * 0.17; P(ox, oy, Math.sin(a) * sp, -Math.cos(a) * sp, { r: 4.2 * sz, dmg: pw * 0.85 }); } break;
        case 'lance': for (let i = 0; i < n; i++) P(ox + (n > 1 ? (i - 0.5) * 14 : 0), oy, 0, -sp * 1.45, { r: 3.5, len: 24, dmg: pw * 1.5, pierce: true }); break;
        case 'seeker': for (let i = 0; i < n; i++) P(ox + (n > 1 ? (i ? 10 : -10) : 0), oy, (n > 1 ? (i ? 1 : -1) : (Math.random() < 0.5 ? -1 : 1)) * 110, -sp * 0.7, { r: 6 * sz, dmg: pw * 1.1, home: true }); break;
        case 'wave': [1, -1].forEach(d => P(ox, oy, 0, -sp * 0.85, { r: 4.5 * sz, dmg: pw * 0.95, wave: d, x0: ox })); break;
        case 'burst': for (let i = 0; i < n; i++) { const a = (Math.random() - 0.5) * 0.95; P(ox, oy, Math.sin(a) * sp * 0.95, -Math.cos(a) * sp * 0.95, { r: 3.6 * sz, dmg: pw * 0.55, life: 0.32 }); } break;
        case 'chain': P(ox, oy, 0, -sp * 1.1, { r: 4.5, dmg: pw * 1.3, chain: n }); break;
        case 'orbit': P(ox, oy, 0, -sp, { r: 4.5 * sz, dmg: pw }); break;
        case 'bouncer': [-1, 1].forEach(d => P(ox, oy, d * 170, -sp * 0.75, { r: 6 * sz, dmg: pw * 1.1, bounce: 3 })); break;
        case 'boomerang': for (let i = 0; i < n; i++) P(ox, oy, (n > 1 ? (i ? 70 : -70) : 0), -sp * 0.95, { r: 8 * sz, dmg: pw * 1.4, boom: true, hits: new Map() }); break;
        default: P(ox, oy, 0, -sp, { r: 5.5 * sz, dmg: pw * 1.3, split: true });
      }
      if (Math.random() < 0.3) api.sfx.blip();
    }
    function special() {
      if (g.charge < 100 || g.dead || g.won || g.introT > 0) return;
      g.charge = 0; g.flash = 0.35; api.sfx.sparkle(); api.shake(6, 0.3);
      api.pop(g.VW / 2 * g.s, g.VH * 0.42 * g.s, AB.specialName + '!', AB.color, 22);
      switch (AB.special) {
        case 'nova': g.novaT = 0.7; g.eb = []; for (const e of alive()) damage(e, e.type === 'boss' ? 20 * AB.power : 14 * AB.power, true); break;
        case 'shield': g.shieldT = 6; break;
        case 'meteor': for (let i = 0; i < 16; i++) g.meteors.push({ x: 20 + Math.random() * (g.VW - 40), y: -40 - Math.random() * 520, vy: 520 + Math.random() * 220, r: 11 + Math.random() * 8 }); break;
        case 'clone': g.cloneT = 8; break;
        case 'warp': g.warpT = 6; break;
        case 'beam': g.beamT = 3; break;
        default: for (let i = 0; i < 18; i++) { const a = i / 18 * 6.283; P(g.x, g.y - 20, Math.cos(a) * 260, Math.sin(a) * 260, { r: 5, dmg: 1.4 * AB.power, home: true, star: true, life: 3.2, nc: true }); }
      }
    }
    let drag = null;
    return {
      resize() { layout(); },
      start() { g.introT = 2.4; },
      down(x, y) {
        const vx = x / g.s, vy = y / g.s, b = btn();
        if (hyp(vx - b.x, vy - b.y) < b.r + 8) { special(); return; }
        drag = { px: vx, py: vy, sx: g.x, sy: g.y };
      },
      move(x, y) { if (!drag) return; g.x = clamp(drag.sx + x / g.s - drag.px, 26, g.VW - 26); g.y = clamp(drag.sy + y / g.s - drag.py, g.VH * 0.35, g.VH - 34); },
      up() { drag = null; },
      key(k, on) { if (on && (k === 'tap' || k === 'jump')) special(); },
      _dbg: { g, AB },
      update(dt) {
        g.t += dt; g.inv = Math.max(0, g.inv - dt); g.over = Math.max(0, g.over - dt); g.introT = Math.max(0, g.introT - dt);
        g.shieldT = Math.max(0, g.shieldT - dt); g.cloneT = Math.max(0, g.cloneT - dt); g.warpT = Math.max(0, g.warpT - dt); g.beamT = Math.max(0, g.beamT - dt); g.novaT = Math.max(0, g.novaT - dt); g.flash = Math.max(0, g.flash - dt);
        const edt = g.warpT > 0 ? dt * 0.35 : dt;   // enemies and their shots, slowed by Time Warp
        const k = api.keys, kv = 300 * dt;
        if (k.left) g.x = Math.max(26, g.x - kv); if (k.right) g.x = Math.min(g.VW - 26, g.x + kv);
        if (k.up) g.y = Math.max(g.VH * 0.35, g.y - kv); if (k.down) g.y = Math.min(g.VH - 34, g.y + kv);
        for (const s2 of g.stars) { s2.y += 40 * s2.z * (g.warpT > 0 ? 0.3 : 1) * dt; if (s2.y > g.VH) { s2.y = 0; s2.x = Math.random() * g.VW; } }
        while (g.wi < waves.length && g.t >= waves[g.wi][0]) { spawnWave(waves[g.wi]); g.wi++; hud(); }
        g.spawnQ = g.spawnQ.filter(q => { if (g.t >= q.at) { q.f(); return false; } return true; });
        if (g.charge >= 100 && !g.readyPing) { g.readyPing = true; api.sfx.chirp(); }
        if (g.charge < 100) g.readyPing = false;
        // firing
        if (!g.dead && !g.won) {
          g.fireT -= dt;
          if (g.fireT <= 0) {
            g.fireT = (SHOT_RATE[AB.shot] || 0.2) * AB.rate * (g.over > 0 ? 0.62 : 1);
            fire(g.x, g.y - 46);
            if (g.cloneT > 0) fire(g.VW - g.x, g.y - 46);
          }
        }
        // the ship's shots
        for (const b of g.bl) {
          b.t += dt;
          if (b.home) {
            const e = nearest(b.x, b.y);
            if (e) {
              const sp = hyp(b.vx, b.vy) || 1, ca = Math.atan2(b.vy, b.vx);
              let da = Math.atan2(e.y - b.y, e.x - b.x) - ca;
              while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
              const na = ca + clamp(da, -6 * dt, 6 * dt), sp2 = Math.min(560, sp + 300 * dt);
              b.vx = Math.cos(na) * sp2; b.vy = Math.sin(na) * sp2;
            }
          }
          if (b.wave) { b.y += b.vy * dt; b.x = b.x0 + Math.sin(b.t * 9) * 24 * b.wave; }
          else if (b.boom) {
            b.vy += 1150 * dt;
            if (b.vy > 0) { const dx = g.x - b.x, dy = (g.y - 30) - b.y, d = hyp(dx, dy) || 1; b.vx += (dx / d * 620 - b.vx) * Math.min(1, dt * 5); b.vy = Math.max(b.vy, dy / d * 520); if (d < 26) b.gone = true; }
            b.x += b.vx * dt; b.y += b.vy * dt;
            if (b.t > 2.4) b.gone = true;
          } else { b.x += b.vx * dt; b.y += b.vy * dt; }
          if (b.bounce != null && (b.x < 8 || b.x > g.VW - 8)) { if (b.bounce > 0) { b.vx = -b.vx; b.bounce--; b.x = clamp(b.x, 8, g.VW - 8); } }
          if (b.life != null) { b.life -= dt; if (b.life <= 0) b.gone = true; }
        }
        // special: beam and meteors
        if (g.beamT > 0) {
          for (const e of alive()) if (Math.abs(e.x - g.x) < 24 + e.r && e.y < g.y) damage(e, 9 * AB.power * dt, true);
          g.eb = g.eb.filter(b => !(Math.abs(b.x - g.x) < 26 && b.y < g.y));
        }
        for (const m of g.meteors) {
          m.y += m.vy * dt;
          if (m.y < 0) continue;
          for (const e of alive()) if (hyp(e.x - m.x, e.y - m.y) < e.r + m.r) { damage(e, 5 * AB.power, true); m.gone = true; api.burst(m.x * g.s, m.y * g.s, '#FF9F43', 12, 160); break; }
          if (m.y > g.VH + 30) m.gone = true;
        }
        g.meteors = g.meteors.filter(m => !m.gone);
        // orbit orbs
        if (AB.shot === 'orbit' && !g.dead) {
          for (let i = 0; i < AB.count; i++) {
            const a = g.t * 3.2 + i * 6.283 / AB.count, ox = g.x + Math.cos(a) * 40, oy = g.y - 20 + Math.sin(a) * 40;
            for (const e of alive()) { if (hyp(e.x - ox, e.y - oy) < e.r + 10) { const last = g.orbHit.get(e) || -9; if (g.t - last > 0.3) { g.orbHit.set(e, g.t); damage(e, 0.9 * AB.power); } } }
            g.eb = g.eb.filter(b => hyp(b.x - ox, b.y - oy) > 12);
          }
        }
        // enemies
        for (const e of g.en) {
          e.t += edt;
          if (e.mode === 'down') { e.y += e.vy * edt; e.x += Math.sin(e.t * 2 + e.ph) * (e.sway || 0) * edt; }
          else if (e.mode === 'snake') { e.x += e.dir * 120 * edt; e.y += e.vy * edt + Math.sin(e.t * 3) * 40 * edt; if (e.x < -40 || e.x > g.VW + 40) { e.dir *= -1; e.y += 40; } }
          else if (e.mode === 'comet') { e.x += e.vx * edt; e.y += e.vy * edt; }
          else if (e.mode === 'fighter') {
            if (e.t < e.life) {
              if (e.y < e.ty) e.y += e.vy * edt; else { e.x += Math.cos(e.t * 1.3 + e.ph) * 110 * edt; e.x = clamp(e.x, 24, g.VW - 24); }
              e.shootT -= edt;
              if (e.shootT <= 0 && e.y >= e.ty - 4) { e.shootT = S.waves >= 2 ? 1.3 : 1.7; [-7, 7].forEach(dx => g.eb.push({ x: e.x + dx, y: e.y + 12, vx: 0, vy: 260, r: 4, kind: 'laser' })); }
            } else e.y += 240 * edt;
          } else if (e.mode === 'hover') {
            if (e.y < e.ty) e.y += e.vy * edt; else { e.x += Math.sin(e.t * 0.9 + e.ph) * 70 * edt; e.x = clamp(e.x, 30, g.VW - 30); }
            e.shootT -= edt;
            if (e.shootT <= 0 && e.y >= e.ty - 4) {
              if (e.type === 'jelly') { e.shootT = 2.1; shootAt(e, 170, S.waves >= 2 ? [-0.25, 0, 0.25] : [0]); }
              else { e.shootT = 2.6; ring(e, 8, 140, e.t); }
            }
          } else if (e.mode === 'boss') {
            if (e.y < e.ty) e.y += e.vy * edt;
            else {
              e.x = g.VW / 2 + Math.sin(e.t * 0.6) * (g.VW / 2 - 70);
              e.phase = e.hp > HP.boss * 0.66 ? 1 : e.hp > HP.boss * 0.33 ? 2 : 3;
              e.shootT -= edt;
              if (e.shootT <= 0) {
                if (e.phase === 1) { e.shootT = 1.5; shootAt(e, 180, [-0.3, 0, 0.3]); }
                else if (e.phase === 2) { e.shootT = 1.25; ring(e, 12, 130, e.t * 1.7); }
                else { e.shootT = 1.1; shootAt(e, 210, [-0.4, -0.2, 0, 0.2, 0.4]); if (Math.random() < 0.5) enemy('fighter', e.x + (Math.random() - 0.5) * 80, e.y + 40, { mode: 'fighter', ty: e.y + 60, vy: 160, life: 6 }); }
              }
            }
          }
          if (e.type === 'puff' && e.mode === 'down' && Math.random() < edt * (S.waves >= 1 ? 0.12 : 0.05) && e.y > 40 && e.y < g.VH * 0.6) shootAt(e, 150);
          // hits from the ship's shots
          for (const b of g.bl) {
            if (b.gone || e.dead) continue;
            const rr = e.r + b.r;
            const hitIt = b.len ? (Math.abs(b.x - e.x) < rr && b.y - b.len < e.y + e.r && b.y > e.y - e.r) : hyp(b.x - e.x, b.y - e.y) < rr;
            if (!hitIt) continue;
            if (b.hitSet) { if (b.hitSet.has(e)) continue; b.hitSet.add(e); }
            if (b.hits) { const last = b.hits.get(e) || -9; if (b.t - last < 0.25) continue; b.hits.set(e, b.t); }
            damage(e, b.dmg, b.nc);
            if (!b.pierce && !b.boom) b.gone = true;
            if (b.split) [-0.5, 0, 0.5].forEach(a => P(b.x, e.y - e.r - 4, Math.sin(a) * 380, -Math.cos(a) * 380, { r: 3.4, dmg: b.dmg * 0.45, shardBit: true, life: 0.6, pierce: true }).hitSet.add(e));
            if (b.chain) {
              let from = e, jumps = b.chain;
              const done = new Set([e]);
              while (jumps-- > 0) {
                let e2 = null, bd = 150;
                for (const q of g.en) { if (q.dead || done.has(q) || q.y < -10) continue; const d = hyp(q.x - from.x, q.y - from.y); if (d < bd) { bd = d; e2 = q; } }
                if (!e2) break;
                done.add(e2);
                g.zaps.push({ x1: from.x, y1: from.y, x2: e2.x, y2: e2.y, t: 0.18 });
                damage(e2, b.dmg * 0.7);
                from = e2;
              }
            }
          }
          if (!e.dead && hyp(e.x - g.x, e.y - (g.y - 18)) < e.r + 16) { if (e.type !== 'boss') kill(e); hurt(); }
          if (!e.dead && g.cloneT > 0 && e.type !== 'boss' && hyp(e.x - (g.VW - g.x), e.y - (g.y - 18)) < e.r + 14) kill(e);
          e.flash = Math.max(0, (e.flash || 0) - dt);
        }
        g.bl = g.bl.filter(b => !b.gone && b.y > -40 && b.y < g.VH + 40 && b.x > -40 && b.x < g.VW + 40);
        g.en = g.en.filter(e => !e.dead && e.y < g.VH + 60 && e.x > -80 && e.x < g.VW + 80);
        for (const b of g.eb) { b.x += b.vx * edt; b.y += b.vy * edt; if (hyp(b.x - g.x, b.y - (g.y - 18)) < b.r + 14) { b.hit = true; hurt(); } }
        g.eb = g.eb.filter(b => !b.hit && b.y < g.VH + 20 && b.y > -30 && b.x > -30 && b.x < g.VW + 30);
        g.zaps = g.zaps.filter(z => (z.t -= dt) > 0);
        for (const it of g.it) {
          it.y += it.vy * dt;
          const d = hyp(it.x - g.x, it.y - (g.y - 20));
          if (it.kind === 'dust' && d < 70) { it.x += (g.x - it.x) * dt * 6; it.y += (g.y - 20 - it.y) * dt * 6; }
          if (d < 26) {
            it.got = true;
            if (it.kind === 'dust') { g.score += api.hit(g.x * g.s, (g.y - 40) * g.s, 5); g.charge = Math.min(100, g.charge + 2); api.sfx.coin(); }
            else if (it.kind === 'over') { g.over = 8; api.pop(g.x * g.s, (g.y - 60) * g.s, 'Overdrive!', '#FFE37A'); api.sfx.sparkle(); }
            else if (it.kind === 'guard') { g.guard = 1; api.pop(g.x * g.s, (g.y - 60) * g.s, 'Shield!', '#7FD3F2'); api.sfx.sparkle(); }
            else { g.hearts = Math.min(3, g.hearts + 1); api.pop(g.x * g.s, (g.y - 60) * g.s, '+1 heart', '#FF8FB1'); api.sfx.yum(); }
            hud();
          }
        }
        g.it = g.it.filter(it => !it.got && it.y < g.VH + 20);
        if (!g.won && !g.dead && g.wi >= waves.length && !g.spawnQ.length && !g.en.length && !g.boss) { g.won = true; api.pop(g.VW / 2 * g.s, g.VH / 2 * g.s, 'Sky cleared!', '#FFE37A', 24); setTimeout(() => api.win(g.hearts, g.score + g.hearts * 50), 900); }
      },
      draw(c) {
        const VW = g.VW, VH = g.VH;
        c.save(); c.scale(g.s, g.s);
        const sky = c.createLinearGradient(0, 0, 0, VH); sky.addColorStop(0, '#0D0A24'); sky.addColorStop(1, '#2A1F5E');
        c.fillStyle = sky; c.fillRect(0, 0, VW, VH);
        // nebula veils drifting at different depths, and a shaded planet with a day side and a night side
        if (!g.neb) { const R = mulberry32(42); g.neb = Array.from({ length: 7 }, () => ({ x: R() * VW, y: R() * VH, r: 60 + R() * 110, h: 230 + R() * 90, sp: 4 + R() * 9, a: 0.07 + R() * 0.08 })); }
        for (const n of g.neb) {
          const y = ((n.y + g.t * n.sp) % (VH + n.r * 2)) - n.r;
          const ng = c.createRadialGradient(n.x, y, 0, n.x, y, n.r); ng.addColorStop(0, `hsla(${n.h} 80% 70% / ${n.a * 1.6})`); ng.addColorStop(1, `hsla(${n.h} 80% 60% / 0)`);
          c.fillStyle = ng; c.fillRect(n.x - n.r, y - n.r, n.r * 2, n.r * 2);
        }
        { const py = VH * 0.3 + (g.t * 6 % (VH + 200)) - 100, px2 = VW * 0.8, pr = 90;
          const pg = c.createRadialGradient(px2 - pr * 0.45, py - pr * 0.4, pr * 0.1, px2, py, pr); pg.addColorStop(0, 'rgba(201,178,255,.5)'); pg.addColorStop(0.6, 'rgba(120,80,200,.32)'); pg.addColorStop(1, 'rgba(40,20,90,.45)');
          c.fillStyle = pg; c.beginPath(); c.arc(px2, py, pr, 0, 6.283); c.fill();
          c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 6; c.beginPath(); c.ellipse(px2, py, pr * 1.55, pr * 0.34, -0.35, 0, 6.283); c.stroke();
          c.fillStyle = 'rgba(255,255,255,.08)'; c.beginPath(); c.ellipse(px2 - pr * 0.2, py + pr * 0.1, pr * 0.5, pr * 0.16, 0.3, 0, 6.283); c.fill(); }
        for (const s2 of g.stars) { c.fillStyle = `rgba(255,255,255,${0.35 + s2.z * 0.4})`; c.fillRect(s2.x, s2.y, s2.z * 1.6, s2.z * (g.warpT > 0 ? 1.6 : 1.6 + s2.z * 2)); }
        for (const it of g.it) {
          if (it.kind === 'dust') GFX.star(c, it.x, it.y, 6, '#FFE37A', 1.5);
          else if (it.kind === 'over') { GFX.blob(c, it.x, it.y, 11, '#FFD447'); GFX.star(c, it.x, it.y, 6, '#FFFFFF', 0); }
          else if (it.kind === 'guard') GFX.blob(c, it.x, it.y, 11, '#7FD3F2');
          else GFX.heart(c, it.x, it.y, 9);
        }
        for (const e of g.en) drawEnemy(c, e);
        for (const b of g.eb) {
          if (b.kind === 'laser') { c.fillStyle = 'rgba(255,92,138,.45)'; GFX.rr(c, b.x - 3.5, b.y - 9, 7, 18, 3.5); c.fill(); c.fillStyle = '#FF5C8A'; GFX.rr(c, b.x - 1.6, b.y - 7, 3.2, 14, 1.6); c.fill(); }
          else { c.beginPath(); c.arc(b.x, b.y, b.r + 2, 0, 6.283); c.fillStyle = 'rgba(255,123,172,.35)'; c.fill(); c.beginPath(); c.arc(b.x, b.y, b.r - 1, 0, 6.283); c.fillStyle = '#FF7BAC'; c.fill(); }
        }
        drawShots(c);
        for (const z of g.zaps) {
          c.strokeStyle = AB.core; c.lineWidth = 4; c.globalAlpha = Math.min(1, z.t / 0.12);
          c.beginPath(); c.moveTo(z.x1, z.y1);
          for (let i = 1; i < 5; i++) { const u = i / 5; c.lineTo(lerp(z.x1, z.x2, u) + (Math.random() - 0.5) * 16, lerp(z.y1, z.y2, u) + (Math.random() - 0.5) * 16); }
          c.lineTo(z.x2, z.y2); c.stroke();
          c.strokeStyle = AB.color; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1;
        }
        for (const m of g.meteors) {
          if (m.y < -20) continue;
          c.fillStyle = 'rgba(255,159,67,.55)'; c.beginPath(); c.moveTo(m.x - m.r * 0.7, m.y - 4); c.lineTo(m.x, m.y - m.r * 4); c.lineTo(m.x + m.r * 0.7, m.y - 4); c.fill();
          GFX.blob(c, m.x, m.y, m.r, '#B7836B', 2.2);
          c.fillStyle = '#8C6450'; c.beginPath(); c.arc(m.x - m.r * 0.3, m.y - m.r * 0.2, m.r * 0.25, 0, 6.283); c.fill();
        }
        if (g.beamT > 0) {
          const w = 30 + Math.sin(g.t * 40) * 3;
          const gr = c.createLinearGradient(g.x - w, 0, g.x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.3, AB.color); gr.addColorStop(0.5, '#FFFFFF'); gr.addColorStop(0.7, AB.color); gr.addColorStop(1, 'rgba(255,255,255,0)');
          c.globalAlpha = Math.min(1, g.beamT * 2); c.fillStyle = gr; c.fillRect(g.x - w, 0, w * 2, g.y - 40); c.globalAlpha = 1;
        }
        // the ship (and its mirror twin)
        if (g.cloneT > 0) drawShip(c, VW - g.x, g.y, 0.55);
        if (!(g.inv > 0 && Math.floor(g.t * 12) % 2 === 0) && !(g.dead && g.t % 0.2 < 0.1)) drawShip(c, g.x, g.y, 1);
        if (AB.shot === 'orbit' && !g.dead) for (let i = 0; i < AB.count; i++) { const a = g.t * 3.2 + i * 6.283 / AB.count; orb(c, g.x + Math.cos(a) * 40, g.y - 20 + Math.sin(a) * 40, 8.5); }
        if (g.shieldT > 0 || g.guard > 0) { c.beginPath(); c.arc(g.x, g.y - 20, 36, 0, 6.283); c.fillStyle = 'rgba(127,211,242,.16)'; c.fill(); c.strokeStyle = g.shieldT > 0 && g.shieldT < 1.5 && Math.floor(g.t * 10) % 2 ? 'rgba(127,211,242,.35)' : 'rgba(127,211,242,.95)'; c.lineWidth = 3; c.stroke(); }
        if (g.novaT > 0) { const k = 1 - g.novaT / 0.7; c.beginPath(); c.arc(g.x, g.y - 20, 40 + k * VH, 0, 6.283); c.strokeStyle = AB.color; c.lineWidth = 18 * (1 - k) + 2; c.globalAlpha = 1 - k; c.stroke(); c.globalAlpha = 1; }
        if (g.warpT > 0) { c.fillStyle = `rgba(120,90,220,${0.12 + 0.04 * Math.sin(g.t * 6)})`; c.fillRect(0, 0, VW, VH); }
        if (g.flash > 0) { c.fillStyle = `rgba(255,255,255,${g.flash})`; c.fillRect(0, 0, VW, VH); }
        // special button
        const b = btn(), ready = g.charge >= 100;
        c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fillStyle = ready ? AB.color : 'rgba(20,16,41,.7)'; c.fill();
        c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.25)'; c.stroke();
        c.beginPath(); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + 6.283 * g.charge / 100); c.strokeStyle = ready ? '#FFFFFF' : AB.color; c.lineWidth = 5; c.stroke();
        GFX.star(c, b.x, b.y - 3, ready ? 12 + Math.sin(g.t * 8) * 1.5 : 10, ready ? '#FFFFFF' : 'rgba(255,255,255,.5)', ready ? 2 : 0);
        c.font = `800 9px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText(ready ? 'TAP' : Math.floor(g.charge) + '%', b.x, b.y + 15);
        c.restore();
        if (g.introT > 0) {
          c.globalAlpha = Math.min(1, g.introT / 0.6);
          GFX.text(c, AB.name, api.W / 2, api.H * 0.3, 24, AB.color);
          GFX.text(c, `Special: ${AB.specialName} · fill the star button`, api.W / 2, api.H * 0.3 + 30, 13, '#FFFFFF');
          c.globalAlpha = 1;
        }
      },
    };
    function orb(c, x, y, r) {
      c.fillStyle = AB.color; c.globalAlpha = 0.35; c.beginPath(); c.arc(x, y, r + 5, 0, 6.283); c.fill(); c.globalAlpha = 1;
      GFX.blob(c, x, y, r, AB.color, 2); c.fillStyle = AB.core; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 6.283); c.fill();
    }
    function shotColor(b) { return AB.rainbow ? `hsl(${(b.t * 400 + b.x) % 360},90%,65%)` : AB.color; }
    function drawShots(c) {
      for (const b of g.bl) {
        const col = shotColor(b);
        if (b.star) { GFX.star(c, b.x, b.y, 6, col, 1.4); continue; }
        if (b.len) { c.fillStyle = col; c.globalAlpha = 0.4; GFX.rr(c, b.x - 4.5, b.y - b.len - 4, 9, b.len + 8, 4.5); c.fill(); c.globalAlpha = 1; c.fillStyle = AB.core; GFX.rr(c, b.x - 2, b.y - b.len, 4, b.len, 2); c.fill(); continue; }
        if (b.boom) { c.save(); c.translate(b.x, b.y); c.rotate(b.t * 18); c.fillStyle = col; c.strokeStyle = GFX.line; c.lineWidth = 2; c.beginPath(); c.moveTo(-b.r, 0); c.quadraticCurveTo(0, -b.r * 0.9, b.r, 0); c.quadraticCurveTo(0, -b.r * 0.3, -b.r, 0); c.fill(); c.stroke(); c.beginPath(); c.moveTo(0, -b.r); c.quadraticCurveTo(b.r * 0.9, 0, 0, b.r); c.quadraticCurveTo(b.r * 0.3, 0, 0, -b.r); c.fill(); c.stroke(); c.restore(); continue; }
        if (b.bounce != null) { c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fillStyle = 'rgba(255,255,255,.18)'; c.fill(); c.strokeStyle = col; c.lineWidth = 2.2; c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, 6.283); c.fill(); continue; }
        if (b.split || b.shardBit) { c.save(); c.translate(b.x, b.y); c.rotate(Math.atan2(b.vy, b.vx) + Math.PI / 2); c.fillStyle = col; c.strokeStyle = GFX.line; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, -b.r * 1.6); c.lineTo(b.r, b.r); c.lineTo(-b.r, b.r); c.closePath(); c.fill(); c.stroke(); c.restore(); continue; }
        if (b.chain) { c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.moveTo(b.x, b.y + 10); c.lineTo(b.x - 4, b.y + 4); c.lineTo(b.x + 3, b.y); c.lineTo(b.x - 2, b.y - 8); c.stroke(); c.fillStyle = AB.core; c.beginPath(); c.arc(b.x - 2, b.y - 8, 2.6, 0, 6.283); c.fill(); continue; }
        if (b.home) { orb(c, b.x, b.y, b.r); continue; }
        if (b.life != null) { c.globalAlpha = clamp(b.life / 0.32, 0, 1); c.fillStyle = col; c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.fill(); c.fillStyle = AB.core; c.beginPath(); c.arc(b.x, b.y, b.r * 0.45, 0, 6.283); c.fill(); c.globalAlpha = 1; continue; }
        if (b.wave) { c.save(); c.translate(b.x, b.y); c.rotate(Math.PI / 4); c.fillStyle = col; c.strokeStyle = GFX.line; c.lineWidth = 1.4; c.fillRect(-b.r * 0.8, -b.r * 0.8, b.r * 1.6, b.r * 1.6); c.strokeRect(-b.r * 0.8, -b.r * 0.8, b.r * 1.6, b.r * 1.6); c.restore(); continue; }
        c.fillStyle = col; GFX.rr(c, b.x - b.r, b.y - b.r * 2, b.r * 2, b.r * 4, b.r); c.fill();
        c.fillStyle = AB.core; GFX.rr(c, b.x - b.r * 0.45, b.y - b.r * 1.5, b.r * 0.9, b.r * 3, b.r * 0.45); c.fill();
      }
    }
    function drawShip(c, x, y, alpha) {
      c.save(); c.globalAlpha = alpha;
      const fl = 10 + Math.sin(g.t * 30) * 3;
      c.fillStyle = AB.color; c.beginPath(); c.moveTo(x - 8, y + 2); c.lineTo(x, y + 12 + fl); c.lineTo(x + 8, y + 2); c.fill();
      c.fillStyle = AB.core; c.beginPath(); c.moveTo(x - 4, y + 2); c.lineTo(x, y + 6 + fl); c.lineTo(x + 4, y + 2); c.fill();
      c.lineWidth = 2.4; c.strokeStyle = GFX.line; c.lineJoin = 'round';
      [-1, 1].forEach(sd => {
        c.fillStyle = pal.dk;
        c.beginPath(); c.moveTo(x + sd * 9, y - 18); c.lineTo(x + sd * 34, y + 4); c.lineTo(x + sd * 31, y + 11); c.lineTo(x + sd * 9, y + 2); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = AB.color; c.beginPath(); c.arc(x + sd * 30, y + 6, 3.2, 0, 6.283); c.fill();
      });
      c.fillStyle = pal.base;
      c.beginPath(); c.moveTo(x, y - 50); c.quadraticCurveTo(x + 19, y - 34, x + 15, y + 3); c.quadraticCurveTo(x, y + 9, x - 15, y + 3); c.quadraticCurveTo(x - 19, y - 34, x, y - 50); c.closePath(); c.fill(); c.stroke();
      c.strokeStyle = AB.color; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 11, y - 4); c.quadraticCurveTo(x, y + 1, x + 11, y - 4); c.stroke();
      c.strokeStyle = GFX.line; c.lineWidth = 2.4;
      api.pet(c, x, y - 13, 20, { face: g.dead || g.inv > 0 ? 'hurt' : g.charge >= 100 ? 'happy' : 'normal' });
      c.beginPath(); c.arc(x, y - 27, 16, 0, 6.283); c.fillStyle = 'rgba(200,236,255,.22)'; c.fill(); c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2.2; c.stroke();
      c.beginPath(); c.arc(x - 5, y - 34, 5, 3.4, 4.6); c.strokeStyle = '#FFFFFF'; c.lineWidth = 2.6; c.stroke();
      c.restore();
    }
    function drawEnemy(c, e) {
      c.save();
      if (e.flash > 0) c.globalAlpha = 0.6;
      if (e.type === 'puff') GFX.gloomy(c, e.x, e.y, e.r, { color: '#7A63B8', lookY: 1 });
      else if (e.type === 'fighter') {
        c.lineWidth = 2.2; c.strokeStyle = GFX.line; c.lineJoin = 'round';
        c.fillStyle = '#4A3B7A';
        c.beginPath(); c.moveTo(e.x, e.y + 18); c.lineTo(e.x - 20, e.y - 8); c.lineTo(e.x - 8, e.y - 4); c.lineTo(e.x, e.y - 14); c.lineTo(e.x + 8, e.y - 4); c.lineTo(e.x + 20, e.y - 8); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = '#FF5C8A'; c.beginPath(); c.arc(e.x - 13, e.y - 4, 2.4, 0, 6.283); c.arc(e.x + 13, e.y - 4, 2.4, 0, 6.283); c.fill();
        GFX.gloomy(c, e.x, e.y - 2, 8, { color: '#8C78BF', lookY: 1 });
      } else if (e.type === 'comet') {
        const a = Math.atan2(e.vy, e.vx);
        c.save(); c.translate(e.x, e.y); c.rotate(a);
        c.fillStyle = 'rgba(255,159,67,.7)'; c.beginPath(); c.moveTo(-6, -9); c.lineTo(-42, 0); c.lineTo(-6, 9); c.fill();
        c.fillStyle = 'rgba(255,227,122,.9)'; c.beginPath(); c.moveTo(-6, -5); c.lineTo(-26, 0); c.lineTo(-6, 5); c.fill();
        c.restore();
        GFX.blob(c, e.x, e.y, e.r, '#8C7B6B'); c.fillStyle = '#6B5B4E'; c.beginPath(); c.arc(e.x - 4, e.y - 3, 3.5, 0, 6.283); c.arc(e.x + 5, e.y + 4, 2.5, 0, 6.283); c.fill();
      } else if (e.type === 'jelly') {
        const w = Math.sin(e.t * 5) * 3;
        c.strokeStyle = GFX.line; c.lineWidth = 3; c.lineCap = 'round';
        for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(e.x + i * 6, e.y + 6); c.quadraticCurveTo(e.x + i * 6 + w, e.y + 18, e.x + i * 6 - w, e.y + 28); c.stroke(); }
        c.beginPath(); c.moveTo(e.x - e.r, e.y + 6); c.quadraticCurveTo(e.x - e.r, e.y - e.r * 1.1, e.x, e.y - e.r * 1.1); c.quadraticCurveTo(e.x + e.r, e.y - e.r * 1.1, e.x + e.r, e.y + 6); c.closePath();
        c.fillStyle = '#C77BD9'; c.fill(); c.stroke();
        c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(e.x - 6, e.y - 4, 3.5, 0, 6.283); c.arc(e.x + 6, e.y - 4, 3.5, 0, 6.283); c.fill();
        c.fillStyle = GFX.line; c.beginPath(); c.arc(e.x - 6, e.y - 3, 1.7, 0, 6.283); c.arc(e.x + 6, e.y - 3, 1.7, 0, 6.283); c.fill();
      } else if (e.type === 'spinner') {
        c.save(); c.translate(e.x, e.y); c.rotate(e.t * 2);
        c.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, r = i % 2 ? e.r * 0.62 : e.r * 1.15; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath();
        c.fillStyle = '#4A3B7A'; c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 2.5; c.stroke();
        c.restore();
        GFX.blob(c, e.x, e.y, 7, '#FFE37A', 2); c.fillStyle = GFX.line; c.beginPath(); c.arc(e.x, e.y, 3, 0, 6.283); c.fill();
      } else {
        // the Gloom Moon
        const r = e.r;
        c.fillStyle = 'rgba(155,107,255,.25)'; c.beginPath(); c.arc(e.x, e.y, r + 14 + Math.sin(e.t * 3) * 4, 0, 6.283); c.fill();
        GFX.blob(c, e.x, e.y, r, e.flash > 0 ? '#FFFFFF' : '#B7AFC9', 3.5);
        c.fillStyle = '#9C93B3'; [[-20, -22, 9], [22, -10, 7], [-10, 22, 6], [26, 22, 5]].forEach(([dx, dy, rr]) => { c.beginPath(); c.arc(e.x + dx, e.y + dy, rr, 0, 6.283); c.fill(); });
        c.strokeStyle = GFX.line; c.lineWidth = 4; c.lineCap = 'round';
        c.beginPath(); c.moveTo(e.x - 26, e.y - 16); c.lineTo(e.x - 8, e.y - 8); c.moveTo(e.x + 26, e.y - 16); c.lineTo(e.x + 8, e.y - 8); c.stroke();
        c.fillStyle = GFX.line; c.beginPath(); c.arc(e.x - 15, e.y - 2, 5, 0, 6.283); c.arc(e.x + 15, e.y - 2, 5, 0, 6.283); c.fill();
        c.beginPath(); c.moveTo(e.x - 16, e.y + 22); c.quadraticCurveTo(e.x, e.y + 12, e.x + 16, e.y + 22); c.stroke();
        c.beginPath(); c.moveTo(e.x - 22, e.y - r + 6); c.lineTo(e.x - 26, e.y - r - 18); c.lineTo(e.x - 10, e.y - r - 6); c.lineTo(e.x, e.y - r - 24); c.lineTo(e.x + 10, e.y - r - 6); c.lineTo(e.x + 26, e.y - r - 18); c.lineTo(e.x + 22, e.y - r + 6); c.closePath();
        c.fillStyle = '#FFD447'; c.fill(); c.lineWidth = 2.5; c.stroke();
      }
      c.restore();
    }
  },
};
