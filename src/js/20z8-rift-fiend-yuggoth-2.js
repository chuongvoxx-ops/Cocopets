/* ---------- IX-VORRA THE LIVING CONDUCTOR ----------
   The Yuggoth Engine's second boss, fought in the Capacitor Hall of the Coolant Vaults: a round steel hall twenty-eight
   metres across, its deck cut by four straight channels of glowing teal coolant (two each way, a grid like a hash sign),
   a copper bus rail running round it, and on that rail four capacitor pylons, black masts ringed with coils, each
   crowned with a glass cap of violet plasma.
   Ix-Vorra floats over it, six metres across: a heavy ring of dark segmented metal turning slowly round a core, a ball of
   boiling violet plasma crowded with glassy eyes that blink out of time with one another; long copper cables trail
   beneath it like a jellyfish's, dragging sparks across the deck; arcs of current leap the gaps between the ring's
   segments.
   Arc Web: it links beams of current between the pylons (and itself) in a pattern shown first as dashed lines, then
   live and crackling: get off them. In the second phase the web turns round the hall along the bus rail.
   Grounding Surge: it plunges its cables into the coolant and every channel goes live after a shown warning: stand on
   dry steel. Standing in coolant when it surges hurts badly.
   Cable Lash: its cables sweep a shown arc (twice in the second phase, the second aimed afresh).
   Overload (its stagger): one pylon glows OVERCHARGING while it drains the pylon's power, a meter filling round the cap.
   Break that cap (it has its own health) before the meter fills and the feedback OVERLOADS it: STAGGERED, the ring
   stops and parts and the core of eyes is bared for a heavy blow. Fail and it looses a great shown nova. The caps
   re-form for the next cycle.
   The Split Ring (from half health): the ring splits into two rings turning against each other, violet and teal, each
   throwing two beam spokes across the hall: a spinning laser to dodge through or ride the gap of; everything else comes
   faster, and coil sentries and spark mites gather.
   It is never still: the ring turns and tilts, the eyes dart and blink, the cables sway and drag, the plasma boils,
   current jumps the gaps; it recoils from a blow, and it comes down out of the dark of the vault on entering, its ring
   spinning up and its eyes opening one by one. */
RiftFiend.define({ id: 'ixvorra', name: 'Ix-Vorra', title: 'The Living Conductor', color: '#2A2F3E', glow: '#C452FF', accent: '#E8B8FF', biome: 'coolant', r: 2.8, els: ['spark', 'water'], phases: 2 }, (() => {
  const { TAU, TN, hit } = RiftFiend;
  const { INK, HULL, HULL_HI, VIOLET, VIOLET_HI, TEAL, TEAL_HI, AMBER } = YUG;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const nrm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const hr = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const segD = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return Math.hypot(px - ax - dx * u, py - ay - dy * u); };
  const FX0 = DunFiend.KIT, mixC = FX0.mixC, rgba = FX0.rgba;
  const LINE = '#0E1018', COPPER = '#B06A34', COPPER_HI = '#F2B57A', COPPER_SH = '#6E3C1C', PLASMA = '#B040F0', PLASMA_SH = '#7A22C0', PLASMA_DK = '#2A0846', STEEL = '#3E5566';
  const ARENA = 14, PR = 9.5, CH = 4.5, CW = 2.0, ALT = 3.5, RC = 1.42, RR = 3.05, BW = 0.62, BH = 0.27, NSEG = 10, NC = 6, NP = 10, SL = 0.62, CAP_Z = 4.15, CON_Z = 0.55, BEAM = 1.1, SPOKE = 1.0;
  const PA = [Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4];   // the pylons, on the bus rail: SE, SW, NW, NE
  const LIT = nrm([-0.35, -0.5, 0.8]), VIEW = nrm([0, 1, 1]);
  const pylonAt = (C, i, rot) => [C.x + Math.cos(PA[i] + (rot || 0)) * PR, C.y + Math.sin(PA[i] + (rot || 0)) * PR];
  const polar = (C, a, r) => [C.x + Math.cos(a) * r, C.y + Math.sin(a) * r];
  /* the coolant: two channels each way, CH from the centre, CW wide */
  const inCoolant = (C, x, y, rr) => { const dx = x - C.x, dy = y - C.y; if (Math.hypot(dx, dy) > ARENA - 0.2) return false; const w = CW / 2 + (rr || 0) * 0.4; return Math.abs(Math.abs(dx) - CH) < w || Math.abs(Math.abs(dy) - CH) < w; };
  /* its eyes: points of a Fibonacci sphere on the side the camera sees, each with its own size, colour and clock */
  const EYES = (() => { const out = [], n = 44; for (let i = 0; i < n; i++) { const zz = 1 - 2 * (i + 0.5) / n, r = Math.sqrt(1 - zz * zz), a = i * 2.39996; const d = [Math.cos(a) * r, Math.sin(a) * r, zz], big = i % 7 === 3;
      out.push({ d, r: big ? 0.36 + hr(i) * 0.06 : 0.15 + hr(i) * hr(i + 2) * 0.16, iris: [TEAL, AMBER, VIOLET_HI, '#7FF2E0', AMBER, '#FF8FD0'][i % 6], slit: i % 3 === 0, ph: hr(i + 9) * 6 }); }
    return out; })();
  const WEB_PATTERNS = ['star', 'square', 'zed', 'ess'];
  return {
    arenaR: ARENA, firstAct: 'hover', artY: 1.1, floorDisc: true,
    artPoses: [{ name: 'drifting, the ring turning', mem: { alt: 3.5 } }, { name: 'conducting: arcs flaring', mem: { alt: 3.8, menace: 1 } }, { name: 'the split ring', mem: { alt: 3.6, split: 1 } }, { name: 'overloaded: the ring parted, the eyes bared', mem: { alt: 1.9, open: 1 } }],
    phaseNames: ['The Capacitor Hall', 'The Split Ring', 'The Split Ring', 'Full Discharge'],
    props: C => PA.map((a, i) => ({ kind: 'pylon', i, x: pylonAt(C, i)[0], y: pylonAt(C, i)[1] })),
    // (the pylons' masts are solid steel)
    carve(set, C) { for (let i = 0; i < 4; i++) { const p = pylonAt(C, i); for (let y = Math.floor(p[1]) - 2; y <= Math.floor(p[1]) + 2; y++) for (let x = Math.floor(p[0]) - 2; x <= Math.floor(p[0]) + 2; x++) if (Math.hypot(x + 0.5 - p[0], y + 0.5 - p[1]) < 0.95) set(x, y, T_SOLID); } },
    paintGround(c, A) { paintHall(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, t, cam, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.x = C.x; m.y = C.y - 3.5; m.noTouch = true;
      Object.assign(M, { bt: 0, alt: 13, wake: 0, spinA: 0, spinB: 0, spinRate: 0, yaw: 0.2, tilt: 0.42, split: 0, open: 0, menace: 0, roar: 0, recoil: 0, coreRot: 0, look: [0, 1],
        eyes: EYES.map((e, i) => ({ blink: 0, bt: 1 + hr(i + 3) * 4, bu: null, lk: [0, 0], lkW: [0, 0], lkT: 0, open: 0 })), cab: null, caps: PA.map(() => ({ k: 1, crack: 0, hot: 0, broke: 0 })),
        web: null, sg: null, lash: null, lashes: [], ov: null, sp: null, nova: null, lastPylon: -1, lastWeb: null, bag: null, last: null, seen: {}, broodT: 12, wasStun: false, wasEnter: true, roared: false, orb: null, dir: 1, restT: 1, sparkT: 0, zapT: 0 });
      initCables(FX, m, M); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m, C = FX.C; endAll(FX); m.act = 'hover'; m.actT = 0; M.roar = 1; M.recoil = 1; M.menace = 1; M.broodT = 7;
      FX.H.shake(12, 0.6); FX.H.flash(0.25, VIOLET_HI); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.ring(m.x, m.y, 0.5, 10, 1, VIOLET_HI, 0.45); sparkBurst(FX, m.x, m.y - 3.5, 22, VIOLET_HI);
      [['coilsentry', -1], ['sparkmite', 1], ['sparkmite', -1]].forEach(([type, s], k) => { const q = FX.clampArena({ x: C.x + s * (3 + k), y: C.y + 7 - k * 2 }, 2); FX.minion(type, q.x, q.y); });
      if (lv >= 2) FX.H.banner('THE SPLIT RING', 'Two rings turn against each other and throw spokes across the hall · everything comes faster', VIOLET_HI, 3, true); if (lv >= 4) FX.H.banner('Full Discharge', 'The whole hall hums', '#FFFFFF', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.07) * FX.S.fast; m.actT += dt; m.noTouch = true;
      // the split ring: the brood gathers while it drifts
      if (P >= 2 && m.act === 'hover' && (M.broodT -= dt) <= 0) { M.broodT = P >= 4 ? 11 : 15; const n = FX.H.mons.filter(q => !q.dead && !q.boss && !q.fobj && (q.type === 'coilsentry' || q.type === 'sparkmite')).length;
        if (n < 3) { for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, p = FX.clampArena({ x: me.x + Math.cos(a) * 4.5, y: me.y + Math.sin(a) * 4.5 }, 2), type = i ? 'sparkmite' : 'coilsentry';
          FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.1, t: 1.0, dmg: m.dmg * 0.6, col: VIOLET_HI, fn: s => { FX.H.sfx.pop(); FX.H.ring(s.x, s.y, 0.2, 1.4, 0.4, VIOLET_HI, 0.3); sparkBurst(FX, s.x, s.y - 0.5, 8, VIOLET_HI); if (FX.m && !FX.m.dead) FX.minion(type, s.x, s.y); } }); }
          FX.H.text(me.x, me.y - 2, 'The engine\'s brood gathers', VIOLET_HI, 13); } }
      let altW = ALT, menace = 0;
      switch (m.act) {
        case 'hover': {   // it drifts round the pet at a height, its eyes on it; then chooses
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.28 * fast * M.dir; const R = 6.4 + Math.sin(m.t * 0.45) * 0.9, p = FX.clampArena({ x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 3.2);
          drift(FX, m, M, p.x, p.y, 2.6 * fast, dt);
          if (m.actT > (P >= 2 ? 1.25 : 1.7) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; choose(FX, m); } break; }
        case 'rest': { drift(FX, m, M, m.x, m.y, 0.5, dt); altW = ALT - 0.25; if (m.actT > M.restT) { m.act = 'hover'; m.actT = 0; } break; }
        case 'web': runWeb(FX, m, M, dt); menace = M.web ? (M.web.live ? 1 : 0.7) : 0; altW = ALT + 0.3; break;
        case 'surge': runSurge(FX, m, M, dt); menace = 1; altW = M.sg && M.sg.t < M.sg.warn ? ALT - 0.6 : ALT; break;
        case 'lash': runLash(FX, m, M, dt); menace = 0.8; altW = ALT - 0.4; break;
        case 'overload': runOverload(FX, m, M, dt, fast); menace = M.ov ? 0.6 + 0.4 * (M.ov.fill || 0) : 1; altW = ALT + 0.2; break;
        case 'spokes': runSpokes(FX, m, M, dt); menace = 1; altW = ALT + 0.4; break;
        default: m.act = 'hover'; m.actT = 0;
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 2.2);
      M.alt = toward(M.alt, altW, dt, 2.2);
      FX.parts(bodyParts(FX, m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.open = Math.min(1, M.open + dt * 2.6); M.menace = decay(M.menace, dt, 4); m.noTouch = true; M.alt = toward(M.alt, 1.9, dt, 4);
      const p = pose(FX, m, M); FX.weak('core', p.core[0], p.core[1] - p.core[2], 1.7, 2.3, m.stunT > 0.05);
      // overloaded, it shudders: sparks spit from the parted ring
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.3; const a = Math.random() * TAU; sparkBurst(FX, m.x + Math.cos(a) * 3, m.y + Math.sin(a) * 1.5 - 2, 4, Math.random() < 0.5 ? VIOLET_HI : AMBER); FX.H.shake(1.4, 0.08); }
      FX.parts(bodyParts(FX, m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me; if (!m) return; M.bt += dt; const P = FX.S.lv, stun = m.stunT > 0;
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.4); if (!stun) M.open = decay(M.open, dt, 0.9);
      M.split = toward(M.split, P >= 2 ? 1 : 0, dt, 1.6);
      // the ring: turning slowly, faster when it conducts, stopped dead when it is overloaded; tilting and swinging round
      const rate = stun ? 0 : (m.act === 'spokes' ? 1.6 : 0.5 + (M.menace || 0) * 0.9) * (M.wake == null ? 1 : M.wake); M.spinRate = toward(M.spinRate, rate, dt, stun ? 6 : 1.5);
      M.spinA += dt * M.spinRate; M.spinB = M.split > 0.02 ? M.spinB - dt * M.spinRate * 1.15 * M.split + (M.spinA - M.spinB) * Math.min(1, dt * 3) * (1 - M.split) : M.spinA;
      if (!stun) { M.yaw = toward(M.yaw, Math.sin(M.bt * 0.23) * 0.55 + Math.sin(M.bt * 0.61) * 0.12, dt, 2); M.tilt = toward(M.tilt, 0.4 + Math.sin(M.bt * 0.47) * 0.12 + (M.menace || 0) * 0.05 - M.split * Math.sin(M.bt * 0.5 + 1) * 0.08, dt, 2); }
      M.coreRot += dt * (stun ? 0.5 : 0.16); if (FX.S.tele.some(s => s.nova && !s.done)) M.menace = 1;
      M.look = [toward(M.look[0], clamp((me.x - m.x) / 6, -1, 1), dt, 4), toward(M.look[1], clamp((me.y - m.y) / 6, -1, 1), dt, 4)];
      updEyes(FX, m, M, dt); updCables(FX, m, M, dt); updCaps(FX, m, M, dt); updLash(FX, m, M, dt);
      if (!stun) { if (FX.S.weak.core) FX.weak('core', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.recoil = 1; M.roar = 0.7; FX.H.text(m.x, m.y - 5, 'The ring closes again', VIOLET_HI, 13); FX.H.sfx.hum(); M.caps.forEach(q => { if (q.k < 1) q.reform = true; }); } } else M.wasStun = true;
      // the entrance: down out of the dark of the vault, the ring spinning up, the eyes opening one by one
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.wake = clamp((e - 0.2) / 2.2, 0, 1); M.alt = lerp(13, ALT, 1 - Math.pow(1 - M.wake, 3));
        if (e > 2.0 && !M.roared) { M.roared = true; M.roar = 1; M.recoil = 0.6; FX.H.sfx.hum(); FX.H.sfx.crash(); FX.H.shake(9, 0.4); FX.H.ring(m.x, m.y, 0.3, 8, 1, VIOLET_HI, 0.4); sparkBurst(FX, m.x, m.y - 3.5, 18, VIOLET_HI); } }
      else { M.wake = toward(M.wake, 1, dt, 3); if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; FX.H.sfx.whoosh(); } }
      if ((m.hitSq || 0) > 0.5) M.recoil = Math.max(M.recoil, 0.45);
      if (M.nova) { M.nova.t += dt; if (M.nova.t > 1.2) M.nova = null; } },
    dmgK() { return 1; },
    keep: { steps: 2, pad: 6 },
    draw(c, FX, m, X, Y, T, t, step) { drawVorra(c, FX, m, X, Y, T, t, step); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'pylon') drawPylon(c, FX, p, X, Y, T, t); },
    // (the pylons are kept as pictures, repainted a few times a second in turn; their state is in the signature)
    propKeep: { every: 3, box: () => [-1.9, -(CAP_Z + 1.9), 1.9, 0.9], sig: (FX, p) => { const M = FX.mem || {}, q = M.caps && M.caps[p.i]; return q ? `${(q.k * 20) | 0}|${(q.crack * 6) | 0}|${M.ov && M.ov.i === p.i ? 1 : 0}|${M.web ? 1 : 0}` : ''; } },
    drawObj() {},
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    drawFx(c, FX, T, t) { drawCurrents(c, FX, T, t); drawWebFx(c, FX, T, t); drawSpokesFx(c, FX, T, t); drawDrain(c, FX, T, t); drawLashFx(c, FX, T, t); },
  };

  /* ---- choosing ---- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.1 : 1.2, true); }
  function toRest(m, M, t) { m.act = 'rest'; m.actT = 0; M.restT = t; }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv;
    // (a shuffled round of its moves, so none is long missing; never the same twice running)
    if (!M.bag || !M.bag.length) { M.bag = (P >= 2 ? ['web', 'surge', 'lash', 'overload', 'spokes', 'spokes'] : ['web', 'surge', 'lash', 'overload']).sort(() => Math.random() - 0.5); if (M.bag[M.bag.length - 1] === M.last) M.bag.unshift(M.bag.pop()); }
    let a = M.bag.pop(); if (a === 'spokes' && P < 2) a = 'web';
    const go = { web: startWeb, surge: startSurge, lash: startLash, overload: startOverload, spokes: startSpokes }[a]; if (!go) { m.act = 'hover'; m.actT = 0; return; } M.last = a; go(FX, m); }
  function drift(FX, m, M, tx, ty, spd, dt) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d > 0.05) { const v = Math.min(spd, d * 2); m.x += dx / d * v * dt; m.y += dy / d * v * dt; } const q = FX.clampArena(m, 2.6); m.x = q.x; m.y = q.y; }
  function endAll(FX) { const M = FX.mem; M.web = null; M.sp = null; M.lashes.length = 0; M.lash = null;
    if (M.sg) { if (M.sg.hz) M.sg.hz.life = Math.min(M.sg.hz.life, M.sg.hz.age + 0.2); M.sg = null; }
    if (M.ov) { const o = M.ov.obj; if (o && !o.dead) o.dead = true; M.caps[M.ov.i].hot = 0; M.ov = null; } }

  /* ---- Arc Web: beams of current between the pylons (and itself), shown dashed, then live ---- */
  function startWeb(FX, m) { const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, f = FX.S.fast;
    let kind = WEB_PATTERNS[Math.floor(Math.random() * WEB_PATTERNS.length)]; if (kind === M.lastWeb) kind = WEB_PATTERNS[(WEB_PATTERNS.indexOf(kind) + 1) % WEB_PATTERNS.length]; M.lastWeb = kind;
    const pa = Math.atan2(me.y - C.y, me.x - C.x), node = { a: pa + Math.PI + FX.rnd(-0.5, 0.5), r: 3.6 };
    const beams = { star: [['N', 0], ['N', 1], ['N', 2], ['N', 3]], square: [[0, 1], [1, 2], [2, 3], [3, 0]], zed: [[2, 3], [3, 1], [1, 0]], ess: [[3, 2], [2, 0], [0, 1]] }[kind].map(([a, b]) => ({ a, b }));
    M.web = { kind, beams, node, t: 0, warn: (P >= 2 ? 1.35 : 1.75) / f, liveT: P >= 2 ? 3.8 : 2.8, live: false, rot: 0, w: P >= 2 ? (Math.random() < 0.5 ? 1 : -1) * 0.32 : 0, hitCd: 0 };
    m.act = 'web'; m.actT = 0; M.roar = 0.4; FX.H.sfx.hum();
    say(FX, 'web', 'ARC WEB', P >= 2 ? 'Beams of current link the pylons, then the web turns round the hall: stay off the lines' : 'It links beams of current between the pylons: get off the dashed lines before they go live', VIOLET_HI); }
  function webEnd(FX, W, e) { const C = FX.C; return e === 'N' ? polar(C, W.node.a + W.rot, W.node.r) : polar(C, PA[e] + W.rot, PR); }
  function runWeb(FX, m, M, dt) { const W = M.web; if (!W) { toRest(m, M, 1); return; } const me = FX.me; W.t += dt;
    const hasN = W.beams.some(b => b.a === 'N' || b.b === 'N'), np = webEnd(FX, W, 'N'); if (hasN) drift(FX, m, M, np[0], np[1], 7, dt); else drift(FX, m, M, FX.C.x, FX.C.y - 1, 3, dt);
    if (!W.live && W.t >= W.warn) { W.live = true; FX.H.sfx.crack(); FX.H.sfx.hum(); FX.H.shake(6, 0.3); M.recoil = 0.5; W.beams.forEach(b => { const A = webEnd(FX, W, b.a), B = webEnd(FX, W, b.b); sparkBurst(FX, A[0], A[1] - 0.5, 5, VIOLET_HI); sparkBurst(FX, B[0], B[1] - 0.5, 5, VIOLET_HI); }); }
    if (!W.live) return;
    const lt = W.t - W.warn; if (W.w && lt > 0.5) W.rot += W.w * dt * FX.S.fast;
    W.hitCd -= dt; if (W.hitCd <= 0 && !me.dead && !me.dodge) for (const b of W.beams) { const A = webEnd(FX, W, b.a), B = webEnd(FX, W, b.b); if (segD(me.x, me.y, A[0], A[1], B[0], B[1]) < BEAM / 2 + me.r * 0.5) { if (FX.hurt(m.dmg * 1.15)) { W.hitCd = 0.8; FX.H.text(me.x, me.y - 1.4, 'ZAP!', VIOLET_HI, 14); sparkBurst(FX, me.x, me.y - 0.5, 8, VIOLET_HI); } break; } }
    if (lt > W.liveT) { M.web = null; FX.H.sfx.whoosh(); toRest(m, M, 1.0); } }

  /* ---- Grounding Surge: the cables plunge into the coolant and every channel goes live ---- */
  function startSurge(FX, m) { const M = FX.mem, C = FX.C, P = FX.S.lv, warn = (P >= 2 ? 1.8 : 2.3) / FX.S.fast, live = 1.3;
    // it hangs over the channel nearest it, its cables down in the coolant
    const dx = m.x - C.x, dy = m.y - C.y, vx = (Math.abs(dx) > 0.5 ? Math.sign(dx) : 1) * CH, hy = (Math.abs(dy) > 0.5 ? Math.sign(dy) : -1) * CH, p = Math.abs(Math.abs(dx) - CH) < Math.abs(Math.abs(dy) - CH) ? [C.x + vx, m.y] : [m.x, C.y + hy];
    const q = FX.clampArena({ x: p[0], y: p[1] }, 3.2);
    const S = M.sg = { t: 0, warn, live, x: q.x, y: q.y, struck: false };
    FX.tele({ shape: 'fn', x: q.x, y: q.y, test: (x, y, rr) => inCoolant(C, x, y, rr), t: warn, dmg: m.dmg * 2.1, col: TEAL_HI, surge: true, fn: () => { S.struck = true; FX.H.shake(14, 0.5); FX.H.flash(0.22, TEAL_HI); FX.H.sfx.crash(); FX.H.sfx.crack(); for (let i = 0; i < 16; i++) { const a = Math.random() * TAU, d = Math.random() * 12, x = C.x + Math.cos(a) * d, y = C.y + Math.sin(a) * d; if (inCoolant(C, x, y, 0)) sparkBurst(FX, x, y - 0.2, 3, i % 2 ? TEAL_HI : '#FFFFFF'); } if (inCoolant(C, FX.me.x, FX.me.y, FX.me.r)) FX.H.text(FX.me.x, FX.me.y - 1.5, 'Grounded!', TEAL_HI, 15); } });
    S.hz = FX.hz({ shape: 'fn', kind: 'surge', test: (x, y, rr) => inCoolant(C, x, y, rr), dps: m.dmg * 0.8, tick: 0.3, arm: warn + 0.05, life: warn + live, col: TEAL, draw: () => {} });
    m.act = 'surge'; m.actT = 0; M.roar = 0.5; FX.H.sfx.hum();
    say(FX, 'surge', 'GROUNDING SURGE', 'It slams current into the coolant: every channel goes live. Stand on dry steel!', TEAL_HI); }
  function runSurge(FX, m, M, dt) { const S = M.sg; if (!S) { toRest(m, M, 1); return; } S.t += dt; drift(FX, m, M, S.x, S.y, 6, dt);
    if (S.t > S.warn + S.live) { M.sg = null; toRest(m, M, 1.0); } }

  /* ---- Cable Lash: the cables sweep a shown arc ---- */
  function startLash(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'lash'; m.actT = 0; M.lashN = P >= 2 ? 2 : 1; M.lashDone = 0; queueLash(FX, m, (P >= 2 ? 0.85 : 1.05) / FX.S.fast, Math.random() < 0.5 ? 1 : -1); FX.H.sfx.hum();
    say(FX, 'lash', 'CABLE LASH', P >= 2 ? 'Its cables sweep the arc, then sweep again where you went: out of the arcs' : 'Its cables sweep the shown arc: get out of it, or behind it', AMBER); }
  function queueLash(FX, m, wait, dir) { const M = FX.mem, a0 = FX.angPet(m.x, m.y), spread = 0.95, len = 7;
    const s = FX.tele({ shape: 'cone', x: m.x, y: m.y, a: a0, len, spread, t: wait, dmg: m.dmg * 1.45, col: AMBER, tick: (dt, s2) => { if (!s2.done) { s2.x = m.x; s2.y = m.y; } },
      fn: s2 => { M.lash = { t: 0, a0: s2.a, s: spread, dir, len, x: s2.x, y: s2.y, dur: 0.42 }; FX.H.sfx.whoosh(); FX.H.shake(6, 0.25); M.recoil = 0.6; M.lashDone++;
        if (M.lashDone < M.lashN) queueLash(FX, m, 0.75 / FX.S.fast, -dir); } });
    M.lashes.push(s); M.lashAim = { a: a0, dir }; }
  function runLash(FX, m, M, dt) { drift(FX, m, M, m.x, m.y, 0.5, dt); if (M.lashDone >= M.lashN && !(M.lash && M.lash.t < M.lash.dur)) { M.lashes.length = 0; toRest(m, M, 0.9); } }
  function updLash(FX, m, M, dt) { const L = M.lash; if (L) { L.t += dt; if (L.t > L.dur + 0.5) M.lash = null; } if (M.lashes.length) M.lashes = M.lashes.filter(s => FX.S.tele.includes(s)); }

  /* ---- Overload: it drains one pylon; break the cap before the meter fills ---- */
  function startOverload(FX, m) { const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv;
    const opts = [0, 1, 2, 3].filter(i => i !== M.lastPylon && M.caps[i].k >= 1).sort((a, b) => { const pa = pylonAt(C, a), pb = pylonAt(C, b); return Math.hypot(pa[0] - me.x, pa[1] - me.y) - Math.hypot(pb[0] - me.x, pb[1] - me.y); });
    const i = opts.length ? opts[Math.min(opts.length - 1, Math.random() < 0.5 ? 1 : 2)] : 0; M.lastPylon = i;
    const p = pylonAt(C, i), st = polar(C, PA[i], PR - 6.3);
    const obj = FX.obj({ kind: 'cap', x: p[0], y: p[1] + 0.05, r: 1.25, hp: FX.S.barHP * 0.035, idx: i, onHit: () => { M.caps[i].crack = 1 - Math.max(0, obj.hp) / obj.maxhp; }, onKill: () => overloaded(FX, FX.m) });
    M.ov = { i, t: 0, fill: 0, dur: (P >= 2 ? 8.6 : 10) / FX.S.fast, st, obj, arrive: 0, sparkT: 1.6 };
    m.act = 'overload'; m.actT = 0; M.roar = 0.6; FX.H.sfx.hum(); FX.H.ring(p[0], p[1], 0.3, 2.4, 0.6, VIOLET_HI, 0.4);
    say(FX, 'overload', 'OVERLOAD', 'A pylon is OVERCHARGING as it drains it: break that pylon\'s cap before the meter fills!', VIOLET_HI); }
  function runOverload(FX, m, M, dt, fast) { const O = M.ov, P = FX.S.lv, me = FX.me, C = FX.C; if (!O) { toRest(m, M, 1.4); return; }
    drift(FX, m, M, O.st[0], O.st[1], 7, dt); const d = Math.hypot(m.x - O.st[0], m.y - O.st[1]); O.arrive += dt;
    if (d > 0.8 && O.arrive < 1.6) return;
    O.t += dt; O.fill = clamp(O.t / O.dur, 0, 1); M.caps[O.i].hot = O.fill;
    // the split ring: it spits sparks at the pet while it drains
    if (P >= 2 && (O.sparkT -= dt) <= 0) { O.sparkT = 2.3 / fast; FX.tele({ shape: 'circle', x: me.x + (me.vx || 0) * 0.3, y: me.y + (me.vy || 0) * 0.3, r: 1.35, t: 1.0 / FX.S.fast, dmg: m.dmg * 0.9, col: VIOLET_HI, fn: s => { sparkBurst(FX, s.x, s.y - 0.3, 10, VIOLET_HI); FX.H.ring(s.x, s.y, 0.2, 1.5, 0.3, VIOLET_HI, 0.3); FX.H.sfx.pop(); } }); }
    if (O.fill >= 1) nova(FX, m, M); }
  function overloaded(FX, m) { const M = FX.mem, O = M.ov; if (!m || m.dead || !O) return; const P = FX.S.lv, p = pylonAt(FX.C, O.i), q = M.caps[O.i];
    q.k = 0; q.broke = 1; q.hot = 0; q.crack = 0; M.ov = null; FX.S.tele.length = 0; endAll(FX);
    m.stunT = P >= 2 ? 4.6 : 5.2; m.act = 'rest'; m.actT = 0; M.restT = 1.4; M.recoil = 1; M.open = 0.15;
    FX.H.zap(p[0], p[1] - CAP_Z, m.x, m.y - (M.alt || ALT), VIOLET_HI, 5); FX.H.zap(p[0], p[1] - CAP_Z, m.x, m.y - (M.alt || ALT), '#FFFFFF', 3);
    FX.H.banner('OVERLOADED', 'The feedback staggers it: the ring parts and the core of eyes is bared. Strike it!', VIOLET_HI, 2.6, true);
    FX.H.shake(15, 0.6); FX.H.flash(0.3, VIOLET_HI); FX.H.sfx.crash(); FX.H.sfx.crack(); FX.H.boom(p[0], p[1] - 0.2, 1.6, VIOLET_HI, '#FFFFFF', { n: 22, shake: 8 });
    for (let k = 0; k < 10; k++) FX.H.part({ kind: 'shard', x: p[0], y: p[1] - 0.3, vx: FX.rnd(-4, 4), vy: FX.rnd(-6, -1), g: 9, life: 0.9, max: 0.9, size: 4 + Math.random() * 3, rot: Math.random() * 3, vr: 7, color: k % 2 ? VIOLET_HI : '#FFFFFF' });
    sparkBurst(FX, m.x, m.y - 3, 24, VIOLET_HI); }
  function nova(FX, m, M) { const O = M.ov, P = FX.S.lv; if (O) { if (O.obj && !O.obj.dead) O.obj.dead = true; M.caps[O.i].hot = 0; M.caps[O.i].crack = 0; } M.ov = null;
    const r = P >= 2 ? 11.5 : 10.5, wait = 1.75 / FX.S.fast;
    FX.tele({ shape: 'circle', x: m.x, y: m.y, r, t: wait, dmg: m.dmg * 2.6, col: VIOLET_HI, nova: true, tick: (dt, s) => { if (!s.done) { s.x = m.x; s.y = m.y; } },
      fn: s => { M.nova = { t: 0, x: s.x, y: s.y, r }; FX.H.shake(18, 0.7); FX.H.flash(0.35, VIOLET_HI); FX.H.sfx.crash(); FX.H.boom(s.x, s.y, 4, VIOLET_HI, '#FFFFFF', { n: 40, shake: 16, smoke: 10 }); FX.H.ring(s.x, s.y, 0.5, r, 0.6, VIOLET_HI, 0.5); FX.H.ring(s.x, s.y, 0.5, r * 0.7, 0.45, '#FFFFFF', 0.4); M.recoil = 1; M.roar = 1; } });
    toRest(m, M, wait + 1.2); M.roar = 0.8;
    FX.H.banner('NOVA', 'It held the charge: get far from it, or roll through the blast!', '#FFFFFF', 2.2, true); FX.H.sfx.hum(); }
  function updCaps(FX, m, M, dt) { M.caps.forEach(q => { q.broke = decay(q.broke, dt, 1.2); if (q.reform) { q.k = Math.min(1, q.k + dt / 1.6); if (q.k >= 1) { q.reform = false; q.crack = 0; } } if (!M.ov || M.caps[M.ov.i] !== q) q.hot = decay(q.hot, dt, 2); }); }

  /* ---- The Split Ring's spokes: each ring throws two beams across the hall, the rings turning against each other ---- */
  function startSpokes(FX, m) { const M = FX.mem, a = Math.random() * TAU; M.sp = { t: 0, move: 1.1, warn: 1.35 / FX.S.fast, live: 7.0, a, b: a + Math.PI / 2 + FX.rnd(-0.3, 0.3), w: 0.46 * FX.S.fast, dir: Math.random() < 0.5 ? 1 : -1, hitCd: 0 };
    m.act = 'spokes'; m.actT = 0; M.roar = 0.6; FX.H.sfx.hum();
    say(FX, 'spokes', 'SPOKE STORM', 'Both rings throw spokes of current across the hall, turning against each other: ride a gap or roll through', VIOLET_HI); }
  function spokeAngles(S) { return [S.a, S.a + Math.PI, S.b, S.b + Math.PI]; }
  function runSpokes(FX, m, M, dt) { const S = M.sp, C = FX.C, me = FX.me; if (!S) { toRest(m, M, 1); return; } S.t += dt; drift(FX, m, M, C.x, C.y, 8, dt);
    const lt = S.t - S.move - S.warn; if (lt < 0) return;
    if (!S.on) { S.on = true; FX.H.sfx.crack(); FX.H.shake(7, 0.3); M.recoil = 0.6; }
    S.a += S.w * S.dir * dt; S.b -= S.w * S.dir * dt;
    S.hitCd -= dt; if (S.hitCd <= 0 && !me.dead && !me.dodge) { const rx = me.x - m.x, ry = me.y - m.y; for (const a of spokeAngles(S)) { const al = rx * Math.cos(a) + ry * Math.sin(a), of = Math.abs(-rx * Math.sin(a) + ry * Math.cos(a)); if (al > -0.4 && al < ARENA * 2 && of < SPOKE / 2 + me.r * 0.5) { if (FX.hurt(m.dmg * 1.1)) { S.hitCd = 0.75; FX.H.text(me.x, me.y - 1.4, 'ZAP!', VIOLET_HI, 14); sparkBurst(FX, me.x, me.y - 0.5, 8, VIOLET_HI); } break; } } }
    if (lt > S.live) { M.sp = null; FX.H.sfx.whoosh(); toRest(m, M, 1.3); } }
  function sparkBurst(FX, x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; FX.H.part({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 2, g: 6, life: 0.3 + Math.random() * 0.35, max: 0.65, size: 2 + Math.random() * 1.5, color: i % 3 ? col : '#FFFFFF' }); } }

  /* ---- the body: its pose, the ring's frames and segments, the cables, the eyes ---- */
  function pose(FX, m, M) { const bt = M.bt || 0, op = M.open || 0, hs = m.hitSq || 0;
    const z = (M.alt == null ? ALT : M.alt) + Math.sin(bt * 1.1) * 0.2 * (1 - op) + Math.sin(bt * 2.7) * 0.05 * op - (M.recoil || 0) * 0.28;
    const S = (1 + (M.roar || 0) * 0.05 + hs * 0.035) * lerp(0.55, 1, M.wake == null ? 1 : M.wake);
    return { core: [m.x + (M.recoil || 0) * 0.12 * Math.sin(bt * 31), m.y - (M.recoil || 0) * 0.15, z], z, bt, S, op }; }
  function basis(yaw, tilt) { const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt); const e1 = [cy, sy, 0], e2 = [-sy * ct, cy * ct, st]; return { e1, e2, n: cross(e1, e2) }; }
  function frames(M, p) { const sp = M.split || 0, op = p.op, bt = p.bt, recoilT = (M.recoil || 0) * 0.12;
    const A = basis(M.yaw || 0, (M.tilt || 0.4) + recoilT - op * 0.18), yb = (M.yaw || 0) + Math.sin(bt * 0.31 + 0.8) * 0.5 * sp, tb = clamp((M.tilt || 0.4) + Math.sin(bt * 0.5 + 1) * 0.2 * sp - recoilT - op * 0.1, 0.18, 0.62), B = basis(yb, tb);
    // (split, the two rings are concentric: the violet one inside, the teal one outside, wobbling out of time)
    A.R = lerp(RR, 2.7, sp) * p.S; B.R = lerp(RR, 3.65, sp) * p.S; A.spin = M.spinA || 0; B.spin = M.spinB || 0; return [A, B]; }
  function rpt(c, F, ph, r, h) { return [c[0] + r * (Math.cos(ph) * F.e1[0] + Math.sin(ph) * F.e2[0]) + h * F.n[0], c[1] + r * (Math.cos(ph) * F.e1[1] + Math.sin(ph) * F.e2[1]) + h * F.n[1], c[2] + r * (Math.cos(ph) * F.e1[2] + Math.sin(ph) * F.e2[2]) + h * F.n[2]]; }
  /* the ring's segments: ten of one ring; split, the odd ones gather into the second ring, each half its own five */
  function segments(M, p) { const Fs = frames(M, p), sp = M.split || 0, op = p.op, out = [];
    for (let k = 0; k < NSEG; k++) { const ring = k % 2 && sp > 0.001 ? 1 : 0, F = Fs[ring], half = lerp(TAU / 20 - 0.075, TAU / 10 - 0.1, sp);
      const ph = lerp(k * TAU / NSEG, (k >> 1) * TAU / 5 + (k % 2 ? TAU / 10 : 0), sp) + F.spin;
      const c = [p.core[0], p.core[1], p.core[2] - op * (0.15 + 0.35 * hr(k + 1))], r = F.R + op * (0.4 + 0.4 * hr(k + 5)) * (ring && sp > 0.5 ? 0.7 : 1);
      out.push({ k, ring, F, a0: ph - half, a1: ph + half, c, r, mid: rpt(c, F, ph, r, 0) }); }
    return out; }
  function headPts(M, p) { return segments(M, p); }
  function bodyParts(FX, m, M) { const p = pose(FX, m, M), S = segments(M, p), out = [hit('core', p.core, 1.7, m)]; S.forEach((s, i) => { if (i % 2 === 0) out.push(hit('ring' + i, s.mid, 1.1, m)); }); return out; }
  /* the cables: chains of points in the world, hung from under the core, swinging, dragging on the deck */
  function cableRoot(p, k, M) { const a = k / NC * TAU + 0.25 + (M.coreRot || 0) * 0.3; return [p.core[0] + Math.cos(a) * RC * 0.55 * p.S, p.core[1] + Math.sin(a) * RC * 0.4 * p.S, p.core[2] - RC * 0.78 * p.S]; }
  function initCables(FX, m, M) { const p = pose(FX, m, M); M.cab = []; for (let k = 0; k < NC; k++) { const r0 = cableRoot(p, k, M), a = k / NC * TAU, P = [], Q = []; for (let i = 0; i < NP; i++) { const q = [r0[0] + Math.cos(a) * i * 0.3, r0[1] + Math.sin(a) * i * 0.3, Math.max(0.06, r0[2] - i * SL)]; P.push(q); Q.push(q.slice()); } M.cab.push({ P, Q }); } }
  function updCables(FX, m, M, dt) { if (!M.cab) initCables(FX, m, M); const p = pose(FX, m, M), h = Math.min(dt, 1 / 30), bt = M.bt, L = M.lash, S = M.sg, O = M.ov;
    for (let k = 0; k < NC; k++) { const cb = M.cab[k], P = cb.P, Q = cb.Q, r0 = cableRoot(p, k, M);
      for (let i = 1; i < NP; i++) { const a = P[i], b = Q[i], vx = (a[0] - b[0]) * 0.95, vy = (a[1] - b[1]) * 0.95, vz = (a[2] - b[2]) * 0.95; b[0] = a[0]; b[1] = a[1]; b[2] = a[2];
        const u0 = i / (NP - 1), fa = k / NC * TAU + 0.25 + (M.coreRot || 0) * 0.3 + Math.sin(bt * 0.7 + k) * 0.3, fo = 9 * u0 * (1.2 - u0) * h * h;
        a[0] += vx + Math.cos(fa) * fo + Math.sin(bt * 1.3 + k * 1.7 + i * 0.5) * 0.0025 * i; a[1] += vy + Math.sin(fa) * fo * 0.8 + Math.cos(bt * 1.1 + k * 2.3 + i * 0.4) * 0.0025 * i; a[2] += vz - 18 * h * h + 7 * (1 - u0) * h * h;
        if (a[2] < 0.06) { a[2] = 0.06; b[0] = a[0] - (a[0] - b[0]) * 0.55; b[1] = a[1] - (a[1] - b[1]) * 0.55; }
        const u = i / (NP - 1);
        // the lash: the cables whip round the arc; the surge: their tips plunge into the coolant; the drain: they reach for the pylon
        if (L && L.t < L.dur + 0.15) { const w = clamp((L.t - k * 0.025) / L.dur, 0, 1), ang = L.a0 - L.dir * L.s + 2 * L.dir * L.s * w - L.dir * 0.09 * i * (1 - w * 0.5) + (k - (NC - 1) / 2) * 0.13, rr = 0.6 + u * (L.len - 0.4), tx = m.x + Math.cos(ang) * rr, ty = m.y + Math.sin(ang) * rr, tz = 0.35 + (1 - u) * 1.5, kk = Math.min(1, h * 18 * u); a[0] += (tx - a[0]) * kk; a[1] += (ty - a[1]) * kk; a[2] += (tz - a[2]) * kk; }
        else if (M.lashAim && m.act === 'lash') { const ang = M.lashAim.a + Math.PI + M.lashAim.dir * 0.6, rr = 0.5 + u * 2.4, kk = Math.min(1, h * 3 * u); a[0] += (m.x + Math.cos(ang) * rr - a[0]) * kk; a[1] += (m.y + Math.sin(ang) * rr - a[1]) * kk; a[2] += (1.2 + u * 0.8 - a[2]) * kk; }
        else if (S && S.t < S.warn + S.live) { const kk = Math.min(1, h * 4 * u * u), ang = k / NC * TAU, tx = S.x + Math.cos(ang) * 0.8 * u, ty = S.y + Math.sin(ang) * 0.5 * u; a[0] += (tx - a[0]) * kk; a[1] += (ty - a[1]) * kk; }
        else if (O && O.obj && !O.obj.dead && k < 2) { const pp = pylonAt(FX.C, O.i), kk = Math.min(1, h * 2.5 * u * u); a[0] += (pp[0] - (pp[0] - m.x) * 0.25 - a[0]) * kk; a[1] += (pp[1] - (pp[1] - m.y) * 0.25 - a[1]) * kk; } }
      for (let it = 0; it < 4; it++) { P[0][0] = r0[0]; P[0][1] = r0[1]; P[0][2] = r0[2];
        for (let i = 1; i < NP; i++) { const a = P[i - 1], b = P[i], dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], d = Math.hypot(dx, dy, dz) || 1e-6, df = (d - SL) / d; if (i === 1) { b[0] -= dx * df; b[1] -= dy * df; b[2] -= dz * df; } else { a[0] += dx * df * 0.5; a[1] += dy * df * 0.5; a[2] += dz * df * 0.5; b[0] -= dx * df * 0.5; b[1] -= dy * df * 0.5; b[2] -= dz * df * 0.5; } if (b[2] < 0.06) b[2] = 0.06; } }
      // where a cable drags on the deck it throws sparks
      const tip = P[NP - 1], tq = Q[NP - 1], sp = Math.hypot(tip[0] - tq[0], tip[1] - tq[1]) / Math.max(h, 1e-4);
      if (tip[2] < 0.15 && Math.random() < h * (2 + sp * 3)) FX.H.part({ kind: 'spark', x: tip[0], y: tip[1] - 0.1, vx: FX.rnd(-2, 2), vy: FX.rnd(-3, -0.5), g: 7, life: 0.35, max: 0.35, size: 1.8, color: Math.random() < 0.5 ? AMBER : VIOLET_HI }); } }
  function updEyes(FX, m, M, dt) { const stun = m.stunT > 0, wk = M.wake == null ? 1 : M.wake;
    M.eyes.forEach((e, i) => { e.open = toward(e.open, wk > (i + 1) / (M.eyes.length + 2) ? 1 : 0, dt, 5);
      e.bt -= dt; if (e.bt <= 0) { e.bt = 1.2 + Math.random() * 4.5; e.bu = 0; } if (e.bu != null) { e.bu += dt / 0.22; e.blink = Math.sin(Math.min(1, e.bu) * Math.PI); if (e.bu >= 1) { e.bu = null; e.blink = 0; } }
      e.lkT -= dt; if (e.lkT <= 0) { e.lkT = stun ? 0.12 + Math.random() * 0.2 : 0.4 + Math.random() * 1.4; const j = stun ? 1 : 0.35; e.lkW = [M.look[0] * (1 - j) + (Math.random() * 2 - 1) * j, M.look[1] * (1 - j) + (Math.random() * 2 - 1) * j]; }
      e.lk = [toward(e.lk[0], e.lkW[0], dt, stun ? 30 : 14), toward(e.lk[1], e.lkW[1], dt, stun ? 30 : 14)]; }); }

  /* ---- painting Ix-Vorra ---- */
  function drawVorra(c, FX, m, X, Y, T, t, step) {
    const M = FX.mem, P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.06), p = pose(FX, m, M), segs = segments(M, p), go = i => step == null || step === i;
    const coreD = RiftFiend.depth(p.core), back = segs.filter(s => RiftFiend.depth(s.mid) < coreD).sort((a, b) => RiftFiend.depth(a.mid) - RiftFiend.depth(b.mid)), front = segs.filter(s => RiftFiend.depth(s.mid) >= coreD).sort((a, b) => RiftFiend.depth(a.mid) - RiftFiend.depth(b.mid));
    if (go(0)) {
      // its shadow on the deck and the violet light it throws there
      const g0 = P3(m.x, m.y, 0), k = 1 / (1 + p.z * 0.12); FX.K.shade(c, g0[0], g0[1], T * 3.1 * k, T * 1.5 * k, 0.45, '#04080C');
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + (M.menace || 0) * 0.2; blitSized(c, glowSprite(VIOLET), g0[0] - T * 3.5, g0[1] - T * 1.8, T * 7, T * 3.6); c.restore();
      paintCables(c, FX, m, M, p, P3, T, lw);
      back.forEach(s => paintSeg(c, s, P3, T, lw, M, p)); }
    if (go(1)) { paintCore(c, FX, m, M, p, P3, T, lw); front.forEach(s => paintSeg(c, s, P3, T, lw, M, p)); } }
  /* a segment of the ring: a heavy curved block of dark metal, its flat face lit by how it is turned, its rim edge
     darker, a glowing seam along it, rivets, and an electrode at each end where the current jumps */
  function paintSeg(c, s, P3, T, lw, M, p) { const F = s.F, sg = dot(F.n, VIEW) >= 0 ? 1 : -1, w = BW * p.S, h = BH * p.S, N = 6, mph = (s.a0 + s.a1) / 2;
    const at = (ph, r, hh) => P3(...rpt(s.c, F, ph, r, hh)), phs = []; for (let j = 0; j <= N; j++) phs.push(lerp(s.a0, s.a1, j / N));
    const radial = [Math.cos(mph) * F.e1[0] + Math.sin(mph) * F.e2[0], Math.cos(mph) * F.e1[1] + Math.sin(mph) * F.e2[1], Math.cos(mph) * F.e1[2] + Math.sin(mph) * F.e2[2]], outer = dot(radial, VIEW) > 0, rr = outer ? s.r + w / 2 : s.r - w / 2;
    // the rim: the outer edge on the near side, the inner edge on the far side
    const rim = phs.map(ph => at(ph, rr, h)).concat(phs.slice().reverse().map(ph => at(ph, rr, -h)));
    const litR = clamp(dot(outer ? radial : radial.map(x => -x), LIT) * 0.6 + 0.35, 0, 1);
    TN.shape(c, TN.poly(rim), { col: mixC('#151821', '#3A4256', litR), shade: '#0C0E14', hi: false, line: LINE, lw, r: T * 0.3, d2: 0.18, spec: false, force: true });
    // the face
    const face = phs.map(ph => at(ph, s.r + w / 2, sg * h)).concat(phs.slice().reverse().map(ph => at(ph, s.r - w / 2, sg * h)));
    const nv = F.n.map(x => x * sg), lit = clamp(dot(nv, LIT) * 0.75 + 0.42, 0, 1), seam = s.ring ? TEAL : VIOLET, seamHi = s.ring ? TEAL_HI : VIOLET_HI;
    TN.shape(c, TN.poly(face), { col: mixC('#1E2230', '#5E6884', lit), shade: mixC('#12141C', HULL, lit), hi: mixC(HULL_HI, '#9AA6C4', lit), line: LINE, lw, r: T * 0.5, d1: 0.1, d2: 0.2, spec: false, force: true,
      inner: g => { const sm = phs.map(ph => at(ph, s.r, sg * h)); g.lineCap = 'round';
        g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = Math.max(2, T * 0.16); g.beginPath(); sm.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke();
        g.save(); g.globalCompositeOperation = 'lighter'; const k = 0.55 + 0.45 * Math.sin(p.bt * 3 + s.k * 1.3) * (1 - p.op * 0.7);
        g.globalAlpha = 0.45 * k; g.strokeStyle = seam; g.lineWidth = Math.max(2, T * 0.17); g.stroke(); g.globalAlpha = 0.95 * k; g.strokeStyle = seamHi; g.lineWidth = Math.max(1, T * 0.06); g.stroke(); g.restore();
        // plate lines across the block and rivets
        g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = Math.max(1, T * 0.03); for (const u of [0.33, 0.66]) { const ph = lerp(s.a0, s.a1, u), a = at(ph, s.r + w / 2, sg * h), b = at(ph, s.r - w / 2, sg * h); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
        g.fillStyle = 'rgba(210,220,240,.55)'; for (const u of [0.12, 0.88]) for (const o of [-0.3, 0.3]) { const q = at(lerp(s.a0, s.a1, u), s.r + o * w, sg * h); g.beginPath(); g.arc(q[0], q[1], Math.max(1, T * 0.04), 0, TAU); g.fill(); } } });
    // the electrodes at the ends, and an amber running light on the rim
    for (const ph of [s.a0, s.a1]) { const q = at(ph + (ph === s.a0 ? 0.02 : -0.02), s.r, 0); c.fillStyle = seamHi; c.strokeStyle = LINE; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.arc(q[0], q[1], T * 0.11 * p.S, 0, TAU); c.fill(); c.stroke(); }
    if (outer && ((p.bt * 1.7 + s.k * 0.37) % 2) < 0.5) { const q = at(mph, rr, 0); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(AMBER), q[0] - T * 0.35, q[1] - T * 0.35, T * 0.7, T * 0.7); c.restore(); c.fillStyle = '#FFE2A8'; c.beginPath(); c.arc(q[0], q[1], T * 0.06, 0, TAU); c.fill(); } }
  /* the core: a ball of boiling violet plasma, its eyes set in it */
  function paintCore(c, FX, m, M, p, P3, T, lw) { const q = P3(...p.core), op = p.op, r = RC * p.S * T * (1 + op * 0.14 + (M.roar || 0) * 0.04), bt = p.bt, mn = M.menace || 0;
    FX.K.glow(c, q[0], q[1], r * 2.8, VIOLET, 0.45 + mn * 0.2 + op * 0.3);
    const pts = []; for (let j = 0; j < 22; j++) { const a = j / 22 * TAU, k = 1 + 0.045 * Math.sin(3 * a + bt * 2.7) + 0.03 * Math.sin(5 * a - bt * 3.9) + 0.02 * Math.sin(9 * a + bt * 6.1) + op * 0.03 * Math.sin(7 * a + bt * 11); pts.push([q[0] + Math.cos(a) * r * k, q[1] + Math.sin(a) * r * k]); }
    TN.shape(c, TN.blob(pts), { col: PLASMA, shade: PLASMA_SH, hi: '#F0C8FF', line: PLASMA_DK, lw: lw * 1.1, r, d1: 0.12, d2: 0.24, spec: 0.55, specAt: [q[0] - r * 0.42, q[1] - r * 0.55], force: true,
      inner: g => { g.save(); g.globalCompositeOperation = 'lighter';
        // boiling cells drifting through it, and curling filaments of current
        for (let i = 0; i < 7; i++) { const a = i * 0.9 + bt * (0.35 + i * 0.06), rr = r * (0.2 + 0.5 * hr(i)), x = q[0] + Math.cos(a) * rr, y = q[1] + Math.sin(a) * rr * 0.85, s = r * (0.32 + 0.12 * Math.sin(bt * 3 + i)); g.globalAlpha = 0.28 + op * 0.2; blitSized(g, glowSprite(i % 3 ? VIOLET_HI : '#FFFFFF'), x - s, y - s, s * 2, s * 2); }
        g.strokeStyle = 'rgba(255,215,255,.5)'; g.lineWidth = Math.max(1, r * 0.035); for (let i = 0; i < 4; i++) { const a0 = bt * 0.8 + i * 1.6; g.beginPath(); for (let j = 0; j <= 10; j++) { const u = j / 10, a = a0 + u * 2.2, rr = r * (0.85 - u * 0.5); j ? g.lineTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr) : g.moveTo(q[0] + Math.cos(a) * rr, q[1] + Math.sin(a) * rr); } g.stroke(); }
        g.restore(); } });
    // the eyes, far ones first, the core's slow roll carrying them round so they swim in and out of view
    const cr = M.coreRot || 0, cz = Math.cos(cr), sz = Math.sin(cr), list = [];
    EYES.forEach((e, i) => { const d0 = e.d, d = [d0[0] * cz - d0[1] * sz, d0[0] * sz + d0[1] * cz, d0[2]], v = dot(d, VIEW); if (v < 0.12) return; list.push({ e, i, d, v }); });
    list.sort((a, b) => a.v - b.v).forEach(({ e, i, d, v }) => { const st = M.eyes[i], g = [p.core[0] + d[0] * RC * p.S * 0.9, p.core[1] + d[1] * RC * p.S * 0.9, p.core[2] + d[2] * RC * p.S * 0.9], s = P3(...g), er = e.r * p.S * T * (1 + op * 0.25), sq = clamp(v * 1.15, 0.3, 1), rad = Math.atan2(s[1] - q[1], s[0] - q[0]), rot = rad - Math.PI / 2;
      const fade = clamp((v - 0.12) / 0.15, 0, 1) * (st ? st.open : 1); if (fade < 0.03) return;
      const lk = st ? st.lk : [0, 0], cl = Math.cos(-rot), sl = Math.sin(-rot), look = [(lk[0] * cl - lk[1] * sl) * 0.9, (lk[0] * sl + lk[1] * cl) * 0.9];
      c.save(); c.globalAlpha = fade;
      // a dark socket in the plasma for it to sit in
      c.fillStyle = 'rgba(42,8,70,.55)'; c.beginPath(); c.ellipse(s[0], s[1], er * 1.28, er * 1.28 * sq * 0.92, rot, 0, TAU); c.fill();
      TN.eye(c, s[0], s[1], er, { iris: e.iris, look, blink: Math.max(st ? st.blink : 0, 1 - (st ? st.open : 1)), lid: '#8A2ED0', line: PLASMA_DK, white: '#F6F0FF', squash: sq * 0.92, rot, irisR: op > 0.5 ? 0.5 : 0.6, pupilR: op > 0.5 ? 0.3 : 0.48, slit: e.slit });
      c.restore(); }); }
  /* the cables: copper, tapering, banded, a pulse of violet current running down each */
  function paintCables(c, FX, m, M, p, P3, T, lw) { if (!M.cab) return;
    M.cab.forEach((cb, k) => { const pts = cb.P.map(q => P3(q[0], q[1], q[2]));
      TN.tubeLite(c, pts, u => T * (0.3 - 0.17 * u) * p.S, { col: COPPER, shade: COPPER_SH, hi: COPPER_HI, line: '#2A140A', lw: lw * 0.75, d1: 0.14, d2: 0.26 });
      c.strokeStyle = 'rgba(40,20,10,.7)'; c.lineWidth = Math.max(1, T * 0.035); for (let i = 2; i < NP - 1; i += 2) { const a = pts[i - 1], b = pts[i + 1], q = pts[i], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, w = T * (0.3 - 0.17 * i / (NP - 1)) * 0.55; c.beginPath(); c.moveTo(q[0] - dy / L * w, q[1] + dx / L * w); c.lineTo(q[0] + dy / L * w, q[1] - dx / L * w); c.stroke(); }
      const u = (p.bt * 0.9 + k * 0.23) % 1, j = Math.min(NP - 2, Math.floor(u * (NP - 1))), e = u * (NP - 1) - j, px = lerp(pts[j][0], pts[j + 1][0], e), py = lerp(pts[j][1], pts[j + 1][1], e);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85; blitSized(c, glowSprite(VIOLET_HI), px - T * 0.4, py - T * 0.4, T * 0.8, T * 0.8);
      const tp = pts[NP - 1]; c.globalAlpha = 0.6 + 0.3 * Math.sin(p.bt * 9 + k); blitSized(c, glowSprite(AMBER), tp[0] - T * 0.35, tp[1] - T * 0.35, T * 0.7, T * 0.7); c.restore();
      c.fillStyle = '#FFE2A8'; c.strokeStyle = '#2A140A'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.arc(tp[0], tp[1], T * 0.07, 0, TAU); c.fill(); c.stroke(); }); }

  /* ---- live light over the scene ---- */
  function jag(c, x0, y0, x1, y1, seed, amp, n) { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L; c.beginPath(); c.moveTo(x0, y0); for (let i = 1; i < n; i++) { const u = i / n, o = (hr(seed + i * 7.3) * 2 - 1) * amp * Math.sin(u * Math.PI); c.lineTo(x0 + dx * u + nx * o, y0 + dy * u + ny * o); } c.lineTo(x1, y1); }
  function bolt3(c, x0, y0, x1, y1, seed, T, col, hi, k) { const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / (T * 0.55))); c.lineJoin = 'round'; c.lineCap = 'round';
    jag(c, x0, y0, x1, y1, seed, T * 0.28, n); c.globalAlpha = 0.35 * k; c.strokeStyle = col; c.lineWidth = Math.max(3, T * 0.32); c.stroke(); c.globalAlpha = 0.85 * k; c.strokeStyle = hi; c.lineWidth = Math.max(1.5, T * 0.11); c.stroke(); c.globalAlpha = k; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); }
  /* the current: arcs jumping the gaps between the ring's segments, and down from the ring into the core */
  function drawCurrents(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || m.dead || !M.eyes) return; const p = pose(FX, m, M), segs = segments(M, p), S = q => [FX.sx(q[0]), FX.sy(q[1]) - q[2] * T], fr = Math.floor(t * 22), op = p.op, mn = M.menace || 0, wk = M.wake == null ? 1 : M.wake;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let r = 0; r < 2; r++) { const ring = segs.filter(s => (M.split > 0.001 ? s.ring === r : r === 0)); for (let j = 0; j < ring.length; j++) { const a = ring[j], b = ring[(j + 1) % ring.length], on = hr(fr * 3.1 + a.k * 11 + r) < (0.55 + mn * 0.4) * (1 - op * 0.75) * wk; if (!on) continue;
      const A = S(rpt(a.c, a.F, a.a1 - 0.02, a.r, 0)), B = S(rpt(b.c, b.F, b.a0 + 0.02, b.r, 0)); if (Math.hypot(A[0] - B[0], A[1] - B[1]) > T * 3.2) continue; bolt3(c, A[0], A[1], B[0], B[1], fr + a.k * 5 + r * 50, T * 0.6, a.ring ? TEAL : VIOLET, a.ring ? TEAL_HI : VIOLET_HI, 0.9); } }
    // arcs from the ring into the core (more when it conducts; sputtering when it is overloaded)
    const q = S(p.core), n = Math.round((1 + mn * 2) * wk);
    // the nova gathering: the core swells with light and current lashes out of it
    const nv = FX.S.tele.find(s => s.nova && !s.done); if (nv) { const u = clamp(nv.age / nv.t, 0, 1), pu = 0.6 + 0.4 * Math.sin(t * (8 + u * 30)); c.globalAlpha = (0.35 + u * 0.5) * pu; blitSized(c, glowSprite(VIOLET_HI), q[0] - T * (2.2 + u * 3), q[1] - T * (2.2 + u * 3), T * (4.4 + u * 6), T * (4.4 + u * 6)); c.globalAlpha = 0.5 * u * pu; blitSized(c, glowSprite('#FFFFFF'), q[0] - T * 1.4, q[1] - T * 1.4, T * 2.8, T * 2.8);
      for (let i = 0; i < 3 + Math.round(u * 6); i++) { const a = hr(fr * 1.9 + i * 5) * TAU, L = T * (2.5 + hr(fr + i * 3) * 3.5 * (0.5 + u)); bolt3(c, q[0], q[1], q[0] + Math.cos(a) * L, q[1] + Math.sin(a) * L * 0.8, fr * 3 + i * 11, T * 0.7, VIOLET, '#FFFFFF', 0.6 + u * 0.4); } } for (let i = 0; i < n; i++) { const s = segs[Math.floor(hr(fr + i * 17) * segs.length)]; if (hr(fr * 1.7 + i) < 0.4 + op * 0.3) continue; const A = S(rpt(s.c, s.F, (s.a0 + s.a1) / 2, s.r - BW * 0.4, 0)); bolt3(c, A[0], A[1], q[0] + (A[0] - q[0]) * 0.3, q[1] + (A[1] - q[1]) * 0.3, fr * 2 + i * 31, T * 0.8, VIOLET, VIOLET_HI, 0.7); }
    c.restore(); }
  /* the arc web: dashed lines first, then crackling beams of current between the pylons' contacts (and from itself) */
  function drawWebFx(c, FX, T, t) { const M = FX.mem, W = M.web, m = FX.m; if (!W || !m) return; const fr = Math.floor(t * 26);
    c.save(); c.lineCap = 'round';
    W.beams.forEach((b, j) => { const A = webEnd(FX, W, b.a), B = webEnd(FX, W, b.b), za = b.a === 'N' ? 0.3 : CON_Z, zb = b.b === 'N' ? 0.3 : CON_Z, ax = FX.sx(A[0]), ay = FX.sy(A[1]) - za * T, bx = FX.sx(B[0]), by = FX.sy(B[1]) - zb * T;
      if (!W.live) { const u = clamp(W.t / W.warn, 0, 1); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.18 + u * 0.12; c.strokeStyle = VIOLET; c.lineWidth = BEAM * T; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 + 0.35 * Math.sin(t * 14) * u; c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(2, T * 0.09); c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T * 2.5; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke(); c.setLineDash([]);
        // the turning web shows which way it will turn: arrows along the rail at each end
        if (W.w) { const dir = Math.sign(W.w); for (const [E, e] of [[A, b.a], [B, b.b]]) { if (e === 'N') continue; const a0 = Math.atan2(E[1] - FX.C.y, E[0] - FX.C.x), a1 = a0 + dir * 0.32, rr = PR; c.globalAlpha = 0.85; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); for (let i = 0; i <= 8; i++) { const a = lerp(a0 + dir * 0.06, a1, i / 8), x = FX.sx(FX.C.x + Math.cos(a) * rr), y = FX.sy(FX.C.y + Math.sin(a) * rr); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); const hx = FX.sx(FX.C.x + Math.cos(a1) * rr), hy = FX.sy(FX.C.y + Math.sin(a1) * rr), ta = a1 + dir * Math.PI / 2; c.beginPath(); c.moveTo(hx + Math.cos(ta) * T * 0.35, hy + Math.sin(ta) * T * 0.35); c.lineTo(hx + Math.cos(ta + 2.5) * T * 0.3, hy + Math.sin(ta + 2.5) * T * 0.3); c.lineTo(hx + Math.cos(ta - 2.5) * T * 0.3, hy + Math.sin(ta - 2.5) * T * 0.3); c.closePath(); c.fillStyle = '#FFFFFF'; c.fill(); } } }
      else { c.globalCompositeOperation = 'lighter'; const fl = 0.8 + 0.2 * Math.sin(t * 37 + j);
        c.globalAlpha = 0.22 * fl; c.strokeStyle = VIOLET; c.lineWidth = BEAM * T * 1.25; c.beginPath(); c.moveTo(ax, ay + za * T * 0.6); c.lineTo(bx, by + zb * T * 0.6); c.stroke();
        c.globalAlpha = 0.4 * fl; c.lineWidth = BEAM * T * 0.6; c.strokeStyle = VIOLET_HI; c.beginPath(); c.moveTo(ax, ay); c.lineTo(bx, by); c.stroke();
        bolt3(c, ax, ay, bx, by, fr + j * 41, T, VIOLET, VIOLET_HI, 1); bolt3(c, ax, ay, bx, by, fr * 3 + j * 17 + 9, T, VIOLET, '#FFFFFF', 0.6);
        [[ax, ay], [bx, by]].forEach(([x, y]) => { c.globalAlpha = 0.8; blitSized(c, glowSprite(VIOLET_HI), x - T * 0.9, y - T * 0.9, T * 1.8, T * 1.8); }); }
      c.globalAlpha = 1; });
    // from itself: a bolt down out of the core to its node on the deck
    if (W.beams.some(b => b.a === 'N' || b.b === 'N')) { const N = webEnd(FX, W, 'N'), p = pose(FX, m, M), nx = FX.sx(N[0]), ny = FX.sy(N[1]) - 0.3 * T, cx = FX.sx(p.core[0]), cy = FX.sy(p.core[1]) - p.core[2] * T; c.globalCompositeOperation = 'lighter'; if (W.live) bolt3(c, cx, cy, nx, ny, fr * 5 + 3, T, VIOLET, VIOLET_HI, 0.9); else { c.globalAlpha = 0.5; c.strokeStyle = VIOLET_HI; c.lineWidth = 2; c.setLineDash([T * 0.3, T * 0.3]); c.beginPath(); c.moveTo(cx, cy); c.lineTo(nx, ny); c.stroke(); c.setLineDash([]); } }
    c.restore(); }
  /* the spokes of the split ring: violet from one, teal from the other, out from under it across the hall */
  function drawSpokesFx(c, FX, T, t) { const M = FX.mem, S = M.sp, m = FX.m; if (!S || !m) return; const pre = S.t - S.move, fr = Math.floor(t * 26); if (pre < 0) return; const live = pre >= S.warn, hx = FX.sx(m.x), hy = FX.sy(m.y) - 0.4 * T, L = ARENA * 2.2;
    c.save(); c.lineCap = 'round';
    spokeAngles(S).forEach((a, j) => { const ring = j >> 1, col = ring ? TEAL : VIOLET, hi = ring ? TEAL_HI : VIOLET_HI, ex = FX.sx(m.x + Math.cos(a) * L), ey = FX.sy(m.y + Math.sin(a) * L) - 0.4 * T;
      if (!live) { const u = clamp(pre / S.warn, 0, 1); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.16 + u * 0.12; c.strokeStyle = col; c.lineWidth = SPOKE * T; c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.65 + 0.3 * Math.sin(t * 14) * u; c.strokeStyle = hi; c.lineWidth = Math.max(2, T * 0.09); c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T * 2.5; c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke(); c.setLineDash([]);
        // which way it will sweep: a chevron off the beam, out along it
        const dir = (ring ? -1 : 1) * S.dir; for (const rr of [4, 8]) { const px = m.x + Math.cos(a) * rr, py = m.y + Math.sin(a) * rr, ta = a + dir * Math.PI / 2, X = FX.sx(px + Math.cos(ta) * 0.9), Y = FX.sy(py + Math.sin(ta) * 0.9) - 0.4 * T; c.globalAlpha = 0.9; c.fillStyle = hi; c.beginPath(); c.moveTo(X + Math.cos(ta) * T * 0.35, Y + Math.sin(ta) * T * 0.35); c.lineTo(X + Math.cos(ta + 2.4) * T * 0.3, Y + Math.sin(ta + 2.4) * T * 0.3); c.lineTo(X + Math.cos(ta - 2.4) * T * 0.3, Y + Math.sin(ta - 2.4) * T * 0.3); c.closePath(); c.fill(); } }
      else { c.globalCompositeOperation = 'lighter'; const fl = 0.85 + 0.15 * Math.sin(t * 41 + j); c.globalAlpha = 0.24 * fl; c.strokeStyle = col; c.lineWidth = SPOKE * T * 1.3; c.beginPath(); c.moveTo(hx, hy); c.lineTo(ex, ey); c.stroke();
        c.globalAlpha = 0.5 * fl; c.strokeStyle = hi; c.lineWidth = SPOKE * T * 0.5; c.stroke(); bolt3(c, hx, hy, FX.sx(m.x + Math.cos(a) * 16), FX.sy(m.y + Math.sin(a) * 16) - 0.4 * T, fr + j * 23, T, col, hi, 0.9); } });
    if (live) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(VIOLET_HI), hx - T * 1.6, hy - T * 1.6, T * 3.2, T * 3.2); const p = pose(FX, m, M); bolt3(c, FX.sx(p.core[0]), FX.sy(p.core[1]) - p.core[2] * T, hx, hy, fr * 7, T, VIOLET, '#FFFFFF', 0.8); }
    c.restore(); }
  /* the overload: a torrent of current from the pylon's cap into the core; a meter round the cap; its label */
  function drawDrain(c, FX, T, t) { const M = FX.mem, O = M.ov, m = FX.m, C = FX.C; if (!m) return;
    c.save();
    if (M.nova) { const u = M.nova.t / 1.2, X = FX.sx(M.nova.x), Y = FX.sy(M.nova.y); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - u) * 0.6; c.strokeStyle = VIOLET_HI; c.lineWidth = T * (0.6 - u * 0.4); c.beginPath(); c.arc(X, Y, M.nova.r * T * (0.3 + u * 0.8), 0, TAU); c.stroke(); c.globalAlpha = (1 - u) * 0.4; blitSized(c, glowSprite(VIOLET_HI), X - M.nova.r * T, Y - M.nova.r * T, M.nova.r * T * 2, M.nova.r * T * 2); }
    if (!O) { c.restore(); return; }
    const pp = pylonAt(C, O.i), X = FX.sx(pp[0]), Y = FX.sy(pp[1]), cx = X, cy = Y - CAP_Z * T, p = pose(FX, m, M), qx = FX.sx(p.core[0]), qy = FX.sy(p.core[1]) - p.core[2] * T, fr = Math.floor(t * 24), f = O.fill || 0;
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    if (O.t > 0) { bolt3(c, cx, cy, qx, qy, fr, T, VIOLET, VIOLET_HI, 0.85 + f * 0.15); bolt3(c, cx, cy, qx, qy, fr * 3 + 7, T, VIOLET, '#FFFFFF', 0.5 + f * 0.4);
      // beads of charge running up the torrent into it
      for (let i = 0; i < 6; i++) { const u = (t * 1.4 + i / 6) % 1, x = lerp(cx, qx, u), y = lerp(cy, qy, u) - Math.sin(u * Math.PI) * T * 0.6; c.globalAlpha = 0.9; blitSized(c, glowSprite('#FFFFFF'), x - T * 0.25, y - T * 0.25, T * 0.5, T * 0.5); } }
    // the meter: a ring round the cap
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; const r = T * 1.05; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(5, T * 0.24); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke();
    c.strokeStyle = mixC(VIOLET, '#FFFFFF', f * f); c.lineWidth = Math.max(3.5, T * 0.16); c.beginPath(); c.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke();
    const blink = 0.75 + 0.25 * Math.sin(t * (6 + f * 14)); label(c, 'OVERCHARGING', cx, cy - r - T * 1.15, Math.round(T * 0.5), mixC(VIOLET_HI, '#FFFFFF', 0.4), blink);
    label(c, 'break its cap!', cx, cy - r - T * 0.5, Math.round(T * 0.4), '#FFFFFF', 0.85 + 0.15 * Math.sin(t * 8));
    // off screen: an arrow at the edge pointing to it
    const W = FX.H.W(), H = FX.H.H(), mg = 34; if (cx < mg || cx > W - mg || cy < 90 || cy > H - 90) { const ex = clamp(cx, mg, W - mg), ey = clamp(cy, 110, H - 110), a = Math.atan2(cy - ey, cx - ex); c.save(); c.translate(ex, ey); c.rotate(a); c.fillStyle = VIOLET_HI; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(16, 0); c.lineTo(-8, -11); c.lineTo(-3, 0); c.lineTo(-8, 11); c.closePath(); c.stroke(); c.fill(); c.restore(); label(c, 'OVERCHARGING', clamp(ex - Math.cos(a) * 46, 60, W - 60), ey - Math.sin(a) * 20 + 18, 11, VIOLET_HI, blink); }
    c.restore(); }
  /* the lash: a swoosh of copper light round the arc behind the cables */
  function drawLashFx(c, FX, T, t) { const L = FX.mem.lash; if (!L) return; const u = clamp(L.t / L.dur, 0, 1), fade = L.t > L.dur ? 1 - (L.t - L.dur) / 0.5 : 1; if (fade <= 0) return;
    const a0 = L.a0 - L.dir * L.s, a1 = a0 + 2 * L.dir * L.s * u, X = FX.sx(L.x), Y = FX.sy(L.y) - 0.3 * T; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const [rr, w, col, al] of [[L.len * 0.85, 0.9, '#FFC58A', 0.35], [L.len * 0.85, 0.3, '#FFFFFF', 0.7], [L.len * 0.55, 0.5, AMBER, 0.35]]) { c.globalAlpha = al * fade; c.strokeStyle = col; c.lineWidth = T * w; c.beginPath(); const n = 18; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), x = X + Math.cos(a) * rr * T, y = Y + Math.sin(a) * rr * T; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore(); }
  function label(c, s, x, y, px, col, a) { c.save(); c.globalAlpha = a == null ? 1 : a; c.font = `900 ${px}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = Math.max(3, px * 0.24); c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore(); }

  /* ---- on the deck, under everything: the coolant flowing, going live; the overcharging pylon's target ring ---- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C; if (!M || !C) return; const X0 = FX.sx(C.x), Y0 = FX.sy(C.y), S = M.sg, fr = Math.floor(t * 24);
    c.save(); c.beginPath(); c.arc(X0, Y0, (ARENA - 0.1) * T, 0, TAU); c.clip();
    const lines = []; for (const s of [-1, 1]) { const L = Math.sqrt(ARENA * ARENA - CH * CH) - 0.2; lines.push({ h: true, o: s * CH, L }, { h: false, o: s * CH, L }); }
    const seg = (q, u) => q.h ? [X0 + u * T, Y0 + q.o * T] : [X0 + q.o * T, Y0 + u * T];
    // the coolant's slow flow: light streaming along each channel
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    lines.forEach((q, i) => { for (const [off, sp, a] of [[-0.45, 1.0, 0.16], [0.05, 1.6, 0.22], [0.5, 1.25, 0.14]]) { const A = seg(q, -q.L), B = seg(q, q.L), ox = q.h ? 0 : off * T, oy = q.h ? off * T : 0; c.globalAlpha = a; c.strokeStyle = TEAL_HI; c.lineWidth = Math.max(1.2, T * 0.08); c.setLineDash([T * 0.7, T * 1.6]); c.lineDashOffset = -t * T * sp * (i % 2 ? 1 : -1); c.beginPath(); c.moveTo(A[0] + ox, A[1] + oy); c.lineTo(B[0] + ox, B[1] + oy); c.stroke(); } });
    c.setLineDash([]);
    if (S) { const warn = S.t < S.warn, u = clamp(S.t / S.warn, 0, 1), k = warn ? 0.1 + 0.3 * u * (0.55 + 0.45 * Math.sin(t * (10 + u * 16))) : 0.55 + 0.25 * Math.sin(t * 40), fade = warn ? 1 : clamp((S.warn + S.live - S.t) / 0.4, 0, 1);
      lines.forEach(q => { const A = seg(q, -q.L), B = seg(q, q.L); c.globalAlpha = k * fade; c.strokeStyle = warn ? TEAL_HI : '#E8FFFA'; c.lineWidth = CW * T; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.stroke(); });
      // the channels' edges marked in a running dash while it builds; lightning along them once live
      if (warn) { c.globalAlpha = 0.6 + 0.4 * u; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1.5, T * 0.07); c.setLineDash([T * 0.4, T * 0.3]); c.lineDashOffset = -t * T * 3; lines.forEach(q => { for (const e of [-CW / 2, CW / 2]) { const A = seg(q, -q.L), B = seg(q, q.L), ox = q.h ? 0 : e * T, oy = q.h ? e * T : 0; c.beginPath(); c.moveTo(A[0] + ox, A[1] + oy); c.lineTo(B[0] + ox, B[1] + oy); c.stroke(); } }); c.setLineDash([]);
        // little arcs crawling over the coolant, more as it builds
        const n = Math.round(4 + u * 14); for (let i = 0; i < n; i++) { const q = lines[i % 4], v = (hr(fr + i * 3.7) * 2 - 1) * q.L, A = seg(q, v), o = (hr(fr * 1.3 + i) - 0.5) * CW * T * 0.8, B = seg(q, v + (hr(i + fr) - 0.5) * 2.5); bolt3(c, A[0] + (q.h ? 0 : o), A[1] + (q.h ? o : 0), B[0] - (q.h ? 0 : o), B[1] - (q.h ? o : 0), fr + i * 13, T * 0.5, TEAL, TEAL_HI, 0.5 + u * 0.4); } }
      else lines.forEach((q, i) => { const A = seg(q, -q.L), B = seg(q, q.L); bolt3(c, A[0], A[1], B[0], B[1], fr + i * 29, T * 1.4, TEAL, '#FFFFFF', fade); bolt3(c, A[0], A[1], B[0], B[1], fr * 2 + i * 7, T * 1.2, TEAL, TEAL_HI, fade * 0.7); }); }
    c.restore();
    // labels on the coolant while it builds
    if (S && S.t < S.warn) { const a = 0.7 + 0.3 * Math.sin(t * 9); for (const [x, y] of [[CH, 0], [-CH, 0], [0, CH], [0, -CH], [CH, 9], [-CH, -9], [9, -CH], [-9, CH]]) label(c, 'LIVE', X0 + x * T, Y0 + y * T, Math.round(T * 0.5), TEAL_HI, a); }
    // the overcharging pylon: a ring on the deck round its foot, turning
    const O = M.ov; if (O) { const p = pylonAt(C, O.i), X = FX.sx(p[0]), Y = FX.sy(p[1]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 + 0.25 * Math.sin(t * 7); blitSized(c, glowSprite(VIOLET), X - T * 2.4, Y - T * 1.6, T * 4.8, T * 3.2); c.globalAlpha = 0.9; c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(2, T * 0.09); c.setLineDash([T * 0.55, T * 0.3]); c.lineDashOffset = -t * T * 2; c.beginPath(); c.ellipse(X, Y, T * 1.9, T * 1.25, 0, 0, TAU); c.stroke(); c.setLineDash([]); c.restore(); } }

  /* ---- a capacitor pylon: a stepped plinth, a black mast ringed with coils, a copper contact low down for the web, a
     brass crown holding a glass cap of violet plasma; it overcharges white-hot, shatters, re-forms ---- */
  function drawPylon(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, i = p.i, q = (M.caps && M.caps[i]) || { k: 1, crack: 0, hot: 0, broke: 0 }, lw = Math.max(1.2, T * 0.06), O = M.ov, hot = q.hot || 0, charging = !!(O && O.i === i), W = M.web;
    const webOn = !!(W && W.rot === 0 && W.beams.some(b => b.a === i || b.b === i)), webLive = webOn && W.live, jx = charging ? Math.sin(t * 53) * T * 0.02 * hot : 0;
    c.save(); FX.K.shade(c, X, Y + T * 0.15, T * 1.3, T * 0.55, 0.45, '#04080C');
    // the plinth: two steps of dark steel with hazard banding
    const cyl = (r, z0, z1, col, sh, hi) => { const top = Y - z1 * T, bot = Y - z0 * T, ry = r * T * 0.42; TN.shape(c, g => { g.moveTo(X - r * T, top); g.lineTo(X - r * T, bot); g.ellipse(X, bot, r * T, ry, 0, Math.PI, 0, true); g.lineTo(X + r * T, top); g.closePath(); }, { col, shade: sh, hi, line: LINE, lw, r: T * r, spec: false, force: true, d1: 0.1, d2: 0.22 }); c.fillStyle = hi; c.beginPath(); c.ellipse(X, top, r * T, ry, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = lw; c.stroke(); };
    cyl(0.95, 0, 0.32, '#2E3A48', '#1A222C', '#5A6A7E');
    c.save(); c.beginPath(); c.ellipse(X, Y - 0.32 * T, 0.95 * T, 0.4 * T, 0, 0, TAU); c.clip(); for (let k = -6; k < 6; k++) { c.fillStyle = k % 2 ? '#1A1A1A' : '#C8902A'; c.beginPath(); c.moveTo(X + k * T * 0.22, Y - 0.72 * T); c.lineTo(X + k * T * 0.22 + T * 0.11, Y - 0.72 * T); c.lineTo(X + k * T * 0.22 - T * 0.25, Y + 0.1 * T); c.lineTo(X + k * T * 0.22 - T * 0.36, Y + 0.1 * T); c.closePath(); c.fill(); } c.restore();
    c.fillStyle = '#3E4C5E'; c.beginPath(); c.ellipse(X, Y - 0.32 * T, 0.62 * T, 0.26 * T, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = lw; c.stroke();
    cyl(0.55, 0.32, 0.62, '#3A4658', '#222A36', '#6A7A90');
    // the copper contact low on the mast, facing the hall, lit while the web uses it
    const cz = CON_Z + 0.1, ca = Math.atan2(FX.C.y - p.y, FX.C.x - p.x), ncx = X + Math.cos(ca) * T * 0.5, ncy = Y - cz * T + Math.sin(ca) * T * 0.2;
    // the mast
    TN.shape(c, TN.poly([[X - T * 0.27 + jx, Y - 0.62 * T], [X - T * 0.18 + jx, Y - 3.55 * T], [X + T * 0.18 + jx, Y - 3.55 * T], [X + T * 0.27 + jx, Y - 0.62 * T]]), { col: '#232836', shade: '#141820', hi: '#4A5268', line: LINE, lw, r: T * 0.35, spec: false, force: true, d1: 0.16, d2: 0.3,
      inner: g => { g.strokeStyle = 'rgba(120,140,170,.25)'; g.lineWidth = Math.max(1, T * 0.03); g.beginPath(); g.moveTo(X - T * 0.08 + jx, Y - 0.7 * T); g.lineTo(X - T * 0.05 + jx, Y - 3.5 * T); g.stroke(); } });
    // the coils: current climbs them (racing upward and white when it overcharges)
    for (let k = 0; k < 4; k++) { const z = 1.15 + k * 0.62, y = Y - z * T, rx = T * (0.48 - k * 0.04), ry = rx * 0.38, fl = 0.5 + 0.5 * Math.sin(t * (charging ? 14 : 3) - k * 1.3);
      c.fillStyle = '#4A5268'; c.beginPath(); c.ellipse(X + jx, y, rx, ry, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = lw; c.stroke();
      c.fillStyle = '#2A2F3E'; c.beginPath(); c.ellipse(X + jx, y + ry * 0.35, rx * 0.86, ry * 0.7, 0, 0, Math.PI); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.45 + 0.5 * fl) * (0.7 + hot * 0.6); c.strokeStyle = charging ? mixC(VIOLET_HI, '#FFFFFF', hot) : (k % 2 ? TEAL_HI : VIOLET_HI); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.ellipse(X + jx, y, rx * 0.9, ry * 0.85, 0, 0.1, Math.PI - 0.1); c.stroke(); c.restore(); }
    // the contact
    c.fillStyle = COPPER; c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.ellipse(X, Y - cz * T, T * 0.36, T * 0.16, 0, 0, TAU); c.fill(); c.stroke(); c.fillStyle = webOn ? '#FFFFFF' : COPPER_HI; c.beginPath(); c.arc(ncx, ncy, T * (webOn ? 0.14 : 0.09), 0, TAU); c.fill(); c.stroke();
    if (webOn) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = webLive ? 0.9 : 0.5 + 0.3 * Math.sin(t * 12); blitSized(c, glowSprite(VIOLET_HI), ncx - T * 0.8, ncy - T * 0.8, T * 1.6, T * 1.6); c.restore(); }
    // the brass crown: four prongs round the cap
    const capY = Y - CAP_Z * T, R0 = 0.6 * T;
    c.fillStyle = '#7E6538'; c.beginPath(); c.ellipse(X + jx, Y - 3.55 * T, T * 0.4, T * 0.15, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.stroke();
    const prong = s => { c.strokeStyle = LINE; c.lineWidth = T * 0.16; c.lineCap = 'round'; c.beginPath(); c.moveTo(X + jx + s * T * 0.3, Y - 3.55 * T); c.quadraticCurveTo(X + jx + s * T * 0.85, capY + T * 0.1, X + jx + s * T * 0.42, capY - T * 0.55); c.stroke(); c.strokeStyle = '#C8A860'; c.lineWidth = T * 0.08; c.stroke(); };
    prong(-1); prong(1);
    // the cap: a glass sphere of plasma; cracking as it is struck; white-hot with the charge; shattered; re-forming
    if (q.k > 0.02) { const r = R0 * (0.25 + 0.75 * q.k), k = 0.6 + 0.4 * Math.sin(t * (2.2 + hot * 12) + i); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.45 + 0.4 * k) * (0.6 + hot * 0.8); blitSized(c, glowSprite(hot > 0.6 ? '#FFFFFF' : VIOLET), X + jx - r * 3.2, capY - r * 3.2, r * 6.4, r * 6.4); c.restore();
      const gr = c.createRadialGradient(X + jx - r * 0.3, capY - r * 0.35, r * 0.1, X + jx, capY, r); gr.addColorStop(0, mixC('#F4D8FF', '#FFFFFF', hot)); gr.addColorStop(0.45, mixC(VIOLET, '#F0D0FF', hot * 0.8)); gr.addColorStop(1, mixC('#5A1A9A', VIOLET, hot)); c.fillStyle = gr; c.beginPath(); c.arc(X + jx, capY, r, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(X + jx, capY, r, 0, TAU); c.clip(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,230,255,.7)'; c.lineWidth = Math.max(1, T * 0.035); for (let j = 0; j < 3; j++) { const a0 = t * (1.5 + hot * 6) + j * 2.1; c.beginPath(); c.moveTo(X + jx, capY); for (let s = 1; s <= 4; s++) c.lineTo(X + jx + Math.cos(a0 + s * 0.5) * r * s / 4, capY + Math.sin(a0 + s * 0.7) * r * s / 4); c.stroke(); } c.restore();
      c.strokeStyle = LINE; c.lineWidth = lw; c.beginPath(); c.arc(X + jx, capY, r, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(X + jx - r * 0.38, capY - r * 0.42, r * 0.26, r * 0.13, -0.7, 0, TAU); c.fill();
      if (q.crack > 0.05) { c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1, T * 0.04); const n = Math.ceil(q.crack * 6); for (let j = 0; j < n; j++) { const a = j * 1.9 + 0.4; c.beginPath(); c.moveTo(X + jx + Math.cos(a) * r * 0.1, capY + Math.sin(a) * r * 0.1); c.lineTo(X + jx + Math.cos(a + 0.3) * r * 0.55, capY + Math.sin(a + 0.3) * r * 0.55); c.lineTo(X + jx + Math.cos(a - 0.1) * r, capY + Math.sin(a - 0.1) * r); c.stroke(); } }
      // little arcs off the cap as it overcharges
      if (hot > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; const fr = Math.floor(t * 20); for (let j = 0; j < 1 + Math.round(hot * 4); j++) { const a = hr(fr + j * 7 + i) * TAU, L = r * (1.3 + hr(fr + j) * 1.4); bolt3(c, X + jx + Math.cos(a) * r, capY + Math.sin(a) * r, X + jx + Math.cos(a) * L, capY + Math.sin(a) * L, fr + j * 3, T * 0.4, VIOLET, '#FFFFFF', 0.9); } c.restore(); } }
    if (q.k < 1) { // the shattered stub: glass teeth on the crown, smoking
      c.fillStyle = 'rgba(232,184,255,.65)'; c.strokeStyle = LINE; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(X - R0 * 0.8, capY + R0 * 0.55); for (let j = 0; j <= 6; j++) { const u = j / 6, x = X - R0 * 0.8 + u * R0 * 1.6, y = capY + R0 * 0.55 - (j % 2 ? R0 * 0.7 : R0 * 0.25); c.lineTo(x, y); } c.lineTo(X + R0 * 0.8, capY + R0 * 0.75); c.closePath(); c.fill(); c.stroke();
      if (Math.random() < 0.08) FX.H.part({ kind: 'smoke', x: p.x + FX.rnd(-0.2, 0.2), y: p.y - CAP_Z, vx: FX.rnd(-0.3, 0.3), vy: -0.8, life: 1.2, max: 1.2, size: 0.5, color: '#6A5A7A' }); }
    c.restore(); }

  /* ---- the Capacitor Hall: a disc of riveted steel deck plates, the four coolant channels cut across it, the copper bus
     rail round it, pads for the pylons, the conductor's node at the centre, a wall of pipes round the edge ---- */
  function paintHall(c, A) { const R = A.R, rnd = A.rnd;
    c.fillStyle = '#0C1418'; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    let g = c.createRadialGradient(-R * 0.15, -R * 0.2, R * 0.1, 0, 0, R); g.addColorStop(0, '#4A6274'); g.addColorStop(0.7, '#3E5566'); g.addColorStop(1, '#2C3E4C'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.clip();
    // deck plates, each its own tone, bevelled, riveted; a few of grating
    for (let y = -R - 1; y < R + 1; y += 2) for (let x = -R - 1; x < R + 1; x += 2) { if (Math.hypot(x + 1, y + 1) > R + 1.4) continue; const v = rnd();
      c.fillStyle = `rgba(${120 + v * 50},${150 + v * 45},${170 + v * 40},${0.07 + v * 0.08})`; c.fillRect(x + 0.05, y + 0.05, 1.9, 1.9);
      c.strokeStyle = 'rgba(200,225,240,.13)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x + 0.06, y + 1.94); c.lineTo(x + 0.06, y + 0.06); c.lineTo(x + 1.94, y + 0.06); c.stroke();
      c.strokeStyle = 'rgba(8,14,20,.5)'; c.beginPath(); c.moveTo(x + 1.94, y + 0.06); c.lineTo(x + 1.94, y + 1.94); c.lineTo(x + 0.06, y + 1.94); c.stroke();
      if (v < 0.14) { c.strokeStyle = 'rgba(10,18,24,.4)'; c.lineWidth = 0.04; for (let k = 0.3; k < 1.9; k += 0.25) { c.beginPath(); c.moveTo(x + 0.25, y + k); c.lineTo(x + 1.75, y + k); c.stroke(); } }
      c.fillStyle = 'rgba(14,22,30,.6)'; for (const [rx, ry] of [[0.22, 0.22], [1.78, 0.22], [0.22, 1.78], [1.78, 1.78]]) { c.beginPath(); c.arc(x + rx, y + ry, 0.06, 0, TAU); c.fill(); } }
    // scuffs and scorch marks where the cables have dragged
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = rnd() * (R - 1), x = Math.cos(a) * d, y = Math.sin(a) * d, L = 0.8 + rnd() * 2.2, b = rnd() * TAU; c.strokeStyle = `rgba(10,16,22,${0.12 + rnd() * 0.15})`; c.lineWidth = 0.08 + rnd() * 0.12; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(b + 0.4) * L * 0.5, y + Math.sin(b + 0.4) * L * 0.5, x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke(); }
    for (let i = 0; i < 6; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 4), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.5 + rnd() * 0.7, sg = c.createRadialGradient(x, y, 0, x, y, r); sg.addColorStop(0, 'rgba(20,10,30,.35)'); sg.addColorStop(1, 'rgba(20,10,30,0)'); c.fillStyle = sg; c.fillRect(x - r, y - r, r * 2, r * 2); }
    // the coolant channels: a dark trench, glowing teal coolant, a steel lip banded amber and black
    const chans = [[0, -CH], [0, CH], [-CH, 0], [CH, 0]], rect = ([x, y], w) => (x === 0 ? [-R - 1, y - w / 2, 2 * R + 2, w] : [x - w / 2, -R - 1, w, 2 * R + 2]);
    chans.forEach(ch => { const r = rect(ch, CW + 0.5); c.fillStyle = '#0A1418'; c.fillRect(...r); });
    chans.forEach(ch => { const r = rect(ch, CW), hz = ch[0] === 0, gg = hz ? c.createLinearGradient(0, r[1], 0, r[1] + r[3]) : c.createLinearGradient(r[0], 0, r[0] + r[2], 0); gg.addColorStop(0, '#0C3A3C'); gg.addColorStop(0.3, '#1C8E84'); gg.addColorStop(0.5, '#3FE0C8'); gg.addColorStop(0.7, '#1C8E84'); gg.addColorStop(1, '#0C3A3C'); c.fillStyle = gg; c.fillRect(...r); });
    c.strokeStyle = 'rgba(184,255,242,.3)'; c.lineWidth = 0.05; for (let i = 0; i < 90; i++) { const ch = chans[i % 4], hz = ch[0] === 0, u = (rnd() * 2 - 1) * R, o = (rnd() - 0.5) * CW * 0.8, x = hz ? u : ch[0] + o, y = hz ? ch[1] + o : u, L = 0.3 + rnd() * 0.6; c.beginPath(); c.moveTo(x, y); if (hz) c.quadraticCurveTo(x + L / 2, y + 0.12, x + L, y); else c.quadraticCurveTo(x + 0.12, y + L / 2, x, y + L); c.stroke(); }
    chans.forEach(ch => { const hz = ch[0] === 0; for (const e of [-1, 1]) { const off = e * (CW / 2 + 0.12); c.lineWidth = 0.15; c.strokeStyle = '#141414'; c.beginPath(); if (hz) { c.moveTo(-R - 1, ch[1] + off); c.lineTo(R + 1, ch[1] + off); } else { c.moveTo(ch[0] + off, -R - 1); c.lineTo(ch[0] + off, R + 1); } c.stroke(); c.strokeStyle = '#B4822C'; c.setLineDash([0.3, 0.42]); c.stroke(); c.setLineDash([]); } });
    // the bus rail: a copper ring through the pylons, with bridges over the coolant and insulators along it
    c.strokeStyle = 'rgba(8,10,14,.6)'; c.lineWidth = 0.55; c.beginPath(); c.arc(0, 0, PR, 0, TAU); c.stroke();
    for (const [w, col] of [[0.36, '#6E3C1C'], [0.2, COPPER], [0.06, COPPER_HI]]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(0, 0, PR, 0, TAU); c.stroke(); }
    for (let k = 0; k < 36; k++) { const a = k / 36 * TAU, x = Math.cos(a) * PR, y = Math.sin(a) * PR; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#E8E0CC'; c.fillRect(-0.12, -0.08, 0.24, 0.16); c.strokeStyle = '#2A2A2A'; c.lineWidth = 0.03; c.strokeRect(-0.12, -0.08, 0.24, 0.16); c.restore(); }
    // the pylons' pads: octagonal plates ringed amber and black
    PA.forEach(a => { const x = Math.cos(a) * PR, y = Math.sin(a) * PR; c.fillStyle = '#26323E'; c.beginPath(); for (let k = 0; k < 8; k++) { const b = k / 8 * TAU + Math.PI / 8; k ? c.lineTo(x + Math.cos(b) * 1.75, y + Math.sin(b) * 1.75) : c.moveTo(x + Math.cos(b) * 1.75, y + Math.sin(b) * 1.75); } c.closePath(); c.fill(); c.strokeStyle = '#C8902A'; c.lineWidth = 0.14; c.setLineDash([0.3, 0.3]); c.stroke(); c.setLineDash([]); c.strokeStyle = 'rgba(196,82,255,.45)'; c.lineWidth = 0.06; c.beginPath(); c.arc(x, y, 1.35, 0, TAU); c.stroke(); });
    // the conductor's node at the centre: rings of dark steel, violet inlay, vents
    c.fillStyle = '#26323E'; c.beginPath(); c.arc(0, 0, 2.4, 0, TAU); c.fill(); c.strokeStyle = 'rgba(8,12,18,.7)'; c.lineWidth = 0.08; c.stroke();
    c.strokeStyle = 'rgba(196,82,255,.6)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, 1.9, 0, TAU); c.stroke(); c.lineWidth = 0.05; c.beginPath(); c.arc(0, 0, 0.9, 0, TAU); c.stroke();
    for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.strokeStyle = 'rgba(8,12,18,.7)'; c.lineWidth = 0.18; c.beginPath(); c.moveTo(Math.cos(a) * 1.05, Math.sin(a) * 1.05); c.lineTo(Math.cos(a) * 1.7, Math.sin(a) * 1.7); c.stroke(); }
    c.fillStyle = 'rgba(232,184,255,.5)'; c.beginPath(); c.arc(0, 0, 0.35, 0, TAU); c.fill();
    const vg = c.createRadialGradient(0, 0, 0, 0, 0, 5); vg.addColorStop(0, 'rgba(196,82,255,.16)'); vg.addColorStop(1, 'rgba(196,82,255,0)'); c.fillStyle = vg; c.fillRect(-5, -5, 10, 10);
    c.restore();
    // the wall: a ring of dark steel round the hall, panelled, with teal lamps and a pipe run along it
    c.fillStyle = '#1C2630'; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.arc(0, 0, R + 0.05, 0, TAU, true); c.fill('evenodd');
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 0.06; for (let k = 0; k < 48; k++) { const a = k / 48 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * (R + 0.1), Math.sin(a) * (R + 0.1)); c.lineTo(Math.cos(a) * (R + 1.35), Math.sin(a) * (R + 1.35)); c.stroke(); }
    for (const [r, w, col] of [[R + 0.75, 0.42, '#0E161C'], [R + 0.75, 0.3, '#4A5E70'], [R + 0.68, 0.08, '#8AA2B6']]) { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU + 0.1, x = Math.cos(a) * (R + 1.15), y = Math.sin(a) * (R + 1.15); const lg = c.createRadialGradient(x, y, 0, x, y, 0.7); lg.addColorStop(0, 'rgba(184,255,242,.8)'); lg.addColorStop(0.3, 'rgba(63,224,200,.35)'); lg.addColorStop(1, 'rgba(63,224,200,0)'); c.fillStyle = lg; c.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); }
    c.strokeStyle = 'rgba(184,220,235,.35)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, R + 0.08, 0, TAU); c.stroke(); }
  /* the vault over the hall: dark steel, great pipes running across it, coolant tanks glowing teal in the gloom */
  function paintSky(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#02080A'); g.addColorStop(0.45, '#071A1E'); g.addColorStop(1, '#030C0E'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(61); c.save();
    // tanks: tall glass cylinders of coolant along the far wall
    for (let x = 14; x < W; x += 74) { const w = 30 + R() * 14, h = H * (0.14 + R() * 0.08), y0 = H * 0.06 + R() * H * 0.05; const tg = c.createLinearGradient(x, 0, x + w, 0); tg.addColorStop(0, 'rgba(30,140,130,.35)'); tg.addColorStop(0.4, 'rgba(120,240,220,.5)'); tg.addColorStop(1, 'rgba(20,90,90,.35)'); c.fillStyle = tg; c.fillRect(x, y0, w, h);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35; blitSized(c, glowSprite(TEAL), x - w, y0 - h * 0.3, w * 3, h * 1.6); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
      c.fillStyle = '#16222A'; c.fillRect(x - 4, y0 - 8, w + 8, 9); c.fillRect(x - 4, y0 + h, w + 8, 10); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x + w * 0.18, y0 + 4, 3, h - 8); }
    // pipes across the vault
    for (let i = 0; i < 4; i++) { const y = H * (0.02 + i * 0.045) + R() * 6, r = 6 + R() * 7; c.fillStyle = '#1A2630'; c.fillRect(0, y - r, W, r * 2); c.fillStyle = 'rgba(140,170,190,.25)'; c.fillRect(0, y - r * 0.6, W, r * 0.35); c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, y + r * 0.4, W, r * 0.6);
      for (let x = R() * 60; x < W; x += 60 + R() * 40) { c.fillStyle = '#2A3A46'; c.fillRect(x, y - r - 2, 7, r * 2 + 4); } }
    // gantries and a violet seam of current crawling over the vault
    c.strokeStyle = '#0E161C'; c.lineWidth = 4; for (let x = -20; x < W + 20; x += 46) { c.beginPath(); c.moveTo(x, H * 0.26); c.lineTo(x + 23, H * 0.21); c.lineTo(x + 46, H * 0.26); c.stroke(); } c.fillStyle = '#0E161C'; c.fillRect(0, H * 0.26 - 3, W, 6);
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(196,82,255,.5)'; c.lineWidth = 2; c.beginPath(); let x = 0, y = H * 0.235; c.moveTo(x, y); while (x < W) { x += 14 + R() * 18; y = H * 0.235 + (R() - 0.5) * 10; c.lineTo(x, y); } c.stroke();
    // the far end: the bottom of the vault, deep in shadow, pipes going down
    for (let x2 = 20; x2 < W; x2 += 58) { const gg = c.createLinearGradient(x2, 0, x2 + 16, 0); gg.addColorStop(0, '#0E1A20'); gg.addColorStop(0.5, '#24343E'); gg.addColorStop(1, '#0E1A20'); c.globalCompositeOperation = 'source-over'; c.fillStyle = gg; c.fillRect(x2, H * 0.7, 16, H * 0.3); }
    c.restore(); }
})());
