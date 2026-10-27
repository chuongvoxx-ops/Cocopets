/* ---------- XELVARA, THE COMET BROOD ----------
   The Sea of Fallen Colours' second boss, fought in the Refracting Lagoon: a round island of pale glass sand some
   twenty-nine metres across, in shallows of liquid light; glass coral, prism spires, crystal arches and light kelp ring
   its rim, rainbow caustics wander over the sand, and a ring of fused glass marks where it hovers.
   Xelvara is a cosmic jellyfish come down with the fallen colour: a dark FACETED BELL six metres wide (cel-shaded
   indigo facets, a starfield caught in them), its outer rim broken into SIX POINTED SEGMENTS, four thick WHITE
   TENTACLES hanging under it, and inside the bell's outline three luminous FRAGMENTS circling: one AMBER, one CYAN,
   one WHITE. It swims by contracting its rim segments inward, then snapping them open.
   Rim Pulse: the six segments draw in (the tell: they fold under the bell and glow), then snap open: a shockwave ring
   rolls out across the island. It has three glowing GAPS (shown before it rolls): stand in one, or roll through.
   (From half health, two pulses.)
   Fragment Volley: one fragment BRIGHTENS and comes forward; its colour names the attack (the fragment glows, an icon
   and a label float over the bell, and the telegraphs are its colour):
     AMBER · COMET SHARDS: comet shards fall on shown circles round the pet;
     CYAN · PRISM BEAMS: beams of light along shown lines out from the bell;
     WHITE · STAR ORB: a slow orb hunts the pet, then bursts on a shown circle.
   The bright fragment is a weak point while it burns: strike it enough (a meter shows how many) and it OVERLOADS: the
   volley is spent and Xelvara sinks, staggered (its damage window).
   Tentacle Slam: two of its four tentacles rear up and slam down along shown lanes (from a quarter health, the other
   two follow).
   The Comet Brood (at half health): it rises, seals itself in its bell (out of reach) and births its brood: thirty
   little comet hatchlings, six at most at once, arc out from its rim; a counter shows how many are left. Clear them and
   it is EXPOSED.
   Damage windows (exposed, or overloaded): the bell sinks low and the four tentacles REST ON THE FLOOR: their tips are
   weak points (twice the blow) and the CORE, where the fragments gather in the bell, two and a half times.
   The Comet Storm (a quarter health): everything faster, two fragments to each volley, two waves of tentacles.
   Between acts it swims back toward the island's middle. It is never still: the bell bobs and sways, the rim pulses
   as it swims, the fragments circle, the tentacles drift, and it jolts when struck. */
RiftFiend.define({ id: 'xelvara', hpK: 1.25, dmgK: 1.25, name: 'Xelvara', title: 'The Comet Brood', color: '#2A2F5A', glow: '#9FE8FF', accent: '#FFE6B0', biome: 'prismreef', r: 3.0, els: ['light', 'cosmic'], phases: 3, cuts: [1, 0.5, 0.25] }, (() => {
  const { TAU, TN } = RiftFiend, K = DunFiend.KIT, rgba = TN.rgba, HUE = COL.HUE;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u;
  const smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const mix = (a, b, u) => K.mixC(a, b, clamp(u, 0, 1));
  const sfx = (FX, k) => { const f = FX.H.sfx && FX.H.sfx[k]; if (f) f(); };
  // the palette: an indigo bell of cel-shaded facets with a cyan rim light; white tentacles shaded cool lavender
  const INK = '#0E0C24', BELL_T = ['#151935', '#222852', '#313A72', '#4A579E'], BELL_RIM = '#2E6A9C', BELL_IN = '#14122E', BELL_IN2 = '#231C4A', EDGE = 'rgba(150,175,255,.30)';
  const TENT = '#F4F6FF', TENT_SH = '#C6CCE8', TENT_SH2 = '#B0B8DC', TENT_HI = '#FFFFFF', TENT_GLOW = '#B8A8FF';
  const AMB = '#FFB347', AMB_HI = '#FFE6B0', CYA = '#5FEFFF', CYA_HI = '#D8FCFF', WHT = '#F4F2FF', WHT_HI = '#FFFFFF';
  // the three fragments: what each brightening means, and the colour its telegraphs are drawn in on the pale sand
  const FRAG = [
    { key: 'amber', name: 'AMBER', act: 'COMET SHARDS', col: AMB, hi: AMB_HI, deep: '#C8650E', tel: '#EE7E12', sub: 'Comet shards fall on the shown circles: get out of them' },
    { key: 'cyan', name: 'CYAN', act: 'PRISM BEAMS', col: CYA, hi: CYA_HI, deep: '#1590B4', tel: '#0E9CC0', sub: 'Beams of light along the shown lines: stand between them' },
    { key: 'white', name: 'WHITE', act: 'STAR ORB', col: WHT, hi: WHT_HI, deep: '#8C8CD8', tel: '#6C5CE8', sub: 'A star orb hunts you: keep clear of it, then get out of its circle' }];
  const PULSE_T = '#7A48E8', PULSE_HI = '#E8DCFF', GAP_T = '#10B884', SLAM_T = '#E8406E', SLAM_HI = '#FFD0DC', SEALC = '#D8D0FF', DANGER = '#FF5C7A';
  // the island and the body (metres): the bell's rim radius and dome height, the camera's tilt for the rigid bell (a
  // horizontal circle is seen squashed to FLAT, heights at VK), the heights it hovers at
  const AR = 14.5, HOME = [0, -1.2], BR = 3.0, DH = 2.35, FLAT = 0.42, VK = 0.91, ALT = 3.7, ALT_REST = 1.3, ALT_BROOD = 5.6;
  const VC = [0, 0.908, 0.419], LT = (() => { const v = [-0.5, 0.42, 0.76], l = Math.hypot(v[0], v[1], v[2]); return v.map(q => q / l); })();
  const PHI = [0, 0.46, 0.92, 1.28], NLON = 12;
  // the six rim segments (one points at the camera), how far each folds: open, at rest, shut tight under the bell, limp
  const SEG_N = 6, SEG_L = 1.6, SEG_HW = 0.45, F_REST = 0.62, F_OPEN = -0.08, F_SHUT = 2.1, F_LIMP = 1.15;
  const SEG_A = Array.from({ length: SEG_N }, (_, j) => Math.PI / 2 + j * TAU / SEG_N);
  // the four tentacles: their roots under the bell, where each lies on the floor when it rests, their widths
  const ROOT_A = [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75], ROOT_R = 1.05, REST_A = [0.95, 2.19, 2.99, 0.15], REST_R0 = 1.9, REST_R1 = 5.1, TW0 = 0.92, TW1 = 0.44, TNN = 11;
  const FRAG_R = 1.45, FRAG_Z = 0.9, FRAG_FRONT = [0, 1.55, 0.55], CORE = [0, 0.5, 0.95];
  const LANE_L = 10.5, LANE_W = 2.2, BEAM_L = 17, BEAM_W = 1.4, COMET_R = 1.55, ORB_R = 2.4, WAVE_W = 1.1, GAP_W = 0.17;
  const BROOD_N = 30, BROOD_CAP = 6;
  const CYC1 = ['volley', 'pulse', 'slam', 'volley', 'slam', 'pulse'], CYC2 = ['volley', 'slam', 'pulse', 'volley', 'pulse', 'slam'];
  const fastK = FX => (1 + (FX.S.lv - 1) * 0.12) * FX.S.fast;
  // stars caught in the bell's facets: (longitude, elevation, size)
  const BSTARS = (() => { const R = mulberry32(915), out = []; for (let i = 0; i < 18; i++) out.push([R() * TAU, 0.12 + R() * 1.25, 0.5 + R() * 0.8, R() * 6]); return out; })();
  const norm3 = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const toneOf = k => k < -0.05 ? 0 : k < 0.33 ? 1 : k < 0.66 ? 2 : 3;

  /* ---- the brood: little comet hatchlings arcing out of its rim; they zip at the pet in short streaks and nip ---- */
  Object.assign(MON, { comethatch: { name: 'Comet hatchling', from: 999, hp: 160, spd: 2.4, r: 0.46, dmg: 12, xp: 6, coin: 0.3, color: AMB, bio: [], fly: true, tip: 'One of Xelvara\'s brood: a little comet with a glowing tail. It zips at you in short streaks and nips.', kit: [] } });
  Object.assign(DunAI.mon, { comethatch(m, A, X) {
    m.bob = (m.bob || Math.random() * 6) + A.dt;
    if (m.launch) { const L = m.launch; L.t += A.dt; const u = clamp(L.t / L.dur, 0, 1); m.x = lerp(L.x0, L.x1, u); m.y = lerp(L.y0, L.y1, u); m.z = lerp(L.z0, 0.2, u) + Math.sin(u * Math.PI) * L.h; m.mode = 'dash'; m.face = L.x1 >= L.x0 ? 1 : -1;
      if (u >= 1) { m.launch = null; m.z = 0.2; m.under = false; m.mode = null; X.ring(m.x, m.y, 0.15, 0.9, 0.3, m.color || AMB, 0.3); } return; }
    if (m.zipT > 0) { m.zipT -= A.dt; m.mode = 'dash'; X.moveEnt(m, m.zvx * A.dt, m.zvy * A.dt); m.face = m.zvx >= 0 ? 1 : -1; if (m.zipT <= 0) { m.mode = null; m.cd = 0.45 + Math.random() * 0.6; } }
    else { m.mode = null; m.face = A.dx >= 0 ? 1 : -1; if (m.cd <= 0) { const s = clamp(A.d - 0.1, 0.8, 2.8), a = A.a + (Math.random() - 0.5) * 0.5, T = 0.32; m.zipT = T; m.zvx = Math.cos(a) * s / T; m.zvy = Math.sin(a) * s / T; } else if (A.d > 1.2) A.steer(A.sp * 0.35); }
    // (it hovers just off the sand: low enough to nip)
    m.z = 0.2 + Math.sin(m.bob * 5) * 0.05; } });
  { const { lwOf, MP, EXT, NF, LN } = DunArt;
    /* a comet hatchling facing right: an icy round nucleus with big eyes and a fang, a glowing coma, a tail of its
       colour streaming behind (longer as it zips) */
    MP.comethatch = (c, r, ph, o) => { const lw = lwOf(r), dash = o.mode === 'dash' ? 1 : 0, col = o.color || AMB, wob = Math.sin(ph * TAU), L = r * (2.0 + dash * 1.1 + wob * 0.12);
      c.fillStyle = 'rgba(10,40,52,.2)'; c.beginPath(); c.ellipse(0, r * 0.95, r * 0.6, r * 0.16, 0, 0, TAU); c.fill();
      c.save(); c.translate(0, -r * 0.3);
      // the tail: soft streams, each feathered (a wide faint pass under a narrow brighter one)
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 3; k++) { const yo = (k - 1) * r * 0.26 + wob * r * 0.05 * (k - 1), len = L * (1 - Math.abs(k - 1) * 0.28);
        for (const [wk, al] of [[1.0, 0.28], [0.55, 0.55]]) { const g = c.createLinearGradient(-r * 0.2, 0, -len, 0); g.addColorStop(0, rgba(col, al)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.moveTo(-r * 0.05, yo - r * 0.36 * wk); c.quadraticCurveTo(-len * 0.45, yo - r * 0.22 * wk, -len, yo + wob * r * 0.1); c.quadraticCurveTo(-len * 0.45, yo + r * 0.22 * wk, -r * 0.05, yo + r * 0.36 * wk); c.closePath(); c.fill(); } }
      c.globalAlpha = 0.65; blitSized(c, glowSprite(col), -r * 1.6, -r * 1.6, r * 3.2, r * 3.2); c.restore();
      // the nucleus: pale ice, its colour in the shading
      TN.shape(c, TN.ell(0, 0, r * (0.62 + dash * 0.06), r * (0.6 - dash * 0.05)), { col: mix('#F2F8FF', col, 0.22), shade: mix(col, '#DCE6F4', 0.3), shade2: mix(col, '#9AA8C8', 0.3), hi: '#FFFFFF', line: LN, lw, r: r * 0.6, d1: 0.12, d2: 0.2, spec: 0.6, specAt: [-r * 0.22, -r * 0.24], force: true });
      // the face: big dark eyes with a glint, a frown of brows, a little fang
      for (const ex of [0.12, 0.38]) { c.fillStyle = '#1A1838'; c.beginPath(); c.ellipse(r * ex, -r * 0.05, r * 0.11, r * 0.15, 0, 0, TAU); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(r * (ex - 0.03), -r * 0.11, r * 0.04, 0, TAU); c.fill(); }
      c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.lineCap = 'round'; c.beginPath(); c.moveTo(r * 0.02, -r * 0.27); c.lineTo(r * 0.2, -r * 0.2); c.moveTo(r * 0.3, -r * 0.2); c.lineTo(r * 0.5, -r * 0.28); c.stroke();
      c.beginPath(); c.moveTo(r * 0.14, r * 0.2); c.quadraticCurveTo(r * 0.27, r * 0.27, r * 0.42, r * 0.18); c.stroke();
      c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(r * 0.3, r * 0.22); c.lineTo(r * 0.36, r * 0.21); c.lineTo(r * 0.33, r * 0.31); c.closePath(); c.fill();
      c.restore(); };
    Object.assign(EXT, { comethatch: 3.4 }); Object.assign(NF, { comethatch: 4 }); }

  return {
    arenaR: AR, firstAct: 'drift', artY: 0.86, ambient: 'motes',
    artPoses: [{ name: 'hovering, the fragments circling', mem: {} }, { name: 'a volley: the amber fragment bright', mem: { br: [1, 0, 0] } }, { name: 'rim pulse: segments drawn in', mem: { c: 1 } }, { name: 'the brood: sealed', mem: { seal: 1, c: 1, alt: ALT_BROOD } }, { name: 'resting: tentacles on the floor', mem: { rest: 1, alt: ALT_REST } }, { name: 'tentacles reared to slam', mem: { tent: [{ st: 'lift', k: 1, a: 1.2, t: 0 }, null, null, { st: 'lift', k: 1, a: 0.3, t: 0 }] } }],
    phaseNames: ['The Refracting Lagoon', 'The Comet Brood', 'The Comet Storm'],
    start(C) { return { x: C.x + 0.5, y: C.y + 8.5 }; },
    props(C) { const out = [], R = mulberry32(6150), kinds = ['glasscoral', 'prismspire', 'lightkelp', 'crystalarch', 'glassurchin', 'glasscoral', 'lightkelp', 'prismspire'];
      for (let i = 0; i < 22; i++) { const a = i / 22 * TAU + (R() - 0.5) * 0.16, far = Math.sin(a) < 0.15, s = far ? 1.05 + R() * 0.45 : 0.7 + R() * 0.25; out.push({ kind: kinds[i % kinds.length], i, v: i, s, x: C.x + Math.cos(a) * (AR + 0.7 + s * 0.4), y: C.y + Math.sin(a) * (AR + 0.6 + s * 0.3) }); }
      return out; },
    propKeep: { every: 30, box: p => [-1.7 * p.s, -4.6 * p.s, 1.7 * p.s, 0.6 * p.s] },
    drawProp(c, FX, p, X, Y, T) { const f = DunWorld.PROPS[p.kind]; if (!f) return; c.translate(X, Y); f(c, T * p.s, p.v); },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T) { paintSky(c, W, H, T); },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, h = homeP(FX); m.noTouch = true; m.x = h.x; m.y = h.y; m.act = 'enter';
      Object.assign(M, { home: h, bt: 0, alt: 15, c: 0, dc: 0, cHold: null, swimT: 0, surge: 0, fo: 0, br: [0, 0, 0], rest: 0, seal: 0, recoil: 0, hitK: 0, flare: 0, coreHit: 0, fragHit: 0, tipHit: [0, 0, 0, 0],
        tent: [null, null, null, null], rp: null, fv: null, ts: null, bd: null, waves: [], beams: [], orb: null, scorch: [], cracks: [], picks: 0, nextAct: null, nextCol: null, fbag: [], last: null, seen: {}, taught: false, roared: false, wasStun: false, wasEnter: true, stunKind: null, stunWas: null, trickleT: 14,
        stat: { pulses: 0, waves: 0, waveHit: 0, wavePass: 0, waveGap: 0, waveRoll: 0, volleys: 0, vol: { amber: 0, cyan: 0, white: 0 }, comets: 0, cometHit: 0, cometMiss: 0, beams: 0, beamHit: 0, beamMiss: 0, orbs: 0, orbTouch: 0, orbHit: 0, orbMiss: 0, fragHits: 0, overloads: 0,
          slamActs: 0, slams: 0, slamHit: 0, slamMiss: 0, brood: 0, spawned: 0, killed: 0, exposed: 0, homeDrifts: 0 } }); },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; endAll(FX, m, M); m.stunT = 0; M.recoil = 0.8; M.flare = 1;
      if (lv === 2) { startBrood(FX, m); FX.H.after(0.9, () => FX.H.banner('THE COMET BROOD', `It seals itself in its bell and births its brood: clear all ${BROOD_N} comet hatchlings and it is EXPOSED`, CYA_HI, 3.0, true)); }
      if (lv >= 3) FX.H.after(0.9, () => FX.H.banner('THE COMET STORM', 'Faster now · two fragments to each volley · two waves of tentacles', AMB_HI, 2.8, true)); },
    ai(FX, m, dt) {
      const M = FX.mem, F = fastK(FX); m.actT += dt; m.noTouch = true;
      switch (m.act) {
        case 'drift': { const far = drift(FX, m, M, dt); if (!far && m.actT > (FX.S.lv >= 3 ? 1.1 : 1.5) / F) { m.actT = 0; choose(FX, m); } break; }
        case 'pulse': pulseStep(FX, m, M, dt, F); break;
        case 'volley': volleyStep(FX, m, M, dt, F); break;
        case 'slam': slamStep(FX, m, M, dt, F); break;
        case 'brood': broodStep(FX, m, M, dt); break;
        default: endAct(m);
      }
      // the bright fragment is a weak point while its volley burns
      const V = M.fv; if (m.act === 'volley' && V && !V.done && V.state !== 'end') { const q = fragWorld(FX, m, M, V.i); FX.weak('frag', q[0], q[1], 1.05, 1.5, true); }
      else if (FX.S.weak.frag) FX.weak('frag', 0, 0, 0, 0, false);
      restWeak(FX, m, M, false);
      if (!m.under) FX.parts(bodyParts(FX, m, M));
    },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; if (FX.S.weak.frag) FX.weak('frag', 0, 0, 0, 0, false);
      restWeak(FX, m, M, m.stunT > 0.05 && M.rest > 0.5);
      M.kickT = (M.kickT || 0) - dt; if (M.kickT <= 0) { M.kickT = 0.24 + Math.random() * 0.2; const P = pose(FX, m, M), q = P.pj(P.rot(CORE[0], CORE[1], CORE[2])), a = Math.random() * TAU, col = FRAG[Math.floor(Math.random() * 3)].col;
        FX.H.part({ kind: 'spark', x: m.x + q[0] + Math.cos(a) * 0.5, y: m.y + q[1], vx: Math.cos(a) * 1.5, vy: -1.2, drag: 0.6, life: 0.6, max: 0.6, size: 2.4, color: col }); }
      FX.parts(bodyParts(FX, m, M)); },
    update(FX, dt) { const M = FX.mem, m = FX.m; if (!m || !M.stat) return; M.bt += dt; const stun = m.stunT > 0;
      if (!stun) { if (M.wasStun) { M.wasStun = false; M.recoil = 0.6; FX.H.text(m.x, m.y - 6.5, M.stunWas === 'exposed' ? 'It gathers itself and rises' : 'It rises, its fragments rekindled', CYA_HI, 13); sfx(FX, 'whoosh'); M.stunKind = null; } }
      else M.wasStun = true;
      M.recoil = decay(M.recoil, dt, 2.4); M.hitK = decay(M.hitK, dt, 4); M.flare = decay(M.flare, dt, 1.6); M.coreHit = decay(M.coreHit, dt, 3); M.fragHit = decay(M.fragHit, dt, 4); for (let i = 0; i < 4; i++) M.tipHit[i] = decay(M.tipHit[i], dt, 4);
      // the entrance: down out of the light, its rim snapping open as it arrives
      if (m.act === 'enter') { const e = FX.S.enterT || 0, u = clamp(e / 2.0, 0, 1); M.alt = lerp(15, ALT, 1 - Math.pow(1 - u, 3)); M.cHold = { w: u < 0.85 ? 0.7 : -1, k: u < 0.85 ? 3 : 12, t: M.bt };
        if (e > 1.9 && !M.roared) { M.roared = true; M.flare = 1; sfx(FX, 'crash'); sfx(FX, 'hum'); FX.H.shake(9, 0.4); FX.H.ring(m.x, m.y, 0.5, 8, 0.8, PULSE_HI, 0.35); sparkle(FX, m.x, m.y - ALT - 1.5, 24); } }
      else if (M.wasEnter) M.wasEnter = false;
      // the first lesson, once it is swimming
      if (!M.taught && m.act === 'drift') { M.taught = true; m.actT = -2.6; FX.H.banner('XELVARA', 'Its brightening fragment names the attack: AMBER comets · CYAN beams · WHITE orb. Strike the bright fragment to overload it', CYA_HI, 3.2, true); }
      // its height: high and sealed in the brood, low when it rests, else hovering
      if (m.act !== 'enter') M.alt = toward(M.alt, stun ? ALT_REST : m.act === 'brood' ? ALT_BROOD : ALT, dt, stun ? 3.2 : 1.8);
      M.rest = toward(M.rest, stun ? 1 : 0, dt, stun ? 3.0 : 2.2);
      M.seal = toward(M.seal, m.act === 'brood' ? 1 : 0, dt, 2.5);
      // the rim: what an act holds it to, else it swims (draw in, snap open, glide)
      const H = M.cHold && M.bt - M.cHold.t < 0.12 ? M.cHold : null; let cW = 0, ck = 2;
      if (stun) { cW = -0.2; ck = 2; M.surge = 0; }
      else if (m.act === 'brood') { cW = 1; ck = 3; }
      else if (H) { cW = H.w; ck = H.k; }
      else { M.swimT += dt; const per = 1.9, u = (M.swimT % per) / per; if (u < 0.38) { cW = 0.5; ck = 3.2; } else if (u < 0.5) { cW = -0.75; ck = 11; } else { cW = 0; ck = 2.0; } M.surge = toward(M.surge, u >= 0.38 && u < 0.72 ? 1 : 0.15, dt, 5); }
      const c0 = M.c; M.c = toward(M.c, cW, dt, ck); M.dc = dt > 1e-4 ? (M.c - c0) / dt : 0;
      // the fragments circle (faster when sealed); the bright one comes forward
      M.fo += dt * (0.75 + M.seal * 1.6);
      const V = M.fv; for (let i = 0; i < 3; i++) M.br[i] = toward(M.br[i], V && V.i === i && !V.done && V.state !== 'end' ? 1 : 0, dt, V && V.i === i ? 5 : 3);
      if ((m.hitSq || 0) > 0.5) M.recoil = Math.max(M.recoil, 0.35);
      updWaves(FX, m, M, dt); updOrb(FX, m, M, dt);
      M.beams = M.beams.filter(b => (b.t += dt) < b.life); M.scorch = M.scorch.filter(s => (s.t += dt) < s.life); M.cracks = M.cracks.filter(s => (s.t += dt) < s.life);
      // from half health a few of its brood arc out now and then
      if (FX.S.lv >= 2 && m.act === 'drift' && !stun && (M.trickleT -= dt) <= 0) { M.trickleT = 15; const n = FX.H.mons.filter(q => !q.dead && !q.horde && q.type === 'comethatch').length;
        if (n < 2) { hatch(FX, m, M, false); hatch(FX, m, M, false); FX.H.text(m.x, m.y - ALT - 3.2, 'Hatchlings arc out of its rim', CYA_HI, 13); sfx(FX, 'pop'); } } },
    dmgK(FX, m) { const M = FX.mem; if (M) { M.recoil = Math.max(M.recoil || 0, 0.3); M.hitK = 1; } return 1; },
    onWeakHit(FX, key) { const M = FX.mem, m = FX.m; if (!M) return;
      if (key === 'core') { M.coreHit = 1; M.recoil = Math.max(M.recoil || 0, 0.5); return; }
      if (key.slice(0, 3) === 'tip') { const i = +key.slice(3); if (i >= 0 && i < 4) M.tipHit[i] = 1; return; }
      if (key !== 'frag') return; M.fragHit = 1; M.stat.fragHits++; const V = M.fv; if (m && m.act === 'volley' && V && !V.done && V.state !== 'end') { V.hits++; if (V.hits >= V.need) overload(FX, m, M); } },
    camFocus(FX, m) { const M = FX.mem, me = FX.me; if (!M || !M.stat || m.dead) return null; if (m.act === 'enter') return { x: m.x, y: m.y - 3, k: 0.5 };
      const x = m.x, y = m.y - (M.alt || ALT) - 0.8, d = Math.hypot(x - me.x, y - me.y) || 1; return { x, y, k: Math.min(0.42, 4.2 / d) }; },
    keep: { every: 2, pad: 3 },
    draw(c, FX, m, X, Y, T, t) { Y += (m.z || 0) * T * 4; drawBell(c, FX, m, X, Y, T, t); },
    drawObj() {},
    drawFx(c, FX, T, t) { drawAir(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function homeP(FX) { return { x: FX.C.x + HOME[0], y: FX.C.y + HOME[1] }; }
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.4 : 1.2, true); }
  function sparkle(FX, x, y, n, cols) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 5; FX.H.part({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - 2, g: 5, life: 0.4 + Math.random() * 0.4, max: 0.8, size: 2 + Math.random() * 1.5, color: cols ? cols[i % cols.length] : i % 4 === 3 ? '#FFFFFF' : FRAG[i % 3].col }); } }
  function glassBits(FX, x, y, n, col) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 4; FX.H.part({ kind: 'shard', x, y: y - 0.2, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 3.2, g: 11, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 2.2 + Math.random() * 2.5, rot: Math.random() * 3, vr: 6, color: i % 3 ? col : '#FFFFFF' }); } }
  function endAct(m) { m.act = 'drift'; m.actT = 0; }
  // (an act's pull on the rim: w the contraction it wants, k how fast; it lapses unless renewed)
  function hold(M, w, k, ahead) { M.cHold = { w, k, t: M.bt + (ahead || 0) }; }
  // (telegraphs are disarmed, not spliced out: one may be landing in the very loop that called this)
  function cancelTele(FX) { FX.S.tele.forEach(s => { s.dmg = 0; s.fn = null; s.done = true; s.linger = 0; }); }
  function endAll(FX, m, M) { cancelTele(FX); M.rp = null; M.fv = null; M.ts = null; M.waves = []; M.beams = []; M.orb = null; M.tent = [null, null, null, null];
    if (M.bd) { M.bd = null; FX.untarget(false); } if (m) endAct(m); }
  function choose(FX, m) { const M = FX.mem, P = FX.S.lv; let k = M.nextAct; M.nextAct = null;
    if (!k) { const cyc = P >= 2 ? CYC2 : CYC1; k = cyc[M.picks % cyc.length]; M.picks++; }
    M.last = k; ({ pulse: startPulse, volley: startVolley, slam: startSlam })[k](FX, m); }
  /* ---- between acts: it swims back toward the island's middle (edging a little after the pet), the rim pulsing ---- */
  function drift(FX, m, M, dt) { const h = M.home, me = FX.me, tx = h.x + clamp((me.x - h.x) * 0.12, -1.5, 1.5), ty = h.y + clamp((me.y - h.y) * 0.08, -0.8, 0.8), dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy);
    const far = Math.hypot(m.x - h.x, m.y - h.y) > 2.4; if (far && !M.wasFar) M.stat.homeDrifts++; M.wasFar = far;
    const v = (far ? 3.0 : 1.0) * (0.35 + 1.4 * (M.surge || 0));
    if (d > 0.04) { const s = Math.min(d, v * dt); m.x += dx / d * s; m.y += dy / d * s; }
    return far; }

  /* ---- Rim Pulse: the segments draw in (shown: a ring of where it will roll, three gaps), then snap open ---- */
  function newGaps(FX, m) { const me = FX.me, ap = Math.atan2(me.y - m.y, me.x - m.x), off = (0.32 + Math.random() * 0.26) * (Math.random() < 0.5 ? 1 : -1), g0 = ap + off; return [g0, g0 + TAU / 3, g0 - TAU / 3]; }
  function startPulse(FX, m) { const M = FX.mem, P = FX.S.lv, F = fastK(FX); m.act = 'pulse'; m.actT = 0;
    M.rp = { n: P >= 2 ? 2 : 1, k: 0, state: 'draw', t: 0, dur: 1.25 / F, gaps: newGaps(FX, m), next: 0, endT: 0 }; M.stat.pulses++; sfx(FX, 'hum');
    say(FX, 'pulse', 'RIM PULSE', P >= 2 ? 'Its rim draws in, then snaps open twice: two shockwave rings roll out · stand in a GAP, or roll through' : 'Its six rim segments draw in... then snap open: a shockwave ring rolls out · stand in a GAP, or roll through', PULSE_HI); }
  function pulseStep(FX, m, M, dt, F) { const R = M.rp; if (!R) { endAct(m); return; } R.t += dt;
    if (R.state === 'draw') { hold(M, 1, 2.6 / R.dur); if (R.t >= R.dur) snapPulse(FX, m, M, R, F); return; }
    if (R.state === 'gap') { R.next -= dt; if (R.next <= 0) { if (R.k < R.n) { R.state = 'draw'; R.t = 0; R.dur = 1.0 / F; R.gaps = newGaps(FX, m); sfx(FX, 'hum'); } else R.state = 'end'; } return; }
    if (!M.waves.length) { R.endT += dt; if (R.endT > 0.35) { M.rp = null; endAct(m); } } }
  function snapPulse(FX, m, M, R, F) { R.k++; R.state = 'gap'; R.next = 0.7 / F; hold(M, -1, 16, 0.22); M.flare = 1; M.stat.waves++;
    M.waves.push({ x: m.x, y: m.y, r: 0.8, v: 6.4 * F, w: WAVE_W, gaps: R.gaps.slice(), gw: GAP_W, t: 0, hit: false, passed: false, dodged: false, gap: false });
    sfx(FX, 'whoosh'); sfx(FX, 'crash'); FX.H.shake(8, 0.3); }
  function updWaves(FX, m, M, dt) { const me = FX.me;
    for (const w of M.waves) { w.t += dt; w.r += w.v * dt;
      const d = Math.hypot(me.x - w.x, me.y - w.y), a = Math.atan2(me.y - w.y, me.x - w.x), inGap = w.gaps.some(g => Math.abs(angTo(g, a)) < w.gw);
      if (!w.hit && !w.passed && !me.dead) { if (Math.abs(d - w.r) < w.w / 2 + me.r * 0.4) { if (inGap) w.gap = true; else if (me.dodge || me.leap) w.dodged = true; else { w.hit = true; M.stat.waveHit++; FX.hurt(m.dmg * 1.1); FX.H.text(me.x, me.y - 1.6, 'The rim pulse!', DANGER, 13); me.push = { vx: (me.x - w.x) / (d || 1) * 8, vy: (me.y - w.y) / (d || 1) * 8, t: 0.2 }; } }
        else if (w.r - w.w / 2 > d + me.r * 0.4) { w.passed = true; M.stat.wavePass++; if (w.gap) { M.stat.waveGap++; FX.H.text(me.x, me.y - 1.6, 'Through the gap!', '#9CFFD8', 13); } else if (w.dodged) { M.stat.waveRoll++; FX.H.text(me.x, me.y - 1.6, 'Rolled through!', '#9CFFD8', 13); } } } }
    M.waves = M.waves.filter(w => w.r < AR + 3); }

  /* ---- Fragment Volley: a fragment brightens and comes forward; its colour names the attack ---- */
  function pickCol(M) { if (!M.fbag.length) { M.fbag = [0, 1, 2].sort(() => Math.random() - 0.5); if (M.fbag[M.fbag.length - 1] === M.lastCol) M.fbag.unshift(M.fbag.pop()); } return M.fbag.pop(); }
  function startVolley(FX, m, col) { const M = FX.mem, P = FX.S.lv, F = fastK(FX); m.act = 'volley'; m.actT = 0;
    const i = col != null ? col : M.nextCol != null ? M.nextCol : pickCol(M); M.nextCol = null; M.lastCol = i;
    M.fv = { i, state: 'tell', t: 0, tell: 1.2 / F, hits: 0, need: P >= 3 ? 7 : 6, done: false, teles: [], seq: col == null && P >= 3 ? 1 : 0 }; M.stat.volleys++; M.stat.vol[FRAG[i].key]++; sfx(FX, 'chime');
    const f = FRAG[i], first = !M.seen.volley; M.seen.volley = true; say(FX, 'vol' + i, `${f.name} · ${f.act}`, f.sub + (first ? ' · strike the BRIGHT fragment to overload it' : ''), f.col); }
  function volleyStep(FX, m, M, dt, F) { const V = M.fv; if (!V) { endAct(m); return; } V.t += dt;
    if (V.state === 'tell') { hold(M, 0.3, 3); if (V.t >= V.tell) { V.state = 'fire'; V.t = 0; fireVolley(FX, m, M, V, F); } return; }
    if (V.state === 'fire') { const live = V.teles.some(s => !s.done && FX.S.tele.includes(s)) || (M.orb && M.orb.v === V); if (!live) { V.state = 'end'; V.t = 0; } return; }
    if (V.t > 0.5 / F) { if (V.seq > 0) { const nx = (V.i + 1 + Math.floor(Math.random() * 2)) % 3; startVolley(FX, m, nx); } else { M.fv = null; endAct(m); } } }
  function fireVolley(FX, m, M, V, F) { const me = FX.me, P = FX.S.lv, C = FX.C;
    if (V.i === 0) {
      // amber: comet shards on circles round the pet, the first on it (a step ahead of it), falling one after another
      const n = P >= 2 ? 7 : 5, first = FX.clampArena({ x: me.x + (me.vx || 0) * 0.25, y: me.y + (me.vy || 0) * 0.25 }, 1.2), pts = [[first.x, first.y]];
      for (let k = 0; pts.length < n && k < 90; k++) { const a = Math.random() * TAU, d = 2.4 + Math.random() * 4.2, x = me.x + Math.cos(a) * d, y = me.y + Math.sin(a) * d; if (!FX.inArena(x, y, 1.2)) continue; if (pts.some(q => Math.hypot(q[0] - x, q[1] - y) < 2.7)) continue; pts.push([x, y]); }
      pts.forEach(([x, y], k) => { const s = FX.tele({ shape: 'fn', kind: 'comet', x, y, r: COMET_R, t: (1.3 + k * 0.17) / F, dmg: 0, seed: Math.random() * 9, test: (px, py, rr) => Math.hypot(px - x, py - y) < COMET_R + rr, fn: s2 => cometLand(FX, M, s2) }); V.teles.push(s); M.stat.comets++; });
      sfx(FX, 'whoosh'); }
    else if (V.i === 1) {
      // cyan: beams along lines out from the bell, one through the pet, the others fanned beside it
      const a0 = Math.atan2(me.y - m.y, me.x - m.x), as = P >= 2 ? [a0, a0 + 0.8, a0 - 0.8, a0 + Math.PI] : [a0, a0 + 0.8, a0 - 0.8];
      as.forEach(a => { const ox = m.x + Math.cos(a) * 0.3, oy = m.y + Math.sin(a) * 0.3, ca = Math.cos(a), sa = Math.sin(a);
        const s = FX.tele({ shape: 'fn', kind: 'beam', x: ox, y: oy, a, len: BEAM_L, w: BEAM_W, t: 1.4 / F, dmg: 0, test: (px, py, rr) => { const rx = px - ox, ry = py - oy, al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca); return al > -rr && al < BEAM_L + rr && of < BEAM_W / 2 + rr; }, fn: s2 => beamFire(FX, M, s2, V) }); V.teles.push(s); M.stat.beams++; });
      sfx(FX, 'hum'); }
    else {
      // white: a star orb drops from the bell and hunts the pet, slowly; then it locks and bursts on its circle
      const P0 = pose(FX, m, M), q = P0.pj(P0.rot(FRAG_FRONT[0], FRAG_FRONT[1], FRAG_FRONT[2]));
      M.orb = { x: m.x, y: m.y + 0.6, z: -q[1] - 0.6, t: 0, hunt: (P >= 2 ? 3.6 : 4.2) / FX.S.fast, spd: 2.3 * F, r: ORB_R, state: 'hunt', tick: 0, tele: null, v: V }; M.stat.orbs++;
      sfx(FX, 'chime'); } }
  function cometLand(FX, M, s) { const me = FX.me, m = FX.m; if (!m || m.dead) return; const inside = Math.hypot(me.x - s.x, me.y - s.y) < s.r + me.r * 0.5 && !me.dodge && !me.dead;
    if (inside) { M.stat.cometHit++; FX.hurt(m.dmg * 1.15); } else M.stat.cometMiss++;
    sfx(FX, 'thud'); FX.H.shake(4, 0.15); glassBits(FX, s.x, s.y, 9, AMB); FX.H.ring(s.x, s.y, 0.3, s.r + 0.6, 0.35, AMB, 0.3); M.scorch.push({ x: s.x, y: s.y, r: s.r * 0.8, t: 0, life: 4, seed: Math.random() * 9 }); }
  function beamFire(FX, M, s, V) { const me = FX.me, m = FX.m; if (!m || m.dead) return; const inside = s.test(me.x, me.y, me.r * 0.4) && !me.dodge && !me.dead;
    if (inside) { M.stat.beamHit++; FX.hurt(m.dmg * 1.2); } else M.stat.beamMiss++;
    M.beams.push({ x: s.x, y: s.y, a: s.a, t: 0, life: 0.5, v: V }); sfx(FX, 'crack'); FX.H.shake(3, 0.12); M.flare = Math.max(M.flare, 0.5); }
  function updOrb(FX, m, M, dt) { const O = M.orb, me = FX.me; if (!O) return; O.t += dt; O.z = toward(O.z, 1.0, dt, 2.5);
    if (O.state === 'hunt') { const dx = me.x - O.x, dy = me.y - O.y, d = Math.hypot(dx, dy); if (d > 0.05) { const s = Math.min(d, O.spd * dt); O.x += dx / d * s; O.y += dy / d * s; } const p = FX.clampArena({ x: O.x, y: O.y }, 1.0); O.x = p.x; O.y = p.y;
      // (its touch stings, now and then)
      O.tick -= dt; if (O.tick <= 0 && d < 0.75 + me.r && !me.dodge && !me.dead) { O.tick = 0.6; M.stat.orbTouch++; FX.hurt(m.dmg * 0.45); }
      if (O.t >= O.hunt) { O.state = 'lock'; O.lockT = 0; const x = O.x, y = O.y, r = O.r; O.tele = FX.tele({ shape: 'fn', kind: 'orb', x, y, r, t: 1.05 / FX.S.fast, dmg: 0, test: (px, py, rr) => Math.hypot(px - x, py - y) < r + rr, fn: s => orbBurst(FX, M, s) }); if (O.v) O.v.teles.push(O.tele); sfx(FX, 'hum'); } }
    else if (O.state === 'lock') { O.lockT += dt; if (O.tele && O.tele.done && !FX.S.tele.includes(O.tele) && O.lockT > 1.3) M.orb = null; } }
  function orbBurst(FX, M, s) { const me = FX.me, m = FX.m; if (!m || m.dead) return; const inside = Math.hypot(me.x - s.x, me.y - s.y) < s.r + me.r * 0.5 && !me.dodge && !me.dead;
    if (inside) { M.stat.orbHit++; FX.hurt(m.dmg * 1.5); } else M.stat.orbMiss++;
    FX.H.boom(s.x, s.y, s.r * 0.8, '#C8C0FF', '#FFFFFF', { n: 18, shake: 7, smoke: 0 }); M.orb = null; sfx(FX, 'crash'); }
  /* ---- overloaded (its stagger): enough blows on the bright fragment and it flares out; the volley is spent ---- */
  function overload(FX, m, M) { const V = M.fv; if (!V || V.done) return; V.done = true; M.stat.overloads++;
    V.teles.forEach(s => { s.dmg = 0; s.fn = null; s.done = true; s.linger = 0; }); if (M.orb && M.orb.v === V) { sparkle(FX, M.orb.x, M.orb.y - 1, 14, [WHT, '#C8C0FF']); M.orb = null; }
    const f = FRAG[V.i], P = pose(FX, m, M), q = P.pj(P.rot(FRAG_FRONT[0], FRAG_FRONT[1], FRAG_FRONT[2])), first = !M.seen.overload; M.seen.overload = true;
    M.fv = null; endAct(m); m.stunT = Math.max(m.stunT || 0, 5.5); M.stunKind = 'overload'; M.stunWas = 'overload'; M.recoil = 1; M.flare = 1; M.tent = [null, null, null, null];
    sparkle(FX, m.x + q[0], m.y + q[1], 26, [f.col, f.hi, '#FFFFFF']); FX.H.shake(12, 0.4); FX.H.flash(0.15, f.col); sfx(FX, 'crash'); sfx(FX, 'crack');
    FX.H.hitMon(m, FX.S.barHP * 0.02, { flat: true, pierce: true });
    FX.H.banner('OVERLOADED!', first ? `Its ${f.key} fragment flares out under your blows: it sinks, its tentacles on the floor · strike the TIPS and the CORE` : 'It sinks: strike the tips and the core!', f.col, first ? 2.4 : 1.4, true); }

  /* ---- Tentacle Slam: two tentacles rear up and slam down along shown lanes ---- */
  function startSlam(FX, m) { const M = FX.mem, P = FX.S.lv; m.act = 'slam'; m.actT = 0; M.ts = { wave: 0, waves: P >= 3 ? 2 : 1, cur: null, gapT: 0, endT: 0, used: [] }; M.stat.slamActs++; nextLanes(FX, m, M, fastK(FX));
    say(FX, 'slam', 'TENTACLE SLAM', P >= 3 ? 'Two tentacles rear up and slam the shown lanes, then the other two: step out of them' : 'Two of its tentacles rear up and slam down along the shown lanes: step out of them', SLAM_HI); }
  function nextLanes(FX, m, M, F) { const S = M.ts, me = FX.me, ap = Math.atan2(me.y - m.y, me.x - m.x), side = Math.random() < 0.5 ? 1 : -1, want = [ap, ap + side * (0.78 + Math.random() * 0.22)];
    let free = [0, 1, 2, 3].filter(i => !S.used.includes(i)); if (free.length < 2) { S.used = []; free = [0, 1, 2, 3]; }
    const C = S.cur = { t: 0, rise: 0.8 / F, show: 1.15 / F, lanes: [] };
    want.forEach(a => { let best = free[0], bd = 9; free.forEach(i => { const d = Math.abs(angTo(ROOT_A[i], a)); if (d < bd) { bd = d; best = i; } }); free = free.filter(i => i !== best); S.used.push(best);
      const ox = m.x + Math.cos(a) * 0.3, oy = m.y + Math.sin(a) * 0.3, ca = Math.cos(a), sa = Math.sin(a), L = { a, i: best };
      L.tele = FX.tele({ shape: 'fn', kind: 'lane', x: ox, y: oy, a, len: LANE_L, w: LANE_W, t: C.rise + C.show, dmg: 0, test: (px, py, rr) => { const rx = px - ox, ry = py - oy, al = rx * ca + ry * sa, of = Math.abs(-rx * sa + ry * ca); return al > -rr && al < LANE_L + rr && of < LANE_W / 2 + rr; }, fn: s => slamLand(FX, m, M, L, s) });
      M.tent[best] = { st: 'lift', k: 0, a, t: 0 }; C.lanes.push(L); });
    sfx(FX, 'whoosh'); }
  function slamLand(FX, m, M, L, s) { const me = FX.me; if (!m || m.dead) return; const inside = s.test(me.x, me.y, me.r * 0.5) && !me.dodge && !me.dead; M.stat.slams++;
    if (inside) { M.stat.slamHit++; FX.hurt(m.dmg * 1.6); const nx = -Math.sin(s.a), ny = Math.cos(s.a), sd = ((me.x - s.x) * nx + (me.y - s.y) * ny) >= 0 ? 1 : -1; me.push = { vx: nx * sd * 10, vy: ny * sd * 10, t: 0.22 }; } else M.stat.slamMiss++;
    const Tn = M.tent[L.i]; if (Tn) { Tn.st = 'lie'; Tn.t = 0; Tn.k = 1; }
    sfx(FX, 'crash'); sfx(FX, 'thud'); FX.H.shake(10, 0.3); M.cracks.push({ x: s.x, y: s.y, a: s.a, len: LANE_L, t: 0, life: 3.5, seed: Math.floor(Math.random() * 1e4) });
    for (let k = 2; k < LANE_L; k += 2.2) glassBits(FX, s.x + Math.cos(s.a) * k, s.y + Math.sin(s.a) * k, 3, '#E8F6FF'); }
  function slamStep(FX, m, M, dt, F) { const S = M.ts; if (!S) { endAct(m); return; } hold(M, 0.15, 2); const C = S.cur;
    if (C) { C.t += dt; const tS = C.rise + C.show;
      C.lanes.forEach(L => { const Tn = M.tent[L.i]; if (!Tn) return; Tn.t += dt;
        if (Tn.st === 'lift') { Tn.k = clamp(C.t / C.rise, 0, 1); if (C.t >= tS - 0.14) { Tn.st = 'strike'; Tn.k = 0; Tn.t = 0; } }
        else if (Tn.st === 'strike') Tn.k = clamp(Tn.t / 0.14, 0, 1);
        else if (Tn.st === 'lie') { if (Tn.t > 0.75) { Tn.st = 'back'; Tn.t = 0; Tn.k = 0; } }
        else if (Tn.st === 'back') { Tn.k = clamp(Tn.t / 0.55, 0, 1); if (Tn.k >= 1) M.tent[L.i] = null; } });
      // (a lane whose telegraph was disarmed lets its tentacle fall back)
      C.lanes.forEach(L => { const Tn = M.tent[L.i]; if (Tn && (Tn.st === 'lift' || Tn.st === 'strike') && L.tele.done && !L.tele.fn) { Tn.st = 'back'; Tn.t = 0; Tn.k = 0; } });
      if (C.lanes.every(L => !M.tent[L.i])) { S.cur = null; S.wave++; S.gapT = 0.25; } }
    else { S.gapT -= dt; if (S.gapT <= 0) { if (S.wave < S.waves) nextLanes(FX, m, M, F); else { S.endT += dt; if (S.endT > 0.3) { M.ts = null; endAct(m); } } } } }

  /* ---- The Comet Brood (half health): sealed in its bell, out of reach, it births thirty comet hatchlings ---- */
  function startBrood(FX, m) { const M = FX.mem; m.act = 'brood'; m.actT = 0; FX.untarget(true);
    M.bd = { t: 0, total: BROOD_N, spawned: 0, killed: 0, list: [], acc: -0.8, T: 60, maxLive: 0 }; M.stat.brood++;
    sfx(FX, 'crash'); FX.H.shake(12, 0.6); FX.H.ring(m.x, m.y, 1, 6, 0.6, SEALC, 0.35); }
  function broodStep(FX, m, M, dt) { const B = M.bd; if (!B) { endAct(m); return; } m.under = true; m.noTouch = true; B.t += dt;
    // (it drifts back over the middle of the island as it births)
    const h = M.home, dx = h.x - m.x, dy = h.y - m.y, d = Math.hypot(dx, dy); if (d > 0.05) { const s = Math.min(d, 2.2 * dt); m.x += dx / d * s; m.y += dy / d * s; }
    B.list = B.list.filter(q => { if (q.dead) { B.killed++; M.stat.killed++; return false; } return true; });
    B.acc = Math.min(1.2, B.acc + dt);
    while (B.acc >= 0.5 && B.spawned < B.total && B.list.length < BROOD_CAP) { B.acc -= 0.5; const q = hatch(FX, m, M, true); B.spawned++; if (q) B.list.push(q); else { B.killed++; M.stat.killed++; } }
    B.maxLive = Math.max(B.maxLive, B.list.length);
    if ((B.spawned >= B.total && !B.list.length) || B.t > B.T) expose(FX, m, M); }
  function expose(FX, m, M) { const B = M.bd, all = B && B.killed >= B.total; M.bd = null; FX.untarget(false); endAct(m); M.stat.exposed++;
    m.stunT = Math.max(m.stunT || 0, all ? 7.5 : 4.5); M.stunKind = 'exposed'; M.stunWas = 'exposed'; M.recoil = 1; M.flare = 1;
    sfx(FX, 'crash'); FX.H.shake(12, 0.5); sparkle(FX, m.x, m.y - ALT_BROOD - 1, 30); FX.H.ring(m.x, m.y, 1, 6, 0.6, SEALC, 0.35);
    FX.H.banner('EXPOSED!', all ? 'Its brood is gone: it sinks, its four tentacles on the floor · strike the TIPS and the CORE!' : 'It sinks: strike the tips and the core!', CYA_HI, 2.6, true); }
  // one of its brood: it arcs out of the rim to a spot on the sand, its colour one of the three fragments'
  function hatch(FX, m, M, horde) { const me = FX.me, a0 = Math.atan2(me.y - m.y, me.x - m.x); let p = null;
    for (let k = 0; k < 16 && !p; k++) { const a = a0 + FX.rnd(-1.5, 1.5), d = FX.rnd(3.6, 8.0), q = { x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d }; if (FX.inArena(q.x, q.y, 1.6) && Math.hypot(q.x - me.x, q.y - me.y) > 2.4) p = q; }
    if (!p) p = FX.clampArena({ x: m.x + Math.cos(a0) * 4, y: m.y + Math.sin(a0) * 4 }, 1.6);
    const q = FX.minion('comethatch', p.x, p.y, {}); if (!q) return null; const a = Math.atan2(q.y - m.y, q.x - m.x), alt = M.alt || ALT;
    q.color = FRAG[(M.stat.spawned || 0) % 3].col;
    q.launch = { t: 0, dur: 0.6 + Math.random() * 0.25, x0: m.x + Math.cos(a) * BR * 0.95, y0: m.y + Math.sin(a) * BR * 0.95 * FLAT, z0: alt, x1: q.x, y1: q.y, h: 1.0 + Math.random() * 1.2 }; q.x = q.launch.x0; q.y = q.launch.y0; q.z = alt; q.under = true; q.cd = 0.5 + Math.random() * 0.5;
    if (horde) { q.horde = true; q.hp = q.maxhp = Math.max(40, Math.round(q.maxhp * 0.5)); q.xp = Math.max(1, Math.round((q.xp || 4) * 0.4)); }
    M.stat.spawned++; M.flare = Math.max(M.flare, 0.4); FX.H.sparks(q.x, q.y - alt, q.color, 4, 3); return q; }

  /* ---- the damage windows: the tentacles rest on the floor; their tips and the core are weak points ---- */
  function restWeak(FX, m, M, on) { const W = FX.S.weak;
    if (!on) { for (let i = 0; i < 4; i++) if (W['tip' + i]) FX.weak('tip' + i, 0, 0, 0, 0, false); if (W.core) FX.weak('core', 0, 0, 0, 0, false); return; }
    const P = pose(FX, m, M); for (let i = 0; i < 4; i++) { const pts = restPts(P, i, M.bt || 0), q = pts[pts.length - 1]; FX.weak('tip' + i, m.x + q[0], m.y + q[1], 0.95, 2.0, true); }
    const q = P.pj(P.rot(CORE[0], CORE[1], CORE[2])); FX.weak('core', m.x + q[0], m.y + q[1], 1.35, 2.5, true); }
  function fragWorld(FX, m, M, i) { const P = pose(FX, m, M), f = P.frag[i]; return [m.x + f.g[0], m.y + f.g[1]]; }
  // the hit proxies: the bell (and its tentacles, when they lie on the floor)
  function bodyParts(FX, m, M) { const P = pose(FX, m, M), b = P.pj(P.rot(0, 0, 0.9)), out = [{ key: 'bell', dx: b[0], dy: b[1], r: 2.7 }, { key: 'rim', dx: b[0], dy: b[1] + 1.4, r: 2.0 }];
    if ((M.rest || 0) > 0.6) for (let i = 0; i < 4; i++) { const pts = restPts(P, i, M.bt || 0), q = pts[6]; out.push({ key: 'tent' + i, dx: q[0], dy: q[1], r: 0.9 }); }
    return out; }

  /* ---------- the body: where everything is ---------- */
  function pose(FX, m, M) { const bt = M.bt || 0, c = M.c || 0, rest = M.rest || 0, seal = M.seal || 0, rc = M.recoil || 0, alt = M.alt == null ? ALT : M.alt, hs = m.hitSq || 0;
    const S = 1 + (M.flare || 0) * 0.025 + hs * 0.02, cc = Math.max(0, c), co = Math.max(0, -c);
    const rimK = 1 - cc * 0.1 + co * 0.07, domeK = 1 + cc * 0.14 - co * 0.09;
    const z0 = alt + Math.sin(bt * 1.25) * 0.14 * (1 - rest) + cc * 0.22 - rc * 0.12;
    // it leans toward the camera when it rests, sways as it swims, jolts when struck
    const pit = rest * 0.3 + Math.sin(bt * 0.9) * 0.04 + rc * 0.06, rol = Math.sin(bt * 0.7) * 0.05 * (1 - seal * 0.5) + rc * 0.05 * Math.sin(bt * 29);
    const cp = Math.cos(pit), sp = Math.sin(pit), cr = Math.cos(rol), sr = Math.sin(rol);
    const rot = (dx, dy, dz) => { dx *= S; dy *= S; dz *= S; const x1 = dx * cr - dz * sr, z1 = dx * sr + dz * cr; return [x1, dy * cp + z1 * sp, -dy * sp + z1 * cp]; };
    // (a rotated body point, or a point hanging free under it, as metres on screen from its ground point)
    const pj = q => [q[0], -z0 + q[1] * FLAT - q[2] * VK], free = (x, y, z) => [x, -z0 + y * FLAT - z * VK];
    const fold = SEG_A.map((a, j) => { let f = c >= 0 ? lerp(F_REST, F_SHUT, c) : lerp(F_REST, F_OPEN, -c); f = lerp(f, F_LIMP, rest * 0.85); return f + Math.sin(bt * 2.1 + j * 1.3) * 0.05 * (1 - seal); });
    const fo = M.fo || 0, br = M.br || [0, 0, 0], frag = [0, 1, 2].map(i => { const a = fo + i * TAU / 3, b = smooth(br[i] || 0), rr = FRAG_R * (1 - rest * 0.72);
      let p = [Math.cos(a) * rr + CORE[0] * rest, Math.sin(a) * rr * (1 - rest * 0.3) + CORE[1] * rest, lerp(FRAG_Z + Math.sin(bt * 1.6 + i * 2) * 0.12, CORE[2], rest)];
      p = [lerp(p[0], FRAG_FRONT[0], b), lerp(p[1], FRAG_FRONT[1], b), lerp(p[2], FRAG_FRONT[2], b)]; const q = rot(p[0], p[1], p[2]);
      return { i, g: pj(q), d: q[1] * VK + q[2] * FLAT, s: 0.42 * (1 + 0.8 * b) * (1 - rest * 0.3), b, spin: bt * (1.4 + i * 0.3) + i * 2 }; });
    return { S, z0, alt, rimK, domeK, rot, pj, free, fold, frag, rest, seal, c, bt }; }
  // a tentacle's points (metres on screen from the ground point), root to tip, in each of its poses
  function rootOf(P, i) { const a = ROOT_A[i], x = Math.cos(a) * ROOT_R, y = Math.sin(a) * ROOT_R; return { a, x, y, g: P.pj(P.rot(x, y, -0.1)), f: P.free(x, y, -0.1) }; }
  function hangPts(P, i) { const R0 = rootOf(P, i), ca = Math.cos(R0.a), sa = Math.sin(R0.a), zb = -(P.z0 - 0.45) / VK, bt = P.bt, out = [];
    for (let k = 0; k < TNN; k++) { const u = k / (TNN - 1), sw = Math.sin(bt * 1.5 + i * 1.9 - u * 2.8) * 0.5 * u, sw2 = Math.cos(bt * 1.05 + i * 2.3 - u * 2) * 0.3 * u, rr = ROOT_R + 1.25 * u + 0.35 * Math.sin(u * Math.PI);
      let x = ca * rr - sa * sw + ca * sw2, y = sa * rr + ca * sw + sa * sw2, z = lerp(-0.1, zb, Math.pow(u, 0.95));
      // (the tip hooks out and up)
      if (u > 0.72) { const e = (u - 0.72) / 0.28; x += ca * e * e * 0.55; y += sa * e * e * 0.55; z += e * e * 0.5; }
      const g = P.free(x, y, z); out.push([g[0] + (R0.g[0] - R0.f[0]) * (1 - u), g[1] + (R0.g[1] - R0.f[1]) * (1 - u)]); }
    return out; }
  function restPts(P, i, bt) { const R0 = rootOf(P, i), b = REST_A[i], cb = Math.cos(b), sb = Math.sin(b), g1 = [cb * REST_R0, sb * REST_R0], out = [R0.g];
    for (let k = 1; k <= 3; k++) { const u = k / 4; out.push([lerp(R0.g[0], g1[0], u) + cb * 0.45 * Math.sin(u * Math.PI), lerp(R0.g[1], g1[1], u * u) + sb * 0.3 * Math.sin(u * Math.PI)]); }
    for (let k = 0; k < TNN - 4; k++) { const u = k / (TNN - 5), r = lerp(REST_R0, REST_R1, u), w = Math.sin(u * 4.2 + i * 1.3) * 0.32 * u + Math.sin(bt * 1.8 + i + u * 3) * 0.06 + (u > 0.8 ? (u - 0.8) * 1.6 : 0); out.push([cb * r - sb * w, sb * r + cb * w]); }
    return out; }
  // (reared: it rises out beside the bell on its own side of the lane and arches up over the bell's back, its tip high)
  function liftPts(P, i, la) { const R0 = rootOf(P, i), cl = Math.cos(la), sl = Math.sin(la), bt = P.bt, out = [], px = -sl, py = cl, sg = (R0.x * px + R0.y * py) >= 0 ? 1 : -1;
    const C0 = [R0.x, R0.y, -0.1], C1 = [R0.x + px * sg * 1.8 + cl * 0.5, R0.y + py * sg * 1.8 + sl * 0.5, -0.7], C2 = [px * sg * 3.6 - cl * 0.3, py * sg * 3.6 - sl * 0.3, 1.6], C3 = [px * sg * 2.1 - cl * 1.5 + Math.sin(bt * 23) * 0.06, py * sg * 2.1 - sl * 1.5, 4.5 + Math.sin(bt * 27) * 0.06];
    for (let k = 0; k < TNN; k++) { const u = k / (TNN - 1), v = 1 - u, b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u, p = [0, 1, 2].map(j => C0[j] * b0 + C1[j] * b1 + C2[j] * b2 + C3[j] * b3), g = P.free(p[0], p[1], p[2]); out.push([g[0] + (R0.g[0] - R0.f[0]) * (1 - u), g[1] + (R0.g[1] - R0.f[1]) * (1 - u)]); }
    return out; }
  function lanePts(P, i, la) { const R0 = rootOf(P, i), cl = Math.cos(la), sl = Math.sin(la), g1 = [cl * 1.2, sl * 1.2], out = [R0.g];
    for (let k = 1; k <= 3; k++) { const u = k / 4; out.push([lerp(R0.g[0], g1[0], u) + cl * 0.4 * Math.sin(u * Math.PI), lerp(R0.g[1], g1[1], u * u) + sl * 0.3 * Math.sin(u * Math.PI)]); }
    for (let k = 0; k < TNN - 4; k++) { const u = k / (TNN - 5), r = lerp(1.2, LANE_L - 0.2, u), w = Math.sin(u * 5 + i) * 0.12; out.push([cl * r - sl * w, sl * r + cl * w]); }
    return out; }
  function blendPts(A, B, u) { return A.map((p, k) => [lerp(p[0], B[k][0], u), lerp(p[1], B[k][1], u)]); }
  // every tentacle as it is drawn now (its points, root to tip), far ones first
  function tentacles(P, M) { const out = [];
    for (let i = 0; i < 4; i++) { const Tn = (M.tent || [])[i], base = (P.rest || 0) > 0.01 ? blendPts(hangPts(P, i), restPts(P, i, P.bt), smooth(P.rest)) : hangPts(P, i); let pts = base;
      if (Tn) {
        if (Tn.st === 'lift') pts = blendPts(base, liftPts(P, i, Tn.a), smooth(Tn.k));
        else if (Tn.st === 'strike') pts = blendPts(liftPts(P, i, Tn.a), lanePts(P, i, Tn.a), Tn.k * Tn.k);
        else if (Tn.st === 'lie') pts = lanePts(P, i, Tn.a);
        else if (Tn.st === 'back') pts = blendPts(lanePts(P, i, Tn.a), base, smooth(Tn.k)); }
      out.push({ i, pts, depth: pts[pts.length - 1][1] }); }
    return out.sort((a, b) => a.depth - b.depth); }

  /* ---------- painting it ---------- */
  function drawBell(c, FX, m, X, Y, T, t) { const M = FX.mem; if (!M) return; const P = pose(FX, m, M), lw = Math.max(1.4, T * 0.07), S = P.S;
    const sc = g => [X + g[0] * T, Y + g[1] * T];
    // its shadow on the sand, softer and wider the higher it hangs
    const k = 1 / (1 + P.z0 * 0.1); K.shade(c, X, Y, T * 3.5 * k, T * 1.25 * k, 0.3 + P.rest * 0.15, '#0A3444');
    // the segments are painted back to front round the bell: those behind it first
    const segs = SEG_A.map((a, j) => ({ j, d: Math.sin(a) })).sort((a, b) => a.d - b.d);
    segs.forEach(s => { if (s.d < 0) paintSeg(c, P, s.j, X, Y, T, lw, M); });
    const tl = tentacles(P, M);
    // (the tentacles hang under the bell, so all of them go behind its dome and its front segments)
    tl.forEach(o => paintTent(c, o.pts.map(sc), T, S, lw, (M.tipHit || [])[o.i] || 0, P.rest));
    const hull = paintDome(c, P, X, Y, T, lw, M, t);
    paintInner(c, P, X, Y, T, M, t, hull);
    segs.forEach(s => { if (s.d >= 0) paintSeg(c, P, s.j, X, Y, T, lw, M); });
    // the brood's seal: a soft shell of pale light round the bell
    if (P.seal > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; const q = sc(P.pj(P.rot(0, 0, 0.6))); K.glow(c, q[0], q[1], T * 5.2, SEALC, 0.32 * P.seal); c.lineJoin = 'round';
      [[0.9, 0.06], [0.5, 0.12], [0.22, 0.3]].forEach(([w, a]) => { c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.lineWidth = Math.max(1, w * T); c.strokeStyle = rgba(SEALC, a * P.seal * (0.8 + 0.2 * Math.sin(t * 4))); c.stroke(); }); c.restore(); } }
  // the dome: cel-shaded facets (only those turned to the camera), its edges, its outline; returns the outline
  function paintDome(c, P, X, Y, T, lw, M, t) {
    const rings = PHI.map((ph, k) => { const rr = BR * Math.cos(ph) * lerp(P.rimK, 1, ph / 1.3), z = DH * P.domeK * Math.sin(ph), off = k * Math.PI / NLON, row = []; for (let j = 0; j < NLON; j++) { const a = off + j * TAU / NLON; row.push(P.rot(Math.cos(a) * rr, Math.sin(a) * rr, z)); } return row; });
    const top = P.rot(0, 0, DH * P.domeK), sp = q => { const g = P.pj(q); return [X + g[0] * T, Y + g[1] * T]; };
    const groups = [[], [], [], []], rimG = [], edges = [];
    const tri = (a, b, d) => { let n = norm3(cross3(sub3(b, a), sub3(d, a))); const cen = [(a[0] + b[0] + d[0]) / 3, (a[1] + b[1] + d[1]) / 3, (a[2] + b[2] + d[2]) / 3]; if (dot3(n, cen) < 0) n = [-n[0], -n[1], -n[2]]; const vis = dot3(n, VC); if (vis <= 0) return;
      const pts = [sp(a), sp(b), sp(d)], k = dot3(n, LT); (vis < 0.3 && n[0] > 0.25 ? rimG : groups[toneOf(k)]).push(pts); edges.push(pts); };
    for (let k = 0; k < rings.length - 1; k++) { const A = rings[k], B = rings[k + 1]; for (let j = 0; j < NLON; j++) { const j1 = (j + 1) % NLON; tri(A[j], A[j1], B[j]); tri(B[j], A[j1], B[j1]); } }
    const L = rings[rings.length - 1]; for (let j = 0; j < NLON; j++) tri(L[j], L[(j + 1) % NLON], top);
    const fill = (list, col) => { if (!list.length) return; c.beginPath(); list.forEach(p => { c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.lineTo(p[2][0], p[2][1]); c.closePath(); }); c.fillStyle = col; c.fill(); c.lineWidth = 0.8; c.strokeStyle = col; c.stroke(); };
    groups.forEach((g, i) => fill(g, BELL_T[i])); fill(rimG, BELL_RIM);
    // the facets' edges, faint and glassy
    c.beginPath(); edges.forEach(p => { c.moveTo(p[0][0], p[0][1]); c.lineTo(p[1][0], p[1][1]); c.lineTo(p[2][0], p[2][1]); c.closePath(); }); c.lineWidth = Math.max(0.8, T * 0.03); c.strokeStyle = EDGE; c.lineJoin = 'round'; c.stroke();
    // a hit flash
    const all = []; rings.forEach(r => r.forEach(q => all.push(sp(q)))); all.push(sp(top)); const hull = hull2(all);
    if (K.Q.flash > 0) { c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = 'rgba(220,230,255,.2)'; c.fill(); }
    // the starfield caught in its facets
    BSTARS.forEach(([lon, ph, s, ph0]) => { const rr = BR * Math.cos(ph) * lerp(P.rimK, 1, ph / 1.3) * 0.99, z = DH * P.domeK * Math.sin(ph) * 0.99, q = P.rot(Math.cos(lon) * rr, Math.sin(lon) * rr, z), n = norm3(q); if (dot3(n, VC) < 0.15) return; const p = sp(q), a = 0.45 + 0.4 * Math.sin(t * 2.3 + ph0); TN.twinkle(c, p[0], p[1], T * 0.09 * s, '#E8F0FF', a); });
    // the outline: bold ink round the dome
    c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.lineWidth = lw * 1.15; c.strokeStyle = INK; c.lineJoin = 'round'; c.stroke();
    return hull; }
  function hull2(pts) { pts = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = [];
    for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); }
    return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  // inside the bell: the fragments' light through the facets, the fragments themselves, the core when it rests
  function paintInner(c, P, X, Y, T, M, t, hull) { const sc = g => [X + g[0] * T, Y + g[1] * T];
    c.save(); c.beginPath(); hull.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip(); c.globalCompositeOperation = 'lighter';
    P.frag.forEach(f => { const q = sc(f.g); K.glow(c, q[0], q[1], T * (1.5 + 1.8 * f.b), FRAG[f.i].col, 0.2 + 0.35 * f.b + (f.d > 0 ? 0.08 : 0)); });
    if (P.rest > 0.05) { const q = sc(P.pj(P.rot(CORE[0], CORE[1], CORE[2]))), pu = 0.75 + 0.25 * Math.sin(t * 6); K.glow(c, q[0], q[1], T * 2.6, '#FFFFFF', 0.4 * P.rest * pu + (M.coreHit || 0) * 0.3); }
    c.restore();
    P.frag.slice().sort((a, b) => a.d - b.d).forEach(f => { const q = sc(f.g), F = FRAG[f.i]; paintFrag(c, q[0], q[1], T * f.s, F, f.spin, f.d < 0 && f.b < 0.5 ? 0.55 : 1, f.b, t, M.fragHit && f.b > 0.5 ? M.fragHit : 0); });
    if (P.rest > 0.05) { const q = sc(P.pj(P.rot(CORE[0], CORE[1], CORE[2]))), pu = 0.8 + 0.2 * Math.sin(t * 6); c.save(); c.globalAlpha = P.rest; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(q[0], q[1], T * 0.2 * pu, 0, TAU); c.fill(); c.restore(); } }
  // a fragment: a turning shard of light, two faces lit and shaded, a white heart; brightened, it blazes
  function paintFrag(c, x, y, s, F, spin, alpha, b, t, hitK) { const w = s * (0.42 + 0.58 * Math.abs(Math.cos(spin))), h = s * 1.15, lw = Math.max(1, s * 0.12);
    c.save(); c.globalAlpha = alpha;
    if (b > 0.05) { c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, x, y, s * (3.2 + 0.6 * Math.sin(t * 7)), F.col, 0.5 * b + hitK * 0.3);
      // soft rays turning round it (feathered beams)
      for (let k = 0; k < 4; k++) { const a = t * 0.8 + k * Math.PI / 4; c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = 0.2 * b; blitSized(c, beamSprite(F.hi), -s * 2.1, -s * 0.28, s * 4.2, s * 0.56); c.restore(); } c.restore(); }
    const left = Math.cos(spin) > 0; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - w, y); c.lineTo(x, y + h * 0.8); c.closePath(); c.fillStyle = left ? F.hi : F.col; c.fill();
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w, y); c.lineTo(x, y + h * 0.8); c.closePath(); c.fillStyle = left ? F.col : mix(F.col, F.deep, 0.5); c.fill();
    c.beginPath(); c.moveTo(x, y - h); c.lineTo(x - w, y); c.lineTo(x, y + h * 0.8); c.lineTo(x + w, y); c.closePath(); c.strokeStyle = mix(F.deep, INK, 0.45); c.lineWidth = lw; c.stroke();
    c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(x, y - h * 0.55); c.lineTo(x - w * 0.25, y); c.lineTo(x, y + h * 0.35); c.lineTo(x + w * 0.25, y); c.closePath(); c.fill();
    c.restore(); }
  // a rim segment: a pointed flap of the bell hanging from its rim (two facets either side of a ridge), folded as it swims
  function paintSeg(c, P, j, X, Y, T, lw, M) { const th = SEG_A[j], f = P.fold[j], rr = BR * P.rimK, ct = Math.cos(th), st = Math.sin(th), tx = -st, ty = ct;
    const Ap = [Math.cos(th - SEG_HW) * rr, Math.sin(th - SEG_HW) * rr, 0], Bp = [Math.cos(th + SEG_HW) * rr, Math.sin(th + SEG_HW) * rr, 0], Mi = [ct * (rr + 0.1), st * (rr + 0.1), 0.06];
    const tipR = rr + SEG_L * Math.cos(f), Tp = [ct * tipR, st * tipR, -SEG_L * Math.sin(f)];
    const side = (E, sg) => [(E[0] + Tp[0]) / 2 + tx * 0.16 * sg, (E[1] + Tp[1]) / 2 + ty * 0.16 * sg, (E[2] + Tp[2]) / 2];
    const Sa = side(Ap, -1), Sb = side(Bp, 1), sp = q => { const r = P.rot(q[0], q[1], q[2]), g = P.pj(r); return { r, s: [X + g[0] * T, Y + g[1] * T] }; };
    const out = [ct, st, 0.5], facets = [[Ap, Sa, Tp, Mi], [Mi, Tp, Sb, Bp]];
    const glowK = Math.max(0, P.c) * 0.6 + (M.flare || 0) * 0.4;
    facets.forEach(F => { const Q = F.map(sp), a = Q[0].r, b = Q[2].r, d = Q[3].r; let n = norm3(cross3(sub3(b, a), sub3(d, a))); const ro = P.rot(out[0], out[1], out[2]); if (dot3(n, ro) < 0) n = [-n[0], -n[1], -n[2]];
      const outer = dot3(n, VC) > 0, k = dot3(n, LT), col = outer ? BELL_T[toneOf(k)] : mix(BELL_IN, BELL_IN2, Math.max(0, -dot3(n, VC)));
      c.beginPath(); Q.forEach((q, i) => i ? c.lineTo(q.s[0], q.s[1]) : c.moveTo(q.s[0], q.s[1])); c.closePath(); c.fillStyle = col; c.fill(); });
    const Q = [Ap, Sa, Tp, Sb, Bp].map(sp); c.beginPath(); Q.forEach((q, i) => i ? c.lineTo(q.s[0], q.s[1]) : c.moveTo(q.s[0], q.s[1])); c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = INK; c.stroke();
    // the ridge down its middle catches the light
    const m0 = sp(Mi).s, t0 = Q[2].s; c.strokeStyle = rgba('#8FA8FF', 0.45); c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(m0[0], m0[1]); c.lineTo(t0[0], t0[1]); c.stroke();
    // drawn in for the pulse (or flared by it), its point glows
    if (glowK > 0.04) { c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, t0[0], t0[1], T * 1.1, PULSE_HI, glowK * 0.7); c.restore(); } }
  // a tentacle: a thick white tube, cel-shaded, rings of pale light along it, a knob at its tip
  function paintTent(c, sp, T, S, lw, hitK, rest) { TN.tubeLite(c, sp, u => lerp(TW0, TW1, u) * T * S, { col: hitK > 0.3 ? '#FFFFFF' : TENT, shade: TENT_SH, shade2: TENT_SH2, hi: TENT_HI, line: INK, lw, r: TW0 * T, d1: 0.16, d2: 0.22, glowCol: TENT_GLOW, glowA: 0.3 });
    c.save(); c.strokeStyle = rgba('#A8A0E8', 0.55); c.lineWidth = Math.max(1, T * 0.035); c.lineCap = 'round';
    for (let k = 2; k < sp.length - 1; k += 2) { const p = sp[k], q = sp[k + 1], dx = q[0] - p[0], dy = q[1] - p[1], d = Math.hypot(dx, dy) || 1, w = lerp(TW0, TW1, k / (sp.length - 1)) * T * S * 0.42; c.beginPath(); c.moveTo(p[0] - dy / d * w, p[1] + dx / d * w); c.quadraticCurveTo(p[0] + dx / d * w * 0.4, p[1] + dy / d * w * 0.4, p[0] + dy / d * w, p[1] - dx / d * w); c.stroke(); }
    c.restore();
    const e = sp[sp.length - 1]; c.fillStyle = '#E8E2FF'; c.strokeStyle = INK; c.lineWidth = lw * 0.8; c.beginPath(); c.arc(e[0], e[1], TW1 * T * S * 0.62, 0, TAU); c.fill(); c.stroke();
    if (rest > 0.5) { c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, e[0], e[1], T * 0.9, '#FFE6B0', 0.35 * rest + hitK * 0.4); c.restore(); } }

  /* ---------- on the sand: its marks, every telegraph (each in its fragment's colour), soft at every edge ---------- */
  function softLine(c, x0, y0, x1, y1, w, col, a) { c.save(); c.lineCap = 'round'; [[1.5, 0.05], [1.18, 0.08], [0.88, 0.12], [0.56, 0.16]].forEach(([k, al]) => { c.strokeStyle = rgba(col, Math.min(1, al * a)); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }); c.restore(); }
  function softRing(c, X, Y, r, w, col, a, a0, a1) { if (r <= 0) return; c.save(); c.lineCap = 'round'; [[1.9, 0.06], [1.3, 0.1], [0.85, 0.16], [0.45, 0.24], [0.18, 0.4]].forEach(([k, al]) => { c.strokeStyle = rgba(col, Math.min(1, al * a)); c.lineWidth = Math.max(1, w * k); c.beginPath(); c.arc(X, Y, r, a0 == null ? 0 : a0, a1 == null ? TAU : a1); c.stroke(); }); c.restore(); }
  function chevron(c, X, Y, a, s, col, alpha) { const ux = Math.cos(a), uy = Math.sin(a), nx = -uy, ny = ux; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(X - ux * s + nx * s, Y - uy * s + ny * s); c.lineTo(X, Y); c.lineTo(X - ux * s - nx * s, Y - uy * s - ny * s); c.strokeStyle = `rgba(20,16,40,${0.35 * alpha})`; c.lineWidth = Math.max(3, s * 0.55); c.stroke(); c.strokeStyle = rgba(col, alpha); c.lineWidth = Math.max(1.6, s * 0.3); c.stroke(); c.restore(); }
  function lab(c, X, Y, s, col, T, k) { c.save(); c.font = `900 ${Math.round(T * (k || 0.36))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 3.5; c.strokeStyle = 'rgba(8,8,24,.82)'; c.lineJoin = 'round'; c.strokeText(s, X, Y); c.fillStyle = col || '#FFFFFF'; c.fillText(s, X, Y); c.restore(); }
  function floorClip(c, FX, T) { c.beginPath(); c.arc(FX.sx(FX.C.x), FX.sy(FX.C.y), (FX.C.R + 0.25) * T, 0, TAU); c.clip(); }
  // a lane on the sand (soft: a tinted band, feathered edges, chevrons running out along it)
  function laneBand(c, X0, Y0, a, len, w, col, edge, k, t, T) { const X1 = X0 + Math.cos(a) * len, Y1 = Y0 + Math.sin(a) * len, nx = -Math.sin(a) * w / 2, ny = Math.cos(a) * w / 2;
    softLine(c, X0, Y0, X1, Y1, w * 1.02, col, k * 1.6);
    for (const sd of [-1, 1]) softLine(c, X0 + nx * sd * 0.92, Y0 + ny * sd * 0.92, X1 + nx * sd * 0.92, Y1 + ny * sd * 0.92, T * 0.22, edge, k * 2.2);
    for (let s = 1.2 * T; s < len - 0.6 * T; s += 1.7 * T) { const mv = (t * 2.4 * T) % (1.7 * T); chevron(c, X0 + Math.cos(a) * (s + mv - 0.8 * T), Y0 + Math.sin(a) * (s + mv - 0.8 * T), a, T * 0.3, '#FFFFFF', k * 0.75); } }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, m = FX.m; if (!M || !M.stat || !m) return; const sx = FX.sx, sy = FX.sy, pu = 0.5 + 0.5 * Math.sin(t * 8);
    c.save(); floorClip(c, FX, T);
    // the marks it leaves: glass melted where a comet fell, cracks down a slammed lane
    M.scorch.forEach(s => { const a = clamp((s.life - s.t) / 1.5, 0, 1) * clamp(s.t / 0.1, 0, 1); if (a < 0.02) return; const X = sx(s.x), Y = sy(s.y), R = mulberry32(Math.floor(s.seed * 1000)); c.save(); c.globalAlpha = a;
      K.shade(c, X, Y, s.r * T, s.r * T * 0.85, 0.16, '#8A5A28'); for (let i = 0; i < 4; i++) { const b = R() * TAU, d = s.r * (0.2 + R() * 0.5) * T; K.shade(c, X + Math.cos(b) * d, Y + Math.sin(b) * d, T * 0.22, T * 0.16, 0.5, '#FFE6B0'); }
      softRing(c, X, Y, s.r * T * 0.5, T * 0.4, AMB, 0.5 * a); c.restore(); });
    M.cracks.forEach(k => { const a = clamp((k.life - k.t) / 1.2, 0, 1); if (a < 0.02) return; const R = mulberry32(k.seed), d = [Math.cos(k.a), Math.sin(k.a)], e = [-d[1], d[0]]; let s = 1.2, o = 0; const pts = []; while (s < k.len) { pts.push([sx(k.x + d[0] * s + e[0] * o), sy(k.y + d[1] * s + e[1] * o)]); s += 0.5 + R() * 0.4; o = clamp(o + (R() - 0.5) * 0.5, -0.5, 0.5); }
      c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = 'rgba(40,90,120,.45)'; c.lineWidth = Math.max(1.5, T * 0.1); c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = Math.max(1, T * 0.04); c.save(); c.translate(T * 0.05, T * 0.06); c.stroke(); c.restore(); c.restore(); });
    // Rim Pulse: while the rim draws in, the ring it will send (faint ripples) and its three gaps (mint lanes)
    const R = M.rp; if (R && R.state === 'draw') { const u = clamp(R.t / R.dur, 0, 1), X = sx(m.x), Y = sy(m.y);
      for (let k = 0; k < 4; k++) { const rr = (2.5 + k * 3.2 + (t * 2.5) % 3.2) * T, al = (0.6 - k * 0.1) * (0.5 + 0.5 * u); arcsOutside(c, X, Y, rr, T * 0.3, PULSE_T, al, R.gaps, GAP_W); }
      softRing(c, X, Y, T * (0.8 + 2.4 * (1 - u)), T * 0.45, PULSE_T, 0.7 + 0.5 * u);
      R.gaps.forEach(g => { [[1.2, 0.08], [0.7, 0.14], [0.35, 0.3]].forEach(([w, al]) => { c.save(); c.globalAlpha = al * (0.6 + 0.4 * u); c.strokeStyle = GAP_T; c.lineCap = 'round'; c.lineWidth = Math.max(1, w * T); c.beginPath(); c.moveTo(X + Math.cos(g) * 2.2 * T, Y + Math.sin(g) * 2.2 * T); c.lineTo(X + Math.cos(g) * 16 * T, Y + Math.sin(g) * 16 * T); c.stroke(); c.restore(); });
        for (const sd of [-1, 1]) softLine(c, X + Math.cos(g + sd * GAP_W) * 2.6 * T, Y + Math.sin(g + sd * GAP_W) * 2.6 * T, X + Math.cos(g + sd * GAP_W) * 16 * T, Y + Math.sin(g + sd * GAP_W) * 16 * T, T * 0.16, GAP_T, 1.2 * (0.6 + 0.4 * u)); });
      const pd = clamp(Math.hypot(FX.me.x - m.x, FX.me.y - m.y) + 1.5, 4.5, 11), gN = R.gaps.reduce((b, g) => Math.abs(angTo(g, Math.atan2(FX.me.y - m.y, FX.me.x - m.x))) < Math.abs(angTo(b, Math.atan2(FX.me.y - m.y, FX.me.x - m.x))) ? g : b, R.gaps[0]);
      lab(c, X + Math.cos(gN) * pd * T, Y + Math.sin(gN) * pd * T - T * 0.5, 'GAP', '#B8FFE6', T, 0.42); }
    // ... and the rings rolling out, their gaps
    M.waves.forEach(w => { const X = sx(w.x), Y = sy(w.y), f = clamp((AR + 3 - w.r) / 3, 0, 1); arcsOutside(c, X, Y, w.r * T, w.w * T * 1.5, PULSE_T, 1.2 * f, w.gaps, w.gw); arcsOutside(c, X, Y, w.r * T, w.w * T * 0.5, PULSE_HI, 1.1 * f, w.gaps, w.gw);
      w.gaps.forEach(g => { const gx = X + Math.cos(g) * w.r * T, gy = Y + Math.sin(g) * w.r * T; c.save(); c.globalAlpha = 0.5 * f; K.shade(c, gx, gy, T * 0.9, T * 0.9, 0.5, GAP_T); c.restore(); }); });
    // the telegraphs: comets' circles, beams' lines, the orb's circle, the slam lanes
    FX.S.tele.forEach(s => { if (s.done || !s.kind) return; const u = clamp(s.age / s.t, 0, 1), X = sx(s.x), Y = sy(s.y);
      if (s.kind === 'comet') { const r = s.r * T, F = FRAG[0]; K.shade(c, X, Y, r, r, 0.22 + 0.3 * u, F.deep); softRing(c, X, Y, r * 0.97, T * 0.32, F.tel, 1.1 + 0.4 * pu * u); softRing(c, X, Y, Math.max(2, r * (1 - u * 0.85)), T * 0.18, '#FFF2D8', 0.9); }
      else if (s.kind === 'beam') { const F = FRAG[1]; laneBand(c, X, Y, s.a, s.len * T, s.w * T, F.deep, F.tel, 0.55 + 0.45 * u, t, T); }
      else if (s.kind === 'lane') { laneBand(c, X, Y, s.a, s.len * T, s.w * T, '#B02858', SLAM_T, 0.55 + 0.45 * u, t, T); }
      else if (s.kind === 'orb') { const r = s.r * T, F = FRAG[2]; K.shade(c, X, Y, r, r, 0.2 + 0.35 * u, F.tel); softRing(c, X, Y, r * 0.97, T * 0.34, F.tel, 1.2 + 0.4 * pu); softRing(c, X, Y, Math.max(2, r * (1 - u * 0.85)), T * 0.2, '#FFFFFF', 0.95); } });
    // the white orb hunting: its circle round it (where it will burst when it stops)
    const O = M.orb; if (O && O.state === 'hunt') { const X = sx(O.x), Y = sy(O.y), F = FRAG[2]; K.shade(c, X, Y, O.r * T, O.r * T, 0.16, F.tel); softRing(c, X, Y, O.r * T, T * 0.26, F.tel, 0.85); K.shade(c, X, Y, T * 0.9, T * 0.35, 0.35, '#2A2460'); }
    // where each hatchling will land
    FX.H.mons.forEach(q => { if (q.dead || q.type !== 'comethatch' || !q.launch) return; const L = q.launch, u = clamp(L.t / L.dur, 0, 1); softRing(c, sx(L.x1), sy(L.y1), T * (0.7 + 0.4 * (1 - u)), T * 0.22, mix(q.color || AMB, '#3A2A60', 0.25), 0.9); });
    c.restore();
    // the labels on the floor
    FX.S.tele.forEach(s => { if (s.done || !s.kind || s.lab === false) return; if (s.kind === 'lane' && s.age < s.t) { const L = s.len * 0.55; lab(c, sx(s.x + Math.cos(s.a) * L), sy(s.y + Math.sin(s.a) * L) - T * 0.2, 'SLAM', SLAM_HI, T, 0.42); }
      if (s.kind === 'beam' && s.age < s.t && Math.abs(angTo(s.a, Math.atan2(FX.me.y - m.y, FX.me.x - m.x))) < 0.2) { const L = clamp(Math.hypot(FX.me.x - s.x, FX.me.y - s.y) + 2.2, 4, s.len - 1); lab(c, sx(s.x + Math.cos(s.a) * L), sy(s.y + Math.sin(s.a) * L), 'BEAM', CYA_HI, T, 0.4); } }); }
  // a ring drawn soft, in arcs round its gaps
  function arcsOutside(c, X, Y, r, w, col, a, gaps, gw) { const gs = gaps.map(g => ((g % TAU) + TAU) % TAU).sort((p, q) => p - q);
    for (let i = 0; i < gs.length; i++) { const a0 = gs[i] + gw, a1 = (i + 1 < gs.length ? gs[i + 1] : gs[0] + TAU) - gw; if (a1 > a0) softRing(c, X, Y, r, w, col, a, a0, a1); } }

  /* ---------- in the air: falling comets, beams, the orb, the labels ---------- */
  function drawAir(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M || !M.stat) return; const sx = FX.sx, sy = FX.sy, lw = Math.max(1.3, T * 0.06);
    // the comet shards coming down onto their circles, trailing soft amber tails
    FX.S.tele.forEach(s => { if (s.done || s.kind !== 'comet') return; const u = s.age / s.t; if (u < 0.35) return; const k = (u - 0.35) / 0.65, z = 13 * (1 - k), dx = -4.5 * (1 - k), X = sx(s.x + dx), Y = sy(s.y) - z * T, F = FRAG[0];
      const ang = Math.atan2(-13, -4.5); c.save(); c.translate(X, Y); c.rotate(ang); c.globalAlpha = 0.45; blitSized(c, beamSprite(F.deep), -T * 0.5, -T * 0.7, T * 5.4, T * 1.4); c.globalAlpha = 0.85; blitSized(c, beamSprite(F.col), -T * 0.4, -T * 0.45, T * 4.6, T * 0.9); c.globalAlpha = 0.9; blitSized(c, beamSprite('#FFF6E0'), -T * 0.2, -T * 0.16, T * 2.4, T * 0.32); c.restore();
      c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, X, Y, T * 1.3, F.col, 0.6); c.restore();
      paintFrag(c, X, Y, T * 0.55, F, t * 6 + s.seed, 1, 0, t, 0); });
    // the beams as they fire: a soft ray along the sand from under the bell, and a shaft down from the cyan fragment
    if (M.beams.length) { const P = pose(FX, m, M), fq = P.frag[1].g, FXx = sx(m.x) + fq[0] * T, FYy = sy(m.y) + fq[1] * T;
      M.beams.forEach(b => { const a = Math.pow(1 - b.t / b.life, 0.7), X0 = sx(b.x), Y0 = sy(b.y), X1 = sx(b.x + Math.cos(b.a) * BEAM_L), Y1 = sy(b.y + Math.sin(b.a) * BEAM_L);
        // (painted over the sand, not added to it: on the pale glass a ray of added light would wash the screen out)
        c.save(); c.globalAlpha = a * 0.55; softBeam(c, X0, Y0, X1, Y1, BEAM_W * T * 1.7, FRAG[1].tel); c.globalAlpha = a * 0.85; softBeam(c, X0, Y0, X1, Y1, BEAM_W * T * 0.95, CYA); c.globalAlpha = a * 0.9; softBeam(c, X0, Y0, X1, Y1, BEAM_W * T * 0.38, '#FFFFFF');
        c.globalAlpha = a * 0.6; softBeam(c, FXx, FYy, X0, Y0, T * 0.9, CYA); c.restore(); }); }
    // the white orb: a soft star of light hunting the pet, little sparks circling it
    const O = M.orb; if (O) { const X = sx(O.x), Y = sy(O.y) - O.z * T, pu = 0.85 + 0.15 * Math.sin(t * 9), lock = O.state === 'lock' ? clamp(O.lockT / 1.05, 0, 1) : 0;
      K.shade(c, X, Y, T * (1.5 + lock * 0.5) * pu, T * (1.5 + lock * 0.5) * pu, 0.3, '#6C5CE8'); c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, X, Y, T * (2.0 + lock * 1.0) * pu, '#B8A8FF', 0.55); c.restore();
      TN.shape(c, TN.ell(X, Y, T * 0.62, T * 0.62), { col: '#D4CCFF', shade: '#9A8CF0', shade2: '#8678E4', hi: '#FFFFFF', line: '#2E2290', lw: Math.max(1.4, T * 0.07), r: T * 0.62, d1: 0.12, d2: 0.22, spec: 0.8, specAt: [X - T * 0.2, Y - T * 0.22], force: true });
      c.save(); c.globalCompositeOperation = 'lighter'; K.glow(c, X, Y, T * 0.7, '#FFFFFF', 0.8); c.restore(); TN.twinkle(c, X, Y, T * 0.38, '#FFFFFF', 0.95);
      for (let k = 0; k < 5; k++) { const a = t * 2.4 + k * TAU / 5, r = T * (0.9 + 0.15 * Math.sin(t * 3 + k)); TN.twinkle(c, X + Math.cos(a) * r, Y + Math.sin(a) * r * 0.6, T * 0.16, '#FFFFFF', 0.85); } }
    // the labels over the bell: the bright fragment's colour and attack (an icon beside it), the meter, the stagger, the brood
    const P = pose(FX, m, M), X0 = sx(m.x), Y0 = sy(m.y), topY = Y0 + (-P.z0 - DH * P.domeK * VK - 0.95) * T, V = M.fv;
    if (V && !V.done && V.state !== 'end' && m.act === 'volley') { const F = FRAG[V.i], s = `${F.name} · ${F.act}`, px = Math.round(T * 0.46);
      c.save(); c.font = `900 ${px}px ${arcFont}`; const w = c.measureText(s).width; c.restore(); const ix = X0 - w / 2 - T * 0.55;
      icon(c, ix, topY, T * 0.4, V.i, t, lw); lab(c, X0 + T * 0.2, topY, s, F.col, T, 0.46);
      const f = P.frag[V.i], fx = X0 + f.g[0] * T, fy = Y0 + f.g[1] * T, n = V.need, dw = T * 0.4, x0 = fx - (n - 1) * dw / 2, yy = fy + T * 1.25;
      lab(c, fx, yy + T * 0.5, 'STRIKE THE FRAGMENT', F.hi, T, 0.32);
      for (let i = 0; i < n; i++) { const on = i < V.hits; c.beginPath(); c.arc(x0 + i * dw, yy, Math.max(3, T * 0.12), 0, TAU); c.fillStyle = on ? '#FFFFFF' : 'rgba(20,24,50,.75)'; c.fill(); c.lineWidth = 2; c.strokeStyle = on ? F.col : 'rgba(226,238,255,.85)'; c.stroke(); } }
    if (m.stunT > 0) { const nm = M.stunKind === 'exposed' ? 'EXPOSED' : M.stunKind === 'overload' ? 'OVERLOADED' : 'STAGGERED'; lab(c, X0, topY, `${nm} ${Math.ceil(m.stunT)}s`, '#FFFFFF', T, 0.46); lab(c, X0, topY + T * 0.55, 'TIPS ×2 · CORE ×2.5', AMB_HI, T, 0.32);
      if (FX.S.weak.core && !FX.S.weak.core.dead) { const q = P.pj(P.rot(CORE[0], CORE[1], CORE[2])); lab(c, X0 + q[0] * T, Y0 + q[1] * T - T * 0.75, 'CORE', '#FFFFFF', T, 0.3); } }
    const B = M.bd; if (B) { const left = Math.max(0, B.total - B.killed); lab(c, X0, topY - T * 0.1, `BROOD · ${left} left`, '#FFFFFF', T, 0.6); lab(c, X0, topY + T * 0.5, 'SEALED · clear the brood', SEALC, T, 0.32); } }
  // the little icon beside a volley's label: a comet, three beams, an orb
  function icon(c, x, y, s, i, t, lw) { const F = FRAG[i]; c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = 'rgba(10,10,30,.7)'; c.beginPath(); c.arc(x, y, s * 1.15, 0, TAU); c.fill(); c.strokeStyle = F.col; c.lineWidth = 2; c.stroke();
    if (i === 0) { c.strokeStyle = F.col; c.lineWidth = s * 0.28; c.beginPath(); c.moveTo(x - s * 0.7, y - s * 0.7); c.lineTo(x + s * 0.15, y + s * 0.15); c.stroke(); c.fillStyle = F.hi; c.beginPath(); c.arc(x + s * 0.25, y + s * 0.25, s * 0.35, 0, TAU); c.fill(); }
    else if (i === 1) { c.strokeStyle = F.col; c.lineWidth = s * 0.2; for (const a of [-0.55, 0, 0.55]) { c.beginPath(); c.moveTo(x - s * 0.15 * Math.cos(a), y + s * 0.7); c.lineTo(x + Math.sin(a) * s * 0.85, y - s * 0.65); c.stroke(); } c.fillStyle = F.hi; c.beginPath(); c.arc(x, y + s * 0.65, s * 0.22, 0, TAU); c.fill(); }
    else { c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(x, y, s * 0.42, 0, TAU); c.fill(); c.strokeStyle = '#B8A8FF'; c.lineWidth = s * 0.14; c.beginPath(); c.arc(x, y, s * 0.72, t * 2, t * 2 + 4.4); c.stroke(); }
    c.restore(); }
  // a soft ray between two screen points (feathered along both edges and both ends)
  function softBeam(c, x0, y0, x1, y1, w, col) { const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy); if (d < 2) return; c.save(); c.translate(x0, y0); c.rotate(Math.atan2(dy, dx)); blitSized(c, beamSprite(col), -w * 0.3, -w / 2, d + w * 0.6, w); c.restore(); }

  /* ---------- the Refracting Lagoon: the island of glass sand, and the shallows of liquid light round it ---------- */
  function paintFloor(c, A) { const R = A.R, rnd = A.rnd;
    // the shallows round the island: liquid light, fading out into the backdrop
    let g = c.createRadialGradient(0, 0, R - 0.3, 0, 0, R + 1.5); g.addColorStop(0, 'rgba(168,236,244,1)'); g.addColorStop(0.45, 'rgba(128,218,236,.75)'); g.addColorStop(1, 'rgba(112,206,228,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.5, 0, TAU); c.fill();
    // the island: pale glass sand, brightest at its heart
    g = c.createRadialGradient(-1, -2, 1, 0, 0, R + 0.2); g.addColorStop(0, '#F6FDFE'); g.addColorStop(0.55, '#E8F6F9'); g.addColorStop(0.88, '#D4EEF3'); g.addColorStop(1, '#BDE3EA'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.fill();
    c.save(); c.beginPath(); c.arc(0, 0, R + 0.1, 0, TAU); c.clip();
    // soft pools of colour, thrown by the prisms round the rim
    for (let i = 0; i < 10; i++) { const a = rnd() * TAU, d = 3 + rnd() * (R - 4), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 1.8 + rnd() * 2.6, gg = c.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, rgba(HUE[i % 6], 0.14)); gg.addColorStop(1, rgba(HUE[i % 6], 0)); c.fillStyle = gg; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
    // ripples in the sand: a shaded trough under a lit crest
    c.lineCap = 'round'; for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = 1.5 + rnd() * (R - 2.5), x = Math.cos(a) * d, y = Math.sin(a) * d, L = 0.8 + rnd() * 1.8, b = 0.25 + (rnd() - 0.5) * 0.5;
      c.strokeStyle = 'rgba(110,160,182,.07)'; c.lineWidth = 0.12; c.beginPath(); c.moveTo(x - Math.cos(b) * L, y - Math.sin(b) * L); c.quadraticCurveTo(x, y + 0.2, x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = 0.07; c.beginPath(); c.moveTo(x - Math.cos(b) * L, y - Math.sin(b) * L - 0.09); c.quadraticCurveTo(x, y + 0.1, x + Math.cos(b) * L, y + Math.sin(b) * L - 0.09); c.stroke(); }
    // rainbow caustics: rounded cells of light wavering over the sand (a soft wide pass under a fine bright one)
    for (let i = 0; i < 70; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.8), x = Math.cos(a) * d, y = Math.sin(a) * d, r = 0.3 + rnd() * 0.45, col = i % 6 ? '#FFFFFF' : HUE[i % 6], pts = [];
      for (let k = 0; k < 7; k++) { const b = k / 7 * TAU, rr = r * (0.75 + rnd() * 0.45); pts.push([x + Math.cos(b) * rr, y + Math.sin(b) * rr * 0.8]); }
      [[0.14, 0.05], [0.04, i % 6 ? 0.3 : 0.12]].forEach(([w, al]) => { c.beginPath(); TN.blob(pts)(c); c.strokeStyle = rgba(col, al); c.lineWidth = w; c.stroke(); }); }
    // glass grains glinting
    for (let i = 0; i < 1500; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, lt = rnd() < 0.55; c.fillStyle = lt ? `rgba(255,255,255,${0.35 + rnd() * 0.4})` : `rgba(120,180,200,${0.12 + rnd() * 0.18})`; const s = 0.035 + rnd() * 0.06; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, s, s); }
    // glass shards and little prisms half sunk in the sand
    for (let i = 0; i < 28; i++) { const a = rnd() * TAU, d = 2 + rnd() * (R - 3), x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.08 + rnd() * 0.12, col = rnd() < 0.5 ? HUE[Math.floor(rnd() * 6)] : '#BFE8F2'; c.save(); c.translate(x, y); c.rotate(rnd() * 3);
      c.fillStyle = rgba(col, 0.7); c.beginPath(); c.moveTo(0, -s * 1.6); c.lineTo(s, 0); c.lineTo(0, s); c.lineTo(-s, 0); c.closePath(); c.fill(); c.fillStyle = 'rgba(255,255,255,.85)'; c.fillRect(-s * 0.2, -s * 1.1, s * 0.3, s * 0.7); c.restore(); }
    // where it hovers: the sand fused to a pale sheen of glass, long ago
    const [hx, hy] = HOME; g = c.createRadialGradient(hx, hy, 0.5, hx, hy, 4.2); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(0.6, 'rgba(210,236,244,.18)'); g.addColorStop(1, 'rgba(210,236,244,0)'); c.fillStyle = g; c.beginPath(); c.arc(hx, hy, 4.2, 0, TAU); c.fill();
    c.restore();
    // the wet rim: a soft shaded band, then a line of white foam
    c.lineCap = 'round'; c.strokeStyle = 'rgba(70,150,170,.28)'; c.lineWidth = 0.5; c.beginPath(); c.arc(0, 0, R - 0.1, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 0.14; c.beginPath(); for (let i = 0; i <= 140; i++) { const a = i / 140 * TAU, r = R + 0.15 + Math.sin(a * 11) * 0.08 + Math.sin(a * 27) * 0.04; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, R + 0.6, 0, TAU); c.stroke(); }
  // the shallows of liquid light beyond the island: caustic light, far glass coral and kelp, motes
  function paintSky(c, W, H, T) { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#A4E6F2'); g.addColorStop(0.5, '#80D4E8'); g.addColorStop(1, '#68C6DE'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const R = mulberry32(7711); c.save();
    // soft pools of colour in the water
    c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H, r = 60 + R() * 120; c.globalAlpha = 0.12; blitSized(c, glowSprite(HUE[i % 6]), x - r, y - r, r * 2, r * 2); } c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    // the caustic web
    c.lineCap = 'round'; for (let i = 0; i < 90; i++) { const x = R() * W, y = R() * H, L = 18 + R() * 40, b = R() * TAU, w = (R() - 0.5) * 24; c.strokeStyle = i % 4 ? 'rgba(255,255,255,.16)' : rgba(HUE[i % 6], 0.2); c.lineWidth = 1.5 + R() * 2.5; c.beginPath(); c.moveTo(x - Math.cos(b) * L, y - Math.sin(b) * L); c.bezierCurveTo(x - Math.sin(b) * w, y + Math.cos(b) * w, x + Math.sin(b) * w, y - Math.cos(b) * w, x + Math.cos(b) * L, y + Math.sin(b) * L); c.stroke(); }
    // far glass coral and kelp, pale in the light
    for (let i = 0; i < 14; i++) { const x = R() * W, y = H * (0.15 + R() * 0.85), h = 40 + R() * 70, col = HUE[i % 6]; c.globalAlpha = 0.2;
      if (i % 2) { c.strokeStyle = col; c.lineWidth = 5; const br = (x0, y0, a, L, d) => { const x1 = x0 + Math.cos(a) * L, y1 = y0 + Math.sin(a) * L; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); if (d > 0) { br(x1, y1, a - 0.5, L * 0.7, d - 1); br(x1, y1, a + 0.45, L * 0.7, d - 1); } }; br(x, y, -Math.PI / 2, h * 0.45, 2); }
      else { c.fillStyle = col; c.beginPath(); c.moveTo(x - 5, y); c.bezierCurveTo(x - 16, y - h * 0.4, x + 14, y - h * 0.7, x + 3, y - h); c.bezierCurveTo(x + 18, y - h * 0.7, x - 2, y - h * 0.4, x + 5, y); c.closePath(); c.fill(); } }
    c.globalAlpha = 1;
    for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.5})`; c.beginPath(); c.arc(R() * W, R() * H, R() < 0.15 ? 1.6 : 0.8, 0, TAU); c.fill(); }
    c.restore(); }
})());
