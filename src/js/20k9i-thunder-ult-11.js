/* ---------- Lightning, the 11th Ultimate: Beast Machine (the core: worker B1) ----------
   The pet tips a heap of bronze parts on the floor and dives into a puff of dusty smoke; hammers and wrenches flash
   through the cloud, bolts and gears fly, and the machine is seen going together through the gaps: one huge hand lands,
   the long dragon head swings into place, the shoulder shields snap shut, the cannon banks unfold, a loose panel rattles
   and locks; a last clunk, one spark, a final puff, and the pet hops into the open seat between the cannon banks. The
   eyes and crimson fittings light as a current runs along the cables. For 20 s (25 at Adept, 35 at Celestial; game time,
   from the moment it can move) the controls are the machine's (20b's VEH hook):
     - the stick / keys ride and steer it: a heavy bounding gait (hands and feet plant, the shoulders roll, the body
       settles at each step); walls and props block it (nothing is smashed);
     - contact: moving into a monster above TUNE.contactMin of top speed deals TUNE.contact x DK, once per pass, never
       sooner than TUNE.contactGate s per monster; standing against one deals nothing;
     - Dodge is Jump: a crouch, a high arc toward the stick (else the heading) to a landing planned before take-off (walls
       stop it in the air, it lands only where the whole machine fits and the pet could walk back from), one landing
       shockwave (TUNE.jump x DK) and a short recovery; the next jump only after landing (TUNE.jumpCd from the landing);
       the Dodge's short invulnerability at take-off only;
     - Strong 1 / 2 are Homing Missiles / Heaven's Wrath (worker B2's file, 20k9j, BEAST_MOVES; stubs here if absent);
     - the Ult button is the Judgement Day meter: it fills from the damage the form actually deals (ctx.hit: after
       mitigation, no overkill; Judgement's own hits never refill it); a press when full starts Judgement Day (20k9k),
       once per form; it commits, ignores the timer and ends with the machine popping and the pet ejected.
   Normal attacks are suppressed; the pet keeps its own HP and defences. Exit: timeout (a shudder and a small pop of
   smoke, bolts and sparks; the pet hops down), Judgement's end, the pet's defeat, a party swap, the floor's end. Every
   exit restores the controls (the kit itself is never touched) and starts the Ult's 120 s cooldown once, at the exit.
   Drawing: the machine is a rig of rigid parts. The big shells (torso with the seat, head, both shoulder shields, the
   hand and the foot) are sphere-traced signed-distance models baked per heading (NB buckets, lazily on a small budget
   and in idle time: U.beastmachine.warm), with weathered bronze, gold trim, dark steel joints, crimson jewels, worn
   edges and grime; the limbs, pistons and cannon barrels are baked strips drawn along their 3D bones (an orthographic
   view: a cylinder's outline is exact), joints are baked spheres, barrel mouths exact ellipses. Everything is depth
   sorted each frame round the seated pet, who is drawn upright with its own sprite (never turned or twisted). */
(() => {
  const U = ELEM_IMPL.thunder.ult;
  const TAU = Math.PI * 2;
  const GOLD = '#FFD266', EBLUE = '#3FC8FF', CYAN = '#5FE4FF', ICE = '#BFF2FF', VIOL = '#8A5CFF', CRIM = '#E0283F', WHITE = '#FFFFFF', DUST = '#CDBBA4';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const backOut = u => { const s = 2.2; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
  /* the camera (as Sports Car's): orthographic from 46 degrees up. A ground offset of one tile across is one tile on the
     screen, one toward the viewer GY, one tile of height ZK; the view direction (toward the camera) is (0, VY, VZ) */
  const GY = 0.72, ZK = 0.695, VY = 0.6945, VZ = 0.7195;
  const groundA = a => Math.atan2(Math.sin(a), GY * Math.cos(a));

  /* ================= the tuning (configurable) ================= */
  const TUNE = {
    dur: [20, 25, 35], cd: 120,                   // s of riding at evo 1-3 / 4-6 / 7 (from the moment it can move); the Ult's cooldown from the exit
    build: 1.85, out: 0.75,                       // s: the construction gag; the timeout pop
    judgeCap: 14, judgeWonCap: 10,                // s: a Judgement that never reports done is ended anyway (sooner on a won floor)
    top: 8, accel: 15, coast: 9, overK: 6,        // tiles/s, tiles/s2: a heavy bounding gait (the pet walks 4.3)
    steer: [2.6, 4.2], grip: 9, bumpK: 0.35, stride: 1.9,   // rad/s at rest .. at top speed; lateral grip; speed kept on a wall; tiles per gait cycle
    contact: 0.6, contactGate: 0.45, contactMin: 0.35, contactKb: 4,   // x DK per pass; s per monster; share of top speed; knockback (bosses: hitMon's rule)
    jump: 2.6, jumpR: 2.6, jumpKb: 6.5,           // x DK once per monster on landing; radius (tiles, + the monster's own x0.85); knockback
    jumpPh: [0.16, 0.75, 0.24], jumpH: 2.1,       // s crouch / air / recovery; peak height (tiles)
    jumpD: 4.4, jumpMax: 6.2, jumpExt: 1.6,       // tiles: a standing hop; longest (the speed along the hop adds 0.35 s of it); reach beyond for a landing
    jumpCd: 1.0, jumpBuf: 0.25, jumpInv: 0.3,     // s from the landing (the Dodge's cadence); a press this early is kept; invulnerability at take-off only
    chargeK: 30,                                  // the meter fills at chargeK x DK of damage actually dealt
    missileCd: 1.8, wrathCd: 2.0, mvHold: 1.0,    // defaults (B2's TUNE_S wins for missiles); Wrath's 2 s from its last strike; a press held while busy
  };
  const tierOf = ev => ev >= 7 ? 2 : ev >= 4 ? 1 : 0;
  /* the machine's footprint (ground units, as Sports Car's three circles along its axis) */
  const FP = { c: 0.72, e: 0.85, r: 0.5 }, BODY = { hl: 1.35, hw: 1.0 };

  /* ================= the model (worker B4: rebuilt on the user's concept art) =================
     A wide, low, four-legged war machine: a rounded body with the armoured beast head hanging low in front, two huge
     rusty-bronze shoulder domes (gold trim bands, a raised cluster of hex plates, a faceted crimson gem, a gold spike)
     each carrying a battery of three thick barrels on its housing, a red tufted seat with twin levers between them,
     massive segmented forearms planted far out on five-taloned hands, short rear legs tucked under. Every big piece is a
     signed-distance model, sphere-traced per heading into a sprite with physically based metal shading: a studio
     environment (soft box, horizon line, warm floor) reflected through Fresnel, a warm key light with soft self
     shadows, a cool electric rim light, ambient occlusion, and surface detail at full resolution (hex panel bevels,
     rivets, mottled rust, scratches, worn edges, grime and verdigris in the creases). The limbs, barrels, pistons and
     joints are traced the same way, side-on, and laid along their bones. */
  const VIS = 1.15;   // the machine is drawn this much larger than its rig's units (its collision is unchanged)
  const M_BRZ = 0, M_PLATE = 1, M_GOLD = 2, M_STEEL = 3, M_JEWEL = 4, M_LEATH = 5, M_CABLE = 6, M_EYE = 7, M_CLAW = 8, M_GLOW = 9, M_DARK = 10, M_DBRZ = 11;
  const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);   // (inlined: Math.hypot would box every result)
  const sph = (x, y, z, r) => Math.sqrt(x * x + y * y + z * z) - r;
  function ell(x, y, z, a, b, c) { const X = x / a, Y = y / b, Z = z / c, k0 = Math.sqrt(X * X + Y * Y + Z * Z); if (k0 < 1e-6) return -Math.min(a, b, c); const k1 = Math.sqrt(X * X / (a * a) + Y * Y / (b * b) + Z * Z / (c * c)); return k0 * (k0 - 1) / k1; }
  function cap(x, y, z, ax, ay, az, bx, by, bz, r1, r2) { const px = x - ax, py = y - ay, pz = z - az, dx = bx - ax, dy = by - ay, dz = bz - az; const h = cl((px * dx + py * dy + pz * dz) / (dx * dx + dy * dy + dz * dz)); return hyp3(px - dx * h, py - dy * h, pz - dz * h) - (r2 == null ? r1 : r1 + (r2 - r1) * h); }
  function rbox(x, y, z, bx, by, bz, r) { const qx = Math.abs(x) - bx + r, qy = Math.abs(y) - by + r, qz = Math.abs(z) - bz + r; return hyp3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - r; }
  const smin = (a, b, k) => { const h = cl(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };
  const torX = (x, y, z, R, r) => hyp(Math.hypot(y, z) - R, x) - r;   // a ring round the x axis
  /* the scene accumulators: Q[0] the shape's distance, SM the material of the nearest piece */
  const Q = new Float64Array(5); Q[0] = 1e9; Q[1] = 1e9; let SM = 0;   // (the scene's accumulators in one typed array: SD, SMd, HX, HY, ENVC; no boxed numbers)
  function add(d, m, k) { Q[0] = k ? smin(Q[0], d, k) : (d < Q[0] ? d : Q[0]); if (d < Q[1]) { Q[1] = d; SM = m; } }
  function carve(d, m) { if (-d > Q[0]) { Q[0] = -d; SM = m; Q[1] = -d; } }
  const far = (bd, k) => bd > Q[0] + (k || 0) + 0.02;   // a group whose bound is farther than what we have: skip it
  /* the hex grid (unit cells, pointy-topped): local offset in Q[2], Q[3]; returns the hex radius (0.5 on the edges) */
    const fm = (a, m) => a - Math.floor(a / m) * m;
  function hexCell(u, v) { const ax = fm(u, 1) - 0.5, ay = fm(v, 1.7320508) - 0.8660254, bx = fm(u - 0.5, 1) - 0.5, by = fm(v - 0.8660254, 1.7320508) - 0.8660254;
    if (ax * ax + ay * ay < bx * bx + by * by) { Q[2] = ax; Q[3] = ay; } else { Q[2] = bx; Q[3] = by; } const qx = Math.abs(Q[2]), qy = Math.abs(Q[3]); return Math.max(qx, qx * 0.5 + qy * 0.8660254); }
  /* a faceted gem: six slanted facets round a flat table, set along its normal N (G holds the frame, sx stretches it into a diamond) */
  const GN = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i / 6 * TAU), Math.sin(i / 6 * TAU)]);
  function mkGem(c, N, r, h, sx) { const n = Math.hypot(...N), Nn = N.map(v => v / n); let U = Math.abs(Nn[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]; const d0 = U[0] * Nn[0] + U[1] * Nn[1] + U[2] * Nn[2]; U = U.map((v, i) => v - Nn[i] * d0); const ul = Math.hypot(...U); U = U.map(v => v / ul);
    const W = [Nn[1] * U[2] - Nn[2] * U[1], Nn[2] * U[0] - Nn[0] * U[2], Nn[0] * U[1] - Nn[1] * U[0]]; return { c, N: Nn, U, W, r, h, sx: sx || 1 }; }
  function gem(G, x, y, z) { const px = x - G.c[0], py = y - G.c[1], pz = z - G.c[2], u = px * G.N[0] + py * G.N[1] + pz * G.N[2], a = (px * G.U[0] + py * G.U[1] + pz * G.U[2]) / G.sx, b = px * G.W[0] + py * G.W[1] + pz * G.W[2];
    let d = Math.max(u - G.h, -u - G.h * 0.4); for (let i = 0; i < 6; i++) { const g = GN[i], f = (a * g[0] + b * g[1]) * 0.8 + (u - G.h * 0.35) * 0.6 - G.r * 0.8; if (f > d) d = f; } return d * (G.sx > 1 ? 0.8 : 1); }
  /* a gem in a raised gold bezel */
  function gemSet(G, x, y, z) { const px = x - G.c[0], py = y - G.c[1], pz = z - G.c[2], u = px * G.N[0] + py * G.N[1] + pz * G.N[2], a = (px * G.U[0] + py * G.U[1] + pz * G.U[2]) / (G.sx * 1.05), b = px * G.W[0] + py * G.W[1] + pz * G.W[2];
    const rr = hyp(a, b) - G.r * 1.45; add(Math.max(rr, Math.abs(u + G.h * 0.1) - G.h * 0.55) * 0.9, M_GOLD); add(gem(G, x, y, z), M_JEWEL); }

  /* ---- the torso (origin: the rig's torso point; x forward, y to its right, z up) ---- */
  const SEAT = { x: -0.04, z: 0.5 };
  const TG = { front: mkGem([0.36, 0, 0.47], [0.55, 0, 0.84], 0.05, 0.03, 1.5), rear: mkGem([-0.98, 0, 0.0], [-1, 0, 0.2], 0.06, 0.035) };
  const TBACK = [-0.86, -0.5, -0.56, -0.24], TFLANK = [0.05, 0.42, 0.03, -0.34, 0.1, 0.042, -0.74, -0.3, 0.03];   // (the back and flank plates: x from, x to, lift)
  function sdTorso(x, y, z) {
    Q[0] = 1e9; Q[1] = 1e9; SM = M_BRZ; const ay = Math.abs(y);
    // the rounded body, the deep chest dropping toward the head, the haunches, the shoulder yokes reaching for the domes
    let bd = smin(ell(x + 0.02, y, z, 0.74, 0.58, 0.46), ell(x - 0.42, y, z + 0.12, 0.42, 0.54, 0.42), 0.14);
    bd = smin(bd, ell(x + 0.58, y, z + 0.06, 0.42, 0.5, 0.38), 0.12);
    bd = smin(bd, ell(x - 0.3, ay - 0.58, z - 0.22, 0.3, 0.32, 0.26), 0.12);
    add(bd, M_BRZ);
    if (bd < 0.12) {
      // armour plates that follow the body (proud of it, gold-edged): the chest plate over the head, the back lames, the flanks
      const chest = Math.max(x - 0.86, 0.22 - x, ay - 0.46, -0.02 - z);
      { const d = Math.max(bd - 0.057, chest); add(d, chest > -0.045 ? M_GOLD : M_PLATE); }
      for (let i = 0; i < 4; i += 2) { const x0 = TBACK[i], x1 = TBACK[i + 1], mk = Math.max(x - x1, x0 - x, ay - 0.44, 0.08 - z); add(Math.max(bd - 0.05 - (x0 < -0.6 ? 0.012 : 0), mk), x0 - x > -0.04 || x1 - x < 0.035 ? M_GOLD : M_PLATE); }
      for (let i = 0; i < 9; i += 3) { const x0 = TFLANK[i], x1 = TFLANK[i + 1], o = TFLANK[i + 2], mk = Math.max(x - x1, x0 - x, 0.3 - ay, z - 0.24, -0.2 - z); add(Math.max(bd - o - 0.02, mk), mk > -0.04 ? M_GOLD : M_PLATE); }
      // the dark steel belly frame
      add(ell(x + 0.02, y, z + 0.3, 0.6, 0.42, 0.2), M_STEEL, 0.05);
    }
    // the open rider's seat: a tufted crimson saddle and backrest in a gold frame on a gold plinth; twin levers with red tips
    if (!far(sph(x - SEAT.x + 0.04, y, z - SEAT.z - 0.12, 0.42))) {
      add(rbox(x - SEAT.x, y, z - SEAT.z + 0.06, 0.24, 0.27, 0.05, 0.03), M_GOLD);
      add(rbox(x - SEAT.x, y, z - SEAT.z, 0.17, 0.21, 0.055, 0.045), M_LEATH);
      add(rbox(x - SEAT.x + 0.19, y, z - SEAT.z - 0.16, 0.05, 0.2, 0.17, 0.045), M_LEATH);
      add(rbox(x - SEAT.x + 0.235, y, z - SEAT.z - 0.15, 0.03, 0.235, 0.215, 0.03), M_GOLD);
      add(cap(x, ay, z, SEAT.x + 0.15, 0.17, SEAT.z - 0.02, SEAT.x + 0.21, 0.17, SEAT.z + 0.17, 0.022), M_STEEL);
      add(sph(x - SEAT.x - 0.215, ay - 0.17, z - SEAT.z - 0.19, 0.04), M_JEWEL);
      add(rbox(x - SEAT.x - 0.18, ay - 0.17, z - SEAT.z + 0.0, 0.035, 0.035, 0.03, 0.01), M_GOLD);
    }
    // the gem on the gold crest in front of the seat; the rear gem
    if (!far(sph(x - 0.36, y, z - 0.47, 0.12))) gemSet(TG.front, x, y, z);
    if (!far(sph(x + 0.98, y, z, 0.12))) gemSet(TG.rear, x, y, z);
    // the neck (dark steel, gold collar) and the hip joints
    add(cap(x, y, z, 0.5, 0, -0.02, 0.72, 0, -0.1, 0.17), M_STEEL);
    add(torX(x - 0.62, y, z + 0.06, 0.17, 0.035), M_GOLD);
    add(sph(x + 0.48, ay - 0.42, z + 0.3, 0.15), M_STEEL);
    // under the body: ribbed violet cables looping to the arms and legs, steel pistons
    if (!far(sph(x, ay - 0.35, z + 0.36, 0.78))) {
      add(cap(x, ay, z, 0.42, 0.28, -0.3, 0.05, 0.42, -0.5, 0.05), M_CABLE); add(cap(x, ay, z, 0.05, 0.42, -0.5, -0.42, 0.36, -0.38, 0.05), M_CABLE);
      add(cap(x, ay, z, 0.25, 0.12, -0.38, -0.15, 0.16, -0.5, 0.04), M_CABLE); add(cap(x, ay, z, 0.3, 0.55, -0.1, 0.18, 0.62, -0.32, 0.045), M_CABLE);
      add(cap(x, ay, z, 0.36, 0.5, -0.28, 0.0, 0.5, -0.36, 0.055), M_STEEL); add(cap(x, ay, z, 0.0, 0.5, -0.36, -0.3, 0.48, -0.36, 0.03), M_CLAW); }
    return 0;
  }
  /* ---- the head (origin: the neck joint): a broad armoured skull, a heavy brow with a crimson diamond, recessed glowing
     eyes, gold horn crests sweeping back, a long banded snout, a steel jaw with teeth ---- */
  const HS = 1.12;
  const HG = { brow: mkGem([0.27, 0, 0.13], [0.55, 0, 0.84], 0.045, 0.03, 1.7) };
  function sdHead(x, y, z) {
    Q[0] = 1e9; Q[1] = 1e9; SM = M_BRZ; const ay = Math.abs(y);
    add(ell(x - 0.04, y, z - 0.02, 0.28, 0.27, 0.2), M_BRZ);
    // the snout: an angular wedge (a sloping top, converging flanks, bevelled ridges) in overlapping bands, a gold crest
    { const u = cl((x - 0.08) / 0.5), f = fm(u * 3.2 + 0.35, 1), st = 0.018 * f * (1 - 0.5 * u);
      const top = z - (0.12 - 0.36 * u) - st, side = (ay - (0.25 - 0.17 * u) - st) * 0.92, bot = -(z - (-0.2 - 0.06 * u)), ridge = (ay * 0.55 + z - (0.13 - 0.36 * u) - st) * 0.8;
      const d = Math.max(-smin(-top, -side, 0.04), bot, x - 0.62, 0.0 - x, ridge); add(d, M_PLATE, 0.05); }
    add(cap(x, y, z, 0.12, 0, 0.15, 0.55, 0, -0.06, 0.03, 0.012), M_GOLD);
    // gold trims along the snout's top edges; the brow: a heavy angular plate (gold rimmed) with the diamond
    add(cap(x, ay, z, 0.16, 0.2, 0.06, 0.54, 0.09, -0.15, 0.024, 0.012), M_GOLD);
    { const c = Math.cos(0.3), s = Math.sin(0.3), px = x - 0.17, pz = z - 0.11, rx = px * c - pz * s, rz = px * s + pz * c, d = rbox(rx, y, rz, 0.17, 0.25 - 0.1 * cl((x - 0.05) / 0.3), 0.05, 0.03); add(d, d > -0.014 && Math.abs(rz) < 0.035 ? M_GOLD : M_BRZ); }
    if (!far(sph(x - 0.27, y, z - 0.13, 0.1))) gemSet(HG.brow, x, y, z);
    carve(sph(x - 0.3, ay - 0.14, z + 0.0, 0.068), M_DARK); add(sph(x - 0.285, ay - 0.14, z + 0.005, 0.042), M_EYE);
    // the gold horn crests, sweeping back over the skull in two curves
    add(cap(x, ay, z, 0.2, 0.17, 0.08, -0.06, 0.27, 0.22, 0.06, 0.042), M_GOLD); add(cap(x, ay, z, -0.06, 0.27, 0.22, -0.4, 0.24, 0.36, 0.042, 0.007), M_GOLD);
    // cheek plates; the steel jaw; teeth; a crimson stud at the snout's tip
    add(ell(x - 0.06, ay - 0.22, z + 0.08, 0.17, 0.07, 0.11), M_PLATE);
    add(cap(x, y, z, 0.04, 0, -0.16, 0.5, 0, -0.28, 0.12, 0.06), M_STEEL, 0.03);
    if (!far(sph(x - 0.38, ay - 0.1, z + 0.26, 0.24))) for (let i = 0; i < 5; i++) { const tx = 0.18 + i * 0.075, ty = 0.15 - i * 0.022, tz = -0.18 - i * 0.025; add(cap(x, ay, z, tx, ty, tz, tx + 0.012, ty, tz - 0.085 + i * 0.008, 0.026, 0.004), M_CLAW); }
    add(sph(x - 0.58, ay - 0.06, z + 0.16, 0.032), M_JEWEL);
    return 0;
  }
  /* ---- a shoulder dome (origin: the dome's centre; side s, w = outward): a huge rusty dome on a gold band, a lower
     lame, a raised cluster of hex plates, a faceted gem in a gold bezel, a gold spike ---- */
  const SG = (() => { const o = {}; for (const s of [-1, 1]) o[s] = mkGem([0.36, 0.3, -0.02], [0.72, 0.6, 0.35], 0.07, 0.04, 1.5); return o; })();
  function sdShield(s) { return (x, y, z) => {
    Q[0] = 1e9; Q[1] = 1e9; SM = M_BRZ; const w = y * s;
    const dd = Math.max(ell(x, w - 0.04, z + 0.02, 0.5, 0.46, 0.46), -(z + 0.24));
    add(dd, M_BRZ);
    if (dd < 0.1) {
      // the gold band round its foot and a gold strap over its front
      add(Math.max(Math.abs(dd - 0.02) - 0.03, Math.abs(z + 0.17) - 0.07), M_GOLD);
      // the hex cluster: plates raised off the dome's top, seams between them
      const hu = (x - 0.1) / 0.12 + 0.5, hv = (w - 0.14) / 0.12, hr = hexCell(hu, hv), cr = hyp(x - 0.1, w - 0.14) - 0.23;
      if (cr < 0.06 && z > 0) { add(Math.max(dd - 0.05, (hr - 0.42) * 0.1, cr), M_PLATE); add(Math.max(Math.abs(dd - 0.02) - 0.022, Math.abs(cr + 0.005) - 0.028), M_GOLD); }
    }
    // the lower lame under the band, a little proud
    add(Math.max(ell(x, w - 0.07, z + 0.26, 0.49, 0.45, 0.18), -(z + 0.4), z + 0.17), M_PLATE);
    if (!far(sph(x - 0.36, w - 0.3, z + 0.02, 0.13))) gemSet(SG[s], x, w, z);
    add(cap(x, w, z, -0.08, 0.24, 0.32, -0.15, 0.32, 0.56, 0.07, 0.006), M_GOLD);
    add(sph(x, w + 0.06, z + 0.16, 0.24), M_STEEL);   // the shoulder joint under it
    return 0; }; }
  /* ---- a cannon battery's housing (origin: its trunnion; symmetric): a dark bronze block, a gold band, a gem, red vents ---- */
  const BG = mkGem([0.2, 0, 0.02], [1, 0, 0.15], 0.045, 0.03);
  function sdHousing(x, y, z) {
    Q[0] = 1e9; Q[1] = 1e9; SM = M_DBRZ; const ay = Math.abs(y);
    const d = rbox(x + 0.02, y, z + 0.03, 0.2, 0.37, 0.14, 0.06); add(d, M_DBRZ);
    add(Math.max(Math.abs(d - 0.012) - 0.02, Math.abs(x + 0.0) - 0.035), M_GOLD);
    add(Math.max(Math.abs(d - 0.01) - 0.016, Math.abs(z + 0.13) - 0.03), M_GOLD);
    // red vent slots on its sides
    if (ay > 0.26) carve(Math.max(Math.abs(fm(x + 0.2, 0.07) - 0.035) - 0.012, Math.abs(z + 0.04) - 0.055, Math.abs(x + 0.06) - 0.1, 0.33 - ay), M_GLOW);
    add(cap(x, ay, z, 0, 0.36, 0, 0, 0.42, 0, 0.075), M_STEEL); add(torX(ay - 0.39, x, z, 0.075, 0.018), M_GOLD);
    if (!far(sph(x - 0.2, y, z - 0.02, 0.1))) gemSet(BG, x, y, z);
    return 0;
  }
  /* ---- a hand (origin: the wrist; the talons rest on the floor 0.3 below): a gold cuff with a gem, a bronze back plate,
     a steel knuckle bar, five fanned fingers in bronze segments with steel knuckles and gold talons ---- */
  const FING = [-0.55, -0.18, 0.18, 0.55].map((a, i) => { const k = i === 1 || i === 2 ? 1.1 : 0.95; return { a, c: Math.cos(a), s: Math.sin(a), x0: 0.27 + 0.03 * Math.cos(a * 2), y0: 0.2 * Math.sin(a) / 0.55, k }; });
  const WG = mkGem([0.16, 0, 0.08], [0.3, 0, 1], 0.055, 0.035, 1.4);
  function sdHand(x, y, z) {
    Q[0] = 1e9; Q[1] = 1e9; SM = M_BRZ;
    add(torX(x - 0.01, y, z + 0.0, 0.2, 0.04), M_GOLD);
    // the back of the hand: a domed armour shell with a gold rim, the gem at its crown; the steel palm under it
    { const d = ell(x - 0.15, y, z + 0.03, 0.2, 0.25, 0.11); add(Math.max(d, -(z + 0.08)), Math.abs(d) < 0.02 && z < -0.03 ? M_GOLD : M_PLATE); }
    add(ell(x - 0.14, y, z + 0.1, 0.17, 0.21, 0.08), M_STEEL, 0.03);
    add(cap(x, y, z, 0.28, -0.2, -0.15, 0.28, 0.2, -0.15, 0.07), M_STEEL);
    if (!far(sph(x - 0.16, y, z - 0.08, 0.1))) gemSet(WG, x, y, z);
    if (!far(sph(x - 0.5, y, z + 0.2, 0.42))) for (let fi = 0; fi < 4; fi++) { const F = FING[fi];
      const px = x - F.x0, py = y - F.y0, fx = px * F.c + py * F.s, fy = -px * F.s + py * F.c, k = F.k; if (Math.abs(fy) > 0.12 || fx < -0.08 || fx > 0.53 * k) continue;
      const fz = z + 0.14 + 0.18 * fx;   // (each finger runs out and a little down)
      add(rbox(fx - 0.075 * k, fy, fz, 0.075 * k, 0.07 * k, 0.065 * k, 0.03), M_PLATE); add(rbox(fx - 0.21 * k, fy, fz + 0.005, 0.055 * k, 0.064 * k, 0.058 * k, 0.026), M_PLATE);
      add(hyp(fy, fz) - 0.045 * k + Math.max(0, Math.abs(fx - 0.15 * k) - 0.02), M_STEEL);
      add(cap(fx, fy, z, 0.25 * k, 0, -0.18, 0.38 * k, 0, -0.2, 0.068 * k, 0.045 * k), M_GOLD); add(cap(fx, fy, z, 0.38 * k, 0, -0.2, 0.47 * k, 0, -0.3, 0.045 * k, 0.005), M_GOLD); }
    return 0;
  }
  /* ---- a rear foot (origin: the ankle; the floor 0.16 below): a pad, three splayed toes with gold talons, a spur ---- */
  const TOE = [Math.cos(-0.55), Math.sin(-0.55), 1, 0, Math.cos(0.55), Math.sin(0.55)];
  function sdFoot(x, y, z) {
    Q[0] = 1e9; Q[1] = 1e9; SM = M_BRZ;
    add(ell(x - 0.06, y, z + 0.06, 0.2, 0.17, 0.09), M_PLATE); add(sph(x, y, z, 0.1), M_STEEL); add(torX(x - 0.0, y, z, 0.1, 0.03), M_GOLD);
    for (let i = 0; i < 3; i++) { const c = TOE[i * 2], s = TOE[i * 2 + 1]; add(cap(x, y, z, 0.1 * c, 0.1 * s, -0.08, 0.27 * c, 0.27 * s, -0.1, 0.05), M_PLATE, 0.02); add(sph(x - 0.27 * c, y - 0.27 * s, z + 0.1, 0.04), M_STEEL); add(cap(x, y, z, 0.27 * c, 0.27 * s, -0.1, 0.4 * c, 0.4 * s, -0.16, 0.038, 0.005), M_GOLD); }
    add(cap(x, y, z, -0.08, 0, -0.05, -0.22, 0, -0.14, 0.04, 0.006), M_GOLD);
    return 0;
  }
  const SS = 1.0, HK = 1.32;   // (the hands are drawn larger than modelled)
  const PARTS = {
    torso: { f: sdTorso, c: [-0.05, 0, 0.08], R: 1.22 },
    head: { f: (x, y, z) => { sdHead(x / HS, y / HS, z / HS); Q[0] *= HS; return 0; }, c: [0.2 * HS, 0, -0.04 * HS], R: 0.68 * HS },
    shieldL: { f: sdShield(-1), c: [0, -0.06, 0.04], R: 0.68 },
    shieldR: { f: sdShield(1), c: [0, 0.06, 0.04], R: 0.68 },
    housing: { f: sdHousing, c: [0, 0, 0], R: 0.5 },
    hand: { f: (x, y, z) => { sdHand(x / HK, y / HK, z / HK); Q[0] *= HK; return 0; }, c: [0.26 * HK, 0, -0.08 * HK], R: 0.62 * HK },
    foot: { f: sdFoot, c: [0.1, 0, -0.05], R: 0.44 },
  };
  /* the pieces laid along bones, traced side-on (x along the bone from 0 to L, y up on the sprite, z toward the viewer) */
  function sdFarm(x, y, z) {   // a massive segmented forearm: four overlapping bronze rings, thick gold bands, a gem, pistons
    Q[0] = 1e9; Q[1] = 1e9; SM = M_PLATE; const r = hyp(y, z);
    add(r - 0.13, M_STEEL); add(sph(x, y, z, 0.17), M_STEEL);
    for (let i = 0; i < 4; i++) { const x0 = 0.1 + i * 0.165, x1 = x0 + 0.2, ra = 0.245 + 0.025 * i, rb = ra + 0.045, u = cl((x - x0) / (x1 - x0)), d = Math.max((r - (ra + (rb - ra) * u)) * 0.98, x0 - x, x - x1);
      add(d, x1 - x < 0.045 ? M_GOLD : M_PLATE); }
    add(torX(x - 0.8, y, z, 0.3, 0.05), M_GOLD);
    if (!far(sph(x - 0.44, y - 0.31, z, 0.11))) { add(Math.max(hyp(x - 0.44, z) - 0.08, Math.abs(y - 0.31) - 0.03), M_GOLD); add(sph(x - 0.44, y - 0.31, z, 0.055), M_JEWEL); }
    add(cap(x, y, z, 0.02, -0.18, 0.06, 0.55, -0.24, 0.07, 0.035), M_CLAW); add(cap(x, y, z, 0.02, -0.18, 0.06, 0.3, -0.21, 0.07, 0.05), M_STEEL);
    return 0; }
  function sdUarm(x, y, z) { Q[0] = 1e9; Q[1] = 1e9; SM = M_BRZ; const r = hyp(y, z); add(r - 0.11, M_STEEL); add(ell(x - 0.32, y, z, 0.24, 0.16, 0.16), M_PLATE); add(torX(x - 0.1, y, z, 0.15, 0.03), M_GOLD); add(torX(x - 0.53, y, z, 0.14, 0.03), M_GOLD);
    for (let i = 0; i < 5; i++) add(torX(x - 0.06 - i * 0.1, y, z, 0.12, 0.02), M_STEEL); return 0; }
  function sdThigh(x, y, z) { Q[0] = 1e9; Q[1] = 1e9; SM = M_BRZ; add(ell(x - 0.2, y, z, 0.24, 0.17, 0.17), M_PLATE); add(torX(x - 0.36, y, z, 0.13, 0.03), M_GOLD); add(cap(x, y, z, 0, 0, 0, 0.42, 0, 0, 0.1), M_STEEL); return 0; }
  function sdShin(x, y, z) { Q[0] = 1e9; Q[1] = 1e9; SM = M_STEEL; add(cap(x, y, z, 0, 0, 0, 0.42, 0, 0, 0.08, 0.07), M_STEEL); add(ell(x - 0.18, y - 0.05, z, 0.2, 0.11, 0.12), M_PLATE); add(torX(x - 0.33, y, z, 0.09, 0.025), M_GOLD); add(sph(x, y, z, 0.11), M_STEEL); return 0; }
  function sdBarrel(x, y, z) {   // a thick dark-bronze barrel: a breech collar, gold bands, a heavy muzzle ring, a deep bore
    Q[0] = 1e9; Q[1] = 1e9; SM = M_DBRZ; const r = hyp(y, z);
    add(Math.max(r - 0.102 + 0.008 * cl((x - 0.2) / 0.5), -x, x - 0.78), M_DBRZ);
    add(Math.max(r - 0.132, x - 0.2, 0.02 - x), M_DBRZ);
    add(torX(x - 0.21, y, z, 0.104, 0.022), M_GOLD); add(torX(x - 0.45, y, z, 0.104, 0.022), M_GOLD);
    add(Math.max(r - 0.124, Math.abs(x - 0.72) - 0.06), M_DBRZ); add(torX(x - 0.66, y, z, 0.12, 0.018), M_GOLD);
    carve(Math.max(r - 0.066, 0.5 - x), M_DARK);
    return 0; }
  function sdJoint(x, y, z) { Q[0] = 1e9; Q[1] = 1e9; SM = M_STEEL; add(sph(x, y, z, 0.16), M_STEEL); add(torX(x * 0.94 + y * 0.34, y * 0.94 - x * 0.34, z, 0.155, 0.022), M_GOLD); return 0; }
  function sdRod(x, y, z) { Q[0] = 1e9; Q[1] = 1e9; SM = M_CLAW; add(Math.max(hyp(y, z) - 0.035, -x, x - 1), M_CLAW); return 0; }
  function sdSleeve(x, y, z) { Q[0] = 1e9; Q[1] = 1e9; SM = M_STEEL; const r = hyp(y, z); add(Math.max(r - 0.062, -x, x - 0.45), M_STEEL); add(torX(x - 0.42, y, z, 0.062, 0.016), M_GOLD); for (let i = 0; i < 4; i++) add(torX(x - 0.06 - i * 0.08, y, z, 0.063, 0.01), M_STEEL); return 0; }
  const SEGS = {
    farm: { f: sdFarm, L: 0.82, R: 0.37 }, uarm: { f: sdUarm, L: 0.62, R: 0.18 }, thigh: { f: sdThigh, L: 0.42, R: 0.19 }, shin: { f: sdShin, L: 0.42, R: 0.13 },
    barrel: { f: sdBarrel, L: 0.78, R: 0.15 }, joint: { f: sdJoint, L: 0, R: 0.18, ball: true }, rod: { f: sdRod, L: 1, R: 0.04 }, sleeve: { f: sdSleeve, L: 0.45, R: 0.08 },
  };
  let TKK = null;   // (the lightning kit, bound at the cast)
  const PART_ORDER = ['torso', 'hand', 'head', 'foot', 'housing', 'shieldL', 'shieldR'];

  /* ================= shading ================= */
  const hsh = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  const hsh3 = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return v - Math.floor(v); };
  function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = hsh(i, j), b = hsh(i + 1, j), c2 = hsh(i, j + 1), d = hsh(i + 1, j + 1), su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return lerp(lerp(a, b, su), lerp(c2, d, su), sv); }
  const n3 = (x, y, z) => (vnoise(x + z * 0.7, y - z * 0.3) + vnoise(y * 1.3 + 5, z * 1.3 - x * 0.4)) * 0.5;
  const nrm = v => { const l = hyp3(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  /* the world's lights: a warm key from the upper left and a little toward the camera, a soft box overhead for the
     reflections, a cool electric rim from behind on the right */
  const LW = nrm([-0.55, 0.22, 0.8]), SBW = nrm([-0.22, -0.42, 0.88]), RIMW = nrm([0.5, -0.78, 0.36]);
  const KEYC = [1.25, 1.12, 0.94], RIMC = [0.42, 0.8, 1.2], SKYC = [0.52, 0.56, 0.66], GNDC = [0.2, 0.13, 0.1];
  /* materials: albedo (diffuse), F0 (reflectance colour), roughness, metal */
  const MATS = [
    { a: [0.23, 0.105, 0.065], f: [0.58, 0.33, 0.23], r: 0.46, m: 1 },     // weathered copper-rust bronze
    { a: [0.26, 0.12, 0.07], f: [0.68, 0.4, 0.27], r: 0.36, m: 1 },     // plate bronze (smoother)
    { a: [0.5, 0.33, 0.08], f: [1.0, 0.76, 0.3], r: 0.2, m: 1 },        // worn gold
    { a: [0.12, 0.125, 0.14], f: [0.52, 0.54, 0.6], r: 0.26, m: 1 },   // gunmetal
    { a: [0.5, 0.02, 0.05], f: [0.09, 0.08, 0.08], r: 0.03, m: 0 },      // crimson gem
    { a: [0.42, 0.05, 0.06], f: [0.05, 0.04, 0.04], r: 0.5, m: 0 },      // crimson leather
    { a: [0.25, 0.1, 0.36], f: [0.06, 0.05, 0.08], r: 0.32, m: 0 },      // violet cable
    { a: [1, 0.3, 0.2], f: [0, 0, 0], r: 1, m: 0 },                       // eye (lit)
    { a: [0.2, 0.2, 0.22], f: [0.7, 0.72, 0.78], r: 0.16, m: 1 },        // bright steel (teeth, rods)
    { a: [1, 0.3, 0.1], f: [0, 0, 0], r: 1, m: 0 },                       // glowing vent
    { a: [0.015, 0.012, 0.012], f: [0.04, 0.04, 0.04], r: 0.5, m: 0 },   // a dark recess
    { a: [0.17, 0.075, 0.045], f: [0.62, 0.32, 0.2], r: 0.33, m: 1 },     // dark bronze (barrels, housings)
  ];
  const AX_X = [1, 0, 0], AX_Y = [0, 1, 0], AX_Z = [0, 0, 1];
  const tone = v => { v = Math.max(0, v); return v * (1 + v / 5.5) / (1 + v); };
  const OUT = [0, 0, 0];
  /* the environment seen along the reflected ray (local frame B): returns the warm part, writes the cool rim to Q[4] */
    function env(B, rx, ry, rz, rough) {
    const up = rx * B.UP[0] + ry * B.UP[1] + rz * B.UP[2];
    let e = up >= 0 ? 0.08 + 0.3 * Math.pow(up, 1.4) : 0.03 + 0.05 * (1 + up);
    const hz = (up - 0.1) / (0.035 + rough * 0.3); e += 0.45 * Math.exp(-hz * hz) / (1 + rough * 2);
    const w = 0.05 + rough * 0.32, sb = rx * B.SB[0] + ry * B.SB[1] + rz * B.SB[2]; if (sb > 1 - 3 * w) e += 3.4 * sstep(1 - 2.6 * w, 1 - 0.25 * w, sb) / (1 + rough * 2.5);
    const rr = rx * B.RIM[0] + ry * B.RIM[1] + rz * B.RIM[2]; Q[4] = rr > 0.5 - w ? 1.0 * sstep(0.62 - w * 1.5, 0.97 - w * 0.5, rr) / (1 + rough * 2) : 0;
    return e;
  }
  /* the shade of one surface point. B: the bake's frame (lights in the part's frame), hex: hex panels on its bronze */
  function shade(B, mat, x, y, z, nx, ny, nz, lap, ao, shd, hex, o) {
    const M = MATS[mat]; let rough = M.r, ar = M.a[0], ag = M.a[1], ab = M.a[2], fr = M.f[0], fg = M.f[1], fb = M.f[2], cav = 0, wearK = 0;
    if (mat === M_EYE || mat === M_GLOW) { const ndv = Math.max(0, nx * B.V[0] + ny * B.V[1] + nz * B.V[2]), k = 0.6 + 0.5 * ndv * ndv;
      if (mat === M_EYE) { o[0] = tone(2.2 * k); o[1] = tone(0.45 + 1.1 * ndv * ndv * ndv); o[2] = tone(0.25 + 0.6 * ndv * ndv * ndv); } else { o[0] = tone(1.5 * k); o[1] = tone(0.3 * k); o[2] = tone(0.12 * k); } return; }
    if (mat === M_DARK) { o[0] = 0.03; o[1] = 0.025; o[2] = 0.03; return; }
    const bronze = mat === M_BRZ || mat === M_PLATE || mat === M_DBRZ;
    if (bronze || mat === M_GOLD || mat === M_STEEL) {
      // dents (normal detail; the silhouette stays geometry)
      const q = 11, dk = mat === M_GOLD ? 0.05 : 0.1; nx += (vnoise(y * q, z * q) - 0.5) * dk; ny += (vnoise(z * q + 3, x * q) - 0.5) * dk; nz += (vnoise(x * q, y * q + 7) - 0.5) * dk;
    }
    if (bronze) {
      // mottled rust: blotches of redder oxide and darker scale, the rough patches duller
      const wn = n3(x * 6 + 3, y * 6, z * 6), wn2 = vnoise(x * 23 + y * 7, z * 23 - y * 5);
      const k = 0.55 + 0.85 * wn * (0.8 + 0.4 * wn2); ar *= k; ag *= k * (0.92 + 0.12 * wn); ab *= k * 0.9; fr *= 0.85 + 0.25 * wn; fg *= 0.8 + 0.3 * wn; fb *= 0.8 + 0.25 * wn;
      rough = Math.min(0.75, rough * (0.75 + 0.7 * (1 - wn)) + 0.08 * wn2);
      const pit = vnoise(x * 70 + z * 31, y * 70 - z * 23); if (pit > 0.78) { cav += (pit - 0.78) * 2.2; rough = Math.min(0.8, rough + 0.2); }
      if (wn < 0.44) { const v = Math.min(1, (0.44 - wn) * 2.4); ar = lerp(ar, 0.33, v * 0.5); ag = lerp(ag, 0.12, v * 0.5); ab = lerp(ab, 0.06, v * 0.5); fr *= 1 - v * 0.45; fg *= 1 - v * 0.55; fb *= 1 - v * 0.55; rough = lerp(rough, 0.7, v); }
      // hex panels (projected along the most facing axis): bevelled edges, dark seams, an inner step, rivets at the corners
      if (hex === 1 && (mat === M_BRZ || mat === M_PLATE)) { const anx = Math.abs(nx), any = Math.abs(ny), anz = Math.abs(nz), S0 = 0.12; let u, v, t1, t2;
        if (anz >= anx && anz >= any) { u = x / S0; v = y / S0; t1 = AX_X; t2 = AX_Y; } else if (any >= anx) { u = x / S0; v = z / S0; t1 = AX_X; t2 = AX_Z; } else { u = y / S0; v = z / S0; t1 = AX_Y; t2 = AX_Z; }
        const hr = hexCell(u + 0.37, v + 0.21), gl = hyp(Q[2], Q[3]) || 1, tx = (t1[0] * Q[2] + t2[0] * Q[3]) / gl, ty = (t1[1] * Q[2] + t2[1] * Q[3]) / gl, tz = (t1[2] * Q[2] + t2[2] * Q[3]) / gl;
        let tilt = 0; if (hr > 0.4) tilt = (hr - 0.4) / 0.1 * 0.55; else if (hr > 0.28 && hr < 0.32) tilt = -0.35 * (1 - Math.abs(hr - 0.3) / 0.02);
        nx += tx * tilt; ny += ty * tilt; nz += tz * tilt;
        if (hr > 0.475) cav += (hr - 0.475) / 0.025 * 0.75;
        // rivets at the corners
        const qx = Math.abs(Q[2]), qy = Math.abs(Q[3]); let rd = hyp(qx, qy - 0.577); const rd2 = hyp(qx - 0.5, qy - 0.2887); if (rd2 < rd) rd = rd2;
        if (rd < 0.085) { const k2 = rd / 0.085, cxr = rd === rd2 ? 0.5 : 0, cyr = rd === rd2 ? 0.2887 : 0.577, sx = Math.sign(Q[2]) * (qx - cxr) / 0.085, sy = Math.sign(Q[3]) * (qy - cyr) / 0.085;
          nx += (t1[0] * sx + t2[0] * sy) * 0.9; ny += (t1[1] * sx + t2[1] * sy) * 0.9; nz += (t1[2] * sx + t2[2] * sy) * 0.9; fr = Math.min(1, fr * 1.25); fg *= 1.2; fb *= 1.15; rough *= 0.6; cav = Math.max(0, cav - 0.9) + (k2 > 0.8 ? 0.5 : 0); } }
      if (hex === 2 && mat === M_BRZ) { const px = x, py = Math.abs(y) - 0.04, pz = z + 0.02, rh = hyp(px, py), az = Math.atan2(py, px), el = Math.atan2(pz, rh), rr = hyp(rh, pz);
        const fa = fm(az / 0.62 + 0.3, 1), fe = fm(el / 0.5 + 0.25, 1), da = Math.min(fa, 1 - fa) * 0.62 * rr, de = Math.min(fe, 1 - fe) * 0.5 * rr, dmin = Math.min(da, de), bw = 0.04;
        if (dmin < bw) { const k3 = (1 - dmin / bw) * 0.5; if (da < de) { const sg = fa < 0.5 ? 1 : -1, tx = -Math.sin(az) * sg, ty = Math.cos(az) * sg * Math.sign(y || 1); nx += tx * k3; ny += ty * k3; } else { const sg = fe < 0.5 ? 1 : -1; const c0 = Math.cos(el), s0 = Math.sin(el), tx = -s0 * Math.cos(az) * sg, ty = -s0 * Math.sin(az) * sg * Math.sign(y || 1), tz = c0 * sg; nx += tx * k3; ny += ty * k3; nz += tz * k3; } if (dmin < 0.008) cav += (1 - dmin / 0.008) * 0.85; }
        // rivets along the seams
        const ra = da < de ? fm(el * rr / 0.075, 1) : fm(az * rr / 0.075, 1), rd3 = hyp(Math.min(ra, 1 - ra) * 0.075, dmin - 0.022);
        if (rd3 < 0.016) { fr = Math.min(1, fr * 1.3); fg *= 1.25; fb *= 1.2; rough *= 0.55; if (rd3 > 0.012) cav += 0.5; else nz += 0.4; } }
      // fine scratches: bright, smoother streaks in two grains
      const sc1 = Math.abs(fm(x * 13 + y * 8 + z * 5 + vnoise(x * 4, z * 4) * 2.5, 1) - 0.5), sc2 = Math.abs(fm(x * -7 + y * 11 + z * 9 + vnoise(y * 4, x * 4) * 2.5, 1) - 0.5);
      if ((sc1 < 0.018 && hsh(Math.floor(x * 13 + y * 8 + z * 5), Math.floor(z * 6)) > 0.6) || (sc2 < 0.014 && hsh(Math.floor(y * 11 - x * 7), Math.floor(x * 5)) > 0.7)) { wearK += 0.55; rough *= 0.5; }
    }
    if (mat === M_GOLD) { // gold: worn, with rivets on a fine lattice
      const S1 = 0.085, gx = Math.round(x / S1) * S1, gy = Math.round(y / S1) * S1, gz = Math.round(z / S1) * S1, dx = x - gx, dy = y - gy, dz = z - gz, rd = hyp3(dx, dy, dz);
      if (rd < 0.024 && hsh3(gx * 9, gy * 9, gz * 9) < 0.75) { const k2 = rd / 0.024; nx += dx / 0.024 * 1.3; ny += dy / 0.024 * 1.3; nz += dz / 0.024 * 1.3; rough *= 0.7; if (k2 > 0.85) cav += 0.4; }
      const wn = vnoise(x * 18, y * 18 + z * 9); rough *= 0.7 + 0.8 * wn; if (wn < 0.3) { fr *= 0.82; fg *= 0.75; fb *= 0.7; }
    }
    if (mat === M_STEEL) { const s2 = Math.abs(fm((x + z) * 40 + vnoise(y * 9, x * 9) * 3, 1) - 0.5); if (s2 < 0.1) rough *= 0.6; }
    if (mat === M_CABLE) { const f = Math.abs(fm((x + y * 0.3) * 26, 1) - 0.5); if (f < 0.16) { cav += 0.6; } }
    if (mat === M_LEATH) { // tufting: buttoned dimples and the stitched diamonds between them
      const u = (x + y) * 11, v = (x - y) * 11, du = fm(u, 1) - 0.5, dv = fm(v, 1) - 0.5, d = hyp(du, dv);
      if (d < 0.18) { cav += (0.18 - d) * 2.6; nx -= du * 0.6; ny -= dv * 0.6; if (d < 0.07) { ar = 0.75; ag = 0.5; ab = 0.18; } } else { nx += du * 0.25; ny += dv * 0.25; nz += 0.2; }
    }
    { const l = hyp3(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l; }
    // edges worn bright, creases grimy (verdigris on the bronze), occlusion in the seams
    const edge = cl((lap - 8) / 26), crease = cl((-lap - 6) / 22);
    wearK += edge * (mat === M_STEEL ? 0.4 : 0.9);
    const grime = Math.min(0.85, crease * 0.6 + (1 - ao) * 0.35 + cav * 0.55);
    if (bronze && crease + (1 - ao) > 0.35) { const v = cl((crease + (1 - ao) - 0.35) * 0.9); ar = lerp(ar, 0.1, v); ag = lerp(ag, 0.22, v); ab = lerp(ab, 0.18, v); }
    if (wearK > 0) { const v = Math.min(1, wearK); fr = lerp(fr, 1.0, v * 0.5); fg = lerp(fg, mat === M_GOLD ? 0.92 : 0.72, v * 0.5); fb = lerp(fb, mat === M_GOLD ? 0.6 : 0.5, v * 0.5); rough *= 1 - v * 0.45; }
    // lighting
    const L = B.L, V = B.V, ndl = nx * L[0] + ny * L[1] + nz * L[2], dif = Math.max(0, ndl) * shd, ndv = Math.max(0.001, nx * V[0] + ny * V[1] + nz * V[2]);
    const up = nx * B.UP[0] + ny * B.UP[1] + nz * B.UP[2], hm = 0.5 + 0.5 * up, amr = lerp(GNDC[0], SKYC[0], hm) * ao, amg = lerp(GNDC[1], SKYC[1], hm) * ao, amb = lerp(GNDC[2], SKYC[2], hm) * ao;
    const rx = 2 * ndv * nx - V[0], ry = 2 * ndv * ny - V[1], rz = 2 * ndv * nz - V[2], ev = env(B, rx, ry, rz, rough), ec = Q[4];
    const fk = Math.pow(1 - ndv, 5) * (1 - rough * 0.7), Fr = fr + (1 - fr) * fk, Fg = fg + (1 - fg) * fk, Fb = fb + (1 - fb) * fk;
    const Hh = B.Hh, nh = Math.max(0, nx * Hh[0] + ny * Hh[1] + nz * Hh[2]), pw = 2 / (rough * rough + 0.004), spec = Math.pow(nh, pw) * (pw + 2) / 8 * dif * 0.9;
    const aoS = Math.min(1, ao * (0.6 + 0.4 * shd) + 0.1) * (1 - cav * 0.6);
    const rimT = Math.pow(1 - ndv, 2.6) * Math.max(0, nx * B.RIM[0] + ny * B.RIM[1] + nz * B.RIM[2] + 0.35) * ao;
    let r, g, b;
    if (M.m) { const dk = 0.18; r = ar * dk * (dif * KEYC[0] + amr) + Fr * (ev * aoS + spec * KEYC[0]) + ec * RIMC[0] * Fr * aoS * 0.6; g = ag * dk * (dif * KEYC[1] + amg) + Fg * (ev * aoS + spec * KEYC[1]) + ec * RIMC[1] * Fg * aoS * 0.6; b = ab * dk * (dif * KEYC[2] + amb) + Fb * (ev * aoS + spec * KEYC[2]) + ec * RIMC[2] * Fb * aoS * 0.6;
      // a share of plain lit colour so the metal reads its hue in shadow
      r += ar * (dif * 0.55 + amr * 0.45); g += ag * (dif * 0.55 + amg * 0.45); b += ab * (dif * 0.55 + amb * 0.45); }
    else { r = ar * (dif * KEYC[0] + amr) + Fr * (ev * aoS + spec * KEYC[0] * 3) + ec * RIMC[0] * 0.3; g = ag * (dif * KEYC[1] + amg) + Fg * (ev * aoS + spec * KEYC[1] * 3) + ec * RIMC[1] * 0.3; b = ab * (dif * KEYC[2] + amb) + Fb * (ev * aoS + spec * KEYC[2] * 3) + ec * RIMC[2] * 0.3; }
    const rk = mat === M_JEWEL ? 0.15 : 0.75; r += rimT * RIMC[0] * rk; g += rimT * RIMC[1] * rk; b += rimT * RIMC[2] * rk;
    if (mat === M_JEWEL) { // light gathered inside the stone: a glow facing the viewer and a caustic spot away from the key light
      const inner = Math.pow(ndv, 1.4), ca = Math.max(0, -(nx * L[0] + ny * L[1]) * 0.8 + nz * 0.3); r += 0.75 * inner + 0.5 * ca * ca; g += 0.04 * inner + 0.05 * ca * ca; b += 0.08 * inner + 0.06 * ca * ca; }
    const gk = (1 - grime) * 1.22; o[0] = tone(r * gk); o[1] = tone(g * gk * (1 - grime * 0.04)); o[2] = tone(b * gk * (1 - grime * 0.08));
  }

  /* ================= the bake ================= */
  const NB = 16;
  const BK = { k: 0, spr: {}, lo: {}, seg: {}, gen: null, genKey: '', queue: [], ms: 0, maxMs: 0, n: 0, small: null, st: '', bytes: 0, spikes: [] };
  for (const p of PART_ORDER) { BK.spr[p] = new Array(NB).fill(null); BK.lo[p] = new Array(NB).fill(null); }
  const bucketOf = ag => ((Math.round(ag / TAU * NB) % NB) + NB) % NB;
  function frameOf(b) {
    const ag = b / NB * TAU, ca = Math.cos(ag), sa = Math.sin(ag), toL = v => [v[0] * ca + v[1] * sa, -v[0] * sa + v[1] * ca, v[2]];
    const L = toL(LW), V = toL([0, VY, VZ]), h = nrm([L[0] + V[0], L[1] + V[1], L[2] + V[2]]);
    return { ag, ca, sa, L, V, SB: toL(SBW), RIM: toL(RIMW), UP: [0, 0, 1], Hh: h, D: [VY * sa, VY * ca, VZ] };
  }
  /* the side-on frame for the pieces laid along bones: the light comes from the sprite's top (+y) and the front */
  const SEGF = (() => { const V = [0, 0, 1], L = nrm([-0.3, 0.72, 0.62]); return { L, V, SB: nrm([-0.2, 0.55, 0.8]), RIM: nrm([0.5, 0.5, -0.7]), UP: nrm([0, 0.72, 0.69]), Hh: nrm([L[0], L[1], L[2] + 1]), D: [0, 0, 1], seg: true }; })();
  /* one ray: G receives the hit (t, point, normal, material, occlusion, shadow, curvature) */
  function trace(B, f, cx0, cy0, cz0, R, u, v, G) {
    G.hit = 0; let ox, oy, oz; const D = B.D;
    if (B.seg) { ox = u; oy = -v; oz = 0; } else { const gx = u, gy = v / GY; ox = gx * B.ca + gy * B.sa; oy = -gx * B.sa + gy * B.ca; oz = 0; }
    const cx = cx0 - ox, cy = cy0 - oy, cz = cz0 - oz, tc = cx * D[0] + cy * D[1] + cz * D[2], d2 = cx * cx + cy * cy + cz * cz - tc * tc;
    if (d2 > R * R) return;
    const hw = Math.sqrt(R * R - d2); let t = tc + hw, hit = false, n = 0;
    while (t > tc - hw && n++ < 110) { f(ox + D[0] * t, oy + D[1] * t, oz + D[2] * t); const d = Q[0]; if (d < 0.0018) { hit = true; break; } t -= Math.max(d * 0.85, 0.0025); }
    if (!hit) return;
    const x = ox + D[0] * t, y = oy + D[1] * t, z = oz + D[2] * t, e = 0.008;
    f(x, y, z); const f0 = Q[0], mat = SM; f(x + e, y, z); const fxp = Q[0]; f(x - e, y, z); const fxm = Q[0]; f(x, y + e, z); const fyp = Q[0]; f(x, y - e, z); const fym = Q[0]; f(x, y, z + e); const fzp = Q[0]; f(x, y, z - e); const fzm = Q[0];
    let nx = fxp - fxm, ny = fyp - fym, nz = fzp - fzm; const nl = hyp3(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const lap = (fxp + fxm + fyp + fym + fzp + fzm - 6 * f0) / (e * e) * 0.66;
    let ao = 1; for (let i = 0; i < 4; i++) { const s2 = AOS[i]; f(x + nx * s2, y + ny * s2, z + nz * s2); ao -= AOW[i] * Math.max(0, s2 - Q[0]) / s2 * 0.42; } ao = cl(ao);
    // a soft shadow toward the key light (within this part)
    let sh = 1; if (B.L[0] * nx + B.L[1] * ny + B.L[2] * nz > -0.1) { let tt = 0.025; const L = B.L; for (let i = 0; i < 18 && tt < R * 1.6; i++) { f(x + nx * 0.006 + L[0] * tt, y + ny * 0.006 + L[1] * tt, z + nz * 0.006 + L[2] * tt); const h = Q[0]; if (h < 0.0015) { sh = 0; break; } sh = Math.min(sh, 7 * h / tt); tt += Math.max(0.018, h * 0.9); } sh = cl(sh); sh = sh * sh * (3 - 2 * sh); } else sh = 0;
    G.hit = 1; G.t = t; G.x = x; G.y = y; G.z = z; G.nx = nx; G.ny = ny; G.nz = nz; G.mat = mat; G.ao = ao; G.sh = sh; G.lap = lap;
  }
  let IMG = null; const SCR = {}; function scratch(k, n, T) { const b = SCR[k]; if (b && b.length >= n) return b; return (SCR[k] = new T(Math.ceil(n * 1.25))); }   // (reused between bakes: no garbage per picture)
  const GA = { hit: 0 }, NG = 12, AOS = [0.03, 0.07, 0.15, 0.28], AOW = [1, 0.7, 0.45, 0.3];
  /* bake one picture: a geometry pass on every other pixel, then every pixel shaded at full resolution from those samples
     (traced afresh where they disagree), the silhouette and the material seams supersampled, a soft dark outline */
  function* bakeImg(B, f, c, R, k, hex, box, store) {
    const W = box.W, Hh = box.H, ox = box.ox, oy = box.oy, CW = (W >> 1) + 2, CH = (Hh >> 1) + 2; yield; const Gd = scratch('g', CW * CH * NG, Float32Array); let tY = nowMs();
    const put = (q, G) => { if (!G.hit) { Gd[q] = -1; return; } Gd[q] = G.mat; Gd[q + 1] = G.t; Gd[q + 2] = G.x; Gd[q + 3] = G.y; Gd[q + 4] = G.z; Gd[q + 5] = G.nx; Gd[q + 6] = G.ny; Gd[q + 7] = G.nz; Gd[q + 8] = G.ao; Gd[q + 9] = G.sh; Gd[q + 10] = G.lap; };
    BK.st = 'geo';
    for (let j = 0; j < CH; j++) { const v = (j * 2 + 0.5 - oy) / k; for (let i = 0; i < CW; i++) { trace(B, f, c[0], c[1], c[2], R, (i * 2 + 0.5 - ox) / k, v, GA); put((j * CW + i) * NG, GA); if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } } }
    BK.st = 'shade'; yield; tY = nowMs();
    const NP = W * Hh, A = scratch('a', NP * 4, Float32Array).fill(0, 0, NP * 4), ID = scratch('i', NP, Int8Array).fill(-1, 0, NP), o = OUT, w4 = [0, 0, 0, 0], ix = [0, 0, 0, 0];
    for (let py = 0; py < Hh; py++) for (let px = 0; px < W; px++) {
      const i0 = px >> 1, j0 = py >> 1, fx = (px & 1) * 0.5, fy = (py & 1) * 0.5, q = py * W + px;
      ix[0] = (j0 * CW + i0) * NG; ix[1] = ix[0] + NG; ix[2] = ix[0] + CW * NG; ix[3] = ix[2] + NG; w4[0] = (1 - fx) * (1 - fy); w4[1] = fx * (1 - fy); w4[2] = (1 - fx) * fy; w4[3] = fx * fy;
      let ok = true, any = false; const m0 = Gd[ix[0]];
      for (let s = 0; s < 4; s++) { if (w4[s] === 0) continue; const qq = ix[s], m = Gd[qq]; if (m >= 0) any = true; if (m !== m0 || m < 0) { ok = false; continue; } if (Math.abs(Gd[qq + 1] - Gd[ix[0] + 1]) > 0.03 || Gd[qq + 5] * Gd[ix[0] + 5] + Gd[qq + 6] * Gd[ix[0] + 6] + Gd[qq + 7] * Gd[ix[0] + 7] < 0.88) ok = false; }
      if (ok && m0 >= 0) { let x = 0, y = 0, z = 0, nx = 0, ny = 0, nz = 0, ao = 0, sh = 0, lap = 0; for (let s = 0; s < 4; s++) { const w = w4[s]; if (w === 0) continue; const qq = ix[s]; x += Gd[qq + 2] * w; y += Gd[qq + 3] * w; z += Gd[qq + 4] * w; nx += Gd[qq + 5] * w; ny += Gd[qq + 6] * w; nz += Gd[qq + 7] * w; ao += Gd[qq + 8] * w; sh += Gd[qq + 9] * w; lap += Gd[qq + 10] * w; }
        const nl = hyp3(nx, ny, nz) || 1; shade(B, m0, x, y, z, nx / nl, ny / nl, nz / nl, lap, ao, sh, hex, o); A[q * 4] = o[0]; A[q * 4 + 1] = o[1]; A[q * 4 + 2] = o[2]; A[q * 4 + 3] = 1; ID[q] = m0; }
      else if (any || (m0 < 0 && false)) { trace(B, f, c[0], c[1], c[2], R, (px + 0.5 - ox) / k, (py + 0.5 - oy) / k, GA); if (GA.hit) { shade(B, GA.mat, GA.x, GA.y, GA.z, GA.nx, GA.ny, GA.nz, GA.lap, GA.ao, GA.sh, hex, o); A[q * 4] = o[0]; A[q * 4 + 1] = o[1]; A[q * 4 + 2] = o[2]; A[q * 4 + 3] = 1; ID[q] = GA.mat; } }
      if ((px & 3) === 3 && nowMs() - tY > 1.0) { yield; tY = nowMs(); } }
    BK.st = 'aa';
    for (let py = 0; py < Hh; py++) { for (let px = 0; px < W; px++) { const pi = py * W + px, id = ID[pi];
      if (!((px + 1 < W && ID[pi + 1] !== id) || (px > 0 && ID[pi - 1] !== id) || (py + 1 < Hh && ID[pi + W] !== id) || (py > 0 && ID[pi - W] !== id))) continue;
      let r = 0, g = 0, bb = 0, a = 0; for (let si = 0; si < 4; si++) { trace(B, f, c[0], c[1], c[2], R, (px + 0.5 + (si & 1 ? 0.25 : -0.25) - ox) / k, (py + 0.5 + (si & 2 ? 0.25 : -0.25) - oy) / k, GA); if (!GA.hit) continue; shade(B, GA.mat, GA.x, GA.y, GA.z, GA.nx, GA.ny, GA.nz, GA.lap, GA.ao, GA.sh, hex, o); r += o[0]; g += o[1]; bb += o[2]; a += 1; }
      const q = pi * 4, a0 = A[q + 3], na = (a0 + a) / 5; if (na > 0) { A[q] = (A[q] * a0 + r) / 5 / na; A[q + 1] = (A[q + 1] * a0 + g) / 5 / na; A[q + 2] = (A[q + 2] * a0 + bb) / 5 / na; } A[q + 3] = na;
      if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } } }
    // the outline: a soft dark rim just inside the silhouette (the game's ink line, softly)
    BK.st = 'rim'; const rim = scratch('r', NP, Float32Array).fill(0, 0, NP);
    for (let py = 1; py < Hh - 1; py++) { if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } for (let px = 1; px < W - 1; px++) { const pi = py * W + px; if (A[pi * 4 + 3] < 0.35) continue; const mn = Math.min(A[(pi - 1) * 4 + 3], A[(pi + 1) * 4 + 3], A[(pi - W) * 4 + 3], A[(pi + W) * 4 + 3]); if (mn < 0.3) rim[pi] = 1 - mn / 0.3; } }
    for (let i = 0; i < NP; i++) { if (!rim[i]) continue; const q = i * 4, k2 = rim[i] * 0.6; A[q] = lerp(A[q], 0.08, k2); A[q + 1] = lerp(A[q + 1], 0.04, k2); A[q + 2] = lerp(A[q + 2], 0.04, k2); }
    yield; tY = nowMs();
    BK.st = 'put'; let x0 = W, y0 = Hh, x1 = -1, y1 = -1; for (let py = 0; py < Hh; py++) { if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } for (let px = 0; px < W; px++) if (A[(py * W + px) * 4 + 3] > 0.004) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } }
    if (x1 < 0) { store({ cv: null, k }); return; }
    const w2 = x1 - x0 + 1, h2 = y1 - y0 + 1, cv = document.createElement('canvas'); cv.width = w2; cv.height = h2; const cx = cv.getContext('2d'); if (!IMG || IMG.width < w2 || IMG.height < h2) IMG = cx.createImageData(Math.max(w2, IMG ? IMG.width : 0) + 16, Math.max(h2, IMG ? IMG.height : 0) + 16); const id = IMG, Dd = id.data, IW = id.width;   // (one reused buffer)
    for (let py = 0; py < h2; py++) { if (nowMs() - tY > 1.0) { yield; tY = nowMs(); } for (let px = 0; px < w2; px++) { const s = ((py + y0) * W + px + x0) * 4, d = (py * IW + px) * 4; Dd[d] = A[s] * 255; Dd[d + 1] = A[s + 1] * 255; Dd[d + 2] = A[s + 2] * 255; Dd[d + 3] = A[s + 3] * 255; } }
    yield; cx.putImageData(id, 0, 0, 0, 0, w2, h2); BK.bytes += w2 * h2 * 4;
    store({ cv, x: x0 - ox, y: y0 - oy, k });
  }
  const HEXP = { torso: 1, shieldL: 2, shieldR: 2, head: 0, housing: 0, hand: 1, foot: 0 };
  function bakePart(name, b, k, lo) {
    const P = PARTS[name], B = frameOf(b), c = P.c, R = P.R;
    const gx = c[0] * B.ca - c[1] * B.sa, gy = c[0] * B.sa + c[1] * B.ca, cu = gx, cvv = gy * GY - c[2] * ZK;
    const W = Math.ceil(2 * R * k) + 4, box = { W, H: W, ox: -(cu - R) * k + 2, oy: -(cvv - R) * k + 2 };
    return bakeImg(B, P.f, c, R, k, HEXP[name], box, s => { (lo ? BK.lo : BK.spr)[name][b] = s; });
  }
  function bakeSeg(name, k) {
    const P = SEGS[name], R = P.R, L = P.L, c = [L / 2, 0, 0], RR = L / 2 + R + 0.02;
    const W = Math.ceil((L + 2 * R) * k) + 6, H = Math.ceil(2 * R * k) + 6, box = { W, H, ox: R * k + 3, oy: R * k + 3 };
    return bakeImg(SEGF, P.f, c, RR, k, 0, box, s => { s.L = L; s.R = R; BK.seg[name] = s; });
  }

  /* ================= the small pictures (built once): bores, smoke, debris, floor rings ================= */
  let SM2 = null;
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h || w; return [cv, cv.getContext('2d')]; };
  function buildSmall() {
    const S = {};
    // a barrel's mouth: a worn gold-bronze lip round a deep dark bore with a rifled throat
    { const P = 64, [cv, c] = mkc(P); let g = c.createRadialGradient(26, 24, 2, 32, 32, 31); g.addColorStop(0, '#E8B870'); g.addColorStop(0.6, '#8A5228'); g.addColorStop(1, '#3A1E0E'); c.fillStyle = g; c.beginPath(); c.arc(32, 32, 31, 0, TAU); c.fill();
      g = c.createRadialGradient(32, 30, 2, 32, 32, 21); g.addColorStop(0, '#000000'); g.addColorStop(0.7, '#0E0B0C'); g.addColorStop(1, '#3A2A24'); c.fillStyle = g; c.beginPath(); c.arc(32, 32, 20, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,220,160,.25)'; c.lineWidth = 1; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(32 + Math.cos(a) * 12, 32 + Math.sin(a) * 12); c.lineTo(32 + Math.cos(a + 0.3) * 19, 32 + Math.sin(a + 0.3) * 19); c.stroke(); }
      c.strokeStyle = 'rgba(255,240,200,.7)'; c.lineWidth = 2; c.beginPath(); c.arc(32, 32, 29, 3.6, 5.2); c.stroke(); S.bore = cv; }
    // smoke: a soft, lumpy, dusty puff (normal blend; light-brown grey); steam: a whiter, softer one
    for (const [key, a, b2] of [['smoke', 'rgba(236,226,210,.95)', 'rgba(196,182,164,.75)'], ['steam', 'rgba(255,255,255,.9)', 'rgba(230,236,244,.6)']]) { const P = 96, [cv, c] = mkc(P); for (let i = 0; i < 7; i++) { const an = i / 7 * TAU, rr = 14 + (i % 3) * 4, x = 48 + Math.cos(an) * 14, y = 50 + Math.sin(an) * 11; const g = c.createRadialGradient(x - 4, y - 5, 2, x, y, rr + 10); g.addColorStop(0, a); g.addColorStop(0.5, b2); g.addColorStop(1, 'rgba(150,136,122,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, rr + 10, 0, TAU); c.fill(); }
      const g = c.createRadialGradient(44, 42, 4, 48, 48, 30); g.addColorStop(0, 'rgba(250,244,234,.9)'); g.addColorStop(1, 'rgba(220,208,192,0)'); c.fillStyle = g; c.beginPath(); c.arc(48, 48, 30, 0, TAU); c.fill(); S[key] = cv; }
    // a gear, a hex nut, a hammer and a wrench (dark silhouettes for the cloud), a small loose hex plate
    { const P = 64, [cv, c] = mkc(P); c.translate(32, 32); c.beginPath(); for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, r = i % 2 ? 22 : 29; c.lineTo(Math.cos(a - 0.08) * r, Math.sin(a - 0.08) * r); c.lineTo(Math.cos(a + 0.08) * r, Math.sin(a + 0.08) * r); } c.closePath(); const g = c.createLinearGradient(-28, -28, 28, 28); g.addColorStop(0, '#F4CF7A'); g.addColorStop(0.5, '#B07A36'); g.addColorStop(1, '#5A3816'); c.fillStyle = g; c.fill(); c.strokeStyle = '#2A1A0A'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#2A1A0A'; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill(); S.gear = cv; }
    { const P = 32, [cv, c] = mkc(P); c.translate(16, 16); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; c.lineTo(Math.cos(a) * 14, Math.sin(a) * 14); } c.closePath(); c.fillStyle = '#9AA0AE'; c.fill(); c.strokeStyle = '#2B2E38'; c.lineWidth = 2; c.stroke(); c.fillStyle = '#2B2E38'; c.beginPath(); c.arc(0, 0, 5, 0, TAU); c.fill(); S.nut = cv; }
    { const [cv, c] = mkc(64); c.fillStyle = '#2A2018'; c.fillRect(29, 18, 6, 44); c.beginPath(); c.roundRect ? c.roundRect(12, 6, 40, 16, 3) : c.rect(12, 6, 40, 16); c.fill(); S.hammer = cv; }
    { const [cv, c] = mkc(64); c.fillStyle = '#2A2018'; c.fillRect(28, 20, 8, 40); c.beginPath(); c.arc(32, 14, 13, 0, TAU); c.fill(); c.globalCompositeOperation = 'destination-out'; c.fillRect(27, 0, 10, 14); S.wrench = cv; }
    { const [cv, c] = mkc(48, 42); c.translate(24, 21); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; c.lineTo(Math.cos(a) * 20, Math.sin(a) * 20); } c.closePath(); const g = c.createLinearGradient(-20, -20, 20, 20); g.addColorStop(0, '#E2A06A'); g.addColorStop(0.5, '#9A5428'); g.addColorStop(1, '#4A2410'); c.fillStyle = g; c.fill(); c.strokeStyle = '#F6D27A'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#F6D27A'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6; c.beginPath(); c.arc(Math.cos(a) * 14, Math.sin(a) * 14, 1.6, 0, TAU); c.fill(); } S.panel = cv; }
    { const [cv, c] = mkc(64); const g = c.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, 'rgba(8,4,6,.85)'); g.addColorStop(0.55, 'rgba(8,4,6,.45)'); g.addColorStop(1, 'rgba(8,4,6,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); S.occ = cv; }
    // the shadow; an electric ring for the floor (light only, feathered); floor dust
    { const [cv, c] = mkc(128, 64); const g = c.createRadialGradient(64, 32, 4, 64, 32, 62); g.addColorStop(0, 'rgba(10,6,4,.62)'); g.addColorStop(0.55, 'rgba(10,6,4,.42)'); g.addColorStop(1, 'rgba(10,6,4,0)'); c.save(); c.scale(1, 0.5); c.fillStyle = g; c.beginPath(); c.arc(64, 64, 64, 0, TAU); c.fill(); c.restore(); S.shadow = cv; }
    { const P = 128, [cv, c] = mkc(P); const g = c.createRadialGradient(64, 64, 30, 64, 64, 63); g.addColorStop(0, 'rgba(63,200,255,0)'); g.addColorStop(0.72, 'rgba(63,200,255,.25)'); g.addColorStop(0.86, 'rgba(220,245,255,1)'); g.addColorStop(0.93, 'rgba(95,160,255,.5)'); g.addColorStop(1, 'rgba(138,92,255,0)'); c.fillStyle = g; c.beginPath(); c.arc(64, 64, 64, 0, TAU); c.fill(); S.ring = cv; }
    { const P = 64, [cv, c] = mkc(P); const g = c.createRadialGradient(32, 32, 1, 32, 32, 31); g.addColorStop(0, 'rgba(255,248,236,.9)'); g.addColorStop(1, 'rgba(255,240,220,0)'); c.fillStyle = g; c.beginPath(); c.arc(32, 32, 31, 0, TAU); c.fill(); S.dust = cv; }
    SM2 = S;
  }
  /* the background baker: the small pictures, the bone pieces, then the parts at the headings in order of need (a quick
     half-size picture first for a heading that is needed now) */
  const SEG_ORDER = Object.keys(SEGS);
  function setScale(k) { k = Math.max(40, Math.min(132, Math.round(k * VIS / 8) * 8)); if (BK.k && k <= BK.k) return; BK.k = k; for (const p of PART_ORDER) { BK.spr[p].fill(null); BK.lo[p].fill(null); } BK.seg = {}; BK.bytes = 0; if (BK.gen) { BK.gen = null; BK.genKey = ''; } BK.queue = []; for (const s of SEG_ORDER) BK.queue.push('seg:' + s); for (let b = 0; b < NB; b++) for (const p of PART_ORDER) BK.queue.push(p + ':' + b); }
  const segsReady = () => SEG_ORDER.every(s => BK.seg[s]);
  function want(b, quick) { for (let i = PART_ORDER.length - 1; i >= 0; i--) { const p = PART_ORDER[i], key = p + ':' + b; if (BK.spr[p][b] || BK.genKey === key) continue; const j = BK.queue.indexOf(key); if (j >= 0) BK.queue.splice(j, 1); BK.queue.unshift(key); }
    if (quick) for (let i = PART_ORDER.length - 1; i >= 0; i--) { const p = PART_ORDER[i], key = 'lo:' + p + ':' + b; if (BK.spr[p][b] || BK.lo[p][b] || BK.genKey === key || BK.queue.indexOf(key) >= 0) continue; BK.queue.unshift(key); }
    for (let i = SEG_ORDER.length - 1; i >= 0; i--) { const key = 'seg:' + SEG_ORDER[i]; if (BK.seg[SEG_ORDER[i]] || BK.genKey === key) continue; const j = BK.queue.indexOf(key); if (j >= 0) BK.queue.splice(j, 1); BK.queue.unshift(key); } }
  const doneKey = key => { const a = key.split(':'); if (a[0] === 'seg') return !!BK.seg[a[1]]; if (a[0] === 'lo') return !!(BK.lo[a[1]][+a[2]] || BK.spr[a[1]][+a[2]]); return !!BK.spr[a[0]][+a[1]]; };
  function bakeStep(ms) {
    const t0 = nowMs();
    if (!SM2) { buildSmall(); return; }
    while (nowMs() - t0 < ms - 1.1) {   // (a slice runs about 1 ms: none starts that would overrun the budget)
      if (!BK.gen) { while (BK.queue.length && doneKey(BK.queue[0])) BK.queue.shift(); if (!BK.queue.length || !BK.k) break; const key = BK.queue.shift(), a = key.split(':');
        BK.gen = a[0] === 'seg' ? bakeSeg(a[1], BK.k) : a[0] === 'lo' ? bakePart(a[1], +a[2], BK.k * 0.5, true) : bakePart(a[0], +a[1], BK.k); BK.genKey = key; }
      const st0 = BK.st, s0 = nowMs(), r = BK.gen.next(), d = nowMs() - s0; BK.ms += d; if (d > BK.maxMs) { BK.maxMs = d; BK.maxAt = BK.genKey + '/' + st0 + '>' + BK.st; } if (d > 6 && BK.spikes.length < 40) BK.spikes.push(BK.genKey + '/' + st0 + '>' + BK.st + ' ' + d.toFixed(1));
      if (r.done) { BK.gen = null; BK.genKey = ''; BK.n++; }
    }
    // B2's / B3's warm-ups: one of them per call, on what is left of the budget (at most 2 ms), until each says it is done
    const MV = moves(), left = ms - (nowMs() - t0); if (left > 0.4) { const ws = ['warmS', 'warmJ'].filter(w => MV[w] && !WARMED[w]); if (ws.length) { const w = ws[(WARMI++) % ws.length]; try { if (MV[w](Math.min(2, left)) === true) WARMED[w] = true; } catch (e) { WARMED[w] = true; } } }
  }
  const WARMED = {}; let WARMI = 0;
  let IDLE = false;
  function idleBake() {
    const MV0 = moves(); if (IDLE || !(BK.gen || !SM2 || BK.queue.length || ['warmS', 'warmJ'].some(w => MV0[w] && !WARMED[w]))) return; IDLE = true;
    const go = () => { IDLE = false; idleBake(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => { bakeStep(dl.didTimeout ? 2 : Math.max(1, Math.min(3, dl.timeRemaining() - 1))); go(); }, { timeout: 150 });
    else setTimeout(() => { bakeStep(2.5); go(); }, 40);
  }
  const readyB = b => !!SM2 && segsReady() && PART_ORDER.every(p => BK.spr[p][b]);
  const usableB = b => !!SM2 && segsReady() && PART_ORDER.every(p => BK.spr[p][b] || BK.lo[p][b]);
  function nearestReady(p, b) { const A = BK.spr[p]; for (let d = 0; d <= NB / 2; d++) { if (A[(b + d) % NB]) return (b + d) % NB; if (A[(b - d + NB) % NB]) return (b - d + NB) % NB; } return -1; }

  /* ================= B2's / B3's moves (looked up at call time), or stubs so the whole flow can run ================= */
  const STUB = {
    TUNE_S: { missileCd: 1.8 },
    missiles(ctx) { const n = [10, 15, 20][ctx.tier]; let i = 0; const bm = ctx.beast, P = bm.pose;
      const go = () => { if (!ctx.alive()) { ctx.done(); return; } P.cannonTilt = 1; const L = i % 2 === 0; P[L ? 'recoilL' : 'recoilR'] = 1; P[L ? 'recoilR' : 'recoilL'] = 0;
        const T = ctx.mons(), m = T.length ? T[i % T.length] : null, mz = ctx.anchor(L ? 'muzzleL' : 'muzzleR');
        if (m) ctx.X.after(0.45, () => { if (!m.dead) { ctx.hit(m, ctx.DK * 0.45); ctx.hitArea(m.x, m.y, 0.9, ctx.DK * 0.22, { exclude: m }); ctx.X.ring(m.x, m.y, 0.2, 0.9, 0.3, CYAN, 0.18); } });
        ctx.X.ring(mz.x, mz.y, 0.1, 0.4, 0.2, CYAN, 0.12);
        if (++i < n) ctx.X.after(0.06, go); else ctx.X.after(0.15, () => { P.cannonTilt = 0; P.recoilL = P.recoilR = 0; ctx.done(); }); }; go(); },
    wrath(ctx) { const n = ctx.tier + 1, bm = ctx.beast, P = bm.pose; let k = 0;
      const strike = () => { if (!ctx.alive()) { ctx.done(); return; } const L = k % 2 === 0, R = L ? 'armLRaise' : 'armRRaise', Sl = L ? 'armLSlam' : 'armRSlam'; P[R] = 1; P.torsoDip = 0;
        ctx.X.after(0.3, () => { if (!ctx.alive()) { ctx.done(); return; } P[R] = 0; P[Sl] = 1; P.torsoDip = 1;
          ctx.X.after(0.09, () => { if (!ctx.alive()) { ctx.done(); return; } const a = bm.a, cx = bm.x + Math.cos(a) * 2.6, cy = bm.y + Math.sin(a) * 2.6; ctx.hitOval(cx, cy, 1.7, 1.1, a, ctx.DK * 3.0); ctx.X.ring(cx, cy, 0.3, 1.8, 0.35, GOLD, 0.25); if (ctx.X.shake && !ctx.calm()) ctx.X.shake(5, 0.12);
            ctx.X.after(0.22, () => { P[Sl] = 0; P.torsoDip = 0; bm.a = ctx.aimDir(); if (++k < n) strike(); else ctx.done(); }); }); }); }; strike(); },
    judgement(ctx) { const bm = ctx.beast, P = bm.pose, x0 = bm.x, y0 = bm.y; let t = 0, ph = 0, k = 0; const n = 4;
      const f = ctx.H.add({ life: 12, update(dt) { t += dt; if (!ctx.alive()) { f.life = 0; return; } P.glow = 1; P.cannonFold = 1;
        if (t < 0.5) { P.crouch = 1; P.charge = t / 0.5; } else if (t < 1.3) { P.crouch = 0; P.legsExt = 1; P.armRReach = 0; bm.z = Math.sin((t - 0.5) / 0.8 * Math.PI) * 3.2; }
        else if (!ph) { ph = 1; bm.z = 0; P.armRSlam = 1; P.torsoDip = 1; P.legsExt = 0; ctx.hitArea(bm.x, bm.y, 3, ctx.DK * 4, { noCharge: true }); ctx.X.ring(bm.x, bm.y, 0.3, 3, 0.4, CYAN, 0.3); }
        if (ph === 1 && k < n && t > 1.6 + k * 0.55) { k++; ctx.hitArea(bm.x, bm.y, 6, ctx.DK * 1.5, { noCharge: true }); ctx.X.ring(bm.x, bm.y, 1, 6, 0.4, VIOL, 0.25); }
        if (ph === 1 && k >= n && t > 1.6 + n * 0.55 + 0.4) { ph = 2; ctx.hitArea(bm.x, bm.y, 6.5, ctx.DK * 10, { noCharge: true }); P.shudder = 1; ctx.X.after(0.35, () => { bm.vis = 0; bm.gone = true; }); const s = ctx.seat(); f.ex = [s.x, s.y, s.z]; f.to = ctx.nearestStand(s.x + 1.4, s.y + 0.8); f.t2 = t + 0.35; }
        if (ph === 2 && t > f.t2) { ctx.ejecting = true; const u = cl((t - f.t2) / 0.8); ctx.petX = lerp(f.ex[0], f.to.x, u); ctx.petY = lerp(f.ex[1], f.to.y, u); ctx.petZ = lerp(f.ex[2], 0, u) + Math.sin(u * Math.PI) * 2; if (u >= 1 && !f.dn) { f.dn = 1; f.life = 0; ctx.done(); } } void x0; void y0; } }); },
  };
  let MVC = null, MVK = null;
  function moves() { let BM = null; try { BM = typeof self !== 'undefined' && self.BEAST_MOVES ? self.BEAST_MOVES : null; } catch (e) { BM = null; } if (!BM) return STUB;
    const key = [BM.missiles, BM.wrath, BM.judgement, BM.TUNE_S, BM.update, BM.drawUnder, BM.drawOver, BM.warmS, BM.warmJ];   /* (cached while B2's / B3's exports stay the same) */
    if (MVC && MVK && MVK.length === key.length && MVK.every((v, i) => v === key[i])) return MVC; MVK = key;
    if (BM.TUNE_J && BM.TUNE_J.shadow !== false) BM.TUNE_J.shadow = false;   /* (B3's Notes: B1 draws the machine's own shadow, lifted with beast.z) */
    return (MVC = { TUNE_S: BM.TUNE_S || STUB.TUNE_S, TUNE_J: BM.TUNE_J, missiles: typeof BM.missiles === 'function' ? BM.missiles : STUB.missiles, wrath: typeof BM.wrath === 'function' ? BM.wrath : STUB.wrath, judgement: typeof BM.judgement === 'function' ? BM.judgement : STUB.judgement,
      warmS: BM.warmS, warmJ: BM.warmJ, update: BM.update, drawUnder: BM.drawUnder, drawOver: BM.drawOver, real: { s: typeof BM.missiles === 'function', j: typeof BM.judgement === 'function' }, BM }); }
  const missileCd = () => { const T = moves().TUNE_S; return T && T.missileCd > 0 ? T.missileCd : TUNE.missileCd; };

  /* ================= the rig: pose channels -> joint positions (the machine's frame: x forward, y to its right, z up) ================= */
  const CH = ['crouch', 'armLRaise', 'armRRaise', 'armLSlam', 'armRSlam', 'armLReach', 'armRReach', 'cannonTilt', 'recoilL', 'recoilR', 'cannonFold', 'torsoDip', 'glow', 'charge', 'shudder', 'legsExt', 'handsIn'];
  const blankPose = () => { const o = {}; for (const k of CH) o[k] = 0; return o; };
  const V3 = (x, y, z) => ({ x, y, z });
  /* a two-bone limb: from A toward the target T, bones L1 and L2, the middle joint bending toward the pole */
  function ik(A, T, L1, L2, pole, outM, outE) {
    let dx = T.x - A.x, dy = T.y - A.y, dz = T.z - A.z, d = Math.hypot(dx, dy, dz) || 1e-4; const dm = Math.min(d, (L1 + L2) * 0.999); dx /= d; dy /= d; dz /= d;
    outE.x = A.x + dx * dm; outE.y = A.y + dy * dm; outE.z = A.z + dz * dm;
    const a = (L1 * L1 - L2 * L2 + dm * dm) / (2 * dm), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    let px = pole[0], py = pole[1], pz = pole[2]; const pd = px * dx + py * dy + pz * dz; px -= dx * pd; py -= dy * pd; pz -= dz * pd; const pl = Math.hypot(px, py, pz) || 1;
    outM.x = A.x + dx * a + px / pl * h; outM.y = A.y + dy * a + py / pl * h; outM.z = A.z + dz * a + pz / pl * h;
  }
  const lp3 = (o, T, u) => { if (u > 0) { o.x += (T[0] - o.x) * u; o.y += (T[1] - o.y) * u; o.z += (T[2] - o.z) * u; } };
  /* build part offsets during the construction (name -> {a alpha, dx, dy, dz offset, sc scale}) */
  function buildOff(S, name, side) {
    const o = { a: 1, dx: 0, dy: 0, dz: 0, sc: 1 }; if (S.phase !== 'build') return o; const t = S.t, s = side || 0;
    const pop = (t0, d) => cl((t - t0) / d);
    if (name === 'torso' || name === 'cable') { const u = pop(0.32, 0.22); o.a = u; o.dz = -0.45 * (1 - backOut(u)); }
    else if (name === 'leg') { const u = pop(0.44, 0.18); o.a = u; o.dz = -0.3 * (1 - backOut(u)); }
    else if (name === 'arm') { const t0 = s > 0 ? 0.55 : 0.7, u = pop(t0, 0.22); o.a = cl(u * 4); const f = 1 - u; o.dz = f * f * 2.8 - (u > 0.75 && u < 1 ? Math.sin((u - 0.75) / 0.25 * Math.PI) * 0.12 : 0); }
    else if (name === 'head') { const u = pop(0.8, 0.26), e = backOut(u); o.a = cl(u * 5); o.dy = (1 - e) * 1.1; o.dz = (1 - e) * 0.7; o.dx = -(1 - e) * 0.5; }
    else if (name === 'shield') { const u = pop(0.95, 0.14), e = backOut(u); o.a = cl(u * 6); o.dy = s * (1 - e) * 0.5; o.dz = (1 - e) * 0.55; o.sc = lerp(0.72, 1, e); }
    else if (name === 'cannon') { o.a = cl(pop(1.04, 0.06)); }
    return o;
  }
  function rig(S) {
    const bm = S.beast, P = S.P, R = S.R, k = S.gk, ph = S.gph, c = Math.max(P.crouch, S.absorb), dip = P.torsoDip;
    const sj = P.shudder > 0.01 && !calm() ? P.shudder * 0.05 : 0, jx = sj ? (Math.random() - 0.5) * sj : 0, jy = sj ? (Math.random() - 0.5) * sj : 0, jz = sj ? (Math.random() - 0.5) * sj : 0;
    const bob = k * 0.06 * Math.cos(ph * TAU * 2), roll = k * 0.055 * Math.sin(ph * TAU), frontZ = -0.3 * c - 0.3 * dip + bob - 0.02 * k, rearZ = -0.2 * c + bob * 0.6;
    const T0 = R.torso; T0.x = -0.05 * dip + jx; T0.y = jy; T0.z = 0.95 + (frontZ + rearZ) / 2 + jz;
    R.seat.x = T0.x + SEAT.x; R.seat.y = T0.y; R.seat.z = T0.z + SEAT.z + 0.04;
    R.neck.x = 0.7 + 0.04 * dip + jx; R.neck.y = k * 0.035 * Math.sin(ph * TAU) + jy; R.neck.z = 0.86 + frontZ * 1.1 - 0.08 * dip + jz;
    R.chest.x = T0.x + 0.62; R.chest.y = T0.y; R.chest.z = T0.z + 0.12;
    for (const s of [-1, 1]) { const L = s < 0, sh = L ? R.shL : R.shR, sd = L ? R.sdL : R.sdR, el = L ? R.elL : R.elR, wr = L ? R.wrL : R.wrR, hp = L ? R.hpL : R.hpR, kn = L ? R.knL : R.knR, an = L ? R.anL : R.anR, mt = L ? R.mtL : R.mtR;
      sh.x = 0.3 + 0.06 * dip + jx; sh.y = s * 0.84 + jy; sh.z = 1.28 + frontZ + roll * s + jz;
      sd.x = sh.x; sd.y = sh.y + s * 0.04; sd.z = sh.z + 0.06;
      const pa = ph + (L ? 0.06 : -0.06), gx = k * 0.4 * Math.cos(pa * TAU), lift = k * 0.45 * Math.max(0, -Math.sin(pa * TAU));
      const W = V3(0.7 + gx, s * 1.34, 0.3 * HK + lift);
      lp3(W, [1.5, s * 1.05, 0.7], P[L ? 'armLReach' : 'armRReach']);
      lp3(W, [0.8, s * 0.95, 0.9], P.handsIn);
      lp3(W, [0.55, s * 1.12, 2.5 + frontZ], P[L ? 'armLRaise' : 'armRRaise']);
      lp3(W, [1.45, s * 0.9, 0.3], P[L ? 'armLSlam' : 'armRSlam']);
      ik(sh, W, 0.6, 0.86, [-0.25, s * 0.85, 0.5], el, wr);
      hp.x = -0.5; hp.y = s * 0.42; hp.z = 0.66 + rearZ;
      const pl = ph + 0.5 + (L ? 0.04 : -0.04), lx = k * 0.3 * Math.cos(pl * TAU), ll = k * 0.28 * Math.max(0, -Math.sin(pl * TAU));
      const A = V3(-0.42 + lx, s * 0.66, 0.16 + ll); lp3(A, [-1.1, s * 0.62, 0.5], P.legsExt);
      ik(hp, A, 0.42, 0.42, [1, s * 0.4, 0.2], kn, an);
      // the battery's trunnion on top of the dome; three thick barrels in a row, rest up and forward, tilt toward upright, folded = braced low
      mt.x = sd.x - 0.22; mt.y = sd.y; mt.z = sd.z + 0.38;
      let th = lerp(1.0, 1.45, P.cannonTilt); th = lerp(th, 0.12, P.cannonFold);
      if (S.phase === 'build') { const u = cl((S.t - 1.04) / 0.3); th = lerp(2.7, th, backOut(u)); }
      const spl = s * 0.05 * (1 - P.cannonFold), dl = Math.hypot(Math.cos(th), spl, Math.sin(th)), dir = L ? R.dL : R.dR; dir.x = Math.cos(th) / dl; dir.y = spl / dl; dir.z = Math.sin(th) / dl;
      const rc = P[L ? 'recoilL' : 'recoilR'];
      const sv = [-dir.y, dir.x, 0], svl = Math.hypot(sv[0], sv[1]) || 1; sv[0] /= svl; sv[1] /= svl; const uv = [sv[1] * dir.z, -sv[0] * dir.z, sv[0] * dir.y - sv[1] * dir.x];
      const B = L ? R.bL : R.bR; for (let i = 0; i < 3; i++) { const o = [-0.23, 0, 0.23][i] * s, up = i === 1 ? 0.035 : 0, bx = sv[0] * o + uv[0] * up, by = sv[1] * o + uv[1] * up, bz = uv[2] * up, back = (i === S.bi % 3 ? rc : rc * 0.4) * 0.2;
        B[i].a.x = mt.x + dir.x * (0.02 - back) + bx; B[i].a.y = mt.y + dir.y * (0.02 - back) + by; B[i].a.z = mt.z + dir.z * (0.02 - back) + bz;
        B[i].b.x = mt.x + dir.x * (0.8 - back) + bx; B[i].b.y = mt.y + dir.y * (0.8 - back) + by; B[i].b.z = mt.z + dir.z * (0.8 - back) + bz; } }
    void bm;
  }
  function newRig() { const R = {}; for (const k of ['torso', 'seat', 'neck', 'chest', 'shL', 'shR', 'sdL', 'sdR', 'elL', 'elR', 'wrL', 'wrR', 'hpL', 'hpR', 'knL', 'knR', 'anL', 'anR', 'mtL', 'mtR', 'dL', 'dR']) R[k] = V3(0, 0, 0); R.bL = [0, 1, 2].map(() => ({ a: V3(0, 0, 0), b: V3(0, 0, 0) })); R.bR = [0, 1, 2].map(() => ({ a: V3(0, 0, 0), b: V3(0, 0, 0) })); return R; }
  /* the machine's frame -> the world (map tiles; z = height above the floor); the rig's units are drawn VIS larger */
  function l2w(S, p, out) { const bm = S.beast, ag = S.ag, ca = Math.cos(ag), sa = Math.sin(ag), sc = (bm.scale || 1) * VIS; out = out || {}; out.x = bm.x + (p.x * ca - p.y * sa) * sc; out.y = bm.y + (p.x * sa + p.y * ca) * GY * sc; out.z = p.z * sc + bm.z; return out; }
  const depthOf = (S, p) => (p.x * Math.sin(S.ag) + p.y * Math.cos(S.ag)) * VY + p.z * VZ;
  function anchor(S, name) {
    const R = S.R, sd = name.slice(-1) === 'L' ? 'L' : name.slice(-1) === 'R' ? 'R' : '';
    const m = /^muzzle([LR])([0-2])?$/.exec(name);
    let p;
    if (m) { const B = R['b' + m[1]]; if (m[2] != null) p = B[+m[2]].b; else p = V3((B[0].b.x + B[1].b.x + B[2].b.x) / 3, (B[0].b.y + B[1].b.y + B[2].b.y) / 3, (B[0].b.z + B[1].b.z + B[2].b.z) / 3); }
    else if (name === 'cannonL' || name === 'cannonR') p = R['mt' + sd];
    else if (name === 'handL' || name === 'handR') { const w = R['wr' + sd]; p = V3(w.x + 0.3 * HK, w.y, w.z - 0.2 * HK); }
    else if (name === 'elbowL' || name === 'elbowR') p = R['el' + sd];
    else if (name === 'seat') p = R.seat;
    else if (name === 'eyes') p = V3(R.neck.x + 0.3 * HS, R.neck.y, R.neck.z + 0.0 * HS);
    else if (name === 'head') p = V3(R.neck.x + 0.62 * HS, R.neck.y, R.neck.z - 0.22 * HS);
    else if (name === 'back') p = V3(R.torso.x - 0.55, R.torso.y, R.torso.z + 0.42);
    else p = R.chest;
    return l2w(S, p);
  }

  /* ================= the form ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_beastmachine' && kit.ult.cd) || TUNE.cd, dur = TUNE.dur[tier];
    const T0 = X.Tz(), dpr = (typeof arc !== 'undefined' && arc.dpr) || 1; setScale(T0 * dpr / Math.max(0.6, g.zoom || 1));
    if (typeof TK !== 'undefined') TKK = TK.bind(H);
    const tgt = X.nearestMon(me.x, me.y, 9) || null; const a = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    const pose = blankPose(), beast = { x: me.x, y: me.y, a, vx: 0, vy: 0, speed: 0, z: 0, scale: 1, locked: true, contact: true, vis: 1, gone: false, pose, poseSnap: false, prevX: me.x, prevY: me.y, prevA: a };
    const S = { H, g, me, X, C, ev, tier, DK, CD, dur, left: dur, beast, phase: 'build', t: 0, hold: 0, charge: 0, used: false, busy: null, busyT: 0, cdM: 0, cdW: 0, cdJump: 0, jump: null, jumpQ: null, judgeQ: null, mvQ: null,
      gate: new Map(), parts: [], free: [], ended: false, pet: X.pet ? X.pet() : null, P: blankPose(), R: newRig(), gk: 0, gph: 0, absorb: 0, absV: 0, ag: groundA(a), lit: 0, sparkT: 0.8, sfxT: 0, plantT: [0, 0], bumpT: 0, bi: 0,
      stats: { contact: 0, missiles: 0, wrath: 0, judge: 0, dealt: 0, charged: 0, hits: 0, jump: 0, jumpHit: 0, rideT: 0 }, petStand: null, items: [], nItems: 0, zap: [], mx: 0, my: 0 };
    g._beast = S;
    // its place: the machine is centred ahead of the pet, turned or nudged until it fits between the walls
    let best = null; for (let k2 = 0; k2 < 12 && !best; k2++) { const ang = a + (k2 % 2 ? 1 : -1) * Math.ceil(k2 / 2) * (Math.PI / 6), ag = groundA(ang), x = me.x + Math.cos(ag) * 0.3, y = me.y + Math.sin(ag) * 0.3 * GY; if (!poseBlocked(S, x, y, ang, 0)) best = { x, y, a: ang }; }
    if (!best) for (let r = 0.3; r < 2.6 && !best; r += 0.3) for (let i = 0; i < 12 && !best; i++) { const x = me.x + Math.cos(i / 12 * TAU) * r, y = me.y + Math.sin(i / 12 * TAU) * r; if (!poseBlocked(S, x, y, a, 0)) best = { x, y, a }; }
    if (best) { beast.x = best.x; beast.y = best.y; beast.a = best.a; }
    beast.prevX = beast.x; beast.prevY = beast.y; beast.prevA = beast.a; S.ag = groundA(beast.a);
    S.petX0 = me.x; S.petY0 = me.y; S.petStand = { x: me.x, y: me.y };
    want(bucketOf(S.ag));
    const ctx = S.ctx = { X, H, C, evo: ev, tier, DK, beast, petX: me.x, petY: me.y, petZ: 0, ejecting: false, judgement: false, vis: 1, sfx: X.sfx || {},
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o),
      hitArea: (x, y, r, dmg, o) => { let n = 0; const ex = o && o.exclude; for (const m of H.living()) { if (ex && (ex === m || (ex.has && ex.has(m)))) continue; if (Math.hypot(m.x - x, m.y - y) < r + (m.r || 0.4)) { hitCharge(S, m, dmg, o); n++; } } return n; },
      hitOval: (cx, cy, rx, ry, ang, dmg, o) => { let n = 0; const ex = o && o.exclude, ca = Math.cos(ang), sa = Math.sin(ang); for (const m of H.living()) { if (ex && (ex === m || (ex.has && ex.has(m)))) continue; const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, mr = m.r || 0.4; if ((u / (rx + mr)) ** 2 + (v / (ry + mr)) ** 2 <= 1) { hitCharge(S, m, dmg, o); n++; } } return n; },
      mons: () => H.living(), target: () => target(S), canStand: (x, y) => canStand(S, x, y), nearestStand: (x, y) => nearestStand(S, x, y), flowAt: (x, y) => (X.flowAt ? X.flowAt(x, y) : 0),
      aimDir: () => { const m = Math.hypot(S.mx, S.my); return m > 0.2 ? Math.atan2(S.my, S.mx) : beast.a; }, stick: () => ({ x: S.mx, y: S.my, mag: Math.min(1, Math.hypot(S.mx, S.my)) }),
      anchor: n => anchor(S, n), cannonDir: side => { const d = S.R[side === 'L' ? 'dL' : 'dR'], ag = S.ag, ca = Math.cos(ag), sa = Math.sin(ag); const x = d.x * ca - d.y * sa, y = (d.x * sa + d.y * ca) * GY, l = Math.hypot(x, y, d.z) || 1; return { x: x / l, y: y / l, z: d.z / l }; },
      scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], T: () => X.Tz(), seat: () => anchor(S, 'seat'),
      done: () => actionDone(S), alive: () => !S.ended && !me.dead && !g.over && (S.phase === 'judge' || (S.phase === 'ride' && !g.won)),
      calm, low: lowFx };
    S.veh = { get active() { return !S.released; }, noJumpBtn: true, drive: (mx, my, dt) => drive(S, mx, my, dt), dodge: (mx, my) => tryJump(S, mx, my), jump: (mx, my) => tryJump(S, mx, my), strong: slot => tryMove(S, slot), ult: () => tryJudge(S), drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap') };
    X.vehicle(S.veh);
    const F = S.fx = H.add({ key: 'beastmachine', life: 1e9, entY: beast.y,
      update(dt) { step(S, dt); }, drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); },
      onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    return S;
  }
  /* walls: three circles along the machine's axis (mode 1: walls and the map's edge only, for the air) */
  function poseBlocked(S, x, y, ang, mode) { const X = S.X, ag = groundA(ang), ex = FP.e * Math.cos(ag), ey = FP.e * Math.sin(ag) * GY; return X.blocked(x, y, FP.c, mode) || X.blocked(x + ex, y + ey, FP.r, mode) || X.blocked(x - ex, y - ey, FP.r, mode); }
  function canStand(S, x, y) { return !S.X.blocked(x, y, 0.38, 0) && !S.X.blocked(x, y, 0.2, 0); }
  function nearestStand(S, x, y) { const me = S.me, p = S.X.walkPoint(x, y, { r: 0.4, x: me.x, y: me.y }); return { x: p.x, y: p.y }; }
  function target(S) { const b = S.beast, X = S.X; const m = X.nearestMon(b.x, b.y, 9, null, true) || X.nearestMon(b.x, b.y, 13); if (m) return { x: m.x, y: m.y, m }; return { x: b.x + Math.cos(b.a) * 4, y: b.y + Math.sin(b.a) * 4, m: null }; }

  /* ---- damage and the meter: each event once, after mitigation, without overkill ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0)) return 0;
    const before = Math.max(0, m.hp), oo = Object.assign({ el: 'thunder', src: 'ult' }, o || {}); delete oo.noCharge; delete oo.exclude;
    const r = S.X.hitMon(m, dmg, oo), dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && S.phase === 'ride' && !S.used && !S.released) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { S.readyT = 0; const sfx = S.X.sfx || {}; if (sfx.note) [392, 523, 784, 1046].forEach((f, i) => sfx.note(f, 0.4, 'sawtooth', 0.035, f * 1.01, i * 0.07)); S.X.text(S.me.x, S.me.y - 2.6, 'JUDGEMENT DAY READY', GOLD, 15, { life: 1.4, max: 1.4, vy: -0.5 }); } }
    return dealt;
  }

  /* ---- riding ---- */
  function drive(S, mx, my, dt) {
    const bm = S.beast, me = S.me; S.mx = mx; S.my = my;
    if (S.jump) { if (me.push) me.push = null; syncMe(S); return; }   /* (the hop owns the machine until it lands; stepJump runs in step) */
    if (S.phase !== 'ride' || bm.locked || S.recover > 0) { me.vx = me.vy = 0; if (me.push) me.push = null; bm.speed = Math.max(0, bm.speed - TUNE.coast * 2 * dt); bm.vx *= 0.8; bm.vy *= 0.8; syncMe(S); return; }
    if (S.jumpQ != null) { if (S.g.t - S.jumpQ > TUNE.jumpBuf) S.jumpQ = null; else if (S.cdJump <= 0) { tryJump(S, mx, my, true); if (S.jump) { syncMe(S); return; } } }
    if (me.push) { const P = me.push; P.t -= dt; moveBeast(S, P.vx * dt, P.vy * dt); if (P.t <= 0) me.push = null; }
    const top = TUNE.top * (me.chill > 0 ? 0.75 : 1) * (S.g.buff && S.g.buff.haste > 0 ? 1.15 : 1), mag = Math.min(1, Math.hypot(mx, my));
    if (mag > 0.12) {
      const want2 = Math.atan2(my, mx), da = wrap(want2 - bm.a), rate = lerp(TUNE.steer[0], TUNE.steer[1], cl(bm.speed / top));
      bm.a = wrap(bm.a + Math.max(-rate * dt, Math.min(rate * dt, da)));
      const thr = mag * (Math.abs(da) > 2.2 ? 0.2 : Math.abs(da) > 1.2 ? 0.55 : 1), tgt = top * thr;
      if (bm.speed < tgt) bm.speed = Math.min(tgt, bm.speed + TUNE.accel * dt); else bm.speed = Math.max(tgt, bm.speed - TUNE.overK * dt);
    } else bm.speed = Math.max(0, bm.speed - TUNE.coast * dt);
    // the gait surges: each push of the forearms throws it forward a little, it slows as the feet come through
    const surge = 1 + 0.18 * Math.sin(S.gph * TAU * 2 + 0.6) * S.gk;
    const vdx = Math.cos(bm.a) * bm.speed * surge, vdy = Math.sin(bm.a) * bm.speed * surge;
    bm.vx += (vdx - bm.vx) * Math.min(1, TUNE.grip * dt); bm.vy += (vdy - bm.vy) * Math.min(1, TUNE.grip * dt);
    if (moveBeast(S, bm.vx * dt, bm.vy * dt)) { bm.speed *= TUNE.bumpK; bm.vx *= 0.4; bm.vy *= 0.4; if (S.bumpT <= 0) { S.bumpT = 0.4; const sfx = S.X.sfx || {}; if (sfx.thud) sfx.thud(); S.absorb = Math.max(S.absorb, 0.35); } }
    syncMe(S);
  }
  /* the centre moves with the walls in the way, an axis at a time in small steps (and its nose and tail too) */
  function moveBeast(S, dx, dy) {
    const bm = S.beast, X = S.X, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.12)); let hit = false;
    const stuck = poseBlocked(S, bm.x, bm.y, bm.a, 0), bl = stuck ? (x, y) => X.blocked(x, y, FP.c, 0) : (x, y) => poseBlocked(S, x, y, bm.a, 0), cStuck = stuck && X.blocked(bm.x, bm.y, FP.c, 0);
    for (let i = 0; i < n; i++) { const sx = dx / n, sy = dy / n; bm.x += sx; if (!cStuck && bl(bm.x, bm.y)) { bm.x -= sx; hit = true; } bm.y += sy; if (!cStuck && bl(bm.x, bm.y)) { bm.y -= sy; hit = true; } }
    if (stuck && X.blocked(bm.x, bm.y, FP.c, 0)) { const p = X.walkPoint(bm.x, bm.y, { r: 0.6, x: bm.x, y: bm.y }); bm.x += (p.x - bm.x) * 0.25; bm.y += (p.y - bm.y) * 0.25; }
    return hit;
  }
  function syncMe(S) { const me = S.me, bm = S.beast; if (S.ctx.ejecting) { me.x = S.ctx.petX; me.y = S.ctx.petY; } else { me.x = bm.x; me.y = bm.y; } me.vx = bm.vx; me.vy = bm.vy; const c = Math.cos(bm.a); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; me.z = 0; }
  /* contact: the body's oval swept from its last pose to this one; one hit per pass per monster */
  function inBody(m, x, y, ab, pad) { const ag = groundA(ab), ca = Math.cos(ag), sa = Math.sin(ag), gx = m.x - x, gy = (m.y - y) / GY, lx = gx * ca + gy * sa, ly = -gx * sa + gy * ca, r = (m.r || 0.4) * 0.85 + pad; return (lx / (BODY.hl + r)) ** 2 + (ly / (BODY.hw + r)) ** 2 < 1; }
  function contact(S) {
    const bm = S.beast, t = S.g.t, sp = Math.hypot(bm.vx, bm.vy), fast = sp > TUNE.top * TUNE.contactMin, d = Math.hypot(bm.x - bm.prevX, bm.y - bm.prevY), n = Math.max(1, Math.ceil(d / 0.35));
    for (const m of S.H.living()) {
      if (Math.hypot(m.x - bm.x, m.y - bm.y) > 2.6 + (m.r || 0.4) + d) { const G = S.gate.get(m); if (G) G.inside = false; continue; }
      let touch = false; for (let i = 0; i <= n && !touch; i++) { const u = i / n; touch = inBody(m, lerp(bm.prevX, bm.x, u), lerp(bm.prevY, bm.y, u), bm.prevA + wrap(bm.a - bm.prevA) * u, 0.04); }
      let G = S.gate.get(m); if (!G) { G = { last: -9, inside: false }; S.gate.set(m, G); }
      const enter = touch && !G.inside; G.inside = touch;
      if (!enter || !fast || t - G.last < TUNE.contactGate) continue;
      G.last = t; const dealt = hitCharge(S, m, S.DK * TUNE.contact, { kb: TUNE.contactKb }); S.stats.contact++;
      impactFx(S, m.x, m.y, 0.8, dealt > 0);
      bm.speed *= m.boss ? 0.5 : 0.9; if (m.boss) { bm.vx *= 0.5; bm.vy *= 0.5; S.absorb = Math.max(S.absorb, 0.4); }
    }
  }

  /* ---- the Strongs and Judgement Day ---- */
  function tryMove(S, slot, queued) {
    const bm = S.beast, sfx = S.X.sfx || {}, mis = slot !== 'strong2', cd = mis ? S.cdM : S.cdW;
    if (S.phase !== 'ride') return;
    if (S.busy || bm.locked || S.jump || S.recover > 0) { if (!queued) { if (S.busy !== 'judge') S.mvQ = { slot, t: S.g.t }; else if (sfx.wrong) sfx.wrong(); } return; }
    if (cd > 0) { if (!queued && cd <= 0.4) S.mvQ = { slot, t: S.g.t }; return; }
    S.mvQ = null;
    const MV = moves(), fn = mis ? MV.missiles : MV.wrath; if (typeof fn !== 'function') return;
    S.busy = mis ? 'missiles' : 'wrath'; S.busyT = 0;
    if (mis) S.cdM = missileCd(); else { bm.locked = true; bm.speed = 0; bm.vx *= 0.3; bm.vy *= 0.3; }
    S.stats[mis ? 'missiles' : 'wrath']++;
    try { fn.call(MV.BM || MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Beast Machine: a move failed', e); actionDone(S); }
  }
  function tryJudge(S) {
    const X = S.X, sfx = X.sfx || {}, bm = S.beast;
    if (S.phase !== 'ride') return;
    if ((S.jump || S.busy || S.recover > 0) && !S.used && S.charge >= 1) { S.judgeQ = S.g.t; return; }   // (in the air or mid-move: on landing / when it ends)
    if (S.used || S.charge < 1 || bm.locked) { if (sfx.wrong) sfx.wrong(); X.text(S.me.x, S.me.y - 2.4, S.used ? 'Judgement Day used' : `Judgement Day ${Math.floor(S.charge * 100)}%`, ICE, 12, { life: 0.9, max: 0.9, vy: -0.6 }); return; }
    S.used = true; S.phase = 'judge'; S.t = 0; S.busy = 'judge'; S.busyT = 0; S.judgeQ = null; S.mvQ = null;
    bm.contact = false; bm.locked = true; bm.speed = 0; bm.vx = bm.vy = 0; S.ctx.judgement = true; S.stats.judge++;
    const MV = moves();
    try { MV.judgement.call(MV.BM || MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Beast Machine: Judgement Day failed', e); finish(S, 'judge'); }
  }
  function actionDone(S) {
    if (!S.busy) return;
    const kind = S.busy; S.busy = null;
    if (kind === 'judge') { finish(S, 'judge'); return; }
    if (kind === 'wrath') S.cdW = TUNE.wrathCd;   // exactly 2 s from the final strike (B2 calls done at its recoil end)
    if (S.phase === 'ride') { S.beast.locked = false; S.beast.z = 0; }
  }

  /* ---- Jump (replaces Dodge): crouch, a high planned arc, one landing shockwave, a short recovery ---- */
  function jumpReach(S) { const X = S.X; if (!X.flowAt) return null; const ok = (x, y) => X.flowAt(x, y) < 9999; return (x, y, ab) => { const ag = groundA(ab), ex = FP.e * Math.cos(ag), ey = FP.e * Math.sin(ag) * GY; return ok(x, y) || ok(x + ex, y + ey) || ok(x - ex, y - ey); }; }
  const JOFF = [0, 0.2, -0.2, 0.4, -0.4, 0.6, -0.6];
  function planJump(S, dir, d0) {
    const bm = S.beast, t0 = nowMs(); let reach = jumpReach(S); if (reach && !reach(bm.x, bm.y, bm.a)) reach = null;
    const C = [];
    for (const off of JOFF) { const a = wrap(dir + off), ca = Math.cos(a), sa = Math.sin(a); let lim = d0 + TUNE.jumpExt;
      for (let st = 0.4; st <= lim + 0.21; st += 0.2) if (poseBlocked(S, bm.x + ca * st, bm.y + sa * st, a, 1)) { lim = st - 0.45; break; }   // (walls and the map's edge stop it in the air)
      for (let st = 0; st <= lim + 1e-6; st += 0.25) C.push([(st >= d0 - 1e-6 ? st - d0 : 5 + (d0 - st) * 1.2) + Math.abs(off) * 3, st, a]); }
    C.sort((p, q) => p[0] - q[0]);
    let n = 0;
    for (const [, st, a] of C) { n++; const x = bm.x + Math.cos(a) * st, y = bm.y + Math.sin(a) * st; if (poseBlocked(S, x, y, a, 0) || (reach && !reach(x, y, a))) continue; return { x, y, a, d: st, d0, short: st < d0 - 1e-6, tried: n, ms: nowMs() - t0 }; }
    return { x: bm.x, y: bm.y, a: bm.a, d: 0, d0, short: true, none: true, tried: n, ms: nowMs() - t0 };
  }
  function tryJump(S, mx, my, queued) {
    const bm = S.beast, g = S.g, X = S.X;
    if (S.phase !== 'ride') return;
    const held = bm.locked || S.busy === 'wrath' || S.busy === 'judge' || !!S.jump || S.recover > 0;
    if (held || S.cdJump > 0) { if (!queued && (held || S.cdJump <= TUNE.jumpBuf)) S.jumpQ = g.t; return; }
    S.jumpQ = null;
    const mag = Math.hypot(mx, my), dir = mag > 0.2 ? Math.atan2(my, mx) : bm.a, P = TUNE.jumpPh;
    const v0 = Math.max(0, bm.vx * Math.cos(dir) + bm.vy * Math.sin(dir)), plan = planJump(S, dir, Math.min(TUNE.jumpMax, TUNE.jumpD + v0 * 0.35));
    S.lastPlan = plan;
    S.jump = { t: 0, F: P[0] + P[1], x0: bm.x, y0: bm.y, a0: bm.a, x1: plan.x, y1: plan.y, a1: plan.d > 0.05 ? plan.a : bm.a, h: TUNE.jumpH, contact: bm.contact, plan, noHit: false };
    bm.contact = false; S.me.airborne = true; S.me.inv = Math.max(S.me.inv || 0, TUNE.jumpInv);   // (the Dodge's short protection at take-off only)
    S.cdJump = 99; S.stats.jump++; g.movedOnce = true; g.dodges = (g.dodges || 0) + 1;
    const sfx = X.sfx || {}; if (sfx.note) { sfx.note(70, 0.18, 'triangle', 0.09, 50); sfx.note(220, 0.1, 'square', 0.02, 180, 0.02); } if (sfx.hiss) sfx.hiss(0.12, 0.06, 900);
  }
  function stepJump(S, dt) {
    const J = S.jump, bm = S.beast, P = TUNE.jumpPh, pz = bm.pose; J.t += dt;
    if (J.t < P[0]) { const u = J.t / P[0]; pz.crouch = Math.max(pz.crouch, sstep(0, 1, u)); bm.speed *= 0.85; bm.vx *= 0.85; bm.vy *= 0.85; return; }
    if (!J.air) { J.air = true; const X = S.X, sfx = X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) sfx.note(90, 0.3, 'sawtooth', 0.04, 260); dustRing(S, bm.x, bm.y, 1.4, 6); }
    const u = cl((J.t - P[0]) / P[1]);
    bm.x = lerp(J.x0, J.x1, u); bm.y = lerp(J.y0, J.y1, u); bm.vx = (J.x1 - J.x0) / P[1]; bm.vy = (J.y1 - J.y0) / P[1]; bm.speed = Math.hypot(bm.vx, bm.vy) * 0.3;
    bm.a = wrap(J.a0 + wrap(J.a1 - J.a0) * sstep(0, 0.35, u));
    bm.z = 4 * J.h * u * (1 - u);
    pz.crouch = 0; pz.legsExt = Math.sin(Math.PI * Math.min(1, u * 1.25)) * (1 - sstep(0.75, 0.95, u)); pz.handsIn = 0.75 * Math.sin(Math.PI * u);
    if (u > 0.82) pz.armLReach = pz.armRReach = 0.35 * sstep(0.82, 0.98, u);   // (reaching down for the landing)
    if (u >= 1) landJump(S);
  }
  function groundOK(S, x, y, a) { return !poseBlocked(S, x, y, a, 0); }
  function landJump(S, how) {
    const J = S.jump; if (!J) return; S.jump = null;
    const bm = S.beast, me = S.me, X = S.X;
    let x = J.x1, y = J.y1, a = J.a1;
    if (!groundOK(S, x, y, a)) { if (groundOK(S, J.x0, J.y0, J.a0)) { x = J.x0; y = J.y0; a = J.a0; } else { const p = X.walkPoint(J.x1, J.y1, { r: 0.75, x: J.x0, y: J.y0 }); x = p.x; y = p.y; } }
    bm.x = x; bm.y = y; bm.a = a; bm.z = 0; bm.speed = 0; bm.vx = bm.vy = 0; bm.contact = J.contact; me.airborne = false; me.x = x; me.y = y;
    S.cdJump = TUNE.jumpCd * (S.g.buff && S.g.buff.arcane > 0 ? 0.6 : 1) * (S.g.dodgeK || 1);   // from the landing
    if (how === 'abort') return;
    S.recover = TUNE.jumpPh[2]; S.absorb = 1; S.absV = 0;
    if (J.noHit) { dustRing(S, x, y, 1.6, 8); return; }   // (a timeout in the air: a safe, harmless landing)
    // the landing: one powerful shockwave hit per monster in reach (it charges the meter); contact is gated for them
    const t = S.g.t; let n = 0;
    for (const m of S.H.living()) { if (Math.hypot(m.x - x, m.y - y) > TUNE.jumpR + (m.r || 0.4) * 0.85) continue;
      const dealt = hitCharge(S, m, S.DK * TUNE.jump, { kb: TUNE.jumpKb }); S.stats.jumpHit++; impactFx(S, m.x, m.y, 1.1, dealt > 0, true); n++;
      const G = S.gate.get(m); if (G) { G.inside = true; G.last = t; } else S.gate.set(m, { last: t, inside: true }); }
    landFx(S, x, y, n);
  }
  function abortJump(S) { if (S.jump) landJump(S, 'abort'); if (S.me) S.me.airborne = false; }

  /* ---- the frame ---- */
  function step(S, dt) {
    const bm = S.beast, me = S.me, g = S.g, X = S.X;
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'judge')) { finish(S, 'won'); return; }
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   // (held while riding: the cooldown starts at the exit)
    S.t += dt; S.bumpT -= dt; S.cdM = Math.max(0, S.cdM - dt); S.cdW = Math.max(0, S.cdW - dt); if (!S.jump && S.cdJump < 90) S.cdJump = Math.max(0, S.cdJump - dt); S.recover = Math.max(0, (S.recover || 0) - dt);
    if (S.busy) S.busyT += dt;
    // pose: a move owns the channels while it runs; otherwise they relax home. The drawn pose eases toward them
    const pz = bm.pose; if (!S.busy && S.phase !== 'judge') for (const k of CH) if (pz[k] > 0) pz[k] = Math.max(0, pz[k] - dt * 3.5);
    if (S.jump) stepJump(S, dt);
    const ek = bm.poseSnap ? 1 : Math.min(1, dt / 0.06); for (const k of CH) S.P[k] += (pz[k] - S.P[k]) * ek; bm.poseSnap = false;
    // the landing's absorption: a damped spring back up (no wobble under Reduce Motion)
    if (calm()) S.absorb *= Math.max(0, 1 - dt * 9); else { S.absV += (-110 * S.absorb - 14 * S.absV) * dt; S.absorb = Math.max(-0.15, S.absorb + S.absV * dt); }
    // the gait: phase by distance, amplitude by speed (no stepping in the air or while a move plants it)
    const sp = Math.hypot(bm.vx, bm.vy), kt = S.jump || bm.z > 0.05 ? 0 : cl(sp / TUNE.top * 1.4); S.gk += (kt - S.gk) * Math.min(1, dt * 6);
    S.gph = (S.gph + (S.jump ? 0 : sp * dt / TUNE.stride)) % 1;
    S.ag = groundA(bm.a);
    // background baking: the heading in use first
    const bNow = bucketOf(S.ag); want((bNow + 1) % NB); want((bNow + NB - 1) % NB); want(bNow, !readyB(bNow));
    bakeStep(S.phase === 'build' ? 4.5 : readyB(bNow) ? 0.8 : 3);
    if (S.phase === 'build') {
      // the parts must be baked before they show (the cloud covers the wait, a moment at most)
      if (S.t > 0.3 && !usableB(bNow) && S.hold < 2.2) { S.hold += dt; S.t -= dt; }
      buildStep(S, dt);
      if (S.t >= TUNE.build) { S.phase = 'ride'; S.t = 0; bm.locked = false; S.left = S.dur; S.lit = 1; }
      syncMe(S);
    } else if (S.phase === 'ride') {
      S.left -= dt; S.stats.rideT += dt;
      if (S.jump && S.left <= 0) S.jump.noHit = true;   // (time ran out in the air: it lands, harmlessly, then the pop)
      if (S.left <= 0 && !S.jump && (!S.busy || S.busyT > 3)) { startOut(S); return; }
      if (S.busy && S.busyT > 9) actionDone(S);   // (a move that never reports done frees the controls anyway)
      if (bm.contact && bm.z < 0.1 && !S.jump) contact(S);
      if (S.mvQ) { const Q = S.mvQ, cdq = Q.slot !== 'strong2' ? S.cdM : S.cdW; if (g.t - Q.t > TUNE.mvHold) S.mvQ = null; else if (!S.busy && !bm.locked && !S.jump && !(S.recover > 0) && cdq <= 0) { S.mvQ = null; tryMove(S, Q.slot, true); } }
      if (S.judgeQ != null && !S.jump && !S.busy && !(S.recover > 0)) { const q = S.judgeQ; S.judgeQ = null; if (g.t - q < 1.2) tryJudge(S); }
      if (S.readyT != null) S.readyT += dt;
      gaitFx(S, dt);
    } else if (S.phase === 'judge') {
      if (S.t > (g.won ? TUNE.judgeWonCap : TUNE.judgeCap)) { finish(S, 'judge'); return; }
      syncMe(S);
    } else if (S.phase === 'out') stepOut(S, dt);
    const MV = moves(); if (MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    if (S.ignT != null && S.phase !== 'build' && S.ignT < 1) S.ignT += dt;   // (B4: the ignition current runs on past the build, then stops)
    rig(S); idleSparks(S, dt); stepParts(S, dt);
    S.fx.entY = S.ctx.ejecting ? S.ctx.petY : bm.y + 0.6;
    // a cable buzz while it moves, an occasional crackle
    S.sfxT -= dt; if (S.sfxT <= 0 && (S.phase === 'ride')) { const k = cl(sp / TUNE.top), sfx = X.sfx || {}; S.sfxT = 0.5; if (sfx.note && k > 0.15) sfx.note(98 + 30 * k, 0.5, 'sawtooth', 0.008 + 0.01 * k, 101 + 30 * k); }
    bm.prevX = bm.x; bm.prevY = bm.y; bm.prevA = bm.a;
  }
  /* heavy plants: a soft dust puff (light only) and a deep servo knock as each hand comes down */
  function gaitFx(S, dt) {
    const k = S.gk; if (k < 0.25 || S.jump) return; const R = S.R, sfx = S.X.sfx || {};
    for (let i = 0; i < 2; i++) { const w = i ? R.wrR : R.wrL, down = w.z < 0.3 * HK + 0.04, was = S.plantT[i] > 0; S.plantT[i] = down ? 1 : 0;
      if (down && !was) { const p = l2w(S, V3(w.x + 0.3, w.y, 0)); addPart(S, 8, p.x, p.y, 0.05, 0, 0, 0.2, 0.45, 0.55 * k, {}); for (let j = 0; j < (lowFx() ? 1 : 3); j++) { const a = Math.random() * TAU, v = 0.8 + Math.random(); addPart(S, 2, p.x, p.y, 0.1, Math.cos(a) * v, Math.sin(a) * v * GY, 0.6, 0.55, 0.32, { grow: 1.6, drag: 2.4, front: Math.random() < 0.5 }); }
        if (i === 0 && sfx.note) { sfx.note(52 + Math.random() * 8, 0.2, 'triangle', 0.08 * k, 38); if (sfx.hiss) sfx.hiss(0.06, 0.03, 700); } } }
    void dt;
  }

  /* ---- the construction gag ---- */
  function clank(S, f, v) { const sfx = S.X.sfx || {}; if (!sfx.note) return; sfx.note(f, 0.07, 'square', 0.035 * (v || 1), f * 0.97); sfx.note(f * 2.76, 0.09, 'triangle', 0.025 * (v || 1), f * 2.7); }
  function buildStep(S, dt) {
    const t = S.t, X = S.X, sfx = X.sfx || {}, bm = S.beast, Q = lowFx() ? 0.5 : 1, ev = S.bev || (S.bev = {});
    const once = (k, tt) => { if (ev[k] || t < tt) return false; ev[k] = 1; return true; };
    if (once('heap', 0)) { for (let i = 0; i < 6; i++) { const a = -0.5 + i * 0.2, kind = i < 3 ? 4 : i < 5 ? 5 : 7; addPart(S, kind, S.petX0 + (Math.random() - 0.5) * 1.2, S.petY0 + (Math.random() - 0.5) * 0.6, 1.6 + Math.random(), Math.cos(a) * 0.8, 0.3, -1, 0.9, kind === 4 ? 0.34 : kind === 5 ? 0.13 : 0.3, { g: 18, bounce: 0.35, spin: (Math.random() - 0.5) * 12 }); } if (sfx.note) [880, 740, 990].forEach((f, i) => sfx.note(f, 0.06, 'square', 0.03, f, i * 0.06)); }
    if (once('smoke', 0.18)) { for (let i = 0; i < Math.round(16 * Q); i++) smokePuff(S, 1.15, 1.25); if (sfx.hiss) sfx.hiss(0.35, 0.12, 500); if (sfx.pop) sfx.pop(); }
    if (t > 0.3 && t < 1.28) {
      S.bT = (S.bT || 0) - dt;
      if (S.bT <= 0) { S.bT = 0.07 + Math.random() * 0.06; const c = l2w(S, V3((Math.random() - 0.5) * 1.8, (Math.random() - 0.5) * 1.6, 0));
        if (Math.random() < 0.55) { addPart(S, 6, c.x, c.y, 0.9 + Math.random() * 1.1, 0, 0, 0, 0.22, 0.42, { tool: Math.random() < 0.6 ? 0 : 1, spin: (Math.random() < 0.5 ? -1 : 1) * 14 }); clank(S, 700 + Math.random() * 900, 0.8); if (Math.random() < 0.3 && sfx.squeak) sfx.squeak(); }
        else { const a = Math.random() * TAU, v = 3 + Math.random() * 3; addPart(S, Math.random() < 0.5 ? 4 : 5, c.x, c.y, 1 + Math.random(), Math.cos(a) * v, Math.sin(a) * v * GY, 3 + Math.random() * 2, 0.7, Math.random() < 0.5 ? 0.22 : 0.12, { g: 14, bounce: 0.3, spin: (Math.random() - 0.5) * 20 }); } }
      if (Math.random() < dt * (t > 0.85 ? 7 : 16) * Q) smokePuff(S, t > 0.85 ? 1.35 : 1.05, 0.95); }   // (B4: thinner from the head's swing on, so the domes and batteries are seen going on)
    if (once('torso', 0.36)) { clank(S, 300, 1.2); if (sfx.thud) sfx.thud(); }
    if (once('handR', 0.72)) { if (sfx.thud) sfx.thud(); if (sfx.stomp) sfx.stomp(); const w = anchor(S, 'handR'); dustRing(S, w.x, w.y, 1.0, 5); if (!calm()) X.shake(3, 0.1); }
    if (once('handL', 0.88)) { clank(S, 420); if (sfx.thud) sfx.thud(); }
    if (once('head', 0.98)) { clank(S, 560, 1.2); if (sfx.note) sfx.note(180, 0.18, 'sawtooth', 0.04, 120); }
    if (once('shield', 1.06)) { clank(S, 820, 1.4); clank(S, 1040, 1.2); }
    if (once('cannon', 1.12)) { if (sfx.note) { sfx.note(300, 0.22, 'square', 0.03, 520); sfx.note(1200, 0.08, 'square', 0.025, 1150, 0.18); } }
    if (t > 1.12 && t < 1.32 && Math.random() < 0.6) clank(S, 1500 + Math.random() * 400, 0.35);   // (the loose panel rattling)
    if (once('panel', 1.32)) clank(S, 1250, 1.3);
    if (once('clunk', 1.38)) { if (sfx.thud) sfx.thud(); if (sfx.stomp) sfx.stomp(); if (sfx.note) sfx.note(70, 0.45, 'sawtooth', 0.09, 40); if (!calm()) X.shake(4.5, 0.16);
      const a = anchor(S, 'cannonL'), b = anchor(S, 'chest'); S.zap.push({ a: [a.x, a.y, a.z], b: [b.x, b.y, b.z], t: 0, life: 0.2, w: 1.4, seed: 3 }); if (sfx.hiss) sfx.hiss(0.08, 0.1, 5000);
      for (const p of S.parts) if (p.kind === 2) { const dx = p.x - bm.x, dy = p.y - bm.y, l = Math.hypot(dx, dy) || 1; p.vx += dx / l * 3.5; p.vy += dy / l * 3.5; p.life = Math.min(p.life, 0.45); p.max = Math.max(p.max, 0.5); }
      for (let i = 0; i < Math.round(12 * Q); i++) smokePuff(S, 1.5, 0.5, 3.5); }
    if (once('hop', 1.45) && sfx.jump) sfx.jump();
    if (once('ignite', 1.62)) { S.ignT = 0; if (sfx.note) { sfx.note(110, 0.4, 'sawtooth', 0.04, 220); sfx.note(880, 0.25, 'square', 0.02, 1760, 0.1); } if (sfx.hiss) sfx.hiss(0.25, 0.06, 3800); }
    if (S.ignT != null) { S.ignT += dt; S.lit = cl(S.ignT / 0.22); bm.pose.glow = Math.max(bm.pose.glow, S.lit * (1 - sstep(0.15, 0.25, S.ignT)) ); }
  }
  function smokePuff(S, R, life, out) { const bm = S.beast, a = Math.random() * TAU, r = Math.sqrt(Math.random()) * R, ag = S.ag, lx = Math.cos(a) * r * 1.1, ly = Math.sin(a) * r, p = l2w(S, V3(lx, ly, 0)), v = out || 0.35;
    addPart(S, 2, p.x, p.y, 0.3 + Math.random() * 1.3, Math.cos(a) * v * Math.cos(ag) - Math.sin(a) * v * Math.sin(ag), (Math.cos(a) * v * Math.sin(ag) + Math.sin(a) * v * Math.cos(ag)) * GY, 0.25, life * (0.75 + Math.random() * 0.5), 0.55 + Math.random() * 0.35, { grow: 0.8, drag: 1.5, front: (lx * Math.sin(ag) + ly * Math.cos(ag)) > 0.1, dense: 1 }); void bm; }

  /* ---- exits ---- */
  function startOut(S) {
    if (S.phase === 'out') return; abortJump(S);
    S.phase = 'out'; S.t = 0; const bm = S.beast; bm.locked = true; bm.contact = false; bm.speed = 0; bm.vx = bm.vy = 0;
    const s = anchor(S, 'seat'); S.petStand = nearestStand(S, s.x + 0.9, s.y + 0.6); S.seatW = s;
    const sfx = S.X.sfx || {}; if (sfx.note) [330, 260, 200].forEach((f, i) => sfx.note(f, 0.12, 'square', 0.035, f * 0.9, i * 0.07));
  }
  function stepOut(S, dt) {
    const u = S.t / TUNE.out, bm = S.beast, sfx = S.X.sfx || {};
    bm.pose.shudder = u < 0.45 ? 1 : 0; bm.pose.glow = u < 0.45 ? 0.6 + 0.4 * Math.sin(S.t * 40) : 0;
    if (u >= 0.45 && !S.popped) { S.popped = true; popFx(S, 0.8); if (sfx.pop) sfx.pop(); if (sfx.hiss) sfx.hiss(0.2, 0.08, 2500); if (sfx.squeak) sfx.squeak(); }
    S.me.x = S.petStand.x; S.me.y = S.petStand.y; S.me.vx = S.me.vy = 0;
    if (u >= 1) release(S); void dt;
  }
  /* a compact cartoon cloud of smoke, loose bolts and sparks (harmless) */
  function popFx(S, k) { const bm = S.beast, Q = lowFx() ? 0.45 : 1;
    for (let i = 0; i < Math.round(14 * Q * k); i++) smokePuff(S, 1.1 * k, 0.6, 2.5 * k);
    for (let i = 0; i < Math.round(10 * Q * k); i++) { const a = Math.random() * TAU, v = 2.5 + Math.random() * 3; addPart(S, Math.random() < 0.5 ? 5 : 4, bm.x, bm.y, 1 + Math.random(), Math.cos(a) * v, Math.sin(a) * v * GY, 3 + Math.random() * 2, 0.7, Math.random() < 0.6 ? 0.12 : 0.2, { g: 14, bounce: 0.3, spin: (Math.random() - 0.5) * 20 }); }
    for (let i = 0; i < Math.round(12 * Q * k); i++) { const a = Math.random() * TAU, v = 3 + Math.random() * 4; addPart(S, 1, bm.x, bm.y, 1 + Math.random(), Math.cos(a) * v, Math.sin(a) * v * GY, 2 + Math.random() * 2, 0.35, 0.3, { g: 6, drag: 1.5, col: Math.random() < 0.5 ? WHITE : CYAN }); }
    S.X.light(bm.x, bm.y, 2.4, 0.16); if (!calm()) S.X.shake(2.5, 0.1); }
  function finish(S, how) {
    if (S.released) return; abortJump(S); S.outHow = how;
    if (how === 'judge') { const c = S.ctx, p = nearestStand(S, c.ejecting ? c.petX : S.beast.x, c.ejecting ? c.petY : S.beast.y); S.me.x = p.x; S.me.y = p.y; }
    else if (how !== 'defeat') { const s = anchor(S, 'seat'), p = nearestStand(S, s.x, s.y); S.me.x = p.x; S.me.y = p.y; }
    if (how !== 'judge' && S.beast.vis > 0.05 && !S.beast.gone && S.phase !== 'out') { popFx(S, 0.6); S.fade = 0.25; }
    release(S);
  }
  function release(S) {
    if (S.released) return;
    S.released = true; S.ended = true; S.relT = 0;
    const me = S.me, g = S.g, X = S.X;
    if (S.phase === 'out' && S.petStand) { me.x = S.petStand.x; me.y = S.petStand.y; }
    abortJump(S); me.airborne = false;
    S.phase = 'gone'; S.busy = null; S.mvQ = null; S.judgeQ = null; S.jumpQ = null;
    const c0 = S.ctx; if (c0) { c0.ejecting = false; c0.judgement = false; c0.petZ = 0; } S.beast.locked = true; S.beast.contact = false;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0;
    g.cdU = S.CD;   // the cooldown starts now, once
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.gate.clear(); S.zap.length = 0;
    S.fx.life = 1.6; S.fx.onEnd = null;
  }

  /* ---- pooled particles: 1 spark, 2 smoke puff, 3 chip, 4 gear, 5 nut, 6 tool silhouette, 7 panel, 8 floor dust (light), 9 electric floor ring ---- */
  const CAP = 260;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) {
    if (S.parts.length >= CAP * (lowFx() ? 0.45 : 1)) return null;
    const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.rot = Math.random() * TAU; p.vr = (o && o.spin) || (Math.random() - 0.5) * 3;
    p.g = (o && o.g) || 0; p.drag = (o && o.drag) || 0; p.grow = (o && o.grow) || 0; p.col = (o && o.col) || null; p.front = !!(o && o.front); p.bounce = (o && o.bounce) || 0; p.tool = (o && o.tool) || 0; p.dense = (o && o.dense) || 0; p.steam = (o && o.steam) || 0;
    S.parts.push(p); return p;
  }
  function stepParts(S, dt) {
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts[i] = S.parts[S.parts.length - 1]; S.parts.pop(); S.free.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.z < 0) { p.z = 0; p.vz = p.bounce ? Math.abs(p.vz) * p.bounce : 0; if (p.bounce) { p.vx *= 0.6; p.vy *= 0.6; p.vr *= 0.6; } } p.rot += p.vr * dt; }
    for (let i = S.zap.length - 1; i >= 0; i--) { const z = S.zap[i]; z.t += dt; if (z.t > z.life) S.zap.splice(i, 1); }
  }
  function dustRing(S, x, y, r, n) { const Q = lowFx() ? 0.4 : 1; addPart(S, 8, x, y, 0.02, 0, 0, 0, 0.5, r, {}); for (let i = 0; i < Math.round(n * Q); i++) { const a = i / n * TAU + Math.random() * 0.4, v = 1.5 + Math.random() * 1.5; addPart(S, 2, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5 * GY, 0.05, Math.cos(a) * v, Math.sin(a) * v * GY, 0.2, 0.55, 0.3 + Math.random() * 0.15, { grow: 1.5, drag: 2.5, front: Math.sin(a) > 0 }); } }
  function impactFx(S, x, y, k, landed, quiet) {
    const X = S.X, Q = lowFx() ? 0.4 : 1;
    for (let i = 0; i < Math.round((landed ? 7 : 3) * k * Q); i++) { const a = Math.random() * TAU, v = 3 + Math.random() * 4; addPart(S, 1, x, y, 0.4, Math.cos(a) * v, Math.sin(a) * v * GY, (Math.random() - 0.2) * 4, 0.25 + Math.random() * 0.2, 0.26, { g: 6, drag: 2, col: i % 3 ? WHITE : i % 2 ? CYAN : GOLD }); }
    S.zap.push({ a: [x - 0.5 + Math.random(), y - 0.4, 1.2], b: [x, y, 0.3], t: 0, life: 0.12, w: 1, seed: (Math.random() * 999) | 0 });
    X.light(x, y, 1.8 * k, 0.14);
    if (quiet) return; if (!calm()) X.shake(2.2, 0.08); const sfx = X.sfx || {}; if (sfx.thud) sfx.thud(); if (sfx.hiss) sfx.hiss(0.05, 0.06, 4200);
  }
  /* the landing: limbs absorb, a big electric ring runs out, branching lightning round it, fragments, sparks, a boom */
  function landFx(S, x, y, n) {
    const X = S.X, Q = lowFx() ? 0.4 : 1, R = TUNE.jumpR;
    addPart(S, 9, x, y, 0, 0, 0, 0, 0.55, R * 1.08, {}); addPart(S, 8, x, y, 0.02, 0, 0, 0, 0.6, R * 0.9, {});
    for (let i = 0; i < Math.round(8 * Q); i++) { const a = i / 8 * TAU + Math.random() * 0.4; S.zap.push({ a: [x + Math.cos(a) * 0.9, y + Math.sin(a) * 0.9, 0.05], b: [x + Math.cos(a) * R, y + Math.sin(a) * R, 0.05], t: 0, life: 0.2 + Math.random() * 0.1, w: 1.2, seed: (Math.random() * 999) | 0, floor: 1 }); }
    for (let i = 0; i < Math.round(12 * Q); i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 3.5; addPart(S, 3, x + Math.cos(a) * 1.0, y + Math.sin(a) * 0.8, 0.1, Math.cos(a) * v, Math.sin(a) * v * GY, 3 + Math.random() * 3, 0.7 + Math.random() * 0.3, 0.07 + Math.random() * 0.06, { g: 14, bounce: 0.25, spin: (Math.random() - 0.5) * 18 }); }
    for (let i = 0; i < Math.round(14 * Q); i++) { const a = Math.random() * TAU, v = 4 + Math.random() * 4; addPart(S, 1, x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.6, 0.2, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 3, 0.3 + Math.random() * 0.25, 0.3, { g: 7, drag: 1.8, col: i % 3 ? WHITE : CYAN }); }
    dustRing(S, x, y, 1.8, 10);
    X.light(x, y, 3.4, 0.22); if (!calm()) { X.shake(n ? 6 : 4.5, 0.18); if (n && X.hitstop) X.hitstop(0.05); }
    const sfx = X.sfx || {}; if (sfx.thud) sfx.thud(); if (sfx.stomp) sfx.stomp(); if (sfx.crash) sfx.crash(); if (sfx.note) { sfx.note(62, 0.5, 'sawtooth', 0.12, 32); sfx.note(1700, 0.16, 'square', 0.025, 500, 0.02); } if (sfx.hiss) sfx.hiss(0.25, 0.1, 3800);
  }
  /* sparse idle sparks between cables, fittings and cannon mounts (more as the machine gathers charge) */
  /* (B4: arcs crackle round the batteries and down the forearms, as in the concept; soft steam puffs vent at the elbows) */
  const SPK = [['muzzleL0', 'cannonL'], ['muzzleR0', 'cannonR'], ['muzzleL2', 'muzzleL1'], ['muzzleR2', 'muzzleR1'], ['elbowL', 'handL'], ['elbowR', 'handR'], ['cannonL', 'seat'], ['cannonR', 'seat'], ['eyes', 'chest']];
  function idleSparks(S, dt) {
    if (S.phase === 'gone' || S.beast.vis < 0.3 || S.beast.gone || !S.lit) return; const ch = S.P.charge;
    S.steamT = (S.steamT == null ? 1 : S.steamT) - dt; if (S.steamT <= 0 && S.phase !== 'out') { S.steamT = 1.1 + Math.random() * 1.6; const e = anchor(S, Math.random() < 0.5 ? 'elbowL' : 'elbowR'); for (let i = 0; i < (lowFx() ? 1 : 2); i++) addPart(S, 2, e.x + (Math.random() - 0.5) * 0.2, e.y + (Math.random() - 0.5) * 0.1, e.z + 0.1, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.3, 0.9, 0.7 + Math.random() * 0.4, 0.22 + Math.random() * 0.1, { grow: 1.6, drag: 1.2, steam: 1, front: true }); }
    S.sparkT -= dt * (1 + ch * 10) * (lowFx() ? 0.5 : 1); if (S.sparkT > 0) return; S.sparkT = 0.7 + Math.random() * 1.0;
    const pr = SPK[(Math.random() * SPK.length) | 0], a = anchor(S, pr[0]), b = anchor(S, pr[1]), u = 0.35 + Math.random() * 0.45;
    S.zap.push({ a: [a.x, a.y, a.z], b: [lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u)], t: 0, life: 0.1 + Math.random() * 0.06, w: 0.7, seed: (Math.random() * 999) | 0 });
    const sfx = S.X.sfx || {}; if (sfx.hiss && Math.random() < 0.5) sfx.hiss(0.04, 0.025, 5000);
  }

  /* ================= drawing ================= */
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), bm = S.beast;
    drawFloorParts(S, c, T);
    if (S.phase !== 'gone' && bm.vis > 0.01 && !bm.gone && SM2) {
      const X0 = H.sx(bm.x), Y0 = H.sy(bm.y), a0 = S.phase === 'build' ? cl((S.t - 0.3) / 0.3) : S.phase === 'out' ? 1 - cl((S.t / TUNE.out - 0.45) / 0.1) : 1, zk = cl(bm.z / 2.5);
      c.save(); c.translate(X0, Y0); c.scale(1, GY); c.rotate(S.ag); c.globalAlpha = 0.85 * a0 * bm.vis * (1 - zk * 0.5); const w = T * VIS * (1.85 - zk * 0.5), h = T * VIS * 1.55 * (1 - zk * 0.4); c.drawImage(SM2.shadow, -w, -h, w * 2, h * 2); c.restore();
      // the landing marker: a ring of electric light where the jump will land, closing in as it comes down
      if (S.jump && SM2.ring) { const J = S.jump, u = cl(J.t / J.F), r = T * (TUNE.jumpR * 0.9 - 0.9 * u), lx = H.sx(J.x1), ly = H.sy(J.y1); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6 * sstep(0, 0.25, u); c.drawImage(SM2.ring, lx - r, ly - r * GY, r * 2, r * 2 * GY); c.globalAlpha *= 0.35; blitSized(c, glowSprite(EBLUE), lx - r * 0.7, ly - r * 0.7 * GY, r * 1.4, r * 1.4 * GY); c.restore(); }
      // the fittings' faint crimson and the cable glow on the floor under it (light only)
      if (S.lit) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (0.12 + 0.18 * S.P.charge + 0.08 * S.P.glow) * a0 * (1 - zk); blitSized(c, glowSprite(S.P.charge > 0.2 ? EBLUE : '#FF6A50'), X0 - T * 1.6, Y0 - T * 1.1, T * 3.2, T * 2.2); c.restore(); }
    }
    callM(S, c, 'drawUnder');
  }
  function callM(S, c, k) { const MV = moves(); if (MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  function drawFloorParts(S, c, T) { const H = S.H; if (!SM2) return; c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind !== 8 && p.kind !== 9) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) * (1 - u) * (1 - u), r = T * p.s * (0.25 + 0.75 * e), X = H.sx(p.x), Y = H.sy(p.y);
      if (p.kind === 9) { c.globalAlpha = Math.pow(1 - u, 1.3); c.drawImage(SM2.ring, X - r, Y - r * GY, r * 2, r * 2 * GY); }
      else { c.globalAlpha = 0.35 * (1 - u); c.drawImage(SM2.dust, X - r, Y - r * GY, r * 2, r * 2 * GY); } }
    for (const z of S.zap) if (z.floor) drawZap(S, c, T, z);
    c.restore(); }
  function drawZap(S, c, T, z) { if (!TKK) return; const H = S.H, a = 1 - z.t / z.life; TKK.arc(c, H.sx(z.a[0]), H.sy(z.a[1]) - z.a[2] * ZK * T, H.sx(z.b[0]), H.sy(z.b[1]) - z.b[2] * ZK * T, z.seed + Math.floor(z.t * 30), T * 0.045 * z.w, a, { forks: lowFx() ? 0 : 2 }); }
  /* the machine and the rider, depth sorted part by part */
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), bm = S.beast;
    if (S.ctx.ejecting && !S.released) { if (bm.vis > 0.01 && !bm.gone) drawMachine(S, c, T, false); H.X.drawPetAt(c, H.sx(S.ctx.petX), H.sy(S.ctx.petY) - S.ctx.petZ * ZK * T, {}); drawSmoke(S, c, T, true); return; }
    if (S.released) { if (S.fade && S.relT < S.fade) { c.save(); c.globalAlpha = 1 - S.relT / S.fade; drawMachine(S, c, T, false); c.restore(); } drawSmoke(S, c, T, false); drawSmoke(S, c, T, true); return; }
    drawSmoke(S, c, T, false);
    if (bm.vis > 0.01 && !bm.gone) drawMachine(S, c, T, true); else drawPetOnly(S, c, T);
    drawSmoke(S, c, T, true);
  }
  function petScreen(S, T) {
    const H = S.H, bm = S.beast, s = l2w(S, S.R.seat); let X = H.sx(s.x), Y = H.sy(s.y) - s.z * ZK * T, a = 1;
    // the rider's restrained sway with the gait (flat 2D: a little side-to-side and a settle at each step)
    const k = S.gk; X += Math.sin(S.gph * TAU) * T * 0.035 * k; Y += Math.abs(Math.cos(S.gph * TAU * 2)) * T * 0.025 * k;
    if (S.phase === 'build') { const t = S.t, gx = H.sx(S.petX0), gy = H.sy(S.petY0);
      if (t < 0.36) { const u = sstep(0.22, 0.36, t); return [lerp(gx, H.sx(bm.x), u * 0.6), gy - Math.sin(u * Math.PI) * T * 0.5, 1 - u]; }
      if (t < 1.42) return [X, Y, 0];
      const st = S.petStand, sx2 = H.sx(st.x) + T * 0.9, sy2 = H.sy(st.y) + T * 0.3, u = sstep(1.42, 1.66, t); X = lerp(sx2, X, u); Y = lerp(sy2, Y, u) - Math.sin(u * Math.PI) * T * 1.1; a = sstep(1.38, 1.46, t); }
    if (S.phase === 'out') { const u = sstep(0.4, 0.9, S.t / TUNE.out), gx = H.sx(S.petStand.x), gy = H.sy(S.petStand.y); X = lerp(X, gx, u); Y = lerp(Y, gy, u) - Math.sin(u * Math.PI) * T * 0.9; }
    return [X, Y, a];
  }
  function drawPetOnly(S, c, T) { const p = petScreen(S, T); if (p[2] > 0.01) S.H.X.drawPetAt(c, p[0], p[1], { maxH: 1.1, alpha: p[2] < 1 ? p[2] : undefined }); }
  function itemAt(S) { const I = S.items[S.nItems] || (S.items[S.nItems] = {}); S.nItems++; I.p = null; I.q = null; I.r = 0; I.name = ''; I.a = 1; I.o = null; I.side = 0; I.cap = null; I.dir = null; I.cannon = 0; return I; }
  function drawMachine(S, c, T, withPet) {
    const R = S.R, bm = S.beast; S.nItems = 0;
    const out = S.phase === 'out' ? cl((S.t / TUNE.out - 0.45) / 0.08) : 0, vis = bm.vis * (1 - out);
    if (vis <= 0.01) { if (withPet) drawPetOnly(S, c, T); return; }
    const oT = buildOff(S, 'torso'), oL = buildOff(S, 'leg'), oH = buildOff(S, 'head'), oC = buildOff(S, 'cannon');
    const add = (kind, d, set) => { const I = itemAt(S); I.kind = kind; I.d = d; set(I); };
    const off3 = (p, o) => o ? V3(p.x + o.dx, p.y + o.dy, p.z + o.dz) : p;
    const mid = (a, b, u) => V3(lerp(a.x, b.x, u), lerp(a.y, b.y, u), lerp(a.z, b.z, u));
    add('shell', depthOf(S, R.torso), I => { I.name = 'torso'; I.p = off3(R.torso, oT); I.a = oT.a; });
    add('shell', depthOf(S, V3(R.neck.x + 0.35, R.neck.y, R.neck.z - 0.1)), I => { I.name = 'head'; I.p = off3(R.neck, oH); I.a = oH.a; });
    for (const s of [-1, 1]) { const L = s < 0, sx = L ? 'L' : 'R', oA = buildOff(S, 'arm', L ? -1 : 1), oS = buildOff(S, 'shield', s);
      const sh = R['sh' + sx], el = off3(R['el' + sx], { dx: 0, dy: 0, dz: oA.dz * 0.5 }), wr = off3(R['wr' + sx], oA), hp = off3(R['hp' + sx], oL), kn = off3(R['kn' + sx], oL), an = off3(R['an' + sx], oL), sd = R['sd' + sx];
      add('shell', depthOf(S, V3(sd.x, sd.y + s * 0.1, sd.z)), I => { I.name = L ? 'shieldL' : 'shieldR'; I.p = off3(sd, oS); I.a = oS.a; I.o = oS; });
      add('seg', depthOf(S, mid(sh, el, 0.5)) - 0.12, I => { I.name = 'uarm'; I.p = sh; I.q = el; I.a = oA.a; });
      add('seg', depthOf(S, mid(el, wr, 0.5)), I => { I.name = 'farm'; I.p = el; I.q = wr; I.a = oA.a; });
      add('piston', depthOf(S, mid(sh, wr, 0.5)) - 0.06, I => { I.p = V3(sh.x + 0.12, sh.y + s * 0.05, sh.z - 0.2); I.q = V3(lerp(el.x, wr.x, 0.4), lerp(el.y, wr.y, 0.4) - s * 0.18, lerp(el.z, wr.z, 0.4) - 0.05); I.a = oA.a; });
      add('joint', depthOf(S, el) + 0.01, I => { I.p = el; I.r = 0.2; I.a = oA.a; });
      add('shell', depthOf(S, V3(wr.x + 0.3 * HK, wr.y, wr.z - 0.12)), I => { I.name = 'hand'; I.p = wr; I.a = oA.a; });
      add('seg', depthOf(S, mid(hp, kn, 0.5)), I => { I.name = 'thigh'; I.p = hp; I.q = kn; I.a = oL.a; });
      add('seg', depthOf(S, mid(kn, an, 0.5)), I => { I.name = 'shin'; I.p = kn; I.q = an; I.a = oL.a; });
      add('joint', depthOf(S, kn) + 0.01, I => { I.p = kn; I.r = 0.13; I.a = oL.a; });
      add('shell', depthOf(S, V3(an.x + 0.1, an.y, an.z - 0.05)), I => { I.name = 'foot'; I.p = an; I.a = oL.a; });
      // ribbed violet cables looping from the body to the elbow and down the forearm
      add('cable', depthOf(S, mid(el, R.torso, 0.5)) - 0.04, I => { I.p = V3(R.torso.x + 0.38, s * 0.5, R.torso.z - 0.2 + oT.dz); I.q = el; I.a = oA.a * oT.a; I.side = s; I.sag = 0.32; });
      add('cable', depthOf(S, mid(el, wr, 0.5)) + 0.02, I => { I.p = V3(lerp(el.x, sh.x, 0.3), el.y + s * 0.02, el.z + 0.12); I.q = mid(el, wr, 0.75); I.a = oA.a; I.side = -s; I.sag = 0.18; });
      // the battery: its housing on the dome, three barrels with their mouths
      { const mt = R['mt' + sx], dir = R['d' + sx], B = R['b' + sx], mtO = off3(mt, oS);
        add('shell', depthOf(S, mt) - 0.02, I => { I.name = 'housing'; I.p = mtO; I.a = oS.a; I.o = oS; });
        if (oC.a > 0.01) for (let i = 0; i < 3; i++) { const b = B[i]; add('seg', depthOf(S, mid(b.a, b.b, 0.55)) + 0.002 * i, I => { I.name = 'barrel'; I.p = b.a; I.q = b.b; I.a = oC.a; I.cap = 'bore'; I.dir = dir; I.side = s; }); } } }
    // the loose hex plate (construction): rattling on the left dome's side, then locking flat
    if (S.phase === 'build' && S.t > 1.04 && S.t < 1.4) add('panel', depthOf(S, V3(R.sdL.x, R.sdL.y - 0.5, R.sdL.z)) + 0.3, () => {});
    const Lt = S.items, n = S.nItems; for (let i = 1; i < n; i++) { const it = Lt[i]; let j = i - 1; while (j >= 0 && Lt[j].d > it.d) { Lt[j + 1] = Lt[j]; j--; } Lt[j + 1] = it; }
    const b = bucketOf(S.ag);
    c.save(); c.globalAlpha = vis;
    for (let i = 0; i < n; i++) { const it = Lt[i]; if (it.a <= 0.01) continue;
      if (it.kind === 'shell') drawShell(S, c, T, it, b, vis);
      else if (it.kind === 'seg') drawSeg(S, c, T, it, vis);
      else if (it.kind === 'joint') drawJoint(S, c, T, it.p, it.r, it.a * vis);
      else if (it.kind === 'piston') drawPiston(S, c, T, it, vis);
      else if (it.kind === 'cable') drawCable(S, c, T, it, vis);
      else if (it.kind === 'panel') drawPanel(S, c, T); }
    c.restore();
    drawLights(S, c, T, vis);
    // the rider last: always in clear view between the batteries (upright, its own sprite)
    if (withPet) drawPetOnly(S, c, T);
  }
  const scrOf = (S, p, T) => { const w = l2w(S, p); return [S.H.sx(w.x), S.H.sy(w.y) - w.z * ZK * T]; };
  function drawShell(S, c, T, it, b, vis) {
    const name = it.name; let spr = BK.spr[name][b], rb = b;
    if (!spr) { if (BK.lo[name][b]) spr = BK.lo[name][b]; else { rb = nearestReady(name, b); if (rb < 0) { for (let d = 0; d <= NB / 2 && !spr; d++) { spr = BK.lo[name][(b + d) % NB] || BK.lo[name][(b - d + NB) % NB]; if (spr) rb = BK.lo[name][(b + d) % NB] ? (b + d) % NB : (b - d + NB) % NB; } if (!spr) return; } else spr = BK.spr[name][rb]; } }
    if (!spr.cv || !SM2) return;
    const [X, Y] = scrOf(S, it.p, T), kk = T / spr.k * (S.beast.scale || 1) * VIS * (it.o ? it.o.sc : 1), res = wrap(S.ag - rb / NB * TAU), cr = Math.cos(res), sr = Math.sin(res);
    // (contact occlusion between the pieces: a soft dark pool just under a dome, a battery housing or the head)
    const occ = OCC[name]; if (occ && SM2 && SM2.occ) { const r = T * VIS * (S.beast.scale || 1) * occ; c.save(); c.globalAlpha = 0.5 * it.a * vis; c.drawImage(SM2.occ, X - r, Y - r * 0.55 + r * 0.25, r * 2, r * 1.1); c.restore(); }
    c.save(); c.globalAlpha = it.a * vis; c.translate(X, Y); c.transform(cr, GY * sr, -sr / GY, cr, 0, 0);
    if (name === 'torso' && S.phase === 'build' && S.t < 1.38) c.rotate(Math.sin(S.t * 47) * 0.012);   // (it rattles while it is put together)
    c.drawImage(spr.cv, spr.x * kk, spr.y * kk, spr.cv.width * kk, spr.cv.height * kk); c.restore();
  }
  const OCC = { shieldL: 0.62, shieldR: 0.62, housing: 0.42, head: 0.5 };
  const LSX = -0.45, LSY = -0.89;
  /* a piece laid along its bone: the side-on picture turned onto the bone, stretched along it, lit side up */
  function drawSegImg(c, spr, ax, ay, bx, by, kk, a) {
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy); if (len < 0.5) return; const phi = Math.atan2(dy, dx), sg = LSX * Math.sin(phi) - LSY * Math.cos(phi) < 0 ? -1 : 1;
    c.save(); c.globalAlpha = a; c.translate(ax, ay); c.rotate(phi); c.scale(len / (spr.L * spr.k), sg * kk); c.drawImage(spr.cv, spr.x, spr.y); c.restore();
  }
  function drawSeg(S, c, T, it, vis) {
    const spr = BK.seg[it.name]; if (!spr || !spr.cv) return; const [ax, ay] = scrOf(S, it.p, T), [bx, by] = scrOf(S, it.q, T), sc = (S.beast.scale || 1) * VIS, kk = T * sc / spr.k;
    const ag = S.ag, D = it.dir; let facing = 0; if (D) { const vx = VY * Math.sin(ag), vy = VY * Math.cos(ag); facing = D.x * vx + D.y * vy + D.z * VZ; }
    drawSegImg(c, spr, ax, ay, bx, by, kk, it.a * vis);
    if (it.cap && facing > 0.02) { const r = 0.124 * T * sc, mr = r * facing, phi = Math.atan2(by - ay, bx - ax); c.save(); c.globalAlpha = it.a * vis; c.translate(bx, by); c.rotate(phi); c.drawImage(SM2.bore, -mr, -r, mr * 2, r * 2);
      // barrel interiors brighten when the bank tilts, braces or fires
      const P = S.P, gl = Math.max(P.cannonTilt * 0.6, it.side < 0 ? P.recoilL : P.recoilR, P.charge * 0.5); if (gl > 0.03) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = gl * vis; blitSized(c, glowSprite(CYAN), -mr * 1.3, -r * 1.3, mr * 2.6, r * 2.6); }
      c.restore(); }
  }
  function drawJoint(S, c, T, p, r, a) { const spr = BK.seg.joint; if (!spr || !spr.cv || a <= 0.01) return; const [x, y] = scrOf(S, p, T), kk = T * (S.beast.scale || 1) * VIS / spr.k * (r / 0.16); c.save(); c.globalAlpha = a; c.translate(x, y); c.scale(kk, kk); c.drawImage(spr.cv, spr.x, spr.y); c.restore(); }
  function drawPiston(S, c, T, it, vis) { const rod = BK.seg.rod, sl = BK.seg.sleeve; if (!rod || !sl || !rod.cv || !sl.cv) return; const [ax, ay] = scrOf(S, it.p, T), [bx, by] = scrOf(S, it.q, T), dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy); if (len < 1) return;
    const sc = (S.beast.scale || 1) * VIS, kk = T * sc / rod.k, L2 = Math.min(len * 0.62, 0.45 * T * sc);
    drawSegImg(c, rod, ax, ay, bx, by, kk, it.a * vis); drawSegImg(c, sl, ax, ay, ax + dx / len * L2, ay + dy / len * L2, kk, it.a * vis); }
  function drawCable(S, c, T, it, vis) { const [ax, ay] = scrOf(S, it.p, T), [bx, by] = scrOf(S, it.q, T), sc = VIS * (S.beast.scale || 1), sag = T * sc * ((it.sag || 0.25) + 0.05 * Math.sin(S.g.t * 3 + it.side)) + S.gk * T * 0.05 * Math.sin(S.gph * TAU * 2), mx = (ax + bx) / 2, my = (ay + by) / 2 + sag;
    const w = T * sc * 0.085;
    c.save(); c.globalAlpha = it.a * vis; c.lineCap = 'round'; c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by);
    c.strokeStyle = '#140A1E'; c.lineWidth = w * 1.25; c.stroke(); c.strokeStyle = '#4A2A6E'; c.lineWidth = w; c.stroke();
    c.strokeStyle = '#7A56B0'; c.lineWidth = w * 0.45; c.setLineDash([]); c.stroke();
    c.strokeStyle = 'rgba(20,8,30,.75)'; c.lineWidth = w * 1.05; c.lineCap = 'butt'; c.setLineDash([w * 0.22, w * 0.42]); c.stroke(); c.setLineDash([]);
    c.strokeStyle = 'rgba(214,190,255,.5)'; c.lineWidth = w * 0.16; c.save(); c.translate(-w * 0.18, -w * 0.22); c.beginPath(); c.moveTo(ax, ay); c.quadraticCurveTo(mx, my, bx, by); c.stroke(); c.restore();
    // electricity running along the cables at ignition (and while it gathers charge)
    const run = S.ignT != null && S.ignT < 0.3 ? S.ignT / 0.3 : S.P.charge > 0.3 ? (S.g.t * 1.7 + it.side * 0.3) % 1 : -1;
    if (run >= 0) { const u = run, x = (1 - u) * (1 - u) * ax + 2 * u * (1 - u) * mx + u * u * bx, y = (1 - u) * (1 - u) * ay + 2 * u * (1 - u) * my + u * u * by, r = T * 0.22; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9; blitSized(c, glowSprite(CYAN), x - r, y - r, r * 2, r * 2); blitSized(c, glowSprite(WHITE), x - r * 0.4, y - r * 0.4, r * 0.8, r * 0.8); }
    c.restore(); }
  function drawPanel(S, c, T) { if (!SM2) return; const t = S.t, R = S.R, p = scrOf(S, V3(R.sdL.x + 0.05, R.sdL.y - 0.42, R.sdL.z + 0.05), T), lock = t > 1.32, w = T * 0.36, h = T * 0.32;
    c.save(); c.translate(p[0], p[1]); c.rotate(lock ? 0 : Math.sin(t * 70) * 0.35 + 0.25); c.globalAlpha = lock ? 1 - cl((t - 1.32) / 0.08) : 1; c.drawImage(SM2.panel, -w / 2, -h / 2, w, h); c.restore(); }
  /* the eyes and crimson fittings: a faint pulse of stored power; brighter with pose.glow */
  const GEMS = (() => { const L = []; L.push(['torso', TG.front.c, 0.75]); L.push(['torso', [SEAT.x + 0.215, 0.17, SEAT.z + 0.19], 0.55]); L.push(['torso', [SEAT.x + 0.215, -0.17, SEAT.z + 0.19], 0.55]); for (const s of [-1, 1]) { L.push(['sd' + (s < 0 ? 'L' : 'R'), [0.36, s * 0.3, -0.02], 1]); L.push(['mt' + (s < 0 ? 'L' : 'R'), [0.2, 0, 0.02], 0.7]); } return L; })();
  function drawLights(S, c, T, vis) {
    if (!S.lit || vis < 0.05) return; const P = S.P, t = S.g.t, base = 0.35 + 0.12 * Math.sin(t * 2.6), gl = cl(base * S.lit + P.glow * 0.8), R = S.R, sc = VIS * (S.beast.scale || 1);
    c.save(); c.globalCompositeOperation = 'lighter';
    const fwd = Math.sin(S.ag);   // (the face points toward the camera when sin(ag) > 0)
    for (const s of [-1, 1]) { const e = scrOf(S, V3(R.neck.x + 0.29 * HS, R.neck.y + s * 0.135 * HS, R.neck.z + 0.005 * HS), T), r = T * sc * (0.16 + 0.12 * gl), a = vis * Math.min(1, 0.3 + gl) * (0.35 + 0.65 * cl(fwd + 0.7)); c.globalAlpha = a * 0.9; blitSized(c, glowSprite('#FF4030'), e[0] - r, e[1] - r, r * 2, r * 2); c.globalAlpha = a; blitSized(c, glowSprite('#FFE0C8'), e[0] - r * 0.28, e[1] - r * 0.28, r * 0.56, r * 0.56); }
    const hb = scrOf(S, V3(R.neck.x + HG.brow.c[0] * HS, R.neck.y, R.neck.z + HG.brow.c[2] * HS), T), rb = T * sc * (0.1 + 0.1 * gl); c.globalAlpha = vis * gl * 0.6; blitSized(c, glowSprite(CRIM), hb[0] - rb, hb[1] - rb, rb * 2, rb * 2);
    for (const [base2, q, k] of GEMS) { const o = base2 === 'torso' ? R.torso : R[base2], p = scrOf(S, V3(o.x + q[0], o.y + q[1], o.z + q[2]), T), r = T * sc * (0.09 + 0.09 * gl) * k; c.globalAlpha = vis * gl * 0.5; blitSized(c, glowSprite(CRIM), p[0] - r, p[1] - r, r * 2, r * 2); }
    if (P.charge > 0.02) { const ch = scrOf(S, R.torso, T), r = T * sc * (1.3 + 0.4 * P.charge); c.globalAlpha = 0.25 * P.charge * vis; blitSized(c, glowSprite(EBLUE), ch[0] - r, ch[1] - r * 0.8, r * 2, r * 1.6); }
    c.restore();
  }
  /* smoke and debris in the scene (normal blend; dusty; behind or in front of the machine by depth); never on the rider */
  function drawSmoke(S, c, T, front) {
    if (!SM2 || !S.parts.length) return; const H = S.H;
    const pp = !S.released && S.phase !== 'gone' ? petScreen(S, T) : null, PX = pp ? pp[0] : -1e9, PY = pp ? pp[1] - T * 0.5 : -1e9;
    c.save();
    for (const p of S.parts) { if (p.kind === 1 || p.kind === 8 || p.kind === 9) continue; if (!!p.front !== front) continue; const X = H.sx(p.x), Y = H.sy(p.y) - p.z * ZK * T, u = 1 - p.life / p.max;
      if (p.kind === 2) { const r = T * p.s * (1 + p.grow * u), keep = S.phase === 'build' && S.t < 1.38 ? 1 : 0.15 + 0.85 * sstep(T * 0.4, T * 1.3, Math.hypot(X - PX, Y - PY)); c.globalAlpha = Math.min(1, u * 6) * (p.dense ? 1 - u * u : 1 - u) * (p.dense ? 0.66 : 0.42) * keep; c.drawImage(p.steam ? SM2.steam : SM2.smoke, X - r, Y - r, r * 2, r * 2); continue; }
      const a = cl(p.life / Math.min(0.25, p.max)); c.globalAlpha = a;
      if (p.kind === 6) { const img = p.tool ? SM2.wrench : SM2.hammer, s = T * p.s; c.save(); c.translate(X, Y); c.rotate(Math.sin(u * Math.PI * 2) * 1.1 * Math.sign(p.vr)); c.globalAlpha = a * 0.85 * Math.sin(u * Math.PI); c.drawImage(img, -s, -s * 1.5, s * 2, s * 2); c.restore(); continue; }
      const img = p.kind === 4 ? SM2.gear : p.kind === 5 ? SM2.nut : p.kind === 7 ? SM2.panel : null, s = T * p.s;
      if (img) { c.save(); c.translate(X, Y); c.rotate(p.rot); c.drawImage(img, -s, -s * (img.height / img.width), s * 2, s * 2 * (img.height / img.width)); c.restore(); }
      else { c.fillStyle = '#8C7A66'; c.save(); c.translate(X, Y); c.rotate(p.rot); c.fillRect(-s, -s * 0.7, s * 2, s * 1.4); c.restore(); } }
    c.restore();
  }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz();
    callM(S, c, 'drawOver');
    if (!S.parts.length && !S.zap.length) return;
    const pp = !S.released ? petScreen(S, T) : [H.sx(S.me.x), H.sy(S.me.y)], PX = pp[0], PY = pp[1] - T * 0.5;
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind !== 1) continue; const X = H.sx(p.x), Y = H.sy(p.y) - p.z * ZK * T, a = cl(p.life / Math.min(0.2, p.max)) * (0.08 + 0.92 * sstep(T * 0.35, T * 1.1, Math.hypot(X - PX, Y - PY))); if (a < 0.02) continue; const r = T * p.s * 0.5; c.globalAlpha = a; blitSized(c, glowSprite(p.col || CYAN), X - r, Y - r, r * 2, r * 2); }
    for (const z of S.zap) if (!z.floor) drawZap(S, c, T, z);
    c.restore();
  }

  /* ================= the HUD while riding: Homing Missiles, Heaven's Wrath, Jump and the Judgement Day meter ================= */
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic, glowPic } = o, t = S.g.t, idle = S.phase !== 'ride' || S.beast.locked || !!S.jump || S.recover > 0;
    const btn = (b, key, label, cd, cdMax, paint, col, busy, dx) => { const rd = cd <= 0.01 && !idle && !S.busy;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 + 0.08 * Math.sin(t * 5); blitC(c, glowPic(glowSprite, EBLUE, Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`beast|${key}|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => paint(x, w / 2, h / 2, b.r, rd)), b.x, b.y);
      if (busy) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(CYAN, 0.8); c.beginPath(); c.arc(b.x, b.y, b.r + 2, t * 6, t * 6 + 1.6); c.stroke(); c.restore(); }
      else if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / cdMax)); c.closePath(); c.fillStyle = 'rgba(8,10,24,.5)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); }
      GFX.labelS(c, label, b.x + (dx || 0), b.y + b.r + 9, 8, 800, col, 'rgba(0,0,0,.7)', 3); };
    btn(B.s[0], 'mis', 'HOMING MISSILES', S.cdM, missileCd(), paintMissileBtn, '#BFEAFF', S.busy === 'missiles');
    btn(B.s[1], 'wrath', "HEAVEN'S WRATH", S.cdW, TUNE.wrathCd, paintFistBtn, '#FFE3A0', S.busy === 'wrath', -8);
    { const b = B.d, cd = S.jump ? 0 : S.cdJump, rd = cd <= 0.01 && !idle && S.busy !== 'wrath' && S.busy !== 'judge';
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.32 + 0.1 * Math.sin(t * 5 + 1); blitC(c, glowPic(glowSprite, GOLD, Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`beast|jump|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => paintJumpBtn(x, w / 2, h / 2, b.r, rd)), b.x, b.y);
      if (S.jump || S.recover > 0) { c.save(); c.lineWidth = 3; c.strokeStyle = rgba(GOLD, 0.85); c.beginPath(); c.arc(b.x, b.y, b.r + 2, t * 7, t * 7 + 1.4); c.stroke(); c.restore(); }
      else if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / TUNE.jumpCd)); c.closePath(); c.fillStyle = 'rgba(30,16,4,.5)'; c.fill(); }
      GFX.labelS(c, 'JUMP', b.x, b.y + b.r + 9, 9, 800, '#FFE7B0', 'rgba(0,0,0,.7)', 3); }
    // the Judgement Day meter: an electric-blue ring rising round a lightning-sphere emblem whose bolts brighten with it
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge, judge = S.phase === 'judge';
      if (full || judge) { const pl = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.35 * pl; blitC(c, glowPic(glowSprite, EBLUE, Math.round(b.r * (2.1 + 0.25 * pl) * 4) / 4), b.x, b.y); c.globalAlpha = 0.45; blitC(c, glowPic(shockSprite, GOLD, Math.round(b.r * 1.8)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`beast|judge|${full || judge}|${b.r}`, b.r * 2 + 12, b.r * 2 + 12, (x, w, h) => paintJudgeBtn(x, w / 2, h / 2, b.r, full || judge)), b.x, b.y);
      // the bolts inside the sphere: more and brighter as it fills (live, cheap: a few short polylines)
      if (k > 0.05 && TKK) { const nb = 1 + Math.floor(k * 4); for (let i = 0; i < nb; i++) { const a = t * 2.3 + i * 2.1, r0 = b.r * 0.12, r1 = b.r * 0.42; TKK.arc(c, b.x + Math.cos(a) * r0, b.y - 2 + Math.sin(a) * r0, b.x + Math.cos(a + 1.3) * r1, b.y - 2 + Math.sin(a + 1.3) * r1, Math.floor(t * 18) + i * 7, 1.1 + k, 0.35 + 0.65 * k, { forks: 0, jit: b.r * 0.12 }); } }
      c.save(); c.lineCap = 'round'; c.lineWidth = 5.5; c.strokeStyle = 'rgba(10,14,32,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r - 3, 0, TAU); c.stroke();
      if (k > 0.004) { c.strokeStyle = full ? GOLD : EBLUE; c.lineWidth = 4.5; c.beginPath(); c.arc(b.x, b.y, b.r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); c.strokeStyle = rgba(WHITE, 0.6); c.lineWidth = 1.5; c.stroke();
        c.globalCompositeOperation = 'lighter'; const ea = -Math.PI / 2 + TAU * k; c.globalAlpha = 0.9; blitSized(c, glowSprite(ICE), b.x + Math.cos(ea) * (b.r - 3) - 7, b.y + Math.sin(ea) * (b.r - 3) - 7, 14, 14); }
      c.restore();
      // the time left: a thin gold arc outside the ring and the seconds
      if (S.phase === 'ride' || S.phase === 'build') { const u = S.phase === 'build' ? 1 : cl(S.left / S.dur), low = S.phase === 'ride' && S.left < 5; c.save(); c.lineCap = 'round'; c.lineWidth = 2.5; c.strokeStyle = low ? 'rgba(255,120,110,.9)' : rgba(GOLD, 0.9); c.beginPath(); c.arc(b.x, b.y, b.r + 4.5, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore();
        GFX.labelS(c, Math.ceil(S.phase === 'build' ? S.dur : S.left) + 's', b.x, b.y + b.r * 0.7, 10, 900, low ? '#FF9AA8' : '#FFE9B0', 'rgba(0,0,0,.75)', 3); }
      const lab = judge ? 'JUDGEMENT DAY!' : full ? 'JUDGEMENT DAY' : S.used ? 'USED' : `JUDGEMENT ${Math.floor(S.charge * 100)}%`;
      if (full) { const s = 1 + 0.08 * Math.sin(t * 7); c.save(); c.translate(b.x, b.y + b.r + 10); c.scale(s, s); GFX.labelS(c, lab, 0, 0, 11, 900, GOLD, 'rgba(10,20,50,.9)', 3.5); c.restore(); }
      else GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, judge ? GOLD : '#BFEAFF', 'rgba(0,0,0,.7)', 3); }
  }
  /* bronze faces, electric-blue rims when ready, gold trim */
  function btnFace(x, cx, cy, r, rd) { const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); if (rd) { g.addColorStop(0, '#E8B56A'); g.addColorStop(0.55, '#9A6026'); g.addColorStop(1, '#4A2A0E'); } else { g.addColorStop(0, '#5A4636'); g.addColorStop(0.6, '#33261C'); g.addColorStop(1, '#1C140E'); } x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    x.fillStyle = rd ? 'rgba(255,240,200,.18)' : 'rgba(255,240,200,.06)'; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; x.beginPath(); x.arc(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82, 1.4, 0, TAU); x.fill(); } }
  function btnRim(x, cx, cy, r, rd) { x.lineWidth = 2.6; x.strokeStyle = rd ? EBLUE : 'rgba(63,200,255,.3)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.lineWidth = 1.2; x.strokeStyle = rd ? GOLD : 'rgba(255,210,102,.3)'; x.beginPath(); x.arc(cx, cy, r - 3.2, 0, TAU); x.stroke(); if (rd) { x.fillStyle = 'rgba(255,255,255,.25)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.5, r * 0.3, r * 0.12, -0.5, 0, TAU); x.fill(); } }
  const metalGrad = (x, x0, y0, x1, y1, rd) => { const g = x.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rd ? '#FFFFFF' : '#9A9AA6'); g.addColorStop(0.45, rd ? '#C9D6E8' : '#6A6A76'); g.addColorStop(1, rd ? '#5A6478' : '#33333C'); return g; };
  /* a dimensional missile rising on a curved trail: pointed nose, fins, a glowing core, tapered exhaust */
  function paintMissileBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.globalAlpha = rd ? 1 : 0.5; x.translate(cx, cy); x.rotate(-0.75);
    x.lineCap = 'round'; x.strokeStyle = rd ? 'rgba(191,242,255,.85)' : 'rgba(191,242,255,.4)'; x.lineWidth = r * 0.08; x.setLineDash([r * 0.12, r * 0.09]); x.beginPath(); x.moveTo(-r * 0.95, r * 0.25); x.quadraticCurveTo(-r * 0.6, r * 0.05, -r * 0.42, 0); x.stroke(); x.setLineDash([]);
    const g = x.createLinearGradient(-r * 0.6, 0, -r * 0.3, 0); g.addColorStop(0, 'rgba(95,228,255,0)'); g.addColorStop(1, rd ? '#E8FBFF' : '#8FB0C0'); x.fillStyle = g; x.beginPath(); x.moveTo(-r * 0.32, -r * 0.09); x.lineTo(-r * 0.72, 0); x.lineTo(-r * 0.32, r * 0.09); x.fill();
    x.fillStyle = rd ? '#C9A04A' : '#6E5A30'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(-r * 0.3, s * r * 0.1); x.lineTo(-r * 0.42, s * r * 0.26); x.lineTo(-r * 0.12, s * r * 0.1); x.closePath(); x.fill(); }
    x.fillStyle = metalGrad(x, 0, -r * 0.13, 0, r * 0.13, rd); x.beginPath(); x.moveTo(-r * 0.32, -r * 0.11); x.lineTo(r * 0.28, -r * 0.11); x.quadraticCurveTo(r * 0.62, 0, r * 0.28, r * 0.11); x.lineTo(-r * 0.32, r * 0.11); x.closePath(); x.fill(); x.strokeStyle = 'rgba(10,12,20,.8)'; x.lineWidth = 1; x.stroke();
    x.fillStyle = rd ? GOLD : '#8A7440'; x.fillRect(r * 0.16, -r * 0.11, r * 0.06, r * 0.22); x.fillStyle = rd ? CYAN : '#5A8A9A'; x.beginPath(); x.arc(-r * 0.05, 0, r * 0.06, 0, TAU); x.fill();
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* a clenched mechanical fist striking down, with impact lines */
  function paintFistBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.globalAlpha = rd ? 1 : 0.5; x.translate(cx, cy - r * 0.1); x.lineCap = 'round';
    x.strokeStyle = rd ? '#BFF2FF' : 'rgba(191,242,255,.4)'; x.lineWidth = 2; for (const a of [-0.7, -0.25, 0.25, 0.7]) { x.beginPath(); x.moveTo(Math.sin(a) * r * 0.42, r * 0.5); x.lineTo(Math.sin(a) * r * 0.68, r * 0.5 + Math.cos(a) * r * 0.2); x.stroke(); }
    const g = x.createLinearGradient(-r * 0.4, -r * 0.5, r * 0.4, r * 0.4); g.addColorStop(0, rd ? '#FFE6A8' : '#9A8A6A'); g.addColorStop(0.5, rd ? '#C48A3A' : '#6E5A3E'); g.addColorStop(1, rd ? '#6A3A10' : '#3A2A18');
    const rr = (x0, y0, w, h, q) => { x.beginPath(); if (x.roundRect) x.roundRect(x0, y0, w, h, q); else x.rect(x0, y0, w, h); };
    x.fillStyle = rd ? GOLD : '#8A7440'; rr(-r * 0.3, -r * 0.62, r * 0.6, r * 0.2, r * 0.05); x.fill(); x.strokeStyle = 'rgba(30,14,4,.85)'; x.lineWidth = 1.1; x.stroke();
    x.fillStyle = g; rr(-r * 0.4, -r * 0.44, r * 0.8, r * 0.62, r * 0.16); x.fill(); x.stroke();
    for (let i = 0; i < 4; i++) { const fx = -r * 0.3 + i * r * 0.2; x.fillStyle = g; x.beginPath(); x.arc(fx, r * 0.2, r * 0.105, 0, TAU); x.fill(); x.stroke(); x.strokeStyle = 'rgba(30,14,4,.6)'; x.beginPath(); x.moveTo(fx + r * 0.1, -r * 0.05); x.lineTo(fx + r * 0.1, r * 0.2); x.stroke(); x.strokeStyle = 'rgba(30,14,4,.85)'; }
    x.fillStyle = rd ? '#2A2A34' : '#1A1A20'; for (let i = 0; i < 4; i++) { const fx = -r * 0.3 + i * r * 0.2; x.beginPath(); x.moveTo(fx - r * 0.05, r * 0.27); x.lineTo(fx, r * 0.42); x.lineTo(fx + r * 0.05, r * 0.27); x.fill(); }
    x.fillStyle = g; rr(-r * 0.46, -r * 0.12, r * 0.42, r * 0.17, r * 0.08); x.fill(); x.stroke();
    x.fillStyle = rd ? CRIM : '#5A2028'; x.beginPath(); x.arc(r * 0.12, -r * 0.22, r * 0.075, 0, TAU); x.fill(); x.fillStyle = 'rgba(255,255,255,.6)'; x.beginPath(); x.arc(r * 0.1, -r * 0.24, r * 0.025, 0, TAU); x.fill();
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* a heavy beast hopping a high dashed arc, an up chevron, a ground shock under the landing */
  function paintJumpBtn(x, cx, cy, r, rd) { btnFace(x, cx, cy, r, rd); x.save(); x.globalAlpha = rd ? 1 : 0.5; x.lineCap = 'round';
    x.strokeStyle = rd ? 'rgba(255,226,150,.9)' : 'rgba(255,226,150,.4)'; x.lineWidth = r * 0.07; x.setLineDash([r * 0.1, r * 0.08]); x.beginPath(); x.moveTo(cx - r * 0.6, cy + r * 0.45); x.quadraticCurveTo(cx, cy - r * 0.9, cx + r * 0.6, cy + r * 0.45); x.stroke(); x.setLineDash([]);
    x.strokeStyle = rd ? CYAN : 'rgba(95,228,255,.4)'; x.lineWidth = 1.6; x.beginPath(); x.ellipse(cx + r * 0.6, cy + r * 0.52, r * 0.24, r * 0.08, 0, 0, TAU); x.stroke();
    // the machine's silhouette: hunched body, two big arms, cannons up
    x.translate(cx - r * 0.04, cy - r * 0.24); x.scale(1.45, 1.45); x.fillStyle = rd ? '#3A2410' : '#1C140E'; x.strokeStyle = rd ? GOLD : 'rgba(255,210,102,.4)'; x.lineWidth = 1.1;
    x.beginPath(); x.ellipse(0, 0, r * 0.3, r * 0.19, -0.25, 0, TAU); x.fill(); x.stroke(); x.beginPath(); x.ellipse(r * 0.28, r * 0.06, r * 0.13, r * 0.08, 0.3, 0, TAU); x.fill(); x.stroke();
    for (const s of [-1, 1]) { x.beginPath(); x.moveTo(r * 0.1 + s * r * 0.05, r * 0.05); x.lineTo(r * 0.18 + s * r * 0.06, r * 0.3); x.lineWidth = r * 0.1; x.strokeStyle = rd ? '#7A4A1C' : '#2A1E14'; x.stroke(); }
    x.lineWidth = r * 0.06; x.strokeStyle = rd ? '#B9C2D0' : '#4A4A52'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(-r * 0.12 + s * r * 0.06, -r * 0.12); x.lineTo(r * 0.02 + s * r * 0.06, -r * 0.38); x.stroke(); }
    x.fillStyle = rd ? CRIM : '#5A2028'; x.beginPath(); x.arc(r * 0.36, r * 0.04, r * 0.035, 0, TAU); x.fill();
    x.restore(); btnRim(x, cx, cy, r, rd); }
  /* the lightning sphere: a translucent electric-blue shell, a white-gold core, violet filaments (the live bolts go on top) */
  function paintJudgeBtn(x, cx, cy, r, full) {
    let g = x.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r); g.addColorStop(0, full ? '#7A5A2A' : '#3A2E26'); g.addColorStop(0.6, full ? '#3E2A12' : '#221A14'); g.addColorStop(1, '#100A06'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill();
    const R = r * 0.5, sy = cy - 2; g = x.createRadialGradient(cx - R * 0.3, sy - R * 0.3, R * 0.05, cx, sy, R); g.addColorStop(0, full ? 'rgba(255,250,220,1)' : 'rgba(200,220,240,.7)'); g.addColorStop(0.3, full ? 'rgba(255,214,110,.9)' : 'rgba(120,170,220,.5)'); g.addColorStop(0.7, full ? 'rgba(63,200,255,.65)' : 'rgba(50,90,150,.5)'); g.addColorStop(1, full ? 'rgba(138,92,255,.4)' : 'rgba(40,40,90,.4)'); x.fillStyle = g; x.beginPath(); x.arc(cx, sy, R, 0, TAU); x.fill();
    x.strokeStyle = full ? 'rgba(191,242,255,.9)' : 'rgba(191,242,255,.35)'; x.lineWidth = 1.2; x.beginPath(); x.arc(cx, sy, R, 0, TAU); x.stroke();
    x.strokeStyle = full ? 'rgba(170,140,255,.8)' : 'rgba(170,140,255,.3)'; x.lineWidth = 1; for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(cx, sy, R * 0.95, R * (0.25 + i * 0.2), i * 1.05, 0, TAU); x.stroke(); }
    x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(cx - R * 0.35, sy - R * 0.45, R * 0.22, R * 0.1, -0.6, 0, TAU); x.fill();
    x.lineWidth = 2; x.strokeStyle = full ? GOLD : 'rgba(255,210,102,.45)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
  }

  /* ================= the Ultimate ================= */
  U.beastmachine = (C, H) => {
    const me = H.me, g = H.g;
    // (a spirit or any actor that is not the played pet cannot ride: a thunder clap where it stands)
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'thunder', src: 'ult' }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, CYAN, 0.3); return; }
    if (g._beast && !g._beast.released) return;
    startForm(C, H);
  };
  /* idle-time preparation (20b calls it for an equipped Ultimate): the small pictures, then every part at every heading */
  U.beastmachine.warm = o => {
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const dpr = (typeof arc !== 'undefined' && arc.dpr) || 1; setScale(T * dpr); idleBake(); }, 300);
  };
  U.beastmachine.TUNE = TUNE;
  U.beastmachine.__dbg = { BK, TUNE, bakeStep, setScale, want, readyB, bucketOf, groundA, planJump, STUB, moves, NB, PARTS, get SM2() { return SM2; }, rig, anchor, CH, SEGS, VIS, l2w, drawMachine, frameOf, shade, MATS };
})();
