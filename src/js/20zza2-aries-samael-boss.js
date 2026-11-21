/* ---------- (v435 SB) The Gate of Aries's guardian: SAMAEL, THE FIRST CATACLYSM, as a boss ----------
   Beyond the Ramforge's great door (20zza, the Cataclysm Altar and its door are the gate's), the Aries Anima itself turned against
   the pet: the same model (SAMAEL_GL, 02f5, its Celestial form, posed every frame; without a real GPU the Aries Anima's existing art)
   and the same four powers' poses and pictures, called into rather than copied (20g4-samael-moves.js: SAMAEL_MOVES.poseFor /
   easePose for every power's pose, ultPose and UT for Wrath of the Fallen, a private SAMAEL_MOVES.create instance (noAuto, stand, no
   Anima of its own) for its effect layer: cracks, dust, hoofprints, rings, domes, fireballs, crescents, the charge's streak, the
   hang's corona, spires, the sigil, the portal, the ultimate's sky and impact; inst.bodyLight for the light over the body), aimed at
   the pet. Momentum and wrath where Belial was weight: quick turns, a long galloping charge, a hammer from the sky.
     Hellbreak Charge     it paws the floor, drops its head, its horn rings race, while a lane of light runs out from its brow to
                          the altar's rim (the tell); then it gallops down it (really moving), leaving burning ground behind it.
                          Struck in the lane: a heavy blow, thrown aside; at its end the horns strike (a blow in front of it) and,
                          from phase II, a hemispherical shockwave. Phase II charges twice, phase III three times, the last into a
                          volcanic explosion (its reach lit at the lane's end). Step out of the lane or roll through it.
     Horns of Perdition   it plants its forelegs and its horns open into spinning blades; each swing of its head throws a fan of
                          crescents across the altar, the paths lit as filaments first, one path in each fan left dark: a gap to
                          slip through (next to where the pet stands, so it must move). 3 / 4 / 5 fans by phase; phase III ends
                          in a cross of plasma detonating on the pet's place (its mark of light first).
     Furnace Overdrive    it braces and its chest unfolds round the Heart of Ruin while a ring of fire draws itself out round it
                          (the tell); then the burning corona holds for 6 / 7 / 8 s: inside it the pet takes ticks of fire, and
                          the Overdrive empowers it (its powers run a quarter faster, Ruin builds half again as fast). When the
                          furnace burns out it VENTS.
     First Impact         it crouches, leaps, hangs in a corona of plasma while the landing spot glows under the pet (it follows
                          the pet, then locks), and dives: a blow where it lands, then shockwaves (1 / 2 / 3) rolling across the
                          altar, each with dark gaps in its ring to stand in; molten spires burst up round the landing: obstacles,
                          and cover (a ring does not pass a spire: its lee is safe). Phase III ends in a volcanic eruption on the
                          spot (its reach glowing). After the landing it VENTS.
   RUIN PRESSURE (the boss's mechanic, 0..100, under the health bar): it builds as Samael lands blows on the pet (and a little with
   every heavy landing of its own and with time; half again as fast in the Overdrive), and it is drained by striking the exposed
   Heart of Ruin while Samael vents: after the Overdrive, after First Impact, after the Cataclysm. A vent: it stands spent, its chest
   open, the heart bared (it takes the engine's stunned-boss x1.5), and every blow struck from in front of it (the pale arc lit on the
   floor before it) drains the pressure. At 100 it enters the CATACLYSM STATE for 12 s: white-hot, its powers 15% quicker, its blows
   20% harder and every one sets the pet burning; then it vents and the pressure falls to 25. The altar's floor heat (A.heat) follows
   its state: calm in a vent, hot in the Overdrive, white-hot in the Cataclysm and the Wrath.
   Three phases (I The Kindled Ram 100-66%, II The Furnace Unbound 66-33%, III The First Cataclysm 33-5%), each break a roar and a
   gapped shockwave; phase II opens with a Furnace Overdrive, phase III with the Cataclysm State. At 5% the last phase ends in WRATH
   OF THE FALLEN (its own six beats, UT): the altar darkens, the Aries sigil opens under it, refuges light up (behind the horn
   monument on the north rim, and two stretches of the outer fire ring that go cold: pools of pale light, a column over each), the
   seal breaks, it climbs into the sky, becomes a meteor and falls on the altar's heart. In a refuge: nothing. Outside: a crushing
   blow (TUNE.wrK of the pet's health, never lethal from full). It cannot be harmed through it. Then the fall: it stands in the
   crater, roars once more, dissolves into embers (the reactor last), and X.winStage() completes the gate and unlocks Samael.
   Every number is in TUNE (below, with how it was set against Ifrit, the Caldera's last boss). Tells are glow only: lanes,
   filaments, rings and pools of light over soft dark underlays; no red, no numbers.
   The engine's machinery as Belial's (20q2): an intro (the Aries sigil, the portal, the assembly round the reactor, the four-hoof
   strike, the roar, the name banner "SAMAEL" / "The First Cataclysm"), stacked health bars with phase pips and the Ruin gauge
   (m.ownBar), a goal line, healing light shaken loose by blows, the boss immunities (m.boss, m.still, m.fiend: never lifted, frozen,
   knocked back or feared), a camera framing the whole body (as the Taurus boss's, zoomed in), sounds.
   ARIES_BOSS: begin(X, H, self, A) (the gate calls it as the altar's door seals: A = { cx, cy, r, rx, ry, sen, ax0..ay1, door,
   inside(x, y), glyph, rings, heat(k), arch }), update(dt), drawGround(c) / drawOver(c) (nothing: the body, its ground and its sky
   are the gate's own objects, H.obj, drawn in depth order), cam(), goal(), hideHud(), onBossDeath(m), active(), stop() (every bit
   of clean-up: the gate's teardown, the game's destroy, the next stage, BEL.onRelease), TUNE, test (the harness's handles).
   Clean-up (stop, the defeat, the pet's death, the stage's end): no burn left on the pet, no pad on its health, the guard hook
   off, the camera's hold given back, its objects off the stage, its effect layer stopped and Samael's GPU buffers freed
   (SAMAEL_GL.release through the instance's stop). Frame-rate independent: every event is a crossing of its own clock, every
   moving blow a swept test. */
const ARIES_BOSS = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const LQ = () => (lowFx() ? 0.5 : 1);
  // (its tells' colours: light, never red: gold, ember, pale; the refuges a cool pale steel; the underlay a soft dark)
  const COL = { gold: '#FFC24D', ember: '#FF8A3D', hot: '#FFB15A', pale: '#FFE6C8', white: '#FFF2DC', cool: '#D2E8FF', steel: '#9CC8F0' };
  const UNDER = '#140608';
  /* ================= the tuning =================
     Against Ifrit (20zz8, the Blackfire Caldera's last boss, Rift 0: TUNE.hp 74250 in 9 bars, unit blow 18; his crystals' damage cut
     in phase II, his Hellfire's miss 0.5x health), measured the same way for both by tests/_sb-tune.js (as tests/_tb-tune.js measured
     Belial against Calyx): a level-10 bot pet (the Caldera's level: ~200 health) held still at 4 and at 6 tiles south of the boss
     (never dodging, never sheltering; in front of it, so its blows in a vent fall on the heart), 60 raw damage every 0.25 s into the
     boss (240 a second, D.hitMon, no crits), the game stepped at 1/30 s, to the kill (for Samael: to the end of its fall).
     Ifrit: 686 s to kill at 4 tiles, 584 at 6 (his crystals and his kneels); 172 damage a minute at 4 (mean blow 16, max 22.5), 79 at
     6 (his blows are close ones); Hellfire's miss 100 a time (4 / 3 a fight).
     Samael (these numbers, its final model): 749 s at 4 tiles, 801 at 6 (pooled 1.22x Ifrit; the Wrath at ~740-790 s); 175 a minute at 4
     (1.02x: the corona and the rings, mean blow 6.5, max 27) and 129 at 6 (1.63x: its crescents reach across the altar); pooled 1.21x, as Abaddon sits
     over the Belfry's last boss. A unit blow is 19 (a level-10 pet has ~200 health): the charge 27, its end 21, a crescent 10.5, the
     cross 23, the landing 30, a ring 15, the eruption 19, the corona's tick 2.9, the burning ground's 2.9, the Cataclysm's burn 2.3
     (x1.2 in the Cataclysm). Its shelter blow (Wrath, wrK of the pet's health) comes once, at the end.
     (v444 SL) three times the health (660000 in 36 bars of the same size), its blows unchanged, three cycles of powers a phase, combos
     and a breath that shortens as a phase runs out: 2225 s at 4 tiles, 2210 at 6 (pooled 3.49x Ifrit; v443 1.22x), the phases at
     ~790 s and ~1560 s, the Wrath at ~2200 s; 185 a minute at 4 and 137 at 6 (as before); 41-45 Cataclysms, ~50 Overdrives, ~177 vents,
     ~47 combos a fight. */
  const TUNE = {
    hp: 660000, bars: 36,           // its health, absolute (TUNE.hp in TUNE.bars bars; x the rift's main-boss factor foeK.boss, 1 in the Caldera)   (v444 SL: three times v443's 220000 in 12; each bar as before)
    dmg: 19,                       // a unit blow, absolute (m.dmg); every blow a multiple of it (x1.2 in the Cataclysm)
    cuts: [1, 0.66, 0.33], wrathAt: 0.05,   // the phases' thresholds (of its health); Wrath of the Fallen at the last
    size: 5.4, r: 1.7 /* (a fallback: its body's radius is read from the model, geo()) */, keep: 4.4, spd: [1.5, 1.7, 1.9], pad: 3.0,   // drawn size (tiles tall: its Celestial form, at a boss's scale), body radius, the distance it keeps, its walk (tiles/s), its distance from the rim
    homeY: -1.2, lean: 0.4, leanMax: 2.4,   // it holds the altar's heart: its place, and how far it leans toward the pet
    intro: 5.8, idle: [1.45, 1.2, 1.0],     // the intro (s); the breath between powers, by phase
    combo: [0.15, 0.3, 0.45], comboIdle: 0.4, idleEnd: 0.8,   // (v444 SL) the chance that a power follows the last on a short breath (comboIdle) by phase, and the breath at the end of a phase (x idle: quicker as the phase runs out)
    heal: 0.045, healCd: 1.1,      // healing light shaken loose: an orb every this share of a bar dealt
    // Hellbreak Charge: the wind-up (the lane's tell; later charges of a chain 0.75 of it), speed, lane width, blows (x unit: the lane, the horns at its end within
    // chEndR), the shockwave from phase II (radius, blow), charges by phase, recovery, the longest / shortest lane; the volcanic end (phase III's last: radius, blow);
    // the burning trail (a patch every trailGap tiles: radius, life, hotter life, its tick and blow)
    chWind: [1.2, 1.05, 0.95], chSpd: 10.5, chW: 2.2, chK: 1.4, chEndK: 1.1, chEndR: 2.3, chShockR: [0, 3.4, 3.8], chShockK: 0.7, chN: [1, 2, 3], chRec: 0.7, chMax: 16, chMin: 3, volcR: 4.4, volcK: 1.0,
    trailGap: 0.9, trailR: 0.85, trailLife: 2.6, trailHot: 4.0, trailTick: 0.6, trailK: 0.15,
    // Horns of Perdition: fans by phase, the stance, the gap between fans, each fan's tell, slots (one left dark), the fan's spread (rad), crescent speed, reach,
    // half-width, blow (one a fan); the cross (phase III: its mark's tell, radius, blow)
    pdN: [3, 4, 5], pdWind: 0.9, pdGap: [1.0, 0.9, 0.8], pdTell: 0.6, pdSlots: [5, 6, 7], pdFan: [1.5, 1.65, 1.8], pdSpd: 9, pdRange: 15, pdHalf: 1.15, pdK: 0.55, crossTell: 0.9, crossR: 2.6, crossK: 1.2,
    // Furnace Overdrive: its wind-up (the corona's tell), how long it burns by phase, the corona's reach, its tick and blow, the speed-up of its powers, the Ruin it builds the more
    ovWind: 1.15, ovDur: [6, 7, 8], ovR: 4.0, ovTick: 0.75, ovK: 0.15, ovRate: 1.25, ovRuinK: 1.5,
    // First Impact: crouch, rise, hang by phase, dive (s); the hang's height (tiles); the landing spot locks this long before the dive; the landing's blow and reach;
    // shockwaves by phase (their gap, reach, speed, blow, gaps in the ring and their width); molten spires by phase (radius, life); the phase III eruption (delay)
    imCr: 0.7, imRise: 0.55, imHang: [1.15, 1.0, 0.9], imDive: 0.3, imH: 4.2, imLock: 0.45, imR: 2.8, imK: 1.6,
    imWaves: [1, 2, 3], imGap: 0.55, imWaveR: 10, imWaveSpd: 7.5, imWaveK: 0.8, imGapN: [3, 3, 2], imGapW: 0.75, spires: [4, 6, 8], spireR: 0.6, spireLife: 7, volcAt: 0.9,
    // Ruin Pressure: its top, the Ruin a blow on the pet builds (a tick: ruinDot), its own heavy landings, time (a second), what a blow on the bared heart drains, the cone in
    // front of it that counts as the heart, the vents (s: after the Overdrive, First Impact, the Cataclysm); the Cataclysm State (s, x blows, x speed, the burn it lays:
    // ticks, tick, blow), the pressure after it
    ruinMax: 100, ruinHit: 9, ruinDot: 1, ruinLand: 3, ruinIdle: 0.5, ventDrain: 7, ventCone: 1.15, ventOver: 3.4, ventImp: 2.2, ventCata: 4.0,
    cataDur: 12, cataK: 1.2, cataSpd: 1.15, burnN: 3, burnTick: 0.6, burnK: 0.12, ruinAfter: 25,
    // the phase-break roar: its shockwave's reach and blow, gaps
    roarR: 9, roarK: 0.6, roarGapN: 3,
    // Wrath of the Fallen: the blow outside a refuge (a share of the pet's health, never lethal from full), the window it holds, a refuge's radius, the cooled channels
    wrK: 0.8, wrWin: 0.6, refR: 1.35, coolN: 2,
  };
  const PH_NAMES = ['The Kindled Ram', 'The Furnace Unbound', 'The First Cataclysm'];
  /* (v444 SL) its powers' order by phase: three cycles of seven a phase, taken in turn (v443 had one a phase), so a fight three times as long
     does not fall into one rhythm; some powers follow the last on a short breath (TUNE.combo); the breath shortens as a phase runs out */
  const CYC = { 1: [['charge', 'perd', 'impact', 'over', 'charge', 'perd', 'impact'], ['perd', 'charge', 'over', 'impact', 'perd', 'charge', 'impact'], ['charge', 'impact', 'perd', 'charge', 'over', 'perd', 'impact']],
    2: [['charge', 'impact', 'perd', 'over', 'charge', 'perd', 'impact'], ['perd', 'impact', 'charge', 'perd', 'over', 'impact', 'charge'], ['impact', 'charge', 'perd', 'charge', 'over', 'perd', 'impact']],
    3: [['charge', 'perd', 'impact', 'charge', 'over', 'impact', 'perd'], ['impact', 'perd', 'charge', 'over', 'perd', 'charge', 'impact'], ['perd', 'charge', 'impact', 'perd', 'charge', 'over', 'impact']] };
  const COMBO = { charge: ['impact', 'perd'], perd: ['charge', 'impact'], over: ['charge', 'perd', 'impact'] };   // (the powers a power may run straight into)
  const cycNext = () => { const L = CYC[S.phase], q = L[Math.floor(S.pick / 7) % L.length]; return q[S.pick % 7]; };
  let S = null;   // the fight in progress
  const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
  const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
  const GLS = () => (typeof SAMAEL_GL !== 'undefined' ? SAMAEL_GL : null);
  const glOn = () => { const G = GLS(); try { return !!(G && G.usable()); } catch (e) { return false; } };
  const MV = () => (typeof SAMAEL_MOVES !== 'undefined' ? SAMAEL_MOVES : null);
  const UTo = () => { const Mv = MV(); return Mv && Mv.UT ? Mv.UT : { p1: 2.0, p2: 3.8, launch: 4.35, p3: 5.6, dive: 6.5, hit: 8.0, w2: 8.35, w3: 8.75, fb: 9.4, p5: 10.0, roar: 10.9, len: 12.4 }; };
  const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
  const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (S) stop(); S = null; }); } catch (e) { /* (no Belfry hook) */ }

  /* ================= the altar: a rounded square (|dx/rx|^n + |dy/ry|^n <= 1) ================= */
  const AR = { cx: 16.5, cy: 12.5, rx: 10.7, ry: 7.5, n: 2.6, arch: { x: 16.5, y: 6 }, rings: [3, 5.25] };
  const seN = (u, v) => Math.pow(Math.abs(u), AR.n) + Math.pow(Math.abs(v), AR.n);
  const inA = (x, y, pad) => { const rx = Math.max(0.5, AR.rx - (pad || 0)), ry = Math.max(0.5, AR.ry - (pad || 0)); return seN((x - AR.cx) / rx, (y - AR.cy) / ry) < 1; };
  const clampA = (x, y, pad) => { const rx = Math.max(0.8, AR.rx - (pad || 0)), ry = Math.max(0.8, AR.ry - (pad || 0)), dx = x - AR.cx, dy = y - AR.cy, k = Math.pow(seN(dx / rx, dy / ry), 1 / AR.n); return k <= 1 ? { x, y } : { x: AR.cx + dx / k, y: AR.cy + dy / k }; };
  const reach = (x, y, a, pad, max) => { const ux = Math.cos(a), uy = Math.sin(a); let d = 0; while (d < max && inA(x + ux * (d + 0.25), y + uy * (d + 0.25), pad)) d += 0.25; return d; };

  /* ================= the fight ================= */
  function begin(X, H, self, arena) {
    if (S) stop();
    const g = X.g, me = X.me, a = arena || {};
    AR.cx = a.cx != null ? a.cx : me.x; AR.cy = a.cy != null ? a.cy : me.y - 6; AR.n = a.sen > 1 ? a.sen : 2.6;
    AR.rx = a.rx > 0 ? Math.max(4, a.rx - 0.5) : (a.r || 9); AR.ry = a.ry > 0 ? Math.max(4, a.ry - 0.5) : (a.r || 7);
    AR.arch = a.arch ? { x: a.arch.x, y: a.arch.y } : { x: AR.cx, y: AR.cy - AR.ry + 1.5 }; AR.rings = Array.isArray(a.rings) && a.rings.length ? a.rings.slice() : [3, 5.25];
    const fk = (() => { try { const K = X.F && X.F.rift && X.F.rift.foeK; return K && K.boss > 0 ? K.boss : 1; } catch (e) { return 1; } })();   // (the rift's main-boss health: none in the Caldera)
    const hp = TUNE.hp * fk, barHP = hp / TUNE.bars, home = clampA(AR.cx, AR.cy + TUNE.homeY, TUNE.pad);
    const m = { type: 'boss', boss: 'sbsamael', fiend: 'sbsamael', sbBoss: true, bk: { id: 'sbsamael', name: 'Samael', title: 'The First Cataclysm', ai: 'sbsamael', spd: 1 }, mini: false, lesser: false, bname: 'Samael',
      x: home.x, y: home.y, r: geo().r, hp, maxhp: hp, spd: 1, dmg: TUNE.dmg, xp: 400, color: '#1A1214', glow: '#FF8A3D', aggro: true, act: 'enter', actT: 0, phase: 0, cd: 9, z: 0, t: 0, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0,
      chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, atkCd: 0, mv: 2, hitSq: 0, ph: 0, wob: 0, face: 1, step: 0, flank: 0, still: true, landed: true, noTouch: true };
    const yaw0 = clampYaw(Math.atan2(me.y - m.y, me.x - m.x));
    const B = { id: 'aries', x: m.x, y: m.y, z: 0, at: 0, alpha: 1, smP: null, smOut: null, sm: { mv: 0 }, ps: {}, yaw: yaw0, yawT: yaw0, spin: 0, ph: 0, mv: 0, gal: 0, gk: 1, vx: 0, vy: 0, ax: 0, ay: 0, lvx: 0, lvy: 0, thudT: 0 };
    // the Anima's own effect layer, a private copy with no Anima of its own (noAuto, stand): its pictures only
    let inst = null; try { const Mv = MV(); if (Mv) inst = Mv.create({ X: Object.assign(Object.create(X), { eshots: [] }), me, g, T: () => X.Tz(), ST: X.ST, S: { list: [] }, P: () => 0, near: () => [], living: () => [], hit: () => 0, emote: () => {}, noAuto: true, stand: true }); } catch (e) { inst = null; }
    S = { X, H, self, g, me, m, B, A: a, inst, barHP, home, phase: 1, mode: 'intro', t: 0, introT: 0, deadT: 0, acts: [], pick: 0, idleT: 1.2,
      lanes: [], vols: [], cres: [], marks: [], waves: [], trails: [], spires: [], ruin: 0, over: 0, ovTk: 0, cata: 0, vent: null, ventQ: 0, burn: null, wr: null, pad: null,
      lastM: hp, healAcc: 0, healCd: 0, seen: {}, cine: false, lastG: null, objs: [], heldDt: null, heat: 0.6, heartT: 0, wrDone: false,
      stat: { charge: 0, chargeHit: 0, chargeEnd: 0, trailHit: 0, perd: 0, perdHit: 0, cross: 0, crossHit: 0, over: 0, ovHit: 0, impact: 0, impactHit: 0, waveHit: 0, waveGap: 0, waveCover: 0, volcHit: 0, roarHit: 0, vent: 0, drain: 0, cata: 0, burnHit: 0, wrath: 0, wrathHit: 0, wrathSafe: 0, phase2At: null, phase3At: null, wrathAt: null, t0: g.t, dmgIn: 0 } };
    X.mons.push(m); g.boss = m; g.bossShow = null; g.shownBoss = true; g.bossIntro = TUNE.intro;   // (the engine's intro hold: no attacks; its bar after 2.2 s; its own banner skipped: ours, below)
    m.ownBar = (c, W) => drawBar(c, W); m.goalFn = () => goalText(); m.guardFn = (mm, o) => guard(mm, o);
    // the body, its ground and its sky: the gate's own objects, drawn in depth order with everything else
    if (H && H.obj) { S.objs.push(H.obj({ x: m.x, y: m.y, dy: -1e5, kind: 'sbGround', r: 0, label: '', draw: c => safeDraw(c, drawGroundLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 0.25, kind: 'sbBody', r: 0, label: '', draw: c => safeDraw(c, drawBodyLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 1e5, kind: 'sbSky', r: 0, label: '', draw: c => safeDraw(c, drawSkyLayer) })); }
    // the entrance: the altar hushes, the Aries sigil opens on its heart, the portal over it, the body assembling round its reactor
    S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1); heat(0.6);
    if (inst) { inst.fx.push({ kind: 'sigil', x: B.x, y: B.y, R: 4.4, t: 0, life: 3.8, cine: 1 }); inst.fx.push({ kind: 'portal', a: B, x: B.x, y: B.y, t: 0, life: 2.8, cine: 1 }); }
    for (let i = 0; i < 6; i++) X.after(i * 0.22, () => { if (S && S.m === m) X.shake(2 + i * 0.6, 0.15); });
    sfx('hum'); note(55, 2.4, 'sine', 0.22); X.light(B.x, B.y, 5, 1.2);
    try { const G = GLS(); if (G && glOn()) G.warm(); } catch (e) { /* (no GPU: its existing art) */ }
    return m;
  }
  const sfx = (k, ...a) => { const s = S && S.X.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const note = (f, d, ty, v, f1, dl) => { try { const s = S && S.X.sfx; if (s && s.note) s.note(f, d, ty, v, f1, dl); } catch (e) { /* no sound */ } };
  const growl = k => { note(62 * (k || 1), 1.3, 'sawtooth', 0.12, 41); note(46 * (k || 1), 1.6, 'sine', 0.2); };   // (a low mechanical roar)
  const say = (key, t, sub, col, dur) => { const first = !S.seen[key]; S.seen[key] = true; S.X.banner(t, sub || '', col || COL.gold, first ? (dur || 2.6) : 1.4, true); };
  const realHp = () => { const m = S.m, P = S.pad; return P ? P.base : m.hp; };
  const ST = () => { try { return S.X.ST(); } catch (e) { return null; } };
  const kOf = () => S.phase - 1;
  const U = () => S.m.dmg;
  const heat = k => { if (!S) return; S.heat = k; try { if (S.A && typeof S.A.heat === 'function') S.A.heat(k); } catch (e) { /* (no floor channels) */ } };
  // a blow on the pet: x1.2 in the Cataclysm (which sets it burning); every one builds Ruin Pressure
  function hurt(d, o) { const me = S.me; o = o || {}; const before = me.hp, ok = S.X.hurtPet(d * (S.cata > 0 ? TUNE.cataK : 1), S.m, o); if (ok) { S.stat.dmgIn += Math.max(0, before - me.hp); gain(o.dot ? TUNE.ruinDot : TUNE.ruinHit); if (S.cata > 0 && !o.dot) S.burn = { left: TUNE.burnN, tk: TUNE.burnTick }; } return ok; }
  // the facing: toward its heading or the pet, kept off a dead-on view of its brow (it reads best three-quarter on)
  function clampYaw(a) { for (const c0 of [Math.PI / 2, -Math.PI / 2]) { const d = angD(a, c0); if (Math.abs(d) < 0.6) return c0 + (d < 0 ? -0.6 : 0.6); } return a; }
  const u2t = () => TUNE.size / ((GLS() && GLS().HEIGHT) ? GLS().HEIGHT[3] : 16.2);   // tiles a model unit
  const frontOf = d => ({ x: S.B.x + Math.cos(S.B.yaw) * d, y: S.B.y + Math.sin(S.B.yaw) * d });
  function footW(i) { const G = GLS(), L = G ? G.LEGS[i] : { x: i < 2 ? 2.5 : -2.7, s: i % 2 ? -1 : 1, fy: 1.4 }, u = u2t(), y = S.B.yaw, mx = L.x * ((G && G.XS) || 0.86), my = L.s * L.fy; return { x: S.B.x + (mx * Math.cos(y) - my * Math.sin(y)) * u, y: S.B.y + (mx * Math.sin(y) + my * Math.cos(y)) * u, f: !!L.f }; }
  /* its hit areas from the model, read at run time from its exported proportions (SAMAEL_GL: HEIGHT, LEGS, XS, CORE, BODYC), never
     fixed here: the Heart of Ruin's place ahead of its middle (where the torso's length is drawn in by XS, as the model lays it), its
     brow a little ahead of the heart, its body's radius from the heart's reach and the hooves' stance (tiles) */
  function geo() { const G = GLS(), u = u2t(), xs = (G && G.XS) || 0.86, bc = (G && G.BODYC) || [0.2, 0, 7.5], co = (G && G.CORE) || [4.0, 0, 7.75], legs = (G && G.LEGS) || [{ x: 2.5, fy: 1.5 }, { x: -2.7, fy: 1.28 }];
    const map = x => bc[0] + (x - bc[0]) * xs, heartU = map(co[0]); let reach = Math.abs(heartU), rear = 0, front = heartU * 1.5;
    for (const L of legs) { reach = Math.max(reach, Math.hypot(L.x * xs, L.fy || 0)); if (L.x < 0) rear = Math.max(rear, -L.x * xs + 0.8); }
    if (G && G.HEADP) front = Math.max(front, G.HEADP[0] + 1.0);   // (its head and tail where the model exports them: a longer body, a longer reach)
    if (G && G.TAIL0) rear = Math.max(rear, -map(G.TAIL0[0]) + 1.5);
    return { u, heart: heartU * u, fd: front * u, rear: rear * u, len: Math.max(front, rear) * u, r: Math.max(1.0, Math.min(reach * 1.45, (front + rear) / 2) * u) }; }   // (one circle for the engine: never wider than half its length)
  const FD = () => geo().fd;   // (its brow: tiles ahead of its middle)

  /* the camera: the whole god (its horns' crown) kept below the top HUD with a margin, and the pet above the buttons; the view
     widens (a little, on a phone) when that span will not fit (the Wrath's refuges, its fall from the sky) */
  const CAM = { top: 160, bot: 210, zFight: 0.7, zWide: 0.55, zMin: 0.5, zIn: 1.35 };
  function frame(topY, botY, x, z0) {
    const X = S.X, g = S.g, Hh = X.H(), TS = X.Tz() / Math.max(0.05, g.zoom || 1), room = Math.max(120, Hh - CAM.top - CAM.bot), span = Math.max(1, botY - topY);
    const bb = S.B.smOut && S.B.smOut.r && S.B.smOut.r.bb, bodyW = bb ? (bb[2] - bb[0]) / X.Tz() : geo().len * 2.4, wide = (X.W() - 24) / ((bodyW + 1.5) * TS);   // (its length across the screen: the model's drawn box)
    const z = Math.max(CAM.zMin, Math.min(z0, room / (span * TS), wide / CAM.zIn)) * CAM.zIn;   /* (as the Taurus boss's: zoomed in 35%) */
    const yGod = topY + (Hh / 2 - CAM.top) / (TS * z), yPet = botY - (Hh / 2 - CAM.bot) / (TS * z), y = Math.max(yPet, Math.min(yGod, (topY + botY) / 2 + 2));
    return { x, y, k: 0.92, zoom: z };
  }
  const godTop = () => S.B.y - (S.B.z || 0) - TUNE.size * 1.0 - 0.3;
  function camOf() {
    const B = S.B, me = S.me;
    if (S.mode === 'intro') return frame(godTop(), B.y + 3.0, B.x, 0.7);
    if (S.mode === 'dead') return frame(godTop(), B.y + 3.0, B.x, 0.68);
    if (S.wr) { const UT = UTo(), t = S.wr.t, refs = S.wr.refs, rb = Math.max(...refs.map(r => r.y)) + 1.4, rt = Math.min(...refs.map(r => r.y)) - 1.6;
      if (t < UT.launch) return frame(Math.min(godTop(), rt), Math.max(me.y + 1.0, rb), lerp(B.x, me.x, 0.35), CAM.zWide);
      if (t < UT.hit + 0.3) return frame(rt, Math.max(rb, AR.cy + 2), lerp(AR.cx, me.x, 0.25), CAM.zWide);
      return frame(godTop(), Math.max(me.y, B.y + 2) + 1.0, (B.x + me.x) / 2, 0.62); }
    return frame(godTop(), Math.max(me.y, B.y + 2) + 1.0, (B.x + me.x) / 2, CAM.zFight);
  }
  function goalText() { if (!S) return ''; const n = Math.max(0, Math.ceil(Math.max(0, realHp()) / S.barHP - 1e-9));
    if (S.mode === 'dead' || S.mode === 'over') return 'The First Cataclysm falls';
    if (S.mode === 'intro') return 'Samael, the First Cataclysm';
    if (S.wr) return 'Wrath of the Fallen · shelter behind the horn monument or on a cooled channel';
    return `Samael · ${n} bar${n === 1 ? '' : 's'} · phase ${S.phase}/3 · ${S.cata > 0 ? 'CATACLYSM' : 'Ruin ' + Math.round(S.ruin)}${S.vent ? ' · strike the bared heart' : ''}`; }

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
    hazardsTick(S.heldDt == null ? dt : S.heldDt, dt);
    if (S.mode !== 'dead') { B.x = m.x; B.y = m.y; }
    m.r = geo().r;   // (its body as the model has it now)
    poseOf(dt);
    for (const o of S.objs) { o.x = B.x; o.y = B.y; }
    if (S.steps && S.steps.length) { if (S.inst && S.mode !== 'dead' && !(B.z > 0.3)) for (const f of S.steps) { const p = footW(f.i | 0); S.inst.fx.push({ kind: 'foot', x: p.x, y: p.y, R: f.land ? 1.1 : 0.8, t: 0, life: 0.85, seed: Math.random() * 50, f: f.f ? 1 : 0, small: f.land ? 0 : 1, big: f.land ? 1 : 0 }); } S.steps.length = 0; }
    if (S.cine) g.cineT = Math.max(g.cineT || 0, 0.05);
    S.heartT = Math.max(0, S.heartT - dt);
  }
  function introTick(dt) {
    const B = S.B, m = S.m, X = S.X, g = S.g, t0 = S.introT; S.introT += dt; const t = S.introT, cross = x => t0 < x && t >= x;
    B.alpha = glOn() ? 1 : sstep(0.3, 2.8, t);   // (on the GPU it assembles round its reactor; its existing art fades in)
    if (cross(1.2) || cross(2.0)) { X.shake(3, 0.2); sfx('thud'); }
    if (cross(3.05)) {   // the four hooves strike down: a ring of fire across the altar
      if (S.inst) { const I = S.inst.fx; I.push({ kind: 'ringw', x: B.x, y: B.y, R: 5.4, t: 0, life: 0.9, seed: 1 }); I.push({ kind: 'hemi', x: B.x, y: B.y, R: 3.0, t: 0, life: 0.6, seed: 2 }); I.push({ kind: 'crack', x: B.x, y: B.y, R: 2.8, t: 0, life: 2.6, seed: 3, heat: 1.2 }); I.push({ kind: 'dust', x: B.x, y: B.y, R: 3.4, t: 0, life: 1.1, seed: 2 });
        for (let i = 0; i < 4; i++) { const p = footW(i); I.push({ kind: 'foot', x: p.x, y: p.y, R: 1.1, t: 0, life: 0.9, seed: i * 7, f: 1, big: 1 }); } }
      X.shake(14, 0.5); sfx('crash'); X.light(B.x, B.y, 6, 0.6); heat(1.3); }
    if (cross(3.3)) {   // the roar: the jaw parts on its furnace, a pressure wave across the altar (no blow)
      S.waves.push({ x: B.x, y: B.y, R: 9, t: 0, dur: 1.0, gaps: [], hit: true, prev: 0, dmg: 0, vis: 0.8, tag: 'show' });
      X.shake(12, 0.7); X.flash(0.28, '#FFD8B0'); growl(1); sfx('crash'); g.hitStop = Math.max(g.hitStop || 0, 0.05);
      for (let i = 0; i < 20 * LQ(); i++) { const an = Math.random() * TAU; X.part({ kind: 'star', x: B.x + Math.cos(an) * 2.2, y: B.y - 1.5 + Math.sin(an), vx: Math.cos(an) * 3.2, vy: Math.sin(an) * 2 - 0.6, life: 1, max: 1, size: 3, color: i % 2 ? COL.ember : COL.hot, drag: 1.4 }); } }
    if (cross(3.5)) { X.banner('SAMAEL', 'The First Cataclysm', COL.hot, 2.8, true, true); sfx('sparkle'); }
    if (t >= TUNE.intro) { B.alpha = 1; S.mode = 'fight'; S.cine = false; g.cineT = 0; m.act = 'fight'; S.idleT = 1.0; heat(0.85); say('p1', 'PHASE I', 'Samael · ' + PH_NAMES[0], COL.hot, 1.8); }
  }
  /* ---- the fight ---- */
  function fightTick(dt) {
    const m = S.m;
    const took = S.pad ? 0 : Math.max(0, S.lastM - m.hp);   // (what the pet's blows took since the last frame; the Wrath shrugs them off)
    padTick();
    try { fightAI(dt, took); } finally { S.lastM = m.hp; }
  }
  function padTick() { const P = S.pad, m = S.m; if (!P) return; const top = P.base + P.buf; if (m.hp < top) m.hp = top; }
  function fightAI(dt, took) {
    const m = S.m, me = S.me, g = S.g, X = S.X;
    if (m.dead || S.mode !== 'fight') return;
    // its wounds spill healing light for the pet to catch
    S.healAcc += took; S.healCd -= dt;
    if (!S.wr && S.healAcc > S.barHP * TUNE.heal && S.healCd <= 0) { S.healAcc = 0; S.healCd = TUNE.healCd; const an = Math.atan2(me.y - m.y, me.x - m.x), x = m.x + Math.cos(an) * (m.r + 0.6), y = m.y + Math.sin(an) * (m.r + 0.6); X.drop('hp', x, y); if (Math.random() < 0.45) X.drop('mp', x, y); X.sparks(x, y, '#8FE0A6', 8, 4); }
    // the phases, then Wrath of the Fallen at the last
    const f = realHp() / m.maxhp;
    if (!S.wr && S.phase < 3 && f <= TUNE.cuts[S.phase]) phaseUp();
    else if (!S.wr && S.phase === 3 && !S.wrDone && f <= TUNE.wrathAt) startWrath();
    const held = g.stopT > 0 || (g.cineT > 0 && !S.cine), slow = (m.chill > 0 ? 0.8 : 1) * (g.warpT > 0 ? 0.4 : 1) * (m.curseT > 0 ? 0.85 : 1), da = held ? 0 : dt * slow;
    S.heldDt = da;
    if (S.wr) { wrathTick(da); brake(da); return; }
    if (me.dead) { if (S.acts.length || S.lanes.length || S.vols.length || S.marks.length) abortActs(); S.burn = null; S.idleT = Math.max(S.idleT, 1.4); S.heldDt = 0; return; }   // (the pet down: its powers called off; the next pet in finds it waiting)
    stateTick(da);
    if (S.vent) { ventTick(da); brake(da); easeOut(); return; }
    const rate = (S.over > 0 ? TUNE.ovRate : 1) * (S.cata > 0 ? TUNE.cataSpd : 1);
    for (let i = S.acts.length - 1; i >= 0; i--) { const A = S.acts[i]; A.t += da * rate; if (actTick(A, da * rate, da)) { S.acts.splice(i, 1); endAct(A); if (!S.acts.length) S.idleT = breath(A); } }   // (v444 SL: breath)
    if (!S.acts.length && S.ventQ > 0) { startVent(S.ventQ); S.ventQ = 0; brake(da); return; }   // (a spent furnace, a landing, the Cataclysm's end: it vents once its power is done)
    if (S.noAI) { if (!S.acts.some(A => A.kind === 'charge' || A.kind === 'impact')) { brake(da); if (!S.acts.length) S.B.yawT = clampYaw(Math.atan2(me.y - m.y, me.x - m.x)); } easeOut(); return; }   // (the harness: one power at a time, no walking)
    if (!S.acts.length) {
      S.idleT -= da; if (S.idleT <= 0) { for (let n = 0; n < 7; n++) { const k = cycNext(); S.pick++; if (start(k)) break; } S.idleT = 0.4; } }   // (v444 SL: cycNext)
    const planted = S.acts.some(A => A.kind === 'perd' || A.kind === 'over' || A.kind === 'roar');
    if (!S.acts.some(A => A.kind === 'charge' || A.kind === 'impact')) walk(da * (S.cata > 0 ? TUNE.cataSpd : 1), planted ? 0 : 1);
    easeOut();
  }
  /* (v444 SL) the breath after a power: the phase's, shortened as the phase runs out; a combo's short one when the next power in the cycle is
     one this power may run into (by the phase's chance; never into a vent) */
  function breath(A) { const k = kOf(), f = realHp() / S.m.maxhp, top = TUNE.cuts[S.phase - 1], bot = S.phase < 3 ? TUNE.cuts[S.phase] : TUNE.wrathAt, run = cl((top - f) / Math.max(0.01, top - bot)), base = TUNE.idle[k] * lerp(1, TUNE.idleEnd, run);
    if (!S.ventQ && A && COMBO[A.kind] && COMBO[A.kind].includes(cycNext()) && Math.random() < TUNE.combo[k]) { S.stat.combo = (S.stat.combo || 0) + 1; return TUNE.comboIdle; }
    return base; }
  // it is passed round, not through: the pet eased out from under it
  function easeOut() { const me = S.me, m = S.m; if (me.dead || me.leap || S.B.z > 0.6) return; const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = m.r; if (d < r0 && d > 1e-4) S.X.moveEnt(me, dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6, 0); }
  /* its walk: it holds the altar's heart and leans toward the pet, keeping its distance; quick to turn, a predator's stride */
  function walk(dt, k) {
    if (!(dt > 0)) return; const m = S.m, me = S.me, B = S.B, H0 = S.home;
    const vx = me.x - H0.x, vy = me.y - H0.y, vd = Math.hypot(vx, vy) || 1, ln = Math.min(TUNE.leanMax, vd * TUNE.lean); let tx = H0.x + vx / vd * ln, ty = H0.y + vy / vd * ln;
    { const ex = tx - me.x, ey = ty - me.y, e = Math.hypot(ex, ey) || 1; if (e < TUNE.keep) { tx = me.x + ex / e * TUNE.keep; ty = me.y + ey / e * TUNE.keep; } }
    const p = clampA(tx, ty, TUNE.pad);
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), head = Math.atan2(dy, dx), toPet = Math.atan2(me.y - m.y, me.x - m.x), ahead = Math.abs(angD(head, toPet)) < 1.3;
    B.yawT = clampYaw(d > 0.6 && k > 0 && ahead ? head : toPet);
    const al = Math.cos(angD(head, B.yaw)), tk = ahead ? cl(1 - Math.abs(angD(head, B.yaw)) / 1.6) : 1, sp = al > 0.3 ? 1 : al < -0.3 ? 0.55 : 0.7, want = d > 0.35 ? Math.min(TUNE.spd[kOf()] * k * sp, d * 1.3) * tk : 0;
    const acc = Math.min(1, dt * 2.2); B.vx += ((d > 0.35 ? dx / d * want : 0) - B.vx) * acc; B.vy += ((d > 0.35 ? dy / d * want : 0) - B.vy) * acc;
    moveBy(B.vx * dt, B.vy * dt, 1);
  }
  function brake(dt) { const B = S.B; B.vx *= 1 - Math.min(1, dt * 4); B.vy *= 1 - Math.min(1, dt * 4); }
  function moveBy(mx, my, stride) { const m = S.m, B = S.B, p = clampA(m.x + mx, m.y + my, TUNE.pad - 0.6), dd = Math.hypot(p.x - m.x, p.y - m.y); m.x = p.x; m.y = p.y; B.x = m.x; B.y = m.y;
    const G = GLS(), sl = ((G && G.STRIDE) || 2.9) * u2t() * (stride || 1), ph0 = B.ph, back = mx * Math.cos(B.yaw) + my * Math.sin(B.yaw) < -1e-6 ? -1 : 1;   // (backing away, its gait runs backward)
    B.ph += back * dd / Math.max(0.05, sl * Math.max(0.3, B.mv)) * TAU; footfalls(Math.min(ph0, B.ph), Math.max(ph0, B.ph)); return dd; }
  function footfalls(ph0, ph1) { const G = GLS(), B = S.B, X = S.X; if (!G) return; const run = S.acts.some(A => A.kind === 'charge' && A.go);
    for (const f of G.footfalls(ph0, ph1, B.gal)) { const p = footW(f.i);
      if (S.inst && B.mv > 0.2) S.inst.fx.push({ kind: 'foot', x: p.x, y: p.y, R: run ? 1.3 : 0.9, t: 0, life: 0.85, seed: Math.random() * 50, f: f.f ? 1 : 0, big: run ? 1 : 0 });
      if (run && S.inst) S.inst.fx.push({ kind: 'crack', x: p.x, y: p.y, R: 0.95, t: 0, life: 1.6, seed: Math.random() * 50, heat: 1.1 });
      if (f.f) { X.shake(run ? 2.6 : 0.8 + B.mv * 1.2, run ? 0.1 : 0.07); if (B.thudT <= S.t) { sfx(run ? 'stomp' : 'thud'); B.thudT = S.t + (run ? 0.18 : 0.45); } } } }
  function phaseUp() {
    const m = S.m, X = S.X; abortActs(); S.phase++; m.flinch = 1; S.ventQ = 0;
    if (S.vent) endVent();
    if (S.phase === 2) S.stat.phase2At = S.g.t - S.stat.t0; else S.stat.phase3At = S.g.t - S.stat.t0;
    X.banner(`PHASE ${S.phase === 2 ? 'II' : 'III'}`, `Samael · ${PH_NAMES[S.phase - 1]}`, S.phase === 3 ? COL.white : COL.hot, 2.0, true);
    X.flash(0.3, '#FFD8B0'); X.shake(12, 0.6); sfx('hum'); heat(0.45);
    for (let i = 0; i < 4; i++) X.drop(i % 2 ? 'mp' : 'hp', m.x + (Math.random() - 0.5) * 4, m.y + 2 + Math.random() * 2);
    start('roar');
  }

  /* ================= the state: Ruin Pressure, the Overdrive, the Cataclysm, the vents, the burn ================= */
  function gain(v) { if (!S || S.cata > 0 || S.wr || S.mode !== 'fight') return; S.ruin = Math.min(TUNE.ruinMax, S.ruin + v * (S.over > 0 ? TUNE.ovRuinK : 1)); if (S.ruin >= TUNE.ruinMax) cataclysm(); }
  function cataclysm() {
    if (!S || S.cata > 0 || S.wr) return; const X = S.X, B = S.B; S.ruin = TUNE.ruinMax; S.cata = TUNE.cataDur; S.stat.cata++;
    say('cata', 'CATACLYSM STATE', 'White-hot: quicker, harder, and every blow sets you burning', COL.white, 2.6);
    X.flash(0.22, '#FFE0C0'); X.shake(10, 0.45); growl(1.2); sfx('crash'); heat(1.8);
    if (S.inst) { S.inst.fx.push({ kind: 'ringw', x: B.x, y: B.y, R: 4.2, t: 0, life: 0.8, seed: Math.random() * 40 }); S.inst.fx.push({ kind: 'hemi', x: B.x, y: B.y, R: 2.8, t: 0, life: 0.6, seed: 3 }); S.inst.fx.push({ kind: 'burst', a: B, t: 0, life: 0.6 }); }
  }
  function stateTick(da) {
    const me = S.me, m = S.m;
    if (S.over > 0) { S.over -= da; S.ovTk -= da;
      if (S.ovTk <= 0) { S.ovTk += TUNE.ovTick; if (!me.dead && Math.hypot(me.x - m.x, me.y - m.y) < TUNE.ovR + me.r * 0.5) { if (hurt(U() * TUNE.ovK, { dot: true, over: true })) S.stat.ovHit++; } }
      if (S.over <= 0) { S.over = 0; S.ventQ = Math.max(S.ventQ, TUNE.ventOver); S.X.text(m.x, m.y - TUNE.size * 0.8, 'The furnace burns out', COL.pale, 13, { life: 1.2 }); } }
    if (S.cata > 0) { S.cata -= da; if (S.cata <= 0) { S.cata = 0; S.ruin = TUNE.ruinAfter; S.ventQ = TUNE.ventCata; S.X.text(m.x, m.y - TUNE.size * 0.8, 'The Cataclysm spends itself', COL.pale, 13, { life: 1.2 }); } }
    else gain(TUNE.ruinIdle * da);
    if (S.burn) { const b = S.burn; b.tk -= da; if (b.tk <= 0) { b.tk += TUNE.burnTick; b.left--; const h0 = me.hp; if (!me.dead && S.X.hurtPet(U() * TUNE.burnK, m, { dot: true, burn: true, dotC: COL.ember })) { S.stat.burnHit++; S.stat.dmgIn += Math.max(0, h0 - me.hp); } if (b.left <= 0) S.burn = null; } }
    // the floor's fire follows its state
    const hk = S.vent ? 0.45 : S.acts.some(q => q.kind === 'roar') ? 0.45 : S.cata > 0 ? 1.8 : S.over > 0 ? 0.5 : 0.85;   // (calm enough in the fight for its tells to read over the channels; the Overdrive draws the floor's fire into its furnace) if (Math.abs(hk - S.heat) > 0.01) heat(hk);
  }
  function startVent(dur) {
    const m = S.m, X = S.X, B = S.B; S.vent = { t: 0, dur }; m.stunT = dur; m.act = 'stunned'; S.stat.vent++; S.B.vx = S.B.vy = 0;
    say('vent', 'THE HEART OF RUIN', 'It vents: strike its bared chest from the front to drain the Ruin', COL.pale, 2.6);
    X.text(m.x, m.y - TUNE.size * 0.85, 'The heart is bared!', COL.white, 15, { crit: true, life: 1.1 }); sfx('whoosh'); note(140, 1.2, 'sine', 0.1, 70);
    if (S.inst) { S.inst.fx.push({ kind: 'smoke', x: B.x, y: B.y, R: 2.4, t: 0, life: 2.2, seed: Math.random() * 40 }); S.inst.fx.push({ kind: 'burst', a: B, t: 0, life: 0.5 }); }
  }
  function ventTick(da) { const V = S.vent, m = S.m; V.t += da; m.stunT = Math.max(0.001, V.dur - V.t);
    if (S.inst && Math.random() < da * 2.2 * LQ()) { const f = frontOf(geo().heart); S.inst.fx.push({ kind: 'smoke', x: f.x, y: f.y, R: 1.4, t: 0, life: 1.6, seed: Math.random() * 40 }); }
    if (V.t >= V.dur) endVent(); }
  function endVent() { const m = S.m; S.vent = null; m.stunT = 0; m.act = 'fight'; S.idleT = Math.max(S.idleT, 0.7); }
  // the engine asks every blow on its body (m.guardFn): a blow struck from in front of it while it vents is a blow on the Heart of Ruin
  function guard(m, o) {
    if (!S || m !== S.m || !S.vent || S.mode !== 'fight' || (o && o.dot)) return 1; const me = S.me, a = Math.atan2(me.y - m.y, me.x - m.x);
    if (Math.abs(angD(a, S.B.yaw)) < TUNE.ventCone) { const was = S.ruin; S.ruin = Math.max(0, S.ruin - TUNE.ventDrain); S.stat.drain += was - S.ruin; S.heartT = 0.35;
      if (was > 0 && S.ruin <= 0) { S.X.text(m.x, m.y - TUNE.size * 0.75, 'The Heart of Ruin cools', COL.cool, 14, { life: 1.2 }); sfx('chime'); } }
    return 1;
  }

  /* ================= the powers ================= */
  function start(kind) {
    const k = kOf(), me = S.me, m = S.m, B = S.B; let A = null;
    if (kind === 'charge') { A = { kind, t: 0, n: TUNE.chN[k], seg: 0, t0: 0, go: false, wind: TUNE.chWind[k] }; if (!aimCharge(A, A.wind)) return null; sfx('hum'); }
    else if (kind === 'perd') { A = { kind, t: 0, n: TUNE.pdN[k], wind: TUNE.pdWind, gap: TUNE.pdGap[k], vols: [], cross: S.phase >= 3 }; A.last = A.wind + (A.n - 1) * A.gap; A.dur = A.last + (A.cross ? 0.45 + TUNE.crossTell + 0.55 : 0.75); B.yawT = clampYaw(Math.atan2(me.y - m.y, me.x - m.x)); sfx('hum');
      say('perd', 'HORNS OF PERDITION', 'Fans of crescents: slip through the dark gap in each', COL.hot, 2.2); }
    else if (kind === 'over') { if (S.over > 0) return null; A = { kind, t: 0, wind: TUNE.ovWind }; A.dur = A.wind + 0.7; sfx('hum'); note(98, 1.2, 'sawtooth', 0.08, 196); }
    else if (kind === 'impact') { const p = clampA(me.x, me.y, TUNE.pad - 0.6); A = { kind, t: 0, n: TUNE.imWaves[k], t1: TUNE.imCr, sx: m.x, sy: m.y, tx: p.x, ty: p.y, lock: false, landed: false };
      A.t2 = A.t1 + TUNE.imRise; A.t3 = A.t2 + TUNE.imHang[k]; A.t4 = A.t3 + TUNE.imDive; A.wEnd = A.t4 + 0.15 + (A.n - 1) * TUNE.imGap; A.volc = S.phase >= 3 ? A.wEnd + TUNE.volcAt : 0; A.dur = (A.volc || A.wEnd) + 0.9; B.yawT = clampYaw(Math.atan2(p.y - m.y, p.x - m.x)); sfx('hum');
      say('impact', 'FIRST IMPACT', 'It leaps: leave the glowing spot; stand in the rings\' dark gaps or behind a spire', COL.hot, 2.2); }
    else if (kind === 'roar') { A = { kind, t: 0, dur: 1.5 }; }
    if (!A) return null; S.stat[kind] = (S.stat[kind] || 0) + 1; S.acts.push(A); return A;
  }
  /* Hellbreak Charge: aim a lane at the pet (a little ahead of it), from its brow to the altar's rim */
  function aimCharge(A, wind) {
    const me = S.me, m = S.m, B = S.B, tx = me.x + (me.vx || 0) * 0.25, ty = me.y + (me.vy || 0) * 0.25, a0 = Math.atan2(ty - m.y, tx - m.x);
    let a = a0, D = reach(m.x, m.y, a, TUNE.pad - 0.6, TUNE.chMax);
    if (D < TUNE.chMin) for (let j = 1; j <= 10; j++) { const o = (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 0.3; const d2 = reach(m.x, m.y, a0 + o, TUNE.pad - 0.6, TUNE.chMax); if (d2 >= TUNE.chMin) { a = a0 + o; D = d2; break; } }   // (its back to the rim: the nearest bearing with room)
    if (D < TUNE.chMin) return false;
    const fd = FD(), ux = Math.cos(a), uy = Math.sin(a), last = A.seg >= A.n - 1;
    Object.assign(A, { a, ux, uy, D, wind, ct: D / TUNE.chSpd * 1.2, fd, go: false, impact: false, prev: 0, trav: 0, nextT: 0.5, t0: A.t, launched: false });
    A.lane = { x0: m.x + ux * fd * 0.6, y0: m.y + uy * fd * 0.6, ux, uy, len: D + fd * 0.4 + 0.6, w: TUNE.chW, t: 0, tell: wind, A, hit: false, seed: Math.random() * 90, end: -1, volc: last && S.phase >= 3 };
    S.lanes.push(A.lane); S.stat.lanes = (S.stat.lanes || 0) + 1; B.yawT = a;
    return true;
  }
  // a power's own clock: true when it is done (dt: its own time, quickened by the Overdrive and the Cataclysm; da: the world's)
  function actTick(A, dt, da) {
    const t = A.t, t0 = t - dt, cross = x => t0 < x && t >= x, m = S.m, X = S.X, me = S.me, B = S.B, k = kOf();
    if (A.kind === 'charge') {
      const ts = t - A.t0, ts0 = ts - dt, tI = A.wind + A.ct, crs = x => ts0 < x && ts >= x;
      if (crs(tI - 0.1) && S.inst && S.inst.skidFx) { const p0 = footW(0), p1 = footW(1); S.inst.skidFx(p0.x, p0.y, A.ux, A.uy); S.inst.skidFx(p1.x, p1.y, A.ux, A.uy); }   // (v444 SL: the brake's skid)
      if (ts < A.wind) { B.vx = B.vy = 0; B.mv = 0; B.gal = 0; B.yawT = A.a; if (crs(0.12) && S.inst) { const f = frontOf(1.3); S.inst.fx.push({ kind: 'crack', x: f.x, y: f.y, R: 1.4, t: 0, life: 1.8, seed: Math.random() * 50, heat: 1 }); S.inst.fx.push({ kind: 'dust', x: f.x, y: f.y, R: 1.5, t: 0, life: 0.9, seed: 7 }); sfx('thud'); }
        if (Math.random() < dt * 8) X.shake(1.1, 0.05);
        { const Mv = MV(); if (A.seg === 0 && S.inst && S.inst.pawFx && Mv && Mv.pawEv) for (const e of Mv.pawEv(A.wind)) if (crs(e.t)) { const p = footW(0); S.inst.pawFx(p.x, p.y, e.stamp); if (e.stamp) { X.shake(3.5, 0.12); sfx('thud'); } } }   // (v444 SL: the paw's scrapes and stamp)
        return false; }
      if (ts0 < tI) {   // the charge: a hard start, then the gallop down the lane
        if (!A.launched) { A.launched = true; if (S.inst) { S.inst.fx.push({ kind: 'trail', a: B, A: { dx: A.ux, dy: A.uy, dist: A.D }, t: 0, life: A.ct + 0.3 }); const b = frontOf(-1.3); S.inst.fx.push({ kind: 'dust', x: b.x, y: b.y, R: 1.8, t: 0, life: 0.8, seed: 19 }); S.inst.fx.push({ kind: 'crack', x: b.x, y: b.y, R: 1.4, t: 0, life: 1.8, seed: Math.random() * 40, heat: 1.2 }); } sfx('whoosh'); gain(1); }
        A.go = true; B.mv = 1; B.gal = 1; B.gk = 1.7; B.yaw = A.a;
        const ease = u => u < 0.15 ? (u / 0.15) * (u / 0.15) * 0.075 : u > 0.92 ? 1 - (1 - u) * (1 - u) / 0.08 * 0.04 : 0.075 + (u - 0.15) / 0.77 * 0.885, u0 = cl((ts0 - A.wind) / A.ct), u1 = cl((ts - A.wind) / A.ct), want = (ease(u1) - ease(u0)) * A.D;
        const dd = moveBy(A.ux * want, A.uy * want, 1.7); A.trav += dd; B.vx = A.ux * want / Math.max(dt, 1e-3); B.vy = A.uy * want / Math.max(dt, 1e-3);
        // the lane: struck as its front passes (the swept span since the last frame: the same at any frame rate)
        const L = A.lane, fr = frontOf(A.fd), prog = (fr.x - L.x0) * L.ux + (fr.y - L.y0) * L.uy; L.prog = prog;
        if (!L.hit && !me.dead) { const rx = me.x - L.x0, ry = me.y - L.y0, al = rx * L.ux + ry * L.uy, of = Math.abs(-rx * L.uy + ry * L.ux);
          if (of < L.w / 2 + me.r && al > A.prev - 0.9 && al < prog + 0.4) { L.hit = true; if (hurt(U() * TUNE.chK, { charge: true })) { S.stat.chargeHit++; const sd = Math.sign(-rx * L.uy + ry * L.ux) || 1; me.push = { vx: (-L.uy * sd * 8 + L.ux * 4), vy: (L.ux * sd * 8 + L.uy * 4), t: 0.22 }; X.shake(9, 0.25); } } }
        A.prev = prog;
        // burning ground behind it, and the spires in its path shattered
        while (A.trav >= A.nextT) { A.nextT += TUNE.trailGap; const b = frontOf(-0.6), hot = S.over > 0 || S.cata > 0; S.trails.push({ x: b.x, y: b.y, r: TUNE.trailR * (hot ? 1.2 : 1), t: 0, life: hot ? TUNE.trailHot : TUNE.trailLife, tk: 0.3, seed: Math.random() * 40 }); if (S.inst) S.inst.fx.push({ kind: 'crack', x: b.x, y: b.y, R: 1.0, t: 0, life: hot ? TUNE.trailHot : TUNE.trailLife, seed: Math.random() * 40, heat: hot ? 1.5 : 1.2 }); }
        for (const sp of S.spires) if (!sp.dud && Math.hypot(sp.x - m.x, sp.y - m.y) < m.r + sp.r + 0.4) shatter(sp);
        if (want > 0.02 && dd < want * 0.25 && u1 > 0.2) A.t0 = t - tI;   // (blocked: it strikes where it stands)
        if (ts >= tI && !A.impact) chargeImpact(A); return false; }
      if (!A.impact) chargeImpact(A);
      B.mv *= 1 - Math.min(1, dt * 9); B.gal *= 1 - Math.min(1, dt * 6); B.gk = 1;
      if (ts >= tI + TUNE.chRec) { if (A.seg + 1 < A.n) { A.seg++; if (!aimCharge(A, A.wind * 0.75)) return true; sfx('hum'); return false; } return true; }
      B.vx = B.vy = 0; return false;
    }
    if (A.kind === 'perd') {
      B.vx = B.vy = 0; B.mv = 0; if (!me.dead) B.yawT = clampYaw(Math.atan2(me.y - m.y, me.x - m.x));
      if (cross(0.15) && S.inst) { const f = frontOf(1.2); S.inst.fx.push({ kind: 'crack', x: f.x, y: f.y, R: 1.2, t: 0, life: 1.5, seed: Math.random() * 40, heat: 0.9 }); X.shake(3, 0.1); sfx('thud'); }
      for (let i = 0; i < A.n; i++) { const tr = A.wind + i * A.gap; if (cross(tr - TUNE.pdTell)) A.vols[i] = volley(A, i); if (cross(tr) && A.vols[i]) fire(A.vols[i], i); }
      if (A.cross && cross(A.last + 0.45)) { const p = clampA(me.x, me.y, 0.8); S.marks.push({ x: p.x, y: p.y, R: TUNE.crossR, t: 0, tell: TUNE.crossTell, done: false, seed: Math.random() * 40 }); S.stat.cross++; sfx('hum'); }
      return t >= A.dur; }
    if (A.kind === 'over') { B.vx = B.vy = 0; B.mv = 0;
      if (cross(0.1) && S.inst) S.inst.fx.push({ kind: 'crack', x: B.x, y: B.y, R: 2.0, t: 0, life: 2.2, seed: Math.random() * 40, heat: 1 });
      if (cross(A.wind - 0.1)) { S.over = TUNE.ovDur[k]; S.ovTk = 0.35; X.text(m.x, m.y - TUNE.size * 0.85, 'FURNACE OVERDRIVE', COL.hot, 15, { crit: true, life: 1.1 }); sfx('crash'); X.shake(7, 0.3); X.flash(0.12, '#FFB070'); heat(0.5);
        if (S.inst) { S.inst.fx.push({ kind: 'ringw', x: B.x, y: B.y, R: TUNE.ovR, t: 0, life: 0.7, seed: 5 }); S.inst.fx.push({ kind: 'hemi', x: B.x, y: B.y, R: 2.6, t: 0, life: 0.55, seed: 9 }); }
        say('over', 'FURNACE OVERDRIVE', 'A burning corona: stay out of it. When it burns out, it vents', COL.hot, 2.2); }
      return t >= A.dur; }
    if (A.kind === 'impact') { B.vx = B.vy = 0; B.mv = 0;
      if (!A.lock && t < A.t3 - TUNE.imLock && !me.dead) { const p = clampA(me.x, me.y, TUNE.pad - 0.6), k2 = Math.min(1, dt * 5); A.tx += (p.x - A.tx) * k2; A.ty += (p.y - A.ty) * k2; }
      if (!A.lock && t >= A.t3 - TUNE.imLock) { A.lock = true; sfx('hum'); }
      if (t < A.t4 && Math.hypot(A.tx - B.x, A.ty - B.y) > 0.3) B.yawT = clampYaw(Math.atan2(A.ty - B.y, A.tx - B.x));
      if (cross(A.t1 - 0.05)) { if (S.inst) { S.inst.fx.push({ kind: 'burst', a: B, t: 0, life: 0.5 }); S.inst.fx.push({ kind: 'crack', x: B.x, y: B.y, R: 2.2, t: 0, life: 2.0, seed: Math.random() * 40, heat: 1.2 }); S.inst.fx.push({ kind: 'dust', x: B.x, y: B.y, R: 2.4, t: 0, life: 0.9, seed: 3 }); } X.shake(6, 0.2); sfx('whoosh'); }
      if (t > A.t1 && t < A.t4) { const u = sstep(A.t1, A.t4, t), hz = t < A.t2 ? eout((t - A.t1) / (A.t2 - A.t1)) : t < A.t3 ? 1 + 0.05 * Math.sin((t - A.t2) * 9) : 1 - ein((t - A.t3) / (A.t4 - A.t3)); B.z = TUNE.imH * hz; m.x = lerp(A.sx, A.tx, u); m.y = lerp(A.sy, A.ty, u); }
      if (cross(A.t2) && S.inst) S.inst.fx.push({ kind: 'hang', a: B, t: 0, life: A.t3 - A.t2 + TUNE.imDive + 0.1 });
      if (cross(A.t4)) land(A);
      for (let i = 0; i < A.n; i++) if (cross(A.t4 + 0.15 + i * TUNE.imGap)) { const gn = TUNE.imGapN[k], off = S.gapOff != null ? S.gapOff : Math.random() * TAU, gaps = [];   /* (S.gapOff: the harness fixes the gaps) */ for (let j = 0; j < gn; j++) gaps.push({ a: off + j / gn * TAU, w: TUNE.imGapW });
        S.waves.push({ x: A.tx, y: A.ty, R: TUNE.imWaveR, t: 0, dur: TUNE.imWaveR / TUNE.imWaveSpd, gaps, hit: false, prev: 0, dmg: U() * TUNE.imWaveK, tag: 'impact', cover: true, r0: TUNE.imR * 0.5 }); if (i) { sfx('thud'); X.shake(6, 0.2); } }
      if (A.volc && cross(A.volc)) volcano(A.tx, A.ty);
      if (t >= A.dur) { S.ventQ = Math.max(S.ventQ, TUNE.ventImp); return true; }
      return false; }
    if (A.kind === 'roar') { B.vx = B.vy = 0; B.mv = 0;
      if (cross(0.45)) { const gaps = [], off = S.gapOff != null ? S.gapOff : Math.random() * TAU; for (let j = 0; j < TUNE.roarGapN; j++) gaps.push({ a: off + j / TUNE.roarGapN * TAU, w: TUNE.imGapW });
        S.waves.push({ x: B.x, y: B.y, R: TUNE.roarR, t: 0, dur: TUNE.roarR / 8.5, gaps, hit: false, prev: 0, dmg: U() * TUNE.roarK, tag: 'roar', r0: m.r });
        if (S.inst) { S.inst.fx.push({ kind: 'ringw', x: B.x, y: B.y, R: 4.6, t: 0, life: 0.8, seed: 2 }); S.inst.fx.push({ kind: 'hemi', x: B.x, y: B.y, R: 2.6, t: 0, life: 0.6, seed: 4 }); S.inst.fx.push({ kind: 'dust', x: B.x, y: B.y, R: 3.2, t: 0, life: 1.0, seed: 4 }); }
        X.shake(10, 0.4); growl(S.phase === 3 ? 1.25 : 1.1); sfx('crash'); }
      return t >= A.dur; }
    return true;
  }
  function endAct(A) { if (A.kind === 'roar') { if (S.phase === 2) start('over'); else if (S.phase >= 3) cataclysm(); } if (A.kind === 'impact' || A.kind === 'charge') { S.B.z = 0; S.B.gk = 1; S.B.gal = 0; } }
  // an interrupted power: its blows called off (marked lanes, fans and marks fade unstruck); airborne, it drops where it is
  function abortActs() {
    for (const A of S.acts) if (A.kind === 'impact' && S.B.z > 0) { S.B.z = 0; }
    S.acts.length = 0; S.B.gk = 1; S.B.gal = 0;
    for (const L of S.lanes) if (L.end < 0) { L.end = L.t; L.hit = true; }
    for (const V of S.vols) { V.dead = true; V.hit = true; }
    for (const c of S.cres) c.end = true;
    for (const k of S.marks) k.done = true;
    for (const w of S.waves) w.hit = true;
    if (S.inst) for (const f of S.inst.fx) if ((f.kind === 'trail' || f.kind === 'hang') && f.life - f.t > 0.4) f.life = f.t + 0.4;
    S.idleT = Math.max(S.idleT, 1.0);
  }
  function chargeImpact(A) {
    const X = S.X, me = S.me, k = kOf(); A.impact = true; A.go = false; const f = frontOf(A.fd + 0.3), last = A.seg >= A.n - 1;
    if (A.lane && A.lane.end < 0) A.lane.end = A.lane.t;
    if (!me.dead && Math.hypot(me.x - f.x, me.y - f.y) < TUNE.chEndR + me.r) { if (hurt(U() * TUNE.chEndK, { charge: true })) { S.stat.chargeEnd++; const an = Math.atan2(me.y - f.y, me.x - f.x); me.push = { vx: Math.cos(an) * 10, vy: Math.sin(an) * 10, t: 0.25 }; } }
    if (S.inst) S.inst.impactFx(f.x, f.y, 3, last);
    if (TUNE.chShockR[k] > 0) S.waves.push({ x: f.x, y: f.y, R: TUNE.chShockR[k], t: 0, dur: 0.5, gaps: [], hit: false, prev: 0, dmg: U() * TUNE.chShockK, tag: 'charge', r0: 0 });
    if (last && S.phase >= 3) X.after(0.18, () => { if (S && S.mode === 'fight' && !S.wr) volcano(f.x, f.y); });
    gain(TUNE.ruinLand); X.flash(0.14, '#FFC08A'); X.shake(11, 0.3); sfx('crash'); X.light(f.x, f.y, 4, 0.4); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.045);
  }
  // a volcanic eruption (phase III's last charge, its First Impact): fire, a pillar, embers, rock; its reach lit before it
  function volcano(x, y) {
    const X = S.X, me = S.me, R = TUNE.volcR;
    if (!me.dead && Math.hypot(me.x - x, me.y - y) < R + me.r * 0.5) { if (hurt(U() * TUNE.volcK, { volc: true })) { S.stat.volcHit++; const an = Math.atan2(me.y - y, me.x - x); me.push = { vx: Math.cos(an) * 10, vy: Math.sin(an) * 10, t: 0.25 }; } }
    if (S.inst) { const I = S.inst.fx; I.push({ kind: 'fball', x, y, R: R * 0.6, t: 0, life: 1.1, seed: Math.random() * 40 }); I.push({ kind: 'pillar', x, y, R: 0.9, H: 7, t: 0, life: 1.3, seed: Math.random() * 40 }); I.push({ kind: 'embers', x, y, R: R * 1.1, t: 0, life: 2.2, seed: Math.random() * 40 });
      I.push({ kind: 'ringw', x, y, R: R * 1.25, t: 0, life: 0.8, seed: 25 }); I.push({ kind: 'hemi', x, y, R: R * 0.85, t: 0, life: 0.8, seed: 27 }); I.push({ kind: 'crack', x, y, R: R * 0.9, t: 0, life: 3.0, seed: 29, heat: 1.5 }); I.push({ kind: 'smoke', x, y, R: R * 0.9, t: 0, life: 2.2, seed: 31 }); }
    S.waves.push({ x, y, R, t: 0, dur: 0.45, gaps: [], hit: true, prev: 0, dmg: 0, vis: 0.8, tag: 'show' });
    gain(TUNE.ruinLand); X.flash(0.22, '#FFD09A'); X.shake(15, 0.45); sfx('crash'); X.light(x, y, 6, 0.7); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06);
  }
  /* Horns of Perdition: a fan of crescents aimed at the pet, one path left dark beside it */
  function volley(A, i) {
    const k = kOf(), me = S.me, m = S.m, n = TUNE.pdSlots[k], F = TUNE.pdFan[k], step = F / (n - 1), aim = Math.atan2(me.y - m.y, me.x - m.x), o = frontOf(FD() * 0.95);
    const jp = Math.max(0, Math.min(n - 1, Math.round(angD(Math.atan2(me.y - o.y, me.x - o.x), aim) / step + (n - 1) / 2)));
    let jg = jp + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 2); if (jg < 0) jg = jp + 1 + (Math.random() < 0.5 ? 1 : 0); if (jg > n - 1) jg = jp - 1 - (Math.random() < 0.5 ? 1 : 0); jg = Math.max(0, Math.min(n - 1, jg)); if (jg === jp) jg = jp > 0 ? jp - 1 : jp + 1;
    const slots = []; for (let j = 0; j < n; j++) { const a = aim + (j - (n - 1) / 2) * step; slots.push({ a, ux: Math.cos(a), uy: Math.sin(a), gap: j === jg, len: reach(o.x, o.y, a, -0.6, TUNE.pdRange) }); }
    const V = { x: o.x, y: o.y, aim, slots, gapJ: jg, t: 0, tell: TUNE.pdTell, fired: false, hit: false, dead: false, i, tilt: i % 2 ? -1 : 1 };
    S.vols.push(V); return V;
  }
  function fire(V, i) {
    if (V.dead) return; V.fired = true; const X = S.X;
    for (const s of V.slots) { if (s.gap) continue; const len = Math.max(2, s.len), rec = S.inst ? S.inst.slashOf({ x: V.x, y: V.y, dx: s.ux, dy: s.uy, sp: TUNE.pdSpd, range: TUNE.pdRange, dmg: 0, tilt: V.tilt * 0.55 }) : null;
      if (rec) { rec.life = (len + 0.8) / TUNE.pdSpd + 0.3; rec.sp = 0; S.inst.fx.push(rec); }   // (its picture: aged over its flight; moved by the hazard below)
      S.cres.push({ V, x: V.x, y: V.y, ox: V.x, oy: V.y, ux: s.ux, uy: s.uy, d: 0, len, end: false, rec }); }
    X.shake(4, 0.1); sfx('whoosh'); note(330 + i * 30, 0.25, 'sawtooth', 0.04, 160);
  }
  /* First Impact: the landing */
  function land(A) {
    const X = S.X, me = S.me, m = S.m, k = kOf(), B = S.B; A.landed = true; B.z = 0; m.x = A.tx; m.y = A.ty; B.x = m.x; B.y = m.y;
    if (!me.dead && Math.hypot(me.x - A.tx, me.y - A.ty) < TUNE.imR + me.r) { if (hurt(U() * TUNE.imK, { impact: true })) { S.stat.impactHit++; const an = Math.atan2(me.y - A.ty, me.x - A.tx); me.push = { vx: Math.cos(an) * 11, vy: Math.sin(an) * 11, t: 0.25 }; } }
    if (S.inst) { S.inst.impactFx(A.tx, A.ty, 3, true); const I = S.inst.fx; I.push({ kind: 'embers', x: A.tx, y: A.ty, R: TUNE.imR, t: 0, life: 1.6, seed: Math.random() * 40 }); I.push({ kind: 'smoke', x: A.tx, y: A.ty, R: TUNE.imR * 0.8, t: 0, life: 1.8, seed: 3 }); }
    // molten spires burst up round the landing: obstacles, and cover from its rings
    const n = Math.round(TUNE.spires[k]), off = Math.random() * TAU; let made = 0;
    for (let i = 0; i < n * 3 && made < n; i++) { const an = off + (made + (i - made) * 0.37) / n * TAU + (Math.random() - 0.5) * 0.3, rr = TUNE.imR * (1.15 + Math.random() * 0.75), x = A.tx + Math.cos(an) * rr, y = A.ty + Math.sin(an) * rr;
      if (!inA(x, y, 0.9) || S.spires.some(q => !q.dud && Math.hypot(q.x - x, q.y - y) < 1.6)) continue;
      const rec = S.inst ? { kind: 'spire', x, y, t: -made * 0.03, life: TUNE.spireLife, s: 0.42 + Math.random() * 0.14, yaw: Math.random() * 6, lean: (Math.random() - 0.5) * 0.4, seed: Math.random() * 40 } : null; if (rec) S.inst.fx.push(rec);
      S.spires.push({ x, y, r: TUNE.spireR, t: 0, life: TUNE.spireLife, rec, dud: false }); made++; }
    gain(TUNE.ruinLand); X.flash(0.2, '#FFC08A'); X.shake(15, 0.4); sfx('crash'); X.light(A.tx, A.ty, 6, 0.6); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06);
  }
  function shatter(sp) { sp.dud = true; if (sp.rec && sp.rec.life - sp.rec.t > 0.4) sp.rec.life = sp.rec.t + 0.4; if (S.inst) { for (let i = 0; i < Math.round(4 * LQ()); i++) { const an = Math.random() * TAU, v = 1.5 + Math.random() * 2; S.inst.fx.push({ kind: 'rock', x: sp.x, y: sp.y, z: 0.6, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 3 + Math.random() * 3, t: 0, life: 1.2, s: 0.12 + Math.random() * 0.1, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); } } }

  /* ---- the hazards in the world: lanes, fans and crescents, marks, rings, burning ground, spires ---- */
  function hazardsTick(da, dt) {
    const me = S.me, m = S.m, X = S.X, alive = (S.mode === 'fight') && !m.dead && !me.dead;
    for (let i = S.lanes.length - 1; i >= 0; i--) { const L = S.lanes[i]; L.t += da; if (L.end >= 0 && L.t > L.end + 0.8) S.lanes.splice(i, 1); }
    for (let i = S.vols.length - 1; i >= 0; i--) { const V = S.vols[i]; V.t += da; if (V.dead && !V.fired) { V.fadeT = (V.fadeT || 0) + da; if (V.fadeT > 0.4) S.vols.splice(i, 1); } else if (V.fired && V.t > V.tell + 0.35) S.vols.splice(i, 1); }
    // the crescents: flying out along their paths, each fan striking the pet once
    for (let i = S.cres.length - 1; i >= 0; i--) { const c = S.cres[i]; const d0 = c.d;
      if (!c.end) { c.d += TUNE.pdSpd * da; c.x = c.ox + c.ux * c.d; c.y = c.oy + c.uy * c.d;
        if (alive && !c.V.hit) { const rx = me.x - c.ox, ry = me.y - c.oy, al = rx * c.ux + ry * c.uy, lat = Math.abs(-rx * c.uy + ry * c.ux);
          if (lat < TUNE.pdHalf + me.r * 0.6 && al > d0 - 0.6 && al < c.d + 0.4 && al > 0.3) { c.V.hit = true; if (hurt(U() * TUNE.pdK, { perd: true })) { S.stat.perdHit++; me.push = { vx: c.ux * 6, vy: c.uy * 6, t: 0.18 }; X.shake(5, 0.15); } } }
        if (c.d >= c.len + 0.8) c.end = true; }
      if (c.rec) { c.rec.x = c.x; c.rec.y = c.y; c.rec.d = c.d; if (c.end && c.rec.life > c.rec.t + 0.3) c.rec.life = c.rec.t + 0.25; }
      if (c.end) S.cres.splice(i, 1); }
    // the cross's mark: light first, then the detonation
    for (let i = S.marks.length - 1; i >= 0; i--) { const k2 = S.marks[i], t0 = k2.t; k2.t += k2.done ? dt : da;
      if (!k2.done && t0 < k2.tell && k2.t >= k2.tell) { k2.done = true; k2.blew = true;
        if (alive && Math.hypot(me.x - k2.x, me.y - k2.y) < k2.R + me.r * 0.5) { if (hurt(U() * TUNE.crossK, { cross: true })) { S.stat.crossHit++; const an = Math.atan2(me.y - k2.y, me.x - k2.x); me.push = { vx: Math.cos(an) * 9, vy: Math.sin(an) * 9, t: 0.22 }; } }
        if (S.inst) { const I = S.inst.fx; I.push({ kind: 'xcross', x: k2.x, y: k2.y, R: k2.R * 1.2, t: 0, life: 0.9, seed: k2.seed }); I.push({ kind: 'hemi', x: k2.x, y: k2.y, R: k2.R * 0.9, t: 0, life: 0.6, seed: 5 }); I.push({ kind: 'fball', x: k2.x, y: k2.y, R: 1.2, t: 0, life: 0.6, seed: 7 }); }
        X.flash(0.16, '#FFC08A'); X.shake(12, 0.35); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.05); }
      if (k2.t > k2.tell + 0.5 || (k2.done && !k2.blew && k2.t > 0.5)) S.marks.splice(i, 1); }
    // the rings: their front strikes once as it passes, except in a gap or in a spire's lee
    for (let i = S.waves.length - 1; i >= 0; i--) { const w = S.waves[i]; w.t += da; const u = cl(w.t / w.dur), rw = (w.r0 || 0) + (w.R - (w.r0 || 0)) * (w.tag === 'charge' || w.tag === 'show' ? eout(u) : u);
      if (!w.hit && alive) { const d = Math.hypot(me.x - w.x, me.y - w.y);
        if (d - me.r <= rw && d + me.r >= w.prev - 0.3) { w.hit = true; const an = Math.atan2(me.y - w.y, me.x - w.x), sl = d > 0.1 ? Math.asin(Math.min(1, me.r * 0.6 / d)) : 0;
          const gap = w.gaps && w.gaps.some(q => Math.abs(angD(an, q.a)) < q.w / 2 - sl), cover = w.cover && S.spires.some(sp => { if (sp.dud || sp.t < 0.15) return false; const ds = Math.hypot(sp.x - w.x, sp.y - w.y); return ds < d - 0.2 && Math.abs(angD(Math.atan2(sp.y - w.y, sp.x - w.x), an)) < Math.atan2(sp.r + 0.15, ds); });
          if (gap) S.stat.waveGap++; else if (cover) S.stat.waveCover++;
          else if (w.dmg > 0 && hurt(w.dmg, { wave: w.tag })) { if (w.tag === 'roar') S.stat.roarHit++; else if (w.tag === 'impact') S.stat.waveHit++; else S.stat.chargeEnd++; me.push = { vx: Math.cos(an) * 7, vy: Math.sin(an) * 7, t: 0.2 }; } } }
      if (u >= 1 && !w.hit) w.hit = true; w.prev = rw; if (w.t >= w.dur + 0.45) S.waves.splice(i, 1); }
    // burning ground: ticks on a pet that stands in it
    for (let i = S.trails.length - 1; i >= 0; i--) { const q = S.trails[i]; q.t += da; q.tk -= da;
      if (q.tk <= 0) { q.tk += TUNE.trailTick; if (alive && q.t < q.life - 0.3 && Math.hypot(me.x - q.x, me.y - q.y) < q.r + me.r * 0.5) { if (hurt(U() * TUNE.trailK, { dot: true, trail: true })) S.stat.trailHit++; } }
      if (q.t >= q.life) S.trails.splice(i, 1); }
    // the spires: rising, standing (the pet walks round them), crumbling
    for (let i = S.spires.length - 1; i >= 0; i--) { const sp = S.spires[i]; sp.t += dt;
      if (!sp.dud && sp.t > 0.12 && !me.dead && !me.leap) { const dx = me.x - sp.x, dy = me.y - sp.y, d = Math.hypot(dx, dy), r0 = sp.r + me.r * 0.8; if (d < r0) { const ux = d > 1e-4 ? dx / d : 0, uy = d > 1e-4 ? dy / d : 1; X.moveEnt(me, ux * (r0 - d), uy * (r0 - d), 0); } }
      if (sp.t >= sp.life || (sp.dud && sp.t > sp.life)) { if (!sp.dud) sp.dud = true; S.spires.splice(i, 1); } else if (sp.dud && (!sp.rec || sp.rec.t >= sp.rec.life)) S.spires.splice(i, 1); }
  }

  /* ================= Wrath of the Fallen: the last phase's end ================= */
  function refugesFor() {
    const out = [{ x: AR.arch.x, y: AR.arch.y - 0.85, kind: 'arch' }], R1 = AR.rings[AR.rings.length - 1], cand = [-0.3, 0.6, Math.PI / 2, Math.PI - 0.6, Math.PI + 0.3];
    const pick = cand.map((a, i) => ({ a, i, r: Math.random() })).sort((p, q) => p.r - q.r); const took = [];
    for (const c of pick) { if (took.length >= TUNE.coolN) break; if (took.some(t => Math.abs(t.i - c.i) < 2)) continue; const x = AR.cx + Math.cos(c.a) * R1, y = AR.cy + Math.sin(c.a) * R1; if (!inA(x, y, 0.6)) continue; took.push(c); out.push({ x, y, kind: 'cool', a: c.a }); }
    return out;
  }
  function startWrath() {
    const m = S.m, B = S.B, X = S.X; abortActs(); if (S.vent) endVent(); S.over = 0; S.cata = 0; S.ventQ = 0; S.burn = null;
    S.pad = { kind: 'void', base: Math.max(1, m.hp), buf: 1e7 }; m.hp += S.pad.buf; S.lastM = m.hp;
    const UT = UTo(); S.wr = { t: 0, x0: B.x, y0: B.y, tx: AR.cx, ty: AR.cy, dir: AR.cx >= B.x ? 1 : -1, refs: refugesFor(), hit: false, safe: false, seed: Math.random() * 1000, cata: 0.6 };
    S.wr.hx = S.wr.tx - S.wr.dir * 3.2; S.wr.hy = S.wr.ty - 0.6; S.wrDone = true; S.stat.wrath++; S.stat.wrathAt = S.g.t - S.stat.t0; B.vx = B.vy = 0; B.mv = 0;
    say('wrath', 'WRATH OF THE FALLEN', 'Shelter behind the horn monument or on a cooled channel', COL.pale, 3.2); heat(2);
    if (S.inst) S.inst.fx.push({ kind: 'sigil', x: B.x, y: B.y, R: 4.6, t: 0, life: UT.launch + 0.6, cine: 1, ult: 1 });
    sfx('hum'); X.after(0.6, () => { if (S && S.wr) sfx('hum'); }); note(49, 3.5, 'sawtooth', 0.12, 98);
  }
  function wrathTick(dt) {
    const J = S.wr, B = S.B, m = S.m, me = S.me, X = S.X, UT = UTo(), t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x;
    if (t < UT.p1 && Math.random() < dt * 10) X.shake(1 + t * 1.2, 0.08);
    if (t < UT.p2 && S.inst && Math.random() < dt * (4 + 6 * t / UT.p2) * LQ()) { const an = Math.random() * TAU, rr = 1.5 + Math.random() * 3; S.inst.fx.push({ kind: 'float', x: B.x + Math.cos(an) * rr, y: B.y + Math.sin(an) * rr * 0.7, z: 0, vz: 0.6 + Math.random() * 1.2, t: 0, life: 2.2, s: 0.08 + Math.random() * 0.1, seed: Math.random() * 90 | 0, rot: Math.random() * 6, cine: 1 }); }
    if (cross(UT.p1 + 0.15)) { if (S.inst) { S.inst.fx.push({ kind: 'ringw', x: B.x, y: B.y, R: 7, t: 0, life: 1.0, seed: 3, cine: 1 }); S.inst.fx.push({ kind: 'hemi', x: B.x, y: B.y, R: 3.6, t: 0, life: 0.8, seed: 5, cine: 1 }); } X.flash(0.2, '#FFB88A'); X.shake(12, 0.5); growl(1.3); sfx('crash'); }   // the Breaking of the Seal: the roar
    if (cross(UT.p2)) { if (S.inst) S.inst.fx.push({ kind: 'crack', x: B.x, y: B.y, R: 3.0, t: 0, life: 5, seed: 7, heat: 1.4, cine: 1 }); sfx('hum'); }
    if (cross(UT.launch)) { if (S.inst) { const I = S.inst.fx; I.push({ kind: 'burst', a: B, t: 0, life: 0.6, cine: 1 }); I.push({ kind: 'ringw', x: B.x, y: B.y, R: 5, t: 0, life: 0.8, seed: 9, cine: 1 }); I.push({ kind: 'dust', x: B.x, y: B.y, R: 3.4, t: 0, life: 1.2, seed: 11, cine: 1 }); I.push({ kind: 'ascent', x: B.x, y: B.y, t: 0, life: 2.4, cine: 1 }); } X.shake(14, 0.5); X.flash(0.18, '#FFB15A'); sfx('whoosh'); }
    // its flight: up off the top of the view; revealed high above, sigils behind it; the fall onto the altar's heart
    if (t >= UT.launch && t < UT.p3) { const u = (t - UT.launch) / (UT.p3 - UT.launch); B.z = 16 * ein(u) + 1.5 * u; B.alpha = 1 - sstep(0.75, 1, u); }
    else if (t >= UT.p3 && t < UT.hit) { const u = sstep(UT.dive, UT.hit, t), uu = ein(cl((t - UT.dive) / (UT.hit - UT.dive))); m.x = lerp(J.hx, J.tx, uu); m.y = lerp(J.hy, J.ty, uu); B.z = lerp(5.2, 0, uu) + (1 - u) * 0.25 * Math.sin(t * 3); B.alpha = sstep(UT.p3, UT.p3 + 0.35, t); B.yaw = J.dir > 0 ? 0.25 : Math.PI - 0.25; }
    if (cross(UT.p3) && S.inst) { S.inst.fx.push({ kind: 'skysig', a: B, t: 0, life: UT.hit - UT.p3 + 0.2, cine: 1 }); S.inst.fx.push({ kind: 'mtrail', a: B, t: 0, life: UT.hit - UT.p3 + 0.15, cine: 1 }); }
    if (cross(UT.dive)) { if (S.inst) S.inst.fx.push({ kind: 'shock', a: B, t: 0, life: UT.hit - UT.dive + 0.1, cine: 1 }); sfx('whoosh'); }
    if (t > UT.dive && t < UT.hit && Math.random() < dt * 6) X.shake(2 + 6 * sstep(UT.dive, UT.hit, t), 0.06);
    if (cross(UT.hit)) { m.x = J.tx; m.y = J.ty; B.z = 0; B.alpha = 1;
      if (S.inst) { const big = 1.4; S.inst.fx.push({ kind: 'wrath', x: J.tx, y: J.ty, t: 0, life: UT.len - UT.hit + 2.6, big, k: 3, seed: Math.random() * 50, cine: 1 }); }
      X.flash(0.45, '#FFF0D8'); X.shake(lowFx() ? 16 : 26, 0.9); sfx('crash'); X.light(J.tx, J.ty, 12, 1.2); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.09); heat(2); }
    // the blow: outside a refuge, a crushing share of the pet's health (never lethal from full); in one, nothing
    if (t >= UT.hit && t < UT.hit + TUNE.wrWin && !J.hit && !J.safe && !me.dead) {
      const inR = J.refs.some(r => Math.hypot(me.x - r.x, me.y - r.y) < TUNE.refR + me.r * 0.25);
      if (inR) { J.safe = true; S.stat.wrathSafe++; X.text(me.x, me.y - 1.6, 'Sheltered from the Wrath', COL.cool, 14, { life: 1.3 }); X.ring(me.x, me.y, 0.3, 1.8, 0.5, COL.cool, 0.2); }
      else { const s2 = ST(), mx = s2 ? s2.hp : 200; let d = mx * TUNE.wrK; if (me.hp >= mx * 0.97) d = Math.min(d, me.hp - 1);
        const h0 = me.hp; if (S.X.hurtPet(d, m, { wrath: true })) { J.hit = true; S.stat.wrathHit++; S.stat.dmgIn += Math.max(0, h0 - me.hp); X.text(me.x, me.y - 1.8, 'Struck by the Fallen Star!', COL.pale, 15); const an = Math.atan2(me.y - J.ty, me.x - J.tx); me.push = { vx: Math.cos(an) * 9, vy: Math.sin(an) * 9, t: 0.25 }; } } }
    if (cross(UT.w2)) { X.shake(16, 0.5); sfx('thud'); }
    if (cross(UT.w3)) { X.shake(14, 0.45); sfx('crash'); }
    if (cross(UT.fb)) { X.flash(0.25, '#FFB88A'); X.shake(18, 0.5); sfx('crash'); heat(1.4); }
    if (t >= UT.p5) fall(true);
  }

  /* ---- the fall: it stands in the crater, roars once more and dissolves into embers, its reactor last; the gate completes ---- */
  function fall(fromWrath) {
    if (!S || S.mode === 'dead' || S.mode === 'over') return; const m = S.m, X = S.X, g = S.g;
    if (!fromWrath) { abortActs(); X.flash(0.6, '#FFFFFF'); g.hitStop = Math.max(g.hitStop || 0, 0.1); X.shake(16, 0.7); sfx('crash'); }
    if (S.pad) m.hp = Math.max(1, S.pad.base); S.mode = 'dead'; S.deadT = 0; S.wr = null; S.pad = null; S.vent = null; S.over = 0; S.cata = 0; S.burn = null; S.B.z = 0; S.B.alpha = 1;
    S.lanes.length = 0; S.vols.length = 0; S.cres.length = 0; S.marks.length = 0; S.waves.length = 0; S.trails.length = 0;
    m.act = 'dead'; m.stunT = 0; m.guardFn = null; S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1); g.slowT = 0; heat(0.8);
  }
  const FALL = () => { const UT = UTo(); return UT.len - UT.p5 + 1.2; };
  function deadTick(dt) {
    const B = S.B, X = S.X, t0 = S.deadT; S.deadT += dt; const t = S.deadT, cross = x => t0 < x && t >= x, UT = UTo(), I = S.inst ? S.inst.fx : null;
    if (cross(UT.roar - UT.p5)) { if (I) I.push({ kind: 'ringw', x: B.x, y: B.y, R: 3.4, t: 0, life: 0.8, seed: 41, cine: 1 }); growl(0.9); X.shake(6, 0.3); }
    if (cross(1.3)) { X.banner('THE FIRST CATACLYSM FALLS', 'Samael bows its horns: the Ram\'s fire answers you', COL.hot, 3.0, true, true); sfx('sparkle'); heat(0.4); }
    if (t > 1.1 && t < FALL() - 0.4 && Math.random() < dt * 18 * LQ()) X.part({ kind: 'ember', x: B.x + (Math.random() - 0.5) * 3.6, y: B.y - Math.random() * 4, vx: (Math.random() - 0.5) * 0.8, vy: -1.2 - Math.random() * 1.2, life: 1.2, max: 1.2, size: 3.5, color: Math.random() < 0.5 ? COL.ember : COL.hot });
    if (cross(UT.len - UT.p5 + 0.1)) { X.flash(0.3, '#FFE6C8'); X.light(B.x, B.y - 1, 7, 1.0); sfx('chime'); }
    if (t >= FALL()) { const X2 = X; finish(); try { X2.winStage(); } catch (e) { /* (the stage already ended) */ } }
  }
  // the fight over (won): every hold and hook handed back; the body no longer drawn
  function finish() { if (!S) return; const m = S.m; cleanup(); try { if (m && !m.dead) { m.hp = 0; m.dead = true; } } catch (e) {} S.mode = 'over'; }

  /* ================= clean-up ================= */
  function cleanup() {
    if (!S) return; const g = S.g, m = S.m;
    try { S.acts.length = 0; S.lanes.length = 0; S.vols.length = 0; S.cres.length = 0; S.marks.length = 0; S.waves.length = 0; S.trails.length = 0; S.spires.length = 0; S.wr = null; S.vent = null; S.burn = null; S.over = 0; S.cata = 0; } catch (e) {}
    try { if (S.pad && m && !m.dead) m.hp = S.pad.base; S.pad = null; } catch (e) {}
    try { if (S.cine) { S.cine = false; if (g.cineT > 0) g.cineT = 0; } } catch (e) {}
    try { const R = S.X && S.X.rift, list = R && R.objs; if (list) for (const o of S.objs) { const i = list.indexOf(o); if (i >= 0) list.splice(i, 1); } for (const o of S.objs) o.draw = null; S.objs.length = 0; } catch (e) {}
    try { if (S.inst) S.inst.stop(); } catch (e) {} S.inst = null;   // (its effects dropped and Samael's GPU buffers freed: SAMAEL_GL.release)
    try { if (m) { m.ownBar = null; m.goalFn = null; m.guardFn = null; m.stunT = 0; } } catch (e) {}
  }
  function stop() { if (!S) return; const s = S; try { cleanup(); } catch (e) {} try { const g = s.g, m = s.m; if (m && !m.dead) { m.dead = true; } if (g && g.boss === m) g.boss = null; } catch (e) {} S = null; }
  const active = () => !!(S && S.mode !== 'over');

  /* ================= the pose: the Anima's own (20g4: SAMAEL_MOVES.poseFor for each power, ultPose for the Wrath and the fall,
     easePose to ease it, SAMAEL_GL.idlePose at rest), with what only the boss has laid over it: the intro's assembly and roar, the
     Overdrive's open chest, the Cataclysm's white heat, the vent's spent stance and bared heart, the phase's quickening ================= */
  function poseOf(dt) {
    const B = S.B, m = S.m, G = GLS(), Mv = MV(), A = S.acts[0], UT = UTo();
    const base = G ? G.idlePose(3, B.at) : { k: 3, core: 0.9 };
    const pf = (kind, t, o) => (Mv && Mv.poseFor ? Mv.poseFor(kind, t, Object.assign({ base, k: 3 }, o)) : { core: 0.9 });
    let tg;
    if (S.wr) tg = Mv && Mv.ultPose ? Mv.ultPose(S.wr.t, { cata: S.wr.cata }) : pf('rest', 0, {});
    else if (S.mode === 'dead') tg = Mv && Mv.ultPose ? Mv.ultPose(UT.p5 + S.deadT, { cata: 0 }) : pf('rest', 0, {});
    else if (A && S.mode === 'fight') { const t = A.kind === 'charge' ? A.t - A.t0 : A.t;
      tg = A.kind === 'charge' ? pf('charge', t, { wind: A.wind, charge: A.ct, first: A.seg === 0, last: A.seg >= A.n - 1 })
        : A.kind === 'perd' ? pf('perd', t, { wind: A.wind, n: A.n, gap: A.gap, k: A.cross ? 3 : 2 })
        : A.kind === 'over' ? pf('over', t, { wind: A.wind })
        : A.kind === 'impact' ? pf('impact', t, { cr: A.t1, rise: A.t2 - A.t1, hang: A.t3 - A.t2, dive: A.t4 - A.t3 })
        : A.kind === 'roar' ? pf('roar', t, {}) : pf('rest', 0, {}); }
    else tg = pf('rest', 0, {});
    if (S.mode === 'fight' && !S.wr) {
      if (S.over > 0) { tg.coreOpen = Math.max(tg.coreOpen || 0, 0.45); tg.core = (tg.core || 0.9) + 0.6; tg.dorsal = Math.max(tg.dorsal || 0, 0.5); tg.hornSpin = (tg.hornSpin || 1) + 2; tg.glow = (tg.glow || 0) + 0.15; }
      if (S.cata > 0) { const fl = 0.85 + 0.15 * Math.sin(B.at * 23); tg.heat = Math.max(tg.heat || 0, fl); tg.vent = Math.max(tg.vent || 0, 1); tg.horn = Math.max(tg.horn || 0, 0.35); tg.core = (tg.core || 0.9) + 1.2; tg.glow = (tg.glow || 0) + 0.35; tg.dorsal = Math.max(tg.dorsal || 0, 0.7); }
      if (S.vent) { const V = S.vent, e = sstep(0, 0.35, V.t) * (1 - sstep(V.dur - 0.45, V.dur, V.t)), hit = S.heartT > 0 ? S.heartT / 0.35 : 0;
        tg.coreOpen = Math.max(tg.coreOpen || 0, e); tg.coreBig = Math.max(tg.coreBig || 0, 0.25 * e); tg.core = (tg.core || 0.9) + 1.3 * e; tg.heat = Math.max(tg.heat || 0, 0.45 * e); tg.crouch = Math.max(tg.crouch || 0, 0.38 * e); tg.head = (tg.head || 0) + 0.45 * e;
        tg.jaw = Math.max(tg.jaw || 0, 0.28 * e); tg.live = Math.min(tg.live == null ? 1 : tg.live, 1 - 0.7 * e); tg.mech = Math.max(tg.mech || 0, 0.8 * e); tg.eye = (tg.eye == null ? 1 : tg.eye) * (1 - 0.45 * e); tg.vent = Math.max(tg.vent || 0, 0.6 * e); tg.hornSpin = (tg.hornSpin || 1) * (1 - 0.6 * e);
        tg.stagger = (tg.stagger || 0) + 0.12 * e * Math.sin(S.t * 5) + 0.35 * hit; }
      tg.glow = (tg.glow || 0) + (S.phase - 1) * 0.07; tg.core = (tg.core == null ? 0.9 : tg.core) + (S.phase - 1) * 0.15; tg.hornSpin = (tg.hornSpin || 1) + (S.phase - 1) * 0.6; }
    if (S.mode === 'intro') { const e = S.introT; if (e > 3.3) tg = Object.assign(tg, pf('roar', e - 3.3, {}));
      tg.asm = Math.max(0.03, sstep(0.6, 2.9, e)); tg.core = lerp(0.2, 2.6, sstep(0.4, 1.4, e)) * (1 - 0.4 * sstep(3.0, 3.8, e)) + (e > 3.3 ? (tg.core || 0.9) * 0.4 * sstep(3.3, 3.8, e) : 0);
      tg.horn = Math.max(tg.horn || 0, 0.5 * bump(e, 2.5, 2.9, 3.0, 3.5)); tg.glow = (tg.glow || 0) + 0.8 * (1 - sstep(2.6, 3.8, e)); tg.hornSpin = (tg.hornSpin || 1) + 4 * (1 - sstep(2.2, 3.4, e)); tg.crouch = Math.max(tg.crouch || 0, 0.6 * bump(e, 2.92, 3.05, 3.15, 3.55)); }
    if (m.flinch > 0) { m.flinch = Math.max(0, m.flinch - dt * 2.5); tg.stagger = Math.max(tg.stagger || 0, Math.sin(m.flinch * Math.PI) * 0.6); }
    const pz = Mv && Mv.easePose ? Mv.easePose(B.ps, tg, dt) : tg;
    // the yaw: turned quickly toward its heading or the pet (a charge holds its line)
    const go = A && A.kind === 'charge' && A.go;
    if (S.mode === 'fight' && !S.wr && !go && B.yawT != null) { const rate = (A && (A.kind === 'charge' || A.kind === 'perd' || A.kind === 'impact') ? 4.0 : 2.4) * dt, dd = angD(B.yawT, B.yaw); B.yaw += Math.max(-rate, Math.min(rate, dd * Math.min(1, dt * 5) * 6)); }
    const vx = B.vx || 0, vy = B.vy || 0; B.ax = lerp(B.ax, (vx - B.lvx) / Math.max(dt, 1e-3), 0.3); B.ay = lerp(B.ay, (vy - B.lvy) / Math.max(dt, 1e-3), 0.3); B.lvx = vx; B.lvy = vy;
    if (G) try { G.springs(B, Math.max(-60, Math.min(60, B.ax)), Math.max(-60, Math.min(60, B.ay)), dt); } catch (e) {}
    if (!go && !(A && A.kind === 'charge' && A.impact === false && A.launched)) { const sp = Math.hypot(vx, vy); B.mv += (cl(sp / 1.6) - B.mv) * Math.min(1, dt * 4); B.gal += ((B.mv > 0.85 ? 0.5 : 0) - B.gal) * Math.min(1, dt * 3); }
    B.sm.mv = cl(B.mv);
    const still = S.wr || S.mode === 'dead';
    B.smP = Object.assign(base, pz, { k: 3, t: B.at, yaw: B.yaw + (still ? (tg.yawOff || 0) : 0), ph: B.ph, mv: still ? 0 : cl(B.mv), gal: still ? 0 : cl(B.gal), feet: pz.feet, asm: tg.asm == null ? 1 : tg.asm, dis: tg.dis || 0, live: pz.live, gaitK: B.gk || 1 });
    m.face = Math.cos(B.yaw) >= 0 ? 1 : -1;
  }

  /* ================= drawing ================= */
  function safeDraw(c, f) { if (!S || S.mode === 'over') return; c.save(); try { f(c); } catch (e) { if (!S.drawErr) { S.drawErr = 1; try { console.warn('Samael boss draw: ' + (e && e.message || e)); } catch (e2) {} } } c.restore(); }
  const sx = x => S.X.sx(x), sy = y => S.X.sy(y), Tz = () => S.X.Tz();
  /* the ground: the hush, its shadow, the Anima's ground effects, then the tells (lanes, fans, the corona, the landing spot, the
     cross's mark, the volcano's reach, burning ground, the vent's heart arc, the Wrath's refuges), then the rings with their gaps */
  function drawGroundLayer(c) {
    const T = Tz(), B = S.B, on = gpu(), X = S.X, W = X.W(), Hh = X.H(), UT = UTo();
    let dim = 0; if (S.mode === 'intro') dim = 0.42 * (1 - sstep(3.4, 5.6, S.introT)); if (S.mode === 'dead') dim = 0.25 * (1 - sstep(2.6, FALL(), S.deadT));
    if (S.wr) { const t = S.wr.t; dim = Math.max(dim, 0.55 * sstep(0, 1.2, t) * (1 - sstep(UT.hit, UT.hit + 0.4, t)) + 0.2 * sstep(UT.hit, UT.hit + 0.4, t) * (1 - sstep(UT.p5 - 0.6, UT.p5, t))); }
    if (dim > 0.005) { const fx = sx(B.x), fy = sy(B.y) - T * 2, gr = c.createRadialGradient(fx, fy, Math.min(W, Hh) * 0.1, fx, fy, Math.max(W, Hh) * 0.8); gr.addColorStop(0, `rgba(14,5,4,${(dim * 0.4).toFixed(3)})`); gr.addColorStop(1, `rgba(6,2,2,${Math.min(0.9, dim * 1.4).toFixed(3)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); }
    const r = B.smOut && B.smOut.r, al = B.alpha * (1 - (B.smP ? B.smP.dis || 0 : 0)), lz = Math.max(0, 1 - (B.z || 0) / 8);
    if (!on) { if (typeof shadeSprite === 'function') { c.globalAlpha = 0.4 * al * lz; blitSized(c, shadeSprite('#05030A'), sx(B.x) - T * 2.2, sy(B.y) - T * 0.7, T * 4.4, T * 1.4); c.globalAlpha = 1; } drawGround2d(c); return; }
    { const Q = fgOpen(c); if (r && al > 0.02 && !(B.z > 0.4)) { Q.sshadow(r.ground[0], r.ground[1], T * 2.1, T * 0.9, 0.45 * al, '#120605'); for (const p of r.feet || []) Q.sshadow(p[0], p[1], T * 0.5, T * 0.24, 0.5 * al, '#0C0404'); } else Q.sshadow(sx(B.x), sy(B.y), T * 2.1 * (0.5 + 0.5 * lz), T * 0.9 * (0.5 + 0.5 * lz), 0.35 * lz * B.alpha, '#120605'); fgClose(c); }
    if (S.inst) try { S.inst.drawGround(c); } catch (e) {}
    const Q = fgOpen(c);
    for (const L of S.lanes) laneGround(Q, L, T);
    for (const V of S.vols) fanGround(Q, V, T);
    // the Overdrive's corona: drawn out round it over the wind-up (the tell), then the burning ring of its reach
    { const A = S.acts.find(q => q.kind === 'over'), k = A ? sstep(0.05, A.wind, A.t) : 0, live = S.over > 0 ? sstep(0, 0.3, Math.min(S.over, 99)) * Math.min(1, S.over / 0.4) : 0;
      if (k > 0.01 || live > 0.01) { const X0 = sx(S.m.x), Y0 = sy(S.m.y), R = TUNE.ovR * T, op = Math.max(k * 0.55, live), pul = 0.5 + 0.5 * Math.sin(S.g.t * 6);
        const Rk = R * (k > live ? 0.35 + 0.65 * eout(k) : 1);   // (drawn out from its body to its reach over the wind-up)
        // a soft dark floor inside its reach and a dark feathered band under its edge (the altar's own fire rings sink beneath them), then a white-hot rim and a gold ring
        Q.quad(124, X0, Y0, Rk * 1.04, 0, 0, Rk * 1.04, UNDER, 0.32 * op, 0.95, 0.14, 0); Q.quad(145, X0, Y0, Rk / 0.8, 0, 0, Rk / 0.8, UNDER, 0.8 * op, 0, TAU * 0.999, 0.17);
        Q.ring(X0, Y0, Rk, COL.white, (0.55 + 0.3 * pul) * op, T * 0.09); Q.quad(192, X0, Y0, Rk / 0.8, 0, 0, Rk / 0.8, COL.gold, (0.4 + 0.3 * pul) * op, 0.8, 1.2, 0.9);
        if (live > 0.01) { Q.quad(305, X0, Y0, R * 1.05, 0, 0, R * 1.05, COL.ember, live, 0.86, 3, 1.5); Q.glow(X0, Y0, R * 0.9, COL.hot, 0.1 * live); } } }
    // First Impact's landing spot: a ring of light under the pet (following it, then locked: quicker); phase III's eruption's reach after
    for (const A of S.acts) if (A.kind === 'impact') { const X0 = sx(A.tx), Y0 = sy(A.ty);
      if (A.t > A.t1 - 0.2 && A.t < A.t4 + 0.25) { const R = TUNE.imR * T, e = sstep(A.t1 - 0.2, A.t1 + 0.2, A.t) * (1 - sstep(A.t4, A.t4 + 0.25, A.t)), hot = sstep(A.t3 - TUNE.imLock, A.t4, A.t), pul = 0.5 + 0.5 * Math.sin(S.g.t * (A.lock ? 14 : 6));
        Q.quad(124, X0, Y0, R * 1.15, 0, 0, R * 1.15, UNDER, (0.28 + 0.2 * hot) * e, 0.85, 0.12, 0); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.gold, (0.5 + 0.3 * pul + 0.2 * hot) * e, 0.8, 1.6, 0.8 + 0.6 * hot); Q.glow(X0, Y0, R * (0.5 + 0.4 * hot), COL.hot, (0.1 + 0.25 * hot) * e); }
      if (A.volc && A.t > A.t4 && A.t < A.volc + 0.15) { const R = TUNE.volcR * T, k = sstep(A.t4, A.volc, A.t), e = 1 - sstep(A.volc, A.volc + 0.15, A.t), pul = 0.5 + 0.5 * Math.sin(S.g.t * (8 + 10 * k));
        Q.quad(124, X0, Y0, R * 1.1, 0, 0, R * 1.1, UNDER, 0.25 * e, 0.88, 0.1, 0); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.ember, (0.4 + 0.3 * pul) * e * (0.5 + 0.5 * k), 0.8, -1.2, 0.9 + 0.5 * k); } }
    // the last charge's volcanic end (phase III): its reach lit at the lane's end
    for (const L of S.lanes) if (L.volc && L.end < 0) { const k = cl(L.t / L.tell), X0 = sx(L.x0 + L.ux * (L.len - 0.4)), Y0 = sy(L.y0 + L.uy * (L.len - 0.4)), R = TUNE.volcR * T; Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.ember, (0.3 + 0.35 * k) * sstep(0, 0.3, L.t), 0.8, 1, 0.8); }
    // the cross's mark: two crossing filaments of light on the pet's place, brightening to the detonation
    for (const k2 of S.marks) { if (k2.done) continue; const u = cl(k2.t / k2.tell), X0 = sx(k2.x), Y0 = sy(k2.y), R = k2.R * T, e = sstep(0, 0.2, k2.t), pul = 0.5 + 0.5 * Math.sin(S.g.t * (8 + 12 * u));
      Q.quad(124, X0, Y0, R * 1.1, 0, 0, R * 1.1, UNDER, 0.3 * e, 0.85, 0.12, 0);
      for (const an of [Math.PI / 4, -Math.PI / 4]) { const dx = Math.cos(an) * R, dy = Math.sin(an) * R; Q.rbeam(X0 - dx, Y0 - dy, X0 + dx, Y0 + dy, T * (0.14 + 0.1 * u), COL.gold, (0.45 + 0.4 * u) * e, 0.3, 0.3); Q.rbeam(X0 - dx, Y0 - dy, X0 + dx, Y0 + dy, T * 0.5, COL.ember, (0.12 + 0.2 * u) * e, 0.2, 0.2); }
      Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.gold, (0.35 + 0.35 * pul * u) * e, 0.8, 2, 0.7); }
    // burning ground: molten, cooling
    for (const q of S.trails) { const fade = sstep(0, 0.2, q.t) * (1 - sstep(q.life - 0.8, q.life, q.t)), X0 = sx(q.x), Y0 = sy(q.y), R = q.r * T; if (fade > 0.01) { Q.glow(X0, Y0, R * 1.3, COL.ember, 0.28 * fade); if (!lowFx()) Q.fire(X0, Y0 - R * 0.2, R * 0.75, 0.9, 0.55 * fade, q.seed, 0.6); } }
    // the spires' lee while a ring rolls: a band of pale light behind each (glow only)
    if (S.waves.some(w => w.cover && !w.hit)) { const w = S.waves.find(q => q.cover && !q.hit); for (const sp of S.spires) { if (sp.dud) continue; const dx = sp.x - w.x, dy = sp.y - w.y, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d; Q.beam(sx(sp.x + ux * 0.5), sy(sp.y + uy * 0.5), sx(sp.x + ux * 2.6), sy(sp.y + uy * 2.6), T * 0.45, COL.cool, 0.16); } }
    // the vent: the pale arc of the heart's reach on the floor before it
    if (S.vent) { const V = S.vent, e = sstep(0, 0.3, V.t) * (1 - sstep(V.dur - 0.3, V.dur, V.t)), X0 = sx(S.m.x), Y0 = sy(S.m.y), R = (S.m.r + 2.2) * T, pul = 0.5 + 0.5 * Math.sin(S.g.t * 5);
      const p = frontOf(S.m.r + 1.4), P0 = sx(p.x), P1 = sy(p.y); void X0; void Y0; void R;
      Q.glow(P0, P1, T * 2.2, COL.pale, (0.16 + 0.1 * pul) * e); Q.quad(192, P0, P1, T * 1.5 / 0.8, 0, 0, T * 1.5 / 0.8, COL.pale, (0.45 + 0.25 * pul) * e, 0.8, 0.8, 0.7); Q.glow(sx(frontOf(geo().heart).x), sy(frontOf(geo().heart).y), T * 1.4, COL.pale, (0.12 + 0.12 * pul + 0.3 * S.heartT / 0.35) * e); }
    // the Wrath's refuges: pools of cool light (behind the horn monument; the cooled channels), brightening toward the impact
    if (S.wr) refugeGround(Q, T);
    // the intro's sigil warmth
    if (S.mode === 'intro') { const e = S.introT, fade = 1 - sstep(4.4, 5.8, e); if (fade > 0.01) Q.glow(sx(B.x), sy(B.y), T * 4.6, COL.ember, 0.16 * fade); }
    fgClose(c);
    wavesGround(c, T);
  }
  function laneGround(Q, L, T) {
    const A = L.A, fade = L.end >= 0 ? 1 - cl((L.t - L.end) / 0.7) : 1; if (fade <= 0.01) return;
    const from = L.end < 0 && A.go && L.prog != null ? Math.max(0, L.prog - 0.5) : 0, x0 = sx(L.x0 + L.ux * from), y0 = sy(L.y0 + L.uy * from), x1 = sx(L.x0 + L.ux * L.len), y1 = sy(L.y0 + L.uy * L.len);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hx = (x1 - x0) / 2, hy = (y1 - y0) / 2, hl = Math.hypot(hx, hy) || 1, w = L.w * 0.5 * T, nx = -hy / hl * w, ny = hx / hl * w;
    const k = cl(L.t / L.tell), in0 = sstep(0, 0.25, L.t), pul = 0.5 + 0.5 * Math.sin(S.g.t * 12 + L.seed), live = L.end < 0 ? 1 : 0.6;
    Q.quad(144, mx, my, hx, hy, nx * 1.5, ny * 1.5, UNDER, (0.4 + 0.25 * k) * in0 * fade);
    Q.quad(128, mx, my, hx, hy, nx * 0.9, ny * 0.9, COL.ember, (0.3 + 0.3 * k) * in0 * fade * live, 3 + k * 6, L.seed + 7);
    Q.quad(128, mx, my, hx, hy, nx * 0.6, ny * 0.6, COL.gold, (0.45 + 0.4 * k + 0.12 * pul * k) * in0 * fade * live, 5 + k * 10, L.seed + 3);
    for (const s of [1, -1]) { Q.rbeam(x0 + nx * s, y0 + ny * s, x1 + nx * s, y1 + ny * s, T * (0.22 + 0.1 * k), COL.ember, (0.18 + 0.2 * k) * in0 * fade * live, 1, 1); Q.rbeam(x0 + nx * s, y0 + ny * s, x1 + nx * s, y1 + ny * s, T * (0.06 + 0.04 * k), COL.pale, (0.5 + 0.45 * sstep(0.3, 1, k)) * in0 * fade * live, 1, 1); }
    if (L.end < 0 && !A.go) { const fx = x0 + (x1 - x0) * k, fy = y0 + (y1 - y0) * k; Q.rbeam(x0, y0, fx, fy, T * 0.2, COL.gold, 0.55 * in0, 0, 1); Q.glow(fx, fy, T * 0.9, COL.pale, 0.45 * in0); Q.glow(x1, y1, T * 1.2, COL.ember, 0.25 * k * in0); }
  }
  // a fan's tell: a filament of light along each crescent's path (the gap's path left dark), drawn out from its brow as it gathers
  function fanGround(Q, V, T) {
    const k = cl(V.t / V.tell), fade = V.fired ? 1 - cl((V.t - V.tell) / 0.3) : V.dead ? 1 - cl((V.fadeT || 0) / 0.4) : 1; if (fade < 0.01) return; const e = sstep(0, 0.15, V.t) * fade, X0 = sx(V.x), Y0 = sy(V.y);
    for (const s of V.slots) { if (s.gap) continue; const L = s.len * (0.35 + 0.65 * eout(k)), x1 = sx(V.x + s.ux * L), y1 = sy(V.y + s.uy * L), hx = (x1 - X0) / 2, hy = (y1 - Y0) / 2, hl = Math.hypot(hx, hy) || 1, nx = -hy / hl * T * TUNE.pdHalf, ny = hx / hl * T * TUNE.pdHalf;
      Q.quad(144, X0 + hx, Y0 + hy, hx, hy, nx * 0.9, ny * 0.9, UNDER, 0.28 * e);
      Q.rbeam(X0, Y0, x1, y1, T * (0.08 + 0.06 * k), COL.gold, (0.35 + 0.5 * k) * e, 0.2, 1); Q.rbeam(X0, Y0, x1, y1, T * 0.45, COL.ember, (0.08 + 0.16 * k) * e, 0.2, 1); Q.glow(x1, y1, T * 0.6, COL.hot, 0.25 * k * e); }
    Q.glow(X0, Y0, T * 1.1, COL.hot, (0.2 + 0.3 * k) * e);
  }
  function refugeGround(Q, T) {
    const J = S.wr, UT = UTo(), t = J.t, on = sstep(0.4, 1.6, t) * (1 - sstep(UT.hit + 0.3, UT.hit + 1.2, t)), hot = sstep(UT.hit - 2.0, UT.hit, t); if (on < 0.01) return;
    for (const r of J.refs) { const X0 = sx(r.x), Y0 = sy(r.y), R = TUNE.refR * T, pul = 0.5 + 0.5 * Math.sin(t * 5 + r.x);
      Q.glow(X0, Y0, R * 2.0, COL.steel, (0.3 + 0.3 * hot) * on); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.cool, (0.75 + 0.25 * pul) * on, 0.8, 0.6, 1 + 0.6 * hot); Q.glow(X0, Y0, R * 0.9, '#FFFFFF', (0.16 + 0.3 * hot) * on);
    }
  }
  // the rings: Samael's ring of crimson energy rolling out, then (a second batch, laid over it) the dark gaps cut in it, and their cool glints
  function wavesGround(c, T) {
    const live = S.waves.filter(w => w.t < w.dur + 0.45); if (!live.length) return;
    let Q = fgOpen(c);
    for (const w of live) { const u = cl(w.t / w.dur), rw = (w.r0 || 0) + (w.R - (w.r0 || 0)) * (w.tag === 'charge' || w.tag === 'show' ? eout(u) : u), fade = 1 - sstep(0.85, 1 + 0.45 / w.dur, w.t / w.dur), X0 = sx(w.x), Y0 = sy(w.y), R = rw * T;
      if (R > 2 && fade > 0.01) { Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, UNDER, 0.78 * fade * (w.vis || 1), 0, TAU * 0.999, Math.min(0.24, 0.9 / Math.max(0.5, rw))); Q.ring(X0, Y0, R, COL.white, 0.95 * fade * (w.vis || 1), T * 0.13);   // (a dark band under its front, a white-hot edge: it reads over the altar's own rings)
        Q.quad(311, X0, Y0, R / 0.85, 0, 0, R / 0.85, COL.ember, 1, 0.85, w.x * 7 + w.y, 1.3 * fade * (w.vis || 1)); Q.quad(196, X0, Y0, R / 0.95, 0, 0, R / 0.95, COL.hot, 0.55 * fade * (w.vis || 1), 0.95, w.x * 3 + w.y, 0.9 * fade); } }
    fgClose(c);
    if (!live.some(w => w.gaps && w.gaps.length)) return;
    Q = fgOpen(c);
    for (const w of live) { if (!w.gaps || !w.gaps.length) continue; const u = cl(w.t / w.dur), rw = (w.r0 || 0) + (w.R - (w.r0 || 0)) * u, R = rw * T, fade = 1 - sstep(0.85, 1 + 0.45 / w.dur, w.t / w.dur); if (R < 4 || fade < 0.01) continue;
      const th = Math.min(0.3, 0.95 / Math.max(0.5, rw)), X0 = sx(w.x), Y0 = sy(w.y);
      for (const g2 of w.gaps) Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, UNDER, 0.92 * fade, g2.a + g2.w * 0.62, g2.w * 1.24, th); }
    fgClose(c);
    Q = fgOpen(c);
    for (const w of live) { if (!w.gaps || !w.gaps.length) continue; const u = cl(w.t / w.dur), rw = (w.r0 || 0) + (w.R - (w.r0 || 0)) * u, fade = 1 - sstep(0.85, 1, u); if (rw < 0.8 || fade < 0.01) continue;
      for (const g2 of w.gaps) { const x = w.x + Math.cos(g2.a) * rw, y = w.y + Math.sin(g2.a) * rw; Q.glow(sx(x), sy(y), T * 0.55, COL.cool, 0.3 * fade); } }
    fgClose(c);
  }
  function drawGround2d(c) {
    const T = Tz(); c.save(); c.globalCompositeOperation = 'lighter';
    for (const L of S.lanes) { if (L.end >= 0) continue; const k = cl(L.t / L.tell); softRay(c, sx(L.x0), sy(L.y0), sx(L.x0 + L.ux * L.len), sy(L.y0 + L.uy * L.len), T * L.w, COL.gold, 0.2 + 0.35 * k); }
    for (const V of S.vols) { if (V.fired || V.dead) continue; const k = cl(V.t / V.tell); for (const s of V.slots) if (!s.gap) softRay(c, sx(V.x), sy(V.y), sx(V.x + s.ux * s.len), sy(V.y + s.uy * s.len), T * TUNE.pdHalf * 1.4, COL.gold, 0.12 + 0.3 * k); }
    for (const cr of S.cres) { const R = T * TUNE.pdHalf * 1.2; c.globalAlpha = 0.6; blitSized(c, glowSprite(COL.ember), sx(cr.x) - R, sy(cr.y) - R, R * 2, R * 2); }
    if (S.over > 0) { const R = TUNE.ovR * T; c.globalAlpha = 0.35; blitSized(c, shockSprite(COL.ember), sx(S.m.x) - R, sy(S.m.y) - R, R * 2, R * 2); }
    for (const A of S.acts) if (A.kind === 'impact' && A.t < A.t4 + 0.2) { const R = TUNE.imR * T; c.globalAlpha = 0.5; blitSized(c, shockSprite(COL.gold), sx(A.tx) - R, sy(A.ty) - R, R * 2, R * 2); }
    for (const k2 of S.marks) if (!k2.done) { const R = k2.R * T; c.globalAlpha = 0.5; blitSized(c, glowSprite(COL.gold), sx(k2.x) - R, sy(k2.y) - R, R * 2, R * 2); }
    for (const q of S.trails) { const R = q.r * T * 1.3; c.globalAlpha = 0.4 * (1 - cl(q.t / q.life)); blitSized(c, glowSprite(COL.ember), sx(q.x) - R, sy(q.y) - R, R * 2, R * 2); }
    for (const sp of S.spires) if (!sp.dud) { const R = sp.r * T * 1.6; c.globalAlpha = 0.5; blitSized(c, glowSprite(COL.ember), sx(sp.x) - R, sy(sp.y) - R * 1.4, R * 2, R * 2); }
    for (const w of S.waves) { const u = cl(w.t / w.dur), R = ((w.r0 || 0) + (w.R - (w.r0 || 0)) * u) * T; if (R > 2) { c.globalAlpha = 0.45 * (1 - u); blitSized(c, shockSprite(COL.ember), sx(w.x) - R, sy(w.y) - R, R * 2, R * 2); } }
    if (S.wr) for (const r of S.wr.refs) { const R = TUNE.refR * T * 1.4; c.globalAlpha = 0.75; blitSized(c, glowSprite(COL.cool), sx(r.x) - R, sy(r.y) - R, R * 2, R * 2); }
    c.restore();
    // (the rings' gaps: soft dark arcs laid over them, feathered in three passes)
    c.save(); c.lineCap = 'butt'; for (const w of S.waves) { if (!w.gaps || !w.gaps.length) continue; const u = cl(w.t / w.dur), rw = ((w.r0 || 0) + (w.R - (w.r0 || 0)) * u) * T; if (rw < 4) continue;
      for (const g2 of w.gaps) for (const [lw, a] of [[T * 1.3, 0.25], [T * 0.9, 0.35], [T * 0.5, 0.45]]) { c.strokeStyle = `rgba(20,6,8,${a * (1 - u * 0.5)})`; c.lineWidth = lw; c.beginPath(); c.arc(sx(w.x), sy(w.y), rw, g2.a - g2.w / 2, g2.a + g2.w / 2); c.stroke(); } } c.restore();
  }
  /* the body: its aura, the model (GPU, or the Aries Anima's existing art), the light over it, the bared heart's glint */
  function drawBodyLayer(c) {
    const B = S.B, T = Tz(), X0 = sx(B.x), Y0 = sy(B.y) - (B.z || 0) * T, size = T * TUNE.size, al = B.alpha; if (!(al > 0.01) || !B.smP) return;
    const dis = B.smP.dis || 0;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.18 + 0.05 * Math.sin(B.at * 1.6) + (S.cata > 0 ? 0.08 : 0)) * al * (1 - dis); const gs = size * 0.6; blitSized(c, glowSprite(S.cata > 0 ? COL.hot : COL.ember), X0 - gs, Y0 - size * 0.45 - gs, gs * 2, gs * 2); c.restore();
    const fk = Math.cos(B.yaw) >= 0 ? 1 : -1;
    c.save(); try { AnimaArt.draw(c, 'aries', 3, X0, Y0, size, B.at, { inst: B, alpha: al, aura: false, fk, flip: fk < 0, mv: B.smP.mv, ph: B.ph }); } finally { c.restore(); }
    { const st2 = B.smOut && B.smOut.r && B.smOut.r.steps; if (st2 && st2.length) S.steps = (S.steps || []).concat(st2).slice(-8); }   // (the model's own settling and landing steps: a puff of dust each, next frame)
    const r = B.smOut && B.smOut.r;
    if (S.inst && r && gpu()) try { S.inst.bodyLight(c, r, B.smP, al * (1 - dis * 0.8), B.at); } catch (e) {}
    // the bared heart (a vent), and the reactor that lingers last as it dissolves
    if (r && gpu() && (S.vent || (S.mode === 'dead' && dis > 0.5))) { const Q = fgOpen(c), pul = 0.5 + 0.5 * Math.sin(S.g.t * 6), k = S.vent ? sstep(0, 0.3, S.vent.t) * (1 - sstep(S.vent.dur - 0.3, S.vent.dur, S.vent.t)) : (1 - sstep(0.85, 1, dis)) * sstep(0.5, 0.8, dis);
      Q.glow(r.core[0], r.core[1], r.unit * (2.4 + 1.2 * pul + (S.heartT > 0 ? 1.6 : 0)), COL.pale, (0.25 + 0.15 * pul + (S.heartT > 0 ? 0.3 : 0)) * k); Q.star(r.core[0], r.core[1], r.unit * (1.2 + 0.6 * pul), 0.6 * k, COL.white); fgClose(c); }
    if (S.m.flash > 0 && S.mode === 'fight') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16; const s2 = size * 0.4; blitSized(c, glowSprite('#FFFFFF'), X0 - s2, Y0 - size * 0.45 - s2, s2 * 2, s2 * 2); c.restore(); }
  }
  /* the sky: the Anima's own effects (sparks, rock, domes, fireballs, crescents, the charge's streak, the hang's corona, the Wrath's
     sigils, trail and shock), the refuges' columns of light, the Cataclysm's heat over it */
  function drawSkyLayer(c) {
    const T = Tz(), on = gpu(), B = S.B, UT = UTo();
    if (S.inst) try { S.inst.drawFx(c); } catch (e) {}
    if (!on) return;
    const Q = fgOpen(c);
    if (S.wr) { const J = S.wr, t = J.t, on2 = sstep(0.6, 1.8, t) * (1 - sstep(UT.hit + 0.3, UT.hit + 1.2, t)), hot = sstep(UT.hit - 2.0, UT.hit, t);
      if (on2 > 0.01) for (const r of J.refs) { const px = sx(r.x), py = sy(r.y); Q.shafts(px, py - T * 6, px, py, T * TUNE.refR * 0.9, COL.cool, (0.4 + 0.35 * hot) * on2, r.x * 10);
        for (let i = 0; i < 3 * LQ(); i++) { const v = (t * 0.4 + i / 3) % 1; Q.star(px + Math.sin(i * 2.1 + t) * T * TUNE.refR * 0.6, py - v * T * 3, T * 0.12, on2 * (1 - v), COL.white); } } }
    if (S.cata > 0 && S.mode === 'fight' && !lowFx()) { const r = B.smOut && B.smOut.r; if (r) Q.shimmer(r.core[0], r.core[1] - r.unit * 2, r.unit * 6, 0.22, 1, '#FFB070'); }
    fgClose(c);
  }

  /* ---- the health bars (in the HUD's place, 20b: m.ownBar): one stacked bar of TUNE.bars, its count, the phase pips; the Ruin gauge under it ---- */
  function drawBar(c, W) {
    if (!S || S.mode === 'over') return; const m = S.m; if (m.dead && S.mode !== 'dead') return;
    const left = Math.max(0, S.mode === 'dead' ? 0 : realHp()), bar = S.barHP, n = Math.max(0, Math.ceil(left / bar - 1e-9)), cur = n ? (left - (n - 1) * bar) / bar : 0;
    S.barShow = S.barShow == null ? n - 1 + cur : S.barShow + ((n - 1 + cur) - S.barShow) * 0.06; if (Math.abs(S.barShow - (n - 1 + cur)) > 1.2) S.barShow = n - 1 + cur;
    const bw = Math.min(150, W * 0.38), x0 = W - 12 - bw, by = 10 + Math.min(88, W * 0.24) + 14, cols = ['#FF8A3D', '#FFB15A', '#FFC24D', '#E89A50', '#FFD9A0', '#C98A4A', '#FFE6C8', '#FFA060'];
    c.save(); c.globalAlpha = 0.92;
    GFX.labelS(c, 'Samael, The First Cataclysm', x0 + bw, by - 11, 8, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    for (let i = 0; i < 3; i++) { const px = x0 + bw - 26 - (2 - i) * 8, onP = i < S.phase; c.fillStyle = onP ? COL.hot : 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(px, by - 3.5); c.lineTo(px + 3, by); c.lineTo(px, by + 3.5); c.lineTo(px - 3, by); c.closePath(); c.fill(); }
    const bh = 5, yb = by + 7, ci = Math.max(0, n - 1), under = n > 1 ? cols[(ci - 1) % cols.length] : null, colNow = cols[ci % cols.length];
    c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, x0 - 1, yb - 1, bw + 2, bh + 2, 4); c.fill();
    if (under) { c.fillStyle = hexA(under, 0.6); GFX.rr(c, x0, yb, bw, bh, 3); c.fill(); }
    const showCur = cl(S.barShow - ci); if (showCur > cur) { c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, x0, yb, Math.max(6, bw * showCur), bh, 3); c.fill(); }
    if (cur > 0) { const gr = c.createLinearGradient(x0, 0, x0 + bw, 0); gr.addColorStop(0, shadeC(colNow, -0.25)); gr.addColorStop(1, colNow); c.fillStyle = gr; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh * 0.4, 2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 5; i++) c.fillRect(x0 + bw * i / 5, yb + 1, 1, bh - 2);
    if (S.pad) { c.globalAlpha = 0.5 + 0.3 * Math.sin(S.g.t * 6); c.strokeStyle = COL.pale; c.lineWidth = 1.2; GFX.rr(c, x0 - 1.5, yb - 1.5, bw + 3, bh + 3, 4); c.stroke(); c.globalAlpha = 0.92; }
    GFX.labelS(c, `×${n}`, x0 + bw, by, 9, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    // the Ruin gauge: ember filling to white-hot; flashing in the Cataclysm; a pale edge while the heart is bared
    const ry = yb + bh + 5, rh = 3, k = S.cata > 0 ? 1 : cl(S.ruin / TUNE.ruinMax);
    GFX.labelS(c, S.cata > 0 ? 'CATACLYSM' : 'RUIN', x0 - 4, ry + 1.5, 6.5, 900, S.cata > 0 ? COL.white : '#FFB08A', 'rgba(0,0,0,.7)', 2.5, 'right');
    c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, x0 - 1, ry - 1, bw + 2, rh + 2, 2.5); c.fill();
    if (k > 0) { const gr = c.createLinearGradient(x0, 0, x0 + bw, 0); gr.addColorStop(0, '#D8701E'); gr.addColorStop(0.7, COL.ember); gr.addColorStop(1, COL.white); c.fillStyle = S.cata > 0 && Math.floor(S.g.t * 8) % 2 ? COL.white : gr; GFX.rr(c, x0, ry, Math.max(3, bw * k), rh, 1.5); c.fill(); }
    if (S.vent) { c.globalAlpha = 0.55 + 0.35 * Math.sin(S.g.t * 7); c.strokeStyle = COL.pale; c.lineWidth = 1; GFX.rr(c, x0 - 1.5, ry - 1.5, bw + 3, rh + 3, 2.5); c.stroke(); }
    c.restore();
  }
  const hexA = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };

  /* ---- for the harness ---- */
  const test = {
    get S() { return S; }, AR, start, abortActs, phaseUp, startWrath, cataclysm, startVent, gain, fall, refugesFor, realHp: () => (S ? realHp() : 0),
    hold(on) { if (S) S.noAI = !!on; },
    force(kind) { if (!S || S.mode !== 'fight') return null; abortActs(); if (S.vent) endVent(); S.ventQ = 0; S.idleT = 99; if (kind === 'wrath') { startWrath(); return S.wr; } if (kind === 'vent') { startVent(TUNE.ventOver); return S.vent; } return start(kind); },
    skipIntro() { if (!S || S.mode !== 'intro') return; S.introT = TUNE.intro - 0.01; },
  };
  // (the gate asks these: 20zza forwards its update, ground, over, camera, goal, HUD and boss death to them while the fight is on)
  const cam = () => (S && S.mode !== 'over' ? camOf() : null), goal = () => (S ? goalText() : ''), hideHud = () => false, onBossDeath = mm => !!(S && mm === S.m && (fall(false), true));
  return { begin, active, stop, update, drawGround() {}, drawOver() {}, cam, goal, hideHud, onBossDeath, TUNE, test };
})();
if (typeof self !== 'undefined') self.ARIES_BOSS = ARIES_BOSS;
