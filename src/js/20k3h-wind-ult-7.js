/* ---------- Wind, new: Fujin ----------
   The pet conjures a spear of emerald light, a satin ribbon of emerald and mint light wraps round it, and it performs a
   chain of soaring jumps, each ending in a vertical spear-first dive. Replaces Invisible Giant's Bow (row in 20k1: key
   'fujin', cost 100, cd 22, glyph 'lance').
   Counts (held until their breakpoints): 3 dives at levels 1-3, 5 at 4-6, 7 at 7. Each dive is one Wind AoE hit, fired
   in the frame the drawn spear tip reaches the floor, on every monster inside that dive's floor ellipse (radius R_j,
   hit by the drawn shape: hypot(dx, dy / GY) - r <= R_j), once per monster per dive. Decorative particles never hit.
   Damage (DK = base x K x (1 + 0.08 (evo - 1))), for a monster hit by every dive: TOT = 2 (14 + (evo - 1)) DK
   (14 / 17 / 20 DK at levels 1 / 4 / 7), split by weights 1 + 0.3 j, the final dive x 1.45:
     L1  3.03, 3.94, 7.03                              L4  1.89, 2.46, 3.03, 3.59, 6.03
     L7  1.37, 1.79, 2.20, 2.61, 3.02, 3.43, 5.58
   Escalation: apex (feet) 2.0 + 0.3 j tiles (the final x 1.25 + 0.35), radius (1.45 + 0.17 j) K (the final x 1.3),
   launch gust, spear light, trailing wind, ribbon loops and seal all grow with j.
   Choreography (the pet itself jumps: its own rig through the hooks me.z (lift; its shadow stays on the floor), me.hopSq
   (squash + / stretch -), me.hopArmS ([front arm, back arm]), me.hopFoot, me.hopLean; it never turns in 3D):
     formation (0.95 s): green motes gather into a line beside the pet, the shaft assembles outward from the grip, the
       crystal head grows out of the socket and locks with a pulse; the ribbon unfurls from behind the shoulders.
     prep (0.45 s, first jump): a compressed stance, the spear angled up, a thin wind circle contracts under the feet
       while dust, leaves and petals circle the launch point; the ribbon tightens.
     each jump: launch gust; ascent (stretched, spear to the sky, ribbon streaming down; all the lateral travel to the
       next target happens here, the pet really moving by the game's own rules: moveEnt, walls stop it); apex (slows, the
       pet leans through the turn while the spear swings tip-down, the poised silhouette held a beat; the landing seal
       glows beneath); vertical dive (accelerating straight down inside a cone of compressed wind, streaks stretching up,
       the ribbon ends whipping up and spiralling round the wake); contact (the tip first: flash, shockwave, peeling air
       blades with leaves, petals and motes, an upward fountain opening into curls, the hit); the pet slides down the
       shaft (a magical grip), lands with a squash, pulls the spear free with a forward twirl and springs again.
     Adept: richer facets, finer ribbon edging, layered trails; the fifth impact adds two interwoven rings. Celestial: a
       layered crystalline core, light ornaments round the socket, a pearly ribbon with long ends; the seventh dive draws
       the nearby particles inward, then an enormous emerald wind bloom, broad curved currents and a rising spiral of
       leaves and petals.
     ending (1.3 s): the spear is pulled free, the pet returns to its stance, the spear dissolves tip-first into
       sparks, the ribbon unwraps, makes one last loop behind the pet and disperses.
   Targeting between jumps: the nearest living monsters (H.sortNear), preferring one the previous dive did not strike;
   the landing spot leans into the group round it, is checked against the walls (H.walk, a clear straight path) and is
   capped per jump; against a lone boss the dives keep landing beside it. Input is held (me.push, as Lightning Flash) and
   the pet is untouchable while airborne (me.inv, as the game's own leap); every hook is reset on end and on death.
   Models: the spear is ray-cast per pixel in its own frame (a lathe-turned shaft, socket rings and a crystal pommel; an
   elongated crystal head with a raised central ridge, two face planes a side (three at Adept) and bevelled cutting
   edges; two swept-back fins), translucent emerald faces over a deep green interior with mint-white facet lines, a
   dark emerald shaft; baked per angle bucket (36) and level tier into small cached pictures, lazily, a few rows a slice
   (~0.7 ms a frame, 2 ms while the one on screen is missing), and in idle time for a pet with Fujin in its kit
   (U.fujin.warm). The inner light (currents to the tip, two spiral strands on the shaft, the Celestial core and
   ornaments) is a separate emissive layer baked in 10 phase frames in the spear's own frame and drawn turned.
   Effects are cached sprites (fxSprite); particles go through H.n / H.Q. */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.giantbow;
  const TAU = Math.PI * 2, GY = 0.55;
  const MINT = '#73E8B6', EMER = '#16A57B', AIR = '#E7FFF6', PINK = '#FFAFD2', ROSE = '#DE5A9A', DEEP = '#0B5C45';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const tierOf = ev => (ev >= 7 ? 3 : ev >= 4 ? 2 : 1);
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, w | 0); cv.height = Math.max(1, h | 0); return cv; };
  const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let H = null;

  /* ================= the spear model (its own frame: u along the axis, 0 butt .. 1 tip; v across; w toward the
     viewer; all in spear lengths) ================= */
  const pl = (P, u) => { if (u <= P[0][0]) return P[0][1]; for (let i = 1; i < P.length; i++) if (u <= P[i][0]) { const a = P[i - 1], b = P[i]; return a[1] + (b[1] - a[1]) * (u - a[0]) / (b[0] - a[0]); } return P[P.length - 1][1]; };
  // the turned parts: crystal pommel, its ring, the shaft, the socket rings and flare
  const HU = 0.63;   // (where the head begins)
  const REV = [[0, 0], [0.014, 0.03], [0.04, 0.043], [0.064, 0.031], [0.076, 0.019], [0.082, 0.029], [0.093, 0.029], [0.099, 0.022], [0.11, 0.021], [0.565, 0.0195], [0.572, 0.03], [0.583, 0.03], [0.59, 0.022], [0.612, 0.036], [0.623, 0.032], [0.632, 0.02], [0.641, 0.012], [0.644, 0]];
  const revMat = u => (u < 0.076 ? 0 : u < 0.104 ? 1 : u < 0.565 ? 2 : 1);   // 0 crystal, 1 metal, 2 shaft
  const BANDS = [0.27, 0.287, 0.44, 0.457];   // (Adept: thin raised bands on the grip)
  function revR(u, tier) { let r = pl(REV, u); if (tier >= 2) for (const b of BANDS) { const k = (u - b) / 0.005; if (k > -1 && k < 1) r = Math.max(r, 0.025 * Math.sqrt(1 - k * k)); } return r; }
  // the head: half width a(u), thickness b(u)
  const HEAD = [[HU, 0.016], [0.672, 0.072], [0.722, 0.09], [0.8, 0.077], [0.895, 0.042], [0.962, 0.013], [1.0, 0.0]];
  const headA = u => (u < HU || u > 1 ? 0 : pl(HEAD, u));
  const headB = a => 0.5 * a + 0.003;
  // the head's cross-section: a raised central ridge, one (two at Adept) face planes, a bevelled edge; facet id out
  let FID = 0;
  function headW(q, b, tier) {
    let w = b * (1 - 0.72 * q); FID = 1;
    if (tier >= 2) { const w2 = b * (1.1 - 1.05 * q); if (w2 < w) { w = w2; FID = 2; } }
    const rg = b * (1.12 - 2.1 * q); if (rg > w) { w = rg; FID = 0; }
    const bv = 1.95 * b * (1 - q); if (bv < w) { w = bv; FID = 3; }
    return w;
  }
  // the fins: a swept-back blade each side of the socket (polygon in (u, |v|)), bevelled plates
  const FIN = (() => { const P = [], qb = (a, c, b, n, out) => { for (let i = 0; i <= n; i++) { const t = i / n, s = 1 - t; out.push([s * s * a[0] + 2 * s * t * c[0] + t * t * b[0], s * s * a[1] + 2 * s * t * c[1] + t * t * b[1]]); } };
    qb([0.662, 0.02], [0.636, 0.07], [0.552, 0.118], 9, P); const Q = []; qb([0.552, 0.118], [0.585, 0.06], [0.612, 0.02], 9, Q); Q.shift(); P.push(...Q); return P; })();
  const FINB = [0.545, 0.0, 0.67, 0.122];
  function finD(u, v) {   // signed distance (+ inside) to the fin outline, in spear lengths
    if (u < FINB[0] - 0.01 || u > FINB[2] + 0.01 || v > FINB[3] + 0.01) return -1;
    let ins = false, dmin = 1e9; const n = FIN.length;
    for (let i = 0, j = n - 1; i < n; j = i++) { const a = FIN[j], b = FIN[i];
      if ((b[1] > v) !== (a[1] > v) && u < (a[0] - b[0]) * (v - b[1]) / (a[1] - b[1]) + b[0]) ins = !ins;
      const ex = a[0] - b[0], ey = a[1] - b[1], L2 = ex * ex + ey * ey || 1e-9, t = cl(((u - b[0]) * ex + (v - b[1]) * ey) / L2), dx = u - b[0] - ex * t, dy = v - b[1] - ey * t, d = Math.hypot(dx, dy); if (d < dmin) dmin = d; }
    return ins ? dmin : -dmin;
  }
  const FT = 0.011, FK = 0.5;
  /* the part in front at (u, v): out = [w, cov(px), material, facet] ; materials 0 crystal, 1 metal, 2 shaft, 3 head, 4 fin */
  const SO = [0, 0, 0, 0];
  function front(u, v, tier, Lpx, out) {
    const av = Math.abs(v); let best = -1, bc = -1e9, bm = -1, bf = 0, maxc = -1e9;
    // the turned body
    { const r = revR(u, tier); if (r > 0) { const c = (r - av) * Lpx + 0.5; if (c > maxc) maxc = c; if (c > 0) { const w = Math.sqrt(Math.max(0, r * r - v * v)); if (w > best) { best = w; bc = c; bm = revMat(u); bf = 0; } } } }
    // the head
    { const a = headA(u); if (a > 0) { const c = (a - av) * Lpx + 0.5; if (c > maxc) maxc = c; if (c > 0) { const w = headW(Math.min(1, av / a), headB(a), tier); if (w > best) { best = w; bc = c; bm = 3; bf = FID * (v < 0 ? -1 : 1); } } } }
    // the fins
    { const d = finD(u, av); if (d > -2 / Lpx) { const c = d * Lpx + 0.5; if (c > maxc) maxc = c; if (c > 0) { const w = Math.min(FT, FK * Math.max(0, d)); if (w > best) { best = w; bc = c; bm = 4; bf = 7 * (v < 0 ? -1 : 1); } } } }
    out[0] = best; out[1] = bm < 0 ? maxc : bc; out[2] = bm; out[3] = bf; return bm >= 0;
  }
  function partW(m, u, v, tier) {
    const av = Math.abs(v);
    if (m <= 2) { const r = revR(u, tier); return Math.sqrt(Math.max(0, r * r - v * v)); }
    if (m === 3) { const a = headA(u); if (!(a > 0)) return 0; return Math.max(0, headW(Math.min(1, av / a), headB(a), tier)); }
    const d = finD(u, av); return Math.min(FT, FK * Math.max(0, d));
  }

  /* bake one body picture: the spear turned by th on screen (0: tip up, + clockwise), drawn in its own frame (the
     strip: rows from the tip down to the butt, columns across); light from the upper left, a little in front */
  const LS = (() => { const l = [-0.5, -0.66, 0.56], q = Math.hypot(...l); return l.map(x => x / q); })();
  const PADV = 0.13;   // (half the strip's width, spear lengths)
  function stripGeo(Lpx) { const pad = 4, W = Math.ceil(2 * PADV * Lpx) + pad * 2, Hh = Math.ceil(Lpx) + pad * 2; return { pad, W, H: Hh, cx: W / 2, Lpx }; }
  const bands = x => 0.25 * sstep(0.05, 0.16, x) + 0.35 * sstep(0.36, 0.47, x) + 0.4 * sstep(0.66, 0.76, x);
  /* the geometry (angle-free) once per tier and size: per pixel the front part's normal, depth, material, coverage and
     facet; each angle bucket then only shades it */
  const GBS = new Map();
  function* gbufGen(tier, Lpx) {
    const key = tier + '|' + Lpx; if (GBS.has(key)) return GBS.get(key);
    const G = stripGeo(Lpx), { W, H: Hh, pad, cx } = G, N = W * Hh, B = { W, H: Hh, pad, cx, Lpx, NU: new Float32Array(N), NV: new Float32Array(N), NW: new Float32Array(N), TK: new Float32Array(N), COV: new Float32Array(N), SIL: new Float32Array(N), MAT: new Int8Array(N).fill(-1), FA: new Int8Array(N), QH: new Float32Array(N) };
    const e = 0.6 / Lpx, o4 = [0, 0, 0, 0];
    for (let py = 0; py < Hh; py++) {
      const u = 1 - (py + 0.5 - pad) / Lpx, a = headA(u), rv = revR(u, tier);
      if (u < -0.01 || u > 1.01) continue;
      for (let px = 0; px < W; px++) {
        const v = (px + 0.5 - cx) / Lpx; if (!front(u, v, tier, Lpx, o4)) continue;
        const w = o4[0], cov = cl(o4[1]), m = o4[2], i = py * W + px; if (cov <= 0.002) continue;
        const du = (partW(m, u + e, v, tier) - partW(m, u - e, v, tier)) / (2 * e), dv = (partW(m, u, v + e, tier) - partW(m, u, v - e, tier)) / (2 * e);
        let nu = -du, nv = -dv, nw = 1; { const k = Math.hypot(nu, nv, nw); nu /= k; nv /= k; nw /= k; }
        const bmax = m === 3 ? headB(a) * 1.12 : m === 4 ? FT : rv;
        B.NU[i] = nu; B.NV[i] = nv; B.NW[i] = nw; B.TK[i] = Math.pow(cl(w / Math.max(1e-4, bmax)), 0.75); B.COV[i] = cov; B.SIL[i] = o4[1]; B.MAT[i] = m; B.FA[i] = o4[3]; B.QH[i] = a > 0 ? Math.min(1, Math.abs(v) / a) : 1;
      }
      yield 0;
    }
    GBS.set(key, B); if (GBS.size > 6) GBS.delete(GBS.keys().next().value); return B;
  }
  function* bodyGen(tier, th, Lpx, res) {
    const B = yield* gbufGen(tier, Lpx), { W, H: Hh, pad, cx } = B, N = W * Hh, cv = mk(W, Hh), g = cv.getContext('2d'); yield 0; const im = g.createImageData(W, Hh), d = im.data, NL = new Float32Array(N);
    const su = Math.sin(th), cu = -Math.cos(th), sv = Math.cos(th), cvv = Math.sin(th);
    const Lu = LS[0] * su + LS[1] * cu, Lv = LS[0] * sv + LS[1] * cvv, Lw = LS[2], hq = Math.hypot(Lu, Lv, Lw + 1), Hu = Lu / hq, Hv = Lv / hq, Hw = (Lw + 1) / hq;
    for (let i = 0, o = 0; i < N; i++, o += 4) {
      if ((i & 1023) === 1023) yield 0;
      const m = B.MAT[i]; if (m < 0) continue;
      const nu = B.NU[i], nv = B.NV[i], nw = B.NW[i], cov = B.COV[i], tk = B.TK[i];
      const ndl = Math.max(0, nu * Lu + nv * Lv + nw * Lw), ndh = Math.max(0, nu * Hu + nv * Hv + nw * Hw), fr = Math.pow(1 - nw, 2.2);
      let r, gg, b, a;
      if (m === 3 || m === 4 || m === 0) {   // emerald crystal: deep inside, translucent bright faces, mint rims, white glints
        r = lerp(70, 5, tk); gg = lerp(214, 70, tk); b = lerp(160, 50, tk);
        const df = 0.42 + 0.78 * (0.55 * bands(ndl) + 0.45 * ndl); r *= df; gg *= df; b *= df;
        if (tier >= 2 && m === 3) { const q = B.QH[i]; r += 18 * (1 - q); gg += 30 * (1 - q); b += 20 * (1 - q); }
        r += 115 * fr * 0.75; gg += 232 * fr * 0.75; b += 182 * fr * 0.75;
        const sp = Math.pow(ndh, 70) * 1.5 + Math.pow(ndh, 14) * 0.22; r += 231 * sp; gg += 255 * sp; b += 246 * sp;
        a = (0.74 + 0.24 * tk) * cov;
      } else if (m === 1) {   // jade-silver metal
        const k = 0.6 * bands(ndl) + 0.4 * ndl; r = lerp(30, 214, k); gg = lerp(78, 250, k); b = lerp(64, 232, k);
        const sp = Math.pow(ndh, 40) * 1.6; r += 255 * sp; gg += 255 * sp; b += 250 * sp; r += 60 * fr; gg += 140 * fr; b += 110 * fr; a = cov;
      } else {   // the dark emerald shaft
        const k = 0.6 * bands(ndl) + 0.4 * ndl; r = lerp(4, 34, k); gg = lerp(30, 128, k); b = lerp(23, 98, k);
        r += 80 * fr * 0.6; gg += 200 * fr * 0.6; b += 160 * fr * 0.6; const sp = Math.pow(ndh, 34) * 0.7; r += 210 * sp; gg += 255 * sp; b += 235 * sp; a = cov;
      }
      // an ink edge on the outer silhouette, so it reads on any floor
      const sil = B.SIL[i]; if (sil < 2.2) { const ink = 0.4 + 0.6 * sstep(0, 2.2, sil); r *= ink; gg *= ink; b *= ink; }
      d[o] = r; d[o + 1] = gg; d[o + 2] = b; d[o + 3] = Math.min(255, a * 255); NL[i] = ndl;
    }
    // narrow mint-white lines where two facets of the head (or a fin) meet, brighter where the light catches them
    const MAT = B.MAT, FA = B.FA;
    for (let py = 1; py < Hh - 1; py++) for (let px = 1; px < W - 1; px++) { const i = py * W + px; if (MAT[i] !== 3 && MAT[i] !== 4) continue; const f = FA[i]; let edge = 0, lit = NL[i];
      for (const j of [i + 1, i + W]) { if ((MAT[j] === 3 || MAT[j] === 4) && FA[j] !== f) { edge = 1; lit = Math.max(lit, NL[j]); } }
      if (!edge) continue; const o = i * 4, k = 0.32 + 0.55 * lit; d[o] = lerp(d[o], 236, k); d[o + 1] = lerp(d[o + 1], 255, k); d[o + 2] = lerp(d[o + 2], 246, k); d[o + 3] = Math.max(d[o + 3], 220); if (px === W - 2 && (py & 31) === 31) yield 0; }
    yield 0; g.putImageData(im, 0, 0); yield 0;
    Object.assign(res, { cv, W, H: Hh, pad, cx, Lpx, th, ready: true });
  }
  /* the emissive layer at phase ph (0..1): currents of light running up the head to the tip, two fine spiral strands
     round the shaft, the pommel's glow; Celestial: a layered core (two crystals of light inside the head) and crescent
     ornaments with beads round the socket. Rotation-free: drawn turned with the spear */
  function* emisGen(tier, ph, Lpx, res) {
    const G = stripGeo(Lpx), { W, H: Hh, pad, cx } = G, N = W * Hh, E = new Float32Array(N), px1 = 1 / Lpx;
    const pulses = []; for (let i = 0; i < 3; i++) pulses.push(HU + 0.005 + (1 - HU) * ((ph + i / 3) % 1));
    for (let py = 0; py < Hh; py++) {
      const u = 1 - (py + 0.5 - pad) / Lpx;
      for (let px = 0; px < W; px++) {
        const v = (px + 0.5 - cx) / Lpx, av = Math.abs(v); let e = 0;
        const a = headA(u);
        if (a > 0 && av < a) { const q = av / a, cm = Math.exp(-(q / 0.42) * (q / 0.42)), k = (u - HU) / (1 - HU);
          e += 0.16 * Math.pow(1 - q, 1.2) * (0.6 + 0.4 * k);
          let P = 0; for (const p of pulses) { const z = (u - p) / 0.03; P += Math.exp(-z * z) * (0.35 + 0.65 * (p - HU) / (1 - HU)); } e += cm * P * 0.95;
          const rl = av / (0.9 * px1); e += Math.exp(-rl * rl) * 0.45 * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(TAU * (u * 7 - ph * 2))));
          if (tier >= 3) for (const kk of [0.56, 0.3]) { const z = (q / kk - 1) / (0.9 * px1 / (a * kk)); e += 0.5 * Math.exp(-z * z) * sstep(HU + 0.04, HU + 0.08, u) * (1 - sstep(0.95, 0.99, u)) * (0.7 + 0.3 * Math.sin(TAU * (u * 5 - ph))); }
          const tz = (u - 0.978) / 0.012, tv = v / 0.006; e += 0.9 * Math.exp(-tz * tz - tv * tv); }
        if (a > 0 && av < a + 2 * px1 && av >= a) e += 0.06;
        // the fins: a faint inner light (and their edges at Adept)
        { const dd = finD(u, av); if (dd > 0) { e += 0.1 + (tier >= 2 ? 0.35 * Math.exp(-Math.pow(dd / (1.1 * px1), 2)) : 0); } }
        // the shaft's two strands, spiralling up (the back half dimmer)
        if (u > 0.104 && u < 0.565) { const r = revR(u, tier) * 1.04; for (let s = 0; s < 2; s++) { const an = TAU * (u * 9) + s * Math.PI - ph * TAU, vs = r * Math.sin(an), fb = Math.cos(an) > 0 ? 1 : 0.28, z = (v - vs) / (0.75 * px1); e += fb * Math.exp(-z * z) * (0.5 + 0.5 * Math.sin(TAU * (u * 22 - ph * 3))) * 0.9; } }
        // the pommel's glow
        { const zu = (u - 0.04) / 0.026, zv = v / 0.026; e += 0.38 * Math.exp(-zu * zu - zv * zv); }
        // Celestial: crescent ornaments with beads round the socket
        if (tier >= 3) { const du = u - 0.612, dist = Math.hypot(du, v), ps = Math.atan2(av, du);
          for (const [rr, w0] of [[0.09, 1], [0.112, 0.6]]) { const z = (dist - rr) / (0.8 * px1); if (ps > 0.55 && ps < 2.55) e += 0.65 * w0 * Math.exp(-z * z) * sstep(0.55, 0.8, ps) * (1 - sstep(2.3, 2.55, ps)) * (0.6 + 0.4 * Math.sin(ps * 5 + TAU * ph)); }
          for (let k = 0; k < 3; k++) { const pb = 0.9 + k * 0.6 + 0.25 * Math.sin(TAU * ph + k), bu = 0.612 + Math.cos(pb) * 0.1, bv = Math.sin(pb) * 0.1, z = Math.hypot(u - bu, av - bv) / (1.6 * px1); e += 0.9 * Math.exp(-z * z); } }
        E[py * W + px] = e;
      }
      if (py & 1) yield 0;
    }
    // a soft halo round the light
    const B = E.slice(), br = Math.max(2, Math.round(Lpx * 0.018)); blur(B, W, Hh, br); yield 0;
    const cv = mk(W, Hh), g = cv.getContext('2d'); yield 0; const im = g.createImageData(W, Hh), d = im.data;
    for (let i = 0, o = 0; i < N; i++, o += 4) { if ((i & 2047) === 2047) yield 0; const e = E[i], al = cl(e + 0.9 * B[i]); if (al < 0.004) continue; const k = cl(e * 1.1);
      d[o] = lerp(22, 115, sstep(0, 0.45, k)) + (231 - 115) * sstep(0.45, 1, k); d[o + 1] = lerp(165, 232, sstep(0, 0.45, k)) + (255 - 232) * sstep(0.45, 1, k); d[o + 2] = lerp(123, 182, sstep(0, 0.45, k)) + (246 - 182) * sstep(0.45, 1, k); d[o + 3] = al * 255; }
    g.putImageData(im, 0, 0); yield 0;
    Object.assign(res, { cv, W, H: Hh, pad, cx, Lpx, ready: true });
  }
  function blur(A, W, Hh, r) { const tmp = new Float32Array(W * Hh);
    for (let pass = 0; pass < 2; pass++) {
      for (let y = 0; y < Hh; y++) { let acc = 0; const o = y * W; for (let x = -r; x < W + r; x++) { if (x + r < W) acc += A[o + Math.min(W - 1, x + r)]; if (x - r - 1 >= 0) acc -= A[o + x - r - 1]; if (x >= 0 && x < W) tmp[o + x] = acc / (2 * r + 1); } }
      for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y < Hh + r; y++) { if (y + r < Hh) acc += tmp[Math.min(Hh - 1, y + r) * W + x]; if (y - r - 1 >= 0) acc -= tmp[(y - r - 1) * W + x]; if (y >= 0 && y < Hh) A[y * W + x] = acc / (2 * r + 1); } } } }

  /* ================= the picture cache ================= */
  const NA = 36, NPH = 10, SS = 1.5, DA = TAU / NA;
  const SC = { frames: new Map(), queue: [], qset: new Set(), job: null, lpx: 0, built: 0, bakeMs: 0, maxSlice: 0, miss: 0 };
  const bkey = (tier, k) => 'b' + tier + '|' + k, ekey = (tier, k) => 'e' + tier + '|' + k;
  function want(key, front) { if (SC.frames.has(key) || (SC.job && SC.job.key === key)) return; if (SC.qset.has(key)) { if (front) { const i = SC.queue.indexOf(key); if (i > 0) { SC.queue.splice(i, 1); SC.queue.unshift(key); } } return; } SC.qset.add(key); if (front) SC.queue.unshift(key); else SC.queue.push(key); }
  function setScale(lpx) { if (SC.lpx && Math.abs(lpx / SC.lpx - 1) < 0.2) return; SC.frames.clear(); SC.queue.length = 0; SC.qset.clear(); SC.job = null; SC.lpx = lpx; }
  function bakeStep(ms) {
    const t0 = nowMs(), until = t0 + ms;
    while (nowMs() < until) {
      if (!SC.job) { let key = null; while (SC.queue.length && !key) { const k = SC.queue.shift(); SC.qset.delete(k); if (!SC.frames.has(k)) key = k; } if (!key) break;
        const tier = +key[1], k = +key.slice(3), res = {}; SC.job = { key, res, it: key[0] === 'b' ? bodyGen(tier, k * DA, SC.lpx, res) : emisGen(tier, k / NPH, SC.lpx, res) }; }
      const jb = SC.job; let done = false; while (nowMs() < until) { if (jb.it.next().done) { done = true; break; } }
      if (!done) break; SC.frames.set(jb.key, jb.res); SC.built++; SC.job = null;
    }
    const dt = nowMs() - t0; SC.bakeMs += dt; if (dt > SC.maxSlice) SC.maxSlice = dt;
  }
  let IDLE = false;
  function idleBake() { if (IDLE || !(SC.queue.length || SC.job)) return; IDLE = true; const go = () => { IDLE = false; idleBake(); };
    if (typeof requestIdleCallback === 'function') requestIdleCallback(dl => { bakeStep(dl.didTimeout ? 1 : Math.max(0.5, Math.min(4, dl.timeRemaining() - 1))); go(); }, { timeout: 150 });
    else setTimeout(() => { bakeStep(1.5); go(); }, 40); }
  const kOf = th => ((Math.round(th / DA) % NA) + NA) % NA;
  // the order: the held stance (both facings) and its light first, then the jump's main angles, then the rest
  function plan(tier) {
    for (const th of [0.18, -0.18]) want(bkey(tier, kOf(th)), false);
    want(ekey(tier, 0), false);
    for (const th of [0.5, -0.5, 0.06, -0.06, Math.PI, Math.PI + 0.1, Math.PI - 0.1]) want(bkey(tier, kOf(th)), false);
    for (let k = 1; k < NPH; k++) want(ekey(tier, k), false);
    const all = []; for (let k = 0; k < NA; k++) all.push(k); all.sort((a, b) => Math.abs(Math.cos(a * DA)) - Math.abs(Math.cos(b * DA))); for (const k of all) want(bkey(tier, k), false);
  }
  function bodyFrame(tier, th) { const k = kOf(th), key = bkey(tier, k), fr = SC.frames.get(key); if (fr) return fr; want(key, true); SC.miss++;
    for (let r = 1; r <= NA / 2; r++) for (const s of [1, -1]) { const f = SC.frames.get(bkey(tier, ((k + s * r) % NA + NA) % NA)); if (f) return f; } return null; }
  function emisFrame(tier, k) { const key = ekey(tier, k), fr = SC.frames.get(key); if (fr) return fr; want(key, true); for (let r = 1; r < NPH; r++) { const f = SC.frames.get(ekey(tier, (k + r) % NPH)); if (f) return f; } return null; }

  /* ================= effect sprites (made once) ================= */
  const RGB = h => hexRGB(h), rgba = (h, a) => { const [r, g, b] = RGB(h); return `rgba(${r},${g},${b},${cl(a)})`; };
  const radial = (g, S, stops) => { const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(0, 0, S, S); };
  // soft floor rings: e the bright wind edge, r a faint ripple, w the thin wind circle (thickness buckets)
  const RW = [0.04, 0.08, 0.14, 0.24];
  const ringSpr = (kind, b) => fxSprite('fjR' + kind + b, 256, 256, g => { const w = RW[b];
    const S = kind === 'e' ? [[0, 'rgba(22,165,123,0)'], [1 - w, 'rgba(22,165,123,0)'], [1 - 0.65 * w, 'rgba(22,165,123,0.35)'], [1 - 0.35 * w, 'rgba(115,232,182,0.85)'], [1 - 0.17 * w, 'rgba(231,255,246,0.95)'], [1 - 0.05 * w, 'rgba(115,232,182,0.3)'], [1, 'rgba(115,232,182,0)']]
      : [[0, 'rgba(22,165,123,0)'], [1 - w, 'rgba(22,165,123,0)'], [1 - 0.7 * w, 'rgba(22,165,123,0.22)'], [1 - 0.5 * w, 'rgba(160,240,205,0.7)'], [1 - 0.3 * w, 'rgba(22,165,123,0.22)'], [1, 'rgba(22,165,123,0)']];
    radial(g, 256, S); });
  const pickB = (t, r) => { const q = t / Math.max(1, r); let b = 0; for (let i = 1; i < RW.length; i++) if (Math.abs(RW[i] - q) < Math.abs(RW[b] - q)) b = i; return b; };
  function ringF(c, kind, X, Y, r, t, a) { if (r < 2 || !(a > 0.01)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(ringSpr(kind, pickB(t, r)), X - r, Y - r * GY, r * 2, r * 2 * GY); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  function glowF(c, X, Y, r, col, a, gy) { if (r < 1 || !(a > 0.006)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); const ry = r * (gy || 1); c.drawImage(glowSprite(col), X - r, Y - ry, r * 2, ry * 2); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
  // the landing seal: two feathered rings, wind-curl ticks, a four-point star, a ring of small diamonds (outer, static)
  // and an inner ring of comma-shaped swirls (turning the other way)
  const sealSpr = part => fxSprite('fjSeal' + part, 256, 256, g => { const c0 = 128; g.translate(c0, c0); g.lineCap = 'round'; g.lineJoin = 'round';
    const soft = (draw, col, lws) => { for (const [lw, a] of lws) { g.strokeStyle = rgba(col, a); g.lineWidth = lw; draw(); g.stroke(); } };
    const L3 = [[7, 0.12], [3.2, 0.4], [1.3, 0.95]];
    if (part === 0) {
      soft(() => { g.beginPath(); g.arc(0, 0, 118, 0, TAU); }, MINT, L3); soft(() => { g.beginPath(); g.arc(0, 0, 104, 0, TAU); }, EMER, [[5, 0.15], [2, 0.5], [0.9, 0.9]]);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, big = i % 4 === 0; g.save(); g.rotate(a); soft(() => { g.beginPath(); g.moveTo(0, -104); g.quadraticCurveTo(big ? 9 : 5, -96, 0, big ? -84 : -92); }, AIR, [[4, 0.12], [1.6, 0.55], [0.8, 0.9]]);
        if (big) { g.fillStyle = rgba(AIR, 0.9); g.beginPath(); g.moveTo(0, -126); g.lineTo(4, -118); g.lineTo(0, -110); g.lineTo(-4, -118); g.closePath(); g.fill(); } g.restore(); }
      // the four-point star of the centre and its soft light
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 70); gr.addColorStop(0, 'rgba(231,255,246,0.55)'); gr.addColorStop(0.4, 'rgba(115,232,182,0.2)'); gr.addColorStop(1, 'rgba(22,165,123,0)'); g.fillStyle = gr; g.fillRect(-70, -70, 140, 140);
      soft(() => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU - Math.PI / 2, r = i % 2 ? 9 : 42; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); }, AIR, [[6, 0.12], [2.4, 0.45], [1, 0.95]]);
    } else {
      soft(() => { g.beginPath(); g.arc(0, 0, 76, 0, TAU); }, MINT, [[6, 0.1], [2.4, 0.4], [1, 0.85]]);
      for (let i = 0; i < 6; i++) { g.save(); g.rotate(i / 6 * TAU); soft(() => { g.beginPath(); g.moveTo(0, -74); g.bezierCurveTo(26, -74, 34, -50, 18, -38); g.bezierCurveTo(8, -32, 0, -42, 8, -48); }, AIR, [[6, 0.1], [2.6, 0.4], [1.1, 0.95]]); g.restore(); }
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; g.fillStyle = rgba(i % 2 ? MINT : AIR, 0.8); g.beginPath(); g.arc(Math.cos(a) * 90, Math.sin(a) * 90, i % 2 ? 1.2 : 2, 0, TAU); g.fill(); }
    } });
  // the contact core: hot white point, mint and emerald round it, eight soft rays
  const coreSpr = () => fxSprite('fjCore', 128, 128, g => { g.globalCompositeOperation = 'lighter'; radial(g, 128, [[0, 'rgba(255,255,255,1)'], [0.1, 'rgba(231,255,246,0.95)'], [0.26, 'rgba(115,232,182,0.6)'], [0.55, 'rgba(22,165,123,0.2)'], [1, 'rgba(22,165,123,0)']]);
    for (let i = 0; i < 8; i++) { g.save(); g.translate(64, 64); g.rotate(i / 8 * TAU + 0.2); g.scale(1, i % 2 ? 0.05 : 0.08); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 62); gr.addColorStop(0, 'rgba(231,255,246,0.75)'); gr.addColorStop(0.5, 'rgba(115,232,182,0.25)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(-64, -64, 128, 128); g.restore(); } });
  // a curved blade of air: a feathered crescent with a bright leading edge (drawn on the floor plane, convex side out)
  const bladeSpr = () => fxSprite('fjBlade', 96, 48, (g, w, h) => { g.translate(w / 2, h * 0.95);
    const cres = (R, th, sp) => { g.beginPath(); g.arc(0, R * 0.92, R, -Math.PI / 2 - sp, -Math.PI / 2 + sp); g.arc(0, R * 0.92 + th, R + th * 0.1, -Math.PI / 2 + sp * 0.86, -Math.PI / 2 - sp * 0.86, true); g.closePath(); };
    for (const [R, th, col] of [[w * 0.48, h * 0.5, 'rgba(22,165,123,0.16)'], [w * 0.47, h * 0.34, 'rgba(115,232,182,0.32)'], [w * 0.46, h * 0.18, 'rgba(160,245,210,0.6)'], [w * 0.45, h * 0.07, 'rgba(231,255,246,0.95)']]) { cres(R, th, 0.95); g.fillStyle = col; g.fill(); } });
  // a vertical streak of wind light (bright head at the bottom, fading up), and the dive's narrow cone of compressed air
  const streakSpr = () => fxSprite('fjStreak', 16, 128, g => { const gx = g.createLinearGradient(0, 0, 16, 0); gx.addColorStop(0, 'rgba(115,232,182,0)'); gx.addColorStop(0.35, 'rgba(115,232,182,0.45)'); gx.addColorStop(0.5, 'rgba(240,255,250,0.95)'); gx.addColorStop(0.65, 'rgba(115,232,182,0.45)'); gx.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gx; g.fillRect(0, 0, 16, 128);
    g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, 0, 0, 128); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.65, 'rgba(0,0,0,0.55)'); gy.addColorStop(0.94, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gy; g.fillRect(0, 0, 16, 128); });
  const coneSpr = () => fxSprite('fjCone', 64, 192, (g, w, h) => {
    // (apex at the bottom; the body a soft wedge with bright rims and fine compressed streaks inside)
    const wedge = (k, col) => { g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2 - w * 0.5 * k, 0); g.lineTo(w / 2 + w * 0.5 * k, 0); g.closePath(); g.fillStyle = col; g.fill(); };
    wedge(1, 'rgba(22,165,123,0.12)'); wedge(0.75, 'rgba(115,232,182,0.14)'); wedge(0.45, 'rgba(160,245,210,0.18)');
    g.lineCap = 'round'; for (const s of [-1, 1]) for (const [lw, a] of [[6, 0.12], [2.6, 0.35], [1.1, 0.8]]) { g.strokeStyle = `rgba(200,255,232,${a})`; g.lineWidth = lw; g.beginPath(); g.moveTo(w / 2, h - 2); g.quadraticCurveTo(w / 2 + s * w * 0.18, h * 0.5, w / 2 + s * w * 0.46, 2); g.stroke(); }
    for (let i = 0; i < 7; i++) { const k = (i / 6 - 0.5) * 0.7; g.strokeStyle = 'rgba(231,255,246,0.4)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(w / 2 + k * w * 0.08, h * (0.85 - 0.1 * R1(i))); g.lineTo(w / 2 + k * w * 0.9, h * (0.05 + 0.2 * R1(i + 3))); g.stroke(); }
    g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.45, 'rgba(0,0,0,0.75)'); gy.addColorStop(0.92, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,0.4)'); g.fillStyle = gy; g.fillRect(0, 0, w, h); });
  // the fountain's strand opening into an outward curl (drawn for the right side; mirrored for the left)
  const curlSpr = () => fxSprite('fjCurl', 96, 128, (g, w, h) => { g.lineCap = 'round'; g.lineJoin = 'round';
    const path = () => { g.beginPath(); g.moveTo(14, h - 2); g.bezierCurveTo(10, h * 0.55, 18, h * 0.22, 44, h * 0.12); g.bezierCurveTo(70, h * 0.04, 88, h * 0.2, 80, h * 0.36); g.bezierCurveTo(74, h * 0.48, 58, h * 0.44, 60, h * 0.32); };
    for (const [lw, col] of [[11, 'rgba(22,165,123,0.12)'], [6, 'rgba(115,232,182,0.28)'], [3, 'rgba(170,246,214,0.6)'], [1.2, 'rgba(240,255,250,0.95)']]) { path(); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
    g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, h, 0, 0); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.3, 'rgba(0,0,0,1)'); gy.addColorStop(1, 'rgba(0,0,0,1)'); g.fillStyle = gy; g.fillRect(0, 0, w, h); });
  // Adept's finale: two interwoven rings (each wavering in and out of the other)
  const twinSpr = () => fxSprite('fjTwin', 256, 256, g => { g.translate(128, 128); g.lineJoin = 'round';
    for (let s = 0; s < 2; s++) for (const [lw, col] of [[8, 'rgba(22,165,123,0.14)'], [3.4, 'rgba(115,232,182,0.45)'], [1.3, 'rgba(240,255,250,0.95)']]) { g.beginPath(); for (let i = 0; i <= 160; i++) { const a = i / 160 * TAU, r = 112 * (1 + (s ? 1 : -1) * 0.055 * Math.sin(5 * a)); g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); } });
  // Celestial's finale: a bloom of broad curved currents (seven swept arms, feathered)
  const bloomSpr = () => fxSprite('fjBloom', 320, 320, g => { g.translate(160, 160); g.lineCap = 'round';
    const radialG = g.createRadialGradient(0, 0, 0, 0, 0, 160); radialG.addColorStop(0, 'rgba(231,255,246,0.35)'); radialG.addColorStop(0.3, 'rgba(115,232,182,0.14)'); radialG.addColorStop(1, 'rgba(22,165,123,0)'); g.fillStyle = radialG; g.fillRect(-160, -160, 320, 320);
    for (let i = 0; i < 7; i++) { g.save(); g.rotate(i / 7 * TAU);
      const arm = (k) => { g.beginPath(); g.moveTo(10, 0); g.bezierCurveTo(60, -10 * k, 110, 20 * k, 148, 70 * k); };
      for (const [lw, col] of [[26, 'rgba(22,165,123,0.08)'], [15, 'rgba(115,232,182,0.16)'], [7, 'rgba(170,246,214,0.38)'], [2.4, 'rgba(240,255,250,0.85)']]) { arm(1); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
      for (const [lw, col] of [[9, 'rgba(115,232,182,0.12)'], [2.6, 'rgba(255,200,226,0.35)']]) { g.beginPath(); g.moveTo(30, 6); g.bezierCurveTo(70, 4, 104, 34, 124, 82); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
      g.restore(); } });
  // the crater of light a landing leaves: a bright rim, a soft emerald hollow, rays of light cracking outward (light only)
  const craterSpr = () => fxSprite('fjCrater', 256, 256, g => { radial(g, 256, [[0, 'rgba(231,255,246,0.2)'], [0.25, 'rgba(115,232,182,0.14)'], [0.6, 'rgba(22,165,123,0.16)'], [0.72, 'rgba(115,232,182,0.55)'], [0.78, 'rgba(231,255,246,0.75)'], [0.86, 'rgba(115,232,182,0.25)'], [1, 'rgba(22,165,123,0)']]);
    g.translate(128, 128); g.lineCap = 'round'; for (let i = 0; i < 14; i++) { const a = i / 14 * TAU + R1(i) * 0.3, L = 70 + 45 * R1(i + 7); g.save(); g.rotate(a); for (const [lw, col] of [[7, 'rgba(22,165,123,0.15)'], [3, 'rgba(115,232,182,0.4)'], [1.1, 'rgba(231,255,246,0.85)']]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(22, 0); g.quadraticCurveTo(L * 0.6, (R1(i + 3) - 0.5) * 18, L, (R1(i + 5) - 0.5) * 10); g.stroke(); } g.restore(); } });
  // a vertical column of wind: a soft core with spiral bands, faded at its foot (so the pet stays clear) and its top
  const columnSpr = () => fxSprite('fjColumn', 64, 256, (g, w, h) => { const gx = g.createLinearGradient(0, 0, w, 0); gx.addColorStop(0, 'rgba(22,165,123,0)'); gx.addColorStop(0.25, 'rgba(22,165,123,0.25)'); gx.addColorStop(0.42, 'rgba(115,232,182,0.55)'); gx.addColorStop(0.5, 'rgba(240,255,250,0.85)'); gx.addColorStop(0.58, 'rgba(115,232,182,0.55)'); gx.addColorStop(0.75, 'rgba(22,165,123,0.25)'); gx.addColorStop(1, 'rgba(22,165,123,0)'); g.fillStyle = gx; g.fillRect(0, 0, w, h);
    g.lineCap = 'round'; for (let i = 0; i < 14; i++) { const y0 = i / 14 * h; for (const [lw, col] of [[4, 'rgba(115,232,182,0.25)'], [1.4, 'rgba(240,255,250,0.7)']]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(w * 0.12, y0 + 10); g.quadraticCurveTo(w * 0.5, y0 - 8, w * 0.88, y0 + 4); g.stroke(); } }
    g.globalCompositeOperation = 'destination-in'; const gy = g.createLinearGradient(0, 0, 0, h); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.25, 'rgba(0,0,0,0.8)'); gy.addColorStop(0.62, 'rgba(0,0,0,1)'); gy.addColorStop(0.82, 'rgba(0,0,0,0.35)'); gy.addColorStop(1, 'rgba(0,0,0,0.05)'); g.fillStyle = gy; g.fillRect(0, 0, w, h); });
  // a great petal of wind: a curved translucent sheet (pointing up the picture), mint edges, a pale vein, folds (two shapes)
  const sheetSpr = v => fxSprite('fjSheet' + v, 96, 192, (g, w, h) => { g.translate(w / 2, h - 4); const L = h - 10, bw = w * (v ? 0.38 : 0.46), cv = v ? 0.18 : -0.12;
    const shape = k => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-bw * k, -L * 0.25, -bw * k * (1 + cv), -L * 0.7, cv * w * 0.3, -L * (0.55 + 0.45 * k)); g.bezierCurveTo(bw * k * (1 - cv), -L * 0.72, bw * k, -L * 0.25, 0, 0); g.closePath(); };
    for (const [k, col] of [[1, 'rgba(22,165,123,0.16)'], [0.8, 'rgba(60,200,150,0.18)'], [0.55, 'rgba(140,240,200,0.2)'], [0.28, 'rgba(220,255,240,0.22)']]) { shape(k); const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, 'rgba(255,255,255,0.3)'); gr.addColorStop(0.3, col); gr.addColorStop(1, col); g.fillStyle = gr; g.fill(); }
    g.lineJoin = 'round'; for (const [lw, col] of [[8, 'rgba(115,232,182,0.14)'], [3.2, 'rgba(160,246,212,0.45)'], [1.3, 'rgba(240,255,250,0.95)']]) { shape(1); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
    for (const [lw, col] of [[4, 'rgba(115,232,182,0.2)'], [1, 'rgba(240,255,250,0.7)']]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(-bw * 0.15, -L * 0.5, cv * w * 0.3, -L * 0.95); g.stroke(); }
    for (let i = 1; i <= 3; i++) { g.strokeStyle = 'rgba(200,255,232,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-bw * 0.5, -L * (0.2 + 0.18 * i)); g.quadraticCurveTo(0, -L * (0.26 + 0.18 * i), bw * 0.5, -L * (0.2 + 0.18 * i)); g.stroke(); } });
  // a leaf (two greens) and a petal (two pinks), each in 16 turns
  const NROT = 16;
  const leafSpr = (v, b) => fxSprite('fjLeaf' + v + '|' + b, 24, 24, g => { g.translate(12, 12); g.rotate(b / NROT * TAU); const L = 9;
    g.beginPath(); g.moveTo(0, -L); g.bezierCurveTo(L * 0.62, -L * 0.45, L * 0.5, L * 0.55, 0, L); g.bezierCurveTo(-L * 0.5, L * 0.55, -L * 0.62, -L * 0.45, 0, -L); g.closePath();
    const gr = g.createLinearGradient(-L, -L, L, L); gr.addColorStop(0, v ? '#C8F09A' : '#9BE38E'); gr.addColorStop(0.5, v ? '#7CC860' : '#4FB874'); gr.addColorStop(1, v ? '#3E8C3A' : '#1F7A55'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(20,70,40,0.55)'; g.lineWidth = 0.8; g.stroke();
    g.strokeStyle = 'rgba(235,255,220,0.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -L * 0.8); g.quadraticCurveTo(L * 0.08, 0, 0, L * 0.85); g.stroke(); });
  const petalSpr = (v, b) => fxSprite('fjPetal' + v + '|' + b, 22, 22, g => { g.translate(11, 11); g.rotate(b / NROT * TAU); const L = 8.5; g.translate(0, L * 0.45);
    g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-L * 0.62, -L * 0.25, -L * 0.6, -L * 0.9, -L * 0.16, -L); g.lineTo(0, -L * 0.86); g.lineTo(L * 0.16, -L); g.bezierCurveTo(L * 0.6, -L * 0.9, L * 0.62, -L * 0.25, 0, 0); g.closePath();
    const gr = g.createLinearGradient(0, 0, 0, -L); gr.addColorStop(0, v ? '#F59AC6' : ROSE); gr.addColorStop(0.45, v ? '#FFD6E9' : PINK); gr.addColorStop(1, '#FFF2F8'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(222,90,154,0.45)'; g.lineWidth = 0.7; g.stroke(); });
  // a soft puff of dust (warm grey, lit from the upper left)
  const puffSpr = () => fxSprite('fjPuff', 48, 48, g => { radial(g, 48, [[0, 'rgba(206,214,196,0.5)'], [0.55, 'rgba(186,196,176,0.22)'], [1, 'rgba(186,196,176,0)']]); });
  const WARM = [() => craterSpr(), () => columnSpr(), () => sheetSpr(0), () => sheetSpr(1), () => curlSpr(), () => twinSpr(), () => bloomSpr(), () => coreSpr(), () => bladeSpr(), () => streakSpr(), () => coneSpr(), () => curlSpr(), () => puffSpr(), () => sealSpr(0), () => sealSpr(1)];
  for (const k of ['e', 'r']) for (let b = 0; b < RW.length; b++) WARM.push(() => ringSpr(k, b));
  for (let v = 0; v < 2; v++) for (let b = 0; b < NROT; b++) { WARM.push(() => leafSpr(v, b)); WARM.push(() => petalSpr(v, b)); }

  /* ================= the move ================= */
  const FORM = 0.95, PREP = 0.45, GROUND = 0.24, ENDD = 1.3, BAKE_L = 2.04;   // (pictures baked for a 2.04-tile spear, whatever the pet's size: one set serves every pet)
  U.fujin = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), tier = tierOf(ev), K = C.K || 1, DK = C.base * K * (1 + 0.08 * (ev - 1));
    const N = ev >= 7 ? 7 : ev >= 4 ? 5 : 3, TOT = 2 * (14 + (ev - 1)) * DK;
    const WJ = []; for (let j = 0; j < N; j++) WJ.push((1 + 0.3 * j) * (j === N - 1 ? 1.45 : 1)); const WS = WJ.reduce((a, b) => a + b, 0);
    const petHT = () => { const SZ = Math.max(0.6, ((me.r || 0.3) - 0.2) / 0.1), g = H.g; return 1.02 * SZ * (g.pw && g.pw.giant ? 1.35 : 1) * (g.petK || 1); };
    const hT = petHT(), LS_T = Math.max(1.5, Math.min(2.5, 2.0 * hT));   // the spear: about twice the pet's height (tiles)
    const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, RES = Math.min(2, Math.max(1, dpr));
    setScale(BAKE_L * H.X.Tz() * RES * SS); plan(tier);
    H.X.banner('FUJIN', '', C.col, 1.4); H.X.sfx.hum(); me.castT = 0;
    // the spear's grip (pet-local, in pet heights: forward, up) in each stance, and how far the tip hangs below the feet in the dive
    const HAND_DIVE = [0.34, 0.38], GF_DIVE = 0.27, LEAN_DIVE = 0.08;
    const zc = (1 - GF_DIVE) * LS_T * Math.cos(LEAN_DIVE) - HAND_DIVE[1] * hT;
    // the schedule
    const J = []; { let t = FORM + PREP;
      for (let j = 0; j < N; j++) { const fin = j === N - 1, A = 0.34 + 0.03 * j + (fin ? 0.14 : 0), Hd = fin ? 0.58 : 0.17 + 0.01 * j, D = fin ? 0.2 : 0.13 + 0.01 * j;
        let za = 2.0 + 0.3 * j; if (fin) za = za * 1.25 + 0.35; za = Math.max(za, zc + 1.0);
        const Cc = t + A + Hd + D, vC = 2 * (za - zc) / D, Ld = Cc + zc / (0.85 * vC);
        const R = (1.45 + 0.17 * j) * K * (fin ? 1.82 : 1), q = { j, fin, L: t, A, Hd, D, C: Cc, Ld, za, vC, R, dmg: TOT * WJ[j] / WS, kj: 1 + 0.12 * j + (fin ? 0.25 : 0), hit: new Set(), n: 0, fired: false, launched: false, x0: 0, y0: 0, x1: 0, y1: 0, tgt: null };
        J.push(q); t = Ld + (fin ? 0 : GROUND); } }
    const LAST = J[N - 1], E0 = LAST.Ld + 0.12; let endAt = E0;
    const LIFE = E0 + ENDD + 0.05;
    const fx0 = me.face < 0 ? -1 : 1; let fxF = fx0;   // the facing (screen): +1 right
    const hold = { vx: 0, vy: 0, t: 0.12 };
    let WI = 0, ended = false, dead = false, lastT = 0, glowK = 0, prevTgt = null, ribbonA = 0; const TGN = new Map();

    /* ---- the pet's pose at time t: z (tiles), sq, arms [front, back], foot, lean (face-relative), spear angle al
       (face-relative, unwrapped; 0 tip up, + forward), grip gf (fraction from the butt), hand (pet-local, heights) ---- */
    const P = { z: 0, sq: 0, armF: 0, armB: 0, foot: 0, lean: 0, al: 0.18, gf: 0.22, hx: 0.36, hy: 0.45, ph: 'form', j: 0, u: 0, tip: 1 };
    const io = u => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);
    function jumpAt(t) { let j = 0; while (j + 1 < N && t >= J[j + 1].L) j++; return J[j]; }
    function poseAt(t, o) {
      o.tip = 1;
      if (t < FORM) { const k = sm(t / 0.4); Object.assign(o, { ph: 'form', z: 0, sq: 0.05 * k, armF: 60 * k, armB: 10 * k, foot: 0, lean: 0, al: 0.18, gf: 0.22, hx: 0.36, hy: 0.45, j: 0, u: t / FORM }); return o; }
      if (t < J[0].L) { const u = (t - FORM) / PREP; Object.assign(o, { ph: 'prep', z: 0, sq: 0.05 + 0.4 * sm(u / 0.7), armF: lerp(60, 72, sm(u)), armB: lerp(10, -28, sm(u)), foot: 0, lean: -0.1 * sm(u), al: lerp(0.18, 0.5, sm(u)), gf: lerp(0.22, 0.27, sm(u)), hx: 0.36, hy: lerp(0.45, 0.38, sm(u)), j: 0, u }); return o; }
      if (t >= endAt && t >= LAST.Ld) return endPose(t, o);
      const q = jumpAt(t), base = q.j * TAU, nx = J[q.j + 1];
      if (t < q.L) return o;
      if (t < q.L + q.A) { const u = (t - q.L) / q.A, pre = q.j ? 0.42 : 0.45;
        o.ph = 'asc'; o.j = q.j; o.u = u; o.z = q.za * (1 - Math.pow(1 - u, 2.2));
        o.sq = u < 0.08 ? lerp(pre, -0.55, sm(u / 0.08)) : -0.55 * (1 - sm((u - 0.08) / 0.85));
        o.armF = lerp(72, 150, sm(u / 0.2)); o.armB = u < 0.25 ? lerp(-28, 105, sm(u / 0.25)) : lerp(105, 70, sm((u - 0.25) / 0.75)); o.foot = lerp(3.5, 0.5, sm(u));
        o.lean = lerp(-0.1, 0, sm(u / 0.4)); o.al = base + lerp(0.5, 0.06, sm(u / 0.3)); o.gf = 0.27; o.hx = lerp(0.36, 0.3, sm(u / 0.2)); o.hy = lerp(0.38, 0.68, sm(u / 0.2)); return o; }
      if (t < q.L + q.A + q.Hd) { const u = (t - q.L - q.A) / q.Hd, tu = io(sm(u / (q.fin ? 0.5 : 0.85)));
        o.ph = 'apex'; o.j = q.j; o.u = u; o.z = q.za * (1 + 0.025 * Math.sin(Math.PI * u));
        o.sq = 0.22 * Math.sin(Math.PI * Math.min(1, u / (q.fin ? 0.5 : 0.85))) - 0.1 * sm((u - 0.7) / 0.3);
        o.armF = lerp(150, -22, tu); o.armB = lerp(70, 118, tu); o.foot = lerp(0.5, -2.5, tu);
        o.lean = 0.6 * Math.sin(Math.PI * tu) + LEAN_DIVE * tu; o.al = base + lerp(0.06, Math.PI, tu); o.gf = 0.27; o.hx = lerp(0.3, HAND_DIVE[0], tu); o.hy = lerp(0.68, HAND_DIVE[1], tu); return o; }
      if (t < q.C) { const u = (t - q.L - q.A - q.Hd) / q.D;
        o.ph = 'dive'; o.j = q.j; o.u = u; o.z = q.za - (q.za - zc) * u * u; o.sq = lerp(-0.1, -0.38, sm(u / 0.3));
        o.armF = -22; o.armB = 118; o.foot = -2.5; o.lean = LEAN_DIVE; o.al = base + Math.PI; o.gf = GF_DIVE; o.hx = HAND_DIVE[0]; o.hy = HAND_DIVE[1]; return o; }
      // after contact: the tip is planted, sinking a little; the pet slides down the shaft and lands
      if (t < q.Ld) { const tau = t - q.C, z = Math.max(0, zc - 0.85 * q.vC * tau), s = Math.min(0.24 * hT, 0.3 * 0.85 * q.vC * tau);
        o.ph = 'plant'; o.j = q.j; o.u = tau / (q.Ld - q.C); o.z = z; o.sq = lerp(-0.38, 0.25, o.u);
        o.armF = lerp(-22, 10, o.u); o.armB = lerp(118, 60, o.u); o.foot = lerp(-2.5, 0, o.u); o.lean = LEAN_DIVE; o.al = base + Math.PI; o.hx = HAND_DIVE[0]; o.hy = HAND_DIVE[1];
        o.gf = Math.min(0.78, 1 - (z + HAND_DIVE[1] * hT + s) / LS_T); return o; }
      // on the ground: the squash of the landing, the pull and a forward twirl, the gather for the next launch
      { const tau = t - q.Ld, Gd = nx ? nx.L - q.Ld : 0.6, s0 = q.fin ? 1.05 : 0.75 + 0.03 * q.j, sq = s0 * Math.exp(-9 * tau) * Math.cos(15 * tau) + (nx ? 0.42 * sm(tau / Gd) * (1 - Math.exp(-10 * tau)) : 0);
        const sLand = 0.24 * hT, gfL = Math.min(0.78, 1 - (HAND_DIVE[1] * hT + sLand) / LS_T), pull = sm((tau - 0.03) / 0.1), spin = sm((tau - 0.09) / Math.max(0.05, Gd - 0.09));
        o.ph = 'ground'; o.j = q.j; o.u = tau / Gd; o.z = 0; o.sq = sq;
        o.armF = lerp(10, 140, pull) * (1 - spin) + 72 * spin; o.armB = lerp(60, 40, pull) * (1 - spin) - 28 * spin; o.foot = 0;
        o.lean = LEAN_DIVE * Math.exp(-10 * tau) + 0.18 * Math.exp(-8 * tau) * Math.sin(Math.min(Math.PI, tau * 18)) - 0.1 * spin;
        o.al = base + Math.PI + (Math.PI + 0.5) * spin; o.hx = lerp(HAND_DIVE[0], 0.36, spin); o.hy = lerp(HAND_DIVE[1], 0.62, pull) * (1 - spin) + 0.38 * spin; o.gf = lerp(gfL, 0.27, sm((tau - 0.05) / Math.max(0.05, Gd - 0.05)));
        return o; }
    }
    // the ending: pulled free, a twirl back to its upright stance (the butt on the floor), then it dissolves tip-first
    function endPose(t, o) { const tau = t - endAt, q = LAST, base = q.j * TAU, sLand = 0.24 * hT, gfL = Math.min(0.78, 1 - (HAND_DIVE[1] * hT + sLand) / LS_T), pull = sm((tau + 0.09) / 0.12), spin = sm((tau - 0.05) / 0.35), rel = sm((tau - 0.45) / 0.5);
      const sq = (q.fin ? 1.05 : 0.75) * Math.exp(-9 * (t - q.Ld)) * Math.cos(15 * (t - q.Ld));
      Object.assign(o, { ph: 'end', j: q.j, u: tau / ENDD, z: 0, sq: sq * (1 - rel), foot: 0, lean: (LEAN_DIVE + 0.06 * Math.sin(Math.PI * spin)) * (1 - spin),
        armF: (lerp(10, 130, pull) * (1 - spin) + 60 * spin) * (1 - rel), armB: (lerp(60, 30, pull) * (1 - spin) + 10 * spin) * (1 - rel),
        al: base + Math.PI + (Math.PI + 0.18) * spin, hx: lerp(HAND_DIVE[0], 0.36, spin), hy: lerp(lerp(HAND_DIVE[1], 0.6, pull), 0.45, spin), gf: lerp(gfL, 0.22, spin), tip: 1 - sm((tau - 0.42) / 0.55) });
      return o; }
    const SM = { sq: 0, armF: 0, armB: 0, foot: 0, lean: 0 };
    function applyPet(dt) {
      const k = Math.min(1, dt * 40); for (const key in SM) SM[key] += (P[key] - SM[key]) * (key === 'sq' ? Math.min(1, dt * 55) : k);
      me.z = Math.max(0, P.z); me.hopSq = SM.sq; me.hopArmS = [SM.armF, SM.armB]; me.hopFoot = SM.foot; me.hopLean = SM.lean * fxF;
    }
    function clearPet() { me.z = 0; me.hopSq = 0; me.hopArmS = null; me.hopFoot = 0; me.hopLean = 0; me.hopDX = 0; me.hopDY = 0; if (me.push === hold) me.push = null; }

    /* ---- where things are on screen ---- */
    const feet = T => [H.sx(me.x + (me.hopDX || 0)), H.sy(me.y + (me.hopDY || 0)) + 0.18 * T - (me.z || 0) * T];
    // a point of the pet (forward lx, up ly, in pet heights) as it is drawn now: squashed about the feet, leant about its middle
    function petPt(lx, ly, T, F) { const hp = hT * T, sqv = me.hopSq || 0, sxs = 1 + sqv * 0.3, sys = 1 - sqv * 0.3, rot = (me.tilt || 0) + (me.hopLean || 0);
      const x = fxF * lx * hp * sxs, y = -ly * hp * sys + 0.5 * hp, c = Math.cos(rot), s = Math.sin(rot); return [F[0] + x * c - y * s, F[1] + x * s + y * c - 0.5 * hp]; }
    // the spear this frame: the grip on screen, its screen angle, the tip and butt
    const SP = { gx: 0, gy: 0, th: 0, tipX: 0, tipY: 0, buX: 0, buY: 0, Lp: 0, gf: 0.25, ok: false, floorY: 0 };
    function spearNow(T) { const F = feet(T), g = petPt(P.hx, P.hy, T, F), rot = (me.tilt || 0) + (me.hopLean || 0), th = fxF * P.al + rot, Lp = LS_T * T, su = Math.sin(th), cu = -Math.cos(th);
      Object.assign(SP, { gx: g[0], gy: g[1], th, Lp, gf: P.gf, tipX: g[0] + su * (1 - P.gf) * Lp, tipY: g[1] + cu * (1 - P.gf) * Lp, buX: g[0] - su * P.gf * Lp, buY: g[1] - cu * P.gf * Lp, ok: true, floorY: H.sy(me.y) + 0.18 * T }); return SP; }
    const toW = (X, Y) => { const T = H.X.Tz(); return [me.x + (X - H.sx(me.x)) / T, me.y + (Y - (H.sy(me.y) + 0.18 * T)) / T]; };   // (a screen point on the floor plane as a floor position)

    /* ---- targeting between jumps ---- */
    function clearTo(x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.2)); let lx = x0, ly = y0; for (let i = 1; i <= n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, y = y0 + (y1 - y0) * u; if (H.X.blocked(x, y, (me.r || 0.3) + 0.05, 0)) break; lx = x; ly = y; } return [lx, ly]; }
    function aim(q) {
      const list = H.sortNear(me.x, me.y).filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 6.5);
      let tg = null, bs = 1e9; for (const m of list) { const d = Math.hypot(m.x - me.x, m.y - me.y), sc = d + (list.length > 1 ? (m === prevTgt ? 3.2 : 0) + 1.1 * (TGN.get(m) || 0) : 0) + (q.j === 0 && isFinite(C.tx) ? 0.25 * Math.hypot(m.x - C.tx, m.y - C.ty) : 0); if (sc < bs) { bs = sc; tg = m; } }
      let tx = me.x, ty = me.y;
      if (tg) { let gx = 0, gy = 0, gw = 0; for (const m of list) { const d = Math.hypot(m.x - tg.x, m.y - tg.y); if (d < 1.6) { const w = 1 - d / 1.9; gx += m.x * w; gy += m.y * w; gw += w; } } gx /= gw; gy /= gw;
        tx = lerp(tg.x, gx, 0.5); ty = lerp(tg.y, gy, 0.5);
        // (beside a big monster, not inside it: the spear lands at its edge, toward the pet)
        const dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy), off = tg.boss || tg.r > 0.6 ? tg.r * 0.75 + 0.2 : 0.15; if (d > 1e-3) { const k = Math.max(0, d - off) / d; tx = me.x + dx * k; ty = me.y + dy * k; } }
      else if (q.j === 0 && isFinite(C.tx)) { const dx = C.tx - me.x, dy = C.ty - me.y, d = Math.hypot(dx, dy); if (d > 0.3) { const k = Math.min(1.6, d) / d; tx = me.x + dx * k; ty = me.y + dy * k; } }
      // (capped per jump, and only as far as the floor is clear)
      { const dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy), cap = 3.2 + 0.25 * q.j; if (d > cap) { tx = me.x + dx / d * cap; ty = me.y + dy / d * cap; } }
      // (the spear lands a little to the pet's forward side: the pet lands that much short of the spot)
      const fwd = Math.abs(tx - me.x) > 0.2 ? Math.sign(tx - me.x) : fxF, sideOff = fwd * HAND_DIVE[0] * hT; tx -= sideOff;
      let w = H.walk(tx, ty); if (Math.hypot(w.x - tx, w.y - ty) > 1.2) w = { x: me.x, y: me.y };
      const p = clearTo(me.x, me.y, w.x, w.y); q.x0 = me.x; q.y0 = me.y; q.x1 = p[0]; q.y1 = p[1]; q.tgt = tg; q.fwd = fwd; prevTgt = tg || prevTgt; if (tg) TGN.set(tg, (TGN.get(tg) || 0) + 1);
    }

    /* ---- effects ---- */
    const fx = { orbit: [], parts: [], gusts: [], imps: [], form: [], sparks: [], streaks: [], inward: [], spiral: [] };
    const valid = m => m && !m.dead && !m.under && !m.falling && !m.fobj;
    function part(o) { fx.parts.push(Object.assign({ t: 0, z: 0, vz: 0, g: 0, drag: 1.2, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, v: Math.random() < 0.5 ? 0 : 1 }, o)); }
    function motes(x, y, z, n, sp, up) { for (let i = 0; i < H.n(n); i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random() * 0.8); part({ kind: 'm', x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: (up || 1) * (0.5 + Math.random()), g: -0.3, life: 0.6 + Math.random() * 0.5, s: 0.06 + Math.random() * 0.06, drag: 1.6 }); } }
    function leaves(x, y, z, n, sp, up, pinkK) { for (let i = 0; i < H.n(n); i++) { const a = Math.random() * TAU, v = sp * (0.5 + Math.random() * 0.7); part({ kind: Math.random() < (pinkK || 0.4) ? 'p' : 'l', x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: up * (0.5 + Math.random() * 0.8), g: 2.2, life: 1.0 + Math.random() * 0.6, s: 0.16 + Math.random() * 0.08, drag: 1.4, flut: Math.random() * TAU }); } }
    function dust(x, y, n, sp) { for (let i = 0; i < H.n(n); i++) { const a = Math.random() * TAU, v = sp * (0.4 + Math.random()); H.P({ kind: 'smoke', x: x + Math.cos(a) * 0.2, y: y + Math.sin(a) * 0.1, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.5 - 0.2, life: 0.6 + Math.random() * 0.4, max: 1.0, size: 0.18 * (0.7 + Math.random() * 0.6), color: 'rgba(196,206,186,' }); } }
    // formation motes: drawn in from round the pet onto the spear's line
    for (let i = 0; i < H.n(26 + 6 * tier); i++) fx.form.push({ a: Math.random() * TAU, d: 0.7 + Math.random() * 0.9, h: Math.random() * 1.6, u: Math.random(), t0: Math.random() * 0.15, t1: 0.3 + Math.random() * 0.25, s: 0.05 + Math.random() * 0.05 });

    const F = H.add({ key: 'fujin', life: LIFE, J, N, tier, DK, TOT, zc, hT, LS_T, update, draw, drawUnder, onEnd() { clearPet(); for (const c of kids) c.life = 0; fx.parts.length = 0; } });
    const kids = [H.add({ key: 'fujinB', life: LIFE, entY: me.y, drawEnt: c => drawEnt(c, false) }), H.add({ key: 'fujinF', life: LIFE, entY: me.y, drawEnt: c => drawEnt(c, true) })];

    /* ---- the ribbon: two halves, each from between the shoulders round its own side to a loose end ---- */
    const NW = 6, NT = tier >= 3 ? 13 : tier >= 2 ? 10 : 9, NR = NW + NT, TAILL = (tier >= 3 ? 1.9 : tier >= 2 ? 1.45 : 1.25) * hT;
    const RB = [-1, 1].map(s => ({ s, pts: Array.from({ length: NR }, () => ({ x: 0, y: 0, vx: 0, vy: 0, d: 0, init: false })) }));
    const RP = { st: -0.2, end: -1.2, dz: -0.2, wave: 0.4, spiral: 0, open: 1, rel: 0 };   // the loose ends' shape, eased toward the phase's
    const crs = (p0, p1, p2, p3, t) => { const t2 = t * t, t3 = t2 * t; return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3); };
    function ribbonRest(s, i, t, out) {   // pet-local (forward, up, depth) of point i of half s
      const ow = RP.open, c = [[0, 0.68, -0.32], [s * 0.3 * ow, 0.66, -0.3], [s * 0.5 * ow, 0.52, -0.02], [s * 0.44 * ow, 0.3, 0.26], [s * 0.26 * ow, 0.2, 0.34]];
      if (i < NW) { const u = i / (NW - 1) * 4, k = Math.min(3, Math.floor(u)), f = u - k, A = c[Math.max(0, k - 1)], B = c[k], C2 = c[k + 1], D2 = c[Math.min(4, k + 2)];
        for (let a = 0; a < 3; a++) out[a] = crs(A[a], B[a], C2[a], D2[a], f);
        if (RP.rel > 0) { const L2 = loopPt(s, i / (NR - 1), t); for (let a = 0; a < 3; a++) out[a] = lerp(out[a], L2[a], RP.rel * sm(1.2 - i / NW)); } return out; }
      // the loose end: out from the hip first, then curving toward the phase's direction, a travelling wave along it
      const seg = TAILL / hT / NT; let x = c[4][0], y = c[4][1], d = c[4][2];
      for (let m = 1; m <= i - NW + 1; m++) { const kk = m / NT, an = lerp(RP.st, RP.end, Math.pow(kk, 0.7)) + RP.wave * Math.sin(TAU * (kk * 1.7) - t * 5.5 + s) * (0.35 + 0.65 * kk), sp = RP.spiral;
        x += s * Math.cos(an) * seg * (1 - 0.6 * sp * kk); y += Math.sin(an) * seg; d = lerp(c[4][2], RP.dz, Math.min(1, kk * 2)) + sp * 0.5 * Math.sin(TAU * kk * 1.4 - t * 11 + (s > 0 ? 0 : Math.PI)) * kk; if (sp > 0) x += s * sp * 0.22 * Math.cos(TAU * kk * 1.4 - t * 11 + (s > 0 ? 0 : Math.PI)) * kk * seg * 6; }
      out[0] = x; out[1] = y; out[2] = d; if (RP.rel > 0) { const L2 = loopPt(s, i / (NR - 1), t); for (let a = 0; a < 3; a++) out[a] = lerp(out[a], L2[a], RP.rel); } return out; }
    // the ending's last loop: the ribbon unwraps into one flowing loop behind the pet
    function loopPt(s, k, t) { const tau = Math.max(0, t - endAt - 0.3), ph = tau * 4.2 + k * 3.4 * (s > 0 ? 1 : 0.8) + (s > 0 ? 0 : Math.PI * 0.9), r = 0.55 + 0.5 * k + 0.4 * sm(tau); return [s * 0.15 + Math.cos(ph) * r * 1.1, 0.75 + 0.35 * sm(tau / 0.8) + Math.sin(ph) * r * 0.75, -0.35]; }
    const RR = [0, 0, 0];
    function ribbonStep(dt, t) {
      // the loose ends' target shape for this phase: streaming down on the ascent, floating out at the apex, whipping up and
      // spiralling in the dive, a soft drift on the ground (wider loops with each jump)
      let st = -0.25, end = -1.15, dz = -0.18, wave = 0.5, spiral = 0, open = 1 + 0.07 * P.j, rel = 0;
      if (P.ph === 'form') { end = -1.0; wave = 0.55; open = 0.9; } else if (P.ph === 'prep') { st = -0.5; end = -1.35; open = 0.8; wave = 0.3; }
      else if (P.ph === 'asc') { st = -0.3; end = -1.3; dz = -0.25; wave = 0.55; }
      else if (P.ph === 'apex') { st = 0.1; end = 0.35 + 0.6 * sm(P.u); dz = -0.1; wave = 0.65 + 0.05 * P.j; open *= 1.12; }
      else if (P.ph === 'dive' || P.ph === 'plant') { st = 0.4; end = 1.45; dz = -0.15; wave = 0.32; spiral = 0.55 + 0.05 * P.j; }
      else if (P.ph === 'ground') { end = -0.9 + 0.8 * Math.exp(-5 * P.u); wave = 0.5; }
      else if (P.ph === 'end') { end = -0.9; wave = 0.45; rel = sm((t - endAt - 0.25) / 0.45); }
      const k = Math.min(1, dt * 9); RP.end += (end - RP.end) * k; RP.st += (st - RP.st) * k; RP.dz += (dz - RP.dz) * k; RP.wave += (wave - RP.wave) * k; RP.spiral += (spiral - RP.spiral) * Math.min(1, dt * 12); RP.open += (open - RP.open) * k; RP.rel = rel;
      const T = H.X.Tz(), Fp = feet(T), sub = dt > 1 / 45 ? 2 : 1, h2 = dt / sub, X0 = H.sx(0), Y0 = H.sy(0);
      for (const R of RB) for (let i = 0; i < NR; i++) { const q = R.pts[i]; ribbonRest(R.s, i, t, RR); const sp = petPt(RR[0], RR[1], T, Fp), tx = (sp[0] - X0) / T, ty = (sp[1] - Y0) / T;
        // (stiff where it wraps the body, looser toward the end: the ends follow late)
        if (!q.init) { q.x = tx; q.y = ty; q.init = true; } q.d = RR[2];
        const kk = i < NW ? 900 : lerp(260, 26, (i - NW) / NT), c = 2 * Math.sqrt(kk) * (i < NW ? 0.9 : 0.42);
        for (let n = 0; n < sub; n++) { q.vx += (kk * (tx - q.x) - c * q.vx) * h2; q.vy += (kk * (ty - q.y) - c * q.vy) * h2; q.x += q.vx * h2; q.y += q.vy * h2; }
        // (it never stretches: each point stays within its length of the one before)
        if (i > 0) { const p = R.pts[i - 1], seg = i < NW ? 0.32 * hT : TAILL / NT * 1.25, dx = q.x - p.x, dy = q.y - p.y, dd = Math.hypot(dx, dy); if (dd > seg) { q.x = p.x + dx / dd * seg; q.y = p.y + dy / dd * seg; } } }
      // (never across the face: points in front of the head are pushed out to its side)
      const hc0 = petPt(0, 0.74, T, Fp), hc = [hc0[0] - X0, hc0[1] - Y0], hr = 0.3 * hT, hry = 0.24 * hT;
      for (const R of RB) for (let i = 1; i < NR; i++) { const q = R.pts[i]; if (q.d <= 0) continue; const dx = q.x - hc[0] / T, dy = q.y - hc[1] / T, e = Math.hypot(dx / hr, dy / hry); if (e < 1.15) { const side = Math.abs(dx) > 1e-3 ? Math.sign(dx) : R.s * fxF; q.x = hc[0] / T + side * hr * Math.sqrt(Math.max(0, 1.15 * 1.15 - (dy / hry) * (dy / hry))); } }
    }
    // the ribbon drawn: runs of points in front of the pet or behind it; each a feathered satin strip (soft layered
    // widths, a translucent body, a pale sheen, folds where it twists, luminous edges; Celestial: a pearly inner line)
    const SUB = 3, NS2 = (NR - 1) * SUB + 1, RIB = { X: new Float32Array(NS2), Y: new Float32Array(NS2), Wd: new Float32Array(NS2), NX: new Float32Array(NS2), NY: new Float32Array(NS2), F: new Float32Array(NS2), TW: new Float32Array(NS2), D: new Float32Array(NS2) };
    const BX = new Float32Array(NR), BY = new Float32Array(NR);
    function drawRibbon(c, frontSide) {
      if (ribbonA <= 0.01) return; const T = H.X.Tz(), t = lastT, W0 = (tier >= 3 ? 0.3 : 0.26) * hT * T * (1 + 0.04 * P.j), vis = sm(cl((t - 0.15) / 0.55)) * NR;
      for (const R of RB) {
        for (let i = 0; i < NR; i++) { const q = R.pts[i]; BX[i] = H.sx(q.x); BY[i] = H.sy(q.y); }
        // (smoothed: each span split in three along a Catmull-Rom curve, so it flows instead of kinking)
        const n = NS2; for (let i = 0; i < n; i++) { const k = Math.min(NR - 2, Math.floor(i / SUB)), f = i / SUB - k, i0 = Math.max(0, k - 1), i3 = Math.min(NR - 1, k + 2);
          RIB.X[i] = crs(BX[i0], BX[k], BX[k + 1], BX[i3], f); RIB.Y[i] = crs(BY[i0], BY[k], BY[k + 1], BY[i3], f); RIB.D[i] = lerp(R.pts[k].d, R.pts[k + 1].d, f); }
        for (let i = 0; i < n; i++) { const a = Math.max(0, i - 1), b = Math.min(n - 1, i + 1), dx = RIB.X[b] - RIB.X[a], dy = RIB.Y[b] - RIB.Y[a], l = Math.hypot(dx, dy) || 1; RIB.NX[i] = -dy / l; RIB.NY[i] = dx / l;
          const s = i / (n - 1), si = s * (NR - 1), tw = 0.42 + 0.58 * Math.abs(Math.cos(Math.PI * s * 2.3 + t * 2.2 + R.s)), fade = cl(vis - si), endT = s > 0.8 ? Math.pow(1 - (s - 0.8) / 0.2, 0.8) : 1, startT = lerp(0.55, 1, cl(si));
          RIB.TW[i] = tw; RIB.Wd[i] = W0 * (si < NW ? lerp(0.85, 0.6, sm((si - 2) / 3)) : 1) * tw * endT * startT * fade; RIB.F[i] = RIB.D[i] > 0.02 ? 1 : 0; }
        // the runs on this side
        let i0 = -1; for (let i = 0; i <= n; i++) { const on = i < n && (RIB.F[i] === 1) === frontSide; if (on && i0 < 0) i0 = Math.max(0, i - 1); if (!on && i0 >= 0) { strip(c, i0, Math.min(n - 1, i), R.s); i0 = -1; } }
      }
    }
    function strip(c, a, b, s) { if (b - a < 1) return; const X = RIB.X, Y = RIB.Y, NX = RIB.NX, NY = RIB.NY, Wd = RIB.Wd, al = ribbonA, T = H.X.Tz();
      const poly = k => { c.beginPath(); for (let i = a; i <= b; i++) { const w = Wd[i] * k * 0.5; i === a ? c.moveTo(X[i] + NX[i] * w, Y[i] + NY[i] * w) : c.lineTo(X[i] + NX[i] * w, Y[i] + NY[i] * w); } for (let i = b; i >= a; i--) { const w = Wd[i] * k * 0.5; c.lineTo(X[i] - NX[i] * w, Y[i] - NY[i] * w); } c.closePath(); c.fill(); };
      c.lineJoin = 'round'; c.lineCap = 'round';
      // the body: a soft outer falloff, the translucent emerald satin, a paler inner sheen
      c.globalCompositeOperation = 'lighter'; c.fillStyle = MINT; c.globalAlpha = 0.07 * al; poly(1.55); c.globalAlpha = 0.1 * al; poly(1.25);
      c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgb(18,128,96)'; c.globalAlpha = 0.34 * al; poly(1.0);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgb(120,226,184)'; c.globalAlpha = 0.26 * al; poly(0.72); c.fillStyle = 'rgb(200,250,228)'; c.globalAlpha = 0.16 * al; poly(0.36);
      // the folds: darker where it twists away, a bright crest where it faces the light
      c.globalCompositeOperation = 'source-over'; c.strokeStyle = 'rgb(6,70,52)'; c.globalAlpha = 0.22 * al; c.beginPath(); let on = false;
      for (let i = a; i <= b; i++) { const fold = RIB.TW[i] < 0.62; if (fold && !on) { c.moveTo(X[i], Y[i]); on = true; } else if (fold) c.lineTo(X[i], Y[i]); else on = false; } c.lineWidth = Math.max(1, W0f() * 0.45); c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = AIR; c.globalAlpha = 0.3 * al; c.beginPath(); on = false;
      for (let i = a; i <= b; i++) { const crest = RIB.TW[i] > 0.86; if (crest && !on) { c.moveTo(X[i], Y[i]); on = true; } else if (crest) c.lineTo(X[i], Y[i]); else on = false; } c.lineWidth = Math.max(1, W0f() * 0.22); c.stroke();
      // the luminous edges (finer and doubled at Adept)
      const edges = (k) => { c.beginPath(); for (let i = a; i <= b; i++) { const w = Wd[i] * 0.5 * k; i === a ? c.moveTo(X[i] + NX[i] * w, Y[i] + NY[i] * w) : c.lineTo(X[i] + NX[i] * w, Y[i] + NY[i] * w); } for (let i = a; i <= b; i++) { const w = Wd[i] * 0.5 * k; i === a ? c.moveTo(X[i] - NX[i] * w, Y[i] - NY[i] * w) : c.lineTo(X[i] - NX[i] * w, Y[i] - NY[i] * w); } c.stroke(); };
      c.strokeStyle = MINT; c.globalAlpha = 0.22 * al; c.lineWidth = Math.max(1.5, T * 0.06); edges(0.95);
      c.strokeStyle = AIR; c.globalAlpha = 0.5 * al; c.lineWidth = Math.max(0.8, T * 0.016); edges(0.92);
      if (tier >= 2) { c.strokeStyle = MINT; c.globalAlpha = 0.4 * al; c.lineWidth = Math.max(0.6, T * 0.01); edges(0.62); }
      if (tier >= 3) { c.strokeStyle = ['#FFE3F1', '#E6F7FF', '#F3E9FF'][((lastT * 1.3) | 0) % 3]; c.globalAlpha = 0.45 * al; c.lineWidth = Math.max(0.8, T * 0.022); c.beginPath(); for (let i = a; i <= b; i++) i === a ? c.moveTo(X[i] + NX[i] * Wd[i] * 0.12, Y[i] + NY[i] * Wd[i] * 0.12) : c.lineTo(X[i] + NX[i] * Wd[i] * 0.12, Y[i] + NY[i] * Wd[i] * 0.12); c.stroke(); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; void s; }
    const W0f = () => (tier >= 3 ? 0.3 : 0.26) * hT * H.X.Tz();

    /* ---- the hit of a dive: the frame the drawn tip reaches the floor ---- */
    function contact(q) {
      q.fired = true; const T = H.X.Tz(); spearNow(T); const w = toW(SP.tipX, SP.floorY), x = w[0], y = w[1];
      q.cx = x; q.cy = y;
      for (const m of H.living()) { if (q.hit.has(m) || !valid(m)) continue; const de = Math.hypot(m.x - x, (m.y - y) / GY); if (de - m.r <= q.R) { q.hit.add(m); q.n++; H.X.hitMon(m, q.dmg, C.dmgO(q.fin ? { stun: 0.5, kb: 3 } : { stun: 0.16, kb: 1.2 })); } }
      const imp = { x, y, t0: lastT, R: q.R, j: q.j, fin: q.fin, kj: q.kj, blades: [], strands: [] };
      const nb = Math.min(14, 6 + q.j + (q.fin ? 4 : 0)), a0 = Math.random() * TAU; for (let i = 0; i < nb; i++) imp.blades.push({ a: a0 + (i + 0.3 * Math.random()) / nb * TAU, d: 0.02 * Math.random(), k: 0.85 + 0.3 * Math.random(), s: 0.8 + 0.4 * Math.random() });
      const ns = 7 + Math.min(5, q.j) + (q.fin ? 3 : 0); for (let i = 0; i < ns; i++) imp.strands.push({ a: (i + 0.5) / ns * TAU + 0.3, r: 0.5 + 0.25 * Math.random(), h: (0.9 + 0.15 * q.j) * (q.fin ? 1.4 : 1) * (0.7 + 0.5 * Math.random()), d: 0.02 * (i % 4), w: 0.6 + 0.5 * Math.random() });
      fx.imps.push(imp);
      leaves(x, y, 0.15, 9 + 2 * q.j, 3.8 * q.kj, 3.6, 0.45); motes(x, y, 0.2, 12 + 2 * q.j, 3.8 * q.kj, 1.6); dust(x, y, 4 + (q.j >> 1), 2.8);
      if (q.fin) { // the final burst: a sea of petals and leaves riding the giant shockwave, emerald sparks raining down
        leaves(x, y, 0.2, 26 + 12 * tier, 7.5 * K, 4.2, 0.6); leaves(x, y, 0.5, 10 + 6 * tier, 3, 7, 0.55); motes(x, y, 0.4, 20 + 10 * tier, 6, 3);
        for (let i = 0; i < H.n(24 + 10 * tier); i++) { const a = Math.random() * TAU, d = Math.random() * q.R * 0.9; H.P({ kind: 'spark', x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * 0.6 - 3 - Math.random() * 3, vx: (Math.random() - 0.5) * 1.2, vy: 2 + Math.random() * 3, g: 4, life: 0.9 + Math.random() * 0.6, max: 1.5, size: 1.6 + Math.random() * 1.2, color: [AIR, MINT, '#FFFFFF', EMER][i % 4] }); } }
      for (let i = 0; i < H.n(q.fin ? 22 : 10); i++) { const a = Math.random() * TAU, v = (q.fin ? 7 : 5) * (0.6 + Math.random() * 0.6); H.P({ kind: 'spark', x: x + Math.cos(a) * 0.3, y: y + Math.sin(a) * 0.18, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.55 - 1.4, g: 6, life: 0.45, max: 0.45, size: 1.8, color: [AIR, MINT, '#FFFFFF'][i % 3] }); }
      if (q.fin) { const ns2 = 22 + 12 * tier; for (let i = 0; i < H.n(ns2); i++) fx.spiral.push({ a: i / ns2 * TAU * 3, t0: lastT + i * 0.012, k: Math.random() < 0.45 ? 'p' : 'l', v: i % 2, s: 0.15 + Math.random() * 0.09, r0: 0.3 + Math.random() * 0.3 }); }
      H.X.light && H.X.light(x, y, q.R * (q.fin ? 1.3 : 0.9), q.fin ? 0.5 : 0.3);
      if (q.fin) { H.X.shake(16 + ev * 0.9, 0.55); H.X.hitstop(0.1); H.X.flash && H.X.flash(0.2, AIR); H.X.sfx.crash(); H.X.sfx.stomp(); H.X.sfx.whoosh(); }
      else { H.X.shake(6 + q.j * 1.5, 0.22 + 0.02 * q.j); H.X.hitstop(0.05 + 0.008 * q.j); H.X.sfx.stomp(); H.X.sfx.whoosh(); }
    }

    /* ---- the update ---- */
    function update(dt, f) {
      const t = f.t; lastT = t; const T = H.X.Tz();
      if (me.dead && !dead) { dead = true; endAt = Math.min(endAt, t); f.life = Math.min(f.life, 0.4); for (const c of kids) c.life = Math.min(c.life, 0.4); clearPet(); }
      if (dead) { ribbonA = Math.max(0, ribbonA - dt * 3); stepParts(dt, t); return; }
      // hold the stick and keep the pet out of reach in the air (the game's own leap is untouchable too)
      if (t < endAt + 0.4) { me.push = hold; hold.t = 0.12; } else if (me.push === hold) me.push = null;
      poseAt(t, P);
      if (P.z > 0.25) me.inv = Math.max(me.inv || 0, 0.08 + dt);
      // each jump: aim at launch, travel during the ascent, the seal at the apex, the hit at the tip's contact
      for (const q of J) {
        if (!q.launched && t >= q.L) { q.launched = true; aim(q); if (Math.abs(q.x1 - q.x0) > 0.15) { fxF = Math.sign(q.x1 - q.x0); me.face = fxF; }
          gust(q); H.X.sfx[q.fin ? 'whoosh' : 'jump'](); if (q.fin) H.X.sfx.whoosh(); }
        if (q.launched && t < q.L + q.A) { const u = cl((t - q.L) / q.A), e = sm(u / 0.85), tx = lerp(q.x0, q.x1, e), ty = lerp(q.y0, q.y1, e); if (Math.hypot(tx - me.x, ty - me.y) > 1e-4) H.X.moveEnt(me, tx - me.x, ty - me.y, 0); }
        if (!q.fired && t >= q.C) contact(q);
      }
      if (P.ph === 'apex' && P.j === N - 1 && P.u > 0.45 && !F._in) { F._in = 1; const q = LAST; for (let i = 0; i < H.n(16 + 9 * tier); i++) { const a = Math.random() * TAU, r = 2.6 + Math.random() * 2.2; fx.inward.push({ a, r, z: 0.2 + Math.random() * 2.2, t0: t, t1: q.C - 0.02, k: i % 3 === 0 ? 'p' : i % 3 === 1 ? 'l' : 'm', v: i % 2, s: 0.12 + Math.random() * 0.08, x: me.x, y: me.y }); } }
      // the spear's light: a breath that grows with each jump, a flare at each contact
      { let g = 0.75 + 0.1 * Math.sin(t * 5) + 0.11 * P.j + (tier - 1) * 0.08; for (const q of J) { const w = t - q.C; if (w > -0.05 && w < 0.4) g += 0.9 * Math.exp(-w * 9) * (q.fin ? 1.6 : 1); } if (P.ph === 'dive') g += 0.35 * P.u;
        if (t < FORM) g *= sstep(0.55, 0.9, t); g *= P.tip > 0 ? 1 : 0; glowK += (g - glowK) * Math.min(1, dt * 14); }
      ribbonA = t < FORM ? sm((t - 0.1) / 0.5) : P.ph === 'end' ? 1 - sm((t - endAt - 0.75) / 0.5) : 1;
      applyPet(dt); ribbonStep(dt, t);
      // the prep's circling dust, leaves and petals
      if (t >= FORM - 0.1 && !F._orb) { F._orb = 1; for (let i = 0; i < H.n(9 + 2 * tier); i++) fx.orbit.push({ a: i / (9 + 2 * tier) * TAU, r: 0.85 + 0.35 * Math.random(), w: 3 + Math.random() * 1.5, z: 0.05 + Math.random() * 0.35, k: i % 3 === 0 ? 'p' : 'l', v: i % 2, s: 0.15 + Math.random() * 0.06, rot: Math.random() * TAU }); }
      for (const q of J) { if (t >= q.C - 0.6 && t < q.C && !q._ex) { q._ex = 1; } }
      // trailing streaks in the dive
      if (P.ph === 'dive' && Math.random() < dt * 40 * H.Q()) { spearNow(T); fx.streaks.push({ X: SP.gx + (Math.random() - 0.5) * T * 0.7, y0: me.y, z: P.z + 0.3 + Math.random() * 0.4 * hT, t: 0, life: 0.22 + 0.05 * P.j, len: (0.7 + 0.15 * P.j) * (P.j === N - 1 ? 1.4 : 1), wx: me.x + (Math.random() - 0.5) * 0.7 }); }
      stepParts(dt, t);
      // the end: the spear dissolving from its tip: sparks where it goes
      if (P.ph === 'end' && P.tip < 1 && P.tip > 0) { spearNow(T); const u = P.tip, x = lerp(SP.buX, SP.tipX, u), y = lerp(SP.buY, SP.tipY, u); if (Math.random() < dt * 60 * H.Q()) { const w = toW(x, y + T * 0.2); for (let i = 0; i < 2; i++) H.P({ kind: 'spark', x: w[0] + (Math.random() - 0.5) * 0.1, y: w[1] - (SP.floorY - y) / T * 0 , vx: (Math.random() - 0.5) * 2, vy: -0.6 - Math.random() * 1.2, g: -0.5, life: 0.5, max: 0.5, size: 1.6, color: i ? MINT : AIR }); }
        if (Math.random() < dt * 30 * H.Q()) fx.sparks.push({ X: x, Y: y, vx: (Math.random() - 0.5) * T * 0.8, vy: -T * (0.4 + Math.random() * 0.8), t: 0, life: 0.5 + Math.random() * 0.3, s: T * (0.05 + Math.random() * 0.04) }); }
      // the ribbon's dispersal: motes shed along it
      if (P.ph === 'end' && t > endAt + 0.7 && Math.random() < dt * 40 * H.Q()) { const R = RB[Math.random() < 0.5 ? 0 : 1], q = R.pts[Math.floor(Math.random() * NR)]; fx.sparks.push({ X: H.sx(q.x), Y: H.sy(q.y), vx: (Math.random() - 0.5) * T * 0.6, vy: -T * (0.2 + Math.random() * 0.5), t: 0, life: 0.6 + Math.random() * 0.3, s: T * (0.04 + Math.random() * 0.04) }); }
      // the entity markers: just behind and just in front of the pet
      kids[0].entY = me.y - 0.004; kids[1].entY = me.y + 0.03;
      if (t > endAt + ENDD && !ended) { ended = true; clearPet(); }
      // the effect sprites, a few a frame (all made before the first contact)
      if (WI < WARM.length && t > 0.03) { const t0 = nowMs(); while (WI < WARM.length && (nowMs() - t0 < 1.5 || t > J[0].C - 0.1)) WARM[WI++](); }
      // the pictures still to bake (more while the one on screen is missing)
      if ((SC.queue.length || SC.job) && t > 0.03) { const sync = typeof window !== 'undefined' && window.__fjSync; bakeStep(sync ? 1e4 : SC.miss > 0 ? 2 : 0.7); SC.miss = 0; }
    }
    function gust(q) { fx.gusts.push({ x: me.x, y: me.y, t0: lastT, k: q.kj, fin: q.fin, j: q.j }); dust(me.x, me.y, 5 + q.j, 1.6 * q.kj);
      for (const o of fx.orbit) { if (o.gone) continue; o.gone = 1; const a = o.a; part({ kind: o.k === 'p' ? 'p' : 'l', x: me.x + Math.cos(a) * o.r, y: me.y + Math.sin(a) * o.r * GY, z: o.z, vx: Math.cos(a) * 2.2 - Math.sin(a) * 2, vy: (Math.sin(a) * 2.2 + Math.cos(a) * 2) * 0.6, vz: 3.2 + Math.random() * 2, g: 2.2, life: 1.2, s: o.s, drag: 1.4, flut: Math.random() * TAU, v: o.v }); }
      leaves(me.x, me.y, 0.1, 3 + q.j, 2.2 * q.kj, 3.5, 0.4); }
    function stepParts(dt, t) {
      for (const p of fx.parts) { p.t += dt; const dg = Math.exp(-p.drag * dt); p.vx *= dg; p.vy *= dg; p.vz = p.vz * dg - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt;
        if (p.flut != null) { p.flut += dt * 6; p.x += Math.sin(p.flut) * dt * 0.5; }
        if (p.z < 0) { p.z = 0; p.vz *= -0.2; p.vx *= 0.6; p.vy *= 0.6; } }
      fx.parts = fx.parts.filter(p => p.t < p.life);
      for (const o of fx.orbit) { o.a += o.w * dt * (P.ph === 'prep' ? 1 + sm(P.u) : 1); o.rot += dt * 5; o.r = Math.max(0.5, o.r - dt * (P.ph === 'prep' ? 0.5 : 0)); }
      fx.orbit = fx.orbit.filter(o => !o.gone);
      for (const s of fx.streaks) s.t += dt; fx.streaks = fx.streaks.filter(s => s.t < s.life);
      for (const s of fx.sparks) { s.t += dt; s.X += s.vx * dt; s.Y += s.vy * dt; s.vy *= Math.exp(-dt); } fx.sparks = fx.sparks.filter(s => s.t < s.life);
      fx.imps = fx.imps.filter(m => t - m.t0 < (m.fin ? 2.4 : 1.5)); fx.gusts = fx.gusts.filter(g => t - g.t0 < 0.9);
      fx.inward = fx.inward.filter(p => t < p.t1 + 0.05); fx.spiral = fx.spiral.filter(p => t - p.t0 < 1.8);
    }

    /* ---- drawing ---- */
    const nearPet = (X, Y, T) => { const F2 = feet(T), d = Math.hypot(X - F2[0], Y - (F2[1] - 0.5 * hT * T)); return 0.3 + 0.7 * sstep(T * 0.3, T * 1.0, d); };
    // the spear: body (the bucket nearest its angle, turned the rest of the way), its inner light, a soft glow, the grip's
    // magical attachment; during the formation the shaft grows from the grip and the head out of the socket
    function drawSpear(c, T) {
      const t = lastT; if (P.tip <= 0.002) return; spearNow(T); const S = SP, Lp = S.Lp, scl = 1 / (RES * SS);
      const sync = typeof window !== 'undefined' && window.__fjSync; if (sync && (SC.queue.length || SC.job)) bakeStep(1e4);
      const body = bodyFrame(tier, S.th), em = emisFrame(tier, Math.floor(t * 14) % NPH); if (!body) return;
      const kb = Lp / body.Lpx;   // (screen px per baked px)
      // formation: the shaft's extent from the grip, the head's growth
      let shaft = 1, head = 1, lock = 0; if (t < FORM) { shaft = sstep(0.3, 0.62, t); head = t < 0.6 ? 0 : (u => 1 + 2.7 * Math.pow(u - 1, 3) + 1.7 * Math.pow(u - 1, 2))(cl((t - 0.6) / 0.24)); lock = Math.exp(-Math.pow((t - 0.86) / 0.05, 2)); }
      const below = S.tipY > S.floorY - 1;   // (planted: what is under the floor is hidden)
      c.save(); if (below) { c.beginPath(); c.rect(-1e4, -1e4, 2e4, S.floorY + 1e4 + T * 0.02); c.clip(); }
      c.translate(S.gx, S.gy); c.rotate(S.th);
      const yOf = u => -(u - S.gf) * Lp;   // (spear frame: + down the screen; u along the spear)
      const lay = (img, fr, u0, u1, a, mode) => { if (u1 <= u0 || a <= 0.004) return; const r0 = u1 >= 1 ? 0 : fr.pad + (1 - u1) * fr.Lpx, r1 = u0 <= 0 ? fr.H : fr.pad + (1 - u0) * fr.Lpx; if (r1 - r0 < 0.5) return; c.globalAlpha = Math.min(1, a); if (mode) c.globalCompositeOperation = mode; c.drawImage(img, 0, r0, fr.W, r1 - r0, -fr.cx * kb, yOf(1) + (r0 - fr.pad) * kb, fr.W * kb, (r1 - r0) * kb); c.globalCompositeOperation = 'source-over'; };
      // (the dissolve: everything above u = tip gone)
      const uTop = P.tip >= 1 ? 1.01 : 0.02 + 0.99 * P.tip;
      if (t < FORM) {
        const gl = S.gf, lo = gl - gl * shaft, hi = gl + (HU - gl) * shaft; lay(body.cv, body, Math.max(0, lo), Math.min(HU + 0.005, hi), sstep(0.3, 0.45, t));
        if (head > 0.01) { const u0 = 0.545, r1 = body.pad + (1 - u0) * body.Lpx; c.save(); c.translate(0, yOf(0.6)); c.scale(Math.min(1.1, 0.4 + 0.6 * head), head); c.translate(0, -yOf(0.6)); c.globalAlpha = Math.min(1, head * 1.4); c.drawImage(body.cv, 0, 0, body.W, r1, -body.cx * kb, yOf(1) - body.pad * kb, body.W * kb, r1 * kb); c.restore(); }
        if (em) { lay(em.cv, em, Math.max(0, lo), Math.min(0.545, hi), glowK, 'lighter'); if (head > 0.9) lay(em.cv, em, 0.545, 1.01, glowK * sstep(0.9, 1, head), 'lighter'); }
        // the line of light the motes gather into, before the shaft
        const ln = sstep(0.12, 0.32, t) * (1 - sstep(0.5, 0.75, t)); if (ln > 0.01) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = ln; c.drawImage(streakSpr(), -T * 0.08, yOf(1), T * 0.16, Lp); c.globalCompositeOperation = 'source-over'; }
      } else {
        lay(body.cv, body, 0, Math.min(1.01, uTop), 1);
        if (em) { let g = glowK; while (g > 0.004) { lay(em.cv, em, 0, Math.min(1.01, uTop), Math.min(1, g), 'lighter'); g -= 1; } }
      }
      c.globalAlpha = 1;
      // the dissolve front: a bright edge
      if (P.tip < 1) { const y = yOf(uTop); glowF(c, 0, y, T * 0.28, MINT, 0.7); glowF(c, 0, y, T * 0.12, AIR, 0.8); }
      // the head's soft light, the lock pulse
      if (uTop > 0.78) { const y = yOf(0.8); glowF(c, 0, y, T * (0.45 + 0.1 * glowK), MINT, 0.12 + 0.1 * glowK); }
      if (lock > 0.01) { glowF(c, 0, yOf(0.8), T * 0.9, AIR, lock); glowF(c, 0, yOf(0.8), T * 1.6, MINT, 0.6 * lock); }
      c.restore();
      // the grip: a small ring of wind light round the shaft at the pet's hand
      const ga = t < FORM ? sstep(0.3, 0.5, t) : P.tip; if (ga > 0.01) { c.save(); c.translate(S.gx, S.gy); c.rotate(S.th); c.scale(1, 0.38); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * ga; c.strokeStyle = AIR; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.arc(0, 0, T * 0.1, 0, TAU); c.stroke(); c.globalAlpha = 0.25 * ga; c.strokeStyle = MINT; c.lineWidth = Math.max(2, T * 0.07); c.stroke(); c.restore(); glowF(c, S.gx, S.gy, T * 0.22, MINT, 0.3 * ga); }
      void scl;
    }
    // the dive's cone of compressed wind round the spear (apex at the tip), drawn under the spear
    function drawCone(c, T) { if (P.ph !== 'dive' && P.ph !== 'plant') return; spearNow(T); const k = P.ph === 'dive' ? sm(P.u / 0.35) : 1 - sm(P.u * 2), q = J[P.j]; if (k < 0.01) return;
      const len = SP.Lp * (0.95 + 0.12 * q.j) * (q.fin ? 1.25 : 1), wd = T * (0.55 + 0.06 * q.j) * (q.fin ? 1.3 : 1);
      c.save(); c.translate(SP.tipX, Math.min(SP.tipY, SP.floorY)); c.rotate(SP.th + Math.PI); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * k;
      c.drawImage(coneSpr(), -wd / 2, -len, wd, len); if (tier >= 2) { c.globalAlpha = 0.45 * k; c.drawImage(coneSpr(), -wd * 0.35, -len * 1.15, wd * 0.7, len * 1.15); } c.restore(); }
    function drawEnt(c, frontSide) {
      const T = H.X.Tz();
      if (!frontSide) { drawRibbon(c, false); return; }
      drawCone(c, T); drawSpear(c, T); drawRibbon(c, true);
    }
    function drawUnder(c, f, X0, Y0, T) {
      const t = lastT;
      // formation: a soft light on the floor under the gathering
      if (t < FORM + 0.2) { const F2 = feet(T); glowF(c, F2[0] + fxF * T * 0.35, H.sy(me.y) + 0.18 * T, T * 0.9, MINT, 0.3 * sstep(0, 0.3, t) * (1 - sstep(FORM - 0.1, FORM + 0.2, t)), GY); }
      // the prep's thin wind circle contracting under the feet (and a quick one before each later launch)
      { let k = 0, r = 0; if (P.ph === 'prep') { k = sstep(0, 0.25, P.u); r = lerp(1.5, 0.55, sm(P.u)); } else if (P.ph === 'ground' && P.j < N - 1) { k = sstep(0.15, 0.5, P.u); r = lerp(1.3, 0.6, sm(P.u)); }
        if (k > 0.01) { const X = H.sx(me.x), Y = H.sy(me.y) + 0.18 * T, R = r * T * (1 + 0.1 * P.j); ringF(c, 'e', X, Y, R, T * 0.06, 0.8 * k); ringF(c, 'r', X, Y, R * 0.8, T * 0.14, 0.4 * k);
          c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(-t * 2.5); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 * k; const s1 = R * 1.08; c.drawImage(sealSpr(1), -s1, -s1, s1 * 2, s1 * 2); c.restore(); } }
      // the launch gusts: an expanding ring of wind, radial streaks along the floor
      for (const g of fx.gusts) { const u = (t - g.t0) / (g.fin ? 0.8 : 0.6), X = H.sx(g.x), Y = H.sy(g.y) + 0.18 * T, R = T * (0.4 + 1.3 * g.k * (1 - Math.pow(1 - cl(u), 2.4))), a = 1 - sm(u);
        ringF(c, 'e', X, Y, R, T * 0.16, 0.85 * a); ringF(c, 'r', X, Y, R * 0.7, T * 0.22, 0.5 * a); glowF(c, X, Y, T * 1.1 * g.k, MINT, 0.35 * (1 - sm(u * 2)), GY);
        c.save(); c.globalCompositeOperation = 'lighter'; const n = 8 + 2 * Math.min(4, g.j); for (let i = 0; i < n; i++) { const an = i / n * TAU + g.j, r0 = R * 0.45, L = R * 0.55; c.globalAlpha = 0.5 * a; c.save(); c.translate(X + Math.cos(an) * r0, Y + Math.sin(an) * r0 * GY); c.rotate(Math.atan2(Math.sin(an) * GY, Math.cos(an)) + Math.PI / 2); c.drawImage(streakSpr(), -T * 0.05, 0, T * 0.1, L); c.restore(); } c.restore(); }
      // the seal under the pet from the apex (where it will land), flaring at contact, then fading
      for (const q of J) { const t0 = q.L + q.A * 0.85, t1 = q.C + 0.5; if (t < t0 || t > t1 || !q.launched) continue; const u = (t - t0) / (q.C - t0), X = H.sx(q.fired ? q.cx : me.x + fxF * HAND_DIVE[0] * hT), Y = H.sy(q.fired ? q.cy : me.y) + 0.18 * T;
        const a = t < q.C ? sm(u / 0.4) * (0.6 + 0.4 * u) : 1 - sm((t - q.C) / 0.5), R = q.R * T * (t < q.C ? lerp(0.7, 1, sm(u)) : 1 + 0.15 * sm((t - q.C) / 0.5));
        c.save(); c.translate(X, Y); c.scale(1, GY); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a * (0.75 + 0.1 * q.j)); c.rotate(t * 0.6 + q.j); c.drawImage(sealSpr(0), -R, -R, R * 2, R * 2); c.rotate(-t * 1.9); const r2 = R * 0.72; c.drawImage(sealSpr(1), -r2, -r2, r2 * 2, r2 * 2); c.restore();
        glowF(c, X, Y, R * 0.7, EMER, 0.3 * a, GY); }
      // the impacts on the floor: the shockwave, the ripples, Adept's twin rings, Celestial's bloom
      for (const m of fx.imps) { const tau = t - m.t0, X = H.sx(m.x), Y = H.sy(m.y) + 0.18 * T, Rp = m.R * T, u = cl(tau / 0.42), fr = Rp * 1.12 * (1 - Math.pow(1 - u, 2.3)), a = 1 - sstep(0.25, 0.75, tau);
        glowF(c, X, Y, Rp * 0.9, MINT, 0.55 * Math.exp(-tau * 6), GY);
        { const ca = (1 - sstep(0.15, m.fin ? 1.8 : 1.2, tau)) * sstep(0, 0.05, tau), cr = Rp * (0.55 + 0.04 * m.j) * (0.85 + 0.15 * sm(tau / 0.3)); if (ca > 0.01) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.75 * ca; c.drawImage(craterSpr(), X - cr, Y - cr * GY, cr * 2, cr * 2 * GY); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; } }
        if (fr > 2) { ringF(c, 'e', X, Y, fr, T * (0.32 + 0.05 * m.j) * (m.fin ? 1.5 : 1), a); ringF(c, 'e', X, Y, fr * 0.97, T * 0.12, 0.6 * a); ringF(c, 'r', X, Y, fr * 0.78, T * 0.34, 0.55 * a); if (tier >= 2) ringF(c, 'r', X, Y, fr * 0.58, T * 0.22, 0.35 * a); }
        { const u2 = cl(tau / 0.26), f2 = Rp * 1.45 * (1 - Math.pow(1 - u2, 2)), a2 = 1 - sstep(0.12, 0.42, tau); if (f2 > 2) ringF(c, 'e', X, Y, f2, T * 0.1, 0.7 * a2); }
        if (m.fin) { for (const [dl, sp, kk] of [[0, 0.7, 1.75], [0.12, 0.95, 2.1]]) { const u3 = cl((tau - dl) / sp), f3 = Rp * kk * (1 - Math.pow(1 - u3, 2.2)), a3 = (1 - sstep(0.4, 1.0, (tau - dl) / sp)) * (tau > dl ? 1 : 0); if (f3 > 2) { ringF(c, 'e', X, Y, f3, T * 0.45, 0.75 * a3); ringF(c, 'r', X, Y, f3 * 0.86, T * 0.45, 0.35 * a3); } } }
        if (m.fin && tier === 2) { const u2 = cl(tau / 0.6), r2 = Rp * 1.2 * (1 - Math.pow(1 - u2, 2)), a2 = 1 - sstep(0.4, 1.0, tau); c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(tau * 1.2); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.9 * a2; c.drawImage(twinSpr(), -r2, -r2, r2 * 2, r2 * 2); c.rotate(-tau * 2.4); const r3 = r2 * 0.86; c.globalAlpha = 0.6 * a2; c.drawImage(twinSpr(), -r3, -r3, r3 * 2, r3 * 2); c.restore(); }
        if (m.fin) { const u2 = cl(tau / 0.8), r2 = Rp * (1.1 + 0.15 * tier) * (0.2 + 0.8 * (1 - Math.pow(1 - u2, 2.2))), a2 = 1 - sstep(1.0, 1.8, tau); c.save(); c.translate(X, Y); c.scale(1, GY); c.globalCompositeOperation = 'lighter';
          c.rotate(tau * 1.6); c.globalAlpha = 0.5 * a2; c.drawImage(bloomSpr(), -r2, -r2, r2 * 2, r2 * 2); c.rotate(-tau * 2.7 + 0.45); const r3 = r2 * 0.72; c.globalAlpha = 0.32 * a2; c.drawImage(bloomSpr(), -r3, -r3, r3 * 2, r3 * 2); c.restore();
          if (tier >= 3) { const u3 = cl((tau - 0.1) / 0.6), r4 = Rp * 1.35 * (1 - Math.pow(1 - u3, 2)); c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(-tau * 0.8); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * a2; c.drawImage(twinSpr(), -r4, -r4, r4 * 2, r4 * 2); c.restore(); } }
        // the blades of air peeling out along the floor (their far half under the monsters); the final bloom's far petals
        drawBlades(c, m, tau, X, Y, T, false); if (m.fin) drawSheets(c, m, tau, X, Y, T, false); }
    }
    function drawBlades(c, m, tau, X, Y, T, near) { const Rp = m.R * T, img = bladeSpr(); c.save(); c.globalCompositeOperation = 'lighter';
      for (const b of m.blades) { const sn = Math.sin(b.a); if ((sn > 0) !== near) continue; const u = cl((tau - b.d) / 0.55); if (u <= 0 || u >= 1) continue; const r = Rp * (0.2 + 1.15 * b.k * (1 - Math.pow(1 - u, 2))), lift = T * 0.45 * sm(u) * (m.fin ? 1.3 : 1), x = X + Math.cos(b.a) * r, y = Y + sn * r * GY - lift, a = (1 - sm((u - 0.45) / 0.55)) * sm(u / 0.1) * (near ? nearPet(x, y, T) : 1);
        if (a < 0.01) continue; const w = T * (0.7 + 0.12 * m.j) * b.s * (m.fin ? 1.35 : 1), hgt = w * 0.5 * (0.6 + 0.9 * sm(u)); c.globalAlpha = a; c.save(); c.translate(x, y); c.rotate(Math.atan2(sn * GY, Math.cos(b.a)) + Math.PI / 2); c.scale(1, 0.55 + 0.45 * sm(u)); c.drawImage(img, -w / 2, -hgt, w, hgt); c.restore(); }
      c.restore(); }
    /* the final bloom: great curved petals of wind opening out of a bud round the landing point, two layered rings of
       them turning slowly the other way, lingering about a second as they unfurl */
    function drawSheets(c, m, tau, X, Y, T, near) { if (tau < 0) return; const NP2 = 6 + tier, Lr = m.R * T * 0.95, al = sm(tau / 0.08) * (1 - sstep(1.0, 1.75, tau));
      if (al < 0.01) return; c.save(); c.globalCompositeOperation = 'lighter';
      for (let ly = 0; ly < 2; ly++) { const img = sheetSpr(ly), n = NP2 + ly * 2, open = 0.2 + 1.05 * (1 - Math.pow(1 - cl((tau - 0.03 * ly) / 0.75), 2.4)), grow = (u => 1 + 2.4 * Math.pow(u - 1, 3) + 1.4 * Math.pow(u - 1, 2))(cl((tau - 0.04 * ly) / 0.55)), Ln = Lr * (ly ? 0.72 : 1) * Math.max(0, grow), Wn = Ln * 0.55;
        for (let i = 0; i < n; i++) { const a = (i + ly * 0.5) / n * TAU + tau * (ly ? -0.35 : 0.25), sn = Math.sin(a); if ((sn > 0) !== near) continue;
          const dx = Math.cos(a) * Math.sin(open), dy = sn * GY * Math.sin(open) - Math.cos(open), ang = Math.atan2(dx, -dy), r0 = m.R * T * 0.12, bx = X + Math.cos(a) * r0, by = Y + sn * r0 * GY;
          const k = Math.hypot(dx, dy), fw = 0.45 + 0.55 * Math.abs(Math.sin(a)) * 0.6 + 0.25, aa = al * (ly ? 0.4 : 0.62) * (near ? 0.55 * nearPet(bx + dx * Ln * 0.5, by + dy * Ln * 0.5, T) : 1);
          c.globalAlpha = aa; c.save(); c.translate(bx, by); c.rotate(ang); c.drawImage(img, -Wn * fw / 2, -Ln * k, Wn * fw, Ln * k); c.restore(); } }
      c.restore(); }
    function draw(c, f, X0, Y0, T) {
      const t = lastT, F2 = feet(T);
      // formation motes gathering onto the spear's line
      if (t < FORM) { spearNow(T); c.save(); c.globalCompositeOperation = 'lighter'; const gs = glowSprite(MINT);
        for (const p of fx.form) { const u = cl((t - p.t0) / p.t1); if (u >= 1 || t < p.t0) continue; const e = u * u * (3 - 2 * u), tx = lerp(SP.buX, SP.tipX, p.u), ty = lerp(SP.buY, SP.tipY, p.u), sx0 = F2[0] + Math.cos(p.a) * p.d * T, sy0 = F2[1] - p.h * T + Math.sin(p.a) * p.d * T * 0.5, x = lerp(sx0, tx, e), y = lerp(sy0, ty, e) - Math.sin(e * Math.PI) * T * 0.2, s = p.s * T * (1.4 - 0.6 * e) * 2;
          c.globalAlpha = Math.min(1, u * 4) * (1 - sm((u - 0.85) / 0.15)); c.drawImage(gs, x - s, y - s, s * 2, s * 2); } c.restore(); }
      // the circling dust, leaves and petals at the launch point (prep)
      for (const o of fx.orbit) { const X = H.sx(me.x) + Math.cos(o.a) * o.r * T, Y = H.sy(me.y) + 0.18 * T + Math.sin(o.a) * o.r * T * GY - o.z * T - Math.sin(t * 3 + o.a) * T * 0.05, a = sstep(FORM - 0.1, FORM + 0.25, t) * nearPet(X, Y, T); if (a < 0.02) continue;
        const sz = o.s * T * 2, img = o.k === 'p' ? petalSpr(o.v, ((o.rot / TAU * NROT | 0) % NROT + NROT) % NROT) : leafSpr(o.v, ((o.rot / TAU * NROT | 0) % NROT + NROT) % NROT); c.globalAlpha = a; c.drawImage(img, X - sz / 2, Y - sz / 2, sz, sz); }
      c.globalAlpha = 1;
      // falling: streaks of white-green light stretching up behind the pet
      if (fx.streaks.length) { c.save(); c.globalCompositeOperation = 'lighter'; const sp = streakSpr(); for (const s of fx.streaks) { const u = s.t / s.life, X = H.sx(s.wx), Y = H.sy(s.y0) + 0.18 * T - s.z * T, L = T * s.len * (0.6 + 0.8 * u); c.globalAlpha = 0.55 * (1 - u); c.drawImage(sp, X - T * 0.05, Y - L, T * 0.1, L); } c.restore(); }
      // the impacts in the air: the core flash, the near blades, the fountain opening into curls
      for (const m of fx.imps) { const tau = t - m.t0, X = H.sx(m.x), Y = H.sy(m.y) + 0.18 * T, k = m.fin ? 1.4 : 1;
        const ck = Math.exp(-tau * 9); if (ck > 0.02) { c.save(); c.globalCompositeOperation = 'lighter'; const cr = T * (0.8 + 0.08 * m.j) * k * (0.75 + 0.5 * (1 - ck)); c.globalAlpha = 0.85 * ck; c.drawImage(coreSpr(), X - cr, Y - cr * 0.62, cr * 2, cr * 1.24); c.globalAlpha = (m.fin ? 0.3 : 0.6) * ck; const c2 = cr * 0.55; c.drawImage(coreSpr(), X - c2, Y - c2 * 0.62, c2 * 2, c2 * 1.24); c.restore(); glowF(c, X, Y - T * 0.1, T * 1.3 * k, MINT, 0.4 * ck); glowF(c, X, Y, cr * 1.5, EMER, 0.35 * ck, GY); }
        // the vertical wind spike (the final: a towering column)
        { const sp = m.fin ? 0.3 : 0.16, hh = T * (m.fin ? 4.5 + 0.8 * tier : 1.7 + 0.35 * m.j) * (1 - Math.pow(1 - cl(tau / sp), 2)), ww = T * (m.fin ? 1.1 + 0.15 * tier : 0.45 + 0.04 * m.j) * (1 + 0.3 * sm(tau / 0.6)), ca = sm(tau / 0.04) * (1 - sstep(m.fin ? 0.5 : 0.18, m.fin ? 1.4 : 0.5, tau)); if (ca > 0.01 && hh > 2) { const cs = columnSpr(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = (m.fin ? 0.65 : 0.6) * ca; c.drawImage(cs, X - ww / 2, Y - hh, ww, hh); if (m.fin) { c.globalAlpha = 0.5 * ca; c.drawImage(cs, X - ww * 0.22, Y - hh * 1.12, ww * 0.44, hh * 1.12); } c.restore(); } }
        drawBlades(c, m, tau, X, Y, T, true); if (m.fin) drawSheets(c, m, tau, X, Y, T, true);
        // the fountain: strands rising round the spear, then curling outward at the top
        c.save(); c.globalCompositeOperation = 'lighter'; const sp = streakSpr(), cu = curlSpr();
        for (const s of m.strands) { const u = cl((tau - s.d) / 0.5); if (u <= 0 || u >= 1) continue; const x = X + Math.cos(s.a) * s.r * T * m.R * 0.7 * (1 + 0.4 * u), y = Y + Math.sin(s.a) * s.r * T * m.R * 0.7 * GY, hh = s.h * T * sm(u / 0.55), a = (1 - sm((u - 0.5) / 0.5)) * 0.65 * nearPet(x, y - hh * 0.5, T);
          if (a < 0.01) continue; c.globalAlpha = a; c.drawImage(sp, x - T * 0.05 * s.w, y - hh, T * 0.1 * s.w, hh);
          const cuK = sm((u - 0.35) / 0.4); if (cuK > 0.01) { const side = Math.cos(s.a) >= 0 ? 1 : -1, cw = T * 0.42 * s.w * k * (0.5 + 0.5 * cuK), ch = cw * 1.3; c.globalAlpha = a * cuK * 0.8; c.save(); c.translate(x, y - hh); c.scale(side, 1); c.drawImage(cu, -cw * 0.15, -ch * 0.25, cw, ch); c.restore(); } }
        c.restore(); }
      // Celestial's last dive: the nearby particles drawn inward to the landing point
      if (fx.inward.length) { const gs = glowSprite(MINT); for (const p of fx.inward) { const q = LAST, u = cl((t - p.t0) / (p.t1 - p.t0)), e = u * u * u, r = p.r * (1 - e), a = p.a + e * 2.2, tx = q.fired ? q.cx : me.x + fxF * HAND_DIVE[0] * hT, x = H.sx(tx + Math.cos(a) * r), y = H.sy(me.y + Math.sin(a) * r * GY) + 0.18 * T - p.z * T * (1 - e), sz = p.s * T * 2 * (1 - 0.4 * e);
        if (p.k === 'm') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8 * sm(u * 5); c.drawImage(gs, x - sz, y - sz, sz * 2, sz * 2); c.globalCompositeOperation = 'source-over'; }
        else { c.globalAlpha = sm(u * 5); c.drawImage(p.k === 'p' ? petalSpr(p.v, (t * 9 + p.a * 3 | 0) % NROT) : leafSpr(p.v, (t * 9 + p.a * 3 | 0) % NROT), x - sz / 2, y - sz / 2, sz, sz); } } c.globalAlpha = 1; }
      // Celestial's rising spiral of leaves and petals opening overhead
      for (const p of fx.spiral) { const tau = t - p.t0; if (tau < 0) continue; const m = fx.imps.find(q => q.fin) || { x: me.x, y: me.y }, u = cl(tau / 1.8), r = (p.r0 + 2.4 * Math.pow(u, 1.2)) * T, an = p.a + tau * 3.2, X = H.sx(m.x) + Math.cos(an) * r, Y = H.sy(m.y) + 0.18 * T + Math.sin(an) * r * GY - T * (0.3 + 4.2 * Math.pow(u, 0.8)), a = sm(tau / 0.15) * (1 - sm((u - 0.6) / 0.4)) * nearPet(X, Y, T), sz = p.s * T * 2;
        if (a < 0.02) continue; c.globalAlpha = a; c.drawImage(p.k === 'p' ? petalSpr(p.v, (an * 2.5 | 0) % NROT) : leafSpr(p.v, (an * 2.5 | 0) % NROT), X - sz / 2, Y - sz / 2, sz, sz); }
      c.globalAlpha = 1;
      // loose leaves, petals and motes
      { const gs = glowSprite(MINT); for (const p of fx.parts) { const X = H.sx(p.x), Y = H.sy(p.y) + 0.18 * T - p.z * T, u = p.t / p.life, a = sm(p.t / 0.08) * (1 - sm((u - 0.7) / 0.3)) * nearPet(X, Y, T); if (a < 0.02) continue; const sz = p.s * T * 2;
        if (p.kind === 'm') { c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.drawImage(gs, X - sz, Y - sz, sz * 2, sz * 2); c.globalCompositeOperation = 'source-over'; }
        else { c.globalAlpha = a; const b = ((p.rot / TAU * NROT | 0) % NROT + NROT) % NROT; c.drawImage(p.kind === 'p' ? petalSpr(p.v, b) : leafSpr(p.v, b), X - sz / 2, Y - sz / 2, sz, sz); } } c.globalAlpha = 1; }
      // the dissolve's sparks and the ribbon's last motes
      if (fx.sparks.length) { const gs = glowSprite(MINT); c.save(); c.globalCompositeOperation = 'lighter'; for (const s of fx.sparks) { const u = s.t / s.life; c.globalAlpha = 0.9 * (1 - u); const r = s.s * (1 - 0.5 * u); c.drawImage(gs, s.X - r * 2, s.Y - r * 2, r * 4, r * 4); } c.restore(); }
    }
    return F;
  };
  U.fujin.warm = o => {
    const ev = Math.max(1, Math.min(7, Math.round(o.evo || 1))), tier = tierOf(ev);
    setTimeout(() => { const T = typeof o.T === 'function' ? o.T() : o.T; if (!(T > 0)) return; const dpr = typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, RES = Math.min(2, Math.max(1, dpr));
      setScale(BAKE_L * T * RES * SS); plan(tier); let i = 0; const spr = () => { const t0 = nowMs(); while (i < WARM.length && nowMs() - t0 < 2) WARM[i++](); if (i < WARM.length) setTimeout(spr, 30); }; spr(); idleBake(); }, 300);
  };
  // the debug door for the harness
  U.fujin.__dbg = { SC, bakeStep, setScale, plan, bodyGen, emisGen, stripGeo, NA, NPH, SS, WARM };
})();
