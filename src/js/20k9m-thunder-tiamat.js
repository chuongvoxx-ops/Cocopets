/* ---------- (v451 TM, model remade v454 TM2, flight v457 TM4) Thunder's six-star summon Ultimate: Tiamat ----------
   The user's brief (2026-11-22): summon an immense dragon formed from pure lightning; it roars above the battlefield, then plunges
   into the ground and bursts into a storm of electricity. (v457 TM4, the user: "it needs to fly around shooting down lightning
   bolts to the enemies below before doing a twirl in the sky and plunge down to the ground.") The dragon's model is 20k9l
   (TIAMAT_GL); this file is the move: one authoritative timeline per cast, its flight, its damage, its footprint, its light, its
   clean-up.
   The cast (20b useUlt commits it: MP and the cooldown, TUNE.cd 45 s, start there: the summons' convention, as Titan's): a short
   gesture (TUNE.gesture), then the pet has its normal movement, dodge and attacks while the dragon runs on its own clock; the
   monsters, their attacks and every timer carry on. The normal camera: pulled back a little while it flies, a restrained shake and
   a small punch at the impact.
   The sequence (seconds from the cast, all in TUNE):
     0 .. 0.8     forks of lightning converge from the sky onto the point where its chest will form (high in the view);
     0.5 .. 1.25  the dragon resolves there in one coherent formation (its chest first, then the head and neck, the fins, the
                  tail: a white front sweeping through each part as it appears), already gliding along its flight path;
     1.25 .. 4.4  IT FLIES ROUND THE BATTLEFIELD: one sweeping eel-swim course over the floor round the pet and the aim, fitted to
                  the camera's view (airborne: it crosses walls and gaps), drawn toward the enemies; the head leads and the body
                  and tail trace the same path (the model's path mode), swim waves running down it, fins rippling, banking in
                  its turns. While it flies it SHOOTS LIGHTNING DOWN: 6 / 8 / 10 bolts (Base / Adept / Celestial) spread evenly
                  over TUNE.bolt0 .. bolt1. Each bolt picks its target TUNE.tell s before it falls (an enemy within
                  TUNE.boltRange of where the head will be, on valid floor, in the view; the ones struck least first): a glow
                  gathers on the floor under it (glow-only, no circle), a pulse of charge runs up the dragon's veins tail to
                  jaws, its head dips, its jaws snap open and the sail's spines arc into them; then a forked bolt leaps from the
                  jaws to the target: one Thunder hit (TUNE.boltK DK) on every enemy within TUNE.boltR of the strike (the
                  target and a small splash, each once a bolt: one Map a bolt; in sight of the strike);
     4.4 .. 5.35  THE TWIRL: it pulls up and climbs in a corkscrew (the path a helix, the body rolling round with it: a barrel
                  roll travelling down the long body, the sail and fins whipping round), over the top; the charge builds tail
                  to jaws (its magenta veins and dots brightening, an orb of light running up it, then gathering in the jaws);
                  violet arcs crackle between its crest spines, claws, fin-wings and sail; a deep thunder roll;
     5.35 .. 5.85 THE PLUNGE: head first, straight down onto the aim (the point the cast was aimed at: the aimed enemy, else ahead
                  of the pet), a trail of plasma behind it, its silhouette kept;
     5.85         THE IMPACT: the whole dragon erupts in one enormous electrical discharge, one heavy circular Thunder hit
                  (TUNE.impactK DK) on every monster within TUNE.impactR of the strike, each once (one Map for the whole event:
                  whatever of its body, its claws or its bolts overlap a monster). A short controlled flash, a restrained shake;
     then         a branching electrical pattern spreads over the floor out to TUNE.patR, and 1 / 2 / 3 aftershock pulses (Base /
                  Adept / Celestial) race out over it TUNE.pulseGap s apart (the first TUNE.pulseGap after the impact), each hitting
                  each monster once as its front passes (TUNE.pulseK DK), however many branches cross it;
     5.85 .. 6.45 the dragon's outline breaks into luminous arcs and is gone; the ground's electricity fades after the last pulse.
   Damage (DK = base x K x (1 + 0.08 (evo - 1)), the elemental Ultimates' scale): the impact is the largest single hit (11 DK);
   a bolt 1 DK, a pulse 2.2 DK. An enemy in the impact takes 11 + 2.2 / 4.4 / 6.6 DK from the strike and its pulses plus the bolts
   that find it: usually one or two (the bolts spread over the enemies), at most every bolt when it is alone: 19.2 / 23.4 / 27.6
   DK then, under Golden Eagle's 20 / 24 / 32 DK on an enemy in its path (cd 35 s) and above Snake Flame's ~13 and Moby Dick's
   12..17 per enemy for a longer cooldown (45 s). The flight, the twirl and the dive deal no other damage. Bosses take the damage
   but keep their crowd-control immunity (no stun). Enemies only (the game's monsters through X.hitMon).
   Footprint: the strike's reach (impactR) and the pulses' (patR) are measured on the real floor round the impact (walkable, explored,
   in sight of it and connected to it, as Moby Dick's water); the ground's pattern is drawn on exactly those tiles (feathered at the
   walls) and a monster is struck only there. A bolt strikes only an enemy on walkable, explored floor. Pictures only: no tile,
   collision or navigation changes.
   One authoritative timeline (the effect's own game clock): each bolt's choice and strike, the impact by their thresholds, each
   pulse by its front's sweep since the last frame; the flight path is built once at the cast (the chest's place along it a fixed
   function of the clock): the same hits at any frame rate. Everything ends with the effect: on completion, the caster's defeat
   (nothing more lands, no bolt, impact or pulse: the dragon breaks up where it is and the ground's light drains), the stage's end
   or exit (the effect goes with the game; the model's GPU buffers are freed by the stage's destroy hook in 20b).
   Layers: the ground's shade and pattern and the bolts' glows on the floor pass (under the warnings, traps and pickups); the dragon,
   its arcs, its bolts, the discharge on the sky pass (a hook in 20b after the darkness and the fog, under the monsters' shots and
   rings: v451 TM).
   GPU first: the ground's pattern, the pulses and the discharge on the shared painter (20k6h FGFX kinds 376..379, TM-FX), the
   bolts, glows and arcs through the lightning kit's GPU mode (20k9a TK), the dragon on GLM; without WebGL a painted version of each.
   Arcs and lights are bounded: at most TUNE.arcs crackling arcs, TUNE.nForks forks, a bolt's few forks, one short light a bolt, one
   at the impact and one a pulse; Fewer effects thins the cosmetics, never the hits. */
(() => {
  const U = ELEM_IMPL.thunder.ult, TAU = Math.PI * 2;
  const TUNE = {
    cd: 45,                     // (the cooldown, s: the row's cd in ELEM_MOVES.thunder; the game sets it when the cast commits)
    gesture: 0.45,              // the pet's casting gesture (s); full control after it
    forks: 0.8, form0: 0.5, form1: 1.25,               // the forks converge (s); the formation's window
    tw0: 4.4, tw1: 5.35, impact: 5.85,                 // (v457 TM4) the twirl (the climb and corkscrew over the top), the plunge, the impact (s)
    bolts: [6, 8, 10], bolt0: 1.6, bolt1: 4.2,         // (v457 TM4) the bolts while it flies: how many (Base, Adept, Celestial), the first and the last (s)
    tell: 0.38, boltLife: 0.3,                         // a bolt's glow on the floor before it falls (s); its channel's life after (s)
    boltK: 1.0, boltR: 1.0, boltRange: 5.5, boltStun: 0.15,   // a bolt's hit (x DK), its splash (tiles from the strike), its reach from the head (tiles), a short stun (not on bosses)
    pulseGap: 0.45, pulses: [1, 2, 3], pulseV: 26,      // the aftershocks: apart (s), how many (Base, Adept, Celestial), their fronts' speed (tiles/s)
    pulseBand: 0.6,             // the band behind a front that still counts as passing (tiles)
    impactR: 3.0, patR: 4.6, spread: 0.3,               // the strike's reach, the pattern's (the pulses' reach), how fast it spreads (s) (tiles)
    breakup: 0.6, fade: 0.65,   // the dragon's break-up after the impact (s); the ground's light fading after the last pulse (s)
    size: 0.6,                  // its size (the model's scale)
    area: [3.6, 5.6],           // (v457 TM4) the flight's half extents round the view's middle (tiles across, up and down the screen; capped by the view)
    flyZ: 3.0, apexZ: [4.2, 6.4], climbX: 1.9, apexX: 0.9,   // its height flying (tiles); the apex's (fitted to the view's top); where it climbs and turns over (tiles beside the aim)
    helixR: 0.55, turns: 1, bank: 0.9, upright: 0,     // the corkscrew's radius (tiles) and turns; how far it banks in its turns; its back brought up at the apex (0: a true loop, its back toward the loop's middle)
    impactK: 11, pulseK: 2.2,   // damage (x DK)
    stun: 0.8, pulseStun: 0.25, // (monsters only: bosses keep their immunity)
    shake: 10, zoom: 1.04, zoomT: 0.3, zoomOut: 0.92,   // the camera: a restrained shake and a small punch at the impact; pulled back a little while it flies
    arcs: 5, nForks: 6, sparks: 26,                     // cosmetic bounds (thinned by Fewer effects; never the hits)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eo = u => 1 - (1 - cl(u)) * (1 - cl(u));
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const TG = () => (typeof TIAMAT_GL !== 'undefined' ? TIAMAT_GL : null);
  const glOff = () => { try { return typeof window !== 'undefined' && window.__TM_GL === 0; } catch (e) { return false; } };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const v3 = { add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k], dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], len: a => Math.hypot(a[0], a[1], a[2]), nrm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; } };
  let LAST = null;   // (the last cast's record: tests read its hits and its timeline)

  /* ---- the footprint's floor: every floor tile round the impact that is walkable, explored, in sight of it and connected to it ---- */
  function floorMap(H, cx, cy, R) {
    const X = H.X, x0 = Math.floor(cx - R) - 1, y0 = Math.floor(cy - R) - 1, n = Math.ceil(R) * 2 + 3, ok = new Uint8Array(n * n);
    const inG = (i, j) => i >= 0 && j >= 0 && i < n && j < n;
    const floorAt = (tx, ty) => { try { return !X.blocked(tx + 0.5, ty + 0.5, 0.05, 0); } catch (e) { return false; } };
    const expAt = (tx, ty) => { try { return X.isExp ? X.isExp(tx + 0.5, ty + 0.5) : true; } catch (e) { return true; } };
    const sight = (tx, ty) => { try { return X.los ? X.los(cx, cy, tx + 0.5, ty + 0.5) : true; } catch (e) { return true; } };
    const good = (i, j) => { const tx = x0 + i, ty = y0 + j; return Math.hypot(tx + 0.5 - cx, ty + 0.5 - cy) <= R && floorAt(tx, ty) && expAt(tx, ty) && sight(tx, ty); };
    const si = Math.floor(cx) - x0, sj = Math.floor(cy) - y0, Q = [];
    if (inG(si, sj) && floorAt(si + x0, sj + y0) && expAt(si + x0, sj + y0)) { ok[sj * n + si] = 1; Q.push(si, sj); }
    for (let h = 0; h < Q.length; h += 2) { const i = Q[h], j = Q[h + 1];
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (!inG(a, b) || ok[b * n + a]) continue; if (good(a, b)) { ok[b * n + a] = 1; Q.push(a, b); } else ok[b * n + a] = 2; } }
    const has = (i, j) => inG(i, j) && ok[j * n + i] === 1;
    const tiles = [];
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { if (!has(i, j)) continue;
      const m = (has(i - 1, j) ? 0 : 1) | (has(i + 1, j) ? 0 : 2) | (has(i, j - 1) ? 0 : 4) | (has(i, j + 1) ? 0 : 8) | (has(i - 1, j - 1) ? 0 : 16) | (has(i + 1, j - 1) ? 0 : 32) | (has(i - 1, j + 1) ? 0 : 64) | (has(i + 1, j + 1) ? 0 : 128);
      const x = x0 + i + 0.5, y = y0 + j + 0.5; tiles.push({ i, j, x, y, m, d: Math.hypot(x - cx, y - cy) }); }
    const on = (x, y) => has(Math.floor(x) - x0, Math.floor(y) - y0);
    return { x0, y0, n, has, on, tiles, cx, cy };
  }
  /* ---- the 2D picture's branches (no GPU painter): five main branches out to R with forks, as polylines in tiles from the impact,
     each cut where it leaves the floor ---- */
  function branches2D(W, cx, cy, R, seed) {
    const out = [], grow = (x, y, a, len, depth, k) => { const pts = [[x, y]]; let px = x, py = y, aa = a; const n = Math.max(3, Math.round(len / 0.35));
      for (let i = 1; i <= n; i++) { aa += (R1(seed + k * 7.1 + i * 3.3) - 0.5) * 0.7; px += Math.cos(aa) * len / n; py += Math.sin(aa) * len / n; if (!W.on(cx + px, cy + py) || Math.hypot(px, py) > R) break; pts.push([px, py]);
        if (depth < 2 && i > 1 && R1(seed + k * 1.9 + i * 5.7) > 0.72) grow(px, py, aa + (R1(seed + i + k) > 0.5 ? 0.7 : -0.7), len * 0.45, depth + 1, k * 3 + i); }
      if (pts.length > 1) out.push({ pts, depth }); };
    for (let i = 0; i < 5; i++) grow(0, 0, i / 5 * TAU + seed, R, 0, i + 1);
    return out;
  }

  /* ---- (v457 TM4) the flight: one path in tiles from the impact point (x, y on the floor, z up), built once at the cast.
     Way-points on the screen (x, and y - 0.9 z: the view's own measure) fitted to the camera's view round its middle: the body forms
     across the top of the view, swoops down one side, sweeps across the bottom and rises up the other toward the aim (the inner
     way-points drawn a little toward the enemies), a smooth curve through them (centripetal Catmull-Rom) at the flying height;
     then the climb (a Hermite arc pulling up beside the aim with a helix wound round it: the corkscrew) to the apex above the aim,
     over the top and head-first down onto it (a Hermite arc), on into the ground. Resampled every DL tiles: each point's tangent,
     a side vector carried along without twist (rotation-minimising), and its roll: banking into the flight's turns, the barrel
     roll along the climb, and a correction ramped in over the climb so its back is up at the apex ---- */
  const DL = 0.05;
  function hermite(P0, M0, P1, M1, n, out) { for (let i = 1; i <= n; i++) { const u = i / n, u2 = u * u, u3 = u2 * u, a = 2 * u3 - 3 * u2 + 1, b = u3 - 2 * u2 + u, c = -2 * u3 + 3 * u2, d = u3 - u2; out.push([0, 1, 2].map(k => a * P0[k] + b * M0[k] + c * P1[k] + d * M1[k])); } return out; }
  function catmull(W, per) {   // (centripetal Catmull-Rom through 2D points, phantom ends)
    const P = [[2 * W[0][0] - W[1][0], 2 * W[0][1] - W[1][1]]].concat(W, [[2 * W[W.length - 1][0] - W[W.length - 2][0], 2 * W[W.length - 1][1] - W[W.length - 2][1]]]), out = [W[0].slice()];
    const tj = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
    for (let s = 1; s < P.length - 2; s++) { const p0 = P[s - 1], p1 = P[s], p2 = P[s + 1], p3 = P[s + 2], t1 = tj(p0, p1), t2 = t1 + tj(p1, p2), t3 = t2 + tj(p2, p3);
      for (let i = 1; i <= per; i++) { const t = t1 + (t2 - t1) * i / per, L = (a, b, ta, tb) => [0, 1].map(k => ((tb - t) * a[k] + (t - ta) * b[k]) / (tb - ta));
        const A1 = L(p0, p1, 0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3), B1 = L(A1, A2, 0, t2), B2 = L(A2, A3, t1, t3); out.push(L(B1, B2, t1, t2)); } }
    return out; }
  function plan(o) {   // o: { T (the impact point), me, view: { gx, gy, hw, hh } (the view's middle on the floor, its half extents, tiles), tB (the bolts' times), foes ([x, y] from T) }
    const G = TG(), D = G ? G.DIMS : { LS: 10.5, S0: 0.2, HK: 1.15 }, K = TUNE.size, L = D.LS * K, lead = D.S0 * L, snout = lead + (0.04 + 1.15 * D.HK) * K;
    const T = o.T, V = o.view, u = Math.max(2.2, Math.min(TUNE.area[0], V.hw - 1.1)), v = Math.max(3.0, Math.min(TUNE.area[1], V.hh - 1.6));
    const gx = V.gx - T.x, gy = V.gy - T.y, zf = TUNE.flyZ, clx = x => Math.max(gx - u, Math.min(gx + u, x));
    const sE = T.x > V.gx + 0.3 ? -1 : T.x < V.gx - 0.3 ? 1 : ((o.me && o.me.x > T.x) ? -1 : 1);   // (the climb on the view's inner side of the aim)
    const E = [clx(sE * TUNE.climbX), 0.5, zf], Ay = -0.4, A0x = clx(sE * TUNE.apexX), top = gy - V.hh + 1.6;
    const zA = Math.max(TUNE.apexZ[0], Math.min(TUNE.apexZ[1], (Ay - top) / 0.9)), A = [A0x, Ay, zA];
    // the way-points on the screen (tiles from T: x, y - 0.9 z)
    // (mostly the upper part of the view: flying there, its jaws are above the enemies round the pet and the aim, and its bolts fall down onto them)
    const W = [[gx + sE * u * 0.8, gy - v * 0.4], [gx + sE * u * 0.4, gy - v * 0.92], [gx - sE * u * 0.45, gy - v * 0.97], [gx - sE * u, gy - v * 0.4],
      [gx - sE * u * 0.3, gy + v * 0.3], [gx + sE * u * 0.95, gy + v * 0.05], [E[0], E[1] - 0.9 * zf]];
    const foes = (o.foes || []).map(f => [f[0], f[1] - 0.9 * zf]);
    for (let i = 3; i <= 5; i++) { const w = W[i]; let sx = 0, sy = 0, sw = 0; for (const f of foes) { const d2 = (f[0] - w[0]) ** 2 + (f[1] - w[1]) ** 2; if (d2 > 25) continue; const k = Math.exp(-d2 / 5); sx += f[0] * k; sy += f[1] * k; sw += k; }
      if (sw > 0.05) { const dx = sx / sw - w[0], dy = sy / sw - w[1], dl = Math.hypot(dx, dy), m = Math.min(1.8, dl * 0.6 * Math.min(1, sw)); if (dl > 0.01) { w[0] = clx(w[0] + dx / dl * m); w[1] = Math.max(gy - v, Math.min(gy + v, w[1] + dy / dl * m)); } } }
    const C2 = catmull(W, 24), nf = C2.length, pts = [];
    for (let i = 0; i < nf; i++) { const f = i / (nf - 1), z = zf + 0.32 * Math.sin(Math.PI * 3 * f); pts.push([C2[i][0], C2[i][1] + 0.9 * z, z]); }
    const iE = pts.length - 1, tE = v3.nrm(v3.sub(pts[iE], pts[iE - 2]));
    // the climb (a corkscrew round a pull-up arc), over the top, the plunge, on into the ground
    const cA = v3.len(v3.sub(A, E)) * 1.25, climb = hermite(E, v3.mul(tE, cA), A, [-sE * cA * 0.9, 0, 0], 60, []);
    { const d = v3.nrm(v3.sub(A, E)); let n1 = v3.cross(d, [0, 1, 0]); if (v3.len(n1) < 1e-3) n1 = [1, 0, 0]; n1 = v3.nrm(n1); const n2 = v3.cross(d, n1);
      for (let i = 0; i < climb.length; i++) { const w = (i + 1) / climb.length, ph = sE * TAU * TUNE.turns * w, r = TUNE.helixR * Math.pow(Math.sin(Math.PI * w), 0.8); climb[i] = v3.add(climb[i], v3.add(v3.mul(n1, r * Math.cos(ph) - r), v3.mul(n2, r * Math.sin(ph)))); } }
    const iA = pts.length + climb.length - 1; for (const q of climb) pts.push(q);
    const cD = v3.len(A) * 1.3, dEnd = v3.nrm([-sE * 0.12, 0.08, -1]), dive = hermite(A, [-sE * cD * 0.7, 0, 0], [0, 0, 0], v3.mul(dEnd, cD), 60, []);
    const iT = pts.length + dive.length - 1; for (const q of dive) pts.push(q);
    for (let i = 1; i <= 12; i++) pts.push(v3.mul(dEnd, i * 0.25));
    // resampled by arc length
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + v3.len(v3.sub(pts[i], pts[i - 1])));
    const LT = cum[cum.length - 1], n = Math.floor(LT / DL) + 1, PX = new Float32Array(n), PY = new Float32Array(n), PZ = new Float32Array(n);
    for (let i = 0, j = 0; i < n; i++) { const l = i * DL; while (j < cum.length - 2 && cum[j + 1] < l) j++; const w = cl((l - cum[j]) / Math.max(1e-6, cum[j + 1] - cum[j])), a = pts[j], b = pts[j + 1]; PX[i] = lerp(a[0], b[0], w); PY[i] = lerp(a[1], b[1], w); PZ[i] = lerp(a[2], b[2], w); }
    const lE = cum[iE], lA = cum[iA], lT = cum[iT];
    const TX = new Float32Array(n * 3), SY = new Float32Array(n * 3), RL = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2), t = v3.nrm([PX[b] - PX[a], PY[b] - PY[a], PZ[b] - PZ[a]]); TX[i * 3] = t[0]; TX[i * 3 + 1] = t[1]; TX[i * 3 + 2] = t[2]; }
    let y = v3.nrm(v3.cross([0, 0, 1], [TX[0], TX[1], TX[2]]));
    for (let i = 0; i < n; i++) { const x = [TX[i * 3], TX[i * 3 + 1], TX[i * 3 + 2]]; y = v3.nrm(v3.sub(y, v3.mul(x, v3.dot(x, y)))); SY[i * 3] = y[0]; SY[i * 3 + 1] = y[1]; SY[i * 3 + 2] = y[2]; }
    // the roll: banking in the flight's turns, the barrel roll along the climb, its back brought up at the apex
    const hd = i => Math.atan2(TX[i * 3 + 1], TX[i * 3]), kap = new Float32Array(n);
    for (let i = 1; i < n - 1; i++) { let d = hd(i + 1) - hd(i - 1); d = Math.atan2(Math.sin(d), Math.cos(d)); kap[i] = d / (2 * DL); }
    for (let i = 0; i < n; i++) { const l = i * DL; let s = 0, c = 0; for (let k = -20; k <= 20; k += 2) { const j = i + k; if (j >= 0 && j < n) { s += kap[j]; c++; } }
      const bank = Math.max(-0.6, Math.min(0.6, -TUNE.bank * s / Math.max(1, c))) * (1 - sstep(lE - 1.2, lE, l)), tw = sE * TAU * TUNE.turns * sstep(lE, lA, l); RL[i] = bank + tw; }
    { const i = Math.min(n - 1, Math.round(lA / DL)), x = [TX[i * 3], TX[i * 3 + 1], TX[i * 3 + 2]], yy = [SY[i * 3], SY[i * 3 + 1], SY[i * 3 + 2]], z0 = v3.cross(x, yy), c = Math.cos(RL[i]), s = Math.sin(RL[i]);
      const yr = v3.add(v3.mul(yy, c), v3.mul(z0, s)), zr = v3.cross(x, yr), tg = v3.nrm(v3.sub([0, 0, 1], v3.mul(x, x[2]))), fix = Math.atan2(-v3.dot(tg, yr), v3.dot(tg, zr));
      for (let k = 0; k < n; k++) RL[k] += TUNE.upright * fix * sstep(lE + 0.4 * (lA - lE), lA, k * DL); }
    const at = l => { const f = l / DL; if (f <= 0 || f >= n - 1) { const i = f <= 0 ? 0 : n - 1, e = l - i * DL, t = [TX[i * 3], TX[i * 3 + 1], TX[i * 3 + 2]]; return { p: [PX[i] + t[0] * e, PY[i] + t[1] * e, PZ[i] + t[2] * e], x: t, y: [SY[i * 3], SY[i * 3 + 1], SY[i * 3 + 2]], r: RL[i] }; }
      const i = Math.floor(f), w = f - i, j = i + 1, q = k => lerp(TX[i * 3 + k], TX[j * 3 + k], w), s = k => lerp(SY[i * 3 + k], SY[j * 3 + k], w);
      return { p: [lerp(PX[i], PX[j], w), lerp(PY[i], PY[j], w), lerp(PZ[i], PZ[j], w)], x: v3.nrm([q(0), q(1), q(2)]), y: [s(0), s(1), s(2)], r: lerp(RL[i], RL[j], w) }; };
    // the chest's place along the path in time: a monotone curve through the phases' marks (smooth speed: Fritsch-Carlson)
    const L0 = (1 - D.S0) * L + 2.15 * K + 0.1, KX = [0, TUNE.form1, TUNE.tw0, TUNE.tw1, TUNE.impact, TUNE.impact + 0.35], KY = [L0 - 0.9, L0 + 0.5, lE - lead, lA - lead, lT - snout, lT - snout + 1.5];
    for (let i = 1; i < KY.length; i++) KY[i] = Math.max(KY[i], KY[i - 1] + 0.25);
    const lc = pchip(KX, KY);
    return { path: { at, n, L: LT }, lc, L, lead, snout, marks: { L0, lE, lA, lT }, sE, E, A, zA, W, tB: o.tB || [], view: V, u, v };
  }
  function pchip(X, Y) { const n = X.length, d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d.push((Y[i + 1] - Y[i]) / (X[i + 1] - X[i]));
    m[0] = d[0]; m[n - 1] = d[n - 2] * 0.5;
    for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] <= 0) m[i] = 0; else { const h0 = X[i] - X[i - 1], h1 = X[i + 1] - X[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); } }
    return t => { if (t <= X[0]) return Y[0] + m[0] * (t - X[0]); if (t >= X[n - 1]) return Y[n - 1]; let i = 0; while (t > X[i + 1]) i++;
      const h = X[i + 1] - X[i], s = (t - X[i]) / h, s2 = s * s, s3 = s2 * s; return (2 * s3 - 3 * s2 + 1) * Y[i] + (s3 - 2 * s2 + s) * h * m[i] + (-2 * s3 + 3 * s2) * Y[i + 1] + (s3 - s2) * h * m[i + 1]; }; }

  /* ---- the choreography: tracks of the dragon's pose (keys: [time, value], smooth between) ---- */
  function keys(K, t) { if (t <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const a = K[i - 1], b = K[i], v = (t - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], v * v * (3 - 2 * v)); } return K[K.length - 1][1]; }
  const T0 = TUNE.tw0, T1 = TUNE.tw1, TI = TUNE.impact;
  const TR = {   // (v457 TM4: the swim's waves (up and down, side to side, tiles), the head and jaws, the sail, the fins' flutter, the limbs)
    undV: [[0, 0.1], [TUNE.form1, 0.18], [T0, 0.18], [T0 + 0.3, 0.07], [T1, 0.05], [TI, 0.02]],
    undL: [[0, 0.25], [TUNE.form1, 0.45], [T0, 0.45], [T0 + 0.3, 0.14], [T1, 0.08], [TI, 0.03]],
    head: [[0, -0.12], [T0, -0.12], [T0 + 0.3, 0.25], [T1 - 0.1, 0.25], [T1 + 0.12, -0.3], [TI, -0.15]],
    jaw: [[0, 0.22], [T0, 0.25], [T0 + 0.3, 0.8], [T1, 0.75], [T1 + 0.2, 0.5], [TI, 0.55]],
    sail: [[0, 1], [T1, 1], [T1 + 0.2, 0.7], [TI, 0.55]],
    flut: [[0, 1], [T0, 1], [T0 + 0.2, 1.45], [T1, 1.45], [T1 + 0.2, 0.8], [TI, 0.6]],
    reach: [[0, 0.3], [T1, 0.3], [T1 + 0.2, 0.7], [TI - 0.1, 1]],
    hind: [[0, 0.1], [T1, 0.15], [TI - 0.2, 0.4]],
  };
  /* a bolt's snap: 0 .. 1 round its time (the head dips, the jaws open) */
  const snapOf = (tB, t) => { let b = 0; for (const tb of tB) { const d = t - tb; if (d > -0.22 && d < 0.36) b = Math.max(b, d < 0 ? sstep(-0.22, -0.04, d) : 1 - sstep(0.06, 0.36, d)); } return b; };
  /* the pose at time t (the model's path mode: tiles from the impact point) */
  function poseAt(S, t) {
    const lc = S.lc(t), P = { k: TUNE.size, t, path: S.path, lc };
    for (const k in TR) P[k] = keys(TR[k], t);
    P.und = [P.undV, P.undL]; P.waveF = 1.6 * lc / S.L + 0.4 * t;   // (the waves run down the body a little faster than it swims)
    const b = snapOf(S.tB, t), tw = sstep(T0, T0 + 0.2, t) * (1 - sstep(T1 - 0.1, T1 + 0.1, t));
    P.head += -0.45 * b + 0.04 * Math.sin(t * 23) * tw; P.jaw += 0.55 * b;   // (a tremble as it roars climbing)
    const c = S.path.at(lc).p; P.x = c[0]; P.y = c[1]; P.z = c[2]; return P;
  }

  U.tiamat = (C, h) => {
    const H = h, K = TK.bind(H), PAL = K.P, me = H.me, X = H.X, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, DK = C.base * (C.K || 1) * (1 + 0.08 * (ev - 1));
    const NP = TUNE.pulses[tier - 1], NB = TUNE.bolts[tier - 1], g0 = H.g, G = TG();
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the game's cast pose, cut to it)
    X.banner('TIAMAT', '', C.col, 1.4); if (X.sfx.hum) X.sfx.hum(); if (X.sfx.crack) X.sfx.crack();
    // the impact point on the floor (the aimed monster, else ahead)
    let T = H.walk(C.tx, C.ty); if (!isFinite(T.x) || !isFinite(T.y)) T = { x: me.x, y: me.y };
    let W = floorMap(H, T.x, T.y, TUNE.patR); if (!W.tiles.length) { T = { x: me.x, y: me.y }; W = floorMap(H, T.x, T.y, TUNE.patR); }
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    const isExp = (x, y) => { try { return X.isExp ? X.isExp(x, y) : true; } catch (e) { return true; } };
    const floorOK = (x, y) => { try { return !X.blocked(x, y, 0.05, 0) && isExp(x, y); } catch (e) { return false; } };
    const onFloorM = m => floorOK(m.x, m.y) || floorOK(m.x + m.r * 0.7, m.y) || floorOK(m.x - m.r * 0.7, m.y) || floorOK(m.x, m.y + m.r * 0.7) || floorOK(m.x, m.y - m.r * 0.7);
    const sight = (x0, y0, x1, y1) => { try { return X.los ? X.los(x0, y0, x1, y1) : true; } catch (e) { return true; } };
    // the view (tiles on the floor: its middle and half extents) as the camera frames the pet now, a little pulled back while it flies
    let view = { gx: me.x, gy: me.y, hw: 4.5, hh: 9 };
    try { const Tz = X.Tz(), Ww = (typeof arc !== 'undefined' && arc.W) || 390, Hh = (typeof arc !== 'undefined' && arc.H) || 844; view = { gx: me.x - (H.sx(me.x) - Ww / 2) / Tz, gy: me.y - (H.sy(me.y) - Hh / 2) / Tz, hw: Ww / 2 / Tz / TUNE.zoomOut, hh: Hh / 2 / Tz / TUNE.zoomOut }; if (!isFinite(view.gx + view.gy + view.hw + view.hh)) throw 0; } catch (e) { view = { gx: me.x, gy: me.y, hw: 4.5, hh: 9 }; }
    const tB = Array.from({ length: NB }, (_, k) => TUNE.bolt0 + (TUNE.bolt1 - TUNE.bolt0) * (NB > 1 ? k / (NB - 1) : 0.5));
    const S = plan({ T, me, view, tB, foes: H.living().filter(valid).map(m => [m.x - T.x, m.y - T.y]) });
    S.W = W; S.T = T; S.H = S.path.at(S.lc(TUNE.forks)).p;   // (where the forks meet: the chest as it forms)
    const inView = m => Math.abs(m.x - view.gx) <= view.hw + 0.5 && Math.abs(m.y - view.gy) <= view.hh + 0.5;
    const headG = t => { const p = S.path.at(S.lc(t) + S.lead + 0.5).p; return { x: T.x + p[0], y: T.y + p[1], z: p[2] }; };   // (the floor under its head, and its height)
    const tP = k => TUNE.impact + TUNE.pulseGap * (k + 1), tEnd = tP(NP - 1) + TUNE.patR / TUNE.pulseV, LIFE = tEnd + TUNE.fade + 0.1;
    const rec = { T: { x: T.x, y: T.y }, tier, ev, DK, pulses: NP, bolts: NB, tB: tB.slice(), tells: [], strikes: [], hits: [], impactT: TUNE.impact, tw: [TUNE.tw0, TUNE.tw1], tP: Array.from({ length: NP }, (_, k) => tP(k)), life: LIFE, tiles: W.tiles.length, abort: null, impactN: 0, hover: S.H,
      plan: { sE: S.sE, zA: +S.zA.toFixed(2), lens: { L0: +S.marks.L0.toFixed(2), lE: +S.marks.lE.toFixed(2), lA: +S.marks.lA.toFixed(2), lT: +S.marks.lT.toFixed(2) }, speed: +((S.lc(TUNE.tw0) - S.lc(TUNE.form1)) / (TUNE.tw0 - TUNE.form1)).toFixed(2), view } };
    LAST = rec;
    const onFloor = m => W.on(m.x, m.y) || W.on(m.x + m.r * 0.7, m.y) || W.on(m.x - m.r * 0.7, m.y) || W.on(m.x, m.y + m.r * 0.7) || W.on(m.x, m.y - m.r * 0.7);
    const seed = R1(T.x * 3.1 + T.y * 7.7 + ev), colSeed = (() => { const r = Math.round(TUNE.patR / 8 * 255), g = Math.round(seed * 255), hx = v => (v < 16 ? '0' : '') + v.toString(16); return '#' + hx(Math.min(255, r)) + hx(g) + 'FF'; })();
    const BR2 = branches2D(W, T.x, T.y, TUNE.patR, seed * 6.2);
    // the state
    let struck = false, aborted = -1, anc = null; const impactHit = new Map(), pulseHit = Array.from({ length: NP }, () => new Map()), pulsePrev = new Array(NP).fill(-1);
    const bolts = tB.map((t, k) => ({ k, tS: t, tT: t - TUNE.tell, m: null, x: 0, y: 0, told: false, struck: false, hit: new Map(), sd: R1(seed * 9 + k * 3.7) * 100 }));
    const boltN = new Map();   // (how many bolts have struck each enemy: the next ones look elsewhere first)
    const trail = [], TRN = 12;
    const pulseR = (k, t) => (t < tP(k) ? -1 : Math.min(TUNE.patR, (t - tP(k)) * TUNE.pulseV));
    const tq = t => (aborted >= 0 ? Math.min(t, aborted) : t);   // (the pose stops where the caster fell)
    const disOf = t => (aborted >= 0 ? cl((t - aborted) / 0.5) : t < TUNE.impact ? 0 : cl((t - TUNE.impact - 0.04) / TUNE.breakup));
    const groundA = t => (aborted >= 0 ? 1 - cl((t - aborted) / 0.5) : 1 - cl((t - tEnd) / TUNE.fade));
    /* a bolt's target, chosen TUNE.tell before it falls: an enemy near where the head will be, in the view, on valid floor; the ones
       struck least, then the ones not already marked, then the nearest */
    function tell(b, t) {
      b.told = true; const hg = headG(b.tS); let best = null, bs = 1e9;
      for (const m of H.living()) { if (!valid(m) || !inView(m)) continue; const d = Math.hypot(m.x - hg.x, m.y - hg.y); if (d > TUNE.boltRange * 2 || !onFloorM(m)) continue;
        let pend = 0; for (const q of bolts) if (q !== b && q.told && !q.struck && q.m === m) pend++;
        const dn = m.y - (hg.y - 0.9 * hg.z) - 0.5 * Math.abs(m.x - hg.x) - 0.6;   // (an enemy not well below its jaws on the screen only when none is: it shoots down)
        const s = 3 * (boltN.get(m) || 0) + 2 * pend + 1.5 * d / TUNE.boltRange + (d > TUNE.boltRange ? 1.5 : 0) + (dn < 0 ? 2.5 - dn / TUNE.boltRange : 0); if (s < bs) { bs = s; best = m; } }   // (beyond its reach only when the near ones have had theirs: a longer bolt)
      b.m = best; if (best) { b.x = best.x; b.y = best.y; } else { b.x = hg.x; b.y = hg.y; b.none = !floorOK(hg.x, hg.y); }
      rec.tells.push({ k: b.k, t, id: best ? H.mons.indexOf(best) : -1 });
    }
    function boltStrike(b, t) {
      b.struck = true; if (b.m && valid(b.m) && onFloorM(b.m)) { b.x = b.m.x; b.y = b.m.y; }   // (it follows its target while the glow gathers)
      let n = 0;
      if (!b.none) for (const m of H.living()) { if (!valid(m) || b.hit.has(m) || Math.hypot(m.x - b.x, m.y - b.y) > TUNE.boltR + m.r || !onFloorM(m) || (m !== b.m && !sight(b.x, b.y, m.x, m.y))) continue;
        b.hit.set(m, 1); n++; boltN.set(m, (boltN.get(m) || 0) + 1);
        X.hitMon(m, TUNE.boltK * DK, C.dmgO(m.boss ? {} : { stun: TUNE.boltStun })); rec.hits.push({ k: 'bolt' + b.k, t, id: H.mons.indexOf(m), boss: !!m.boss }); }
      rec.strikes.push({ k: b.k, t, n, x: +b.x.toFixed(2), y: +b.y.toFixed(2), id: b.m ? H.mons.indexOf(b.m) : -1 });
      if (!b.none) { X.light(b.x, b.y, 3.5, 0.2); K.sparks(b.x, b.y, lowFx() ? 4 : 10, 7, { up: 3 }); }
      X.shake(1.6, 0.08); if (X.sfx.crack) X.sfx.crack();
    }
    function strike(f) {
      struck = true; let n = 0;
      for (const m of H.living()) { if (!valid(m) || impactHit.has(m) || !onFloor(m) || Math.hypot(m.x - T.x, m.y - T.y) > TUNE.impactR + m.r) continue; impactHit.set(m, 1); n++;
        X.hitMon(m, TUNE.impactK * DK, C.dmgO(m.boss ? {} : { stun: TUNE.stun })); rec.hits.push({ k: 'impact', t: f.t, id: H.mons.indexOf(m), boss: !!m.boss }); }
      rec.impactN = n;
      X.shake(TUNE.shake, 0.4); if (X.hitstop) X.hitstop(0.06); X.flash(0.3, '#D6DEFF'); X.light(T.x, T.y, 9, 0.5);
      if (X.sfx.crash) X.sfx.crash(); if (X.sfx.crack) X.sfx.crack(); if (X.sfx.thud) X.sfx.thud();
      if (H.g && TUNE.zoom > 1) { H.g.zoomP = TUNE.zoom * TUNE.zoomOut; H.g.zoomT = TUNE.zoomT; }
      K.sparks(T.x, T.y, Math.round(TUNE.sparks * (lowFx() ? 0.4 : 1)), 9, { up: 4 }); K.motes(T.x, T.y, lowFx() ? 5 : 12);
    }
    function abort(f) { if (aborted >= 0) return; aborted = f.t; rec.abort = f.t; f.life = Math.min(f.life, 0.75); }
    const F = H.add({ key: 'tiamat', life: LIFE, x: T.x, y: T.y, S, rec,
      update(dt, f) {
        const t = f.t;
        if (H.g !== g0 || Math.hypot(me.x - T.x, me.y - T.y) > 45) { f.life = 0; return; }   // (the stage changed under it)
        if ((me.dead || (H.g && H.g.over)) && aborted < 0) abort(f);
        if (aborted < 0) {
          // the hits in the timeline's order: each bolt's choice and strike (one Map a bolt), the impact once (one Map for the whole
          // event), then each pulse's front swept over the monsters (each pulse each monster once)
          const due = []; for (const b of bolts) { if (!b.told && t >= b.tT) due.push([b.tT, b, 0]); if (!b.struck && t >= b.tS) due.push([b.tS, b, 1]); }
          if (due.length) { due.sort((p, q) => p[0] - q[0]); for (const [, b, s] of due) { if (s) boltStrike(b, t); else tell(b, t); } }   // (in the timeline's order whatever the frame step)
          if (!struck && t >= TUNE.impact) strike(f);
          for (let k = 0; k < NP; k++) { const r = pulseR(k, t); if (r < 0 || pulsePrev[k] >= TUNE.patR) { pulsePrev[k] = Math.max(pulsePrev[k], r); continue; } const r0 = pulsePrev[k] < 0 ? 0 : pulsePrev[k];
            for (const m of H.living()) { if (!valid(m) || pulseHit[k].has(m)) continue; const d = Math.hypot(m.x - T.x, m.y - T.y);
              if (d - m.r <= r && d + m.r >= r0 - TUNE.pulseBand && d <= TUNE.patR + m.r && onFloor(m)) { pulseHit[k].set(m, 1); X.hitMon(m, TUNE.pulseK * DK, C.dmgO(m.boss ? {} : { stun: TUNE.pulseStun })); rec.hits.push({ k: 'pulse' + k, t, id: H.mons.indexOf(m), boss: !!m.boss }); } }
            if (pulsePrev[k] < 0) { X.shake(3, 0.12); if (X.sfx.crack) X.sfx.crack(); X.light(T.x, T.y, 6, 0.25); K.sparks(T.x, T.y, lowFx() ? 4 : 9, 7, { up: 2 }); }
            pulsePrev[k] = r; }
          // the cues: the forks' crackle, the formation, the twirl's thunder roll, the plunge's rush
          if (!S._fk && t >= 0.05) { S._fk = 1; if (X.sfx.whoosh) X.sfx.whoosh(); }
          if (!S._fm && t >= TUNE.forks - 0.1) { S._fm = 1; X.shake(2, 0.15); if (X.sfx.crack) X.sfx.crack(); }
          if (!S._ro && t >= TUNE.tw0) { S._ro = 1; X.shake(4, 0.6); if (X.sfx.crash) X.sfx.crash(); if (X.sfx.hiss) X.sfx.hiss(1.5, 0.16, 210); if (X.sfx.note) { X.sfx.note(55, 1.4, 'sawtooth', 0.06, 38); X.sfx.note(41, 1.6, 'triangle', 0.08, 30, 0.12); } }   // (a deep thunder roll)
          if (!S._dv && t >= TUNE.tw1) { S._dv = 1; if (X.sfx.whoosh) X.sfx.whoosh(); }
          if (!S._zo && t >= TUNE.gesture && H.g && TUNE.zoomOut < 1) { S._zo = 1; if (!(H.g.zoomT > 0) || H.g.zoomP >= 1) { H.g.zoomP = TUNE.zoomOut; H.g.zoomT = TUNE.impact - t; } }   // (pulled back a little while it flies)
          if (t > TUNE.form0 && t < TUNE.impact && anc && Math.random() < dt * 9 * H.Q()) { const sp = anc.spine[Math.floor(Math.random() * anc.spine.length)]; K.aura(T.x + sp.p[0], T.y + sp.p[1], 0.3, dt, 6, sp.p[2] * 0.9); }   // (charged air shed from the body, few)
        }
      },
      onEnd() { S.done = true; trail.length = 0; BR2.length = 0; },
      drawFloor(c, f, Xs, Ys, Tz) { try { floorPass(c, f, Tz); } catch (e) { if (!S._ef) { S._ef = 1; try { console.warn('Tiamat floor', e); } catch (e2) {} } } },
      // the dragon and its light in the sky pass (20b: after the darkness and the fog, a creature of light is never dimmed by them; under the monsters' shots and rings)
      drawSky(c, f, Xs, Ys, Tz) { try { dragonPass(c, f); } catch (e) { if (!S._ew) { S._ew = 1; try { console.warn('Tiamat dragon', e); } catch (e2) {} } }
        try { overPass(c, f, Tz); } catch (e) { if (!S._eo) { S._eo = 1; try { console.warn('Tiamat fx', e); } catch (e2) {} } } } });

    /* ================= drawing ================= */
    const sx = H.sx, sy = H.sy, wsx = p => sx(T.x + p[0]), wsy = p => sy(T.y + p[1]) - p[2] * 0.9 * X.Tz();   // (a model point, tiles from the impact, on the screen)
    const formOf = t => lerp(0, 1.5, cl((t - TUNE.form0) / (TUNE.form1 - TUNE.form0)));
    /* the charge's front along it (the material's veins, tail 0 .. jaws 1): a quick run before each bolt, then the twirl's long build */
    const chargeOf = t => { if (t >= TUNE.tw0) return t < TUNE.tw1 - 0.1 ? lerp(0.02, 1.05, cl((t - TUNE.tw0 - 0.05) / (TUNE.tw1 - 0.15 - TUNE.tw0))) : 1.15;
      for (const tb of tB) if (t >= tb - 0.32 && t < tb) return lerp(0.02, 1.05, (t - tb + 0.32) / 0.32); return 0; };
    const dim = (c, X0, Y0, r, a) => { if (!(a > 0.01) || r < 1) return; c.save(); c.translate(X0, Y0); c.scale(1, H.GY); const g = c.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, `rgba(20,10,58,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(20,10,58,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore(); };   // (feathered to nothing at its rim)
    const boltPos = b => (b.m && valid(b.m) && !b.struck ? [b.m.x, b.m.y] : [b.x, b.y]);
    /* the floor: the light pooled under the flying dragon, each bolt's gathering glow and its afterglow, the branching pattern
       spreading from the strike, the strike's flare, the pulses */
    function floorPass(c, f, Tz) {
      const t = f.t, ga = groundA(t); if (!(ga > 0.01)) return;
      const Q = K.gpuBegin(c, '__TM_FX'), h2 = Tz / 2, low = lowFx();
      if (anc && t < TUNE.impact + 0.3) { const ch = cl(chargeOf(tq(t))), a = cl((t - TUNE.form0) / 0.4) * (t < TUNE.impact ? 1 : 1 - cl((t - TUNE.impact) / 0.3)), p = anc.spine[Math.floor(anc.spine.length * 0.3)].p, rz = Math.max(0, p[2]);
        K.floorLight(c, sx(T.x + p[0]), sy(T.y + p[1]), Tz * (2.4 + 0.2 * rz), (Q ? 0.1 : 0.12) * a * (1 + 0.6 * ch) / (1 + rz * 0.15), '#5A5CFF'); }   // (its blue-violet light on the floor below it)
      // the bolts: a glow gathering under the target (glow-only), then the strike's afterglow
      if (aborted < 0 || t - aborted < 0.5) for (const b of bolts) { if (!b.told || b.none) continue; const [x, y] = boltPos(b), X0 = sx(x), Y0 = sy(y);
        if (!b.struck) { if (aborted >= 0) continue; const u = cl((t - b.tT) / TUNE.tell), fl = 0.85 + 0.15 * Math.sin(t * 40 + b.k);
          if (Q) dim(c, X0, Y0, Tz * (0.8 + 0.4 * u), 0.3 * u);   // (a soft violet dusk under the glow, so it reads on a pale floor: no edge, no ring)
          K.floorLight(c, X0, Y0, Tz * (0.7 + 0.5 * u), (0.18 + 0.42 * u * u) * fl, '#7A5CFF'); K.floorLight(c, X0, Y0, Tz * (0.25 + 0.3 * u), 0.5 * u * u * fl, '#CFE4FF'); }
        else { const e = t - b.tS; if (e < 0.6) { const a = 1 - e / 0.6; K.floorLight(c, X0, Y0, Tz * (1.1 + 0.4 * e), 0.6 * a * a, '#5FA8FF'); if (!low && e < 0.2) K.floorLight(c, X0, Y0, Tz * 0.5, 0.9 * (1 - e / 0.2), '#FFFFFF'); } } }
      if (Q) {
        if (struck && aborted < 0 || (aborted > TUNE.impact)) {
          const e = t - TUNE.impact, Rs = Math.min(63.5, TUNE.patR * eo(e / TUNE.spread) + 0.01), pk = Math.max(0, 1 - e / 0.5);
          for (const tl of W.tiles) { if (tl.d - 0.8 > Rs) continue; Q.quad(379, sx(tl.x), sy(tl.y), h2, 0, 0, h2, '#120C38', ga * 0.8, tl.x - T.x, tl.y - T.y, tl.m * 64 + Rs); }   // (a deep indigo shade under it, so its light reads on a pale floor)
          for (const tl of W.tiles) { if (tl.d - 0.8 > Rs) continue; Q.quad(376, sx(tl.x), sy(tl.y), h2, 0, 0, h2, colSeed, ga * (0.72 + 0.28 * pk), tl.x - T.x, tl.y - T.y, tl.m * 64 + Rs); }
          if (e < 0.4) { const r = TUNE.impactR * eo(e / 0.16); for (const tl of W.tiles) { if (Math.abs(tl.d - r) > 1.4) continue; Q.quad(377, sx(tl.x), sy(tl.y), h2, 0, 0, h2, colSeed, ga * (1 - e / 0.4), tl.x - T.x, tl.y - T.y, tl.m * 64 + Math.min(63.5, r)); } }
          for (let k = 0; k < NP; k++) { const r = aborted >= 0 ? -1 : pulseR(k, t); if (r < 0) continue; const a = (1 - sstep(0.75 * TUNE.patR, TUNE.patR + 0.3, r)) * Math.min(1, (t - tP(k)) / 0.05); if (a < 0.02) continue;
            for (const tl of W.tiles) { if (Math.abs(tl.d - r) > 1.5) continue; Q.quad(377, sx(tl.x), sy(tl.y), h2, 0, 0, h2, colSeed, ga * a, tl.x - T.x, tl.y - T.y, tl.m * 64 + Math.min(63.5, r)); } } }
        K.gpuEnd(c); return; }
      // ---- 2D: the branches as bolts over the floor, the pulses brightening them where their fronts are ----
      if (!struck) return; const e = t - TUNE.impact, Rs = TUNE.patR * eo(e / TUNE.spread);
      let front = -9; for (let k = 0; k < NP; k++) { const r = aborted >= 0 ? -1 : pulseR(k, t); if (r >= 0 && r < TUNE.patR) front = r; }
      for (const b of BR2) { const pts = []; for (const q of b.pts) { if (Math.hypot(q[0], q[1]) > Rs) break; pts.push([sx(T.x + q[0]), sy(T.y + q[1])]); } if (pts.length < 2) continue;
        const mid = b.pts[Math.floor(b.pts.length / 2)], dd = Math.hypot(mid[0], mid[1]), lit = front >= 0 ? Math.exp(-(((dd - front) / 1.2) ** 2)) : 0;
        K.bolt(c, pts, Math.max(0.8, Tz * (0.05 - 0.012 * b.depth)) * (1 + lit), ga * (0.55 + 0.45 * lit + (e < 0.3 ? 0.4 * (1 - e / 0.3) : 0))); }
    }
    /* the dragon itself, on GLM or painted (in the sky pass: over everything on the ground, as it flies over it) */
    function dragonPass(c, f) {
      const t = f.t, Gd = TG(); if (!Gd || t < TUNE.form0 - 0.02) { anc = null; return; }
      const dis = disOf(t); if (dis >= 0.999) { anc = null; return; }
      const tt = tq(t), P = poseAt(S, tt); anc = Gd.pose(P);
      const Tz = X.Tz(), ch = chargeOf(tt), snap = snapOf(tB, tt), flashK = (struck ? Math.max(0, 1 - (t - TUNE.impact) / 0.15) : 0) + Math.max(0, 1 - Math.abs(t - TUNE.form1) / 0.12) * 0.35;
      // see-through where it would hide the pet's sprite or an enemy's warning (the player's view kept)
      let al = 1; const near = (X0, Y0, R) => { for (const s of anc.spine) { if (s.p[2] > -0.1 && Math.hypot(wsx(s.p) - X0, wsy(s.p) - Y0) < R + s.r * Tz) return true; } return false; };   // (its body over the point: the wings are see-through already)
      if (!me.dead && near(sx(me.x), sy(me.y) - Tz * 0.5, Tz * 0.5)) al = 0.6;
      for (const z of (X.zones || [])) { if (z.kind !== 'warn' || z.own === 'pet' || al < 0.75) continue; if (!z.shape && near(sx(z.x), sy(z.y), Math.min(2, z.r || 1) * Tz)) { al = 0.72; break; } }
      const o = { X0: sx(T.x), Y0: sy(T.y), k: Tz, t: t + 5, glow: 1 + 0.6 * cl(ch) + 0.35 * snap, glow2: flashK, form: formOf(t), charge: ch, dis, clip: tt > TUNE.tw1, alpha: al, jaw: P.jaw };
      // (the trail: the chest's last screen points, sampled as it plunges)
      if (tt >= TUNE.tw1 - 0.05 && tt <= TUNE.impact + 0.05) { const q = [wsx(anc.chest), wsy(anc.chest)]; if (!trail.length || Math.hypot(q[0] - trail[trail.length - 1][0], q[1] - trail[trail.length - 1][1]) > 2) { trail.push(q); if (trail.length > TRN) trail.shift(); } }
      if (!glOff() && Gd.usable() && Gd.draw(c, o)) return;
      Gd.draw2D(c, o);
    }
    /* over everything: the converging forks, the bolts from its jaws, the arcs between its horns, claws and wing joints, the charge
       running up it and gathering in its jaws, the plunge's trail, the impact's discharge and flash, the outline breaking into arcs */
    function overPass(c, f, Tz) {
      const t = f.t, low = lowFx(), Q = K.gpuBegin(c, '__TM_FX'), tt = tq(t), HP = S.H, HX = sx(T.x + HP[0]), HY = sy(T.y + HP[1]) - HP[2] * 0.9 * Tz;
      // the forks: from high round the forming point, each running in to it (re-grown 15 times a second)
      if (t < TUNE.forks + 0.12 && aborted < 0) { const nF = low ? 3 : TUNE.nForks, u = eo(t / TUNE.forks), fs = Math.floor(t * 15);
        for (let i = 0; i < nF; i++) { const a = i / nF * TAU + 0.4 + seed, x0 = HX + Math.cos(a) * Tz * 4.6, y0 = HY - Tz * (3.2 + 1.4 * R1(i + seed)) + Math.sin(a) * Tz * 1.6, x1 = lerp(x0, HX, u), y1 = lerp(y0, HY, u);
          K.arc(c, x0, y0, x1, y1, fs * 7 + i * 31, Math.max(1.2, Tz * 0.07), 0.9 * (1 - cl((t - TUNE.forks) / 0.12)), { forks: low ? 0 : 2 }); }
        if (t > TUNE.forks - 0.15) { const k = 1 - cl(Math.abs(t - TUNE.forks + 0.05) / 0.12); K.glow(c, HX, HY, Tz * 2.4, PAL.cyan, 0.7 * k); if (Q) Q.star(HX, HY, Tz * 1.6, 0.8 * k, '#FFFFFF'); } }
      // (v457 TM4) the bolts: the sail's spines arcing into the jaws as it takes aim, then a forked bolt from the jaws down to the target
      if (aborted < 0) { const A = anc, fs = Math.floor(t * 20); let mX, mY; if (A) { mX = wsx(A.mouth); mY = wsy(A.mouth); } else { const p = S.path.at(S.lc(tt) + S.snout).p; mX = wsx(p); mY = wsy(p); }
        for (const b of bolts) { if (!b.told || t < b.tS - 0.16 || t > b.tS + TUNE.boltLife) continue; const [x, y] = boltPos(b), X1 = sx(x), Y1 = sy(y);
          if (t < b.tS) { const g = cl((t - b.tS + 0.16) / 0.16); K.glow(c, mX, mY, Tz * (0.5 + 0.5 * g), PAL.cyan, 0.6 * g); K.orb(c, mX, mY, Tz * 0.12 * (0.5 + g), t, b.k, g);
            if (A && !low && A.sail.length > 2) for (let j = 0; j < 2; j++) { const q = A.sail[Math.min(A.sail.length - 1, 1 + j * 2)]; K.arc(c, wsx(q), wsy(q), mX, mY, fs * 3 + j * 17 + b.k, Math.max(0.8, Tz * 0.03), 0.7 * g, { forks: 0 }); }
            continue; }
          const e = (t - b.tS) / TUNE.boltLife, a = Math.pow(1 - e, 0.7) * (0.75 + 0.25 * R1(fs + b.k)), w = Math.max(1.4, Tz * 0.1) * (1 - 0.45 * e), s1 = fs * 13 + b.k * 31 + Math.floor(b.sd), Y2 = Y1 - Tz * 0.15;
          if (!b.none) {
            if (Q) { const pts = K.path(mX, mY, X1, Y2, s1, Math.min(26, Math.hypot(X1 - mX, Y2 - mY) * 0.14)); c.save(); c.globalAlpha = 0.42 * a; c.strokeStyle = '#140A3A'; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w * 5; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); c.restore(); }   // (a dark violet shade under the channel, so it reads on a pale floor; the light goes over it)
            K.arc(c, mX, mY, X1, Y2, s1, w, a, { forks: low ? 1 : 3 }); if (!low) K.arc(c, mX, mY, X1 + Tz * 0.12, Y2, s1 + 7, w * 0.45, a * 0.6, { forks: 0 });   // (the main channel and a thinner second one beside it)
            if (e < 0.8) K.groundArcs(c, X1, Y1, Tz * TUNE.boltR, low ? 2 : 4, t, 0.8 * (1 - e / 0.8), b.sd); }   // (its splash crawling over the floor)
          else K.arc(c, mX, mY, X1, Y1, s1, w * 0.7, a * 0.7, { forks: 1 });
          K.glow(c, mX, mY, Tz * 0.8, PAL.cyan, 0.6 * a);
          if (e < 0.6 && !b.none) { K.glow(c, X1, Y1 - Tz * 0.2, Tz * 1.4, PAL.blue, 0.6 * (1 - e / 0.6)); if (!K.flareStar(c, X1, Y1 - Tz * 0.2, Tz * 0.8, 1 - e / 0.6, b.sd)) K.glow(c, X1, Y1 - Tz * 0.2, Tz * 0.5, '#FFFFFF', 0.7 * (1 - e / 0.6)); } } }
      if (anc && aborted < 0 && tt < TUNE.impact) {
        const ch = chargeOf(tt), crk = cl((tt - TUNE.form1 + 0.1) / 0.3) * (1 - sstep(TUNE.tw1 - 0.1, TUNE.tw1 + 0.1, tt)) * (tt < TUNE.tw0 ? 0.55 : 1), fs = Math.floor(t * 15), A = anc;
        // the violet arcs (a few, bounded): between the crest spines, the claws, the fin-wings, along the sail's crest, the tail fin's lobes
        if (crk > 0.02) { const sl = A.sail, pairs = [[A.horns[0], A.horns[1]], [A.fore[0], A.fore[1]], [A.pec[0], A.pec[1]], sl.length > 2 ? [sl[1], sl[2]] : [A.hindC[0], A.hindC[1]], [A.tailTips[0], A.tailTips[1]]].slice(0, low ? 2 : TUNE.arcs);
          pairs.forEach(([p, q], i) => { if (R1(fs * 3.7 + i) < 0.22) return; const x0 = wsx(p), y0 = wsy(p), x1 = wsx(q), y1 = wsy(q), L = Math.hypot(x1 - x0, y1 - y0); const pts = K.path(x0, y0, x1, y1, fs * 13 + i * 7, Math.min(Tz * 0.4, L * 0.25), 6);
            const a = crk * (0.55 + 0.45 * cl(ch)); if (!K.plasmaPts(c, pts, Math.max(1, Tz * 0.05), a, { col: '#8A5CFF', seed: fs + i, heat: 0.8 })) K.bolt(c, pts, Math.max(0.8, Tz * 0.035), a); }); }
        // the charge: an orb of light running up the spine with the front, then gathering in the jaws
        if (ch > 0.01 && ch < 1.1) { const s = 1 - Math.min(1, ch), i = Math.max(0, Math.min(A.spine.length - 1, Math.round(s * (A.spine.length - 1)))), p = ch >= 1 ? A.mouth : A.spine[i].p, big = tt >= TUNE.tw0 ? 1 : 0.6; K.glow(c, wsx(p), wsy(p), Tz * 0.9 * big, PAL.cyan, 0.65 * big); K.orb(c, wsx(p), wsy(p), Tz * 0.16 * big, t, 3, 0.9); }
        if (tt > TUNE.tw1 - 0.25 && tt < TUNE.tw1 + 0.15) { const g = cl((tt - TUNE.tw1 + 0.25) / 0.25) * (1 - cl((tt - TUNE.tw1) / 0.3) * 0.5); K.glow(c, wsx(A.mouth), wsy(A.mouth), Tz * 1.3 * g, PAL.blue, 0.6 * g); K.orb(c, wsx(A.mouth), wsy(A.mouth), Tz * 0.28 * g, t, 5, g); }
        // selective bloom: the eyes, a soft halo round the chest
        for (const e of A.eyes) K.glow(c, wsx(e), wsy(e), Tz * 0.32, '#C9B4FF', 0.5 * cl(formOf(t) - 0.4));
        K.glow(c, wsx(A.chest), wsy(A.chest), Tz * 2.0, PAL.blue, 0.1 * cl(formOf(t) - 0.2) * (1 + 0.6 * cl(ch))); }
      // (v454 TM2) its whiskers: two long tendrils of electricity trailing from the snout, swaying (drawn while it is whole)
      if (anc && aborted < 0 && tt < TUNE.impact + 0.05) { const A = anc, Fh = A.Fh, kk = A.K, fa = cl(formOf(t) - 0.6), ch = cl(chargeOf(tt));
        if (fa > 0.02) for (let k = 0; k < 2; k++) { const sg = k ? -1 : 1, r = A.whisk[k], pts = [[wsx(r), wsy(r)]];
          for (let i = 1; i <= 8; i++) { const sw = 0.14 * Math.sin(t * 3.1 + i * 0.75 + k * 1.7) * i / 8, dn = -0.06 * i - 0.025 * i * i * 0.3, q = [r[0] + (-Fh.x[0] * 0.3 * i + Fh.y[0] * sg * (0.05 * i + sw) + Fh.z[0] * dn) * kk, r[1] + (-Fh.x[1] * 0.3 * i + Fh.y[1] * sg * (0.05 * i + sw) + Fh.z[1] * dn) * kk, r[2] + (-Fh.x[2] * 0.3 * i + Fh.y[2] * sg * (0.05 * i + sw) + Fh.z[2] * dn) * kk]; pts.push([wsx(q), wsy(q)]); }
          const a = fa * (0.75 + 0.25 * ch); if (!K.plasmaPts(c, pts, Math.max(1, Tz * 0.045), a, { col: '#C46BFF', seed: k * 3 + Math.floor(t * 12), heat: 0.8, taper: 0.7 })) K.bolt(c, pts, Math.max(0.8, Tz * 0.03), a); } }
      // the plunge's trail
      if (trail.length > 1 && tt < TUNE.impact + 0.25 && aborted < 0) { const a = tt < TUNE.impact ? 0.85 : 0.85 * (1 - (tt - TUNE.impact) / 0.25); K.ribbon(c, trail, Math.max(2, Tz * 0.55), a); }
      // the impact: the discharge, a short flash, the arcs bursting off it
      if (struck && aborted < 0) { const e = t - TUNE.impact, X0 = sx(T.x), Y0 = sy(T.y);
        if (e < 0.5) { if (Q) Q.quad(378, X0, Y0 - Tz * 0.5, TUNE.impactR * Tz * 1.15, 0, 0, TUNE.impactR * Tz * 1.15, '#FFFFFF', 1, e / 0.5, seed, tier);
          else K.glow(c, X0, Y0 - Tz * 0.5, TUNE.impactR * Tz * (0.6 + 0.6 * eo(e / 0.5)), PAL.cyan, 0.8 * (1 - e / 0.5)); }
        if (e < 0.12) { K.glow(c, X0, Y0 - Tz * 0.4, Tz * 3.6, '#EEF2FF', 0.55 * (1 - e / 0.12)); K.flareStar(c, X0, Y0 - Tz * 0.4, Tz * 1.4, 1 - e / 0.12, 0.3); }
        if (e < 0.35) { const n = low ? 3 : 5, fs = Math.floor(t * 15); for (let i = 0; i < n; i++) { const a = i / n * TAU + seed * 3, L = TUNE.impactR * Tz * (0.6 + 0.4 * R1(fs + i)); K.arc(c, X0, Y0 - Tz * 0.4, X0 + Math.cos(a) * L, Y0 - Tz * 0.4 + Math.sin(a) * L * 0.7, fs * 11 + i, Math.max(1, Tz * 0.06), 0.9 * (1 - e / 0.35), { forks: 0 }); } } }
      // the break-up: its outline as luminous arcs, fading
      if (anc && (struck || aborted >= 0)) { const d0 = aborted >= 0 ? aborted : TUNE.impact, e = t - d0, a = 1 - cl(e / (TUNE.breakup + 0.1)); if (a > 0.02) { const A = anc, fs = Math.floor(t * 15), segs = [];
          for (let i = 4; i < A.spine.length; i += 4) segs.push([A.spine[i - 4].p, A.spine[i].p]);
          for (let i = 1; i < A.sail.length; i++) segs.push([A.sail[i - 1], A.sail[i]]);
          segs.push([A.head, A.horns[0]], [A.head, A.horns[1]], [A.tail, A.tailTips[0]], [A.tail, A.tailTips[1]], [A.spine[3].p, A.pec[0]]);
          const nS = low ? Math.ceil(segs.length / 2) : segs.length;
          for (let i = 0; i < nS; i++) { const [p, q] = segs[low ? i * 2 : i]; if (p[2] < -0.05 && q[2] < -0.05) continue; const x0 = wsx(p), y0 = wsy(p), x1 = wsx(q), y1 = wsy(q); K.bolt(c, K.path(x0, y0, x1, y1, fs * 5 + i * 3, Math.min(Tz * 0.3, Math.hypot(x1 - x0, y1 - y0) * 0.2), 5), Math.max(0.8, Tz * 0.045), a * (0.6 + 0.4 * R1(fs + i))); } } }
      K.gpuEnd(c);
    }
    return F;
  };
  U.tiamat.warm = () => { try { const G = TG(); if (G) G.warm(); } catch (e) {} };
  U.tiamat.TUNE = TUNE;
  U.tiamat.lib = { TUNE, floorMap, poseAt, branches2D, plan, snapOf, get last() { return LAST; } };
})();
