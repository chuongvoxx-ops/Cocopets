/* ---------- Puff Flight: tap to flap through the cloud gates ---------- */
GAMES.flappy = {
  create(api) {
    const S = api.def;
    const g = { s: 1, VW: 360, VH: 640, x: 96, y: 300, vy: 0, r: 15, hearts: 4, inv: 0, passed: 0, gems: 0, gates: [], hz: [], spawned: 0, t: 0, done: 0, dead: 0, flap: 0, gx: 0, far: [], windT: 5, windWarn: 0, windOn: 0, windDir: 1, score: 0 };
    const CW = 66;
    const layout = () => { g.s = api.W / g.VW; g.VH = api.H / g.s; g.ground = g.VH - 44; };
    layout();
    g.y = g.VH * 0.42;
    for (let i = 0; i < 8; i++) g.far.push({ x: Math.random() * 420, y: 30 + Math.random() * g.VH * 0.62, k: 0.45 + Math.random() * 0.7, sp: 0.12 + Math.random() * 0.22 });
    const range = () => [Math.max(64 + S.gap / 2, g.VH * 0.16 + S.gap / 2), g.ground - S.gap / 2 - 18];
    function spawn() {
      const [lo, hi] = range();
      const last = g.gates[g.gates.length - 1];
      const prev = last ? last.base : (lo + hi) / 2;
      const moving = g.spawned > 1 && Math.random() < S.move;
      const amp = moving ? Math.min(44, (hi - lo) / 2) : 0;
      let base = clamp(prev + (Math.random() * 2 - 1) * 150, lo + amp, hi - amp);
      const x = last ? last.x + S.spacing : g.VW + 70;
      g.gates.push({ x, base, amp, ph: Math.random() * 6.28, cy: base, passed: false, gem: Math.random() < 0.6 ? { got: false, c: ARC_GEMS[g.spawned % 6] } : null });
      g.spawned++;
      if (S.hazards && g.spawned < S.goal && Math.random() < S.hazards) g.hz.push({ x: x + S.spacing / 2, base: lo - 20 + Math.random() * (hi - lo + 40), ph: Math.random() * 6.28, y: 0, r: 14 });
    }
    spawn(); spawn();
    const hud = () => api.hud({ score: g.score, hearts: g.hearts, max: 4, goal: `${g.passed} / ${S.goal} gates`, prog: g.passed / S.goal });
    hud();
    function flap() {
      if (g.dead || g.done) return;
      g.vy = -385; g.flap = 0.22; api.sfx.boop();
    }
    function hit() {
      if (g.inv > 0 || g.dead || g.done) return;
      g.hearts--; g.inv = 1.6; api.shake(7); api.burst(g.x * g.s, g.y * g.s, '#FFFFFF', 12); api.sfx.squeak(); buzz(30); api.miss();
      hud();
      if (g.hearts <= 0) { g.dead = 1; api.sfx.wrong(); setTimeout(() => api.lose('Out of hearts!', g.score), 900); }
    }
    const circRect = (cx, cy, r, x0, y0, x1, y1) => { const nx = clamp(cx, x0, x1), ny = clamp(cy, y0, y1); return hyp(cx - nx, cy - ny) < r; };
    return {
      resize() { const fy = g.y / g.VH; layout(); g.y = fy * g.VH; },
      start() { flap(); },
      down() { flap(); },
      key(k, on) { if (on && (k === 'tap' || k === 'jump' || k === 'up')) flap(); },
      update(dt) {
        g.t += dt; g.flap = Math.max(0, g.flap - dt); g.inv = Math.max(0, g.inv - dt);
        const sp = g.done ? S.speed * 0.6 : S.speed;
        if (S.wind && !g.done) {
          if (g.windOn > 0) { g.windOn -= dt; g.vy += g.windDir * 440 * dt; if (g.windOn <= 0) g.windT = 4 + Math.random() * 3; }
          else if (g.windWarn > 0) { g.windWarn -= dt; if (g.windWarn <= 0) g.windOn = 1.3; }
          else { g.windT -= dt; if (g.windT <= 0) { g.windWarn = 1; g.windDir = Math.random() < 0.5 ? -1 : 1; } }
        }
        if (!g.dead) {
          g.vy = Math.min(g.vy + 1260 * dt, 540);
          g.y += g.vy * dt;
        } else { g.vy += 900 * dt; g.y = Math.min(g.ground - 6, g.y + g.vy * dt); }
        if (g.y < g.r + 4) { g.y = g.r + 4; g.vy = Math.max(0, g.vy); }
        if (g.y > g.ground - g.r && !g.dead) { g.y = g.ground - g.r; g.vy = -400; hit(); }
        g.gx = (g.gx + sp * dt) % 80; g.dist = (g.dist || 0) + sp * dt;
        g.far.forEach(f => { f.x -= sp * f.sp * dt; if (f.x < -80) { f.x = g.VW + 60; f.y = 30 + Math.random() * g.VH * 0.6; } });
        for (const q of g.gates) {
          q.x -= sp * dt; q.cy = q.base + Math.sin(g.t * 1.5 + q.ph) * q.amp;
          const top = q.cy - S.gap / 2, bot = q.cy + S.gap / 2;
          if (!g.dead && g.inv <= 0 && Math.abs(q.x - g.x) < CW / 2 + g.r) {
            if (circRect(g.x, g.y, g.r - 2, q.x - CW / 2, -999, q.x + CW / 2, top) || circRect(g.x, g.y, g.r - 2, q.x - CW / 2, bot, q.x + CW / 2, g.ground)) hit();
          }
          if (q.gem && !q.gem.got && hyp(q.x - g.x, q.cy - g.y) < g.r + 12) { q.gem.got = true; g.gems++; const gp = api.hit(q.x * g.s, (q.cy - 16) * g.s, 25, true); g.score += gp; api.pop(q.x * g.s, (q.cy - 16) * g.s, '+' + gp, q.gem.c); api.burst(q.x * g.s, q.cy * g.s, q.gem.c, 8); api.sfx.sparkle(); }
          if (!q.passed && q.x + CW / 2 < g.x - g.r) {
            q.passed = true; g.passed++; g.score += api.hit(g.x * g.s, (g.y - 30) * g.s, 10); api.sfx.chirp(); hud();
            if (g.passed >= S.goal && !g.done) { g.done = 1; api.pop(g.x * g.s, (g.y - 34) * g.s, 'Made it!', '#FFE37A', 22); setTimeout(() => api.win(Math.min(3, g.hearts), g.score + g.hearts * 30), 900); }
          }
        }
        for (const h of g.hz) {
          h.x -= sp * dt; h.y = h.base + Math.sin(g.t * 2.2 + h.ph) * 34;
          if (!g.dead && hyp(h.x - g.x, h.y - g.y) < g.r + h.r - 3) hit();
        }
        g.gates = g.gates.filter(q => q.x > -90); g.hz = g.hz.filter(h => h.x > -40);
        if (g.spawned < S.goal && g.gates.length && g.gates[g.gates.length - 1].x < g.VW + 140) spawn();
        hud();
      },
      draw(c) {
        const s = g.s, VW = g.VW, VH = g.VH;
        c.save(); c.scale(s, s);
        const sky = c.createLinearGradient(0, 0, 0, VH);
        sky.addColorStop(0, '#7FC8F5'); sky.addColorStop(1, '#E6F6FF');
        c.fillStyle = sky; c.fillRect(0, 0, VW, VH);
        { const sg = c.createRadialGradient(VW - 60, 70, 20, VW - 60, 70, 110); sg.addColorStop(0, 'rgba(255,243,176,.75)'); sg.addColorStop(1, 'rgba(255,243,176,0)'); c.fillStyle = sg; c.fillRect(VW - 180, -40, 240, 240); }
        c.fillStyle = '#FFF3B0'; c.beginPath(); c.arc(VW - 60, 70, 30, 0, 6.283); c.fill();
        c.fillStyle = 'rgba(255,255,255,.75)';
        for (const f of g.far) { puff(c, f.x, f.y, 22 * f.k, false); }
        // floating islands in the distance: two parallax rows, the far one washed out by the air between
        for (let layer = 0; layer < 2; layer++) {
          const sp = layer ? 0.32 : 0.14, step = layer ? 230 : 310, dist = g.dist || 0, base = Math.floor(dist * sp / step), hy = g.ground - (layer ? 60 : 120);
          const col = layer ? '#9FD8B4' : '#BFE3EE', top = layer ? '#C6EDCF' : '#D8EEF5';
          for (let i = -1; i < VW / step + 2; i++) {
            const k = base + i, x = k * step - dist * sp, r = ((k * 9301 + 49297) % 233280) / 233280, w = 110 + r * 90, h = (layer ? 36 : 54) + r * 30;
            const hg = c.createLinearGradient(0, hy - h, 0, hy + 20); hg.addColorStop(0, top); hg.addColorStop(1, col);
            c.fillStyle = hg; c.beginPath(); c.moveTo(x, hy + 20); c.quadraticCurveTo(x + w * 0.2, hy - h, x + w * 0.5, hy - h * 0.9); c.quadraticCurveTo(x + w * 0.8, hy - h * 0.8, x + w, hy + 20); c.closePath(); c.fill();
            c.fillStyle = 'rgba(43,36,51,.07)'; c.beginPath(); c.moveTo(x + w * 0.5, hy - h * 0.9); c.quadraticCurveTo(x + w * 0.8, hy - h * 0.8, x + w, hy + 20); c.lineTo(x + w * 0.5, hy + 20); c.closePath(); c.fill();
          }
        }
        for (const q of g.gates) {
          const top = q.cy - S.gap / 2, bot = q.cy + S.gap / 2;
          pillar(c, q.x, -10, top, true); pillar(c, q.x, bot, g.ground + 10, false);
          if (q.gem && !q.gem.got) GFX.gem(c, q.x, q.cy + Math.sin(g.t * 4 + q.ph) * 3, 9, q.gem.c);
        }
        for (const h of g.hz) spike(c, h.x, h.y, h.r, g.t);
        // ground clouds
        c.fillStyle = '#FFFFFF';
        for (let x = -g.gx - 40; x < VW + 80; x += 80) puff(c, x, g.ground + 22, 34, true);
        c.fillStyle = '#FFFFFF'; c.fillRect(0, g.ground + 24, VW, VH);
        if (S.wind && (g.windWarn > 0 || g.windOn > 0)) {
          c.save(); c.globalAlpha = g.windOn > 0 ? 0.85 : 0.5 + 0.4 * Math.sin(g.t * 14);
          for (let i = 0; i < 4; i++) { const x = 40 + i * 90, y = VH * 0.5 + (i % 2 ? 40 : -40); arrow(c, x, y, g.windDir); }
          c.restore();
        }
        // a trail of puffs behind the pet (rainbow sparkles in fever)
        if (!g.trail) g.trail = [];
        if (!g.dead) { g.trail.push({ x: g.x - 14, y: g.y + 10, t: 0.55, h: (g.t * 240) % 360 }); if (g.trail.length > 14) g.trail.shift(); }
        for (const p of g.trail) { p.t -= 1 / 60; p.x -= S.speed / 60; if (p.t <= 0) continue; const a = p.t / 0.55; c.globalAlpha = a * 0.55; c.fillStyle = api.fever ? `hsl(${p.h} 90% 70%)` : '#FFFFFF'; c.beginPath(); c.arc(p.x, p.y, 3 + 6 * a, 0, 6.283); c.fill(); }
        c.globalAlpha = 1;
        // the pet with little flapping wings
        const blink = g.inv > 0 && Math.floor(g.t * 12) % 2 === 0;
        const rot = clamp(g.vy / 700, -0.45, 0.8) * (g.dead ? 2 : 1);
        if (!blink) {
          c.save(); c.translate(g.x, g.y); c.rotate(rot);
          const wa = g.flap > 0 ? -0.9 : Math.sin(g.t * 16) * 0.35;
          c.fillStyle = '#FFFFFF'; c.strokeStyle = GFX.line; c.lineWidth = 2.2;
          [-1, 1].forEach(sd => { c.save(); c.translate(sd * 15, -6); c.rotate(-sd * wa); c.beginPath(); c.ellipse(sd * 9, -5, 12, 6.5, -sd * 0.55, 0, 6.283); c.fill(); c.stroke(); c.restore(); });
          c.restore();
          api.pet(c, g.x, g.y + 20, 42, { rot, face: g.dead ? 'hurt' : g.flap > 0 || g.done ? 'happy' : 'normal' });
        }
        c.restore();
      },
    };
    function puff(c, x, y, r, solid) {
      c.beginPath(); c.arc(x, y, r, 0, 6.283); c.arc(x + r * 0.9, y + r * 0.2, r * 0.75, 0, 6.283); c.arc(x - r * 0.9, y + r * 0.25, r * 0.7, 0, 6.283); c.fill();
      if (solid) { c.strokeStyle = 'rgba(43,36,51,.25)'; c.lineWidth = 2; c.stroke(); }
    }
    function pillar(c, x, y0, y1, top) {
      const w = CW, h = y1 - y0;
      if (h <= 0) return;
      const lg = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); lg.addColorStop(0, '#FFFFFF'); lg.addColorStop(0.55, '#F4FAFF'); lg.addColorStop(1, '#CFE4F6');
      c.fillStyle = lg; c.strokeStyle = GFX.line; c.lineWidth = 3;
      GFX.rr(c, x - w / 2, y0, w, h, 14); c.fill(); c.stroke();
      c.fillStyle = 'rgba(214,236,251,.9)'; GFX.rr(c, x + w / 2 - 18, y0 + 6, 10, Math.max(0, h - 12), 5); c.fill();
      c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, x - w / 2 + 7, y0 + 6, 6, Math.max(0, h - 12), 3); c.fill();
      // fluffy cap on the gap side
      const cy = top ? y1 : y0;
      c.fillStyle = '#FFFFFF';
      c.beginPath(); for (let i = 0; i < 4; i++) c.arc(x - w / 2 + 8 + i * 17, cy, 13, 0, 6.283); c.fill();
      c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(x - w / 2 + 21 + i * 17, cy); c.arc(x - w / 2 + 8 + i * 17, cy, 13, 0, 6.283); } c.lineWidth = 2.6; c.stroke();
      c.beginPath(); for (let i = 0; i < 4; i++) c.arc(x - w / 2 + 8 + i * 17, cy, 11, 0, 6.283); c.fill();
    }
    function spike(c, x, y, r, t) {
      c.save(); c.translate(x, y); c.rotate(t * 1.5);
      c.beginPath();
      for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283, rr = i % 2 ? r * 0.72 : r * 1.25; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
      c.closePath(); c.fillStyle = '#6E5A9E'; c.fill(); c.strokeStyle = GFX.line; c.lineWidth = 2.4; c.lineJoin = 'round'; c.stroke();
      c.rotate(-t * 1.5);
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(-4, -2, 3.2, 0, 6.283); c.arc(4, -2, 3.2, 0, 6.283); c.fill();
      c.fillStyle = GFX.line; c.beginPath(); c.arc(-4, -1.5, 1.5, 0, 6.283); c.arc(4, -1.5, 1.5, 0, 6.283); c.fill();
      c.restore();
    }
    function arrow(c, x, y, dir) {
      c.strokeStyle = '#FFFFFF'; c.lineWidth = 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, y - dir * 18); c.lineTo(x, y + dir * 18); c.moveTo(x - 9, y + dir * 8); c.lineTo(x, y + dir * 18); c.lineTo(x + 9, y + dir * 8); c.stroke();
    }
  },
};
