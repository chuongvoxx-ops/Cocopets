/* ---------- (v450 MD) Water's six-star summon Ultimate: Moby Dick ----------
   The battlefield becomes a dark, star-filled ocean and an enormous spirit whale (20k7q MOBY_GL) breaches from it, then crashes down
   in a body slam that launches tidal rings across the arena. After a short casting gesture (TUNE.gesture) the pet has its normal
   movement, dodge and attacks; the summon runs on its own timeline while the monsters, their attacks and every timer carry on.
   The sequence (seconds from the cast, all in TUNE):
     0 .. 0.85   starry midnight-blue water spreads over the arena's floor round the aim: only real floor (walkable, explored, in
                 sight of the aim and connected to it, within TUNE.waterR), feathered at the walls; stars float just above it, shallow
                 ripples cross it, the stars are mirrored in it; the monsters' and the pet's feet ripple it. Painted under the
                 monsters and under every warning, trap and pickup (the 'floor' pass, a hook in 20b), so enemy attack indicators stay
                 above the water. Visual only: no tile changes, collision and navigation untouched.
     0.2 .. 1.55 a huge whale-shaped shadow glides under the surface toward the aim, darkening and sharpening as it rises; the
                 water bulges over it.
     1.55        the water parts and Moby Dick breaches in a powerful arc (cut at the surface where it is still under it), shedding
                 sheets of glowing water and sparkling droplets; it rolls onto its side at the apex, hangs a moment, its fins and
                 tail following its weight, and falls.
     2.95        THE SLAM: one heavy Water hit on every monster under its body (a capsule along it) or within TUNE.slamR of the aim,
                 each once (its body, fins and tail share the one hit); a big splash, a short flash, a restrained shake and a small
                 zoom.
     3.03 + 0.45k  tidal ring k (1 at Base, 2 at Adept, 3 at Celestial) leaves the impact: a travelling wave front with a raised,
                 curling, foaming crest and glittering droplets, over the water only (it stops at the walls), each ring hitting
                 each monster once as its front passes (TUNE.ringR its reach).
     3.25 ..     the whale dissolves into a foaming silhouette and scattered stars; after the last ring has resolved the water
                 recedes from the edges in and the floor is as it was.
   Damage (DK = base x K x (1 + 0.08 (evo - 1)), the elemental Ultimates' scale): the slam TUNE.slam DK (the largest single hit),
   each ring TUNE.ring DK. Bosses take the damage but keep their crowd-control immunity (no stun, no shove). One authoritative
   timeline (the effect's own game clock), hits resolved by thresholds and by each ring's swept front: the same hits at any frame
   rate. Cooldown TUNE.cd (40 s, its row in 20k1), begun when the cast commits (the summons' convention: Titan's). Everything ends
   with the effect: on completion, the caster's defeat (no slam or ring after it: the whale dissolves and the water drains), the
   stage's end or exit (the effect goes with the game; the model's GPU buffers are freed by the stage's destroy hook in 20b).
   GPU first: the water, rings, crests, shadow, droplets, sheets, stars and the aura on the shared painter (20k6h FGFX kinds
   360..367, MD-FX), the whale on GLM; without WebGL a painted version of each (the whale from the same posed mesh). */
(() => {
  const U = ELEM_IMPL.water.ult, TAU = Math.PI * 2;
  const TUNE = {
    cd: 40,                    // (the cooldown, s: the row's cd in ELEM_MOVES.water; the game sets it when the cast commits)
    gesture: 0.45,             // the pet's casting gesture (s); full control after it
    spread: 0.85, shadow0: 0.2, breach: 1.55, impact: 2.95, hang: 0.6,   // the timeline (s); hang: how much the arc slows at its apex (0..0.9)
    ringDelay: 0.08, ringGap: 0.45, rings: [1, 2, 3],   // the rings: after the impact, between them, how many (Base, Adept, Celestial)
    ringV: 6.4, ringR: 8.0, ringBand: 0.9,               // a ring's speed (tiles/s), reach and the band behind its front that still counts as passing
    dissolve: [0.45, 1.95], recedeGap: 0.15, recede: 1.3, // the whale's dissolve (s after the impact); the water's receding
    waterR: 9.5, slamR: 3.0, bodyW: 1.3, breachBack: 3.8, approach: 4.0, apexZ: 3.4, restZ: 0.66,   // sizes (tiles)
    slam: 10, ring: 2.2,                                 // damage (x DK)
    slamStun: 0.5, slamKb: 3.2, ringKb: 1.2,             // (monsters only: bosses keep their immunity)
    shake: 9, zoom: 1.045, zoomT: 0.35, zoomOut: 0.9,   // (the camera: a restrained shake and a small punch at the slam; pulled back a little while it flies)
    drops: 64, stars: 44,                                // cosmetic pools (thinned by Fewer effects; never the hits)
  };
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const easeO = u => 1 - (1 - u) * (1 - u), easeI = u => u * u;
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const MG = () => (typeof MOBY_GL !== 'undefined' ? MOBY_GL : null);
  const gfx = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const glOff = () => { try { return typeof window !== 'undefined' && window.__MD_GL === 0; } catch (e) { return false; } };
  const C_DEEP = '#0A1E4A', C_AQUA = '#6FE6FF', C_PALE = '#CFF6FF', C_WHITE = '#FFFFFF', C_VIO = '#7A6CFF', C_STAR = '#E6F6FF';
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

  /* ---- the path: the whale's heading chosen so its slam footprint and its shadow's approach lie on the water and the whole flight
     (the breach, the apex, the body lying at the aim) stays in the camera's view (the camera is the game's own; the view's rectangle
     read from the screen), preferring a crossing of the screen (its side silhouette), then not lying over the pet ---- */
  const L = () => (MG() ? MG().DIMS.LEN : 6.6);
  function viewOf(H, me) { try { const Tz = H.X.Tz(), W = (typeof arc !== 'undefined' && arc.W) || 390, Hh = (typeof arc !== 'undefined' && arc.H) || 844; return { cx: me.x - (H.sx(me.x) - W / 2) / Tz, cy: me.y - (H.sy(me.y) - Hh / 2) / Tz, hw: W / 2 / Tz / TUNE.zoomOut, hh: Hh / 2 / Tz / TUNE.zoomOut }; } catch (e) { return { cx: me.x, cy: me.y, hw: 4.8, hh: 10 }; } }
  function choosePath(W, Tx, Ty, me, V) {
    const len = L(), head = len * 0.45, tail = len * 0.68, base = me.x <= Tx ? 0 : Math.PI;
    const outV = (x, y) => (V ? Math.max(0, Math.abs(x - V.cx) - V.hw + 0.4) + Math.max(0, Math.abs(y - V.cy) - V.hh + 0.6) : 0);
    let best = null;
    for (const da of [0, 0.35, -0.35, Math.PI, Math.PI + 0.35, Math.PI - 0.35, 0.7, -0.7, Math.PI + 0.7, Math.PI - 0.7, Math.PI / 2, -Math.PI / 2, 1.15, -1.15, Math.PI + 1.15, Math.PI - 1.15])
      for (const sh of [0, 0.8, -0.8, 1.6, -1.6, 2.4]) {   // (the body may land a little along its length from the aim: the aim stays under it, at least a tile inside its ends)
        const a = base + da, dx = Math.cos(a), dy = Math.sin(a), Rx = Tx + dx * sh, Ry = Ty + dy * sh; if (-sh > head - 1 || sh > tail - 1) continue;
        let s = 0, off = 0;
        for (let q = -tail; q <= head; q += 0.5) { const x = Rx + dx * q, y = Ry + dy * q; s += W.on(x, y) ? 2 : 0; off += outV(x, y); }
        for (let q = TUNE.breachBack; q <= TUNE.breachBack + TUNE.approach; q += 0.5) s += W.on(Rx - dx * q, Ry - dy * q) ? 1 : 0;
        // the flight: the breach point and the apex (its height drawn up the screen), the head's and the tail's reach there
        const Bx = Rx - dx * TUNE.breachBack, By = Ry - dy * TUNE.breachBack, Ax = (Bx + Rx) / 2, Ay = (By + Ry) / 2 - TUNE.apexZ * 0.9;
        off += outV(Bx, By) * 2 + outV(Ax + dx * head, Ay + dy * head - 0.6) * 2 + outV(Ax - dx * tail * 0.6, Ay - dy * tail * 0.6 + 1.2) * 2;
        s -= off * 3; s += Math.abs(dx) * 7 - Math.abs(sh) * 0.6;
        const px = me.x - Rx, py = me.y - Ry, al = px * dx + py * dy, of = Math.abs(-px * dy + py * dx); if (al > -tail - 0.5 && al < head + 0.5 && of < 1.4) s -= 2;
        if (!best || s > best.s) best = { s, a, dx, dy, R: { x: Rx, y: Ry }, sh };
      }
    const R = best.R, B = { x: R.x - best.dx * TUNE.breachBack, y: R.y - best.dy * TUNE.breachBack };
    let back = 1.5; for (let q = 1.5; q <= TUNE.approach; q += 0.5) { if (!W.on(B.x - best.dx * q, B.y - best.dy * q)) break; back = q; }
    return { yaw: best.a, dx: best.dx, dy: best.dy, R, shift: best.sh, B, S: { x: B.x - best.dx * back, y: B.y - best.dy * back } };
  }

  /* ---- the choreography: the whale's pose at time t (null before the breach) ---- */
  function keys(K, u) { if (u <= K[0][0]) return K[0][1]; for (let i = 1; i < K.length; i++) if (u <= K[i][0]) { const a = K[i - 1], b = K[i], v = (u - a[0]) / (b[0] - a[0]); return lerp(a[1], b[1], v * v * (3 - 2 * v)); } return K[K.length - 1][1]; }
  const PIT = [[0, 1.0], [0.3, 0.55], [0.5, 0.1], [0.7, -0.24], [0.88, -0.1], [1, 0]];
  const ARC = [[0, -0.9], [0.3, -0.55], [0.5, 0.35], [0.7, 0.6], [0.9, 0.35], [1, 0.1]];
  const TLK = [[0, -0.4], [0.25, -0.6], [0.5, 0.55], [0.75, 0.9], [0.95, 0.5], [1, 0.3]];
  const FLK = [[0, 0.6], [0.12, -0.55], [0.3, 0.15], [0.5, 0.35], [0.75, 0.55], [1, 0.4]];
  const FIN = [[0, 0.25], [0.3, 0.45], [0.5, 0.95], [0.75, 0.7], [1, 0.95]];
  const JAW = [[0, 0], [0.25, 0.08], [0.42, 0.24], [0.6, 0.2], [0.78, 0.02], [1, 0]];
  function poseAt(S, t) {
    const TB = TUNE.breach, TI = TUNE.impact; if (t < TB) return null;
    const rs = S.rollS, P = { yaw: S.path.yaw, swimF: t * 1.6, flap: 0 };
    if (t < TI) {
      const tau = (t - TB) / (TI - TB), u = tau + TUNE.hang * Math.sin(TAU * tau) / TAU, B = S.path.B;
      const z0 = -2.4, z1 = TUNE.restZ, zc = 2 * TUNE.apexZ - (z0 + z1) / 2;
      P.x = lerp(B.x, S.path.R.x, u) - S.O.x; P.y = lerp(B.y, S.path.R.y, u) - S.O.y; P.z = (1 - u) * (1 - u) * z0 + 2 * u * (1 - u) * zc + u * u * z1;
      P.pitch = keys(PIT, u); P.roll = rs * 1.2 * sstep(0.34, 0.64, u); P.arch = keys(ARC, u); P.tail = keys(TLK, u);
      P.fluke = keys(FLK, u) + 0.12 * Math.sin(t * 7); P.flex = 0.35 * Math.sin(t * 7 - 0.9) + 0.25 * (keys(FLK, Math.min(1, u + 0.06)) - keys(FLK, u)) * 6;
      P.swim = 0.55 * (1 - sstep(0.05, 0.3, u)); P.fin = keys(FIN, u); P.flap = 0.18 * Math.sin(t * 5.5) * sstep(0.45, 0.6, u); P.jaw = keys(JAW, u);
      P.u = u;
    } else {
      const e = t - TI, k = Math.exp(-e * 5);
      P.x = S.path.R.x - S.O.x; P.y = S.path.R.y - S.O.y; P.z = TUNE.restZ - 0.22 * Math.sin(Math.min(1, e / 0.28) * Math.PI) * (1 - sstep(0.28, 0.6, e)) + 0.05 * Math.sin(e * 3);
      P.pitch = 0.03 * Math.sin(e * 2.2); P.roll = rs * (1.2 + 0.1 * Math.sin(Math.min(1, e / 0.35) * Math.PI) * k);
      P.arch = 0.1 * k + 0.08 * Math.sin(e * 2.4); P.tail = 0.3 * Math.cos(Math.min(1, e / 0.22) * Math.PI) * Math.exp(-e * 3) - 0.08;   // (the tail slaps down a beat after the body)
      P.fluke = 0.4 * Math.cos(Math.min(1, e / 0.18) * Math.PI) * Math.exp(-e * 2.5); P.flex = 0.3 * Math.sin(e * 6) * k;
      P.swim = 0; P.fin = 0.95 - 0.35 * sstep(0, 0.6, e); P.flap = -0.35 * Math.sin(Math.min(1, e / 0.2) * Math.PI) * k; P.jaw = 0; P.u = 1;
    }
    return P;
  }

  U.mobydick = (C, H) => {
    const me = H.me, X = H.X, ev = Math.max(1, Math.min(7, Math.round(C.evo || 1))), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, DK = C.base * (C.K || 1) * (1 + 0.08 * (ev - 1));
    const NR = TUNE.rings[tier - 1], g0 = H.g;
    me.castT = me.castM = TUNE.gesture;   // (a short gesture: the game's cast pose, cut to it)
    X.banner('MOBY DICK', '', C.col, 1.4); if (X.sfx.hum) X.sfx.hum(); if (X.sfx.splash) X.sfx.splash();
    // the aim on the floor (the aimed monster, else ahead): the slam's centre
    let T = H.walk(C.tx, C.ty); if (!isFinite(T.x) || !isFinite(T.y)) T = { x: me.x, y: me.y };
    let W = waterMap(H, T.x, T.y, TUNE.waterR); if (!W.tiles.length) { T = { x: me.x, y: me.y }; W = waterMap(H, T.x, T.y, TUNE.waterR); }
    const path = choosePath(W, T.x, T.y, me, viewOf(H, me));
    const len = L(), hx = Math.cos(path.yaw), hy = Math.sin(path.yaw);
    const S = { T, O: { x: T.x, y: T.y }, W, path, rollS: hx >= 0 ? -1 : 1, tier, ev, NR };
    const tR = k => TUNE.impact + TUNE.ringDelay + k * TUNE.ringGap, tEnd = tR(NR - 1) + TUNE.ringR / TUNE.ringV;
    const tRec = tEnd + TUNE.recedeGap, LIFE = tRec + TUNE.recede + 0.05;
    const rec = { T: { x: T.x, y: T.y }, tier, ev, DK, rings: NR, hits: [], tR: Array.from({ length: NR }, (_, k) => tR(k)), impact: TUNE.impact, life: LIFE, tiles: W.tiles.length, quads: W.quads.length, path: { yaw: path.yaw, B: path.B, S: path.S, R: path.R, shift: path.shift }, abort: null };
    LAST = rec;
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    const onWater = m => W.on(m.x, m.y) || W.on(m.x + m.r * 0.7, m.y) || W.on(m.x - m.r * 0.7, m.y) || W.on(m.x, m.y + m.r * 0.7) || W.on(m.x, m.y - m.r * 0.7);
    const knock = (m, ox, oy, f) => { if (m.boss || m.still || m.dead) return; const a = Math.atan2(m.y - oy, m.x - ox); m.kbx = (m.kbx || 0) + Math.cos(a) * f; m.kby = (m.kby || 0) + Math.sin(a) * f; };
    // the slam's footprint: the body lying along the heading (head ahead of the aim, flukes behind) and the splash round the aim
    const LR = path.R, segA = { x: LR.x + hx * len * 0.45, y: LR.y + hy * len * 0.45 }, segB = { x: LR.x - hx * len * 0.68, y: LR.y - hy * len * 0.68 };
    const segD = (x, y) => { const vx = segB.x - segA.x, vy = segB.y - segA.y, l2 = vx * vx + vy * vy, u = cl(((x - segA.x) * vx + (y - segA.y) * vy) / l2); return Math.hypot(x - segA.x - vx * u, y - segA.y - vy * u); };
    const inSlam = m => Math.hypot(m.x - T.x, m.y - T.y) <= TUNE.slamR + m.r || segD(m.x, m.y) <= TUNE.bodyW + m.r;
    // the cosmetic pools (fixed sizes: nothing is allocated per frame)
    const ND = Math.max(8, Math.round(TUNE.drops * (lowFx() ? 0.4 : 1))), drops = []; for (let i = 0; i < ND; i++) drops.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.1 });
    let dropN = 0;
    const drop = (x, y, z, vx, vy, vz, life, s) => { const d = drops[dropN++ % ND]; d.on = true; d.x = x; d.y = y; d.z = z; d.vx = vx; d.vy = vy; d.vz = vz; d.t = 0; d.life = life; d.s = s; };
    const NS = Math.max(10, Math.round(TUNE.stars * (lowFx() ? 0.45 : 1))), stars = [];
    for (let i = 0; i < NS && W.tiles.length; i++) { const tl = W.tiles[Math.floor(R1(i * 3.7 + 1) * W.tiles.length)]; stars.push({ x: tl.x + (R1(i * 5.1) - 0.5), y: tl.y + (R1(i * 7.3) - 0.5), z: 0.15 + 0.55 * R1(i * 2.9), s: 0.12 + 0.14 * R1(i * 9.7), ph: R1(i * 4.4) * TAU, d: 0 }); }
    for (const s of stars) s.d = Math.hypot(s.x - T.x, s.y - T.y);
    const motes = []; for (let i = 0; i < 40; i++) motes.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.1 });   // (the dissolve's scattered stars)
    let moteN = 0;
    // the state
    let slammed = false, aborted = -1, anc = null, poseP = null; const ringHit = Array.from({ length: NR }, () => new Set()), ringPrev = new Array(NR).fill(-1), slamHit = new Set();
    const ringR = (k, t) => (t < rec.tR[k] ? -1 : Math.min(TUNE.ringR, (t - rec.tR[k]) * TUNE.ringV));
    const waterFront = t => { const M = W.maxD + 1.3; if (aborted >= 0) { const a = cl((t - aborted) / 0.8); return M * (1 - easeI(a)) * Math.min(1, t / TUNE.spread); } if (t < TUNE.spread) return M * easeO(t / TUNE.spread); if (t > tRec) return M * (1 - easeI(cl((t - tRec) / TUNE.recede))); return M; };
    const waterA = t => (aborted >= 0 ? 1 - cl((t - aborted - 0.55) / 0.3) : 1 - cl((t - (LIFE - 0.3)) / 0.25));
    const disOf = t => (aborted >= 0 ? cl((t - aborted) / 0.5) : sstep(TUNE.impact + TUNE.dissolve[0], TUNE.impact + TUNE.dissolve[1], t));
    function slam(f) {
      slammed = true; let n = 0;
      for (const m of H.living()) { if (!valid(m) || slamHit.has(m) || !onWater(m) || !inSlam(m)) continue; slamHit.add(m); n++;
        X.hitMon(m, TUNE.slam * DK, C.dmgO(m.boss ? {} : { stun: TUNE.slamStun })); knock(m, T.x, T.y, TUNE.slamKb); rec.hits.push({ k: 'slam', t: f.t, id: H.mons.indexOf(m), boss: !!m.boss }); }
      rec.slamN = n;
      X.shake(TUNE.shake, 0.35); if (X.hitstop) X.hitstop(0.05); if (X.sfx.crash) X.sfx.crash(); if (X.sfx.splash) X.sfx.splash();
      if (H.g && TUNE.zoom > 1) { H.g.zoomP = TUNE.zoom * TUNE.zoomOut; H.g.zoomT = TUNE.zoomT; }
      // the splash: droplets thrown up along the body and round the aim (cosmetic)
      for (let i = 0; i < Math.round(ND * 0.7); i++) { const q = R1(i * 1.7 + f.t), along = lerp(-0.68, 0.45, R1(i * 3.1)) * len, a = R1(i * 5.3) * TAU, v = 1.5 + 3 * R1(i * 7.9);
        drop(LR.x + hx * along + Math.cos(a) * 0.6, LR.y + hy * along + Math.sin(a) * 0.6, 0.2, Math.cos(a) * v * 0.6, Math.sin(a) * v * 0.6, 4 + 5 * q, 0.7 + 0.5 * R1(i * 2.3), 0.08 + 0.1 * R1(i)); }
    }
    function abort(f) { if (aborted >= 0) return; aborted = f.t; rec.abort = f.t; f.life = Math.min(f.life, 1.0); }
    const F = H.add({ key: 'mobydick', life: LIFE, x: T.x, y: T.y, entY: T.y, S, rec,
      update(dt, f) {
        const t = f.t;
        if (H.g !== g0 || Math.hypot(me.x - T.x, me.y - T.y) > 45) { f.life = 0; return; }   // (the stage changed under it)
        if (me.dead && aborted < 0) abort(f);
        // the hits: the slam once, then each ring's front swept over the monsters (each ring each monster once)
        if (aborted < 0) {
          if (!slammed && t >= TUNE.impact) slam(f);
          for (let k = 0; k < NR; k++) { const r = ringR(k, t); if (r < 0 || ringPrev[k] >= TUNE.ringR) { ringPrev[k] = Math.max(ringPrev[k], r); continue; } const r0 = ringPrev[k] < 0 ? 0 : ringPrev[k];
            for (const m of H.living()) { if (!valid(m) || ringHit[k].has(m)) continue; const d = Math.hypot(m.x - T.x, m.y - T.y);
              if (d - m.r <= r && d + m.r >= r0 - TUNE.ringBand && d <= TUNE.ringR + m.r && onWater(m)) { ringHit[k].add(m); X.hitMon(m, TUNE.ring * DK, C.dmgO({})); knock(m, T.x, T.y, TUNE.ringKb); rec.hits.push({ k: 'ring' + k, t, id: H.mons.indexOf(m), boss: !!m.boss }); } }
            if (k === 0 && r > 0 && ringPrev[k] < 0) { X.shake(2, 0.15); if (X.sfx.whoosh) X.sfx.whoosh(); }
            ringPrev[k] = r; }
        }
        // the cosmetic motion (droplets, the dissolve's stars) and their spawns
        for (const d of drops) { if (!d.on) continue; d.t += dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vz -= 13 * dt; d.z += d.vz * dt; if (d.t >= d.life || d.z < -0.05) d.on = false; }
        for (const s of motes) { if (!s.on) continue; s.t += dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vz *= Math.max(0, 1 - dt * 1.2); s.z += s.vz * dt; if (s.t >= s.life) s.on = false; }
        if (anc && t >= TUNE.breach && t < TUNE.impact && aborted < 0) {   // (droplets shed from the flukes and fins in flight, a trail of them)
          const q = H.Q() * (lowFx() ? 0.5 : 1), want = dt * 34 * q; let k = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0);
          const src = anc.flukes.concat(anc.fins); while (k-- > 0 && src.length) { const p = src[Math.floor(Math.random() * src.length)], a = Math.random() * TAU; drop(S.O.x + p[0], S.O.y + p[1], p[2], Math.cos(a) * 0.8, Math.sin(a) * 0.5, 0.5 + Math.random() * 1.5, 0.6 + Math.random() * 0.4, 0.05 + Math.random() * 0.07); } }
        if (anc && (t > TUNE.impact + TUNE.dissolve[0] || aborted >= 0) && disOf(t) < 0.95) {   // (stars scatter from the dissolving body)
          const want = dt * 26 * H.Q(); let k = Math.floor(want) + (Math.random() < want % 1 ? 1 : 0);
          while (k-- > 0) { const sp = anc.spine[Math.floor(Math.random() * anc.spine.length)], m = motes[moteN++ % motes.length], a = Math.random() * TAU; m.on = true; m.x = S.O.x + sp.p[0] + Math.cos(a) * sp.r * 0.7; m.y = S.O.y + sp.p[1] + Math.sin(a) * sp.r * 0.4; m.z = Math.max(0.1, sp.p[2]) + (Math.random() - 0.3) * sp.r; m.vx = Math.cos(a) * 0.5; m.vy = Math.sin(a) * 0.3; m.vz = 0.6 + Math.random() * 1.2; m.t = 0; m.life = 0.9 + Math.random() * 0.8; m.s = 0.1 + Math.random() * 0.12; } }
        if (!S._zo && t >= TUNE.breach - 0.35 && aborted < 0 && H.g && TUNE.zoomOut < 1) { S._zo = 1; if (!(H.g.zoomT > 0) || H.g.zoomP >= 1) { H.g.zoomP = TUNE.zoomOut; H.g.zoomT = TUNE.impact - t; } }   // (pulled back a little for the flight)
        // at the breach: a burst of droplets thrown up where it parts the water
        if (!S._br && t >= TUNE.breach && aborted < 0) { S._br = 1; const B = path.B; for (let i = 0; i < Math.round(ND * 0.5); i++) { const a = R1(i * 2.1) * TAU, v = 1 + 2.4 * R1(i * 4.3); drop(B.x + Math.cos(a) * 0.9, B.y + Math.sin(a) * 0.6, 0.1, Math.cos(a) * v * 0.5, Math.sin(a) * v * 0.4, 4 + 5 * R1(i * 6.1), 0.8 + 0.4 * R1(i), 0.07 + 0.08 * R1(i * 9)); } X.shake(3, 0.25); if (X.sfx.whoosh) X.sfx.whoosh(); }
      },
      onEnd() { S.done = true; drops.length = 0; motes.length = 0; stars.length = 0; if (S.cv2) { S.cv2.width = S.cv2.height = 1; S.cv2 = null; } if (S.tmp2) { S.tmp2.width = S.tmp2.height = 1; S.tmp2 = null; } },
      drawFloor(c, f, Xs, Ys, Tz) { try { floorPass(c, f, Tz); } catch (e) { if (!S._ef) { S._ef = 1; try { console.warn('Moby Dick floor', e); } catch (e2) {} } } },
      drawEnt(c, f) { try { whalePass(c, f); } catch (e) { if (!S._ew) { S._ew = 1; try { console.warn('Moby Dick whale', e); } catch (e2) {} } } },
      draw(c, f, Xs, Ys, Tz) { try { overPass(c, f, Tz); } catch (e) { if (!S._eo) { S._eo = 1; try { console.warn('Moby Dick fx', e); } catch (e2) {} } } } });

    /* ================= drawing ================= */
    const sx = H.sx, sy = H.sy;
    const ringA = (k, t, r) => (r < 0 ? 0 : Math.min(1, (t - rec.tR[k]) / 0.1) * (1 - sstep(0.72 * TUNE.ringR, TUNE.ringR, r)));
    /* the crest's stretches round a ring: chords of N segments, those whose middle lies on the water; flags fade the ends next to a gap */
    function crest(r, back) { const n = Math.max(12, Math.min(96, Math.round(TAU * r / 0.5))), out = [];
      const onA = i => { const a = (i + 0.5) / n * TAU; return W.on(T.x + Math.cos(a) * r, T.y + Math.sin(a) * r); };
      for (let i = 0; i < n; i++) { const am = (i + 0.5) / n * TAU, sb = Math.sin(am) < 0; if (sb !== back || !onA(i)) continue; const a0 = i / n * TAU, a1 = (i + 1) / n * TAU; out.push({ a0, a1, f: (onA((i + n - 1) % n) ? 0 : 1) | (onA((i + 1) % n) ? 0 : 2), L0: a0 * r, len: TAU * r / n }); }
      return out; }
    function crestQ(Q, k, r, a, back, Tz) {
      if (a < 0.02 || r < 0.6) return; const h = (0.62 - 0.3 * r / TUNE.ringR) * a * (back ? 1 : 0.85), al = a * (back ? 0.95 : 0.8);
      for (const s of crest(r, back)) { const x0 = T.x + Math.cos(s.a0) * r, y0 = T.y + Math.sin(s.a0) * r, x1 = T.x + Math.cos(s.a1) * r, y1 = T.y + Math.sin(s.a1) * r, X0 = sx(x0), Y0 = sy(y0), X1 = sx(x1), Y1 = sy(y1), hp = h * Tz;
        const cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2 - hp / 2, ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2;
        Q.quad(365, cx, cy, ux, uy, 0, hp / 2, '#FFFFFF', al, s.L0, s.f, s.len); Q.quad(366, cx, cy, ux, uy, 0, hp / 2, '#FFFFFF', al, s.L0, s.f, s.len); } }
    function floorPass(c, f, Tz) {
      const t = f.t, Rs = waterFront(t), wa = waterA(t); if (!(Rs > 0.05) || !(wa > 0.01)) return;
      const F2 = gfx(); if (!F2) { floor2D(c, f, Tz, Rs, wa); return; }
      const Q = F2.begin(c, null), h2 = Tz / 2, rsq = Math.min(63.5, Rs);
      // the ocean: its body (laid over the floor) and its light, a quad a tile (or a 2 x 2 block)
      for (const q of W.quads) { if (q.d - q.sz > Rs + 1.2) continue; const X0 = sx(q.x), Y0 = sy(q.y), hh = h2 * q.sz, pk = q.m * 64 + rsq, col = q.sz > 1 ? '#FF0000' : '#000000';
        Q.quad(360, X0, Y0, hh, 0, 0, hh, col, wa, q.x - T.x, q.y - T.y, pk); Q.quad(361, X0, Y0, hh, 0, 0, hh, col, wa, q.x - T.x, q.y - T.y, pk); }
      // the shadow gliding under the surface toward the breach, darker and sharper as it rises
      const t0 = TUNE.shadow0, tb = TUNE.breach;
      if (t > t0 && t < tb + 0.35 && aborted < 0) { const u = easeO(cl((t - t0) / (tb - t0))), px = lerp(path.S.x, path.B.x, u) + path.dx * len * 0.2, py = lerp(path.S.y, path.B.y, u) + path.dy * len * 0.2, a = cl((t - t0) / 0.35) * (1 - cl((t - tb) / 0.35)), dep = 1 - sstep(0.35, 1, (t - t0) / (tb - t0));
        const X0 = sx(px), Y0 = sy(py), hl = len * 0.6 * Tz, hw = len * 0.33 * Tz, c0 = Math.cos(path.yaw), s0 = Math.sin(path.yaw);
        Q.quad(362, X0, Y0, c0 * hl, s0 * hl, -s0 * hw, c0 * hw, '#02081C', a * (0.55 + 0.3 * (1 - dep)) * wa, dep, t * 2.2, 0);
        Q.quad(363, X0, Y0, c0 * hl, s0 * hl, -s0 * hw, c0 * hw, '#4FB8FF', a * (0.5 + 0.5 * (1 - dep)) * wa, 1 - dep, t * 2.2, 0); }
      // the water bulging over it, then parting as it breaches
      if (aborted < 0 && t > tb - 0.5 && t < tb + 0.7) { const B = path.B, X0 = sx(B.x + path.dx * 0.6), Y0 = sy(B.y + path.dy * 0.6), pre = t < tb, u = pre ? cl((t - tb + 0.5) / 0.5) : cl((t - tb) / 0.7), R = (pre ? 1.2 + 0.4 * u : 1.6 + 1.6 * easeO(u)) * Tz, a = pre ? u : 1 - u;
        Q.quad(367, X0, Y0, R, 0, 0, R, '#FFFFFF', a * wa, pre ? 0.3 + 0.25 * u : 0.45 + 0.45 * easeO(u), 2.7, pre ? 0 : 1); }
      // the slam's crater of foam spreading round the aim
      if (slammed && t < TUNE.impact + 0.9) { const u = cl((t - TUNE.impact) / 0.9), R = (TUNE.slamR + 0.3) * Tz; Q.quad(367, sx(T.x), sy(T.y), R, 0, 0, R, '#FFFFFF', (1 - u) * wa, 0.3 + 0.62 * easeO(u), 5.1, 1); }
      // the rings: their band over each tile they cross, and the back half of each crest (behind the monsters)
      for (let k = 0; k < NR; k++) { const r = aborted >= 0 ? -1 : ringR(k, t), a = ringA(k, t, r); if (a < 0.02) continue;
        for (const tl of W.tiles) { if (Math.abs(tl.d - r) > 1.6) continue; Q.quad(364, sx(tl.x), sy(tl.y), h2, 0, 0, h2, '#FFFFFF', a * wa, tl.x - T.x, tl.y - T.y, tl.m * 64 + Math.min(63.5, r)); }
        crestQ(Q, k, r, a, true, Tz); }
      // the whale's light mirrored under it while it flies, and the floating stars
      if (anc && poseP && t < TUNE.impact + 1.2) { const rz = Math.max(0, poseP.z), a = (t < TUNE.impact ? 1 : 1 - cl((t - TUNE.impact) / 1.2)) * wa * (0.5 / (1 + rz * 0.25));
        for (let i = 1; i < anc.spine.length - 1; i += 3) { const sp = anc.spine[i]; if (!W.on(S.O.x + sp.p[0], S.O.y + sp.p[1])) continue; Q.glow(sx(S.O.x + sp.p[0]), sy(S.O.y + sp.p[1]), (sp.r * 2.2 + rz * 0.15) * Tz, '#5FB4FF', a * 0.5, 0.5); } }
      for (const s of stars) { if (s.d > Rs - 0.3) continue; const tw = 0.6 + 0.4 * Math.sin(t * 2.3 + s.ph), X0 = sx(s.x + Math.sin(t * 0.3 + s.ph) * 0.15), Y0 = sy(s.y) - (s.z + 0.05 * Math.sin(t * 1.1 + s.ph)) * Tz, a = wa * tw * cl((Rs - s.d) / 1.5);
        Q.glow(X0, Y0, s.s * 2.6 * Tz, '#8FD8FF', 0.35 * a); Q.star(X0, Y0, s.s * 1.5 * Tz, 0.75 * a, C_STAR); Q.glow(X0, sy(s.y) + s.z * 0.4 * Tz, s.s * 1.6 * Tz, '#5FA8FF', 0.18 * a, 0.4); }
      // the feet in the water: a small ripple round each monster on it and round the pet
      let nr = 0; const feet = H.living(); feet.push(me);
      for (const m of feet) { if (nr >= 24 || (m === me && me.dead) || !W.on(m.x, m.y) || Math.hypot(m.x - T.x, m.y - T.y) > Rs) continue; const ph = (t * 0.9 + (m.x * 0.37 + m.y * 0.21)) % 1, rr = ((m.r || 0.4) + 0.25 + 0.55 * ph) * Tz; Q.ripple(sx(m.x), sy(m.y) + (m.r || 0.4) * 0.3 * Tz, rr, C_PALE, 0.32 * (1 - ph) * wa, ph * 3, 0.55, 0.1); nr++; }
      F2.flush(c);
    }
    /* the painted floor (no GPU painter): the water's tiles as one feathered picture made once (soft discs a tile, under a
       radial reveal for the front), a few glints, the rings as arcs over the water only */
    function floor2D(c, f, Tz, Rs, wa) {
      const t = f.t, n = W.n, PX = 8;
      if (!S.cv2) { const cv = document.createElement('canvas'); cv.width = cv.height = n * PX; const g = cv.getContext('2d');
        for (const tl of W.tiles) { const gx = (tl.i + 0.5) * PX, gy = (tl.j + 0.5) * PX, gr = g.createRadialGradient(gx, gy, 0, gx, gy, PX * 0.95); gr.addColorStop(0, 'rgba(4,12,38,0.86)'); gr.addColorStop(0.6, 'rgba(6,18,52,0.7)'); gr.addColorStop(1, 'rgba(6,18,52,0)'); g.fillStyle = gr; g.fillRect(gx - PX, gy - PX, PX * 2, PX * 2); }
        S.cv2 = cv; S.tmp2 = document.createElement('canvas'); S.tmp2.width = S.tmp2.height = n * PX; }
      const tp = S.tmp2, g = tp.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, tp.width, tp.height); g.drawImage(S.cv2, 0, 0);
      g.globalCompositeOperation = 'destination-in'; const cx = (T.x - W.x0) * PX, cy = (T.y - W.y0) * PX, rr = Math.max(1, Rs * PX), gr = g.createRadialGradient(cx, cy, 0, cx, cy, rr); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(Math.max(0, 1 - 1.2 / Math.max(1.3, Rs)), 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, tp.width, tp.height);
      c.save(); c.globalAlpha = wa; c.drawImage(tp, sx(W.x0), sy(W.y0), n * Tz, n * Tz);
      c.globalCompositeOperation = 'lighter';
      if (typeof glowSprite === 'function') for (const s of stars) { if (s.d > Rs - 0.3) continue; const a = wa * (0.5 + 0.4 * Math.sin(t * 2.3 + s.ph)), r = s.s * 1.8 * Tz; c.globalAlpha = Math.max(0, a); blitSized(c, glowSprite('#AEE6FF'), sx(s.x) - r, sy(s.y) - s.z * Tz - r, r * 2, r * 2); }
      for (let k = 0; k < NR; k++) { const r = aborted >= 0 ? -1 : ringR(k, t), a = ringA(k, t, r); if (a < 0.02) continue;
        for (const back of [true, false]) for (const s2 of crest(r, back)) { c.globalAlpha = a * wa * 0.8; c.strokeStyle = 'rgba(150,235,255,0.9)'; c.lineWidth = Math.max(2, Tz * 0.28); c.beginPath(); c.arc(sx(T.x), sy(T.y), r * Tz, s2.a0, s2.a1); c.stroke(); c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = Math.max(1, Tz * 0.08); c.stroke(); } }
      if (slammed && t < TUNE.impact + 0.9) { const u = cl((t - TUNE.impact) / 0.9); c.globalAlpha = (1 - u) * wa; c.strokeStyle = 'rgba(220,250,255,0.9)'; c.lineWidth = Math.max(2, Tz * 0.2); c.beginPath(); c.arc(sx(T.x), sy(T.y), (0.5 + TUNE.slamR * easeO(u)) * Tz, 0, TAU); c.stroke(); }
      if (aborted < 0 && t > TUNE.shadow0 && t < TUNE.breach + 0.3) { const u = easeO(cl((t - TUNE.shadow0) / (TUNE.breach - TUNE.shadow0))), px = lerp(path.S.x, path.B.x, u) + path.dx * len * 0.2, py = lerp(path.S.y, path.B.y, u) + path.dy * len * 0.2;
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.45 * wa * cl((t - TUNE.shadow0) / 0.35) * (1 - cl((t - TUNE.breach) / 0.3)); c.translate(sx(px), sy(py)); c.rotate(path.yaw); c.fillStyle = '#020818'; c.beginPath(); c.ellipse(0, 0, len * 0.42 * Tz, len * 0.085 * Tz, 0, 0, TAU); c.fill(); c.beginPath(); c.ellipse(-len * 0.5 * Tz, 0, len * 0.04 * Tz, len * 0.15 * Tz, 0, 0, TAU); c.fill(); }
      c.restore();
    }
    /* the whale itself (depth-sorted among the monsters: kind 12 in 20b), on GLM or painted */
    function whalePass(c, f) {
      const t = f.t, G = MG(); if (!G) return; const P = poseAt(S, t); poseP = P; if (!P) { anc = null; return; }
      const dis = disOf(t); if (dis >= 0.999) { anc = null; return; }
      anc = G.pose(P); const Tz = X.Tz(), o = { X0: sx(S.O.x), Y0: sy(S.O.y), k: Tz, t: t + 3, clip: true, dis, glow: 0.4 + 0.6 * sstep(TUNE.breach, TUNE.breach + 0.4, t) + (slammed ? 0.6 * (1 - cl((t - TUNE.impact) / 0.8)) : 0), glow2: slammed ? Math.max(0, 1 - (t - TUNE.impact) / 0.18) : 0, seed: 1.3 };
      f.entY = S.O.y + P.y + 0.3 + (P.z < 1.2 ? 0.4 : 0);
      if (!glOff() && G.usable() && G.draw(c, o)) return;
      G.draw2D(c, o);
    }
    /* over everything: the front of each crest, the sheets of water it sheds as it breaches, the droplets, its aura, the stars
       scattering from it, the slam's splash */
    function overPass(c, f, Tz) {
      const t = f.t, F2 = gfx(), wa = waterA(t);
      if (!F2) { over2D(c, f, Tz); return; }
      const Q = F2.begin(c, null); let any = false;
      for (let k = 0; k < NR; k++) { const r = aborted >= 0 ? -1 : ringR(k, t), a = ringA(k, t, r); if (a < 0.02) continue; crestQ(Q, k, r, a * wa, false, Tz); any = true; }
      if (anc && poseP) {
        // the aura: a soft glow along the body (bloom on its pale skin), brighter as it breaches and at the slam
        const dis = disOf(t), ga = (1 - dis) * (0.05 + 0.1 * (1 - cl((t - TUNE.impact) / 0.6)) * (slammed ? 1 : 0.3));   // (a faint halo: the skin's own fresnel edge carries the glow)
        for (let i = 1; i < anc.spine.length; i += 3) { const sp = anc.spine[i], z = Math.max(0, sp.p[2]); if (sp.p[2] < -0.3) continue; Q.glow(sx(S.O.x + sp.p[0]), sy(S.O.y + sp.p[1]) - z * 0.9 * Tz, sp.r * 3.4 * Tz, '#7FC4FF', ga); }
        // the sheets of glowing water pouring off it as it rises out of the sea
        const tb = TUNE.breach; if (t >= tb && t < tb + 0.9 && aborted < 0) { const sa = (1 - cl((t - tb) / 0.9)) * 0.85;
          for (let i = 2; i < anc.spine.length - 2; i += 2) { const sp = anc.spine[i], p = sp.p; if (p[2] < 0.15) continue; const bx = S.O.x + p[0] - sp.up[0] * sp.r * 0.6, by = S.O.y + p[1] - sp.up[1] * sp.r * 0.6, bz = Math.max(0.1, p[2] - sp.up[2] * sp.r * 0.8);
            Q.wstream(sx(bx), sy(by) - bz * 0.9 * Tz, sx(bx), sy(by), sp.r * 0.45 * Tz, '#3FA8F0', sa, i * 0.7, 6, 0.7, 0.8); } }
        // the spray where it parts the water, rising with it
        if (t >= tb && t < tb + 0.8 && aborted < 0) { const B = path.B, u = cl((t - tb) / 0.8); Q.spray(sx(B.x + path.dx * 0.6), sy(B.y + path.dy * 0.6) - u * 0.8 * Tz, (1.4 + 1.6 * u) * Tz, C_PALE, (1 - u) * 0.8, 3.3, u, 0.8); }
      }
      // the slam's splash: domes of spray along the body and round the aim, and a short flash
      if (slammed) { const e = t - TUNE.impact; if (e < 1.0) { const u = e / 1.0;
          for (let i = 0; i < 6; i++) { const along = lerp(-0.62, 0.42, (i >> 1) / 2) * len, sd = i & 1 ? 1 : -1, x = LR.x + hx * along - hy * sd * 1.1, y = LR.y + hy * along + hx * sd * 1.1; Q.spray(sx(x), sy(y) - u * 0.7 * Tz, (0.9 + 1.2 * easeO(u)) * Tz, C_PALE, (1 - u) * 0.6, 1.1 + i, u, 0.7); }   // (along both sides of the body, where it parts the water)
          if (e < 0.16) Q.glow(sx(T.x), sy(T.y) - 0.6 * Tz, (TUNE.slamR + 1.5) * Tz, '#DFF6FF', (1 - e / 0.16) * 0.42); } any = true; }
      // the droplets and the dissolve's stars
      for (const d of drops) { if (!d.on) continue; const a = (1 - d.t / d.life) * 0.9, X0 = sx(d.x), Y0 = sy(d.y) - d.z * 0.9 * Tz; Q.glow(X0, Y0, d.s * 2.2 * Tz, '#7FD8FF', a * 0.55); Q.star(X0, Y0, d.s * 1.3 * Tz, a * 0.8, '#FFFFFF'); any = true; }
      for (const s of motes) { if (!s.on) continue; const a = Math.sin(Math.min(1, s.t / s.life) * Math.PI), X0 = sx(s.x), Y0 = sy(s.y) - s.z * 0.9 * Tz; Q.glow(X0, Y0, s.s * 2.5 * Tz, '#BFE4FF', a * 0.45); Q.star(X0, Y0, s.s * 1.8 * Tz, a * 0.9, C_STAR); any = true; }
      void any; F2.flush(c);
    }
    function over2D(c, f, Tz) {
      if (typeof glowSprite !== 'function') return; const t = f.t; c.save(); c.globalCompositeOperation = 'lighter';
      for (const d of drops) { if (!d.on) continue; const r = d.s * 1.8 * Tz; c.globalAlpha = (1 - d.t / d.life) * 0.8; blitSized(c, glowSprite('#9FE4FF'), sx(d.x) - r, sy(d.y) - d.z * 0.9 * Tz - r, r * 2, r * 2); }
      for (const s of motes) { if (!s.on) continue; const r = s.s * 2 * Tz; c.globalAlpha = Math.sin(Math.min(1, s.t / s.life) * Math.PI) * 0.8; blitSized(c, glowSprite('#DFF2FF'), sx(s.x) - r, sy(s.y) - s.z * 0.9 * Tz - r, r * 2, r * 2); }
      if (slammed && t - TUNE.impact < 0.6) { const u = (t - TUNE.impact) / 0.6; c.globalAlpha = (1 - u) * 0.7; const r = (TUNE.slamR + 1) * Tz * (0.6 + 0.4 * u); blitSized(c, glowSprite('#CFF6FF'), sx(T.x) - r, sy(T.y) - r * 0.6, r * 2, r * 1.2); }
      c.restore();
    }
    return F;
  };
  U.mobydick.warm = () => { try { const G = MG(); if (G) G.warm(); } catch (e) {} };
  U.mobydick.TUNE = TUNE;
  U.mobydick.lib = { TUNE, waterMap, choosePath, poseAt, get last() { return LAST; } };
})();
