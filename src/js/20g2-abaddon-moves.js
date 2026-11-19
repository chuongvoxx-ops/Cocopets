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
   power each release the lifted monsters, the ward, the camera and every effect. */
const ABADDON_MOVES = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL), FSY = 0.55;   // (the floor's squash for discs laid on it)
  /* ---- the numbers (power multipliers are times the Anima's power P = the pet's attack x ANIMA_POWER[form]; [a, b, c] by form) ---- */
  const CFG = {
    carapace: { pool: [0.3, 0.42, 0.55],   // the shield's pool, a share of the pet's max health
      dur: [4.5, 5.0, 5.5],                 // how long it holds (s)
      reduce: 0.35,                         // what it takes off every blow while it holds (before the pool absorbs the rest)
      cd: 9, rehp: 0.6, act: 1.7 },         // its cooldown; recast only when the pet is under this share of health; its fold (s)
    reavers: { slashes: [2, 4, 6], dmg: 0.95, r: [1.6, 1.8, 2.0], pull: 0.55, gap: 0.17, fin: 2.4, finR: 2.8, cd: 3.2, reach: 9 },
    tide: { dur: [2.2, 2.6, 3.0], r: [3.0, 3.5, 4.0], tick: 0.3, dmg: 0.3, pull: 1.6, lift: 0.75, cd: 6.5, slow: 1.6 },
    eclipse: { seal: [1.3, 1.5, 1.7], base: 2.2, k: 6, cap: [3, 4, 5], r: [3.6, 4.2, 4.8], minLife: 5.5, absorbR: 4.5, store: 0.25 },
    swipe: { dmg: 0.8, r: 3.4, cd: 1.2 },
    tide9: { len: 5.6, strike: 3.95, rel: 4.7, r: 12, k: 8, kc: 4, core: 4, weak: 8, weakBoss: 5, weakK: 1.25, weakKBoss: 1.12, shield: 0.5, shieldT: 6 },
  };
  const COL = { sap: '#6FA2FF', ice: '#BFD8FF', white: '#EAF2FF', deep: '#2448B8', teal: '#7FE6FF', gold: '#E8C27A', night: '#03050E' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);

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
    function stOf(a) { return a.ab || (a.ab = { act: null, cd: { rev: 0.9, tide: 2.6, car: 0, sw: 0.6 }, store: 0, charge: 0, first: false, eclDone: false, pz: null, vx: 0, vy: 0, ax: 0, ay: 0, px: a.x, py: a.y }); }
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
    function endAct(a) { const ab = a.ab, A = ab.act; if (!A) return; const C = ab.cd;
      if (A.kind === 'carapace') C.car = CFG.carapace.cd; else if (A.kind === 'reavers') C.rev = CFG.reavers.cd; else if (A.kind === 'tide') { C.tide = CFG.tide.cd; releaseLift(a, false); } else if (A.kind === 'eclipse') { ab.eclDone = true; if (seal && seal.a === a) seal = null; } else if (A.kind === 'swipe') C.sw = CFG.swipe.cd;
      ab.act = null; }
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
    /* ---- the guardian's mind: one power at a time ---- */
    function tick(a, dt) {
      const ab = stOf(a); for (const q in ab.cd) ab.cd[q] -= dt;
      if (me.dead) { abort(a); return; }
      if (ab.act) { act(a, dt); if (ab.act) guard(a, dt, ab.act.x != null ? ab.act : null); return; }
      guard(a, dt, null);
      const k = kOf(a), foes = H.near(a.x, a.y, CFG.reavers.reach), hp = ST().hp, life = a.life;
      if (!ab.first) { ab.first = true; return start(a, 'carapace'); }
      if (!ab.eclDone && life > CFG.eclipse.seal[k - 1] + 0.8 && foes.some(m => Math.hypot(m.x - a.x, m.y - a.y) < 6) && (life < CFG.eclipse.minLife || ab.store > hp * CFG.eclipse.store)) return start(a, 'eclipse');
      if (ab.cd.tide <= 0 && life > CFG.tide.dur[k - 1] + 0.6 && foes.length) { const c = crowd(me.x, me.y, 8, 2.5); if (c && (c.n >= 2 || ab.cd.rev > 0.5)) return start(a, 'tide', { x: c.x, y: c.y }); }
      if (ab.cd.rev <= 0 && life > 1.6 && foes.length) { const c = crowd(me.x, me.y, CFG.reavers.reach, 2.2); if (c) return start(a, 'reavers', { x: c.x, y: c.y }); }
      if (ab.cd.car <= 0 && !sh && me.hp < hp * CFG.carapace.rehp && life > 2) return start(a, 'carapace');
      if (ab.cd.sw <= 0) { const m = H.near(a.x, a.y, CFG.swipe.r)[0]; if (m) return start(a, 'swipe', { m }); }
    }
    /* ---- the pose: what each power and moment does to the body, eased so nothing snaps ---- */
    function poseOf(a, dt) {
      const ab = stOf(a), k = kOf(a), base = (typeof ABADDON_GL !== 'undefined' ? ABADDON_GL.idlePose(k, a.at || 0) : { arm: [{}, {}] }), A = ab.act, t = A ? A.t : 0;
      const tg = { open: base.open, fold: 0, spread: 0, heart: base.heart + (ab.charge || 0) * 0.6, dark: 0, ringK: 1, align: 0, glow: 0, ringGlow: 0, seam: 0, eye: base.eye, lift: 0, pitch: 0, arms: [Object.assign({}, base.arm[0]), Object.assign({}, base.arm[1])], tenK: 0, tenUp: 0, stagger: 0 };
      if (a.st === 'enter') { const e = a.abEn || 0; tg.open = lerp(0, base.open, sstep(0.15, 1.1, e)); tg.heart = lerp(0.1, 2.2, sstep(0.1, 0.5, e)) - sstep(0.6, 1.3, e) * 1.2; tg.glow = 0.6 * (1 - sstep(0.5, 1.3, e)); tg.seam = 1 - sstep(0.2, 0.8, e); tg.ringK = 3 - sstep(0.4, 1.4, e) * 2; }
      if (A) {
        if (A.kind === 'carapace') { const f = sstep(0, 0.35, t) * (1 - sstep(1.15, 1.6, t)); tg.fold = f; tg.open = lerp(base.open, 0, f); tg.seam = f; tg.heart += f * 0.8; tg.glow = f * 0.3; }
        else if (A.kind === 'reavers') { const ant = sstep(0, 0.35, t) * (1 - sstep(0.4, 0.55, t)), go = sstep(0.4, 0.6, t) * (1 - sstep(A.dur - 0.45, A.dur, t));
          for (const q of tg.arms) { q.swing = -0.55 * ant + 0.55 * go + 0.12 * Math.sin(t * 9) * go; q.raise = 0.35 * ant + 0.25 * go; q.ext = lerp(q.ext, 1, go); q.claw = -0.3 * ant - 0.75 * go; q.edge = go * 1.2; }
          tg.pitch = -0.08 * ant + 0.1 * go; tg.glow = 0.3 * go; tg.ringK = 1 + go; tg.spread = 0.3 * go; }
        else if (A.kind === 'tide') { const on = sstep(0, 0.35, t) * (1 - sstep(A.dur - 0.3, A.dur, t)); tg.heart += on * 1.1; tg.ringK = 1 + on * 3.5; tg.ringGlow = on * 1.2; tg.glow = on * 0.35; tg.spread = on * 0.55; tg.tenUp = on * 0.35; tg.tenK = on;
          for (const q of tg.arms) { q.raise = 0.55 * on; q.claw = -0.5 * on; q.ext = lerp(q.ext, 0.8, on); q.swing = 0.15 * on; } }
        else if (A.kind === 'eclipse') { const cls = sstep(0, 0.5, t) * (1 - sstep(A.seal, A.seal + 0.18, t)), snap = sstep(A.seal, A.seal + 0.22, t) * (1 - sstep(A.seal + 0.5, A.dur, t));
          tg.fold = cls; tg.open = lerp(base.open, 0, cls); tg.dark = cls; tg.seam = cls; tg.heart = lerp(tg.heart, 1.8, cls) + snap * 1.5; tg.spread = snap * 1.0; tg.glow = snap * 0.8 + cls * 0.2; tg.ringK = 1 + snap * 4; tg.eye = base.eye + snap * 1.5;
          for (const q of tg.arms) { q.raise = 0.4 * snap; q.claw = -0.6 * snap; q.ext = lerp(q.ext, 1, snap); } }
        else if (A.kind === 'swipe') { const q = tg.arms[A.arm], ant = sstep(0, 0.18, t) * (1 - sstep(0.18, 0.24, t)), hit = sstep(0.18, 0.3, t) * (1 - sstep(0.36, 0.62, t));
          q.swing = -0.6 * ant + 0.8 * hit; q.raise = 0.3 * ant - 0.1 * hit; q.ext = lerp(q.ext, 1, hit); q.claw = -0.25 * ant + 0.25 * hit; q.edge = hit; tg.pitch = 0.06 * hit; }
      }
      if (a.st === 'leave') { const u = sstep(0, 0.7, a.lv || 0); tg.open = lerp(tg.open, 0, u); tg.fold = u; tg.heart *= 1 - u * 0.7; tg.lift = u * 1.2; }
      if (a.st === 'awaken') { const u = sstep(0, 0.7, a.aw || 0); tg.spread = Math.max(tg.spread, u * 0.6); tg.heart += u; tg.ringK += u * 2; tg.glow = Math.max(tg.glow, u * 0.5); }
      if (ab.stag > 0) { ab.stag = Math.max(0, ab.stag - dt * 3); tg.stagger = Math.sin(ab.stag * Math.PI) * 0.8; tg.pitch -= 0.08 * Math.sin(ab.stag * Math.PI); }
      ab.charge = Math.max(0, (ab.charge || 0) - dt * 0.15);
      // follow (eased); the arms faster than the body
      let pz = ab.pz; const r1 = Math.min(1, dt * 7), r2 = Math.min(1, dt * 14);
      if (!pz) { pz = ab.pz = Object.assign({}, tg, { arms: tg.arms.map(q => Object.assign({}, q)) }); }
      for (const q of ['open', 'fold', 'spread', 'heart', 'dark', 'ringK', 'align', 'glow', 'ringGlow', 'seam', 'eye', 'lift', 'pitch', 'tenK', 'tenUp', 'stagger']) pz[q] += (tg[q] - pz[q]) * (q === 'open' && A && A.kind === 'eclipse' && A.t > A.seal ? Math.min(1, dt * 18) : r1);
      for (let i = 0; i < 2; i++) for (const q of ['swing', 'raise', 'ext', 'claw', 'edge']) { const v = tg.arms[i][q] || 0; pz.arms[i][q] = (pz.arms[i][q] || 0) + (v - (pz.arms[i][q] || 0)) * r2; }
      // the body's motion: banking into its drift, leaning, the tendrils' springs
      const vx = a.vx || 0, vy = a.vy || 0; ab.ax = lerp(ab.ax, (vx - (ab.lvx || 0)) / Math.max(dt, 1e-3), 0.3); ab.ay = lerp(ab.ay, (vy - (ab.lvy || 0)) / Math.max(dt, 1e-3), 0.3); ab.lvx = vx; ab.lvy = vy;
      const foe = A && A.x != null ? A : A && A.m ? A.m : null, yawT = foe ? Math.max(-0.6, Math.min(0.6, -Math.atan2(foe.x - a.x, Math.max(0.4, foe.y - a.y)))) : -(a.face || 1) * 0.1;
      ab.yaw = lerp(ab.yaw || 0, yawT, Math.min(1, dt * 2.5));
      if (typeof ABADDON_GL !== 'undefined') ABADDON_GL.springs(a, k === 3 ? 8 : k === 2 ? 6 : 4, ab.ax, ab.ay, dt);
      a.abP = Object.assign(base, pz, { arm: pz.arms, yaw: ab.yaw, bank: Math.max(-0.22, Math.min(0.22, -vx * 0.05)), pitch: pz.pitch + Math.max(-0.12, Math.min(0.12, vy * 0.03)), k, t: a.at || 0, look: [0, 0] });
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
        X.flash(0.9, '#E8F0FF'); X.shake(28, 0.9); X.sfx.crash(); X.after(0.14, () => X.sfx.fanfare()); X.light(J.x, J.y, 12, 1.2); g.hitStop = Math.max(g.hitStop || 0, 0.08);
        X.text(me.x, me.y - 1.5, 'LUNAR SHIELD', COL.ice, 14, { crit: true, life: 1.2 }); J.n = n;
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
      if (T9) groundT9(Q);
      fgClose(c);
    }
    /* the light over the body (drawn right after it, 20g drawAnima): the Heart's bloom, the eye, the claws' cutting edges, the seams */
    function drawBodyFx(c, a) {
      if (!gpu() || !a.abOut || !a.abOut.r) return; const r = a.abOut.r, P = a.abP || {}, NM = NMv(), Q = fgOpen(c), al = a.alpha == null ? 1 : a.alpha, u = r.unit;
      const hb = Math.min(2.2, P.heart || 0.8), dk = P.dark || 0, hR = Math.min(r.heartR, u * 1.6);   // (the bloom stays round the Heart: it never washes over the body)
      Q.glow(r.heart[0], r.heart[1], hR * (1.9 + hb * 0.45), dk > 0.5 ? COL.deep : COL.sap, Math.min(0.5, 0.22 + 0.1 * hb) * al * (1 - dk * 0.5));
      Q.glow(r.heart[0], r.heart[1], hR * 0.9, COL.white, Math.min(0.35, 0.1 + 0.08 * hb) * al * (1 - dk));
      if (dk > 0.05) Q.quad(123, r.heart[0], r.heart[1], r.heartR * 1.9, 0, 0, r.heartR * 1.9, COL.ice, al * dk, 0.52, a.at || 0, 1.2);
      Q.glow(r.eye[0], r.eye[1], u * 0.9, COL.ice, 0.4 * al * (P.eye || 1)); Q.star(r.eye[0], r.eye[1] - u * 0.1, u * (0.4 + 0.25 * (P.eye || 1)), 0.5 * al, COL.white);
      for (const cw of [r.clawL, r.clawR]) { if (!cw || !cw.edge) continue; const ed = 0.12 + 0.55 * (Math.max((P.arm && P.arm[0] && P.arm[0].edge) || 0, (P.arm && P.arm[1] && P.arm[1].edge) || 0));
        for (let i = 0; i < cw.edge.length - 1; i += 1) { const p = cw.edge[i], q = cw.edge[i + 1]; Q.beam(p[0], p[1], q[0], q[1], u * 0.45, COL.sap, ed * al * 0.55); } }
      if ((P.ringGlow || 0) > 0.05 || (P.glow || 0) > 0.2) Q.glow(r.halo[0], r.halo[1], u * 3.6, COL.sap, 0.22 * al * Math.max(P.ringGlow || 0, P.glow || 0));
      if ((P.seam || 0) > 0.05 && r.shell) Q.glow(r.shell[0], r.shell[1], r.shellR * 1.25, COL.sap, 0.25 * al * P.seam);
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

    /* ---- The Ninth Tide's pictures ---- */
    const T9P = () => { const J = T9, a = J.a, Tz = T(), t = J.t, C = CFG.tide9, rise = eout(t / 0.9) * (1 - sstep(C.rel, C.len, t)), X0 = sx(J.x), Y0 = sy(J.y), up = Tz * (0.4 + 1.1 * rise); return { J, a, Tz, t, C, rise, X0, Y0, up, K: Tz * 3.1 * 1.05 / 11.6 }; };
    function groundT9(Q) {
      const { t, C, X0, Y0, Tz, rise } = T9P(), R = C.r * Tz;
      // the seal under it, the gravity field as the sea is drawn up, the wave racing out at the release
      Q.quad(121, X0, Y0, Tz * 3.4, 0, 0, Tz * 3.4 * FSY, COL.sap, 0.8 * rise, eout(t / 1.2), t * 0.5, 1);
      if (t > 1.6 && t < C.strike) { const k2 = sstep(1.6, 2.2, t); Q.quad(126, X0, Y0, R * 0.9, 0, 0, R * 0.9 * FSY, COL.sap, 0.8 * k2, k2, -1.5, 1); }
      if (t >= C.strike) { const u = (t - C.strike) / 1.1; if (u < 1) { for (let i = 0; i < 3; i++) { const v = cl(u - i * 0.08), rr = R * eout(v); Q.quad(130, X0, Y0, rr / 0.94 + 4, 0, 0, (rr / 0.94 + 4) * FSY, i ? COL.ice : COL.white, (1 - v) * 1.2, 0.9, 0.18, 1.4 - i * 0.3); } Q.glow(X0, Y0, R * eout(u) * 0.8, COL.sap, 0.5 * (1 - u), FSY); } }
      if (t > C.rel) { const u = cl((t - C.rel) / (C.len - C.rel)); Q.quad(131, X0, Y0 - Tz * 0.5, R * 0.8, 0, 0, R * 0.8 * FSY, COL.ice, 1 - u, 0.5, 3, 0.8 * (1 - u)); }
    }
    function drawT9(c) {
      const { J, a, Tz, t, C, rise, X0, Y0, up, K } = T9P(), on = gpu(), NM = on ? NMv() : null;
      // phase 1-2: it rises and unfolds into its charging ring, the moon leaves its chest; 3: the sea climbs; 4: everything crushed in; 5: the blast; 6: home
      const p2 = sstep(0.9, 1.6, t), p3 = sstep(1.7, 2.6, t), p4 = sstep(2.9, C.strike - 0.15, t), blast = t >= C.strike ? 1 - sstep(C.strike, C.rel + 0.2, t) : 0, rec = sstep(C.rel, C.len, t);
      const P = Object.assign(typeof ABADDON_GL !== 'undefined' ? ABADDON_GL.idlePose(3, t * 1.2 + 3) : {}, { open: 1, spread: lerp(sstep(0, 0.9, t), 0.2, rec) * (1 - p4 * 0.25), align: (p2 * 0.9 + p4 * 0.1) * (1 - rec), ringK: 1 + p2 * 3 + p4 * 6 - rec * 9, heart: 1.2 + p2 * 1.5 + p4 * 2 + blast * 1.5, dark: (1 - sstep(0.1, 0.9, t)) * sstep(0, 0.15, t) * 0.8, heartOut: (p2 - rec) * 1, heartGrow: p2 * 0.9 + p4 * 0.6 - blast * 1.2 - rec * 0.3, ringGlow: p2 + p4, glow: 0.3 + p4 * 0.7 + blast,
        heartPos: [0, 2.2, 12.2], alignAt: [0, 2.2, 12.2], eye: 1 + p4 + blast * 2, arm: [0, 1].map(() => ({ swing: 0.35 * p2 - 0.2 * p4, raise: 0.35 * p2 - 0.1 * p4, ext: 0.6 + 0.4 * p2, claw: -0.35 * p2 + 0.5 * p4, edge: p4 * 1.5 + blast })), tenUp: p3 * 0.5, tenK: p3, lift: 0, yaw: 0, k: 3 });
      if (t > C.rel) { P.align = 0; }
      const shake = blast > 0.5 ? (Math.random() - 0.5) * Tz * 0.1 : 0, gx = X0 + shake, gy = Y0 - up;
      // the sea: helixes of water climbing round it, a canopy overhead, crushed into one sphere, gone in the blast (GLM, in its own pass)
      const sea = [];
      if (t > 1.7 && t < C.strike + 0.05 && glOn()) { const R = C.r * Tz, h = Tz * 9, n = lowFx() ? 3 : 6, sq = 1 - p4;
        for (let i = 0; i < n; i++) sea.push({ m: 'helix', X: X0, Y: Y0, ph: i / n * TAU + t * 0.9, r: R * (0.55 + 0.1 * (i % 2)) * (0.2 + 0.8 * sq) , h: h * p3, rise: p3, a: 0.85 * p3 * (1 - sstep(2.6, 2.9, t)), i });   // (the helixes give way to light as the sea is crushed)
        sea.push({ m: 'canopy', X: X0, Y: gy - Tz * 3.4, r: R * 0.85 * (0.15 + 0.85 * sq), a: 0.45 * sstep(2.0, 2.7, t) * (0.2 + 0.8 * sq), sq });
        if (p4 > 0.01) sea.push({ m: 'orb', X: gx, Y: gy - Tz * 2.9, r: Tz * lerp(3.2, 0.9, p4), a: 0.9 * p4 }); }
      if (on) { const Q = fgOpen(c);
        // the dark: the eclipse comes first; the moonlight streaks and the god's own light
        Q.glow(gx, gy - Tz * 1.8, Tz * (4 + p2 * 3), COL.sap, 0.25 + 0.25 * p2 + 0.4 * p4);
        if (t < 1.1) { const ek = sstep(0, 0.3, t) * (1 - sstep(0.8, 1.1, t)); Q.quad(124, gx, gy - Tz * 3.3, Tz * 2.4, 0, 0, Tz * 2.4, '#02030A', ek * 0.9, 0.5, 0.05, 0); Q.quad(123, gx, gy - Tz * 3.3, Tz * 2.4, 0, 0, Tz * 2.4, COL.ice, ek * 1.2, 0.5, 2.2, 1.3); }
        if (p2 > 0.01) { const hy = gy - Tz * 2.9; for (let i = 0; i < 3; i++) { const rr = Tz * (1.6 + i * 0.9) * (1 - p4 * 0.6); Q.quad(121, gx, hy, rr, 0, 0, rr, i % 2 ? COL.ice : COL.sap, p2 * (0.7 - i * 0.15) * (1 - rec), eout((t - 0.9) / 0.8), (i % 2 ? -1 : 1) * t * (0.6 + p4 * 3) + i, 1); }
          for (let i = 0; i < 8 * LQ(); i++) { const an = i / 8 * TAU + t * (1 + p4 * 4), rr = Tz * (2.2 + 0.8 * Math.sin(i * 2.3)) * (1 - p4 * 0.7); Q.quad(128, gx + Math.cos(an) * rr * 0.5, hy + Math.sin(an) * rr * 0.5, Math.cos(an) * rr * 0.5, Math.sin(an) * rr * 0.5, -Math.sin(an) * Tz * 0.06, Math.cos(an) * Tz * 0.06, COL.ice, p2 * 0.7, 10, i); } }
        // phase 3: streams of water and stone drawn up, everything pulled to one centre
        if (p3 > 0.01 && t < C.strike) { const R = C.r * Tz, n = Math.round(16 * LQ()), R1 = mulberry32(((J.seed | 0) + 3) >>> 0);
          for (let i = 0; i < n; i++) { const an = R1() * TAU, d0 = R * (0.3 + 0.7 * R1()), sp = R1(), v = ((t - 1.7) * (0.4 + sp * 0.5) + R1()) % 1, d = d0 * (1 - v * (0.5 + 0.5 * p4)), x = X0 + Math.cos(an + v * 1.5) * d, y = Y0 + Math.sin(an + v * 1.5) * d * FSY - v * Tz * 5 * (1 - p4 * 0.5);
            if (i % 2) Q.wsphere(x, y, Tz * (0.15 + 0.15 * R1()), COL.teal, p3 * (1 - p4 * 0.7), i, 1, 0.7, 1); else Q.quad(80, x, y, Tz * (0.15 + 0.12 * R1()), 0, 0, Tz * (0.15 + 0.12 * R1()), '#4E5266', p3 * (1 - p4), t * 3 + i, i + 5, 0); }
          for (let i = 0; i < 5 * LQ(); i++) { const x = X0 + (i - 2) * R * 0.35; Q.wstream(x, Y0, lerp(x, gx, 0.6), gy - Tz * 2, Tz * 0.35, COL.teal, p3 * 0.55 * (1 - p4), i, 2, 0.6, 1); } }
        // phase 4: the compression: tightening rings, a lens of light, the heart blinding
        if (p4 > 0.01 && t < C.strike + 0.05) { const R = C.r * Tz * 0.6 * (1 - p4 * 0.8), hy0 = gy - Tz * 2.9;   // (v418 AB round 2: the crushed sea as bright streams of water-light spiralling into the moon)
          for (let sI = 0; sI < (lowFx() ? 3 : 6); sI++) { let px = null, py = null; for (let j = 0; j <= 14; j++) { const v = j / 14, an = sI / 6 * TAU + v * 4.5 + t * 5, rr = R * (1 - v), x = gx + Math.cos(an) * rr, y = hy0 + (Y0 - hy0) * (1 - v) * 0.6 + Math.sin(an) * rr * 0.45;
            if (px != null) { Q.wstream(px, py, x, y, Tz * 0.32 * (1 - v * 0.6), COL.teal, 0.55 * p4, sI, 2.5, 0.5, 1); Q.beam(px, py, x, y, Tz * 0.12, COL.ice, 0.6 * p4 * (0.4 + v)); } px = x; py = y; } }
          Q.wsphere(gx, hy0, Tz * lerp(2.6, 0.9, p4), COL.teal, 0.5 * p4, 3, 2, 0.6, 1); }
        if (p4 > 0.01 && t < C.strike + 0.05) { const hy = gy - Tz * 2.9; for (let i = 0; i < 4; i++) { const v = ((t - 2.9) * 1.6 + i / 4) % 1, rr = Tz * 4 * (1 - v); Q.quad(125, gx, hy, rr, 0, 0, rr, COL.ice, p4 * v * 0.9, 0.96, 0.02, 1); }
          Q.glow(gx, hy, Tz * (1 + 2 * p4), COL.white, 0.4 + 0.5 * p4); if (t > C.strike - 0.3) Q.glow(gx, hy, Tz * 5, COL.white, sstep(C.strike - 0.3, C.strike, t) * 0.6); }
        // phase 5: the blast: concentric shock shells, crescent shards, moonlight streaks, spray
        if (t >= C.strike && t < C.rel + 0.4) { const u = cl((t - C.strike) / 0.75), hy = gy - Tz * 2.9, R = C.r * Tz;
          for (let i = 0; i < 4; i++) { const v = cl(u * 1.2 - i * 0.12), rr = R * 0.9 * eout(v); Q.quad(125, X0, Y0 - Tz * 1.5, rr, 0, 0, rr * 0.75, i % 2 ? COL.ice : COL.white, (1 - v) * 1.3, 0.97, 0.02 + i * 0.01, 1); }
          for (let i = 0; i < 12 * LQ(); i++) { const an = i / 12 * TAU, d = R * 0.8 * eout(u); Q.quad(131, X0 + Math.cos(an) * d, Y0 + Math.sin(an) * d * FSY - Tz * 0.5, Tz * 1.6, 0, 0, Tz * 1.0, COL.ice, 1 - u, 1, i, 0.9); Q.spray(X0 + Math.cos(an) * d, Y0 + Math.sin(an) * d * FSY - Tz * 0.4, Tz * 0.9, '#DDF4FF', (1 - u) * 0.8, i, 1, 0.7); }
          const R1 = mulberry32(((J.seed | 0) + 9) >>> 0); for (let i = 0; i < 22 * LQ(); i++) { const an = R1() * TAU, d = (0.3 + R1()) * R * 0.7 * eout(u), x = X0 + Math.cos(an) * d, y = hy + (Y0 - hy) * eout(u) * 0.6 + Math.sin(an) * d * 0.5, s = Tz * (0.25 + R1() * 0.3), rot = R1() * 6 + u * 12; Q.quad(129, x, y, Math.cos(rot) * s, Math.sin(rot) * s, -Math.sin(rot) * s, Math.cos(rot) * s, COL.ice, (1 - u) * 1.1); }
          for (let i = 0; i < 8; i++) { const an = i / 8 * TAU + 0.2, L2 = R * 1.1 * eout(u); Q.beam(X0, hy, X0 + Math.cos(an) * L2, hy + Math.sin(an) * L2 * 0.6, Tz * 0.3, COL.ice, (1 - u) * 0.5); }
          Q.glow(X0, hy, Tz * 8 * (1 - u * 0.5), COL.white, (1 - u) * 0.8); }
        // phase 6: the sea turns to glittering droplets as it evaporates
        if (t > C.rel - 0.2) { const u = cl((t - C.rel + 0.2) / (C.len - C.rel + 0.2)), R1 = mulberry32(((J.seed | 0) + 17) >>> 0); for (let i = 0; i < 40 * LQ(); i++) { const x = X0 + (R1() - 0.5) * C.r * 2 * Tz, y = Y0 + (R1() - 0.5) * C.r * Tz - u * Tz * (1 + R1() * 2), tw = 0.5 + 0.5 * Math.sin(t * 9 + i); Q.star(x, y, Tz * (0.08 + R1() * 0.12), (1 - u) * tw, i % 3 ? COL.ice : COL.white); } }
        fgClose(c); }
      // the sea's meshes behind the god, then the god (larger: it towers over the room)
      c.save(); c.globalCompositeOperation = 'source-over';   // (20b calls drawFx under 'lighter': the sea and the god are solid things, laid over)
      if (sea.length) ABADDON_GL.drawSea(c, sea, t);
      const al = Math.min(1, t / 0.25) * (rec > 0.95 ? 1 - (rec - 0.95) / 0.05 : 1);
      a.abOut = { r: null }; if (glOn()) { const r = ABADDON_GL.draw(c, { X: gx, Y: gy, K, P, k: 3, alpha: al }); a.abOut.r = r; if (r) drawBodyFx(c, Object.assign({}, a, { abP: P, alpha: al })); }
      else AnimaArt.draw(c, 'cancer', 3, gx, gy, Tz * 3.1 * 1.05, t, { inst: a, alpha: al, aura: false });
      c.restore();
      // the light of the release over everything
      if (on && t >= C.strike - 0.05 && t < C.strike + 0.35) { const Q = fgOpen(c), u = cl((t - C.strike + 0.05) / 0.4); Q.glow(gx, gy - Tz * 2.9, Tz * 9, COL.white, (1 - u) * 1.1); fgClose(c); }
    }
    /* screen-space: the room dims for the eclipse; Eclipse Requiem's seal hushes the light */
    function drawCine(c, W, Hh) {
      let dim = 0; if (T9) { const t = T9.t, C = CFG.tide9; dim = 0.55 * sstep(0, 0.5, t) * (1 - sstep(C.strike, C.strike + 0.15, t)) + 0.35 * sstep(C.strike + 0.15, C.rel, t) * (1 - sstep(C.rel, C.len, t)) + (t > 3.7 && t < C.strike ? 0.25 : 0); }
      for (const f of FX) if (f.kind === 'eclipse') dim = Math.max(dim, 0.28 * sstep(0, 0.5, f.t) * (1 - sstep(f.seal, f.seal + 0.25, f.t)));
      for (const a of S.list) if (a.id === 'cancer' && a.st === 'enter') dim = Math.max(dim, 0.3 * (1 - sstep(0.8, 1.6, a.abEn || 0)));
      if (dim > 0.005) { c.save(); c.globalCompositeOperation = 'source-over'; const gr = c.createRadialGradient(W / 2, Hh * 0.45, Math.min(W, Hh) * 0.15, W / 2, Hh * 0.45, Math.max(W, Hh) * 0.75); gr.addColorStop(0, `rgba(3,5,18,${dim * 0.6})`); gr.addColorStop(1, `rgba(1,2,10,${Math.min(0.92, dim * 1.25)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
    }
    // (a power on demand, aimed as the mind would aim it: for showcases and tests)
    function cast(a, kind) { stOf(a); if (a.ab.act) endAct(a); const c = crowd(me.x, me.y, 9, 2.5) || { x: a.x + 3, y: a.y + 1 }, m = H.near(a.x, a.y, 6)[0];
      if (kind === 'swipe' && !m) return false; start(a, kind, kind === 'swipe' ? { m } : kind === 'tide' || kind === 'reavers' ? { x: c.x, y: c.y } : null); return true; }
    return { tick, fin, cast, update, stop, inK, outK, descent, entrance, drawGround, drawFx, drawBodyFx, drawCine, CFG, get shield() { return sh; }, get seal() { return seal; }, get t9() { return T9; }, get fx() { return FX; }, get lifted() { return lifted; } };
  }
  return { create, CFG };
})();
if (typeof self !== 'undefined') self.ABADDON_MOVES = ABADDON_MOVES;
