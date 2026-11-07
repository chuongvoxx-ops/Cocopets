/* ---------- Dark Strong, reworked: Inkfang ----------
   A fang of living darkness. An ink droplet wells up from a violet ripple a step ahead of the pet, stretches upward and
   hardens into a curved fang: a glossy ink-black body with a violet sheen and moving inner veins, a sharp pale enamel
   tip, a violet rim light. It lunges low along its own path (a liquid tail and a violet wake behind it, a light streak
   on the floor), and on contact it bursts: the enamel tip chips, the ink splashes up into a crown of glossy ribbons with
   beaded ends that retract into one droplet, which sinks into the floor in a violet ring and a little fading smoke.
   1 fang at Hatchling, 2 at Adept (evo 4), 3 at Celestial (evo 7), launched 0.08 s apart, each its own curved lunge
   fanned round the aim (side fangs bow outward), one hit per monster per fang (a line 3.8 long, 1.1 wide, kb 3).
   Damage: base x 2.3 x K x evoK (evoK = 1 + 0.08 (evo - 1)) shared by the fangs: 1 fang x 1, 2 x 0.62, 3 x 0.46, so
   a monster caught by every fang takes x1 at L1, x1.54 at L4 (2 fangs), x2.04 at L7 (3 fangs).
   The fang is a per-pixel lit sprite (normals from its own curved cross-section, a diffuse + glossy + broad sheen
   specular, violet Fresnel rim, violet floor bounce, marbled ink texture, enamel subsurface tint), baked once per screen
   heading bucket (24 buckets, mirrored for leftward aims so the tip always hooks down) with a separate additive vein
   layer that pulses; at most one bucket is baked per frame (a nearest baked bucket stands in meanwhile). No per-frame
   gradients; near the pet everything dims smoothly. */
(() => {
  const S = ELEM_IMPL.dark.strong, TAU = Math.PI * 2;
  const VOID = '#08050F', BODY = '#180B2E', PLUM = '#2B0B45', SMOKE = '#463052', ENERGY = '#6D28A8', EDGE = '#A55CFF', ACC = '#D0AEFF';
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const sstep = (a, b, x) => sm((x - a) / (b - a));
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
  let H;

  /* ---- the fang's shape, in its own frame: x from -1 (root) to 1 (tip), y down; unit = FL sprite px ---- */
  const FS = 112, FC = 56, FL = 44, NB = 24, CAP = 0.16, W0 = 0.35;
  const wf = u => u < 0 || u > 1 ? 0 : u < CAP ? W0 * Math.sqrt(Math.max(0, 1 - Math.pow((CAP - u) / CAP, 2))) : W0 * Math.pow((1 - u) / (1 - CAP), 0.78);
  const yc = u => 0.34 * u * u - 0.13, ycd = u => 0.34 * u;   // the centre line (a downward hook toward the tip); slope per u
  // a small value noise (for the marbled ink)
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = q => q * q * (3 - 2 * q), h = (i, j) => R1(i * 57.1 + j * 131.7);
    return lerp(lerp(h(xi, yi), h(xi + 1, yi), s(xf)), lerp(h(xi, yi + 1), h(xi + 1, yi + 1), s(xf)), s(yf)); };
  const hx = h => hexRGB(h);
  const cV = hx(VOID), cB = hx(BODY), cP = hx(PLUM), cS = hx(SMOKE), cE = hx(ENERGY), cG = hx(EDGE), cA = hx(ACC);
  const cEn0 = hx('#5B4A78'), cEn1 = hx('#EEE7FB'), cSeam = hx('#B98CFF');
  // the light (screen space: from the upper left and in front), its half vector, the violet bounce from the floor (low right)
  const nrm = v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
  const LD = nrm([-0.55, -0.7, 0.62]), HV = nrm([LD[0], LD[1], LD[2] + 1]), BD = nrm([0.45, 0.8, 0.25]);
  const spr = {};
  function* bakeFang(bk, mir, key) {
    const th = bk / NB * TAU, ct = Math.cos(th), st = Math.sin(th), body = document.createElement('canvas'), vein = document.createElement('canvas');
    body.width = body.height = vein.width = vein.height = FS;
    const gb = body.getContext('2d'), gv = vein.getContext('2d'), ib = gb.createImageData(FS, FS), iv = gv.createImageData(FS, FS), db = ib.data, dv = iv.data, sg = mir ? -1 : 1;
    for (let py = 0; py < FS; py++) { if (py % 6 === 5) yield; for (let px = 0; px < FS; px++) {
      const dx = (px + 0.5 - FC) / FL, dy = (py + 0.5 - FC) / FL, lx = dx * ct + dy * st, ly = (-dx * st + dy * ct) * sg, u = (lx + 1) / 2;
      if (u < -0.02 || u > 1.01) continue;
      const w = wf(cl(u)), m = ycd(u) * 0.5, tl = Math.hypot(1, m);
      // distance across (perpendicular to the centre line), in px, and the coverage
      const off = (ly - yc(cl(u))) / tl, dpx = (Math.abs(off) - w) * FL, cov = cl(0.5 - dpx);
      if (cov <= 0 || w <= 0) continue;
      const v = Math.max(-1, Math.min(1, off / Math.max(w, 1e-3)));
      // the normal: across the round section, tipped back over the rounded root and forward along the taper
      const kx = u < CAP ? -Math.pow((CAP - u) / CAP, 1.5) : 0.12 * Math.abs(v), latx = -m / tl, laty = 1 / tl, tx = 1 / tl, ty = m / tl;
      let nlx = v * latx + kx * tx, nly = v * laty + kx * ty; nly *= sg;
      let nx = nlx * ct - nly * st, ny = nlx * st + nly * ct, nz = Math.sqrt(Math.max(0, 1 - v * v)) * Math.sqrt(Math.max(0, 1 - kx * kx));
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const dif = Math.max(0, nx * LD[0] + ny * LD[1] + nz * LD[2]), nh = Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]),
        spec = Math.pow(nh, 46), broad = Math.pow(nh, 7), fr = Math.pow(1 - nz, 2.6), bnc = Math.max(0, nx * BD[0] + ny * BD[1] + nz * BD[2]);
      const tip = sstep(0.62, 0.8, u), mar = vn(u * 9 + 3.1, v * 2.2 + 1.7) * 0.6 + vn(u * 22, v * 5 + 9) * 0.4;
      // the ink: void in the shade, plum and smoky violet toward the light, marbled
      const ink = cl(dif * 0.95 + (mar - 0.5) * 0.35);
      let r = cV[0], g = cV[1], b = cV[2];
      const sh = (c1, k) => { r = lerp(r, c1[0], k); g = lerp(g, c1[1], k); b = lerp(b, c1[2], k); };
      sh(cB, sstep(0, 0.35, ink)); sh(cP, sstep(0.25, 0.75, ink) * 0.9); sh(cS, sstep(0.65, 1, ink) * 0.75);
      sh(cE, bnc * 0.45 * (1 - tip)); sh(cG, fr * 0.7 * (1 - tip * 0.5));
      // the enamel: a pale violet-white tip, lit, with a cooler shade side and a faint inner glow
      if (tip > 0) { const e = cl(dif * 1.1 + 0.08), er = lerp(cEn0[0], cEn1[0], e), eg = lerp(cEn0[1], cEn1[1], e), eb = lerp(cEn0[2], cEn1[2], e); r = lerp(r, er, tip); g = lerp(g, eg, tip); b = lerp(b, eb, tip); sh(cA, fr * 0.4 * tip); }
      // the seam where the ink hardens into enamel (a violet glow band)
      const seam = Math.exp(-Math.pow((u - 0.66) / 0.03, 2)) * (0.4 + 0.6 * nz); sh(cSeam, seam * 0.55);
      // gloss: a broad violet sheen and a hard white specular (stronger on the enamel)
      const add = broad * (0.22 + 0.2 * tip), sp = spec * (0.85 + 0.15 * tip);
      r = r + (cA[0] - r) * add + 255 * sp; g = g + (cA[1] - g) * add + 255 * sp; b = b + (cA[2] - b) * add + 255 * sp;
      // a dark edge line (the ink's contour) where the coverage ends, so the silhouette reads on a dark floor with the rim
      const edgeK = sstep(-2.2, -0.6, dpx) * (1 - tip) * 0.35; r *= 1 - edgeK; g *= 1 - edgeK; b *= 1 - edgeK;
      const i = (py * FS + px) * 4; db[i] = Math.min(255, r); db[i + 1] = Math.min(255, g); db[i + 2] = Math.min(255, b); db[i + 3] = Math.round(255 * cov);
      // the veins: thin violet currents running the length of the ink (additive layer)
      const fl = Math.sin(v * 5.2 + 2.4 * Math.sin(u * 6.5 + 1.3) + mar * 2.2), vv = Math.exp(-fl * fl * 26) * (1 - tip) * sstep(0.04, 0.3, u) * (0.35 + 0.65 * nz) * cov, vg = Math.exp(-Math.pow((u - 0.66) / 0.05, 2)) * 0.5 * nz * cov;
      const va = cl(vv * 0.85 + vg);
      if (va > 0.01) { dv[i] = lerp(cG[0], cA[0], vg > vv ? 0.6 : 0.25); dv[i + 1] = lerp(cG[1], cA[1], 0.3); dv[i + 2] = lerp(cG[2], cA[2], 0.3); dv[i + 3] = Math.round(255 * va); }
    } }
    yield; gb.putImageData(ib, 0, 0); gv.putImageData(iv, 0, 0);
    spr[key] = { body, vein };
  }
  /* the bake queue: sliced jobs run a little each frame (≲ 2 ms), never a long stall */
  const jobs = [], queued = new Set();
  function queue(key, it) { if (queued.has(key)) return; queued.add(key); jobs.push(it); }
  function pump(ms) { const t0 = now(); while (jobs.length && now() - t0 < ms) { if (jobs[0].next().done) jobs.shift(); } }
  function* bakeStatic() { dropSpr(); yield; shadowSpr(); streakSpr(); yield; ringSpr(); }
  // a fang sprite for a screen heading: its own bucket if baked (or bakeable this frame), else the nearest baked one
  function fangFor(ang, mir) {
    const f = ((ang / TAU * NB) % NB + NB) % NB, bk = Math.round(f) % NB, key = bk + (mir ? 'm' : '');
    if (spr[key]) return { s: spr[key], th: bk / NB * TAU };
    queue(key, bakeFang(bk, mir, key));
    for (let d = 1; d <= 3; d++) for (const s2 of [1, -1]) { const b2 = ((bk + d * s2) % NB + NB) % NB, k2 = b2 + (mir ? 'm' : ''); if (spr[k2]) return { s: spr[k2], th: b2 / NB * TAU }; }
    return null;
  }
  // a glossy ink droplet (per-pixel lit sphere)
  const dropSpr = () => fxSprite('dk2drop', 48, 48, g => { const im = g.createImageData(48, 48), d = im.data;
    for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const nx = (x + 0.5 - 24) / 21, ny = (y + 0.5 - 24) / 21, q = nx * nx + ny * ny, cov = cl((1 - Math.sqrt(q)) * 21 + 0.5); if (cov <= 0) continue;
      const nz = Math.sqrt(Math.max(0, 1 - q)), dif = Math.max(0, nx * LD[0] + ny * LD[1] + nz * LD[2]), nh = Math.max(0, nx * HV[0] + ny * HV[1] + nz * HV[2]), fr = Math.pow(1 - nz, 2.4), bn = Math.max(0, nx * BD[0] + ny * BD[1] + nz * BD[2]);
      let r = lerp(cV[0], cP[0], dif), gg = lerp(cV[1], cP[1], dif), b = lerp(cV[2], cP[2], dif); r = lerp(r, cE[0], bn * 0.5); gg = lerp(gg, cE[1], bn * 0.5); b = lerp(b, cE[2], bn * 0.5); r = lerp(r, cG[0], fr * 0.75); gg = lerp(gg, cG[1], fr * 0.75); b = lerp(b, cG[2], fr * 0.75);
      const sp = Math.pow(nh, 40) * 255, br = Math.pow(nh, 6) * 0.25; r += (cA[0] - r) * br + sp; gg += (cA[1] - gg) * br + sp; b += (cA[2] - b) * br + sp;
      const i = (y * 48 + x) * 4; d[i] = Math.min(255, r); d[i + 1] = Math.min(255, gg); d[i + 2] = Math.min(255, b); d[i + 3] = Math.round(255 * cov); }
    g.putImageData(im, 0, 0); });
  // a soft contact shadow, a floor light streak (feathered both ends), a violet floor glow ring
  const shadowSpr = () => fxSprite('dk2shad', 64, 64, g => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(8,5,15,0.38)'); gr.addColorStop(0.55, 'rgba(8,5,15,0.16)'); gr.addColorStop(1, 'rgba(8,5,15,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
  const streakSpr = () => fxSprite('dk2streak', 128, 32, g => { let gr = g.createLinearGradient(0, 0, 0, 32); gr.addColorStop(0, 'rgba(165,92,255,0)'); gr.addColorStop(0.3, 'rgba(165,92,255,0.3)'); gr.addColorStop(0.5, 'rgba(208,174,255,0.95)'); gr.addColorStop(0.7, 'rgba(165,92,255,0.3)'); gr.addColorStop(1, 'rgba(165,92,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32);
    g.globalCompositeOperation = 'destination-in'; gr = g.createLinearGradient(0, 0, 128, 0); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.35, 'rgba(0,0,0,1)'); gr.addColorStop(0.88, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 32); });
  const ringSpr = () => fxSprite('dk2ring', 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 63); gr.addColorStop(0, 'rgba(109,40,168,0.12)'); gr.addColorStop(0.55, 'rgba(109,40,168,0.06)'); gr.addColorStop(0.7, 'rgba(165,92,255,0.25)'); gr.addColorStop(0.8, 'rgba(208,174,255,0.95)'); gr.addColorStop(0.86, 'rgba(165,92,255,0.45)'); gr.addColorStop(0.95, 'rgba(109,40,168,0.08)'); gr.addColorStop(1, 'rgba(109,40,168,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  function blit(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || w < 0.5 || h < 0.5) return; c.globalAlpha = Math.min(1, a); if (add) c.globalCompositeOperation = 'lighter'; c.drawImage(img, x - w / 2, y - h / 2, w, h); if (add) c.globalCompositeOperation = 'source-over'; }
  function glow(c, x, y, r, col, a) { if (r < 1 || !(a > 0.01)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.globalCompositeOperation = 'source-over'; }
  /* a glossy ink ribbon along screen points: a tapered dark body, a lit upper edge, a violet rim, a pale wet highlight */
  function inkRibbon(c, pts, w0, w1, a) {
    const n = pts.length; if (n < 2 || !(a > 0.02)) return; const L = [], R = [];
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[Math.min(n - 1, i + 1)], o = pts[Math.max(0, i - 1)]; let tx = q[0] - o[0], ty = q[1] - o[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l; const w = lerp(w0, w1, i / (n - 1)) / 2; L.push([p[0] - ty * w, p[1] + tx * w]); R.push([p[0] + ty * w, p[1] - tx * w]); }
    c.globalAlpha = a; c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i < n; i++) c.lineTo(L[i][0], L[i][1]); for (let i = n - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath();
    c.fillStyle = BODY; c.fill(); c.lineJoin = 'round'; c.lineCap = 'round'; c.strokeStyle = H.rgba(EDGE, 0.55); c.lineWidth = 1.1; c.stroke();
    // the lit edge: whichever side faces up-left
    const up = (L[0][1] + L[n - 1][1]) < (R[0][1] + R[n - 1][1]) ? L : R, mid = pts;
    c.globalAlpha = a * 0.8; c.strokeStyle = SMOKE; c.lineWidth = Math.max(1, w0 * 0.3); c.beginPath(); for (let i = 0; i < n; i++) { const x = lerp(mid[i][0], up[i][0], 0.55), y = lerp(mid[i][1], up[i][1], 0.55); i ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
    c.globalAlpha = a * 0.85; c.strokeStyle = 'rgba(226,212,255,0.85)'; c.lineWidth = Math.max(0.8, w0 * 0.13); c.beginPath(); for (let i = 1; i < n - 1; i++) { const x = lerp(mid[i][0], up[i][0], 0.5), y = lerp(mid[i][1], up[i][1], 0.5); i > 1 ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
  }

  /* ---- timing (seconds, per fang from its own launch) ---- */
  const T_FORM = 0.18, T_HIT = 0.36, T_END = 0.98, GAP = 0.08, LEN = 3.2;

  S.inkfang = (C, h) => {
    H = h; const me = H.me, a = C.a, x0 = me.x, y0 = me.y, evo = evoOf(C), n = evo >= 7 ? 3 : evo >= 4 ? 2 : 1, evoK = 1 + 0.08 * (evo - 1);
    const share = n === 1 ? 1 : n === 2 ? 0.62 : 0.46, dmg = C.base * 2.3 * C.K * evoK * share, size = 1 + 0.06 * (n - 1);
    const offs = n === 1 ? [0] : n === 2 ? [-0.24, 0.24] : [0, -0.34, 0.34];
    H.X.sfx.whoosh(); me.sq = 0.7;
    const fangs = offs.map((o, i) => { const ai = a + o, side = Math.sign(o), L = LEN - Math.abs(o) * 0.6, ca = Math.cos(ai), sa = Math.sin(ai);
      return { i, ai, side, L, ca, sa, d: i * GAP, done: false, ring: false, sink: false, seed: R1(i * 7.3 + a * 3.1) * 10,
        // the floor point at path fraction s (side fangs bow outward)
        at(s) { const r = lerp(0.95, this.L, s), b = this.side * 0.38 * Math.sin(Math.PI * s); return [x0 + this.ca * r - this.sa * b, y0 + this.sa * r + this.ca * b]; },
        // the screen heading of the whole lunge decides the mirror (so the hook never flips in flight)
        mir: Math.cos(ai) < 0 };
    });
    // the lunge progress at fang time tau, and its height above the floor (tiles)
    const sAt = tau => tau < T_FORM ? 0 : tau < T_HIT ? H.ease.in((tau - T_FORM) / (T_HIT - T_FORM)) : 1;
    const hAt = (tau, s) => tau < T_FORM ? 0.6 * H.ease.out(cl(tau / T_FORM * 1.4)) : lerp(0.6, 0.32, s) + 0.08 * Math.sin(Math.PI * s);
    const life = T_END + (n - 1) * GAP + 0.05;
    // queue the sprites this cast needs (its fangs' launch headings first), and start them within a small slice
    queue('static', bakeStatic()); for (const F of fangs) { const [p0x, p0y] = F.at(0.05), [p1x, p1y] = F.at(0.3), [p2x, p2y] = F.at(0.9), [p3x, p3y] = F.at(1); for (const [ax, ay, bx, by] of [[p0x, p0y, p1x, p1y], [p2x, p2y, p3x, p3y]]) fangFor(Math.atan2(by - ay, bx - ax) + (F.mir ? -0.12 : 0.12), F.mir); } pump(1.5);
    H.add({ life,
      update(dt, f) { pump(2); for (const F of fangs) { const tau = f.t - F.d;
        if (!F.launched && tau >= T_FORM) { F.launched = true; if (F.i) H.X.sfx.whoosh(); }
        if (!F.done && tau >= T_HIT) { F.done = true; const [ex, ey] = F.at(1);
          H.hitLine(x0, y0, F.ai, LEN + 0.6, 1.1, dmg, C.dmgO({ kb: 3 }));
          H.X.ring(ex, ey, 0.15, 1.0, 0.4, EDGE, 0.45); H.glowAt(ex, ey, 0.9, 0.3, EDGE, 0.55); H.X.light(ex, ey, 1.6, 0.25);
          H.burst(ex, ey - 0.3, 'shard', 4, { v: 5, up: 2.5, g: 9, life: 0.5, size: 3, color: ['#EEE7FB', ACC, '#B9A6DA'] });
          H.burst(ex, ey - 0.3, 'spark', 7, { v: 4, up: 1.5, life: 0.4, size: 1.7, color: [EDGE, ACC] });
          if (F.i === 0) { H.X.sfx.crash(); H.X.hitstop(0.03); H.X.shake(5, 0.16); } }
        if (!F.sink && tau >= T_HIT + 0.5) { F.sink = true; const [ex, ey] = F.at(1); H.X.ring(ex, ey, 0.1, 0.75, 0.35, ACC, 0.3);
          for (let k = 0; k < H.n(3); k++) { const b = Math.random() * TAU; H.P({ kind: 'smoke', x: ex + Math.cos(b) * 0.3, y: ey + Math.sin(b) * 0.2, vx: Math.cos(b) * 0.5, vy: -0.5, life: 0.6, max: 0.6, size: 0.35, color: 'rgba(110,80,150,' }); } } } },
      drawUnder(c, f, X, Y, T) {
        // the floor: a violet light streak along each lunge, a glow under the impact (light only)
        for (const F of fangs) { const tau = f.t - F.d; if (tau < 0) continue; const s = sAt(tau), fade = tau < T_HIT ? 1 : 1 - sstep(T_HIT, T_HIT + 0.5, tau);
          if (s > 0.02 && fade > 0.01) { const N = 6; let p = F.at(0); for (let k = 1; k <= N; k++) { const q = F.at(s * k / N), PX = H.sx(p[0]), PY = H.sy(p[1]), QX = H.sx(q[0]), QY = H.sy(q[1]), l = Math.hypot(QX - PX, QY - PY);
            if (l > 0.5) { c.save(); c.translate(PX, PY); c.rotate(Math.atan2(QY - PY, QX - PX)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 * fade * (0.4 + 0.6 * k / N); c.drawImage(streakSpr(), -l * 0.15, -T * 0.16, l * 1.3, T * 0.32); c.restore(); } p = q; } }
          // the start ripple where the droplet wells up
          if (tau < T_FORM + 0.2) { const [sx0, sy0] = F.at(0), k = cl(tau / (T_FORM + 0.2)), R = T * (0.25 + 0.4 * k); c.save(); c.translate(H.sx(sx0), H.sy(sy0)); c.scale(1, H.GY); blit(c, ringSpr(), 0, 0, R * 2, R * 2, 0.6 * (1 - k), true); c.restore(); }
          if (tau >= T_HIT) { const u = tau - T_HIT, [ex, ey] = F.at(1), EX = H.sx(ex), EY = H.sy(ey), R = T * (0.5 + 0.9 * H.ease.out(cl(u / 0.4)));
            c.save(); c.translate(EX, EY); c.scale(1, H.GY); blit(c, ringSpr(), 0, 0, R * 2, R * 2, 0.5 * (1 - sstep(0.05, 0.45, u)), true); c.restore();
            c.save(); glow(c, EX, EY, T * 0.9, ENERGY, 0.5 * (1 - sstep(0.1, 0.6, u))); c.restore(); } } },
      draw(c, f, X, Y, T) {
        const PXp = H.sx(me.x), PYp = H.sy(me.y) - T * 0.45, petK = (x, y) => lerp(0.3, 1, sstep(T * 0.45, T * 1.05, Math.hypot(x - PXp, y - PYp)));
        const order = fangs.slice().sort((p, q) => p.at(sAt(f.t - p.d))[1] - q.at(sAt(f.t - q.d))[1]);
        const FLs = T * 0.68 * size;   // half the fang's length on screen
        for (const F of order) { const tau = f.t - F.d; if (tau < 0) continue;
          if (tau < T_HIT + 0.05) {
            const s = sAt(tau), hh = hAt(tau, s), [fx0, fy0] = F.at(s), GX = H.sx(fx0), GY0 = H.sy(fy0), FX = GX, FY = GY0 - hh * T;
            // the heading on screen: along the path, tipped down a little as it dives
            const [qx, qy] = F.at(Math.min(1, s + 0.04)), [px2, py2] = F.at(Math.max(0, s - 0.04)); let hd = Math.atan2(H.sy(qy) - H.sy(py2), H.sx(qx) - H.sx(px2)); if (!(Math.abs(H.sx(qx) - H.sx(px2)) + Math.abs(H.sy(qy) - H.sy(py2)) > 0.5)) hd = Math.atan2(F.sa, F.ca);
            const dive = (F.mir ? -1 : 1) * 0.12 * (tau < T_FORM ? 0 : 1); hd += dive;
            const pk = petK(FX, FY), form = tau < T_FORM ? tau / T_FORM : 1, crush = sstep(T_HIT - 0.01, T_HIT + 0.05, tau);
            const aF = sstep(0.35, 0.75, form) * (1 - crush) * pk;
            // contact shadow, glow
            c.save(); blit(c, shadowSpr(), GX, GY0, FLs * 1.6 * (0.5 + 0.5 * form), FLs * 1.6 * H.GY * (0.5 + 0.5 * form), 0.9 * pk * (1 - crush), false);
            glow(c, FX, FY, FLs * 1.25, ENERGY, (0.35 + 0.25 * s) * aF); glow(c, FX + Math.cos(hd) * FLs * 0.75, FY + Math.sin(hd) * FLs * 0.75, FLs * 0.5, ACC, 0.25 * aF);
            // the liquid tail and wake behind the lunge
            if (s > 0.03 && aF > 0.02) { const pts = [], ch = Math.cos(hd), sh = Math.sin(hd), rx = FX - ch * FLs * 0.62, ry = FY - sh * FLs * 0.62, len = FLs * (0.5 + 1.1 * s), wob = f.t * 26 + F.seed;
              for (let k = 0; k <= 6; k++) { const q = k / 6, w = Math.sin(wob - q * 5) * FLs * 0.09 * q; pts.push([rx - ch * len * q - sh * w, ry - sh * len * q + ch * w + q * q * FLs * 0.12]); }
              H.trail(c, pts.slice().reverse(), FLs * 0.55, ENERGY, null); c.globalCompositeOperation = 'source-over';
              inkRibbon(c, pts, FLs * 0.52, FLs * 0.05, 0.92 * aF); }
            // the droplet welling up and stretching (formation)
            if (form < 1) { const q = form, r = FLs * 0.42 * sm(q / 0.45) * (1 - sstep(0.55, 0.9, q)), st = 1 + 0.6 * sstep(0.3, 0.7, q); if (r > 0.5) { c.save(); c.translate(GX, GY0 - hh * T * 0.8); c.rotate(-Math.PI / 2 + (hd + Math.PI / 2) * sstep(0.4, 0.9, q)); c.scale(st, 1 / Math.sqrt(st)); blit(c, dropSpr(), 0, 0, r * 2.3, r * 2.3, pk, false); c.restore(); } }
            // the fang itself: stretched along its heading (it grows out of the droplet; it elongates in the lunge; it squashes on contact)
            if (aF > 0.01) { const sp = fangFor(hd, F.mir); if (sp) {
              const grow = lerp(0.35, 1, sm((form - 0.3) / 0.7)), str = grow * (1 + 0.14 * Math.sin(Math.PI * s)) * (1 - 0.4 * crush), wid = (1 / Math.sqrt(Math.max(0.3, str))) * (1 + crush * 0.5), k = FLs / FL;
              c.translate(FX, FY); c.rotate(hd); c.scale(str, wid); c.rotate(-sp.th);
              blit(c, sp.s.body, 0, 0, FS * k, FS * k, aF, false);
              const pulse = 0.55 + 0.45 * Math.sin(f.t * 22 + F.seed);
              blit(c, sp.s.vein, 0, 0, FS * k, FS * k, aF * (0.45 + 0.55 * pulse) * (0.7 + 0.5 * s), true); } }
            c.restore();
          }
          if (tau >= T_HIT) this.splash(c, F, tau - T_HIT, T, FLs, petK, size);
        } },
      // the burst: a crown of glossy ribbons that splash up and retract into one droplet, which sinks into the floor
      splash(c, F, u, T, FLs, petK, size) {
        const [ex, ey] = F.at(1), EX = H.sx(ex), EY = H.sy(ey) - T * 0.3, pk = petK(EX, EY), hd = Math.atan2(H.sy(ey) - H.sy(F.at(0.9)[1]), H.sx(ex) - H.sx(F.at(0.9)[0]));
        const ext = H.ease.out(cl(u / 0.11)), ret = H.ease.in(sstep(0.16, 0.48, u)), aR = pk * (1 - sstep(0.5, 0.6, u)), NR = 6;
        if (aR > 0.02) { c.save();
          glow(c, EX, EY, T * (0.7 + 0.5 * ext) * (1 - ret * 0.5), EDGE, 0.5 * aR * (1 - ret * 0.6));
          for (let k = 0; k < NR; k++) { const sd = R1(F.seed + k * 3.7), sd2 = R1(F.seed * 1.7 + k * 5.1), side = k % 2 ? 1 : -1, off = (k - (NR - 1) / 2) / ((NR - 1) / 2);
            // directions: a crown thrown forward and up the screen (a splash rising), the outer ones low to the sides
            const b = hd + off * 1.5 + (sd - 0.5) * 0.3, lift = 0.35 + 0.75 * (1 - Math.abs(off)) * (0.7 + 0.3 * sd2), dx = Math.cos(b), dy = Math.sin(b) * 0.55 - lift, dl = Math.hypot(dx, dy), ux = dx / dl, uy = dy / dl;
            const reach = T * (0.6 + 0.5 * sd) * size * ext * (1 - ret), curl = side * (0.5 + 0.6 * sd2) * (0.6 + 0.6 * ret), sway = Math.sin(u * 14 + k) * 0.08, pts = [];
            if (reach < 1.5) continue;
            for (let j = 0; j <= 7; j++) { const s = j / 7, bend = (curl + sway) * s * s; pts.push([EX + (ux * Math.cos(bend) - uy * Math.sin(bend)) * reach * s, EY + (uy * Math.cos(bend) + ux * Math.sin(bend)) * reach * s + reach * 0.45 * s * s * (0.2 + ret)]); }
            const w0 = FLs * (0.56 + 0.16 * ret), w1 = FLs * (0.14 + 0.06 * sd); inkRibbon(c, pts, w0, w1, 0.95 * aR);
            const tp = pts[7], dr = FLs * (0.2 + 0.08 * sd) * (1 + 0.3 * ret); blit(c, dropSpr(), tp[0], tp[1], dr, dr, aR, false); }
          // loose droplets flung out of the crown, arcing down
          for (let k = 0; k < 6; k++) { const sd = R1(F.seed * 2.3 + k * 9.1), b = hd + (sd - 0.5) * 3.2, v = T * (1.2 + 1.3 * R1(k + F.seed)), tt = Math.min(u, 0.45), x = EX + Math.cos(b) * v * tt, y = EY + (Math.sin(b) * 0.5 - 1.1) * v * tt + 9 * T * tt * tt, dr = FLs * (0.08 + 0.08 * sd) * (1 - sstep(0.3, 0.45, u)); if (dr > 0.5) blit(c, dropSpr(), x, y, dr * 2, dr * 2, aR, false); }
          c.restore(); }
        // the central droplet: swells as the ribbons come home, then sinks
        const swell = sm(u / 0.08) * (1 - 0.3 * sstep(0.08, 0.2, u)) + 0.35 * sstep(0.3, 0.5, u), sink = sstep(0.5, 0.62, u), r = FLs * 0.42 * swell * (1 - sink);
        if (r > 0.6) { c.save(); blit(c, dropSpr(), EX, EY + T * 0.3 * sink, r * 2, r * 2 * (1 - 0.4 * sink), pk, false); glow(c, EX, EY, r * 2.2, ACC, 0.25 * pk * (1 - sink)); c.restore(); }
      } });
  };
})();
