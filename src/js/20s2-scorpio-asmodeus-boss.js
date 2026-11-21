/* ---------- (v445 SB) The Gate of Scorpio's guardian: ASMODEUS, THE FESTER, as a boss ----------
   Beyond the Amber Vigil's great door (20s, its arena and its door are the gate's), the Scorpio Anima itself turned against the pet: the
   same model (ASMODEUS_GL, 02f6, its L7 form, The Seventh Sin, posed every frame; without a real GPU the Scorpio Anima's existing art) and
   the same powers' poses and pictures, called into rather than copied (20g5-asmodeus-moves.js: ASMODEUS_MOVES.poseFor / easePose for every
   power's pose, ultPose and UT for The Seventh Sin, a private ASMODEUS_MOVES.create instance (noAuto, stand, no Anima of its own) for its
   effect layer: stinger trails, crystal bursts, shards, the Labyrinth's web, the rising crystal, warps, decoy shells, the Seven Stings, the
   Testament; inst.bodyLight for the light over the body), aimed at the pet. Patience, deception and binding where Samael was momentum and
   Belial weight: it does not kill quickly, it marks the pet and lets the marks ripen.
   VENOM DEBT ON THE PET (the fight's thread): its stingers, threads, decoys and crystal blades lay stacks of Venom Debt on the pet (0..7,
   the scorpion seal over its head, one rune lit a stack, the gauge under the health bar). Each stack ticks a little venom; a stack fades
   after TUNE.debtFade s without a new one. At seven the seal RIPENS (it brightens, its heartbeat quickens, TUNE.sealT s) and then
   detonates for a heavy blow, leaving a brand of TUNE.sealLeft stacks, unless the pet cleanses it first:
     - Vigil Starlight: pools of cool violet-white light that well up on the floor while the pet carries debt (always one at once when the
       seal ripens, somewhere it can reach); standing in one for TUNE.poolStand s burns every stack away;
     - the bared Crucible: while Asmodeus is EXPOSED (below), every blow struck from in front of it burns one stack away.
   Debt also feeds Scarlet Rupture's blades and The Seventh Sin's Testament: cleansing before them matters.
   Its powers (tells glow only: marks, filaments, bands and pools of light over soft dark underlays; no red, no numbers):
     Sevenfold Perdition  it anchors its legs, its tails rise and light one by one, and each stinger falls in turn on the pet's place (a
                          rose-gold mark of light under the pet first, locked a moment before the blow): a blow and a stack each. Phase
                          III ends in all seven impaling the pet's place at once. Then THE PINNED STINGER: its last blade sticks fast in
                          the floor near it for TUNE.pinT s, a pale-gold glint round it: strike it (its own small health; half of what
                          it takes reaches Asmodeus too) to BREAK that stinger for good: it shatters, Asmodeus is wounded and EXPOSED,
                          and one tail fewer means one stinger fewer in every Perdition, one thread fewer in every Labyrinth and one
                          strike fewer in The Seventh Sin. The outer tails are pinned (and broken) first, pair by pair, the centre last.
     Tail Lash            (when the pet crowds it) a quick glint swept across the floor before it, then one tail lashes the arc: a blow
                          and a stack.
     Scarlet Rupture      its tails curve in and a great ruby crystal grows over its head, venom pouring up every channel; crystal
                          spines rise round the arena (cover: their lee glows pale while it grows). Break the crystal before it is
                          grown (it has its own health: Asmodeus takes a heavy wound and is EXPOSED), or take cover: it shatters into
                          rings of crystal blades (1 / 2 / 3 by phase) that sweep the whole arena; a spine's lee (or a column's, when
                          the arena gives some) shelters; each blade that lands is harder for every stack the pet carries, and adds one.
                          Phase III ends with an eruption under the pet's place (its reach lit first).
     Crimson Labyrinth    (phase II on) it rises tall and ruby threads run out from its tails across the arena from a hub to the rim,
                          one for each stinger it still has, cutting the floor into cells; the web turns slowly and draws the pet
                          toward its heart for TUNE.webDur s while its other powers go on. A thread touched binds (a blow, a stack and
                          a slow). Each thread has a dark gap to slip through and an amber knot where it is anchored at the rim:
                          strike the knot and the thread snaps.
     Eclipse Molt         (phase II on) it stops dead, its tails fold round it, its armour cracks and it vanishes; shells of itself (2
                          / 3) rise round the pet, and the real one among them. The real one breathes, casts a shadow and its Crucible
                          beats; the shells do not. Strike a shell: it cracks and bursts (step back: a blow and a stack round it).
                          Strike the real one: it staggers out of the molt, EXPOSED. Find nothing in time and it strikes from behind
                          the pet (a violet glint at the spot first: step away) while its shells burst.
   EXPOSED: (a broken stinger, a broken crystal, the real one found) it reels, its Crucible opens and bares the heart (TUNE.exposeT s: it
   takes the engine's stunned-boss x1.5, and every blow struck from in front of it burns a stack of Debt away; the pale arc lit before it).
   Three phases (I The Veiled Predator 100-66%, II The Crimson Sovereign 66-33%, III The Seventh Sin 33-5%), each break a roar and a
   gapped ring of crystal blades; phase II opens with a Labyrinth, phase III with a Labyrinth and an Eclipse Molt. At 5% THE SEVENTH SIN
   (its own six beats, UT; it cannot be harmed through it): seven seals light on the floor round the arena (refuges: pools of pale light,
   a column over each); then the stingers fall one by one on the pet's place (each a rose-gold mark first: keep moving), the seventh with
   all of them (a larger mark); then the Crimson Testament: outside a seal a crushing share of the pet's health, more for every stack it
   carries (never lethal from full); in a seal, only the debt it carries detonates. A broken stinger never falls. Then the Last Whisper:
   it dissolves, legs first, the Crucible last, a single ruby spark, and X.winStage() completes the gate and unlocks Asmodeus.
   Every number is in TUNE (below, with how it was set against Ifrit and Samael). The engine's machinery as Samael's (20zza2): an intro
   (the Scorpio sigil, its filaments, the cocoon rising and cracking, the stingers unfolding, the crown, the name banner "ASMODEUS" / "The
   Fester"), stacked health bars with phase pips, the Debt gauge and the seven stingers (m.ownBar), a goal line, healing light shaken
   loose by blows, the boss immunities (m.boss, m.still, m.fiend), a camera framing the whole body and its crown, sounds. The parts the pet
   strikes (the pinned stinger, the crystal, the knots, the shells) are the engine's passive objects (fobj: hit like a monster, never
   moving, never drawn by the engine, no reward), taken off the stage with the fight.
   SCORPIO_BOSS: begin(X, H, self, A) (the gate calls it as the arena's door seals: A = { cx, cy, r, rx, ry, sen?, inside(x, y), door?,
   pillars?: [{ x, y, r }] (cover for the Rupture's blades), heat?(k) / mood?(k) (the floor's light, 0..2) }), update(dt), drawGround(c) /
   drawOver(c) (nothing: the body, its ground and its sky are the gate's own objects, H.obj, drawn in depth order), cam(), goal(),
   hideHud(), onBossDeath(m), active(), stop(), TUNE, test (the harness's handles). The same contract as ARIES_BOSS.
   Clean-up (stop, the defeat, the pet's death, the stage's end): no debt or slow left on the pet, no pad on its health, its parts off the
   stage, its objects off the stage, its effect layer stopped and Asmodeus's GPU buffers freed (ASMODEUS_GL.release through the
   instance's stop). Frame-rate independent: every event is a crossing of its own clock, every moving blow a swept test. */
const SCORPIO_BOSS = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const LQ = () => (lowFx() ? 0.5 : 1);
  // (its tells' colours: light, never red: rose-gold, amber, violet, pale; the refuges and the starlight a cool violet-white; a soft dark underlay)
  const COL = { rose: '#FF9AC0', gold: '#FFC24D', amber: '#FFB45A', violet: '#B983F5', pale: '#FFE6EE', white: '#FFF4F8', cool: '#DCD2FF', star: '#C9B8FF', pink: '#FF8AA8', knot: '#FFD27A' };
  const UNDER = '#12060E';
  /* ================= the tuning =================
     Measured as Samael was (tests/_sx-tune.js, after tests/_sb-tune.js): a level-10 bot pet (~200 health) held still at 4 and at 6 tiles
     south of the boss (never dodging, never cleansing, never sheltering, never breaking a part), 60 raw damage every 0.25 s into the
     boss (240 a second, D.hitMon, no crits), the game stepped at 1/30 s, to the end of its fall. Against Ifrit (the Caldera's last boss)
     and Samael (the Gate of Aries, v444: 660000 in 36 bars). Health as Samael's; its pressure comes from its mechanics (the debt that
     ripens, the web, the shells), not from heavier blows (its unit blow is Samael's).
     Ifrit: 686 s to kill at 4 tiles, 671 at 6; 172 damage a minute at 4, 77 at 6. Samael (the same run): 2288 s at 4, 2349 at 6; 190 a
     minute at 4, 120 at 6. Asmodeus (these numbers, on its own gate): 2439 s at 4, 2575 at 6 (1.07x / 1.10x Samael, 3.56x / 3.84x Ifrit;
     its phases at ~890 s and ~1720 s, The Seventh Sin at ~2425 s); 215 a minute at 4 and 214 at 6 (1.13x / 1.78x Samael: its stingers
     find the pet at any range, so standing back does not help, moving does; pooled 1.38x Samael, 1.72x Ifrit); a mean blow of 3.6 (the
     venom's small ticks), the largest 27 (the seal). A fight: ~190 Perditions, ~75 Ruptures, ~32 webs, ~43 molts, ~68 seals burst on a
     pet that never cleanses. On the Dunes' own floors the rift's foe factors (foeK: x2 health, x2 blows) would apply as to all its foes;
     a gate has none, so at the Amber Sanctum these numbers stand. */
  const TUNE = {
    hp: 660000, bars: 36,           // its health, absolute (x the rift's main-boss factor foeK.boss, 1 at the gate)
    dmg: 19,                        // a unit blow, absolute (m.dmg); every blow a multiple of it
    cuts: [1, 0.66, 0.33], sinAt: 0.05,   // the phases' thresholds (of its health); The Seventh Sin at the last
    size: 6.0, keep: 4.4, spd: [1.4, 1.55, 1.7], pad: 2.6, homeY: -1.0, lean: 0.35, leanMax: 2.2,   // drawn size (tiles tall: its L7 form at a boss's scale), the distance it keeps, its glide (tiles/s), its distance from the rim, its place
    intro: 5.6, idle: [1.6, 1.35, 1.1], idleEnd: 0.75,   // the intro (s); the breath between powers by phase, shortened as a phase runs out
    heal: 0.045, healCd: 1.1,       // healing light shaken loose: an orb every this share of a bar dealt
    // Venom Debt on the pet: the most stacks, the venom a stack ticks (x unit, every debtTick s), how long a stack lasts without a new one; the seal: how
    // long it ripens, its blow (x unit), the brand it leaves; Vigil Starlight: its radius, how long the pet stands in it, when it wells (debt at least),
    // the pause between pools, how long one lasts
    debtMax: 7, debtTick: 1.0, debtK: 0.005, debtFade: 7.0, sealT: 3.2, sealK: 1.4, sealLeft: 1,
    poolR: 1.15, poolStand: 0.5, poolAt: 4, poolCd: 9, poolLife: 12,
    // EXPOSED: how long, the cone before it where a blow is a blow on the Crucible, the stacks one such blow burns away
    exposeT: 3.2, exposeCone: 1.2, exposeCleanse: 1,
    // Sevenfold Perdition: strikes by phase (minus broken stingers, at least 2), the wind-up, the gap between strikes, each mark's tell (locked
    // lockT before the blow), its radius, the blow (x unit); phase III's seven at once (tell, radius, blow, stacks); the pinned stinger (how long it
    // stays, its reach from Asmodeus, its health, the share of what it takes that reaches Asmodeus, the wound when it breaks (of its health))
    pdN: [3, 4, 5], pdWind: 0.95, pdGap: [0.6, 0.5, 0.45], pdTell: 0.85, pdLock: 0.3, pdR: 1.25, pdK: 0.4, finTell: 1.0, finR: 2.3, finK: 1.0, finStk: 2,
    pinT: 3.6, pinReach: 4.0, stingHP: 1500, stingFwd: 0.5, stingBreak: 0.012,
    // Tail Lash: how close the pet must be (tiles from its edge), the tell, the arc's reach and half-angle, the blow, the pause before another
    lashNear: 2.2, lashTell: 0.55, lashR: 3.6, lashArc: 0.95, lashK: 0.7, lashCd: 3.5,
    // Scarlet Rupture: the crystal's growth (s, by phase), its health (by phase), the wound when it breaks; spines (how many, their radius, how far out);
    // the rings (by phase: their reach, speed, the gap between them, the blow, the extra a stack of debt adds); phase III's eruption (tell, radius, blow)
    ruGrow: [4.6, 4.4, 4.2], ruHP: [1100, 1250, 1400], ruBreak: 0.02, spines: 4, spineR: 0.75, spineOut: 5.2,
    ruN: [1, 2, 3], ruRange: 14, ruSpd: 8.5, ruGap: 0.55, ruK: 0.7, ruDebtK: 0.12, erTell: 1.0, erR: 2.6, erK: 1.2,
    // Crimson Labyrinth: how long the web holds (by phase), the threads' turn (rad/s), the pull toward its heart (tiles/s), a touch (blow, the slow,
    // the pause before the same web binds again), a thread's gap (its width, tiles), a knot's health
    webDur: [0, 8, 11], webSpin: [0, 0.16, 0.22], webPull: [0, 0.5, 0.7], webK: 0.35, webSlow: 1.1, webCd: 0.9, webGap: 1.5, knotHP: 700, webW: 0.32,
    // Eclipse Molt: shells by phase, the hunt (s), a shell's burst (its crack before, its radius, the blow, stacks), the ambush (its tell, radius, blow, stacks)
    mtN: [0, 2, 3], mtHunt: [0, 6.5, 5.5], mtCrack: 0.4, mtR: 2.1, mtK: 0.9, mtTell: 0.8, mtAmbR: 1.7, mtAmbK: 1.6, mtAmbStk: 2,
    // the phase-break roar: its ring's reach, blow, gaps
    roarR: 10, roarK: 0.6, roarGapN: 3, roarGapW: 0.8,
    // The Seventh Sin: the seals (how many, their radius, their ring's share of the arena), each strike's tell, radius, blow; the seventh's;
    // the Testament (outside a seal: a share of the pet's health, and a share more a stack; in one: a share a stack)
    sealN: 7, refR: 1.3, refK: 0.62, snTell: 1.0, snR: 1.7, snK: 1.1, sn7Tell: 1.3, sn7R: 2.4, sn7K: 1.4, tsK: 0.45, tsDebt: 0.05, tsIn: 0.04,
  };
  const PH_NAMES = ['The Veiled Predator', 'The Crimson Sovereign', 'The Seventh Sin'];
  /* its powers' order by phase (seven a cycle, several cycles a phase taken in turn); 'lab' is passed over while a web holds; the Tail Lash
     comes on its own whenever the pet crowds it */
  const CYC = { 1: [['perd', 'rupt', 'perd', 'perd', 'rupt', 'perd', 'rupt'], ['perd', 'perd', 'rupt', 'perd', 'rupt', 'perd', 'perd']],
    2: [['perd', 'molt', 'perd', 'rupt', 'lab', 'perd', 'molt'], ['perd', 'lab', 'perd', 'rupt', 'molt', 'perd', 'perd'], ['molt', 'perd', 'rupt', 'perd', 'lab', 'perd', 'perd']],
    3: [['perd', 'molt', 'rupt', 'perd', 'lab', 'perd', 'molt'], ['lab', 'perd', 'perd', 'rupt', 'molt', 'perd', 'perd'], ['perd', 'rupt', 'molt', 'lab', 'perd', 'perd', 'perd']] };
  // the tails, in the order they are pinned and broken (the outer pairs first, the centre last: the reverse of the entrance's unfolding, 02f6 UNF_ORDER)
  const BREAK = [0, 6, 1, 5, 2, 4, 3];
  let S = null;   // the fight in progress
  const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
  const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
  const GLS = () => (typeof ASMODEUS_GL !== 'undefined' ? ASMODEUS_GL : null);
  const glOn = () => { const G = GLS(); try { return !!(G && G.usable()); } catch (e) { return false; } };
  const MV = () => (typeof ASMODEUS_MOVES !== 'undefined' ? ASMODEUS_MOVES : null);
  const UTo = () => { const Mv = MV(); return Mv && Mv.UT ? Mv.UT : { p2: 2.2, p3: 4.4, p4: 6.4, s: [6.9, 7.25, 7.6, 7.95, 8.3, 8.65], s7: 9.1, p5: 9.6, col: 10.05, det: 10.45, p6: 11.0, len: 13.4 }; };
  const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
  const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (S) stop(); S = null; }); } catch (e) { /* (no Belfry hook) */ }

  /* ================= the arena: a rounded square (|dx/rx|^n + |dy/ry|^n <= 1), and the gate's own floor test when it gives one ================= */
  const AR = { cx: 16, cy: 12, rx: 10, ry: 7, n: 2.6, inside: null, solid: null, pillars: [], anchors: [], fonts: [] };
  const seN = (u, v) => Math.pow(Math.abs(u), AR.n) + Math.pow(Math.abs(v), AR.n);
  const inA = (x, y, pad) => { const rx = Math.max(0.5, AR.rx - (pad || 0)), ry = Math.max(0.5, AR.ry - (pad || 0)); if (!(seN((x - AR.cx) / rx, (y - AR.cy) / ry) < 1)) return false; try { return !AR.inside || !!AR.inside(x, y); } catch (e) { return true; } };
  // a free spot: on the floor, no solid tile (the arena's posts, columns, dais) within r
  const okAt = (x, y, pad, r) => { if (!inA(x, y, pad)) return false; if (!AR.solid) return true; r = r == null ? 0.7 : r; try { for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]]) if (AR.solid(x + dx, y + dy)) return false; } catch (e) {} return true; };
  const clampA = (x, y, pad) => { const rx = Math.max(0.8, AR.rx - (pad || 0)), ry = Math.max(0.8, AR.ry - (pad || 0)), dx = x - AR.cx, dy = y - AR.cy, k = Math.pow(seN(dx / rx, dy / ry), 1 / AR.n); return k <= 1 ? { x, y } : { x: AR.cx + dx / k, y: AR.cy + dy / k }; };
  const reach = (x, y, a, pad, max) => { const ux = Math.cos(a), uy = Math.sin(a); let d = 0; while (d < max && inA(x + ux * (d + 0.5), y + uy * (d + 0.5), pad)) d += 0.5; while (d < max && inA(x + ux * (d + 0.15), y + uy * (d + 0.15), pad)) d += 0.15; return d; };

  /* ================= the fight ================= */
  function begin(X, H, self, arena) {
    if (S) stop();
    const g = X.g, me = X.me, a = arena || {};
    AR.cx = a.cx != null ? a.cx : me.x; AR.cy = a.cy != null ? a.cy : me.y - 6; AR.n = a.sen > 1 ? a.sen : 2.6;
    AR.rx = a.rx > 0 ? Math.max(4, a.rx - 0.5) : (a.r || 9); AR.ry = a.ry > 0 ? Math.max(4, a.ry - 0.5) : (a.r || 7);
    AR.inside = typeof a.inside === 'function' ? a.inside : null;
    AR.solid = typeof a.solid === 'function' ? a.solid : null;
    const pts = L => (Array.isArray(L) ? L.map(p => Array.isArray(p) ? { x: p[0], y: p[1], r: p[2] || 0.7 } : { x: p.x, y: p.y, r: p.r || 0.7 }).filter(p => isFinite(p.x) && isFinite(p.y)) : []);
    AR.anchors = pts(a.anchors); AR.fonts = pts(a.fonts);
    AR.pillars = Array.isArray(a.pillars) ? a.pillars.map(p => Array.isArray(p) ? { x: p[0], y: p[1], r: p[2] || 0.7 } : { x: p.x, y: p.y, r: p.r || 0.7 }).filter(p => isFinite(p.x) && isFinite(p.y)) : [];
    const fk = (() => { try { const K = X.F && X.F.rift && X.F.rift.foeK; return K && K.boss > 0 ? K.boss : 1; } catch (e) { return 1; } })();   // (the rift's main-boss health: x2 in the Dunes, v433)
    const fd = (() => { try { const K = X.F && X.F.rift && X.F.rift.foeK; return K && K.dmg > 0 ? K.dmg : 1; } catch (e) { return 1; } })();   // (and its foes' blows, laid on by hurtPet: a share of the pet's health is set against it)
    const hp = TUNE.hp * fk, barHP = hp / TUNE.bars, home = clampA(AR.cx, AR.cy + TUNE.homeY, TUNE.pad);
    const m = { type: 'boss', boss: 'sxasmodeus', fiend: 'sxasmodeus', sxBoss: true, bk: { id: 'sxasmodeus', name: 'Asmodeus', title: 'The Fester', ai: 'sxasmodeus', spd: 1 }, mini: false, lesser: false, bname: 'Asmodeus',
      x: home.x, y: home.y, r: 1.5, hp, maxhp: hp, spd: 1, dmg: TUNE.dmg, xp: 400, color: '#1A0C14', glow: '#FF8AA8', aggro: true, act: 'enter', actT: 0, phase: 0, cd: 9, z: 0, t: 0, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0,
      chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, atkCd: 0, mv: 2, hitSq: 0, ph: 0, wob: 0, face: 1, step: 0, flank: 0, still: true, landed: true, noTouch: true };
    const yaw0 = faceTo(home.x, home.y, me.x, me.y);
    const B = { id: 'scorpio', x: m.x, y: m.y, z: 0, at: 0, alpha: 1, asP: null, asOut: null, pz: null, pzv: null, yaw: yaw0, yawT: yaw0, ph: 0, mv: 0, run: 0, mvA: yaw0, vx: 0, vy: 0, unf: 7, en: -1 };
    // the Anima's own effect layer, a private copy with no Anima of its own (noAuto, stand): its pictures only (its own blows strike nothing: living() is empty)
    let inst = null; try { const Mv = MV(); if (Mv) inst = Mv.create({ X: Object.assign(Object.create(X), { eshots: [] }), me, g, T: () => X.Tz(), ST: X.ST, S: { list: [] }, P: () => 0, near: () => [], living: () => [], hit: () => 0, noAuto: true, stand: true }); } catch (e) { inst = null; }
    S = { X, H, self, g, me, m, B, A: a, inst, barHP, home, fk, fd, phase: 1, mode: 'intro', t: 0, introT: 0, deadT: 0, acts: [], pick: 0, idleT: 1.2,
      debt: 0, debtT: 0, debtTk: TUNE.debtTick, debtFl: 0, seal: null, pools: [], poolCd: 0,
      tails: [0, 1, 2, 3, 4, 5, 6].map(j => ({ j, hp: TUNE.stingHP * fk, broken: false })), brokenN: 0, pin: null,
      marks: [], waves: [], spines: [], web: null, molt: null, crystal: null, expose: null, lashCd: 2, parts: [], pad: null, sin: null,
      lastM: hp, healAcc: 0, healCd: 0, seen: {}, cine: false, lastG: null, objs: [], heldDt: null, heartT: 0, sinDone: false, queue: [],
      stat: { perd: 0, perdHit: 0, fin: 0, finHit: 0, pin: 0, broke: 0, lash: 0, lashHit: 0, rupt: 0, ruptHit: 0, ruptCover: 0, ruptBroke: 0, erupt: 0, eruptHit: 0, lab: 0, webHit: 0, knots: 0, molt: 0, moltFound: 0, shellBurst: 0, shellHit: 0, ambush: 0, ambushHit: 0,
        roarHit: 0, stacks: 0, seal: 0, sealHit: 0, cleanse: 0, poolUse: 0, crucible: 0, expose: 0, sin: 0, sinHit: 0, sinTs: 0, sinSafe: 0, phase2At: null, phase3At: null, sinAt: null, t0: g.t, dmgIn: 0 } };
    X.mons.push(m); g.boss = m; g.bossShow = null; g.shownBoss = true; g.bossIntro = TUNE.intro;   // (the engine's intro hold: no attacks; its own banner skipped: ours, below)
    m.ownBar = (c, W) => drawBar(c, W); m.goalFn = () => goalText(); m.guardFn = (mm, o) => guard(mm, o);
    if (H && H.obj) { S.objs.push(H.obj({ x: m.x, y: m.y, dy: -1e5, kind: 'sxGround', r: 0, label: '', draw: c => safeDraw(c, drawGroundLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 0.25, kind: 'sxBody', r: 0, label: '', draw: c => safeDraw(c, drawBodyLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 1e5, kind: 'sxSky', r: 0, label: '', draw: c => safeDraw(c, drawSkyLayer) })); }
    // the entrance: the arena hushes, the Scorpio sigil and its filaments, the cocoon rising and cracking, the stingers unfolding, the crown
    S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1); mood(0.5);
    if (inst) { inst.fx.push({ kind: 'sig', x: B.x, y: B.y, R: 4.2, t: 0, life: 4.4, cine: 1 }); inst.fx.push({ kind: 'fils', x: B.x, y: B.y, R: 4.2, t: 0, life: 1.8, cine: 1 }); }
    for (let i = 0; i < 5; i++) X.after(0.3 + i * 0.25, () => { if (S && S.m === m) X.shake(1.5 + i * 0.6, 0.15); });
    sfx('hum'); note(62, 2.6, 'sine', 0.2); X.light(B.x, B.y, 5, 1.2);
    try { const G = GLS(); if (G && glOn()) G.warm(); } catch (e) { /* (no GPU: its existing art) */ }
    return m;
  }
  const sfx = (k, ...a) => { const s = S && S.X.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const note = (f, d, ty, v, f1, dl) => { try { const s = S && S.X.sfx; if (s && s.note) s.note(f, d, ty, v, f1, dl); } catch (e) { /* no sound */ } };
  const hiss = k => { note(880 * (k || 1), 0.5, 'sawtooth', 0.03, 220); note(110 * (k || 1), 1.2, 'sine', 0.16, 70); };   // (a glassy hiss over a low hum)
  const chimeOf = n => { const f = [523, 587, 659, 698, 784, 880, 988][Math.max(0, Math.min(6, n - 1))]; note(f, 0.35, 'triangle', 0.05); };
  const say = (key, t, sub, col, dur) => { const first = !S.seen[key]; S.seen[key] = true; S.X.banner(t, sub || '', col || COL.rose, first ? (dur || 2.6) : 1.4, true); };
  const realHp = () => { const m = S.m, P = S.pad; return P ? P.base : m.hp; };
  const ST = () => { try { return S.X.ST(); } catch (e) { return null; } };
  const kOf = () => S.phase - 1;
  const U = () => S.m.dmg;
  // the arena's own light follows its state (whichever channels it gives: the rune ring and the blood moon of the Amber Sanctum, a floor's heat)
  const mood = k => { if (!S) return; S.moodK = k; const A = S.A; try { if (A && typeof A.sigil === 'function') A.sigil(k); if (A && typeof A.moon === 'function') A.moon(Math.min(2, 0.7 + 0.25 * (S.phase - 1) + 0.5 * Math.max(0, k - 1))); if (A && typeof A.heat === 'function') A.heat(k); } catch (e) { /* (no floor channels) */ } };
  const webShow = k => { try { if (S && S.A && typeof S.A.web === 'function') S.A.web(k); } catch (e) {} };   // (the arena's slack threads hidden while its own take the posts)
  const fontLit = (i, k) => { try { if (S && S.A && typeof S.A.font === 'function' && i != null && i >= 0) S.A.font(i, k); } catch (e) {} };
  const intact = () => 7 - S.brokenN;
  // a blow on the pet; stacks of debt with it when it lands (a dot keeps the pet's guard as it was: a tick never shields it from the next blow)
  function hurt(d, o, stk) { const me = S.me; o = o || {}; const before = me.hp, inv0 = me.inv; const ok = S.X.hurtPet(d, S.m, o); if (ok) { S.stat.dmgIn += Math.max(0, before - me.hp); if (o.dot) me.inv = inv0; if (stk > 0) addDebt(stk); } return ok; }
  // it faces its quarry but always turned a little to the viewer (its crown of stingers reads front-on), as the Anima does
  function faceTo(x0, y0, x, y) { const an = Math.atan2(y - y0, x - x0), d = angD(an, Math.PI / 2); return Math.PI / 2 + Math.max(-1.05, Math.min(1.05, d * 0.6)); }
  const u2t = () => TUNE.size / ((GLS() && GLS().HEIGHT) ? GLS().HEIGHT[3] : 23.2);   // tiles a model unit
  function footW(i) { const G = GLS(), u = u2t(), y = S.B.yaw, hm = G ? G.homeOf(i, { spread: 0 }) : [Math.cos(i) * 9, Math.sin(i) * 9]; return { x: S.B.x + (hm[0] * Math.cos(y) - hm[1] * Math.sin(y)) * u, y: S.B.y + (hm[0] * Math.sin(y) + hm[1] * Math.cos(y)) * u }; }
  /* a point on the floor (tiles) in the tails' space (a strike's aim), clamped to what the tails can telescope to (as the Anima's aimAt) */
  function aimAt(x, y, z) { const G = GLS(), B = S.B, u = u2t(), yw = B.yaw, dx = (x - B.x) / u, dy = (y - B.y) / u, mx = dx * Math.cos(yw) + dy * Math.sin(yw), my = -dx * Math.sin(yw) + dy * Math.cos(yw);
    let p = G ? G.toTail([mx, my, z == null ? 0.6 : z]) : [mx, my, 2]; const R0 = [-0.8, 0, 13], dd = [p[0] - R0[0], p[1] - R0[1], p[2] - R0[2]], L = Math.hypot(dd[0], dd[1], dd[2]), mxL = 19;
    if (L > mxL) p = [R0[0] + dd[0] / L * mxL, R0[1] + dd[1] / L * mxL, R0[2] + dd[2] / L * mxL]; return p; }
  const frontOf = d => ({ x: S.B.x + Math.cos(S.B.yaw) * d, y: S.B.y + Math.sin(S.B.yaw) * d });
  const tailOk = j => !S.tails[j].broken;
  const liveTails = () => S.tails.filter(q => !q.broken).map(q => q.j);

  /* the camera: the whole god (its crown of stingers) kept below the top HUD, the pet above the buttons; wider for The Seventh Sin's seals */
  const CAM = { top: 160, bot: 210, zFight: 0.66, zWide: 0.52, zMin: 0.46, zMolt: 0.36, zIn: 1.3 };
  function frame(topY, botY, x, z0, spanX) {
    const X = S.X, g = S.g, Hh = X.H(), TS = X.Tz() / Math.max(0.05, g.zoom || 1), room = Math.max(120, Hh - CAM.top - CAM.bot), span = Math.max(1, botY - topY);
    const bb = S.B.asOut && S.B.asOut.r && S.B.asOut.r.bb, bodyW = bb ? (bb[2] - bb[0]) / X.Tz() : TUNE.size * 1.1, wide = (X.W() - 24) / ((bodyW + 1.5 + (spanX || 0)) * TS);
    const z = Math.max(spanX ? CAM.zMolt : CAM.zMin, Math.min(z0, room / (span * TS), wide / CAM.zIn)) * CAM.zIn;
    const yGod = topY + (Hh / 2 - CAM.top) / (TS * z), yPet = botY - (Hh / 2 - CAM.bot) / (TS * z), y = Math.max(yPet, Math.min(yGod, (topY + botY) / 2 + 2));
    return { x, y, k: 0.92, zoom: z };
  }
  const godTop = () => S.B.y - (S.B.z || 0) - TUNE.size * 1.08 - 0.3;
  function camOf() {
    const B = S.B, me = S.me;
    if (S.mode === 'intro') return frame(godTop(), B.y + 3.0, B.x, 0.68);
    if (S.mode === 'dead') return frame(godTop(), B.y + 3.0, B.x, 0.66);
    if (S.sin) { const refs = S.sin.refs, rb = Math.max(B.y + 2, ...refs.map(r => r.y)) + 1.4, rt = Math.min(godTop(), ...refs.map(r => r.y - 1.6)); return frame(rt, Math.max(me.y + 1.0, rb), lerp(AR.cx, me.x, 0.3), CAM.zWide); }
    if (S.molt && S.molt.hunt) { const M = S.molt, ys = M.spots.map(p => p.y), xs = M.spots.map(p => p.x); return frame(Math.min(...ys) - TUNE.size * 1.08 - 0.3, Math.max(me.y, ...ys) + 1.2, (Math.min(...xs, me.x) + Math.max(...xs, me.x)) / 2, CAM.zWide, Math.max(...xs, me.x) - Math.min(...xs, me.x)); }
    return frame(godTop(), Math.max(me.y, B.y + 2) + 1.0, (B.x + me.x) / 2, CAM.zFight);
  }
  function goalText() { if (!S) return ''; const n = Math.max(0, Math.ceil(Math.max(0, realHp()) / S.barHP - 1e-9));
    if (S.mode === 'dead' || S.mode === 'over') return 'The Fester falls';
    if (S.mode === 'intro') return 'Asmodeus, the Fester';
    if (S.sin) return 'The Seventh Sin · keep moving off the marks, then stand in a lit seal' + (S.debt ? ' · cleanse your debt' : '');
    const tip = S.seal ? ' · SEALED: cleanse in the starlight' : S.expose ? ' · strike the bared Crucible' : S.pin ? ' · break the pinned stinger' : S.crystal ? ' · break the crystal or take cover' : S.molt && S.molt.hunt ? ' · find the one that breathes' : S.web ? ' · cut a knot or slip through a gap' : '';
    return `Asmodeus · ${n} bar${n === 1 ? '' : 's'} · phase ${S.phase}/3 · debt ${S.debt}/7 · stingers ${intact()}/7${tip}`; }

  /* ================= the step (every frame) ================= */
  function update(dt) {
    if (!S) return; const g = S.g; if (S.lastG === g.t) return; S.lastG = g.t;
    dt = Math.min(0.25, Math.max(0, dt || 0)); const B = S.B, m = S.m;
    S.t += dt; B.at += dt;
    if (S.inst) try { S.inst.update(dt, dt); } catch (e) { /* (its pictures only) */ }
    if (S.mode === 'intro') introTick(dt);
    else if (S.mode === 'dead') deadTick(dt);
    else if (S.mode === 'fight') fightTick(dt);
    if (S.mode === 'over') return;
    const da = S.heldDt == null ? dt : S.heldDt;
    hazardsTick(da, dt); partsTick(da);
    if (S.mode !== 'dead' && !(S.molt && S.molt.gone)) { B.x = m.x; B.y = m.y; }
    poseOf(dt);
    for (const o of S.objs) { o.x = B.x; o.y = B.y; }
    if (S.cine) g.cineT = Math.max(g.cineT || 0, 0.05);
    S.heartT = Math.max(0, S.heartT - dt); S.debtFl = Math.max(0, S.debtFl - dt * 2.5);
  }
  function introTick(dt) {
    const B = S.B, m = S.m, X = S.X, g = S.g, t0 = S.introT; S.introT += dt; const t = S.introT, cross = x => t0 < x && t >= x, I = S.inst ? S.inst.fx : null;
    B.alpha = glOn() ? 1 : sstep(0.3, 2.8, t); B.en = Math.max(0, t - 0.5);
    if (cross(1.9)) { sfx('thud'); X.shake(4, 0.2); }   // the cocoon cracks
    if (cross(2.8)) { if (I) { I.push({ kind: 'shatS', x: B.x, y: B.y, t: 0, life: 0.9, seed: 5, big: 1, cine: 1 }); S.inst.burstFx(B.x, B.y, 3, true); } X.shake(10, 0.3); sfx('crash'); X.flash(0.12, '#FFC0D8'); }
    if (cross(3.65)) {   // the crown spreads: a ring of crystal blades across the arena (no blow) and the hiss
      if (I) { I.push({ kind: 'ringw', x: B.x, y: B.y, R: 5.4, t: 0, life: 0.9, seed: 1, cine: 1 }); I.push({ kind: 'dome', x: B.x, y: B.y, R: 2.8, t: 0, life: 0.6, seed: 2, cine: 1 }); }
      S.waves.push({ x: B.x, y: B.y, R: 9, t: 0, dur: 1.0, gaps: [], hit: true, prev: 0, dmg: 0, vis: 0.8, tag: 'show' });
      X.shake(12, 0.6); X.flash(0.22, '#FFD8E6'); hiss(1); sfx('crash'); g.hitStop = Math.max(g.hitStop || 0, 0.05); mood(1.1); }
    if (cross(3.9)) { X.banner('ASMODEUS', 'The Fester', COL.rose, 2.8, true, true); sfx('sparkle'); }
    if (t >= TUNE.intro) { B.alpha = 1; B.en = -1; S.mode = 'fight'; S.cine = false; g.cineT = 0; m.act = 'fight'; S.idleT = 1.0; mood(0.7); say('p1', 'PHASE I', 'Asmodeus · ' + PH_NAMES[0], COL.rose, 1.8); }
  }
  /* ---- the fight ---- */
  function fightTick(dt) {
    const m = S.m;
    const took = S.pad ? 0 : Math.max(0, S.lastM - m.hp);
    padTick();
    try { fightAI(dt, took); } finally { S.lastM = m.hp; }
  }
  function padTick() { const P = S.pad, m = S.m; if (!P) return; const top = P.base + P.buf; if (m.hp < top) m.hp = top; }
  function fightAI(dt, took) {
    const m = S.m, me = S.me, g = S.g, X = S.X;
    if (m.dead || S.mode !== 'fight') return;
    S.healAcc += took; S.healCd -= dt;
    if (!S.sin && S.healAcc > S.barHP * TUNE.heal && S.healCd <= 0) { S.healAcc = 0; S.healCd = TUNE.healCd; const an = Math.atan2(me.y - m.y, me.x - m.x), x = m.x + Math.cos(an) * (m.r + 0.7), y = m.y + Math.sin(an) * (m.r + 0.7); X.drop('hp', x, y); if (Math.random() < 0.45) X.drop('mp', x, y); X.sparks(x, y, '#8FE0A6', 8, 4); }
    const f = realHp() / m.maxhp;
    if (!S.sin && S.phase < 3 && f <= TUNE.cuts[S.phase]) phaseUp();
    else if (!S.sin && S.phase === 3 && !S.sinDone && f <= TUNE.sinAt) startSin();
    const held = g.stopT > 0 || (g.cineT > 0 && !S.cine), slow = (m.chill > 0 ? 0.8 : 1) * (g.warpT > 0 ? 0.4 : 1) * (m.curseT > 0 ? 0.85 : 1), da = held ? 0 : dt * slow;
    S.heldDt = da;
    if (S.sin) { sinTick(da); brake(da); return; }
    if (me.dead) { if (S.acts.length || S.marks.length || S.molt || S.crystal || S.pin) abortActs(true); clearDebt(); S.idleT = Math.max(S.idleT, 1.4); S.heldDt = 0; return; }   // (the pet down: its powers called off, the debt gone with it)
    debtTick(da); poolsTick(da);
    if (S.expose) { exposeTick(da); brake(da); easeOut(); return; }
    for (let i = S.acts.length - 1; i >= 0; i--) { const A = S.acts[i]; A.t += da; if (actTick(A, da)) { S.acts.splice(i, 1); endAct(A); if (!S.acts.length) S.idleT = breath(); } }
    if (S.noAI) { if (!S.acts.length) { brake(da); S.B.yawT = faceTo(m.x, m.y, me.x, me.y); } easeOut(); return; }   // (the harness: one power at a time, no walking)
    S.lashCd -= da;
    if (!S.acts.length) {
      const near = Math.hypot(me.x - m.x, me.y - m.y) - m.r < TUNE.lashNear;
      if (near && S.lashCd <= 0) start('lash');
      else { S.idleT -= da; if (S.idleT <= 0) { if (S.queue.length) { const k = S.queue.shift(); if (!start(k)) S.idleT = 0.3; } else { for (let n = 0; n < 7; n++) { const k = cycNext(); S.pick++; if (start(k)) break; } S.idleT = 0.4; } } } }
    const planted = S.acts.some(A => A.kind !== 'lash' || A.t > A.tell - 0.2);
    walk(da, planted ? 0 : 1);
    easeOut();
  }
  const cycNext = () => { const L = CYC[S.phase], q = L[Math.floor(S.pick / 7) % L.length]; return q[S.pick % 7]; };
  function breath() { const k = kOf(), f = realHp() / S.m.maxhp, top = TUNE.cuts[S.phase - 1], bot = S.phase < 3 ? TUNE.cuts[S.phase] : TUNE.sinAt, run = cl((top - f) / Math.max(0.01, top - bot)); return TUNE.idle[k] * lerp(1, TUNE.idleEnd, run); }
  // it is passed round, not through: the pet eased out from under it
  function easeOut() { const me = S.me, m = S.m; if (me.dead || me.leap || (S.molt && S.molt.gone)) return; const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = m.r; if (d < r0 && d > 1e-4) S.X.moveEnt(me, dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6, 0); }
  /* its glide: it holds the arena's heart and leans toward the pet, keeping its distance; its six legs carry it any way under its body */
  function walk(dt, k) {
    if (!(dt > 0)) return; const m = S.m, me = S.me, B = S.B, H0 = S.home;
    const vx = me.x - H0.x, vy = me.y - H0.y, vd = Math.hypot(vx, vy) || 1, ln = Math.min(TUNE.leanMax, vd * TUNE.lean); let tx = H0.x + vx / vd * ln, ty = H0.y + vy / vd * ln;
    { const ex = tx - me.x, ey = ty - me.y, e = Math.hypot(ex, ey) || 1; if (e < TUNE.keep) { tx = me.x + ex / e * TUNE.keep; ty = me.y + ey / e * TUNE.keep; } }
    const p = clampA(tx, ty, TUNE.pad), dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), want = d > 0.3 ? Math.min(TUNE.spd[kOf()] * k, d * 1.4) : 0;
    B.yawT = faceTo(m.x, m.y, me.x, me.y);
    const acc = Math.min(1, dt * 3); B.vx += ((d > 0.3 ? dx / d * want : 0) - B.vx) * acc; B.vy += ((d > 0.3 ? dy / d * want : 0) - B.vy) * acc;
    moveBy(B.vx * dt, B.vy * dt);
  }
  function brake(dt) { const B = S.B; B.vx *= 1 - Math.min(1, dt * 4); B.vy *= 1 - Math.min(1, dt * 4); if (dt > 0) moveBy(B.vx * dt, B.vy * dt); }
  function moveBy(mx, my) { const m = S.m, B = S.B, p = clampA(m.x + mx, m.y + my, TUNE.pad - 0.6), dd = Math.hypot(p.x - m.x, p.y - m.y); m.x = p.x; m.y = p.y; B.x = m.x; B.y = m.y;
    if (dd > 1e-4) B.mvA += angD(Math.atan2(my, mx), B.mvA) * 0.5;
    const G = GLS(), sl = ((G && G.STRIDE) || 4.4) * u2t(), ph0 = B.ph; B.ph += dd / Math.max(0.05, sl * Math.max(0.3, B.mv)) * TAU;
    if (G && G.footfalls && S.inst && B.mv > 0.2) for (const f of G.footfalls(ph0, B.ph, B.run)) { const q = footW(f.i); S.inst.fx.push({ kind: 'foot', x: q.x, y: q.y, R: 0.55 + 0.2 * B.run, t: 0, life: 0.6, seed: Math.random() * 50 }); if (f.f > 0.6 && (S.thudT || 0) <= S.t) { sfx('thud'); S.thudT = S.t + 0.5; } }
    return dd; }
  function phaseUp() {
    const m = S.m, X = S.X; abortActs(); S.phase++; m.flinch = 1;
    if (S.expose) endExpose();
    if (S.phase === 2) S.stat.phase2At = S.g.t - S.stat.t0; else S.stat.phase3At = S.g.t - S.stat.t0;
    X.banner(`PHASE ${S.phase === 2 ? 'II' : 'III'}`, `Asmodeus · ${PH_NAMES[S.phase - 1]}`, S.phase === 3 ? COL.white : COL.rose, 2.0, true);
    X.flash(0.3, '#FFD8E6'); X.shake(12, 0.6); sfx('hum'); mood(0.5);
    for (let i = 0; i < 4; i++) X.drop(i % 2 ? 'mp' : 'hp', m.x + (Math.random() - 0.5) * 4, m.y + 2 + Math.random() * 2);
    start('roar'); S.queue = S.phase >= 3 ? ['lab', 'molt'] : ['lab'];
  }

  /* ================= Venom Debt on the pet, the seal, Vigil Starlight ================= */
  function addDebt(n) {
    if (!S || S.mode !== 'fight' || S.me.dead || !(n > 0)) return; const was = S.debt; S.debt = Math.min(TUNE.debtMax, S.debt + n); S.debtT = 0; S.debtFl = 1; S.stat.stacks += S.debt - was;
    if (S.debt > was) chimeOf(S.debt);
    if (was < TUNE.debtMax && S.debt >= TUNE.debtMax && !S.seal) sealStart();
  }
  function clearDebt() { if (!S) return; S.debt = 0; S.debtT = 0; S.seal = null; }
  function cleanse(n, why) { if (!S || !(S.debt > 0)) return 0; const was = S.debt; S.debt = n == null ? 0 : Math.max(0, S.debt - n); const k = was - S.debt; S.stat.cleanse += k; if (S.debt < TUNE.debtMax && S.seal) { S.seal = null; say('sealx', 'THE SEAL IS BROKEN', 'The debt burns away', COL.cool, 1.6); }
    const me = S.me; if (S.inst) S.inst.fx.push({ kind: 'spark1', x: me.x, y: me.y, t: 0, life: 1.0 }); S.X.text(me.x, me.y - 1.7, why || 'Cleansed', COL.cool, 13, { life: 1.0 }); note(988, 0.5, 'sine', 0.08); note(1318, 0.6, 'sine', 0.05, null, 0.08); return k; }
  function sealStart() { S.seal = { t: 0, dur: TUNE.sealT }; S.stat.seal++; say('seal', 'THE SEAL RIPENS', 'Seven stacks of Venom Debt: cleanse them in the starlight before it bursts', COL.rose, 2.8); sfx('hum'); spawnPool(true); }
  function debtTick(da) {
    if (!(da > 0)) return; const me = S.me;
    if (S.debt > 0) { S.debtT += da; S.debtTk -= da;
      if (S.debtTk <= 0) { S.debtTk += TUNE.debtTick; hurt(U() * TUNE.debtK * S.debt, { dot: true, debt: true, dotC: COL.pink }); }
      if (!S.seal && S.debtT >= TUNE.debtFade) { S.debt--; S.debtT = 0; } }
    else S.debtTk = TUNE.debtTick;
    if (S.seal) { const Z = S.seal; Z.t += da; if (Math.random() < da * (2 + 6 * Z.t / Z.dur)) note(70 + 40 * Z.t / Z.dur, 0.18, 'sine', 0.12);
      if (Z.t >= Z.dur) { S.seal = null; S.stat.sealHit++; const h0 = me.hp; me.inv = me.dodge ? me.inv : 0; const ok = S.X.hurtPet(U() * TUNE.sealK, S.m, { seal: true }); if (ok) { S.stat.dmgIn += Math.max(0, h0 - me.hp); me.push = null; }
        S.debt = TUNE.sealLeft; S.debtT = 0; if (S.inst) { S.inst.fx.push({ kind: 'det', x: me.x, y: me.y, t: 0, life: 0.8, n: 7, seed: Math.random() * 40 }); S.inst.burstFx(me.x, me.y, 2, true); }
        S.X.flash(0.2, '#FFD0E0'); S.X.shake(12, 0.35); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06); S.X.text(me.x, me.y - 1.8, ok ? 'The seal bursts!' : 'Rolled clear of the seal', COL.rose, 15); } }
  }
  // Vigil Starlight: a pool somewhere the pet can reach in time, away from Asmodeus and its spines
  function spawnPool(now) {
    if (S.pools.some(p => !p.used)) return null; const me = S.me, m = S.m; let best = null, bs = -1e9;
    // the arena's amber fonts when it has them (the one the pet reaches first, away from Asmodeus and its web), else a spot of its own
    if (AR.fonts.length) { AR.fonts.forEach((f, i) => { const dm = Math.hypot(f.x - m.x, f.y - m.y), dp = Math.hypot(f.x - me.x, f.y - me.y), sc = -dp + (dm < m.r + 2.5 ? -20 : 0) - (S.web ? webNear(f.x, f.y) : 0); if (sc > bs) { bs = sc; best = { x: f.x, y: f.y, r: f.r, font: i }; } }); }
    if (!best)
    for (let i = 0; i < 40; i++) { const an = Math.random() * TAU, d = 3 + Math.random() * 4.5, x = me.x + Math.cos(an) * d, y = me.y + Math.sin(an) * d; if (!okAt(x, y, 1.2, 1.0)) continue;
      const dm = Math.hypot(x - m.x, y - m.y), sc = Math.min(dm, 7) - (S.spines.some(q => Math.hypot(q.x - x, q.y - y) < q.r + 1.4) ? 9 : 0) - (S.web ? webNear(x, y) : 0) - d * 0.3 + Math.random(); if (dm > m.r + 2.5 && sc > bs) { bs = sc; best = { x, y }; } }
    if (!best) { const p = clampA(lerp(me.x, AR.cx, 0.5), lerp(me.y, AR.cy + 2, 0.5), 1.5); best = p; }
    const P = { x: best.x, y: best.y, r: best.font != null ? Math.max(TUNE.poolR * 0.85, best.r + 0.25) : TUNE.poolR, font: best.font, t: 0, life: TUNE.poolLife, st: 0, used: false, seed: Math.random() * 40 }; fontLit(P.font, 1.8); S.pools.push(P); S.poolCd = TUNE.poolCd;
    say('pool', 'VIGIL STARLIGHT', 'Stand in the starlight to burn your Venom Debt away', COL.cool, 2.4); note(659, 0.8, 'sine', 0.06); note(988, 0.9, 'sine', 0.04, null, 0.1); return P;
  }
  const webNear = (x, y) => { const W = S.web; if (!W) return 0; for (const q of W.threads) { if (q.cut) continue; const ux = Math.cos(q.a), uy = Math.sin(q.a), rx = x - W.x, ry = y - W.y, al = rx * ux + ry * uy, of = Math.abs(-rx * uy + ry * ux); if (al > 0 && al < q.len && of < 1.2) return 4; } return 0; };
  function poolsTick(da) {
    const me = S.me; S.poolCd -= da;
    if (S.debt >= TUNE.poolAt && S.poolCd <= 0 && !S.pools.some(p => !p.used)) spawnPool(false);
    for (let i = S.pools.length - 1; i >= 0; i--) { const p = S.pools[i]; p.t += da;
      if (!p.used) { const inP = !me.dead && Math.hypot(me.x - p.x, me.y - p.y) < p.r + me.r * 0.3; p.st = inP ? p.st + da : Math.max(0, p.st - da * 2);
        if (p.st >= TUNE.poolStand && S.debt > 0) { p.used = true; p.usedT = p.t; S.stat.poolUse++; cleanse(null, 'Purified in the starlight'); if (S.inst) S.inst.fx.push({ kind: 'dome', x: p.x, y: p.y, R: 1.6, t: 0, life: 0.6, seed: 3 }); S.X.light(p.x, p.y, 4, 0.5); }
        if (p.t >= p.life) { p.used = true; p.usedT = p.t; } }
      if (p.used && p.t > p.usedT + 0.8) { fontLit(p.font, 0.35); S.pools.splice(i, 1); } }
  }

  /* ================= EXPOSED: the Crucible bared ================= */
  function expose(why) {
    if (!S || S.sin || S.mode !== 'fight') return; const m = S.m, X = S.X, B = S.B; abortActs(); S.expose = { t: 0, dur: TUNE.exposeT }; m.stunT = TUNE.exposeT; m.act = 'stunned'; S.stat.expose++; B.vx = B.vy = 0; m.flinch = 1;
    say('expose', 'THE CRUCIBLE IS BARED', 'It reels: strike its heart from the front to burn your debt away', COL.pale, 2.4);
    X.text(m.x, m.y - TUNE.size * 0.85, why || 'Exposed!', COL.white, 15, { crit: true, life: 1.1 }); sfx('whoosh'); hiss(0.8);
    if (S.inst) { S.inst.fx.push({ kind: 'warp', x: B.x, y: B.y, t: 0, life: 0.7, seed: Math.random() * 40 }); S.inst.burstFx(B.x, B.y, 2, true); }
  }
  function exposeTick(da) { const V = S.expose, m = S.m; V.t += da; m.stunT = Math.max(0.001, V.dur - V.t); if (V.t >= V.dur) endExpose(); }
  function endExpose() { const m = S.m; S.expose = null; m.stunT = 0; m.act = 'fight'; S.idleT = Math.max(S.idleT, 0.8); }
  // the engine asks every blow on its body (m.guardFn): the Crucible from the front while it is bared; the real one found in the molt
  function guard(m, o) {
    if (!S || m !== S.m || S.mode !== 'fight' || (o && o.dot)) return 1; const me = S.me;
    if (S.molt && S.molt.hunt && !S.molt.found) { moltFound(); return 1; }
    if (S.expose) { const a = Math.atan2(me.y - m.y, me.x - m.x); if (Math.abs(angD(a, S.B.yaw)) < TUNE.exposeCone) { S.heartT = 0.35; S.stat.crucible++; if (S.debt > 0) cleanse(TUNE.exposeCleanse, 'The Crucible drinks the venom back'); } }
    return 1;
  }

  /* ================= the parts the pet strikes (the engine's passive objects) ================= */
  function part(kind, x, y, r, hp, o) {
    const X = S.X; let m = null; try { m = X.spawnMon('fobj', x, y, Object.assign({ fobj: true, optional: true, aggro: true, still: true, mv: 1, r, hp, maxhp: hp, z: 0, t: 0, invuln: false, xp: 0, sxPart: kind, color: '#2A1020' }, o || {})); } catch (e) { m = null; }
    if (!m) return null; m.x = x; m.y = y; m.hp = m.maxhp = hp; const P = { kind, m, last: hp, took: 0, born: S.t }; S.parts.push(P); return P;
  }
  function dropPart(P) { if (!P) return; const i = S.parts.indexOf(P); if (i >= 0) S.parts.splice(i, 1); const m = P.m; if (m) { m.dead = true; try { const L = S.X.mons, j = L.indexOf(m); if (j >= 0) L.splice(j, 1); } catch (e) {} } }
  function partsTick(da) {
    for (const P of S.parts.slice()) { const m = P.m, d = Math.max(0, P.last - Math.max(0, m.hp)); P.last = Math.max(0, m.hp); if (d > 0) { P.took += d; partHit(P, d); } if (m.dead && S.parts.includes(P)) partDead(P); }
  }
  function partHit(P, d) {
    const X = S.X, m = S.m;
    if (P.kind === 'sting') { if (!m.dead && S.mode === 'fight') X.hitMon(m, d * TUNE.stingFwd, { noCrit: true, noText: true, viaProxy: true, src: 'proxy' }); S.tails[P.j].hp = Math.max(0, P.m.hp); S.heartT = 0.2; }
    else if (P.kind === 'shell') { const M = S.molt; if (M && !P.cracking) { P.cracking = S.t; P.m.hp = P.m.maxhp; sfx('kick'); note(1200, 0.2, 'square', 0.03); } }
    else if (P.kind === 'crystal') { sfx('kick'); note(1400 - 600 * cl(P.took / P.m.maxhp), 0.12, 'triangle', 0.04); }
    else if (P.kind === 'knot') { note(700, 0.1, 'triangle', 0.04); }
  }
  function partDead(P) {
    const X = S.X, m = S.m; dropPart(P);
    if (P.kind === 'sting') breakStinger(P.j);
    else if (P.kind === 'crystal') { const C = S.crystal; if (C && C.part === P) { S.crystal = null; S.stat.ruptBroke++; for (const sp of S.spines) sp.life = Math.min(sp.life, sp.t + 0.6); X.hitMon(m, m.maxhp * TUNE.ruBreak, { flat: true, noCrit: true, viaProxy: true, src: 'proxy', big: true });
      if (S.inst) { S.inst.fx.push({ kind: 'shat', a: S.B, t: 0, life: 0.9, seed: Math.random() * 40 }); S.inst.burstFx(m.x, m.y, 3, true); } X.flash(0.25, '#FFE0EA'); X.shake(14, 0.4); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.07); expose('The crystal shatters inward!'); } }
    else if (P.kind === 'knot') { const W = S.web; if (W) for (const q of W.threads) if (q.knot === P) { q.cut = true; q.cutT = W.t; S.stat.knots++; X.text(q.kx, q.ky - 1.2, 'The thread snaps', COL.knot, 13, { life: 1.0 }); if (S.inst) S.inst.burstFx(q.kx, q.ky, 1, false); sfx('whoosh'); note(523, 0.3, 'triangle', 0.05, 261); } }
    else if (P.kind === 'shell') { /* (a shell struck to nothing bursts at once) */ const M = S.molt; if (M) { const s = M.shells.find(q => q.part === P); if (s && !s.done) shellBurst(s, true); } }
  }
  function breakStinger(j) {
    const T = S.tails[j], X = S.X, m = S.m; if (!T || T.broken) return; T.broken = true; T.hp = 0; S.brokenN++; S.stat.broke++; const pin = S.pin; S.pin = null;
    const x = pin ? pin.x : m.x, y = pin ? pin.y : m.y; X.hitMon(m, m.maxhp * TUNE.stingBreak, { flat: true, noCrit: true, viaProxy: true, src: 'proxy', big: true });
    if (S.inst) { S.inst.fx.push({ kind: 'shatS', x, y, t: 0, life: 0.9, seed: Math.random() * 40 }); S.inst.burstFx(x, y, 3, true); for (let i = 0; i < Math.round(6 * LQ()); i++) { const an = Math.random() * TAU, v = 2 + Math.random() * 3; S.inst.fx.push({ kind: 'frag', x, y, z: 0.6, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 2 + Math.random() * 4, t: 0, life: 1.1, s: 0.14 + Math.random() * 0.1, rot: Math.random() * 6, seed: Math.random() * 90 }); } }
    X.banner('A STINGER BREAKS', `${intact()} of seven left: one fewer in every Perdition, every web and The Seventh Sin`, COL.gold, 2.4, true); X.flash(0.2, '#FFE6EE'); X.shake(12, 0.4); sfx('crash'); hiss(1.3); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06);
    expose('A stinger shatters!');
  }

  /* ================= the powers ================= */
  function start(kind) {
    const k = kOf(), me = S.me, m = S.m, B = S.B; let A = null;
    if (kind === 'perd') { const n = Math.max(2, TUNE.pdN[k] - S.brokenN), fin = S.phase >= 3; A = { kind, t: 0, n, wind: TUNE.pdWind, gap: TUNE.pdGap[k], fin, order: liveTails().sort(() => Math.random() - 0.5), aims: [], hits: [] };
      A.last = A.wind + (n - 1) * A.gap; A.finT = fin ? A.last + 0.42 + 0.35 : -9; A.end = (fin ? A.finT : A.last) + 0.35; A.pinJ = S.brokenN < 7 ? BREAK[S.brokenN] : -1; A.dur = A.end + (A.pinJ >= 0 ? TUNE.pinT : 0.4);
      say('perd', 'SEVENFOLD PERDITION', 'Its stingers fall where you stand: keep moving off the marks', COL.rose, 2.2); sfx('hum'); }
    else if (kind === 'lash') { if (S.lashCd > 0) return null; const tj = liveTails(); if (!tj.length) return null; A = { kind, t: 0, tell: TUNE.lashTell, a: Math.atan2(me.y - m.y, me.x - m.x), j: tj[Math.floor(Math.random() * tj.length)], dur: TUNE.lashTell + 0.55 }; S.lashCd = TUNE.lashCd; note(330, 0.3, 'sawtooth', 0.04, 660); }
    else if (kind === 'rupt') { if (S.crystal) return null; A = { kind, t: 0, grow: TUNE.ruGrow[k], n: TUNE.ruN[k] }; A.shat = 0.6 + A.grow; A.dur = A.shat + (A.n - 1) * TUNE.ruGap + (S.phase >= 3 ? TUNE.erTell + 0.9 : 0.6) + 0.8; raiseSpines(A);
      S.crystal = { A, part: part('crystal', m.x, m.y + 0.05, m.r + 0.35, TUNE.ruHP[k] * S.fk) };   // (the parts' health with the rift's, as its own) sfx('hum'); note(98, 1.5, 'sawtooth', 0.06, 196);
      say('rupt', 'SCARLET RUPTURE', 'Break the crystal before it is grown, or take cover behind a spine', COL.rose, 2.4); }
    else if (kind === 'lab') { if (S.web || S.phase < 2) return null; A = { kind, t: 0, cast: 1.2, dur: 1.7 }; sfx('hum'); say('lab', 'CRIMSON LABYRINTH', 'Threads bind: slip through their dark gaps, or strike an amber knot to cut one', COL.rose, 2.6); }
    else if (kind === 'molt') { if (S.phase < 2 || S.molt) return null; A = { kind, t: 0, dur: 99 }; S.molt = { A, t: 0, hunt: false, gone: false, found: false, shells: [], spots: [], sx: m.x, sy: m.y }; sfx('hum'); }
    else if (kind === 'roar') { A = { kind, t: 0, dur: 1.6 }; }
    if (!A) return null; S.stat[kind] = (S.stat[kind] || 0) + 1; S.acts.push(A); return A;
  }
  // a power's own clock: true when it is done
  function actTick(A, dt) {
    const t = A.t, t0 = t - dt, cross = x => t0 < x && t >= x, m = S.m, X = S.X, me = S.me, B = S.B, k = kOf();
    if (A.kind === 'perd') {
      B.vx *= 0.8; B.vy *= 0.8; if (!me.dead && t < A.end) B.yawT = faceTo(m.x, m.y, me.x, me.y);
      if (cross(0.1) && S.inst) S.inst.fx.push({ kind: 'anchor', a: B, t: 0, life: 0.9 });
      for (let i = 0; i < A.n; i++) { const ts = A.wind + i * A.gap; if (cross(ts - TUNE.pdTell)) { const p = clampA(me.x + (me.vx || 0) * 0.15, me.y + (me.vy || 0) * 0.15, 0.5); A.hits[i] = S.marks[S.marks.push({ x: p.x, y: p.y, R: TUNE.pdR, t: 0, tell: TUNE.pdTell, lock: TUNE.pdLock, k: TUNE.pdK, stk: 1, tag: 'perd', j: A.order[i % A.order.length], follow: true, done: false, seed: Math.random() * 40 }) - 1]; } }
      if (A.fin && cross(A.finT - TUNE.finTell)) { const p = clampA(me.x, me.y, 0.5); A.finM = S.marks[S.marks.push({ x: p.x, y: p.y, R: TUNE.finR, t: 0, tell: TUNE.finTell, lock: 0.35, k: TUNE.finK, stk: TUNE.finStk, tag: 'fin', j: -1, follow: true, done: false, seed: Math.random() * 40, big: true }) - 1]; S.stat.fin++; }
      if (A.pinJ >= 0 && cross(A.end - 0.05)) pinStinger(A);
      if (t >= A.end && A.pinJ >= 0 && !S.pin && !A.pinDone) { A.pinDone = true; return true; }   // (its pin broken already: the power ends)
      if (S.pin && S.pin.A === A && t >= A.dur) { unpin(); return true; }
      return t >= A.dur || (A.pinJ < 0 && t >= A.end + 0.4); }
    if (A.kind === 'lash') { B.vx *= 0.8; B.vy *= 0.8; B.yawT = faceTo(m.x, m.y, m.x + Math.cos(A.a), m.y + Math.sin(A.a));
      if (cross(A.tell)) { const R = TUNE.lashR + m.r; let hit = false; if (!me.dead) { const d = Math.hypot(me.x - m.x, me.y - m.y), an = Math.atan2(me.y - m.y, me.x - m.x); if (d < R + me.r * 0.5 && Math.abs(angD(an, A.a)) < TUNE.lashArc) hit = true; }
        if (hit && hurt(U() * TUNE.lashK, { lash: true }, 1)) { S.stat.lashHit++; const an = Math.atan2(me.y - m.y, me.x - m.x); me.push = { vx: Math.cos(an) * 8, vy: Math.sin(an) * 8, t: 0.2 }; }
        if (S.inst) { const p = { x: m.x + Math.cos(A.a) * R * 0.8, y: m.y + Math.sin(A.a) * R * 0.8 }; S.inst.fx.push({ kind: 'strk', a: B, j: A.j, x: p.x, y: p.y, t: 0, life: 0.34, seed: Math.random() * 40, sd: 1 }); S.inst.fx.push({ kind: 'ringw', x: m.x, y: m.y, R: R * 0.9, t: 0, life: 0.4, seed: 9 }); }
        X.shake(5, 0.12); sfx('whoosh'); }
      return t >= A.dur; }
    if (A.kind === 'rupt') { B.vx *= 0.8; B.vy *= 0.8; if (!me.dead) B.yawT = faceTo(m.x, m.y, me.x, me.y);
      if (cross(0.15) && S.inst) S.inst.fx.push({ kind: 'riseFx', a: B, t: 0, life: A.shat });
      if (S.crystal && S.crystal.A === A && S.crystal.part) { const P = S.crystal.part.m; P.x = m.x; P.y = m.y + 0.05; }
      if (cross(A.shat)) { const C = S.crystal; if (C && C.A === A) { dropPart(C.part); S.crystal = null; shatter(A); } else return true; }
      if (t > A.shat) for (let i = 1; i < A.n; i++) if (cross(A.shat + i * TUNE.ruGap)) ruptWave(i);
      if (S.phase >= 3 && cross(A.shat + (A.n - 1) * TUNE.ruGap + 0.3)) { const p = clampA(me.x, me.y, 0.6); S.marks.push({ x: p.x, y: p.y, R: TUNE.erR, t: 0, tell: TUNE.erTell, lock: 0.3, k: TUNE.erK, stk: 1, tag: 'erupt', j: -1, follow: true, done: false, seed: Math.random() * 40, big: true }); S.stat.erupt++; }
      return t >= A.dur; }
    if (A.kind === 'lab') { B.vx *= 0.8; B.vy *= 0.8;
      if (cross(0.25) && S.inst) S.inst.fx.push({ kind: 'threads', a: B, x: m.x, y: m.y, R: 5.5, t: 0, life: A.cast - 0.1 });
      if (cross(A.cast - 0.05)) laWeb();
      return t >= A.dur; }
    if (A.kind === 'molt') return moltTick(A, dt, cross);
    if (A.kind === 'roar') { B.vx = B.vy = 0;
      if (cross(0.45)) { const gaps = [], off = S.gapOff != null ? S.gapOff : Math.random() * TAU; for (let j = 0; j < TUNE.roarGapN; j++) gaps.push({ a: off + j / TUNE.roarGapN * TAU, w: TUNE.roarGapW });
        S.waves.push({ x: B.x, y: B.y, R: TUNE.roarR, t: 0, dur: TUNE.roarR / 8.5, gaps, hit: false, prev: 0, dmg: U() * TUNE.roarK, stk: 1, tag: 'roar', r0: m.r });
        if (S.inst) { S.inst.fx.push({ kind: 'ringw', x: B.x, y: B.y, R: 4.6, t: 0, life: 0.8, seed: 2 }); S.inst.fx.push({ kind: 'dome', x: B.x, y: B.y, R: 2.6, t: 0, life: 0.6, seed: 4 }); }
        X.shake(10, 0.4); hiss(S.phase === 3 ? 1.2 : 1.05); sfx('crash'); say('roarG', 'THE CROWN SCREAMS', 'Its ring of blades has gaps: stand in one', COL.rose, 2.0); }
      return t >= A.dur; }
    return true;
  }
  function endAct(A) { if (A.kind === 'perd' && S.pin && S.pin.A === A) unpin(); if (A.kind === 'roar') mood(0.7); }
  // an interrupted power: its blows called off (marks fade unstruck), its parts taken away, a vanished Asmodeus shown again
  function abortActs(all) {
    S.acts.length = 0; for (const k2 of S.marks) if (!k2.done) { k2.done = true; k2.void = true; }
    if (S.pin) unpin();
    if (S.crystal) { dropPart(S.crystal.part); S.crystal = null; for (const sp of S.spines) sp.life = Math.min(sp.life, sp.t + 0.6); }
    if (S.molt) endMolt(true);
    if (all) { for (const w of S.waves) w.hit = true; if (S.web) S.web.t = Math.max(S.web.t, S.web.dur - 0.4); }
    if (S.inst) for (const f of S.inst.fx) if ((f.kind === 'riseFx' || f.kind === 'threads' || f.kind === 'shell') && f.life - f.t > 0.4) f.life = f.t + 0.4;
    S.idleT = Math.max(S.idleT, 1.0);
  }

  /* ---- Sevenfold Perdition: the pinned stinger ---- */
  function pinStinger(A) {
    if (S.pin || A.pinJ < 0 || !tailOk(A.pinJ)) return; const m = S.m, me = S.me, an = Math.atan2(me.y - m.y, me.x - m.x), d = Math.min(TUNE.pinReach, Math.max(m.r + 1.2, Math.hypot(me.x - m.x, me.y - m.y) - 1.2));
    let p = clampA(m.x + Math.cos(an) * d, m.y + Math.sin(an) * d, 0.9); if (!inA(p.x, p.y, 0.6)) p = clampA(m.x, m.y + m.r + 1.4, 0.9);
    const P = part('sting', p.x, p.y, 0.75, Math.max(1, S.tails[A.pinJ].hp)); if (!P) return; P.j = A.pinJ;
    S.pin = { A, j: A.pinJ, x: p.x, y: p.y, t: 0, part: P }; S.stat.pin++;
    if (S.inst) { S.inst.fx.push({ kind: 'strk', a: S.B, j: A.pinJ, x: p.x, y: p.y, t: 0, life: 0.34, seed: 3, sd: 1 }); S.inst.burstFx(p.x, p.y, 1, false); }   // (the tail itself holds the pin: no crystal mesh over it, one GL copy fewer)
    S.X.shake(6, 0.18); sfx('thud'); note(196, 0.5, 'triangle', 0.06);
    say('pin', 'THE PINNED STINGER', 'A blade sticks fast in the floor: strike it to break it for good', COL.gold, 2.6);
  }
  function unpin() { const P = S.pin; if (!P) return; S.pin = null; if (P.part) { S.tails[P.j].hp = Math.max(1, P.part.m.hp); dropPart(P.part); } }

  /* ---- Scarlet Rupture: spines for cover, the shatter, the rings ---- */
  function raiseSpines(A) {
    for (const sp of S.spines) sp.life = Math.min(sp.life, sp.t + 0.5);
    const m = S.m, me = S.me, n = AR.pillars.length >= 3 ? 2 : TUNE.spines, off = Math.atan2(me.y - m.y, me.x - m.x) + Math.PI / n; let made = 0;
    for (let i = 0; i < n * 4 && made < n; i++) { const an = off + (made + (i - made) * 0.29) / n * TAU, rr = TUNE.spineOut * (0.85 + Math.random() * 0.3), x = m.x + Math.cos(an) * rr, y = m.y + Math.sin(an) * rr * 0.8;
      if (!okAt(x, y, 1.0, 1.0) || S.spines.some(q => q.t < q.life - 0.5 && Math.hypot(q.x - x, q.y - y) < 2.2) || AR.pillars.some(q => Math.hypot(q.x - x, q.y - y) < q.r + 1.6)) continue;
      const life = A.shat + (A.n - 1) * TUNE.ruGap + 2.4, recs = [];
      if (S.inst) for (let s2 = 0; s2 < 3; s2++) { const r = { kind: 'spike', x: x + (s2 - 1) * 0.28, y: y + (s2 === 1 ? -0.12 : 0.1), t: -made * 0.06 - s2 * 0.04, life: 99, s: s2 === 1 ? 0.62 : 0.42, yaw: Math.random() * 6, lean: (s2 - 1) * 0.35 }; S.inst.fx.push(r); recs.push(r); }
      S.spines.push({ x, y, r: TUNE.spineR, t: 0, life, recs }); made++; }
  }
  const covers = () => S.spines.filter(q => q.t > 0.2 && q.t < q.life - 0.3).concat(AR.pillars);
  // is (x, y) in a cover's lee from a ring centred at (cx, cy)?
  const inLee = (x, y, cx, cy) => { const d = Math.hypot(x - cx, y - cy), an = Math.atan2(y - cy, x - cx); return covers().some(q => { const ds = Math.hypot(q.x - cx, q.y - cy); return ds < d - 0.2 && Math.abs(angD(Math.atan2(q.y - cy, q.x - cx), an)) < Math.atan2(q.r + 0.2, ds); }); };
  function shatter(A) {
    const X = S.X, B = S.B; S.stat.ruptShat = (S.stat.ruptShat || 0) + 1;
    if (S.inst) { S.inst.fx.push({ kind: 'shat', a: B, t: 0, life: 0.9, seed: Math.random() * 40 }); }
    X.flash(0.2, '#FFE0EA'); X.shake(10, 0.3); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.05); ruptWave(0);
  }
  function ruptWave(i) { const m = S.m; S.waves.push({ x: m.x, y: m.y, R: TUNE.ruRange, t: 0, dur: TUNE.ruRange / TUNE.ruSpd, gaps: [], hit: false, prev: 0, dmg: U() * TUNE.ruK, debtK: TUNE.ruDebtK, stk: 1, tag: 'rupt', r0: m.r, cover: true, seed: Math.random() * 40 });
    if (S.inst) S.inst.fx.push({ kind: 'wave', a: S.B, x: m.x, y: m.y, R: TUNE.ruRange, sp: TUNE.ruSpd, t: 0, life: TUNE.ruRange / TUNE.ruSpd + 0.35, i, hit: new Set(), dmg: 0, seed: Math.random() * 40, tw: 0 }); if (i) sfx('whoosh'); }

  /* ---- Crimson Labyrinth: the web ---- */
  /* where the arena gives thread anchors (the Amber Sanctum's posts and the crown's heart) the threads run from its tails to them and move
     with it as it glides (the cells sweep as it walks); elsewhere they run out to the rim from where it stood and the web turns */
  function threadGeo(W, q) { if (q.ax != null) { W.x = S.m.x; W.y = S.m.y; const dx = q.ax - W.x, dy = q.ay - W.y, d = Math.hypot(dx, dy) || 1; q.a = Math.atan2(dy, dx); q.len = Math.max(2, d - 0.55); }
    else q.len = Math.max(2, reach(W.x, W.y, q.a, 0.4, 30));
    const lo = S.m.r + 0.6 + TUNE.webGap / 2, hi = q.len - 0.5 - TUNE.webGap / 2, c0 = hi > lo ? Math.max(lo, Math.min(hi, q.fc * q.len)) : (lo + hi) / 2; q.g0 = c0 - TUNE.webGap / 2; q.g1 = c0 + TUNE.webGap / 2;   // (its gap always its full width)
    q.kx = W.x + Math.cos(q.a) * (q.len - 0.35); q.ky = W.y + Math.sin(q.a) * (q.len - 0.35); if (q.knot) { q.knot.m.x = q.kx; q.knot.m.y = q.ky; } }
  function laWeb() {
    const m = S.m, k = kOf(), tj = liveTails(), n = Math.max(3, tj.length), off = Math.random() * TAU, X = S.X, threads = [];
    const anc = AR.anchors.filter(p => Math.hypot(p.x - m.x, p.y - m.y) > 3.2).sort((p, q) => Math.atan2(p.y - m.y, p.x - m.x) - Math.atan2(q.y - m.y, q.x - m.x)), useA = anc.length >= 3;
    const take = useA ? Array.from({ length: Math.min(n, anc.length) }, (_, i) => anc[Math.floor(i * anc.length / Math.min(n, anc.length))]) : null;
    for (let i = 0; i < (useA ? take.length : n); i++) threads.push({ a: off + i / n * TAU, ax: useA ? take[i].x : null, ay: useA ? take[i].y : null, len: 2, fc: lerp(0.35, 0.8, Math.random()), cut: false, j: tj[i % Math.max(1, tj.length)], knot: null, kx: 0, ky: 0, seed: Math.random() * 40 });
    S.web = { x: m.x, y: m.y, threads, t: 0, dur: TUNE.webDur[k], spin: useA ? 0 : TUNE.webSpin[k] * (Math.random() < 0.5 ? -1 : 1), anchored: useA, hitCd: 0, seed: Math.random() * 40 };
    for (const q of threads) { threadGeo(S.web, q); q.knot = part('knot', q.kx, q.ky, 0.55, TUNE.knotHP * S.fk); }
    if (useA) webShow(0);
    if (S.inst) S.inst.fx.push({ kind: 'lab', a: S.B, x: m.x, y: m.y, R: 3.2, R0: 3.2, k: 3, t: 0, life: useA ? 2.4 : S.web.dur, tk: 0, sk: 99, seed: Math.random() * 40, spikes: [] });
    X.shake(6, 0.25); sfx('crash'); X.text(m.x, m.y - TUNE.size * 0.8, 'CRIMSON LABYRINTH', COL.rose, 14, { crit: true, life: 1.0 });
  }
  function webTick(da) {
    const W = S.web; if (!W) return; const me = S.me, X = S.X; W.t += da; W.hitCd -= da; const on = W.t > 0.6 && W.t < W.dur - 0.3;   // (drawn in first: it binds once it is laid)
    for (const q of W.threads) { if (q.cut) continue; q.a += W.spin * da; threadGeo(W, q); }
    if (on && !me.dead) {
      // the pull toward its heart
      const dx = W.x - me.x, dy = W.y - me.y, d = Math.hypot(dx, dy), pl = TUNE.webPull[kOf()] * da; if (d > 2.2 && pl > 0 && !me.dodge && !me.leap) X.moveEnt(me, dx / d * pl, dy / d * pl, 0);
      // a thread touched binds (swept: the pet's last place to this one)
      if (W.hitCd <= 0) { const px = S.pPrev ? S.pPrev.x : me.x, py = S.pPrev ? S.pPrev.y : me.y;
        for (const q of W.threads) { if (q.cut) continue; const ux = Math.cos(q.a), uy = Math.sin(q.a), side = (x, y) => -(x - W.x) * uy + (y - W.y) * ux, al = (me.x - W.x) * ux + (me.y - W.y) * uy, s0 = side(px, py), s1 = side(me.x, me.y);
          const touch = (Math.abs(s1) < TUNE.webW + me.r * 0.5 || (s0 * s1 < 0)) && al > 0.6 && al < q.len && !(al > q.g0 && al < q.g1);
          if (touch) { W.hitCd = TUNE.webCd; if (hurt(U() * TUNE.webK, { web: true }, 1)) { S.stat.webHit++; me.chill = Math.max(me.chill || 0, TUNE.webSlow); X.text(me.x, me.y - 1.6, 'Bound!', COL.rose, 13, { life: 0.8 }); } break; } } } }
    if (W.t >= W.dur) endWeb();
  }
  function endWeb() { const W = S.web; if (!W) return; for (const q of W.threads) if (q.knot) dropPart(q.knot); S.web = null; if (W.anchored) webShow(1); }

  /* ---- Eclipse Molt: the vanishing, the shells, the hunt, the ambush ---- */
  function moltTick(A, dt, cross) {
    const M = S.molt, t = A.t, m = S.m, me = S.me, X = S.X, B = S.B, k = kOf(), C = (MV() && MV().CFG.molt) || { vanish: 0.78, appear: 1.08 };
    if (!M) return true; M.t = t; B.vx *= 0.7; B.vy *= 0.7;
    if (cross(C.vanish)) {   // it vanishes into black-violet motes; its shells and itself rise round the pet
      if (S.inst) S.inst.fx.push({ kind: 'warp', x: m.x, y: m.y, t: 0, life: 0.8, seed: Math.random() * 40 }); X.flash(0.1, '#C8A0FF'); sfx('whoosh');
      M.gone = true; m.under = true; M.pose = Object.assign({}, B.asP || {}, { strikes: null, cage: 0.4, crack: 0.15, live: 0, rupt: 0 });
      const n = TUNE.mtN[k], spots = [], toC = Math.atan2(AR.cy - me.y, AR.cx - me.x), base = toC - 1.55;
      // (each a whole body: set well apart, round the pet but not on it, wider in x than in y: the view is tall)
      for (let sep = 4.6; sep >= 3.0 && spots.length < n + 1; sep -= 0.4) { spots.length = 0; for (let i = 0; i < 80 && spots.length < n + 1; i++) { const an = base + (spots.length + 0.5) / (n + 1) * 3.1 + (Math.random() - 0.5) * 0.35, d = 4.6 + Math.random() * 1.4, x = me.x + Math.cos(an) * d * 1.15, y = me.y + Math.sin(an) * d * 0.8;   // (an arc on the arena's side of the pet: all of them in one view)
        if (!okAt(x, y, TUNE.pad - 0.4, 1.2) || spots.some(p => Math.hypot(p.x - x, p.y - y) < sep)) continue; spots.push({ x, y }); } }
      while (spots.length < n + 1) { const an = spots.length / (n + 1) * TAU + base, p = clampA(AR.cx + Math.cos(an) * AR.rx * 0.6, AR.cy + Math.sin(an) * AR.ry * 0.6, TUNE.pad); spots.push(p); }
      const ri = S.realAt != null ? S.realAt % spots.length : Math.floor(Math.random() * spots.length); M.spots = spots; M.real = spots[ri];
      M.shells = spots.filter((p, i) => i !== ri).map((p, i) => ({ x: p.x, y: p.y, yaw: faceTo(p.x, p.y, me.x, me.y), part: null, done: false, burstT: null, i, seed: Math.random() * 40 })); }
    if (cross((C.vanish + C.appear) / 2) && M.real) { m.x = M.real.x; m.y = M.real.y; B.x = m.x; B.y = m.y; B.yaw = B.yawT = faceTo(m.x, m.y, me.x, me.y);
      for (const s of M.shells) { s.part = part('shell', s.x, s.y, m.r * 0.9, 1e5); if (S.inst) S.inst.fx.push({ kind: 'warp', x: s.x, y: s.y, t: 0, life: 0.7, seed: Math.random() * 40, in: 1 }); }
      if (S.inst) S.inst.fx.push({ kind: 'warp', x: m.x, y: m.y, t: 0, life: 0.7, seed: Math.random() * 40, in: 1 });
      M.dobjs = M.shells.map(s => S.H && S.H.obj ? S.H.obj({ x: s.x, y: s.y, dy: 0.25, kind: 'sxShell', r: 0, label: '', draw: c => safeDraw(c, cc => drawShell(cc, s)) }) : null).filter(Boolean); }
    if (cross(C.appear) && M.real) { M.gone = false; m.under = false; M.hunt = true; M.huntT = 0; say('molt', 'ECLIPSE MOLT', 'Shells of itself: find the one that breathes, casts a shadow and whose heart beats', COL.violet, 2.8); }
    if (M.hunt && !M.found) { M.huntT += dt; B.yawT = faceTo(m.x, m.y, me.x, me.y);
      for (const s of M.shells) if (!s.done && s.part && s.part.cracking != null && S.t - s.part.cracking >= TUNE.mtCrack) shellBurst(s, false);
      const H = TUNE.mtHunt[k];
      if (M.huntT >= H - TUNE.mtTell && !M.amb) { const fa = Math.atan2(me.vy || 0, me.vx || 0), mv = Math.hypot(me.vx || 0, me.vy || 0) > 0.3, an = mv ? fa + Math.PI : Math.atan2(me.y - m.y, me.x - m.x), p = clampA(me.x + Math.cos(an) * 0.6, me.y + Math.sin(an) * 0.6, 0.8);
        M.amb = { x: p.x, y: p.y, t: 0 }; S.stat.ambush++; note(220, 0.6, 'sawtooth', 0.05, 110); }
      if (M.amb) { M.amb.t += dt; if (M.amb.t >= TUNE.mtTell && !M.amb.done) { M.amb.done = true; ambush(M); } }
      if (M.amb && M.amb.done && M.amb.t >= TUNE.mtTell + 0.9) { endMolt(false); return true; } }
    if (M.found) { endMolt(false); return true; }
    return false;
  }
  function moltFound() { const M = S.molt; if (!M || M.found) return; M.found = true; S.stat.moltFound++; for (const s of M.shells) if (!s.done) { s.done = true; s.quiet = true; if (s.part) dropPart(s.part); if (S.inst) S.inst.fx.push({ kind: 'shatS', x: s.x, y: s.y, t: 0, life: 0.6, seed: s.seed }); }
    endMolt(false); expose('Found!'); }
  function shellBurst(s, early) { const me = S.me, X = S.X; if (s.done) return; s.done = true; if (s.part) dropPart(s.part); S.stat.shellBurst++;
    if (!me.dead && Math.hypot(me.x - s.x, me.y - s.y) < TUNE.mtR + me.r * 0.5) { if (hurt(U() * TUNE.mtK, { shell: true }, 1)) { S.stat.shellHit++; const an = Math.atan2(me.y - s.y, me.x - s.x); me.push = { vx: Math.cos(an) * 8, vy: Math.sin(an) * 8, t: 0.2 }; } }
    if (S.inst) { S.inst.fx.push({ kind: 'shatS', x: s.x, y: s.y, t: 0, life: 0.8, seed: s.seed }); S.inst.burstFx(s.x, s.y, 2, true); } X.shake(8, 0.25); sfx('crash'); void early; }
  function ambush(M) { const m = S.m, me = S.me, X = S.X, B = S.B, p = M.amb;
    if (S.inst) S.inst.fx.push({ kind: 'warp', x: m.x, y: m.y, t: 0, life: 0.6, seed: Math.random() * 40 });
    const d = Math.hypot(p.x - AR.cx, p.y - AR.cy) || 1, q = clampA(p.x + (p.x - me.x) * 0.2 - (p.x - AR.cx) / d * 0.3, p.y - 1.2, TUNE.pad - 0.6); m.x = q.x; m.y = q.y; B.x = m.x; B.y = m.y; B.yaw = B.yawT = faceTo(m.x, m.y, p.x, p.y);
    if (!me.dead && Math.hypot(me.x - p.x, me.y - p.y) < TUNE.mtAmbR + me.r * 0.5) { if (hurt(U() * TUNE.mtAmbK, { ambush: true }, TUNE.mtAmbStk)) { S.stat.ambushHit++; const an = Math.atan2(me.y - p.y, me.x - p.x); me.push = { vx: Math.cos(an) * 9, vy: Math.sin(an) * 9, t: 0.22 }; } }
    if (S.inst) { S.inst.fx.push({ kind: 'warp', x: m.x, y: m.y, t: 0, life: 0.6, seed: Math.random() * 40, in: 1 }); S.inst.fx.push({ kind: 'strk', a: B, j: 3, x: p.x, y: p.y, t: 0, life: 0.34, seed: 5, sd: -1 }); S.inst.burstFx(p.x, p.y, 2, true); }
    X.flash(0.14, '#E0C8FF'); X.shake(11, 0.3); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.05);
    for (const s of M.shells) if (!s.done) shellBurst(s, false); }
  function endMolt(abort) { const M = S.molt; if (!M) return; S.molt = null; const m = S.m; m.under = false;
    for (const s of M.shells) { if (s.part) dropPart(s.part); s.done = true; }
    if (M.dobjs) { const R = S.X.rift, list = R && R.objs; for (const o of M.dobjs) { o.draw = null; if (list) { const i = list.indexOf(o); if (i >= 0) list.splice(i, 1); } } M.dobjs = null; }
    if (abort && M.gone) { m.x = M.sx; m.y = M.sy; S.B.x = m.x; S.B.y = m.y; } }

  /* ---- the hazards in the world: marks (Perdition, the impale, the eruption, the Seven Stings), rings, spines, the web ---- */
  function hazardsTick(da, dt) {
    const me = S.me, m = S.m, X = S.X, alive = (S.mode === 'fight') && !m.dead && !me.dead;
    // a mark of light: it follows the pet until it locks, then the stinger falls
    for (let i = S.marks.length - 1; i >= 0; i--) { const k2 = S.marks[i], t0 = k2.t; k2.t += k2.done ? dt : da;
      if (!k2.done && k2.follow && k2.t < k2.tell - k2.lock && !me.dead) { const p = clampA(me.x, me.y, 0.5), w = Math.min(1, da * 6); k2.x += (p.x - k2.x) * w; k2.y += (p.y - k2.y) * w; }
      if (!k2.done && t0 < k2.tell && k2.t >= k2.tell) { k2.done = true; k2.blew = true; markBlow(k2, alive); }
      if (k2.t > k2.tell + 0.6 || (k2.done && !k2.blew && k2.t > 0.5)) S.marks.splice(i, 1); }
    // the rings: their front strikes once as it passes, except in a gap or a cover's lee
    for (let i = S.waves.length - 1; i >= 0; i--) { const w = S.waves[i]; w.t += da; const u = cl(w.t / w.dur), rw = (w.r0 || 0) + (w.R - (w.r0 || 0)) * (w.tag === 'show' ? eout(u) : u);
      if (!w.hit && alive) { const d = Math.hypot(me.x - w.x, me.y - w.y);
        if (d - me.r <= rw && d + me.r >= w.prev - 0.3) { w.hit = true; const an = Math.atan2(me.y - w.y, me.x - w.x), sl = d > 0.1 ? Math.asin(Math.min(1, me.r * 0.6 / d)) : 0;
          const gap = w.gaps && w.gaps.some(q => Math.abs(angD(an, q.a)) < q.w / 2 - sl), cover = w.cover && inLee(me.x, me.y, w.x, w.y);
          if (gap) S.stat.waveGap = (S.stat.waveGap || 0) + 1; else if (cover) S.stat.ruptCover++;
          else if (w.dmg > 0 && hurt(w.dmg * (1 + (w.debtK || 0) * S.debt), { wave: w.tag }, w.stk || 0)) { if (w.tag === 'roar') S.stat.roarHit++; else if (w.tag === 'rupt') S.stat.ruptHit++; me.push = { vx: Math.cos(an) * 7, vy: Math.sin(an) * 7, t: 0.2 }; } } }
      if (u >= 1 && !w.hit) w.hit = true; w.prev = rw; if (w.t >= w.dur + 0.45) S.waves.splice(i, 1); }
    // the spines: rising, standing (the pet walks round them), crumbling
    for (let i = S.spines.length - 1; i >= 0; i--) { const sp = S.spines[i]; sp.t += dt; for (const r of sp.recs) r.life = Math.min(r.life, r.t + Math.max(0, sp.life - sp.t) + 0.45);
      if (sp.t > 0.15 && sp.t < sp.life - 0.3 && !me.dead && !me.leap) { const dx = me.x - sp.x, dy = me.y - sp.y, d = Math.hypot(dx, dy), r0 = sp.r + me.r * 0.8; if (d < r0) { const ux = d > 1e-4 ? dx / d : 0, uy = d > 1e-4 ? dy / d : 1; X.moveEnt(me, ux * (r0 - d), uy * (r0 - d), 0); } }
      if (sp.t >= sp.life + 0.5) S.spines.splice(i, 1); }
    if (S.pin) S.pin.t += da;
    if (alive) webTick(da); else if (S.web && S.mode !== 'fight') endWeb();
    S.pPrev = { x: me.x, y: me.y };
  }
  function markBlow(k2, alive) {
    const me = S.me, X = S.X, B = S.B; let hit = false;
    if (alive && Math.hypot(me.x - k2.x, me.y - k2.y) < k2.R + me.r * 0.5) { const h = hurt(U() * k2.k, { mark: k2.tag }, k2.stk); if (h) { hit = true; const an = Math.atan2(me.y - k2.y, me.x - k2.x); me.push = { vx: Math.cos(an) * (k2.big ? 9 : 6), vy: Math.sin(an) * (k2.big ? 9 : 6), t: 0.2 }; } }
    if (k2.tag === 'perd') { S.stat.perdHit += hit ? 1 : 0; if (S.inst) { S.inst.fx.push({ kind: 'strk', a: B, j: k2.j >= 0 ? k2.j : 3, x: k2.x, y: k2.y, t: 0, life: 0.34, seed: k2.seed, sd: Math.random() < 0.5 ? -1 : 1 }); S.inst.burstFx(k2.x, k2.y, 1, false); } X.shake(3.5, 0.08); sfx('whoosh'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.02); }
    else if (k2.tag === 'fin') { S.stat.finHit += hit ? 1 : 0; if (S.inst) { for (const j of liveTails()) S.inst.fx.push({ kind: 'strk', a: B, j, x: k2.x, y: k2.y, t: 0, life: 0.4, seed: j * 7, sd: j % 2 ? -1 : 1 }); S.inst.fx.push({ kind: 'imp7', x: k2.x, y: k2.y, t: 0, life: 1.0, seed: k2.seed }); S.inst.burstFx(k2.x, k2.y, 3, true); } X.flash(0.16, '#FFC0D8'); X.shake(12, 0.35); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06); }
    else if (k2.tag === 'erupt') { S.stat.eruptHit += hit ? 1 : 0; if (S.inst) { const I = S.inst.fx; I.push({ kind: 'pillar', x: k2.x, y: k2.y, R: 1.0, H: 8, t: 0, life: 1.3, seed: k2.seed }); I.push({ kind: 'field', x: k2.x, y: k2.y, R: k2.R * 1.1, t: 0, life: 2.0, seed: k2.seed }); S.inst.waveFx(k2.x, k2.y, k2.R * 1.2); S.inst.burstFx(k2.x, k2.y, 3, true); } X.flash(0.2, '#FFD0E0'); X.shake(15, 0.45); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06); }
    else if (k2.tag === 'sin') { S.stat.sinHit += hit ? 1 : 0; if (S.inst) { S.inst.fx.push({ kind: 'sting', i: k2.si, x: k2.x, y: k2.y, t: 0, life: 2.2, seed: k2.seed, cine: 1 }); S.inst.fx.push({ kind: 'strk', a: B, j: k2.j >= 0 ? k2.j : 3, x: k2.x, y: k2.y, t: 0, life: 0.34, seed: k2.seed, sd: k2.si % 2 ? -1 : 1, cine: 1 }); S.inst.burstFx(k2.x, k2.y, 2, k2.si >= 2); } X.shake(8 + (k2.si || 0), 0.25); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.04); }
    else if (k2.tag === 'sin7') { S.stat.sinHit += hit ? 1 : 0; if (S.inst) { S.inst.fx.push({ kind: 'pillar', x: k2.x, y: k2.y, R: 1.4, H: 13, t: 0, life: 1.6, seed: 3, cine: 1 }); S.inst.fx.push({ kind: 'field', x: k2.x, y: k2.y, R: 4, t: 0, life: 3.0, seed: 9, cine: 1 }); S.inst.burstFx(k2.x, k2.y, 3, true); } X.flash(0.3, '#FFC0D8'); X.shake(18, 0.5); sfx('crash'); X.light(k2.x, k2.y, 8, 0.8); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.07); }
  }

  /* ================= The Seventh Sin: the last phase's end ================= */
  function refugesFor() {
    const out = []; for (let s = 1; s >= 0.5 && out.length < 4; s -= 0.1) { out.length = 0; for (let i = 0; i < TUNE.sealN; i++) { const an = i / TUNE.sealN * TAU - Math.PI / 2, x = AR.cx + Math.cos(an) * AR.rx * TUNE.refK * s, y = AR.cy + Math.sin(an) * AR.ry * TUNE.refK * s;
      if (okAt(x, y, 0.9, TUNE.refR) && Math.hypot(x - S.m.x, y - S.m.y) > S.m.r + TUNE.refR + 0.4) out.push({ x, y, i }); } }
    return out;
  }
  function startSin() {
    const m = S.m, B = S.B, X = S.X; abortActs(true); if (S.expose) endExpose(); endWeb();
    for (const P of S.parts.slice()) dropPart(P);
    S.pad = { kind: 'sin', base: Math.max(1, m.hp), buf: 1e7 }; m.hp += S.pad.buf; S.lastM = m.hp;
    const order = [3, 1, 5, 0, 6, 2, 4], refs = refugesFor();
    S.sin = { t: 0, refs, order, marks: [], hit: false, safe: false, seed: Math.random() * 1000, rec: null }; S.sinDone = true; S.stat.sin++; S.stat.sinAt = S.g.t - S.stat.t0; B.vx = B.vy = 0; B.mv = 0;
    say('sin', 'THE SEVENTH SIN', 'Keep moving off the marks, then stand in a lit seal before the Testament', COL.pale, 3.2); mood(1.6);
    if (S.inst) { S.inst.fx.push({ kind: 'field', x: B.x, y: B.y, R: 6, t: 0, life: UTo().p6 + 1.0, seed: 9, cine: 1 }); S.inst.fx.push({ kind: 'sig', x: B.x, y: B.y, R: 4.4, t: 0, life: UTo().det + 0.6, cine: 1 }); }
    S.sinRec = S.inst ? { kind: 'sin', a: B, x: B.x, y: B.y, t: 0, life: UTo().len + 0.4, k: 3, seed: S.sin.seed, cine: 1 } : null; if (S.sinRec) S.inst.fx.push(S.sinRec);
    sfx('hum'); X.after(0.7, () => { if (S && S.sin) sfx('hum'); }); note(55, 3.5, 'sawtooth', 0.1, 110);
  }
  function sinTick(dt) {
    const J = S.sin, B = S.B, m = S.m, me = S.me, X = S.X, UT = UTo(), t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x;
    if (t < UT.p2 && Math.random() < dt * 8) X.shake(0.8 + t * 0.8, 0.08);
    for (let i = 0; i < 7; i++) if (cross(0.25 + i * 0.27)) { if (tailOk(J.order[i])) chimeOf(i + 1); }   // (the seven blades lighting in turn; a broken one stays dark)
    if (cross(UT.p2)) { X.shake(8, 0.4); sfx('crash'); }
    if (cross(UT.p3)) { sfx('hum'); X.flash(0.12, '#FFC0D8'); }
    // the Seventh Sting: six marks (one for each stinger left), each on the pet's place, then the seventh with all of them
    for (let i = 0; i < 6; i++) { const j = J.order[i]; if (!tailOk(j)) continue; if (cross(UT.s[i] - TUNE.snTell)) { const p = clampA(me.x, me.y, 0.5); S.marks.push({ x: p.x, y: p.y, R: TUNE.snR, t: 0, tell: TUNE.snTell, lock: 0.3, k: TUNE.snK, stk: 1, tag: 'sin', j, si: i, follow: true, done: false, seed: Math.random() * 40 }); } }
    if (intact() > 0 && cross(UT.s7 - TUNE.sn7Tell)) { const p = clampA(me.x, me.y, 0.5); S.marks.push({ x: p.x, y: p.y, R: TUNE.sn7R * (0.55 + 0.45 * intact() / 7), t: 0, tell: TUNE.sn7Tell, lock: 0.4, k: TUNE.sn7K, stk: 1, tag: 'sin7', j: 3, si: 6, follow: true, done: false, seed: Math.random() * 40, big: true }); }
    if (cross(UT.col)) sfx('hum');
    // the Crimson Testament: outside a seal a crushing share of the pet's health, more for its debt (never lethal from full); in a seal only the debt
    if (cross(UT.det)) { const inR = J.refs.some(r => Math.hypot(me.x - r.x, me.y - r.y) < TUNE.refR + me.r * 0.25), s2 = ST(), mx = s2 ? s2.hp : 200, n = S.debt; S.stat.sinTs++;
      let d = inR ? mx * TUNE.tsIn * n : mx * (TUNE.tsK + TUNE.tsDebt * n); if (me.hp >= mx * 0.97) d = Math.min(d, me.hp - 1); d /= S.fd;   // (a share of its health as it lands: the rift's blow factor taken back out)
      if (inR) { S.stat.sinSafe++; X.text(me.x, me.y - 1.6, n ? 'Sheltered: only your debt detonates' : 'Sheltered in the seal', COL.cool, 14, { life: 1.3 }); }
      if (d > 0 && !me.dead) { const h0 = me.hp; me.inv = me.dodge ? me.inv : 0; if (S.X.hurtPet(d, m, { sin: true })) { S.stat.dmgIn += Math.max(0, h0 - me.hp); J.hit = true; if (!inR) X.text(me.x, me.y - 1.8, 'The Testament!', COL.rose, 15); } }
      clearDebt(); if (S.inst) { S.inst.fx.push({ kind: 'testament', x: B.x, y: B.y, t: 0, life: 3.0, seed: J.seed, k: 3, cine: 1 }); if (n) S.inst.fx.push({ kind: 'det', x: me.x, y: me.y, t: 0, life: 0.8, n, seed: 3, cine: 1 }); }
      X.flash(0.5, '#FFE0EA'); X.shake(lowFx() ? 16 : 26, 0.9); sfx('crash'); X.after(0.3, () => { if (S) sfx('fanfare'); }); X.light(B.x, B.y, 12, 1.2); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.09); mood(2); }
    if (t >= UT.p6) fall(true);
  }

  /* ---- the fall: the Last Whisper; it dissolves, legs first, the Crucible last, a single ruby spark; the gate completes ---- */
  function fall(fromSin) {
    if (!S || S.mode === 'dead' || S.mode === 'over') return; const m = S.m, X = S.X, g = S.g;
    if (!fromSin) { abortActs(true); X.flash(0.6, '#FFFFFF'); g.hitStop = Math.max(g.hitStop || 0, 0.1); X.shake(16, 0.7); sfx('crash'); }
    for (const P of S.parts.slice()) dropPart(P); if (S.molt) endMolt(true);
    if (S.pad) m.hp = Math.max(1, S.pad.base); S.mode = 'dead'; S.deadT = fromSin ? S.sin.t - UTo().p6 : 0; S.fromSin = !!fromSin; S.sin = null; S.pad = null; S.expose = null; S.pin = null; S.crystal = null; endWeb(); clearDebt(); S.B.alpha = 1;
    S.marks.length = 0; S.waves.length = 0; S.pools.length = 0;
    m.act = 'dead'; m.stunT = 0; m.guardFn = null; m.under = false; S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1); g.slowT = 0; mood(0.8);
  }
  const FALL = () => { const UT = UTo(); return UT.len - UT.p6 + 1.0; };
  function deadTick(dt) {
    const B = S.B, X = S.X, t0 = S.deadT; S.deadT += dt; const t = S.deadT, cross = x => t0 < x && t >= x, UT = UTo();
    if (cross(0.6)) { X.banner('THE FESTER FALLS', 'Asmodeus folds its seven stingers: the Scorpion\'s venom answers you', COL.rose, 3.0, true, true); sfx('sparkle'); mood(0.4); }
    if (t > 0.4 && t < FALL() - 0.4 && Math.random() < dt * 14 * LQ()) X.part({ kind: 'ember', x: B.x + (Math.random() - 0.5) * 3.2, y: B.y - Math.random() * 4, vx: (Math.random() - 0.5) * 0.8, vy: -1.2 - Math.random() * 1.2, life: 1.2, max: 1.2, size: 3.2, color: Math.random() < 0.5 ? COL.pink : COL.violet });
    if (cross(UT.len - UT.p6 - 0.1)) { if (S.inst) S.inst.fx.push({ kind: 'spark1', x: B.x, y: B.y, t: 0, life: 1.4, cine: 1 }); X.flash(0.3, '#FFE6EE'); X.light(B.x, B.y - 1, 7, 1.0); sfx('chime'); }
    if (t >= FALL()) { const X2 = X; finish(); try { X2.winStage(); } catch (e) { /* (the stage already ended) */ } }
  }
  function finish() { if (!S) return; const m = S.m; cleanup(); try { if (m && !m.dead) { m.hp = 0; m.dead = true; } } catch (e) {} S.mode = 'over'; }

  /* ================= clean-up ================= */
  function cleanup() {
    if (!S) return; const g = S.g, m = S.m;
    try { S.acts.length = 0; S.marks.length = 0; S.waves.length = 0; S.spines.length = 0; S.pools.length = 0; S.sin = null; S.expose = null; S.seal = null; S.debt = 0; if (S.molt) endMolt(true); S.molt = null; S.pin = null; S.crystal = null; endWeb(); for (const p of S.pools) fontLit(p.font, 0.35); S.pools.length = 0; mood(1); } catch (e) {}
    try { for (const P of S.parts.slice()) dropPart(P); S.parts.length = 0; } catch (e) {}
    try { if (S.pad && m && !m.dead) m.hp = S.pad.base; S.pad = null; } catch (e) {}
    try { if (S.me && S.me.chill > 0) S.me.chill = 0; } catch (e) {}
    try { if (S.cine) { S.cine = false; if (g.cineT > 0) g.cineT = 0; } } catch (e) {}
    try { const R = S.X && S.X.rift, list = R && R.objs; if (list) for (const o of S.objs) { const i = list.indexOf(o); if (i >= 0) list.splice(i, 1); } for (const o of S.objs) o.draw = null; S.objs.length = 0; } catch (e) {}
    try { if (S.inst) S.inst.stop(); } catch (e) {} S.inst = null;   // (its effects dropped and Asmodeus's GPU buffers freed: ASMODEUS_GL.release)
    try { if (m) { m.ownBar = null; m.goalFn = null; m.guardFn = null; m.stunT = 0; m.under = false; } } catch (e) {}
  }
  function stop() { if (!S) return; const s = S; try { cleanup(); } catch (e) {} try { const g = s.g, m = s.m; if (m && !m.dead) { m.dead = true; } if (g && g.boss === m) g.boss = null; } catch (e) {} S = null; }
  const active = () => !!(S && S.mode !== 'over');

  /* ================= the pose: the Anima's own (20g5: ASMODEUS_MOVES.poseFor for each power, ultPose for The Seventh Sin and the fall,
     easePose to ease it, ASMODEUS_GL.idlePose at rest), with what only the boss has laid over it: the entrance, the pinned tail held in the
     floor, the bared Crucible, the broken stingers (folded away: unf), the phase's quickening ================= */
  function poseOf(dt) {
    const B = S.B, m = S.m, me = S.me, G = GLS(), Mv = MV(), A = S.acts[0], UT = UTo(), CF = Mv ? Mv.CFG : null;
    const base = G ? G.idlePose(3, B.at) : { k: 3, core: 0.9 };
    const pf = (kind, t, o) => (Mv && Mv.poseFor ? Mv.poseFor(kind, t, Object.assign({ base, k: 3 }, o)) : { core: 0.9 });
    let tg;
    if (S.sin) { const aims = S.sin.order.slice(0, 6).map(j => { const mk = S.marks.find(q => q.j === j && q.tag === 'sin'); return { i: j, A: aimAt(mk ? mk.x : me.x, mk ? mk.y : me.y, 0.8) }; }); const m7 = S.marks.find(q => q.tag === 'sin7');
      tg = Mv && Mv.ultPose ? Mv.ultPose(S.sin.t, { aims, ctr: aimAt(m7 ? m7.x : me.x, m7 ? m7.y : me.y, 0.6) }) : pf('rest', 0, {});
      if (tg.strikes) tg.strikes = tg.strikes.filter(q => tailOk(q.i)); }
    else if (S.mode === 'dead') tg = Mv && Mv.ultPose ? Mv.ultPose(UT.p6 + S.deadT, {}) : pf('rest', 0, {});
    else if (A && S.mode === 'fight') {
      if (A.kind === 'perd') { const aims = []; for (let i = 0; i < A.n; i++) { const mk = A.hits[i]; aims.push({ i: A.order[i % A.order.length], A: aimAt(mk ? mk.x : me.x, mk ? mk.y : me.y, 1.2), Af: A.finM ? aimAt(A.finM.x, A.finM.y, 0.8) : null }); }
        tg = pf('perd', Math.min(A.t, A.end + 0.3), { n: A.n, wind: A.wind, gap: A.gap, k: A.fin ? 3 : 2, aims });
        if (tg.strikes && A.fin) tg.strikes = tg.strikes.filter(q => tailOk(q.i)); }
      else if (A.kind === 'lash') { tg = pf('rest', 0, {}); const e = Mv ? Mv.strikeE(A.t, A.tell, 0.4) : 0, p = { x: m.x + Math.cos(A.a) * TUNE.lashR, y: m.y + Math.sin(A.a) * TUNE.lashR }; tg.crouch = 0.3 * sstep(0, A.tell, A.t); tg.jaw = 0.5 * e; tg.bladeHeat = 0.4 + e; tg.reach = 0.4 * e; if (e > 0.003) tg.strikes = [{ i: A.j, A: aimAt(p.x, p.y, 0.8), e }]; }
      else if (A.kind === 'rupt') { const C = CF ? CF.rupt : { conv: 0.55, grow: 1.45, shatter: 1.62 }, tm = A.t < 0.6 ? A.t * C.conv / 0.6 : A.t < A.shat ? lerp(C.conv, C.grow, (A.t - 0.6) / A.grow) : C.shatter + (A.t - A.shat); tg = pf('rupt', tm, {}); }
      else if (A.kind === 'lab') { const W = S.web, aims = []; if (W) for (const q of W.threads.slice(0, 4)) aims.push({ i: q.j, A: aimAt(W.x + Math.cos(q.a) * 3, W.y + Math.sin(q.a) * 2.2, 0.3) }); else for (const j of liveTails().slice(0, 4)) aims.push({ i: j, A: aimAt(m.x + Math.cos(j) * 3, m.y + Math.sin(j) * 2, 0.3) }); tg = pf('lab', A.t, { cast: A.cast, aims }); }
      else if (A.kind === 'molt') { const C = CF ? CF.molt : { vanish: 0.78, appear: 1.08, strike: 1.3 }, M = S.molt; let tm = A.t; if (M && M.hunt) tm = M.amb ? lerp(C.appear + 0.15, C.strike, sstep(0, TUNE.mtTell, M.amb.t)) + (M.amb.done ? M.amb.t - TUNE.mtTell : 0) : C.appear + 0.2;
        tg = pf('molt', tm, { aims: M && M.amb ? [{ i: 3, A: aimAt(M.amb.x, M.amb.y, 1.4) }] : [] }); }
      else if (A.kind === 'roar') tg = pf('rise', A.t, {});
      else tg = pf('rest', 0, {}); }
    else tg = pf('rest', 0, {});
    if (S.mode === 'fight' && !S.sin) {
      if (S.pin) { const P = S.pin, e = sstep(0, 0.12, P.t), q = { i: P.j, A: aimAt(P.x, P.y, 0), e: e * (1 - sstep(TUNE.pinT - 0.2, TUNE.pinT, P.t)) }; tg.strikes = (tg.strikes || []).filter(z => z.i !== P.j).concat([q]); tg.crouch = Math.max(tg.crouch || 0, 0.3); tg.bladeHeat = Math.max(tg.bladeHeat || 0, 0.5); tg.lash = 0.4; }
      if (S.expose) { const V = S.expose, e = sstep(0, 0.3, V.t) * (1 - sstep(V.dur - 0.4, V.dur, V.t)), hit = S.heartT > 0 ? S.heartT / 0.35 : 0;
        tg.open = Math.max(tg.open || 0, 0.75 * e); tg.heartUp = Math.max(tg.heartUp || 0, 0.25 * e); tg.core = (tg.core || 0.9) + 1.6 * e; tg.crouch = Math.max(tg.crouch || 0, 0.4 * e); tg.head = (tg.head || 0) + 0.4 * e; tg.live = Math.min(tg.live == null ? 1 : tg.live, 1 - 0.6 * e); tg.lash = 0.3; tg.crack = Math.max(tg.crack || 0, 0.35 * e);
        tg.stagger = (tg.stagger || 0) + 0.12 * e * Math.sin(S.t * 5) + 0.35 * hit; tg.jaw = Math.max(tg.jaw || 0, 0.3 * e); }
      if (S.molt && S.molt.hunt && !S.molt.found) { const bt = (S.t * 1.4) % 1; tg.core = (tg.core || 0.9) + 1.2 * Math.exp(-bt * 7); tg.live = 1; }   // (the real one's Crucible beats)
      if (S.crystal) tg.bladeHeat = Math.max(tg.bladeHeat || 0, 0.5);
      if (S.debt >= 7) tg.glow = (tg.glow || 0) + 0.15;
      tg.glow = (tg.glow || 0) + (S.phase - 1) * 0.06; tg.core = (tg.core == null ? 0.9 : tg.core) + (S.phase - 1) * 0.15; tg.lash = (tg.lash == null ? 1 : tg.lash) + (S.phase - 1) * 0.25; }
    // the entrance: the cocoon rising and cracking, the stingers unfolding one by one, the body out of the dark, the Crucible waking, the mask lifting
    if (S.mode === 'intro') { const e = Math.max(0, B.en); tg.coc = e < 2.35 ? sstep(0.45, 1.3, e) + sstep(1.35, 2.3, e) * 0.95 : 0; tg.unf = 7 * sstep(1.45, 2.55, e); tg.asm = sstep(2.25, 3.05, e); tg.core = lerp(0.1, 1.6, sstep(2.7, 3.0, e)) * (1 - 0.3 * sstep(3.1, 3.4, e)); tg.head = 0.7 * (1 - sstep(2.85, 3.25, e)); tg.crown = bump(e, 3.0, 3.2, 3.3, 3.6); tg.live = 0.4 + 0.6 * sstep(3.0, 3.4, e); tg.seq = 7 * sstep(2.6, 3.1, e); tg.crouch = 0.5 * (1 - sstep(2.4, 3.0, e)); }
    if (m.flinch > 0) { m.flinch = Math.max(0, m.flinch - dt * 2.5); tg.stagger = Math.max(tg.stagger || 0, Math.sin(m.flinch * Math.PI) * 0.6); }
    const pz = Mv && Mv.easePose ? Mv.easePose(B, tg, dt) : tg;
    if (!S.sin && S.mode !== 'dead' && B.yawT != null) { const rate = 3.0 * dt, dd = angD(B.yawT, B.yaw); B.yaw += Math.max(-rate, Math.min(rate, dd * Math.min(1, dt * 6) * 5)); }
    { const sp = Math.hypot(B.vx || 0, B.vy || 0), moving = !A || A.kind === 'lash'; B.mv += ((moving ? sp / 2.2 : 0) - B.mv) * Math.min(1, dt * 4); B.mv = cl(B.mv); B.run += ((B.mv > 0.85 ? 1 : 0) - B.run) * Math.min(1, dt * 3); }
    // the broken stingers folded away (the outer pairs first, as the entrance unfolds them last): 7 - broken, eased
    B.unf += ((7 - S.brokenN) - B.unf) * Math.min(1, dt * 3);
    const still = S.sin || S.mode === 'dead';
    B.asP = Object.assign(base, pz, { k: 3, t: B.at, yaw: B.yaw + (still ? (tg.yawOff || 0) : 0), ph: B.ph, mv: still ? 0 : B.mv, run: still ? 0 : B.run, mvA: B.mvA, crouch: (pz.crouch || 0) + 0.45 * B.run * B.mv, strikes: pz.strikes,
      coc: tg.coc || 0, unf: S.mode === 'intro' ? (tg.unf == null ? 7 : tg.unf) : B.unf, asm: tg.asm == null ? 1 : tg.asm, dis: tg.dis || 0, rupt: pz.rupt, vflow: null });
    m.face = Math.cos(B.yaw) >= 0 ? 1 : -1;
  }

  /* ================= drawing ================= */
  function safeDraw(c, f) { if (!S || S.mode === 'over') return; c.save(); try { f(c); } catch (e) { if (!S.drawErr) { S.drawErr = 1; try { console.warn('Asmodeus boss draw: ' + (e && e.message || e)); } catch (e2) {} } } c.restore(); }
  const sx = x => S.X.sx(x), sy = y => S.X.sy(y), Tz = () => S.X.Tz();
  /* the ground: the hush, its shadow, the Anima's ground effects (not The Seventh Sin's own seals: ours are the refuges), then the tells:
     the marks, the Lash's arc, the pinned stinger's glint, the crystal's reach and the spines' lee, the web, the shells' and the ambush's
     glints, the starlight, the bared Crucible's arc, the seals of The Seventh Sin; then the rings with their gaps */
  function drawGroundLayer(c) {
    const T = Tz(), B = S.B, on = gpu(), X = S.X, W = X.W(), Hh = X.H(), UT = UTo();
    let dim = 0; if (S.mode === 'intro') dim = 0.42 * (1 - sstep(3.6, 5.6, S.introT)); if (S.mode === 'dead') dim = 0.25 * (1 - sstep(1.5, FALL(), S.deadT));
    if (S.sin) { const t = S.sin.t; dim = Math.max(dim, 0.5 * sstep(0, 1.4, t) * (1 - sstep(UT.det, UT.det + 0.35, t)) + 0.2 * sstep(UT.det, UT.det + 0.35, t)); }
    if (dim > 0.005) { const fx = sx(B.x), fy = sy(B.y) - T * 2, gr = c.createRadialGradient(fx, fy, Math.min(W, Hh) * 0.1, fx, fy, Math.max(W, Hh) * 0.8); gr.addColorStop(0, `rgba(12,4,10,${(dim * 0.4).toFixed(3)})`); gr.addColorStop(1, `rgba(5,1,4,${Math.min(0.9, dim * 1.4).toFixed(3)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); }
    const r = B.asOut && B.asOut.r, al = B.alpha * (1 - (B.asP ? B.asP.dis || 0 : 0)), gone = S.molt && S.molt.gone;
    if (!on) { if (typeof shadeSprite === 'function' && !gone) { c.globalAlpha = 0.4 * al; blitSized(c, shadeSprite('#05030A'), sx(B.x) - T * 2.2, sy(B.y) - T * 0.7, T * 4.4, T * 1.4); c.globalAlpha = 1; } drawGround2d(c); return; }
    { const Q = fgOpen(c); if (!gone) { if (r && al > 0.02) { Q.sshadow(r.ground[0], r.ground[1], T * 2.0, T * 0.85, 0.45 * al, '#0C0408'); for (const p of r.feet || []) Q.sshadow(p[0], p[1], T * 0.28, T * 0.13, 0.5 * al, '#0A0306'); } else Q.sshadow(sx(B.x), sy(B.y), T * 2.0, T * 0.85, 0.35 * B.alpha, '#0C0408'); } fgClose(c); }
    if (S.inst) try { const L = S.inst.fx.filter(f => f.kind !== 'sin'); if (L.length) S.inst.drawFxList(c, L, true); } catch (e) {}
    const Q = fgOpen(c);
    const t = S.g.t;
    // Vigil Starlight: a pool of cool violet-white light, a column over it (in the sky layer); brighter as the pet stands in it
    for (const p of S.pools) { const k = sstep(0, 0.5, p.t) * (p.used ? 1 - sstep(p.usedT, p.usedT + 0.8, p.t) : 1 - sstep(p.life - 1.2, p.life, p.t)), X0 = sx(p.x), Y0 = sy(p.y), R = p.r * T, pul = 0.5 + 0.5 * Math.sin(t * 4 + p.seed), st2 = cl(p.st / TUNE.poolStand);
      if (k < 0.01) continue; Q.glow(X0, Y0, R * 2.0, COL.star, (0.3 + 0.25 * st2) * k); Q.quad(330, X0, Y0, R * 1.05, 0, 0, R * 1.05, COL.cool, k, 1, t * 0.4 + p.seed, 0.9 + 0.5 * st2); Q.glow(X0, Y0, R * 0.8, '#FFFFFF', (0.12 + 0.3 * st2 + 0.08 * pul) * k); }
    // the marks: a soft dark disc, a rose-gold ring (gold for the great ones) tightening as the blow nears, a crossing glint at its heart once it locks
    for (const k2 of S.marks) { if (k2.done) continue; const u = cl(k2.t / k2.tell), X0 = sx(k2.x), Y0 = sy(k2.y), R = k2.R * T, e = sstep(0, 0.18, k2.t), lk = k2.t >= k2.tell - k2.lock ? 1 : 0, pul = 0.5 + 0.5 * Math.sin(t * (8 + 14 * u)), col = k2.big ? COL.gold : COL.rose;
      Q.quad(124, X0, Y0, R * 1.08, 0, 0, R * 1.08, UNDER, (0.26 + 0.16 * u) * e, 0.85, 0.12, 0); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, col, (0.42 + 0.3 * pul * u + 0.2 * lk) * e, 0.8, 1.6, 0.8 + 0.6 * u); Q.glow(X0, Y0, R * (0.45 + 0.35 * u), COL.pink, (0.08 + 0.22 * u) * e);
      if (lk) for (const an of [0.7, -0.7]) { const dx = Math.cos(an) * R * 0.7, dy = Math.sin(an) * R * 0.7; Q.rbeam(X0 - dx, Y0 - dy, X0 + dx, Y0 + dy, T * 0.08, COL.pale, 0.55 * e, 0.3, 0.3); } }
    // the Tail Lash: a glint swept across the arc before it
    for (const A of S.acts) if (A.kind === 'lash' && A.t < A.tell + 0.1) { const u = cl(A.t / A.tell), m = S.m, R = (TUNE.lashR + m.r) * T, X0 = sx(m.x), Y0 = sy(m.y), e = sstep(0, 0.12, A.t) * (1 - sstep(A.tell, A.tell + 0.1, A.t));
      Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, UNDER, 0.55 * e, A.a + TUNE.lashArc, TUNE.lashArc * 2, 0.5);
      const n = 9; for (let i = 0; i < n; i++) { const a = A.a - TUNE.lashArc + 2 * TUNE.lashArc * i / (n - 1), x1 = X0 + Math.cos(a) * R, y1 = Y0 + Math.sin(a) * R; Q.rbeam(X0 + Math.cos(a) * R * 0.35, Y0 + Math.sin(a) * R * 0.35, x1, y1, T * 0.05, COL.rose, (0.2 + 0.4 * u) * e, 0.2, 1); }
      Q.glow(X0 + Math.cos(A.a) * R * 0.7, Y0 + Math.sin(A.a) * R * 0.7, T * 1.2, COL.pale, 0.25 * u * e); }
    // the pinned stinger: a pale-gold glint round its blade in the floor
    if (S.pin) { const P = S.pin, X0 = sx(P.x), Y0 = sy(P.y), pul = 0.5 + 0.5 * Math.sin(t * 6), e = sstep(0, 0.2, P.t) * (1 - sstep(TUNE.pinT - 0.4, TUNE.pinT, P.t)), hp = P.part ? cl(P.part.m.hp / (TUNE.stingHP * S.fk)) : 0;
      Q.glow(X0, Y0, T * 1.6, COL.gold, (0.22 + 0.15 * pul) * e); Q.quad(192, X0, Y0, T * 1.15 / 0.8, 0, 0, T * 1.15 / 0.8, COL.knot, (0.5 + 0.3 * pul) * e, 0.8, 2.2, 0.9); Q.star(X0, Y0 - T * 0.6, T * (0.5 + 0.3 * (1 - hp)), 0.5 * e, COL.white); }
    // the crystal's growing reach and the spines' lee: pale bands behind each cover while it grows and while its rings roll
    { const C = S.crystal, rolling = S.waves.find(w => w.tag === 'rupt' && !w.hit), src = C ? S.m : rolling;
      if (src) { const g0 = C ? sstep(0, 1, C.A.t / C.A.shat) : 1, cx0 = src.x, cy0 = src.y;
        for (const q of covers()) { const dx = q.x - cx0, dy = q.y - cy0, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, L = 2.6 + q.r; Q.quad(144, sx(q.x + ux * (L / 2 + q.r * 0.6)), sy(q.y + uy * (L / 2 + q.r * 0.6)), ux * L / 2 * T, uy * L / 2 * T, -uy * T * q.r * 1.2, ux * T * q.r * 1.2, UNDER, 0.25 * g0);
          Q.beam(sx(q.x + ux * q.r * 0.7), sy(q.y + uy * q.r * 0.7), sx(q.x + ux * (q.r + L)), sy(q.y + uy * (q.r + L)), T * q.r * 1.1, COL.cool, (0.12 + 0.14 * g0) * (0.7 + 0.3 * Math.sin(t * 5))); } } }
    // the web: each thread a dark band, the filament over it (its gap left dark, a cool glint either side), the amber knot at the rim
    if (S.web) { const Wb = S.web, fade = sstep(0, 0.5, Wb.t) * (1 - sstep(Wb.dur - 0.4, Wb.dur, Wb.t)), X0 = sx(Wb.x), Y0 = sy(Wb.y);
      for (const q of Wb.threads) { const cf = q.cut ? 1 - cl((Wb.t - q.cutT) / 0.4) : 1; if (cf < 0.01) continue; const ux = Math.cos(q.a), uy = Math.sin(q.a), seg = (a0, a1) => { if (a1 - a0 < 0.2) return; const x0 = X0 + ux * a0 * T, y0 = Y0 + uy * a0 * T, x1 = X0 + ux * a1 * T, y1 = Y0 + uy * a1 * T, hx = (x1 - x0) / 2, hy = (y1 - y0) / 2, hl = Math.hypot(hx, hy) || 1;
          Q.quad(144, x0 + hx, y0 + hy, hx, hy, -hy / hl * T * 0.5, hx / hl * T * 0.5, UNDER, 0.32 * fade * cf); Q.quad(332, x0 + hx, y0 + hy, hx, hy, -hy / hl * T * 0.5, hx / hl * T * 0.5, COL.rose, fade * cf, 0.25, q.seed, 1.2); };
        seg(0.4, q.g0); seg(q.g1, q.len - 0.3);
        for (const a2 of [q.g0, q.g1]) Q.glow(X0 + ux * a2 * T, Y0 + uy * a2 * T, T * 0.35, COL.cool, 0.35 * fade * cf);
        if (!q.cut) { const kx = sx(q.kx), ky = sy(q.ky), pul = 0.5 + 0.5 * Math.sin(t * 5 + q.seed), hp = q.knot ? cl(q.knot.m.hp / (TUNE.knotHP * S.fk)) : 1; Q.glow(kx, ky, T * 0.9, COL.knot, (0.3 + 0.15 * pul) * fade); Q.quad(192, kx, ky, T * 0.7 / 0.8, 0, 0, T * 0.7 / 0.8, COL.knot, (0.5 + 0.3 * pul) * fade, 0.8, 2.6, 0.7 + 0.5 * (1 - hp)); } } }
    // the molt: the shells' shadowless cold glint, the real one's heartbeat under it; the ambush's violet glint behind the pet
    if (S.molt && S.molt.hunt && !S.molt.found) { const M = S.molt, bt = (S.t * 1.4) % 1, beat = Math.exp(-bt * 7);
      Q.glow(sx(S.m.x), sy(S.m.y), T * 1.5, COL.pink, 0.1 + 0.1 * beat);
      for (const s of M.shells) if (!s.done) { const cr = s.part && s.part.cracking != null ? cl((S.t - s.part.cracking) / TUNE.mtCrack) : 0; Q.glow(sx(s.x), sy(s.y), T * (1.2 + 0.8 * cr), cr > 0 ? COL.pale : COL.violet, 0.1 + 0.35 * cr); }
      if (M.amb && !M.amb.done) { const u = cl(M.amb.t / TUNE.mtTell), X0 = sx(M.amb.x), Y0 = sy(M.amb.y), R = TUNE.mtAmbR * T, pul = 0.5 + 0.5 * Math.sin(t * (10 + 14 * u));
        Q.quad(124, X0, Y0, R * 1.1, 0, 0, R * 1.1, UNDER, 0.3 * u, 0.85, 0.12, 0); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.violet, (0.4 + 0.4 * pul) * u, 0.8, -1.6, 0.8 + 0.6 * u); Q.glow(X0, Y0, R * 0.7, COL.violet, 0.25 * u); } }
    // EXPOSED: the pale arc of the Crucible's reach before it
    if (S.expose) { const V = S.expose, e = sstep(0, 0.3, V.t) * (1 - sstep(V.dur - 0.3, V.dur, V.t)), pul = 0.5 + 0.5 * Math.sin(t * 5), p = frontOf(S.m.r + 1.3), P0 = sx(p.x), P1 = sy(p.y);
      Q.glow(P0, P1, T * 2.0, COL.pale, (0.14 + 0.1 * pul) * e); Q.quad(192, P0, P1, T * 1.4 / 0.8, 0, 0, T * 1.4 / 0.8, COL.pale, (0.42 + 0.25 * pul) * e, 0.8, 0.8, 0.7); }
    // The Seventh Sin: the seals, pools of pale light (the refuges), brightening toward the Testament
    if (S.sin) { const J = S.sin, tt = J.t, onS = sstep(0.3, 1.4, tt) * (1 - sstep(UT.det + 0.3, UT.det + 1.0, tt)), hot = sstep(UT.det - 2.4, UT.det, tt);
      if (onS > 0.01) for (const rf of J.refs) { const e = sstep(0.3 + rf.i * 0.22, 0.9 + rf.i * 0.22, tt) * onS, X0 = sx(rf.x), Y0 = sy(rf.y), R = TUNE.refR * T, pul = 0.5 + 0.5 * Math.sin(tt * 5 + rf.x);
        if (e < 0.01) continue; Q.glow(X0, Y0, R * 2.0, COL.star, (0.3 + 0.3 * hot) * e); Q.quad(330, X0, Y0, R * 1.1, 0, 0, R * 1.1, COL.cool, e, 1, tt * (rf.i % 2 ? 0.5 : -0.5), 1.0 + 0.5 * hot); Q.glow(X0, Y0, R * 0.9, '#FFFFFF', (0.14 + 0.3 * hot + 0.06 * pul) * e); } }
    if (S.mode === 'intro') { const e = S.introT, fade = 1 - sstep(4.4, 5.6, e); if (fade > 0.01) Q.glow(sx(B.x), sy(B.y), T * 4.4, COL.pink, 0.14 * fade); }
    fgClose(c);
    wavesGround(c, T);
  }
  // the rings: a ring of crystal blades rolling out (the Anima's own picture, kind 326, in rose), a dark band under its front, and the dark gaps cut in it
  function wavesGround(c, T) {
    const live = S.waves.filter(w => w.t < w.dur + 0.45); if (!live.length) return;
    let Q = fgOpen(c);
    for (const w of live) { const u = cl(w.t / w.dur), rw = (w.r0 || 0) + (w.R - (w.r0 || 0)) * (w.tag === 'show' ? eout(u) : u), fade = 1 - sstep(0.85, 1 + 0.45 / w.dur, w.t / w.dur), X0 = sx(w.x), Y0 = sy(w.y), R = rw * T;
      if (R > 2 && fade > 0.01) { Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, UNDER, 0.75 * fade * (w.vis || 1), 0, TAU * 0.999, Math.min(0.24, 0.9 / Math.max(0.5, rw))); Q.ring(X0, Y0, R, COL.pale, 0.9 * fade * (w.vis || 1), T * 0.12);
        Q.quad(326, X0, Y0, R / 0.85, 0, 0, R / 0.85, COL.rose, 1, 0.85, (w.seed || 0) + w.x * 7, 1.2 * fade * (w.vis || 1)); } }
    fgClose(c);
    if (!live.some(w => w.gaps && w.gaps.length)) return;
    Q = fgOpen(c);
    for (const w of live) { if (!w.gaps || !w.gaps.length) continue; const u = cl(w.t / w.dur), rw = (w.r0 || 0) + (w.R - (w.r0 || 0)) * u, R = rw * T, fade = 1 - sstep(0.85, 1 + 0.45 / w.dur, w.t / w.dur); if (R < 4 || fade < 0.01) continue;
      const th = Math.min(0.3, 0.95 / Math.max(0.5, rw)), X0 = sx(w.x), Y0 = sy(w.y);
      for (const g2 of w.gaps) Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, UNDER, 0.92 * fade, g2.a + g2.w * 0.62, g2.w * 1.24, th);
      for (const g2 of w.gaps) Q.glow(sx(w.x + Math.cos(g2.a) * rw), sy(w.y + Math.sin(g2.a) * rw), T * 0.55, COL.cool, 0.3 * fade); }
    fgClose(c);
  }
  /* without the GPU painter: the tells as soft sprites (the existing 2D art stands for the body) */
  function drawGround2d(c) {
    const T = Tz(); c.save(); c.globalCompositeOperation = 'lighter';
    const blob = (x, y, R, col, a, spr) => { c.globalAlpha = a; blitSized(c, (spr || glowSprite)(col), sx(x) - R, sy(y) - R, R * 2, R * 2); };
    for (const p of S.pools) if (!p.used) blob(p.x, p.y, p.r * T * 1.5, COL.cool, 0.7);
    for (const k2 of S.marks) if (!k2.done) blob(k2.x, k2.y, k2.R * T, k2.big ? COL.gold : COL.rose, 0.3 + 0.4 * cl(k2.t / k2.tell), shockSprite);
    for (const A of S.acts) if (A.kind === 'lash' && A.t < A.tell) blob(S.m.x + Math.cos(A.a) * 2, S.m.y + Math.sin(A.a) * 2, T * 2, COL.rose, 0.4);
    if (S.pin) blob(S.pin.x, S.pin.y, T * 1.4, COL.gold, 0.6);
    for (const q of covers()) blob(q.x, q.y, T * q.r * 1.8, COL.cool, 0.35);
    if (S.web) for (const q of S.web.threads) if (!q.cut) { c.globalAlpha = 0.6; c.strokeStyle = COL.rose; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.moveTo(sx(S.web.x + Math.cos(q.a) * 0.4), sy(S.web.y + Math.sin(q.a) * 0.4)); c.lineTo(sx(S.web.x + Math.cos(q.a) * q.g0), sy(S.web.y + Math.sin(q.a) * q.g0)); c.moveTo(sx(S.web.x + Math.cos(q.a) * q.g1), sy(S.web.y + Math.sin(q.a) * q.g1)); c.lineTo(sx(q.kx), sy(q.ky)); c.stroke(); blob(q.kx, q.ky, T * 0.8, COL.knot, 0.6); }
    if (S.molt && S.molt.amb && !S.molt.amb.done) blob(S.molt.amb.x, S.molt.amb.y, TUNE.mtAmbR * T, COL.violet, 0.5, shockSprite);
    if (S.sin) for (const rf of S.sin.refs) blob(rf.x, rf.y, TUNE.refR * T * 1.4, COL.cool, 0.75);
    for (const w of S.waves) { const u = cl(w.t / w.dur), R = ((w.r0 || 0) + (w.R - (w.r0 || 0)) * u) * T; if (R > 2) blob(w.x, w.y, R, COL.rose, 0.45 * (1 - u), shockSprite); }
    c.restore();
    c.save(); c.lineCap = 'butt'; for (const w of S.waves) { if (!w.gaps || !w.gaps.length) continue; const u = cl(w.t / w.dur), rw = ((w.r0 || 0) + (w.R - (w.r0 || 0)) * u) * T; if (rw < 4) continue;
      for (const g2 of w.gaps) for (const [lw, a] of [[T * 1.3, 0.25], [T * 0.9, 0.35], [T * 0.5, 0.45]]) { c.strokeStyle = `rgba(18,6,14,${a * (1 - u * 0.5)})`; c.lineWidth = lw; c.beginPath(); c.arc(sx(w.x), sy(w.y), rw, g2.a - g2.w / 2, g2.a + g2.w / 2); c.stroke(); } } c.restore();
  }
  /* the body: the model (GPU, or the Scorpio Anima's existing art), the light over it, the bared Crucible's glint */
  function drawBodyLayer(c) {
    const B = S.B, T = Tz(), X0 = sx(B.x), Y0 = sy(B.y) - (B.z || 0) * T, size = T * TUNE.size, gone = S.molt && S.molt.gone, al = B.alpha * (gone ? 0 : 1); if (!(al > 0.01) || !B.asP) return;
    const dis = B.asP.dis || 0, fk = Math.cos(B.yaw) >= 0 ? 1 : -1;
    if (!gpu()) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.16 + 0.05 * Math.sin(B.at * 1.6)) * al; const gs = size * 0.55; blitSized(c, glowSprite(COL.pink), X0 - gs, Y0 - size * 0.45 - gs, gs * 2, gs * 2); c.restore(); }
    c.save(); try { AnimaArt.draw(c, 'scorpio', 3, X0, Y0, size, B.at, { inst: B, alpha: al, aura: false, fk, flip: fk < 0 }); } finally { c.restore(); }
    const r = B.asOut && B.asOut.r;
    if (S.inst && r && gpu()) try { S.inst.bodyLight(c, r, B.asP, al * (1 - dis * 0.8), B.at); } catch (e) {}
    if (r && gpu() && (S.expose || (S.mode === 'dead' && dis > 0.5))) { const Q = fgOpen(c), pul = 0.5 + 0.5 * Math.sin(S.g.t * 6), k = S.expose ? sstep(0, 0.3, S.expose.t) * (1 - sstep(S.expose.dur - 0.3, S.expose.dur, S.expose.t)) : (1 - sstep(0.85, 1, dis)) * sstep(0.5, 0.8, dis);
      Q.glow(r.core[0], r.core[1], r.unit * (2.4 + 1.2 * pul + (S.heartT > 0 ? 1.6 : 0)), COL.pale, (0.22 + 0.15 * pul + (S.heartT > 0 ? 0.3 : 0)) * k); Q.star(r.core[0], r.core[1], r.unit * (1.2 + 0.6 * pul), 0.6 * k, COL.white); fgClose(c); }
    if (S.m.flash > 0 && S.mode === 'fight') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14; const s2 = size * 0.4; blitSized(c, glowSprite('#FFFFFF'), X0 - s2, Y0 - size * 0.45 - s2, s2 * 2, s2 * 2); c.restore(); }
  }
  /* a shell (Eclipse Molt): the model as it stood when it vanished, a faint crystal cast to it, no breath, no shadow, its Crucible cold;
     cracking white as it nears its burst (the existing art, dimmed, without the GPU) */
  function drawShell(c, s) {
    if (s.done || !S.molt) return; const T = Tz(), X0 = sx(s.x), Y0 = sy(s.y), size = T * TUNE.size, G = GLS(), M = S.molt, cr = s.part && s.part.cracking != null ? cl((S.t - s.part.cracking) / TUNE.mtCrack) : 0, fade = sstep(0, 0.2, M.huntT == null ? 0 : M.huntT + 0.2);
    const P = Object.assign({}, M.pose || S.B.asP || {}, { yaw: s.yaw, t: (M.pose && M.pose.t || 0), live: 0, core: 0.25, crack: 0.15 + 0.85 * cr, shell: 0.22 + 0.5 * cr, glow: 0.05, strikes: null, mv: 0, run: 0, dis: 0 });
    const jit = cr > 0 ? Math.sin(S.t * 80) * T * 0.04 * cr : 0;
    if (G && glOn() && gpu()) { G.draw(c, { X: X0 + jit, Y: Y0, K: size / G.HEIGHT[3], P, k: 3, alpha: fade, low: lowFx() }); }
    else { c.save(); c.globalAlpha = 0.85 * fade; try { AnimaArt.draw(c, 'scorpio', 3, X0 + jit, Y0, size, S.B.at, { alpha: 0.85 * fade, aura: false, flip: Math.cos(s.yaw) < 0, legacy: true }); } finally { c.restore(); } }
  }
  /* the sky: the Anima's own effects (strikes, bursts, shards, the rising crystal, the Seven Stings, the Testament), the starlight's
     columns, the seals' columns, the Venom Debt's seal over the pet */
  function drawSkyLayer(c) {
    const T = Tz(), on = gpu(), UT = UTo(), me = S.me;
    if (S.inst) try { S.inst.drawFx(c); } catch (e) {}
    if (!on) { drawSeal2d(c); return; }
    const Q = fgOpen(c), t = S.g.t;
    for (const p of S.pools) { const k = sstep(0, 0.5, p.t) * (p.used ? 1 - sstep(p.usedT, p.usedT + 0.6, p.t) : 1 - sstep(p.life - 1.2, p.life, p.t)); if (k < 0.01) continue; const px = sx(p.x), py = sy(p.y); Q.shafts(px, py - T * 5, px, py, T * p.r * 0.9, COL.cool, 0.35 * k, p.seed * 10);
      for (let i = 0; i < 3 * LQ(); i++) { const v = (t * 0.4 + i / 3) % 1; Q.star(px + Math.sin(i * 2.1 + t) * T * p.r * 0.6, py - v * T * 3, T * 0.12, k * (1 - v), COL.white); } }
    if (S.sin) { const J = S.sin, tt = J.t, on2 = sstep(0.6, 1.8, tt) * (1 - sstep(UT.det + 0.3, UT.det + 1.0, tt)), hot = sstep(UT.det - 2.4, UT.det, tt);
      if (on2 > 0.01) for (const rf of J.refs) { const px = sx(rf.x), py = sy(rf.y); Q.shafts(px, py - T * 6, px, py, T * TUNE.refR * 0.9, COL.cool, (0.35 + 0.35 * hot) * on2, rf.x * 10); } }
    // the seal over the pet: one rune a stack (the Anima's own mark, kind 323, in rose), complete at seven, ripening
    if (S.debt > 0 && !me.dead && S.mode === 'fight') { const X0 = sx(me.x), Y0 = sy(me.y) - T * 1.9, rip = S.seal ? cl(S.seal.t / S.seal.dur) : 0, beat = S.seal ? Math.exp(-((t * (1.5 + 4 * rip)) % 1) * 6) : 0, R = T * (0.5 + 0.035 * S.debt) * (1 + 0.25 * S.debtFl + 0.25 * beat);
      Q.quad(323, X0, Y0, R, 0, 0, R * 0.8, S.seal ? COL.pale : COL.rose, 1, S.debt, (t * 0.3) % 6, 0.95 + 0.6 * S.debtFl + 0.8 * rip + 0.5 * beat); if (S.seal) Q.glow(X0, Y0, R * (1.6 + rip), COL.pink, (0.2 + 0.35 * rip) * (0.6 + 0.4 * beat)); }
    fgClose(c);
  }
  function drawSeal2d(c) { const me = S.me; if (!(S.debt > 0) || me.dead) return; const T = Tz(), X0 = sx(me.x), Y0 = sy(me.y) - T * 1.9; c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = S.seal ? COL.pale : COL.rose; c.lineWidth = 1.6; c.globalAlpha = 0.8;
    for (let i = 0; i < S.debt; i++) { const an = i / 7 * TAU + S.g.t; c.beginPath(); c.arc(X0 + Math.cos(an) * T * 0.36, Y0 + Math.sin(an) * T * 0.26, T * 0.07, 0, TAU); c.stroke(); } c.restore(); }

  /* ---- the health bars (in the HUD's place, 20b: m.ownBar): one stacked bar of TUNE.bars, its count, the phase pips; under it the Venom
     Debt on the pet (seven runes, flashing as the seal ripens) and the seven stingers (a dark notch for each one broken) ---- */
  function drawBar(c, W) {
    if (!S || S.mode === 'over') return; const m = S.m; if (m.dead && S.mode !== 'dead') return;
    const left = Math.max(0, S.mode === 'dead' ? 0 : realHp()), bar = S.barHP, n = Math.max(0, Math.ceil(left / bar - 1e-9)), cur = n ? (left - (n - 1) * bar) / bar : 0;
    S.barShow = S.barShow == null ? n - 1 + cur : S.barShow + ((n - 1 + cur) - S.barShow) * 0.06; if (Math.abs(S.barShow - (n - 1 + cur)) > 1.2) S.barShow = n - 1 + cur;
    const bw = Math.min(150, W * 0.38), x0 = W - 12 - bw, by = 10 + Math.min(88, W * 0.24) + 14, cols = ['#FF8AA8', '#C98AF0', '#FFB45A', '#E07AB0', '#FFD0E0', '#A878E0', '#FFE6EE', '#F0A0C8'];
    c.save(); c.globalAlpha = 0.92;
    GFX.labelS(c, 'Asmodeus, The Fester', x0 + bw, by - 11, 8, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    for (let i = 0; i < 3; i++) { const px = x0 + bw - 26 - (2 - i) * 8, onP = i < S.phase; c.fillStyle = onP ? COL.rose : 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(px, by - 3.5); c.lineTo(px + 3, by); c.lineTo(px, by + 3.5); c.lineTo(px - 3, by); c.closePath(); c.fill(); }
    const bh = 5, yb = by + 7, ci = Math.max(0, n - 1), under = n > 1 ? cols[(ci - 1) % cols.length] : null, colNow = cols[ci % cols.length];
    c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, x0 - 1, yb - 1, bw + 2, bh + 2, 4); c.fill();
    if (under) { c.fillStyle = hexA(under, 0.6); GFX.rr(c, x0, yb, bw, bh, 3); c.fill(); }
    const showCur = cl(S.barShow - ci); if (showCur > cur) { c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, x0, yb, Math.max(6, bw * showCur), bh, 3); c.fill(); }
    if (cur > 0) { const gr = c.createLinearGradient(x0, 0, x0 + bw, 0); gr.addColorStop(0, shadeC(colNow, -0.25)); gr.addColorStop(1, colNow); c.fillStyle = gr; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh * 0.4, 2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 5; i++) c.fillRect(x0 + bw * i / 5, yb + 1, 1, bh - 2);
    if (S.pad) { c.globalAlpha = 0.5 + 0.3 * Math.sin(S.g.t * 6); c.strokeStyle = COL.pale; c.lineWidth = 1.2; GFX.rr(c, x0 - 1.5, yb - 1.5, bw + 3, bh + 3, 4); c.stroke(); c.globalAlpha = 0.92; }
    GFX.labelS(c, `×${n}`, x0 + bw, by, 9, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    // the Venom Debt: seven runes, lit for each stack; pale and flashing while the seal ripens
    const ry = yb + bh + 6, pw = (bw - 6 * 3) / 7;
    GFX.labelS(c, S.seal ? 'SEALED' : 'DEBT', x0 - 4, ry + 2, 6.5, 900, S.seal ? COL.white : '#FFB0C8', 'rgba(0,0,0,.7)', 2.5, 'right');
    for (let i = 0; i < 7; i++) { const px = x0 + i * (pw + 3), lit = i < S.debt; c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, px - 0.5, ry - 0.5, pw + 1, 4, 2); c.fill();
      if (lit) { c.fillStyle = S.seal && Math.floor(S.g.t * (4 + 8 * cl(S.seal.t / S.seal.dur))) % 2 ? COL.white : COL.rose; GFX.rr(c, px, ry, pw, 3, 1.5); c.fill(); } }
    // the seven stingers: a blade each, dark when broken
    const sy2 = ry + 8; for (let i = 0; i < 7; i++) { const j = BREAK[6 - i], br = S.tails[j].broken, px = x0 + bw - 4 - i * 8; c.fillStyle = br ? 'rgba(255,255,255,.18)' : COL.gold; c.beginPath(); c.moveTo(px, sy2 - 4); c.lineTo(px + 2, sy2 + 1); c.lineTo(px, sy2 + 3); c.lineTo(px - 2, sy2 + 1); c.closePath(); c.fill(); }
    if (S.expose) { c.globalAlpha = 0.55 + 0.35 * Math.sin(S.g.t * 7); c.strokeStyle = COL.pale; c.lineWidth = 1; GFX.rr(c, x0 - 1.5, ry - 1.5, bw + 3, 6, 2.5); c.stroke(); }
    c.restore();
  }
  const hexA = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };

  /* ---- for the harness ---- */
  const test = {
    get S() { return S; }, AR, start, abortActs, phaseUp, startSin, expose, fall, refugesFor, addDebt: n => addDebt(n), cleanse: n => cleanse(n), spawnPool, breakStinger, realHp: () => (S ? realHp() : 0), BREAK,
    hold(on) { if (S) S.noAI = !!on; },
    force(kind) { if (!S || S.mode !== 'fight') return null; abortActs(true); if (S.expose) endExpose(); S.idleT = 99; S.lashCd = 0; if (kind === 'sin') { startSin(); return S.sin; } if (kind === 'expose') { expose(); return S.expose; } return start(kind); },
    skipIntro() { if (!S || S.mode !== 'intro') return; S.introT = TUNE.intro - 0.01; },
  };
  // (the gate asks these: it forwards its update, ground, over, camera, goal, HUD and boss death to them while the fight is on)
  const cam = () => (S && S.mode !== 'over' ? camOf() : null), goal = () => (S ? goalText() : ''), hideHud = () => false, onBossDeath = mm => !!(S && mm === S.m && (fall(false), true));
  return { begin, active, stop, update, drawGround() {}, drawOver() {}, cam, goal, hideHud, onBossDeath, TUNE, test };
})();
if (typeof self !== 'undefined') self.SCORPIO_BOSS = SCORPIO_BOSS;
