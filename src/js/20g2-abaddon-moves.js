/* ---------- (v418 AB) Abaddon, The Eternal Moonlight, in a fight: its four powers and The Ninth Tide ----------
   Summoned, Abaddon (the Cancer Anima, 02e; its model 02f3) fights as a guardian through the Anima cycle (20g-dun-anima.js
   calls tick / fin / update and the draw hooks below), choosing among:
     Lunar Carapace     it folds its wings and claws into a lunar sphere and throws a field of panels round the pet: a shield
                        (a ward in hurtPet, 20b) that absorbs up to a share of the pet's health, takes CFG.carapace.reduce off
                        every blow while it lasts and frees the pet from slows and knockback; what it takes is STORED in the Heart.
     Crescent Reavers   its arms telescope out and its claws split into orbiting crescent blades that cross round a crowd:
                        slash after slash (2 / 4 / 6 by form), each pulling the monsters toward the crossing; the last form ends
                        in a larger detonation.
     Gravitational Tide the Heart speeds up, rings project onto the floor and gravity turns over: monsters in the field float
                        up (held), are drawn to its middle and take Water / Shadow damage every CFG.tide.tick s. Bosses are never
                        lifted or dragged: they are slowed instead.
     Eclipse Requiem    it seals itself into a sphere, its Heart a black moon in a blue corona: for the seal it absorbs every
                        blow at the pet and swallows enemy shots near it, then the panels snap open in a spherical shockwave whose
                        damage grows with all it has stored (capped: CFG.eclipse.cap).
   and, as its Astral Awakening, The Ninth Tide (six stages: Eclipse, the Artificial Moon, Reverse the Ocean, Lunar
   Compression, The Ninth Tide, Recovery), huge Water / Shadow damage, Lunar Weakness on every monster it reaches (they take
   CFG.tide9.weakK more damage; bosses CFG.tide9.weakKBoss, for less time) and a lunar shield on the pet.
   Every number a design choice made here is in CFG (documented there). The forms are the Anima's own ascension (k 1 / 2 / 3
   stand for base / level 4 / level 7): more slashes, a wider field, a stronger shield and a bigger seal as it grows.
   The pictures: its body on the GPU (ABADDON_GL), the effects on the shared FGFX painter (kinds 120-131, 20k6h, and its water
   kinds), the Reavers' blades and the Ninth Tide's sea as GLM meshes. Without the GPU painter the powers still act in full and
   are shown with the game's own particles. lowFx halves the particle counts and drops the costliest layers.
   Clean-up: stop() (the stage ends or the map closes), a dismissal (the Anima leaves), the pet's death or an interrupted
   power each release the lifted monsters, the ward, the camera and every effect.
   (v420 AP) Shared with the boss fight (20o2-cancer-abaddon-boss.js), all pure (no game state touched):
     inst.drawTide9(c, { x, y, t, seed, k: 3, alpha, strike, rel, len, r, groundOnly, skyOnly, at, size, hover, from, fromP, glowK, blastT })
       The Ninth Tide's whole picture (the god, its sea, every light) at t s into it: x, y the god's floor point (tiles); strike /
       rel / len its timings (default CFG.tide9; the picture is remapped onto them); r the sea's radius (tiles); groundOnly the
       floor layer alone (under the entities), skyOnly the sky, the sea and the god alone (over them). at the body's clock (its
       living motion), size its height (tiles), hover, from / fromP the summoned Anima's place and pose (glided from and back to).
       glowK (default 1) multiplies all its additive light (glows, stars, beams, shells, the blast, the body's light); blastT (s,
       default 0.35) how long the blast's white peak lasts before the scene reads again.
       Returns { x, y } the risen Heart's screen point (and r, the god's screen points). Our own Ninth Tide draws through it.
     inst.bodyLight(c, r, P, alpha, at)   the light over the body (the Lunar Heart's glow, eye, claw edges, halo, seams).
     ABADDON_MOVES.poseFor(kind, t, o)    the pose a power holds t s in ('carapace' | 'reavers' | 'tide' | 'eclipse' | 'swipe'),
       with its wind-up and follow-through; o = { seal, dur, arm, base, n, charge }. ABADDON_MOVES.easePose(store, tg, dt) the
       shared ease (store.pz). */
const ABADDON_MOVES = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL), FSY = 0.55;   // (the floor's squash for discs laid on it)
  /* ---- the numbers (power multipliers are times the Anima's power P = the pet's attack x ANIMA_POWER[form]; [a, b, c] by form) ---- */
  const CFG = {
    carapace: { pool: [0.3, 0.42, 0.55],   // the shield's pool, a share of the pet's max health
      dur: [4.5, 5.0, 5.5],                 // how long it holds (s)
      reduce: 0.35,                         // what it takes off every blow while it holds (before the pool absorbs the rest)
      rehp: 0.6, act: 1.7, low: 0.3 },     // the pet's health under which it most wants the shield; its fold (s); v435 AN: low - the share
                                            // (of its pool, or of 1.5 s of its time) under which a carapace counts as spent and is refreshed
    // v435 AN: no cooldowns (the user's rule for every summon): the old cd values are gone; the mind (choose) weighs the field instead
    reavers: { slashes: [2, 4, 6], dmg: 0.95, r: [1.6, 1.8, 2.0], pull: 0.55, gap: 0.17, fin: 2.4, finR: 2.8, reach: 9 },
    tide: { dur: [2.2, 2.6, 3.0], r: [3.0, 3.5, 4.0], tick: 0.3, dmg: 0.3, pull: 1.6, lift: 0.75, slow: 1.6 },
    eclipse: { seal: [1.3, 1.5, 1.7], base: 2.2, k: 6, cap: [3, 4, 5], r: [3.6, 4.2, 4.8], minLife: 5.5, absorbR: 4.5, store: 0.25 },
    swipe: { dmg: 0.8, r: 3.4 },
    mind: { gap: 0.15, rep: 0.78, last: 0.85, hist: 4, jit: 0.1 },   // v435 AN: the beat between powers (s); variety: x rep for each use among its last hist powers, x last more for the very last; a little chance
    tide9: { len: 5.6, strike: 3.95, rel: 4.7, r: 12, k: 8, kc: 4, core: 4, weak: 8, weakBoss: 5, weakK: 1.25, weakKBoss: 1.12, shield: 0.5, shieldT: 6 },
  };
  const COL = { sap: '#6FA2FF', ice: '#BFD8FF', white: '#EAF2FF', deep: '#2448B8', teal: '#7FE6FF', gold: '#E8C27A', night: '#03050E' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);

  /* ---- (v420 AP) the power poses, pure and shared (the Anima here, the boss in 20o2): poseFor(kind, t, o) is the pose a power
     holds t s into it - kind 'carapace' | 'reavers' | 'tide' | 'eclipse' | 'swipe' (anything else: the resting pose); o: base (an
     ABADDON_GL.idlePose, the default the form-3 rest at t 0), seal / dur (the eclipse's seal and the power's length; CFG's by
     default), arm (the swipe's arm, 0 right / 1 left), n (the Reavers' slashes), charge (the Heart's stored charge). Every power has
     its anticipation (a wind-up the other way), its strike and its follow-through (a damped settle), and turns its living motion
     down (live) while it holds its shape. easePose(store, tg, dt) eases store.pz toward tg (the arms faster than the body; the
     eclipse's panels snap) and returns it. ---- */
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  const settle = (t, t0, f, k) => (t > t0 ? Math.exp(-(t - t0) * k) * Math.sin((t - t0) * f) : 0);   // (a damped ring after t0)
  function poseFor(kind, t, o) {
    o = o || {}; const base = o.base || (typeof ABADDON_GL !== 'undefined' ? ABADDON_GL.idlePose(3, 0) : { arm: [{}, {}], open: 1, heart: 0.8, eye: 1 });
    const arm = i => Object.assign({ swing: 0, raise: 0, ext: 0.2, claw: 0, edge: 0, bend: 0, pinch: 0 }, (base.arm && base.arm[i]) || {});
    const tg = { open: base.open == null ? 1 : base.open, fold: 0, spread: 0, heart: (base.heart == null ? 0.8 : base.heart) + (o.charge || 0) * 0.6, dark: 0, ringK: 1, align: 0, glow: 0, ringGlow: 0, seam: 0, eye: base.eye == null ? 1 : base.eye, lift: 0, pitch: 0, roll: 0, live: 1, arms: [arm(0), arm(1)], tenK: 0, tenUp: 0, stagger: 0, snapOpen: false };
    const B = tg.arms, bo = tg.open;
    if (kind === 'carapace') {   // it rears and throws its arms wide, snaps shut into its shell (a shiver as it locks), holds, then blossoms open with a sway that settles
      const dur = o.dur || CFG.carapace.act, wind = bump(t, 0, 0.18, 0.2, 0.34), f = sstep(0.2, 0.42, t) * (1 - sstep(dur - 0.55, dur - 0.15, t)), lock = settle(t, 0.42, 26, 8) * (t < dur - 0.55 ? 1 : 0), op = settle(t, dur - 0.3, 9, 3.5);
      tg.fold = f; tg.open = lerp(bo, 0, f); tg.seam = f; tg.heart += f * 0.8 + bump(t, 0.38, 0.46, 0.5, 0.9) * 1.3; tg.glow = f * 0.3 + bump(t, 0.38, 0.46, 0.5, 0.9) * 0.3; tg.pitch = -0.1 * wind + 0.05 * lock; tg.lift = 0.3 * wind; tg.spread = 0.55 * wind + 0.3 * op; tg.stagger = 0.15 * lock; tg.live = 1 - 0.85 * Math.max(wind, f);
      for (const q of B) { q.swing = -0.35 * wind + 0.12 * op; q.raise = 0.45 * wind - 0.1 * op; q.claw = -0.45 * wind + 0.2 * op; q.pinch = 0.6 * wind; q.ext = lerp(q.ext, 0.75, wind); }
    } else if (kind === 'reavers') {   // arms drawn back and up as it rises, a snap forward, the claws slashing in turn (left, right) to the rhythm of the blades, a settle
      const dur = o.dur || 2, gap = CFG.reavers.gap, ant = bump(t, 0, 0.32, 0.42, 0.55), go = sstep(0.42, 0.58, t) * (1 - sstep(dur - 0.45, dur, t)), fol = settle(t, dur - 0.4, 10, 4);
      B.forEach((q, i) => { const s = (t - 0.6) / gap, hit = go * (0.5 + 0.5 * Math.cos(Math.PI * (s - i)));
        q.swing = -0.75 * ant + 0.3 * go + 0.35 * hit + 0.15 * fol; q.raise = 0.45 * ant + 0.22 * go - 0.08 * hit; q.ext = lerp(q.ext, 1, go); q.claw = -0.45 * ant - 0.6 * go - 0.2 * hit; q.pinch = -0.3 * ant + 0.7 * hit; q.edge = go * 1.2 + ant * 0.5; q.bend = 0.3 * ant - 0.1 * go; });
      tg.pitch = -0.12 * ant + 0.1 * go + 0.04 * fol; tg.lift = 0.35 * ant + 0.1 * go; tg.glow = 0.3 * go + 0.15 * ant; tg.ringK = 1 - 0.5 * ant + go; tg.spread = 0.3 * go - 0.15 * ant; tg.roll = 0.05 * Math.sin(t * 9) * go; tg.live = 1 - 0.75 * Math.max(ant, go);
    } else if (kind === 'tide') {   // a gather (arms swept down and back, a bow), then the arms lift the world, heaving; the release drops them with a ring
      const dur = o.dur || CFG.tide.dur[2] + 0.35, wind = bump(t, 0, 0.25, 0.3, 0.45), on = sstep(0.3, 0.6, t) * (1 - sstep(dur - 0.3, dur, t)), rel = settle(t, dur - 0.25, 8, 3.5), hv = Math.sin(t * 2.4) * on;
      tg.heart += on * 1.1 + wind * 0.4; tg.ringK = 1 + on * 3.5 - wind * 0.6; tg.ringGlow = on * 1.2; tg.glow = on * 0.35; tg.spread = on * 0.55 - wind * 0.2; tg.tenUp = on * 0.35; tg.tenK = on; tg.pitch = 0.08 * wind - 0.05 * on + 0.04 * rel; tg.lift = -0.25 * wind + 0.35 * on + 0.1 * hv; tg.live = 1 - 0.6 * Math.max(on, wind);
      for (const q of B) { q.raise = -0.25 * wind + 0.55 * on + 0.06 * hv - 0.1 * rel; q.claw = 0.25 * wind - 0.5 * on; q.ext = lerp(q.ext, 0.85, on); q.swing = -0.2 * wind + 0.15 * on + 0.1 * rel; q.pinch = 0.5 * on; }
    } else if (kind === 'eclipse') {   // arms flung wide, it seals itself (shivering with what it holds), the panels snap open with a recoil and a ringing settle
      const seal = o.seal || CFG.eclipse.seal[2], dur = o.dur || seal + 1, wide = bump(t, 0, 0.15, 0.18, 0.35), cls = sstep(0.12, 0.5, t) * (1 - sstep(seal, seal + 0.18, t)), snap = sstep(seal, seal + 0.2, t) * (1 - sstep(seal + 0.5, dur, t)), rg = settle(t, seal + 0.2, 11, 4);
      tg.fold = cls; tg.open = lerp(bo, 0, cls); tg.dark = cls; tg.seam = cls; tg.heart = lerp(tg.heart, 1.8, cls) + snap * 1.5; tg.spread = snap + 0.3 * wide + 0.25 * rg; tg.glow = snap * 0.8 + cls * 0.2; tg.ringK = 1 + snap * 4; tg.eye = tg.eye + snap * 1.5; tg.pitch = -0.08 * wide + 0.025 * Math.sin(t * 31) * cls - 0.1 * snap * (1 - sstep(seal + 0.2, seal + 0.6, t)); tg.snapOpen = t > seal; tg.live = 1 - 0.85 * Math.max(cls, snap * 0.6);
      for (const q of B) { q.raise = 0.4 * snap + 0.3 * wide; q.claw = -0.6 * snap - 0.3 * wide; q.ext = lerp(q.ext, 1, snap); q.swing = -0.25 * wide + 0.15 * rg; q.pinch = 0.6 * snap; }
    } else if (kind === 'swipe') {   // the claw drawn back (a counter-turn of the body), the sweep, an overshoot that rings out
      const i = o.arm ? 1 : 0, q = B[i], q2 = B[1 - i], ant = sstep(0, 0.18, t) * (1 - sstep(0.18, 0.24, t)), hit = sstep(0.18, 0.3, t) * (1 - sstep(0.36, 0.62, t)), fol = settle(t, 0.3, 14, 6);
      q.swing = -0.7 * ant + 0.9 * hit + 0.2 * fol; q.raise = 0.35 * ant - 0.12 * hit; q.ext = lerp(q.ext, 1, Math.max(hit, ant * 0.4)); q.claw = -0.3 * ant + 0.3 * hit; q.pinch = -0.3 * ant + 0.6 * hit; q.edge = hit + 0.6 * ant; q.bend = 0.35 * ant - 0.15 * hit;
      q2.swing += 0.2 * ant - 0.15 * hit; tg.pitch = -0.05 * ant + 0.07 * hit; tg.roll = (i ? -1 : 1) * (0.08 * ant - 0.12 * hit); tg.live = 1 - 0.7 * Math.max(ant, hit);
    }
    return tg;
  }
  const PZK = ['open', 'fold', 'spread', 'heart', 'dark', 'ringK', 'align', 'glow', 'ringGlow', 'seam', 'eye', 'lift', 'pitch', 'tenK', 'tenUp', 'stagger', 'roll', 'live'], ARMK = ['swing', 'raise', 'ext', 'claw', 'edge', 'bend', 'pinch'];
  function easePose(store, tg, dt) {
    let pz = store.pz; const r1 = Math.min(1, dt * 7), r2 = Math.min(1, dt * 14), dv = q => (q === 'live' ? 1 : 0);
    if (!pz) pz = store.pz = Object.assign({}, tg, { arms: tg.arms.map(q => Object.assign({}, q)) });
    if (!pz.arms) pz.arms = [{}, {}];
    for (const q of PZK) { const v = tg[q] == null ? dv(q) : tg[q]; if (pz[q] == null) pz[q] = v; pz[q] += (v - pz[q]) * (q === 'open' && tg.snapOpen ? Math.min(1, dt * 18) : r1); }
    for (let i = 0; i < 2; i++) { const s = pz.arms[i] || (pz.arms[i] = {}), d = (tg.arms && tg.arms[i]) || {}; for (const q of ARMK) { const v = d[q] || 0; s[q] = (s[q] || 0) + (v - (s[q] || 0)) * r2; } }
    return pz;
  }

  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = H.T, ST = H.ST, S = H.S;
    const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
    const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
    const glOn = () => typeof ABADDON_GL !== 'undefined' && ABADDON_GL.usable();
    /* the shared FGFX batch may already be open round us (the dungeon's own, dqBegin .. dqEnd in 20b): what it holds is drawn first,
       ours goes in a batch of its own, and an empty batch is left for the dungeon to carry on with (else ours would be drawn twice) */
    const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
    const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
    const FX = [];                 // effects in the world: { kind, t, life, ... }
    let sh = null, wardOff = null; // the pet's lunar shield { pool, max, t, life, src, hit: [age, dir] } and the ward's remover
    let seal = null;               // the eclipse seal absorbing everything { a }
    let T9 = null;                 // The Ninth Tide in progress
    const lifted = new Map();      // monsters held up: m -> { z, by, rel }
    const kOf = a => Math.max(1, Math.min(3, a.st === 'awaken' ? 3 : a.k | 0));
    const pw = a => H.P(a);
    const LQ = () => (lowFx() ? 0.5 : 1);
    /* ---- the ward: the eclipse seal swallows every blow; the carapace (and the Ninth Tide's lunar shield) absorb from a pool ---- */
    function ensureWard() { if (wardOff || !X.addWard) return; wardOff = X.addWard((d, src, o) => wardFn(d, src, o), true); }
    function wardFn(d, src, o) {
      if (!(d > 0)) return d;
      if (seal && seal.a && Math.hypot(me.x - seal.a.x, me.y - seal.a.y) < CFG.eclipse.absorbR + 1.5) { seal.a.ab.store += d; seal.took += d; ripple(src); return 0; }
      if (sh && sh.pool > 0) { const s = Math.min(sh.pool, d); sh.pool -= s; d -= s; const owner = sh.a && sh.a.ab; if (owner) owner.store += s + (sh.src === 'carapace' ? s * CFG.carapace.reduce / (1 - CFG.carapace.reduce) : 0); sh.took += s; ripple(src);
        if (sh.pool <= 0) { breakShield(); } }
      return d;
    }
    function ripple(src) { const dir = src && src.x != null ? Math.atan2(src.y - me.y, src.x - me.x) : Math.random() * TAU; if (sh) sh.hit = [0.001, dir]; X.ring(me.x, me.y - 0.4, 0.6, 1.3, 0.25, COL.ice, 0.08);
      const own = (sh && sh.a) || (seal && seal.a); if (own && own.ab) { own.ab.charge = Math.min(1.5, (own.ab.charge || 0) + 0.35); own.ab.stag = 1; } }   // (the Heart charges; the blow it took through its shield staggers it a little)
    function breakShield() { if (!sh) return; X.text(me.x, me.y - 1.3, 'Carapace broken', COL.ice, 13); for (let i = 0; i < 14 * LQ(); i++) { const an = Math.random() * TAU; X.part({ kind: 'star', x: me.x + Math.cos(an) * 0.9, y: me.y - 0.4 + Math.sin(an) * 0.6, vx: Math.cos(an) * 3, vy: Math.sin(an) * 2 - 1, life: 0.6, max: 0.6, size: 3, color: COL.ice, drag: 1.5 }); } sh = null; }
    /* ---- state ---- */
    function stOf(a) { return a.ab || (a.ab = { act: null, last: null, streak: 0, hist: [], gap: 0.5 /* v435 AN: no per-power timers; last / streak / hist (its latest powers) for variety, gap the beat between powers */, store: 0, charge: 0, first: false, pz: null, vx: 0, vy: 0, ax: 0, ay: 0, px: a.x, py: a.y }); }
    // the crowd to aim at: the monster with the most others near it (within reach of the pet), and the middle of that crowd
    function crowd(x, y, reach, rr) {
      const tg = H.near(x, y, reach); if (!tg.length) return null; let best = null, bn = -1;
      for (const m of tg) { const nb = tg.filter(q => Math.hypot(q.x - m.x, q.y - m.y) < rr); if (nb.length > bn) { bn = nb.length; best = nb; } }
      return { x: best.reduce((s, m) => s + m.x, 0) / best.length, y: best.reduce((s, m) => s + m.y, 0) / best.length, n: best.length, m: best[0] };
    }
    /* ---- moving: it hovers behind the pet with heavy, deliberate acceleration, drifting toward a power's target ---- */
    function guard(a, dt, aim) {
      const ab = a.ab, side = a.side || -1, dp = Math.hypot(me.x - a.x, me.y - a.y);
      if (dp > 13) { const p = X.walkPoint(me.x + side * 1.5, me.y - 1.8, { r: 0.4, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y; a.vx = a.vy = 0; X.sparks(a.x, a.y, COL.ice, 10, 4); return; }
      let tx = me.x + side * 1.55 + (me.vx || 0) * 0.35, ty = me.y - 1.75 + (me.vy || 0) * 0.35;
      if (aim) { tx = lerp(tx, aim.x, 0.3); ty = Math.min(me.y - 0.9, lerp(ty, aim.y - 1.2, 0.25)); }
      const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), want = Math.min(3.4 * (dp > 5 ? 1.8 : 1), d * 1.6), acc = Math.min(1, dt * 1.6);
      a.vx = (a.vx || 0) + ((d > 0.05 ? dx / d * want : 0) - (a.vx || 0)) * acc; a.vy = (a.vy || 0) + ((d > 0.05 ? dy / d * want : 0) - (a.vy || 0)) * acc;
      const nx = a.x + a.vx * dt, ny = a.y + a.vy * dt, p = X.walkPoint(nx, ny, { r: 0.4, mv: 0, x: a.x, y: a.y }); a.x = p.x; a.y = p.y;
      if (Math.abs(a.vx) > 0.4) a.face = a.vx > 0 ? 1 : -1;
    }
    /* ---- the powers ---- */
    function start(a, kind, o) {
      const ab = a.ab, k = kOf(a); ab.act = Object.assign({ kind, t: 0, k, hits: 0 }, o || {}); const A = ab.act;
      ab.streak = ab.last === kind ? (ab.streak || 0) + 1 : 1; ab.last = kind; (ab.hist || (ab.hist = [])).push(kind); if (ab.hist.length > CFG.mind.hist) ab.hist.shift();   // v435 AN
      if (kind === 'carapace') { A.dur = CFG.carapace.act; X.sfx.hum(); emoteSafe(a, 'heart'); }
      else if (kind === 'reavers') { A.n = CFG.reavers.slashes[k - 1]; A.dur = 0.6 + A.n * CFG.reavers.gap + (k >= 3 ? 0.45 : 0.1) + 0.45; A.seed = Math.random() * 100; X.sfx.whoosh(); }
      else if (kind === 'tide') { A.dur = CFG.tide.dur[k - 1] + 0.35; A.R = CFG.tide.r[k - 1]; A.tk = 0; A.el = 0; X.sfx.hum(); FX.push({ kind: 'gfield', x: A.x, y: A.y, R: A.R, t: 0, life: A.dur + 0.5, a, seed: Math.random() * 50 }); }
      else if (kind === 'eclipse') { A.seal = CFG.eclipse.seal[k - 1]; A.dur = A.seal + 1.0; A.R = CFG.eclipse.r[k - 1]; X.sfx.hum(); FX.push({ kind: 'eclipse', a, t: 0, life: A.dur + 0.4, seal: A.seal, R: A.R }); }
      else if (kind === 'swipe') { A.dur = 0.62; A.arm = A.m.x > a.x ? 0 : 1; }
    }
    const emoteSafe = (a, k) => { try { H.emote(a, k); } catch (e) {} };
    function act(a, dt) {
      const ab = a.ab, A = ab.act, t0 = A.t; A.t += dt; const t = A.t, k = A.k, P = pw(a), cross = (x) => t0 < x && t >= x;
      if (A.kind === 'carapace') {
        if (cross(0.45)) { const C = CFG.carapace, max = ST().hp * C.pool[k - 1]; sh = { pool: max, max, t: 0, life: C.dur[k - 1], src: 'carapace', a, took: 0, hit: null }; ensureWard();
          FX.push({ kind: 'link', a, t: 0, life: 0.6 }); X.text(me.x, me.y - 1.4, 'LUNAR CARAPACE', COL.ice, 14, { crit: true, life: 1 }); X.sfx.sparkle(); }
      } else if (A.kind === 'reavers') {
        if (cross(0.5)) FX.push({ kind: 'reaver', a, x: A.x, y: A.y, n: A.n, k, t: 0, life: A.dur - 0.4, seed: A.seed, r: CFG.reavers.r[k - 1] });
        for (let i = 0; i < A.n; i++) if (cross(0.6 + i * CFG.reavers.gap)) slash(a, A, i, P);
        if (k >= 3 && cross(0.6 + A.n * CFG.reavers.gap + 0.25)) detonate(a, A, P);
      } else if (A.kind === 'tide') {
        const R = A.R, on = t > 0.35 && t < A.dur;
        if (on) for (const m of H.living()) { const d = Math.hypot(m.x - A.x, m.y - A.y); if (d > R + m.r) continue;
          if (m.boss) { m.chill = Math.max(m.chill || 0, 0.4); continue; }   // (bosses are never lifted or dragged: slowed instead)
          let q = lifted.get(m); if (!q) { q = { z: m.liftZ || 0, by: a, ph: Math.random() * TAU }; lifted.set(m, q); }
          q.rel = 0; q.z = Math.min(CFG.tide.lift, q.z + dt * 2.4); m.liftZ = q.z + 0.08 * Math.sin(g.t * 3 + q.ph);
          if (!m.still && d > 0.35) { const sp = Math.min(d, CFG.tide.pull * dt * (0.6 + d / R)); const an = Math.atan2(A.y - m.y, A.x - m.x) + 0.6; X.moveEnt(m, Math.cos(an) * sp, Math.sin(an) * sp); } }
        if (on) { A.tk -= dt; if (A.tk <= 0) { A.tk = CFG.tide.tick; A.el ^= 1; for (const m of H.living()) if (Math.hypot(m.x - A.x, m.y - A.y) < R + m.r) H.hit(m, P * CFG.tide.dmg, { el: A.el ? 'shadow' : 'bubble', dot: true, dotC: COL.teal }); } }
        if (cross(A.dur)) releaseLift(a, true);
      } else if (A.kind === 'eclipse') {
        if (cross(0.3)) { seal = { a, took: 0 }; ensureWard(); }
        if (seal && t < A.seal) { const R = CFG.eclipse.absorbR; for (let i = X.eshots.length - 1; i >= 0; i--) { const b = X.eshots[i], d = Math.hypot(b.x - a.x, b.y - a.y); if (d < R) { if (d < 0.9) { ab.store += b.dmg || 0; X.eshots.splice(i, 1); X.sparks(a.x, a.y - 1, COL.ice, 4, 3); } else { b.x += (a.x - b.x) / d * Math.min(d, 9 * dt); b.y += (a.y - b.y) / d * Math.min(d, 9 * dt); } } } }
        if (cross(A.seal)) { seal = null; requiem(a, A, P); }
      } else if (A.kind === 'swipe') {
        if (cross(0.26)) { const m = A.m; if (m && !m.dead) { H.hit(m, P * CFG.swipe.dmg, { el: 'shadow', kb: 3 }); for (const q of H.near(m.x, m.y, 1.3)) if (q !== m) H.hit(q, P * CFG.swipe.dmg * 0.6, { el: 'shadow', kb: 2 }); X.sfx.whoosh(); }
          FX.push({ kind: 'swipe', a, arm: A.arm, t: 0, life: 0.35, to: m ? { x: m.x, y: m.y } : null }); }
      }
      if (t >= A.dur) { endAct(a); }
    }
    function endAct(a) { const ab = a.ab, A = ab.act; if (!A) return;
      if (A.kind === 'tide') releaseLift(a, false); else if (A.kind === 'eclipse') { if (seal && seal.a === a) seal = null; }
      ab.act = null; ab.gap = CFG.mind.gap; }   // v435 AN: no cooldown set: only the beat before its next power
    // (an interrupted power: no more blows, the held monsters set down, the seal lifted, its pictures left to fade)
    function abort(a) { const ab = a.ab; if (!ab || !ab.act) return; const A = ab.act; if (A.kind === 'tide') releaseLift(a, false); if (seal && seal.a === a) seal = null; for (const f of FX) if (f.a === a && f.life - f.t > 0.4) f.life = f.t + 0.4; ab.act = null; }
    function releaseLift(a, land) { for (const [m, q] of lifted) { if (q.by !== a) continue; q.rel = 1; q.land = land; } }
    function slash(a, A, i, P) {
      const R = CFG.reavers.r[A.k - 1];
      for (const m of H.living()) { const d = Math.hypot(m.x - A.x, m.y - A.y); if (d > R + 1.6 + m.r) continue;
        if (d < R + m.r) { H.hit(m, P * CFG.reavers.dmg, { el: i % 2 ? 'shadow' : 'bubble', kb: 0.5 }); A.hits++; }
        if (!m.boss && !m.still && d > 0.4) { const s = Math.min(d - 0.3, CFG.reavers.pull); X.moveEnt(m, (A.x - m.x) / d * s, (A.y - m.y) / d * s); } }
      X.sparks(A.x, A.y - 0.3, COL.ice, Math.round(8 * LQ()), 6); X.shake(3 + A.k, 0.12); if (i % 2 === 0) X.sfx.whoosh();
      FX.push({ kind: 'shock', x: A.x, y: A.y, t: 0, life: 0.45, R: R * 1.25, col: i % 2 ? COL.ice : COL.sap, w: 0.06 });
    }
    function detonate(a, A, P) {
      const R = CFG.reavers.finR; X.hitArea(A.x, A.y, R, P * CFG.reavers.fin, { src: 'anima', noProxy: true, el: 'shadow', kb: 4 });
      FX.push({ kind: 'shock', x: A.x, y: A.y, t: 0, life: 0.7, R: R * 1.4, col: COL.white, w: 0.1, big: 1 }); FX.push({ kind: 'frags', x: A.x, y: A.y, t: 0, life: 0.9, n: Math.round(14 * LQ()), seed: Math.random() * 99 });
      X.flash(0.15, '#BFD8FF'); X.shake(10, 0.3); X.sfx.crash(); X.light(A.x, A.y, 4, 0.4);
    }
    function requiem(a, A, P) {
      const ab = a.ab, k = A.k, E = CFG.eclipse, R = A.R, bonus = Math.min(E.cap[k - 1], ab.store / Math.max(1, ST().hp) * E.k), d = P * (E.base + bonus);
      let n = 0; for (const m of H.living()) if (Math.hypot(m.x - a.x, m.y - a.y) < R + m.r) { H.hit(m, d, { el: n % 2 ? 'shadow' : 'bubble', kb: 6, noCrit: true }); n++; }
      X.text(me.x, me.y - 1.6, bonus > 0.5 ? `Eclipse Requiem ×${(1 + bonus / E.base).toFixed(1)}` : 'Eclipse Requiem', COL.ice, 13, { life: 1.2 });
      ab.store = 0; ab.charge = 0; FX.push({ kind: 'requiem', a, x: a.x, y: a.y, t: 0, life: 1.1, R, k: 1 + bonus / E.base });
      X.flash(0.45, '#DDE8FF'); X.shake(16 + k * 2, 0.5); X.sfx.crash(); X.light(a.x, a.y, 7, 0.8); g.hitStop = Math.max(g.hitStop || 0, 0.06);
    }
    /* ---- the guardian's mind (v435 AN): no cooldowns. One power at a time: whenever it is free (each power's wind-up, action and
       follow-through are its animation lock, then a short beat) it weighs the field and picks the power that fits it best:
         Lunar Carapace     the pet has no shield, or the one it has is spent or about to lapse (it is refreshed to full, never stacked):
                            wanted most when the pet is hurt, swarmed or shot at;
         Eclipse Requiem    monsters round it and a good share of the pet's health stored to release (in its last seconds, whatever
                            it holds); now and then a plain seal against a big crowd;
         Gravitational Tide a crowd of two or more round the pet, the larger the more;
         Crescent Reavers   any monster in reach, at the middle of the crowd (so it is never idle while monsters are about);
         a claw swipe       a monster right by it: the quick blow between the great powers.
       A power starts only if it can finish in the time left. Variety: each power is weighed down for every time it was used among its
       last four (more if it was the very last) and a little chance is added: a bias, never a timer. */
    function choose(a) {
      const ab = stOf(a), k = kOf(a), hp = ST().hp, life = a.life, M = CFG.mind, foes = H.near(a.x, a.y, CFG.reavers.reach), opts = [];
      if (!foes.length) return null;
      const n6 = foes.filter(m => Math.hypot(m.x - a.x, m.y - a.y) < 6).length, onPet = H.near(me.x, me.y, 2.6).length, shots = (X.eshots || []).filter(b => Math.hypot(b.x - me.x, b.y - me.y) < 3.5).length, hurt = me.hp < hp * CFG.carapace.rehp;
      const left = sh ? Math.min(sh.pool / Math.max(1, sh.max), (sh.life - sh.t) / 1.5) : 0;
      if (left < CFG.carapace.low && life > CFG.carapace.act + 0.4) opts.push({ kind: 'carapace', s: 0.42 + (hurt ? 0.45 : 0) + Math.min(0.3, onPet * 0.1) + Math.min(0.3, shots * 0.08) });
      const E = CFG.eclipse, stK = ab.store / Math.max(1, hp);
      if (n6 && life > E.seal[k - 1] + 1.2) { const s = stK >= E.store ? 0.85 + Math.min(0.5, stK) : life < E.minLife && stK > 0.04 ? 0.75 : n6 >= 3 ? 0.4 + 0.06 * Math.min(5, n6) : 0; if (s) opts.push({ kind: 'eclipse', s }); }
      if (life > CFG.tide.dur[k - 1] + 0.6) { const c = crowd(me.x, me.y, 8, 2.5); if (c && c.n >= 2) opts.push({ kind: 'tide', s: 0.5 + 0.08 * Math.min(5, c.n), o: { x: c.x, y: c.y } }); }
      const rd = 0.6 + CFG.reavers.slashes[k - 1] * CFG.reavers.gap + (k >= 3 ? 0.45 : 0.1) + 0.45;
      if (life > rd + 0.1) { const c = crowd(me.x, me.y, CFG.reavers.reach, 2.2); if (c) opts.push({ kind: 'reavers', s: 0.55 + 0.08 * Math.min(5, c.n), o: { x: c.x, y: c.y } }); }
      const m = H.near(a.x, a.y, CFG.swipe.r)[0]; if (m && life > 0.7) opts.push({ kind: 'swipe', s: 0.45, o: { m } });
      if (!opts.length) return null;
      for (const q of opts) { const n = (ab.hist || []).filter(h => h === q.kind).length; q.s *= Math.pow(M.rep, n) * (q.kind === ab.last ? M.last : 1); q.s += Math.random() * M.jit; }
      opts.sort((p, q) => q.s - p.s); return opts[0];
    }
    function tick(a, dt) {
      const ab = stOf(a);
      if (me.dead) { abort(a); return; }
      if (ab.act) { act(a, dt); if (ab.act) guard(a, dt, ab.act.x != null ? ab.act : null); return; }
      guard(a, dt, null);
      if (!ab.first) { ab.first = true; return start(a, 'carapace'); }
      ab.gap -= dt; if (ab.gap > 0) return;
      const ch = choose(a); if (ch) start(a, ch.kind, ch.o);
    }
    /* ---- the pose: what each power and moment does to the body, eased so nothing snaps (v420 AP: poseFor / easePose, shared with the boss) ---- */
    function poseOf(a, dt) {
      const ab = stOf(a), k = kOf(a), base = (typeof ABADDON_GL !== 'undefined' ? ABADDON_GL.idlePose(k, a.at || 0) : { arm: [{}, {}] }), A = ab.act;
      const tg = poseFor(A ? A.kind : null, A ? A.t : 0, { base, charge: ab.charge, seal: A && A.seal, dur: A && A.dur, arm: A && A.arm, n: A && A.n });
      if (a.st === 'enter') { const e = a.abEn || 0; tg.open = lerp(0, base.open, sstep(0.15, 1.1, e)); tg.heart = lerp(0.1, 2.2, sstep(0.1, 0.5, e)) - sstep(0.6, 1.3, e) * 1.2; tg.glow = 0.6 * (1 - sstep(0.5, 1.3, e)); tg.seam = 1 - sstep(0.2, 0.8, e); tg.ringK = 3 - sstep(0.4, 1.4, e) * 2;
        tg.spread = 0.45 * sstep(0.7, 1.1, e) * (1 - sstep(1.2, 1.9, e)); tg.lift = 0.3 * Math.sin(Math.PI * sstep(0.6, 1.6, e)); tg.live = sstep(0.8, 1.8, e); }   // (v420 AP: it blossoms with a stretch, then settles into its living hover)
      if (a.st === 'leave') { const u = sstep(0, 0.7, a.lv || 0); tg.open = lerp(tg.open, 0, u); tg.fold = u; tg.heart *= 1 - u * 0.7; tg.lift = u * 1.2; tg.live *= 1 - u; }
      if (a.st === 'awaken') { const u = sstep(0, 0.7, a.aw || 0); tg.spread = Math.max(tg.spread, u * 0.6); tg.heart += u; tg.ringK += u * 2; tg.glow = Math.max(tg.glow, u * 0.5); }
      if (ab.stag > 0) { ab.stag = Math.max(0, ab.stag - dt * 3); tg.stagger = Math.sin(ab.stag * Math.PI) * 0.8; tg.pitch -= 0.08 * Math.sin(ab.stag * Math.PI); }
      ab.charge = Math.max(0, (ab.charge || 0) - dt * 0.15);
      const pz = easePose(ab, tg, dt);
      // the body's motion: banking into its drift, leaning, the tendrils' springs
      const vx = a.vx || 0, vy = a.vy || 0; ab.ax = lerp(ab.ax, (vx - (ab.lvx || 0)) / Math.max(dt, 1e-3), 0.3); ab.ay = lerp(ab.ay, (vy - (ab.lvy || 0)) / Math.max(dt, 1e-3), 0.3); ab.lvx = vx; ab.lvy = vy;
      const foe = A && A.x != null ? A : A && A.m ? A.m : null, yawT = foe ? Math.max(-0.6, Math.min(0.6, -Math.atan2(foe.x - a.x, Math.max(0.4, foe.y - a.y)))) : -(a.face || 1) * 0.1;
      ab.yaw = lerp(ab.yaw || 0, yawT, Math.min(1, dt * 2.5));
      if (typeof ABADDON_GL !== 'undefined') ABADDON_GL.springs(a, k === 3 ? 8 : k === 2 ? 6 : 4, ab.ax, ab.ay, dt);
      a.abP = Object.assign(base, pz, { arm: pz.arms, yaw: ab.yaw, bank: Math.max(-0.22, Math.min(0.22, -vx * 0.05)) + (pz.roll || 0), pitch: pz.pitch + Math.max(-0.12, Math.min(0.12, vy * 0.03)), k, t: a.at || 0, look: [0, 0] });
    }
    /* ---- The Ninth Tide ---- */
    function fin(a) {
      const C = CFG.tide9; abort(a);
      T9 = { a, t: 0, x: (a.x + me.x) / 2, y: Math.min(a.y, me.y - 0.6) + 0.4, done: false, seed: Math.random() * 1000, tg: [], lifted: new Map(), sil: false };
      a.judg = true; a.jA = 0; g.cineT = Math.max(g.cineT || 0, C.rel); me.inv = Math.max(me.inv, C.rel + 0.5);
      X.sfx.hum(); X.after(0.4, () => X.sfx.sparkle());
    }
    function stepT9(dt) {
      const J = T9, C = CFG.tide9, a = J.a, t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x;
      if (t < C.rel) { g.cineT = Math.max(0.02, C.rel - t); me.inv = Math.max(me.inv, 0.4); }
      else if (t0 < C.rel) g.cineT = 0;
      // the camera: back as it rises and the sea climbs, in close on the compression, out again with the blast, then home
      const zp = t < 0.9 ? lerp(1, 0.9, sstep(0, 0.9, t)) : t < 1.7 ? lerp(0.9, 0.86, sstep(0.9, 1.7, t)) : t < 2.9 ? lerp(0.86, 0.78, sstep(1.7, 2.9, t)) : t < C.strike ? lerp(0.78, 1.1, sstep(2.9, C.strike, t)) : t < C.rel ? lerp(1.1, 0.9, sstep(C.strike, C.strike + 0.25, t)) : lerp(0.9, 1, sstep(C.rel, C.len, t));
      g.zoomP = zp; g.zoomT = t < C.len - 0.05 ? 0.25 : 0;
      // phase 3: the sea and the monsters drawn up into the air
      if (t > 1.7 && t < C.strike) for (const m of H.living()) { if (m.boss || Math.hypot(m.x - J.x, m.y - J.y) > C.r) continue; let q = J.lifted.get(m); if (!q) { q = { z: m.liftZ || 0, ph: Math.random() * TAU }; J.lifted.set(m, q); }
        q.z = Math.min(1.4, q.z + dt * (t < 2.9 ? 1.1 : -0.5)); m.liftZ = Math.max(0, q.z) + 0.1 * Math.sin(g.t * 2.5 + q.ph); }
      if (t > 1.7 && t < 2.9 && Math.random() < dt * 6) X.shake(2, 0.1);
      if (t > 2.9 && t < 3.7 && Math.random() < dt * 10) X.shake(2 + (t - 2.9) * 5, 0.08);
      if (cross(1.7)) X.sfx.whoosh(); if (cross(2.2)) X.sfx.splash && X.sfx.splash();
      if (cross(C.strike)) {
        J.done = true; const p = pw(a); let n = 0;
        for (const m of H.living()) { const d = Math.hypot(m.x - J.x, m.y - J.y); if (d > C.r + m.r || Math.hypot(m.x - me.x, m.y - me.y) > 16) continue; const core = d < C.core + m.r;
          H.hit(m, p * (C.k + (core ? C.kc : 0)), { el: n % 2 ? 'shadow' : 'bubble', kb: core ? 7 : 5, noCrit: true }); m.lunarT = g.t + (m.boss ? C.weakBoss : C.weak); n++; X.sparks(m.x, m.y, n % 2 ? COL.ice : COL.white, 8, 7); }
        for (const [m, q] of J.lifted) { if (m.liftZ != null) delete m.liftZ; m.hitSq = 1; } J.lifted.clear();
        const max = ST().hp * C.shield; sh = { pool: max, max, t: 0, life: C.shieldT, src: 'tide', a: null, took: 0, hit: null }; ensureWard();
        X.flash(0.35, '#E8F0FF'); X.shake(24, 0.8); X.sfx.crash(); X.after(0.14, () => X.sfx.fanfare()); X.light(J.x, J.y, 10, 1.0); g.hitStop = Math.max(g.hitStop || 0, 0.08);   // (v420 AP: a softer flash: the blast's own light carries it)
        X.after(0.55, () => X.text(me.x, me.y + 0.9, 'LUNAR SHIELD', COL.ice, 14, { crit: true, life: 1.2 })); J.n = n;   // (v420 AP: after the white-out, under the pet: clear of the god and the numbers)
      }
      if (t >= C.len) endT9();
    }
    function endT9() { if (!T9) return; const a = T9.a; for (const [m] of T9.lifted) if (m.liftZ != null) delete m.liftZ; T9.lifted.clear(); a.judg = false; a.jA = 1; if (g.cineT > 0 && T9.t < CFG.tide9.rel) g.cineT = 0; g.zoomP = 1; g.zoomT = 0; T9 = null; }
    /* ---- the loop (every frame, from 20g's update) ---- */
    function update(dt, dtReal) {
      const list = S.list.filter(a => a.id === 'cancer');
      for (const a of list) { stOf(a); if (a.st === 'enter') a.abEn = (a.abEn || 0) + (a.landed ? dtReal : 0); if (a.st !== 'fight' && a.ab.act) abort(a); poseOf(a, dtReal); }
      if (T9) stepT9(dtReal);
      if (sh) { sh.t += dt; if (sh.hit) { sh.hit[0] += dt / 0.6; if (sh.hit[0] >= 1) sh.hit = null; } me.chill = 0; me.push = null; if (sh.t >= sh.life) { sh = null; } }
      if (seal && !list.includes(seal.a)) seal = null;
      for (const [m, q] of lifted) { if (m.dead) { lifted.delete(m); continue; } if (q.rel > 0) { q.rel += dtReal / 0.28; const u = cl(q.rel); m.liftZ = q.z * (1 - u * u); if (u >= 1) { if (m.liftZ != null) delete m.liftZ; lifted.delete(m); if (q.land) { m.hitSq = 1; m.chill = Math.max(m.chill || 0, CFG.tide.slow); X.sparks(m.x, m.y, COL.ice, 4, 3); } } }
        else if (!list.includes(q.by) || !(q.by.ab && q.by.ab.act && q.by.ab.act.kind === 'tide')) q.rel = 0.001; }
      for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += dt; if (f.t >= f.life) FX.splice(i, 1); }
      if (!list.length && !T9) { if (wardOff && !sh && !seal) { wardOff(); wardOff = null; } }
      if (me.dead) { for (const a of list) abort(a); seal = null; }
    }
    function stop() { for (const a of S.list) if (a.id === 'cancer') abort(a); for (const [m] of lifted) if (m.liftZ != null) delete m.liftZ; lifted.clear(); if (T9) endT9(); sh = null; seal = null; if (wardOff) { wardOff(); wardOff = null; } FX.length = 0; if (g.zoomP !== 1) { g.zoomP = 1; g.zoomT = 0; } }
    const inK = () => (sh && sh.src === 'carapace' ? 1 - CFG.carapace.reduce : 1);
    const outK = m => (m && m.lunarT > g.t ? (m.boss ? CFG.tide9.weakKBoss : CFG.tide9.weakK) : 1);
    /* ---- the entrance: no shaft of heaven: a lunar seal opens overhead and it comes down inside its sealed shell ---- */
    function descent(a) { stOf(a); a.abEn = 0; FX.push({ kind: 'seal', a, x: a.x, y: a.y, t: 0, life: 2.4 }); X.light(a.x, a.y, 4, 1); }
    function entrance(a) { FX.push({ kind: 'bloom', a, x: a.x, y: a.y, t: 0, life: 1.4 }); X.ring(a.x, a.y, 0.3, 2.6, 0.6, COL.ice, 0.14); for (let i = 0; i < 18 * LQ(); i++) { const an = Math.random() * TAU; X.part({ kind: 'star', x: a.x + Math.cos(an) * 1.4, y: a.y - 1.2 + Math.sin(an), vx: Math.cos(an) * 3, vy: Math.sin(an) * 2 - 0.5, life: 0.9, max: 0.9, size: 3, color: i % 2 ? COL.ice : COL.white, drag: 1.4 }); } X.light(a.x, a.y, 5, 0.6); g.zoomP = 1.08; g.zoomT = 0.9; }

    /* ================= drawing ================= */
    const sx = x => X.sx(x), sy = y => X.sy(y);
    function anchorOf(a) { const Tz = T(), loco = 0.32, hov = Tz * (loco + (a.dropZ || 0)); return [sx(a.x), sy(a.y) - hov]; }
    // the model's screen points (from the frame's draw), or estimates from its place and size
    function pts(a) { const o = a.abOut && a.abOut.r; if (o) return o; const [x, y] = anchorOf(a), s = T() * 3.1; return { heart: [x, y - s * 0.47], heartR: s * 0.08, eye: [x, y - s * 0.66], halo: [x, y - s * 0.86], clawL: { tip: [x - s * 0.3, y - s * 0.1], edge: [] }, clawR: { tip: [x + s * 0.3, y - s * 0.1], edge: [] }, shell: [x, y - s * 0.5], shellR: s * 0.27, unit: s / 11.6, bb: [x - s * 0.5, y - s, x + s * 0.5, y] }; }
    function drawGround(c) {
      if (!FX.length && !T9) return; const Tz = T(), on = gpu();
      if (!on) { for (const f of FX) if (f.kind === 'gfield') { const u = cl(f.t / 0.35) * (1 - cl((f.t - f.life + 0.5) / 0.5)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * u; c.translate(sx(f.x), sy(f.y)); c.scale(1, FSY); c.strokeStyle = COL.sap; c.lineWidth = 3; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(0, 0, f.R * Tz * (1 - ((g.t * 0.35 + i / 3) % 1)), 0, TAU); c.stroke(); } c.restore(); } return; }
      const NM = NMv(), Q = fgOpen(c);
      for (const f of FX) {
        const X0 = sx(f.x != null ? f.x : f.a.x), Y0 = sy(f.y != null ? f.y : f.a.y);
        if (f.kind === 'gfield') { const op = eout(f.t / 0.4), fade = 1 - cl((f.t - (f.life - 0.5)) / 0.5), R = f.R * Tz;
          Q.quad(126, X0, Y0, R, 0, 0, R * FSY, COL.sap, 0.75 * fade, op, 1.2, fade); Q.quad(121, X0, Y0, R * 1.08, 0, 0, R * 1.08 * FSY, COL.sap, 0.45 * fade, op, g.t * 0.4, 0.8);
          Q.glow(X0, Y0, R * 1.2, COL.deep, 0.35 * fade * op, FSY); }
        else if (f.kind === 'reaver') { const R = f.r * Tz * 1.1, u = f.t / f.life, fade = 1 - cl((u - 0.8) / 0.2); Q.glow(X0, Y0, R * 1.3, COL.sap, 0.35 * fade, FSY); Q.quad(121, X0, Y0, R, 0, 0, R * FSY, COL.ice, 0.55 * fade, eout(f.t / 0.3), -g.t * 1.4, 0.8); }
        else if (f.kind === 'shock') { const u = f.t / f.life, R = f.R * Tz * (0.3 + 0.7 * eout(u)); Q.quad(130, X0, Y0, R / 0.94, 0, 0, R / 0.94 * FSY, f.col, 1 - u, 0.9, 0.12, (1 - u) * (f.big ? 1.3 : 0.9)); }
        else if (f.kind === 'requiem') { const u = f.t / f.life, R = f.R * Tz * eout(u * 1.3); Q.quad(130, X0, Y0, R / 0.94 + 2, 0, 0, (R / 0.94 + 2) * FSY, COL.ice, 1 - u, 0.9, 0.2, 1.4 * (1 - u)); Q.glow(X0, Y0, R * 1.1, COL.sap, 0.5 * (1 - u), FSY); }
        else if (f.kind === 'eclipse') { const a = f.a, u = sstep(0, 0.5, f.t) * (1 - sstep(f.seal, f.seal + 0.3, f.t)), R = CFG.eclipse.absorbR * Tz; Q.quad(126, sx(a.x), sy(a.y), R, 0, 0, R * FSY, COL.deep, 0.6 * u, 1, -1.6, u); }
        else if (f.kind === 'seal') { const u = eout(f.t / 0.6) * (1 - cl((f.t - f.life + 0.6) / 0.6)), R = Tz * 2.2; Q.quad(121, X0, Y0, R, 0, 0, R * FSY, COL.sap, 0.8 * u, eout(f.t / 0.8), g.t * 0.6, 0.9); }
        else if (f.kind === 'bloom') { const u = f.t / f.life, R = Tz * 3.2 * eout(u); Q.quad(130, X0, Y0, R / 0.94, 0, 0, R / 0.94 * FSY, COL.ice, 1 - u, 0.9, 0.3, 1 - u); }
      }
      if (T9) groundT9(Q, t9Scene({ x: T9.x, y: T9.y, t: T9.t, seed: T9.seed, from: { x: T9.a.x, y: T9.a.y } }));   // (v420 AP)
      fgClose(c);
    }
    function drawFx(c) {
      const Tz = T(), on = gpu();
      if (T9) drawT9(c);
      if (!FX.length && !sh) return;
      if (!on) { drawFx2d(c); return; }
      const NM = NMv(), Q = fgOpen(c), blades = [];
      for (const f of FX) {
        const a = f.a, u = f.t / f.life;
        if (f.kind === 'reaver') reaverFx(Q, f, blades);
        else if (f.kind === 'gfield') tideFx(Q, f);
        else if (f.kind === 'eclipse') { const p = pts(a), cls = sstep(0, 0.5, f.t) * (1 - sstep(f.seal, f.seal + 0.2, f.t)), R = (p.shellR || Tz) * 1.25;
          Q.quad(124, p.shell[0], p.shell[1], R * 1.9, 0, 0, R * 1.9, '#02030A', 0.22 * cls, 0.55, 0.12, 0); Q.quad(123, p.shell[0], p.shell[1], R * 1.9, 0, 0, R * 1.9, COL.ice, cls, 0.52, 3.1, 1.1);
          // the shots it swallows: a thread of light from each toward it
          if (cls > 0.3) for (const b of X.eshots) { const d = Math.hypot(b.x - a.x, b.y - a.y); if (d < CFG.eclipse.absorbR) Q.beam(sx(b.x), sy(b.y), p.heart[0], p.heart[1], Tz * 0.06, COL.ice, 0.4 * (1 - d / CFG.eclipse.absorbR)); } }
        else if (f.kind === 'requiem') { const p = pts(a), R = f.R * Tz * eout(u * 1.15), al = (1 - u) * Math.min(1.6, f.k);
          Q.quad(125, p.shell[0], p.shell[1] + Tz * 0.4, R, 0, 0, R * 0.8, COL.ice, al, 0.97, 0.025, 1.2); Q.quad(125, p.shell[0], p.shell[1] + Tz * 0.4, R * 0.8, 0, 0, R * 0.64, COL.sap, al * 0.7, 0.97, 0.05, 1);
          Q.glow(p.shell[0], p.shell[1], R * 0.5, COL.white, 0.6 * (1 - cl(u * 3))); if (u < 0.6) for (let i = 0; i < 16 * LQ(); i++) { const an = i / 16 * TAU + f.k, d = R * (0.4 + 0.5 * ((i * 0.37) % 1)); Q.quad(129, p.shell[0] + Math.cos(an) * d, p.shell[1] + Math.sin(an) * d * 0.8, Tz * 0.3, 0, 0, Tz * 0.3, COL.ice, (1 - u / 0.6) * 0.8); } }
        else if (f.kind === 'shock' && f.big) { const R = f.R * Tz * eout(u); Q.quad(125, sx(f.x), sy(f.y) - Tz * 0.5, R, 0, 0, R * 0.8, COL.white, (1 - u) * 1.2, 0.95, 0.03, 1); }
        else if (f.kind === 'frags') { const R1 = mulberry32((f.seed | 0) >>> 0); for (let i = 0; i < f.n; i++) { const an = R1() * TAU, sp = 2 + R1() * 4, d = sp * eout(u) * Tz, h = (R1() * 2 + 1) * Math.sin(u * Math.PI) * Tz, x = sx(f.x) + Math.cos(an) * d, y = sy(f.y) + Math.sin(an) * d * FSY - h, s = Tz * (0.18 + R1() * 0.18), rot = R1() * 6 + u * 9;
          Q.quad(129, x, y, Math.cos(rot) * s, Math.sin(rot) * s, -Math.sin(rot) * s, Math.cos(rot) * s, COL.ice, 1 - u); } }
        else if (f.kind === 'link') { const p = pts(a), hx = p.heart[0], hy = p.heart[1], px = sx(me.x), py = sy(me.y) - Tz * 0.5, k2 = Math.sin(u * Math.PI); Q.quad(128, (hx + px) / 2, (hy + py) / 2, (px - hx) / 2, (py - hy) / 2, -(py - hy) / Math.hypot(px - hx, py - hy) * Tz * 0.12, (px - hx) / Math.hypot(px - hx, py - hy) * Tz * 0.12, COL.ice, k2, 9, 1); }
        else if (f.kind === 'swipe') { const p = pts(a), cw = f.arm ? p.clawL : p.clawR, an0 = f.arm ? Math.PI * 0.95 : Math.PI * 0.05, R = Tz * 2.8, cx = p.heart ? p.heart[0] : sx(a.x), cy = (p.heart ? p.heart[1] : sy(a.y)) + Tz * 0.6;
          const head = (f.arm ? Math.PI - 1 : 1) * 0 + (f.arm ? an0 - u * 2.2 : an0 + u * 2.2); Q.quad(120, cx, cy, R / 0.8, 0, 0, R / 0.8 * 0.6, COL.sap, (1 - u) * 1.1, f.arm ? -head : head, 1.6, 0.16); }
        else if (f.kind === 'bloom') { const p = pts(a), k2 = 1 - u; Q.glow(p.heart[0], p.heart[1], Tz * 2.6 * eout(u), COL.ice, 0.5 * k2); for (let i = 0; i < 10 * LQ(); i++) { const an = i / 10 * TAU + u * 2; Q.quad(128, p.heart[0] + Math.cos(an) * Tz * 1.4 * eout(u), p.heart[1] + Math.sin(an) * Tz * 1.0 * eout(u), Math.cos(an) * Tz * 0.8, Math.sin(an) * Tz * 0.8, -Math.sin(an) * Tz * 0.08, Math.cos(an) * Tz * 0.08, COL.ice, k2, 7, i); } }
        else if (f.kind === 'seal') { const sk = eout(f.t / 0.7) * (1 - cl((f.t - f.life + 0.6) / 0.6)), X0 = sx(f.x), Y0 = sy(f.y) - Tz * 4.6, R = Tz * 2.6; Q.quad(121, X0, Y0, R, 0, 0, R * 0.42, COL.ice, 0.95 * sk, eout(f.t / 1.0), -g.t * 0.8, 1); Q.glow(X0, Y0, R * 1.2, COL.sap, 0.3 * sk, 0.5);
          Q.shafts(X0, Y0, sx(f.a.x), sy(f.a.y), Tz * 0.9, COL.ice, 0.35 * sk, 3); }
      }
      if (sh) shieldFx(Q);
      fgClose(c);
      if (blades.length && glOn()) { c.save(); c.globalCompositeOperation = 'source-over'; ABADDON_GL.drawParts(c, blades); c.restore(); }
    }
    // (without the GPU painter: the game's own sparks and rings, enough to read every power)
    function drawFx2d(c) { const Tz = T();
      if (sh) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.2 * Math.sin(g.t * 5); const R = Tz * 1.2; c.strokeStyle = COL.ice; c.lineWidth = 2; c.beginPath(); c.ellipse(sx(me.x), sy(me.y) - Tz * 0.45, R, R, 0, 0, TAU); c.stroke(); c.restore(); }
      for (const f of FX) if (f.kind === 'reaver' && Math.random() < 0.5) X.part({ kind: 'slash', x: f.x, y: f.y, a: Math.random() * TAU, r: f.r * 1.2, life: 0.18, max: 0.18, color: COL.ice, vx: 0, vy: 0, flip: 0 }); }
    function shieldFx(Q) {
      const Tz = T(), fin = sh.life - sh.t, al = Math.min(1, sh.t / 0.25) * Math.min(1, fin / 0.4) * (0.55 + 0.45 * (sh.pool / sh.max)), R = Tz * (1.1 + 0.08 * Math.sin(g.t * 3)), X0 = sx(me.x), Y0 = sy(me.y) - Tz * 0.45;
      Q.quad(122, X0, Y0, R, 0, 0, R, COL.sap, al, sh.hit ? sh.hit[0] : 0, g.t * 0.5, sh.hit ? sh.hit[1] : 0); Q.glow(X0, Y0 + R * 0.75, R * 1.1, COL.deep, 0.35 * al, FSY);
      // the pool left, as an arc round its foot
      const k2 = sh.pool / sh.max; Q.quad(120, X0, Y0 + R * 0.8, R * 1.15 / 0.8, 0, 0, R * 1.15 / 0.8 * FSY, COL.ice, al * 0.8, Math.PI * 0.5 + k2 * Math.PI, k2 * TAU * 0.999, 0.05);
    }
    /* Crescent Reavers: the two claws' blades orbit the crossing in tilted rings, crossing at each slash; their cutting edges
       trail light that fades back along the arc */
    function reaverFx(Q, f, blades) {
      const Tz = T(), X0 = sx(f.x), Y0 = sy(f.y), R = f.r * Tz * 1.35, gap = CFG.reavers.gap, u = f.t / f.life, fade = 1 - cl((u - 0.85) / 0.15), vis = sstep(0, 0.12, f.t) * fade;
      for (let b = 0; b < 2; b++) {
        // each blade sweeps half a turn between slashes, so the two cross over the target every gap seconds
        const ph = (f.t - 0.1) / gap * Math.PI + b * Math.PI + f.seed, tilt = (b ? 0.55 : -0.55) + Math.sin(f.t * 1.3 + b) * 0.2, cy = Y0 - Tz * 0.6;
        const hx = Math.cos(ph) * R, hy = Math.sin(ph) * R * 0.5, rx = hx * Math.cos(tilt) - hy * Math.sin(tilt), ry = hx * Math.sin(tilt) + hy * Math.cos(tilt);
        Q.quad(120, X0, cy, R / 0.8 * Math.cos(tilt), R / 0.8 * Math.sin(tilt), -R / 0.8 * 0.5 * Math.sin(tilt), R / 0.8 * 0.5 * Math.cos(tilt), b ? COL.ice : COL.sap, vis * 1.1, ph, 2.2, 0.2);
        Q.glow(X0 + rx, cy + ry, Tz * 0.9, COL.sap, 0.35 * vis); Q.star(X0 + rx, cy + ry, Tz * 0.5, 0.6 * vis, COL.white);
        blades.push({ x: X0 + rx, y: cy + ry, rot: ph + Math.PI / 2, tilt, s: Tz * 0.62, a: vis, b });
      }
      // the pull: streaks of light drawn in toward the crossing
      for (let i = 0; i < 6 * LQ(); i++) { const an = i / 6 * TAU + f.t * 2, d = R * (1.5 - ((f.t * 2 + i * 0.37) % 1)); Q.beam(X0 + Math.cos(an) * d, Y0 + Math.sin(an) * d * FSY, X0 + Math.cos(an) * d * 0.7, Y0 + Math.sin(an) * d * 0.7 * FSY, Tz * 0.05, COL.ice, 0.4 * vis); }
    }
    /* Gravitational Tide: water spheres, stones and threads of light spiral up round the field's middle */
    function tideFx(Q, f) {
      const Tz = T(), X0 = sx(f.x), Y0 = sy(f.y), u = f.t / f.life, on = sstep(0, 0.4, f.t) * (1 - cl((f.t - f.life + 0.5) / 0.5)), R = f.R * Tz, n = Math.round(10 * LQ());
      if (on <= 0.01) return;
      for (let i = 0; i < n; i++) { const ph = i / n * TAU + f.t * (1.2 + (i % 3) * 0.3), rr = R * (0.85 - 0.5 * ((f.t * 0.3 + i * 0.13) % 1)), h = Tz * (0.4 + 1.3 * ((i * 0.618 + f.t * 0.4) % 1)), x = X0 + Math.cos(ph) * rr, y = Y0 + Math.sin(ph) * rr * FSY - h;
        if (i % 3 === 0) Q.wsphere(x, y, Tz * (0.2 + (i % 2) * 0.08), COL.teal, on * 0.9, i + f.seed, 1, 0.7, 1);
        else if (i % 3 === 1) Q.quad(80, x, y, Tz * 0.2, 0, 0, Tz * 0.2, '#5A5E72', on, f.t * 2 + i, i + f.seed, 0);
        else Q.glow(x, y, Tz * 0.25, COL.ice, on * 0.6); }
      // the helix: threads of light winding up the field toward the Heart
      for (let s = 0; s < 3; s++) { let px = null, py = null; for (let j = 0; j <= 10; j++) { const v = j / 10, an = s / 3 * TAU + v * 5 - f.t * 3, rr = R * 0.75 * (1 - v * 0.75), x = X0 + Math.cos(an) * rr, y = Y0 + Math.sin(an) * rr * FSY - v * Tz * 2.6; if (px != null) Q.beam(px, py, x, y, Tz * 0.05, COL.ice, on * 0.5 * (1 - v * 0.5)); px = x; py = y; } }
      Q.glow(X0, Y0 - Tz * 1.0, R * 0.5, COL.sap, on * 0.25);
    }

    /* ---- The Ninth Tide's pictures (v420 AP: rebuilt as one smooth sequence, and pure: drawTide9 draws it for the Anima and for
       the boss alike; nothing here touches the game) ----
       The god glides out of the Anima's place and rises; a pale moon hangs over it and a black disc slides across it into a full
       eclipse (its corona blooming, a diamond ring at the last bright limb) while its own Heart goes dark; the Heart then leaves
       its chest and rises into the eclipse, kindling it into the Artificial Moon in a sky seal; the sea climbs round it in three
       helixes of real water (FGFX water streams, split behind / in front of the god so they wind round it) under a canopy of water
       circling overhead; the helixes and canopy are crushed into the Moon as the rings converge; a beat of silence; the blast
       (shock shells, moonlight rays, shards, spray, a floor wave racing out); the sea falls as glittering droplets and the god
       glides home. Every layer eases in and out: nothing pops. o (all optional but x, y, t): x, y the god's floor point (tiles),
       t (s since it began), strike / rel / len its timings (default CFG.tide9: the picture is remapped onto them), r the sea's
       radius (tiles), seed, alpha, at (the body's own clock, for its living motion), size (the god's height in tiles, default
       the awakened Anima's 3.66), hover (tiles), from ({ x, y } where the summoned Anima stands: it glides out from there and home
       again), fromP (the Anima's pose, blended into the god's at the start and the end). */
    const T9SIZE = 3.1 * 1.18;
    function t9Scene(o) {
      const C = CFG.tide9, sk = o.strike || C.strike, rl = o.rel || C.rel, ln = o.len || C.len, t0 = Math.max(0, o.t || 0);
      const t = t0 < sk ? t0 * C.strike / sk : t0 < rl ? C.strike + (t0 - sk) / Math.max(0.01, rl - sk) * (C.rel - C.strike) : C.rel + (t0 - rl) / Math.max(0.01, ln - rl) * (C.len - C.rel);
      const Tz = T(), size = o.size || T9SIZE, K = Tz * size / 11.6, rise = eout(t / 0.9) * (1 - sstep(C.rel, C.len, t)), hov = o.hover == null ? 0.32 : o.hover, seed = o.seed || 0;
      const gl0 = o.from ? eout(t / 0.75) * (1 - sstep(C.rel + 0.1, C.len - 0.05, t)) : 1, wx = o.from ? lerp(o.from.x, o.x, gl0) : o.x, wy = o.from ? lerp(o.from.y, o.y, gl0) : o.y;
      const X0 = sx(o.x), Y0 = sy(o.y), up = Tz * (hov + 1.1 * rise);
      const p2 = sstep(0.9, 1.6, t), p3 = sstep(1.7, 2.6, t), p4 = sstep(2.9, C.strike - 0.15, t), blast = t >= C.strike ? 1 - sstep(C.strike, C.rel + 0.2, t) : 0, rec = sstep(C.rel, C.len, t);
      const bT = Math.max(0.05, o.blastT == null ? 0.35 : o.blastT) * (C.rel - C.strike) / Math.max(0.01, rl - sk);   // (v420 AP: the blast's white peak, s on the canonical timeline)
      const sil = sstep(3.55, 3.75, t) * (t < C.strike ? 1 : 0), shk = blast > 0.3 ? Math.sin(t * 61 + seed) * Math.sin(t * 37 + seed * 1.7) * Tz * 0.05 * blast : 0;
      const gx = sx(wx) + shk, gy = sy(wy) - up, hOut = sstep(0, 1, cl(p2 - rec)), hy = gy - K * lerp(4.95, 10.45, hOut), ey = gy - K * 10.45;
      const VR = Math.min((o.r || C.r) * Tz, Tz * 6.2), R = (o.r || C.r) * Tz, HR = Math.min(VR * 0.55, Tz * 2.9);
      return { o, t, C, Tz, K, rise, X0, Y0, gx, gy, hy, ey, p2, p3, p4, blast, rec, sil, VR, R, HR, seed, al: o.alpha == null ? 1 : o.alpha, gk: o.glowK == null ? 1 : Math.max(0, o.glowK), bT, bp: t >= C.strike ? 1 - sstep(C.strike, C.strike + bT, t) : 0 };
    }
    // the god's pose through it (its living motion turned down while it holds its great shapes)
    function t9Pose(S) {
      const { t, C, p2, p3, p4, blast, rec } = S, o = S.o, at = o.at != null ? o.at : t * 1.2 + 3;
      const P = Object.assign(typeof ABADDON_GL !== 'undefined' ? ABADDON_GL.idlePose(3, at) : { arm: [{}, {}] }, { open: 1, spread: lerp(sstep(0, 0.9, t), 0.2, rec) * (1 - p4 * 0.35) + blast * 0.4, align: (p2 * 0.9 + p4 * 0.1) * (1 - rec), ringK: 1 + p2 * 3 + p4 * 6 - rec * 9 - S.sil * 3, heart: 1.2 + p2 * 1.5 + p4 * 1.6 + S.bp * 1.2 - blast * 0.6, dark: (1 - sstep(0.75, 1.25, t)) * sstep(0, 0.35, t) * 0.85, heartOut: (p2 - rec) * 1, heartGrow: p2 * 0.9 - p4 * 0.3 - blast * 0.4 - rec * 0.2, ringGlow: p2 + p4, glow: 0.3 + p4 * 0.4 + S.bp * 0.5,
        heartPos: [0, 2.2, 12.2], alignAt: [0, 2.2, 12.2], eye: 1 + p4 + blast * 2, tenUp: p3 * 0.5 - blast * 0.3, tenK: p3 * (1 - S.sil), lift: 0, yaw: 0, k: 3, t: at, live: 0.75 - 0.45 * Math.max(p4, blast) + 0.25 * rec, pitch: -0.06 * p2 + 0.05 * p4 - 0.08 * blast + 0.04 * Math.sin(t * 1.3) * (1 - p4),
        arm: [0, 1].map(i => ({ swing: 0.35 * p2 - 0.3 * p4 + 0.5 * blast + 0.06 * Math.sin(t * 1.7 + i) * p3, raise: 0.35 * p2 + 0.15 * p3 - 0.25 * p4 + 0.3 * blast, ext: 0.6 + 0.4 * p2 - 0.3 * p4 + 0.4 * blast, claw: -0.35 * p2 + 0.55 * p4 - 0.6 * blast, edge: p4 * 1.5 + blast, pinch: 0.5 * p3 - 0.6 * p4 + 0.8 * blast, bend: 0.25 * p4 - 0.2 * blast })) });
      if (t > C.rel) P.align = 0;
      // (the Anima's own pose blended in at the start and the end: no snap from it to the god and back)
      const fp = o.fromP, w = fp ? (1 - sstep(0, 0.55, t)) + sstep(C.len - 0.5, C.len, t) : 0;
      if (w > 0.001) { for (const q of ['open', 'spread', 'align', 'ringK', 'heart', 'dark', 'heartOut', 'ringGlow', 'glow', 'eye', 'tenUp', 'tenK', 'pitch', 'live', 'yaw', 'bank']) if (typeof fp[q] === 'number') P[q] = lerp(P[q] || 0, fp[q], cl(w));
        if (fp.arm) for (let i = 0; i < 2; i++) for (const q of ['swing', 'raise', 'ext', 'claw', 'edge', 'pinch', 'bend']) if (fp.arm[i] && typeof fp.arm[i][q] === 'number') P.arm[i][q] = lerp(P.arm[i][q] || 0, fp.arm[i][q], cl(w)); }
      return P;
    }
    // the sea's helixes and canopy: water streams (solid water + its light), the half behind the god (side -1) or in front (+1)
    function t9Water(Q, S, side) {
      const { t, Tz, X0, Y0, gx, hy, p3, p4, sil, HR, VR, C } = S; if (p3 <= 0.01 || t > C.strike) return;
      const fade = (1 - sstep(3.45, 3.8, t)) * (1 - sil), lq = lowFx(), n = lq ? 2 : 3, segs = lq ? 12 : 22, climb = p3 * 1.08;
      if (fade > 0.01) for (let s = 0; s < n; s++) { const a0 = s / n * TAU + t * (1.5 + p4 * 3.5) + S.seed, rr0 = HR * (1 - 0.85 * p4);
        let prev = null;
        for (let j = 0; j <= segs; j++) { const v = j / segs * Math.min(1, climb), an = a0 + v * 1.25 * TAU, rr = rr0 * (1 - 0.6 * v), cx = lerp(X0, gx, v), cy = lerp(Y0, hy, v), x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr * 0.4, dz = Math.sin(an);
          if (prev && (dz + prev.dz) * side >= 0) { const top = 1 - sstep(Math.min(1, climb) - 0.12, Math.min(1, climb), v), fz = 0.55 + 0.45 * Math.abs((dz + prev.dz) / 2), a = 0.62 * fade * top * fz * sstep(0, 0.06, v), w = Tz * (0.3 - 0.12 * v) * (1 - 0.45 * p4), ex = (x - prev.x) * 0.3, ey = (y - prev.y) * 0.3;
            if (a > 0.01) { Q.wstream(prev.x - ex, prev.y - ey, x + ex, y + ey, w, COL.teal, a, s * 7 + j, 2.6, 0.75, 0.45); Q.beam(prev.x - ex, prev.y - ey, x + ex, y + ey, w * 0.2, COL.ice, a * 0.18 * (side > 0 ? 1 : 0.5)); } }
          prev = { x, y, dz }; } }
      // the canopy: the ocean turned over, circling overhead and drawn in to the Moon
      const ca = sstep(2.0, 2.6, t) * fade; if (ca > 0.01) { const CR = Math.min(VR * 0.72, Tz * 3.6) * (1 - 0.8 * p4), cy = hy - Tz * 0.25 + Tz * 0.6 * (1 - p4), m = lq ? 14 : 24, rot = t * 1.2;
        if (side < 0) Q.glow(gx, cy, CR * 1.15, COL.teal, 0.22 * ca, 0.32);
        for (let j = 0; j < m; j++) { const a1 = j / m * TAU + rot, a2 = (j + 1) / m * TAU + rot, dz = Math.sin((a1 + a2) / 2); if (dz * side < 0) continue; const x1 = gx + Math.cos(a1) * CR, y1 = cy + Math.sin(a1) * CR * 0.3, x2 = gx + Math.cos(a2) * CR, y2 = cy + Math.sin(a2) * CR * 0.3, ex = (x2 - x1) * 0.3, ey = (y2 - y1) * 0.3, a = 0.75 * ca * (0.6 + 0.4 * Math.abs(dz));
          Q.wstream(x1 - ex, y1 - ey, x2 + ex, y2 + ey, Tz * 0.36 * (1 - 0.4 * p4), COL.teal, a * 0.8, j + 40, 3, 0.8, 0.45); Q.beam(x1 - ex, y1 - ey, x2 + ex, y2 + ey, Tz * 0.07, COL.ice, a * (side > 0 ? 0.2 : 0.1)); } }
    }
    // (the additive light through glowK: glows, stars, beams, spray and the light kinds; water and the dark disc pass unscaled)
    function lightK(Q, k) { if (k === 1) return Q; const L = Object.create(Q);
      L.glow = (x, y, r, col, a, sy) => Q.glow(x, y, r, col, a * k, sy); L.star = (x, y, s, a, col) => Q.star(x, y, s, a * k, col); L.beam = (x0, y0, x1, y1, w, col, a) => Q.beam(x0, y0, x1, y1, w, col, a * k);
      L.rbeam = (x0, y0, x1, y1, w, col, a, a0, a1) => Q.rbeam(x0, y0, x1, y1, w, col, a * k, a0, a1); L.spray = (x, y, r, col, a, seed, sp, sy) => Q.spray(x, y, r, col, a * k, seed, sp, sy);
      L.quad = (kind, x, y, ux, uy, vx, vy, col, al, q0, q1, q2) => Q.quad(kind, x, y, ux, uy, vx, vy, col, kind === 124 || kind === 80 ? al : al * k, q0, q1, q2); L.wsphere = Q.wsphere.bind(Q); L.wstream = Q.wstream.bind(Q); return L; }
    function groundT9(Q0, S) { const Q = lightK(Q0, S.gk);
      const { t, C, X0, Y0, Tz, rise, VR, R, rec } = S, al = S.al;
      // the seal under it, the gravity field as the sea is drawn up, the waves racing out at the release, a last mist
      Q.quad(121, X0, Y0, Tz * 3.4, 0, 0, Tz * 3.4 * FSY, COL.sap, 0.8 * rise * al, eout(t / 1.2), t * 0.5, 1);
      if (t > 1.6 && t < C.strike + 0.4) { const k2 = sstep(1.6, 2.3, t) * (1 - sstep(C.strike - 0.1, C.strike + 0.35, t)); Q.quad(126, X0, Y0, VR * 0.95, 0, 0, VR * 0.95 * FSY, COL.sap, 0.7 * k2 * al, sstep(1.6, 2.4, t), -1.5, 1); }
      if (t >= C.strike) { const u = (t - C.strike) / 1.1, RW = Math.min(R, Tz * 9); if (u < 1) { for (let i = 0; i < 2; i++) { const v = cl(u - i * 0.12), rr = RW * eout(v); Q.quad(130, X0, Y0, rr / 0.94 + 4, 0, 0, (rr / 0.94 + 4) * FSY, i ? COL.ice : COL.white, (1 - v) * al, 0.9, 0.16, 1.2 - i * 0.35); } Q.glow(X0, Y0, RW * eout(u) * 0.7, COL.sap, 0.35 * (1 - u) * al, FSY); } }
      if (t > C.rel - 0.3) { const u = cl((t - C.rel + 0.3) / (C.len - C.rel + 0.3)), k2 = Math.sin(u * Math.PI); for (let i = 0; i < 5; i++) { const an = i / 5 * TAU + 0.4, d = VR * 0.45 * (0.6 + 0.4 * ((i * 0.618) % 1)); Q.glow(X0 + Math.cos(an) * d, Y0 + Math.sin(an) * d * FSY, Tz * 2.2, COL.teal, 0.16 * k2 * al, FSY); } }
      void rec;
    }
    // behind the god: the eclipse, the Moon's seal and its filaments, the rising sea, the helixes' far halves
    function skyBack(c, S) {
      const { t, C, Tz, gx, gy, hy, ey, p2, p3, p4, rec, VR, X0, Y0, al } = S, J = S;
      let Q = lightK(fgOpen(c), S.gk);
      Q.glow(gx, gy - S.K * 6, Tz * (3.2 + p2 * 2.4), COL.deep, (0.3 + 0.2 * p2 + 0.25 * p4) * al);
      // 1 the eclipse: a pale moon over it, a black disc sliding across it, the corona blooming; it dissolves as the Heart rises into it
      const mf = sstep(0, 0.35, t) * (1 - sstep(1.25, 1.65, t)), Rm = Tz * 1.45;
      if (mf > 0.004) { const cov = sstep(0.12, 0.6, t), ign = sstep(1.0, 1.6, t);
        Q.quad(132, gx, ey, Rm * 2.6, 0, 0, Rm * 2.6, COL.ice, mf * al, 1 / 2.6, 0.5, 0.85 * (1 - cov * 0.92));
        fgClose(c); Q = lightK(fgOpen(c), S.gk);   // (the black disc must lie over the moon's light: its own batch)
        const off = (1 - cov) * Rm * 1.25, dR = Rm * (1.02 - 0.5 * ign), dx = gx - off * 0.8, dy = ey - off * 0.6;   // (the shadow crossing the moon: it darkens as it covers it, never a black ball out on its own)
        Q.quad(124, dx, dy, dR * 1.5, 0, 0, dR * 1.5, '#02030A', 0.96 * mf * sstep(0.1, 0.85, cov) * al, 1 / 1.5, 0.03, 0);
        Q.quad(123, gx, ey, Rm * 2.3, 0, 0, Rm * 2.3, COL.ice, mf * sstep(0.35, 0.62, t) * (1 + ign * 0.6) * al, 1 / 2.3, 2.2 + S.seed, 1.25);
        const dia = sstep(0.46, 0.56, t) * (1 - sstep(0.58, 0.8, t)); if (dia > 0.01) { Q.star(gx + Rm * 0.62, ey + Rm * 0.75, Tz * 1.3 * dia, dia * al, COL.white); Q.glow(gx + Rm * 0.62, ey + Rm * 0.75, Tz * 0.9, COL.white, 0.6 * dia * al); } }
      // 2 the Artificial Moon: its sky seal drawn on round it, moonlight filaments turning in to it
      if (p2 > 0.01) { const sk = p2 * (1 - rec) * (1 - 0.5 * p4) * al;
        for (let i = 0; i < 2; i++) { const rr = Tz * (2.0 + i * 1.1) * (1 - p4 * 0.55); Q.quad(121, gx, hy, rr, 0, 0, rr, i ? COL.ice : COL.sap, sk * (0.65 - i * 0.3), eout((t - 0.9) / 0.9), (i ? -1 : 1) * t * (0.5 + p4 * 2.5) + i, 1); }
        for (let i = 0; i < 8 * LQ(); i++) { const an = i / 8 * TAU + t * (0.6 + p4 * 3), rr = Tz * (2.4 + 0.7 * Math.sin(i * 2.3)) * (1 - p4 * 0.6); Q.quad(128, gx + Math.cos(an) * rr * 0.55, hy + Math.sin(an) * rr * 0.55, Math.cos(an) * rr * 0.5, Math.sin(an) * rr * 0.5, -Math.sin(an) * Tz * 0.06, Math.cos(an) * Tz * 0.06, COL.ice, sk * 0.6, 10, i); } }
      // 3 the sea drawn up: droplets and stones rising and spiralling in, streams from the floor
      if (p3 > 0.01 && t < C.strike) { const n = Math.round(16 * LQ()), R1 = mulberry32(((J.seed | 0) + 3) >>> 0), kk = (1 - S.sil) * al;
        for (let i = 0; i < n; i++) { const an = R1() * TAU, d0 = VR * (0.3 + 0.65 * R1()), sp = R1(), v = ((t - 1.7) * (0.4 + sp * 0.5) + R1()) % 1, d = d0 * (1 - v * (0.5 + 0.5 * p4)), x = X0 + Math.cos(an + v * 1.5) * d, y = Y0 + Math.sin(an + v * 1.5) * d * FSY - v * Tz * 4.5 * (1 - p4 * 0.5), fv = Math.sin(Math.PI * v), sz = 0.15 + 0.15 * R1();
          if (i % 2) Q.wsphere(x, y, Tz * sz, COL.teal, p3 * (1 - p4 * 0.7) * fv * kk, i, 1, 0.7, 1); else Q.quad(80, x, y, Tz * sz * 0.8, 0, 0, Tz * sz * 0.8, '#4E5266', p3 * (1 - p4) * fv * kk, t * 3 + i, i + 5, 0); }
        for (let i = 0; i < 5 * LQ(); i++) { const x = X0 + (i - 2) * VR * 0.3, k2 = p3 * 0.5 * (1 - p4) * kk; Q.wstream(x, Y0, lerp(x, gx, 0.6), lerp(Y0, hy, 0.45), Tz * 0.3, COL.teal, k2, i, 2, 0.6, 1); } }
      t9Water(Q, S, -1);
      fgClose(c);
    }
    // in front of it: the helixes' near halves, the crushed sea, the silence, the blast, the droplets of the recovery
    function skyFront(c, S, r) {
      const { t, C, Tz, gx, gy, p3, p4, blast, rec, VR, X0, Y0, al, sil } = S, J = S, hx = r && r.heart ? r.heart[0] : gx, hy = r && r.heart ? r.heart[1] : S.hy;
      const Q = lightK(fgOpen(c), S.gk);
      t9Water(Q, S, 1);
      // 4 the compression: the sea's last water a sphere crushed into the Moon, rings converging, the Moon blinding; then a held breath
      if (p4 > 0.01 && t < C.strike + 0.05) { const k2 = p4 * (1 - sstep(3.62, 3.9, t)) * al;
        Q.wsphere(hx, hy, Tz * lerp(1.9, 0.75, p4), COL.teal, 0.5 * k2, 3 + J.seed, 2, 0.6, 0.5);
        for (let i = 0; i < 4; i++) { const v = ((t - 2.9) * 1.6 + i / 4) % 1, rr = Tz * 4 * (1 - v); Q.quad(125, hx, hy, rr, 0, 0, rr, COL.ice, p4 * Math.sin(v * Math.PI) * 0.8 * (1 - sil) * al, 0.96, 0.02, 1); }
        for (let sI = 0; sI < (lowFx() ? 3 : 6); sI++) { let px = null, py = null; const R0 = VR * 0.55 * (1 - p4 * 0.8);
          for (let j = 0; j <= 12; j++) { const v = j / 12, an = sI / 6 * TAU + v * 4.5 + t * 5, rr = R0 * (1 - v), x = hx + Math.cos(an) * rr, y = hy + (Y0 - hy) * (1 - v) * 0.5 + Math.sin(an) * rr * 0.42;
            if (px != null) { const ex = (x - px) * 0.3, ey = (y - py) * 0.3; Q.beam(px - ex, py - ey, x + ex, y + ey, Tz * 0.1, COL.ice, 0.55 * k2 * (0.4 + v)); } px = x; py = y; } }
        Q.glow(hx, hy, Tz * (1 + 1.2 * p4), COL.white, (0.1 + 0.16 * p4) * al); }
      if (sil > 0.01 && t < C.strike) { const k2 = sil * al; Q.star(hx, hy, Tz * (0.7 + 1.3 * sstep(3.7, C.strike, t)), 0.75 * k2, COL.white); Q.glow(hx, hy, Tz * (1.2 + 1.8 * sstep(3.75, C.strike, t)), COL.white, (0.14 + 0.22 * sstep(3.75, C.strike, t)) * k2); }
      // 5 the blast
      if (t >= C.strike - 0.02 && t < C.rel + 0.5) { const u = cl((t - C.strike) / 0.8), RB = VR * 1.25;
        for (let i = 0; i < 2; i++) { const v = cl(u * 1.15 - i * 0.16), rr = RB * eout(v); if (rr > 2) Q.quad(125, hx, lerp(hy, Y0 - Tz, 0.35), rr, 0, 0, rr * 0.78, i ? COL.ice : COL.white, (1 - v) * (1 - v) * (0.45 + 0.5 * S.bp) * al, 0.97, 0.025 + i * 0.012, 1); }
        for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + 0.2 + J.seed, L2 = RB * (0.35 + 0.75 * eout(u)); Q.rbeam(hx, hy, hx + Math.cos(an) * L2, hy + Math.sin(an) * L2 * 0.7, Tz * (0.35 - 0.2 * u), COL.ice, (1 - u) * 0.42 * al, 1, 0); }
        for (let i = 0; i < 12 * LQ(); i++) { const an = i / 12 * TAU, d = VR * 0.8 * eout(u); Q.spray(X0 + Math.cos(an) * d, Y0 + Math.sin(an) * d * FSY - Tz * 0.4, Tz * 0.9, '#DDF4FF', (1 - u) * 0.7 * al, i, 1, 0.7); }
        const R1 = mulberry32(((J.seed | 0) + 9) >>> 0); for (let i = 0; i < 20 * LQ(); i++) { const an = R1() * TAU, d = (0.3 + R1()) * VR * 0.7 * eout(u), x = hx + Math.cos(an) * d, y = hy + (Y0 - hy) * eout(u) * 0.55 + Math.sin(an) * d * 0.5, s = Tz * (0.25 + R1() * 0.3), rot = R1() * 6 + u * 12; Q.quad(129, x, y, Math.cos(rot) * s, Math.sin(rot) * s, -Math.sin(rot) * s, Math.cos(rot) * s, COL.ice, (1 - u) * al); }
        const fl = t < C.strike ? sstep(C.strike - 0.02, C.strike, t) : S.bp; Q.glow(hx, hy, Tz * 5, COL.white, 0.35 * fl * al); Q.glow(hx, hy, Tz * 2.6, COL.white, 0.4 * fl * al); }   // (a brief white peak (blastT), then the scene reads again)
      // 6 the sea falls as glittering droplets
      if (t > C.rel - 0.2) { const u = cl((t - C.rel + 0.2) / (C.len - C.rel + 0.2)), R1 = mulberry32(((J.seed | 0) + 17) >>> 0); for (let i = 0; i < 36 * LQ(); i++) { const x = X0 + (R1() - 0.5) * VR * 1.8, y0 = Y0 - Tz * (0.5 + R1() * 4.5), y = y0 + u * u * Tz * 2.2 * (0.6 + R1()), tw = 0.55 + 0.45 * Math.sin(t * 7 + i * 1.3); Q.star(x, y, Tz * (0.1 + R1() * 0.12), Math.sin(Math.PI * cl(u * 1.1)) * tw * al, i % 3 ? COL.ice : COL.white); } }
      fgClose(c); void gy; void p3; void blast; void rec;
    }
    // the whole picture: o as above; returns the risen Heart's screen point ({ x, y, r: the god's screen points })
    function drawTide9(c, o) {
      o = o || {}; const S = t9Scene(o), on = gpu(); if (S.al <= 0.004) return { x: S.gx, y: S.hy, r: null };
      if (on && !o.skyOnly) { const Q = fgOpen(c); groundT9(Q, S); fgClose(c); }
      if (o.groundOnly) return { x: S.gx, y: S.hy, r: null };
      const P = t9Pose(S);
      c.save(); c.globalCompositeOperation = 'source-over';   // (20b calls drawFx under 'lighter': the god and the water are solid things, laid over)
      if (on) skyBack(c, S);
      let r = null;
      if (glOn()) { r = ABADDON_GL.draw(c, { X: S.gx, Y: S.gy, K: S.K, P, k: 3, alpha: S.al }); if (r && on) bodyLight(c, r, P, S.al * S.gk, P.t); }
      else if (typeof AnimaArt !== 'undefined') { const inst = { abP: P }; AnimaArt.draw(c, 'cancer', 3, S.gx, S.gy, S.Tz * T9SIZE, P.t, { inst, alpha: S.al, aura: false }); }
      if (on) skyFront(c, S, r);
      c.restore();
      return { x: r ? r.heart[0] : S.gx, y: r ? r.heart[1] : S.hy, r };
    }
    function drawT9(c) {
      const J = T9, a = J.a, res = drawTide9(c, { x: J.x, y: J.y, t: J.t, seed: J.seed, at: (a.at || 0), from: { x: a.x, y: a.y }, fromP: a.abP, skyOnly: true });
      a.abOut = { r: res.r };
    }
    /* the light over the body (drawn right after it): the Lunar Heart's light (v420 AP: FGFX 132, a white-hot core, a luminous limb,
       water-light turning inside, a soft feathered bloom, faint rays; a gentle pulse; brighter as it charges a power or the Tide),
       the eye, the claws' cutting edges, the halo, the seams. r: the model's screen points, P its pose, al its alpha, at its clock */
    function bodyLight(c, r, P, al, at) {
      const Q = fgOpen(c), u = r.unit, hb = Math.min(3, P.heart || 0.8), dk = cl(P.dark || 0), hR = Math.min(r.heartR, u * 1.7 * (1 + Math.max(0, P.heartGrow || 0))), ch = cl((hb - 0.95) / 1.6), gl = cl(P.glow || 0);
      const pulse = 0.5 + 0.5 * Math.sin((at || 0) * (2.2 + ch * 2.5)), hx = r.heart[0], hy = r.heart[1], Rq = hR * (3.4 + 1.4 * ch);
      Q.glow(hx, hy, hR * (4.2 + 2 * ch), dk > 0.5 ? COL.deep : COL.sap, (0.16 + 0.14 * ch + 0.05 * pulse) * al * (1 - dk * 0.6));
      Q.quad(132, hx, hy, Rq, 0, 0, Rq, COL.sap, al * (1 - dk * 0.85), hR / Rq * 0.92, pulse, Math.min(1.12, 0.72 + 0.3 * ch + 0.12 * gl));
      if (dk > 0.05) Q.quad(123, hx, hy, r.heartR * 1.9, 0, 0, r.heartR * 1.9, COL.ice, al * dk, 0.52, at || 0, 1.2);
      Q.glow(r.eye[0], r.eye[1], u * 0.9, COL.ice, 0.4 * al * (P.eye || 1)); Q.star(r.eye[0], r.eye[1] - u * 0.1, u * (0.4 + 0.25 * (P.eye || 1)), 0.5 * al, COL.white);
      for (const cw of [r.clawL, r.clawR]) { if (!cw || !cw.edge) continue; const ed = 0.12 + 0.55 * (Math.max((P.arm && P.arm[0] && P.arm[0].edge) || 0, (P.arm && P.arm[1] && P.arm[1].edge) || 0));
        for (let i = 0; i < cw.edge.length - 1; i += 1) { const p = cw.edge[i], q = cw.edge[i + 1], ex = (q[0] - p[0]) * 0.25, ey = (q[1] - p[1]) * 0.25; Q.beam(p[0] - ex, p[1] - ey, q[0] + ex, q[1] + ey, u * 0.45, COL.sap, ed * al * 0.45); } }
      if ((P.ringGlow || 0) > 0.05 || gl > 0.2) Q.glow(r.halo[0], r.halo[1], u * 3.6, COL.sap, 0.22 * al * Math.max(P.ringGlow || 0, gl));
      if ((P.seam || 0) > 0.05 && r.shell) Q.glow(r.shell[0], r.shell[1], r.shellR * 1.25, COL.sap, 0.25 * al * P.seam);
      fgClose(c);
    }
    function drawBodyFx(c, a) { if (!gpu() || !a.abOut || !a.abOut.r) return; bodyLight(c, a.abOut.r, a.abP || {}, a.alpha == null ? 1 : a.alpha, a.at || 0); }
    /* screen-space: the room dims for the eclipse; Eclipse Requiem's seal hushes the light */
    function drawCine(c, W, Hh) {
      let dim = 0, cx = W / 2, cy = Hh * 0.45, r0 = Math.min(W, Hh) * 0.15; if (T9) { const t = T9.t, C = CFG.tide9; dim = 0.55 * sstep(0, 0.5, t) * (1 - sstep(C.strike, C.strike + 0.15, t)) + 0.3 * sstep(C.strike + 0.15, C.rel, t) * (1 - sstep(C.rel, C.len, t)) + 0.22 * sstep(3.5, 3.75, t) * (1 - sstep(C.strike - 0.02, C.strike, t));
        const S = t9Scene({ x: T9.x, y: T9.y, t, from: { x: T9.a.x, y: T9.a.y } }); cx = S.gx; cy = S.gy - S.K * 6.5; r0 = S.Tz * 3.2; }   // (v420 AP: the dark falls round the god, its own light kept; the held breath before the blast deepens it smoothly)
      for (const f of FX) if (f.kind === 'eclipse') dim = Math.max(dim, 0.28 * sstep(0, 0.5, f.t) * (1 - sstep(f.seal, f.seal + 0.25, f.t)));
      for (const a of S.list) if (a.id === 'cancer' && a.st === 'enter') dim = Math.max(dim, 0.3 * (1 - sstep(0.8, 1.6, a.abEn || 0)));
      if (dim > 0.005) { c.save(); c.globalCompositeOperation = 'source-over'; const gr = c.createRadialGradient(cx, cy, r0, cx, cy, Math.max(W, Hh) * 0.75); gr.addColorStop(0, `rgba(3,5,18,${dim * (T9 ? 0.12 : 0.6)})`); gr.addColorStop(0.35, `rgba(2,4,14,${dim * 0.75})`); gr.addColorStop(1, `rgba(1,2,10,${Math.min(0.92, dim * 1.25)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
    }
    // (a power on demand, aimed as the mind would aim it: for showcases and tests)
    function cast(a, kind) { stOf(a); if (a.ab.act) endAct(a); const c = crowd(me.x, me.y, 9, 2.5) || { x: a.x + 3, y: a.y + 1 }, m = H.near(a.x, a.y, 6)[0];
      if (kind === 'swipe' && !m) return false; start(a, kind, kind === 'swipe' ? { m } : kind === 'tide' || kind === 'reavers' ? { x: c.x, y: c.y } : null); return true; }
    return { tick, fin, cast, choose /* v435 AN */, update, stop, inK, outK, descent, entrance, drawGround, drawFx, drawBodyFx, drawCine, drawTide9 /* v420 AP */, bodyLight /* v420 AP */, CFG, get shield() { return sh; }, get seal() { return seal; }, get t9() { return T9; }, get fx() { return FX; }, get lifted() { return lifted; } };
  }
  return { create, CFG, poseFor /* v420 AP */, easePose /* v420 AP */ };
})();
if (typeof self !== 'undefined') self.ABADDON_MOVES = ABADDON_MOVES;
