/* ---------- (v451 GE, reworked v455 GE2) Wind's six-star summon Ultimate: GOLDEN EAGLE ----------
   The user's brief (2026-11-22): an enormous eagle flies into the battlefield and drives successive waves of cutting wind through
   the enemies with powerful wingbeats. The rework (2026-11-26): the animation rebuilt as one connected performance with overlapping
   motion, and layered wind for every wingbeat. The eagle's model is 20k5yd (GOLDEAGLE_GL); this file is the move: one authoritative
   timeline per cast, its waves and their hits, its choreography, its light, its clean-up.
   The cast (20b useUlt commits it: MP and the 35 s cooldown start there, the summons' convention, as Titan's and Snake Flame's): a
   short gesture (TUNE.gesture), then the pet has its full controls (move, dodge, Normal, Strongs) while the eagle runs on its own
   clock; enemy attacks and the encounter's timers go on. The normal camera: a small pull back (TUNE.zoom) while it flies, a little
   shake at each wingbeat (more at the last).
   The aim is fixed at the cast: the waves all travel that one way (the aim's angle), so the player can line the enemies up.
   The performance (game seconds from the cast; TUNE; choreo() below is a pure function of the tier, the aim and the side it comes
   from, so the studio previews and the tests pose exactly what the game plays):
     arrival      0 .. enter: a curved flight path in from behind and to one side, wings spread in a glide; it banks through the
                  turn (the bank follows the path's real turn rate), the tail fans and yaws to steer; then the wings flare forward
                  (high angle, primaries splayed and bent up, the tail spread down, the legs thrown forward with the talons open)
                  to brake into its place above and a little behind the cast. Its forward momentum carries on through the flare:
                  it drifts on and settles as the first anticipation begins (the path's end speed matched by an easing drift).
     a wingbeat   anticipation (TUNE.antic): the wings lift and open, the chest rises, jade and mint ribbons spiral in beneath the
                  wings with a few luminous feathers tracing the suction;
                  the power stroke (TUNE.dPre + dPost): driven from the shoulders, the elbows a fraction later, the wrists after,
                  the outer primaries last, flexing up under the load (their bend follows the shoulder's speed); a smooth
                  acceleration and deceleration, its fastest at the release, where the wave leaves the line under the wings;
                  follow-through: past the bottom, the chest dips, the body recoils back from the aim, the tail flicks to
                  counterbalance; the recovery: a slower upstroke, the wings partly folded (elbows and wrists flexed, primaries
                  closed and pronated), then reaching up and opening again.
     the final    a deeper wind-up: the slow upstroke, a high raise, then the widest span held quivering while the body rears
                  back, the legs swing forward and the talons open, a cry; the most forceful downstroke, the strongest recoil.
     departure    T_LEAVE .. T_GONE: it turns into a banking climb and beats away; its trailing feathers (the tail, the primaries,
                  then the secondaries, the coverts, the body, the head last) dissolve into golden feathers and wind as it goes,
                  the movement carrying on until it has faded.
   The head is held on the attack area throughout (a world point the rig's head tracks within its reach), with a subtle
   stabilising motion; it looks along its path as it leaves.
   Waves: 3 wingbeats at Base (evo 1-3), 4 at Adept (4-6), 6 at Celestial (7), the final one included. A wave is a crescent across
   the aim (convex ahead: its middle leads, its tips trail by TUNE.curv per tile squared), TUNE.w0 .. w1 wide each side as it runs
   (the final w0F .. w1F), at TUNE.v tiles a second to TUNE.range (the final vF, rangeF), from a line on the floor under the eagle's
   wings. The floor it may cross: rays along the aim, a column every TUNE.col tiles across it, each from where it first meets open,
   reachable floor in sight of the cast position to the first wall or gap: the visible wave stops there, and so do its hits.
   Hits: each wave hits each enemy once, as its front passes it (a Map a wave: the ribbons, vortices, feathers and the eagle are
   cosmetic and never add a hit), Wind damage (the pet's element): a wave TUNE.waveK DK, the final TUNE.finK DK, the largest single
   hit of the cast; DK = base x K x (1 + 0.08 (evo - 1)) (the elemental Ultimates' scale). Per enemy that stays in the path:
   2 x 2 + 6 = 10 DK at Base, 12 at Adept, 16 at Celestial. A brief stagger and a push along the aim on the others; bosses take the
   damage and keep their immunity (H.push leaves them; no stun). The crossing is found by sweeping the front from its last place to
   this frame's (and the width at the enemy's own place), so dt 1/60 or 1/4 give the same hits. Where a wave hits, and only there,
   short cutting arcs cross the enemy and a pressure ripple spreads at its feet.
   Light (the GPU painter: FGFX, the GE-FX blocks in 20k6h): a wave's standing crescent (368 its body, 369 its light: a thick
   luminous leading rim, the face fading from the sharp outer edge to the inner trailing edge, compression bands, spiral ribbons),
   its floor (370 the bright front and trail, 371 the shade and the moving dust crescent), 372 the final's inhale, 373 a pressure
   ring (under a downstroke; a contact's ripple), 374 a golden feather, 375 a soft ribbon; v455 GE2: 384 a ribbon of wind with a
   sharp bright outer edge fading across its width to the inner trailing edge (the gathering air, the wingtip trails, the
   downstroke's streaks, the cutting arcs, the departure's wind), 385 a stretch of a wingtip vortex (twisting strands at different
   pitches, the near side of each turn bright: its rotation reads), 386 a lifted pebble, 387 a leaf torn from foliage the front
   passes (the dungeon's props are still sprites: the foliage moves through what it sheds). The eagle on GLM (20k5yd) with its shaped
   shadow on the floor and its eyes' bloom. Without the GPU: the painted eagle and the plain 2D waves (as before). Particles come
   from fixed pools, thinned by Fewer effects; the hits never are. The eagle's parts over the pet or an enemy's warning are drawn
   see-through.
   Clean-up: everything lives in one ELEM effect: it ends with the timeline; at once (a quick dissolve, no more hits) when the caster
   is downed or the game is over; with the stage (its GPU buffers freed by the stage's end: 20b destroy). No timers outside it. */
(() => {
  const U = ELEM_IMPL.wind.ult, TAU = Math.PI * 2;
  /* every timing, size, count and multiplier (the cooldown is the row's in 20k1: keep the two the same) */
  const TUNE = {
    cd: 35,
    gesture: 0.45,                          // the pet's cast pose (s); full control after it
    enter: 1.35,                            // the arrival: the curved glide in, the bank, the flare (s)
    first: 1.86, gap: 0.74, inhale: 0.62,   // the first wave's release, between releases, the final's longer wind-up (s)
    antic: 0.26,                            // a wingbeat's anticipation: the wings lift and open (s)
    dPre: 0.11, dPost: 0.12, fol: 0.12,     // a downstroke before and after its release (its fastest point), its follow-through (s)
    dPreF: 0.12, dPostF: 0.16, folF: 0.2,   // the final's
    lagE: 0.03, lagW: 0.055, lagP: 0.085,   // the elbows', the wrists' and the primaries' lag behind the shoulders (s)
    leave: 1.6,                             // the banking climb and the dissolve after the final's follow-through (s)
    beats: [3, 4, 6],                       // wingbeats (waves) by tier: Base, Adept, Celestial (the final one included)
    waveK: 2.0, finK: 6.0,                  // damage, x DK: a wave, the final wave (the cast's largest hit)
    v: 7.0, range: 8.0, w0: 1.6, w1: 2.8, curv: 0.2, h: 0.7, trail: 1.4,          // a wave: speed (tiles/s), reach, half width at the start and at its reach, the tips' sweep back, height, the trail behind it
    vF: 8.0, rangeF: 9.5, w0F: 2.2, w1F: 3.8, curvF: 0.15, hF: 1.0, trailF: 2.0, // the final wave's
    band: 0.6,                              // the band behind the front that still counts as passing (tiles)
    col: 0.25,                              // the floor's columns across the aim (tiles apart)
    stun: 0.22, push: 0.45, stunF: 0.45, pushF: 1.0,   // the stagger (s) and push (tiles) on the others (bosses: none)
    sc: 0.9, hoverZ: 3.2, back: 1.4, origin: 0.6,      // the eagle's scale (span about 7.8 tiles), its hover height and place behind the cast, the waves' line ahead of that
    recoil: 0.24, recoilF: 0.5,             // the body's recoil back from the aim after a release (tiles)
    zoom: 0.9, shake: [1.5, 4.5],           // the camera: a small pull back while it flies; a wave's and the final's shake
    feathers: 30, motes: 26, dust: 36, pebbles: 14, leaves: 16, contacts: 16,   // cosmetic pools (thinned by Fewer effects; never the hits)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eio = u => { u = cl(u); return u * u * (3 - 2 * u); }, cosE = u => 0.5 - 0.5 * Math.cos(Math.PI * cl(u));
  const pulse = (x, x0) => { if (x <= 0) return 0; const q = x / x0; return q * q * Math.exp(2 - 2 * q); };   // (a kick: 0, easing up to 1 at x0, easing away: no corner at its start)
  const tierOf = ev => (ev >= 7 ? 2 : ev >= 4 ? 1 : 0);
  const G = () => GOLDEAGLE_GL;
  const fg = () => { try { if (typeof window !== 'undefined' && window.__GE_FX === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const STAT = { casts: 0, waves: 0, last: null };   // (tests read these: the last cast's record)
  let BLOB = null;   // (a soft shadow, made once)
  const blob = () => { if (BLOB) return BLOB; const cv = document.createElement('canvas'); cv.width = cv.height = 64; const g = cv.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(10,14,8,0.85)'); gr.addColorStop(0.55, 'rgba(10,14,8,0.4)'); gr.addColorStop(1, 'rgba(10,14,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (BLOB = cv); };
  const C_MINT = '#A8FFE0', C_JADE = '#2FD69C', C_CHAMP = '#FFEFC4', C_WHITE = '#EFFFF8', C_DUST = '#D8CDA8';
  /* the release times (s from the cast): every gap, the last after the longer wind-up */
  const releases = n => { const r = []; for (let k = 0; k < n; k++) r.push(k < n - 1 ? TUNE.first + k * TUNE.gap : TUNE.first + Math.max(0, n - 2) * TUNE.gap + (n > 1 ? TUNE.gap + TUNE.inhale : 0)); return r; };
  const FOLIAGE = /flower|tulip|lily|shroom|caps|bloom|fern|bush|shrub|reed|kelp|plant|bulb|lotus|cypress|mangrove|cactus|pine|palm|oak|willow|tree|fungus|grass|vine|leaf|ivy|moss|hedge|weed/;

  /* ================= the choreography: the eagle's pose at time t, a pure function of the tier, the aim and the side ================= */
  /* (relative to the hover point HP on the floor: x, y in tiles from it, z its height) */
  function choreo(tier, A, side) {
    const NB = TUNE.beats[tier], TR = releases(NB), last = NB - 1, dx = Math.cos(A), dy = Math.sin(A), nx = -dy, ny = dx;
    const WP = G().WP, wmix = G().wmix, mk = (b, o) => Object.assign({}, b, o);
    const LIFT = wmix(WP.mid, WP.top, 0.55), BOTF = mk(WP.bottom, { elev: -0.98, sweep: -0.16, twist: 0.32, curl: 0.26 }), WIDEF = mk(WP.widest, { elev: 0.16, sweep: -0.04, fan: 1.22 }), RAISEF = mk(WP.raise, { elev: 1.2, sweep: 0.0, elbow: 0.32, wrist: 0.2, fan: 1.08, pron: -0.2 }), DTOP = mk(WP.top, { elev: 0.82, sweep: 0.12 });
    const dPre = k => (k === last ? TUNE.dPreF : TUNE.dPre), dPost = k => (k === last ? TUNE.dPostF : TUNE.dPost), fol = k => (k === last ? TUNE.folF : TUNE.fol);
    const Ds = k => TR[k] - dPre(k), De = k => TR[k] + dPost(k), Tf = De(last) + fol(last);
    const T_LEAVE = Tf + 0.08, T_GONE = T_LEAVE + TUNE.leave;
    const wsp = Ds(last) - (De(last - 1) + fol(last - 1)), W1 = De(last - 1) + fol(last - 1) + wsp * 0.3, W2 = W1 + wsp * 0.25, W3 = Ds(last) - 0.2;   // (the final's wind-up: the slow upstroke, opening out to the widest span, held gathering, then the deep raise)
    /* the arrival's path: a cubic from far behind and to one side, curving in to come up from behind and below the hover, its end
       tangent forward and up; time-warped to slow through the flare but not stop: the end speed is carried on by a decaying drift */
    const E = 0.45, tl = Math.hypot(1, 0.55), td = [dx / tl, dy / tl, 0.55 / tl], hz = TUNE.hoverZ;
    const P0 = [-dx * 11 + nx * side * 6.5, -dy * 11 + ny * side * 6.5, 6.0], P1 = [-dx * 4.5 + nx * side * 6.0, -dy * 4.5 + ny * side * 6.0, 3.0];
    const P3 = [-td[0] * E, -td[1] * E, hz - td[2] * E], P2 = [P3[0] - td[0] * 2.2, P3[1] - td[1] * 2.2, P3[2] - td[2] * 2.2];
    const bez = (u, i) => { const v = 1 - u; return v * v * v * P0[i] + 3 * v * v * u * P1[i] + 3 * v * u * u * P2[i] + u * u * u * P3[i]; };
    const bezD = (u, i) => { const v = 1 - u; return 3 * v * v * (P1[i] - P0[i]) + 6 * v * u * (P2[i] - P1[i]) + 3 * u * u * (P3[i] - P2[i]); };
    const warp = s => s + 0.8 * s * (1 - s), warpD = s => 1.8 - 1.6 * s;
    const vEnd = Math.hypot(bezD(1, 0), bezD(1, 1), bezD(1, 2)) * warpD(1) / TUNE.enter, LAM = vEnd / E;
    const arrVel = t => { const s = cl(t / TUNE.enter), u = warp(s), k = warpD(s) / TUNE.enter; return [bezD(u, 0) * k, bezD(u, 1) * k, bezD(u, 2) * k]; };
    const head = v => Math.atan2(v[1], v[0]);
    const angD = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
    /* the departure's path: a banking climb turning toward `side`, accelerating; integrated from T_LEAVE (Simpson's rule) */
    const TURN = 1.25, dHead = tau => A + side * TURN * sstep(0, 1.1, tau), dSpd = tau => 1.2 + 4.5 * tau;
    const depPos = tau => { if (tau <= 0) return [0, 0, 0]; const n = 16, h = tau / n; let x = 0, y = 0; for (let i = 0; i <= n; i++) { const q = i * h, w = i === 0 || i === n ? 1 : i % 2 ? 4 : 2, v = dSpd(q), a = dHead(q); x += w * v * Math.cos(a); y += w * v * Math.sin(a); } return [x * h / 3, y * h / 3, tau + 1.6 * tau * tau]; };
    /* the synchronous key of the wing (every joint on the same clock); the rig's joints read it at their own lags */
    function wingKey(t, o) {
      if (t < TUNE.enter) { const s = t / TUNE.enter;
        const gq = 1 - eio((s - 0.6) / 0.24);   // (the glide's slow breathing, fading through the flare)
        if (s < 0.84) { wmix(WP.glide, WP.flare, eio((s - 0.6) / 0.24), o); o.elev += 0.05 * Math.sin(t * 5) * gq; o.flexO += 0.04 * Math.sin(t * 5 + 1) * gq; return o; }
        wmix(WP.flare, WP.flare, 0, o); const q = Math.sin(t * 40) * 0.03 * (s - 0.84) / 0.16; o.fan += q; o.flexO += q * 2; return o; }
      if (t >= T_LEAVE) return depWing(t, o);
      let k = 0; while (k < NB && t >= De(k) + fol(k)) k++;
      if (k >= NB) return wmix(WP.past, WP.mid, eio((t - Tf) / 0.3), o);
      if (t >= De(k)) return wmix(k === last ? BOTF : WP.bottom, WP.past, eio((t - De(k)) / fol(k)), o);   // (the follow-through: on past the bottom)
      if (t >= Ds(k)) { const u = t < TR[k] ? 0.5 * (t - Ds(k)) / dPre(k) : 0.5 + 0.5 * (t - TR[k]) / dPost(k); return wmix(k === last ? RAISEF : WP.top, k === last ? BOTF : WP.bottom, cosE(u), o); }   // (the downstroke: fastest at the release)
      if (k === 0) return wmix(WP.flare, WP.top, eio((t - TUNE.enter) / (Ds(0) - TUNE.enter)), o);   // (out of the flare: the wings lift and open)
      const t0 = De(k - 1) + fol(k - 1);
      if (k < last) { const Ta = Ds(k) - TUNE.antic;
        if (t < Ta) { const u = (t - t0) / Math.max(0.05, Ta - t0); return u < 0.6 ? wmix(WP.past, WP.mid, eio(u / 0.6), o) : wmix(WP.mid, LIFT, eio((u - 0.6) / 0.4), o); }   // (the slower upstroke, partly folded)
        return wmix(LIFT, WP.top, eio((t - Ta) / TUNE.antic), o); }   // (the anticipation: lift and open)
      if (t < W1) return wmix(WP.past, WP.mid, eio((t - t0) / (W1 - t0)), o);
      if (t < W2) return wmix(WP.mid, WIDEF, eio((t - W1) / (W2 - W1)), o);   // (opening out to the widest span)
      if (t < W3) { wmix(WIDEF, WIDEF, 0, o); const q = Math.sin(t * 31) * 0.022 * sstep(W2, W2 + 0.08, t) * (1 - sstep(W3 - 0.08, W3, t)); o.elev += q; o.fan += q; o.flexO += q * 2; return o; }   // (held, quivering, gathering the air)
      return wmix(WIDEF, RAISEF, eio((t - W3) / (Ds(last) - W3)), o);   // (the deep raise into the final stroke)
    }
    const WD = {};
    function depWing(t, o) { const tau = t - T_LEAVE, per = 0.44, ph = ((tau + 0.3) / per) % 1;
      if (ph < 0.42) wmix(DTOP, WP.bottom, cosE(ph / 0.42), WD); else { const u = (ph - 0.42) / 0.58; if (u < 0.5) wmix(WP.bottom, WP.mid, eio(u * 2), WD); else wmix(WP.mid, DTOP, eio(u * 2 - 1), WD); }
      wmix(WP.past, WP.mid, eio((t - Tf) / 0.3), o); wmix(o, WD, sstep(0, 0.22, tau), o); return wmix(o, WP.glide, sstep(0.9, 1.5, tau) * 0.65, o); }
    /* the wing at t: the shoulders on the key, the elbows, wrists and primaries a fraction later; the primaries bend under the load
       (the shoulder's angular speed, read at their lag), the secondaries' trailing edge too */
    const K0 = {}, K1 = {}, K2 = {}, K3 = {}, K4 = {};
    function wingAt(t, out) {
      const lk = t >= Ds(last) - 0.02 && t < Tf ? 1.25 : 1;
      wingKey(t, K0); wingKey(t - TUNE.lagE * lk, K1); wingKey(t - TUNE.lagW * lk, K2); wingKey(t - TUNE.lagP * lk + 0.02, K3); wingKey(t - TUNE.lagP * lk - 0.02, K4);
      const om = (K3.elev - K4.elev) / 0.04, x = -om * 0.042, fl = x > 0 ? 0.55 * Math.tanh(x / 0.55) : 0.32 * Math.tanh(x / 0.32);   // (the load: the shoulder's speed over a short window at the primaries' lag, softly limited)
      wingKey(t - TUNE.lagP * lk, K3);
      Object.assign(out, K0); out.twist = lerp(K0.twist, K1.twist, 0.5); out.elbow = K1.elbow; out.wrist = K2.wrist; out.bend = K2.bend; out.fan = K3.fan; out.curl = K3.curl;
      out.flexI = K3.flexI + 0.45 * fl; out.flexM = K3.flexM + 0.8 * fl; out.flexO = K3.flexO + fl; out.pron = K3.pron + 0.25 * fl; out.trail = K2.trail + 0.55 * fl;
      return out; }
    const look = [dx * (TUNE.origin + 3.2), dy * (TUNE.origin + 3.2), 0.2];
    const nextK = t => { for (let k = 0; k < NB; k++) if (t < TR[k]) return k; return NB; };
    /* the whole pose at t (P for the rig; dead: the time the caster fell, else -1) */
    function pose(t, dead) {
      const w = wingAt(t, {}), k = nextK(t), P = { sc: TUNE.sc, t, k: tier, wing: w, head: {}, look, jaw: 0, spill: 0, spillO: true, grip: 0.45, leg: 0.3 };
      let pl = 0, dip = 0, rec = 0, flick = 0; for (let j = 0; j < NB; j++) { const tau = t - TR[j]; if (tau <= 0) break; const f = j === last; pl += Math.exp(-tau * 7); dip += (f ? 0.3 : 0.15) * pulse(tau, 0.13); rec += (f ? TUNE.recoilF : TUNE.recoil) * pulse(tau, 0.2); flick += (f ? 0.55 : 0.3) * pulse(tau, 0.16); }
      let open = 0; for (let j = 0; j < last; j++) open += sstep(Ds(j) - TUNE.antic, Ds(j), t) * (1 - sstep(Ds(j), TR[j] + 0.12, t));   // (each regular beat's anticipation: the chest rising)
      const rear = sstep(W1, Ds(last), t) * (1 - sstep(Ds(last), TR[last] + 0.08, t));
      P.glow = 0.75 + 0.6 * pl + 0.8 * rear + 0.3 * open; P.glow2 = 0.55 * pl + 0.4 * rear;
      if (t < TUNE.enter) { // the arrival: the curved glide, the bank, the flare
        const s = t / TUNE.enter, u = warp(s), v = arrVel(t), vh = Math.hypot(v[0], v[1]) || 1e-6, ps = head(arrVel(t - 0.03)), pn = head(arrVel(t + 0.03)), rate = angD(pn, ps) / 0.06, fl = sstep(0.62, 0.95, s);
        P.x = bez(u, 0); P.y = bez(u, 1); P.z = bez(u, 2); P.yaw = head(v);
        P.roll = Math.max(-0.8, Math.min(0.8, -Math.atan(vh * rate / 7))) * (1 - fl);
        P.pitch = lerp(Math.atan2(v[2], vh) * 0.5, 0.63 + 0.06 * w.elev, fl); P.z += -0.13 * w.elev * fl; P.glow = 0.8; P.glow2 = 0;
        P.tail = { fan: lerp(0.35 + 0.45 * Math.min(1, Math.abs(rate) * 0.6), 1.05, fl), pitch: lerp(0.05, -0.42, fl), yaw: Math.max(-0.35, Math.min(0.35, rate * 0.22)) * (1 - fl), roll: P.roll * 0.4 };
        P.leg = lerp(-1.15, 0.8, sstep(0.66, 0.97, s)); P.grip = lerp(0.95, 0.0, sstep(0.7, 1, s)); }
      else { const dr = Math.exp(-LAM * (t - TUNE.enter)), bob = -0.13 * w.elev, fe = Math.exp(-(t - TUNE.enter) * 5);   // (fe: the flare's attitude easing out into the hover)
        P.x = P3[0] * dr - dx * rec; P.y = P3[1] * dr - dy * rec; P.z = hz + (P3[2] - hz) * dr + bob + 0.06 * open + 0.25 * rear;
        P.yaw = A + 0.03 * Math.sin(t * 1.7) * (1 - fe); P.roll = 0.04 * Math.sin(t * 2.1) * (1 - fe); P.pitch = 0.5 + 0.13 * open + 0.4 * rear - dip + 0.06 * w.elev + 0.13 * fe;
        P.tail = { fan: 0.92 + 0.15 * flick + 0.12 * rear + 0.13 * fe, pitch: -0.28 + 0.45 * flick - 0.2 * rear - 0.14 * fe, yaw: 0.05 * Math.sin(t * 1.3) * (1 - fe), roll: 0 };
        P.leg = 0.3 + 0.45 * rear - 0.3 * sstep(TR[last], Tf + 0.3, t) + 0.5 * fe; P.grip = lerp(0.45, 0.0, rear) + 0.5 * sstep(TR[last] + 0.1, Tf + 0.3, t) - 0.45 * fe;
        P.jaw = 0.6 * Math.sin(Math.PI * cl((rear - 0.3) / 0.7)) * (rear > 0.3 ? 1 : 0) + 0.25 * Math.exp(-Math.max(0, t - TR[Math.max(0, k - 1)]) * 9) * (k > 0 ? 1 : 0);
        if (t >= T_LEAVE) { // the departure: a banking climb, beating away, dissolving from the trailing feathers in
          const tau = t - T_LEAVE, q = depPos(tau), hh = dHead(tau), rate = side * TURN * (sstep(0, 1.1, tau + 0.02) - sstep(0, 1.1, tau - 0.02)) / 0.04, v = dSpd(tau), bl = sstep(0, 0.35, tau);   // (from the hover's own motion, carried on: no jump)
          P.x += q[0]; P.y += q[1]; P.z += q[2]; P.yaw = hh + (1 - bl) * 0.03 * Math.sin(t * 1.7);
          P.roll = lerp(P.roll, Math.max(-0.8, Math.min(0.8, -Math.atan(v * rate / 7))), bl); P.pitch = lerp(P.pitch, lerp(0.5, 0.3, sstep(0, 0.6, tau)) + 0.06 * w.elev, bl);
          P.tail = { fan: lerp(P.tail.fan, 0.7 - 0.25 * sstep(0.4, 1.2, tau), bl), pitch: lerp(P.tail.pitch, -0.12, bl), yaw: -rate * 0.12, roll: P.roll * 0.4 }; P.leg = lerp(P.leg, -1.15, sstep(0, 0.45, tau)); P.grip = lerp(P.grip, 1, sstep(0, 0.45, tau));
          P.look = [P.x + Math.cos(hh) * 6, P.y + Math.sin(hh) * 6, P.z - 0.5]; P.jaw = 0.4 * Math.exp(-tau * 4);
          P.spill = sstep(0.3, TUNE.leave - 0.05, tau); } }
      P.head = { pitch: 0.012 * Math.sin(t * 7.3), yaw: 0.015 * Math.sin(t * 5.1 + 1), roll: 0 };   // (a subtle stabilising motion over the tracking)
      if (dead >= 0) { P.spill = Math.max(P.spill, cl((t - dead) / 0.5)); P.spillO = false; }
      return P;
    }
    return { pose, wingAt, NB, TR, last, Ds, De, dPre, dPost, T_LEAVE, T_GONE, Tf, W1, W2, W3, enter: TUNE.enter, nextK, look };
  }

  U.goldeneagle = (C, H) => {
    const me = H.me, X = H.X, g0 = H.g, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = tierOf(ev), NB = TUNE.beats[tier];
    const DK = C.base * (C.K || 1) * (1 + 0.08 * (ev - 1)), waveD = DK * TUNE.waveK, finD = DK * TUNE.finK;
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the pose only; the controls were never taken)
    X.banner('GOLDEN EAGLE', '', C.col, 1.4); if (X.sfx.hum) X.sfx.hum();
    if (G().usable()) G().ensure();   // (built now if the idle time has not: the meshes are reused by every later cast)
    /* ---- the aim (fixed for the whole cast), the hover, the waves' line ---- */
    const A = isFinite(C.a) ? C.a : 0, dx = Math.cos(A), dy = Math.sin(A), nx = -dy, ny = dx;
    const C0 = { x: me.x, y: me.y }, HP = { x: C0.x - dx * TUNE.back, y: C0.y - dy * TUNE.back }, O = { x: HP.x + dx * TUNE.origin, y: HP.y + dy * TUNE.origin };
    const side = Math.random() < 0.5 ? 1 : -1, CH = choreo(tier, A, side);
    const TR = CH.TR, T_LAST = TR[NB - 1], T_LEAVE = CH.T_LEAVE, T_GONE = CH.T_GONE, T_END = Math.max(T_GONE, T_LAST + TUNE.rangeF / TUNE.vF + 0.35) + 0.05;
    /* ---- the floor the waves may cross: a column every TUNE.col tiles across the aim; each from its first open floor (in sight of the
       cast position) to the first wall or gap along the aim ---- */
    const ok = (x, y) => { try { if (X.blocked(x, y, 0.05, 0)) return false; const f = X.flowAt ? X.flowAt(x, y) : 0; return f < 9999; } catch (e) { return true; } };
    const los = (x0, y0, x1, y1) => { try { return X.los ? X.los(x0, y0, x1, y1) : true; } catch (e) { return true; } };
    const CW = TUNE.col, NC = 2 * Math.ceil((TUNE.w1F + 0.8) / CW) + 1, J0 = (NC - 1) / 2, cS = new Float32Array(NC), cR = new Float32Array(NC), RMAX = TUNE.rangeF + 0.5;
    for (let j = 0; j < NC; j++) { const of = (j - J0) * CW; let s0 = null;
      for (let s = -0.6; s <= 1.6 + 1e-6; s += 0.2) { const px = O.x + dx * s + nx * of, py = O.y + dy * s + ny * of; if (ok(px, py) && los(C0.x, C0.y, px, py)) { s0 = s; break; } }
      if (s0 == null) { cS[j] = 99; cR[j] = -1; continue; }
      let s = s0; while (s < RMAX && ok(O.x + dx * s + nx * of, O.y + dy * s + ny * of)) s += 0.2; cS[j] = s0; cR[j] = Math.min(RMAX, s - 0.1); }
    const colAt = of => { const j = Math.round(of / CW + J0); return j < 0 || j >= NC ? -1 : j; };
    const onFloor = (al, of) => { const j = colAt(of); return j >= 0 && cR[j] >= 0 && al >= cS[j] - 0.05 && al <= cR[j] + 0.05; };
    /* ---- the waves: their own reach, width, front ---- */
    const waves = TR.map((t0, k) => { const fin = k === NB - 1; return { k, fin, t0, v: fin ? TUNE.vF : TUNE.v, range: fin ? TUNE.rangeF : TUNE.range, w0: fin ? TUNE.w0F : TUNE.w0, w1: fin ? TUNE.w1F : TUNE.w1, curv: fin ? TUNE.curvF : TUNE.curv, h: fin ? TUNE.hF : TUNE.h, trail: fin ? TUNE.trailF : TUNE.trail, dmg: fin ? finD : waveD, prev: -1, done: false, hits: new Map(), walls: new Uint8Array(NC), released: false, peb: 0 }; });
    const hwAt = (w, s) => lerp(w.w0, w.w1, cl(s / w.range)), sNow = (w, t) => (t < w.t0 ? -1 : Math.min(w.range, w.v * (t - w.t0)));
    /* ---- the record (tests): the beats, every hit ---- */
    const S = { cast: ++STAT.casts, tier, NB, TR, DK, waveD, finD, A, side, C0, HP, O, log: [], hits: [], contacts: 0, dead: -1, zoomOurs: false, cS, cR, NC, CW, J0, T_END, T_LEAVE, T_GONE, waves: waves.map(w => ({ k: w.k, fin: w.fin, t0: w.t0, v: w.v, range: w.range, curv: w.curv, w0: w.w0, w1: w.w1 })) };
    STAT.last = S;
    /* ---- the cosmetic pools (fixed sizes) ---- */
    const Qk = lowFx() ? 0.4 : 1, NF = Math.max(8, Math.round(TUNE.feathers * Qk)), NM = Math.max(8, Math.round(TUNE.motes * Qk)), ND = Math.max(10, Math.round(TUNE.dust * Qk)), NPB = Math.max(4, Math.round(TUNE.pebbles * Qk)), NLV = Math.max(6, Math.round(TUNE.leaves * Qk)), NCT = TUNE.contacts;
    const mkP = n => Array.from({ length: n }, () => ({ on: false }));
    const FE = mkP(NF), MO = mkP(NM), DU = mkP(ND), PU = mkP(10), PB = mkP(NPB), LV = mkP(NLV), CT = mkP(NCT);
    let nF = 0, nM = 0, nD = 0, nP = 0, nPB = 0, nLV = 0, nCT = 0;
    const feather = (p, vx, vy, vz, life, burn) => { const q = FE[nF++ % NF]; Object.assign(q, { on: true, x: p[0], y: p[1], z: p[2], vx, vy, vz, t: 0, life, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 5, sd: Math.random(), cv: (Math.random() - 0.5) * 0.8, burn: !!burn, ph: Math.random() * TAU }); };
    /* the foliage in and beside the waves' path (props on its wall tiles: they shed leaves as a front passes) */
    const FOL = []; try { const cp = X.carProps; if (cp && cp.propAt) { const seen = new Set(), W = TUNE.w1F + 1.6;
      for (let s = -1; s <= RMAX + 1; s += 0.7) for (let of = -W; of <= W; of += 0.7) { const tx = Math.floor(O.x + dx * s + nx * of), ty = Math.floor(O.y + dy * s + ny * of), key = tx + ',' + ty; if (seen.has(key)) continue; seen.add(key);
        const p = cp.propAt(tx, ty); if (!p || p.broken || !FOLIAGE.test(String(p.kind || ''))) continue; const rx = tx + 0.5 - O.x, ry = ty + 0.5 - O.y, kd = String(p.kind);
        FOL.push({ x: tx + 0.5, y: ty + 0.5, al: rx * dx + ry * dy, of: rx * nx + ry * ny, col: /shroom|caps|fungus/.test(kd) ? '#E8D8F0' : /flower|tulip|lily|bloom|lotus/.test(kd) ? '#FF9EC4' : /cactus|kelp|reed/.test(kd) ? '#7FBF60' : '#5FB24A', w: 0 }); if (FOL.length >= 24) break; } } } catch (e) {}
    /* one wave's sweep this frame: every living enemy its front passed since the last frame (once a wave: the Map), on the floor it may cross */
    function sweep(w, t) {
      const s = sNow(w, t); if (s < 0 || w.done) return; const s0 = w.prev < 0 ? 0 : w.prev;
      for (const m of H.living()) { if (w.hits.has(m)) continue; const rx = m.x - O.x, ry = m.y - O.y, al = rx * dx + ry * dy, of = rx * nx + ry * ny, rr = (m.r || 0.4) * 0.6, cq = w.curv * of * of;
        if (al < -0.8 || al - rr > s - cq || al + rr < s0 - cq - TUNE.band) continue;   // (not reached yet, or already behind the front's last place)
        const sc = Math.max(0, Math.min(w.range, al + cq)); if (Math.abs(of) > hwAt(w, sc) + (m.r || 0.4) * 0.5) continue;   // (the width at its own place: the same whatever the frame step)
        const j = colAt(of); if (j < 0 || cR[j] < 0 || al < cS[j] - rr - 0.2 || al > cR[j] + rr) continue;   // (the floor it may cross: walls stop it)
        w.hits.set(m, 1); X.hitMon(m, w.dmg, C.dmgO(m.boss ? {} : { stun: w.fin ? TUNE.stunF : TUNE.stun }));
        if (!m.boss) H.push(m, m.x - dx, m.y - dy, w.fin ? TUNE.pushF : TUNE.push);   // (a push along the aim; H.push leaves a boss or a still one where it is)
        S.hits.push({ k: w.k, fin: w.fin, t, id: H.mons.indexOf(m), boss: !!m.boss, d: w.dmg });
        const q = CT[nCT++ % NCT]; Object.assign(q, { on: true, x: m.x, y: m.y, z: Math.max(0.3, (m.r || 0.4) * 0.9), t: 0, life: w.fin ? 0.42 : 0.32, fin: w.fin, sd: Math.random(), fl: Math.random() < 0.5 ? 1 : -1 }); S.contacts++; }   // (the contact: only where it actually hits)
      w.prev = s; if (s >= w.range - 1e-9) { w.done = true; S.log.push(['end', w.k, Math.round(t * 1000) / 1000, w.hits.size]); } }

    /* ---- the pose ---- */
    const WZ0 = [];
    let WZ = WZ0;
    const warns = () => (X.zones || []).filter(z => z.kind === 'warn' && z.own !== 'pet');
    const overWarn = (z, x, y, pad) => { const ddx = x - z.x, ddy = y - z.y; if (z.shape === 'line' || z.shape === 'cone') { const ca = Math.cos(z.a || 0), sa = Math.sin(z.a || 0), al = ddx * ca + ddy * sa, of = -ddx * sa + ddy * ca, L = z.len || 1;
        if (al < -pad || al > L + pad) return false; return z.shape === 'line' ? Math.abs(of) < (z.w || 1) / 2 + pad : Math.abs(of) < Math.tan(Math.min(1.5, z.spread || 0.5)) * Math.max(0, al) + pad; }
      return Math.hypot(ddx, ddy) < (z.r || 1) + pad; };
    const GYc = G().GY, ZKc = G().ZK;
    const fadeAt = p => { const wx = HP.x + p[0], wy = HP.y + p[1], ddx = wx - me.x, dys = (wy - me.y) * GYc - p[2] * ZKc; let a = 1;
      if (!me.dead && Math.abs(ddx) < 0.62 && dys > -1.25 && dys < 0.3) a = 0.45;   // (over the pet's sprite: see-through, the player's view kept)
      for (const z of WZ) if (p[2] < 1.6 && overWarn(z, wx, wy, 0.3)) { a = Math.min(a, 0.55); break; }   // (low over an enemy's warning)
      return a; };
    const fadeIn = t => sstep(0, 0.14, t);
    let RG = null, RGt = -1, PZ = null;
    const rigNow = t => { if (RGt === t && RG) return RG; PZ = CH.pose(t, S.dead); PZ.fade = fadeAt; RG = G().rig(PZ); RGt = t; return RG; };
    const TRAIL = [[], []]; let trailT = 0;
    const spawnN = rate => { const want = rate * H.Q(); return Math.floor(want) + (Math.random() < want % 1 ? 1 : 0); };
    /* ---- the update: the authoritative clock ---- */
    function update(dt, f) {
      const t = f.t, g = H.g;
      if (g !== g0) { f.life = 0; return; }   // (the stage changed under it)
      if (S.dead < 0 && (me.dead || g.over)) { S.dead = t; S.log.push(['dead', Math.round(t * 1000) / 1000]); f.life = Math.min(f.life, 0.6); if (S.zoomOurs && g.zoomP === TUNE.zoom) g.zoomT = Math.min(g.zoomT || 0, 0.05); }   // (the caster downed: a quick dissolve, no more hits)
      if (S.dead < 0) {
        for (const w of waves) {
          if (!w.released && t >= w.t0 - 1e-9) { w.released = true; STAT.waves++; S.log.push([w.fin ? 'fin' : 'wave', w.k, Math.round(w.t0 * 1000) / 1000]); release(w); }
          if (w.released) sweep(w, t); }
        if (TUNE.zoom !== 1 && t > TUNE.gesture && t < T_GONE && (g.zoomP === 1 || g.zoomP === TUNE.zoom)) { g.zoomP = TUNE.zoom; g.zoomT = Math.max(g.zoomT || 0, 0.12); S.zoomOurs = true; }
        if (!S.inh && NB > 1 && t >= CH.W1) { S.inh = true; if (X.sfx.hum) X.sfx.hum(); if (X.sfx.chirp) X.sfx.chirp(); }
      }
      WZ = warns();
      // the cosmetics: the wingtips' trails, the inhale's motes, the dust, pebbles and leaves at the waves' fronts, the feathers' drift
      const R = t > 0.02 && t < T_GONE ? rigNow(t) : null; trailT += dt;
      if (R && trailT > 0.03) { trailT = 0; for (let i = 0; i < 2; i++) { const q = R.A.tips[i]; TRAIL[i].push([q[0], q[1], q[2], t]); while (TRAIL[i].length > (t > T_LEAVE ? 13 : 9)) TRAIL[i].shift(); } }
      const inhOn = S.dead < 0 && NB > 1 && t > CH.W1 && t < TR[NB - 1] - 0.05;
      if (inhOn && R) { let n = spawnN(dt * 30); while (n-- > 0) { const q = MO[nM++ % NM], a = Math.random() * TAU; Object.assign(q, { on: true, a, r: 2.6 + Math.random() * 1.4, z: (Math.random() - 0.3) * 1.6, t: 0, life: 0.5 + Math.random() * 0.25, sp: 0.8 + Math.random() * 0.5 }); } }
      for (const q of MO) if (q.on) { q.t += dt; q.r = Math.max(0, q.r - dt * q.sp * 5.2 * (0.4 + q.t)); q.a += dt * 2.2; if (q.t >= q.life || q.r < 0.15) q.on = false; }
      for (const w of waves) { if (!w.released || S.dead >= 0) continue; const s = sNow(w, t); if (s < 0.3 || s >= w.range) continue; const hw = hwAt(w, s);
        let n = spawnN(dt * (w.fin ? 22 : 12));
        while (n-- > 0) { const of = (Math.random() * 2 - 1) * hw * 0.92, sf = s - w.curv * of * of; if (!onFloor(sf, of)) continue; const q = DU[nD++ % ND];
          Object.assign(q, { on: true, x: O.x + dx * sf + nx * of, y: O.y + dy * sf + ny * of, z: 0.05, vx: dx * w.v * 0.35 + (Math.random() - 0.5) * 0.6, vy: dy * w.v * 0.35 + (Math.random() - 0.5) * 0.6, vz: 0.6 + Math.random() * 1.0, t: 0, life: 0.45 + Math.random() * 0.3, s: 0.05 + Math.random() * 0.05 }); }
        // a few pebbles lifted by the front, thrown ahead
        n = spawnN(dt * (w.fin ? 9 : 4.5));
        while (n-- > 0) { const of = (Math.random() * 2 - 1) * hw * 0.85, sf = s - w.curv * of * of; if (!onFloor(sf, of)) continue; const q = PB[nPB++ % NPB];
          Object.assign(q, { on: true, x: O.x + dx * sf + nx * of, y: O.y + dy * sf + ny * of, z: 0.04, vx: dx * w.v * (0.3 + Math.random() * 0.25) + nx * (Math.random() - 0.5) * 0.8, vy: dy * w.v * (0.3 + Math.random() * 0.25) + ny * (Math.random() - 0.5) * 0.8, vz: 1.6 + Math.random() * 1.2, t: 0, s: 0.05 + Math.random() * 0.05, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, sd: Math.random(), bn: 0 }); }
        // the foliage the front passes: leaves torn off and carried along it
        for (const fo of FOL) { if (fo.w & (1 << w.k)) continue; if (s - w.curv * fo.of * fo.of < fo.al - 0.3 || Math.abs(fo.of) > hw + 1.4) continue; fo.w |= 1 << w.k;
          let m = Math.max(1, Math.round((w.fin ? 5 : 3) * H.Q())); while (m-- > 0) { const q = LV[nLV++ % NLV]; Object.assign(q, { on: true, x: fo.x + (Math.random() - 0.5) * 0.5, y: fo.y + (Math.random() - 0.5) * 0.3, z: 0.4 + Math.random() * 0.8, vx: dx * (1.6 + Math.random() * 1.6) + nx * (Math.random() - 0.5), vy: dy * (1.6 + Math.random() * 1.6) + ny * (Math.random() - 0.5), vz: 0.4 + Math.random() * 0.9, t: 0, life: 1.0 + Math.random() * 0.5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 9, col: fo.col, sd: Math.random() }); } }
        // a wave meeting a wall: a puff of dust and wind where its front stops
        for (let j = 0; j < NC; j += 3) { const of = (j - J0) * CW; if (w.walls[j] || cR[j] < 0 || cR[j] >= w.range - 0.2 || Math.abs(of) > hw) continue; if (s - w.curv * of * of >= cR[j]) { w.walls[j] = 1; const q = PU[nP++ % PU.length]; Object.assign(q, { on: true, x: O.x + dx * cR[j] + nx * of, y: O.y + dy * cR[j] + ny * of, t: 0, life: 0.5, r: w.fin ? 0.9 : 0.6 }); } } }
      for (const q of DU) if (q.on) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 2.5 * dt; q.vx *= 1 - dt * 2; q.vy *= 1 - dt * 2; if (q.t >= q.life || q.z < 0) q.on = false; }
      for (const q of PB) if (q.on) { q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 9 * dt; q.rot += q.vr * dt; if (q.z <= 0) { if (q.bn || q.vz > -1.2) q.on = false; else { q.bn = 1; q.z = 0.001; q.vz *= -0.32; q.vx *= 0.45; q.vy *= 0.45; } } if (q.t > 1.6) q.on = false; }
      for (const q of LV) if (q.on) { q.t += dt; const dr = 1 - dt * 1.2; q.vx *= dr; q.vy *= dr; q.vz = q.vz * dr - 0.7 * dt; q.x += (q.vx + Math.sin(q.t * 6 + q.sd * 9) * 0.5) * dt; q.y += q.vy * dt; q.z = Math.max(0.02, q.z + q.vz * dt); q.rot += q.vr * dt; if (q.t >= q.life) q.on = false; }
      for (const q of PU) if (q.on) { q.t += dt; if (q.t >= q.life) q.on = false; }
      for (const q of CT) if (q.on) { q.t += dt; if (q.t >= q.life) q.on = false; }
      for (const q of FE) if (q.on) { q.t += dt; const dr = 1 - dt * 1.6; q.vx *= dr; q.vy *= dr; q.vz = q.vz * dr - 0.9 * dt; q.x += (q.vx + Math.sin(q.t * 3 + q.ph) * 0.4) * dt; q.y += q.vy * dt; q.z = Math.max(0.02, q.z + q.vz * dt); q.rot += q.vr * dt; if (q.t >= q.life) q.on = false; }
      // the dissolve: golden feathers shed from the trailing edges and the tail first
      if (R && PZ.spill > 0.01 && (t < T_GONE || S.dead >= 0)) { let n = spawnN(dt * 30); const tr = R.A.trail; while (n-- > 0) { const r = Math.random(), p = r < 0.25 ? R.A.tail : r < 0.5 ? R.A.tips[r < 0.375 ? 0 : 1] : tr[Math.floor(Math.random() * 2)][Math.floor(Math.random() * 6)]; feather(p, (Math.random() - 0.5) * 1.4 - Math.cos(PZ.yaw) * 1.2, (Math.random() - 0.5) * 1.0 - Math.sin(PZ.yaw) * 1.2, 0.2 + Math.random() * 1.0, 1.0 + Math.random() * 0.7, true); } }
      if (S.dead >= 0 && R && !S.deadBurst) { S.deadBurst = 1; for (let i = 0; i < Math.round(12 * H.Q()) + 2; i++) { const p = R.sh[i % R.sh.length].p; feather(p, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, Math.random() * 1.5, 0.9, true); } }
      if (t >= T_END) f.life = 0;
    }
    /* a release: the wave leaves the line under the wings at the downstroke's fastest; feathers shake loose; the shake, the sound */
    function release(w) {
      X.shake(w.fin ? TUNE.shake[1] : TUNE.shake[0], w.fin ? 0.3 : 0.14); if (X.sfx.whoosh) X.sfx.whoosh(); if (w.fin) { if (X.sfx.thud) X.sfx.thud(); if (X.flash) X.flash(0.06, '#CFFFEA'); }
      const R = rigNow(w.t0); for (const tr of R.A.trail) for (let i = 0; i < (lowFx() ? 1 : 2) + (w.fin ? 1 : 0); i++) { const p = tr[3 + Math.floor(Math.random() * 3)]; feather(p, dx * 1.2 + (Math.random() - 0.5) * 1.5, dy * 1.2 + (Math.random() - 0.5) * 1.5, -0.5 - Math.random(), 1.4 + Math.random() * 0.8, false); } }

    /* ================= drawing ================= */
    const sx = H.sx, sy = H.sy, GYs = () => H.GY || 0.55;
    const COLS = ['#000000', '#FF0000'];
    const fadeDead = t => (S.dead >= 0 ? Math.max(0, 1 - (t - S.dead) / 0.3) : 1);
    const waveA = (w, t, s) => { const age = t - w.t0, endT = w.range / w.v; return sstep(0, 0.06, age) * (1 - sstep(endT - 0.05, endT + 0.25, age)) * (1 - 0.35 * sstep(0.6 * w.range, w.range, s)) * fadeDead(t); };
    const visOf = (w, s, of) => { const j = colAt(of); if (j < 0 || cR[j] < 0) return 0; const sf = s - w.curv * of * of; return sstep(cS[j] - 0.35, cS[j] + 0.05, sf) * (1 - sstep(cR[j] - 0.1, cR[j] + 0.25, sf)); };
    /* a wave's quads: its standing body (368) and light (369) on each stretch of its crescent, its trail (370) and shade (371) on the floor behind */
    function waveQuads(Q, w, t, T, layer) {
      const s = sNow(w, t); if (s < 0) return; const age = t - w.t0, aW = waveA(w, t, s); if (aW < 0.01) return;
      const hw = hwAt(w, s), hq = w.h * (0.25 + 0.75 * sstep(0, 0.2, age)) * (1 - 0.3 * sstep(0.65, 1, s / w.range)), NS = Math.max(8, Math.min(22, Math.ceil(2 * hw / 0.45))), dO = 2 * hw / NS, col = COLS[w.fin ? 1 : 0], GY = GYs();
      const V = []; for (let i = 0; i <= NS; i++) V.push(visOf(w, s, -hw + i * dO));
      const lean = 0.65 * hq, Hx = dx * lean * T, Hy = (dy * lean * GY - hq * ZKc) * T, tl = w.trail * (0.45 + 0.55 * sstep(0, 0.3, age)), pad = tl * 0.12 / 0.88;
      for (let i = 0; i < NS; i++) { const a = Math.min(V[i], V[i + 1]); if (a < 0.02) continue;
        const of0 = -hw + i * dO, of1 = of0 + dO, s0 = s - w.curv * of0 * of0, s1 = s - w.curv * of1 * of1, x0 = O.x + dx * s0 + nx * of0, y0 = O.y + dy * s0 + ny * of0, x1 = O.x + dx * s1 + nx * of1, y1 = O.y + dy * s1 + ny * of1;
        const X0 = sx(x0), Y0 = sy(y0), X1 = sx(x1), Y1 = sy(y1), ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2, fl = (i === 0 || V[i - 1] < 0.02 ? 1 : 0) + (i === NS - 1 || V[i + 2] < 0.02 ? 2 : 0), q0 = of0 / hw, q1 = dO / hw + 4 * fl, q2 = s + 37 * w.k, al = aW * a;
        if (layer === 0) { // the floor: the shade and the dust crescent, the trail behind the front (the quad reaching a little ahead of it, so the front's line is never cut)
          const bx = -dx * (tl + pad) / 2 * T, by = -dy * (tl + pad) / 2 * T * GY, cxq = (X0 + X1) / 2 + dx * pad * T + bx, cyq = (Y0 + Y1) / 2 + dy * pad * T * GY + by;
          Q.quad(371, cxq, cyq, ux, uy, bx, by, col, al, q0, q1, q2); Q.quad(370, cxq, cyq, ux, uy, bx, by, col, al, q0, q1, q2); }
        else { const cxq = (X0 + X1) / 2 + Hx / 2, cyq = (Y0 + Y1) / 2 + Hy / 2; Q.quad(368, cxq, cyq, ux, uy, -Hx / 2, -Hy / 2, col, al, q0, q1, q2); Q.quad(369, cxq, cyq, ux, uy, -Hx / 2, -Hy / 2, col, al, q0, q1, q2); } }
    }
    /* the wingtip vortices: two twisting trails curling behind the wave's outer ends (385), on the floor it crosses */
    const VP = [];
    function vortex(Q, w, t, T) {
      const s = sNow(w, t); if (s < 0.25) return; const age = t - w.t0, aW = waveA(w, t, s); if (aW < 0.02) return; const hw = hwAt(w, s), GY = GYs(), Lv = w.trail * (w.fin ? 1.25 : 1.1) * sstep(0, 0.35, age), NSG = w.fin ? 6 : 5, ns = w.fin ? 3 : 2;
      if (Lv < 0.2) return;
      for (const sg of [1, -1]) { const of0 = sg * hw * 0.96; if (visOf(w, s, of0) < 0.3) continue; VP.length = 0;
        for (let j = 0; j <= NSG; j++) { const d = Lv * j / NSG, of = of0 + sg * (0.22 * Math.sin(d * 1.7) - 0.12 * d), al = s - w.curv * of0 * of0 - d; if (!onFloor(al, of)) break; const z = w.h * (0.5 - 0.22 * d / Lv) + 0.08;
          VP.push([sx(O.x + dx * al + nx * of), sy(O.y + dy * al + ny * of) - z * ZKc * T, d]); }
        for (let j = 0; j + 1 < VP.length; j++) { const a = VP[j], b = VP[j + 1], ux = (b[0] - a[0]) / 2, uy = (b[1] - a[1]) / 2, l = Math.hypot(ux, uy); if (l < 0.5) continue; const rr = T * (0.2 + 0.12 * a[2] / Lv) * (w.fin ? 1.35 : 1), px = -uy / l * rr, py = ux / l * rr;
          const a0 = aW * (1 - a[2] / Lv) * (j === 0 ? 0.5 : 1), a1 = aW * (1 - b[2] / Lv);
          Q.quad(385, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ux, uy, px, py, w.fin ? '#DFFFF2' : '#BFFFE6', 1, a[2] + (sg > 0 ? 0 : 3.7) + w.k * 1.3, (b[2] - a[2]) + 10 * ns, Math.floor(cl(a0) * 99) + cl(a1) * 0.99); } } }
    /* a ribbon of wind from screen point a to b, bowed by m px (signed) at its middle, w px wide; 384: its outer edge (the side the
       bow bulges to; flip: the other) sharp and bright, fading across to the inner trailing edge; 375: soft both sides */
    function ribbon(Q, ax, ay, bx, by, m, w, col, a0, a1, al, kind, flip) { const ux = (bx - ax) / 2, uy = (by - ay) / 2, l = Math.hypot(ux, uy); if (l < 1 || al < 0.01) return; const px = -uy / l, py = ux / l, Hh = Math.abs(m) / 2 + 2.6 * w;
      Q.quad(kind || 384, (ax + bx) / 2 + px * m / 2, (ay + by) / 2 + py * m / 2, ux, uy, px * Hh, py * Hh, col, al, m / Hh, (w / Hh) * ((m >= 0) !== !!flip ? 1 : -1), Math.floor(cl(a0) * 99) + cl(a1) * 0.99); }
    const ribbonThrough = (Q, A0, M0, B0, w, col, a0, a1, al, kind) => { const ux = B0[0] - A0[0], uy = B0[1] - A0[1], l = Math.hypot(ux, uy) || 1, off = ((M0[0] - (A0[0] + B0[0]) / 2) * -uy + (M0[1] - (A0[1] + B0[1]) / 2) * ux) / l; ribbon(Q, A0[0], A0[1], B0[0], B0[1], off, w, col, a0, a1, al, kind); };
    function drawUnder(c, f, Xs, Ys, T, t0) {
      const t = f.t, FG = fg(), V = { X0: Xs, Y0: Ys, k: T }, toS = G().toS, GY = GYs();
      const R = t > 0.02 && t < T_GONE + 0.05 ? rigNow(t) : null;
      if (R) { // the eagle's shaped shadow on the floor: its body's and wings' blobs, fainter and softer the higher it flies (drawn before the painter's pass: that pass lays light only)
        const B = blob(), sa = fadeIn(t) * (1 - (PZ ? PZ.spill : 0)); if (sa > 0.01) { c.save(); for (const q of R.sh) { const p = q.p, s0 = toS(V, [p[0], p[1], 0]), lift = Math.max(0, p[2]), rr = q.r * T * (1.25 + lift * 0.22); c.globalAlpha = Math.min(1, 0.4 * sa / (1 + lift * 0.45)); c.drawImage(B, s0[0] - rr, s0[1] - rr * GY, rr * 2, rr * 2 * GY); } c.restore(); } }
      if (FG) { const Q = FG.begin(c, null);
        for (const w of waves) if (w.released) waveQuads(Q, w, t, T, 0);
        // the pressure ring under each downstroke (the final's doubled: the compression), spreading from the waves' line
        for (const w of waves) { if (!w.released) continue; const e = t - w.t0; if (e < -0.12 || e > 0.6) continue; for (let r2 = 0; r2 < (w.fin ? 2 : 1); r2++) { const u = cl((e + 0.12 - r2 * 0.1) / 0.72), r = T * (w.fin ? 3.4 : 2.4) * (0.35 + 0.65 * (1 - Math.pow(1 - u, 2))) * (1 - 0.25 * r2);
          Q.quad(373, sx(O.x), sy(O.y), r, 0, 0, r * GY, '#FFFFFF', (1 - u) * fadeDead(t) * (u > 0 ? 1 : 0), 0.25 + 0.7 * u, w.k * 1.7 + r2 * 3.3, w.fin ? 1.3 : 0.9); } }
        // the pressure ripples at the feet of what a wave actually hit
        for (const q of CT) if (q.on) { const u = q.t / q.life, r = T * (q.fin ? 1.0 : 0.75) * (0.5 + 0.7 * u); Q.quad(373, sx(q.x), sy(q.y), r, 0, 0, r * GY, '#FFFFFF', (1 - u) * 0.9, 0.3 + 0.6 * u, q.sd * 9, q.fin ? 1.2 : 0.85); }
        for (const q of PU) if (q.on) { const u = q.t / q.life; Q.glow(sx(q.x), sy(q.y), T * q.r * (0.6 + 0.8 * u), C_DUST, 0.3 * (1 - u), GY); Q.glow(sx(q.x), sy(q.y) - T * 0.2, T * q.r * 0.6 * (0.6 + u), C_MINT, 0.25 * (1 - u)); }
        for (const w of waves) if (w.released) waveQuads(Q, w, t, T, 1);
        for (const w of waves) if (w.released && S.dead < 0) vortex(Q, w, t, T);
        for (const q of DU) if (q.on) { const a = (1 - q.t / q.life) * 0.5; Q.glow(sx(q.x), sy(q.y) - q.z * ZKc * T, T * q.s * 2.4, C_DUST, a); }
        FG.flush(c); return; }
      // ---- 2D: each wave as a feathered arc, its leading line bright ----
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const w of waves) { if (!w.released) continue; const s = sNow(w, t), age = t - w.t0, endT = w.range / w.v, aW = sstep(0, 0.06, age) * (1 - sstep(endT - 0.05, endT + 0.25, age)) * (S.dead >= 0 ? 0 : 1); if (aW < 0.02 || s < 0) continue;
        const hw = hwAt(w, s), N = 16, pts = []; for (let i = 0; i <= N; i++) { const of = -hw + i * 2 * hw / N, j = colAt(of), sf = s - w.curv * of * of; if (j < 0 || cR[j] < sf || cS[j] > sf + 0.1) { pts.push(null); continue; } pts.push([sx(O.x + dx * sf + nx * of), sy(O.y + dy * sf + ny * of) - w.h * 0.5 * ZKc * T * (1 - Math.pow(of / hw, 2))]); }
        for (const [wd, colr, al] of [[T * 0.5, 'rgba(47,214,156,', 0.22], [T * 0.14, 'rgba(200,255,235,', 0.75]]) { c.strokeStyle = colr + (al * aW) + ')'; c.lineWidth = wd * (w.fin ? 1.4 : 1); c.beginPath(); let on = false; for (const p of pts) { if (!p) { on = false; continue; } if (!on) { c.moveTo(p[0], p[1]); on = true; } else c.lineTo(p[0], p[1]); } c.stroke(); } }
      c.restore();
    }
    const qb = (a, m, b, u) => { const v = 1 - u; return [v * v * a[0] + 2 * v * u * m[0] + u * u * b[0], v * v * a[1] + 2 * v * u * m[1] + u * u * b[1]]; };
    function draw(c, f, Xs, Ys, T, t0) {
      const t = f.t, FG = fg(), V = { X0: Xs, Y0: Ys, k: T }, toS = G().toS, low = lowFx(), GY = GYs();
      const R = t > 0.02 && t < T_GONE + 0.05 ? rigNow(t) : null;
      // the eagle (the GPU model, else the painted one)
      if (R) { const fi = fadeIn(t); if (fi < 0.999) for (const it of R.inst) it.al *= fi;
        if (!G().drawGL(c, V, R, { t })) G().draw2D(c, V, R, { spill: PZ.spill, fade: p => fadeAt(p) * fi }); }
      const pet = [sx(me.x), sy(me.y) - T * 0.55, T * 0.62];
      if (FG) { const Q = FG.begin(c, pet);
        if (R) { const al = fadeIn(t) * (1 - PZ.spill), gl = PZ.glow, kN = CH.nextK(t), alive = S.dead < 0;
          // the eyes' bloom: a small emerald point (the face stays readable)
          for (const e of R.A.eyes) { const q = toS(V, e); Q.glow(q[0], q[1], T * 0.1, '#3CFFAA', 0.38 * al * Math.min(1.4, gl)); }
          // the wingtips' trails: one ribbon each through its recent path, its outer edge sharp
          for (let i = 0; i < 2; i++) { const H2 = TRAIL[i]; if (H2.length < 4) continue; const a = toS(V, H2[0]), m = toS(V, H2[Math.floor(H2.length / 2)]), b = toS(V, H2[H2.length - 1]); ribbonThrough(Q, a, m, b, T * 0.07, C_MINT, 0, 0.9, 0.55 * Math.max(al, 0.6 * Math.sin(Math.PI * cl(PZ.spill))) * Math.min(1.4, gl)); }
          // the gathering air before each downstroke: jade and mint ribbons spiralling in beneath the wings, a few luminous feathers in the suction
          if (alive && kN < NB) { const fin = kN === NB - 1 && NB > 1, ta = fin ? CH.W1 : CH.Ds(kN) - TUNE.antic, tb = CH.Ds(kN) + 0.05, aa = (t - ta) / (tb - ta);
            if (aa > 0 && aa < 1) { const env = Math.sin(Math.PI * aa) * al, ch = R.A.chest, end = [ch[0], ch[1], ch[2] - 0.65], eS = toS(V, end), nR = fin ? 4 : 3;
              for (let i = 0; i < 2; i++) { const sg = i === 0 ? 1 : -1, un = R.A.under[i];
                for (let j = 0; j < nR; j++) { const p0 = un[Math.min(2, j)], rx = p0[0] - end[0], ry = p0[1] - end[1], ang = sg * (1 - aa) * 0.9 + j * 0.25 * sg, ca = Math.cos(ang), sa = Math.sin(ang), kk = 1.3 - 0.45 * aa,
                    st = [end[0] + (rx * ca - ry * sa) * kk, end[1] + (rx * sa + ry * ca) * kk, p0[2] - 0.35 - 0.18 * j], a = toS(V, st), bw = sg * T * (0.55 + 0.22 * j) * (1 - 0.45 * aa);
                  ribbon(Q, a[0], a[1], eS[0], eS[1], bw, T * (0.04 + 0.008 * (fin ? 1 : 0)), j % 2 ? C_JADE : C_MINT, 0.05, 0.9, env * (fin ? 0.85 : 0.7));
                  if (j < 2 && !low) { const ux = eS[0] - a[0], uy = eS[1] - a[1], l = Math.hypot(ux, uy) || 1, mid = [(a[0] + eS[0]) / 2 - uy / l * bw * 0.5, (a[1] + eS[1]) / 2 + ux / l * bw * 0.5], u = cl(aa * 1.15 - 0.12 - j * 0.18), p = qb(a, mid, eS, eio(u)), fa = Math.sin(Math.PI * u) * al;
                    Q.glow(p[0], p[1], T * 0.16, C_MINT, 0.45 * fa); Q.rq(374, p[0], p[1], T * 0.16, T * 0.07, Math.atan2(uy, ux) + j, '#FFFFFF', 0.85 * fa, j * 0.37 + i * 0.2, 0.3 * sg, 0); } } } } }
          // a downstroke driving the air: streaks off each wingtip curving down to the waves' line, a compression glow under the wings
          if (alive && kN < NB) { const fin = kN === NB - 1 && NB > 1, dS = CH.Ds(kN), u = (t - dS) / (TR[kN] - dS);
            if (u > 0.1 && u < 1.0) { const k2 = sstep(0.1, 0.7, u), hw0 = fin ? TUNE.w0F : TUNE.w0; for (let i = 0; i < 2; i++) { const a = toS(V, R.A.tips[i]), sg = i === 0 ? 1 : -1, gx = O.x - HP.x + nx * sg * hw0 * 0.85, gy = O.y - HP.y + ny * sg * hw0 * 0.85, b = toS(V, [gx, gy, 0.1]);
                ribbon(Q, a[0], a[1], b[0], b[1], sg * T * 0.6, T * (fin ? 0.11 : 0.08), C_MINT, 0.9, 0.2, k2 * al * 0.75); ribbon(Q, a[0], a[1], b[0], b[1], sg * T * 1.1, T * 0.05, C_JADE, 0.6, 0.1, k2 * al * 0.5); }
              const ch = toS(V, [R.A.chest[0], R.A.chest[1], R.A.chest[2] - 0.6]); Q.glow(ch[0], ch[1], T * (fin ? 2.4 : 1.8), C_JADE, 0.16 * k2 * al, 0.6); } }
          // the final's wind-up: a vortex of mint air streaming into its chest, motes drawn in
          if (alive && NB > 1 && kN === NB - 1) { const k3 = sstep(CH.W1, CH.W1 + 0.35, t) * (1 - sstep(TR[NB - 1] - 0.12, TR[NB - 1], t)); if (k3 > 0.01) { const ch = toS(V, [R.A.chest[0], R.A.chest[1], R.A.chest[2] - 0.4]), rr = T * 3.6; Q.quad(372, ch[0], ch[1], rr, 0, 0, rr * 0.8, '#FFFFFF', k3 * al, k3, 0.37, 0); } }
          for (const q of MO) if (q.on) { const ch = R.A.chest, wx = ch[0] + Math.cos(q.a) * q.r, wy = ch[1] + Math.sin(q.a) * q.r * 0.6, wz = ch[2] + q.z * (q.r / 3), p = toS(V, [wx, wy, wz]), a = Math.sin(Math.PI * cl(q.t / q.life)) * 0.8; Q.glow(p[0], p[1], T * 0.12, C_MINT, a); Q.glow(p[0], p[1], T * 0.04, C_WHITE, a); }
          // the departure: ribbons of wind peeling off the dissolving trailing edges and the tail, curling back along its path
          if (PZ.spill > 0.02 && PZ.spill < 0.98) { const sp = PZ.spill, bk = [-Math.cos(PZ.yaw), -Math.sin(PZ.yaw)], src = [R.A.tips[0], R.A.tips[1], R.A.tail, R.A.trail[0][1], R.A.trail[1][1]];
            for (let i = 0; i < (low ? 3 : 5); i++) { const p = src[i], ph = t * 2.6 + i * 1.3, L = 1.4 + sp * 1.6, q = [p[0] + bk[0] * L + Math.cos(ph) * 0.5, p[1] + bk[1] * L + Math.sin(ph) * 0.5, p[2] - 0.3 + 0.4 * Math.sin(ph * 0.7)], a = toS(V, p), b = toS(V, q);
              ribbon(Q, a[0], a[1], b[0], b[1], T * 0.7 * (i % 2 ? 1 : -1), T * 0.055, i % 2 ? C_MINT : C_CHAMP, 0.85, 0.05, Math.sin(Math.PI * sp) * 0.75); } } }
        // the release's flash of air along the waves' line (brief)
        for (const w of waves) { const e = t - w.t0; if (!w.released || e < 0 || e > 0.16 || S.dead >= 0) continue; Q.glow(sx(O.x), sy(O.y) - T * 0.4, T * (w.fin ? 2.4 : 1.6), C_WHITE, 0.26 * (1 - e / 0.16), 0.6); }
        // the contacts: short cutting arcs crossing what a wave actually hit (across the aim, a little askew, sweeping through)
        for (const q of CT) if (q.on) { const u = q.t / q.life, X1 = sx(q.x), Y1 = sy(q.y) - q.z * ZKc * T, Lh = T * (q.fin ? 0.75 : 0.55), fa = (1 - sstep(0.5, 1, u)) * sstep(0, 0.08, u);
          for (let j = 0; j < (q.fin ? 3 : 2); j++) { const an = A + Math.PI / 2 + (j - 0.5) * 0.7 * q.fl + q.sd * 0.3, ca = Math.cos(an), sa = Math.sin(an) * GY, gr = sstep(0, 0.35, u - j * 0.06), adv = (u * 0.6 - 0.15) * T * 0.8, ox = dx * adv, oy = dy * adv * GY;
            ribbon(Q, X1 - ca * Lh + ox, Y1 - sa * Lh + oy, X1 + ca * Lh * (2 * gr - 1) + ox, Y1 + sa * Lh * (2 * gr - 1) + oy, T * 0.22 * q.fl, T * (q.fin ? 0.07 : 0.05), j ? C_MINT : C_WHITE, 0.15, 1, fa * (j ? 0.75 : 1)); } }
        // the pebbles and the leaves the fronts lift
        for (const q of PB) if (q.on) { const p = [sx(q.x), sy(q.y) - q.z * ZKc * T]; Q.rq(386, p[0], p[1], T * q.s, T * q.s * 0.8, q.rot, '#B8A88C', 1, q.sd, 0, 0); }
        for (const q of LV) if (q.on) { const u = q.t / q.life, p = [sx(q.x), sy(q.y) - q.z * ZKc * T]; Q.rq(387, p[0], p[1], T * 0.13, T * 0.07 * (0.4 + 0.6 * Math.abs(Math.cos(q.t * 7 + q.sd * 5))), q.rot, q.col, 1 - sstep(0.7, 1, u), q.sd, Math.sin(q.t * 5) * 0.5, 0); }
        // the golden feathers
        for (const q of FE) if (q.on) { const u = q.t / q.life, a = Math.min(1, q.t / 0.12) * (1 - sstep(0.7, 1, u)), p = toS(V, [q.x, q.y, q.z]); Q.rq(374, p[0], p[1], T * 0.26, T * 0.11, q.rot, '#FFFFFF', a * 0.95, q.sd, q.cv, q.burn ? sstep(0.2, 1, u) : 0); }
        FG.flush(c); return; }
      // ---- 2D: the eyes, the feathers ----
      if (R) for (const e of R.A.eyes) { const q = toS(V, e); H.glow(c, q[0], q[1], T * 0.14, '#3CFFAA', 0.45 * (1 - PZ.spill)); }
      for (const q of FE) if (q.on) { const u = q.t / q.life, p = toS(V, [q.x, q.y, q.z]); c.save(); c.globalAlpha = (1 - u) * 0.9; c.translate(p[0], p[1]); c.rotate(q.rot); c.fillStyle = q.burn ? '#FFE7A8' : '#E0B25A'; c.beginPath(); c.ellipse(0, 0, T * 0.22, T * 0.07, 0, 0, TAU); c.fill(); c.restore(); }
    }
    // (the feathers, the motes and the trails are kept in the rig's terms: relative to HP, drawn from its screen point; the dust, pebbles, leaves, contacts and puffs in world terms)
    const F = H.add({ key: 'goldeneagle', life: T_END + 0.25, x: HP.x, y: HP.y, update, drawUnder, draw, S, onEnd() { if (S.zoomOurs && H.g.zoomP === TUNE.zoom) H.g.zoomT = Math.min(H.g.zoomT || 0, 0.05); for (const L of [FE, MO, DU, PB, LV, CT, PU]) L.length = 0; TRAIL[0].length = TRAIL[1].length = 0; FOL.length = 0; } });
    return F;
  };
  /* (idle time, when a stage starts with it in a kit: 20b) the meshes built and uploaded before the first cast */
  U.goldeneagle.warm = () => { try { return GOLDEAGLE_GL.warm(); } catch (e) { return false; } };
  U.goldeneagle.TUNE = TUNE; U.goldeneagle.STAT = STAT; U.goldeneagle.tierOf = tierOf; U.goldeneagle.releases = releases; U.goldeneagle.choreo = choreo;
})();
