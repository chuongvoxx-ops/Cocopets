/* ---------- NYAR'ZHUL, HEART OF THE ENGINE ----------
   The Yuggoth Engine's last boss, in the Core Chamber: a broad oval floor some thirty-four metres across, laid in plates
   of flesh-grown metal in rings round the heart, nerve cables running over it from the heart to four capacitors at its
   edge, five raised steel grates standing a hand above it, and a short steel gantry running from the northern rim to
   the heart's foot. Beyond the rim the chamber falls away into a pit of pipes.
   Nyar'zhul is the living heart of the crashed engine, set into the chamber's north wall and filling its skyline: a vast
   lobed organ of violet flesh wrapped in riveted steel bands, three great vessels rising from it into the hull (steam
   venting from their valves), two atria swelling behind, four pistons beside it rising and falling with its beat, hoses
   and nerve cables running from its foot across the floor, and at its centre one great glass lens-eye with an iris of
   steel blades, glowing amber. Three long cable-tentacles with clamp heads lie out from its foot over the floor.
   It beats: everything throbs on the beat (the organ swells, the pistons slam, the cables pulse, the chamber breathes).
   Heartbeat Pulse (all fight): on its beats rings run out across the floor from its foot; each has one gap. Stand in the
   gap, or roll through the ring.
   Piston Row: rows of pistons drop out of the dark onto shown lanes, numbered, one after another (or in two waves).
   Cable Lash and Clamp: a cable rears and sweeps a shown arc, or rises over a shown circle and clamps down on it; a clamp
   that holds (and a cable spent by its sweep) can be struck for more.
   Coolant Flood (below 70%): teal coolant rises from the rim drains over the whole floor, burning and slowing: climb onto
   a raised grate before it fills.
   Overload: it charges some of its capacitors; break every charged one before the charge is full and the heart sags,
   its lens bared (the weak point) for six seconds. Fail, and the charge leaps at the pet.
   The Repair Swarm (once, at half health): its vents open and three hundred repair mites pour out (no more than sixty
   at once), flung across the floor; each crawls back to one of the heart's three repair ports and, reaching it, mends
   the heart. It cannot be struck while they pour, and it keeps pulsing at the pet. When the last is gone it overheats
   and stalls: red hot, sagging, its lens bared for longer.
   Overdrive (below 30%): everything quickens and the pulses come doubled.
   Its fall hands over to the rift's sealing (the engine falls silent). */
RiftFiend.define({ id: 'nyarzhul', name: 'Nyar\'zhul', title: 'Heart of the Engine', color: '#7A3A6E', glow: '#FFB23F', accent: '#E8B8FF', biome: 'engineheart', r: 3.0, els: ['thunder', 'dark', 'fire'], phases: 3, cuts: [1, 0.7, 0.3] }, (() => {
  const { TAU, TN } = RiftFiend, { VIOLET, VIOLET_HI, TEAL, TEAL_HI, AMBER, FLESH, FUNGUS } = YUG, K = DunFiend.KIT;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const INK2 = '#1A0C1A', AMBER_HI = '#FFE2A0', STEEL = '#5A6278', STEEL_HI = '#AEB6CC', STEEL_DK = '#2A2F3E', HEAL = '#8FFFB0';
  /* the chamber (all about the arena's centre C): the oval floor, the gantry to the heart's foot, where the rings start */
  const RX = 17, RY = 12, GW = 2.4, GN = -15.2, SRC = [0, -13.2];
  const GRATES = [[-8.8, -3.4], [8.8, -3.4], [-4.8, 6.2], [4.8, 6.2], [0, 0.4]], GX = 1.75, GY = 1.3;
  const CAPS = [[-14.9, -4.6], [14.9, -4.6], [-11.2, 7.7], [11.2, 7.7]];
  const PORTS = [[-6.3, -11.0], [0, -13.6], [6.3, -11.0]];
  const inOval = (x, y, pad) => (x / (RX - (pad || 0))) ** 2 + (y / (RY - (pad || 0))) ** 2 < 1;
  const inPlat = (C, x, y, pad) => inOval(x - C.x, y - C.y, pad);
  const onGantry = (C, x, y) => Math.abs(x - C.x) < GW && y - C.y < -11.2 && y - C.y > GN;
  const onGrate = (C, x, y, pad) => GRATES.some(([gx, gy]) => Math.abs(x - C.x - gx) < GX + (pad || 0) && Math.abs(y - C.y - gy) < GY + (pad || 0));
  const onFloor = (C, x, y) => inPlat(C, x, y) || onGantry(C, x, y);
  /* the heart: its ground plane HY (behind the rim) and the height HZ of its centre; the vents, the cable roots */
  const HY = -17.4, HZ = 6.6, HW = 9.2, HH = 8.2;
  const VENTS = [[-7.3, -2.8], [7.3, -2.8]];
  const ROOTS = [[-7.0, -15.9, 2.4], [7.0, -15.9, 2.4], [0.5, -16.2, 1.1]], REST = [[-10.6, -5.0], [10.6, -5.0], [3.6, -8.4]], CABW = [1.0, 1.0, 0.72];
  const PIST = [{ x: -11.7, w: 2.4, ph: 0 }, { x: 11.7, w: 2.4, ph: 0.5 }, { x: -15.9, w: 1.9, ph: 0.5 }, { x: 15.9, w: 1.9, ph: 0 }];
  const VESSELS = [{ pts: [[0.6, 5.6], [1.6, 9.8], [0.4, 13.2], [-2.2, 15.0], [-5.2, 15.8]], w: 2.7, valve: 0.42 }, { pts: [[-4.2, 6.8], [-6.8, 10.0], [-10.8, 11.6], [-15.6, 11.9], [-22, 11.4]], w: 2.0, valve: 0.5 }, { pts: [[4.8, 6.0], [7.8, 9.2], [11.6, 10.4], [16.6, 10.1], [22.5, 9.2]], w: 1.8, valve: 0.5 }];
  const LW = 2.6, LANES = [-10.4, -7.8, -5.2, -2.6, 0, 2.6, 5.2, 7.8, 10.4];
  const SWARM = 300, SWARM_CAP = 60, HEAL_K = 0.004;
  const CYC1 = ['pulse', 'pistons', 'lash', 'clamp', 'pulse', 'overload'], CYC2 = ['pulse', 'lash', 'pistons', 'clamp', 'flood', 'overload'], CYC3 = ['pulse', 'pistons', 'lash', 'flood', 'clamp', 'pistons', 'overload'];
  const FLESH_B = { col: '#8E427C', shade: '#62285A', shade2: '#45163F', hi: '#C770B0' }, ATR_B = { col: '#78386C', shade: '#52204A', hi: '#A85696' };
  /* the nerve cables over the floor, from the heart's foot to the capacitors and the grates */
  const crSample = (pts, n) => { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let k = 0; k < n; k++) { const u = k / n, u2 = u * u, u3 = u2 * u; out.push([0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * u + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * u2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * u3), 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * u + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * u2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * u3)]); } } out.push(pts[pts.length - 1]); return out; };
  const NERVES = [[[-3.4, -11.9], [-4.6, -8.8], [-3.2, -6.0], [-4.4, -1.2], [-7.6, 1.6], [-10.4, 4.8], [-11.2, 7.1]], [[3.4, -11.9], [4.6, -8.8], [3.0, -5.6], [4.6, -1.4], [7.8, 1.8], [10.2, 4.8], [11.2, 7.1]],
    [[-8.6, -10.6], [-11.4, -8.8], [-13.2, -6.8], [-14.6, -5.2]], [[8.6, -10.6], [11.4, -8.8], [13.2, -6.8], [14.6, -5.2]], [[-1.0, -11.6], [-0.2, -8.6], [1.6, -5.6], [1.2, -2.4], [0.4, -0.9]], [[0.3, 1.7], [-1.6, 4.2], [-0.8, 7.4], [1.0, 10.8]]].map(p => crSample(p, 8));
  const NERVE_L = NERVES.map(P => { let s = 0; const acc = [0]; for (let i = 1; i < P.length; i++) { s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); acc.push(s); } return { acc, L: s }; });
  const alongNerve = (k, d) => { const P = NERVES[k], A = NERVE_L[k].acc; let i = 1; while (i < A.length - 1 && A[i] < d) i++; const u = clamp((d - A[i - 1]) / Math.max(1e-6, A[i] - A[i - 1]), 0, 1); return [lerp(P[i - 1][0], P[i][0], u), lerp(P[i - 1][1], P[i][1], u)]; };
  /* the heart's veins and fungus, laid out once */
  const VEINS = (() => { const R = mulberry32(4471), out = []; for (let i = 0; i < 9; i++) { let a = R() * TAU, x = Math.cos(a) * 5.5, z = Math.sin(a) * 4.6; const pts = [[x, z]]; const d = R() * TAU; for (let k = 0; k < 5; k++) { x += Math.cos(d + (R() - 0.5) * 1.6) * 1.3; z += Math.sin(d + (R() - 0.5) * 1.6) * 1.1; pts.push([x, z]); } out.push(pts); } return out; })();
  const SHROOMS = [[-6.4, -4.6, 1.0], [-5.4, -5.6, 0.7], [-7.4, -3.4, 0.6], [6.6, -3.8, 0.9], [7.6, -2.4, 0.6], [-3.6, 5.8, 0.6], [-2.6, 6.4, 0.45], [5.6, -5.4, 0.55]];
  const JAG = (() => { const R = mulberry32(919), out = []; for (let i = 0; i <= 28; i++) out.push((R() - 0.5) * 1.6); return out; })();
  const lashO = (C, k) => [C.x + (k ? 6.2 : -6.2), C.y - 10.8];
  let vigCv = null;
  // the mites (in the rift's brood): flung out of the vents, they land and crawl back to the nearest port
  Object.assign(MON, { repairmite: { name: 'Repair mite', from: 999, hp: 200, spd: 1.45, r: 0.32, dmg: 6, xp: 3, coin: 0.05, color: '#4A5268', bio: [], tip: 'A repair mite of the engine\'s heart. It crawls back to the heart\'s ports and mends it: kill it first.', kit: [] } });
  Object.assign(DunAI.mon, { repairmite(m, A, X) {
    if (m.launch) { const L = m.launch; L.t += A.dt; const u = clamp(L.t / L.dur, 0, 1); m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); m.z = lerp(L.z0, 0, u) + Math.sin(u * Math.PI) * L.h; if (u >= 1) { m.launch = null; m.z = 0; m.under = false; X.ring(m.x, m.y, 0.1, 0.9, 0.25, AMBER, 0.25); } return; }
    const h = m.home; if (!h) return; const dx = h.x - m.x, dy = h.y - m.y, d = Math.hypot(dx, dy); if (d < 0.7) { if (m.onHome) m.onHome(m); return; }
    X.moveEnt(m, dx / d * m.spd * A.dt, dy / d * m.spd * A.dt); m.face = dx >= 0 ? 1 : -1; } });
  { const { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt, gl = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
    /* a repair mite: a domed gunmetal shell on six spindly legs, one amber eye, two little wrench claws, a teal lamp on its back */
    MP.repairmite = (c, r, ph, o) => { const lw = lwOf(r), run = Math.sin(ph * TAU * 2), on = (ph * 4) % 1 < 0.5;
      c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(0, r * 0.75, r * 0.9, r * 0.26, 0, 0, TAU); c.fill();
      c.lineCap = 'round'; for (let i = 0; i < 3; i++) for (const sd of [-1, 1]) { const x = -r * 0.45 + i * r * 0.45, k = (i + (sd > 0 ? 1 : 0)) % 2 ? 1 : -1, fx = x + sd * r * 0.1 + run * r * 0.14 * k; c.strokeStyle = LN; c.lineWidth = lw * 1.5; c.beginPath(); c.moveTo(x, r * 0.1); c.lineTo(x + sd * r * 0.05, -r * 0.05 + (sd > 0 ? 0 : 0)); c.lineTo(fx, r * 0.72); c.stroke(); c.strokeStyle = '#8A92A8'; c.lineWidth = lw * 0.6; c.stroke(); }
      // the claws
      for (const sd of [-1, 1]) { c.strokeStyle = LN; c.lineWidth = lw * 1.6; c.beginPath(); c.moveTo(r * 0.5, r * 0.05 + sd * r * 0.16); c.lineTo(r * 0.95, r * 0.12 + sd * r * 0.26); c.stroke(); c.strokeStyle = '#B8C0D4'; c.lineWidth = lw * 0.7; c.stroke(); c.fillStyle = '#B8C0D4'; c.beginPath(); c.arc(r * 0.98, r * 0.12 + sd * r * 0.26, r * 0.1, 0, TAU); c.fill(); stroke(c, lw * 0.6); }
      c.beginPath(); c.ellipse(0, 0, r * 0.82, r * 0.58, 0, 0, TAU); c.fillStyle = shade(c, o.color || '#4A5268', r, -r * 0.2, -r * 0.35, 0.45); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(-r * 0.3, -r * 0.52); c.quadraticCurveTo(-r * 0.4, 0, -r * 0.3, r * 0.5); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.ellipse(-r * 0.2, -r * 0.32, r * 0.32, r * 0.12, -0.3, 0, TAU); c.fill();
      gl(c, r * 0.5, -r * 0.04, r * 0.6, AMBER, 0.6); c.fillStyle = AMBER; c.beginPath(); c.arc(r * 0.52, -r * 0.04, r * 0.17, 0, TAU); c.fill(); stroke(c, lw * 0.7); c.fillStyle = '#2A1A08'; c.beginPath(); c.arc(r * 0.57, -r * 0.04, r * 0.07, 0, TAU); c.fill();
      gl(c, -r * 0.05, -r * 0.6, r * (on ? 0.7 : 0.45), TEAL, on ? 0.75 : 0.35); c.fillStyle = on ? TEAL_HI : TEAL; c.beginPath(); c.ellipse(-r * 0.05, -r * 0.56, r * 0.16, r * 0.12, 0, Math.PI, TAU); c.closePath(); c.fill(); stroke(c, lw * 0.6); };
    Object.assign(EXT, { repairmite: 2.0 }); Object.assign(NF, { repairmite: 6 }); }
  return {
    arenaR: 17.5, firstAct: 'beat',
    artPoses: [{ name: 'beating', mem: { demo: 1 } }, { name: 'the lens bared', mem: { demo: 1, demoSag: 1 } }, { name: 'the vents open', mem: { demo: 1, demoOpen: 1 } }, { name: 'overheated', mem: { demo: 1, demoSag: 1, demoHeat: 1 } }],
    phaseNames: ['Heartbeat', 'Coolant Flood', 'Overdrive'],
    start(C) { return { x: C.x + 0.5, y: C.y + 7.2 }; },
    // the walkable ground is the oval and the gantry; everything else is the pit
    carve(set, C) { const RR = Math.ceil(C.R) + 2; for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y, cx = wx + 0.5, cy = wy + 0.5;
        if (!inPlat(C, cx, cy, 0.2) && !onGantry(C, cx, cy)) set(wx, wy, T_SOLID); } },
    props(C) { return CAPS.map((p, i) => ({ kind: 'cap', i, x: C.x + p[0], y: C.y + p[1] })); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'cap') drawCap(c, FX, p, X, Y, T, t); },
    paintGround(c, A) { paintCore(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    camFocus(FX, m) { const C = FX.C, M = FX.mem; if (!M.P) return null; if (m.dead) return M.deadT != null && M.deadT < 2.5 ? { x: C.x, y: C.y - 17, k: 0.6, zoom: 0.45 } : null; if (m.act === 'enter') return { x: C.x, y: C.y - 19, k: 0.6, zoom: 0.43 };
      if (m.stunT > 0) return { x: C.x, y: C.y - 17, k: 0.55, zoom: 0.47 }; return { x: C.x, y: C.y - 19, k: 0.55, zoom: 0.43 }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0;
      Object.assign(M, { bt: 0, beatT: 1.6, lub: 0, dub: 0, dubT: 0, beats: 0, lastBeat: -9, q: [], qt: 0, seen: {}, picks: 0, nextSig: null, recoil: 0, rings: [], ring2T: 0, pl: null, fl: null, ov: null, sw: null, swDone: false, stall: false, slams: [], pistK: 0, repairT: 0, wasStun: false, roared: false, look: [0, 0.3], lookT: [0, 0.3], dartT: 1, ap: 0.6,
        caps: CAPS.map(() => ({ st: 'idle', o: null, t: 0 })),
        cab: ROOTS.map((r, k) => ({ k, mode: 'rest', t: 0, tip: [C.x + REST[k][0], C.y + REST[k][1], 0.35], lift: 0, jaw: 0.3, pts: null, px: null })),
        stat: { rings: 0, ringHit: 0, ringPass: 0, lanes: 0, laneHit: 0, laneSafe: 0, lashes: 0, lashHit: 0, clamps: 0, clampHit: 0, floods: 0, floodHits: 0, floodWet: 0, floodDry: 0, overloads: 0, bared: 0, discharges: 0, repairs: 0, healed: 0, poured: 0 } });
      M.P = { sag: 0, heat: 0, open: 0, dk: 0, wake: 0, rec: 0 }; m.x = C.x; m.y = C.y - 15.3; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; resetAll(FX, m); M.recoil = 1; FX.H.shake(10, 0.5); FX.H.flash(0.2, AMBER); FX.H.sfx.hum();
      if (lv === 2) { M.nextSig = 'flood'; M.picks = 0; minions(FX, ['sparkmite', 'coilsentry', 'sparkmite']); FX.H.banner('COOLANT FLOOD', 'Its coolant will flood the floor: climb onto a raised grate', TEAL_HI, 2.8, true); }
      if (lv >= 3) { M.nextSig = 'pulse'; M.picks = 0; minions(FX, ['hullwing', 'sparkmite']); FX.H.banner('OVERDRIVE', 'Everything quickens: its pulses come doubled', AMBER, 2.8, true); } },
    ai(FX, m, dt) {
      const M = FX.mem, P = FX.S.lv; m.actT += dt; m.noTouch = true;
      M.qt += dt; while (M.q.length && M.q[0].at <= M.qt) M.q.shift().fn();
      // the repair swarm: once, half way down
      if (!M.swDone && !M.sw && P >= 2 && m.act === 'beat' && m.hp <= m.maxhp * 0.52) startSwarm(FX, m);
      switch (m.act) {
        case 'swarm': swarmTick(FX, m, dt); break;
        case 'beat': if (m.actT > (P >= 3 ? 1.15 : P >= 2 ? 1.5 : 1.8) / FX.S.fast) choose(FX, m); break;
        case 'pulse': if ((M.pl && M.pl.left <= 0 && !(M.ring2T > 0) && M.rings.every(R => R.passed || R.hit || R.r > 27)) || m.actT > 16) endAct(m); break;
        case 'pistons': if (m.actT > M.pistEnd) endAct(m); break;
        case 'lash': if (!M.q.length && m.actT > M.lashEnd) endAct(m); break;
        case 'clamp': if (!M.q.length && m.actT > M.clampEnd) endAct(m); break;
        case 'flood': if (!M.fl || m.actT > 24) { endAct(m); if (P >= 2) minions(FX, P >= 3 ? ['hullwing', 'coilsentry'] : ['sparkmite', 'hullwing']); } break;
        case 'overload': if (M.ov) { M.ov.t += dt; if (M.ov.t >= M.ov.W) discharge(FX, m); } else if (m.actT > M.ovEnd) endAct(m); break;
      }
      if (!m.under) FX.parts(partsList(FX, m));
    },
    stunned(FX, m, dt) { const M = FX.mem, C = FX.C; m.noTouch = true; FX.weak('lens', C.x, C.y - 13.5, 2.3, M.stall ? 2.5 : 2.25, m.stunT > 0.05);
      M.shT = (M.shT || 0) - dt; if (M.shT <= 0) { M.shT = M.stall ? 0.25 : 0.45; const L = lensAt(FX); if (L) FX.H.sparks(L[0] + FX.rnd(-2.5, 2.5), L[1] + FX.rnd(-1.5, 1.5), M.stall ? '#FF8A4A' : AMBER_HI, 4, 3); if (M.stall) steam(FX, FX.rnd(-8, 8), FX.rnd(2, 9), 1, '#F4E4E8'); } },
    update(FX, dt) { const M = FX.mem, m = FX.m, C = FX.C, me = FX.me; if (!m || !M.P) return; M.bt += dt;
      M.lub = decay(M.lub, dt, 3.2); M.dub = decay(M.dub, dt, 3.6); M.recoil = decay(M.recoil, dt, 1.8); M.repairT = decay(M.repairT, dt, 1);
      // fallen: the beat falters and stops, the lens goes dark, the heart slumps onto its gantry
      if (m.dead) { if (M.deadT == null) { M.deadT = 0; M.rings.length = 0; M.fl = null; M.ov = null; M.sw = null; M.q.length = 0; M.slams.length = 0; for (const cp of M.caps) { if (cp.o) cp.o.dead = true; cp.o = null; cp.st = 'idle'; } for (const cb of M.cab) { releaseCab(cb); cb.mode = 'rest'; } M.lastDie = 0; }
        M.deadT += dt; const beats = [0.5, 1.7, 3.3]; if (M.lastDie < beats.length && M.deadT > beats[M.lastDie]) { M.lub = [0.8, 0.45, 0.2][M.lastDie]; M.lastDie++; FX.H.sfx.thud(); steam(FX, FX.rnd(-6, 6), FX.rnd(3, 12), 4, '#F4E4E8'); }
        if (Math.random() < dt * 6) FX.H.sparks(C.x + FX.rnd(-8, 8), C.y + HY - FX.rnd(0, 9), VIOLET_HI, 3, 3);
        easePose(FX, m, dt); cables(FX, m, dt); return; }
      // the stun over: the lens closes and it heaves itself up again
      if (!(m.stunT > 0)) { if (FX.S.weak.lens) FX.weak('lens', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.stall = false; M.recoil = 1; for (const cp of M.caps) cp.st = 'idle'; FX.H.text(m.x, m.y - 6, 'It heaves itself up again', AMBER, 13); FX.H.sfx.hum(); } } else M.wasStun = true;
      // the beat (it wakes during its entrance)
      const awake = m.act !== 'enter' || (FX.S.enterT || 0) > 1.5;
      if (awake) { M.beatT -= dt; if (M.beatT <= 0) { M.beatT = beatPeriod(FX, m); onBeat(FX, m); } }
      if (m.act === 'enter' && (FX.S.enterT || 0) > 1.5 && !M.roared) { M.roared = true; M.recoil = 1; FX.H.shake(10, 0.7); FX.H.flash(0.25, AMBER); FX.H.sfx.hum(); }
      if (M.dubT > 0) { M.dubT -= dt; if (M.dubT <= 0) { M.dub = 1; FX.H.sfx.thud(); } }
      if (M.ring2T > 0) { M.ring2T -= dt; if (M.ring2T <= 0) emitRing(FX, m, true); }
      rings(FX, m, dt); flood(FX, m, dt);
      for (const s of M.slams) s.t += dt; while (M.slams.length && M.slams[0].t > 1.2) M.slams.shift();
      if (M.ov) for (const cp of M.caps) if (cp.st === 'charged') cp.t += dt;
      easePose(FX, m, dt); cables(FX, m, dt);
      // the lens: it follows the pet, darting now and then; the iris contracts on the beat and when struck
      const L = [clamp((me.x - C.x) / 13, -1, 1), clamp((me.y - (C.y - 14)) / 16, -0.5, 1)]; M.dartT -= dt; if (M.dartT <= 0) { M.dartT = 0.8 + Math.random() * 1.6; M.dart = [FX.rnd(-0.7, 0.7), FX.rnd(-0.6, 0.6)]; M.dartU = 0.28; }
      if (M.dartU > 0) { M.dartU -= dt; L[0] = clamp(L[0] + M.dart[0], -1, 1); L[1] = clamp(L[1] + M.dart[1], -1, 1); }
      M.look[0] = toward(M.look[0], L[0], dt, 14); M.look[1] = toward(M.look[1], L[1], dt, 14);
      const apT = clamp(0.62 - (M.lub * 0.22 + M.dub * 0.1) - M.recoil * 0.4 + M.P.sag * 0.5 + (M.sw ? -0.12 : 0) + (M.stall && m.stunT > 0 ? Math.sin(M.bt * 13) * 0.15 : 0), 0.18, 1.15); M.ap = toward(M.ap, apT, dt, 9);
      // the swarm's drones mend it at the ports: their glow
      if (M.sw && Math.random() < dt * 8) { const v = VENTS[Math.random() < 0.5 ? 0 : 1]; steam(FX, v[0], HZ + v[1] - M.P.sag * 3.8, 1, '#E8C8DA'); } },
    dmgK(FX, m) { FX.mem.recoil = Math.max(FX.mem.recoil || 0, 0.4); return 0.85; },
    onWeakHit(FX) { FX.mem.recoil = 1; },
    keep: { every: 2, pad: 2 },
    draw(c, FX, m, X, Y, T, t) { if (!(FX.S && FX.S.started)) { demoPaint(c, FX, m, X, Y, T, t); return; } const P3 = TN.cam(X, Y, T, m); paintAll(c, FX, m, P3, T, FX.mem.bt || t, FX.C, FX.mem); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'cap') { const pu = 0.5 + 0.5 * Math.sin(t * 8); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = VIOLET_HI; c.globalAlpha = 0.5 + 0.4 * pu; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.ellipse(X, Y, T * 1.35, T * 0.8, 0, 0, TAU); c.stroke(); c.restore(); label(c, 'BREAK', X, Y - T * 3.9, T * 0.85, '#FFFFFF'); } },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.1 : 1.1, true); }
  function at(M, dt, fn) { M.q.push({ at: M.qt + dt, fn }); M.q.sort((a, b) => a.at - b.at); }
  function endAct(m) { m.act = 'beat'; m.actT = 0; }
  function minions(FX, types) { const C = FX.C, me = FX.me, alive = FX.H.mons.filter(q => !q.dead && q.fminion && !q.swarm).length; types.slice(0, Math.max(0, 3 - alive)).forEach((ty, i) => { const a = Math.atan2(me.y - C.y, me.x - C.x) + Math.PI + (i - 1) * 0.9; let x = C.x + Math.cos(a) * 9, y = C.y + Math.sin(a) * 6.5; if (!inPlat(C, x, y, 1.5)) { x = C.x + (i - 1) * 4; y = C.y - 4; } FX.H.ring(x, y, 0.2, 1.6, 0.4, VIOLET_HI, 0.4); FX.H.sparks(x, y, VIOLET_HI, 10, 5); const q = FX.minion(ty, x, y); if (q) q.cd = 1.5; }); }
  function beatPeriod(FX, m) { const P = FX.S.lv; return (m.stunT > 0 ? 1.9 : m.act === 'swarm' ? 1.2 : P >= 3 ? 1.05 : P >= 2 ? 1.3 : 1.5) / FX.S.fast; }
  function onBeat(FX, m) { const M = FX.mem; M.lub = 1; M.dubT = 0.2; M.beats++; M.lastBeat = M.bt; FX.H.sfx.thud(); FX.H.shake(1.4, 0.07);
    VESSELS.forEach((V, i) => { if (Math.random() < 0.7) { const p = vesselAt(V, 0.62); steam(FX, p[0], p[1] - M.P.sag * 3.8, 2, i ? '#E8D8F0' : '#F4E8F4'); } });
    if (m.act === 'pulse' && M.pl && M.pl.left > 0) { M.pl.left--; emitRing(FX, m, false); if (FX.S.lv >= 3) M.ring2T = 0.3 / FX.S.fast; }
    if (m.act === 'swarm' && M.sw && M.beats % 2 === 0) emitRing(FX, m, false); }
  // a puff of steam at a point on the heart (heart-local x and height)
  function steam(FX, x, z, n, col) { const C = FX.C; for (let i = 0; i < n; i++) FX.H.part({ kind: 'smoke', x: C.x + x + FX.rnd(-0.4, 0.4), y: C.y + HY - z, vx: FX.rnd(-1, 1), vy: FX.rnd(-3.2, -1.6), drag: 0.6, life: 1.3, max: 1.3, size: 1.2 + Math.random() * 0.8, color: col || '#EED8EE' }); }
  function resetAll(FX, m) { const M = FX.mem; M.q.length = 0; M.rings.length = 0; M.ring2T = 0; M.pl = null; M.fl = null; M.ov = null; M.slams.length = 0;
    for (const cp of M.caps) { if (cp.o && !cp.o.dead) cp.o.dead = true; cp.o = null; cp.st = 'idle'; } for (const cb of M.cab) { releaseCab(cb); cb.mode = 'rest'; cb.t = 0; }
    FX.untarget(false); m.act = 'beat'; m.actT = 0; }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv; m.actT = 0; let a = M.nextSig; M.nextSig = null;
    if (!a) { const cyc = P >= 3 ? CYC3 : P >= 2 ? CYC2 : CYC1; a = cyc[M.picks++ % cyc.length]; }
    if (a === 'pulse') return startPulse(FX, m); if (a === 'pistons') return startPistons(FX, m); if (a === 'lash') return startLash(FX, m); if (a === 'clamp') return startClamp(FX, m); if (a === 'flood') return startFlood(FX, m); if (a === 'overload') return startOverload(FX, m); }
  /* the hit proxies on its body: its foot at the gantry and the rim, and the cables lying over the floor */
  function partsList(FX, m) { const C = FX.C, M = FX.mem, out = [{ key: 'foot', dx: 0, dy: C.y - 13.3 - m.y, r: 2.3 }, { key: 'footW', dx: -6.0, dy: C.y - 11.0 - m.y, r: 1.8 }, { key: 'footE', dx: 6.0, dy: C.y - 11.0 - m.y, r: 1.8 }];
    M.cab.forEach((cb, k) => { const ok = cb.lift < 0.3 && cb.pts && cb.mode !== 'hold' && cb.mode !== 'spent'; for (const [j, u] of [[0, 0.55], [1, 0.94]]) { if (!ok) { out.push({ key: `cab${k}${j}`, dx: 0, dy: C.y - 13.3 - m.y, r: 1.2 }); continue; } const p = cb.pts[Math.round(u * (cb.pts.length - 1))]; out.push({ key: `cab${k}${j}`, dx: p[0] - m.x, dy: p[1] - p[2] - m.y, r: 0.85 }); } });
    return out; }
  function lensAt(FX) { const M = FX.mem, C = FX.C; if (!M.P) return null; const sag = M.P.sag; return [C.x, C.y + HY + sag * 0.8 - (HZ - sag * 3.8 - 1.4)]; }

  /* ---- Heartbeat Pulse: a ring on each beat, running out over the floor from its foot; one gap in each ---- */
  function startPulse(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'pulse'; m.actT = 0; M.pl = { left: P >= 3 ? 4 : P >= 2 ? 5 : 4 }; M.beatT = Math.min(M.beatT, 0.5); FX.H.sfx.hum();
    say(FX, 'pulse', 'HEARTBEAT PULSE', P >= 3 ? 'The rings come doubled: roll through them' : 'Rings run out on its beat: stand in the gap, or roll through', VIOLET_HI); }
  function emitRing(FX, m, second) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, ox = C.x + SRC[0], oy = C.y + SRC[1], dP = Math.hypot(me.x - ox, me.y - oy), aP = Math.atan2(me.y - oy, me.x - ox);
    let gap = aP + (second ? (Math.random() < 0.5 ? -1 : 1) * FX.rnd(0.45, 0.8) : FX.rnd(-0.5, 0.5)); if (second && M.lastGap != null) gap = M.lastGap + (Math.random() < 0.5 ? -1 : 1) * FX.rnd(0.5, 0.8);
    gap = clamp(gap, 0.25, Math.PI - 0.25); M.lastGap = gap;
    M.rings.push({ r: 0.8, v: (P >= 3 ? 6.4 : P >= 2 ? 5.8 : 5.3) * FX.S.fast, w: 1.1, gap, gw: clamp(1.5 / Math.max(5, dP), 0.07, 0.3), hit: false, passed: false, age: 0 }); M.stat.rings++;
    FX.H.ring(ox, oy, 0.3, 3, 0.35, VIOLET_HI, 0.4); }
  function rings(FX, m, dt) { const M = FX.mem, me = FX.me, C = FX.C, ox = C.x + SRC[0], oy = C.y + SRC[1];
    for (const R of M.rings) { R.r += R.v * dt; R.age += dt; if (R.hit || R.passed || me.dead) continue; const d = Math.hypot(me.x - ox, me.y - oy);
      if (Math.abs(d - R.r) < R.w / 2 + me.r * 0.5) { const inGap = Math.abs(K.angTo(R.gap, Math.atan2(me.y - oy, me.x - ox))) < R.gw; if (!inGap && !me.dodge) { R.hit = true; M.stat.ringHit++; FX.hurt(m.dmg * 1.15); FX.H.text(me.x, me.y - 1.6, 'The pulse!', VIOLET_HI, 13); FX.H.sparks(me.x, me.y, VIOLET_HI, 8, 4); } }
      else if (R.r - R.w / 2 > d + me.r) { R.passed = true; M.stat.ringPass++; } }
    for (let i = M.rings.length - 1; i >= 0; i--) if (M.rings[i].r > 30) M.rings.splice(i, 1); }

  /* ---- Piston Row: numbered lanes, the pistons dropping onto them one after another (or in two waves) ---- */
  function laneTest(C, k, x, y, rr) { if (!onFloor(C, x, y)) return false; const dy = y - C.y, ly = LANES[k], e = LW / 2 + (rr || 0) * 0.4; return k === 0 ? dy < ly + e : k === LANES.length - 1 ? dy > ly - e : Math.abs(dy - ly) < e; }
  function laneHalf(ly) { const yy = Math.max(0, Math.abs(ly) - LW / 2); return RX * Math.sqrt(Math.max(0, 1 - (yy / RY) ** 2)); }
  function startPistons(FX, m) { const M = FX.mem, C = FX.C, P = FX.S.lv, f = FX.S.fast * (P >= 3 ? 1.2 : 1); m.act = 'pistons'; m.actT = 0;
    const kind = P === 1 ? 'roll' : (M.pistK++ % 2 ? 'alt' : 'roll'), T0 = 1.8 / f, gap = (P >= 3 ? 0.5 : P >= 2 ? 0.56 : 0.62) / f, W2 = 1.6 / f, rev = P >= 3 && Math.random() < 0.5;
    LANES.forEach((ly, k) => { const kk = rev ? LANES.length - 1 - k : k, delay = kind === 'roll' ? T0 + kk * gap : T0 + (k % 2) * W2, lab = kind === 'roll' ? String(kk + 1) : String(k % 2 + 1);
      FX.tele({ shape: 'fn', test: (x, y, rr) => laneTest(C, k, x, y, rr), x: C.x, y: C.y + ly, t: delay, dmg: m.dmg * 1.5, col: AMBER, lane: { k, ly, lab }, fn: s => slamLane(FX, m, s) }); });
    M.pistEnd = (kind === 'roll' ? T0 + (LANES.length - 1) * gap : T0 + W2) + 1.0;
    say(FX, 'pistons', 'PISTON ROW', kind === 'roll' ? 'Pistons drop lane by lane: step into a lane once it has struck' : 'Two waves of pistons: move into a struck lane before the second', AMBER); }
  function slamLane(FX, m, s) { const M = FX.mem, C = FX.C, me = FX.me, L = s.lane, hw = laneHalf(L.ly), hit = laneTest(C, L.k, me.x, me.y, me.r); M.stat.lanes++; M.stat[hit ? 'laneHit' : 'laneSafe']++;
    M.slams.push({ k: L.k, ly: L.ly, t: 0 }); FX.H.shake(7, 0.2); FX.H.sfx.crash();
    for (let i = 0; i < 3; i++) { const x = C.x + (i - 1) * hw * 0.62 + FX.rnd(-1, 1); FX.H.boom(x, C.y + L.ly, 1.3, AMBER, '#FFFFFF', { n: 8, shake: 0, smoke: 3 }); } }

  /* ---- Cable Lash: a cable rears over a shown arc and sweeps across it; Clamp: it rises over a shown circle and bites ---- */
  function startLash(FX, m, k, second) { const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv; if (!second) { m.act = 'lash'; m.actT = 0; M.q.length = 0; M.qt = 0; }
    if (k == null) k = me.x < C.x ? 0 : 1; const cb = M.cab[k]; if (cb.mode === 'hold') releaseCab(cb);
    const O = lashO(C, k), a = Math.atan2(me.y - O[1], me.x - O[0]), len = 17, spread = P >= 3 ? 0.5 : 0.44, Wt = 1.35 / FX.S.fast, dir = Math.random() < 0.5 ? 1 : -1;
    Object.assign(cb, { mode: 'rear', t: 0, a, O, len, spread, dir }); M.stat.lashes++; FX.H.sfx.whoosh();
    FX.tele({ shape: 'cone', x: O[0], y: O[1], a, len, spread, t: Wt, dmg: m.dmg * 1.5, col: VIOLET_HI, fn: () => { if (FX.inShape({ shape: 'cone', x: O[0], y: O[1], a, len, spread }, me.x, me.y, me.r)) M.stat.lashHit++; cb.mode = 'sweep'; cb.t = 0; FX.H.shake(10, 0.3); FX.H.sfx.crash(); } });
    say(FX, 'lash', 'CABLE LASH', 'A cable rears over the shown arc: get out of it', VIOLET_HI);
    M.lashEnd = (second ? m.actT : 0) + Wt + 2.2; if (P >= 3 && !second) { at(M, Wt + 0.7, () => { if (m.act === 'lash') startLash(FX, m, 1 - k, true); }); } }
  function startClamp(FX, m) { const M = FX.mem, P = FX.S.lv, n = P >= 3 ? 3 : P >= 2 ? 2 : 1, step = 1.5 / FX.S.fast; m.act = 'clamp'; m.actT = 0; M.q.length = 0; M.qt = 0;
    for (let i = 0; i < n; i++) at(M, i * step, () => { if (m.act === 'clamp') clampOne(FX, m, i); });
    M.clampEnd = (n - 1) * step + 1.3 / FX.S.fast + 2.9; say(FX, 'clamp', 'CLAMP', 'A cable rises over you: leave the circle, then strike the clamp', VIOLET_HI); }
  function clampOne(FX, m, i) { const M = FX.mem, me = FX.me, C = FX.C;
    const k = [0, 1, 2].filter(j => M.cab[j].mode === 'rest' || M.cab[j].mode === 'spent').sort((a, b) => Math.hypot(me.x - C.x - ROOTS[a][0], me.y - C.y - ROOTS[a][1]) - Math.hypot(me.x - C.x - ROOTS[b][0], me.y - C.y - ROOTS[b][1]))[0]; if (k == null) return;
    let x = me.x + (me.vx || 0) * 0.3, y = me.y + (me.vy || 0) * 0.3; if (!inPlat(C, x, y, 1.6)) { const dx = x - C.x, dy = y - C.y, e = Math.hypot(dx / (RX - 1.6), dy / (RY - 1.6)) || 1; x = C.x + dx / e * 0.98; y = C.y + dy / e * 0.98; }
    const cb = M.cab[k], Wt = 1.3 / FX.S.fast; releaseCab(cb); Object.assign(cb, { mode: 'crear', t: 0, cx: x, cy: y }); FX.H.sfx.whoosh();
    FX.tele({ shape: 'circle', x, y, r: 2.0, t: Wt, dmg: m.dmg * 1.4, col: VIOLET_HI, fn: s => { M.stat.clamps++; if (Math.hypot(me.x - x, me.y - y) < 2.0 + me.r) M.stat.clampHit++; cb.mode = 'hold'; cb.t = 0; cb.hold = 2.6; FX.H.boom(x, y, 1.6, VIOLET_HI, '#FFFFFF', { n: 16, shake: 9, smoke: 4 }); FX.H.sfx.crash();
      cb.px = FX.obj({ kind: 'part', x, y, r: 1.3, hp: 1e12, forward: 1.5, front: true }); if (i === 0) FX.H.text(x, y - 2.2, 'The clamp holds: strike it!', VIOLET_HI, 13); } }); }
  function releaseCab(cb) { if (cb.px) { cb.px.dead = true; cb.px = null; } }
  /* the cables: where each one's tip goes for what it is doing, and its points laid out from its root */
  function cables(FX, m, dt) { const M = FX.mem, C = FX.C, bt = M.bt, sag = M.P.sag, dead = m.dead;
    for (const cb of M.cab) { const k = cb.k; cb.t += dt; let tgt = null, rate = 3, lift = 0, jaw = 0.3;
      if (cb.mode === 'rest' || dead) { const sw = dead ? 0 : 1; tgt = [C.x + REST[k][0] + Math.sin(bt * 0.6 + k * 2.1) * 0.7 * sw, C.y + REST[k][1] + Math.cos(bt * 0.45 + k) * 0.5 * sw, 0.35]; jaw = dead ? 0.1 : 0.3 + 0.25 * Math.sin(bt * 1.3 + k); rate = 1.6; }
      else if (cb.mode === 'rear') { tgt = [cb.O[0] + Math.cos(cb.a) * 4.2, cb.O[1] + Math.sin(cb.a) * 4.2, 6.6 + Math.sin(bt * 5) * 0.3]; lift = 1; jaw = 1; rate = 4; }
      else if (cb.mode === 'sweep') { const u = clamp(cb.t / 0.3, 0, 1), an = cb.a + cb.spread * cb.dir * (2 * smooth(u) - 1), R = cb.len * 0.8; cb.tip = [cb.O[0] + Math.cos(an) * R, cb.O[1] + Math.sin(an) * R, 0.6]; lift = 0.35; jaw = 0.8; if (u >= 1) { cb.mode = 'spent'; cb.t = 0; cb.px = FX.obj({ kind: 'part', x: cb.tip[0], y: cb.tip[1], r: 1.2, hp: 1e12, forward: 1.5, front: true }); FX.H.text(cb.tip[0], cb.tip[1] - 1.8, 'Strike the spent cable!', VIOLET_HI, 12); } }
      else if (cb.mode === 'spent') { tgt = cb.tip.slice(); tgt[2] = 0.35; jaw = 0.1; rate = 6; if (cb.t > 1.8) { releaseCab(cb); cb.mode = 'rest'; cb.t = 0; } }
      else if (cb.mode === 'crear') { tgt = [cb.cx, cb.cy, 6.8 + Math.sin(bt * 6) * 0.25]; lift = 1; jaw = 1; rate = 5; }
      else if (cb.mode === 'hold') { cb.tip = [cb.cx, cb.cy, 0.45]; jaw = 0; lift = 0.2; if (cb.t > cb.hold) { releaseCab(cb); cb.mode = 'rest'; cb.t = 0; } }
      if (tgt) for (let i = 0; i < 3; i++) cb.tip[i] = toward(cb.tip[i], tgt[i], dt, rate);
      cb.lift = toward(cb.lift, lift, dt, 5); cb.jaw = toward(cb.jaw, jaw, dt, 9);
      // a twitch on every beat and a flinch when struck
      const tw = (M.lub * 0.35 + M.recoil * 0.5) * (dead ? 0 : 1);
      const R0 = [C.x + ROOTS[k][0], C.y + ROOTS[k][1] + sag * 0.7, ROOTS[k][2] - sag * 1.4], T3 = [cb.tip[0], cb.tip[1], cb.tip[2] + tw], dx = T3[0] - R0[0], dy = T3[1] - R0[1], dl = Math.hypot(dx, dy) || 1, ux = dx / dl, uy = dy / dl;
      const P1 = [R0[0], R0[1] + 3.4, R0[2] + 0.4 + cb.lift * 2], P2 = [T3[0] - ux * 3.6, T3[1] - uy * 3.6, T3[2] + cb.lift * 3.2], n = 18, pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c2 = 3 * (1 - u) * u * u, d = u ** 3; const wob = Math.sin(bt * 1.7 - u * 6 + k * 2) * 0.18 * u * (1 - u) * 4 * (dead ? 0 : 1);
        pts.push([a * R0[0] + b * P1[0] + c2 * P2[0] + d * T3[0] - uy * wob, a * R0[1] + b * P1[1] + c2 * P2[1] + d * T3[1] + ux * wob, Math.max(0.3, a * R0[2] + b * P1[2] + c2 * P2[2] + d * T3[2])]); }
      cb.pts = pts; if (cb.px && !cb.px.dead) { cb.px.x = cb.tip[0]; cb.px.y = cb.tip[1] - cb.tip[2]; } } }

  /* ---- Coolant Flood: teal coolant rises from the drains at the rim over the whole floor; the grates stand above it ---- */
  function startFlood(FX, m) { const M = FX.mem, P = FX.S.lv, f = FX.S.fast * (P >= 3 ? 1.15 : 1); m.act = 'flood'; m.actT = 0; M.fl = { st: 'rise', t: 0, RISE: 4.4 / f, FULL: 5.4, DRAIN: 1.5, lv: 0, tk: 0.4 }; M.stat.floods++; FX.H.sfx.splash && FX.H.sfx.splash();
    say(FX, 'flood', 'COOLANT FLOOD', 'Coolant rises over the floor: climb onto a raised grate', TEAL_HI); }
  function inFlood(FX, x, y) { const M = FX.mem, C = FX.C, F = M.fl; if (!F || F.lv <= 0.02 || !onFloor(C, x, y) || onGrate(C, x, y)) return false; const e = Math.hypot((x - C.x) / RX, (y - C.y) / RY); return e > 1 - F.lv * 1.03; }
  function flood(FX, m, dt) { const M = FX.mem, F = M.fl, me = FX.me, C = FX.C; if (!F) return; F.t += dt;
    if (F.st === 'rise') { F.lv = smooth(F.t / F.RISE); if (F.t >= F.RISE) { F.st = 'full'; F.t = 0; F.lv = 1; FX.H.shake(6, 0.4); FX.H.text(me.x, me.y - 1.8, onGrate(C, me.x, me.y) ? 'High and dry' : 'The coolant burns!', onGrate(C, me.x, me.y) ? TEAL_HI : '#FF8A8A', 13); } }
    else if (F.st === 'full') { F.lv = 1; if (F.t >= F.FULL) { F.st = 'drain'; F.t = 0; } }
    else if (F.st === 'drain') { F.lv = 1 - smooth(F.t / F.DRAIN); if (F.t >= F.DRAIN) { M.fl = null; return; } }
    if (me.dead) return; const wet = inFlood(FX, me.x, me.y);
    if (wet) { me.chill = Math.max(me.chill || 0, 0.25); M.stat.floodWet += dt; if (Math.random() < dt * 10) FX.H.part({ kind: 'bubble', x: me.x + FX.rnd(-0.4, 0.4), y: me.y, vx: 0, vy: -1, life: 0.5, max: 0.5, size: 3, color: TEAL_HI }); }
    else if (F.st === 'full' && onGrate(C, me.x, me.y)) M.stat.floodDry += dt;
    F.tk -= dt; if (F.tk <= 0) { F.tk = 0.4; if (wet) { M.stat.floodHits++; FX.hurt(m.dmg * (F.st === 'full' ? 0.42 : 0.25), { dot: true }); } } }

  /* ---- Overload: it charges some of its capacitors; break them all in time and its lens is bared ---- */
  function startOverload(FX, m) { const M = FX.mem, C = FX.C, me = FX.me, P = FX.S.lv, n = P >= 3 ? 4 : P >= 2 ? 3 : 2; m.act = 'overload'; m.actT = 0; M.stat.overloads++;
    // (the nearest one first left out, so that it is a run)
    const order = [0, 1, 2, 3].sort((a, b) => Math.hypot(me.x - C.x - CAPS[b][0], me.y - C.y - CAPS[b][1]) - Math.hypot(me.x - C.x - CAPS[a][0], me.y - C.y - CAPS[a][1])), pick = n === 4 ? order : n === 3 ? order.slice(0, 3) : [order[0], order[1]].sort(() => Math.random() - 0.5);
    pick.forEach(i => { const cp = M.caps[i]; cp.st = 'charged'; cp.t = 0; cp.o = FX.obj({ kind: 'cap', i, x: C.x + CAPS[i][0], y: C.y + CAPS[i][1] + 0.05, r: 1.0, hp: FX.S.barHP * 0.022, onKill: o => capBroken(FX, o) }); FX.H.ring(C.x + CAPS[i][0], C.y + CAPS[i][1], 0.3, 2.2, 0.4, VIOLET_HI, 0.35); });
    M.ov = { t: 0, W: (8.8 + n * 1.3) / FX.S.fast, n, left: n }; FX.H.sfx.hum();
    say(FX, 'overload', 'OVERLOAD', `It charges ${n} capacitors: break every charged one before it overloads`, VIOLET_HI); }
  function capBroken(FX, o) { const M = FX.mem, m = FX.m, C = FX.C; if (!m || m.dead) return; const cp = M.caps[o.i]; cp.st = 'broken'; cp.o = null; FX.H.boom(o.x, o.y - 1.2, 1.8, VIOLET_HI, '#FFFFFF', { n: 20, shake: 7, smoke: 4 }); FX.H.sfx.crack();
    if (!M.ov) return; M.ov.left--; if (M.ov.left > 0) { FX.H.text(o.x, o.y - 3, `${M.ov.left} more`, VIOLET_HI, 14); return; }
    bare(FX, m, 'overload'); void C; }
  function bare(FX, m, why) { const M = FX.mem; M.ov = null; m.act = 'beat'; m.actT = 0; M.q.length = 0; m.stunT = why === 'stall' ? 7.5 : 6.2; M.stall = why === 'stall'; M.stat.bared++; FX.untarget(false); M.recoil = 0;
    for (const cb of M.cab) { releaseCab(cb); cb.mode = 'rest'; }
    FX.H.shake(14, 0.6); FX.H.flash(0.3, why === 'stall' ? '#FF8A4A' : AMBER); FX.H.sfx.crash();
    if (why === 'stall') FX.H.banner('IT OVERHEATS AND STALLS', 'Red hot and spent, it sags onto its gantry: strike the bared lens!', '#FF9A5A', 2.6, true, true);
    else FX.H.banner('THE LENS IS BARED', 'The heart sags onto its gantry: strike its lens!', AMBER, 2.4, true, true); }
  function discharge(FX, m) { const M = FX.mem, C = FX.C, me = FX.me; M.ov = null; M.stat.discharges++; let j = 0;
    M.caps.forEach((cp, i) => { if (cp.st !== 'charged') { cp.st = 'idle'; return; } if (cp.o && !cp.o.dead) cp.o.dead = true; cp.o = null; cp.st = 'idle'; const x0 = C.x + CAPS[i][0], y0 = C.y + CAPS[i][1], d = j++;
      FX.H.zap && FX.H.zap(x0, y0 - 2.6, me.x, me.y, VIOLET_HI, 4);
      FX.tele({ shape: 'circle', x: me.x + (me.vx || 0) * 0.2, y: me.y + (me.vy || 0) * 0.2, r: 2.4, t: (0.95 + d * 0.4) / FX.S.fast, dmg: m.dmg * 1.5, col: VIOLET_HI, fn: s => { FX.H.boom(s.x, s.y, 2, VIOLET_HI, '#FFFFFF', { n: 18, shake: 8 }); FX.H.sfx.crack(); FX.H.zap && FX.H.zap(x0, y0 - 2.6, s.x, s.y, '#FFFFFF', 5); } }); });
    FX.H.text(me.x, me.y - 2, 'OVERLOAD! The charge leaps at you', VIOLET_HI, 14); FX.H.flash(0.2, VIOLET); M.ovEnd = m.actT + 2.4; }

  /* ---- The Repair Swarm: its vents open and three hundred mites pour out, flung over the floor; each crawls back to
     a repair port and mends it. It cannot be struck meanwhile. When the last is gone it overheats and stalls ---- */
  function startSwarm(FX, m) { const M = FX.mem; resetAll(FX, m); m.act = 'swarm'; m.actT = 0; FX.untarget(true); M.recoil = 1; FX.H.shake(12, 0.8); FX.H.flash(0.3, AMBER); FX.H.sfx.hum();
    M.sw = { left: SWARM, killed: 0, repaired: 0, list: [], acc: 0, n: 0, done: false };
    FX.H.banner('THE REPAIR SWARM', 'Its vents open: kill the mites before they crawl back into it and mend it', AMBER, 3, true, true); }
  function nearestPort(C, x, y) { let best = PORTS[0], bd = 1e9; for (const p of PORTS) { const d = Math.hypot(x - C.x - p[0], y - C.y - p[1]); if (d < bd) { bd = d; best = p; } } return { x: C.x + best[0], y: C.y + best[1] }; }
  function pourDrone(FX, m) { const M = FX.mem, S2 = M.sw, C = FX.C, me = FX.me, P = FX.S.lv; let x = C.x, y = C.y;
    for (let k = 0; k < 10; k++) { x = C.x + FX.rnd(-RX * 0.82, RX * 0.82); y = C.y + FX.rnd(-5, RY - 1.2); if (inPlat(C, x, y, 1.2) && !onGrate(C, x, y, 0.3) && Math.hypot(x - me.x, y - me.y) > 3.2) break; }
    const vi = x < C.x ? 0 : 1, V = VENTS[vi], q = FX.minion('repairmite', x, y); if (!q) return;
    q.swarm = true; q.hp = q.maxhp = Math.max(30, Math.round(q.maxhp * 0.32)); q.xp = Math.max(1, Math.round((q.xp || 3) * 0.3)); q.atkCd = 1e9; q.cd = 99; q.spd = (P >= 3 ? 1.75 : 1.45) * (0.88 + Math.random() * 0.24);
    const z0 = HZ + V[1] - M.P.sag * 3.8; q.launch = { t: 0, dur: 0.7 + Math.random() * 0.35, x0: C.x + V[0], y0: C.y + HY + 0.4, z0, x1: q.x, y1: q.y, h: 2.5 + Math.random() * 2.5 }; q.x = q.launch.x0; q.y = q.launch.y0; q.z = z0; q.under = true;
    q.home = nearestPort(C, q.launch.x1, q.launch.y1); q.onHome = qq => repairArrive(FX, qq);
    S2.list.push(q); S2.left--; S2.n++; M.stat.poured++; }
  function repairArrive(FX, q) { const M = FX.mem, m = FX.m; if (q.dead) return; q.dead = true; q.repaired = true; if (!m || m.dead) return;
    const h = Math.round(m.maxhp * HEAL_K); m.hp = Math.min(m.maxhp, m.hp + h); M.stat.repairs++; M.stat.healed += h; M.repairT = 1.4;
    FX.H.text(q.x + FX.rnd(-0.6, 0.6), q.y - 3.2, '+' + h, HEAL, 15); FX.H.sparks(q.x, q.y - 0.4, HEAL, 8, 4); FX.H.ring(q.x, q.y, 0.2, 1.4, 0.3, HEAL, 0.3);
    if (!M.seen.repair) { M.seen.repair = true; FX.H.banner('REPAIRING', 'A mite reached its port and mends the heart: stop them!', HEAL, 2.0, true); } }
  function swarmTick(FX, m, dt) { const M = FX.mem, S2 = M.sw; if (!S2) return; m.noTouch = true; m.under = true;
    S2.list = S2.list.filter(q => { if (q.dead) { if (q.repaired) S2.repaired++; else S2.killed++; return false; } return true; });
    S2.acc = Math.min(4, S2.acc + dt * (S2.n < 40 ? 16 : 9));
    while (S2.acc >= 1 && S2.left > 0 && S2.list.length < SWARM_CAP) { S2.acc -= 1; pourDrone(FX, m); }
    if (S2.left === 0 && S2.list.length === 0 && !S2.done) { S2.done = true; M.sw = null; M.swDone = true; FX.untarget(false); FX.H.sfx.fanfare && FX.H.sfx.fanfare(); bare(FX, m, 'stall'); } }

  /* ---------- the painting: the wall, the pistons, the vessels, the heart, its lens, the hoses and the cables ---------- */
  function tint(col, P) { let x = col; if (P.heat > 0.01) x = K.mixC(x, '#E0583A', P.heat * 0.42); if (P.dk > 0.01) x = K.mixC(x, '#2E2834', P.dk * 0.62); if (P.wake < 0.99) x = K.mixC(x, '#2A2030', (1 - P.wake) * 0.45); return x; }
  function easePose(FX, m, dt) { const M = FX.mem, P = M.P, e = FX.S.enterT || 0;
    const tg = { sag: m.dead || m.stunT > 0 ? 1 : 0, heat: m.stunT > 0 && M.stall ? 1 : 0, open: M.sw ? 1 : 0, dk: m.dead ? 1 : 0, wake: m.dead ? 0.2 : m.act === 'enter' ? clamp((e - 0.5) / 1.4, 0, 1) : 1 };
    P.sag = toward(P.sag, tg.sag, dt, m.dead ? 0.9 : 2.4); P.heat = toward(P.heat, tg.heat, dt, 1.6); P.open = toward(P.open, tg.open, dt, 3); P.dk = toward(P.dk, tg.dk, dt, 0.7); P.wake = toward(P.wake, tg.wake, dt, 2.2); P.rec = M.recoil; }
  function vesselAt(V, u) { const p = V.pts, k = u * (p.length - 1), i = Math.min(p.length - 2, Math.floor(k)), e = k - i; return [lerp(p[i][0], p[i + 1][0], e), HZ + lerp(p[i][1], p[i + 1][1], e)]; }
  function beatEnv(M) { return Math.min(1, (M.lub || 0) * 0.75 + (M.dub || 0) * 0.45); }
  function paintAll(c, FX, m, P3, T, bt, C, M) {
    const P = M.P, be = beatEnv(M) * (1 - P.dk), sag = P.sag, rec = P.rec, lw = Math.max(1.2, T * 0.08);
    const W3 = (x, y, z) => P3(C.x + x, C.y + y, z);
    // the heart's own frame: its centre on screen, swelling on the beat, squashed when it sags or flinches
    const Hc = W3(0, HY + sag * 0.8, HZ - sag * 3.8 + rec * 0.4), sx = (1 + be * 0.05 + rec * 0.03) * (1 + sag * 0.09), sz = (1 + be * 0.045 - rec * 0.04) * (1 - sag * 0.2);
    const Q = (x, z) => [Hc[0] + x * T * sx, Hc[1] - (z - HZ) * T * sz], QH = (x, z) => Q(x, z + HZ);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    paintWall(c, W3, T, bt, P, lw, be);
    PIST.forEach((p, i) => paintPiston(c, W3, QH, T, bt, M, P, p, i, lw, be));
    VESSELS.slice(1).forEach(V => paintVessel(c, QH, T, sx, V, P, lw, bt));
    paintVessel(c, QH, T, sx, VESSELS[0], P, lw, bt);
    // the atria behind its shoulders, swelling a beat ahead
    for (const [ax, az, rx, rz, ph] of [[-4.9, 6.6, 4.1, 3.3, 0.4], [5.1, 6.0, 3.6, 2.9, 0.9]]) { const k = 1 + (M.dub || 0) * 0.06 * (1 - P.dk), q = QH(ax, az); TN.shape(c, TN.ell(q[0], q[1], rx * T * sx * k, rz * T * sz * k, ax < 0 ? -0.25 : 0.3), { col: tint(ATR_B.col, P), shade: tint(ATR_B.shade, P), hi: tint(ATR_B.hi, P), line: INK2, lw, r: rx * T, d1: 0.1, d2: 0.2, force: true, inner: c2 => { c2.strokeStyle = 'rgba(40,10,40,.45)'; c2.lineWidth = lw * 0.8; for (let i = 0; i < 3; i++) { c2.beginPath(); c2.arc(q[0] + (i - 1) * rx * T * 0.3, q[1] + rz * T * 0.2, rx * T * (0.55 + i * 0.12), Math.PI * 1.15, Math.PI * 1.75); c2.stroke(); } } }); void ph; }
    paintBody(c, FX, QH, T, sx, sz, bt, M, P, lw, be);
    paintLens(c, QH, T, sx, sz, bt, M, P, lw, be);
    paintHoses(c, W3, QH, T, P, lw, bt, M);
    for (const cb of M.cab) if (cb.lift < 0.15 || m.dead) paintCable(c, P3, T, cb, M, P, lw, bt);
    c.restore(); }
  // the chamber's north wall: torn hull plates on great ribs, violet current in the seams
  function paintWall(c, W3, T, bt, P, lw, be) { const Y = -20.6, n = JAG.length - 1, X0 = -28, X1 = 28, top = i => { const x = lerp(X0, X1, i / n); return [x, 13.5 + 5 * Math.cos(x / 28 * Math.PI / 2) + JAG[i]]; };
    const g0 = W3(0, Y, 19), g1 = W3(0, Y, -1), g = c.createLinearGradient(0, g0[1], 0, g1[1]); g.addColorStop(0, tint('#1A1222', P)); g.addColorStop(0.5, tint('#251B30', P)); g.addColorStop(1, tint('#140C18', P));
    c.beginPath(); for (let i = 0; i <= n; i++) { const [x, z] = top(i), q = W3(x, Y, z); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } const b1 = W3(X1, Y, -2), b0 = W3(X0, Y, -2); c.lineTo(b1[0], b1[1]); c.lineTo(b0[0], b0[1]); c.closePath(); c.fillStyle = g; c.fill(); c.strokeStyle = INK2; c.lineWidth = lw; c.stroke();
    c.save(); c.clip();
    // plates: seams across, current glowing in a few
    for (let z = 2.5; z < 18; z += 3.6) { const a = W3(X0, Y, z), b = W3(X1, Y, z); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = lw * 1.2; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = `rgba(196,82,255,${(0.12 + be * 0.2) * (1 - P.dk)})`; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(a[0], a[1] + lw); c.lineTo(b[0], b[1] + lw); c.stroke(); }
    // the ribs
    for (let x = -26; x <= 26; x += 4.6) { const a = W3(x, Y, -1), b = W3(x, Y, 19); TN.tubeLite(c, [a, W3(x, Y, 9), b], () => T * 1.1, { col: tint('#3A3248', P), shade: tint('#251D30', P), hi: tint('#5E5470', P), line: INK2, lw, r: T * 0.9, force: true });
      for (let z = 1; z < 18; z += 1.8) { const q = W3(x, Y, z); c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(q[0] + T * 0.3, q[1], Math.max(1, T * 0.09), 0, TAU); c.fill(); } }
    c.restore(); }
  // a piston beside the heart: a housing with flesh sleeves, a steel rod rising and falling with the beat, a crosshead and a tendon to the heart
  function paintPiston(c, W3, QH, T, bt, M, P, p, i, lw, be) { const Y = -18.2, ph = M.lastBeat != null ? clamp((M.bt - M.lastBeat) / 1.4, 0, 1) : 0, inner = Math.abs(p.x) < 13, up = p.ph ? 1 - Math.exp(-ph * 5) : Math.exp(-ph * 3.2), h = (1.2 + 2.6 * up) * (1 - P.dk * 0.7) * (0.4 + 0.6 * P.wake), w = p.w, H0 = inner ? 6.4 : 5.4;
    const f0 = W3(p.x, Y, 0), f1 = W3(p.x, Y, H0), cx = f0[0], hw = w * T / 2;
    TN.shape(c, TN.poly([[cx - hw, f0[1]], [cx + hw, f0[1]], [cx + hw, f1[1]], [cx - hw, f1[1]]]), { col: tint(STEEL, P), shade: tint('#3A3F50', P), hi: tint(STEEL_HI, P), line: INK2, lw, r: hw * 1.4, d1: 0.12, d2: 0.22, force: true });
    for (let k = 0; k < 3; k++) { const q = W3(p.x, Y, 0.9 + k * 1.05); TN.shape(c, TN.ell(q[0], q[1], hw * 1.22, T * 0.42, 0), { col: tint(k % 2 ? '#8A4478' : FLESH, P), shade: tint('#52204A', P), hi: tint('#B05C9C', P), line: INK2, lw: lw * 0.8, r: hw, force: true }); }
    // the rod and the crosshead
    const r0 = W3(p.x, Y, H0), r1 = W3(p.x, Y, H0 + h); c.fillStyle = tint('#C8D0E0', P); c.fillRect(cx - hw * 0.28, r1[1], hw * 0.56, r0[1] - r1[1]); c.strokeStyle = INK2; c.lineWidth = lw; c.strokeRect(cx - hw * 0.28, r1[1], hw * 0.56, r0[1] - r1[1]); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(cx - hw * 0.18, r1[1], hw * 0.1, r0[1] - r1[1]);
    const ch = W3(p.x, Y, H0 + h + 0.55); TN.shape(c, TN.poly([[cx - hw * 0.75, ch[1] - T * 0.55], [cx + hw * 0.75, ch[1] - T * 0.55], [cx + hw * 0.75, ch[1] + T * 0.5], [cx - hw * 0.75, ch[1] + T * 0.5]]), { col: tint('#4A5268', P), shade: tint(STEEL_DK, P), hi: tint('#8A92A8', P), line: INK2, lw, r: hw, force: true });
    // the amber joint on the housing
    const j = W3(p.x, Y, H0 - 0.6); K.glow(c, j[0], j[1], T * (0.9 + be * 0.6), AMBER, (0.5 + be * 0.4) * (1 - P.dk) * P.wake); c.fillStyle = tint(AMBER, P); c.beginPath(); c.arc(j[0], j[1], T * 0.22, 0, TAU); c.fill(); c.strokeStyle = INK2; c.lineWidth = lw * 0.8; c.stroke();
    // the tendon from the crosshead to the heart's flank
    const sd = Math.sign(p.x), hq = QH(sd * (inner ? 8.2 : 8.8), inner ? 2.2 : 4.8), mid = [(ch[0] + hq[0]) / 2, Math.max(ch[1], hq[1]) + T * 1.2];
    TN.tubeLite(c, [[ch[0] - sd * hw * 0.6, ch[1]], mid, hq], u => T * (0.62 - u * 0.2), { col: tint('#7A3A6E', P), shade: tint('#52204A', P), hi: tint('#B05C9C', P), line: INK2, lw: lw * 0.9, r: T * 0.5, force: true }); void i; }
  // a great vessel: flesh where it leaves the heart, a steel pipe beyond, a collar at the join, a valve venting steam
  function paintVessel(c, QH, T, sx, V, P, lw, bt) { const pts = V.pts.map(([x, z]) => QH(x, z)), w = V.w * T * sx;
    TN.tubeLite(c, pts, u => w * (1 - u * 0.12), { col: tint('#4A5268', P), shade: tint('#2E3444', P), hi: tint('#9AA4BC', P), line: INK2, lw, r: w * 0.7, force: true });
    const fl = [pts[0], [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2], pts[1]]; TN.tubeLite(c, fl, u => w * (1.12 - u * 0.1), { col: tint('#8E427C', P), shade: tint('#62285A', P), hi: tint('#C770B0', P), line: INK2, lw, r: w * 0.7, force: true });
    // collars: riveted rings along the pipe
    for (const u of [0.26, V.valve, 0.78]) { const k = u * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(k)), e = k - i, a = pts[i], b = pts[i + 1], x = lerp(a[0], b[0], e), y = lerp(a[1], b[1], e), an = Math.atan2(b[1] - a[1], b[0] - a[0]);
      c.save(); c.translate(x, y); c.rotate(an); TN.shape(c, TN.poly([[-T * 0.35, -w * 0.62], [T * 0.35, -w * 0.62], [T * 0.35, w * 0.62], [-T * 0.35, w * 0.62]]), { col: tint('#6A7288', P), shade: tint('#3A3F50', P), hi: tint('#C8D0E0', P), line: INK2, lw: lw * 0.9, r: T * 0.5, force: true });
      c.fillStyle = 'rgba(0,0,0,.55)'; for (let r = -2; r <= 2; r++) { c.beginPath(); c.arc(0, r * w * 0.22, Math.max(1, T * 0.07), 0, TAU); c.fill(); }
      if (u === V.valve) { // a valve wheel and a vent stack on it
        c.strokeStyle = INK2; c.lineWidth = lw * 2.4; c.beginPath(); c.arc(0, -w * 0.95, T * 0.55, 0, TAU); c.stroke(); c.strokeStyle = tint('#C94A4A', P); c.lineWidth = lw * 1.2; c.stroke(); for (let s = 0; s < 4; s++) { const aa = s / 4 * TAU + bt * 0.2; c.beginPath(); c.moveTo(0, -w * 0.95); c.lineTo(Math.cos(aa) * T * 0.5, -w * 0.95 + Math.sin(aa) * T * 0.5); c.stroke(); } }
      c.restore(); } }
  // the heart itself: a lobed organ of violet flesh, steel bands round it, veins that swell on the beat, fungus, vents
  function heartOutline(bt, P) { const pts = [], n = 34; for (let i = 0; i < n; i++) { const th = i / n * TAU, s = Math.sin(th), co = Math.cos(th); let x = co * HW * (1 + 0.05 * Math.sin(th * 3 + 0.4)), z = s * HH;
      if (s < 0) { z *= 1 + 0.14 * Math.pow(-s, 3); x -= 1.3 * Math.pow(-s, 4); }
      z -= 1.3 * Math.exp(-(((th - Math.PI / 2) / 0.26) ** 2)); const wob = 0.16 * Math.sin(th * 5 + bt * 1.3) * (1 - P.dk); x += co * wob; z += s * wob;
      if (s < 0) z *= 1 - P.sag * 0.12; pts.push([x, z]); } return pts; }
  function paintBody(c, FX, QH, T, sx, sz, bt, M, P, lw, be) { const out = heartOutline(bt, P), sp = out.map(([x, z]) => QH(x, z)), path = TN.blob(sp), Rr = HW * T * sx;
    const glowCol = P.heat > 0.3 ? '#FF7A3A' : VIOLET;
    TN.shape(c, path, { col: tint(FLESH_B.col, P), shade: tint(FLESH_B.shade, P), shade2: tint(FLESH_B.shade2, P), hi: tint(FLESH_B.hi, P), line: INK2, lw: lw * 1.3, r: Rr, d1: 0.06, d2: 0.1, force: true, glowCol, glowA: (0.22 + be * 0.35 + P.heat * 0.4) * (1 - P.dk) * P.wake,
      inner: c2 => {
        // veins swelling on the beat
        c2.lineCap = 'round'; for (const V of VEINS) { const q = V.map(([x, z]) => QH(x, z)); c2.beginPath(); q.forEach((p, i) => i ? c2.lineTo(p[0], p[1]) : c2.moveTo(p[0], p[1])); c2.strokeStyle = tint('#4A1844', P); c2.lineWidth = T * (0.22 + be * 0.1); c2.stroke(); c2.strokeStyle = `rgba(232,138,192,${0.25 + be * 0.25})`; c2.lineWidth = T * 0.07; c2.stroke(); }
        // glowing violet seams in the flesh
        c2.save(); c2.globalCompositeOperation = 'lighter'; c2.globalAlpha = (0.3 + be * 0.5) * (1 - P.dk) * P.wake; c2.strokeStyle = P.heat > 0.3 ? '#FF9A5A' : VIOLET_HI; c2.lineWidth = T * 0.1; for (const [x0, z0, x1, z1] of [[-7.5, 4.5, -4.8, -1.2], [6.8, 5.0, 5.5, 0.2], [-3.4, -5.6, 2.6, -6.6]]) { const a = QH(x0, z0), b = QH(x1, z1); c2.beginPath(); c2.moveTo(a[0], a[1]); c2.quadraticCurveTo((a[0] + b[0]) / 2 + T, (a[1] + b[1]) / 2, b[0], b[1]); c2.stroke(); } c2.restore();
        // the steel bands round it: two around, one down each flank, riveted
        const band = (pts, w) => { const q = pts.map(([x, z]) => QH(x, z)); const st = () => { c2.beginPath(); q.forEach((p, i) => i ? c2.lineTo(p[0], p[1]) : c2.moveTo(p[0], p[1])); };
          c2.save(); c2.globalCompositeOperation = 'lighter'; st(); c2.strokeStyle = `rgba(196,82,255,${(0.25 + be * 0.4) * (1 - P.dk) * P.wake})`; c2.lineWidth = w * T * 1.7; c2.stroke(); c2.restore();
          st(); c2.strokeStyle = INK2; c2.lineWidth = w * T + lw * 2; c2.stroke(); st(); c2.strokeStyle = tint(STEEL, P); c2.lineWidth = w * T; c2.stroke();
          c2.save(); c2.translate(0, -w * T * 0.28); st(); c2.strokeStyle = tint(STEEL_HI, P); c2.lineWidth = w * T * 0.22; c2.stroke(); c2.restore(); c2.save(); c2.translate(0, w * T * 0.3); st(); c2.strokeStyle = tint('#3A3F50', P); c2.lineWidth = w * T * 0.2; c2.stroke(); c2.restore();
          for (let i = 1; i < q.length - 1; i += 2) { c2.fillStyle = '#2A2F3E'; c2.beginPath(); c2.arc(q[i][0], q[i][1], Math.max(1.2, T * 0.13), 0, TAU); c2.fill(); c2.fillStyle = 'rgba(255,255,255,.5)'; c2.beginPath(); c2.arc(q[i][0] - T * 0.04, q[i][1] - T * 0.04, Math.max(0.6, T * 0.05), 0, TAU); c2.fill(); } };
        const hb = []; for (let i = 0; i <= 16; i++) { const x = -10 + i * 1.25; hb.push([x, 2.9 - 1.5 * (x / 9.2) ** 2]); } band(hb, 1.0);
        const lb = []; for (let i = 0; i <= 16; i++) { const x = -10 + i * 1.25; lb.push([x, -5.2 - 1.0 * (x / 9.2) ** 2]); } band(lb, 0.85);
        for (const sd of [-1, 1]) { const vb = []; for (let i = 0; i <= 14; i++) { const z = 8.5 - i * 1.25; vb.push([sd * (5.5 + 1.7 * (1 - (z / 8.5) ** 2)), z]); } band(vb, 0.8); }
        // fungus in the folds
        for (const [x, z, s] of SHROOMS) { const q = QH(x, z); K.glow(c2, q[0], q[1], T * s * 1.6, FUNGUS, 0.35 * (1 - P.dk)); c2.fillStyle = tint(FUNGUS, P); c2.beginPath(); c2.ellipse(q[0], q[1], T * s * 0.6, T * s * 0.36, 0, Math.PI, TAU); c2.closePath(); c2.fill(); c2.strokeStyle = INK2; c2.lineWidth = lw * 0.7; c2.stroke(); c2.fillStyle = 'rgba(255,255,255,.5)'; c2.beginPath(); c2.arc(q[0] - T * s * 0.2, q[1] - T * s * 0.16, T * s * 0.08, 0, TAU); c2.fill(); }
        // the vents on its lower flanks: louvred hatches, glowing open when the swarm pours
        for (const [vx, vz] of VENTS) { const q = QH(vx, vz), w = T * 2.4, h = T * 1.5, op = P.open; c2.fillStyle = INK2; GFX.rr(c2, q[0] - w / 2, q[1] - h / 2, w, h, T * 0.3); c2.fill();
          if (op > 0.02) { K.glow(c2, q[0], q[1], T * 2.6 * op, AMBER, 0.8 * op); c2.fillStyle = `rgba(255,178,63,${0.75 * op})`; GFX.rr(c2, q[0] - w * 0.42, q[1] - h * 0.38, w * 0.84, h * 0.76, T * 0.2); c2.fill(); }
          c2.fillStyle = tint('#4A5268', P); for (let k = 0; k < 4; k++) { const yy = q[1] - h * 0.38 + k * h * 0.22, sh = 1 - op * 0.75; c2.fillRect(q[0] - w * 0.42, yy, w * 0.84, h * 0.13 * sh); } c2.strokeStyle = tint(STEEL_HI, P); c2.lineWidth = lw; GFX.rr(c2, q[0] - w / 2, q[1] - h / 2, w, h, T * 0.3); c2.stroke(); }
        // the heat: a red glow welling up from inside
        if (P.heat > 0.02) { c2.save(); c2.globalCompositeOperation = 'lighter'; const q = QH(0, -1); K.glow(c2, q[0], q[1], Rr * 1.3, '#FF5A2A', P.heat * (0.45 + 0.15 * Math.sin(bt * 9))); c2.restore(); }
      } });
    // a wet sheen on its upper lobe
    const s = QH(-4.6, 5.2); TN.spec(c, s[0], s[1], T * 0.9, -0.5, 0.45 * (1 - P.dk)); }
  // the lens-eye: a steel bezel bolted round a dome of amber glass, an iris of steel blades that contracts and darts
  function paintLens(c, QH, T, sx, sz, bt, M, P, lw, be) { const L = QH(0, -1.4), R = 2.9 * T * (sx + sz) / 2, lit = (1 - P.dk) * P.wake, look = M.look || [0, 0], ap = M.ap == null ? 0.6 : M.ap;
    K.glow(c, L[0], L[1], R * 2.6, P.heat > 0.3 ? '#FF7A3A' : AMBER, (0.3 + be * 0.35 + P.sag * 0.3) * lit);
    c.fillStyle = tint(STEEL_DK, P); c.beginPath(); c.arc(L[0], L[1], R * 1.14, 0, TAU); c.fill(); c.strokeStyle = INK2; c.lineWidth = lw * 1.3; c.stroke();
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, x = L[0] + Math.cos(a) * R * 1.05, y = L[1] + Math.sin(a) * R * 1.05; c.fillStyle = tint('#6A7288', P); c.beginPath(); c.arc(x, y, Math.max(1.2, T * 0.16), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.45)'; c.beginPath(); c.arc(x - T * 0.05, y - T * 0.05, Math.max(0.6, T * 0.06), 0, TAU); c.fill(); }
    const gb = c.createLinearGradient(L[0] - R, L[1] - R, L[0] + R, L[1] + R); gb.addColorStop(0, tint('#E0B060', P)); gb.addColorStop(0.5, tint('#9A6A2A', P)); gb.addColorStop(1, tint('#5A3A16', P)); c.fillStyle = gb; c.beginPath(); c.arc(L[0], L[1], R * 0.97, 0, TAU); c.fill(); c.strokeStyle = INK2; c.lineWidth = lw; c.stroke();
    // the glass
    const gg = c.createRadialGradient(L[0], L[1], R * 0.1, L[0], L[1], R * 0.88); gg.addColorStop(0, lit > 0.2 ? '#7A3A10' : '#2A1A10'); gg.addColorStop(1, '#1E0C06'); c.fillStyle = gg; c.beginPath(); c.arc(L[0], L[1], R * 0.86, 0, TAU); c.fill();
    // the iris: an amber ring, glowing, its blades closing round the aperture
    const ix = L[0] + look[0] * R * 0.2, iy = L[1] + look[1] * R * 0.16, ri = R * 0.64, rb = R * 0.5, ro = rb * clamp(ap, 0.15, 1.15) * 0.82;
    c.save(); c.beginPath(); c.arc(L[0], L[1], R * 0.86, 0, TAU); c.clip();
    const ig = c.createRadialGradient(ix, iy, rb * 0.6, ix, iy, ri); ig.addColorStop(0, P.heat > 0.3 ? '#FF9A4A' : AMBER_HI); ig.addColorStop(0.6, P.heat > 0.3 ? '#FF5A2A' : AMBER); ig.addColorStop(1, '#8A4A10'); c.globalAlpha = 0.25 + 0.75 * lit; c.fillStyle = ig; c.beginPath(); c.arc(ix, iy, ri, 0, TAU); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = 'rgba(90,40,8,.6)'; c.lineWidth = Math.max(1, T * 0.06); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; c.beginPath(); c.moveTo(ix + Math.cos(a) * rb, iy + Math.sin(a) * rb); c.lineTo(ix + Math.cos(a) * ri * 0.96, iy + Math.sin(a) * ri * 0.96); c.stroke(); }
    // the blades
    const nb = 7, rot = bt * 0.25 + ap * 1.4; c.fillStyle = tint('#3A2A20', P); c.beginPath(); c.arc(ix, iy, rb, 0, TAU); for (let i = nb; i >= 0; i--) { const a = rot + i / nb * TAU, x = ix + Math.cos(a) * ro, y = iy + Math.sin(a) * ro; i === nb ? c.moveTo(x, y) : c.lineTo(x, y); } c.closePath(); c.fill('evenodd');
    c.strokeStyle = tint('#7A6050', P); c.lineWidth = Math.max(1, T * 0.07); for (let i = 0; i < nb; i++) { const a = rot + i / nb * TAU, x = ix + Math.cos(a) * ro, y = iy + Math.sin(a) * ro, b = a + 1.25; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(ix + Math.cos(a + 0.6) * rb * 0.9, iy + Math.sin(a + 0.6) * rb * 0.9, ix + Math.cos(b) * rb, iy + Math.sin(b) * rb); c.stroke(); }
    c.strokeStyle = INK2; c.lineWidth = lw * 0.8; c.beginPath(); c.arc(ix, iy, rb, 0, TAU); c.stroke();
    // the aperture: a black well with a coal of light at the bottom
    c.fillStyle = '#05030A'; c.beginPath(); for (let i = 0; i < nb; i++) { const a = rot + i / nb * TAU, x = ix + Math.cos(a) * ro, y = iy + Math.sin(a) * ro; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.fill();
    K.glow(c, ix, iy, ro * 1.3, P.heat > 0.3 ? '#FF5A2A' : AMBER, (0.55 + be * 0.4) * lit); c.restore();
    // the glass's catch of light
    c.save(); c.strokeStyle = `rgba(255,255,255,${0.55 * (0.4 + 0.6 * lit)})`; c.lineWidth = Math.max(1.5, T * 0.18); c.beginPath(); c.arc(L[0], L[1], R * 0.72, Math.PI * 1.08, Math.PI * 1.42); c.stroke(); c.fillStyle = 'rgba(255,255,255,.7)'; c.beginPath(); c.ellipse(L[0] + R * 0.38, L[1] - R * 0.48, R * 0.1, R * 0.06, -0.6, 0, TAU); c.fill(); c.restore(); }
  // hoses and nerve cables from the heart's foot down over the rim to the floor
  function paintHoses(c, W3, QH, T, P, lw, bt, M) { for (const [hx, hz, fx, fy, w] of [[-6.4, -5.8, -8.6, -10.6, 0.7], [-2.8, -7.4, -3.4, -11.9, 0.62], [2.8, -7.4, 3.4, -11.9, 0.62], [6.4, -5.8, 8.6, -10.6, 0.7], [-0.8, -7.8, -1.0, -11.6, 0.5]]) {
      const a = QH(hx, hz), b = W3(fx, fy, 0.15), mid = [(a[0] + b[0]) / 2 + (fx < 0 ? -1 : 1) * T * 0.8, Math.max(a[1], b[1]) + T * 0.6];
      TN.tubeLite(c, [a, mid, b], () => w * T, { col: tint(FLESH, P), shade: tint('#52204A', P), hi: tint('#B05C9C', P), line: INK2, lw: lw * 0.9, r: w * T, force: true });
      const ph = ((M.bt - (M.lastBeat || 0)) * 1.4) % 1, pu = [lerp(a[0], b[0], ph), lerp(lerp(a[1], mid[1], ph), lerp(mid[1], b[1], ph), ph)]; K.glow(c, pu[0], pu[1], T * 0.6, AMBER, 0.7 * (1 - P.dk) * P.wake); } }
  // a cable-tentacle: an armoured hose (steel rings over flesh), a nerve of light down it, a steel clamp at its tip
  function paintCable(c, P3, T, cb, M, P, lw, bt) { if (!cb.pts) return; const sp = cb.pts.map(p => P3(p[0], p[1], p[2])), w0 = CABW[cb.k] * T, n = sp.length - 1;
    TN.tubeLite(c, sp, u => w0 * (1 - u * 0.45), { col: tint('#5E3058', P), shade: tint('#3E1A3A', P), hi: tint('#9A5A8E', P), line: INK2, lw, r: w0, force: true });
    // steel collars round it: short bands the width of the hose, lit on their upper edge
    for (let i = 2; i < n - 1; i += 3) { const a = sp[i - 1], b = sp[i + 1], q = sp[i], an = Math.atan2(b[1] - a[1], b[0] - a[0]), ww = w0 * (1 - i / n * 0.45) * 0.5, bw = T * 0.32; c.save(); c.translate(q[0], q[1]); c.rotate(an);
      c.fillStyle = INK2; GFX.rr(c, -bw * 0.5 - 1, -ww - 1.5, bw + 2, ww * 2 + 3, bw * 0.4); c.fill(); c.fillStyle = tint('#6A7288', P); GFX.rr(c, -bw * 0.5, -ww - 0.5, bw, ww * 2 + 1, bw * 0.35); c.fill(); c.fillStyle = tint('#C8D0E0', P); c.fillRect(-bw * 0.5 + 1, -ww * 0.8, bw * 0.35, ww * 0.9); c.restore(); }
    // the nerve: light running down it on the beat
    const ph = clamp((M.bt - (M.lastBeat || 0)) / 0.9, 0, 1), k = Math.round(ph * n); if (k > 0 && k < n && !(P.dk > 0.5)) K.glow(c, sp[k][0], sp[k][1], T * 0.9, AMBER, 0.8 * (1 - ph) * P.wake);
    // the clamp: two steel jaws round a lamp
    const tp = sp[n], pr = sp[n - 2], an = Math.atan2(tp[1] - pr[1], tp[0] - pr[0]), jw = cb.jaw || 0, S = T * (cb.k === 2 ? 0.8 : 1);
    c.save(); c.translate(tp[0], tp[1]); c.rotate(an);
    for (const sd of [-1, 1]) { const o = sd * (0.25 + jw * 0.7); c.save(); c.rotate(o); TN.shape(c, TN.poly([[-S * 0.2, sd * S * 0.18], [S * 0.9, sd * S * 0.28], [S * 1.55, sd * S * 0.05], [S * 1.2, sd * S * 0.02], [S * 0.8, sd * S * 0.12], [-S * 0.1, sd * S * 0.05]]), { col: tint('#8A92A8', P), shade: tint('#4A5268', P), hi: tint('#DCE2EE', P), line: INK2, lw, r: S * 0.6, force: true }); c.restore(); }
    TN.shape(c, TN.ell(0, 0, S * 0.62, S * 0.5, 0), { col: tint('#4A5268', P), shade: tint(STEEL_DK, P), hi: tint('#9AA4BC', P), line: INK2, lw, r: S * 0.6, force: true });
    K.glow(c, S * 0.1, 0, S * (0.9 + jw * 0.5), AMBER, (0.6 + jw * 0.3) * (1 - P.dk) * P.wake); c.fillStyle = tint(AMBER, P); c.beginPath(); c.arc(S * 0.1, 0, S * 0.18, 0, TAU); c.fill(); c.restore(); }
  // previews and the art sheet: a fight-less pose about the given anchor
  function demoPaint(c, FX, m, X, Y, T, t) { const M = FX.mem || {}, C = FX.C || { x: m.x, y: m.y + 15.3 };
    if (!M.P) { M.P = { sag: M.demoSag ? 1 : 0, heat: M.demoHeat ? 1 : 0, open: M.demoOpen ? 1 : 0, dk: 0, wake: 1, rec: 0 }; M.bt = M.bt || 0; M.lub = 0.6; M.dub = 0.2; M.look = [0.2, 0.3]; M.ap = M.demoSag ? 1 : 0.6; M.lastBeat = 0; M.recoil = 0; M.cab = ROOTS.map((r, k) => ({ k, mode: 'rest', t: 0, tip: [C.x + REST[k][0], C.y + REST[k][1], 0.35], lift: 0, jaw: 0.4 })); }
    const F2 = { C, mem: M, m, S: { enterT: 9 } }; cables(F2, m, 0); const P3 = TN.cam(X, Y, T, m); paintAll(c, F2, m, P3, T, M.bt || t, C, M); }

  /* ---------- over everything: raised cables, pistons dropping, the charge arcs, the lens's target, the chamber's breath ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C; if (!m || !M.P) return; const P = M.P, P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T], lw = Math.max(1.2, T * 0.08);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // the cables raised to strike
    for (const cb of M.cab) if (cb.lift >= 0.15 && !m.dead) paintCable(c, P3, T, cb, M, P, lw, M.bt);
    // the pistons: rows of steel heads dropping out of the dark onto their lanes, and rising again
    const heads = []; for (const s of FX.S.tele) { if (s.done || !s.lane) continue; const u = clamp(s.age / s.t, 0, 1); if (u < 0.5) continue; heads.push([s.lane.ly, 8 * (1 - Math.pow((u - 0.5) / 0.5, 2))]); }
    for (const s of M.slams) heads.push([s.ly, s.t < 0.3 ? 0 : 8 * smooth((s.t - 0.3) / 0.8)]);
    heads.sort((a, b) => a[0] - b[0]); for (const [ly, z] of heads) paintPistonRow(c, P3, T, C, ly, z, lw);
    // the capacitors' charge: arcs of current from the heart to each charged one
    if (M.ov) for (let i = 0; i < 4; i++) { const cp = M.caps[i]; if (cp.st !== 'charged') continue; const a = lensAt(FX), b = [C.x + CAPS[i][0], C.y + CAPS[i][1] - 2.7]; zapArc(c, FX.sx(a[0] + (i % 2 ? 4 : -4)), FX.sy(a[1] + 3), FX.sx(b[0]), FX.sy(b[1]), T, t * 30 + i * 7, VIOLET_HI, 0.55 + 0.35 * Math.sin(t * 20 + i)); }
    // the bared lens: a target ring on it
    if (m.stunT > 0 && FX.S.weak.lens && !FX.S.weak.lens.dead) { const L = lensAt(FX), X = FX.sx(L[0]), Y = FX.sy(L[1]), pu = 0.5 + 0.5 * Math.sin(t * 7), col = M.stall ? '#FFB07A' : AMBER_HI; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = col; c.globalAlpha = 0.55 + 0.4 * pu; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.arc(X, Y, T * (3.6 + pu * 0.4), 0, TAU); c.stroke(); c.restore(); label(c, 'LENS', X, Y - T * 4.6, T, col); }
    // the swarm: its count over the pet; the repair warning at the heart
    if (M.sw) { const left = M.sw.left + M.sw.list.length, Xs = FX.sx(FX.me.x), Ys = FX.sy(FX.me.y) - T * 2.3; label(c, `THE SWARM · ${left} left`, Xs, Ys, T * 1.05, AMBER_HI);
      for (const p of PORTS) { const X = FX.sx(C.x + p[0]), Y = FX.sy(C.y + p[1]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.25 * Math.sin(t * 6); blitSized(c, glowSprite(HEAL), X - T * 1.4, Y - T * 1.4, T * 2.8, T * 2.8); c.restore(); } }
    if (M.repairT > 0) { const L = lensAt(FX), a = Math.min(1, M.repairT) * (0.6 + 0.4 * Math.sin(t * 14)); c.save(); c.globalAlpha = a; label(c, 'REPAIRING', FX.sx(L[0]), FX.sy(L[1]) - T * 5.2, T * 1.25, HEAL); c.restore(); }
    // the chamber breathes with the beat: a violet vignette swelling at the screen's edge
    { const be = beatEnv(M) * (1 - P.dk), V = K.viewBox(c, 0), a = (0.16 + be * 0.22 + P.heat * 0.15) * P.wake; if (a > 0.01) { if (!vigCv) { vigCv = document.createElement('canvas'); vigCv.width = 96; vigCv.height = 192; const g = vigCv.getContext('2d'), gr = g.createRadialGradient(48, 96, 30, 48, 96, 110); gr.addColorStop(0, 'rgba(122,40,110,0)'); gr.addColorStop(0.55, 'rgba(122,40,110,0.15)'); gr.addColorStop(1, 'rgba(70,10,60,1)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 192); }
        c.save(); c.globalAlpha = Math.min(1, a); c.drawImage(vigCv, V[0], V[1], V[2] - V[0], V[3] - V[1]); c.restore(); } }
    c.restore(); }
  // a crackling arc of current between two points on the screen
  function zapArc(c, x0, y0, x1, y1, T, seed, col, a) { const n = 9, pts = [[x0, y0]], nx = -(y1 - y0), ny = x1 - x0, L = Math.hypot(nx, ny) || 1; for (let i = 1; i < n; i++) { const u = i / n, j = Math.sin(seed * 1.7 + i * 2.3) * Math.cos(seed * 0.9 + i) * T * 0.9; pts.push([lerp(x0, x1, u) + nx / L * j, lerp(y0, y1, u) + ny / L * j]); } pts.push([x1, y1]);
    c.save(); c.globalCompositeOperation = 'lighter'; for (const [w, cc, aa] of [[T * 0.5, VIOLET, 0.3], [T * 0.18, col, 0.8], [T * 0.07, '#FFFFFF', 1]]) { c.globalAlpha = aa * a; c.strokeStyle = cc; c.lineWidth = Math.max(1, w); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } c.restore(); }
  // a row of piston heads over a lane, at height z: heavy steel blocks on rods out of the dark
  function paintPistonRow(c, P3, T, C, ly, z, lw) { const hw = laneHalf(ly), n = Math.max(2, Math.floor(hw * 2 / 3.4)), step = hw * 2 / n, y0 = C.y + ly - LW / 2 + 0.15, y1 = C.y + ly + LW / 2 - 0.15;
    for (let i = 0; i < n; i++) { const x0 = C.x - hw + i * step + 0.25, x1 = x0 + step - 0.5, xm = (x0 + x1) / 2, tA = P3(x0, y0, z + 1.1), tB = P3(x1, y1, z + 1.1), fB = P3(x1, y1, z), top = P3(xm, y0 + 0.6, 26);
      // the rod, then the block: its top face and its front
      c.fillStyle = '#8A92A8'; c.fillRect(top[0] - T * 0.32, top[1], T * 0.64, tA[1] - top[1] + T); c.strokeStyle = INK2; c.lineWidth = lw; c.strokeRect(top[0] - T * 0.32, top[1], T * 0.64, tA[1] - top[1] + T); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(top[0] - T * 0.22, top[1], T * 0.1, tA[1] - top[1] + T);
      TN.shape(c, TN.poly([[tA[0], tA[1]], [tB[0], tA[1]], [tB[0], tB[1]], [tA[0], tB[1]]]), { col: '#6A7288', shade: '#4A5268', hi: '#C8D0E0', line: INK2, lw, r: T * 1.2, d1: 0.08, d2: 0.14, force: true });
      TN.shape(c, TN.poly([[tA[0], tB[1]], [tB[0], tB[1]], [fB[0], fB[1]], [tA[0], fB[1]]]), { col: '#3A3F50', shade: '#2A2F3E', hi: '#5A6278', line: INK2, lw, r: T * 0.6, force: true });
      // hazard stripes along its front edge, an amber lamp on top
      c.save(); c.beginPath(); c.rect(tA[0], tB[1] + (fB[1] - tB[1]) * 0.55, tB[0] - tA[0], (fB[1] - tB[1]) * 0.35); c.clip(); for (let k = -2; k < 12; k++) { c.fillStyle = k % 2 ? '#1A1A1A' : AMBER; const xx = tA[0] + k * T * 0.5; c.beginPath(); c.moveTo(xx, tB[1]); c.lineTo(xx + T * 0.25, tB[1]); c.lineTo(xx - T * 0.25, fB[1]); c.lineTo(xx - T * 0.5, fB[1]); c.closePath(); c.fill(); } c.restore();
      const lp = P3(xm, (y0 + y1) / 2, z + 1.1); K.glow(c, lp[0], lp[1], T * 0.9, AMBER, 0.6); } }
  function label(c, s, X, Y, T, col) { c.save(); c.font = `900 ${Math.max(10, Math.round(T * 0.46))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText(s, X, Y); c.fillStyle = col; c.fillText(s, X, Y); c.restore(); }

  /* ---------- the floor's living layer: the beat in the cables, the rings, the lanes, the coolant, the charge ---------- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !M.P || !m) return; const X0 = FX.sx(C.x), Y0 = FX.sy(C.y), P = M.P, be = beatEnv(M) * (1 - P.dk) * P.wake;
    const floor = () => { c.beginPath(); c.ellipse(X0, Y0, RX * T, RY * T, 0, 0, TAU); c.rect(X0 - GW * T, Y0 + GN * T, GW * 2 * T, (-11 - GN) * T); };
    c.save();
    // the beat: a glow swelling from its foot, and light running out along the nerve cables
    if (be > 0.02) { const X = FX.sx(C.x + SRC[0]), Y = FX.sy(C.y + SRC[1]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = be * 0.35; blitSized(c, glowSprite(VIOLET), X - T * 9, Y - T * 6, T * 18, T * 12); c.restore(); }
    if (!(P.dk > 0.6)) { const d0 = (M.bt - (M.lastBeat || 0)) * 9; c.save(); c.globalCompositeOperation = 'lighter'; NERVES.forEach((N, k) => { const Lk = NERVE_L[k].L; for (const off of [0, -6]) { const d = d0 + off; if (d < 0 || d > Lk) continue; const p = alongNerve(k, d), a = (1 - d / (Lk + 4)) * 0.85 * P.wake; c.globalAlpha = a; blitSized(c, glowSprite(AMBER), FX.sx(C.x + p[0]) - T * 0.8, FX.sy(C.y + p[1]) - T * 0.8, T * 1.6, T * 1.6); } }); c.restore(); }
    // the coolant: rising from the rim inward, the grates standing out of it
    if (M.fl && M.fl.lv > 0.01) drawFlood(c, FX, t, T, floor);
    // the piston lanes: numbered bands, darkening as the pistons come
    for (const s of FX.S.tele) { if (s.done || !s.lane) continue; const u = clamp(s.age / s.t, 0, 1), L = s.lane, hw = laneHalf(L.ly), ya = Y0 + (L.ly - LW / 2) * T, yb = Y0 + (L.ly + LW / 2) * T, xa = X0 - hw * T, xb = X0 + hw * T;
      c.save(); floor(); c.clip(); c.beginPath(); c.rect(xa - 4, L.k === 0 ? Y0 + GN * T : ya, xb - xa + 8, L.k === 0 ? yb - Y0 - GN * T : L.k === LANES.length - 1 ? Y0 + RY * T - ya + 4 : yb - ya); const hot = u > 0.7 ? 0.5 + 0.5 * Math.sin(t * 20) : 0; c.fillStyle = `rgba(10,4,14,${0.12 + u * 0.25 + (L.k % 2 ? 0.1 : 0)})`; c.fill(); c.fillStyle = `rgba(255,${Math.round(178 - hot * 80)},63,${0.08 + u * u * 0.3 + hot * 0.12})`; c.fill();
      c.strokeStyle = `rgba(255,210,140,${0.5 + 0.4 * u})`; c.lineWidth = Math.max(2, T * (0.1 + u * 0.08)); c.setLineDash([T * 0.5, T * 0.3]); c.lineDashOffset = -t * T * 2; c.stroke(); c.setLineDash([]);
      if (u > 0.45) { const k2 = (u - 0.45) / 0.55, n = Math.max(2, Math.floor(hw * 2 / 3.4)), step = hw * 2 / n; for (let i = 0; i < n; i++) { const x = xa + (i + 0.5) * step * T; c.fillStyle = `rgba(0,0,0,${0.15 + 0.35 * k2})`; c.beginPath(); c.ellipse(x, (ya + yb) / 2, step * T * 0.45 * (0.6 + 0.4 * k2), LW * T * 0.42 * (0.6 + 0.4 * k2), 0, 0, TAU); c.fill(); } } c.restore();
      label(c, L.lab, FX.sx(clamp(FX.me.x + 3.2, C.x - hw + 1.5, C.x + hw - 1.5)), (ya + yb) / 2, T * 1.6, '#FFFFFF'); }
    // the rings of the pulse: violet bands with a gap, their leading edge bright
    if (M.rings.length) { const X = FX.sx(C.x + SRC[0]), Y = FX.sy(C.y + SRC[1]); c.save(); floor(); c.clip(); c.globalCompositeOperation = 'lighter';
      for (const R of M.rings) { const r = R.r * T, a0 = R.gap + R.gw, a1 = R.gap - R.gw + TAU, fade = clamp((30 - R.r) / 4, 0, 1) * clamp(R.age / 0.15, 0, 1);
        c.globalAlpha = 0.55 * fade; c.strokeStyle = VIOLET; c.lineWidth = R.w * T; c.beginPath(); c.arc(X, Y, r, a0, a1); c.stroke();
        c.globalAlpha = 0.9 * fade; c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(1.5, T * 0.16); c.beginPath(); c.arc(X, Y, r + R.w * T * 0.4, a0, a1); c.stroke(); c.strokeStyle = AMBER_HI; c.lineWidth = Math.max(1, T * 0.06); c.beginPath(); c.arc(X, Y, r + R.w * T * 0.5, a0, a1); c.stroke();
        // the gap's two ends, glowing teal: the way through
        for (const ea of [a0, a1]) { c.globalAlpha = 0.8 * fade; blitSized(c, glowSprite(TEAL_HI), X + Math.cos(ea) * r - T * 0.8, Y + Math.sin(ea) * r - T * 0.8, T * 1.6, T * 1.6); } }
      c.restore(); }
    // the capacitors' charge: a ring at each one's foot running round as the charge fills
    if (M.ov) for (let i = 0; i < 4; i++) { const cp = M.caps[i]; if (cp.st !== 'charged') continue; const X = FX.sx(C.x + CAPS[i][0]), Y = FX.sy(C.y + CAPS[i][1]), u = clamp(M.ov.t / M.ov.W, 0, 1); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = u > 0.75 ? '#FF6A8A' : VIOLET_HI; c.globalAlpha = 0.8; c.lineWidth = Math.max(2.5, T * 0.18); c.beginPath(); c.arc(X, Y, T * 1.9, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - u)); c.stroke(); c.restore(); }
    c.restore();
    // fallen, it is no longer among the living things on the field: the dead heart is laid down here, under them all
    if (m.dead) { const P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T]; paintAll(c, FX, m, P3, T, M.bt, C, M); } }
  function drawFlood(c, FX, t, T, floor) { const M = FX.mem, C = FX.C, F = M.fl, X0 = FX.sx(C.x), Y0 = FX.sy(C.y), lv = F.lv, k = Math.max(0, 1 - lv * 1.03);
    c.save(); floor(); c.clip();
    // the flooded part: everything outside an oval shrinking as it rises, less the grates
    const big = () => c.rect(X0 - (RX + 2) * T, Y0 + (GN - 2) * T, (RX + 2) * 2 * T, (RY - GN + 4) * T);
    if (k > 0.01) { c.beginPath(); big(); c.moveTo(X0 + RX * k * T, Y0); c.ellipse(X0, Y0, RX * k * T, RY * k * T, 0, 0, TAU, true); c.clip('evenodd'); }
    c.beginPath(); big(); for (const [gx, gy] of GRATES) { const x = X0 + gx * T, y = Y0 + gy * T; c.moveTo(x - GX * T, y - GY * T); c.lineTo(x - GX * T, y + GY * T + T * 0.35); c.lineTo(x + GX * T, y + GY * T + T * 0.35); c.lineTo(x + GX * T, y - GY * T); c.closePath(); } c.clip('evenodd');
    const full = F.st === 'full' ? 1 : 0, gl = c.createRadialGradient(X0, Y0, T * 2, X0, Y0, RX * T); gl.addColorStop(0, 'rgba(40,190,170,.62)'); gl.addColorStop(1, 'rgba(20,120,120,.72)'); c.fillStyle = gl; c.fillRect(X0 - (RX + 2) * T, Y0 + (GN - 2) * T, (RX + 2) * 2 * T, (RY - GN + 4) * T);
    // caustics and ripples
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(184,255,242,.35)'; c.lineWidth = Math.max(1, T * 0.07); for (let i = 0; i < 40; i++) { const a = i * 2.39996, d = Math.sqrt((i + 0.5) / 40) * 0.95, x = X0 + Math.cos(a) * RX * d * T, y = Y0 + Math.sin(a) * RY * d * T, r = T * (0.5 + 0.35 * Math.sin(t * 2 + i)); c.beginPath(); c.ellipse(x + Math.sin(t * 0.8 + i) * T * 0.4, y, r * 1.6, r * 0.6, 0, 0, TAU); c.stroke(); }
    c.restore();
    // the advancing edge: a line of foam
    if (k > 0.01) { c.save(); floor(); c.clip(); c.strokeStyle = 'rgba(220,255,250,.8)'; c.lineWidth = Math.max(2, T * 0.16); c.setLineDash([T * 0.4, T * 0.25]); c.lineDashOffset = t * T; c.beginPath(); c.ellipse(X0, Y0, RX * k * T, RY * k * T, 0, 0, TAU); c.stroke(); c.restore(); }
    // the grates, lit as the places to stand
    for (const [gx, gy] of GRATES) { const x = X0 + gx * T, y = Y0 + gy * T, pu = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = TEAL_HI; c.globalAlpha = 0.5 + 0.4 * pu * (1 - full * 0.5); c.lineWidth = Math.max(2, T * 0.12); c.strokeRect(x - GX * T, y - GY * T, GX * 2 * T, GY * 2 * T); c.restore();
      if (F.st === 'rise') { const g = c.createLinearGradient(0, y - T * 6, 0, y); g.addColorStop(0, 'rgba(184,255,242,0)'); g.addColorStop(1, `rgba(184,255,242,${0.25 + 0.1 * pu})`); c.fillStyle = g; c.fillRect(x - GX * T * 0.8, y - T * 6, GX * T * 1.6, T * 6); label(c, 'GRATE', x, y - T * 3.2, T * 0.9, TEAL_HI); } } }

  /* ---------- a capacitor: a tall glass coil-tube on a steel drum, violet when charged, cracked when broken ---------- */
  function drawCap(c, FX, p, X, Y, T, t) { const M = FX.mem, cp = M && M.caps ? M.caps[p.i] : { st: 'idle' }, lw = Math.max(1.2, T * 0.08), st = cp.st, on = st === 'charged', br = st === 'broken', H = 2.7, w = 0.62, Q = z => Y - z * T, pu = 0.5 + 0.5 * Math.sin(t * (on ? 14 : 2) + p.i);
    c.save(); c.lineJoin = 'round'; TN.groundShadow(c, X, Y + T * 0.1, T * 1.2, T * 0.42, 0, 0.35);
    // the drum
    TN.shape(c, TN.poly([[X - T * 0.95, Q(0)], [X + T * 0.95, Q(0)], [X + T * 0.95, Q(0.65)], [X - T * 0.95, Q(0.65)]]), { col: STEEL, shade: '#3A3F50', hi: STEEL_HI, line: INK2, lw, r: T * 1.2, force: true });
    c.fillStyle = '#6A7288'; c.beginPath(); c.ellipse(X, Q(0.65), T * 0.95, T * 0.32, 0, 0, TAU); c.fill(); c.strokeStyle = INK2; c.lineWidth = lw; c.stroke();
    c.save(); c.beginPath(); c.rect(X - T * 0.95, Q(0.3), T * 1.9, T * 0.2); c.clip(); for (let k = -4; k < 5; k++) { c.fillStyle = k % 2 ? '#1A1A1A' : AMBER; c.beginPath(); c.moveTo(X + k * T * 0.3, Q(0.5)); c.lineTo(X + k * T * 0.3 + T * 0.15, Q(0.5)); c.lineTo(X + k * T * 0.3 - T * 0.05, Q(0.3)); c.lineTo(X + k * T * 0.3 - T * 0.2, Q(0.3)); c.closePath(); c.fill(); } c.restore();
    // the glass tube and its core
    const top = br ? 1.7 : H; if (on) K.glow(c, X, Q(1.7), T * (2.4 + pu * 0.6), VIOLET, 0.7); else if (!br) K.glow(c, X, Q(1.7), T * 1.4, VIOLET, 0.25);
    c.fillStyle = on ? 'rgba(232,184,255,.55)' : br ? 'rgba(60,40,70,.6)' : 'rgba(150,110,180,.35)'; c.beginPath(); c.moveTo(X - w * T, Q(0.65)); c.lineTo(X - w * T, Q(top)); if (br) { c.lineTo(X - w * T * 0.4, Q(top + 0.3)); c.lineTo(X, Q(top - 0.1)); c.lineTo(X + w * T * 0.5, Q(top + 0.4)); } c.lineTo(X + w * T, Q(top)); c.lineTo(X + w * T, Q(0.65)); c.closePath(); c.fill(); c.strokeStyle = INK2; c.lineWidth = lw; c.stroke();
    if (!br) { c.strokeStyle = on ? '#FFFFFF' : VIOLET_HI; c.lineWidth = Math.max(1.5, T * (on ? 0.14 : 0.08)); c.globalAlpha = on ? 1 : 0.6; c.beginPath(); for (let i = 0; i <= 10; i++) { const z = 0.8 + i / 10 * (H - 0.4), x = X + Math.sin(i * 1.9 + t * (on ? 20 : 2)) * T * 0.22; i ? c.lineTo(x, Q(z)) : c.moveTo(x, Q(z)); } c.stroke(); c.globalAlpha = 1; }
    c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(X - w * T * 0.7, Q(top - 0.15), w * T * 0.22, (top - 0.95) * T);
    // coils round it, and its cap with two prongs
    for (let k = 0; k < 3; k++) { const z = 1.0 + k * 0.6; c.strokeStyle = INK2; c.lineWidth = lw * 2.2; c.beginPath(); c.ellipse(X, Q(z), w * T * 1.15, T * 0.16, 0, 0, Math.PI); c.stroke(); c.strokeStyle = '#B07A3A'; c.lineWidth = lw * 1.1; c.stroke(); }
    if (!br) { TN.shape(c, TN.poly([[X - T * 0.75, Q(H)], [X + T * 0.75, Q(H)], [X + T * 0.6, Q(H + 0.35)], [X - T * 0.6, Q(H + 0.35)]]), { col: '#4A5268', shade: STEEL_DK, hi: '#9AA4BC', line: INK2, lw, r: T * 0.6, force: true });
      for (const sd of [-1, 1]) { c.strokeStyle = INK2; c.lineWidth = lw * 2; c.beginPath(); c.moveTo(X + sd * T * 0.35, Q(H + 0.35)); c.lineTo(X + sd * T * 0.5, Q(H + 0.85)); c.stroke(); c.strokeStyle = '#C8D0E0'; c.lineWidth = lw; c.stroke(); }
      if (on) { const x2 = X + (Math.random() - 0.5) * T * 0.8; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1, T * 0.06); c.beginPath(); c.moveTo(X - T * 0.5, Q(H + 0.85)); c.lineTo(x2, Q(H + 1.2)); c.lineTo(X + T * 0.5, Q(H + 0.85)); c.stroke(); c.restore(); } }
    else { c.fillStyle = 'rgba(232,184,255,.7)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(X - T * 0.8 + k * T * 0.5, Q(0.68)); c.lineTo(X - T * 0.6 + k * T * 0.5, Q(0.75)); c.lineTo(X - T * 0.65 + k * T * 0.5, Q(0.66)); c.fill(); } if (Math.sin(t * 9 + p.i * 3) > 0.7) { c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(X, Q(top)); c.lineTo(X + T * 0.3, Q(top + 0.4)); c.stroke(); } }
    c.restore(); }

  /* ---------- the core's floor, painted once ---------- */
  function paintCore(c, A) { const rnd = A.rnd, R = A.R, E = R + 1.5;
    // the pit round the floor: dark machinery falling away, fading out at the picture's edge
    { const g = c.createRadialGradient(0, -2, R * 0.5, 0, -2, E * 1.05); g.addColorStop(0, '#120814'); g.addColorStop(0.8, '#0E0610'); g.addColorStop(1, 'rgba(10,4,14,0)'); c.fillStyle = g; c.fillRect(-E, -E, E * 2, E * 2);
      c.save(); c.globalAlpha = 0.85; for (let i = 0; i < 9; i++) { const y = -R + 0.5 + i * 0.9, w = 0.32 + rnd() * 0.2; c.strokeStyle = '#05020A'; c.lineWidth = w + 0.12; c.beginPath(); c.moveTo(-E, y); c.bezierCurveTo(-8, y + rnd() * 1.4, 8, y - rnd() * 1.4, E, y + (rnd() - 0.5)); c.stroke(); c.strokeStyle = i % 3 ? '#2A2236' : '#3A2440'; c.lineWidth = w; c.stroke(); } c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = R * (1.02 + rnd() * 0.12), x = Math.cos(a) * d * RX / R, y = Math.sin(a) * d * RY / R * 1.1; c.globalAlpha = 0.25 + rnd() * 0.3; blitSized(c, glowSprite(rnd() < 0.6 ? VIOLET : AMBER), x - 0.6, y - 0.6, 1.2, 1.2); } c.restore(); }
    // the platform's southern face, going down into the pit
    { const g0 = c.createLinearGradient(0, 0, 0, RY + 3); g0.addColorStop(0, '#2A2234'); g0.addColorStop(1, 'rgba(20,10,24,0)'); c.fillStyle = g0; c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI; i ? c.lineTo(Math.cos(a) * RX, Math.sin(a) * RY) : c.moveTo(Math.cos(a) * RX, Math.sin(a) * RY); } for (let i = 40; i >= 0; i--) { const a = i / 40 * Math.PI; c.lineTo(Math.cos(a) * RX * 0.97, Math.sin(a) * RY + 2.6); } c.closePath(); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 0.08; for (let i = 1; i < 40; i += 2) { const a = i / 40 * Math.PI, x = Math.cos(a) * RX, y = Math.sin(a) * RY; c.beginPath(); c.moveTo(x, y); c.lineTo(x * 0.99, y + 2.2); c.stroke(); }
      c.strokeStyle = 'rgba(196,82,255,.35)'; c.lineWidth = 0.07; c.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI; i ? c.lineTo(Math.cos(a) * RX * 0.985, Math.sin(a) * RY + 1.1) : c.moveTo(Math.cos(a) * RX * 0.985, Math.sin(a) * RY + 1.1); } c.stroke(); }
    // the gantry to the heart's foot: a steel walkway over the pit, railed, hazard-striped at its end
    { c.fillStyle = 'rgba(0,0,0,.5)'; c.fillRect(-GW - 0.2, GN - 0.2, GW * 2 + 0.4, -11 - GN + 0.4); c.fillStyle = '#4A4A5E'; c.fillRect(-GW, GN, GW * 2, -11 - GN); c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 0.05; for (let y = GN + 0.4; y < -11; y += 0.4) { c.beginPath(); c.moveTo(-GW + 0.15, y); c.lineTo(GW - 0.15, y); c.stroke(); }
      for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#1A1A1A' : AMBER; c.beginPath(); c.moveTo(-GW + i * 0.6, GN); c.lineTo(-GW + i * 0.6 + 0.3, GN); c.lineTo(-GW + i * 0.6, GN + 0.45); c.lineTo(-GW + i * 0.6 - 0.3, GN + 0.45); c.closePath(); c.fill(); }
      for (const sd of [-1, 1]) { c.fillStyle = '#2A2F3E'; c.fillRect(sd * GW - 0.14, GN, 0.28, -11 - GN); c.fillStyle = '#8A92A8'; c.fillRect(sd * GW - 0.06, GN, 0.08, -11 - GN); for (let y = GN + 0.3; y < -11.2; y += 1.2) { c.fillStyle = '#6A7288'; c.beginPath(); c.arc(sd * GW, y, 0.17, 0, TAU); c.fill(); } } }
    // the floor: plates of flesh-grown metal laid in rings round the heart
    c.save(); c.beginPath(); c.ellipse(0, 0, RX, RY, 0, 0, TAU); c.clip();
    { const g = c.createRadialGradient(0, -4, 2, 0, 0, RX); g.addColorStop(0, '#4E2C4A'); g.addColorStop(0.7, '#3E223C'); g.addColorStop(1, '#2A1628'); c.fillStyle = g; c.fillRect(-RX, -RY, RX * 2, RY * 2); }
    const [ox, oy] = SRC, cols = ['#4A2A46', '#452842', '#3E2240', '#50304C', '#482644'];
    for (let r0 = 1.2; r0 < 28; r0 += 2.3) { const r1 = r0 + 2.3, n = Math.max(6, Math.round(Math.PI * (r0 + r1) / 2.6)), off = rnd() * TAU;
      for (let i = 0; i < n; i++) { const a0 = off + i / n * TAU, a1 = off + (i + 1) / n * TAU, am = (a0 + a1) / 2, cx = ox + Math.cos(am) * (r0 + 1.15), cy = oy + Math.sin(am) * (r0 + 1.15); if (!inOval(cx, cy, -1.5)) continue;
        const flesh = rnd() < 0.12, ins = 0.07 / Math.max(1, r0) ; c.beginPath(); c.arc(ox, oy, r1 - 0.07, a0 + ins, a1 - ins); c.arc(ox, oy, r0 + 0.07, a1 - ins, a0 + ins, true); c.closePath();
        c.fillStyle = flesh ? (rnd() < 0.5 ? '#6A3460' : '#5E2E58') : cols[Math.floor(rnd() * cols.length)]; c.fill(); c.strokeStyle = '#1E0F1E'; c.lineWidth = 0.1; c.stroke();
        c.strokeStyle = 'rgba(255,200,240,.1)'; c.lineWidth = 0.06; c.beginPath(); c.arc(ox, oy, r0 + 0.14, a0 + ins * 2, a1 - ins * 2); c.stroke();
        if (flesh) { c.strokeStyle = 'rgba(40,8,36,.6)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(cx - 0.6, cy); c.quadraticCurveTo(cx, cy - 0.5, cx + 0.5, cy + 0.2); c.moveTo(cx, cy - 0.2); c.lineTo(cx + 0.2, cy + 0.5); c.stroke(); }
        else { c.fillStyle = 'rgba(0,0,0,.45)'; for (const ea of [a0 + 0.4 / r1, a1 - 0.4 / r1]) { c.beginPath(); c.arc(ox + Math.cos(ea) * (r1 - 0.35), oy + Math.sin(ea) * (r1 - 0.35), 0.08, 0, TAU); c.fill(); } } } }
    // flesh welling up between plates, with fungus
    for (let i = 0; i < 22; i++) { const x = (rnd() * 2 - 1) * RX * 0.9, y = (rnd() * 2 - 1) * RY * 0.85; if (!inOval(x, y, 1) || GRATES.some(([gx, gy]) => Math.abs(x - gx) < GX + 1 && Math.abs(y - gy) < GY + 1)) continue; const r = 0.4 + rnd() * 0.7; c.fillStyle = '#7A3A6E'; c.beginPath(); c.ellipse(x, y, r * 1.5, r * 0.8, rnd() * 3, 0, TAU); c.fill(); c.fillStyle = 'rgba(232,138,192,.4)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.2, r * 0.6, r * 0.3, 0, 0, TAU); c.fill();
      if (rnd() < 0.5) for (let k = 0; k < 3; k++) { const fx = x + (rnd() - 0.5) * r * 2, fy = y + (rnd() - 0.5) * r; c.fillStyle = FUNGUS; c.beginPath(); c.ellipse(fx, fy, 0.18, 0.11, 0, 0, TAU); c.fill(); } }
    // the nerve cables over the floor
    c.lineCap = 'round'; c.lineJoin = 'round'; NERVES.forEach((N, k) => { const path = () => { c.beginPath(); N.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); }; const w = k < 4 ? 0.55 : 0.42;
      path(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = w + 0.4; c.save(); c.translate(0.1, 0.15); c.stroke(); c.restore(); path(); c.strokeStyle = '#1A0C1A'; c.lineWidth = w + 0.14; c.stroke(); path(); c.strokeStyle = FLESH; c.lineWidth = w; c.stroke(); path(); c.strokeStyle = 'rgba(232,160,210,.45)'; c.lineWidth = w * 0.25; c.save(); c.translate(-w * 0.15, -w * 0.18); c.stroke(); c.restore();
      for (let i = 4; i < N.length; i += 6) { c.fillStyle = '#2A2F3E'; c.beginPath(); c.ellipse(N[i][0], N[i][1], w * 0.85, w * 0.6, 0, 0, TAU); c.fill(); c.fillStyle = '#6A7288'; c.beginPath(); c.ellipse(N[i][0], N[i][1] - 0.04, w * 0.6, w * 0.38, 0, 0, TAU); c.fill(); } });
    // the drains at the rim, where the coolant comes in
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.31, x = Math.cos(a) * (RX - 0.9), y = Math.sin(a) * (RY - 0.8); if (y < -9 && Math.abs(x) < 9) continue; c.fillStyle = '#140A16'; c.beginPath(); c.ellipse(x, y, 0.75, 0.42, 0, 0, TAU); c.fill(); c.strokeStyle = '#6A7288'; c.lineWidth = 0.1; c.stroke(); c.strokeStyle = 'rgba(63,224,200,.6)'; c.lineWidth = 0.06; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(x + k * 0.22, y - 0.3); c.lineTo(x + k * 0.22, y + 0.3); c.stroke(); } }
    // the repair ports at the heart's foot: round hatches with amber marks
    for (const [px, py] of PORTS) { c.fillStyle = '#2A2F3E'; c.beginPath(); c.ellipse(px, py, 1.0, 0.75, 0, 0, TAU); c.fill(); c.strokeStyle = '#8A92A8'; c.lineWidth = 0.1; c.stroke(); c.strokeStyle = AMBER; c.lineWidth = 0.08; for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.4; c.beginPath(); c.moveTo(px + Math.cos(a) * 0.45, py + Math.sin(a) * 0.34); c.lineTo(px + Math.cos(a) * 0.8, py + Math.sin(a) * 0.6); c.stroke(); } c.fillStyle = 'rgba(143,255,176,.35)'; c.beginPath(); c.ellipse(px, py, 0.3, 0.22, 0, 0, TAU); c.fill(); }
    // the capacitors' plinths
    for (const [px, py] of CAPS) { c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.ellipse(px, py + 0.1, 1.45, 1.0, 0, 0, TAU); c.fill(); c.fillStyle = '#3A3F50'; c.beginPath(); c.ellipse(px, py, 1.3, 0.9, 0, 0, TAU); c.fill(); c.strokeStyle = AMBER; c.lineWidth = 0.1; c.setLineDash([0.3, 0.2]); c.beginPath(); c.ellipse(px, py, 1.15, 0.8, 0, 0, TAU); c.stroke(); c.setLineDash([]); }
    // the raised grates: steel frames over a dark well, bars across, hazard stripes, a lip on their southern side
    for (const [gx, gy] of GRATES) { c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(gx - GX + 0.12, gy - GY + 0.3, GX * 2, GY * 2 + 0.2);
      c.fillStyle = '#2A2F3E'; c.fillRect(gx - GX, gy + GY, GX * 2, 0.35); c.fillStyle = '#5A6278'; c.fillRect(gx - GX, gy - GY, GX * 2, GY * 2); c.fillStyle = '#140A16'; c.fillRect(gx - GX + 0.28, gy - GY + 0.28, GX * 2 - 0.56, GY * 2 - 0.56);
      const gg = c.createRadialGradient(gx, gy, 0.1, gx, gy, GX); gg.addColorStop(0, 'rgba(196,82,255,.45)'); gg.addColorStop(1, 'rgba(196,82,255,0)'); c.fillStyle = gg; c.fillRect(gx - GX + 0.28, gy - GY + 0.28, GX * 2 - 0.56, GY * 2 - 0.56);
      c.fillStyle = '#7A8298'; for (let x = gx - GX + 0.5; x < gx + GX - 0.3; x += 0.38) c.fillRect(x, gy - GY + 0.28, 0.14, GY * 2 - 0.56); c.fillStyle = '#4A5268'; c.fillRect(gx - GX + 0.28, gy - 0.07, GX * 2 - 0.56, 0.14);
      c.save(); c.beginPath(); c.rect(gx - GX, gy + GY - 0.24, GX * 2, 0.24); c.clip(); for (let k = 0; k < 14; k++) { c.fillStyle = k % 2 ? '#1A1A1A' : AMBER; const xx = gx - GX + k * 0.3; c.beginPath(); c.moveTo(xx, gy + GY - 0.24); c.lineTo(xx + 0.15, gy + GY - 0.24); c.lineTo(xx, gy + GY); c.lineTo(xx - 0.15, gy + GY); c.closePath(); c.fill(); } c.restore();
      c.strokeStyle = '#1A0C1A'; c.lineWidth = 0.09; c.strokeRect(gx - GX, gy - GY, GX * 2, GY * 2 + 0.35); c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(gx - GX + 0.05, gy + GY - 0.05); c.lineTo(gx - GX + 0.05, gy - GY + 0.05); c.lineTo(gx + GX - 0.05, gy - GY + 0.05); c.stroke();
      for (const [bx, by] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { c.fillStyle = '#AEB6CC'; c.beginPath(); c.arc(gx + bx * (GX - 0.14), gy + by * (GY - 0.14), 0.07, 0, TAU); c.fill(); } }
    c.restore();
    // the rim: a raised steel lip, bolted
    c.strokeStyle = '#1A0C1A'; c.lineWidth = 0.6; c.beginPath(); c.ellipse(0, 0, RX - 0.1, RY - 0.1, 0, 0, TAU); c.stroke(); c.strokeStyle = '#4A5268'; c.lineWidth = 0.38; c.stroke(); c.strokeStyle = 'rgba(200,210,230,.45)'; c.lineWidth = 0.08; c.beginPath(); c.ellipse(0, 0, RX - 0.24, RY - 0.24, 0, 0, TAU); c.stroke();
    for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, x = Math.cos(a) * (RX - 0.1), y = Math.sin(a) * (RY - 0.1); if (y < -11 && Math.abs(x) < GW + 0.3) continue; c.fillStyle = '#9AA4BC'; c.beginPath(); c.arc(x, y, 0.07, 0, TAU); c.fill(); }
    c.fillStyle = '#4A4A5E'; c.fillRect(-GW, -RY - 0.4, GW * 2, 1.0); }
  /* the backdrop: the engine's dark interior, ribs of the hull arching overhead, violet haze, drifting spores */
  function paintSky(c, W, H, T) { const R = mulberry32(611), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07030C'); g.addColorStop(0.35, '#160A20'); g.addColorStop(0.7, '#0C0612'); g.addColorStop(1, '#07030A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite('#7A3A9E'), W * 0.5 - W * 0.9, -H * 0.25, W * 1.8, H * 0.8); c.restore();
    c.save(); c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const x0 = -W * 0.2 + i * W * 0.28, sw = (i % 2 ? 1 : -1); c.strokeStyle = '#05020A'; c.lineWidth = T * (1.2 + R()); c.beginPath(); c.moveTo(x0, H * 1.05); c.quadraticCurveTo(x0 + sw * W * 0.25, H * 0.25, W * 0.5 + sw * W * 0.05, -H * 0.05); c.stroke(); c.strokeStyle = 'rgba(196,82,255,.18)'; c.lineWidth = T * 0.15; c.stroke(); } c.restore();
    for (let i = 0; i < 80; i++) { const x = R() * W, y = R() * H, s = 0.6 + R() * R() * 2.2; c.globalAlpha = 0.25 + R() * 0.5; c.fillStyle = R() < 0.7 ? '#E8B8FF' : '#FFB23F'; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); } c.globalAlpha = 1; }
})());
