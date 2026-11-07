/* ---------- Dark Strong, reworked: Nightneedle Cluster ----------
   Faceted obsidian needles rise out of a violet floor glow round the pet's flanks, each at its own height, swing from
   pointing up to the aim and hover with a slow bob; then they launch one after another in a staggered spread (inner
   needles first), each leaving a feathered violet light trail, bending gently toward the monster nearest its own lane
   of the fan. On contact a needle shatters: tumbling obsidian fragments, a pin of violet light, a small light ring.
   A needle that reaches its range or a wall breaks into violet motes.
   Needles: 7 / 9 / 11 / 13 at Adept / 15 / 17 / 20 at Celestial (C.evo 1..7). One hit per needle. Damage per needle
   = base x K x 2.94 x (1 + 0.08 (evo - 1)) / N, so all needles on one monster total 2.94 x DK at level 1 (the old
   move's 7 x 0.42) rising to 3.65 at Adept and 4.35 at Celestial. Adept: longer needles, brighter cores, a light ring
   under the cluster; Celestial: a broken rune ring of light under the pet and a twin-core trail.
   The needle is a real shaded sprite rendered once per screen-angle bucket (48 buckets, lit per pixel: a hexagonal
   cross-section of three long facets broken into tail / shaft / tip segments, upper-left key light, violet back rim,
   glossy specular, facet ridges, conchoidal streak texture and glints, a glowing violet core seen through the face,
   a feathered edge and a soft violet halo). Buckets bake lazily within a small per-frame budget (the ones in use
   first); the trail is one cached feathered streak stretched along the flight. No per-frame gradients; light-only
   floor marks; everything ends with the effect. */
(() => {
  const S = ELEM_IMPL.dark.strong, TAU = Math.PI * 2;
  const BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const COUNTS = [7, 9, 11, 13, 15, 17, 20], NB = 48;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, sst = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const cB = rgb(BODY), cP = rgb(PLUM), cS = rgb(SMOKE), cE = rgb(ENERGY), cG = rgb(EDGE), cA = rgb(ACC);
  const hash = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vnoise = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  let H;
  const mkCanvas = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  /* ---- the needle sprite, per angle bucket: L px long (tail to tip), lit in screen space ---- */
  const cache = { L: 0, spr: [], frame: -1, used: 0 };
  function bake(b, L) {
    const th = b / NB * TAU, co = Math.cos(th), si = Math.sin(th), W = Math.max(2.6, L * 0.095), pad = Math.ceil(W * 2.6 + 3), D = Math.ceil(L + pad * 2) | 1, cx = D / 2, cy = D / 2;
    const cv = mkCanvas(D, D), x = cv.getContext('2d'), img = x.createImageData(D, D), px = img.data;
    // the key light (upper left, toward the viewer) and the violet back rim (lower right), turned into the needle's frame
    let lx = -0.55, ly = -0.72, lz = 0.6; const ln = Math.hypot(lx, ly, lz); lx /= ln; ly /= ln; lz /= ln;
    const Lu = lx * co + ly * si, Lv = -lx * si + ly * co, Ru = -Lu, Rv = -Lv;
    let hx = Lu, hy = Lv, hz = lz + 1; const hn = Math.hypot(hx, hy, hz); hx /= hn; hy /= hn; hz /= hn;
    const VMAX = W * 2.6, UMAX = L / 2 + W * 2.6;
    const prof = s => s < 0.24 ? W * Math.pow(s / 0.24, 0.75) : W * Math.pow((1 - s) / 0.76, 1.1);
    for (let j = 0; j < D; j++) for (let i = 0; i < D; i++) {
      const dx = i + 0.5 - cx, dy = j + 0.5 - cy, u = dx * co + dy * si, v = -dx * si + dy * co; if (v > VMAX || v < -VMAX || u > UMAX || u < -UMAX) continue;
      const s = (u + L / 2) / L, sc = cl(s), hw = prof(sc);
      let e = Math.abs(v) - hw; if (s < 0 || s > 1) { const e0 = Math.max(0, e), e1 = (s < 0 ? -s : s - 1) * L; e = Math.sqrt(e0 * e0 + e1 * e1); }
      const cov = cl(0.5 - e / 1.1) * (0.5 + 0.5 * sst(-0.02, 0.32, s)), along = sst(0.02, 0.3, sc) * (1 - sst(0.9, 1.02, sc));
      const halo = e > 0 ? 0.17 * Math.exp(-(e * e) / (W * W * 0.9)) * (0.35 + 0.65 * along) : 0;
      let r = 0, g = 0, bl = 0;
      if (cov > 0) {
        const q = v / Math.max(0.01, hw), aq = Math.abs(q), side = aq > 0.36 ? (q < 0 ? -1 : 1) : 0;
        // facet normal: three long facets across; tail cone, two shaft segments and a tip bevel along
        const seg = sc < 0.24 ? 0 : sc < 0.5 ? 1 : sc < 0.76 ? 2 : 3, nuS = [-0.5, -0.06, 0.07, 0.45][seg];
        let nu = nuS * (side ? 1 : 0.55), nv = side * 0.8, nz = side ? 0.6 : 1; const nn = Math.hypot(nu, nv, nz); nu /= nn; nv /= nn; nz /= nn;
        const dif = Math.max(0, nu * Lu + nv * Lv + nz * lz), spec = 1.3 * Math.pow(Math.max(0, nu * hx + nv * hy + nz * hz), 40);
        const n2 = Math.hypot(nu, nv) || 1, rimF = Math.max(0, (nu * Ru + nv * Rv) / n2), rim = sst(0.5, 1, aq) * (0.12 + 0.88 * rimF) + sst(0.88, 1, aq) * 0.2;
        const ridge = Math.exp(-Math.pow((aq - 0.36) * hw / 0.42, 2)) + 0.4 * Math.exp(-Math.pow(Math.min(Math.abs(sc - 0.24), Math.abs(sc - 0.5), Math.abs(sc - 0.76)) * L / 0.7, 2));
        const tn = vnoise(u * 0.22 + seg * 3.1, v * 1.4 + side * 5.3), streak = vnoise(u * 0.09, v * 3 + 11) , glint = hash(Math.floor(u * 0.7), Math.floor(v * 1.6) + side * 9) > 0.975 ? 1 : 0;
        const core = Math.exp(-q * q / 0.03) * along * (0.3 + 0.7 * sc) * (side ? 0.15 : 1);
        const k0 = 0.5 + 0.35 * tn + 0.2 * streak;
        for (let c3 = 0; c3 < 3; c3++) {
          let col = cB[c3] * k0 * 0.75;
          col += (cS[c3] * 2 - col) * dif * dif * dif * 0.9;
          col += (cP[c3] * 0.5 - col) * 0.4 * (1 - dif);
          col += cE[c3] * core * 0.95 + cA[c3] * core * core * core * 0.6;
          col += cG[c3] * rim * 0.85;
          col += (dif > 0.45 ? cA[c3] : cG[c3]) * ridge * 0.45 * (0.4 + dif);
          col += (cA[c3] * 0.5 + 128) * spec * 0.9 + cA[c3] * glint * dif * 0.45;
          if (c3 === 0) r = col; else if (c3 === 1) g = col; else bl = col;
        }
      }
      const a = cov + halo * (1 - cov); if (a <= 0.003) continue;
      const o = (j * D + i) * 4, hk = halo * (1 - cov);
      px[o] = Math.min(255, (r * cov + cG[0] * hk) / a); px[o + 1] = Math.min(255, (g * cov + cG[1] * hk) / a); px[o + 2] = Math.min(255, (bl * cov + cG[2] * hk) / a); px[o + 3] = Math.min(255, a * 255);
    }
    x.putImageData(img, 0, 0); return { cv, D };
  }
  /* the sprite for a screen angle: its bucket, baked now if the frame's budget allows, else the nearest baked one */
  function sprite(ang, L, gt) {
    if (cache.L !== L) { cache.L = L; cache.spr = []; }
    if (cache.frame !== gt) { cache.frame = gt; cache.used = 0; }
    let b = Math.round(ang / TAU * NB) % NB; if (b < 0) b += NB;
    if (!cache.spr[b] && (cache.used < 1 || !cache.spr.some(Boolean))) { cache.spr[b] = bake(b, L); cache.used++; }
    if (cache.spr[b]) return cache.spr[b];
    for (let d = 1; d < NB / 2; d++) { const p = cache.spr[(b + d) % NB] || cache.spr[(b - d + NB) % NB]; if (p) return p; }
    return null;
  }
  const bakeIdle = (L, gt) => { if (cache.L !== L) { cache.L = L; cache.spr = []; } if (cache.frame !== gt) { cache.frame = gt; cache.used = 0; } for (let b = 0; b < NB && cache.used < 1; b++) if (!cache.spr[b]) { cache.spr[b] = bake(b, L); cache.used++; } };
  /* the trail: one feathered streak, transparent tail to bright head, a thin hot core */
  let TR = null;
  function trailSprite() { if (TR) return TR; const w = 128, h = 32, cv = mkCanvas(w, h), x = cv.getContext('2d'), img = x.createImageData(w, h), p = img.data;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = (i + 0.5) / w, dv = (j + 0.5 - h / 2) / (h / 2), wid = 0.18 + 0.32 * u, body = Math.pow(u, 1.5) * Math.exp(-dv * dv / (wid * wid)) * (1 - sst(0.94, 1, u) * 0.5), core = Math.pow(u, 2.2) * Math.exp(-dv * dv / (wid * wid * 0.08)), wisp = 0.6 + 0.4 * vnoise(u * 9, dv * 2 + 3), o = (j * w + i) * 4;
      const a = cl(body * 0.75 * wisp + core * 0.6); p[o] = Math.min(255, cE[0] + (cG[0] - cE[0]) * u + (255 - cG[0]) * core); p[o + 1] = Math.min(255, cE[1] + (cG[1] - cE[1]) * u + (230 - cG[1]) * core); p[o + 2] = Math.min(255, cE[2] + (cG[2] - cE[2]) * u + (255 - cG[2]) * core); p[o + 3] = a * 255; }
    x.putImageData(img, 0, 0); TR = cv; return TR; }
  function drawTrail(c, x0, y0, x1, y1, w, a) { const L = Math.hypot(x1 - x0, y1 - y0); if (L < 2) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a; c.translate(x0, y0); c.rotate(Math.atan2(y1 - y0, x1 - x0)); c.drawImage(trailSprite(), 0, -w / 2, L + w * 0.3, w); c.restore(); }

  S.nightneedle = (C, h) => { H = h; const me = H.me, a = C.a, evo = Math.max(1, Math.min(7, Math.round(C.evo || 1))), N = COUNTS[evo - 1], DK = C.base * C.K, per = DK * 2.94 * (1 + 0.08 * (evo - 1)) / N, LS = 1 + 0.03 * (evo - 1), adept = evo >= 4, cel = evo >= 7;
    const ns = [], half = Math.ceil(N / 2), span = 1.0 / Math.max(1, half - 1), LAUNCH = 0.4, WIN = 0.32 + 0.012 * N, fanW = 0.5 + 0.022 * N;
    for (let i = 0; i < N; i++) { const side = i % 2 ? 1 : -1, k = i >> 1, ax = 0.6 + k * span, wob = hash(i, 3.7), z = 0.45 + ((i * 0.618 + 0.21) % 1) * 0.75 + 0.8 * Math.max(0, 1 - (ax - 0.6) / 0.6);
      ns.push({ i, ox: side * ax, oy: -0.2 - 0.3 * wob, z, d: i * 0.014, lane: a + side * Math.min(1, (k + 0.5) / half) * fanW, ph: hash(i, 9.1) * TAU,
        tl: LAUNCH + (N > 1 ? i / (N - 1) : 0) * WIN + (hash(i, 1.3) - 0.5) * 0.02, fly: false, gone: false, x: 0, y: 0, x0: 0, y0: 0, z0: 0, ang: a, ft: 0, tgt: null }); }
    let lastCrack = -1;
    const shatter = (x, y, z, sa, hit) => { const k = H.n(hit ? 4 : 2); for (let j = 0; j < k; j++) { const b = sa + Math.PI + (Math.random() - 0.5) * 2.4, v = 2.5 + Math.random() * 3.5; F.frags.push({ x, y, z, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.7, vz: 1.5 + Math.random() * 2.5, t: 0, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 22, s: 0.5 + Math.random() * 0.6 }); }
      H.burst(x, y - z * 0.5, 'spark', hit ? 4 : 3, { v: 3.5, life: 0.35, size: 1.6, color: [EDGE, ACC, ENERGY] });
      if (hit) { H.X.ring(x, y, 0.1, 0.55 + (cel ? 0.2 : 0), 0.3, EDGE, 0.12); H.flareAt(x, y - z, cel ? 1.0 : 0.75, 0.18, ACC); } };
    const F = H.add({ life: LAUNCH + WIN + 1.1, ns, frags: [],
      update(dt, f) {
        for (const s of f.ns) {
          if (!s.fly && !s.gone && f.t >= s.tl) { s.fly = true; s.x0 = s.x = me.x + s.ox; s.y0 = s.y = me.y + s.oy; s.z0 = s.z;
            const c0 = H.living().filter(m => Math.hypot(m.x - me.x, m.y - me.y) < 8.5 && Math.abs(H.wrap(H.angTo(me.x, me.y, m.x, m.y) - a)) < 0.8);
            if (c0.length) { let best = null, bd = 1e9; for (const m of c0) { const d = Math.abs(H.wrap(H.angTo(me.x, me.y, m.x, m.y) - s.lane)); if (d < bd) { bd = d; best = m; } } s.tgt = best; s.ang = H.angTo(s.x, s.y, best.x, best.y) + (hash(s.i, 5.5) - 0.5) * 0.12; }
            else s.ang = s.lane;
            if (s.i % 3 === 0) H.X.sfx.whoosh(); H.glowAt(s.x, s.y - s.z * 0.9, 0.6, 0.14, EDGE, 0.5); }
          if (!s.fly || s.gone) continue; s.ft += dt;
          if (s.tgt && !s.tgt.dead) { const want = H.angTo(s.x, s.y, s.tgt.x, s.tgt.y), d = H.wrap(want - s.ang), mx = 5 * dt; s.ang += Math.max(-mx, Math.min(mx, d)); }
          const v = 15 * dt; s.x += Math.cos(s.ang) * v; s.y += Math.sin(s.ang) * v; s.z = Math.max(0.35, s.z - dt * 2.2);
          const hit = H.near(s.x, s.y, 0.3)[0];
          if (hit || s.ft > 0.55 || H.X.blocked(s.x, s.y, 0.2, 0)) { s.gone = true;
            if (hit) { H.X.hitMon(hit, per, C.dmgO({ kb: 0.8 })); shatter(s.x, s.y, s.z, s.ang, true); if (f.t - lastCrack > 0.07) { lastCrack = f.t; H.X.sfx.crack && H.X.sfx.crack(); } }
            else shatter(s.x, s.y, s.z, s.ang, false); } }
        for (let j = f.frags.length - 1; j >= 0; j--) { const q = f.frags[j]; q.t += dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vz -= 14 * dt; q.z = Math.max(0, q.z + q.vz * dt); q.rot += q.vr * dt; if (q.t > 0.42) f.frags.splice(j, 1); }
        if (f.t > LAUNCH && f.ns.every(s => s.gone) && !f.frags.length) f.life = Math.min(f.life, 0.02);
      },
      drawUnder(c, f, X, Y, T) {   // light only: a violet glow pooled under the cluster, a ring of light at Adept, a broken rune ring at Celestial
        const form = H.ease.out(cl(f.t / 0.3)), out = 1 - cl((f.t - LAUNCH - WIN * 0.6) / 0.35); if (out <= 0) return; const k = form * out, PX = H.sx(me.x), PY = H.sy(me.y);
        c.save(); c.translate(PX, PY); c.scale(1, H.GY); H.glow(c, 0, 0, T * 1.6, ENERGY, 0.32 * k); H.glow(c, 0, 0, T * 0.9, EDGE, 0.16 * k);
        if (adept) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(EDGE, 0.35 * k); c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, T * 1.05 * form, 0, TAU); c.stroke(); }
        if (cel) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = H.rgba(ACC, 0.4 * k); c.lineWidth = 2; const r = T * 1.35 * form, rot = f.t * 0.8; for (let j = 0; j < 8; j++) { const b0 = rot + j / 8 * TAU; c.beginPath(); c.arc(0, 0, r, b0, b0 + 0.5); c.stroke(); c.beginPath(); c.moveTo(Math.cos(b0 + 0.62) * (r - 4), Math.sin(b0 + 0.62) * (r - 4)); c.lineTo(Math.cos(b0 + 0.62) * (r + 4), Math.sin(b0 + 0.62) * (r + 4)); c.stroke(); } }
        c.restore(); },
      draw(c, f, X, Y, T) {
        const L = Math.round(T * 1.05 * LS / 2) * 2, gt = H.g.t, PX = H.sx(me.x), PY = H.sy(me.y), aS = Math.atan2(Math.sin(a) * H.GY, Math.cos(a));
        // hovering needles first (back to front by height), then flyers; fragments last
        for (const s of f.ns) { if (s.fly || s.gone) continue; const u = cl((f.t - s.d) / 0.26); if (u <= 0) continue; const e = H.ease.out(u), sw = H.ease.io(cl((f.t - s.d - 0.1) / 0.2)),
            gx = PX + s.ox * T, gy = PY + s.oy * T * H.GY, bob = Math.sin(f.t * 5 + s.ph) * T * 0.05, py = gy - T * s.z * e + bob, ang = -Math.PI / 2 + H.wrap(aS + Math.PI / 2) * sw,
            pre = cl((f.t - (s.tl - 0.08)) / 0.08), rec = Math.sin(pre * Math.PI) * T * 0.08, sp = sprite(ang, L, gt);
          if (sp) { const sc = 0.55 + 0.45 * e, D = sp.D * sc, xx = gx - Math.cos(ang) * rec, yy = py - Math.sin(ang) * rec; c.globalAlpha = e; c.drawImage(sp.cv, xx - D / 2, yy - D / 2, D, D); c.globalAlpha = 1; H.glow(c, xx + Math.cos(ang) * L * 0.3 * sc, yy + Math.sin(ang) * L * 0.3 * sc, T * (0.18 + pre * 0.12), adept ? ACC : EDGE, (0.3 + pre * 0.4) * e); } }
        for (const s of f.ns) { if (!s.fly || s.gone) continue; const hx = H.sx(s.x), hy = H.sy(s.y) - T * s.z, sx0 = H.sx(s.x0), sy0 = H.sy(s.y0) - T * s.z0, dl = Math.hypot(hx - sx0, hy - sy0), ang = Math.atan2(Math.sin(s.ang) * H.GY, Math.cos(s.ang)), tlen = Math.min(dl, T * 1.9), tx0 = hx - Math.cos(ang) * tlen, ty0 = hy - Math.sin(ang) * tlen;
          drawTrail(c, tx0, ty0, hx, hy, T * 0.42, 0.85); if (cel) drawTrail(c, tx0 + Math.cos(ang) * tlen * 0.3, ty0 + Math.sin(ang) * tlen * 0.3, hx, hy, T * 0.16, 0.9);
          const sp = sprite(ang, L, gt); if (sp) { const D = sp.D * 1.08; c.drawImage(sp.cv, hx - D / 2, hy - D / 2, D, D); } H.glow(c, hx + Math.cos(ang) * L * 0.4, hy + Math.sin(ang) * L * 0.4, T * 0.24, adept ? ACC : EDGE, 0.45);
          if (Math.random() < 0.25 * H.Q()) H.P({ kind: 'spark', x: s.x - Math.cos(s.ang) * 0.4, y: s.y - Math.sin(s.ang) * 0.4 - s.z, vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2 - 0.4, life: 0.3, max: 0.3, size: 1.3, color: Math.random() < 0.5 ? EDGE : ACC }); }
        for (const q of f.frags) { const k = 1 - cl((q.t - 0.25) / 0.17), fx = H.sx(q.x), fy = H.sy(q.y) - T * q.z, s = T * 0.09 * q.s; c.save(); c.globalAlpha = k; c.translate(fx, fy); c.rotate(q.rot); c.beginPath(); c.moveTo(-s, -s * 0.45); c.lineTo(s * 1.2, 0); c.lineTo(-s * 0.6, s * 0.6); c.closePath(); c.fillStyle = PLUM; c.fill(); c.strokeStyle = H.rgba(EDGE, 0.9); c.lineWidth = 1.1; c.stroke(); c.fillStyle = H.rgba(ACC, 0.8); c.fillRect(-s * 0.3, -s * 0.25, s * 0.7, 1); c.restore(); }
        if (f.t < LAUNCH) bakeIdle(L, gt);   // fill the remaining buckets while the cluster gathers
      } });
    H.X.sfx.hum();
  };
})();
