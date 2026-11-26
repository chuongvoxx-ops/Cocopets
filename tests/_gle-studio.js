// v451 GE, v455 GE2: Golden Eagle's studio sheets: the eagle alone (GLM forced on the software rasteriser), posed by the move's own
// choreography (ELEM_IMPL.wind.ult.goldeneagle.choreo: the same pure function the game plays) in the game's camera and in a level side
// view; the downstroke up close (the shoulders leading, the elbows, wrists and primaries following, the primaries' flex); the head and
// the feather groups up close; the ordered dissolve and the painted 2D fallback; the waves' painter kinds on a floor swatch.
// usage: HTML=<test html> node tests/_gle-studio.js   env: OUT (shots/v455-GE2), DPR (1), ONLY (a comma list of sheet names), TIER (2)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v455-GE2'); fs.mkdirSync(OUT, { recursive: true });
  const DPR = +(process.env.DPR || 1), ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null, TIER = +(process.env.TIER || 2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Eagle|GLM|shader|FGFX|Nidhogg|error/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 600)); });
  await page.addInitScript(() => { window.__GE_GL = 1; window.__GE_GLHQ = 1; window.__NG_GL = 1; });
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  const sheet = async (name, spec, opt) => {
    if (ONLY && !ONLY.includes(name)) return;
    const r = await page.evaluate(async ([spec, opt, TIER]) => {
      const G = window.GOLDEAGLE_GL, GE = window.__pp.ELEM_IMPL.wind.ult.goldeneagle, cv = document.createElement('canvas'), W = 1200, Hh = 760, dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = Hh * dpr; cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:760px;z-index:99999'; document.body.appendChild(cv);
      const c = cv.getContext('2d'); c.scale(dpr, dpr); const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, opt && opt.bg ? opt.bg[0] : '#3A4A44'); gr.addColorStop(1, opt && opt.bg ? opt.bg[1] : '#1A2420'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      c.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 1, Hh); for (let y = 0; y < Hh; y += 22) c.fillRect(0, y, W, 1);
      const out = [], CH = {};
      for (const s of spec) { let P;
        if (s.ct != null) { // a frame of the real performance: choreo(tier, aim, side).pose(t)
          const key = (s.tier == null ? TIER : s.tier) + ':' + (s.A || 0) + ':' + (s.side || 1), ch = CH[key] || (CH[key] = GE.choreo(s.tier == null ? TIER : s.tier, s.A || 0, s.side || 1)), T = typeof s.ct === 'string' ? eval(s.ct.replace(/TR(\d)/g, 'ch.TR[$1]').replace(/LAST/g, 'ch.TR[ch.NB - 1]').replace(/LEAVE/g, 'ch.T_LEAVE').replace(/W1/g, 'ch.W1')) : s.ct;
          P = ch.pose(T, -1); if (!s.keep) { const z1 = s.zrel ? Math.max(-1.2, Math.min(1.2, P.z - 3.2)) : 0, d = [-P.x, -P.y, z1 - P.z]; P.x = 0; P.y = 0; P.z = z1; if (P.look) P.look = [P.look[0] + d[0], P.look[1] + d[1], P.look[2] + d[2]]; } if (s.lk === false) P.look = null; s.label = (s.label || '') + ' (t ' + T.toFixed(2) + ')'; }
        else { const wp = typeof s.wing === 'string' ? G.WP[s.wing] : s.wing ? G.wmix(G.WP[s.wing[0]], G.WP[s.wing[1]], s.wing[2]) : G.WP.rest;
          P = { x: 0, y: 0, z: 0, yaw: s.yaw || 0, pitch: s.pitch || 0, roll: s.roll || 0, sc: s.sc || 1, wing: wp, tail: { fan: s.tf == null ? 0.8 : s.tf, pitch: s.tp || 0 }, head: { pitch: s.hp || 0, yaw: s.hy || 0 }, leg: s.leg == null ? 0.4 : s.leg, grip: s.grip == null ? 0.5 : s.grip, jaw: s.jaw || 0, glow: s.glow == null ? 1 : s.glow, glow2: s.glow2 || 0, spill: s.spill || 0, spillO: !!s.spillO, t: s.t || 1.3, k: s.k || 0 }; }
        if (s.sc) P.sc = s.sc; if (s.yaw != null && s.ct != null) P.yaw = s.yaw;
        const t0 = performance.now(); const r = G.studio(c, s.x, s.y, P, { T: s.T || 60, d2: !!s.d2, side: !!s.side }); out.push({ gl: r.gl, ms: Math.round(performance.now() - t0), items: G.STATS.items, tris: G.STATS.tris });
        c.fillStyle = '#EEE'; c.font = '13px sans-serif'; c.fillText(s.label || '', s.x - (s.lw || 80), s.y + (s.ly || 150)); }
      if (opt && opt.title) { c.fillStyle = '#FFF'; c.font = 'bold 16px sans-serif'; c.fillText(opt.title, 16, 24); }
      if (opt && opt.fx) { // the waves' painter kinds on a floor swatch (FGFX)
        const F = window.NIDHOGG_MOVES.FGFX, Q = F.begin(c, null), T = 46, GY = 0.55;
        c.fillStyle = '#B9AE90'; c.fillRect(0, 380, W, 380);
        const crescent = (cx, cy, dir, hw, s, fin, h) => { const dx = Math.cos(dir), dy = Math.sin(dir), nx = -dy, ny = dx, NS = 16, dO = 2 * hw / NS, curv = fin ? 0.15 : 0.2, lean = 0.65 * h;
          for (const layer of [0, 1]) for (let i = 0; i < NS; i++) { const of0 = -hw + i * dO, of1 = of0 + dO, s0 = s - curv * of0 * of0, s1 = s - curv * of1 * of1, X0 = cx + (dx * s0 + nx * of0) * T, Y0 = cy + (dy * s0 + ny * of0) * T * GY, X1 = cx + (dx * s1 + nx * of1) * T, Y1 = cy + (dy * s1 + ny * of1) * T * GY, ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2, q0 = of0 / hw, q1 = dO / hw + 4 * ((i === 0 ? 1 : 0) + (i === NS - 1 ? 2 : 0)), col = fin ? '#FF0000' : '#000000';
            if (!layer) { const tl = fin ? 2.1 : 1.5, pad = tl * 0.12 / 0.88, bx = -dx * (tl + pad) / 2 * T, by = -dy * (tl + pad) / 2 * T * GY, X = (X0 + X1) / 2 + dx * pad * T + bx, Y = (Y0 + Y1) / 2 + dy * pad * T * GY + by; Q.quad(371, X, Y, ux, uy, bx, by, col, 1, q0, q1, s); Q.quad(370, X, Y, ux, uy, bx, by, col, 1, q0, q1, s); }
            else { const Hx = dx * lean * T, Hy = (dy * lean * GY - h * 0.835) * T, X = (X0 + X1) / 2 + Hx / 2, Y = (Y0 + Y1) / 2 + Hy / 2; Q.quad(368, X, Y, ux, uy, -Hx / 2, -Hy / 2, col, 1, q0, q1, s); Q.quad(369, X, Y, ux, uy, -Hx / 2, -Hy / 2, col, 1, q0, q1, s); } } };
        crescent(200, 600, -Math.PI / 2, 2.2, 2, false, 0.7); crescent(520, 520, Math.PI / 2, 2.4, 2, false, 0.7); crescent(820, 600, 0, 2.6, 2, false, 0.7); crescent(1060, 650, -Math.PI / 2, 3.4, 2, true, 1.0);
        Q.quad(373, 200, 700, 110, 0, 0, 60, '#FFFFFF', 1, 0.6, 1.7, 1.0); Q.quad(372, 1050, 170, 130, 0, 0, 104, '#FFFFFF', 1, 1, 0.37, 0);
        for (let i = 0; i < 6; i++) Q.rq(374, 640 + i * 40, 430, 18, 8, i * 0.6, '#FFFFFF', 1, i / 6, (i - 3) * 0.2, i > 3 ? 0.5 : 0);
        for (let i = 0; i < 6; i++) Q.rq(386, 640 + i * 30, 470, 7, 5.5, i, '#B8A88C', 1, i / 6, 0, 0);
        for (let i = 0; i < 6; i++) Q.rq(387, 640 + i * 34, 500, 12, 6, i * 0.7, ['#5FB24A', '#FF9EC4', '#E8D8F0'][i % 3], 1, i / 6, (i - 3) * 0.15, 0);
        const rb = (kind, ax, ay, bx, by, m, w, col, a0, a1, flip) => { const ux = (bx - ax) / 2, uy = (by - ay) / 2, l = Math.hypot(ux, uy), px = -uy / l, py = ux / l, Hh2 = Math.abs(m) / 2 + 2.6 * w; Q.quad(kind, (ax + bx) / 2 + px * m / 2, (ay + by) / 2 + py * m / 2, ux, uy, px * Hh2, py * Hh2, col, 1, m / Hh2, (w / Hh2) * (flip ? -1 : 1), Math.floor(a0 * 99) + a1 * 0.99); };
        rb(375, 860, 420, 1150, 470, 40, 4, '#A8FFE0', 0.1, 0.9); rb(384, 860, 470, 1150, 520, 40, 7, '#A8FFE0', 0.1, 0.9); rb(384, 860, 520, 1150, 570, -30, 7, '#2FD69C', 0.9, 0.2);
        // a vortex: a chain of 385 stretches
        let s0 = 0; for (let j = 0; j < 5; j++) { const ax = 380 + j * 50, ay = 450 + Math.sin(j) * 6, bx = ax + 50, by = 450 + Math.sin(j + 1) * 6, ux = (bx - ax) / 2, uy = (by - ay) / 2, l = Math.hypot(ux, uy), rr = 10 + j * 2.5; Q.quad(385, (ax + bx) / 2, (ay + by) / 2, ux, uy, -uy / l * rr, ux / l * rr, '#DFFFF2', 1, s0, 50 / 46 + 10 * 3, Math.floor((1 - j / 5) * 99) + (1 - (j + 1) / 5) * 0.99); s0 += 50 / 46; }
        F.flush(c); }
      if (opt && opt.waves) { // (v456 GE3) close-ups of a wave and of the final as the move lays them (its waveQuads, the tip columns, the vortices left out): the floor, the nested sheets, the aurora; the release bursts; an edge streak
        const F = window.NIDHOGG_MOVES.FGFX, TU = GE.TUNE, ZK = G.ZK, GY = 0.55, tt = opt.waves.t || 0;
        c.fillStyle = opt.waves.floor || '#3B3447'; c.fillRect(0, 40, W, Hh - 40); c.fillStyle = 'rgba(255,255,255,0.04)'; for (let x = 0; x < W; x += 50) c.fillRect(x, 40, 2, Hh); for (let y = 40; y < Hh; y += 28) c.fillRect(0, y, W, 2);
        const Q = F.begin(c, null), sst = (a, b, x) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
        const wave = (OX, OY, T, fin, s, k, A) => { const dx = Math.cos(A), dy = Math.sin(A), nx = -dy, ny = dx, w = fin ? { w0: TU.w0F, w1: TU.w1F, range: TU.rangeF, curv: TU.curvF, h: TU.hF, trail: TU.trailF } : { w0: TU.w0, w1: TU.w1, range: TU.range, curv: TU.curv, h: TU.h, trail: TU.trail };
          const sx = x => OX + x * T, sy = y => OY + y * T * GY, hwAt = s2 => w.w0 + (w.w1 - w.w0) * Math.min(1, s2 / w.range), hq = w.h * (1 - 0.3 * sst(0.65, 1, s / w.range)), hw = hwAt(s);
          const str = (s2, hw2, step, fn) => { const n = Math.max(4, Math.round(Math.max(8, Math.min(22, Math.ceil(2 * hw2 / 0.45))) / step)), dO = 2 * hw2 / n; for (let i = 0; i < n; i++) { const of0 = -hw2 + i * dO, of1 = of0 + dO, s0 = s2 - w.curv * of0 * of0, s1 = s2 - w.curv * of1 * of1; fn(sx(dx * s0 + nx * of0), sy(dy * s0 + ny * of0), sx(dx * s1 + nx * of1), sy(dy * s1 + ny * of1), of0 / hw2, dO / hw2 + 4 * ((i === 0 ? 1 : 0) + (i === n - 1 ? 2 : 0))); } };
          const col0 = fin ? '#FF0000' : '#000000', tl = w.trail, pad = tl * 0.12 / 0.88, bx = -dx * (tl + pad) / 2 * T, by = -dy * (tl + pad) / 2 * T * GY;
          str(s, hw, 1, (X0, Y0, X1, Y1, q0, q1) => { const ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2, cx = (X0 + X1) / 2 + dx * pad * T + bx, cy = (Y0 + Y1) / 2 + dy * pad * T * GY + by; Q.quad(371, cx, cy, ux, uy, bx, by, col0, 1, q0, q1, s + 37 * k); Q.quad(370, cx, cy, ux, uy, bx, by, col0, 1, q0, q1, s + 37 * k); });
          const lags = fin ? TU.sheetsF : TU.sheets, CO = [['#000000', '#008000', '#00FF00'], ['#FF0000', '#FF8000', '#FFFF00']][fin ? 1 : 0];
          for (let L = lags.length; L >= 0; L--) { const sL = L ? s - lags[L - 1] : s, hL = hq * (L === 0 ? 1 : fin && L === 1 ? 0.92 : L === 1 ? 0.8 : 0.64), hwL = L ? hwAt(sL) * (fin && L === 1 ? 0.98 : 0.94) : hw, lean = Math.min(TU.lean, 0.65 * hL), Hx = dx * lean * T, Hy = (dy * lean * GY - hL * ZK) * T;
            str(sL, hwL, L ? 2 : 1, (X0, Y0, X1, Y1, q0, q1) => { const ux = (X1 - X0) / 2, uy = (Y1 - Y0) / 2, cx = (X0 + X1) / 2 + Hx / 2, cy = (Y0 + Y1) / 2 + Hy / 2, q2 = sL + 37 * k + L * 11;
              Q.quad(368, cx, cy, ux, uy, -Hx / 2, -Hy / 2, CO[L], 1, q0, q1, q2); Q.quad(369, cx, cy, ux, uy, -Hx / 2, -Hy / 2, CO[L], 1, q0, q1, q2); if (fin && L === 0) Q.quad(390, (X0 + X1) / 2 + Hx * 1.05, (Y0 + Y1) / 2 + Hy * 1.05, ux, uy, -Hx * 0.65, -Hy * 0.65, CO[L], 1, q0, q1, q2); }); }
          for (const sg of [1, -1]) { const of = sg * (hw - 0.4), sf = s - w.curv * of * of, Hp = hq * (fin ? 1.75 : 1.6) * ZK * T; Q.quad(388, sx(dx * sf + nx * of), sy(dy * sf + ny * of) - Hp / 2, T * (fin ? 0.95 : 0.78), 0, 0, Hp / 2, '#FFFFFF', 1, k * 1.7 + (sg > 0 ? 0 : 3.1), fin ? 1 : 0, 0); } };
        const A = opt.waves.A == null ? -Math.PI / 2 : opt.waves.A;
        if (Math.abs(A) < 0.5) { wave(60, 600, 62, false, 3.6, 0, A); wave(560, 640, 52, true, 4.6, 5, A); } else { wave(300, 640, 62, false, 3.6, 0, A); wave(880, 690, 52, true, 4.6, 5, A); }
        Q.shape(389, 150, 210, 120, 0, 0, 66, '#FFFFFF', 1, 0.6, -Math.PI / 2, 0.9, 0, 1); Q.shape(389, 420, 200, 110, 0, 0, 86, '#FFFFFF', 0.85, 0.45, 9, 0.85 + 30, 0, 1);
        Q.quad(391, 1170, 220, -30, 0, 0, 170, '#FFFFFF', 1, 0.3, 1, 0); Q.quad(391, 30, 220, 30, 0, 0, 170, '#FFFFFF', 1, 4.1, 1, 0);
        for (let i = 0; i < 16; i++) Q.star(560 + (i % 8) * 22, 150 + Math.floor(i / 8) * 30 + (i % 3) * 6, 7 + (i % 3) * 2, 0.9, i % 2 ? '#FFE6A0' : '#DFFFF0');
        F.flush(c); c.fillStyle = '#EEE'; c.font = '13px sans-serif'; c.fillText('a wave (s 3.6)', 230, 720); c.fillText('the final (s 4.6): double crescent, aurora', 780, 740); c.fillText('floor burst / air burst', 150, 300); c.fillText('glitter', 590, 230); c.fillText('edge streaks', 1060, 420); }
      return out; }, [spec, opt, TIER]);
    await page.screenshot({ path: path.join(OUT, 'studio-' + name + (DPR > 1 ? '-dpr' + DPR : '') + '.png') }); await page.evaluate(() => { document.querySelectorAll('canvas[style*="99999"]').forEach(e => e.remove()); }); console.log(name, JSON.stringify(r));
  };
  // the performance's key poses (game seconds of the Celestial cast; TR0 the first release, LAST the final's, LEAVE the departure)
  const KEYS = [['0.45', 'arrival: the glide'], ['0.82', 'banking through the turn'], ['1.22', 'the flare: braking'], ['TR0-0.2', 'anticipation: lift, open'], ['TR0-0.06', 'power stroke'], ['TR0', 'the release (fastest)'],
    ['TR0+0.14', 'follow-through: dip, recoil'], ['TR0+0.34', 'slower upstroke, folded'], ['W1+0.5', 'final wind-up: the widest'], ['LAST', 'the final release'], ['LEAVE+0.45', 'departure: banking climb'], ['LEAVE+1.05', 'dissolving into wind']];
  const grid = (o) => KEYS.map(([ct, label], i) => Object.assign({ ct, label, x: 110 + (i % 4) * 300, y: 120 + Math.floor(i / 4) * 240, T: o.T, ly: 105, lw: 110 }, o));
  await sheet('perf-side', grid({ side: true, A: 0, T: 30, zrel: true }), { title: 'The performance, level side view (aim east: the eagle faces right)' });
  await sheet('perf-game', grid({ A: -Math.PI / 2, T: 28 }), { title: 'The performance, the game\'s camera (aim up the screen)' });
  // the downstroke up close, side view: the shoulders lead, the elbows, wrists and primaries follow, the outer feathers flexing under the load
  await sheet('stroke', [['TR1-0.11', 'downstroke begins'], ['TR1-0.055', 'shoulders driving'], ['TR1', 'release: fastest'], ['TR1+0.06', 'primaries trailing, bent up'], ['TR1+0.12', 'bottom'], ['TR1+0.24', 'follow-through, upstroke']].map(([ct, label], i) => ({ ct, label, side: true, A: 0, T: 52, x: 200 + (i % 3) * 400, y: 200 + Math.floor(i / 3) * 360, ly: 150, lw: 90 })), { title: 'One wingbeat, side view (overlapping motion)' });
  await sheet('turn', [
    { x: 230, y: 230, yaw: 0, wing: 'rest', label: 'side (facing east), wings spread', T: 46 }, { x: 800, y: 230, yaw: -Math.PI / 2, wing: 'rest', label: 'from behind (facing north)', T: 46, pitch: 0.2 },
    { x: 230, y: 560, yaw: Math.PI / 2, wing: 'rest', label: 'toward the camera', T: 46, pitch: 0.25, hp: -0.2 }, { x: 800, y: 560, yaw: 0.2, wing: 'glide', label: 'level side view: gliding, legs tucked', T: 46, tf: 0.4, side: true, leg: -1.1, grip: 1 } ]);
  await sheet('close', [
    { x: 330, y: 380, yaw: 0.35, wing: 'rest', label: 'head and chest (the face through the glow)', T: 210, pitch: 0.4, hp: -0.4, ly: 340, glow: 1.6, glow2: 0.5 }, { x: 900, y: 300, yaw: -Math.PI / 2 - 0.25, wing: 'flare', label: 'feather groups: thickness, layers, undersides', T: 80, pitch: 0.15, roll: 0.45 } ]);
  await sheet('dissolve', [
    { x: 230, y: 330, yaw: -Math.PI / 2, wing: 'top', label: 'ordered dissolve 0.3', T: 40, pitch: 0.7, spill: 0.3, spillO: true }, { x: 600, y: 330, yaw: -Math.PI / 2, wing: 'top', label: 'ordered dissolve 0.6', T: 40, pitch: 0.7, spill: 0.6, spillO: true },
    { x: 980, y: 330, yaw: -Math.PI / 2, wing: 'rest', label: 'painted 2D fallback', T: 40, d2: true, pitch: 0.4 } ]);
  await sheet('fx', [{ x: 300, y: 200, yaw: -Math.PI / 2, wing: 'bottom', label: 'waves N, S, E, the final; ring; feathers, pebbles, leaves; ribbons 375 / 384; vortex 385', T: 30, pitch: 0.5, ly: 150 }], { fx: true });
  await sheet('waves', [], { waves: { A: -Math.PI / 2 }, title: 'v456: a wave and the final up close (aim up the screen, as the game\'s camera sees them)' });   // (v456 GE3)
  await sheet('waves-side', [], { waves: { A: 0.0 }, title: 'v456: the same, aim east (the crescents seen from the side)' });
  console.log('errors', JSON.stringify(errors.slice(0, 6))); await browser.close();
})();
