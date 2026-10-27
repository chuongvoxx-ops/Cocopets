/* ---------- TSUKIMOCHI, THE MOON RABBIT ----------
   The Hollow Moon's first boss, in the Great Crater: a round floor of grey regolith some twenty-nine metres across, its
   raised rim strewn with moon boulders, pocked with little craters of its own; beyond the rim the black sky, the
   galaxy's faint band and Gaia hanging blue and green.
   Tsukimochi is the rabbit in the moon, grown colossal and wicked: a great round sitting rabbit of snow-white fur,
   cel-shaded, with a big round head, long ears (the right one flops; both twitch and swivel to the pet), a pale gold
   CRESCENT glowing on its brow, big glossy RED eyes with narrow slit pupils and sly heavy lids, a pink nose that wiggles,
   a smirk with one little fang, fluffy cheek tufts and a cotton tail. It holds a giant moon-stone pestle, and beside it
   stands its great stone mortar, full of glowing elixir. Cute and evil at once.
   Moon Leap: it crouches and leaps out of sight; its shadow grows on a big shown circle under the pet and it comes down
   there: heavy damage inside, then a slow shockwave ring rolls out (roll through it). It lands so hard its long ears
   bury themselves in the ground: STUCK and dizzy for a few seconds, its CRESCENT bared (the weak point).
   Pestle Slam: it heaves the pestle overhead and brings it down along a shown lane (in its second phase, two lanes):
   it hurts in the lane only, and the pestle sticks fast in the ground at the lane's end a moment: strike the PESTLE
   there (a weak spot) while it tugs.
   Elixir Brew: it pounds its mortar and the MORTAR swells with glowing elixir (the weak point: blows on it count
   double); a cone is shown from the mortar to the pet. Strike the mortar enough (a meter shows how many) and it
   CRACKS: the rabbit reels, nothing splashes. Else it splashes the cone with sticky elixir that hurts and lingers,
   slowing.
   Mochi Shake: it pounds the ground; big round moon-mochi drop onto shown circles at the rim and ROLL across the
   crater along shown lanes, one lane always through the pet.
   The Warren (at half health): it curls up behind its ears, out of reach, and a warren of thirty little evil moon
   bunnies pours out of its mortar, a few at a time; a counter shows how many are left. Clear them all and it is
   EXPOSED: uncurled and dizzy, its crescent bare, for a long damage window. From then on a few bunnies hop out now
   and then.
   Between acts it hops back to its spot beside the mortar, near the crater's heart. It is never still: it breathes,
   blinks, its nose wiggles, its ears twitch and turn, its head tilts, it squashes on landing and rocks back when struck. */
RiftFiend.define({ id: 'tsukimochi', hpK: 1.25, dmgK: 1.25, name: 'Tsukimochi', title: 'The Moon Rabbit', color: '#F4F2FA', glow: '#FFE29A', accent: '#FFF4D0', biome: 'mare', r: 3.0, els: ['light', 'dark'], phases: 2 }, (() => {
  const { TAU, TN, sorted, hit } = RiftFiend, tubeLite = TN.tubeLite, K = DunFiend.KIT;
  const { INK, REG, REG_D, MOONSTONE, MOON_HI } = MOON;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, want, dt, k) => (v || 0) + (want - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const add3 = (a, b, k) => [a[0] + b[0] * (k == null ? 1 : k), a[1] + b[1] * (k == null ? 1 : k), a[2] + b[2] * (k == null ? 1 : k)], sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const len3 = a => Math.hypot(a[0], a[1], a[2]), norm3 = a => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const turnTo = (a, b, dt, w) => a + clamp(angTo(a, b), -w * dt, w * dt);
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1)), rgba = TN.rgba;
  // the painter's palette: snow-white fur shaded cool lavender, a blue rim of Gaia's light
  const FUR = '#F8F6FC', FUR_SH = '#D2CEE6', FUR_SH2 = '#C3BEDC', FUR_HI = '#FFFFFF', RIM = '#9CC0FF', FUR_AO = '#6A6690';
  const PINK = '#F6A8C0', PINK_SH = '#DA7C9E', PINK_HI = '#FFD6E2', NOSE = '#F27C9C', BLUSH = '#FF8FB0';
  const EYE_W = '#FFF2F5', EYE_HOT = '#FF5A70', EYE_RED = '#E0193A', EYE_D = '#8E0A22', EYE_DD = '#3E0210';
  const CRES = '#FFE39A', CRES_SH = '#E2B65A', CRES_HI = '#FFF9DE', CRES_GLOW = '#FFD878';
  const STONE = '#C6CDDF', STONE_SH = '#9098B6', STONE_SH2 = '#848CAC', STONE_HI = '#F0F3FA';
  const MORT = '#B4BACB', MORT_SH = '#7E859D', MORT_SH2 = '#737A93', MORT_HI = '#E4E7F0';
  const ELIX = '#8FF5DC', ELIX_SH = '#3FBFAE', ELIX_HI = '#E8FFF8', ELIX_D = '#1E7C78';
  const MOCHI = '#FFFDF6', MOCHI_SH = '#E6DCD4', MOCHI_HI = '#FFFFFF';
  const LEAPC = '#FFB070', PESTC = '#FF7A9C', ELIXC = '#7FF0D0', MOCHIC = '#FFB938', WAVEC = '#E2EEFF', DANGER = '#FF6A7A', SEALC = '#CFE0FF';
  const FURS = { col: FUR, shade: FUR_SH, shade2: FUR_SH2, hi: FUR_HI, line: INK, glowCol: RIM, glowA: 0.32 };
  // the Great Crater: the floor the pet walks; its spot (home) and its mortar, relative to the crater's heart
  const AR = 14.5, HOME = [0.6, -2.6], MORTP = [-1.25, 0.25], MR = 1.4, MRB = 1.2, MH = 1.45;
  /* the body (metres; u forward, v to the side, h up): a round sitting rabbit; the big head on top; the ears; the pestle
     held on its v+ side (the viewer's left when it faces the camera), the floppy ear on the other */
  const BODY = { u: -0.2, h: 1.68, a: 1.62, b: 1.9, c: 1.62 }, HEAD = { u: 0.35, h: 4.1, a: 1.12, b: 1.72, c: 1.32 }, HAUNCH = { u: -0.3, v: 1.5, h: 0.92, a: 1.3, b: 0.9, c: 0.9 }, NOD = 0.3;
  const FOOT = { u: 0.95, v: 1.25, h: 0.24, a: 0.78, b: 0.42, c: 0.26 }, SHOULDER = { u: 0.75, v: 1.1, h: 2.85 }, TAIL = { u: -1.75, h: 0.9, r: 0.6 };
  const PSIDE = 1, PL = 3.9, BR = 0.6, BL = 2.0, EL = 3.15, EW = 0.98, REACH = 5.4;
  // features on the head: (yaw, elevation) on its ellipsoid
  const F_EYE = [0.5, 0.36], F_CRES = [0, 0.86], F_NOSE = [0, 0.1], F_MOUTH = [0, -0.06], F_PUFF = [0.19, -0.05], F_BLUSH = [0.8, 0.1];
  // dust specks and a stamp on a rolling mochi: points on its sphere
  const MSPECK = (() => { const R = mulberry32(77), out = []; for (let i = 0; i < 14; i++) { const z = R() * 2 - 1, a = R() * TAU, s = Math.sqrt(1 - z * z); out.push([s * Math.cos(a), s * Math.sin(a), z, 0.03 + R() * 0.04]); } return out; })();
  // the attack rotations (the second phase's from half health)
  const CYC1 = ['pestle', 'leap', 'brew', 'mochi', 'pestle', 'brew', 'leap', 'mochi'], CYC3 = ['leap', 'pestle', 'mochi', 'brew', 'pestle', 'leap', 'brew', 'mochi'];
  const WARREN_N = 30, WARREN_CAP = 5;
  /* ---- the warren: little evil moon bunnies, hopping out of its mortar; they bound at the pet and nip ---- */
  Object.assign(MON, { moonbun: { name: 'Moon bunny', from: 999, hp: 160, spd: 2.6, r: 0.4, dmg: 12, xp: 6, coin: 0.3, color: '#F6F4FA', bio: [], tip: 'One of Tsukimochi\'s warren: a little white moon bunny with red eyes and a crescent on its brow. It bounds at you and nips.', kit: [] } });
  Object.assign(DunAI.mon, { moonbun(m, A, X) {
    if (m.launch) { const L = m.launch; L.t += A.dt; const u = clamp(L.t / L.dur, 0, 1); m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); m.z = lerp(L.z0, 0, u) + Math.sin(u * Math.PI) * L.h; m.mode = 'dash';
      if (u >= 1) { m.launch = null; m.z = 0; m.under = false; m.mode = null; X.ring(m.x, m.y, 0.15, 0.8, 0.3, MOON_HI, 0.3); } return; }
    if (m.hopT > 0) { m.hopT -= A.dt; m.mode = 'dash'; X.moveEnt(m, m.hvx * A.dt, m.hvy * A.dt); const u = 1 - Math.max(0, m.hopT) / m.hopMax; m.z = Math.sin(u * Math.PI) * 0.6; if (m.hopT <= 0) { m.z = 0; m.mode = null; m.cd = 0.28 + Math.random() * 0.45; } return; }
    m.mode = null; m.z = 0; m.face = A.dx >= 0 ? 1 : -1;
    if (m.cd <= 0) { const s = clamp(A.d - 0.15, 0.6, 2.4), a = A.a + (Math.random() - 0.5) * 0.6, T = 0.4; m.hopT = m.hopMax = T; m.hvx = Math.cos(a) * s / T; m.hvy = Math.sin(a) * s / T; } } });
  { const { shade: dShade, stroke, lwOf, MP, EXT, NF, LN } = DunArt;
    /* a moon bunny: a round white bun of a rabbit facing right, long ears (the back one bent), a red eye under a sly
       lid, a gold crescent on its brow, a pink nose and a cotton tail; mid-hop it stretches */
    MP.moonbun = (c, r, ph, o) => { const lw = lwOf(r), air = o.mode === 'dash' ? 1 : 0, wg = Math.sin(ph * TAU), st = air * 0.12;
      c.fillStyle = 'rgba(10,12,24,.25)'; c.beginPath(); c.ellipse(0, r * 0.74, r * (0.85 - air * 0.3), r * 0.22, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, -air * r * 0.6);
      const ear = (x, y, a, L, w, bend) => { c.save(); c.translate(x, y); c.rotate(a); c.beginPath(); c.moveTo(-w * 0.5, 0); c.quadraticCurveTo(-w * 0.75, -L * 0.6, -w * 0.1 + bend, -L); c.quadraticCurveTo(w * 0.6 + bend, -L * 0.95, w * 0.5, 0); c.closePath(); c.fillStyle = '#F2F0F8'; c.fill(); stroke(c, lw);
        c.beginPath(); c.moveTo(-w * 0.18, -L * 0.12); c.quadraticCurveTo(-w * 0.3, -L * 0.6, bend * 0.8, -L * 0.86); c.quadraticCurveTo(w * 0.3 + bend * 0.5, -L * 0.6, w * 0.2, -L * 0.12); c.closePath(); c.fillStyle = PINK; c.fill(); c.restore(); };
      // the far ear, the tail, the body, the near ear
      ear(r * 0.22, -r * 0.62, -0.35 - air * 0.3 + wg * 0.06, r * 1.15, r * 0.36, -r * 0.25);
      c.beginPath(); c.ellipse(-r * 0.05, r * 0.12 - st * r, r * (0.8 - st * 0.4), r * (0.6 + st * 0.3), -air * 0.3, 0, TAU); c.fillStyle = dShade(c, '#F6F4FA', r, -r * 0.25, -r * 0.3, 0.32); c.fill(); stroke(c, lw);
      c.beginPath(); TN.blob(Array.from({ length: 10 }, (_, i) => { const a = i / 10 * TAU, k = i % 2 ? 1.18 : 0.96; return [-r * 0.86 + Math.cos(a) * r * 0.25 * k, r * 0.05 + Math.sin(a) * r * 0.25 * k]; }))(c); c.fillStyle = '#FFFFFF'; c.fill(); stroke(c, lw * 0.8);
      c.beginPath(); c.ellipse(r * 0.1, r * 0.58 - air * r * 0.1, r * 0.42, r * 0.14, 0.1, 0, TAU); c.fillStyle = '#E8E4F0'; c.fill(); stroke(c, lw * 0.8);
      c.beginPath(); c.arc(r * 0.48, -r * 0.3, r * 0.48, 0, TAU); c.fillStyle = dShade(c, '#F8F6FC', r * 0.5, r * 0.3, -r * 0.48, 0.3); c.fill(); stroke(c, lw);
      ear(r * 0.4, -r * 0.66, 0.18 - air * 0.35 + wg * 0.08, r * 1.25, r * 0.4, 0);
      // the face: a red eye with a slit, a sly lid, the crescent, the pink nose, a blush, a fang
      c.fillStyle = '#FFF2F5'; c.beginPath(); c.ellipse(r * 0.64, -r * 0.34, r * 0.16, r * 0.19, 0, 0, TAU); c.fill();
      c.fillStyle = EYE_RED; c.beginPath(); c.ellipse(r * 0.67, -r * 0.31, r * 0.12, r * 0.15, 0, 0, TAU); c.fill();
      c.fillStyle = EYE_DD; c.beginPath(); c.ellipse(r * 0.68, -r * 0.31, r * 0.03, r * 0.1, 0, 0, TAU); c.fill();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(r * 0.62, -r * 0.38, r * 0.045, 0, TAU); c.fill();
      c.strokeStyle = LN; c.lineWidth = lw * 1.3; c.lineCap = 'round'; c.beginPath(); c.moveTo(r * 0.47, -r * 0.5); c.lineTo(r * 0.82, -r * 0.4); c.stroke();
      c.fillStyle = rgba(BLUSH, 0.45); c.beginPath(); c.ellipse(r * 0.6, -r * 0.08, r * 0.12, r * 0.06, 0, 0, TAU); c.fill();
      c.fillStyle = CRES; c.beginPath(); c.arc(r * 0.5, -r * 0.66, r * 0.13, 0.6, 0.6 + TAU * 0.999); c.arc(r * 0.55, -r * 0.7, r * 0.1, 0.6 + TAU * 0.999, 0.6, true); c.fill('evenodd');
      c.fillStyle = NOSE; c.beginPath(); c.arc(r * 0.94, -r * 0.24, r * 0.07, 0, TAU); c.fill();
      c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(r * 0.92, -r * 0.16); c.quadraticCurveTo(r * 0.84, -r * 0.06, r * 0.74, -r * 0.1); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(r * 0.8, -r * 0.08); c.lineTo(r * 0.86, -r * 0.08); c.lineTo(r * 0.83, r * 0.01); c.closePath(); c.fill();
      c.restore(); };
    Object.assign(EXT, { moonbun: 2.9 }); Object.assign(NF, { moonbun: 4 }); }
  return {
    arenaR: AR, firstAct: 'sit', artY: 0.66, ambient: 'motes',
    artPoses: [{ name: 'sitting', mem: {} }, { name: 'brewing, the mortar swelling', mem: { elix: 1, swell: 1, evil: 1, pr: 0.6 } }, { name: 'the warren: curled up', mem: { curl: 1, seal: 1 } }, { name: 'stuck: ears in the ground', mem: { stagK: 1, earStuck: 1, dizzy: 1 } }],
    phaseNames: ['The Great Crater', 'The Great Crater', 'The Warren', 'The Warren'],
    props(C) { const out = [], R = mulberry32(5150); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU + (R() - 0.5) * 0.18, far = Math.sin(a) < 0.15, s = far ? 1.35 + R() * 0.9 : 0.85 + R() * 0.4; out.push({ kind: 'rock', i, v: i, s, x: C.x + Math.cos(a) * (AR + 0.55 + s * 0.3), y: C.y + Math.sin(a) * (AR + 0.45 + s * 0.2) }); } return out; },
    propKeep: { every: 30, box: p => [-1.1 * p.s, -1.4 * p.s, 1.1 * p.s, 0.45 * p.s] },
    drawProp(c, FX, p, X, Y, T) { c.translate(X, Y); DunWorld.PROPS.moonrock(c, T * p.s, p.v); },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, h = homeP(FX); m.noTouch = true; m.x = h.x; m.y = h.y; m.act = 'enter';
      Object.assign(M, { home: h, mo: mortarP(FX), bt: 0, hd: Math.PI / 2, hdTo: Math.PI / 2, alt: 14, altV: 0, altP: 14, crouch: 0, crouchTo: 0, lean: 0, leanTo: 0, pr: 0, ps: 0, prTo: 0, psTo: 0, pT: null, pHold: false, pAtM: false,
        elix: 0.2, elixTo: 0.2, swell: 0, crack: 0, mortHit: 0, curl: 0, earStuck: 0, dizzy: 0, evil: 0, evilTo: 0, grin: 0, recoil: 0, hitK: 0, ouch: 0, ouchCd: 0, stagK: 0, seal: 0, look: 0, tilt: 0, aim: Math.PI / 2,
        blink: 0, blinkT: 2.5, blinkA: 0, tw: [0, 0], twT: 1.2, nose: 0, cresHit: 0, flop: 0, flopV: 0,
        hop: null, hopCd: 2.5, sl: null, lp: null, bw: null, mc: null, wr: null, mochi: [], waves: [], craters: [], cracks: [], picks: 0, nextAct: null, last: null, seen: {}, taught: false, landed: false, roared: false, wasStun: false, wasEnter: true, stunKind: null, stunWas: null, trickleT: 9,
        stat: { slams: 0, slamHit: 0, slamMiss: 0, slamDodged: 0, pestStuck: 0, leaps: 0, leapIn: 0, leapOut: 0, stuck: 0, waves: 0, waveHit: 0, wavePass: 0, brews: 0, splashHit: 0, cracks: 0, shakes: 0, mochi: 0, mochiLand: 0, mochiHit: 0, mochiDev: 0, mochiDone: 0, warren: 0, poured: 0, killed: 0, exposed: 0, homeHops: 0 } }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; clearActs(FX, m, M); m.stunT = 0; M.recoil = 0.8; M.hitK = 1;
      if (lv >= 3) { startWarren(FX, m); FX.H.after(0.9, () => FX.H.banner('THE WARREN', `It curls up behind its ears and its warren pours out of the mortar: clear all ${WARREN_N} and it is EXPOSED`, MOON_HI, 3.0, true)); } },
    ai(FX, m, dt) {
      const M = FX.mem, F = FX.S.fast; m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'sit': sit(FX, m, M, dt, F); if (m.actT > (FX.S.lv >= 3 ? 1.2 : 1.55) / F && !M.hop) { m.actT = 0; choose(FX, m); } break;
        case 'pestle': pestleStep(FX, m, M, dt, F); break;
        case 'leap': leapStep(FX, m, M, dt, F); break;
        case 'brew': brewStep(FX, m, M, dt, F); break;
        case 'mochi': mochiStep(FX, m, M, dt, F); break;
        case 'warren': warrenStep(FX, m, M, dt); break;
        default: endAct(m, M);
      }
      // the weak points: the swelling mortar while it brews, the pestle stuck in the ground (the crescent only staggered)
      const mo = mortarP(FX), W = M.bw;
      if (m.act === 'brew' && W && W.state === 'pound' && !W.done) FX.weak('mortar', mo.x, mo.y - MH * 0.6, 1.35 + (M.swell || 0) * 0.3, 2.0, true);
      else if (FX.S.weak.mortar) FX.weak('mortar', 0, 0, 0, 0, false);
      const S = M.sl; if (m.act === 'pestle' && S && S.state === 'stuck') { const b = pestle(m, M, pose(m, M)).head; FX.weak('pestle', b[0], b[1] - b[2], 1.15, 1.6, true); }
      else if (FX.S.weak.pestle) FX.weak('pestle', 0, 0, 0, 0, false);
      if (FX.S.weak.crescent) FX.weak('crescent', 0, 0, 0, 0, false);
      if (!m.under) FX.parts(bodyParts(m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem, s = pose(m, M).cres, ex = M.stunKind === 'exposed'; m.noTouch = true;
      FX.weak('crescent', s[0], s[1] - s[2], ex ? 1.35 : 1.15, ex ? 3.0 : 2.5, m.stunT > 0.05);
      if (FX.S.weak.mortar) FX.weak('mortar', 0, 0, 0, 0, false); if (FX.S.weak.pestle) FX.weak('pestle', 0, 0, 0, 0, false);
      M.twT2 = (M.twT2 || 0) - dt; if (M.twT2 <= 0) { M.twT2 = 0.22 + Math.random() * 0.2; const a = Math.random() * TAU;
        if (M.stunKind === 'stuck') { const P = pose(m, M), q = P.Wb(1.6, (Math.random() < 0.5 ? 1 : -1) * 3.1, 0); FX.H.part({ kind: 'smoke', x: q[0] + Math.cos(a) * 0.4, y: q[1] + Math.sin(a) * 0.3, vx: Math.cos(a) * 0.6, vy: -0.8, drag: 0.6, life: 0.8, max: 0.8, size: 0.8, color: '#9A9EAE' }); }
        else if (M.stunKind === 'cracked') { const mo = mortarP(FX); FX.H.part({ kind: 'spark', x: mo.x + FX.rnd(-1, 1), y: mo.y - MH * 0.5, vx: 0, vy: 1.2, drag: 0.5, life: 0.6, max: 0.6, size: 2.5, color: ELIX }); }
        else FX.H.sparks(s[0] + FX.rnd(-0.5, 0.5), s[1] - s[2] - 0.3, Math.random() < 0.5 ? CRES : '#FFFFFF', 3, 3); }
      if (!m.under) FX.parts(bodyParts(m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt; const stun = m.stunT > 0, me = FX.me, mo = mortarP(FX);
      if (!stun) { if (M.wasStun) { M.wasStun = false; M.recoil = 0.7; M.hitK = 0.5; FX.H.text(m.x, m.y - 6.4, M.stunWas === 'exposed' ? 'It shakes itself awake' : M.stunWas === 'cracked' ? 'Its mortar knits itself whole' : 'It wrenches its ears out of the ground', MOON_HI, 13); FX.H.sfx.thud(); FX.H.shake(5, 0.2); M.stunKind = null; } }
      else M.wasStun = true;
      M.recoil = decay(M.recoil, dt, 2.6); M.hitK = decay(M.hitK, dt, 4); M.ouch = decay(M.ouch, dt, 3.2); M.ouchCd = decay(M.ouchCd, dt, 1); M.mortHit = decay(M.mortHit, dt, 4); M.cresHit = decay(M.cresHit, dt, 3);
      // the entrance: it drops out of the black sky beside its mortar, the floor shakes, it pounds the mortar once and grins
      if (m.act === 'enter') { const e = FX.S.enterT || 0, u = clamp(e / 1.3, 0, 1); M.alt = 14 * (1 - u * u);
        if (u >= 1 && !M.landed) { M.landed = true; M.alt = 0; M.crouch = 1; FX.H.sfx.crash(); FX.H.sfx.thud(); dust(FX, m.x, m.y + 0.3, 3.8, 30, 16); M.craters.push({ x: m.x, y: m.y + 0.3, r: 3.6, t: 0, life: 9, seed: 41 }); M.recoil = 0.6; }
        if (e > 1.6 && e < 2.2) { M.pHold = true; M.pT = [mo.x, mo.y, MH - 0.2]; const v = clamp((e - 1.6) / 0.6, 0, 1); M.pr = v < 0.6 ? smooth(v / 0.6) : 1 - smooth((v - 0.6) / 0.25); M.ps = v < 0.6 ? 0 : smooth((v - 0.6) / 0.2); M.hdTo = Math.atan2(mo.y - m.y, mo.x - m.x) - PSIDE * 0.5; }
        if (e > 2.0 && !M.roared) { M.roared = true; FX.H.sfx.hum(); FX.H.sfx.thud(); FX.H.ring(mo.x, mo.y, 0.3, 6, 1, ELIXC, 0.35); M.elix = 0.8; splish(FX, M, 10); }
        if (M.roared) { M.evilTo = 1; M.grin = toward(M.grin, 1, dt, 4); } }
      else if (M.wasEnter) { M.wasEnter = false; M.alt = 0; }
      // the first lesson, once it is sitting
      if (!M.taught && m.act === 'sit') { M.taught = true; m.actT = -2.4; FX.H.banner('THE MOON RABBIT', 'It pounds the moon\'s elixir with its pestle. Land it from a leap and it is STUCK: strike the glowing CRESCENT on its brow', CRES, 3.0, true); }
      // the pose: crouch, lean, the pestle's swing, the curl of the warren, the slump of a stagger
      M.crouch = toward(M.crouch, M.crouchTo, dt, M.crouchTo > M.crouch ? 9 : 5); M.crouchTo = 0;
      M.lean = toward(M.lean, M.leanTo, dt, 7); M.leanTo = 0;
      if (!M.pHold) { M.pr = toward(M.pr, M.prTo, dt, 6); M.ps = toward(M.ps, M.psTo, dt, 8); } M.prTo = 0; M.psTo = 0; M.pHold = false;
      M.evil = toward(M.evil, Math.max(M.evilTo, stun ? 0 : 0.15), dt, 5); M.evilTo = 0; M.grin = toward(M.grin, stun ? 0 : M.evil > 0.6 ? 1 : 0.25, dt, 4);
      M.curl = toward(M.curl, m.act === 'warren' ? 1 : 0, dt, m.act === 'warren' ? 3.5 : 2.2); M.seal = toward(M.seal, m.act === 'warren' ? 1 : 0, dt, 2.5);
      M.stagK = toward(M.stagK, stun ? 1 : 0, dt, stun ? 6 : 2.5); M.dizzy = toward(M.dizzy, stun ? 1 : 0, dt, 6);
      M.earStuck = toward(M.earStuck, stun && M.stunKind === 'stuck' ? 1 : 0, dt, stun ? 10 : 4);
      // the elixir: it rises and glows as it brews, sinks after a splash or a crack; the mortar swells with it
      const brewing = m.act === 'brew' && M.bw && M.bw.state === 'pound' && !M.bw.done;
      M.elix = toward(M.elix, brewing ? M.elixTo : stun && M.stunKind === 'cracked' ? 0.05 : 0.22, dt, brewing ? 4 : 1.2); M.swell = toward(M.swell, brewing ? M.elixTo : 0, dt, brewing ? 4 : 3); M.elixTo = 0.2;
      M.crack = decay(M.crack, dt, stun && M.stunKind === 'cracked' ? 0 : 0.35);
      // its height: a leap and a hop set their own; it sinks a little when stuck
      if (m.act !== 'enter' && m.act !== 'leap' && !M.hop) M.alt = toward(M.alt, stun && M.stunKind === 'stuck' ? -0.15 : 0, dt, 6);
      M.altV = dt > 1e-4 ? (M.alt - M.altP) / dt : 0; M.altP = M.alt;
      // turning: quick for the pestle, slow at rest, not at all in the air or when stuck
      if (!stun && m.act !== 'enter' && !(M.lp && M.lp.state !== 'crouch')) M.hd = turnTo(M.hd, M.hdTo == null ? M.hd : M.hdTo, dt, m.act === 'pestle' ? 5 : m.act === 'brew' ? 3 : 1.8);
      else if (m.act === 'enter' && M.hdTo != null) M.hd = turnTo(M.hd, M.hdTo, dt, 3);
      // the head turns ahead of the body to the pet, the eyes and ears follow it; a sly tilt
      M.aim = turnTo(M.aim == null ? M.hd : M.aim, Math.atan2(me.y - m.y, me.x - m.x), dt, 5);
      M.look = toward(M.look, stun || M.curl > 0.5 ? 0 : clamp(angTo(M.hd, M.aim), -0.5, 0.5), dt, 4);
      M.tilt = toward(M.tilt, stun ? 0.22 * Math.sin(M.bt * 2.2) : 0.07 * Math.sin(M.bt * 0.7) + M.evil * 0.1, dt, 3);
      // blinks, ear twitches, the nose's wiggle, the floppy ear's bounce
      M.blinkT -= dt; if (M.blinkT <= 0) { M.blinkT = Math.random() < 0.25 ? 0.3 : 2.2 + Math.random() * 3; M.blinkA = 0.16; } M.blinkA = decay(M.blinkA, dt, 1); M.blink = M.blinkA > 0 ? 1 - Math.abs(M.blinkA / 0.08 - 1) : 0;
      M.twT -= dt; if (M.twT <= 0) { M.twT = 0.8 + Math.random() * 2.4; M.tw[Math.random() < 0.5 ? 0 : 1] = 1; } M.tw[0] = decay(M.tw[0], dt, 5); M.tw[1] = decay(M.tw[1], dt, 5);
      M.nose = (M.bt % 2.7) < 0.7 ? Math.sin(M.bt * 30) : 0;
      M.flopV += (-M.flop * 60 - M.flopV * 6 + (M.altV || 0) * 0.9) * dt; M.flop += M.flopV * dt; M.flop = clamp(M.flop, -0.6, 0.6);
      // the pet can't stand inside the mortar
      { const dx = me.x - mo.x, dy = me.y - mo.y, d = Math.hypot(dx, dy), rr = MR + (me.r || 0.4) * 0.7; if (d < rr && !me.leap && !me.dead) { const k = d > 1e-3 ? 1 / d : 0; me.x = mo.x + (k ? dx * k : 1) * rr; me.y = mo.y + (k ? dy * k : 0) * rr; } }
      updWaves(FX, m, M, dt); updMochi(FX, m, M, dt);
      M.craters.forEach(k => k.t += dt); M.craters = M.craters.filter(k => k.t < k.life); M.cracks.forEach(k => k.t += dt); M.cracks = M.cracks.filter(k => k.t < k.life);
      // curled up in the warren: moonstone glints crawling over its fur
      if (M.seal > 0.5 && Math.random() < dt * 8) { const a = Math.random() * TAU; FX.H.sparks(m.x + Math.cos(a) * 2, m.y - 1.6 + Math.sin(a) * 1.2, Math.random() < 0.5 ? SEALC : '#FFFFFF', 2, 2); } },
    dmgK(FX, m) { const M = FX.mem; if (!M) return 1; M.recoil = Math.max(M.recoil || 0, 0.32); M.hitK = 1; if (!(M.ouchCd > 0) && !(m.stunT > 0)) { M.ouch = 0.35; M.ouchCd = 2.6; } return 1; },
    onWeakHit(FX, key) { const M = FX.mem, m = FX.m; if (!M) return;
      if (key === 'crescent') { M.cresHit = 1; M.recoil = Math.max(M.recoil || 0, 0.5); return; }
      if (key === 'pestle') { M.recoil = Math.max(M.recoil || 0, 0.3); return; }
      if (key !== 'mortar') return; M.mortHit = 1; const W = M.bw; if (m && m.act === 'brew' && W && !W.done) { W.hits++; if (W.hits >= W.need) crackMortar(FX, m, M); } },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat || m.dead || m.act === 'enter') return null;
      if (M.lp && M.lp.tx != null && (M.alt || 0) > 1.5) return { x: M.lp.tx, y: M.lp.ty - 1.2, k: 0.3 };
      const x = m.x, y = m.y - 2.4, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.4, 3.6 / d) }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; drawRabbit(c, FX, m, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function homeP(FX) { return { x: FX.C.x + HOME[0], y: FX.C.y + HOME[1] }; }
  function mortarP(FX) { return { x: FX.C.x + MORTP[0], y: FX.C.y + MORTP[1] }; }
  // a burst of moon dust where something heavy lands (grey billows and grit: no glow on the pale floor, and no ring
  // that could be taken for the shockwave)
  function dust(FX, x, y, r, n, shake) {
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = r * (0.3 + Math.random() * 0.7), life = 0.8 + Math.random() * 0.6; FX.H.part({ kind: 'smoke', x: x + Math.cos(a) * d * 0.6, y: y + Math.sin(a) * d * 0.45, vx: Math.cos(a) * (1 + r * 0.9), vy: Math.sin(a) * (0.6 + r * 0.5) - 0.7, drag: 1.1, life, max: life, size: 0.55 + r * 0.22, color: Math.random() < 0.5 ? '#9A9EAE' : '#B9BCC8' }); }
    for (let i = 0; i < Math.ceil(n / 2); i++) FX.H.part({ kind: 'shard', x: x + FX.rnd(-r, r) * 0.6, y: y + FX.rnd(-r, r) * 0.4, vx: FX.rnd(-4, 4), vy: FX.rnd(-6, -2), g: 12, life: 0.7, max: 0.7, size: 3, rot: Math.random() * 3, vr: 8, color: Math.random() < 0.5 ? REG : REG_D });
    if (shake) FX.H.shake(shake, 0.3); }
  // elixir splashing up out of the mortar as the pestle comes down in it
  function splish(FX, M, n) { const mo = mortarP(FX);
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1.5 + Math.random() * 2.5; FX.H.part({ kind: 'spark', x: mo.x + Math.cos(a) * 0.5, y: mo.y - MH + Math.sin(a) * 0.3, vx: Math.cos(a) * v, vy: -3 - Math.random() * 3, g: 14, drag: 0.4, life: 0.6, max: 0.6, size: 3 + Math.random() * 2, color: Math.random() < 0.6 ? ELIX : ELIX_HI }); } }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.4 : 1.1, true); }
  function endAct(m, M) { m.act = 'sit'; m.actT = 0; M.sl = null; M.bw = null; M.mc = null; }
  // (telegraphs are disarmed, not spliced out: one may be landing in the very loop that called this)
  function cancelTele(FX) { FX.S.tele.forEach(s => { s.dmg = 0; s.fn = null; s.done = true; s.linger = 0; }); }
  function clearActs(FX, m, M) { cancelTele(FX);
    if (M.lp) { if (m.under || (M.alt || 0) > 0.5) FX.untarget(false); M.lp = null; M.alt = 0; }
    if (M.sl && M.sl.x0 != null) { m.x = M.sl.x0; m.y = M.sl.y0; }
    M.sl = null; M.bw = null; M.mc = null; M.hop = null; M.pr = M.ps = 0;
    M.mochi.forEach(R => { if (R.state === 'roll' || R.state === 'fall') dust(FX, R.x, R.y, 1.0, 6, 0); }); M.mochi = []; M.waves = [];
    endAct(m, M); }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv; let k = M.nextAct; M.nextAct = null;
    if (!k) { const cyc = P >= 3 ? CYC3 : CYC1; k = cyc[M.picks % cyc.length]; M.picks++; }
    M.hop = null; M.last = k; ({ pestle: startPestle, leap: startLeap, brew: startBrew, mochi: startMochi })[k](FX, m); }
  /* ---- at rest: it sits facing the pet; away from its spot by the mortar (or pinned out toward the rim) it hops back ---- */
  function sit(FX, m, M, dt, F) { M.hdTo = FX.angPet(m.x, m.y);
    if (M.hop) { hopStep(FX, m, M, dt); return; }
    M.hopCd -= dt; const h = homeP(FX), dh = Math.hypot(m.x - h.x, m.y - h.y), rc = Math.hypot(m.x - FX.C.x, m.y - FX.C.y);
    if ((M.hopCd <= 0 && dh > 1.0) || dh > 2.5 || rc > FX.C.R * 0.55) startHop(FX, m, M, F, h);   // (far from its mortar, or pinned out toward the rim, it bounds home at once)
    // the second phase: a few of its warren hop out of the mortar now and then
    if (FX.S.lv >= 3 && (M.trickleT -= dt) <= 0) { M.trickleT = 16; const n = FX.H.mons.filter(q => !q.dead && !q.horde && q.type === 'moonbun').length;
      if (n < 2) { pour(FX, m, M, false); pour(FX, m, M, false); M.evil = 1; FX.H.text(m.x, m.y - 6.4, 'Bunnies hop out of its mortar', MOON_HI, 13); FX.H.sfx.pop && FX.H.sfx.pop(); } } }
  // a hop to a spot (home by default; a long way home is a bigger bound)
  function startHop(FX, m, M, F, to) { const p = to || homeP(FX), d = Math.hypot(p.x - m.x, p.y - m.y);
    if (d < 0.5) { M.hopCd = 1.5; return false; }
    M.hop = { t: 0, crouch: 0.28 / F, air: 0.5 + Math.min(0.45, d * 0.035), x0: m.x, y0: m.y, x1: p.x, y1: p.y, h: 1.0 + Math.min(4, d * 0.24), d, landed: false }; M.hopCd = 2.2 + Math.random(); M.stat.homeHops++; return true; }
  function hopStep(FX, m, M, dt) { const H = M.hop; H.t += dt; if (H.d > 2.2) M.hdTo = Math.atan2(H.y1 - H.y0, H.x1 - H.x0);
    if (H.t < H.crouch) { M.crouchTo = 0.8; return; }
    const u = clamp((H.t - H.crouch) / H.air, 0, 1); m.x = lerp(H.x0, H.x1, smooth(u)); m.y = lerp(H.y0, H.y1, smooth(u)); M.alt = Math.sin(u * Math.PI) * H.h;
    if (u >= 1 && !H.landed) { H.landed = true; M.alt = 0; M.crouch = 0.7; M.flopV -= 3; FX.H.sfx.thud(); dust(FX, m.x, m.y + 0.4, 3.0, 10, 5);
      const me = FX.me, dx = me.x - m.x, dy = me.y - m.y, d = Math.hypot(dx, dy) || 1; if (d < 2.4) me.push = { vx: dx / d * 12, vy: dy / d * 12, t: 0.25 }; }
    if (H.t > H.crouch + H.air + 0.22) M.hop = null; }

  /* ---- Pestle Slam: it heaves the pestle overhead and brings it down along a shown lane; the pestle sticks fast at the
     lane's end a moment (a weak spot) while it tugs it free ---- */
  function startPestle(FX, m, o) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'pestle'; m.actT = 0;
    M.sl = { age: 0, turn: 0.3 / F, wait: (P >= 3 ? 0.8 : 0.95) / F * ((o && o.k) || 1), state: 'aim', w: 2.3, n: o && o.n != null ? o.n : (P >= 3 ? 2 : 1) };
    FX.H.sfx.hum(); if (!o) say(FX, 'pestle', 'PESTLE SLAM', 'It brings its pestle down along the pink lane: step out of it. Stuck in the ground, the PESTLE is a weak spot', PESTC); }
  function pestleStep(FX, m, M, dt, F) { const S = M.sl, me = FX.me; if (!S) { endAct(m, M); return; } S.age += dt;
    if (S.state === 'aim') { M.hdTo = FX.angPet(m.x, m.y); M.evilTo = 0.8; M.pHold = true; M.pr = smooth(S.age / S.turn) * 0.25;
      if (S.age >= S.turn) {
        // the lane: from its front out past the pet (from right at its side, if the pet is hugging it), as far as the
        // pestle reaches with a lunge, and never past the rim
        const a = FX.angPet(m.x, m.y), d = [Math.cos(a), Math.sin(a)], dp = FX.dist(m.x, m.y), s0 = clamp(dp - 1.4, 0.2, 1.5); M.hd = M.hdTo = a;
        let L = clamp(dp + 1.8, 5.6, 9.4); while (L > s0 + 2.5 && !FX.inArena(m.x + d[0] * L, m.y + d[1] * L, 0.5)) L -= 0.25;
        Object.assign(S, { state: 'shown', t0: S.age, a, d, ox: m.x + d[0] * s0, oy: m.y + d[1] * s0, len: L - s0, L, x0: m.x, y0: m.y, lunge: clamp(L - 0.75 - REACH, 0, 3.5), bx: m.x + d[0] * (L - 0.75), by: m.y + d[1] * (L - 0.75), dodged: false }); M.stat.slams++; }
      return; }
    M.hdTo = S.a; M.pHold = true; M.pT = [S.bx, S.by, BR];
    if (S.state === 'shown') { const u = clamp((S.age - S.t0) / (S.wait * 0.85), 0, 1); M.pr = 0.25 + 0.75 * smooth(u); M.ps = 0; M.leanTo = -0.18 * u; M.evilTo = 1; M.crouchTo = 0.25 * u;
      if (S.age - S.t0 >= S.wait) { S.state = 'slam'; S.t1 = S.age; FX.H.sfx.whoosh(); } return; }
    if (S.state === 'slam') { const u = clamp((S.age - S.t1) / 0.17, 0, 1); M.ps = u * u; M.pr = 1 - u; M.leanTo = 0.55 * u; M.lean = Math.max(M.lean, 0.5 * u); M.evilTo = 1;
      const k = smooth(u); m.x = S.x0 + S.d[0] * S.lunge * k; m.y = S.y0 + S.d[1] * S.lunge * k;
      if (u >= 1) slamDown(FX, m, M, S); return; }
    if (S.state === 'stuck') { M.ps = 1; M.pr = 0; M.leanTo = 0.35 + Math.sin(M.bt * 16) * 0.08; M.evilTo = 0.4; M.crouchTo = 0.2;
      if (Math.random() < dt * 6) { const b = [S.bx + FX.rnd(-0.8, 0.8), S.by + FX.rnd(-0.4, 0.4)]; FX.H.part({ kind: 'smoke', x: b[0], y: b[1], vx: FX.rnd(-0.6, 0.6), vy: -0.5, drag: 0.8, life: 0.6, max: 0.6, size: 0.6, color: '#A6AAB8' }); }
      if (S.age - S.t2 >= S.hold) { S.state = 'pull'; S.t3 = S.age; S.xL = m.x; S.yL = m.y; FX.H.sfx.whoosh(); dust(FX, S.bx, S.by, 1.2, 8, 3); } return; }
    if (S.state === 'pull') { const u = clamp((S.age - S.t3) / 0.36, 0, 1); M.ps = 1 - smooth(u); M.pr = 0; M.leanTo = -0.2 * Math.sin(u * Math.PI); m.x = lerp(S.xL, S.x0, smooth(u)); m.y = lerp(S.yL, S.y0, smooth(u));
      if (u >= 1) { const n = S.n - 1; M.sl = null; if (n > 0 && !me.dead) startPestle(FX, m, { n, k: 0.8 }); else endAct(m, M); } } }
  function slamDown(FX, m, M, S) { const me = FX.me, P = FX.S.lv; S.state = 'stuck'; S.t2 = S.age; S.hold = (S.n > 1 ? 0.55 : P >= 3 ? 1.35 : 1.7) / FX.S.fast; M.stat.pestStuck++;
    const rx = me.x - S.ox, ry = me.y - S.oy, al = rx * S.d[0] + ry * S.d[1], of = Math.abs(-rx * S.d[1] + ry * S.d[0]), inside = al > -me.r * 0.6 && al < S.len + me.r * 0.6 && of < S.w / 2 + me.r * 0.5;
    if (inside && (me.dodge || me.leap)) { S.dodged = true; M.stat.slamDodged++; M.stat.slamMiss++; FX.H.text(me.x, me.y - 1.6, 'Rolled clear!', '#9CFFD8', 13); }
    else if (inside) { M.stat.slamHit++; FX.hurt(m.dmg * 1.5); FX.H.text(me.x, me.y - 1.6, 'Pounded!', DANGER, 15); const sd = -rx * S.d[1] + ry * S.d[0] >= 0 ? 1 : -1; me.push = { vx: -S.d[1] * sd * 11, vy: S.d[0] * sd * 11, t: 0.24 }; }
    else M.stat.slamMiss++;
    FX.H.sfx.crash(); FX.H.sfx.thud(); FX.H.shake(13, 0.35); dust(FX, S.bx, S.by, 2.0, 18, 0);
    for (let s = 0.8; s < S.len; s += 1.3) dust(FX, S.ox + S.d[0] * s, S.oy + S.d[1] * s, 0.7, 2, 0);
    M.cracks.push({ x: S.ox, y: S.oy, a: S.a, len: S.len, w: S.w, t: 0, life: 4.5, seed: Math.floor(Math.random() * 1e4) });
    M.craters.push({ x: S.bx, y: S.by, r: 1.5, t: 0, life: 6, seed: Math.floor(Math.random() * 1e4) }); }

  /* ---- Moon Leap: it crouches and leaps out of sight; its shadow grows on the circle it will land on ---- */
  function startLeap(FX, m) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'leap'; m.actT = 0;
    M.lp = { age: 0, crouch: 0.75 / F, rise: 0.55, show: (P >= 3 ? 1.45 : 1.7) / F, state: 'crouch', r: P >= 3 ? 4.4 : 4.0, tx: null, ty: null }; M.stat.leaps++; FX.H.sfx.hum();
    say(FX, 'leap', 'MOON LEAP', 'It leaps out of sight: its SHADOW grows where it will land. Get out, then roll through its shockwave ring', LEAPC); }
  function leapStep(FX, m, M, dt, F) { const L = M.lp, me = FX.me; if (!L) { endAct(m, M); return; } L.age += dt;
    if (L.state === 'crouch') { M.crouchTo = 1; M.hdTo = FX.angPet(m.x, m.y); M.evilTo = 1; if (Math.random() < dt * 10) { const a = Math.random() * TAU; FX.H.part({ kind: 'smoke', x: m.x + Math.cos(a) * 3, y: m.y + Math.sin(a) * 2.4, vx: Math.cos(a), vy: -0.6, drag: 0.7, life: 0.7, max: 0.7, size: 0.9, color: '#A6AAB8' }); }
      if (L.age >= L.crouch) { L.state = 'rise'; L.t0 = L.age; FX.H.sfx.whoosh(); dust(FX, m.x, m.y + 0.4, 3.2, 16, 8);
        // where it comes down: on the pet, kept off the rim and clear of its own mortar
        const p = FX.clampArena({ x: me.x, y: me.y }, 3.2), mo = mortarP(FX), dm = Math.hypot(p.x - mo.x, p.y - mo.y); if (dm < 3.6) { const k = 3.6 / (dm || 1); p.x = mo.x + (dm > 1e-3 ? (p.x - mo.x) * k : 3.6); p.y = mo.y + (dm > 1e-3 ? (p.y - mo.y) * k : 0); FX.clampArena(p, 3.2); }
        L.tx = p.x; L.ty = p.y;
        L.tele = FX.tele({ shape: 'circle', x: p.x, y: p.y, r: L.r, t: L.rise + L.show, dmg: m.dmg * 1.8, col: LEAPC, fn: s => land(FX, m, M, s) }); }
      return; }
    if (L.state === 'rise') { const u = clamp((L.age - L.t0) / L.rise, 0, 1); M.alt = 40 * u * u; if (M.alt > 2 && !m.under) FX.untarget(true);
      if (u >= 1) { L.state = 'air'; m.x = L.tx; m.y = L.ty; } return; }
    if (L.state === 'air') { const s = L.tele, left = s ? s.t - s.age : 0; M.alt = left < 0.38 ? 40 * Math.pow(Math.max(0, left) / 0.38, 2) : 40; M.hdTo = M.hd; return; }
    endAct(m, M); }
  function land(FX, m, M, s) { const L = M.lp, me = FX.me; if (!L) return; L.state = 'landed'; m.x = s.x; m.y = s.y; M.alt = 0; M.altP = 0; M.crouch = 1; M.flopV -= 6; FX.untarget(false);
    const inside = FX.inShape(s, me.x, me.y, me.r) && !me.dodge; if (inside) M.stat.leapIn++; else M.stat.leapOut++;
    FX.H.sfx.crash(); FX.H.sfx.thud(); FX.H.flash(0.08, '#FFFFFF'); dust(FX, s.x, s.y + 0.3, s.r, 30, 18);
    M.craters.push({ x: s.x, y: s.y + 0.2, r: s.r, t: 0, life: 12, seed: Math.floor(Math.random() * 1e4) });
    // a pet under it is shoved out from under its bulk
    const dx = me.x - s.x, dy = me.y - s.y, d = Math.hypot(dx, dy) || 1; if (d < 3.4) me.push = { vx: dx / d * 14, vy: dy / d * 14, t: 0.28 };
    M.waves.push({ x: s.x, y: s.y, r: s.r * 0.6, v: FX.S.lv >= 3 ? 3.9 : 3.4, w: 0.62, delay: 0.3, t: 0, hit: inside, passed: false, dodged: false }); M.stat.waves++;
    M.lp = null; stuck(FX, m, M); }
  function stuck(FX, m, M) { const first = !M.seen.stuck; M.seen.stuck = true; endAct(m, M); M.stat.stuck++;
    m.stunT = Math.max(m.stunT || 0, FX.S.lv >= 3 ? 2.9 : 3.4); M.stunKind = 'stuck'; M.stunWas = 'stuck';
    FX.H.banner('STUCK!', first ? 'Its ears are buried in the ground and it is dizzy: strike its glowing CRESCENT. Roll through the shockwave ring!' : 'Ears stuck in the ground: strike the crescent!', CRES, first ? 2.6 : 1.4, true); }
  /* the shockwave: a slow ring rolling out over the floor from where it landed; roll through it as it passes */
  function updWaves(FX, m, M, dt) { const me = FX.me;
    for (const w of M.waves) { w.t += dt; if (w.t < w.delay) continue; w.r += w.v * dt;
      if (Math.random() < dt * 30) { const a = Math.random() * TAU; FX.H.part({ kind: 'smoke', x: w.x + Math.cos(a) * w.r, y: w.y + Math.sin(a) * w.r, vx: Math.cos(a) * 1.2, vy: Math.sin(a) * 0.6 - 0.6, drag: 0.8, life: 0.6, max: 0.6, size: 0.7, color: '#B4B8C6' }); }
      const d = Math.hypot(me.x - w.x, me.y - w.y);
      if (!w.hit && !w.passed) { if (Math.abs(d - w.r) < w.w / 2 + me.r * 0.4) { if (me.dodge || me.leap) w.dodged = true; else { w.hit = true; M.stat.waveHit++; FX.hurt(m.dmg * 0.85); FX.H.text(me.x, me.y - 1.6, 'The shockwave!', DANGER, 13); me.push = { vx: (me.x - w.x) / (d || 1) * 8, vy: (me.y - w.y) / (d || 1) * 8, t: 0.2 }; } }
        else if (w.r - w.w / 2 > d + me.r * 0.4) { w.passed = true; M.stat.wavePass++; if (w.dodged) FX.H.text(me.x, me.y - 1.6, 'Through the ring!', '#9CFFD8', 13); } } }
    M.waves = M.waves.filter(w => w.r < AR + 1.5); }

  /* ---- Elixir Brew: it pounds its mortar and the elixir swells, glowing (the weak point); crack the mortar first, or
     it splashes the cone with sticky elixir ---- */
  function startBrew(FX, m) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'brew'; m.actT = 0; const mo = mortarP(FX), h = homeP(FX), away = Math.hypot(m.x - h.x, m.y - h.y) > 1.0;
    M.bw = { age: 0, pAge: 0, state: 'home', dur: (P >= 3 ? 2.3 : 2.6) / F, per: 0.52 / F, a: Math.atan2(FX.me.y - mo.y, FX.me.x - mo.x), need: P >= 3 ? 7 : 6, hits: 0, done: false, len: P >= 3 ? 10 : 9, spread: P >= 3 ? 0.6 : 0.52, ox: mo.x, oy: mo.y, last: 0 }; M.stat.brews++; FX.H.sfx.hum();
    if (!(away && startHop(FX, m, M, F, h))) { M.hop = null; M.bw.state = 'pound'; }
    say(FX, 'brew', 'ELIXIR BREW', 'It pounds its mortar and the elixir swells: STRIKE THE MORTAR to crack it, or get out of the cone before it splashes', ELIXC); }
  function brewStep(FX, m, M, dt) { const W = M.bw, me = FX.me; if (!W) { endAct(m, M); return; } W.age += dt; const mo = mortarP(FX);
    if (W.state === 'home') { if (M.hop) { hopStep(FX, m, M, dt); return; } W.state = 'pound'; return; }
    W.pAge += dt; const u = W.pAge / W.dur; M.hdTo = Math.atan2(mo.y - m.y, mo.x - m.x) - PSIDE * 0.5; M.evilTo = 1;
    if (u < 0.62) W.a = turnTo(W.a, Math.atan2(me.y - mo.y, me.x - mo.x), dt, 0.9);
    // the pestle rises and pounds into the mortar, again and again; the elixir rises with each blow
    const ph = (W.pAge % W.per) / W.per; M.pHold = true; M.pT = [mo.x, mo.y, MH - 0.2]; M.pr = ph < 0.6 ? smooth(ph / 0.6) * 0.8 : 0.8 * (1 - smooth((ph - 0.6) / 0.14)); M.ps = ph < 0.6 ? 0 : smooth((ph - 0.6) / 0.14); M.leanTo = M.ps * 0.3; M.pAtM = true;
    const cyc = Math.floor(W.pAge / W.per + 0.26); if (cyc > W.last) { W.last = cyc; splish(FX, M, 6); FX.H.sfx.thud(); FX.H.shake(3, 0.1); M.flopV -= 2; }
    M.elixTo = 0.25 + 0.75 * smooth(u / 0.9);
    if (W.pAge >= W.dur && !W.done) splash(FX, m, M); }
  function splash(FX, m, M) { const W = M.bw, me = FX.me; W.done = true; const s = { shape: 'cone', x: W.ox, y: W.oy, a: W.a, len: W.len, spread: W.spread };
    if (FX.inShape(s, me.x, me.y, me.r) && !me.dodge) { M.stat.splashHit++; FX.hurt(m.dmg * 1.2); FX.H.text(me.x, me.y - 1.6, 'Sticky elixir!', DANGER, 13); }
    FX.hz(Object.assign({}, s, { life: 3.4, slow: true, dps: m.dmg * 0.2, tick: 0.4, col: ELIXC, seed: Math.floor(Math.random() * 1e4), draw: drawElixir }));
    for (let i = 0; i < 30; i++) { const a = W.a + FX.rnd(-W.spread, W.spread) * 0.9, d = FX.rnd(0.8, W.len * 0.95), T = 0.5 + d * 0.03; FX.H.part({ kind: 'spark', x: W.ox + Math.cos(a) * 0.6, y: W.oy - MH + Math.sin(a) * 0.4, vx: Math.cos(a) * d / T, vy: Math.sin(a) * d / T - 5, g: 18, drag: 0.1, life: T * 1.1, max: T * 1.1, size: 3 + Math.random() * 3, color: i % 3 ? ELIX : ELIX_HI }); }
    FX.H.sfx.splash ? FX.H.sfx.splash() : FX.H.sfx.whoosh(); FX.H.sfx.thud(); FX.H.shake(8, 0.35); M.elix = 0.1; M.swell = 0; M.bw = null; M.pAtM = false; endAct(m, M); m.actT = -0.4; }
  function crackMortar(FX, m, M) { const W = M.bw; if (!W || W.done) return; W.done = true; M.bw = null; M.pAtM = false; M.stat.cracks++; const mo = mortarP(FX), first = !M.seen.crack; M.seen.crack = true;
    endAct(m, M); m.stunT = Math.max(m.stunT || 0, 3.6); M.stunKind = 'cracked'; M.stunWas = 'cracked'; M.crack = 1; M.swell = 0; M.recoil = 1; M.ps = 0; M.pr = 0;
    FX.H.sparks(mo.x, mo.y - MH, ELIX, 22, 6); FX.H.ring(mo.x, mo.y, 0.3, 3.0, 0.45, ELIXC, 0.3); FX.H.shake(10, 0.3); FX.H.sfx.crash(); FX.H.sfx.crack();
    for (let i = 0; i < 14; i++) { const a = Math.random() * TAU; FX.H.part({ kind: 'smoke', x: mo.x, y: mo.y - MH * 0.5, vx: Math.cos(a) * 3, vy: Math.sin(a) * 1.5 - 1, drag: 1.2, life: 0.9, max: 0.9, size: 1.0, color: '#C8CCD8' }); }
    FX.H.hitMon(m, FX.S.barHP * 0.02, { flat: true, pierce: true });
    FX.H.banner('CRACKED!', first ? 'Its mortar cracked under your blows and the brew is spoiled: it reels. Strike its CRESCENT!' : 'The mortar cracked: strike the crescent!', ELIXC, first ? 2.4 : 1.4, true); }

  /* ---- Mochi Shake: it pounds the ground; moon-mochi fall from the rim onto shown circles and roll along shown lanes ---- */
  function startMochi(FX, m) { const M = FX.mem, F = FX.S.fast, P = FX.S.lv; m.act = 'mochi'; m.actT = 0;
    M.mc = { age: 0, p1: 0.62 / F, p2: 1.1 / F, n: P >= 3 ? 5 : 3, spawned: false, two: false }; M.stat.shakes++; FX.H.sfx.hum();
    say(FX, 'mochi', 'MOCHI SHAKE', 'It pounds the crater: moon-mochi drop from the rim onto the shown circles and ROLL down their lanes. Get out of the lanes', MOCHIC); }
  function mochiStep(FX, m, M, dt) { const S = M.mc; if (!S) { endAct(m, M); return; } S.age += dt; M.hdTo = FX.angPet(m.x, m.y); M.evilTo = 1;
    const P = pose(m, M), g = P.Wb(4.3, PSIDE * 0.7, BR); M.pHold = true; M.pT = [g[0], g[1], BR];
    // it heaves the pestle up and brings it down on the ground before it, twice
    if (S.age < S.p1) { const u = S.age / S.p1; M.pr = smooth(u / 0.75); M.ps = u > 0.8 ? smooth((u - 0.8) / 0.2) : 0; M.leanTo = M.ps * 0.45; }
    else if (!S.spawned) { S.spawned = true; M.ps = 1; M.pr = 0; pound(FX, m, M, g); spawnMochi(FX, m, M, S.n); }
    else if (S.age < S.p2) { const u = (S.age - S.p1) / (S.p2 - S.p1); M.pr = u < 0.15 ? 0 : smooth((u - 0.15) / 0.55); M.ps = u < 0.15 ? 1 : u > 0.82 ? smooth((u - 0.82) / 0.18) : 1 - smooth((u - 0.15) / 0.3); M.leanTo = M.ps * 0.45; }
    else if (!S.two) { S.two = true; M.ps = 1; M.pr = 0; pound(FX, m, M, g); }
    else { M.ps = Math.max(0, 1 - (S.age - S.p2) * 3); M.pr = 0; }
    if (S.two && !M.mochi.length && S.age > S.p2 + 0.5) { M.mc = null; endAct(m, M); } }
  function pound(FX, m, M, g) { M.crouch = 0.8; M.recoil = 0.2; M.flopV -= 4; FX.H.sfx.crash(); FX.H.sfx.thud(); FX.H.shake(12, 0.4); dust(FX, g[0], g[1], 1.8, 12, 0); }
  // lanes for the mochi: the first through the pet (whatever it does), the others crossing the crater elsewhere; none
  // through the rabbit or its mortar if that can be helped
  function spawnMochi(FX, m, M, n) { const C = FX.C, me = FX.me, F = FX.S.fast, P = FX.S.lv, Rl = AR - 0.9, lanes = [], mo = mortarP(FX);
    const laneAt = (a, off) => { const d = [Math.cos(a), Math.sin(a)], e = [-d[1], d[0]], hc = Math.sqrt(Math.max(0, Rl * Rl - off * off)); const S = [C.x + e[0] * off - d[0] * hc, C.y + e[1] * off - d[1] * hc], E = [C.x + e[0] * off + d[0] * hc, C.y + e[1] * off + d[1] * hc]; return { a, d, e, off, S, E, len: hc * 2, hc, perp: (x, y) => Math.abs((x - S[0]) * e[0] + (y - S[1]) * e[1]) }; };
    for (let i = 0; i < n; i++) { let best = null;
      for (let k = 0; k < 400 && !best; k++) { const relax = k > 150, a = Math.random() * TAU, e = [-Math.sin(a), Math.cos(a)];
        const off = i === 0 ? (me.x - C.x) * e[0] + (me.y - C.y) * e[1] : FX.rnd(-Rl * 0.75, Rl * 0.75);
        if (Math.abs(off) > Rl - 2.2) continue; const L = laneAt(a, off); if (L.hc < 4.5) continue;
        if (L.perp(m.x, m.y) < (k > 280 ? 3.4 : 4.0)) continue;   // never through the rabbit
        if (L.perp(mo.x, mo.y) < MR + 1.1 && !(relax && i === 0)) continue;   // nor its mortar
        if (i > 0 && L.perp(me.x, me.y) < (relax ? 2.4 : 2.8)) continue;   // only one lane over the pet
        if (Math.hypot(me.x - L.S[0], me.y - L.S[1]) < 3) continue;   // not dropped on its head
        if (lanes.some(Q => { const par = Math.abs(Math.sin(Q.a - a)) < 0.4; return par && Math.abs((L.S[0] - Q.S[0]) * Q.e[0] + (L.S[1] - Q.S[1]) * Q.e[1]) < (relax ? 2.1 : 2.8); })) continue;
        best = L; }
      // the pet hugging the rabbit (no lane through it clears the rabbit): of all the lanes through the pet, the one
      // that keeps farthest from the rabbit (it may brush its fur), so the pet's lane is always there
      if (!best && i === 0) { let sc = -1; for (let k = 0; k < 72; k++) { const a = k / 72 * TAU, e = [-Math.sin(a), Math.cos(a)], off = (me.x - C.x) * e[0] + (me.y - C.y) * e[1]; if (Math.abs(off) > Rl - 1.0) continue; const L = laneAt(a, off); if (L.hc < 3) continue; const s = Math.min(4, L.perp(m.x, m.y)) + (Math.hypot(me.x - L.S[0], me.y - L.S[1]) > 3 ? 1 : 0); if (s > sc) { sc = s; best = L; } } }
      if (!best) continue; lanes.push(best);
      M.mochi.push(Object.assign({}, best, { x: best.S[0], y: best.S[1], s: 0, r: 0.85 + Math.random() * 0.2, t: 0, fall: (1.1 + i * 0.3) / F, z: 9, state: 'fall', hit: false, spin: Math.random() * TAU, v: (P >= 3 ? 7.2 : 6.2) * F, seed: Math.floor(Math.random() * 1e4), rt: 0, sq: 0 })); M.stat.mochi++; } }
  function updMochi(FX, m, M, dt) { const me = FX.me;
    for (const R of M.mochi) { R.t += dt; R.sq = decay(R.sq, dt, 3);
      if (R.state === 'fall') { const u = clamp(R.t / R.fall, 0, 1); R.z = 9 * (1 - u * u);
        if (u >= 1) { R.state = 'roll'; R.z = 0; R.rt = 0; R.sq = 1; dust(FX, R.x, R.y, 1.4, 10, 5); FX.H.sfx.thud();
          if (Math.hypot(me.x - R.x, me.y - R.y) < R.r + 0.6 + me.r * 0.5 && !me.dodge) { M.stat.mochiLand++; FX.hurt(m.dmg * 0.9); } }
        continue; }
      if (R.state !== 'roll') continue;
      R.rt += dt; R.s += R.v * dt; R.x = R.S[0] + R.d[0] * R.s; R.y = R.S[1] + R.d[1] * R.s; R.z = Math.abs(Math.sin(R.rt * 9)) * 0.35 * Math.max(0, 1 - R.rt * 1.3); R.spin += R.v * dt / R.r;
      M.stat.mochiDev = Math.max(M.stat.mochiDev, Math.abs((R.x - R.S[0]) * R.e[0] + (R.y - R.S[1]) * R.e[1]));
      if (Math.random() < dt * 12) FX.H.part({ kind: 'smoke', x: R.x - R.d[0] * R.r, y: R.y - R.d[1] * R.r + 0.3, vx: -R.d[0] * 0.8 + FX.rnd(-0.4, 0.4), vy: -R.d[1] * 0.8 - 0.4, drag: 0.8, life: 0.7, max: 0.7, size: 0.8, color: '#C8CAD4' });
      if (!R.hit && Math.hypot(me.x - R.x, me.y - R.y) < R.r + me.r * 0.6) { if (me.dodge || me.leap) R.dodged = true; else { R.hit = true; M.stat.mochiHit++; FX.hurt(m.dmg * 1.1); FX.H.text(me.x, me.y - 1.6, 'Squashed!', DANGER, 14); const sd = (me.x - R.x) * R.e[0] + (me.y - R.y) * R.e[1] >= 0 ? 1 : -1; me.push = { vx: R.e[0] * sd * 10 + R.d[0] * 4, vy: R.e[1] * sd * 10 + R.d[1] * 4, t: 0.22 }; } }
      if (R.s >= R.len) { R.state = 'gone'; M.stat.mochiDone++; dust(FX, R.x, R.y, 1.3, 10, 2); } }
    M.mochi = M.mochi.filter(R => R.state !== 'gone'); }

  /* ---- The Warren (half health): curled up behind its ears, out of reach, it lets thirty moon bunnies out of its
     mortar; clear them and it is EXPOSED ---- */
  function startWarren(FX, m) { const M = FX.mem, h = homeP(FX); m.act = 'warren'; m.actT = 0; FX.untarget(true);
    M.wr = { t: 0, total: WARREN_N, spawned: 0, killed: 0, list: [], acc: 0.4, T: 60, maxLive: 0, state: 'pour' }; M.stat.warren++;
    if (Math.hypot(m.x - h.x, m.y - h.y) > 1.0 && startHop(FX, m, M, 1, h)) M.wr.state = 'home';
    FX.H.sfx.crash(); FX.H.shake(12, 0.6); FX.H.ring(m.x, m.y, 1, 6, 0.6, SEALC, 0.35); }
  function warrenStep(FX, m, M, dt) { const B = M.wr; if (!B) { endAct(m, M); return; } m.under = true; m.noTouch = true; B.t += dt; M.hdTo = FX.angPet(m.x, m.y);
    if (B.state === 'home') { if (M.hop) { hopStep(FX, m, M, dt); return; } B.state = 'pour'; }
    B.list = B.list.filter(q => { if (q.dead) { B.killed++; M.stat.killed++; return false; } return true; });
    B.acc = Math.min(1.2, B.acc + dt);
    while (B.acc >= 0.5 && B.spawned < B.total && B.list.length < WARREN_CAP) { B.acc -= 0.5; const q = pour(FX, m, M, true); B.spawned++; if (q) B.list.push(q); else { B.killed++; M.stat.killed++; } }
    B.maxLive = Math.max(B.maxLive, B.list.length);
    if ((B.spawned >= B.total && !B.list.length) || B.t > B.T) expose(FX, m, M); }
  function expose(FX, m, M) { const B = M.wr, all = B && B.killed >= B.total; M.wr = null; FX.untarget(false); endAct(m, M); M.stat.exposed++; M.hop = null; M.alt = 0;
    m.stunT = Math.max(m.stunT || 0, all ? 7 : 4); M.stunKind = 'exposed'; M.stunWas = 'exposed'; M.recoil = 1;
    FX.H.sfx.crash(); FX.H.shake(12, 0.5); FX.H.sparks(m.x, m.y - 3, SEALC, 30, 7); FX.H.ring(m.x, m.y, 1, 6, 0.6, SEALC, 0.35);
    FX.H.banner('EXPOSED!', all ? 'Its warren is gone and it uncurls, dizzy: strike its CRESCENT, hard!' : 'It uncurls: strike its crescent!', CRES, 2.6, true); }
  // one of its warren: it hops out of the mortar to a spot on the floor
  function pour(FX, m, M, horde) { const mo = mortarP(FX), me = FX.me, a0 = Math.atan2(me.y - mo.y, me.x - mo.x); let p = null;
    for (let k = 0; k < 14 && !p; k++) { const a = a0 + FX.rnd(-1.4, 1.4), d = FX.rnd(3.0, 7.0), q = { x: mo.x + Math.cos(a) * d, y: mo.y + Math.sin(a) * d }; if (FX.inArena(q.x, q.y, 1.6) && Math.hypot(q.x - me.x, q.y - me.y) > 2.6 && Math.hypot(q.x - m.x, q.y - m.y) > 3.4) p = q; }
    if (!p) p = FX.clampArena({ x: mo.x + Math.cos(a0) * 3.5, y: mo.y + Math.sin(a0) * 3.5 }, 1.6);
    const q = FX.minion('moonbun', p.x, p.y, {}); if (!q) return null;
    q.launch = { t: 0, dur: 0.55 + Math.random() * 0.25, x0: mo.x, y0: mo.y, z0: MH + 0.2, x1: q.x, y1: q.y, h: 1.2 + Math.random() * 1.2 }; q.x = mo.x; q.y = mo.y; q.z = MH; q.under = true; q.cd = 0.6 + Math.random() * 0.6;
    if (horde) { q.horde = true; q.hp = q.maxhp = Math.max(40, Math.round(q.maxhp * 0.5)); q.xp = Math.max(1, Math.round((q.xp || 4) * 0.4)); }
    M.stat.poured++; M.elix = Math.max(M.elix, 0.5); FX.H.sparks(mo.x, mo.y - MH, MOON_HI, 4, 3); return q; }

  /* ---------- the body: where everything is ---------- */
  function pose(m, M) {
    const hd = M.hd == null ? Math.PI / 2 : M.hd, rc = M.recoil || 0, bt = M.bt || 0, cr = M.crouch || 0, alt = M.alt || 0, sk = M.stagK || 0, cu = M.curl || 0, ln = M.lean || 0, cf = Math.cos(hd), sf = Math.sin(hd);
    // squashed in a crouch, stretched in a leap, swelling with each breath, rounder curled up, slumped when staggered
    const st = alt > 0.6 ? clamp(Math.abs(M.altV || 0) / 22, 0, 1) : 0, br = Math.sin(bt * 1.9) * 0.024 * (1 - st);
    const kh = 1 - cr * 0.2 - sk * 0.06 + br + st * 0.22 - rc * 0.05 - cu * 0.3, kv = 1 + cr * 0.08 + sk * 0.04 - st * 0.1 + br * 0.5 + rc * 0.03 + cu * 0.06, ku = 1 + cr * 0.05 - st * 0.08 + cu * 0.12;
    const B = { x: m.x - cf * rc * 0.35, y: m.y - sf * rc * 0.35 };
    const W0 = RiftFiend.frame(B, hd, { z: alt, pitch: -ln * 0.3 + rc * 0.06 - sk * 0.05 });
    const Wb = (u, v, h) => W0(u * ku, v * kv, h * kh);
    // the head: carried on the body (not squashed with it); it turns ahead of the body (look), nods (down when
    // staggered or curled), tilts slyly; curled, it tucks down into its fur
    const yw = M.look || 0, pt = NOD * (1 - cu) + (M.nod || 0) - sk * 0.32 + rc * 0.14 - cr * 0.12 - cu * 0.25 + ln * 0.1, rl = (M.tilt || 0) * (1 - cu), cy = Math.cos(yw), sy = Math.sin(yw), cp = Math.cos(pt), sp = Math.sin(pt), cl = Math.cos(rl), sl = Math.sin(rl);
    const hcU = HEAD.u * ku + ln * 0.35 + cu * 0.45, hcH = HEAD.h * kh + cu * 0.45 - sk * 0.2;
    const Wh = (u, v, h) => { const du = u - HEAD.u, dh = h - HEAD.h, v1 = v * cl - dh * sl, h1 = v * sl + dh * cl, u2 = du * cp - h1 * sp, h2 = du * sp + h1 * cp, u3 = u2 * cy - v1 * sy, v3 = u2 * sy + v1 * cy; return W0(hcU + u3, v3, hcH + h2); };
    const H0 = Wh(HEAD.u, 0, HEAD.h), hdir = (du, dv, dh) => norm3(sub3(Wh(HEAD.u + du, dv, HEAD.h + dh), H0));
    // a point on the head's surface at (yaw, elevation), its outward normal, and a frame for painting on it
    const surf = (al, el, lift) => { const s = [Math.cos(el) * Math.cos(al), Math.cos(el) * Math.sin(al), Math.sin(el)], k = 1 + (lift || 0); const p = Wh(HEAD.u + s[0] * HEAD.a * k, s[1] * HEAD.b * k, HEAD.h + s[2] * HEAD.c * k), n = hdir(s[0] / HEAD.a, s[1] / HEAD.b, s[2] / HEAD.c);
      const vh = hdir(0, 1, 0), mv = [-vh[0], -vh[1], -vh[2]], t = dot3(n, mv), e1 = norm3([mv[0] - n[0] * t, mv[1] - n[1] * t, mv[2] - n[2] * t]), e2 = cross3(n, e1); return { p, n, e1, e2, vis: (n[1] + n[2]) * 0.7071 }; };
    const cres = surf(F_CRES[0], F_CRES[1]).p;
    return { hd, cf, sf, B, W0, Wb, Wh, H0, hdir, surf, alt, ku, kv, kh, st, cres, hdH: hd + yw };
  }
  // the hit proxies: the body, the head, the two haunches
  function bodyParts(m, M) { const P = pose(m, M); return [hit('bd', P.Wb(BODY.u, 0, BODY.h + 0.3), 2.3, m), hit('hd', P.H0, 1.7, m), hit('hl', P.Wb(HAUNCH.u, HAUNCH.v, HAUNCH.h), 1.0, m), hit('hr', P.Wb(HAUNCH.u, -HAUNCH.v, HAUNCH.h), 1.0, m)]; }
  /* the pestle: held two-handed on its v+ side, resting over its shoulder; raised overhead; brought down on a target (a
     lane's end, the mortar, the ground before it), blended by M.pr (raise) and M.ps (strike) */
  function pestle(m, M, P) { const sd = PSIDE, dir = (u, v, h) => norm3(sub3(P.W0(u, v, h), P.W0(0, 0, 0)));
    const gR = P.Wb(1.3, sd * 1.15, 2.05), hR = add3(gR, dir(-0.3, sd * 0.62, 1), PL), gU = P.Wb(0.45, sd * 1.9, 4.2), hU = add3(gU, dir(-0.5, -sd * 0.4, 1), PL);
    const pr = clamp(M.pr || 0, 0, 1), ps = clamp(M.ps || 0, 0, 1); let grip = lerp3(gR, gU, pr), hp = lerp3(hR, hU, pr);
    if (ps > 0 && M.pT) { const T0 = M.pT, sh = P.Wb(0.8, sd * 1.65, 2.5), hz = [sh[0] - T0[0], sh[1] - T0[1], 0], hl = Math.hypot(hz[0], hz[1]) || 1, hd = Math.min(hl, PL * 0.93), gS = [T0[0] + hz[0] / hl * hd, T0[1] + hz[1] / hl * hd, T0[2] + Math.sqrt(PL * PL - hd * hd)]; grip = lerp3(grip, gS, ps); hp = lerp3(hp, T0, ps); }
    const d = norm3(sub3(hp, grip)), head = add3(grip, d, PL); let ax = cross3(d, [0, 0, 1]); ax = len3(ax) > 0.25 ? norm3(ax) : dir(0, 1, 0); if (dot3(ax, dir(0, 1, 0)) < 0) ax = [-ax[0], -ax[1], -ax[2]];
    return { grip, head, d, ax }; }

  // the other paw: on the handle below the first when it can reach, else curled before its belly (rubbing gleefully)
  function offPaw(P, M, S, Pp) { const on = add3(Pp.grip, Pp.d, -0.5), d = len3(sub3(on, S)), k = smooth((d - 2.2) / 0.7), bt = M.bt || 0, free = P.Wb(1.35, -PSIDE * 0.75, 2.2 + Math.sin(bt * 6) * 0.06 * (M.evil || 0)); return lerp3(on, free, k); }
  /* ---------- painting Tsukimochi ---------- */
  function hull(P) { const pts = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  /* a fluffy outline: the screen ellipse of an ellipsoid with soft tufts along its rim where mask(screen angle) says
     (0 right, PI/2 down) */
  function fluff(p, ex, ey, rot, n, amp, mask, seed) { const R = mulberry32(seed || 1), out = [], cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i < n; i++) { const th = i / n * TAU, x0 = Math.cos(th) * ex, y0 = Math.sin(th) * ey, x = x0 * cr - y0 * sr, y = x0 * sr + y0 * cr, w = mask ? mask(Math.atan2(y, x)) : 1, k = i % 2 ? 1 + amp * w * (0.7 + R() * 0.6) : 1 - amp * w * 0.2;
      out.push([p[0] + x * k, p[1] + y * k]); }
    return out; }
  // a fluffy toon ellipsoid
  function furBall(c, P3, T, th, g, A, o, fl) { const [ex, ey, rot] = K.ell3(A[0], A[1], A[2], th), p = P3(g[0], g[1], g[2]);
    const pts = fluff(p, ex * T, ey * T, rot, fl ? fl.n || 30 : 30, fl ? fl.amp : 0.05, fl && fl.mask, fl && fl.seed);
    TN.shape(c, TN.blob(pts), Object.assign({ r: Math.max(ex, ey) * T, specAt: [p[0] - ex * T * 0.35, p[1] - ey * T * 0.45], force: true }, FURS, o || {})); return { p, ex: ex * T, ey: ey * T, rot }; }
  // paint in a surface's own plane (units of metres, x along e1, y along e2), so a feature turns and foreshortens with it
  function onPlane(c, P3, F, fn) { const o = P3(F.p[0], F.p[1], F.p[2]), a = P3(F.p[0] + F.e1[0], F.p[1] + F.e1[1], F.p[2] + F.e1[2]), b = P3(F.p[0] + F.e2[0], F.p[1] + F.e2[1], F.p[2] + F.e2[2]);
    const det = (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); if (Math.abs(det) < 1e-3) return;
    c.save(); if (F.vis != null) c.globalAlpha *= clamp((F.vis - 0.04) * 7, 0, 1); c.transform(a[0] - o[0], a[1] - o[1], b[0] - o[0], b[1] - o[1], o[0], o[1]); fn(c); c.restore(); }
  function drawRabbit(c, FX, m, X, Y, T, t) {
    const M = FX.mem || {}, P = pose(m, M), P3 = TN.cam(X, Y, T, m), lw = Math.max(1.3, T * 0.06), bt = M.bt || t, alt = P.alt, mo = mortarP(FX), parts = [];
    // its mortar stands on the floor whatever the rabbit does
    const mAt = [mo.x, mo.y, 0];
    parts.push({ at: mAt, draw: () => drawMortar(c, FX, M, P3, T, lw, mo, bt) });
    // its shadow on the floor (gone once it is high)
    const sa = clamp(1 - Math.max(0, alt) / 4, 0, 1); if (sa > 0.02) { const g0 = P3(P.B.x, P.B.y, 0), k = 1 / (1 + Math.max(0, alt) * 0.15); K.shade(c, g0[0] + T * 0.2, g0[1] + T * 0.4, T * 3.9 * k, T * 2.3 * k, 0.55 * sa, '#141626'); }
    if (alt <= 26) {
      const tint = M.seal || 0, fw = [P.cf, P.sf], hc = P.H0, Pp = pestle(m, M, P);
      const at = (p, du) => [p[0] + fw[0] * (du || 0), p[1] + fw[1] * (du || 0), p[2]];
      parts.push({ at: at(P.Wb(TAIL.u, 0, TAIL.h), -0.3), draw: () => drawTail(c, P, P3, T, lw, M, tint) });
      for (const sd of [-1, 1]) {
        const hz = P.Wb(HAUNCH.u, sd * HAUNCH.v, HAUNCH.h), ft = P.Wb(FOOT.u, sd * FOOT.v, FOOT.h);
        parts.push({ at: at(hz, 0.9), draw: () => drawHaunch(c, P, P3, T, lw, sd, M, tint) });
        parts.push({ at: at(ft, 0.6), draw: () => drawFoot(c, P, P3, T, lw, sd, M, tint) });
        const er = P.Wh(HEAD.u - 0.1, sd * 0.5, HEAD.h + 1.05); parts.push({ at: (M.curl || 0) > 0.4 ? at(hc, 1.5) : at([er[0], er[1], hc[2]], -0.75), draw: () => drawEar(c, FX, P, P3, T, lw, sd, M, bt, tint) });
        parts.push({ at: at(hc, -0.4), draw: () => drawCheek(c, P, P3, T, lw, sd, M, tint) });
        const S = P.Wb(SHOULDER.u, sd * SHOULDER.v, SHOULDER.h), paw = sd === PSIDE ? Pp.grip : offPaw(P, M, S, Pp);
        parts.push({ at: [paw[0], paw[1], paw[2] + 0.4], draw: () => drawArm(c, P, P3, T, lw, sd, S, paw, Pp, M, tint) }); }
      const bc = P.Wb(BODY.u, 0, BODY.h);
      parts.push({ at: at(bc, 0.2), draw: () => drawBody(c, P, P3, T, lw, M, tint) });
      parts.push({ at: [hc[0], hc[1], hc[2]], draw: () => drawHead(c, FX, P, P3, T, lw, M, bt, tint) });
      // the pestle: the handle by its middle, the drum at its end (in the mortar, it is drawn over the bowl, under the
      // mortar's front lip)
      const pm = lerp3(Pp.grip, Pp.head, 0.55);
      parts.push({ at: M.pAtM && M.ps > 0.3 ? [mo.x, mo.y + 0.05, 0.2] : [pm[0], pm[1], pm[2]], draw: () => drawPestle(c, P3, T, lw, Pp, M) });
      if (M.pAtM && M.ps > 0.3) parts.push({ at: [mo.x, mo.y + 0.12, 0.2], draw: () => drawMortarLip(c, M, P3, T, lw, mo) });
    }
    sorted(parts).forEach(p => p.draw());
    if (alt > 26) return;
    // curled in the warren: a moonstone sheen over its fur, soft
    const tint = M.seal || 0;
    if (tint > 0.02) { const q = P3(...P.Wb(BODY.u + 0.6, 0, BODY.h + 0.8)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = tint * (0.16 + 0.06 * Math.sin(bt * 3)); blitSized(c, glowSprite(SEALC), q[0] - T * 4.2, q[1] - T * 3.8, T * 8.4, T * 7.6); c.restore();
      const R = mulberry32(Math.floor(bt * 3)); for (let i = 0; i < 5; i++) { const a = R() * TAU, r = Math.sqrt(R()), p = P3(...P.Wb(BODY.u + Math.cos(a) * r * 1.5, Math.sin(a) * r * 1.8, BODY.h + BODY.c * (1 - r * 0.5))); TN.twinkle(c, p[0], p[1], T * (0.12 + R() * 0.12), '#FFFFFF', tint * (0.5 + 0.5 * Math.sin(bt * 7 + i))); } }
    // dizzy: little stars and moons circling over its head
    if ((M.dizzy || 0) > 0.4 && m.stunT > 0) { const q = P3(...add3(P.H0, [0, 0, HEAD.c + 0.9])); for (let i = 0; i < 4; i++) { const a = bt * 3.2 + i * TAU / 4, x = q[0] + Math.cos(a) * T * 1.4, y = q[1] + Math.sin(a) * T * 0.35; if (i % 2) TN.twinkle(c, x, y, T * 0.24, '#FFFFFF', 0.95); else { c.fillStyle = CRES; c.strokeStyle = INK; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.arc(x, y, T * 0.18, 0.5, 0.5 + TAU); c.arc(x + T * 0.08, y - T * 0.05, T * 0.14, 0.5 + TAU, 0.5, true); c.fill('evenodd'); } } } }
  // the body: a great round sitting rabbit, snow-white, fluffy at its flanks and its bib
  function drawBody(c, P, P3, T, lw, M, tint) { const A = [BODY.a * P.ku, BODY.b * P.kv, BODY.c * P.kh], g = P.Wb(BODY.u, 0, BODY.h), sk = furStyle(tint);
    furBall(c, P3, T, P.hd, g, A, Object.assign({ lw: lw * 1.2, d1: 0.07, d2: 0.17, spec: 0.22, specR: 0.2, inner: gc => {
      // soft occlusion under the chin and along the ground, a pale bib of fluff on its chest
      const ch = P3(...P.Wb(HEAD.u + 0.2, 0, HEAD.h * P.kh - HEAD.c * 0.85)), gb = P3(...P.Wb(BODY.u, 0, 0.1));
      K.shade(gc, ch[0], ch[1] + T * 0.3, T * 1.6, T * 0.75, 0.32, FUR_AO); K.shade(gc, gb[0], gb[1] + T * 0.2, T * 2.4, T * 0.8, 0.3, FUR_AO);
      { const q = P3(...P.Wb(BODY.u + BODY.a * 0.78, 0, BODY.h + 0.35)), w = T * 1.15, h = T * 1.05; const pts = fluff([q[0], q[1] + h * 0.1], w, h, 0, 18, 0.08, ph => ph > 0.3 && ph < 2.8 ? 1 : 0, 9);
        gc.save(); gc.globalAlpha = 0.75 * clamp(0.3 + Math.sin(P.hd) * 0.9, 0, 1); gc.beginPath(); TN.blob(pts)(gc); gc.fillStyle = '#FFFFFF'; gc.fill(); gc.globalAlpha *= 0.5; gc.strokeStyle = rgba(FUR_SH, 0.8); gc.lineWidth = Math.max(1, lw * 0.5); gc.stroke(); gc.restore(); } } }, sk), { amp: 0.03, n: 44, mask: ph => Math.sin(ph) > 0.35 ? 1 : 0, seed: 3 }); }
  function furStyle(tint) { return tint > 0.01 ? { col: mix(FUR, SEALC, tint * 0.35), shade: mix(FUR_SH, '#9AB2E0', tint * 0.4), shade2: mix(FUR_SH2, '#8AA2D4', tint * 0.4) } : {}; }
  function drawHaunch(c, P, P3, T, lw, sd, M, tint) { const g = P.Wb(HAUNCH.u, sd * HAUNCH.v, HAUNCH.h); furBall(c, P3, T, P.hd + sd * 0.3, g, [HAUNCH.a * P.ku, HAUNCH.b, HAUNCH.c * P.kh], Object.assign({ lw: lw * 1.1, d1: 0.08, d2: 0.16, spec: 0.2 }, furStyle(tint)), { amp: 0.05, n: 24, seed: 5 + sd, mask: ph => Math.cos(ph) * -sd * Math.cos(P.hd) > -0.3 ? 1 : 0.3 }); }
  // a long hind foot, flat on the floor, two toe lines at its front
  function drawFoot(c, P, P3, T, lw, sd, M, tint) { const g = P.Wb(FOOT.u, sd * FOOT.v, FOOT.h), air = P.alt > 0.6; if (air) g[2] = P.alt - 0.15;
    const e = TN.ellipsoid(c, P3, P.hd + sd * 0.12, g, [FOOT.a, FOOT.b, FOOT.c], Object.assign({ T, lw, d1: 0.1, d2: 0.2, spec: 0.3, force: true }, FURS, furStyle(tint)));
    const tip = P3(...P.Wb(FOOT.u + FOOT.a * 0.85, sd * FOOT.v, FOOT.h + 0.05)); c.strokeStyle = rgba(INK, 0.7); c.lineWidth = Math.max(1, lw * 0.6); c.lineCap = 'round';
    for (const k of [-1, 1]) { const q = P3(...P.Wb(FOOT.u + FOOT.a * 0.95, sd * FOOT.v + k * 0.14, FOOT.h + 0.04)); c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[0] + (tip[0] - q[0]) * 0.5 - P.cf * T * 0.15, q[1] + (tip[1] - q[1]) * 0.5 - T * 0.1); c.stroke(); } void e; }
  function drawTail(c, P, P3, T, lw, M, tint) { const g = P.Wb(TAIL.u, 0, TAIL.h + Math.sin((M.bt || 0) * 5) * 0.03); furBall(c, P3, T, P.hd, g, [TAIL.r, TAIL.r, TAIL.r], Object.assign({ d1: 0.1, d2: 0.2, spec: 0.2 }, furStyle(tint)), { amp: 0.16, n: 18, seed: 11 }); }
  /* a fluffy cheek tuft sticking out at the side of its face: three pointed locks sweeping out and down */
  function drawCheek(c, P, P3, T, lw, sd, M, tint) { const q = P3(...P.Wh(HEAD.u + 0.3, sd * 1.42, HEAD.h - 0.42)), o = P3(...P.Wh(HEAD.u + 0.3, sd * 2.4, HEAD.h - 0.8)); let dx = o[0] - q[0], dy = o[1] - q[1]; const L = Math.hypot(dx, dy); if (L < T * 0.25) return; dx /= L; dy /= L;
    let nx = -dy, ny = dx; if (ny > 0) { nx = -nx; ny = -ny; } const s = T * 0.62 * clamp(L / T, 0.4, 1) * (1 - (M.curl || 0) * 0.4), at = (a, b) => [q[0] + dx * a * s + nx * b * s, q[1] + dy * a * s + ny * b * s];
    const seq = [[-0.35, 0.62], [0.35, 0.6], [1.2, 0.46], [0.66, 0.16], [1.38, -0.1], [0.62, -0.36], [1.08, -0.68], [0.15, -0.74], [-0.4, -0.3]].map(([a, b]) => at(a, b));
    const path = g => { g.moveTo(seq[0][0], seq[0][1]); for (let i = 1; i <= seq.length; i++) { const a = seq[i - 1], b = seq[i % seq.length], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, ex = b[0] - a[0], ey = b[1] - a[1], k = 0.14; g.quadraticCurveTo(mx - ey * k, my + ex * k, b[0], b[1]); } g.closePath(); };
    TN.shape(c, path, Object.assign({ r: s, d1: 0.1, d2: 0.16, spec: false, force: true, lw }, FURS, furStyle(tint))); }
  // a short furry arm from the shoulder to a round paw on the pestle's handle
  function drawArm(c, P, P3, T, lw, sd, S, paw, Pp, M, tint) { const pr = w => P3(w[0], w[1], w[2]), mid = lerp3(S, paw, 0.5), side = norm3(sub3(P.Wb(0, sd, 0), P.Wb(0, 0, 0))), E = add3(mid, side, 0.3);
    // (the upper arm is lost in its fur: the forearm comes out of the fluff of its chest)
    // (the far arm, reaching across its chest, is all but hidden in its fluff: only its paw shows on the handle)
    const A0 = lerp3(S, E, 0.55); if (sd === PSIDE) tubeLite(c, [A0, E, lerp3(E, paw, 0.55), paw].map(pr), u => T * (0.62 - u * 0.14), Object.assign({ lw, force: true }, FURS, furStyle(tint)));
    const q = TN.ellipsoid(c, P3, P.hd + sd * 0.5, paw, [0.36, 0.34, 0.3], Object.assign({ T, lw, d1: 0.1, d2: 0.2, spec: 0.35, force: true }, FURS, furStyle(tint)));
    // its little toes curled round the handle
    c.strokeStyle = rgba(INK, 0.6); c.lineWidth = Math.max(1, lw * 0.55); c.lineCap = 'round'; for (const k of [-0.25, 0.25]) { c.beginPath(); c.moveTo(q.p[0] + k * q.rx, q.p[1] + q.ry * 0.1); c.lineTo(q.p[0] + k * q.rx * 0.8, q.p[1] + q.ry * 0.7); c.stroke(); } }
  /* the head: the round skull, the face on its front (the eyes, the crescent, the nose and mouth, the muzzle's puffs,
     the blush, the whiskers) */
  function drawHead(c, FX, P, P3, T, lw, M, t, tint) { const g = P.H0, sk = furStyle(tint), vh = Math.sin(P.hdH), g0 = P3(g[0], g[1], g[2]);
    // its outline: the turned, nodded, tilted skull's own (so the face painted on it stays inside it)
    // (the screen ellipse of its three turned half-axes: a point (x, y, z) is drawn at (x, y - z))
    let sxx = 0, sxy = 0, syy = 0; for (const ax of [[HEAD.a, 0, 0], [0, HEAD.b, 0], [0, 0, HEAD.c]]) { const w = sub3(P.Wh(HEAD.u + ax[0], ax[1], HEAD.h + ax[2]), g), px = w[0], py = w[1] - w[2]; sxx += px * px; sxy += px * py; syy += py * py; }
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)), ex = Math.sqrt(tr / 2 + disc), ey = Math.sqrt(Math.max(1e-6, tr / 2 - disc)), rot = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    TN.shape(c, TN.ell(g0[0], g0[1], ex * T, ey * T, rot), Object.assign({ r: T * 1.6, specAt: [g0[0] - T * 0.55, g0[1] - T * 0.75], force: true }, FURS, { lw: lw * 1.15, d1: 0.08, d2: 0.19, spec: 0.3, specR: 0.18, inner: gc => {
      // occlusion at the ear roots and under the jaw
      for (const sd of [-1, 1]) { const q = P3(...P.Wh(HEAD.u - 0.1, sd * 0.5, HEAD.h + 1.0)); K.shade(gc, q[0], q[1] + T * 0.1, T * 0.5, T * 0.26, 0.1, FUR_AO); }
      const j = P3(...P.Wh(HEAD.u + 0.3, 0, HEAD.h - HEAD.c * 0.95)); K.shade(gc, j[0], j[1], T * 1.2, T * 0.4, 0.22, FUR_AO);
      // the back of its head: a soft whorl of fur
      if (vh < 0.1) { const q = P3(...P.Wh(HEAD.u - HEAD.a * 0.8, 0, HEAD.h + 0.2)); gc.strokeStyle = rgba(FUR_SH2, 0.8 * clamp(-vh * 3 + 0.3, 0, 1)); gc.lineWidth = Math.max(1, lw * 0.6); gc.lineCap = 'round'; for (let i = 0; i < 3; i++) { gc.beginPath(); gc.arc(q[0], q[1], T * (0.2 + i * 0.18), 0.4 + i, 2.2 + i); gc.stroke(); } } } }, sk));
    drawFace(c, FX, P, P3, T, lw, M, t); }
  // the cheek blush, the muzzle, the nose, the mouth, the whiskers, the eyes and the crescent, painted on the face
  function drawFace(c, FX, P, P3, T, lw, M, t) {
    const bt = M.bt || t, curl = M.curl || 0, evil = M.evil || 0, dz = M.dizzy || 0, stunned = FX.m && FX.m.stunT > 0;
    // the blush: soft pink under each eye
    for (const sd of [-1, 1]) { const F = P.surf(sd * F_BLUSH[0], F_BLUSH[1]); if (F.vis < 0.05) continue; onPlane(c, P3, F, g => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, 0.36); gr.addColorStop(0, rgba(BLUSH, 0.5 * clamp(F.vis * 3, 0, 1))); gr.addColorStop(1, rgba(BLUSH, 0)); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, 0.42, 0.28, 0, 0, TAU); g.fill(); }); }
    // the muzzle: two soft puffs under the nose, whiskers from them
    const puffs = [-1, 1].map(sd => ({ sd, F: P.surf(sd * F_PUFF[0], F_PUFF[1], -0.05) })).sort((a, b) => a.F.vis - b.F.vis);
    for (const { sd, F } of puffs) { if (F.vis < 0.06) continue; furBall(c, P3, T, P.hdH + sd * 0.4, add3(F.p, F.n, 0.04), [0.26, 0.3, 0.24], { d1: 0.1, d2: 0.2, spec: false, lw: lw * 0.7, line: '#8A84AE' }, { amp: 0.04, n: 14, seed: 31 + sd });
      const W = P.surf(sd * 0.42, -0.1); if (W.vis > 0.05) onPlane(c, P3, W, g => { g.strokeStyle = rgba(INK, 0.55); g.lineWidth = 0.035; g.lineCap = 'round'; const s = sd > 0 ? -1 : 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(0, -0.04 + i * 0.07); g.quadraticCurveTo(s * 0.5, -0.12 + i * 0.1 + Math.sin(bt * 2 + i) * 0.02, s * 0.95, -0.2 + i * 0.16); g.stroke(); } }); }
    // the mouth (a smirk, one little fang; wide and wicked when it means harm), then the nose over it
    const Mo = P.surf(F_MOUTH[0], F_MOUTH[1], 0.04); if (Mo.vis > 0.02) onPlane(c, P3, Mo, g => mouth(g, M, evil, dz, stunned));
    const No = P.surf(F_NOSE[0], F_NOSE[1], 0.07); if (No.vis > 0.02) onPlane(c, P3, No, g => { const w = M.nose * 0.025; g.translate(w, -Math.abs(w)); g.beginPath(); g.moveTo(-0.15, -0.07); g.quadraticCurveTo(0, -0.13, 0.15, -0.07); g.quadraticCurveTo(0.13, 0.04, 0, 0.1); g.quadraticCurveTo(-0.13, 0.04, -0.15, -0.07); g.closePath(); g.fillStyle = NOSE; g.fill(); g.strokeStyle = INK; g.lineWidth = 0.035; g.lineJoin = 'round'; g.stroke(); g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.ellipse(-0.05, -0.06, 0.05, 0.025, -0.2, 0, TAU); g.fill(); });
    // the eyes: big, glossy, red, with slit pupils under heavy sly lids
    const look = [clamp(-angTo(P.hdH, M.aim == null ? P.hdH : M.aim) * 1.4, -1, 1), 0.25];
    for (const sd of [-1, 1]) { const F = P.surf(sd * F_EYE[0], F_EYE[1], 0.02); if (F.vis < 0.14) continue; F.vis -= 0.1;
      const mode = curl > 0.55 ? 'shut' : dz > 0.5 && stunned ? 'dizzy' : (M.ouch || 0) > 0.05 ? 'ouch' : 'open';
      if (mode === 'open' && evil > 0.3) { const q = P3(F.p[0], F.p[1], F.p[2]); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (evil - 0.3) * 0.35 * clamp(F.vis * 3, 0, 1); blitSized(c, glowSprite('#FF2A48'), q[0] - T * 0.8, q[1] - T * 0.8, T * 1.6, T * 1.6); c.restore(); }
      onPlane(c, P3, F, g => eye(g, sd > 0 ? 1 : -1, M, mode, look, evil, bt)); }
    // the crescent on its brow, glowing (brighter when it is bared to be struck)
    const Cr = P.surf(F_CRES[0], F_CRES[1], 0.03); if (Cr.vis > 0.0) { const q = P3(Cr.p[0], Cr.p[1], Cr.p[2]), weak = stunned ? 1 : 0, gl = 0.3 + 0.12 * Math.sin(bt * 2.6) + weak * (0.35 + 0.15 * Math.sin(bt * 8)) + (M.cresHit || 0) * 0.4;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, gl) * clamp(Cr.vis * 2.5, 0, 1); blitSized(c, glowSprite(CRES_GLOW), q[0] - T * (1.1 + weak * 0.5), q[1] - T * (1.1 + weak * 0.5), T * (2.2 + weak), T * (2.2 + weak)); c.restore();
      onPlane(c, P3, Cr, g => crescent(g, 0.36, -0.55, M.cresHit || 0)); } }
  // the crescent: an outer circle less an inner one, as a closed path (two arcs)
  function crescentPath(g, r, rot) { const r2 = r * 0.82, dd = r * 0.42, b = rot, a = (r * r - r2 * r2 + dd * dd) / (2 * dd), g1 = Math.acos(clamp(a / r, -1, 1)), h = Math.sqrt(Math.max(0, r * r - a * a)), g2 = Math.atan2(h, dd - a), ox = Math.cos(b) * dd, oy = Math.sin(b) * dd;
    g.beginPath(); g.arc(0, 0, r, b + g1, b + TAU - g1); g.arc(ox, oy, r2, b + Math.PI + g2, b + Math.PI - g2, true); g.closePath(); }
  function crescent(g, r, rot, flash) { crescentPath(g, r, rot);
    const gr = g.createLinearGradient(-r, -r, r, r); gr.addColorStop(0, CRES_HI); gr.addColorStop(0.45, CRES); gr.addColorStop(1, CRES_SH); g.fillStyle = gr; g.fill();
    if (flash > 0.05) { g.fillStyle = `rgba(255,255,255,${flash * 0.7})`; g.fill(); }
    g.strokeStyle = INK; g.lineWidth = 0.045; g.lineJoin = 'round'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(-r * 0.62, -r * 0.18, r * 0.12, r * 0.28, 0.4, 0, TAU); g.fill(); }
  /* one eye, in its own plane (metres, x across, y down), s the side its inner corner is on: open (red, slit pupil, a
     sly heavy lid slanting down to the nose, a smug lower lid, glossy catchlights), shut (a sly curve, a red glint
     under it), dizzy (red spirals), ouch (a squeezed chevron) */
  function eye(g, s, M, mode, look, evil, bt) { const rx = 0.4, ry = 0.48;
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (mode === 'shut') { g.strokeStyle = INK; g.lineWidth = 0.07; g.beginPath(); g.moveTo(-rx, 0.02 - s * 0.02); g.quadraticCurveTo(0, 0.2, rx, 0.02 + s * 0.02); g.stroke(); g.fillStyle = rgba(EYE_RED, 0.7 + 0.3 * Math.sin(bt * 3)); g.beginPath(); g.ellipse(s * 0.06, 0.13, 0.12, 0.035, 0, 0, TAU); g.fill(); return; }
    if (mode === 'ouch') { g.strokeStyle = INK; g.lineWidth = 0.09; g.beginPath(); g.moveTo(-s * rx * 0.85, -ry * 0.45); g.lineTo(s * rx * 0.55, 0); g.lineTo(-s * rx * 0.85, ry * 0.45); g.stroke(); return; }
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fillStyle = EYE_W; g.fill();
    g.save(); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.clip();
    if (mode === 'dizzy') { g.strokeStyle = EYE_RED; g.lineWidth = 0.06; g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * TAU * 2.4 + bt * 6 * s, r = 0.02 + i / 40 * 0.3; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r * 1.1) : g.moveTo(Math.cos(a) * r, Math.sin(a) * r * 1.1); } g.stroke(); g.restore();
      g.strokeStyle = INK; g.lineWidth = 0.05; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.stroke(); return; }
    // the iris: a deep glossy red, brighter below, a dark ring, a slit pupil, two catchlights
    const ix = look[0] * 0.07, iy = look[1] * 0.06 + 0.03, ir = 0.33;
    const gr = g.createRadialGradient(ix, iy + ir * 0.35, 0.02, ix, iy, ir); gr.addColorStop(0, EYE_HOT); gr.addColorStop(0.5, EYE_RED); gr.addColorStop(0.86, EYE_D); gr.addColorStop(1, EYE_DD); g.fillStyle = gr; g.beginPath(); g.ellipse(ix, iy, ir * 0.95, ir * 1.08, 0, 0, TAU); g.fill();
    g.fillStyle = rgba('#FFB0BC', 0.5); g.beginPath(); g.ellipse(ix, iy + ir * 0.62, ir * 0.55, ir * 0.22, 0, 0, TAU); g.fill();
    g.fillStyle = '#1A0208'; g.beginPath(); g.ellipse(ix, iy, 0.035 + (1 - evil) * 0.03, 0.23, 0, 0, TAU); g.fill();
    g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(ix - 0.11, iy - 0.14, 0.085, 0.06, -0.5, 0, TAU); g.fill(); g.beginPath(); g.arc(ix + 0.1, iy + 0.12, 0.035, 0, TAU); g.fill();
    TN.twinkle(g, ix - 0.17, iy - 0.21, 0.07, '#FFFFFF', 0.8 + 0.2 * Math.sin(bt * 4));
    // the lids: the upper one heavy and slanting down toward the nose (sly), casting a soft shadow on the eye; the lower
    // one a smug little rise; a blink brings the upper down
    const bl = clamp(M.blink || 0, 0, 1), yo = lerp(-ry * (0.74 - evil * 0.22), ry * 1.1, bl), yi = lerp(-ry * (0.4 - evil * 0.28), ry * 1.1, bl), lid = (yy0, yy1) => { g.beginPath(); g.moveTo(-s * rx * 1.2, yy0); g.quadraticCurveTo(0, (yy0 + yy1) / 2 - 0.03, s * rx * 1.2, yy1); g.lineTo(s * rx * 1.2, -ry * 1.3); g.lineTo(-s * rx * 1.2, -ry * 1.3); g.closePath(); };
    g.fillStyle = 'rgba(70,40,80,.28)'; lid(yo + 0.07, yi + 0.07); g.fill();
    g.fillStyle = FUR; lid(yo, yi); g.fill();
    const lo = ry * (0.8 - evil * 0.14); g.fillStyle = FUR; g.beginPath(); g.moveTo(-rx * 1.2, lo + 0.1); g.quadraticCurveTo(0, lo - 0.1, rx * 1.2, lo + 0.1); g.lineTo(rx * 1.2, ry * 1.3); g.lineTo(-rx * 1.2, ry * 1.3); g.closePath(); g.fill();
    g.restore();
    // the outline: a fine line round the lower eye, a heavy lash line along the upper lid with a wicked flick outward
    g.strokeStyle = INK; g.lineWidth = 0.04; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0.1 * Math.PI, 0.9 * Math.PI); g.stroke();
    const cx = (t, y0, y1) => { const x0 = -s * rx * 1.2, x1 = s * rx * 1.2, mx = 0, my = (y0 + y1) / 2 - 0.03; return [(1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1]; };
    g.save(); g.beginPath(); g.ellipse(0, 0, rx * 1.04, ry * 1.04, 0, 0, TAU); g.rect(-1, -ry * 1.6, 2, ry * 0.3); g.clip();
    g.lineWidth = 0.085; g.beginPath(); for (let i = 0; i <= 12; i++) { const p = cx(i / 12, yo, yi); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } g.stroke(); g.restore();
    const o = cx(0.04, yo, yi); g.lineWidth = 0.07; g.beginPath(); g.moveTo(o[0], o[1]); g.quadraticCurveTo(o[0] - s * 0.1, o[1] - 0.02, o[0] - s * 0.17, o[1] - 0.12); g.stroke();
  }
  // the mouth in its own plane: the rabbit's Y from the nose, the far corner curling up into a smirk over one little
  // fang; meaning harm, it opens in a wicked grin, two fangs; dizzy, a wobbly line
  function mouth(g, M, evil, dz, stunned) { const gr = M.grin || 0; g.strokeStyle = INK; g.lineWidth = 0.045; g.lineCap = 'round'; g.lineJoin = 'round';
    if (stunned && dz > 0.5) { g.beginPath(); g.moveTo(0, -0.14); g.lineTo(0, -0.02); g.moveTo(-0.22, 0.02); for (let i = 0; i <= 8; i++) g.lineTo(-0.22 + i * 0.055, 0.02 + (i % 2 ? 0.04 : -0.01)); g.stroke(); return; }
    const op = clamp((gr - 0.3) / 0.7, 0, 1);
    if (op > 0.02) { g.beginPath(); g.moveTo(-0.22, 0.0); g.quadraticCurveTo(0, 0.04 + op * 0.2, 0.27, -0.08); g.quadraticCurveTo(0.04, 0.02, -0.22, 0.0); g.closePath(); g.fillStyle = '#5A1028'; g.fill();
      g.fillStyle = '#E86A88'; g.beginPath(); g.ellipse(0.02, 0.04 + op * 0.12, 0.09, 0.035, 0, 0, TAU); g.fill();
      g.fillStyle = '#FFFFFF'; for (const [x, k] of [[-0.12, 0.8], [0.13, 1]]) { g.beginPath(); g.moveTo(x - 0.035, 0.01); g.lineTo(x + 0.035, 0.0); g.lineTo(x + 0.005, 0.01 + 0.1 * k * (0.6 + op * 0.4)); g.closePath(); g.fill(); g.lineWidth = 0.02; g.stroke(); } g.lineWidth = 0.045; }
    g.beginPath(); g.moveTo(0, -0.14); g.lineTo(0, -0.01); g.moveTo(0, -0.01); g.quadraticCurveTo(-0.09, 0.1, -0.22, 0.0); g.moveTo(0, -0.01); g.quadraticCurveTo(0.12, 0.09 + op * 0.06, 0.27, -0.08 - op * 0.02); g.stroke();
    if (op <= 0.02) { g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(0.08, 0.04); g.lineTo(0.15, 0.03); g.lineTo(0.12, 0.13); g.closePath(); g.fill(); g.lineWidth = 0.02; g.stroke(); }
    void evil; }
  /* an ear: a long blade from the top of its head, turning toward the pet and twitching; the floppy one folds over
     halfway; flattened back in a crouch, buried in the ground ahead of it when it is stuck, draped down its back when
     it is curled up */
  function earSpine(P, M, sd, bt) { const n = 12, root = [HEAD.u - 0.1, sd * 0.5, HEAD.h + 1.05], flop = sd !== PSIDE, tw = M.tw[sd > 0 ? 0 : 1] || 0;
    const cr = Math.max(M.crouch || 0, P.st || 0), aimO = clamp(angTo(P.hdH, M.aim == null ? P.hdH : M.aim), -0.6, 0.6), sway = Math.sin(bt * 1.3 + sd) * 0.05;
    // the spine in the head's frame: up and a little back and out, the floppy one bent over at its middle
    const pts = []; let p = root.slice();
    for (let k = 0; k <= n; k++) { const u = k / n; pts.push(p.slice()); if (k === n) break;
      let d = [-0.12 - u * 0.3 - cr * 0.9 + tw * 0.25 * Math.sin(tw * 9) + aimO * 0 + sway, sd * (0.28 + cr * 0.15) + aimO * 0.25, 1 - cr * 0.45];
      if (flop) { const f = smooth((u - 0.38) / 0.2) * (1 - cr * 0.6); d = lerp3(d, [0.35 + (M.flop || 0) * 0.3, sd * 0.85, -0.55 - (M.flop || 0) * 0.4], f); }
      d = norm3(d); p = add3(p, d, EL / n); }
    let W = pts.map(q => P.Wh(q[0], q[1], q[2]));
    // buried in the ground (stuck), draped down its back (curled)
    const es = M.earStuck || 0, cu = M.curl || 0;
    if (es > 0.01 || cu > 0.01) { const r0 = W[0], tipG = P.Wb(1.6, sd * 3.1, -0.1), ctrlG = add3(r0, sub3(P.Wb(0.5, sd * 2.2, 0), P.Wb(0, 0, 0)), 1.0), tipC = P.Wh(HEAD.u + HEAD.a + 0.35, sd * 0.62, HEAD.h - 1.5), ctrlC = P.Wh(HEAD.u + 1.0, sd * 0.75, HEAD.h + 2.2);
      const bz = (a, b, c2, u) => lerp3(lerp3(a, b, u), lerp3(b, c2, u), u);
      W = W.map((q, k) => { const u = k / n; let r = q; if (es > 0.01) r = lerp3(r, bz(r0, ctrlG, tipG, u), es); if (cu > 0.01) r = lerp3(r, bz(r0, ctrlC, tipC, u), cu); return r; }); }
    return { W, flop, face: P.hdH + sd * 0.45 + aimO * 0.6 + tw * 0.6 * sd }; }
  function drawEar(c, FX, P, P3, T, lw, sd, M, bt, tint) { const E = earSpine(P, M, sd, bt), sp = E.W.map(q => P3(q[0], q[1], q[2])), n = sp.length - 1;
    const wf = u => T * EW * Math.sqrt(Math.max(0.0, 1 - Math.pow((u - 0.42) / 0.585, 2))) * (1 - (M.curl || 0) * 0.15);
    // denser near the tip so its end is round
    const us = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.86, 0.91, 0.95, 0.98, 1], at = u => { const k = u * n, j = Math.min(n - 1, Math.floor(k)), e = k - j; return [lerp(sp[j][0], sp[j + 1][0], e), lerp(sp[j][1], sp[j + 1][1], e)]; };
    const pts = us.map(at); tubeLite(c, pts, i => wf(us[Math.round(i * (us.length - 1))] != null ? us[Math.round(i * (us.length - 1))] : i), Object.assign({ lw: lw * 1.05, force: true, d1: 0.12, d2: 0.22 }, FURS, furStyle(tint)));
    // its pink inner (seen when the ear turns its face to the camera; on the floppy ear only up to the fold)
    const fv = Math.sin(E.face), vis = clamp(fv * 1.6 + 0.15, 0, 1) * clamp(1 - (M.curl || 0) * 2, 0, 1);
    if (vis > 0.05) { const top = E.flop ? 0.5 : 0.9, iu = us.filter(u => u >= 0.08 && u <= top), ip = iu.map(at);
      tubeLite(c, ip, i => { const u = iu[Math.round(i * (iu.length - 1))]; return wf(u) * 0.55 * vis * Math.min(1, (u - 0.06) * 6, (top - u + 0.04) * 6); }, { col: PINK, shade: PINK_SH, hi: PINK_HI, line: rgba(PINK_SH, 0.9), lw: Math.max(1, lw * 0.4), force: true, d1: 0.15, d2: 0.25 }); }
    // the fold of the floppy ear: a soft crease
    if (E.flop) { const q = at(0.5), q2 = at(0.56); c.strokeStyle = rgba(FUR_SH2, 0.9); c.lineWidth = Math.max(1, lw * 0.7); c.lineCap = 'round'; c.beginPath(); c.moveTo(q[0] - (q2[1] - q[1]) * 1.6, q[1] + (q2[0] - q[0]) * 1.6); c.lineTo(q[0] + (q2[1] - q[1]) * 1.6, q[1] - (q2[0] - q[0]) * 1.6); c.stroke(); }
    // buried tips: a little mound of ash where each goes in
    if ((M.earStuck || 0) > 0.5) { const tp = P3(...E.W[n]); K.shade(c, tp[0], tp[1] + T * 0.05, T * 0.8, T * 0.32, 0.45, '#2A2C40'); MOON.lump(c, tp[0], tp[1] + T * 0.05, T * 0.55, T * 0.24, mulberry32(9 + sd), 9); c.fillStyle = '#A3A7B6'; c.fill(); c.strokeStyle = rgba(INK, 0.6); c.lineWidth = Math.max(1, lw * 0.6); c.stroke(); } }
  // the pestle: a moon-stone handle and drum; the drum's two ends, the one turned to the camera drawn as its face
  function drawPestle(c, P3, T, lw, Pp, M) { const pr = w => P3(w[0], w[1], w[2]), { grip, head, d, ax } = Pp, st = { col: STONE, shade: STONE_SH, shade2: STONE_SH2, hi: STONE_HI, line: INK, force: true };
    const h0 = add3(grip, d, -0.95 + 0.55 * clamp(M.ps || 0, 0, 1)); tubeLite(c, [h0, lerp3(h0, head, 0.5), head].map(pr), () => T * 0.38, Object.assign({ lw }, st));
    const n2 = norm3(cross3(ax, d)), cap = (e, k) => { const out = []; for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; out.push(pr(add3(add3(e, d, Math.cos(a) * BR * k), n2, Math.sin(a) * BR * k))); } return out; };
    const e0 = add3(head, ax, -BL / 2), e1 = add3(head, ax, BL / 2), c0 = cap(e0, 1), c1 = cap(e1, 1), hl = hull(c0.concat(c1)), mid = pr(head);
    TN.shape(c, TN.poly(hl), Object.assign({ lw: lw * 1.1, r: T * BR * 1.6, d1: 0.1, d2: 0.18, spec: 0.4, specAt: [mid[0] - T * 0.3, mid[1] - T * 0.35], specR: 0.25, inner: g => {
      // two glowing moonstone bands round the drum
      for (const k of [0.2, 0.8]) { const ring = cap(lerp3(e0, e1, k), 1.01); g.strokeStyle = rgba(MOONSTONE, 0.9); g.lineWidth = Math.max(1.2, T * 0.09); g.beginPath(); ring.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = Math.max(0.8, T * 0.03); g.stroke(); } } }, st));
    // the end turned to the camera
    const vis = dot3(ax, [0, 0.7071, 0.7071]), face = vis >= 0 ? c1 : c0;
    if (Math.abs(vis) > 0.05) TN.shape(c, TN.poly(face), Object.assign({ lw, r: T * BR, d1: 0.12, d2: 0.22, hi: STONE_HI, col: mix(STONE, '#FFFFFF', 0.25), spec: false, inner: g => { const q = pr(vis >= 0 ? e1 : e0); g.save(); g.globalAlpha = Math.min(1, Math.abs(vis) * 2); crescentAt(g, q[0], q[1], T * BR * 0.5); g.restore(); } }, st, { col: mix(STONE, '#FFFFFF', 0.25) })); }
  function crescentAt(g, x, y, r) { g.save(); g.translate(x, y); g.scale(r, r); crescentPath(g, 1, -0.6); g.fillStyle = rgba(MOONSTONE, 0.9); g.fill(); g.restore(); }
  /* the mortar: a squat drum of moonstone with two carved bands, a bowl in its top full of glowing elixir; brewing, the
     elixir swells up out of it and glows; cracked, it is split with glowing seams */
  function mortarGeo(M, P3, T, mo) { const sw = M.swell || 0, k = 1 + sw * 0.06 + (M.mortHit || 0) * 0.03, r = MR * k, rb = MRB * k, b = P3(mo.x, mo.y, 0), tp = P3(mo.x, mo.y, MH * (1 + sw * 0.04)); return { r, rb, X: b[0], Yb: b[1], Yt: tp[1], R: r * T, Rb: rb * T, k }; }
  function drawMortar(c, FX, M, P3, T, lw, mo, bt) { const G = mortarGeo(M, P3, T, mo), { X, Yb, Yt, R, Rb } = G, el = M.elix || 0, sw = M.swell || 0, hitK = M.mortHit || 0;
    K.shade(c, X + T * 0.2, Yb + T * 0.3, R * 1.25, R * 0.75, 0.5, '#141626');
    const side = g => { g.moveTo(X - R, Yt); g.quadraticCurveTo(X - R * 0.84, (Yt + Yb) / 2, X - Rb, Yb); g.arc(X, Yb, Rb, Math.PI, 0, true); g.quadraticCurveTo(X + R * 0.84, (Yt + Yb) / 2, X + R, Yt); g.arc(X, Yt, R, 0, Math.PI, true); g.closePath(); };
    TN.shape(c, side, { col: mix(MORT, '#FFFFFF', hitK * 0.3), shade: MORT_SH, shade2: MORT_SH2, hi: MORT_HI, line: INK, lw: lw * 1.15, r: R * 1.1, d1: 0.08, d2: 0.14, force: true, glowCol: el > 0.5 ? ELIX : null, glowA: (el - 0.5) * 0.4, inner: g => {
      // the carved bands, front halves
      for (const z of [0.3, MH - 0.42]) { const y = Yb - z * T, rr = lerp(Rb, R, z / MH) * 0.99; g.strokeStyle = 'rgba(40,44,64,.55)'; g.lineWidth = Math.max(1.2, T * 0.07); g.beginPath(); g.arc(X, y, rr, 0.05 * Math.PI, 0.95 * Math.PI); g.stroke(); g.strokeStyle = 'rgba(240,242,250,.5)'; g.lineWidth = Math.max(0.8, T * 0.035); g.beginPath(); g.arc(X, y + T * 0.07, rr, 0.08 * Math.PI, 0.92 * Math.PI); g.stroke(); }
      // little pits in the stone
      const Rr = mulberry32(606); for (let i = 0; i < 7; i++) { const a = 0.15 * Math.PI + Rr() * 0.7 * Math.PI, z = 0.45 + Rr() * 0.5, x = X + Math.cos(a) * R * 0.9, y = Yb - z * T + Math.sin(a) * Rb * 0.95 - T * 0.2, s = T * (0.06 + Rr() * 0.07); g.fillStyle = 'rgba(60,64,88,.45)'; g.beginPath(); g.ellipse(x, y, s, s * 0.7, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(240,242,250,.5)'; g.lineWidth = Math.max(0.6, s * 0.3); g.beginPath(); g.ellipse(x, y, s * 0.8, s * 0.55, 0, -0.1 * Math.PI, 0.6 * Math.PI); g.stroke(); }
      // the cracks of a broken brew, glowing with the elixir seeping in them
      const ck = M.crack || 0; if (ck > 0.02) { const Rc = mulberry32(88); for (let i = 0; i < 4; i++) { let x = X + (Rc() - 0.5) * R * 1.4, y = Yt + R * 0.85; const pts = [[x, y]]; for (let j = 0; j < 5; j++) { x += (Rc() - 0.5) * T * 0.5; y += T * (0.2 + Rc() * 0.18); pts.push([x, y]); }
        g.strokeStyle = rgba(ELIX, 0.7 * ck); g.lineWidth = Math.max(2, T * 0.14); g.beginPath(); pts.forEach((p, k) => k ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); g.strokeStyle = rgba(INK, 0.9 * Math.min(1, ck * 2)); g.lineWidth = Math.max(1.2, T * 0.05); g.stroke(); } } } });
    // the top: the rim, the bowl and the elixir in it
    c.fillStyle = mix(MORT_HI, '#FFFFFF', hitK * 0.3); c.beginPath(); c.arc(X, Yt, R, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke();
    const br = R * 0.78; let g = c.createRadialGradient(X - br * 0.3, Yt - br * 0.35, br * 0.1, X, Yt, br); g.addColorStop(0, '#3C4258'); g.addColorStop(0.75, '#5A6078'); g.addColorStop(1, '#8A90A6');
    c.fillStyle = g; c.beginPath(); c.arc(X, Yt, br, 0, TAU); c.fill(); c.strokeStyle = rgba(INK, 0.8); c.lineWidth = Math.max(1, lw * 0.7); c.stroke();
    // the elixir: a glowing pool, rising to a swelling dome as it brews
    const lv = 0.25 + el * 0.75, er = br * (0.82 + el * 0.16), ey = Yt + br * 0.18 * (1 - lv), dome = sw * T * 0.75;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, 0.12 + el * 0.6 + sw * 0.2); blitSized(c, glowSprite(ELIX), X - R * (1.2 + sw * 0.6), Yt - dome - R * (1.0 + sw * 0.5), R * (2.4 + sw * 1.2), R * (2.0 + sw * 1.0)); c.restore();
    const pool = gc => { gc.beginPath(); gc.ellipse(X, ey, er, er * 0.92, 0, 0, Math.PI); if (dome > 1) gc.ellipse(X, ey, er, er * 0.92 + dome, 0, Math.PI, TAU); else gc.ellipse(X, ey, er, er * 0.92, 0, Math.PI, TAU); gc.closePath(); };
    TN.shape(c, pool, { col: ELIX, shade: ELIX_SH, hi: ELIX_HI, line: rgba(ELIX_D, 0.9), lw: Math.max(1, lw * 0.8), r: er, d1: 0.14, d2: 0.22, spec: 0.7, specAt: [X - er * 0.35, ey - er * 0.4 - dome * 0.6], specR: 0.22, force: true, noFlash: true, inner: gc => {
      // swirls turning in the brew
      gc.strokeStyle = rgba(ELIX_HI, 0.6); gc.lineWidth = Math.max(1, T * 0.05); gc.lineCap = 'round'; for (let i = 0; i < 3; i++) { const a = bt * (1.2 + sw * 2) + i * TAU / 3; gc.beginPath(); gc.arc(X, ey - dome * 0.3, er * (0.3 + i * 0.18), a, a + 1.4); gc.stroke(); } } }); }
  // the mortar's front lip, laid over the pestle's drum when it is down in the bowl
  function drawMortarLip(c, M, P3, T, lw, mo) { const { X, Yt, R } = mortarGeo(M, P3, T, mo), br = R * 0.78;
    c.save(); c.beginPath(); c.arc(X, Yt, R, 0, Math.PI); c.arc(X, Yt, br, Math.PI, 0, true); c.closePath(); c.fillStyle = MORT_HI; c.fill(); c.strokeStyle = INK; c.lineWidth = lw; c.stroke(); c.restore(); }

  /* ---------- the Great Crater: the floor and the sky ---------- */
  // a little crater on the floor (world units): a shadowed bowl, its inner wall lit on the lower right, its rim lit
  function floorPit(c, x, y, r, rnd) { c.fillStyle = 'rgba(90,94,112,.32)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.fillStyle = 'rgba(52,56,76,.42)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x + r * 0.38, y + r * 0.38, r * 1.02, 0, TAU); c.fill('evenodd');
    c.fillStyle = 'rgba(236,238,246,.28)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.arc(x - r * 0.3, y - r * 0.3, r * 1.02, 0, TAU); c.fill('evenodd'); c.restore();
    c.lineCap = 'round'; c.strokeStyle = 'rgba(246,248,255,.42)'; c.lineWidth = r * 0.16; c.beginPath(); c.arc(x, y, r * 1.06, Math.PI * 0.9, Math.PI * 1.65); c.stroke(); c.strokeStyle = 'rgba(60,64,84,.3)'; c.lineWidth = r * 0.1; c.beginPath(); c.arc(x, y, r * 1.08, -0.05 * Math.PI, 0.6 * Math.PI); c.stroke();
    for (let i = 0; i < 6; i++) { const a = rnd() * TAU, d = r * (1.2 + rnd() * 0.8); c.fillStyle = `rgba(${rnd() < 0.5 ? '230,232,240' : '110,114,130'},.35)`; c.beginPath(); c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.04 + rnd() * 0.05), 0, TAU); c.fill(); } }
  function paintFloor(c, A) { const R = A.R, rnd = A.rnd, clear = (x, y, k) => Math.hypot(x - HOME[0], y - HOME[1]) < 4.2 * k || Math.hypot(x - MORTP[0], y - MORTP[1]) < 2.4 * k;
    // the outer slope of the rim falling away into the black
    let g = c.createRadialGradient(0, 0, R, 0, 0, R + 1.5); g.addColorStop(0, '#80849A'); g.addColorStop(0.45, 'rgba(70,74,92,.75)'); g.addColorStop(1, 'rgba(20,22,34,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    // the floor: grey regolith, a little paler at its heart
    g = c.createRadialGradient(0, -1, 1, 0, 0, R + 0.3); g.addColorStop(0, '#AEB2BF'); g.addColorStop(0.65, '#A2A6B4'); g.addColorStop(1, '#888C9D'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.3, 0, TAU); c.fill();
    // speckle and grit
    for (let i = 0; i < 2600; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, lt = rnd() < 0.45; c.fillStyle = lt ? `rgba(240,242,250,${0.1 + rnd() * 0.18})` : `rgba(70,74,92,${0.08 + rnd() * 0.16})`; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 0.04 + rnd() * 0.06, 0.04 + rnd() * 0.06); }
    // ash ripples drifted by the moon's pull
    c.lineCap = 'round'; for (let i = 0; i < 38; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, L = 0.8 + rnd() * 1.6, b = 0.35 + (rnd() - 0.5) * 0.4; c.strokeStyle = 'rgba(90,94,112,.16)'; c.lineWidth = 0.09; c.beginPath(); c.moveTo(x - Math.cos(b) * L, y - Math.sin(b) * L); c.quadraticCurveTo(x, y + 0.18, x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke(); c.strokeStyle = 'rgba(244,246,252,.18)'; c.lineWidth = 0.05; c.beginPath(); c.moveTo(x - Math.cos(b) * L, y - Math.sin(b) * L - 0.08); c.quadraticCurveTo(x, y + 0.1, x + Math.cos(b) * L, y + Math.sin(b) * L - 0.08); c.stroke(); }
    // the shallow hollow worn by its sitting, and a ring of pounded ash round the mortar, spattered with old elixir
    g = c.createRadialGradient(HOME[0], HOME[1], 2.2, HOME[0], HOME[1], 4.8); g.addColorStop(0, 'rgba(70,74,96,.0)'); g.addColorStop(0.7, 'rgba(70,74,96,.16)'); g.addColorStop(0.86, 'rgba(240,242,250,.14)'); g.addColorStop(1, 'rgba(240,242,250,0)'); c.fillStyle = g; c.beginPath(); c.arc(HOME[0], HOME[1], 4.8, 0, TAU); c.fill();
    g = c.createRadialGradient(MORTP[0], MORTP[1], 1.2, MORTP[0], MORTP[1], 2.6); g.addColorStop(0, 'rgba(60,64,86,.22)'); g.addColorStop(1, 'rgba(60,64,86,0)'); c.fillStyle = g; c.beginPath(); c.arc(MORTP[0], MORTP[1], 2.6, 0, TAU); c.fill();
    for (let i = 0; i < 16; i++) { const a = rnd() * TAU, d = 1.6 + rnd() * 1.6, x = MORTP[0] + Math.cos(a) * d, y = MORTP[1] + Math.sin(a) * d * 0.9, s = 0.05 + rnd() * 0.1; c.fillStyle = rgba(ELIX, 0.35 + rnd() * 0.25); c.beginPath(); c.ellipse(x, y, s * 1.4, s, 0, 0, TAU); c.fill(); }
    // little craters of its own, and a few larger ones out toward the rim
    for (let i = 0; i < 34; i++) { const a = rnd() * TAU, d = 1.5 + Math.sqrt(rnd()) * (R - 2.5), x = Math.cos(a) * d, y = Math.sin(a) * d; if (clear(x, y, 1.05)) continue; floorPit(c, x, y, 0.18 + rnd() * rnd() * 0.75, rnd); }
    for (let i = 0; i < 5; i++) { const a = rnd() * TAU, d = 7.5 + rnd() * (R - 10), x = Math.cos(a) * d, y = Math.sin(a) * d; if (clear(x, y, 1.5)) continue; floorPit(c, x, y, 1.0 + rnd() * 0.9, rnd); }
    // moonstone chips glinting in the dust
    for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.08 + rnd() * 0.1; c.fillStyle = rgba(MOONSTONE, 0.75); c.beginPath(); c.moveTo(x, y - s * 1.6); c.lineTo(x + s, y); c.lineTo(x, y + s); c.lineTo(x - s, y); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.8)'; c.fillRect(x - s * 0.2, y - s * 1.1, s * 0.3, s * 0.7); }
    // the bowl's light: the rim's shadow cast across the floor's upper left, its lit inner slope at the lower right
    g = c.createRadialGradient(1.0, 1.0, R - 3.2, 1.0, 1.0, R + 1.2); g.addColorStop(0, 'rgba(30,32,50,0)'); g.addColorStop(1, 'rgba(30,32,50,.55)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.3, 0, TAU); c.fill();
    g = c.createRadialGradient(-0.9, -0.9, R - 1.4, -0.9, -0.9, R + 0.9); g.addColorStop(0, 'rgba(244,246,252,0)'); g.addColorStop(1, 'rgba(244,246,252,.3)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.3, 0, TAU); c.fill();
    // the rim: a raised lip of rubble, its crest catching light
    c.lineCap = 'round'; c.strokeStyle = 'rgba(48,52,70,.4)'; c.lineWidth = 0.5; c.beginPath(); c.arc(0, 0, R + 0.05, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(232,234,244,.55)'; c.lineWidth = 0.22; c.beginPath(); c.arc(0, 0, R + 0.4, Math.PI * 0.95, Math.PI * 2.05); c.stroke(); c.strokeStyle = 'rgba(232,234,244,.3)'; c.beginPath(); c.arc(0, 0, R + 0.4, Math.PI * 0.05, Math.PI * 0.95); c.stroke();
    for (let i = 0; i < 120; i++) { const a = rnd() * TAU, d = R + 0.05 + rnd() * 0.9, x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.12 + rnd() * 0.28; MOON.lump(c, x, y, r, r * 0.8, rnd, 8); const lt = Math.sin(a + 0.8) > 0; c.fillStyle = lt ? (rnd() < 0.5 ? '#B4B8C4' : '#A6AAB8') : (rnd() < 0.5 ? '#7E8294' : '#8C909E'); c.fill(); c.strokeStyle = 'rgba(30,32,48,.6)'; c.lineWidth = 0.035; c.stroke(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(x - r * 0.3, y - r * 0.35, r * 0.35, r * 0.18, -0.4, 0, TAU); c.fill(); } }
  function paintSky(c, W, H) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#020309'); g.addColorStop(0.55, '#070A17'); g.addColorStop(1, '#03040B'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(4401);
    // the galaxy's faint band
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { const u = i / 9, x = W * (-0.15 + u * 1.3), y = H * (0.66 - u * 0.56); c.globalAlpha = 0.07 + R() * 0.06; blitSized(c, glowSprite(i % 2 ? '#5A6AA8' : '#8A78B8'), x - W * 0.32, y - H * 0.08, W * 0.64, H * 0.16); } c.restore();
    // stars, a few of them bright
    for (let i = 0; i < 300; i++) { const x = R() * W, y = R() * H, s = R() < 0.06 ? 1.3 + R() : 0.35 + R() * 0.7, col = R() < 0.15 ? '#BFD4FF' : R() < 0.1 ? '#FFE8C0' : '#FFFFFF'; c.globalAlpha = 0.35 + R() * 0.6; c.fillStyle = col; c.beginPath(); c.arc(x, y, s, 0, TAU); c.fill(); } c.globalAlpha = 1;
    for (let i = 0; i < 9; i++) TN.twinkle(c, R() * W, R() * H * 0.9, 3 + R() * 4, '#E8F0FF', 0.6 + R() * 0.3);
    // Gaia, hanging blue and green low over the crater's rim (where the fight sees the sky), her atmosphere soft about her
    const gx = W * 0.4, gy = H * 0.9, gr = Math.min(W, H) * 0.13;
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55; blitSized(c, glowSprite('#6FA8FF'), gx - gr * 2, gy - gr * 2, gr * 4, gr * 4); c.globalAlpha = 0.35; blitSized(c, glowSprite('#BFE0FF'), gx - gr * 1.3, gy - gr * 1.3, gr * 2.6, gr * 2.6); c.restore();
    let p = c.createRadialGradient(gx - gr * 0.35, gy - gr * 0.4, gr * 0.1, gx, gy, gr); p.addColorStop(0, '#A8D8FF'); p.addColorStop(0.55, '#3A7ACC'); p.addColorStop(1, '#173460'); c.fillStyle = p; c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.clip();
    c.fillStyle = '#5FA86A'; for (const [x, y, r, a] of [[-0.35, -0.25, 0.34, 0.5], [0.15, 0.2, 0.3, -0.4], [0.5, -0.4, 0.2, 0.9], [-0.1, 0.62, 0.22, 0.2], [0.62, 0.32, 0.16, -0.2]]) { c.beginPath(); c.ellipse(gx + x * gr, gy + y * gr, r * gr, r * gr * 0.62, a, 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(214,184,110,.75)'; for (const [x, y, r] of [[-0.42, -0.2, 0.14], [0.2, 0.28, 0.1]]) { c.beginPath(); c.ellipse(gx + x * gr, gy + y * gr, r * gr, r * gr * 0.6, 0.3, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineCap = 'round'; for (let i = 0; i < 5; i++) { c.lineWidth = gr * (0.05 + R() * 0.05); c.beginPath(); const y0 = gy + (i - 2) * gr * 0.34; c.moveTo(gx - gr, y0 + R() * gr * 0.1); c.bezierCurveTo(gx - gr * 0.3, y0 - gr * 0.15, gx + gr * 0.3, y0 + gr * 0.18, gx + gr, y0 - R() * gr * 0.1); c.stroke(); }
    // her night side, its edge soft
    p = c.createRadialGradient(gx - gr * 0.55, gy - gr * 0.5, gr * 0.6, gx - gr * 0.55, gy - gr * 0.5, gr * 1.9); p.addColorStop(0, 'rgba(2,4,16,0)'); p.addColorStop(0.55, 'rgba(2,4,16,.35)'); p.addColorStop(1, 'rgba(2,4,16,.85)'); c.fillStyle = p; c.fillRect(gx - gr, gy - gr, gr * 2, gr * 2); c.restore();
    c.save(); c.globalCompositeOperation = 'lighter'; [[gr * 0.16, 0.12], [gr * 0.08, 0.2], [gr * 0.03, 0.35]].forEach(([w, a]) => { c.strokeStyle = `rgba(150,200,255,${a})`; c.lineWidth = w; c.beginPath(); c.arc(gx, gy, gr, Math.PI * 0.75, Math.PI * 1.9); c.stroke(); }); c.restore(); }

  /* ---------- on the floor: its craters and the pestle's cracks, the leap's shadow, the pestle's lane, the brew's cone,
     the mochi's lanes, the shockwave rings; every band and ring feathered soft ---------- */
  function softLine(c, x0, y0, x1, y1, w, col, a) { c.save(); c.lineCap = 'round'; [[1.5, 0.05], [1.18, 0.08], [0.88, 0.12], [0.56, 0.16]].forEach(([k, al]) => { c.strokeStyle = rgba(col, al * a); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }); c.restore(); }
  function softRing(c, X, Y, r, w, col, a) { if (r <= 0) return; c.save(); [[1.9, 0.06], [1.3, 0.1], [0.85, 0.16], [0.45, 0.24], [0.18, 0.4]].forEach(([k, al]) => { c.strokeStyle = rgba(col, al * a); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); }); c.restore(); }
  function softCone(c, X, Y, a, len, spread, col, al) { for (const [kL, kS, aa] of [[1.08, 1.14, 0.05], [1.03, 1.07, 0.07], [0.97, 1.0, 0.09], [0.9, 0.92, 0.1]]) { const g = c.createRadialGradient(X, Y, 0, X, Y, len * kL); g.addColorStop(0, rgba(col, aa * al)); g.addColorStop(0.7, rgba(col, aa * al * 0.85)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(X, Y); c.arc(X, Y, len * kL, a - spread * kS, a + spread * kS); c.closePath(); c.fill(); } }
  function chevron(c, X, Y, a, s, col, alpha) { const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(X - ux * s + nx * s, Y - uy * s + ny * s); c.lineTo(X, Y); c.lineTo(X - ux * s - nx * s, Y - uy * s - ny * s); c.strokeStyle = `rgba(20,16,30,${0.4 * alpha})`; c.lineWidth = Math.max(3, s * 0.55); c.stroke(); c.strokeStyle = rgba(col, alpha); c.lineWidth = Math.max(1.6, s * 0.3); c.stroke(); c.restore(); }
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(8,8,20,.82)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  function craterDecal(c, X, Y, r, a, seed, T) { if (a <= 0.01) return; const R = mulberry32(seed); c.save(); c.globalAlpha = a; K.shade(c, X, Y, r * 1.05, r * 0.95, 0.42, '#1E2032');
    c.lineCap = 'round'; for (let i = 0; i < 10; i++) { let x = X + Math.cos(i / 10 * TAU) * r * 0.6, y = Y + Math.sin(i / 10 * TAU) * r * 0.6; const b = i / 10 * TAU + (R() - 0.5) * 0.4; c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 3; j++) { x += Math.cos(b + (R() - 0.5) * 0.9) * r * 0.22; y += Math.sin(b + (R() - 0.5) * 0.9) * r * 0.22; c.lineTo(x, y); } c.strokeStyle = 'rgba(30,32,48,.55)'; c.lineWidth = Math.max(1.2, T * 0.07); c.stroke(); }
    softRing(c, X, Y, r * 0.95, T * 0.5, '#F0F2FA', 0.8); c.restore(); }
  // the crack a slam leaves down its lane: a jagged dark seam, fading
  function crackDecal(c, FX, k, T) { const a = clamp((k.life - k.t) / 1.5, 0, 1) * clamp(k.t / 0.08, 0, 1); if (a <= 0.01) return; const R = mulberry32(k.seed), d = [Math.cos(k.a), Math.sin(k.a)], e = [-d[1], d[0]];
    c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round'; let s = 0, o = 0; const pts = []; while (s < k.len) { pts.push([FX.sx(k.x + d[0] * s + e[0] * o), FX.sy(k.y + d[1] * s + e[1] * o)]); s += 0.5 + R() * 0.4; o = clamp(o + (R() - 0.5) * 0.4, -0.4, 0.4); }
    c.strokeStyle = 'rgba(30,32,48,.5)'; c.lineWidth = Math.max(1.5, T * 0.12); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.strokeStyle = 'rgba(240,242,250,.35)'; c.lineWidth = Math.max(1, T * 0.04); c.save(); c.translate(T * 0.05, T * 0.06); c.stroke(); c.restore();
    for (let i = 1; i < pts.length - 1; i += 2) { const p = pts[i], sd = R() < 0.5 ? 1 : -1, L = T * (0.3 + R() * 0.5); c.strokeStyle = 'rgba(30,32,48,.4)'; c.lineWidth = Math.max(1, T * 0.06); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + (e[0] * sd + d[0] * 0.5) * L, p[1] + (e[1] * sd + d[1] * 0.5) * L); c.stroke(); } c.restore(); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !m) return; const sx = FX.sx, sy = FX.sy, pu = 0.5 + 0.5 * Math.sin(t * 8);
    M.craters.forEach(k => craterDecal(c, sx(k.x), sy(k.y), k.r * T, clamp((k.life - k.t) / 2.5, 0, 1) * clamp(k.t / 0.1, 0, 1), k.seed, T));
    M.cracks.forEach(k => crackDecal(c, FX, k, T));
    // Moon Leap: its shadow swelling on the circle it will land on
    const L = M.lp; if (L && L.tx != null && (L.state === 'rise' || L.state === 'air')) { const u = clamp((L.age - L.t0) / (L.rise + L.show), 0, 1), X = sx(L.tx), Y = sy(L.ty), rr = L.r * T * (0.22 + 0.72 * u * u); K.shade(c, X, Y, rr * 1.1, rr * 0.9, 0.3 + 0.5 * u, '#141626');
      // its ears' shadow too, so the shape is a rabbit's
      for (const sd of [-1, 1]) K.shade(c, X + sd * rr * 0.32, Y - rr * 0.95, rr * 0.2, rr * 0.5, (0.3 + 0.5 * u) * 0.8, '#141626');
      lab(c, X, Y + L.r * T * 0.62, 'GET OUT', LEAPC, T, 0.38); }
    // Pestle Slam: its lane, the chevrons pointing the way it falls, the ring where the drum lands
    const S = M.sl; if (S && S.d && (S.state === 'shown' || S.state === 'slam')) { const k = S.state === 'shown' ? clamp((S.age - S.t0) / 0.25, 0, 1) : 1, X0 = sx(S.ox), Y0 = sy(S.oy), X1 = sx(S.ox + S.d[0] * S.len), Y1 = sy(S.oy + S.d[1] * S.len), w = S.w * T;
      c.save(); arenaClip(c, FX, T); softLine(c, X0, Y0, X1, Y1, w * 1.05, PESTC, k * (1.25 + 0.4 * pu));
      for (let s = 1.2; s < S.len - 0.6; s += 1.6) { const mv = (t * 2.2) % 1.6; chevron(c, sx(S.ox + S.d[0] * (s + mv - 0.8)), sy(S.oy + S.d[1] * (s + mv - 0.8)), S.a, T * 0.3, '#FFE0EA', k * 0.8); }
      const u = S.state === 'shown' ? clamp((S.age - S.t0) / S.wait, 0, 1) : 1; softRing(c, sx(S.bx), sy(S.by), T * 1.15, T * 0.3, '#FFFFFF', k * (0.4 + 0.5 * u)); softRing(c, sx(S.bx), sy(S.by), T * (2.6 - 1.45 * u), T * 0.22, PESTC, k * 0.7); c.restore();
      if (S.state === 'shown') lab(c, sx(S.ox + S.d[0] * S.len * 0.62), sy(S.oy + S.d[1] * S.len * 0.62) - T * 0.7, 'PESTLE', PESTC, T, 0.38); }
    // Elixir Brew: the cone it will splash, brighter as the elixir swells
    const W = M.bw; if (W && W.state === 'pound' && !W.done) { c.save(); arenaClip(c, FX, T); const u = clamp(W.pAge / W.dur, 0, 1), X = sx(W.ox), Y = sy(W.oy); softCone(c, X, Y, W.a, W.len * T, W.spread * 0.94, '#3FD6B8', 0.7 + u * 0.9); softCone(c, X, Y, W.a, W.len * T * 1.04, W.spread * 1.12, '#3FD6B8', 0.35 + u * 0.4);
      for (const sd of [-1, 1]) for (let s = 1.6; s < W.len; s += 0.75) { const a = W.a + sd * W.spread * 0.98, q = [X + Math.cos(a) * s * T, Y + Math.sin(a) * s * T]; c.fillStyle = rgba(ELIX_HI, (0.25 + 0.5 * u) * (1 - s / W.len * 0.6)); c.beginPath(); c.arc(q[0], q[1], Math.max(1.2, T * 0.07), 0, TAU); c.fill(); }
      const fr = W.len * T * (0.25 + 0.75 * u); c.save(); c.globalAlpha = 0.5 + 0.4 * pu; c.strokeStyle = rgba(ELIX_HI, 0.7); c.lineWidth = Math.max(1.5, T * 0.06); c.lineCap = 'round'; c.beginPath(); c.arc(X, Y, fr, W.a - W.spread * 0.9, W.a + W.spread * 0.9); c.stroke(); c.restore();
      c.restore(); lab(c, X + Math.cos(W.a) * W.len * T * 0.6, Y + Math.sin(W.a) * W.len * T * 0.6, 'ELIXIR', ELIXC, T, 0.38); }
    // Mochi Shake: where each mochi drops, the lane it rolls down
    M.mochi.forEach(R => { const X0 = sx(R.S[0]), Y0 = sy(R.S[1]), X1 = sx(R.E[0]), Y1 = sy(R.E[1]), w = R.r * 2 * T, k = R.state === 'fall' ? clamp(R.t / 0.3, 0, 1) : 1, sx0 = R.state === 'roll' ? sx(R.x) : X0, sy0 = R.state === 'roll' ? sy(R.y) : Y0;
      softLine(c, sx0, sy0, X1, Y1, w * 1.05, MOCHIC, k * (1.3 + 0.35 * pu));
      const L2 = Math.hypot(X1 - sx0, Y1 - sy0) / T; for (let s = 1.4; s < L2 - 0.6; s += 1.9) { const mv = (t * 3) % 1.9; chevron(c, sx0 + Math.cos(R.a) * (s + mv) * T, sy0 + Math.sin(R.a) * (s + mv) * T, R.a, T * 0.32, '#FFF3C8', k * 0.8); }
      if (R.state === 'fall') { const u = clamp(R.t / R.fall, 0, 1); K.shade(c, X0, Y0, R.r * T * (0.5 + 0.6 * u), R.r * T * (0.4 + 0.5 * u), 0.25 + 0.45 * u, '#141626'); softRing(c, X0, Y0, (R.r + 0.6) * T, T * 0.35, MOCHIC, 0.9 + 0.3 * pu); softRing(c, X0, Y0, (R.r + 0.6) * T * (1 - u * 0.75) + T * 0.2, T * 0.2, '#FFFFFF', 0.6 * k); } });
    // the shockwave rings
    M.waves.forEach(w => { if (w.t < w.delay) return; const X = sx(w.x), Y = sy(w.y), f = clamp((AR + 1.5 - w.r) / 2, 0, 1); softRing(c, X, Y, w.r * T, w.w * T * 1.4, WAVEC, 1.15 * f); softRing(c, X, Y, w.r * T, w.w * T * 0.5, '#FFFFFF', 0.85 * f); }); }
  // the sticky elixir left by a splash: glossy pools of it shining in the cone, soft-edged
  function drawElixir(c, z, FX, T, t) { const X = FX.sx(z.x), Y = FX.sy(z.y), fade = Math.min(1, z.age / 0.25, (z.life - z.age) / 0.8), R = mulberry32(z.seed || 3); if (fade <= 0) return;
    c.save(); arenaClip(c, FX, T); c.globalAlpha = Math.max(0, fade); softCone(c, X, Y, z.a, z.len * T, z.spread * 0.94, '#3FD6B8', 1.0); softCone(c, X, Y, z.a, z.len * T * 1.04, z.spread * 1.12, '#3FD6B8', 0.45);
    for (let i = 0; i < 16; i++) { const a = z.a + (R() * 2 - 1) * z.spread * 0.85, d = (0.15 + R() * 0.8) * z.len, s = (0.6 + R() * 0.9) * T * (0.7 + d / z.len * 0.6), x = X + Math.cos(a) * d * T, y = Y + Math.sin(a) * d * T;
      c.globalAlpha = fade * (0.35 + R() * 0.15); K.shade(c, x, y, s, s * 0.7, 1, i % 3 ? '#4FE0C4' : '#2FA898'); c.globalAlpha = fade * (0.45 + 0.2 * Math.sin(t * 3 + i)); K.shade(c, x - s * 0.25, y - s * 0.2, s * 0.32, s * 0.16, 1, '#F2FFFC'); }
    c.restore(); }
  // the crater's floor, as a clip: telegraphs and puddles stay on it
  function arenaClip(c, FX, T) { c.beginPath(); c.arc(FX.sx(FX.C.x), FX.sy(FX.C.y), (FX.C.R + 0.25) * T, 0, TAU); c.clip(); }
  /* ---------- in the air: the mochi, the labels ---------- */
  function drawMochi(c, R, X, Y, T, lw) { const sq = R.sq || 0, r = R.r * T, rx = r * (1 + sq * 0.22), ry = r * (1 - sq * 0.26), yy = Y + r - ry, k = Math.cos(R.spin), s = Math.sin(R.spin), ax = R.e[0], ay = R.e[1];
    const rot = v => { const d = ax * v[0] + ay * v[1], cx = ay * v[2], cy = -ax * v[2], cz = ax * v[1] - ay * v[0]; return [v[0] * k + cx * s + ax * d * (1 - k), v[1] * k + cy * s + ay * d * (1 - k), v[2] * k + cz * s]; };
    TN.shape(c, TN.ell(X, yy, rx, ry), { col: MOCHI, shade: MOCHI_SH, shade2: '#D9CEC6', hi: MOCHI_HI, line: INK, lw, r, d1: 0.1, d2: 0.18, spec: 0.5, specAt: [X - rx * 0.35, yy - ry * 0.45], specR: 0.22, force: true, inner: g => {
      // a dusting of starch, and a pink crescent stamped on it, turning as it rolls
      MSPECK.forEach(([x, y, z, pr]) => { const v = rot([x, y, z]), f = v[1] * 0.7 + v[2] * 0.7; if (f < 0.1) return; g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(X + v[0] * rx * 0.85, yy + (v[1] * 0.7 - v[2] * 0.7) * ry * 0.85, Math.max(1, pr * r * 2.2), 0, TAU); g.fill(); });
      const v = rot([0, 0.6, 0.8]), f = v[1] * 0.7 + v[2] * 0.7; if (f > 0.05) { g.save(); g.translate(X + v[0] * rx * 0.75, yy + (v[1] * 0.7 - v[2] * 0.7) * ry * 0.75); g.scale(r * 0.28 * (0.4 + 0.6 * f), r * 0.28); crescentPath(g, 1, R.spin * 0.3); g.fillStyle = rgba('#F49AB6', 0.85); g.fill(); g.restore(); } } }); }
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.stat) return; const sx = FX.sx, sy = FX.sy, lw = Math.max(1.3, T * 0.06);
    // the mochi, falling and rolling (far ones first)
    M.mochi.slice().sort((a, b) => a.y - b.y).forEach(R => { const X = sx(R.x), Y = sy(R.y); if (R.state === 'roll') TN.groundShadow(c, X, Y + R.r * T * 0.7, R.r * T * 1.0, R.r * T * 0.4, R.z, 0.4); drawMochi(c, R, X, Y - (R.r * 0.95 + R.z) * T, T, lw); });
    // the labels: the mortar and its meter, the stuck pestle, the stagger, the warren's counter
    const P = pose(m, M), mo = mortarP(FX), MX = sx(mo.x), MY = sy(mo.y);
    const W = M.bw; if (W && W.state === 'pound' && !W.done && m.act === 'brew') { const n = W.need, w = T * 0.42, x0 = MX - (n - 1) * w / 2, yy = MY + T * 0.85; lab(c, MX, yy + T * 0.55, 'STRIKE THE MORTAR', ELIXC, T, 0.34);
      for (let i = 0; i < n; i++) { const on = i < W.hits; c.beginPath(); c.arc(x0 + i * w, yy, Math.max(3, T * 0.13), 0, TAU); c.fillStyle = on ? '#FFFFFF' : 'rgba(20,24,44,.7)'; c.fill(); c.lineWidth = 2; c.strokeStyle = on ? ELIXC : 'rgba(226,238,255,.8)'; c.stroke(); } }
    const S = M.sl; if (S && S.state === 'stuck' && m.act === 'pestle') { const b = pestle(m, M, P).head; lab(c, sx(b[0]), sy(b[1]) - b[2] * T - T * 1.1, 'STUCK FAST · strike the pestle', PESTC, T, 0.32); }
    if (m.stunT > 0) { const w = FX.S.weak.crescent, q = P.cres; if (w && !w.dead) lab(c, sx(q[0]), sy(q[1]) - q[2] * T - T * 1.05, 'CRESCENT · strike it', CRES, T, 0.36);
      const nm = M.stunKind === 'stuck' ? 'STUCK' : M.stunKind === 'cracked' ? 'REELING' : M.stunKind === 'exposed' ? 'EXPOSED' : ''; if (nm) { const h = add3(P.H0, [0, 0, HEAD.c + 1.7]); lab(c, sx(h[0]), sy(h[1]) - h[2] * T, `${nm} ${Math.ceil(m.stunT)}s`, '#FFFFFF', T, 0.42); } }
    const B = M.wr; if (B) { const q = P.Wb(BODY.u, 0, BODY.h * P.kh + BODY.c + 2.0), left = Math.max(0, B.total - B.killed); lab(c, sx(q[0]), sy(q[1]) - q[2] * T, `WARREN · ${left} left`, '#FFFFFF', T, 0.6); lab(c, sx(q[0]), sy(q[1]) - q[2] * T + T * 0.6, 'HIDDEN · clear the warren', SEALC, T, 0.32); } }
})());
