/* ---------- VELLUM THE INKBOUND ----------
   The Library of Unwritten Lives' second boss, fought in the Spilled-Ink Chamber of the binding workshop: a square
   island of ink-stained floorboards twenty-six metres across, adrift in the dark of the dream, with a low lectern on a
   round dais in each quarter, each holding a pale cleansing page.
   Vellum is a broad cuttlefish hovering two metres over the boards: a flat black mantle shaped like a fountain-pen nib
   (a gold slit running back from a gold-ringed breather hole to the point, gold scrollwork on its shoulders), a cream
   underside, a thin burgundy fin rippling all round its edge, four short tentacles at the front and two long burgundy
   arms reaching out sideways, clubbed and suckered. A row of three gold eyes with W-shaped pupils follows the pet.
   Inkblot: it spits three globs of ink where the pet has just been (shown circles); they leave pools that hurt and
   slow. A pool over a lectern drowns its page: lead the pools away from the lecterns.
   Cleansing pages: walk up to a lectern to take its page; carry it through a pool and the pool is cleansed into a
   clean patch of floor (each page cleanses two, then it is spent and comes back to its lectern a while later).
   BLINDED (a stagger): cleanse two pools in a row beside Vellum (inside the gold ring shown round it while you carry a
   page) and the page's light blinds it: it drops, its mantle cracks open along the slit and its heart is bared.
   Redaction: it covers the floor in bands: solid red ones are real and slam down; violet dashed ones are lies and do
   nothing (twice, crossing, in the second phase).
   Tentacle Swipe: an arm sweeps a shown arc (twice in the second phase). Ink Jet: a jet down a shown line.
   The Rising Ink (from half health): it tethers a lectern with one arm and stains its page (a bar fills): strike the
   exposed arm to break the tether and it drops, STAGGERED as above; let the bar fill and that lectern is lost: it
   drinks the page, heals and hits harder. Ink Flood: the ink rises over the whole floor; only the lecterns' daises and
   cleansed patches stay dry, and ink stalkers and margin worms crawl out of it.
   It is never still: the fin ripples round the mantle, the eyes track and blink, the tentacles curl, the arms sway and
   drag behind its turns, ink drips from its rim; it jolts on a hit, and it comes down out of the dark on entering. */
RiftFiend.define({ id: 'vellum', hpK: 1.25, dmgK: 1.25, name: 'Vellum', title: 'The Inkbound', color: '#26222F', glow: '#CFAD62', accent: '#F2DC9A', biome: 'binding', r: 2.8, els: ['dark', 'water'], phases: 2 }, (() => {
  const { TAU, TN, hit } = RiftFiend;
  const { PARCH, PARCH_D, PARCH_HI, BURG, BURG_HI, GOLD, GOLD_HI, VIOLET, VIOLET_HI, WOOD, WOOD_D } = LIB;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const hr = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const FX0 = DunFiend.KIT, mixC = FX0.mixC, rgba = FX0.rgba;
  const LINE = '#0B0910', MAN = '#2A2636', MAN_SH = '#16131E', MAN_HI = '#4E4866', CREAM = '#EADBBE', CREAM_SH = '#C4AE86', CREAM_HI = '#FBF3E2';
  const ARM = '#83405F', ARM_SH = '#4E1E3A', ARM_HI = '#B8688E', TEN = '#5E3352', TEN_SH = '#341A30', TEN_HI = '#8E5A80', FIN = '#8E4468', FIN_SH = '#5A2442', FIN_HI = '#C07A9C';
  const POOL = '#17111F', HOSTILE = '#FF4D6D', LIE = VIOLET_HI;
  // the chamber: a square HS each way from the centre; the lecterns on their daises in the four quarters
  const HS = 13, ARENA = 18.6, ALT = 2.1, POOL_R = 1.9, DAIS_R = 2.1, PICK_R = 1.8, NEAR = 7.5, LECT_Z = 1.3, CHARGES = 2;
  const LP = [[-6.5, -6.5], [6.5, -6.5], [6.5, 6.5], [-6.5, 6.5]];
  const lectAt = (C, i) => [C.x + LP[i][0], C.y + LP[i][1]];
  const inSq = (C, x, y, pad) => Math.abs(x - C.x) < HS - (pad || 0) && Math.abs(y - C.y) < HS - (pad || 0);
  const clampSq = (C, p, pad) => { const L = HS - pad; p.x = clamp(p.x, C.x - L, C.x + L); p.y = clamp(p.y, C.y - L, C.y + L); return p; };
  // how far a ray runs before it leaves the square
  const rayLen = (C, x, y, a) => { const dx = Math.cos(a), dy = Math.sin(a); let t = 99; if (Math.abs(dx) > 1e-4) t = Math.min(t, ((dx > 0 ? C.x + HS : C.x - HS) - x) / dx); if (Math.abs(dy) > 1e-4) t = Math.min(t, ((dy > 0 ? C.y + HS : C.y - HS) - y) / dy); return Math.max(1, t); };
  // the redaction's six bands: R real, S safe (a lie or left clear); never two real bands side by side
  const PAT = ['RSRSRS', 'SRSRSR', 'RSRSSR', 'RSSRSR', 'SRSSRS'];
  /* the mantle: a pen nib seen from above, broad at the shoulders (u forward, v left), tapering to the point behind */
  const SIDE_CP = [[1.62, 0], [1.56, 0.6], [1.42, 1.2], [1.12, 1.78], [0.62, 2.14], [0, 2.24], [-0.65, 2.04], [-1.3, 1.6], [-1.92, 1.04], [-2.45, 0.5], [-2.95, 0]];
  function crOpen(P, n) { const out = []; for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)]; for (let j = 0; j < n; j++) { const t = j / n, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3))); } } out.push(P[P.length - 1].slice()); return out; }
  const SIDE = crOpen(SIDE_CP, 4);
  const CONTOUR = SIDE.concat(SIDE.slice(1, -1).reverse().map(([u, v]) => [u, -v])), NC = CONTOUR.length, CEN = [-0.55, 0];
  const NRM = CONTOUR.map((p, i) => { const a = CONTOUR[(i - 1 + NC) % NC], b = CONTOUR[(i + 1) % NC]; let nx = b[1] - a[1], ny = -(b[0] - a[0]); const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; if (nx * (p[0] - CEN[0]) + ny * (p[1] - CEN[1]) < 0) { nx = -nx; ny = -ny; } return [nx, ny]; });
  const FIN_IDX = CONTOUR.map((p, i) => i).filter(i => CONTOUR[i][0] < 1.2);
  const TOP = 0.16, BELLY = -0.46, HUMP = 0.52;
  const surfH = (u, v) => HUMP * Math.max(0, 1 - ((u - CEN[0]) / 2.65) ** 2 - (v / 2.35) ** 2);
  const TENT_V = [-0.8, -0.27, 0.27, 0.8], ARM_S = [1, -1];
  const HORDE = [[0.3, 'inkstalker'], [1.0, 'inkstalker'], [1.8, 'marginworm'], [2.6, 'inkstalker'], [3.5, 'inkstalker']];
  const at = (p, u, v, zAbs) => { const q = p.W(u, v, 0); return [q[0], q[1], zAbs]; };
  const armW = (u, S) => (u < 0.62 ? 0.46 - 0.26 * u : u < 0.86 ? 0.3 + 0.12 * Math.sin((u - 0.62) / 0.24 * Math.PI) : 0.3 - (u - 0.86) / 0.14 * 0.2) * S;
  function hull(pts) { const P = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of P) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  return {
    arenaR: ARENA, firstAct: 'hover', artY: 1.0,
    artPoses: [{ name: 'hovering, the fin rippling', mem: { alt: 2.1 } }, { name: 'rearing to spit ink', mem: { alt: 2.5, rear: 1, menace: 1 } }, { name: 'blinded: dropped, the mantle cracked open', mem: { alt: 0.8, open: 1 } }],
    phaseNames: ['The Spilled-Ink Chamber', 'The Rising Ink', 'The Rising Ink', 'The Last Page'],
    start(C) { return { x: C.x + 0.5, y: C.y + 10.5 }; },
    props: C => LP.map((q, i) => ({ kind: 'lectern', i, x: C.x + q[0], y: C.y + q[1] })),
    // (outside the square is the void; each lectern is solid)
    carve(set, C) { const RR = Math.ceil(C.R) + 2; for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y; if (Math.abs(wx + 0.5 - C.x) > HS || Math.abs(wy + 0.5 - C.y) > HS) set(wx, wy, T_SOLID); }
      for (let i = 0; i < 4; i++) { const p = lectAt(C, i); for (let y = Math.floor(p[1]) - 1; y <= Math.floor(p[1]) + 1; y++) for (let x = Math.floor(p[0]) - 1; x <= Math.floor(p[0]) + 1; x++) if (Math.hypot(x + 0.5 - p[0], y + 0.5 - p[1]) < 0.8) set(x, y, T_SOLID); } },
    paintGround(c, A) { paintChamber(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, t, cam, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.x = C.x; m.y = C.y - 2.5; m.noTouch = true;
      Object.assign(M, { bt: 0, alt: 11, wake: 0, th: Math.PI / 2, look: [0, 1], recoil: 0, roar: 0, menace: 0, open: 0, rear: 0, armRec: 0, armHit: 0,
        trail: [], pools: [], patches: [], stamps: [], lies: [], globs: [], lect: LP.map(() => ({ st: 'page', back: 0, stain: 0, glow: 1, drown: false })), carry: null, glare: { n: 0, t: 0 },
        ib: null, red: null, sw: null, swAim: null, jet: null, jetAim: null, st: null, fl: null, bag: null, last: null, seen: {}, broodT: 14, wasStun: false, wasEnter: true, roared: false, orb: null, dir: 1, restT: 1, lost: 0,
        blink: [0, 0, 0], blinkT: [2.2, 3.4, 4.6], tips: null, flCv: null });
      initArms(FX, m, M); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m, C = FX.C; endAll(FX); m.act = 'hover'; m.actT = 0; M.roar = 1; M.recoil = 1; M.menace = 1; M.broodT = 9;
      FX.H.shake(12, 0.6); FX.H.flash(0.25, BURG_HI); FX.H.sfx.crash(); FX.H.sfx.splash(); FX.H.ring(m.x, m.y, 0.5, 10, 1, BURG_HI, 0.45); splash(FX, m.x, m.y, 26);
      [['inkstalker', -1], ['marginworm', 1], ['inkstalker', 1]].forEach(([type, s], k) => { const q = clampSq(C, { x: C.x + s * (4 + k * 2), y: C.y + 8 - k * 3 }, 2.5); FX.minion(type, q.x, q.y); });
      if (lv >= 2) FX.H.banner('THE RISING INK', 'It stains the lecterns\' pages and floods the chamber: break its tether, keep to clean ground', BURG_HI, 3, true); if (lv >= 4) FX.H.banner('The Last Page', 'All of it comes faster', '#FFFFFF', 2.2); },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, C = FX.C, P = FX.S.lv, fast = (1 + (P - 1) * 0.07) * FX.S.fast; m.actT += dt; m.noTouch = true;
      // the rising ink: ink stalkers and margin worms crawl out of the floor while it drifts
      if (P >= 2 && m.act === 'hover' && (M.broodT -= dt) <= 0) { M.broodT = 15; if (brood(FX) < 3) { for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, p = clampSq(C, { x: me.x + Math.cos(a) * 5, y: me.y + Math.sin(a) * 5 }, 2), type = i ? 'marginworm' : 'inkstalker';
            FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 1.1, t: 1.0, dmg: m.dmg * 0.6, col: HOSTILE, fn: s => { FX.H.sfx.splash(); splash(FX, s.x, s.y, 10); if (FX.m && !FX.m.dead) FX.minion(type, s.x, s.y); } }); }
          FX.H.text(me.x, me.y - 2, 'Things crawl out of the ink', BURG_HI, 13); } }
      let altW = ALT, menace = 0, turn = 1.8;
      switch (m.act) {
        case 'hover': {   // it drifts round the pet at a height, its eyes on it; then chooses
          M.orb = (M.orb == null ? Math.atan2(m.y - me.y, m.x - me.x) : M.orb) + dt * 0.26 * fast * M.dir; const R = 6.3 + Math.sin(m.t * 0.45) * 0.8, p = clampSq(C, { x: me.x + Math.cos(M.orb) * R, y: me.y + Math.sin(M.orb) * R }, 2.6);
          drift(FX, m, M, p.x, p.y, 2.5 * fast, dt);
          if (m.actT > (P >= 2 ? 1.2 : 1.6) / FX.S.fast) { m.actT = 0; M.dir = Math.random() < 0.5 ? 1 : -1; choose(FX, m); } break; }
        case 'rest': { drift(FX, m, M, m.x, m.y, 0.5, dt); altW = ALT - 0.2; if (m.actT > M.restT) { m.act = 'hover'; m.actT = 0; } break; }
        case 'inkblot': runInkblot(FX, m, M, dt); menace = 0.7; altW = ALT + 0.35 * (M.rear || 0); break;
        case 'redact': runRedact(FX, m, M, dt); menace = 0.8; altW = ALT + 0.45; break;
        case 'swipe': runSwipe(FX, m, M, dt); menace = 1; altW = ALT - 0.35; turn = 3; break;
        case 'jet': runJet(FX, m, M, dt); menace = 1; altW = ALT + 0.25; turn = 4; break;
        case 'stain': runStain(FX, m, M, dt); menace = M.st && M.st.on ? 0.5 + 0.5 * M.st.fill : 0.6; turn = 2.5; break;
        case 'flood': runFlood(FX, m, M, dt); menace = 1; altW = ALT + 1.2; break;
        default: m.act = 'hover'; m.actT = 0;
      }
      M.menace = toward(M.menace, menace, dt, menace > M.menace ? 5 : 2.2);
      M.alt = toward(M.alt, altW, dt, 2.2);
      // it turns to face the pet (or what it is doing) at a capped rate
      const want = M.faceW != null ? M.faceW : FX.angPet(m.x, m.y); M.th += clamp(angTo(M.th, want), -turn * dt, turn * dt); M.faceW = null;
      FX.parts(bodyParts(FX, m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; M.open = Math.min(1, M.open + dt * 2.4); M.menace = decay(M.menace, dt, 4); m.noTouch = true; M.alt = toward(M.alt, 0.8, dt, 3.5);
      const p = pose(FX, m, M), h = p.W(CEN[0] + 0.2, 0, TOP + HUMP * 0.6); FX.weak('heart', h[0], h[1] - h[2], 1.7, 2.5, m.stunT > 0.05);
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.35; FX.H.part({ kind: 'glow', x: h[0] + FX.rnd(-1, 1), y: h[1] - h[2] - FX.rnd(0, 1), vx: 0, vy: -1.2, life: 0.6, max: 0.6, size: 0.6, color: GOLD_HI }); FX.H.shake(1.2, 0.08); }
      FX.parts(bodyParts(FX, m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, me = FX.me; if (!m) return; M.bt += dt; const stun = m.stunT > 0;
      M.roar = decay(M.roar, dt, 0.8); M.recoil = decay(M.recoil, dt, 2.4); M.armRec = decay(M.armRec, dt, 1.1); M.armHit = decay(M.armHit, dt, 4); if (!stun) M.open = decay(M.open, dt, 0.9);
      if (m.act !== 'jet' && m.act !== 'inkblot') M.rear = decay(M.rear, dt, 2.2);
      M.look = [toward(M.look[0], clamp((me.x - m.x) / 6, -1, 1), dt, 5), toward(M.look[1], clamp((me.y - m.y) / 6, -1, 1), dt, 5)];
      for (let k = 0; k < 3; k++) { M.blinkT[k] -= dt; if (M.blinkT[k] <= 0) { M.blinkT[k] = 2 + Math.random() * 3.5; M.blink[k] = 1; } M.blink[k] = decay(M.blink[k], dt, 6); }
      // the pet's recent steps (where its ink is aimed)
      const tr = M.trail, lq = tr[tr.length - 1]; if (!me.dead && (!lq || Math.hypot(lq.x - me.x, lq.y - me.y) > 1.5)) { tr.push({ x: me.x, y: me.y, t: FX.S.t }); if (tr.length > 12) tr.shift(); }
      updPages(FX, m, M, dt); updArms(FX, m, M, dt);
      M.globs = M.globs.filter(G => (G.t += dt) < G.fly + 0.05 && !G.done);
      if (M.sw) { M.sw.t += dt; if (M.sw.t > M.sw.dur + 0.5) M.sw = null; } if (M.jet) { M.jet.t += dt; if (M.jet.t > M.jet.dur + 0.4) M.jet = null; }
      M.stamps = M.stamps.filter(s => (s.t += dt) < 1.1); M.lies = M.lies.filter(s => (s.t += dt) < 0.7);
      // the tether's exposed arm: a weak point while it holds
      const S = M.st; if (S && S.on && S.reach >= 1 && !stun) { const pts = armPts(FX, m, M, pose(FX, m, M), S.side), q = pts[Math.round(pts.length * 0.62)]; FX.weak('arm', q[0], q[1] - q[2], 1.15, 2.5, true); }
      else if (FX.S.weak.arm) FX.weak('arm', 0, 0, 0, 0, false);
      if (!stun) { if (FX.S.weak.heart) FX.weak('heart', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.recoil = 1; M.roar = 0.6; FX.H.text(m.x, m.y - 4.5, 'The mantle seals', GOLD_HI, 13); FX.H.sfx.hum(); } } else M.wasStun = true;
      // the entrance: down out of the dark, unfurling
      if (m.act === 'enter') { const e = FX.S.enterT || 0; M.wake = clamp((e - 0.2) / 2.2, 0, 1); M.alt = lerp(11, ALT, 1 - Math.pow(1 - M.wake, 3));
        if (e > 2.0 && !M.roared) { M.roared = true; M.roar = 1; M.recoil = 0.6; FX.H.sfx.splash(); FX.H.sfx.crash(); FX.H.shake(9, 0.4); FX.H.ring(m.x, m.y, 0.3, 8, 1, BURG_HI, 0.4); splash(FX, m.x, m.y, 20); } }
      else { M.wake = toward(M.wake, 1, dt, 3); if (M.wasEnter) { M.wasEnter = false; M.recoil = 1; FX.H.sfx.whoosh(); } }
      if ((m.hitSq || 0) > 0.5) M.recoil = Math.max(M.recoil, 0.45); },
    onWeakHit(FX, key, dmg) { const M = FX.mem, m = FX.m; M.recoil = Math.max(M.recoil || 0, 0.5);
      if (key === 'arm' && M.st && M.st.on) { M.armHit = 1; M.st.dmg += dmg; if (M.st.dmg >= M.st.need) tetherBroken(FX, m); } },
    dmgK() { return 1; },
    keep: { steps: 2, pad: 6 },
    draw(c, FX, m, X, Y, T, t, step) { drawVellum(c, FX, m, X, Y, T, t, step); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'lectern') drawLectern(c, FX, p, X, Y, T, t); },
    drawObj() {},
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    drawFx(c, FX, T, t) { drawDrips(c, FX, T, t); drawGlobs(c, FX, T, t); drawSwipeFx(c, FX, T, t); drawJetFx(c, FX, T, t); drawTether(c, FX, T, t); drawCarry(c, FX, T, t); },
  };

  /* ---- choosing ---- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.3 : 1.2, true); }
  function toRest(m, M, t) { m.act = 'rest'; m.actT = 0; M.restT = t; }
  function brood(FX) { return FX.H.mons.filter(q => !q.dead && !q.boss && !q.fobj && (q.type === 'inkstalker' || q.type === 'marginworm')).length; }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv;
    // (a shuffled round of its moves, so none is long missing; never the same twice running)
    if (!M.bag || !M.bag.length) { M.bag = (P >= 2 ? ['inkblot', 'redact', 'swipe', 'jet', 'stain', 'inkblot', 'flood'] : ['inkblot', 'redact', 'swipe', 'jet', 'inkblot']).sort(() => Math.random() - 0.5); if (M.bag[M.bag.length - 1] === M.last) M.bag.unshift(M.bag.pop()); }
    let a = M.bag.pop(); if ((a === 'stain' || a === 'flood') && P < 2) a = 'inkblot';
    const go = { inkblot: startInkblot, redact: startRedact, swipe: startSwipe, jet: startJet, stain: startStain, flood: startFlood }[a]; if (!go) { m.act = 'hover'; m.actT = 0; return; } M.last = a; go(FX, m); }
  function drift(FX, m, M, tx, ty, spd, dt) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d > 0.05) { const v = Math.min(spd, d * 2); m.x += dx / d * v * dt; m.y += dy / d * v * dt; } const q = clampSq(FX.C, m, 2.4); m.x = q.x; m.y = q.y; }
  function endAll(FX) { const M = FX.mem; M.ib = null; M.red = null; M.sw = null; M.swAim = null; M.jet = null; M.jetAim = null; M.globs.length = 0;
    if (M.st) { M.lect[M.st.i].stain = Math.min(M.lect[M.st.i].stain, 0.99); M.st = null; }
    if (M.fl) { if (M.fl.hz) M.fl.hz.life = Math.min(M.fl.hz.life, M.fl.hz.age + 0.3); M.fl = null; } }
  function splash(FX, x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 4; FX.H.part({ kind: 'shard', x, y: y - 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 3, g: 10, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 2.5 + Math.random() * 2.5, rot: Math.random() * 3, vr: 5, color: i % 4 ? '#1D1A28' : '#5A3A8A' }); } }
  function goldBurst(FX, x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; FX.H.part({ kind: 'spark', x, y: y - 0.4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 2, g: 5, life: 0.4 + Math.random() * 0.4, max: 0.8, size: 2 + Math.random() * 1.5, color: i % 3 ? GOLD_HI : '#FFFFFF' }); } }

  /* ---- Inkblot: three globs of ink where the pet has just been, leaving pools ---- */
  function startInkblot(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, now = FX.S.t, picks = [];
    for (let i = M.trail.length - 1; i >= 0 && picks.length < 3; i--) { const q = M.trail[i]; if (now - q.t > 10) break; if (inSq(C, q.x, q.y, 1.2) && picks.every(p => Math.hypot(p[0] - q.x, p[1] - q.y) > 2.6)) picks.push([q.x, q.y]); }
    for (let k = 0; picks.length < 3 && k < 40; k++) { const a = Math.random() * TAU, r = 2.8 + Math.random() * 2.2, p = clampSq(C, { x: me.x + Math.cos(a) * r, y: me.y + Math.sin(a) * r }, 1.6); if (k > 30 || picks.every(q => Math.hypot(q[0] - p.x, q[1] - p.y) > 2.6)) picks.push([p.x, p.y]); }
    M.ib = { t: 0, picks: picks.map(([x, y], k) => ({ x, y, at: 0.45 + k * 0.22, sent: false })) };
    m.act = 'inkblot'; m.actT = 0; M.roar = 0.4; FX.H.sfx.hum();
    say(FX, 'inkblot', 'INKBLOT', 'It spits ink where you have just been: lead its pools away from the lecterns', HOSTILE); }
  function runInkblot(FX, m, M, dt) { const B = M.ib; if (!B) { toRest(m, M, 1); return; } B.t += dt; M.rear = toward(M.rear, B.t < 1.3 ? 1 : 0, dt, 6); drift(FX, m, M, m.x, m.y, 0.5, dt);
    const fly = (FX.S.lv >= 2 ? 1.05 : 1.25) / FX.S.fast;
    B.picks.forEach(q => { if (!q.sent && B.t >= q.at) { q.sent = true; launchGlob(FX, m, M, q.x, q.y, fly); } });
    if (B.t > B.picks[B.picks.length - 1].at + fly + 0.3) { M.ib = null; toRest(m, M, 0.9);
      if (!M.seen.pages) { M.seen.pages = true; FX.H.after(0.6, () => { if (FX.m && !FX.m.dead) FX.H.banner('CLEANSING PAGES', 'Take a lectern\'s page and carry it through the pools · cleanse two beside Vellum to blind it', GOLD_HI, 2.8, true); }); } } }
  function launchGlob(FX, m, M, x, y, fly) { const p = pose(FX, m, M), s = p.W(2.25, 0, -0.5), G = { x0: s[0], y0: s[1], z0: s[2], x, y, t: 0, fly, seed: Math.random() * 9 };
    FX.tele({ shape: 'circle', x, y, r: POOL_R, t: fly, dmg: m.dmg * 1.15, col: HOSTILE, fn: () => { G.done = true; landPool(FX, x, y); } });
    M.globs.push(G); FX.H.sfx.pop(); M.recoil = Math.max(M.recoil, 0.25); }
  function landPool(FX, x, y) { const M = FX.mem, m = FX.m; if (!m || m.dead) return; FX.H.sfx.splash(); FX.H.shake(4, 0.15); splash(FX, x, y, 12); FX.H.ring(x, y, 0.3, POOL_R + 0.4, 0.35, '#3A2A5A', 0.4);
    // (a pool landing on a cleansed patch soaks it again)
    M.patches = M.patches.filter(q => Math.hypot(q.x - x, q.y - y) > q.r * 0.5 + POOL_R * 0.5);
    const pool = { x, y, r: POOL_R, born: FX.S.t, seed: Math.random() * 100 };
    pool.hz = FX.hz({ shape: 'circle', kind: 'inkpool', x, y, r: POOL_R * 0.92, dps: m.dmg * 0.4, tick: 0.35, life: FX.S.lv >= 2 ? 22 : 18, slow: true, col: POOL, safe: () => !!M.carry, draw: (c, z, FX2, T, t) => drawPool(c, FX, pool, z, T, t) });
    M.pools.push(pool); if (M.pools.length > 7) { const o = M.pools.shift(); o.gone = true; o.hz.life = Math.min(o.hz.life, o.hz.age + 0.6); } }

  /* ---- the pages: taken from a lectern, carried through pools to cleanse them ---- */
  function updPages(FX, m, M, dt) { const C = FX.C, me = FX.me;
    M.pools = M.pools.filter(q => !q.gone && FX.S.hz.includes(q.hz) && q.hz.age < q.hz.life - 0.05);
    M.lect.forEach((L, i) => { const p = lectAt(C, i); L.drown = L.st !== 'lost' && M.pools.some(q => Math.hypot(q.x - p[0], q.y - p[1]) < q.r + 0.55);
      if (L.st === 'gone') { L.back -= dt; if (L.back <= 0) { L.st = 'page'; FX.H.ring(p[0], p[1] - 1.2, 0.2, 1.3, 0.4, GOLD_HI, 0.35); FX.H.sfx.chime(); } }
      if (!(M.st && M.st.i === i)) L.stain = L.st === 'lost' ? 1 : decay(L.stain, dt, 0.6);
      L.glow = toward(L.glow, L.st === 'page' && !L.drown ? 1 : 0, dt, 4);
      if (L.st === 'page' && !L.drown && !M.carry && !me.dead && !(M.st && M.st.i === i) && Math.hypot(me.x - p[0], me.y - p[1]) < PICK_R) { L.st = 'out'; M.carry = { i, n: CHARGES, t: 0 }; FX.H.sfx.chime(); FX.H.text(me.x, me.y - 1.8, 'A cleansing page!', GOLD_HI, 14); goldBurst(FX, p[0], p[1] - 1.2, 10);
        if (!M.seen.carry) { M.seen.carry = true; FX.H.banner('CLEANSING PAGE', 'Walk it through ink pools to cleanse them · two in a row inside the gold ring round Vellum blind it', GOLD_HI, 2.6, true); } } });
    const K = M.carry; if (K) { K.t += dt; if (!me.dead) for (const q of M.pools) if (Math.hypot(me.x - q.x, me.y - q.y) < q.r + me.r * 0.3) { cleanse(FX, m, M, q); break; } }
    if ((M.glare.t -= dt) <= 0) M.glare.n = 0;
    M.patches = M.patches.filter(q => (q.t += dt) < q.life); }
  function cleanse(FX, m, M, q) { const K = M.carry, me = FX.me; q.gone = true; q.hz.life = Math.min(q.hz.life, q.hz.age); M.pools = M.pools.filter(x => x !== q);
    M.patches.push({ x: q.x, y: q.y, r: q.r, t: 0, life: FX.S.lv >= 2 ? 26 : 20 });
    K.n--; goldBurst(FX, q.x, q.y, 18); FX.H.ring(q.x, q.y, 0.3, q.r + 0.6, 0.45, GOLD_HI, 0.5); FX.H.sfx.chime(); FX.H.text(q.x, q.y - 1.2, 'CLEANSED!', GOLD_HI, 15);
    const near = !!(m && !m.dead && m.act !== 'enter' && !(m.stunT > 0) && Math.hypot(q.x - m.x, q.y - m.y) < NEAR);
    if (near) { M.glare.n++; M.glare.t = 16; M.recoil = Math.max(M.recoil, 0.6); if (M.glare.n < 2) FX.H.text(m.x, m.y - 5, 'It flinches from the page!', GOLD_HI, 13); } else M.glare.n = 0;
    if (K.n <= 0) { const L = M.lect[K.i]; if (L.st === 'out') { L.st = 'gone'; L.back = 8; } M.carry = null; FX.H.text(me.x, me.y - 2.6, 'The page is spent', PARCH_HI, 12); }
    if (M.glare.n >= 2 && near && FX.S.roarT <= 0) stagger(FX, m, 'glare'); }
  function safeAt(FX, x, y, pad) { const M = FX.mem, C = FX.C; for (let i = 0; i < 4; i++) { if (M.lect[i].st === 'lost') continue; const p = lectAt(C, i); if (Math.hypot(x - p[0], y - p[1]) < DAIS_R + pad) return true; } return M.patches.some(q => Math.hypot(x - q.x, y - q.y) < q.r + pad); }
  function islands(FX) { const M = FX.mem, C = FX.C, out = []; for (let i = 0; i < 4; i++) { if (M.lect[i].st === 'lost') continue; const p = lectAt(C, i); out.push({ x: p[0], y: p[1], r: DAIS_R, dais: true }); } M.patches.forEach(q => out.push({ x: q.x, y: q.y, r: q.r })); return out; }

  /* ---- staggered: blinded by the page, or the tether torn: it drops, the mantle cracks open, the heart bared ---- */
  function stagger(FX, m, why) { const M = FX.mem, P = FX.S.lv; if (!m || m.dead) return; endAll(FX); FX.S.tele.length = 0;
    m.stunT = P >= 2 ? 4.8 : 5.4; m.act = 'rest'; m.actT = 0; M.restT = 1.2; M.recoil = 1; M.open = 0.1; M.glare = { n: 0, t: 0 }; if (why === 'tether') M.armRec = 1;
    FX.H.banner(why === 'glare' ? 'BLINDED' : 'TETHER BROKEN', why === 'glare' ? 'Two pools cleansed beside it: it drops, its mantle cracked open. Strike the heart!' : 'Its arm torn free, it drops, its mantle cracked open. Strike the heart!', GOLD_HI, 2.6, true);
    FX.H.shake(15, 0.6); FX.H.flash(0.3, why === 'glare' ? '#FFF4D0' : BURG_HI); FX.H.sfx.crash(); FX.H.sfx.crack(); goldBurst(FX, m.x, m.y - 2, 26); splash(FX, m.x, m.y, 16); }

  /* ---- Redaction: bands across the floor; solid red ones slam down, violet dashed ones are lies ---- */
  function startRedact(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'redact'; m.actT = 0; M.roar = 0.5; M.red = { waves: P >= 2 ? 2 : 1, wave: 0, cur: null, gap: 0, ori: null }; nextRed(FX, m, M, Math.random() < 0.5 ? 'row' : 'col'); FX.H.sfx.hum();
    say(FX, 'redact', 'REDACTION', 'Solid red bands are real and slam down · violet dashed bands are lies and do nothing', HOSTILE); }
  function nextRed(FX, m, M, ori) { const C = FX.C, P = FX.S.lv, R = M.red, pat = PAT[Math.floor(Math.random() * PAT.length)], flip = Math.random() < 0.5, warn = (P >= 2 ? 1.8 : 2.15) / FX.S.fast, bw = HS * 2 / 6;
    const nS = pat.split('').filter(ch => ch === 'S').length, clearAt = P >= 2 ? -1 : Math.floor(Math.random() * nS), bands = []; let sk = 0;
    for (let k = 0; k < 6; k++) { const ch = pat[flip ? 5 - k : k], o = -HS + bw * (k + 0.5), kind = ch === 'R' ? 'real' : (sk++ === clearAt ? 'clear' : 'lie'), b = { k, kind, ori, o, w: bw };
      if (kind === 'real') b.tele = FX.tele(Object.assign(ori === 'row' ? { x: C.x - HS, y: C.y + o, a: 0 } : { x: C.x + o, y: C.y - HS, a: Math.PI / 2 }, { shape: 'line', len: HS * 2, w: bw - 0.08, t: warn, dmg: m.dmg * 1.5, col: HOSTILE, redact: true, fn: () => stampBand(FX, b) }));
      bands.push(b); }
    R.cur = { ori, bands, t: 0, warn }; R.ori = ori; R.wave++; }
  function runRedact(FX, m, M, dt) { const R = M.red; if (!R) { toRest(m, M, 1); return; } drift(FX, m, M, FX.C.x, FX.C.y - 1.5, 2.2, dt); const W = R.cur;
    if (W) { W.t += dt; if (W.t >= W.warn) { W.bands.forEach(b => { if (b.kind === 'lie') M.lies.push({ b, t: 0 }); }); FX.H.sfx.pop(); R.cur = null; R.gap = 0.6;
        if (!M.seen.lie) { M.seen.lie = true; FX.H.text(FX.me.x, FX.me.y - 2, 'The dashed bands were lies', LIE, 13); } } }
    else { R.gap -= dt; if (R.gap <= 0) { if (R.wave < R.waves) nextRed(FX, m, M, R.ori === 'row' ? 'col' : 'row'); else { M.red = null; toRest(m, M, 1.0); } } } }
  function stampBand(FX, b) { const M = FX.mem; M.stamps.push({ b, t: 0 }); FX.H.sfx.thud(); FX.H.shake(5, 0.2); }
  function bandRect(C, b) { return b.ori === 'row' ? [C.x - HS, C.y + b.o - b.w / 2, HS * 2, b.w] : [C.x + b.o - b.w / 2, C.y - HS, b.w, HS * 2]; }

  /* ---- Tentacle Swipe: an arm sweeps a shown arc ---- */
  function startSwipe(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'swipe'; m.actT = 0; M.swN = P >= 2 ? 2 : 1; M.swDone = 0; queueSwipe(FX, m, (P >= 2 ? 0.9 : 1.1) / FX.S.fast, Math.random() < 0.5 ? 1 : -1); FX.H.sfx.hum();
    say(FX, 'swipe', 'TENTACLE SWIPE', P >= 2 ? 'Its arms sweep the shown arc, then sweep again where you went: get out of the arcs' : 'An arm sweeps the shown arc: step out of it, or behind it', HOSTILE); }
  function queueSwipe(FX, m, wait, dir) { const M = FX.mem, a0 = FX.angPet(m.x, m.y), spread = 1.0, len = 7.4;
    FX.tele({ shape: 'cone', x: m.x, y: m.y, a: a0, len, spread, t: wait, dmg: m.dmg * 1.4, col: HOSTILE, tick: (dt, s2) => { if (!s2.done) { s2.x = m.x; s2.y = m.y; } },
      fn: s2 => { M.sw = { t: 0, a0: s2.a, s: spread, dir, len, x: s2.x, y: s2.y, dur: 0.36, side: dir }; FX.H.sfx.whoosh(); FX.H.shake(6, 0.25); M.recoil = 0.5; M.swDone++; if (M.swDone < M.swN) queueSwipe(FX, m, 0.8 / FX.S.fast, -dir); } });
    M.swAim = { a: a0, dir, side: dir }; }
  function runSwipe(FX, m, M, dt) { drift(FX, m, M, m.x, m.y, 0.5, dt); if (M.swAim) M.faceW = M.swAim.a; if (M.swDone >= M.swN && !(M.sw && M.sw.t < M.sw.dur)) { M.swAim = null; toRest(m, M, 0.9); } }

  /* ---- Ink Jet: it rears and jets ink down a shown line ---- */
  function startJet(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'jet'; m.actT = 0; M.jetN = P >= 2 ? 2 : 1; M.jetDone = 0; queueJet(FX, m, (P >= 2 ? 1.0 : 1.2) / FX.S.fast); FX.H.sfx.hum();
    say(FX, 'jet', 'INK JET', P >= 2 ? 'It jets ink down the shown line, twice: sidestep it' : 'It rears and jets ink down the shown line: sidestep it', HOSTILE); }
  function queueJet(FX, m, wait) { const M = FX.mem, C = FX.C, a = FX.angPet(m.x, m.y), x = m.x + Math.cos(a) * 1.2, y = m.y + Math.sin(a) * 1.2, len = Math.min(20, rayLen(C, x, y, a)), w = 2.1;
    FX.tele({ shape: 'line', x, y, a, len, w, t: wait, dmg: m.dmg * 1.6, col: HOSTILE, fn: s2 => { M.jet = { t: 0, a: s2.a, x: s2.x, y: s2.y, len, w, dur: 0.5 }; FX.H.sfx.crash(); FX.H.sfx.splash(); FX.H.shake(9, 0.3); M.recoil = 0.8; M.jetDone++;
      splash(FX, s2.x + Math.cos(s2.a) * len, s2.y + Math.sin(s2.a) * len, 14); if (M.jetDone < M.jetN) queueJet(FX, m, 0.85 / FX.S.fast); } });
    M.jetAim = a; }
  function runJet(FX, m, M, dt) { drift(FX, m, M, m.x, m.y, 0.4, dt); if (M.jetAim != null) M.faceW = M.jetAim; M.rear = toward(M.rear, M.jet ? 0.3 : 1, dt, 5); if (M.jetDone >= M.jetN && !(M.jet && M.jet.t < M.jet.dur)) { M.jetAim = null; toRest(m, M, 1.0); } }

  /* ---- Staining (from half health): an arm tethers a lectern and stains its page; break the arm to stop it ---- */
  function startStain(FX, m) { const M = FX.mem, C = FX.C, me = FX.me;
    let opts = [0, 1, 2, 3].filter(i => M.lect[i].st !== 'lost' && M.lect[i].st !== 'out'); const withPage = opts.filter(i => M.lect[i].st === 'page'); if (withPage.length) opts = withPage;
    if (!opts.length || M.lost >= 3) { startInkblot(FX, m); return; }
    const dist = i => { const p = lectAt(C, i); return Math.hypot(p[0] - me.x, p[1] - me.y); }; opts.sort((a, b) => dist(b) - dist(a));
    const i = opts[Math.min(1, opts.length - 1)], L = lectAt(C, i), dx = C.x - L[0], dy = C.y - L[1], d = Math.hypot(dx, dy) || 1, side = Math.random() < 0.5 ? 1 : -1;
    M.st = { i, side, t: 0, fill: 0, dur: 10.5 / FX.S.fast, anchor: [L[0] + dx / d * 4.4, L[1] + dy / d * 4.4], on: false, reach: 0, dmg: 0, need: FX.S.barHP * 0.07, arrive: 0, spit: 2.4 };
    m.act = 'stain'; m.actT = 0; M.roar = 0.6; FX.H.sfx.hum();
    say(FX, 'stain', 'STAINING', 'It tethers a lectern and stains its page: strike the exposed arm to break the tether!', BURG_HI); }
  function runStain(FX, m, M, dt) { const S = M.st; if (!S) { toRest(m, M, 1); return; } const C = FX.C, L = lectAt(C, S.i), me = FX.me;
    drift(FX, m, M, S.anchor[0], S.anchor[1], 6, dt); M.faceW = Math.atan2(L[1] - m.y, L[0] - m.x) - S.side * 1.05;
    S.arrive += dt; if (!S.on) { if (Math.hypot(m.x - S.anchor[0], m.y - S.anchor[1]) < 0.6 || S.arrive > 2.2) { S.on = true; FX.H.sfx.whoosh(); FX.H.text(L[0], L[1] - 2.8, 'TETHERED', BURG_HI, 15); } return; }
    S.reach = Math.min(1, S.reach + dt * 2.2); if (S.reach < 1) return;
    S.t += dt; S.fill = clamp(S.t / S.dur, 0, 1); M.lect[S.i].stain = S.fill;
    // (it spits a single glob at the pet now and then while it holds: no pool, a warning to keep moving)
    if ((S.spit -= dt) <= 0) { S.spit = 3.0 / FX.S.fast; const x = me.x + (me.vx || 0) * 0.3, y = me.y + (me.vy || 0) * 0.3, G = { x0: m.x, y0: m.y, z0: M.alt, x, y, t: 0, fly: 1.0 / FX.S.fast, seed: Math.random() * 9, small: true }; M.globs.push(G);
      FX.tele({ shape: 'circle', x, y, r: 1.3, t: G.fly, dmg: m.dmg * 0.9, col: HOSTILE, fn: s => { G.done = true; splash(FX, s.x, s.y, 8); FX.H.sfx.pop(); } }); }
    if (S.fill >= 1) stainDone(FX, m, M); }
  function tetherBroken(FX, m) { const M = FX.mem, S = M.st; if (!m || m.dead || !S) return; const L = lectAt(FX.C, S.i); M.lect[S.i].stain = Math.min(M.lect[S.i].stain, 0.99); M.st = null; FX.weak('arm', 0, 0, 0, 0, false);
    goldBurst(FX, L[0], L[1] - 1.4, 14); splash(FX, L[0], L[1], 10); stagger(FX, m, 'tether'); }
  function stainDone(FX, m, M) { const S = M.st, L = M.lect[S.i], p = lectAt(FX.C, S.i); L.st = 'lost'; L.stain = 1; M.lost++; M.st = null; FX.weak('arm', 0, 0, 0, 0, false);
    m.hp = Math.min(m.maxhp * 0.5, m.hp + FX.S.barHP * 0.8); m.dmg *= 1.08;
    FX.H.banner('THE PAGE IS STAINED', 'It drinks the page: it heals and hits harder · that lectern is lost', HOSTILE, 2.6, true); FX.H.shake(10, 0.4); FX.H.sfx.crash(); splash(FX, p[0], p[1], 22); FX.H.ring(p[0], p[1], 0.3, 3, 0.6, HOSTILE, 0.45);
    M.recoil = 0.6; M.roar = 1; toRest(m, M, 1.2); }

  /* ---- Ink Flood (from half health): the ink rises over the floor; only daises and cleansed patches stay dry ---- */
  function startFlood(FX, m) { const M = FX.mem, warn = 3.6 / FX.S.fast, dur = 6.5, C = FX.C;
    M.fl = { t: 0, warn, dur, spawned: 0, risen: false };
    M.fl.hz = FX.hz({ shape: 'fn', kind: 'flood', test: (x, y) => inSq(C, x, y, -0.6) && !safeAt(FX, x, y, 0.15), x: C.x, y: C.y, dps: m.dmg * 0.85, tick: 0.3, arm: warn, life: warn + dur, slow: true, col: POOL, draw: () => {} });
    m.act = 'flood'; m.actT = 0; M.roar = 1; FX.H.sfx.hum(); FX.H.shake(6, 0.5);
    say(FX, 'flood', 'INK FLOOD', 'The ink rises over the floor: get onto a lectern\'s dais or a cleansed patch! Things crawl out of it', HOSTILE); }
  function runFlood(FX, m, M, dt) { const F = M.fl; if (!F) { toRest(m, M, 1); return; } F.t += dt; drift(FX, m, M, FX.C.x, FX.C.y - 0.5, 3, dt);
    const lt = F.t - F.warn; if (lt >= 0 && !F.risen) { F.risen = true; FX.H.sfx.splash(); FX.H.sfx.crash(); FX.H.shake(10, 0.4); M.recoil = 0.8; }
    while (F.spawned < HORDE.length && lt >= HORDE[F.spawned][0]) { spawnFromInk(FX, m, HORDE[F.spawned][1]); F.spawned++; }
    if (F.t > F.warn + F.dur + 0.9) { M.fl = null; toRest(m, M, 1.4); } }
  function spawnFromInk(FX, m, type) { const C = FX.C, me = FX.me; if (brood(FX) >= 6) return;
    for (let k = 0; k < 30; k++) { const a = Math.random() * TAU, r = 4.5 + Math.random() * 4, x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r; if (!inSq(C, x, y, 1.5) || safeAt(FX, x, y, 0.8)) continue;
      FX.tele({ shape: 'circle', x, y, r: 1.0, t: 0.7, dmg: m.dmg * 0.5, col: HOSTILE, fn: s => { FX.H.sfx.splash(); splash(FX, s.x, s.y, 12); if (FX.m && !FX.m.dead) FX.minion(type, s.x, s.y); } }); return; } }

  /* ---- the body: its pose and frame, the arms, the tentacles ---- */
  function pose(FX, m, M) { const bt = M.bt || 0, op = M.open || 0, rc = M.recoil || 0, wk = M.wake == null ? 1 : M.wake, hs = m.hitSq || 0;
    const z = (M.alt == null ? ALT : M.alt) + Math.sin(bt * 1.3) * 0.12 * (1 - op) - rc * 0.22;
    const S = lerp(0.6, 1, wk) * (1 + (M.roar || 0) * 0.04 + hs * 0.03), th = M.th == null ? Math.PI / 2 : M.th;
    const pitch = -rc * 0.12 + (M.rear || 0) * 0.2 + op * 0.05, roll = op * 0.12 * Math.sin(bt * 0.8) + Math.sin(bt * 0.6) * 0.03;
    const W = RiftFiend.frame({ x: m.x + rc * 0.08 * Math.sin(bt * 31), y: m.y }, th, { z, pitch, roll, scale: S });
    return { W, z, S, th, bt, op }; }
  function armTarget(FX, m, M, p, s) { const bt = p.bt, C = FX.C, stun = m.stunT > 0;
    const S = M.st; if (S && S.on && S.side === s && !stun) { const L = lectAt(C, S.i), k = S.reach, d = at(p, 1.0, s * 4.2, p.z - 1.2); return [lerp(d[0], L[0], k), lerp(d[1], L[1] - 0.1, k), lerp(d[2], LECT_Z + 0.25, k)]; }
    const W = M.sw; if (W && W.side === s && W.t < W.dur + 0.12) { const u = clamp(W.t / W.dur, 0, 1), a = W.a0 - W.dir * W.s + 2 * W.dir * W.s * u; return [m.x + Math.cos(a) * W.len * 0.9, m.y + Math.sin(a) * W.len * 0.9, 0.5]; }
    if (M.swAim && M.swAim.side === s && m.act === 'swipe') { const a = M.swAim.a - M.swAim.dir * 1.7; return [m.x + Math.cos(a) * 4.6, m.y + Math.sin(a) * 4.6, p.z + 0.5]; }
    if (stun) return at(p, 1.1 - 0.3 * s, s * 4.3, 0.12);
    if (m.act === 'flood' && M.fl) return at(p, 0.4, s * (3.9 + 0.3 * Math.sin(bt * 2 + s)), p.z + 1.4 + 0.3 * Math.sin(bt * 2.6 + s));
    if ((M.rear || 0) > 0.35) return at(p, -0.6, s * 3.5, p.z - 0.3);
    return at(p, 1.0 + 0.35 * Math.sin(bt * 0.9 + s), s * (4.4 + 0.25 * Math.sin(bt * 0.7 + s * 2)), p.z - 1.25 + 0.28 * Math.sin(bt * 1.1 + s)); }
  function initArms(FX, m, M) { const p = pose(FX, m, M); M.tips = ARM_S.map(s => armTarget(FX, m, M, p, s)); }
  function updArms(FX, m, M, dt) { if (!M.tips) initArms(FX, m, M); const p = pose(FX, m, M);
    ARM_S.forEach((s, k) => { const tg = armTarget(FX, m, M, p, s), q = M.tips[k], swing = M.sw && M.sw.side === s && M.sw.t < M.sw.dur + 0.12, rate = swing ? 30 : M.st && M.st.side === s ? 9 : m.act === 'enter' ? 20 : 4.5; for (let j = 0; j < 3; j++) q[j] = toward(q[j], tg[j], dt, rate); }); }
  /* an arm: from its root at the side of the head, bowed out and up, to its tip (dragging behind the body's turns) */
  function armPts(FX, m, M, p, s) { const k = ARM_S.indexOf(s), tip = M.tips ? M.tips[k] : armTarget(FX, m, M, p, s), root = p.W(1.45, s * 1.12, -0.26), bt = p.bt, teth = M.st && M.st.on && M.st.side === s;
    const mid = p.W(1.85, s * 2.5, -0.05), c0 = [(root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2, (root[2] + tip[2]) / 2 + (teth ? 1.3 : 0.7)], ctrl = [lerp(c0[0], mid[0], 0.45), lerp(c0[1], mid[1], 0.45), lerp(c0[2], mid[2], 0.3)];
    const dx = tip[0] - root[0], dy = tip[1] - root[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, out = [], N = 14, rec = (M.armRec || 0) * s;
    for (let i = 0; i <= N; i++) { const u = i / N, a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u, w = Math.sin(Math.PI * u) * (0.16 * Math.sin(bt * 2.3 + i * 0.7 + s) + rec * 0.6 * Math.sin(bt * 9 + i));
      out.push([a * root[0] + b * ctrl[0] + c * tip[0] + nx * w, a * root[1] + b * ctrl[1] + c * tip[1] + ny * w, a * root[2] + b * ctrl[2] + c * tip[2]]); }
    // (tethered, the tip coils once round the lectern's desk)
    if (teth && M.st.reach > 0.9) { const L2 = lectAt(FX.C, M.st.i); for (let j = 1; j <= 6; j++) { const a = Math.atan2(root[1] - L2[1], root[0] - L2[0]) + j / 6 * TAU * 0.85 * s; out.push([L2[0] + Math.cos(a) * 0.62, L2[1] + Math.sin(a) * 0.32, LECT_Z + 0.1 - j * 0.04]); } }
    return out; }
  function tentPts(m, M, p, k) { const v0 = TENT_V[k], bt = p.bt, out = [], stun = m.stunT > 0, jet = (M.rear || 0) > 0.35 ? 1 : 0;
    for (let i = 0; i <= 6; i++) { const s = i / 6, sw = Math.sin(bt * 1.7 + k * 1.3 + s * 3) * 0.14 * s, curl = Math.sin(bt * 1.1 + k * 2) * 0.5 + 0.5;
      if (stun) { out.push(at(p, 2.35 + 1.4 * s, v0 * (1 + 0.9 * s) + sw, Math.max(0.08, p.z - 0.4 - s * 1.6))); continue; }
      out.push(p.W(2.3 + 1.0 * s - 0.75 * s * s * s * (0.5 + curl), v0 * (1 + 0.45 * s + jet * 0.5 * s) + sw, -0.42 - 1.05 * s + 0.85 * s * s * s * (0.5 + curl))); }
    return out; }
  function bodyParts(FX, m, M) { const p = pose(FX, m, M); return [hit('mantle', p.W(-0.5, 0, TOP + 0.3), 2.0, m), hit('head', p.W(1.95, 0, 0), 1.3, m), hit('tail', p.W(-2.2, 0, TOP), 1.1, m)]; }

  /* ---- painting Vellum ---- */
  function drawVellum(c, FX, m, X, Y, T, t, step) {
    const M = FX.mem; if (!M.tips) initArms(FX, m, M);
    const P3 = TN.cam(X, Y, T, m), p = pose(FX, m, M), lw = Math.max(1.3, T * 0.065), go = i => step == null || step === i, D = RiftFiend.depth;
    const blocks = [{ d: D(p.W(-0.5, 0, 0)), man: true, f: () => paintMantle(c, FX, m, M, p, P3, T, lw, t) }, { d: D(p.W(1.95, 0, 0)), f: () => paintHead(c, FX, m, M, p, P3, T, lw) }, { d: D(p.W(2.75, 0, -0.9)), f: () => paintTentacles(c, m, M, p, P3, T, lw) }].sort((a, b) => a.d - b.d), mi = blocks.findIndex(b => b.man);
    if (go(0)) {
      // its shadow on the boards
      const g0 = P3(m.x, m.y, 0), k = 1 / (1 + p.z * 0.1); FX.K.shade(c, g0[0], g0[1], T * 3.3 * k * p.S, T * 1.75 * k * p.S, 0.5, '#1A0E18');
      ARM_S.forEach(s => paintArm(c, FX, m, M, p, P3, T, lw, s));
      blocks.slice(0, mi).forEach(b => b.f()); }
    if (go(1)) blocks.slice(mi).forEach(b => b.f()); }
  /* the mantle: a cream belly under it, the fin rippling round its edge, the black enamel dome of the nib on top */
  function paintMantle(c, FX, m, M, p, P3, T, lw, t) { const W = p.W, S = p.S, bt = p.bt, op = p.op;
    const rim = CONTOUR.map(([u, v]) => P3(...W(u, v, TOP)));
    const belly = CONTOUR.map(([u, v]) => P3(...W(CEN[0] + (u - CEN[0]) * 0.84, v * 0.84, BELLY)));
    TN.shape(c, TN.poly(hull(rim.concat(belly))), { col: CREAM, shade: CREAM_SH, hi: CREAM_HI, line: LINE, lw, r: T * 2.2 * S, d1: 0.05, d2: 0.1, spec: false, force: true,
      inner: g => { // the belly's soft folds and a wash of ink near the rim
        g.strokeStyle = 'rgba(120,90,60,.35)'; g.lineWidth = Math.max(1, T * 0.04); for (let j = 0; j < 3; j++) { g.beginPath(); CONTOUR.forEach(([u, v], i) => { const q = P3(...W(CEN[0] + (u - CEN[0]) * (0.95 - j * 0.04), v * (0.95 - j * 0.04), TOP - 0.18 - j * 0.1)); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); g.stroke(); } } });
    // the fin: a thin burgundy ribbon all round the sides and the point, rippling in a slow wave
    const fi = [], fo = []; FIN_IDX.forEach((i, j) => { const [u, v] = CONTOUR[i], n = NRM[i], ph = bt * 2.3 - j * 0.42, w = 0.5 + 0.08 * Math.sin(bt * 1.7 - j * 0.3), h = TOP - 0.12 + 0.17 * Math.sin(ph); fi.push(P3(...W(u - n[0] * 0.08, v - n[1] * 0.08, TOP - 0.1))); fo.push(P3(...W(u + n[0] * w, v + n[1] * w, h))); });
    TN.shape(c, TN.poly(fi.concat(fo.slice().reverse())), { col: FIN, shade: FIN_SH, hi: FIN_HI, line: LINE, lw: lw * 0.8, r: T * 0.5, d1: 0.2, d2: 0.35, spec: false, force: true, alpha: 0.95,
      inner: g => { g.strokeStyle = 'rgba(255,214,234,.35)'; g.lineWidth = Math.max(1, T * 0.03); g.beginPath(); for (let j = 1; j < fi.length - 1; j += 2) { g.moveTo(fi[j][0], fi[j][1]); g.lineTo(fo[j][0], fo[j][1]); } g.stroke();
        g.strokeStyle = 'rgba(255,220,236,.7)'; g.lineWidth = Math.max(1, T * 0.035); g.beginPath(); fo.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); } });
    // the dome of the nib
    const inner = CONTOUR.map(([u, v]) => { const uu = CEN[0] + (u - CEN[0]) * 0.6, vv = v * 0.6; return P3(...W(uu, vv, TOP + surfH(uu, vv))); }), top = P3(...W(CEN[0], 0, TOP + HUMP));
    const sp = (u, v) => P3(...W(u, v, TOP + surfH(u, v) + 0.01));
    TN.shape(c, TN.poly(hull(rim.concat(inner, [top]))), { col: MAN, shade: MAN_SH, hi: MAN_HI, line: LINE, lw: lw * 1.1, r: T * 2.4 * S, d1: 0.07, d2: 0.15, spec: 0.55, specAt: sp(0.5, 1.0), specR: 0.2, force: true,
      inner: g => { g.lineCap = 'round'; g.lineJoin = 'round';
        // a gold trim set in from the edge, all round the sides and the point
        g.strokeStyle = GOLD; g.lineWidth = Math.max(1.2, T * 0.065); g.beginPath(); let on = false; CONTOUR.forEach(([u, v]) => { if (u > 1.25) { on = false; return; } const k = 0.86, q = sp(CEN[0] + (u - CEN[0]) * k, v * k); if (!on) { g.moveTo(q[0], q[1]); on = true; } else g.lineTo(q[0], q[1]); }); g.stroke();
        // the shoulders' scrollwork
        g.lineWidth = Math.max(1, T * 0.045); for (const s of [1, -1]) { g.beginPath(); [[1.05, 1.55], [0.55, 1.5], [-0.2, 1.22], [-0.9, 0.82], [-1.45, 0.42]].forEach(([u, v], i) => { const q = sp(u, s * v); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke();
          g.beginPath(); for (let j = 0; j <= 10; j++) { const a = j / 10 * TAU * 0.85, r = 0.28 - j * 0.018, q = sp(0.82 + Math.cos(a) * r, s * (1.18 + Math.sin(a) * r)); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.stroke(); }
        // the slit, from the breather hole back to the point
        const a0 = sp(-0.68, 0), a1 = P3(...W(-2.88, 0, TOP + 0.02)); g.strokeStyle = GOLD_HI; g.lineWidth = Math.max(2, T * 0.11); g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(a1[0], a1[1]); g.stroke(); g.strokeStyle = '#05040A'; g.lineWidth = Math.max(1, T * 0.04); g.stroke();
        // the breather hole: a gold ring round a dark heart-shaped eye
        const ring = (r, hOff) => { g.beginPath(); for (let j = 0; j <= 18; j++) { const a = j / 18 * TAU, q = sp(-0.42 + Math.cos(a) * r, Math.sin(a) * r * 1.1); j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } g.closePath(); };
        ring(0.34); g.fillStyle = GOLD; g.fill(); g.strokeStyle = LINE; g.lineWidth = Math.max(1, lw * 0.6); g.stroke(); ring(0.24); g.fillStyle = GOLD_HI; g.fill(); ring(0.16); g.fillStyle = '#07050C'; g.fill();
        // a wet sheen down the lit side
        g.strokeStyle = 'rgba(255,255,255,.13)'; g.lineWidth = Math.max(2, T * 0.14); g.beginPath(); [[0.8, 1.6], [0, 1.75], [-0.9, 1.45], [-1.7, 0.85]].forEach(([u, v], i) => { const q = sp(u, v); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.stroke();
        // cracked open: the slit parts along its length, the gold-white heart showing through
        if (op > 0.02) { const L = [], R = []; for (let j = 0; j <= 12; j++) { const s = j / 12, u = lerp(1.0, -2.75, s), w = op * 0.5 * Math.pow(Math.sin(Math.PI * s), 0.7) * (1 + 0.1 * Math.sin(bt * 9 + j)); L.push(sp(u, w)); R.push(sp(u, -w)); }
          const pg = L.concat(R.reverse()), cq = sp(-0.8, 0); g.fillStyle = '#2A1408'; g.beginPath(); pg.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill();
          g.save(); g.clip(); const gr = g.createRadialGradient(cq[0], cq[1], 0, cq[0], cq[1], T * 2.2); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.35, GOLD_HI); gr.addColorStop(1, '#8A5A1A'); g.fillStyle = gr; g.globalAlpha = 0.6 + 0.4 * Math.sin(bt * 7) * 0.5 + 0.2; g.fillRect(cq[0] - T * 3, cq[1] - T * 3, T * 6, T * 6); g.restore();
          g.strokeStyle = LINE; g.lineWidth = Math.max(1.5, lw); g.beginPath(); pg.forEach((q, j) => j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke(); } } });
    if (op > 0.02) { const q = sp(-0.8, 0); FX.K.glow(c, q[0], q[1], T * 3 * op, GOLD_HI, 0.55 * op); }
    // ink hanging in drips from the south edge of the belly
    const dr = []; for (let i = 2; i < NC; i += 5) { const n = NRM[i], ny = Math.sin(p.th) * n[0] + Math.cos(p.th) * n[1]; if (ny > 0.3) dr.push(belly[i]); }
    dr.forEach((q, i) => { const w = T * 0.1 * S, L = T * S * (0.16 + 0.2 * (Math.sin(t * 1.3 + i * 2.1) + 1) / 2), x = q[0], y = q[1] - T * 0.05; c.fillStyle = '#1A1424'; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.8, y + L * 0.6, x - w * 0.85, y + L); c.arc(x, y + L, w * 0.85, Math.PI, 0, true); c.quadraticCurveTo(x + w * 0.8, y + L * 0.6, x + w, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(205,180,255,.55)'; c.beginPath(); c.arc(x - w * 0.3, y + L - w * 0.2, w * 0.25, 0, TAU); c.fill(); }); }
  /* the head: a cream chin under a black cap, three gold eyes in a row on top */
  function paintHead(c, FX, m, M, p, P3, T, lw) { const S = p.S;
    TN.ellipsoid(c, P3, p.th, p.W(1.98, 0, -0.14), [1.02 * S, 1.48 * S, 0.56 * S], { T, col: CREAM, shade: CREAM_SH, hi: CREAM_HI, line: LINE, lw, d1: 0.06, d2: 0.14, spec: false, force: true });
    TN.ellipsoid(c, P3, p.th, p.W(1.86, 0, 0.06), [0.96 * S, 1.42 * S, 0.46 * S], { T, col: MAN, shade: MAN_SH, hi: MAN_HI, line: LINE, lw, d1: 0.07, d2: 0.16, spec: 0.4, force: true });
    // a gold collar where the head meets the mantle
    c.strokeStyle = GOLD; c.lineWidth = Math.max(1.5, T * 0.07); c.lineCap = 'round'; c.beginPath(); for (let j = 0; j <= 12; j++) { const v = lerp(-1.15, 1.15, j / 12), q = P3(...p.W(1.38 + 0.25 * (v / 1.15) ** 2, v, 0.3 - 0.12 * (v / 1.15) ** 2)); j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
    const me = FX.me, stun = m.stunT > 0, mn = M.menace || 0;
    [-0.76, 0, 0.76].forEach((v, k) => { const w = p.W(2.26, v, 0.4 - Math.abs(v) * 0.1), q = P3(...w), dx = me.x - w[0], dy = me.y - w[1], dl = Math.hypot(dx, dy) || 1;
      const look = stun ? [Math.cos(p.bt * 5 + k * 2) * 0.6, Math.sin(p.bt * 5 + k * 2) * 0.6] : [dx / dl * Math.min(1, dl / 3), dy / dl * Math.min(1, dl / 3)];
      paintEye(c, q[0], q[1], T * 0.33 * S, look, Math.max(M.blink[k] || 0, 1 - (M.wake == null ? 1 : M.wake)), mn, stun); }); }
  function paintEye(c, x, y, r, look, blink, mn, stun) { c.save(); c.translate(x, y);
    c.fillStyle = '#0E0B14'; c.beginPath(); c.ellipse(0, 0, r * 1.3, r * 1.02, 0, 0, TAU); c.fill();
    const ry = r * 0.82 * (1 - mn * 0.18); c.save(); c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.clip();
    const g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r); g.addColorStop(0, '#FFF3C4'); g.addColorStop(0.45, '#EBC35A'); g.addColorStop(1, '#94661E'); c.fillStyle = g; c.fillRect(-r, -r, r * 2, r * 2);
    const lx = look[0] * r * 0.32, ly = look[1] * ry * 0.3;
    if (stun) { c.fillStyle = '#120A08'; c.beginPath(); c.arc(lx, ly, r * 0.18, 0, TAU); c.fill(); }
    else { const k = 0.85 + mn * 0.12; c.fillStyle = '#140A06'; c.beginPath(); c.moveTo(lx - r * 0.66 * k, ly - r * 0.26); c.quadraticCurveTo(lx, ly - r * 0.02, lx + r * 0.66 * k, ly - r * 0.26); c.quadraticCurveTo(lx + r * 0.64 * k, ly + r * 0.36, lx + r * 0.33 * k, ly + r * 0.36); c.quadraticCurveTo(lx + r * 0.08, ly + r * 0.34, lx, ly + r * 0.1); c.quadraticCurveTo(lx - r * 0.08, ly + r * 0.34, lx - r * 0.33 * k, ly + r * 0.36); c.quadraticCurveTo(lx - r * 0.64 * k, ly + r * 0.36, lx - r * 0.66 * k, ly - r * 0.26); c.closePath(); c.fill(); }
    c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.ellipse(-r * 0.38, -r * 0.38, r * 0.2, r * 0.13, -0.5, 0, TAU); c.fill();
    if (blink > 0.02) { c.fillStyle = '#2A2636'; c.fillRect(-r, -ry - 1, r * 2, ry * 2 * blink + 1); }
    c.restore();
    c.strokeStyle = LINE; c.lineWidth = Math.max(1.2, r * 0.14); c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.stroke();
    c.strokeStyle = GOLD; c.lineWidth = Math.max(1, r * 0.12); c.beginPath(); c.ellipse(0, 0, r * 1.14, ry * 1.14, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.restore(); }
  function paintTentacles(c, m, M, p, P3, T, lw) { const order = [0, 3, 1, 2];
    order.forEach(k => { const pts = tentPts(m, M, p, k).map(q => P3(...q)), wf = u => T * p.S * (0.44 - 0.3 * u);
      TN.tubeLite(c, pts, wf, { col: TEN, shade: TEN_SH, hi: TEN_HI, line: LINE, lw: lw * 0.85, d1: 0.16, d2: 0.3 });
      TN.suckers(c, pts, wf, { n: 4, cup: '#EAD3C0', ring: '#3A1A30', u0: 0.3, u1: 0.85 }); }); }
  function paintArm(c, FX, m, M, p, P3, T, lw, s) { const pts = armPts(FX, m, M, p, s).map(q => P3(...q)), n = pts.length, N = 14, tk = M.st && M.st.on && M.st.side === s ? 1.3 : 1, wf = u => T * armW(Math.min(1, u * (n - 1) / N), p.S) * tk;
    TN.tubeLite(c, pts, wf, { col: ARM, shade: ARM_SH, hi: ARM_HI, line: LINE, lw: lw * 0.9, d1: 0.14, d2: 0.28 });
    TN.suckers(c, pts.slice(0, N + 1), u => T * armW(u, p.S) * tk, { n: 9, cup: '#F2DCC4', ring: '#4A1A34', u0: 0.5, u1: 0.95 }); }

  /* ---- live things over the scene ---- */
  // ink dripping off its rim and splashing on the boards
  function drawDrips(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || m.dead || !M.tips || m.act === 'enter') return; const p = pose(FX, m, M), W = p.W;
    c.save(); let n = 0;
    for (let i = 3; i < NC && n < 5; i += 7) { const nr = NRM[i], ny = Math.sin(p.th) * nr[0] + Math.cos(p.th) * nr[1]; if (ny < 0.15) continue; n++;
      const [u, v] = CONTOUR[i], src = W(CEN[0] + (u - CEN[0]) * 0.86, v * 0.86, BELLY), ph = (t * 0.45 + hr(i)) % 1, X = FX.sx(src[0]), Yg = FX.sy(src[1]);
      if (ph < 0.75) { const k = ph / 0.75, z = src[2] * (1 - k * k), Y = Yg - z * T, r = T * 0.09; c.fillStyle = '#17111F'; c.beginPath(); c.moveTo(X, Y - r * 2.2); c.quadraticCurveTo(X + r, Y - r * 0.2, X, Y + r); c.quadraticCurveTo(X - r, Y - r * 0.2, X, Y - r * 2.2); c.fill(); c.fillStyle = 'rgba(205,180,255,.6)'; c.beginPath(); c.arc(X - r * 0.3, Y - r * 0.3, r * 0.25, 0, TAU); c.fill(); }
      else { const k = (ph - 0.75) / 0.25; c.globalAlpha = 1 - k; c.strokeStyle = '#17111F'; c.lineWidth = 2; c.beginPath(); c.ellipse(X, Yg, T * (0.15 + k * 0.5), T * (0.06 + k * 0.2), 0, 0, TAU); c.stroke(); c.globalAlpha = 1; } }
    c.restore(); }
  // the globs of ink in flight
  function drawGlobs(c, FX, T, t) { const M = FX.mem; if (!M.globs || !M.globs.length) return; c.save();
    M.globs.forEach(G => { const u = clamp(G.t / G.fly, 0, 1), x = lerp(G.x0, G.x, u), y = lerp(G.y0, G.y, u), z = lerp(G.z0, 0.2, u) + Math.sin(Math.PI * u) * (G.small ? 2.5 : 3.6), X = FX.sx(x), Y = FX.sy(y) - z * T, r = T * (G.small ? 0.28 : 0.42) * (0.8 + 0.2 * Math.sin(t * 20 + G.seed));
      for (let j = 1; j <= 3; j++) { const u2 = Math.max(0, u - j * 0.05), x2 = lerp(G.x0, G.x, u2), y2 = lerp(G.y0, G.y, u2), z2 = lerp(G.z0, 0.2, u2) + Math.sin(Math.PI * u2) * (G.small ? 2.5 : 3.6); c.fillStyle = 'rgba(23,17,31,' + (0.5 - j * 0.12) + ')'; c.beginPath(); c.arc(FX.sx(x2), FX.sy(y2) - z2 * T, r * (1 - j * 0.2), 0, TAU); c.fill(); }
      c.fillStyle = '#17111F'; c.strokeStyle = LINE; c.lineWidth = 2; c.beginPath(); c.ellipse(X, Y, r, r * 0.9, t * 3, 0, TAU); c.fill(); c.stroke(); c.fillStyle = 'rgba(205,180,255,.7)'; c.beginPath(); c.arc(X - r * 0.35, Y - r * 0.35, r * 0.25, 0, TAU); c.fill(); });
    c.restore(); }
  // the swipe: a swoosh of ink round the arc behind the arm
  function drawSwipeFx(c, FX, T, t) { const L = FX.mem.sw; if (!L) return; const u = clamp(L.t / L.dur, 0, 1), fade = L.t > L.dur ? 1 - (L.t - L.dur) / 0.5 : 1; if (fade <= 0) return;
    const a0 = L.a0 - L.dir * L.s, a1 = a0 + 2 * L.dir * L.s * u, X = FX.sx(L.x), Y = FX.sy(L.y) - 0.4 * T; c.save(); c.lineCap = 'round';
    for (const [rr, w, col, al] of [[L.len * 0.86, 1.2, '#1D1A28', 0.7], [L.len * 0.86, 0.5, BURG_HI, 0.95], [L.len * 0.86, 0.14, '#FFE6F0', 0.8], [L.len * 0.6, 0.6, '#1D1A28', 0.45]]) { c.globalAlpha = al * fade; c.strokeStyle = col; c.lineWidth = T * w; c.beginPath(); const n = 18; for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n), x = X + Math.cos(a) * rr * T, y = Y + Math.sin(a) * rr * T; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); }
    c.restore(); }
  // the jet: a thick stream of ink from under its head down the line
  function drawJetFx(c, FX, T, t) { const M = FX.mem, J = M.jet, m = FX.m; if (!J || !m) return; const u = clamp(J.t / J.dur, 0, 1), fade = J.t > J.dur ? 1 - (J.t - J.dur) / 0.4 : 1; if (fade <= 0) return;
    const p = pose(FX, m, M), s = p.W(2.3, 0, -0.55), ex = J.x + Math.cos(J.a) * J.len, ey = J.y + Math.sin(J.a) * J.len, X0 = FX.sx(s[0]), Y0 = FX.sy(s[1]) - s[2] * T, X1 = FX.sx(ex), Y1 = FX.sy(ey) - 0.2 * T, reach = Math.min(1, u * 3);
    const XE = lerp(X0, X1, reach), YE = lerp(Y0, Y1, reach); c.save(); c.lineCap = 'round'; c.globalAlpha = fade;
    c.strokeStyle = '#120D1A'; c.lineWidth = J.w * T * 0.75 * (0.8 + 0.2 * Math.sin(t * 40)); c.beginPath(); c.moveTo(X0, Y0); c.lineTo(XE, YE); c.stroke();
    c.strokeStyle = 'rgba(138,91,208,.55)'; c.lineWidth = J.w * T * 0.22; c.beginPath(); c.moveTo(X0, Y0 - T * 0.1); c.lineTo(XE, YE - T * 0.1); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = Math.max(1.5, T * 0.06); c.setLineDash([T * 0.6, T * 0.5]); c.lineDashOffset = -t * T * 30; c.beginPath(); c.moveTo(X0, Y0 - T * 0.15); c.lineTo(XE, YE - T * 0.15); c.stroke(); c.setLineDash([]);
    c.restore(); }
  // the tether: the exposed arm glowing, the stain bar over the lectern, its label (and an arrow at the edge when it is off screen)
  function drawTether(c, FX, T, t) { const M = FX.mem, S = M.st, m = FX.m; if (!S || !m || !S.on) return; const C = FX.C, L = lectAt(C, S.i), X = FX.sx(L[0]), Y = FX.sy(L[1]);
    c.save();
    if (S.reach >= 1) { const pts = armPts(FX, m, M, pose(FX, m, M), S.side), a = Math.round(pts.length * 0.48), b = Math.round(pts.length * 0.76), pul = 0.6 + 0.4 * Math.sin(t * 9);
      c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); for (let i = a; i <= b; i++) { const q = pts[i], x = FX.sx(q[0]), y = FX.sy(q[1]) - q[2] * T; i === a ? c.moveTo(x, y) : c.lineTo(x, y); }
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.2 * pul + M.armHit * 0.4; c.strokeStyle = GOLD; c.lineWidth = T * 0.95; c.stroke(); c.globalCompositeOperation = 'source-over';
      c.globalAlpha = 0.95; c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.1); c.setLineDash([T * 0.3, T * 0.22]); c.lineDashOffset = -t * T * 3; c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
      const mq = pts[Math.round((a + b) / 2)]; label(c, 'WEAK', FX.sx(mq[0]), FX.sy(mq[1]) - mq[2] * T - T * 0.75, Math.round(T * 0.42), GOLD_HI, 0.7 + 0.3 * pul); }
    const below = m.y < L[1], bw = T * 3.2, bh = Math.max(8, T * 0.32), bx = X - bw / 2, by = below ? Y + T * 1.55 : Y - T * 2.8, f = S.fill;
    c.fillStyle = 'rgba(0,0,0,.6)'; c.fillRect(bx - 2, by - 2, bw + 4, bh + 4); c.fillStyle = PARCH_HI; c.fillRect(bx, by, bw, bh); c.fillStyle = mixC('#3A2050', '#0A0710', f); c.fillRect(bx, by, bw * f, bh); c.strokeStyle = GOLD; c.lineWidth = 1.5; c.strokeRect(bx, by, bw, bh);
    const dk = S.dmg / S.need; if (dk > 0) { c.fillStyle = GOLD_HI; c.fillRect(bx, by + bh + 3, bw * clamp(dk, 0, 1), 3); }
    const blink = 0.75 + 0.25 * Math.sin(t * (6 + f * 12)); const ly0 = below ? by + bh + T * 0.5 : by - T * 0.95, ly1 = below ? by + bh + T * 1.05 : by - T * 0.38; label(c, 'STAINING', X, ly0, Math.round(T * 0.56), mixC(HOSTILE, '#FFFFFF', 0.25), blink); label(c, 'hit its arm!', X, ly1, Math.round(T * 0.42), '#FFFFFF', 0.95);
    const Wd = FX.H.W(), Hd = FX.H.H(), mg = 34; if (X < mg || X > Wd - mg || by < 90 || by > Hd - 90) { const ex = clamp(X, mg, Wd - mg), ey = clamp(by, 110, Hd - 110), a = Math.atan2(by - ey, X - ex); c.save(); c.translate(ex, ey); c.rotate(a); c.fillStyle = BURG_HI; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 3; c.beginPath(); c.moveTo(16, 0); c.lineTo(-8, -11); c.lineTo(-3, 0); c.lineTo(-8, 11); c.closePath(); c.stroke(); c.fill(); c.restore(); label(c, 'STAINING', clamp(ex - Math.cos(a) * 46, 60, Wd - 60), ey - Math.sin(a) * 20 + 18, 11, BURG_HI, blink); }
    c.restore(); }
  // the page the pet carries, bobbing over its head, and the count of near cleanses over Vellum
  function drawCarry(c, FX, T, t) { const M = FX.mem, K = M.carry, me = FX.me, m = FX.m; c.save();
    if (K && !me.dead) { const X = FX.sx(me.x), Y = FX.sy(me.y) - T * 2.1 + Math.sin(t * 3) * T * 0.08; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(GOLD), X - T * 1.3, Y - T * 1.3, T * 2.6, T * 2.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      pageIcon(c, X, Y, T * 0.85, Math.sin(t * 2) * 0.12, 1);
      const py = Y + T * 0.62; c.fillStyle = 'rgba(20,12,24,.75)'; c.beginPath(); c.ellipse(X, py, T * 0.42, T * 0.17, 0, 0, TAU); c.fill(); for (let j = 0; j < CHARGES; j++) { const px = X - T * 0.19 + j * T * 0.38; c.fillStyle = j < K.n ? GOLD_HI : 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(px, py, T * 0.1, 0, TAU); c.fill(); } }
    if (m && !m.dead && m.act !== 'enter' && !(m.stunT > 0) && (K || M.glare.n > 0)) { const X = FX.sx(m.x), Y = FX.sy(m.y) - ((M.alt || ALT) + 2.4) * T;
      for (let j = 0; j < 2; j++) { const on = j < M.glare.n; c.globalAlpha = on ? 1 : 0.5; pageIcon(c, X - T * 0.4 + j * T * 0.8, Y, T * 0.42, 0, on ? 1 : 0); } c.globalAlpha = 1; }
    c.restore(); }
  function pageIcon(c, x, y, s, rot, lit) { c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = lit ? PARCH_HI : 'rgba(228,211,175,.35)'; c.strokeStyle = LINE; c.lineWidth = Math.max(1.2, s * 0.08);
    c.beginPath(); c.moveTo(-s * 0.4, -s * 0.5); c.lineTo(s * 0.25, -s * 0.5); c.lineTo(s * 0.4, -s * 0.35); c.lineTo(s * 0.4, s * 0.5); c.lineTo(-s * 0.4, s * 0.5); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = lit ? 'rgba(107,50,79,.6)' : 'rgba(0,0,0,.3)'; c.lineWidth = Math.max(1, s * 0.05); c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(-s * 0.26, -s * 0.25 + i * s * 0.2); c.lineTo(s * 0.26, -s * 0.25 + i * s * 0.2); } c.stroke();
    if (lit) { c.fillStyle = GOLD; c.beginPath(); c.arc(s * 0.15, s * 0.32, s * 0.08, 0, TAU); c.fill(); } c.restore(); }
  function label(c, s, x, y, px, col, a) { c.save(); c.globalAlpha = a == null ? 1 : a; c.font = `900 ${px}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = Math.max(3, px * 0.24); c.lineJoin = 'round'; c.strokeStyle = 'rgba(0,0,0,.7)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore(); }

  /* ---- an ink pool: a glossy black puddle, its rim the red of anything that hurts; carrying a page, a gold ring invites it ---- */
  function drawPool(c, FX, pool, z, T, t) { const M = FX.mem, m = FX.m, X = FX.sx(pool.x), Y = FX.sy(pool.y), fade = Math.min(1, z.age / 0.25, Math.max(0, z.life - z.age) / 0.7), r = pool.r * T * (0.85 + 0.15 * Math.min(1, z.age / 0.3)), sd = pool.seed;
    c.save(); c.globalAlpha = fade;
    const pts = k => { const out = []; for (let i = 0; i < 18; i++) { const a = i / 18 * TAU, rr = r * k * (1 + 0.07 * Math.sin(3 * a + sd) + 0.04 * Math.sin(5 * a - t * 0.9 + sd)); out.push([X + Math.cos(a) * rr, Y + Math.sin(a) * rr * 0.92]); } return out; }, path = k => { c.beginPath(); TN.blob(pts(k))(c); };
    path(1); c.fillStyle = POOL; c.fill(); c.lineWidth = Math.max(2, T * 0.08); c.strokeStyle = rgba(HOSTILE, 0.75); c.stroke();
    for (let j = 0; j < 4; j++) { const a = sd + j * 1.7, d = r * (1.15 + 0.12 * j); c.fillStyle = POOL; c.beginPath(); c.arc(X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.9, r * (0.09 - j * 0.015), 0, TAU); c.fill(); }
    // the sheen
    const g = c.createRadialGradient(X - r * 0.3, Y - r * 0.35, r * 0.05, X, Y, r); g.addColorStop(0, 'rgba(160,120,230,.4)'); g.addColorStop(0.5, 'rgba(90,58,138,.15)'); g.addColorStop(1, 'rgba(0,0,0,0)'); path(0.92); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(205,180,255,.35)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.ellipse(X - r * 0.25, Y - r * 0.3, r * 0.35, r * 0.12, -0.3, 0, TAU); c.stroke();
    // a bubble rising and popping
    const bp = (t * 0.7 + sd) % 1; if (bp < 0.8) { c.strokeStyle = 'rgba(205,180,255,.5)'; c.lineWidth = 1.2; c.beginPath(); c.arc(X + Math.cos(sd * 3) * r * 0.4, Y + Math.sin(sd * 2) * r * 0.3, T * 0.08 * (0.5 + bp), 0, TAU); c.stroke(); }
    if (M.carry && z.age < z.life - 0.5) { const near = m && !m.dead && Math.hypot(pool.x - m.x, pool.y - m.y) < NEAR, pul = 0.6 + 0.4 * Math.sin(t * 6); c.strokeStyle = GOLD_HI; c.globalAlpha = fade * (0.6 + 0.4 * pul); c.lineWidth = Math.max(2, T * 0.09); c.setLineDash([T * 0.35, T * 0.25]); c.lineDashOffset = -t * T; c.beginPath(); c.ellipse(X, Y, r * 1.18, r * 1.1, 0, 0, TAU); c.stroke(); c.setLineDash([]);
      if (near) { c.globalAlpha = fade; TN.twinkle(c, X, Y - r * 0.2, T * (0.3 + 0.08 * pul), GOLD_HI, 0.95); } }
    c.restore(); }

  /* ---- on the boards, under everything: cleansed patches, the lies, the slammed bands, the near ring, the flood ---- */
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !C || !M.lect) return;
    // cleansed patches: scrubbed clean boards with a gold rim
    M.patches.forEach(q => { const X = FX.sx(q.x), Y = FX.sy(q.y), k = Math.min(1, q.t / 0.4, (q.life - q.t) / 1.5), r = q.r * T; c.save(); c.globalAlpha = k;
      const g = c.createRadialGradient(X, Y, r * 0.2, X, Y, r); g.addColorStop(0, 'rgba(255,248,226,.5)'); g.addColorStop(0.8, 'rgba(244,234,210,.32)'); g.addColorStop(1, 'rgba(244,234,210,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(X, Y, r, r * 0.92, 0, 0, TAU); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.ellipse(X, Y, r * 0.9, r * 0.83, 0, 0, TAU); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = k * (0.35 + 0.15 * Math.sin(t * 3 + q.x)); blitSized(c, glowSprite(GOLD), X - r, Y - r, r * 2, r * 2); c.restore(); });
    // the stained daises of lost lecterns
    M.lect.forEach((L, i) => { if (L.st !== 'lost') return; const p = lectAt(C, i), X = FX.sx(p[0]), Y = FX.sy(p[1]); c.save(); c.fillStyle = 'rgba(23,17,31,.75)'; c.beginPath(); for (let j = 0; j <= 16; j++) { const a = j / 16 * TAU, rr = DAIS_R * T * (1 + 0.1 * Math.sin(a * 4 + i)); j ? c.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr) : c.moveTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } c.closePath(); c.fill(); c.restore(); });
    // the redaction: lies are violet dashed outlines and nothing more; real bands are the red telegraphs (drawn by the
    // engine) with the black bar of the marker sweeping across them at the end
    const R = M.red && M.red.cur; c.save();
    if (R) { const u = clamp(R.t / R.warn, 0, 1);
      R.bands.forEach(b => { const [x, y, w, h] = bandRect(C, b), X = FX.sx(x), Y = FX.sy(y), Wp = w * T, Hp = h * T;
        if (b.kind === 'lie') { c.globalAlpha = 0.9; c.strokeStyle = LIE; c.lineWidth = Math.max(2, T * 0.1); c.setLineDash([T * 0.5, T * 0.38]); c.lineDashOffset = -t * T * 1.2; c.strokeRect(X + T * 0.15, Y + T * 0.15, Wp - T * 0.3, Hp - T * 0.3); c.setLineDash([]);
          c.globalAlpha = 0.75; const n = 5; for (let j = 0; j < n; j++) { const f = (j + 0.5) / n; label(c, '?', b.ori === 'row' ? X + Wp * f : X + Wp / 2, b.ori === 'row' ? Y + Hp / 2 : Y + Hp * f, Math.round(T * 0.7), LIE, 0.7); } }
        else if (b.kind === 'real') { const pul = 0.5 + 0.5 * Math.sin(t * (8 + u * 10)); c.globalAlpha = 1; c.fillStyle = rgba(HOSTILE, 0.16 + 0.12 * u + 0.06 * pul * u); c.fillRect(X, Y, Wp, Hp); c.strokeStyle = HOSTILE; c.lineWidth = Math.max(2.5, T * 0.11); c.strokeRect(X + T * 0.1, Y + T * 0.1, Wp - T * 0.2, Hp - T * 0.2);
          if (u > 0.62) { const k = (u - 0.62) / 0.38; c.globalAlpha = 0.85; c.fillStyle = '#120E18'; if (b.ori === 'row') c.fillRect(X, Y + Hp * 0.12, Wp * k, Hp * 0.76); else c.fillRect(X + Wp * 0.12, Y, Wp * 0.76, Hp * k); } } }); }
    M.lies.forEach(L => { const [x, y, w, h] = bandRect(C, L.b), k = 1 - L.t / 0.7; c.globalAlpha = 0.7 * k; c.strokeStyle = LIE; c.lineWidth = Math.max(1.5, T * 0.08); c.setLineDash([T * 0.2, T * 0.6]); c.strokeRect(FX.sx(x) + T * 0.15, FX.sy(y) + T * 0.15, w * T - T * 0.3, h * T - T * 0.3); c.setLineDash([]); });
    M.stamps.forEach(s => { const [x, y, w, h] = bandRect(C, s.b), k = 1 - s.t / 1.1, X = FX.sx(x), Y = FX.sy(y); c.globalAlpha = 0.9 * k; c.fillStyle = '#0E0A14'; c.fillRect(X, Y + (s.b.ori === 'row' ? h * T * 0.08 : 0), w * T * (s.b.ori === 'row' ? 1 : 0.84) + (s.b.ori === 'row' ? 0 : 0), h * T * (s.b.ori === 'row' ? 0.84 : 1)); });
    c.restore();
    // carrying a page: the gold ring round Vellum where a cleanse counts toward blinding it
    if (M.carry && m && !m.dead && m.act !== 'enter' && !(m.stunT > 0)) { const X = FX.sx(m.x), Y = FX.sy(m.y); c.save(); c.globalAlpha = 0.55 + 0.15 * Math.sin(t * 4); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.07); c.setLineDash([T * 0.5, T * 0.4]); c.lineDashOffset = t * T * 0.8; c.beginPath(); c.arc(X, Y, NEAR * T, 0, TAU); c.stroke(); c.setLineDash([]); c.restore(); }
    drawFlood(c, FX, T, t); }
  function drawFlood(c, FX, T, t) { const M = FX.mem, F = M.fl, C = FX.C; if (!F) return; const warn = F.t < F.warn, u = clamp(F.t / F.warn, 0, 1), lt = F.t - F.warn, end = F.warn + F.dur;
    const rise = warn ? 0 : clamp(lt / 0.6, 0, 1) * clamp((end + 0.8 - F.t) / 0.8, 0, 1), isl = islands(FX);
    // (the ink is painted on its own layer at half the screen's sharpness, the islands cut out of it)
    const m0 = c.getTransform(), cw = Math.ceil(c.canvas.width / 2), ch = Math.ceil(c.canvas.height / 2); let cv = M.flCv; if (!cv) cv = M.flCv = document.createElement('canvas'); if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
    const g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, cw, ch); g.setTransform(m0.a / 2, m0.b / 2, m0.c / 2, m0.d / 2, m0.e / 2, m0.f / 2);
    const x0 = FX.sx(C.x - HS), y0 = FX.sy(C.y - HS), w = HS * 2 * T;
    if (warn) { const pul = 0.55 + 0.45 * Math.sin(t * (6 + u * 10)); g.fillStyle = rgba(HOSTILE, 0.1 + 0.16 * pul * u); g.fillRect(x0, y0, w, w); const e = u * 1.6 * T; g.fillStyle = 'rgba(18,13,26,.85)'; g.fillRect(x0, y0, w, e); g.fillRect(x0, y0 + w - e, w, e); g.fillRect(x0, y0, e, w); g.fillRect(x0 + w - e, y0, e, w); }
    else { g.fillStyle = `rgba(18,13,26,${0.9 * rise})`; g.fillRect(x0, y0, w, w); g.strokeStyle = `rgba(138,91,208,${0.35 * rise})`; g.lineWidth = Math.max(1.5, T * 0.06); for (let i = 0; i < 14; i++) { const yy = y0 + ((i * 0.071 + t * 0.03) % 1) * w, xx = x0 + hr(i) * w * 0.7; g.beginPath(); g.moveTo(xx, yy); g.quadraticCurveTo(xx + T * 1.2, yy - T * 0.25, xx + T * 2.6, yy); g.stroke(); } }
    g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; isl.forEach(q => { g.beginPath(); g.ellipse(FX.sx(q.x), FX.sy(q.y), q.r * T, q.r * T * 0.95, 0, 0, TAU); g.fill(); });
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.drawImage(cv, 0, 0, cw, ch, 0, 0, cw * 2, ch * 2); c.restore();
    // the islands: gold rings, SAFE while the ink rises
    c.save(); isl.forEach(q => { const X = FX.sx(q.x), Y = FX.sy(q.y), pul = 0.6 + 0.4 * Math.sin(t * 5); c.globalAlpha = warn ? 0.9 : 0.75; c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2.5, T * 0.11); c.beginPath(); c.ellipse(X, Y, q.r * T, q.r * T * 0.95, 0, 0, TAU); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 * pul; blitSized(c, glowSprite(GOLD), X - q.r * T, Y - q.r * T, q.r * T * 2, q.r * T * 2); c.globalCompositeOperation = 'source-over';
      if (warn) label(c, 'SAFE', X, Y + q.r * T * 0.55, Math.round(T * 0.5), GOLD_HI, 0.75 + 0.25 * pul); });
    if (!warn && rise > 0.2) FX.H.mons.forEach(q => { if (q.dead || q.boss || q.fobj || safeAt(FX, q.x, q.y, 0)) return; const X = FX.sx(q.x), Y = FX.sy(q.y), ph = (t * 1.4 + q.x) % 1; c.globalAlpha = rise * 0.8; c.strokeStyle = VIOLET_HI; c.lineWidth = 2; c.beginPath(); c.ellipse(X, Y, T * 0.55, T * 0.22, 0, 0, TAU); c.stroke(); c.globalAlpha = rise * (1 - ph) * 0.7; c.beginPath(); c.ellipse(X, Y, T * (0.6 + ph * 0.8), T * (0.24 + ph * 0.3), 0, 0, TAU); c.stroke(); c.globalAlpha = 1; });
    if (warn) label(c, 'THE INK RISES', FX.sx(C.x), FX.sy(C.y + HS - 1.2), Math.round(T * 0.7), HOSTILE, 0.7 + 0.3 * Math.sin(t * 8)); c.restore(); }

  /* ---- a lectern: a carved post and a slanted desk holding a pale page; drowned, taken, stained or lost ---- */
  function drawLectern(c, FX, p, X, Y, T, t) { const M = FX.mem || {}, L = (M.lect && M.lect[p.i]) || { st: 'page', glow: 1, stain: 0, drown: false }, lw = Math.max(1.2, T * 0.06), lost = L.st === 'lost', teth = M.st && M.st.on && M.st.i === p.i;
    const jit = teth ? Math.sin(t * 40) * T * 0.015 * (M.st.fill || 0) : 0, x = X + jit;
    c.save(); FX.K.shade(c, X, Y + T * 0.05, T * 0.75, T * 0.3, 0.45, '#1A0E18');
    TN.shape(c, TN.ell(x, Y - T * 0.1, T * 0.5, T * 0.22), { col: WOOD_D, shade: '#24140F', hi: '#5A3A2E', line: LINE, lw, r: T * 0.5, spec: false, force: true });
    TN.shape(c, TN.poly([[x - T * 0.2, Y - T * 0.14], [x - T * 0.12, Y - T * 0.98], [x + T * 0.12, Y - T * 0.98], [x + T * 0.2, Y - T * 0.14]]), { col: lost ? '#3A2428' : WOOD, shade: WOOD_D, hi: '#8A5E48', line: LINE, lw, r: T * 0.35, spec: false, force: true });
    c.fillStyle = GOLD; c.strokeStyle = LINE; c.lineWidth = lw * 0.7; c.beginPath(); c.ellipse(x, Y - T * 0.55, T * 0.17, T * 0.07, 0, 0, TAU); c.fill(); c.stroke();
    const dk = [[x - T * 0.8, Y - T * 0.96], [x + T * 0.8, Y - T * 0.96], [x + T * 0.66, Y - T * 1.46], [x - T * 0.66, Y - T * 1.46]];
    TN.shape(c, TN.poly(dk), { col: lost ? '#3A2428' : '#6A4434', shade: WOOD_D, hi: '#9A6C52', line: LINE, lw, r: T * 0.6, d1: 0.1, d2: 0.2, spec: false, force: true });
    c.fillStyle = WOOD_D; c.fillRect(x - T * 0.8, Y - T * 0.96, T * 1.6, T * 0.1); c.strokeStyle = LINE; c.lineWidth = lw * 0.7; c.strokeRect(x - T * 0.8, Y - T * 0.96, T * 1.6, T * 0.1);
    const pg = [[x - T * 0.54, Y - T * 1.02], [x + T * 0.54, Y - T * 1.02], [x + T * 0.45, Y - T * 1.38], [x - T * 0.45, Y - T * 1.38]];
    if (L.st === 'page' || lost) {
      if (L.glow > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = L.glow * (0.45 + 0.2 * Math.sin(t * 3 + p.i)); blitSized(c, glowSprite(GOLD), x - T * 1.3, Y - T * 2.4, T * 2.6, T * 2.4); c.restore(); }
      TN.shape(c, TN.poly(pg), { col: lost ? '#1A1420' : PARCH_HI, shade: lost ? '#0E0A12' : PARCH, hi: lost ? '#2A2236' : '#FFFFFF', line: LINE, lw: lw * 0.8, r: T * 0.4, d1: 0.08, d2: 0.14, spec: false, force: true,
        inner: g => { if (!lost) { g.strokeStyle = 'rgba(107,50,79,.45)'; g.lineWidth = Math.max(1, T * 0.025); g.beginPath(); for (let i = 0; i < 4; i++) { const yy = Y - T * (1.1 + i * 0.07); g.moveTo(x - T * 0.38, yy); g.lineTo(x + T * (0.1 + (i % 2) * 0.2), yy); } g.stroke(); g.fillStyle = GOLD; g.beginPath(); g.arc(x + T * 0.28, Y - T * 1.24, T * 0.06, 0, TAU); g.fill(); }
          // the stain creeping over it from the tethered side
          const s = L.stain || 0; if (s > 0.01 && !lost) { g.fillStyle = '#120D1A'; g.beginPath(); g.moveTo(x - T * 0.6, Y - T * 1.45); for (let j = 0; j <= 8; j++) { const yy = Y - T * (1.45 - j * 0.06), xx = x - T * 0.6 + T * 1.25 * s + Math.sin(j * 1.7 + t * 2) * T * 0.07; g.lineTo(xx, yy); } g.lineTo(x - T * 0.6, Y - T * 0.97); g.closePath(); g.fill(); }
          if (L.drown) { g.fillStyle = 'rgba(23,17,31,.85)'; for (let j = 0; j < 4; j++) { g.beginPath(); g.arc(x - T * 0.3 + j * T * 0.2, Y - T * (1.15 + (j % 2) * 0.12), T * (0.1 + (j % 3) * 0.04), 0, TAU); g.fill(); } } } });
      if (L.glow > 0.3 && !lost) { for (let j = 0; j < 2; j++) { const ph = (t * 0.5 + j * 0.5 + p.i * 0.3) % 1; TN.twinkle(c, x + Math.sin(j * 2 + p.i) * T * 0.45, Y - T * (1.5 + ph * 0.8), T * 0.12 * (1 - ph), GOLD_HI, L.glow * (1 - ph)); } } }
    else { // the page taken (out) or spent (coming back): an empty desk, a dashed ghost of the page and a ring filling as it returns
      c.strokeStyle = 'rgba(244,234,210,.55)'; c.lineWidth = 1.5; c.setLineDash([3, 3]); c.beginPath(); pg.forEach((q, j) => j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.stroke(); c.setLineDash([]);
      if (L.st === 'gone') { const f = 1 - clamp(L.back / 8, 0, 1); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 4; c.beginPath(); c.arc(x, Y - T * 1.9, T * 0.24, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = 2.5; c.beginPath(); c.arc(x, Y - T * 1.9, T * 0.24, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); } }
    if (lost) { c.strokeStyle = 'rgba(23,17,31,.9)'; c.lineWidth = Math.max(1.5, T * 0.07); c.lineCap = 'round'; for (const dx of [-0.35, 0.05, 0.4]) { const L2 = T * (0.3 + 0.25 * ((Math.sin(t * 0.8 + dx * 9) + 1) / 2)); c.beginPath(); c.moveTo(x + dx * T, Y - T * 0.97); c.lineTo(x + dx * T, Y - T * 0.97 + L2); c.stroke(); c.fillStyle = '#17111F'; c.beginPath(); c.arc(x + dx * T, Y - T * 0.97 + L2, T * 0.05, 0, TAU); c.fill(); } }
    c.restore(); }

  /* ---- the Spilled-Ink Chamber: an island of floorboards in the void, ink-stained, gold-inlaid, the four daises ---- */
  function paintChamber(c, A) { const R = A.R, rnd = A.rnd, H = HS;
    c.fillStyle = '#0F0A15'; c.fillRect(-R - 2, -R - 2, R * 2 + 4, R * 2 + 4);
    // the void: drifting strands of ink and gold motes
    c.lineCap = 'round'; for (let i = 0; i < 40; i++) { const a = rnd() * TAU, d = H + 1 + rnd() * (R - H + 1), x = Math.cos(a) * d * 1.2, y = Math.sin(a) * d * 1.2, L = 1 + rnd() * 2.5; c.strokeStyle = `rgba(110,70,150,${0.1 + rnd() * 0.15})`; c.lineWidth = 0.08 + rnd() * 0.1; c.beginPath(); c.moveTo(x - L, y); c.bezierCurveTo(x - L * 0.3, y - 0.3, x + L * 0.3, y + 0.3, x + L, y); c.stroke(); }
    for (let i = 0; i < 70; i++) { const x = (rnd() * 2 - 1) * (R + 1), y = (rnd() * 2 - 1) * (R + 1); if (Math.abs(x) < H + 0.5 && Math.abs(y) < H + 0.5) continue; c.fillStyle = `rgba(242,220,154,${0.15 + rnd() * 0.4})`; c.beginPath(); c.arc(x, y, 0.03 + rnd() * 0.05, 0, TAU); c.fill(); }
    // the island's south face: a thick block of page edges sinking into the dark, then the back cover
    let g = c.createLinearGradient(0, H, 0, H + 2.4); g.addColorStop(0, 'rgba(0,0,0,.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-H - 0.6, H + 1.2, H * 2 + 1.2, 1.4);
    c.fillStyle = PARCH_D; c.fillRect(-H, H, H * 2, 1.0); c.strokeStyle = 'rgba(120,96,60,.6)'; c.lineWidth = 0.03; for (let i = 1; i < 9; i++) { c.beginPath(); c.moveTo(-H, H + i * 0.1); c.lineTo(H, H + i * 0.1); c.stroke(); }
    c.fillStyle = '#3A2236'; c.fillRect(-H - 0.15, H + 1.0, H * 2 + 0.3, 0.32); c.fillStyle = GOLD; c.fillRect(-H - 0.15, H + 1.08, H * 2 + 0.3, 0.06);
    // the boards
    c.save(); c.beginPath(); c.rect(-H, -H, H * 2, H * 2); c.clip();
    c.fillStyle = '#CDB68C'; c.fillRect(-H, -H, H * 2, H * 2);
    const tones = ['#CDB68C', '#C6AE84', '#D4BE96', '#C9B088', '#D8C49C'];
    for (let y = -H; y < H; y += 1.0) { let x = -H - rnd() * 2; while (x < H) { const L = 2 + rnd() * 3.2; c.fillStyle = tones[Math.floor(rnd() * tones.length)]; c.fillRect(x, y, L, 1.0);
        c.strokeStyle = 'rgba(120,90,55,.22)'; c.lineWidth = 0.025; for (let k = 0; k < 3; k++) { const yy = y + 0.2 + k * 0.28 + (rnd() - 0.5) * 0.08; c.beginPath(); c.moveTo(x + 0.1, yy); c.quadraticCurveTo(x + L / 2, yy + (rnd() - 0.5) * 0.12, x + L - 0.1, yy); c.stroke(); }
        c.strokeStyle = 'rgba(70,46,30,.55)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 1); c.stroke(); c.fillStyle = 'rgba(60,40,30,.5)'; c.beginPath(); c.arc(x + 0.18, y + 0.25, 0.04, 0, TAU); c.arc(x + 0.18, y + 0.75, 0.04, 0, TAU); c.fill(); x += L; }
      c.strokeStyle = 'rgba(70,46,30,.5)'; c.lineWidth = 0.06; c.beginPath(); c.moveTo(-H, y); c.lineTo(H, y); c.stroke(); c.strokeStyle = 'rgba(255,248,230,.25)'; c.lineWidth = 0.03; c.beginPath(); c.moveTo(-H, y + 0.05); c.lineTo(H, y + 0.05); c.stroke(); }
    // the central emblem: an inlaid nib in a gold ring
    c.strokeStyle = 'rgba(176,138,64,.5)'; c.lineWidth = 0.06; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, 2.85, 0, TAU); c.stroke();
    c.beginPath(); c.moveTo(0, -1.8); c.quadraticCurveTo(1.1, -0.45, 0.8, 0.9); c.lineTo(0, 1.95); c.lineTo(-0.8, 0.9); c.quadraticCurveTo(-1.1, -0.45, 0, -1.8); c.stroke(); c.beginPath(); c.moveTo(0, 0.05); c.lineTo(0, 1.85); c.stroke(); c.beginPath(); c.arc(0, -0.15, 0.22, 0, TAU); c.stroke();
    for (let k = 0; k < 16; k++) { const a = k / 16 * TAU; c.beginPath(); c.moveTo(Math.cos(a) * 2.95, Math.sin(a) * 2.95); c.lineTo(Math.cos(a) * (k % 2 ? 3.15 : 3.35), Math.sin(a) * (k % 2 ? 3.15 : 3.35)); c.stroke(); }
    // dried ink: splattered stains (flat and matte, unlike a live pool), smears and quill scratches
    for (let i = 0; i < 16; i++) { const x = (rnd() * 2 - 1) * (H - 1), y = (rnd() * 2 - 1) * (H - 1), r = 0.25 + rnd() * 0.7, a0 = rnd() * TAU; if (LP.some(q => Math.hypot(q[0] - x, q[1] - y) < DAIS_R + r) || Math.hypot(x, y) < 3.4) continue;
      c.fillStyle = `rgba(40,28,52,${0.3 + rnd() * 0.2})`; c.beginPath(); for (let j = 0; j <= 18; j++) { const a = j / 18 * TAU, rr = r * (0.75 + 0.25 * Math.sin(a * 3 + a0) + (j % 3 === 0 ? 0.35 * rnd() : 0)); j ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fill();
      for (let j = 0; j < 5; j++) { const a = rnd() * TAU, d = r * (1.2 + rnd() * 1.2); c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 0.04 + rnd() * 0.1, 0, TAU); c.fill(); } }
    for (let i = 0; i < 6; i++) { const x = (rnd() * 2 - 1) * (H - 2), y = (rnd() * 2 - 1) * (H - 2), a = rnd() * TAU, L = 1.2 + rnd() * 2; c.strokeStyle = 'rgba(40,28,52,.22)'; c.lineWidth = 0.12 + rnd() * 0.15; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a + 0.5) * L * 0.5, y + Math.sin(a + 0.5) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); c.stroke(); }
    c.strokeStyle = 'rgba(40,28,50,.3)'; c.lineWidth = 0.05; for (let i = 0; i < 14; i++) { const x = (rnd() * 2 - 1) * (H - 1), y = (rnd() * 2 - 1) * (H - 1), a = rnd() * TAU, n = 4 + Math.floor(rnd() * 5); c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(0, 0); for (let j = 1; j <= n; j++) c.quadraticCurveTo((j - 0.5) * 0.3, (j % 2 ? -1 : 1) * 0.15, j * 0.3, 0); c.stroke(); c.restore(); }
    // the daises: round raised boards ringed in gold
    LP.forEach(([x, y]) => { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(x + 0.1, y + 0.18, DAIS_R, DAIS_R * 0.96, 0, 0, TAU); c.fill();
      g = c.createRadialGradient(x - 0.5, y - 0.6, 0.2, x, y, DAIS_R); g.addColorStop(0, '#9A6C52'); g.addColorStop(1, '#6A4434'); c.fillStyle = g; c.beginPath(); c.arc(x, y, DAIS_R, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(40,24,18,.5)'; c.lineWidth = 0.04; for (let k = -3; k <= 3; k++) { const yy = y + k * 0.55, w = Math.sqrt(Math.max(0, DAIS_R * DAIS_R - (k * 0.55) ** 2)); c.beginPath(); c.moveTo(x - w, yy); c.lineTo(x + w, yy); c.stroke(); }
      c.strokeStyle = '#2A1810'; c.lineWidth = 0.09; c.beginPath(); c.arc(x, y, DAIS_R, 0, TAU); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = 0.1; c.beginPath(); c.arc(x, y, DAIS_R - 0.2, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(242,220,154,.5)'; c.lineWidth = 0.04; c.beginPath(); c.arc(x, y, DAIS_R - 0.38, 0, TAU); c.stroke(); });
    // the gold inlay border and brass corner plates
    c.strokeStyle = 'rgba(107,50,79,.6)'; c.lineWidth = 0.4; c.strokeRect(-H + 0.6, -H + 0.6, H * 2 - 1.2, H * 2 - 1.2); c.strokeStyle = GOLD; c.lineWidth = 0.08; c.strokeRect(-H + 0.38, -H + 0.38, H * 2 - 0.76, H * 2 - 0.76); c.strokeRect(-H + 0.82, -H + 0.82, H * 2 - 1.64, H * 2 - 1.64);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = sx * (H - 0.9), y = sy * (H - 0.9); c.fillStyle = '#B08A40'; c.beginPath(); c.moveTo(x, y - 0.7); c.lineTo(x + 0.7, y); c.lineTo(x, y + 0.7); c.lineTo(x - 0.7, y); c.closePath(); c.fill(); c.strokeStyle = '#5A4020'; c.lineWidth = 0.05; c.stroke(); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(x, y, 0.14, 0, TAU); c.fill(); }
    c.restore();
    // the rim of the island: a dark edge, a gold line
    c.strokeStyle = '#2A1810'; c.lineWidth = 0.12; c.strokeRect(-H, -H, H * 2, H * 2); c.strokeStyle = 'rgba(242,220,154,.55)'; c.lineWidth = 0.05; c.strokeRect(-H + 0.08, -H + 0.08, H * 2 - 0.16, H * 2 - 0.16); }
  /* the void over the chamber: deep ink, giant shelves drifting far off, loose pages, and the black moon */
  function paintSky(c, W, H, t, cam, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#07050C'); g.addColorStop(0.5, '#140C1C'); g.addColorStop(1, '#09060E'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(73); c.save();
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; blitSized(c, glowSprite('#6A3A8A'), -W * 0.3, H * 0.05, W * 1.2, H * 0.5); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // far shelves: tilted dark slabs with faint gold crowns, lost in the dark
    for (let i = 0; i < 7; i++) { const x = R() * W, y = H * (0.05 + R() * 0.3), w = 30 + R() * 50, h = 60 + R() * 90, a = (R() - 0.5) * 0.5; c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = 0.35 + R() * 0.2; c.fillStyle = '#1E1220'; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#2A1A2C'; for (let k = 1; k < 5; k++) c.fillRect(-w / 2 + 3, -h / 2 + k * h / 5 - 2, w - 6, 3); c.fillStyle = 'rgba(207,173,98,.35)'; c.fillRect(-w / 2, -h / 2 - 3, w, 3); c.restore(); }
    // the black moon
    const mx = W * 0.74, my = H * 0.12, mr = Math.min(W, H) * 0.1; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite(GOLD), mx - mr * 2.6, my - mr * 2.6, mr * 5.2, mr * 5.2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#05040A'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.strokeStyle = 'rgba(242,220,154,.85)'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(242,220,154,.25)'; c.lineWidth = 6; c.beginPath(); c.arc(mx, my, mr + 4, 0, TAU); c.stroke();
    // loose pages and gold motes drifting
    for (let i = 0; i < 12; i++) { const x = R() * W, y = R() * H * 0.6, a = (R() - 0.5) * 1.4, s = 0.6 + R() * 0.6; c.save(); c.translate(x, y); c.rotate(a); c.scale(s, s * (0.5 + R() * 0.5)); c.globalAlpha = 0.45; c.fillStyle = PARCH_HI; c.fillRect(-8, -11, 16, 22); c.strokeStyle = 'rgba(29,26,40,.4)'; c.lineWidth = 1; c.beginPath(); for (let j = 0; j < 4; j++) { c.moveTo(-5, -6 + j * 5); c.lineTo(5, -6 + j * 5); } c.stroke(); c.restore(); }
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(242,220,154,${0.2 + R() * 0.5})`; c.beginPath(); c.arc(R() * W, R() * H, R() < 0.15 ? 1.4 : 0.7, 0, TAU); c.fill(); }
    c.restore(); }
})());
