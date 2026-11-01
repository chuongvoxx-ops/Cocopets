/* ---------- Light (pink), reworked: Ribbon Rainbow Heartache ----------
   Enormous ribbons of luminous pink satin unfurl from just ahead of the pet and dance through the monsters. Each ribbon
   is a twisting strip: its centreline follows the head's own recent path (so the tapered tail lags behind and feathers
   out), it carries a twist that rolls along its length, and every segment is a filled quad coloured by which face shows
   (pearl-pink top, richer rose underside) and how it catches the light (a satin sheen sliding along it); a narrow
   additive glowing edge, a soft halo of cached glow sprites, fine light strings tracing the longer path behind it, and
   little hearts drifting off. Paths alternate low sweeping passes with tall vertical loops: 2 ribbons on mirrored
   sweeps (3 at evo 3), 4 on layered figure-eights at Adept (5 at evo 6), and at Celestial 6 as three coordinated pairs
   on wide figure-eights crossing at three heights, finishing as three oversized bows that loosen into floating strings
   and stars. Leading edges brighten on contact, scattering stars and broken love hearts. Damage: per ribbon/monster
   repeat interval 0.4 s, at most 7 hits per monster (about 15 x base for one inside the dance throughout). */
(() => {
  const U = ELEM_IMPL.light.ult, TAU = Math.PI * 2; delete U.verdict;
  const ROSE = '#FF5CCB', CANDY = '#FF8FDB', MAG = '#E83EAC', BLUSH = '#FFD4EE', PEARL = '#FFF4FC', DEEP = '#8F2D73', LAV = '#D5C4FF';
  let H;
  const cl = u => Math.max(0, Math.min(1, u));
  const lerp = (a, b, u) => a + (b - a) * u;
  const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  const wrapA = d => { d = (d + Math.PI) % TAU; if (d < 0) d += TAU; return d - Math.PI; };
  function mixS(h1, h2, k) { const a = hexRGB(h1), b = hexRGB(h2); return '#' + [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k).toString(16).padStart(2, '0')).join(''); }
  /* the satin ramps: top face (pearl-pink) and underside (rose), dark to lit */
  const NL = 10;
  const ramp = stops => { const out = []; for (let i = 0; i < NL; i++) { const u = i / (NL - 1); let k = 0; while (k < stops.length - 2 && u > stops[k + 1][0]) k++; const [u0, c0] = stops[k], [u1, c1] = stops[k + 1]; out.push(mixS(c0, c1, cl((u - u0) / (u1 - u0)))); } return out; };
  const TOPR = ramp([[0, '#C9529F'], [0.32, '#FF7FD3'], [0.62, '#FFAEE2'], [0.85, '#FFC6EA'], [1, '#FFEAF7']]);
  const UNDR = ramp([[0, '#7A2262'], [0.3, '#A8337F'], [0.6, MAG], [0.85, ROSE], [1, '#FF9ADF']]);

  /* ---- hearts (the 20k4b curve), little sprites ---- */
  const HP = (() => { const N = 64, pts = []; for (let i = 0; i <= N; i++) { const t = i / N * TAU, s = Math.sin(t); pts.push([16 * s * s * s / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17 + 0.15]); } return pts; })();
  function heartPath(g, s, ox, oy) { g.beginPath(); for (let i = 0; i < HP.length - 1; i++) { const p = HP[i], x = ox + p[0] * s, y = oy + p[1] * s; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  const heartBody = (g, col) => { let gr = g.createRadialGradient(20, 20, 0, 20, 20, 20); gr.addColorStop(0, rgbaS(col, 0.5)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 40, 40); gr = g.createRadialGradient(17, 17, 0, 20, 21, 10); gr.addColorStop(0, PEARL); gr.addColorStop(0.45, col); gr.addColorStop(1, mixS(col, DEEP, 0.35)); heartPath(g, 10, 20, 19); g.fillStyle = gr; g.fill(); g.strokeStyle = rgbaS(DEEP, 0.6); g.lineWidth = 1; g.stroke(); };
  const smallSpr = col => fxSprite('lu6h' + col, 40, 40, g => heartBody(g, col));
  /* a broken love heart: the left or right half along a zigzag crack */
  const ZIG = [[20, 0], [20, 12], [17.6, 16], [22, 20], [18, 24.5], [21.2, 28], [20, 40]];
  const brokeSpr = (col, side) => fxSprite('lu6b' + side + col, 40, 40, g => { g.save(); g.beginPath(); g.moveTo(side ? 40 : 0, 0); for (const [x, y] of ZIG) g.lineTo(x, y); g.lineTo(side ? 40 : 0, 40); g.closePath(); g.clip(); heartBody(g, col); g.restore();
    g.strokeStyle = 'rgba(255,244,252,0.9)'; g.lineWidth = 1.1; g.beginPath(); ZIG.slice(1, -1).forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); });
  const starSpr = col => fxSprite('lu6s' + col, 32, 32, g => { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, rgbaS(col, 0.7)); gr.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.4 : 8.5, b = -Math.PI / 2 + i * Math.PI / 5; i ? g.lineTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r) : g.moveTo(16 + Math.cos(b) * r, 16 + Math.sin(b) * r); } g.closePath(); g.fillStyle = PEARL; g.fill(); g.strokeStyle = rgbaS(col, 0.9); g.lineWidth = 1; g.stroke(); });
  function blitC(c, img, x, y, w, h, a, add) { if (!(a > 0.01) || w < 0.5) return; c.save(); if (add) c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); c.drawImage(img, x - w / 2, y - h / 2, w, h); c.restore(); }
  /* particles: little hearts, stars and broken-heart halves drifting and fading */
  function bits() { const L = []; return { L,
    add(x, y, z, o) { L.push(Object.assign({ x, y, z, vx: 0, vy: 0, vz: 0, t: 0, life: 1, s: 0.18, col: ROSE, kind: 'h', r0: 0, vr: 0, g: 0, drag: 1.2 }, o)); },
    step(dt) { for (let i = L.length - 1; i >= 0; i--) { const p = L[i]; p.t += dt; if (p.t >= p.life) { L.splice(i, 1); continue; } const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * k - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); } },
    draw(c, T) { for (const p of L) { const u = p.t / p.life, a = Math.min(1, u * 6) * (1 - u), r = p.s * T * (p.kind === 's' ? 1.3 : 1.6) * (1 - 0.3 * u); if (a < 0.02) continue; c.save(); c.globalAlpha = a; c.globalCompositeOperation = p.kind === 's' ? 'lighter' : 'source-over'; c.translate(H.sx(p.x), H.sy(p.y) - p.z * T); c.rotate(p.r0 + p.vr * p.t);
      c.drawImage(p.kind === 'h' ? smallSpr(p.col) : p.kind === 's' ? starSpr(p.col) : brokeSpr(p.col, p.kind === 'br' ? 1 : 0), -r, -r, r * 2, r * 2); c.restore(); } } }; }

  /* ---- one satin strip in screen space: points (X, Y, depth Dz), twist TW, half width HW (px), alpha AL ---- */
  const LD = (() => { const v = [-0.38, -0.62, 0.68], n = Math.hypot(...v); return v.map(q => q / n); })(), HV = (() => { const v = [LD[0], LD[1], LD[2] + 1], n = Math.hypot(...v); return v.map(q => q / n); })();
  const EX = [], EY = [], FX = [], FY = [], KEY = [], LV = [], FC = [];
  function strip(c, S, n, ra, flash, t, ph, T) {
    let n0x = 0, n0y = 1;
    for (let k = 0; k < n; k++) {
      const kp = Math.max(0, k - 1), kn = Math.min(n - 1, k + 1); let tx = S.X[kn] - S.X[kp], ty = S.Y[kn] - S.Y[kp], tz = S.D[kn] - S.D[kp]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      const sl = Math.hypot(tx, ty); if (sl > 0.05) { n0x = ty / sl; n0y = -tx / sl; }
      const b0x = -tz * n0y, b0y = tz * n0x, b0z = tx * n0y - ty * n0x, cs = Math.cos(S.TW[k]), sn = Math.sin(S.TW[k]);
      const wx = cs * n0x + sn * b0x, wy = cs * n0y + sn * b0y, wz = sn * b0z;
      const Nx = ty * wz - tz * wy, Ny = tz * wx - tx * wz, Nz = tx * wy - ty * wx, top = Nz <= 0, sg = top ? -1 : 1;
      const dif = Math.max(0, sg * (Nx * LD[0] + Ny * LD[1] + Nz * LD[2])), sp = Math.pow(Math.max(0, sg * (Nx * HV[0] + Ny * HV[1] + Nz * HV[2])), 10);
      const u = k / (n - 1), sheen = top ? 0.32 * Math.pow(Math.max(0, Math.sin(u * 8.5 - t * 4.2 + ph)), 6) : 0.12 * Math.pow(Math.max(0, Math.sin(u * 6 - t * 3 + ph)), 6);
      const lv = 0.06 + 0.5 * dif + 0.45 * sp + sheen + flash * 0.35 * Math.max(0, 1 - u * 5);
      const hw = S.HW[k], sc = 1;
      EX[k] = S.X[k] + wx * hw * sc; EY[k] = S.Y[k] + wy * hw * sc; FX[k] = S.X[k] - wx * hw * sc; FY[k] = S.Y[k] - wy * hw * sc;
      LV[k] = Math.max(0, Math.min(NL - 1, Math.round(lv * (NL - 1)))); FC[k] = top ? 0 : 1;
      KEY[k] = FC[k] * 1000 + LV[k] * 10 + Math.round(S.AL[k] * 6);
    }
    // the body: one filled polygon per run of segments of the same face, shade and alpha
    c.save(); c.lineJoin = 'round';
    let a = 0;
    while (a < n - 1) { let b = a; while (b + 1 < n - 1 && KEY[b + 1] === KEY[a]) b++;
      const al = Math.round(S.AL[a] * 6) / 6 * ra;
      if (al > 0.02) { c.beginPath(); c.moveTo(EX[a], EY[a]); for (let k = a + 1; k <= b + 1; k++) c.lineTo(EX[k], EY[k]); for (let k = b + 1; k >= a; k--) c.lineTo(FX[k], FY[k]); c.closePath();
        const col = (FC[a] ? UNDR : TOPR)[LV[a]]; c.globalAlpha = al; c.fillStyle = col; c.fill(); if (al > 0.97) { c.strokeStyle = col; c.lineWidth = 1; c.stroke(); } }
      a = b + 1; }
    // the narrow glowing edge: both borders, soft rose glow under a fine pearl line, fading toward the tail
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    const CH = 5;
    for (let q = 0; q < CH; q++) { const i0 = Math.floor(q * (n - 1) / CH), i1 = Math.floor((q + 1) * (n - 1) / CH); if (i1 <= i0) continue; const fa = ra * (1 - q / CH) * (q === 0 ? 1 + flash * 0.8 : 1);
      for (const [PX, PY] of [[EX, EY], [FX, FY]]) { c.beginPath(); c.moveTo(PX[i0], PY[i0]); for (let k = i0 + 1; k <= i1; k++) c.lineTo(PX[k], PY[k]); c.globalAlpha = Math.min(1, 0.22 * fa); c.strokeStyle = ROSE; c.lineWidth = T * 0.16; c.stroke(); c.globalAlpha = Math.min(1, 0.75 * fa); c.strokeStyle = q ? BLUSH : PEARL; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); } }
    c.restore();
  }

  U.ribbonheartache = (C, h) => {
    H = h; const me = H.me, ev = evoOf(C), N = [2, 2, 3, 4, 4, 5, 6][ev - 1], tier = ev >= 7 ? 3 : ev >= 4 ? 2 : 1;
    const DK = C.base * C.K * (1 + 0.08 * (ev - 1)), MAXH = 7, DMG = DK * 15 / MAXH, GAP = 0.4;
    const SD = 1 / 50, MB = [48, 52, 56][tier - 1], MS = MB * 2, WT = (0.4 + 0.035 * ev) * (C.K > 1 ? 1.08 : 1);   // sample step, body and string lengths (samples), half width (tiles)
    const TE = tier === 3 ? 4.0 : 4.3, TL = TE + 1.1, END = tier === 3 ? TL + 1.05 : TE + 1.05;   // Celestial: gather into bows at TE, loosen at TL
    const OM = [1.9, 1.7, 1.6][tier - 1];
    H.X.banner('RIBBON RAINBOW HEARTACHE', '', ROSE, 1.4); H.X.sfx.hum();
    const a0 = C.a, B = bits(), lastHit = new Map(), cntHit = new Map();
    // the dance's centre: the monster group near the aim, smoothed as it moves
    const group = (x, y) => { const L = H.living().filter(m => Math.hypot(m.x - x, m.y - y) < 8); if (!L.length) return null; let cx = 0, cy = 0; for (const m of L) { cx += m.x; cy += m.y; } cx /= L.length; cy /= L.length; let sp = 0; for (const m of L) sp = Math.max(sp, Math.hypot(m.x - cx, m.y - cy)); return { x: cx, y: cy, sp: Math.min(sp, 3) }; };
    const tx0 = C.tx != null ? C.tx : me.x + Math.cos(a0) * 3.5, ty0 = C.ty != null ? C.ty : me.y + Math.sin(a0) * 3.5;
    const g0 = group(tx0, ty0) || group(me.x, me.y) || { x: me.x + Math.cos(a0) * 3.2, y: me.y + Math.sin(a0) * 3.2, sp: 1.5 };
    const A = { x: g0.x, y: g0.y };
    const RR = Math.max(2.3, Math.min(3.3, g0.sp + 1.1)) * (tier === 3 ? 1.1 : 1) + 0.05 * ev, R1x = RR, R2x = RR * 0.8;
    const sx0 = me.x + Math.cos(a0) * 1.0, sy0 = me.y + Math.sin(a0) * 1.0;
    const rbs = [];
    for (let i = 0; i < N; i++) { const pr = tier === 3 ? Math.floor(i / 2) : i, j = tier === 3 ? i % 2 : i % 2;
      const o = { i, pr, j, t0: 0.12 * i, ph: tier === 3 ? pr * TAU / 3 * 0.37 + j * Math.PI : i * TAU / N, m: j ? -1 : 1, fa: tier === 3 ? a0 + pr * Math.PI / 3 : a0 + (tier === 2 && i >= 2 ? Math.PI / 2 : 0),
        zb: tier === 3 ? [0.35, 1.05, 1.8][pr] : tier === 2 ? [0.35, 1.2][Math.floor(i / 2) % 2] + (i === 4 ? 0.5 : 0) : 0.35 + 0.55 * j + (i === 2 ? 0.3 : 0), Lr: tier === 3 ? 1.45 : 1.2 + 0.05 * ev,
        tw0: R1(i * 3.7) * TAU, sd: i * 11 + 5, h: [], ls: -SD, flash: 0, snap: null, gone: false };
      rbs.push(o); }
    function pathAt(rb, s) {
      const tau = s - rb.t0; if (tau < 0) return { x: sx0, y: sy0, z: 0.9, tw: rb.tw0 };
      const th = rb.ph + OM * tau, sth = Math.sin(th);
      const gx = R1x * sth, gy = tier === 1 ? R2x * 0.42 * Math.cos(th) * rb.m : R2x * 0.55 * Math.sin(2 * th) * rb.m;
      const ca = Math.cos(rb.fa), sa = Math.sin(rb.fa);
      let x = A.x + ca * gx - sa * gy, y = A.y + sa * gx + ca * gy;
      // tall loops at the ends of each sweep: a vertical loop rolling over the turn
      const sv = th / Math.PI - 0.5, nn = Math.round(sv), d = sv - nn, LW = 0.2, ps = TAU * (nn + sm((d + LW) / (2 * LW)) - 0.5), lf = (nn % 2 ? 1 : -1) * rb.m;
      x += lf * rb.Lr * Math.sin(ps);
      let z = rb.zb + 0.16 * Math.sin(1.3 * tau + rb.ph) + rb.Lr * (1 - Math.cos(ps));
      const tw = rb.tw0 + 0.7 * tau * rb.m + 0.6 * Math.sin(1.4 * tau + rb.ph) + ps * 0.5;
      const e = sm(tau / 0.9); if (e < 1) { x = lerp(sx0 - Math.sin(a0) * (rb.i - (N - 1) / 2) * 0.4, x, e); y = lerp(sy0 + Math.cos(a0) * (rb.i - (N - 1) / 2) * 0.4, y, e); z = lerp(0.9, z, e); }
      return { x, y, z, tw };
    }
    // Celestial: each pair's bow (in a plane facing the viewer); u = 0 the knot (the head) .. 1 the hanging tail
    let BX = null; const bowK = pr => { if (BX == null) BX = lerp(A.x, me.x, 0.45); const off = (pr - 1) * 2.5; return { x: BX + off, y: A.y + (pr === 1 ? -0.35 : 0.25), z: pr === 1 ? 2.35 : 1.75 }; };
    function bowPt(rb, u, t) { const K = bowK(rb.pr), s = rb.j ? 1 : -1, Lw = 1.35, Lh = 1.05;
      if (u < 0.6) { const ph = u / 0.6 * TAU, bx = s * Lw * (1 - Math.cos(ph)) / 2, by = Lh * 0.5 * Math.sin(ph) + bx * s * 0.22; return { x: K.x + bx, y: K.y, z: K.z + by, tw: 0.8 * Math.sin(ph) + 0.25 * Math.sin(ph * 2 + t * 2) }; }
      const v = (u - 0.6) / 0.4; return { x: K.x + s * (0.15 + 0.7 * v) * Lw * 0.7 + Math.sin(v * 5 + t * 2 + rb.j) * 0.08, y: K.y + 0.05, z: K.z - 1.6 * v, tw: 0.4 + 0.9 * Math.sin(v * 4 + t * 1.8) }; }
    const body = rb => { const n = Math.min(MB, rb.h.length), out = []; for (let k = 0; k < n; k++) out.push(rb.h[rb.h.length - 1 - k]); return out; };
    let starsOut = false;
    H.add({ life: END, x: A.x, y: A.y,
      update(dt, f) {
        const t = f.t; B.step(dt);
        if (t < TE) { const g = group(A.x, A.y); if (g) { const k = 1 - Math.exp(-dt / 1.3); A.x += (g.x - A.x) * k; A.y += (g.y - A.y) * k; } }
        for (const rb of rbs) { rb.flash = Math.max(0, rb.flash - dt * 2.8);
          if (!rb.snap) while (rb.ls + SD <= t) { rb.ls += SD; rb.h.push(pathAt(rb, rb.ls)); if (rb.h.length > MS) rb.h.shift(); }
          if (tier === 3 && t >= TE && !rb.snap) rb.snap = body(rb).map(p => Object.assign({}, p));
          const nh = rb.h.length; if (!nh) continue;
          // contacts: the head and the front of the strip, low enough to touch the monsters
          if (t > rb.t0 + 0.45 && t < TE) for (let k = 0; k < MB * 0.6 && k < nh; k += 4) { const p = rb.h[nh - 1 - k]; if (p.z > 2.3) continue;
            for (const m of H.living()) { if (Math.hypot(m.x - p.x, m.y - p.y) > WT + 0.45 + m.r) continue; const key = m, lr = lastHit.get(key) || {}, c0 = cntHit.get(m) || 0; if (c0 >= MAXH) continue; if (lr[rb.i] != null && t - lr[rb.i] < GAP) continue; if (lr.any != null && t - lr.any < 0.12) continue;
              lr[rb.i] = t; lr.any = t; lastHit.set(key, lr); cntHit.set(m, c0 + 1); H.X.hitMon(m, DMG, C.dmgO()); rb.flash = 1;
              const ux = (m.x + p.x) / 2, uy = (m.y + p.y) / 2, uz = Math.min(1.2, p.z + 0.3); H.X.light(ux, uy, 1.5, 0.16);
              for (let q = 0; q < H.n(4); q++) { const b = Math.random() * TAU; B.add(ux, uy, uz, { vx: Math.cos(b) * 2.4, vy: Math.sin(b) * 1.2, vz: 1 + Math.random() * 1.4, g: 1.6, life: 0.45 + Math.random() * 0.35, s: 0.08 + Math.random() * 0.04, kind: 's', col: q % 2 ? BLUSH : PEARL }); }
              const sdx = Math.random() < 0.5 ? 1 : -1; for (const sd of [0, 1]) B.add(ux, uy, uz + 0.2, { vx: (sd ? 1 : -1) * (0.9 + Math.random() * 0.4), vz: 1.4 + Math.random() * 0.5, g: 1.8, drag: 1.4, life: 0.75, s: 0.15, kind: sd ? 'br' : 'bl', col: sdx > 0 ? CANDY : ROSE, vr: (sd ? 1 : -1) * 2.2 });
              break; } }
          // heart particles drift away from the strip now and then
          if (t < TE && nh > 12 && Math.random() < dt * 3.2 * H.Q()) { const p = rb.h[nh - 1 - Math.floor(Math.random() * Math.min(nh, MB))]; B.add(p.x, p.y, p.z, { vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.3, vz: 0.35 + Math.random() * 0.4, life: 0.9 + Math.random() * 0.6, s: 0.07 + Math.random() * 0.05, kind: Math.random() < 0.6 ? 'h' : 's', col: [CANDY, BLUSH, ROSE, LAV][Math.floor(Math.random() * 4)], drag: 0.6, r0: (Math.random() - 0.5) * 0.6 }); }
        }
        // Celestial: as the bows loosen, stars float off them
        if (tier === 3 && t >= TL && !starsOut) { starsOut = true; for (const rb of rbs) for (let q = 0; q < H.n(9); q++) { const p = bowPt(rb, q / 9, t); B.add(p.x, p.y, p.z, { vx: (Math.random() - 0.5) * 0.8, vz: 0.2 + Math.random() * 0.6, g: -0.1, drag: 0.8, life: 0.9 + Math.random() * 0.5, s: 0.08 + Math.random() * 0.06, kind: q % 3 ? 's' : 'h', col: [PEARL, BLUSH, LAV, CANDY][q % 4] }); } }
      },
      drawUnder(c, f, X, Y, T, t) {
        t = f.t; const fa = sm(t / 0.6) * (1 - sm((t - TE) / 0.7));
        if (fa < 0.02) return;
        c.save(); c.globalCompositeOperation = 'lighter'; const gs = glowSprite(ROSE);
        for (const rb of rbs) { const L = rb.h, n = Math.min(MB, L.length); for (let k = 0; k < n; k += 6) { const p = L[L.length - 1 - k]; if (p.z > 1.3) continue; const a = 0.22 * fa * (1 - p.z / 1.3) * (1 - k / n), r = T * 1.1; c.globalAlpha = a; c.drawImage(gs, H.sx(p.x) - r, H.sy(p.y) - r * H.GY, r * 2, r * 2 * H.GY); } }
        c.restore();
      },
      draw(c, f, X, Y, T, t) {
        t = f.t; const PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5;
        const P3 = (p, o) => { o.X = H.sx(p.x); o.Y = H.sy(p.y) - p.z * T; o.D = p.y * T * 0.7; return o; };
        const bowU = tier === 3 ? sm((t - TE) / 0.6) : 0, loose = tier === 3 ? sm((t - TL) / 1.0) : 0, endF = tier === 3 ? 1 : 1 - sm((t - TE) / 0.8);
        const order = rbs.map(rb => { const L = rb.h; return { rb, d: L.length ? L[L.length - 1].y : 0 }; }).sort((p, q) => p.d - q.d);
        const tmp = {};
        for (const { rb } of order) {
          // gather the strip's points (head first)
          let pts = rb.snap && tier === 3 ? rb.snap : body(rb); const n = pts.length; if (n < 4) continue;
          const S = rb.S || (rb.S = { X: new Float32Array(MB), Y: new Float32Array(MB), D: new Float32Array(MB), TW: new Float32Array(MB), HW: new Float32Array(MB), AL: new Float32Array(MB) });
          const wF = (1 - 0.93 * loose) * (1 - 0.4 * bowU) * (tier === 3 ? 1 : 1 - 0.85 * sm((t - TE) / 0.8)), aF = tier === 3 ? 1 - sm((t - TL - 0.15) / 0.75) : endF;
          let pd = 1e9;
          for (let k = 0; k < n; k++) { const u = k / (n - 1); let p = pts[k], tw = p.tw;
            if (bowU > 0) { const b = bowPt(rb, u, t), um = sm((t - TE - 0.18 * u) / 0.55); p = { x: lerp(p.x, b.x, um), y: lerp(p.y, b.y, um), z: lerp(p.z, b.z, um) }; tw = pts[k].tw + wrapA(b.tw - pts[k].tw) * um;
              if (loose > 0) { p.x += ((R1(k * 0.37 + rb.sd) - 0.5) * 0.9 + Math.sin(k * 0.3 + t * 1.6 + rb.i) * 0.15) * loose; p.z += (0.5 * R1(k * 0.71 + rb.sd) + 0.15 * Math.sin(k * 0.25 + t * 2)) * loose; }
              else p.z += 0.06 * Math.sin(t * 3 + rb.pr) * sm((t - TE - 0.5) / 0.3); }
            P3(p, tmp); S.X[k] = tmp.X; S.Y[k] = tmp.Y; S.D[k] = tmp.D;
            S.TW[k] = tw + 0.4 * (1 - bowU) * Math.sin(u * 4.5 - t * 3.5 + rb.i * 1.3);
            // width: a rounded head, a long smooth taper, a gentle breathing ripple; alpha feathers out over the tail
            S.HW[k] = WT * T * Math.sqrt(sm(u / 0.07)) * Math.pow(1 - u, 0.75) * (1 + 0.1 * Math.sin(u * 6 - t * 3 + rb.i)) * wF;
            S.AL[k] = 1 - sm((u - 0.55) / 0.45);
            if (k % 3 === 0) pd = Math.min(pd, Math.hypot(tmp.X - PX, tmp.Y - PY)); }
          const form = sm((t - rb.t0) / 0.35), pf = 0.6 + 0.4 * cl((pd - 0.3 * T) / (0.9 * T)), ra = form * pf * aF;
          // fine light strings tracing the longer path behind (and, at the finish, the loosened strip itself)
          c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
          const L = rb.h, nl = rb.snap ? 0 : L.length, sa = form * pf * (tier === 3 ? 1 - sm((t - TE) / 0.5) : 1 - sm((t - TE - 0.3) / 0.75));
          if (nl > 6 && sa > 0.02) for (let j = 0; j < 2; j++) { const sp = []; for (let k = 0; k < nl; k += 2) { const p = L[nl - 1 - k], u = k / (MS - 1); sp.push([H.sx(p.x) + Math.sin(u * 6 + t * 2.4 + j * 2.1 + rb.i) * T * 0.12 * (0.3 + u), H.sy(p.y) - (p.z + (j ? 0.32 : -0.32) * WT * (1 - u) + u * 0.35) * T]); }
            const CH = 4, m = sp.length; for (let q = 0; q < CH; q++) { const i0 = Math.floor(q * (m - 1) / CH), i1 = Math.floor((q + 1) * (m - 1) / CH); if (i1 <= i0) continue; c.beginPath(); c.moveTo(sp[i0][0], sp[i0][1]); for (let k = i0 + 1; k <= i1; k++) c.lineTo(sp[k][0], sp[k][1]); const a = sa * (1 - q / CH);
              c.globalAlpha = 0.22 * a; c.strokeStyle = ROSE; c.lineWidth = 4; c.stroke(); c.globalAlpha = 0.8 * a; c.strokeStyle = j ? (tier >= 2 ? LAV : CANDY) : BLUSH; c.lineWidth = 1.2; c.stroke(); } }
          if (loose > 0) { // the loosened bow: floating strings along its old edges
            const la = (1 - sm((t - TL - 0.35) / 0.65)) * pf; c.beginPath(); for (let k = 0; k < n; k++) k ? c.lineTo(S.X[k], S.Y[k]) : c.moveTo(S.X[k], S.Y[k]); c.globalAlpha = 0.3 * la; c.strokeStyle = ROSE; c.lineWidth = 5; c.stroke(); c.globalAlpha = 0.9 * la; c.strokeStyle = PEARL; c.lineWidth = 1.3; c.stroke(); }
          // the halo: cached glow sprites along the strip
          const gs = glowSprite(ROSE); for (let k = 2; k < n; k += 5) { const r = (S.HW[k] * 2.2 + T * 0.3), a = 0.2 * ra * S.AL[k]; if (a < 0.02) continue; c.globalAlpha = a; c.drawImage(gs, S.X[k] - r, S.Y[k] - r, r * 2, r * 2); }
          c.restore();
          if (ra > 0.02) strip(c, S, n, ra, rb.flash, t, rb.i * 1.7, T);
          // the leading edge: a pearl glow at the head, brighter on contact
          if (ra > 0.02 && !(tier === 3 && bowU > 0.5 && loose > 0.3)) { const hx = S.X[1], hy = S.Y[1]; blitC(c, glowSprite(ROSE), hx, hy, T * (1.6 + 1.2 * rb.flash), T * (1.6 + 1.2 * rb.flash), 0.5 * ra, true); blitC(c, glowSprite(PEARL), hx, hy, T * (0.7 + 0.6 * rb.flash), T * (0.7 + 0.6 * rb.flash), (0.6 + 0.4 * rb.flash) * ra, true); }
        }
        // Celestial: a pearl knot light at each bow's centre
        if (tier === 3 && bowU > 0.3) for (let pr = 0; pr < 3; pr++) { const K = bowK(pr), a = sm((t - TE - 0.35) / 0.3) * (1 - sm((t - TL) / 0.6)), kx = H.sx(K.x), ky = H.sy(K.y) - K.z * T; blitC(c, glowSprite(ROSE), kx, ky, T * 2.4, T * 2.4, 0.5 * a, true); blitC(c, glowSprite(PEARL), kx, ky, T * 1.0, T * 1.0, 0.9 * a, true); }
        B.draw(c, T);
      } });
  };
})();
