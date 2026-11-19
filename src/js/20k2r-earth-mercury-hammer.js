/* ---------- (v417 MH) Earth Strong: Mercury's Hammer ----------
   The pet wields a huge hammer of dense rock and polished metal through a heavy melee combo (replaces Basalt Knuckle: key
   'mercuryhammer', alias basalt -> mercuryhammer in 20k1; cost 26, cooldown 10 s, glyph 'hammer').
   Combos (C.evo, exactly as the spec orders them; the last strike is always the finisher):
     Base (1-3)       one powerful overhead smash                                                  1 hit a monster
     Adept (4-6)      a broad sideways swing, then the overhead finisher                           2 hits
     Celestial (7)    a rightward sweep, a returning leftward sweep, an ascending strike, the heavy  4 hits
                      overhead finisher (a short hop into it)
   Damage (TUNE.tot x base x K over the combo, split by weight; the finisher the heaviest):  Base 2.8; Adept 4.2 (1, 2.0);
   Celestial 6.0 (1, 1, 1.15, 2.3).  Each strike is one explicit hit event a monster (a Set a strike), decided from the
   hammer's swept angle between this step and the last (no frame can skip a monster), the step at most 1/60 s (a long
   frame is played as several steps, so the timing and the hits are the same at any frame rate):
     a sweep        a monster the head's angle passes (seen from the pet, in the swing's own frame), within TUNE.reach
     the ascending  the head crossing the forward horizontal: monsters within TUNE.ascCone of the facing and TUNE.ascReach
     the finisher   at the head's contact with the floor: the contact strip from the pet to it (TUNE.contactW) and the ground
                    shockwave round it (TUNE.finR by tier, the widest of the combo) are ONE event: a monster touched by both
                    takes one finisher hit. Dust, chips, sparks, the trails and the break-up never hit.
   Crowd control through hitMon's own rules (bosses: stun x0.25, knockback x0.12): sweeps stagger briefly, the finisher
   staggers longer. Targeting (TUNE.range): the aimed / selected monster first, then the nearest at each wind-up; the
   facing turns to it at up to TUNE.turn rad/s during wind-ups only (locked while it cuts and recovers); a short step toward
   a target out of reach (TUNE.step a strike, through moveEnt: walls hold). A dead target hands over to the next; with none
   in range it swings on at the facing. Dodge-cancel as Claws of Garuda (20k3o, the weapon-combo controller this follows):
   a dodge after a strike's contact (its recovery) ends the combo there; its later strikes are not made. The cooldown and
   MP are taken when the cast commits (useStrong, 20b). The pet's death, a party swap or the end of the floor ends it and
   clears every pet hook; its effects live in the move's own fx entry (thrown away with the game).
   Pictures: the hammer is one GLM mesh (materials 180..185, 20k5uz) built once in idle time: a massive rectangular stone
   head with layered strata, charcoal grit, champagne mineral veins and crystal inclusions and amber light in selected
   seams; bevelled steel collars and striking faces; bronze clamps, rivets and socket; a thick articulated basalt handle with
   bronze rings, a corded grip and a bronze pommel set with amber. It is posed in 3D every frame (a quaternion carried from
   pose to pose: one consistent object), rendered at the screen's resolution with the game's projection and laid among the
   actors in front of or behind the pet. Its weight is in the pet's stance (me.hopLean / hopSq / hopDX / hopDY / me.z,
   arms aimed at the grip through me.hopArmS); a pet whose arms cannot grip (none, nubs, flippers, wing-arms, tentacles)
   holds it with a magical grip of amber light. The effects are on the GPU painter (FGFX, kinds 112..116 in 20k6h):
   swing smears and their light, the amber grip, cracked and heaved stone at each ground impact with amber in its cracks,
   rolling dust rings (90), dust plumes (84), stone chips and champagne crystal shards (85), sparks off the steel face; after
   the recovery the hammer breaks into mineral grains (a dissolve with amber edges, uFx) and a burst of chips and glints.
   Without WebGL a clean 2D hammer and 2D effects are drawn. TUNE (EARTH_STRONG_TUNE.mercuryhammer) holds every number. */
(() => {
  const S = ELEM_IMPL.earth.strong; delete S.basalt;   // (v417 MH: Basalt Knuckle is gone; a saved 'basalt' reads as this move through ELEM_ALIAS)
  const TAU = Math.PI * 2, SE = 0.55, CE = Math.sqrt(1 - SE * SE);
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const flag = k => { try { return typeof window !== 'undefined' ? window[k] : null; } catch (e) { return null; } };
  const nrm = a => { const k = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / k, a[1] / k, a[2] / k]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const add3 = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k), a[2] + b[2] * (k == null ? 1 : k)];
  const wrapA = a => Math.atan2(Math.sin(a), Math.cos(a));
  // (the weapon-combo controller's shared helpers, as Claws of Garuda uses them: WDK.U from 20k3m; local copies if absent)
  const KIT = () => { try { return typeof WDK !== 'undefined' && WDK.U ? WDK.U : null; } catch (e) { return null; } };
  const tierOf = C => { const U = KIT(); if (U && U.tierOf) return U.tierOf(C); const ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))); return ev >= 7 ? 2 : ev >= 4 ? 1 : 0; };
  const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
  const turnTo = (a, b, mx) => { const U = KIT(); if (U && U.turn) return U.turn(a, b, mx); const d = wrapA(b - a); return a + Math.max(-mx, Math.min(mx, d)); };
  const segD = (px, py, x0, y0, x1, y1) => { const dx = x1 - x0, dy = y1 - y0, ll = dx * dx + dy * dy, s = ll > 1e-9 ? cl(((px - x0) * dx + (py - y0) * dy) / ll) : 0; return Math.hypot(px - x0 - dx * s, py - y0 - dy * s); };
  const gfx = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };

  /* ================= tuning (proposed starting values; EARTH_STRONG_TUNE.mercuryhammer) ================= */
  const TUNE = {
    tot: [2.8, 4.2, 6.0],                       // the combo's damage, x base x K, by tier (Base, Adept, Celestial)
    w: { sweep: 1, broad: 1, ascend: 1.15, fin: [1, 2.0, 2.3] },   // each strike's weight (the finisher's by tier)
    range: 7, turn: 5.5, step: 0.4, stepFin: 0.55, standoff: 1.35,   // targeting: tiles; rad/s while winding up; the step a strike (tiles); no step within this of the target's edge
    reach: 2.7, ascCone: 0.85, ascReach: 2.6, contactW: 0.7,          // sweep reach from the pet (tiles); the ascending strike's cone (rad) and reach; the finisher's contact strip half width
    finR: [2.1, 2.5, 3.0],                       // the finisher's ground shockwave radius by tier (tiles): the widest impact of each combo
    kb: { sweep: 2.2, ascend: 2.4, fin: 5 }, stun: { sweep: 0.15, ascend: 0.25, fin: 0.5 },   // through hitMon (bosses: its own immunities)
    scale: 1.15, arm: 0.42, shoulder: 0.4,      // the hammer's model unit, the arms' reach and the shoulders' height, in pet heights
    summon: 0.5, endd: 0.55,                     // the hammer forming; breaking into mineral grains after the recovery (s)
    // the strikes: W wind-up, C cut, FT recovery (s); a0 -> a1 the cut's angles, ant the load back past a0, fo the follow-through
    SW: {
      smash:  { W: 0.5, C: 0.15, FT: 0.52, a0: -0.85, ant: 0.32, fo: 0, hit: 'fin' },
      broad:  { W: 0.38, C: 0.24, FT: 0.26, a0: -2.1, a1: 1.8, ant: 0.3, fo: 0.45, hit: 'sweep', k: -0.36 },
      sweepR: { W: 0.3, C: 0.2, FT: 0.17, a0: -1.8, a1: 1.55, ant: 0.28, fo: 0.4, hit: 'sweep', k: -0.3 },
      sweepL: { W: 0.22, C: 0.2, FT: 0.17, a0: 1.8, a1: -1.55, ant: 0.28, fo: 0.4, hit: 'sweep', k: -0.16 },
      ascend: { W: 0.24, C: 0.2, FT: 0.2, a0: 2.55, a1: 0.05, ant: 0.2, fo: 0.4, hit: 'ascend', ah: 1.5 } },
    COMBO: [['smash'], ['broad', 'smash'], ['sweepR', 'sweepL', 'ascend', 'smash']] };
  const ST_ = (self.EARTH_STRONG_TUNE = self.EARTH_STRONG_TUNE || {}); ST_.mercuryhammer = TUNE;

  /* ================= the hammer: one GLM mesh (model units; z along the handle, 0 at the grip's lower end; x the striking axis) ================= */
  const ZH = 1.5, ZG = -0.1, HX = 0.44, HY = 0.29, HZ = 0.31, FACE = 0.645;   // the head's centre, the hands' place, the stone's half sizes, the striking faces
  const BBOX = [[-0.67, 0.67], [-0.36, 0.36], [-0.27, ZH + 0.38]];
  const MT = { STONE: 180, STRATA: 180.2, STEEL: 181, FACE: 181.3, BRONZE: 182, RIVET: 182.3, BASALT: 183, XTAL: 184, AMBER: 184.3, CORD: 185 };
  function build() {
    const B = GLM.builder(1);
    // the stone head, and its strata standing a little proud of the long faces and the top
    B.box([0, 0, ZH], [HX, HY, HZ], 0.075, MT.STONE);
    for (const s of [-1, 1]) {
      B.box([s * 0.5, 0, ZH], [0.065, 0.316, 0.336], 0.03, MT.STEEL);   // the steel collar
      B.box([s * 0.6, 0, ZH], [0.045, 0.276, 0.296], 0.038, MT.FACE);   // the striking face, deeply bevelled
      B.box([s * 0.3, 0, ZH], [0.045, 0.306, 0.326], 0.014, MT.BRONZE);   // a bronze clamp round the stone
      for (const zz of [-0.19, 0.19]) for (const yy of [-1, 1]) B.sph([s * 0.3, yy * 0.314, ZH + zz], 0.027, MT.RIVET, 6);
      for (const yy of [-0.17, 0.17]) B.sph([s * 0.3, yy, ZH + 0.334], 0.027, MT.RIVET, 6);
    }
    // the handle, along z: a lathe round the frame's x, mapped to z
    B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], [0, 0, 0]);
    B.lathe([[-0.27, 0.0], [-0.265, 0.04], [-0.24, 0.078], [-0.2, 0.1], [-0.15, 0.104], [-0.1, 0.098], [-0.06, 0.088], [-0.03, 0.083], [0.0, 0.083]], MT.BRONZE, { seg: 10, edge: j => (j === 4 ? 0.9 : 0.2) });   // the pommel
    { const P = []; for (let i = 0; i <= 24; i++) { const x = 0.0 + i * 0.4 / 24; P.push([x, 0.081 + (i % 2 ? 0.007 : -0.002)]); } B.lathe(P, MT.CORD, { seg: 14 }); }   // the corded grip
    const ring = (x0, x1) => B.lathe([[x0, 0.078], [x0 + 0.008, 0.096], [x0 + 0.02, 0.104], [x1 - 0.02, 0.104], [x1 - 0.008, 0.096], [x1, 0.078]], MT.BRONZE, { seg: 14, edge: j => (j === 2 || j === 3 ? 0.85 : 0.1) });
    const seg = (x0, x1) => B.lathe([[x0, 0.07], [x0 + 0.03, 0.08], [(x0 + x1) / 2, 0.087], [x1 - 0.03, 0.08], [x1, 0.07]], MT.BASALT, { seg: 14 });
    ring(0.4, 0.46); seg(0.46, 0.7); ring(0.7, 0.75); seg(0.75, 0.97); ring(0.97, 1.02); seg(1.02, ZH - 0.46);
    B.lathe([[ZH - 0.53, 0.088], [ZH - 0.5, 0.115], [ZH - 0.44, 0.124], [ZH - 0.38, 0.13], [ZH - 0.35, 0.162], [ZH - 0.32, 0.168], [ZH - 0.305, 0.16]], MT.BRONZE, { seg: 8, edge: j => (j === 4 || j === 1 ? 0.9 : 0.15) });   // the socket under the head
    B.pop();
    // champagne crystal inclusions breaking out of the stone, and the pommel's amber
    const xt = (a, d, L, r, sd, m) => B.crystal(a, add3(a, nrm(d), L), r, m || MT.XTAL, { n: 5, seed: sd, belly: 0.35 });
    xt([0.12, HY - 0.01, ZH - 0.06], [0.15, 1, 0.35], 0.13, 0.036, 1); xt([0.18, HY - 0.01, ZH - 0.11], [0.45, 1, -0.25], 0.09, 0.028, 2); xt([0.07, HY - 0.01, ZH - 0.12], [-0.3, 1, -0.1], 0.07, 0.022, 3);
    xt([-0.21, -HY + 0.01, ZH + 0.08], [-0.2, -1, 0.3], 0.12, 0.034, 4); xt([-0.15, -HY + 0.01, ZH + 0.12], [0.3, -1, 0.4], 0.07, 0.024, 5);
    xt([-0.06, 0.1, ZH + HZ - 0.01], [0.1, 0.3, 1], 0.11, 0.032, 6); xt([0.0, 0.05, ZH + HZ - 0.01], [-0.35, 0.2, 1], 0.075, 0.025, 7);
    xt([0, 0, -0.255], [0, 0, -1], 0.09, 0.045, 8, MT.AMBER);
    return B.done();
  }

  /* ================= the GPU's state (as the Obsidian Drill's, 20k2iz) ================= */
  const HGL = (() => {
    let MESH = null, BUILT = false, UP = false, NOGL = false, FAIL = 0, RETRY = 0, LASTF = 0;
    const STATS = { ms: 0, n: 0, W: 0, H: 0, buildMs: 0, nv: 0, ntri: 0 };
    function ensure() { if (BUILT) return true; if (typeof GLM === 'undefined') return false; const t0 = nowMs(); MESH = build(); BUILT = true; STATS.buildMs = nowMs() - t0; STATS.nv = MESH.nv; STATS.ntri = MESH.ntri; return true; }
    const fail = e => { const t = nowMs(); if (t - LASTF > 20000) FAIL = 0; LASTF = t; if (++FAIL >= 3) NOGL = true; else RETRY = t + 1500; try { console.warn('Hammer GL: ' + String(e && e.message || e)); } catch (e2) {} };
    function usable() {
      if (NOGL || (RETRY && nowMs() < RETRY) || flag('__MH_GL') === 0 || typeof GLM === 'undefined' || !GLM.ok()) return false;
      if (GLM.soft && !(flag('__MH_GL') === 1 || flag('__NG_GL') === 1)) return false;
      return true;
    }
    const LK = nrm([-0.55, 0.42, 0.75]), SBW = nrm([-0.5, -0.72, 0.55]), LR = nrm([0.62, -0.62, 0.48]), PXW = [1, 0, 0], PYW = [0, SE, -CE], PDW = [0, CE, SE], UPW = [0, 0, 1];
    const RIM = [1.15, 0.78, 0.45], AMB = [1.04, 0.97, 0.9], OUTC = [0.07, 0.04, 0.025], GLCAP = 1400;
    const IT = { mesh: null, R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3), alpha: 1, glow: 0, glow2: 0, spill: 0, kind: 0, wear: 1, fx: 0, outline: true }, ITEMS = [IT];
    function upload() { if (UP || !ensure() || !GLM.ok()) return; const it = { mesh: MESH, R0: new Float32Array([0.001, 0, 0]), R1: new Float32Array([0, 0.001, 0]), R2: new Float32Array([0, 0, 0.001]), T: new Float32Array(3), alpha: 1, glow: 0, kind: 0, wear: 1 };
      GLM.render(4, 4, { px: PXW, py: PYW, pd: PDW, cl: [1, 0, 1, 0], v: PDW, lk: LK, ls: SBW, lr: LR, up: UPW, low: lowFx(), t: 0 }, [it]); UP = true; }
    function warm() { try { if (!ensure()) return false; if (usable()) upload(); return true; } catch (e) { fail(e); return false; } }
    try { const go = () => { try { ensure(); } catch (e) { /* (built on first use instead) */ } }; if (typeof requestIdleCallback === 'function') requestIdleCallback(go, { timeout: 4000 }); else if (typeof setTimeout === 'function') setTimeout(go, 1300); } catch (e) { /* */ }
    /* draw the hammer: P { X0, Y0 (the screen point of the true-3D origin), T (px a tile), ax [x, y, z] (its axes, unit, true 3D: x right,
       y toward the viewer along the floor, z up), O (its model origin, tiles from the origin), s (tiles a model unit), fx, glow, glow2, alpha }.
       Returns false when it cannot draw (the caller then draws its 2D picture) */
    function draw(c, P) {
      if (!usable() || !ensure()) return false;
      try {
        if (!UP) upload();
        const m = c.getTransform(), k = P.T, s = P.s, A = P.ax;
        const vx0 = -m.e / (m.a || 1), vy0 = -m.f / (m.d || 1), vx1 = vx0 + c.canvas.width / (m.a || 1), vy1 = vy0 + c.canvas.height / (m.d || 1);
        let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
        for (const x of BBOX[0]) for (const y of BBOX[1]) for (const z of BBOX[2]) { const w = [P.O[0] + (A[0][0] * x + A[1][0] * y + A[2][0] * z) * s, P.O[1] + (A[0][1] * x + A[1][1] * y + A[2][1] * z) * s, P.O[2] + (A[0][2] * x + A[1][2] * y + A[2][2] * z) * s], X = P.X0 + w[0] * k, Y = P.Y0 + (w[1] * SE - w[2] * CE) * k;
          bx0 = Math.min(bx0, X); bx1 = Math.max(bx1, X); by0 = Math.min(by0, Y); by1 = Math.max(by1, Y); }
        bx0 = Math.max(Math.floor(bx0) - 3, Math.floor(vx0)); by0 = Math.max(Math.floor(by0) - 3, Math.floor(vy0)); bx1 = Math.min(Math.ceil(bx1) + 3, Math.ceil(vx1)); by1 = Math.min(Math.ceil(by1) + 3, Math.ceil(vy1));
        if (!(bx1 > bx0 + 1 && by1 > by0 + 1)) return true;
        for (let i = 0; i < 3; i++) { IT.R0[i] = A[0][i] * s; IT.R1[i] = A[1][i] * s; IT.R2[i] = A[2][i] * s; IT.T[i] = P.O[i]; }
        IT.mesh = MESH; IT.alpha = 1; IT.glow = P.glow || 0; IT.glow2 = P.glow2 || 0; IT.fx = 0; IT.spill = P.fx || 0;   /* (the break-up rides on uSpill: uFx is the shader's frost) */ IT.wear = s; IT.outline = !(P.fx > 0.001);
        const soft = GLM.soft && !flag('__MH_GLHQ'), dev = Math.max(0.25, Math.hypot(m.a, m.b)) * (soft ? 0.5 : 1);
        let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const sc = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * sc)); H = Math.max(2, Math.ceil(H * sc));
        const bw = bx1 - bx0, bh = by1 - by0;
        const Sc = { px: PXW, py: PYW, pd: PDW, cl: [2 * k / bw, 2 * (P.X0 - bx0) / bw - 1, -2 * k / bh, 1 - 2 * (P.Y0 - by0) / bh], v: PDW, lk: LK, ls: SBW, lr: LR, up: UPW, low: lowFx(), t: nowMs() / 1000 % 1000, rim: RIM, amb: AMB,
          outline: Math.max(0.7, 0.62 * (W / bw)), outlineCol: OUTC, outlineBias: 0.004 };
        const t0 = nowMs(), cvs = GLM.render(W, H, Sc, ITEMS); if (!cvs) return false;
        const al = P.alpha == null ? 1 : P.alpha; if (al > 0.004) { c.save(); c.globalAlpha = Math.min(1, al); c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
        STATS.ms = STATS.ms * 0.9 + (nowMs() - t0) * 0.1; STATS.n++; STATS.W = W; STATS.H = H;
        return true;
      } catch (e) { fail(e); return false; }
    }
    return { usable, warm, ensure, draw, STATS, get mesh() { return MESH; }, get off() { return NOGL; } };
  })();

  /* ================= quaternions (the hammer's orientation is carried from pose to pose) ================= */
  function qOf(X, Y, Z) { const m00 = X[0], m11 = Y[1], m22 = Z[2], tr = m00 + m11 + m22; let q;
    if (tr > 0) { const s = Math.sqrt(tr + 1) * 2; q = [(Y[2] - Z[1]) / s, (Z[0] - X[2]) / s, (X[1] - Y[0]) / s, 0.25 * s]; }
    else if (m00 > m11 && m00 > m22) { const s = Math.sqrt(1 + m00 - m11 - m22) * 2; q = [0.25 * s, (Y[0] + X[1]) / s, (Z[0] + X[2]) / s, (Y[2] - Z[1]) / s]; }
    else if (m11 > m22) { const s = Math.sqrt(1 + m11 - m00 - m22) * 2; q = [(Y[0] + X[1]) / s, 0.25 * s, (Z[1] + Y[2]) / s, (Z[0] - X[2]) / s]; }
    else { const s = Math.sqrt(1 + m22 - m00 - m11) * 2; q = [(Z[0] + X[2]) / s, (Z[1] + Y[2]) / s, 0.25 * s, (X[1] - Y[0]) / s]; }
    const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; }
  function qAxes(q) { const [x, y, z, w] = q; return [[1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w)], [2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w)], [2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y)]]; }
  function slerp(a, b, u) { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], bb = b; if (d < 0) { d = -d; bb = [-b[0], -b[1], -b[2], -b[3]]; }
    if (d > 0.9995) { const r = [lerp(a[0], bb[0], u), lerp(a[1], bb[1], u), lerp(a[2], bb[2], u), lerp(a[3], bb[3], u)], l = Math.hypot(r[0], r[1], r[2], r[3]) || 1; return [r[0] / l, r[1] / l, r[2] / l, r[3] / l]; }
    const th = Math.acos(d), s = Math.sin(th), ka = Math.sin((1 - u) * th) / s, kb = Math.sin(u * th) / s; return [a[0] * ka + bb[0] * kb, a[1] * ka + bb[1] * kb, a[2] * ka + bb[2] * kb, a[3] * ka + bb[3] * kb]; }

  /* ================= palette ================= */
  const SAND = '#E4CBA0', DUST = '#B99A74', DUSTD = '#7E654C', TERRA = '#B5653A', AMBER = '#FFB347', AMBER_L = '#FFD98A', CHAMP = '#F3DDB0', STEEL = '#DCE3EA', SPARK = '#FFC46B';
  const GRIP_HANDS = { paw: 1, mitten: 1, claw: 1, long: 1, crystal: 1 };   // (arms that can close round a handle; the rest hold it with the magical grip)

  S.mercuryhammer = (C, h) => {
    const H = h, me = H.me, tier = tierOf(C), ORDER = TUNE.COMBO[tier], NS = ORDER.length, g = H.g;
    const WF = TUNE.w.fin[tier], WSUM = ORDER.reduce((s, k) => s + (k === 'smash' ? WF : TUNE.w[k === 'sweepR' || k === 'sweepL' ? 'sweep' : k] || 1), 0), PER = TUNE.tot[tier] * C.base * (C.K || 1) / WSUM;
    const hT = (() => { const SZ = Math.max(0.6, ((me.r || 0.3) - 0.2) / 0.1); return Math.max(0.8, Math.min(1.5, 1.02 * SZ * 1.035 * (g.pw && g.pw.giant ? 1.35 : 1) * (g.petK || 1))); })();
    const sH = TUNE.scale * hT, LH = TUNE.arm * hT + (ZH - ZG) * sH;   // (tiles a model unit; shoulder -> head centre)
    const P0 = H.X.pet ? H.X.pet() : null, ST0 = H.X.ST(), swapped = () => (P0 ? H.X.pet() !== P0 : H.X.ST() !== ST0);
    let armsT = 'none'; try { const PF = typeof formOf === 'function' ? formOf(P0 || {}) : null; armsT = (PF && PF.arms && PF.arms.t) || 'none'; } catch (e) { armsT = 'none'; }
    const hands = !!GRIP_HANDS[armsT], hasArms = armsT !== 'none';
    const dbg = { swings: [], hits: 0, hitLog: new Map(), cancelled: null, retargets: 0, impacts: [], tier, NS, ORDER, armsT, hands, steps: 0, maxStep: 0, stepped: 0 };
    H.X.banner && H.X.banner("MERCURY'S HAMMER", '', C.col, 1.0); H.X.sfx.thud && H.X.sfx.thud(); me.sq = 0.6;
    try { HGL.warm(); } catch (e) { /* */ }

    /* ---- the pet's frame (true 3D: x right, y depth toward the viewer, z up; a world floor y is depth x SE) ---- */
    let fa = isFinite(C.tx) && isFinite(C.ty) && Math.hypot(C.tx - me.x, C.ty - me.y) > 0.05 ? Math.atan2(C.ty - me.y, C.tx - me.x) : (me.face || 1) > 0 ? 0 : Math.PI;
    const frame = () => { const F = nrm([Math.cos(fa), Math.sin(fa) / SE, 0]), N = [-F[1], F[0], 0]; return { F, N, U: [0, 0, 1], sgnN: N[1] >= 0 ? 1 : -1 }; };
    const toW = (fr, v) => [fr.F[0] * v[0] + fr.N[0] * v[1], fr.F[1] * v[0] + fr.N[1] * v[1], v[2]];
    const origin = () => [me.x + (me.hopDX || 0), (me.y + (me.hopDY || 0) + 0.18) / SE, 0];   // (the pet's visual feet, true 3D)
    // the swing's circle in the pet frame: dir(a) = (c + cos a e1 + sin a e2) / |...|
    function circOf(kind, fr) { const D = TUNE.SW[kind];
      if (kind === 'smash') return { c: [0, -0.12 * fr.sgnN, 0], e1: [0, 0, 1], e2: [1, 0, 0] };
      if (kind === 'ascend') return { c: [0, 0.22 * fr.sgnN, 0], e1: [0, 0, 1], e2: [1, 0, 0] };
      return { c: [0, 0, D.k], e1: [1, 0, 0], e2: [0, 1, 0] }; }
    const dirP = (ci, a) => nrm([ci.c[0] + Math.cos(a) * ci.e1[0] + Math.sin(a) * ci.e2[0], ci.c[1] + Math.cos(a) * ci.e1[1] + Math.sin(a) * ci.e2[1], ci.c[2] + Math.cos(a) * ci.e1[2] + Math.sin(a) * ci.e2[2]]);
    const tanP = (ci, a) => nrm([-Math.sin(a) * ci.e1[0] + Math.cos(a) * ci.e2[0], -Math.sin(a) * ci.e1[1] + Math.cos(a) * ci.e2[1], -Math.sin(a) * ci.e1[2] + Math.cos(a) * ci.e2[2]]);

    /* ---- state ---- */
    let ph = 'summon', k = -1, tK = 0, cur = null, endT = 0, goneT = 0, T = 0;   // (T: the move's own clock, stepped)
    const body = { lean: 0, sq: 0, dx: 0, z: 0, arm: 0 }, bodyT = { lean: 0, sq: 0, dx: 0, z: 0 };
    const pose = { q: null, S: [0, 0, 0], ang: 0, glow: 0.2, glow2: 0, fx: 1, front: false };
    const impacts = [], trails = [], parts = [], PF = [];
    let impT = -9, fxEnd = 0;

    /* ---- targeting (as Claws of Garuda) ---- */
    function acquire(first) { const L = H.living().filter(m => valid(m) && Math.hypot(m.x - me.x, m.y - me.y) < TUNE.range + (m.r || 0.4)); if (!L.length) return null; let best = null, bs = 1e9;
      for (const m of L) { let sc = Math.hypot(m.x - me.x, m.y - me.y); if (first && isFinite(C.tx) && isFinite(C.ty)) sc = 0.35 * sc + Math.hypot(m.x - C.tx, m.y - C.ty); if (sc < bs) { bs = sc; best = m; } } return best; }
    function contactA(fr) {   // the smash's contact angle: where the head's lower face meets the floor, the pet crouched into it
      const ci = circOf('smash', fr), Sz = TUNE.shoulder * hT * 0.93 / CE; let th = 0.9; while (th < 2.8) { const d = dirP(ci, th), tz = Math.abs(tanP(ci, th)[2]); if (Sz + d[2] * LH - sH * (FACE * tz + (HZ + 0.03) * Math.abs(d[2])) <= 0.02) break; th += 0.01; } return th; }
    function prepare(i, t) {
      const kind = ORDER[i], D = TUNE.SW[kind], tg = acquire(i === 0);   // (no snap: the facing turns to it at TUNE.turn while it winds up)
      const fr = frame(), a1 = kind === 'smash' ? contactA(fr) : D.a1, sgn = Math.sign(a1 - D.a0) || 1;
      const sw = { i, kind, D, tg, hit: new Set(), n: 0, fin: kind === 'smash', a0: D.a0, a1, sgn, aStart: D.a0 - sgn * D.ant, struck: false, stepped: 0, t0: t, dmg: PER * (kind === 'smash' ? WF : TUNE.w[kind === 'sweepR' || kind === 'sweepL' ? 'sweep' : kind] || 1), tEnd: D.W + D.C + D.FT, s: 1, from: null, aPrev: null };
      dbg.swings.push({ kind, n: 0, fin: sw.fin, dmg: sw.dmg, get tg() { return sw.tg; } }); return sw;
    }
    /* the hammer's pose in a swing at angle a: shoulder S (true 3D, from the pet's feet), axes */
    function shoulderOf(fr) { return add3(add3([0, 0, (TUNE.shoulder * hT * (1 - 0.22 * Math.max(0, body.sq)) + (me.z || 0)) / CE], toW(fr, [0.08 * hT + body.lean * 0.45 * hT, 0, 0])), toW(fr, [0, 0.04 * fr.sgnN * hT, 0])); }
    function poseAt(sw, fr, a) { const ci = circOf(sw.kind, fr), d = toW(fr, dirP(ci, a)), tg = toW(fr, tanP(ci, a)), x = nrm(add3([0, 0, 0], tg, sw.sgn * sw.s)), z = d, y = nrm(cross(z, x)); return { X: cross(y, z), Y: y, Z: z }; }
    function angleAt(sw, tau) { const D = sw.D; if (tau < D.W) return null; const u = (tau - D.W) / D.C;
      if (u < 1) return lerp(sw.aStart, sw.a1, Math.pow(u, sw.fin ? 2.4 : 1.7));
      const v = cl((tau - D.W - D.C) / D.FT); if (sw.fin) { const b = tau - D.W - D.C; return sw.a1 - 0.05 * Math.exp(-b * 10) * Math.sin(Math.min(Math.PI, b * 24)) - sw.sgn * 0.55 * sm((v - 0.45) / 0.55); }
      return sw.a1 + sw.sgn * D.fo * (1 - (1 - v) * (1 - v)); }

    /* ---- hits: explicit events, one a monster a strike ---- */
    function strike(sw, m, x, y, t) { sw.hit.add(m); sw.n++; dbg.hits++; dbg.swings[sw.i].n = sw.n; dbg.hitLog.set(m, (dbg.hitLog.get(m) || 0) + 1);
      const kk = sw.fin ? 'fin' : sw.kind === 'ascend' ? 'ascend' : 'sweep'; H.X.hitMon(m, sw.dmg, C.dmgO({ kb: TUNE.kb[kk], stun: TUNE.stun[kk] }));
      // (on each monster struck: a puff of stone dust, chips, a few sparks off the steel)
      const z = sw.fin ? 0.25 : 0.45; for (let j = 0; j < H.n(sw.fin ? 5 : 4); j++) part({ k: 'chip', x: m.x, d: m.y / SE, z: z + Math.random() * 0.3, vx: (Math.random() - 0.5) * 4, vd: (Math.random() - 0.5) * 4, vz: 2 + Math.random() * 2.5, g: 9, life: 0.6 + Math.random() * 0.3, s: 0.04 + Math.random() * 0.05, md: Math.random() < 0.3 ? 2 : Math.random() < 0.6 ? 5 : 0 });
      part({ k: 'dust', x: m.x, d: m.y / SE, z: 0.25, vx: 0, vd: 0, vz: 0.4, life: 0.7, s: 0.45, grow: 0.8 });
      if (!sw.fin) { H.X.hitstop && H.X.hitstop(0.035); if (!RM()) H.X.shake(2.5, 0.08); H.X.sfx.thud && H.X.sfx.thud(); } }
    function monAngle(fr, O, m) { const mx = m.x - O[0] / 1, md = m.y / SE - O[1]; return Math.atan2(mx * fr.N[0] + md * fr.N[1], mx * fr.F[0] + md * fr.F[1]); }
    function sweepHits(sw, fr, aPrev, aCur, t) {
      const lo = Math.min(aPrev, aCur), hi = Math.max(aPrev, aCur); if (hi - lo < 1e-6) return; const O = origin(), arcLo = Math.min(sw.aStart, sw.a1 + sw.sgn * sw.D.fo * 0.35), arcHi = Math.max(sw.aStart, sw.a1 + sw.sgn * sw.D.fo * 0.35);
      for (const m of H.living()) { if (!valid(m) || sw.hit.has(m)) continue; const mr = m.r || 0.4, d = Math.hypot(m.x - me.x, m.y - me.y); if (d > TUNE.reach + mr) continue;
        const ps = monAngle(fr, O, m), tol = d > mr ? Math.asin(Math.min(1, mr / d)) : Math.PI / 2; if (ps < arcLo - tol || ps > arcHi + tol) continue;
        if (ps + tol >= lo && ps - tol <= hi) strike(sw, m, m.x, m.y, t); } }
    function ascendHits(sw, fr, aPrev, aCur, t) { const ah = sw.D.ah; if (!(aPrev > ah && aCur <= ah)) return; const O = origin();
      for (const m of H.living()) { if (!valid(m) || sw.hit.has(m)) continue; const mr = m.r || 0.4, d = Math.hypot(m.x - me.x, m.y - me.y); if (d > TUNE.ascReach + mr) continue;
        const ps = wrapA(Math.atan2(m.y - me.y, m.x - me.x) - fa), tol = d > mr ? Math.asin(Math.min(1, mr / d)) : Math.PI / 2; if (Math.abs(ps) <= TUNE.ascCone + tol) strike(sw, m, m.x, m.y, t); }   // (its cone on the floor, round the facing)
      H.X.sfx.whoosh && H.X.sfx.whoosh(); }
    function impact(sw, fr, t) {   // the finisher: the hammer's contact and its ground shockwave, ONE event a monster
      sw.struck = true; const S0 = add3(origin(), shoulderOf(fr)), hd = add3(S0, toW(fr, dirP(circOf('smash', fr), sw.a1)), LH), cx = hd[0], cy = hd[1] * SE, R = TUNE.finR[tier];
      for (const m of H.living()) { if (!valid(m) || sw.hit.has(m)) continue; const mr = m.r || 0.4, dC = Math.hypot(m.x - cx, m.y - cy), dS = segD(m.x, m.y, me.x, me.y, cx, cy);
        if (dC <= R + mr || dS <= TUNE.contactW + mr) strike(sw, m, m.x, m.y, t); }
      dbg.impacts.push({ x: cx, y: cy, R, n: sw.n, t });
      const big = 0.75 + 0.25 * tier; impT = t;
      impacts.push({ x: cx, y: cy, R, t0: t, big, seed: 3 + R1(t * 7.1) * 40, fin: true });
      H.X.hitstop && H.X.hitstop(0.05 + 0.02 * tier); if (!RM()) H.X.shake(7 + 3 * tier, 0.22 + 0.04 * tier); H.X.sfx.crash && H.X.sfx.crash(); H.X.sfx.thud && H.X.sfx.thud(); H.X.light && H.X.light(cx, cy, R * 1.4, 0.3);
      // (dust plumes round the rim, chips and champagne crystal shards thrown out, sparks off the steel face)
      for (let j = 0; j < H.n(5 + 2 * tier); j++) { const b = j / (5 + 2 * tier) * TAU + Math.random() * 0.5, rr = R * (0.45 + 0.45 * Math.random()); part({ k: 'dust', x: cx + Math.cos(b) * rr, d: (cy + Math.sin(b) * rr * 0.75) / SE, z: 0.1, vx: Math.cos(b) * 1.2, vd: Math.sin(b) * 1.2, vz: 0.6 + Math.random() * 0.5, life: 0.8 + Math.random() * 0.4, s: 0.32 + 0.1 * tier + Math.random() * 0.2, grow: 0.9 }); }
      for (let j = 0; j < H.n(16 + 6 * tier); j++) { const b = Math.random() * TAU, v = 2.5 + Math.random() * 4.5; part({ k: 'chip', x: cx, d: cy / SE, z: 0.15, vx: Math.cos(b) * v, vd: Math.sin(b) * v / SE * 0.6, vz: 3 + Math.random() * 4, g: 10, life: 0.7 + Math.random() * 0.5, s: 0.035 + Math.random() * 0.06, md: j % 3 === 0 ? 0 : j % 3 === 1 ? 5 : 2, glow: Math.random() * 0.5 }); }
      const fx0 = hd[0], fd0 = hd[1]; for (let j = 0; j < H.n(10 + 4 * tier); j++) { const b = Math.random() * TAU, v = 4 + Math.random() * 6; part({ k: 'spark', x: fx0, d: fd0, z: 0.25, vx: Math.cos(b) * v, vd: Math.sin(b) * v, vz: 2 + Math.random() * 4, g: 12, life: 0.25 + Math.random() * 0.25, s: 0.03 }); }
    }

    /* ---- particles (cosmetic: never hit) ---- */
    function part(o) { if (parts.length > 260) return null; const p = Object.assign({ t: 0, life: 1, x: 0, d: 0, z: 0, vx: 0, vd: 0, vz: 0, g: 0, s: 0.1, grow: 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12, md: 0, glow: 0, seed: Math.random() * 50 }, o); parts.push(p); return p; }
    function stepParts(dt) { for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.t += dt; if (p.t >= p.life) { parts.splice(i, 1); continue; }
      if (p.k === 'form') continue; p.x += p.vx * dt; p.d += p.vd * dt; p.z += p.vz * dt; p.vz -= p.g * dt; p.rot += p.vr * dt;
      if (p.k === 'dust') { p.vx *= Math.exp(-dt * 2); p.vd *= Math.exp(-dt * 2); p.vz *= Math.exp(-dt * 1.5); }
      if (p.z < 0 && p.g > 0) { p.z = 0; p.vz = -p.vz * 0.3; p.vx *= 0.5; p.vd *= 0.5; p.vr *= 0.5; if (p.k === 'spark') p.life = Math.min(p.life, p.t + 0.05); } } }

    /* ---- pet hooks ---- */
    function clearPet() { me.hopLean = 0; me.hopDX = 0; me.hopDY = 0; me.hopSq = 0; me.hopArmS = null; if (body.z > 0 || me.z > 0) me.z = 0; body.z = 0; }
    function applyPet(dt, fr) { const kk = 1 - Math.exp(-dt * 22), kz = 1 - Math.exp(-dt * 30);
      body.lean += (bodyT.lean - body.lean) * kk; body.sq += (bodyT.sq - body.sq) * kz; body.dx += (bodyT.dx - body.dx) * kk; body.z += (bodyT.z - body.z) * kz;
      const lx = (me.face || 1) * (0.55 + 0.45 * Math.abs(fr.F[0])); me.hopLean = body.lean * lx; me.hopSq = body.sq; me.hopDX = fr.F[0] * body.dx * hT * 0.3; me.hopDY = fr.F[1] * SE * body.dx * hT * 0.3; if (tier === 2 || body.z > 0.001) me.z = Math.max(0, body.z);
      if (!hasArms) { me.hopArmS = null; return; }
      // the arms aimed at the grip (screen), as the rig turns them (0 down, - forward)
      const Tz = H.X.Tz(), gp = scrRel(gripW(fr)), O = origin(), X0 = H.sx(O[0]), Y0 = H.sy(O[1] * SE), ddx = gp[0] - X0, ddy = gp[1] - (Y0 - (0.5 * hT + (me.z || 0)) * Tz);
      let a = Math.atan2(-ddx * (me.face || 1), ddy) * 180 / Math.PI; if (!isFinite(a)) a = 0; a = Math.max(-178, Math.min(178, a));   /* (overhead: back past the vertical) */ const wA = ph === 'summon' ? sm((T - 0.1) / 0.3) : ph === 'end' ? 1 - sm((T - endT) / 0.25) : 1;
      body.arm += (a * wA - body.arm) * (1 - Math.exp(-dt * 30)); me.hopArmS = [body.arm, body.arm * 0.94 + 5]; }
    const gripW = fr => add3(pose.S, qAxes(pose.q)[2], TUNE.arm * hT);   // (the grip, true 3D from the feet)
    const scrRel = p => { const O = origin(), Tz = H.X.Tz(); return [H.sx(O[0] + p[0]), H.sy((O[1] + p[1]) * SE) - (p[2] + O[2]) * CE * Tz]; };
    const scrAbs = (x, d, z) => [H.sx(x), H.sy(d * SE) - z * CE * H.X.Tz()];

    /* ---- the controller: summon -> strikes (wind-up, cut, recovery) -> break-up; stepped at <= 1/60 s ---- */
    function setPose(fr, a, sw) { const P = poseAt(sw, fr, a); pose.q = qOf(P.X, P.Y, P.Z); pose.S = shoulderOf(fr); pose.ang = a; }
    function step(dt) {
      T += dt; const t = T; let fr = frame();
      if (ph !== 'end' && ph !== 'gone' && (me.dead || swapped())) { dbg.cancelled = me.dead ? 'death' : 'swap'; toEnd(t, true); }
      if (ph === 'gone') return;
      if (ph === 'end') { const u = (t - endT) / TUNE.endd; pose.fx = cl(u * 1.15); bodyT.lean = 0; bodyT.sq = 0.08 * (1 - u); bodyT.dx = 0; bodyT.z = 0; pose.glow = 0.3 + 0.8 * Math.max(0, 1 - u * 2);
        if (!F.burst && u > 0.05) { F.burst = true; breakUp(fr); } if (u >= 1) { ph = 'gone'; goneT = t; clearPet(); } return; }
      const tau = t - tK;
      if (ph === 'summon') {
        if (!cur) { cur = prepare(0, t); fr = frame(); setPose(fr, cur.aStart * 0.25 + (cur.kind === 'smash' ? 0.6 : cur.a0 * 0.4), cur); summonFx(fr); }
        if (cur.tg && valid(cur.tg)) { fa = turnTo(fa, Math.atan2(cur.tg.y - me.y, cur.tg.x - me.x), TUNE.turn * dt); fr = frame(); }
        const u = tau / TUNE.summon; pose.fx = cl(1 - sm((u - 0.15) / 0.75)); pose.glow = 0.4 + 0.5 * Math.sin(u * Math.PI);
        setPose(fr, lerp(cur.kind === 'smash' ? 0.9 : cur.a0 * 0.5, cur.kind === 'smash' ? 0.6 : cur.a0 * 0.4, sm(u)), cur);
        bodyT.lean = -0.06; bodyT.sq = 0.2 * sm(u / 0.5); bodyT.dx = 0; bodyT.z = 0;
        if (tau >= TUNE.summon) { ph = 'swing'; k = 0; tK = t; cur.t0 = t; cur.from = { q: pose.q.slice(), S: pose.S.slice() }; cur.s = sideFor(cur, fr); H.X.sfx.whoosh && H.X.sfx.whoosh(); }
        return; }
      // a strike
      const sw = cur, D = sw.D;
      if (tau < D.W) {   // the wind-up: tracking and the limited step
        if (!valid(sw.tg)) { const m = acquire(false); if (m) { sw.tg = m; dbg.retargets++; } }
        if (valid(sw.tg)) { fa = turnTo(fa, Math.atan2(sw.tg.y - me.y, sw.tg.x - me.x), TUNE.turn * dt); fr = frame();
          const dd = Math.hypot(sw.tg.x - me.x, sw.tg.y - me.y) - (sw.tg.r || 0.4), lim = sw.fin ? TUNE.stepFin : TUNE.step;
          if (dd > TUNE.standoff && sw.stepped < lim) { const stp = Math.min(lim - sw.stepped, dt * lim / D.W * 1.6, dd - TUNE.standoff); if (stp > 0) { H.X.moveEnt(me, Math.cos(fa) * stp, Math.sin(fa) * stp, 0); sw.stepped += stp; dbg.stepped += stp; } } }
        if (sw.fin) sw.a1 = contactA(fr);
        const u = tau / D.W, e = sm(u / 0.8), P = poseAt(sw, fr, sw.aStart), q1 = qOf(P.X, P.Y, P.Z);
        pose.q = slerp(sw.from.q, q1, e); pose.S = shoulderOf(fr); pose.ang = sw.aStart;
        windBody(sw, u); if (sw.fin) pose.glow = 0.3 + 1.1 * sm(u); }
      else {
        const a = angleAt(sw, tau), aPrev = sw.aPrev == null ? sw.aStart : sw.aPrev; setPose(fr, a, sw); sw.aPrev = a;
        if (!sw.cutSfx) { sw.cutSfx = true; H.X.sfx.whoosh && H.X.sfx.whoosh(); if (sw.kind !== 'smash') trails.push(sw.trail = { kind: sw.kind, sw, fr, a0: sw.aStart, a: a, t1: -1, s: sw.sgn }); else trails.push(sw.trail = { kind: 'smash', sw, fr, a0: sw.aStart, a, t1: -1, s: sw.sgn }); }
        if (sw.trail) sw.trail.a = a;
        const inCut = tau < D.W + D.C;
        if (D.hit === 'sweep' && (inCut || (tau - D.W - D.C) < D.FT * 0.5)) sweepHits(sw, fr, aPrev, a, t);
        else if (D.hit === 'ascend') ascendHits(sw, fr, aPrev, a, t);
        if (sw.fin && !sw.struck && !inCut) impact(sw, fr, t);
        cutBody(sw, tau);
        if (D.hit !== 'fin' && inCut) scrape(sw, fr, a, dt);
        if (!inCut && sw.trail && sw.trail.t1 < 0) sw.trail.t1 = t;
        // dodge-cancel: a dodge in a strike's recovery ends the combo there
        if (!inCut && me.dodge) { dbg.cancelled = 'dodge'; toEnd(t, false); return; }
        if (tau >= sw.tEnd) { k++; if (k >= NS) { toEnd(t, false); return; } const nx = prepare(k, t); nx.from = { q: pose.q.slice(), S: pose.S.slice() }; nx.s = sideFor(nx, frame()); cur = nx; tK = t; }
      }
      pose.glow2 = Math.max(0, 1.6 * Math.exp(-(t - impT) * 7));
      if (!(sw.fin && tau < D.W)) pose.glow += ((t - impT < 0.08 ? 1.6 : 0.3) - pose.glow) * (1 - Math.exp(-dt * (t - impT < 0.08 ? 40 : 2.5)));   // (the seams flare at the finisher's contact, then settle)
    }
    // (which face leads: the one nearest where the last strike left it, so the hammer never flips about its handle)
    function sideFor(sw, fr) { const P = poseAt(Object.assign({}, sw, { s: 1 }), fr, sw.aStart), X0 = sw.from ? qAxes(sw.from.q)[0] : P.X; return dot(P.X, X0) >= 0 ? 1 : -1; }
    function toEnd(t, quick) { if (ph === 'end' || ph === 'gone') return; ph = 'end'; endT = t; if (quick) clearPet(); for (const tr of trails) if (tr.t1 < 0) tr.t1 = t; fxEnd = t; }
    // the stance: anticipation, impact and recovery show the weight
    function windBody(sw, u) { const fin = sw.fin, ek = sm(u);
      if (fin) { bodyT.lean = lerp(0.05, -0.26, ek); bodyT.sq = u < 0.7 ? lerp(0.1, -0.2, sm(u / 0.7)) : lerp(-0.2, 0.22, sm((u - 0.7) / 0.3)); bodyT.dx = -0.08 * ek; bodyT.z = tier === 2 ? 0.35 * Math.sin(cl(u) * Math.PI * 0.5) * hT : 0; }
      else if (sw.kind === 'ascend') { bodyT.lean = 0.12 * ek; bodyT.sq = 0.3 * ek; bodyT.dx = 0.04; bodyT.z = 0; }
      else { bodyT.lean = -0.12 * ek; bodyT.sq = 0.16 * ek; bodyT.dx = -0.04 * ek; bodyT.z = 0; } }
    function cutBody(sw, tau) { const D = sw.D, u = cl((tau - D.W) / D.C), v = cl((tau - D.W - D.C) / D.FT);
      if (sw.fin) { if (u < 1) { bodyT.lean = lerp(-0.26, 0.34, sm(u)); bodyT.sq = lerp(0.0, 0.18, u); bodyT.dx = lerp(-0.08, 0.2, u); bodyT.z = tier === 2 ? 0.35 * (1 - u) * hT : 0; }
        else { const b = tau - D.W - D.C; bodyT.lean = lerp(0.34, 0.06, sm(v)); bodyT.sq = 0.42 * Math.exp(-b * 5) * Math.cos(b * 16) + 0.12 * (1 - sm(v)); bodyT.dx = lerp(0.2, 0.04, sm(v)); bodyT.z = 0; } }
      else if (sw.kind === 'ascend') { bodyT.lean = lerp(0.12, -0.18, sm(u)) * (1 - 0.4 * v); bodyT.sq = lerp(0.3, -0.25, sm(u)) * (1 - v * 0.6); bodyT.dx = 0.06; bodyT.z = tier === 2 ? 0.22 * hT * sm(u) : 0; }
      else { bodyT.lean = lerp(-0.12, 0.18, sm(u)) * (1 - 0.5 * v); bodyT.sq = lerp(0.16, 0.05, u) + 0.1 * Math.sin(u * Math.PI); bodyT.dx = 0.1 * sm(u) * (1 - 0.5 * v); bodyT.z = 0; } }
    // a sweep dragging low: dust off the floor under the head
    function scrape(sw, fr, a, dt) { const hd = headAbs(fr, a, sw); if (hd[2] > 0.55 * hT) return; if (Math.random() > dt * 30 * H.Q()) return; part({ k: 'dust', x: hd[0], d: hd[1], z: 0.05, vx: (Math.random() - 0.5) * 1.5, vd: (Math.random() - 0.5) * 1.5, vz: 0.5, life: 0.55, s: 0.3, grow: 0.9 }); }
    function headAbs(fr, a, sw) { const S0 = add3(origin(), pose.S); return add3(S0, qAxes(pose.q)[2], LH); }
    function summonFx(fr) { // fragments rising from the floor round the pet and flying in to the head's place
      const O = origin(); for (let j = 0; j < H.n(18); j++) { const b = Math.random() * TAU, r = 0.6 + Math.random() * 1.1; part({ k: 'form', x: O[0] + Math.cos(b) * r, d: O[1] + Math.sin(b) * r / SE * 0.6, z: 0, life: TUNE.summon * (0.6 + 0.35 * Math.random()), s: 0.05 + Math.random() * 0.06, md: j % 3 === 0 ? 0 : j % 3 === 1 ? 5 : 2, off: [(Math.random() - 0.5) * 0.9, (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.6] }); }
      part({ k: 'dust', x: O[0], d: O[1], z: 0.05, vz: 0.3, life: 0.6, s: 0.55, grow: 0.8 }); }
    function breakUp(fr) { // the hammer breaks into mineral grains: chips, champagne crystal shards, sand, glints, from all over its head and handle
      const O = add3(origin(), pose.S), A = qAxes(pose.q); H.X.sfx.crack && H.X.sfx.crack(); H.X.sfx.thud && H.X.sfx.thud();
      for (let j = 0; j < H.n(34); j++) { const head = j < 26, lx = head ? (Math.random() - 0.5) * 1.2 : 0, ly = head ? (Math.random() - 0.5) * 0.55 : 0, lz = head ? ZH + (Math.random() - 0.5) * 0.6 : Math.random() * (ZH - 0.4);
        const w = add3(add3(add3(O, A[0], lx * sH), A[1], ly * sH), A[2], TUNE.arm * hT + (lz - ZG) * sH), b = Math.random() * TAU, v = 0.6 + Math.random() * 1.8;
        part({ k: j % 6 === 0 ? 'glint' : 'chip', x: w[0], d: w[1], z: Math.max(0.05, w[2]), vx: Math.cos(b) * v, vd: Math.sin(b) * v, vz: 0.5 + Math.random() * 2, g: 7, life: 0.6 + Math.random() * 0.6, s: 0.035 + Math.random() * 0.05, md: j % 3 === 0 ? 2 : j % 3 === 1 ? 5 : 0, glow: 0.3 + Math.random() * 0.5 }); }
      for (let j = 0; j < H.n(4); j++) { const w = add3(O, A[2], LH * (0.5 + j * 0.2)); part({ k: 'dust', x: w[0], d: w[1], z: Math.max(0.1, w[2] * 0.5), vx: (Math.random() - 0.5), vd: (Math.random() - 0.5), vz: -0.2, life: 0.8, s: 0.35, grow: 0.9 }); } }

    const F = H.add({ key: 'mercuryhammer', life: 30, x: me.x, y: me.y, dbg, NS, ORDER, TUNE,
      update(dt, f) { f.x = me.x; f.y = me.y; const n = Math.min(600, Math.max(1, Math.ceil(dt / (1 / 60) - 1e-6))), h1 = dt / n; dbg.steps += n; dbg.maxStep = Math.max(dbg.maxStep, h1);
        for (let i = 0; i < n; i++) { step(h1); stepParts(h1); }
        if (ph === 'gone') { if (!parts.length && !impacts.length && T - goneT > 0.5) f.life = 0; }   // (its cracks fade out before it goes)
        else if (ph !== 'end' || T - endT < TUNE.endd) applyPet(dt, frame());
        for (const kd of kids) kd.entY = me.y + (kd.front ? 0.03 : -0.004);
        while (impacts.length && T - impacts[0].t0 > 1.8) impacts.shift(); while (trails.length && trails[0].t1 >= 0 && T - trails[0].t1 > 0.3) trails.shift(); },
      onEnd() { clearPet(); for (const kd of kids) kd.life = 0; parts.length = 0; },
      drawUnder(c, f, X0, Y0, Tz) { drawUnder(c, Tz); },
      draw(c, f, X0, Y0, Tz) { drawOver(c, Tz); } });
    const kids = [H.add({ key: 'mercuryhammerB', life: 30, front: false, entY: me.y - 0.004, drawEnt: c => { if (!pose.front) drawHammer(c); } }), H.add({ key: 'mercuryhammerF', life: 30, front: true, entY: me.y + 0.03, drawEnt: c => { if (pose.front) drawHammer(c); } })];
    F.dbgPh = () => ph; F.dbgK = () => k; F.dbgPose = () => pose; F.dbgFa = () => fa; F.dbgParts = () => parts.length; F.dbgT = () => T;

    /* ================= drawing ================= */
    function hammerParts() {   // the pose on the screen: origin, axes, model origin (true 3D, tiles from the feet)
      if (!pose.q) return null; const A = qAxes(pose.q), G = add3(pose.S, A[2], TUNE.arm * hT), Om = add3(G, A[2], -ZG * sH); return { A, G, Om }; }
    function drawHammer(c) {
      if (ph === 'gone' || !pose.q) return; const Tz = H.X.Tz(), O = origin(), hp = hammerParts(); if (!hp) return;
      const X0 = H.sx(O[0]), Y0 = H.sy(O[1] * SE) - O[2] * CE * Tz;
      const P = { X0, Y0, T: Tz, ax: hp.A, O: hp.Om, s: sH, fx: pose.fx, glow: pose.glow * (tier === 2 ? 1.25 : 1), glow2: pose.glow2 };
      if (!(pose.fx < 0.995)) return;
      if (!HGL.draw(c, P)) draw2D(c, P);
      // the magical grip: amber light wrapped round the handle (a pet without hands holds it this way)
      const FG = gfx(); const gs = scrRel(hp.G), hd = scrRel(add3(hp.G, hp.A[2], 0.3 * sH)), hx = hd[0] - gs[0], hy = hd[1] - gs[1], hl = Math.hypot(hx, hy) || 1, gk = (hands ? 0.22 : 1) * (1 - pose.fx) * (ph === 'summon' ? sm((T - 0.1) / 0.3) : 1);
      if (gk > 0.02) { if (FG) { const Q = FG.begin(c, [scrRel([0, 0, 0])[0], scrRel([0, 0, 0.62 * hT / CE])[1], Tz * 0.42 * hT]), L = 0.15 * sH * Tz * 1.3, Wd = 0.1 * sH * Tz * 1.4; Q.quad(114, gs[0], gs[1], hx / hl * L, hy / hl * L, -hy / hl * Wd, hx / hl * Wd, AMBER, gk, 0.9 + 0.3 * Math.sin(T * 6), 7, 0); if (!hands) { const pt = scrRel([0, 0, (0.5 * hT + (me.z || 0)) / CE]); Q.beam(pt[0], pt[1], gs[0], gs[1], Tz * 0.12, AMBER, 0.35 * gk); } Q.glow(gs[0], gs[1], Tz * 0.55, AMBER, 0.3 * gk); FG.flush(c); }
        else { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * gk; c.strokeStyle = AMBER; c.lineWidth = Math.max(1.5, Tz * 0.06); for (let i = 0; i < 3; i++) { const o = (i - 1) * 0.06 * sH * Tz; c.beginPath(); c.ellipse(gs[0] + hx / hl * o, gs[1] + hy / hl * o, Tz * 0.13 * sH, Tz * 0.06 * sH, Math.atan2(hy, hx) + Math.PI / 2, 0, TAU); c.stroke(); } c.restore(); H.glow(c, gs[0], gs[1], Tz * 0.5, AMBER, 0.35 * gk); } }
    }
    // (no WebGL: a clean 2D hammer, the head's faces painted far to near, the handle under it)
    function draw2D(c, P) { const A = P.ax, s = P.s, k = P.T, pr = w => [P.X0 + w[0] * k, P.Y0 + (w[1] * SE - w[2] * CE) * k], at = (x, y, z) => [P.O[0] + (A[0][0] * x + A[1][0] * y + A[2][0] * z) * s, P.O[1] + (A[0][1] * x + A[1][1] * y + A[2][1] * z) * s, P.O[2] + (A[0][2] * x + A[1][2] * y + A[2][2] * z) * s];
      const al = 1 - P.fx; if (al < 0.02) return; c.save(); c.globalAlpha = al; c.lineJoin = 'round'; c.lineCap = 'round';
      const V = [0, CE, SE], LKv = nrm([-0.55, 0.42, 0.75]), ln = H.line();
      const handle = () => { const a = pr(at(0, 0, -0.25)), b = pr(at(0, 0, ZH - 0.3)); c.strokeStyle = ln; c.lineWidth = 0.2 * s * k + 3; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.strokeStyle = '#2F2A28'; c.lineWidth = 0.17 * s * k; c.stroke();
        for (const z of [0.43, 0.72, 0.99]) { const p = pr(at(0, 0, z)), q = pr(at(0, 0, z + 0.04)); c.strokeStyle = '#B8834A'; c.lineWidth = 0.21 * s * k; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); c.stroke(); }
        const g0 = pr(at(0, 0, 0)), g1 = pr(at(0, 0, 0.4)); c.strokeStyle = '#8A4A2A'; c.lineWidth = 0.17 * s * k; c.beginPath(); c.moveTo(g0[0], g0[1]); c.lineTo(g1[0], g1[1]); c.stroke(); };
      const box = (cx, hx, hy, hz, col) => { const fs = []; for (const [ax, sg] of [[0, 1], [0, -1], [1, 1], [1, -1], [2, 1], [2, -1]]) { const n = [A[ax][0] * sg, A[ax][1] * sg, A[ax][2] * sg]; if (dot(n, V) <= 0) continue; const u = (ax + 1) % 3, v = (ax + 2) % 3, hh = [hx, hy, hz], pts = [];
          for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const q = [0, 0, 0]; q[ax] = sg * hh[ax]; q[u] = su * hh[u]; q[v] = sv * hh[v]; pts.push(pr(at(cx + q[0], q[1], ZH + q[2]))); } fs.push([dot(n, LKv), pts]); }
        for (const [l, pts] of fs) { H.poly(c, pts); c.fillStyle = H.mix(col, l > 0 ? '#FFFFFF' : '#000000', Math.min(0.45, Math.abs(l) * 0.4)); c.fill(); c.strokeStyle = ln; c.lineWidth = 1.5; c.stroke(); } };
      const headD = dot(A[2], V); if (headD < 0) { box(0, HX, HY, HZ, '#C9A47A'); for (const sg of [-1, 1]) { box(sg * 0.6, 0.045, 0.276, 0.296, '#C8D0D8'); box(sg * 0.3, 0.045, 0.306, 0.326, '#B8834A'); } handle(); }
      else { handle(); box(0, HX, HY, HZ, '#C9A47A'); for (const sg of [-1, 1]) { box(sg * 0.6, 0.045, 0.276, 0.296, '#C8D0D8'); box(sg * 0.3, 0.045, 0.306, 0.326, '#B8834A'); } }
      c.restore(); }
    function trailQuad(tr, Tz) {   // the swing's circle on the screen: centre, axes (head at angle 0, the trail toward +v), its radii
      const sw = tr.sw, fr = tr.fr, ci = circOf(sw.kind, fr), cn = Math.hypot(1, Math.hypot(ci.c[0], ci.c[1], ci.c[2])), Rout = (LH + 0.36 * sH) / cn, Rin = (LH - 0.42 * sH) / cn;
      const S0 = add3(origin(), pose.S), ctr = add3(S0, toW(fr, ci.c), LH / cn), a = tr.a, e1 = toW(fr, ci.e1), e2 = toW(fr, ci.e2);
      const u3 = add3([0, 0, 0], add3([0, 0, 0], e1, Math.cos(a)), 1), U3 = add3(u3, e2, Math.sin(a)), V3 = add3(add3([0, 0, 0], e1, Math.sin(a) * tr.s), e2, -Math.cos(a) * tr.s);
      const pc = [H.sx(ctr[0]), H.sy(ctr[1] * SE) - ctr[2] * CE * Tz], pv = v => [v[0] * Rout * Tz, (v[1] * SE - v[2] * CE) * Rout * Tz];
      return { X: pc[0], Y: pc[1], U: pv(U3), V: pv(V3), inner: Rin / Rout }; }
    function drawUnder(c, Tz) {
      const FG = gfx(), t = T;
      // the hammer's contact shadow on the floor
      const hp = hammerParts(); let sh = null; if (hp && ph !== 'gone') { const hd = add3(add3(origin(), hp.G), hp.A[2], (ZH - ZG) * sH), z = Math.max(0, hd[2]); sh = { X: H.sx(hd[0]), Y: H.sy(hd[1] * SE), r: Tz * sH * (0.75 + 0.25 * cl(z / 2)), a: 0.32 * (1 - cl(z / (2.2 * hT))) * (1 - pose.fx) }; }
      if (FG) { const Q = FG.begin(c, null);
        if (sh && sh.a > 0.01) Q.sshadow(sh.X, sh.Y, sh.r * 0.8, sh.r * 0.45, sh.a, '#1C130C');
        for (const im of impacts) { const u = (t - im.t0), X = H.sx(im.x), Y = H.sy(im.y), R = im.R * Tz, fade = 1 - sm((u - 0.9) / 0.9);
          Q.quad(115, X, Y, R * 1.05, 0, 0, R * 1.05 * SE, DUSTD, fade, cl(u / 0.14) * 1.0, im.seed, im.big * (1 - 0.6 * sm((u - 0.6) / 0.9)));   // the cracked, heaved stone
          Q.quad(116, X, Y, R * 1.05, 0, 0, R * 1.05 * SE, AMBER, fade, cl(u / 0.14), im.seed, (0.95 - 0.8 * cl(u / 1.2)) * (0.75 + 0.25 * im.big));   // amber in its cracks
          if (u < 0.75) { const v = u / 0.75; Q.quad(90, X, Y, R * (0.35 + 0.95 * Math.pow(v, 0.55)) * 1.3, 0, 0, R * (0.35 + 0.95 * Math.pow(v, 0.55)) * 1.3 * SE, DUST, 0.6 * (1 - v * v), 0.4 + 0.3 * v, im.seed, v); }   // a rolling dust ring
          if (u < 0.3) { const v = u / 0.3; Q.ring(X, Y, R * (0.2 + 1.0 * Math.pow(v, 0.5)), AMBER_L, 0.6 * (1 - v), R * 0.07, SE); Q.glow(X, Y, R * 0.7, AMBER, 0.45 * (1 - v), SE); } }
        FG.flush(c); return; }
      // (2D) the shadow, cracks and a dust ring
      if (sh && sh.a > 0.01) H.softShadow(c, sh.X, sh.Y, sh.r * 0.8, sh.a);
      for (const im of impacts) { const u = (t - im.t0), X = H.sx(im.x), Y = H.sy(im.y), R = im.R * Tz, fade = 1 - sm((u - 0.9) / 0.9), sp = cl(u / 0.14); c.save(); c.globalAlpha = fade; c.lineCap = 'round';
        for (let i = 0; i < 11; i++) { const b = (i + R1(im.seed + i) * 0.6) / 11 * TAU; c.strokeStyle = 'rgba(40,28,18,0.75)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(X, Y); let px = X, py = Y; for (let j = 1; j <= 4; j++) { const rr = R * sp * j / 4 * (0.6 + 0.4 * R1(im.seed + i * 3 + j)), bb = b + (R1(i * 7 + j) - 0.5) * 0.4; px = X + Math.cos(bb) * rr; py = Y + Math.sin(bb) * rr * SE; c.lineTo(px, py); } c.stroke(); c.strokeStyle = H.rgba(AMBER, 0.6 * (1 - cl(u / 1.2))); c.lineWidth = 1.2; c.stroke(); }
        if (u < 0.75) { const v = u / 0.75; c.globalAlpha = 0.5 * (1 - v); c.strokeStyle = DUST; c.lineWidth = R * 0.15; H.floorEllipse(c, X, Y, R * (0.3 + 0.9 * Math.sqrt(v))); c.stroke(); } c.restore(); }
    }
    function drawOver(c, Tz) {
      const FG = gfx(), t = T, O = origin(), pet = [H.sx(O[0]), H.sy(O[1] * SE) - (0.62 * hT + (me.z || 0)) * Tz, Tz * 0.5 * hT];
      if (FG) { const Q = FG.begin(c, pet);
        // the swing smears and their light
        for (const tr of trails) { const fade = tr.t1 < 0 ? 1 : 1 - cl((t - tr.t1) / 0.3), span = Math.min(2.6, Math.abs(tr.a - tr.a0)) * (tr.t1 < 0 ? 1 : 1 - 0.7 * cl((t - tr.t1) / 0.3)); if (fade < 0.02 || span < 0.05) continue;
          const q = trailQuad(tr, Tz), fin = tr.kind === 'smash', heavy = fin ? 1.25 : tr.kind === 'broad' ? 1.1 : 1;
          Q.quad(112, q.X, q.Y, q.U[0], q.U[1], q.V[0], q.V[1], fin ? '#C7A27A' : '#BC9C78', 0.85 * fade * heavy, span, q.inner, 3 + tr.sw.i * 5.7);
          Q.quad(113, q.X, q.Y, q.U[0], q.U[1], q.V[0], q.V[1], fin ? AMBER_L : CHAMP, fade, span, q.inner + 0.1, (fin ? 1.2 : 0.85) * (tier === 2 ? 1.15 : 1)); }
        // particles: the forming fragments, dust, chips and shards, sparks, glints
        for (const p of parts) { const u = p.t / p.life;
          if (p.k === 'form') { const hp = hammerParts(); if (!hp) continue; const tgt = add3(add3(add3(add3(origin(), hp.G), hp.A[2], (ZH - ZG) * sH), hp.A[0], p.off[0] * sH), hp.A[1], p.off[1] * sH), e = sm(u), x = lerp(p.x, tgt[0], e), d = lerp(p.d, tgt[1], e), z = lerp(0, tgt[2] + p.off[2] * sH, e) + Math.sin(e * Math.PI) * 0.5, s = scrAbs(x, d, z);
            Q.rq(85, s[0], s[1], p.s * Tz * 2.2, p.s * Tz * 2.2, p.rot + e * 6, '#FFFFFF', sm(u / 0.2) * (1 - sm((u - 0.85) / 0.15)), p.rot + e * 6, p.seed, p.md + 0.9 * 0.6); continue; }
          const s = scrAbs(p.x, p.d, p.z);
          if (p.k === 'dust') { const r = p.s * Tz * (1 + p.grow * u); Q.quad(84, s[0], s[1], r, 0, 0, r, DUST, 0.5 * (1 - u) * sm(u / 0.1), u, p.seed, 0); }
          else if (p.k === 'chip') Q.rq(85, s[0], s[1], p.s * Tz * 2, p.s * Tz * 2, p.rot, '#FFFFFF', 1 - sm((u - 0.7) / 0.3), p.rot, p.seed, p.md + 0.9 * Math.min(0.99, p.glow));
          else if (p.k === 'spark') { const s2 = scrAbs(p.x - p.vx * 0.03, p.d - p.vd * 0.03, p.z - p.vz * 0.03); Q.beam(s2[0], s2[1], s[0], s[1], Tz * 0.04, SPARK, 1 - u); Q.star(s[0], s[1], Tz * 0.08, 0.8 * (1 - u), '#FFF2D0'); }
          else if (p.k === 'glint') { Q.star(s[0], s[1], Tz * (0.1 + 0.08 * Math.sin(p.t * 20 + p.seed)), 1 - u, '#FFF1D0'); Q.rq(85, s[0], s[1], p.s * Tz * 2, p.s * Tz * 2.4, p.rot, '#FFFFFF', 1 - sm((u - 0.7) / 0.3), p.rot, p.seed, 2 + 0.9 * 0.8); } }
        // the steel's flash at the finisher's contact
        if (t - impT < 0.25 && impacts.length) { const im = impacts[impacts.length - 1], v = (t - impT) / 0.25, X = H.sx(im.x), Y = H.sy(im.y) - Tz * 0.3; Q.star(X, Y, Tz * (0.7 + 0.25 * tier) * (1 - v * 0.5), 0.75 * (1 - v), '#FFF4DC'); Q.glow(X, Y, Tz * 1.0, AMBER, 0.3 * (1 - v)); }
        FG.flush(c); return; }
      // (2D) smears as soft arcs, particles as small shapes
      for (const tr of trails) { const fade = tr.t1 < 0 ? 1 : 1 - cl((t - tr.t1) / 0.3), span = Math.min(2.6, Math.abs(tr.a - tr.a0)); if (fade < 0.02 || span < 0.05) continue; const q = trailQuad(tr, Tz);
        c.save(); c.transform(q.U[0], q.U[1], q.V[0], q.V[1], q.X, q.Y); c.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a0 = i / 6 * span, a1 = (i + 1) / 6 * span; c.strokeStyle = H.rgba(i ? '#BC9C78' : CHAMP, 0.45 * fade * (1 - i / 6)); c.lineWidth = (1 - q.inner) * 0.9; c.beginPath(); c.arc(0, 0, (1 + q.inner) / 2, a0, a1); c.stroke(); } c.restore(); }
      for (const p of parts) { const u = p.t / p.life; if (p.k === 'form') continue; const s = scrAbs(p.x, p.d, p.z);
        if (p.k === 'dust') { c.fillStyle = H.rgba(DUST, 0.35 * (1 - u)); c.beginPath(); c.arc(s[0], s[1], p.s * Tz * (1 + p.grow * u), 0, TAU); c.fill(); }
        else if (p.k === 'spark' || p.k === 'glint') H.glow(c, s[0], s[1], Tz * 0.15, p.k === 'spark' ? SPARK : CHAMP, 1 - u);
        else { c.save(); c.translate(s[0], s[1]); c.rotate(p.rot); c.globalAlpha = 1 - sm((u - 0.7) / 0.3); c.fillStyle = p.md === 2 ? CHAMP : p.md === 5 ? SAND : '#6B5A4A'; const r = p.s * Tz * 1.6; c.beginPath(); c.moveTo(-r, -r * 0.4); c.lineTo(0, -r); c.lineTo(r, -r * 0.2); c.lineTo(r * 0.5, r * 0.8); c.lineTo(-r * 0.6, r * 0.6); c.closePath(); c.fill(); c.restore(); } }
    }
    // (which side of the pet the hammer is drawn on: in front when its head and grip come toward the viewer)
    const frontUpd = () => { const hp = hammerParts(); if (!hp) return; const hd = add3(hp.G, hp.A[2], (ZH - ZG) * sH * 0.6); pose.front = hd[1] > 0.06 * hT; };
    const upd0 = F.update; F.update = (dt, f) => { upd0(dt, f); frontUpd(); };
    return F;
  };
  S.mercuryhammer.__dbg = { TUNE, HGL, build, qOf, qAxes, slerp };
})();
