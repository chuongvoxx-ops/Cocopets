// (v436 AS) Asmodeus studio: renders the GPU model alone (turnaround, forms, poses, strips) on a dark violet-crimson backdrop.
// usage: HTML=<test html> node tests/_as-studio.js [out.png] [mode] [dpr]
//   mode: turn (front / side / back / 3-4 at KT, then the three forms), views (front / side / back, large), close (the head, the Crucible),
//   poses (each power's key pose, the ultimate's, the dissolve, the assembly, the decoy shell), walk | run | sidestep (strips through a
//   cycle with the motion's planted feet), tails (each tail's strike and the tail states), parts (spikes, shards, wires, rings, the crystal),
//   low (the low profile)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v436-AS/studio.png', MODE = process.argv[3] || 'turn', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const W = 1500, H = 900;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 1500)); });
  await page.addInitScript(([kt, hide]) => { window.__KT = kt; window.__HIDE = hide ? hide.split(',') : null; }, [process.env.KT || '3', process.env.HIDE || '']);
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-as.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const r = await page.evaluate(({ MODE, W, H, DPR, YAW }) => {
    window.__AS_GL = 1; window.__AS_GLHQ = 1; window.__NG_GL = 1; const AG = window.ASMODEUS_GL; if (MODE === 'low') { window.__pp.quickStart('Bot'); window.__pp.st.lowFx = true; }
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120a1c'); g.addColorStop(0.55, '#2a0c22'); g.addColorStop(1, '#0c0408'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const t0 = performance.now(); const ok = AG.ensure(); const tb = performance.now() - t0;
    const lab = (x, y, s) => { c.fillStyle = '#F2C9A0'; c.font = '600 14px serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
    const cells = [], P = (k, o) => AG.idlePose(k, 0.7, o), KT = +(window.__KT || 3), FR = Math.PI / 2;
    if (MODE === 'turn' || MODE === 'low') {
      [[FR, 'FRONT'], [0, 'SIDE'], [-FR, 'BACK'], [FR - 0.6, '3/4']].forEach(([yaw, n], i) => cells.push({ x: 190 + i * 370, y: 440, K: 13, k: KT, P: P(KT, { yaw }), n }));
      [1, 2, 3].forEach((k, i) => cells.push({ x: 260 + i * 470, y: 880, K: 15 * [0, 0.9, 0.95, 1][k], k, P: P(k, { yaw: FR - 0.35 }), n: ['', 'THE VEILED PREDATOR (BASE)', 'THE CRIMSON SOVEREIGN (L4)', 'THE SEVENTH SIN (L7)'][k] }));
    } else if (MODE === 'views') {
      [[FR, 'FRONT', 12, 380], [0, 'SIDE', 12, 380], [-FR, 'BACK', 12, 380], [FR - 0.55, '3/4', 12, 360]].forEach(([yaw, n, K, w], i) => {
        const oc = document.createElement('canvas'); oc.width = w * DPR; oc.height = 880 * DPR; const c2 = oc.getContext('2d'); c2.scale(DPR, DPR);
        const Pp = P(KT, { yaw }), o2 = AG.draw(c2, { X: w / 2, Y: 830, K, P: Pp, k: KT }); if (o2) AG.coreLight(c2, o2, Pp, 1);
        c.drawImage(oc, i * 375, 0, w, 880); lab(i * 375 + w / 2, 892, n); });
    } else if (MODE === 'close') {
      [[FR - 0.2, 'HEAD (FRONT)', 'head', 95], [0.35, 'HEAD (SIDE)', 'head', 95], [FR - 0.35, 'CRUCIBLE', 'core', 120]].forEach(([yaw, n, what, K], i) => {
        const oc = document.createElement('canvas'); oc.width = 500 * DPR; oc.height = 880 * DPR; const c2 = oc.getContext('2d'); c2.scale(DPR, DPR);
        const Pp = P(KT, { yaw }), o1 = AG.draw(c2, { X: 250, Y: 2400, K, P: Pp, k: KT }); const hx = o1 ? o1[what][0] : 250, hy = o1 ? o1[what][1] : 400;
        c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, oc.width, oc.height); c2.scale(DPR, DPR);
        const o2 = AG.draw(c2, { X: 250 + (250 - hx), Y: 2400 + (440 - hy), K, P: Pp, k: KT, hide: window.__HIDE }); if (o2) AG.coreLight(c2, o2, Pp, 1);
        c.drawImage(oc, i * 500, 0, 500, 880); lab(i * 500 + 250, 890, n); });
    } else if (MODE === 'one') {
      const yw = +(YAW || FR - 0.3); cells.push({ x: 750, y: 860, K: 38, k: KT, P: P(KT, { yaw: yw }), n: 'k' + KT });
    } else if (MODE === 'poses') {
      const y = FR - 0.35, L = [
        ['IDLE', P(3, { yaw: y })],
        ['SEVENFOLD PERDITION', P(3, { yaw: y, crouch: 0.3, spread: 0.4, raise: 0.6, seq: 7, flow: 1, strikes: [{ i: 2, A: [7, -2, 1], e: 1 }, { i: 5, A: [6, 3, 1.5], e: 0.6 }] })],
        ['CRIMSON LABYRINTH', P(3, { yaw: y, arm: 1, crown: 0.6, rear: 0.6, flow: 1, jaw: 0.4 })],
        ['ECLIPSE MOLT: CRACKS', P(3, { yaw: y, cage: 1, crack: 1, core: 2.4 })],
        ['SCARLET RUPTURE', P(3, { yaw: y, conv: 1, rupt: 1, rear: 0.5, arm: 0.8, core: 2.5, flow: 1, seq: 7 })],
        ['DEFENSIVE CAGE', P(3, { yaw: y, cage: 1, crouch: 0.5 })],
        ['SIN: THE CATHEDRAL', P(3, { yaw: y, cath: 1, sep: 0.6, rear: 0.8, open: 1, seq: 7, core: 3 })],
        ['SIN: THE FORBIDDEN BLOOM', P(3, { yaw: y, cath: 1, heartUp: 1, bloom: 1, open: 1, core: 3, jaw: 1 })],
        ['DISSOLVE (LEGS FIRST)', P(3, { yaw: y, dis: 0.45 })],
        ['ENTRANCE: COCOON / UNFOLD', P(3, { yaw: y, coc: 1.6, unf: 2.5, asm: 0.5, core: 1.5 })],
      ];
      L.forEach(([n, Pp], i) => cells.push({ x: 150 + (i % 5) * 300, y: i < 5 ? 430 : 870, K: 8.6, k: 3, P: Pp, n }));
    } else if (MODE === 'shell') {
      cells.push({ x: 400, y: 860, K: 20, k: 3, P: P(3, { yaw: FR - 0.3 }), n: 'REAL' }); cells.push({ x: 1100, y: 860, K: 20, k: 3, P: P(3, { yaw: FR - 0.3, shell: 1, crack: 0.6 }), n: 'DECOY SHELL', shell: 1 });
    } else if (MODE === 'walk' || MODE === 'run' || MODE === 'sidestep') {
      const inst = {}, run = MODE === 'run' ? 1 : 0, rate = MODE === 'run' ? 2.2 : 1.1;
      for (let f = -30; f < 8; f++) { const tt = 0.7 + (f + 30) / 30, Pp = P(3, { t: tt, yaw: FR - 0.3, mvA: MODE === 'sidestep' ? 0 : FR - 0.3, ph: (f + 30) / 30 * rate * Math.PI * 2, mv: 1, run, crouch: run ? 0.6 : 0 });
        if (f >= 0) cells.push({ x: 110 + f * 180, y: 600, K: 7, k: 3, P: Pp, n: 'f' + f, inst }); else AG.motion(inst, Pp); }
    } else if (MODE === 'tails') {
      for (let j = 0; j < 7; j++) cells.push({ x: 110 + j * 212, y: 430, K: 7.5, k: 3, P: P(3, { yaw: FR - 0.3, strikes: [{ i: j, A: [6, (j - 3) * 1.5, 0.5], e: 1 }], seq: j + 1, flow: 1 }), n: 'STRIKE ' + (j + 1) });
      [['CROWN', { crown: 1 }], ['RAISE', { raise: 1 }], ['CAGE', { cage: 1 }], ['CONVERGE', { conv: 1, rupt: 0.8 }], ['CATHEDRAL', { cath: 1, sep: 0.5 }], ['COILED', { unf: 0 }], ['HALF UNFOLD', { unf: 3.5 }]].forEach(([n, o], j) => cells.push({ x: 110 + j * 212, y: 880, K: 6.5, k: 3, P: P(3, Object.assign({ yaw: FR - 0.3 }, o)), n }));
    }
    if (MODE === 'gait') {   // the gait in numbers: over two seconds of walking (and of running, and a standstill after), how many feet are up at once, which lift together, how far a planted foot slides
      const out = {}; for (const [nm, run, rate] of [['walk', 0, 1.1], ['run', 1, 2.2]]) { const inst = {}; let maxUp = 0, minUp = 9, pairs = {}, slide = 0, steps = 0; const prev = [];
        for (let f = 0; f < 150; f++) { const Pp = P(3, { t: f / 60, yaw: FR - 0.3, ph: f / 60 * rate * Math.PI * 2, mv: 1, run }); const M = AG.motion(inst, Pp); if (!M || f < 30) continue; const up = M.F.map(F2 => F2.sw ? 1 : 0), n = up.reduce((a2, b2) => a2 + b2, 0); maxUp = Math.max(maxUp, n); minUp = Math.min(minUp, n); pairs[up.join('')] = 1; steps += M.steps.length;
          M.F.forEach((F2, i) => { if (!F2.sw && prev[i] && !prev[i].sw) slide = Math.max(slide, Math.hypot(F2.gx - prev[i].gx, F2.gy - prev[i].gy)); prev[i] = { sw: F2.sw, gx: F2.gx, gy: F2.gy }; }); }
        out[nm] = { maxUp, minUp, patterns: Object.keys(pairs).length, steps, plantedSlide: +slide.toFixed(4) }; }
      { const inst = {}; let idleSteps = 0; for (let f = 0; f < 240; f++) { const ph = Math.min(f, 60) / 60 * 1.1 * Math.PI * 2; const M = AG.motion(inst, P(3, { t: f / 60, yaw: FR - 0.3 + (f > 60 ? 0.6 : 0), ph, mv: f < 60 ? 1 : 0 })); if (f > 60) idleSteps += M.steps.filter(s2 => s2.idle).length; } out.settle = { idleSteps }; }
      return { gait: out };
    }
    const res = [];
    for (const C of cells) { const t1 = performance.now(); const o = AG.draw(c, { X: C.x, Y: C.y, K: C.K, P: C.P, k: C.k, inst: C.inst, shell: C.shell }); res.push([C.n, !!o, Math.round(performance.now() - t1)]); lab(C.x, C.y + 18, C.n); if (o && !C.shell) AG.coreLight(c, o, C.P, 1); }
    if (MODE === 'parts') {
      const list = []; for (let i = 0; i < 4; i++) list.push({ m: 'spike', X: 200 + i * 220, Y: 520, s: 50, h: 0.25 + i * 0.25, yaw: i, gl: 0.8 });
      for (let i = 0; i < 4; i++) list.push({ m: 'frag', X: 200 + i * 120, Y: 760, s: 30, yaw: i, tilt: i * 0.7, gl: 1 });
      list.push({ m: 'wire', X: 900, Y: 300, X2: 1300, Y2: 420, s: 4, gl: 1 }); list.push({ m: 'wire', X: 900, Y: 450, X2: 1200, Y2: 300, s: 3, gl: 1 });
      list.push({ m: 'bring', X: 1100, Y: 650, s: 120, tilt: 1.1, gl: 1 }); list.push({ m: 'rcrys', X: 700, Y: 300, s: 60, yaw: 1, gl: 1.5, g2: 1 }); list.push({ m: 'shard', X: 800, Y: 760, s: 40, yaw: 1 });
      res.push(['parts', AG.drawParts(c, list, { res: 1 })]);
    }
    return { ok, tb: Math.round(tb), nv: AG.nv, res, stats: AG.STATS, gpu: AG.gpuCount(), glm: window.GLM ? null : null };
  }, { MODE, W, H, DPR, YAW: process.env.YAW });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(process.cwd(), OUT) });
  console.log('errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
