/* ---------- (v420 CB) The Gate of Cancer's guardian: ABADDON, THE ETERNAL MOONLIGHT, as a boss ----------
   Beyond the Oracle Shell's sealed door (20o, the arena and its door are ENV's), the Cancer Anima itself turned against the
   pet: the same model and art (ABADDON_GL, 02f3, posed every frame; its cel model, 02f2, where the GPU is not) and the same
   powers' pictures and poses, called into rather than copied (20g2-abaddon-moves.js: ABADDON_MOVES.poseFor / easePose for every
   power's pose, a private ABADDON_MOVES.create instance for its effect layer, inst.bodyLight for the light over the body and
   inst.drawTide9 for the whole Ninth Tide; its FGFX kinds 120-132, its GLM blades and sea), aimed at the pet:
     Lunar Carapace      it folds and a sphere of lunar panels closes round it: damage soaks into the shell (its pool shown
                         over the health bar) before its health drops. Broken: it staggers, open (x1.5 damage, the engine's
                         stunned boss). Whatever the shell soaked up, broken or not, is STORED in its Heart.
     Crescent Reavers    its arms telescope, its claws split into crescent blades: crossing sickle slashes swept across the
                         whole arena through where the pet stands, a pale-blue filament of light along each path first (the
                         tell), then the blade. Step off the crossing, or roll through. More pairs, faster, by phase.
     Gravitational Tide  rings open on the floor round the pet (the tell: the field draws itself out from its middle), then
                         gravity turns over: the pet is lifted and dragged toward the middle, with a tick of damage, and the
                         field collapses in its core at the end. Run out against the pull, or roll out.
     Eclipse Requiem     it seals itself in its black-moon sphere: every blow is STORED (the numbers still show; the corona
                         brightens and the pale ring of its reach on the floor grows with them), then the shell snaps open in
                         a shockwave scaled by everything stored (the Carapace's share too). Stop attacking and back off.
     Claw sweep          stand close for long and one claw's cutting edge lights, a crescent of light on the floor, then the
                         sweep: a heavy punish with knockback.
     The Ninth Tide      at each phase break and once more near death: the eclipse, the sea lifted, the compression and the
                         crushing blast. Pockets of warm moonlight open in the arena (glow only): stand in one at the blast.
                         Outside, a heavy blow (never lethal from full health). It cannot be harmed while it calls the Tide.
   Three phases (I The Waxing Crescent 100-66%, II The Full Moon 66-33%, III The Black Moon 33-0%): faster combos, more
   Reavers; phase III runs two powers at once. Every number is in TUNE (below, with how it was set against Uldroth).
   Tells are glow only: filaments, opening fields, rings of light; no red, no numbers.
   The engine's machinery as the Belfry's bosses have it: a boss intro (the lunar seal overhead, the descent in its shell,
   the unfolding, the name banner "ABADDON" / "The Eternal Moonlight", the camera on it), stacked health bars with phase pips
   (m.ownBar, drawn in the HUD's place, 20b), phases with banners and orbs, healing light shaken loose by blows (as 20h's
   fiends), m.belHard (the Belfry's 5x blows), the boss immunities (m.boss, m.still, m.fiend: never lifted, frozen, knocked
   back or feared; stuns a quarter), a defeat cinematic and then X.winStage().
   CANCER_BOSS: begin(X, H, self, { cx, cy, r, ax0, ay0, ax1, ay1 }) (the gate calls it when the pet enters the arena: its
   centre, radius and walkable bounds), active(), stop() (every bit of clean-up: the gate's teardown; also run when the next
   stage is made, BEL.onRelease), update(dt) (the gate may call it from its update; begin also chains itself onto the gate
   module's update, and a second call in one frame is ignored), drawGround(c) / drawOver(c) (nothing to do: the body, its
   ground and its sky are three of the gate's own objects, H.obj, drawn in depth order), TUNE, test (the harness's handles).
   Begin also chains onto the gate module's cam, goal, hint and onBossDeath for the fight, and hands them back at its end.
   Clean-up (stop, the defeat, the pet's death, the stage's end): no lifted pet, no shield or seal left on its health, the
   camera's zoom and the cinematic hold given back, its objects off the stage, its effects and references released. */
const CANCER_BOSS = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3);
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const LQ = () => (lowFx() ? 0.5 : 1);
  const COL = { sap: '#6FA2FF', ice: '#BFD8FF', white: '#EAF2FF', deep: '#2448B8', teal: '#7FE6FF', gold: '#E8C27A', night: '#03050E', lilac: '#C9B4FF', violet: '#9A7CFF', moon: '#FFF2D2' };
  /* ================= the tuning =================
     Against Uldroth (20t5, the Drowned Belfry's last boss: TUNE.hp 28000*4 = 112000 in 9 bars, armour 0.62 on every body
     blow, blows TUNE.dmg 21 x belHard 5: jaw 131, undertow 147, wave 136; his flood 2.1x the pet's health), measured the same
     way for both by tests/_cb-tune.js: a level-30 bot pet held still at 3 and at 6 tiles, 160 raw damage a second into the
     boss (D.hitMon, no crits; about the dps Uldroth's own tuning assumed), the game stepped at 1/30 s, to the kill.
     Uldroth (8 runs): 946-1132 s to kill (mean ~1090); full blows (100+) ~138; 1200-1400 damage a minute taken (his floods
     included; ~1310 at 3 tiles, ~1220 at 6). Abaddon (these numbers, v420 CB second pass): 1145-1386 s (mean ~1290, ~1.19x);
     ~1710 a minute at 3 tiles (1.22-1.23x: the claw punishes a pet that stays under it) and ~1405 at 6 (1.12-1.18x); full
     blows ~142 (Reavers 150, claw 144, the Tide's collapse 108, the Requiem 102-184 by its charge); its shelter blow (the
     Ninth Tide, 0.8x health) is heavy but, unlike his flood, never lethal from full health. */
  const TUNE = {
    hp: 178000, bars: 10,          // its health, absolute (TUNE.hp in TUNE.bars bars), whatever the gate's floor
    dmg: 24, hard: 5,              // a unit blow, absolute (m.dmg), and the Belfry's rule (m.belHard: 5x): 120 a unit blow
    cuts: [1, 0.66, 0.33], desp: 0.12,   // the phases' thresholds (of its health); the last Ninth Tide
    size: 5.4, r: 1.75, hover: 0.5, keep: 5.2, spd: [1.5, 1.8, 2.1],   // drawn size (tiles tall), body radius, float height, distance it keeps, drift speed
    intro: 4.8, death: 4.8,        // the intro and the fall (s)
    idle: [3.8, 3.3, 2.8],         // the breath between powers, by phase
    refDps: 150,                   // the damage a second it expects from the pet (Uldroth's bots: 85-145): the floor of its reading of the pet's
                                   // own (S.dps, an average over ~10 s of what the pet deals), which sizes the Carapace and the Requiem's charge
    heal: 0.045, healCd: 1.1,      // healing light shaken loose: an orb every this share of a bar dealt (as 20h's fiends)
    // Crescent Reavers: pairs of crossing slashes; the tell, the gap between pairs, blade speed (tiles/s), path width, blow (x m.dmg), lead on the pet's motion (s)
    revPairs: [2, 2, 3], revTell: [0.95, 0.8, 0.7], revGap: [0.65, 0.55, 0.45], revOff: [2.6, 3.8],   // (the first pair crosses on the pet; the rest cross 2.6-3.8 tiles away, never through where it stands: they close its ways out)
    revSpd: 26, revW: 1.5, revK: 1.25, revLead: 0.22, revWind: 0.45,
    // Gravitational Tide: field radius, the opening (tell), how long it pulls, pull speed (tiles/s; the pet walks 4.3), tick (s) and blow, the core's collapse
    tideR: [4.2, 4.6, 5.0], tideOpen: [1.0, 0.85, 0.75], tideDur: [3.0, 3.3, 3.6], tidePull: [2.3, 2.55, 2.8], tideTick: 1.2, tideK: 0.2, tideCore: 1.7, tideEndK: 0.9, lift: 0.45,
    // Lunar Carapace: its pool (seconds of the pet's own damage), how long it holds, the stagger when broken, the share of what it soaked that is stored
    carSec: [4.5, 5, 5.5], carDur: 7, carStag: 3.2, carStore: 0.6,
    // Eclipse Requiem: the seal (s); its charge is what it stored over eclFill seconds of the pet's own damage (0..1): the reach grows
    // from eclR0 to eclRmax tiles and the blow (x m.dmg) from eclK to eclK x (1 + eclCap) with it
    eclSeal: [3.2, 2.9, 2.6], eclFill: 2.4, eclR0: 4.2, eclRmax: 7.6, eclK: 0.85, eclCap: 0.8,
    // claw sweep: its reach, the tell, the blow, how long the pet stays close first, its cooldown
    swR: 3.4, swTell: [0.55, 0.48, 0.42], swK: 1.2, swNear: 2.0, swCd: 20,
    // The Ninth Tide: its length, the blast, the window the blast holds, a pocket's radius, the blow outside (a share of the pet's health: never lethal from full)
    t9Len: 7.6, t9Open: 1.0, t9Strike: 5.5, t9Win: 0.7, t9PR: [1.45, 1.35, 1.25], t9K: 0.8,
  };
  const PH_NAMES = ['The Waxing Crescent', 'The Full Moon', 'The Black Moon'];
  const CYC = { 1: ['rev', 'tide', 'car', 'rev', 'ecl'], 2: ['rev', 'tide', 'car', 'rev', 'ecl', 'tide'], 3: ['rev+tide', 'car', 'ecl+rev', 'tide'] };
  let S = null;   // the fight in progress
  const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
  const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
  const glOn = () => typeof ABADDON_GL !== 'undefined' && ABADDON_GL.usable();
  const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
  const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (S) stop(); S = null; }); } catch (e) { /* (no Belfry hook) */ }

  /* ================= the arena ================= */
  const AR = { cx: 0, cy: 0, rx: 8, ry: 6 };
  const inA = (x, y, pad) => { const rx = Math.max(0.5, AR.rx - (pad || 0)), ry = Math.max(0.5, AR.ry - (pad || 0)); return ((x - AR.cx) / rx) ** 2 + ((y - AR.cy) / ry) ** 2 < 1; };
  const clampA = (x, y, pad) => { const rx = Math.max(0.8, AR.rx - (pad || 0)), ry = Math.max(0.8, AR.ry - (pad || 0)), dx = x - AR.cx, dy = y - AR.cy, k = Math.hypot(dx / rx, dy / ry); return k <= 1 ? { x, y } : { x: AR.cx + dx / k, y: AR.cy + dy / k }; };
  // where the line through (px, py) along angle a crosses the arena's rim: its two distances along the line
  function chord(px, py, a) { const ux = Math.cos(a), uy = Math.sin(a), X0 = (px - AR.cx) / AR.rx, Y0 = (py - AR.cy) / AR.ry, UX = ux / AR.rx, UY = uy / AR.ry;
    const A2 = UX * UX + UY * UY, B2 = 2 * (X0 * UX + Y0 * UY), C2 = X0 * X0 + Y0 * Y0 - 1, D = B2 * B2 - 4 * A2 * C2; if (D < 0) return [-6, 6]; const s = Math.sqrt(D); return [(-B2 - s) / (2 * A2), (-B2 + s) / (2 * A2)]; }

  /* ================= the fight ================= */
  function begin(X, H, self, arena) {
    if (S) stop();
    const g = X.g, me = X.me, a = arena || {};
    AR.cx = a.cx != null ? a.cx : me.x; AR.cy = a.cy != null ? a.cy : me.y - 6;
    AR.rx = a.rx > 0 ? Math.max(4, a.rx - 0.5) : a.ax1 != null && a.ax0 != null ? Math.max(4, (a.ax1 - a.ax0) / 2 - 0.4) : (a.r || 9);
    AR.ry = a.ry > 0 ? Math.max(4, a.ry - 0.5) : a.ay1 != null && a.ay0 != null ? Math.max(4, (a.ay1 - a.ay0) / 2 - 0.4) : (a.r || 7);
    const barHP = TUNE.hp / TUNE.bars, hp = TUNE.hp, home = clampA(AR.cx, AR.cy - AR.ry * 0.3, 2.4);
    const m = { type: 'boss', boss: 'cbabaddon', fiend: 'cbabaddon', cbBoss: true, bk: { id: 'cbabaddon', name: 'Abaddon', title: 'The Eternal Moonlight', ai: 'cbabaddon', spd: 2 }, mini: false, lesser: false, bname: 'Abaddon',
      x: home.x, y: home.y, r: TUNE.r, hp, maxhp: hp, spd: 2, dmg: TUNE.dmg, belHard: TUNE.hard, xp: 400, color: '#2A2048', glow: '#C9B4FF', aggro: true, act: 'enter', actT: 0, phase: 0, cd: 9, z: 0, t: 0, flash: 0, burn: 0, burnD: 0, venom: 0, venomT: 0,
      chill: 0, freeze: 0, stun: 0, kbx: 0, kby: 0, atkCd: 0, mv: 2, hitSq: 0, ph: 0, wob: 0, face: 1, step: 0, flank: 0, still: true, landed: true, noTouch: true };
    const B = { id: 'cancer', x: m.x, y: m.y, at: 3.3, alpha: 0, drop: 6, lift: 0, vx: 0, vy: 0, abP: null, abOut: null, face: 1, k: 3, st: 'fight' };
    // the Anima's own effect layer, a private copy with no Anima of its own: its pictures (corona, requiem, shards, the claw's arc, seal, bloom)
    let inst = null; try { if (typeof ABADDON_MOVES !== 'undefined') inst = ABADDON_MOVES.create({ X: Object.assign(Object.create(X), { eshots: [] }) /* (no enemy shots for its eclipse to swallow here) */, me, g, T: () => X.Tz(), ST: X.ST, S: { list: [] }, P: () => 0, near: () => [], living: () => [], hit: () => 0, emote: () => {} }); } catch (e) { inst = null; }
    S = { X, H, self, mod: self && self.mod, g, me, m, B, inst, barHP, phase: 1, mode: 'intro', t: 0, introT: 0, deadT: 0, acts: [], pick: 0, idleT: 1.2, swT: 0, swCd: 1.5, near: 0,
      slashes: [], fields: [], waves: [], sweeps: [], t9: null, pad: null, store: 0, charge: 0, dps: TUNE.refDps, lastM: hp, healAcc: 0, healCd: 0, despDone: false, seen: {}, petZ: 0, cine: false, lastG: null, objs: [], orig: null, zoomed: false,
      stat: { rev: 0, revHit: 0, tide: 0, tideHit: 0, car: 0, carBroke: 0, ecl: 0, eclHit: 0, eclStored: 0, sw: 0, swHit: 0, t9: 0, t9Hit: 0, t9Safe: 0, phase2At: null, phase3At: null, t0: g.t, dmgIn: 0 } };
    X.mons.push(m); g.boss = m; g.bossShow = null; g.shownBoss = true; g.bossIntro = TUNE.intro;   // (the engine's intro hold: no attacks; its bar after 2.2 s; its own banner skipped: ours, below)
    m.ownBar = (c, W) => drawBar(c, W); m.goalFn = () => goalText();
    // the body, its ground and its sky: three of the gate's own objects, drawn in depth order with everything else
    if (H && H.obj) { S.objs.push(H.obj({ x: m.x, y: m.y, dy: -1e5, kind: 'cbGround', r: 0, label: '', draw: c => safeDraw(c, drawGroundLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 0.3, kind: 'cbBody', r: 0, label: '', draw: c => safeDraw(c, drawBodyLayer) }));
      S.objs.push(H.obj({ x: m.x, y: m.y, dy: 1e5, kind: 'cbSky', r: 0, label: '', draw: c => safeDraw(c, drawSkyLayer) })); }
    hook(S.mod);
    // the stage's end (the map, the lobby, a retry): the game's destroy lets the fight go at once, not only when the next stage is made
    try { const api = typeof arc !== 'undefined' && arc && arc.game; if (api && typeof api.destroy === 'function') { const d0 = api.destroy, dw = function () { try { stop(); } catch (e) {} return d0.apply(this, arguments); }; api.destroy = dw; S.api = api; S.d0 = d0; S.dw = dw; } } catch (e) { /* (no arcade: the gate's own stop) */ }
    // the entrance: the arena hushes, a lunar seal opens overhead, it comes down in its sealed shell
    S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1);
    if (inst) inst.fx.push({ kind: 'seal', a: B, x: B.x, y: B.y, t: 0, life: 2.6 });
    sfx('hum'); X.light(B.x, B.y, 5, 1.2); X.shake(4, 0.6);
    if (glOn()) try { ABADDON_GL.warm(); } catch (e) { /* (no GPU: its cel model) */ }
    return m;
  }
  const sfx = (k, ...a) => { const s = S && S.X.sfx; if (s && s[k]) try { s[k](...a); } catch (e) { /* no sound */ } };
  const say = (key, t, sub, col, dur) => { const first = !S.seen[key]; S.seen[key] = true; S.X.banner(t, sub || '', col || COL.lilac, first ? (dur || 2.6) : 1.4, true); };
  const realHp = () => { const m = S.m, P = S.pad; if (!P) return m.hp; if (P.kind === 'shell') return Math.min(m.hp, P.base); return P.base; };
  const ST = () => { try { return S.X.ST(); } catch (e) { return null; } };
  const hurt = (d, o) => { const me = S.me; const before = me.hp, ok = S.X.hurtPet(d, S.m, o); if (ok) S.stat.dmgIn += Math.max(0, before - me.hp); return ok; };
  const kOf = () => S.phase - 1;

  /* ---- the gate module's hooks, chained for the fight and handed back after ---- */
  function hook(mod) {
    if (!mod) return; const O = S.orig = {};
    const wrap = (k, f) => { O[k] = { had: Object.prototype.hasOwnProperty.call(mod, k), v: mod[k] }; mod[k] = f; };
    const call = (k, ...a) => { const o = O[k]; return o && typeof o.v === 'function' ? o.v.apply(mod, a) : undefined; };
    wrap('update', dt => { const r = call('update', dt); step(dt); return r; });
    wrap('cam', () => (S && S.mode !== 'over' ? camOf() : call('cam') || null));
    wrap('goal', () => (S && S.mode !== 'over' && !(S.mode === 'dead' && S.deadT > TUNE.death) ? goalText() : call('goal')));
    wrap('hint', () => (S && S.mode !== 'over' ? null : call('hint') || null));
    wrap('onBossDeath', mm => (S && mm === S.m ? (onDeath(), true) : !!call('onBossDeath', mm)));
    S.modRef = mod;
  }
  function unhook() { const mod = S && S.modRef, O = S && S.orig; if (!mod || !O) return; for (const k in O) { if (O[k].had) mod[k] = O[k].v; else delete mod[k]; } S.orig = null; S.modRef = null; }
  /* the camera: the whole god (its halo included) kept below the top HUD with a margin, and the pet above the buttons; the view
     widens (a little, on a phone) when that span will not fit, as it does while the god is risen for the Ninth Tide */
  const CAM = { top: 160, bot: 210, zFight: 0.7, zTide: 0.62, zMin: 0.5, zIn: 1.35 };
  function frame(topY, botY, x, z0) {
    const X = S.X, g = S.g, Hh = X.H(), TS = X.Tz() / Math.max(0.05, g.zoom || 1), room = Math.max(120, Hh - CAM.top - CAM.bot), span = Math.max(1, botY - topY);
    const z = Math.max(CAM.zMin, Math.min(z0, room / (span * TS))) * CAM.zIn;   /* (v422 CZ: the user: "zoom in by 35%") */
    // closer in, the god and the pet may no longer both fit: keep the god's top below the HUD when they do, else keep the pet in view
    const yGod = topY + (Hh / 2 - CAM.top) / (TS * z), yPet = botY - (Hh / 2 - CAM.bot) / (TS * z), y = Math.max(yPet, Math.min(yGod, (topY + botY) / 2 + 2));
    return { x, y, k: 0.92, zoom: z };
  }
  const godTop = () => { const B = S.B; return B.y - TUNE.hover - (B.drop || 0) - Math.max(0, B.lift || 0) - TUNE.size * 1.18 - 0.4; };
  function camOf() {
    const B = S.B, m = S.m, me = S.me;
    if (S.mode === 'intro') return frame(godTop(), B.y + 2.5, B.x, 0.7);
    if (S.mode === 'dead') return frame(godTop(), B.y + 2.5, B.x, 0.68);
    if (S.t9) { const top = m.y - TUNE.hover - 1.1 - TUNE.size * 1.25 - 0.5, bot = Math.max(me.y, ...S.t9.pockets.map(p => p.y)) + 1.2; return frame(top, bot, lerp(m.x, me.x, 0.4), CAM.zTide); }
    return frame(godTop(), me.y + 1.0, (m.x + me.x) / 2, CAM.zFight);
  }
  function goalText() { if (!S) return ''; const n = Math.max(0, Math.ceil(Math.max(0, realHp()) / S.barHP - 1e-9));
    if (S.mode === 'dead') return 'The Eternal Moonlight falls';
    return `Abaddon · ${n} bar${n === 1 ? '' : 's'} · phase ${S.phase}/3${S.t9 ? ' · stand in the moonlight' : ''}`; }

  /* ================= the step (every frame) ================= */
  function update(dt) { step(dt); }
  function step(dt) {
    if (!S) return; const g = S.g; if (S.lastG === g.t) return; S.lastG = g.t;
    dt = Math.min(0.25, Math.max(0, dt || 0)); const B = S.B, m = S.m, me = S.me;
    S.t += dt; B.at += dt;
    if (S.inst) try { S.inst.update(dt, dt); } catch (e) { /* (its pictures only) */ }
    if (S.mode === 'intro') introTick(dt);
    else if (S.mode === 'dead') deadTick(dt);
    else if (S.mode === 'fight') fightTick(dt);
    if (S.mode === 'over') return;
    hazardsTick(S.heldDt == null ? dt : S.heldDt, dt);
    liftTick(dt);
    if (S.mode !== 'dead') { B.x = m.x; B.y = m.y; }
    poseOf(dt);
    for (const o of S.objs) { o.x = B.x; o.y = B.y; }
    if (S.cine) g.cineT = Math.max(g.cineT || 0, 0.05);
  }
  function introTick(dt) {
    const B = S.B, m = S.m, X = S.X, g = S.g, t0 = S.introT; S.introT += dt; const t = S.introT, cross = x => t0 < x && t >= x;
    B.drop = 6 * (1 - eout(sstep(0.3, 2.4, t))); B.alpha = sstep(0.2, 1.2, t);
    if (cross(2.4)) { if (S.inst) S.inst.fx.push({ kind: 'bloom', a: B, x: B.x, y: B.y, t: 0, life: 1.4 }); X.ring(B.x, B.y, 0.3, 3.2, 0.7, COL.ice, 0.16); X.shake(12, 0.7); X.flash(0.3, COL.ice); sfx('crash'); X.light(B.x, B.y, 7, 0.8);
      for (let i = 0; i < 22 * LQ(); i++) { const an = Math.random() * TAU; X.part({ kind: 'star', x: B.x + Math.cos(an) * 1.6, y: B.y - 1.5 + Math.sin(an), vx: Math.cos(an) * 3.2, vy: Math.sin(an) * 2 - 0.6, life: 1, max: 1, size: 3, color: i % 2 ? COL.ice : COL.white, drag: 1.4 }); } }
    if (cross(2.6)) { X.banner('ABADDON', 'The Eternal Moonlight', COL.lilac, 2.8, true, true); sfx('sparkle'); }
    if (t >= TUNE.intro) { S.mode = 'fight'; S.cine = false; g.cineT = 0; m.act = 'fight'; B.drop = 0; B.alpha = 1; S.idleT = 0.8; say('p1', 'PHASE I', 'Abaddon · ' + PH_NAMES[0], COL.lilac, 1.8); }
  }
  /* ---- the fight ---- */
  function fightTick(dt) {
    const m = S.m;
    // what the pet's blows took since the last frame (its health, the shell, the seal: the Tide's call shrugs them off), before the pads read it back
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
    // the phases (and the last Ninth Tide)
    const f = realHp() / m.maxhp;
    if (!S.t9 && S.phase < 3 && f <= TUNE.cuts[S.phase]) phaseUp();
    else if (!S.t9 && S.phase === 3 && !S.despDone && f <= TUNE.desp) { S.despDone = true; abortActs(); startT9(true); }
    if (me.dead) { if (S.acts.length || S.fields.length) abortActs(); if (S.t9) { S.t9 = null; if (S.pad && S.pad.kind === 'void') padEnd(); } setDown(); S.idleT = Math.max(S.idleT, 1.4); S.heldDt = 0; return; }   // (the pet down: its powers called off, the pet set down; the next pet in finds it waiting)
    const held = g.stopT > 0 || (g.cineT > 0 && !S.cine), slow = (m.chill > 0 ? 0.8 : 1) * (g.warpT > 0 ? 0.4 : 1) * (m.curseT > 0 ? 0.85 : 1), da = held ? 0 : dt * slow;
    S.heldDt = da;
    if (m.stunT > 0) { m.stunT -= da; m.act = m.stunT > 0 ? 'stunned' : 'fight'; return; }   // (broken out of its Carapace: staggered, open)
    if (S.t9) { t9Tick(da); drift(da, 0.6); return; }
    for (let i = S.acts.length - 1; i >= 0; i--) { const A = S.acts[i]; A.t += da; if (actTick(A, da)) { endAct(A); S.acts.splice(i, 1); if (A.kind !== 'sw' && !S.acts.some(B2 => B2.kind !== 'sw')) S.idleT = TUNE.idle[kOf()]; } }
    // the claw: a punish for a pet that stays close, thrown in between (or over a Reaver or the Carapace's fold); it never holds up the next power
    S.swCd -= da; const dp = Math.hypot(me.x - m.x, me.y - m.y); S.near = dp < TUNE.swR + 0.4 ? S.near + da : 0;
    const busy = S.acts.some(A => A.kind !== 'sw');
    if (S.noAI) return;   // (the harness: one power at a time)
    if (S.swCd <= 0 && S.near > TUNE.swNear * (busy ? 1.6 : 1) && !S.acts.some(A => A.kind === 'sw' || A.kind === 'ecl' || A.kind === 'tide')) start('sw');
    if (!busy) { S.idleT -= da; if (S.idleT <= 0) { const cyc = CYC[S.phase], k = cyc[S.pick % cyc.length]; S.pick++; for (const kk of k.split('+')) start(kk); } }
    drift(da, S.acts.some(A => A.kind === 'ecl' || A.kind === 'car') ? 0.25 : S.acts.length ? 0.5 : 1);
    // it is passed round, not through: the pet eased out from under it
    if (!me.dead && !me.leap) { const dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy), r0 = 1.5; if (d < r0 && d > 1e-4) X.moveEnt(me, dx / d * (r0 - d) * 0.6, dy / d * (r0 - d) * 0.6, 0); }
  }
  // it floats after the pet with heavy, deliberate acceleration, keeping its distance, in the arena's far half when it can
  function drift(dt, k) {
    if (!(dt > 0)) return; const m = S.m, me = S.me, B = S.B;
    let tx, ty; if (S.t9) { const p = clampA(AR.cx, AR.cy - AR.ry * 0.35, 2.4); tx = p.x; ty = p.y; }
    else { const dx = m.x - me.x, dy = m.y - me.y, d = Math.hypot(dx, dy) || 1; tx = me.x + dx / d * TUNE.keep; ty = me.y + dy / d * TUNE.keep; ty = Math.min(ty, AR.cy + AR.ry * 0.25); const p = clampA(tx, ty, 2.4); tx = p.x; ty = p.y; }
    const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy), want = Math.min(TUNE.spd[kOf()] * k, d * 1.4), acc = Math.min(1, dt * 1.8);
    B.vx += ((d > 0.05 ? dx / d * want : 0) - B.vx) * acc; B.vy += ((d > 0.05 ? dy / d * want : 0) - B.vy) * acc;
    const p = clampA(m.x + B.vx * dt, m.y + B.vy * dt, 2.0); m.x = p.x; m.y = p.y; if (Math.abs(B.vx) > 0.3) m.face = B.vx > 0 ? 1 : -1;
  }
  function phaseUp() {
    const m = S.m, X = S.X; abortActs(); S.phase++; m.flinch = 1;
    if (S.phase === 2) S.stat.phase2At = S.g.t - S.stat.t0; else S.stat.phase3At = S.g.t - S.stat.t0;
    X.banner(`PHASE ${S.phase === 2 ? 'II' : 'III'}`, `Abaddon · ${PH_NAMES[S.phase - 1]}`, S.phase === 3 ? COL.violet : COL.lilac, 2.0, true);
    X.flash(0.3, COL.ice); X.shake(14, 0.6); X.ring(m.x, m.y, 0.5, 8, 1, COL.ice, 0.4); sfx('hum');
    for (let i = 0; i < 4; i++) X.drop(i % 2 ? 'mp' : 'hp', m.x + (Math.random() - 0.5) * 4, m.y + 1 + Math.random() * 2);
    startT9(false);
  }

  /* ---- the powers ---- */
  function start(kind) {
    const k = kOf(), me = S.me, m = S.m; let A = null;
    if (kind === 'rev') { const n = TUNE.revPairs[k]; A = { kind, t: 0, n, i: 0, gap: TUNE.revGap[k], tell: TUNE.revTell[k] }; A.dur = TUNE.revWind + (n - 1) * A.gap + A.tell + 1.0; sfx('whoosh'); }
    else if (kind === 'tide') { const p = clampA(me.x + (m.x - me.x) * 0.08, me.y + (m.y - me.y) * 0.08, 1.2); A = { kind, t: 0, x: p.x, y: p.y, R: TUNE.tideR[k], open: TUNE.tideOpen[k], on: TUNE.tideDur[k] }; A.dur = A.open + A.on + 0.4; S.fields.push({ x: A.x, y: A.y, R: A.R, t: 0, open: A.open, on: A.on, tk: 0.3, el: 0, seed: Math.random() * 50, A, done: false, end: false }); sfx('hum'); }
    else if (kind === 'car') { if (S.pad) return null; A = { kind, t: 0, dur: 1.4 }; sfx('hum'); }
    else if (kind === 'ecl') { if (S.pad && S.pad.kind !== 'shell') return null; A = { kind, t: 0, seal: TUNE.eclSeal[k] }; A.dur = A.seal + 1.1; sfx('hum'); }
    else if (kind === 'sw') { A = { kind, t: 0, tell: TUNE.swTell[k], arm: me.x > m.x ? 0 : 1 }; A.dur = A.tell + 0.5; S.swCd = TUNE.swCd; S.near = 0; S.idleT += 1.4; /* (the claw takes its turn: the next power waits) */ S.sweeps.push({ t: 0, tell: A.tell, arm: A.arm, A, hit: false }); }
    if (!A) return null; S.stat[kind] = (S.stat[kind] || 0) + 1; S.acts.push(A); return A;
  }
  // a power's own clock: true when it is done
  function actTick(A, dt) {
    const t = A.t, t0 = t - dt, cross = x => t0 < x && t >= x, m = S.m, X = S.X;
    if (A.kind === 'rev') { while (A.i < A.n && t >= TUNE.revWind + A.i * A.gap) { pair(A, A.i); A.i++; } return t >= A.dur; }
    if (A.kind === 'tide') return t >= A.dur;
    if (A.kind === 'car') { if (cross(0.9) && !S.pad) shellUp(); return t >= A.dur; }
    if (A.kind === 'ecl') {
      if (cross(0.3)) { if (S.pad && S.pad.kind === 'shell') shellEnd(false); S.pad = { kind: 'seal', base: m.hp, buf: 1e7, t: 0 }; m.hp = S.pad.base + S.pad.buf;
        if (S.inst) S.inst.fx.push({ kind: 'eclipse', a: S.B, t: 0, life: A.seal - 0.3 + 0.4, seal: A.seal - 0.3, R: eclR() }); say('ecl', 'ECLIPSE REQUIEM', 'Every blow is stored: stop, and back away', COL.ice, 2.2); }
      if (cross(A.seal)) requiem();
      return t >= A.dur; }
    if (A.kind === 'sw') return t >= A.dur;
    return true;
  }
  function endAct(A) { if (A.kind === 'ecl' && S.pad && S.pad.kind === 'seal') requiem(); }
  // an interrupted power: its blows called off (marked slashes and fields fade unstruck), the pet set down, the seal lifted
  function abortActs() {
    for (const A of S.acts) if (A.kind === 'ecl' && S.pad && S.pad.kind === 'seal') padEnd();
    S.acts.length = 0;
    for (const s of S.slashes) if (s.t < s.tell) { s.dead = true; s.fade = s.t; }
    for (const f of S.fields) if (!f.end) { f.end = true; f.endT = f.t; }
    for (const w of S.sweeps) w.hit = true;
    if (S.pad && S.pad.kind === 'shell') shellEnd(false);
    S.idleT = Math.max(S.idleT, 1.0);
  }
  /* Crescent Reavers: two slashes crossing where the pet stands (a little ahead of it) */
  function pair(A, i) {
    const me = S.me, lead = TUNE.revLead, w = TUNE.revW; let p, a0 = Math.random() * Math.PI;
    if (!i) p = clampA(me.x + (me.vx || 0) * lead, me.y + (me.vy || 0) * lead, 0.6);
    else { // (a crossing beside the pet, its two lines kept off where it stands: they close its ways out, they do not chase it)
      let best = null; for (let n = 0; n < 16; n++) { const b = Math.random() * TAU, r = lerp(TUNE.revOff[0], TUNE.revOff[1], Math.random()), q = clampA(me.x + Math.cos(b) * r, me.y + Math.sin(b) * r, 0.8), a = Math.random() * Math.PI;
        const off = an => Math.abs(-(me.x - q.x) * Math.sin(an) + (me.y - q.y) * Math.cos(an)), clear = Math.min(off(a), off(a + Math.PI / 2));
        if (!best || clear > best.c) best = { q, a, c: clear }; if (clear > w / 2 + 1.0) break; }
      p = best.q; a0 = best.a; }
    for (let j = 0; j < 2; j++) { const a = a0 + j * Math.PI / 2 + (i ? 0 : (Math.random() - 0.5) * 0.5 * j), [s0, s1] = chord(p.x, p.y, a), ux = Math.cos(a), uy = Math.sin(a), e0 = s0 - 1.6, e1 = s1 + 1.6;
      S.slashes.push({ x0: p.x + ux * e0, y0: p.y + uy * e0, ux, uy, L: e1 - e0, cx: p.x, cy: p.y, t: -j * 0.08, tell: A.tell + j * 0.08, prog: 0, hit: false, dead: false, seed: Math.random() * 90, side: j, w }); }
    sfx('whoosh');
  }
  /* Lunar Carapace */
  function shellUp() { const m = S.m, k = kOf(), pool = dpsRef() * TUNE.carSec[k]; S.pad = { kind: 'shell', base: m.hp, pool, left: pool, t: 0, life: TUNE.carDur, hit: null }; m.hp += pool;
    S.X.text(m.x, m.y - 4.6, 'LUNAR CARAPACE', COL.ice, 14, { crit: true, life: 1 }); sfx('sparkle'); say('car', 'LUNAR CARAPACE', 'Break its shell: what it soaks up, it stores', COL.ice, 2.2); }
  function shellEnd(broke) { const P = S.pad, m = S.m; if (!P || P.kind !== 'shell') return; const soaked = broke ? P.pool : Math.max(0, P.pool - Math.max(0, m.hp - P.base));
    if (!broke && m.hp > P.base) m.hp = P.base; S.store += soaked * TUNE.carStore; S.stat.eclStored += soaked * TUNE.carStore; S.pad = null;
    if (soaked > 0) S.charge = Math.min(1.5, S.charge + soaked / (dpsRef() * 4)); }
  function breakShell() { const m = S.m, X = S.X; shellEnd(true); S.stat.carBroke++; m.stunT = TUNE.carStag; m.act = 'stunned'; m.flash = 0.2;
    X.text(m.x, m.y - 4.4, 'Carapace broken!', COL.white, 16, { crit: true, life: 1.2 }); X.shake(10, 0.4); X.flash(0.2, COL.ice); sfx('crash'); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.06);
    if (S.inst) S.inst.fx.push({ kind: 'frags', x: m.x, y: m.y - 2.6, t: 0, life: 0.9, n: Math.round(18 * LQ()), seed: Math.random() * 99 });
    for (const A of S.acts) if (A.kind !== 'sw') A.t = Math.max(A.t, A.dur - 0.01); }
  function padEnd() { const P = S.pad, m = S.m; if (!P) return; if (P.kind === 'shell') { shellEnd(false); return; } m.hp = P.base; S.pad = null; }
  // the shell soaks, the seal stores, the Tide's call shrugs every blow off: each frame, what the blows took is read back
  function padTick(dt) {
    const P = S.pad, m = S.m; if (!P) return; P.t += dt;
    if (P.kind === 'shell') { const left = m.hp - P.base; if (left < P.left - 0.5) { P.hit = [0.001, Math.atan2(S.me.y - m.y, S.me.x - m.x)]; S.charge = Math.min(1.5, S.charge + 0.08); } P.left = left; if (P.hit) { P.hit[0] += dt / 0.6; if (P.hit[0] >= 1) P.hit = null; }
      if (left <= 0) breakShell(); else if (P.t >= P.life) shellEnd(false); return; }
    const top = P.base + P.buf, d = top - m.hp; if (d > 0) { if (P.kind === 'seal') { S.store += d; S.stat.eclStored += d; S.charge = Math.min(1.5, S.charge + 0.12); P.hit = 1; } m.hp = top; }
    if (P.hit > 0) P.hit = Math.max(0, P.hit - dt * 3);
  }
  const dpsRef = () => Math.max(TUNE.refDps, S.dps || 0), eclFill = () => cl(S.store / (dpsRef() * TUNE.eclFill));
  const eclR = () => lerp(TUNE.eclR0, TUNE.eclRmax, eclFill());
  const eclMul = () => 1 + TUNE.eclCap * eclFill();
  function requiem() {
    const m = S.m, X = S.X; if (S.pad && S.pad.kind === 'seal') padEnd();
    const R = eclR(), k = eclMul(); S.waves.push({ x: m.x, y: m.y, R, k, t: 0, hit: false, prev: 0, dmg: m.dmg * TUNE.eclK * k });
    if (S.inst) S.inst.fx.push({ kind: 'requiem', a: S.B, x: m.x, y: m.y, t: 0, life: 1.1, R, k });
    X.flash(0.18, '#DDE8FF'); X.shake(16 + k * 3, 0.5); sfx('crash'); X.light(m.x, m.y, 5, 0.4); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.05);
    if (k > 1.3) X.text(m.x, m.y - 4.8, `Requiem x${k.toFixed(1)}`, COL.ice, 14, { life: 1.2 });
    S.store = 0; S.charge = 0;
  }

  /* ---- the hazards in the world: slashes, fields, the requiem's shell, the claw ---- */
  function hazardsTick(da, dt) {
    const me = S.me, m = S.m, X = S.X, alive = S.mode === 'fight' && !m.dead;
    for (let i = S.slashes.length - 1; i >= 0; i--) { const s = S.slashes[i]; s.t += s.dead ? dt : da;
      if (!s.dead && s.t > s.tell) { const prev = s.prog; s.prog = Math.min(s.L, (s.t - s.tell) * TUNE.revSpd);
        if (!s.hit && alive && !me.dead) { const rx = me.x - s.x0, ry = me.y - s.y0, al = rx * s.ux + ry * s.uy, of = Math.abs(-rx * s.uy + ry * s.ux);
          if (of < s.w / 2 + me.r && al > prev - 0.7 && al < s.prog + 0.7) { s.hit = true; if (hurt(m.dmg * TUNE.revK, { reaver: true })) { S.stat.revHit++; me.push = { vx: s.ux * 5, vy: s.uy * 5, t: 0.15 }; } } }
        if (s.prog > 0 && prev === 0) { X.sparks(s.x0 + s.ux * 1.6, s.y0 + s.uy * 1.6, COL.ice, Math.round(6 * LQ()), 5); if (s.side === 0) sfx('whoosh'); } }
      const life = s.dead ? s.fade + 0.35 : s.tell + s.L / TUNE.revSpd + 0.45; if (s.t >= life) S.slashes.splice(i, 1); }
    for (let i = S.fields.length - 1; i >= 0; i--) { const f = S.fields[i]; f.t += f.end ? dt : da; const on = !f.end && f.t > f.open && f.t < f.open + f.on;
      if (on && alive) { const d = Math.hypot(me.x - f.x, me.y - f.y); f.inside = !me.dead && d < f.R + me.r * 0.5;
        if (f.inside) { if (!me.dodge && !me.leap && d > 0.3) { const sp = TUNE.tidePull[kOf()] * (0.7 + 0.3 * d / f.R) * da, an = Math.atan2(f.y - me.y, f.x - me.x) + 0.45; X.moveEnt(me, Math.cos(an) * Math.min(d, sp), Math.sin(an) * Math.min(d, sp), 0); }
          f.tk -= da; if (f.tk <= 0 && f.t < f.open + f.on - 0.6) {   // (no tick in its last 0.6 s: the core's collapse is not lost to the pet's blink of safety)
            f.tk = TUNE.tideTick; f.el ^= 1; if (hurt(m.dmg * TUNE.tideK, { dot: true, tide: true })) S.stat.tideHit++; } } }
      else f.inside = false;
      if (!f.end && f.t >= f.open + f.on) { f.end = true; f.endT = f.t; if (alive) { const d = Math.hypot(me.x - f.x, me.y - f.y);
          if (d < TUNE.tideCore + me.r && !me.dead) { if (hurt(m.dmg * TUNE.tideEndK, { tide: true })) S.stat.tideHit++; }
          S.waves.push({ x: f.x, y: f.y, R: TUNE.tideCore * 1.6, k: 0.6, t: 0, hit: true, prev: 0, dmg: 0, small: true }); X.shake(6, 0.25); sfx('crash'); } }
      if (f.end && f.t >= f.endT + 0.6) S.fields.splice(i, 1); }
    for (let i = S.waves.length - 1; i >= 0; i--) { const w = S.waves[i]; w.t += dt; const rw = w.R * eout(w.t / 0.45);
      if (!w.hit && alive && !me.dead) { const d = Math.hypot(me.x - w.x, me.y - w.y); if (d - me.r <= rw && d + me.r >= w.prev - 0.6) { w.hit = true; if (hurt(w.dmg, { requiem: true })) { S.stat.eclHit++; const an = Math.atan2(me.y - w.y, me.x - w.x); me.push = { vx: Math.cos(an) * 10, vy: Math.sin(an) * 10, t: 0.25 }; } } }
      if (w.t >= 0.45 && !w.hit) w.hit = true; w.prev = rw; if (w.t >= 1.0) S.waves.splice(i, 1); }
    for (let i = S.sweeps.length - 1; i >= 0; i--) { const w = S.sweeps[i], t0 = w.t; w.t += w.hit ? dt : da;
      if (!w.hit && t0 < w.tell && w.t >= w.tell) { w.hit = true; if (S.inst) S.inst.fx.push({ kind: 'swipe', a: S.B, arm: w.arm, t: 0, life: 0.35 }); sfx('whoosh');
        if (alive && !me.dead) { const d = Math.hypot(me.x - m.x, me.y - m.y); if (d < TUNE.swR + me.r) { if (hurt(m.dmg * TUNE.swK, { claw: true })) { S.stat.swHit++; const an = Math.atan2(me.y - m.y, me.x - m.x); me.push = { vx: Math.cos(an) * 12, vy: Math.sin(an) * 12, t: 0.25 }; X.shake(8, 0.25); } } } }
      if (w.t >= w.tell + 0.45) S.sweeps.splice(i, 1); }
  }
  // the pet lifted in a field (drawn higher only; set down when no field holds it)
  function liftTick(dt) { const me = S.me; let want = 0; for (const f of S.fields) if (f.inside && !f.end) want = TUNE.lift * sstep(f.open, f.open + 0.5, f.t);
    if (me.leap || me.swIn || me.dead) want = 0;
    if (want > 0.001 || S.petZ > 0.001) { S.petZ += (want - S.petZ) * Math.min(1, dt * (want > S.petZ ? 4 : 8)); if (S.petZ < 0.004 && want === 0) S.petZ = 0; if (!me.leap && !me.swIn) me.z = S.petZ + (S.petZ > 0.01 ? 0.05 * Math.sin(S.g.t * 3) * S.petZ : 0); } }
  function setDown() { const me = S.me; if (S.petZ > 0 && !me.leap && !me.swIn) me.z = 0; S.petZ = 0; }

  /* ---- The Ninth Tide ---- */
  function startT9(desp) {
    const me = S.me, m = S.m, k = kOf(); if (S.pad) padEnd(); S.pad = { kind: 'void', base: m.hp, buf: 1e7, t: 0 }; m.hp += S.pad.buf;
    S.t9 = { t: 0, desp: !!desp, pockets: [], hit: false, safe: false, n: desp ? 1 : 2, pr: TUNE.t9PR[k], seed: Math.random() * 1000, drift: desp || S.phase >= 3 };
    S.stat.t9++; say('t9', 'THE NINTH TIDE', 'The sea rises: stand in a pocket of moonlight', COL.moon, 2.6); sfx('hum'); S.X.after(0.4, () => sfx('sparkle'));
  }
  function pockets() {
    const J = S.t9, me = S.me, m = S.m, out = [], reach = 4.3 * (TUNE.t9Strike - TUNE.t9Open) * 0.62;
    for (let tries = 0; tries < 400 && out.length < J.n; tries++) { const a = Math.random() * TAU, rr = Math.sqrt(Math.random()), x = AR.cx + Math.cos(a) * rr * (AR.rx - 2), y = AR.cy + Math.sin(a) * rr * (AR.ry - 2);
      const dp = Math.hypot(x - me.x, y - me.y), dm = Math.hypot(x - m.x, y - m.y); if (!inA(x, y, 1.6) || dp < 3.4 || dp > reach || dm < 3.2 || out.some(p => Math.hypot(p.x - x, p.y - y) < 5)) continue;
      if (S.X.blocked && S.X.blocked(x, y, 0.5, 0)) continue; out.push({ x, y, vx: 0, vy: 0, a: Math.random() * TAU }); }
    while (out.length < J.n) { const a = Math.random() * TAU, p = clampA(me.x + Math.cos(a) * 4, me.y + Math.sin(a) * 4, 1.8); out.push({ x: p.x, y: p.y, vx: 0, vy: 0, a }); }
    return out;
  }
  function t9Tick(dt) {
    const J = S.t9, me = S.me, m = S.m, X = S.X, t0 = J.t; J.t += dt; const t = J.t, cross = x => t0 < x && t >= x;
    if (cross(TUNE.t9Open)) { J.pockets = pockets(); for (const p of J.pockets) X.ring(p.x, p.y, 0.2, J.pr * 1.4, 0.7, COL.moon, 0.12); sfx('chirp'); }
    if (J.drift && J.pockets.length && t > TUNE.t9Open + 0.6 && t < TUNE.t9Strike) for (const p of J.pockets) { p.a += dt * 0.6; const v = 0.55, q = clampA(p.x + Math.cos(p.a) * v * dt, p.y + Math.sin(p.a) * v * dt, 1.8); p.x = q.x; p.y = q.y; }
    if (t > 2.0 && t < 4.2 && Math.random() < dt * 6) X.shake(2, 0.1);
    if (t > 4.2 && t < TUNE.t9Strike && Math.random() < dt * 10) X.shake(2 + (t - 4.2) * 4, 0.08);
    if (cross(2.0)) sfx('whoosh'); if (cross(2.6) && S.X.sfx && S.X.sfx.splash) sfx('splash');
    if (cross(TUNE.t9Strike)) { X.flash(0.3, '#E8F0FF'); X.shake(lowFx() ? 12 : 22, 0.7); sfx('crash'); X.after(0.14, () => sfx('fanfare')); X.light(m.x, m.y, 6, 0.4); S.g.hitStop = Math.max(S.g.hitStop || 0, 0.08); }
    if (t >= TUNE.t9Strike && t < TUNE.t9Strike + TUNE.t9Win && !J.hit && !J.safe && !me.dead) {
      const inP = J.pockets.some(p => Math.hypot(me.x - p.x, me.y - p.y) < J.pr + me.r * 0.25);
      if (inP) { J.safe = true; S.stat.t9Safe++; X.text(me.x, me.y - 1.6, 'Sheltered by the moonlight', COL.moon, 14, { life: 1.3 }); X.ring(me.x, me.y, 0.3, 1.8, 0.5, COL.moon, 0.2); }
      else { const s2 = ST(), mx = s2 ? s2.hp : 300; let d = mx * TUNE.t9K; if (me.hp >= mx * 0.97) d = Math.min(d, me.hp - 1); else d = Math.min(d, mx * TUNE.t9K);
        if (hurt(d / Math.max(1, m.belHard || 1), { t9: true })) { J.hit = true; S.stat.t9Hit++; X.text(me.x, me.y - 1.8, 'Crushed by the Ninth Tide!', COL.ice, 15); me.push = { vx: (me.x - m.x) > 0 ? 6 : -6, vy: 4, t: 0.25 }; } } }
    if (t >= TUNE.t9Len) { S.t9 = null; if (S.pad && S.pad.kind === 'void') padEnd(); S.idleT = 1.2; S.pick = 0; }
  }

  /* ---- the defeat: it staggers, its rings slow and fall still, the Heart dims, the shell closes, it sinks into a moon of light ---- */
  function onDeath() {
    if (!S || S.mode === 'dead' || S.mode === 'over') return; const m = S.m, X = S.X, g = S.g;
    S.mode = 'dead'; S.deadT = 0; abortActs(); S.t9 = null; S.pad = null; setDown(); S.fields.length = 0; S.slashes.length = 0; S.waves.length = 0; S.sweeps.length = 0;
    S.cine = true; g.cineT = Math.max(g.cineT || 0, 0.1); g.slowT = 0; X.flash(0.8, '#FFFFFF'); g.hitStop = Math.max(g.hitStop || 0, 0.12); X.shake(18, 0.8); sfx('crash');
    S.B.dx = m.x; S.B.dy = m.y;
  }
  function deadTick(dt) {
    const B = S.B, X = S.X, g = S.g, t0 = S.deadT; S.deadT += dt; const t = S.deadT, cross = x => t0 < x && t >= x;
    B.lift = -0.35 * sstep(1.2, 3.4, t); B.alpha = 1 - sstep(3.4, 4.3, t);
    if (cross(0.5)) { for (let i = 0; i < 4; i++) X.after(i * 0.18, () => { if (!S) return; X.boom(B.x + (Math.random() - 0.5) * 2.4, B.y - 1.5 - Math.random() * 2, 1.2, i % 2 ? COL.ice : COL.lilac, '#FFFFFF', { n: 14, shake: 6 }); }); }
    if (cross(1.6)) { X.banner('THE ETERNAL MOONLIGHT FALLS', 'Abaddon returns to its shell', COL.moon, 3.0, true, true); sfx('sparkle'); }
    if (cross(3.3)) { if (S.inst) S.inst.fx.push({ kind: 'bloom', a: B, x: B.x, y: B.y, t: 0, life: 1.4 }); X.flash(0.5, '#FFFFFF'); X.ring(B.x, B.y, 0.3, 4, 0.9, COL.moon, 0.2); X.light(B.x, B.y, 8, 1.2); sfx('chirp');
      for (let i = 0; i < 30 * LQ(); i++) { const an = Math.random() * TAU; X.part({ kind: 'star', x: B.x + Math.cos(an) * 1.2, y: B.y - 2 + Math.sin(an) * 1.2, vx: Math.cos(an) * 2.5, vy: -1.5 - Math.random() * 2.5, life: 1.4, max: 1.4, size: 3, color: i % 3 ? COL.ice : COL.moon, drag: 1.2 }); } }
    if (t > 0.3 && t < 3.3 && Math.random() < dt * 14 * LQ()) X.part({ kind: 'star', x: B.x + (Math.random() - 0.5) * 3, y: B.y - Math.random() * 4.5, vx: (Math.random() - 0.5) * 0.6, vy: -0.8 - Math.random(), life: 1.1, max: 1.1, size: 2.4, color: Math.random() < 0.5 ? COL.ice : COL.lilac });
    if (t >= TUNE.death) { const X2 = X; finish(); try { X2.winStage(); } catch (e) { /* (the stage already ended) */ } }
  }
  // the fight over (won): every hold and hook handed back; the body no longer drawn
  function finish() { if (!S) return; cleanup(); S.mode = 'over'; }

  /* ================= clean-up ================= */
  function cleanup() {
    if (!S) return; const g = S.g, me = S.me, m = S.m;
    try { S.acts.length = 0; S.slashes.length = 0; S.fields.length = 0; S.waves.length = 0; S.sweeps.length = 0; S.t9 = null; } catch (e) {}
    try { if (S.pad && m && !m.dead) { if (S.pad.kind === 'shell') { if (m.hp > S.pad.base) m.hp = S.pad.base; } else m.hp = S.pad.base; } S.pad = null; } catch (e) {}
    try { setDown(); } catch (e) {}
    try { if (S.cine) { S.cine = false; if (g.cineT > 0) g.cineT = 0; } if (g.zoomP !== 1 && S.zoomed) { g.zoomP = 1; g.zoomT = 0; } } catch (e) {}
    try { const R = S.X && S.X.rift, list = R && R.objs; if (list) for (const o of S.objs) { const i = list.indexOf(o); if (i >= 0) list.splice(i, 1); } for (const o of S.objs) o.draw = null; S.objs.length = 0; } catch (e) {}
    try { unhook(); } catch (e) {}
    try { if (S.inst) S.inst.stop(); } catch (e) {} S.inst = null;
    try { if (m) { m.ownBar = null; m.goalFn = null; } } catch (e) {}
  }
  function stop() { if (!S) return; const s = S; try { cleanup(); } catch (e) {} try { if (s.api && s.api.destroy === s.dw) s.api.destroy = s.d0; s.api = s.d0 = s.dw = null; } catch (e) {} try { const g = s.g, m = s.m; if (m && !m.dead) { m.dead = true; } if (g && g.boss === m) g.boss = null; } catch (e) {} S = null; }
  const active = () => !!(S && S.mode !== 'over');

  /* ================= the pose: the Anima's own (20g2: ABADDON_MOVES.poseFor for each power, easePose to ease it, ABADDON_GL.idlePose
     at rest), with what only the boss has laid over it: the intro's unfolding, the stagger, the shell, the phase's quickening, the fall ================= */
  const KIND = { car: 'carapace', rev: 'reavers', tide: 'tide', ecl: 'eclipse', sw: 'swipe' };
  const MV = () => (typeof ABADDON_MOVES !== 'undefined' ? ABADDON_MOVES : null);
  function poseOf(dt) {
    const B = S.B, m = S.m, me = S.me, A = S.acts.find(q => q.kind !== 'sw'), W2 = S.acts.find(q => q.kind === 'sw'), okGL = typeof ABADDON_GL !== 'undefined', MVv = MV();
    const base = okGL ? ABADDON_GL.idlePose(3, B.at) : { arm: [{}, {}], open: 1, heart: 0.8, eye: 1 };
    const pf = (kind, t, o) => (MVv && MVv.poseFor ? MVv.poseFor(kind, t, Object.assign({ base, charge: S.charge || 0 }, o)) : null);
    const tg = (A && S.mode === 'fight' && !S.t9 ? pf(KIND[A.kind], A.t, { seal: A.seal, dur: A.dur, n: A.kind === 'rev' ? A.n * 2 : undefined }) : null) || pf('rest', 0, {}) ||
      { open: base.open, fold: 0, spread: 0, heart: base.heart, dark: 0, ringK: 1, align: 0, glow: 0, ringGlow: 0, seam: 0, eye: base.eye, lift: 0, pitch: 0, roll: 0, live: 1, arms: [Object.assign({}, base.arm[0]), Object.assign({}, base.arm[1])], tenK: 0, tenUp: 0, stagger: 0 };
    tg.ringK += (S.phase - 1) * 0.25; tg.glow += (S.phase - 1) * 0.06;
    // the claw: its arm (and the body's counter-turn) from the swipe's own pose, its anticipation stretched over the tell
    if (W2 && S.mode === 'fight' && !S.t9) { const tl = W2.tell, ts = W2.t < tl ? W2.t / tl * 0.18 : 0.18 + (W2.t - tl), P2 = pf('swipe', ts, { arm: W2.arm });
      if (P2) { tg.arms[W2.arm] = P2.arms[W2.arm]; tg.roll = (tg.roll || 0) + (P2.roll || 0); tg.pitch += P2.pitch || 0; tg.live = Math.min(tg.live == null ? 1 : tg.live, P2.live == null ? 1 : P2.live); } }
    if (S.mode === 'intro') { const e = S.introT; tg.open = lerp(0, base.open, sstep(2.2, 3.6, e)); tg.heart = lerp(0.1, 2.2, sstep(0.6, 2.2, e)) - sstep(2.6, 3.8, e) * 1.2; tg.glow = 0.6 * (1 - sstep(2.6, 4.0, e)); tg.seam = 1 - sstep(2.4, 3.2, e); tg.ringK = 3 - sstep(2.6, 4.2, e) * 2; tg.fold = 1 - sstep(2.2, 3.4, e); tg.spread = 0.6 * sstep(2.6, 3.4, e) * (1 - sstep(3.6, 4.6, e)); tg.live = sstep(2.6, 4.2, e); }
    else if (S.mode === 'dead') { const e = S.deadT; tg.stagger = Math.sin(Math.min(1, e / 0.6) * Math.PI) * 0.9; tg.fold = sstep(1.0, 3.0, e); tg.open = lerp(base.open, 0, sstep(1.2, 3.2, e)); tg.heart = lerp(1.4, 0.05, sstep(0.4, 2.8, e)); tg.dark = sstep(0.6, 2.4, e) * 0.7; tg.ringK = lerp(1, 0.05, sstep(0.3, 2.6, e)); tg.eye = lerp(base.eye, 0, sstep(0.5, 2.2, e)); tg.seam = sstep(2.4, 3.2, e); tg.pitch = 0.12 * sstep(0.6, 2.0, e); tg.live = 1 - sstep(0.3, 2.0, e); for (const q of tg.arms) { q.raise = -0.3 * sstep(0.6, 2.2, e); q.ext = 0.05; q.claw = 0.3; } }
    if (S.pad && S.pad.kind === 'shell' && S.mode === 'fight') { tg.seam = Math.max(tg.seam, 0.5); tg.heart += 0.3 + 0.4 * (1 - S.pad.left / S.pad.pool); }
    if (m.stunT > 0 && S.mode === 'fight') { const u = Math.min(1, m.stunT / 0.6); tg.stagger = 0.6 * u + 0.25 * Math.sin(S.t * 7) * u; tg.pitch -= 0.1 * u; tg.ringK *= 0.4; tg.eye *= 0.5; tg.open = lerp(tg.open, 0.7, u); tg.live = (tg.live == null ? 1 : tg.live) * (1 - 0.6 * u); }
    if (m.flinch > 0) { m.flinch = Math.max(0, m.flinch - dt * 2.5); tg.stagger = Math.max(tg.stagger, Math.sin(m.flinch * Math.PI) * 0.7); }
    S.charge = Math.max(0, (S.charge || 0) - dt * 0.12);
    const pz = MVv && MVv.easePose ? MVv.easePose(S, tg, dt) : (S.pz = tg);
    const vx = B.vx || 0, vy = B.vy || 0; S.ax = lerp(S.ax || 0, (vx - (S.lvx || 0)) / Math.max(dt, 1e-3), 0.3); S.ay = lerp(S.ay || 0, (vy - (S.lvy || 0)) / Math.max(dt, 1e-3), 0.3); S.lvx = vx; S.lvy = vy;
    const yawT = S.mode === 'fight' ? Math.max(-0.5, Math.min(0.5, -Math.atan2(me.x - m.x, Math.max(0.6, me.y - m.y)) * 0.7)) : 0;
    S.yaw = lerp(S.yaw || 0, yawT, Math.min(1, dt * 2.2));
    if (okGL) try { ABADDON_GL.springs(B, 8, S.ax, S.ay, dt); } catch (e) {}
    B.abP = Object.assign(base, pz, { arm: pz.arms, yaw: S.yaw, bank: Math.max(-0.2, Math.min(0.2, -vx * 0.05)) + (pz.roll || 0), pitch: pz.pitch + Math.max(-0.1, Math.min(0.1, vy * 0.03)), k: 3, t: B.at, look: [0, 0] });
  }

  /* ================= drawing ================= */
  function safeDraw(c, f) { if (!S || S.mode === 'over') return; c.save(); try { f(c); } catch (e) { if (!S.drawErr) { S.drawErr = 1; try { console.warn('Abaddon boss draw: ' + (e && e.message || e)); } catch (e2) {} } } c.restore(); }
  const sx = x => S.X.sx(x), sy = y => S.X.sy(y), Tz = () => S.X.Tz();
  const hoverOf = () => Tz() * (TUNE.hover + (S.B.drop || 0) + (S.B.lift || 0));
  /* the ground: its shadow, the Reavers' paths, the fields, the reach of the requiem, the claw's crescent, the moonlight pockets */
  function drawGroundLayer(c) {
    const T = Tz(), B = S.B, on = gpu(), g = S.g, al0 = B.alpha;
    // the shadow of a floating god (soft, larger and fainter as it rises)
    { const k2 = 1 / (1 + (B.drop || 0) * 0.4); if (typeof shadeSprite === 'function') { c.globalAlpha = 0.38 * al0 * k2; blitSized(c, shadeSprite('#05030A'), sx(B.x) - T * 2.1 / k2, sy(B.y) - T * 0.7 / k2, T * 4.2 / k2, T * 1.4 / k2); c.globalAlpha = 1; } }
    if (!on) { drawGround2d(c); return; }
    const Q = fgOpen(c);
    for (const s of S.slashes) slashGround(Q, s, T);
    for (const f of S.fields) fieldGround(Q, f, T);
    for (const w of S.waves) { const u = w.t / 1.0, R = w.R * T * eout(w.t / 0.45), X0 = sx(w.x), Y0 = sy(w.y); if (R > 2) { Q.quad(130, X0, Y0, R / 0.94 + 2, 0, 0, R / 0.94 + 2, w.small ? COL.sap : COL.ice, (1 - u) * (w.small ? 0.6 : 0.8), 0.9, 0.2, (w.small ? 0.7 : 1.0) * (1 - u)); Q.glow(X0, Y0, R * 1.05, COL.sap, 0.18 * (1 - u)); } }
    // the seal's reach: a faint pale ring on the floor, growing with what it stores; its dark field
    const E = S.acts.find(A => A.kind === 'ecl'); if (E && E.t < E.seal + 0.05) { const R = eclR() * T, X0 = sx(S.m.x), Y0 = sy(S.m.y), u = sstep(0, 0.6, E.t), pul = 0.5 + 0.5 * Math.sin(g.t * (4 + eclFill() * 6)), hot = sstep(E.seal - 0.7, E.seal, E.t);
      Q.quad(124, X0, Y0, R * 1.1, 0, 0, R * 1.1, DUSK, 0.26 * u, 0.86, 0.12, 0); Q.quad(126, X0, Y0, R, 0, 0, R, COL.sap, 0.3 * u, u, -1.6, 0.6 * u); Q.ring(X0, Y0, R, COL.ice, (0.35 + 0.2 * pul + 0.35 * hot) * u, T * (0.16 + 0.08 * hot), 1); }
    // the claw's crescent of light on the floor before the sweep
    for (const w of S.sweeps) if (w.t < w.tell) { const k2 = sstep(0, w.tell, w.t), X0 = sx(S.m.x), Y0 = sy(S.m.y), R = TUNE.swR * T, head = w.arm === 0 ? 0.35 : Math.PI - 0.35; Q.quad(145, X0, Y0, R / 0.8, 0, 0, R / 0.8, DUSK, 0.3 + 0.3 * k2, head + 1.6, 3.2, 0.32); Q.quad(120, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.sap, 0.45 + 0.55 * k2, head + 1.6, 3.2, 0.4); Q.quad(120, X0, Y0, R / 0.8, 0, 0, R / 0.8, COL.ice, 0.25 + 0.4 * k2, head + 1.6, 3.2, 0.1); }
    // the shell's field round its foot
    if (S.pad && S.pad.kind === 'shell') { const P = S.pad, X0 = sx(S.m.x), Y0 = sy(S.m.y), R = T * 2.6, k2 = P.left / P.pool, al = Math.min(1, P.t / 0.3) * Math.min(1, (P.life - P.t) / 0.4); Q.quad(121, X0, Y0, R, 0, 0, R, COL.sap, 0.55 * al, 1, g.t * 0.5, 0.8); Q.quad(120, X0, Y0, R * 1.1 / 0.8, 0, 0, R * 1.1 / 0.8, COL.ice, al * 0.8, Math.PI * 0.5 + k2 * Math.PI, k2 * TAU * 0.999, 0.05); }
    fgClose(c);
    if (S.t9) t9GroundLayer(c, T);
  }
  function slashGround(Q, s, T) {
    const x0 = sx(s.x0), y0 = sy(s.y0), x1 = sx(s.x0 + s.ux * s.L), y1 = sy(s.y0 + s.uy * s.L), mx = (x0 + x1) / 2, my = (y0 + y1) / 2, hx = (x1 - x0) / 2, hy = (y1 - y0) / 2, hl = Math.hypot(hx, hy) || 1, w = s.w * 0.5 * T, nx = -hy / hl * w, ny = hx / hl * w;
    if (s.dead) { const u = cl((s.t - s.fade) / 0.35); Q.quad(128, mx, my, hx, hy, nx, ny, COL.ice, 0.4 * (1 - u), 4, s.seed); return; }
    if (s.t < s.tell) { const k = cl(s.t / s.tell), pul = 0.5 + 0.5 * Math.sin(S.g.t * 14 + s.seed), in0 = sstep(0, 0.25, s.t);
      Q.quad(144, mx, my, hx, hy, nx * 1.5, ny * 1.5, DUSK, (0.32 + 0.28 * k) * in0);   // (the soft dark band: it reads on the pale floor)
      Q.quad(128, mx, my, hx, hy, nx * 0.7, ny * 0.7, COL.sap, (0.3 + 0.3 * k + 0.1 * pul * k) * in0, 7 + k * 10, s.seed + 3);
      Q.rbeam(x0, y0, x1, y1, T * (0.04 + 0.03 * k), COL.ice, (0.25 + 0.4 * sstep(0.4, 1, k)) * in0, 0, 0); return; }
    // the cut: light left in the blade's wake, fading back along it
    const e = s.prog / s.L, fade = 1 - cl((s.t - s.tell - s.L / TUNE.revSpd) / 0.45), bx = x0 + (x1 - x0) * e, by = y0 + (y1 - y0) * e;
    Q.quad(144, (x0 + bx) / 2, (y0 + by) / 2, (bx - x0) / 2, (by - y0) / 2, nx * 1.3, ny * 1.3, DUSK, 0.3 * fade); Q.rbeam(x0, y0, bx, by, T * 0.36, COL.sap, 0.32 * fade, 0, 1); Q.rbeam(x0, y0, bx, by, T * 0.1, COL.ice, 0.5 * fade, 0, 1);
  }
  function fieldGround(Q, f, T) {
    const X0 = sx(f.x), Y0 = sy(f.y), R = f.R * T, op = eout(f.t / Math.max(0.3, f.open)), fade = f.end ? 1 - cl((f.t - f.endT) / 0.5) : 1, live = f.t > f.open && !f.end ? 1 : 0.55;
    Q.quad(124, X0, Y0, R * 1.12 * Math.max(0.15, op), 0, 0, R * 1.12 * Math.max(0.15, op), DUSK, (0.3 + 0.12 * live) * fade, 0.84, 0.18, 0);   // (the soft dark under the field)
    Q.quad(126, X0, Y0, R, 0, 0, R, COL.sap, (0.42 * live + 0.08) * fade, op, 1.2, 0.7 * fade); Q.quad(121, X0, Y0, R * 1.04, 0, 0, R * 1.04, COL.ice, 0.28 * fade, op, S.g.t * 0.4, 0.6);
    if (f.t > f.open && !f.end) Q.glow(X0, Y0, TUNE.tideCore * T, COL.sap, 0.08 + 0.16 * sstep(f.open + f.on - 1, f.open + f.on, f.t));
  }
  function drawGround2d(c) {
    const T = Tz(); c.save(); c.globalCompositeOperation = 'lighter';
    for (const s of S.slashes) { if (s.dead) continue; const k = s.t < s.tell ? cl(s.t / s.tell) : 1 - cl((s.t - s.tell) / 0.6); softRay(c, sx(s.x0), sy(s.y0), sx(s.x0 + s.ux * s.L), sy(s.y0 + s.uy * s.L), T * s.w, COL.ice, 0.25 + 0.4 * k); }
    for (const f of S.fields) { const op = eout(f.t / f.open), fade = f.end ? 1 - cl((f.t - f.endT) / 0.5) : 1; c.globalAlpha = 0.35 * fade; blitSized(c, glowSprite(COL.sap), sx(f.x) - f.R * T * op, sy(f.y) - f.R * T * op, f.R * T * 2 * op, f.R * T * 2 * op); }
    const E = S.acts.find(A => A.kind === 'ecl'); if (E && E.t < E.seal) { const R = eclR() * T; c.globalAlpha = 0.3; blitSized(c, shockSprite(COL.ice), sx(S.m.x) - R, sy(S.m.y) - R, R * 2, R * 2); }
    if (S.t9) for (const p of S.t9.pockets) { const R = S.t9.pr * T * 1.5; c.globalAlpha = 0.7; blitSized(c, glowSprite(COL.moon), sx(p.x) - R, sy(p.y) - R, R * 2, R * 2); }
    c.restore();
  }
  /* the body: its aura, the model (GPU, or its cel model), the light over it */
  function drawBodyLayer(c) {
    if (S.t9 && S.mode === 'fight') return;   // (the Ninth Tide draws it itself, over its dark)
    drawBody(c, null);
  }
  function drawBody(c, Pover) {
    const B = S.B, T = Tz(), X0 = sx(B.x), Y0 = sy(B.y) - hoverOf(), size = T * TUNE.size, al = B.alpha; if (!(al > 0.01)) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.32 + 0.08 * Math.sin(B.at * 2)) * al; const gs = size * 0.55; blitSized(c, glowSprite(S.phase >= 3 ? COL.violet : COL.sap), X0 - gs, Y0 - size * 0.5 - gs, gs * 2, gs * 2); c.restore();
    if (S.m.flash > 0 && S.mode === 'fight') { /* (a blow: a breath of light over it, below) */ }
    const keep = B.abP; if (Pover) B.abP = Pover;
    c.save(); try { AnimaArt.draw(c, 'cancer', 3, X0, Y0, size, B.at, { inst: B, alpha: al, aura: false }); } finally { c.restore(); B.abP = keep; }
    if (S.inst && B.abOut && B.abOut.r && gpu()) try { if (typeof S.inst.bodyLight === 'function') S.inst.bodyLight(c, B.abOut.r, Pover || B.abP || {}, al, B.at); else S.inst.drawBodyFx(c, B); } catch (e) {}
    if (S.m.flash > 0 && S.mode === 'fight') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22; const s2 = size * 0.4; blitSized(c, glowSprite('#FFFFFF'), X0 - s2, Y0 - size * 0.5 - s2, s2 * 2, s2 * 2); c.restore(); }
  }
  /* the sky: the hush of an eclipse or the Tide, the shell's panels, the blades, the fields' spheres, the Anima's own effects */
  function drawSkyLayer(c) {
    const T = Tz(), g = S.g, X = S.X, W = X.W(), Hh = X.H(), on = gpu(), B = S.B;
    let dim = 0; if (S.mode === 'intro') dim = 0.45 * (1 - sstep(3.0, 4.6, S.introT)); if (S.mode === 'dead') dim = 0.35 * sstep(0, 0.6, S.deadT) * (1 - sstep(3.4, 4.6, S.deadT));
    if (S.t9) { const t = S.t9.t; dim = Math.max(dim, 0.6 * sstep(0, 0.6, t) * (1 - 0.35 * sstep(TUNE.t9Strike + 0.1, TUNE.t9Strike + 0.5, t)) * (1 - sstep(TUNE.t9Len - 1.4, TUNE.t9Len, t))); }   // (the hush holds through the blast: its light reads against the dark and is gone in a breath)
    const E = S.acts.find(A => A.kind === 'ecl'); if (E) dim = Math.max(dim, 0.26 * sstep(0, 0.5, E.t) * (1 - sstep(E.seal, E.seal + 0.25, E.t)));
    if (dim > 0.005) { c.save(); c.globalCompositeOperation = 'source-over'; const fx = sx(B.x), fy = sy(B.y) - hoverOf() - T * 2.6, gr = c.createRadialGradient(fx, fy, Math.min(W, Hh) * 0.12, fx, fy, Math.max(W, Hh) * 0.8); gr.addColorStop(0, `rgba(10,6,30,${dim * 0.6})`); gr.addColorStop(1, `rgba(4,2,16,${Math.min(0.92, dim * 1.4)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
    if (S.t9 && S.mode === 'fight') { drawT9(c); return; }
    const blades = [];
    if (on) { const Q = fgOpen(c);
      for (const s of S.slashes) slashSky(Q, s, T, blades);
      for (const f of S.fields) fieldSky(Q, f, T);
      if (S.pad && S.pad.kind === 'shell') shellSky(Q, T);
      if (S.pad && S.pad.kind === 'seal' && S.pad.hit > 0) { const r = B.abOut && B.abOut.r; if (r) Q.glow(r.heart[0], r.heart[1], T * 1.6, COL.ice, 0.4 * S.pad.hit); }
      fgClose(c); }
    else for (const s of S.slashes) if (!s.dead && s.t > s.tell && s.prog < s.L) { const e = s.prog, x = sx(s.x0 + s.ux * e), y = sy(s.y0 + s.uy * e) - T * 0.6; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(COL.ice), x - T, y - T, T * 2, T * 2); c.restore(); }
    if (S.inst) try { c.save(); c.globalCompositeOperation = 'lighter'; S.inst.drawFx(c); c.restore(); } catch (e) {}
    if (blades.length && glOn()) { c.save(); c.globalCompositeOperation = 'source-over'; try { ABADDON_GL.drawParts(c, blades); } catch (e) {} c.restore(); }
  }
  function slashSky(Q, s, T, blades) {
    if (s.dead || s.t <= s.tell || s.prog >= s.L) return; const e = s.prog, x = sx(s.x0 + s.ux * e), y = sy(s.y0 + s.uy * e) - T * 0.7, a = Math.atan2(s.uy, s.ux), vis = sstep(0, 0.06, s.t - s.tell) * (1 - sstep(s.L - 1.2, s.L, e));
    const bx = x - s.ux * T * 3.2, by = y - s.uy * T * 3.2;
    Q.rbeam(bx, by, x, y, T * 0.7, COL.sap, 0.3 * vis, 0, 1); Q.rbeam(bx, by, x, y, T * 0.16, COL.ice, 0.6 * vis, 0, 1);
    Q.glow(x, y, T * 0.9, COL.sap, 0.25 * vis); Q.star(x, y, T * 0.5, 0.45 * vis, COL.white);
    for (let i = 0; i < 3 * LQ(); i++) { const d = (i + 1) * 0.9 * T, rot = S.g.t * 9 + i * 2 + s.seed, ss = T * 0.18; Q.quad(129, x - s.ux * d + Math.sin(i * 3 + s.seed) * T * 0.3, y - s.uy * d, Math.cos(rot) * ss, Math.sin(rot) * ss, -Math.sin(rot) * ss, Math.cos(rot) * ss, COL.ice, vis * (0.8 - i * 0.2)); }
    blades.push({ x, y, rot: a + Math.PI / 2 + (s.side ? Math.PI : 0), tilt: s.side ? 0.5 : -0.5, s: T * 0.78, a: vis, b: s.side });
  }
  function fieldSky(Q, f, T) {
    const X0 = sx(f.x), Y0 = sy(f.y), on = sstep(f.open - 0.3, f.open + 0.3, f.t) * (f.end ? 1 - cl((f.t - f.endT) / 0.4) : 1), R = f.R * T, n = Math.round(10 * LQ()); if (on <= 0.01) return;
    for (let i = 0; i < n; i++) { const ph = i / n * TAU + f.t * (1.2 + (i % 3) * 0.3), rr = R * (0.85 - 0.5 * ((f.t * 0.3 + i * 0.13) % 1)), h = T * (0.4 + 1.3 * ((i * 0.618 + f.t * 0.4) % 1)), x = X0 + Math.cos(ph) * rr, y = Y0 + Math.sin(ph) * rr - h;
      if (i % 3 === 0) Q.wsphere(x, y, T * (0.2 + (i % 2) * 0.08), COL.teal, on * 0.9, i + f.seed, 1, 0.7, 1);
      else if (i % 3 === 1) Q.quad(80, x, y, T * 0.2, 0, 0, T * 0.2, '#5A5E72', on, f.t * 2 + i, i + f.seed, 0);
      else Q.glow(x, y, T * 0.22, COL.ice, on * 0.35); }
    for (let s = 0; s < 3; s++) { let px = null, py = null; for (let j = 0; j <= 10; j++) { const v = j / 10, an = s / 3 * TAU + v * 5 - f.t * 3, rr = R * 0.75 * (1 - v * 0.75), x = X0 + Math.cos(an) * rr, y = Y0 + Math.sin(an) * rr - v * T * 2.6; if (px != null) Q.beam(px, py, x, y, T * 0.05, COL.ice, on * 0.35 * (1 - v * 0.5)); px = x; py = y; } }
    if (f.inside) { const me = S.me; Q.glow(sx(me.x), sy(me.y) - T * (0.5 + S.petZ), T * 0.7, COL.sap, 0.18 * on); }
  }
  function shellSky(Q, T) {
    const P = S.pad, B = S.B, r = B.abOut && B.abOut.r, X0 = r && r.shell ? r.shell[0] : sx(B.x), Y0 = r && r.shell ? r.shell[1] : sy(B.y) - T * 3, R = (r && r.shellR ? r.shellR : T * 1.6) * 1.55 * (1 + 0.03 * Math.sin(S.g.t * 3));
    const al = Math.min(1, P.t / 0.3) * Math.min(1, (P.life - P.t) / 0.4) * (0.55 + 0.45 * P.left / P.pool);
    Q.quad(122, X0, Y0, R, 0, 0, R, COL.sap, al, P.hit ? P.hit[0] : 0, S.g.t * 0.5, P.hit ? P.hit[1] : 0); Q.glow(X0, Y0, R * 1.15, COL.deep, 0.3 * al);
  }

  /* ---- The Ninth Tide's pictures: the Anima's own (20g2's inst.drawTide9: the god risen over its floor point, the sea lifted and
     crushed, the blast; pure, its timings remapped onto ours), with the boss's pockets of moonlight laid with it ---- */
  const POCK = '#FFD98A', DUSK = '#1A0B33';   // (the pockets' warm moonlight: gold, against the lilac and the Tide's blue; DUSK the tells' soft dark underlay, FGFX 144/145/124)   // (the pockets' warm moonlight: gold, against the arena's lilac and the Tide's blue)
  const t9Hook = () => (S.inst && typeof S.inst.drawTide9 === 'function' ? S.inst : null);
  const t9Args = o => Object.assign({ x: S.m.x, y: S.m.y, t: S.t9.t, seed: S.t9.seed, k: 3, alpha: 1, strike: TUNE.t9Strike, rel: TUNE.t9Strike + 0.75, len: TUNE.t9Len, r: Math.max(AR.rx, AR.ry), at: S.B.at, size: TUNE.size, hover: TUNE.hover, glowK: 0.6, blastT: 0.4 }, o);
  // the pockets of moonlight: warm seals on the floor, brightening toward the blast
  function pocketsGround(Q, T, J, t) {
    const pk = sstep(TUNE.t9Open, TUNE.t9Open + 0.6, t) * (1 - sstep(TUNE.t9Strike + 0.5, TUNE.t9Strike + 1.2, t)), hot = sstep(TUNE.t9Strike - 1.4, TUNE.t9Strike, t);
    if (pk > 0.01) for (const p of J.pockets) { const px = sx(p.x), py = sy(p.y), pr = J.pr * T, pul = 0.5 + 0.5 * Math.sin(t * 5 + p.a); Q.glow(px, py, pr * 2.0, POCK, (0.45 + 0.35 * hot) * pk); Q.quad(121, px, py, pr * 1.05, 0, 0, pr * 1.05, POCK, (1.1 + 0.5 * hot) * pk, eout((t - TUNE.t9Open) / 0.8), t * 0.3 + p.a, 1.2); Q.ring(px, py, pr, POCK, (0.7 + 0.3 * pul) * pk, T * 0.16, 1); Q.glow(px, py, pr * 0.9, '#FFF6E0', (0.25 + 0.3 * hot) * pk); }
  }
  // and their columns of light from the sky down to the floor (glow only)
  function pocketsSky(Q, T, J, t) {
    const strike = TUNE.t9Strike, pk = sstep(TUNE.t9Open, TUNE.t9Open + 0.6, t) * (1 - sstep(strike + 0.5, strike + 1.2, t)), hot = sstep(strike - 1.4, strike, t);
    if (pk > 0.01) for (const p of J.pockets) { const px = sx(p.x), py = sy(p.y); Q.shafts(px, py - T * 7, px, py, T * J.pr * 1.0, POCK, (0.6 + 0.4 * hot) * pk, p.a * 10); Q.glow(px, py - T * 0.8, T * J.pr * 1.4, POCK, (0.3 + 0.25 * hot) * pk); for (let i = 0; i < 3 * LQ(); i++) { const v = (t * 0.4 + i / 3) % 1; Q.star(px + Math.sin(i * 2.1 + t) * T * J.pr * 0.6, py - v * T * 3, T * 0.12, pk * (1 - v), COL.moon); } }
  }
  function t9GroundLayer(c, T) {
    const hk = t9Hook(); if (hk) try { hk.drawTide9(c, t9Args({ groundOnly: true })); } catch (e) {}   // (the pockets are laid after the hush, in the sky pass: bright in the dark)
  }
  function drawT9(c) {
    const J = S.t9, T = Tz(), hk = t9Hook();
    if (hk) { try { const r = hk.drawTide9(c, t9Args({ skyOnly: true })); S.B.abOut = { r: r && r.r }; } catch (e) {} }
    else drawBody(c, null);   // (no effect layer: the god itself)
    if (gpu()) { const Q = fgOpen(c); pocketsGround(Q, T, J, J.t); pocketsSky(Q, T, J, J.t); fgClose(c); }
    else { c.save(); c.globalCompositeOperation = 'lighter'; for (const p of J.pockets) { const R = J.pr * T * 2; c.globalAlpha = 0.6; blitSized(c, glowSprite(COL.moon), sx(p.x) - R, sy(p.y) - R * 1.6, R * 2, R * 2.4); } c.restore(); }
  }

  /* ---- the health bars (in the HUD's place, 20b: m.ownBar): one stacked bar of TUNE.bars, its count, the phase pips, the shell's pool over it ---- */
  function drawBar(c, W) {
    if (!S || S.mode === 'over') return; const m = S.m; if (m.dead && S.mode !== 'dead') return;
    const left = Math.max(0, realHp()), bar = S.barHP, n = Math.max(0, Math.ceil(left / bar - 1e-9)), cur = n ? (left - (n - 1) * bar) / bar : 0;
    S.barShow = S.barShow == null ? n - 1 + cur : S.barShow + ((n - 1 + cur) - S.barShow) * 0.06; if (Math.abs(S.barShow - (n - 1 + cur)) > 1.2) S.barShow = n - 1 + cur;
    const bw = Math.min(140, W * 0.36), x0 = W - 12 - bw, by = 10 + Math.min(88, W * 0.24) + 14, cols = ['#B983F5', '#6FA2FF', '#7FE6FF', '#C9B4FF', '#E8C27A', '#9A7CFF', '#BFD8FF', '#FFFFFF'];
    c.save(); c.globalAlpha = 0.92;
    GFX.labelS(c, 'ABADDON', x0, by, 8.5, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'left');
    for (let i = 0; i < 3; i++) { const px = x0 + bw - 26 - (2 - i) * 8, onP = i < S.phase; c.fillStyle = onP ? COL.lilac : 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(px, by - 3.5); c.lineTo(px + 3, by); c.lineTo(px, by + 3.5); c.lineTo(px - 3, by); c.closePath(); c.fill(); }
    const bh = 5, yb = by + 7, ci = Math.max(0, n - 1), under = n > 1 ? cols[(ci - 1) % cols.length] : null, colNow = cols[ci % cols.length];
    c.fillStyle = 'rgba(0,0,0,.55)'; GFX.rr(c, x0 - 1, yb - 1, bw + 2, bh + 2, 4); c.fill();
    if (under) { c.fillStyle = hexA(under, 0.6); GFX.rr(c, x0, yb, bw, bh, 3); c.fill(); }
    const showCur = cl(S.barShow - ci); if (showCur > cur) { c.fillStyle = 'rgba(255,255,255,.7)'; GFX.rr(c, x0, yb, Math.max(6, bw * showCur), bh, 3); c.fill(); }
    if (cur > 0) { const gr = c.createLinearGradient(x0, 0, x0 + bw, 0); gr.addColorStop(0, shadeC(colNow, -0.25)); gr.addColorStop(1, colNow); c.fillStyle = gr; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh, 3); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; GFX.rr(c, x0, yb, Math.max(6, bw * cur), bh * 0.4, 2); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 5; i++) c.fillRect(x0 + bw * i / 5, yb + 1, 1, bh - 2);
    // the Carapace's pool: a pale band over the bar
    if (S.pad && S.pad.kind === 'shell') { const k2 = cl(S.pad.left / S.pad.pool); c.fillStyle = 'rgba(191,216,255,.85)'; GFX.rr(c, x0, yb - 4, Math.max(4, bw * k2), 2.5, 1.2); c.fill(); }
    if (S.pad && S.pad.kind !== 'shell') { c.globalAlpha = 0.5 + 0.3 * Math.sin(S.g.t * 6); c.strokeStyle = S.pad.kind === 'seal' ? COL.ice : COL.moon; c.lineWidth = 1.2; GFX.rr(c, x0 - 1.5, yb - 1.5, bw + 3, bh + 3, 4); c.stroke(); c.globalAlpha = 0.92; }
    GFX.labelS(c, `×${n}`, x0 + bw, by, 9, 900, '#FFFFFF', 'rgba(0,0,0,.7)', 3, 'right');
    c.restore();
  }
  const hexA = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };

  /* ---- for the harness ---- */
  const test = {
    get S() { return S; }, AR, start, startT9, requiem, abortActs, phaseUp, eclR, eclMul, realHp: () => (S ? realHp() : 0),
    hold(on) { if (S) S.noAI = !!on; },
    force(kind) { if (!S || S.mode !== 'fight') return null; abortActs(); S.idleT = 99; S.swCd = 99; if (kind === 't9') { startT9(false); return S.t9; } const A = start(kind); return A; },
    skipIntro() { if (!S || S.mode !== 'intro') return; S.introT = TUNE.intro - 0.01; },
  };
  // (the gate may also ask these straight: the same answers its chained module gives)
  const cam = () => (S && S.mode !== 'over' ? camOf() : null), goal = () => (S ? goalText() : ''), hideHud = () => false, onBossDeath = mm => !!(S && mm === S.m && (onDeath(), true));
  return { begin, active, stop, update, drawGround() {}, drawOver() {}, cam, goal, hideHud, onBossDeath, TUNE, test };
})();
if (typeof self !== 'undefined') self.CANCER_BOSS = CANCER_BOSS;
