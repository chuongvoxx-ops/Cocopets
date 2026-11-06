/* ---------- Wind, reworked: 1000 Blades ----------
   Great samurai swords rise in a fan above the pet, then come apart into a swarm of green flowers that cuts through the
   monsters. Replaces Thousand-Wing Migration (row in 20k1: key 'thousandblades', cost 95, cd 20, glyph 'crescent').
   Counts (held until their breakpoints): 10 / 30 / 60 swords at levels 1-3 / 4-6 / 7, ten flower fragments a sword, so
   exactly 100 / 300 / 600 flowers. Swarm time (continuous): 4 s at L1, 5 s at L4, 6 s at L7 (4 + (evo - 1) / 3).
   Choreography (t from the cast):
     0 - 0.25    anticipation: air gathers round the pet, a light ring tightens on the floor.
     0.25 - 0.95 assembly (0.7 s): each sword is drawn out of the air grip first along its slot, slides out a little,
                 settles (out-back) and rings with a glint at the tip. L1 one fan of 10 tilted toward the aim; L4 three
                 staggered tiers (8, 10, 12), L7 four (10, 14, 16, 20), the outer tiers set between the inner swords.
     0.95 - 1.2  hold: a pale glint runs down each edge, then a green shimmer travels grip -> tip and fine luminous
                 seams light up between the ten segments of each sword.
     1.2 - 1.6   transformation (0.4 s): the segments peel away from the tip back to the pommel; each one flies off as
                 a steel shard that morphs into a green flower; the sword is consumed (no duplicate is left behind).
     swarm       (tau from 1.2): a loose cloud gathers, then one coherent stream banks through the monsters along a
                 figure-eight; L1 divides into three streams (petal loops through the centre) and reunites; L4 braids
                 three strands round the target area (a breathing ring); L7 opens six streams into a large flower whose
                 petals grow; then every level folds into one crescent formation for a rapid cutting pass along the
                 aim, and the flowers lose speed and dissolve into tiny green motes.
   Each flower follows its stream's centre line at its own lag, orbiting it (local orbit + spring follow, so the swarm
   reads like a flock without per-flower neighbour checks); the swarm centre drifts toward the monsters near the aim.
   Damage (DK = base x K x (1 + 0.08 (evo - 1))): grouped swarm volumes, never per flower. Every frame the streams'
   centre lines (8 samples a stream, radius ~0.6-0.75 K) mark the monsters they sweep; every 0.5 s of game time
   (f.t) each marked monster takes ONE hit of tickK x DK x (0.65 + 0.35 x the share of the swarm that touched it).
   The final cutting pass is one pulse a monster (passK x DK, a short stun, a small knock along the aim; bosses only
   take the damage). tickK / passK: 2.0 / 4.3 at L1, 1.95 / 6.0 at L4, 1.7 / 7.5 at L7 (interpolated between):
   a monster in the area the whole time takes ~14 DK at L1, ~16 at L4, ~19-20 at L7. Decorative motes never hit.
   Models: each sword is a per-pixel shaded katana (curved blade with thickness: cutting bevel, convex ji, shinogi
   ridge, shinogi-ji, back ridge, a fuller with a thin emerald inlay, a wavy frosted temper line, yokote and point;
   an oval iron guard with emerald inlays and a gold rim, gold habaki, iron collar and pommel, a dark silk-wrapped grip
   with raised diamond wrapping over pale rayskin; studio reflections + a specular light; a feathered ink edge).
   It is baked once per screen angle (32 buckets: the light stays fixed while the sword turns, so the reflections move),
   lazily, in slices (~0.6 ms a frame idle, <= 3 ms while something on screen is missing), the fan's angles first; the
   flowers are 6 variants (round / sharp five-petal folded meshes x emerald, jade, pale green) x 4 tilts x 8 tilt
   axes x 4 spins baked into small atlases and blitted (no per-flower transform, gradient or path); shards 16
   rotations. A floor that starts with this move in a kit bakes everything in idle time (U.thousandblades.warm, the
   generic hook in 20b). Ribbons along the stream centres, shadows and floor light are cheap strokes / cached blits. */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.migration;
  const TAU = Math.PI * 2;
  const MINT = '#73E8B6', EMER = '#16A57B', PALE = '#E7FFF6', JADE = '#4CD69E', LEAF = '#B4F5CF';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sst = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const fr = x => x - Math.floor(x);
  const hsh = (i, k) => fr(Math.sin(i * 12.9898 + k * 78.233 + 0.31) * 43758.5453);
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const n3 = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
  const LT = n3(-0.42, -0.74, 0.52), HV = n3(LT[0], LT[1], LT[2] + 1);   // the light on screen (x right, y down, z toward the viewer)
  let H = null;

  /* ================= level data ================= */
  const pw = (ev, a, b, c) => (ev <= 4 ? lerp(a, b, (ev - 1) / 3) : lerp(b, c, (ev - 4) / 3));
  const DATA = {
    swords: ev => (ev >= 7 ? 60 : ev >= 4 ? 30 : 10), perSword: 10,
    swarm: ev => 4 + (ev - 1) / 3, tick: 0.5,
    tickK: ev => pw(ev, 2.0, 1.95, 1.7), passK: ev => pw(ev, 4.3, 6.0, 7.5),
    // arcs: [count, inner radius (tiles from the arc's centre), scale, spread (deg), the arc's lift above the pet and sideways offset (tiles),
    //        the turn of its axis]: L4 a centre fan and two wing fans; L7 a centre fan, two wings and a high crown behind
    tiers: { 1: [[10, 0.85, 1, 150, 0, 0, 0]], 2: [[10, 0.85, 0.92, 124, 0.15, 0, 0], [10, 0.7, 0.8, 112, 0, -2.3, -0.8], [10, 0.7, 0.8, 112, 0, 2.3, 0.8]],
      3: [[12, 0.85, 0.88, 128, 0.1, 0, 0], [14, 0.7, 0.72, 122, -0.1, -2.3, -0.85], [14, 0.7, 0.72, 122, -0.1, 2.3, 0.85], [20, 0.95, 0.68, 156, 1.95, 0, 0]] },
    A0: 0.25, ASM: 0.7, SHIM: 0.95, TT: 1.2, PEEL: 0.3 };

  /* ================= colour ramps (look-up tables, 256 entries) ================= */
  function ramp(stops) { const L = new Uint8ClampedArray(768); const cs = stops.map(s => [s[0], hexRGB(s[1])]);
    for (let i = 0; i < 256; i++) { const x = i / 255; let k = 0; while (k < cs.length - 2 && x > cs[k + 1][0]) k++; const a = cs[k], b = cs[k + 1], u = cl((x - a[0]) / (b[0] - a[0])), s = u * u * (3 - 2 * u); for (let j = 0; j < 3; j++) L[i * 3 + j] = a[1][j] + (b[1][j] - a[1][j]) * s; } return L; }
  const RAMP = {
    steel: ramp([[0, '#121C20'], [0.22, '#33474B'], [0.42, '#6F8789'], [0.6, '#A9C0BC'], [0.75, '#D6E9E3'], [0.88, '#F1FFF9'], [1, '#FFFFFF']]),
    gold: ramp([[0, '#2A1C08'], [0.3, '#76561E'], [0.55, '#C39A44'], [0.75, '#EBCB78'], [1, '#FFF6D2']]),
    iron: ramp([[0, '#0B1210'], [0.3, '#1F2B28'], [0.55, '#40504B'], [0.78, '#7D928A'], [1, '#D2E4DC']]),
    ito: ramp([[0, '#070D0B'], [0.3, '#14211D'], [0.55, '#25392F'], [0.8, '#4E7464'], [1, '#9CC9B5']]),
    same: ramp([[0, '#56685A'], [0.4, '#A9BCA5'], [0.75, '#DCE9D6'], [1, '#F7FFF2']]),
    emer: ramp([[0, '#06301F'], [0.35, '#0F7A57'], [0.6, '#22B887'], [0.8, '#7FEDC0'], [1, '#EAFFF6']]) };
  const INK = [14, 40, 34];

  /* ================= the sword model (u: pommel 0 -> tip 1, in sword lengths; v across, + toward the back) ================= */
  const G0 = 0.032, G1 = 0.255, F1 = 0.27, TB = 0.28, TS1 = 0.29, HB1 = 0.318, KS = 0.86;
  const cen = u => (u >= TS1 ? 0.058 * Math.pow((u - TS1) / (1 - TS1), 2) : 0.012 * Math.pow((TS1 - u) / TS1, 2));
  const bladeW = s => 0.083 * (1 - 0.28 * s);
  // the blade's two edges at s (0 at the guard .. 1 at the tip): the cutting edge (-) and the back (+), the point curving in
  function bladeEdges(s) { const w = bladeW(s); if (s < KS) return [-w / 2, w / 2, w]; const q = Math.min(1, (s - KS) / (1 - KS)); return [-w / 2 + 0.88 * w * (1 - Math.sqrt(Math.max(0, 1 - q * q))), w / 2 - 0.12 * w * q * q, w]; }
  // studio reflection of a surface whose screen normal is (nx, ny, nz): a value along a ramp
  function refl(nx, ny, nz, alb, frost) {
    const rx = 2 * nz * nx, ry = 2 * nz * ny, h = -ry * 0.85 - rx * 0.35;
    let e = 0.17 + 0.34 * sst(-0.75, 0.1, h) + 0.46 * Math.exp(-((h - 0.45) / 0.13) * ((h - 0.45) / 0.13)) + 0.14 * sst(0.6, 1.1, h);
    const dif = Math.max(0, nx * LT[0] + ny * LT[1] + nz * LT[2]), sp = Math.pow(Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]), 40);
    return e * alb + frost * (0.2 + 0.35 * dif) + sp * 0.9; }
  const PO = [0, 0, 0, 0];
  // one pixel of the sword: (u, v) in the model, (cu, su) the screen direction of +u. Fills PO (rgba), false if empty
  function swordPix(u, v, cu, su, S) {
    const vr = v - cen(u), vx = -su, vy = cu;   // (the screen direction of +v)
    let sd, nu = 0, nv = 0, nz = 1, L = RAMP.steel, alb = 1, frost = 0, add = 0, inkK = 0.8, seam = 0;
    const out = () => false;
    if (u < 0 || u > 1) return out();
    const tdu = (u - TB) / 0.021, tdv = vr / 0.098, trr = tdu * tdu + tdv * tdv;
    if (u >= TS1 && u <= HB1 && Math.abs(vr) < lerp(0.046, 0.043, (u - TS1) / (HB1 - TS1))) {   // the habaki (gold collar on the blade)
      const hw = lerp(0.046, 0.043, (u - TS1) / (HB1 - TS1)); sd = Math.min(hw - Math.abs(vr), (u - TS1) * 0.6, (HB1 - u)) * S; nv = vr / hw * 0.75; nz = Math.sqrt(1 - nv * nv); L = RAMP.gold; alb = 0.95;
      if ((u - TS1) * S < 0.8) seam = 0.5; }
    else if (trr < 1.25 && (1 - trr) / (2 * (Math.sqrt((tdu / 0.021) * (tdu / 0.021) + (tdv / 0.098) * (tdv / 0.098)) || 1)) * S > -0.6) {   // the guard: an oval iron disc, nearly edge-on
      const gr = Math.sqrt((tdu / 0.021) * (tdu / 0.021) + (tdv / 0.098) * (tdv / 0.098)) || 1; sd = (1 - trr) / (2 * gr) * S;
      const k = Math.sqrt(cl(trr)); nu = tdu * 0.8; nv = tdv * 0.8; nz = Math.sqrt(Math.max(0.05, 1 - nu * nu - nv * nv)); L = RAMP.iron; alb = 1.05;
      if (trr > 0.72) { L = RAMP.gold; alb = 0.9; }   // a gold rim
      else { const dv = Math.abs(tdv), ph = fr(dv * 3.2 + 0.5); if (dv > 0.3 && Math.abs(ph - 0.5) < 0.22 && Math.abs(tdu) < 0.55) { L = RAMP.emer; alb = 1.1; add = 0.12; } }
      inkK = 0.9 * (0.6 + 0.4 * k); }
    else if (u >= TS1) {   // the blade
      const s = (u - TS1) / (1 - TS1), [ve, vb] = bladeEdges(s); sd = Math.min(vr - ve, vb - vr) * S; if (sd < -0.6) return out();
      const t = cl((vr - ve) / Math.max(1e-4, vb - ve)), th = 0.27 + 0.055 * Math.sin(u * 71) + 0.03 * Math.sin(u * 163 + 1.3), hard = 1 - sst(th - 0.035, th + 0.035, t);
      let tilt;   // + toward the cutting edge
      if (t < 0.075) { tilt = 0.9; add = 0.3; }   // the bright cutting bevel
      else if (t < 0.7) tilt = 0.27 - 0.17 * (t - 0.075) / 0.625;   // the ji: convex, leaning to the edge
      else if (t < 0.725) { tilt = 0; add = 0.22; }   // the shinogi ridge line
      else if (t < 0.93) tilt = -0.36;   // the shinogi-ji
      else tilt = -0.95;   // the back ridge
      const fuller = u > 0.34 && u < 0.76 && t > 0.74 && t < 0.9 && s < KS;
      if (fuller) { const tg = (t - 0.74) / 0.16, ends = Math.min(1, (u - 0.34) / 0.03, (0.76 - u) / 0.06); tilt = -0.36 + 1.1 * (tg - 0.5) * ends; alb = 0.78; if (Math.abs(tg - 0.5) < 0.3 && ends > 0.6) { L = RAMP.emer; alb = 0.95; add = 0.08; } }
      if (s > KS - 0.004 && s < KS + 0.004 && t > 0.08 && t < 0.72) add += 0.25;   // the yokote line
      nv = -Math.sin(tilt); nz = Math.cos(tilt);
      if (L === RAMP.steel) { if (hard > 0.01) { alb = lerp(alb * 0.74, 1.1, hard); frost = 0.42 * hard; } else alb *= 0.72 + 0.05 * Math.sin(u * 900 + 6 * Math.sin(vr * 340 + u * 130)); if (Math.abs(t - th) < 0.02) add += 0.12; }
      inkK = vr - ve < vb - vr ? 0.28 : 0.8; }
    else if (u >= G1 - 0.002) {   // the collar (fuchi): iron with gold edges
      const hw = 0.034; sd = (hw - Math.abs(vr)) * S; nv = vr / hw; nz = Math.sqrt(Math.max(0.05, 1 - nv * nv * 0.85)); L = (u < G1 + 0.003 || u > F1 - 0.003) ? RAMP.gold : RAMP.iron; alb = 1; if ((u - G1) * S < 0.8) seam = 0.6; }
    else if (u >= G0) {   // the grip: dark silk wrapping in raised diamonds over pale rayskin
      const gs = (u - G0) / (G1 - G0), hw = 0.03 * (1 + 0.07 * Math.sin(Math.PI * gs)); sd = (hw - Math.abs(vr)) * S; if (sd < -0.6) return out();
      const b = vr / hw, a = (u - G0) / 0.0265, m = Math.abs(fr(a) - 0.5) / 0.3 + Math.abs(b) / 0.5;
      nv = cl(Math.abs(b)) * Math.sign(b); nz = Math.sqrt(Math.max(0.05, 1 - nv * nv * 0.88));
      if (m < 1) { L = RAMP.same; alb = 0.85 * (1 - 0.35 * sst(0.6, 1, m)) * (0.92 + 0.08 * Math.sin(u * 2200) * Math.sin(vr * 2400)); }
      else { L = RAMP.ito; const w1 = fr(a + (b > 0 ? 1 : -1) * b * 0.6), ridge = Math.sin(Math.PI * w1), raised = Math.sin(Math.PI * cl((m - 1) / 1.1)); alb = 0.75 + 0.35 * ridge * (0.6 + 0.4 * raised); nu = (w1 - 0.5) * 0.5; frost = 0.05 * ridge; }
      inkK = 0.85; }
    else {   // the pommel cap
      const du = (u - G0) / G0, dv = vr / 0.033, rr = du * du + dv * dv; if (rr > 1.3) return out(); const gr = Math.sqrt((du / G0) * (du / G0) + (dv / 0.033) * (dv / 0.033)) || 1; sd = (1 - rr) / (2 * gr) * S;
      nu = du * 0.85; nv = dv * 0.85; nz = Math.sqrt(Math.max(0.05, 1 - nu * nu - nv * nv)); L = rr > 0.7 ? RAMP.gold : RAMP.iron; alb = 1; }
    if (sd < -0.6) return out();
    const nx = nu * cu + nv * vx, ny = nu * su + nv * vy;
    let e = refl(nx, ny, nz, alb, frost) + add; if (seam) e *= 1 - 0.45 * seam;
    const i = Math.max(0, Math.min(255, Math.round(e / 1.15 * 255))) * 3; let r = L[i], g = L[i + 1], bl = L[i + 2];
    if (sd < 1.5) { const k = (1 - Math.max(0, sd) / 1.5) * inkK; r = lerp(r, INK[0], k); g = lerp(g, INK[1], k); bl = lerp(bl, INK[2], k); }
    PO[0] = r; PO[1] = g; PO[2] = bl; PO[3] = cl(sd + 0.5) * 255; return true; }

  /* ================= the bake cache (sliced) ================= */
  const SL = 2.05, NB = 32, NT = 4, NA = 8, NSP = 4, NSH = 16, NV = 6;
  const FL_COL = [EMER, JADE, LEAF], TILTS = [0, 0.62, 1.0, 1.3];
  const BK = { S: 0, R: 0, sw: new Array(NB).fill(null), fl: new Array(NV).fill(null), sh: [], CS: 0, queue: [], job: null, ms: 0, maxSlice: 0, built: 0 };
  // a sword at screen angle bucket b, pixel by pixel; yields every few rows
  function* swordJob(b) {
    const S = BK.S, th = b / NB * TAU, cu = Math.cos(th), su = Math.sin(th);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [u, v] of [[-0.01, -0.11], [1.01, -0.11], [1.01, 0.13], [-0.01, 0.13]]) { const X = (u * cu - v * su) * S, Y = (u * su + v * cu) * S; x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
    const W = Math.ceil(x1 - x0) + 6, Hh = Math.ceil(y1 - y0) + 6, ox = -x0 + 3, oy = -y0 + 3, cv = mk(W, Hh), g = cv.getContext('2d'), img = g.createImageData(W, Hh), d = img.data;
    for (let py = 0; py < Hh; py++) { const Y = (py + 0.5 - oy) / S;
      for (let px = 0; px < W; px++) { const X = (px + 0.5 - ox) / S, u = X * cu + Y * su, v = -X * su + Y * cu; if (u < -0.005 || u > 1.005 || v < -0.105 || v > 0.125) continue;
        if (!swordPix(u, v, cu, su, S)) continue; const o = (py * W + px) * 4; d[o] = PO[0]; d[o + 1] = PO[1]; d[o + 2] = PO[2]; d[o + 3] = PO[3]; }
      if (py & 1) yield 0; }
    g.putImageData(img, 0, 0); BK.sw[b] = { cv, ox, oy, th }; }
  // a flower atlas: one variant, every tilt x tilt axis x spin, painted with paths (bake time only)
  function* flowerJob(vi) {
    const R = BK.R, CS = BK.CS, cv = mk(NA * NSP * CS, NT * CS), g = cv.getContext('2d'), shape = vi % 2, col = hexRGB(FL_COL[(vi / 2) | 0]);
    for (let ti = 0; ti < NT; ti++) for (let ai = 0; ai < NA; ai++) for (let si = 0; si < NSP; si++) {
      if (ti === 0 && ai > 0) { g.drawImage(cv, si * CS, 0, CS, CS, (ai * NSP + si) * CS, 0, CS, CS); continue; }
      flowerCell(g, ((ai * NSP + si) + 0.5) * CS, (ti + 0.5) * CS, R, shape, col, TILTS[ti], ai / NA * TAU, si / NSP * TAU / 5); yield 0; }
    BK.fl[vi] = cv; }
  const rgbS = (c, k, a) => `rgba(${Math.round(cl(c[0] * k / 255) * 255)},${Math.round(cl(c[1] * k / 255) * 255)},${Math.round(cl(c[2] * k / 255) * 255)},${a == null ? 1 : a})`;
  function flowerCell(g, cx, cy, R, shape, col, tilt, az, spin) {
    const ca = Math.cos(az), sa = Math.sin(az), ct = Math.cos(tilt), st2 = Math.sin(tilt);
    // the orientation: turn the flower's plane by `tilt` about a screen axis at angle `az`
    const rot = (x, y, z) => { const a1 = x * ca + y * sa, b1 = -x * sa + y * ca, b2 = b1 * ct - z * st2, z2 = b1 * st2 + z * ct; return [a1 * ca - b2 * sa, a1 * sa + b2 * ca, z2]; };
    const halves = [], prof = shape ? [0, 0.18, 0.4, 0.62, 0.82, 0.94, 1] : [0, 0.12, 0.3, 0.5, 0.7, 0.85, 0.95, 1];
    const wOf = r => (shape ? 0.3 * Math.sin(Math.PI * r) * (1 - 0.55 * r) + 0.02 : 0.4 * Math.sqrt(Math.max(0, 1 - ((r - 0.5) / 0.52) * ((r - 0.5) / 0.52))));
    for (let k = 0; k < 5; k++) { const al = spin + k * TAU / 5 - Math.PI / 2, co = Math.cos(al), si = Math.sin(al);
      for (const side of [-1, 1]) { const P = [], mid = [];
        for (const r of prof) { const w = side * wOf(r), z = Math.abs(w) * 0.55 + r * r * 0.3; P.push(rot((r * co - w * si) * R, (r * si + w * co) * R, z * R)); }
        for (let j = prof.length - 1; j >= 0; j--) { const r = prof[j]; mid.push(rot(r * co * R, r * si * R, r * r * 0.3 * R)); }
        const e1 = rot(co, si, 0.3), e2 = rot(-si * side, co * side, 0.55), n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]];
        const nl = Math.hypot(n[0], n[1], n[2]) || 1, fl = side > 0 ? 1 : -1; const nn = [n[0] / nl * fl, n[1] / nl * fl, n[2] / nl * fl];
        let zs = 0; for (const p of P) zs += p[2]; halves.push({ P, mid, n: nn, z: zs / P.length }); } }
    halves.sort((a, b) => a.z - b.z);
    g.save(); g.translate(cx, cy); g.lineJoin = 'round'; g.lineCap = 'round';
    for (const h of halves) {
      let n = h.n; const back = n[2] < 0; if (back) n = [-n[0], -n[1], -n[2]];
      const lam = Math.max(0, n[0] * LT[0] + n[1] * LT[1] + n[2] * LT[2]), spec = Math.pow(Math.max(0, n[0] * HV[0] + n[1] * HV[1] + n[2] * HV[2]), 10);
      const base = back ? [col[0] * 0.75 + 60, col[1] * 0.75 + 64, col[2] * 0.75 + 60] : col, k = 0.62 + 0.6 * lam;
      g.beginPath(); h.P.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); for (const p of h.mid) g.lineTo(p[0], p[1]); g.closePath();
      g.strokeStyle = 'rgba(8,60,42,0.6)'; g.lineWidth = Math.max(1, R * 0.11); g.stroke();   // (the thickness under the face, and the outline)
      const tip = h.P[h.P.length - 1], gr = g.createLinearGradient(0, 0, tip[0], tip[1]); gr.addColorStop(0, rgbS(base, k * 0.62)); gr.addColorStop(0.55, rgbS(base, k)); gr.addColorStop(1, rgbS(base, k * 1.12 + spec * 0.5));
      g.fillStyle = gr; g.fill();
      g.beginPath(); h.P.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.strokeStyle = `rgba(231,255,246,${(0.18 + 0.8 * spec).toFixed(3)})`; g.lineWidth = Math.max(0.7, R * 0.09); g.stroke();   // the edge catching the light
      g.beginPath(); g.moveTo(0, 0); g.lineTo(tip[0] * 0.8, tip[1] * 0.8); g.strokeStyle = rgbS(base, k * 0.55, 0.45); g.lineWidth = Math.max(0.5, R * 0.05); g.stroke(); }
    const c0 = rot(0, 0, 0.12 * R), rx = R * 0.17, ry = R * 0.17 * Math.max(0.25, Math.abs(ct));
    g.save(); g.translate(c0[0], c0[1]); g.rotate(az); g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fillStyle = '#F2FFC8'; g.fill(); g.strokeStyle = 'rgba(30,110,70,0.7)'; g.lineWidth = Math.max(0.6, R * 0.06); g.stroke(); g.restore();
    g.restore(); }
  // steel shards (a peeled segment on its way to becoming a flower): 2 kinds (blade, grip) x 16 turns
  function* shardJob() {
    const S = BK.S, Lp = S * 0.1, W = S * 0.075, sz = Math.ceil(Math.hypot(Lp, W)) + 6;
    for (let kind = 0; kind < 2; kind++) for (let b = 0; b < NSH; b++) { const cv = mk(sz, sz), g = cv.getContext('2d'), th = b / NSH * TAU; g.translate(sz / 2, sz / 2); g.rotate(th);
      const pts = [[-Lp / 2, -W * 0.42], [Lp * 0.42, -W * 0.5], [Lp / 2, W * 0.1], [Lp * 0.36, W * 0.5], [-Lp * 0.5, W * 0.38], [-Lp * 0.42, 0]];
      g.beginPath(); pts.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
      const lit = 0.5 + 0.5 * Math.cos(th + 2.1), gr = g.createLinearGradient(0, -W / 2, 0, W / 2);
      if (kind === 0) { gr.addColorStop(0, `rgba(${200 + 55 * lit | 0},255,${235 + 20 * lit | 0},1)`); gr.addColorStop(0.35, `rgba(${140 + 60 * lit | 0},${170 + 50 * lit | 0},${168 + 50 * lit | 0},1)`); gr.addColorStop(1, 'rgba(52,72,74,1)'); }
      else { gr.addColorStop(0, 'rgba(70,104,92,1)'); gr.addColorStop(0.5, 'rgba(26,40,35,1)'); gr.addColorStop(1, 'rgba(10,18,15,1)'); }
      g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(14,40,34,0.8)'; g.lineWidth = 1; g.stroke();
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.strokeStyle = 'rgba(231,255,246,0.9)'; g.lineWidth = 1.2; g.stroke();
      (BK.sh[kind] = BK.sh[kind] || [])[b] = cv; yield 0; } }
  // set the bake scale (device px a sword length / a tile); a change of more than 12% drops the old pictures
  function setScale(Tpx) {
    const S = Math.round(Tpx * SL / 4) * 4, R = Math.max(5, Tpx * 0.15);
    if (BK.S && Math.abs(S - BK.S) / BK.S < 0.3) return false;   /* (the camera zooms a little during casts: pictures within 30% are reused) */
    BK.S = S; BK.R = R; BK.CS = Math.ceil(R * 2.5) + 4; BK.sw.fill(null); BK.fl.fill(null); BK.sh = []; BK.queue = []; BK.job = null; return true; }
  const has = k => (k[0] === 's' ? !!BK.sw[k[1]] : k[0] === 'f' ? !!BK.fl[k[1]] : BK.sh[1] && BK.sh[1][NSH - 1]);
  // queue what is missing, the urgent first (a list of keys: ['s', bucket] | ['f', variant] | ['h'])
  function want(keys, front) { for (const k of keys) { if (has(k) || (BK.job && BK.job.k[0] === k[0] && BK.job.k[1] === k[1]) || BK.queue.some(q => q[0] === k[0] && q[1] === k[1])) continue; if (front) BK.queue.unshift(k); else BK.queue.push(k); } }
  const allKeys = () => { const ks = [['h', 0]]; for (let v = 0; v < NV; v++) ks.push(['f', v]); for (let b = 0; b < NB; b++) ks.push(['s', b]); return ks; };
  function bakeStep(ms) {
    if (!BK.S) return; const t0 = performance.now(), until = t0 + ms;
    while (performance.now() < until) {
      if (!BK.job) { const k = BK.queue.shift(); if (!k) break; if (has(k)) continue; BK.job = { k, it: k[0] === 's' ? swordJob(k[1]) : k[0] === 'f' ? flowerJob(k[1]) : shardJob() }; }
      let done = false; while (performance.now() < until) { const q0 = performance.now(); if (BK.job.it.next().done) done = true; const q1 = performance.now() - q0; if (q1 > (BK.stepMax || 0)) { BK.stepMax = q1; BK.stepKey = BK.job.k.join(''); } if (done) break; }
      if (done) { BK.job = null; BK.built++; } }
    const dt = performance.now() - t0; BK.ms += dt; if (dt > BK.maxSlice) BK.maxSlice = dt; }
  let idleOn = false;
  function idleBake() { if (idleOn) return; idleOn = true; const step = () => { bakeStep(4); if (BK.queue.length || BK.job) setTimeout(step, 24); else idleOn = false; }; setTimeout(step, 30); }

  /* ================= cached glows ================= */
  const shimSpr = () => fxSprite('tb-shim', 64, 16, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(115,232,182,0)'); gr.addColorStop(0.5, 'rgba(200,255,228,1)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.5, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  const seamSpr = () => fxSprite('tb-seam', 8, 32, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(115,232,182,0)'); gr.addColorStop(0.5, 'rgba(231,255,246,1)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'destination-in'; const gv = g.createLinearGradient(0, 0, 0, h); gv.addColorStop(0, 'rgba(0,0,0,0)'); gv.addColorStop(0.25, 'rgba(0,0,0,1)'); gv.addColorStop(0.75, 'rgba(0,0,0,1)'); gv.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gv; g.fillRect(0, 0, w, h); });
  const starSpr = () => fxSprite('tb-star', 48, 48, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(231,255,246,0.7)'); gr.addColorStop(0.45, 'rgba(115,232,182,0.15)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w);
    g.globalCompositeOperation = 'lighter'; for (const [a, l] of [[0, 1], [Math.PI / 2, 0.8]]) { g.save(); g.translate(c0, c0); g.rotate(a + 0.3); const lg = g.createLinearGradient(-c0, 0, c0, 0); lg.addColorStop(0, 'rgba(231,255,246,0)'); lg.addColorStop(0.5, `rgba(255,255,255,${l})`); lg.addColorStop(1, 'rgba(231,255,246,0)'); g.fillStyle = lg; g.fillRect(-c0, -1.2, w, 2.4); g.restore(); } });
  const ringSpr = () => fxSprite('tb-ring', 192, 192, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); [[0, 'rgba(115,232,182,0)'], [0.62, 'rgba(115,232,182,0)'], [0.8, 'rgba(115,232,182,0.45)'], [0.9, 'rgba(231,255,246,0.9)'], [0.96, 'rgba(115,232,182,0.3)'], [1, 'rgba(115,232,182,0)']].forEach(s => gr.addColorStop(s[0], s[1])); g.fillStyle = gr; g.fillRect(0, 0, w, w); });
  const shadeSpr = () => fxSprite('tb-shade', 64, 64, (g, w) => { const c0 = w / 2, gr = g.createRadialGradient(c0, c0, 0, c0, c0, c0); gr.addColorStop(0, 'rgba(6,30,22,0.55)'); gr.addColorStop(0.5, 'rgba(6,30,22,0.25)'); gr.addColorStop(1, 'rgba(6,30,22,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, w); });

  /* ================= the swarm's paths ================= */
  // the centre line of stream k of phase P at swarm time tau: world x, y and height z into o
  function pathAt(F, P, k, tau, o) {
    const lt = tau - P.t0, K = F.K, cx = F.cx, cy = F.cy, dx = F.dx, dy = F.dy, px = -dy, py = dx;
    switch (P.m) {
      case 'C': { const u = sst(0, 0.5, lt); o[0] = lerp(F.ox, F.ox + dx * 0.8, u); o[1] = lerp(F.oy, F.oy + dy * 0.8, u); o[2] = lerp(1.7, 1.2, u); return; }
      case 'S': { const ph = -Math.PI / 2 + lt * TAU / 2.3, s = Math.sin(ph), s2 = Math.sin(2 * ph); o[0] = cx + dx * 2.3 * K * s + px * 1.25 * K * s2; o[1] = cy + dy * 2.3 * K * s + py * 1.25 * K * s2; o[2] = 0.8 + 0.25 * Math.cos(2 * ph); return; }
      case 'P3': { const s = fr(lt / 1.2), b = F.aa + k * TAU / 3 + 0.35 * lt + (s - 0.5) * 1.5, r = 2.3 * K * Math.sin(Math.PI * s); o[0] = cx + Math.cos(b) * r; o[1] = cy + Math.sin(b) * r; o[2] = 0.55 + 0.5 * Math.sin(Math.PI * s); return; }
      case 'B3': { const ph = F.aa + Math.PI + lt * TAU / 2.0, rb = K * (1.6 + 0.75 * Math.sin(1.1 * lt - Math.PI / 2)), ps = 3 * ph + k * TAU / 3, r = rb + 0.5 * Math.sin(ps); o[0] = cx + Math.cos(ph) * r; o[1] = cy + Math.sin(ph) * r; o[2] = 0.85 + 0.38 * Math.cos(ps); return; }
      case 'F6': { const op = sst(0, 1.8, lt), s = fr(lt / 1.3), b = F.aa + k * TAU / 6 + 0.3 * lt + (s - 0.5) * 1.0, r = K * lerp(1.2, 3.2, op) * Math.sin(Math.PI * s); o[0] = cx + Math.cos(b) * r; o[1] = cy + Math.sin(b) * r; o[2] = 0.5 + (0.35 + 0.8 * op) * Math.sin(Math.PI * s); return; }
      default: { const h = xHead(F, P, tau); o[0] = h[0]; o[1] = h[1]; o[2] = 0.65; } } }
  // the cutting pass: the head of the crescent along the aim (gathers behind the target, then sweeps through, accelerating)
  function xHead(F, P, tau) { const u = cl((tau - P.t0) / (P.t1 - P.t0)), w = Math.pow(cl((u - 0.22) / 0.78), 1.5), Lp = 3.0 * F.K, d = -Lp + 2 * Lp * w + Math.max(0, tau - P.t1) * 6; return [F.cx + F.dx * d, F.cy + F.dy * d, d]; }
  const NS_OF = { C: 1, S: 1, P3: 3, B3: 3, F6: 6, X: 1 }, LAG_OF = { C: 0, S: 0.75, P3: 0.5, B3: 0.85, F6: 0.42, X: 0 }, RAD_OF = { C: 0, S: 0.62, P3: 0.45, B3: 0.4, F6: 0.36, X: 0 }, OM_OF = { C: 5, S: 9, P3: 10, B3: 10, F6: 10, X: 16 }, VOL_OF = { C: 0, S: 0.75, P3: 0.62, B3: 0.62, F6: 0.6, X: 0 };
  function plan(ev, SW) {
    const tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, D = 0.6, XL = tier === 3 ? 0.65 : 0.75, ph = [['C', 0.5]];
    if (tier === 1) { const rest = SW - 0.5 - XL - D; ph.push(['S', rest * 0.46], ['P3', rest * 0.54]); }
    else if (tier === 2) ph.push(['S', 0.9], ['B3', SW - 0.5 - XL - D - 0.9]);
    else ph.push(['S', 0.8], ['F6', SW - 0.5 - XL - D - 0.8]);
    ph.push(['X', XL]); let t = 0; const out = ph.map(([m, d]) => { const o = { m, t0: t, t1: t + d }; t += d; return o; }); return { ph: out, tD: t }; }

  /* ================= the move ================= */
  U.thousandblades = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1, NSW = DATA.swords(ev), NF = NSW * DATA.perSword, SW = DATA.swarm(ev), PL = plan(ev, SW);
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), TICKD = DK * DATA.tickK(ev), PASSD = DK * DATA.passK(ev);
    const A0 = DATA.A0, ASM = DATA.ASM, TT = DATA.TT, PEEL = DATA.PEEL, END = TT + SW + 0.35;
    const aimA = Math.atan2(C.ty - me.y, C.tx - me.x), aimSX = Math.cos(aimA);
    // the swords: tiers of fan slots round the pet's centre, tilted toward the aim; the outer tiers between the inner swords
    const swords = []; DATA.tiers[tier].forEach(([n, r0, sc, spr, lift, ox, ax], ti) => { const axis = -Math.PI / 2 + (tier === 1 ? 0.42 : 0.2) * aimSX + ax, sp = spr * Math.PI / 180;
      for (let j = 0; j < n; j++) { const v = n > 1 ? j / (n - 1) - 0.5 : 0, be = axis + v * sp + (ti % 2 ? 0.5 / n : 0) * sp * 0.5, th = be + 0.16 * Math.sin(H.wrap(aimA - be));
        const ord = Math.abs(v) * 0.55 + ti * 0.18 + hsh(swords.length, 1) * 0.08; swords.push({ i: swords.length, ti, be, th, r0, sc, lift, ox, tA: A0 + Math.min(0.4, ord * 0.55), tP: TT + (1 - Math.abs(v)) * 0.05 + ti * 0.03 + hsh(swords.length, 2) * 0.06, seed: hsh(swords.length, 3) * TAU, peeled: 0, X: 0, Y: 0 }); } });
    const ord = swords.slice().sort((a, b) => b.ti - a.ti);   // (the outer tiers drawn first: behind)
    // the flowers (typed arrays): position, velocity, birth, look
    const FA = n => new Float32Array(n), fx = { x: FA(NF), y: FA(NF), z: FA(NF), vx: FA(NF), vy: FA(NF), vz: FA(NF), born: FA(NF).fill(-1), sb: new Uint8Array(NF), lag: FA(NF), orR: FA(NF), orP: FA(NF), orW: FA(NF), sz: FA(NF), tw: FA(NF), tp: FA(NF), spP: FA(NF), spW: FA(NF), gl: FA(NF), lat: FA(NF), dep: FA(NF), dd: FA(NF), var: new Uint8Array(NF), ang: FA(NF) };
    for (let i = 0; i < NF; i++) { fx.lag[i] = hsh(i, 4); fx.orR[i] = 0.25 + 0.75 * Math.sqrt(hsh(i, 5)); fx.orP[i] = hsh(i, 6) * TAU; fx.orW[i] = (3 + 4 * hsh(i, 7)) * (hsh(i, 8) < 0.5 ? -1 : 1); fx.sz[i] = (0.78 + 0.4 * hsh(i, 9)) * (tier === 3 ? 0.9 : tier === 2 ? 0.95 : 1);
      fx.tw[i] = 3 + 5 * hsh(i, 10); fx.tp[i] = hsh(i, 11) * TAU; fx.spP[i] = hsh(i, 12); fx.spW[i] = (1 + 1.6 * hsh(i, 13)) * (hsh(i, 14) < 0.5 ? -1 : 1); fx.gl[i] = hsh(i, 15) * TAU; fx.lat[i] = (hsh(i, 16) - 0.5) * 2; fx.dep[i] = hsh(i, 17); fx.dd[i] = hsh(i, 18) * 0.25; fx.var[i] = (i * 7 + ((i / 10) | 0)) % NV; }
    let F = { key: 'thousandblades', life: END, ev, DK, NSW, NF, swords, fl: fx, plan: PL, K: C.K, cx: C.tx, cy: C.ty, c0x: C.tx, c0y: C.ty, dx: Math.cos(aimA), dy: Math.sin(aimA), aa: aimA, ox: me.x, oy: me.y,
      ax: me.x, ay: me.y, tD: PL.tD, born: 0, touch: new Map(), nextTick: TT + 0.5 + 0.5, passHit: new Set(), ticks: 0, hits: 0, passN: 0, dead: false, sfxM: -1, bkT: 0 };
    const o1 = [0, 0, 0], o2 = [0, 0, 0], tg = [0, 0, 0];
    H.X.banner('1000 BLADES', '', C.col, 1.4); H.X.sfx.hum();
    // what the cast needs first: the fan's angle buckets (the urgent ones), then the shards and the flowers
    const needS = [...new Set(swords.map(s => ((Math.round(s.th / TAU * NB) % NB) + NB) % NB))].map(b => ['s', b]);
    const prime = Tpx => { setScale(Tpx); want([['h', 0], ...[0, 1, 2, 3, 4, 5].map(v => ['f', v])], true); want(needS, true); };
    if (typeof arc !== 'undefined') prime(H.X.Tz() * Math.min(2, arc.dpr || 1));

    // the target of flower i in phase P at swarm time tau (world) into tg
    function target(P, i, tau, t) {
      if (P.m === 'C') { const u = sst(0, 0.5, tau - P.t0), r = (0.35 + 0.8 * fx.orR[i]) * (1 + 0.3 * u), ps = fx.orP[i] + t * 2.6 * Math.sign(fx.orW[i]); tg[0] = lerp(F.ax, F.ax + F.dx * 0.8, u) + Math.cos(ps) * r; tg[1] = lerp(F.ay, F.ay + F.dy * 0.8, u) + Math.sin(ps) * r * 0.55; tg[2] = lerp(1.6, 1.15, u) + Math.sin(ps * 0.7 + fx.tp[i]) * r * 0.5; return; }
      if (P.m === 'X') { const hd = xHead(F, P, tau), l = fx.lat[i], W = (tier === 3 ? 2.3 : tier === 2 ? 1.9 : 1.6) * F.K, back = (l * l * 0.9 + fx.dep[i] * 0.8) * F.K; tg[0] = hd[0] - F.dy * l * W - F.dx * back; tg[1] = hd[1] + F.dx * l * W - F.dy * back; tg[2] = 0.55 + 0.4 * fx.dep[i] + 0.1 * Math.sin(t * 9 + fx.tp[i]); return; }
      const nS = NS_OF[P.m], k = i % nS, tl = tau - fx.lag[i] * LAG_OF[P.m]; pathAt(F, P, k, tl, o1); pathAt(F, P, k, tl - 0.04, o2);
      let tx = o1[0] - o2[0], ty = o1[1] - o2[1]; const tl2 = Math.hypot(tx, ty) || 1; tx /= tl2; ty /= tl2;
      const ps = fx.orP[i] + fx.orW[i] * t, r = fx.orR[i] * RAD_OF[P.m] * F.K, cs = Math.cos(ps), sn = Math.sin(ps), along = Math.sin(ps * 0.5 + fx.tp[i]) * 0.12;
      tg[0] = o1[0] - ty * cs * r + tx * along; tg[1] = o1[1] + tx * cs * r + ty * along; tg[2] = Math.max(0.2, o1[2] + sn * r * 0.75); }
    const phaseAt = tau => { const ph = PL.ph; for (let j = 0; j < ph.length; j++) if (tau < ph[j].t1 || j === ph.length - 1) return j; return ph.length - 1; };
    // the screen picture of sword s at time t: the grip's point, the angle, the reveal and the cut
    const petBox = T => [H.sx(me.x + (me.hopDX || 0)), H.sy(me.y + (me.hopDY || 0)) - T * 0.5 - (me.z || 0) * T];
    const nearPet = (X, Y, T, pb) => 0.3 + 0.7 * sst(T * 0.4, T * 1.15, Math.hypot(X - pb[0], (Y - pb[1]) * 1.1));
    function swordPose(s, t, T) {
      const a = cl((t - s.tA) / 0.3), ob = H.ease.back(Math.min(1, a)), X0 = H.sx(F.ax) + s.ox * T, Y0 = H.sy(F.ay) - T * (0.58 + s.lift), bob = Math.sin(t * 2.2 + s.seed) * T * 0.035 * sst(0.2, 1, a);
      const r = (s.r0 - 0.4 * (1 - ob)) * T; s.X = X0 + Math.cos(s.be) * r; s.Y = Y0 + Math.sin(s.be) * r + bob; s.a = a; s.L = SL * T * s.sc * (0.82 + 0.18 * ob); return s; }
    const segPt = (s, u) => { const cu = Math.cos(s.th), su = Math.sin(s.th), v = cen(u) * s.L; return [s.X + cu * u * s.L - su * v, s.Y + su * u * s.L + cu * v]; };

    // the flowers a sword's peeled segment becomes
    function spawn(s, j, t, T) {
      const i = s.i * 10 + j; if (fx.born[i] >= 0) return; const p = segPt(s, (j + 0.5) / 10), Yg = H.sy(F.ay);
      fx.x[i] = F.ax + (p[0] - H.sx(F.ax)) / T; fx.y[i] = F.ay - 0.02 * s.ti; fx.z[i] = Math.max(0.2, (Yg - p[1]) / T);
      const nx = -Math.sin(s.th) * (j % 2 ? 1 : -1), ny = Math.cos(s.th) * (j % 2 ? 1 : -1), rx = Math.cos(s.th), ry = Math.sin(s.th), sp = 1.6 + 1.6 * hsh(i, 19), out = 1.2 + 0.8 * hsh(i, 20);
      fx.vx[i] = (nx * sp + rx * out); fx.vz[i] = -(ny * sp + ry * out) + 0.4; fx.vy[i] = (hsh(i, 21) - 0.5) * 1.2; fx.born[i] = t; fx.ang[i] = s.th; fx.sb[i] = j < 3 ? 1 : 0; F.born++; }

    F = H.add(Object.assign(F, {
      update(dt, f) {
        const t = f.t, T = H.X.Tz();
        if (me.dead && !f.dead) { f.dead = true; if (t < TT) f.life = Math.min(f.life, 0.35); else f.tD = Math.min(f.tD, t - TT); }
        const k = 1 - Math.exp(-dt * 10); f.ax += (me.x - f.ax) * k; f.ay += (me.y - f.ay) * k;
        // the pictures still to bake (more while what is on screen is missing)
        if (BK.queue.length || BK.job) { const miss = t < TT + 0.3 && needS.some(q => !BK.sw[q[1]]) || (t > TT - 0.6 && !BK.fl.every(Boolean)); bakeStep(miss ? 2.5 : 0.8); f.bkT += dt; }
        // the swarm centre drifts toward the monsters near the aim (never more than 3 tiles from it)
        if (t > TT * 0.5) { let sx = 0, sy = 0, sw = 0; for (const m of H.living()) { const d = Math.hypot(m.x - f.c0x, m.y - f.c0y); if (d < 5) { const w = 1 / (1 + d * 0.5); sx += m.x * w; sy += m.y * w; sw += w; } }
          if (sw > 0) { let gx = sx / sw - f.cx, gy = sy / sw - f.cy; const gl = Math.hypot(gx, gy), mv = Math.min(gl, dt * 1.4); if (gl > 0.01) { f.cx += gx / gl * mv; f.cy += gy / gl * mv; } }
          const dl = Math.hypot(f.cx - f.c0x, f.cy - f.c0y); if (dl > 3) { f.cx = f.c0x + (f.cx - f.c0x) / dl * 3; f.cy = f.c0y + (f.cy - f.c0y) / dl * 3; } }
        // the swords: the assembly's sounds, the peel (each segment, tip first, becomes a flower)
        if (t < TT + PEEL + 0.2 && !f.dead) for (const s of swords) { if (!s.rang && t > s.tA + 0.24) { s.rang = 1; if (s.i % Math.max(1, Math.round(NSW / 5)) === 0) H.X.sfx.sparkle(); }
          if (t > s.tP) { swordPose(s, t, T); const cut = 1 - cl((t - s.tP) / PEEL); while (s.peeled < 10 && cut < (9.5 - s.peeled) / 10) { spawn(s, 9 - s.peeled, t, T); s.peeled++; } } }
        if (!f.whoosh && t > A0) { f.whoosh = 1; H.X.sfx.whoosh(); }
        if (!f.trans && t > TT) { f.trans = 1; H.X.sfx.sparkle(); H.X.sfx.whoosh(); H.X.shake(2, 0.1); }
        // the swarm
        const tau = t - TT; if (tau < 0) return;
        const pj = phaseAt(tau), P = PL.ph[pj], Pn = PL.ph[pj + 1], wB = Pn ? sst(P.t1 - 0.22, P.t1 + 0.22, tau) : 0, Pp = PL.ph[pj - 1], wA = Pp ? 1 - sst(Pp.t1 - 0.22, Pp.t1 + 0.22, tau) : 0;
        if (pj !== f.sfxM && tau < f.tD) { f.sfxM = pj; if (pj > 0) H.X.sfx.whoosh(); if (P.m === 'X') { H.X.sfx.hum(); } }
        const sub = Math.max(1, Math.ceil(dt / (1 / 45))), h2 = dt / sub;
        for (let i = 0; i < NF; i++) { const b = fx.born[i]; if (b < 0) continue; const age = t - b;
          if (tau > f.tD + fx.dd[i]) {   // losing speed, drifting up a little, dissolving
            const dr = Math.exp(-dt * 3.2); fx.vx[i] *= dr; fx.vy[i] *= dr; fx.vz[i] = fx.vz[i] * dr + dt * 0.5; fx.x[i] += fx.vx[i] * dt; fx.y[i] += fx.vy[i] * dt; fx.z[i] += fx.vz[i] * dt;
            if (tau - f.tD - fx.dd[i] > 0.5 && (i % 5 === 0) && Math.random() < 0.5 * H.Q()) { H.P({ kind: 'spark', x: fx.x[i], y: fx.y[i] - fx.z[i], vx: (Math.random() - 0.5) * 0.6, vy: -0.4 - Math.random() * 0.4, life: 0.6, max: 0.6, size: 1.4, color: Math.random() < 0.5 ? MINT : LEAF }); }
            continue; }
          // the target: this phase, blended into the next (and out of the last) round the boundaries
          target(P, i, tau, t); let X = tg[0], Y = tg[1], Z = tg[2], om = OM_OF[P.m];
          if (wB > 0) { target(Pn, i, tau, t); X = lerp(X, tg[0], wB); Y = lerp(Y, tg[1], wB); Z = lerp(Z, tg[2], wB); om = lerp(om, OM_OF[Pn.m], wB); }
          else if (wA > 0) { target(Pp, i, tau, t); X = lerp(X, tg[0], wA); Y = lerp(Y, tg[1], wA); Z = lerp(Z, tg[2], wA); om = lerp(om, OM_OF[Pp.m], wA); }
          om = 2 + (om - 2) * sst(0, 0.55, age); const om2 = om * om, dmp = 2 * 0.78 * om;
          for (let q = 0; q < sub; q++) { fx.vx[i] += ((X - fx.x[i]) * om2 - fx.vx[i] * dmp) * h2; fx.vy[i] += ((Y - fx.y[i]) * om2 - fx.vy[i] * dmp) * h2; fx.vz[i] += ((Z - fx.z[i]) * om2 - fx.vz[i] * dmp) * h2; fx.x[i] += fx.vx[i] * h2; fx.y[i] += fx.vy[i] * h2; fx.z[i] += fx.vz[i] * h2; }
          if (fx.z[i] < 0.12) { fx.z[i] = 0.12; if (fx.vz[i] < 0) fx.vz[i] *= -0.3; } }
        // the volumes: the streams' centre lines mark every monster they sweep (one mark a stream)
        const PV = wB > 0.5 ? Pn : P;
        if (tau < f.tD && VOL_OF[PV.m] > 0 && tau > 0.45) { const nS = NS_OF[PV.m], rv = VOL_OF[PV.m] * F.K, L = LAG_OF[PV.m], mons = H.living();
          if (mons.length) for (let kk = 0; kk < nS; kk++) for (let j = 0; j < 8; j++) { pathAt(F, PV, kk, tau - j / 7 * L, o1); if (o1[2] > 2.2) continue; for (const m of mons) { const dx = m.x - o1[0], dy = m.y - o1[1], rr = rv + (m.r || 0.4); if (dx * dx + dy * dy < rr * rr) { const e = f.touch.get(m) || 0, bit = 1 << kk; if (!(e & bit)) f.touch.set(m, e | bit); } } } }
        // the fixed tick (game time): one hit a monster, by the share of the swarm that touched it
        while (t >= f.nextTick) { f.nextTick += DATA.tick; f.ticks++; const nS = NS_OF[PV.m];
          for (const [m, bits] of f.touch) { if (m.dead) continue; let n = 0; for (let b = bits; b; b >>= 1) n += b & 1; const share = Math.min(1, n / nS); H.X.hitMon(m, TICKD * (0.65 + 0.35 * share), C.dmgO({ kb: 0.6 })); f.hits++; if (Math.random() < 0.7 * H.Q()) H.X.sparks(m.x, m.y - 0.3, PALE, 3, 4); }
          f.touch.clear(); if (tau > f.tD + 0.2) f.nextTick = 1e9; }
        // the cutting pass: one pulse a monster as the crescent's front crosses it
        if (P.m === 'X' && !f.dead) { const hd = xHead(F, P, tau), W = (tier === 3 ? 2.3 : tier === 2 ? 1.9 : 1.6) * F.K + 0.3, front = hd[2] - 0.6 * F.K;
          if (front > -2.6 * F.K) for (const m of H.living()) { if (f.passHit.has(m)) continue; const rx = m.x - F.cx, ry = m.y - F.cy, al = rx * F.dx + ry * F.dy, of = -rx * F.dy + ry * F.dx, back = (of * of) / (W * W) * 0.9 * F.K;
            if (Math.abs(of) < W + (m.r || 0.4) && al < front - back + (m.r || 0.4) && al > front - back - 2.2) { f.passHit.add(m); f.passN++; H.X.hitMon(m, PASSD, C.dmgO({ kb: 2.5, stun: 0.3 })); if (!m.boss) H.push(m, m.x - F.dx, m.y - F.dy, 0.5); H.X.sparks(m.x, m.y - 0.4, PALE, 6, 6); H.X.light(m.x, m.y, 1.2, 0.15);
              if (!f.boomed) { f.boomed = 1; H.X.shake(6, 0.2); H.X.hitstop(0.04); H.X.sfx.crash(); } } } }
        if (!f.dissolveSfx && tau > f.tD) { f.dissolveSfx = 1; H.X.sfx.sparkle(); }
        // floor dust under the stream heads
        if (tau > 0.5 && tau < f.tD && Math.random() < dt * 14 * H.Q()) { const i = (Math.random() * NF) | 0; if (fx.born[i] >= 0 && fx.z[i] < 0.9) H.P({ kind: 'petal', x: fx.x[i] + (Math.random() - 0.5) * 0.5, y: fx.y[i], vx: fx.vx[i] * 0.25, vy: fx.vy[i] * 0.25 - 0.3, life: 0.7, max: 0.7, size: 2.2, rot: Math.random() * TAU, vr: 7, drag: 1.5, color: Math.random() < 0.5 ? LEAF : MINT }); }
      },
      drawUnder(c, f, X, Y, T) {
        const t = f.t, Xa = H.sx(f.ax), Ya = H.sy(f.ay), pre = sst(0, A0, t), fan = sst(A0, A0 + 0.4, t) * (1 - sst(TT, TT + PEEL + 0.2, t)), endK = Math.min(1, f.life / 0.35);
        c.save(); c.globalCompositeOperation = 'lighter';
        if (t < TT + 0.5) { const r = T * lerp(2.4, 1.05, H.ease.out(cl(t / (A0 + 0.25)))), a = (pre * (1 - sst(A0 + 0.2, TT + 0.4, t)) * 0.5 + fan * 0.18) * endK; if (a > 0.01) { c.globalAlpha = a; c.drawImage(ringSpr(), Xa - r, Ya - r * 0.55, r * 2, r * 1.1); } }
        // floor light under the stream heads (light only), and the final pass's pressure front
        const tau = t - TT;
        if (tau > 0 && tau < f.tD + 0.4) { const stp = Math.max(1, Math.round(f.NF / 24)), g0 = glowSprite(MINT), al = 0.13 * Math.min(1, tau / 0.5) * (1 - sst(f.tD, f.tD + 0.4, tau));
          for (let i = 0; i < f.NF; i += stp) { if (fx.born[i] < 0) continue; const z = fx.z[i], a = al * (1 - cl(z / 2)); if (a < 0.01) continue; const Xf = H.sx(fx.x[i]), Yf = H.sy(fx.y[i]), r = T * (0.5 + 0.2 * z); c.globalAlpha = a; c.drawImage(g0, Xf - r, Yf - r * 0.5, r * 2, r); } }
        const P = PL.ph[PL.ph.length - 1]; if (tau > P.t0 + 0.12 && tau < P.t1 + 0.35) { const hd = xHead(F, P, tau), W = (tier === 3 ? 2.3 : tier === 2 ? 1.9 : 1.6) * F.K, u = cl((tau - P.t0 - 0.12) / 0.2) * (1 - cl((tau - P.t1) / 0.35)), Hx = H.sx(hd[0]), Hy = H.sy(hd[1]);
          c.globalAlpha = 0.5 * u; c.translate(Hx, Hy); c.scale(1, H.GY); c.rotate(Math.atan2(F.dy, F.dx)); c.drawImage(ringSpr(), -W * T * 0.55, -W * T * 1.1, W * T * 0.9, W * T * 2.2); }
        c.restore();
        // contact shadows: the fan (high: faint and wide) and the swarm (a few soft blots)
        c.save(); if (fan > 0.01) { c.globalAlpha = 0.28 * fan * endK; const w = T * (1.6 + tier * 0.9); c.drawImage(shadeSpr(), Xa - w, Ya - w * 0.22, w * 2, w * 0.44); }
        if (tau > 0 && tau < f.tD + 0.6) { const stp = Math.max(1, Math.round(f.NF / 30)), sh = shadeSpr(), al = 0.16 * Math.min(1, tau / 0.4) * (1 - sst(f.tD, f.tD + 0.6, tau));
          for (let i = 0; i < f.NF; i += stp) { if (fx.born[i] < 0) continue; const z = fx.z[i], a = al * (1 - cl(z / 2.5)); if (a < 0.01) continue; const r = T * (0.45 + 0.15 * z); c.globalAlpha = a; c.drawImage(sh, H.sx(fx.x[i]) - r, H.sy(fx.y[i]) - r * 0.4, r * 2, r * 0.8); } }
        c.restore();
      },
      draw(c, f, X, Y, T) {
        const t = f.t, pxk = c.getTransform().a || 1, pb = petBox(T);
        if (setScale(T * pxk)) { want([['h', 0], ...[0, 1, 2, 3, 4, 5].map(v => ['f', v])], true); want(needS, true); }
        const endK = Math.min(1, f.life / 0.35);
        // the swords
        if (t > A0 && t < TT + PEEL + 0.25) { for (const s of ord) { if (t < s.tA) continue; swordPose(s, t, T); drawSword(c, s, t, T, pb, endK * (f.dead ? Math.min(1, f.life / 0.35) : 1)); } }
        // the wind round the fan while it forms: thin pale ribbons spiralling in to the slots
        if (t > A0 * 0.4 && t < A0 + ASM + 0.2) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; const X0 = H.sx(f.ax), Y0 = H.sy(f.ay) - T * 0.58, a0 = sst(A0 * 0.4, A0 + 0.15, t) * (1 - sst(A0 + ASM - 0.25, A0 + ASM + 0.2, t));
          for (let j = 0; j < 4 + tier; j++) { const b0 = j / (4 + tier) * TAU + t * 2.4, r0 = T * (2.6 + tier * 0.7) * (1 - fr(t * 0.9 + j * 0.37) * 0.6); c.beginPath(); for (let q = 0; q <= 10; q++) { const v = q / 10, b = b0 + v * 1.4, r = r0 * (1 - v * 0.35); const x = X0 + Math.cos(b) * r, y = Y0 + Math.sin(b) * r * 0.8; q ? c.lineTo(x, y) : c.moveTo(x, y); }
            c.globalAlpha = 0.1 * a0; c.strokeStyle = MINT; c.lineWidth = T * 0.06; c.stroke(); c.globalAlpha = 0.24 * a0; c.strokeStyle = PALE; c.lineWidth = T * 0.016; c.stroke(); } c.restore(); }
        const tau = t - TT; if (tau < 0) return;
        drawSwarm(c, f, t, tau, T, pb);
      } }));

    // ---- a sword: its baked picture (cut by the reveal and the peel), the reveal's front, the glint, shimmer and seams ----
    function drawSword(c, s, t, T, pb, k0) {
      const L = s.L, ucut = t > s.tP ? 1 - cl((t - s.tP) / PEEL) : 1, urev = H.ease.out(cl(s.a / 0.85)); if (ucut <= 0.001) return;
      const al = sst(0, 0.3, s.a) * nearPet(s.X + Math.cos(s.th) * L * 0.3, s.Y + Math.sin(s.th) * L * 0.3, T, pb) * k0 * (s.ti ? 1 - s.ti * 0.04 : 1); if (al < 0.01) return;
      const b = ((Math.round(s.th / TAU * NB) % NB) + NB) % NB; let spr = BK.sw[b]; if (!spr) for (let d = 1; d < NB / 2 && !spr; d++) spr = BK.sw[(b + d) % NB] || BK.sw[(b - d + NB) % NB];
      c.save(); c.translate(s.X, s.Y); c.rotate(s.th); const lim = Math.min(urev, ucut);
      if (lim < 0.999) { c.beginPath(); c.rect(-L * 0.05, -L * 0.2, L * (lim + 0.05), L * 0.4); c.clip(); }
      c.globalAlpha = al;
      if (spr) { const kk = L / BK.S; c.save(); c.rotate(-spr.th); c.drawImage(spr.cv, -spr.ox * kk, -spr.oy * kk, spr.cv.width * kk, spr.cv.height * kk); c.restore(); }
      else { c.fillStyle = '#9FB5B0'; c.beginPath(); c.moveTo(L * 0.29, -L * 0.028); c.quadraticCurveTo(L * 0.7, -L * 0.02, L, L * 0.045); c.lineTo(L * 0.29, L * 0.028); c.fill(); c.fillStyle = '#1B2823'; c.fillRect(0, -L * 0.02, L * 0.27, L * 0.04); c.fillStyle = '#2E3A36'; c.fillRect(L * 0.27, -L * 0.064, L * 0.02, L * 0.128); }
      c.globalCompositeOperation = 'lighter';
      // the reveal's front: a bright point travelling out along the sword
      if (urev < 1 && s.a > 0) { const u = urev, y = cen(u) * L; c.globalAlpha = 0.7 * al * (s.ti ? 0.75 : 1); const r = T * 0.24; c.drawImage(starSpr(), u * L - r, y - r, r * 2, r * 2); }
      if (s.a >= 1 && t - s.tA < 0.55) { const u = 1 - (t - s.tA - 0.3) / 0.25, r = T * 0.3 * (1 - u * 0.5); c.globalAlpha = al * cl(u) * (s.ti ? 0.5 : 0.8); c.drawImage(starSpr(), L - r, cen(1) * L - r, r * 2, r * 2); }
      // the hold: a pale glint runs down the edge (guard -> tip)
      const gT = DATA.SHIM - 0.3 + (s.seed / TAU) * 0.12, gu = (t - gT) / 0.28; if (gu > 0 && gu < 1) { const u = lerp(0.32, 0.98, H.ease.io(gu)), s2 = (u - TS1) / (1 - TS1), ve = bladeEdges(s2)[0] + cen(u), r = T * 0.17; c.globalAlpha = al * Math.sin(gu * Math.PI) * (s.ti ? 0.5 : 0.85); c.drawImage(starSpr(), u * L - r, ve * L - r, r * 2, r * 2); }
      // a bright highlight sliding along the cutting bevel while the sword is whole
      if (s.a >= 0.6 && t < s.tP) { const p = fr(t * 0.75 + s.seed / TAU), u = lerp(0.33, 0.97, p), s2 = (u - TS1) / (1 - TS1), be2 = bladeEdges(s2), ve = (be2[0] + be2[2] * 0.12 + cen(u)) * L, ln = L * 0.24, wd = Math.max(2, L * 0.03); c.globalAlpha = al * 0.75 * Math.sin(Math.PI * p) * sst(0.6, 1, s.a); c.drawImage(shimSpr(), u * L - ln / 2, ve - wd / 2, ln, wd); }
      // the shimmer (grip -> tip) and the seams it leaves
      const su = (t - DATA.SHIM - s.ti * 0.03) / 0.26;
      if (su > 0) { const ss = Math.min(1.15, su), ln = L * 0.34, wd = L * 0.13; if (su < 1.3) { c.globalAlpha = al * 0.75 * (1 - sst(1, 1.3, su)); c.drawImage(shimSpr(), ss * L - ln / 2, cen(Math.min(1, ss)) * L - wd / 2, ln, wd); }
        // (the seams in two batched strokes a sword: the lit ones, and the hot ones about to peel)
        const seams = hot => { c.beginPath(); let n = 0; for (let j = 1; j < 10; j++) { const u = j / 10; if (u > ss - 0.08 || u > ucut + 0.001) continue; if (hot !== (t > s.tP && u > ucut - 0.16)) continue; const half = (u >= TS1 ? bladeEdges((u - TS1) / (1 - TS1))[2] * 0.42 : 0.026) * L, y = cen(u) * L; c.moveTo(u * L, y - half); c.lineTo(u * L, y + half); n++; } return n; };
        c.lineCap = 'round'; c.strokeStyle = PALE;
        if (seams(false)) { c.globalAlpha = al * 0.55 * cl((ss - 0.1) * 4); c.lineWidth = Math.max(1, T * 0.03); c.stroke(); }
        if (seams(true)) { c.globalAlpha = al * 0.35; c.strokeStyle = MINT; c.lineWidth = Math.max(2, T * 0.09); c.stroke(); c.globalAlpha = al * 0.95; c.strokeStyle = PALE; c.lineWidth = Math.max(1, T * 0.035); c.stroke(); }
        // the cut: where the segments are peeling, a soft mint point
        if (t > s.tP && ucut > 0.02) { const r = T * 0.3; c.globalAlpha = al * 0.7; c.drawImage(glowSprite(MINT), ucut * L - r, cen(ucut) * L - r, r * 2, r * 2); } }
      c.restore(); }

    // ---- the swarm: stream ribbons, the flowers (shards morphing in), glints, motes ----
    function drawSwarm(c, f, t, tau, T, pb) {
      const pj = phaseAt(tau), P = PL.ph[pj], Pn = PL.ph[pj + 1], wB = Pn ? sst(P.t1 - 0.22, P.t1 + 0.22, tau) : 0, fade = 1 - sst(f.tD, f.tD + 0.5, tau);
      // the currents: a soft ribbon along each stream's centre line, tapered and feathered at both ends
      if (fade > 0.01 && tau > 0.35) { c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
        const ribs = (Q, w) => { if (w < 0.02 || Q.m === 'C') return; const nS = Q.m === 'X' ? 0 : NS_OF[Q.m], L = LAG_OF[Q.m], NL = 11;
          for (let kk = 0; kk < nS; kk++) { const pts = []; for (let j = 0; j < NL; j++) { pathAt(F, Q, kk, tau - j / (NL - 1) * L * 1.15, o1); pts.push([H.sx(o1[0]), H.sy(o1[1]) - o1[2] * T]); }
            for (let j = 1; j < NL; j++) { const u = j / (NL - 1), tp = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.1)), 0.7); c.beginPath(); c.moveTo(pts[j - 1][0], pts[j - 1][1]); c.lineTo(pts[j][0], pts[j][1]);
              c.globalAlpha = 0.16 * w * fade * tp * H.Q(); c.strokeStyle = MINT; c.lineWidth = T * (0.42 - 0.12 * nS / 6); c.stroke(); c.globalAlpha = 0.42 * w * fade * tp; c.strokeStyle = PALE; c.lineWidth = Math.max(1, T * 0.035); c.stroke(); } } };
        ribs(P, 1 - wB); if (Pn) ribs(Pn, wB);
        // the cutting pass: thin white streaks along the crescent
        const PX = PL.ph[PL.ph.length - 1]; if (tau > PX.t0 + 0.1 && tau < PX.t1 + 0.3) { const hd = xHead(F, PX, tau), W = (tier === 3 ? 2.3 : tier === 2 ? 1.9 : 1.6) * F.K, a = cl((tau - PX.t0 - 0.1) / 0.15) * (1 - cl((tau - PX.t1) / 0.3));
          for (let j = 0; j < 7; j++) { const l = (j / 6 - 0.5) * 2, bk = l * l * 0.9 * F.K, x0 = hd[0] - F.dy * l * W - F.dx * bk, y0 = hd[1] + F.dx * l * W - F.dy * bk, len = (1.6 + (j % 3) * 0.5) * F.K;
            c.beginPath(); c.moveTo(H.sx(x0), H.sy(y0) - T * 0.6); c.lineTo(H.sx(x0 - F.dx * len), H.sy(y0 - F.dy * len) - T * 0.6); c.globalAlpha = 0.55 * a; c.strokeStyle = PALE; c.lineWidth = Math.max(1, T * 0.03); c.stroke(); c.globalAlpha = 0.18 * a; c.strokeStyle = MINT; c.lineWidth = T * 0.16; c.stroke(); } }
        c.restore(); }
      // the flowers
      const CS = BK.CS, Rd = 0.15 * T, sh = BK.sh, gl = [];
      for (let i = 0; i < f.NF; i++) { const b = fx.born[i]; if (b < 0) continue; const age = t - b, dz = tau - f.tD - fx.dd[i];
        if (dz > 0.62) continue; const Xf = H.sx(fx.x[i]), Yf = H.sy(fx.y[i]) - fx.z[i] * T; let a = nearPet(Xf, Yf, T, pb), sc = fx.sz[i];
        if (dz > 0) { const u = dz / 0.62; a *= 1 - u * u; sc *= 1 - 0.65 * u; }
        // a shard first, morphing into the flower
        const m = cl(age / 0.2);
        if (m < 1 && sh[fx.sb[i]]) { const sp = sh[fx.sb[i]][((Math.round((fx.ang[i] + age * 9 * (i % 2 ? 1 : -1)) / TAU * NSH) % NSH) + NSH) % NSH]; if (sp) { const kk = T * SL / BK.S, w = sp.width * kk; c.globalAlpha = a * (1 - m); c.drawImage(sp, Xf - w / 2, Yf - w / 2, w, w); } }
        const at = BK.fl[fx.var[i]] || BK.fl[fx.var[i] ^ 1] || BK.fl[0] || BK.fl[2] || BK.fl[4]; if (!at) { if (m >= 1) { c.globalAlpha = a; c.fillStyle = FL_COL[(fx.var[i] / 2) | 0]; c.fillRect(Xf - Rd * 0.5, Yf - Rd * 0.5, Rd, Rd); } continue; }
        const ti = Math.min(NT - 1, Math.floor(NT * (0.5 + 0.5 * Math.sin(fx.tw[i] * t + fx.tp[i])))), hd = Math.atan2(fx.vy[i] * 0.55 - fx.vz[i], fx.vx[i]), ai = ((Math.round(hd / TAU * NA) % NA) + NA) % NA, si = Math.floor(fr(fx.spP[i] + fx.spW[i] * t) * NSP) % NSP;
        const d = Rd * 2 * sc * (0.35 + 0.65 * m) * (CS / (BK.R * 2)); c.globalAlpha = a * (0.3 + 0.7 * m); c.drawImage(at, (ai * NSP + si) * CS, ti * CS, CS, CS, Xf - d / 2, Yf - d / 2, d, d);
        if (m < 1 || dz > 0) gl.push(i); else if (Math.sin(fx.gl[i] + t * 5.3) > 1 - 0.035 * H.Q()) gl.push(i); }
      // the glints (an edge catching the light), the births' mint flashes, the dissolving motes
      if (gl.length) { c.save(); c.globalCompositeOperation = 'lighter'; const st = starSpr(), gm = glowSprite(MINT), gp = glowSprite(LEAF);
        for (const i of gl) { const age = t - fx.born[i], dz = tau - f.tD - fx.dd[i], Xf = H.sx(fx.x[i]), Yf = H.sy(fx.y[i]) - fx.z[i] * T, a = nearPet(Xf, Yf, T, pb);
          if (age < 0.2) { if (i & 1) continue; const r = T * 0.28 * (1 - age / 0.2 * 0.5); c.globalAlpha = a * 0.32 * (1 - age / 0.2); c.drawImage(gm, Xf - r, Yf - r, r * 2, r * 2); }
          else if (dz > 0) { if (i % 3) continue; const u = dz / 0.62, r = T * (0.14 + 0.1 * u); c.globalAlpha = a * 0.9 * Math.sin(Math.PI * Math.min(1, u * 1.2)); c.drawImage(gp, Xf - r, Yf - r, r * 2, r * 2); }
          else { const g2 = (Math.sin(fx.gl[i] + t * 5.3) - (1 - 0.035)) / 0.035, r = T * 0.2; c.globalAlpha = a * cl(g2) * 0.85; c.drawImage(st, Xf - r, Yf - r - T * 0.02, r * 2, r * 2); } }
        c.restore(); } }
  };
  U.thousandblades.data = DATA;
  /* a floor that starts with 1000 Blades in a kit bakes its swords, shards and flowers in idle time */
  U.thousandblades.warm = o => {
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const px = Math.min(2, Math.max(1, (typeof arc !== 'undefined' && arc.dpr) || 1)); setScale(T * px); want(allKeys()); idleBake(); }, 350);
  };
  U.thousandblades.__dbg = { BK, bakeStep, setScale, want, allKeys, swordPix, plan, DATA };
})();
