/* ---------- (v429 TB) The Gate of Taurus's guardian: BELIAL, THE WORLD PILLAR, as a boss ----------
   Beyond the Star Vault's great door (20q, the Court of the World Pillar and its door are the gate's), the Taurus Anima itself
   turned against the pet: the same model and art (BELIAL_GL, 02f4, posed every frame; its cel model, 02f2, where the GPU is not)
   and the same powers' pictures and poses, called into rather than copied (20g3-belial-moves.js: BELIAL_MOVES.poseFor / easePose
   / ultPose for every pose, a private BELIAL_MOVES.create instance for its effect layer, inst.bodyLight for the light over the
   body, inst.drawDominion and inst.domParts for Dominion of the World Pillar; its FGFX kinds 192-201, its GLM pillars, rocks and
   rings), aimed at the pet. A colossus: heavy, deliberate, every front footfall a light shake of the camera.
     Thronebreaker Rush  it lowers its head, its horns spin up and gold rings rise round its shoulders while a lane of light runs
                         out ahead of it to the court's rim (the tell: a soft dark band, gold rails, a light filling it toward
                         the launch); then it charges down that lane. Struck in the lane: a heavy blow, shoved aside; at its
                         end the horns are thrust into the ground (a blow in front of it) and, from phase II, a shockwave.
                         Step out of the lane, or roll through it. Phase III charges twice.
     Crown of Burdens    it raises its head and rings leave its horns: a field of gravity opens round the pet (drawn out from
                         its middle: the tell), then rings come down over it: inside, the pet is slowed, pulled toward the
                         middle and pressed (ticks); at the end the field collapses in its core. Walk or roll out.
     Citadel Carapace    it plants its legs and the citadel on its back unfolds into a barrier: blows soak into it (its pool
                         shown over the health bar), every one STORED; the pale ring of its reach on the floor grows with what
                         it holds. Broken: the stored force scatters, it staggers, open (x1.5 damage, the engine's stunned
                         boss). Unbroken when the stance ends: the stored force is released as a retaliation wave scaled by it.
                         Break it, or stop and back off beyond the ring.
     Graviton Stampede   it rears and stamps (3 / 4 / 5 by phase), each front foot's contact a pressure ring across the floor
                         (its reach a gold ring on the floor from the first rear-up); rocks rise under the pet, hang over a
                         ring of light, and are slammed down. Stand beyond the reach or roll each ring; step off the rings.
     Tail anchor         stand close for long and the floor round it lights (a crescent of light running round it), then the
                         tail's anchor sweeps round as it pivots: a heavy punish with knockback.
     Dominion of the     at each phase break and once more near death: it plants, the Taurus sigil opens under it and World
     World Pillar        Pillars rise round it; the field gathers and compresses; the slam. Behind each pillar (away from
                         Belial) a pool of warm light marks its lee: stand in one at the slam. Outside, a crushing blow (a share
                         of the pet's health, never lethal from full). It cannot be harmed while it calls Dominion.
   Three phases (I The Immovable 100-66%, II The Weight of Heaven 66-33%, III The Fall of the Citadel 33-0%): quicker powers,
   more stomps and rocks; phase III charges twice and runs two powers at once. Every number is in TUNE (below, with how it was
   set against Calyx Astrum). Tells are glow only: lanes, rings, fields and pools of light over soft dark underlays; no red, no
   numbers.
   The engine's machinery as Abaddon's (20o2): a boss intro (the Taurus sigil, pillars, the assembly from the hooves to the
   horns, the roar, the name banner "BELIAL" / "The World Pillar", the camera on it), stacked health bars with phase pips
   (m.ownBar, 20b), phases with banners and orbs, healing light shaken loose by blows, the boss immunities (m.boss, m.still,
   m.fiend: never lifted, frozen, knocked back or feared), a defeat cinematic (it staggers, the citadel crumbles, it dissolves
   into gold dust) and then X.winStage(), which completes the gate and wakes the Taurus Anima (21b's gateFinish).
   TAURUS_BOSS: begin(X, H, self, A) (the gate calls it as the court's door seals: A = { cx, cy, r, rx, ry, ax0, ay0, ax1, ay1,
   door }; the walkable floor a rounded square |dx/rx|^2.6 + |dy/ry|^2.6 <= 1), update(dt), drawGround(c) / drawOver(c) (nothing:
   the body, its ground and its sky are the gate's own objects, H.obj, drawn in depth order with the World Pillars), cam(),
   goal(), hideHud(), onBossDeath(m), active(), stop() (every bit of clean-up: the gate's teardown, the game's destroy, the next
   stage, BEL.onRelease), TUNE, test (the harness's handles).
   Clean-up (stop, the defeat, the pet's death, the stage's end): no slow left on the pet, no shield on its health, the camera's
   hold given back, its objects off the stage, its effect layer stopped and Belial's GPU buffers freed (BELIAL_GL.release). */
const TAURUS_BOSS = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const LQ = () => (lowFx() ? 0.5 : 1);
  const COL = { gold: '#FFC24D', amber: '#FF9A2E', pale: '#FFE9A8', white: '#FFF6E0', dust: '#9A8264', stone: '#6A5E50', ivory: '#F2E8D2' };
  const UNDER = '#170C1C', LEE = '#FFF1C8';   // (the tells' soft dark underlay, FGFX 124/144/145; the World Pillars' lee: warm ivory light)
  /* ================= the tuning =================
     Against Calyx Astrum (20x, the Garden of Unborn Stars' last boss, Rift 02: 752143 health, no armour), measured the same way for
     both by tests/_tb-tune.js (as tests/_cb-tune.js measured Uldroth against Abaddon): a level-30 bot pet held still at 4 and at 6
     tiles south of the boss (never dodging, never sheltering), 300 raw damage every 0.25 s into the boss (1200 a second, D.hitMon,
     no crits), the game stepped at 1/30 s, to the kill.
     (Belial holds a court 22 x 16 tiles: when the spot DIST tiles south of it is off the floor, the pet is held DIST tiles away at the
     nearest bearing round from south that is on it; Calyx's arena, radius 15, needs no such turn.)
     Calyx (7 runs, one outlier left out: 289 s at 4 tiles, its cause not traced): 628 s to kill at 4 tiles (3 runs), 534-619 at 6
     (3 runs, mean ~573): no armour, so a steady pet takes it down in its health's time; 1532-2009 damage a minute at 4 tiles (mean ~1740,
     mean blow ~75, max 124), 940-1065 at 6 (mean ~1000, mean blow ~86).
     Belial (these numbers): 714 s at 4 tiles, 732 at 6 (pooled 1.20x Calyx); 2199 a minute at 4 tiles (1.26x: its tail and its
     stomps punish a pet that stays under it; mean blow 75, max 137) and 1166 at 6 (1.17x: the charge, the Crown and the rocks reach
     there); pooled 1.23x. Its shelter blow (Dominion, domK of the pet's health: 330 at level 30) comes three times a fight, heavy but
     never lethal from full health. A unit blow is 105 (a level-30 pet has 440 health): the charge 158, the tail 137, a stomp's ring 84,
     a rock 68, the Crown's ticks 26 and its collapse 95, the retaliation 95-208 by its charge. */
  const TUNE = {
    hp: 768000, bars: 12,          // its health, absolute (TUNE.hp in TUNE.bars bars)
    dmg: 105,                      // a unit blow, absolute (m.dmg); every power's blow is a multiple of it
    cuts: [1, 0.66, 0.33], desp: 0.12,   // the phases' thresholds (of its health); the last Dominion
    size: 5.8, r: 1.9, keep: 4.2, spd: [1.0, 1.15, 1.3], pad: 3.1,   // drawn size (tiles tall), body radius, the distance it keeps from the pet, its heavy walk (tiles/s), its distance from the rim
    homeY: -1.0, lean: 0.3, leanMax: 1.5,   // it holds its court: its place (tiles north of the court's heart), and how far it leans toward the pet (a share of the pet's distance, at most)
    intro: 5.6, death: 5.6,        // the intro and the fall (s)
    idle: [1.7, 1.45, 1.2],         // the breath between powers, by phase
    refDps: 150,                   // the damage a second it expects from the pet: the floor of its reading of the pet's own (S.dps, an
                                   // average over ~10 s of what the pet deals), which sizes the Carapace's pool and its retaliation
    heal: 0.045, healCd: 1.1,      // healing light shaken loose: an orb every this share of a bar dealt (as 20h's fiends)
    // Thronebreaker Rush: the wind-up (the lane's tell), charge speed (tiles/s), lane width, blows (x m.dmg: the lane, the horn thrust at its
    // end within rushEndR), the shockwave from phase II (radius by phase, blow), charges by phase, the recovery, the longest lane
    rushWind: [1.2, 1.05, 0.95], rushSpd: 7.5, rushW: 2.3, rushK: 1.5, rushEndK: 1.15, rushEndR: 2.3, rushShockR: [0, 3.6, 4.0], rushShockK: 0.7, rushN: [1, 1, 2], rushRec: 0.75, rushMax: 15, rushMin: 3,
    // Crown of Burdens: field radius, the opening (tell), how long it holds, pull speed (tiles/s; the pet walks 4.3), the slow (x speed), tick (s) and blow, the core's collapse; fields by phase
    crR: [3.0, 3.3, 3.6], crOpen: [1.0, 0.9, 0.8], crDur: [3.2, 3.5, 3.8], crPull: [1.3, 1.5, 1.7], crSlow: 0.55, crTick: 0.55, crK: 0.25, crCore: 1.8, crEndK: 0.9, crN: [1, 1, 2],
    // Citadel Carapace: its pool (seconds of the pet's own damage), how long it holds, the stagger when broken; its retaliation: the reach grows from
    // carR0 to carRmax tiles and the blow (x m.dmg) from carK to carK x (1 + carCap) as it fills (carFill seconds of the pet's own damage stored)
    carSec: [4.0, 4.5, 5.0], carDur: 5.5, carStag: 3.0, carR0: 3.6, carRmax: 7.2, carK: 0.9, carCap: 1.2, carFill: 3.0,
    // Graviton Stampede: stomps, the gap between them, the pressure ring's reach (from the foot), its blow, the distance past which it advances on the pet as it stamps;
    // rocks a stomp (every other stomp), their hang, blow, radius
    stN: [3, 4, 5], stGap: [0.75, 0.68, 0.6], stR: [4.6, 5.0, 5.4], stK: 0.8, stAdv: 4.6, stRocks: [2, 2, 3], rockHang: [0.95, 0.85, 0.75], rockK: 0.65, rockR: 1.15,
    // the tail anchor's sweep: its reach (from its middle), the tell, the blow, how long the pet stays close first, its cooldown
    swR: 4.4, swTell: [0.75, 0.65, 0.55], swK: 1.3, swNear: 2.0, swCd: 9,
    // Dominion of the World Pillar: its timeline (s; knots matched to the Anima's own, BELIAL_MOVES.UT: the Silence of Weight, the
    // World Pillars, the Weight of Heaven, the slam, the second pulse, the Fall, the end), pillars by call (phase II, III, the last),
    // their ring's radius round it, the lee (a pool leeD behind each pillar, radius leeR), the blow outside (a share of the pet's
    // health: never lethal from full), the window the blow holds
    domT: [0, 1.3, 2.9, 5.0, 6.6, 7.25, 8.2, 9.8], domN: [6, 5, 4], domR: [4.6, 5.8], leeD: 1.5, leeR: 1.25, domK: 0.75, domWin: 0.5,
  };
  const PH_NAMES = ['The Immovable', 'The Weight of Heaven', 'The Fall of the Citadel'];
  const CYC = { 1: ['rush', 'crown', 'stamp', 'car', 'rush', 'stamp'], 2: ['rush', 'crown', 'stamp', 'car', 'rush', 'crown', 'stamp'], 3: ['rush', 'crown+stamp', 'car', 'rush', 'stamp+crown'] };
  let S = null;   // the fight in progress
  const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
  const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
  const GLB = () => (typeof BELIAL_GL !== 'undefined' ? BELIAL_GL : null);
  const glOn = () => { const G = GLB(); try { return !!(G && G.usable()); } catch (e) { return false; } };
  const MV = () => (typeof BELIAL_MOVES !== 'undefined' ? BELIAL_MOVES : null);
  const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
  const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (S) stop(); S = null; }); } catch (e) { /* (no Belfry hook) */ }

  /* ================= the court: a rounded square (|dx/rx|^2.6 + |dy/ry|^2.6 <= 1) ================= */
  const AR = { cx: 16.5, cy: 12.5, rx: 10.7, ry: 7.5, n: 2.6, door: null };
  const seN = (u, v) => Math.pow(Math.abs(u), AR.n) + Math.pow(Math.abs(v), AR.n);
  const inA = (x, y, pad) => { const rx = Math.max(0.5, AR.rx - (pad || 0)), ry = Math.max(0.5, AR.ry - (pad || 0)); return seN((x - AR.cx) / rx, (y - AR.cy) / ry) < 1; };
  const clampA = (x, y, pad) => { const rx = Math.max(0.8, AR.rx - (pad || 0)), ry = Math.max(0.8, AR.ry - (pad || 0)), dx = x - AR.cx, dy = y - AR.cy, k = Math.pow(seN(dx / rx, dy / ry), 1 / AR.n); return k <= 1 ? { x, y } : { x: AR.cx + dx / k, y: AR.cy + dy / k }; };
  // how far a line from (x, y) along a runs before it leaves the court (less pad)
  const reach = (x, y, a, pad, max) => { const ux = Math.cos(a), uy = Math.sin(a); let d = 0; while (d < max && inA(x + ux * (d + 0.25), y + uy * (d + 0.25), pad)) d += 0.25; return d; };

  /* ================= the fight ================= */
  function begin(X, H, self, arena) {
    if (S) stop();
    const g = X.g, me = X.me, a = arena || {};
    AR.cx = a.cx != null ? a.cx : me.x; AR.cy = a.cy != null ? a.cy : me.y - 6;
    AR.rx = a.rx > 0 ? Math.max(4, a.rx - 0.5) : a.ax1 != null && a.ax0 != null ? Math.max(4, (a.ax1 - a.ax0) / 2 - 0.4) : (a.r || 9);
    AR.ry = a.ry > 0 ? Math.max(4, a.ry - 0.5) : a.ay1 != null && a.ay0 != null ? Math.max(4, (a.ay1 - a.ay0) / 2 - 0.4) : (a.r || 7);
    AR.door = a.door || null;
    const barHP = TUNE.hp / TUNE.bars, hp = TUNE.hp, home = clampA(AR.cx, AR.cy + TUNE.homeY, TUNE.pad);
    const m = { type: 'boss', boss: 'tbbelial', fiend: 'tbbelial', tbBoss: true, bk: { id: 'tbbelial', name: 'Belial', title: 'The World Pillar', ai: 'tbbelial', spd: 1 }, mini: false, lesser: false, bname: 'Belial',
      x: home.x, y: home.y, r: TUNE.r, hp, maxhp: hp, spd: 1, dmg: TUNE.dmg, xp: 450, color: '#2E2925', glow: '#FFB347', aggro: true, act: 'enter', actT: 0, phase: 0, cd: 9, z: 0, t: 0, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0,
      chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, atkCd: 0, mv: 2, hitSq: 0, ph: 0, wob: 0, face: 1, step: 0, flank: 0, still: true, landed: true, noTouch: true };
    const yaw0 = Math.atan2(me.y - m.y, me.x - m.x);
    const B = { id: 'taurus', x: m.x, y: m.y, at: 0, alpha: 1, blP: null, blS: null, blOut: null, pz: null, yaw: clampYaw(yaw0), yawT: clampYaw(yaw0), spin: 0, ph: 0, mv: 0, vx: 0, vy: 0, ax: 0, ay: 0, lvx: 0, lvy: 0, thudT: 0 };
    // the Anima's own effect layer, a private copy with no Anima of its own: its pictures (dust, cracks, rocks, chips, rings over the pet, the shoulders' rings, pillars, Dominion)
    let inst = null; try { const Mv = MV(); if (Mv) inst = Mv.create({ X: Object.assign(Object.create(X), { eshots: [] }), me, g, T: () => X.Tz(), ST: X.ST, S: { list: [] }, P: () => 0, near: () => [], living: () => [], hit: () => 0, emote: () => {} }); } catch (e) { inst = null; }
    S = { X, H, self, g, me, m, B, inst, barHP, home, phase: 1, mode: 'intro', t: 0, introT: 0, deadT: 0, acts: [], pick: 0, idleT: 1.2, swCd: 3, near: 0,
      lanes: [], fields: [], waves: [], rocks: [], sweeps: [], dom: null, pad: null, store: 0, charge: 0, dps: TUNE.refDps, lastM: hp, healAcc: 0, healCd: 0, despDone: false, seen: {}, cine: false, lastG: null, objs: [], pil: [], slowOn: false, heldDt: null,
      stat: { rush: 0, rushHit: 0, rushEnd: 0, crown: 0, crownHit: 0, car: 0, carBroke: 0, carWave: 0, carHit: 0, carStored: 0, stamp: 0, stampHit: 0, rockHit: 0, rockAim: 0, sw: 0, swHit: 0, dom: 0, domHit: 0, domSafe: 0, phase2At: null, phase3At: null, t0: g.t, dmgIn: 0 } };
    X.mons.push(m); g.boss = m; g.bossShow = null; g.shownBoss = true; g.bossIntro = TUNE.intro;   // (the engine's intro hold: no attacks; its bar after 2.2 s; its own banner skipped: ours, below)
    m.ownBar = (c, W) => drawBar(c, W); m.goalFn = () => goalText();
    // the body, its ground and its sky: the gate's own objects, drawn in depth order with everything else; and three for the World Pillars
    if (H && H.obj) { S.objs.push(H.obj({ x: m.x, y: m.y, dy: -1e5, kind: 'tbGround', r: 0, label: '', draw: c => safeDraw(c, drawGroundLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 0.25, kind: 'tbBody', r: 0, label: '', draw: c => safeDraw(c, drawBodyLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 1e5, kind: 'tbSky', r: 0, label: '', draw: c => safeDraw(c, drawSkyLayer) }));
      for (let i = 0; i < 3; i++) { const o = H.obj({ x: m.x, y: -1e6, dy: 0, kind: 'tbPillars', r: 0, label: '', bucket: i, draw: c => safeDraw(c, cc => drawPillars(cc, i)) }); S.objs.push(o); S.pil.push(o); } }
    // the entrance: the court hushes, the Taurus sigil opens on its heart, rings gather overhead, pillars break out and sink, it assembles
    S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1);
    if (inst) { inst.fx.push({ kind: 'arings', x: B.x, y: B.y, t: 0, life: 3.0 }); inst.fx.push({ kind: 'epill', x: B.x, y: B.y, t: 0, life: 2.2, seed: Math.random() * 50 }); }
    for (let i = 0; i < 6; i++) X.after(i * 0.2, () => { if (S) X.shake(2.5 + i * 0.6, 0.15); });
    sfx('hum'); X.light(B.x, B.y, 5, 1.2);
    try { const G = GLB(); if (G && glOn()) G.warm(); } catch (e) { /* (no GPU: its cel model) */ }
    return m;
  }
  const sfx = (k, ...a) => { const s = S && S.X.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const say = (key, t, sub, col, dur) => { const first = !S.seen[key]; S.seen[key] = true; S.X.banner(t, sub || '', col || COL.gold, first ? (dur || 2.6) : 1.4, true); };
  const realHp = () => { const m = S.m, P = S.pad; if (!P) return m.hp; if (P.kind === 'shell') return Math.min(m.hp, P.base); return P.base; };
  const ST = () => { try { return S.X.ST(); } catch (e) { return null; } };
  const hurt = (d, o) => { const me = S.me; const before = me.hp, ok = S.X.hurtPet(d, S.m, o); if (ok) S.stat.dmgIn += Math.max(0, before - me.hp); return ok; };
  const kOf = () => S.phase - 1;
  const U = () => S.m.dmg;
  // the facing: toward its heading or the pet, kept off a dead-on view of its brow (it reads best three-quarter on)
  function clampYaw(a) { for (const c0 of [Math.PI / 2, -Math.PI / 2]) { const d = angD(a, c0); if (Math.abs(d) < 0.68) return c0 + (d < 0 ? -0.68 : 0.68); } return a; }
  const u2t = () => TUNE.size / ((GLB() && GLB().HEIGHT) ? GLB().HEIGHT[3] : 15);   // tiles a model unit
  const frontOf = d => ({ x: S.B.x + Math.cos(S.B.yaw) * d, y: S.B.y + Math.sin(S.B.yaw) * d });
  function footW(i) { const G = GLB(), L = G ? G.LEGS[i] : { x: i < 2 ? 2.2 : -2.45, s: i % 2 ? -1 : 1, fy: i < 2 ? 2.25 : 2.0 }, u = u2t(), y = S.B.yaw, mx = L.x, my = L.s * L.fy; return { x: S.B.x + (mx * Math.cos(y) - my * Math.sin(y)) * u, y: S.B.y + (mx * Math.sin(y) + my * Math.cos(y)) * u, f: !!L.f }; }

  /* the camera: the whole colossus (its citadel and monoliths) kept below the top HUD with a margin, and the pet above the buttons;
     the view widens (a little, on a phone) when that span will not fit, as it does while the World Pillars stand */
  const CAM = { top: 160, bot: 210, zFight: 0.7, zDom: 0.6, zMin: 0.5, zIn: 1.35 };
  function frame(topY, botY, x, z0) {
    const X = S.X, g = S.g, Hh = X.H(), TS = X.Tz() / Math.max(0.05, g.zoom || 1), room = Math.max(120, Hh - CAM.top - CAM.bot), span = Math.max(1, botY - topY);
    const z = Math.max(CAM.zMin, Math.min(z0, room / (span * TS))) * CAM.zIn;   /* (as Abaddon's, v422 CZ: the user: "zoom in by 35%") */
    const yGod = topY + (Hh / 2 - CAM.top) / (TS * z), yPet = botY - (Hh / 2 - CAM.bot) / (TS * z), y = Math.max(yPet, Math.min(yGod, (topY + botY) / 2 + 2));
    return { x, y, k: 0.92, zoom: z };
  }
  const godTop = () => S.B.y - TUNE.size * 1.0 - 0.3;
  function camOf() {
    const B = S.B, me = S.me;
    if (S.mode === 'intro') return frame(godTop(), B.y + 3.0, B.x, 0.7);
    if (S.mode === 'dead') return frame(godTop(), B.y + 3.0, B.x, 0.68);
    if (S.dom) { const bot = Math.max(me.y, ...S.dom.pillars.map(p => p.lee.y)) + 1.2; return frame(godTop(), bot, lerp(B.x, me.x, 0.4), CAM.zDom); }
    return frame(godTop(), Math.max(me.y, B.y + 2) + 1.0, (B.x + me.x) / 2, CAM.zFight);
  }
  function goalText() { if (!S) return ''; const n = Math.max(0, Math.ceil(Math.max(0, realHp()) / S.barHP - 1e-9));
    if (S.mode === 'dead' || S.mode === 'over') return 'The World Pillar falls';
    if (S.mode === 'intro') return 'Belial, the World Pillar';
    return `Belial · ${n} bar${n === 1 ? '' : 's'} · phase ${S.phase}/3${S.dom ? ' · shelter behind a World Pillar' : ''}`; }

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
    slowTick();
    if (S.mode !== 'dead') { B.x = m.x; B.y = m.y; }
    poseOf(dt);
    for (const o of S.objs) if (o.kind !== 'tbPillars') { o.x = B.x; o.y = B.y; }
    pillarDepth();
    if (S.steps && S.steps.length) { if (S.inst && S.mode !== 'dead') for (const f of S.steps) { const p = footW(f.i | 0); S.inst.fx.push({ kind: 'foot', x: p.x, y: p.y, R: 0.8, t: 0, life: 0.85, seed: Math.random() * 50, f: !!f.f, small: 1 }); } S.steps.length = 0; }
    if (S.cine) g.cineT = Math.max(g.cineT || 0, 0.05);
  }
  function introTick(dt) {
    const B = S.B, m = S.m, X = S.X, g = S.g, t0 = S.introT; S.introT += dt; const t = S.introT, cross = x => t0 < x && t >= x;
    B.alpha = glOn() ? (t < 0.45 ? 0 : 1) : sstep(0.3, 2.6, t);   // (on the GPU it assembles from its hooves to its horns; its cel model fades in)
    if (cross(1.0) || cross(1.6) || cross(2.2)) { X.shake(4, 0.2); sfx('thud'); }
    if (cross(2.5)) { sfx('hum'); X.light(B.x, B.y - 1, 6, 0.8); }
    if (cross(3.2)) {   // the roar: the jaw opens on its engine, a pressure wave across the court
      if (S.inst) { S.inst.fx.push({ kind: 'wave', x: B.x, y: B.y, R: 5.2, t: 0, life: 0.9, seed: 1, big: 1 }); S.inst.fx.push({ kind: 'dust', x: B.x, y: B.y, R: 3.8, t: 0, life: 1.2, seed: 2 }); }
      S.waves.push({ x: B.x, y: B.y, R: 9, t: 0, dur: 0.9, hit: true, prev: 0, dmg: 0, vis: 1 });
      X.shake(14, 0.7); X.flash(0.3, '#FFE9A8'); sfx('crash'); X.light(B.x, B.y, 8, 0.8); g.hitStop = Math.max(g.hitStop || 0, 0.05);
      for (let i = 0; i < 22 * LQ(); i++) { const an = Math.random() * TAU; X.part({ kind: 'star', x: B.x + Math.cos(an) * 2.2, y: B.y - 1.5 + Math.sin(an), vx: Math.cos(an) * 3.2, vy: Math.sin(an) * 2 - 0.6, life: 1, max: 1, size: 3, color: i % 2 ? COL.gold : COL.pale, drag: 1.4 }); } }
    if (cross(3.4)) { X.banner('BELIAL', 'The World Pillar', COL.gold, 2.8, true, true); sfx('sparkle'); }
    if (t >= TUNE.intro) { B.alpha = 1; S.mode = 'fight'; S.cine = false; g.cineT = 0; m.act = 'fight'; S.idleT = 1.0; say('p1', 'PHASE I', 'Belial · ' + PH_NAMES[0], COL.gold, 1.8); }
  }
  /* ---- the fight ---- */
  function fightTick(dt) {
    const m = S.m;
    // what the pet's blows took since the last frame (its health or the barrier: Dominion shrugs them off), before the pads read it back
    const took = S.pad && S.pad.kind === 'void' ? 0 : Math.max(0, S.lastM - m.hp);
    S.dps = S.dps * Math.exp(-dt / 10) + took / 10;
    padTick(dt);
    try { fightAI(dt, took); } finally { S.lastM = m.hp; }
  }
  function fightAI(dt, took) {
    const m = S.m, me = S.me, g = S.g, X = S.X;
    if (m.dead || S.mode !== 'fight') return;
    // its wounds spill healing light for the pet to catch (as the Belfry's fiends, 20h)
    S.healAcc += took; S.healCd -= dt;
    if (S.healAcc > S.barHP * TUNE.heal && S.healCd <= 0) { S.healAcc = 0; S.healCd = TUNE.healCd; const an = Math.atan2(me.y - m.y, me.x - m.x), x = m.x + Math.cos(an) * (m.r + 0.6), y = m.y + Math.sin(an) * (m.r + 0.6); X.drop('hp', x, y); if (Math.random() < 0.45) X.drop('mp', x, y); X.sparks(x, y, '#8FE0A6', 8, 4); }
    // the phases (and the last Dominion)
    const f = realHp() / m.maxhp;
    if (!S.dom && S.phase < 3 && f <= TUNE.cuts[S.phase]) phaseUp();
    else if (!S.dom && S.phase === 3 && !S.despDone && f <= TUNE.desp) { S.despDone = true; abortActs(); startDom(true); }
    if (me.dead) { if (S.acts.length || S.fields.length || S.lanes.length || S.rocks.length) abortActs(); if (S.dom) endDom(); S.idleT = Math.max(S.idleT, 1.4); S.heldDt = 0; return; }   // (the pet down: its powers called off; the next pet in finds it waiting)
    const held = g.stopT > 0 || (g.cineT > 0 && !S.cine), slow = (m.chill > 0 ? 0.8 : 1) * (g.warpT > 0 ? 0.4 : 1) * (m.curseT > 0 ? 0.85 : 1), da = held ? 0 : dt * slow;
    S.heldDt = da;
    if (m.stunT > 0) { m.stunT -= da; m.act = m.stunT > 0 ? 'stunned' : 'fight'; brake(da); return; }   // (its barrier broken: staggered, open)
    if (S.dom) { domTick(da); brake(da); return; }
    for (let i = S.acts.length - 1; i >= 0; i--) { const A = S.acts[i]; A.t += da; if (actTick(A, da)) { endAct(A); S.acts.splice(i, 1); if (A.kind !== 'sw' && !S.acts.some(B2 => B2.kind !== 'sw')) S.idleT = TUNE.idle[kOf()]; } }
    // the tail's anchor: a punish for a pet that stays close, thrown in between (or over a stampede or the barrier); it never holds up the next power
    S.swCd -= da; const dp = Math.hypot(me.x - m.x, me.y - m.y); S.near = dp < TUNE.swR + 0.3 ? S.near + da : 0;
    const busy = S.acts.some(A => A.kind !== 'sw');
    if (S.noAI) { if (!S.acts.some(A => A.kind === 'rush' || A.kind === 'stamp')) { brake(da); S.B.yawT = clampYaw(Math.atan2(me.y - m.y, me.x - m.x)); } easeOut(); return; }   // (the harness: one power at a time, no walking)
    if (S.swCd <= 0 && S.near > TUNE.swNear * (busy ? 1.5 : 1) && !S.acts.some(A => A.kind === 'sw' || A.kind === 'rush')) start('sw');
    if (!busy) { S.idleT -= da; if (S.idleT <= 0) { const cyc = CYC[S.phase], k = cyc[S.pick % cyc.length]; S.pick++; for (const kk of k.split('+')) start(kk); } }
    const planted = S.acts.some(A => A.kind === 'rush' || A.kind === 'car' || A.kind === 'sw' || A.kind === 'crown');
    if (!S.acts.some(A => A.kind === 'rush' || A.kind === 'stamp')) walk(da, planted ? 0 : 1);
    easeOut();
  }
  // it is passed round, not through: the pet eased out from under it
  function easeOut() { const me = S.me, m = S.m; if (me.dead || me.leap) return; const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = 1.9; if (d < r0 && d > 1e-4) S.X.moveEnt(me, dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6, 0); }
  /* its heavy walk: it holds its court (it does not chase: it leans from its place toward the pet, and walks back to it after a charge),
     keeping its distance; it turns toward its heading before it gains speed; the gait's phase from the distance, each front footfall a
     thud, a puff of dust and a light shake */
  function walk(dt, k) {
    if (!(dt > 0)) return; const m = S.m, me = S.me, B = S.B, H0 = S.home;
    const vx = me.x - H0.x, vy = me.y - H0.y, vd = Math.hypot(vx, vy) || 1, ln = Math.min(TUNE.leanMax, vd * TUNE.lean); let tx = H0.x + vx / vd * ln, ty = H0.y + vy / vd * ln;
    { const ex = tx - me.x, ey = ty - me.y, e = Math.hypot(ex, ey) || 1; if (e < TUNE.keep) { tx = me.x + ex / e * TUNE.keep; ty = me.y + ey / e * TUNE.keep; } }
    const p = clampA(tx, ty, TUNE.pad);
    // it keeps its brow to the pet: toward a place ahead it turns and walks; behind it (back to its place after a charge) it backs away, heavily
    const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy), head = Math.atan2(dy, dx), toPet = Math.atan2(me.y - m.y, me.x - m.x), ahead = Math.abs(angD(head, toPet)) < 1.2;
    B.yawT = clampYaw(d > 0.6 && k > 0 && ahead ? head : toPet);
    const al = Math.cos(angD(head, B.yaw)), tk = ahead ? cl(1 - Math.abs(angD(head, B.yaw)) / 1.4) : 1, sp = al > 0.3 ? 1 : al < -0.3 ? 0.55 : 0.7, want = d > 0.35 ? Math.min(TUNE.spd[kOf()] * k * sp, d * 1.1) * tk : 0;
    const acc = Math.min(1, dt * 1.3); B.vx += ((d > 0.35 ? dx / d * want : 0) - B.vx) * acc; B.vy += ((d > 0.35 ? dy / d * want : 0) - B.vy) * acc;
    moveBy(B.vx * dt, B.vy * dt, 1);
  }
  function brake(dt) { const B = S.B; B.vx *= 1 - Math.min(1, dt * 4); B.vy *= 1 - Math.min(1, dt * 4); }
  function moveBy(mx, my, stride) { const m = S.m, B = S.B, p = clampA(m.x + mx, m.y + my, TUNE.pad - 0.6) /* (its hard limit: its walk aims inside TUNE.pad, a charge runs on to here) */, dd = Math.hypot(p.x - m.x, p.y - m.y); m.x = p.x; m.y = p.y; B.x = m.x; B.y = m.y;
    const G = GLB(), sl = ((G && G.STRIDE) || 2.1) * u2t() * (stride || 1), ph0 = B.ph, back = mx * Math.cos(B.yaw) + my * Math.sin(B.yaw) < -1e-6 ? -1 : 1;   // (backing away, its gait runs backward)
    B.ph += back * dd / Math.max(0.05, sl * Math.max(0.3, B.mv)) * TAU; footfalls(Math.min(ph0, B.ph), Math.max(ph0, B.ph)); return dd; }
  function footfalls(ph0, ph1) { const G = GLB(), B = S.B, X = S.X; if (!G) return; const rush = S.acts.some(A => A.kind === 'rush' && A.go);
    for (const f of G.footfalls(ph0, ph1)) { const p = footW(f.i);
      if (S.inst && B.mv > 0.2) S.inst.fx.push({ kind: 'foot', x: p.x, y: p.y, R: rush ? 1.6 : 1.0, t: 0, life: 0.85, seed: Math.random() * 50, f: !!f.f, big: rush ? 1 : 0 });   // (the shared footfall: a plinth's ring and a skirt of dust)
      if (f.f) { X.shake(rush ? 3.2 : 1.1 + B.mv * 1.4, rush ? 0.12 : 0.08); if (S.inst && rush) S.inst.fx.push({ kind: 'crack', x: p.x, y: p.y, R: 1.1, t: 0, life: 1.4, seed: Math.random() * 50, heat: 0.5, a: 0.6 });
        if (B.thudT <= S.t) { sfx(rush ? 'stomp' : 'thud'); B.thudT = S.t + (rush ? 0.2 : 0.45); } } } }
  function phaseUp() {
    const m = S.m, X = S.X; abortActs(); S.phase++; m.flinch = 1;
    if (S.phase === 2) S.stat.phase2At = S.g.t - S.stat.t0; else S.stat.phase3At = S.g.t - S.stat.t0;
    X.banner(`PHASE ${S.phase === 2 ? 'II' : 'III'}`, `Belial · ${PH_NAMES[S.phase - 1]}`, S.phase === 3 ? COL.amber : COL.gold, 2.0, true);
    X.flash(0.3, '#FFE9A8'); X.shake(14, 0.6); X.ring(m.x, m.y, 0.5, 8, 1, COL.gold, 0.4); sfx('hum');
    for (let i = 0; i < 4; i++) X.drop(i % 2 ? 'mp' : 'hp', m.x + (Math.random() - 0.5) * 4, m.y + 2 + Math.random() * 2);
    startDom(false);
  }

  /* ---- the powers ---- */
  function start(kind) {
    const k = kOf(), me = S.me, m = S.m, B = S.B; let A = null;
    if (kind === 'rush') { A = { kind, t: 0, n: TUNE.rushN[k], seg: 0, t0: 0, go: false, wind: TUNE.rushWind[k], back: false }; if (!aimRush(A, A.wind)) { A.back = true; A.ux = 0; A.uy = 1; A.a = Math.PI / 2; A.ct = 1; A.D = 0; } else sfx('hum'); }
    else if (kind === 'crown') { A = { kind, t: 0, open: TUNE.crOpen[k], on: TUNE.crDur[k], R: TUNE.crR[k], made: false }; A.dur = 0.35 + A.open + A.on + 0.5; sfx('hum'); }
    else if (kind === 'car') { if (S.pad) return null; A = { kind, t: 0, up: 0.9 }; A.dur = A.up + TUNE.carDur + 0.9; sfx('hum'); }
    else if (kind === 'stamp') { A = { kind, t: 0, n: TUNE.stN[k], gap: TUNE.stGap[k], R: TUNE.stR[k], i: 0 }; A.dur = 0.45 + (A.n - 1) * A.gap + 0.9; A.tailT = 0.45 + Math.floor(A.n / 2) * A.gap + A.gap * 0.5; B.yawT = clampYaw(Math.atan2(me.y - m.y, me.x - m.x)); sfx('hum'); }
    else if (kind === 'sw') { A = { kind, t: 0, tell: TUNE.swTell[k], dir: Math.random() < 0.5 ? 1 : -1 }; A.dur = A.tell + 0.7; S.swCd = TUNE.swCd; S.near = 0; S.idleT += 0.3; /* (the sweep takes its turn: the next power waits a breath) */ S.sweeps.push({ t: 0, tell: A.tell, A, hit: false, dir: A.dir, a0: B.yaw + Math.PI }); }
    if (!A) return null; S.stat[kind] = (S.stat[kind] || 0) + 1; S.acts.push(A); return A;
  }
  /* Thronebreaker Rush: aim a lane at the pet (a little ahead of it), from its middle to the court's rim */
  function aimRush(A, wind) {
    const me = S.me, m = S.m, B = S.B, tx = me.x + (me.vx || 0) * 0.25, ty = me.y + (me.vy || 0) * 0.25, a = Math.atan2(ty - m.y, tx - m.x), D = reach(m.x, m.y, a, TUNE.pad - 0.6, TUNE.rushMax);
    if (D < TUNE.rushMin) return false;
    const fd = 1.9 * TUNE.size / 6.4, ux = Math.cos(a), uy = Math.sin(a);
    Object.assign(A, { a, ux, uy, D, wind, ct: D / TUNE.rushSpd * 1.22, sx: m.x, sy: m.y, fd, done: 0, go: false, impact: false, prev: 0 });
    A.lane = { x0: m.x + ux * fd * 0.6, y0: m.y + uy * fd * 0.6, ux, uy, len: D + fd * 0.4 + 0.6, w: TUNE.rushW, t: 0, tell: wind, A, hit: false, seed: Math.random() * 90, end: -1 };
    S.lanes.push(A.lane); B.yawT = a;
    if (S.inst) { S.inst.fx.push({ kind: 'srings', a: B, t: 0, life: wind + A.ct + 0.4 }); S.inst.fx.push({ kind: 'lens', a: B, inward: 1, x: m.x, y: m.y, R: 3.2, t: 0, life: wind, seed: Math.random() * 50 }); }   // (the horns gather the field in over the wind-up)
    return true;
  }
  // a power's own clock: true when it is done
  function actTick(A, dt) {
    const t = A.t, t0 = t - dt, cross = x => t0 < x && t >= x, m = S.m, X = S.X, me = S.me, B = S.B, k = kOf();
    if (A.kind === 'rush') {
      if (A.back) {   // (no room for a lane: it backs away toward its place first, brow to the pet, until it has one)
        const H0 = S.home, dx = H0.x - m.x, dy = H0.y - m.y, d = Math.hypot(dx, dy), sp = Math.min(1.4, d * 2) * dt; B.mv = d > 0.2 ? 0.6 : 0; B.yawT = clampYaw(Math.atan2(me.y - m.y, me.x - m.x)); if (d > 0.05) moveBy(dx / d * sp, dy / d * sp, 1);
        if (t > 0.3 && aimRush(A, A.wind)) { A.back = false; A.t0 = t; sfx('hum'); return false; }
        if (t > 2.4 || d < 0.1) { start('stamp'); return true; }
        return false; }
      const ts = t - A.t0, ts0 = ts - dt, tI = A.wind + A.ct;
      if (ts < A.wind) { B.vx = B.vy = 0; B.mv = 0; B.yawT = A.a; if (ts0 < 0.12 && ts >= 0.12 && S.inst) { const f = frontOf(1.2); S.inst.fx.push({ kind: 'crack', x: f.x, y: f.y, R: 1.8, t: 0, life: 2.2, seed: Math.random() * 50, heat: 1 }); S.inst.fx.push({ kind: 'dust', x: f.x, y: f.y, R: 1.8, t: 0, life: 0.9, seed: 7 }); }
        if (Math.random() < dt * 8) X.shake(1.2, 0.06); return false; }
      if (ts0 < tI) {   // the charge: a heavy start, then the mass of it along the lane
        if (!A.go && S.inst) S.inst.fx.push({ kind: 'bow', a: B, A, t: 0, life: A.ct + 0.2 });   // (the pressure bow ahead of its horns)
        A.go = true; B.mv = 1; B.yaw = A.a;
        const ease = u => u < 0.2 ? (u / 0.2) * (u / 0.2) * 0.1 : u > 0.9 ? 1 - (1 - u) * (1 - u) / 0.1 * 0.05 : 0.1 + (u - 0.2) / 0.7 * 0.85, u0 = cl((ts0 - A.wind) / A.ct), u1 = cl((ts - A.wind) / A.ct), want = (ease(u1) - ease(u0)) * A.D;
        moveBy(A.ux * want, A.uy * want, 1.8); B.vx = A.ux * want / Math.max(dt, 1e-3); B.vy = A.uy * want / Math.max(dt, 1e-3);
        // the lane: struck as its front passes (the swept span since the last frame: the same at any frame rate)
        const L = A.lane, fr = frontOf(A.fd), prog = (fr.x - L.x0) * L.ux + (fr.y - L.y0) * L.uy; L.prog = prog;
        if (!L.hit && !me.dead) { const rx = me.x - L.x0, ry = me.y - L.y0, al = rx * L.ux + ry * L.uy, of = Math.abs(-rx * L.uy + ry * L.ux);
          if (of < L.w / 2 + me.r && al > A.prev - 0.9 && al < prog + 0.4) { L.hit = true; if (hurt(U() * TUNE.rushK, { rush: true })) { S.stat.rushHit++; const sd = Math.sign(-rx * L.uy + ry * L.ux) || 1; me.push = { vx: (-L.uy * sd * 7 + L.ux * 4), vy: (L.ux * sd * 7 + L.uy * 4), t: 0.22 }; X.shake(9, 0.25); } } }
        A.prev = prog;
        if (ts >= tI && !A.impact) impact(A); return false; }
      if (!A.impact) impact(A);
      if (ts >= tI + TUNE.rushRec) { if (A.seg + 1 < A.n) { A.seg++; A.t0 = t; if (!aimRush(A, A.wind * 0.75)) return true; sfx('hum'); return false; } return true; }
      B.vx = B.vy = 0; B.mv = 0; return false;
    }
    if (A.kind === 'crown') {
      if (cross(0.35) && !A.made) { A.made = true; const n = TUNE.crN[k], p0 = clampA(me.x + (me.vx || 0) * 0.3, me.y + (me.vy || 0) * 0.3, 1.0); field(p0.x, p0.y, A);
        if (n > 1) { let best = null; for (let i = 0; i < 12; i++) { const an = Math.random() * TAU, r = 3.4 + Math.random() * 1.2, q = clampA(p0.x + Math.cos(an) * r, p0.y + Math.sin(an) * r, 1.0), dd = Math.hypot(q.x - p0.x, q.y - p0.y); if (!best || dd > best.d) best = { q, d: dd }; if (dd > A.R * 1.3) break; } field(best.q.x, best.q.y, A); }
        say('crown', 'CROWN OF BURDENS', 'Rings of gravity close round you: walk or roll out', COL.gold, 2.2); sfx('sparkle'); }
      return t >= A.dur; }
    if (A.kind === 'car') { B.vx = B.vy = 0; B.mv = 0; if (cross(A.up) && !S.pad) shellUp(A); return t >= A.dur || (t > A.up + 0.1 && !S.pad && !A.released && A.broke); }
    if (A.kind === 'stamp') {
      const d = Math.hypot(me.x - m.x, me.y - m.y), last = 0.45 + (A.n - 1) * A.gap;
      if (d > TUNE.stAdv && t < last) { B.mv = 0.3; const sp = Math.min(0.55, d) * dt, a = Math.atan2(me.y - m.y, me.x - m.x); moveBy(Math.cos(a) * sp, Math.sin(a) * sp, 1); B.yawT = clampYaw(a); } else { B.mv = 0; B.vx = B.vy = 0; }
      for (let i = 0; i < A.n; i++) if (cross(0.45 + i * A.gap)) stomp(A, i);
      if (cross(0.05)) say('stamp', 'GRAVITON STAMPEDE', 'Each stomp a ring across the floor; rocks fall on their rings', COL.gold, 2.0);
      return t >= A.dur; }
    if (A.kind === 'sw') return t >= A.dur;
    return true;
  }
  function endAct(A) { if (A.kind === 'car' && S.pad && S.pad.kind === 'shell') shellRelease(); }
  // an interrupted power: its blows called off (marked lanes, fields and rocks fade unstruck), the barrier let go without its wave
  function abortActs() {
    S.acts.length = 0;
    for (const L of S.lanes) if (L.end < 0) { L.end = L.t; L.hit = true; }
    for (const f of S.fields) if (!f.end) { f.end = true; f.endT = f.t; f.dud = true; }
    for (const r of S.rocks) r.dud = true;
    for (const w of S.sweeps) w.hit = true;
    for (const w of S.waves) w.hit = true;
    if (S.pad && S.pad.kind === 'shell') { const m = S.m; if (m.hp > S.pad.base) m.hp = S.pad.base; S.pad = null; S.store = 0; }
    if (S.inst) for (const f of S.inst.fx) if ((f.kind === 'srings' || f.kind === 'cring') && f.life - f.t > 0.4) f.life = f.t + 0.4;
    S.idleT = Math.max(S.idleT, 1.0);
  }
  function impact(A) {
    const X = S.X, me = S.me, k = kOf(); A.impact = true; A.go = false; const f = frontOf(A.fd + 0.3);
    if (A.lane && A.lane.end < 0) A.lane.end = A.lane.t;
    if (!me.dead && Math.hypot(me.x - f.x, me.y - f.y) < TUNE.rushEndR + me.r) { if (hurt(U() * TUNE.rushEndK, { rush: true })) { S.stat.rushEnd++; const an = Math.atan2(me.y - f.y, me.x - f.x); me.push = { vx: Math.cos(an) * 10, vy: Math.sin(an) * 10, t: 0.25 }; } }
    if (S.inst) { const I = S.inst.fx; I.push({ kind: 'wave', x: f.x, y: f.y, R: 2.8, t: 0, life: 0.6, seed: 3 }); I.push({ kind: 'well', x: f.x, y: f.y, R: 1.8, t: 0, life: 0.7, h: 1.2 }); I.push({ kind: 'crack', x: f.x, y: f.y, R: 2.4, t: 0, life: 2.4, seed: 13, heat: 1.2 }); I.push({ kind: 'dust', x: f.x, y: f.y, R: 2.6, t: 0, life: 1.0, seed: 17 }); I.push({ kind: 'quake', x: f.x, y: f.y, R: 3.0, t: 0, life: 0.8, seed: 19 }); I.push({ kind: 'burst', x: f.x, y: f.y, R: 1.2, t: 0, life: 0.6, seed: 23 });
      for (let i = 0; i < Math.round(6 * LQ()); i++) { const an = Math.random() * TAU, v = 1 + Math.random() * 2.5; I.push({ kind: 'chip', x: f.x, y: f.y, z: 0.1, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 3 + Math.random() * 3, t: 0, life: 1.2, s: 0.14 + Math.random() * 0.12, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); } }
    if (TUNE.rushShockR[k] > 0) S.waves.push({ x: f.x, y: f.y, R: TUNE.rushShockR[k], t: 0, dur: 0.55, hit: false, prev: 0, dmg: U() * TUNE.rushShockK, tag: 'rush' });
    X.flash(0.16, '#FFE9A8'); X.shake(12, 0.35); sfx('crash'); X.light(f.x, f.y, 4, 0.4); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.05);
  }
  /* Crown of Burdens: a field of gravity round (x, y) */
  function field(x, y, A) { S.fields.push({ x, y, R: A.R, t: 0, open: A.open, on: A.on, tk: 0.35, A, end: false, endT: 0, inside: false, cr: null, seed: Math.random() * 60 }); sfx('hum'); }
  /* Citadel Carapace */
  function shellUp(A) { const m = S.m, k = kOf(), ref = dpsRef(), pool = ref * TUNE.carSec[k]; S.pad = { kind: 'shell', base: m.hp, pool, left: pool, t: 0, life: TUNE.carDur, hit: null, A, ref }; m.hp += pool; S.store = 0;
    S.X.text(m.x, m.y - TUNE.size * 0.8, 'CITADEL CARAPACE', COL.pale, 14, { crit: true, life: 1 }); sfx('sparkle'); S.X.shake(5, 0.3);
    say('car', 'CITADEL CARAPACE', 'It stores every blow: break it, or stop and back away', COL.pale, 2.4); }
  const dpsRef = () => Math.max(TUNE.refDps, S.dps || 0), carFill = () => cl(S.store / ((S.pad && S.pad.ref || dpsRef()) * TUNE.carFill));   // (measured against the pet's damage when the barrier rose)
  const carR = () => lerp(TUNE.carR0, TUNE.carRmax, carFill());
  const carMul = () => 1 + TUNE.carCap * carFill();
  function breakShell() { const m = S.m, X = S.X, P = S.pad; S.pad = null; S.stat.carBroke++; S.store = 0; m.stunT = TUNE.carStag; m.act = 'stunned'; m.flash = 0.2; if (P && P.A) P.A.broke = true;
    X.text(m.x, m.y - TUNE.size * 0.75, 'Carapace broken!', COL.white, 16, { crit: true, life: 1.2 }); X.shake(10, 0.4); X.flash(0.2, '#FFE9A8'); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06);
    if (S.inst) { const I = S.inst.fx; I.push({ kind: 'field', x: m.x, y: m.y, R: 3.4, t: 0, life: 0.6, rev: 1 }); for (let i = 0; i < Math.round(12 * LQ()); i++) { const an = Math.random() * TAU, v = 2 + Math.random() * 3; I.push({ kind: 'chip', x: m.x + Math.cos(an) * 1.2, y: m.y + Math.sin(an) * 0.8, z: 2.2 + Math.random() * 1.6, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 2 + Math.random() * 2, t: 0, life: 1.3, s: 0.18 + Math.random() * 0.14, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); } }
    for (const A of S.acts) if (A.kind === 'car') A.t = Math.max(A.t, A.dur - 0.01); }
  // the stance ends unbroken: the stored force goes out as a pressure wave scaled by it
  function shellRelease() { const P = S.pad, m = S.m, X = S.X; if (!P || P.kind !== 'shell') return; if (m.hp > P.base) m.hp = P.base; const R = carR(), k = carMul(); S.pad = null; P.A && (P.A.released = true);
    S.waves.push({ x: m.x, y: m.y, R, t: 0, dur: 0.6, hit: false, prev: 0, dmg: U() * TUNE.carK * k, tag: 'car', big: 1 }); S.stat.carWave++;
    if (S.inst) { const I = S.inst.fx; I.push({ kind: 'field', x: m.x, y: m.y, R, t: 0, life: 0.7, rev: 1 }); I.push({ kind: 'dust', x: m.x, y: m.y, R, t: 0, life: 1.1, seed: 33 }); }
    X.flash(0.22, '#FFE9A8'); X.shake(12 + k * 3, 0.45); sfx('crash'); X.light(m.x, m.y, 6, 0.6); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.05);
    if (k > 1.3) X.text(m.x, m.y - TUNE.size * 0.8, `Retaliation x${k.toFixed(1)}`, COL.pale, 14, { life: 1.2 });
    S.store = 0; S.charge = 0; }
  // the barrier soaks and stores, Dominion shrugs every blow off: each frame, what the blows took is read back
  function padTick(dt) {
    const P = S.pad, m = S.m; if (!P) return; P.t += dt;
    if (P.kind === 'shell') { const left = m.hp - P.base; if (left < P.left - 0.5) { S.store += P.left - Math.max(0, left); S.stat.carStored += P.left - Math.max(0, left); P.hit = [0.001, Math.atan2(S.me.y - m.y, S.me.x - m.x)]; S.charge = Math.min(1.5, S.charge + 0.08); } P.left = left;
      if (P.hit) { P.hit[0] += dt / 0.6; if (P.hit[0] >= 1) P.hit = null; }
      if (left <= 0) breakShell(); else if (P.t >= P.life) shellRelease(); return; }
    const top = P.base + P.buf; if (m.hp < top) m.hp = top;
  }
  /* Graviton Stampede: a stomp of a front foot */
  function stomp(A, i) {
    const X = S.X, me = S.me, k = kOf(), f = footW(i % 2);
    S.waves.push({ x: f.x, y: f.y, R: A.R, t: 0, dur: 0.55, hit: false, prev: 0, dmg: U() * TUNE.stK, tag: 'stamp' });
    if (S.inst) { const I = S.inst.fx; I.push({ kind: 'crack', x: f.x, y: f.y, R: 1.9, t: 0, life: 1.8, seed: i * 11, heat: 1 }); I.push({ kind: 'dust', x: f.x, y: f.y, R: 2.0, t: 0, life: 0.9, seed: i * 13 }); I.push({ kind: 'well', x: f.x, y: f.y, R: 1.4, t: 0, life: 0.5 }); I.push({ kind: 'quake', x: f.x, y: f.y, R: 2.4, t: 0, life: 0.8, seed: i * 17 }); I.push({ kind: 'pulse', a: S.B, x: f.x, y: f.y, t: 0, life: 0.4, seed: i * 7 });
      for (let j = 0; j < Math.round(5 * LQ()); j++) { const an = Math.random() * TAU, v = 1 + Math.random() * 2; I.push({ kind: 'chip', x: f.x, y: f.y, z: 0.1, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 3 + Math.random() * 3, t: 0, life: 1.2, s: 0.12 + Math.random() * 0.12, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); } }
    if (i % 2 === 0 && !me.dead) for (let j = 0; j < TUNE.stRocks[k]; j++) { let x = me.x + (me.vx || 0) * 0.3, y = me.y + (me.vy || 0) * 0.3; if (j) { const an = Math.random() * TAU, r = 1.8 + Math.random() * 1.2; x += Math.cos(an) * r; y += Math.sin(an) * r; } const p = clampA(x, y, 0.8); rockAt(p.x, p.y, TUNE.rockHang[k] + j * 0.12, !j); }
    X.shake(5 + i * 0.5, 0.18); sfx(i % 2 ? 'thud' : 'crash'); X.light(f.x, f.y, 3, 0.25);
  }
  // a rock raised from the floor under (x, y): it rises, hangs over a ring of light, and is slammed down (the instance's own rock: its timing set here)
  function rockAt(x, y, hang, aimed) { const rise = 0.5, fall = 0.22, s = 0.42 + Math.random() * 0.12; const fx = S.inst ? { kind: 'rock', x, y, z: -s, h: 1.7, s, dmg: 0, t: 0, life: 9, rise, hold: hang, done: false, seed: Math.random() * 100, yaw: Math.random() * 6, tilt: Math.random() * 2 } : null;
    if (fx) S.inst.fx.push(fx); S.rocks.push({ x, y, t: 0, land: rise + hang + fall, hit: false, dud: false, fx, R: TUNE.rockR, aimed: !!aimed }); }

  /* ---- the hazards in the world: lanes, fields, waves, rocks, the tail's sweep ---- */
  function hazardsTick(da, dt) {
    const me = S.me, m = S.m, X = S.X, alive = S.mode === 'fight' && !m.dead, k = kOf();
    for (let i = S.lanes.length - 1; i >= 0; i--) { const L = S.lanes[i]; L.t += da; if (L.end >= 0 && L.t > L.end + 0.8) S.lanes.splice(i, 1); }
    let slow = 0;
    for (let i = S.fields.length - 1; i >= 0; i--) { const f = S.fields[i]; f.t += f.end ? dt : da; const on = !f.end && f.t > f.open && f.t < f.open + f.on;
      const d = Math.hypot(me.x - f.x, me.y - f.y); f.inside = on && alive && !me.dead && d < f.R + me.r * 0.5;
      if (f.inside) { slow = TUNE.crSlow;
        if (!me.dodge && !me.leap && d > 0.3) { const sp = TUNE.crPull[k] * (0.7 + 0.3 * d / f.R) * da, an = Math.atan2(f.y - me.y, f.x - me.x) + 0.35; X.moveEnt(me, Math.cos(an) * Math.min(d, sp), Math.sin(an) * Math.min(d, sp), 0); }
        f.tk -= da; if (f.tk <= 0 && f.t < f.open + f.on - 0.5) { f.tk = TUNE.crTick; if (hurt(U() * TUNE.crK, { dot: true, crown: true })) S.stat.crownHit++; }   // (no tick in its last 0.5 s: the core's collapse is not lost to the pet's blink of safety)
        if (S.inst && (!f.cr || f.cr.t >= f.cr.life - 0.05)) { f.cr = { kind: 'cring', m: me, src: S.B, A: { k: 3, pulseT: -9, t: 0 }, t: 0, life: Math.max(0.6, f.open + f.on - f.t + 0.3), seed: f.seed }; S.inst.fx.push(f.cr); } }
      else if (f.cr && f.cr.life - f.cr.t > 0.35) { f.cr.life = f.cr.t + 0.3; f.cr = null; }
      if (!f.end && f.t >= f.open + f.on) { f.end = true; f.endT = f.t; if (alive) { const d2 = Math.hypot(me.x - f.x, me.y - f.y);
          if (d2 < TUNE.crCore + me.r && !me.dead) { if (hurt(U() * TUNE.crEndK, { crown: true })) S.stat.crownHit++; }
          S.waves.push({ x: f.x, y: f.y, R: TUNE.crCore * 1.5, t: 0, dur: 0.45, hit: true, prev: 0, dmg: 0, vis: 0.7 }); if (S.inst) S.inst.fx.push({ kind: 'dust', x: f.x, y: f.y, R: 1.6, t: 0, life: 0.7, seed: f.seed }); X.shake(6, 0.25); sfx('crash'); } }
      if (f.end && f.t >= f.endT + 0.6) S.fields.splice(i, 1); }
    S.slowK = slow;
    for (let i = S.waves.length - 1; i >= 0; i--) { const w = S.waves[i]; w.t += dt; const u = w.t / w.dur, rw = w.R * eout(u);
      if (!w.hit && alive && !me.dead) { const d = Math.hypot(me.x - w.x, me.y - w.y); if (d - me.r <= rw && d + me.r >= w.prev - 0.6) { w.hit = true; if (hurt(w.dmg, { wave: w.tag })) { if (w.tag === 'stamp') S.stat.stampHit++; else if (w.tag === 'car') S.stat.carHit++; else S.stat.rushEnd++; const an = Math.atan2(me.y - w.y, me.x - w.x); me.push = { vx: Math.cos(an) * (w.big ? 10 : 6), vy: Math.sin(an) * (w.big ? 10 : 6), t: 0.22 }; } } }
      if (u >= 1 && !w.hit) w.hit = true; w.prev = rw; if (w.t >= w.dur + 0.45) S.waves.splice(i, 1); }
    for (let i = S.rocks.length - 1; i >= 0; i--) { const r = S.rocks[i], t0 = r.t; r.t += r.dud ? dt : da;
      if (!r.dud && !r.hit && t0 < r.land && r.t >= r.land) { r.hit = true; if (alive && !me.dead && Math.hypot(me.x - r.x, me.y - r.y) < r.R + me.r * 0.5) { if (hurt(U() * TUNE.rockK, { rock: true })) { S.stat.rockHit++; if (r.aimed) S.stat.rockAim++; } } }
      if (r.dud && r.fx && !r.fx.done) { r.fx.done = true; r.fx.land = r.fx.t; r.fx.life = r.fx.t + 0.35; }
      if (r.t >= r.land + 0.5 || (r.dud && r.t > 0.4)) S.rocks.splice(i, 1); }
    for (let i = S.sweeps.length - 1; i >= 0; i--) { const w = S.sweeps[i], t0 = w.t; w.t += w.hit ? dt : da;
      if (!w.hit && t0 < w.tell && w.t >= w.tell) { w.hit = true; sfx('whoosh'); X.shake(7, 0.25);
        if (S.inst) S.inst.fx.push({ kind: 'wave', x: m.x, y: m.y, R: TUNE.swR, t: 0, life: 0.5, seed: 9 });
        if (alive && !me.dead) { const d = Math.hypot(me.x - m.x, me.y - m.y); if (d < TUNE.swR + me.r) { if (hurt(U() * TUNE.swK, { tail: true })) { S.stat.swHit++; const an = Math.atan2(me.y - m.y, me.x - m.x); me.push = { vx: Math.cos(an) * 12, vy: Math.sin(an) * 12, t: 0.25 }; X.shake(8, 0.25); } } } }
      if (w.t >= w.tell + 0.6) S.sweeps.splice(i, 1); }
  }
  // the Crown's slow on the pet (a movement modifier of its own: set while a field holds it, gone the moment none does)
  function slowTick() { const g = S.g, on = S.slowK > 0 && !S.me.dead && S.mode === 'fight';
    if (on) { g.mvMods = g.mvMods || {}; g.mvMods.tbcrown = S.slowK; S.slowOn = true; } else if (S.slowOn) { if (g.mvMods) delete g.mvMods.tbcrown; S.slowOn = false; } }

  /* ---- Dominion of the World Pillar ---- */
  // boss time -> the Anima's timeline (BELIAL_MOVES.UT), piecewise along TUNE.domT
  function domUT(t) { const Mv = MV(), UT = Mv && Mv.UT ? Mv.UT : { p1: 1.8, p2: 4.0, p3: 6.4, slam: 8.1, pulse2: 8.75, p6: 9.6, len: 11.6 }, K = TUNE.domT, V = [0, UT.p1, UT.p2, UT.p3, UT.slam, UT.pulse2, UT.p6, UT.len];
    if (t <= 0) return 0; for (let i = 1; i < K.length; i++) if (t <= K[i]) return lerp(V[i - 1], V[i], (t - K[i - 1]) / (K[i] - K[i - 1])); return V[V.length - 1] + (t - K[K.length - 1]); }
  // the World Pillars: round it, inside the court, each with its lee (the pool of light behind it, away from Belial) inside the court too
  function pillarsFor(n, seed) {
    const B = S.B, out = [], Mv = MV(), UT = Mv && Mv.UT ? Mv.UT : { p1: 1.8 };
    for (let tries = 0; tries < 400 && out.length < n; tries++) { const ring = Math.floor(tries / 100), a = tries < 300 ? (out.length + (tries % 7) * 0.13) / n * TAU + seed + (Math.random() - 0.5) * 0.4 : Math.random() * TAU, r = lerp(TUNE.domR[0], TUNE.domR[1], Math.random()) * [1, 0.85, 0.72, 0.72][ring], x = B.x + Math.cos(a) * r, y = B.y + Math.sin(a) * r * 0.8;
      const dx = x - B.x, dy = y - B.y, dl = Math.hypot(dx, dy) || 1, lx = x + dx / dl * TUNE.leeD, ly = y + dy / dl * TUNE.leeD;
      if (!inA(x, y, 1.4) || !inA(lx, ly, 1.0) || out.some(p => Math.hypot(p.x - x, p.y - y) < (ring < 2 ? 3.0 : 2.5))) continue;
      out.push({ x, y, an: Math.atan2(dy, dx), lee: { x: lx, y: ly }, i: out.length, ts: 0 }); }
    out.sort((p, q) => p.an - q.an); out.forEach((p, i) => { p.i = i; p.ts = UT.p1 + 0.3 + i * (1.4 / Math.max(1, out.length)); });
    return out;
  }
  function startDom(desp) {
    const m = S.m, k = kOf(); if (S.pad && S.pad.kind === 'shell') { if (m.hp > S.pad.base) m.hp = S.pad.base; S.pad = null; }
    S.pad = { kind: 'void', base: m.hp, buf: 1e7, t: 0 }; m.hp += S.pad.buf;
    const n = desp ? TUNE.domN[2] : TUNE.domN[Math.min(1, S.phase - 2)], seed = Math.random() * TAU;
    S.dom = { t: 0, desp: !!desp, pillars: pillarsFor(n, seed), hit: false, safe: false, seed: Math.random() * 1000, x: S.B.x, y: S.B.y, risen: 0 };
    S.B.vx = S.B.vy = 0; S.B.mv = 0;
    S.stat.dom++; say('dom', 'DOMINION OF THE WORLD PILLAR', 'Pillars rise: shelter behind one, away from Belial', COL.pale, 2.8); sfx('hum'); S.X.after(0.5, () => { if (S) sfx('sparkle'); });
  }
  function domTick(dt) {
    const J = S.dom, me = S.me, m = S.m, X = S.X, t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x, K = TUNE.domT, ut0 = domUT(t0), ut = domUT(t);
    if (t < K[1] && Math.random() < dt * 10) X.shake(1.5 + t, 0.08);
    for (const p of J.pillars) if (ut0 < p.ts && ut >= p.ts) { X.shake(5, 0.2); if (p.i % 2 === 0) sfx('thud'); X.ring(p.lee.x, p.lee.y, 0.2, TUNE.leeR * 1.3, 0.6, LEE, 0.12); J.risen++; }
    if (cross(K[1])) sfx('whoosh'); if (cross(K[2])) sfx('hum');
    if (t > K[3] && t < K[4] - 0.4 && Math.random() < dt * 8) X.shake(2 + (t - K[3]) * 2, 0.08);
    if (cross(K[4])) { X.flash(0.32, '#FFF0C8'); X.shake(lowFx() ? 14 : 24, 0.8); sfx('crash'); X.light(m.x, m.y, 10, 1.0); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.08); }
    if (cross(K[5])) { X.flash(0.26, '#FFE9A8'); X.shake(lowFx() ? 12 : 20, 0.6); sfx('crash'); S.X.after(0.15, () => { if (S) sfx('fanfare'); }); }
    if (t >= K[4] && t < K[4] + TUNE.domWin && !J.hit && !J.safe && !me.dead) {
      const inL = J.pillars.some(p => Math.hypot(me.x - p.lee.x, me.y - p.lee.y) < TUNE.leeR + me.r * 0.25);
      if (inL) { J.safe = true; S.stat.domSafe++; X.text(me.x, me.y - 1.6, 'Sheltered by the World Pillar', LEE, 14, { life: 1.3 }); X.ring(me.x, me.y, 0.3, 1.8, 0.5, LEE, 0.2); }
      else { const s2 = ST(), mx = s2 ? s2.hp : 300; let d = mx * TUNE.domK; if (me.hp >= mx * 0.97) d = Math.min(d, me.hp - 1);
        if (hurt(d, { dom: true })) { J.hit = true; S.stat.domHit++; X.text(me.x, me.y - 1.8, 'Crushed under Dominion!', COL.pale, 15); const an = Math.atan2(me.y - m.y, me.x - m.x); me.push = { vx: Math.cos(an) * 8, vy: Math.sin(an) * 8, t: 0.25 }; } } }
    if (t >= K[7]) endDom();
  }
  function endDom() { if (!S.dom) return; S.dom = null; if (S.pad && S.pad.kind === 'void') { S.m.hp = S.pad.base; S.pad = null; } S.idleT = 1.3; S.pick = 0; }

  /* ---- the defeat: it staggers, the citadel crumbles, its rings slow, the core dims, it dissolves into gold dust ---- */
  function onDeath() {
    if (!S || S.mode === 'dead' || S.mode === 'over') return; const m = S.m, X = S.X, g = S.g;
    S.mode = 'dead'; S.deadT = 0; abortActs(); S.dom = null; S.pad = null; S.fields.length = 0; S.lanes.length = 0; S.waves.length = 0; S.rocks.length = 0; S.sweeps.length = 0; S.slowK = 0; slowTick();
    S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1); g.slowT = 0; X.flash(0.8, '#FFFFFF'); g.hitStop = Math.max(g.hitStop || 0, 0.12); X.shake(18, 0.8); sfx('crash');
    m.act = 'dead';
  }
  function deadTick(dt) {
    const B = S.B, X = S.X, t0 = S.deadT; S.deadT += dt; const t = S.deadT, cross = x => t0 < x && t >= x, I = S.inst ? S.inst.fx : null;
    // the citadel crumbles: stones break off its back and fall round it, dust rolls out
    if (I && t > 0.4 && t < 3.0 && Math.random() < dt * 9 * LQ()) { const an = Math.random() * TAU, r = 0.6 + Math.random() * 1.8; I.push({ kind: 'chip', x: B.x + Math.cos(an) * r, y: B.y + Math.sin(an) * r * 0.6, z: 3 + Math.random() * 2.5, vx: Math.cos(an) * 1.5, vy: Math.sin(an) * 0.8, vz: 1 + Math.random() * 2, t: 0, life: 1.4, s: 0.16 + Math.random() * 0.16, seed: Math.random() * 90 | 0, rot: Math.random() * 6 }); }
    if (cross(0.5) || cross(1.2) || cross(2.0)) { X.shake(8, 0.3); sfx('thud'); if (I) { I.push({ kind: 'dust', x: B.x + (Math.random() - 0.5) * 2, y: B.y + (Math.random() - 0.5), R: 2.4, t: 0, life: 1.1, seed: Math.random() * 40 }); I.push({ kind: 'crack', x: B.x, y: B.y, R: 2.6, t: 0, life: 3.0, seed: 19, heat: 0.8 }); } }
    if (cross(1.6)) { X.banner('THE WORLD PILLAR FALLS', 'Belial kneels; its citadel crumbles into gold', COL.pale, 3.0, true, true); sfx('sparkle'); }
    if (cross(3.0)) { X.flash(0.4, '#FFF6E0'); X.light(B.x, B.y - 1, 8, 1.2); sfx('chime'); }
    if (t > 2.8 && t < 4.8 && Math.random() < dt * 16 * LQ()) X.part({ kind: 'star', x: B.x + (Math.random() - 0.5) * 4, y: B.y - Math.random() * 5, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random(), life: 1.2, max: 1.2, size: 2.6, color: Math.random() < 0.5 ? COL.gold : COL.pale });
    if (t >= TUNE.death) { const X2 = X; finish(); try { X2.winStage(); } catch (e) { /* (the stage already ended) */ } }
  }
  // the fight over (won): every hold and hook handed back; the body no longer drawn
  function finish() { if (!S) return; cleanup(); S.mode = 'over'; }

  /* ================= clean-up ================= */
  function cleanup() {
    if (!S) return; const g = S.g, m = S.m;
    try { S.acts.length = 0; S.lanes.length = 0; S.fields.length = 0; S.waves.length = 0; S.rocks.length = 0; S.sweeps.length = 0; S.dom = null; S.slowK = 0; } catch (e) {}
    try { if (S.pad && m && !m.dead) { if (S.pad.kind === 'shell') { if (m.hp > S.pad.base) m.hp = S.pad.base; } else m.hp = S.pad.base; } S.pad = null; } catch (e) {}
    try { if (g.mvMods) delete g.mvMods.tbcrown; S.slowOn = false; } catch (e) {}
    try { if (S.cine) { S.cine = false; if (g.cineT > 0) g.cineT = 0; } } catch (e) {}
    try { const R = S.X && S.X.rift, list = R && R.objs; if (list) for (const o of S.objs) { const i = list.indexOf(o); if (i >= 0) list.splice(i, 1); } for (const o of S.objs) o.draw = null; S.objs.length = 0; S.pil.length = 0; } catch (e) {}
    try { if (S.inst) S.inst.stop(); } catch (e) {} S.inst = null;   // (its effects dropped and Belial's GPU buffers freed: BELIAL_GL.release)
    try { if (m) { m.ownBar = null; m.goalFn = null; } } catch (e) {}
  }
  function stop() { if (!S) return; const s = S; try { cleanup(); } catch (e) {} try { const g = s.g, m = s.m; if (m && !m.dead) { m.dead = true; } if (g && g.boss === m) g.boss = null; } catch (e) {} S = null; }
  const active = () => !!(S && S.mode !== 'over');

  /* ================= the pose: the Anima's own (20g3: BELIAL_MOVES.poseFor for each power, ultPose for Dominion, easePose to ease
     it, BELIAL_GL.idlePose at rest), with what only the boss has laid over it: the intro's assembly and roar, the stagger, the
     barrier's charge, the tail's sweep, the phase's quickening, the fall ================= */
  const KIND = { rush: 'rush', crown: 'crown', car: 'carapace', stamp: 'stamp' };
  function poseOf(dt) {
    const B = S.B, m = S.m, G = GLB(), Mv = MV(), A = S.acts.find(q => q.kind !== 'sw'), W2 = S.acts.find(q => q.kind === 'sw');
    const base = G ? G.idlePose(3, B.at) : { k: 3, core: 0.85 };
    const pf = (kind, t, o) => (Mv && Mv.poseFor ? Mv.poseFor(kind, t, Object.assign({ base, k: 3 }, o)) : { core: 0.85 });
    let tg;
    if (S.dom && S.mode === 'fight') { tg = Mv && Mv.ultPose ? Mv.ultPose(domUT(S.dom.t)) : pf('rest', 0, {}); const K = TUNE.domT, back = sstep(K[6], K[7], S.dom.t);
      tg.dis = 0; tg.halo = 1; tg.monoDis = (tg.monoDis || 0) * (1 - back); tg.core = Math.max(0.85 * back, tg.core || 0); tg.ringK = Math.max(tg.ringK || 1, back); }   // (the Anima's dismissal is not the boss's: it stays, its monoliths re-form)
    else if (A && S.mode === 'fight' && !(A.kind === 'rush' && A.back)) { const t = A.kind === 'rush' ? A.t - A.t0 : A.t;
      tg = pf(KIND[A.kind], t, A.kind === 'rush' ? { wind: A.wind, charge: A.ct } : A.kind === 'crown' ? { dur: A.dur - 0.45 } : A.kind === 'car' ? { dur: A.up + TUNE.carDur, charge: carFill() } : A.kind === 'stamp' ? { n: A.n, gap: A.gap, tailT: A.tailT } : {}); }
    else tg = pf('rest', 0, {});
    tg.ringK = (tg.ringK || 1) + (S.phase - 1) * 0.3; tg.glow = (tg.glow || 0) + (S.phase - 1) * 0.06; tg.core = (tg.core == null ? 0.85 : tg.core) + (S.phase - 1) * 0.15;
    // the tail's sweep: cocked back over the tell, then swung round as the body pivots
    if (W2 && S.mode === 'fight' && !S.dom) { const tl = W2.tell, u = W2.t, cock = sstep(0, tl, u) * (1 - sstep(tl, tl + 0.1, u)), swing = bump(u, tl - 0.05, tl + 0.1, tl + 0.3, tl + 0.65);
      tg.tail = (tg.tail || 0) - 0.7 * cock * W2.dir + 1.7 * swing * W2.dir; tg.crouch = Math.max(tg.crouch || 0, 0.3 * cock); tg.head = (tg.head || 0) + 0.2 * cock; tg.live = Math.min(tg.live == null ? 1 : tg.live, 1 - 0.6 * cock);
      B.spin = 0.9 * W2.dir * sstep(tl - 0.05, tl + 0.45, u) * (1 - sstep(tl + 0.3, tl + 0.7, u)); } else B.spin = 0;
    if (S.mode === 'intro') { const e = S.introT; tg = Object.assign(tg, pf('roar', e - 3.2, {}));
      tg.asm = Math.max(0.04, sstep(0.4, 2.9, e)); tg.core = lerp(0, 1.6, sstep(2.3, 2.9, e)) + (tg.core - 0.85) * sstep(3.0, 3.3, e); tg.horn = Math.max(tg.horn || 0, sstep(2.6, 3.0, e) * (1 - sstep(3.6, 4.6, e))); tg.glow = (tg.glow || 0) + 0.6 * (1 - sstep(2.8, 4.4, e)); tg.ringK = (tg.ringK || 1) + 3 * (1 - sstep(2.6, 4.0, e)); }
    else if (S.mode === 'dead') { const e = S.deadT; tg = pf('rest', 0, {}); tg.stagger = Math.sin(Math.min(1, e / 0.6) * Math.PI) * 0.9 + 0.25 * Math.sin(e * 6) * (1 - sstep(0.6, 2.4, e));
      tg.crouch = 0.55 * sstep(0.4, 2.0, e); tg.head = 0.75 * sstep(0.5, 2.2, e); tg.cit = 0.5 * bump(e, 0.2, 0.8, 1.6, 2.6); tg.citUp = 0; tg.bast = -0.2 * sstep(0.8, 2.4, e); tg.mono = 0.4 * sstep(0.2, 1.2, e); tg.monoDis = sstep(0.8, 2.6, e);
      tg.core = lerp(1.4, 0.1, sstep(0.4, 2.8, e)); tg.ringK = lerp(1.2, 0.1, sstep(0.3, 2.6, e)); tg.eye = lerp(1, 0, sstep(0.6, 2.4, e)); tg.horn = 0; tg.jaw = 0.4 * bump(e, 0.1, 0.4, 0.9, 1.6); tg.live = 1 - sstep(0.3, 2.0, e);
      tg.dis = sstep(2.8, TUNE.death - 0.5, e); tg.halo = 1 - sstep(1.0, 2.6, e); }
    if (S.pad && S.pad.kind === 'shell' && S.mode === 'fight') { tg.core = (tg.core || 0.85) + 0.3 + 0.8 * carFill(); tg.glow = (tg.glow || 0) + 0.3 * carFill(); }
    if (m.stunT > 0 && S.mode === 'fight') { const u = Math.min(1, m.stunT / 0.6); tg.stagger = 0.6 * u + 0.25 * Math.sin(S.t * 7) * u; tg.crouch = Math.max(tg.crouch || 0, 0.35 * u); tg.ringK = (tg.ringK || 1) * 0.4; tg.eye = (tg.eye == null ? 1 : tg.eye) * 0.5; tg.head = (tg.head || 0) + 0.35 * u; tg.cit = 0; tg.live = (tg.live == null ? 1 : tg.live) * (1 - 0.6 * u); }
    if (m.flinch > 0) { m.flinch = Math.max(0, m.flinch - dt * 2.5); tg.stagger = Math.max(tg.stagger || 0, Math.sin(m.flinch * Math.PI) * 0.7); }
    S.charge = Math.max(0, (S.charge || 0) - dt * 0.12);
    const pz = Mv && Mv.easePose ? Mv.easePose(B, tg, dt) : (B.pz = tg);
    // the yaw: turned heavily toward its heading or the pet (a power's own turn quicker), the sweep's pivot on top
    if (S.mode === 'fight' && !S.dom && !(A && A.kind === 'rush' && A.go)) { const rate = (A && A.kind === 'rush' ? 2.4 : 1.4) * dt, dd = angD(B.yawT, B.yaw); B.yaw += Math.max(-rate, Math.min(rate, dd * Math.min(1, dt * 4) * 6)); }
    const vx = B.vx || 0, vy = B.vy || 0; B.ax = lerp(B.ax, (vx - B.lvx) / Math.max(dt, 1e-3), 0.3); B.ay = lerp(B.ay, (vy - B.lvy) / Math.max(dt, 1e-3), 0.3); B.lvx = vx; B.lvy = vy;
    if (G) try { G.springs(B, Math.max(-60, Math.min(60, B.ax)), Math.max(-60, Math.min(60, B.ay)), dt); } catch (e) {}
    if (!(A && A.kind === 'rush' && A.go)) { const sp = Math.hypot(vx, vy); B.mv += (cl(sp / 1.2) - B.mv) * Math.min(1, dt * 4); }
    B.blP = Object.assign(base, pz, { k: 3, t: B.at, yaw: B.yaw + B.spin + (S.dom ? (tg.yawOff || 0) : 0), ph: B.ph, mv: S.dom ? 0 : cl(B.mv), feet: pz.feet, asm: tg.asm == null ? 1 : tg.asm, dis: tg.dis || 0, monoDis: tg.monoDis || 0, halo: tg.halo == null ? 1 : tg.halo, live: pz.live, gaitK: A && A.kind === 'rush' && A.go ? 1.8 : 1 /* (v430 BP's motion hook: the charge's long stride, as moveBy's) */ });
    m.face = Math.cos(B.yaw) >= 0 ? 1 : -1;
  }

  /* ================= drawing ================= */
  function safeDraw(c, f) { if (!S || S.mode === 'over') return; c.save(); try { f(c); } catch (e) { if (!S.drawErr) { S.drawErr = 1; try { console.warn('Belial boss draw: ' + (e && e.message || e)); } catch (e2) {} } } c.restore(); }
  const sx = x => S.X.sx(x), sy = y => S.X.sy(y), Tz = () => S.X.Tz();
  const domArgs = o => { const J = S.dom; return Object.assign({ x: J.x, y: J.y, bx: S.B.x, by: S.B.y, t: domUT(J.t), seed: J.seed, k: 3, pillars: J.pillars, stand: true, noPillars: glOn() && gpu() }, o); };
  // the World Pillars, in three depth buckets round the pet and Belial (each one GPU pass; without the GPU, BELIAL_MOVES's own painter draws them)
  function pillarDepth() { const J = S.dom, o = S.pil; if (!o.length) return; if (!J || S.mode !== 'fight') { for (const q of o) q.y = -1e6; return; }
    const a = Math.min(S.me.y, S.B.y + 0.25), b = Math.max(S.me.y, S.B.y + 0.25); o[0].y = a - 0.02; o[1].y = (a + b) / 2; o[2].y = b + 0.02; S.cuts = [a, b]; }
  function drawPillars(c, i) {
    const J = S.dom; if (!J || S.mode !== 'fight' || !S.inst || !S.cuts || !(glOn() && gpu())) return; const [a, b] = S.cuts;   // (without the GPU, the shared painter draws them: domArgs leaves them to it)
    const parts = S.inst.domParts(domArgs({})).filter(q => { const y = J.pillars[q.i] ? J.pillars[q.i].y : 0; return i === 0 ? y < a : i === 1 ? y >= a && y < b : y >= b; });
    if (!parts.length) return; parts.sort((p, q) => p.z - q.z);
    c.save(); c.globalCompositeOperation = 'source-over'; try { GLB().drawParts(c, parts); } catch (e) {} c.restore();
  }
  /* the ground: the hush, its shadows, the Anima's ground effects, the lanes, the fields, the waves, the rocks' rings, the reach of the
     stampede and of the barrier, the tail's crescent, the Taurus sigil, Dominion's floor and the pillars' lee */
  function drawGroundLayer(c) {
    const T = Tz(), B = S.B, on = gpu(), g = S.g, X = S.X, W = X.W(), Hh = X.H();
    // the hush (the floor darkens, the colossus, the pet and the light keep their own): the intro, Dominion, the fall
    let dim = 0; if (S.mode === 'intro') dim = 0.42 * (1 - sstep(3.4, 5.4, S.introT)); if (S.mode === 'dead') dim = 0.3 * sstep(0, 0.6, S.deadT) * (1 - sstep(4.2, 5.4, S.deadT));
    if (S.dom) { const t = S.dom.t, K = TUNE.domT; dim = Math.max(dim, 0.55 * sstep(0, 1.0, t) * (1 - 0.3 * sstep(K[4], K[4] + 0.4, t)) * (1 - sstep(K[6], K[7], t))); }
    if (dim > 0.005) { const fx = sx(B.x), fy = sy(B.y) - T * 2, gr = c.createRadialGradient(fx, fy, Math.min(W, Hh) * 0.1, fx, fy, Math.max(W, Hh) * 0.8); gr.addColorStop(0, `rgba(14,8,4,${(dim * 0.4).toFixed(3)})`); gr.addColorStop(1, `rgba(6,3,2,${Math.min(0.9, dim * 1.4).toFixed(3)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); }
    const r = B.blOut && B.blOut.r, al = B.alpha * (1 - (B.blP ? B.blP.dis || 0 : 0));
    if (!on) { if (typeof shadeSprite === 'function') { c.globalAlpha = 0.4 * al; blitSized(c, shadeSprite('#05030A'), sx(B.x) - T * 2.4, sy(B.y) - T * 0.8, T * 4.8, T * 1.6); c.globalAlpha = 1; } if (S.inst) try { S.inst.drawGround(c); } catch (e) {} drawGround2d(c); if (S.dom && S.inst) try { S.inst.drawDominion(c, domArgs({ groundOnly: true })); } catch (e) {} return; }
    { const Q = fgOpen(c); if (r && al > 0.02) { Q.sshadow(r.ground[0], r.ground[1], T * 2.3, T * 0.95, 0.45 * al, '#120A05'); for (const p of r.feet) Q.sshadow(p[0], p[1], T * 0.55, T * 0.26, 0.5 * al, '#0C0804'); } else Q.sshadow(sx(B.x), sy(B.y), T * 2.3, T * 0.95, 0.35, '#120A05'); fgClose(c); }
    if (S.inst) try { S.inst.drawGround(c); } catch (e) {}
    if (S.dom && S.inst) try { S.inst.drawDominion(c, domArgs({ groundOnly: true })); } catch (e) {}
    const Q = fgOpen(c);
    // the intro's Taurus sigil, drawn on over the court's carved heart
    if (S.mode === 'intro') { const e = S.introT, fade = 1 - sstep(4.4, 5.6, e), R = T * 3.9; if (fade > 0.01) { Q.quad(193, sx(B.x), sy(B.y), R, 0, 0, R, COL.gold, fade, sstep(0, 1.4, e) + 0.5 * bump(e, 3.1, 3.3, 3.6, 4.4), e * 0.15, 1 + 0.5 * bump(e, 3.1, 3.3, 3.6, 4.4)); Q.glow(sx(B.x), sy(B.y), R * 1.2, COL.amber, 0.22 * fade); } }
    for (const L of S.lanes) laneGround(Q, L, T);
    for (const f of S.fields) fieldGround(Q, f, T);
    for (const w of S.waves) { const u = w.t / w.dur, R = w.R * T, X0 = sx(w.x), Y0 = sy(w.y), fade = 1 - sstep(0.7, 1 + 0.45 / w.dur, u); if (R > 2 && fade > 0.01) { Q.quad(196, X0, Y0, R / 0.95, 0, 0, R / 0.95, w.tag === 'car' ? COL.pale : COL.gold, fade * (w.vis || 1), eout(u) * 0.95, w.x * 7 + w.y, (w.big ? 1.5 : 1.1) * fade); Q.glow(X0, Y0, R * eout(u) * 1.05, COL.amber, 0.14 * fade * (w.vis || 1)); } }
    for (const rk of S.rocks) { if (rk.dud) continue; const k2 = sstep(0, rk.land, rk.t), X0 = sx(rk.x), Y0 = sy(rk.y), R = rk.R * T, hot = sstep(rk.land - 0.45, rk.land, rk.t), fade = 1 - sstep(rk.land, rk.land + 0.3, rk.t);
      Q.quad(124, X0, Y0, R * 1.25, 0, 0, R * 1.25, UNDER, (0.25 + 0.25 * k2) * fade, 0.82, 0.14, 0); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.gold, (0.5 + 0.5 * hot) * fade, 0.8, 1.2, 0.7 + 0.8 * hot); Q.glow(X0, Y0, R * 0.9, COL.amber, (0.12 + 0.3 * hot) * fade); }
    // the stampede's reach: a ring of gold round its stomping feet, pulsing as each foot rises
    for (const A of S.acts) if (A.kind === 'stamp') { const f = frontOf(0.95), X0 = sx(f.x), Y0 = sy(f.y), R = A.R * T, e = sstep(0, 0.35, A.t) * (1 - sstep(A.dur - 0.6, A.dur, A.t)), ph = A.t < 0.45 ? A.t / 0.45 : ((A.t - 0.45) / A.gap) % 1, pk = A.t < 0.45 ? sstep(0, 0.45, A.t) : 1 - Math.abs(ph - 0.75) * 1.4;
      if (e > 0.01) { Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, UNDER, 0.32 * e, 0, TAU * 0.999, 0.1); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.gold, (0.45 + 0.4 * cl(pk)) * e, 0.8, 0.8, 0.9); } }
    // the barrier's reach: a pale ring growing with what it holds
    if (S.pad && S.pad.kind === 'shell') { const P = S.pad, X0 = sx(S.m.x), Y0 = sy(S.m.y), R = carR() * T, a = Math.min(1, P.t / 0.3) * Math.min(1, (P.life - P.t) / 0.3 + 0.3), pul = 0.5 + 0.5 * Math.sin(g.t * (4 + carFill() * 6)), hot = sstep(P.life - 1.0, P.life, P.t);
      Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, UNDER, 0.34 * a, 0, TAU * 0.999, 0.09); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.pale, (0.45 + 0.25 * pul + 0.3 * hot) * a, 0.8, -0.6, 1 + 0.4 * hot); Q.quad(194, X0, Y0, R * 0.95, 0, 0, R * 0.95, COL.gold, 0.25 * a * (0.4 + carFill()), 0.2 + 0.6 * carFill(), 0, 0.7); }
    // the tail's crescent: the floor round it lights, a light running round as the anchor cocks
    for (const w of S.sweeps) if (w.t < w.tell + 0.25) { const k2 = sstep(0, w.tell, w.t), X0 = sx(S.m.x), Y0 = sy(S.m.y), R = TUNE.swR * T, head = w.a0 + w.dir * (k2 * 1.2 + sstep(w.tell, w.tell + 0.25, w.t) * 3), fade = 1 - sstep(w.tell, w.tell + 0.25, w.t);
      Q.quad(124, X0, Y0, R * 1.08, 0, 0, R * 1.08, UNDER, (0.2 + 0.2 * k2) * fade, 0.9, 0.1, 0); Q.quad(120, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.gold, (0.35 + 0.55 * k2) * fade, head, TAU * 0.999, 0.42); Q.quad(120, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.pale, (0.2 + 0.4 * k2) * fade, head, 1.6, 0.12); }
    // Dominion: the lee of each risen pillar, a warm pool brightening toward the slam
    if (S.dom) leeGround(Q, T);
    fgClose(c);
  }
  function laneGround(Q, L, T) {
    const A = L.A, fade = L.end >= 0 ? 1 - cl((L.t - L.end) / 0.7) : 1; if (fade <= 0.01) return;
    const from = L.end < 0 && A.go && L.prog != null ? Math.max(0, L.prog - 0.5) : 0, x0 = sx(L.x0 + L.ux * from), y0 = sy(L.y0 + L.uy * from), x1 = sx(L.x0 + L.ux * L.len), y1 = sy(L.y0 + L.uy * L.len);
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hx = (x1 - x0) / 2, hy = (y1 - y0) / 2, hl = Math.hypot(hx, hy) || 1, w = L.w * 0.5 * T, nx = -hy / hl * w, ny = hx / hl * w;
    const k = cl(L.t / L.tell), in0 = sstep(0, 0.25, L.t), pul = 0.5 + 0.5 * Math.sin(S.g.t * 12 + L.seed), live = L.end < 0 ? 1 : 0.6;
    Q.quad(144, mx, my, hx, hy, nx * 1.5, ny * 1.5, UNDER, (0.4 + 0.25 * k) * in0 * fade);   // (the soft dark band: it reads on the pale floor)
    Q.quad(128, mx, my, hx, hy, nx * 0.9, ny * 0.9, COL.amber, (0.3 + 0.3 * k) * in0 * fade * live, 3 + k * 6, L.seed + 7);
    Q.quad(128, mx, my, hx, hy, nx * 0.6, ny * 0.6, COL.gold, (0.45 + 0.4 * k + 0.12 * pul * k) * in0 * fade * live, 5 + k * 10, L.seed + 3);
    for (const s of [1, -1]) { Q.rbeam(x0 + nx * s, y0 + ny * s, x1 + nx * s, y1 + ny * s, T * (0.22 + 0.1 * k), COL.amber, (0.18 + 0.2 * k) * in0 * fade * live, 1, 1); Q.rbeam(x0 + nx * s, y0 + ny * s, x1 + nx * s, y1 + ny * s, T * (0.06 + 0.04 * k), COL.pale, (0.5 + 0.45 * sstep(0.3, 1, k)) * in0 * fade * live, 1, 1); }
    if (L.end < 0 && !A.go) { const fx = x0 + (x1 - x0) * k, fy = y0 + (y1 - y0) * k; Q.rbeam(x0, y0, fx, fy, T * 0.2, COL.gold, 0.55 * in0, 0, 1); Q.glow(fx, fy, T * 0.9, COL.pale, 0.45 * in0); Q.glow(x1, y1, T * 1.2, COL.amber, 0.25 * k * in0); }
  }
  function fieldGround(Q, f, T) {
    const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * T, op = eout(f.t / Math.max(0.3, f.open)), fade = f.end ? 1 - cl((f.t - f.endT) / 0.5) : 1, live = f.t > f.open && !f.end ? 1 : 0.5, hot = sstep(f.open + f.on - 1, f.open + f.on, f.t);
    Q.quad(124, X0, Y0, R * 1.14 * Math.max(0.15, op), 0, 0, R * 1.14 * Math.max(0.15, op), UNDER, (0.3 + 0.12 * live) * fade, 0.84, 0.18, 0);
    Q.quad(194, X0, Y0, R * Math.max(0.1, op), 0, 0, R * Math.max(0.1, op), COL.gold, (0.4 * live + 0.12) * fade, 0.3 + 0.7 * hot, 0, 0.9 * fade);
    Q.quad(192, X0, Y0, R / 0.8 * Math.max(0.1, op), 0, 0, R / 0.8 * Math.max(0.1, op), COL.gold, (0.5 + 0.3 * live) * fade, 0.8, 1.0, 1);
    if (f.t > f.open && !f.end) Q.glow(X0, Y0, TUNE.crCore * T, COL.pale, 0.08 + 0.2 * hot);
  }
  function leeGround(Q, T) {
    const J = S.dom, K = TUNE.domT, t = J.t, ut = domUT(t), hot = sstep(K[4] - 1.6, K[4], t), out = 1 - sstep(K[4] + 0.3, K[4] + 1.0, t);
    for (const p of J.pillars) { const on = sstep(p.ts, p.ts + 0.6, ut) * out; if (on < 0.01) continue; const X0 = sx(p.lee.x), Y0 = sy(p.lee.y), R = TUNE.leeR * T, pul = 0.5 + 0.5 * Math.sin(t * 5 + p.i);
      Q.glow(X0, Y0, R * 2.0, LEE, (0.35 + 0.35 * hot) * on); Q.quad(192, X0, Y0, R / 0.8, 0, 0, R / 0.8, LEE, (0.8 + 0.2 * pul) * on, 0.8, 0.6, 1 + 0.6 * hot); Q.glow(X0, Y0, R * 0.9, '#FFFFFF', (0.18 + 0.3 * hot) * on);
      const px = sx(p.x), py = sy(p.y); Q.beam(px, py, X0, Y0, T * 0.5, LEE, 0.12 * on); }
  }
  function drawGround2d(c) {
    const T = Tz(); c.save(); c.globalCompositeOperation = 'lighter';
    for (const L of S.lanes) { if (L.end >= 0) continue; const k = cl(L.t / L.tell); softRay(c, sx(L.x0), sy(L.y0), sx(L.x0 + L.ux * L.len), sy(L.y0 + L.uy * L.len), T * L.w, COL.gold, 0.2 + 0.35 * k); }
    for (const f of S.fields) { const op = eout(f.t / f.open), fade = f.end ? 1 - cl((f.t - f.endT) / 0.5) : 1; c.globalAlpha = 0.35 * fade; blitSized(c, glowSprite(COL.gold), sx(f.x) - f.R * T * op, sy(f.y) - f.R * T * op, f.R * T * 2 * op, f.R * T * 2 * op); }
    for (const rk of S.rocks) if (!rk.dud && rk.t < rk.land) { const R = rk.R * T; c.globalAlpha = 0.45; blitSized(c, glowSprite(COL.amber), sx(rk.x) - R, sy(rk.y) - R, R * 2, R * 2); }
    if (S.pad && S.pad.kind === 'shell') { const R = carR() * T; c.globalAlpha = 0.3; blitSized(c, shockSprite(COL.pale), sx(S.m.x) - R, sy(S.m.y) - R, R * 2, R * 2); }
    for (const w of S.sweeps) if (w.t < w.tell) { const R = TUNE.swR * T; c.globalAlpha = 0.3 + 0.3 * cl(w.t / w.tell); blitSized(c, shockSprite(COL.gold), sx(S.m.x) - R, sy(S.m.y) - R, R * 2, R * 2); }
    if (S.dom) for (const p of S.dom.pillars) { const R = TUNE.leeR * T * 1.4; c.globalAlpha = 0.7; blitSized(c, glowSprite(LEE), sx(p.lee.x) - R, sy(p.lee.y) - R, R * 2, R * 2); }
    c.restore();
  }
  /* the body: its aura, the model (GPU, or its cel model), the light over it */
  function drawBodyLayer(c) {
    const B = S.B, T = Tz(), X0 = sx(B.x), Y0 = sy(B.y), size = T * TUNE.size, al = B.alpha; if (!(al > 0.01) || !B.blP) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.2 + 0.05 * Math.sin(B.at * 1.6)) * al * (1 - (B.blP.dis || 0)); const gs = size * 0.6; blitSized(c, glowSprite(S.phase >= 3 ? COL.amber : '#FFB347'), X0 - gs, Y0 - size * 0.45 - gs, gs * 2, gs * 2); c.restore();
    const fk = Math.cos(B.yaw) >= 0 ? 1 : -1;
    c.save(); try { AnimaArt.draw(c, 'taurus', 3, X0, Y0, size, B.at, { inst: B, alpha: al, aura: false, fk, flip: fk < 0, mv: B.blP.mv, ph: B.ph }); } finally { c.restore(); }
    { const st2 = B.blOut && B.blOut.r && B.blOut.r.steps; if (st2 && st2.length) S.steps = (S.steps || []).concat(st2).slice(-8); }   // (the model's own settling and idle steps (BELIAL_GL.motion): a puff of dust each, next frame)
    if (S.inst && B.blOut && B.blOut.r && gpu()) try { S.inst.bodyLight(c, B.blOut.r, B.blP, al * (1 - (B.blP.dis || 0) * 0.8), B.at); } catch (e) {}
    if (S.m.flash > 0 && S.mode === 'fight') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18; const s2 = size * 0.4; blitSized(c, glowSprite('#FFFFFF'), X0 - s2, Y0 - size * 0.45 - s2, s2 * 2, s2 * 2); c.restore(); }
  }
  /* the sky: the Anima's own effects (rocks, chips, rings over the pet, the shoulders' rings, the intro's rings and pillars), the
     barrier's dome, the fields' hanging rings, Dominion's sky, the pillars' shafts of light, the gold dust of the fall */
  function drawSkyLayer(c) {
    const T = Tz(), g = S.g, on = gpu(), B = S.B;
    if (S.inst) try { S.inst.drawFx(c); } catch (e) {}
    if (S.dom && S.inst) try { S.inst.drawDominion(c, domArgs({ skyOnly: true, r: B.blOut && B.blOut.r })); } catch (e) {}
    if (!on) return;
    const Q = fgOpen(c);
    // the barrier: a layered dome of gilded masonry over the colossus, rippling where it is struck
    if (S.pad && S.pad.kind === 'shell') { const P = S.pad, Rd = T * TUNE.size * 0.5 * (1 + 0.02 * Math.sin(g.t * 3)), X0 = sx(B.x), Y0 = sy(B.y) - Rd * 0.55, a = Math.min(1, P.t / 0.35) * (0.55 + 0.45 * cl(P.left / P.pool)), hc = P.hit ? Math.floor(Math.min(9, P.hit[0] * 10) + 1) + ((P.hit[1] / TAU) % 1 + 1) % 1 : 0;
      Q.quad(197, X0, Y0, Rd, 0, 0, Rd * 0.88, COL.gold, 0.6 * a, 0, g.t * 0.2, hc); Q.quad(206, X0, Y0, Rd * 0.94, 0, 0, Rd * 0.94 * 0.82, COL.amber, 0.5 * a, carFill(), -g.t * 0.12, hc) /* (v430 BP's rune lattice) */; Q.quad(197, X0, Y0, Rd * 0.86, 0, 0, Rd * 0.76, COL.amber, 0.38 * a, 1, -g.t * 0.3, 0); Q.glow(X0, Y0, Rd * 1.1, COL.amber, 0.12 * a + 0.2 * carFill() * a); }
    // the fields: gold rings hanging over them, coming down as they hold
    for (const f of S.fields) { const k2 = sstep(f.open * 0.6, f.open, f.t) * (f.end ? 1 - cl((f.t - f.endT) / 0.4) : 1); if (k2 < 0.01) continue; const prog = cl((f.t - f.open) / f.on), X0 = sx(f.x), Y0 = sy(f.y);
      for (let j = 0; j < (lowFx() ? 1 : 2); j++) { const h = T * (2.6 - j * 0.9) * (1 - 0.8 * prog) + T * 0.2, R = f.R * T * (0.75 - 0.15 * j); Q.quad(192, X0, Y0 - h, R / 0.8, 0, 0, R / 0.8 * 0.4, COL.gold, 0.6 * k2, 0.8, (j ? -1 : 1) * 1.4, 0.9); } }
    // the lee's columns of light from the sky down to the floor (glow only)
    if (S.dom) { const J = S.dom, K = TUNE.domT, ut = domUT(J.t), hot = sstep(K[4] - 1.6, K[4], J.t), out = 1 - sstep(K[4] + 0.3, K[4] + 1.0, J.t);
      for (const p of J.pillars) { const pk = sstep(p.ts, p.ts + 0.6, ut) * out; if (pk < 0.01) continue; const px = sx(p.lee.x), py = sy(p.lee.y); Q.shafts(px, py - T * 6, px, py, T * TUNE.leeR * 0.9, LEE, (0.45 + 0.35 * hot) * pk, p.i * 10);
        for (let i = 0; i < 3 * LQ(); i++) { const v = (J.t * 0.4 + i / 3) % 1; Q.star(px + Math.sin(i * 2.1 + J.t) * T * TUNE.leeR * 0.6, py - v * T * 3, T * 0.12, pk * (1 - v), COL.white); } } }
    // the fall: gold dust rising as it dissolves
    if (S.mode === 'dead') { const e = S.deadT, u = sstep(2.6, TUNE.death, e); if (u > 0.01) { Q.quad(199, sx(B.x), sy(B.y) - T * TUNE.size * 0.45, T * TUNE.size * 0.6, 0, 0, T * TUNE.size * 0.55, COL.gold, Math.sin(Math.PI * u), u, 7, 0.9); Q.glow(sx(B.x), sy(B.y) - T * TUNE.size * 0.4, T * TUNE.size * 0.5, COL.pale, 0.25 * Math.sin(Math.PI * u)); } }
    if (S.mode === 'intro') { const e = S.introT, u = bump(e, 0.3, 1.0, 2.4, 3.2); if (u > 0.01) Q.quad(199, sx(B.x), sy(B.y) - T * TUNE.size * 0.4, T * TUNE.size * 0.55, 0, 0, T * TUNE.size * 0.5, COL.gold, u, 1 - u, 3, 0.8); }
    fgClose(c);
  }

  /* ---- the health bars (in the HUD's place, 20b: m.ownBar): one stacked bar of TUNE.bars, its count, the phase pips, the barrier's pool over it ---- */
  function drawBar(c, W) {
    if (!S || S.mode === 'over') return; const m = S.m; if (m.dead && S.mode !== 'dead') return;
    const left = Math.max(0, realHp()), bar = S.barHP, n = Math.max(0, Math.ceil(left / bar - 1e-9)), cur = n ? (left - (n - 1) * bar) / bar : 0;
    S.barShow = S.barShow == null ? n - 1 + cur : S.barShow + ((n - 1 + cur) - S.barShow) * 0.06; if (Math.abs(S.barShow - (n - 1 + cur)) > 1.2) S.barShow = n - 1 + cur;
    const bw = Math.min(140, W * 0.36), x0 = W - 12 - bw, by = 10 + Math.min(88, W * 0.24) + 14, cols = ['#FFC24D', '#E8B850', '#F2E8D2', '#FF9A2E', '#C99A4A', '#FFE9A8', '#B88A40', '#FFFFFF'];
    c.save(); c.globalAlpha = 0.92;
    GFX.labelS(c, 'BELIAL', x0, by, 8.5, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'left');
    for (let i = 0; i < 3; i++) { const px = x0 + bw - 26 - (2 - i) * 8, onP = i < S.phase; c.fillStyle = onP ? COL.gold : 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(px, by - 3.5); c.lineTo(px + 3, by); c.lineTo(px, by + 3.5); c.lineTo(px - 3, by); c.closePath(); c.fill(); }
    const bh = 5, yb = by + 7, ci = Math.max(0, n - 1), under = n > 1 ? cols[(ci - 1) % cols.length] : null, colNow = cols[ci % cols.length];
    c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, x0 - 1, yb - 1, bw + 2, bh + 2, 4); c.fill();
    if (under) { c.fillStyle = hexA(under, 0.6); GFX.rr(c, x0, yb, bw, bh, 3); c.fill(); }
    const showCur = cl(S.barShow - ci); if (showCur > cur) { c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, x0, yb, Math.max(6, bw * showCur), bh, 3); c.fill(); }
    if (cur > 0) { const gr = c.createLinearGradient(x0, 0, x0 + bw, 0); gr.addColorStop(0, shadeC(colNow, -0.25)); gr.addColorStop(1, colNow); c.fillStyle = gr; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh * 0.4, 2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 5; i++) c.fillRect(x0 + bw * i / 5, yb + 1, 1, bh - 2);
    // the barrier's pool: a pale band over the bar
    if (S.pad && S.pad.kind === 'shell') { const k2 = cl(S.pad.left / S.pad.pool); c.fillStyle = 'rgba(255,233,168,.88)'; GFX.rr(c, x0, yb - 4, Math.max(4, bw * k2), 2.5, 1.2); c.fill(); }
    if (S.pad && S.pad.kind === 'void') { c.globalAlpha = 0.5 + 0.3 * Math.sin(S.g.t * 6); c.strokeStyle = COL.pale; c.lineWidth = 1.2; GFX.rr(c, x0 - 1.5, yb - 1.5, bw + 3, bh + 3, 4); c.stroke(); c.globalAlpha = 0.92; }
    GFX.labelS(c, `×${n}`, x0 + bw, by, 9, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    c.restore();
  }
  const hexA = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };

  /* ---- for the harness ---- */
  const test = {
    get S() { return S; }, AR, start, startDom, endDom, abortActs, phaseUp, carR, carMul, carFill, domUT, realHp: () => (S ? realHp() : 0),
    hold(on) { if (S) S.noAI = !!on; },
    force(kind) { if (!S || S.mode !== 'fight') return null; abortActs(); S.idleT = 99; S.swCd = 99; if (S.dom) endDom(); if (kind === 'dom') { startDom(false); return S.dom; } return start(kind); },
    skipIntro() { if (!S || S.mode !== 'intro') return; S.introT = TUNE.intro - 0.01; },
  };
  // (the gate asks these: 20q forwards its module's update, ground, over, camera, goal, HUD and boss death to them while the fight is on)
  const cam = () => (S && S.mode !== 'over' ? camOf() : null), goal = () => (S ? goalText() : ''), hideHud = () => false, onBossDeath = mm => !!(S && mm === S.m && (onDeath(), true));
  return { begin, active, stop, update, drawGround() {}, drawOver() {}, cam, goal, hideHud, onBossDeath, TUNE, test };
})();
if (typeof self !== 'undefined') self.TAURUS_BOSS = TAURUS_BOSS;
