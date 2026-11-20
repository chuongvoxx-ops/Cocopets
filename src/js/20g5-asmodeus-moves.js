/* ---------- (v436 AS) Asmodeus, The Fester, in a fight: Venom Debt, four powers and The Seventh Sin ----------
   Summoned, Asmodeus (the Scorpio Anima, 02e; its model 02f6) fights through the Anima cycle (20g-dun-anima.js calls tick / fin / update
   and the draw hooks below). The summon rules (the user's): 30 s on the field, counted from when it is combat-ready (the entrance - the
   Scorpio sigil, its filaments, the cocoon rising and cracking, the seven stingers unfolding one by one, the legs, the torso, the Crucible
   waking, the mask lifting, the crown spreading, the pulse - is not counted); no cooldown on any power; it fights on its own; at the end of
   its time its attacks stop, The Seventh Sin fires once, and it leaves only when the ultimate's last frame is done. Whenever it is free
   (one power at a time, each with anticipation, mechanical preparation, build-up, the action, the impact and the recovery) its mind weighs
   the field:
     Sevenfold Perdition  a single high-priority target (or debt to build): it anchors its legs, its tails rise, the channels light one by
                          one as venom runs from the Crucible to the blades, then the stingers strike in turn, each on its own arc, a
                          crimson trail behind it, a crystal burst on the hit, a stack of Venom Debt (3 / 5 strikes, level 4 across several
                          monsters; level 7: 7, then all seven impale at once: a large explosion and one more stack).
     Crimson Labyrinth    a crowd: it rises tall, arms lifted, stingers reaching out; ruby filaments run from the tips over the floor and
                          join into a heptagonal web; crystal spikes rise, runed rings hang over it and turn; everything inside is slowed
                          and drawn toward the middle (bosses only slowed), takes venom along the wires and gains debt (5 / 7 / 9 s;
                          level 4 larger and pulling harder; level 7 more layers and -20% defence: +20% damage taken, bosses +10%).
     Eclipse Molt         a monster close and about to strike (or crowding it): it stops dead, its tails fold round it, its armour
                          cracks crimson, the Crucible flashes; it sheds a spectral crystal shell where it stood and vanishes into
                          black-violet motes (unseen), reappears behind a chosen monster with a heavy stinger blow; the shell(s) (1 / 2 /
                          3: level 7 set round the nearest monsters) burst into crystal shards a moment later (Dark damage, debt).
     Scarlet Rupture      monsters carrying debt: its tails rise and curve in, their blades a ring over its head, the Crucible races,
                          venom pours up every channel, a great ruby crystal forms in the ring and swells; it shatters: waves of crystal
                          blades sweep out (1 / 2 / 3 with different paths; level 7 ends in a colossal eruption). Every stack on a monster
                          struck adds to the blow; a full seal (7) is consumed in a corruption detonation (leaving one stack, so the debt
                          is still there for the ultimate).
   Venom Debt: up to 7 stacks a monster (m.asDebt), each one ticking Dark/Poison damage (half on a boss), the game's own venom status on
   every stinger blow; its mark over the monster grows with the stacks into the complete scorpion seal; it decays a stack at a time once
   it is left alone, and is cleared on death, when consumed, when the summon ends and on stop(). Detonations on a boss are capped.
   The Seventh Sin (six phases, ~13.4 s: the Seven Seals, the Scarlet Cathedral, the Forbidden Bloom, the Seventh Sting, the Crimson
   Testament, the Last Whisper): the stingers rise and light in turn, seven runic circles, the world darkens and the camera turns; the tails
   unfold to their full length and part into a cathedral arch with filaments between them under turning rings; the Crucible opens and its
   heart rises into a flower of seven petals; the seven stingers fall one by one on the marked (an eruption, crossing fractures, a circular
   blast, rising blades, a corruption field, a runic shockwave) and the seventh with all of them at once (a pillar of light); the crown
   collapses inward, a silence, then the ruby detonation that consumes every stack left (its bonus grows with them, capped on bosses);
   the cathedral falls apart, the legs dissolve first, the Crucible last, a single ruby spark.
   Every number a design choice is in CFG. Without the GPU painter the powers still act in full, shown with the game's own particles.
   lowFx halves the debris, the shells are drawn in their low profile and the costliest layers are dropped.
   Pure hooks for a boss (no game state touched): ASMODEUS_MOVES.poseFor(kind, t, o) / easePose(store, tg, dt) / ultPose(t, o) / strikeE /
   UT / CFG; create(H) with H.noAuto (the mind never picks: the controller calls cast) and H.stand (it never walks to guard); on an
   instance: cast(a, kind, o) / interrupt(a), fx (the effect records), drawFxList(c, list, ground), drawSin(c, o) (the ultimate's picture at
   a scene o = { x, y, t, k, seed }), bodyLight(c, r, P, alpha, at), burstFx(x, y, k), waveFx(x, y, R), addDebt(m, n) / debtOf(m). */
const ASMODEUS_MOVES = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t)), settle = (t, t0, f, k) => (t > t0 ? Math.exp(-(t - t0) * k) * Math.sin((t - t0) * f) : 0);
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const FSY = 0.55, BIG = 1.0;
  /* ---- the numbers (damage multipliers times the Anima's power P = the pet's attack x ANIMA_POWER[form] (x 2 awakened); [a, b, c] by form) ---- */
  const CFG = {
    life: 30,
    walk: { speed: 3.0, acc: 3.0, burst: 1.9, turn: 3.0 },
    debt: { max: 7, life: 8, decay: 1.2, tick: 0.5, dot: 0.045, bossDot: 0.5, det: 0.55, capBoss: 0.04, capUltBoss: 0.07 },
    perd: { n: [3, 5, 7], wind: 0.62, gap: 0.3, dmg: 0.72, reach: 2.4, fin: 1.5, finR: 2.4, rec: 0.5, multi: [1, 3, 4] },
    lab: { dur: [5, 7, 9], R: [3.0, 3.8, 4.4], pull: [0.35, 0.8, 1.05], cast: 1.15, tick: 0.5, dmg: 0.1, stackEvery: 1.6, def: 0.2, defBoss: 0.1, slow: 0.35 },
    molt: { shells: [1, 2, 3], still: 0.22, fold: 0.5, vanish: 0.78, appear: 1.08, strike: 1.3, blow: 2.05, end: 2.35, dmg: 1.9, shellDmg: 1.15, shellR: 2.1, stacks: 2 },
    rupt: { conv: 0.55, grow: 1.45, shatter: 1.62, waves: [1, 2, 3], gap: 0.34, R: [4.8, 5.6, 6.4], speed: 9, dmg: 0.95, bonus: 0.12, erupt: 2.6, eruptR: 3.0, rec: 0.6 },
    ult: { r: 11, strike: 1.5, strikeR: 2.0, fin: 3.0, finR: 3.6, det: 4.0, detR: 11, perStack: 0.55, weak: 6, weakK: 1.15 },
  };
  /* the ultimate's timeline (s): the Seven Seals to p2, the Scarlet Cathedral to p3, the Forbidden Bloom to p4, the Seventh Sting (strikes s,
     the seventh with all at s7) to p5, the Crimson Testament (the collapse at col, a silence, the detonation at det) to p6, the Last Whisper to len */
  const UT = { p2: 2.2, p3: 4.4, p4: 6.4, s: [6.9, 7.25, 7.6, 7.95, 8.3, 8.65], s7: 9.1, p5: 9.6, col: 10.05, det: 10.45, p6: 11.0, len: 13.4 };
  const COL = { crim: '#FF2A4A', ruby: '#E0103A', pink: '#FF8AA8', violet: '#9A3AFF', gold: '#FFC24D', white: '#FFE6EE', dark: '#12060C', smoke: '#1A0A14' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const GLA = () => (typeof ASMODEUS_GL !== 'undefined' ? ASMODEUS_GL : null);
  /* a stinger's extension through one strike at t0: a quick cock and lunge, the hit at t0, a recoil and the retraction */
  const strikeE = (t, t0, out) => sstep(t0 - 0.2, t0 - 0.02, t) * (1 - sstep(t0 + 0.06, t0 + (out || 0.34), t));

  /* ---- the power poses (pure: shared with a boss): poseFor(kind, t, o) the pose a power holds t s into it (kind 'perd' | 'lab' | 'molt' |
     'rupt' | 'rise'; anything else: rest); o: base (an idlePose), n, wind, gap, k, aims ([{ i, A }]: the tails' targets in tail space).
     Each in the same beats, its own curve: the stance, the weight shift (anticipation), the machinery (the tails rising, the channels), the
     build (the Crucible, the flow), the action, the reaction, the return (a damped settle). Strikes are not eased (tg.strikes) ---- */
  function poseFor(kind, t, o) {
    o = o || {}; const base = o.base || {};
    const tg = { head: 0, look: 0, tilt: 0, jaw: 0, eye: 1, arm: 0, reach: 0, crouch: 0, rear: 0, lean: 0, spread: 0, crown: 0, cage: 0, raise: 0, conv: 0, cath: 0, sep: 0, seq: 0, threat: 0, tele: 0, lash: 1,
      core: base.core == null ? 0.9 : base.core, spin: 1, open: 0, heartUp: 0, bloom: 0, rupt: 0, crack: 0, glow: 0, live: 1, flow: 0.5, bladeHeat: 0, pitch: 0, dx: 0, stagger: o.stag || 0, strikes: null };
    const aims = o.aims || [];
    if (kind === 'perd') { const w = o.wind || CFG.perd.wind, n = o.n || 3, gap = o.gap || CFG.perd.gap, last = w + (n - 1) * gap, fin = o.k >= 3 ? last + 0.42 : -9, end = (o.k >= 3 ? fin : last) + 0.55;
      const an = sstep(0, 0.25, t) * (1 - sstep(end - 0.35, end, t)), lit = sstep(0.05, w, t), fe = o.k >= 3 ? strikeE(t, fin, 0.5) : 0, rv = settle(t, end - 0.3, 7, 3.5);
      tg.crouch = 0.35 * an + 0.25 * fe; tg.spread = 0.45 * an; tg.raise = 0.55 * an * (1 - fe); tg.seq = 7 * lit * (1 - sstep(end - 0.4, end, t)); tg.flow = 0.5 + 0.5 * lit; tg.head = 0.18 * an + 0.12 * rv; tg.jaw = 0.15 * an + 0.6 * fe; tg.arm = 0.25 * an; tg.reach = 0.35 * fe;
      tg.core += 0.6 * lit + 0.9 * fe; tg.glow = 0.15 * lit + 0.4 * fe; tg.live = 1 - 0.6 * an; tg.bladeHeat = 0.4 * lit + fe; tg.threat = an;
      const S = []; for (let i = 0; i < n; i++) { const am = aims[i % Math.max(1, aims.length)]; if (!am) continue; const e = strikeE(t, w + i * gap); if (e > 0.003) S.push({ i: am.i, A: am.A, e }); }
      if (fe > 0.003) for (let j = 0; j < 7; j++) { const am = aims[j % Math.max(1, aims.length)]; if (am) S.push({ i: j, A: am.Af || am.A, e: fe }); }
      tg.strikes = S.length ? S : null; }
    else if (kind === 'lab') { const c = o.cast || CFG.lab.cast, up = sstep(0, 0.4, t) * (1 - sstep(c, c + 0.5, t)), rch = bump(t, 0.2, 0.45, c - 0.25, c), rv = settle(t, c + 0.3, 6, 3);
      tg.rear = 0.8 * up; tg.arm = up; tg.crown = 0.55 * up; tg.jaw = 0.35 * up; tg.core += 1.1 * up; tg.flow = 0.5 + 0.5 * up; tg.seq = 7 * sstep(0.05, 0.5, t) * (1 - sstep(c, c + 0.4, t)); tg.live = 1 - 0.5 * up; tg.glow = 0.3 * up; tg.head = -0.25 * up + 0.1 * rv; tg.spread = 0.3 * up;
      const S = []; for (const am of aims) if (rch > 0.003) S.push({ i: am.i, A: am.A, e: rch * 0.85 }); tg.strikes = S.length ? S : null; }
    else if (kind === 'molt') { const C = CFG.molt, still = sstep(0, 0.08, t) * (1 - sstep(C.vanish, C.vanish + 0.1, t)), fold = sstep(C.still, C.fold, t) * (1 - sstep(C.appear, C.appear + 0.3, t)), ck = sstep(C.still + 0.05, C.vanish - 0.05, t) * (1 - sstep(C.vanish, C.appear, t));
      const fl = bump(t, C.vanish - 0.12, C.vanish - 0.03, C.vanish, C.vanish + 0.1), ap = sstep(C.appear, C.appear + 0.15, t), se = strikeE(t, C.strike, 0.45), rv = settle(t, C.strike + 0.35, 7, 3);
      tg.live = 1 - 0.95 * still; tg.cage = fold; tg.crack = ck; tg.core += 2.2 * fl + 0.6 * ck; tg.glow = 0.6 * fl; tg.crouch = 0.25 * fold + 0.55 * se * ap + 0.15 * (1 - ap) * 0; tg.head = 0.2 * fold + 0.3 * se + 0.1 * rv; tg.jaw = 0.7 * se; tg.reach = 0.5 * se; tg.bladeHeat = se;
      const am = aims[0]; tg.strikes = am && se > 0.003 ? [{ i: am.i, A: am.A, e: se }, { i: (am.i + 2) % 7, A: am.A, e: se * 0.8 }] : null; }
    else if (kind === 'rupt') { const C = CFG.rupt, cv = sstep(0.05, C.conv, t) * (1 - sstep(C.shatter, C.shatter + 0.25, t)), gr = sstep(C.conv - 0.1, C.grow, t), sh = bump(t, C.shatter - 0.02, C.shatter + 0.06, C.shatter + 0.3, C.shatter + 0.75), end = C.shatter + 0.9, rv = settle(t, end, 6, 3);
      tg.conv = cv; tg.rupt = gr * (1 - sstep(C.shatter, C.shatter + 0.04, t)) * (1 + 0.1 * Math.sin(t * 30) * gr); tg.rear = 0.6 * cv; tg.arm = 0.8 * cv; tg.core += 1.6 * cv + 1.2 * gr; tg.spin = 1 + 4 * gr; tg.seq = 7 * cv; tg.flow = 0.5 + 0.5 * cv; tg.jaw = 0.5 * gr + 0.4 * sh;
      tg.crown = 1.0 * sh; tg.crouch = 0.6 * sh; tg.head = -0.3 * cv + 0.35 * sh + 0.1 * rv; tg.glow = 0.4 * gr + 0.3 * sh; tg.live = 1 - 0.7 * cv; tg.bladeHeat = gr + sh; tg.spread = 0.5 * sh + 0.2 * cv; }
    else if (kind === 'rise') { const sp = bump(t, 0.05, 0.3, 0.55, 0.95), pu = bump(t, 0.25, 0.35, 0.45, 0.8); tg.crown = sp; tg.rear = 0.4 * sp; tg.core += 1.4 * pu; tg.arm = 0.5 * sp; tg.jaw = 0.4 * pu; tg.glow = 0.4 * pu; tg.seq = 7 * sp; tg.flow = 0.5 + 0.5 * sp; tg.live = 1 - 0.5 * sp; }
    return tg;
  }
  const PZK = ['head', 'look', 'tilt', 'jaw', 'eye', 'arm', 'reach', 'crouch', 'rear', 'lean', 'spread', 'crown', 'cage', 'raise', 'conv', 'cath', 'sep', 'seq', 'threat', 'tele', 'lash', 'core', 'spin', 'open', 'heartUp', 'bloom', 'rupt', 'crack', 'glow', 'live', 'flow', 'bladeHeat', 'pitch', 'dx', 'stagger'];
  // each key's stiffness (a critically damped spring's angular frequency): the jaw and the stagger quickest, the body's weight slower, the tails' great changes mechanical
  const PZW = { jaw: 24, stagger: 26, head: 13, look: 9, tilt: 8, crouch: 14, rear: 9, lean: 10, spread: 7, crown: 7, cage: 9, raise: 7, conv: 6.5, cath: 4.5, sep: 5, seq: 14, threat: 6, tele: 6, core: 10, spin: 6, open: 5, heartUp: 4, bloom: 4, rupt: 9, crack: 9, glow: 10, live: 8, flow: 6, bladeHeat: 8, arm: 8, reach: 12, eye: 10, pitch: 18, dx: 12, lash: 6 };
  const ONE = { live: 1, spin: 1, eye: 1, lash: 1, flow: 0.5 };
  function easePose(store, tg, dt) {
    let pz = store.pz; if (!pz) pz = store.pz = Object.assign({}, tg); let pv = store.pzv; if (!pv) pv = store.pzv = {};
    dt = Math.max(0, Math.min(0.1, dt || 0));
    for (let j = 0; j < PZK.length; j++) { const q = PZK[j], g = tg[q] == null ? (ONE[q] || 0) : tg[q]; if (pz[q] == null) pz[q] = g; const v = pv[q] || 0;
      const w = PZW[q] || 7.5, e = Math.exp(-w * dt), d = pz[q] - g, jv = (v + w * d) * dt; pz[q] = g + (d + jv) * e; pv[q] = (v - jv * w) * e; }
    pz.strikes = tg.strikes || null; return pz;
  }
  /* the ultimate's pose at t (pure); o.aims: the seven strikes' targets in tail space ([{ i, A }]), o.ctr: the centre's (the seventh) */
  function ultPose(t, o) {
    const U = UT, aims = (o && o.aims) || [], p1 = sstep(0, U.p2, t), p2 = sstep(U.p2, U.p3 - 0.4, t), bl = sstep(U.p3, U.p4 - 0.2, t), hu = sstep(U.p3 - 0.2, U.p3 + 0.9, t);
    const st4 = sstep(U.p4 - 0.2, U.s[0] - 0.25, t) * (1 - sstep(U.p5, U.p5 + 0.3, t)), re = sstep(U.p5, U.col, t) * (1 - sstep(U.col, U.det, t)), col = bump(t, U.col - 0.1, U.det - 0.05, U.det, U.det + 0.2), boom = bump(t, U.det, U.det + 0.08, U.det + 0.3, U.p6);
    const p6 = sstep(U.p6, U.len, t), keep = 1 - sstep(U.p6, U.p6 + 1.2, t), fall = sstep(U.p6, U.p6 + 0.8, t);
    const S = [];
    for (let i = 0; i < 6; i++) { const am = aims[i]; if (!am) continue; const e = strikeE(t, U.s[i], 0.32) * 1.0; if (e > 0.003) S.push({ i: am.i, A: am.A, e }); }
    { const e7 = strikeE(t, U.s7, 0.45); if (e7 > 0.003) for (let j = 0; j < 7; j++) S.push({ i: j, A: (o && o.ctr) || [7, 0, 0], e: e7 }); }
    const cathA = p2 * (1 - st4 * 0.85) + re * 0.8 - col * 0.6;
    return { head: 0.15 * p1 * (1 - p2) - 0.35 * p2 * (1 - st4) + 0.2 * st4 - 0.3 * col + 0.55 * p6, look: 0, tilt: 0, jaw: 0.3 * p1 + 0.5 * p2 * (1 - p6) + 0.4 * boom, eye: 1 + p1 + p2 + boom,
      arm: 0.6 * p1 + 0.4 * p2 * keep, reach: 0.3 * st4, crouch: 0.3 * col + 0.4 * boom + 0.25 * p6, rear: 0.7 * p1 * (1 - 0.6 * col) * keep, lean: 0, spread: 0.4 * p1 * keep,
      crown: 0, cage: 0, raise: p1 * (1 - p2) + st4 * 0.6, conv: col * 0.9, cath: Math.max(0, cathA) * (1 - fall), sep: 0.6 * p2 * (1 - st4) * (1 - fall) + 0.3 * re, seq: 7 * sstep(0.2, U.p2 - 0.2, t) * (1 - p6), threat: 0, tele: 0.3 * st4, lash: 1 - 0.6 * p1,
      core: 0.9 + 1.5 * p1 + 1.0 * p2 + 1.5 * bl + 2 * col + 2.5 * boom - 4 * p6 + 0.7 * Math.sin(t * (6 + 10 * p1)) * p1 * (1 - p2), spin: 1 + 3 * p1 + 5 * re, open: (p2 * 0.4 + hu) * (1 - fall), heartUp: hu * (1 - sstep(U.p5, U.col, t) * 0.4) * (1 - fall), bloom: bl * (1 - sstep(U.p5, U.det, t)),
      rupt: 0, crack: 0, glow: 0.2 * p1 + 0.3 * p2 + 0.6 * boom - 0.6 * p6, live: 0.3 + 0.7 * p6 * 0.5, flow: 0.5 + 0.5 * p1, bladeHeat: 0.5 * p1 + st4 + boom, pitch: 0, dx: 0, stagger: 0, strikes: S.length ? S : null,
      yawOff: 0.55 * Math.sin(Math.PI * sstep(0, U.p4, t)) * (1 - st4), dis: sstep(U.len - 1.9, U.len - 0.15, t) };
  }

  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = H.T, ST = H.ST, S = H.S;
    const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
    const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
    const glOn = () => { const G = GLA(); return !!(G && G.usable()); };
    const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
    const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
    const sfx = n => { try { if (X.sfx && X.sfx[n]) X.sfx[n](); } catch (e) {} };
    const FX = [];                  // effects in the world: { kind, t, life, ... }
    const DEBT = new Set();         // the monsters carrying Venom Debt
    let UL = null;                  // The Seventh Sin in progress
    let released = true;
    const kOf = a => Math.max(1, Math.min(3, a.k | 0)), LQ = () => (lowFx() ? 0.5 : 1);
    const list = () => S.list.filter(a => a.id === 'scorpio');
    /* model units -> tiles */
    const HT = [0, 22.0, 22.6, 23.2];
    const u2t = a => { const aw = a.st === 'awaken' || (UL && UL.a === a), kv = aw ? 3 : kOf(a), G = GLA(); return ANIMA_SIZE[kv] * (aw ? 1.18 : 1) * BIG / ((G && G.HEIGHT) || HT)[kv]; };
    const stride = a => ((GLA() && GLA().STRIDE) || 4.4) * u2t(a);
    function footW(a, i) { const G = GLA(), u = u2t(a), y = a.as.yaw, hm = G ? G.homeOf(i, { spread: 0 }) : [Math.cos(i) * 9, Math.sin(i) * 9]; return { x: a.x + (hm[0] * Math.cos(y) - hm[1] * Math.sin(y)) * u, y: a.y + (hm[0] * Math.sin(y) + hm[1] * Math.cos(y)) * u }; }
    /* a point on the floor (tiles) in the tails' space (for a strike's aim), its reach clamped to what the tails can telescope to */
    function aimAt(a, x, y, z) { const G = GLA(), u = u2t(a), yw = a.as.yaw, dx = (x - a.x) / u, dy = (y - a.y) / u, mx = dx * Math.cos(yw) + dy * Math.sin(yw), my = -dx * Math.sin(yw) + dy * Math.cos(yw);
      let p = G ? G.toTail([mx, my, z == null ? 0.6 : z]) : [mx, my, 2]; const R0 = [-0.8, 0, 13], dd = [p[0] - R0[0], p[1] - R0[1], p[2] - R0[2]], L = Math.hypot(dd[0], dd[1], dd[2]), mxL = 19;
      if (L > mxL) p = [R0[0] + dd[0] / L * mxL, R0[1] + dd[1] / L * mxL, R0[2] + dd[2] / L * mxL]; return p; }
    const tailFor = (a, x, y) => { const yw = a.as.yaw, rel = angD(Math.atan2(y - a.y, x - a.x), yw); return Math.max(0, Math.min(6, Math.round(3 + rel / 0.55))); };
    /* ---- its power, its blows; Venom Debt ---- */
    const pw = a => H.P(a);
    function hitM(a, m, d, o) { return H.hit(m, d, Object.assign({ el: 'shadow' }, o || {})); }
    function addDebt(m, n, a) { if (!m || m.dead || !(n > 0)) return; const was = m.asDebt || 0; m.asDebt = Math.min(CFG.debt.max, was + n); m.asDebtT = g.t + CFG.debt.life; m.asDebtFl = 1; if (a) m.asDebtP = pw(a);
      if (!DEBT.has(m)) { DEBT.add(m); m.asDebtTk = CFG.debt.tick; } if (was < 7 && m.asDebt >= 7) X.text(m.x, m.y - m.r - 1.0, 'SEALED', COL.pink, 12, { life: 0.9 }); }
    const debtOf = m => (m && !m.dead && m.asDebt) || 0;
    function dropDebt(m) { m.asDebt = 0; m.asDebtT = 0; DEBT.delete(m); }
    /* a corruption detonation: every stack consumed for Dark/Poison damage (k the occasion's weight), capped on a boss; leave: stacks left after */
    function detonate(a, m, k, cap, leave) { const s = debtOf(m); if (!s) return 0; let d = pw(a) * CFG.debt.det * s * k; if (m.boss) d = Math.min(d, m.maxhp * (cap || CFG.debt.capBoss)); hitM(a, m, d, { noCrit: true, big: true });
      FX.push({ kind: 'det', x: m.x, y: m.y, t: 0, life: 0.7, n: s, seed: Math.random() * 40 }); if (leave) { m.asDebt = leave; m.asDebtT = g.t + CFG.debt.life; } else dropDebt(m); return s; }
    function debtTick(dt) { const a = list()[0];
      for (const m of DEBT) { if (m.dead || m.falling || !(m.asDebt > 0)) { dropDebt(m); continue; }
        m.asDebtFl = Math.max(0, (m.asDebtFl || 0) - dt * 2.5); m.asDebtTk -= dt;
        if (m.asDebtTk <= 0) { m.asDebtTk = CFG.debt.tick; const P = a ? pw(a) : (m.asDebtP || ST().atk); H.hit(m, P * CFG.debt.dot * m.asDebt * (m.boss ? CFG.debt.bossDot : 1), { dot: true, el: 'shadow', dotC: '#FF5A7A', noAggro: true }); }
        if (g.t > m.asDebtT) { m.asDebt--; m.asDebtT = g.t + CFG.debt.decay; if (m.asDebt <= 0) dropDebt(m); } } }
    function clearDebt() { for (const m of DEBT) { m.asDebt = 0; m.asDebtT = 0; m.asDefT = 0; } DEBT.clear(); }
    /* ---- state ---- */
    function stOf(a) { return a.as || (a.as = { act: null, last: null, last2: null, pz: null, yaw: Math.PI / 2 - 0.3, yawT: null, ph: 0, mv: 0, run: 0, mvA: Math.PI / 2, vx: 0, vy: 0, stag: 0, first: false, en: -1, gap: 0, ready: false, sn: 0, thudT: 0, struck: false, aims: null }); }
    function crowd(x, y, reach, rr) {
      const tg = H.near(x, y, reach); if (!tg.length) return null; let best = null, bn = -1;
      for (const m of tg) { const nb = tg.filter(q => Math.hypot(q.x - m.x, q.y - m.y) < rr); if (nb.length > bn) { bn = nb.length; best = nb; } }
      return { x: best.reduce((s, m) => s + m.x, 0) / best.length, y: best.reduce((s, m) => s + m.y, 0) / best.length, n: best.length, m: best[0], list: best };
    }
    /* the way it faces: toward its quarry, but always turned a little to the viewer (its crown of stingers reads front-on) */
    const faceTo = (a, x, y) => { const an = Math.atan2(y - a.y, x - a.x), d = angD(an, Math.PI / 2); return Math.PI / 2 + Math.max(-1.05, Math.min(1.05, d * 0.6)); };
    /* ---- moving: it glides on its six legs in any direction under its body (the feet carry it), quick bursts when it closes in ---- */
    function stepTo(a, dt, tx, ty, vmax) {
      const ab = a.as, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), want = d > 0.25 ? Math.min(vmax, d * 1.6) : 0, acc = Math.min(1, dt * CFG.walk.acc);
      ab.vx += ((d > 0.25 ? dx / d * want : 0) - ab.vx) * acc; ab.vy += ((d > 0.25 ? dy / d * want : 0) - ab.vy) * acc; moveBy(a, ab.vx * dt, ab.vy * dt);
    }
    function moveBy(a, mx, my) { const ab = a.as, p = X.walkPoint(a.x + mx, a.y + my, { r: 0.6, mv: 0, x: a.x, y: a.y }), dd = Math.hypot(p.x - a.x, p.y - a.y); a.x = p.x; a.y = p.y;
      if (dd > 1e-4) ab.mvA += angD(Math.atan2(my, mx), ab.mvA) * 0.5;
      const ph0 = ab.ph; ab.ph += dd / Math.max(0.05, stride(a) * Math.max(0.3, ab.mv)) * TAU; footfalls(a, ph0, ab.ph); return dd; }
    function footfalls(a, ph0, ph1) { const G = GLA(); if (!G) return; const ab = a.as;
      for (const f of G.footfalls(ph0, ph1, ab.run)) { const p = footW(a, f.i); if (ab.mv > 0.2) FX.push({ kind: 'foot', x: p.x, y: p.y, R: 0.5 + 0.2 * ab.run, t: 0, life: 0.6, seed: Math.random() * 50 });
        if (ab.mv > 0.5 && f.f > 0.6 && ab.thudT <= 0) { sfx('thud'); ab.thudT = 0.5; } } }
    function idleSteps(a) { const ab = a.as, M = a.asM; if (!M || M.n === ab.sn) return; ab.sn = M.n; for (const s of M.steps) if (s.idle) { const p = footW(a, s.i); FX.push({ kind: 'foot', x: p.x, y: p.y, R: 0.4, t: 0, life: 0.55, seed: Math.random() * 50, small: 1 }); } }
    function guard(a, dt) {
      const ab = a.as; if (H.stand) { ab.vx *= 1 - Math.min(1, dt * 4); ab.vy *= 1 - Math.min(1, dt * 4); return; }
      const side = a.side || -1, dp = Math.hypot(me.x - a.x, me.y - a.y);
      if (dp > 14) { const p = X.walkPoint(me.x + side * 2.4, me.y - 1.0, { r: 0.6, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y; ab.vx = ab.vy = 0; return; }
      const f = H.near(a.x, a.y, 9)[0]; let tx = me.x + side * 2.6 + (me.vx || 0) * 0.4, ty = me.y - 1.1 + (me.vy || 0) * 0.4;
      if (f) { tx = lerp(tx, f.x, 0.45); ty = lerp(ty, f.y, 0.45); ab.yawT = faceTo(a, f.x, f.y); } else ab.yawT = Math.PI / 2 - 0.3 * side;
      if (Math.hypot(tx - a.x, ty - a.y) < 0.8) { ab.vx *= 1 - Math.min(1, dt * 3); ab.vy *= 1 - Math.min(1, dt * 3); moveBy(a, ab.vx * dt, ab.vy * dt); return; }
      stepTo(a, dt, tx, ty, CFG.walk.speed * (dp > 6 ? 1.5 : 1));
    }
    /* ---- the mind: no cooldowns; when free it weighs the field (a bias against repeating itself, a little chance: never a fixed rotation) ---- */
    const labOn = () => FX.some(f => f.kind === 'lab' && f.t < f.life - 0.6);
    const inLab = m => FX.some(f => f.kind === 'lab' && f.t < f.life - 0.3 && Math.hypot(m.x - f.x, m.y - f.y) < f.R);
    function choose(a) {
      const ab = a.as, k = kOf(a), foes = H.near(a.x, a.y, 11); if (!foes.length) return null;
      const boss = foes.find(m => m.boss), opts = [], c = crowd(a.x, a.y, 9, 2.6), nDebt = foes.filter(m => debtOf(m) >= 2).length, sealed = foes.some(m => debtOf(m) >= 7), grouped = foes.filter(inLab).length;
      // a single high-priority target, or debt to build: Sevenfold Perdition
      { const tgt = boss || (foes.length <= 2 ? foes[0] : null); opts.push({ kind: 'perd', s: 0.42 + (tgt ? 0.25 : 0) + (foes.filter(m => debtOf(m) < 4).length >= 2 ? 0.1 : 0) - (sealed ? 0.1 : 0), o: { m: tgt || foes[0] } }); }
      // a crowd: the Crimson Labyrinth (one at a time)
      if (c && c.n >= 3 && !labOn()) opts.push({ kind: 'lab', s: 0.4 + 0.09 * Math.min(6, c.n) - 0.04 * Math.min(5, nDebt), o: { x: c.x, y: c.y } });
      // debt on several, a full seal, or a crowd held in the web: Scarlet Rupture
      if (nDebt >= 3 || sealed || grouped >= 3) opts.push({ kind: 'rupt', s: 0.45 + 0.09 * Math.min(6, nDebt) + (sealed ? 0.28 : 0) + (grouped >= 3 ? 0.2 : 0) });
      // a monster close and about to strike (or crowding it): Eclipse Molt
      { const close = foes.filter(m => Math.hypot(m.x - a.x, m.y - a.y) < 2.3 + m.r), threat = close.find(m => m.state === 'attack' || m.act === 'windup' || (m.atkCd != null && m.atkCd < 0.5) || m.boss);
        if (threat || close.length >= 3) opts.push({ kind: 'molt', s: (threat ? 0.78 : 0.42) + 0.04 * close.length, o: { m: threat || close[0] } }); }
      for (const q of opts) { if (q.kind === ab.last) q.s *= 0.7; if (q.kind === ab.last && q.kind === ab.last2) q.s *= 0.6; q.s += Math.random() * 0.12; }
      opts.sort((p, q) => q.s - p.s); return opts[0].s > 0.3 ? opts[0] : null;
    }
    /* ---- the powers ---- */
    function start(a, kind, o) {
      const ab = a.as, k = kOf(a); ab.act = Object.assign({ kind, t: 0, k, hits: 0 }, o || {}); const A = ab.act; ab.last2 = ab.last; ab.last = kind;
      if (kind === 'perd') { const C = CFG.perd; A.n = C.n[k - 1]; A.wind = C.wind; A.gap = C.gap; A.last = A.wind + (A.n - 1) * A.gap; A.fin = k >= 3 ? A.last + 0.42 : -9; A.end = (k >= 3 ? A.fin : A.last) + 0.6;
        const m0 = A.m || H.near(a.x, a.y, 11)[0], pool = H.near(m0 ? m0.x : a.x, m0 ? m0.y : a.y, 4.5).slice(0, C.multi[k - 1]); A.tg = []; for (let i = 0; i < A.n; i++) A.tg.push(pool.length ? pool[i % pool.length] : m0);
        A.order = [3, 1, 5, 2, 4, 0, 6].sort(() => Math.random() - 0.5); A.done = new Set(); if (m0) { A.cx = m0.x; A.cy = m0.y; ab.yawT = faceTo(a, m0.x, m0.y); } sfx('hum'); }
      else if (kind === 'lab') { const C = CFG.lab; if (A.x == null) { const c = crowd(a.x, a.y, 9, 2.6) || { x: a.x + 2, y: a.y }; A.x = c.x; A.y = c.y; } const p = X.walkPoint(A.x, A.y, { r: 0.6, mv: 0, x: a.x, y: a.y }); A.x = p.x; A.y = p.y; A.end = C.cast + 0.6; A.laid = false; ab.yawT = faceTo(a, A.x, A.y); sfx('hum'); }
      else if (kind === 'molt') { A.end = CFG.molt.end; A.sx = a.x; A.sy = a.y; if (!A.m) A.m = H.near(a.x, a.y, 6)[0]; sfx('hum'); }
      else if (kind === 'rupt') { A.end = CFG.rupt.shatter + (k >= 3 ? 1.5 : 1.0) + CFG.rupt.rec * 0.5; A.n = CFG.rupt.waves[k - 1]; sfx('hum'); }
      else if (kind === 'rise') { A.end = 1.0; }
    }
    function act(a, dt) {
      const ab = a.as, A = ab.act;
      // (Perdition closes in first if its quarry is out of the stingers' reach: a predatory burst, low and fast; its timeline waits)
      if (A.kind === 'perd' && A.t < 0.3 && !(A.appr > 1.6)) { const q = A.tg.find(m => m && !m.dead && !m.falling); if (q) { const d = Math.hypot(q.x - a.x, q.y - a.y); ab.yawT = faceTo(a, q.x, q.y);
        if (d > CFG.perd.reach + 1) { A.appr = (A.appr || 0) + dt; stepTo(a, dt, q.x - (q.x - a.x) / d * CFG.perd.reach, q.y - (q.y - a.y) / d * CFG.perd.reach, CFG.walk.speed * CFG.walk.burst); ab.mv = Math.min(1, Math.hypot(ab.vx, ab.vy) / 3); ab.run = Math.min(1, ab.run + dt * 4); return; } } }
      const t0 = A.t; A.t += dt; const t = A.t, k = A.k, P = pw(a), cross = x => t0 < x && t >= x;
      ab.mv *= 1 - Math.min(1, dt * 8); ab.vx = ab.vy = 0; ab.run *= 1 - Math.min(1, dt * 6);
      if (A.kind === 'perd') {
        const C = CFG.perd, live = m => m && !m.dead && !m.falling, q = A.tg.find(live); if (q) ab.yawT = faceTo(a, q.x, q.y);
        A.aims = []; for (let i = 0; i < A.n; i++) { const m = live(A.tg[i]) ? A.tg[i] : q; if (!m) continue; A.aims.push({ i: A.order[i % 7], A: aimAt(a, m.x, m.y, 1.2), m }); }
        if (k >= 3 && q) for (const am of A.aims) am.Af = aimAt(a, q.x, q.y, 0.8);
        if (cross(0.1)) FX.push({ kind: 'anchor', a, t: 0, life: 0.9 });
        for (let i = 0; i < A.n; i++) if (cross(A.wind + i * A.gap)) { const am = A.aims[i]; if (am && live(am.m)) stingHit(a, am.m, P * C.dmg, 1, am.i, i); }
        if (k >= 3 && cross(A.fin) && q) { const R = C.finR; for (const m of H.living()) if (Math.hypot(m.x - q.x, m.y - q.y) < R + m.r) { hitM(a, m, P * C.fin, { big: true, venom: 2 }); addDebt(m, 1, a); }
          burstFx(q.x, q.y, 3, true); FX.push({ kind: 'imp7', x: q.x, y: q.y, t: 0, life: 1.0, seed: Math.random() * 40 }); X.flash(0.16, '#FF9AB8'); X.shake(12, 0.35); sfx('crash'); g.hitStop = Math.max(g.hitStop || 0, 0.06); if (!gpu()) X.boom(q.x, q.y, R, '#FF2A4A', '#FF9AB8', { n: 26, shake: 0, smoke: 4 }); }
      }
      else if (A.kind === 'lab') {
        const C = CFG.lab; A.aims = [0, 2, 4, 6].map((j, n) => { const an = n / 4 * TAU + 0.4, R = C.R[k - 1]; return { i: j, A: aimAt(a, A.x + Math.cos(an) * R * 0.8, A.y + Math.sin(an) * R * 0.55, 0.3) }; });
        if (cross(0.25)) FX.push({ kind: 'threads', a, x: A.x, y: A.y, R: C.R[k - 1], t: 0, life: C.cast - 0.1 });
        if (cross(C.cast - 0.05)) { A.laid = true; const R = C.R[k - 1], dur = C.dur[k - 1]; FX.push({ kind: 'lab', a, x: A.x, y: A.y, R, R0: R, k, t: 0, life: dur, tk: 0, sk: C.stackEvery * 0.5, seed: Math.random() * 40, spikes: spikeRing(A.x, A.y, R, k) }); X.shake(6, 0.25); sfx('crash'); X.text(A.x, A.y - 1.6, 'CRIMSON LABYRINTH', COL.pink, 13, { crit: true, life: 1.0 }); }
      }
      else if (A.kind === 'molt') {
        const C = CFG.molt;
        if (cross(C.vanish)) { const n = C.shells[k - 1], foes = H.near(a.x, a.y, 6); a.judg = true; a.jA = 1; ab.hidden = true;
          FX.push({ kind: 'warp', x: a.x, y: a.y, t: 0, life: 0.8, seed: Math.random() * 40 }); X.flash(0.1, '#C06AFF');
          for (let i = 0; i < n; i++) { let x = A.sx, y = A.sy; if (k >= 3 && i > 0 && foes[i - 1]) { const m = foes[i - 1], an = Math.atan2(m.y - A.sy, m.x - A.sx) + 0.5; const p = X.walkPoint(m.x - Math.cos(an) * 1.2, m.y - Math.sin(an) * 1.2, { r: 0.5, mv: 0, x: m.x, y: m.y }); x = p.x; y = p.y; } else if (i > 0) { const an = i * 2.1; const p = X.walkPoint(A.sx + Math.cos(an) * 1.6, A.sy + Math.sin(an) * 1.0, { r: 0.5, mv: 0, x: A.sx, y: A.sy }); x = p.x; y = p.y; }
            FX.push({ kind: 'shell', x, y, yaw: ab.yaw, P: Object.assign({}, a.asP, { strikes: null, cage: 1, crack: 0.6, live: 0 }), k, t: 0, life: C.blow - C.vanish + 0.3 + i * 0.03, blow: C.blow - C.vanish + i * 0.03, done: false, src: a, seed: i }); }
          sfx('whoosh'); }
        if (t > C.vanish && t < C.appear) a.jA = Math.max(0, 1 - (t - C.vanish) / 0.12);
        if (cross((C.vanish + C.appear) / 2)) { const m = A.m && !A.m.dead ? A.m : H.near(a.x, a.y, 8)[0]; if (m) { const d = Math.hypot(m.x - A.sx, m.y - A.sy) || 1, bx = m.x + (m.x - A.sx) / d * 1.7, by = m.y + (m.y - A.sy) / d * 1.0, p = X.walkPoint(bx, by, { r: 0.6, mv: 0, x: m.x, y: m.y }); a.x = p.x; a.y = p.y; ab.yaw = ab.yawT = faceTo(a, m.x, m.y); A.m = m; } FX.push({ kind: 'warp', x: a.x, y: a.y, t: 0, life: 0.7, seed: Math.random() * 40, in: 1 }); }
        if (t >= C.appear && a.judg && ab.hidden) { a.jA = Math.min(1, (t - C.appear) / 0.15); if (a.jA >= 1) { a.judg = false; ab.hidden = false; } }
        A.aims = A.m ? [{ i: 3, A: aimAt(a, A.m.x, A.m.y, 1.4) }] : [];
        if (cross(C.strike) && A.m && !A.m.dead) { stingHit(a, A.m, P * C.dmg, C.stacks, 3, 0, true); X.shake(9, 0.25); }
      }
      else if (A.kind === 'rupt') {
        const C = CFG.rupt;
        if (cross(0.12)) FX.push({ kind: 'riseFx', a, t: 0, life: C.shatter });
        if (cross(C.shatter)) { const R = C.R[k - 1]; FX.push({ kind: 'shat', a, t: 0, life: 0.9, seed: Math.random() * 40 }); X.flash(0.2, '#FFB0C8'); X.shake(10, 0.3); sfx('crash'); g.hitStop = Math.max(g.hitStop || 0, 0.05); fragsAt(a, 10); }
        for (let i = 0; i < A.n; i++) if (cross(C.shatter + 0.04 + i * C.gap)) { const R = C.R[k - 1] * (1 + 0.12 * i); FX.push({ kind: 'wave', a, x: a.x, y: a.y, R, sp: C.speed * (1 - 0.1 * i), t: 0, life: R / (C.speed * (1 - 0.1 * i)) + 0.35, i, hit: new Set(), dmg: P * C.dmg * (i ? 0.75 : 1), seed: Math.random() * 40, tw: i * 0.35 }); sfx(i ? 'whoosh' : 'crash'); }
        if (k >= 3 && cross(C.shatter + 0.04 + (A.n - 1) * C.gap + 0.55)) { const c = crowd(a.x, a.y, 7, 2.8) || { x: a.x + Math.cos(ab.yaw) * 2, y: a.y + Math.sin(ab.yaw) * 1.2 }; eruption(a, c.x, c.y, P * C.erupt, C.eruptR); }
      }
      if (ab.act === A && A.end != null && t >= A.end) endAct(a);
    }
    function endAct(a) { const ab = a.as; if (!ab || !ab.act) return; if (ab.hidden) { a.judg = false; a.jA = 1; ab.hidden = false; } ab.act = null; ab.gap = 0.1; }
    /* an interrupted power: no more blows; its pictures fade; a vanished Asmodeus shows itself again (a controlled transition) */
    function interrupt(a) { const ab = a.as; if (!ab || !ab.act) return; const A = ab.act; if (ab.hidden) { a.judg = false; a.jA = 1; ab.hidden = false; }
      for (const f of FX) if ((f.a === a || f.A === A) && f.kind !== 'lab' && f.life - f.t > 0.4) f.life = f.t + 0.4; if (A.kind === 'rise') ab.ready = true; ab.act = null; }
    /* a stinger's blow: the damage, the game's venom, the debt, the crystal burst, the trail from its tail's root */
    function stingHit(a, m, d, stacks, j, i, big) {
      hitM(a, m, d, { venom: 1, big: !!big }); addDebt(m, stacks, a); if (!m.boss && !m.still) { const dd = Math.hypot(m.x - a.x, m.y - a.y) || 1; m.kbx = (m.kbx || 0) + (m.x - a.x) / dd * 2.2; m.kby = (m.kby || 0) + (m.y - a.y) / dd * 2.2; }
      FX.push({ kind: 'strk', a, j, x: m.x, y: m.y, t: 0, life: 0.34, seed: Math.random() * 40, sd: i % 2 ? -1 : 1 }); burstFx(m.x, m.y, 1, false);
      X.shake(3.5, 0.08); sfx('whoosh'); g.hitStop = Math.max(g.hitStop || 0, 0.02); if (!gpu()) X.ring(m.x, m.y, 0.2, 1.1, 0.25, '#FF2A4A', 0.1);
    }
    /* (pure-ish pictures: the records an impact lays down; a boss can call them too) */
    function burstFx(x, y, k, big) { FX.push({ kind: 'burst', x, y, R: big ? 2.0 : 0.95, t: 0, life: big ? 0.75 : 0.5, seed: Math.random() * 40 }); if (big) FX.push({ kind: 'ringw', x, y, R: 3.2, t: 0, life: 0.6, seed: Math.random() * 40 });
      for (let i = 0; i < Math.round((big ? 7 : 3) * LQ()); i++) { const an = Math.random() * TAU, v = (1 + Math.random() * 2) * (big ? 1.6 : 1); FX.push({ kind: 'frag', x, y, z: 0.4, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 3 + Math.random() * 3, t: 0, life: 0.8, s: 0.1 + Math.random() * 0.08, rot: Math.random() * 6, seed: Math.random() * 90 }); } }
    function waveFx(x, y, R) { FX.push({ kind: 'ringw', x, y, R, t: 0, life: 0.6, seed: Math.random() * 40 }); FX.push({ kind: 'dome', x, y, R: R * 0.7, t: 0, life: 0.55, seed: Math.random() * 40 }); }
    function fragsAt(a, n) { const r = a.asOut && a.asOut.r; for (let i = 0; i < Math.round(n * LQ()); i++) { const an = Math.random() * TAU, v = 2 + Math.random() * 3; FX.push({ kind: 'frag', x: a.x, y: a.y, z: 3.6, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 1 + Math.random() * 4, t: 0, life: 1.1, s: 0.12 + Math.random() * 0.1, rot: Math.random() * 6, seed: Math.random() * 90 }); } void r; }
    function eruption(a, x, y, d, R) { for (const m of H.living()) if (Math.hypot(m.x - x, m.y - y) < R + m.r) { hitM(a, m, d * (1 + CFG.rupt.bonus * debtOf(m)), { big: true, venom: 1 }); if (!m.boss && !m.still) { const dd = Math.hypot(m.x - x, m.y - y) || 1; m.kbx = (m.kbx || 0) + (m.x - x) / dd * 5; m.kby = (m.kby || 0) + (m.y - y) / dd * 5; } }
      FX.push({ kind: 'pillar', x, y, R: 1.0, H: 8, t: 0, life: 1.3, seed: Math.random() * 40 }); waveFx(x, y, R * 1.2); FX.push({ kind: 'field', x, y, R: R * 1.1, t: 0, life: 2.2, seed: Math.random() * 40 });
      spikesAt(x, y, Math.round(7 * LQ()), R * 0.7, 1.6); burstFx(x, y, 3, true); X.flash(0.22, '#FFB0C8'); X.shake(15, 0.45); sfx('crash'); X.light(x, y, 6, 0.6); g.hitStop = Math.max(g.hitStop || 0, 0.06);
      if (!gpu()) X.boom(x, y, R, '#FF2A4A', '#FF9AB8', { n: 30, shake: 0, smoke: 5 }); }
    function spikeRing(x, y, R, k) { const n = Math.round((6 + 2 * k) * LQ()), out = []; for (let i = 0; i < n; i++) { const an = i / n * TAU + Math.random() * 0.3, rr = R * (0.55 + 0.4 * Math.random()); out.push({ x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * 0.75, s: 0.24 + Math.random() * 0.14, yaw: Math.random() * 6, lean: (Math.random() - 0.5) * 0.5, d: i * 0.05 }); } return out; }
    function spikesAt(x, y, n, R, life) { for (let i = 0; i < n; i++) { const an = i / n * TAU + Math.random() * 0.4, rr = R * (0.5 + Math.random() * 0.5); FX.push({ kind: 'spike', x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr * 0.8, t: -i * 0.03, life: life || 1.6, s: 0.3 + Math.random() * 0.18, yaw: Math.random() * 6, lean: (Math.random() - 0.5) * 0.6 }); } }
    /* ---- the pose every frame: the power's (or the ultimate's), the entrance, the last seconds' rising danger, eased ---- */
    function poseOf(a, dt) {
      const ab = stOf(a), G = GLA(), inU = UL && UL.a === a, kv = a.st === 'awaken' || inU ? 3 : kOf(a), base = G ? G.idlePose(kv, a.at || 0) : { k: kv, core: 0.9 }, A = ab.act;
      let tg;
      if (inU) { const aims = UL.tg.map((m, i) => ({ i: [3, 1, 5, 0, 6, 2, 4][i], A: aimAt(a, m.x, m.y, 0.8) })); tg = ultPose(UL.t, { aims, ctr: aimAt(a, UL.cx, UL.cy, 0.6) }); }
      else tg = poseFor(A ? A.kind : null, A ? A.t : 0, { base, n: A && A.n, wind: A && A.wind, gap: A && A.gap, k: A && A.k, aims: A && A.aims, stag: 0 });
      // the entrance: the cocoon rising and cracking, the stingers unfolding one by one, the body out of the dark, the Crucible waking, the mask lifting
      if (a.st === 'enter' || (!ab.ready && !A)) { const e = Math.max(0, ab.en); tg.coc = e < 2.35 ? sstep(0.45, 1.3, e) + sstep(1.35, 2.3, e) * 0.95 : 0; tg.unf = 7 * sstep(1.45, 2.55, e); tg.asm = sstep(2.25, 3.05, e); tg.core = lerp(0.1, 1.6, sstep(2.7, 3.0, e)) * (1 - 0.3 * sstep(3.1, 3.4, e)); tg.head = 0.7 * (1 - sstep(2.85, 3.25, e)); tg.crown = bump(e, 3.0, 3.2, 3.3, 3.6); tg.live = 0.4 + 0.6 * sstep(3.0, 3.4, e); tg.seq = 7 * sstep(2.6, 3.1, e); tg.crouch = 0.5 * (1 - sstep(2.4, 3.0, e)); }
      if (a.st === 'awaken' && !inU) { const u = sstep(0, 0.7, a.aw || 0); tg.core += u * 1.5; tg.raise = Math.max(tg.raise || 0, 0.5 * u); tg.seq = Math.max(tg.seq || 0, 7 * u); tg.glow += u * 0.3; }
      if (a.st === 'fight' && a.life < 5 && !inU) { const q = 1 - Math.max(0, a.life) / 5, fl = Math.sin((a.at || 0) * (9 + 14 * q)) * 0.5 + 0.5; tg.core += q * (0.7 + 0.9 * fl); tg.lash = (tg.lash || 1) + q * 1.4; tg.bladeHeat = Math.max(tg.bladeHeat || 0, q * 0.7 * fl); tg.glow += q * 0.2 * fl; tg.flow = Math.max(tg.flow || 0, 0.5 + 0.5 * q); }   // (its last seconds: brighter, its stingers restless)
      if (ab.stag > 0) { ab.stag = Math.max(0, ab.stag - dt * 2.5); tg.stagger = (tg.stagger || 0) + Math.sin(ab.stag * Math.PI) * 0.4; }
      const pz = easePose(ab, tg, dt);
      if (!inU && ab.yawT != null) { const rate = CFG.walk.turn * dt, dd = angD(ab.yawT, ab.yaw); ab.yaw += Math.max(-rate, Math.min(rate, dd * Math.min(1, dt * 6) * 5)); }
      a.face = Math.cos(ab.yaw) >= 0 ? 1 : -1; a.fk = 1;
      if (!A && !inU) { ab.mv += ((Math.hypot(ab.vx, ab.vy) / 2.4) - ab.mv) * Math.min(1, dt * 4); ab.run += ((ab.mv > 0.85 ? 1 : 0) - ab.run) * Math.min(1, dt * 3); } ab.mv = cl(ab.mv);
      a.asP = Object.assign(base, pz, { k: kv, t: a.at || 0, yaw: ab.yaw + (inU ? tg.yawOff || 0 : 0), ph: ab.ph, mv: inU ? 0 : ab.mv, run: inU ? 0 : ab.run, mvA: ab.mvA, crouch: (pz.crouch || 0) + 0.45 * ab.run * ab.mv, strikes: pz.strikes,
        coc: tg.coc || 0, unf: tg.unf == null ? 7 : tg.unf, asm: tg.asm == null ? 1 : tg.asm, dis: tg.dis || 0, rupt: pz.rupt, vflow: null });
    }
    /* ---- the fighter's loop (20g's tick, in its 'fight'). Its time counts only once it is combat-ready (the entrance done) ---- */
    function tick(a, dt) {
      const ab = stOf(a); a.feet = true; ab.thudT -= dt;
      if (!ab.ready) a.life += dt;   // (the entrance is not counted)
      if (!ab.ready && ab.en >= 0 && ab.en < 3.3 && !ab.act) return;   // (still emerging: it acts once the crown has spread)
      if (me.dead) { interrupt(a); return; }
      if (ab.act) { act(a, dt); return; }
      if (!ab.first) { ab.first = true; return start(a, 'rise'); }
      if (!ab.ready) ab.ready = true;
      ab.gap -= dt;
      const ch = !H.noAuto && ab.gap <= 0 && a.life > 0.6 ? choose(a) : null;
      if (ch) return start(a, ch.kind, ch.o);
      guard(a, dt);
    }
    /* ---- The Seventh Sin ---- */
    function fin(a) {
      const ab = stOf(a); if (a.asUlt || (UL && UL.a === a)) return; a.asUlt = true;   // (exactly once)
      interrupt(a); a.dropZ = 0;
      const foes = H.near(a.x, a.y, CFG.ult.r).sort((p, q) => debtOf(q) - debtOf(p) || (q.boss ? 1 : 0) - (p.boss ? 1 : 0)), tg = [];
      for (let i = 0; i < 6; i++) { const m = foes[i % Math.max(1, foes.length)]; if (m) tg.push({ x: m.x, y: m.y, m }); else { const an = i / 6 * TAU + 0.3; tg.push({ x: a.x + Math.cos(an) * 3.2, y: a.y + Math.sin(an) * 2.4, m: null }); } }
      const c = crowd(a.x, a.y, CFG.ult.r, 3.2), cx = c ? c.x : a.x + 2, cy = c ? c.y : a.y + 1;
      UL = { a, t: 0, k: kOf(a), tg, cx, cy, seed: Math.random() * 1000, done: {}, yaw: faceTo(a, cx, cy) };
      a.judg = true; a.jA = 1; a.hold = true; ab.vx = ab.vy = 0; ab.mv = 0; ab.yawT = null; ab.yaw = UL.yaw;
      g.cineT = Math.max(g.cineT || 0, UT.det + 0.6); me.inv = Math.max(me.inv, UT.det + 1.0);
      for (const m of DEBT) m.asDebtFl = 1;   // (every mark flares)
      FX.push({ kind: 'sin', a, x: a.x, y: a.y, t: 0, life: UT.len + 0.4, k: UL.k, seed: UL.seed, cine: 1 });
      sfx('hum'); X.after(0.7, () => sfx('hum'));
    }
    function stepUL(dt) {
      const J = UL, a = J.a, t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x, C = CFG.ult, P = pw(a);
      if (t < UT.det + 0.6) { g.cineT = Math.max(0.02, UT.det + 0.6 - t); me.inv = Math.max(me.inv, 0.4); } else if (t0 < UT.det + 0.6) g.cineT = 0;
      // the camera: drawn in for the seals, out for the cathedral and the bloom, a punch at the detonation, home at the end
      const zp = t < UT.p2 ? lerp(1, 0.9, sstep(0, UT.p2, t)) : t < UT.p4 ? lerp(0.9, 0.72, sstep(UT.p2, UT.p3, t)) : t < UT.det ? lerp(0.72, 0.8, sstep(UT.p4, UT.p5, t)) : t < UT.p6 ? lerp(0.68, 0.76, eout(cl((t - UT.det) / 0.5))) : lerp(0.8, 1, sstep(UT.p6, UT.len, t));
      g.zoomP = zp; g.zoomT = t < UT.len - 0.05 ? 0.25 : 0;
      if (t < UT.p2 && Math.random() < dt * 8) X.shake(0.8 + t * 0.8, 0.08);
      for (let i = 0; i < 7; i++) if (cross(0.25 + i * 0.27)) { sfx('chirp'); }   // (the seven blades lighting in turn)
      if (cross(UT.p2)) { X.shake(8, 0.4); sfx('crash'); }
      if (cross(UT.p3)) { sfx('hum'); X.flash(0.12, '#FF9AB8'); }
      // the Seventh Sting: six strikes on the marked, each its own picture, then the seventh with all of them
      const hitAt = (x, y, R, k, stk) => { let n = 0; for (const m of H.living()) { const d = Math.hypot(m.x - x, m.y - y); if (d > R + m.r) continue; hitM(a, m, P * k * (d < 0.8 ? 1.25 : 1), { noCrit: true, big: true, venom: 1 }); if (stk) addDebt(m, stk, a); if (!m.boss && !m.still) { const dd = d || 1; m.kbx = (m.kbx || 0) + (m.x - x) / dd * 3.5; m.kby = (m.kby || 0) + (m.y - y) / dd * 3.5; } n++; } return n; };
      for (let i = 0; i < 6; i++) if (cross(UT.s[i])) { const q = J.tg[i], m = q.m && !q.m.dead ? q.m : null, x = m ? m.x : q.x, y = m ? m.y : q.y; hitAt(x, y, C.strikeR, C.strike, 1);
        FX.push({ kind: 'sting', i, x, y, t: 0, life: 2.2, seed: Math.random() * 40, cine: 1 }); FX.push({ kind: 'strk', a, j: [3, 1, 5, 0, 6, 2, 4][i], x, y, t: 0, life: 0.34, seed: i * 7, sd: i % 2 ? -1 : 1, cine: 1 }); burstFx(x, y, 2, i >= 2);
        if (i === 3) spikesAt(x, y, Math.round(6 * LQ()), 1.8, 1.6); X.shake(8 + i, 0.25); sfx('crash'); g.hitStop = Math.max(g.hitStop || 0, 0.04); }
      if (cross(UT.s7)) { hitAt(J.cx, J.cy, C.finR, C.fin, 1); FX.push({ kind: 'pillar', x: J.cx, y: J.cy, R: 1.4, H: 13, t: 0, life: 1.6, seed: 3, cine: 1 }); FX.push({ kind: 'field', x: J.cx, y: J.cy, R: C.r * 0.9, t: 0, life: 4.5, seed: 9, cine: 1 }); burstFx(J.cx, J.cy, 3, true);
        X.flash(0.3, '#FFC0D8'); X.shake(18, 0.5); sfx('crash'); X.light(J.cx, J.cy, 8, 0.8); g.hitStop = Math.max(g.hitStop || 0, 0.07); }
      // the Crimson Testament: the collapse, a silence, the detonation that consumes the debt
      if (cross(UT.col)) { sfx('hum'); }
      if (cross(UT.det)) { let n = 0;
        for (const m of H.living()) { const d = Math.hypot(m.x - a.x, m.y - a.y); const s = debtOf(m); if (d > C.detR + m.r && !s) continue; if (d < C.detR + m.r) { hitM(a, m, P * C.det * (1 - 0.35 * cl(d / C.detR)), { noCrit: true, big: true }); n++; }
          if (s) { let b = P * C.perStack * s * s * 0.3 + P * C.perStack * s; if (m.boss) b = Math.min(b, m.maxhp * CFG.debt.capUltBoss); hitM(a, m, b, { noCrit: true, big: true }); FX.push({ kind: 'det', x: m.x, y: m.y, t: 0, life: 0.8, n: s, seed: Math.random() * 40, cine: 1 }); dropDebt(m); }
          m.asSinT = g.t + C.weak; }
        clearDebt(); J.n = n; FX.push({ kind: 'testament', x: a.x, y: a.y, t: 0, life: 3.0, seed: J.seed, k: J.k, cine: 1 }); X.flash(0.5, '#FFE0EA'); X.shake(28, 0.9); sfx('crash'); X.after(0.3, () => sfx('fanfare')); X.light(a.x, a.y, 12, 1.2); g.hitStop = Math.max(g.hitStop || 0, 0.09);
        X.after(0.6, () => X.text(me.x, me.y + 0.9, 'THE SEVENTH SIN', COL.pink, 15, { crit: true, life: 1.3 })); }
      if (t >= UT.len) endUL(true);
    }
    function endUL(done) { if (!UL) return; const a = UL.a; if (g.cineT > 0 && UL.t < UT.det + 0.6) g.cineT = 0; g.zoomP = 1; g.zoomT = 0; a.judg = false; a.hold = false; a.dropZ = 0; a.jA = 1;
      if (done) { a.st = 'leave'; a.lv = 0.8; a.alpha = 0; a.waved = true; FX.push({ kind: 'spark1', x: a.x, y: a.y, t: 0, life: 1.4 }); }
      UL = null; }
    /* ---- the loop (every frame, from 20g's update) ---- */
    function update(dt, dtReal) {
      const L = list();
      for (const a of L) { const ab = stOf(a); a.feet = true;
        if (a.st === 'enter' && a.en >= 0) { if (ab.en < 0) ab.en = 0; ab.en += dtReal; a.dropZ = 0; a.scale = 1; a.alpha = 1; entranceBeats(a); }
        else if (ab.en >= 0 && !ab.ready) { ab.en += dtReal; entranceBeats(a); }
        if (a.st === 'awaken') a.hold = true;
        if (a.st !== 'fight' && ab.act) interrupt(a);
        poseOf(a, dtReal); idleSteps(a); released = false; }
      if (UL) { if (!L.includes(UL.a)) endUL(false); else stepUL(dtReal); }
      debtTick(dt);
      for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += f.cine ? dtReal : dt;
        if (f.kind === 'frag') { const tt = Math.max(0, dt); f.x += f.vx * tt; f.y += f.vy * tt; f.vz -= 14 * tt; f.z += f.vz * tt; if (f.z < 0) { f.z = 0; f.vz *= -0.3; f.vx *= 0.5; f.vy *= 0.5; } }
        else if (f.kind === 'lab') labStep(f, dt);
        else if (f.kind === 'wave' && f.t > f.tw) { const r = Math.min(f.R, (f.t - f.tw) * f.sp), a = f.a; for (const m of H.living()) { if (f.hit.has(m)) continue; const d = Math.hypot(m.x - f.x, m.y - f.y); if (d > r + m.r || d < r - 1.2) continue; f.hit.add(m);
            const s = debtOf(m); hitM(a, m, f.dmg * (1 + CFG.rupt.bonus * s), { venom: 1 }); if (s >= 7) detonate(a, m, 1, CFG.debt.capBoss, 1); else addDebt(m, 1, a); if (!m.boss && !m.still) { const dd = d || 1; m.kbx = (m.kbx || 0) + (m.x - f.x) / dd * 2.5; m.kby = (m.kby || 0) + (m.y - f.y) / dd * 2.5; } } }
        else if (f.kind === 'shell' && !f.done && f.t >= f.blow) { f.done = true; const a = f.src || L[0], R = CFG.molt.shellR; if (a) { for (const m of H.living()) if (Math.hypot(m.x - f.x, m.y - f.y) < R + m.r) { hitM(a, m, pw(a) * CFG.molt.shellDmg, { big: true }); addDebt(m, 1, a); } }
          FX.push({ kind: 'shatS', x: f.x, y: f.y, t: 0, life: 0.8, seed: Math.random() * 40 }); burstFx(f.x, f.y, 2, true); for (let j = 0; j < Math.round(6 * LQ()); j++) { const an = Math.random() * TAU, v = 2 + Math.random() * 3; FX.push({ kind: 'frag', x: f.x, y: f.y, z: 1 + Math.random() * 2, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 2 + Math.random() * 4, t: 0, life: 1.0, s: 0.12 + Math.random() * 0.1, rot: Math.random() * 6, seed: Math.random() * 90 }); }
          X.shake(8, 0.25); sfx('crash'); if (!gpu()) X.boom(f.x, f.y, R, '#B04AFF', '#FF9AB8', { n: 18, shake: 0, smoke: 3 }); }
        if (f.t >= f.life) FX.splice(i, 1); }
      if (!L.length && !UL) { if (DEBT.size && !FX.length) clearDebt(); if (!released && !FX.length) { released = true; clearDebt(); const G = GLA(); if (G) G.release(); } }
      if (me.dead) for (const a of L) interrupt(a);
    }
    /* the Labyrinth's hold: the slow (the game's own m.sandT), the pull toward the middle (never a boss), venom along the wires, debt in time,
       level 7's lowered defence; it tightens as it lasts */
    function labStep(f, dt) {
      const C = CFG.lab, a = f.a, k = f.k, on = f.t > 0.1 && f.t < f.life - 0.25; f.R = f.R0 * (1 - 0.18 * sstep(0, f.life, f.t)); if (!on || !a) return;
      const P = pw(a); f.tk -= dt; f.sk -= dt; const tick = f.tk <= 0, stk = f.sk <= 0; if (tick) f.tk = C.tick; if (stk) f.sk = C.stackEvery;
      for (const m of H.living()) { const d = Math.hypot(m.x - f.x, m.y - f.y); if (d > f.R + m.r) continue;
        m.sandT = Math.max(m.sandT || 0, C.slow);
        if (!m.boss && !m.still && d > 0.4) { const sp = Math.min(d - 0.3, C.pull[k - 1] * dt * (0.5 + d / f.R)); X.moveEnt(m, (f.x - m.x) / d * sp, (f.y - m.y) / d * sp); }
        if (k >= 3) m.asDefT = g.t + 0.4;
        if (tick) hitM(a, m, P * C.dmg, { dot: true, dotC: '#FF5A7A', noAggro: true }); if (stk) addDebt(m, 1, a); }
    }
    function stop() { for (const a of S.list) if (a.id === 'scorpio') { interrupt(a); a.hold = false; a.judg = false; a.jA = 1; a.dropZ = 0; } if (UL) endUL(false);
      FX.length = 0; clearDebt(); if (g.zoomP !== 1) { g.zoomP = 1; g.zoomT = 0; } const G = GLA(); if (G) G.release(); released = true; }
    const outK = m => (m && m.asDefT > g.t ? 1 + (m.boss ? CFG.lab.defBoss : CFG.lab.def) : 1) * (m && m.asSinT > g.t ? CFG.ult.weakK : 1);
    /* ---- the entrance: the Scorpio sigil and its filaments, the cocoon rising, cracking, the stingers unfolding, the shatter, the body, the
       Crucible, the mask lifting, the crown spreading, the pulse ---- */
    function descent(a) { const ab = stOf(a); ab.en = 0; ab.ready = false; ab.beats = {}; a.feet = true; a.dropZ = 0; a.scale = 1; a.life = CFG.life;
      FX.push({ kind: 'sig', x: a.x, y: a.y, R: 3.6, t: 0, life: 4.0, cine: 1 }); FX.push({ kind: 'fils', x: a.x, y: a.y, R: 3.6, t: 0, life: 1.6, cine: 1 });
      for (let i = 0; i < 5; i++) X.after(i * 0.25, () => X.shake(1.5 + i * 0.6, 0.15)); X.light(a.x, a.y, 4, 1); sfx('hum'); }
    function entranceBeats(a) { const ab = a.as, e = ab.en, B = ab.beats || (ab.beats = {}), once = (n, at, f) => { if (!B[n] && e >= at) { B[n] = 1; f(); } };
      once('crack', 1.4, () => { sfx('thud'); X.shake(4, 0.2); });
      once('shatter', 2.3, () => { FX.push({ kind: 'shatS', x: a.x, y: a.y, t: 0, life: 0.9, seed: 5, big: 1 }); for (let j = 0; j < Math.round(12 * LQ()); j++) { const an = Math.random() * TAU, v = 2 + Math.random() * 3.5; FX.push({ kind: 'frag', x: a.x, y: a.y, z: 1 + Math.random() * 4, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 1 + Math.random() * 4, t: 0, life: 1.2, s: 0.13 + Math.random() * 0.12, rot: Math.random() * 6, seed: Math.random() * 90 }); } X.shake(10, 0.3); sfx('crash'); X.flash(0.12, '#FF9AB8'); });
      once('pulse', 3.15, () => { FX.push({ kind: 'ringw', x: a.x, y: a.y, R: 5, t: 0, life: 0.9, seed: 1 }); FX.push({ kind: 'dome', x: a.x, y: a.y, R: 2.8, t: 0, life: 0.6, seed: 2 }); X.shake(8, 0.3); sfx('crash'); X.light(a.x, a.y, 5, 0.6); g.zoomP = 0.95; g.zoomT = 0.9; }); }
    function entrance(a) { stOf(a); }   // (the landing the Anima cycle reports comes before the entrance is done: its beats are laid by update)

    /* ================= drawing ================= */
    const sx = x => X.sx(x), sy = y => X.sy(y);
    function pts(a) { const o = a.asOut && a.asOut.r; return o || null; }
    /* one FX record on the ground layer (Q the painter batch open, parts GPU meshes to add) */
    function groundOne(Q, f, Tz, parts) {
      const X0 = f.x != null ? sx(f.x) : 0, Y0 = f.y != null ? sy(f.y) : 0, u = f.t / f.life, R = (f.R || 1) * Tz;
      if (f.kind === 'foot') { const k2 = 1 - u, sm = f.small ? 0.6 : 1; Q.quad(90, X0, Y0, R * 1.3 * (0.5 + 0.6 * eout(u)), 0, 0, R * 1.3 * (0.5 + 0.6 * eout(u)) * FSY, '#3A2A30', 0.5 * k2 * sm, 0.3, f.seed, u); if (u < 0.4) Q.quad(326, X0, Y0, R * 0.8, 0, 0, R * 0.8 * FSY, COL.crim, 1, 0.4 + 0.5 * u, f.seed, 0.5 * (1 - u / 0.4) * sm); }
      else if (f.kind === 'ringw') Q.quad(326, X0, Y0, R, 0, 0, R * FSY, COL.crim, 1, eout(u) * 0.95, f.seed, 1.1 * (1 - u * 0.6));
      else if (f.kind === 'sig') { const dr = sstep(0, 1.0, f.t) + sstep(2.6, 3.2, f.t) * 0.4, fade = 1 - sstep(f.life - 0.7, f.life, f.t); Q.quad(320, X0, Y0, R, 0, 0, R * FSY, COL.crim, fade, dr, f.t * 0.15, 1.1); Q.glow(X0, Y0, R * 1.2, COL.crim, 0.2 * fade, FSY); }
      else if (f.kind === 'fils') { for (let i = 0; i < 7; i++) { const an = i / 7 * TAU + 0.2, e = sstep(0.05 + i * 0.05, 0.8 + i * 0.05, f.t), x1 = X0 + Math.cos(an) * R * e, y1 = Y0 + Math.sin(an) * R * e * FSY, fade = 1 - sstep(f.life - 0.4, f.life, f.t); if (e > 0.02) Q.quad(332, (X0 + x1) / 2, (Y0 + y1) / 2, (x1 - X0) / 2, (y1 - Y0) / 2, -(y1 - Y0) / 2 * 0.06, (x1 - X0) / 2 * 0.06, COL.crim, 1, 0.3, i * 3, 1.1 * fade); } }
      else if (f.kind === 'lab') labGround(Q, f, Tz, parts);
      else if (f.kind === 'field') Q.quad(331, X0, Y0, R, 0, 0, R * FSY, COL.crim, 1, 0.3 + 0.7 * eout(cl(f.t / 0.6)), f.seed, 1.1 * (1 - sstep(0.6, 1, u)));
      else if (f.kind === 'wave') { const r = Math.min(f.R, Math.max(0, f.t - f.tw) * f.sp) * Tz, fade = 1 - sstep(0.75, 1, u); if (f.t > f.tw) Q.quad(326, X0, Y0, f.R * Tz * 1.05, 0, 0, f.R * Tz * 1.05 * FSY, COL.crim, 1, r / (f.R * Tz * 1.05), f.seed, 1.3 * fade); }
      else if (f.kind === 'spike') { const h = sstep(0, 0.18, f.t) * (1 - sstep(f.life - 0.45, f.life, f.t)); if (h > 0.02) parts.push({ m: 'spike', X: X0, Y: Y0, s: f.s * Tz, h, yaw: f.yaw, lean: f.lean, gl: 1.0 * (1 - u) + 0.4, g2: 0.3, z: Y0 }); if (f.t < 0.3 && f.t > 0) Q.glow(X0, Y0, Tz * 0.7, COL.crim, 0.4 * (1 - f.t / 0.3), FSY); }
      else if (f.kind === 'sin') sinGround(Q, f, Tz, parts);
      else if (f.kind === 'anchor') { const a = f.a, r = pts(a); if (!r) return; for (const p of r.feet) Q.quad(326, p[0], p[1], Tz * 0.55, 0, 0, Tz * 0.55 * FSY, COL.crim, 1, eout(u) * 0.9, 3, 0.9 * (1 - u)); }
    }
    /* the Labyrinth on the floor: the web drawn on and tightening (two layers more at level 7), its crystal spikes and turning rings */
    function labGround(Q, f, Tz, parts) {
      const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * Tz, fade = sstep(0, 0.25, f.t) * (1 - sstep(f.life - 0.45, f.life, f.t)), dr = sstep(0, 0.6, f.t);
      Q.quad(324, X0, Y0, R * 1.04, 0, 0, R * 1.04 * FSY, COL.crim, fade, dr, f.t + 100 * (f.k >= 3 ? 2 : 0), 1.15); Q.glow(X0, Y0, R, COL.crim, 0.12 * fade, FSY);
      if (f.k >= 2) Q.quad(330, X0, Y0, R * 0.55, 0, 0, R * 0.55 * FSY, COL.violet, fade, dr, -f.t * 0.6, 0.8);
      for (const s of f.spikes) { const h = sstep(s.d + 0.25, s.d + 0.55, f.t) * (1 - sstep(f.life - 0.4, f.life, f.t)); if (h > 0.02) parts.push({ m: 'spike', X: sx(f.x + (s.x - f.x) * f.R / f.R0), Y: sy(f.y + (s.y - f.y) * f.R / f.R0), s: s.s * Tz, h, yaw: s.yaw, lean: s.lean, gl: 0.6, g2: 0.3, z: sy(s.y) }); }
    }
    function drawGround(c) {
      const L = list(); if (!FX.length && !UL && !L.length && !DEBT.size) return;
      const Tz = T(); if (!gpu()) return;   // (no painter: the powers show themselves with the game's own particles)
      const Q = fgOpen(c), parts = [];
      for (const a of L) { const r = pts(a), al = (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1); if (!r || !(al > 0.02)) continue; const gx = sx(a.x), gy = sy(a.y);
        Q.sshadow(gx, gy, Tz * 1.2, Tz * 1.2 * 0.42, 0.4 * al, '#0C0408'); for (const p of r.feet) Q.sshadow(p[0], p[1], Tz * 0.22, Tz * 0.1, 0.45 * al, '#0A0306');
        Q.glow(gx, gy, Tz * 1.3, COL.crim, 0.13 * al * cl((a.asP && a.asP.core || 0.9) - 0.4), FSY); }
      for (const f of FX) groundOne(Q, f, Tz, parts);
      fgClose(c);
      if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); c.save(); GLA().drawParts(c, parts); c.restore(); }
    }
    /* the ultimate's ground: the seven runic circles, the corruption spreading, the strikes' marks, the detonation's rings (pure: from its age) */
    function sinGround(Q, f, Tz, parts) {
      const X0 = sx(f.x), Y0 = sy(f.y), t = f.t, B = 1 + 0.12 * ((f.k || 3) - 1), Rr = CFG.ult.r * Tz * B, fadeAll = 1 - sstep(UT.len - 1.0, UT.len, t);
      Q.quad(320, X0, Y0, Tz * 3.6 * B, 0, 0, Tz * 3.6 * B * FSY, COL.crim, fadeAll * (1 - sstep(UT.p6, UT.p6 + 1.2, t)), sstep(0, 1.2, t) + 0.4 * sstep(UT.p4, UT.det, t), t * 0.2, 1.2);
      for (let i = 0; i < 7; i++) { const an = i / 7 * TAU - Math.PI / 2, e = sstep(0.3 + i * 0.22, 0.9 + i * 0.22, t) * (1 - sstep(UT.det, UT.det + 0.4, t)), px = X0 + Math.cos(an) * Tz * 5.2 * B, py = Y0 + Math.sin(an) * Tz * 5.2 * B * FSY;   // the Seven Seals
        if (e > 0.01) Q.quad(330, px, py, Tz * 1.3, 0, 0, Tz * 1.3 * FSY, COL.crim, e, e, t * (i % 2 ? 0.5 : -0.5), 1.0); }
      if (t > UT.p2 - 0.4) Q.quad(331, X0, Y0, Rr * 0.75, 0, 0, Rr * 0.75 * FSY, COL.crim, 1, 0.2 + 0.8 * sstep(UT.p2 - 0.4, UT.p4, t), f.seed, 0.9 * fadeAll);
      { const u = (t - UT.det) / 1.0; if (u > 0 && u < 1) for (let i = 0; i < 3; i++) { const uu = u - i * 0.12; if (uu > 0) Q.quad(326, X0, Y0, Rr * (0.8 + 0.25 * i), 0, 0, Rr * (0.8 + 0.25 * i) * FSY, COL.crim, 1, eout(uu) * 0.95, f.seed + i, 1.4 * (1 - uu)); } }
      void parts;
    }
    /* the air layer: everything above the floor (strikes, bursts, shells, marks, the ultimate's cathedral) */
    function airOne(c, Q, f, Tz, parts, shells) {
      const u = f.t / f.life;
      if (f.kind === 'frag') { const X1 = sx(f.x), Y1 = sy(f.y) - f.z * Tz, fade = 1 - sstep(0.7, 1, u); parts.push({ m: 'frag', X: X1, Y: Y1, z: sy(f.y), s: f.s * Tz, yaw: f.rot + f.t * 7, tilt: f.t * 5 + f.seed, a: fade, gl: 1.2, g2: 0.5 }); Q.glow(X1, Y1, f.s * Tz * 2.5, COL.crim, 0.3 * fade); }
      else if (f.kind === 'burst') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * 0.6, R = f.R * Tz * (0.7 + 0.5 * eout(u)); Q.quad(321, X0, Y0, R, 0, 0, R, COL.crim, 1, u, f.seed, 1.3); }
      else if (f.kind === 'det') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * 0.7, R = Tz * (0.9 + 0.12 * (f.n || 1)) * (0.6 + 0.6 * eout(u)); Q.quad(321, X0, Y0, R, 0, 0, R, COL.pink, 1, u, f.seed, 1.4); Q.quad(333, X0, Y0, R * 0.9, 0, 0, R * 0.9, COL.crim, 1, 1 - u, f.seed, 1.1 * (1 - u)); Q.glow(X0, Y0, R * 1.5, COL.crim, 0.4 * (1 - u)); }
      else if (f.kind === 'ringw') {}
      else if (f.kind === 'dome') { const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * Tz; Q.quad(334, X0, Y0, R * 1.05, 0, 0, R * 1.05, COL.violet, 1, eout(u) * 0.95, f.seed, 1.1 * (1 - u * 0.5)); }
      else if (f.kind === 'pillar') { const X0 = sx(f.x), Y0 = sy(f.y), h = (f.H || 7) * Tz * eout(cl(f.t / 0.25)), w = f.R * Tz, fade = 1 - sstep(0.5, 1, u); Q.quad(329, X0, Y0 - h / 2, w * 1.6, 0, 0, h / 2, COL.crim, fade, 0.32, f.seed, 1.3 * fade); }
      else if (f.kind === 'strk') { const a = f.a, r = pts(a); if (!r) return; const tp = r.tailRoots && r.tailRoots[f.j] ? r.tailRoots[f.j] : r.core, X1 = sx(f.x), Y1 = sy(f.y) - Tz * 0.5, dx = X1 - tp[0], dy = Y1 - tp[1], L = Math.hypot(dx, dy) || 1, s = Math.max(Tz * 1.2, L * 0.5);
        Q.quad(322, (tp[0] + X1) / 2, (tp[1] + Y1) / 2, dx / 2, dy / 2, -dy / L * s * 0.35 * f.sd, dx / L * s * 0.35 * f.sd, COL.crim, 1, u, f.seed, 1.4 * (1 - u)); }
      else if (f.kind === 'warp') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * 1.6, R = Tz * 2.2; Q.smoke(X0, Y0, R * (0.5 + 0.5 * u), 0.8 * (1 - u), f.seed, '#0A0410', 0.2); Q.quad(327, X0, Y0, R, 0, 0, R, COL.violet, 1, u, f.seed, 1.2); }
      else if (f.kind === 'shell') shells.push(f);
      else if (f.kind === 'shatS') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * (f.big ? 2.0 : 1.6), R = Tz * (f.big ? 3.4 : 2.6); Q.quad(328, X0, Y0, R, 0, 0, R, COL.pink, 1, u, f.seed, 1.4); Q.glow(X0, Y0, R * 0.8, COL.crim, 0.35 * (1 - u)); }
      else if (f.kind === 'threads') { const a = f.a, r = pts(a); if (!r) return; const fade = sstep(0, 0.15, f.t) * (1 - sstep(f.life - 0.2, f.life, f.t)), X0 = sx(f.x), Y0 = sy(f.y);
        for (let i = 0; i < r.tailTips.length; i += 1) { if (i % 2) continue; const tp = r.tailTips[i], an = i / 7 * TAU + 0.4, e = sstep(0.1, 0.8, f.t), x1 = lerp(tp[0], X0 + Math.cos(an) * f.R * Tz * 0.8, e), y1 = lerp(tp[1], Y0 + Math.sin(an) * f.R * Tz * 0.55, e), dx = (x1 - tp[0]) / 2, dy = (y1 - tp[1]) / 2, L = Math.hypot(dx, dy) || 1;
          Q.quad(332, tp[0] + dx, tp[1] + dy, dx, dy, -dy / L * Tz * 0.25, dx / L * Tz * 0.25, COL.crim, 1, 0.5, i * 5, 1.2 * fade); } }
      else if (f.kind === 'riseFx') { const a = f.a, r = pts(a); if (!r) return; const fade = sstep(0, 0.2, f.t), grow = sstep(0.4, f.life, f.t);   // venom pouring up every channel into the forming crystal
        const cx = r.rupt ? r.rupt[0] : r.top[0], cy = r.rupt ? r.rupt[1] : r.top[1]; for (const tp of r.tailTips) { const dx = (cx - tp[0]) / 2, dy = (cy - tp[1]) / 2, L = Math.hypot(dx, dy) || 1; Q.quad(332, tp[0] + dx, tp[1] + dy, dx, dy, -dy / L * Tz * 0.3, dx / L * Tz * 0.3, COL.crim, 1, 0.4, tp[0], 1.1 * fade); }
        Q.quad(325, cx, cy, Tz * (1.2 + 2.2 * grow), 0, 0, Tz * (1.2 + 2.2 * grow), COL.crim, fade, 0.35, grow, 1.2); }
      else if (f.kind === 'shat') { const a = f.a, r = pts(a); const cx = r ? (r.rupt || r.top)[0] : sx(a.x), cy = r ? (r.rupt || r.top)[1] : sy(a.y) - Tz * 3; Q.quad(328, cx, cy, Tz * 4.5, 0, 0, Tz * 4.5, COL.pink, 1, u, f.seed, 1.6); Q.glow(cx, cy, Tz * 3.0, COL.white, 0.4 * (1 - u)); }
      else if (f.kind === 'imp7') { const X0 = sx(f.x), Y0 = sy(f.y); Q.quad(329, X0, Y0 - Tz * 2.5, Tz * 1.4, 0, 0, Tz * 2.5, COL.crim, 1 - u, 0.3, f.seed, 1.3 * (1 - u)); Q.quad(334, X0, Y0, Tz * 2.6, 0, 0, Tz * 2.6, COL.violet, 1, eout(u), f.seed, 1.1 * (1 - u)); }
      else if (f.kind === 'sting') stingAir(Q, f, Tz);
      else if (f.kind === 'sin') sinAir(Q, f, Tz, parts);
      else if (f.kind === 'testament') testamentAir(Q, f, Tz, parts);
      else if (f.kind === 'spark1') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * (3 + 1.5 * u); Q.glow(X0, Y0, Tz * 0.5, COL.crim, 0.7 * (1 - u)); Q.star(X0, Y0, Tz * 0.4 * (1 - u * 0.5), 0.8 * (1 - u), COL.pink); }
    }
    /* the six strikes' own pictures (the Seventh Sting) */
    function stingAir(Q, f, Tz) {
      const X0 = sx(f.x), Y0 = sy(f.y), u = cl(f.t / 0.9), i = f.i, fade = 1 - u;
      if (i === 0) { Q.quad(321, X0, Y0 - Tz, Tz * 2.6 * (0.6 + 0.6 * eout(u)), 0, 0, Tz * 2.6 * (0.6 + 0.6 * eout(u)), COL.crim, 1, u, f.seed, 1.5); }   // a crystalline eruption
      else if (i === 1) { for (const s of [1, -1]) Q.quad(322, X0, Y0, Tz * 2.4, s * Tz * 1.0, -s * Tz * 0.4, Tz * 0.9, COL.crim, 1, u, f.seed + s, 1.4 * fade); }   // crossing crimson fractures
      else if (i === 2) { Q.quad(334, X0, Y0, Tz * 2.6, 0, 0, Tz * 2.6, COL.violet, 1, eout(u), f.seed, 1.3 * fade); Q.quad(321, X0, Y0 - Tz * 0.6, Tz * 1.8, 0, 0, Tz * 1.8, COL.pink, 1, u, f.seed, 1.2); }   // a circular blast
      else if (i === 3) { Q.quad(328, X0, Y0 - Tz, Tz * 2.6, 0, 0, Tz * 2.6, COL.pink, 1, u, f.seed, 1.4); }   // rising blade structures (the spikes are its meshes)
      else if (i === 4) { Q.quad(331, X0, Y0, Tz * 3.2, 0, 0, Tz * 3.2 * FSY, COL.crim, 1, 0.3 + 0.7 * eout(u), f.seed, 1.3 * (1 - sstep(0.7, 1, f.t / f.life))); }   // a corruption field
      else { Q.quad(330, X0, Y0, Tz * 3.4 * (0.5 + 0.5 * eout(u)), 0, 0, Tz * 3.4 * (0.5 + 0.5 * eout(u)) * FSY, COL.crim, 1, 1, f.t, 1.3 * fade); Q.quad(326, X0, Y0, Tz * 3.6, 0, 0, Tz * 3.6 * FSY, COL.crim, 1, eout(u), f.seed, 1.3 * fade); }   // a runic shockwave
    }
    /* the ultimate above the floor (pure: from its age): the seven blades' light, filaments between the tails of the cathedral, the turning
       rings over it, ruby fragments orbiting, alchemical symbols, the flower's streams, the collapse */
    function sinAir(Q, f, Tz, parts) {
      const a = f.a, r = a && pts(a), t = f.t; if (!r) return;
      const cath = sstep(UT.p2, UT.p3 - 0.4, t) * (1 - sstep(UT.p6, UT.p6 + 0.8, t)), keep = 1 - sstep(UT.p6, UT.p6 + 1.0, t), tips = r.tailTips, cx = (r.bb[0] + r.bb[2]) / 2, top = r.bb[1], low = lowFx();
      // the Seven Seals: each blade lit in turn
      for (let i = 0; i < tips.length; i++) { const e = sstep(0.25 + i * 0.27, 0.45 + i * 0.27, t) * keep; if (e > 0.01) { Q.glow(tips[i][0], tips[i][1], Tz * (0.7 + 0.4 * e), COL.crim, 0.55 * e); Q.star(tips[i][0], tips[i][1], Tz * 0.6 * e, 0.6 * e, COL.pink); } }
      // the cathedral's filaments: tail to tail, and each tail to the risen heart
      if (cath > 0.02) { for (let i = 0; i + 1 < tips.length; i++) { const p = r.tailMid[i], q = r.tailMid[i + 1], dx = (q[0] - p[0]) / 2, dy = (q[1] - p[1]) / 2, L = Math.hypot(dx, dy) || 1; Q.quad(332, p[0] + dx, p[1] + dy, dx, dy, -dy / L * Tz * 0.3, dx / L * Tz * 0.3, COL.crim, 1, 0.4, i * 3, cath); }
        const hp = r.core; for (const tp of tips) { const dx = (hp[0] - tp[0]) / 2, dy = (hp[1] - tp[1]) / 2, L = Math.hypot(dx, dy) || 1; Q.quad(332, tp[0] + dx, tp[1] + dy, dx, dy, -dy / L * Tz * 0.35, dx / L * Tz * 0.35, COL.violet, 1, 0.6, tp[1], 0.8 * cath * sstep(UT.p3, UT.p4, t)); }
        // the suspended crimson rings, turning at their own speeds, and the alchemical symbols in the air
        const spin = 1 + 3 * sstep(UT.p5, UT.col, t), col = 1 - 0.6 * sstep(UT.col, UT.det, t);
        for (let i = 0; i < (low ? 2 : 3); i++) parts.push({ m: 'bring', X: cx, Y: top + Tz * (1.2 + i * 0.9), z: 9e3 + i, s: Tz * (4.5 - i * 1.1) * col, tilt: 1.15 - 0.15 * i, yaw: t * (0.4 + 0.3 * i) * spin * (i % 2 ? -1 : 1), a: 0.95 * cath, gl: 1.2, g2: 1 + i * 0.5, kind: i });
        for (let i = 0; i < 4; i++) { const an = t * 0.3 + i * TAU / 4; Q.quad(330, cx + Math.cos(an) * Tz * 6, top + Tz * (2 + Math.sin(an) * 1.2), Tz * 1.3, 0, 0, Tz * 1.3, COL.violet, cath * 0.9, 1, t * (i % 2 ? 0.7 : -0.7), 0.9); }
        if (!low) for (let i = 0; i < 10; i++) { const an = t * (0.6 + 0.05 * i) + i * 0.63, rr = Tz * (3.5 + (i % 3) * 1.2) * col; parts.push({ m: 'frag', X: cx + Math.cos(an) * rr, Y: top + Tz * 3 + Math.sin(an) * rr * 0.35, z: 9e3 + Math.sin(an) * 10, s: Tz * 0.22, yaw: t * 3 + i, tilt: t * 2 + i, a: cath, gl: 1.4, g2: 1 }); }
        Q.quad(301, cx, top + Tz * 2.5, Tz * 7, 0, 0, Tz * 5, COL.crim, cath * 0.45, cl(t / UT.len), f.seed, low ? 0.3 : 0.55); }
      // the Forbidden Bloom's light; the collapse into one point; the silence
      { const bl = sstep(UT.p3, UT.p4, t) * (1 - sstep(UT.p5, UT.det, t)); if (bl > 0.01) Q.quad(325, r.core[0], r.core[1], Tz * (2.2 + 2.4 * bl), 0, 0, Tz * (2.2 + 2.4 * bl), COL.crim, bl, 0.25, bl, 0.9); }
      { const cp = bump(t, UT.col - 0.1, UT.det - 0.08, UT.det - 0.02, UT.det + 0.05); if (cp > 0.01) { Q.glow(r.core[0], r.core[1], Tz * (4 - 3.4 * sstep(UT.col, UT.det, t)), COL.white, 0.8 * cp); Q.quad(334, r.core[0], r.core[1], Tz * 5, 0, 0, Tz * 5, COL.violet, cp, 1 - sstep(UT.col, UT.det, t), 3, 1.2); } }
    }
    /* the Crimson Testament's detonation (pure: from its age): the flash, crystalline rings, the dark sphere, ruby fragments, liquid ribbons,
       violet shock, the crystal particles, the spectral Scorpio sign, the last outward burst */
    function testamentAir(Q, f, Tz, parts) {
      const X0 = sx(f.x), Y0 = sy(f.y), t = f.t, Rr = CFG.ult.r * Tz * (1 + 0.12 * ((f.k || 3) - 1)), low = lowFx();
      if (t < 0.35) Q.glow(X0, Y0 - Tz * 2, Rr * (0.4 + t * 2), COL.white, 0.95 * (1 - t / 0.35));   // 1 the flash
      for (let i = 0; i < 3; i++) { const u = (t - i * 0.15) / 0.9; if (u > 0 && u < 1) Q.quad(326, X0, Y0 - Tz * (1 + i), Rr * (0.5 + 0.2 * i), 0, 0, Rr * (0.5 + 0.2 * i) * (0.55 + 0.15 * i), COL.pink, 1, eout(u) * 0.95, f.seed + i, 1.3 * (1 - u)); }   // 2 crystalline rings
      { const u = cl(t / 1.2); if (u < 1) Q.quad(334, X0, Y0, Rr * 0.75, 0, 0, Rr * 0.75, COL.violet, 1, eout(u) * 0.95, f.seed, 1.4 * (1 - u * 0.6)); }   // 3 the spherical wave of Dark, 6 its violet distortion
      { const u = cl(t / 1.4); if (u < 1) Q.quad(321, X0, Y0 - Tz * 2, Rr * 0.55 * (0.5 + 0.6 * eout(u)), 0, 0, Rr * 0.55 * (0.5 + 0.6 * eout(u)), COL.crim, 1, u, f.seed, 1.5); }   // 4 ruby shards flung out
      for (let i = 0; i < (low ? 3 : 6); i++) { const u = cl((t - 0.1) / 1.6), an = i / 6 * TAU + f.seed, L = Rr * 0.6 * eout(u); if (u > 0 && u < 1) Q.quad(322, X0 + Math.cos(an) * L * 0.5, Y0 - Tz * 1.5 + Math.sin(an) * L * 0.3, Math.cos(an) * L * 0.5, Math.sin(an) * L * 0.3, -Math.sin(an) * Tz * 0.9, Math.cos(an) * Tz * 0.9, COL.crim, 1, u, f.seed + i, 1.2 * (1 - u)); }   // 5 liquid ribbons
      { const u = cl(t / 2.6); if (u < 1) Q.quad(335, X0, Y0 - Tz * 3, Rr * 0.8, 0, 0, Rr * 0.8, COL.crim, 1, u, f.seed, low ? 0.45 : 0.9); }   // 7 crystal particles
      if (!low) for (let i = 0; i < 6; i++) { const u = cl(t / 2.2), an = i * 1.05 + f.seed, rr = Rr * 0.6 * eout(u); if (u < 1) parts.push({ m: 'shard', X: X0 + Math.cos(an) * rr, Y: Y0 - Tz * 2 + Math.sin(an) * rr * 0.4 - u * Tz * 2, z: 9e3 + i, s: Tz * 0.5, yaw: t * 4 + i, tilt: t * 3 + i, a: 1 - u, gl: 1, g2: 0.6 }); }   // 8 fragments of the ritual structure
      { const u = cl((t - 0.2) / 1.8); if (u > 0 && u < 1) Q.quad(333, X0, Y0 - Tz * 5, Tz * 5, 0, 0, Tz * 5, COL.crim, bump(u, 0, 0.2, 0.6, 1), u, f.seed, 1.2); }   // 9 the spectral Scorpio sign
      { const u = (t - 0.7) / 0.7; if (u > 0 && u < 1) Q.quad(326, X0, Y0, Rr * 1.15, 0, 0, Rr * 1.15 * FSY, COL.crim, 1, eout(u) * 0.97, f.seed + 9, 1.4 * (1 - u)); }   // 10 the last outward burst
    }
    function drawFx(c) {
      const Tz = T(), on = gpu(); if (!on) { drawMarks2D(c); return; } if (!UL && !FX.length && !list().length && !DEBT.size) return;
      const Q = fgOpen(c), parts = [], shells = [];
      for (const f of FX) airOne(c, Q, f, Tz, parts, shells);
      marks(Q, Tz);
      fgClose(c);
      if (shells.length && glOn()) drawShells(c, shells, Tz);
      if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); c.save(); GLA().drawParts(c, parts, { res: 0.9 }); c.restore(); }
    }
    /* the Venom Debt marks: one painter quad a monster (its runes, at seven the seal), over its head */
    function marks(Q, Tz) { for (const m of DEBT) { if (m.dead || !(m.asDebt > 0)) continue; const X0 = sx(m.x), Y0 = sy(m.y) - (m.z || 0) * Tz - (m.r || 0.5) * Tz * 2.2 - Tz * 0.35, R = Tz * (0.42 + 0.03 * m.asDebt) * (1 + 0.3 * (m.asDebtFl || 0)); Q.quad(323, X0, Y0, R, 0, 0, R * 0.8, COL.crim, 1, m.asDebt, (m.x * 3) % 6, 0.95 + 0.6 * (m.asDebtFl || 0)); } }
    function drawMarks2D(c) { if (!DEBT.size) return; const Tz = T(); c.save(); c.globalCompositeOperation = 'lighter'; for (const m of DEBT) { if (m.dead || !(m.asDebt > 0)) continue; const X0 = sx(m.x), Y0 = sy(m.y) - (m.r || 0.5) * Tz * 2.2 - Tz * 0.35; c.strokeStyle = '#FF2A4A'; c.lineWidth = 1.5; c.globalAlpha = 0.7; for (let i = 0; i < m.asDebt; i++) { const an = i / 7 * TAU + g.t; c.beginPath(); c.arc(X0 + Math.cos(an) * Tz * 0.32, Y0 + Math.sin(an) * Tz * 0.24, Tz * 0.06, 0, TAU); c.stroke(); } } c.restore(); }
    /* the decoy shells: the model drawn as its own spectral crystal replica (the low profile), cracking as it nears its burst */
    function drawShells(c, shells, Tz) { const G = GLA(); for (const f of shells) { if (f.done) continue; const K = Tz * ANIMA_SIZE[f.k] * BIG / G.HEIGHT[f.k], P = Object.assign({}, f.P, { t: (f.P.t || 0) + f.t * 0.2, crack: 0.3 + 0.7 * cl(f.t / f.blow), live: 0.1 }), fade = sstep(0, 0.12, f.t);
      const X0 = sx(f.x) + (f.t > f.blow - 0.3 ? Math.sin(f.t * 80) * Tz * 0.04 : 0); G.draw(c, { X: X0, Y: sy(f.y), K, P, k: f.k, shell: true, low: true, alpha: fade }); } }
    function drawFxList(c, L2, ground) { if (!gpu() || !L2 || !L2.length) return; const Tz = T(), Q = fgOpen(c), parts = [], shells = []; for (const f of L2) ground ? groundOne(Q, f, Tz, parts) : airOne(c, Q, f, Tz, parts, shells); fgClose(c); if (shells.length && glOn()) drawShells(c, shells, Tz); if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); GLA().drawParts(c, parts); } }
    /* the ultimate's detonation at a scene o (pure): its ground and air as if the Testament burst at o.x, o.y o.t s ago */
    function drawSin(c, o) { if (!gpu()) return; const f = { kind: 'testament', x: o.x, y: o.y, t: o.t || 0, life: 3, k: o.k || 3, seed: o.seed || 0 }, Tz = T(), Q = fgOpen(c), parts = []; testamentAir(Q, f, Tz, parts); fgClose(c); if (parts.length && glOn()) GLA().drawParts(c, parts); }
    /* the light over the body (pure: from its screen points r, its pose P): the Crucible's light, the eyes, the blades' heat, the emitter */
    function bodyLight(c, r, P, al, at) {
      if (!r || !gpu()) return; const Q = fgOpen(c), u = r.unit, core = P.core == null ? 0.9 : P.core, cv = r.coreVis == null ? 1 : r.coreVis, bl = cl(P.bloom || 0);
      Q.quad(325, r.core[0], r.core[1], Math.max(6, r.coreR * 3.6), 0, 0, Math.max(6, r.coreR * 3.6), COL.crim, al * (0.4 + 0.6 * cv), 1 / 3.6, bl, Math.min(1.8, 0.75 + 0.3 * core) * al);
      for (const e of r.eyes) Q.glow(e[0], e[1], u * (0.35 + 0.12 * (P.eye || 1)), '#FF1E3C', 0.5 * al);
      const bh = cl(P.bladeHeat || 0); if (bh > 0.05) for (const h of r.tailTips) { const fl = 0.6 + 0.4 * Math.sin((at || 0) * 13 + h[0]); Q.glow(h[0], h[1], u * (1.4 + 2 * bh), COL.crim, 0.4 * bh * al); Q.star(h[0], h[1], u * (1.2 + 1.5 * bh * fl), 0.45 * bh * al, COL.pink); }
      const sq7 = P.seq || 0; if (sq7 > 0.1 && bh < 0.05) for (let i = 0; i < r.tailTips.length; i++) { const e = cl(sq7 - i); if (e > 0.05) Q.glow(r.tailTips[i][0], r.tailTips[i][1], u * 1.4, COL.crim, 0.3 * e * al); }
      if ((P.jaw || 0) > 0.2 && r.mouth) Q.glow(r.mouth[0], r.mouth[1], u * (0.8 + P.jaw), COL.pink, 0.45 * P.jaw * al);
      if ((P.crack || 0) > 0.05) Q.glow(r.core[0], r.core[1] - u * 3, u * 9, COL.crim, 0.18 * P.crack * al);
      fgClose(c);
    }
    function drawBodyFx(c, a) { if (!a.asOut || !a.asOut.r) return; bodyLight(c, a.asOut.r, a.asP || {}, (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1), a.at || 0); }
    /* screen-space: the battlefield darkening and turning crimson-violet for the ultimate; a little darkness for the entrance */
    function drawCine(c, W, Hh) {
      let dim = 0, cx = W / 2, cy = Hh * 0.45, r0 = Math.min(W, Hh) * 0.2, tint = 0;
      if (UL) { const t = UL.t, r = pts(UL.a); dim = 0.55 * sstep(0, 1.4, t) * (1 - sstep(UT.det, UT.det + 0.35, t)) + 0.25 * (1 - sstep(UT.p6, UT.len, t)) * sstep(UT.det, UT.det + 0.35, t) + 0.3 * bump(t, UT.col, UT.det - 0.05, UT.det - 0.01, UT.det + 0.05); tint = sstep(UT.p2, UT.p3, t) * (1 - sstep(UT.p6, UT.len, t)); if (r) { cx = r.core[0]; cy = r.core[1]; r0 = T() * 4; } }
      for (const a of list()) if (a.as && a.as.en >= 0 && !a.as.ready) dim = Math.max(dim, 0.35 * (1 - sstep(2.9, 3.5, Math.max(0, a.as.en))));
      if (dim > 0.005) { c.save(); const gr = c.createRadialGradient(cx, cy, r0, cx, cy, Math.max(W, Hh) * 0.75); gr.addColorStop(0, `rgba(12,4,10,${dim * 0.1})`); gr.addColorStop(0.4, `rgba(10,3,10,${dim * 0.7})`); gr.addColorStop(1, `rgba(5,1,4,${Math.min(0.92, dim * 1.2)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
      if (tint > 0.005) { c.save(); const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, `rgba(110,10,60,${0.22 * tint})`); gr.addColorStop(0.6, `rgba(70,8,50,${0.1 * tint})`); gr.addColorStop(1, 'rgba(30,4,20,0)'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
    }
    /* the summon button: the time left (a gold arc) and the Venom Debt laid on the field (a crimson arc: the stacks over all it marks) */
    function drawBtn(c, b) {
      const a = list().find(q => q.st === 'fight' || q.st === 'awaken'); if (!a || !a.as) return; let tot = 0, n = 0; for (const m of DEBT) if (!m.dead) { tot += m.asDebt; n++; } const R = b.r + 6, p = n ? tot / (n * 7) : 0, life = cl(a.life / CFG.life);
      c.save(); c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(40,6,14,.75)'; c.beginPath(); c.arc(b.x, b.y, R, 0, TAU); c.stroke();
      c.strokeStyle = '#FF2A4A'; c.beginPath(); c.arc(b.x, b.y, R, -Math.PI / 2, -Math.PI / 2 + TAU * p); c.stroke();
      c.lineWidth = 2; c.strokeStyle = '#FFC24D'; c.beginPath(); c.arc(b.x, b.y, R + 5, -Math.PI / 2, -Math.PI / 2 + TAU * life); c.stroke();
      c.font = '800 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = '#FF8AA8'; c.fillText('DEBT ' + tot, b.x, b.y - R - 9); c.restore();
    }
    // (a power on demand, aimed as the mind would aim it: for showcases, tests and a boss controller)
    function cast(a, kind, o) { stOf(a); a.as.ready = true; a.as.first = true; if (a.as.act) endAct(a); const c = crowd(a.x, a.y, 9, 2.6), m = H.near(a.x, a.y, 10)[0];
      if (kind === 'perd' || kind === 'molt') { const t2 = (o && o.m) || m; if (!t2) return false; start(a, kind, { m: t2 }); }
      else if (kind === 'lab') start(a, kind, o || (c ? { x: c.x, y: c.y } : m ? { x: m.x, y: m.y } : null)); else start(a, kind, o); return true; }
    return { tick, fin, cast, choose, update, stop, outK, descent, entrance, interrupt, drawGround, drawFx, drawBodyFx, drawCine, drawBtn, drawFxList, drawSin, bodyLight, burstFx, waveFx, addDebt: (m, n) => addDebt(m, n, list()[0]), debtOf, CFG,
      get ul() { return UL; }, get fx() { return FX; }, get debt() { return DEBT; } };
  }
  return { create, CFG, UT, BIG, poseFor, easePose, ultPose, strikeE };
})();
if (typeof self !== 'undefined') self.ASMODEUS_MOVES = ASMODEUS_MOVES;
