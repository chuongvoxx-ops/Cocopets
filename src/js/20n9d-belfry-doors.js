/* ---------- v430 BW: the Drowned Belfry's doors, rebuilt (BEL_DOORS) ----------
   The user (v429): "The existing doors do not match the graphical quality of the newly upgraded environment props ...
   heavy weathered bronze and dark metallic framing, thick dimensional door panels, gothic arches and ornamental stone
   surrounds, intricate engraved patterns, reinforced hinges, decorative mechanical locking mechanisms, glowing runes ...
   Do not replace every door with an identical generic model ... Do not change existing door positions, trigger volumes,
   collision behaviour or progression requirements."
   One drowned-bronze gothic language, painted once per size by the Belfry's software shading pass (BELPROPS.kit, 20n9:
   every pixel of a solid gets a normal and a material and is lit in the Belfry's light), as relief: limestone blocks
   with the sea's black tide stain, bevelled joints and voussoirs, bronze colonnettes, trims and straps with verdigris in
   the hollows and worn bright on the edges, rivets, engraved wave tracery, rune gems of turquoise glass. Each door is its
   pieces (a surround, its leaves or grille, its lock), laid down per frame and moved: the leaves swing on their hinges
   (foreshortened about the hinge line, their thickness and their shade turning with them), a portcullis rises into its
   arch, bolts slide back into the jambs, a lock rosette turns; their mass is in the timing (a slow start, a heavy end, a
   small settle) and in what they shake loose (dust from the lintel and the sill, drips off the bronze; a small shake of the
   screen on a great gate). What glows (the runes, the light through an open door, the lock's ring as it turns, the dust)
   is the GPU painter's (NIDHOGG_MOVES.FGFX), lowFx thinning it.
   The doors:
     std    a standard progression door (the Lower Church's and the Foundry's exit): a pointed arch on clustered bronze
            colonnettes, a rune keystone, two bronze leaves (two panels each, wave tracery, strap hinges), a lock rosette
     boss   a boss arena entrance (the Storm Galleries' exit, to Uldroth): taller, a double archivolt, pinnacled buttresses,
            a bronze bell crest over the apex, three-panel leaves with the bell's emblem, two great bolts across them and
            a larger rosette (the bolts draw back, then the rosette turns, then the leaves swing)
     lift   the Clapper Counterweights' lift: a bronze-framed shaft arch under a headframe with two sheave wheels; a bronze
            portcullis rises into the arch while the counterweights sink on their chains and the wheels turn
     hall   (the Hall of Three Tides, 20n1) its three puzzle gates and the central doorway keep their own frames; they gain
            new bronze leaves, a turning lock rosette, sinking sluice slabs and the dust and shake of their mass (pic/fx)
   Positions, exits (their trigger radius), collision and progression are the stages' own, untouched: a door only reads
   whether its stage says it is open. The exit's old stone gate (20m riftGate) gives way to the stage's door while a Belfry
   stage runs (claim); elsewhere it is drawn as before. Without BELPROPS (window.__BELP = 0) or with window.__BELD = 0 the
   old art is drawn.
   API (global BEL_DOORS): pic(c, name, v, Xs, Ys, T, o) a picture with its feet (or its centre) at a screen spot (o.sx a squash about o.pv px from them);
   stage(X, C, kind) / tick(C, dt) / claim(...) the exit door of the running stage; state(C) its door's numbers (tests);
   lockArt(c, kind, Xs, Ys, T, rot) a rosette; dust(key, x, y, w, k) a door's dust (draw-time) and fx(c) its light;
   warm(P) the pictures painted at a stage's loading.
   v437 GR: the Garden of Unborn Stars' exits use these doors too, in its sections' light: a door may carry a theme
   (defTheme / themed: the kit's light it is painted in, its rune glass, the colours of its GPU light and of the light in its
   opening), its pictures cached apart; stage(X, C, kind, theme), warmDoor(P, kind, id). A door without one is the Belfry's. */
var BEL_DOORS = (() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const BP = () => (typeof window !== 'undefined' && window.BELPROPS && window.BELPROPS.kit && window.__BELP !== 0 && window.__BELD !== 0) ? window.BELPROPS : null;
  const FG = () => { try { if (typeof window !== 'undefined' && (window.__BEL_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  const STATS = { painted: 0, paintMs: 0, draws: 0, misses: 0, claims: 0 };

  /* the doors' measures (tiles): the opening's half width WO, the arch's springing ZS and apex ZA, the jamb's width JW, the
     arch ring's width RW, the sill PL; the leaves' thickness TH */
  const GEO = {
    std: { WO: 0.92, ZS: 1.78, ZA: 2.62, JW: 0.46, RW: 0.4, PL: 0.14, TH: 0.12 },
    boss: { WO: 1.12, ZS: 2.08, ZA: 3.12, JW: 0.6, RW: 0.48, PL: 0.18, TH: 0.16 },
    lift: { WO: 0.98, ZS: 2.2, ZA: 2.86, JW: 0.42, RW: 0.36, PL: 0.14, TH: 0.08 } };
  /* a pointed arch: the top of the opening over x (two arcs meeting at the apex; vertical where they spring) */
  function archZ(x, wo, zs, za) { const ax = Math.abs(x); if (ax > wo) return -1; const H = za - zs, R = (H * H + wo * wo) / (2 * wo), xc = wo - R; return zs + Math.sqrt(Math.max(0, R * R - (ax - xc) * (ax - xc))); }
  const archC = (wo, zs, za) => { const H = za - zs, R = (H * H + wo * wo) / (2 * wo); return { R, xc: wo - R }; };

  /* ======================= the relief painter =======================
     geo(x, z, o) -> coverage 0..1 (0 outside, no fields set); sets o.h (its height toward the viewer, tiles), o.id, o.u, o.v,
     o.ao and any fields its material reads; mat(o, x, z) sets the kit's material. The normal is the height's slope */
  function relief(K, S, x0, z0, x1, z1, geo, mat) { const P = S.P, e = 0.7 / P, o = {}, q = {};
    const pxa = Math.max(0, Math.floor(S.ax + x0 * P)), pxb = Math.min(S.w - 1, Math.ceil(S.ax + x1 * P)), pya = Math.max(0, Math.floor(S.ay - z1 * P)), pyb = Math.min(S.h - 1, Math.ceil(S.ay - z0 * P));
    S.lock();
    for (let py = pya; py <= pyb; py++) { const z = (S.ay - py - 0.5) / P;
      for (let px = pxa; px <= pxb; px++) { const x = (px + 0.5 - S.ax) / P; o.h = 0; o.ao = 1; o.id = 0; const a = geo(x, z, o); if (!(a > 0.003)) continue;
        q.h = o.h; q.ao = 1; geo(x + e, z, q); const hx = q.h; q.h = o.h; geo(x, z + e, q); const hz = q.h;
        const dx = (hx - o.h) / e, dz = (hz - o.h) / e, l = Math.hypot(dx, 1, dz); K.M0(); K.M.ao = o.ao; mat(o, x, z); K.shade(-dx / l, 1 / l, -dz / l); K.put(S, px, py, Math.min(1, a)); } }
    S.unlock(); }
  const cov = (d, P) => clamp(d * P + 0.5, 0, 1);   // (a shape's coverage from its distance inside, tiles)
  const bev = (d, w) => -w * (1 - ss(0, w * 1.6, d));  // (a bevel: the height falling off toward an edge d tiles away)
  const dome = (d, r) => d < r ? Math.sqrt(1 - (d / r) * (d / r)) * r * 0.8 : 0;

  /* ======================= materials ======================= */
  function stoneM(K, o, x, z, sd, stain) { if (PT && PT.stoneM) return PT.stoneM(K, o, x, z, sd, stain);   /* v472 YE: a themed door may bring its own stone (the Engine's hull plates) */ K.lime(x * 1.3 + o.u * 0.7, z * 1.1 + o.v * 0.5, K.M.ao, sd + (o.blk || 0) * 1.7, stain, z, { tone: 0.94 + 0.12 * ((o.blk || 0) * 0.37 % 1) }); }
  function bronzeM(K, x, z, sd, wear, k) { if (PT && PT.metalM) return PT.metalM(K, x, z, sd, wear, k);   /* v472 YE: and its own metal (gunmetal) */ K.bronze(x * 1.4, z * 1.2, K.M.ao, sd, wear, false, k); }
  function gemM(K, k) { const M = K.M, g = PT && PT.gem; M.r = 0.06; M.g = 0.42; M.b = 0.44; M.rg = 0.08; M.cc = 1; M.mt = 0; M.er = 0.05 * k; M.eg = 0.42 * k; M.eb = 0.4 * k;
    if (g) { M.r = g[0]; M.g = g[1]; M.b = g[2]; M.er = g[0] * k; M.eg = g[1] * k; M.eb = g[2] * k; } }   // v437 GR: (a themed door's rune glass: its light's colour)
  function darkM(K) { const M = K.M; M.r = 0.03; M.g = 0.05; M.b = 0.06; M.rg = 0.7; }

  /* ======================= the surround (std | boss | lift) ======================= */
  function frameGeo(kind) { const G = GEO[kind], { WO, ZS, ZA, JW, RW, PL } = G, outW = WO + RW, outZA = ZA + RW * 1.12, ci = archC(WO, ZS, ZA), co = archC(outW, ZS, outZA), boss = kind === 'boss', lift = kind === 'lift';
    const rw2 = boss ? RW * 0.62 : 0, out2W = outW + rw2, out2ZA = outZA + rw2 * 1.15, BW = boss ? 0.34 : 0;   // (boss: a second archivolt and buttresses)
    const xMax = WO + JW + 0.1 + BW;
    return (x, z, o) => { const ax = Math.abs(x), sd = x < 0 ? -1 : 1;
      // the sill (a step across the whole door, its top edge bevelled)
      if (z >= 0 && z <= PL && ax <= xMax) { const d = Math.min(PL - z, z, xMax - ax); o.id = 1; o.blk = Math.floor((x + 3) / 0.62); o.u = x; o.v = z; o.h = bev(PL - z, 0.035) + bev(xMax - ax, 0.03) - (Math.abs(((x + 3) / 0.62) % 1 - 0.5) > 0.47 ? 0.012 : 0); return cov(d, 60); }
      if (z < PL) return 0;
      const inZ = archZ(x, WO, ZS, ZA); if (ax < WO && z < inZ) return 0;   // (the opening)
      // the jambs: clustered colonnettes of bronze on the inner edge, courses of limestone outside them
      if (ax >= WO && ax <= WO + JW && z <= ZS + 0.02) { const lx = ax - WO, cw = lift ? 0.1 : 0.15;
        if (lx < cw) { const t2 = lx / cw * 2 - 1; o.id = 3; o.u = x; o.v = z; o.h = Math.sqrt(Math.max(0, 1 - t2 * t2)) * 0.07 + (Math.abs(z - (ZS - 0.12)) < 0.06 || Math.abs(z - PL - 0.12) < 0.06 ? 0.03 : 0); o.wear = 0.5; return cov(Math.min(lx, z - PL + 0.2), 80); }
        const course = lift ? 0.5 : 0.42, ci2 = Math.floor((z - PL) / course), jx = ((ci2 + (sd > 0 ? 1 : 0)) % 2) ? 0.55 : 0.3, fz = (z - PL) / course - ci2, fx = (lx - cw) / (JW - cw);
        const dj = Math.min(fz, 1 - fz) * course, dv = Math.abs(fx - jx) * (JW - cw); o.id = 2; o.blk = ci2 * 2 + (sd > 0 ? 1 : 0) + (fx > jx ? 7 : 0); o.u = x; o.v = z; o.h = bev(dj, 0.025) + bev(dv, 0.02) + bev(WO + JW - ax, 0.03);
        if (lift && Math.abs(lx - JW * 0.62) < 0.05) { o.id = 4; o.h = 0.03; o.wear = 0.2; }   // (the lift: a bronze guide rail up each jamb)
        return cov(WO + JW - ax, 60); }
      // the impost: a bronze-banded capital where the arch springs
      if (ax >= WO - 0.02 && ax <= WO + JW + 0.05 && z > ZS - 0.02 && z <= ZS + 0.14) { o.id = 4; o.u = x; o.v = z; o.h = 0.04 + bev(Math.min(z - ZS + 0.02, ZS + 0.14 - z), 0.02); o.wear = 0.6; return cov(Math.min(WO + JW + 0.05 - ax, ZS + 0.14 - z), 60); }
      // the arch ring: voussoirs about each half's centre, a keystone with a rune gem at the apex
      const oz = archZ(x, outW, ZS, outZA);
      if (ax <= outW && z >= ZS && z <= oz) { const nV = boss ? 6 : 5, seg = Math.max(0, Math.atan2(z - ZS, ax - ci.xc)), q = seg / Math.atan2(ZA - ZS, -ci.xc) * nV, fq = q - Math.floor(q);
        const dIn = z - inZ, dOut = oz - z; o.u = x; o.v = z; o.blk = Math.floor(q) + (sd > 0 ? 20 : 0);
        if (ax < 0.17 && z > ZA - 0.06) { o.id = 5; o.h = 0.05 + bev(0.17 - ax, 0.02); const gd = Math.hypot(x, z - (ZA + RW * 0.52)); if (gd < 0.095) { o.id = 6; o.h = 0.06 + dome(gd, 0.095) * 0.6; o.gk = 1 - gd / 0.095; } else if (gd < 0.13) { o.id = 4; o.h = 0.07; o.wear = 0.7; } return cov(Math.min(dOut + 0.12, 0.17 - ax + 0.2), 60); }
        o.id = 2; o.h = bev(Math.min(fq, 1 - fq) * 0.5, 0.02) + bev(dIn, 0.03) + bev(dOut, 0.03); if (dIn < 0.06) { o.id = 4; o.h = 0.025; o.wear = 0.5; }   // (a bronze trim round the inner edge)
        return cov(Math.min(dIn, dOut), 60); }
      // the hood moulding (std, lift) or the second archivolt (boss), then the keystone's crown
      if (ax < 0.17 && z > oz && z < oz + 0.12) { o.id = 5; o.u = x; o.v = z; o.h = 0.05; return cov(Math.min(0.17 - ax, oz + 0.12 - z), 60); }
      if (!boss) { const hz = archZ(x, outW + 0.08, ZS + 0.05, outZA + 0.1); if (ax <= outW + 0.08 && z > oz && z <= hz) { o.id = 4; o.u = x; o.v = z; o.h = 0.03 + dome(Math.min(z - oz, hz - z), 0.05) * 0.5; o.wear = 0.4; return cov(hz - z, 70); } }
      else { const o2 = archZ(x, out2W, ZS, out2ZA); if (ax <= out2W && z > oz && z <= o2) { const th = Math.atan2(z - ZS, ax - co.xc), q = th / Math.atan2(outZA - ZS, -co.xc) * 9, fq = q - Math.floor(q); o.id = 2; o.blk = Math.floor(q) + 40; o.u = x; o.v = z; o.h = -0.015 + bev(Math.min(fq, 1 - fq) * 0.4, 0.015) + bev(o2 - z, 0.025) + 0.02 * Math.sin(th * 40) * ss(0.02, 0.06, Math.min(z - oz, o2 - z)); return cov(o2 - z, 60); } }
      // boss: buttresses with pinnacles outside the jambs; the bell crest over the apex
      if (boss) { const bx0 = WO + JW, bx1 = bx0 + BW;
        if (ax > bx0 - 0.01 && ax <= bx1) { const top = ZS + 0.55, lx = (ax - bx0) / BW; if (z <= top) { const cz = Math.floor(z / 0.5); o.id = 2; o.blk = cz + 60 + (sd > 0 ? 9 : 0); o.u = x; o.v = z; o.h = 0.02 + bev(Math.min(z % 0.5, 0.5 - z % 0.5), 0.02) + bev(bx1 - ax, 0.03) - lx * 0.02; return cov(bx1 - ax, 60); }
          const pk = top + 0.75, hw = (bx1 - bx0) / 2 * (1 - (z - top) / (pk - top)), cxp = (bx0 + bx1) / 2, dd = hw - Math.abs(ax - cxp); if (z <= pk && dd > 0) { o.id = 4; o.u = x; o.v = z; o.h = dd * 0.4; o.wear = 0.5; return cov(dd, 60); } }
        const zb = out2ZA + 0.08, bh = 0.62; if (z > zb - 0.02 && z < zb + bh + 0.2) { const tb = (z - zb) / bh;   // (the bell: a flared lip, a waist, a rounded crown, a hanging loop)
          let bw = tb >= 0 && tb <= 1 ? 0.15 + 0.2 * Math.pow(1 - tb, 3) + (tb < 0.07 ? 0.025 : 0) : -1; if (tb > 0.78 && bw > 0) bw *= Math.sqrt(Math.max(0, 1 - Math.pow((tb - 0.78) / 0.22, 2))) * 0.35 + 0.65 * Math.sqrt(Math.max(0, 1 - Math.pow((tb - 0.78) / 0.22, 2)));
          if (bw > 0 && Math.abs(x) < bw) { const r2 = Math.abs(x) / bw; o.id = 4; o.u = x; o.v = z; o.h = Math.sqrt(Math.max(0, 1 - r2 * r2)) * 0.11 + (Math.abs(tb - 0.07) < 0.03 || Math.abs(tb - 0.55) < 0.025 ? 0.015 : 0); o.wear = 0.3; o.bell = 1; return cov(Math.min(bw - Math.abs(x), (tb + 0.01) * bh), 60); }
          const ld = Math.abs(Math.hypot(x, z - (zb + bh + 0.06)) - 0.07); if (ld < 0.025 && z > zb + bh - 0.02) { o.id = 4; o.u = x; o.v = z; o.h = 0.03; o.wear = 0.6; return cov(0.025 - ld, 70); } } }
      // lift: the headframe (a bronze beam over the arch, two sheave housings, the beam's brackets)
      if (lift) { const bz0 = outZA + 0.05, bz1 = bz0 + 0.26, bw = WO + JW + 0.05; if (ax <= bw && z >= bz0 && z <= bz1) { o.id = 4; o.u = x; o.v = z; o.h = 0.04 + bev(Math.min(z - bz0, bz1 - z), 0.03) + (Math.abs(((x + 3) / 0.22) % 1 - 0.5) < 0.12 && Math.abs(z - (bz0 + bz1) / 2) < 0.07 ? 0.025 : 0); o.wear = 0.4; return cov(Math.min(bw - ax, bz1 - z), 60); }
        if (ax > outW - 0.05 && ax <= bw && z > ZS + 0.1 && z < bz0) { o.id = 2; o.blk = 80 + (sd > 0 ? 1 : 0); o.u = x; o.v = z; o.h = bev(bw - ax, 0.03); return cov(bw - ax, 60); } }
      return 0; }; }
  function frameMat(kind) { const sd = kind === 'boss' ? 3.1 : kind === 'lift' ? 5.3 : 1.7, stain = kind === 'lift' ? 0.8 : 0.95;
    return (K, o, x, z) => { if (o.id === 1 || o.id === 2 || o.id === 5) { stoneM(K, o, x, z, sd, stain); if (o.id === 5) { K.M.r *= 1.04; K.M.g *= 1.04; } return; }
      if (o.id === 6) { gemM(K, 0.35 + 0.65 * (o.gk || 0)); return; } bronzeM(K, x, z, sd + (o.bell ? 2 : 0), o.wear || 0.3, z < 0.9 ? (0.9 - z) * 0.4 : 0); }; }
  function paintFrame(K, S, kind) { const G = GEO[kind], b = boxOf('frame', kind); K.contact(S, 0, 0.02, G.WO + G.JW + 0.5, 0.3, 0.55);
    const geo = frameGeo(kind), mat = frameMat(kind); relief(K, S, b[0], -b[3], b[2], -b[1], geo, (o, x, z) => mat(K, o, x, z));
    K.ink(S, [10, 20, 24], 0.55); const c = S.c, top = G.ZA + G.RW; K.glint(c, -(G.WO + 0.05), -(G.ZS + 0.06), 0.13, 0.55); K.glint(c, 0.12, -(top + 0.02), 0.1, 0.5); if (kind === 'boss') K.glint(c, -0.12, -(top + G.RW * 0.7 + 0.5), 0.14, 0.7); }

  /* ======================= the leaves (std l/r, boss l/r, hall l/r) =======================
     a leaf from its hinge (the outer edge) to the seam at x = 0, under the arch (or flat, the hall's): a bronze slab with a
     raised border and meeting stile, recessed panels with engraved tracery (waves; the boss's bell; the hall's tide),
     studs, two strap hinges from the hinge edge ending in trefoils, the hinge's knuckles */
  function leafGeo(kind, side) { const hall = kind === 'hall', G = hall ? { WO: 2.55, ZS: 3.5, ZA: 3.5, PL: 0 } : GEO[kind], { WO, ZS, ZA, PL } = G, boss = kind === 'boss';
    const topZ = x => hall ? ZS : archZ(x, WO, ZS, ZA) - 0.01, bands = hall ? [PL + 0.25, 1.55, 2.0, 3.25] : boss ? [PL + 0.22, 0.95, 1.12, 1.92, 2.08] : [PL + 0.2, 0.98, 1.14], nP = boss ? 3 : 2;
    const straps = hall ? [0.62, 1.78, 2.92] : boss ? [PL + 0.52, 1.5, 2.45] : [PL + 0.48, 1.42];
    return (x, z, o) => { const lx = -x * side; /* (lx: 0 at the seam .. WO at the hinge) */ if (lx < -0.004 || lx > WO + 0.004 || z < PL) return 0; const tz = topZ(lx); if (z > tz) return 0;
      const dEdge = Math.min(lx + 0.02, WO - lx, z - PL, tz - z), dSeam = lx; o.u = x; o.v = z; o.h = 0; o.wear = 0.15; o.id = 10;
      // the border and the meeting stile, raised
      const bW = hall ? 0.16 : 0.11; let frame = dEdge < bW || dSeam < bW * 1.25; for (const bz of bands) if (Math.abs(z - bz) < 0.045) frame = true;
      // the panels: recessed, a bevel down into them, tracery in them
      if (!frame) { const pi = bands.findIndex((bz, i) => z > bz && (i === bands.length - 1 || z < bands[i + 1])); const inner = Math.min(dEdge - bW, dSeam - bW * 1.25, ...bands.map(bz => Math.abs(z - bz) - 0.045)); o.h = -0.035 + bev(inner, 0.02) * -0.5 + (1 - ss(0, 0.04, inner)) * 0.02; o.ao = 0.82 + 0.18 * ss(0, 0.08, inner); o.id = 11; o.pi = pi;
        if (hall) { const w = Math.sin(lx * 9 + Math.sin(z * 4.3) * 1.6) * 0.5 + 0.5, ring = Math.abs(Math.hypot(lx - WO * 0.5, z - 2.65) - 0.42); if (Math.abs(w - 0.5) < 0.05 || ring < 0.03) o.h += 0.012; }
        else if (boss && pi === 2) { const bd = Math.hypot((lx - 0.0) / 0.55, (z - 2.45) / 0.36); if (Math.abs(bd - 1) < 0.06 && z > 2.25) o.h += 0.016; if (Math.abs(z - 2.25) < 0.025 && lx < 0.6) o.h += 0.014; }   // (half the bell, engraved across both leaves)
        else { const w = Math.sin(lx * 12 + Math.sin(z * 7 + side) * 1.4); if (Math.abs(w) < 0.09) o.h += 0.012 * (1 - Math.abs(w) / 0.09); const tr = Math.abs(Math.hypot(lx - WO * 0.5, z - (pi === nP - 1 ? (ZS + ZA) / 2 - 0.15 : 0.62)) - 0.2); if (tr < 0.025) o.h += 0.014; } }
      else { o.h = 0.02 + bev(dEdge, 0.02) * 0.5; o.wear = 0.45; }
      // studs on the border, a stud row on the meeting stile
      const sy = ((z - PL) / 0.2) % 1 - 0.5, sdB = Math.hypot((dSeam - bW * 0.6) / 0.2 * 0.6, sy * 0.6); if (frame && dSeam < bW * 1.25 && Math.abs(sy) < 0.2 && Math.abs(dSeam - bW * 0.62) < 0.04) { o.h += dome(Math.hypot(dSeam - bW * 0.62, sy * 0.2), 0.035) * 0.8; o.wear = 0.8; } void sdB;
      // the strap hinges (from the hinge edge), their rivets and trefoil ends; the knuckles on the hinge edge
      const sL = WO * (hall ? 0.62 : 0.72); for (const s of straps) { const dz = Math.abs(z - s), ex = WO - lx; if (ex < sL && dz < 0.055 + 0.02 * ss(sL - 0.25, sL, ex)) { o.h = 0.05 + dome(dz, 0.06) * 0.15; o.id = 12; o.wear = 0.55; if (Math.abs((ex / 0.16) % 1 - 0.5) < 0.18 && dz < 0.025) o.h += 0.012; }
        const tdd = Math.min(Math.hypot(ex - sL, z - s), Math.hypot(ex - sL + 0.04, z - s - 0.07), Math.hypot(ex - sL + 0.04, z - s + 0.07)); if (tdd < 0.06) { o.h = 0.05 + dome(tdd, 0.06) * 0.3; o.id = 12; o.wear = 0.6; }
        if (ex < 0.07 && dz < 0.16) { o.h = 0.07 * Math.sqrt(Math.max(0, 1 - (ex / 0.07 * 2 - 1) ** 2)) + 0.02; o.id = 12; o.wear = 0.5; } }
      return cov(Math.min(dEdge + 0.02, tz - z), 70); }; }
  function paintLeaf(K, S, kind, v) { const side = v === 'l' ? 1 : -1, geo = leafGeo(kind, side), sd = (kind === 'boss' ? 7.7 : kind === 'hall' ? 9.1 : 4.4) + (side > 0 ? 0 : 1.3), b = boxOf('leaf', kind + v);
    relief(K, S, b[0], -b[3], b[2], -b[1], geo, (o, x, z) => { bronzeM(K, x * 1.2, z, sd, o.wear, (o.id === 11 ? 0.18 : 0) + (z < 0.8 ? (0.8 - z) * 0.5 : 0)); if (o.id === 11) { K.M.ao *= 0.92; } });
    K.ink(S, [12, 18, 18], 0.45); }

  /* ======================= the lock rosette (std, boss, cer) =======================
     a bronze disc on the seam: a toothed rim, a ring of turquoise enamel with rune ticks, four spokes, a boss with a keyhole */
  function paintLock(K, S, v) { const R = v === 'boss' ? 0.36 : v === 'cer' ? 0.42 : 0.27;
    relief(K, S, -R - 0.05, -R - 0.05, R + 0.05, R + 0.05, (x, z, o) => { const r = Math.hypot(x, z), a = Math.atan2(z, x); const tooth = R * (0.94 + 0.06 * (Math.cos(a * 16) > 0.2 ? 1 : 0)); if (r > tooth) return 0; o.u = x; o.v = z;
        if (r > R * 0.8) { o.id = 20; o.h = 0.03 + dome(Math.abs(r - R * 0.87), R * 0.09) * 0.4; o.wear = 0.7; }
        else if (r > R * 0.6) { o.id = 21; o.h = 0.005; o.tick = Math.abs(((a / TAU * 24) % 1) - 0.5) < 0.12 && r > R * 0.66 && r < R * 0.76 ? 1 : 0; if (o.tick) { o.id = 20; o.h = 0.012; o.wear = 0.9; } }
        else { const sp = Math.min(Math.abs(Math.sin(a * 2)) * r, 1); if (sp < 0.035) { o.id = 20; o.h = 0.035; o.wear = 0.5; } else { o.id = 22; o.h = 0.0; o.ao = 0.85; }
          if (r < R * 0.24) { o.id = 20; o.h = 0.05 + dome(r, R * 0.24) * 0.5; o.wear = 0.6; if (Math.abs(x) < 0.018 && z < 0.02 && z > -R * 0.16 || Math.hypot(x, z - 0.02) < 0.028) { o.id = 22; o.h = -0.02; o.ao = 0.4; } } }
        return cov(tooth - r, 80); },
      (o, x, z) => { if (o.id === 21) { gemM(K, 0.5); if (PT && PT.gem) { K.M.r = PT.gem[0] * 0.72; K.M.g = PT.gem[1] * 0.72; K.M.b = PT.gem[2] * 0.72; } else { K.M.r = 0.05; K.M.g = 0.3; K.M.b = 0.33; } }   /* v437 GR: (the enamel in a themed door's colour) */ else if (o.id === 22) darkM(K); else bronzeM(K, x * 2, z * 2, 6.6, o.wear, 0); });
    K.ink(S, [10, 16, 16], 0.5); K.glint(S.c, -R * 0.4, -R * 0.45, R * 0.35, 0.5); }

  /* ======================= the boss's bolts, the lift's grille, wheels and counterweights; the sump grate; the hall's sluice slab ======================= */
  function paintBolt(K, S, v) { const L = v === 'h' ? 2.45 : 0.95, r = 0.075;   // a bolt: a round bronze bar from the seam (x = 0, its knob) out to L, ringed every 0.3
    relief(K, S, -0.02, -0.16, L + 0.02, 0.16, (x, z, o) => { o.u = x; o.v = z; const kd = Math.hypot(x - 0.1, z); if (kd < 0.12) { o.id = 30; o.h = dome(kd, 0.12); o.wear = 0.75; return cov(0.12 - kd, 80); }
        if (x >= 0 && x <= L && Math.abs(z) < r) { o.id = 30; o.h = dome(Math.abs(z), r) * 0.8 + (Math.abs(((x + 5) / 0.3) % 1 - 0.5) < 0.05 ? 0.012 : 0); o.wear = 0.5; return cov(Math.min(r - Math.abs(z), L - x + 0.01), 80); } return 0; },
      (o, x, z) => bronzeM(K, x, z + 1, 2.2, o.wear, 0));
    K.ink(S, [12, 16, 16], 0.5); }
  function paintPort(K, S) { const G = GEO.lift, W = G.WO, Hh = G.ZA + 0.05;
    relief(K, S, -W, 0, W, Hh + 0.02, (x, z, o) => { o.u = x; o.v = z; const bx = ((x + W) / (W * 2) * 8), fb = bx - Math.round(bx), dB = Math.abs(fb) * (W * 2 / 8), bandZ = [0.35, 1.05, 1.75, 2.45]; let a = 0;
        if (dB < 0.045) { o.id = 31; o.h = dome(dB, 0.045) * 0.9; o.wear = 0.35; a = cov(0.045 - dB, 80); }
        for (const bz of bandZ) { const dz = Math.abs(z - bz); if (dz < 0.06 && Math.abs(x) < W - 0.02) { o.id = 31; o.h = 0.05 + dome(dz, 0.06) * 0.25 + (dB < 0.04 ? 0.02 : 0); o.wear = 0.5; a = Math.max(a, cov(0.06 - dz, 80)); } }
        if (z < 0.22 && dB < 0.045 + (0.22 - z) * 0 && Math.abs(fb) * (W * 2 / 8) < 0.045 * (z / 0.22)) { o.id = 31; o.h = 0.03; o.wear = 0.8; a = Math.max(a, 0.9); }   // (the spikes at its foot)
        if (z < 0.22 && dB < 0.045 && Math.abs(fb) * (W * 2 / 8) > 0.045 * (z / 0.22)) a = 0;
        return a; },
      (o, x, z) => bronzeM(K, x * 1.5, z, 8.8, o.wear, z < 1 ? (1 - z) * 0.35 : 0));
    K.ink(S, [10, 16, 16], 0.45); }
  function paintWheel(K, S) { const R = 0.3;
    relief(K, S, -R - 0.02, -R - 0.02, R + 0.02, R + 0.02, (x, z, o) => { const r = Math.hypot(x, z), a = Math.atan2(z, x); if (r > R) return 0; o.u = x; o.v = z; o.wear = 0.4;
        if (r > R * 0.78) { o.h = 0.04 - Math.abs(r - R * 0.89) * 0.5 - (Math.abs(r - R * 0.89) < 0.02 ? 0.02 : 0); return cov(R - r, 80); }
        const sp = Math.abs(Math.sin(a * 3)) * r; if (sp < 0.04 || r < R * 0.22) { o.h = 0.03 + (r < R * 0.22 ? dome(r, R * 0.22) * 0.3 : 0); o.wear = 0.6; return cov(Math.min(0.04 - sp, 1) + (r < R * 0.22 ? 1 : 0), 80); } return 0; },
      (o, x, z) => bronzeM(K, x * 2, z * 2, 3.7, o.wear, 0));
    K.ink(S, [10, 16, 16], 0.5); }
  function paintCwt(K, S) {   // a counterweight: a ribbed bronze block on a chain (the chain's links above it)
    relief(K, S, -0.2, 0, 0.2, 3.0, (x, z, o) => { const ax = Math.abs(x); o.u = x; o.v = z; o.wear = 0.4;
        if (z < 0.62 && ax < 0.18) { o.h = 0.03 + bev(Math.min(0.18 - ax, z, 0.62 - z), 0.03) + (Math.abs(((z / 0.155) % 1) - 0.5) > 0.42 ? -0.015 : 0); return cov(Math.min(0.18 - ax, z, 0.62 - z), 80); }
        if (z >= 0.62 && z < 3.0 && ax < 0.05) { const lk = ((z - 0.62) / 0.12) % 1, odd = Math.floor((z - 0.62) / 0.12) % 2; if (odd) { o.h = 0.02 + dome(ax, 0.03) * 0.4; return cov(0.03 - ax, 80); } const rr = Math.hypot(x / 0.05, (lk - 0.5) * 2); if (Math.abs(rr - 0.75) < 0.25) { o.h = 0.02; return 1; } } return 0; },
      (o, x, z) => bronzeM(K, x * 2, z, 5.1, o.wear, z < 0.62 ? 0.2 : 0));
    K.ink(S, [10, 16, 16], 0.45); }
  function paintSump(K, S) {   // a round bronze floor grate over the drain: a rim, radial bars, a ring, seen on the floor (squashed)
    const R = 0.5, Kk = 0.62;
    relief(K, S, -R, -R * Kk, R, R * Kk, (x, z, o) => { const ey = z / Kk, r = Math.hypot(x, ey), a = Math.atan2(ey, x); if (r > R) return 0; o.u = x; o.v = z; o.wear = 0.4;
        if (r > R * 0.84) { o.id = 40; o.h = 0.02 + dome(Math.abs(r - R * 0.92), R * 0.08) * 0.4; return cov((R - r) * Kk, 80); }
        const bar = Math.abs(Math.sin(a * 6)) * r, ring = Math.abs(r - R * 0.48); if (bar < 0.03 || ring < 0.03 || r < 0.07) { o.id = 40; o.h = 0.02; o.wear = 0.55; return 1; } o.id = 41; o.h = -0.04; o.ao = 0.4; return 1; },
      (o, x, z) => { if (o.id === 41) { darkM(K); K.M.r = 0.01; K.M.g = 0.03; K.M.b = 0.04; } else bronzeM(K, x * 2, z * 2, 2.9, o.wear, 0.15); });
    K.ink(S, [8, 14, 16], 0.45); }
  function paintSlab(K, S, v) {   // the hall's side gates: a sluice slab of bronze-clad stone; v 't' its top seen from above (0.64 x 5.1), 'f' its south end face (0.64 x 1.6)
    const top = v === 't', L = top ? 5.1 : 1.6;
    relief(K, S, -0.32, 0, 0.32, L, (x, z, o) => { const ax = Math.abs(x); if (ax > 0.32) return 0; o.u = x; o.v = z; o.wear = 0.3; const dE = Math.min(0.32 - ax, z, L - z);
        if (top) { const plate = Math.floor(z / 0.85), fz = (z / 0.85) % 1; o.id = 50; o.h = bev(dE, 0.03) + bev(Math.min(fz, 1 - fz) * 0.85, 0.015); if (Math.abs(fz - 0.5) < 0.06 && ax < 0.24) o.h += 0.01; if (Math.abs(ax - 0.22) < 0.03 && Math.abs(((z / 0.17) % 1) - 0.5) < 0.2) { o.h += 0.015; o.wear = 0.8; } o.blk = plate; }
        else { o.id = 51; o.h = bev(dE, 0.03) + (Math.abs(((z / 0.4) % 1) - 0.5) > 0.44 ? -0.015 : 0); if (Math.abs(ax - 0.24) < 0.025) { o.h += 0.02; o.wear = 0.6; } }
        return cov(dE, 70); },
      (o, x, z) => bronzeM(K, x * 2, z, top ? 9.9 : 10.7, o.wear, top ? 0.1 : (1.6 - z) * 0.2));
    K.ink(S, [10, 16, 16], 0.45); }

  /* ======================= the pictures, cached per size ======================= */
  const BOX = { frame: { std: [-1.62, -3.32, 1.62, 0.35], boss: [-2.42, -4.92, 2.42, 0.4], lift: [-1.62, -3.75, 1.62, 0.35] },
    leaf: { stdl: [-GEO.std.WO - 0.02, -GEO.std.ZA - 0.02, 0.02, 0.02], stdr: [-0.02, -GEO.std.ZA - 0.02, GEO.std.WO + 0.02, 0.02], bossl: [-GEO.boss.WO - 0.02, -GEO.boss.ZA - 0.02, 0.02, 0.02], bossr: [-0.02, -GEO.boss.ZA - 0.02, GEO.boss.WO + 0.02, 0.02], halll: [-2.57, -3.52, 0.02, 0.02], hallr: [-0.02, -3.52, 2.57, 0.02] },
    lock: { std: [-0.33, -0.33, 0.33, 0.33], boss: [-0.42, -0.42, 0.42, 0.42], cer: [-0.48, -0.48, 0.48, 0.48] },
    bolt: { s: [-0.04, -0.17, 1.0, 0.17], h: [-0.04, -0.17, 2.5, 0.17] }, port: { 0: [-GEO.lift.WO - 0.02, -GEO.lift.ZA - 0.1, GEO.lift.WO + 0.02, 0.02] }, wheel: { 0: [-0.33, -0.33, 0.33, 0.33] }, cwt: { 0: [-0.22, -3.02, 0.22, 0.02] },
    sump: { 0: [-0.52, -0.33, 0.52, 0.33] }, slab: { t: [-0.34, -5.12, 0.34, 0.02], f: [-0.34, -1.62, 0.34, 0.02] } };
  const boxOf = (name, v) => BOX[name][v];
  const DEFS = { frame: (K, S, v) => paintFrame(K, S, v), leaf: (K, S, v) => paintLeaf(K, S, v.slice(0, -1), v.slice(-1)), lock: paintLock, bolt: paintBolt, port: paintPort, wheel: paintWheel, cwt: paintCwt, sump: paintSump, slab: paintSlab };
  const CACHE = new Map(); let BASE = 0, budT = 0, budMs = 0;
  /* v437 GR: a door may carry a theme (another rift's light: the Garden's three sections), defTheme(id, { light (the kit's
     light colours, as BELPROPS.kit.LIGHTS.bel), gem [r, g, b] (the rune glass), rune, runeHi, ring, lit, litFloor, caustic,
     mote, smoke, drip (its GPU light's colours), recess [top, open, shut], glowIn [[r, g, b] x3] (the light in the opening) });
     its pictures are painted in its light and cached under its own key ('@id:'). The Belfry's doors carry none (as before) */
  const THEMES = {}; let PT = null, TH = null;   // (PT: the theme being painted; TH: the theme of the door being drawn)
  const keyOf = (name, v, P, th) => (th ? '@' + th.id + ':' : '') + name + '|' + v + '|' + P;
  function withLight(K, th, fn) { if (!th || !th.light || !K.LIGHTS || !K.LIGHTS.bel) return fn(); const L = K.LIGHTS.bel, save = {}; for (const k in L) save[k] = L[k]; Object.assign(L, th.light); try { return fn(); } finally { for (const k in save) L[k] = save[k]; } }
  function paint(name, v, P, th) { const B = BP(); if (!B) return null; const K = B.kit, b = boxOf(name, v); if (!b) return null; const t0 = now(); let S = null;
    try { PT = th || null; S = K.surface(b[0], b[1], b[2], b[3], P); withLight(K, PT, () => DEFS[name](K, S, v)); S.unlock(); } catch (e) { if (typeof console !== 'undefined') console.warn('BEL_DOORS', name, v, e); if (S) S.cv.width = S.cv.height = 1; return null; } finally { PT = null; }   // v437 GR: (in its theme's light)
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h; cv.getContext('2d').drawImage(S.cv, 0, 0); S.cv.width = S.cv.height = 1;   // (the work canvas given back at once)
    const ms = now() - t0; STATS.painted++; STATS.paintMs += ms; budMs += ms; return { cv, ax: S.ax, ay: S.ay, P }; }
  const qP = P => Math.max(8, Math.round(Math.exp(Math.round(Math.log(P) * 10) / 10)));
  function sprite(name, v, P, force, th) { if (!BP()) return null; P = Math.max(8, Math.round(P)); const key = keyOf(name, v, P, th); let s = CACHE.get(key); if (s) return s;
    const t = now(); if (t - budT > 30) { budT = t; budMs = 0; } if (!force && budMs > 14) return null;   // (a painting budget: what does not fit waits a frame)
    s = paint(name, v, P, th); if (!s) return null; if (CACHE.size > 60) { CACHE.forEach(q => { if (q.cv) q.cv.width = q.cv.height = 1; }); CACHE.clear(); } CACHE.set(key, s); return s; }
  /* a picture at a screen spot: its feet at (Xs, Ys) (a disc's centre), T px a tile; o: { rot, sx (a squash about the feet: a leaf on
     its hinge), alpha, dark (0..1 shade laid over it), th (a theme; else the door being drawn's) } -> false when it is not painted (the caller draws its old art) */
  function pic(c, name, v, Xs, Ys, T, o) { if (!BP() || !BOX[name] || !BOX[name][v]) return false; o = o || {}; const m = c.getTransform ? c.getTransform() : null, dpr = Math.min(2, m ? Math.max(0.5, Math.hypot(m.a, m.b)) : 1), th = o.th || TH;
    let P = qP(T * dpr); if (BASE && P <= BASE * 1.1 && P >= BASE * 0.6) P = BASE;
    let s = sprite(name, v, P, false, th); if (!s) { const pre = keyOf(name, v, '', th); for (const [k, s2] of CACHE) if (k.startsWith(pre)) { s = s2; break; } if (!s) { STATS.misses++; return false; } }
    const f = T / s.P, sx = o.sx == null ? 1 : o.sx; STATS.draws++; c.save(); if (o.alpha != null) c.globalAlpha *= o.alpha; c.translate(Xs, Ys); if (o.rot) c.rotate(o.rot); if (sx !== 1) { const pv = o.pv || 0; c.translate(pv, 0); c.scale(sx, 1); c.translate(-pv, 0); }
    c.drawImage(s.cv, -s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f);
    if (o.dark > 0.01) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(4,12,16,${clamp(o.dark, 0, 1).toFixed(3)})`; c.fillRect(-s.ax * f, -s.ay * f, s.cv.width * f, s.cv.height * f); }
    c.restore(); return true; }
  // painted at a stage's loading (only what it will draw): its exit door's pieces, the hall's leaves, the sump grate
  const NEED = { std: [['frame', 'std'], ['leaf', 'stdl'], ['leaf', 'stdr'], ['lock', 'std']], boss: [['frame', 'boss'], ['leaf', 'bossl'], ['leaf', 'bossr'], ['lock', 'boss'], ['bolt', 's']], lift: [['frame', 'lift'], ['port', 0], ['wheel', 0], ['cwt', 0]],
    hall: [['leaf', 'halll'], ['leaf', 'hallr'], ['lock', 'std'], ['lock', 'cer'], ['bolt', 'h'], ['slab', 't'], ['slab', 'f']], water: [['sump', 0]] };
  function warm(P) { if (!BP() || !P || !(P.T > 0)) return []; BASE = qP(P.T * Math.min(2, P.k || 1)); const S2 = P.S || {}, kinds = [];
    if (S2.dun) kinds.push(S2.dun === 'd3' ? 'boss' : 'std', 'water'); else if (/Clapper/.test(S2.name || '')) kinds.push('lift'); else if (/Hall of Three Tides/.test(S2.name || '')) kinds.push('hall', 'boss'); else kinds.push('std');
    const jobs = []; for (const k of kinds) for (const [n, v] of NEED[k]) jobs.push(() => { try { sprite(n, v, BASE, true); } catch (e) {} }); return jobs; }
  function hookWarm() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.belfry; if (!Rf || Rf.__beld) return; const old = Rf.preload; Rf.preload = function (P) { let a = []; try { a = old ? old.apply(this, arguments) || [] : []; } catch (e) {} return a.concat(warm(P)); }; Rf.__beld = 1; } catch (e) {} }
  hookWarm();
  function release() { CACHE.forEach(s => { if (s && s.cv) s.cv.width = s.cv.height = 1; }); CACHE.clear(); BASE = 0; }

  /* ======================= a door's motion: lock, then the leaves (or the grille), with its mass ======================= */
  const TIMES = { std: { lock: 0.75, open: 1.9, close: 1.3 }, boss: { lock: 1.5, open: 2.8, close: 1.8 }, lift: { lock: 0.45, open: 2.4, close: 1.6 } };
  // its motion: a slow start (it has to be got going), a steady swing, a heavy end that overshoots a hair and settles
  const heavy = u => { u = clamp(u, 0, 1); if (u < 0.88) { const v = u / 0.88; return v * v * (3 - 2 * v) * 0.55 + Math.pow(v, 1.8) * 0.45 + 0.015 * ss(0.6, 1, v); } const w = (u - 0.88) / 0.12; return 1 + 0.015 * Math.cos(w * Math.PI * 1.5) * (1 - w); };
  function mk(kind) { return { kind, want: false, lock: 0, k: 0, kE: 0, t: 0, ev: 0, vib: 0, puffs: [], drips: [], on: false, said: { open: 0, shut: 0 } }; }
  function step(D, dt, X) { const Tm = TIMES[D.kind] || TIMES.std; D.t += dt; D.vib = Math.max(0, D.vib - dt * 2.2);
    if (D.want) { if (D.lock < 1) { const l0 = D.lock; D.lock = Math.min(1, D.lock + dt / Tm.lock); D.vib = Math.max(D.vib, 0.45); if (l0 === 0) ev(D, X, 'unlock'); if (D.lock >= 1) ev(D, X, 'unlocked'); }
      else if (D.k < 1) { const k0 = D.k; D.k = Math.min(1, D.k + dt / Tm.open); if (k0 === 0) ev(D, X, 'start'); if (D.k < 0.3) D.vib = Math.max(D.vib, 0.6 * (1 - D.k / 0.3)); if (D.k >= 1) ev(D, X, 'end'); } }
    else { if (D.k > 0) { const k0 = D.k; D.k = Math.max(0, D.k - dt / Tm.close); if (D.k <= 0 && k0 > 0) ev(D, X, 'shut'); } else if (D.lock > 0) D.lock = Math.max(0, D.lock - dt / (Tm.lock * 0.7)); }
    D.kE = D.want ? heavy(D.k) : 1 - heavy(1 - D.k);
    // dust and drips
    for (const p of D.puffs) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.4; p.vy = p.vy * (1 - dt * 1.4) + (p.fall || 0) * dt; } D.puffs = D.puffs.filter(p => p.t < p.life);
    for (const p of D.drips) { p.t += dt; p.vy += 6 * dt; p.y += p.vy * dt; } D.drips = D.drips.filter(p => p.t < p.life);
    if (D.want && D.k > 0 && D.k < 1 && !lowFx() && Math.random() < dt * (D.kind === 'boss' ? 14 : 8)) puff(D, 'sill', 1);
    if (D.want && D.k > 0.05 && D.k < 0.95 && Math.random() < dt * 5) D.drips.push({ x: (Math.random() - 0.5) * 2 * (GEO[D.kind] || GEO.std).WO * (1 - D.kE * 0.8), y: -(0.6 + Math.random() * 1.6), vy: 0, t: 0, life: 0.6 }); }
  function puff(D, at, n) { const G = GEO[D.kind] || GEO.std, lf = lowFx(); n = lf ? Math.ceil(n / 2) : n;
    for (let i = 0; i < n; i++) { if (at === 'sill') D.puffs.push({ x: (Math.random() - 0.5) * 2 * G.WO, y: -0.05, vx: (Math.random() - 0.5) * 0.9, vy: -0.15 - Math.random() * 0.3, r: 0.25 + Math.random() * 0.3, t: 0, life: 0.9 + Math.random() * 0.7, a: 0.35 });
      else D.puffs.push({ x: (Math.random() - 0.5) * 2 * G.WO * 0.9, y: -(G.ZS + (G.ZA - G.ZS) * 0.6), vx: (Math.random() - 0.5) * 0.5, vy: 0.2 + Math.random() * 0.4, fall: 0.6, r: 0.12 + Math.random() * 0.16, t: 0, life: 1.0 + Math.random() * 0.6, a: 0.42 }); } }
  function ev(D, X, what) { const big = D.kind === 'boss', sf = X && X.sfx ? X.sfx : {};
    try { if (what === 'unlock') { if (sf.chime) sf.chime(D.kind === 'lift' ? 330 : 196, 0.5); puff(D, 'lintel', big ? 5 : 3); }
      else if (what === 'unlocked') { if (sf.thud) sf.thud(); if (X && X.shake && big) X.shake(lowFx() ? 1.5 : 3, 0.3); puff(D, 'lintel', big ? 6 : 3); }
      else if (what === 'start') { if (sf.whoosh) sf.whoosh(); puff(D, 'sill', big ? 8 : 5); }
      else if (what === 'end') { if (sf.thud) sf.thud(); if (X && X.shake) X.shake(lowFx() ? 1 : big ? 4 : 2, 0.3); puff(D, 'sill', big ? 10 : 6); puff(D, 'lintel', big ? 4 : 2); }
      else if (what === 'shut') { if (sf.thud) sf.thud(); puff(D, 'sill', 6); } } catch (e) {} }

  /* ======================= a door drawn ======================= */
  // the recess: the passage beyond, dark; filled with light when the way is open (its glow the GPU's)
  function recess(c, Xs, Ys, T, G, on, lit, t) { c.save(); c.beginPath(); archPath(c, Xs, Ys, T, G, 0); c.clip();
    const RC = (TH && TH.recess) || ['#04080C', '#123A3A', '#0A1418'], GI = (TH && TH.glowIn) || [[235, 255, 245], [170, 240, 215], [60, 150, 130]];   // v437 GR: (a themed door's own colours)
    const g = c.createLinearGradient(0, Ys - G.ZA * T, 0, Ys); g.addColorStop(0, RC[0]); g.addColorStop(1, on ? RC[1] : RC[2]); c.fillStyle = g; c.fillRect(Xs - G.WO * T, Ys - G.ZA * T, G.WO * 2 * T, G.ZA * T);
    if (lit > 0.01) { const r = G.ZS * T, cg = c.createRadialGradient(Xs, Ys - r * 0.55, 0, Xs, Ys - r * 0.55, r * 1.1); cg.addColorStop(0, `rgba(${GI[0]},${(0.95 * lit).toFixed(3)})`); cg.addColorStop(0.35, `rgba(${GI[1]},${(0.7 * lit).toFixed(3)})`); cg.addColorStop(1, `rgba(${GI[2]},${(0.35 * lit).toFixed(3)})`); c.fillStyle = cg; c.fillRect(Xs - G.WO * T, Ys - G.ZA * T, G.WO * 2 * T, G.ZA * T); }
    c.restore(); }
  function archPath(c, Xs, Ys, T, G, inset) { const wo = G.WO - inset, n = 18; c.moveTo(Xs - wo * T, Ys - G.PL * T); c.lineTo(Xs - wo * T, Ys - G.ZS * T); for (let i = 1; i <= n; i++) { const x = -wo + wo * i / n; c.lineTo(Xs + x * T, Ys - archZ(x, wo, G.ZS, G.ZA - inset) * T); } for (let i = 1; i <= n; i++) { const x = wo * i / n; c.lineTo(Xs + x * T, Ys - Math.max(G.ZS, archZ(x, wo, G.ZS, G.ZA - inset)) * T); } c.lineTo(Xs + wo * T, Ys - G.PL * T); c.closePath(); }
  // two leaves on their hinges: each foreshortened about its hinge as it swings in, its thickness showing at its free edge, shading as it turns
  function leaves(c, Xs, Ys, T, D, kind, t) { const G = GEO[kind], a = D.kE * 1.42, cs = Math.cos(a), sn = Math.sin(a), lock = D.lock, vib = D.vib * Math.sin(t * 70) * T * 0.012;
    c.save(); c.beginPath(); archPath(c, Xs, Ys, T, G, -0.01); c.clip();
    let okL = true; for (const side of [-1, 1]) { const hx = Xs + side * G.WO * T + vib, v = kind + (side < 0 ? 'l' : 'r');
      if (cs > 0.02) { if (!pic(c, 'leaf', v, Xs + vib, Ys, T, { sx: cs, pv: side * G.WO * T, dark: 0.08 + sn * 0.5 })) { okL = false; break; }   // (the picture's feet at the seam, swung about its hinge)
        // the free edge's thickness (it shows as the leaf turns)
        const ex = hx - side * G.WO * T * cs, w = G.TH * T * sn; if (w > 0.6) { const zt = archZ(G.WO * (1 - cs) * 0.999, G.WO, G.ZS, G.ZA); const gr = c.createLinearGradient(ex, 0, ex - side * w, 0); gr.addColorStop(0, '#6E5430'); gr.addColorStop(1, '#2A2016'); c.fillStyle = gr; c.fillRect(Math.min(ex, ex - side * w), Ys - Math.max(G.ZS, zt) * T, w, (Math.max(G.ZS, zt) - G.PL) * T); } } }
    c.restore(); if (!okL) return false;
    // the rosette on the seam, turning as it unlocks (and riding away on the right leaf)
    if (kind === 'std' || kind === 'boss') { const zr = kind === 'boss' ? 1.02 : 0.92, rx = Xs + G.WO * T * (1 - cs) + vib; if (cs > 0.3) pic(c, 'lock', kind, rx, Ys - zr * T, T, { rot: ss(0, 1, lock) * TAU * (kind === 'boss' ? 0.5 : 0.75), sx: cs, dark: sn * 0.5 }); }
    // the boss's bolts: drawn back into the jambs before the rosette turns
    if (kind === 'boss') { const off = ss(0, 0.55, lock) * 1.12 * T; for (const z of [0.62, 1.62]) for (const sd of [-1, 1]) pic(c, 'bolt', 's', Xs + sd * off + vib, Ys - z * T, T, { sx: sd }); }   // (a bolt each side of the seam, drawn back into the jambs)
    return true; }
  // the lift: its grille rising into the arch, the counterweights sinking, the wheels turning
  function liftDoor(c, Xs, Ys, T, D, t, front) { const G = GEO.lift, rise = D.kE * (G.ZA - 0.05) * T, vib = D.vib * Math.sin(t * 70) * T * 0.01;
    if (!front) { c.save(); c.beginPath(); archPath(c, Xs, Ys, T, G, -0.01); c.clip(); const ok = pic(c, 'port', 0, Xs + vib, Ys - rise, T); c.restore(); return ok; }
    const bz = G.ZA + G.RW * 1.12 + 0.18, wx = G.WO + G.JW * 0.62, drop = D.kE * 1.25 * T;
    for (const sd of [-1, 1]) { c.save(); c.beginPath(); c.rect(Xs + sd * wx * T - T * 0.3, Ys - bz * T, T * 0.6, bz * T + T); c.clip(); pic(c, 'cwt', 0, Xs + sd * wx * T, Ys - (bz - 1.72) * T + drop, T); c.restore(); pic(c, 'wheel', 0, Xs + sd * wx * T, Ys - bz * T, T, { rot: D.kE * 5.5 * sd + sd * 0.3 }); }
    return true; }
  // the light of a door (GPU): its runes, the lock's ring turning, light through an open door, dust and drips
  const BELC = { rune: '#61D9D2', runeHi: '#E8FFFB', ring: '#9FF0EA', lit: '#B8FFD8', litFloor: '#8FE0C0', caustic: '#9FF0EA', mote: '#FFFFFF', smoke: '#6E7A78', drip: '#CFF6FF' };
  function light(c, Xs, Ys, T, D, kind, G, on, t, lit) { const F = FG(); if (!F) return; const Q = F.begin(c, null), lf = lowFx(), pul = 0.75 + 0.25 * Math.sin(t * 2.4), gz = Ys - (G.ZA + G.RW * 0.52) * T, K = TH || BELC;   // v437 GR: (K: a themed door's light colours)
    Q.glow(Xs, gz, T * 0.55, K.rune, (0.35 + 0.4 * D.lock + 0.3 * lit) * pul); Q.glow(Xs, gz, T * 0.16, K.runeHi, 0.5 + 0.4 * lit);
    if (kind === 'boss') { const bz = Ys - (G.ZA + G.RW * 1.12 + G.RW * 0.62 * 1.15 + 0.42) * T; Q.glow(Xs, bz, T * 0.9, K.rune, 0.18 * pul + 0.3 * D.lock); }
    if (D.lock > 0 && D.lock < 1 && (kind === 'std' || kind === 'boss')) { const zr = kind === 'boss' ? 1.02 : 0.92, R = (kind === 'boss' ? 0.36 : 0.27) * T; Q.ring(Xs, Ys - zr * T, R * 1.05, K.ring, 0.8 * Math.sin(D.lock * Math.PI), R * 0.12); Q.glow(Xs, Ys - zr * T, R * 1.8, K.rune, 0.4 * Math.sin(D.lock * Math.PI)); }
    if (lit > 0.01) { const cy = Ys - G.ZS * 0.55 * T; Q.glow(Xs, cy, G.ZS * T * 0.9, K.lit, 0.45 * lit * (0.85 + 0.15 * Math.sin(t * 2.5))); Q.glow(Xs, Ys + T * 0.2, T * 2.2, K.litFloor, 0.28 * lit, 0.35); if (!lf) Q.caustic(Xs, Ys + T * 0.35, T * 1.6, K.caustic, 0.3 * lit, 2.3, 0.38);
      if (!lf) for (let i = 0; i < 8; i++) { const u = (t * 0.3 + i / 8) % 1, a = i * 2.4 + u * 2; Q.glow(Xs + Math.cos(a) * G.WO * T * 0.7 * (1 - u), cy + Math.sin(a) * G.ZS * T * 0.4 * (1 - u), T * 0.07, K.mote, u * 0.8 * lit); } }
    for (const p of D.puffs) { const u = p.t / p.life, a = p.a * Math.sin(Math.PI * Math.min(1, u * 1.4)) * (1 - u * 0.4); Q.smoke(Xs + p.x * T, Ys + p.y * T, p.r * T * (1 + u * 1.6), a, p.r * 13, K.smoke, 0.3); }
    for (const p of D.drips) Q.glow(Xs + p.x * T, Ys + p.y * T, T * 0.05, K.drip, 0.7 * (1 - p.t / p.life));
    F.flush(c); }
  function label(c, s, Xs, Ys, T, col) { c.save(); c.font = `800 ${Math.round(T * 0.42)}px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, Xs, Ys); c.fillText(s, Xs, Ys); c.restore(); }
  /* the whole door at its feet (Xs, Ys): kind std | boss | lift; on: the way is open (the stage done); lit: its light 0..1 */
  function drawDoor(c, Xs, Ys, T, D, on, t, text) { const T0 = TH; TH = D.th || null; try { return drawDoor0(c, Xs, Ys, T, D, on, t, text); } finally { TH = T0; } }   // v437 GR: (drawn in its theme, if it has one)
  function drawDoor0(c, Xs, Ys, T, D, on, t, text) { const kind = D.kind, G = GEO[kind]; if (!pic(c, 'frame', kind, -9999, -9999, T)) return false;   // (the surround painted, else the old gate)
    D.lit = clamp((D.lit || 0) + ((on ? 1 : 0) - (D.lit || 0)) * 0.08, 0, 1); const lit = D.lit * (kind === 'lift' ? 1 : Math.max(0.25, D.kE)), vib = D.vib * Math.sin(t * 70) * T * 0.01;
    c.save(); c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(Xs, Ys + T * 0.1, (G.WO + G.JW + 0.35) * T, T * 0.34, 0, 0, TAU); c.fill(); c.restore();
    recess(c, Xs, Ys, T, G, on, lit, t);
    if (!(kind === 'lift' ? liftDoor(c, Xs, Ys, T, D, t, false) : leaves(c, Xs, Ys, T, D, kind, t))) return false;
    pic(c, 'frame', kind, Xs + vib * 0.4, Ys, T); if (kind === 'lift') liftDoor(c, Xs, Ys, T, D, t, true);
    light(c, Xs, Ys, T, D, kind, G, on, t, lit);
    if (kind === 'lift' && !D.want) label(c, 'LIFT · LOCKED', Xs, Ys - (G.ZA + G.RW + 0.75) * T, T * 0.62, '#FFD9C8');
    if (on && text) label(c, text, Xs, Ys - (G.ZA + G.RW + (kind === 'boss' ? 1.55 : 0.9)) * T, T * 0.75, '#FFFFFF');
    return true; }

  /* ======================= the running stage's exit door ======================= */
  let LIVE = null;   // { X, C, D, kind } of the Belfry stage now running (20n everyStage), dropped when the next stage is made
  function stage(X, C, kind, th) { C.door = C.door || mk(kind); C.door.kind = kind; C.door.th = th || null; LIVE = { X, C, D: C.door, kind }; return C.door; }   // v437 GR: th, a theme (themed(id)) for another rift's door
  function tick(C, dt, want) { const D = C && C.door; if (!D) return; D.want = !!want; step(D, Math.min(dt, 0.1), C.X); }
  /* 20m's riftGate, asked to draw the exit of a Belfry stage: the stage's own door instead (true: drawn) */
  function claim(c, Xs, Ys, T0, on, t, text) { const L = LIVE; if (!L || !BP()) return false; const X = L.X, ex = L.C.exitPos && L.C.exitPos(); if (!ex) return false;
    const T = X.Tz(); if (Math.abs(X.sx(ex.x) - Xs) > 2 || Math.abs(X.sy(ex.y) - Ys) > 2) return false; STATS.claims++;
    if (L.kind === 'none') return true;   // (a stage whose own art is its door: the Hall's central doorway)
    return drawDoor(c, Xs, Ys, T, L.D, on, L.C.t || t, text); }
  if (typeof riftGate === 'function' && !riftGate.__bw) { const RG0 = riftGate; riftGate = function (c, Xs, Ys, T, on, t, label) { try { if (claim(c, Xs, Ys, T, on, t, label)) return; } catch (e) { try { console.warn('BEL_DOORS', e); } catch (e2) {} } return RG0.apply(this, arguments); }; riftGate.__bw = 1; }   // v430 BW
  try { if (typeof BEL !== 'undefined' && BEL.onRelease) BEL.onRelease.push(() => { LIVE = null; HD.clear(); release(); }); } catch (e) {}   // (a new stage: the last one's door let go, its pictures given back; a Belfry stage paints its own at its loading)

  /* ======================= the hall's gates and doorway (20n1): their mass and dust, drawn where they stand ======================= */
  const HD = new Map(); let hdT = 0;
  // a door's dust by its key (draw-time: k its opening 0..1, moving while it changes), at (Xs, Ys) w px wide; drawn by fx(c)
  function dust(key, Xs, Ys, w, k, T) { const tn = now() / 1000; let H = HD.get(key); if (!H) { H = { k, p: [], t: tn, last: tn }; HD.set(key, H); }
    const dt = clamp(tn - H.last, 0, 0.05); H.last = tn; const mv = Math.abs(k - H.k) > 1e-4 && k > 0 && k < 1; H.k = k; H.Xs = Xs; H.Ys = Ys; H.w = w; H.T = T;
    if (mv && Math.random() < dt * (lowFx() ? 5 : 12)) H.p.push({ x: (Math.random() - 0.5) * w, y: 0, vx: (Math.random() - 0.5) * T * 0.8, vy: -T * (0.1 + Math.random() * 0.3), r: T * (0.2 + Math.random() * 0.3), t: 0, life: 0.9 + Math.random() * 0.6 });
    for (const p of H.p) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5; } H.p = H.p.filter(p => p.t < p.life); hdT = tn; return mv; }
  function fx(c) { const F = FG(); if (!F || !HD.size) return; const Q = F.begin(c, null); let n = 0;
    HD.forEach(H => { for (const p of H.p) { const u = p.t / p.life; Q.smoke(H.Xs + p.x, H.Ys + p.y, p.r * (1 + u * 1.5), 0.32 * Math.sin(Math.PI * Math.min(1, u * 1.4)), p.r, '#7A8482', 0.3); n++; } });
    if (n) F.flush(c); }
  const lockArt = (c, kind, Xs, Ys, T, rot, o) => pic(c, 'lock', kind, Xs, Ys, T, Object.assign({ rot }, o || {}));
  const state = C => { const D = C && C.door; return D ? { kind: D.kind, want: D.want, lock: +D.lock.toFixed(3), k: +D.k.toFixed(3), kE: +D.kE.toFixed(3), puffs: D.puffs.length, lit: +(D.lit || 0).toFixed(3) } : null; };
  /* v437 GR: themes for other rifts' doors: defTheme(id, o) registers one, themed(id) gives it (null: none, the Belfry's own);
     warmDoor(P, kind, id) the loading screen's jobs for one door of that kind in that theme (as warm does for a Belfry stage) */
  function defTheme(id, o) { THEMES[id] = Object.assign({}, BELC, o || {}, { id }); return THEMES[id]; }
  const themed = id => THEMES[id] || null;
  function warmDoor(P, kind, id) { if (!BP() || !P || !(P.T > 0) || !NEED[kind]) return []; BASE = qP(P.T * Math.min(2, P.k || 1)); const th = themed(id);
    return NEED[kind].map(([n, v]) => () => { try { sprite(n, v, BASE, true, th); } catch (e) {} }); }
  const API = { GEO, TIMES, archZ, pic, sprite: (n, v, P, th) => sprite(n, v, P, true, th ? themed(th) : null), warm, warmDoor, defTheme, themed, THEMES, release, stage, tick, claim, drawDoor, mk, step, state: C => { const s = state(C); if (s && C.door.th) s.theme = C.door.th.id; return s; }, dust, fx, lockArt, heavy, get live() { return LIVE; }, get stats() { return Object.assign({ cached: CACHE.size, keys: [...CACHE.keys()] }, STATS); } };
  if (typeof window !== 'undefined') window.BEL_DOORS = API;
  return API;
})();
