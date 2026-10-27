/* ---------- Sling Pop: fling your pet at the gloomy forts ---------- */
const MAT = {
  wood: { density: 1, hp: 60, fr: 0.7, fill: '#D9A05B', dk: '#B07A3A' },
  ice: { density: 0.8, hp: 26, fr: 0.3, fill: '#BFE9FF', dk: '#7FC8E8' },
  stone: { density: 2.4, hp: 170, fr: 0.8, fill: '#A7A0B6', dk: '#7E7690' },
  crate: { density: 0.9, hp: 20, fr: 0.6, fill: '#E36B5A', dk: '#B84A3B' },
};
/* blocks: [material, centre x, bottom height, width, height]; gloomies: [x, bottom height, radius, king?] */
const SLING_LEVELS = [
  { shots: 3, blocks: [['wood', 370, 0, 14, 70], ['wood', 440, 0, 14, 70], ['wood', 405, 70, 104, 14], ['wood', 555, 0, 40, 40]], gloomies: [[405, 0, 15], [405, 84, 16], [555, 40, 16]] },
  { shots: 4, blocks: [['ice', 410, 0, 36, 36], ['ice', 450, 0, 36, 36], ['ice', 490, 0, 36, 36], ['ice', 430, 36, 36, 36], ['ice', 470, 36, 36, 36], ['ice', 450, 72, 36, 36], ['ice', 575, 0, 12, 80], ['ice', 645, 0, 12, 80], ['ice', 610, 80, 96, 12]], gloomies: [[450, 108, 16], [610, 0, 16], [610, 92, 16]] },
  { shots: 4, blocks: [['stone', 410, 0, 20, 90], ['stone', 512, 0, 20, 90], ['stone', 461, 90, 126, 18], ['crate', 438, 0, 30, 30], ['wood', 461, 108, 36, 36], ['wood', 615, 0, 14, 60], ['wood', 675, 0, 14, 60], ['wood', 645, 60, 84, 14]], gloomies: [[484, 0, 15], [461, 144, 16], [645, 74, 16]] },
  { shots: 5, blocks: [['stone', 390, 0, 20, 70], ['stone', 490, 0, 20, 70], ['stone', 590, 0, 20, 70], ['stone', 490, 70, 224, 16], ['wood', 425, 86, 14, 60], ['wood', 490, 86, 14, 60], ['wood', 555, 86, 14, 60], ['wood', 490, 146, 170, 14], ['ice', 445, 160, 30, 30], ['ice', 535, 160, 30, 30], ['crate', 518, 0, 28, 28], ['wood', 695, 0, 40, 40]], gloomies: [[490, 160, 23, 1], [440, 0, 15], [558, 0, 15], [695, 40, 16]] },
];
GAMES.sling = {
  create(api) {
    const L = SLING_LEVELS[api.def.level] || SLING_LEVELS[0];
    const WW = 800, SX = 110, SY = -96, MAXPULL = 104, POWER = 7.7;
    const g = { t: 0, sc: 1, viewW: 430, viewH: 900, gy: 500, baseTop: -500, camX: 0, camTop: -500, camGoal: 0, intro: 2.4, state: 'aim', shots: L.shots, score: 0, pull: null, proj: null, flyT: 0, settleT: 0, dash: false, trail: [], left: 0, popped: 0, won: false, lost: false, msg: 0, panning: null };
    const impacts = [];
    const world = Phys.World({ gravity: 800, iters: 12, onImpact: (A, B, v) => impacts.push([A, B, v]) });
    world.add(Phys.Body({ x: WW / 2, y: 60, w: WW * 3, h: 120, isStatic: true, data: { kind: 'ground' } }));
    L.blocks.forEach(([m, x, b, w, h]) => { const M = MAT[m]; world.add(Phys.Body({ x, y: -(b + h / 2), w, h, density: M.density, fr: M.fr, data: { kind: 'block', mat: m, hp: M.hp, max: M.hp } })); });
    L.gloomies.forEach(([x, b, r, king]) => { if (!r) return; world.add(Phys.Body({ shape: 'circle', x, y: -(b + r), r, density: 0.9, fr: 0.6, data: { kind: 'gloomy', hp: king ? 60 : 20, max: king ? 60 : 20, king: !!king } })); });
    g.left = world.bodies.filter(b => b.data && b.data.kind === 'gloomy').length;
    const total = g.left;
    /* portrait phones zoom in and keep the ground low on screen; the camera follows the flight */
    function layout() {
      g.sc = clamp(Math.min(api.W / 430, api.H / 520), 0.55, 1.6);
      g.viewW = api.W / g.sc; g.viewH = api.H / g.sc;
      g.gy = api.H * (api.H > api.W ? 0.72 : 0.82);
      g.baseTop = -(g.gy / g.sc);
      g.camTop = g.baseTop;
    }
    layout();
    const maxCam = () => Math.max(0, WW - g.viewW);
    const hud = () => api.hud({ score: g.score, hearts: 0, max: 0, goal: `${total - g.left} / ${total} gloomies · ${g.shots} shot${g.shots === 1 ? '' : 's'} left`, prog: (total - g.left) / total });
    hud();
    const toW = (x, y) => [x / g.sc + g.camX, y / g.sc + g.camTop];
    const toS = (x, y) => [(x - g.camX) * g.sc, (y - g.camTop) * g.sc];
    function destroy(b) {
      if (b.dead) return;
      b.dead = true; world.remove(b);
      const [sx, sy] = toS(b.x, b.y);
      if (b.data.kind === 'gloomy') {
        g.left--; g.popped++; const pp = api.hit(sx, sy - 14, b.data.king ? 1500 : 500, true); g.score += pp; if (b.data.king) api.hitstop(0.35);
        api.burst(sx, sy, '#C9C2F2', 16, 180); api.pop(sx, sy - 14, '+' + pp, '#FFE37A', 18); api.sfx.pop();
        hud();
        if (g.left <= 0 && !g.won) { g.won = true; g.msg = 1.5; setTimeout(() => { const stars = g.shots >= 2 ? 3 : g.shots === 1 ? 2 : 1; api.win(stars, g.score + g.shots * 1000); }, 1400); }
      } else {
        g.score += api.hit(sx, sy, 50); api.burst(sx, sy, MAT[b.data.mat].fill, 10, 140); api.sfx.crash(); hud();
        if (b.data.mat === 'crate') {
          api.shake(9, 0.35); api.burst(sx, sy, '#FF9F43', 24, 260);
          for (const o of world.bodies.slice()) {
            if (o.isStatic || o === b) continue;
            const dx = o.x - b.x, dy = o.y - b.y, d = Math.hypot(dx, dy);
            if (d < 120) { world.wake(o); const k = (1 - d / 120) * 520; o.vx += dx / (d || 1) * k; o.vy += dy / (d || 1) * k - 120; if (o.data && o.data.hp) hurt(o, (1 - d / 120) * 70); }
          }
        }
      }
    }
    function hurt(b, dmg) { if (!b.data || !b.data.hp || b.dead) return; b.data.hp -= dmg; if (b.data.hp <= 0) destroy(b); }
    function applyImpacts() {
      for (const [A, B, v] of impacts) {
        if (v < 70) continue;
        [[A, B], [B, A]].forEach(([X, O]) => {
          if (!X.data || !X.data.hp || X.dead) return;
          const mf = O.isStatic ? 1 : clamp(O.mass / (X.mass + O.mass) * 2, 0.15, 1.6);
          const bonus = O.data && O.data.kind === 'pet' ? 1.8 : 1;
          hurt(X, (v - 60) * 0.11 * mf * bonus);
        });
        if (v > 220) { const [sx, sy] = toS((A.x + B.x) / 2, (A.y + B.y) / 2); api.burst(sx, sy, '#FFFFFF', 4, 90); }
      }
      impacts.length = 0;
    }
    function launch(px, py) {
      const vx = (SX - px) * POWER, vy = (SY - py) * POWER;
      g.proj = world.add(Phys.Body({ shape: 'circle', x: px, y: py, r: 18, density: 2.6, fr: 0.5, re: 0.25, vx, vy, data: { kind: 'pet' } }));
      g.shots--; g.state = 'fly'; g.flyT = 0; g.dash = false; g.trail = [];
      api.sfx.twang(); hud();
    }
    function nextTurn() {
      if (g.won) return;
      if (g.proj) { world.remove(g.proj); g.proj = null; }
      if (g.shots <= 0) { if (!g.lost) { g.lost = true; setTimeout(() => { if (!g.won) api.lose(`${g.left} gloom${g.left === 1 ? 'y' : 'ies'} still standing!`, g.score); }, 400); } return; }
      g.state = 'aim'; g.camGoal = 0;
    }
    return {
      resize() { layout(); },
      start() { g.intro = 2.4; },
      down(x, y) {
        if (g.intro > 0) { g.intro = 0; return; }
        const [wx, wy] = toW(x, y);
        if (g.state === 'aim' && Math.abs(g.camX - g.camGoal) < 30 && hyp(wx - SX, wy - SY) < 90) { g.pull = { x: SX, y: SY }; api.sfx.boop(); return; }
        if (g.state === 'fly' && !g.dash && g.proj) {
          g.dash = true; const sp = Math.hypot(g.proj.vx, g.proj.vy) || 1;
          g.proj.vx = g.proj.vx / sp * Math.max(sp * 1.45, 520); g.proj.vy = g.proj.vy / sp * Math.max(sp * 1.45, 520) - 40;
          api.sfx.whoosh(); const [sx, sy] = toS(g.proj.x, g.proj.y); api.burst(sx, sy, '#FFE37A', 10, 120);
          return;
        }
        g.panning = { x, cam: g.camX };
      },
      move(x, y) {
        if (g.pull) {
          const [wx, wy] = toW(x, y);
          let dx = wx - SX, dy = wy - SY; const d = Math.hypot(dx, dy);
          if (d > MAXPULL) { dx *= MAXPULL / d; dy *= MAXPULL / d; }
          if (SY + dy > -24) dy = -24 - SY;
          g.pull = { x: SX + dx, y: SY + dy };
        } else if (g.panning) { g.camX = g.camGoal = clamp(g.panning.cam - (x - g.panning.x) / g.sc, 0, maxCam()); }
      },
      up() {
        if (g.pull) { const p = g.pull; g.pull = null; if (hyp(p.x - SX, p.y - SY) > 18) launch(p.x, p.y); }
        if (g.panning) { g.panning = null; if (g.state === 'aim') setTimeout(() => { if (g.state === 'aim' && !g.pull) g.camGoal = 0; }, 1200); }
      },
      update(dt) {
        g.t += dt; g.msg = Math.max(0, g.msg - dt);
        if (g.intro > 0) {
          g.intro -= dt;
          const k = g.intro > 1.4 ? 1 - (g.intro - 1.4) / 1.0 : g.intro > 1.0 ? 1 : g.intro / 1.0;
          g.camX = maxCam() * clamp(k, 0, 1) * (k > 0 ? 1 : 0);
          if (g.intro <= 0) g.camX = 0;
        } else if (!g.panning) {
          if (g.state === 'fly' && g.proj) g.camGoal = clamp(g.proj.x - g.viewW * 0.4, 0, maxCam());
          g.camX += (g.camGoal - g.camX) * Math.min(1, dt * 4);
        }
        const topGoal = g.state === 'fly' && g.proj ? Math.min(g.baseTop, g.proj.y - 80 / g.sc) : g.baseTop;
        g.camTop += (topGoal - g.camTop) * Math.min(1, dt * 5);
        let acc = dt;
        while (acc > 1e-6) { const h = Math.min(1 / 120, acc); world.step(h); acc -= h; applyImpacts(); }
        for (const b of world.bodies.slice()) if (!b.isStatic && (b.y > 300 || b.x < -200 || b.x > WW + 300)) { if (b === g.proj) continue; if (b.data && b.data.kind === 'gloomy') destroy(b); else world.remove(b); }
        if (g.state === 'fly' && g.proj) {
          g.flyT += dt;
          if (g.flyT % 0.04 < dt) { g.trail.push([g.proj.x, g.proj.y]); if (g.trail.length > 26) g.trail.shift(); }
          const slow = Math.hypot(g.proj.vx, g.proj.vy) < 30;
          if (g.proj.sleep || (slow && g.flyT > 1.2) || g.flyT > 7 || g.proj.x > WW + 150 || g.proj.y > 200) { g.state = 'settle'; g.settleT = 0; }
        }
        if (g.state === 'settle') {
          g.settleT += dt;
          const moving = world.bodies.some(b => !b.isStatic && !b.sleep && b !== g.proj && Math.hypot(b.vx, b.vy) > 20);
          if (g.won) return;
          if ((!moving && g.settleT > 0.8) || g.settleT > 3.5) { g.state = 'wait'; nextTurn(); }
        }
      },
      draw(c) {
        const W = api.W, H = api.H, sc = g.sc;
        const sky = c.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#FFC98F'); sky.addColorStop(0.7, '#FFE9C4'); sky.addColorStop(1, '#FFF3DC');
        c.fillStyle = sky; c.fillRect(0, 0, W, H);
        { const sg = c.createRadialGradient(W * 0.78, H * 0.22, 24, W * 0.78, H * 0.22, 160); sg.addColorStop(0, 'rgba(255,240,168,.8)'); sg.addColorStop(1, 'rgba(255,240,168,0)'); c.fillStyle = sg; c.fillRect(0, 0, W, H); }
        c.fillStyle = '#FFF0A8'; c.beginPath(); c.arc(W * 0.78, H * 0.22, 34, 0, 6.283); c.fill();
        // far mesas and near dunes, each lit on the sunward side
        const gy = (0 - g.camTop) * sc;
        for (let i = -1; i < 6; i++) {
          const x = i * 260 - (g.camX * sc * 0.3) % 260;
          const mg = c.createLinearGradient(x, 0, x + 170, 0); mg.addColorStop(0, '#D99A62'); mg.addColorStop(0.6, '#E7A86E'); mg.addColorStop(1, '#F0BC86');
          c.fillStyle = mg; c.beginPath(); c.moveTo(x, gy); c.lineTo(x + 30, gy - 110); c.lineTo(x + 140, gy - 118); c.lineTo(x + 170, gy); c.fill();
          c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(x + 30, gy - 110); c.lineTo(x + 140, gy - 118); c.lineTo(x + 136, gy - 106); c.lineTo(x + 36, gy - 98); c.fill();
          c.fillStyle = 'rgba(120,60,20,.12)'; for (let k = 1; k < 4; k++) { c.fillRect(x + 40 - k * 4, gy - 110 + k * 26, 100 + k * 8, 4); }
        }
        { const hz = c.createLinearGradient(0, gy - 90, 0, gy); hz.addColorStop(0, 'rgba(255,236,200,0)'); hz.addColorStop(1, 'rgba(255,236,200,.45)'); c.fillStyle = hz; c.fillRect(0, gy - 90, W, 90); }
        for (let i = -1; i < 8; i++) {
          const x = i * 180 - (g.camX * sc * 0.6) % 180;
          const dg = c.createLinearGradient(x, 0, x + 180, 0); dg.addColorStop(0, '#E9A368'); dg.addColorStop(0.55, '#D98F55'); dg.addColorStop(1, '#C27A45');
          c.fillStyle = dg; c.beginPath(); c.ellipse(x + 90, gy, 110, 46, 0, Math.PI, 0); c.fill();
        }
        c.save(); c.scale(sc, sc); c.translate(-g.camX, -g.camTop);
        // ground
        const deep = g.viewH + 200;
        c.fillStyle = '#E8C38A'; c.fillRect(g.camX - 50, 0, g.viewW + 100, deep);
        c.fillStyle = 'rgba(255,255,255,.22)'; c.fillRect(g.camX - 50, 0, g.viewW + 100, 14);
        c.fillStyle = '#D9AE72'; c.fillRect(g.camX - 50, 60, g.viewW + 100, deep);
        c.fillStyle = 'rgba(43,36,51,.08)'; c.fillRect(g.camX - 50, 60, g.viewW + 100, 6);
        c.fillStyle = '#C7965C'; c.fillRect(g.camX - 50, 150, g.viewW + 100, deep);
        c.fillStyle = 'rgba(43,36,51,.1)'; c.fillRect(g.camX - 50, 150, g.viewW + 100, 6);
        c.fillStyle = 'rgba(255,255,255,.1)'; for (let x = Math.floor(g.camX / 46) * 46; x < g.camX + g.viewW + 46; x += 46) { c.beginPath(); c.ellipse(x + 10, 42, 16, 2.5, 0, 0, 6.283); c.ellipse(x + 34, 118, 20, 3, 0, 0, 6.283); c.fill(); }
        c.fillStyle = '#C9A06A'; c.fillRect(g.camX - 50, 0, g.viewW + 100, 8);
        c.fillStyle = '#B98C55'; for (let x = Math.floor(g.camX / 70) * 70; x < g.camX + g.viewW + 70; x += 70) { c.beginPath(); c.ellipse(x + 20, 26, 9, 4, 0, 0, 6.283); c.fill(); c.beginPath(); c.ellipse(x + 52, 100, 13, 6, 0, 0, 6.283); c.fill(); }
        // sling (back prong)
        slingBack(c);
        // aim preview
        if (g.pull) {
          const vx = (SX - g.pull.x) * POWER, vy = (SY - g.pull.y) * POWER;
          c.fillStyle = 'rgba(255,255,255,.95)';
          for (let i = 1; i <= 14; i++) { const t = i * 0.07; const x = g.pull.x + vx * t, y = g.pull.y + vy * t + 0.5 * 800 * t * t; if (y > 0) break; c.beginPath(); c.arc(x, y, Math.max(1.6, 4.4 - i * 0.2), 0, 6.283); c.fill(); }
        }
        for (const p of g.trail) { c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.arc(p[0], p[1], 3, 0, 6.283); c.fill(); }
        // bodies
        for (const b of world.bodies) {
          if (b.isStatic || !b.data) continue;
          if (b.data.kind === 'block') drawBlock(c, b);
          else if (b.data.kind === 'gloomy') { const hurtK = b.data.hp < b.data.max * 0.6; GFX.gloomy(c, b.x, b.y, b.r, { rot: b.a, color: hurtK ? '#8C78BF' : '#6E5A9E', crown: b.data.king, lookX: g.proj ? Math.sign(g.proj.x - b.x) : -1 }); }
          else if (b.data.kind === 'pet') api.pet(c, b.x, b.y + b.r, b.r * 2, { rot: b.a, face: 'happy' });
        }
        // pet waiting in the sling
        if (g.state === 'aim' && g.shots > 0) {
          const p = g.pull || { x: SX, y: SY };
          c.strokeStyle = '#5A3A22'; c.lineWidth = 5; c.lineCap = 'round';
          c.beginPath(); c.moveTo(SX - 13, SY - 14); c.lineTo(p.x - 6, p.y); c.stroke();
          api.pet(c, p.x, p.y + 18, 36, { face: g.pull ? 'happy' : 'normal' });
          c.beginPath(); c.moveTo(SX + 13, SY - 14); c.lineTo(p.x + 6, p.y); c.stroke();
        }
        slingFront(c);
        // spare shots
        for (let i = 0; i < Math.max(0, g.shots - (g.state === 'aim' ? 1 : 0)); i++) api.pet(c, SX - 46 - i * 26, 0, 22, {});
        c.restore();
        if (g.intro > 0) GFX.text(c, `Pop ${total} gloomies!`, W / 2, 50, 20, '#FFFFFF');
        else if (g.state === 'aim' && g.shots === L.shots && !g.pull) GFX.text(c, 'Drag your pet back, then let go', W / 2, 40, 15, '#FFFFFF');
        else if (g.state === 'fly' && !g.dash && g.flyT < 1.2) GFX.text(c, 'Tap to dash!', W / 2, 40, 15, '#FFE37A');
      },
    };
    function drawBlock(c, b) {
      const M = MAT[b.data.mat];
      c.save(); c.translate(b.x, b.y); c.rotate(b.a);
      c.globalAlpha = b.data.mat === 'ice' ? 0.85 : 1;
      const rr = Math.min(5, b.w * 0.2, b.h * 0.2);
      { const lg = c.createLinearGradient(-b.hx, -b.hy, b.hx, b.hy); lg.addColorStop(0, shadeC(M.fill, 0.18)); lg.addColorStop(0.5, M.fill); lg.addColorStop(1, shadeC(M.fill, -0.16)); c.fillStyle = lg; }
      GFX.rr(c, -b.hx, -b.hy, b.w, b.h, rr); c.fill();
      c.globalAlpha = 1;
      // bevel: a bright top-left lip and a dark bottom-right lip
      c.save(); GFX.rr(c, -b.hx, -b.hy, b.w, b.h, rr); c.clip();
      c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-b.hx, -b.hy, b.w, 3); c.fillRect(-b.hx, -b.hy, 3, b.h);
      c.fillStyle = 'rgba(43,36,51,.2)'; c.fillRect(-b.hx, b.hy - 3, b.w, 3); c.fillRect(b.hx - 3, -b.hy, 3, b.h);
      c.strokeStyle = M.dk; c.lineWidth = 1.6;
      if (b.data.mat === 'wood') { c.beginPath(); const n = Math.max(1, Math.floor((b.w > b.h ? b.h : b.w) / 9)); for (let i = 0; i < n; i++) { const o = -(b.w > b.h ? b.hy : b.hx) + 5 + i * 9; if (b.w > b.h) { c.moveTo(-b.hx + 6, o); c.bezierCurveTo(-b.hx * 0.3, o + 2, b.hx * 0.3, o - 2, b.hx - 6, o); } else { c.moveTo(o, -b.hy + 6); c.bezierCurveTo(o + 2, -b.hy * 0.3, o - 2, b.hy * 0.3, o, b.hy - 6); } } c.stroke(); }
      else if (b.data.mat === 'stone') { c.strokeStyle = 'rgba(43,36,51,.22)'; c.beginPath(); c.moveTo(-b.hx + 4, -b.hy * 0.2); c.lineTo(-b.hx * 0.3, -b.hy * 0.1); c.lineTo(-b.hx * 0.1, b.hy * 0.4); c.moveTo(b.hx * 0.2, -b.hy + 4); c.lineTo(b.hx * 0.35, -b.hy * 0.3); c.lineTo(b.hx - 4, -b.hy * 0.2); c.stroke(); c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.ellipse(-b.hx * 0.4, -b.hy * 0.45, b.hx * 0.25, b.hy * 0.18, -0.4, 0, 6.283); c.fill(); }
      else if (b.data.mat === 'ice') { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-b.hx + 4, -b.hy + 10); c.lineTo(-b.hx + 10, -b.hy + 4); c.moveTo(-b.hx + 4, -b.hy + 16); c.lineTo(-b.hx + 16, -b.hy + 4); c.stroke(); c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(b.hx * 0.35, b.hy * 0.3, b.hx * 0.3, b.hy * 0.2, -0.6, 0, 6.283); c.fill(); }
      c.restore();
      c.strokeStyle = GFX.line; c.lineWidth = 2.4; GFX.rr(c, -b.hx, -b.hy, b.w, b.h, rr); c.stroke();
      c.strokeStyle = M.dk; c.lineWidth = 1.6;
      if (false) {}
      else if (b.data.mat === 'crate') { c.fillStyle = '#FFE37A'; c.font = `800 ${Math.min(b.w, b.h) * 0.7}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 0, 1); }
      if (b.data.hp < b.data.max * 0.5) { c.strokeStyle = 'rgba(43,36,51,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-b.hx * 0.5, -b.hy * 0.6); c.lineTo(0, 0); c.lineTo(-b.hx * 0.2, b.hy * 0.6); c.moveTo(0, 0); c.lineTo(b.hx * 0.5, -b.hy * 0.1); c.stroke(); }
      c.restore();
    }
    function slingBack(c) {
      c.strokeStyle = GFX.line; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(SX, 0); c.lineTo(SX, SY + 26); c.moveTo(SX, SY + 26); c.lineTo(SX + 13, SY - 14); c.stroke();
      c.strokeStyle = '#A8743E'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(SX, 0); c.lineTo(SX, SY + 26); c.moveTo(SX, SY + 26); c.lineTo(SX + 13, SY - 14); c.stroke();
    }
    function slingFront(c) {
      c.strokeStyle = GFX.line; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(SX, SY + 26); c.lineTo(SX - 13, SY - 14); c.stroke();
      c.strokeStyle = '#C08A4E'; c.lineWidth = 7;
      c.beginPath(); c.moveTo(SX, SY + 26); c.lineTo(SX - 13, SY - 14); c.stroke();
    }
  },
};
