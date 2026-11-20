// (v435 SM) Samael studio: renders the GPU model alone (turnaround, forms, poses, strips, parts) on a dark crimson backdrop.
// usage: HTML=test-sm.html node tests/_sm-studio.js [out.png] [mode] [dpr]
//   mode: turn (front / side / back / 3-4 at the last form, the three forms), poses (each power's key pose, the ultimate's, the dissolve,
//   the assembly), walk | gallop | turnstrip (strips through a cycle with the motion's planted feet), parts (rocks, spires, crescents,
//   rings), light (the poses with the painter's body light), one (a single big view: YAW env), low (the low profile)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT = process.argv[2] || 'shots/v435-SM/studio.png', MODE = process.argv[3] || 'turn', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const W = 1500, H = 900;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 900)); });
  await page.addInitScript(kt => { window.__KT = kt; }, process.env.KT || '3');
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const r = await page.evaluate(({ MODE, W, H, DPR, YAW }) => {
    window.__SM_GL = 1; window.__SM_GLHQ = 1; window.__NG_GL = 1; const SG = window.SAMAEL_GL; if (MODE === 'low') { window.__pp.quickStart('Bot'); window.__pp.st.lowFx = true; }
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#120712'); g.addColorStop(0.55, '#2A0E16'); g.addColorStop(1, '#0C0406'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const t0 = performance.now(); const ok = SG.ensure(); const tb = performance.now() - t0;
    const lab = (x, y, s) => { c.fillStyle = '#F2C9A0'; c.font = '600 14px serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
    const cells = [], P = (k, o) => SG.idlePose(k, 0.7, o), KT = +(window.__KT || 3);
    if (MODE === 'turn' || MODE === 'low') {
      [[Math.PI / 2, 'FRONT'], [0, 'SIDE'], [-Math.PI / 2, 'BACK'], [0.62, '3/4']].forEach(([yaw, n], i) => cells.push({ x: 190 + i * 370, y: 430, K: 14, k: KT, P: P(KT, { yaw }), n }));
      [1, 2, 3].forEach((k, i) => cells.push({ x: 260 + i * 470, y: 870, K: 20 * [0, 0.85, 0.92, 1][k], k, P: P(k, { yaw: 0.62 }), n: ['', 'THE FIRST CATACLYSM (BASE)', 'THE FIERY HERALD (L4)', 'THE STARFORGED RAM (L7)'][k] }));
    } else if (MODE === 'views') {   // (v435 SM) front / side / back, each in its own panel, for the concept compare
      [[Math.PI / 2, 'FRONT', 28, 190, 0, 380], [0, 'SIDE', 24, 420, 380, 740], [-Math.PI / 2, 'BACK', 28, 190, 1120, 380]].forEach(([yaw, n, K, xc, x0, w], i) => {
        const oc = document.createElement('canvas'); oc.width = w * DPR; oc.height = 880 * DPR; const c2 = oc.getContext('2d'); c2.scale(DPR, DPR);
        const Pp = P(KT, { yaw }), o2 = SG.draw(c2, { X: xc, Y: 840, K, P: Pp, k: KT }); if (o2) SG.coreLight(c2, o2, Pp, 1); if (o2) (window.__vres = window.__vres || []).push([n, o2.bb.map(Math.round), o2.top.map(Math.round), o2.ground && o2.ground.map ? o2.ground.map(Math.round) : o2.ground, o2.unit]);
        c.drawImage(oc, x0, 0, w, 880); lab(x0 + w / 2, 892, n); });
    } else if (MODE === 'close') {   // (v435 SM) head and horn close-ups: each view drawn once to find the head, then redrawn centred on it
      [[0.0, 'HORNS (SIDE)', 0.1], [Math.PI / 2 - 0.25, 'HEAD (FRONT)', 0.0]].forEach(([yaw, n, dy], i) => {
        const oc = document.createElement('canvas'); oc.width = 740 * DPR; oc.height = 880 * DPR; const c2 = oc.getContext('2d'); c2.scale(DPR, DPR);
        const Pp = P(KT, { yaw }), K = 78, o1 = SG.draw(c2, { X: 370, Y: 1600, K, P: Pp, k: KT }); const hx = o1 && o1.head ? o1.head[0] : 370, hy = o1 && o1.head ? o1.head[1] : 400;
        c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, oc.width, oc.height); c2.scale(DPR, DPR);
        const o2 = SG.draw(c2, { X: 370 + (370 - hx), Y: 1600 + (440 - hy) + dy * 400, K, P: Pp, k: KT }); if (o2) SG.coreLight(c2, o2, Pp, 1);
        c.drawImage(oc, 10 + i * 750, 0, 740, 880); lab(10 + i * 750 + 370, 890, n); });
    } else if (MODE === 'one') {
      const yw = +(YAW || 0.62); cells.push({ x: 600, y: 850, K: 50, k: 3, P: P(3, { yaw: yw }), n: 'k3' });
    } else if (MODE === 'poses' || MODE === 'light') {
      const L = [
        ['IDLE', P(3, { yaw: 0.4 })],
        ['HELLBREAK CHARGE', P(3, { yaw: 0.4, ph: 1.3, mv: 1, gal: 1, head: 0.85, crouch: 0.35, hornFwd: 1, hornSpin: 6, hornHeat: 1, core: 1.8, glow: 0.3 })],
        ['HORNS OF PERDITION', P(3, { yaw: 0.4, horn: 1, hornSpin: 8, hornHeat: 0.6, look: 0.4, spread: 0.45, crouch: 0.35, core: 1.6 })],
        ['FURNACE OVERDRIVE', P(3, { yaw: 0.4, coreOpen: 1, core: 2.6, coreBig: 0.25, dorsal: 0.85, vent: 0.5, crouch: 0.4, jaw: 0.6, glow: 0.5 })],
        ['FIRST IMPACT (DRILL)', P(3, { yaw: 0.4, air: 1, drill: 1, hornFwd: 1, hornHeat: 1, core: 2, pitch: 0.35, head: 0.4 })],
        ['CATACLYSM STATE', P(3, { yaw: 0.4, heat: 1, vent: 1, horn: 0.35, core: 2.4, dorsal: 0.7, glow: 0.5 })],
        ['WRATH: THE SEAL BROKEN', P(3, { yaw: 0.4, crown: 1, vent: 1, dorsal: 1, celest: 1, coreOpen: 0.9, coreBig: 0.5, heat: 1, core: 3, jaw: 1, head: -0.6, glow: 0.8 })],
        ['WRATH: THE METEOR', P(3, { yaw: 0.4, air: 1, meteor: 1, shell: 1, drill: 1, heat: 1, hornHeat: 1, core: 3, pitch: 0.4 })],
        ['DISSOLVE (REACTOR LAST)', P(3, { yaw: 0.4, dis: 0.6 })],
        ['ASSEMBLY (ROUND THE REACTOR)', P(3, { yaw: 0.4, asm: 0.45, core: 2.5 })],
      ];
      L.forEach(([n, Pp], i) => cells.push({ x: 160 + (i % 5) * 295, y: i < 5 ? 410 : 860, K: 10.5, k: 3, P: Pp, n }));
    } else if (MODE === 'walk' || MODE === 'gallop' || MODE === 'turnstrip') {
      // a strip through a cycle, the motion stepped on an instance (planted feet), 8 frames
      const inst = {}, gal = MODE === 'gallop' ? 1 : 0, mv = MODE === 'turnstrip' ? 0.2 : 1, rate = MODE === 'gallop' ? 2.6 : 1.3;
      for (let f = -30; f < 8; f++) { const tt = 0.7 + (f + 30) / 30, Pp = P(3, { t: tt, yaw: MODE === 'turnstrip' ? 0.2 + (f + 30) * 0.06 : 0.0, ph: (f + 30) / 30 * rate * Math.PI * 2 * (MODE === 'turnstrip' ? 0.15 : 1), mv, gal, gaitK: gal ? 1.7 : 1, head: gal ? 0.8 : 0, hornFwd: gal ? 1 : 0 });
        if (f >= 0) cells.push({ x: 110 + f * 180, y: 560, K: 8, k: 3, P: Pp, n: 'f' + f, inst }); else SG.motion(inst, Pp); }
    }
    const res = [];
    for (const C of cells) { const t1 = performance.now(); const o = SG.draw(c, { X: C.x, Y: C.y, K: C.K, P: C.P, k: C.k, inst: C.inst }); res.push([C.n, !!o, Math.round(performance.now() - t1), o && o.top, o && o.ground, C.K]); lab(C.x, C.y + 24, C.n); if (o) { if (MODE === 'light' && window.__pp.DunAnima) {} SG.coreLight(c, o, C.P, 1); } }
    if (MODE === 'parts') {
      const list = []; for (let i = 0; i < 4; i++) list.push({ m: 'spire', X: 200 + i * 220, Y: 520, s: 60, h: 0.25 + i * 0.25, yaw: i, gl: 0.8 });
      for (let i = 0; i < 4; i++) list.push({ m: 'rock', X: 200 + i * 120, Y: 760, s: 30, yaw: i, tilt: i * 0.7, gl: 1, kind: 1 });
      [0, 0.6, -0.6].forEach((tl, i) => list.push({ m: 'cres', X: 1000 + i * 160, Y: 300, s: 70, yaw: -0.3, tilt: tl, a: 0.95, gl: 1.2 }));
      list.push({ m: 'lring', X: 1100, Y: 650, s: 120, tilt: 1.1, gl: 1 }); list.push({ m: 'frag', X: 800, Y: 760, s: 40, yaw: 1 });
      res.push(['parts', SG.drawParts(c, list, { res: 1 })]);
    }
    return { ok, tb: Math.round(tb), nv: SG.nv, res: res.concat(window.__vres || []), stats: SG.STATS, gpu: SG.gpuCount() };
  }, { MODE, W, H, DPR, YAW: process.env.YAW });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(__dirname, '..', OUT) });
  console.log('errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
