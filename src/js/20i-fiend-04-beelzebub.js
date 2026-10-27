/* ---------- BEELZEBUB, the Carrion Crown ----------
   Part fly, part beetle: six spined legs, black lacquered armour, four ragged wings, a swollen hive for an abdomen with
   larvae squirming in its glowing cells, and a crown of golden antennae. Its arena is a vast tarnished banquet platter,
   the remains of a feast, with four braziers of white cleansing fire. Armoured, it crawls and crushes and lets larvae
   loose (only the soft hive takes full damage). Its armour cracks and it takes wing, scattering eggs. At the last its
   hive bursts into swarms around a bare, pulsing breeding core.
   The Last Supper: it calls every larva back to its mouth to feed and heal. Kill them on the way, or lead them through
   the white flames: a larva killed carelessly bursts into flies, the next generation; one burnt in the flames is gone. */
FIEND_DEFS.beelzebub = (() => {
  const TAU = Math.PI * 2, BR = 9.4;
  const BLACK = '#17141A', GOLD = '#E8C24A', AMBER = '#FFB238', ROT = '#8AA83A', FLAME = '#E8F6FF', CORE = '#FF3A5A', WAX = '#C88A2A';
  const lerp = (a, b, u) => a + (b - a) * u;
  const brazierAt = (C, i) => { const a = Math.PI / 4 + i * Math.PI / 2; return { x: Math.floor(C.x + Math.cos(a) * BR) + 0.5, y: Math.floor(C.y + Math.sin(a) * BR) + 0.5, i }; };
  // per side: the angle of each leg from the facing, its reach and where its hip sits on the thorax
  const LEG = [[0.75, 2.9, 0.35], [1.6, 2.7, 0.0], [2.35, 3.1, -0.35]];
  return {
    arenaR: 15, firstAct: 'crawl', artY: 0.62,
    artPoses: [{ name: 'crawling', mem: { ang: Math.PI / 2 + 0.4, demo: 1 } }, { name: 'from the side', mem: { ang: 0.1 } }, { name: 'crush: rearing', mem: { ang: 1.4, rear: 1 } },
      { name: 'in flight', mem: { ang: 1.2, fly: 1, wing: 1 }, m: { z: 0.4 } }, { name: 'The Last Supper', mem: { ang: Math.PI / 2, mouth: 1, crack: 1 } }, { name: 'hive burst, core bare', mem: { ang: 2.0, crack: 1, burst: 1, fly: 1 }, m: { z: 0.3 } }],
    phaseNames: ['The Crawling Court', 'The Swarm Takes Wing', 'The Hive Bursts', 'The Endless Brood'],
    carve(set, C) { for (let i = 0; i < 4; i++) { const p = brazierAt(C, i); set(Math.floor(p.x), Math.floor(p.y), T_SOLID); } },
    props(C) { return [0, 1, 2, 3].map(i => Object.assign({ kind: 'brazier' }, brazierAt(C, i))); },
    /* ---- the arena: a tarnished banquet platter, the remains of a feast ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd;
      // the dish: concentric rims of old gold, tarnished black in the hollows
      let g = c.createRadialGradient(-2, -2, R * 0.1, 0, 0, R + 1.2); g.addColorStop(0, '#5A4A26'); g.addColorStop(0.55, '#3E321A'); g.addColorStop(0.86, '#2A2112'); g.addColorStop(0.9, '#6A5630'); g.addColorStop(0.95, '#2A2010'); g.addColorStop(1, 'rgba(20,16,8,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.2, 0, TAU); c.fill();
      for (let i = 0; i < 90; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, r = 0.6 + rnd() * 2.5, x = Math.cos(a) * d, y = Math.sin(a) * d, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rnd() < 0.6 ? 'rgba(10,8,4,.4)' : 'rgba(255,220,140,.08)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      [R - 0.6, R - 2.4, 6.5, 2.2].forEach((r, i) => { c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,226,150,.18)'; c.lineWidth = 0.07; c.beginPath(); c.arc(-0.06, -0.06, r, 0, TAU); c.stroke(); });
      // engraved filigree around the rim
      for (let k = 0; k < 48; k++) { const a = k / 48 * TAU, r = R - 1.5; c.save(); c.rotate(a); c.translate(r, 0); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(0, -0.5); c.bezierCurveTo(0.5, -0.3, 0.5, 0.3, 0, 0.5); c.moveTo(0, -0.2); c.bezierCurveTo(-0.3, -0.1, -0.3, 0.1, 0, 0.2); c.stroke(); c.restore(); }
      // spilled wine and the dark of things left to rot
      for (let i = 0; i < 8; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 5), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.8 + rnd() * 1.4; const wg = c.createRadialGradient(x, y, 0, x, y, r); wg.addColorStop(0, 'rgba(90,10,24,.7)'); wg.addColorStop(0.7, 'rgba(70,6,18,.5)'); wg.addColorStop(1, 'rgba(60,4,14,0)'); c.fillStyle = wg; c.beginPath(); c.ellipse(x, y, r, r * 0.7, rnd(), 0, TAU); c.fill(); }
      // honeycomb wax creeping in from the edge
      const hex = (x, y, r) => { c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; k ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + r, y); } c.closePath(); };
      for (let i = 0; i < 260; i++) { const a = rnd() * TAU, d = R - 0.5 - Math.pow(rnd(), 2) * 5, x = Math.cos(a) * d, y = Math.sin(a) * d; hex(x, y, 0.3); c.fillStyle = `rgba(${150 + rnd() * 60},${90 + rnd() * 40},20,${0.35 + rnd() * 0.3})`; c.fill(); c.strokeStyle = 'rgba(60,30,6,.8)'; c.lineWidth = 0.05; c.stroke(); if (rnd() < 0.2) { c.fillStyle = 'rgba(255,200,90,.35)'; c.beginPath(); c.arc(x - 0.05, y - 0.05, 0.12, 0, TAU); c.fill(); } }
      // the feast's leavings: goblets on their sides, bones, rotten fruit, crumbs
      for (let i = 0; i < 6; i++) { const a = rnd() * TAU, d = 3 + rnd() * (R - 6), x = Math.cos(a) * d, y = Math.sin(a) * d, b = rnd() * TAU; c.save(); c.translate(x, y); c.rotate(b); const gg2 = c.createLinearGradient(0, -0.3, 0, 0.3); gg2.addColorStop(0, '#E8C870'); gg2.addColorStop(1, '#5A4418'); c.fillStyle = gg2; c.beginPath(); c.moveTo(-0.6, -0.3); c.lineTo(0.2, -0.12); c.lineTo(0.7, -0.08); c.lineTo(0.7, 0.08); c.lineTo(0.2, 0.12); c.lineTo(-0.6, 0.3); c.closePath(); c.fill(); c.fillStyle = 'rgba(90,10,24,.8)'; c.beginPath(); c.ellipse(-0.9, 0, 0.5, 0.3, 0, 0, TAU); c.fill(); c.restore(); }
      for (let i = 0; i < 10; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.25 + rnd() * 0.3; const fg = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); fg.addColorStop(0, ['#6A7A2A', '#5A1A2A', '#7A5A1A'][i % 3]); fg.addColorStop(1, '#14100A'); c.fillStyle = fg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
      for (let i = 0; i < 9; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, b = rnd() * TAU; c.strokeStyle = 'rgba(226,214,190,.6)'; c.lineWidth = 0.14; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(b) * 1.0, y + Math.sin(b) * 1.0); c.stroke(); c.fillStyle = 'rgba(226,214,190,.6)'; c.beginPath(); c.arc(x, y, 0.14, 0, TAU); c.arc(x + Math.cos(b) * 1.0, y + Math.sin(b) * 1.0, 0.14, 0, TAU); c.fill(); }
      for (let i = 0; i < 500; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R; c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.35)' : 'rgba(255,230,160,.12)'; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.06, 0.06); }
      // the brazier footings: scorched white where the cleansing fire falls
      for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2, x = Math.cos(a) * BR, y = Math.sin(a) * BR, fg = c.createRadialGradient(x, y, 0.3, x, y, 2); fg.addColorStop(0, '#0A0806'); fg.addColorStop(0.45, 'rgba(220,235,255,.18)'); fg.addColorStop(1, 'rgba(220,235,255,0)'); c.fillStyle = fg; c.beginPath(); c.arc(x, y, 2, 0, TAU); c.fill(); }
      // the white fire's pool of light on the floor about each brazier (its dashed ward circle turns live, over it)
      if (A.FX && A.FX.C) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const b = brazierAt(A.FX.C, i), x = b.x - A.FX.C.x, y = b.y - A.FX.C.y, r = 1.75, gp = c.createRadialGradient(x, y, r * 0.2, x, y, r); gp.addColorStop(0, 'rgba(220,240,255,.25)'); gp.addColorStop(0.7, 'rgba(160,200,255,.12)'); gp.addColorStop(1, 'rgba(160,200,255,0)'); c.fillStyle = gp; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); } c.restore(); }
    },
    /* ---- the hall beyond the dish: walls of living honeycomb ---- */
    sky(c, W, H, t, cam, T) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0C0806'); g.addColorStop(1, '#1A0E06'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const px = (cam.x - 28) * T * 0.15, py = (cam.y - 28) * T * 0.15, r = 26, hh = r * Math.sqrt(3);
      c.save(); c.lineWidth = 3;
      for (let row = -1; row * hh * 0.5 < H + hh; row++) for (let col = -1; col * r * 1.5 < W + r * 2; col++) {
        const x = col * r * 1.5 - (px % (r * 3)), y = row * hh + (col % 2 ? hh / 2 : 0) - (py % hh), glowK = 0.5 + 0.5 * Math.sin(x * 0.02 + y * 0.03 + t * 0.6);
        c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; k ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + r, y); } c.closePath();
        c.fillStyle = `rgba(${120 + glowK * 80},${60 + glowK * 40},10,${0.25 + glowK * 0.25})`; c.fill(); c.strokeStyle = '#120A04'; c.stroke();
        if ((col * 7 + row * 3) % 5 === 0) { c.fillStyle = 'rgba(40,24,8,.8)'; c.beginPath(); c.ellipse(x, y, r * 0.35, r * 0.5, 0.3, 0, TAU); c.fill(); }
      }
      c.restore();
      // the drone of distant swarms
      c.save(); c.fillStyle = 'rgba(10,6,4,.8)'; for (let i = 0; i < 120; i++) { const x = (i * 131 + Math.sin(t * 2 + i) * 30 + t * 20) % W, y = (i * 71 + Math.cos(t * 1.7 + i) * 20) % H; c.fillRect(x, y, 2, 2); } c.restore();
      const vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
    },
    /* ---- living layer: the white fire around each brazier ---- */
    overlay(c, FX, t, T) {
      for (const p of FX.S.props) { const X = FX.sx(p.x), Y = FX.sy(p.y), r = 1.75 * T; c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = `rgba(220,240,255,${0.3 + 0.15 * Math.sin(t * 4 + p.i)})`; c.lineWidth = 1.5; c.setLineDash([T * 0.3, T * 0.25]); c.lineDashOffset = -t * T; c.beginPath(); c.arc(X, Y, r * 0.95, 0, TAU); c.stroke(); c.setLineDash([]); c.restore(); }
    },
    /* ---- the fight ---- */
    init(FX) {
      Object.assign(FX.mem, { ang: Math.PI / 2, faceTo: Math.PI / 2, feet: null, rear: 0, mouth: 0, fly: 0, wing: 0, crack: 0, burst: 0, sigT: 16, broodT: 2.5, swarmT: 4, strafeT: 3, tipShown: false });
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H; M.sigT = Math.min(M.sigT, 4.5); M.strafeT = 2;
      if (lv >= 2 && !M.cracked) { M.cracked = true; H.banner('ITS ARMOUR CRACKS', 'It takes wing, scattering eggs: crush them before they hatch', GOLD, 2.6, true); H.shake(16, 0.7); H.sfx.crash(); for (let k = 0; k < 26; k++) { const a = Math.random() * TAU; H.part({ kind: 'shard', x: FX.m.x + Math.cos(a), y: FX.m.y - 2 + Math.sin(a), vx: Math.cos(a) * 7, vy: Math.sin(a) * 7 - 3, g: 12, life: 1, max: 1, size: 5 + Math.random() * 5, rot: a, vr: 9, color: '#1A161E' }); } }
      if (lv >= 3 && !M.bursted) { M.bursted = true; H.banner(p === 2 ? 'Armour cracks, hive bursts!' : 'THE HIVE BURSTS', 'Swarms pour out: its breeding core is bare, strike it!', CORE, 2.8, true); H.shake(18, 0.9); }
      if (lv === 4) H.banner('The Endless Brood', 'Every larva it eats makes it stronger', ROT, 2.2);
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, fast = (1 + (lv - 1) * 0.1) * FX.S.fast;
      M.sigT -= dt; M.broodT -= dt; M.swarmT -= dt; M.strafeT -= dt; m.noTouch = (m.z || 0) > 0.8;
      if (M.cracked) M.crack = Math.min(1, M.crack + dt * 2); if (M.bursted) M.burst = Math.min(1, M.burst + dt);
      const flying = lv >= 2, d = FX.dist(m.x, m.y), aPet = FX.angPet(m.x, m.y);
      let tx = null, ty = null, spd = 0; M.faceTo = aPet;
      m.actT += dt;
      // the hive: soft from the start, the core bared at the last
      const hv = hiveAt(m, M); FX.weak('hive', hv.x, hv.y, 1.35, lv >= 3 ? 2.5 : 1.5, m.act !== 'supper' || lv >= 3);
      // swarms boil out of the burst hive
      if (lv >= 3 && M.swarmT <= 0) { M.swarmT = (lv >= 4 ? 5.5 : 7) / FX.S.fast; for (let k = 0; k < 2; k++) swarm(FX, hv.x + FX.rnd(-1, 1), hv.y + 2 + FX.rnd(-1, 1)); FX.H.sfx.hum(); }
      switch (m.act) {
        case 'crawl': case 'hover': {
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * (flying ? 0.55 : 0.25) * (M.dir || 1);
          const R = flying ? clamp(d, 5.5, 8) : clamp(d, 3.6, 5.2), p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, m.r);
          tx = p.x; ty = p.y; spd = (flying ? 5.2 : 2.6) * fast;
          if (flying) { m.z = lerp(m.z, 0.45, Math.min(1, dt * 3)); M.fly = Math.min(1, M.fly + dt * 2); }
          if (m.actT > (lv >= 3 ? 1.3 : 1.9) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; pick(FX, m, d, lv); }
          break; }
        case 'crush': {   // rears on its hind legs and brings the forelegs down like hammers
          M.rear = m.actT < M.cr.wait ? Math.min(1, M.rear + dt * 2.5) : Math.max(0, M.rear - dt * 6); M.faceTo = M.cr.a;
          if (m.actT > M.cr.wait + 0.6) { m.act = 'crawl'; m.actT = 0; }
          break; }
        case 'snap': M.mouth = Math.min(1, M.mouth + dt * 4); if (m.actT > 0.8 / fast) { m.act = 'crawl'; m.actT = 0; } break;
        case 'brood': M.mouth = Math.min(0.5, M.mouth + dt * 2);   // the hive opens and larvae drop out
          if (m.actT > 0.5 && !M.brooded) { M.brooded = true; const n = lv >= 3 ? 4 : 3; for (let k = 0; k < n; k++) { const a = M.ang + Math.PI + FX.rnd(-1.4, 1.4), r = FX.rnd(1.8, 3.2); larva(FX, hv.x + Math.cos(a) * r * 0.5, m.y + Math.sin(a) * r); } FX.H.sfx.pop(); }
          if (m.actT > 1.2) { m.act = flying ? 'hover' : 'crawl'; m.actT = 0; M.brooded = false; } break;
        case 'strafe': {   // a fast pass across the dish, dropping eggs behind it
          const L = M.sf; if (m.actT < L.wait) { m.z = lerp(m.z, 0.9, Math.min(1, dt * 4)); M.faceTo = L.a; break; }
          const sp = 15 * fast; m.x += Math.cos(L.a) * sp * dt; m.y += Math.sin(L.a) * sp * dt; L.left -= sp * dt; M.faceTo = L.a; M.wing = 1;
          L.egg -= sp * dt; if (L.egg <= 0) { L.egg = lv >= 3 ? 2.2 : 2.8; egg(FX, m.x, m.y); }
          if (!L.hit && FX.dist(m.x, m.y) < m.r + 0.4) { if (FX.hurt(m.dmg * 1.5)) L.hit = true; }
          if (L.left <= 0 || !FX.inArena(m.x + Math.cos(L.a) * m.r, m.y + Math.sin(L.a) * m.r)) { m.act = 'hover'; m.actT = 0; }
          FX.parts(bodyParts(m, M)); return; }
        case 'dive': {   // up into the dark, then straight down onto the pet
          const L = M.dv; if (m.actT < L.up) { m.z = Math.min(3, m.z + dt * 4); M.faceTo = aPet; break; }
          const u = clamp((m.actT - L.up) / 0.35, 0, 1); m.x = lerp(L.x0, L.p.x, u); m.y = lerp(L.y0, L.p.y, u); m.z = lerp(3, 0.1, u);
          if (u >= 1) { m.act = 'hover'; m.actT = 0; FX.H.shake(14, 0.4); }
          FX.parts(bodyParts(m, M)); return; }
        case 'supper': {   // The Last Supper: every larva and fly crawls back to be eaten
          M.mouth = 0.6 + Math.sin(m.t * 10) * 0.15; spd = 0; m.z = lerp(m.z, flying ? 0.2 : 0, Math.min(1, dt * 3));
          if (m.actT > M.sup.dur) { m.act = flying ? 'hover' : 'crawl'; m.actT = 0; M.mouth = 0; M.sup = null; FX.H.text(m.x, m.y - 4, 'The feast is over', GOLD, 13); }
          break; }
      }
      if (m.act !== 'snap' && m.act !== 'supper' && m.act !== 'brood') M.mouth = Math.max(0, M.mouth - dt * 3);
      if (m.act !== 'crush') M.rear = Math.max(0, M.rear - dt * 3);
      if (!flying) { m.z = Math.max(0, m.z - dt * 2); M.fly = Math.max(0, M.fly - dt * 2); }
      M.wing = flying ? 1 : Math.max(0, M.wing - dt * 3);
      if (tx != null) walk(FX, m, tx, ty, spd, dt, flying);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { FX.parts(bodyParts(m, FX.mem)); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return;
      M.ang = M.ang == null ? Math.PI / 2 : FX.K.lerpA(M.ang, M.faceTo == null ? M.ang : M.faceTo, Math.min(1, dt * (M.fly > 0.5 ? 4 : 2.4)));
      m.face = Math.cos(M.ang) >= 0 ? 1 : -1;
    },
    // armoured: only the hive takes full damage until the plates crack
    dmgK(FX, m) { return FX.S.lv >= 2 ? 1 : 0.55; },
    draw(c, FX, m, X, Y, T, t) { drawFly(c, FX, m, X, Y, T, t); },
    // the braziers' bowls are kept as pictures; their fire is painted live
    propKeep: { every: 30, box: p => [-1.3, -2.6, 1.3, 0.6] },
    drawProp(c, FX, p, X, Y, T, t) { drawBrazier(c, FX, p, X, Y, T, t); },
    drawPropLive(c, FX, p, X, Y, T, t) { drawBrazierFire(c, FX, p, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'larva') drawLarva(c, FX, o, X, Y, T, t); else if (o.kind === 'fly') drawFlyling(c, FX, o, X, Y, T, t); else if (o.kind === 'egg') drawEgg(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) {
      // the feeding call: threads of rot from every larva to its mouth
      const M = FX.mem, m = FX.m; if (!M.sup || !m) return; const mo = mouthAt(m, M), X = FX.sx(mo.x), Y = FX.sy(mo.y);
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(170,210,80,.35)'; c.lineWidth = 1.5; c.setLineDash([4, 6]); c.lineDashOffset = t * 30;
      for (const o of FX.S.objs) if (!o.dead && (o.kind === 'larva' || o.kind === 'fly')) { c.beginPath(); c.moveTo(FX.sx(o.x), FX.sy(o.y)); c.lineTo(X, Y); c.stroke(); }
      c.setLineDash([]); c.globalAlpha = 0.5 + 0.3 * Math.sin(t * 8); blitSized(c, glowSprite(ROT), X - T * 1.5, Y - T * 1.5, T * 3, T * 3); c.restore();
    },
  };
  /* ---- choosing ---- */
  function pick(FX, m, d, lv) {
    const M = FX.mem, flying = lv >= 2;
    if (lv >= 2 && M.sigT <= 0) return startSupper(FX, m);
    if (M.broodT <= 0) { M.broodT = lv >= 3 ? 7 : 9; m.act = 'brood'; m.actT = 0; return; }
    if (flying) {
      if (M.strafeT <= 0) { M.strafeT = lv >= 3 ? 4.5 : 6; const a = FX.angPet(m.x, m.y), wait = 0.8 / FX.S.fast, len = Math.min(26, d + 8); M.sf = { a, wait, left: len, egg: 1.2, hit: false }; m.act = 'strafe'; m.actT = 0; FX.tele({ shape: 'line', x: m.x, y: m.y, a, len, w: m.r * 1.6, t: wait, dmg: 0, col: GOLD }); return; }
      const p = FX.clampArena({ x: FX.me.x, y: FX.me.y }, m.r); M.dv = { up: 0.7 / FX.S.fast, x0: m.x, y0: m.y, p }; m.act = 'dive'; m.actT = 0;
      FX.slam(p.x, p.y, 2.7, M.dv.up + 0.35, m.dmg * 1.7, { col: ROT, after: q => { for (let k = 0; k < 8; k++) FX.bullet(q.x, q.y, k / 8 * TAU, 5, { color: ROT, core: '#E8FFB0' }); } }); return;
    }
    if (d < 4.4 && Math.random() < 0.55) { m.act = 'snap'; m.actT = 0; const a = FX.angPet(m.x, m.y), mo = mouthAt(m, M); FX.tele({ shape: 'cone', x: mo.x, y: mo.y + 1.2, a, len: 4.6, spread: 0.65, t: 0.55 / FX.S.fast, dmg: m.dmg * 1.4, col: GOLD, fn: () => FX.H.sfx.crash() }); return; }
    // the crush: two hammer blows in front of it and a quake around them
    const a = FX.angPet(m.x, m.y), wait = 0.9 / FX.S.fast; m.act = 'crush'; m.actT = 0; M.cr = { a, wait };
    for (const s of [-1, 1]) { const x = m.x + Math.cos(a) * 3.0 - Math.sin(a) * s * 1.3, y = m.y + Math.sin(a) * 3.0 + Math.cos(a) * s * 1.3; FX.slam(x, y, 1.7, wait, m.dmg * 1.6, { col: GOLD }); }
    FX.tele({ shape: 'ring', x: m.x + Math.cos(a) * 3, y: m.y + Math.sin(a) * 3, r0: 2.9, r1: 4.6, t: wait + 0.35, dmg: m.dmg * 0.9, col: '#B89A5A' });
  }
  function walk(FX, m, tx, ty, spd, dt, flying) {
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d < 0.05) return;
    const v = Math.min(spd, d * 3) * dt; let nx = m.x + dx / d * v, ny = m.y + dy / d * v;
    if (!flying) for (const p of FX.S.props) { const ex = nx - p.x, ey = ny - p.y, e = Math.hypot(ex, ey) || 1; if (e < 2.2) { nx = p.x + ex / e * 2.2; ny = p.y + ey / e * 2.2; } }
    const q = FX.clampArena({ x: nx, y: ny }, m.r * 0.7); m.x = q.x; m.y = q.y;
  }
  /* ---- the brood ---- */
  function inFlame(FX, x, y) { return FX.S.props.some(p => Math.hypot(x - p.x, y - p.y) < 1.75); }
  function larva(FX, x, y) {
    const lv = FX.S.lv, p = FX.clampArena({ x, y }, 1.2);
    return FX.obj({ kind: 'larva', x: p.x, y: p.y, r: 0.5, hp: FX.S.barHP * 0.009, still: true, ph: Math.random() * TAU, spd: (lv >= 3 ? 2.3 : 1.9) * FX.S.fast, biteCd: 1,
      tick: (o, dt) => crawler(FX, o, dt, 0.35),
      onKill: o => { FX.H.sparks(o.x, o.y, ROT, 12, 5);
        if (o.burning || inFlame(FX, o.x, o.y)) { FX.H.text(o.x, o.y - 0.7, 'Purified!', FLAME, 13); FX.H.ring(o.x, o.y, 0.2, 1.2, 0.3, FLAME, 0.15); return; }
        // a careless kill: it bursts into flies, the next generation
        for (let k = 0; k < 2; k++) flyling(FX, o.x + FX.rnd(-0.4, 0.4), o.y + FX.rnd(-0.4, 0.4));
        if (!FX.mem.tipShown) { FX.mem.tipShown = true; FX.H.banner('It bursts into flies!', 'Lead the larvae through the white flames to burn them clean', FLAME, 2.4); } } });
  }
  function flyling(FX, x, y) { return FX.obj({ kind: 'fly', x, y, r: 0.32, hp: FX.S.barHP * 0.0025, still: true, ph: Math.random() * TAU, spd: 4.2 * FX.S.fast, biteCd: 0.6, life: 18, tick: (o, dt) => crawler(FX, o, dt, 0.2, true) }); }
  function egg(FX, x, y) { const p = FX.clampArena({ x, y }, 1); FX.obj({ kind: 'egg', x: p.x, y: p.y, r: 0.45, hp: FX.S.barHP * 0.004, life: FX.S.lv >= 4 ? 3.5 : 4.5, onExpire: o => { larva(FX, o.x, o.y); FX.H.sparks(o.x, o.y, AMBER, 8, 4); }, onKill: o => FX.H.sparks(o.x, o.y, AMBER, 10, 5) }); }
  /* larvae and flies crawl toward the pet; during the Supper they go to its mouth, unless the pet is close enough to lead them */
  function crawler(FX, o, dt, bite, flier) {
    const me = FX.me, m = FX.m, M = FX.mem; o.ph += dt * (flier ? 18 : 6); o.biteCd -= dt;
    let tx = me.x, ty = me.y; const dp = Math.hypot(me.x - o.x, me.y - o.y);
    if (M.sup && m && !m.dead && dp > (flier ? 1.6 : 2.6)) { const mo = mouthAt(m, M); tx = mo.x; ty = mo.y + 1.2;
      if (Math.hypot(tx - o.x, ty - o.y) < 1.1) { o.dead = true; const h = FX.S.barHP * (o.kind === 'fly' ? 0.008 : (FX.S.lv >= 4 ? 0.03 : 0.022)); m.hp = Math.min(m.maxhp, m.hp + h); FX.H.text(m.x, m.y - 4.5, '+' + Math.round(h), ROT, 15); FX.H.sparks(o.x, o.y, ROT, 10, 4); FX.H.sfx.yum && FX.H.sfx.yum(); return; } }
    const dx = tx - o.x, dy = ty - o.y, d = Math.hypot(dx, dy) || 1, wob = flier ? Math.sin(o.ph * 0.4) * 1.5 : Math.sin(o.ph) * 0.3, sp = o.spd * (flier ? 1 : 0.6 + 0.4 * Math.abs(Math.sin(o.ph)));
    o.vx = dx / d * sp - dy / d * wob; o.vy = dy / d * sp + dx / d * wob; o.x += o.vx * dt; o.y += o.vy * dt; o.face = o.vx >= 0 ? 1 : -1;
    const q = FX.clampArena(o, 1); o.x = q.x; o.y = q.y;
    // the white fire burns the brood clean
    if (inFlame(FX, o.x, o.y)) { o.burning = true; o.hp -= o.maxhp * dt * 1.6; if (Math.random() < 0.4) FX.H.part({ kind: 'ember', x: o.x, y: o.y - 0.3, vx: FX.rnd(-1, 1), vy: -2, life: 0.4, max: 0.4, size: 3, color: FLAME }); if (o.hp <= 0) FX.H.hitMon(o, 1, { dot: true, noText: true }); } else o.burning = false;
    if (dp < o.r + me.r + 0.1 && o.biteCd <= 0) { o.biteCd = 0.9; FX.hurt(FX.m.dmg * bite); }
  }
  function swarm(FX, x, y) {
    FX.hz({ kind: 'swarm', x, y, r: 1.35, life: 9, dps: FX.m.dmg * 0.55, tick: 0.3, arm: 0.5, col: ROT,
      update: (dt, z) => { const dx = FX.me.x - z.x, dy = FX.me.y - z.y, d = Math.hypot(dx, dy) || 1, sp = 1.7 * FX.S.fast; z.x += dx / d * sp * dt; z.y += dy / d * sp * dt; },
      draw: (c, z, FX2, T, t) => { const X = FX.sx(z.x), Y = FX.sy(z.y), a = Math.min(1, z.age / 0.5, (z.life - z.age) / 1), rr = z.r * T; c.globalAlpha = a * 0.25; blitSized(c, puffSprite('rgba(40,50,10,'), X - rr * 1.3, Y - rr * 1.3, rr * 2.6, rr * 2.6); c.globalAlpha = a; c.fillStyle = '#0E0C08';
        for (let k = 0; k < 40; k++) { const an = t * (3 + (k % 5)) + k * 2.4, r = rr * (0.2 + ((k * 37) % 10) / 12), x = X + Math.cos(an) * r, y = Y + Math.sin(an * 1.3) * r * 0.7 - rr * 0.3; c.fillRect(x - 1.5, y - 1, 3, 2); if (k % 4 === 0) { c.fillStyle = 'rgba(200,220,255,.4)'; c.fillRect(x - 2.5, y - 2, 2, 1); c.fillStyle = '#0E0C08'; } } } });
  }
  function startSupper(FX, m) {
    const M = FX.mem, lv = FX.S.lv;
    M.sigT = lv >= 4 ? 18 : 23; m.act = 'supper'; m.actT = 0; M.sup = { dur: lv >= 4 ? 7.5 : 8.5 };
    // first it seeds the dish with a fresh brood
    const n = lv >= 3 ? 7 : 6; for (let k = 0; k < n; k++) { const a = k / n * TAU + Math.random() * 0.4, r = FX.rnd(7, 11); larva(FX, FX.C.x + Math.cos(a) * r, FX.C.y + Math.sin(a) * r); }
    FX.H.banner('THE LAST SUPPER', 'It calls its brood to feed: kill them, or lead them through the white flames!', ROT, 2.8, true); FX.H.sfx.hum();
  }
  /* ---- where its parts are ---- */
  function bodyZ(m) { return 1.35 + (m.z || 0) * 4; }
  function hiveAt(m, M) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), H = bodyZ(m); return { x: m.x - fx * 1.7, y: m.y - fy * 1.7 - H - 0.5 }; }
  function mouthAt(m, M) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), H = bodyZ(m); return { x: m.x + fx * 2.3, y: m.y + fy * 2.3 - H + 0.1 }; }
  function bodyParts(m, M) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), H = bodyZ(m), out = [{ key: 'thorax', dx: fx * 0.3, dy: fy * 0.3 - H - 0.3, r: 1.2 }, { key: 'head', dx: fx * 1.7, dy: fy * 1.7 - H, r: 0.9 }]; if (!(m.z > 0.2)) out.push({ key: 'legs', dx: 0, dy: -0.5, r: 1.9 }); return out; }
  /* ---- legs: a tripod gait, three feet planted while the other three step ---- */
  function hipOf(m, M, s, i) { const fx = Math.cos(M.ang), fy = Math.sin(M.ang), o = LEG[i][2]; return [m.x + fx * (0.3 + o) - fy * s * 0.6, m.y + fy * (0.3 + o) + fx * s * 0.6]; }
  function restOf(m, M, s, i) { const [hx, hy] = hipOf(m, M, s, i), a = M.ang + s * LEG[i][0]; return [hx + Math.cos(a) * LEG[i][1], hy + Math.sin(a) * LEG[i][1]]; }
  function rig(m, M, dt) {
    if (!M.feet) { M.feet = []; for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const [x, y] = restOf(m, M, s, i), grp = (i + (s > 0 ? 1 : 0)) % 2; let fx = x, fy = y, lift = 0; if (M.demo) { const k = grp ? 0.45 : -0.35; fx += Math.cos(M.ang) * k; fy += Math.sin(M.ang) * k; lift = grp ? 0.5 : 0; } M.feet.push({ s, i, grp, x: fx, y: fy, lift, u: 1, x0: fx, y0: fy, x1: fx, y1: fy, dur: 0.22 }); } M.lx = m.x; M.ly = m.y; }
    const vx = (m.x - M.lx) / Math.max(dt, 1e-3), vy = (m.y - M.ly) / Math.max(dt, 1e-3), sp = Math.hypot(vx, vy); M.lx = m.x; M.ly = m.y;
    if (dt <= 0 || M.demo) return;
    const busy = [0, 0]; M.feet.forEach(f => { if (f.u < 1) busy[f.grp]++; });
    for (const f of M.feet) {
      if (f.u < 1) { f.u = Math.min(1, f.u + dt / f.dur); const e = f.u * f.u * (3 - 2 * f.u); f.x = lerp(f.x0, f.x1, e); f.y = lerp(f.y0, f.y1, e); f.lift = Math.sin(f.u * Math.PI) * 0.55; if (f.u >= 1) f.lift = 0; continue; }
      const [rx, ry] = restOf(m, M, f.s, f.i), d = Math.hypot(f.x - rx, f.y - ry);
      if (d > (sp > 0.5 ? 0.8 : 0.35) && !busy[1 - f.grp]) { f.u = 0; f.x0 = f.x; f.y0 = f.y; f.x1 = rx + vx * 0.22; f.y1 = ry + vy * 0.22; f.dur = 0.2 + 0.08 * (1 - Math.min(1, sp / 4)); busy[f.grp]++; }
    }
  }
  /* ---- painting ---- */
  function drawFly(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem; if (M.ang == null) M.ang = Math.PI / 2;
    const dt = clamp(t - (M.rt == null ? t : M.rt), 0, 0.05); M.rt = t;
    const air = (m.z || 0) > 0.1 || (M.fly || 0) > 0.5;
    if (!air) rig(m, M, dt); else M.feet = null;
    if (!M.feet) rig(m, M, 0);
    const zl = (m.z || 0) * 4, Yg = Y + zl * T;
    K.shade(c, X, Yg + T * 0.1, T * 3.2, T * 2.3, 0.6 * Math.max(0.25, 1 - (m.z || 0) * 0.35));
    if (Y < -T * 6) return;
    K.stage(c, 'beelzebub', X, Y, T * 11.5, T * 12.5, T * 4.8, (a, step) => paintFly(a, FX, K, m, M, T, t, zl, step), { key: 'rgba(255,236,200,1)', keyA: 0.32, rim: AMBER, rimA: 0.3, ao: 0.42, side: 0.3, off: 0.004, steps: 2, t: K.fightT(FX, t), sig: Math.round(T * 8) });
    // the buzzing of four wings, felt as much as heard
    if (air && FX.H.part && Math.random() < 0.15) FX.H.part({ kind: 'smoke', x: m.x + FX.rnd(-2, 2), y: m.y - zl, vx: FX.rnd(-1, 1), vy: 0.5, life: 0.4, max: 0.4, size: 0.4, color: 'rgba(120,110,80,' });
  }
  function paintFly(c, FX, K, m, M, T, t, zl, step) {
    const th = M.ang, fx = Math.cos(th), fy = Math.sin(th), rear = M.rear || 0, fly = M.fly || 0, crack = M.crack || 0, burst = M.burst || 0, mouth = M.mouth || 0;
    const H = 1.35 + Math.sin(t * 2.4) * 0.04 + zl + (fly > 0 ? Math.sin(t * 9) * 0.06 : 0);
    const P3 = (x, y, z) => [(x - m.x) * T, (y - m.y) * T - (z - zl) * T];
    const hg = [m.x + fx * 1.75, m.y + fy * 1.75, H + 0.2 + rear * 0.8], tg = [m.x + fx * 0.35, m.y + fy * 0.35, H + 0.35 + rear * 0.45], ag = [m.x - fx * 1.75, m.y - fy * 1.75, H + 0.45 - rear * 0.2 + Math.sin(t * 1.6) * 0.04];
    const HA = [1.0, 1.08, 0.85], TA = [1.35, 1.35, 1.0], AA = [1.9, 1.5, 1.2];
    const ell = (g, A) => { const [ex, ey, rot] = K.ell3(A[0], A[1], A[2], th), p = P3(g[0], g[1], g[2]); return { p, rx: ex * T, ry: ey * T, rot }; };
    const surf = (g, A, u, v, lift) => K.surf3(P3, g[0], g[1], g[2], A[0], A[1], A[2], th, u, v, lift);
    // legs: spined, black, with hooked feet
    const legs = M.feet.map(f => { const [ang] = LEG[f.i], s = f.s, [hx, hy] = hipOf(m, M, s, f.i), hz = tg[2] - 0.4; let px = f.x, py = f.y, pz = f.lift || 0;
      if (fly > 0) { const da = th + s * (ang + 0.3), qx = hx + Math.cos(da) * 1.4, qy = hy + Math.sin(da) * 1.4, qz = hz - 0.9 + Math.sin(t * 6 + f.i) * 0.1; px = lerp(px, qx, fly); py = lerp(py, qy, fly); pz = lerp(pz, qz, fly); }
      if (rear > 0 && f.i === 0) { const qx = hx + fx * 2.2 - fy * s * 0.9, qy = hy + fy * 2.2 + fx * s * 0.9, qz = hz + 2.0; px = lerp(px, qx, rear); py = lerp(py, qy, rear); pz = lerp(pz, qz, rear); }
      const gx = px - hx, gy = py - hy, knee = [hx + gx * 0.45, hy + gy * 0.45, Math.max(hz, pz) + 1.0 - fly * 0.6], ank = [hx + gx * 0.85, hy + gy * 0.85, pz + 0.45];
      return { hip: [hx, hy, hz], knee, ank, foot: [px, py, pz], depth: py }; });
    const paintLeg = L => { const far = (L.foot[1] - m.y) < -0.3, hip = P3(...L.hip), knee = P3(...L.knee), ank = P3(...L.ank), foot = P3(...L.foot), col = far ? '#0C0A0E' : '#1C1820';
      const o = { col, tex: 'chitin', texA: 0.8, texS: 0.3, dk: '#000000', dkA: 0.6, hi: '#FFFFFF', hiA: 0.3, rim: AMBER, rimA: 0.2 };
      K.tube(c, [hip, [(hip[0] + knee[0]) / 2, (hip[1] + knee[1]) / 2 - T * 0.1], knee], u => T * (0.36 - u * 0.1), o);
      K.tube(c, [knee, [(knee[0] + ank[0]) / 2, (knee[1] + ank[1]) / 2], ank], u => T * (0.25 - u * 0.08), o);
      K.tube(c, [ank, [(ank[0] + foot[0]) / 2 + T * 0.05, (ank[1] + foot[1]) / 2], foot], u => T * (0.15 - u * 0.1), o);
      // spines along the tibia
      c.save(); c.fillStyle = far ? '#08070A' : '#2A2430'; for (let k = 1; k < 5; k++) { const u = k / 5, x = lerp(knee[0], ank[0], u), y = lerp(knee[1], ank[1], u); c.beginPath(); c.moveTo(x - T * 0.04, y); c.lineTo(x + T * 0.14, y - T * 0.16); c.lineTo(x + T * 0.04, y + T * 0.02); c.fill(); } c.restore();
      K.body(c, K.ellP(c, knee[0], knee[1], T * 0.19, T * 0.16), knee[0], knee[1], T * 0.19, { col: '#2A2430', spec: 0.6, ao: 0.2 }); };
    // wings: four ragged membranes; folded over the hive when crawling, a blur of beating when flying
    const wing = (s, k, behind) => {
      const root = surf(tg, TA, -0.1 - k * 0.25, s * 0.45, 0.05), beat = fly > 0 ? Math.sin(t * 46 + k * 1.3 + (s > 0 ? 0 : 0.4)) : 0;
      const spread = fly * (0.9 + beat * 0.5) + (1 - fly) * 0.18 + crack * 0.05, back = Math.PI - (1 - fly) * 0.12 * s * -1, len = (k ? 2.6 : 3.3), wdt = k ? 0.8 : 1.0;
      const dirA = th + Math.PI - s * spread * 1.2 + (k ? -s * 0.25 : 0), lift = fly * (0.6 + beat * 0.6), tip = P3(m.x + Math.cos(dirA) * len + fx * 0.2, m.y + Math.sin(dirA) * len, tg[2] + 0.2 + lift);
      const side = [Math.cos(dirA + Math.PI / 2), Math.sin(dirA + Math.PI / 2)], mid = (u, w) => P3(m.x + Math.cos(dirA) * len * u + side[0] * w * s * 0.6 + fx * 0.2, m.y + Math.sin(dirA) * len * u + side[1] * w * s * 0.6, tg[2] + 0.25 + lift * u);
      const pts = [root, mid(0.3, wdt * 0.8), mid(0.65, wdt), tip, mid(0.75, -wdt * 0.35), mid(0.35, -wdt * 0.4)];
      const copies = fly > 0.3 ? 3 : 1;
      for (let j = 0; j < copies; j++) { c.save(); if (copies > 1) { c.globalAlpha = 0.3; c.translate(0, (j - 1) * T * 0.35 * fly); } else c.globalAlpha = 0.62;
        const path = K.blobP(c, pts); path();
        const g = c.createLinearGradient(root[0], root[1], tip[0], tip[1]); g.addColorStop(0, 'rgba(60,50,40,.85)'); g.addColorStop(0.5, 'rgba(150,140,120,.45)'); g.addColorStop(1, 'rgba(200,190,170,.25)'); c.fillStyle = g; c.fill();
        // iridescent sheen and veins
        c.clip(); c.globalCompositeOperation = 'lighter'; const ir = c.createLinearGradient(root[0] - T, root[1], tip[0] + T, tip[1]); ir.addColorStop(0, 'rgba(120,60,200,0)'); ir.addColorStop(0.4, 'rgba(80,200,180,.18)'); ir.addColorStop(0.7, 'rgba(220,120,200,.15)'); ir.addColorStop(1, 'rgba(120,60,200,0)'); c.fillStyle = ir; c.fillRect(Math.min(root[0], tip[0]) - T * 2, Math.min(root[1], tip[1]) - T * 2, Math.abs(tip[0] - root[0]) + T * 4, Math.abs(tip[1] - root[1]) + T * 4);
        c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgba(20,14,10,.7)'; c.lineWidth = Math.max(1, T * 0.035); for (let v = 0; v < 5; v++) { const e = mid(0.95, wdt * (0.7 - v * 0.33)); c.beginPath(); c.moveTo(root[0], root[1]); c.quadraticCurveTo(...mid(0.5, wdt * (0.5 - v * 0.25)), e[0], e[1]); c.stroke(); }
        // tears and holes in the membrane
        c.globalCompositeOperation = 'destination-out'; [[0.55, 0.3, 0.16], [0.8, -0.1, 0.12], [0.4, -0.25, 0.1]].forEach(([u, w, r]) => { const h = mid(u, w * wdt); c.beginPath(); c.ellipse(h[0], h[1], T * r * 1.6, T * r, th, 0, TAU); c.fill(); });
        c.restore(); }
    };
    // the hive: a swollen abdomen of honeycomb, its cells lit amber, larvae turning inside
    const paintHive = () => {
      const E = ell(ag, AA), path = K.ellP(c, E.p[0], E.p[1], E.rx, E.ry, E.rot);
      K.body(c, path, E.p[0], E.p[1], Math.max(E.rx, E.ry), { col: WAX, hi: '#FFE0A0', dk: '#5A3008', dk2: '#2A1404', spec: 0.45, specR: 0.25, ao: 0.25, aoA: 0.5, rim: AMBER, rimA: 0.3,
        inner: () => {
          // honeycomb cells mapped over its curve
          for (let i = -4; i <= 4; i++) for (let j = -3; j <= 3; j++) { const u = i * 0.21 + (j % 2 ? 0.105 : 0), v = j * 0.27; if (u * u + v * v > 0.9) continue; const q = surf(ag, AA, u, v), r = T * 0.22 * Math.sqrt(Math.max(0.2, 1 - u * u - v * v)), lit = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.3 + j * 2.1);
            c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + th; k ? c.lineTo(q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r * 0.85) : c.moveTo(q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r * 0.85); } c.closePath();
            c.fillStyle = `rgba(${200 + lit * 55},${120 + lit * 60},${30 + lit * 20},${0.55 + lit * 0.3})`; c.fill(); c.strokeStyle = 'rgba(50,24,4,.85)'; c.lineWidth = Math.max(1, T * 0.04); c.stroke();
            if ((i + j * 3) % 3 === 0) { c.fillStyle = 'rgba(240,230,200,.75)'; c.beginPath(); c.ellipse(q[0] + Math.sin(t * 3 + i) * r * 0.15, q[1], r * 0.4, r * 0.25, th + Math.sin(t * 2 + j), 0, TAU); c.fill(); } }
          // the burst: a torn wound and the breeding core pulsing within
          if (burst > 0) { const q = surf(ag, AA, 0.05, 0), pul = 0.6 + 0.4 * Math.sin(t * 7), r = T * (0.75 + pul * 0.1) * burst;
            c.fillStyle = '#2A0408'; c.beginPath(); for (let k = 0; k <= 14; k++) { const a = k / 14 * TAU, rr = r * 1.25 * (0.75 + ((k * 7) % 5) / 10); k ? c.lineTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr * 0.8) : c.moveTo(q[0] + rr, q[1]); } c.closePath(); c.fill();
            const cg = c.createRadialGradient(q[0] - r * 0.2, q[1] - r * 0.2, 0, q[0], q[1], r); cg.addColorStop(0, '#FFD0D8'); cg.addColorStop(0.4, CORE); cg.addColorStop(1, '#5A0010'); c.fillStyle = cg; c.beginPath(); c.arc(q[0], q[1], r * 0.8, 0, TAU); c.fill();
            c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * pul; blitSized(c, glowSprite(CORE), q[0] - r * 2, q[1] - r * 2, r * 4, r * 4); c.restore(); }
        } });
      // rings of black armour banding the hive
      for (let k = 0; k < 3; k++) { const u = 0.65 - k * 0.55; c.save(); c.beginPath(); for (let j = 0; j <= 14; j++) { const v = -0.92 + j / 14 * 1.84, q = surf(ag, AA, u - v * v * 0.12, v * Math.sqrt(Math.max(0, 1 - u * u))); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.strokeStyle = '#100C10'; c.lineWidth = T * 0.16 * (1 - crack * 0.5); c.stroke(); c.strokeStyle = 'rgba(255,220,160,.25)'; c.lineWidth = T * 0.04; c.stroke(); c.restore(); }
    };
    // the thorax: plates of black lacquered armour, cracking open
    const paintThorax = () => {
      const E = ell(tg, TA), path = K.ellP(c, E.p[0], E.p[1], E.rx, E.ry, E.rot);
      K.body(c, path, E.p[0], E.p[1], Math.max(E.rx, E.ry), { col: BLACK, hi: '#7A7088', dk: '#050407', dk2: '#000000', tex: 'chitin', texA: 0.8, texS: 0.35, spec: 0.85, specR: 0.3, ao: 0.2, aoA: 0.5, rim: AMBER, rimA: 0.35,
        inner: () => { c.save(); c.strokeStyle = 'rgba(232,194,74,.55)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); for (let j = 0; j <= 10; j++) { const q = surf(tg, TA, -0.9 + j * 0.18, 0); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
          for (const s of [-1, 1]) { c.beginPath(); for (let j = 0; j <= 10; j++) { const q = surf(tg, TA, -0.8 + j * 0.16, s * (0.55 - Math.abs(j - 5) * 0.03)); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = Math.max(1, T * 0.06); c.stroke(); }
          if (crack > 0) { c.strokeStyle = `rgba(255,180,90,${0.7 * crack})`; c.lineWidth = Math.max(1, T * 0.035); [[0.3, -0.3, -0.2, 0.2, -0.5, 0.4], [0.5, 0.2, 0.1, 0.5, -0.3, 0.3]].forEach(([u0, v0, u1, v1, u2, v2]) => { const a = surf(tg, TA, u0, v0), b = surf(tg, TA, u1, v1), e = surf(tg, TA, u2, v2); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(e[0], e[1]); c.stroke(); }); }
          c.restore(); } });
    };
    // the head: two vast compound eyes, a crown of golden antennae, mandibles and a probing mouth
    const paintHead = () => {
      const E = ell(hg, HA), path = K.ellP(c, E.p[0], E.p[1], E.rx, E.ry, E.rot), front = fy > -0.5;
      // mandibles below the face
      if (front) for (const s of [-1, 1]) { const b = surf(hg, HA, 0.85, s * 0.3, -0.35), op = 0.25 + mouth * 0.7, a = Math.atan2(fy, fx) + s * op, tip = P3(hg[0] + fx * 0.95 + Math.cos(a) * 0.9, hg[1] + fy * 0.95 + Math.sin(a) * 0.9, hg[2] - 0.55);
        K.tube(c, [b, [(b[0] + tip[0]) / 2 + s * T * 0.15, (b[1] + tip[1]) / 2], tip], u => T * (0.26 * (1 - u) + 0.03), { col: '#2A2020', hi: '#C8A060', hiA: 0.35, dk: '#000000', dkA: 0.5 }); }
      if (front && mouth > 0.3) { const q = surf(hg, HA, 1, 0, -0.45); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = mouth * 0.6; blitSized(c, glowSprite(ROT), q[0] - T, q[1] - T * 0.6, T * 2, T * 1.6); c.restore(); }
      K.body(c, path, E.p[0], E.p[1], Math.max(E.rx, E.ry), { col: '#1A161C', hi: '#6A6070', dk: '#050407', tex: 'chitin', texA: 0.7, texS: 0.3, spec: 0.7, ao: 0.2 });
      // compound eyes: domes of a thousand bronze facets
      for (const s of [-1, 1]) { const q = surf(hg, HA, 0.3, s * 0.62, 0.05), vis = clamp((fy * s * 0 + 1), 0, 1), r = T * 0.62;
        c.save(); const eg = c.createRadialGradient(q[0] - r * 0.3, q[1] - r * 0.35, r * 0.05, q[0], q[1], r); eg.addColorStop(0, '#FFB088'); eg.addColorStop(0.35, '#8A2A18'); eg.addColorStop(0.8, '#3A0A08'); eg.addColorStop(1, '#100204'); c.fillStyle = eg; c.beginPath(); c.ellipse(q[0], q[1], r, r * 0.88, th * 0.3, 0, TAU); c.fill(); c.clip();
          c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 0.8; const hs = r * 0.16; for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const x = q[0] + i * hs * 1.5, y = q[1] + j * hs * 1.7 + (i % 2 ? hs * 0.85 : 0); c.beginPath(); c.arc(x, y, hs * 0.85, 0, TAU); c.stroke(); }
          c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,230,200,.5)'; c.beginPath(); c.ellipse(q[0] - r * 0.35, q[1] - r * 0.4, r * 0.3, r * 0.15, -0.6, 0, TAU); c.fill(); c.restore();
          K.glow(c, q[0], q[1], r * 1.6, '#FF6A3A', 0.18 * vis); }
      // the crown: golden antennae branching up and back, tipped with burning knots
      const cr0 = surf(hg, HA, 0.45, 0, 0.1);
      for (let k = 0; k < 7; k++) { const sp = (k - 3) / 3, a = th + Math.PI + sp * 1.1, h = 1.3 + (1 - Math.abs(sp)) * 0.7, sway = Math.sin(t * 1.8 + k) * 0.08;
        const p0 = cr0, p1 = P3(hg[0] + Math.cos(a) * 0.25 * Math.abs(sp) + fx * 0.15, hg[1] + Math.sin(a) * 0.25 * Math.abs(sp) + fy * 0.15, hg[2] + HA[2] + h * 0.5), p2 = P3(hg[0] + Math.cos(a) * (0.55 * Math.abs(sp) + 0.1) + sway, hg[1] + Math.sin(a) * (0.55 * Math.abs(sp) + 0.1), hg[2] + HA[2] + h);
        K.tube(c, [p0, p1, p2], u => T * (0.11 - u * 0.06), { col: '#C89A30', hi: '#FFF0B0', hiA: 0.5, dk: '#5A3A08', dkA: 0.5 });
        // little side barbs on the antennae, and a glowing knot at each tip
        c.save(); c.strokeStyle = '#D8AA40'; c.lineWidth = Math.max(1, T * 0.035); for (let j = 1; j < 3; j++) { const x = lerp(p1[0], p2[0], j / 3), y = lerp(p1[1], p2[1], j / 3); c.beginPath(); c.moveTo(x, y); c.lineTo(x + (sp >= 0 ? 1 : -1) * T * 0.18, y - T * 0.08); c.stroke(); } c.restore();
        K.body(c, K.ellP(c, p2[0], p2[1], T * 0.1, T * 0.1), p2[0], p2[1], T * 0.1, { col: GOLD, hi: '#FFFFFF', spec: 0.9, ao: 0.1 }); K.glow(c, p2[0], p2[1], T * 0.45, GOLD, 0.55); }
    };
    // depth order
    const back = legs.filter(L => L.depth - m.y < -0.3).sort((a, b) => a.depth - b.depth), frontL = legs.filter(L => L.depth - m.y >= -0.3).sort((a, b) => a.depth - b.depth);
    const order = fy >= 0 ? [paintHive, paintThorax, paintHead] : [paintHead, paintThorax, paintHive];
    // wings on the far side first, those on the near side last
    const wingsFar = () => { wing(-Math.sign(fx || 1), 0); wing(-Math.sign(fx || 1), 1); }, wingsNear = () => { wing(Math.sign(fx || 1), 1); wing(Math.sign(fx || 1), 0); };
    const seq = [() => back.forEach(paintLeg)], frontLegs = () => frontL.forEach(paintLeg);
    if (fly > 0.4) seq.push(wingsFar, ...order, frontLegs, wingsNear); else seq.push(...order, frontLegs, wingsFar, wingsNear);
    // kept, it is painted in two steps: the farther half of all that, then the nearer
    const cut = Math.ceil(seq.length / 2);
    seq.forEach((f, i) => { if (step == null || (step === 0 ? i < cut : i >= cut)) f(); });
  }
  function drawBrazier(c, FX, p, X, Y, T, t) {
    const K = FX.K, w = T * 0.7, h = T * 2.2;
    K.shade(c, X, Y + T * 0.06, w * 1.6, w * 0.55, 0.6);
    // a tall bowl of hammered gold on three clawed legs
    K.body(c, () => { c.beginPath(); c.moveTo(X - w * 0.3, Y); c.lineTo(X - w * 0.2, Y - h * 0.6); c.lineTo(X + w * 0.2, Y - h * 0.6); c.lineTo(X + w * 0.3, Y); c.closePath(); }, X, Y - h * 0.3, h * 0.4, { col: '#6A5420', hi: '#FFE8A0', dk: '#2A1C08', spec: 0.7, rim: FLAME, rimA: 0.3 });
    K.body(c, () => { c.beginPath(); c.moveTo(X - w, Y - h * 0.82); c.quadraticCurveTo(X - w * 0.9, Y - h * 0.55, X, Y - h * 0.55); c.quadraticCurveTo(X + w * 0.9, Y - h * 0.55, X + w, Y - h * 0.82); c.ellipse(X, Y - h * 0.82, w, w * 0.32, 0, 0, Math.PI, true); c.closePath(); }, X, Y - h * 0.7, w, { col: '#8A6A28', hi: '#FFF0B8', dk: '#3A2A0A', spec: 0.8, rim: FLAME, rimA: 0.4, tex: 'stone', texA: 0.3, texS: 0.3 });
  }
  // the white fire, painted live over the kept bowl
  function drawBrazierFire(c, FX, p, X, Y, T, t) {
    const w = T * 0.7, h = T * 2.2;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) { const ph = (t * 1.6 + k / 7) % 1, x = X + Math.sin(k * 2.3 + t * 3) * w * 0.5 * (1 - ph), y = Y - h * 0.85 - ph * T * 2.4, r = T * (0.55 - ph * 0.35); c.globalAlpha = (1 - ph) * 0.7; blitSized(c, glowSprite(k % 2 ? FLAME : '#9FC8FF'), x - r, y - r, r * 2, r * 2); }
    c.globalAlpha = 0.6; blitSized(c, glowSprite(FLAME), X - T * 1.6, Y - h - T * 1.4, T * 3.2, T * 2.6); c.restore();
  }
  function drawLarva(c, FX, o, X, Y, T, t) {
    const K = FX.K, r = T * 0.45, pul = Math.sin(o.ph || 0), f = o.face || 1;
    K.shade(c, X, Y + T * 0.05, r * 1.4, r * 0.45, 0.5);
    // a pale grub, segmented, rippling as it crawls
    const pts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push([X + f * (u - 0.5) * r * 2.6, Y - r * 0.55 + Math.sin(u * 5 + (o.ph || 0)) * r * 0.12]); }
    K.tube(c, pts, u => r * (0.75 + Math.sin(u * Math.PI) * 0.45) * (1 + (u > 0.8 ? -0.3 : 0)), { col: o.burning ? '#E8F0FF' : '#E8DCC0', hi: '#FFFFFF', hiA: 0.4, dk: '#7A6A4A', dkA: 0.55,
      inner: () => { c.strokeStyle = 'rgba(120,100,60,.6)'; c.lineWidth = 1; for (let k = 1; k < 6; k++) { const p = pts[k]; c.beginPath(); c.moveTo(p[0] - 1, p[1] - r * 0.6); c.lineTo(p[0] + 1, p[1] + r * 0.6); c.stroke(); } } });
    const hp = pts[6]; c.fillStyle = '#3A2010'; c.beginPath(); c.arc(hp[0] + f * r * 0.1, hp[1], r * 0.28, 0, TAU); c.fill();
    if (o.burning) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite(FLAME), X - r * 2, Y - r * 2.4, r * 4, r * 4); c.restore(); }
    else if (FX.mem.sup) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.2 * pul; blitSized(c, glowSprite(ROT), X - r * 1.6, Y - r * 2, r * 3.2, r * 3.2); c.restore(); }
  }
  function drawFlyling(c, FX, o, X, Y, T, t) {
    const r = T * 0.28, by = Y - T * 0.7 + Math.sin(o.ph || 0) * T * 0.15;
    c.save(); c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(X, Y, r, r * 0.35, 0, 0, TAU); c.fill();
    c.globalAlpha = 0.45; c.fillStyle = '#C8D8E0'; const fl = Math.sin(t * 60) * 0.5 + 0.5; for (const s of [-1, 1]) { c.beginPath(); c.ellipse(X + s * r * 0.7, by - r * 0.3, r * (0.7 + fl * 0.2), r * 0.35, s * 0.4, 0, TAU); c.fill(); }
    c.globalAlpha = 1; const g = c.createRadialGradient(X - r * 0.3, by - r * 0.3, 0, X, by, r); g.addColorStop(0, '#5A6A30'); g.addColorStop(1, '#0A0C04'); c.fillStyle = g; c.beginPath(); c.ellipse(X, by, r * 0.6, r * 0.5, 0, 0, TAU); c.fill();
    c.fillStyle = '#A02A1A'; c.beginPath(); c.arc(X + (o.face || 1) * r * 0.4, by - r * 0.1, r * 0.22, 0, TAU); c.fill(); c.restore();
  }
  function drawEgg(c, FX, o, X, Y, T, t) {
    const K = FX.K, r = T * 0.4, left = clamp((o.life || 1) / 4.5, 0, 1), pul = 0.5 + 0.5 * Math.sin(t * (5 + (1 - left) * 12));
    K.shade(c, X, Y + T * 0.04, r * 1.1, r * 0.4, 0.5);
    K.body(c, K.ellP(c, X, Y - r * 0.6, r * 0.6, r * 0.85), X, Y - r * 0.6, r, { col: '#E8D8A8', hi: '#FFFFFF', dk: '#8A7040', spec: 0.6, ao: 0.2, inner: () => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + pul * 0.4 * (1.2 - left); blitSized(c, glowSprite(AMBER), X - r, Y - r * 1.6, r * 2, r * 2); c.restore(); } });
  }
})();
