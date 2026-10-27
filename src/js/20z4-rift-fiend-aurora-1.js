/* ---------- THUL THE RIME COCOON ----------
   The Pale Aurora's first boss, in the Sheltered Ice Cave: a 26 m bowl of dark glacier ice under a cracked ceiling,
   snow blown in from the cave mouth to the north and lying in broad smooth drifts round the walls, and two great
   windbreak pillars of ice-sheathed stone standing in it. The wind comes from the mouth; whatever stands in a
   windbreak's lee (drawn green when it matters) is sheltered from what the wind carries.
   PHASE A, the Cocoon: a four-metre white oval hung from the knot of three black root-like legs, long, angular and
   unequal, so it walks in an unsettling tripod gait, one leg at a time, the cocoon swinging under them. Five thick navy
   seams run down it; through the lowest opening one green eye darts about. Ice Collar: it lowers itself and scrapes the
   cocoon on the floor, a collar of frost spikes growing round its base, then lets it go as an expanding ring with two
   broad gaps (stand in one); shatter the collar before it goes and the cocoon topples (STUN: its eye bare). Cocoon
   Hail: three patches marked; the hail rides the wind, so the lee of a pillar is safe. Root Stomp when close.
   At half health it drives at the windbreak nearer the pet and marks it: shelter behind the other before the great
   hail falls; the pillar's rubble settles into a new low windbreak (only one pillar is ever threatened).
   PHASE B, the Hatch: the impact cracked it. The cocoon splits, its shell flies apart, and out unfolds a giant rime
   wasp, banded white and navy, with green compound eyes, a stinger tail longer than its whole body, and four broad
   butterfly wings of aurora light that beat and glow. Stinger Impale lunges down a shown lane; if it misses, the
   stinger drives into the ice and sticks there (STUN: its glowing sting-root bare). Tail Sweep scythes an arc; Aurora
   Gale beats a frost gale from the cave's edge (shelter in a windbreak's lee, the lees drawn from where it blows);
   Rime Dive plunges from above. Rime scuttlers crawl from the shell and veil rays drift in.
   It is never still: legs step and re-plant, the cocoon swings and twists, the frost collar builds, the eye darts and
   blinks; once hatched the wings beat and glow, the body bobs, the stinger curls and trembles, poised. It recoils when
   struck. */
RiftFiend.define({ id: 'thul', name: 'Thul', title: 'The Rime Cocoon', color: '#E4EDF0', glow: '#78D7B2', accent: '#B8F5DA', biome: 'glacier', r: 2.2, els: ['ice', 'wind'] }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, tubeLite = TN.tubeLite;
  const { INK, SNOW, NAVY, ICE, ICE_HI, GREEN, GREEN_HI } = AUR;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const lerpA = (a, b, u) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * u; };
  const easeOut = u => 1 - Math.pow(1 - clamp(u, 0, 1), 3), easeBack = u => { u = clamp(u, 0, 1); const s = 1.7; return 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2); };
  // the painter's palette
  const NAVY_DK = '#0C1830', NAVY_HI = '#33507E', SNOW_SH = '#A6C0D2', SNOW_HI = '#FFFFFF', ROOT = '#151B28', ROOT_SH = '#070A12', ROOT_HI = '#3C4C6C', WARN = '#FF8A6E', ICE_SH = '#4F7FA0';
  /* the cave: 26 m across; two windbreak pillars (2 m thick, 4.4 m tall); the wind from the mouth (north) */
  const AR = 13, PILR = 1.0, PH = 4.4, LEE_P = 5.4, LEE_W = 3.6, WIND = Math.PI / 2;
  const PILLARS = C => [{ x: C.x - 5, y: C.y - 2 }, { x: C.x + 5, y: C.y - 2 }];
  /* the cocoon: half sizes (across, along), the stalk under the legs' knot; the legs (asymmetric): their angle about the
     heading, foot reach, knee (out, up) and ankle (out, up) */
  const RX = 1.32, RZ = 2.05, STALK = 0.45, APEX = 5.7;
  const LEGS = [{ a: 1.15, r: 3.3, kr: 2.2, kz: 6.6, ar: 3.15, az: 2.4 }, { a: 3.2, r: 2.8, kr: 1.7, kz: 5.9, ar: 2.75, az: 1.9 }, { a: 5.05, r: 3.6, kr: 2.5, kz: 7.1, ar: 3.4, az: 2.7 }];
  /* the wasp's wings (span s outward, chord c forward, metres) */
  const FW = [[0, 0.22], [0.5, 0.62], [1.2, 0.98], [2.0, 1.18], [2.75, 1.05], [3.1, 0.55], [2.95, -0.05], [2.45, -0.5], [1.75, -0.68], [1.0, -0.55], [0.4, -0.25], [0.02, -0.05]];
  let CRK = null;
  const HW = [[0, -0.05], [0.6, -0.18], [1.4, -0.35], [2.1, -0.72], [2.25, -1.18], [1.95, -1.5], [1.85, -2.25], [1.5, -1.65], [1.0, -1.38], [0.5, -0.92], [0.1, -0.42]];
  return {
    arenaR: AR, firstAct: 'shuffle', artY: 0.66, ambient: 'snow',
    artPoses: [{ name: 'the cocoon on its three legs', mem: {} }, { name: 'scraping: the frost collar built', mem: { scrape: 1, collar: 1 } }, { name: 'toppled: the eye bare', mem: { topple: 1 } }, { name: 'hatched: wings of aurora', mem: { hatched: true, em: 1 } }, { name: 'the stinger stuck in the ice', mem: { hatched: true, em: 1, stuck: 1, tA: -3, tP: 0.6, pitch: 0.35 } }],
    phaseNames: ['The Sheltered Ice Cave', 'The Windbreak Breaks', 'The Hatching', 'The Hatching'],
    carve(set, C) { PILLARS(C).forEach(p => { for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) set(Math.floor(p.x) + dx, Math.floor(p.y) + dy, T_SOLID); }); },
    props(C) { return PILLARS(C).map((p, i) => ({ kind: 'pillar', i, x: p.x, y: p.y + 1.05, px: p.x, py: p.y })); },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T) { paintCave(c, W, H, t, cam, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.noTouch = true; m.x = C.x; m.y = C.y - 4.2; m.act = 'enter';
      const wb = PILLARS(C).map((p, i) => ({ kind: 'pillar', i, x: p.x, y: p.y, r: PILR, alive: true, crack: 0, mark: 0, k: 1, half: 2.0, th: 0.5, fall: 0 }));
      FX.S.props.forEach(p => { if (p.kind === 'pillar') p.wb = wb[p.i]; });
      Object.assign(M, { bt: 0, hd: Math.PI / 2, hdTo: Math.PI / 2, look: [0, 0], lookTo: [0, 0], lookT: 0.5, blink: 0, blinkT: 2.5, eye: 0.55, menace: 0, recoil: 0, roar: 0, hitK: 0,
        apex: 11, apexTo: APEX, shx: 0, shy: 0, swx: 0, swy: 0, svx: 0, svy: 0, yaw: 0, collar: 0, scrape: 0, crack: 0, topple: 0, pulse: 0, feet: null, step: null, stepT: 0, fidT: 2, stomp: null, vx: 0, vy: 0, pvx: 0, pvy: 0, spd: 0, px: m.x, py: m.y,
        hatched: false, em: 0, alt: 2.6, altTo: 2.6, pitch: 0, roll: 0, beat: 0, flapF: 0.5, flapH: 0.4, glow: 0.5, tA: 3.9, tP: 1.35, tpsi: Math.PI, gcurl: 0.3, jaw: 0, stuck: 0, span: 1, orb: null, odir: 1,
        wb, hail: null, hailFx: [], wave: null, collarObj: null, cl: null, lg: null, sw: null, gale: null, dv: null, ram: null, hatch: null, shards: [], debris: [], cracks: null, stuckAt: null,
        seen: {}, last: null, nextAct: null, broodT: 10, leeK: 0, leeSrc: { a: WIND }, wasStun: false, wasEnter: true, roared: false, stunKind: null, landed: [0, 0, 0] });
      M.feet = LEGS.map((L, i) => { const p = restFoot(m, M, i); return [p[0], p[1], 3]; }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.topple = Math.min(M.topple, 0.3); M.roar = 1; M.menace = 1; M.recoil = 0.6;
      FX.H.shake(10, 0.5); FX.H.flash(0.2, GREEN_HI); FX.H.sfx.crash(); FX.H.ring(m.x, m.y, 0.5, 8, 0.9, GREEN_HI, 0.4);
      if (!M.hatched) startRam(FX, m); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, P = FX.S.lv, fast = (1 + (P - 1) * 0.08) * FX.S.fast; m.actT += dt; m.noTouch = true;
      let menace = 0; M.hdTo = FX.angPet(m.x, m.y);
      switch (m.act) {
        case 'shuffle': { const a = Math.atan2(m.y - me.y, m.x - me.x), R = 4.6 + Math.sin(m.t * 0.5) * 0.8, p = FX.clampArena({ x: me.x + Math.cos(a + 0.25 * M.odir) * R, y: me.y + Math.sin(a + 0.25 * M.odir) * R }, 3.2); walk(FX, m, M, p.x, p.y, 1.7 * fast, dt); menace = 0.2;
          if (m.actT > 2.0 / FX.S.fast) { m.actT = 0; if (Math.random() < 0.3) M.odir = -M.odir; chooseA(FX, m); } break; }
        case 'collar': menace = collarStep(FX, m, M, dt, fast); break;
        case 'hail': menace = hailStep(FX, m, M, dt, fast); break;
        case 'stomp': menace = stompStep(FX, m, M, dt, fast); break;
        case 'ram': case 'hatch': menace = 1; break;   // (their timelines run in update: they go on through the phase roar)
        case 'hover': { hover(FX, m, M, dt, fast); menace = 0.3;
          if (P >= 2 && (M.broodT -= dt) <= 0) { M.broodT = 15; const n = FX.H.mons.filter(q => !q.dead && !q.boss && !q.fobj && (q.type === 'veilray' || q.type === 'rimescuttler' || q.type === 'frostlantern')).length; if (n < 3) { callMinion(FX, m, 'veilray'); if (n < 2) callMinion(FX, m, 'rimescuttler'); FX.H.text(me.x, me.y - 2, 'The brood drifts in', ICE_HI, 13); } }
          if (m.actT > 1.5 / FX.S.fast) { m.actT = 0; if (Math.random() < 0.35) M.odir = -M.odir; chooseB(FX, m); } break; }
        case 'lunge': menace = lungeStep(FX, m, M, dt, fast); break;
        case 'sweep': menace = sweepStep(FX, m, M, dt, fast); break;
        case 'gale': menace = galeStep(FX, m, M, dt, fast); break;
        case 'dive': menace = diveStep(FX, m, M, dt, fast); break;
        default: toIdle(m, M);
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 3);
      FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.menace = decay(M.menace, dt, 4); m.noTouch = true;
      if (M.stunKind === 'stuck') { const p = stingRoot(m, M); FX.weak('sting', p[0], p[1] - p[2], 1.3, 2.4, m.stunT > 0.05);
        // stuck fast: it wrenches at the stinger, wings thrashing, ice spitting from round the tip
        M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.2; const q = M.stuckAt; if (q) FX.H.sparks(q[0] + FX.rnd(-0.3, 0.3), q[1], ICE_HI, 4, 4); if (Math.random() < 0.3) { FX.H.shake(1.5, 0.08); FX.H.sfx.thud(); } } }
      else { const p = eyeAt(m, M); FX.weak('eye', p[0], p[1] - p[2], 1.2, 2.4, m.stunT > 0.05);
        M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.25; FX.H.part({ kind: 'snow', x: m.x + FX.rnd(-2, 2), y: m.y + FX.rnd(-0.5, 0.8), vx: FX.rnd(-0.5, 0.5), vy: -1, life: 0.6, max: 0.6, size: 2 }); if (Math.random() < 0.2) FX.H.shake(1.2, 0.08); } }
      FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m) return; M.bt += dt; const stun = m.stunT > 0;
      if (!stun) { if (FX.S.weak.eye) FX.weak('eye', 0, 0, 0, 0, false); if (FX.S.weak.sting) FX.weak('sting', 0, 0, 0, 0, false);
        if (M.wasStun) { M.wasStun = false; M.recoil = 0.8; M.roar = 0.6; if (M.stunKind === 'stuck') { FX.H.text(m.x, m.y - 4, 'It wrenches the stinger free', GREEN_HI, 13); FX.H.sparks(M.stuckAt ? M.stuckAt[0] : m.x, M.stuckAt ? M.stuckAt[1] : m.y, ICE_HI, 14, 6); FX.H.sfx.crack(); M.stuckAt = null; } else { FX.H.text(m.x, m.y - 4, 'It hauls itself upright', ICE_HI, 13); FX.H.sfx.thud(); } M.stunKind = null; } }
      else M.wasStun = true;
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.4); M.hitK = decay(M.hitK, dt, 4); M.pulse = decay(M.pulse, dt, 1.6);
      // the entrance: it lowers itself out of the dark on its three legs, plants them one by one, and the eye snaps open
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.apexTo = APEX + Math.max(0, 1.6 - e) * 3.4; [0.9, 1.25, 1.6].forEach((at, i) => { if (e > at && !M.landed[i]) { M.landed[i] = 1; M.feet[i][2] = 0; FX.H.shake(4, 0.15); FX.H.sfx.thud(); FX.H.sparks(M.feet[i][0], M.feet[i][1], ICE_HI, 8, 4); } else if (!M.landed[i]) M.feet[i][2] = Math.max(0, 2.2 - e * 1.6); });
        if (e > 1.9 && !M.roared) { M.roared = true; M.roar = 1; M.eye = 1; FX.H.sfx.crash(); FX.H.shake(9, 0.4); FX.H.ring(m.x, m.y, 0.3, 7, 1, GREEN_HI, 0.4); FX.H.sparks(m.x, m.y - 3, ICE_HI, 18, 7); } }
      else if (M.wasEnter) { M.wasEnter = false; M.landed = [1, 1, 1]; M.feet.forEach(f => f[2] = 0); M.recoil = 0.6; FX.H.sfx.whoosh(); }
      if (m.act === 'ram') ramStep(FX, m, M, dt); else if (m.act === 'hatch') hatchStep(FX, m, M, dt);
      if (!M.hatched) updCocoon(FX, m, M, dt, stun); else updWasp(FX, m, M, dt, stun);
      // the windbreaks: a marked pillar's cracks, a fallen one's rubble settling
      M.wb.forEach(w => { if (w.kind === 'wall') w.k = Math.min(1, w.k + dt / 0.9); });
      updHail(FX, m, M, dt); updWave(FX, m, M, dt); updShards(FX, M, dt);
      const leeOn = !!(M.hail && !M.hail.done) || !!(M.gale && M.gale.blowing !== false && M.gale.age < M.gale.end) || m.act === 'ram'; M.leeK = toward(M.leeK, leeOn ? 1 : 0, dt, leeOn ? 6 : 3); },
    dmgK(FX, m) { const M = FX.mem; if (M) { M.recoil = Math.max(M.recoil || 0, 0.35); M.hitK = 1; } return m.act === 'ram' || m.act === 'hatch' ? 0.3 : 1; },
    // the camera: drawn toward the creature's body (high over its feet), never so far the pet leaves the screen; the hatch
    // framed closer
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.wb || m.dead || m.act === 'enter') return null; const hatch = m.act === 'hatch' || (M.hatch && M.em < 1), x = m.x, y = m.y - (hatch ? 2.6 : M.hatched ? Math.min(4, M.alt) * 0.6 : 2.2), d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(hatch ? 0.62 : 0.38, (hatch ? 4.2 : 3.2) / d), zoom: hatch ? 0.6 : undefined }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { const M = FX.mem; Y += (m.z || 0) * T * 4; if (M.hatched) drawWasp(c, FX, m, X, Y, T, t); else drawCocoonBoss(c, FX, m, X, Y, T, t); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'pillar') drawWindbreak(c, FX, p, T, t); else if (p.kind === 'husk') drawHusk(c, FX, p, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'collar') { const k = 0.6 + 0.4 * Math.sin(t * 9); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(ICE_HI, 0.35 + 0.3 * k); c.lineWidth = Math.max(2, T * 0.08); c.setLineDash([T * 0.3, T * 0.2]); c.lineDashOffset = -t * T * 2; c.beginPath(); c.ellipse(X, Y, o.r * T * 1.1, o.r * T * 0.45, 0, 0, TAU); c.stroke(); c.restore(); } },
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.0 : 1.1, true); }
  function toIdle(m, M) { m.act = M.hatched ? 'hover' : 'shuffle'; m.actT = 0; M.cl = null; M.lg = null; M.sw = null; M.gale = null; M.dv = null; M.stomp = null; }
  function clearActs(FX, m, M) { if (M.collarObj && !M.collarObj.dead) M.collarObj.dead = true; M.collarObj = null; M.cl = null; M.lg = null; M.sw = null; M.gale = null; M.dv = null; M.stomp = null; if (M.hail) M.hail.done = true; M.hail = null; M.wave = null; FX.S.tele.length = 0; }
  /* ---- shelter: a windbreak's lee is the ground behind it, away from where the wind (a direction, or a point it blows
     from) comes; the hail and the gale do not reach into it ---- */
  function leeDir(w, src) { if (src.a != null) return [Math.cos(src.a), Math.sin(src.a)]; const dx = w.x - src.x, dy = w.y - src.y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }
  function leePoly(w, src) { const [dx, dy] = leeDir(w, src), nx = -dy, ny = dx;
    if (w.kind === 'pillar') { const r = w.r, L = LEE_P; return [[w.x + nx * r, w.y + ny * r], [w.x + nx * r * 0.82 + dx * L, w.y + ny * r * 0.82 + dy * L], [w.x - nx * r * 0.82 + dx * L, w.y - ny * r * 0.82 + dy * L], [w.x - nx * r, w.y - ny * r]]; }
    // a low wall: its two corners widest across the wind, run out downwind
    const cs = [[w.x - w.half, w.y - w.th], [w.x + w.half, w.y - w.th], [w.x + w.half, w.y + w.th], [w.x - w.half, w.y + w.th]], pr = q => q[0] * nx + q[1] * ny, al = q => q[0] * dx + q[1] * dy;
    let lo = cs[0], hi = cs[0]; cs.forEach(q => { if (pr(q) < pr(lo)) lo = q; if (pr(q) > pr(hi)) hi = q; }); const mid = Math.max(...cs.map(al)) - (al(lo) + al(hi)) / 2, L = LEE_W * w.k;
    const a = [lo[0] + dx * mid * 0.5, lo[1] + dy * mid * 0.5], b = [hi[0] + dx * mid * 0.5, hi[1] + dy * mid * 0.5];
    return [a, b, [b[0] + dx * L, b[1] + dy * L], [a[0] + dx * L, a[1] + dy * L]]; }
  function inPoly(P, x, y) { let inside = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi) inside = !inside; } return inside; }
  function shelters(M, except) { return M.wb.filter(w => w.alive && w !== except && (w.kind === 'pillar' || w.k > 0.8)); }
  function sheltered(M, x, y, src, except) { return shelters(M, except).some(w => inPoly(leePoly(w, src), x, y)); }
  /* ---- walking on three legs (the cocoon): it steers its knot toward a point, slowly, keeping clear of the pillars ---- */
  function walk(FX, m, M, tx, ty, spd, dt) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), v = Math.min(spd, d * 1.6), wx = d > 0.01 ? dx / d * v : 0, wy = d > 0.01 ? dy / d * v : 0;
    M.vx = toward(M.vx, wx, dt, 2.5); M.vy = toward(M.vy, wy, dt, 2.5); m.x += M.vx * dt; m.y += M.vy * dt; keepClear(FX, m, M); }
  function keepClear(FX, m, M) { const q = FX.clampArena(m, 3.0); m.x = q.x; m.y = q.y; M.wb.forEach(w => { if (!w.alive) return; const dx = m.x - w.x, dy = m.y - w.y, d = Math.hypot(dx, dy) || 1, R = w.kind === 'pillar' ? 2.6 : 2.4; if (d < R) { m.x = w.x + dx / d * R; m.y = w.y + dy / d * R; } }); }
  function restFoot(m, M, i) { const L = LEGS[i], a = (M.hd == null ? Math.PI / 2 : M.hd) + L.a, r = L.r * (1 + (M.scrape || 0) * 0.14 + (M.topple || 0) * 0.2); return [m.x + Math.cos(a) * r, m.y + Math.sin(a) * r]; }
  /* ---- choosing (the cocoon) ---- */
  function chooseA(FX, m) { const M = FX.mem, d = FX.dist(m.x, m.y); let k = M.nextAct; M.nextAct = null;
    if (!k && d < 4.8 && M.last !== 'stomp' && Math.random() < 0.45) k = 'stomp';
    if (!k) k = M.last === 'collar' ? 'hail' : M.last === 'hail' ? 'collar' : (Math.random() < 0.5 ? 'collar' : 'hail');
    M.last = k; if (k === 'collar') startCollar(FX, m); else if (k === 'hail') startHail(FX, m); else startStomp(FX, m); }
  /* ---- Ice Collar: it lowers itself and scrapes the cocoon round on the floor; frost builds in a collar of spikes round
     its base (the collar can be shattered: it topples), then bursts out as a ring with two broad gaps ---- */
  function startCollar(FX, m) { const M = FX.mem, P = FX.S.lv, build = (P >= 3 ? 2.2 : 2.6) / FX.S.fast, a0 = FX.angPet(m.x, m.y) + (Math.random() < 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.6), gaps = [[a0, 0.5], [a0 + Math.PI * (0.85 + Math.random() * 0.3), 0.46]];
    M.cl = { age: 0, build, gaps, tele: null, let: false }; m.act = 'collar'; m.actT = 0; M.collar = 0; FX.H.sfx.hum();
    M.cl.tele = FX.tele({ shape: 'ring', x: m.x, y: m.y, r0: 1.8, r1: 10, gaps, t: build + 0.75 / FX.S.fast, dmg: 0, col: ICE_HI, tick: (dt, s) => { if (!s.done && FX.m) { s.x = FX.m.x; s.y = FX.m.y; } }, fn: s => releaseCollar(FX, s) });
    const b = cocoonGeo(m, M).bot; M.collarObj = FX.obj({ kind: 'collar', x: b[0], y: b[1] - Math.max(0, b[2]) + 0.4, r: 1.5, hp: FX.S.barHP * 0.035, onHit: () => { M.recoil = Math.max(M.recoil, 0.25); FX.H.sparks(m.x, m.y, ICE_HI, 3, 3); }, onKill: () => { M.collarObj = null; if (FX.m && !FX.m.dead && M.cl) topple(FX, FX.m); } });
    say(FX, 'collar', 'ICE COLLAR', 'Frost builds round its base, then bursts out in a ring: stand in a gap, or shatter the collar first', ICE_HI); }
  function collarStep(FX, m, M, dt, fast) { const Cl = M.cl; if (!Cl) { toIdle(m, M); return 0; } Cl.age += dt; M.collar = Math.min(1, Cl.age / Cl.build);
    const o = M.collarObj; if (o && !o.dead) { const b = cocoonGeo(m, M).bot; o.x = b[0]; o.y = b[1] - Math.max(0, b[2]) + 0.4; }
    if (Math.random() < dt * 14) FX.H.part({ kind: 'snow', x: m.x + FX.rnd(-1.2, 1.2), y: m.y + FX.rnd(-0.2, 0.6), vx: FX.rnd(-2, 2), vy: FX.rnd(-1.5, 0.2), life: 0.5, max: 0.5, size: 2 + Math.random() * 2 });
    if (Math.random() < dt * 5) FX.H.sparks(m.x + FX.rnd(-1, 1), m.y + 0.3, ICE_HI, 2, 3);
    if (Cl.let && Cl.age > Cl.build + 1.4) { M.cl = null; toIdle(m, M); }
    return Cl.age < Cl.build ? 0.8 : 1; }
  function releaseCollar(FX, s) { const M = FX.mem, m = FX.m; if (!m || m.dead || !M.cl) return; M.cl.let = true; if (M.collarObj && !M.collarObj.dead) M.collarObj.dead = true; M.collarObj = null;
    M.wave = { x: s.x, y: s.y, r: 1.8, v: 12 * FX.S.fast, max: 10.2, gaps: s.gaps, hit: false, dmg: m.dmg * 1.4 }; M.collar = 0; M.roar = Math.max(M.roar, 0.5); M.recoil = 0.5; M.pulse = 1;
    FX.H.shake(10, 0.4); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.flash(0.06, ICE_HI); FX.H.ring(s.x, s.y, 1.2, 4, 0.3, ICE_HI, 0.4);
    for (let k = 0; k < 14; k++) { const a = k / 14 * TAU; FX.H.part({ kind: 'shard', x: s.x + Math.cos(a) * 1.4, y: s.y + Math.sin(a) * 0.9, vx: Math.cos(a) * 6, vy: Math.sin(a) * 4 - 2, g: 9, life: 0.6, max: 0.6, size: 4, rot: a, vr: 6, color: ICE_HI }); } }
  function updWave(FX, m, M, dt) { const W = M.wave; if (!W) return; const me = FX.me; W.r += W.v * dt;
    if (!W.hit) { const d = Math.hypot(me.x - W.x, me.y - W.y), a = Math.atan2(me.y - W.y, me.x - W.x), inGap = W.gaps.some(([g, w]) => Math.abs(FX.K.angTo(g, a)) < w);
      if (Math.abs(d - W.r) < 0.55 + me.r && !inGap && !me.dodge) { W.hit = true; FX.hurt(W.dmg); FX.H.sparks(me.x, me.y, ICE_HI, 10, 5); } }
    if (Math.random() < dt * 30) { const a = Math.random() * TAU; if (!W.gaps.some(([g, w]) => Math.abs(FX.K.angTo(g, a)) < w)) FX.H.sparks(W.x + Math.cos(a) * W.r, W.y + Math.sin(a) * W.r, ICE_HI, 1, 3); }
    if (W.r > W.max) M.wave = null; }
  /* the collar shattered: the cocoon topples onto its side, its eye bare */
  function topple(FX, m) { const M = FX.mem; m.stunT = 5; M.stunKind = 'topple'; m.act = 'shuffle'; m.actT = 0; const s = M.cl && M.cl.tele; if (s) { const i = FX.S.tele.indexOf(s); if (i >= 0) FX.S.tele.splice(i, 1); } M.cl = null; M.collar = 0; M.roar = 0.6; M.eye = 1;
    FX.H.banner('THE COLLAR SHATTERS', 'Thul topples onto its side: strike the bare eye!', GREEN_HI, 2.2, true); FX.H.shake(12, 0.5); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.flash(0.18, ICE_HI);
    FX.H.boom(m.x, m.y, 1.8, ICE_HI, '#FFFFFF', { n: 22, shake: 10 }); for (let k = 0; k < 12; k++) FX.H.part({ kind: 'shard', x: m.x + FX.rnd(-1, 1), y: m.y, vx: FX.rnd(-5, 5), vy: FX.rnd(-6, -1), g: 9, life: 0.8, max: 0.8, size: 5, rot: Math.random() * 3, vr: 7, color: ICE_HI }); }
  /* ---- Cocoon Hail: it shudders and flings hail into the wind; three patches marked, the hail lands there, except in a
     windbreak's lee ---- */
  function startHail(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv, wait = (P >= 3 ? 1.7 : 1.95) / FX.S.fast, a = WIND + FX.rnd(-0.32, 0.32), src = { a };
    const patches = [{ x: me.x, y: me.y, r: 3.1 }]; for (let k = 0; k < 2; k++) { let q = null; for (let tries = 0; tries < 12; tries++) { const aa = Math.random() * TAU, dd = 4.5 + Math.random() * 5, p = FX.clampArena({ x: me.x + Math.cos(aa) * dd, y: me.y + Math.sin(aa) * dd }, 2); if (patches.every(o => Math.hypot(o.x - p.x, o.y - p.y) > 4.2)) { q = p; break; } } if (q) patches.push({ x: q.x, y: q.y, r: 2.8 }); }
    M.hail = { age: 0, wait, src, patches, all: false, done: false, safeOnly: null }; M.leeSrc = src; m.act = 'hail'; m.actT = 0; FX.H.sfx.hum();
    FX.tele({ shape: 'fn', x: me.x, y: me.y, test: (x, y, rr) => patches.some(o => Math.hypot(x - o.x, y - o.y) < o.r + rr * 0.5) && !sheltered(M, x, y, src), t: wait, dmg: m.dmg * 1.35, col: ICE_HI, fn: () => hailLands(FX) });
    say(FX, 'hail', 'COCOON HAIL', 'Hail rides the wind onto the marked patches: shelter in a windbreak\'s lee', ICE_HI); }
  function hailStep(FX, m, M, dt, fast) { const Hl = M.hail; if (!Hl) { toIdle(m, M); return 0; } walk(FX, m, M, m.x, m.y, 1, dt); M.pulse = Math.max(M.pulse, Hl.age < 0.6 ? Hl.age / 0.6 : 0.4);
    if (Hl.done && Hl.age > Hl.wait + 0.7) { M.hail = null; toIdle(m, M); } return Hl.done ? 0.2 : 0.9; }
  function hailLands(FX) { const M = FX.mem, Hl = M.hail; if (!Hl) return; Hl.done = true; FX.H.shake(7, 0.4); FX.H.sfx.crash(); FX.H.sfx.crack();
    (Hl.all ? [] : Hl.patches).forEach(o => { FX.H.ring(o.x, o.y, 0.3, o.r, 0.3, ICE_HI, 0.3); for (let k = 0; k < 6; k++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * o.r; if (!sheltered(M, o.x + Math.cos(a) * d, o.y + Math.sin(a) * d, Hl.src)) FX.H.sparks(o.x + Math.cos(a) * d, o.y + Math.sin(a) * d, ICE_HI, 3, 3); } }); }
  // the falling hail itself (for the eye): stones come down slanted with the wind, in the patches; those over a lee
  // strike the windbreak instead
  function updHail(FX, m, M, dt) { const Hl = M.hail, L = M.hailFx; for (let i = L.length - 1; i >= 0; i--) { L[i].t += dt; if (L[i].t > L[i].d + 0.25) L.splice(i, 1); }
    if (!Hl) return; Hl.age += dt; const left = Hl.wait - Hl.age; if (left > 0.75 || Hl.age > Hl.wait + 0.35) return;
    const n = Math.min(10, Math.floor(dt * (Hl.all ? 160 : 90) + Math.random()));
    for (let k = 0; k < n; k++) { let x, y; if (Hl.all) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * (AR - 0.6); x = FX.C.x + Math.cos(a) * d; y = FX.C.y + Math.sin(a) * d; } else { const o = Hl.patches[Math.floor(Math.random() * Hl.patches.length)], a = Math.random() * TAU, d = Math.sqrt(Math.random()) * o.r; x = o.x + Math.cos(a) * d; y = o.y + Math.sin(a) * d; }
      const shel = Hl.all ? (Hl.safe && inPoly(leePoly(Hl.safe, Hl.src), x, y)) : sheltered(M, x, y, Hl.src); L.push({ x, y, a: Hl.src.a, t: 0, d: 0.32 + Math.random() * 0.12, cut: shel ? 0.45 : 0 }); } }
  /* ---- Root Stomp: the leg nearest the pet rises high over it and drives down ---- */
  function startStomp(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv; const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy) || 1, reach = Math.min(d, 4.4), tx = m.x + dx / d * reach, ty = m.y + dy / d * reach;
    let best = 0, bd = 1e9; for (let i = 0; i < 3; i++) { const f = M.feet[i], q = Math.hypot(f[0] - tx, f[1] - ty); if (q < bd) { bd = q; best = i; } }
    const wait = (P >= 3 ? 0.7 : 0.82) / FX.S.fast; M.stomp = { i: best, x: tx, y: ty, age: 0, wait, from: M.feet[best].slice(), done: false }; M.step = null; m.act = 'stomp'; m.actT = 0;
    FX.tele({ shape: 'circle', x: tx, y: ty, r: 1.8, t: wait, dmg: m.dmg * 1.2, col: ICE_HI, fn: s => { M.stomp && (M.stomp.done = true); FX.H.boom(s.x, s.y, 1.6, ICE_HI, '#FFFFFF', { n: 14, shake: 8 }); FX.H.sfx.thud(); FX.H.sfx.crash(); M.recoil = 0.4; } });
    say(FX, 'stomp', 'ROOT STOMP', 'A black leg rises over you: step out from under it', ICE_HI); }
  function stompStep(FX, m, M, dt) { const S = M.stomp; if (!S) { toIdle(m, M); return 0; } S.age += dt; const f = M.feet[S.i], u = clamp(S.age / S.wait, 0, 1);
    if (!S.done) { const up = u < 0.75 ? easeOut(u / 0.75) : 1 - (u - 0.75) / 0.25; f[0] = lerp(S.from[0], S.x, easeOut(u)); f[1] = lerp(S.from[1], S.y, easeOut(u)); f[2] = Math.max(0, up * 3.0); M.shx = toward(M.shx, -(S.x - m.x) * 0.08, dt, 4); }
    else { f[0] = S.x; f[1] = S.y; f[2] = 0; }
    if (S.age > S.wait + 0.5) { M.stomp = null; toIdle(m, M); } return 1; }
  /* ---- at half health: it drives at one windbreak (the one nearer the pet) and marks it; the great hail falls on the
     whole cave but the other's lee, as the pillar shatters into a low wall of rubble; the blow has cracked the cocoon ---- */
  function startRam(FX, m) { const M = FX.mem, me = FX.me, live = M.wb.filter(w => w.alive && w.kind === 'pillar'); if (live.length < 2) { startHatch(FX, m); return; }
    const tgt = live.slice().sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0], safe = live.find(w => w !== tgt), src = { a: WIND };
    M.ram = { age: 0, w: tgt, safe, hit: false, at: null }; tgt.mark = 1; m.act = 'ram'; m.actT = 0; M.leeSrc = src;
    M.hail = { age: 0, wait: 5.2, src, patches: [], all: true, safe, done: false };
    FX.tele({ shape: 'fn', x: safe.x, y: safe.y, test: (x, y) => FX.inArena(x, y, 0) && !inPoly(leePoly(safe, src), x, y), t: 5.2, dmg: m.dmg * 1.5, col: ICE_HI, fn: () => hailLands(FX) });
    FX.H.banner('THE WINDBREAK BREAKS', 'Thul drives at the marked pillar: shelter behind the other one before the great hail', WARN, 2.8, true); }
  function ramStep(FX, m, M, dt) { const R = M.ram; if (!R) { startHatch(FX, m); return; } R.age += dt; const w = R.w, C = FX.C, dx = C.x - w.x, dy = C.y - w.y, d = Math.hypot(dx, dy) || 1;
    M.hdTo = Math.atan2(w.y - m.y, w.x - m.x); w.crack = Math.min(1, R.age / 4.1);
    if (R.age < 3.7) { walk(FX, m, M, w.x + dx / d * 3.4, w.y + dy / d * 3.4 + 0.6, 3.2, dt); M.swx = toward(M.swx, -Math.sign(w.x - m.x) * 0.35 * Math.min(1, R.age / 2), dt, 3); }
    else if (!R.hit) { const tx = w.x + dx / d * 2.2, ty = w.y + dy / d * 2.2 + 0.4; m.x = toward(m.x, tx, dt, 10); m.y = toward(m.y, ty, dt, 10); M.swx = toward(M.swx, Math.sign(w.x - m.x) * 0.6, dt, 14);
      if (R.age > 4.1) { R.hit = true; breakPillar(FX, w); M.crack = 0.3; M.recoil = 1; M.svx -= Math.sign(w.x - m.x) * 3; } }
    if (R.age > 5.9) { M.ram = null; startHatch(FX, m); } }
  function breakPillar(FX, w) { const M = FX.mem, G = FX.H.M, set = (x, y, t) => { if (x >= 0 && y >= 0 && x < G.MW && y < G.MH) G.G[y * G.MW + x] = t; }, px = Math.floor(w.x), py = Math.floor(w.y);
    // the pillar's two rows of floor become one row of rubble four wide
    set(px - 1, py - 1, T_FLOOR); set(px, py - 1, T_FLOOR); for (let x = px - 2; x <= px + 1; x++) set(x, py, T_SOLID);
    w.kind = 'wall'; w.k = 0; w.mark = 0; w.y = py + 0.5; w.half = 2.0; w.th = 0.5; w.fall = 1;
    const me = FX.me; for (let k = 0; k < 16 && FX.H.blocked(me.x, me.y, me.r, 0); k++) me.y += 0.25 * (me.y >= w.y ? 1 : -1);
    FX.H.shake(16, 0.7); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.flash(0.15, ICE_HI); FX.H.boom(w.x, w.y, 2.4, ICE_HI, '#FFFFFF', { n: 30, shake: 14, smoke: 8 });
    for (let k = 0; k < 18; k++) FX.H.part({ kind: 'shard', x: w.x + FX.rnd(-1, 1), y: w.y - FX.rnd(0, 3), vx: FX.rnd(-6, 6), vy: FX.rnd(-7, -1), g: 10, life: 0.9, max: 0.9, size: 5 + Math.random() * 4, rot: Math.random() * 3, vr: 8, color: Math.random() < 0.5 ? ICE_HI : '#9AA8B8' });
    FX.H.text(w.x, w.y - 3, 'Its rubble settles into a low windbreak', ICE_HI, 13); }
  /* ---- the hatch: cracks run over the cocoon, green light pours out of them, and it bursts: the shell flies apart, the
     legs fold as an empty husk, and the wasp unfolds its wings ---- */
  function startHatch(FX, m) { const M = FX.mem; m.act = 'hatch'; m.actT = 0; M.hatch = { age: 0, burst: false }; M.crack = Math.max(M.crack, 0.3); FX.H.sfx.hum(); }
  function hatchStep(FX, m, M, dt) { const Hh = M.hatch; if (!Hh) { toIdle(m, M); return; } Hh.age += dt; walk(FX, m, M, m.x, m.y, 1, dt);
    if (!Hh.burst) { M.crack = Math.min(1, 0.3 + Hh.age / 2.5 * 0.7); M.eye = 1; M.pulse = Math.max(M.pulse, 0.5 + 0.5 * Math.sin(Hh.age * 18)); M.svx += Math.sin(Hh.age * 23) * dt * 4 * M.crack; if (Math.random() < dt * (6 + 14 * M.crack)) { FX.H.sparks(m.x + FX.rnd(-1, 1), m.y - FX.rnd(1, 4), GREEN_HI, 3, 4); if (Math.random() < 0.4) FX.H.sfx.crack(); FX.H.shake(2 + 4 * M.crack, 0.1); }
      if (Hh.age > 2.6) burst(FX, m, M); }
    else { M.em = Math.min(1, M.em + dt / 1.2); if (Hh.age > 4.2) { M.hatch = null; toIdle(m, M); M.broodT = 8; } } }
  function burst(FX, m, M) { const Hh = M.hatch, G = cocoonGeo(m, M); Hh.burst = true; M.hatched = true; M.em = 0; M.alt = G.cen[2] - 0.2; M.altTo = 2.7; M.hd = Math.PI / 2; M.pitch = -0.3; M.tA = 0.4; M.roar = 1; M.glow = 1.5;
    FX.H.banner('THE COCOON HATCHES', 'Thul unfolds: a rime wasp with a stinger longer than itself, and wings of aurora', GREEN_HI, 3.0, true);
    FX.H.flash(0.45, GREEN_HI); FX.H.shake(18, 0.9); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.sfx.whoosh(); FX.H.ring(m.x, m.y, 0.5, 9, 1.0, GREEN_HI, 0.45); FX.H.ring(m.x, m.y, 0.3, 5, 0.6, '#FFFFFF', 0.4);
    FX.H.boom(m.x, m.y - G.cen[2], 2.6, GREEN_HI, '#FFFFFF', { n: 36, shake: 14, smoke: 10 });
    // the shell's pieces: curved plates of white with their navy seams, flung out and falling to the ice
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU + Math.random() * 0.4, v = 3.5 + Math.random() * 3; M.shards.push({ x: G.cen[0] + Math.cos(a) * 0.8, y: G.cen[1] + Math.sin(a) * 0.5, z: G.cen[2] + FX.rnd(-1.4, 1.4), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: 3 + Math.random() * 5, rot: Math.random() * TAU, vr: FX.rnd(-8, 8), s: 0.55 + Math.random() * 0.5, seam: Math.random() < 0.6, land: false, t: 0 }); }
    for (let k = 0; k < 16; k++) FX.H.part({ kind: 'shard', x: m.x + FX.rnd(-1, 1), y: m.y - G.cen[2], vx: FX.rnd(-6, 6), vy: FX.rnd(-8, -1), g: 9, life: 1.0, max: 1.0, size: 5, rot: Math.random() * 3, vr: 8, color: '#FFFFFF' });
    // the empty legs, folding where they stood
    FX.S.props.push({ kind: 'husk', x: m.x, y: m.y + 0.3, bx: m.x, by: m.y, hd: M.hd, feet: M.feet.map(f => [f[0], f[1], 0]), apex: M.apex, t: 0 });
    for (let k = 0; k < 2; k++) { const a = FX.angPet(m.x, m.y) + (k ? 1 : -1) * 1.2, q = FX.clampArena({ x: m.x + Math.cos(a) * 3, y: m.y + Math.sin(a) * 3 }, 2); FX.H.ring(q.x, q.y, 0.2, 1.3, 0.4, ICE_HI, 0.3); FX.minion('rimescuttler', q.x, q.y); }
    FX.H.text(m.x, m.y - 6, 'Rime scuttlers crawl from the shell', ICE_HI, 13); }
  function updShards(FX, M, dt) { for (const s of M.shards) { if (s.land) { s.t += dt; continue; } s.vz -= 14 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.rot += s.vr * dt; if (s.z <= 0.05) { s.z = 0; s.land = true; s.t = 0; FX.H.sparks(s.x, s.y, '#FFFFFF', 4, 3); FX.H.sfx.pop && FX.H.sfx.pop(); } }
    for (let i = M.shards.length - 1; i >= 0; i--) if (M.shards[i].land && M.shards[i].t > 40) M.shards.splice(i, 1); }
  /* ---------- the wasp ---------- */
  function chooseB(FX, m) { const M = FX.mem, d = FX.dist(m.x, m.y); let k = M.nextAct; M.nextAct = null;
    if (!k && d < 5.2 && M.last !== 'sweep' && Math.random() < 0.5) k = 'sweep';
    if (!k) { const pool = ['lunge', 'lunge', 'gale', 'dive'].filter(x => x !== M.last); k = pool[Math.floor(Math.random() * pool.length)]; }
    M.last = k; if (k === 'lunge') startLunge(FX, m); else if (k === 'sweep') startSweep(FX, m); else if (k === 'gale') startGale(FX, m); else startDive(FX, m); }
  function fly(FX, m, M, tx, ty, spd, dt, k) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), v = Math.min(spd, d * 2.4), wx = d > 0.01 ? dx / d * v : 0, wy = d > 0.01 ? dy / d * v : 0; M.vx = toward(M.vx, wx, dt, k || 3); M.vy = toward(M.vy, wy, dt, k || 3); m.x += M.vx * dt; m.y += M.vy * dt; const q = FX.clampArena(m, 2.4); m.x = q.x; m.y = q.y; }
  function hover(FX, m, M, dt, fast) { const me = FX.me; if (M.orb == null) M.orb = Math.atan2(m.y - me.y, m.x - me.x); M.orb += dt * 0.38 * fast * M.odir; const R = 6.0 + Math.sin(m.t * 0.5) * 1.0, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 3); fly(FX, m, M, p.x, p.y, 3.0 * fast, dt, 3); M.altTo = 2.7; }
  /* ---- Stinger Impale: it backs off, the tail curls over tight and trembles, a lane is drawn from it through the pet to
     the ice (or a windbreak); it lunges, stinger first. A miss drives the stinger into the ice: stuck ---- */
  function laneLen(FX, M, x, y, a, max) { let L = 1; while (L < max && FX.inArena(x + Math.cos(a) * L, y + Math.sin(a) * L, 0.8)) L += 0.25;
    shelters(M).forEach(w => { if (w.kind === 'pillar') { const ox = x - w.x, oy = y - w.y, b = ox * Math.cos(a) + oy * Math.sin(a), cc = ox * ox + oy * oy - (w.r + 0.3) * (w.r + 0.3), disc = b * b - cc; if (disc >= 0) { const tt = -b - Math.sqrt(disc); if (tt > 0.5 && tt < L) L = tt; } }
      else for (let s = 0.5; s < L; s += 0.25) { const px = x + Math.cos(a) * s, py = y + Math.sin(a) * s; if (Math.abs(px - w.x) < w.half + 0.2 && Math.abs(py - w.y) < w.th + 0.2) { L = s; break; } } }); return L; }
  function startLunge(FX, m) { const M = FX.mem, me = FX.me, P = FX.S.lv, wait = (P >= 4 ? 1.0 : 1.15) / FX.S.fast; const a0 = Math.atan2(m.y - me.y, m.x - me.x), back = FX.clampArena({ x: me.x + Math.cos(a0) * 6.5, y: me.y + Math.sin(a0) * 6.5 }, 2.6);
    M.lg = { age: 0, wait, bx: back.x, by: back.y, a: null, len: 0, go: false, prog: 0, sx: 0, sy: 0, hitPet: false, tele: null, aimT: 0.45 / FX.S.fast }; m.act = 'lunge'; m.actT = 0; FX.H.sfx.hum();
    say(FX, 'lunge', 'STINGER IMPALE', 'It lunges down the marked lane, stinger first: dodge, and the stinger sticks in the ice', GREEN_HI); }
  function lungeStep(FX, m, M, dt, fast) { const L = M.lg, me = FX.me; if (!L) { toIdle(m, M); return 0; } L.age += dt;
    if (L.a == null) { fly(FX, m, M, L.bx, L.by, 7, dt, 5); M.hdTo = FX.angPet(m.x, m.y); M.altTo = 3.1;
      if (L.age > L.aimT) { L.a = FX.angPet(m.x, m.y); L.sx = m.x; L.sy = m.y; L.len = laneLen(FX, M, m.x, m.y, L.a, 18); L.tele = FX.tele({ shape: 'line', x: m.x, y: m.y, a: L.a, len: L.len, w: 1.7, t: L.wait, dmg: m.dmg * 1.5, col: GREEN_HI, fn: s => { L.go = true; L.hitPet = FX.inShape(s, me.x, me.y, me.r) && !me.dodge; FX.H.sfx.whoosh(); FX.H.shake(6, 0.25); M.roar = Math.max(M.roar, 0.4); } }); }
      return 1; }
    if (!L.go) { m.x = toward(m.x, L.sx - Math.cos(L.a) * 0.6, dt, 3); m.y = toward(m.y, L.sy - Math.sin(L.a) * 0.6, dt, 3); M.hdTo = L.a; return 1; }
    // the lunge: along the lane at speed, the tail swung forward under it
    L.prog += 26 * fast * dt; const end = Math.max(0.5, L.len - 2.8), pr = Math.min(end, L.prog); m.x = L.sx + Math.cos(L.a) * pr; m.y = L.sy + Math.sin(L.a) * pr; M.hdTo = L.a; M.hd = L.a; M.vx = Math.cos(L.a) * 8; M.vy = Math.sin(L.a) * 8;
    if (Math.random() < dt * 40) FX.H.part({ kind: 'spark', x: m.x - Math.cos(L.a) * 1.5, y: m.y - Math.sin(L.a) * 1.5 - 2, vx: -Math.cos(L.a) * 12, vy: -Math.sin(L.a) * 12, life: 0.25, max: 0.25, color: GREEN_HI, size: 2 });
    if (L.prog >= end) { const tip = [L.sx + Math.cos(L.a) * (end + 2.6), L.sy + Math.sin(L.a) * (end + 2.6)]; FX.H.shake(10, 0.35); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.boom(tip[0], tip[1], 1.2, ICE_HI, '#FFFFFF', { n: 14, shake: 6 });
      M.lg = null; if (!L.hitPet) stick(FX, m, tip, L.a); else { M.recoil = 0.6; toIdle(m, M); } return 0.5; }
    return 0.6; }
  function stick(FX, m, tip, a) { const M = FX.mem; m.stunT = 4.6; M.stunKind = 'stuck'; M.stuckAt = tip; M.stuckA = a; m.act = 'hover'; m.actT = 0; M.roar = 0.5; M.stuck = 1;
    M.cracks = crackPattern(Math.floor(Math.random() * 1000));
    FX.H.banner('STUCK IN THE ICE', 'Its stinger is driven into the ice: strike the glowing sting-root!', GREEN_HI, 2.2, true); FX.H.flash(0.12, GREEN_HI); }
  /* ---- Tail Sweep: it turns side-on to the pet, cocks the long tail back, and scythes it round through the pet's side ---- */
  function startSweep(FX, m) { const M = FX.mem, P = FX.S.lv, a = FX.angPet(m.x, m.y), side = Math.random() < 0.5 ? 1 : -1, wait = (P >= 4 ? 0.85 : 1.0) / FX.S.fast;
    M.sw = { age: 0, wait, a, side, struck: false }; m.act = 'sweep'; m.actT = 0;
    FX.tele({ shape: 'cone', x: m.x, y: m.y, a, len: 7.2, spread: 1.15, t: wait, dmg: m.dmg * 1.3, col: GREEN_HI, fn: s => { M.sw && (M.sw.struck = true); FX.H.sfx.whoosh(); FX.H.shake(8, 0.3); for (let i = -3; i <= 3; i++) FX.H.part({ kind: 'slash', x: s.x + Math.cos(s.a + i * 0.33) * 4.8, y: s.y + Math.sin(s.a + i * 0.33) * 4.8, a: s.a + i * 0.33 + Math.PI / 2, r: 2.2, life: 0.3, max: 0.3, color: GREEN_HI }); } });
    say(FX, 'sweep', 'TAIL SWEEP', 'The long tail scythes the marked arc: back right off, or get behind it', GREEN_HI); }
  function sweepStep(FX, m, M, dt) { const S = M.sw; if (!S) { toIdle(m, M); return 0; } S.age += dt; M.hdTo = S.a - S.side * Math.PI / 2; M.altTo = 2.3; fly(FX, m, M, m.x, m.y, 1, dt, 3);
    const u = S.age / S.wait; M.tA = toward(M.tA, 0.45, dt, 5); M.tP = toward(M.tP, 1.0, dt, 5);
    if (!S.struck) M.tpsi = toward(M.tpsi, Math.PI + S.side * 1.05, dt, 5); else M.tpsi = toward(M.tpsi, S.side * 0.45, dt, 16);
    if (S.age > S.wait + 0.7) { M.sw = null; toIdle(m, M); } return u < 1 ? 1 : 0.5; }
  /* ---- Aurora Gale: it flies to the cave's edge, its wings flare, and it beats a gale of frost across the cave toward
     the pet; the lees are drawn from where it blows ---- */
  function startGale(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv; let th = Math.atan2(m.y - C.y, m.x - C.x) + FX.rnd(-0.6, 0.6); const sx = C.x + Math.cos(th) * (AR - 2.8), sy = C.y + Math.sin(th) * (AR - 2.8);
    M.gale = { age: 0, sx, sy, at: 1.2 / FX.S.fast, end: (1.2 + (P >= 4 ? 2.0 : 2.3)) / FX.S.fast, ga: 0, blowing: false, struck: false, zone: null }; m.act = 'gale'; m.actT = 0;
    say(FX, 'gale', 'AURORA GALE', 'Its wings beat a frost gale from the cave\'s edge: get into a windbreak\'s lee, out of the wind', GREEN_HI); }
  function galeStep(FX, m, M, dt) { const G = M.gale, me = FX.me; if (!G) { toIdle(m, M); return 0; } G.age += dt;
    if (G.age < G.at) { fly(FX, m, M, G.sx, G.sy, 9, dt, 4); M.hdTo = FX.angPet(m.x, m.y); M.altTo = 3.0; M.glow = Math.max(M.glow, 0.7 + G.age / G.at * 0.6); return 0.7; }
    if (!G.blowing) { G.blowing = true; G.ga = FX.angPet(m.x, m.y); G.x = m.x; G.y = m.y; M.leeSrc = { x: m.x, y: m.y }; FX.H.sfx.whoosh(); FX.H.sfx.hum();
      FX.H.zone({ kind: 'windlane', x: m.x, y: m.y, a: G.ga, len: 24, w: 9, life: G.end - G.at, max: G.end - G.at, own: 'none' });
      FX.tele({ shape: 'fn', x: m.x, y: m.y, test: (x, y) => { const a = Math.atan2(y - G.y, x - G.x); return Math.abs(FX.K.angTo(G.ga, a)) < 0.62 && FX.inArena(x, y, 0) && !sheltered(M, x, y, { x: G.x, y: G.y }); }, t: G.end - G.at, dmg: m.dmg * 1.35, col: GREEN_HI, fn: () => { G.struck = true; FX.H.shake(9, 0.4); FX.H.sfx.crash(); FX.H.flash(0.08, GREEN_HI); } }); }
    M.hdTo = G.ga; M.glow = 1.5; fly(FX, m, M, G.x, G.y, 2, dt, 3);
    // the wind pushes the pet down it, out of the lees it is not in
    if (!G.struck && G.age > G.at + 0.3 && !me.dodge && !sheltered(M, me.x, me.y, { x: G.x, y: G.y })) { const a = Math.atan2(me.y - G.y, me.x - G.x); if (Math.abs(FX.K.angTo(G.ga, a)) < 0.62) FX.push(Math.cos(a) * 2.2 * dt, Math.sin(a) * 2.2 * dt); }
    if (G.age > G.end + 0.7) { M.gale = null; toIdle(m, M); } return 1; }
  /* ---- Rime Dive: it climbs out of sight, its shadow finds the pet, and it plunges ---- */
  function startDive(FX, m) { const M = FX.mem, P = FX.S.lv; M.dv = { age: 0, up: 0.8, track: 0.9, wait: (P >= 4 ? 0.8 : 0.95) / FX.S.fast, tx: m.x, ty: m.y, marked: false, hit: false }; m.act = 'dive'; m.actT = 0; FX.H.sfx.whoosh();
    say(FX, 'dive', 'RIME DIVE', 'It climbs out of sight and plunges: leave the circle under its shadow', GREEN_HI); }
  function diveStep(FX, m, M, dt) { const D = M.dv, me = FX.me; if (!D) { toIdle(m, M); return 0; } D.age += dt;
    if (D.age < D.up + D.track) { M.altTo = 10; fly(FX, m, M, me.x, me.y, D.age > D.up ? 9 : 3, dt, 4); return 0.6; }
    if (!D.marked) { D.marked = true; D.tx = me.x; D.ty = me.y; FX.tele({ shape: 'circle', x: D.tx, y: D.ty, r: 2.6, t: D.wait, dmg: m.dmg * 1.4, col: GREEN_HI, fn: s => { D.hit = true; m.x = s.x; m.y = s.y; M.alt = 1.4; FX.H.boom(s.x, s.y, 2.4, ICE_HI, '#FFFFFF', { n: 26, shake: 14, smoke: 6 }); FX.H.ring(s.x, s.y, 0.4, 3.4, 0.4, GREEN_HI, 0.35); FX.H.sfx.crash(); FX.burst(s.x, s.y, 8, 5.5, { dmg: m.dmg * 0.55, color: ICE_HI, r: 0.2 }, Math.random()); M.recoil = 0.8; } }); }
    if (!D.hit) { m.x = toward(m.x, D.tx, dt, 6); m.y = toward(m.y, D.ty, dt, 6); M.altTo = 10; if (D.age > D.up + D.track + D.wait * 0.6) M.alt = toward(M.alt, 2, dt, 10); return 1; }
    M.altTo = 2.7; if (D.age > D.up + D.track + D.wait + 0.9) { M.dv = null; toIdle(m, M); } return 0.4; }
  function callMinion(FX, m, type) { const me = FX.me, a = Math.random() * TAU, d = 3.5 + Math.random() * 2.5, p = FX.clampArena({ x: me.x + Math.cos(a) * d, y: me.y + Math.sin(a) * d }, 2);
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.0, t: 1.0, dmg: m.dmg * 0.4, col: ICE_HI, fn: s => { FX.H.ring(s.x, s.y, 0.2, 1.3, 0.4, ICE_HI, 0.3); FX.H.sfx.pop && FX.H.sfx.pop(); if (FX.m && !FX.m.dead) FX.minion(type, s.x, s.y); } }); }

  /* ---------- the cocoon's body: its legs stepping one at a time, the cocoon swinging under the knot ---------- */
  function updCocoon(FX, m, M, dt, stun) {
    const scr = m.act === 'collar' && M.cl && !M.cl.let, tp = stun && M.stunKind === 'topple';
    M.scrape = toward(M.scrape, scr ? 1 : 0, dt, scr ? 3 : 2.5); M.topple = toward(M.topple, tp ? 1 : 0, dt, tp ? 4 : 1.6);
    if (!scr && !(M.cl && M.cl.let)) M.collar = decay(M.collar, dt, 0.8);
    if (m.act !== 'enter') M.apexTo = lerp(lerp(APEX + Math.sin(M.bt * 1.1) * 0.14 + M.menace * 0.15 - M.recoil * 0.25, 4.55, M.scrape), 2.35, M.topple);
    M.apex = toward(M.apex, M.apexTo, dt, m.act === 'enter' ? 2.5 : 4);
    M.hd = lerpA(M.hd, M.hdTo == null ? M.hd : M.hdTo, Math.min(1, dt * (stun ? 0 : 0.9)));
    // how fast it is going, and how hard it is turning (the cocoon swings against it)
    if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt, ax = (vx - M.pvx) / dt, ay = (vy - M.pvy) / dt; M.px = m.x; M.py = m.y; M.pvx = vx; M.pvy = vy; M.spd = toward(M.spd, Math.min(12, Math.hypot(vx, vy)), dt, 5);
      const k = 14, damp = 2.0, drive = clamp(ax, -40, 40) * 0.012, driveY = clamp(ay, -40, 40) * 0.008;
      let tx = Math.sin(M.bt * 0.83) * 0.06 + (m.act === 'collar' ? Math.sin(M.bt * 3.1) * 0.28 * M.scrape : 0), ty = Math.sin(M.bt * 0.61 + 1) * 0.04;
      if (M.topple > 0.01) tx = lerp(tx, 1.2, M.topple);
      M.svx += (-k * (M.swx - tx) - damp * M.svx - drive) * dt; M.svy += (-k * (M.swy - ty) - damp * M.svy - driveY) * dt;
      if (M.hitK > 0.9) { M.svx += (Math.random() - 0.5) * 1.6; M.svy -= 0.8; }
      M.swx = clamp(M.swx + M.svx * dt, -1.3, 1.3); M.swy = clamp(M.swy + M.svy * dt, -0.6, 0.6); }
    M.yaw += dt * (0.25 + M.scrape * 2.2 + M.menace * 0.3) * Math.sin(M.bt * 0.21 + 0.5);
    M.shx = toward(M.shx, 0, dt, 2); M.shy = toward(M.shy, 0, dt, 2);
    // the eye: it darts from one place to the next (and to the pet), and blinks
    M.lookT -= dt; if (M.lookT <= 0) { M.lookT = 0.25 + Math.random() * 0.9; if (Math.random() < 0.45 && FX.me) M.lookTo = [clamp((FX.me.x - m.x) / 5, -1, 1), clamp((FX.me.y - m.y) / 8, -0.5, 0.6)]; else M.lookTo = [FX.rnd(-1, 1), FX.rnd(-0.5, 0.5)]; }
    M.look[0] = toward(M.look[0], M.lookTo[0], dt, 22); M.look[1] = toward(M.look[1], M.lookTo[1], dt, 22);
    M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = 2 + Math.random() * 3; M.blink = 1; } M.blink = decay(M.blink, dt, 6);
    M.eye = toward(M.eye, stun ? 1 : 0.5 + M.menace * 0.5 + M.roar * 0.4, dt, 5);
    // the legs: one foot at a time steps to where it would rest, the lifted one swinging high
    if (m.act !== 'enter') {
      if (M.step) { const S = M.step; S.u += dt / S.dur; const u = Math.min(1, S.u), f = M.feet[S.i]; f[0] = lerp(S.from[0], S.to[0], u); f[1] = lerp(S.from[1], S.to[1], u); f[2] = Math.sin(u * Math.PI) * S.lift;
        M.shx += (-(S.to[0] - m.x) * 0.04 - M.shx) * Math.min(1, dt * 3); M.shy += (-(S.to[1] - m.y) * 0.03 - M.shy) * Math.min(1, dt * 3);
        if (S.u >= 1) { f[2] = 0; M.step = null; M.stepT = 0.06; FX.H.sparks(f[0], f[1], ICE_HI, 3, 2); if (M.spd > 0.6) { FX.H.shake(1.2, 0.06); FX.H.sfx.thud && Math.random() < 0.5 && FX.H.sfx.thud(); } M.svx += (Math.random() - 0.5) * 0.5; } }
      else if (!M.stomp) { M.stepT -= dt; M.fidT -= dt; let worst = -1, we = 0; for (let i = 0; i < 3; i++) { const r = restFoot(m, M, i), e = Math.hypot(M.feet[i][0] - r[0], M.feet[i][1] - r[1]); if (e > we) { we = e; worst = i; } }
        const need = stun ? 9 : 0.55;
        if ((we > need || (M.fidT <= 0 && !stun)) && M.stepT <= 0 && worst >= 0) { if (M.fidT <= 0) { M.fidT = 1.6 + Math.random() * 2.4; worst = Math.floor(Math.random() * 3); }
          const r = restFoot(m, M, worst), lead = 0.35; let to = [r[0] + M.vx * lead + FX.rnd(-0.25, 0.25), r[1] + M.vy * lead + FX.rnd(-0.25, 0.25)];
          M.wb.forEach(w => { if (!w.alive) return; const dx = to[0] - w.x, dy = to[1] - w.y, d = Math.hypot(dx, dy) || 1; if (w.kind === 'pillar' && d < w.r + 0.4) to = [w.x + dx / d * (w.r + 0.4), w.y + dy / d * (w.r + 0.4)]; });
          M.step = { i: worst, from: M.feet[worst].slice(0, 2), to, u: 0, dur: clamp(0.42 - M.spd * 0.06, 0.22, 0.42), lift: 0.7 + Math.random() * 0.5 + M.spd * 0.08 }; } } } }
  /* where the cocoon hangs: the legs' knot (apex), the stalk, then the cocoon swung about its top */
  function cocoonGeo(m, M) { const ax = m.x + (M.shx || 0), ay = m.y + (M.shy || 0), az = M.apex == null ? APEX : M.apex, top = [ax, ay, az - STALK], sx = M.swx || 0, sy = M.swy || 0;
    let dx = Math.sin(sx), dy = Math.sin(sy) * Math.cos(sx), dz = -Math.cos(sx) * Math.cos(sy); const n = Math.hypot(dx, dy, dz) || 1; dx /= n; dy /= n; dz /= n;
    const cen = [top[0] + dx * RZ, top[1] + dy * RZ, top[2] + dz * RZ], bot = [top[0] + dx * RZ * 2, top[1] + dy * RZ * 2, Math.max(0.15, top[2] + dz * RZ * 2)];
    // (it never sinks into the floor: lying on its side the whole cocoon rises to rest on the ice)
    const lowest = cen[2] - Math.abs(dz) * RZ - Math.sqrt(1 - dz * dz) * RX * 0.9; if (lowest < 0.02) { const k = 0.02 - lowest; cen[2] += k; bot[2] += k; top[2] += k; }
    return { apex: [ax, ay, az], top, cen, bot, dir: [dx, dy, dz] }; }
  function eyeAt(m, M) { const G = cocoonGeo(m, M), d = G.dir; return [G.cen[0] + d[0] * RZ * 0.62, G.cen[1] + d[1] * RZ * 0.62 + RX * 0.55, G.cen[2] + d[2] * RZ * 0.62]; }
  function legPts(i, foot, apex, hd, M) { const L = LEGS[i], ax = apex[0], ay = apex[1], az = apex[2], dx = foot[0] - ax, dy = foot[1] - ay, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, k = d / L.r, sink = (APEX - az) * 0.55, lift = foot[2] || 0;
    // (each knuckle a little off the straight line, twisted, so the three never match)
    const tw = [0.35, -0.5, 0.25][i], px = -uy * tw, py = ux * tw;
    const knee = [ax + ux * L.kr * k + px * 0.6, ay + uy * L.kr * k + py * 0.6, L.kz - sink * 0.6 + lift * 0.35 - (M.topple || 0) * 2.2];
    const ank = [ax + ux * L.ar * k - px * 0.3, ay + uy * L.ar * k - py * 0.3, L.az * (0.75 + 0.25 * az / APEX) + lift * 0.8 + (M.scrape || 0) * 0.5 - (M.topple || 0) * 0.8];
    return [foot, ank, knee, [ax, ay, az + 0.15]]; }
  // the hit proxies: the cocoon (three along it) or the wasp (head, thorax, abdomen)
  function bodyParts(m, M) { if (!M.hatched) { const G = cocoonGeo(m, M), d = G.dir; return [hit('c0', G.cen, 1.35, m), hit('c1', [G.cen[0] - d[0] * RZ * 0.6, G.cen[1] - d[1] * RZ * 0.6, G.cen[2] - d[2] * RZ * 0.6], 1.0, m), hit('c2', [G.cen[0] + d[0] * RZ * 0.6, G.cen[1] + d[1] * RZ * 0.6, G.cen[2] + d[2] * RZ * 0.6], 1.0, m)]; }
    const P = waspPose(m, M); return [hit('th', P.thorax, 1.1, m), hit('hd', P.head, 0.8, m), hit('ab', P.gs[2], 1.05, m)]; }

  /* ---------- the wasp's body ---------- */
  function updWasp(FX, m, M, dt, stun) { const me = FX.me, act = m.act;
    M.em = M.hatch ? M.em : Math.min(1, M.em + dt / 1.2);
    M.hd = lerpA(M.hd, M.hdTo == null ? M.hd : M.hdTo, Math.min(1, dt * (act === 'lunge' ? 9 : act === 'sweep' ? 5 : 3)));
    if (dt > 1e-4) { const vx = (m.x - M.px) / dt, vy = (m.y - M.py) / dt; M.px = m.x; M.py = m.y; M.spd = toward(M.spd, Math.min(30, Math.hypot(vx, vy)), dt, 6); }
    const L = M.lg, lungeGo = L && L.go, poise = (L && !L.go) || (act === 'sweep' && M.sw && !M.sw.struck), gale = act === 'gale', diveUp = act === 'dive' && M.dv && !M.dv.hit, stuck = stun && M.stunKind === 'stuck';
    // the beat: slow and broad as a butterfly's while it hovers, fast in the gale and the struggle
    const freq = stuck ? 4.2 : gale ? 3.4 : lungeGo ? 0.6 : diveUp ? 2.8 : M.hatch ? 1.2 : 1.7; M.beat += dt * TAU * freq;
    const amp = stuck ? 0.75 : gale ? 0.85 : lungeGo ? 0.15 : 0.62, base = lungeGo ? 1.15 : gale ? 0.15 : 0.32;
    const fold = 1 - easeOut(M.em); M.flapF = lerp(base + Math.sin(M.beat) * amp, 1.45, fold); M.flapH = lerp(base * 0.8 + Math.sin(M.beat - 0.55) * amp * 0.85, 1.35, fold); M.span = 0.3 + 0.7 * easeBack(M.em);
    M.glow = toward(M.glow, gale ? 1.5 : poise ? 1.0 : stuck ? 1.1 : 0.62, dt, 3);
    // the tail: curled over the back and poised; tighter before a lunge, swung under for it, out straight for a sweep
    let tA = 3.9, tP = 1.35; if (poise && act === 'lunge') { tA = 4.35 + Math.sin(M.bt * 30) * 0.05; } else if (lungeGo) { tA = -3.0; tP = 0.6; } else if (stuck) { tA = -2.0; tP = 0.8; } else if (act === 'sweep') { tA = M.tA; tP = M.tP; } else if (gale) tA = 3.1; else if (act === 'dive') { tA = diveUp ? 1.4 : 2.2; } else if (M.hatch) tA = lerp(0.3, 3.9, easeOut(M.em));
    if (act !== 'sweep') { M.tA = toward(M.tA, tA, dt, lungeGo ? 14 : 4); M.tP = toward(M.tP, tP, dt, lungeGo ? 14 : 4); M.tpsi = toward(M.tpsi, Math.PI, dt, 3); }
    M.gcurl = toward(M.gcurl, lungeGo || stuck ? 1.4 : poise ? 0.8 : 0.3, dt, 6);
    M.pitch = toward(M.pitch, lungeGo ? 0.28 : stuck ? 0.45 : diveUp && M.alt > 6 && M.dv.age > M.dv.up + M.dv.track ? 1.0 : poise ? -0.12 : M.hatch ? -0.25 : 0.02 + M.recoil * -0.2, dt, 5);
    M.roll = toward(M.roll, clamp(-(M.vx * Math.sin(M.hd) - M.vy * Math.cos(M.hd)) * 0.04, -0.35, 0.35), dt, 3);
    M.jaw = toward(M.jaw, Math.max(poise ? 1 : 0, M.roar, stuck ? 0.7 : 0, 0.15 + 0.15 * Math.sin(M.bt * 2.3)), dt, 6);
    // its height: a bob with the beat; stuck, it is held by the stinger in the ice
    let want = (M.altTo || 2.7) + Math.sin(M.beat - 1.2) * 0.2 * (lungeGo ? 0 : 1) + M.recoil * 0.3;
    if (stuck && M.stuckAt) { const P = waspPose(m, M), tip = P.tip; want = M.alt - tip[2] - 0.35; m.x = toward(m.x, m.x + (M.stuckAt[0] - tip[0]), dt, 6); m.y = toward(m.y, m.y + (M.stuckAt[1] - tip[1]), dt, 6); M.hd = lerpA(M.hd, M.stuckA, Math.min(1, dt * 5)); M.alt = toward(M.alt, clamp(want, 0.9, 5.5), dt, 6); M.alt += Math.sin(M.bt * 19) * 0.01; }
    else M.alt = toward(M.alt, want, dt, act === 'dive' ? 2.5 : 3);
    M.stuck = toward(M.stuck, stuck ? 1 : 0, dt, 5); }
  /* the wasp's pose in the world: a body frame (u forward, v left, h up) at its height, the abdomen as a chain of bands,
     the long tail as a chain of segments, the stinger beyond it */
  function waspPose(m, M) {
    const S = 0.62 + 0.38 * easeBack(M.em == null ? 1 : M.em), W = RiftFiend.frame(m, M.hd == null ? Math.PI / 2 : M.hd, { pitch: M.pitch || 0, roll: M.roll || 0, z: M.alt == null ? 2.7 : M.alt, scale: S }), bt = M.bt || 0;
    const gsL = []; let pu = -0.28, ph = 0.1, b = Math.PI + 0.12; for (let k = 0; k < 6; k++) { b += (M.gcurl == null ? 0.3 : M.gcurl) * 0.13; pu += Math.cos(b) * 0.44; ph += Math.sin(b) * 0.44; gsL.push([pu, 0, ph]); }
    const tlL = []; let tu = pu + Math.cos(b) * 0.3, tv = 0, th = ph + Math.sin(b) * 0.3; tlL.push([tu, tv, th]);
    const n = 14, seg = 5.6 / n, tA = M.tA == null ? 3.9 : M.tA, tP = M.tP == null ? 1.35 : M.tP, tpsi = M.tpsi == null ? Math.PI : M.tpsi, st = M.stuck || 0;
    let dir = [-1, 0, 0];
    for (let j = 1; j <= n; j++) { const s = j / n, psi = Math.PI + (tpsi - Math.PI) * Math.pow(s, 0.8) + (Math.sin(bt * 1.7 + s * 4) * 0.07 + (0.42 + 0.12 * Math.sin(bt * 0.7)) * s * (tpsi === Math.PI || Math.abs(tpsi - Math.PI) < 0.3 ? 1 : 0)) * (1 - st), eps = -0.35 + tA * Math.pow(s, tP) + Math.sin(bt * 2.3 + s * 5) * 0.05 * (1 - st);
      dir = [Math.cos(eps) * Math.cos(psi), Math.cos(eps) * Math.sin(psi), Math.sin(eps)]; tu += dir[0] * seg; tv += dir[1] * seg; th += dir[2] * seg; tlL.push([tu, tv, th]); }
    const tipL = [tu + dir[0] * 1.15, tv + dir[1] * 1.15, th + dir[2] * 1.15];
    const w = q => W(q[0], q[1], q[2]);
    return { S, W, head: W(1.72, 0, 0.32), thorax: W(0.72, 0, 0.26), pet0: W(0.12, 0, 0.18), gs: gsL.map(w), tl: tlL.map(w), tip: w(tipL), root: w(tlL[0]) }; }
  function stingRoot(m, M) { return waspPose(m, M).root; }

  /* ---------- painting the cocoon ---------- */
  function drawCocoonBoss(c, FX, m, X, Y, T, t) {
    const M = FX.mem; if (!M.feet) { M.feet = LEGS.map((L, i) => { const p = restFoot(m, M, i); return [p[0], p[1], 0]; }); }
    const P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.065), G = cocoonGeo(m, M), parts = [];
    TN.groundShadow(c, P3(G.cen[0], G.cen[1], 0)[0], P3(G.cen[0], G.cen[1], 0)[1], T * 2.2, T * 0.95, G.cen[2] * 0.5, 0.42);
    // the eye's green light pooled on the ice under it
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 + (M.eye || 0) * 0.12 + (M.crack || 0) * 0.3; const gq = P3(G.bot[0], G.bot[1], 0); blitSized(c, glowSprite(GREEN), gq[0] - T * 2.4, gq[1] - T * 1.1, T * 4.8, T * 2.2); c.restore();
    for (let i = 0; i < 3; i++) { const f = M.feet[i], pts = legPts(i, f, G.apex, M.hd, M); parts.push({ at: [(pts[1][0] + pts[2][0]) / 2, (pts[1][1] + pts[2][1]) / 2, 1.2], draw: () => drawLeg(c, P3, pts, T, lw, i, t, M) }); }
    parts.push({ at: [G.cen[0], G.cen[1], 1.0], draw: () => drawCocoon(c, FX, m, M, P3, T, t, lw, G) });
    sorted(parts).forEach(p => p.draw());
    drawKnot(c, P3, G, T, lw, M, t); }
  // a leg: three angular segments of black root, knuckled, with frost on the knees and roots spreading from the foot
  function drawLeg(c, P3, pts, T, lw, i, t, M, o) { o = o || {}; const [F, A, K, P] = pts, q = pts.map(p => P3(p[0], p[1], p[2])), col = { col: ROOT, shade: ROOT_SH, hi: ROOT_HI, line: INK, lw, force: true, alpha: o.alpha };
    // the roots at the foot, splayed on the ice
    if ((F[2] || 0) < 0.3) { const dx = F[0] - P[0], dy = F[1] - P[1]; [-0.95, -0.15, 0.7, 1.5].forEach((s, k) => { const a = Math.atan2(dy, dx) + s, L = 0.6 + 0.3 * ((i + k) % 3), mid = P3(F[0] + Math.cos(a + 0.3) * L * 0.5, F[1] + Math.sin(a + 0.3) * L * 0.5, 0.05), e = P3(F[0] + Math.cos(a) * L, F[1] + Math.sin(a) * L, 0); tubeLite(c, [q[0], mid, e], u => T * (0.2 - u * 0.16), col); }); }
    // each segment bowed a little to one side, like a root, thick at the knot and thinning to the foot
    const seg = (a, b, w0, w1, bow) => { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d; tubeLite(c, [a, [a[0] + dx * 0.33 + nx * bow * T, a[1] + dy * 0.33 + ny * bow * T], [a[0] + dx * 0.7 - nx * bow * T * 0.5, a[1] + dy * 0.7 - ny * bow * T * 0.5], b], u => T * (w0 + (w1 - w0) * u) * (1 + 0.18 * Math.sin(u * 9 + i)), col); };
    seg(q[0], q[1], 0.2, 0.3, [0.12, -0.1, 0.08][i]); seg(q[1], q[2], 0.3, 0.42, [-0.16, 0.14, -0.1][i]); seg(q[2], q[3], 0.42, 0.5, [0.1, 0.12, -0.14][i]);
    // knuckles: a swollen joint at the knee and ankle, thorns off them, and a broad cap of snow on the knee
    [[q[1], 0.2], [q[2], 0.27]].forEach(([p, r], k) => { TN.shape(c, TN.blob([[p[0] - T * r * 1.3, p[1]], [p[0] - T * r * 0.4, p[1] - T * r * 1.05], [p[0] + T * r * 0.9, p[1] - T * r * 0.8], [p[0] + T * r * 1.3, p[1] + T * r * 0.2], [p[0] + T * r * 0.2, p[1] + T * r * 1.0], [p[0] - T * r * 0.9, p[1] + T * r * 0.7]]), { col: ROOT, shade: ROOT_SH, hi: ROOT_HI, line: INK, lw, r: T * r, force: true, alpha: o.alpha });
      [1, -0.6].forEach((sk, j) => { const s = ((i + k + j) % 2 ? 1 : -1) * sk, L = T * (0.5 - j * 0.15); c.fillStyle = ROOT; c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(p[0] - T * 0.09, p[1] - T * 0.05); c.lineTo(p[0] + s * L, p[1] - L * 0.85); c.lineTo(p[0] + T * 0.09, p[1] + T * 0.04); c.closePath(); c.fill(); c.stroke(); }); });
    const kq = q[2]; TN.shape(c, TN.blob([[kq[0] - T * 0.4, kq[1] - T * 0.12], [kq[0] - T * 0.2, kq[1] - T * 0.42], [kq[0] + T * 0.22, kq[1] - T * 0.44], [kq[0] + T * 0.42, kq[1] - T * 0.14], [kq[0] + T * 0.1, kq[1] - T * 0.04], [kq[0] - T * 0.15, kq[1] + T * 0.02]]), { col: '#F2F7FA', shade: '#B9D0DE', hi: '#FFFFFF', line: INK, lw: lw * 0.8, r: T * 0.4, d1: 0.08, d2: 0.18, force: true, alpha: o.alpha }); }
  // the knot where the three legs meet, and the stalk down to the cocoon
  function drawKnot(c, P3, G, T, lw, M, t) { const a = P3(G.apex[0], G.apex[1], G.apex[2] + 0.15), b = P3(G.top[0], G.top[1], G.top[2] + 0.1);
    tubeLite(c, [a, [(a[0] + b[0]) / 2 + Math.sin(t * 2) * T * 0.05, (a[1] + b[1]) / 2], b], u => T * (0.34 - u * 0.12), { col: ROOT, shade: ROOT_SH, hi: ROOT_HI, line: INK, lw, force: true });
    TN.shape(c, TN.blob([[a[0] - T * 0.5, a[1] + T * 0.05], [a[0] - T * 0.2, a[1] - T * 0.42], [a[0] + T * 0.3, a[1] - T * 0.35], [a[0] + T * 0.52, a[1] + T * 0.08], [a[0] + T * 0.1, a[1] + T * 0.32], [a[0] - T * 0.3, a[1] + T * 0.28]]), { col: ROOT, shade: ROOT_SH, hi: ROOT_HI, line: INK, lw, r: T * 0.5, force: true });
    c.fillStyle = '#F2F7FA'; c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(a[0] - T * 0.42, a[1] - T * 0.12); c.quadraticCurveTo(a[0] - T * 0.1, a[1] - T * 0.62, a[0] + T * 0.44, a[1] - T * 0.12); c.quadraticCurveTo(a[0] + T * 0.1, a[1] - T * 0.28, a[0] - T * 0.42, a[1] - T * 0.12); c.fill(); c.stroke(); }
  function cracksOf() { if (CRK) return CRK; CRK = (() => { const R = mulberry32(77), out = []; for (let k = 0; k < 11; k++) { let x = (R() - 0.5) * 1.3, y = (R() - 0.5) * 1.7; const pts = [[x, y]], a0 = R() * TAU; for (let j = 0; j < 6; j++) { const a = a0 + (R() - 0.5) * 1.8; x += Math.cos(a) * 0.24; y += Math.sin(a) * 0.32; pts.push([x, y]); if (j === 2 && R() < 0.6) out.push({ pts: [[x, y], [x + Math.cos(a + 1.2) * 0.25, y + Math.sin(a + 1.2) * 0.3], [x + Math.cos(a + 0.8) * 0.45, y + Math.sin(a + 0.8) * 0.5]], at: k / 11 + 0.05 }); } out.push({ pts, at: k / 11 }); } return out; })(); return CRK; }
  /* the cocoon: a white oval (its outline the screen ellipse of the swung oval), silk wraps, five navy seams turning
     with it, the frost collar round its base, the lowest opening and the green eye in it; cracks before it hatches */
  function drawCocoon(c, FX, m, M, P3, T, t, lw, G) {
    const pt = P3(G.top[0], G.top[1], G.top[2]), pb = P3(G.bot[0], G.bot[1], G.bot[2]), pc = [(pt[0] + pb[0]) / 2, (pt[1] + pb[1]) / 2], vx = pb[0] - pt[0], vy = pb[1] - pt[1], ry = Math.max(T * 1.2, Math.hypot(vx, vy) / 2), rot = Math.atan2(-vx, vy);
    const pul = 1 + (M.pulse || 0) * 0.05 + (M.hitK || 0) * 0.03, rx = RX * T * pul * (1 - (M.hitK || 0) * 0.04), Ry = ry * (1 + (M.pulse || 0) * 0.03);
    const cr = Math.cos(rot), sr = Math.sin(rot), lx = -0.55 * cr - 0.8 * sr, ly = 0.55 * sr - 0.8 * cr;
    c.save(); c.translate(pc[0], pc[1]); c.rotate(rot);
    const yawS = M.yaw || 0, col = M.collar || 0, cy0 = Ry * 0.5, bw = rx * 0.9 * 1.06, bh = bw * 0.3;
    const spikes = []; for (let i = 0; i < 15; i++) { const psi = i / 15 * TAU + yawS * 0.5, k = clamp(col * 1.6 - ((i * 7) % 15) / 15 * 0.6, 0, 1); if (k <= 0.02) continue; const L = T * (0.6 + 0.55 * ((i * 7) % 5) / 4) * k; spikes.push({ psi, k, L, front: Math.sin(psi) > 0 }); }
    const band = front => { if (col < 0.05) return; c.save(); c.lineCap = 'round'; c.beginPath(); c.ellipse(0, cy0, bw, bh, 0, front ? 0 : Math.PI, front ? Math.PI : TAU); c.strokeStyle = INK; c.lineWidth = T * 0.5 * col + 2.5; c.stroke(); c.strokeStyle = ICE_HI; c.lineWidth = T * 0.5 * col; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = T * 0.08 * col; c.beginPath(); c.ellipse(0, cy0 - T * 0.06, bw, bh, 0, front ? 0.3 : Math.PI + 0.3, front ? Math.PI - 0.3 : TAU - 0.3); c.stroke(); c.restore(); };
    const spike = s => { const bx = Math.cos(s.psi) * bw, by = cy0 + Math.sin(s.psi) * bh, ox = Math.cos(s.psi), oy = Math.sin(s.psi) * 0.4 + 0.5, on = Math.hypot(ox, oy) || 1, tx = bx + ox / on * s.L, ty = by + oy / on * s.L, nx = -oy / on, ny = ox / on, w = T * 0.17 * (0.6 + 0.4 * s.k);
      c.beginPath(); c.moveTo(bx + nx * w, by + ny * w); c.lineTo(tx, ty); c.lineTo(bx - nx * w, by - ny * w); c.closePath(); c.fillStyle = s.front ? ICE_HI : ICE; c.fill(); c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.moveTo(bx + nx * w * 0.4, by + ny * w * 0.4); c.lineTo(tx, ty); c.stroke(); };
    spikes.filter(s => !s.front).forEach(spike); band(false);
    // the oval
    const path = TN.ell(0, 0, rx, Ry, 0);
    TN.shape(c, path, { col: SNOW, shade: SNOW_SH, hi: SNOW_HI, line: INK, lw: lw * 1.2, r: rx, lx, ly, d1: 0.1, d2: 0.24, spec: 0.7, specAt: [-rx * 0.45, -Ry * 0.55], force: true, inner: g => {
      // silk wraps across it, faint
      g.strokeStyle = 'rgba(120,160,190,.32)'; g.lineWidth = Math.max(1, T * 0.035); for (let j = 1; j < 8; j++) { const y = (j / 8 * 2 - 1) * Ry * 0.9, w2 = rx * Math.sqrt(Math.max(0, 1 - (y / Ry) * (y / Ry))); g.beginPath(); g.ellipse(0, y, w2, Ry * 0.07, 0, 0.12 * Math.PI, 0.88 * Math.PI); g.stroke(); }
      // the five seams, raised navy ridges turning with its slow twist (the far ones hidden)
      for (let k = 0; k < 5; k++) { const ph = yawS + k * TAU / 5, s = Math.sin(ph), fr = Math.cos(ph); if (fr < -0.05) continue; const wv = T * 0.28 * (0.5 + 0.5 * fr);
        g.beginPath(); for (let j = 0; j <= 16; j++) { const v = -0.97 + j / 16 * 1.94, x = s * rx * 0.97 * Math.sqrt(1 - v * v), y = v * Ry; j ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = wv + 3; g.stroke(); g.strokeStyle = NAVY; g.lineWidth = wv; g.stroke(); g.strokeStyle = TN.rgba(NAVY_HI, 0.8); g.lineWidth = Math.max(1, wv * 0.3); g.save(); g.translate(-wv * 0.18, -wv * 0.1); g.stroke(); g.restore(); }
      // the cracks before it hatches: green light pours out of them
      const ck = M.crack || 0; if (ck > 0.02) cracksOf().forEach(C => { const f = clamp((ck - C.at * 0.5) / 0.5, 0, 1); if (f <= 0) return; const n = Math.max(2, Math.round(C.pts.length * f)), pts = C.pts.slice(0, n).map(([x, y]) => [x * rx, y * Ry]);
        g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.strokeStyle = INK; g.lineWidth = T * 0.22; g.stroke(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = TN.rgba(GREEN, 0.5 + 0.5 * ck); g.lineWidth = T * 0.34; g.globalAlpha = 0.35; g.stroke(); g.globalAlpha = 1; g.strokeStyle = TN.rgba(GREEN_HI, 0.6 + 0.4 * ck); g.lineWidth = T * 0.14; g.stroke(); g.strokeStyle = '#FFFFFF'; g.lineWidth = T * 0.05; g.stroke(); g.restore(); });
    } });
    if ((M.crack || 0) > 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, (M.crack - 0.3) * 1.3) * (0.6 + 0.3 * Math.sin(t * 20)); blitSized(c, glowSprite(GREEN_HI), -rx * 2.2, -Ry * 1.5, rx * 4.4, Ry * 3.0); c.restore(); }
    band(true); spikes.filter(s => s.front).forEach(spike);
    // the lowest opening: a dark slit between the seams, its lips raised, the green eye in it
    const ex = 0, ey = Ry * 0.64, ew = rx * 0.66 * (1 + (M.topple || 0) * 0.25), eo = clamp((M.eye || 0.5) * (1 - (M.blink || 0)), 0.05, 1), eh = Ry * 0.19 * (0.35 + 0.65 * eo) * (1 + (M.topple || 0) * 0.4);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.55 + eo * 0.45 + (m.stunT > 0 ? 0.3 * Math.sin(t * 10) : 0)); blitSized(c, glowSprite(GREEN), ex - ew * 2.1, ey - ew * 1.5, ew * 4.2, ew * 3.0); c.restore();
    const lid = g => { g.moveTo(ex - ew, ey); g.quadraticCurveTo(ex, ey - eh * 2, ex + ew, ey); g.quadraticCurveTo(ex, ey + eh * 2, ex - ew, ey); g.closePath(); };
    c.beginPath(); lid(c); c.fillStyle = '#0A1220'; c.fill(); c.save(); c.beginPath(); lid(c); c.clip();
    const lk = M.look || [0, 0], ix = ex + lk[0] * ew * 0.45, iy = ey + lk[1] * eh * 0.5, ir = Math.min(ew * 0.42, eh * 1.25 + T * 0.08);
    c.fillStyle = '#2E8C6E'; c.beginPath(); c.arc(ix, iy, ir, 0, TAU); c.fill(); c.fillStyle = GREEN; c.beginPath(); c.arc(ix, iy - ir * 0.08, ir * 0.82, 0, TAU); c.fill(); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(ix - ir * 0.2, iy - ir * 0.3, ir * 0.4, 0, TAU); c.fill();
    c.fillStyle = '#041008'; c.beginPath(); c.ellipse(ix, iy, ir * 0.18 * (1 + (M.menace || 0) * -0.3), ir * 0.8, 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ix - ir * 0.35, iy - ir * 0.35, ir * 0.16, 0, TAU); c.fill(); c.restore();
    c.beginPath(); lid(c); c.strokeStyle = INK; c.lineWidth = lw * 1.4; c.stroke(); c.strokeStyle = NAVY; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(ex - ew * 1.05, ey); c.quadraticCurveTo(ex, ey - eh * 2.25, ex + ew * 1.05, ey); c.stroke();
    // a broad cap of frost on its crown where the stalk holds it
    c.fillStyle = '#F7FBFD'; c.strokeStyle = INK; c.lineWidth = lw; c.beginPath(); c.ellipse(0, -Ry * 0.86, rx * 0.55, Ry * 0.16, 0, Math.PI * 0.95, Math.PI * 2.05); c.quadraticCurveTo(rx * 0.2, -Ry * 0.74, 0, -Ry * 0.76); c.quadraticCurveTo(-rx * 0.25, -Ry * 0.7, -rx * 0.55 * Math.cos(Math.PI * 0.05), -Ry * 0.86 + Ry * 0.16 * Math.sin(Math.PI * 0.05)); c.fill(); c.stroke();
    c.restore();
    // the stun: twinkles over the toppled cocoon
    if ((M.topple || 0) > 0.6) for (let i = 0; i < 3; i++) { const a = (M.bt || t) * 3 + i * TAU / 3; TN.twinkle(c, pc[0] + Math.cos(a) * T * 1.4, pc[1] - T * 1.6 + Math.sin(a) * T * 0.3, T * 0.18, '#FFFFFF', 0.9); } }

  /* ---------- painting the wasp ---------- */
  function drawWasp(c, FX, m, X, Y, T, t) {
    const M = FX.mem, P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.065), P = waspPose(m, M), S = P.S, W = P.W, parts = [], hd = M.hd == null ? Math.PI / 2 : M.hd, bt = M.bt || t;
    const g0 = P3(m.x, m.y, 0); TN.groundShadow(c, g0[0], g0[1] + T * 0.2, T * 3.2 * S, T * 1.3 * S, M.alt, 0.42);
    // its glow on the ice
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.1 + (M.glow || 0.6) * 0.12; blitSized(c, glowSprite(GREEN), g0[0] - T * 4, g0[1] - T * 1.6, T * 8, T * 3.2); c.restore();
    const W3 = (u, v, h) => W(u, v, h), PQ = p => P3(p[0], p[1], p[2]);
    // the wings, far pair first
    const wing = (side, hind) => ({ at: W3(hind ? -0.1 : 0.25, side * 1.4, 0.1), draw: () => drawWing(c, P3, W, T, M, side, hind, lw, t, FX) });
    [-1, 1].forEach(sd => { parts.push(wing(sd, true)); parts.push(wing(sd, false)); });
    // the legs, hanging under the thorax and twitching
    [[0.95, 0], [0.7, 1], [0.45, 2]].forEach(([u0, k]) => [-1, 1].forEach(sd => { const sw = Math.sin(bt * 3 + k * 1.3 + sd) * 0.12, hip = W3(u0, sd * 0.28, -0.18), knee = W3(u0 + 0.25 - k * 0.15, sd * 0.85, -0.45 + sw), foot = W3(u0 + 0.5 - k * 0.45 + sw, sd * 0.7, -1.25 - k * 0.12);
      parts.push({ at: [knee[0], knee[1], knee[2] - 0.3], draw: () => { const q = [PQ(hip), PQ(knee), PQ(foot)]; tubeLite(c, q, u => T * S * (0.11 - u * 0.06), { col: NAVY, shade: NAVY_DK, hi: NAVY_HI, line: INK, lw: lw * 0.8, force: true }); c.fillStyle = ICE_HI; c.beginPath(); c.arc(q[2][0], q[2][1], Math.max(1.2, T * S * 0.05), 0, TAU); c.fill(); } }); }));
    // the abdomen's bands, white and navy, and the narrow waist
    parts.push({ at: P.pet0, draw: () => tubeLite(c, [PQ(P.thorax), PQ(P.pet0), PQ(P.gs[0])], u => T * S * (0.24 - Math.sin(u * Math.PI) * 0.14), { col: NAVY, shade: NAVY_DK, hi: NAVY_HI, line: INK, lw, force: true }) });
    const GR = [0.42, 0.6, 0.7, 0.66, 0.52, 0.32];
    P.gs.forEach((g, k) => { const nx = P.gs[Math.min(5, k + 1)], pv = P.gs[Math.max(0, k - 1)], th = Math.atan2(pv[1] - nx[1], pv[0] - nx[0]) || hd, white = k % 2 === 0;
      parts.push({ at: [g[0], g[1], g[2] + 0.01 * k], draw: () => TN.ellipsoid(c, P3, th, g, [0.34 * S, GR[k] * S, GR[k] * 0.9 * S], { T, col: white ? SNOW : NAVY, shade: white ? SNOW_SH : NAVY_DK, hi: white ? SNOW_HI : NAVY_HI, line: INK, lw, d1: 0.1, d2: 0.22, spec: white ? 0.5 : 0.3, force: true }) }); });
    // the tail and the stinger (one piece in the depth order, at its middle)
    const tm = P.tl[Math.floor(P.tl.length / 2)]; parts.push({ at: [tm[0], tm[1], tm[2]], draw: () => drawTail(c, P, P3, T, S, lw, M, t) });
    parts.push({ at: P.thorax, draw: () => drawThorax(c, P, P3, W, T, S, lw, hd) });
    parts.push({ at: [P.head[0], P.head[1], P.head[2] + 0.05], draw: () => drawHead(c, P, P3, W, T, S, lw, hd, M, t) });
    // the depth order (the wings' anchors sit out at their sides and a little behind the thorax, so the far pair falls
    // behind the body and, seen from in front, both do)
    sorted(parts).forEach(p => p.draw());
    // stuck: the ice cracked round the stinger's tip, the sting-root glowing
    if ((M.stuck || 0) > 0.05 || m.stunT > 0 && M.stunKind === 'stuck') { const r = PQ(P.root); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 + 0.35 * Math.sin(t * 12); blitSized(c, glowSprite(GREEN_HI), r[0] - T * 1.3, r[1] - T * 1.3, T * 2.6, T * 2.6); blitSized(c, glowSprite('#FFFFFF'), r[0] - T * 0.5, r[1] - T * 0.5, T, T); c.restore(); } }
  function drawThorax(c, P, P3, W, T, S, lw, hd) { const th = P.thorax;
    TN.ellipsoid(c, P3, hd, th, [0.72 * S, 0.58 * S, 0.6 * S], { T, col: NAVY, shade: NAVY_DK, hi: NAVY_HI, line: INK, lw, d1: 0.12, d2: 0.24, spec: 0.45, force: true });
    // the ice-blue plate on its back and two white marks
    const pl = W(0.75, 0, 0.62); TN.ellipsoid(c, P3, hd, pl, [0.48 * S, 0.36 * S, 0.14 * S], { T, col: ICE, shade: ICE_SH, hi: ICE_HI, line: INK, lw: lw * 0.8, d1: 0.1, d2: 0.2, spec: 0.6, force: true });
    [-1, 1].forEach(s => { const q = P3(...W(0.42, s * 0.3, 0.55)); c.fillStyle = SNOW; c.beginPath(); c.arc(q[0], q[1], T * S * 0.08, 0, TAU); c.fill(); }); }
  function drawHead(c, P, P3, W, T, S, lw, hd, M, t) { const bt = M.bt || t, jaw = M.jaw || 0;
    // the antennae: long, curving forward and up, twitching
    [-1, 1].forEach(s => { const tw = Math.sin(bt * 4 + s) * 0.12, pts = [W(1.9, s * 0.15, 0.6), W(2.3, s * (0.32 + tw), 1.05), W(2.85, s * (0.55 + tw), 1.2), W(3.2, s * (0.6 + tw * 1.4), 0.95)].map(p => P3(p[0], p[1], p[2])); tubeLite(c, pts, u => T * S * (0.07 - u * 0.04), { col: NAVY, shade: NAVY_DK, hi: NAVY_HI, line: INK, lw: lw * 0.7, force: true }); c.fillStyle = GREEN_HI; c.beginPath(); c.arc(pts[3][0], pts[3][1], Math.max(1.2, T * S * 0.06), 0, TAU); c.fill(); });
    TN.ellipsoid(c, P3, hd, P.head, [0.44 * S, 0.5 * S, 0.44 * S], { T, col: NAVY, shade: NAVY_DK, hi: NAVY_HI, line: INK, lw, d1: 0.12, d2: 0.24, spec: 0.4, force: true });
    // the mandibles: two white hooks, opening and closing
    [-1, 1].forEach(s => { const o = 0.12 + jaw * 0.3, pts = [W(1.98, s * 0.2, 0.05), W(2.28, s * (0.18 + o), -0.08), W(2.42, s * (0.04 + o * 0.4), -0.18)].map(p => P3(p[0], p[1], p[2])); tubeLite(c, pts, u => T * S * (0.13 - u * 0.1), { col: SNOW, shade: SNOW_SH, hi: SNOW_HI, line: INK, lw: lw * 0.8, force: true }); });
    // the compound eyes: big, green, glossy, glowing
    [-1, 1].forEach(s => { const e = W(1.86, s * 0.33, 0.36), q = P3(e[0], e[1], e[2]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; blitSized(c, glowSprite(GREEN), q[0] - T * S * 0.6, q[1] - T * S * 0.6, T * S * 1.2, T * S * 1.2); c.restore();
      TN.ellipsoid(c, P3, hd, e, [0.22 * S, 0.17 * S, 0.27 * S], { T, col: GREEN, shade: '#2E8C6E', hi: GREEN_HI, line: INK, lw: lw * 0.8, d1: 0.14, d2: 0.26, spec: 0.95, force: true });
      c.fillStyle = 'rgba(10,40,30,.35)'; for (let k = 0; k < 5; k++) { const a = k * 1.3, r = T * S * 0.1; c.beginPath(); c.arc(q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r * 1.2, Math.max(0.8, T * S * 0.025), 0, TAU); c.fill(); } }); }
  // the tail: a long segmented tube, navy ringed in ice, barbed along its back; the stinger a long needle of ice
  function drawTail(c, P, P3, T, S, lw, M, t) { const pts = P.tl.map(p => P3(p[0], p[1], p[2])), n = pts.length, wf = u => T * S * (0.52 - 0.34 * u);
    tubeLite(c, pts, wf, { col: NAVY, shade: NAVY_DK, hi: NAVY_HI, line: INK, lw, force: true });
    // the segments: a plate of pale ice over each, a dark joint between, a barb off every other one
    for (let j = 0; j < n - 1; j++) { const a = pts[j], b = pts[j + 1], u0 = j / (n - 1), u1 = (j + 1) / (n - 1), A = [a[0] + (b[0] - a[0]) * 0.18, a[1] + (b[1] - a[1]) * 0.18], B = [a[0] + (b[0] - a[0]) * 0.82, a[1] + (b[1] - a[1]) * 0.82];
      if (j % 2 === 0) tubeLite(c, [A, [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], B], u => wf(u0 + (u1 - u0) * u) * 0.86, { col: j % 4 ? ICE : ICE_HI, shade: ICE_SH, hi: '#F2FAFF', line: INK, lw: lw * 0.8, force: true });
      if (j % 2 === 1) { const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, w = wf(u0) * 0.5, up = ny < 0 ? 1 : -1, p = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; c.fillStyle = ICE_HI; c.strokeStyle = INK; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(p[0] + nx * w * up * 0.8 - dx / d * T * 0.1, p[1] + ny * w * up * 0.8 - dy / d * T * 0.1); c.lineTo(p[0] + nx * w * up * 2.1 - dx / d * T * 0.3, p[1] + ny * w * up * 2.1 - dy / d * T * 0.3); c.lineTo(p[0] + nx * w * up * 0.8 + dx / d * T * 0.1, p[1] + ny * w * up * 0.8 + dy / d * T * 0.1); c.closePath(); c.fill(); c.stroke(); } }
    // the needle: from the last segment to the tip, long and sharp, its point glowing
    const a = pts[n - 1], tp = P3(P.tip[0], P.tip[1], P.tip[2]), dx = tp[0] - a[0], dy = tp[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, w = T * S * 0.2;
    TN.shape(c, TN.poly([[a[0] + nx * w, a[1] + ny * w], [a[0] + dx * 0.5 + nx * w * 0.55, a[1] + dy * 0.5 + ny * w * 0.55], tp, [a[0] + dx * 0.5 - nx * w * 0.55, a[1] + dy * 0.5 - ny * w * 0.55], [a[0] - nx * w, a[1] - ny * w]]), { col: ICE_HI, shade: ICE, hi: '#FFFFFF', line: INK, lw, r: w * 2, force: true });
    TN.shape(c, TN.ell(a[0], a[1], w * 1.25, w * 1.25), { col: NAVY, shade: NAVY_DK, hi: NAVY_HI, line: INK, lw, r: w, force: true });
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + (M.glow || 0.6) * 0.3 + 0.15 * Math.sin(t * 9); blitSized(c, glowSprite(GREEN_HI), tp[0] - T * 0.7, tp[1] - T * 0.7, T * 1.4, T * 1.4); c.restore();
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(tp[0], tp[1], Math.max(1.2, T * 0.05), 0, TAU); c.fill(); }
  /* a butterfly wing: its design drawn in the wing's own plane (the camera is affine, so the whole plane maps by one
     transform): a glowing ice-blue to aurora-green field, a navy border with white dots, veins and an eye-spot */
  function drawWing(c, P3, W, T, M, side, hind, lw, t, FX) {
    const flap = hind ? (M.flapH == null ? 0.3 : M.flapH) : (M.flapF == null ? 0.4 : M.flapF), sp = M.span == null ? 1 : M.span, cf = Math.cos(flap), sf = Math.sin(flap);
    const h0 = hind ? [0.5, side * 0.26, 0.4] : [0.82, side * 0.3, 0.52], span = [-0.2 - (hind ? 0.15 : 0), side * cf, sf], O = P3(...W(h0[0], h0[1], h0[2])), A = P3(...W(h0[0] + span[0], h0[1] + span[1], h0[2] + span[2])), B = P3(...W(h0[0] + 1, h0[1], h0[2]));
    const Us = [(A[0] - O[0]) * sp, (A[1] - O[1]) * sp], Uc = [(B[0] - O[0]) * (0.5 + 0.5 * sp), (B[1] - O[1]) * (0.5 + 0.5 * sp)], det = Us[0] * Uc[1] - Us[1] * Uc[0], OUT = hind ? HW : FW;
    const mapP = ([s, q]) => [O[0] + Us[0] * s + Uc[0] * q, O[1] + Us[1] * s + Uc[1] * q], scr = OUT.map(mapP), glow = M.glow == null ? 0.6 : M.glow;
    const cen = mapP(hind ? [1.2, -0.8] : [1.6, 0.25]), gr = Math.hypot(Us[0], Us[1]) * (hind ? 2.2 : 2.8) + T;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.28 + glow * 0.4) * (0.85 + 0.15 * Math.sin(t * 3 + side)); blitSized(c, glowSprite(GREEN), cen[0] - gr, cen[1] - gr * 0.8, gr * 2, gr * 1.6); c.restore();
    if (Math.abs(det) < T * T * 0.04) { c.beginPath(); TN.blob(scr)(c); c.fillStyle = TN.rgba(GREEN_HI, 0.8); c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); return; }
    const path = new Path2D(); TN.blob(OUT)(path);
    c.save(); c.transform(Us[0], Us[1], Uc[0], Uc[1], O[0], O[1]);
    const g = c.createRadialGradient(0.1, 0, 0.1, 0.4, hind ? -0.4 : 0.2, hind ? 2.4 : 3.2); g.addColorStop(0, '#2C5E8A'); g.addColorStop(0.3, ICE); g.addColorStop(0.62, GREEN); g.addColorStop(0.9, GREEN_HI); g.addColorStop(1, '#E8FFF4');
    c.globalAlpha = 0.95; c.fillStyle = g; c.fill(path); c.globalAlpha = 1;
    c.save(); c.clip(path);
    // veins from the root
    c.strokeStyle = 'rgba(23,44,77,.55)'; c.lineWidth = 0.05; OUT.forEach(([s, q], i) => { if (i % 2) return; c.beginPath(); c.moveTo(0.05, 0); c.quadraticCurveTo(s * 0.45, q * 0.2, s * 0.92, q * 0.92); c.stroke(); });
    // the eye-spot
    const es = hind ? [1.3, -1.0, 0.36] : [2.0, 0.35, 0.48]; [[NAVY, 1], [GREEN_HI, 0.74], [ICE_HI, 0.5], [NAVY, 0.3], ['#FFFFFF', 0.13]].forEach(([col, k]) => { c.fillStyle = col; c.beginPath(); c.arc(es[0], es[1], es[2] * k, 0, TAU); c.fill(); });
    // the luminous pulse over the field
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, glow * 0.28) * (0.75 + 0.25 * Math.sin(t * 4 + (hind ? 1 : 0))); c.fillStyle = GREEN_HI; c.fill(path); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    // the navy border, with white dots along it
    c.lineJoin = 'round'; c.lineWidth = 0.5; c.strokeStyle = NAVY; c.stroke(path); c.lineWidth = 0.12; c.strokeStyle = 'rgba(51,80,126,.9)'; c.stroke(path);
    const cx = OUT.reduce((a, p) => a + p[0], 0) / OUT.length, cq = OUT.reduce((a, p) => a + p[1], 0) / OUT.length; c.fillStyle = '#FFFFFF';
    for (let i = 0; i < OUT.length; i++) { const p0 = OUT[i], p1 = OUT[(i + 1) % OUT.length], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, dx = cx - mx, dy = cq - my, d = Math.hypot(dx, dy) || 1; if (Math.hypot(mx, my) < 0.5) continue; c.beginPath(); c.arc(mx + dx / d * 0.14, my + dy / d * 0.14, 0.055, 0, TAU); c.fill(); }
    c.restore(); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; c.beginPath(); TN.blob(scr)(c); c.strokeStyle = TN.rgba(GREEN_HI, Math.min(0.8, 0.25 + glow * 0.3)); c.lineWidth = Math.max(3, T * 0.22); c.lineJoin = 'round'; c.stroke(); c.restore();
    c.beginPath(); TN.blob(scr)(c); c.strokeStyle = INK; c.lineWidth = lw; c.lineJoin = 'round'; c.stroke(); }

  /* ---------- the windbreaks ---------- */
  function drawWindbreak(c, FX, p, T, t) { const w = p.wb; if (!w) return; if (w.kind === 'pillar') drawPillar(c, FX, w, T, t); else drawWall(c, FX, w, T, t); }
  function drawPillar(c, FX, w, T, t) { const X = FX.sx(w.x), Y = FX.sy(w.y) + T * 0.35, r = w.r * T * 1.05, ry = r * 0.42, h = PH * T, lw = Math.max(1.3, T * 0.065), mk = w.mark ? 0.5 + 0.5 * Math.sin(t * 8) : 0;
    c.fillStyle = 'rgba(4,10,24,.45)'; c.beginPath(); c.ellipse(X + r * 0.25, Y + ry * 0.3, r * 1.4, ry * 1.25, 0, 0, TAU); c.fill();
    const A = [Math.PI, 2.25, 1.05, 0], HK = [0.95, 1.0, 0.92, 0.97], bot = A.map(a => [X + Math.cos(a) * r, Y + Math.sin(a) * ry]), top = A.map((a, i) => [X + Math.cos(a) * r * 0.86, Y - h * HK[i] + Math.sin(a) * ry * 0.86]);
    const face = (i, col, sh, hi) => TN.shape(c, TN.poly([bot[i], bot[i + 1], top[i + 1], top[i]]), { col, shade: sh, hi, line: INK, lw, r: r * 0.7, d1: 0.08, d2: 0.18, spec: false, force: true, inner: g => {
      // strata: darker bands of the stone under the ice, and frost rime on the wind (north) side
      g.strokeStyle = 'rgba(23,44,77,.28)'; g.lineWidth = T * 0.08; for (let k = 1; k < 5; k++) { const yy = Y - h * k / 5.2; g.beginPath(); g.moveTo(X - r * 1.2, yy + Math.sin(k * 2 + i) * T * 0.08); g.lineTo(X + r * 1.2, yy - Math.cos(k + i) * T * 0.08); g.stroke(); } } });
    face(0, '#C4DDEA', '#93B6CB', '#F2FAFF'); face(1, ICE, ICE_SH, ICE_HI); face(2, '#4F7896', '#36597A', '#6E98B6');
    // a bright edge down each corner
    c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = Math.max(1, lw * 0.6); [1, 2].forEach(i => { c.beginPath(); c.moveTo(bot[i][0], bot[i][1] - T * 0.1); c.lineTo(top[i][0], top[i][1] + T * 0.15); c.stroke(); });
    // bevelled wedges of ice leaning at its foot
    [[-0.85, 0.7, -0.35], [0.7, 0.55, 0.3], [0.1, 0.45, 0.1]].forEach(([u, s, lean], k) => { const bx = X + u * r, by = Y + ry * (0.35 + k * 0.15), hh = T * (0.9 + s), ww = T * 0.42 * (1 + s * 0.4); TN.shape(c, TN.poly([[bx - ww, by], [bx + lean * T - ww * 0.15, by - hh], [bx + ww * 0.25 + lean * T, by - hh * 0.82], [bx + ww, by]]), { col: k === 2 ? ICE_HI : '#A9CCE0', shade: ICE_SH, hi: '#FFFFFF', line: INK, lw, r: ww, d1: 0.1, d2: 0.22, spec: 0.5, specAt: [bx - ww * 0.3, by - hh * 0.6], force: true }); });
    // the marked pillar: cracks spreading, glowing
    if (w.crack > 0.02) { const R = mulberry32(31 + w.i), n = Math.ceil(9 * w.crack); c.save(); c.lineCap = 'round'; for (let k = 0; k < n; k++) { let x = X + (R() - 0.5) * r * 1.4, y = Y - R() * h * 0.9; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R() - 0.5) * T * 0.7; y += (R() - 0.4) * T * 0.7; c.lineTo(x, y); } c.strokeStyle = INK; c.lineWidth = T * 0.12; c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TN.rgba(WARN, 0.6 + 0.4 * mk); c.lineWidth = T * 0.07; c.stroke(); c.globalCompositeOperation = 'source-over'; } c.restore(); }
    // the broad cap of snow on its crown, overhanging, with two soft lobes down the front
    const tc = [X, Y - h * 0.98]; TN.shape(c, TN.blob([[tc[0] - r * 1.08, tc[1] + ry * 0.2], [tc[0] - r * 0.85, tc[1] - ry * 1.2], [tc[0] - r * 0.1, tc[1] - ry * 1.65], [tc[0] + r * 0.8, tc[1] - ry * 1.25], [tc[0] + r * 1.08, tc[1] + ry * 0.1], [tc[0] + r * 0.62, tc[1] + ry * 0.95], [tc[0] + r * 0.32, tc[1] + ry * 1.8], [tc[0] + r * 0.05, tc[1] + ry * 0.95], [tc[0] - r * 0.45, tc[1] + ry * 1.25], [tc[0] - r * 0.75, tc[1] + ry * 0.7]]), { col: '#F4F9FB', shade: '#B9D0DE', hi: '#FFFFFF', line: INK, lw, r, d1: 0.08, d2: 0.16, spec: 0.6, specAt: [tc[0] - r * 0.4, tc[1] - ry * 0.8], force: true });
    if (w.mark) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.35 * mk; blitSized(c, glowSprite(WARN), X - r * 2, Y - h * 0.8 - r * 2, r * 4, r * 4); c.restore(); } }
  function drawWall(c, FX, w, T, t) { const lw = Math.max(1.3, T * 0.065), k = w.k == null ? 1 : w.k;
    // rubble: four broken blocks, dropping into place as it settles, each with a cap of snow
    [[-1.5, 1.05, -0.12], [-0.5, 1.3, 0.08], [0.5, 1.15, -0.06], [1.5, 0.9, 0.15]].forEach(([u, hh, tilt], i) => { const kk = clamp(k * 1.6 - i * 0.18, 0, 1), X = FX.sx(w.x + u), Y = FX.sy(w.y) + T * 0.3 - (1 - easeOut(kk)) * T * 3, H = hh * T, ww = T * 0.55;
      if (kk <= 0) return; c.save(); c.globalAlpha = Math.min(1, kk * 2); c.translate(X, Y); c.rotate(tilt);
      c.fillStyle = 'rgba(4,10,24,.35)'; c.beginPath(); c.ellipse(T * 0.1, T * 0.05, ww * 1.15, T * 0.22, 0, 0, TAU); c.fill();
      TN.shape(c, TN.poly([[-ww, 0], [-ww * 0.9, -H * 0.9], [-ww * 0.2, -H], [ww * 0.85, -H * 0.82], [ww, 0]]), { col: i % 2 ? ICE : '#A9CCE0', shade: ICE_SH, hi: ICE_HI, line: INK, lw, r: ww, d1: 0.1, d2: 0.22, spec: 0.4, specAt: [-ww * 0.4, -H * 0.6], force: true });
      TN.shape(c, TN.blob([[-ww * 1.0, -H * 0.85], [-ww * 0.5, -H * 1.12], [ww * 0.3, -H * 1.1], [ww * 0.95, -H * 0.82], [ww * 0.4, -H * 0.72], [-ww * 0.4, -H * 0.74]]), { col: '#F4F9FB', shade: '#B9D0DE', hi: '#FFFFFF', line: INK, lw, r: ww, d1: 0.08, d2: 0.16, spec: false, force: true });
      c.restore(); }); }
  /* the empty husk: the three legs folding down where the cocoon hung, the broken cup of the shell under them */
  function drawHusk(c, FX, p, T, t) { p.t = (p.t || 0) + 1 / 60; const u = easeOut(clamp(p.t / 1.6, 0, 1)), lw = Math.max(1.3, T * 0.065), X = FX.sx(p.bx), Y = FX.sy(p.by), m = { x: p.bx, y: p.by }, P3 = TN.cam(X, Y, T, m), apex = [p.bx, p.by, lerp(p.apex, 0.5, u)], Mh = { topple: 0, scrape: 0 };
    const a = clamp(1 - (p.t - 7) / 2.5, 0, 1); if (a <= 0) return;
    for (let i = 0; i < 3; i++) { const f = p.feet[i], fx = lerp(f[0], p.bx + (f[0] - p.bx) * 1.25, u), fy = lerp(f[1], p.by + (f[1] - p.by) * 1.25, u), pts = legPts(i, [fx, fy, 0], apex, p.hd, Mh).map(q => [q[0], q[1], q[2] * (1 - u * 0.85)]); drawLeg(c, P3, pts, T, lw, i, t, Mh, { alpha: a }); } }

  /* ---------- the cave: ground, backdrop, and what lies on the ice ---------- */
  function paintFloor(c, A) { const R = A.R, rnd = A.rnd;
    // the cave walls beyond the floor: dark ice
    c.fillStyle = '#081222'; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    // the floor: flat dark glacier ice (the telegraphs read on it), a little lighter toward the mouth in the north
    let g = c.createRadialGradient(0, -R * 0.4, R * 0.1, 0, 0, R); g.addColorStop(0, '#1E3352'); g.addColorStop(0.6, '#172A45'); g.addColorStop(1, '#12223A'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.fill();
    // large sheets of ice, each a shade apart, cracks between them
    for (let i = 0; i < 38; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 1.5), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 1.4 + rnd() * 2.2; c.fillStyle = rnd() < 0.5 ? 'rgba(134,183,208,.05)' : 'rgba(4,10,24,.12)'; c.beginPath(); for (let k = 0; k < 6; k++) { const aa = k / 6 * TAU + rnd() * 0.5, rr = r * (0.75 + rnd() * 0.4); k ? c.lineTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr * 0.8) : c.moveTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr * 0.8); } c.closePath(); c.fill(); }
    c.strokeStyle = 'rgba(160,200,225,.12)'; c.lineWidth = 0.05; for (let i = 0; i < 22; i++) { let x = (rnd() - 0.5) * R * 1.8, y = (rnd() - 0.5) * R * 1.8; if (Math.hypot(x, y) > R - 1) continue; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rnd() - 0.5) * 2.2; y += (rnd() - 0.5) * 2.2; c.lineTo(x, y); } c.stroke(); }
    // the wind's tracks: long faint streaks of blown snow running south from the mouth
    c.lineCap = 'round'; for (let i = 0; i < 26; i++) { const x = (rnd() - 0.5) * R * 1.7, y = -R + rnd() * R * 1.4, L = 1.5 + rnd() * 3.5; if (Math.hypot(x, y) > R - 1) continue; c.strokeStyle = `rgba(228,237,240,${0.04 + rnd() * 0.05})`; c.lineWidth = 0.08 + rnd() * 0.12; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 0.2, y + L / 2, x + (rnd() - 0.5) * 0.3, y + L); c.stroke(); }
    // frost round the feet of the two pillars
    [[-5, -2], [5, -2]].forEach(([x, y]) => { const gg = c.createRadialGradient(x, y + 0.3, 0.6, x, y + 0.3, 2.6); gg.addColorStop(0, 'rgba(207,232,244,.35)'); gg.addColorStop(1, 'rgba(207,232,244,0)'); c.fillStyle = gg; c.beginPath(); c.ellipse(x, y + 0.3, 2.6, 2.0, 0, 0, TAU); c.fill(); });
    // the rim: big bevelled wedges of ice, and broad smooth drifts of snow over them (deepest at the mouth)
    for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + rnd() * 0.1, r0 = R - 0.1, r1 = R + 1.4, w = 0.11 + rnd() * 0.05, lit = Math.sin(a + 0.8) < 0;
      const p = [[Math.cos(a - w) * r0, Math.sin(a - w) * r0], [Math.cos(a) * (r0 - 0.5 - rnd() * 0.4), Math.sin(a) * (r0 - 0.5 - rnd() * 0.4)], [Math.cos(a + w) * r0, Math.sin(a + w) * r0], [Math.cos(a + w) * r1, Math.sin(a + w) * r1], [Math.cos(a - w) * r1, Math.sin(a - w) * r1]];
      c.fillStyle = lit ? '#5F8EAE' : '#2C4E70'; c.beginPath(); p.forEach(([x, y], k) => k ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill(); c.strokeStyle = 'rgba(207,232,244,.45)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.lineTo(p[2][0], p[2][1]); c.stroke(); }
    // giant crystal trees of ice standing round the wall (the rift's own icetree, drawn at metre scale)
    if (typeof DunWorld !== 'undefined' && DunWorld.PROPS.icetree) { const trees = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + rnd() * 0.12, r = R + 0.5 + rnd() * 0.5; if (Math.sin(a) > 0.2) continue; trees.push({ x: Math.cos(a) * r, y: Math.sin(a) * r, k: 0.75 + rnd() * 0.45, v: i }); }
      trees.sort((p, q) => p.y - q.y).forEach(t => { c.save(); c.translate(t.x, t.y); c.scale(1 / 40, 1 / 40); DunWorld.PROPS.icetree(c, 40 * t.k, t.v); c.restore(); }); }
    c.strokeStyle = 'rgba(6,12,24,.6)'; c.lineWidth = 0.25; c.beginPath(); c.arc(0, 0, R + 1.45, 0, TAU); c.stroke(); }
  function paintCave(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#050B18'); g.addColorStop(0.45, '#0B1A33'); g.addColorStop(1, '#0A1628'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(53);
    // the crack in the ceiling: night sky, stars and the aurora's green curtains
    c.save(); c.beginPath(); c.moveTo(W * 0.1, 0); for (let i = 0; i <= 12; i++) { const x = W * (0.1 + i / 12 * 0.8); c.lineTo(x, H * (0.1 + Math.sin(i * 1.7) * 0.03 + (i % 2) * 0.03)); } c.lineTo(W * 0.9, 0); c.closePath(); c.clip();
    c.fillStyle = '#081A30'; c.fillRect(0, 0, W, H * 0.3); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 50; i++) { c.globalAlpha = 0.3 + R() * 0.6; c.beginPath(); c.arc(R() * W, R() * H * 0.16, 0.5 + R(), 0, TAU); c.fill(); } c.globalAlpha = 1;
    c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { c.strokeStyle = TN.rgba(k % 2 ? GREEN : GREEN_HI, 0.16); c.lineWidth = 18 + k * 6; c.beginPath(); for (let x = 0; x <= W; x += 12) { const y = H * (0.04 + k * 0.025) + Math.sin(x * 0.012 + k * 1.3) * H * 0.03; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); } c.restore();
    // the far walls of the cave: great bevelled wedges of ice, broad caps of snow on them
    for (let i = 0; i < 9; i++) { const x = W * (i + 0.5) / 9 + (R() - 0.5) * 20, w = W * 0.09 + R() * W * 0.05, top = H * (0.16 + R() * 0.12), base = H * 0.55;
      c.fillStyle = '#16304F'; c.beginPath(); c.moveTo(x - w, base); c.lineTo(x - w * 0.5, top); c.lineTo(x, top - H * 0.02); c.lineTo(x, base); c.closePath(); c.fill(); c.fillStyle = '#0E2340'; c.beginPath(); c.moveTo(x, top - H * 0.02); c.lineTo(x + w * 0.6, top + H * 0.03); c.lineTo(x + w, base); c.lineTo(x, base); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(134,183,208,.35)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x - w * 0.5, top); c.lineTo(x, top - H * 0.02); c.lineTo(x + w * 0.6, top + H * 0.03); c.stroke();
      c.fillStyle = 'rgba(228,237,240,.55)'; c.beginPath(); c.moveTo(x - w * 0.55, top + 3); c.quadraticCurveTo(x, top - H * 0.035, x + w * 0.62, top + H * 0.03 + 3); c.quadraticCurveTo(x, top + H * 0.02, x - w * 0.55, top + 3); c.fill(); }
    // icicles hanging from the cave's lip
    for (let i = 0; i < 22; i++) { const x = R() * W, L = H * (0.04 + R() * 0.09), w = 4 + R() * 7, y0 = H * (0.12 + Math.sin(x * 0.02) * 0.02); c.fillStyle = R() < 0.5 ? '#2C5476' : '#3E6A8E'; c.beginPath(); c.moveTo(x - w, y0); c.lineTo(x + w, y0); c.lineTo(x + w * 0.1, y0 + L); c.closePath(); c.fill(); c.fillStyle = 'rgba(207,232,244,.35)'; c.beginPath(); c.moveTo(x - w, y0); c.lineTo(x - w * 0.3, y0); c.lineTo(x + w * 0.1, y0 + L); c.closePath(); c.fill(); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; blitSized(c, glowSprite(GREEN), W * 0.2, -H * 0.1, W * 0.6, H * 0.35); c.restore(); }
  /* on the ice (under everything that stands): the shell's fallen plates, the lees when the wind carries something,
     the hail's patches, the collar's ring going out, the ice cracked round a stuck stinger, the marked pillar */
  function drawOverlay(c, FX, t, T) { const M = FX.mem; if (!M || !M.wb) return; const sx = FX.sx, sy = FX.sy;
    // the shell's plates where they fell
    for (const s of M.shards) if (s.land) drawShard(c, sx(s.x), sy(s.y), s, T, Math.min(1, (40 - s.t) / 3), true);
    // the stinger's hole: cracks radiating in the ice
    if (M.stuckAt && M.cracks) { const X = sx(M.stuckAt[0]), Y = sy(M.stuckAt[1]); c.save(); c.lineCap = 'round'; M.cracks.forEach(L => { c.beginPath(); L.forEach(([x, y], i) => i ? c.lineTo(X + x * T, Y + y * T * 0.6) : c.moveTo(X + x * T, Y + y * T * 0.6)); c.strokeStyle = 'rgba(4,10,24,.8)'; c.lineWidth = T * 0.1; c.stroke(); c.strokeStyle = TN.rgba(ICE_HI, 0.8); c.lineWidth = T * 0.04; c.stroke(); }); c.restore(); }
    // the marked pillar: a warning ring on the ice round its foot
    M.wb.forEach(w => { if (!w.mark) return; const X = sx(w.x), Y = sy(w.y), k = 0.5 + 0.5 * Math.sin(t * 8); c.save(); c.strokeStyle = TN.rgba(WARN, 0.5 + 0.4 * k); c.lineWidth = Math.max(2, T * 0.12); c.setLineDash([T * 0.4, T * 0.25]); c.lineDashOffset = -t * T * 2; c.beginPath(); c.ellipse(X, Y + T * 0.2, T * 2.0, T * 1.2, 0, 0, TAU); c.stroke(); c.restore(); });
    // the collar building: frost spreading on the ice under it, and the ring's two gaps lit green, named
    if (M.cl && !M.cl.let && M.cl.tele && FX.m) { const s2 = M.cl.tele, X = sx(s2.x), Y = sy(s2.y), u = clamp(s2.age / s2.t, 0, 1), fr = (1.4 + 1.6 * (M.collar || 0)) * T; c.save();
      const gg = c.createRadialGradient(X, Y, fr * 0.2, X, Y, fr); gg.addColorStop(0, 'rgba(228,237,240,.55)'); gg.addColorStop(0.7, 'rgba(207,232,244,.3)'); gg.addColorStop(1, 'rgba(207,232,244,0)'); c.fillStyle = gg; c.beginPath(); c.ellipse(X, Y, fr, fr * 0.8, 0, 0, TAU); c.fill();
      s2.gaps.forEach(([a, w]) => { const r0 = s2.r0 * T, r1 = s2.r1 * T; c.beginPath(); c.arc(X, Y, r1, a - w, a + w); c.arc(X, Y, r0, a + w, a - w, true); c.closePath(); c.fillStyle = TN.rgba(GREEN, 0.18 + 0.1 * u); c.fill(); c.strokeStyle = TN.rgba(GREEN_HI, 0.8); c.lineWidth = Math.max(2, T * 0.08); c.setLineDash([T * 0.3, T * 0.18]); c.lineDashOffset = -t * T; c.stroke(); c.setLineDash([]);
        const lx = X + Math.cos(a) * (r0 + r1) * 0.32, ly = Y + Math.sin(a) * (r0 + r1) * 0.32; c.font = `900 ${Math.round(T * 0.36)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(4,20,16,.7)'; c.strokeText('GAP', lx, ly); c.fillStyle = '#E8FFF4'; c.fillText('GAP', lx, ly); });
      c.restore(); }
    // the hail's patches (or the whole cave, for the great hail), filling as it nears
    const Hl = M.hail; if (Hl && !Hl.done) { const u = clamp(Hl.age / Hl.wait, 0, 1); c.save();
      if (Hl.all) { const X = sx(FX.C.x), Y = sy(FX.C.y); c.globalAlpha = 0.16 + u * 0.2; c.fillStyle = ICE_HI; c.beginPath(); c.arc(X, Y, (AR - 0.1) * T, 0, TAU); c.fill(); c.globalAlpha = 1; c.strokeStyle = TN.rgba('#FFFFFF', 0.5 + 0.4 * Math.sin(t * 12) * u); c.lineWidth = 4; c.setLineDash([T * 0.5, T * 0.3]); c.lineDashOffset = t * T; c.stroke(); c.setLineDash([]);
        c.fillStyle = TN.rgba('#FFFFFF', 0.35 + 0.3 * u); for (let gx = -AR; gx <= AR; gx += 3.2) for (let gy = -AR; gy <= AR; gy += 3.2) { const ox = gx + ((Math.round(gy / 3.2) % 2) ? 1.6 : 0); if (Math.hypot(ox, gy) > AR - 1) continue; const px = X + ox * T, py = Y + gy * T; for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + t * 1.5; c.beginPath(); c.arc(px + Math.cos(a) * T * 0.22, py + Math.sin(a) * T * 0.22, T * 0.08, 0, TAU); c.fill(); } } }
      else Hl.patches.forEach(o => { const X = sx(o.x), Y = sy(o.y), r = o.r * T; c.fillStyle = TN.rgba(ICE_HI, 0.1 + u * 0.2); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); c.strokeStyle = TN.rgba('#FFFFFF', 0.55 + 0.35 * Math.sin(t * 14) * u); c.lineWidth = 2 + u * 2; c.setLineDash([T * 0.35, T * 0.2]); c.lineDashOffset = t * T; c.stroke(); c.setLineDash([]); c.strokeStyle = TN.rgba(ICE_HI, 0.7); c.lineWidth = 2; c.beginPath(); c.arc(X, Y, Math.max(1, r * (1 - u)), 0, TAU); c.stroke();
        // a hailstone glyph at the middle
        c.fillStyle = TN.rgba('#FFFFFF', 0.5 + 0.3 * u); for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + t; c.beginPath(); c.arc(X + Math.cos(a) * T * 0.35, Y + Math.sin(a) * T * 0.35, T * 0.12, 0, TAU); c.fill(); } });
      c.restore(); }
    // the lees: green, from whichever way the wind comes now
    if (M.leeK > 0.02) { const src = M.leeSrc || { a: WIND }; const list = Hl && Hl.all ? [Hl.safe] : shelters(M); c.save();
      list.forEach(w => { if (!w) return; const P = leePoly(w, src).map(([x, y]) => [sx(x), sy(y)]); c.globalAlpha = M.leeK; c.beginPath(); TN.poly(P)(c); c.fillStyle = TN.rgba(GREEN, 0.26 + 0.08 * Math.sin(t * 4)); c.fill(); c.strokeStyle = TN.rgba(GREEN_HI, 0.85); c.lineWidth = Math.max(2, T * 0.08); c.setLineDash([T * 0.3, T * 0.18]); c.lineDashOffset = -t * T; c.stroke(); c.setLineDash([]);
        const cx = (P[1][0] + P[2][0] + P[0][0] + P[3][0]) / 4, cy = (P[1][1] + P[2][1] + P[0][1] + P[3][1]) / 4; c.font = `900 ${Math.round(T * 0.36)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(4,20,16,.7)'; c.strokeText('SHELTER', cx, cy); c.fillStyle = '#E8FFF4'; c.fillText('SHELTER', cx, cy); });
      // the great hail: the pillar it will break is no shelter
      if (Hl && Hl.all && M.ram) { const w = M.ram.w, P = leePoly(Object.assign({}, w, { kind: 'pillar' }), src).map(([x, y]) => [sx(x), sy(y)]); c.globalAlpha = M.leeK * 0.9; c.beginPath(); TN.poly(P)(c); c.strokeStyle = TN.rgba(WARN, 0.8); c.lineWidth = Math.max(2, T * 0.07); c.setLineDash([T * 0.2, T * 0.2]); c.stroke(); c.setLineDash([]); const cx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, cy = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4; c.font = `900 ${Math.round(T * 0.32)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3; c.strokeStyle = 'rgba(30,6,4,.7)'; c.strokeText('NOT SAFE', cx, cy); c.fillStyle = '#FFE0D8'; c.fillText('NOT SAFE', cx, cy); }
      c.restore(); }
    // the collar's ring going out: a band of ice spikes, the gaps left open (and lit green)
    const Wv = M.wave; if (Wv) { const X = sx(Wv.x), Y = sy(Wv.y), r = Wv.r * T, gs = Wv.gaps.map(([a, w]) => [a - w, a + w]).sort((p, q) => p[0] - q[0]); c.save(); c.lineCap = 'round';
      const arcs = []; for (let i = 0; i < gs.length; i++) { const nx = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); arcs.push([gs[i][1], nx]); }
      arcs.forEach(([a0, a1]) => { c.beginPath(); c.arc(X, Y, r, a0, a1); c.strokeStyle = 'rgba(4,10,24,.6)'; c.lineWidth = T * 0.7; c.stroke(); c.strokeStyle = ICE_HI; c.lineWidth = T * 0.45; c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.12; c.stroke();
        for (let a = a0 + 0.05; a < a1; a += 0.9 / Math.max(1, Wv.r)) { const px = X + Math.cos(a) * r, py = Y + Math.sin(a) * r; c.fillStyle = ICE_HI; c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px - T * 0.15, py); c.lineTo(px + Math.cos(a) * T * 0.15, py - T * 0.6); c.lineTo(px + T * 0.15, py); c.closePath(); c.fill(); c.stroke(); } });
      c.globalCompositeOperation = 'lighter'; Wv.gaps.forEach(([a, w]) => { c.beginPath(); c.arc(X, Y, r, a - w, a + w); c.strokeStyle = TN.rgba(GREEN_HI, 0.45); c.lineWidth = T * 0.3; c.stroke(); }); c.restore(); } }
  // a plate of the shell: a curved white piece with a navy seam along it
  function drawShard(c, X, Y, s, T, a, flat) { if (a <= 0) return; const r = s.s * T; c.save(); c.globalAlpha = a; c.translate(X, Y); c.rotate(s.rot); if (flat) c.scale(1, 0.55);
    c.beginPath(); c.moveTo(-r, -r * 0.2); c.quadraticCurveTo(0, -r * 0.9, r, -r * 0.3); c.lineTo(r * 0.7, r * 0.15); c.lineTo(r * 0.2, r * 0.05); c.lineTo(-r * 0.3, r * 0.3); c.lineTo(-r * 0.75, r * 0.1); c.closePath(); c.fillStyle = SNOW; c.fill(); c.strokeStyle = INK; c.lineWidth = Math.max(1.2, T * 0.05); c.stroke();
    c.fillStyle = 'rgba(166,192,210,.8)'; c.beginPath(); c.moveTo(-r * 0.75, r * 0.1); c.lineTo(-r * 0.3, r * 0.3); c.lineTo(r * 0.2, r * 0.05); c.lineTo(r * 0.7, r * 0.15); c.quadraticCurveTo(0, -r * 0.15, -r * 0.75, r * 0.1); c.fill();
    if (s.seam) { c.strokeStyle = NAVY; c.lineWidth = T * 0.12; c.beginPath(); c.moveTo(-r * 0.3, -r * 0.48); c.quadraticCurveTo(0, -r * 0.1, r * 0.15, r * 0.02); c.stroke(); }
    c.restore(); }
  function crackPattern(seed) { const R = mulberry32(seed), out = []; for (let k = 0; k < 7; k++) { let x = 0, y = 0; const a0 = k / 7 * TAU + R() * 0.5, L = [[0, 0]]; for (let j = 0; j < 4; j++) { const a = a0 + (R() - 0.5) * 0.9; x += Math.cos(a) * (0.3 + R() * 0.3); y += Math.sin(a) * (0.3 + R() * 0.3); L.push([x, y]); } out.push(L); } return out; }
  /* ---------- in the air: the hail coming down, the shell's plates flying, the gale's frost, the labels ---------- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.wb) return; const sx = FX.sx, sy = FX.sy;
    // the hail: stones slanting down with the wind; over a lee they burst on the windbreak's top
    if (M.hailFx.length) { c.save(); c.lineCap = 'round';
      for (const h of M.hailFx) { const u = clamp(h.t / h.d, 0, 1), X = sx(h.x), Y = sy(h.y), H0 = 9 * T, ox = -Math.cos(h.a) * 3 * T, oy = -Math.sin(h.a) * 1.2 * T;
        if (u >= 1) { const k = 1 - (h.t - h.d) / 0.25; if (h.cut) continue; c.strokeStyle = TN.rgba('#FFFFFF', 0.7 * k); c.lineWidth = 1.5; c.beginPath(); c.ellipse(X, Y, T * 0.3 * (1.5 - k), T * 0.12 * (1.5 - k), 0, 0, TAU); c.stroke(); continue; }
        if (h.cut && u > 1 - h.cut) continue;
        const px = X + ox * (1 - u), py = Y + oy * (1 - u) - H0 * (1 - u); c.strokeStyle = 'rgba(207,232,244,.45)'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.moveTo(px - ox * 0.12, py - oy * 0.12 - H0 * 0.12); c.lineTo(px, py); c.stroke(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(px, py, Math.max(1.6, T * 0.09), 0, TAU); c.fill(); }
      c.restore(); }
    // the shell's plates in flight
    for (const s of M.shards) if (!s.land) { drawShard(c, sx(s.x), sy(s.y) - s.z * T, s, T, 1, false); }
    // the gale: frost blown off the wings in long streaks down the wind
    const G = M.gale; if (G && G.blowing && G.age < G.end + 0.3) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const n = 26;
      for (let i = 0; i < n; i++) { const ph = ((t * 1.6 + i * 0.37) % 1), off = ((i * 0.618) % 1 - 0.5) * 1.1, a = G.ga + off * 1.0, d = 1 + ph * 18, x = G.x + Math.cos(a) * d, y = G.y + Math.sin(a) * d, X = sx(x), Y = sy(y) - (2.4 - ph * 1.8) * T; if (!FX.inArena(x, y, 0.5)) continue;
        c.strokeStyle = TN.rgba(i % 3 ? GREEN_HI : '#FFFFFF', 0.35 * (1 - ph)); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.moveTo(X, Y); c.lineTo(X - Math.cos(a) * T * 1.2, Y - Math.sin(a) * T * 1.2); c.stroke(); }
      c.restore(); }
    // the labels: the collar to shatter, the bare weak points
    const lab = (X, Y, s, col) => { c.save(); c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, X, Y); c.fillText(s, X, Y); c.restore(); };
    if (M.collarObj && !M.collarObj.dead) { const o = M.collarObj, f = clamp(o.hp / o.maxhp, 0, 1), X = sx(o.x), Y = sy(o.y); c.save(); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.arc(X, Y - T * 0.3, T * 0.55, 0, TAU); c.stroke(); c.strokeStyle = ICE_HI; c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); c.arc(X, Y - T * 0.3, T * 0.55, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); c.restore(); lab(X, Y + T * 1.1, 'FROST COLLAR · shatter it', '#E8F8FF'); }
    if (m.stunT > 0) { const w = FX.S.weak.eye || FX.S.weak.sting; if (w && !w.dead) lab(sx(w.x), sy(w.y) - T * 1.5, M.stunKind === 'stuck' ? 'STING-ROOT · strike it' : 'EYE · strike it', GREEN_HI); } }
})());
