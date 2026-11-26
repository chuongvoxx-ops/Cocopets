/* ---------- (v450 MD, reworked v455 MD2) Water's six-star summon Ultimate: Moby Dick ----------
   The battlefield becomes a dark, starry ocean under a shiny aqua surface, and an enormous spirit whale (20k7q MOBY_GL) performs one
   continuous dive through it: it swims in beneath the surface, breaches, carries over a broad airborne arc, dives back head first,
   leaves its tail standing out of the water, slaps the water with its flukes (the damaging impact, with the tidal rings) and slides
   away under the surface. After a short casting gesture (TUNE.gesture) the pet has its normal movement, dodge and attacks; the summon
   runs on its own timeline while the monsters, their attacks and every timer carry on.
   The sequence (seconds from the cast, all in TUNE):
     0 .. 0.85     the water forms: midnight-blue water spreads over the arena's floor round the aim (only real floor: walkable,
                   explored, in sight of the aim and connected to it, within TUNE.waterR; feathered at the walls), under a shiny aqua
                   surface adapted from Shiny Aqua Illusion's water (20k7d: its midnight pool turning sapphire toward the rim, its aqua
                   caustic light, its two counter-turning sheens of wavy turquoise streaks, its slow concentric currents and its
                   luminous rim), with turquoise light on the moving ripples, a luminous edge along the walls and a restrained field
                   of stars in it and just above it. Painted under the monsters and every warning, trap and pickup (the 'floor'
                   pass), so enemy attack indicators stay above it. Visual only: no tile changes, collision and navigation untouched.
     0.1 .. 1.5    the approach: the whale's long silhouette glides in beneath the surface (a light proxy, not the model), rising;
                   its course may curve in from the side where the water and the view have room (path.psi); a V wake trails its
                   head and the water bulges where it is about to break through.
     1.5 .. 2.3    the breach: the forehead breaks the surface first, then the chest, the belly and the tail, the body sliding out
                   through one opening in the water and arching over (the model is cut at the waterline; what is still under it
                   shows as the silhouette), sheets of water peeling off its sides and breaking into droplets.
     2.3 .. 3.1    the arc: a broad airborne arc with its whole silhouette in the air, slowing near the top (its fins and tail still
                   moving), the head pitching down and the body curving after it into a head-first return.
     3.1 .. 3.75   the dive: the nose re-enters first (a focused splash), the body following it beneath the surface along the same
                   line, until only the tail stock and the flukes stand out of the water.
     3.75 .. 3.97  the anticipation: the tail lifts and cocks, the flukes raised and spread.
     3.97 .. 4.19  THE TAIL-SLAP: the tail stock flexes and whips the flukes down flat onto the water at the aim: one heavy Water hit on
                   every monster within TUNE.slamR of the flukes' contact, each once; a contact flash, a broad fan of aqua spray, a
                   thick tidal ring, foam and star-filled droplets, the splash sound, a restrained shake and a small punch.
     4.27 + 0.45k  tidal ring k (1 at Base, 2 at Adept, 3 at Celestial) leaves the same strike: a travelling wave front with a raised,
                   curling, foaming crest, over the water only, each ring hitting each monster once as its front passes.
     4.3 .. 6.3    the tail slides beneath the surface; the silhouette recedes and fades, leaving a wake and overlapping ripples.
     .. end        the waves resolve, then the water settles and dissolves from the edges in.
   Only the tail-slap and the rings deal damage (the breach and the dive's splash are visual): DK = base x K x (1 + 0.08 (evo - 1)),
   the slap TUNE.slam DK (the largest single hit), each ring TUNE.ring DK. Bosses take the damage but keep their crowd-control
   immunity. One authoritative timeline (the effect's own game clock), hits resolved by thresholds and by each ring's swept front:
   the same hits at any frame rate. Cooldown TUNE.cd (40 s, its row in 20k1), begun when the cast commits. Everything ends with the
   effect: on completion, the caster's defeat (no slap or ring after it: the whale fades and the water drains), the stage's end or exit
   (the model's GPU buffers are freed by the stage's destroy hook in 20b).
   The whale's motion is one rig (20k7q): its root follows one smooth path (cubic keys, so position and velocity are continuous),
   its pitch follows the path's direction, its spine bends with the path's curvature (so the body follows the head through the
   breach and the dive) and lags the turns (the tail and flukes carry the momentum); the tail stock and flukes are keyed for the
   anticipation and the whip, and the contact is solved from the posed mesh (the moment the flukes' underside meets the water lands
   exactly on TUNE.slap, at the aim).
   GPU first: the water, the silhouette, the wake, the rings and crests, sprays, sheets, the splash fan, droplets and stars on the
   shared painter (20k6h FGFX kinds 360..367 MD-FX and 394, 395 MD2-FX), the whale on GLM (one pass, cut at the waterline, drawn in the
   'sky' pass over the stage's darkness: a luminous spirit); without WebGL a painted version of each (the whale from the same posed
   mesh, its part above the water). */
(() => {
  const U = ELEM_IMPL.water.ult, TAU = Math.PI * 2;
  const TUNE = {
    cd: 40,                    // (the cooldown, s: the row's cd in ELEM_MOVES.water; the game sets it when the cast commits)
    gesture: 0.45,             // the pet's casting gesture (s); full control after it
    // the timeline (s from the cast)
    spread: 0.85, approach: 0.1, breach: 1.5, clear: 2.3, apex: 2.65, reenter: 3.1, hold: 3.75, whip: 3.97, slap: 4.19, sink: 0.6, away: 2.1,
    // the path (tiles, rad, tiles/s): the approach's depth and speed; the breach's angle and speed as the nose breaks the surface and as the
    // flukes clear it; the apex (the root's height over the surface, its speed there); the dive's velocity as the nose re-enters; where
    // the waterline stands along the body when the dive stops (0 the snout .. 1 the flukes' root)
    // past the surface the nose's path arches over (radius arcR: the body comes out curved, its nose already levelling as the flukes
    // clear, so the leap stays inside a phone's view); the apex and the breach-to-dive span follow from these (geom)
    approachV: 2.4, approachV2: 3.6, rise: 2.6, line: 1.0, breachA: 0.85, breachV: 10, arcR: 7.5, clearV: 4.9, apexV: 3.4, diveA: 0.86, holdS: 0.62,
    turnL: 3.6, turnMax: 1.2,  // (the approach's course may curve in over the water, turning up to turnMax rad over its last turnL tiles before it rises)
    // the tail (rad): the anticipation's lift of the tail stock, the flukes' cock; the whip: the body's pivot and the stock's flexion at
    // full travel (the contact is solved along it), the flukes' pitch at the contact; how much of the path's curvature the spine follows
    raise: 0.45, cock: 0.42, pivot: 0.42, bend: 0.95, flukeC: -0.04, follow: 0.55, lag: 0.05, kmax: 0.7, arch: 0.35,
    ringDelay: 0.08, ringGap: 0.45, rings: [1, 2, 3],   // the rings: after the slap, between them, how many (Base, Adept, Celestial)
    ringV: 6.4, ringR: 8.0, ringBand: 0.9,               // a ring's speed (tiles/s), reach and the band behind its front that still counts as passing
    settle: 0.25, drain: 1.4,                            // the water: a pause after the last ring has resolved, then it dissolves (s)
    waterR: 9.5, slamR: 3.0,                             // sizes (tiles): the water's reach round the aim, the slap's
    slam: 10, ring: 2.2,                                 // damage (x DK)
    slamStun: 0.5, slamKb: 3.2, ringKb: 1.2,             // (monsters only: bosses keep their immunity)
    shake: 7, zoom: 1.04, zoomT: 0.3, zoomOut: 0.84,      // (the camera: a restrained shake and a small punch at the slap; pulled back a little while it flies)
    drops: 72, stars: 26,                                // cosmetic pools (thinned by Fewer effects; never the hits)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const easeO = u => 1 - (1 - u) * (1 - u), easeI = u => u * u;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const MG = () => (typeof MOBY_GL !== 'undefined' ? MOBY_GL : null);
  const gfx = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const glOff = () => { try { return typeof window !== 'undefined' && window.__MD_GL === 0; } catch (e) { return false; } };
  const C_PALE = '#CFF6FF', C_STAR = '#E6F6FF', C_AQUA = '#5FE8FF';
  const L = () => (MG() ? MG().DIMS.LEN : 5.8), NM = () => (MG() ? MG().DIMS.NMAIN : 40);
  let LAST = null;   // (the last cast's record: tests read its hits and its timeline)

  /* ---- the water's floor: every floor tile round the aim that is walkable, explored, in sight of the aim and connected to it ---- */
  function waterMap(H, cx, cy, R) {
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
    const tiles = []; let maxD = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { if (!has(i, j)) continue;
      const m = (has(i - 1, j) ? 0 : 1) | (has(i + 1, j) ? 0 : 2) | (has(i, j - 1) ? 0 : 4) | (has(i, j + 1) ? 0 : 8) | (has(i - 1, j - 1) ? 0 : 16) | (has(i + 1, j - 1) ? 0 : 32) | (has(i - 1, j + 1) ? 0 : 64) | (has(i + 1, j + 1) ? 0 : 128);
      const x = x0 + i + 0.5, y = y0 + j + 0.5, d = Math.hypot(x - cx, y - cy); maxD = Math.max(maxD, d); tiles.push({ i, j, x, y, m, d, used: false }); }
    // the quads: a 2 x 2 block where four whole tiles (no missing neighbour) meet on even coordinates, else one a tile
    const at = new Map(); for (const t of tiles) at.set(t.j * n + t.i, t);
    const quads = [];
    for (const t of tiles) { if (t.used) continue; const a = at.get(t.j * n + t.i + 1), b = at.get((t.j + 1) * n + t.i), c = at.get((t.j + 1) * n + t.i + 1);
      if (!((t.i | t.j) & 1) && !t.m && a && b && c && !a.m && !b.m && !c.m && !a.used && !b.used && !c.used) { t.used = a.used = b.used = c.used = true; quads.push({ x: t.x + 0.5, y: t.y + 0.5, m: 0, sz: 2, d: Math.hypot(t.x + 0.5 - cx, t.y + 0.5 - cy) }); }
      else { t.used = true; quads.push({ x: t.x, y: t.y, m: t.m, sz: 1, d: t.d }); } }
    const on = (x, y) => has(Math.floor(x) - x0, Math.floor(y) - y0);
    return { x0, y0, n, ok, has, on, tiles, quads, maxD, cx, cy };
  }

  /* ================= the performance: one path for the whale's root =================
     In the whale's own vertical plane: a along its heading (tiles), z up (0 the water's surface). The local frame has the nose's
     re-entry point E at a = 0; geom() builds the keys there, solves the slap's contact and finds where the flukes meet the water (off):
     the world's aim T is that point. Keys: [t, a, z, va, vz] (cubic Hermite between them: position and velocity continuous). */
  const hermite = (K, t) => { if (t <= K[0][0]) { const k = K[0], d = t - k[0]; return [k[1] + k[3] * d, k[2] + k[4] * d, k[3], k[4]]; }
    for (let i = 1; i < K.length; i++) if (t <= K[i][0]) { const a = K[i - 1], b = K[i], h = b[0] - a[0], u = (t - a[0]) / h, u2 = u * u, u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2, d00 = (6 * u2 - 6 * u) / h, d10 = 3 * u2 - 4 * u + 1, d01 = (-6 * u2 + 6 * u) / h, d11 = 3 * u2 - 2 * u;
      return [h00 * a[1] + h10 * h * a[3] + h01 * b[1] + h11 * h * b[3], h00 * a[2] + h10 * h * a[4] + h01 * b[2] + h11 * h * b[4], d00 * a[1] + d10 * a[3] + d01 * b[1] + d11 * b[3], d00 * a[2] + d10 * a[4] + d01 * b[2] + d11 * b[4]]; }
    const k = K[K.length - 1], d = t - k[0]; return [k[1] + k[3] * d, k[2] + k[4] * d, k[3], k[4]]; };
  let GEOM = null, GEOMK = 0;
  function geom() {
    if (GEOM && GEOMK === 1) return GEOM; const key = 1;   // (built once from TUNE; lib.regeom() rebuilds it after a change)
    const TU = TUNE, LEN = L(), S0 = 0.4, hd = S0 * LEN, th = TU.breachA, D = [Math.cos(th), Math.sin(th)], nuC = LEN * 1.12, R2 = TU.arcR;
    // the approach and the breach: the nose's own path, the body following it exactly (each point of the spine where the nose was):
    // level at the approach's depth, a bend of radius rise turning up to the breach's angle, a straight run up to B and, past the
    // surface, an arch of radius arcR (the body comes out curved over, the nose levelling as the flukes clear). sig: the length along
    // it (0 at B); the nose's travel on it on cubic keys (slow under the water, fastest as it breaks the surface). Built with B at 0 first.
    const arcPt = (B, sg) => { const ph = th - sg / R2; return [B[0] + R2 * (Math.sin(th) - Math.sin(ph)), B[1] - R2 * (Math.cos(th) - Math.cos(ph)), ph]; };
    // the flight (from the flukes clearing the water to the dive's stop): the root on cubic keys, carried on from its state at the clearing:
    // a short climb to the apex (slowing, level), then pitched down into the dive, the nose meeting the water at E at TUNE.reenter, its
    // angle diveA; the dive's speed set so the fall matches the drop (no bump), the apex's span from the speeds
    const c0 = arcPt([0, 0], nuC - hd), vC = [Math.cos(c0[2]) * TU.clearV, Math.sin(c0[2]) * TU.clearV], dA = TU.apex - TU.clear, dE = TU.reenter - TU.apex;
    const ap = [c0[0] + (vC[0] + TU.apexV) / 2 * dA, c0[1] + vC[1] / 2 * dA], F = [Math.cos(TU.diveA), -Math.sin(TU.diveA)], zE = -F[1] * hd;
    const Vd = Math.max(3, 2 * (ap[1] - zE) / (dE * -F[1])), dv = [F[0] * Vd, F[1] * Vd];
    const span = ap[0] + (TU.apexV + dv[0]) / 2 * dE + F[0] * hd;   // (the breach point to the nose's re-entry, tiles)
    const B = [-span, 0], rC = [c0[0] - span, c0[1]], rP = [ap[0] - span, ap[1]];
    // the re-entry: the nose at E (0, 0), the root hd behind it along the dive; the hold: the waterline at holdS along the body
    const rE = [-F[0] * hd, -F[1] * hd], rH = [F[0] * (TU.holdS * LEN - hd), F[1] * (TU.holdS * LEN - hd)], rB = [B[0] - D[0] * hd, B[1] - D[1] * hd];
    const K = [[TU.clear, rC[0], rC[1], vC[0], vC[1]], [TU.apex, rP[0], rP[1], TU.apexV, 0], [TU.reenter, rE[0], rE[1], dv[0], dv[1]], [TU.hold, rH[0], rH[1], F[0] * 0.05, F[1] * 0.05]];
    const Rc = TU.rise, P1 = [B[0] - D[0] * TU.line, B[1] - D[1] * TU.line], Cc = [P1[0] - Rc * Math.sin(th), P1[1] + Rc * Math.cos(th)], sA = -TU.line - Rc * th;
    const tM = TU.breach - 0.45, s1 = -(TU.approachV2 + TU.breachV) / 2 * (TU.breach - tM), s0 = s1 - (TU.approachV + TU.approachV2) / 2 * (tM - TU.approach);   // (a steady glide in, then the surge up to the surface)
    const NK = [[TU.approach, s0, TU.approachV], [tM, s1, TU.approachV2], [TU.breach, 0, TU.breachV], [TU.clear, nuC, TU.clearV]];
    const pH = Math.atan2(F[1], F[0]);
    GEOM = { K, NK, NKH: NK.map(k => [k[0], k[1], 0, k[2], 0]), D, F, B, P1, Cc, Rc, R2, sA, nuC, rE, rH, rB, rC, rP, pH, dv, LEN, hd, span, depth: Cc[1] - Rc, off: 0, piStar: 1, contact: null, kvC: null, tops: null }; GEOMK = key;
    // the body's shape as the flukes clear (on the arch): the flight starts from it and eases out of it (TUNE.arch)
    { const n = NM(); GEOM.kvC = new Float32Array(n); for (let i = 0; i < n; i++) GEOM.kvC[i] = LEN * npath(GEOM, nuC - (i + 0.5) / n * LEN)[3]; }
    // the contact: the whip's travel (0 the anticipation .. 1 full) at which the flukes' underside meets the water, by bisection on the posed mesh
    const G = MG(); if (G) { try {
      const P0 = { x: rH[0], y: 0, z: rH[1], yaw: 0, kv: new Float32Array(NM()), fin: 0.9, jaw: 0, swim: 0, spread: 1, fluke: TU.flukeC, flex: 0 };
      const low = pi => { slapShape(P0, pi); G.pose(P0); return G.flukeLow(); };
      let a = 0, b = 1.6, fb = low(b); if (fb.z > 0) { GEOM.piStar = b; GEOM.contact = fb; }
      else { for (let i = 0; i < 26; i++) { const m = (a + b) / 2; if (low(m).z > 0) a = m; else b = m; } GEOM.piStar = b; GEOM.contact = low(b); }
      GEOM.off = GEOM.contact.x;   // (the flukes' middle along the heading at the contact: the aim)
    } catch (e) { GEOM.off = rH[0] - 3.2; } } else GEOM.off = rH[0] - 3.2;
    // (v455 MD2) the framing: the performance's points above the water [a, height] (the body's top and the flukes, every 0.1 s from the
    // breach to the slap, on a 0.25-tile grid), so the heading can be chosen with all of it on the screen (choosePath)
    const tops = []; GEOM.tops = tops;
    if (G) { try { const seen = new Set(), Sx = { path: { O: { x: 0, y: 0 }, hx: 1, hy: 0, yaw: 0 }, O: { x: 0, y: 0 } }, put = (a, z) => { if (z < 0.3) return; const k = Math.round(a * 4) * 1000 + Math.round(z * 4); if (!seen.has(k)) { seen.add(k); tops.push([a, z]); } };
      for (let t = TU.breach; t <= TU.slap + 0.051; t += 0.1) { const P = poseAt(Sx, t); if (!P) continue; const A = G.pose(P); for (let i = 0; i < A.spine.length; i += 3) { const q = A.spine[i]; put(q.p[0], q.p[2] + q.r); } for (const q of A.flukes) put(q[0], q[2]); }
    } catch (e) {} }
    return GEOM;
  }
  /* the tail's share of a bend: a bump over the tail stock (s 0.64 .. 0.99), normalised to one radian in all */
  let WT = null; const wTail = () => { if (WT) return WT; const n = NM(); WT = new Float32Array(n); let sum = 0; for (let i = 0; i < n; i++) { const s = (i + 0.5) / n, w = sstep(0.62, 0.76, s) * (1 - sstep(0.95, 1.0, s)); WT[i] = w; sum += w / n; } for (let i = 0; i < n; i++) WT[i] /= sum; return WT; };
  /* the whip's shape at travel pi (0 .. 1+): the body pivots about its root (the tail coming down), the stock flexes from its lift to the
     slap's flexion (ventral: the flukes brought down on their underside) */
  function slapShape(P, pi) { const G = geom(), w = wTail(), Th = lerp(TUNE.raise, -TUNE.bend, pi); P.pitch = G.pH - 0.05 + TUNE.pivot * pi; for (let i = 0; i < w.length; i++) P.kv[i] = Th * w[i]; return P; }

  /* ---- the pose at time t (the whale's own frame: x along the heading from the local origin, z up); null before it is on its way ---- */
  const FINK = [[0, 0.15], [1.3, 0.25], [1.55, 0.6], [2.35, 0.95], [2.75, 0.9], [3.1, 0.4], [3.75, 0.55], [4.0, 0.95], [4.25, 0.8], [4.75, 0.25], [9, 0.2]];
  const JAWK = [[0, 0], [1.45, 0.02], [1.75, 0.22], [2.35, 0.16], [2.75, 0.04], [9, 0]];
  function keys(K, u) { if (u <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i], v = (u - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], v * v * (3 - 2 * v)); } return K[K.length - 1][1]; }
  /* the nose's path: the point, the direction (rad) and the curvature at sig */
  function npath(G, sg) { const th = TUNE.breachA;
    if (sg >= 0) { const ph = th - sg / G.R2; return [G.B[0] + G.R2 * (Math.sin(th) - Math.sin(ph)), G.B[1] - G.R2 * (Math.cos(th) - Math.cos(ph)), ph, -1 / G.R2]; }   // (v455 MD2: the arch over the surface)
    if (sg >= -TUNE.line) return [G.B[0] + G.D[0] * sg, G.B[1] + G.D[1] * sg, th, 0];
    if (sg >= G.sA) { const ph = th - (-TUNE.line - sg) / G.Rc; return [G.Cc[0] + G.Rc * Math.sin(ph), G.Cc[1] - G.Rc * Math.cos(ph), ph, 1 / G.Rc]; }
    return [G.Cc[0] + (sg - G.sA), G.Cc[1] - G.Rc, 0, 0]; }
  const sigAt = (G, t) => { const h = hermite(G.NKH, t); return [h[0], h[2]]; };   // (the nose's travel and speed)
  function rootAt(t) {   // [a, z, va, vz, pitch] of the root (local frame)
    const G = geom(), TU = TUNE, tS = TU.slap;
    if (t < TU.clear) { const sg = sigAt(G, t), q = npath(G, sg[0] - G.hd); return [q[0], q[1], Math.cos(q[2]) * sg[1], Math.sin(q[2]) * sg[1], q[2]]; }
    if (t <= TU.hold) { const h = hermite(G.K, t), sp = Math.hypot(h[2], h[3]); return [h[0], h[1], h[2], h[3], sp > 0.4 ? Math.atan2(h[3], h[2]) : G.pH]; }
    if (t <= tS + 0.1) return [G.rH[0], G.rH[1], 0, 0, null];
    // away: along the body's axis at the contact (the tail drawn under through the same opening), then levelling off and swimming away under the surface
    const pc = G.pH - 0.05 + TU.pivot * (G.piStar + 0.18), f = [Math.cos(pc), Math.sin(pc)], r0 = G.rH, t0 = tS + 0.1, t1 = tS + 0.1 + TU.sink, t2 = tS + TU.away;
    const r1 = [r0[0] + f[0] * 2.4, r0[1] + f[1] * 2.4], r2 = [r1[0] + 5.2, -2.9];
    const K = [[t0, r0[0], r0[1], f[0] * 1.6, f[1] * 1.6], [t1, r1[0], r1[1], f[0] * 5.5, f[1] * 5.5], [t2, r2[0], r2[1], 3.2, 0]];
    const h = hermite(K, t), sp = Math.hypot(h[2], h[3]); return [h[0], h[1], h[2], h[3], sp > 0.4 ? Math.atan2(h[3], h[2]) : pc];
  }
  /* the whip's travel at t: 0 through the anticipation, accelerating to the contact (piStar exactly at TUNE.slap), a follow-through into the water after it */
  function whipAt(t) { const G = geom(), TU = TUNE; if (t < TU.whip) return 0; if (t <= TU.slap) { const u = (t - TU.whip) / (TU.slap - TU.whip); return G.piStar * Math.pow(u, 2.1); } return G.piStar + 0.18 * sstep(TU.slap, TU.slap + 0.12, t); }
  function pitchAt(t) { const TU = TUNE, G = geom(), r = rootAt(t);
    if (t <= TU.hold) return r[4];
    const pv = G.pH - 0.05 * sstep(TU.hold, TU.whip - 0.04, t) + TU.pivot * whipAt(t);   // (the body cocks back a little for the anticipation, then pivots through the whip)
    if (t <= TU.slap + 0.1) return pv;
    return lerp(G.pH - 0.05 + TU.pivot * (G.piStar + 0.18), r[4], sstep(TU.slap + 0.1 + TU.sink * 0.8, TU.slap + 0.1 + TU.sink * 2.2, t)); }
  function poseAt(S, t) {
    const TU = TUNE, G = geom(), n = NM(), w = wTail(); if (t < TU.approach) return null;
    const r = rootAt(t), p = pitchAt(t), P = S.P || (S.P = { kv: new Float32Array(n) }), kv = P.kv;
    P.x = S.path.O.x + S.path.hx * r[0] - S.O.x; P.y = S.path.O.y + S.path.hy * r[0] - S.O.y; P.z = r[1]; P.yaw = S.path.yaw; P.pitch = p; P.roll = 0; P.side = 0; P.sway = 0;
    // (v455 MD2) the approach's own course: on the level, before it rises, the track may curve in over the water (path.psi); the body follows it (a sideways bend a segment)
    const ks = P.ks || (P.ks = new Float32Array(n)); ks.fill(0);
    if (S.path.psi && t < TU.clear) { const sgN = sigAt(G, t)[0], sgR = sgN - G.hd, ku = S.path.psi / TU.turnL;
      if (sgR < G.sA) { const q = planPt(G, S.path, sgR); P.x = q[0] - S.O.x; P.y = q[1] - S.O.y; P.yaw = q[2]; }
      for (let i = 0; i < n; i++) { const sg = sgN - (i + 0.5) / n * G.LEN; if (sg < G.sA && sg > G.sA - TU.turnL) ks[i] = KS * G.LEN * ku; } }
    // the spine: the path's curvature (the body following the head) and a lag on the pitch's turning (the tail carrying the momentum)
    const e = 0.03, ra = rootAt(t - e), rb = rootAt(t + e), sp = Math.hypot(r[2], r[3]), pa = pitchAt(t - e), pb = pitchAt(t + e);
    const kap = sp > 1 ? ((rb[2] - ra[2]) * r[3] - (rb[3] - ra[3]) * r[2]) / (2 * e) / (sp * sp * sp) : 0;   // (minus the path's signed curvature: k = LEN x curvature bends the spine along it)
    const free = (t >= TU.clear && t <= TU.hold) || t > TU.slap + 0.3, kpath = free ? Math.max(-TU.kmax, Math.min(TU.kmax, -kap * G.LEN * TU.follow)) : 0, dp = (pb - pa) / (2 * e), klag = free ? Math.max(-TU.kmax, Math.min(TU.kmax, TU.lag * dp)) : 0;   // (none through the anticipation and the whip: there the tail is keyed)
    // the tail stock: lifted for the anticipation, whipped through the slap, held until the flukes are under, then relaxed
    let Th = 0; if (t > TU.hold && t <= TU.whip) Th = TU.raise * sstep(TU.hold, TU.whip - 0.04, t); else if (t > TU.whip) { Th = lerp(TU.raise, -TU.bend, whipAt(t)); if (t > TU.slap + 0.1) Th *= 1 - sstep(TU.slap + 0.1 + TU.sink, TU.slap + 0.1 + TU.sink + 0.5, t); }
    if (t < TU.clear) { const sg = sigAt(G, t)[0]; for (let i = 0; i < n; i++) { const s = (i + 0.5) / n; kv[i] = G.LEN * npath(G, sg - s * G.LEN)[3]; } }   // (on the nose's path: the body where the nose has been)
    else { const ub = t < TU.clear + TU.arch ? 1 - sstep(TU.clear, TU.clear + TU.arch, t) : 0;   // (v455 MD2: easing out of the arch it came out of the water in)
      for (let i = 0; i < n; i++) { const s = (i + 0.5) / n; kv[i] = kpath * sstep(0.22, 0.45, s) * (1 - ub) + G.kvC[i] * ub + klag * w[i] * 0.35 + Th * w[i]; } }
    // the flukes: trailing the stock's swing (pitch and flex), flat at the contact; spread for the anticipation and the slap
    const tS = TU.slap; let fk, fx;
    if (t <= TU.hold) { fk = 0.12 * Math.sin(t * 6.2) - 0.25 * dp * 0.3; fx = 0.25 * Math.sin(t * 6.2 - 0.9) - 0.12 * dp; }
    else if (t <= TU.whip) { const u = sstep(TU.hold, TU.whip - 0.02, t); fk = lerp(0, TU.cock, u); fx = 0.15 * u; }
    else if (t <= tS) { const u = (t - TU.whip) / (tS - TU.whip); fk = lerp(TU.cock, TU.flukeC, sstep(0.25, 1, u)) + 0.35 * Math.sin(Math.PI * u) * (1 - u); fx = 0.45 * Math.sin(Math.PI * u) * (1 - u * 0.6); }
    else { const e2 = t - tS; fk = TU.flukeC - 0.25 * Math.sin(Math.min(1, e2 / 0.16) * Math.PI) * Math.exp(-e2 * 4) + 0.18 * Math.sin(e2 * 6) * sstep(0.5, 1.0, e2); fx = -0.3 * Math.sin(Math.min(1, e2 / 0.2) * Math.PI) * Math.exp(-e2 * 3) + 0.2 * Math.sin(e2 * 6 - 0.9) * sstep(0.5, 1.0, e2); }
    P.fluke = fk; P.flex = fx; P.spread = sstep(TU.hold, TU.whip, t) * (1 - sstep(tS + 0.2, tS + 0.6, t));
    // swimming: a travelling wave (the tail beating up and down) while it swims in and away under the water; still in the air
    P.swim = 0.32 * (1 - sstep(TU.breach - 0.35, TU.breach, t)) + 0.3 * sstep(tS + 0.5, tS + 1.0, t); P.swimF = t * 1.5;
    P.fin = keys(FINK, t); P.flap = 0.16 * Math.sin(t * 5.2) * sstep(TU.breach, TU.clear, t) * (1 - sstep(TU.reenter - 0.2, TU.reenter, t)); P.jaw = keys(JAWK, t); P.arch = 0; P.tail = 0;
    // the contact's exact shape at TUNE.slap (the solved travel)
    if (Math.abs(t - tS) < 1e-9) { slapShape(P, G.piStar); P.fluke = TU.flukeC; P.flex = 0; }
    return P;
  }

  /* ---- the heading: chosen so the approach, the breach, the arc, the tail-slap at the aim and the swim away lie on the water and in
     the camera's view (the game's own camera: its rectangle read from the screen), preferring a crossing of the screen (the side
     silhouette), then not over the pet ---- */
  function viewOf(H, me) { try { const Tz = H.X.Tz(), W = (typeof arc !== 'undefined' && arc.W) || 390, Hh = (typeof arc !== 'undefined' && arc.H) || 844; return { cx: me.x - (H.sx(me.x) - W / 2) / Tz, cy: me.y - (H.sy(me.y) - Hh / 2) / Tz, hw: W / 2 / Tz / TUNE.zoomOut, hh: Hh / 2 / Tz / TUNE.zoomOut }; } catch (e) { return { cx: me.x, cy: me.y, hw: 4.8, hh: 10 }; } }
  /* (v455 MD2) the approach's course in the floor's plane: straight along the heading where it rises (from sA, the bend's start, on), and
     before that, on the level, an arc turning by psi over the last TUNE.turnL tiles (a curve in from the side where the water is), straight
     beyond it. planPt: the world point [x, y, yaw] of the track at sig (< sA) for a path (its O, heading, psi) */
  const PSI = [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2], KS = -1;   // (KS: the model's sideways bend's sign against the track's turning)
  function planPt(G, path, sg) { const d = G.sA - sg, La = TUNE.turnL, ps = path.psi || 0, aA = G.Cc[0], hx = Math.cos(path.yaw), hy = Math.sin(path.yaw);
    let lx, ly, th; if (Math.abs(ps) < 1e-4) { lx = d; ly = 0; th = 0; } else { const k = ps / La, dd = Math.min(d, La); lx = Math.sin(k * dd) / k; ly = (1 - Math.cos(k * dd)) / k; th = k * dd; if (d > La) { lx += (d - La) * Math.cos(ps); ly += (d - La) * Math.sin(ps); } }
    const px = path.O.x + hx * aA, py = path.O.y + hy * aA; return [px - hx * lx + hy * ly, py - hy * lx - hx * ly, path.yaw + th]; }
  function choosePath(W, Tx, Ty, me, V) {
    const G = geom(), off = G.off, base = me.x <= Tx ? 0 : Math.PI, CZ = MG() ? MG().CZ : 0.9, tops = G.tops || [];
    const outV = (x, y) => (V ? Math.max(0, Math.abs(x - V.cx) - V.hw + 0.9) + Math.max(0, y < V.cy ? V.cy - y - V.hh * 0.7 : y - V.cy - V.hh * 0.62) : 0);   // (the HUD's strips and the buttons kept clear)
    const aB = G.B[0], aS = npath(G, G.NK[0][1])[0];
    let best = null;
    for (let j = 0; j < 24; j++) { const da = j * Math.PI / 12;
      const a = base + da, dx = Math.cos(a), dy = Math.sin(a), at = q => [Tx + dx * (q - off), Ty + dy * (q - off)];
      let s = 0, offv = 0;
      // (v455 MD2) the whole performance on the screen: every sampled point of the body above the water, drawn up the screen by its height
      for (const q of tops) { const p = at(q[0]); offv += outV(p[0], p[1] - q[1] * CZ); }
      offv = offv / Math.max(1, tops.length) * 14;
      const pB = at(aB), pE = at(0), pT = [Tx, Ty];
      offv += outV(pB[0] + Math.sign(pB[0] - (V ? V.cx : pB[0])) * 0.9, pB[1]) * 4 + outV(pE[0], pE[1]) * 2 + outV(pT[0], pT[1]) * 4;   // (the breach, the dive and the slap's own spots first)
      // the flight's own water: the breach, the re-entry and the slap on it; the approach under the surface over it and in view (its silhouette shows)
      for (const p of [pB, pE, pT]) if (!W.on(p[0], p[1])) s -= 30;
      // (v455 MD2) the approach may come in from another side (psi: its course turned about B, swinging onto the heading before the breach), wherever the water and the view have room for it
      let sa = -1e9, psi = 0; const O0 = { x: Tx - dx * off, y: Ty - dy * off }; for (const ps of PSI) { let v = -0.8 * Math.abs(ps); const pth = { O: O0, yaw: a, psi: ps };
        for (let sg = G.sA - 0.3; sg > G.NK[0][1] - G.LEN * 0.8; sg -= 0.6) { const q = planPt(G, pth, sg), x = q[0], y = q[1]; v += W.on(x, y) ? (outV(x, y) > 0 ? 0.3 : 0.9) : -0.6; }
        for (let sg = -0.3; sg > G.sA; sg -= 0.6) { const p = at(npath(G, sg)[0]); v += W.on(p[0], p[1]) ? (outV(p[0], p[1]) > 0 ? 0.3 : 1.2) : -0.6; }   // (its rise to the surface)
        if (v > sa) { sa = v; psi = ps; } }
      s += sa * 1.5;
      s -= offv * 10; s += Math.abs(dx) * 5;   // (a crossing of the screen shows the side silhouette)
      if (V) s -= 0.6 * Math.max(0, Math.hypot((pB[0] + pE[0]) / 2 - V.cx, (pB[1] + pE[1]) / 2 - V.cy) - 2.5);   // (the flight toward the middle of the view)
      // not over the pet: its distance from the breach-to-slap line
      const px = me.x - pB[0], py = me.y - pB[1], al = px * dx + py * dy, of = Math.abs(-px * dy + py * dx); if (al > -1 && al < -aB + 1 && of < 1.3) s -= 4; if (Math.hypot(me.x - pB[0], me.y - pB[1]) < 2.2) s -= 10;   // (and not breaching through it)
      if (V && V.dbg) V.dbg.push(   // (tests: each heading's score)
        [+a.toFixed(2), +s.toFixed(1), +offv.toFixed(2), +sa.toFixed(1), [pB, pE, pT].map(p => W.on(p[0], p[1]) ? 1 : 0).join('')]);
      if (!best || s > best.s) best = { s, a, dx, dy, psi };
    }
    const O = { x: Tx - best.dx * off, y: Ty - best.dy * off };   // (the local origin: the nose's re-entry point E)
    const at = q => ({ x: O.x + best.dx * q, y: O.y + best.dy * q });
    const P0 = { yaw: best.a, O, psi: best.psi }, s0 = planPt(G, P0, G.NK[0][1]);
    return { yaw: best.a, hx: best.dx, hy: best.dy, dx: best.dx, dy: best.dy, O, B: at(G.B[0]), E: at(0), T: { x: Tx, y: Ty }, S: { x: s0[0], y: s0[1] }, psi: best.psi, at };
  }

  U.mobydick = (C, H) => {
    const me = H.me, X = H.X, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, DK = C.base * (C.K || 1) * (1 + 0.08 * (ev - 1));
    const NR = TUNE.rings[tier - 1], g0 = H.g, TS = TUNE.slap;
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the game's cast pose, cut to it)
    X.banner('MOBY DICK', '', C.col, 1.4); if (X.sfx.hum) X.sfx.hum();
    // the aim on the floor (the aimed monster, else ahead): where the flukes strike
    let T = H.walk(C.tx, C.ty); if (!isFinite(T.x) || !isFinite(T.y)) T = { x: me.x, y: me.y };
    let W = waterMap(H, T.x, T.y, TUNE.waterR); if (!W.tiles.length) { T = { x: me.x, y: me.y }; W = waterMap(H, T.x, T.y, TUNE.waterR); }
    const GEO = geom(), path = choosePath(W, T.x, T.y, me, viewOf(H, me)), len = GEO.LEN;
    const S = { T, O: { x: T.x, y: T.y }, W, path, tier, ev, NR };
    const tR = k => TS + TUNE.ringDelay + k * TUNE.ringGap, tEnd = Math.max(tR(NR - 1) + TUNE.ringR / TUNE.ringV, TS + TUNE.away);
    const tRec = tEnd + TUNE.settle, LIFE = tRec + TUNE.drain + 0.05;
    const rec = { T: { x: T.x, y: T.y }, tier, ev, DK, rings: NR, hits: [], tR: Array.from({ length: NR }, (_, k) => tR(k)), impact: TS, slap: TS, life: LIFE, tiles: W.tiles.length, quads: W.quads.length,
      path: { yaw: path.yaw, psi: path.psi, B: path.B, E: path.E, S: path.S, O: path.O }, contact: GEO.contact ? { z: GEO.contact.z, piStar: GEO.piStar } : null, abort: null };
    LAST = rec;
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    const onWater = m => W.on(m.x, m.y) || W.on(m.x + m.r * 0.7, m.y) || W.on(m.x - m.r * 0.7, m.y) || W.on(m.x, m.y + m.r * 0.7) || W.on(m.x, m.y - m.r * 0.7);
    const knock = (m, ox, oy, f) => { if (m.boss || m.still || m.dead) return; const a = Math.atan2(m.y - oy, m.x - ox); m.kbx = (m.kbx || 0) + Math.cos(a) * f; m.kby = (m.kby || 0) + Math.sin(a) * f; };
    const inSlap = m => Math.hypot(m.x - T.x, m.y - T.y) <= TUNE.slamR + m.r;
    // the cosmetic pools (fixed sizes: nothing is allocated per frame)
    const ND = Math.max(10, Math.round(TUNE.drops * (lowFx() ? 0.4 : 1))), drops = []; for (let i = 0; i < ND; i++) drops.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.1, st: 0 });
    let dropN = 0;
    const drop = (x, y, z, vx, vy, vz, life, s, st) => { const d = drops[dropN++ % ND]; d.on = true; d.x = x; d.y = y; d.z = z; d.vx = vx; d.vy = vy; d.vz = vz; d.t = 0; d.life = life; d.s = s; d.st = st || 0; };
    const NS = Math.max(10, Math.round(TUNE.stars * (lowFx() ? 0.5 : 1))), stars = [];
    for (let i = 0; i < NS && W.tiles.length; i++) { const tl = W.tiles[Math.floor(R1(i * 3.7 + 1) * W.tiles.length)]; stars.push({ x: tl.x + (R1(i * 5.1) - 0.5), y: tl.y + (R1(i * 7.3) - 0.5), z: 0.08 + 0.5 * R1(i * 2.9) * R1(i * 1.3 + 4), s: 0.1 + 0.1 * R1(i * 9.7), ph: R1(i * 4.4) * TAU, d: 0 }); }
    for (const s of stars) s.d = Math.hypot(s.x - T.x, s.y - T.y);
    // the state
    let slapped = false, aborted = -1, anc = null, poseP = null, poseT = -1; const ringHit = Array.from({ length: NR }, () => new Set()), ringPrev = new Array(NR).fill(-1), slapHit = new Set();
    const ringR = (k, t) => (t < rec.tR[k] ? -1 : Math.min(TUNE.ringR, (t - rec.tR[k]) * TUNE.ringV));
    const waterFront = t => { const M = W.maxD + 1.3; if (aborted >= 0) { const a = cl((t - aborted) / 0.8); return M * (1 - easeI(a)) * Math.min(1, t / TUNE.spread); } if (t < TUNE.spread) return M * easeO(t / TUNE.spread); if (t > tRec) return M * (1 - easeI(cl((t - tRec) / TUNE.drain))); return M; };
    const waterA = t => (aborted >= 0 ? 1 - cl((t - aborted - 0.55) / 0.3) : 1 - 0.45 * sstep(tRec, LIFE - 0.05, t) - 0.55 * cl((t - (LIFE - 0.3)) / 0.25));
    const whaleA = t => (aborted >= 0 ? 1 - cl((t - aborted) / 0.5) : 1);
    const silA = t => whaleA(t) * sstep(TUNE.approach, TUNE.approach + 0.4, t) * (1 - sstep(TS + 0.9, TS + TUNE.away, t));   // (the silhouette: fades in as it comes, recedes and fades away)
    const P2 = (x, y) => [S.O.x + x, S.O.y + y];
    function slap(f) {
      slapped = true; let n = 0;
      for (const m of H.living()) { if (!valid(m) || slapHit.has(m) || !onWater(m) || !inSlap(m)) continue; slapHit.add(m); n++;
        X.hitMon(m, TUNE.slam * DK, C.dmgO(m.boss ? {} : { stun: TUNE.slamStun })); knock(m, T.x, T.y, TUNE.slamKb); rec.hits.push({ k: 'slam', t: f.t, id: H.mons.indexOf(m), boss: !!m.boss }); }
      rec.slamN = n;
      X.shake(TUNE.shake, 0.3); if (X.hitstop) X.hitstop(0.05); if (X.sfx.crash) X.sfx.crash(); if (X.sfx.splash) X.sfx.splash();
      if (H.g && TUNE.zoom > 1) { H.g.zoomP = TUNE.zoom * TUNE.zoomOut; H.g.zoomT = TUNE.zoomT; }
      // star-filled droplets thrown up in a broad fan from the flukes (cosmetic)
      const back = Math.atan2(-path.hy, -path.hx);
      for (let i = 0; i < Math.round(ND * 0.75); i++) { const q = R1(i * 1.7 + 3.3), a = back + (R1(i * 5.3) - 0.5) * 3.4, v = 1.6 + 3.4 * R1(i * 7.9), r0 = 0.3 + 1.1 * R1(i * 3.1);
        drop(T.x + Math.cos(a) * r0, T.y + Math.sin(a) * r0 * 0.8, 0.15, Math.cos(a) * v * 0.7, Math.sin(a) * v * 0.55, 4.5 + 5.5 * q, 0.75 + 0.55 * R1(i * 2.3), 0.07 + 0.1 * R1(i), R1(i * 8.8) < 0.45 ? 1 : 0); }
    }
    function abort(f) { if (aborted >= 0) return; aborted = f.t; rec.abort = f.t; f.life = Math.min(f.life, 1.0); }   // (life: the time left)
    const F = H.add({ key: 'mobydick', life: LIFE, x: T.x, y: T.y, entY: T.y, S, rec,
      update(dt, f) {
        const t = f.t;
        if (H.g !== g0 || Math.hypot(me.x - T.x, me.y - T.y) > 45) { f.life = 0; return; }   // (the stage changed under it)
        if (me.dead && aborted < 0) abort(f);
        // the hits: the slap once, then each ring's front swept over the monsters (each ring each monster once)
        if (aborted < 0) {
          if (!slapped && t >= TS) slap(f);
          for (let k = 0; k < NR; k++) { const r = ringR(k, t); if (r < 0 || ringPrev[k] >= TUNE.ringR) { ringPrev[k] = Math.max(ringPrev[k], r); continue; } const r0 = ringPrev[k] < 0 ? 0 : ringPrev[k];
            for (const m of H.living()) { if (!valid(m) || ringHit[k].has(m)) continue; const d = Math.hypot(m.x - T.x, m.y - T.y);
              if (d - m.r <= r && d + m.r >= r0 - TUNE.ringBand && d <= TUNE.ringR + m.r && onWater(m)) { ringHit[k].add(m); X.hitMon(m, TUNE.ring * DK, C.dmgO({})); knock(m, T.x, T.y, TUNE.ringKb); rec.hits.push({ k: 'ring' + k, t, id: H.mons.indexOf(m), boss: !!m.boss }); } }
            if (k === 0 && r > 0 && ringPrev[k] < 0) { if (X.sfx.whoosh) X.sfx.whoosh(); }
            ringPrev[k] = r; }
        }
        // the cosmetic motion (droplets) and the visual beats (sounds and shakes only: no damage)
        for (const d of drops) { if (!d.on) continue; d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vz -= 13 * dt; d.z += d.vz * dt; if (d.t >= d.life || d.z < -0.05) d.on = false; }
        if (aborted >= 0) return;
        if (!S._zo && t >= TUNE.breach - 0.35 && H.g && TUNE.zoomOut < 1) { S._zo = 1; if (!(H.g.zoomT > 0) || H.g.zoomP >= 1) { H.g.zoomP = TUNE.zoomOut; H.g.zoomT = TS - t; } }   // (pulled back a little for the flight)
        if (!S._br && t >= TUNE.breach) { S._br = 1; const B = path.B; for (let i = 0; i < Math.round(ND * 0.4); i++) { const a = R1(i * 2.1) * TAU, v = 1 + 2.2 * R1(i * 4.3); drop(B.x + Math.cos(a) * 0.7, B.y + Math.sin(a) * 0.5, 0.1, Math.cos(a) * v * 0.5, Math.sin(a) * v * 0.4, 4 + 5 * R1(i * 6.1), 0.8 + 0.4 * R1(i), 0.06 + 0.07 * R1(i * 9), R1(i * 3.3) < 0.3 ? 1 : 0); } X.shake(3, 0.25); if (X.sfx.whoosh) X.sfx.whoosh(); if (X.sfx.splash) X.sfx.splash(); }
        if (!S._re && t >= TUNE.reenter) { S._re = 1; const E = path.E; for (let i = 0; i < Math.round(ND * 0.3); i++) { const a = R1(i * 3.9) * TAU, v = 0.6 + 1.6 * R1(i * 2.7); drop(E.x + Math.cos(a) * 0.35, E.y + Math.sin(a) * 0.28, 0.1, Math.cos(a) * v * 0.45, Math.sin(a) * v * 0.35, 5 + 4 * R1(i * 5.1), 0.7 + 0.4 * R1(i), 0.06 + 0.06 * R1(i * 7), 0); } X.shake(2, 0.2); if (X.sfx.splash) X.sfx.splash(); }
        // sheets of water shed by the body as it rises through the surface: droplets breaking off them
        if (anc && t > TUNE.breach && t < TUNE.clear + 0.2) { const q = H.Q() * (lowFx() ? 0.5 : 1), want = dt * 40 * q; let k = Math.floor(want) + (R1(t * 91.7) < want % 1 ? 1 : 0);
          while (k-- > 0) { const sp = anc.spine[2 + Math.floor(R1(t * 37.1 + k) * (anc.spine.length - 3))]; if (sp.p[2] < 0.1 || sp.p[2] > 3) continue; const sd = R1(t * 13.3 + k * 1.9) < 0.5 ? 1 : -1, bx = sp.p[0] + sp.side[0] * sp.r * sd, by = sp.p[1] + sp.side[1] * sp.r * sd, P = P2(bx, by);
            drop(P[0], P[1], sp.p[2] * 0.8, sp.side[0] * sd * 1.2, sp.side[1] * sd * 0.9, 0.5 + R1(t * 7.7 + k) * 1.6, 0.6 + 0.4 * R1(k + t), 0.05 + 0.06 * R1(t * 3 + k), 0); } }
      },
      onEnd() { S.done = true; drops.length = 0; stars.length = 0; if (S.cv2) { S.cv2.width = S.cv2.height = 1; S.cv2 = null; } if (S.tmp2) { S.tmp2.width = S.tmp2.height = 1; S.tmp2 = null; } },
      drawFloor(c, f, Xs, Ys, Tz) { try { floorPass(c, f, Tz); } catch (e) { if (!S._ef) { S._ef = 1; try { console.warn('Moby Dick floor', e); } catch (e2) {} } } },
      drawSky(c, f) { try { whalePass(c, f); } catch (e) { if (!S._ew) { S._ew = 1; try { console.warn('Moby Dick whale', e); } catch (e2) {} } } },
      draw(c, f, Xs, Ys, Tz) { try { overPass(c, f, Tz); } catch (e) { if (!S._eo) { S._eo = 1; try { console.warn('Moby Dick fx', e); } catch (e2) {} } } } });

    /* ================= drawing ================= */
    const sx = H.sx, sy = H.sy, REF = 0.5;   // (REF: how far down the screen a point under the water is seen, per tile of depth: shortened by the water)
    /* the posed rig at t (posed once a frame, shared by the floor, the whale and the effects) */
    function posed(t) { if (poseT === t) return anc; poseT = t; const G = MG(); const P = poseAt(S, t); poseP = P; if (!G || !P || whaleA(t) <= 0.001 || t > TS + TUNE.away + 0.1) { anc = null; return null; } anc = G.pose(P); return anc; }
    const ringA = (k, t, r) => (r < 0 ? 0 : Math.min(1, (t - rec.tR[k]) / 0.1) * (1 - sstep(0.72 * TUNE.ringR, TUNE.ringR, r)));
    /* the crest's stretches round a ring: chords of N segments, those whose middle lies on the water; flags fade the ends next to a gap */
    function crest(r, back) { const n = Math.max(12, Math.min(96, Math.round(TAU * r / 0.5))), out = [];
      const onA = i => { const a = (i + 0.5) / n * TAU; return W.on(T.x + Math.cos(a) * r, T.y + Math.sin(a) * r); };
      for (let i = 0; i < n; i++) { const am = (i + 0.5) / n * TAU, sb = Math.sin(am) < 0; if (sb !== back || !onA(i)) continue; const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; out.push({ a0, a1, f: (onA((i + n - 1) % n) ? 0 : 1) | (onA((i + 1) % n) ? 0 : 2), L0: a0 * r, len: TAU * r / n }); }
      return out; }
    function crestQ(Q, k, r, a, back, Tz) {
      if (a < 0.02 || r < 0.6) return; const h = ((k === 0 ? 0.85 : 0.68) - 0.36 * r / TUNE.ringR) * a * (back ? 1 : 0.85), al = a * (back ? 0.95 : 0.8);   // (the slap's own ring the thickest)
      for (const s of crest(r, back)) { const x0 = T.x + Math.cos(s.a0) * r, y0 = T.y + Math.sin(s.a0) * r, x1 = T.x + Math.cos(s.a1) * r, y1 = T.y + Math.sin(s.a1) * r, X0 = sx(x0), Y0 = sy(y0), X1 = sx(x1), Y1 = sy(y1), hp = h * Tz;
        const cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2 - hp / 2, ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2;
        Q.quad(365, cx, cy, ux, uy, 0, hp / 2, '#FFFFFF', al, s.L0, s.f, s.len); Q.quad(366, cx, cy, ux, uy, 0, hp / 2, '#FFFFFF', al, s.L0, s.f, s.len); } }
    /* the submerged part of the body: its run of spine points under the surface, [s0, s1] (the crossings interpolated), with the
       screen points of its ends (seen through the water: REF of the depth) and its mean depth; null when nothing is under */
    function under(A) { const sp = A.spine, n = sp.length; let best = null, i0 = -1;
      const ok = i => sp[i].p[2] < 0 && W.on(S.O.x + sp[i].p[0], S.O.y + sp[i].p[1]);   // (under the surface, and over the water: never shown under a wall)
      for (let i = 0; i <= n; i++) { const u = i < n && ok(i); if (u && i0 < 0) i0 = i; if (!u && i0 >= 0) { if (!best || i - i0 > best[1] - best[0]) best = [i0, i]; i0 = -1; } }
      if (!best || best[1] - best[0] < 2) return null; const [a, b] = best, cut = (i, j, q) => { const z0 = sp[i].p[2], z1 = sp[j].p[2]; if ((z0 < 0) === (z1 < 0)) return { s: sp[q].s, p: sp[q].p.slice() }; const u = z0 / (z0 - z1 || 1); return { s: lerp(sp[i].s, sp[j].s, u), p: [lerp(sp[i].p[0], sp[j].p[0], u), lerp(sp[i].p[1], sp[j].p[1], u), 0] }; };   // (a run's end at the surface interpolated; at the water's edge, its last point)
      const lo = a > 0 ? cut(a - 1, a, a) : { s: 0, p: A.snout ? A.snout.slice() : sp[0].p.slice() }, hi = b < n ? cut(b - 1, b, b - 1) : null;
      let md = 0; for (let i = a; i < b; i++) md += -sp[i].p[2]; md /= Math.max(1, b - a);
      let hp; if (hi) hp = hi; else { const q = sp[n - 1].p, q2 = sp[n - 3].p; hp = { s: 1.25, p: [q[0] + (q[0] - q2[0]) * 1.25, q[1] + (q[1] - q2[1]) * 1.25, q[2] + (q[2] - q2[2]) * 1.25] }; }   // (the flukes past the last ring)
      return { s0: lo.s, s1: hp.s, p0: lo.p, p1: hp.p, md, full: a === 0 && !hi }; }
    const scrU = p => [sx(S.O.x + p[0]), sy(S.O.y + p[1]) + Math.max(0, -p[2]) * REF * X.Tz()];   // (a point under the water, seen through it)
    function floorPass(c, f, Tz) {
      const t = f.t, Rs = waterFront(t), wa = waterA(t); if (!(Rs > 0.05) || !(wa > 0.01)) return;
      const A = posed(t), F2 = gfx(); if (!F2) { floor2D(c, f, Tz, Rs, wa, A); return; }
      const Q = F2.begin(c, null), h2 = Tz / 2, rsq = Math.min(63.5, Rs), cm = '#00' + Math.round(cl(W.maxD / 16) * 255).toString(16).padStart(2, '0') + '00', cM = '#FF' + cm.slice(3);
      // the ocean: its midnight body (laid over the floor) and the shiny aqua surface's light (Shiny Aqua Illusion's layers), a quad a tile (or a 2 x 2 block)
      for (const q of W.quads) { if (q.d - q.sz > Rs + 1.2) continue; const X0 = sx(q.x), Y0 = sy(q.y), hh = h2 * q.sz, pk = q.m * 64 + rsq, col = q.sz > 1 ? cM : cm;
        Q.quad(360, X0, Y0, hh, 0, 0, hh, col, wa, q.x - T.x, q.y - T.y, pk); Q.quad(361, X0, Y0, hh, 0, 0, hh, col, wa, q.x - T.x, q.y - T.y, pk); }
      // the whale under the surface: its silhouette (a light proxy) from the submerged run of its spine, and the faint light inside it
      const sa = silA(t) * wa; let U0 = null;
      if (A && sa > 0.01) { let nw = 0; for (const sp of A.spine) if (W.on(S.O.x + sp.p[0], S.O.y + sp.p[1])) nw++; U0 = nw > 2 ? under(A) : null;
        // (v455 MD2) drawn in pieces along its spine when the body curves (its approach's course), each a window of the same silhouette, overlapping a little where they meet
        if (U0) { const sp = A.spine, at = q => { if (q <= U0.s0) return U0.p0; if (q >= U0.s1) return U0.p1; for (let i = 1; i < sp.length; i++) if (sp[i].s >= q) { const u = (q - sp[i - 1].s) / (sp[i].s - sp[i - 1].s); return [lerp(sp[i - 1].p[0], sp[i].p[0], u), lerp(sp[i - 1].p[1], sp[i].p[1], u), lerp(sp[i - 1].p[2], sp[i].p[2], u)]; } return U0.p1; };
          const np = path.psi && t < TUNE.clear ? 3 : 1, ov = 0.05, dep = cl(U0.md / 3.2), hw = len * 0.33 * Tz;
          for (let k = 0; k < np; k++) { const qa = lerp(U0.s0, U0.s1, k / np) - (k > 0 ? ov : 0), qb = lerp(U0.s0, U0.s1, (k + 1) / np) + (k < np - 1 ? ov : 0), a = scrU(at(qa)), b = scrU(at(qb)), ux = (a[0] - b[0]) / 2, uy = (a[1] - b[1]) / 2, ul = Math.hypot(ux, uy);
            if (ul < 1.5) continue; const vx = -uy / ul * hw, vy = ux / ul * hw, lo = Math.min(1, Math.max(0, qa) * 0.8), hi = Math.min(0.999, qb * 0.8), win = Math.round(lo * 999) + hi;
            Q.quad(362, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ux, uy, vx, vy, '#02081C', sa * (0.62 + 0.2 * (1 - dep)), dep, t * 2.2, win);
            Q.quad(363, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, ux, uy, vx, vy, '#5FC8FF', Math.min(1, sa * (0.75 + 0.35 * (1 - dep))), 1 - dep, t * 2.2, win); } } }
      // the wake: a V trailing the head while it swims near the surface (the approach, and the swim away), and the bulge where it breaks through
      if (A && aborted < 0) { const hd = A.snout, hz = hd[2], near = cl(1 - (-hz - 0.3) / 2.6), wkA = wa * near * (t < TUNE.breach + 0.2 ? sstep(TUNE.approach + 0.2, TUNE.approach + 0.7, t) * (1 - sstep(TUNE.breach, TUNE.breach + 0.25, t)) : sstep(TS + 0.6, TS + 1.0, t) * (1 - sstep(TS + 1.3, TS + TUNE.away, t)));
        if (wkA > 0.02 && hz < 0.2) { const Lw = 3.4 * Tz, hx = Math.cos(poseP.yaw), hy = Math.sin(poseP.yaw), X0 = sx(S.O.x + hd[0]) - hx * Lw, Y0 = sy(S.O.y + hd[1]) - hy * Lw;   // (v455 MD2: along its own course)
          Q.quad(394, X0, Y0, hx * Lw, hy * Lw, -hy * Lw * 0.55, hx * Lw * 0.55, '#7FE8FF', wkA, 0.6 + 0.4 * near, t * 1.0, 0); } }
      const tb = TUNE.breach, B = path.B, E = path.E;
      if (aborted < 0 && t > tb - 0.55 && t < tb + 0.75) { const X0 = sx(B.x + path.dx * 0.3), Y0 = sy(B.y + path.dy * 0.3), pre = t < tb, u = pre ? cl((t - tb + 0.55) / 0.55) : cl((t - tb) / 0.75), R = (pre ? 1.0 + 0.5 * u : 1.5 + 1.7 * easeO(u)) * Tz, a = pre ? u : 1 - u;
        Q.quad(367, X0, Y0, R, 0, 0, R, '#FFFFFF', a * wa, pre ? 0.3 + 0.25 * u : 0.42 + 0.48 * easeO(u), 2.7, pre ? 0 : 1); }
      // the waterline round the body where it passes through the surface: a collar of foam (the breach, the dive, the tail standing, the tail sliding under)
      if (A && aborted < 0 && t > tb && t < TS + TUNE.sink + 0.5) { const sp = A.spine; for (let i = 1; i < sp.length; i++) { const z0 = sp[i - 1].p[2], z1 = sp[i].p[2]; if ((z0 < 0) === (z1 < 0)) continue; const u = z0 / (z0 - z1), x = lerp(sp[i - 1].p[0], sp[i].p[0], u), y = lerp(sp[i - 1].p[1], sp[i].p[1], u), r = lerp(sp[i - 1].r, sp[i].r, u);
          Q.quad(367, sx(S.O.x + x), sy(S.O.y + y), (r * 1.6 + 0.3) * Tz, 0, 0, (r * 1.6 + 0.3) * Tz * 0.85, '#FFFFFF', 0.85 * wa, 0.55 + 0.08 * Math.sin(t * 9), 4.1 + i, 1); } }
      // the dive's focused splash where the nose re-enters, and the foam the slap leaves round the aim
      const tE = TUNE.reenter; if (aborted < 0 && t > tE && t < tE + 0.9) { const u = cl((t - tE) / 0.9); Q.quad(367, sx(E.x), sy(E.y), (0.8 + 1.4 * easeO(u)) * Tz, 0, 0, (0.8 + 1.4 * easeO(u)) * Tz, '#FFFFFF', (1 - u) * wa, 0.35 + 0.55 * easeO(u), 3.9, 1); }
      if (slapped && t < TS + 1.1) { const u = cl((t - TS) / 1.1), R = (TUNE.slamR + 0.4) * Tz; Q.quad(367, sx(T.x), sy(T.y), R, 0, 0, R * 0.92, '#FFFFFF', (1 - u) * wa, 0.25 + 0.65 * easeO(u), 5.1, 1); }
      // overlapping ripples (Shiny Aqua Illusion's ripple) spreading from where it broke the surface, re-entered and struck, and behind it as it goes
      if (aborted < 0) for (const [px, py, t0, n0] of [[B.x, B.y, tb, 2], [E.x, E.y, tE, 2], [T.x, T.y, TS + 0.25, 3]]) { for (let q = 0; q < n0; q++) { const tq = t - t0 - q * 0.38; if (tq <= 0 || tq > 2.2) continue; const u = tq / 2.2; Q.ripple(sx(px), sy(py), (0.6 + 4.2 * easeO(u)) * Tz, C_AQUA, 0.5 * (1 - u) * wa, q * 2.2 + px, 0.82, 0.09); } }
      // the rings: their band over each tile they cross, and the back half of each crest (behind the monsters)
      for (let k = 0; k < NR; k++) { const r = aborted >= 0 ? -1 : ringR(k, t), a = ringA(k, t, r); if (a < 0.02) continue;
        for (const tl of W.tiles) { if (Math.abs(tl.d - r) > 1.6) continue; Q.quad(364, sx(tl.x), sy(tl.y), h2, 0, 0, h2, '#FFFFFF', a * wa, tl.x - T.x, tl.y - T.y, tl.m * 64 + Math.min(63.5, r)); }
        crestQ(Q, k, r, a, true, Tz); }
      // the whale's light mirrored in the water while it flies
      if (A && t > tb && t < TS + 0.3) { const sp = A.spine; for (let i = 1; i < sp.length - 1; i += 3) { const p = sp[i].p; if (p[2] < 0.05 || !W.on(S.O.x + p[0], S.O.y + p[1])) continue; Q.glow(sx(S.O.x + p[0]), sy(S.O.y + p[1]), (sp[i].r * 2.2 + p[2] * 0.15) * Tz, '#5FB4FF', wa * 0.22 / (1 + p[2] * 0.25), 0.5); } }
      // a restrained field of stars in the water and just above it
      for (const s of stars) { if (s.d > Rs - 0.3) continue; const tw = 0.55 + 0.45 * Math.sin(t * 2.1 + s.ph), X0 = sx(s.x + Math.sin(t * 0.3 + s.ph) * 0.12), Y0 = sy(s.y) - (s.z + 0.04 * Math.sin(t * 1.1 + s.ph)) * Tz, a = wa * tw * cl((Rs - s.d) / 1.5);
        Q.glow(X0, Y0, s.s * 2.2 * Tz, '#8FD8FF', 0.22 * a); Q.star(X0, Y0, s.s * 1.3 * Tz, 0.6 * a, C_STAR); }
      // the feet in the water: a small ripple round each monster on it and round the pet
      let nr = 0; const feet = H.living(); feet.push(me);
      for (const m of feet) { if (nr >= 24 || (m === me && me.dead) || !W.on(m.x, m.y) || Math.hypot(m.x - T.x, m.y - T.y) > Rs) continue; const ph = (t * 0.9 + (m.x * 0.37 + m.y * 0.21)) % 1, rr = ((m.r || 0.4) + 0.25 + 0.55 * ph) * Tz; Q.ripple(sx(m.x), sy(m.y) + (m.r || 0.4) * 0.3 * Tz, rr, C_PALE, 0.32 * (1 - ph) * wa, ph * 3, 0.55, 0.1); nr++; }
      F2.flush(c);
    }
    /* the painted floor (no GPU painter): the water's tiles as one feathered picture made once (soft discs a tile, under a
       radial reveal for the front), a few glints, the silhouette under it, the rings as arcs over the water only */
    function floor2D(c, f, Tz, Rs, wa, A) {
      const t = f.t, n = W.n, PX = 8;
      if (!S.cv2) { const cv = document.createElement('canvas'); cv.width = cv.height = n * PX; const g = cv.getContext('2d');
        for (const tl of W.tiles) { const gx = (tl.i + 0.5) * PX, gy = (tl.j + 0.5) * PX, gr = g.createRadialGradient(gx, gy, 0, gx, gy, PX * 0.95); gr.addColorStop(0, 'rgba(4,12,38,0.86)'); gr.addColorStop(0.6, 'rgba(6,18,52,0.7)'); gr.addColorStop(1, 'rgba(6,18,52,0)'); g.fillStyle = gr; g.fillRect(gx - PX, gy - PX, PX * 2, PX * 2); }
        S.cv2 = cv; S.tmp2 = document.createElement('canvas'); S.tmp2.width = S.tmp2.height = n * PX; }
      const tp = S.tmp2, g = tp.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, tp.width, tp.height); g.drawImage(S.cv2, 0, 0);
      g.globalCompositeOperation = 'destination-in'; const cx = (T.x - W.x0) * PX, cy = (T.y - W.y0) * PX, rr = Math.max(1, Rs * PX), gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(Math.max(0, 1 - 1.2 / Math.max(1.3, Rs)), 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, tp.width, tp.height);
      c.save(); c.globalAlpha = wa; c.drawImage(tp, sx(W.x0), sy(W.y0), n * Tz, n * Tz);
      // the silhouette under the water
      const sa = silA(t) * wa; if (A && sa > 0.02) { const U0 = under(A); if (U0) { const a = scrU(U0.p0), b = scrU(U0.p1), l = Math.hypot(a[0] - b[0], a[1] - b[1]); if (l > 2) { c.save(); c.globalAlpha = 0.45 * sa; c.fillStyle = '#020818'; c.beginPath(); c.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, l / 2, len * 0.09 * Tz, Math.atan2(a[1] - b[1], a[0] - b[0]), 0, TAU); c.fill(); c.restore(); } } }
      c.globalCompositeOperation = 'lighter';
      if (typeof glowSprite === 'function') for (const s of stars) { if (s.d > Rs - 0.3) continue; const a = wa * (0.5 + 0.4 * Math.sin(t * 2.3 + s.ph)), r = s.s * 1.8 * Tz; c.globalAlpha = Math.max(0, a); blitSized(c, glowSprite('#AEE6FF'), sx(s.x) - r, sy(s.y) - s.z * Tz - r, r * 2, r * 2); }
      for (let k = 0; k < NR; k++) { const r = aborted >= 0 ? -1 : ringR(k, t), a = ringA(k, t, r); if (a < 0.02) continue;
        for (const back of [true, false]) for (const s2 of crest(r, back)) { c.globalAlpha = a * wa * 0.8; c.strokeStyle = 'rgba(150,235,255,0.9)'; c.lineWidth = Math.max(2, Tz * (k === 0 ? 0.34 : 0.28)); c.beginPath(); c.arc(sx(T.x), sy(T.y), r * Tz, s2.a0, s2.a1); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = Math.max(1, Tz * 0.08); c.stroke(); } }
      if (slapped && t < TS + 0.9) { const u = cl((t - TS) / 0.9); c.globalAlpha = (1 - u) * wa; c.strokeStyle = 'rgba(220,250,255,0.9)'; c.lineWidth = Math.max(2, Tz * 0.2); c.beginPath(); c.arc(sx(T.x), sy(T.y), (0.5 + TUNE.slamR * easeO(u)) * Tz, 0, TAU); c.stroke(); }
      c.restore();
    }
    /* the whale itself, on GLM or painted, cut at the waterline: drawn in the 'sky' pass (20b), over the stage's darkness and fog, as a luminous spirit (under the monsters' shots and rings, so their warnings stay on top) */
    function whalePass(c, f) {
      const t = f.t, G = MG(); if (!G) return; const A = posed(t); if (!A) return;
      // nothing above the water: nothing to draw (the silhouette carries it)
      let top = -1e9, sy0 = 0, n0 = 0; for (const sp of A.spine) { top = Math.max(top, sp.p[2] + sp.r); if (sp.p[2] > -0.2) { sy0 += sp.p[1]; n0++; } } for (const q of A.flukes) top = Math.max(top, q[2]); if (top < 0.02) return;
      const Tz = X.Tz(), al = whaleA(t), o = { X0: sx(S.O.x), Y0: sy(S.O.y), k: Tz, t: t + 3, clip: true, dis: aborted >= 0 ? cl((t - aborted) / 0.5) : 0, alpha: 1, glow: 0.45 + 0.55 * sstep(TUNE.breach, TUNE.breach + 0.4, t) + (slapped ? 0.5 * (1 - cl((t - TS) / 0.8)) : 0), glow2: slapped ? Math.max(0, 1 - (t - TS) / 0.16) * 0.8 : 0, seed: 1.3 };
      if (al < 0.999 && o.dis <= 0) o.alpha = al;
      f.entY = S.O.y + (n0 ? sy0 / n0 : poseP.y) + 0.4;
      if (!glOff() && G.usable() && G.draw(c, o)) return;
      G.draw2D(c, o);
    }
    /* over everything: the front of each crest, the sheets of water peeling off it as it breaches, the spray where it breaks and
       re-enters the surface, the slap's flash and fan of spray, the droplets */
    function overPass(c, f, Tz) {
      const t = f.t, F2 = gfx(), A = anc && poseT === t ? anc : posed(t);
      if (!F2) { over2D(c, f, Tz); return; }
      const Q = F2.begin(c, null), wa = waterA(t), tb = TUNE.breach;
      for (let k = 0; k < NR; k++) { const r = aborted >= 0 ? -1 : ringR(k, t), a = ringA(k, t, r); if (a < 0.02) continue; crestQ(Q, k, r, a * wa, false, Tz); }
      if (A && aborted < 0) {
        // the sheets of water peeling off its sides as it rises out of the sea (from each side of the body near the surface, down to it)
        if (t >= tb && t < TUNE.clear + 0.35) { const sa = sstep(tb, tb + 0.08, t) * (1 - cl((t - TUNE.clear + 0.1) / 0.45)) * 0.8, sp = A.spine;
          for (let i = 2; i < sp.length - 1; i += 2) { const p = sp[i].p; if (p[2] < 0.12 || p[2] > 2.4) continue; const k2 = 1 - p[2] / 2.4;
            for (const sd of [1, -1]) { const bx = S.O.x + p[0] + sp[i].side[0] * sp[i].r * 0.8 * sd, by = S.O.y + p[1] + sp[i].side[1] * sp[i].r * 0.8 * sd, bz = p[2] - sp[i].r * 0.3;
              Q.wstream(sx(bx), sy(by) - bz * 0.9 * Tz, sx(bx + sp[i].side[0] * 0.25 * sd), sy(by + sp[i].side[1] * 0.25 * sd), sp[i].r * 0.42 * Tz, '#3FA8F0', sa * k2, i * 0.7 + sd, 6, 0.7, 0.85); } } }
        // the spray where it breaks the surface, rising with it; the dive's focused splash: a narrow column and its spray
        if (t >= tb && t < tb + 0.8) { const B = path.B, u = cl((t - tb) / 0.8); Q.spray(sx(B.x + path.dx * 0.4), sy(B.y + path.dy * 0.4) - u * 0.9 * Tz, (1.3 + 1.6 * u) * Tz, C_PALE, (1 - u) * 0.75, 3.3, u, 0.8); }
        const tE = TUNE.reenter; if (t >= tE && t < tE + 0.7) { const E = path.E, u = cl((t - tE) / 0.7); Q.quad(395, sx(E.x), sy(E.y) - 1.1 * Tz * (0.4 + 0.6 * easeO(u)), 0.75 * Tz, 0, 0, 1.1 * Tz * (0.4 + 0.6 * easeO(u)), '#9FF0FF', (1 - u * u) * 0.85, u, 1.7, 0.2); Q.spray(sx(E.x), sy(E.y) - (0.3 + 0.8 * u) * Tz, (0.7 + 0.9 * u) * Tz, C_PALE, (1 - u) * 0.6, 6.1, u, 0.9); }
        // the tail stock standing: water running off the flukes (a few thin falls while they are raised)
        if (t > TUNE.hold - 0.2 && t < TS) { const fl = A.flukes, a2 = sstep(TUNE.hold - 0.2, TUNE.hold + 0.1, t) * 0.55; for (const q of fl) if (q[2] > 0.3) Q.wstream(sx(S.O.x + q[0]), sy(S.O.y + q[1]) - q[2] * 0.9 * Tz, sx(S.O.x + q[0]), sy(S.O.y + q[1]), 0.07 * Tz, '#3FA8F0', a2, q[0] * 3.1, 7, 0.6, 0.9); }
      }
      // the slap: a bright contact flash, a broad fan of aqua spray rising off the flukes, foam domes round it
      if (slapped) { const e = t - TS; if (e < 1.1) { const u = e / 1.1, Wf = (TUNE.slamR + 0.6) * Tz, Hf = (1.3 + 0.55 * easeO(Math.min(1, e / 0.35))) * Tz * (1 - 0.3 * u);
          Q.quad(395, sx(T.x), sy(T.y) - Hf, Wf, 0, 0, Hf, '#8FEFFF', (1 - u * u) * 0.95, u, 5.3, 1);
          for (let i = 0; i < 5; i++) { const a = Math.atan2(-path.hy, -path.hx) + (i - 2) * 0.62, rr = 1.3 + 0.6 * (i & 1); Q.spray(sx(T.x + Math.cos(a) * rr), sy(T.y + Math.sin(a) * rr * 0.85) - u * 0.8 * Tz, (0.8 + 1.1 * easeO(u)) * Tz, C_PALE, (1 - u) * 0.55, 1.1 + i, u, 0.7); }
          if (e < 0.14) { Q.glow(sx(T.x), sy(T.y) - 0.4 * Tz, (TUNE.slamR + 1.4) * Tz, '#DFF6FF', (1 - e / 0.14) * 0.5, 0.75); Q.glow(sx(T.x), sy(T.y) - 0.2 * Tz, 1.4 * Tz, '#FFFFFF', (1 - e / 0.14) * 0.8, 0.7); } } }
      // the droplets (some carrying a star)
      for (const d of drops) { if (!d.on) continue; const a = (1 - d.t / d.life) * 0.9, X0 = sx(d.x), Y0 = sy(d.y) - d.z * 0.9 * Tz; Q.glow(X0, Y0, d.s * 2.2 * Tz, '#7FD8FF', a * 0.5); Q.star(X0, Y0, d.s * (d.st ? 2.0 : 1.2) * Tz, a * (d.st ? 1 : 0.75), d.st ? C_STAR : '#FFFFFF'); }
      F2.flush(c);
    }
    function over2D(c, f, Tz) {
      if (typeof glowSprite !== 'function') return; const t = f.t; c.save(); c.globalCompositeOperation = 'lighter';
      for (const d of drops) { if (!d.on) continue; const r = d.s * 1.8 * Tz; c.globalAlpha = (1 - d.t / d.life) * 0.8; blitSized(c, glowSprite('#9FE4FF'), sx(d.x) - r, sy(d.y) - d.z * 0.9 * Tz - r, r * 2, r * 2); }
      if (slapped && t - TS < 0.6) { const u = (t - TS) / 0.6; c.globalAlpha = (1 - u) * 0.7; const r = (TUNE.slamR + 1) * Tz * (0.6 + 0.4 * u); blitSized(c, glowSprite('#CFF6FF'), sx(T.x) - r, sy(T.y) - r * 0.9, r * 2, r * 1.4); }
      c.restore();
    }
    return F;
  };
  U.mobydick.warm = () => { try { const G = MG(); if (G) G.warm(); if (!GEOMK) { const run = () => { try { geom(); } catch (e) {} }; if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 800 }); else setTimeout(run, 120); } } catch (e) {} };   // (v455 MD2: the path and the slap's contact solved in idle time too, not on the first cast)
  U.mobydick.TUNE = TUNE;
  U.mobydick.lib = { TUNE, waterMap, choosePath, poseAt, rootAt, pitchAt, whipAt, geom, regeom() { GEOMK = 0; return geom(); }, get last() { return LAST; } };
})();
