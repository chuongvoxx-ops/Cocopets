/* ---------- Ice, reworked: Ultimates 4-5 (absolutezero, glacialonslaught) ----------
   Absolute Zero: a giant horizontal crystal forms in the air above where the pet stood (it stays there, the pet may
   walk away or under it, where it fades to a ghost), lying along the aim inside
   rotating rings of ice; particles stream into its pointed tip as its internal light swells, then it fires a massive
   frost beam down the aim with spiralling ribbons, tumbling shards and freezing mist. Level 1: one crystal and a focused
   beam. Adept: three rings tumble round it, align into a barrel and shape a wider beam with two frost ribbons. Celestial:
   five elongated segments fly together into one enormous lance, five rings align one after another and a colossal beam
   leaves wrapped in three intertwining streams of ice. The crystal cracks with light and breaks into glitter at the end.
   Glacial Onslaught: huge pointed crystals form in a rack hovering behind and above the pet, tilt toward the monsters and
   launch in staggered waves, each spinning round its long axis (its six facets turning through the light) and trailing
   blue light and snow; on impact cracks light up inside it before it bursts into a forward fan of shards. Level 1: three.
   Adept: five in a spreading formation. Celestial: nine in three hovering rows, firing in accelerating volleys with
   braided trails, each impact an expanding ring of frost and glittering fragments.
   Both are drawn with prism(): a six-sided faceted crystal seen side-on whose facets are lit by their real normals as it
   turns, translucent (the back facets show through the front ones), lit from inside, with glowing fractures, white
   ridges and a cyan rim. Flat fills only (no gradients per frame); the glows are cached sprites. */
(() => {
  const U = ELEM_IMPL.ice.ult, TAU = Math.PI * 2;
  let H, K, P, TONES = null;
  const cl = u => Math.max(0, Math.min(1, u)), lerp = (a, b, u) => a + (b - a) * u;
  const sm = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const eo = u => 1 - (1 - u) * (1 - u), eio = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
  const back = u => { const s = 1.5; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const angLerp = (a, b, u) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return a + d * u; };
  /* a screen point back to the world (particles live in world units; height folds into y) */
  const toW = (X, Y, T) => [H.me.x + (X - H.sx(H.me.x)) / T, H.me.y + (Y - H.sy(H.me.y)) / T];
  /* the light: from the upper left, a little in front (screen x right, y down, z toward the viewer) */
  const LV = (() => { const v = [-0.4, -0.85, 0.36], l = Math.hypot(v[0], v[1], v[2]); return v.map(x => x / l); })();
  const init = () => { if (!TONES) TONES = [P.abyss, P.deep, P.deep, P.blue, P.blue, P.ice, P.pale, P.frost, P.white]; };
  const tone = b => TONES[Math.max(0, Math.min(8, Math.round((b + 0.75) * 4.6)))];

  /* the glowing fractures inside a crystal, by seed: lines of [u along, r out from the axis, psi round it] */
  const fracCache = new Map();
  function fracs(seed) { const k = Math.abs(Math.round(seed * 3)) % 12; let F = fracCache.get(k); if (F) return F; F = [];
    for (let i = 0; i < 4; i++) { const u0 = 0.12 + 0.62 * R1(k * 5 + i * 1.7), psi = R1(k * 3 + i * 2.3) * TAU, pts = []; let r = 0.15 + 0.3 * R1(k + i * 7);
      for (let j = 0; j < 4; j++) { pts.push([u0 + j * (0.06 + 0.05 * R1(k * 9 + i + j)), Math.min(0.78, r), psi + (R1(k + i * 4 + j * 11) - 0.5) * 0.9]); r += (R1(k * 2 + j + i * 5) - 0.35) * 0.3; }
      F.push(pts); }
    fracCache.set(k, F); return F; }
  const LAT = new Float32Array(8);
  /* a faceted ice crystal lying along screen angle ang: centre (x, y) px, L long, W its half-thickness; six facets round
     its long axis, turned by spin. o: tf / tb the front / back taper (fractions of L), glow its internal light 0..1,
     crack 0..1 (bright cracks racing through it), seed, t (a lavender glint sliding along it) */
  function prism(c, x, y, ang, L, W, spin, a, o) {
    if (!(a > 0.01) || L < 2 || W < 0.5) return; o = o || {};
    const tf = o.tf == null ? 0.36 : o.tf, tb = o.tb == null ? 0.16 : o.tb, N = 6, sd = o.seed || 0, gl = o.glow == null ? 0.4 : o.glow, ck = o.crack || 0;
    const dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, nL = nx * LV[0] + ny * LV[1];
    const Bx = x - dx * L / 2, By = y - dy * L / 2, Fx = x + dx * L / 2, Fy = y + dy * L / 2;
    const A0x = Bx + dx * L * tb, A0y = By + dy * L * tb, A1x = Bx + dx * L * (1 - tf), A1y = By + dy * L * (1 - tf);
    for (let i = 0; i < N; i++) { const th = i / N * TAU + spin, r = 1 + (R1(sd * 7.1 + i * 1.3) - 0.5) * 0.26; LAT[i] = Math.sin(th) * W * r; }
    const face = i => { const j = (i + 1) % N; c.beginPath(); c.moveTo(Bx, By); c.lineTo(A0x + nx * LAT[i], A0y + ny * LAT[i]); c.lineTo(A1x + nx * LAT[i], A1y + ny * LAT[i]); c.lineTo(Fx, Fy); c.lineTo(A1x + nx * LAT[j], A1y + ny * LAT[j]); c.lineTo(A0x + nx * LAT[j], A0y + ny * LAT[j]); c.closePath(); };
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    // a soft halo round it, then the far facets, seen through the ice: deep and faint
    K.glow(c, x, y, L * 0.62, P.blue, 0.3 * a);
    for (let i = 0; i < N; i++) { const ph = (i + 0.5) / N * TAU + spin; if (Math.cos(ph) > 0) continue; face(i); c.globalAlpha = 0.55 * a; c.fillStyle = (i & 1) ? P.abyss : P.deep; c.fill(); }
    // the light inside: a glowing core along the axis (seen through the near facets)
    c.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { const u = 0.3 + k * 0.2; K.glow(c, Bx + dx * L * u, By + dy * L * u, W * (1.5 + gl), k === 1 ? P.cyan : P.blue, (0.22 + 0.45 * gl) * a); }
    c.globalAlpha = (0.12 + 0.4 * gl) * a; c.strokeStyle = P.cyan; c.lineWidth = Math.max(1, W * 0.3); c.beginPath(); c.moveTo(A0x, A0y); c.lineTo(Fx - dx * L * tf * 0.35, Fy - dy * L * tf * 0.35); c.stroke();
    c.globalAlpha = 0.7 * gl * a; c.strokeStyle = P.white; c.lineWidth = Math.max(0.8, W * 0.07); c.stroke();
    c.globalCompositeOperation = 'source-over';
    // the near facets, each lit by its own normal as the crystal turns
    for (let i = 0; i < N; i++) { const ph = (i + 0.5) / N * TAU + spin, cz = Math.cos(ph); if (cz <= 0) continue; const b = Math.sin(ph) * nL + cz * LV[2];
      face(i); c.globalAlpha = (0.58 + 0.3 * cl(b)) * a; c.fillStyle = tone(b); c.fill();
      if (b > 0.55) { const j = (i + 1) % N, m0 = (LAT[i] + LAT[j]) / 2; c.globalCompositeOperation = 'lighter'; c.globalAlpha = (b - 0.55) * 1.4 * a; c.strokeStyle = P.white; c.lineWidth = Math.max(1, W * 0.12); c.beginPath(); c.moveTo(A0x + nx * m0 + dx * L * 0.03, A0y + ny * m0 + dy * L * 0.03); c.lineTo(A1x + nx * m0, A1y + ny * m0); c.stroke(); c.globalCompositeOperation = 'source-over'; } }
    // glowing fractures, and the cracks of light racing through it at the end
    c.globalCompositeOperation = 'lighter';
    const prof = u => (u < tb ? u / tb : u > 1 - tf ? (1 - u) / tf : 1), PT = (u, r, ps) => { const v = Math.sin(ps + spin) * r * W * prof(u); return [Bx + dx * L * u + nx * v, By + dy * L * u + ny * v]; };
    const F = fracs(sd); c.strokeStyle = ck > 0.05 ? P.white : P.cyan; c.lineWidth = Math.max(0.8, W * (0.07 + 0.1 * ck)); c.globalAlpha = (0.5 + 0.5 * gl + ck) * 0.8 * a;
    c.beginPath(); for (const ln of F) for (let j = 0; j < ln.length; j++) { const p = PT(ln[j][0], ln[j][1], ln[j][2]); j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    if (ck > 0.02) { c.globalAlpha = ck * a; c.strokeStyle = P.white; c.lineWidth = Math.max(1, W * 0.12); c.beginPath(); const nC = 5;
      for (let i = 0; i < nC; i++) { const ps = i * 2.4 + sd, u0 = 0.5 + (R1(sd + i) - 0.5) * 0.3, reach = 0.45 * cl(ck * 1.6 - i * 0.12); if (reach <= 0) continue; let p = PT(u0, 0, ps); c.moveTo(p[0], p[1]);
        for (let j = 1; j <= 4; j++) { const s = (i % 2 ? 1 : -1), u = u0 + s * reach * j / 4, r = 0.25 + 0.5 * R1(sd * 3 + i * 5 + j); p = PT(cl(u), r, ps + (j % 2 ? 0.6 : -0.6)); c.lineTo(p[0], p[1]); } }
      c.stroke(); K.glow(c, x, y, W * 3 * (0.5 + ck), P.white, 0.45 * ck * a); }
    // a fine deep outline for definition, the ridges white where two near facets meet, the cyan rim round the silhouette
    c.globalCompositeOperation = 'source-over'; c.globalAlpha = 0.55 * a; c.strokeStyle = P.abyss; c.lineWidth = Math.max(1, W * 0.12); c.beginPath(); { let mx = 0, mn = 0; for (let i = 1; i < N; i++) { if (LAT[i] > LAT[mx]) mx = i; if (LAT[i] < LAT[mn]) mn = i; } c.moveTo(Bx, By); c.lineTo(A0x + nx * LAT[mx], A0y + ny * LAT[mx]); c.lineTo(A1x + nx * LAT[mx], A1y + ny * LAT[mx]); c.lineTo(Fx, Fy); c.lineTo(A1x + nx * LAT[mn], A1y + ny * LAT[mn]); c.lineTo(A0x + nx * LAT[mn], A0y + ny * LAT[mn]); c.closePath(); } c.stroke(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < N; i++) { const pPrev = Math.cos((i - 0.5) / N * TAU + spin) > 0, pNext = Math.cos((i + 0.5) / N * TAU + spin) > 0; if (!pPrev && !pNext) continue; const rim = pPrev !== pNext;
      c.globalAlpha = (rim ? 0.85 : 0.6) * a; c.strokeStyle = rim ? P.cyan : P.frost; c.lineWidth = Math.max(0.8, W * (rim ? 0.09 : 0.06));
      c.beginPath(); c.moveTo(Bx, By); c.lineTo(A0x + nx * LAT[i], A0y + ny * LAT[i]); c.lineTo(A1x + nx * LAT[i], A1y + ny * LAT[i]); c.lineTo(Fx, Fy); c.stroke(); }
    c.restore();
    // a lavender glint sliding along it, and the bright point of its tip
    if (o.t != null) { const u = ((o.t * 0.7 + sd * 0.37) % 1.5) / 1.5; if (u < 1) { const p = PT(0.1 + 0.85 * u, 0.4, 1.2); K.glow(c, p[0], p[1], W * 1.3, P.lav, 0.6 * a * Math.sin(u * Math.PI)); } }
    K.glow(c, Fx, Fy, W * (0.9 + gl), P.white, (0.3 + 0.5 * gl) * a);
  }
  /* an ice ring (one half: front or back) at (X, Y) px, radius R, its plane's normal N (screen x, y, toward the viewer),
     turned by th0: three arcs of pale ice with a cyan inner edge, glinting, each carrying a small crystal tooth */
  function iceRing3(c, X, Y, R, N, th0, a, front, seed) {
    if (!(a > 0.01) || R < 2) return;
    let ux = N[1], uy = -N[0]; const ul = Math.hypot(ux, uy); if (ul < 1e-3) { ux = 1; uy = 0; } else { ux /= ul; uy /= ul; }
    const vx = N[1] * 0 - N[2] * uy, vy = N[2] * ux - N[0] * 0, vz = N[0] * uy - N[1] * ux;   // v = N x u (u has no z)
    const w = Math.max(2, R * 0.15), pt = th => [X + R * (ux * Math.cos(th) + vx * Math.sin(th)), Y + R * (uy * Math.cos(th) + vy * Math.sin(th)), vz * Math.sin(th)];
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; const fa = front ? 1 : 0.6;
    const pass = (col, lw, al, add) => { c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = al * a * fa; c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
      for (let k = 0; k < 3; k++) { const t0 = th0 + k * TAU / 3, span = TAU / 3 * 0.9; let on = false; for (let j = 0; j <= 10; j++) { const th = t0 + span * j / 10, p = pt(th), f = p[2] >= 0; if (f === front) { on ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); on = true; } else on = false; } }
      c.stroke(); };
    pass(P.abyss, w * 1.45, 0.5, false); pass(P.blue, w * 1.15, 0.8, false); pass(P.ice, w * 0.8, 0.7, false); pass(P.pale, w * 0.42, 0.75, true); pass(P.white, Math.max(0.8, w * 0.16), 0.85, true);
    c.restore();
    // glints running round it: a bright one at each arc's head, a lavender one at its middle
    for (let k = 0; k < 3; k++) { const q = pt(th0 + k * TAU / 3 + TAU / 3 * 0.9); if ((q[2] >= 0) === front) K.glow(c, q[0], q[1], w * 2.4, P.white, 0.7 * a * fa);
      const m = pt(th0 + k * TAU / 3 + TAU / 3 * 0.45); if ((m[2] >= 0) === front) K.glow(c, m[0], m[1], w * 1.8, P.lav, 0.45 * a * fa); }
  }
  /* a tapered trail of blue light through screen points (oldest first): a wide blue haze, a cyan body, a white core */
  function lightTrail(c, pts, w, a, braid, t) {
    const n = pts.length; if (n < 2 || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    for (let i = 1; i < n; i++) { const u = i / (n - 1), ww = w * (0.2 + 0.8 * u); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]);
      c.globalAlpha = a * 0.22 * u; c.strokeStyle = P.blue; c.lineWidth = ww * 2.4; c.stroke(); c.globalAlpha = a * 0.55 * u; c.strokeStyle = P.cyan; c.lineWidth = ww; c.stroke(); c.globalAlpha = a * 0.9 * u; c.strokeStyle = P.white; c.lineWidth = Math.max(0.6, ww * 0.3); c.stroke(); }
    if (braid) for (let b = 0; b < 2; b++) { c.strokeStyle = b ? P.lav : P.pale; c.lineWidth = Math.max(1, w * 0.18); c.beginPath();
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)], ex = q[0] - r[0], ey = q[1] - r[1], el = Math.hypot(ex, ey) || 1, u = i / (n - 1), o = Math.sin(i * 1.1 - t * 22 + b * Math.PI) * w * 0.9 * u; const X = p[0] - ey / el * o, Y = p[1] + ex / el * o; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }
      c.globalAlpha = a * 0.85; c.stroke(); }
    c.restore();
  }

  /* ================= 4. Absolute Zero ================= */
  U.absolutezero = (C, h) => { H = h; K = IK.bind(H); P = K.P; init();
    const me = H.me, X0 = me.x, Y0 = me.y, ev = K.evo(C), a0 = C.a, ux = Math.cos(a0), uy = Math.sin(a0), qx = -uy, qy = ux;
    const NR = [0, 0, 1, 3, 3, 4, 5][ev - 1], NB = [0, 0, 1, 2, 2, 2, 3][ev - 1], SEG = ev >= 7 ? 5 : 0;
    const LC = [2.9, 3.0, 3.1, 3.5, 3.6, 3.8, 4.9][ev - 1], WC = LC * 0.15, BW = [0.5, 0.55, 0.62, 0.9, 0.95, 1.05, 1.45][ev - 1];
    const D = C.base * C.K * K.evoK(C), TOT = 14 * D;
    // the timeline: the crystal forms (L7: its segments assemble), the rings align one by one, it charges, the beam, the fade
    const FORMD = SEG ? 1.25 : 0.95, AL0 = FORMD + 0.05, ALS = 0.17, CH0 = AL0 + NR * ALS + (NR ? 0.12 : 0), CHD = 0.62, FIRE = CH0 + CHD;
    const BEAMD = [1.15, 1.2, 1.25, 1.45, 1.5, 1.55, 1.8][ev - 1], OFF = FIRE + BEAMD, FADED = 0.9, END = OFF + FADED + 0.3, TICK = 0.16;
    H.X.banner('ABSOLUTE ZERO', '', C.col, 1.4); H.X.sfx.hum();
    // where it hangs (fixed relative to the pet): behind it along the aim, high enough that nothing of it (or of its
    // rings) comes over the pet; for an aim toward the viewer it moves aside so the beam passes beside the pet
    let sh = Math.abs(uy) > 0.2 ? (ux * uy >= 0 ? -1 : 1) * (uy > 0 ? 1.6 + 0.3 * LC : 1.0 + 0.2 * LC) * cl((Math.abs(uy) - 0.2) / 0.45) : 0, ox = 0, oy = 0;
    const place = () => { ox = -ux * 0.35 + qx * sh; oy = -uy * 0.35 + qy * sh; }; place();
    const dL = 2.6 + LC * 0.35 + 1.4 * cl(uy), ringR = k => WC * (NR >= 5 ? 1.3 + 0.17 * k : 1.55 + 0.12 * k), ringU = k => (NR <= 1 ? 0.8 : lerp(0.32, NR >= 5 ? 1.42 : 1.12, k / (NR - 1)));
    let Zc = 2.0, A3 = null;
    const axisFor = Z => { const vx = ux * dL - ox, vy = uy * dL - oy, vz = 0.55 - Z, l = Math.hypot(vx, vy, vz); return [vx / l, vy / l, vz / l]; };
    for (let it = 0; it < 30; it++) { A3 = axisFor(Zc); let clear = true;
      for (let k = 0; k <= 8 && clear; k++) { const u = -0.55 + k * 0.25, r = (NR && u > -0.3 ? ringR(Math.min(NR - 1, Math.max(0, Math.round((u + 0.2) * (NR - 1))))) * 0.8 : WC) + 0.12, X = ox + A3[0] * LC * u, Y = oy + A3[1] * LC * u - (Zc + A3[2] * LC * u); if (Math.abs(X) < 0.62 + r && Y > -1.3 - r && Y < 0.3 + r) clear = false; }
      if (clear) break; Zc += 0.2; if (Zc > 3.3) { Zc = 2.0; sh += (sh >= 0 ? 0.3 : -0.3) || 0.3; place(); } }
    // the lance on the screen: its axis, foreshortened (kept to at least 0.72 of its length so it always reads)
    const sdx0 = A3[0], sdy0 = A3[1] - A3[2], sl = Math.hypot(sdx0, sdy0) || 1, sdx = sdx0 / sl, sdy = sdy0 / sl, FS = Math.max(0.72, Math.min(1.15, sl));
    const rel = (x, y, z, T, PX, PY) => [PX + x * T, PY + (y - z) * T];
    // the beam's path (relative to the pet, world tiles + height): from the tip it curves down onto the aimed lane
    let R = 9; const reach = () => { let L = 0.6; while (L < 10.5 && !H.X.blocked(X0 + ux * L, Y0 + uy * L, 0.1)) L += 0.25; return L; };
    const tip3 = () => [ox + A3[0] * LC * 0.5, oy + A3[1] * LC * 0.5, Zc + A3[2] * LC * 0.5];
    let BP = null, BLEN = 1;
    const buildBeam = () => { R = Math.max(2.2, reach()); const p0 = tip3(), dM = Math.min(R, dL + 1.3), pl = [ux * dL, uy * dL, 0.55], pm = [ux * dM, uy * dM, 0.55], pts = [];
      for (let k = 0; k <= 12; k++) { const u = k / 12, a1 = (1 - u) * (1 - u), b1 = 2 * u * (1 - u), c1 = u * u; pts.push([a1 * p0[0] + b1 * pl[0] + c1 * pm[0], a1 * p0[1] + b1 * pl[1] + c1 * pm[1], a1 * p0[2] + b1 * pl[2] + c1 * pm[2]]); }
      const rest = R - dM; for (let k = 1; k <= 10 && rest > 0.05; k++) { const d = dM + rest * k / 10; pts.push([ux * d, uy * d, 0.55]); }
      let s = 0; pts[0][3] = 0; for (let k = 1; k < pts.length; k++) { s += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1], pts[k][2] - pts[k - 1][2]); pts[k][3] = s; } BP = pts; BLEN = s; };
    // a point a length s along the beam (relative 3-D), with its direction
    const beamAt = s => { const n = BP.length; let k = 1; while (k < n - 1 && BP[k][3] < s) k++; const p = BP[k - 1], q = BP[k], u = cl((s - p[3]) / Math.max(1e-4, q[3] - p[3])); return [lerp(p[0], q[0], u), lerp(p[1], q[1], u), lerp(p[2], q[2], u)]; };
    const hitBeam = (dmg, o, each) => { let n = 0; for (const m of H.living()) { const rx = m.x - X0, ry = m.y - Y0, al = rx * ux + ry * uy, of = Math.abs(-rx * uy + ry * ux); if (al > 0.15 - m.r && al < R + m.r && of < BW * 0.6 + m.r) { H.X.hitMon(m, dmg, C.dmgO(o)); n++; if (each) each(m); } } return n; };
    const NT = Math.floor((BEAMD - 0.05) / TICK) + 1, tickD = TOT * 0.82 / NT, lockD = TOT * 0.18;
    const shards = [], seams = [], aligned = new Array(NR).fill(false), segLocked = new Array(SEG).fill(false);
    let fired = false, ticks = 0, nextTick = 0, locked = false, broke = false, shardAcc = 0;
    // the pose of ring k at time t: its centre along the lance (0 back .. 1 front), radius (tiles), normal, turn
    const ringPose = (k, t) => { const al = NR ? eio(cl((t - (AL0 + k * ALS)) / 0.3)) : 1, dir = k % 2 ? 1 : -1;
      const az = k * 2.1 + t * (0.9 + 0.25 * k) * dir, el = 0.75 * Math.sin(t * 1.6 + k * 1.3), Nt = [Math.cos(el) * Math.cos(az), Math.cos(el) * Math.sin(az), Math.sin(el)];
      const Na = [sdx / 1.084, sdy / 1.084, 0.42 / 1.084], N = [lerp(Nt[0], Na[0], al), lerp(Nt[1], Na[1], al), lerp(Nt[2], Na[2], al)], nl = Math.hypot(N[0], N[1], N[2]) || 1;
      const spinR = t * (2.4 + 0.5 * k) * dir + (t > FIRE ? (t - FIRE) * 6 * dir : 0);
      return { u: lerp(0.5, ringU(k), al), r: lerp(WC * (2.0 + 0.3 * k), ringR(k), al), N: [N[0] / nl, N[1] / nl, N[2] / nl], th: spinR, al }; };
    const ringA = (k, t) => cl((t - 0.35 - k * 0.09) / 0.3) * (1 - cl((t - OFF - 0.1) / 0.65));
    // the crystal's centre on the screen and its tip
    const geo = (T, t) => { const PX = H.sx(X0), PY = H.sy(Y0), bob = Math.sin(t * 2.1) * 0.05, c0 = rel(ox, oy, Zc + bob, T, PX, PY), Ls = LC * T * FS;
      return { PX, PY, cx: c0[0], cy: c0[1], Ls, ang: Math.atan2(sdy, sdx), tx: c0[0] + sdx * Ls / 2, ty: c0[1] + sdy * Ls / 2, bob }; };
    const along = (G, u) => [G.cx + sdx * G.Ls * (u - 0.5), G.cy + sdy * G.Ls * (u - 0.5)];
    const glowAt = t => (t < CH0 ? 0.3 : t < FIRE ? lerp(0.3, 1, eio((t - CH0) / CHD)) : t < OFF ? 0.85 + 0.15 * Math.sin(t * 30) : 1 - cl((t - OFF) / 0.6) * 0.8);
    const F = H.add({ life: END,
      update(dt, f) { const t = f.t, T = H.X.Tz(), G = geo(T, t);
        if (t < OFF + 0.2) { if (Math.abs(ux) > 0.2) me.face = ux > 0 ? 1 : -1; if (t > FIRE && t < OFF) me.sq = Math.max(me.sq || 0, 0.35); }
        // frost rising off the pet into the forming crystal
        if (t < FORMD) { const w = toW(G.cx, G.cy, T); K.aura(X0, Y0, 0.55, dt, 18, 0.2); if (Math.random() < dt * 30 * H.Q()) { const b = Math.random() * TAU, rr = (LC * 0.5 + 0.6) * (0.6 + 0.4 * Math.random()), sx0 = Math.cos(b) * rr, sy0 = Math.sin(b) * rr * 0.6; H.P({ kind: Math.random() < 0.5 ? 'spark' : 'ember', x: w[0] + sx0, y: w[1] + sy0, vx: -sx0 * 2.2, vy: -sy0 * 2.2, g: 0, drag: 0.5, life: 0.4, max: 0.4, size: 2, color: Math.random() < 0.5 ? P.white : P.pale }); } }
        // L7: each segment locks into the lance with a flash
        for (let j = 0; j < SEG; j++) if (!segLocked[j] && t >= 0.32 + j * 0.13 + 0.5) { segLocked[j] = true; const p = along(G, (j + 1) / SEG), w = toW(p[0], p[1], T); seams.push({ u: (j + 1) / SEG, t }); K.glitter(w[0], w[1], 6, 4); H.X.sfx.sparkle && H.X.sfx.sparkle(); H.X.shake(2, 0.06); }
        if (SEG && !locked && t >= FORMD - 0.05) { locked = true; const w = toW(G.cx, G.cy, T); K.glitter(w[0], w[1], 14, 6); H.X.light(X0 + ox, Y0 + oy, 3, 0.25); H.X.sfx.hum(); }
        // the rings align one after another, each with a chime
        for (let k = 0; k < NR; k++) if (!aligned[k] && t >= AL0 + k * ALS + 0.3) { aligned[k] = true; const rp = ringPose(k, t), p = along(G, rp.u), w = toW(p[0], p[1], T); K.glitter(w[0], w[1], 8, 4); H.X.sfx.sparkle && H.X.sfx.sparkle(); H.X.shake(1.5, 0.05); }
        // the charge: particles pull into the pointed tip
        if (t > CH0 - 0.2 && t < FIRE) { const w = toW(G.tx, G.ty, T); if (Math.random() < dt * 50 * H.Q()) { const b = Math.random() * TAU, rr = 1.2 + Math.random() * 1.4, sx0 = Math.cos(b) * rr, sy0 = Math.sin(b) * rr * 0.75; H.P({ kind: 'spark', x: w[0] + sx0, y: w[1] + sy0, vx: -sx0 / 0.32, vy: -sy0 / 0.32, g: 0, drag: 0, life: 0.3, max: 0.3, size: 2.2, color: Math.random() < 0.3 ? P.lav : Math.random() < 0.5 ? P.white : P.cyan }); } }
        // the release
        if (!fired && t >= FIRE) { fired = true; buildBeam(); nextTick = t + 0.04; H.X.flash(0.18, P.pale); H.X.shake(ev >= 7 ? 12 : 8, 0.35); H.X.hitstop(0.05); H.X.sfx.crash(); H.X.light(X0 + ux * 2, Y0 + uy * 2, 4 + ev * 0.3, 0.4);
          const w = toW(G.tx, G.ty, T); K.glitter(w[0], w[1], 16, 7); K.snow(w[0], w[1], 10); }
        if (fired && t < OFF) {
          if (t >= nextTick && ticks < NT) { ticks++; nextTick += TICK; hitBeam(tickD, { chill: true, kb: 0.6, noText: ticks % 2 === 0 && ticks < NT }); if (ticks % 3 === 1) H.X.sfx.whoosh && H.X.sfx.whoosh(); }
          // tumbling shards down the beam and freezing mist along it
          shardAcc += dt * (14 + 6 * ev) * H.Q(); while (shardAcc >= 1) { shardAcc -= 1; shards.push({ s: 0, off: (Math.random() - 0.5) * 1.3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 16, sz: 0.5 + Math.random() * 0.6, v: 11 + Math.random() * 7, seed: Math.random() * 9 | 0 }); }
          if (Math.random() < dt * 40 * H.Q()) { const s = Math.random() * BLEN, p = beamAt(s), w = [X0 + p[0], Y0 + p[1] - p[2]]; H.P({ kind: 'ember', x: w[0] + (Math.random() - 0.5) * BW, y: w[1] + (Math.random() - 0.5) * BW * 0.6, vx: (Math.random() - 0.5) * 1.5 + ux * 1.5, vy: -0.3 - Math.random() * 0.6, g: 0.3, drag: 0.6, life: 0.9, max: 0.9, size: 2 + Math.random() * 2, color: Math.random() < 0.5 ? P.white : P.frost }); }
          if (Math.random() < dt * 14 * H.Q()) K.glitter(X0 + ux * R, Y0 + uy * R - 0.5, 2, 4); }
        for (let i = shards.length - 1; i >= 0; i--) { const s = shards[i]; s.s += s.v * dt; s.rot += s.vr * dt; if (s.s > BLEN) shards.splice(i, 1); }
        // the beam ends: the frozen line locks with a last flare, freezing what it held
        if (fired && !f._off && t >= OFF) { f._off = true; hitBeam(lockD, { freeze: ev >= 7 ? 2 : 1.5, kb: 1.5 }, m => { K.shatterAt(m.x, m.y - 0.5, 0.9); });
          H.X.shake(6, 0.2); H.X.sfx.crash(); K.snow(X0 + ux * R, Y0 + uy * R - 0.5, 10); K.fragments(X0 + ux * R, Y0 + uy * R - 0.5, 8, 5); }
        // the crystal breaks into glitter and snow
        if (!broke && t >= OFF + 0.42) { broke = true; for (let k = 0; k <= 6; k++) { const p = along(G, k / 6), w = toW(p[0], p[1], T); K.glitter(w[0], w[1], 5, 5); K.fragments(w[0], w[1], 3, 4); K.snow(w[0], w[1], 3); } H.X.sfx.crash(); }
        if (NR && t > OFF + 0.15 && t < OFF + 0.7) for (let k = 0; k < NR; k++) if (Math.random() < dt * 14 * H.Q()) { const rp = ringPose(k, t), p = along(G, rp.u), b = Math.random() * TAU, rr = rp.r * (1 + 0.6 * cl((t - OFF - 0.1) / 0.6)); H.P({ kind: 'spark', x: X0 + (p[0] - G.PX) / T + Math.cos(b) * rr, y: Y0 + (p[1] - G.PY) / T + Math.sin(b) * rr * 0.6, vx: Math.cos(b) * 1.5, vy: 0.4, g: 1.2, drag: 1, life: 0.6, max: 0.6, size: 2, color: Math.random() < 0.5 ? P.white : P.pale }); } },
      drawUnder(c, f, X, Y, T) { const t = f.t, G = geo(T, t), k0 = Math.min(1, f.life / 0.5);
        // the floor lit beneath the crystal, frost spreading from under the pet as it forms
        const gx = G.PX + ox * T, gy = G.PY + oy * T; K.floorLight(c, gx, gy, T * LC * 0.6, 0.4 * k0 * cl(t / 0.5) * (1 - cl((t - OFF - 0.3) / 0.6)), P.ice);
        K.frostVeins(c, G.PX, G.PY, T * (1.2 + 0.1 * ev), eo(cl(t / 0.8)), 0.6 * (1 - cl((t - FIRE) / 0.8)), 1.3, 7);
        if (!BP) return; const fa = cl((t - FIRE) / 0.12) * (1 - cl((t - OFF - 0.1) / FADED)), ext = eo(cl((t - FIRE) / 0.14));
        if (fa <= 0.01) return;
        // the lane frosted and lit along the beam (light that fades, nothing dark)
        for (let d = 0.6; d < R * ext; d += 0.9) { const LX = G.PX + ux * d * T, LY = G.PY + uy * d * T; K.floorLight(c, LX, LY, T * BW * 1.4, 0.26 * fa, P.ice); }
        for (let d = 1.4, i = 0; d < R * ext - 0.5; d += 2.1, i++) K.frostVeins(c, G.PX + ux * d * T, G.PY + uy * d * T, T * (0.7 + BW * 0.5), eo(cl((t - FIRE - d * 0.03) / 0.5)), 0.7 * fa, i * 1.7, 5);
        const EX = G.PX + ux * R * T, EY = G.PY + uy * R * T; K.frozenPool(c, EX, EY, T * (0.7 + BW * 0.6), 0.8 * fa, t); K.mist(c, EX, EY, T * (0.8 + BW * 0.6), 0.8 * fa, t); },
      draw(c, f, X, Y, T) { const t = f.t, G = geo(T, t), gl = glowAt(t), k0 = Math.min(1, f.life / 0.35);
        const pg = Math.min(petGuard(G.cx, G.cy, T, WC * T), petGuard(G.tx, G.ty, T, WC * T), petGuard(2 * G.cx - G.tx, 2 * G.cy - G.ty, T, WC * T)), fade = 1 - cl((t - OFF - 0.4) / 0.4), crack = cl((t - OFF) / 0.4), ca = k0 * fade * pg, spin = t * 0.9 + (t > FIRE ? (t - FIRE) * 3 : 0);
        // the back halves of the rings
        for (let k = 0; k < NR; k++) { const ra = ringA(k, t); if (ra <= 0) continue; const rp = ringPose(k, t), p = along(G, rp.u), ex = 1 + 0.6 * cl((t - OFF - 0.1) / 0.6); iceRing3(c, p[0], p[1], rp.r * T * ex, rp.N, rp.th, ra * k0 * Math.max(pg, petGuard(p[0], p[1], T, rp.r * T)), false, k * 3); }
        // the crystal: a glowing seed that grows into the lance (L7: segments flying together into it)
        const wa = cl(t / 0.3) * (1 - cl((t - 0.5) / 0.4)); if (wa > 0) K.glow(c, G.cx, G.cy, T * (0.6 + 0.8 * cl(t / 0.5)), P.cyan, 0.7 * wa);
        const W = WC * T, opt = { tf: SEG ? 0.3 : 0.34, tb: SEG ? 0.18 : 0.19, glow: gl, crack, seed: 3, t };
        if (SEG && t < FORMD + 0.1) {
          for (let j = 0; j < SEG; j++) { const t0 = 0.12 + j * 0.13, u = eo(cl((t - t0 - 0.2) / 0.5)), al = cl((t - t0) / 0.25); if (al <= 0) continue;
            const side = (j % 2 ? 1 : -1) * (1.3 + 0.35 * (j % 3)), uc = (j + 0.5) / SEG, p = along(G, lerp(uc + (uc - 0.5) * 0.8, uc, u)), up = sdx >= 0 ? 1 : -1, nX = sdy * up, nY = -sdx * up, off = (1 - u) * (1.6 + 0.5 * (j % 3)) * W * 2.2 * (nY > 0 ? -1 : 1);
            const tb = j === 0 ? 0.42 : 0.16, tf = j === SEG - 1 ? 0.55 : 0.16, Lseg = G.Ls * (1 / SEG + 0.07) * (j === SEG - 1 ? 1.25 : j === 0 ? 1.1 : 1);
            prism(c, p[0] + nX * off, p[1] + nY * off - (1 - u) * T * 0.6, G.ang + (1 - u) * side * 0.45, Lseg, W * lerp(0.62, j === SEG - 1 ? 1 : 0.96, u), spin + j * 0.7 + (1 - u) * 5, al * ca * (t > FORMD ? 1 - cl((t - FORMD) / 0.1) : 1), { tf, tb, glow: 0.35 + 0.4 * u, seed: j + 5, t }); }
          if (t > FORMD - 0.1) prism(c, G.cx, G.cy, G.ang, G.Ls, W, spin, ca * cl((t - FORMD + 0.1) / 0.15), opt);
        } else if (!SEG) { const fu = eo(cl((t - 0.12) / (FORMD - 0.15))); if (fu > 0) prism(c, G.cx, G.cy, G.ang, G.Ls * lerp(0.18, 1, fu), W * lerp(0.35, 1, fu), spin, ca * cl(fu * 2.5), opt); }
        else prism(c, G.cx, G.cy, G.ang, G.Ls, W, spin, ca, opt);
        // the seams of the assembled lance flare as each segment locks
        for (const s of seams) { const u = (t - s.t) / 0.45; if (u > 1) continue; const p = along(G, s.u - 0.5 / SEG * 0); K.glow(c, p[0], p[1], W * (2 + 2 * u), P.white, 0.8 * (1 - u)); }
        // streaks drawn into the tip as it charges
        if (t > CH0 - 0.2 && t < FIRE + 0.05) { const ka = cl((t - CH0 + 0.2) / 0.3) * (1 - cl((t - FIRE) / 0.05)); c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
          for (let k = 0; k < 14; k++) { const v = (t * 1.9 + k / 14) % 1, b = k * 2.39996, rr = T * (0.6 + LC * 0.45) * Math.pow(1 - v, 1.4), x0 = G.tx + Math.cos(b) * rr, y0 = G.ty + Math.sin(b) * rr * 0.7, x1 = G.tx + Math.cos(b) * rr * 0.72, y1 = G.ty + Math.sin(b) * rr * 0.7 * 0.72;
            c.globalAlpha = ka * 0.8 * Math.sin(v * Math.PI); c.strokeStyle = k % 3 ? P.pale : P.lav; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
          c.restore(); K.glow(c, G.tx, G.ty, T * (0.4 + 0.9 * cl((t - CH0) / CHD)), P.white, 0.8 * ka); K.glow(c, G.tx, G.ty, T * (0.9 + 1.4 * cl((t - CH0) / CHD)), P.cyan, 0.5 * ka); }
        // the beam
        if (BP) this._beam(c, G, T, t);
        // the front halves of the rings
        for (let k = 0; k < NR; k++) { const ra = ringA(k, t); if (ra <= 0) continue; const rp = ringPose(k, t), p = along(G, rp.u), ex = 1 + 0.6 * cl((t - OFF - 0.1) / 0.6); iceRing3(c, p[0], p[1], rp.r * T * ex, rp.N, rp.th, ra * k0 * Math.max(pg, petGuard(p[0], p[1], T, rp.r * T)), true, k * 3);
          if (t > FIRE && t < OFF) K.glow(c, p[0], p[1], rp.r * T * 1.1, P.cyan, 0.18 + 0.1 * Math.sin(t * 20 + k)); }
        // the release: a white burst at the tip
        const ru = (t - FIRE) / 0.4; if (ru > 0 && ru < 1) { K.glow(c, G.tx, G.ty, T * (1 + BW * 2.5) * (0.6 + ru), P.white, 0.9 * (1 - ru)); iceRing3(c, G.tx, G.ty, T * BW * (1 + 2.5 * eo(ru)), [sdx / 1.084, sdy / 1.084, 0.42 / 1.084], t * 4, 0.8 * (1 - ru), true, 7); } },
      /* the frost beam: layered light along its curve, the ribbons spiralling round it, shards tumbling down it */
      _beam(c, G, T, t) { const fa = cl((t - FIRE) / 0.06) * (1 - cl((t - OFF) / 0.32)), ext = eo(cl((t - FIRE) / 0.14)); if (fa <= 0.01) return;
        const flare = t > OFF - 0.08 && t < OFF + 0.12 ? 1.3 : 1, thin = t > OFF ? 1 - 0.7 * cl((t - OFF) / 0.32) : 1, Wb = BW * T * flare * thin * (1 + 0.06 * Math.sin(t * 38)), L = BLEN * ext;
        const pts = []; for (const p of BP) { if (p[3] > L) { const q = beamAt(L), s = rel(q[0], q[1], q[2], T, G.PX, G.PY); pts.push([s[0], s[1], L]); break; } const s = rel(p[0], p[1], p[2], T, G.PX, G.PY); pts.push([s[0], s[1], p[3]]); }
        if (pts.length < 2) return; const n = pts.length, wAt = s => Wb * (0.42 + 0.58 * sm(0, 1.3, s)) * (1 - 0.5 * sm(BLEN - 0.6, BLEN, s));
        const NRM = pts.map((p, i) => { const q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)], ex = q[0] - r[0], ey = q[1] - r[1], el = Math.hypot(ex, ey) || 1; return [-ey / el, ex / el]; });
        // where it passes over the pet it thins to a ghost, so the pet always shows
        const PCX = H.sx(me.x), PCY = H.sy(me.y) - T * 0.45, GD = pts.map(p => Math.max(0.22, cl((Math.hypot(p[0] - PCX, (p[1] - PCY) * 1.1) - wAt(p[2]) * 0.5 - T * 0.5) / (T * 0.8))));
        c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        for (let i = 0; i < n; i += 3) K.glow(c, pts[i][0], pts[i][1], wAt(pts[i][2]) * 1.7, P.blue, 0.2 * fa * GD[i]);
        const layer = (col, k, al) => { c.strokeStyle = col; for (let i = 1; i < n; i++) { c.globalAlpha = al * fa * GD[i]; c.lineWidth = Math.max(0.8, wAt(pts[i][2]) * k); c.beginPath(); c.moveTo(pts[i - 1][0], pts[i - 1][1]); c.lineTo(pts[i][0], pts[i][1]); c.stroke(); } };
        layer(P.blue, 1.4, 0.2); layer(P.ice, 0.95, 0.22);
        // the ribbons: frost spiralling round the beam, the far half under its core, the near half over it
        const rib = front => { for (let b = 0; b < NB; b++) { c.strokeStyle = b === 2 ? P.lav : P.frost; for (let i = 1; i < n; i++) { const s0 = pts[i - 1][2], s1 = pts[i][2], ph1 = s1 * 2.6 - t * 11 + b * TAU / NB, dep = Math.cos(ph1); if ((dep >= 0) !== front) continue;
              const ph0 = s0 * 2.6 - t * 11 + b * TAU / NB, A0 = wAt(s0) * 0.85 * sm(0, 0.8, s0), A1 = wAt(s1) * 0.85 * sm(0, 0.8, s1);
              c.globalAlpha = fa * (front ? 0.95 : 0.4) * GD[i]; c.lineWidth = Math.max(1, T * (0.07 + 0.04 * dep) * (NB >= 3 ? 1.35 : 1)); c.beginPath(); c.moveTo(pts[i - 1][0] + NRM[i - 1][0] * Math.sin(ph0) * A0, pts[i - 1][1] + NRM[i - 1][1] * Math.sin(ph0) * A0); c.lineTo(pts[i][0] + NRM[i][0] * Math.sin(ph1) * A1, pts[i][1] + NRM[i][1] * Math.sin(ph1) * A1); c.stroke(); } } };
        if (NB) rib(false);
        layer(P.cyan, 0.5, 0.5); layer(P.white, 0.18, 0.9);
        // light flowing down it
        c.globalAlpha = 0.6 * fa; c.strokeStyle = P.white; c.lineWidth = Math.max(1, Wb * 0.08); c.setLineDash([T * 0.5, T * 0.8]); c.lineDashOffset = -t * T * 14;
        for (const o of [-0.22, 0.22]) { c.beginPath(); for (let i = 0; i < n; i++) { const w = wAt(pts[i][2]) * o, X = pts[i][0] + NRM[i][0] * w, Y = pts[i][1] + NRM[i][1] * w; i ? c.lineTo(X, Y) : c.moveTo(X, Y); } c.stroke(); }
        c.setLineDash([]);
        if (NB) rib(true);
        c.restore();
        // tumbling shards inside it
        for (const s of shards) { if (s.s > L) continue; const q = beamAt(s.s), p = rel(q[0], q[1], q[2], T, G.PX, G.PY), nn = NRM[Math.min(n - 1, Math.max(0, Math.round(s.s / Math.max(0.01, L) * (n - 1))))], w = wAt(s.s) * s.off * 0.5;
          K.shard(c, p[0] + nn[0] * w, p[1] + nn[1] * w, T * 0.12 * s.sz * (1 + BW * 0.4), T * 0.34 * s.sz * (1 + BW * 0.4), s.rot, s.seed, 0.9 * fa); }
        // the muzzle at the tip and the end of the beam where it strikes
        K.glow(c, G.tx, G.ty, Wb * 1.4, P.white, 0.8 * fa); K.glow(c, G.tx, G.ty, Wb * 2.6, P.cyan, 0.45 * fa);
        const e = pts[n - 1]; K.glow(c, e[0], e[1], Wb * 1.6 * (1 + 0.15 * Math.sin(t * 25)), P.white, 0.6 * fa * ext); K.glow(c, e[0], e[1], Wb * 3, P.cyan, 0.35 * fa * ext); } });
    return F;
  };

  /* how much a thing at screen (X0, Y0) may show: a ghost where it passes over the pet */
  function petGuard(X0, Y0, T, rad) { const mx = H.sx(H.me.x), my = H.sy(H.me.y) - T * 0.45, d = Math.hypot(X0 - mx, (Y0 - my) * 1.15) - (rad || 0); return Math.max(0.25, cl((d - T * 0.5) / (T * 0.8))); }

  /* ================= 5. Glacial Onslaught ================= */
  U.glacialonslaught = (C, h) => { H = h; K = IK.bind(H); P = K.P; init();
    const me = H.me, ev = K.evo(C), a0 = C.a, ux = Math.cos(a0), uy = Math.sin(a0);
    const N = [3, 3, 4, 5, 6, 7, 9][ev - 1], ROWS = ev >= 7 ? 3 : 1, PER = Math.ceil(N / ROWS);
    const LC = [2.1, 2.15, 2.2, 2.35, 2.4, 2.45, 2.6][ev - 1], WC = LC * 0.17, BRAID = ev >= 7, FROSTRING = ev >= 6;
    const D = C.base * C.K * K.evoK(C), per = 14 * D / N, NF = ev >= 7 ? 11 : ev >= 4 ? 9 : 7;
    H.X.banner('GLACIAL ONSLAUGHT', '', C.col, 1.4); H.X.sfx.hum();
    // the rack's screen frame: d along the shot (from behind the pet toward the monsters), n across it
    const sl = Math.hypot(ux, uy) || 1, dX = ux / sl, dY = uy / sl, nX = -dY, nY = dX;
    // the slots (tiles, screen-relative to the pet's feet): rows across the shot, stacked back along it and up
    const slots = []; for (let i = 0; i < N; i++) { const row = Math.floor(i / PER), k = i - row * PER, m = Math.min(PER, N - row * PER), sp = ROWS > 1 ? 1.08 : N > 5 ? 0.8 : 0.95;
      const lat = (k - (m - 1) / 2) * sp + (ROWS > 1 && row === 1 ? sp * 0.5 : 0), bk = 0.55 + row * 1.45 + Math.abs(lat) * (ROWS === 1 && N > 3 ? 0.18 : 0.08), up = 1.7 + row * 0.6;
      slots.push({ i, row, lx: -dX * bk + nX * lat, ly: -dY * bk + nY * lat - up }); }
    // lift the whole rack until nothing of it comes over the pet
    const ext = 0.5 * LC + 0.1; let lift = 0; for (let it = 0; it < 30; it++) { let clear = true;
      for (const s of slots) for (let k = -1; k <= 1 && clear; k++) { const X = s.lx + dX * ext * k, Y = s.ly - lift + dY * ext * k; if (Math.abs(X) < 0.6 + WC && Y > -1.3 - WC && Y < 0.3 + WC) clear = false; }
      if (clear) break; lift += 0.15; }
    for (const s of slots) s.ly -= lift;
    // the targets: monsters ahead, spread over the crystals; none: a fan along the aim
    const cand = H.living().filter(m => { const dx = m.x - me.x, dy = m.y - me.y, d = Math.hypot(dx, dy); return d < 11 && d > 0.2 && Math.abs(H.wrap(Math.atan2(dy, dx) - a0)) < 1.25; }).map(m => { const d = Math.hypot(m.x - me.x, m.y - me.y); return [m, d + (d < 1.4 ? 6 : 0)]; }).sort((p, q) => p[1] - q[1]).map(e => e[0]).slice(0, 6);
    // the launch order and times: L1 centre then the sides; Adept a spreading formation (centre, then pairs outward);
    // Celestial row by row, the volleys quickening; each crystal flies faster than the last
    const order = slots.slice().sort((p, q) => (p.row - q.row) || (Math.abs(p.lx * nX + p.ly * nY) - Math.abs(q.lx * nX + q.ly * nY)));
    const T0 = ROWS > 1 ? 1.55 : 1.2, crys = [];
    order.forEach((s, j) => { let tl; if (ROWS > 1) { const row = s.row, base = [0, 0.5, 0.86][row], st = [0.13, 0.08, 0.04][row], k = j - row * PER; tl = T0 + base + k * st; }
      else if (N >= 5) tl = T0 + Math.ceil(j / 2) * 0.24 + (j % 2 === 0 && j ? 0.05 : 0); else tl = T0 + j * 0.3;
      const tg = cand.length ? cand[j % cand.length] : null, fan = (j % 2 ? 1 : -1) * Math.ceil(j / 2) * 0.16;
      crys.push({ s, tl, tg, fan, form: 0.1 + s.row * 0.32 + (s.i - s.row * PER) * 0.08, st: 'hover', x: 0, y: 0, z: 0, hd: a0 + fan, v: 0, tr: [], spin: R1(s.i) * TAU, seed: s.i * 1.7 + 0.5, ang: -Math.PI / 2, dist: 0, rowV: ROWS > 1 ? 15 + s.row * 4 : 14 + j * 0.8 }); });
    const LAST = Math.max(...crys.map(c0 => c0.tl)), END = LAST + 2.0;
    const fan = [], rings = [], imps = [];
    // a crystal's screen position while it hovers in its slot (it follows the pet, bobbing)
    const hoverXY = (cr, T, t) => { const PX = H.sx(me.x), PY = H.sy(me.y), b = Math.sin(t * 2.2 + cr.s.i * 1.3) * 0.06, u = eo(cl((t - cr.form) / 0.55)), rise = (1 - u) * 0.7;
      return [PX + cr.s.lx * T, PY + (cr.s.ly + b + rise) * T]; };
    const aimXY = (cr, T) => { if (cr.tg && !cr.tg.dead) return [H.sx(cr.tg.x), H.sy(cr.tg.y) - 0.5 * T]; const a = a0 + cr.fan; return [H.sx(me.x + Math.cos(a) * 6), H.sy(me.y + Math.sin(a) * 6) - 0.5 * T]; };
    const launch = (cr, T, t) => { const [X, Y] = hoverXY(cr, T, t), z = Math.max(0.6, -cr.s.ly - 0.2), w = toW(X, Y + z * T, T); cr.st = 'fly'; cr.x = w[0]; cr.y = w[1]; cr.z = z; cr.z0 = z; cr.lt = t;
      const tx = cr.tg && !cr.tg.dead ? cr.tg.x : me.x + Math.cos(a0 + cr.fan) * 7, ty = cr.tg && !cr.tg.dead ? cr.tg.y : me.y + Math.sin(a0 + cr.fan) * 7; cr.hd = Math.atan2(ty - cr.y, tx - cr.x); cr.d0 = Math.max(0.5, Math.hypot(tx - cr.x, ty - cr.y));
      K.glitter(w[0], w[1] - z, 6, 4); K.snow(w[0], w[1] - z, 4); H.X.sfx.whoosh && H.X.sfx.whoosh(); H.X.shake(2 + cr.s.row, 0.06); };
    const impact = (cr, t) => { cr.st = 'crack'; cr.it = t; const m = cr.tg && !cr.tg.dead && Math.hypot(cr.tg.x - cr.x, cr.tg.y - cr.y) < cr.tg.r + 0.9 ? cr.tg : null;
      if (m) H.X.hitMon(m, per * 0.6, C.dmgO({ kb: 2.5, chill: true, stun: m.boss ? 0.1 : 0.3 })); else H.hitArea(cr.x, cr.y, 0.7, per * 0.6, C.dmgO({ kb: 2, chill: true }));
      cr.hitM = m; H.X.shake(4 + (ROWS > 1 ? 1 : 0), 0.1); H.X.sfx.crack ? H.X.sfx.crack() : H.X.sfx.crash(); K.glitter(cr.x, cr.y - cr.z, 6, 5); };
    const burst = (cr, t) => { cr.st = 'gone'; cr.bt = t; const x = cr.x, y = cr.y, hd = cr.hd;
      // the fan of shards, flying on ahead
      for (let k = 0; k < H.n(NF); k++) { const b = hd + (k / Math.max(1, NF - 1) - 0.5) * 1.25 + (Math.random() - 0.5) * 0.15, v = 7 + Math.random() * 5; fan.push({ x, y, z: cr.z, vx: Math.cos(b) * v, vy: Math.sin(b) * v, vz: 1.5 + Math.random() * 2, t0: t, life: 0.42 + Math.random() * 0.18, sz: 0.6 + Math.random() * 0.6, seed: k }); }
      let hit = 0; for (const m of H.living()) { if (m === cr.hitM) continue; const dx = m.x - x, dy = m.y - y, d = Math.hypot(dx, dy); if (d < 2.6 + m.r && (d < m.r + 0.5 || Math.abs(H.wrap(Math.atan2(dy, dx) - hd)) < 0.72)) { H.X.hitMon(m, per * 0.4, C.dmgO({ kb: 1.5, chill: true })); hit++; } }
      if (cr.hitM && !cr.hitM.dead) H.X.hitMon(cr.hitM, per * 0.4 * (hit ? 0.5 : 1), C.dmgO({ kb: 1, freeze: ev >= 7 ? 1.2 : 0.8 }));
      imps.push({ x, y, z: cr.z, t, hd }); if (FROSTRING) rings.push({ x, y, t });
      K.glitter(x, y - cr.z, 14, 7); K.fragments(x, y - cr.z, 8, 6); K.snow(x, y - cr.z, 8); H.X.light(x, y, 2.4, 0.3); H.X.shake(5, 0.12); H.X.sfx.crash(); };
    const F = H.add({ life: END,
      update(dt, f) { const t = f.t, T = H.X.Tz(), PX = H.sx(me.x), PY = H.sy(me.y);
        if (t < LAST + 0.3 && Math.abs(ux) > 0.2) me.face = ux > 0 ? 1 : -1;
        if (t < 0.5) K.aura(me.x, me.y, 0.6, dt, 22, 0.2);
        for (const cr of crys) {
          if (cr.st === 'hover') { cr.spin += dt * 1.4;
            // it forms, rises into its slot and tilts toward its monster; frost gathers round it
            const [X, Y] = hoverXY(cr, T, t); if (t > cr.form && t < cr.tl && Math.random() < dt * 10 * H.Q()) { const w = toW(X, Y, T); K.aura(w[0], w[1], 0.5, 1 / 30, 8, 0); }
            if (t >= cr.form && !cr.formed) { cr.formed = true; const w = toW(X, Y, T); K.glitter(w[0], w[1], 5, 3); H.X.sfx.sparkle && H.X.sfx.sparkle(); }
            if (t >= cr.tl) launch(cr, T, t); continue; }
          if (cr.st === 'fly') { const tf = t - cr.lt; cr.spin += dt * 17; const v = cr.rowV * (1 + 1.6 * cl(tf / 0.35)), sp = v * dt;
            if (cr.tg && !cr.tg.dead) { const want = Math.atan2(cr.tg.y - cr.y, cr.tg.x - cr.x); cr.hd += Math.max(-6 * dt, Math.min(6 * dt, H.wrap(want - cr.hd))); }
            cr.x += Math.cos(cr.hd) * sp; cr.y += Math.sin(cr.hd) * sp; cr.dist += sp; const rem = cr.tg && !cr.tg.dead ? Math.hypot(cr.tg.x - cr.x, cr.tg.y - cr.y) : Math.max(0, cr.d0 - cr.dist); cr.z = 0.5 + (cr.z0 - 0.5) * cl(rem / cr.d0);
            cr.tr.push([cr.x, cr.y, cr.z]); if (cr.tr.length > 9) cr.tr.shift();
            if (Math.random() < dt * 40 * H.Q()) H.P({ kind: Math.random() < 0.6 ? 'ember' : 'spark', x: cr.x + (Math.random() - 0.5) * 0.4, y: cr.y - cr.z + (Math.random() - 0.5) * 0.3, vx: -Math.cos(cr.hd) * 1.5 + (Math.random() - 0.5), vy: -Math.sin(cr.hd) * 1.5 - 0.3, g: 0.4, drag: 1, life: 0.7, max: 0.7, size: 2 + Math.random() * 1.6, color: Math.random() < 0.5 ? P.white : P.pale });
            let hitNow = false; if (cr.tg && !cr.tg.dead) hitNow = Math.hypot(cr.tg.x - cr.x, cr.tg.y - cr.y) < cr.tg.r + 0.3; else hitNow = cr.dist >= cr.d0;
            if (!hitNow) for (const m of H.living()) if (Math.hypot(m.x - cr.x, m.y - cr.y) < m.r + 0.25) { cr.tg = m; hitNow = true; break; }
            if (hitNow || H.X.blocked(cr.x, cr.y, 0.05) || tf > 1.1) impact(cr, t); continue; }
          if (cr.st === 'crack' && t - cr.it >= 0.13) burst(cr, t); }
        for (let i = fan.length - 1; i >= 0; i--) { const s = fan[i]; if (t - s.t0 > s.life) { fan.splice(i, 1); continue; } s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - 3 * dt; s.vy *= 1 - 3 * dt; s.z = Math.max(0.05, s.z + s.vz * dt); s.vz -= 9 * dt; }
        if (t > LAST + 1.25 && fan.length === 0 && crys.every(c0 => c0.st === 'gone')) f.life = Math.min(f.life, 0.6); },
      drawUnder(c, f, X, Y, T) { const t = f.t, PX = H.sx(me.x), PY = H.sy(me.y), k0 = Math.min(1, f.life / 0.5);
        // the floor lit beneath the rack, frost on the floor round the pet as the crystals form
        const ra = k0 * cl(t / 0.5) * (1 - cl((t - LAST - 0.2) / 0.6)); K.floorLight(c, PX - dX * T * 0.9, PY - dY * T * 0.9, T * (1.6 + 0.25 * ROWS), 0.4 * ra, P.ice);
        K.frostVeins(c, PX, PY, T * (1.1 + 0.12 * ev), eo(cl(t / 0.7)), 0.55 * ra, 2.1, 6);
        // each impact: light and frost on the floor (L6+: an expanding ring of frost), all fading
        for (const im of imps) { const u = (t - im.t) / 0.9; if (u < 0 || u > 1) continue; const IX = H.sx(im.x), IY = H.sy(im.y); K.floorLight(c, IX, IY, T * 1.4, 0.55 * (1 - u), P.pale); K.frostVeins(c, IX, IY, T * 1.3, eo(cl(u * 3)), 0.8 * (1 - u), im.x * 3, 6); }
        for (const r of rings) { const u = (t - r.t) / 0.75; if (u < 0 || u > 1) continue; const IX = H.sx(r.x), IY = H.sy(r.y); K.iceRing(c, IX, IY, T * (0.4 + 1.9 * eo(u)), 0.9 * (1 - u), null, t, T * 0.12 * (1 - u * 0.5)); } },
      draw(c, f, X, Y, T) { const t = f.t, k0 = Math.min(1, f.life / 0.4), W = WC * T, Ls = LC * T;
        // the trails behind the flying crystals (the oldest first)
        for (const cr of crys) { if (!cr.tr.length || (cr.st === 'gone' && t - cr.bt > 0.35)) continue; const ga = cr.st === 'gone' ? 1 - (t - cr.bt) / 0.35 : 1, pts = cr.tr.map(p => [H.sx(p[0]), H.sy(p[1]) - p[2] * T]), hd = pts[pts.length - 1], md = pts[pts.length >> 1]; lightTrail(c, pts, W * 1.1, 0.9 * ga * k0 * Math.min(petGuard(hd[0], hd[1], T), petGuard(md[0], md[1], T)), BRAID, t); }
        // the crystals: hovering in the rack, in flight (spinning round their long axis), cracking with light
        const list = crys.slice().sort((p, q) => (q.s.row - p.s.row));
        for (const cr of list) { if (cr.st === 'gone') continue; let x, y, ang, al = 1, gl = 0.45, ck = 0, sc = 1;
          if (cr.st === 'hover') { const u = cl((t - cr.form) / 0.45); if (u <= 0) continue; [x, y] = hoverXY(cr, T, t); const tgt = aimXY(cr, T), want = Math.atan2(tgt[1] - y, tgt[0] - x), tilt = eio(cl((t - cr.form - 0.35) / Math.max(0.3, cr.tl - cr.form - 0.45)));
            ang = angLerp(Math.atan2(dY - 0.9, dX * 0.6) + (cr.s.lx * nX + cr.s.ly * nY > 0 ? 0.12 : -0.12), want, tilt); al = cl(u * 2); sc = lerp(0.2, 1, back(u)); gl = 0.35 + 0.35 * cl((t - cr.tl + 0.4) / 0.4);
            const rc = cl((t - cr.tl + 0.12) / 0.12); x -= Math.cos(ang) * T * 0.25 * Math.sin(rc * Math.PI); y -= Math.sin(ang) * T * 0.25 * Math.sin(rc * Math.PI);
            if (u < 1) K.glow(c, x, y, T * (0.5 + 0.6 * u), P.cyan, 0.8 * (1 - u)); }
          else { x = H.sx(cr.x); y = H.sy(cr.y) - cr.z * T; const p = cr.tr.length > 1 ? cr.tr[Math.max(0, cr.tr.length - 3)] : null; ang = p ? Math.atan2(y - (H.sy(p[1]) - p[2] * T), x - H.sx(p[0])) : cr.hd;
            if (cr.st === 'crack') { const u = cl((t - cr.it) / 0.13); ck = u; gl = 1; sc = 1 + 0.08 * u; } else gl = 0.7; cr.ang = ang;
            // the head sits where it strikes: draw the crystal back along its line so its tip touches the monster
            x -= Math.cos(ang) * Ls * 0.3; y -= Math.sin(ang) * Ls * 0.3; }
          if (cr.st !== 'hover') al *= Math.min(petGuard(x, y, T, W), petGuard(x + Math.cos(ang) * Ls * 0.4, y + Math.sin(ang) * Ls * 0.4, T, W), petGuard(x - Math.cos(ang) * Ls * 0.4, y - Math.sin(ang) * Ls * 0.4, T, W));
          prism(c, x, y, ang, Ls * sc, W * sc, cr.spin, al * k0, { tf: 0.42, tb: 0.2, glow: gl, crack: ck, seed: cr.seed, t });
          if (cr.st === 'fly') K.glow(c, x + Math.cos(ang) * Ls * 0.45, y + Math.sin(ang) * Ls * 0.45, W * 1.6, P.white, 0.55); }
        // the fan of shards flying on from each burst
        for (const s of fan) { const u = (t - s.t0) / s.life, X0 = H.sx(s.x), Y0 = H.sy(s.y) - s.z * T, a = Math.atan2(s.vy - s.vz * 0.4, s.vx); K.shard(c, X0, Y0, T * 0.13 * s.sz * (LC / 1.8), T * 0.42 * s.sz * (LC / 1.8), a, s.seed, (1 - u * u) * k0); }
        // the burst: a white flash opening forward
        for (const im of imps) { const u = (t - im.t) / 0.32; if (u < 0 || u > 1) continue; const IX = H.sx(im.x), IY = H.sy(im.y) - im.z * T, dx = Math.cos(im.hd), dy = Math.sin(im.hd);
          K.glow(c, IX + dx * T * 0.5 * u, IY + dy * T * 0.5 * u, T * (0.8 + 1.4 * u), P.cyan, 0.75 * (1 - u)); K.glow(c, IX, IY, T * 0.7, P.white, 0.95 * (1 - u)); } } });
    return F;
  };
})();
