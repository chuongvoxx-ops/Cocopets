/* ---------- Light, the 11th Ultimate: Sports Car (the core: worker C1) ----------
   A heart seal opens under the pet, pink ribbons spiral up and trace the wheels, bonnet and spoiler, and a glossy
   candy-pink roadster becomes solid round it; the pet sits in the driver's seat (its own sprite, upright: never turned or
   twisted), the heart headlights ignite and stars scatter. For 20 s (25 s at Adept, 35 s at Celestial; game time,
   counted from the moment the car can be driven) the controls are the car's (20b's VEH hook):
     - the stick / keys drive and steer (quick acceleration, steering that tightens with speed, a little body lean);
     - ramming: swept contact with the car's body deals light damage (TUNE.ram x DK) once per pass per monster (a pass ends
       when the monster leaves the body; never sooner than TUNE.ramGate s), only above TUNE.ramMin of top speed: a parked
       car or one pushing against a monster deals nothing; bosses are never displaced (hitMon's own knockback rules);
     - Dodge is Drift (the scarlet button; round 2: the Dodge roll scaled up for a car): a kick, a fast burst along the
       stick (else the heading, else the aim) with the car spinning through at least one full turn, then a short recovery
       that hands the speed back to the stick; the Dodge's own invulnerability (0.38 s), a short cooldown with an early
       press kept; every monster within TUNE.driftR of the car's swept path takes TUNE.drift x DK once per activation with
       knockback (bosses: hitMon's rule); spiral tyre trails off all four wheels, smoke spirals, a smear of the body, a
       shockwave ring per strike; ramming is suppressed for those monsters until they leave the car. The pet in the seat
       rolls one flat 2D turn with the spin, exactly as the Dodge rolls the pet's sprite (never a 3D turn);
     - Strong 1 / 2 are Shooting Star / Love Sensation (worker C2's file, 20k4q, SPORTSCAR_MOVES; a stub here if absent);
     - the Ult button is the Supernova meter: it fills from the damage the form actually deals (ctx.hit: after mitigation,
       no overkill, nothing for misses or invulnerable targets; Supernova's own hits never refill it), and only a press
       when full starts Supernova (once per transformation; it commits, ignores the timer and ends with the pet ejected).
   Normal attacks are suppressed. The pet keeps its own HP, wards and defences (no vehicle health, no invulnerability).
   Exit: timeout (the car dissolves into hearts and stars and the pet hops down), Supernova's end, the pet's defeat, a
   party swap, the floor's end. Every exit restores the controls (the kit itself is never touched, so the Strongs,
   Dodge and the Ult come back as they were and their cooldowns kept ticking) and starts the Ult's 120 s cooldown once,
   at the exit (the cooldown is held, not ticking, while the car is out).
   Drawing: the car is ray-marched once per heading (32 headings, in the background: U.sportscar.warm and a small
   per-frame budget) into two pictures, the body behind the pet and the parts in front of it (cowl, near door,
   windscreen); the wheels are drawn live (their tread as an exact swept silhouette, their star hubs turning); shadow,
   underglow, headlight pools and tyre trails lie on the floor; hearts and stars are pooled sprites. */
(() => {
  const U = ELEM_IMPL.light.ult;
  const TAU = Math.PI * 2;
  const LIGHT = '#FFB3E0', CORE = '#FFF4FC', DARK = '#C2508F', PEARL = '#FFF8FB', GOLD = '#FFD86B', CANDY = '#FF5FAE', ROSE = '#FF7FC0', SCARLET = '#E3123A';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const wrap = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const lowFx = () => typeof st !== 'undefined' && st && st.lowFx;
  const calm = () => typeof reduceMotion !== 'undefined' && reduceMotion;
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  /* the camera: an orthographic view from 46 degrees up. A floor offset of 1 tile across the screen is 1 tile; one along
     the car's ground plane toward the viewer is GY; one tile of height goes up the screen by ZK */
  const GY = 0.72, ZK = 0.695, VY = 0.695, VZ = 0.719;

  /* ================= the tuning (configurable) ================= */
  const TUNE = {
    dur: [20, 25, 35],          // s of driving at evo 1-3 / 4-6 / 7, from the moment the car can be driven
    cd: 120,                    // s: the Ult's cooldown, from the exit (the row's own cd is used when present)
    top: 11.8, accel: 24, coast: 10.5, overK: 7,          // tiles/s, tiles/s2 (the pet walks 4.3; round 2: +40% top speed, acceleration to match)
    steer: [3.3, 6.2], grip: 13, bumpK: 0.45,             // rad/s at rest .. at top speed; lateral grip /s; speed kept on a wall
    ram: 0.6, ramGate: 0.45, ramMin: 0.3, ramKb: 3.2,     // x DK per pass; s; share of top speed (0.3 x 11.8 = 3.5 tiles/s, as before); knockback (bosses: hitMon's rule)
    /* Drift (round 2): the Dodge roll scaled up for a car. A burst along the stick (else the heading, else the aim) with
       the car spinning through at least one full turn, then a short recovery that hands the speed back to the stick */
    drift: 3.0, driftCd: 0.9, driftR: 2.5, driftKb: 7.5,  // x DK once per monster per activation; s from the press (Dodge: 0.85 s); swept radius round the car's centre (tiles); knockback
    driftPh: [0.05, 0.3, 0.14], driftV: 19, driftTurn: 5, driftBuf: 0.2,   // s kick / spin-burst / recovery; burst speed (tiles/s, eased off as the Dodge's); steering during the burst (rad/s); a press this early is kept
    driftInv: 0.38,             // s of invulnerability from the press: the Dodge's own (0.3 s roll + 0.08 s after)
    chargeK: 30,                // the meter fills at chargeK x DK of damage actually dealt (a dense L1 pack, driven well: ~11 s; ordinary play ~15-20 s)
    summon: 1.75, out: 0.85,    // s
    novaCap: 16,                // s: a Supernova that never reports done is ended anyway
  };
  const tierOf = ev => ev >= 7 ? 3 : ev >= 4 ? 2 : 1;

  /* ================= the car's shape, in its own frame: x forward, y to its left, z up (tiles) ================= */
  const HL = 1.62, HWB = 0.78, ZB = 0.17;
  const AXF = 0.98, AXR = -0.98, WY = 0.63, WR = 0.285, WZ = 0.285, TWH = 0.1, ARCH = 0.37;
  const SEAT = { x: -0.34, y: 0, z: 0.45 };
  const CKX = -0.3, CKL = 0.56, CKW = 0.5, CKR = 0.18;   // the cockpit opening: centre x, half length, half width, corner radius
  function hwAt(x) { let w = HWB; if (x > 1.0) { const u = (x - 1.0) / 0.62; w -= 0.27 * u * u; } if (x < -1.2) { const u = (-1.2 - x) / 0.42; w -= 0.1 * u * u; }
    for (const ax of [AXF, AXR]) { const d = (x - ax) / 0.52; if (Math.abs(d) < 1) w += 0.04 * (1 - d * d) * (1 - d * d); } return w; }
  function centre(x) {
    if (x > 1.0) { const u = (x - 1.0) / 0.62; return 0.57 - 0.2 * Math.pow(u, 1.5); }
    if (x > 0.3) return 0.57 + 0.06 * (1 - (x - 0.3) / 0.7);
    if (x > -0.9) return 0.63 - 0.01 * (0.3 - x);
    const u = (-0.9 - x) / 0.72; return 0.62 - 0.11 * u * u;
  }
  /* the classic heart curve, y up; < 0 inside */
  const heartF = (u, v) => { const a = u * u + v * v - 1; return a * a * a - u * u * v * v * v; };
  const inHeart = (u, v) => heartF(u * 1.05, v * 1.05 + 0.1) < 0;
  function sdRR(px, py, hx, hy, r) { const qx = Math.abs(px) - hx + r, qy = Math.abs(py) - hy + r; return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r; }
  /* materials */
  const M_PAINT = 0, M_PEARL = 1, M_GOLD = 2, M_FLOOR = 3, M_SEAT = 4, M_DASH = 5, M_HEAD = 6, M_EMB = 7, M_LINER = 8;
  /* one column of the body: [top, bottom, material] or null */
  function bodyAt(x, y) {
    const ay = Math.abs(y), w = hwAt(x); if (ay >= w) return null;
    const t = ay / w, xf = HL - 0.3 * t * t * t, xr = -HL + 0.07 * t * t * t * t; if (x >= xf || x <= xr) return null;
    let top = centre(x) * (1 - 0.035 * t * t), mat = M_PAINT;
    // the bonnet's gentle dome and the raised heart emblem on it
    if (x > 0.3 && x < 1.3) top += 0.03 * Math.exp(-(y / 0.28) * (y / 0.28)) * Math.sin(Math.PI * (x - 0.3) / 1.0);
    // the streamlined fairing behind the seat
    if (x < -0.84 && x > -1.56 && ay < 0.34) { const pr = sstep(-1.56, -0.95, x) * (1 - sstep(-0.92, -0.84, x) * 0.0); top += 0.12 * Math.pow(1 - (y / 0.34) * (y / 0.34), 1.5) * pr; }
    // the shoulder and the nose / tail roll off to the sill
    const s = Math.max(0, (t - 0.6) / 0.4); let k = Math.sqrt(Math.max(0, 1 - Math.pow(s, 2.4)));
    const dn = (xf - x) / 0.22, dtl = (x - xr) / 0.09; if (dn < 1) k *= Math.sqrt(Math.max(0, 1 - (1 - dn) * (1 - dn))); if (dtl < 1) k *= Math.sqrt(Math.max(0, 1 - (1 - dtl) * (1 - dtl)));
    let ht = ZB + (top - ZB) * Math.max(k, 0.3), hb = ZB;   // (a skirt at least this tall: the sides end in a clean wall)
    // pronounced wheel arches: a fender bulge over each wheel, the well carved out under it, a lip round it
    for (const ax of [AXF, AXR]) { const dx = x - ax, d = dx / 0.56;
      if (Math.abs(d) < 1 && t > 0.42) ht += 0.075 * (1 - d * d) * (1 - d * d) * sstep(0.42, 0.78, t) * Math.min(1, k * 3);
      if (Math.abs(dx) < ARCH && ay > WY - TWH - 0.05) { const az = WZ + Math.sqrt(ARCH * ARCH - dx * dx); hb = Math.max(hb, az); ht = Math.max(ht, az + 0.055); } }
    // the cockpit: a rounded opening with a gold lip; inside a floor, a pearl seat, a heart headrest, the dash
    const dk = sdRR(x - CKX, y, CKL, CKW, CKR);
    if (dk < 0) {
      let z = 0.28; mat = M_FLOOR;
      if (x > -0.72 && x < -0.1 && ay < 0.4) { z = 0.42 + 0.025 * (1 - (y / 0.4) * (y / 0.4)); mat = M_SEAT; }
      if (x <= -0.7) { const u = cl((-0.7 - x) / 0.16); z = Math.max(z, 0.42 + 0.27 * Math.pow(u, 0.6)); mat = M_SEAT;
        if (ay < 0.31 && x < -0.73) { const lob = Math.max(Math.exp(-Math.pow((y - 0.12) / 0.11, 2)), Math.exp(-Math.pow((y + 0.12) / 0.11, 2))), zz = 0.66 + 0.15 * lob - 0.1 * (ay / 0.31) * (ay / 0.31); if (zz > z) { z = zz; mat = M_HEAD; } } }
      if (x > 0.06) { z = Math.max(z, 0.47 + 0.13 * sstep(0.06, 0.2, x)); mat = M_DASH; }
      if (dk > -0.07 && mat === M_FLOOR) { z = Math.max(z, 0.28 + 0.25 * sstep(-0.07, 0, dk)); mat = M_DASH; }   // (the door trim inside)
      return [Math.min(ht, z), hb, mat];
    }
    if (dk < 0.045) { mat = M_GOLD; ht += 0.012; }
    // pearl racing stripes on the bonnet and the fairing
    else if ((x > 0.32 && x < 1.42 && ay > 0.065 && ay < 0.14) || (x < -0.95 && x > -1.5 && ay > 0.05 && ay < 0.11)) mat = M_PEARL;
    if (x > 0.96 && x < 1.26 && inHeart(y / 0.12, (x - 1.1) / 0.12)) { ht += 0.022; mat = inHeart(y / 0.085, (x - 1.105) / 0.085) ? M_EMB : M_GOLD; }
    if (ht <= hb + 0.004) return null;
    return [ht, hb, mat];
  }
  /* the rear spoiler: [top, bottom, material] or null (a wing on two struts between heart-topped end plates) */
  function wingAt(x, y) {
    const ay = Math.abs(y);
    if (ay > 0.715 && ay < 0.785 && x > -1.74 && x < -1.3) { const u = (x + 1.52) / 0.22, top = 0.9 + 0.06 * Math.sqrt(Math.max(0, 1 - u * u)); return [top, 0.7, M_PEARL]; }
    if (ay <= 0.715 && x > -1.7 && x < -1.36) { const u = (x + 1.7) / 0.34, prof = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.08)), 0.7), lip = u < 0.12 ? 0.02 * (1 - u / 0.12) : 0; return [0.85 + 0.065 * prof + lip, 0.83, u > 0.86 ? M_GOLD : M_PAINT]; }
    if (ay > 0.3 && ay < 0.38 && x > -1.56 && x < -1.46) return [0.85, 0.4, M_GOLD];
    return null;
  }
  /* the windscreen: its surface height at (x, y), or -1; the frame is flagged by a negative material */
  const GLX0 = 0.08, GLX1 = 0.27;
  function glassAt(x, y) { if (x < GLX0 || x > GLX1) return null; const ay = Math.abs(y); if (ay > 0.6) return null; const z = 0.6 + (GLX1 - x) / (GLX1 - GLX0) * 0.34, ztop = 0.95 - 0.17 * (ay / 0.6) * (ay / 0.6); if (z > ztop) return null; return [z, ztop - z < 0.03 || ay > 0.57 || x > GLX1 - 0.012 ? 1 : 0]; }

  /* ================= the model grids (built once, in the background) ================= */
  const CELL = 0.02, GX0 = 1.84, GY0 = 0.92, NX = Math.ceil(GX0 * 2 / CELL) + 1, NYc = Math.ceil(GY0 * 2 / CELL) + 1;
  let MOD = null;
  function* buildModel() {
    const n = NX * NYc, Ht = new Float32Array(n).fill(-1), Hb = new Float32Array(n), Mt = new Uint8Array(n), Wt = new Float32Array(n).fill(-1), Wb = new Float32Array(n), Wm = new Uint8Array(n), Gz = new Float32Array(n).fill(-1), Gm = new Uint8Array(n);
    const Nx = new Float32Array(n), Ny = new Float32Array(n), Nz = new Float32Array(n), Ex = new Float32Array(n), Ey = new Float32Array(n), Ez = new Float32Array(n);
    let tY = nowMs();
    for (let j = 0; j < NYc; j++) { const y = -GY0 + j * CELL;
      for (let i = 0; i < NX; i++) { const x = -GX0 + i * CELL, k = j * NX + i, b = bodyAt(x, y); if (b) { Ht[k] = b[0]; Hb[k] = b[1]; Mt[k] = b[2]; } const w = wingAt(x, y); if (w) { Wt[k] = w[0]; Wb[k] = w[1]; Wm[k] = w[2]; } const gz = glassAt(x, y); if (gz) { Gz[k] = gz[0]; Gm[k] = gz[1]; } }
      if (nowMs() - tY > 1.2) { yield; tY = nowMs(); } }
    // normals from the height fields (a column with nothing counts as the floor, so the outer edges lean outward)
    const hAt = (A, i, j) => { i = i < 0 ? 0 : i >= NX ? NX - 1 : i; j = j < 0 ? 0 : j >= NYc ? NYc - 1 : j; const v = A[j * NX + i]; return v < 0 ? 0 : v; };
    for (let j = 0; j < NYc; j++) { for (let i = 0; i < NX; i++) { const k = j * NX + i;
      if (Ht[k] >= 0) { const gx = (hAt(Ht, i + 1, j) - hAt(Ht, i - 1, j)) / (2 * CELL), gy = (hAt(Ht, i, j + 1) - hAt(Ht, i, j - 1)) / (2 * CELL), l = Math.hypot(gx, gy, 1); Nx[k] = -gx / l; Ny[k] = -gy / l; Nz[k] = 1 / l; }
      if (Wt[k] >= 0) { const gx = (hAt(Wt, i + 1, j) - hAt(Wt, i - 1, j)) / (2 * CELL), gy = (hAt(Wt, i, j + 1) - hAt(Wt, i, j - 1)) / (2 * CELL), l = Math.hypot(gx, gy, 1); Ex[k] = -gx / l; Ey[k] = -gy / l; Ez[k] = 1 / l; } }
      if (nowMs() - tY > 1.2) { yield; tY = nowMs(); } }
    MOD = { Ht, Hb, Mt, Wt, Wb, Wm, Gz, Gm, Nx, Ny, Nz, Ex, Ey, Ez };
  }
  /* smooth value noise (the paint's roughness varies a little across the body) */
  const hsh = (i, j) => { const v = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return v - Math.floor(v); };
  function vnoise(x, y) { const i = Math.floor(x), j = Math.floor(y), u = x - i, v = y - j, a = hsh(i, j), b = hsh(i + 1, j), c2 = hsh(i, j + 1), d = hsh(i + 1, j + 1), su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return lerp(lerp(a, b, su), lerp(c2, d, su), sv); }

  /* ================= shading (in the ground frame: +y toward the viewer, z up) ================= */
  const Lx = -0.52, Ly = -0.28, Lz = 0.81, Ll = Math.hypot(Lx, Ly, Lz), L0 = Lx / Ll, L1 = Ly / Ll, L2 = Lz / Ll;
  const Hx0 = L0, Hy0 = L1 + VY, Hz0 = L2 + VZ, Hl0 = Math.hypot(Hx0, Hy0, Hz0), HH0 = Hx0 / Hl0, HH1 = Hy0 / Hl0, HH2 = Hz0 / Hl0;
  const Sx0 = -0.38, Sy0 = -0.42, Sz0 = 0.82, Sl0 = Math.hypot(Sx0, Sy0, Sz0);
  const OUT = [0, 0, 0];
  /* the environment a glossy surface mirrors: a pale pink sky with a soft-box light, a crisp horizon, a dark floor */
  function env(rx, ry, rz, o) {
    if (rz >= 0) { const u = Math.pow(rz, 0.5); o[0] = lerp(1.0, 0.58, u); o[1] = lerp(0.93, 0.48, u); o[2] = lerp(0.97, 0.9, u);
      const sb = Math.max(0, (rx * Sx0 + ry * Sy0 + rz * Sz0) / Sl0); if (sb > 0.8) { const k2 = Math.pow((sb - 0.8) / 0.2, 3) * 1.4; o[0] += k2; o[1] += k2; o[2] += k2; } }
    else { const u = cl(-rz * 7); o[0] = lerp(0.52, 0.14, u); o[1] = lerp(0.34, 0.06, u); o[2] = lerp(0.52, 0.16, u); }
  }
  const PAL = { paint: [1.0, 0.36, 0.68], deep: [0.5, 0.05, 0.3], pearl: [1.0, 0.965, 0.98], pdeep: [0.72, 0.6, 0.78], gold: [1.0, 0.8, 0.38], gdeep: [0.55, 0.32, 0.08],
    floor: [0.3, 0.07, 0.2], seat: [1.0, 0.88, 0.94], sdeep: [0.62, 0.4, 0.56], dash: [0.86, 0.22, 0.52], ddeep: [0.36, 0.04, 0.2], head: [1.0, 0.7, 0.86], hdeep: [0.62, 0.22, 0.46] };
  /* a lit, glossy surface: albedo / shadow tone, gloss (0..1), roughness noise, pearl shift */
  function shadeGloss(nx, ny, nz, alb, deep, gloss, rough, pearl, o) {
    const ndl = nx * L0 + ny * L1 + nz * L2, dif = Math.max(0, (ndl + 0.22) / 1.22), sky = 0.5 + 0.5 * nz, lk = Math.min(1.25, 0.26 * sky + 0.92 * dif);
    let r = deep[0] + (alb[0] - deep[0]) * lk, g = deep[1] + (alb[1] - deep[1]) * lk, b = deep[2] + (alb[2] - deep[2]) * lk;
    const ndv = Math.max(0.02, ny * VY + nz * VZ), gr = 1 - ndv;
    if (pearl) { const pk = pearl * gr * gr; r += (0.98 - r) * pk * 0.5; g += (0.8 - g) * pk * 0.6; b += (1.0 - b) * pk * 0.7; }
    const rx = 2 * ndv * nx, ry = 2 * ndv * ny - VY, rz = 2 * ndv * nz - VZ; env(rx, ry, rz, OUT);
    const F = (0.05 + 0.95 * gr * gr * gr * gr * gr) * gloss, rf = Math.min(0.85, (0.2 * gloss + F * 0.85) * (0.82 + 0.18 * rough));
    r = r * (1 - rf) + OUT[0] * rf; g = g * (1 - rf) + OUT[1] * rf; b = b * (1 - rf) + OUT[2] * rf;
    const nh = Math.max(0, nx * HH0 + ny * HH1 + nz * HH2), sp = Math.pow(nh, 60 + 90 * rough) * 0.95 * gloss + Math.pow(nh, 12) * 0.08 * gloss;
    o[0] = r + sp; o[1] = g + sp; o[2] = b + sp;
  }
  function shadeMetal(nx, ny, nz, tint, o) {
    const ndv = Math.max(0.02, ny * VY + nz * VZ), rx = 2 * ndv * nx, ry = 2 * ndv * ny - VY, rz = 2 * ndv * nz - VZ; env(rx, ry, rz, OUT);
    const ndl = Math.max(0, nx * L0 + ny * L1 + nz * L2), nh = Math.max(0, nx * HH0 + ny * HH1 + nz * HH2), sp = Math.pow(nh, 40) * 1.1;
    const lum = (OUT[0] + OUT[1] + OUT[2]) / 3; o[0] = tint[0] * (0.25 + 0.55 * lum + 0.35 * ndl) + sp; o[1] = tint[1] * (0.25 + 0.55 * lum + 0.35 * ndl) + sp * 0.95; o[2] = tint[2] * (0.25 + 0.55 * lum + 0.35 * ndl) + sp * 0.8;
  }
  /* the colour of a hit: local point (x, y, z), local normal, ground normal, kind (0 body top, 1 body wall, 2 wing) */
  function shadeHit(x, y, z, lnx, lny, lnz, gx, gy, gz, mat, kind, o) {
    const ay = Math.abs(y), rough = vnoise(x * 2.6 + 7, y * 2.6) * 0.6 + vnoise(x * 7, y * 7 + 3) * 0.4;
    // emissive lights: heart headlights on the nose, heart taillights on the tail, a pale accent strip along the sill
    if (x > 1.14 && lnz > 0.38 && inHeart((ay - 0.44) / 0.15, (x - 1.34) / 0.15)) { const inner = inHeart((ay - 0.44) / 0.108, (x - 1.346) / 0.108); if (inner) { const hot = inHeart((ay - 0.44) / 0.06, (x - 1.352) / 0.06); o[0] = hot ? 1.3 : 1.05; o[1] = hot ? 1.2 : 0.74; o[2] = hot ? 1.25 : 0.9; } else shadeMetal(gx, gy, gz, PAL.gold, o); return; }
    if (lnx < -0.5 && inHeart((ay - 0.42) / 0.12, (z - 0.37) / 0.12)) { const inner = inHeart((ay - 0.42) / 0.085, (z - 0.37) / 0.085); if (inner) { o[0] = 1.2; o[1] = 0.32; o[2] = 0.55; } else shadeMetal(gx, gy, gz, PAL.gold, o); return; }
    if (lnx > 0.55 && z < 0.4 && inHeart(ay / 0.13, (z - 0.26) / 0.1)) { if (inHeart(ay / 0.095, (z - 0.262) / 0.072)) shadeGloss(gx, gy, gz, [0.42, 0.06, 0.24], [0.15, 0.0, 0.08], 0.6, rough, 0, o); else shadeMetal(gx, gy, gz, PAL.gold, o); return; }
    if (kind !== 2 && Math.abs(lny) > 0.8 && z > 0.19 && z < 0.225 && x > -1.4 && x < 1.22 && Math.abs(x - AXF) > ARCH + 0.06 && Math.abs(x - AXR) > ARCH + 0.06 && mat === M_PAINT) { o[0] = 1.15; o[1] = 0.88; o[2] = 1.06; return; }
    if (mat === M_LINER) { o[0] = 0.1; o[1] = 0.03; o[2] = 0.08; return; }
    if (mat === M_FLOOR) { shadeGloss(gx, gy, gz, PAL.floor, [0.1, 0.02, 0.07], 0.15, rough, 0, o); return; }
    if (mat === M_SEAT) { shadeGloss(gx, gy, gz, PAL.seat, PAL.sdeep, 0.35, rough, 0.6, o); const ch = Math.abs(Math.sin(y * 19)); if (ch < 0.12 && ay < 0.36) { const k2 = 0.82 + 0.18 * ch / 0.12; o[0] *= k2; o[1] *= k2 * 0.9; o[2] *= k2 * 0.95; } return; }
    if (mat === M_HEAD) { shadeGloss(gx, gy, gz, PAL.head, PAL.hdeep, 0.55, rough, 0.5, o); return; }
    if (mat === M_DASH) { shadeGloss(gx, gy, gz, PAL.dash, PAL.ddeep, 0.4, rough, 0.2, o); return; }
    if (mat === M_GOLD) { shadeMetal(gx, gy, gz, PAL.gold, o); return; }
    if (mat === M_EMB) { shadeGloss(gx, gy, gz, [1, 0.72, 0.88], PAL.hdeep, 0.9, rough, 1, o); return; }
    // the painted body: pearl hearts on the doors with a gold rim, a gold pin-stripe along the shoulder, pearl sill
    if (kind !== 2 && Math.abs(lny) > 0.45 && x > -0.52 && x < 0.08 && z > 0.22) { const u = (x + 0.22) / 0.15, v = (z - 0.36) / 0.13; if (inHeart(u, v)) { if (inHeart(u * 1.25, v * 1.25 + 0.02)) shadeGloss(gx, gy, gz, PAL.pearl, PAL.pdeep, 0.9, rough, 1, o); else shadeMetal(gx, gy, gz, PAL.gold, o); return; } }
    if (kind !== 2 && Math.abs(lny) > 0.3 && z > 0.455 && z < 0.475 && x > -1.5 && x < 1.36 && mat === M_PAINT) { shadeMetal(gx, gy, gz, PAL.gold, o); return; }
    if (kind !== 2 && z < 0.235 && Math.abs(lny) > 0.65 && mat === M_PAINT) { shadeGloss(gx, gy, gz, PAL.pearl, PAL.pdeep, 0.7, rough, 1, o); o[0] *= 0.92; o[1] *= 0.9; o[2] *= 0.94; return; }
    if (mat === M_PEARL) { shadeGloss(gx, gy, gz, PAL.pearl, PAL.pdeep, 0.95, rough, 1, o); return; }
    shadeGloss(gx, gy, gz, PAL.paint, PAL.deep, 1, rough, 0.75, o);
    if (kind === 1) { o[0] *= 0.97; o[1] *= 0.94; o[2] *= 0.96; }
  }

  /* ================= the bake: one heading into two pictures (behind the pet / in front of it) ================= */
  const NB = 32;
  const BK = { k: 0, spr: new Array(NB).fill(null), gen: null, genKey: '', queue: [], small: null, warmEv: 1, ms: 0, maxMs: 0, n: 0, maxBy: {} };
  const bucketOf = ag => ((Math.round(ag / TAU * NB) % NB) + NB) % NB;
  function scr0() { const cv = document.createElement('canvas'); cv.width = cv.height = 1; return cv.getContext('2d'); }
  /* one ray through the model: the colour behind the pet (B) and in front of it (F), premultiplied, and an id of what it
     hit (for finding edges to supersample) */
  function bil(A, lx, ly, out0) { const fx = (lx + GX0) / CELL, fy = (ly + GY0) / CELL, i = Math.floor(fx), j = Math.floor(fy); if (i < 0 || j < 0 || i >= NX - 1 || j >= NYc - 1) return out0; const u = fx - i, v = fy - j, k = j * NX + i; let a = A[k], b = A[k + 1], c = A[k + NX], d = A[k + NX + 1]; if (a < 0) a = out0; if (b < 0) b = out0; if (c < 0) c = out0; if (d < 0) d = out0; return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v; }
  const GLS = 0.34 / (GLX1 - GLX0);
  const SMP = { br: 0, bg: 0, bb: 0, ba: 0, fr: 0, fg: 0, fb: 0, fa: 0, id: 0 }, COL = [0, 0, 0];
  function sampleRay(pu, pv, ca, sa, seatG) {
    const o = SMP; o.br = o.bg = o.bb = o.ba = o.fr = o.fg = o.fb = o.fa = 0; o.id = 0;
    const M = MOD, Ht = M.Ht, Hb = M.Hb, Wt = M.Wt, Wb = M.Wb, Gz = M.Gz, Gm = M.Gm, dyg = ZK / GY, dz = 0.016;
    const yg0 = pv / GY, lx0 = pu * ca + yg0 * sa, dlx = dyg * sa, ly0 = -pu * sa + yg0 * ca, dly = dyg * ca;
    let zlo = 0, zhi = 1.02;
    if (Math.abs(dlx) > 1e-6) { const a = (-1.8 - lx0) / dlx, c2 = (1.8 - lx0) / dlx; zlo = Math.max(zlo, Math.min(a, c2)); zhi = Math.min(zhi, Math.max(a, c2)); } else if (Math.abs(lx0) > 1.8) return;
    if (Math.abs(dly) > 1e-6) { const a = (-0.9 - ly0) / dly, c2 = (0.9 - ly0) / dly; zlo = Math.max(zlo, Math.min(a, c2)); zhi = Math.min(zhi, Math.max(a, c2)); } else if (Math.abs(ly0) > 0.9) return;
    if (zhi <= zlo) return;
    let glassA = 0, gR = 0, gG = 0, gB = 0, gFront = false, hit = 0, hz = 0, hlx = 0, hly = 0, hk = 0, hkind = 0;
    // the windscreen is a plane: where this ray meets it, solved once
    let zg = -1, gFr = 0; { const den = 1 + GLS * dlx; if (Math.abs(den) > 1e-4) { const z1 = (0.6 + GLS * (GLX1 - lx0)) / den; if (z1 > 0.58 && z1 < 0.97 && z1 <= zhi + 0.05) { const gq = glassAt(lx0 + z1 * dlx, ly0 + z1 * dly); if (gq) { zg = z1; gFr = gq[1]; } } } }
    for (let z = zhi; z >= zlo - 1e-6; z -= dz) {
      const lx = lx0 + z * dlx, ly = ly0 + z * dly, i = ((lx + GX0) / CELL + 0.5) | 0, j = ((ly + GY0) / CELL + 0.5) | 0;
      if (i < 0 || j < 0 || i >= NX || j >= NYc) continue;
      const kk = j * NX + i;
      // the windscreen: tinted, translucent, mirroring the sky, with a bright diagonal streak; its frame is solid
      if (zg > 0 && z <= zg) { const gx2 = lx0 + zg * dlx, gy2 = ly0 + zg * dly; zg = -1;
        if (gFr) { hit = 3; hz = z; hlx = gx2; hly = gy2; hk = kk; break; }
        const ly = gy2, lx = gx2, nl = Math.hypot(1.79, ly * 1.1, 1), lnx = 1.79 / nl, lny = ly * 1.1 / nl, lnz = 1 / nl, gnx = lnx * ca - lny * sa, gny = lnx * sa + lny * ca;
        const ndv = Math.max(0.02, gny * VY + lnz * VZ), F = 0.1 + 0.9 * Math.pow(1 - ndv, 3);
        env(2 * ndv * gnx, 2 * ndv * gny - VY, 2 * ndv * lnz - VZ, OUT);
        const nh = Math.max(0, gnx * HH0 + gny * HH1 + lnz * HH2), sp = Math.pow(nh, 70) * 1.3, streak = Math.abs(((z - 0.6) * 3.2 + ly * 1.4 + 0.15) % 1 - 0.5) < 0.06 ? 0.55 : 0;
        const ta = 0.4, rk = 0.55 * F + streak;
        glassA = Math.min(0.92, ta + rk * 0.5 + sp); gR = 0.5 * ta + OUT[0] * rk + sp + streak * 0.3; gG = 0.3 * ta + OUT[1] * rk + sp + streak * 0.3; gB = 0.56 * ta + OUT[2] * rk + sp + streak * 0.3;
        gFront = (lx * sa + ly * ca) > seatG + 0.03;
      }
      if (Wt[kk] >= 0 && z <= Wt[kk] && z >= Wb[kk]) { hit = 2; hz = z; hlx = lx; hly = ly; hk = kk; hkind = Wt[kk] - z < dz * 2.5 ? 2 : 3; break; }
      if (z < WZ + WR && Math.abs(ly) > WY - TWH && Math.abs(ly) < WY + TWH) { const dxf = lx - AXF, dxr = lx - AXR, dzw = z - WZ; if (dxf * dxf + dzw * dzw < WR * WR || dxr * dxr + dzw * dzw < WR * WR) { hit = 4; break; } }
      const ht = Ht[kk];
      if (ht >= 0 && z <= ht && z >= Hb[kk]) { hit = 1; hk = kk; hkind = ht - z > 0.11 ? 1 : 0;
        // refined on the smooth (bilinear) surface between this step and the last
        let a = z, b2 = z + dz; if (bil(Ht, lx0 + a * dlx, ly0 + a * dly, 0) >= a) for (let r = 0; r < 5; r++) { const m = (a + b2) / 2; if (bil(Ht, lx0 + m * dlx, ly0 + m * dly, 0) >= m) a = m; else b2 = m; }
        hz = a; hlx = lx0 + a * dlx; hly = ly0 + a * dly;
        break; }
    }
    let r = 0, g2 = 0, b3 = 0, a = 0, front = false, mat = 0;
    if (hit === 1 || hit === 2 || hit === 3) {
      let lnx, lny, lnz;
      if (hit === 1) { mat = M.Mt[hk]; lnx = bil(M.Nx, hlx, hly, 0); lny = bil(M.Ny, hlx, hly, 0); lnz = bil(M.Nz, hlx, hly, 0); if (hkind === 1 || Math.hypot(lnx, lny, lnz) < 0.3) { const gl = Math.hypot(M.Nx[hk], M.Ny[hk]); if (gl > 0.05) { lnx = M.Nx[hk] / gl * 0.97; lny = M.Ny[hk] / gl * 0.97; } else { const rl = Math.hypot(hlx, hly * 2) || 1; lnx = hlx / rl; lny = hly * 2 / rl; } lnz = 0.24; }
        if (hkind === 1 && Math.abs(hly) < WY - TWH && Math.abs(hly) > 0.3 && hz < 0.7 && (Math.abs(hlx - AXF) < ARCH + 0.02 || Math.abs(hlx - AXR) < ARCH + 0.02)) mat = M_LINER; }
      else if (hit === 2) { mat = M.Wm[hk]; if (hkind === 2) { lnx = M.Ex[hk]; lny = M.Ey[hk]; lnz = M.Ez[hk]; } else { const gl = Math.hypot(M.Ex[hk], M.Ey[hk]); if (gl > 0.05) { lnx = M.Ex[hk] / gl; lny = M.Ey[hk] / gl; } else { lnx = 0; lny = Math.sign(hly); } lnz = 0.15; } }
      else { mat = M_GOLD; lnx = 0.6; lny = hly * 0.5; lnz = 0.75; }
      const nl = Math.hypot(lnx, lny, lnz); lnx /= nl; lny /= nl; lnz /= nl;
      const gnx = lnx * ca - lny * sa, gny = lnx * sa + lny * ca;
      shadeHit(hlx, hly, hz, lnx, lny, lnz, gnx, gny, lnz, mat, hit === 2 ? 2 : hkind, COL);
      let ao = 1; if (hit === 1 && (mat === M_FLOOR || mat === M_SEAT || mat === M_DASH)) { const dk = sdRR(hlx - CKX, hly, CKL, CKW, CKR); ao = 0.6 + 0.4 * cl(-dk / 0.22); if (mat === M_SEAT && hz > 0.5) ao = Math.max(ao, 0.9); }
      if (hit === 1 && hlx < -1.3 && Math.abs(hly) < 0.72 && hz < 0.8) ao *= 0.85;
      if (hit !== 2 && mat === M_PAINT) ao *= 0.72 + 0.28 * sstep(0.17, 0.5, hz);   // (the lower body darkens toward the floor)
      r = Math.min(1, COL[0] * ao); g2 = Math.min(1, COL[1] * ao); b3 = Math.min(1, COL[2] * ao); a = 1;
      front = (hlx * sa + hly * ca) > seatG + 0.03;
      o.id = hit * 64 + mat * 4 + (front ? 2 : 0) + hkind % 2;
    } else if (hit === 4) o.id = 3;
    if (glassA > 0) {
      o.id += 1000;
      gR = cl(gR); gG = cl(gG); gB = cl(gB);
      if (gFront && !front) { if (a) { o.br = r; o.bg = g2; o.bb = b3; o.ba = 1; } o.fr = gR * glassA; o.fg = gG * glassA; o.fb = gB * glassA; o.fa = glassA; return; }
      const ga = glassA; r = gR * ga + r * a * (1 - ga); g2 = gG * ga + g2 * a * (1 - ga); b3 = gB * ga + b3 * a * (1 - ga); a = ga + a * (1 - ga);
      if (front || gFront) { o.fr = r; o.fg = g2; o.fb = b3; o.fa = a; } else { o.br = r; o.bg = g2; o.bb = b3; o.ba = a; } return;
    }
    if (a) { if (front) { o.fr = r; o.fg = g2; o.fb = b3; o.fa = 1; } else { o.br = r; o.bg = g2; o.bb = b3; o.ba = 1; } }
  }
  function* bakeBucket(b, k) {
    while (!MOD) yield;
    const ag = b / NB * TAU, ca = Math.cos(ag), sa = Math.sin(ag), seatG = SEAT.x * sa + SEAT.y * ca;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const [lx, ly] of [[1.78, 0.88], [1.78, -0.88], [-1.78, 0.88], [-1.78, -0.88]]) { const gx = lx * ca - ly * sa, gy = (lx * sa + ly * ca) * GY; u0 = Math.min(u0, gx); u1 = Math.max(u1, gx); v0 = Math.min(v0, gy - 1.02 * ZK); v1 = Math.max(v1, gy); }
    const W = Math.ceil((u1 - u0) * k) + 6, Hh = Math.ceil((v1 - v0) * k) + 6, ox = -u0 * k + 3, oy = -v0 * k + 3;
    yield; BK.st = 'alloc'; const NP = W * Hh, CB = new Float32Array(NP * 4), CF = new Float32Array(NP * 4), ID = new Int32Array(NP);
    yield; let tY = nowMs();
    const put = (pi, o) => { const q = pi * 4; CB[q] = o.br; CB[q + 1] = o.bg; CB[q + 2] = o.bb; CB[q + 3] = o.ba; CF[q] = o.fr; CF[q + 1] = o.fg; CF[q + 2] = o.fb; CF[q + 3] = o.fa; ID[pi] = o.id; };
    BK.st = 'rays'; for (let py = 0; py < Hh; py++) { const pv = (py + 0.5 - oy) / k; for (let px = 0; px < W; px++) { sampleRay((px + 0.5 - ox) / k, pv, ca, sa, seatG); put(py * W + px, SMP); if ((px & 15) === 15 && nowMs() - tY > 1.6) { yield; tY = nowMs(); } } }
    // anti-aliasing: every pixel whose neighbour hit something else is sampled again four times and averaged
    BK.st = 'aa'; const ACC = new Float32Array(8);
    for (let py = 0; py < Hh; py++) { for (let px = 0; px < W; px++) { const pi = py * W + px, id = ID[pi];
      if (!((px + 1 < W && ID[pi + 1] !== id) || (px > 0 && ID[pi - 1] !== id) || (py + 1 < Hh && ID[pi + W] !== id) || (py > 0 && ID[pi - W] !== id))) continue;
      ACC.fill(0); for (let si = 0; si < 4; si++) { const dx = si & 1 ? 0.25 : -0.25, dy = si & 2 ? 0.25 : -0.25; sampleRay((px + 0.5 + dx - ox) / k, (py + 0.5 + dy - oy) / k, ca, sa, seatG); ACC[0] += SMP.br; ACC[1] += SMP.bg; ACC[2] += SMP.bb; ACC[3] += SMP.ba; ACC[4] += SMP.fr; ACC[5] += SMP.fg; ACC[6] += SMP.fb; ACC[7] += SMP.fa; }
      const q = pi * 4, w0 = 0.2, w1 = 0.2;   // (the centre sample keeps a fifth)
      CB[q] = CB[q] * w0 + ACC[0] * w1; CB[q + 1] = CB[q + 1] * w0 + ACC[1] * w1; CB[q + 2] = CB[q + 2] * w0 + ACC[2] * w1; CB[q + 3] = CB[q + 3] * w0 + ACC[3] * w1;
      CF[q] = CF[q] * w0 + ACC[4] * w1; CF[q + 1] = CF[q + 1] * w0 + ACC[5] * w1; CF[q + 2] = CF[q + 2] * w0 + ACC[6] * w1; CF[q + 3] = CF[q + 3] * w0 + ACC[7] * w1; if (nowMs() - tY > 1.6) { yield; tY = nowMs(); } }
      if (nowMs() - tY > 1.6) { yield; tY = nowMs(); } }
    // the silhouette: a soft dark rim just inside (the game's outline, softly)
    BK.st = 'rim'; const UA = i => CB[i * 4 + 3] + CF[i * 4 + 3], RIM = [0.25, 0.06, 0.17], rim = [];
    for (let py = 1; py < Hh - 1; py++) { for (let px = 1; px < W - 1; px++) { const pi = py * W + px, ua = UA(pi); if (ua < 0.35) continue; const mn = Math.min(UA(pi - 1), UA(pi + 1), UA(pi - W), UA(pi + W)); if (mn < 0.3) rim.push(pi, 1 - mn / 0.3); } if (nowMs() - tY > 1.6) { yield; tY = nowMs(); } }
    for (let i = 0; i < rim.length; i += 2) { const pi = rim[i], k2 = rim[i + 1] * 0.5, A2 = CF[pi * 4 + 3] > CB[pi * 4 + 3] ? CF : CB, q = pi * 4, al = A2[q + 3]; A2[q] = lerp(A2[q], RIM[0] * al, k2); A2[q + 1] = lerp(A2[q + 1], RIM[1] * al, k2); A2[q + 2] = lerp(A2[q + 2], RIM[2] * al, k2); }
    yield; tY = nowMs();
    // into two canvases, each cropped to what it holds
    const out = {};
    for (const [key, A2] of [['back', CB], ['front', CF]]) {
      BK.st = 'box'; let x0 = W, y0 = Hh, x1 = -1, y1 = -1; for (let py = 0; py < Hh; py++) { for (let px = 0; px < W; px++) if (A2[(py * W + px) * 4 + 3] > 0.004) { if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py; } if (nowMs() - tY > 1.6) { yield; tY = nowMs(); } }
      if (x1 < 0) { out[key] = null; continue; } yield; tY = nowMs();
      BK.st = 'mkcv'; const w2 = x1 - x0 + 1, h2 = y1 - y0 + 1, cv = document.createElement('canvas'); cv.width = w2; cv.height = h2; const cx = cv.getContext('2d'); yield; BK.st = 'imgdata'; const id = cx.createImageData(w2, h2), D = id.data; tY = nowMs();
      for (let py = 0; py < h2; py++) { for (let px = 0; px < w2; px++) { const s = ((py + y0) * W + px + x0) * 4, d = (py * w2 + px) * 4, al = A2[s + 3]; if (al <= 0.004) continue; D[d] = Math.min(255, A2[s] / al * 255); D[d + 1] = Math.min(255, A2[s + 1] / al * 255); D[d + 2] = Math.min(255, A2[s + 2] / al * 255); D[d + 3] = Math.min(255, al * 255); } if (nowMs() - tY > 1.6) { yield; tY = nowMs(); } }
      BK.st = 'fill'; yield; BK.st = 'put'; for (let y = 0; y < h2; y += 48) { cx.putImageData(id, 0, 0, 0, y, w2, Math.min(48, h2 - y)); yield; } out[key] = { cv, x: x0 - ox, y: y0 - oy }; yield; tY = nowMs();
    }
    BK.spr[b] = { back: out.back, front: out.front, k };
  }
  /* the small pictures: the wheel's face (tyre, pearl rim, a gold star hub with a pink gem), its back, heart and star
     sprites with a bevel, the heart seal, the car's soft shadow, the button emblems */
  let SM = null;
  function* buildSmall() {
    const S = {}, mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h || w; return [cv, cv.getContext('2d')]; };
    { const P = 128, [cv, c] = mk(P), R = P / 2 - 1; c.translate(P / 2, P / 2);
      let gr = c.createRadialGradient(-R * 0.2, -R * 0.25, R * 0.3, 0, 0, R); gr.addColorStop(0, '#5A4A5E'); gr.addColorStop(0.75, '#2C2232'); gr.addColorStop(1, '#151018'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.13)'; c.lineWidth = R * 0.05; c.beginPath(); c.arc(0, 0, R * 0.86, 3.6, 5.6); c.stroke();
      for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = R * 0.035; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.9, Math.sin(a) * R * 0.9); c.lineTo(Math.cos(a) * R * 0.99, Math.sin(a) * R * 0.99); c.stroke(); }
      gr = c.createLinearGradient(-R, -R, R, R); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.45, '#F4DCEB'); gr.addColorStop(1, '#B7899F'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, R * 0.72, 0, TAU); c.fill();
      gr = c.createRadialGradient(0, 0, R * 0.1, 0, 0, R * 0.64); gr.addColorStop(0, '#C23A7E'); gr.addColorStop(1, '#6E1748'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, R * 0.64, 0, TAU); c.fill();
      // the star hub: five arms, each a lit and a shaded facet
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU, a1 = a - TAU / 10, a2 = a + TAU / 10, tip = [Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6], l = [Math.cos(a1) * R * 0.25, Math.sin(a1) * R * 0.25], r = [Math.cos(a2) * R * 0.25, Math.sin(a2) * R * 0.25];
        const lit = Math.cos(a - (-2.3)) * 0.5 + 0.5;
        c.fillStyle = `rgb(255,${Math.round(205 + 45 * lit)},${Math.round(100 + 120 * lit)})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(l[0], l[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fill();
        c.fillStyle = `rgb(${Math.round(200 + 40 * lit)},${Math.round(140 + 50 * lit)},${Math.round(50 + 50 * lit)})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(r[0], r[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(110,60,10,.7)'; c.lineWidth = 1.5; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? R * 0.25 : R * 0.6; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.stroke();
      gr = c.createRadialGradient(-R * 0.05, -R * 0.06, 1, 0, 0, R * 0.15); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.4, '#FF9ACF'); gr.addColorStop(1, '#C2397F'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, R * 0.14, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = R * 0.03; c.beginPath(); c.arc(0, 0, R * 0.71, 3.7, 5.3); c.stroke();
      S.wheel = cv; }
    yield;
    { const P = 64, [cv, c] = mk(P), R = P / 2 - 1; c.translate(P / 2, P / 2); const gr = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R); gr.addColorStop(0, '#3A2A3C'); gr.addColorStop(0.7, '#241A28'); gr.addColorStop(1, '#120C14'); c.fillStyle = gr; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill(); c.strokeStyle = 'rgba(160,110,140,.45)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R * 0.7, 0, TAU); c.stroke(); S.wheelB = cv; }
    // a glossy heart (a dimensional sweet: lit lobe, deep edge, a bright highlight and a rim of reflected light)
    const heartPath = (c, s) => { c.beginPath(); for (let i = 0; i <= 48; i++) { const t = i / 48 * TAU, x = 16 * Math.pow(Math.sin(t), 3), y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? c.lineTo(x * s, y * s) : c.moveTo(x * s, y * s); } c.closePath(); };
    S.heartPath = heartPath;
    const heartSpr = (base, lit, deep) => { const P = 64, [cv, c] = mk(P); c.translate(P / 2, P / 2 + 1); const s = P / 36;
      heartPath(c, s); let gr = c.createRadialGradient(-P * 0.14, -P * 0.16, P * 0.02, 0, 0, P * 0.5); gr.addColorStop(0, lit); gr.addColorStop(0.45, base); gr.addColorStop(1, deep); c.fillStyle = gr; c.fill();
      c.save(); heartPath(c, s); c.clip(); c.strokeStyle = rgba('#FFFFFF', 0.35); c.lineWidth = P * 0.07; heartPath(c, s * 1.04); c.translate(P * 0.02, P * 0.03); c.stroke(); c.restore();
      c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(-P * 0.15, -P * 0.13, P * 0.085, P * 0.05, -0.6, 0, TAU); c.fill(); c.beginPath(); c.arc(-P * 0.04, -P * 0.19, P * 0.025, 0, TAU); c.fill();
      c.strokeStyle = rgba(deep, 0.9); c.lineWidth = 1.2; heartPath(c, s); c.stroke(); return cv; };
    S.heart = heartSpr('#FF6FB5', '#FFE1F1', '#B0246F'); S.heartP = heartSpr('#FFD2EA', '#FFFFFF', '#E07AB2'); S.heartG = heartSpr('#FFD86B', '#FFF7DA', '#C08A1C');
    yield;
    // a beveled five-pointed star: gold-white core, rose-pink edges
    { const P = 64, [cv, c] = mk(P), R = P / 2 - 2; c.translate(P / 2, P / 2 + 1);
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU, a1 = a - TAU / 10, a2 = a + TAU / 10, tip = [Math.cos(a) * R, Math.sin(a) * R], l = [Math.cos(a1) * R * 0.42, Math.sin(a1) * R * 0.42], r = [Math.cos(a2) * R * 0.42, Math.sin(a2) * R * 0.42], lit = Math.cos(a + 2.3) * 0.5 + 0.5;
        let gr = c.createLinearGradient(0, 0, tip[0], tip[1]); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.55, `rgb(255,${Math.round(220 + 30 * lit)},${Math.round(150 + 90 * lit)})`); gr.addColorStop(1, '#FF8FC6'); c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.lineTo(l[0], l[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fill();
        gr = c.createLinearGradient(0, 0, tip[0], tip[1]); gr.addColorStop(0, '#FFF2C8'); gr.addColorStop(0.55, `rgb(${Math.round(235 + 20 * lit)},${Math.round(170 + 40 * lit)},${Math.round(90 + 60 * lit)})`); gr.addColorStop(1, '#E2569C'); c.fillStyle = gr; c.beginPath(); c.moveTo(0, 0); c.lineTo(r[0], r[1]); c.lineTo(tip[0], tip[1]); c.closePath(); c.fill(); }
      c.strokeStyle = 'rgba(194,80,143,.85)'; c.lineWidth = 1.2; c.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? R * 0.42 : R; i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.closePath(); c.stroke();
      S.star = cv; }
    yield;
    // the heart seal (laid flat on the floor when drawn): rings, ticks, little hearts round a great heart
    { const P = 384, [cv, c] = mk(P), R = P / 2 - 4; c.translate(P / 2, P / 2);
      const ring = (r, w, col, a) => { c.strokeStyle = rgba(col, a * 0.18); c.lineWidth = w * 6; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = rgba(col, a * 0.4); c.lineWidth = w * 2.4; c.stroke(); c.strokeStyle = rgba('#FFFFFF', a * 0.95); c.lineWidth = w; c.stroke(); };
      ring(R * 0.92, 2.2, '#FF8FC8', 1); ring(R * 0.8, 1.4, GOLD, 0.85); ring(R * 0.42, 1.2, '#FF8FC8', 0.7);
      c.strokeStyle = rgba('#FFE7F4', 0.85); c.lineWidth = 1.6; for (let i = 0; i < 64; i++) { const a = i / 64 * TAU, l = i % 4 === 0 ? 0.07 : 0.03; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); c.lineTo(Math.cos(a) * R * (0.8 + l), Math.sin(a) * R * (0.8 + l)); c.stroke(); }
      for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + TAU / 24; c.save(); c.translate(Math.cos(a) * R * 0.86, Math.sin(a) * R * 0.86); c.rotate(a + Math.PI / 2); c.fillStyle = rgba(i % 2 ? GOLD : '#FFC2E2', 0.9); heartPath(c, R * 0.0028); c.fill(); c.restore(); }
      c.save(); c.translate(0, R * 0.04); c.strokeStyle = rgba('#FF8FC8', 0.3); c.lineWidth = 14; heartPath(c, R * 0.032); c.stroke(); c.strokeStyle = rgba('#FFE3F2', 0.95); c.lineWidth = 3.4; c.stroke(); c.strokeStyle = rgba(GOLD, 0.7); c.lineWidth = 1.6; heartPath(c, R * 0.024); c.stroke(); c.restore();
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i / 5 * TAU; c.strokeStyle = rgba(GOLD, 0.5); c.lineWidth = 1.2; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42); c.lineTo(Math.cos(a + TAU * 2 / 5) * R * 0.42, Math.sin(a + TAU * 2 / 5) * R * 0.42); c.stroke(); }
      S.seal = cv; }
    yield;
    // a feathered shockwave ring (laid flat on the floor when drawn): a bright pearl rim fading into a pink haze inside
    { const P = 128, [cv, c] = mk(P), gr = c.createRadialGradient(64, 64, 0, 64, 64, 63); gr.addColorStop(0, 'rgba(255,127,192,0)'); gr.addColorStop(0.55, 'rgba(255,127,192,.08)'); gr.addColorStop(0.8, 'rgba(255,170,215,.4)'); gr.addColorStop(0.9, 'rgba(255,248,251,1)'); gr.addColorStop(0.95, 'rgba(255,200,230,.45)'); gr.addColorStop(1, 'rgba(255,127,192,0)'); c.fillStyle = gr; c.fillRect(0, 0, P, P); S.ring = cv; }
    // the car's soft shadow (a rounded oblong, laid on the floor along the car)
    { const P = 128, [cv, c] = mk(P, 64); const gr = c.createRadialGradient(64, 32, 4, 64, 32, 62); gr.addColorStop(0, 'rgba(20,4,16,.55)'); gr.addColorStop(0.55, 'rgba(20,4,16,.38)'); gr.addColorStop(1, 'rgba(20,4,16,0)'); c.save(); c.scale(1, 0.5); c.fillStyle = gr; c.beginPath(); c.arc(64, 64, 64, 0, TAU); c.fill(); c.restore(); S.shadow = cv; }
    SM = S;
  }
  /* the background baker: the model, the small pictures, then the headings in order of need */
  function setScale(k) { k = Math.max(32, Math.min(104, Math.round(k / 8) * 8)); if (BK.k && k <= BK.k) return; BK.k = k; BK.spr.fill(null); if (BK.gen && BK.genKey !== 'model' && BK.genKey !== 'small') { BK.gen = null; BK.genKey = ''; } BK.queue = []; for (let i = 0; i < NB; i++) BK.queue.push(i); }
  function want(b) { if (BK.spr[b] || BK.genKey === 'b' + b) return; const i = BK.queue.indexOf(b); if (i > 0) { BK.queue.splice(i, 1); BK.queue.unshift(b); } else if (i < 0) BK.queue.unshift(b); }
  function bakeStep(ms) {
    const t0 = nowMs();
    while (nowMs() - t0 < ms) {
      if (!BK.gen) {
        if (!MOD) { BK.gen = buildModel(); BK.genKey = 'model'; }
        else if (!SM) { BK.gen = buildSmall(); BK.genKey = 'small'; }
        else { while (BK.queue.length && BK.spr[BK.queue[0]]) BK.queue.shift(); if (!BK.queue.length || !BK.k) break; const b = BK.queue.shift(); BK.gen = bakeBucket(b, BK.k); BK.genKey = 'b' + b; }
      }
      BK.st0 = BK.st; const s0 = nowMs(), r = BK.gen.next(), d = nowMs() - s0; BK.st0 = BK.st0 + '>' + BK.st; BK.ms += d; BK.maxMs = Math.max(BK.maxMs, d); const gk = BK.genKey[0] === 'b' ? 'bucket:' + BK.st0 : BK.genKey; BK.maxBy[gk] = Math.max(BK.maxBy[gk] || 0, d);
      if (r.done) { BK.gen = null; BK.genKey = ''; BK.n++; }
    }
    try { const MV = moves(); if (MV && MV.warm && nowMs() - t0 < ms) MV.warm(Math.max(0.5, ms - (nowMs() - t0))); } catch (e) { /* (C2's warm-up must not stop ours) */ }
  }
  let IDLE = false;
  function idleBake() {
    if (IDLE || !(BK.gen || !MOD || !SM || BK.queue.some(b => !BK.spr[b]))) return; IDLE = true;
    const go = () => { IDLE = false; idleBake(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => { bakeStep(dl.didTimeout ? 2 : Math.max(1, Math.min(5, dl.timeRemaining() - 1))); go(); }, { timeout: 150 });
    else setTimeout(() => { bakeStep(3); go(); }, 40);
  }
  const ready = b => !!(BK.spr[b] && SM);
  /* the nearest baked heading to b (the car is drawn from it, turned the rest of the way) */
  function nearestReady(b) { for (let d = 0; d <= NB / 2; d++) { if (BK.spr[(b + d) % NB]) return (b + d) % NB; if (BK.spr[(b - d + NB) % NB]) return (b - d + NB) % NB; } return -1; }

  /* ================= C2's moves (looked up at call time), or a stub so the whole flow can run ================= */
  const STUB = {
    TUNE: { starCd: 2.6, loveCd: 3.2 },
    shootingStar(ctx) { let n = 0; const go = () => { if (!ctx.alive()) { ctx.done(); return; } const car = ctx.car; for (const m of ctx.H.living()) { if (Math.hypot(m.x - car.x, m.y - car.y) < 5) ctx.hit(m, ctx.DK * 0.35); } ctx.H.X.ring(car.x, car.y, 0.4, 5, 0.4, GOLD, 0.2); if (++n < ctx.tier + 2) ctx.H.X.after(0.25, go); else ctx.done(); }; go(); },
    loveSensation(ctx) { const car = ctx.car, T = ctx.target(), p = ctx.nearestStand(T.x, T.y), x0 = car.x, y0 = car.y; let t = 0;
      const f = ctx.H.add({ life: 1.2, update(dt) { t += dt; if (!ctx.alive()) { f.life = 0; return; } const u = cl(t / 0.9); car.x = lerp(x0, p.x, u); car.y = lerp(y0, p.y, u); car.z = Math.sin(u * Math.PI) * 1.4; if (u >= 1 && !f.hit) { f.hit = 1; car.z = 0; ctx.hitArea(car.x, car.y, 2.4, ctx.DK * 3.2); ctx.H.X.ring(car.x, car.y, 0.4, 2.4, 0.5, ROSE, 0.3); ctx.done(); } } }); },
    supernova(ctx) { const car = ctx.car; let t = 0, k = 0; const n = ctx.tier + 2;
      const f = ctx.H.add({ life: 6, update(dt) { t += dt; if (!ctx.alive()) { f.life = 0; return; } car.a += dt * 3; car.wheelSpin = 60;
        if (k < n && t > 0.6 + k * 0.7) { k++; ctx.hitArea(car.x, car.y, 3 + k * 0.5, ctx.DK * 1.6, { noCharge: true }); ctx.H.X.ring(car.x, car.y, 0.4, 3 + k * 0.5, 0.5, ROSE, 0.3); }
        if (k >= n && !f.boom && t > 0.8 + n * 0.7) { f.boom = t; ctx.hitArea(car.x, car.y, 5, ctx.DK * 6, { noCharge: true }); car.vis = 0; ctx.ejecting = true; const s = ctx.seat(); f.ex = [s.x, s.y]; f.to = ctx.nearestStand(s.x + 1.2, s.y + 0.8); }
        if (f.boom) { const u = cl((t - f.boom) / 0.8); ctx.petX = lerp(f.ex[0], f.to.x, u); ctx.petY = lerp(f.ex[1], f.to.y, u); ctx.petZ = Math.sin(u * Math.PI) * 1.6; if (u >= 1 && !f.dn) { f.dn = 1; f.life = 0; ctx.done(); } } } }); },
  };
  function moves() { try { return typeof SPORTSCAR_MOVES !== 'undefined' && SPORTSCAR_MOVES ? SPORTSCAR_MOVES : STUB; } catch (e) { return STUB; } }
  const mvTune = (k, d) => { const M = moves(); return M && M.TUNE && M.TUNE[k] != null ? M.TUNE[k] : d; };

  /* ================= the form ================= */
  function startForm(C, H) {
    const me = H.me, g = H.g, X = H.X, ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const kit = X.kit ? X.kit() : null, CD = (kit && kit.ult && kit.ult.key === 'ey_sportscar' && kit.ult.cd) || TUNE.cd;
    const dur = TUNE.dur[tier - 1];
    // the scale the car is drawn at, and its first heading baked first
    const T0 = X.Tz(), dpr = (typeof arc !== 'undefined' && arc.dpr) || 1; setScale(T0 * dpr / Math.max(0.6, g.zoom || 1));
    // the car's place: the pet in the driver's seat, the car facing the nearest monster (or the way the pet faces),
    // turned or nudged until it fits between the walls
    const tgt = X.nearestMon(me.x, me.y, 9) || null; let a = tgt ? Math.atan2(tgt.y - me.y, tgt.x - me.x) : (me.face < 0 ? Math.PI : 0);
    const car = { x: me.x, y: me.y, a, vx: 0, vy: 0, speed: 0, z: 0, susp: 0, lean: 0, slide: 0, glow: 0, scale: 1, locked: true, contact: true, vis: 1, wheelSpin: null, spinA: 0, steer: 0, prevX: me.x, prevY: me.y, prevA: a };
    const S = { H, g, me, X, ev, tier, DK, CD, dur, left: dur, car, phase: 'summon', t: 0, hold: 0, charge: 0, used: false, busy: null, busyT: 0, cdStar: 0, cdLove: 0, cdDrift: 0, drift: null,
      gate: new Map(), trail: [[], [], [], []], parts: [], free: [], lights: 0, ended: false, pet: X.pet ? X.pet() : null, sfxT: 0, bumpT: 0, ltT: 0, outT: 0, outHow: '', stats: { ram: 0, drift: 0, star: 0, love: 0, nova: 0, dealt: 0, charged: 0, hits: 0 }, petStand: null };
    g._sportscar = S;
    // seat at the pet: the car's centre is ahead of it
    const place = (ang) => { const o = seatOff(car, ang); return { x: me.x - o[0], y: me.y - o[1] }; };
    let best = null; for (let k2 = 0; k2 < 12 && !best; k2++) { const ang = a + (k2 % 2 ? 1 : -1) * Math.ceil(k2 / 2) * (Math.PI / 6); const p = place(ang); if (!poseBlocked(X, p.x, p.y, ang)) best = { x: p.x, y: p.y, a: ang }; }
    if (!best) for (let r = 0.3; r < 2.6 && !best; r += 0.3) for (let i = 0; i < 12 && !best; i++) for (const ang of [a, a + Math.PI / 2]) { const p = place(ang), x = p.x + Math.cos(i / 12 * TAU) * r, y = p.y + Math.sin(i / 12 * TAU) * r; if (!poseBlocked(X, x, y, ang)) { best = { x, y, a: ang }; break; } }
    if (best) { car.x = best.x; car.y = best.y; car.a = best.a; } else { car.x = me.x; car.y = me.y; }
    car.prevX = car.x; car.prevY = car.y; car.prevA = car.a;
    S.sealX = me.x; S.sealY = me.y; S.petX0 = me.x; S.petY0 = me.y;
    want(bucketOf(groundA(car.a)));
    // the context the moves (C2) are given
    const ctx = S.ctx = { X, H, C, evo: ev, tier, DK, car, petX: me.x, petY: me.y, petZ: 0, ejecting: false, supernova: false,
      hit: (m, dmg, o) => hitCharge(S, m, dmg, o), hitArea: (x, y, r, dmg, o) => { let n = 0; for (const m of H.living()) if (Math.hypot(m.x - x, m.y - y) < r + m.r) { hitCharge(S, m, dmg, o); n++; } return n; },
      canStand: (x, y) => canStand(X, x, y), nearestStand: (x, y) => nearestStand(S, x, y), target: () => target(S), done: () => actionDone(S), alive: () => !S.ended && !me.dead && !g.over && (S.phase === 'nova' || (S.phase === 'drive' && !g.won)),   /* (a started Supernova finishes even if it wins the floor) */
      T: () => X.Tz(), scr: (x, y, z) => [H.sx(x), H.sy(y) - (z || 0) * ZK * X.Tz()], seat: () => seatWorld(car) };
    // the controls (20b's VEH hook)
    S.veh = { get active() { return !S.released; }, drive: (mx, my, dt) => drive(S, mx, my, dt), dodge: (mx, my) => tryDrift(S, mx, my), strong: slot => tryMove(S, slot), ult: () => tryNova(S), drawBtns: (c, o) => drawBtns(S, c, o), onSwitch: () => finish(S, 'swap') };
    X.vehicle(S.veh);
    // the effect that runs it all (and hides the pet while it lives: me.petAlt, 20b's drawPet)
    const F = S.fx = H.add({ key: 'sportscar', life: 1e9, entY: car.y,
      update(dt) { step(S, dt); },
      drawUnder(c) { drawUnder(S, c); }, drawEnt(c) { drawEnt(S, c); }, draw(c) { drawOver(S, c); },
      onEnd() { if (!S.released) release(S); } });
    me.petAlt = F;
    // the summoning: a sparkling chime
    const sfx = X.sfx || {}; if (sfx.note) [1046, 1318, 1568, 2093, 2637].forEach((f, i) => sfx.note(f, 0.5, 'sine', 0.09, f * 1.01, i * 0.09)); if (sfx.sparkle) sfx.sparkle();
    return S;
  }
  /* the car's ground-plane heading (the picture's) for a screen heading a: its nose points along (cos a, sin a) on the screen */
  const groundA = a => Math.atan2(Math.sin(a), GY * Math.cos(a));
  /* a point of the car's own frame (lx forward, ly left, z up) in the world (x, y) and on the screen's height */
  function l2w(car, lx, ly, ab) { const ag = groundA(ab == null ? car.a + car.slide : ab), ca = Math.cos(ag), sa = Math.sin(ag); return [car.x + lx * ca - ly * sa, car.y + (lx * sa + ly * ca) * GY]; }
  function seatOff(car, ab) { const p = l2w({ x: 0, y: 0, a: ab, slide: 0 }, SEAT.x, SEAT.y, ab); return p; }
  function seatWorld(car) { const p = l2w(car, SEAT.x, SEAT.y); return { x: p[0], y: p[1], z: SEAT.z + car.z - car.susp * 0.05 }; }
  /* walls: three circles along the car's axis (its nose and tail as they show on the screen) */
  function poseBlocked(X, x, y, ab) { const ag = groundA(ab), ca = Math.cos(ag), sa = Math.sin(ag), ex = 1.02 * ca, ey = 1.02 * sa * GY;
    return X.blocked(x, y, 0.5, 0) || X.blocked(x + ex, y + ey, 0.4, 0) || X.blocked(x - ex, y - ey, 0.4, 0); }
  function canStand(X, x, y) { return !X.blocked(x, y, 0.38, 0) && !X.blocked(x, y, 0.2, 0); }
  function nearestStand(S, x, y) { const me = S.me, p = S.X.walkPoint(x, y, { r: 0.4, x: me.x, y: me.y }); return { x: p.x, y: p.y }; }
  function target(S) { const car = S.car, X = S.X; const m = X.nearestMon(car.x, car.y, 8.5, null, true) || X.nearestMon(car.x, car.y, 12); if (m) return { x: m.x, y: m.y, m }; return { x: car.x + Math.cos(car.a) * 4, y: car.y + Math.sin(car.a) * 4, m: null }; }

  /* ---- damage and the meter: every event counted once, after mitigation, without overkill ---- */
  function hitCharge(S, m, dmg, o) {
    if (!m || m.dead || m.falling || !(dmg > 0)) return 0;
    const before = Math.max(0, m.hp), r = S.X.hitMon(m, dmg, Object.assign({ el: 'light', src: 'ult' }, o || {}));
    const dealt = Math.max(0, Math.min(r || 0, before));
    if (!(dealt > 0)) return 0;
    S.stats.dealt += dealt; S.stats.hits++;
    if (!(o && o.noCharge) && S.phase === 'drive' && !S.used) { const c0 = S.charge; S.charge = Math.min(1, S.charge + dealt / (TUNE.chargeK * S.DK)); S.stats.charged += S.charge - c0;
      if (c0 < 1 && S.charge >= 1) { S.readyT = 0; const sfx = S.X.sfx || {}; if (sfx.note) [784, 988, 1175, 1568].forEach((f, i) => sfx.note(f, 0.35, 'triangle', 0.08, f, i * 0.07)); S.X.text(S.me.x, S.me.y - 1.9, 'SUPERNOVA READY', GOLD, 15, { life: 1.4, max: 1.4, vy: -0.5 }); } }
    return dealt;
  }

  /* ---- the controls ---- */
  function drive(S, mx, my, dt) {
    const car = S.car, me = S.me, X = S.X;
    if (S.phase !== 'drive' || car.locked) { me.vx = me.vy = 0; if (me.push) me.push = null; syncMe(S); return; }
    if (me.push) { const P = me.push; P.t -= dt; moveCar(S, P.vx * dt, P.vy * dt); if (P.t <= 0) me.push = null; }
    const top = TUNE.top * (me.chill > 0 ? 0.75 : 1) * (S.g.buff && S.g.buff.haste > 0 ? 1.15 : 1), D = S.drift;
    const mag = Math.min(1, Math.hypot(mx, my));
    let steerV = 0;
    if (S.driftQ != null && !D && S.cdDrift <= 0) { S.driftQ = null; tryDrift(S, mx, my); }   // (a press kept from just before it was ready)
    if (S.drift && S.drift.ph < 2) { driftBurst(S, mx, my, mag, dt, top); syncMe(S); return; }
    if (mag > 0.12) {
      const want2 = Math.atan2(my, mx), da = wrap(want2 - car.a), rate = D ? TUNE.steer[0] * 0.8 : lerp(TUNE.steer[0], TUNE.steer[1], cl(car.speed / top));
      const turn = Math.max(-rate * dt, Math.min(rate * dt, da)); car.a = wrap(car.a + turn); steerV = turn / Math.max(dt, 1e-4);
      const thr = mag * (Math.abs(da) > 2.2 ? 0.25 : Math.abs(da) > 1.2 ? 0.6 : 1), tgt = top * thr;
      if (car.speed < tgt) car.speed = Math.min(tgt, car.speed + TUNE.accel * dt); else car.speed = Math.max(tgt, car.speed - TUNE.overK * dt);
      car.steer += (Math.max(-0.42, Math.min(0.42, da * 1.1)) - car.steer) * Math.min(1, dt * 10);
    } else { car.speed = Math.max(0, car.speed - TUNE.coast * dt); car.steer *= Math.max(0, 1 - dt * 8); }
    // grip pulls the velocity toward the heading (a little looser while the drift recovers, so it slides out of the spin)
    const grip = D ? lerp(4, TUNE.grip, cl(D.t / TUNE.driftPh[2])) : TUNE.grip;
    const vdx = Math.cos(car.a) * car.speed, vdy = Math.sin(car.a) * car.speed;
    car.vx += (vdx - car.vx) * Math.min(1, grip * dt); car.vy += (vdy - car.vy) * Math.min(1, grip * dt);
    if (moveCar(S, car.vx * dt, car.vy * dt)) { car.speed *= TUNE.bumpK; car.vx *= 0.4; car.vy *= 0.4; car.susp = Math.max(car.susp, 0.5); if (S.bumpT <= 0) { S.bumpT = 0.35; if (X.sfx && X.sfx.thud) X.sfx.thud(); spawnSparks(S, car.x + Math.cos(car.a) * 1.1, car.y + Math.sin(car.a) * 0.8, 6); } }
    // a little roll into the turn
    car.lean += (Math.max(-0.055, Math.min(0.055, -steerV * cl(car.speed / top) * 0.035)) - car.lean) * Math.min(1, dt * 6);
    syncMe(S);
  }
  /* move the car's centre with the walls in the way, an axis at a time in small steps (and its nose and tail too) */
  function moveCar(S, dx, dy) {
    const car = S.car, X = S.X, ab = car.a + car.slide, n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.12)); let hit = false;
    // (a turn or the drift's spin can swing the nose or tail into a wall: then the centre alone still collides, so the car
    //  slides free of it but can never pass through; round 2 fix, the old code let a "stuck" car move unchecked)
    const stuck = poseBlocked(X, car.x, car.y, ab), bl = stuck ? (x, y) => X.blocked(x, y, 0.5, 0) : (x, y) => poseBlocked(X, x, y, ab);
    const cStuck = stuck && X.blocked(car.x, car.y, 0.5, 0);
    for (let i = 0; i < n; i++) { const sx = dx / n, sy = dy / n;
      car.x += sx; if (!cStuck && bl(car.x, car.y)) { car.x -= sx; hit = true; }
      car.y += sy; if (!cStuck && bl(car.x, car.y)) { car.y -= sy; hit = true; } }
    if (stuck && X.blocked(car.x, car.y, 0.5, 0)) { const p = X.walkPoint(car.x, car.y, { r: 0.5, x: car.x, y: car.y }); car.x += (p.x - car.x) * 0.25; car.y += (p.y - car.y) * 0.25; }
    return hit;
  }
  function syncMe(S) { const me = S.me, car = S.car; if (S.ctx.ejecting) { me.x = S.ctx.petX; me.y = S.ctx.petY; } else { me.x = car.x; me.y = car.y; } me.vx = car.vx; me.vy = car.vy; const c = Math.cos(car.a); if (Math.abs(c) > 0.25) me.face = c > 0 ? 1 : -1; me.z = 0; }
  function tryDrift(S, mx, my) {
    const car = S.car, X = S.X;
    if (S.phase !== 'drive' || car.locked) return;
    if (S.drift || S.cdDrift > 0) { if (S.cdDrift <= TUNE.driftBuf) S.driftQ = S.g.t; return; }   // (pressed a moment early: it goes as soon as it can)
    // the way it bursts: the stick, else the way the car is going, else the aim
    const mag = Math.hypot(mx, my); let dir;
    if (mag > 0.2) dir = Math.atan2(my, mx);
    else if (Math.hypot(car.vx, car.vy) > 2) dir = Math.atan2(car.vy, car.vx);
    else { const T = target(S); dir = T.m ? Math.atan2(T.y - car.y, T.x - car.x) : car.a; }
    // the heading jumps to the burst; the body keeps its angle and spins from there through at least one full turn
    // (away from the new heading first, so a turn of less than a full one never shows)
    const s0 = wrap(car.a + car.slide - dir), side = Math.abs(s0) > 0.15 ? -Math.sign(s0) : -(S.lastSide || -1);
    S.lastSide = side;
    car.a = dir; car.slide = s0;
    S.drift = { ph: 0, t: 0, side, s0, dir, hit: new Set(), nHit: 0, petRot: 0, vk: 1, x0: car.x, y0: car.y };
    S.cdDrift = TUNE.driftCd * (S.g.buff && S.g.buff.arcane > 0 ? 0.6 : 1) * (S.g.dodgeK || 1);
    S.me.inv = Math.max(S.me.inv || 0, TUNE.driftInv);   // (the Dodge's own invulnerability, no more)
    S.g.dodges = (S.g.dodges || 0) + 1; S.g.movedOnce = true;
    driftKick(S);
  }
  /* the kick: a shockwave ring off the car, a ring of tyre smoke, sparks, a squeal and a whoosh */
  function driftKick(S) {
    const car = S.car, X = S.X, Q = lowFx() ? 0.35 : 1, D = S.drift;
    addPart(S, 6, car.x, car.y, 0, 0, 0, 0, 0.42, TUNE.driftR * 1.05, { v: 0.2 });
    for (let i = 0; i < Math.round(14 * Q); i++) { const a = i / 14 * TAU + Math.random() * 0.3, v = 3 + Math.random() * 2.5; addPart(S, 4, car.x + Math.cos(a) * 1.1, car.y + Math.sin(a) * 0.8, 0.05, Math.cos(a) * v, Math.sin(a) * v * GY, 0.3, 0.55 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, { grow: 1.5, drag: 3 }); }
    spawnSparks(S, car.x - Math.cos(D.dir) * 1.2, car.y - Math.sin(D.dir) * 0.9, Math.round(8 * Q));
    car.glow = Math.max(car.glow, 0.6); car.susp = Math.max(car.susp, 0.45);
    if (!calm()) X.shake(2.5, 0.1);
    const sfx = X.sfx || {}; if (sfx.whoosh) sfx.whoosh(); if (sfx.note) { sfx.note(1150, 0.34, 'sawtooth', 0.026, 1900); sfx.note(1500, 0.3, 'sine', 0.04, 2400, 0.03); sfx.note(240, 0.28, 'triangle', 0.08, 120); } if (sfx.hiss) sfx.hiss(0.4, 0.12, 3600);
  }
  /* the burst (while the car spins): eased off like the Dodge's roll, bent by the stick, bounced off walls */
  function driftBurst(S, mx, my, mag, dt, top) {
    const D = S.drift, car = S.car, P = TUNE.driftPh;
    if (mag > 0.2) { const da = wrap(Math.atan2(my, mx) - D.dir), tr = TUNE.driftTurn * dt; D.dir = wrap(D.dir + Math.max(-tr, Math.min(tr, da))); }
    const u = D.ph === 0 ? 0 : cl(D.t / P[1]), v = TUNE.driftV * (1 - u * u * 0.6) * D.vk * (top / TUNE.top);
    car.a = D.dir; car.vx = Math.cos(D.dir) * v; car.vy = Math.sin(D.dir) * v; car.speed = v;
    car.steer += (-D.side * 0.42 - car.steer) * Math.min(1, dt * 14); car.lean *= Math.max(0, 1 - dt * 10);
    const x0 = car.x, y0 = car.y, dx = car.vx * dt, dy = car.vy * dt;
    if (moveCar(S, dx, dy)) {
      // a wall: bounce off it (the blocked axis turns back), lose some pace, sparks
      const bx = Math.abs(dx) > 1e-4 && Math.abs(car.x - x0) < Math.abs(dx) * 0.5, by = Math.abs(dy) > 1e-4 && Math.abs(car.y - y0) < Math.abs(dy) * 0.5;
      D.dir = Math.atan2(by ? -Math.sin(D.dir) : Math.sin(D.dir), bx ? -Math.cos(D.dir) : Math.cos(D.dir)); D.vk *= 0.65; car.susp = Math.max(car.susp, 0.6);
      if (S.bumpT <= 0) { S.bumpT = 0.15; const X = S.X; if (X.sfx && X.sfx.thud) X.sfx.thud(); spawnSparks(S, car.x + Math.cos(car.a) * 1.1, car.y + Math.sin(car.a) * 0.8, lowFx() ? 4 : 10); if (!calm()) X.shake(3, 0.08); }
    }
  }
  function tryMove(S, slot) {
    const car = S.car, X = S.X, sfx = X.sfx || {};
    if (S.phase !== 'drive' || car.locked || S.busy) { if (sfx.wrong && S.phase === 'drive') sfx.wrong(); return; }
    const MV = moves(), star = slot !== 'strong2';
    if (star ? S.cdStar > 0 : S.cdLove > 0) return;
    const fn = star ? MV.shootingStar : MV.loveSensation; if (typeof fn !== 'function') return;
    S.busy = star ? 'star' : 'love'; S.busyT = 0; S.busyId = (S.busyId || 0) + 1;
    if (star) S.cdStar = mvTune('starCd', 2.6); else S.cdLove = mvTune('loveCd', 3.2);
    if (!star || mvTune('starLock', false)) { car.locked = true; if (!star) { car.speed = 0; car.vx *= 0.3; car.vy *= 0.3; } }
    S.stats[star ? 'star' : 'love']++;
    try { fn.call(MV, S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Sports Car: a move failed', e); actionDone(S); }
  }
  function tryNova(S) {
    const X = S.X, sfx = X.sfx || {}, car = S.car;
    if (S.phase !== 'drive') return;
    if (S.used || S.charge < 1 || car.locked) { if (sfx.wrong) sfx.wrong(); X.text(S.me.x, S.me.y - 1.7, S.used ? 'Supernova used' : `Supernova ${Math.floor(S.charge * 100)}%`, LIGHT, 12, { life: 0.9, max: 0.9, vy: -0.6 }); return; }
    S.used = true; S.phase = 'nova'; S.t = 0; S.busy = 'nova'; S.busyT = 0; S.drift = null; car.slide = 0;
    car.contact = false; car.locked = true; S.ctx.supernova = true; S.stats.nova++;
    const MV = moves();
    try { MV.supernova(S.ctx); } catch (e) { if (typeof console !== 'undefined') console.warn('Sports Car: Supernova failed', e); finish(S, 'nova'); }
  }
  function actionDone(S) {
    if (!S.busy) return;
    const kind = S.busy; S.busy = null;
    if (kind === 'nova') { finish(S, 'nova'); return; }
    if (S.phase === 'drive') { S.car.locked = false; S.car.z = 0; }
  }

  /* ---- the frame: phases, the timer, ramming, the drift, the meter ---- */
  function step(S, dt) {
    const car = S.car, me = S.me, g = S.g, X = S.X;
    if (S.released) { S.relT = (S.relT || 0) + dt; stepParts(S, dt); return; }
    // the form ends with the pet, the floor, or a pet swapped in some other way
    if (me.dead) { finish(S, 'defeat'); return; }
    if (g.over || (g.won && S.phase !== 'nova')) { finish(S, 'won'); return; }   // (a Supernova under way on a win plays out, capped by novaCap)
    if (X.pet && S.pet && X.pet() !== S.pet) { finish(S, 'swap'); return; }
    g.cdU = S.CD;   // (held while the car is out: the cooldown starts at the exit)
    S.t += dt; S.bumpT -= dt; S.cdStar = Math.max(0, S.cdStar - dt); S.cdLove = Math.max(0, S.cdLove - dt); S.cdDrift = Math.max(0, S.cdDrift - dt);
    car.glow = Math.max(0, car.glow - dt * 2.2); car.susp = Math.max(0, car.susp - dt * 3);
    S.lights = S.phase === 'out' ? Math.max(0, S.lights - dt * 2) : S.lit ? Math.min(1, S.lights + dt * 3.5) * (S.lights < 0.95 && Math.random() < 0.25 ? 0.6 : 1) : 0;
    if (S.busy) S.busyT += dt;
    // background baking: the heading in use first
    const bNow = bucketOf(groundA(car.a + car.slide)); want(bNow); want((bNow + 1) % NB); want((bNow + NB - 1) % NB);
    bakeStep(S.phase === 'summon' ? 3.5 : ready(bNow) ? 1 : 3);
    if (S.phase === 'summon') {
      // the car becomes solid only once its picture is ready (the ribbons keep circling meanwhile, a moment at most)
      if (S.t > 0.95 && !ready(bNow) && S.hold < 1.6) { S.hold += dt; S.t -= dt; }
      if (S.t > 1.45 && !S.lit) { S.lit = true; ignite(S); }
      if (S.t >= TUNE.summon) { S.phase = 'drive'; S.t = 0; car.locked = false; S.left = S.dur; }
      syncMe(S);
    } else if (S.phase === 'drive') {
      S.left -= dt; S.stats.driveT = (S.stats.driveT || 0) + dt;   // (game time, as every timer in the fight: a hit-stop or slow-motion moment pauses it too)
      // a Love Sensation in the air lands before the car can dissolve
      if (S.left <= 0 && (!car.locked || S.busyT > 3)) { startOut(S); return; }
      if (S.busy && S.busyT > 8) actionDone(S);   // (a move that never reports done frees the controls anyway)
      if (S.drift) stepDrift(S, dt);
      if (car.contact && car.z < 0.1) ram(S);
      // wheels, trails, the engine's hum
      if (S.readyT != null) S.readyT += dt;
    } else if (S.phase === 'nova') {
      if (S.t > (g.won ? Math.min(9, TUNE.novaCap) : TUNE.novaCap)) { finish(S, 'nova'); return; }
      syncMe(S);
    } else if (S.phase === 'out') { stepOut(S, dt); }
    car.spinA += (car.wheelSpin != null ? car.wheelSpin : (car.vx * Math.cos(car.a) + car.vy * Math.sin(car.a)) / WR) * dt;
    const MV = moves(); if (MV && MV.update) { try { MV.update(S.ctx, dt); } catch (e) { /* (theirs) */ } }
    trails(S, dt); stepParts(S, dt);
    S.fx.entY = S.ctx.ejecting ? S.ctx.petY : car.y + 0.05;
    // the engine: a soft, playful hum that rises with speed
    S.sfxT -= dt; if (S.sfxT <= 0 && (S.phase === 'drive' || S.phase === 'nova')) { const k = cl(Math.hypot(car.vx, car.vy) / TUNE.top), sfx = X.sfx || {}; S.sfxT = 0.42; if (sfx.note && (k > 0.15 || S.phase === 'nova')) sfx.note(72 + 70 * k, 0.46, 'triangle', 0.03 + 0.03 * k, 82 + 120 * k); }
    S.ltT -= dt; if (S.ltT <= 0 && S.lights > 0.3 && car.vis > 0.3) { S.ltT = 0.09; X.light(car.x + Math.cos(car.a) * 1.6, car.y + Math.sin(car.a) * 1.2, 3.2, 0.14); }
    car.prevX = car.x; car.prevY = car.y; car.prevA = car.a + car.slide;
  }
  function ignite(S) {
    const car = S.car, X = S.X, sfx = X.sfx || {};
    S.lightsOn = S.t; car.glow = 1;
    if (sfx.note) { sfx.note(220, 0.3, 'sawtooth', 0.035, 470); sfx.note(330, 0.35, 'triangle', 0.06, 700, 0.05); }
    for (let i = 0; i < (lowFx() ? 6 : 16); i++) { const a = i / 16 * TAU + Math.random() * 0.3, v = 2.2 + Math.random() * 2.2; addPart(S, 2, car.x, car.y, 0.05, Math.cos(a) * v, Math.sin(a) * v * GY, 1.2 + Math.random(), 0.9 + Math.random() * 0.5, 0.17 + Math.random() * 0.1, { g: 3, drag: 1.6 }); }
    if (!calm()) X.shake(3, 0.15); X.flash(0.18, LIGHT);
  }
  /* ramming: the car's body swept from its last pose to this one; a hit per pass per monster */
  function inBody(m, x, y, ab, pad) { const ag = groundA(ab), ca = Math.cos(ag), sa = Math.sin(ag), gx = m.x - x, gy = (m.y - y) / GY, lx = gx * ca + gy * sa, ly = -gx * sa + gy * ca, r = m.r * 0.85 + pad; return Math.abs(lx) < HL + r && Math.abs(ly) < HWB + r; }
  function sweptHit(S, m, pad) { const car = S.car, ab = car.a + car.slide, d = Math.hypot(car.x - car.prevX, car.y - car.prevY), n = Math.max(1, Math.ceil(d / 0.35));
    for (let i = 0; i <= n; i++) { const u = i / n; if (inBody(m, lerp(car.prevX, car.x, u), lerp(car.prevY, car.y, u), car.prevA + wrap(ab - car.prevA) * u, pad)) return true; } return false; }
  function ram(S) {
    const car = S.car, t = S.g.t, sp = Math.hypot(car.vx, car.vy), fast = sp > TUNE.top * TUNE.ramMin;
    for (const m of S.H.living()) {
      if (Math.hypot(m.x - car.x, m.y - car.y) > 3 + m.r + Math.hypot(car.x - car.prevX, car.y - car.prevY)) { const G = S.gate.get(m); if (G) G.inside = false; continue; }
      const touch = sweptHit(S, m, 0.04); let G = S.gate.get(m); if (!G) { G = { last: -9, inside: false }; S.gate.set(m, G); }
      const enter = touch && !G.inside; G.inside = touch;
      if (!enter || !fast || t - G.last < TUNE.ramGate) continue;
      if (S.drift && S.drift.hit.has(m)) continue;   // (the drift already struck it this activation)
      G.last = t;
      const dealt = hitCharge(S, m, S.DK * TUNE.ram, { kb: TUNE.ramKb });
      S.stats.ram++;
      impactFx(S, m.x, m.y, 0.8, dealt > 0);
      car.speed *= m.boss ? 0.55 : 0.93; if (m.boss) { car.vx *= 0.55; car.vy *= 0.55; car.susp = 0.6; }
    }
  }
  function stepDrift(S, dt) {
    const D = S.drift, car = S.car, P = TUNE.driftPh; D.t += dt;
    if (D.ph === 0 && D.t >= P[0]) { D.ph = 1; D.t -= P[0]; }
    if (D.ph === 1 && D.t >= P[1]) { D.ph = 2; D.t -= P[1]; car.speed = Math.max(car.speed, TUNE.top * 0.78); }
    if (D.ph === 2 && D.t >= P[2]) { S.drift = null; car.slide = 0; return; }
    // the spin: one full turn (and the angle it started from) through the burst, snappy at first as the Dodge's roll,
    // then a little settling sway in the recovery; the pet in the seat rolls one flat turn with it, as in a Dodge
    const tot = D.side * TAU - D.s0;
    if (D.ph === 0) { const u = D.t / P[0]; car.slide = D.s0 + tot * 0.05 * u; D.petRot = D.side * TAU * 0.05 * u; }
    else if (D.ph === 1) { const u = cl(D.t / P[1]), e = 0.05 + 0.95 * (0.45 * u + 0.55 * (1 - (1 - u) * (1 - u))); car.slide = D.s0 + tot * e; D.petRot = D.side * TAU * e; }
    else { const u = D.t / P[2]; car.slide = D.side * 0.2 * Math.sin(u * Math.PI) * (1 - u); D.petRot = 0; }
    D.w = D.ph === 1 ? Math.abs(tot) / P[1] : 0;   // (how fast it spins: the smear and the trails use it)
    car.glow = Math.max(car.glow, D.ph < 2 ? 0.55 : 0.25);
    if (D.ph < 2) {
      // every monster the spinning car's sweep reaches (a capsule along its path), once
      const R = TUNE.driftR, ax = car.prevX, ay = car.prevY, sx = car.x - ax, sy = car.y - ay, L2 = sx * sx + sy * sy;
      for (const m of S.H.living()) { if (D.hit.has(m)) continue;
        const u = L2 > 1e-6 ? cl(((m.x - ax) * sx + (m.y - ay) * sy) / L2) : 1, qx = ax + sx * u - m.x, qy = ay + sy * u - m.y, rr = R + (m.r || 0.4) * 0.85;
        if (qx * qx + qy * qy > rr * rr) continue;
        D.hit.add(m); const dealt = hitCharge(S, m, S.DK * TUNE.drift, { kb: TUNE.driftKb }); S.stats.drift++;
        driftImpact(S, m, dealt > 0, D.nHit++ === 0); car.glow = 1;
        const G = S.gate.get(m); if (G) G.inside = true; else S.gate.set(m, { last: S.g.t, inside: true }); }
      // tyre smoke curling off all four wheels (the spin turns the puffs into spirals), sparks off the tread
      const Q = lowFx() ? 0.3 : 1;
      for (const [lx, ly] of WH4) if (Math.random() < 0.85 * Q) { const p = l2w(car, lx, ly), ox = p[0] - car.x, oy = (p[1] - car.y) / GY, ol = Math.hypot(ox, oy) || 1, tg = D.side * 2.4;
        addPart(S, 4, p[0], p[1], 0.08, ox / ol * 1.3 - oy / ol * tg - car.vx * 0.15, (oy / ol * 1.3 + ox / ol * tg) * GY - car.vy * 0.15, 0.25, 0.7 + Math.random() * 0.35, 0.34 + Math.random() * 0.2, { grow: 2.2, drag: 2.2 }); }
      if (Math.random() < 0.6 * Q) { const w = WH4[(Math.random() * 4) | 0], p = l2w(car, w[0], w[1]); spawnSparks(S, p[0], p[1], 1); }
    }
  }
  const WH4 = [[AXR, -WY], [AXR, WY], [AXF, -WY], [AXF, WY]];
  /* a drift strike: heart flash, a burst of hearts and stars, sparks, a feathered shockwave ring on the floor; the first
     of each drift adds a short shake and hit-stop (both kept to the motion settings) */
  function driftImpact(S, m, landed, first) {
    const X = S.X, Q = lowFx() ? 0.4 : 1;
    impactFx(S, m.x, m.y, 1.7, landed, !first);
    addPart(S, 6, m.x, m.y, 0, 0, 0, 0, 0.34, 1.5 + (m.r || 0.4), { v: 0.1 });
    for (let i = 0; i < Math.round(6 * Q); i++) { const a = i / 6 * TAU + Math.random() * 0.5, v = 5 + Math.random() * 3; addPart(S, 3, m.x, m.y, 0.3, Math.cos(a) * v, Math.sin(a) * v * GY, 2 + Math.random() * 2, 0.35, 0.34, { g: 7, drag: 1.6, col: i % 3 ? '#FFFFFF' : ROSE }); }
    if (first) { if (X.hitstop) X.hitstop(calm() ? 0.02 : 0.05); if (!calm()) { X.shake(6, 0.16); X.flash(0.07, LIGHT); }
      const sfx = X.sfx || {}; if (sfx.crash) sfx.crash(); if (sfx.note) sfx.note(1760, 0.22, 'sine', 0.08, 2637); }
  }
  function startOut(S) {
    if (S.phase === 'out') return;
    S.phase = 'out'; S.t = 0; S.drift = null; const car = S.car; car.locked = true; car.contact = false; car.slide = 0; car.speed = 0; car.vx = car.vy = 0;
    const s = seatWorld(car); S.petStand = nearestStand(S, s.x, s.y); S.seatX = s.x; S.seatY = s.y;
    const sfx = S.X.sfx || {}; if (sfx.note) [2093, 1568, 1318, 1046].forEach((f, i) => sfx.note(f, 0.45, 'sine', 0.07, f * 0.99, i * 0.08));
  }
  /* hearts and stars breaking off the car's outline and drifting outward (never from the cockpit, so the pet stays clear) */
  function rim(S, n, v) { const car = S.car, ag = groundA(car.a + car.slide), ca = Math.cos(ag), sa = Math.sin(ag);
    for (let i = 0; i < n; i++) { const th = Math.random() * TAU, lx = Math.cos(th) * HL * 0.98, ly = Math.sin(th) * HWB * 1.02, p = l2w(car, lx, ly), ox = Math.cos(th) * ca - Math.sin(th) * sa, oy = (Math.cos(th) * sa + Math.sin(th) * ca) * GY, k = v * (0.6 + Math.random() * 0.6);
      addPart(S, Math.random() < 0.55 ? 1 : 2, p[0], p[1], 0.25 + Math.random() * 0.35, ox * k, oy * k, 0.6 + Math.random() * 0.8, 0.75 + Math.random() * 0.45, 0.14 + Math.random() * 0.1, { g: 0.6, drag: 1.2 }); } }
  function stepOut(S, dt) {
    const car = S.car, u = S.t / TUNE.out;
    if (u < 0.85 && Math.random() < (lowFx() ? 0.35 : 0.9)) rim(S, 1, 1.4);
    S.me.x = S.petStand.x; S.me.y = S.petStand.y; S.me.vx = S.me.vy = 0;
    if (u >= 1) release(S);
  }
  /* the end of the form, whichever way it comes: once */
  function finish(S, how) {
    if (S.released) return;
    S.outHow = how;
    if (how === 'nova') { const c = S.ctx, p = nearestStand(S, c.ejecting ? c.petX : S.car.x, c.ejecting ? c.petY : S.car.y); S.me.x = p.x; S.me.y = p.y; }
    else if (how !== 'defeat') { const s = seatWorld(S.car), p = nearestStand(S, s.x, s.y); S.me.x = p.x; S.me.y = p.y; }
    // the car breaks into hearts and stars where it stood (a quick burst; the timeout has its own slower dissolve)
    if (how !== 'nova' && S.car.vis > 0.05) { rim(S, lowFx() ? 8 : 20, 2.4); S.fade = 0.35; }
    release(S);
  }
  function release(S) {
    if (S.released) return;
    S.released = true; S.ended = true; S.relT = 0;
    const me = S.me, g = S.g, X = S.X;
    if (S.phase === 'out' && S.petStand) { me.x = S.petStand.x; me.y = S.petStand.y; }
    S.phase = 'gone'; S.drift = null; S.busy = null;
    const c0 = S.ctx; if (c0) { c0.ejecting = false; c0.supernova = false; c0.petZ = 0; } S.car.locked = true; S.car.contact = false; S.car.wheelSpin = null;
    try { X.vehicle(null); } catch (e) { /* (hook) */ }
    if (me.petAlt === S.fx) me.petAlt = null;
    me.vx = me.vy = 0; me.z = 0; me.push = null; me.castT = 0;
    g.cdU = S.CD;   // the cooldown starts now, once
    g.tapBuf = 0; g.tapAim = null; g.normalT = Math.max(g.normalT || 0, 0.2);
    S.gate.clear();
    // the effect lingers only while its hearts and stars fade
    S.fx.life = 2.2; S.fx.onEnd = null;
  }

  /* ---- pooled particles: 1 heart, 2 star, 3 spark, 4 smoke puff, 5 heart flash, 6 shockwave ring on the floor (s = radius) ---- */
  const CAP = 360;
  function addPart(S, kind, x, y, z, vx, vy, vz, life, s, o) {
    if (S.parts.length >= CAP * (lowFx() ? 0.4 : 1)) return null;
    const p = S.free.pop() || {}; p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.rot = (Math.random() - 0.5) * 0.8; p.vr = (Math.random() - 0.5) * 3; p.g = (o && o.g) || 0; p.drag = (o && o.drag) || 0; p.grow = (o && o.grow) || 0; p.col = (o && o.col) || null; p.v = (o && o.v) || 0;
    S.parts.push(p); return p;
  }
  function stepParts(S, dt) {
    for (let i = S.parts.length - 1; i >= 0; i--) { const p = S.parts[i]; p.life -= dt; if (p.life <= 0) { S.parts[i] = S.parts[S.parts.length - 1]; S.parts.pop(); S.free.push(p); continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = Math.abs(p.vz) * 0.3; } p.rot += p.vr * dt; }
  }
  function spawnSparks(S, x, y, n) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 2 + Math.random() * 3; addPart(S, 3, x, y, 0.3, Math.cos(a) * v, Math.sin(a) * v * GY, 1 + Math.random() * 2, 0.3 + Math.random() * 0.2, 0.25, { g: 6, col: Math.random() < 0.5 ? GOLD : '#FFFFFF' }); } }
  /* an impact: a heart flash, rising hearts, luminous stars, sparkling streaks */
  function impactFx(S, x, y, k, landed, quiet) {
    const X = S.X, Q = lowFx() ? 0.4 : 1, n = Math.max(1, Math.round((landed ? 5 : 2) * k * Q));
    addPart(S, 5, x, y, 0.45, 0, 0, 0, 0.32, 0.9 * k, {});   // the heart-shaped flash
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = 1.5 + Math.random() * 2.5 * k; addPart(S, i % 3 === 2 ? 2 : 1, x, y, 0.4, Math.cos(a) * v, Math.sin(a) * v * GY, 1.6 + Math.random() * 1.6, 0.6 + Math.random() * 0.35, (0.16 + Math.random() * 0.12) * (0.8 + 0.3 * k), { g: 2.4, drag: 1.4 }); }
    for (let i = 0; i < Math.round(6 * k * Q); i++) { const a = Math.random() * TAU, v = 4 + Math.random() * 4; addPart(S, 3, x, y, 0.4, Math.cos(a) * v, Math.sin(a) * v * GY, (Math.random() - 0.3) * 3, 0.28 + Math.random() * 0.2, 0.28, { g: 5, drag: 2, col: i % 2 ? GOLD : '#FFFFFF' }); }
    X.light(x, y, 2.2 * k, 0.18);
    if (quiet) return;   // (a drift's later strikes: the first one shook and rang for them all)
    if (!calm()) X.shake(k > 1 ? 4 : 2.2, 0.1);
    const sfx = X.sfx || {}; if (sfx.thud) sfx.thud(); if (sfx.note) sfx.note(k > 1 ? 1320 : 990, 0.16, 'sine', 0.07, k > 1 ? 1760 : 1480);
  }
  /* the tyre trails: pink-white light along both rear wheels while sliding or cornering hard; while a drift spins, all four
     wheels lay them, sampled between frames so the spirals stay smooth at any spin rate */
  function trails(S, dt) {
    const car = S.car, t = S.g.t, sp = Math.hypot(car.vx, car.vy), slip = sp > 0.5 ? Math.abs(wrap(Math.atan2(car.vy, car.vx) - (car.a + car.slide))) : 0, D = S.drift, spin = !!(D && D.ph < 2);
    const on = S.phase === 'drive' && car.z < 0.1 && (D || (slip > 0.22 && sp > TUNE.top * 0.45));
    const abN = car.a + car.slide, dA = wrap(abN - car.prevA), n = spin ? Math.max(1, Math.min(8, Math.ceil(Math.max(Math.abs(dA) / 0.12, Math.hypot(car.x - car.prevX, car.y - car.prevY) / 0.2)))) : 1, Pq = { x: 0, y: 0 };
    for (let s = 0; s < 4; s++) { const L = S.trail[s]; while (L.length && t - L[0].t > 1.5) L.shift();
      if (on && (s < 2 || spin)) { const w = WH4[s];
        for (let k = 1; k <= n; k++) { const u = k / n; Pq.x = lerp(car.prevX, car.x, u); Pq.y = lerp(car.prevY, car.y, u); const p = l2w(Pq, w[0], w[1], car.prevA + dA * u), last = L[L.length - 1];
          if (!last || last.br || Math.hypot(p[0] - last.x, p[1] - last.y) > 0.12) L.push({ x: p[0], y: p[1], t, w: D ? 1 : 0.6 }); } }
      else if (L.length && !L[L.length - 1].br) L[L.length - 1].br = true;
      if (L.length > 150) L.shift(); }
  }
  /* the trails on the floor: light only (an additive rose haze and a pearl core), feathered at the ends; the segments are
     grouped into a few bands of age so a long spiral costs a handful of strokes */
  const TB = 6;
  function drawTrails(S, c, T) {
    const H = S.H, t = S.g.t;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (const L of S.trail) { if (L.length < 2) continue;
      for (let pass = lowFx() ? 1 : 0; pass < 2; pass++) { for (let b = 0; b < TB; b++) { const a = (1 - (b + 0.5) / TB); let open = false, any = false;
        c.beginPath();
        for (let i = 1; i < L.length; i++) { const p0 = L[i - 1], p1 = L[i]; if (p0.br) { open = false; continue; } const age = cl((t - p1.t) / 1.5), bb = Math.min(TB - 1, (age * TB) | 0); if (bb !== b) { open = false; continue; }
          if (!open) { c.moveTo(H.sx(p0.x), H.sy(p0.y)); open = true; } c.lineTo(H.sx(p1.x), H.sy(p1.y)); any = true; }
        if (!any) continue; const wk = L[L.length - 1].w;
        c.globalAlpha = (pass ? 0.85 : 0.3) * a * wk; c.strokeStyle = pass ? '#FFF2FA' : ROSE; c.lineWidth = T * (pass ? 0.05 : 0.18) * (0.6 + 0.4 * a); c.stroke(); } } }
    c.restore();
  }

  /* ================= drawing ================= */
  /* the car's ground centre on the screen (its suspension and any lift raise the body, not the shadow) */
  function carScreen(S) { const H = S.H, car = S.car; return [H.sx(car.x), H.sy(car.y)]; }
  function drawUnder(S, c) {
    const H = S.H, T = H.X.Tz(), car = S.car, t = S.g.t, me = S.me;
    // the heart seal of the summoning, opening under the pet and fading once the car is solid
    if (SM && S.phase !== 'gone' && (S.phase === 'summon' || (S.phase === 'drive' && S.t < 0.8))) {
      const u = S.phase === 'summon' ? S.t : TUNE.summon + S.t, open = sstep(0, 0.45, u) * (1 - sstep(1.9, 2.5, u)), R = T * (1.2 + 1.6 * H.ease.back(Math.min(1, u / 0.5)));
      if (open > 0.01) { c.save(); c.translate(H.sx(S.sealX), H.sy(S.sealY)); c.scale(1, GY * 0.78); c.rotate(u * 0.6); c.globalCompositeOperation = 'lighter'; c.globalAlpha = open * 0.9; c.drawImage(SM.seal, -R, -R, R * 2, R * 2); c.globalAlpha = open * 0.5; blitSized(c, glowSprite(ROSE), -R * 0.9, -R * 0.9, R * 1.8, R * 1.8); c.restore(); }
    }
    // the tyre trails: curling ribbons of pink-white light (light only, no stains)
    drawTrails(S, c, T);
    if (S.phase === 'gone' || car.vis <= 0.01) { drawPartsFloor(S, c); callC2(S, c, 'drawUnder'); return; }
    const [X0, Y0] = carScreen(S), body = bodyAlpha(S), ag = groundA(car.a + car.slide);
    // the soft shadow, the pink underglow, the heart headlights' pools of light ahead
    c.save(); c.translate(X0 + T * 0.06, Y0 + T * 0.05); c.scale(1, GY); c.rotate(ag); const sk = 1 - cl(car.z / 2) * 0.35; c.globalAlpha = 0.9 * body * car.vis * sk; c.drawImage(SM ? SM.shadow : glowSprite('#000000'), -HL * 1.18 * T * sk, -HWB * 1.25 * T * sk, HL * 2.36 * T * sk, HWB * 2.5 * T * sk); c.restore();
    c.save(); c.translate(X0, Y0); c.scale(1, GY); c.rotate(ag); c.globalCompositeOperation = 'lighter';
    c.globalAlpha = (0.32 + 0.12 * Math.sin(t * 5)) * body * car.vis * (1 - cl(car.z)); blitSized(c, glowSprite(ROSE), -HL * 1.3 * T, -HWB * 1.55 * T, HL * 2.6 * T, HWB * 3.1 * T);
    const lt = S.lights * car.vis; if (lt > 0.02) { c.globalAlpha = 0.17 * lt * (1 + car.glow * 0.6); c.drawImage(beamSprite('#FFD1EA'), HL * 0.8 * T, -HWB * 1.0 * T, T * 2.4, HWB * 2.0 * T); }
    c.restore();
    // the drift's spin smear on the floor: arcs of light swept by the nose and the tail, fading behind them
    const D = S.drift; if (D && D.ph === 1 && D.w > 4 && body > 0.5) { const sw = Math.min(2.6, D.w * 0.08), R = HL * 1.04 * T, NK = lowFx() ? 2 : 4;
      c.save(); c.translate(X0, Y0 - car.z * ZK * T); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      for (const end of [0, Math.PI]) for (let k = 0; k < NK; k++) { const a1 = ag + end - D.side * sw * k / NK, a0 = ag + end - D.side * sw * (k + 1) / NK, fa = (1 - k / NK) * (end ? 0.7 : 1);
        c.beginPath(); c.arc(0, 0, R, Math.min(a0, a1), Math.max(a0, a1));
        c.globalAlpha = 0.2 * fa; c.strokeStyle = ROSE; c.lineWidth = T * 0.6; c.stroke(); c.globalAlpha = 0.45 * fa; c.strokeStyle = '#FFE6F3'; c.lineWidth = T * 0.18; c.stroke(); c.globalAlpha = 0.75 * fa; c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.045; c.stroke(); }
      c.restore(); }
    drawPartsFloor(S, c);
    callC2(S, c, 'drawUnder');
  }
  /* the body alone (both pictures) at a ground heading: the drift's motion-blur ghosts */
  function blitBody(c, T, X0, Y0, ag, alpha) {
    const b = bucketOf(ag), rb = ready(b) ? b : nearestReady(b); if (rb < 0) return; const spr = BK.spr[rb], kk = T / spr.k, res = wrap(ag - rb / NB * TAU), cr = Math.cos(res), sr = Math.sin(res);
    c.save(); c.translate(X0, Y0); c.transform(cr, GY * sr, -sr / GY, cr, 0, 0); c.globalAlpha = alpha; for (const B of [spr.back, spr.front]) if (B) c.drawImage(B.cv, B.x * kk, B.y * kk, B.cv.width * kk, B.cv.height * kk); c.restore();
  }
  function callC2(S, c, k) { const MV = moves(); if (MV && MV[k] && S.ctx) { c.save(); try { MV[k](S.ctx, c); } catch (e) { /* (theirs) */ } c.restore(); } }
  /* how solid the body is: it forms during the summoning and dissolves at the timeout */
  function bodyAlpha(S) { if (S.phase === 'summon') return sstep(0.95, 1.35, S.t); if (S.phase === 'out') return 1 - sstep(0.15, 0.85, S.t / TUNE.out); if (S.phase === 'gone') return S.fade ? Math.max(0, S.fade - S.relT) / 0.35 : 0; return 1; }
  /* a point of the car on the screen: local (lx, ly) at height lz */
  function lScr(S, lx, ly, lz) { const H = S.H, car = S.car, T = H.X.Tz(), p = l2w(car, lx, ly); return [H.sx(p[0]), H.sy(p[1]) - (lz + car.z) * ZK * T]; }
  /* one wheel: the tread as the exact silhouette of the tyre (a disc swept across its width), the far face, the near one */
  function drawWheel(S, c, wx, wy, steer, T) {
    const car = S.car, ag = groundA(car.a + car.slide) + steer, ca = Math.cos(ag), sa = Math.sin(ag), p = l2w(car, wx, wy), H = S.H;
    const cx = H.sx(p[0]), cy = H.sy(p[1]) - (WZ + car.z) * ZK * T, R = WR * T;
    const Fx = ca * R, Fy = sa * GY * R, Ux = 0, Uy = -ZK * R;   // the wheel's own axes on the screen (forward, up), at radius length
    const lat = [-sa, ca * GY], dx = lat[0] * TWH * T, dy = lat[1] * TWH * T;   // the half width along its axle
    const vis = dy >= 0 ? 1 : -1;   // the face toward the viewer
    // the swept silhouette: half the ellipse moved one way, half the other, joined where its tangent runs along the axle
    const crF = Fx * dy - Fy * dx, crU = Ux * dy - Uy * dx, th0 = Math.atan2(crU, crF), thm = th0 + Math.PI / 2, sg = (Math.cos(thm) * Fx + Math.sin(thm) * Ux) * dx + (Math.cos(thm) * Fy + Math.sin(thm) * Uy) * dy >= 0 ? 1 : -1;
    c.beginPath(); for (let i = 0; i <= 14; i++) { const th = th0 + i / 14 * Math.PI, x = cx + Math.cos(th) * Fx + Math.sin(th) * Ux + dx * sg, y = cy + Math.cos(th) * Fy + Math.sin(th) * Uy + dy * sg; i ? c.lineTo(x, y) : c.moveTo(x, y); }
    for (let i = 0; i <= 14; i++) { const th = th0 + Math.PI + i / 14 * Math.PI, x = cx + Math.cos(th) * Fx + Math.sin(th) * Ux - dx * sg, y = cy + Math.cos(th) * Fy + Math.sin(th) * Uy - dy * sg; c.lineTo(x, y); } c.closePath();
    c.fillStyle = '#2A2030'; c.fill(); c.strokeStyle = 'rgba(14,8,16,.85)'; c.lineWidth = 1; c.stroke();
    // tread blocks running round (they turn with the wheel)
    c.save(); c.clip(); c.strokeStyle = 'rgba(120,96,130,.35)'; c.lineWidth = Math.max(1, T * 0.025); for (let i = 0; i < 10; i++) { const th = car.spinA + i / 10 * TAU, x = cx + Math.cos(th) * Fx + Math.sin(th) * Ux, y = cy + Math.cos(th) * Fy + Math.sin(th) * Uy; c.beginPath(); c.moveTo(x - dx, y - dy); c.lineTo(x + dx, y + dy); c.stroke(); } c.restore();
    // the near face: the star hub turning
    const fx = cx + dx * vis, fy = cy + dy * vis, det = Fx * Uy - Fy * Ux;
    if (Math.abs(det) > R * R * 0.04 && SM) { c.save(); c.transform(Fx / R, Fy / R, Ux / R, Uy / R, fx, fy); const outer = vis * (wy > 0 ? 1 : -1) > 0; c.rotate(car.spinA * (outer ? 1 : -1));
      const img = outer ? SM.wheel : SM.wheelB; c.drawImage(img, -R, -R, R * 2, R * 2);
      const fast = Math.abs(car.wheelSpin != null ? car.wheelSpin : car.speed / WR); if (outer && fast > 18) { c.globalAlpha = 0.45; c.rotate(0.35); c.drawImage(img, -R, -R, R * 2, R * 2); c.rotate(0.35); c.globalAlpha = 0.25; c.drawImage(img, -R, -R, R * 2, R * 2); }
      if (outer && car.glow > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = car.glow * 0.8; blitSized(c, glowSprite(GOLD), -R * 0.7, -R * 0.7, R * 1.4, R * 1.4); }
      c.restore(); }
  }
  function drawEnt(S, c) {
    const H = S.H, T = H.X.Tz(), car = S.car, t = S.g.t, me = S.me;
    const body = bodyAlpha(S) * car.vis;
    // the ejected pet (Supernova) is drawn where C2 says, upright
    if (S.ctx.ejecting && !S.released) { if (car.vis > 0.01) drawCar(S, c, T, body); const z = S.ctx.petZ * ZK * T; H.X.drawPetAt(c, H.sx(S.ctx.petX), H.sy(S.ctx.petY) - z, {}); return; }
    if (S.released) { if (body > 0.01) drawCar(S, c, T, body); return; }
    drawCar(S, c, T, body, true);
  }
  function drawCar(S, c, T, body, withPet) {
    const H = S.H, car = S.car, t = S.g.t;
    const [X0, Y0] = carScreen(S), lift = (car.z - car.susp * 0.04) * ZK * T, ab = car.a + car.slide, ag = groundA(ab);
    let b = bucketOf(ag); const rb = ready(b) ? b : nearestReady(b);
    // the summoning's ribbons trace the car before it is solid
    if (S.phase === 'summon') drawRibbons(S, c, T);
    const ghost = S.phase === 'summon' ? sstep(0.6, 1.0, S.t) * (1 - body) : 0;
    // the drift's smear: the body a moment ago, twice or three times, fainter each (under the car, so never over the pet)
    const D = S.drift; if (D && D.ph === 1 && D.w > 4 && body > 0.5 && !lowFx()) { const NG = 3;
      for (let k = NG; k >= 1; k--) { const tk = k * 0.022; blitBody(c, T, X0 - car.vx * tk * T, Y0 - car.vy * tk * T - lift, groundA(ab - D.side * D.w * tk), body * [0, 0.34, 0.2, 0.11][k]); } }
    // the wheels behind the body; the far ones first
    if (body > 0.01 || ghost > 0.01) { c.save(); c.globalAlpha = Math.max(body, ghost * 0.4); const W4 = [[AXF, WY, car.steer], [AXF, -WY, car.steer], [AXR, WY, 0], [AXR, -WY, 0]]; W4.sort((p, q) => l2w(car, p[0], p[1])[1] - l2w(car, q[0], q[1])[1]); for (const w of W4) drawWheel(S, c, w[0], w[1], w[2], T); c.restore(); }
    const spr = rb >= 0 ? BK.spr[rb] : null, kk = spr ? T / spr.k : 1;
    // the residual turn from the baked heading, in the ground plane (squash, turn, unsquash), and the lean
    const res = rb >= 0 ? wrap(ag - rb / NB * TAU) : 0, cr = Math.cos(res), sr = Math.sin(res);
    const place = () => { c.translate(X0, Y0 - lift); c.transform(cr, GY * sr, -sr / GY, cr, 0, 0); c.rotate(car.lean); };
    const seatS = withPet ? seatScreen(S, T) : null;
    if (spr && spr.back && (body > 0.01 || ghost > 0.01)) { c.save(); place(); c.globalAlpha = Math.max(body, ghost * 0.35); const B = spr.back; c.drawImage(B.cv, B.x * kk, B.y * kk, B.cv.width * kk, B.cv.height * kk);
      if (S.phase === 'summon' && body < 1) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - body) * sstep(0.7, 1.0, S.t) * 0.9; c.drawImage(B.cv, B.x * kk, B.y * kk, B.cv.width * kk, B.cv.height * kk); }
      if (S.phase === 'out' || S.phase === 'gone') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - body) * 0.6 * Math.min(1, body * 4); c.drawImage(B.cv, B.x * kk, B.y * kk, B.cv.width * kk, B.cv.height * kk); }
      c.restore(); }
    // the steering wheel behind the pet when it is behind it (the car turned away)
    if (withPet) { drawSteer(S, c, T, body, false); drawSeatPet(S, c, T, seatS); drawSteer(S, c, T, body, true); }
    if (spr && spr.front && (body > 0.01 || ghost > 0.01)) { c.save(); place(); c.globalAlpha = Math.max(body, ghost * 0.35); const Fp = spr.front; c.drawImage(Fp.cv, Fp.x * kk, Fp.y * kk, Fp.cv.width * kk, Fp.cv.height * kk);
      if ((S.phase === 'summon' || S.phase === 'out' || S.phase === 'gone') && body < 1) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = (1 - body) * 0.7 * (S.phase === 'summon' ? sstep(0.7, 1.0, S.t) : Math.min(1, body * 4)); c.drawImage(Fp.cv, Fp.x * kk, Fp.y * kk, Fp.cv.width * kk, Fp.cv.height * kk); }
      c.restore(); }
    // the heart headlights and the taillights glowing; hubs and lights flare with car.glow
    const lt = S.lights * body; if (lt > 0.02) { c.save(); c.globalCompositeOperation = 'lighter';
      for (const s of [-1, 1]) { const [hx, hy] = lScr(S, 1.4, s * 0.45, 0.42), r = T * (0.32 + 0.22 * car.glow) * (0.95 + 0.05 * Math.sin(t * 17 + s)); c.globalAlpha = 0.75 * lt; blitSized(c, glowSprite('#FFC4E4'), hx - r, hy - r, r * 2, r * 2); c.globalAlpha = 0.9 * lt; const r2 = r * 0.45; blitSized(c, glowSprite('#FFFFFF'), hx - r2, hy - r2, r2 * 2, r2 * 2);
        const [tx, ty] = lScr(S, -1.62, s * 0.42, 0.37), r3 = T * 0.2; c.globalAlpha = 0.6 * lt; blitSized(c, glowSprite('#FF4F86'), tx - r3, ty - r3, r3 * 2, r3 * 2); }
      c.restore(); }
  }
  function seatScreen(S, T) { const H = S.H, car = S.car, s = seatWorld(car); return [H.sx(s.x), H.sy(s.y) - s.z * ZK * T]; }
  /* the pet in the driver's seat: its own sprite, upright; it stands at the seat's foot while the car forms and hops in */
  function drawSeatPet(S, c, T, sp) {
    const H = S.H, me = S.me, car = S.car;
    let X = sp[0], Y = sp[1];
    if (S.phase === 'summon') { const u = sstep(1.12, 1.42, S.t); X = lerp(H.sx(S.petX0), X, u); Y = lerp(H.sy(S.petY0), Y, u) - Math.sin(u * Math.PI) * T * 0.35; }
    if (S.phase === 'out') { const u = sstep(0.12, 0.6, S.t / TUNE.out), gx = H.sx(S.petStand.x), gy = H.sy(S.petStand.y); X = lerp(X, gx, u); Y = lerp(Y, gy, u) - Math.sin(u * Math.PI) * T * 0.45; }
    if (S.phase === 'drive' || S.phase === 'nova') Y -= Math.abs(Math.sin(S.g.t * 9)) * T * 0.012 * cl(Math.hypot(car.vx, car.vy) / TUNE.top) + car.susp * T * 0.03;
    // (during a drift the pet rolls one flat turn with the car, exactly as the Dodge rolls its sprite; never a 3D turn)
    H.X.drawPetAt(c, X, Y, { maxH: 1.2, rot: S.drift && S.phase === 'drive' ? S.drift.petRot : 0 });
  }
  /* a small gold steering wheel in front of the seat (drawn before the pet when it is behind it on the screen) */
  function drawSteer(S, c, T, body, front) {
    if (body < 0.3 || S.phase === 'out') return; const car = S.car, ag = groundA(car.a + car.slide), isFront = Math.sin(ag) > -0.05; if (isFront !== front) return;
    const [x, y] = lScr(S, 0.02, 0, 0.6), ca = Math.cos(ag), sa = Math.sin(ag), R = T * 0.13;
    c.save(); c.globalAlpha = body; c.translate(x, y); c.transform(-sa, ca * GY, 0.25 * ca, -ZK * 0.9 + 0.25 * sa * GY, 0, 0); c.lineWidth = Math.max(1.5, T * 0.035); c.strokeStyle = '#B9852A'; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.stroke(); c.lineWidth = Math.max(1, T * 0.018); c.strokeStyle = '#FFE9A8'; c.beginPath(); c.arc(-R * 0.08, -R * 0.08, R, 3.4, 5.4); c.stroke(); c.restore();
  }
  /* the summoning's ribbons: spiralling up round the pet, then tracing wheels, bonnet and spoiler */
  let PATHS = null;
  function paths() {
    if (PATHS) return PATHS; const P = [];
    for (const [ax, s] of [[AXF, 1], [AXF, -1], [AXR, 1], [AXR, -1]]) { const pts = []; for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU; pts.push([ax + Math.cos(a) * (WR + 0.04), s * (WY + 0.08), WZ + Math.sin(a) * (WR + 0.04)]); } P.push(pts); }
    { const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(HL - 0.02, -HL + 0.05, u); pts.push([x, hwAt(x) * 0.96, Math.max(0.3, centre(x) * 0.8)]); } P.push(pts); P.push(pts.map(p => [p[0], -p[1], p[2]])); }
    { const pts = []; for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push([lerp(HL - 0.05, 0.3, u), 0, centre(lerp(HL - 0.05, 0.3, u)) + 0.04]); } P.push(pts); }
    { const pts = [[-1.52, -0.78, 0.98], [-1.52, 0.78, 0.98]]; const q = []; for (let i = 0; i <= 12; i++) { const u = i / 12; q.push([-1.52, lerp(-0.78, 0.78, u), 0.94 + 0.03 * Math.sin(u * Math.PI)]); } P.push(q); void pts; }
    return (PATHS = P);
  }
  function drawRibbons(S, c, T) {
    const t = S.t, H = S.H, car = S.car; if (t > 1.5) return;
    const fade = 1 - sstep(1.2, 1.5, t); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    // three ribbons rising round the seal
    const sx0 = H.sx(S.sealX), sy0 = H.sy(S.sealY), up = sstep(0.1, 0.7, t);
    for (let k = 0; k < 3; k++) { const pts = []; for (let i = 0; i <= 26; i++) { const u = i / 26; if (u > up) break; const a = u * 9 + k * TAU / 3 + t * 4, r = T * (1.5 - 0.6 * u) * (1 - sstep(0.75, 1.0, t) * 0.5); pts.push([sx0 + Math.cos(a) * r, sy0 + Math.sin(a) * r * GY * 0.8 - u * T * 1.3]); }
      if (pts.length > 1) { const a = fade * (1 - sstep(0.75, 1.05, t)); ribbonPath(c, pts, T * 0.1, a); } }
    // the tracing
    const P = paths();
    P.forEach((pts, i) => { const t0 = 0.55 + (i % 4) * 0.06, u = sstep(t0, t0 + 0.45, t); if (u <= 0) return; const n = Math.max(2, Math.ceil(pts.length * u)), sp = []; for (let j = 0; j < n; j++) sp.push(lScr(S, pts[j][0], pts[j][1], pts[j][2])); ribbonPath(c, sp, T * 0.07, fade * 0.95);
      const hd = sp[sp.length - 1], r = T * 0.22; c.globalAlpha = fade * (1 - u * 0.5); blitSized(c, glowSprite('#FFFFFF'), hd[0] - r, hd[1] - r, r * 2, r * 2); });
    c.restore(); void car;
  }
  function ribbonPath(c, pts, w, a) { if (a <= 0.01) return; c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.globalAlpha = a * 0.35; c.strokeStyle = ROSE; c.lineWidth = w * 2.6; c.stroke(); c.globalAlpha = a * 0.8; c.strokeStyle = '#FFC8E6'; c.lineWidth = w; c.stroke(); c.globalAlpha = a; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1, w * 0.35); c.stroke(); }
  /* particles over the scene (hearts, stars, sparks) and on the floor (smoke): never over the pet's face */
  function drawPartsFloor(S, c) { const H = S.H, T = H.X.Tz(); c.save(); c.globalCompositeOperation = 'lighter';
    for (const p of S.parts) { if (p.kind === 6) { if (!SM || !SM.ring) continue; const u = 1 - p.life / p.max, e = 1 - (1 - u) * (1 - u) * (1 - u), r = T * p.s * (0.2 + 0.8 * e); c.globalAlpha = Math.pow(1 - u, 1.4) * 0.95; c.drawImage(SM.ring, H.sx(p.x) - r, H.sy(p.y) - r * GY, r * 2, r * 2 * GY); continue; }
      if (p.kind !== 4) continue; const u = 1 - p.life / p.max, a = Math.min(1, u * 5) * (1 - u) * 0.38, r = T * p.s * (1 + p.grow * u); c.globalAlpha = a; blitSized(c, glowSprite('#FFE4F2'), H.sx(p.x) - r, H.sy(p.y) - p.z * ZK * T - r * 0.8, r * 2, r * 1.6); }
    c.restore(); }
  function drawOver(S, c) {
    const H = S.H, T = H.X.Tz(), me = S.me;
    callC2(S, c, 'drawOver');
    if (!S.parts.length || !SM) return;
    // the pet's head and body on the screen: particles fade near them so the pet stays readable
    let PX = -1e9, PY = -1e9; if (!S.released) { const sp = S.ctx.ejecting ? [H.sx(S.ctx.petX), H.sy(S.ctx.petY) - S.ctx.petZ * ZK * T] : seatScreen(S, T); PX = sp[0]; PY = sp[1] - T * 0.45; } else { PX = H.sx(me.x); PY = H.sy(me.y) - T * 0.45; }
    c.save();
    for (const p of S.parts) { if (p.kind === 4 || p.kind === 6) continue; const X = H.sx(p.x), Y = H.sy(p.y) - p.z * ZK * T, u = 1 - p.life / p.max, keep = 0.06 + 0.94 * sstep(T * 0.45, T * 1.25, Math.hypot(X - PX, Y - PY));
      if (p.kind === 5) { const s = T * p.s * (0.6 + 0.8 * u), a = (1 - u) * keep; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.9; c.save(); c.translate(X, Y - T * 0.2); c.drawImage(SM.heartP, -s, -s * 0.95, s * 2, s * 2); c.restore(); c.globalAlpha = a * 0.6; blitSized(c, glowSprite(ROSE), X - s * 1.4, Y - T * 0.2 - s * 1.4, s * 2.8, s * 2.8); c.globalCompositeOperation = 'source-over'; continue; }
      const a = Math.min(1, u * 8) * cl(p.life / Math.min(0.35, p.max)) * keep; if (a <= 0.01) continue;
      if (p.kind === 3) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; const r = T * p.s * 0.5; blitSized(c, glowSprite(p.col || GOLD), X - r, Y - r, r * 2, r * 2); continue; }
      const s = T * p.s, img = p.kind === 1 ? (p.s > 0.24 ? SM.heart : (p.x * 7 | 0) % 3 === 0 ? SM.heartG : SM.heart) : SM.star;
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * 0.35; blitSized(c, glowSprite(p.kind === 1 ? ROSE : GOLD), X - s * 1.3, Y - s * 1.3, s * 2.6, s * 2.6);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = a; c.save(); c.translate(X, Y); c.rotate(p.rot); c.drawImage(img, -s, -s, s * 2, s * 2); c.restore(); }
    c.restore();
  }

  /* ================= the HUD while driving: Shooting Star, Love Sensation, Drift and the Supernova meter ================= */
  function drawBtns(S, c, o) {
    const { B, blitC, hudPic, glowPic } = o, t = S.g.t, busy = !!S.busy || S.phase !== 'drive' || S.car.locked;
    const btn = (b, key, label, cd, cdMax, paint, rim, dx) => { const rd = cd <= 0.01 && !busy;
      blitC(c, hudPic(`car|${key}|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => paint(x, w / 2, h / 2, b.r, rd)), b.x, b.y);
      if (cd > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, cd / cdMax)); c.closePath(); c.fillStyle = 'rgba(0,0,0,.45)'; c.fill(); GFX.textS(c, cd.toFixed(1), b.x, b.y, 13, '#FFFFFF'); }
      GFX.labelS(c, label, b.x + (dx || 0), b.y + b.r + 9, 8, 800, rim, 'rgba(0,0,0,.7)', 3); };
    btn(B.s[0], 'star', 'SHOOTING STAR', S.cdStar, mvTune('starCd', 2.6), paintStarBtn, '#FFE7A8');
    btn(B.s[1], 'love', 'LOVE SENSATION', S.cdLove, mvTune('loveCd', 3.2), paintLoveBtn, '#FFC8E6', -8);
    { const b = B.d, rd = S.cdDrift <= 0.01 && !S.drift && S.phase === 'drive' && !S.car.locked;
      if (rd) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.1 * Math.sin(t * 5); blitC(c, glowPic(glowSprite, '#FF3355', Math.round(b.r * 1.7)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`car|drift|${rd}|${b.r}`, b.r * 2 + 10, b.r * 2 + 10, (x, w, h) => paintDriftBtn(x, w / 2, h / 2, b.r, rd)), b.x, b.y);
      if (S.cdDrift > 0.05) { c.beginPath(); c.moveTo(b.x, b.y); c.arc(b.x, b.y, b.r, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, S.cdDrift / TUNE.driftCd)); c.closePath(); c.fillStyle = 'rgba(40,0,10,.45)'; c.fill(); }
      GFX.labelS(c, 'DRIFT', b.x, b.y + b.r + 9, 9, 800, '#FFD0DA', 'rgba(0,0,0,.7)', 3); }
    // the Supernova meter: a pink-gold ring filling round a star-and-heart emblem; SUPERNOVA when full
    { const b = B.u, full = S.charge >= 1 && !S.used, k = S.used ? 1 : S.charge, nova = S.phase === 'nova';
      if (full || nova) { const pl = 0.5 + 0.5 * Math.sin(t * 6); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 + 0.35 * pl; blitC(c, glowPic(glowSprite, GOLD, Math.round(b.r * (2.1 + 0.25 * pl) * 4) / 4), b.x, b.y); c.globalAlpha = 0.5; blitC(c, glowPic(shockSprite, '#FF9BD2', Math.round(b.r * 1.8)), b.x, b.y); c.restore(); }
      blitC(c, hudPic(`car|nova|${full || nova}|${b.r}`, b.r * 2 + 12, b.r * 2 + 12, (x, w, h) => paintNovaBtn(x, w / 2, h / 2, b.r, full || nova)), b.x, b.y);
      // the fill: from the top, clockwise
      c.save(); c.lineCap = 'round'; c.lineWidth = 5.5; c.strokeStyle = 'rgba(30,8,28,.8)'; c.beginPath(); c.arc(b.x, b.y, b.r - 3, 0, TAU); c.stroke();
      if (k > 0.004) { const gr = c.createLinearGradient(b.x - b.r, b.y - b.r, b.x + b.r, b.y + b.r); gr.addColorStop(0, '#FF7FC0'); gr.addColorStop(0.55, '#FFB8DD'); gr.addColorStop(1, GOLD); c.strokeStyle = gr; c.lineWidth = 4.5; c.beginPath(); c.arc(b.x, b.y, b.r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
        c.globalCompositeOperation = 'lighter'; const ea = -Math.PI / 2 + TAU * k, ex = b.x + Math.cos(ea) * (b.r - 3), ey = b.y + Math.sin(ea) * (b.r - 3); c.globalAlpha = 0.9; blitSized(c, glowSprite('#FFFFFF'), ex - 7, ey - 7, 14, 14); }
      c.restore();
      // the time left: a thin pearl arc outside the ring, and the seconds
      if (S.phase === 'drive' || S.phase === 'summon') { const u = S.phase === 'summon' ? 1 : cl(S.left / S.dur); c.save(); c.lineCap = 'round'; c.lineWidth = 2; c.strokeStyle = 'rgba(255,248,251,.85)'; c.beginPath(); c.arc(b.x, b.y, b.r + 4, -Math.PI / 2, -Math.PI / 2 + TAU * u); c.stroke(); c.restore();
        GFX.labelS(c, Math.ceil(S.phase === 'summon' ? S.dur : S.left) + 's', b.x, b.y + b.r * 0.66, 9, 800, S.left < 5 && S.phase === 'drive' ? '#FF9AA8' : '#FFF8FB', 'rgba(0,0,0,.7)', 3); }
      const lab = nova ? 'SUPERNOVA!' : full ? 'SUPERNOVA' : S.used ? 'USED' : `SUPERNOVA ${Math.floor(S.charge * 100)}%`;
      if (full) { const s = 1 + 0.08 * Math.sin(t * 7); c.save(); c.translate(b.x, b.y + b.r + 10); c.scale(s, s); GFX.labelS(c, lab, 0, 0, 11, 900, GOLD, 'rgba(60,10,40,.85)', 3.5); c.restore(); }
      else GFX.labelS(c, lab, b.x, b.y + b.r + 9, 9, 800, nova ? GOLD : '#FFD9EC', 'rgba(0,0,0,.7)', 3); }
  }
  const btnBase = (x, cx, cy, r, c0, c1, c2) => { const gr = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); gr.addColorStop(0, c0); gr.addColorStop(0.55, c1); gr.addColorStop(1, c2); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); };
  const btnRim = (x, cx, cy, r, rd) => { x.lineWidth = 2.5; x.strokeStyle = rd ? '#FFFFFF' : 'rgba(255,255,255,.35)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke(); x.lineWidth = 1; x.strokeStyle = rd ? rgba(GOLD, 0.95) : 'rgba(255,216,107,.35)'; x.beginPath(); x.arc(cx, cy, r - 3, 0, TAU); x.stroke(); };
  function starPts(x, cx, cy, R, ri, rot) { x.beginPath(); for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i / 10 * TAU, rr = i % 2 ? ri : R; i ? x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : x.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); }
  function heartAt(x, cx, cy, s) { x.beginPath(); for (let i = 0; i <= 40; i++) { const t = i / 40 * TAU, hx = 16 * Math.pow(Math.sin(t), 3), hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)); i ? x.lineTo(cx + hx * s, cy + hy * s) : x.moveTo(cx + hx * s, cy + hy * s); } x.closePath(); }
  function paintStarBtn(x, cx, cy, r, rd) {
    if (rd) btnBase(x, cx, cy, r, '#FF9ED0', '#E8459A', '#9C1E63'); else btnBase(x, cx, cy, r, '#4A2B4E', '#2A1830', '#1A0E1E');
    x.save(); x.globalAlpha = rd ? 1 : 0.45; x.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const oy = (i - 1) * r * 0.16; const gr = x.createLinearGradient(cx - r * 0.7, cy + r * 0.45 + oy, cx, cy + oy); gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(1, 'rgba(255,240,200,.9)'); x.strokeStyle = gr; x.lineWidth = r * (0.12 - i * 0.02); x.beginPath(); x.moveTo(cx - r * 0.66, cy + r * 0.42 + oy * 0.5); x.lineTo(cx - r * 0.05, cy + oy * 0.4); x.stroke(); }
    starPts(x, cx + r * 0.12, cy - r * 0.08, r * 0.46, r * 0.2, 0.2); const gr = x.createLinearGradient(cx - r * 0.3, cy - r * 0.5, cx + r * 0.4, cy + r * 0.3); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.5, '#FFE48A'); gr.addColorStop(1, '#F2A93B'); x.fillStyle = gr; x.fill(); x.strokeStyle = '#B5652A'; x.lineWidth = 1.2; x.stroke();
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(cx + r * 0.52, cy - r * 0.5, r * 0.06, 0, TAU); x.fill(); x.restore(); btnRim(x, cx, cy, r, rd);
  }
  function paintLoveBtn(x, cx, cy, r, rd) {
    if (rd) btnBase(x, cx, cy, r, '#FFC2E2', '#FF5FAE', '#A51F66'); else btnBase(x, cx, cy, r, '#4A2B4E', '#2A1830', '#1A0E1E');
    x.save(); x.globalAlpha = rd ? 1 : 0.45; x.setLineDash([2.5, 3]); x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 1.6; x.beginPath(); x.arc(cx, cy + r * 0.25, r * 0.55, Math.PI * 1.1, Math.PI * 1.9); x.stroke(); x.setLineDash([]);
    heartAt(x, cx, cy + r * 0.02, r * 0.026); const gr = x.createRadialGradient(cx - r * 0.15, cy - r * 0.2, 1, cx, cy, r * 0.5); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.45, '#FFD0E8'); gr.addColorStop(1, '#FF5FAE'); x.fillStyle = gr; x.fill(); x.strokeStyle = '#8E1550'; x.lineWidth = 1.3; x.stroke();
    x.strokeStyle = rgba(GOLD, 0.95); x.lineWidth = 1.6; x.lineCap = 'round'; for (const s of [-1, 1]) { x.beginPath(); x.moveTo(cx + s * r * 0.42, cy + r * 0.5); x.lineTo(cx + s * r * 0.62, cy + r * 0.58); x.stroke(); x.beginPath(); x.moveTo(cx + s * r * 0.3, cy + r * 0.6); x.lineTo(cx + s * r * 0.42, cy + r * 0.74); x.stroke(); }
    x.restore(); btnRim(x, cx, cy, r, rd);
  }
  /* Drift: a beautiful scarlet with a bright curved tyre-track symbol, delicate pale-pink and gold trim */
  function paintDriftBtn(x, cx, cy, r, rd) {
    if (rd) btnBase(x, cx, cy, r, '#FF6A82', SCARLET, '#7A0619'); else btnBase(x, cx, cy, r, '#5A2430', '#3A1018', '#22070D');
    x.save(); x.globalAlpha = rd ? 1 : 0.5;
    // two curved tracks of tread blocks, sweeping round like a slide
    for (const off of [-0.2, 0.2]) { const R0 = r * (0.62 + off); for (let i = 0; i < 7; i++) { const a = 3.3 + i * 0.3, w = r * 0.17, h = r * 0.095, px = cx + r * 0.3 + Math.cos(a) * R0, py = cy + r * 0.42 + Math.sin(a) * R0; x.save(); x.translate(px, py); x.rotate(a + Math.PI / 2); x.fillStyle = i < 2 ? 'rgba(255,240,246,.55)' : '#FFF4F8'; x.beginPath(); x.moveTo(-w / 2, -h / 2); x.lineTo(w / 2, -h / 2 + h * 0.3); x.lineTo(w / 2, h / 2 + h * 0.3); x.lineTo(-w / 2, h / 2); x.closePath(); x.fill(); x.restore(); } }
    x.restore();
    x.lineWidth = 2.5; x.strokeStyle = rd ? '#FFE3EC' : 'rgba(255,227,236,.35)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
    x.lineWidth = 1.1; x.strokeStyle = rd ? GOLD : 'rgba(255,216,107,.35)'; x.beginPath(); x.arc(cx, cy, r - 3.2, 0, TAU); x.stroke();
    if (rd) { x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(cx - r * 0.3, cy - r * 0.48, r * 0.32, r * 0.14, -0.5, 0, TAU); x.fill(); }
  }
  function paintNovaBtn(x, cx, cy, r, full) {
    btnBase(x, cx, cy, r, full ? '#7A2A66' : '#4A1E46', full ? '#3E1236' : '#2A0F28', '#170616');
    // the emblem: a gold star with a glossy pink heart over its heart
    starPts(x, cx, cy - r * 0.04, r * 0.56, r * 0.25, 0); let gr = x.createLinearGradient(cx - r * 0.5, cy - r * 0.5, cx + r * 0.5, cy + r * 0.5); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.45, full ? '#FFE48A' : '#C9A55A'); gr.addColorStop(1, full ? '#E9962E' : '#7D5A2A'); x.fillStyle = gr; x.fill(); x.strokeStyle = full ? '#A55A1C' : '#5A3A1A'; x.lineWidth = 1.3; x.stroke();
    heartAt(x, cx, cy + r * 0.02, r * 0.017); gr = x.createRadialGradient(cx - r * 0.1, cy - r * 0.12, 1, cx, cy, r * 0.3); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(0.4, full ? '#FFB8DD' : '#C98AAE'); gr.addColorStop(1, full ? '#E0408F' : '#7A2E58'); x.fillStyle = gr; x.fill(); x.strokeStyle = 'rgba(80,10,50,.8)'; x.lineWidth = 1; x.stroke();
    x.lineWidth = 2; x.strokeStyle = full ? '#FFFFFF' : 'rgba(255,255,255,.45)'; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.stroke();
  }

  /* ================= the Ultimate ================= */
  U.sportscar = (C, H) => {
    const me = H.me, g = H.g;
    // (a spirit or any actor that is not the played pet cannot take the controls: a burst of hearts where it stands)
    if (me.spirit || !H.X.vehicle || !H.X.drawPetAt) { const DK = C.base * (C.K || 1); H.hitArea(me.x, me.y, 2.6, DK * 2.5, { el: 'light', src: 'ult' }); H.X.ring(me.x, me.y, 0.3, 2.6, 0.5, ROSE, 0.3); return; }
    if (g._sportscar && !g._sportscar.released) return;
    startForm(C, H);
  };
  /* idle-time preparation (20b calls it for an equipped Ultimate): the model, the small pictures, every heading */
  U.sportscar.warm = o => {
    BK.warmEv = Math.max(1, Math.min(7, Math.round(o.evo || 1)));
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const dpr = (typeof arc !== 'undefined' && arc.dpr) || 1; setScale(T * dpr); idleBake(); }, 250);
  };
  U.sportscar.TUNE = TUNE;
  // (the debug door for tests and the harness)
  U.sportscar.__dbg = { BK, TUNE, bakeStep, setScale, want, ready, bucketOf, groundA, get MOD() { return MOD; }, get SM() { return SM; }, STUB, moves, NB, GY, ZK, SEAT };
})();
