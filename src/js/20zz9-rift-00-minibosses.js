/* ---------- v390 M: Rift 0's dungeon guardians: a corrupted Cocopet at each gate, a leader in every pack ----------
   The user: "Each dungeon section in blackfire caldera will have a mini boss (the evil coco pets near the gate guarding it,
   also each mob of monsters will have one really strong leader that's about half the strength of the mini boss and hp)".

   THE MINI BOSSES. Each of the three dungeons (stages 0, 3, 6) ends at its gate, and a Cocopet the black fire has got into
   guards it: the Rift-touched model (RiftEvil.form(seed), 20m3: one of the game's own pets grown a few stages and soured;
   its species named by speciesName), hinted toward its dungeon's element: a coat tinted ember-ash / slate / obsidian, the
   element's parts and accent, a black-fire aura licking up round it, cracks of molten light across its body, red eyes.
   It is drawn on the GPU by the pet renderer in 2.5D (PetGL; RiftEvil.draw's 2D sprite only without WebGL), about four
   times a pet's height (r 1.12-1.2; the user: first ~1.9x, then "2x bigger"); its lanes, rings and reach scale with m.r.
   Numbers (absolute; tuned for the arrival levels): Emberfang 4600 hp / 8 dmg (lvl 1-3), Rimehowl 5600 / 13 (lvl 6-8),
   Vitriax 7200 / 17 (lvl 9-11) (blows trimmed for the doubled body's reach). It stands by the gate, breathing, its fire swelling now and then, until the pet comes within about nine
   tiles; then it wakes and fights. Its moves, all shown before they land:
     every one   a lunge along a shown lane (and from its second phase a clawing swipe after it, along a shown cone)
     Emberfang   (the Cinder Galleries, fire)    Ember Volley: waves of fireballs along shown cones
                                                 Cinder Pounce (signature): a crouch, a leap, a marked landing that bursts
     Rimehowl    (the Rimebound Forge, frost)    Rime Fan: waves of ice shards that chill, along shown cones
                                                 Glacial Howl (signature): a marked ring round it, then a frost nova
     Vitriax     (the Glass Heart, crystal/dark)  Prism Ray: a beam along a shown lane (three, fanned, from phase two)
                                                 Shatter Rain (signature): marked circles round the pet, then falling glass
   The gate is sealed with black fire ("Defeat <name> to open the gate") until it falls, on top of the floor's own rule
   (every monster). It falls slowly: its cracks blaze, the corruption burns off it into light, and its shell shatters
   (BREAK_FX, black fire) with the seal on the gate. The reward is the lesser boss's own (a few orbs, its experience).
   If the pet runs far off (16 tiles from the gate) it walks back to its post along the way it came, wounds and all.

   THE PACK LEADERS. Every pack of the brood (the floor's own packs and the extra ones, 20zz5 morePacks) has exactly one
   leader: one of its members, never a bomb larva, grown half again in size, with half the mini boss's health and half its
   blows; a glow ring under it, a crown of black iron with an ember gem over it, a "PACK LEADER" tag and a health bar.
   After the floor is cleared the rift's tears (20zz5) bring a leader with every other pour of each tear.

   THE CHAMPION (20zz5's champion(), a big named brood in the far room): replaced by the mini boss, who stands in that same
   far room by the gate. C.champ is the mini boss now (so older probes that look for "the far room's guardian" still work).

   Hooks: 20zz5 dungeonExtra calls CAL.guardians(X, self, H, key, C) (in place of the champion) and tearTick calls
   CAL.tearLeader; riftFight (20m) makes the mini boss from S.mini (set below) and keeps the door shut until it is dead.
   Tests: tests/_cal-m-bosses.js (rules, tuning, a bot fight), tests/_cal-m-shots.js (pictures, the sheet).
   State: C.guard = { m, def, leaders, home, exit, fall } (C = X.rift.self.amb.C).

   GPU (the user, v390: "build all this on gpu"): its body is drawn by PetGL (02h: the pet's own 2.5D layers, its turn,
   arms, wing beat and tail swing) and the corruption by Nidhogg's painter (FGFX via CAL.gpu): the black-fire aura, the
   cracks' light, the red eyes, a tell's charge and ring, a lunge's streak, the prism rays, the fall, the leaders' rings,
   auras and gems. Where the GPU cannot run (no WebGL, its layers not made yet) it is drawn as the game already draws the
   Rift-touched (RiftEvil.draw, 2D sprites) with the engine's plain effects (its rays: the engine's beamFx; the leaders: the
   dark ring, crown, tag and bar): no separate simplified 2D copy (the user, v390). window.__calMini2D = 1 forces that.

   ======================= THE API (EVIL_MINI, = CAL_MINI), for other rifts (the Belfry) =======================
   EVIL_MINI.spawn(X, o) -> m          a corrupted Cocopet mini boss, as a lesser boss of the stage (X: the rift stage's X,
                                       the one DunRift gives a stage's make(); it has lesserBoss). It waits (asleep) until
                                       the pet comes within o.wakeR (9.5) tiles in sight, then fights; past o.leash (16)
                                       tiles from its post it walks home. o:
       x, y              where it is made;  home: { x, y } its post (default where it is made)
       gate: { x, y }    a gate it guards: sealed with black fire and "Defeat <short> to open the gate" until it falls
                         (the caller keeps its own exit shut until m.dead)
       seed | form       the Rift-touched model: RiftEvil.form(seed), or a form of your own
       el                'fire' | 'frost' | 'crystal' | 'water' | 'dark': its colours, volley, ranged move, signature
                         (PRESET below; water: a tidal roar ring and water bolts; dark: umbral rays and a falling rain)
       palette           { tint, tintK, pal: { sec, cheek, ... }, col, glow, core } (e.g. a sea or abyss coat)
       hint              { tail, arms, ears, horns, wings, fur, armor } parts nudged toward the element
       name, short, sub  its plate's name, the short name the gate uses, its wake banner's line
       lvl | hp, dmg     its numbers: EVIL_MINI.hpFor(lvl) / dmgFor(lvl) (a 45-75 s fight at that level), or given;
                         hpK, dmgK multiply them;  moves: overrides for the preset (volley, sig, sigName, shot, cry)
       onFall(m, G)      called as it falls (the fall itself plays: the corruption burns off, its shell shatters)
   EVIL_MINI.layer(X) -> { update(dt), drawGround(c), drawOver(c) }   call once per stage and run it from the stage's
                         module: it drives every guardian and leader of this run (wake, seal, plate, rays, fall, marks)
   EVIL_MINI.leader(X, q, { hpOf, dmgOf } | { of } | { hp, dmg }) -> q   a monster made a pack leader: half the given
                         guardian's health and blows (or the numbers given), half again in size, a glow ring, a crown,
                         a "PACK LEADER" tag and a bar (drawn by the layer)
   EVIL_MINI.packLeaders(X, mini, ok) -> [leaders]   one leader to every pack (m.pack) on the field or held back; ok(q)
                         filters which monsters count
   EVIL_MINI.guards(X), leaders(X): this run's records;  EVIL_MINI.PRESET, DEF (the caldera's three) */
const CAL_MINI = (() => {
  const TAU = Math.PI * 2, LAVA = '#FF6A1F', LAVA_HI = '#FFC24A', FRACTURE = '#FF5A2A', FRACTURE_HI = '#FFB070', INK = '#2B2433';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u;
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const snd = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };

  /* ======================= the three guardians =======================
     hp and dmg are absolute: tuned to the level a pet usually arrives at (dungeon 1 about level 1-3, dungeon 2 about 6-8,
     dungeon 3 about 9-11) for a 45-75 s fight with skills. dmg is its base blow (its touch); its moves hit at multiples:
     lunge 1.5x, swipe 1x, volley shots 0.75x, signature 2x (Cinder Pounce, Glacial Howl) / 1.5x a circle (Shatter Rain) */
  const DEF = {
    ashen: { id: 'calmini_ashen', name: 'Emberfang the Ashbound', short: 'Emberfang', el: 'fire', hp: 4600, dmg: 8, spd: 2.1, r: 1.12,
      col: '#FF6A1F', core: '#FFE2A8', glow: '#FF5A1F', volley: 'fire', sig: 'pounce', sigName: 'CINDER POUNCE', cry: ['Grrr...', 'Burn.', 'Mine.'],
      seed: 62, hint: { tail: 'flame', arms: 'flame', wings: 'flame' }, tint: '#4A2A22',
      pal: { sec: '#FF5A1F', cheek: '#5A1E10' } },
    rimeforge: { id: 'calmini_rime', name: 'Rimehowl the Frostbitten', short: 'Rimehowl', el: 'frost', hp: 5600, dmg: 13, spd: 2.25, r: 1.16,
      col: '#9FDFFF', core: '#FFFFFF', glow: '#7FC8F2', volley: 'ice', sig: 'howl', sigName: 'GLACIAL HOWL', cry: ['Hrrrn...', 'Freeze.', 'Still.'],
      seed: 103, hint: { tail: 'crystal', wings: 'crystal', horns: 'ram', fur: 'shaggy' }, tint: '#2C3C52', tintK: 0.8,
      pal: { sec: '#A8E4FF', cheek: '#203A52' } },
    glassheart: { id: 'calmini_glass', name: 'Vitriax the Glass Tyrant', short: 'Vitriax', el: 'crystal', hp: 7200, dmg: 17, spd: 2.35, r: 1.2,
      col: '#B784FF', core: '#F4E8FF', glow: '#9A5CFF', volley: 'beam', sig: 'rain', sigName: 'SHATTER RAIN', cry: ['Kneel.', 'Shatter.', 'Glass...'],
      seed: 65, hint: { tail: 'crystal', arms: 'crystal', horns: 'crystal', wings: 'crystal', armor: true }, tint: '#2E1F42', tintK: 0.85,
      pal: { sec: '#B784FF', cheek: '#3A1A4A' } },
  };
  const BY_ID = {}; for (const k in DEF) { DEF[k].key = k; BY_ID[DEF[k].id] = DEF[k]; }
  const RED_EYE = '#FF2A2A';
  /* the elements a guardian may carry (EVIL_MINI.spawn's el): its colours, its volley's shots, its ranged move and its
     signature. fire / frost / crystal are the caldera's; water and dark are there for other rifts (the Belfry) */
  const PRESET = {
    fire:    { col: '#FF6A1F', core: '#FFE2A8', glow: '#FF5A1F', volley: 'fire', sig: 'pounce', sigName: 'CINDER POUNCE', cry: ['Grrr...', 'Burn.', 'Mine.'], shot: { col: '#FF6A1F', core: '#FFC24A', style: 'orb', n: 5, gap: 0.19, spd: 6.2, r: 0.22 }, tint: '#4A2A22', pal: { sec: '#FF5A1F', cheek: '#5A1E10' }, hint: { tail: 'flame', arms: 'flame', wings: 'flame' } },
    frost:   { col: '#9FDFFF', core: '#FFFFFF', glow: '#7FC8F2', volley: 'ice', sig: 'howl', sigName: 'GLACIAL HOWL', cry: ['Hrrrn...', 'Freeze.', 'Still.'], shot: { col: '#BFE3FA', core: '#FFFFFF', style: 'arrow', n: 7, gap: 0.12, spd: 7.2, r: 0.17, chill: 1.2 }, tint: '#2C3C52', tintK: 0.8, pal: { sec: '#A8E4FF', cheek: '#203A52' }, hint: { tail: 'crystal', wings: 'crystal', horns: 'ram', fur: 'shaggy' } },
    crystal: { col: '#B784FF', core: '#F4E8FF', glow: '#9A5CFF', volley: 'beam', sig: 'rain', sigName: 'SHATTER RAIN', cry: ['Kneel.', 'Shatter.', 'Glass...'], shot: { col: '#B784FF', core: '#FFFFFF', style: 'orb', n: 5, gap: 0.2, spd: 6.5, r: 0.2 }, tint: '#2E1F42', tintK: 0.85, pal: { sec: '#B784FF', cheek: '#3A1A4A' }, hint: { tail: 'crystal', arms: 'crystal', horns: 'crystal', wings: 'crystal', armor: true } },
    water:   { col: '#4FC8F0', core: '#E8FBFF', glow: '#3AA8E0', volley: 'ice', sig: 'howl', sigName: 'TIDAL ROAR', cry: ['Drown.', 'Sink.', 'Deep...'], shot: { col: '#5FD0FF', core: '#E8FBFF', style: 'orb', n: 6, gap: 0.16, spd: 6.6, r: 0.2 }, tint: '#1E3448', tintK: 0.8, pal: { sec: '#5FD0FF', cheek: '#1A3A52' }, hint: { tail: 'fish', ears: 'fin', wings: 'bat' } },
    dark:    { col: '#9A5CFF', core: '#EBDDFF', glow: '#7A3AE0', volley: 'beam', sig: 'rain', sigName: 'UMBRAL RAIN', cry: ['Fade.', 'Dark...', 'Kneel.'], shot: { col: '#9A5CFF', core: '#EBDDFF', style: 'orb', n: 5, gap: 0.2, spd: 6.4, r: 0.2 }, tint: '#1E1428', tintK: 0.85, pal: { sec: '#9A5CFF', cheek: '#2A1440' }, hint: { tail: 'spade', horns: 'devil', wings: 'bat' } },
  };
  for (const k in DEF) DEF[k] = Object.assign({}, PRESET[DEF[k].el], DEF[k]);
  /* health and blows for a level, from the caldera's tuning (4600 / 8 at level 2, 5600 / 13 at 7, 7200 / 17 at 10: a 45-75 s
     fight there), carried on in a straight line past it */
  const lerpTab = (tab, lv) => { for (let i = 0; i < tab.length - 1; i++) { const [l0, v0] = tab[i], [l1, v1] = tab[i + 1]; if (lv <= l1 || i === tab.length - 2) return v0 + (v1 - v0) * (lv - l0) / (l1 - l0); } return tab[0][1]; };
  const hpFor = lv => Math.max(800, Math.round(lerpTab([[2, 4600], [7, 5600], [10, 7200]], lv || 2))), dmgFor = lv => Math.max(5, +lerpTab([[2, 8], [7, 13], [10, 17]], lv || 2).toFixed(1));
  let specN = 0;
  function specOf(o) { const P0 = PRESET[o.el] || PRESET.dark, nm = o.name || 'A Corrupted Cocopet';
    return Object.assign({}, P0, { id: 'evilmini', key: 'spawn' + (++specN) + ':' + (o.seed || 0), name: nm, short: o.short || nm.split(' ')[0], el: o.el || 'dark', seed: o.seed || 1, form: o.form || null,
      hp: Math.round((o.hp || hpFor(o.lvl)) * (o.hpK || 1)), dmg: (o.dmg || dmgFor(o.lvl)) * (o.dmgK || 1), spd: o.spd || 2.25, r: o.r || 1.16 },
      o.palette ? { tint: o.palette.tint || P0.tint, tintK: o.palette.tintK || P0.tintK, pal: Object.assign({}, P0.pal, o.palette.pal || {}), col: o.palette.col || P0.col, glow: o.palette.glow || P0.glow, core: o.palette.core || P0.core } : {},
      o.hint ? { hint: o.hint } : {}, o.moves || {}); }
  // (the engine's boss records: rift-only, so the Tower never rolls them; their numbers are set on the spot below)
  if (!BOSSES.find(b => b.id === 'evilmini')) BOSSES.push({ id: 'evilmini', rift: true, name: 'Corrupted Cocopet', title: 'A corrupted Cocopet', hp: 4000, dmg: 14, r: 1.16, spd: 2.25, color: '#2A2234', glow: '#9A5CFF', biome: 'ashen', el: 'dark' });
  if (typeof BOSS_BY_ID !== 'undefined') BOSS_BY_ID.evilmini = BOSSES.find(b => b.id === 'evilmini');
  for (const k in DEF) { const d = DEF[k]; if (!BOSSES.find(b => b.id === d.id)) BOSSES.push({ id: d.id, rift: true, name: d.name, title: 'A corrupted Cocopet', hp: d.hp, dmg: d.dmg, r: d.r, spd: d.spd, color: d.tint, glow: d.glow, biome: 'ashen', el: d.el }); if (typeof BOSS_BY_ID !== 'undefined') BOSS_BY_ID[d.id] = BOSSES.find(b => b.id === d.id); }

  /* ======================= the corrupted form: the Rift-touched model (RiftEvil, 20m3), hinted toward its element =======================
     RiftEvil.form(seed) grows a pet from a seed and sours it (dark coat, a sickly accent, fangs, horns, bat wings); this
     wrapper picks a seed per dungeon and nudges it: the element's parts (flame tail and fists; a crystal tail and wings;
     crystal horns and armour), its coat tinted toward the dungeon (ember-ash, slate, obsidian-violet), the element's
     accent, red eyes. 20m3 is not touched. Its species is the game's own name for the form (speciesName) */
  const FORMS = {}, LOOKS = {};
  function buildForm(d) {
    const R0 = d.form ? { form: d.form } : RiftEvil.form(d.seed), f = JSON.parse(JSON.stringify(R0.form)), h = d.hint || {}, X = f.x || (f.x = {});
    if (h.tail) f.tail = Object.assign({}, f.tail, { t: h.tail }); if (h.arms) f.arms = Object.assign({}, f.arms, { t: h.arms }); if (h.ears) f.ears = Object.assign({}, f.ears, { t: h.ears }); if (h.fur) f.body.fur = h.fur;
    if (h.horns) X.horns = Object.assign({ size: 1.1 }, X.horns, { t: h.horns }); if (h.wings) X.wings = Object.assign({ size: 1, n: 1 }, X.wings, { t: h.wings }); if (h.armor) X.armor = true;
    const p = f.pal, mx = (a, b, u) => (typeof a === 'string' && a[0] === '#' ? mixHex(a, b, u) : a);
    f.pal = Object.assign({}, p, { base: mx(p.base, d.tint, d.tintK || 0.55), dk: mx(p.dk, d.tint, (d.tintK || 0.55) * 0.7), lt: mx(p.lt, d.tint, (d.tintK || 0.55) * 0.75), belly: mx(p.belly, d.tint, (d.tintK || 0.55) * 0.6), inner: mx(p.inner, d.tint, 0.4) }, d.pal, { iris: RED_EYE });
    f.eyes = Object.assign({}, f.eyes, { iris2: RED_EYE });
    return { form: f, species: speciesName(f) };
  }
  // v398 M: one look, one record: the same seed, hints and coat (a Belfry duel's pair, a guardian met again) share its form, its
  // pictures and its GPU layers, which are made once; and the form carries its own GPU key (__glk), so PetGL finds its layers
  // without writing the whole form out as text every frame (it did: JSON.stringify per draw)
  const lookKey = d => JSON.stringify([d.seed, d.form ? 'f' + (d.form.seed || 0) : 0, d.hint || 0, d.tint || 0, d.tintK || 0, d.pal || 0]);
  function evilOf(d) {
    if (FORMS[d.key]) return FORMS[d.key];
    const lk = lookKey(d); if (LOOKS[lk]) return (FORMS[d.key] = LOOKS[lk]);
    const B = buildForm(d), E = { form: B.form, species: B.species, acc: d.glow, name: d.name, sprites: null, ready: false, cracks: cracksFor(d.seed), bodyTop: (B.form.legs.len || 0) + 9 + B.form.body.h };
    try { Object.defineProperty(E.form, '__glk', { value: 'evilmini|' + lk, enumerable: false, configurable: true }); } catch (e) {}
    try { loadSprites(E.form, { brows: 'angry' }).then(sp => { E.sprites = sp; return makeRig(E.form, { brows: 'angry' }).then(rg => { sp.rig = rg; E.ready = true; }, () => { E.ready = true; }); }, () => {}); } catch (e) {}
    // (v398 M: no PetGL.ready here: it made a second, unused set of layers (not 'lite') at its own sharpness; the loading
    // screen's warm-up (warm, below) draws it once at the sharpness and with the faces the fight will use)
    return (FORMS[d.key] = LOOKS[lk] = E);
  }
  /* cracks of molten light across its body, kept to its middle (below the face, inside every silhouette): random walks in
     body units (x: -0.2..0.2 of its height, y: -0.5..-0.1 above its feet), a few branching */
  function cracksFor(seed) { const R = mulberry32(seed * 31 + 5), out = [];
    for (let i = 0; i < 6; i++) { let x = (R() - 0.5) * 0.3, y = -0.14 - R() * 0.3, a = -Math.PI / 2 + (R() - 0.5) * 2.2; const pts = [[x, y]];
      for (let k = 0; k < 3 + Math.floor(R() * 2); k++) { a += (R() - 0.5) * 1.3; x = clamp(x + Math.cos(a) * 0.055, -0.21, 0.21); y = clamp(y + Math.sin(a) * 0.055, -0.5, -0.08); pts.push([x, y]); if (R() < 0.2) out.push({ pts: [[x, y], [x + Math.cos(a + 1.2) * 0.045, y + Math.sin(a + 1.2) * 0.045]], w: 0.6, ph: R() * 6 }); }
      out.push({ pts, w: 1, ph: R() * 6 }); }
    return out; }

  /* ======================= its moves ======================= */
  const say = (X, m, s) => { try { X.say(m, s); } catch (e) {} };
  function done(m, cd) { m.act = 'move'; m.cd = cd; m.actT = 0; m.step = 0; }
  // (v404 EM: its shots carry their own GPU painter (paint, below: the engine's GPU pass calls it) and its tells a hook that
  // says when the layer paints them (drawn); the numbers are as they were)
  function shoot(X, m, a, n, gap, spd, o) { for (let i = 0; i < n; i++) X.eshot(m.x + Math.cos(a) * m.r * 0.8, m.y - m.r * 0.8, a + (i - (n - 1) / 2) * gap, spd, Object.assign({ src: m, life: 2.2, paint: shotPaint, calEl: m.calMini && m.calMini.def.el }, o)); }
  function radial(X, m, n, spd, o, off) { for (let i = 0; i < n; i++) X.eshot(m.x, m.y - m.r * 0.6, (off || 0) + i / n * TAU, spd, Object.assign({ src: m, life: 2, paint: shotPaint, calEl: m.calMini && m.calMini.def.el }, o)); }
  // v404 EM: a tell is the engine's own warn zone (as X.warn makes it), kept in the run's list so the layer can paint it
  const tellZ = (X, o) => { const R = RUN(X); if (!X.zone) return X.warn(o); const z = Object.assign({ kind: 'warn', own: 'enemy', color: '#FF4D6D' }, o, { calTell: 1, drawn: R.drawn }); X.zone(z); (R.tells || (R.tells = [])).push(z); };
  function ai(m, A, X, B) {
    const S = m.calMini; if (!S) return; const d = S.def, me = X.me, T = m.actT, ph = m.phase || 1;
    S.aiT = (S.aiT || 0) + A.dt;
    if (S.hold) { m.act = 'move'; m.cd = Math.max(m.cd, 0.5); return; }   // (held at its post: G.hold, a scene or a picture)
    if (!S.woke) wake(m, S, X);
    if (m.act === 'wake') { m.face = me.x < m.x ? -1 : 1; if (T > 1.3) done(m, 0.9); return; }
    S.sigCd = (S.sigCd == null ? 5 : S.sigCd) - A.dt;
    // the way home: the pet ran far off; it walks back to its post along the way it came (and waits there again)
    if (m.act === 'home') { const p = S.trail[S.trail.length - 1] || S.home, dx = p.x - m.x, dy = p.y - m.y, dd = Math.hypot(dx, dy);
      if (dd < 0.25) { S.trail.pop(); if (!S.trail.length && Math.hypot(S.home.x - m.x, S.home.y - m.y) < 0.6) { m.aggro = false; S.woke = false; m.act = 'move'; m.cd = 1.5; S.homes = (S.homes || 0) + 1; } }
      else X.moveEnt(m, dx / dd * B.spd * 1.3 * A.dt, dy / dd * B.spd * 1.3 * A.dt);
      if (!S.trail.length && dd < 0.25) { m.x = S.home.x; m.y = S.home.y; }
      if (Math.hypot(me.x - S.home.x, me.y - S.home.y) < 9) { S.trail.length = 0; m.act = 'move'; m.cd = 0.6; }
      return; }
    if (m.act === 'move') {
      if (Math.hypot(me.x - S.home.x, me.y - S.home.y) > (S.leash || 16) && !me.dead) { m.act = 'home'; m.actT = 0; say(X, m, 'Hmph.'); return; }
      // the trail it leaves (to walk home by)
      S.trT = (S.trT || 0) - A.dt; if (S.trT <= 0) { S.trT = 0.4; const L = S.trail[S.trail.length - 1] || S.home; if (Math.hypot(L.x - m.x, L.y - m.y) > 0.8) { S.trail.push({ x: m.x, y: m.y }); if (S.trail.length > 120) S.trail.shift(); } }
      if (A.d > 1.4 + m.r) A.walk(B.spd); else if (A.d < 0.6 + m.r) X.moveEnt(m, -A.ux * B.spd * 0.6 * A.dt, -A.uy * B.spd * 0.6 * A.dt);
      m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd > 0) return;
      if (S.sigCd <= 0 && A.d < 9) { m.act = d.sig; S.sigCd = ph >= 2 ? 8 : 10; }
      else { const close = A.d < 4.2, r = Math.random(); m.act = close ? (r < 0.6 ? 'lunge' : d.volley) : (r < 0.35 ? 'lunge' : d.volley); if (m.act === S.last && Math.random() < 0.6) m.act = m.act === 'lunge' ? d.volley : 'lunge'; }
      S.last = m.act; m.actT = 0; m.step = 0; S.hit = false; S.acts[m.act] = (S.acts[m.act] || 0) + 1; return; }
    const tell = ph >= 3 ? 0.6 : 0.75;
    switch (m.act) {
      case 'lunge': {   // a shown lane, then it springs along it; from phase two a clawing swipe follows
        if (m.step === 0) { m.step = 1; S.la = A.a; S.len = clamp(A.d + 1.6 + m.r * 0.5, 3.6 + m.r, 6.6 + m.r); m.face = Math.cos(S.la) >= 0 ? 1 : -1; tellZ(X, { shape: 'line', x: m.x, y: m.y, a: S.la, len: S.len, w: 0.8 + m.r, life: tell, max: tell, src: m, color: d.col }); if (Math.random() < 0.5) say(X, m, d.cry[0]); }
        if (T > tell && T < tell + 0.3) { const v = S.len / 0.3; X.moveEnt(m, Math.cos(S.la) * v * A.dt, Math.sin(S.la) * v * A.dt); (S.trailPts = S.trailPts || []).push({ x: m.x, y: m.y }); if (S.trailPts.length > 12) S.trailPts.shift(); S.dashing = 0.05; if (!lowFx() && Math.random() < 0.6) X.part({ kind: 'ember', x: m.x + (Math.random() - 0.5) * 0.6, y: m.y - 0.4, vx: -Math.cos(S.la) * 2, vy: -1, life: 0.4, max: 0.4, size: 4, color: Math.random() < 0.5 ? d.col : '#1A0E1E' });
          if (!S.hit && Math.hypot(me.x - m.x, me.y - m.y) < m.r + me.r + 0.35) { S.hit = true; if (X.hurtPet(m.dmg * 1.5, m)) X.push(S.la, 1.8); } }
        if (m.step === 1 && T > tell + 0.3) { m.step = 2; if (ph >= 2) { S.sa = Math.atan2(me.y - m.y, me.x - m.x); m.face = Math.cos(S.sa) >= 0 ? 1 : -1; tellZ(X, { shape: 'cone', x: m.x, y: m.y, a: S.sa, len: 2.1 + m.r * 1.2, spread: 0.85, life: 0.45, max: 0.45, src: m, color: d.col }); } }
        if (m.step === 2 && ph >= 2 && T > tell + 0.75) { m.step = 3; if (X.inCone(m.x, m.y, S.sa, 2.1 + m.r * 1.2, 0.85)) X.hurtPet(m.dmg, m); X.slash(m.x + Math.cos(S.sa) * m.r, m.y - 0.3 + Math.sin(S.sa) * m.r, S.sa, 1.6 + m.r, d.col); snd(X, 'whoosh'); }
        if (T > tell + (ph >= 2 ? 1.25 : 0.85)) done(m, 1.3);
        break; }
      case 'fire': case 'ice': {   // waves of shots along shown cones
        const waves = ph >= 2 ? 3 : 2, gapT = 0.78;
        if (m.step < waves && T > m.step * gapT) { const a = A.a + (m.step % 2 ? 0.12 : -0.05), ice = m.act === 'ice'; m.face = Math.cos(a) >= 0 ? 1 : -1; m.step++;
          tellZ(X, { shape: 'cone', x: m.x, y: m.y, a, len: 7, spread: ice ? 0.42 : 0.5, life: 0.5, max: 0.5, src: m, color: d.col }); if (m.step === 1) say(X, m, d.cry[1]);
          const sh = d.shot; X.after(0.5, () => { if (m.dead) return; shoot(X, m, a, sh.n, sh.gap, sh.spd, Object.assign({ dmg: m.dmg * 0.75, color: sh.col, core: sh.core, r: sh.r, style: sh.style }, sh.chill ? { chill: sh.chill } : {})); snd(X, ice ? 'chime' : 'whoosh', 880, 0.2); }); }
        if (T > waves * gapT + 0.55) done(m, 1.4);
        break; }
      case 'beam': {   // a shown lane, then a prism ray along it; three fanned in turn from phase two
        const n = ph >= 2 ? 3 : 1, per = 1.25;
        if (m.step < n && T > m.step * per) { const off = n === 1 ? 0 : [0, -0.5, 0.5][m.step], a = A.a + off; S.beams = S.beams || []; S.beams.push({ a, x: m.x, y: m.y - m.r * 0.9, w: 0.6 + m.r * 0.6, rise: m.r * 0.9, t: 0, on: 0.85, off: 1.3, hit: false }); m.face = Math.cos(a) >= 0 ? 1 : -1; m.step++;
          tellZ(X, { shape: 'line', x: m.x, y: m.y, a, len: 9, w: 0.6 + m.r * 0.6, life: 0.85, max: 0.85, src: m, color: d.col }); if (m.step === 1) say(X, m, d.cry[1]); }
        if (T > n * per + 0.5) done(m, 1.4);
        break; }
      case 'pounce': {   // Cinder Pounce: a crouch, a leap, a marked landing that bursts (from phase two, embers fly out of it)
        if (m.step === 0) { m.step = 1; const p = X.walkPoint ? X.walkPoint(me.x, me.y, { r: m.r, mv: 0, x: m.x, y: m.y }) : { x: me.x, y: me.y }; S.from = { x: m.x, y: m.y }; S.to = p || { x: me.x, y: me.y }; S.tell = 1;
          tellZ(X, { x: S.to.x, y: S.to.y, r: 1.4 + m.r * 0.8, life: 1.25, max: 1.25, src: m, color: d.col }); X.text(m.x, m.y - m.r * 3.2, d.sigName + '!', d.col, 15); snd(X, 'hiss', 0.8, 0.2, 500); }
        if (T > 0.55 && T < 1.25) { const u = (T - 0.55) / 0.7; m.x = lerp(S.from.x, S.to.x, u); m.y = lerp(S.from.y, S.to.y, u); m.z = Math.sin(u * Math.PI) * (1.6 + m.r); }
        if (m.step === 1 && T >= 1.25) { m.step = 2; m.z = 0; m.x = S.to.x; m.y = S.to.y; S.tell = 0; if (X.unstick) X.unstick(m);
          if (Math.hypot(me.x - m.x, me.y - m.y) < 1.4 + m.r * 0.8 + me.r) X.hurtPet(m.dmg * 2, m);
          X.boom(m.x, m.y, 1.4 + m.r * 0.8, d.shot.col, d.shot.core, { n: 26, shake: 9, smoke: 6 }); X.ring(m.x, m.y, 0.3, 1.7 + m.r * 0.8, 0.4, '#2A1220', 0.5); snd(X, 'crash');
          if (ph >= 2) radial(X, m, 8, 5, { dmg: m.dmg * 0.6, color: d.shot.col, core: d.shot.core, r: 0.2, style: 'orb' }, Math.random()); }
        if (T > 2.15) done(m, 1.2);   // (it pants after it: the window to punish)
        break; }
      case 'howl': {   // Glacial Howl: it plants and howls; a marked ring round it; then a frost nova that chills
        if (m.step === 0) { m.step = 1; S.tell = 1; tellZ(X, { x: m.x, y: m.y, r: 2.6 + m.r * 1.2, life: 1.4, max: 1.4, src: m, color: d.col, follow: m }); X.text(m.x, m.y - m.r * 3.2, d.sigName + '!', d.col, 15); snd(X, 'hum'); }
        if (m.step === 1 && T >= 1.4) { m.step = 2; S.tell = 0; if (Math.hypot(me.x - m.x, me.y - m.y) < 2.6 + m.r * 1.2 + me.r && X.hurtPet(m.dmg * 2, m) && d.shot.chill) X.chillPet(2.4);
          X.boom(m.x, m.y, 2.6 + m.r * 1.2, d.shot.col, d.shot.core, { n: 30, shake: 8, smoke: 4 }); X.ring(m.x, m.y, 0.3, 2.8 + m.r * 1.2, 0.45, '#2A4A6A', 0.5); snd(X, 'crash');
          radial(X, m, ph >= 2 ? 14 : 10, 5.5, Object.assign({ dmg: m.dmg * 0.6, color: d.shot.col, core: d.shot.core, r: 0.16, style: d.shot.style }, d.shot.chill ? { chill: 1 } : {}), Math.random()); }
        if (T > 2.3) done(m, 1.2);
        break; }
      case 'rain': {   // Shatter Rain: marked circles round the pet, then glass falls on each (a second, smaller fall from phase two)
        const drop = (cx, cy, k, lag) => { const R = 0.9 + m.r * 0.4; for (let i = 0; i < k; i++) { const a = Math.random() * TAU, rr = i ? 1.6 + Math.random() * 1.6 : 0, p = { x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr }, life = 1.05 + i * 0.16 + (lag || 0);
          tellZ(X, { x: p.x, y: p.y, r: R, life, max: life, src: m, color: d.col, fn: () => { if (m.dead) return; if (Math.hypot(me.x - p.x, me.y - p.y) < R + me.r) X.hurtPet(m.dmg * 1.5, m); X.boom(p.x, p.y, R, d.col, '#FFFFFF', { n: 12, shake: 3 }); X.sparks(p.x, p.y, d.core, 8, 5); snd(X, 'crack'); } }); } };
        if (m.step === 0) { m.step = 1; S.tell = 1; X.text(m.x, m.y - m.r * 3.2, d.sigName + '!', d.col, 15); drop(me.x, me.y, ph >= 2 ? 7 : 5); snd(X, 'chime', 1400, 0.3); }
        if (m.step === 1 && T > 1.6) { m.step = 2; S.tell = 0; if (ph >= 2) drop(me.x, me.y, 3, 0.1); }
        if (T > 2.6) done(m, 1.2);
        break; }
      default: done(m, 1);
    }
  }
  function wake(m, S, X) { S.woke = true; m.aggro = true; m.act = 'wake'; m.actT = 0; m.cd = 1; S.wakes = (S.wakes || 0) + 1; const d = S.def, RX = S.X;
    try { if (S.wakes === 1) RX.banner(d.name.toUpperCase(), S.sub || `A corrupted ${S.evil.species} guards the gate`, d.col, 2.4, true); else RX.banner(d.short.toUpperCase(), 'It turns on you again', d.col, 1.4); } catch (e) {}
    try { RX.ring(m.x, m.y, 0.3, 4, 0.7, '#1A0A22', 0.45); RX.ring(m.x, m.y, 0.2, 3.2, 0.5, d.col, 0.35); RX.shake(6, 0.4); } catch (e) {}
    snd(RX, 'hum'); say(RX, m, d.cry[2]); }
  Object.assign(DunAI.boss, { calmini_ashen: ai, calmini_rime: ai, calmini_glass: ai, evilmini: ai });

  /* ======================= drawing it (in the engine's place for RiftEvil.draw) =======================
     GPU first: its body is the pet itself in 2.5D (PetGL: the layer cut, the turn, the arms, the wing beat, the tail's
     swing), drawn into a canvas of its own and laid down; the corruption on Nidhogg's painter (FGFX, CAL.gpu): behind it
     a black-fire aura (dark billowing smoke, tongues of violet and ember fire licking up, embers on the floor), in front its
     molten cracks, its red eyes, the attack's light (a lunge's streak, a tell's charge, a signature's ring). A dark pool
     under it, so it reads on a light floor. Where the GPU cannot draw it (no WebGL, its layers not made yet) it is simply
     the Rift-touched as the game already draws it (RiftEvil.draw, the 2D sprites) with the engine's plain effects: no
     second, simplified copy of the corruption (the user, v390) */
  const CV = {};
  function cv(k, w, h) { let o = CV[k]; if (!o) o = CV[k] = document.createElement('canvas'); if (o.width !== w || o.height !== h) { o.width = w; o.height = h; } const x = o.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, w, h); return [o, x]; }
  const gpu = c => { try { return CAL.gpu ? CAL.gpu(c, false) : null; } catch (e) { return null; } };
  const gpuEnd = (c, G) => { if (G) try { CAL.gpuEnd(c, G); } catch (e) {} };
  /* ======================= v404 EM: its attacks on the GPU, soft =======================
     The user (v403, the Belfry's Clangrot fight): "some of the attack edges are not blended in properly, there are rough
     edges, the beams look like they're cropped". Where Nidhogg's painter runs, every attack of a guardian is light on FGFX,
     feathered on every side (numbers, timing and hit areas untouched; where the painter cannot run, the engine's own 2D as
     before):
       - its tells (the lane, the cones, the circles: engine warn zones made through tellZ) were the engine's 2D shapes (a
         filled box with a dashed border, a hard wedge, stroked circles); now glow on the floor in the layer's ground batch: a
         soft band or fan of light deepening as the count runs out, its edges soft lines of light, a front of light sweeping out
         to where the blow lands, glints running along a lane; a circle a pool of light filling and a ring of overlapping
         links (no stroke). The zone is still the engine's (its time, its fn); z.drawn() tells the engine not to draw it (20b)
       - its shots (volleys, the bursts of a pounce and a howl) were flat 2D discs (and the frost one a wooden arrow); now
         painted in the engine's own GPU pass (eshot.paint, 20b): a fireball with a comet tail, an ice lance (a white-hot
         thread in a pale body, a glint at its point), an orb of energy or of water; each tail thins to nothing
       - a lunge's streak was a row of separate energy beams (beads); now one ribbon of overlapping links ramped tail to head
       - the prism / umbral ray had a hard 2D stroke laid over its GPU light; now a soft dark sheath on the GPU under a halo,
         its body and a white core, a flare at its mouth
       - the leaders' dark ring under them (a 2D stroke under the GPU ring) is a soft dark ring on the GPU
     Cost: a tell is 6-30 quads, a shot 3-5, all in batches that were drawn anyway (no extra pass). */
  // a soft dark stroke laid over (FGFX kind 71, picture 7: gaussian across, its ends fading)
  const stroke71 = (Q, x0, y0, x1, y1, w, col, a) => { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.5 || !(a > 0.004)) return; Q.quad(71, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col, Math.min(1, a), 7); };
  // a ring of overlapping links (each an eighth longer at both ends, so their soft ends sum to one): no stroke, no seam; as
  // many links as keep each chord within a quarter of the line's width of the true circle (no facets)
  const linksFor = (R, w, span) => Math.ceil(span / (2 * Math.acos(clamp(1 - Math.max(0.5, w * 0.12) / R, -1, 1)) || 1));
  function softRing(Q, x, y, R, sy, w, col, a, solid) { if (!(R > 1) || !(a > 0.004)) return; const n = clamp(linksFor(R, w, TAU), 12, 44), st = TAU / n, e = st / 8;
    for (let i = 0; i < n; i++) { const b0 = i * st - e, b1 = (i + 1) * st + e, x0 = x + Math.cos(b0) * R, y0 = y + Math.sin(b0) * R * sy, x1 = x + Math.cos(b1) * R, y1 = y + Math.sin(b1) * R * sy; if (solid) stroke71(Q, x0, y0, x1, y1, w, col, a); else Q.beam(x0, y0, x1, y1, w, col, a); } }
  // an arc of light from b0 to b1, its strength rising and falling along it (so its ends dissolve)
  function softArc(Q, x, y, R, b0, b1, w, col, a) { if (!(R > 1) || !(a > 0.004)) return; const n = clamp(linksFor(R, w, Math.abs(b1 - b0)), 3, 18), st = (b1 - b0) / n, e = st / 8, env = u => Math.sin(Math.PI * clamp(u, 0, 1));
    for (let i = 0; i < n; i++) { const c0 = b0 + i * st - e, c1 = b0 + (i + 1) * st + e; Q.rbeam(x + Math.cos(c0) * R, y + Math.sin(c0) * R, x + Math.cos(c1) * R, y + Math.sin(c1) * R, w, col, a, env(i / n) * 0.9 + 0.1, env((i + 1) / n) * 0.9 + 0.1); } }
  /* a tell, painted in the layer's ground batch (z: the engine's warn zone) */
  function paintTell(Q, X, z, t, T) { const life = z.max || 1, u = clamp(1 - z.life / life, 0, 1), k = clamp((life - z.life) / 0.12, 0, 1) * clamp(z.life / 0.06, 0, 1); if (!(k > 0.01)) return;
    const col = z.color || '#FF4D6D', hi = z.calHi || (z.calHi = mixHex(col, '#FFFFFF', 0.45)), x = X.sx(z.x), y = X.sy(z.y), pulse = 0.5 + 0.5 * Math.sin(t * (7 + 9 * u)), lw = Math.max(2.5, T * 0.08);
    if (z.shape === 'line') { const L = z.len * T, hw = z.w * T / 2, ca = Math.cos(z.a), sa = Math.sin(z.a), nx = -sa, ny = ca, x1 = x + ca * L, y1 = y + sa * L, f = Math.max(0.1, u), xf = x + ca * L * f, yf = y + sa * L * f;
      Q.rbeam(x, y, x1, y1, hw * 1.7, col, (0.3 + 0.3 * u) * k, 0.45, 1);              // the lane: a soft band of its colour
      Q.rbeam(x, y, xf, yf, hw * 1.15, col, (0.3 + 0.4 * u) * k, 0.25, 1);              // the count: light filling it from its root
      Q.glow(xf, yf, hw * 1.4, hi, (0.22 + 0.25 * u) * k);                                  // and its front
      for (const sd of [-1, 1]) Q.rbeam(x + nx * hw * sd, y + ny * hw * sd, x1 + nx * hw * sd, y1 + ny * hw * sd, lw, hi, (0.55 + 0.3 * pulse) * k, 0.15, 1);   // its edges: soft lines of light
      for (let i = 0; i < 3; i++) { const g = (i / 3 + t * 0.7) % 1; Q.star(x + ca * L * g, y + sa * L * g, hw * 0.45, 0.55 * Math.sin(Math.PI * g) * k, hi); }   // glints running along it, the way it goes
      return; }
    if (z.shape === 'cone') { const L = z.len * T, sp = z.spread, r0 = T * 0.35, n = clamp(Math.ceil(2 * sp * L / (T * 0.9)) + 1, 5, 10), hwR = 2 * sp * 0.82 * L / (n - 1) * 1.45;
      for (let i = 0; i < n; i++) { const b = z.a - sp * 0.82 + 2 * sp * 0.82 * i / (n - 1), cb = Math.cos(b), sb = Math.sin(b); Q.rbeam(x + cb * r0, y + sb * r0, x + cb * L, y + sb * L, hwR, col, (0.11 + 0.15 * u) * k, 0.2, 1); }   // a fan of soft light
      for (const b of [z.a - sp, z.a + sp]) { const cb = Math.cos(b), sb = Math.sin(b); Q.rbeam(x + cb * r0, y + sb * r0, x + cb * L, y + sb * L, lw, hi, (0.55 + 0.3 * pulse) * k, 0.1, 1); }   // its edges
      softArc(Q, x, y, r0 + (L - r0) * u, z.a - sp, z.a + sp, T * 0.22, hi, (0.4 + 0.4 * u) * k);   // the front sweeping out
      softArc(Q, x, y, L, z.a - sp, z.a + sp, T * 0.16, col, 0.45 * k);   // its reach
      return; }
    const R = z.r * T; Q.glow(x, y, R * 1.15, col, (0.22 + 0.3 * u) * k); Q.glow(x, y, R * (0.25 + 0.85 * u), hi, (0.12 + 0.3 * u) * k);   // a pool of light filling it
    softRing(Q, x, y, R, 1, Math.max(3, T * 0.22), col, (0.3 + 0.2 * u) * k); softRing(Q, x, y, R, 1, lw, hi, (0.45 + 0.3 * pulse) * k);   // its rim: links of light
    if (z.r > 1.6) for (let i = 0; i < 2; i++) { const b = t * 3 + i * Math.PI; Q.star(x + Math.cos(b) * R * 0.6, y + Math.sin(b) * R * 0.6, T * 0.3, 0.6 * k, hi); } }
  /* a shot, painted in the engine's GPU pass (20b drawEShots calls b.paint(Q, x, y, r, T, b) and skips its 2D when it returns
     true); x, y its place on screen, r its radius in px */
  function shotPaint(Q, x, y, r, T, b) { const sp = Math.hypot(b.vx, b.vy) || 1, ux = b.vx / sp, uy = b.vy / sp, sd = b.sd || (b.sd = 1 + Math.random() * 50), col = b.color || '#B784FF', core = b.core || '#FFFFFF', k = clamp((b.t || 0) / 0.06, 0.35, 1);
    if (b.style === 'arrow') { const hx = x + ux * r * 1.6, hy = y + uy * r * 1.6, L = r * 5.5, tx = x - ux * L, ty = y - uy * L;   // an ice lance: its point forward, its tail thinning away
      stroke71(Q, hx, hy, tx, ty, r * 0.9, '#0E1A2C', 0.3 * k);
      Q.ebeam(hx, hy, tx, ty, r * 0.75, col, 0.9, 0.95 * k, sd, 7); Q.rbeam(hx, hy, tx, ty, r * 0.24, '#FFFFFF', 0.95 * k, 1, 0.1);
      Q.glow(x, y, r * 2.6, col, 0.45 * k); Q.star(hx, hy, r * 1.7, 0.9 * k, core); return true; }
    const fire = b.calEl === 'fire', water = b.calEl === 'water', L = r * (fire ? 5 : 4.5);
    if (fire) { Q.firebeam(x, y, x - ux * L, y - uy * L, r * 0.8, 0.75, 0.85 * k, sd, 5); Q.fire(x, y, r * 1.3, 0.95, k, sd); Q.glow(x, y, r * 3, col, 0.45 * k); return true; }
    Q.ebeam(x, y, x - ux * L, y - uy * L, r * 0.7, col, 0.8, 0.7 * k, sd, 6);   // its tail
    if (water && Q.wsphere) Q.wsphere(x, y, r * 1.2, col, k, sd, 1.5); else Q.eorb(x, y, r * 1.25, col, 0.9, k, sd, 3);
    Q.glow(x, y, r * 2.8, col, 0.42 * k); Q.glow(x, y, r * 0.75, core, 0.7 * k); return true; }
  /* the aura on the GPU: smoke as dark as soot rolling up round it (solid, so it shows on a light floor), and tongues of
     black fire: a violet heart, an ember edge */
  function gpuAura(Q, Xs, foot, h, t, k, d, seed) {
    const n = 6; for (let i = 0; i < n; i++) { const u = (i - (n - 1) / 2) / ((n - 1) / 2), ph = t * (0.5 + 0.08 * i) + i * 1.7, rise = (ph % 1);
      Q.smoke(Xs + u * h * 0.4 + Math.sin(ph * 3) * h * 0.05, foot - h * (0.1 + 0.75 * rise) * (1 - 0.2 * Math.abs(u)), h * (0.26 + 0.16 * rise) * (0.9 + 0.2 * k), (0.85 - 0.6 * rise) * (0.85 + 0.15 * k), seed + i, '#120818', 0); }
    for (let i = 0; i < 7; i++) { const u = (i - 3) / 3, fl = 0.5 + 0.5 * Math.sin(t * (5.1 + i * 0.6) + i * 2.3), H = h * (0.2 + 0.16 * (1 - Math.abs(u))) * (0.8 + 0.3 * fl) * (0.85 + 0.3 * k), x = Xs + u * h * 0.42;
      Q.etongue(x, foot - h * 0.04, h * 0.11 * (1 - 0.3 * Math.abs(u)), H, Math.sin(t * 2 + i) * 0.12 - u * 0.15, i % 2 ? '#8A3AFF' : FRACTURE, 0.7, Math.min(1, (0.75 + 0.3 * fl) * Math.min(1.2, k)), seed * 3 + i); }
    Q.glow(Xs, foot - h * 0.05, h * 0.55, d.glow, 0.22 + 0.18 * k, 0.32); Q.ground(Xs, foot, h * 0.42, 0.6, 0.35 + 0.2 * k, seed, 0.32, 0.8); }
  /* its pose for the pet renderer: walking, breathing, a menacing hunch while it waits, claws up in a tell */
  function poseOf(m, S, t, moving, idle, swell, tell) {
    const ph = m.ewalk || 0, mv = moving ? 1 : 0, cast = clamp((m.ecast || 0) + tell * 0.4, 0, 1), lift = cast * (S.def.sig === m.act || m.act === 'howl' ? 105 : 70) + swell * 40;
    const fs = sd => { const a = ph + (sd < 0 ? Math.PI : 0); return [mv * Math.cos(a) * 1.8 * sd, -mv * Math.max(0, Math.sin(a)) * 5.2]; };
    const arm = sd => (mv ? Math.sin(ph + (sd < 0 ? 0 : Math.PI)) * 24 : Math.sin(t * (idle ? 1.4 : 2.2) + sd) * (idle ? 6 : 3)) * (1 - Math.min(1, lift / 55)) + lift;
    const yaw = clamp((m.calYaw || 0), -0.55, 0.55);
    return { t, yaw, face: m.flash > 0 ? { eyes: 'dizzy', mouth: 'o', brows: 'angry' } : (cast > 0.5 || swell > 0.5) ? { eyes: 'normal', mouth: 'open', brows: 'angry' } : { eyes: 'normal', mouth: 'smile', brows: 'angry' },
      footL: fs(1), footR: fs(-1), armL: arm(1), armR: arm(-1), wing: Math.sin(m.ewing || 0) * (moving ? 20 : idle ? 9 + 12 * swell : 14), tail: Math.sin(t * 2.4 + ph) * (moving ? 12 : 7), legPh: m.ewing || 0, legAmp: moving ? 16 : 8,
      lean: (idle ? 0.05 : 0.03 + 0.08 * cast) * 1, sy: 1, sx: 1 }; }
  /* v398 M (the user, on an iPhone: "massive drop in performance whenever face with evil cocopet mini boss and large numbers
     of monsters... make it still look the same"). What a frame of it cost, and what it costs now:
       - its body: PetGL's frame went into a canvas 2.3 times its height on a side (a square of ~670 px at a phone's
         sharpness), then a second canvas as big for its cracks (cleared, stroked, cut to the body, laid down), and a third copy
         of the body every frame (the stand-in for PetGL's slow frames). Now: two canvases of its own, each only as big as
         PetGL's own frame of it, used in turn (the last one is the stand-in, nothing copied), and the cracks stroked straight
         onto the body ('source-atop': only where the body is, as the mask did);
       - its corruption on the GPU: two batches of Nidhogg's painter of its own (each laid over the whole screen twice: smoke,
         then light). Now they ride in the layer's two batches that were there anyway (the leaders' rings under the
         monsters, the crowns' gems over them): the aura and the smoke at its feet with the rings, its eyes, cracks' light,
         tells and streaks with the gems (drawn just after it). Inline as before only where no layer runs;
       - the dark pool under it: a gradient made every frame, now a picture made once per size;
       - names, tags and crowns (text and paths every frame, for every leader in view): pictures made once, laid down. */
  const poolPic = (w, h2, sc) => { const key = 'pool|' + Math.round(w * sc) + '|' + Math.round(h2 * sc); let o = PICS.get(key); if (o) return o;
    const W = Math.max(2, Math.ceil(w * sc)), H = Math.max(2, Math.ceil(h2 * sc)), cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H; const x = cv2.getContext('2d'), hh = w * 0.5 * sc;
    const pg = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, hh); pg.addColorStop(0, 'rgba(12,4,14,.62)'); pg.addColorStop(0.7, 'rgba(12,4,14,.25)'); pg.addColorStop(1, 'rgba(12,4,14,0)'); x.fillStyle = pg; x.beginPath(); x.ellipse(W / 2, H / 2, W / 2, H / 2, 0, 0, TAU); x.fill();
    return pic(key, cv2); };
  const PICS = new Map(); function pic(key, o) { PICS.set(key, o); if (PICS.size > 160) PICS.delete(PICS.keys().next().value); return o; }
  // the look of it this frame (what the layer's batches draw from): its place, size, pose and glow
  function miniLook(m, S, t, me) { const stun = m.stunT > 0 && m.act === 'stunned', idle = !m.aggro || !!S.hold, swell = idle ? Math.max(0, Math.sin(t * 1.4 + 0.5)) ** 6 : 0, tell = S.tell ? 0.6 + 0.4 * Math.sin(t * 18) : 0;
    return { stun, idle, swell, tell, k: clamp(0.55 + 0.45 * swell + 0.5 * (m.ecast || 0) + tell + (1 - m.hp / m.maxhp) * 0.3, 0, 1.6) }; }
  function drawMini(c, m, Xs, Ys, r, t, me) {
    const S = m.calMini, E = m.evil, h = r * 2.5, foot = Ys + r * 0.75, d = S.def;
    const vx = m._px != null ? (m.x - m._px) * 60 : 0, vy = m._py != null ? (m.y - m._py) * 60 : 0; m._px = m.x; m._py = m.y; const L0 = miniLook(m, S, t, me), stun = L0.stun, moving = Math.hypot(vx, vy) > 0.2 && !stun && m.act !== 'pounce';
    m.ewalk = (m.ewalk || 0) + (moving ? 0.16 : 0.03); m.ewing = (m.ewing || 0) + (moving ? 0.22 : 0.08);
    if (Math.abs(vx) > 0.15) m.eface = vx < 0 ? -1 : 1; else if (m.aggro && me) m.eface = me.x < m.x ? -1 : 1; else if (m.eface == null) m.eface = S.faceHome || 1;
    m.calYaw = lerp(m.calYaw || 0, moving ? 0.42 : m.aggro && me ? clamp(0.3 + (me.y - m.y) * 0.06, -0.1, 0.5) : 0.32 + 0.16 * Math.sin(t * 0.55), 0.08);
    const act = m.act || '', striking = m.aggro && !stun && act !== 'move' && act !== 'home';
    m.ecast = striking ? Math.min(1, (m.ecast || 0) + 0.06) : Math.max(0, (m.ecast || 0) - 0.08);
    // (idle at its post: every few seconds its fire swells and its eyes flare: a growl)
    const { idle, swell, tell, k } = miniLook(m, S, t, me);
    const seed = (d.seed % 17) + 1;
    // the body first, into a canvas of its own: breathing, a step, a squash when struck, a crouch in a tell
    const breathe = Math.sin(t * (idle ? 1.6 : 2.4)) * (idle ? 0.04 : 0.03), step = moving ? Math.sin(m.ewalk * 2) * 0.05 : 0, hitSq = m.flash > 0 ? 0.08 : 0, crouch = S.tell && act === 'pounce' && m.actT < 0.55 ? 0.12 : 0;
    let sxk = 1 + breathe + step + hitSq + crouch * 0.5, syk = 1 - breathe - step * 0.8 - hitSq - crouch; const rot = stun ? Math.sin(t * 5) * 0.12 : moving ? (vx > 0 ? 0.05 : vx < 0 ? -0.05 : 0) : idle ? Math.sin(t * 0.9) * 0.03 : 0;
    if (m.ecast > 0) { syk *= 1 + 0.06 * m.ecast; sxk *= 1 - 0.03 * m.ecast; }
    const bob = moving ? Math.abs(Math.sin(m.ewalk)) * r * 0.08 : 0, fy = foot - bob;
    let sc = 1; try { const tf = c.getTransform(); sc = clamp(Math.hypot(tf.a, tf.b), 1, 2); } catch (e) {}
    // (its canvas: PetGL's own frame of it (room for a raised arm, a beat of the wings, a turn), with a little more for the
    // squash and the tilt; a square 2.3 times its height until PetGL has told its frame)
    const kk = h / E.bodyTop; let fb = null; try { fb = typeof PetGL !== 'undefined' ? PetGL.box(E.form, true) : null; } catch (e) { fb = null; }
    const cw = fb ? Math.ceil(Math.max(Math.abs(fb[0]), Math.abs(fb[0] + fb[2])) * kk * 2 * 1.16 + 4) : Math.ceil(h * 2.3), up = fb ? Math.ceil(-fb[1] * kk * 1.16 + 4) : Math.ceil(h * 2.3 * 0.86), dn = fb ? Math.ceil(Math.max(0, fb[1] + fb[3]) * kk * 1.16 + h * 0.08 + 4) : Math.ceil(h * 2.3 * 0.14);
    const ch = up + dn, Wd = Math.ceil(cw * sc), Hd = Math.ceil(ch * sc);
    if (!S.cvs) S.cvs = [document.createElement('canvas'), document.createElement('canvas')];
    const B = S.prevG && S.prevG.cv === S.cvs[0] ? S.cvs[1] : S.cvs[0];   // (never the last good frame: it stands in on a miss)
    if (B.width !== Wd || B.height !== Hd) { B.width = Wd; B.height = Hd; } const b = B.getContext('2d'); b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over'; b.clearRect(0, 0, Wd, Hd);
    b.scale(sc, sc); b.translate(cw / 2, up); if (rot) { b.translate(0, -h * 0.5); b.rotate(rot); b.translate(0, h * 0.5); } b.scale((m.eface < 0 ? -1 : 1) * sxk, syk);
    // (v398 M: on a device that is already struggling (frames slower than ~45 a second, measured here), its body is posed
    // every other frame and the last pose is laid down, moved with it, between: its motion stays, at half the cost)
    const nowMs = performance.now(); if (S.ftPrev != null) { const dtm = Math.min(100, nowMs - S.ftPrev); S.ftEma = S.ftEma == null ? dtm : S.ftEma + (dtm - S.ftEma) * 0.1; } S.ftPrev = nowMs;
    const halve = S.ftEma > 22 && !window.__calMiniFull && S.prevG && S.lastGLt != null && Math.abs(t - S.lastGLt) < 0.2 && S.prevG.cw === cw && S.prevG.ch === ch && !(m.flash > 0) && (S.halfFlip = !S.halfFlip);
    let gl = false; if (!halve && typeof PetGL !== 'undefined' && !window.__calMini2D) { try { gl = PetGL.draw(b, E.form, kk, poseOf(m, S, t, moving, idle, swell, tell), { lite: true }); } catch (e) { gl = false; } }
    S.gl = gl || !!halve; if (halve) S.glHalf = (S.glHalf || 0) + 1; else if (!gl) S.glMiss = (S.glMiss || 0) + 1; else S.glHit = (S.glHit || 0) + 1;
    const ox = Xs - cw / 2, oyy = fy - up, fl = m.eface < 0 ? -1 : 1;
    let held = null;
    // (PetGL builds a new face or sharpness in the background and draws nothing for those few frames: its last GPU frame,
    // the other canvas, stands in rather than the 2D sprite flickering in)
    if (halve) { held = S.prevG; gl = true; }
    else if (!gl && S.prevG && S.prevG.cv !== B && S.lastGLt != null && Math.abs(t - S.lastGLt) < 2) { held = S.prevG; gl = true; S.glHeld = (S.glHeld || 0) + 1; }
    // (no GPU: the Rift-touched as the game draws it)
    if (!gl) { S.lastFrame = null; S.gpuFx = false; S.look = null; return S.d0 ? S.d0(c, m, Xs, Ys, r, t, me) : false; }
    // the dark pool under it (it carries it on a light floor)
    // (with a layer running, the layer has laid it already, under the aura as before)
    const R = RUN(S.X), viaLayer = R.layerT != null && Math.abs(R.layerT - t) < 0.25 && !window.__calMiniInlineFx && S.pooled === R.layerT;
    if (!viaLayer) { const P2 = poolPic(h * 1.24, h * 0.4, sc); c.drawImage(P2, Xs - h * 0.62, foot - h * 0.2, h * 1.24, h * 0.4); }
    // the look the layer's batches draw from (its aura behind it, its eyes and the rest in front)
    S.look = { x: m.x, y: m.y, z: m.z || 0, r: m.r, t, k, swell, tell, sxk, syk, fl, bob, seed, ecast: m.ecast || 0 };
    let G = viaLayer ? null : gpu(c); S.gpuFx = viaLayer ? !!R.layerFx : !!G; S.fxInline = !viaLayer;
    if (G) { gpuAura(G.Q, Xs, foot, h, t, k, d, seed); feetSmoke(G.Q, Xs, foot, h, t, seed); gpuEnd(c, G); }
    if (held) { c.drawImage(held.cv, held.ox + (Xs - held.xs), held.oyy + (fy - held.fy), held.cw, held.ch); S.lastFrame = held.frame; if (!viaLayer) { const G2 = gpu(c); if (G2) { frontFx(G2.Q, S, E, Xs, fy, foot, h, t); gpuEnd(c, G2); } } return true; }
    // a dark ash wash rising over its lower body, its tell's colour or the white of a blow, and its cracks: all on the body
    // only ('source-atop')
    b.setTransform(1, 0, 0, 1, 0, 0); b.globalCompositeOperation = 'source-atop'; const ag = b.createLinearGradient(0, up * sc, 0, (up - h * 0.943) * sc); ag.addColorStop(0, 'rgba(10,4,12,.5)'); ag.addColorStop(1, 'rgba(10,4,12,0)'); b.fillStyle = ag; b.fillRect(0, 0, Wd, Hd);
    if (tell > 0 || m.flash > 0) { b.fillStyle = m.flash > 0 ? 'rgba(255,255,255,.28)' : rgba(d.col, 0.2 * tell); b.fillRect(0, 0, Wd, Hd); }
    b.scale(sc, sc); b.translate(cw / 2, up); if (rot) { b.translate(0, -h * 0.5); b.rotate(rot); b.translate(0, h * 0.5); } b.scale(fl * sxk, syk); b.lineCap = 'round'; b.lineJoin = 'round';
    const glowK = clamp(0.45 + 0.4 * k, 0, 1);
    for (const [lw, col, a] of [[0.04, FRACTURE, 0.5], [0.018, LAVA_HI, 0.95], [0.008, '#FFF4D8', 0.9]]) { b.strokeStyle = col; b.lineWidth = Math.max(0.8, h * lw); for (const q of E.cracks) { b.globalAlpha = a * glowK * (0.7 + 0.3 * Math.sin(t * 2.2 + q.ph)) * q.w; b.beginPath(); q.pts.forEach((p, i) => i ? b.lineTo(p[0] * h, p[1] * h) : b.moveTo(p[0] * h, p[1] * h)); b.stroke(); } }
    b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
    c.drawImage(B, ox, oyy, cw, ch);
    S.lastFrame = { cv: B, sc, sz: cw, cw, ch, oy: up, h };
    S.prevG = { cv: B, ox, oyy, xs: Xs, fy, cw, ch, frame: S.lastFrame }; S.lastGLt = t;
    // in front: (inline only where no layer runs) the cracks' light, its eyes, a tell's charge and ring, a lunge's streak
    G = viaLayer ? null : gpu(c);
    if (G) { frontFx(G.Q, S, E, Xs, fy, foot, h, t); gpuEnd(c, G); }
    return true;
  }
  function feetSmoke(Q, Xs, foot, h, t, seed) { for (let i = 0; i < 2; i++) { const ph = (t * 0.9 + i * 0.5) % 1; Q.smoke(Xs + (i ? 1 : -1) * h * 0.18, foot - h * (0.1 + 0.4 * ph), h * 0.1 * (1 + ph), 0.4 * (1 - ph), seed + 9 + i, '#140A1C', 0); } }
  function frontFx(Q, S, E, Xs, fy, foot, h, t) { const L = S.look, d = S.def, fl = L.fl, sxk = L.sxk, syk = L.syk, k = L.k, swell = L.swell, tell = L.tell, seed = L.seed, ck = clamp(0.5 + 0.45 * k, 0, 1.2), ey = fy - h * 0.6 * syk, eg = h * 0.11, P = (u, v) => [Xs + u * h * fl * sxk, fy + v * h * syk];
    for (const q of E.cracks) { const a = ck * (0.65 + 0.35 * Math.sin(t * 2.2 + q.ph)) * q.w; for (let i = 0; i < q.pts.length; i += 2) { const p0 = P(q.pts[i][0], q.pts[i][1]); Q.glow(p0[0], p0[1], h * 0.07, FRACTURE, 0.5 * a); } }
    Q.glow(Xs, fy - h * 0.3, h * 0.3, FRACTURE, 0.14 * ck);
    const ek = clamp(0.5 + 0.2 * Math.sin(t * 4) + 0.4 * L.ecast + 0.6 * swell + tell, 0, 1.3);
    for (const sd of [-1, 1]) { Q.glow(Xs + sd * eg * fl + fl * h * 0.03, ey, h * 0.09, RED_EYE, 0.9 * ek); Q.star(Xs + sd * eg * fl + fl * h * 0.03, ey, h * 0.05 * (0.8 + 0.4 * ek), 0.8 * ek, '#FFD0C8'); }
    Q.glow(Xs + fl * h * 0.03, ey, h * 0.26, RED_EYE, 0.22 * ek, 0.5);
    if (tell > 0) { Q.ring(Xs, foot, h * (0.55 + 0.1 * Math.sin(t * 9)), d.col, 0.6 * tell, h * 0.05, 0.34); Q.glow(Xs, fy - h * 0.45, h * 0.5, d.col, 0.3 * tell); }
    // a lunge's streak (v404 EM: one ribbon of overlapping links, its strength ramped from tail to head: no beads)
    if (S.trailPts && S.trailPts.length > 1) streakPaint(Q, S.trailPts.map(p => [S.X.sx(p.x), S.X.sy(p.y) - h * 0.35]), h, d.col, seed); }
  function streakPaint(Q, P, h, col, seed) { const n = P.length;
      // (v408: the head's links are short but wide, so a link's own end feather (over a part of its length) read as a straight cut
      // across the glow; each layer now runs past both ends of its link by at least most of its own width, so every end fades over
      // its width and neighbouring links blend; the head ends in a soft round glow. The user 2026-11-19)
      const run = (x0, y0, x1, y1, w, k, fn) => { const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ex = Math.max(L * k, w * 0.85); fn(x0 - ux * ex, y0 - uy * ex, x1 + ux * ex, y1 + uy * ex); };
      for (let i = 0; i < n - 1; i++) { const [x0, y0] = P[i], [x1, y1] = P[i + 1], dx = x1 - x0, dy = y1 - y0; if (dx * dx + dy * dy < 0.25) continue; const u0 = i / (n - 1), u1 = (i + 1) / (n - 1);
        const w1 = h * 0.3 * (0.35 + 0.65 * u1), w2 = h * 0.18 * (0.3 + 0.7 * u1), w3 = h * 0.06 * (0.4 + 0.6 * u1);
        run(x0, y0, x1, y1, w1, 0.125, (a, b, c, d) => Q.rbeam(a, b, c, d, w1, col, 0.5, u0, u1));
        run(x0, y0, x1, y1, w2, 0.16, (a, b, c, d) => Q.ebeam(a, b, c, d, w2, col, 0.8, 0.5 * u1, seed + i * 0.37, 3));
        run(x0, y0, x1, y1, w3, 0.125, (a, b, c, d) => Q.rbeam(a, b, c, d, w3, '#FFFFFF', 0.6, u0 * u0, u1 * u1)); }
      if (n > 1) { const [x1, y1] = P[n - 1]; Q.glow(x1, y1, h * 0.3, col, 0.3); Q.glow(x1, y1, h * 0.1, '#FFFFFF', 0.3); } }
  // where the layer draws it from: its screen place from its look (this frame's for the front, the last one's for the aura)
  function lookAt(X, S) { const L = S.look; if (!L) return null; const T = X.Tz(), r = L.r * T, h = r * 2.5, Xs = X.sx(L.x), Ys = X.sy(L.y) - L.z * T, foot = Ys + r * 0.75; return { Xs, foot, fy: foot - L.bob, h }; }
  if (typeof RiftEvil !== 'undefined' && !RiftEvil.__calMini) { const d0 = RiftEvil.draw; RiftEvil.draw = function (c, m) { if (m && m.calMini) { m.calMini.d0 = m.calMini.d0 || ((...a) => { const s = m.calMini; m.calMini = null; try { return d0(...a); } finally { m.calMini = s; } }); try { return drawMini.apply(null, arguments); } catch (e) { try { console.warn('cal mini draw', e); } catch (e2) {} return false; } } return d0.apply(this, arguments); }; RiftEvil.__calMini = 1; }

  /* ======================= the floor: setting the guardian at its gate, the leaders in the packs ======================= */
  /* the run's guardians and leaders (one record per running game) */
  const RUNS = new WeakMap();
  const RUN = X => { const k = X.g || X; let R = RUNS.get(k); if (!R) { RUNS.set(k, R = { guards: [], leaders: [] });
    R.drawn = () => R.gT != null && Math.abs(R.gT - k.t) < 0.3 && gpuOK(); }   // v404 EM: its tells are painted by the layer (its ground batch ran this last moment, on the GPU)
    return R; };
  /* arm a lesser boss the engine made as a corrupted Cocopet: its form, its numbers, its post (home), its gate */
  function arm(X, m, d, o) { o = o || {}; const E = evilOf(d), ex = o.gate || null, home = o.home || { x: m.x, y: m.y };
    m.x = home.x; m.y = home.y; m.wx = m.x; m.wy = m.y;
    m.evil = E; m.bname = d.name; m.glow = d.glow; if (RiftEvil.giant) RiftEvil.giant(m, d.r); else m.r = d.r; m.aggro = false; m.act = 'move'; m.cd = 1.5; m.calEased = true;   // v469 MB: 0.8 of d.r (RiftEvil.giant), drawn and hit
    if (!o.keep) { m.hp = m.maxhp = d.hp; m.dmg = d.dmg; m.xp = Math.round((m.xp || 30) * 1.5); }   // v469 MB: o.keep: a rift's own mini (Rift 04) keeps its numbers
    m.calMini = { def: d, evil: E, X, home, trail: [], woke: false, acts: {}, faceHome: ex && ex.x < home.x ? -1 : 1, sub: o.sub || null };
    const G = { m, def: d, home, exit: ex ? { x: ex.x, y: ex.y } : null, fall: null, self: o.self || null, onFall: o.onFall || null, wakeR: o.wakeR || 9.5, leash: o.leash || 16 };
    m.calMini.leash = G.leash; RUN(X).guards.push(G); return G; }
  /* its post: about two tiles in front of the gate, on the side the floor opens toward */
  function postBy(X, ex, m) { const M = X.M; let best = null, bs = -1e9; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, rr = 2.0 + (m ? m.r : 1.16), q = X.freeSpot(ex.x + Math.cos(a) * rr, ex.y + Math.sin(a) * rr, (m ? m.r : 1.16) * 0.8); if (!q || Math.hypot(q.x - ex.x, q.y - ex.y) > rr + 1.2 || Math.hypot(q.x - ex.x, q.y - ex.y) < rr - 1.0) continue;
      let open = 0; for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) { const tx = Math.floor(q.x) + xx, ty = Math.floor(q.y) + yy; if (tx >= 0 && ty >= 0 && tx < M.MW && ty < M.MH && M.G[ty * M.MW + tx] === T_FLOOR) open++; }
      const s = open - Math.hypot(q.x - M.start.x, q.y - M.start.y) * 0.05 + (q.y > ex.y ? 3 : 0); if (s > bs) { bs = s; best = q; } }
    return best || (m ? { x: m.x, y: m.y } : { x: ex.x, y: ex.y + 2 }); }
  /* the caldera's: riftFight (20m) has made the mini boss from S.mini in the farthest room; arm it, set it by the gate,
     a leader to every pack: the floor's own (packs 0..999) and the extra ones (1400..1899), on the field or held back */
  function guardians(X, self, H, key, C) {
    const d = DEF[key]; if (!d) return null;
    const m = X.mons.find(q => q.boss && !q.dead && q.bk && q.bk.id === d.id); if (!m) return null;
    // (the gate: riftFight's exit, found as riftFight finds it: X.rift is not yet set while the stage is being made)
    let ex = X.rift && X.rift.exit; if (!ex) { const M = X.M; let best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, dd = Math.hypot(cx - M.start.x, cy - M.start.y); if (dd > best) { best = dd; ex = X.freeSpot(cx, cy, 0.8) || { x: cx, y: cy }; } } }
    const G = arm(X, m, d, { gate: ex, home: ex ? postBy(X, ex, m) : null, self });
    m.calChamp = d.name;   // (the far room's guardian, for the probes that looked for the champion)
    C.guard = G; G.leaders = RUN(X).leaders;
    packLeaders(X, m, q => { const p = q.pack; return !(p == null || p < 0 || (p >= 1000 && p < 1400) || p >= 1900); });
    return m; }
  function pickLeader(list) { const ok = list.filter(q => q.type !== 'bomblarva' && MON[q.type]); if (!ok.length) return null; const cnt = {}; for (const q of ok) cnt[q.type] = (cnt[q.type] || 0) + 1; ok.sort((a, b) => (cnt[b.type] - cnt[a.type]) || ((MON[b.type].hp || 0) - (MON[a.type].hp || 0))); return ok[0]; }
  /* a monster made a pack leader: o.hp / o.dmg, or half of o.hpOf / o.dmgOf (a guardian, or { maxhp, dmg }); bigger, marked */
  function leader(X, q, o) { o = o || {}; if (!q || q.calLeader) return q; const ho = o.hpOf || o.of, dO = o.dmgOf || o.of;
    q.calLeader = true; q.hp = q.maxhp = Math.round(o.hp || (ho ? (ho.maxhp || ho.hp) * 0.5 : q.maxhp * 8)); q.dmg = o.dmg || (dO ? dO.dmg * 0.5 : q.dmg * 2); q.calEased = true; q.r *= o.rK || 1.5; q.spd *= 0.95; q.xp = (q.xp || 4) * 8; q.elite = false; q.leaderSeed = Math.random() * 10;
    RUN(X).leaders.push(q); return q; }
  /* one leader to every pack (by m.pack) among the monsters on the field and those held back; ok(q) picks which count */
  function packLeaders(X, mini, ok, o) { const all = X.mons.concat(X.g.reserve || []), packs = new Map();
    for (const q of all) { if (q.dead || q.boss || q.calTear || q.calLeader) continue; if (ok && !ok(q)) continue; const p = q.pack; if (p == null) continue; if (!packs.has(p)) packs.set(p, []); packs.get(p).push(q); }
    const out = []; for (const [, list] of packs) { const L = pickLeader(list); if (L) out.push(leader(X, L, Object.assign({ of: mini }, o || {}))); } return out; }
  /* the tears after the floor is clear (20zz5 tearTick): every other pour of each tear has a leader in it */
  function tearLeader(X, C, D, tr, list) { const G = C.guard; if (!G || !list || !list.length || tr.n % 2) return; const L = pickLeader(list); if (!L) return; leader(X, L, { of: G.m }); L.aggro = true; G.tearLeaders = (G.tearLeaders || 0) + 1;
    try { X.text(L.x, L.y - 1.6, 'A pack leader!', '#FFD27A', 13); } catch (e) {} }
  /* EVIL_MINI.spawn: a corrupted Cocopet anywhere (X: a rift stage's X, which has lesserBoss) */
  function spawn(X, o) { o = o || {}; const d = specOf(o), B = BOSSES.find(b => b.id === 'evilmini'), m = X.lesserBoss(o.x, o.y, 1, '', B); if (!m) return null;
    const G = arm(X, m, d, { gate: o.gate || null, home: o.home || { x: m.x, y: m.y }, onFall: o.onFall, sub: o.sub, wakeR: o.wakeR, leash: o.leash }); return m; }

  /* ======================= per frame: its fall, the seal on the gate, the plates, the leaders' marks ======================= */
  // (the monsters held back, as a set: made once a frame for both of the layer's passes)
  function resOf(X, R) { const rs = X.g.reserve; if (!rs || !rs.length) return null; if (R.resT !== X.g.t || R.resN !== rs.length) { R.resT = X.g.t; R.resN = rs.length; R.res = new Set(rs); } return R.res; }
  const gpuOK = () => { try { if (window.__CAL_GL === 0) return false; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return !!(F && F.usable()); } catch (e) { return false; } };
  function layer(X) {
    const me = X.me, R = RUN(X), sealed = G => G.self ? !G.self.done : !G.m.dead;
    const upd = (G, dt) => { const m = G.m;
        // (dark smoke curling off it now and then)
        if (!m.dead && !lowFx() && Math.random() < dt * 6 && Math.hypot(m.x - me.x, m.y - me.y) < 14) X.part({ kind: 'smoke', x: m.x + (Math.random() - 0.5) * m.r * 1.6, y: m.y - m.r * (0.5 + Math.random()), vx: (Math.random() - 0.5) * 0.4, vy: -0.9 - Math.random() * 0.6, life: 0.9, max: 0.9, size: 0.22 + Math.random() * 0.2, color: 'rgba(20,10,26,' });
        // a growl while it waits and the pet is near
        if (!m.dead && !m.aggro) { const dd = Math.hypot(m.x - me.x, m.y - me.y); G.growlT = (G.growlT || 2) - dt; if (dd < 14 && G.growlT <= 0) { G.growlT = 4.5; say(X, m, ['Turn back.', 'Grrr...', 'Leave.'][Math.floor(Math.random() * 3)]); }
          // it wakes when the pet comes close and can see it (a little before the engine's own nine tiles, so its own banner leads)
          if (dd < G.wakeR && !m.calMini.hold && X.los(m.x, m.y, me.x, me.y) && !me.dead) wake(m, m.calMini, X); }
        if (m.dead && !G.fall) startFall(X, G);
        if (G.fall) tickFall(X, G, dt);
        // its lunge's streak fades behind it
        { const S2 = m.calMini; if (S2 && S2.trailPts && S2.trailPts.length) { S2.dashing = (S2.dashing || 0) - dt; if (S2.dashing < 0) S2.trailPts.shift(); } }
        // its prism rays
        const S = m.calMini; if (S && S.beams) { for (const b of S.beams) { b.t += dt; if (!b.hit && b.t >= b.on && b.t < b.off && !m.dead) { if (X.inLine(b.x, b.y + b.rise, b.a, 9, b.w)) { b.hit = true; X.hurtPet(m.dmg * 1.4, m); } } if (b.t >= b.on && !b.boomed) { b.boomed = true; snd(X, 'zap'); X.shake && X.shake(3, 0.15); if (!S.gpuFx && X.beamFx) X.beamFx(b.x, b.y, b.a, 9, G.def.col); } } S.beams = S.beams.filter(b => b.t < b.off + 0.2 && !m.dead); }
      };
    return {
      update(dt) { for (const G of R.guards) upd(G, dt);
        // leaders that died: a small extra (a health orb)
        for (const L of R.leaders) if (L.dead && !L.calPaid) { L.calPaid = true; R.leadersDown = (R.leadersDown || 0) + 1; try { X.drop('hp', L.x, L.y); } catch (e) {} }
      },
      drawGround(c) { const T = X.Tz(), t = X.g.t, W = X.W(), Hh = X.H();
        // the seal of black fire on each guarded gate
        for (const G of R.guards) if (G.exit && (sealed(G) || G.fall && G.fall.t < 1.6)) sealArt(c, X.sx(G.exit.x), X.sy(G.exit.y), T, t, G);
        // the leaders' rings and auras: a dark ring under (2D, for a light floor); on the GPU a ring of ember light, embers on
        // the floor and dark smoke curling off them; else a dashed gold ring and a glow
        const res = resOf(X, R), vis = R.leaders.filter(L => !L.dead && !(res && res.has(L)) && Math.abs(X.sx(L.x) - W / 2) < W / 2 + T * 2 && Math.abs(X.sy(L.y) - Hh / 2) < Hh / 2 + T * 3);
        // (v398 M: the guardians' aura and the smoke at their feet ride in this batch too, from their last look)
        const gv = []; for (const G of R.guards) { const m = G.m, S = m && m.calMini; if (!S || m.dead || !S.look || Math.abs(S.look.t - t) > 0.25) continue; const A = lookAt(X, S); if (A && A.Xs > -A.h * 1.5 && A.Xs < W + A.h * 1.5 && A.foot > -A.h && A.foot < Hh + A.h * 1.5) gv.push([S, A]); }
        R.layerT = t;
        // (v404 EM: the guardians' tells, glow on the floor: the engine leaves them to this batch while it runs)
        const gok = gpuOK(); R.gT = gok ? t : null; if (R.tells) R.tells = R.tells.filter(z => z.life > 0); const tells = gok && R.tells ? R.tells : [];
        const Gq = vis.length || gv.length || tells.length ? gpu(c) : null; R.leaderGpu = !!Gq; R.layerFx = !!(Gq || gok);
        if (Gq) { for (const z of tells) paintTell(Gq.Q, X, z, t, T); } else if (tells.length) R.gT = null;
        if (Gq) { const sc = scOf(c); for (const [S, A] of gv) { const L = S.look, h = A.h, P2 = poolPic(h * 1.24, h * 0.4, sc); c.drawImage(P2, A.Xs - h * 0.62, A.foot - h * 0.2, h * 1.24, h * 0.4); S.pooled = t;   // (its dark pool first: the aura's light lies on it, as when it was drawn inline)
          gpuAura(Gq.Q, A.Xs, A.foot, A.h, t, L.k, S.def, L.seed); feetSmoke(Gq.Q, A.Xs, A.foot, A.h, t, L.seed); } }
        for (const L of vis) { const Xs = X.sx(L.x), gy = X.sy(L.y) + L.r * T * 0.72, R = L.r * T * 1.35; c.save();
          if (Gq) softRing(Gq.Q, Xs, gy, R, 0.36, Math.max(3, T * 0.12), '#14080E', 0.55, true);   // v404 EM: soft, laid on the GPU (was a 2D stroke under its light)
          else { c.strokeStyle = 'rgba(20,8,14,.55)'; c.lineWidth = Math.max(3, T * 0.11); c.beginPath(); c.ellipse(Xs, gy, R, R * 0.36, 0, 0, TAU); c.stroke(); }
          if (Gq) { const Q = Gq.Q, sd = L.leaderSeed; Q.ring(Xs, gy, R, '#FFB347', 0.8, Math.max(2, T * 0.07), 0.36); Q.ground(Xs, gy, R * 0.9, 0.55, 0.45, sd, 0.36, 0.7); Q.glow(Xs, gy - R * 0.4, R * 1.2, '#FF8A3D', 0.2 + 0.08 * Math.sin(t * 4 + sd), 0.6);
            for (let i = 0; i < 2; i++) { const ph = (t * 0.7 + i * 0.5 + sd) % 1; Q.smoke(Xs + (i ? 1 : -1) * R * 0.5, gy - R * (0.3 + 1.1 * ph), R * (0.28 + 0.2 * ph), 0.45 * (1 - ph), sd + i, '#160A16', 0); } }
          // (no GPU: the dark ring, the crown, the tag and the bar carry it)
          c.restore(); }
        gpuEnd(c, Gq);
      },
      drawOver(c) { const T = X.Tz(), t = X.g.t, W = X.W(), Hh = X.H(), res = resOf(X, R);
        const Gq = gpu(c), Q = Gq ? Gq.Q : null;   // (one GPU batch for the crowns' gems, the rays, the fall and (v398 M) the guardians' front light)
        if (Q) for (const G of R.guards) { const m = G.m, S = m && m.calMini; if (!S || m.dead || !S.look || S.look.t !== t || !S.gl || S.fxInline) continue; const A = lookAt(X, S); if (A) frontFx(Q, S, m.evil, A.Xs, A.fy, A.foot, A.h, t); }
        // the leaders: a crown, the tag and a bar
        for (const L of R.leaders) { if (L.dead || (res && res.has(L))) continue; const Xs = X.sx(L.x), Yg = X.sy(L.y), z = (L.z || 0) * T, r = L.r * T; if (Xs < -T * 2 || Xs > W + T * 2 || Yg < -T * 3 || Yg > Hh + T * 2) continue; if (Math.hypot(L.x - me.x, L.y - me.y) > 13) continue;
          const top = Yg - z - r * 1.25; crown(c, Xs, top - T * 0.08, Math.max(9, T * 0.32), t + L.leaderSeed, Q);
          const w = Math.max(30, r * 2.4), by = Yg - z - r - 10; c.fillStyle = 'rgba(0,0,0,.7)'; c.fillRect(Xs - w / 2 - 1, by - 1, w + 2, 7); c.fillStyle = '#FFB347'; c.fillRect(Xs - w / 2, by, w * clamp(L.hp / L.maxhp, 0, 1), 5); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(Xs - w / 2, by, w * clamp(L.hp / L.maxhp, 0, 1), 2);
          tag(c, 'PACK LEADER', Xs, top - T * 0.42 - 2, Math.max(9, Math.round(T * 0.22)), '#FFD27A'); }
        for (const G of R.guards) { const m = G.m;
        // the guardian's own plate over its head
        if (m && !m.dead) { const dd = Math.hypot(m.x - me.x, m.y - me.y); if (dd < 14) { const Xs = X.sx(m.x), Ys = X.sy(m.y) - (m.z || 0) * T, h = m.r * T * 2.5, top = Ys + m.r * T * 0.75 - h - T * 0.35; plate(c, Xs, top, T, m, G); } }
        // the gate's words while it is sealed
        if (G.exit && sealed(G) && m && !m.dead && Math.hypot(G.exit.x - me.x, G.exit.y - me.y) < 10) { const Xs = X.sx(G.exit.x), Ys = X.sy(G.exit.y); tag(c, `Defeat ${G.def.short} to open the gate`, Xs, Ys - T * 3.35, Math.max(11, Math.round(T * 0.3)), '#FFD9C8'); }
        if (m && m.calMini && m.calMini.beams && m.calMini.beams.length) drawBeams(c, X, m, G, Q);
        if (G.fall) drawFall(c, X, G, Q); }
        gpuEnd(c, Gq);
      },
    }; }
  /* the prism rays: a gathering glint at its mouth while the lane shows, then the ray (GPU soft beam, else 2D: a dark
     sheath, its violet body and a white core, so it reads on a light floor too) */
  function drawBeams(c, X, m, G, Q) { const T = X.Tz(), d = G.def;
    for (const b of m.calMini.beams) { const x0 = X.sx(b.x), y0 = X.sy(b.y), L = 9 * T, x1 = x0 + Math.cos(b.a) * L, y1 = y0 + Math.sin(b.a) * L;
      if (b.t < b.on) { const u = b.t / b.on; if (Q) { Q.glow(x0, y0, T * (0.3 + 0.6 * u), d.col, 0.5 + 0.5 * u); Q.star(x0, y0, T * 0.35 * u, u, '#FFFFFF'); } continue; } if (!Q) continue;
      const k = clamp(1 - (b.t - b.on) / (b.off - b.on + 0.2), 0, 1), w = T * (b.w || 1) * 0.5 * (0.6 + 0.4 * k);
      // (v404 EM: its dark sheath (so it reads on a light floor) laid on the GPU, soft, in three overlapping links: it was a 2D
      // stroke over the GPU light, its edges hard; then a halo, its body, a white core and a flare at its mouth)
      rayPaint(Q, x0, y0, x1, y1, w, k, T, d.col, d.core); }
  }
  function rayPaint(Q, x0, y0, x1, y1, w, k, T, col, core) { const L = Math.hypot(x1 - x0, y1 - y0) || 1, ca = (x1 - x0) / L, sa = (y1 - y0) / L, s0x = x0 - ca * w * 0.8, s0y = y0 - sa * w * 0.8, ddx = (x1 - ca * w * 2.2 - s0x) / 3, ddy = (y1 - sa * w * 2.2 - s0y) / 3;   // (the sheath thins out before the light does)
    for (let i = 0; i < 3; i++) stroke71(Q, s0x + ddx * (i - 0.125), s0y + ddy * (i - 0.125), s0x + ddx * (i + 1.125), s0y + ddy * (i + 1.125), w * (1.5 - 0.2 * i), '#140A1E', [0.6, 0.5, 0.32][i] * k);
    Q.rbeam(x0, y0, x1, y1, w * 2.4, col, 0.3 * k, 1, 0.5);
    Q.ebeam(x0, y0, x1, y1, w, col, 0.9, k, 3, 6);
    Q.rbeam(x0, y0, x1, y1, w * 0.28, '#FFFFFF', 0.75 * k, 1, 0.45);
    Q.glow(x0, y0, T * 0.8, col, 0.6 * k); Q.star(x0, y0, T * (0.3 + 0.25 * k), 0.8 * k, core || '#FFFFFF'); }
  const countLeft = X => X.mons.filter(q => !q.dead && !q.boss && !q.optional).length + ((X.g.reserve && X.g.reserve.length) || 0);
  // (v398 M: a tag is a picture made once per text, size, colour and sharpness, then laid down: no text drawn per frame)
  function tagPic(s, size, col, sc) { const key = 'tag|' + s + '|' + size + '|' + col + '|' + sc; let o = PICS.get(key); if (o) return o;
    const cv2 = document.createElement('canvas'), x = cv2.getContext('2d'), font = `900 ${size}px ${arcFont}`; x.font = font; const w = Math.ceil(x.measureText(s).width + 8), hgt = Math.ceil(size * 1.5 + 6), base = Math.ceil(size * 1.1 + 3);
    cv2.width = Math.ceil(w * sc); cv2.height = Math.ceil(hgt * sc); x.scale(sc, sc); x.font = font; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.lineJoin = 'round'; x.lineWidth = 3.2; x.strokeStyle = 'rgba(14,6,10,.85)'; x.strokeText(s, w / 2, base); x.fillStyle = col; x.fillText(s, w / 2, base);
    return pic(key, { cv: cv2, w, h: hgt, base }); }
  const scOf = c => { try { const tf = c.getTransform(); return Math.round(clamp(Math.hypot(tf.a, tf.b), 1, 3) * 4) / 4; } catch (e) { return 1; } };
  function tag(c, s, x, y, size, col) { const P2 = tagPic(s, size, col, scOf(c)); c.drawImage(P2.cv, x - P2.w / 2, y - P2.base, P2.w, P2.h); }
  /* a crown of black iron, three points, an ember gem in the middle one */
  // (v398 M: its iron and gem a picture made once per size; the gem's glow still lives on the GPU)
  function crownPic(s, sc) { const key = 'crown|' + Math.round(s * 4) + '|' + sc; let o = PICS.get(key); if (o) return o; const W = Math.ceil(s * 1.3), H = Math.ceil(s * 0.9), cv2 = document.createElement('canvas'); cv2.width = Math.ceil(W * sc); cv2.height = Math.ceil(H * sc); const x = cv2.getContext('2d'); x.scale(sc, sc); x.translate(W / 2, H - s * 0.12); crownArt(x, s); return pic(key, { cv: cv2, W, H, ax: W / 2, ay: H - s * 0.12 }); }
  function crown(c, x, y, s, t, Q) { const P2 = crownPic(s, scOf(c)); c.drawImage(P2.cv, x - P2.ax, y - P2.ay, P2.W, P2.H); const hgt = s * 0.62, gy = -hgt * 0.42;
    if (Q) { Q.glow(x, y + gy, s * 0.55, '#FF8A3D', 0.55 + 0.25 * Math.sin(t * 5)); Q.star(x, y + gy, s * 0.32, 0.7 + 0.3 * Math.sin(t * 7), '#FFE2A8'); Q.etongue(x, y - hgt, s * 0.14, s * 0.45, 0, '#FF6A1F', 0.7, 0.5, 7); } }
  function crownArt(c, s) { const w = s * 0.95, hgt = s * 0.62;
    c.beginPath(); c.moveTo(-w / 2, 0); c.lineTo(-w / 2, -hgt * 0.55); c.lineTo(-w * 0.27, -hgt * 0.2); c.lineTo(0, -hgt); c.lineTo(w * 0.27, -hgt * 0.2); c.lineTo(w / 2, -hgt * 0.55); c.lineTo(w / 2, 0); c.closePath();
    const g = c.createLinearGradient(0, -hgt, 0, 0); g.addColorStop(0, '#6E6A70'); g.addColorStop(1, '#2A2628'); c.fillStyle = g; c.fill(); c.strokeStyle = '#120C10'; c.lineWidth = Math.max(1.4, s * 0.1); c.lineJoin = 'round'; c.stroke();
    c.strokeStyle = '#FFC24A'; c.lineWidth = Math.max(1, s * 0.06); c.beginPath(); c.moveTo(-w / 2 + 1, -1.5); c.lineTo(w / 2 - 1, -1.5); c.stroke();
    const gy = -hgt * 0.42, gr = s * 0.13; c.beginPath(); c.moveTo(0, gy - gr * 1.3); c.lineTo(gr, gy); c.lineTo(0, gy + gr * 1.3); c.lineTo(-gr, gy); c.closePath(); c.fillStyle = '#FF5A2A'; c.fill(); c.strokeStyle = '#2A0A06'; c.lineWidth = 1; c.stroke();
  }
  /* the guardian's plate: its name, a bar in its element's colours with a lagging white, the phase marks */
  function plate(c, Xs, y, T, m, G) { const d = G.def, w = Math.max(96, T * 2.8), bh = Math.max(6, T * 0.14), f = clamp(m.hp / m.maxhp, 0, 1); if (G.show == null) G.show = f; G.show += (f - G.show) * 0.05; if (G.show < f) G.show = f;
    tag(c, d.name, Xs, y - bh - 5, Math.max(11, Math.round(T * 0.28)), '#FFD9C8');
    c.save(); c.fillStyle = 'rgba(14,6,12,.82)'; c.beginPath(); c.roundRect ? c.roundRect(Xs - w / 2 - 2, y - bh - 2, w + 4, bh + 4, 3) : c.rect(Xs - w / 2 - 2, y - bh - 2, w + 4, bh + 4); c.fill(); c.strokeStyle = rgba(d.col, 0.85); c.lineWidth = 1.4; c.stroke();
    if (G.show > f) { c.fillStyle = 'rgba(255,255,255,.75)'; c.fillRect(Xs - w / 2, y - bh, w * G.show, bh); }
    const g = c.createLinearGradient(Xs - w / 2, 0, Xs + w / 2, 0); g.addColorStop(0, '#C8203A'); g.addColorStop(1, d.col); c.fillStyle = g; c.fillRect(Xs - w / 2, y - bh, w * f, bh); c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(Xs - w / 2, y - bh, w * f, bh * 0.4);
    c.fillStyle = 'rgba(14,6,12,.9)'; for (const k of [1 / 3, 2 / 3]) c.fillRect(Xs - w / 2 + w * k - 1, y - bh, 2, bh); c.restore(); }
  /* the seal on the gate: a disc of black fire across its opening, a ring of embers, cracks that blaze as it weakens */
  function sealArt(c, Xs, Ys, T, t, G) { const m = G.m, f = m.dead ? 0 : clamp(m.hp / m.maxhp, 0, 1), fall = G.fall ? clamp(G.fall.t / 1.6, 0, 1) : 0, T2 = T * 1.4, ih = T2 * 1.45, iw = T2 * 0.61, cy = Ys - ih * 0.5, a = 1 - fall;
    if (a <= 0.01) return; c.save(); c.globalAlpha = a;
    c.beginPath(); c.ellipse(Xs, cy, iw * 0.92, ih * 0.5, 0, 0, TAU); const g = c.createRadialGradient(Xs, cy, 0, Xs, cy, ih * 0.55); g.addColorStop(0, 'rgba(60,16,40,.85)'); g.addColorStop(0.6, 'rgba(18,6,20,.92)'); g.addColorStop(1, 'rgba(8,2,10,.6)'); c.fillStyle = g; c.fill();
    c.strokeStyle = rgba(FRACTURE, 0.6 + 0.3 * Math.sin(t * 3)); c.lineWidth = Math.max(2, T * 0.07); c.stroke();
    // a burning sigil: two crossed bars and a ring
    c.strokeStyle = rgba(LAVA_HI, 0.75); c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.arc(Xs, cy, ih * 0.22, 0, TAU); c.moveTo(Xs - iw * 0.6, cy - ih * 0.3); c.lineTo(Xs + iw * 0.6, cy + ih * 0.3); c.moveTo(Xs + iw * 0.6, cy - ih * 0.3); c.lineTo(Xs - iw * 0.6, cy + ih * 0.3); c.stroke();
    // its cracks, more as the guardian weakens
    const n = Math.floor((1 - f) * 6) + (fall > 0 ? 6 : 0); c.strokeStyle = rgba('#FFF2C8', 0.85); c.lineWidth = 1.5; for (let i = 0; i < n; i++) { const an = i * 2.1 + 0.4; c.beginPath(); c.moveTo(Xs, cy); c.lineTo(Xs + Math.cos(an) * iw * 0.45, cy + Math.sin(an) * ih * 0.25); c.lineTo(Xs + Math.cos(an + 0.3) * iw * 0.85, cy + Math.sin(an + 0.3) * ih * 0.45); c.stroke(); }
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * (0.25 + 0.1 * Math.sin(t * 2.5)); blitSized(c, glowSprite('#FF5A2A'), Xs - iw * 1.3, cy - ih * 0.7, iw * 2.6, ih * 1.4); c.restore(); }

  /* ======================= its fall: the cracks blaze, the corruption burns off into light, the shell shatters =======================
     (the engine has already given the lesser boss's reward; this is the picture: 2.2 s) */
  function startFall(X, G) { const m = G.m, S = m.calMini, LF = S && S.lastFrame; G.fall = { t: 0, x: m.x, y: m.y, face: m.eface || 1, burst: false, sealed: false };
    if (LF && LF.cv) { const [o] = [document.createElement('canvas')]; o.width = LF.cv.width; o.height = LF.cv.height; o.getContext('2d').drawImage(LF.cv, 0, 0); G.fall.cv = o; G.fall.sc = LF.sc; G.fall.sz = LF.sz; G.fall.cw = LF.cw || LF.sz; G.fall.ch = LF.ch || LF.sz; G.fall.oy = LF.oy; G.fall.h = LF.h / X.Tz(); }
    try { X.banner(`${G.def.short.toUpperCase()} FALLS`, 'The black fire leaves it: the gate is free', G.def.col, 2.6, true); X.g.slowT = Math.max(X.g.slowT || 0, 0.6); X.flash(0.35, '#FFFFFF'); } catch (e) {}
    if (G.onFall) try { G.onFall(m, G); } catch (e) {}
    snd(X, 'hum'); }
  function tickFall(X, G, dt) { const F = G.fall; F.t += dt;
    if (!lowFx() && F.t < 1.1) for (let i = 0; i < 2; i++) X.part({ kind: Math.random() < 0.5 ? 'ember' : 'smoke', x: F.x + (Math.random() - 0.5) * 1.1, y: F.y - 0.2 - Math.random() * 1.2, vx: (Math.random() - 0.5) * 1.2, vy: -1.6 - Math.random() * 1.6, life: 0.8, max: 0.8, size: Math.random() < 0.5 ? 4 : 0.3, color: Math.random() < 0.5 ? FRACTURE : 'rgba(18,8,24,' });
    if (F.t >= 1.15 && !F.burst) { F.burst = true; const T = X.Tz(); let ok = false;
      try { if (typeof BREAK_FX !== 'undefined' && F.cv) { // the shell, cut from its last picture: sprite px per tile = TS x SK (as BREAK_FX reads them)
          const P = (T / (X.g.zoom || 1)) * Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || window.devicePixelRatio || 1), k = P / (T * F.sc), w = Math.max(8, Math.round(F.cv.width * k)), h = Math.max(8, Math.round(F.cv.height * k)), o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(F.cv, 0, 0, w, h);
          ok = BREAK_FX.burst(X, F.x, F.y, { sprite: { cv: o, ax: w / 2, ay: F.oy * F.sc * k }, mat: 'blackfire', hot: '#FF5A2A', size: Math.max(1.4, F.h || 1.4), shake: 1.2 }); } } catch (e) { ok = false; }
      X.boom(F.x, F.y - 0.6, 2.6, '#1A0A22', G.def.col, { n: 34, shake: ok ? 4 : 12, smoke: 10 }); X.ring(F.x, F.y, 0.3, 4.2, 0.6, '#FFFFFF', 0.35); X.ring(F.x, F.y, 0.3, 3.2, 0.5, G.def.col, 0.4); X.light && X.light(F.x, F.y, 4, 0.6);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; X.part({ kind: 'star', x: F.x, y: F.y - 0.7, vx: Math.cos(a) * 3, vy: Math.sin(a) * 3 - 2.5, life: 1.1, max: 1.1, size: 4, color: i % 2 ? '#FFFFFF' : G.def.core }); }
      snd(X, 'crash'); }
    if (F.t >= 1.6 && !F.sealed && G.exit) { F.sealed = true; X.boom(G.exit.x, G.exit.y - 1.4, 1.6, '#2A0E1E', '#FFC24A', { n: 20, shake: 5, smoke: 4 }); X.ring(G.exit.x, G.exit.y, 0.3, 2.6, 0.5, '#8FE0A6', 0.35); } }
  function drawFall(c, X, G, Q) { const F = G.fall; if (F.t > 2.2) return; const T = X.Tz(), Xs = X.sx(F.x), Ys = X.sy(F.y), u = clamp(F.t / 1.15, 0, 1), hp = (F.h || 1.4) * T;
    // on the GPU: the corruption leaving it (soot-dark smoke boiling up off it, its black fire guttering out), the light
    // rising through it, a ring of light at the burst and sparkles drifting up after
    if (Q) { const k = 1 - u; for (let i = 0; i < 5; i++) { const ph = (F.t * 0.9 + i * 0.2) % 1; Q.smoke(Xs + (i - 2) * hp * 0.14, Ys - hp * (0.2 + 0.9 * ph), hp * (0.18 + 0.2 * ph), (F.t < 1.4 ? 0.6 : 0.6 * (2.2 - F.t) / 0.8) * (1 - ph), 30 + i, '#140A1C', 0); }
      if (F.t < 1.15) for (let i = 0; i < 5; i++) Q.etongue(Xs + (i - 2) * hp * 0.16, Ys, hp * 0.07, hp * (0.5 * k + 0.1), 0, i % 2 ? '#7A3AE0' : FRACTURE, 0.6, 0.6 * k + 0.1, 40 + i);
      Q.glow(Xs, Ys - hp * 0.5, hp * (0.5 + 0.7 * u), G.def.core, F.t < 1.15 ? 0.7 * u : 0.7 * clamp((2.2 - F.t) / 1.05, 0, 1));
      if (F.t > 1.15 && F.t < 1.8) { const w = (F.t - 1.15) / 0.65; Q.ewave(Xs, Ys, T * (0.6 + 3.4 * w), G.def.col, 0.8, 1 - w, 5, 0.42, 0.2); Q.ring(Xs, Ys - hp * 0.4, T * (0.5 + 3 * w), '#FFFFFF', 0.8 * (1 - w), T * 0.08); }
      if (F.t > 1.15) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, w = F.t - 1.15; Q.star(Xs + Math.cos(a) * T * (0.4 + w * 1.4), Ys - hp * 0.5 - w * T * 1.6 + Math.sin(a) * T * 0.5, T * 0.16, clamp(1 - w / 1.05, 0, 1), i % 2 ? '#FFFFFF' : G.def.core); } }
    // its body (the last GPU frame of it), the corruption burning off it into light
    if (F.cv && F.t < 1.15) { const shake = (Math.random() - 0.5) * T * 0.06 * u, x0 = Xs - F.sz / 2 + shake, y0 = Ys + 0.75 * (F.h * T / 2.5) - F.oy;
      const [W2, w2] = cv('fall', F.cv.width, F.cv.height); w2.drawImage(F.cv, 0, 0); w2.globalCompositeOperation = 'source-atop'; w2.fillStyle = `rgba(255,${Math.round(220 + 35 * u)},${Math.round(190 + 65 * u)},${(u * 0.85).toFixed(3)})`; w2.fillRect(0, 0, W2.width, W2.height);
      c.save(); c.globalAlpha = 1 - u * 0.15; c.drawImage(W2, x0, y0, F.cw || F.sz, F.ch || F.sz); c.restore(); } }   // (v404 EM: at its own frame's size: it was laid square, so stretched)

  /* ======================= v398 M: the loading screen's warm-up =======================
     So that nothing of a guardian or a leader is made for the first time mid-fight, the stage's loading pass (20b
     preloadMore: Rf.preload) is handed these small jobs (each a few ms; the loader spreads them over its frames):
       - each guardian's GPU body: PetGL drawn at the sharpness the fight draws it, once with each face it shows (its
         snarl, its roar in a tell, its daze when struck): the layer cut and every face's picture are made now, in the
         background between the loader's frames, then drawn again to be sure they are in;
       - Nidhogg's painter: a dummy draw of every kind of quad the guardians and leaders use, so its shaders are compiled
         and its buffers sized;
       - the pictures of the layer: the pool under a guardian, the crowns, the tags and names, at their sizes;
       - each brood kind on the floor (on the field and held back) in every pose its own behaviour sets (m.mode, read from
         the behaviour itself), at the sizes it is drawn (its own, and a leader's): the engine warms only the pose a monster
         is in when the floor loads, and every new pose was a paint mid-fight.
     EVIL_MINI.warm(P, specs) -> jobs (specs: spawn options of guardians that appear later, e.g. a duel's pair). */
  const MODES = new Map();
  function modesOf(type) { if (MODES.has(type)) return MODES.get(type); const out = new Set(); try { const f = DunAI.mon[type]; if (f) { const src = String(f); let mm; const re = /\.mode\s*=\s*'([^']+)'/g; while ((mm = re.exec(src))) out.add(mm[1]); const re2 = /\.mode\s*=\s*'([a-z]+)'\s*\+/g; while ((mm = re2.exec(src))) for (let i = 1; i <= 3; i++) out.add(mm[1] + i); } } catch (e) {} const L = [...out].slice(0, 8); MODES.set(type, L); return L; }
  const POSES = [{ eyes: 'normal', mouth: 'smile', brows: 'angry' }, { eyes: 'normal', mouth: 'open', brows: 'angry' }, { eyes: 'dizzy', mouth: 'o', brows: 'angry' }];
  function warmBody(E, h, sc) { if (typeof PetGL === 'undefined' || window.__calMini2D || window.__noPetGL) return [];
    const cv2 = document.createElement('canvas'), kk = h / E.bodyTop, side = Math.ceil(h * 2.4 * sc); cv2.width = side; cv2.height = side;
    const one = face => () => { const x = cv2.getContext('2d'); x.setTransform(sc, 0, 0, sc, side / 2, side * 0.85); try { PetGL.draw(x, E.form, kk, { t: 0, yaw: 0.3, face, footL: [0, 0], footR: [0, 0], armL: 0, armR: 0, wing: 0, tail: 0 }, { lite: true }); } catch (e) {} x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, side, side); };
    const jobs = []; for (let round = 0; round < 3; round++) for (const f of POSES) jobs.push(one(f));   // (rounds: the layers come in between the loader's frames)
    return jobs; }
  function warmFx() { return [() => { if (!gpuOK()) return; const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 96; const x = cv2.getContext('2d'), G = gpu(x); if (!G) return; const Q = G.Q;
    Q.smoke(30, 40, 12, 0.5, 1, '#120818', 0); Q.etongue(40, 60, 4, 12, 0, '#8A3AFF', 0.7, 0.6, 2); Q.glow(50, 50, 14, '#FF5A2A', 0.4, 0.5); Q.ground(48, 70, 16, 0.6, 0.4, 3, 0.32, 0.8); Q.star(40, 30, 6, 0.8, '#FFD0C8'); Q.ring(48, 48, 20, '#FFB347', 0.6, 3, 0.36); Q.ebeam(10, 10, 80, 80, 6, '#B784FF', 0.9, 0.6, 3, 6); Q.ewave(48, 48, 20, '#9FDFFF', 0.8, 0.5, 5, 0.42, 0.2);
    gpuEnd(x, G); }]; }
  function warmPics(T, sc, guards) { const jobs = [() => { tagPic('PACK LEADER', Math.max(9, Math.round(T * 0.22)), '#FFD27A', sc); crownPic(Math.max(9, T * 0.32), sc); }];
    for (const g of guards) jobs.push(() => { const d = g.def, h = g.r * T * 2.5; poolPic(h * 1.24, h * 0.4, sc); tagPic(d.name, Math.max(11, Math.round(T * 0.28)), '#FFD9C8', sc); tagPic(`Defeat ${d.short} to open the gate`, Math.max(11, Math.round(T * 0.3)), '#FFD9C8', sc); });
    return jobs; }
  function warmBrood(P, list) { if (!P || typeof DunArt === 'undefined') return []; const jobs = [], seen = new Set(), k = P.k || 1, TS0 = P.T || 40;
    for (const q of list) { if (!q || q.dead || q.boss || !MON[q.type]) continue; const rpx = q.r * TS0 * k, key = q.type + '|' + Math.round(rpx) + '|' + q.color; if (seen.has(key)) continue; seen.add(key);
      const nf = (DunArt.NF && DunArt.NF[q.type]) || 4; for (const md of modesOf(q.type)) for (let f = 0; f < nf; f++) jobs.push(() => { try { DunArt.monSprite(q.type, rpx, (f + 0.5) / nf, q.color, md, false); } catch (e) {} }); }
    return jobs; }
  function warm(P, specs) { if (!P || (typeof window !== 'undefined' && window.__MINI_WARM === 0)) return []; const jobs = [], T = P.Tz ? P.Tz() : (P.T || 40), sc = Math.min(2, P.k || 1), guards = [];
    for (const m of (P.mons || [])) if (m && m.calMini && !m.dead && m.evil) guards.push({ E: m.evil, r: m.r, def: m.calMini.def });
    for (const o of specs || []) { try { const d = specOf(o); guards.push({ E: evilOf(d), r: d.r * (RiftEvil.SIZE || 1) /* v469 MB */, def: d }); } catch (e) {} }
    const anyLeader = (P.mons || []).some(m => m && m.calLeader) || (P.reserve || []).some(m => m && m.calLeader);
    if (!guards.length && !anyLeader) return [];
    // (each guardian's first face started at once, as the loading pass asks: its layers build in the background while the
    // rest of the pass runs)
    for (const g of guards) { const wb = warmBody(g.E, g.r * T * 2.5, sc); if (wb.length) { try { wb[0](); } catch (e) {} } jobs.push(...wb.slice(1)); }
    jobs.push(...warmFx(), ...warmPics(T, sc, guards), ...warmBrood(P, (P.mons || []).concat(P.reserve || [])));
    // (and the faces again, last: by now their layers have had the loader's frames to come in)
    for (const g of guards) jobs.push(...warmBody(g.E, g.r * T * 2.5, sc).slice(0, 3));
    return jobs; }
  // (every rift's loading pass asks it: it finds the guardians and leaders on the floor, or does nothing)
  { const hook = Rf => { if (!Rf || Rf.__miniWarm) return; Rf.__miniWarm = 1; const o = Rf.preload; Rf.preload = P => { let a = []; try { a = (o ? o(P) : null) || []; } catch (e) { a = []; } let b = []; try { b = warm(P); } catch (e) { b = []; } return a.concat(b); }; };
    try { for (const Rf of RIFTS) hook(Rf); } catch (e) {} }

  /* ======================= wiring ======================= */
  CAL.guardians = guardians; CAL.tearLeader = tearLeader; CAL.MINI = DEF;
  // (each dungeon's mini boss, made by riftFight (20m) from S.mini, and the guardians' layer on top of 20zz5's extra; the
  // goal says what the gate waits for)
  { const Rf = RIFT_BY_ID.caldera, keys = ['ashen', 'rimeforge', 'glassheart']; let fi = 0;
    if (Rf) Rf.miniEvil = id => (BY_ID[id] ? evilOf(BY_ID[id]) : null);   // v398 M: riftFight (20m) takes the guardian's own look instead of making a random one
    if (Rf) for (const S of Rf.stages) { if (S.kind !== 'fight') continue; const key = keys[fi++], d = DEF[key]; if (!d) continue; S.mini = d.id; S.calKey = key;
      const ex0 = S.extra; S.extra = (X, self, H) => { const xm = ex0 ? ex0(X, self, H) || {} : {}; const C = CAL.ctx ? CAL.ctx(X) : null; if (!C || !C.guard) return xm; const gm = layer(X), G = C.guard; let wrapped = false;
        return { update(dt) { if (xm.update) xm.update(dt); gm.update(dt);
            if (!wrapped && self.mod && self.mod.goal) { wrapped = true; const g0 = self.mod.goal; self.mod.goal = () => { if (self.done || G.m.dead) return g0(); const left = countLeft(X); return left > 0 ? `${left} left · Defeat ${G.def.short} to open the gate` : `Defeat ${G.def.short} to open the gate`; }; } },
          drawGround(c) { if (xm.drawGround) xm.drawGround(c); gm.drawGround(c); }, drawOver(c) { if (xm.drawOver) xm.drawOver(c); gm.drawOver(c); } }; }; } }
  return { DEF, PRESET, spawn, arm /* v469 MB: Rift 04 arms its own minis (20s7) */, leader, packLeaders, layer, guards: X => RUN(X).guards, leaders: X => RUN(X).leaders, hpFor, dmgFor, evilOf, specOf, drawMini, guardians, tearLeader, warm, modesOf, fx: { paintTell, shotPaint, softRing, rayPaint, streakPaint } };   // (v404 EM: fx for the pictures' studio)
})();
const EVIL_MINI = CAL_MINI;
if (typeof self !== 'undefined') self.EVIL_MINI = EVIL_MINI;   // (tests, and other rifts' files that load before this one, at run time)
