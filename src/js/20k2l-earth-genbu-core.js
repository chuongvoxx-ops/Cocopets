/* ---------- Earth, the 11th Ultimate: Genbu, the core (worker A) ----------
   The pet summons Genbu, a gigantic mechanical turtle with a working drill on its back, and rides it (20 / 25 / 35 s at
   evo 1-3 / 4-6 / 7, from the moment it can walk). Through 20b's generic vehicle hook (X.vehicle, as Beast Machine):
     - movement walks and steers the turtle (heavy: momentum, a slow turn); its body tramples what it walks through;
     - Dodge is Shell Roll: head, legs and tail tuck in, the shell spins across the field (one circle hit per monster per
       roll, knocked aside), then it unfolds;
     - Jump (its own button above Dodge, and J) is a heavy hop that lands in an Earth stomp; both are always available;
     - Strong 1 is Rock You: it braces, crystals erupt under the target (phase 1), pause, then explode (phase 2);
     - Strong 2 is Drill Cannon: the bit is fired at the target, stays there drilling into the ground, then explodes, and
       a new bit materialises on the carriage (only another Drill Cannon waits for it);
     - the Ult button is the Calamity gauge: it fills from the damage the mounted attacks really deal; a press when full
       recalls the bit if it is out, transforms the turtle into a drilling vehicle that the player steers over and under
       the ground (one command: DRILL under, RISE up), and ends in eight Earth drills bursting together; then the vehicle turns
       back into the turtle, the pet steps down, and the turtle crumbles.
   One damage path (ctx.hit / hitArea / hitOval: after mitigation, no overkill, gauge, scenery smash). E's effects file
   (20k2m, GENBU_MOVES) only draws from the plans published on ctx; the lead's model (20k2kz, GENBU_MODEL: GPU, with its own 2D
   fallback) draws the body when present, else the placeholder below. Every exit restores the controls and starts the 120 s cooldown once.
   See docs/EARTH-GENBU-BRIEF.md. */
(() => {
  const U = ELEM_IMPL.earth.ult;
  const TAU = Math.PI * 2;
  const AMBER = '#FFB547', ORANGE = '#C9612A', SAND = '#D9C49A', SANDD = '#A68E64', STEEL = '#5B5650', DUST = '#CDBA98', WHITE = '#FFFFFF', DEEP = '#7A4A22';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1))), tierOf = ev => ev >= 7 ? 2 : ev >= 4 ? 1 : 0;
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  const bump = (u, a, b, c2) => u <= a || u >= c2 ? 0 : u < b ? sstep(a, b, u) : 1 - sstep(b, c2, u);
  /* the camera (as Beast Machine's): a ground offset of one tile across is one tile on screen, GY toward the viewer, ZK of height */
  const GY = 0.72, ZK = 0.695;
  const groundA = a => Math.atan2(Math.sin(a), GY * Math.cos(a));
  const hexRGB = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };

  /* ================= the tuning (configurable; provisional values, see the brief) ================= */
  const TUNE = {
    dur: [20, 25, 35], cd: 120, summon: 2.6, dmgK: 6, chargeK: 30,   /* (v336, the user: "triple the damage of all Genbu attacks including ults": dmgK 2 -> 6 (every hit goes through hitCharge; the gauge's rate is unchanged); the summon drills up out of the ground, then the pet climbs on) */
    top: 6.5, accel: 9, coast: 7, overK: 6, steer: [2.2, 3.2], grip: 6, bumpK: 0.3, stride: 2.8,
    contact: 0.5, contactGate: 0.5, contactMin: 0.25, contactKb: 3.5,
    roll: 2.6, rollR: 2.2, rollKb: 6.5, rollPh: [0.12, 0.7, 0.25], rollV: 15, rollTurn: 3.5, rollCd: 1.1, rollInv: 0.3, rollBuf: 0.3,
    jump: 2.8, jumpR: 2.8, jumpKb: 7, jumpPh: [0.16, 0.8, 0.08], jumpH: 1.9, jumpD: 4.2, jumpMax: 6, jumpExt: 1.4, jumpBuf: 0.3, jumpInv: 0.3, jumpInvLock: 1.8,
    rock: { brace: 0.35, n: [5, 6, 7], spread: 3.0, crystalR: 1.1, rise: 0.08, erupt: 1.6, pause: 0.7, burst: 2.4, burstR: 3.4, range: 9, cd: 2.2, kb: 4 },
    drill: { spin: 0.45, out: 0.5, arc: 1.1, range: 9, drill: 1.2, tick: 0.3, ticks: 4, drillR: 1.7, dmg: 0.9, impact: 3.2, impactR: 3.0, mat: 0.6, cd: 2.6, kb: 5 },   /* (v336, the user: fired at the enemies, the bit stays there and drills, then explodes; a new drill materialises on Genbu) */
    cal: { xform: 1.6, dur: [16, 18, 20], top: 9, accel: 18, steer: 3.4, underZ: -1.05, leapZ: 1.4, leapT: 0.7, dive: 0.35, rise: 0.3, dmg: 1.2, gate: 0.4, emerge: 2.0, emergeR: 3.0, emergeGate: 0.6, kb: 5,
      climax: { n: 8, sep: 2.2, reach: 8, rise: 0.6, spin: 1.3, erupt: 1.5, eruptR: 2.2, burst: 6.0, burstR: 3.2, hold: 0.7 }, revert: 1.0, cap: 40 },   /* (v336, the user: Calamity 10 s -> 20 s: the drilling doubled at every tier) */
    out: { dismount: 0.3, crumble: 1.6 }, mvHold: 0.8,
  };
  const SUMMON = { burst: 1.0, mount0: 1.9, mount1: 2.35 };   /* (v336: the drill breaks the surface at 1.0 s, it is the turtle again by 1.9 s, the pet hops on 1.9 to 2.35 s; walking from TUNE.summon) */
  /* the footprints (ground units): three circles along the axis; turtle and drill form */
  const FPT = { c: 0.85, e: 0.95, r: 0.62 }, FPD = { c: 0.72, e: 1.1, r: 0.5 }, BODY = { hl: 1.6, hw: 1.2 };
  /* the placeholder rig (tiles, body frame: x forward, y left, z up), turtle -> drill form; the GPU model's anchors win when present */
  const RIG = { seat: [[-0.75, 0, 1.6], [-0.95, 0, 1.2]], drillBase: [[-0.1, 0, 1.95], [0.9, 0, 0.62]], drillTip: [[1.9, 0, 2.15], [2.9, 0, 0.55]], head: [[1.75, 0, 0.75], [1.2, 0, 0.35]], tailTip: [[-1.8, 0, 0.35], [-1.5, 0, 0.35]], shellTop: [[0, 0, 1.55], [-0.1, 0, 1.15]], belly: [[0, 0, 0.3], [0, 0, 0.2]] };
  const FEET = [['footFL', 1, 1], ['footFR', 1, -1], ['footRL', -1, 1], ['footRR', -1, -1]];

  const moves = () => { try { return typeof self !== 'undefined' && self.GENBU_MOVES ? self.GENBU_MOVES : {}; } catch (e) { return {}; } };
  /* the lead's model (20k2kz, GENBU_MODEL: GPU with its own 2D fallback); the placeholder below draws only if it is absent */
  const MOD = () => (typeof GENBU_MODEL !== 'undefined' ? GENBU_MODEL : null);
  function glOn() { try { const M = MOD(); return !!(M && M.gl); } catch (e) { return false; } }
  const ANAME = { tailTip: 'tail', footFL: 'foot0', footFR: 'foot1', footRL: 'foot2', footRR: 'foot3', trackFL: 'track0', trackFR: 'track1', trackRL: 'track2', trackRR: 'track3' };

  /* ================= the form ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_genbu' && kit.ult.cd) || TUNE.cd, dur = TUNE.dur[tier];
    const tgt = X.nearestMon(me.x, me.y, 9) || null, a = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    const body = { x: me.x, y: me.y, a, vx: 0, vy: 0, speed: 0, z: 0, spin: 0, scale: 1, vis: 1, locked: true, contact: false, under: false, prevX: me.x, prevY: me.y, prevA: a };
    const S = { H, g, me, X, C, ev, tier, DK, CD, dur, left: dur, body, phase: 'summon', t: 0, charge: 0, used: false, busy: null, busyT: 0,
      cdRock: 0, cdDrill: 0, cdRoll: 0, roll: null, rollQ: null, jump: null, jumpQ: null, jumpLand: false, invT: -9, landT: -9, recover: 0, mvQ: null, calQ: null,
      inst: null, rock: null, drill: { state: 'docked', t: 0, x: 0, y: 0, z: 0, yaw: a, pitch: 0, spin: 0, trail: [], impact: null, gate: new Map(), hits: new Map() }, cal: null,
      gate: new Map(), parts: [], free: [], P: blankPose(), pet: X.pet ? X.pet() : null, gph: 0, gk: 0, absorb: 0, absV: 0, sfxT: 0, mx: 0, my: 0, ag: groundA(a),
      stats: { contact: 0, roll: 0, rollHit: 0, jump: 0, jumpHit: 0, rock: 0, rockErupt: 0, rockBurst: 0, drill: 0, drillTicks: 0, drillImpact: 0, docks: 0, recalls: 0, refused: 0,
        cal: 0, calDmg: 0, dives: 0, rises: 0, emerge: 0, drills8: 0, eruptHits: 0, burstHits: 0, crumble: 0, dealt: 0, charged: 0, hits: 0, walkT: 0, smash: 0, outsideBlocked: 0, xfT: 0 },
      vs: typeof VEH_SMASH !== 'undefined' ? VEH_SMASH.create(X, g) : null };
    g._genbu = S;
    { const M = MOD(); if (M) { try { S.inst = M.create(); S.P = S.inst.pose; } catch (e) { S.inst = null; } } }
    // its place: centred on the pet, turned or nudged until the whole shell fits
    let best = null; for (const dd of [2.6, 2.0, 1.4]) for (let k2 = 0; k2 < 7 && !best; k2++) { const ang = a + (k2 % 2 ? 1 : -1) * Math.ceil(k2 / 2) * (Math.PI / 6), x = me.x + Math.cos(ang) * dd, y = me.y + Math.sin(ang) * dd; if (!poseBlocked(S, x, y, ang, 0, true) && !S.X.blocked(x, y, 0.4, 0)) best = { x, y, a: ang }; }   /* (v336: it surfaces in front of the pet, who then climbs on) */
    for (let k2 = 0; k2 < 12 && !best; k2++) { const ang = a + (k2 % 2 ? 1 : -1) * Math.ceil(k2 / 2) * (Math.PI / 6); if (!poseBlocked(S, me.x, me.y, ang, 0, true)) best = { x: me.x, y: me.y, a: ang }; }
    if (!best) for (let r = 0.3; r < 2.8 && !best; r += 0.3) for (let i = 0; i < 12 && !best; i++) { const x = me.x + Math.cos(i / 12 * TAU) * r, y = me.y + Math.sin(i / 12 * TAU) * r; if (!poseBlocked(S, x, y, a, 0, true)) best = { x, y, a }; }
    if (best) { body.x = best.x; body.y = best.y; body.a = best.a; }
    body.prevX = body.x; body.prevY = body.y; body.prevA = body.a; S.ag = groundA(body.a);
    S.petX0 = me.x; S.petY0 = me.y; S.safe = { x: me.x, y: me.y };
    const ctx = S.ctx = { X, H, C, evo: ev, tier, DK, TUNE, body, sfx: X.sfx || {}, roll: null, jumpLand: null, rockPlan: null, drill: S.drill, calamity: null, stats: S.stats, pose: S.P,
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o), hitArea: (x, y, r, dmg, o) => hitArea(S, x, y, r, dmg, o),
      hitOval: (cx, cy, rx, ry, ang, dmg, o) => { let n = 0; const ex = o && o.exclude, ca = Math.cos(ang), sa = Math.sin(ang); for (const m of H.living()) { if (ex && (ex === m || (ex.has && ex.has(m)))) continue; const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, mr = m.r || 0.4; if ((u / (rx + mr)) ** 2 + (v / (ry + mr)) ** 2 <= 1) { if (hitCharge(S, m, dmg, o) > 0) n++; } } return n; },
      mons: () => H.living(), target: () => target(S), canStand: (x, y) => canStand(S, x, y), nearestStand: (x, y) => nearestStand(S, x, y),
      anchor: n => anchor(S, n), scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(), seat: () => anchor(S, 'seat'),
      alive: () => !S.released && !me.dead && !g.over, calm, low: lowFx, now: () => g.t, phase: () => S.phase, get summonT() { return S.phase === 'summon' ? S.t : null; }, SUMMON };
    S.veh = { get active() { return !S.released; }, drive: (mx, my, dt) => drive(S, mx, my, dt), dodge: (mx, my) => tryDodge(S, mx, my), jump: (mx, my) => tryJumpCmd(S, mx, my), strong: slot => tryMove(S, slot), ult: () => tryCalamity(S), drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap') };
    X.vehicle(S.veh);
    const F = S.fx = H.add({ key: 'genbu', life: 1e9, entY: body.y, update(dt) { step(S, dt); }, drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); }, onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    const sfx = X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) [65, 82, 98].forEach((f, i) => sfx.note(f, 0.4, 'sawtooth', 0.05, f * 0.8, i * 0.12));
    return S;
  }
  const FPof = S => (S.cal && S.cal.xf > 0.5 ? FPD : FPT);
  function poseBlocked(S, x, y, ang, mode, strict) { const B = strict || !S.vs ? S.X.blocked : S.vs.blk, F = FPof(S), ag = groundA(ang), ex = F.e * Math.cos(ag), ey = F.e * Math.sin(ag) * GY; return B(x, y, F.c, mode) || B(x + ex, y + ey, F.r, mode) || B(x - ex, y - ey, F.r, mode); }
  function canStand(S, x, y) { return !S.X.blocked(x, y, 0.38, 0) && !S.X.blocked(x, y, 0.2, 0); }
  function nearestStand(S, x, y) { const me = S.me, p = S.X.walkPoint(x, y, { r: 0.4, x: me.x, y: me.y }); return { x: p.x, y: p.y }; }
  function target(S, range) { const b = S.body, X = S.X, m = X.nearestMon(b.x, b.y, range || 9, null, true) || X.nearestMon(b.x, b.y, range || 9); if (m) return { x: m.x, y: m.y, m }; return { x: b.x + Math.cos(b.a) * 4, y: b.y + Math.sin(b.a) * 4, m: null }; }

  /* ---- damage and the gauge: each event once, after mitigation, without overkill; Calamity's own hits never charge it ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0)) return 0;
    dmg *= TUNE.dmgK || 1;
    const before = Math.max(0, m.hp), oo = Object.assign({ el: 'earth', src: 'ult' }, o || {}); delete oo.noCharge; delete oo.exclude;
    const r = S.X.hitMon(m, dmg, oo), dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && S.phase === 'walk' && !S.used && !S.released) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK * (TUNE.dmgK || 1) * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { const sfx = S.X.sfx || {}; if (sfx.note) [196, 262, 392, 523].forEach((f, i) => sfx.note(f, 0.45, 'sawtooth', 0.035, f * 1.01, i * 0.08)); S.X.text(S.me.x, S.me.y - 2.8, 'CALAMITY READY', AMBER, 15, { life: 1.4, max: 1.4, vy: -0.5 }); } }
    return dealt;
  }
  function hitArea(S, x, y, r, dmg, o) { let n = 0; const ex = o && o.exclude; for (const m of S.H.living()) { if (ex && (ex === m || (ex.has && ex.has(m)))) continue; if (Math.hypot(m.x - x, m.y - y) < r + (m.r || 0.4) * 0.85) { if (hitCharge(S, m, dmg, o) > 0) n++; } } if (!(o && o.noSmash)) smashArea(S, x, y, r); return n; }

  /* ================= walking ================= */
  function drive(S, mx, my, dt) {
    const b = S.body, me = S.me; S.mx = mx; S.my = my;
    if (S.jump) { if (me.push) me.push = null; syncMe(S); return; }
    if (S.phase === 'calamity') { if (S.cal && S.cal.phase === 'drill') driveCal(S, mx, my, dt); else hold(S, dt); syncMe(S); return; }
    if (S.phase !== 'walk' || b.locked || S.recover > 0) { hold(S, dt); syncMe(S); return; }
    if (S.jumpQ != null && !S.roll) { if (S.g.t - S.jumpQ > TUNE.jumpBuf + (S.rollEndT != null && S.jumpQ < S.rollEndT ? S.rollEndT - S.jumpQ : 0)) S.jumpQ = null; else { tryJump(S, mx, my, true); if (S.jump) { syncMe(S); return; } } }
    if (S.rollQ != null && !S.roll && !S.jump && !(S.recover > 0)) { const q = S.rollQ; S.rollQ = null; if (S.g.t - q < TUNE.rollBuf + (S.landT > q ? S.landT - q : 0)) tryRoll(S, mx, my, true); }   /* (a Shell Roll pressed in the air goes on landing) */
    if (S.roll && S.roll.ph < 2) { rollTravel(S, mx, my, dt); syncMe(S); return; }
    if (me.push) { const P = me.push; P.t -= dt; moveBody(S, P.vx * dt, P.vy * dt); if (P.t <= 0) me.push = null; }
    const braced = S.rock && S.rock.t < TUNE.rock.brace + 0.15;
    const top = TUNE.top * (me.chill > 0 ? 0.75 : 1) * (braced ? 0.15 : 1), mag = Math.min(1, Math.hypot(mx, my));
    if (mag > 0.12) { const want = Math.atan2(my, mx), da = wrap(want - b.a), rate = lerp(TUNE.steer[0], TUNE.steer[1], cl(b.speed / TUNE.top));
      b.a = wrap(b.a + clamp(da, -rate * dt, rate * dt)); const thr = mag * (Math.abs(da) > 2.2 ? 0.15 : Math.abs(da) > 1.2 ? 0.5 : 1), tgt = top * thr;
      if (b.speed < tgt) b.speed = Math.min(tgt, b.speed + TUNE.accel * dt); else b.speed = Math.max(tgt, b.speed - TUNE.overK * dt); }
    else b.speed = Math.max(0, b.speed - TUNE.coast * dt);
    const surge = 1 + 0.12 * Math.sin(S.gph * TAU * 2 + 0.6) * S.gk, vdx = Math.cos(b.a) * b.speed * surge, vdy = Math.sin(b.a) * b.speed * surge;
    b.vx += (vdx - b.vx) * Math.min(1, TUNE.grip * dt); b.vy += (vdy - b.vy) * Math.min(1, TUNE.grip * dt);
    if (moveBody(S, b.vx * dt, b.vy * dt)) { b.speed *= TUNE.bumpK; b.vx *= 0.4; b.vy *= 0.4; }
    syncMe(S);
  }
  function hold(S, dt) { const b = S.body, me = S.me; me.vx = me.vy = 0; if (me.push) me.push = null; b.speed = Math.max(0, b.speed - TUNE.coast * 2 * dt); b.vx *= 0.8; b.vy *= 0.8; }
  /* the centre moves with the walls in the way, an axis at a time in small steps (and its nose and tail too) */
  function moveBody(S, dx, dy) {
    const b = S.body, X = S.X, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.12)), ab = b.a; let hit = false;
    const B = S.vs && !b.under ? S.vs.blk : X.blocked, F = FPof(S), stuck = poseBlocked(S, b.x, b.y, ab, 0), bl = stuck ? (x, y) => B(x, y, F.c, 0) : (x, y) => poseBlocked(S, x, y, ab, 0), cStuck = stuck && B(b.x, b.y, F.c, 0);
    for (let i = 0; i < n; i++) { const sx = dx / n, sy = dy / n; b.x += sx; if (!cStuck && bl(b.x, b.y)) { b.x -= sx; hit = true; } b.y += sy; if (!cStuck && bl(b.x, b.y)) { b.y -= sy; hit = true; } }
    if (stuck && B(b.x, b.y, F.c, 0)) { const p = X.walkPoint(b.x, b.y, { r: 0.6, x: b.x, y: b.y }); b.x += (p.x - b.x) * 0.25; b.y += (p.y - b.y) * 0.25; }
    if (hit && b.under) S.stats.outsideBlocked++;
    return hit;
  }
  function syncMe(S) { const me = S.me, b = S.body; if (S.dismounted) return; if (S.phase === 'summon' && S.t < SUMMON.mount1) { me.x = S.petX0; me.y = S.petY0; me.vx = me.vy = 0; return; }   /* (the pet waits on the ground until it climbs on) */ me.x = b.x; me.y = b.y; me.vx = b.vx; me.vy = b.vy; const c = Math.cos(b.a); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; me.z = 0; }
  /* contact: the body's oval swept from its last pose to this one; one hit per pass per monster (walking: trample; Calamity: the drill) */
  function inBody(m, x, y, ab, hl, hw, pad) { const ag = groundA(ab), ca = Math.cos(ag), sa = Math.sin(ag), gx = m.x - x, gy = (m.y - y) / GY, lx = gx * ca + gy * sa, ly = -gx * sa + gy * ca, r = (m.r || 0.4) * 0.85 + pad; return (lx / (hl + r)) ** 2 + (ly / (hw + r)) ** 2 < 1; }
  function contact(S, dmgK, gateS, noCharge) {
    const b = S.body, t = S.g.t, d = Math.hypot(b.x - b.prevX, b.y - b.prevY), n = Math.max(1, Math.ceil(d / 0.35)), hl = noCharge ? 1.9 : BODY.hl, hw = noCharge ? 1.0 : BODY.hw;
    for (const m of S.H.living()) {
      if (Math.hypot(m.x - b.x, m.y - b.y) > 3 + (m.r || 0.4) + d) { const G = S.gate.get(m); if (G) G.inside = false; continue; }
      let touch = false; for (let i = 0; i <= n && !touch; i++) { const u = i / n; touch = inBody(m, lerp(b.prevX, b.x, u), lerp(b.prevY, b.y, u), b.prevA + wrap(b.a - b.prevA) * u, hl, hw, 0.04); }
      let G = S.gate.get(m); if (!G) { G = { last: -9, inside: false }; S.gate.set(m, G); }
      const enter = noCharge ? touch : touch && !G.inside; G.inside = touch;
      if (!enter || t - G.last < gateS) continue;
      G.last = t; const dealt = hitCharge(S, m, S.DK * dmgK, { kb: noCharge ? TUNE.cal.kb : TUNE.contactKb, noCharge }); S.stats[noCharge ? 'calDmg' : 'contact']++;
      stoneFx(S, m.x, m.y, 0.6, dealt > 0);
    }
  }
  /* the scenery: the props its body passed through (on the ground only; never underground), through VEH_SMASH */
  const smashOn = S => !!(S.vs && S.vs.props) && !S.released && S.body.vis > 0.05 && !S.body.under && S.body.z < 0.4;
  const smashCb = S => S.smashCb || (S.smashCb = (x, y, quiet) => { S.stats.smash++; stoneFx(S, x, y, quiet ? 0.4 : 0.8, true); });
  function inOval(px, py, x, y, ab, pad) { const ag = groundA(ab), ca = Math.cos(ag), sa = Math.sin(ag), gx = px - x, gy = (py - y) / GY, lx = gx * ca + gy * sa, ly = -gx * sa + gy * ca; return (lx / (BODY.hl + 0.1 + pad)) ** 2 + (ly / (BODY.hw + 0.2 + pad)) ** 2 < 1; }
  function smashSweep(S) {
    if (!smashOn(S)) return; const b = S.body, d = Math.hypot(b.x - b.prevX, b.y - b.prevY), n = Math.min(24, Math.max(1, Math.ceil(d / 0.35))), R = BODY.hl + 0.7;
    const hitAt = (px, py, pad) => { for (let i = 0; i <= n; i++) { const u = i / n; if (inOval(px, py, lerp(b.prevX, b.x, u), lerp(b.prevY, b.y, u), b.prevA + wrap(b.a - b.prevA) * u, pad)) return true; } return false; };
    S.vs.sweep(Math.floor(Math.min(b.x, b.prevX) - R), Math.floor(Math.min(b.y, b.prevY) - R), Math.floor(Math.max(b.x, b.prevX) + R), Math.floor(Math.max(b.y, b.prevY) + R), hitAt, smashCb(S));
  }
  function smashArea(S, x, y, r) { if (!smashOn(S)) return 0; return S.vs.circle(x, y, r, smashCb(S), S.body.x, S.body.y); }

  /* ================= Shell Roll (Dodge) ================= */
  function tryDodge(S, mx, my) { if (S.phase === 'calamity') { calToggle(S); return; } tryRoll(S, mx, my); }
  function tryRoll(S, mx, my, queued) {
    const b = S.body; if (S.phase !== 'walk') return;
    if (S.roll || S.jump || S.busy || b.locked || S.recover > 0 || S.cdRoll > 0) { if (!queued && !S.roll) S.rollQ = S.g.t; return; }
    const mag = Math.hypot(mx, my), dir = mag > 0.2 ? Math.atan2(my, mx) : (Math.hypot(b.vx, b.vy) > 0.5 ? Math.atan2(b.vy, b.vx) : b.a);
    S.roll = { ph: 0, t: 0, dir, hit: new Set(), path: [], spin: 0 }; S.ctx.roll = S.roll; S.rollQ = null; S.cdRoll = TUNE.rollCd; S.stats.roll++; S.g.movedOnce = true; S.g.dodges = (S.g.dodges || 0) + 1;
    S.me.inv = Math.max(S.me.inv || 0, TUNE.rollInv);
    const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(110, 0.2, 'square', 0.05, 70); if (sfx.hiss) sfx.hiss(0.3, 0.06, 1400);
  }
  function rollTravel(S, mx, my, dt) {
    const R = S.roll, b = S.body, P = TUNE.rollPh;
    if (R.ph === 0) { b.speed *= 0.8; b.vx *= 0.8; b.vy *= 0.8; return; }
    const mag = Math.hypot(mx, my); if (mag > 0.2) R.dir = wrap(R.dir + clamp(wrap(Math.atan2(my, mx) - R.dir), -TUNE.rollTurn * dt, TUNE.rollTurn * dt));
    const v = TUNE.rollV * (1 - 0.55 * sstep(0.55, 1, R.t / P[1])); b.vx = Math.cos(R.dir) * v; b.vy = Math.sin(R.dir) * v; b.speed = v; b.a = wrap(b.a + clamp(wrap(R.dir - b.a), -6 * dt, 6 * dt));
    if (moveBody(S, b.vx * dt, b.vy * dt)) { b.vx *= 0.5; b.vy *= 0.5; R.dir = wrap(R.dir + Math.PI * 0.6); stoneFx(S, b.x + Math.cos(R.dir) * 1.4, b.y + Math.sin(R.dir) * 1.4, 0.7, true); }
    // the damage: one circle following the movement, each monster once per roll, knocked aside
    for (const m of S.H.living()) { if (R.hit.has(m)) continue; if (Math.hypot(m.x - b.x, m.y - b.y) < TUNE.rollR + (m.r || 0.4) * 0.85) { R.hit.add(m); const dealt = hitCharge(S, m, S.DK * TUNE.roll, { kb: TUNE.rollKb }); S.stats.rollHit++; stoneFx(S, m.x, m.y, 0.9, dealt > 0); let G = S.gate.get(m); if (!G) { G = { last: -9, inside: false }; S.gate.set(m, G); } G.last = S.g.t; G.inside = true; } }   /* (v334: the gate made here too, so a monster first met by the roll is not trampled again the moment the roll ends) */
    if (R.path.length < 64 && (!R.path.length || Math.hypot(b.x - R.path[R.path.length - 1][0], b.y - R.path[R.path.length - 1][1]) > 0.4)) R.path.push([b.x, b.y, S.g.t]);
  }
  function stepRoll(S, dt) {
    const R = S.roll, P = TUNE.rollPh; R.t += dt; const wv = R.ph === 0 ? 22 * Math.pow(cl(R.t / P[0]), 2) : R.ph === 1 ? 22 * (1 + 0.06 * Math.sin(R.t * 40)) : 22 * Math.pow(1 - cl(R.t / P[2]), 2.2); R.w = wv; R.spin = (R.spin + dt * wv) % TAU;   /* (spin-up from the tuck, a heavy judder at full spin, a long slow-down) */
    if (R.ph === 0 && R.t >= P[0]) { R.ph = 1; R.t = 0; }
    else if (R.ph === 1) { if (Math.random() < dt * (lowFx() ? 14 : 36)) dustAt(S, S.body.x, S.body.y, 1.6); if (R.t >= P[1]) { R.ph = 2; R.t = 0; } }
    else if (R.ph === 2 && R.t >= P[2]) endRoll(S);
  }
  function endRoll(S) { const R = S.roll; if (!R) return; S.roll = null; S.rollEndT = S.g.t;   /* (a Jump pressed during the roll is kept until it ends, plus jumpBuf) */ S.ctx.roll = null; for (const m of R.hit) { const G = S.gate.get(m); if (G) G.last = S.g.t; } S.body.spin = 0; }
  const drillAway = S => S.drill.state !== 'docked';
  function refuse(S, text) { const sfx = S.X.sfx || {}; if (sfx.wrong) sfx.wrong(); S.stats.refused++; S.X.text(S.me.x, S.me.y - 2.6, text, AMBER, 12, { life: 0.8, max: 0.8, vy: -0.6 }); }

  /* ================= Jump (its own control; Beast Machine's rules) ================= */
  function tryJumpCmd(S, mx, my) { if (S.phase === 'calamity') { calToggle(S); return; } tryJump(S, mx, my); }
  function planJump(S, dir, d0) {
    const b = S.body, C = [], OFF = [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6];
    for (const off of OFF) { const a = wrap(dir + off), ca = Math.cos(a), sa = Math.sin(a); let lim = d0 + TUNE.jumpExt;
      for (let st = 0.4; st <= lim + 0.21; st += 0.2) if (poseBlocked(S, b.x + ca * st, b.y + sa * st, a, 1)) { lim = st - 0.45; break; }
      for (let st = 0; st <= lim + 1e-6; st += 0.25) C.push([(st >= d0 - 1e-6 ? st - d0 : 5 + (d0 - st) * 1.2) + Math.abs(off) * 3, st, a]); }
    C.sort((p, q) => p[0] - q[0]);
    const reach = S.X.flowAt && S.vs ? (x, y) => S.vs.flowAt(x, y) < 9999 : null, okR = reach && reach(b.x, b.y);
    for (const [, st, a] of C) { const x = b.x + Math.cos(a) * st, y = b.y + Math.sin(a) * st; if (poseBlocked(S, x, y, a, 0) || (okR && !reach(x, y))) continue; return { x, y, a, d: st }; }
    return { x: b.x, y: b.y, a: b.a, d: 0, none: true };
  }
  function tryJump(S, mx, my, queued) {
    const b = S.body, g = S.g; if (S.phase !== 'walk') return;
    if (S.jump) { if (!queued) S.jumpLand = true; return; }
    if (b.locked || S.roll || (S.rock && S.rock.t < TUNE.rock.brace) || S.recover > 0.05) { if (!queued) S.jumpQ = g.t; return; }
    S.jumpQ = null; S.jumpLand = false;
    const mag = Math.hypot(mx, my), dir = mag > 0.2 ? Math.atan2(my, mx) : b.a, P = TUNE.jumpPh, v0 = Math.max(0, b.vx * Math.cos(dir) + b.vy * Math.sin(dir)), plan = planJump(S, dir, Math.min(TUNE.jumpMax, TUNE.jumpD + v0 * 0.35));
    S.jump = { t: 0, c: P[0], x0: b.x, y0: b.y, a0: b.a, x1: plan.x, y1: plan.y, a1: plan.d > 0.05 ? plan.a : b.a, plan, noHit: false };
    S.me.airborne = true; if (g.t - S.invT >= TUNE.jumpInvLock) { S.me.inv = Math.max(S.me.inv || 0, TUNE.jumpInv); S.invT = g.t; }
    S.stats.jump++; g.movedOnce = true; g.dodges = (g.dodges || 0) + 1;
    const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(60, 0.2, 'triangle', 0.09, 45); if (sfx.hiss) sfx.hiss(0.14, 0.06, 800);
  }
  function stepJump(S, dt) {
    const J = S.jump, b = S.body, P = TUNE.jumpPh; J.t += dt;
    if (J.t < J.c) { b.speed *= 0.85; b.vx *= 0.85; b.vy *= 0.85; return; }
    if (!J.air) { J.air = true; dustAt(S, b.x, b.y, 2); const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); }
    const u = cl((J.t - J.c) / P[1]);
    b.x = lerp(J.x0, J.x1, u); b.y = lerp(J.y0, J.y1, u); b.vx = (J.x1 - J.x0) / P[1]; b.vy = (J.y1 - J.y0) / P[1]; b.speed = Math.hypot(b.vx, b.vy) * 0.3;
    b.a = wrap(J.a0 + wrap(J.a1 - J.a0) * sstep(0, 0.35, u)); b.z = 4 * TUNE.jumpH * u * (1 - u);
    if (u >= 1) landJump(S);
  }
  function landJump(S, how) {
    const J = S.jump; if (!J) return; S.jump = null;
    const b = S.body, me = S.me, X = S.X; let x = J.x1, y = J.y1, a = J.a1;
    if (poseBlocked(S, x, y, a, 0)) { if (!poseBlocked(S, J.x0, J.y0, J.a0, 0)) { x = J.x0; y = J.y0; a = J.a0; } else { const p = X.walkPoint(J.x1, J.y1, { r: 0.9, x: J.x0, y: J.y0 }); x = p.x; y = p.y; } }
    b.x = x; b.y = y; b.a = a; b.z = 0; b.speed = 0; b.vx = b.vy = 0; me.airborne = false; me.x = x; me.y = y;
    if (how === 'abort') { S.jumpLand = false; return; }
    S.recover = TUNE.jumpPh[2]; S.absorb = 1; S.absV = 0; S.landT = S.g.t;
    if (S.jumpLand) { S.jumpLand = false; S.jumpQ = S.g.t; }
    S.ctx.jumpLand = { x, y, t: S.g.t, r: TUNE.jumpR, noHit: J.noHit };
    if (J.noHit) { dustAt(S, x, y, 2); return; }
    smashArea(S, x, y, TUNE.jumpR); let n = 0;
    for (const m of S.H.living()) { if (Math.hypot(m.x - x, m.y - y) > TUNE.jumpR + (m.r || 0.4) * 0.85) continue; const dealt = hitCharge(S, m, S.DK * TUNE.jump, { kb: TUNE.jumpKb }); S.stats.jumpHit++; n++; stoneFx(S, m.x, m.y, 1, dealt > 0); const G = S.gate.get(m); if (G) { G.inside = true; G.last = S.g.t; } else S.gate.set(m, { last: S.g.t, inside: true }); }
    quakeFx(S, x, y, TUNE.jumpR, 1); const sfx = X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.thud) sfx.thud(); if (!calm()) X.shake(6, 0.2); void n;
  }
  function abortJump(S) { if (S.jump) landJump(S, 'abort'); if (S.me) S.me.airborne = false; }

  /* ================= the Strongs: Rock You, Drill Cannon ================= */
  function tryMove(S, slot, queued) {
    if (S.phase !== 'walk') { if (S.phase === 'calamity' && !queued) refuse(S, 'The drill is the weapon'); return; }
    const b = S.body, rock = slot !== 'strong2', cd = rock ? S.cdRock : S.cdDrill;
    if (!rock && drillAway(S)) { if (!queued) refuse(S, 'Drill reloading'); return; }
    if (S.busy || S.roll || S.jump || b.locked || S.recover > 0) { if (!queued) S.mvQ = { slot, t: S.g.t }; return; }
    if (cd > 0) { if (!queued && cd <= 0.5) S.mvQ = { slot, t: S.g.t }; return; }
    S.mvQ = null; if (rock) startRock(S); else startDrill(S);
  }
  function startRock(S) {
    const tu = TUNE.rock, tg = target(S, tu.range), n = tu.n[S.tier], cx = tg.x, cy = tg.y, cr = [], rnd = (a, b2) => a + Math.random() * (b2 - a);
    const ms = S.H.living().filter(m => Math.hypot(m.x - cx, m.y - cy) < tu.spread + 0.6).slice(0, n);
    for (let i = 0; i < n; i++) { let x, y; if (i < ms.length) { x = ms[i].x + rnd(-0.25, 0.25); y = ms[i].y + rnd(-0.2, 0.2); } else { const a = i * 2.39996 + rnd(-0.3, 0.3), r = tu.spread * Math.sqrt((i + 0.5) / n); x = cx + Math.cos(a) * r; y = cy + Math.sin(a) * r * 0.9; }
      cr.push({ x, y, r: tu.crystalR * rnd(0.85, 1.15), t: 0, rise: tu.brace + i * tu.rise, h: rnd(1.6, 2.6), lean: rnd(-0.35, 0.35), up: false }); }
    S.rock = { t: 0, cx, cy, crystals: cr, tErupt: tu.brace, tBurst: tu.brace + (n - 1) * tu.rise + tu.pause, hit1: new Set(), burst: false, done: false };
    S.ctx.rockPlan = S.rock; S.busy = 'rock'; S.busyT = 0; S.stats.rock++;
    const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(55, 0.5, 'sawtooth', 0.06, 40); if (sfx.hiss) sfx.hiss(0.4, 0.05, 600);
  }
  function stepRock(S, dt) {
    const R = S.rock, tu = TUNE.rock; R.t += dt;
    for (const c of R.crystals) if (!c.up && R.t >= c.rise) { c.up = true; c.t = R.t;   // phase 1: the eruption, each monster once across every crystal (its nearest crystal's circle)
      for (const m of S.H.living()) { if (R.hit1.has(m)) continue; let near = null, nd = 1e9; for (const q of R.crystals) { const d = Math.hypot(m.x - q.x, m.y - q.y); if (d < nd) { nd = d; near = q; } } if (near !== c || nd > c.r + (m.r || 0.4) * 0.85) continue;
        R.hit1.add(m); hitCharge(S, m, S.DK * tu.erupt, { kb: 1.5 }); S.stats.rockErupt++; }
      smashArea(S, c.x, c.y, c.r * 0.8); stoneFx(S, c.x, c.y, 0.9, true); const sfx = S.X.sfx || {}; if (sfx.thud) sfx.thud(); }
    if (!R.burst && R.t >= R.tBurst) { R.burst = true; R.burstT = R.t;   // phase 2: the explosion, once per monster in the cluster's reach
      let n = 0; for (const m of S.H.living()) { if (Math.hypot(m.x - R.cx, m.y - R.cy) > tu.burstR + (m.r || 0.4) * 0.85) continue; hitCharge(S, m, S.DK * tu.burst, { kb: tu.kb }); S.stats.rockBurst++; n++; }
      smashArea(S, R.cx, R.cy, tu.burstR); quakeFx(S, R.cx, R.cy, tu.burstR, 1.2); for (const c of R.crystals) stoneFx(S, c.x, c.y, 1.2, true);
      const sfx = S.X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(70, 0.5, 'sawtooth', 0.07, 40); if (!calm()) S.X.shake(7, 0.22); void n;
      S.cdRock = tu.cd; if (S.busy === 'rock') S.busy = null; }
    if (R.burst && R.t >= R.burstT + 0.6) { R.done = true; S.rock = null; S.ctx.rockPlan = null; }
  }
  /* Drill Cannon (v336): the bit spins up on the carriage, is fired at the target (an arc, landing nose-down; walls stop it),
     stays there drilling into the ground (a grinding tick every 0.3 s round it), then explodes; a new bit materialises on the carriage */
  function startDrill(S) {
    const tu = TUNE.drill, D = S.drill, b = S.body, tg = target(S, tu.range), base = anchor(S, 'drillTip');
    let ex = tg.x, ey = tg.y; const dx = ex - base.x, dy = ey - base.y, L = Math.hypot(dx, dy) || 1, Lm = Math.min(L, tu.range); ex = base.x + dx / L * Lm; ey = base.y + dy / L * Lm;
    for (let s = 0.4; s <= Lm; s += 0.25) { const x = base.x + dx / L * s, y = base.y + dy / L * s; if (S.X.blocked(x, y, 0.2, 1)) { ex = base.x + dx / L * Math.max(0.5, s - 0.5); ey = base.y + dy / L * Math.max(0.5, s - 0.5); break; } }
    Object.assign(D, { state: 'spin', t: 0, x: base.x, y: base.y, z: base.z, yaw: b.a, pitch: 0, x0: base.x, y0: base.y, z0: base.z, x1: ex, y1: ey, impact: null, trail: [], nTick: 0 }); D.gate.clear(); D.hits.clear();
    S.busy = 'drill'; S.busyT = 0; S.stats.drill++;
    const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(140, 0.5, 'sawtooth', 0.04, 420);
  }
  function drillBoom(S) { const D = S.drill, tu = TUNE.drill;
    D.impact = { x: D.x, y: D.y, t: S.g.t }; hitArea(S, D.x, D.y, tu.impactR, S.DK * tu.impact, { kb: tu.kb }); S.stats.drillImpact++; quakeFx(S, D.x, D.y, tu.impactR, 1.2); stoneFx(S, D.x, D.y, 1.3, true);
    const sfx = S.X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(60, 0.45, 'sawtooth', 0.07, 35); if (!calm()) S.X.shake(7, 0.22);
    D.state = 'mat'; D.t = 0; D.trail.length = 0; if (S.busy === 'drill') S.busy = null; }
  function stepDrill(S, dt) {
    const D = S.drill, tu = TUNE.drill; if (D.state === 'docked') return; D.t += dt; D.spin = (D.spin + dt * (D.state === 'spin' ? 30 * D.t / tu.spin : 42)) % TAU;
    if (D.state === 'spin') { const tip = anchor(S, 'drillTip'); D.x = tip.x; D.y = tip.y; D.z = tip.z; D.yaw = Math.atan2(D.y1 - D.y, D.x1 - D.x); if (D.t >= tu.spin) { D.state = 'out'; D.t = 0; D.x0 = tip.x; D.y0 = tip.y; D.z0 = tip.z; S.busy = null; const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); } return; }
    if (D.state === 'out') { const u = cl(D.t / tu.out), e = u * (2 - u), nx = lerp(D.x0, D.x1, e), ny = lerp(D.y0, D.y1, e), nz = lerp(D.z0, 0.2, u * u) + tu.arc * 4 * u * (1 - u);
      D.yaw = Math.atan2(D.y1 - D.y0, D.x1 - D.x0); D.pitch = Math.atan2(nz - D.z, Math.hypot(nx - D.x, ny - D.y) || 1e-3); D.x = nx; D.y = ny; D.z = nz; pushTrail(D, S.g.t);
      if (u >= 1) { D.state = 'drill'; D.t = 0; D.pitch = -0.75; D.z = 0.2; D.nTick = 0; quakeFx(S, D.x, D.y, 1.4, 0.6); stoneFx(S, D.x, D.y, 0.9, true); const sfx = S.X.sfx || {}; if (sfx.thud) sfx.thud(); if (!calm()) S.X.shake(3, 0.12); }
      return; }
    if (D.state === 'drill') {   // lodged nose-down, grinding: each monster round it once a tick, at most ticks times
      D.z = 0.2 - 0.25 * cl(D.t / tu.drill); D.pitch = -0.75 - 0.15 * cl(D.t / tu.drill);
      while (D.nTick < tu.ticks && D.t >= tu.tick * (D.nTick + 0.5)) { D.nTick++;
        for (const m of S.H.living()) { if (Math.hypot(m.x - D.x, m.y - D.y) > tu.drillR + (m.r || 0.4) * 0.85) continue; const k = D.hits.get(m) || 0; if (k >= tu.ticks) continue; D.hits.set(m, k + 1); hitCharge(S, m, S.DK * tu.dmg, { kb: 0.6, noSmash: true }); S.stats.drillTicks++; stoneFx(S, m.x, m.y, 0.5, true); }
        smashArea(S, D.x, D.y, tu.drillR * 0.7); }
      if (Math.random() < dt * (lowFx() ? 12 : 36)) dustAt(S, D.x + (Math.random() - 0.5), D.y + (Math.random() - 0.5) * 0.7, 0.8);
      if (D.t >= tu.drill) drillBoom(S); return; }
    if (D.state === 'mat') { const sock = anchor(S, 'drillTip'); D.x = sock.x; D.y = sock.y; D.z = sock.z;   // the new bit materialising on the carriage
      if (D.t >= tu.mat) { D.state = 'docked'; D.t = 0; S.cdDrill = tu.cd; S.stats.docks++; const sfx = S.X.sfx || {}; if (sfx.note) { sfx.note(523, 0.1, 'triangle', 0.05, 660); sfx.note(784, 0.16, 'triangle', 0.04, 990, 0.08); } } }
  }
  function pushTrail(D, t) { const T = D.trail; if (!T.length || Math.hypot(D.x - T[0][0], D.y - T[0][1]) > 0.25) { T.unshift([D.x, D.y, D.z, t]); if (T.length > 28) T.pop(); } }
  /* (Calamity, the timeout, a swap: the bit out there blows at once and the new one materialises; on the carriage it just stops) */
  function recallDrill(S) { const D = S.drill; if (D.state === 'docked' || D.state === 'mat') return; if (D.state === 'spin') { D.state = 'docked'; D.t = 0; if (S.busy === 'drill') S.busy = null; return; } S.stats.recalls++; if (D.state === 'out') { D.x = D.x1; D.y = D.y1; } drillBoom(S); }

  /* ================= Calamity ================= */
  function tryCalamity(S) {
    if (S.phase !== 'walk') return;
    if (S.used || S.charge < 1) { const sfx = S.X.sfx || {}; if (sfx.wrong) sfx.wrong(); S.X.text(S.me.x, S.me.y - 2.6, S.used ? 'Calamity used' : `Calamity ${Math.floor(S.charge * 100)}%`, AMBER, 12, { life: 0.9, max: 0.9, vy: -0.6 }); return; }
    if (S.jump || S.roll) { S.calQ = S.g.t; return; }
    S.used = true; S.calQ = null; S.mvQ = null; S.jumpQ = null; S.rollQ = null; endRoll(S); S.stats.cal++;
    if (S.rock && !S.rock.burst) { S.rock.burst = true; S.rock.burstT = S.rock.t; } S.busy = null;
    const b = S.body; b.locked = true; b.speed = 0; b.vx = b.vy = 0;
    S.phase = 'calamity'; S.t = 0;
    S.cal = { phase: drillAway(S) ? 'recall' : 'xform', t: 0, xf: 0, z: 0, zT: 0, under: false, leap: null, emerge: [], drills: [], left: TUNE.cal.dur[S.tier], gate: new Map(), lastEmerge: -9, ridge: null, x0: b.x, y0: b.y };
    if (S.cal.phase === 'recall') recallDrill(S);
    S.ctx.calamity = S.cal;
    const sfx = S.X.sfx || {}; if (sfx.note) [98, 131, 175].forEach((f, i) => sfx.note(f, 0.5, 'sawtooth', 0.05, f * 1.5, i * 0.12));
  }
  function stepCal(S, dt) {
    const K = S.cal, b = S.body, tu = TUNE.cal; K.t += dt; S.stats.xfT += K.phase === 'xform' ? dt : 0;
    if (S.t > tu.cap) { startOut(S, 'cap'); return; }
    if (K.phase === 'recall') { if (S.drill.state === 'docked') { K.phase = 'xform'; K.t = 0; } return; }
    if (K.phase === 'xform') { K.xf = cl(K.t / tu.xform); if (K.t >= tu.xform) { K.phase = 'drill'; K.t = 0; b.locked = false; const sfx = S.X.sfx || {}; if (sfx.note) sfx.note(80, 0.6, 'sawtooth', 0.06, 160); } return; }
    if (K.phase === 'drill') {
      K.left -= dt;
      // height: under / surface / a breach leap; the pet's seat stays at the surface while under (the cockpit rides the ridge)
      if (K.leap) { K.leap.t += dt; const u = cl(K.leap.t / tu.leapT); b.z = 4 * tu.leapZ * u * (1 - u); if (u >= 1) { K.leap = null; b.z = 0; emerge(S, 0.7); } }
      else { const zT = K.under ? tu.underZ : 0, rate = (K.under ? 1 / tu.dive : 1 / tu.rise) * Math.abs(tu.underZ); b.z += clamp(zT - b.z, -rate * dt, rate * dt); if (!K.under && K.wasUnder && b.z > -0.05) { K.wasUnder = false; emerge(S, 1); } }
      b.under = b.z < -0.3; if (b.under) { S.me.inv = Math.max(S.me.inv || 0, 0.12); K.ridge = { x: b.x, y: b.y, a: b.a, t: S.g.t }; if (Math.random() < dt * (lowFx() ? 8 : 22)) dustAt(S, b.x + Math.cos(b.a) * 1.2, b.y + Math.sin(b.a) * 1.2, 0.9); }
      if (!b.under && b.z < 0.3) contact(S, tu.dmg, tu.gate, true);
      if (K.left <= 0 && !K.leap) startClimax(S);
      return; }
    if (K.phase === 'climax') { stepClimax(S, dt); return; }
    if (K.phase === 'revert') { K.xf = 1 - cl(K.t / tu.revert); if (K.t >= tu.revert) startOut(S, 'calamity'); }
  }
  function driveCal(S, mx, my, dt) {
    const b = S.body, tu = TUNE.cal, mag = Math.min(1, Math.hypot(mx, my));
    if (mag > 0.12) { const want = Math.atan2(my, mx), da = wrap(want - b.a); b.a = wrap(b.a + clamp(da, -tu.steer * dt, tu.steer * dt)); const tgt = tu.top * mag * (Math.abs(da) > 2 ? 0.4 : 1); b.speed = b.speed < tgt ? Math.min(tgt, b.speed + tu.accel * dt) : Math.max(tgt, b.speed - tu.accel * 0.6 * dt); }
    else b.speed = Math.max(0, b.speed - tu.accel * 0.5 * dt);
    b.vx += (Math.cos(b.a) * b.speed - b.vx) * Math.min(1, 8 * dt); b.vy += (Math.sin(b.a) * b.speed - b.vy) * Math.min(1, 8 * dt);
    if (moveBody(S, b.vx * dt, b.vy * dt)) { b.speed *= 0.4; b.vx *= 0.4; b.vy *= 0.4; }
  }
  function calDive(S) { const K = S.cal; if (!K || K.phase !== 'drill' || K.leap) return; if (!K.under) { K.under = true; K.wasUnder = true; S.stats.dives++; dustAt(S, S.body.x, S.body.y, 2.2); quakeFx(S, S.body.x, S.body.y, 1.6, 0.5); const sfx = S.X.sfx || {}; if (sfx.thud) sfx.thud(); } }
  /* (v336, the user: one command, not two: above ground it drills under, underground it rises) */
  function calToggle(S) { const K = S.cal; if (!K || K.phase !== 'drill' || K.leap) return; if (K.under) calRise(S); else calDive(S); }
  function calRise(S) { const K = S.cal; if (!K || K.phase !== 'drill' || K.leap) return; if (K.under) { K.under = false; S.stats.rises++; } else if (S.body.z > -0.05) { K.leap = { t: 0 }; S.stats.rises++; const sfx = S.X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); } }
  /* breaking the surface (or landing a breach): stone slabs up, an Earth shockwave (Calamity's: no charge) */
  function emerge(S, k) { const b = S.body, K = S.cal, tu = TUNE.cal; K.emerge.push({ x: b.x, y: b.y, t: S.g.t }); if (K.emerge.length > 8) K.emerge.shift(); S.stats.emerge++;
    if (S.g.t - K.lastEmerge >= tu.emergeGate) { K.lastEmerge = S.g.t; hitArea(S, b.x, b.y, tu.emergeR * (0.7 + 0.3 * k), S.DK * tu.emerge * k, { kb: tu.kb, noCharge: true }); }
    quakeFx(S, b.x, b.y, tu.emergeR, 1); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; slabAt(S, b.x + Math.cos(a) * 1.3, b.y + Math.sin(a) * 1.1, a); }
    const sfx = S.X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (!calm()) S.X.shake(6, 0.2); }
  /* the climax: to the surface at a valid spot, eight distinct marks, eight Earth drills, one coordinated burst */
  function startClimax(S) {
    const K = S.cal, b = S.body, tu = TUNE.cal.climax; K.under = false; K.wasUnder = false; b.z = Math.max(b.z, -0.2);
    if (poseBlocked(S, b.x, b.y, b.a, 0)) { const p = S.X.walkPoint(b.x, b.y, { r: 1.0, x: b.x, y: b.y }); b.x = p.x; b.y = p.y; }
    if (b.z < -0.05) emerge(S, 1);
    b.z = 0; b.under = false; b.locked = true; b.speed = 0; b.vx = b.vy = 0;
    K.phase = 'climax'; K.t = 0; K.spots = pickEight(S); K.drills = K.spots.map((p, i) => ({ x: p.x, y: p.y, t: 0, rise: 0, spin: 0, glow: 0, burst: 0, i, delay: i * 0.05, up: false }));
    K.hitE = new Set(); K.burstDone = false; S.stats.drills8 = K.drills.length;
  }
  function pickEight(S) {
    const b = S.body, tu = TUNE.cal.climax, out = [], ok = (x, y, sep) => canStand(S, x, y) && Math.hypot(x - b.x, y - b.y) <= tu.reach && out.every(q => Math.hypot(q.x - x, q.y - y) >= sep) && Math.hypot(x - b.x, y - b.y) >= 1.6;
    const ms = S.H.living().filter(m => Math.hypot(m.x - b.x, m.y - b.y) < tu.reach).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y));
    for (const sep of [tu.sep, 1.6, 1.1, 0.6]) {
      for (const m of ms) { if (out.length >= tu.n) break; if (ok(m.x, m.y, sep)) out.push({ x: m.x, y: m.y, m: true }); }
      for (let ring = 0; ring < 4 && out.length < tu.n; ring++) { const r = [3, 5, 6.8, 2.2][ring], k0 = ring * 0.4; for (let i = 0; i < 12 && out.length < tu.n; i++) { const a = b.a + k0 + i / 12 * TAU, x = b.x + Math.cos(a) * r, y = b.y + Math.sin(a) * r; if (ok(x, y, sep)) out.push({ x, y }); } }
      if (out.length >= tu.n) break; }
    while (out.length < tu.n) { const a = out.length / tu.n * TAU, p = nearestStand(S, b.x + Math.cos(a) * 2.5, b.y + Math.sin(a) * 2.5); out.push({ x: p.x, y: p.y, forced: true }); }   // (exactly eight, always)
    return out.slice(0, tu.n);
  }
  function stepClimax(S, dt) {
    const K = S.cal, tu = TUNE.cal.climax;
    for (const d of K.drills) { const u = K.t - d.delay; d.rise = cl(u / tu.rise); d.spin = (d.spin + dt * (6 + 30 * sstep(tu.rise, tu.rise + tu.spin, u))) % TAU; d.glow = sstep(tu.rise * 0.5, tu.rise + tu.spin, u);
      if (!d.up && u >= tu.rise * 0.5) { d.up = true; stoneFx(S, d.x, d.y, 1, true); slabAt(S, d.x, d.y, Math.random() * TAU); smashArea(S, d.x, d.y, 1.2);
        // the eruption: each monster at most once, from its nearest drill within reach (the overlap policy)
        for (const m of S.H.living()) { if (K.hitE.has(m)) continue; let near = null, nd = 1e9; for (const q of K.drills) { const dd = Math.hypot(m.x - q.x, m.y - q.y); if (dd < nd) { nd = dd; near = q; } } if (near !== d || nd > tu.eruptR + (m.r || 0.4) * 0.85) continue; K.hitE.add(m); hitCharge(S, m, S.DK * tu.erupt, { kb: 2, noCharge: true }); S.stats.eruptHits++; }
        const sfx = S.X.sfx || {}; if (sfx.thud) sfx.thud(); } }
    const tB = tu.rise + tu.spin + 0.05 * (tu.n - 1);
    if (!K.burstDone && K.t >= tB) { K.burstDone = true; K.burstT = K.t;   // the burst: once per monster within reach of any drill (the union)
      for (const m of S.H.living()) { if (!K.drills.some(d => Math.hypot(m.x - d.x, m.y - d.y) <= tu.burstR + (m.r || 0.4) * 0.85)) continue; hitCharge(S, m, S.DK * tu.burst, { kb: 7, noCharge: true }); S.stats.burstHits++; }
      for (const d of K.drills) { d.burst = 1; quakeFx(S, d.x, d.y, tu.burstR, 1.3); smashArea(S, d.x, d.y, tu.burstR * 0.7); }
      const sfx = S.X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(50, 0.9, 'sawtooth', 0.09, 30); if (!calm()) S.X.shake(10, 0.35); }
    if (K.burstDone) for (const d of K.drills) d.burst = 1 + (K.t - K.burstT);
    if (K.burstDone && K.t >= K.burstT + tu.hold) { K.phase = 'revert'; K.t = 0; }
  }

  /* ================= the step ================= */
  function step(S, dt) {
    const b = S.body, me = S.me, g = S.g, X = S.X;
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'calamity' && S.phase !== 'out')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   // (held while riding: the cooldown starts at the exit)
    S.t += dt; S.cdRock = Math.max(0, S.cdRock - dt); S.cdDrill = Math.max(0, S.cdDrill - dt); S.cdRoll = Math.max(0, S.cdRoll - dt); S.recover = Math.max(0, S.recover - dt); if (S.busy) S.busyT += dt;
    if (S.jump) stepJump(S, dt);
    if (S.roll) stepRoll(S, dt);
    if (S.rock) stepRock(S, dt);
    stepDrill(S, dt);
    if (calm()) S.absorb *= Math.max(0, 1 - dt * 9); else { S.absV += (-90 * S.absorb - 12 * S.absV) * dt; S.absorb = clamp(S.absorb + S.absV * dt, -0.2, 1.2); }
    const sp = Math.hypot(b.vx, b.vy), kt = S.jump || S.roll || b.z > 0.05 || S.phase !== 'walk' ? 0 : cl(sp / TUNE.top * 1.3); S.gk += (kt - S.gk) * Math.min(1, dt * 6); S.gph = (S.gph + (S.jump || S.roll ? 0 : sp * dt / TUNE.stride)) % 1;
    if (S.phase === 'summon') { b.z = 0; const t0 = S.t - dt, at = v => t0 < v && S.t >= v, SU = SUMMON;   /* (v336, the user: it drills up out of the ground, then the pet gets on) */
      if (at(0.02)) { quakeFx(S, b.x, b.y, 2.0, 0.6); const sfx = X.sfx || {}; if (sfx.note) sfx.note(45, 1.0, 'sawtooth', 0.06, 70); }
      if (S.t < SU.burst && Math.random() < dt * (lowFx() ? 10 : 28)) dustAt(S, b.x + (Math.random() - 0.5) * 2.4, b.y + (Math.random() - 0.5) * 1.8, 0.9);
      if (at(SU.burst)) { quakeFx(S, b.x, b.y, 3.2, 1.3); for (let i = 0; i < (lowFx() ? 6 : 10); i++) { const a2 = i / (lowFx() ? 6 : 10) * TAU; slabAt(S, b.x + Math.cos(a2) * 1.5, b.y + Math.sin(a2) * 1.2, a2); } smashArea(S, b.x, b.y, 2.2); const sfx = X.sfx || {}; if (sfx.stomp) sfx.stomp(); if (!calm()) X.shake(7, 0.25); }
      if (at(SU.mount1)) { const sfx = X.sfx || {}; if (sfx.jump) sfx.jump(); }
      if (S.t >= TUNE.summon) { S.phase = 'walk'; S.t = 0; b.locked = false; b.contact = true; S.left = S.dur; syncMe(S); }
      else if (S.t >= SU.mount1) syncMe(S); else { me.x = S.petX0; me.y = S.petY0; me.vx = me.vy = 0; me.inv = Math.max(me.inv || 0, 0.15); } }
    else if (S.phase === 'walk') {
      S.left -= dt; S.stats.walkT += dt;
      if (S.jump && S.left <= 0) S.jump.noHit = true;
      if (S.left <= 0) { if (drillAway(S)) recallDrill(S); if (!S.jump && !S.roll && !drillAway(S) && (!S.busy || S.busyT > 3)) { startOut(S, 'timeout'); return; } }
      if (S.busy && S.busyT > 6) S.busy = null;
      if (b.contact && b.z < 0.1 && !S.jump && !S.roll && sp > TUNE.top * TUNE.contactMin) contact(S, TUNE.contact, TUNE.contactGate, false);
      if (S.mvQ) { const Q = S.mvQ; if (S.jump || S.roll) Q.t = Math.max(Q.t, g.t - 0.2);   /* (a Strong pressed in a hop or a roll goes when it ends) */ if (g.t - Q.t > TUNE.mvHold) S.mvQ = null; else if (!S.busy && !b.locked && !S.jump && !S.roll && !(S.recover > 0) && !drillAway(S) && (Q.slot !== 'strong2' ? S.cdRock : S.cdDrill) <= 0) { const q = Q.slot; S.mvQ = null; tryMove(S, q, true); } }
      if (S.calQ != null && !S.jump && !S.roll) { const q = S.calQ; S.calQ = null; if (g.t - q < 1.5) tryCalamity(S); }
      if (b.z < 0.05 && !S.jump && canStand(S, b.x, b.y)) S.safe = { x: b.x, y: b.y };
    } else if (S.phase === 'calamity') { stepCal(S, dt); syncMe(S); }
    else if (S.phase === 'out') stepOut(S, dt);
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    if (S.phase === 'walk' || (S.phase === 'calamity' && S.cal && S.cal.phase === 'drill')) smashSweep(S);
    animate(S, dt); stepParts(S, dt);
    S.fx.entY = b.y + 0.8;
    S.sfxT -= dt; if (S.sfxT <= 0 && S.phase === 'walk' && S.gk > 0.3) { const sfx = X.sfx || {}; S.sfxT = TUNE.stride / Math.max(1, sp) / 2; if (sfx.note) sfx.note(48 + Math.random() * 6, 0.22, 'triangle', 0.06 * S.gk, 36); }
    b.prevX = b.x; b.prevY = b.y; b.prevA = b.a; S.ag = groundA(b.a);
  }

  /* ================= the pose (channels for the lead's model; the placeholder reads a few) ================= */
  /* the lead's channels (20k2kz) plus a few of the core's own (bob, stomp, brace, neck, drillV: the placeholder reads them; the model ignores what it does not know) */
  function blankPose() { const M = MOD(); const o = M && M.blankPose ? (() => { try { return M.blankPose(); } catch (e) { return {}; } })() : {};
    return Object.assign({ xf: 0, walk: 0, walkK: 0, crouch: 0, roll: 0, bank: 0, pitch: 0, drillSpin: 0, drillOff: null, drillYaw: 0, drillPitch: 0, drillGlow: 0, drillMat: 1, glow: 0.5, crumble: 0, ground: null, alpha: 1 }, o, { bob: 0, stomp: 0, brace: 0, neck: 0.7, drillV: 0, bitOut: 0 }); }
  const PR = { xf: [0, 1, 0], walk: [-1e4, 1e4, 0], walkK: [0, 1, 0], crouch: [0, 1, 0], roll: [0, 1, 0], bank: [-1, 1, 0], pitch: [-1, 1, 0], drillSpin: [-1e4, 1e4, 0], drillYaw: [-1e4, 1e4, 0], drillPitch: [-1.6, 1.6, 0], drillGlow: [0, 1, 0], drillMat: [0, 1, 1], glow: [0, 1, 0.5], crumble: [0, 1, 0], alpha: [0, 1, 1],
    bob: [-1, 1, 0], stomp: [-0.3, 1.2, 0], brace: [0, 1, 0], neck: [0, 1, 0.7], drillV: [0, 1, 0], bitOut: [0, 1, 0] };
  function animate(S, dt) {
    const P = S.P, b = S.body, t = S.g.t, D = S.drill, K = S.cal, R = S.roll, J = S.jump, ease = (k, v, r) => { P[k] += (v - P[k]) * Math.min(1, dt * r); };
    P.walk = (S.gph * TAU) % TAU; P.walkK = S.gk;
    // the summon: it rises out of the ground (the body's alpha and a drawn rise); the exit: cracks, buckling, then the crumble
    if (S.phase === 'summon') { P.alpha = sstep(0.12, 0.35, S.t); S.rise = -2.3 * (1 - sstep(0.25, SUMMON.burst + 0.12, S.t)); } else S.rise = 0;
    /* the jump: a deliberate compression (pistons squeezing) before the launch, legs reaching in the air (nose up rising, down falling), the stomp squashing it on landing */
    const ju = J && J.air ? cl((J.t - J.c) / TUNE.jumpPh[1]) : 0, cr = J ? (J.t < J.c ? sstep(0, J.c, J.t) : 0) : 0;
    P.crouch = Math.max(cr, 0.85 * Math.max(0, S.absorb)); P.stomp = S.absorb;
    ease('brace', S.rock && S.rock.t < S.rock.tErupt + 0.3 ? 1 : 0, 10);
    ease('roll', R ? (R.ph === 2 ? 1 - sstep(0.25, 1, R.t / TUNE.rollPh[2]) : 1) : 0, R ? 26 : 10); S.rollA = R ? R.spin : wrap(S.rollA || 0) * Math.max(0, 1 - dt * 8);   /* (the model's roll is the tuck; the core spins the drawn heading by rollA) */
    /* walking weight: the body sways over each planted diagonal pair (bank), dips as each pair takes the load (bob), rocks nose to tail (pitch);
       it noses up as it heaves into motion and down as it brakes; it leans into a turn; a slow breath at rest */
    const k = S.gk, w = S.gph * TAU, acc = dt > 0 ? (b.speed - (S.spPrev == null ? b.speed : S.spPrev)) / dt : 0; S.spPrev = b.speed; S.accS = (S.accS || 0) + (acc - (S.accS || 0)) * Math.min(1, dt * 6);
    const turn = R ? 0 : clamp(-(S.mx * Math.sin(b.a) - S.my * Math.cos(b.a)) * 0.15 * cl(b.speed / TUNE.top), -0.25, 0.25);
    let bk = turn + 0.07 * k * Math.sin(w), pt = 0.035 * k * Math.sin(2 * w + 0.8) + clamp(0.018 * S.accS, -0.12, 0.12);
    if (J) pt += J.t < J.c ? -0.08 * cr : 0.14 * Math.cos(Math.PI * ju);   /* (crouching nose-down; rising nose-up, falling nose-down) */
    if (R && R.ph === 2) { const u = R.t / TUNE.rollPh[2]; bk += 0.14 * (1 - u) * Math.sin(u * 20); }   /* (the shell wobbles as it settles out of the spin) */
    ease('bank', bk, 7); ease('pitch', pt, 8);
    P.bob = k * (0.045 * Math.cos(2 * w) - 0.025) + 0.014 * Math.sin(t * 1.3) * (1 - k) - 0.16 * Math.max(0, S.absorb) - 0.1 * cr;
    ease('neck', R || (K && K.xf > 0.15) ? 0 : S.rock ? 0.9 : 0.7, 8);
    // the drill: idle turning, spun up for a cast, gone while away; the bit slides home as it docks
    const spinUp = D.state === 'spin' ? 0.3 + 0.7 * cl(D.t / TUNE.drill.spin) : K && (K.phase === 'drill' || K.phase === 'climax') ? 1 : K && K.phase === 'xform' ? K.xf : 0.08;
    ease('drillV', spinUp, 6); P.drillSpin = ((P.drillSpin || 0) + dt * (2 + 38 * P.drillV)) % TAU; ease('drillGlow', D.state === 'spin' || (K && K.phase !== 'revert' && K.phase !== 'crumble') ? 1 : 0.15, 5);
    P.bitOut = D.state === 'out' || D.state === 'drill' ? 1 : 0; P.drillMat = D.state === 'mat' ? cl(D.t / TUNE.drill.mat) : 1;
    /* the flying bit: the model's single drill, offset from its dock (model units, in the body's frame) */
    if (P.bitOut > 0.001 && S.inst) { const M = MOD(), dock = M.anchorAt ? M.anchorAt('dock', b.x, b.y, b.z, drawA(S), Object.assign({}, P, { drillOff: null }), { scale: b.scale || 1 }) : null;
      if (dock) { const A = drawA(S), ca = Math.cos(A), sa = Math.sin(A), wx = (D.x - dock.x) / (b.scale || 1), wy = (D.y - dock.y) / GY / (b.scale || 1), wz = (D.z - dock.z) / (b.scale || 1); P.drillOff = [wx * ca + wy * sa, -wx * sa + wy * ca, wz]; P.drillYaw = wrap(D.yaw - A); P.drillPitch = clamp(D.pitch, -1.5, 1.5); } }
    else { P.drillOff = null; P.drillYaw = 0; P.drillPitch = 0; }
    P.xf = K ? K.xf : 0;
    P.ground = b.z < -0.02 ? -b.z : null;   /* (burrowing: the floor's height above Genbu's z, model units) */
    ease('glow', K && K.phase === 'climax' ? 1 : (S.charge >= 1 && !S.used ? 0.8 + 0.2 * Math.sin(t * 5) : 0.35 + 0.3 * S.charge), 4);
    if (S.phase === 'out') { const o = S.out, u = o.t; P.crumble = sstep(TUNE.out.dismount, TUNE.out.dismount + TUNE.out.crumble, u); P.glow = (0.5 + 0.5 * Math.sin(t * 40)) * (1 - P.crumble); P.alpha = 1 - sstep(TUNE.out.dismount + TUNE.out.crumble * 0.6, TUNE.out.dismount + TUNE.out.crumble, u); }
    else { P.crumble = 0; if (S.phase !== 'summon') P.alpha = 1; }
    if (S.phase === 'summon') { const u = S.t, SU = SUMMON; P.xf = 1 - sstep(SU.burst + 0.25, SU.mount0, u); P.pitch = 0.55 * (1 - sstep(SU.burst - 0.05, SU.burst + 0.5, u)); P.drillV = 1 - 0.9 * sstep(SU.burst + 0.3, SU.mount0, u); P.drillGlow = 1 - 0.85 * sstep(SU.burst + 0.3, SU.mount0, u); P.ground = S.rise < -0.02 ? -S.rise : null; P.neck = 0.7 * sstep(SU.burst + 0.4, SU.mount0, u); }
    for (const key in PR) { const r = PR[key]; let v = P[key]; if (typeof v !== 'number' || !isFinite(v)) v = r[2]; P[key] = v < r[0] ? r[0] : v > r[1] ? r[1] : v; }
    P.walk %= TAU; P.drillSpin %= TAU; if (P.drillOff && !P.drillOff.every(isFinite)) P.drillOff = null; if (P.ground != null && !isFinite(P.ground)) P.ground = null;
  }

  /* ================= exits: the crumble (timeout, the end of Calamity), or at once (defeat, swap, the floor's end) ================= */
  function startOut(S, how) {
    if (S.phase === 'out' || S.released) return; abortJump(S); endRoll(S); if (drillAway(S)) { S.drill.state = 'docked'; S.drill.trail.length = 0; }
    S.outHow = how; S.phase = 'out'; S.t = 0; S.busy = null; S.rock = null; S.ctx.rockPlan = null;
    const b = S.body; b.locked = true; b.contact = false; b.speed = 0; b.vx = b.vy = 0; b.z = 0; b.under = false;
    if (S.cal) { S.cal.phase = 'crumble'; S.cal.xf = 0; }
    const s = anchor(S, 'seat'), p = canStand(S, s.x + 1.2, s.y + 0.8) ? { x: s.x + 1.2, y: s.y + 0.8 } : nearestStand(S, b.x + 1.6, b.y + 0.6); S.petStand = canStand(S, p.x, p.y) ? p : nearestStand(S, S.safe.x, S.safe.y);
    S.out = { t: 0, crumbled: false }; S.stats.crumble++;
    const sfx = S.X.sfx || {}; if (sfx.note) [196, 147, 110].forEach((f, i) => sfx.note(f, 0.3, 'square', 0.035, f * 0.85, i * 0.1));
  }
  function stepOut(S, dt) {
    const o = S.out, b = S.body, tu = TUNE.out; o.t += dt;
    if (!S.dismounted && o.t >= tu.dismount * 0.5) { S.dismounted = true; S.me.x = S.petStand.x; S.me.y = S.petStand.y; S.me.vx = S.me.vy = 0; const sfx = S.X.sfx || {}; if (sfx.jump) sfx.jump(); }   // (the pet is down before the collapse)
    if (S.dismounted) { S.me.x = S.petStand.x; S.me.y = S.petStand.y; S.me.vx = S.me.vy = 0; } else syncMe(S);
    if (o.t >= tu.dismount + 0.5 && !o.crumbled) { o.crumbled = true; for (let i = 0; i < (lowFx() ? 10 : 26); i++) { const a = Math.random() * TAU, r = Math.random() * 1.6; addPart(S, 2, b.x + Math.cos(a) * r, b.y + Math.sin(a) * r * 0.8, 0.4 + Math.random() * 1.2, Math.cos(a) * (1 + Math.random() * 2), Math.sin(a) * GY * (1 + Math.random() * 2), 1 + Math.random() * 2, 0.8 + Math.random() * 0.6, 0.1 + Math.random() * 0.12, { g: 10, bounce: 0.3, col: Math.random() < 0.6 ? SAND : ORANGE }); } dustAt(S, b.x, b.y, 3); const sfx = S.X.sfx || {}; if (sfx.thud) sfx.thud(); if (sfx.hiss) sfx.hiss(0.6, 0.06, 500); }
    if (o.t >= tu.dismount + tu.crumble) release(S);   // (presentation only: no damage event)
  }
  function finish(S, how) {
    if (S.released) return; S.outHow = how; abortJump(S); endRoll(S);
    if (how !== 'defeat') { const b = S.body, p = canStand(S, b.x, b.y) && !b.under ? { x: b.x, y: b.y } : nearestStand(S, S.safe.x, S.safe.y); S.me.x = p.x; S.me.y = p.y; }
    if (S.body.vis > 0.05 && S.phase !== 'out') { dustAt(S, S.body.x, S.body.y, 2.4); S.fade = 0.3; }
    release(S);
  }
  function release(S) {
    if (S.released) return;
    S.released = true; S.relT = 0;
    const me = S.me, g = S.g, X = S.X, b = S.body;
    if (S.phase === 'out' && S.petStand) { me.x = S.petStand.x; me.y = S.petStand.y; }
    else if (b.under || !canStand(S, me.x, me.y)) { const p = nearestStand(S, S.safe.x, S.safe.y); me.x = p.x; me.y = p.y; }
    abortJump(S); endRoll(S); me.airborne = false;
    S.drill.state = 'docked'; S.drill.trail.length = 0; b.under = false; b.z = 0;
    S.phase = 'gone'; S.busy = null; S.mvQ = null; S.jumpQ = null; S.rollQ = null; S.calQ = null; S.jumpLand = false; S.rock = null;
    const c0 = S.ctx; if (c0) { c0.rockPlan = null; c0.roll = null; if (c0.calamity) c0.calamity.done = true; }
    b.locked = true; b.contact = false;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0;
    g.cdU = S.CD;   // the cooldown starts now, once
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.gate.clear(); S.drill.gate.clear(); S.drill.hits.clear();
    S.fx.life = 1.6; S.fx.onEnd = null;
  }

  /* ================= particles (pooled; light) : 1 dust puff, 2 stone chip, 3 spark, 4 floor ring, 5 slab ================= */
  const CAP = 220;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) { if (S.parts.length >= CAP) return; const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.t = 0; p.life = life; p.s = s; p.g = (o && o.g) || 0; p.bounce = (o && o.bounce) || 0; p.col = (o && o.col) || null; p.rot = Math.random() * TAU; p.vr = (Math.random() - 0.5) * 10; p.a = (o && o.a) || 0; S.parts.push(p); }
  function stepParts(S, dt) { const P = S.parts; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); S.free.push(p); continue; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.kind === 1) { p.vx *= 1 - dt * 2; p.vy *= 1 - dt * 2; } if (p.z < 0) { p.z = 0; p.vz = -p.vz * p.bounce; p.vx *= 0.6; p.vy *= 0.6; } } }
  function dustAt(S, x, y, r) { const n = lowFx() ? 2 : 5; for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 0.6 + Math.random() * r; addPart(S, 1, x + Math.cos(a) * r * 0.4, y + Math.sin(a) * r * 0.3, 0.1, Math.cos(a) * v, Math.sin(a) * v * GY, 0.4 + Math.random() * 0.4, 0.7 + Math.random() * 0.5, 0.4 + 0.25 * r); } }
  function stoneFx(S, x, y, k, hit) { const n = Math.round((lowFx() ? 3 : 7) * k); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 3; addPart(S, 2, x, y, 0.3, Math.cos(a) * v, Math.sin(a) * v * GY, 2 + Math.random() * 3, 0.6 + Math.random() * 0.4, 0.07 + Math.random() * 0.07, { g: 14, bounce: 0.3, col: Math.random() < 0.6 ? SAND : ORANGE }); }
    if (hit) for (let i = 0; i < (lowFx() ? 2 : 4); i++) { const a = Math.random() * TAU, v = 3 + Math.random() * 3; addPart(S, 3, x, y, 0.5, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 2, 0.3, 0.2, { g: 6 }); }
    dustAt(S, x, y, 0.8 * k); }
  function quakeFx(S, x, y, r, k) { addPart(S, 4, x, y, 0, 0, 0, 0, 0.55, r, {}); dustAt(S, x, y, r * 0.6); stoneFx(S, x, y, k, false); S.X.light && S.X.light(x, y, r * 0.8, 0.14); }
  function slabAt(S, x, y, a) { addPart(S, 5, x, y, 0, Math.cos(a) * 1.5, Math.sin(a) * GY * 1.5, 4 + Math.random() * 2, 0.9, 0.35 + Math.random() * 0.2, { g: 14, bounce: 0.2, col: SANDD }); }

  /* ================= anchors: the GPU model's when it has drawn, else the placeholder rig ================= */
  function local(S, name) { const xf = S.cal ? S.cal.xf : 0, R = RIG[name]; if (R) { const a = R[0], c = R[1], e = sstep(0.55, 0.85, xf); return [lerp(a[0], c[0], e), lerp(a[1], c[1], e), lerp(a[2], c[2], e)]; }
    const F = FEET.find(f => f[0] === name || 'track' + f[0].slice(4) === name); if (F) return [F[1] * 0.95, F[2] * 0.85 * (1 - 0.25 * xf), 0.15];
    return [0, 0, 0.8]; }
  const drawA = S => wrap(S.body.a + (S.rollA || 0));
  function l2w(S, p) { const b = S.body, ag = S.ag, ca = Math.cos(ag), sa = Math.sin(ag), sc = b.scale || 1; return { x: b.x + (p[0] * ca - p[1] * sa) * sc, y: b.y + (p[0] * sa + p[1] * ca) * GY * sc, z: p[2] * sc + b.z + (S.P.bob || 0) + (S.rise || 0) }; }
  function anchor(S, name) {
    const M = MOD(); if (M && M.anchorAt && S.inst) { try { const b = S.body, P = name === 'drillTip' || name === 'dock' ? Object.assign({}, S.P, { drillOff: null }) : S.P, p = M.anchorAt(ANAME[name] || name, b.x, b.y, b.z + (S.rise || 0) + (S.P.bob || 0), drawA(S), P, { scale: b.scale || 1 }); if (p && isFinite(p.x) && isFinite(p.y) && isFinite(p.z)) return p; } catch (e) { /* (fallback) */ } }
    let p = local(S, name); if (S.roll && name !== 'seat') { const r = S.rollA || 0, c = Math.cos(r), s = Math.sin(r); p = [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2] * (1 - 0.35 * S.P.roll)]; }
    return l2w(S, p);
  }

  /* ================= drawing ================= */
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), b = S.body, t = S.g.t;
    if (S.released && !(S.fade && S.relT < S.fade)) { drawParts(S, c, T, true); return; }
    // the shadow (a soft oval), the summon's ring of broken ground
    if (b.vis > 0.05 && !b.under && !S.inst) { const k = 1 / (1 + Math.max(0, b.z) * 0.4); c.save(); c.globalAlpha = 0.32 * k * (S.P.alpha || 1); c.fillStyle = '#1A120A'; c.beginPath(); c.ellipse(H.sx(b.x), H.sy(b.y), T * 1.9 * k, T * 1.25 * GY * k, 0, 0, TAU); c.fill(); c.restore(); }
    const own = !moves().drawsFx;   /* (E's GENBU_MOVES.drawsFx: E draws the effects from the plans; the core keeps only the body, the pet and the HUD) */
    if (own && S.phase === 'summon') { const u = cl(S.t / TUNE.summon); c.save(); c.strokeStyle = rgba(AMBER, 0.7 * (1 - u)); c.lineWidth = T * 0.12; c.beginPath(); c.ellipse(H.sx(b.x), H.sy(b.y), T * (1 + 1.6 * u), T * (1 + 1.6 * u) * GY, 0, 0, TAU); c.stroke(); c.restore(); }
    // Rock You: the targeted area glowing amber, cracks
    const R = S.rock; if (R && own) { const a = R.burst ? 1 - cl((R.t - R.burstT) / 0.6) : sstep(0, 0.3, R.t); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(AMBER, 0.55 * a); c.lineWidth = T * 0.08; c.beginPath(); c.ellipse(H.sx(R.cx), H.sy(R.cy), T * TUNE.rock.burstR, T * TUNE.rock.burstR * GY, 0, 0, TAU); c.stroke(); c.restore(); }
    // Calamity: the ridge and cracks over the buried vehicle, the eight marks
    const K = S.cal; if (K && !S.released && own) {
      if (b.under) { c.save(); c.globalCompositeOperation = 'lighter'; const X0 = H.sx(b.x), Y0 = H.sy(b.y); c.strokeStyle = rgba(AMBER, 0.6 + 0.2 * Math.sin(t * 12)); c.lineWidth = T * 0.07; for (let i = 0; i < 5; i++) { const a = b.a + (i - 2) * 0.5; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X0 + Math.cos(a) * T * 1.4, Y0 + Math.sin(a) * T * 1.4 * GY); c.stroke(); } c.restore();
        c.save(); c.fillStyle = rgba(DEEP, 0.55); c.beginPath(); c.ellipse(H.sx(b.x), H.sy(b.y), T * 1.5, T * 0.9 * GY, 0, 0, TAU); c.fill(); c.restore(); }
      if (K.drills && K.drills.length && K.phase === 'climax' && !K.burstDone) for (const d of K.drills) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(AMBER, 0.75); c.lineWidth = T * 0.07; c.beginPath(); c.ellipse(H.sx(d.x), H.sy(d.y), T * 1.0, T * 1.0 * GY, 0, 0, TAU); c.stroke(); c.restore(); } }
    if (own) drawParts(S, c, T, true);
    callM(S, c, 'drawUnder');
  }
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function petAt(S, c, T) { if (S.dismounted) return; const H = S.H;
    if (S.phase === 'summon' && S.t < SUMMON.mount1) { const u = cl((S.t - SUMMON.mount0) / (SUMMON.mount1 - SUMMON.mount0)), q = anchor(S, 'seat'), e = u * u * (3 - 2 * u), x = lerp(S.petX0, q.x, e), y = lerp(S.petY0, q.y, e), z = lerp(0, q.z, e) + 1.3 * 4 * u * (1 - u); S.H.X.drawPetAt(c, H.sx(x), H.sy(y) - z * ZK * T, { maxH: 1.1 }); return; }
    const p = anchor(S, 'seat'); S.H.X.drawPetAt(c, H.sx(p.x), H.sy(p.y) - p.z * ZK * T, { maxH: 1.1 }); }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), b = S.body, P = S.P;
    if (S.released) { if (S.fade && S.relT < S.fade) { c.save(); c.globalAlpha = 1 - S.relT / S.fade; drawBody(S, c, T); c.restore(); } return; }
    if (b.vis > 0.01 && (P.alpha || 0) > 0.01) {
      const M = MOD(); let drew = false;
      if (M && S.inst) { const o = { T, sx: H.sx, sy: H.sy, t: S.g.t, low: lowFx(), scale: b.scale || 1 }; try { if (M.drawShadow && !b.under && (S.rise || 0) > -0.6) M.drawShadow(c, b.x, b.y, Math.max(0, b.z), drawA(S), P, o); M.draw(c, b.x, b.y, b.z + (S.rise || 0) + (P.bob || 0), drawA(S), P, o); drew = true; S.glDrawn = true; } catch (e) { if (typeof console !== 'undefined') console.warn('Genbu: model draw', e); } }
      if (!drew) drawBody(S, c, T);
      petAt(S, c, T);
    } else petAt(S, c, T);
    if (S.dismounted) S.H.X.drawPetAt(c, H.sx(S.me.x), H.sy(S.me.y), {});
    callM(S, c, 'drawEnt');
  }
  /* the placeholder body (until the lead's model lands): legs, a domed shell with spikes, the head, the drill on its carriage, the tracks */
  function drawBody(S, c, T) {
    const H = S.H, P = S.P, b = S.body, xf = P.xf, tuck = P.roll, scr = p => { const w = l2w(S, p); return [H.sx(w.x), H.sy(w.y) - w.z * ZK * T]; }, ag = S.ag;
    c.save(); c.globalAlpha *= P.alpha;
    if (P.ground != null) { const Y = H.sy(b.y) + T * 0.6; c.beginPath(); c.rect(-1e5, -1e5, 2e5, 1e5 + Y); c.clip(); }
    const crack = P.crumble, legK = (1 - tuck) * (1 - sstep(0.26, 0.48, xf));
    // legs (four) and track pods
    for (const [, fx, fy] of FEET) { const ph = S.gph * TAU + (fx * fy > 0 ? 0 : Math.PI), lift = Math.max(0, Math.sin(ph)) * 0.25 * S.gk, sw = Math.cos(ph) * 0.3 * S.gk, base = [fx * 0.95 + sw * fx, fy * 0.85, 0.1 + lift], hip = [fx * 0.75, fy * 0.7, 0.75];
      const A = scr(hip), B2 = scr([lerp(hip[0], base[0], legK), lerp(hip[1], base[1], legK), lerp(0.7, base[2], legK)]);
      c.strokeStyle = SANDD; c.lineCap = 'round'; c.lineWidth = T * 0.42; c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B2[0], B2[1]); c.stroke();
      const tr = scr([fx * 0.95, fy * 0.95 * (1 - 0.15 * xf), 0.12]); c.fillStyle = '#3C342C'; c.beginPath(); c.ellipse(tr[0], tr[1], T * (0.36 + 0.2 * xf), T * 0.2, ag, 0, TAU); c.fill(); }
    // the head on its neck
    if (P.neck > 0.05) { const h = scr([lerp(1.2, 1.8, P.neck), 0, 0.75 + 0.05 * Math.sin(S.g.t * 1.1)]); c.fillStyle = SAND; c.strokeStyle = ORANGE; c.lineWidth = T * 0.05; c.beginPath(); c.arc(h[0], h[1], T * 0.38 * P.neck, 0, TAU); c.fill(); c.stroke(); c.fillStyle = AMBER; c.beginPath(); c.arc(h[0] + Math.cos(ag) * T * 0.15, h[1] - T * 0.08, T * 0.06, 0, TAU); c.fill(); }
    // the shell: a dome (lower in drill form, spinning in a roll), six sections, spikes
    const C0 = scr([0, 0, 0.75 - 0.25 * xf - 0.2 * tuck]), rx = T * (1.75 - 0.15 * xf), ry = T * (1.25 - 0.1 * xf) * GY, hgt = T * (0.95 - 0.35 * xf);
    let gr = c.createRadialGradient(C0[0] - rx * 0.3, C0[1] - hgt * 0.8, rx * 0.1, C0[0], C0[1] - hgt * 0.3, rx * 1.1); gr.addColorStop(0, '#F2E3C0'); gr.addColorStop(0.6, SAND); gr.addColorStop(1, SANDD);
    c.fillStyle = gr; c.beginPath(); c.ellipse(C0[0], C0[1], rx, ry, 0, Math.PI, TAU); c.ellipse(C0[0], C0[1] - hgt * 0.15, rx * 0.98, hgt + ry * 0.2, 0, 0, Math.PI, true); c.fill();
    c.fillStyle = SAND; c.beginPath(); c.ellipse(C0[0], C0[1] - hgt * 0.55, rx * 0.95, hgt * 0.75, 0, 0, TAU); c.fill();
    c.strokeStyle = ORANGE; c.lineWidth = T * 0.07; c.beginPath(); c.ellipse(C0[0], C0[1], rx, ry, 0, 0, TAU); c.stroke();
    const rot = S.rollA || 0; c.strokeStyle = rgba(ORANGE, 0.75); c.lineWidth = T * 0.045; for (let i = 0; i < 6; i++) { const a = rot + ag + i / 6 * TAU; c.beginPath(); c.moveTo(C0[0], C0[1] - hgt * 0.9); c.lineTo(C0[0] + Math.cos(a) * rx * 0.95, C0[1] - hgt * 0.2 + Math.sin(a) * ry * 0.95); c.stroke(); }
    c.fillStyle = '#B5582A'; for (let i = 0; i < 9; i++) { const a = rot + ag + i / 9 * TAU + 0.3, rr = i % 3 === 0 ? 0.35 : 0.7, x = C0[0] + Math.cos(a) * rx * rr, y = C0[1] - hgt * (0.85 - 0.45 * rr) + Math.sin(a) * ry * rr; c.beginPath(); c.moveTo(x - T * 0.12, y); c.lineTo(x, y - T * 0.32); c.lineTo(x + T * 0.12, y); c.closePath(); c.fill(); }
    if (crack > 0.01) { c.strokeStyle = rgba(AMBER, crack); c.lineWidth = T * 0.03; for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.4; c.beginPath(); c.moveTo(C0[0], C0[1] - hgt * 0.6); c.lineTo(C0[0] + Math.cos(a) * rx * 0.5 * crack, C0[1] - hgt * 0.6 + Math.sin(a) * hgt * 0.6 * crack); c.lineTo(C0[0] + Math.cos(a + 0.3) * rx * 0.9 * crack, C0[1] - hgt * 0.4 + Math.sin(a + 0.3) * hgt * 0.9 * crack); c.stroke(); } }
    // the drill on its carriage (hidden while the bit is away)
    if (P.bitOut < 0.999) drawDrillAt(c, scr(local(S, 'drillBase')), scr(local(S, 'drillTip')), T, P.drillSpin, 1 - P.bitOut);
    c.restore();
  }
  function drawDrillAt(c, A, B2, T, spin, a) {
    const dx = B2[0] - A[0], dy = B2[1] - A[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = T * 0.42;
    c.save(); c.globalAlpha *= a; c.fillStyle = '#A9562C'; c.strokeStyle = '#5E2A12'; c.lineWidth = T * 0.03;
    c.beginPath(); c.moveTo(A[0] + nx * w, A[1] + ny * w); c.lineTo(B2[0], B2[1]); c.lineTo(A[0] - nx * w, A[1] - ny * w); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = '#E3B37A'; c.lineWidth = T * 0.05; for (let i = 0; i < 5; i++) { const u = ((i / 5) + spin / TAU) % 1, ww = w * (1 - u); c.beginPath(); c.moveTo(A[0] + dx * u + nx * ww, A[1] + dy * u + ny * ww); c.lineTo(A[0] + dx * (u + 0.12) - nx * ww * 0.85, A[1] + dy * (u + 0.12) - ny * ww * 0.85); c.stroke(); }
    c.fillStyle = '#3A3530'; c.beginPath(); c.arc(A[0], A[1], w * 0.9, 0, TAU); c.fill(); c.fillStyle = rgba(AMBER, 0.8); c.beginPath(); c.arc(A[0], A[1], w * 0.35, 0, TAU); c.fill();
    c.restore(); }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz(), D = S.drill, own = !moves().drawsFx;
    if (!S.released && own) {
      // the flying bit (the GPU model's own bit when present), its corkscrew trail of dust
      if (D.state !== 'docked' && D.state !== 'spin') { const p = [H.sx(D.x), H.sy(D.y) - D.z * ZK * T], drew = !!S.inst;   /* (the model draws its own single bit at drillOff) */
        if (!drew) { const ag = groundA(D.yaw), L = T * 1.6, tip = [p[0] + Math.cos(ag) * L, p[1] + Math.sin(ag) * L * 0.8], base = [p[0] - Math.cos(ag) * L * 0.2, p[1] - Math.sin(ag) * L * 0.2]; drawDrillAt(c, base, tip, T, D.spin, 1); }
        if (D.trail.length > 1) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(AMBER, 0.35); c.lineWidth = T * 0.18; c.lineCap = 'round'; c.beginPath(); D.trail.forEach((q, i) => { const x = H.sx(q[0]), y = H.sy(q[1]) - q[2] * ZK * T; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.stroke(); c.restore(); } }
      // Rock You's crystals (placeholder: amber-seamed stone prisms)
      const R = S.rock; if (R) for (const q of R.crystals) { if (!q.up) continue; const u = cl((R.t - q.t) / 0.18), ex = R.burst ? cl((R.t - R.burstT) / 0.3) : 0; if (ex >= 1) continue; const X0 = H.sx(q.x), Y0 = H.sy(q.y), h = T * q.h * u * (1 - ex);
        c.save(); c.globalAlpha = 1 - ex; c.fillStyle = SAND; c.strokeStyle = ORANGE; c.lineWidth = T * 0.04; c.beginPath(); c.moveTo(X0 - T * 0.32, Y0); c.lineTo(X0 + q.lean * h * 0.4, Y0 - h); c.lineTo(X0 + T * 0.32, Y0); c.closePath(); c.fill(); c.stroke(); c.strokeStyle = rgba(AMBER, 0.9); c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X0 + q.lean * h * 0.3, Y0 - h * 0.75); c.stroke(); c.restore(); }
      // the eight Earth drills
      const K = S.cal; if (K && K.drills && K.drills.length && K.phase !== 'crumble') for (const d of K.drills) { if (d.rise <= 0) continue; const X0 = H.sx(d.x), Y0 = H.sy(d.y), h = T * 2.4 * backEase(d.rise), ex = d.burst > 1 ? cl((d.burst - 1) / 0.35) : 0; if (ex >= 1) continue;
        c.save(); c.globalAlpha = 1 - ex; drawDrillAt(c, [X0, Y0], [X0, Y0 - h], T * 1.3, d.spin, 1); if (d.glow > 0.05) { c.globalCompositeOperation = 'lighter'; c.fillStyle = rgba(AMBER, 0.5 * d.glow); c.beginPath(); c.arc(X0, Y0 - h * 0.5, T * 0.7 * d.glow, 0, TAU); c.fill(); } c.restore(); } }
    if (own) drawParts(S, c, T, false);
    callM(S, c, 'drawOver');
  }
  const backEase = u => { const s = 1.7; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
  function drawParts(S, c, T, floor) {
    const H = S.H; c.save();   /* (the core's own pooled stone, dust and sparks; off when E draws the effects) */
    for (const p of S.parts) { const u = p.t / p.life, X0 = H.sx(p.x), Y0 = H.sy(p.y) - p.z * ZK * T;
      if (floor !== (p.kind === 4)) continue;
      if (p.kind === 1) { c.globalAlpha = 0.35 * (1 - u); c.fillStyle = DUST; c.beginPath(); c.arc(X0, Y0, T * p.s * (0.6 + u), 0, TAU); c.fill(); }
      else if (p.kind === 2 || p.kind === 5) { c.globalAlpha = 1 - sstep(0.7, 1, u); c.fillStyle = p.col || SAND; c.save(); c.translate(X0, Y0); c.rotate(p.rot); const s = T * p.s; c.fillRect(-s, -s * 0.6, s * 2, s * 1.2); c.restore(); }
      else if (p.kind === 3) { c.globalAlpha = 1 - u; c.fillStyle = AMBER; c.fillRect(X0 - 1.5, Y0 - 1.5, 3, 3); }
      else if (p.kind === 4) { c.globalAlpha = 0.6 * (1 - u); c.strokeStyle = AMBER; c.lineWidth = T * 0.08 * (1 - u); c.beginPath(); c.ellipse(X0, Y0, T * p.s * (0.3 + 0.7 * u), T * p.s * (0.3 + 0.7 * u) * GY, 0, 0, TAU); c.stroke(); } }
    c.restore(); }

  /* ================= the HUD: Rock You, Drill Cannon, Shell Roll (Dive), Jump (Rise), the Calamity gauge ================= */
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic } = o, t = S.g.t, cal = S.phase === 'calamity', idle = S.phase !== 'walk' || S.body.locked;
    const face = (b, key, rd, glyph) => blitC(c, hudPic(`genbu|${key}|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => { const cx = w / 2, cy = h / 2, r = b.r, g2 = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); g2.addColorStop(0, rd ? '#E9D3A4' : '#5A4E3E'); g2.addColorStop(0.6, rd ? '#B98A4E' : '#3A3128'); g2.addColorStop(1, rd ? '#6A3C18' : '#1E1914'); x.fillStyle = g2; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); x.lineWidth = 2.5; x.strokeStyle = rd ? AMBER : 'rgba(255,181,71,.3)'; x.stroke(); x.save(); x.globalAlpha = rd ? 1 : 0.5; x.translate(cx, cy); glyph(x, r); x.restore(); }), b.x, b.y);
    const ring = (b, cd, cdMax, busy) => { if (busy) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(AMBER, 0.85); c.beginPath(); c.arc(b.x, b.y, b.r + 2, t * 7, t * 7 + 1.7); c.stroke(); c.restore(); } else if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / cdMax)); c.closePath(); c.fillStyle = 'rgba(14,10,6,.55)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); } };
    const lab = (b, s, col, dx) => GFX.labelS(c, s, b.x + (dx || 0), b.y + b.r + 9, 8, 800, col || '#FFE2B0', 'rgba(0,0,0,.7)', 3);
    const away = drillAway(S);
    { const b = B.s[0], rd = !cal && !idle && S.cdRock <= 0.01 && !S.busy; face(b, 'rock', rd, (x, r) => { x.fillStyle = SAND; x.strokeStyle = ORANGE; x.lineWidth = 2; for (const [dx2, h] of [[-0.35, 0.55], [0, 0.8], [0.35, 0.5]]) { x.beginPath(); x.moveTo(r * (dx2 - 0.15), r * 0.4); x.lineTo(r * dx2, r * (0.4 - h)); x.lineTo(r * (dx2 + 0.15), r * 0.4); x.closePath(); x.fill(); x.stroke(); } }); ring(b, S.cdRock, TUNE.rock.cd, S.busy === 'rock'); lab(b, cal ? '—' : 'ROCK YOU'); }
    { const b = B.s[1], rd = !cal && !idle && !away && S.cdDrill <= 0.01 && !S.busy; face(b, 'drill', rd, (x, r) => { x.fillStyle = '#B5582A'; x.beginPath(); x.moveTo(-r * 0.55, -r * 0.3); x.lineTo(r * 0.6, 0); x.lineTo(-r * 0.55, r * 0.3); x.closePath(); x.fill(); x.strokeStyle = '#F0C890'; x.lineWidth = 2; for (let i = 0; i < 3; i++) { x.beginPath(); x.moveTo(-r * 0.4 + i * r * 0.32, -r * 0.24 + i * r * 0.07); x.lineTo(-r * 0.25 + i * r * 0.32, r * 0.24 - i * r * 0.07); x.stroke(); } }); ring(b, S.cdDrill, TUNE.drill.cd, S.busy === 'drill' || away); lab(b, cal ? '—' : away ? 'DRILL AWAY' : 'DRILL CANNON', away ? '#FFB547' : null, -8); }
    { const b = B.d, rd = cal ? !!(S.cal && S.cal.phase === 'drill') : !idle && S.cdRoll <= 0.01 && !S.roll; const up = cal && S.cal && S.cal.under; face(b, cal ? (up ? 'rise' : 'dive') : 'roll', rd, (x, r) => { if (cal) { const sg = up ? -1 : 1; x.strokeStyle = AMBER; x.lineWidth = 3.5; x.beginPath(); x.moveTo(0, -r * 0.5 * sg); x.lineTo(0, r * 0.45 * sg); x.moveTo(-r * 0.3, r * 0.15 * sg); x.lineTo(0, r * 0.45 * sg); x.lineTo(r * 0.3, r * 0.15 * sg); x.stroke(); } else { x.fillStyle = SAND; x.beginPath(); x.ellipse(0, r * 0.1, r * 0.6, r * 0.4, 0, Math.PI, TAU); x.fill(); x.strokeStyle = AMBER; x.lineWidth = 2.5; x.beginPath(); x.arc(0, 0, r * 0.72, 0.3, 2.2); x.stroke(); } }); if (!cal) ring(b, S.cdRoll, TUNE.rollCd, !!S.roll); lab(b, cal ? (up ? 'RISE' : 'DRILL') : 'SHELL ROLL'); }
    if (B.j && !cal) { const b = B.j, rd = !idle && !S.roll; face(b, 'jump', rd, (x, r) => { x.strokeStyle = AMBER; x.lineWidth = 3.5; x.beginPath(); x.moveTo(0, r * 0.5); x.lineTo(0, -r * 0.45); x.moveTo(-r * 0.3, -r * 0.15); x.lineTo(0, -r * 0.45); x.lineTo(r * 0.3, -r * 0.15); x.stroke(); }); if (S.jump) ring(b, 0, 1, true); lab(b, cal ? 'RISE' : 'JUMP'); }
    // the Calamity gauge: an amber ring round a drill emblem; the form's time outside it
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge;
      if (full || cal) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.2 * Math.sin(t * 6); c.fillStyle = AMBER; c.beginPath(); c.arc(b.x, b.y, b.r * 1.35, 0, TAU); c.fill(); c.restore(); }
      face(b, 'cal', full || cal, (x, r) => { x.fillStyle = '#B5582A'; x.beginPath(); x.moveTo(-r * 0.3, -r * 0.45); x.lineTo(0, r * 0.55); x.lineTo(r * 0.3, -r * 0.45); x.closePath(); x.fill(); x.fillStyle = SAND; x.fillRect(-r * 0.5, -r * 0.6, r, r * 0.18); });
      c.save(); c.lineCap = 'round'; c.lineWidth = 5; c.strokeStyle = 'rgba(14,10,6,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r - 3, 0, TAU); c.stroke(); if (k > 0.004) { c.strokeStyle = full ? '#FFE08A' : AMBER; c.lineWidth = 4.5; c.beginPath(); c.arc(b.x, b.y, b.r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); } c.restore();
      if (S.phase === 'walk' || S.phase === 'summon' || (cal && S.cal && S.cal.phase === 'drill')) { const left = cal ? S.cal.left : S.phase === 'summon' ? S.dur : S.left, max = cal ? TUNE.cal.dur[S.tier] : S.dur, u = cl(left / max); c.save(); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = left < 5 ? 'rgba(255,120,110,.9)' : rgba('#FFE2B0', 0.9); c.beginPath(); c.arc(b.x, b.y, b.r + 4.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore(); GFX.labelS(c, Math.ceil(Math.max(0, left)) + 's', b.x, b.y + b.r * 0.7, 10, 900, '#FFE9B0', 'rgba(0,0,0,.75)', 3); }
      lab(b, cal ? 'CALAMITY!' : full ? 'CALAMITY' : S.used ? 'USED' : `CALAMITY ${Math.floor(S.charge * 100)}%`, full || cal ? '#FFE08A' : null); }
  }

  /* ================= the Ultimate ================= */
  U.genbu = (C, H) => {
    const me = H.me, g = H.g;
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'earth', src: 'ult' }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, AMBER, 0.3); return; }
    if (g._genbu && !g._genbu.released) return;
    startForm(C, H);
  };
  U.genbu.warm = () => { const idle = f => typeof requestIdleCallback === 'function' ? requestIdleCallback(f, { timeout: 1000 }) : setTimeout(f, 200); idle(() => { try { const M = MOD(); if (M && M.warm) M.warm(); } catch (e) { /* */ } }); };   /* (the model builds its GPU meshes at idle) */
  U.genbu.TUNE = TUNE;
  U.genbu.__dbg = { TUNE, RIG, anchor, pickEight, blankPose, moves, get MODEL() { return MOD(); }, glOn, local, drawA };
})();
