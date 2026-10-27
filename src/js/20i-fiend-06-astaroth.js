/* ---------- ASTAROTH, the Devourer of Tomorrow ----------
   A serpentine dragon that never lands: a long body of dusk-blue scales, six wings of something like glass marked
   with the hours, and behind it, always, the ghosts of where it was a moment ago. Its arena is the face of a ruined
   clock, its hands still turning. Everything it does happens twice: each attack is followed by its echo. Then it marks
   moments: a sigil where the pet stood, and when its wings beat the pet is pulled back to it, onto an attack already
   waiting there. Later the returns stack, two at once, folding the fight back on itself.
   Tomorrow's Grave: three ghostly paths are shown, then it flies them in reverse order (three, two, one). */
FIEND_DEFS.astaroth = (() => {
  const TAU = Math.PI * 2, N = 22, SEG = 0.58;
  const SCALE = '#26365A', BELLY = '#8FA6C8', GHOST = '#9FD8FF', WHITE = '#E8F6FF', HOURS = '#FFE9A8';
  const lerp = (a, b, u) => a + (b - a) * u;
  return {
    arenaR: 15, firstAct: 'circle', artY: 0.55, ambient: 'motes',
    artPoses: [{ name: 'gliding', mem: { demoA: 0.3 } }, { name: 'banking', mem: { demoA: 1.6, beat: 0.6 } }, { name: 'breath', mem: { demoA: 2.6, jaw: 1 } }, { name: 'wingbeat', mem: { demoA: -0.6, beat: 1, flare: 1 } }, { name: 'out of time (weak)', mem: { demoA: 1.0, reel: 1 } }, { name: 'diving', mem: { demoA: 0.8, alt: 0.8 } }],
    phaseNames: ['Echoes of Now', 'Marked Moments', 'Overlapping Hours', 'The End of Days'],
    /* ---- the arena: the face of a ruined clock ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd;
      let g = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R + 1.4); g.addColorStop(0, '#2A3044'); g.addColorStop(0.8, '#1C2134'); g.addColorStop(0.95, '#121626'); g.addColorStop(1, 'rgba(14,16,28,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
      for (let i = 0; i < 80; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, r = 0.8 + rnd() * 2.4, x = Math.cos(a) * d, y = Math.sin(a) * d, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rnd() < 0.5 ? 'rgba(0,0,0,.3)' : 'rgba(180,200,240,.06)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - r, y - r, r * 2, r * 2); }
      // the dial: rings, minute ticks and the twelve hours in worn gilt
      [[R - 0.5, 0.25], [R - 2.6, 0.1], [4.0, 0.12], [1.2, 0.2]].forEach(([r, w]) => { c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,233,168,.22)'; c.lineWidth = w * 0.35; c.beginPath(); c.arc(-0.04, -0.04, r, 0, TAU); c.stroke(); });
      for (let k = 0; k < 60; k++) { const a = k / 60 * TAU, big = k % 5 === 0, r0 = R - 1.0, r1 = r0 - (big ? 0.9 : 0.4); c.strokeStyle = big ? 'rgba(255,233,168,.4)' : 'rgba(255,233,168,.18)'; c.lineWidth = big ? 0.16 : 0.06; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); }
      const NUM = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      c.font = '900 1.25px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      NUM.forEach((n, k) => { const a = -Math.PI / 2 + k / 12 * TAU, r = R - 3.5; c.save(); c.translate(Math.cos(a) * r, Math.sin(a) * r); c.rotate(a + Math.PI / 2); c.fillStyle = 'rgba(0,0,0,.5)'; c.fillText(n, 0.05, 0.05); c.fillStyle = 'rgba(255,233,168,.32)'; c.fillText(n, 0, 0); c.restore(); });
      // cracks through the dial and gears showing through the broken places
      c.lineCap = 'round'; for (let i = 0; i < 26; i++) { let x = (rnd() - 0.5) * R * 2, y = (rnd() - 0.5) * R * 2; if (Math.hypot(x, y) > R - 0.5) continue; c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 2.4; y += (rnd() - 0.5) * 2.4; c.lineTo(x, y); } c.stroke(); }
      for (let i = 0; i < 5; i++) { const a = rnd() * TAU, d = 5 + rnd() * (R - 8), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.9 + rnd() * 0.9; c.fillStyle = '#05060C'; c.beginPath(); c.arc(x, y, r * 1.15, 0, TAU); c.fill();
        c.save(); c.translate(x, y); c.rotate(rnd()); const gg = c.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r); gg.addColorStop(0, '#B89A5A'); gg.addColorStop(1, '#4A3A1A'); c.fillStyle = gg; c.beginPath(); for (let k = 0; k < 24; k++) { const b = k / 24 * TAU, rr = k % 2 ? r : r * 0.82; k ? c.lineTo(Math.cos(b) * rr, Math.sin(b) * rr) : c.moveTo(rr, 0); } c.closePath(); c.fill(); c.fillStyle = '#05060C'; c.beginPath(); c.arc(0, 0, r * 0.3, 0, TAU); c.fill(); c.restore(); }
    },
    /* ---- beyond: clock faces adrift in a starry dusk ---- */
    sky(c, W, H, t, cam, T) {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050816'); g.addColorStop(0.6, '#0E1430'); g.addColorStop(1, '#1A1A3A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const px = (cam.x - 28) * T, py = (cam.y - 28) * T;
      for (let i = 0; i < 110; i++) { c.fillStyle = `rgba(220,235,255,${0.25 + (i % 4) * 0.15})`; c.fillRect((i * 173) % W - px * 0.02, (i * 89) % H - py * 0.02, 1.4, 1.4); }
      for (let i = 0; i < 9; i++) { const x = ((i * 211 + 50) % (W + 100)) - 50 - px * (0.04 + (i % 3) * 0.02), y = ((i * 137 + 30) % (H + 100)) - 50 - py * 0.03, r = 18 + (i % 4) * 14, rot = t * (0.1 + (i % 3) * 0.08) * (i % 2 ? 1 : -1);
        c.save(); c.translate(x, y); c.globalAlpha = 0.18 + (i % 3) * 0.06; c.strokeStyle = HOURS; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.stroke(); }
        c.rotate(rot); c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -r * 0.75); c.moveTo(0, 0); c.lineTo(r * 0.5, 0); c.stroke(); c.restore(); }
    },
    /* ---- living layer: the clock's great hands still turn across the floor ---- */
    overlay(c, FX, t, T) {
      const C = FX.C, X = FX.sx(C.x), Y = FX.sy(C.y), M = FX.mem, sp = 1 + (M.handK || 0);
      [[t * 0.05 * sp, 10.5, 0.55], [t * 0.012 * sp + 2, 7.2, 0.8]].forEach(([a, L, w]) => { c.save(); c.translate(X, Y); c.rotate(a); c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(-w * T, T * 0.3); c.lineTo(0, -L * T); c.lineTo(w * T, T * 0.3); c.closePath(); c.fill();
        const hg = c.createLinearGradient(-w * T, 0, w * T, 0); hg.addColorStop(0, '#3A3020'); hg.addColorStop(0.5, '#9A845A'); hg.addColorStop(1, '#3A3020'); c.fillStyle = hg; c.beginPath(); c.moveTo(-w * T * 0.8, 0); c.lineTo(0, -L * T * 0.97); c.lineTo(w * T * 0.8, 0); c.closePath(); c.fill(); c.restore(); });
      c.save(); const hb = c.createRadialGradient(X - T * 0.3, Y - T * 0.3, 0, X, Y, T * 1.2); hb.addColorStop(0, '#D8C08A'); hb.addColorStop(1, '#3A3020'); c.fillStyle = hb; c.beginPath(); c.arc(X, Y, T * 1.1, 0, TAU); c.fill(); c.restore();
    },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m; m.noTouch = true; m.x = FX.C.x; m.y = FX.C.y - 6;
      Object.assign(M, { hd: 0, alt: 2.2, alt0: 2.2, jaw: 0, beat: 0, flare: 0, reel: 0, trail: [], snaps: [], snapT: 0, sched: [], sigT: 15, markT: 3, ph: 0, handK: 0 });
      for (let i = 0; i < 60; i++) M.trail.push({ x: m.x - i * 0.2, y: m.y, z: 2.2 });
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H; M.sigT = Math.min(M.sigT, 5); M.markT = 1.5; M.handK = lv * 0.8;
      if (lv === 2) H.banner('MARKED MOMENTS', 'Where you stood, it remembers: break the hourglass before its wings beat', GHOST, 2.8, true);
      if (lv === 3) H.banner('OVERLAPPING HOURS', 'Two moments at once: it will pull you back, and back again', GHOST, 2.6, true);
      if (lv === 4) H.banner('THE END OF DAYS', 'Every echo returns twice', WHITE, 2.4, true);
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, fast = (1 + (lv - 1) * 0.08) * FX.S.fast;
      M.sigT -= dt; M.markT -= dt; m.actT += dt; m.noTouch = true;
      const d = FX.dist(m.x, m.y);
      switch (m.act) {
        case 'circle': {   // it weaves around the pet, never still
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.5 * fast * (M.dir || 1);
          const R = 7 + Math.sin(m.t * 0.7) * 1.5, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2);
          fly(FX, m, M, p.x, p.y, 7 * fast, dt, 2.6); M.alt = lerp(M.alt, 2.2, Math.min(1, dt * 2));
          if (lv >= 2 && M.markT <= 0) placeMarks(FX, m, lv);
          if (m.actT > (lv >= 3 ? 1.3 : 1.8) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; pick(FX, m, d, lv); }
          break; }
        case 'breath': { M.jaw = Math.min(1, M.jaw + dt * 3); const p = FX.clampArena({ x: m.x + Math.cos(M.hd) * 2, y: m.y + Math.sin(M.hd) * 2 }, 2); fly(FX, m, M, M.bt.x, M.bt.y, 2.5, dt, 5); if (m.actT > M.bt.wait + 0.4) { m.act = 'circle'; m.actT = 0; } break; }
        case 'swoop': {   // along a line, low over the floor
          const L = M.sw; if (m.actT < L.wait) { fly(FX, m, M, L.x0, L.y0, 9 * fast, dt, 4); break; }
          const u = clamp((m.actT - L.wait) / L.dur, 0, 1); m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); M.hd = L.a; M.alt = lerp(M.alt, 0.8, Math.min(1, dt * 6)); push(M, m);
          if (!L.hit && FX.dist(m.x, m.y) < 1.6 + FX.me.r) { if (FX.hurt(m.dmg * 1.6)) L.hit = true; }
          if (u >= 1) { if (L.next) { const n = L.next; M.sw = n; m.actT = n.wait - 0.01; } else { m.act = 'circle'; m.actT = 0; } }
          break; }
        case 'coil': { const L = M.cl, a = L.a0 + m.actT * 3.2, p = { x: L.x + Math.cos(a) * 3.4, y: L.y + Math.sin(a) * 3.4 }; fly(FX, m, M, p.x, p.y, 11 * fast, dt, 6); if (m.actT > L.wait + 0.5) { m.act = 'circle'; m.actT = 0; } break; }
        case 'grave': {   // Tomorrow's Grave: it flies the three paths backwards in time
          const G = M.gr; if (m.actT < G.show) { fly(FX, m, M, FX.C.x, FX.C.y - 12, 8, dt, 3); M.alt = lerp(M.alt, 3.2, Math.min(1, dt * 2)); break; }
          const k = Math.floor((m.actT - G.show) / G.each), u = ((m.actT - G.show) % G.each) / G.each;
          if (k >= 3) { m.act = 'circle'; m.actT = 0; m.stunT = 2.6; M.reel = 1; FX.H.banner('It is out of time!', 'Its hourglass heart is bare: strike!', GHOST, 1.6); break; }
          const P2 = G.paths[2 - k]; m.x = lerp(P2.x0, P2.x1, u); m.y = lerp(P2.y0, P2.y1, u); M.hd = P2.a; M.alt = lerp(M.alt, 0.9, Math.min(1, dt * 8)); push(M, m);
          break; }
      }
      if (m.act !== 'breath') M.jaw = Math.max(0, M.jaw - dt * 2.5);
      M.beat = Math.max(0, M.beat - dt * 1.5); M.flare = Math.max(0, M.flare - dt * 2);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.reel = Math.min(1, M.reel + dt * 3); M.alt = lerp(M.alt, 1.1, Math.min(1, dt * 3)); const h = heartAt(m, M); FX.weak('heart', h.x, h.y, 1.1, 2.5, m.stunT > 0.05); FX.parts(bodyParts(m, M)); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return;
      if (!(m.stunT > 0)) { M.reel = Math.max(0, M.reel - dt * 2); if (FX.S.weak.heart) FX.weak('heart', 0, 0, 0, 0, false); }
      // the echoes and the returns, kept on its own clock
      for (let i = M.sched.length - 1; i >= 0; i--) { const e = M.sched[i]; e.t -= dt; if (e.t <= 0) { M.sched.splice(i, 1); e.fn(); } }
      // ghosts of where it was
      M.snapT -= dt; if (M.snapT <= 0) { M.snapT = 0.1; M.snaps.unshift(body(M).map(p => [p.x, p.y, p.z])); if (M.snaps.length > 14) M.snaps.pop(); }
    },
    dmgK() { return 1; },
    // the dragon is kept as a picture, repainted every other frame
    keep: { every: 2 },
    draw(c, FX, m, X, Y, T, t) { drawDragon(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'mark') drawMark(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) {
      // the paths of Tomorrow's Grave, numbered in the order they were shown
      const M = FX.mem, G = M.gr; if (!G || FX.m.act !== 'grave') return;
      c.save(); G.paths.forEach((P2, k) => { const x0 = FX.sx(P2.x0), y0 = FX.sy(P2.y0), x1 = FX.sx(P2.x1), y1 = FX.sy(P2.y1); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; c.strokeStyle = GHOST; c.lineWidth = T * 0.5; c.setLineDash([T * 0.6, T * 0.4]); c.lineDashOffset = -t * T * 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.font = `900 ${Math.round(T * 1.1)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(String(k + 1), x0, y0); c.fillStyle = WHITE; c.fillText(String(k + 1), x0, y0); }); c.restore();
    },
  };
  /* ---- the body: the head leads, the rest follows its trail through the air ---- */
  function push(M, m) { const last = M.trail[0]; if (!last || Math.hypot(m.x - last.x, m.y - last.y) > 0.1) { M.trail.unshift({ x: m.x, y: m.y, z: M.alt }); if (M.trail.length > 160) M.trail.pop(); } }
  function fly(FX, m, M, tx, ty, spd, dt, turn) {
    const want = Math.atan2(ty - m.y, tx - m.x); M.hd = FX.K.lerpA(M.hd, want, Math.min(1, dt * (turn || 2.2)));
    m.x += Math.cos(M.hd) * spd * dt; m.y += Math.sin(M.hd) * spd * dt; const q = FX.clampArena(m, 1.2); m.x = q.x; m.y = q.y; push(M, m);
  }
  function body(M) {
    const pts = [], tr = M.trail; let acc = 0, j = 0; pts.push({ x: tr[0].x, y: tr[0].y, z: tr[0].z });
    for (let i = 1; i < tr.length && pts.length < N; i++) { const a = tr[i - 1], b = tr[i], d = Math.hypot(b.x - a.x, b.y - a.y); acc += d; while (acc >= SEG && pts.length < N) { acc -= SEG; const u = 1 - acc / (d || 1); pts.push({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) }); } }
    while (pts.length < N) { const l = pts[pts.length - 1]; pts.push({ x: l.x - 0.3, y: l.y, z: l.z }); }
    return pts;
  }
  function bodyParts(m, M) { const B = body(M), out = [{ key: 'head', dx: 0, dy: -M.alt, r: 1.2 }]; [3, 7, 11, 15].forEach((i, k) => { const p = B[i]; out.push({ key: 'b' + k, dx: p.x - m.x, dy: p.y - p.z - m.y, r: 1.0 - k * 0.1 }); }); return out; }
  function heartAt(m, M) { const p = body(M)[4]; return { x: p.x, y: p.y - p.z }; }
  /* ---- choosing ---- */
  function pick(FX, m, d, lv) {
    const M = FX.mem, me = FX.me, k = 1 / FX.S.fast, echoes = lv >= 4 ? 2 : 1;
    if (lv >= 2 && M.sigT <= 0) return startGrave(FX, m);
    const r = Math.random();
    if (r < 0.36) {   // breath of frozen time, then its echo
      const a = Math.atan2(me.y - m.y, me.x - m.x), wait = 0.9 * k, s = { shape: 'cone', x: m.x, y: m.y, a, len: 9, spread: 0.42, t: wait, dmg: m.dmg * 1.5, col: GHOST };
      m.act = 'breath'; m.actT = 0; M.bt = { x: m.x + Math.cos(a) * 0.5, y: m.y + Math.sin(a) * 0.5, wait }; echo(FX, s, echoes);
    } else if (r < 0.68) {   // it coils round the pet: a ring, then its echo
      const p = FX.clampArena({ x: me.x, y: me.y }, 4), wait = 1.1 * k; m.act = 'coil'; m.actT = 0; M.cl = { x: p.x, y: p.y, a0: Math.atan2(m.y - p.y, m.x - p.x), wait };
      echo(FX, { shape: 'ring', x: p.x, y: p.y, r0: 2.2, r1: 4.6, t: wait, dmg: m.dmg * 1.4, col: GHOST }, echoes);
    } else {   // a swoop along a line through the pet; its ghost follows the same way
      const a = Math.atan2(me.y - m.y, me.x - m.x), p0 = FX.clampArena({ x: me.x - Math.cos(a) * 9, y: me.y - Math.sin(a) * 9 }, 1.5), p1 = FX.clampArena({ x: me.x + Math.cos(a) * 9, y: me.y + Math.sin(a) * 9 }, 1.5), wait = 1.0 * k;
      M.sw = { x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, a: Math.atan2(p1.y - p0.y, p1.x - p0.x), wait, dur: 0.75 * k, hit: false }; m.act = 'swoop'; m.actT = 0;
      echo(FX, { shape: 'line', x: p0.x, y: p0.y, a: M.sw.a, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), w: 2.4, t: wait + 0.35 * k, dmg: m.dmg * 1.5, col: GHOST }, echoes);
    }
  }
  /* every attack strikes, and then its echo strikes again in the same place */
  function echo(FX, s, n) {
    const M = FX.mem; FX.tele(Object.assign({}, s));
    for (let i = 1; i <= n; i++) { M.sched.push({ t: s.t + 0.15 + (i - 1) * 1.05, fn: () => FX.tele(Object.assign({}, s, { t: 1.0, col: WHITE, label: 'ECHO', dmg: s.dmg * 0.85, echo: true })) }); }
  }
  /* marked moments: an hourglass where the pet stands; when the wings beat, the pet is pulled back to it */
  function placeMarks(FX, m, lv) {
    const M = FX.mem, me = FX.me, n = lv >= 3 ? 2 : 1, k = 1 / FX.S.fast; M.markT = (lv >= 4 ? 7 : 8.5) * (1 / FX.S.fast);
    for (let i = 0; i < n; i++) {
      const p = i === 0 ? { x: me.x, y: me.y } : FX.clampArena({ x: me.x + FX.rnd(-5, 5), y: me.y + FX.rnd(-5, 5) }, 2), when = (4.2 + i * 1.1) * k;
      const o = FX.obj({ kind: 'mark', x: p.x, y: p.y, r: 0.75, hp: FX.S.barHP * 0.011, life: when + 0.2, n: i + 1, when, born: FX.g.t,
        onKill: o2 => { FX.H.text(o2.x, o2.y - 1, 'Moment broken!', GHOST, 14); FX.H.sparks(o2.x, o2.y, GHOST, 16, 6); FX.H.sfx.crack && FX.H.sfx.crack(); } });
      // the strike already waiting on the mark, timed for the moment the pet arrives
      const tl = FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.8, t: when + 0.4, dmg: m.dmg * 1.6, col: GHOST, label: String(i + 1) });
      M.sched.push({ t: when, fn: () => { if (o.dead) { tl.dmg = 0; tl.col = 'rgba(159,216,255,.2)'; return; } o.dead = true; M.beat = 1; M.flare = 1; FX.H.flash(0.2, GHOST); FX.H.text(FX.me.x, FX.me.y - 1.2, 'Pulled back!', GHOST, 15); FX.teleportPet(p.x, p.y); FX.H.sfx.whoosh(); } });
    }
    FX.H.sfx.hum();
  }
  function startGrave(FX, m) {
    const M = FX.mem, C = FX.C, me = FX.me, lv = FX.S.lv, k = 1 / FX.S.fast; M.sigT = lv >= 4 ? 17 : 21; m.act = 'grave'; m.actT = 0;
    const show = 2.3 * k, each = 0.8 * k, paths = [];
    for (let i = 0; i < 3; i++) { const a = Math.atan2(me.y - C.y, me.x - C.x) + (i - 1) * 0.9 + FX.rnd(-0.3, 0.3), off = FX.rnd(-2.5, 2.5), cx = me.x + Math.cos(a + Math.PI / 2) * off * 0.3, cy = me.y + Math.sin(a + Math.PI / 2) * off * 0.3;
      const p0 = FX.clampArena({ x: cx - Math.cos(a + Math.PI / 2) * 16, y: cy - Math.sin(a + Math.PI / 2) * 16 }, 1), p1 = FX.clampArena({ x: cx + Math.cos(a + Math.PI / 2) * 16, y: cy + Math.sin(a + Math.PI / 2) * 16 }, 1);
      paths.push({ x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, a: Math.atan2(p1.y - p0.y, p1.x - p0.x) }); }
    M.gr = { show, each, paths };
    // flown backwards: path 3 first, then 2, then 1
    paths.forEach((P2, i) => FX.tele({ shape: 'line', x: P2.x0, y: P2.y0, a: P2.a, len: Math.hypot(P2.x1 - P2.x0, P2.y1 - P2.y0), w: 2.6, t: show + (2 - i + 1) * each, dmg: m.dmg * 1.8, col: GHOST }));
    FX.H.banner("TOMORROW'S GRAVE", 'Three paths are shown: it flies them in reverse, three, two, then one', GHOST, 2.8, true); FX.H.sfx.hum();
  }
  /* ---- painting ---- */
  function drawMark(c, FX, o, X, Y, T, t) {
    const left = clamp((o.life || 0) / (o.when || 4), 0, 1), p = 0.5 + 0.5 * Math.sin(t * (4 + (1 - left) * 12)), h = T * 1.3, w = T * 0.55;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.3 * p; blitSized(c, glowSprite(GHOST), X - T * 1.4, Y - h - T * 0.6, T * 2.8, T * 2.8); c.restore();
    c.save(); c.strokeStyle = 'rgba(159,216,255,.55)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(X, Y, T * 1.1, T * 0.45, 0, -Math.PI / 2, -Math.PI / 2 + TAU * left); c.stroke(); c.restore();
    // an hourglass of glass and gilt, its sand running out
    c.save(); c.translate(X, Y - h * 0.55); const fr = '#C8A860'; c.fillStyle = fr; c.fillRect(-w, -h * 0.55, w * 2, T * 0.12); c.fillRect(-w, h * 0.45, w * 2, T * 0.12);
    c.strokeStyle = 'rgba(232,246,255,.85)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-w * 0.8, -h * 0.45); c.quadraticCurveTo(-w * 0.8, -h * 0.05, 0, 0); c.quadraticCurveTo(-w * 0.8, h * 0.05, -w * 0.8, h * 0.45); c.moveTo(w * 0.8, -h * 0.45); c.quadraticCurveTo(w * 0.8, -h * 0.05, 0, 0); c.quadraticCurveTo(w * 0.8, h * 0.05, w * 0.8, h * 0.45); c.stroke();
    c.fillStyle = HOURS; c.beginPath(); c.moveTo(-w * 0.6 * left, -h * 0.45 * left); c.lineTo(w * 0.6 * left, -h * 0.45 * left); c.lineTo(0, 0); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-w * 0.7, h * 0.45); c.lineTo(w * 0.7, h * 0.45); c.lineTo(0, h * 0.45 * left); c.closePath(); c.fill();
    c.fillRect(-0.7, 0, 1.4, h * 0.45); c.restore();
    c.font = `900 ${Math.round(T * 0.55)}px ${arcFont}`; c.textAlign = 'center'; c.fillStyle = WHITE; c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 3; c.strokeText(String(o.n), X, Y - h * 1.35); c.fillText(String(o.n), X, Y - h * 1.35);
  }
  function drawDragon(c, FX, m, X, Y, T, t) {
    const K = FX.K, M = FX.mem;
    // the art sheet poses it with no trail: lay one out along its heading
    if (M.demoA != null && (!M.trail || !M.trail.length)) { M.hd = M.demoA; M.alt = M.alt || 2.2; M.trail = []; for (let i = 0; i < 90; i++) { const u = i * 0.15; M.trail.push({ x: m.x - Math.cos(M.hd) * u + Math.sin(u * 0.6) * 0.8 * Math.sin(M.hd), y: m.y - Math.sin(M.hd) * u - Math.sin(u * 0.6) * 0.8 * Math.cos(M.hd), z: M.alt + Math.sin(u * 0.4) * 0.2 }); } M.snaps = []; }
    const SX = x => X + (x - m.x) * T, SY = y => Y + (y - m.y) * T, B = body(M), P = p => [SX(p.x), SY(p.y) - p.z * T], rl = M.reel || 0;
    const wfn = i => { const u = i / (N - 1); return T * (u < 0.08 ? 0.9 + u * 6 : 1.4 * Math.pow(1 - (u - 0.08) / 0.92, 0.75) + 0.12); };
    // shadows on the dial
    c.save(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineCap = 'round'; for (let i = 0; i < N - 1; i++) { c.lineWidth = wfn(i) * 1.1; c.beginPath(); c.moveTo(SX(B[i].x), SY(B[i].y)); c.lineTo(SX(B[i + 1].x), SY(B[i + 1].y)); c.stroke(); } c.restore();
    // its echoes: where it was a moment ago, and a moment before that
    if (M.snaps) [5, 11].forEach((k, j) => { const S2 = M.snaps[k]; if (!S2) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 - j * 0.05; c.strokeStyle = GHOST; c.lineCap = 'round'; for (let i = 0; i < N - 1; i++) { c.lineWidth = wfn(i) * 1.6; c.beginPath(); c.moveTo(SX(S2[i][0]), SY(S2[i][1]) - S2[i][2] * T); c.lineTo(SX(S2[i + 1][0]), SY(S2[i + 1][1]) - S2[i + 1][2] * T); c.stroke(); } c.restore(); });
    const pts = B.map(P);
    // wings: three pairs of glassy membranes marked with the hours
    const wings = []; [3, 6, 9].forEach((i, k) => { const a = B[i], b = B[i + 1], hd = Math.atan2(a.y - b.y, a.x - b.x); for (const s of [-1, 1]) wings.push({ i, k, s, hd, far: Math.sin(hd + s * Math.PI / 2) < 0 }); });
    const wing = W => { const a = B[W.i], beat = Math.sin(t * 3.2 + W.k * 0.7) * 0.5 + (M.beat || 0) * Math.sin(t * 14) * 0.6, spread = 1.35 - W.k * 0.18 + (M.flare || 0) * 0.3, L = (3.4 - W.k * 0.6) * (1 + (M.flare || 0) * 0.15);
      const sa = W.hd + W.s * (Math.PI / 2 + 0.35), root = P(a), tip = P({ x: a.x + Math.cos(sa) * L - Math.cos(W.hd) * 1.2, y: a.y + Math.sin(sa) * L - Math.sin(W.hd) * 1.2, z: a.z + 0.6 + beat * 1.4 * spread }), mid = P({ x: a.x + Math.cos(sa) * L * 0.55 + Math.cos(W.hd) * 0.4, y: a.y + Math.sin(sa) * L * 0.55 + Math.sin(W.hd) * 0.4, z: a.z + 0.4 + beat * 0.8 });
      const trail = P({ x: a.x - Math.cos(W.hd) * 1.6 + Math.cos(sa) * L * 0.3, y: a.y - Math.sin(W.hd) * 1.6 + Math.sin(sa) * L * 0.3, z: a.z + 0.1 });
      c.save(); c.globalAlpha = W.far ? 0.42 : 0.55;
      const path = () => { c.beginPath(); c.moveTo(root[0], root[1]); c.quadraticCurveTo(mid[0], mid[1] - T * 0.3, tip[0], tip[1]); c.quadraticCurveTo((tip[0] + trail[0]) / 2 + T * 0.2, (tip[1] + trail[1]) / 2 + T * 0.4, trail[0], trail[1]); c.closePath(); };
      path(); const g = c.createLinearGradient(root[0], root[1], tip[0], tip[1]); g.addColorStop(0, 'rgba(60,90,150,.9)'); g.addColorStop(0.6, 'rgba(150,200,255,.5)'); g.addColorStop(1, 'rgba(230,246,255,.35)'); c.fillStyle = g; c.fill();
      c.clip(); c.globalCompositeOperation = 'lighter';
      // the hours etched along its trailing edge, and the bones of the wing
      c.strokeStyle = 'rgba(255,233,168,.55)'; c.lineWidth = 1; for (let h2 = 0; h2 < 12; h2++) { const u = h2 / 11, x = lerp(tip[0], trail[0], u), y = lerp(tip[1], trail[1], u), nx = lerp(mid[0], root[0], u * 0.5), ny = lerp(mid[1], root[1], u * 0.5); c.beginPath(); c.moveTo(x, y); c.lineTo(lerp(x, nx, 0.12), lerp(y, ny, 0.12)); c.stroke(); }
      c.strokeStyle = 'rgba(220,240,255,.5)'; c.lineWidth = Math.max(1, T * 0.06); c.beginPath(); c.moveTo(root[0], root[1]); c.quadraticCurveTo(mid[0], mid[1] - T * 0.3, tip[0], tip[1]); c.stroke(); for (let f = 1; f < 4; f++) { const e = [lerp(tip[0], trail[0], f / 4), lerp(tip[1], trail[1], f / 4)]; c.beginPath(); c.moveTo(mid[0], mid[1]); c.lineTo(e[0], e[1]); c.stroke(); }
      const sg = c.createLinearGradient(root[0] - T * 2, root[1], tip[0] + T * 2, tip[1]); sg.addColorStop(0, 'rgba(255,180,255,0)'); sg.addColorStop(0.5, 'rgba(160,255,240,.15)'); sg.addColorStop(1, 'rgba(255,240,160,0)'); c.fillStyle = sg; c.fillRect(Math.min(root[0], tip[0], trail[0]) - T, Math.min(root[1], tip[1], trail[1]) - T, Math.abs(tip[0] - root[0]) + T * 6, Math.abs(tip[1] - root[1]) + T * 6);
      c.restore(); };
    wings.filter(W => W.far).forEach(wing);
    // the long body, from tail to neck: scales above, a pale belly beneath, a crest of fins along the spine
    K.tube(c, pts.slice().reverse(), u => wfn(N - 1 - Math.round(u * (N - 1))), { col: SCALE, tex: 'scale', texA: 0.9, texS: 0.35, dk: '#060A18', dkA: 0.6, hi: '#CFE6FF', hiA: 0.25, rim: GHOST, rimA: 0.3,
      inner: (L, R) => { c.strokeStyle = 'rgba(143,166,200,.4)'; c.lineWidth = T * 0.35; c.beginPath(); (pts[0][1] < pts[N - 1][1] ? R : L).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); } });
    c.save(); c.fillStyle = '#9FD8FF'; for (let i = 2; i < N - 3; i += 2) { const a = pts[i], b = pts[i + 1], an = Math.atan2(b[1] - a[1], b[0] - a[0]), h = wfn(i) * 0.6; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(a[0], a[1] - wfn(i) * 0.35); c.lineTo(a[0] + Math.cos(an) * h * 0.4, a[1] - h - wfn(i) * 0.3); c.lineTo(b[0], b[1] - wfn(i) * 0.35); c.closePath(); c.fill(); } c.restore();
    // the tail ends in a fan of light, like the hand of a clock
    const te = pts[N - 1], tb = pts[N - 3], ta = Math.atan2(te[1] - tb[1], te[0] - tb[0]); c.save(); c.translate(te[0], te[1]); c.rotate(ta); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; const fg = c.createLinearGradient(0, 0, T * 2, 0); fg.addColorStop(0, GHOST); fg.addColorStop(1, 'rgba(159,216,255,0)'); c.fillStyle = fg; c.beginPath(); c.moveTo(0, 0); c.lineTo(T * 2.2, -T * 0.9); c.lineTo(T * 1.6, 0); c.lineTo(T * 2.2, T * 0.9); c.closePath(); c.fill(); c.restore();
    // its heart: an hourglass of light within the chest, bare when it falls out of time
    const hp = pts[4]; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + rl * 0.6 + 0.1 * Math.sin(t * 5); blitSized(c, glowSprite(HOURS), hp[0] - T * (1 + rl), hp[1] - T * (1 + rl), T * 2 * (1 + rl), T * 2 * (1 + rl)); c.restore();
    wings.filter(W => !W.far).forEach(wing);
    paintHead(c, K, pts[0], Math.atan2(pts[0][1] - pts[2][1], pts[0][0] - pts[2][0]), T * 1.15, M.jaw || 0, t, rl);
  }
  function paintHead(c, K, at, ang, hs, jaw, t, rl) {
    c.save(); c.translate(at[0], at[1]); c.rotate(ang); if (Math.cos(ang) < 0) c.scale(1, -1);
    // horns: two long pairs swept back like the hands of a clock
    [[-0.1, -0.45, -1.6, -1.15], [0.15, -0.4, -1.1, -1.35], [-0.2, 0.4, -1.5, 0.95]].forEach(([x0, y0, x1, y1], k) => K.tube(c, [[x0 * hs, y0 * hs], [(x0 + x1) / 2 * hs, (y0 + y1) / 2 * hs - hs * 0.15], [x1 * hs, y1 * hs]], u => hs * (0.17 - u * 0.15), { col: k === 2 ? '#3A4A6A' : '#C8D8F0', hi: '#FFFFFF', hiA: 0.45, dk: '#1A2240', dkA: 0.5 }));
    // the lower jaw
    c.save(); c.translate(hs * 0.1, hs * 0.18); c.rotate(jaw * 0.6);
    if (jaw > 0.1) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = jaw * 0.8; blitSized(c, glowSprite(GHOST), hs * 0.3, -hs * 0.7, hs * 1.6, hs * 1.2); c.restore(); }
    K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.2, 0); c.quadraticCurveTo(hs * 0.7, hs * 0.12, hs * 1.4, hs * 0.02); c.lineTo(hs * 1.35, hs * 0.15); c.quadraticCurveTo(hs * 0.6, hs * 0.35, -hs * 0.2, hs * 0.25); c.closePath(); }, hs * 0.5, hs * 0.1, hs * 0.8, { col: '#2A3A5E', hi: '#A8C0E8', tex: 'scale', texA: 0.8, texS: 0.2, spec: 0.3 });
    K.teeth(c, [0.4, 0.6, 0.8, 1.0, 1.2].map((u, i) => [hs * u, hs * 0.03, -Math.PI / 2, 0.6 + (i === 4 ? 0.5 : 0)]), hs * 0.14, '#EAF2FF');
    c.restore();
    // the skull: a long wedge, crested, with a brow of silver plates
    K.body(c, () => { c.beginPath(); c.moveTo(-hs * 0.45, -hs * 0.05); c.quadraticCurveTo(-hs * 0.3, -hs * 0.42, hs * 0.3, -hs * 0.38); c.quadraticCurveTo(hs * 1.0, -hs * 0.28, hs * 1.5, -hs * 0.05); c.quadraticCurveTo(hs * 1.55, hs * 0.1, hs * 1.4, hs * 0.16); c.quadraticCurveTo(hs * 0.6, hs * 0.22, -hs * 0.2, hs * 0.28); c.closePath(); }, hs * 0.5, -hs * 0.05, hs * 1.1,
      { col: SCALE, hi: '#B8D0F8', dk: '#0A1028', tex: 'scale', texA: 0.9, texS: 0.22, spec: 0.5, rim: GHOST, rimA: 0.35 });
    K.teeth(c, [0.5, 0.75, 1.0, 1.25].map((u, i) => [hs * u, hs * 0.18, Math.PI / 2, 0.6 + (i === 3 ? 0.6 : 0)]), hs * 0.15, '#F4F8FF');
    c.fillStyle = '#05060C'; c.beginPath(); c.ellipse(hs * 1.38, -hs * 0.02, hs * 0.05, hs * 0.03, 0.2, 0, TAU); c.fill();
    // the eye: a clock-face iris, its hand turning
    const ex = hs * 0.45, ey = -hs * 0.16; K.eyeR(c, ex, ey, hs * 0.13, GHOST, { white: '#1A2240', irisK: 0.9, ry: 0.75 }); c.save(); c.strokeStyle = '#05060C'; c.lineWidth = Math.max(1, hs * 0.025); c.beginPath(); c.moveTo(ex, ey); c.lineTo(ex + Math.cos(t * 2) * hs * 0.1, ey + Math.sin(t * 2) * hs * 0.08); c.stroke(); c.restore(); K.glow(c, ex, ey, hs * (0.45 + rl * 0.3), GHOST, 0.6);
    c.restore();
  }
})();
