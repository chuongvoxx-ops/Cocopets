/* ---------- Dark, the 11th Ultimate: Day of the Dead ----------
   A marigold circle blooms under the caster and every party member that is DOWN at the cast rises beside it as a
   temporary spirit. All spirits materialise together, then on ONE combat update each casts its own equipped Ultimate;
   each then casts its first and its second equipped Strong, every action starting when the previous one's effects have
   left the effect list (its fx, a 9 s cap for sustained ones); then it fights on its own with normal attacks for 8 s
   (11 s at Adept, 14 s at Celestial; interpolated), and departs. It returns to rest: the member's `down`, health, magic
   and cooldowns are never touched (the party-defeat rule in 20b is unchanged: spirits do not count as standing).
   How a spirit casts: each spirit is an actor object shaped like the dungeon's `me` (position, radius, hp, facing, z,
   dash/push/leap, castT ...). It gets its OWN elemental runner, DunElem.create(X'), where X' is the floor's toolkit
   context with `me` = the spirit and the self-facing parts redirected to it: ST/pet = the member's own stats and pet
   (base damage = its petCombat atk x the move's mult, as useUlt/useStrong compute it), heal = the spirit's temporary
   HP, wards (Rock Steady, Love Sanctuary) = the spirit's own, g = a child of the floor's g (Object.create) so a move's
   writes (Mountain's Rebuttal's guard, a haste buff) land on the spirit and never on the real pet, shot() fires from the
   spirit, restoreParty() does nothing (no nested revival), onNormal() = the spirit's own normal attacks, and the
   camera / flash / hitstop / negative / lights / sounds pass through a shared limiter (several Ultimates at once do not
   stack full-strength shakes, blooms or clipping sounds; their decorative particles are thinned for 4 s after the release). Damage still goes through the floor's hitMon / hitArea, attributed to the party.
   Supported: elemental Ultimates and Strongs (ey_ / ex_ keys). Skipped (logged, the sequence moves on): empty or locked
   slots, innate / card / star-signature moves (they are written against the played pet inside 20b), resurrection
   Ultimates (Day of the Dead itself, Salvation), Zephyr's Blessing (a party-state buff the dungeon reads for the played
   pet only), an attack with no monster within reach. Self-effects act on the spirit: Demon Blade's HP cost and
   Dracula's heal use its temporary HP, Rock Steady / Love Sanctuary ward it, Rebuttal's guard shields it, Fujin and
   Lightning Flash move it (its push / dash / leap are integrated here as the dungeon does for the pet).
   Being hit: monsters in this game only ever target the played pet, so spirits are hittable the minimal way: an enemy
   shot that crosses a spirit hits it (and is spent), and a monster in contact with a spirit strikes it with its own
   contact damage (0.9 s per monster). Healing restores temporary HP up to its revival amount; it never extends the
   timer. A spirit at 0 HP fractures and ends at once (its pending actions are cancelled, its effects' onEnd run).
   A member already up as a spirit is not raised again by an overlapping cast. With nobody down the cast is refused
   through DunElem.refuse (hook in 20b's useUlt): a banner, no MP, no cooldown.
   Cleanup: departure / fracture end the spirit's effects; a party wipe or the floor's end fractures them all; the floor
   object (and this cast's state on it) is thrown away with the floor. */
(() => {
  const U = ELEM_IMPL.dark.ult;
  const TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const MARI = '#FF9A1F', MARI2 = '#FFB52E', DEEP = '#D9540B', GOLD = '#FFC24D', CANDLE = '#FFE3A6', WAX = '#7A3FC2';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  /* Base (1) / Adept (4) / Celestial (7), the stages between interpolated */
  const byLv = (v, ev) => ev <= 4 ? lerp(v[0], v[1], (ev - 1) / 3) : lerp(v[1], v[2], (ev - 4) / 3);
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  /* the tuning data (configurable) */
  const TUNE = {
    hpFrac: [0.4, 0.5, 0.6],     // revival HP: a share of the member's own max HP (petCombat(p).hp)
    dur: [8, 11, 14],            // s of free fighting after its Ult + two Strongs
    sync: 2.3,                   // s after the cast: every spirit casts its Ultimate on this update
    actionCap: 9,                // s: an action whose effects last longer (sustained fields, summons) lets the next one start
    contactCd: 0.9, contactR: 0.3,   // monsters in contact strike a spirit this often, this close (beyond both radii)
    normalIv: 0.55, normalK: 0.8, reach: 4.6, spd: 3.6, leash: 9,   // its normal attacks and its walking
    depart: 1.4, fracture: 0.7,  // s of the leave-taking animations
  };
  const RESURRECT = new Set(['dayofthedead', 'salvation']);   // never cast by a spirit: no resurrection loops
  const PARTYBUFF = new Set(['zephyrblessing']);              // a party-state buff the dungeon applies to the played pet only
  const SUPPORT = new Set(['rhapsody', 'breathofthewild', 'lovesanctuary', 'rocksteady', 'rebuttal', 'tailwind']);   // cast even with no monster near

  /* ================= cached pictures: the marigold circle in three layers, baked once ================= */
  const PX = 384;
  let BAKE = null;
  function petalPath(c, len, w) { c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(w, -len * 0.22, w * 0.95, -len * 0.78, 0, -len); c.bezierCurveTo(-w * 0.95, -len * 0.78, -w, -len * 0.22, 0, 0); c.closePath(); }
  function petalRow(c, R, n, r0, len, w, cBase, cTip, a, rot, edge) {
    for (let i = 0; i < n; i++) { c.save(); c.rotate(rot + i / n * TAU); c.translate(0, -r0);
      const gr = c.createLinearGradient(0, 0, 0, -len); gr.addColorStop(0, rgba(cBase, a * 0.35)); gr.addColorStop(0.35, rgba(cBase, a * 0.8)); gr.addColorStop(1, rgba(cTip, a));
      petalPath(c, len, w); c.fillStyle = gr; c.fill();
      if (edge) { c.strokeStyle = rgba(edge, a * 0.55); c.lineWidth = 1.1; c.stroke(); }
      c.strokeStyle = rgba('#FFE9B0', a * 0.35); c.lineWidth = 0.9; c.beginPath(); c.moveTo(0, -len * 0.12); c.quadraticCurveTo(w * 0.12, -len * 0.5, 0, -len * 0.86); c.stroke();
      c.restore(); }
  }
  function softRing(c, r, w, col, a) { c.strokeStyle = rgba(col, a * 0.16); c.lineWidth = w * 5; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = rgba(col, a * 0.32); c.lineWidth = w * 2.2; c.stroke(); c.strokeStyle = rgba('#FFF1C8', a * 0.85); c.lineWidth = w; c.stroke(); }
  function bake() {
    if (BAKE) return BAKE;
    const mk = () => { const cv = document.createElement('canvas'); cv.width = cv.height = PX; const c = cv.getContext('2d'); c.translate(PX / 2, PX / 2); return [cv, c]; };
    const R = PX / 2 * 0.97;
    // A: the dark translucent interior and two rows of marigold petals round it
    const [A, a] = mk();
    { const gr = a.createRadialGradient(0, 0, 0, 0, 0, R * 0.74); gr.addColorStop(0, rgba(VOID, 0.42)); gr.addColorStop(0.55, rgba(BODY, 0.38)); gr.addColorStop(0.85, rgba(PLUM, 0.3)); gr.addColorStop(1, rgba(PLUM, 0)); a.fillStyle = gr; a.beginPath(); a.arc(0, 0, R * 0.74, 0, TAU); a.fill(); }
    petalRow(a, R, 26, R * 0.6, R * 0.38, R * 0.085, DEEP, MARI2, 0.82, TAU / 52, '#FFE08A');
    petalRow(a, R, 26, R * 0.54, R * 0.3, R * 0.07, '#B8410A', MARI, 0.7, 0, null);
    softRing(a, R * 0.6, 1.4, GOLD, 0.7);
    // B: the rune ring (two golden circles with ticks, glyphs, spokes and a woven star), drawn additively
    const [B, b] = mk();
    softRing(b, R * 0.5, 1.5, GOLD, 0.9); softRing(b, R * 0.43, 1.1, GOLD, 0.75); softRing(b, R * 0.27, 1, MARI2, 0.6);
    b.strokeStyle = rgba('#FFE7A8', 0.8); b.lineWidth = 1.2;
    for (let i = 0; i < 48; i++) { const an = i / 48 * TAU, l = i % 6 === 0 ? 0.06 : 0.025; b.beginPath(); b.moveTo(Math.cos(an) * R * 0.43, Math.sin(an) * R * 0.43); b.lineTo(Math.cos(an) * R * (0.43 + l), Math.sin(an) * R * (0.43 + l)); b.stroke(); }
    for (let i = 0; i < 12; i++) { const an = (i + 0.5) / 12 * TAU, gx = Math.cos(an) * R * 0.466, gy = Math.sin(an) * R * 0.466, s = R * 0.022; b.save(); b.translate(gx, gy); b.rotate(an + Math.PI / 2); b.beginPath();
      const k = i % 4; if (k === 0) { b.moveTo(-s, s); b.lineTo(0, -s); b.lineTo(s, s); } else if (k === 1) { b.arc(0, 0, s, 0.3, TAU - 0.3); b.moveTo(0, -s); b.lineTo(0, s); } else if (k === 2) { b.moveTo(-s, -s); b.lineTo(s, s); b.moveTo(s, -s); b.lineTo(-s, s); b.moveTo(0, -s * 1.3); b.lineTo(0, -s * 0.6); } else { b.moveTo(-s, 0); b.quadraticCurveTo(0, -s * 1.8, s, 0); b.quadraticCurveTo(0, s * 1.8, -s, 0); }
      b.stroke(); b.restore(); }
    b.strokeStyle = rgba(GOLD, 0.3); b.lineWidth = 1;
    for (let i = 0; i < 16; i++) { const an = i / 16 * TAU; b.beginPath(); b.moveTo(Math.cos(an) * R * 0.27, Math.sin(an) * R * 0.27); b.lineTo(Math.cos(an) * R * 0.43, Math.sin(an) * R * 0.43); b.stroke(); }
    for (let k = 0; k < 2; k++) { b.beginPath(); for (let i = 0; i <= 3; i++) { const an = -Math.PI / 2 + k * Math.PI + i / 3 * TAU, x = Math.cos(an) * R * 0.27, y = Math.sin(an) * R * 0.27; i ? b.lineTo(x, y) : b.moveTo(x, y); } b.strokeStyle = rgba(MARI2, 0.45); b.stroke(); }
    // C: the bright centre rosette (three layers of short petals on a violet heart)
    const [Cc, cc] = mk();
    { const gr = cc.createRadialGradient(0, 0, 0, 0, 0, R * 0.3); gr.addColorStop(0, rgba(EDGE, 0.55)); gr.addColorStop(0.5, rgba(ENERGY, 0.3)); gr.addColorStop(1, rgba(ENERGY, 0)); cc.fillStyle = gr; cc.beginPath(); cc.arc(0, 0, R * 0.3, 0, TAU); cc.fill(); }
    petalRow(cc, R, 18, R * 0.1, R * 0.2, R * 0.05, DEEP, MARI2, 0.85, 0, '#FFE08A');
    petalRow(cc, R, 14, R * 0.06, R * 0.14, R * 0.045, MARI, '#FFD27A', 0.9, 0.2, null);
    petalRow(cc, R, 10, R * 0.02, R * 0.08, R * 0.035, MARI2, '#FFF0C0', 0.95, 0.1, null);
    BAKE = { A, B, C: Cc };
    return BAKE;
  }
  /* a baked layer laid flat on the floor (squashed like every floor circle), turned by rot */
  function floorImg(c, img, x, y, r, rot, a, add) { if (r < 1 || a <= 0.004) return; c.save(); c.translate(x, y); c.scale(1, 0.55); c.rotate(rot); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = cl(a); c.drawImage(img, -r, -r, r * 2, r * 2); c.restore(); }
  const blit = (c, spr, x, y, s, a) => { if (a <= 0.004) return; c.globalAlpha = cl(a); blitSized(c, spr, x - s, y - s, s * 2, s * 2); };

  /* ================= a shared limiter for the camera, flashes and sounds of several Ultimates at once ================= */
  function limiter(H) {
    const X0 = H.X, g = H.g, L = { sh: -9, shM: 0, fl: -9, hs: -9, neg: -9, snd: {} };
    const sfx0 = X0.sfx || {}, sfx = {};
    for (const k in sfx0) { const fn = sfx0[k]; sfx[k] = typeof fn !== 'function' ? fn : (...a) => { const t = performance.now(); if (k !== 'note' && k !== 'hiss' && t - (L.snd[k] || -1e9) < 90) return; L.snd[k] = t; try { return fn.apply(sfx0, a); } catch (e) { /* (a sound is never worth a crash) */ } }; }
    return {
      L, sfx,
      shake(m, t) { if (calm()) return; const now = g.t; m = Math.min(9, (m || 0) * 0.6); if (now - L.sh < 0.22 && m <= L.shM) return; L.sh = now; L.shM = m; X0.shake(m, Math.min(0.3, t || 0.2)); },
      flash(a, col) { const now = g.t; if (now - L.fl < 0.12) return; L.fl = now; X0.flash(Math.min(0.28, a || 0), col); },
      hitstop(d) { const now = g.t; if (now - L.hs < 0.4) return; L.hs = now; if (X0.hitstop) X0.hitstop(Math.min(0.03, d || 0)); },
      negative(d) { const now = g.t; if (now - L.neg < 1.2) { X0.flash(0.2, ACC); return; } L.neg = now; if (X0.negative) X0.negative(Math.min(0.3, d || 0.3)); },
      light(x, y, r, life) { const now = g.t; if (now - (L.li || -9) < 0.08) return; L.li = now; X0.light(x, y, r * 0.8, life); },
      thin: 0,   // the share of the spirits' decorative particles dropped while several Ultimates overlap (set at the release)
      part(o) { if (this.thin > 0 && Math.random() < this.thin) return; X0.part(o); },
    };
  }

  /* ================= the spirit: an actor shaped like the dungeon's `me`, with its own elemental runner ================= */
  function makeSpirit(H, m, i, x, y, ev, LIM) {
    const p = m.p, ST = m.ST || petCombat(p), size = typeof dunPetSize === 'function' ? dunPetSize(p, formOf(p)) : 1, hpMax = Math.max(1, Math.round(ST.hp * byLv(TUNE.hpFrac, ev)));
    const S = { spirit: true, m, p, ST, kit: (m.kit && m.kit.kit) || {}, i, size, oy: 0.25 * size, r: 0.2 + 0.1 * size, x, y, x0: x, y0: y, face: x < H.me.x ? 1 : -1, ax: 0, ay: -1,
      hp: hpMax, hpMax, mp: 999, dead: false, inv: 0, hurtT: 9, dash: null, spin: null, leap: null, beam: null, bob: 0, z: 0, vx: 0, vy: 0, dodge: null, chill: 0, push: null, tilt: 0, sq: 0, castT: 0, castM: 1, castUlt: false, wx: x, wy: y,
      phase: 'rise', queue: [], act: null, log: [], fightT: 0, dur: byLv(TUNE.dur, ev), endT: 0, wards: [], ward: null, hooks: [], atkT: 0.3, petT: 0, cdm: new Map(), hits: 0, taken: 0, seed: i * 7.31 + 3,
      cracks: null, gone: false };
    S.sg = Object.create(H.g); S.sg.buff = {}; S.sg.guardHP = 0; S.sg.guardMax = 1; S.sg.zephyr = null;   // the spirit's own copy of the floor's state (reads fall through; writes stay its own)
    const X0 = H.X;
    const XS = Object.assign({}, X0, {
      me: S, g: S.sg, ST: () => S.ST, pet: () => S.p,
      heal: (n, quiet) => { if (S.dead || !(n > 0)) return; const b = S.hp; S.hp = Math.min(S.hpMax, S.hp + n); if (!quiet && S.hp - b >= 1) X0.text(S.x, S.y - 1.1 * S.size, '+' + Math.round(S.hp - b), '#FFD9A0', 12); },
      gainMP: () => {},
      shot: o => X0.shot(Object.assign({ x: S.x, y: S.y - S.oy }, o)),
      party: () => (X0.party ? X0.party() : []), restoreParty: () => [], partySlot: () => null,
      setWard: fn => { S.ward = fn || null; },
      addWard: (fn, first) => { if (first) S.wards.unshift(fn); else S.wards.push(fn); return () => { const k = S.wards.indexOf(fn); if (k >= 0) S.wards.splice(k, 1); }; },
      onNormal: fn => { S.hooks.push(fn); return () => { const k = S.hooks.indexOf(fn); if (k >= 0) S.hooks.splice(k, 1); }; }, onNormalN: () => S.hooks.length,
      banner: (s) => X0.text(S.x, S.y - 1.5 * S.size, s, '#FFD9A0', 12, { life: 1.1, max: 1.1, vy: -0.7 }),   // a spirit's cast is called over the spirit, not as a full banner
      shake: LIM.shake, flash: LIM.flash, hitstop: LIM.hitstop, negative: LIM.negative, sfx: LIM.sfx, light: LIM.light, part: o => LIM.part(o),
    });
    S.X = XS; S.E = DunElem.create(XS);
    return S;
  }
  const RUN_LOG = [];   // (for tests: every attempt of every spirit, newest last; trimmed)
  /* the aim from a spirit, as the dungeon's aim() does from the pet */
  function aimFrom(H, S) { const t = H.X.nearestMon(S.x, S.y, 8.5, null, true) || H.X.nearestMon(S.x, S.y, 12); if (t) { const d = Math.hypot(t.x - S.x, t.y - S.y) || 1; return { t, x: (t.x - S.x) / d, y: (t.y - S.y) / d, a: Math.atan2(t.y - S.y, t.x - S.x) }; } const a = S.face > 0 ? 0 : Math.PI; return { t: null, x: Math.cos(a), y: Math.sin(a), a }; }
  /* one granted activation of a slot ('ult', 'strong', 'strong2'): returns the action (the effects it made) or null if skipped */
  function castSlot(H, S, slot) {
    const ab = S.kit[slot], kind = slot === 'ult' ? 'ult' : 'strong', key = ab && typeof ab.key === 'string' ? ab.key.slice(3) : '';
    let why = '';
    if (!ab) why = 'empty';
    else if (ab.locked) why = 'locked';
    else if (!ab.elem || !ab.e8 || ab.key.slice(0, 3) !== (kind === 'ult' ? 'ey_' : 'ex_')) why = 'not elemental';
    else if (kind === 'ult' && RESURRECT.has(key)) why = 'resurrection';
    else if (kind === 'ult' && (ab.star || 0) < ELEM_ULT_STARS) why = 'stars';
    else if (PARTYBUFF.has(key)) why = 'party buff';
    else if (!(ELEM_IMPL[ab.e8] && ELEM_IMPL[ab.e8][kind] && ELEM_IMPL[ab.e8][kind][key])) why = 'no move';
    const A = aimFrom(H, S);
    if (!why && !A.t && !SUPPORT.has(key)) why = 'no target';
    const rec = { who: S.p.name, i: S.i, slot, key: key || (ab && ab.key) || '', t: H.g.t, ok: !why, why };
    S.log.push(rec); RUN_LOG.push(rec); if (RUN_LOG.length > 200) RUN_LOG.shift();
    if (why) return null;
    S.face = A.x >= 0 ? 1 : -1; S.ax = A.x; S.ay = A.y;
    const E = ELEMENTS[ab.el] || (typeof E8 !== 'undefined' && E8[ab.e8]) || ELEMENTS.dark, base = S.ST.atk * (ab.mult || 1), up = kind === 'ult' ? (ab.tier || 0) >= 2 : (ab.tier || 1) >= 2;
    const tx = A.t ? A.t.x : S.x + Math.cos(A.a) * (kind === 'ult' ? 4 : 3), ty = A.t ? A.t.y : S.y + Math.sin(A.a) * (kind === 'ult' ? 4 : 3);
    const C = { a: A.a, base, E, el: ab.el, e8: ab.e8, evo: ab.evo || 1, sig: !!ab.sig, tx, ty, A, up };
    S.castT = S.castM = kind === 'ult' ? 1 : 0.55; S.castUlt = kind === 'ult'; S.sq = 0.8;
    // the spirit's subtle violet-and-gold accent round its own cast (the move keeps its own look)
    H.X.ring(S.x, S.y, 0.2, kind === 'ult' ? 2.2 : 1.4, 0.45, kind === 'ult' ? GOLD : EDGE, 0.16);
    H.glowAt(S.x, S.y - S.oy, kind === 'ult' ? 2.2 : 1.4, 0.45, kind === 'ult' ? MARI2 : EDGE, 0.5);
    const before = new Set(S.E.fx); let ok = false;
    try { ok = kind === 'ult' ? S.E.ult(key, C) : S.E.strong(key, C); } catch (e) { rec.ok = false; rec.why = 'error: ' + (e && e.message); if (typeof console !== 'undefined') console.warn('Day of the Dead: a spirit\'s move failed', key, e); }
    if (!ok) { rec.ok = false; rec.why = rec.why || 'refused'; return null; }
    return { set: S.E.fx.filter(f => !before.has(f)), t0: H.g.t, slot };
  }
  const actDone = (H, S) => !S.act || S.act.set.every(f => S.E.fx.indexOf(f) < 0) || H.g.t - S.act.t0 > TUNE.actionCap;
  /* the spirit takes a hit: its wards, then its guard, then its temporary HP */
  function hurtSpirit(H, S, d, src) {
    if (S.dead || S.phase === 'rise' || !(d > 0)) return false;
    if (S.inv > 0 || S.dash || S.leap) return false;
    for (const w of S.wards.slice()) { d = w(d, src, {}); if (!(d > 0)) { S.inv = 0.3; return false; } }
    if (S.ward) { d = S.ward(d, src, {}); if (!(d > 0)) { S.inv = 0.3; return false; } }
    if (S.sg.guardHP > 0) { const s = Math.min(S.sg.guardHP, d); S.sg.guardHP -= s; d -= s; if (d <= 0) { S.inv = 0.3; return false; } }
    S.hp -= d; S.taken += d; S.inv = 0.35; S.hurtT = 0; S.sq = 1;
    H.X.text(S.x, S.y - 0.9 * S.size - 0.2, '-' + Math.round(d), '#C9A2FF', 14);
    H.X.sparks(S.x, S.y - S.oy, ACC, 5, 4);
    return true;
  }
  /* the spirit's pending actions are cancelled: its effects end (their own clean-ups run) */
  function cancelAll(S) {
    S.dead = true; S.queue.length = 0; S.act = null;
    const list = S.E.fx.slice(); S.E.fx.length = 0;
    for (const f of list) { try { if (f.onEnd) f.onEnd(f); } catch (e) { /* (a clean-up that throws must not stop the others) */ } }
    S.wards.length = 0; S.ward = null; S.hooks.length = 0; S.dash = S.push = S.leap = null; S.petAlt = null;
  }

  /* ================= drawing a spirit: the pet's own art (drawPetFull) made spectral ================= */
  function drawBody(H, S, c, T, t, vis) {
    if (S.petAlt && S.E.fx.indexOf(S.petAlt) >= 0 && !S.dead) return;   // (Dracula: the pet is drawn as the bat)
    if (vis.reveal <= 0.002) return;
    const m0 = c.getTransform(), k = Math.max(1, Math.min(3, Math.hypot(m0.a, m0.b)));
    const h = T * 1.02 * S.size, bw = h * 2.6, bh = h * 2.9, base = bh - h * 0.5;
    const W = Math.min(640, Math.ceil(bw * k)), Hh = Math.min(720, Math.ceil(bh * k)), kk = W / bw;
    if (!S.oc || S.oc.width !== W || S.oc.height !== Hh) { S.oc = document.createElement('canvas'); S.oc.width = W; S.oc.height = Hh; S.rc = document.createElement('canvas'); S.rc.width = W; S.rc.height = Hh; }
    const o = S.oc.getContext('2d'), r = S.rc.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0); o.globalCompositeOperation = 'source-over'; o.globalAlpha = 1; o.clearRect(0, 0, W, Hh);
    o.setTransform(kk, 0, 0, kk, 0, 0);
    const moving = !!S.moving && !S.dead, PF = formOf(S.p);
    const pose = { walk: S.bob, moving, t, cast: S.castT > 0 ? 1 - S.castT / (S.castM || 1) : 0, ult: !!S.castUlt, wingPh: 0, wingAmp: moving ? 14 : 8, yaw: S.yaw || 0, hopArm: S.hopArm || 0, hopFoot: S.hopFoot || 0, hopArmS: S.hopArmS || null };
    try {
      drawPetFull(o, bw / 2, base, h, { sprites: S.m.sprites || arc.sprites, form: PF, t, unit: T * S.size, tile: T, float: true, el: S.m.el, z: 0, moving, walk: S.bob, flip: S.face < 0, face: vis.face || 'normal', pose, sx: 1 + S.sq * 0.1, sy: 1 - S.sq * 0.08, rot: S.hopLean || 0, rig: true, shadow: false, glow: false, circle: false });
    } catch (e) { /* (a pet whose pictures are still loading: nothing this frame) */ }
    o.setTransform(1, 0, 0, 1, 0, 0);
    // the gold silhouette for the rim
    r.setTransform(1, 0, 0, 1, 0, 0); r.globalCompositeOperation = 'source-over'; r.globalAlpha = 1; r.clearRect(0, 0, W, Hh); r.drawImage(S.oc, 0, 0); r.globalCompositeOperation = 'source-in'; r.fillStyle = GOLD; r.fillRect(0, 0, W, Hh);
    // translucent violet spectral shading (the pet's own colours still read through)
    // (multiply keeps the pet's own lines and shading readable under the violet; a deeper violet pools toward the feet)
    o.globalCompositeOperation = 'multiply'; o.fillStyle = '#9E78EC'; o.fillRect(0, 0, W, Hh);
    o.globalCompositeOperation = 'source-atop';
    { const gr = o.createLinearGradient(0, base * kk - h * 1.25 * kk, 0, base * kk); gr.addColorStop(0, rgba('#8E5BE0', 0.16)); gr.addColorStop(0.6, rgba(ENERGY, 0.3)); gr.addColorStop(1, rgba(PLUM, 0.55)); o.fillStyle = gr; o.fillRect(0, 0, W, Hh); }
    o.globalCompositeOperation = 'destination-in'; o.drawImage(S.rc, 0, 0); o.globalCompositeOperation = 'source-atop';
    // luminous skeletal markings, clipped to the body: leg bones, a few belly ribs, a small crown rosette (the face stays clear)
    { o.save(); o.scale(kk, kk); const cx = bw / 2, by = base, u = h, lw = Math.max(1, u * 0.028), fl = S.face < 0 ? -1 : 1;
      const line = (pts, w, col, a) => { o.strokeStyle = rgba(col, a); o.lineWidth = w; o.lineCap = 'round'; o.lineJoin = 'round'; o.beginPath(); pts.forEach((q, j) => (j ? o.lineTo(cx + q[0] * u * fl, by + q[1] * u) : o.moveTo(cx + q[0] * u * fl, by + q[1] * u))); o.stroke(); };
      const glow = vis.mark;
      for (const s of [-1, 1]) { line([[s * 0.13, -0.2], [s * 0.14, -0.06]], lw * 2.6, ACC, 0.22 * glow); line([[s * 0.13, -0.2], [s * 0.14, -0.06]], lw, '#FFF0D6', 0.75 * glow); o.fillStyle = rgba('#FFF0D6', 0.7 * glow); o.beginPath(); o.arc(cx + s * 0.14 * u * fl, by - 0.05 * u, lw * 1.3, 0, TAU); o.fill(); }
      for (let j = 0; j < 3; j++) { const yy = -0.3 - j * 0.06, wd = 0.15 - j * 0.02; line([[-wd, yy + 0.03], [0, yy - 0.01], [wd, yy + 0.03]], lw * 2.4, ACC, 0.2 * glow); line([[-wd, yy + 0.03], [0, yy - 0.01], [wd, yy + 0.03]], lw * 0.9, '#FFE7C0', 0.6 * glow); }
      line([[0, -0.44], [0, -0.24]], lw * 0.9, '#FFE7C0', 0.45 * glow);
      // the crown rosette (a small marigold over the brow, sugar-skull style)
      const ry = by - h * 0.96; for (let j = 0; j < 6; j++) { const an = j / 6 * TAU + 0.3; o.fillStyle = rgba(MARI2, 0.85 * glow); o.beginPath(); o.ellipse(cx + Math.cos(an) * u * 0.045, ry + Math.sin(an) * u * 0.03, u * 0.035, u * 0.022, an, 0, TAU); o.fill(); }
      o.fillStyle = rgba(EDGE, 0.9 * glow); o.beginPath(); o.arc(cx, ry, u * 0.022, 0, TAU); o.fill();
      // an early defeat: violet fractures spreading over the body
      if (vis.crack > 0 && S.cracks) for (const cr of S.cracks) { const n = Math.max(2, Math.round(cr.length * vis.crack)); line(cr.slice(0, n), lw * 3, EDGE, 0.5); line(cr.slice(0, n), lw * 1.1, '#F4E8FF', 0.95); }
      o.restore(); }
    // materialising feet-up (rise) or dissolving head-down (departure): a feathered mask on both pictures
    if (vis.reveal < 1 || vis.cut > 0) {
      for (const q of [o, r]) { q.globalCompositeOperation = 'destination-in'; const fe = h * 0.16 * kk;
        let gr;
        if (vis.reveal < 1) { const yl = (base - vis.reveal * h * 1.45) * kk; gr = q.createLinearGradient(0, yl + fe, 0, yl - fe); }
        else { const yl = (base - (1 - vis.cut) * h * 1.45) * kk; gr = q.createLinearGradient(0, yl - fe, 0, yl + fe); }
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = gr; q.fillRect(0, 0, W, Hh); }
    }
    // onto the floor: soft smoke and violet glow under, the gold rim (a halo and an upper-left edge), then the body
    const X = H.sx(S.x + (S.hopDX || 0)), Y0 = H.sy(S.y + (S.hopDY || 0)) + T * 0.18, z = (S.z || 0) * T, dx = X - bw / 2, dy = Y0 - z - base;
    c.save();
    c.globalCompositeOperation = 'lighter'; blit(c, glowSprite(ENERGY), X, Y0 - z - h * 0.45, h * 0.95, 0.42 * vis.glow * vis.a);
    c.globalCompositeOperation = 'source-over'; blit(c, glowSprite(SMOKE), X, Y0 - h * 0.05, h * 0.6, 0.45 * vis.a);
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = 0.3 * vis.glow * vis.a; c.drawImage(S.rc, dx - bw * 0.03, dy - bh * 0.03 + h * 0.04, bw * 1.06, bh * 1.06);
    c.globalAlpha = 0.55 * vis.a; c.drawImage(S.rc, dx - 1.2, dy - 1.4, bw, bh);
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.86 * vis.a * (S.inv > 0.2 && Math.floor(t * 20) % 2 ? 0.6 : 1); c.drawImage(S.oc, dx, dy, bw, bh);
    // the bright seam where it is forming or fading
    if (vis.reveal < 1 || vis.cut > 0) { const yl = vis.reveal < 1 ? Y0 - z - vis.reveal * h * 1.45 : Y0 - z - (1 - vis.cut) * h * 1.45; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * vis.a; blitSized(c, beamSprite(GOLD), X - h * 0.55, yl - h * 0.06, h * 1.1, h * 0.12); }
    c.restore();
  }
  /* the violet flame pillar (rise) and the small golden flame that leaves (departure) */
  function pillar(c, x, y, T, k, t, seed) {
    if (k <= 0.01) return; const hgt = T * (3.2 + 0.4 * Math.sin(t * 7 + seed)), w = T * (0.42 + 0.06 * Math.sin(t * 11 + seed));
    c.save(); c.globalCompositeOperation = 'lighter';
    c.translate(x, y); c.rotate(-Math.PI / 2);
    c.globalAlpha = 0.5 * k; blitSized(c, beamSprite(ENERGY), -w * 0.3, -w * 1.5, hgt, w * 3);
    c.globalAlpha = 0.75 * k; blitSized(c, beamSprite(EDGE), -w * 0.2, -w * 0.7, hgt * 0.85, w * 1.4);
    c.globalAlpha = 0.65 * k; blitSized(c, beamSprite(ACC), 0, -w * 0.25, hgt * 0.62, w * 0.5);
    c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; blit(c, glowSprite(EDGE), x, y - T * 0.2, T * 1.1, 0.45 * k); c.restore();
  }
  function goldFlame(c, x, y, T, a, t) {
    if (a <= 0.01) return; c.save(); c.globalCompositeOperation = 'lighter'; blit(c, glowSprite(MARI2), x, y, T * 0.7, 0.6 * a); blit(c, glowSprite('#FFF1C8'), x, y, T * 0.28, 0.8 * a);
    const s = T * 0.2, fl = Math.sin(t * 17) * s * 0.15; c.globalAlpha = cl(0.9 * a); c.fillStyle = '#FFE3A0'; c.beginPath(); c.moveTo(x + fl, y - s * 2.1); c.bezierCurveTo(x + s * 0.9, y - s * 0.6, x + s * 0.7, y + s * 0.6, x, y + s * 0.7); c.bezierCurveTo(x - s * 0.7, y + s * 0.6, x - s * 0.9, y - s * 0.6, x + fl, y - s * 2.1); c.fill(); c.restore();
  }
  /* a small violet candle standing on the circle's rim */
  function candle(c, x, y, T, lit, t, seed, a) {
    if (a <= 0.01) return; const w = T * 0.12, h = T * (0.3 + 0.08 * R1(seed));
    c.save(); c.globalAlpha = a;
    const gr = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#9B6BE0'); gr.addColorStop(0.45, WAX); gr.addColorStop(1, '#2E1250'); c.fillStyle = gr; c.fillRect(x - w / 2, y - h, w, h);
    c.fillStyle = '#B48AF0'; c.beginPath(); c.ellipse(x, y - h, w / 2, w * 0.2, 0, 0, TAU); c.fill();
    c.fillStyle = rgba('#000000', 0.25); c.beginPath(); c.ellipse(x, y, w * 0.7, w * 0.22, 0, 0, TAU); c.fill();
    c.restore();
    if (lit > 0.01) { const fy = y - h - T * 0.08, fl = 1 + 0.15 * Math.sin(t * 19 + seed * 3); c.save(); c.globalCompositeOperation = 'lighter'; blit(c, glowSprite('#FFB347'), x, fy, T * 0.42 * lit * fl, 0.55 * a);
      const s = T * 0.07 * lit * fl; c.globalAlpha = cl(0.95 * a); c.fillStyle = CANDLE; c.beginPath(); c.moveTo(x, fy - s * 2.2); c.quadraticCurveTo(x + s, fy, x, fy + s * 0.6); c.quadraticCurveTo(x - s, fy, x, fy - s * 2.2); c.fill(); c.restore(); }
  }
  /* a golden thread: a curve from (x0, y0) to (x1, y1) arching upward, drawn to u, beads running along it */
  function thread(c, x0, y0, x1, y1, u, a, t, seed, flare) {
    if (a <= 0.01 || u <= 0.01) return; const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.hypot(x1 - x0, y1 - y0) * 0.32 - 20, N = 22, pts = [];
    for (let j = 0; j <= N; j++) { const q = j / N * u, w = 1 - q; pts.push([w * w * x0 + 2 * w * q * mx + q * q * x1, w * w * y0 + 2 * w * q * my + q * q * y1 + Math.sin(q * 9 + t * 3 + seed) * 2.5 * (1 - flare)]); }
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    const path = () => { c.beginPath(); pts.forEach((q, j) => (j ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]))); };
    path(); c.strokeStyle = rgba(MARI, 0.18 * a * (1 + flare)); c.lineWidth = 7 + 6 * flare; c.stroke();
    c.strokeStyle = rgba(GOLD, 0.5 * a * (1 + flare * 0.6)); c.lineWidth = 2.2 + flare * 2; c.stroke();
    c.strokeStyle = rgba('#FFF1C8', 0.8 * a); c.lineWidth = 0.9; c.stroke();
    for (let b = 0; b < 2; b++) { const q = ((t * 0.45 + b * 0.5 + seed * 0.13) % 1) * u, j = Math.min(N, Math.round(q / Math.max(u, 0.001) * N)); blit(c, glowSprite('#FFE7A8'), pts[j][0], pts[j][1], 6 + flare * 5, 0.8 * a); }
    c.restore();
  }

  /* ================= the Ultimate ================= */
  function eligible(H) { const party = H.X.party ? H.X.party() : [], act = H.g._dotd || (H.g._dotd = new Set()); return party.filter(m => m && m.down && !act.has(m.p) && m.p && (m.ST || m.p)); }
  U.dayofthedead = (C, H) => {
    const me = H.me, X0 = H.X, g = H.g, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const list = eligible(H);
    if (!list.length) {   // (the cast path refuses before spending; this is only a safety net)
      X0.text(me.x, me.y - 1.2, 'No fallen teammates', ACC, 13); g.cdU = 0; const mv = ELEM_LIST.dark.ey_dayofthedead; me.mp = (me.mp || 0) + (mv ? mv.cost : 0); return;
    }
    const LIM = limiter(H), act = g._dotd;
    const cx = me.x, cy = me.y, CR = byLv([2.9, 3.25, 3.6], ev), NC = [12, 14, 16][tier - 1], A0 = (H.X.nearestMon(me.x, me.y, 12) ? Math.atan2(H.X.nearestMon(me.x, me.y, 12).y - me.y, H.X.nearestMon(me.x, me.y, 12).x - me.x) : -Math.PI / 2);
    // where each rises: a formation round the caster on valid ground (the fall spots are not kept by the dungeon)
    const OFF = [A0 + Math.PI * 0.62, A0 - Math.PI * 0.62, A0 + Math.PI], spirits = [];
    list.forEach((m, i) => { const an = OFF[i % 3] + Math.floor(i / 3) * 0.5, d = 2.1 + Math.floor(i / 3) * 0.9; let p = X0.walkPoint(cx + Math.cos(an) * d, cy + Math.sin(an) * d, { r: 0.4, mv: 0, x: cx, y: cy });
      for (const q of spirits) if (Math.hypot(q.x - p.x, q.y - p.y) < 0.9) p = X0.walkPoint(p.x + Math.cos(an) * 0.9, p.y + Math.sin(an) * 0.9, { r: 0.4, mv: 0, x: p.x, y: p.y });
      const S = makeSpirit(H, m, i, p.x, p.y, ev, LIM); S.cracks = []; for (let k = 0; k < 4; k++) { const pts = [[(R1(i * 9 + k) - 0.5) * 0.2, -0.5 - R1(i + k * 3) * 0.3]]; for (let j = 1; j < 7; j++) { const q = pts[j - 1]; pts.push([q[0] + (R1(i + k * 7 + j) - 0.5) * 0.18, q[1] + (R1(i * 3 + k + j * 5) - 0.3) * 0.14]); } S.cracks.push(pts); }
      spirits.push(S); act.add(m.p); });   // (keyed by the pet: the Team sheet may rebuild the party's records mid-run)
    const T0 = g.t, SYNC = TUNE.sync, sfx = X0.sfx;
    const note = (...a) => sfx.note && sfx.note(...a), chime = (...a) => sfx.chime && sfx.chime(...a);
    // the summoning: a low chime and a rising choir texture
    chime(196, 0.9); note(220, 2.2, 'sine', 0.07, 330, 0.05); note(277, 2.0, 'triangle', 0.04, 415, 0.25); note(330, 1.9, 'sine', 0.05, 494, 0.45); note(110, 2.4, 'sine', 0.12, 147, 0);
    me.castT = me.castM = 1.4; me.castUlt = true;   // (the caster's arms stay raised through the ritual)
    X0.banner('DAY OF THE DEAD', list.length > 1 ? `${list.length} spirits rise` : `${list[0].p.name} rises`, MARI2, 1.6);
    let synced = false, wiped = false, flareT = -9, bigR = 3, bcx = cx, bcy = cy;
    const dbg = { spirits, sync: null, log: RUN_LOG, T0 };
    const master = H.add({ key: 'dayofthedead', x: cx, y: cy, life: 1e6, dbg, entY: null,
      update(dt, f) {
        const t = f.t, now = g.t;
        // rising marigold petals spiralling round the caster
        if (t < SYNC + 0.8 && Math.random() < dt * (lowFx() ? 10 : 26)) { const an = Math.random() * TAU, r = 0.4 + Math.random() * CR * 0.8; H.P({ kind: 'petal', x: cx + Math.cos(an) * r, y: cy + Math.sin(an) * r * 0.6, vx: -Math.sin(an) * 1.6, vy: -1.4 - Math.random() * 1.6, life: 1.4, max: 1.4, size: 3 + Math.random() * 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, color: Math.random() < 0.7 ? MARI : MARI2, drag: 0.6 }); }
        if (t > 1.15 && !f.rose) { f.rose = true; sfx.hollow && sfx.hollow(260); for (const S of spirits) { H.X.text(S.x, S.y - 1.6, S.p.name, GOLD, 12, { life: 1.4, max: 1.4, vy: -0.4 }); } }
        // ---- the defining moment: every spirit's Ultimate on this one update ----
        if (!synced && t >= SYNC) { synced = true; flareT = t; dbg.sync = now;
          let sx = cx, sy = cy, n = 1; for (const S of spirits) { sx += S.x; sy += S.y; n++; } bcx = sx / n; bcy = sy / n; bigR = 2; for (const S of spirits) bigR = Math.max(bigR, Math.hypot(S.x - bcx, S.y - bcy) + 1.6); bigR = Math.max(bigR, Math.hypot(cx - bcx, cy - bcy) + 1.6);
          if (!calm()) X0.shake(6, 0.3); X0.flash(0.3, GOLD); LIM.L.sh = now; LIM.L.shM = 6; LIM.L.fl = now;   // one coordinated impulse; the spirits' own are capped after it
          chime(392, 1); note(98, 1.4, 'sine', 0.22, 65); note(587, 0.9, 'sine', 0.06, 0, 0.05); if (sfx.duck) sfx.duck(0.6, 1.2);
          LIM.thin = spirits.length >= 3 ? 0.4 : spirits.length === 2 ? 0.25 : 0;   // (overlapping Ultimates: fewer redundant decorative particles; shapes and hits unchanged)
          for (const S of spirits) { if (S.dead) continue; S.phase = 'combo'; S.queue = ['strong', 'strong2']; S.act = castSlot(H, S, 'ult'); }
        }
        if (synced && t - flareT > 4) LIM.thin = 0;
        for (const S of spirits) stepSpirit(S, dt, t, now);
        // a party wipe or the floor's end: everyone leaves at once
        if (!wiped && (g.over || (me.dead && (X0.party ? X0.party() : []).every(m => m.down)))) { wiped = true; for (const S of spirits) if (!S.dead) endSpirit(S, 'fracture', now); }
        if (synced && spirits.every(S => S.gone) && !f.ending) { f.ending = true; f.life = 0.8; f.endAt = t; }
      },
      onEnd() { for (const S of spirits) { if (!S.dead) cancelAll(S); S.gone = true; act.delete(S.m.p); } },
      drawUnder(c, f, x, y, T, t) {
        const u = f.t, X = H.sx(cx), Y = H.sy(cy), out = f.ending ? cl(f.life / 0.8) : 1;
        // the great circle: unfolds (petals open from the centre), turns, fades after the release
        const open = sstep(0, 0.8, u), fadeC = (1 - sstep(SYNC + 1.2, SYNC + 2.4, u)) * out, R = CR * T * (0.35 + 0.65 * open) * (1 + 0.04 * Math.sin(u * 2));
        const B = bake();
        if (fadeC > 0.01) {
          c.save(); c.globalCompositeOperation = 'lighter'; blit(c, glowSprite(ENERGY), X, Y, R * 1.15, 0.22 * fadeC); c.restore();
          floorImg(c, B.A, X, Y, R, u * 0.12, 0.9 * fadeC * open);
          floorImg(c, B.B, X, Y, R * (0.9 + 0.1 * open), -u * 0.22, 0.85 * fadeC * sstep(0.2, 0.9, u), true);
          if (tier >= 2) floorImg(c, B.B, X, Y, R * 0.62, u * 0.35, 0.45 * fadeC * sstep(0.4, 1.0, u), true);
          floorImg(c, B.C, X, Y, R * 0.9, -u * 0.18, 0.85 * fadeC * sstep(0.3, 1.0, u));
          // candles round the rim, lit one after another
          for (let i = 0; i < NC; i++) { const an = i / NC * TAU + 0.2, px = X + Math.cos(an) * R * 1.02, py = Y + Math.sin(an) * R * 1.02 * 0.55; if (Math.sin(an) > 0.15) continue; candle(c, px, py, T, sstep(0.25 + i / NC * 0.7, 0.35 + i / NC * 0.7, u), t, i, fadeC * open); }
        }
        // the giant spectral marigold under the formation at the release
        if (flareT > 0) { const v = u - flareT, k = sstep(0, 0.35, v) * (1 - sstep(1.0, 2.0, v)) * out; if (k > 0.01) { const BX = H.sx(bcx), BY = H.sy(bcy), RR = bigR * T * (0.55 + 0.45 * sstep(0, 0.6, v));
          c.save(); c.globalCompositeOperation = 'lighter'; blit(c, glowSprite(MARI), BX, BY, RR * 1.1, 0.25 * k); c.restore();
          floorImg(c, B.A, BX, BY, RR, v * 0.3, 0.75 * k, true); floorImg(c, B.C, BX, BY, RR * 0.85, -v * 0.4, 0.7 * k, true); floorImg(c, B.B, BX, BY, RR * 1.05, v * 0.2, 0.5 * k, true); } }
      },
      draw(c, f, x, y, T, t) {
        const u = f.t, X = H.sx(cx), Y = H.sy(cy), out = f.ending ? cl(f.life / 0.8) : 1, open = sstep(0, 0.8, u), fadeC = (1 - sstep(SYNC + 1.2, SYNC + 2.4, u)) * out, R = CR * T * (0.35 + 0.65 * open);
        // the near candles (in front of the caster)
        if (fadeC > 0.01) for (let i = 0; i < NC; i++) { const an = i / NC * TAU + 0.2; if (Math.sin(an) <= 0.15) continue; const px = X + Math.cos(an) * R * 1.02, py = Y + Math.sin(an) * R * 1.02 * 0.55; candle(c, px, py, T, sstep(0.25 + i / NC * 0.7, 0.35 + i / NC * 0.7, u), t, i, fadeC * open); }
        // warm light waves to every revival point, then the golden threads
        const CXs = H.sx(me.x), CYs = H.sy(me.y) - T * 0.15;
        for (const S of spirits) { const SX = H.sx(S.x0), SY = H.sy(S.y0);
          const w = sstep(0.65, 1.25, u); if (w > 0 && w < 1) { const mx = (X + SX) / 2, my = (Y + SY) / 2 - Math.hypot(SX - X, SY - Y) * 0.25, q = w, a = 1 - q; const hx = a * a * X + 2 * a * q * mx + q * q * SX, hy = a * a * Y + 2 * a * q * my + q * q * SY;
            c.save(); c.globalCompositeOperation = 'lighter'; blit(c, glowSprite(MARI2), hx, hy, T * 0.9, 0.7); blit(c, glowSprite('#FFF1C8'), hx, hy, T * 0.3, 0.9); c.restore(); }
          if (S.gone) continue;
          const live = S.phase === 'depart' || S.phase === 'fracture' ? 1 - cl((g.t - S.endT) / 0.5) : 1, flare = flareT > 0 ? Math.max(0, 1 - (u - flareT) / 0.9) : 0;
          thread(c, CXs, CYs, H.sx(S.x), H.sy(S.y) - T * 0.15, sstep(1.4, 2.1, u), (0.35 + 0.65 * Math.max(flare, 1 - sstep(SYNC + 0.6, SYNC + 2.2, u))) * live * out, t, S.seed, flare); }
      },
    });
    /* one effect per spirit: its body among the actors (depth-sorted), its seal and pillar, its own runner's effects */
    for (const S of spirits) {
      H.add({ key: 'dotdSpirit', S, life: 1e6, entY: S.y,
        update(dt, f) { f.entY = S.y + 0.01; f.x = S.x; f.y = S.y; if (S.gone) f.life = 0; },
        drawUnder(c, f, x, y, T, t) { const u = master.t, X = H.sx(S.x0), Y = H.sy(S.y0), B = bake();
          const k = sstep(1.15, 1.45, u) * (1 - sstep(SYNC + 0.6, SYNC + 1.6, u)); if (k > 0.01) { floorImg(c, B.A, X, Y, T * 1.05 * (0.4 + 0.6 * k), u * 0.5, 0.85 * k); floorImg(c, B.B, X, Y, T * 1.1, -u * 0.8, 0.8 * k, true); }
          if (!S.gone && S.phase !== 'rise') { c.save(); c.globalCompositeOperation = 'lighter'; blit(c, glowSprite(ENERGY), H.sx(S.x), H.sy(S.y), T * 0.8, 0.22 * (S.dead ? 0.4 : 1)); c.restore(); }
          S.E.draw(c, true); },
        drawEnt(c, f) { const T = H.X.Tz(), t = g.t, vis = spiritVis(S, master.t); if (vis.a > 0.01) drawBody(H, S, c, T, t, vis); for (const q of S.E.fx) if (q.drawEnt) { c.save(); q.drawEnt(c, q); c.restore(); } },
        draw(c, f, x, y, T, t) { const u = master.t;
          pillar(c, H.sx(S.x0), H.sy(S.y0), T, sstep(1.2, 1.4, u) * (1 - 0.55 * sstep(1.55, 1.9, u)) * (1 - sstep(SYNC - 0.25, SYNC + 0.35, u)), t, S.seed);
          S.E.draw(c);
          if (S.phase === 'depart') { const v = g.t - S.endT; goldFlame(c, H.sx(S.x), H.sy(S.y) - T * (0.6 + v * 2.4), T, sstep(0, 0.25, v) * (1 - sstep(TUNE.depart - 0.4, TUNE.depart, v)), t); }
          if (!S.dead && S.phase !== 'rise') hpBar(c, S, T, t); },
        drawHud(c) { S.E.draw(c, 'hud'); },
      });
    }
    /* ---- each spirit, every update ---- */
    function endSpirit(S, how, now) { if (S.phase === 'depart' || S.phase === 'fracture' || S.gone) return; const rec = { who: S.p.name, i: S.i, slot: how, t: now, ok: true, hp: Math.round(S.hp) }; S.log.push(rec); RUN_LOG.push(rec);
      cancelAll(S); S.phase = how; S.endT = now; S.face = me.x >= S.x ? 1 : -1;
      if (how === 'depart') { chime(1318, 0.5); chime(1760, 0.32); sfx.hiss && sfx.hiss(0.6, 0.04, 3400, 0.1); for (let q = 0; q < H.n(14); q++) H.P({ kind: 'petal', x: S.x + (Math.random() - 0.5) * 0.6, y: S.y - Math.random() * 0.8, vx: (Math.random() - 0.5) * 2, vy: -1.2 - Math.random() * 1.5, life: 1.6, max: 1.6, size: 3 + Math.random() * 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 6, color: Math.random() < 0.6 ? MARI : MARI2, drag: 0.8 }); }
      else { sfx.crack && sfx.crack(); note(147, 0.5, 'sine', 0.12, 98); } }
    function stepSpirit(S, dt, t, now) {
      if (S.gone) return;
      if (S.phase === 'depart' || S.phase === 'fracture') {
        const v = now - S.endT, D = S.phase === 'depart' ? TUNE.depart : TUNE.fracture;
        if (S.phase === 'depart' && Math.random() < dt * 20 * (lowFx() ? 0.4 : 1)) H.P({ kind: 'petal', x: S.x + (Math.random() - 0.5) * 0.7, y: S.y - Math.random() * 0.9, vx: (Math.random() - 0.5) * 1.5, vy: -1 - Math.random(), life: 1.3, max: 1.3, size: 3 + Math.random() * 2, rot: Math.random() * TAU, vr: 6, color: MARI, drag: 0.8 });
        if (S.phase === 'fracture' && v > D * 0.55 && !S.shat) { S.shat = true; for (let q = 0; q < H.n(16); q++) { const a = Math.random() * TAU, sp = 2 + Math.random() * 4; H.P({ kind: 'shard', x: S.x, y: S.y - S.oy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 2, life: 0.6, max: 0.6, size: 4 + Math.random() * 3, rot: a, vr: 6, color: Math.random() < 0.5 ? EDGE : ACC, drag: 2, g: 6 }); } for (let q = 0; q < H.n(8); q++) H.P({ kind: 'petal', x: S.x, y: S.y - S.oy, vx: (Math.random() - 0.5) * 3, vy: -1.5 - Math.random() * 1.5, life: 1, max: 1, size: 3, rot: 0, vr: 7, color: MARI, drag: 1 }); }
        if (v >= D) { S.gone = true; act.delete(S.m.p); }
        return;
      }
      S.E.update(dt);
      if (S.inv > 0) S.inv -= dt; if (S.castT > 0) S.castT -= dt; S.sq = Math.max(0, S.sq - dt * 4); S.hurtT += dt;
      // its own movement as the dungeon moves the pet (a dash, a push, a leap laid on by a move)
      S.moving = false;
      if (S.push) { const P = S.push; P.t -= dt; X0.moveEnt(S, P.vx * dt, P.vy * dt, 0); if (P.t <= 0) S.push = null; }
      else if (S.dash) { const D = S.dash; D.t -= dt; X0.moveEnt(S, D.vx * dt, D.vy * dt, 0); for (const m of H.living()) if (!D.hit.has(m) && Math.hypot(m.x - S.x, m.y - S.y) < m.r + 0.7) { D.hit.add(m); X0.hitMon(m, D.dmg, { el: D.el, src: 'strong', kb: 5 }); } if (D.t <= 0) { S.dash = null; if (D.land) X0.hitArea(S.x, S.y, 2, D.land, { el: D.el, src: 'strong', kb: 3 }); } }
      else if (S.leap) { const L = S.leap; L.t -= dt; S.z = Math.sin((1 - L.t / L.max) * Math.PI) * 1.4; if (L.t <= 0) { S.leap = null; S.z = 0; X0.hitArea(S.x, S.y, L.r, L.dmg, { el: L.el, src: 'strong', stun: 0.6, kb: 4 }); } }
      if (S.phase === 'rise') return;
      // hits it takes: enemy shots crossing it, monsters in contact
      for (const b of X0.eshots) { if (!(b.life > 0) || b.hurtsMons || b.mine) continue; if (Math.hypot(b.x - S.x, b.y - (S.y - S.oy * 0.5)) < S.r + (b.r || 0.15)) { if (hurtSpirit(H, S, b.dmg || 0, null) && !b.keep) b.life = 0; } }
      for (const m of H.living()) { if (m.still || m.z > 0.3 || m.hop || !(m.dmg > 0)) continue; const d = Math.hypot(m.x - S.x, m.y - S.y); if (d < m.r + S.r + TUNE.contactR && (S.cdm.get(m) || 0) <= now) { S.cdm.set(m, now + TUNE.contactCd); hurtSpirit(H, S, m.dmg, m); } }
      if (S.hp <= 0) { S.hp = 0; endSpirit(S, 'fracture', now); return; }
      if (S.phase === 'combo') {
        // the next granted activation once the last one's effects have finished (each spirit on its own)
        let guard = 0; while (actDone(H, S) && guard++ < 3) { if (!S.queue.length) { S.act = null; S.phase = 'fight'; S.fightT = now; const rec = { who: S.p.name, i: S.i, slot: 'fight', t: now, ok: true }; S.log.push(rec); RUN_LOG.push(rec); break; } S.act = castSlot(H, S, S.queue.shift()); }
      } else if (S.phase === 'fight') {
        if (now - S.fightT >= S.dur) { endSpirit(S, 'depart', now); return; }
        fight(S, dt, now);
      }
      // drifting petals: more as its time runs down
      const left = S.phase === 'fight' ? cl(1 - (now - S.fightT) / S.dur) : 1;
      S.petT -= dt * (1 + 3 * (1 - left)) * (lowFx() ? 0.4 : 1);
      if (S.petT <= 0) { S.petT = 0.35; H.P({ kind: 'petal', x: S.x + (Math.random() - 0.5) * 0.6, y: S.y - Math.random() * 0.9 * S.size, vx: (Math.random() - 0.5) * 0.8, vy: -0.6 - Math.random() * 0.8, life: 1.3, max: 1.3, size: 2.5 + Math.random() * 2, rot: Math.random() * TAU, vr: 5, color: Math.random() < 0.6 ? MARI : MARI2, drag: 0.6 }); }
    }
    /* free fighting: the nearest monster near it (or near the caster), its normal attack, the leash to the caster */
    function fight(S, dt, now) {
      const busy = S.push || S.dash || S.leap;
      let tg = X0.nearestMon(S.x, S.y, 7, null, true) || X0.nearestMon(me.x, me.y, 7, null, false);
      const dm = Math.hypot(me.x - S.x, me.y - S.y);
      if (!busy) {
        let gx = null, gy = null, spd = TUNE.spd;
        if (dm > TUNE.leash) { gx = me.x; gy = me.y; spd *= 1.6; tg = null; }
        else if (tg) { const d = Math.hypot(tg.x - S.x, tg.y - S.y), want = tg.r + S.r + 0.9; if (d > want + 0.25) { gx = tg.x; gy = tg.y; } }
        else if (dm > 2.4) { gx = me.x + Math.cos(S.i * 2.1) * 1.4; gy = me.y + Math.sin(S.i * 2.1) * 1.0; }
        if (gx != null) { const dx = gx - S.x, dy = gy - S.y, d = Math.hypot(dx, dy) || 1; X0.moveEnt(S, dx / d * spd * dt, dy / d * spd * dt, 0); S.moving = true; S.bob += dt * 10; S.face = dx >= 0 ? 1 : -1; }
      }
      S.atkT -= dt;
      if (tg && S.atkT <= 0 && !busy && Math.hypot(tg.x - S.x, tg.y - S.y) < TUNE.reach + tg.r) {
        S.atkT = TUNE.normalIv; const N = S.kit.normal || {}, a = Math.atan2(tg.y - S.y, tg.x - S.x), base = S.ST.atk * (N.mult || 1), dmg = base * TUNE.normalK, el = N.el || 'shadow', E = ELEMENTS[el] || ELEMENTS.dark;
        S.face = Math.cos(a) >= 0 ? 1 : -1; S.sq = Math.max(S.sq, 0.35);
        X0.shot({ x: S.x, y: S.y - S.oy, vx: Math.cos(a) * 10, vy: Math.sin(a) * 10, dmg, r: 0.15, home: 6, style: 'orb', el, life: 1.4, src: 'summon', color: E.color });
        if (S.hooks.length) for (const fn of S.hooks.slice()) { try { fn({ dmg, el, key: N.key || 'spirit', A: { t: tg, a, x: Math.cos(a), y: Math.sin(a) } }); } catch (e) { /* (a listener's error stays its own) */ } }
        S.hits++;
      }
    }
    function spiritVis(S, u) {
      const now = g.t, left = S.phase === 'fight' ? cl(1 - (now - S.fightT) / S.dur) : 1;
      const vis = { a: 1, reveal: sstep(1.45, 2.15, u), cut: 0, glow: 0.45 + 0.55 * left, mark: 0.75 + 0.25 * Math.sin(now * 3 + S.seed), crack: 0, face: 'normal' };
      if (S.phase === 'depart') { const v = now - S.endT; vis.cut = sstep(0.35, TUNE.depart, v); vis.a = 1 - sstep(TUNE.depart * 0.7, TUNE.depart, v); vis.face = 'happy'; }
      if (S.phase === 'fracture') { const v = now - S.endT; vis.crack = sstep(0, TUNE.fracture * 0.5, v); vis.a = 1 - sstep(TUNE.fracture * 0.5, TUNE.fracture, v); vis.face = 'hurt'; }
      if (S.hurtT < 0.3) vis.face = 'hurt';
      return vis;
    }
    function hpBar(c, S, T, t) {
      const X = H.sx(S.x), Y = H.sy(S.y) - T * 1.02 * S.size * 1.3 - (S.z || 0) * T - 4, w = Math.max(26, T * 0.85), hh = 4;
      c.save(); c.globalAlpha = 0.95;
      c.fillStyle = 'rgba(8,5,15,.72)'; GFX.rr(c, X - w / 2 - 1.5, Y - 1.5, w + 3, hh + 3, 3); c.fill();
      const k = cl(S.hp / S.hpMax), gr = c.createLinearGradient(X - w / 2, 0, X + w / 2, 0); gr.addColorStop(0, k < 0.3 ? '#C24DFF' : DEEP); gr.addColorStop(1, k < 0.3 ? '#E9B6FF' : GOLD);
      c.fillStyle = gr; GFX.rr(c, X - w / 2, Y, Math.max(2, w * k), hh, 2); c.fill();
      c.strokeStyle = rgba(EDGE, 0.7); c.lineWidth = 1; GFX.rr(c, X - w / 2 - 1.5, Y - 1.5, w + 3, hh + 3, 3); c.stroke();
      // the discreet countdown: a small ring that empties, with the seconds left
      if (S.phase === 'fight') { const left = Math.max(0, S.dur - (g.t - S.fightT)), cxr = X + w / 2 + 9, cyr = Y + hh / 2;
        c.strokeStyle = 'rgba(8,5,15,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(cxr, cyr, 5.5, 0, TAU); c.stroke();
        c.strokeStyle = left < 3 ? ACC : GOLD; c.lineWidth = 1.8; c.beginPath(); c.arc(cxr, cyr, 5.5, -Math.PI / 2, -Math.PI / 2 + TAU * (left / S.dur)); c.stroke();
        c.fillStyle = '#FFF1C8'; c.font = `800 7px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(Math.ceil(left)), cxr, cyr + 0.5); }
      c.restore();
    }
  };
  /* nobody down (or every fallen one already up as a spirit): the cast is refused, nothing spent */
  U.dayofthedead.refuse = H => (eligible(H).length ? '' : 'No fallen teammates');
  U.dayofthedead.TUNE = TUNE; U.dayofthedead.LOG = RUN_LOG;
})();
