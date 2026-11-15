// Ifrit (Rift 0, 20zz8) in motion: contact strips of the real game frame cropped round him, a frame every `every`
// seconds of game time: the rise from the throne, the walk, the turn, the idle, each attack's wind-up / strike /
// recovery, the phase changes, a stagger, Hellfire. The 2D fallback by default (fast); GL=1 draws the GPU model at the
// software rasteriser's reduced resolution (slow). Feet are marked on the floor (planted: a white tick; lifted: none)
// so sliding shows.  usage: HTML=test-calI.html node tests/_cal-i-motion.js   env: ONLY (names), GL=1, SUF
// -> shots/cal-i-motion-<name><SUF>.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__IFRIT_GL = 0; window.__NG_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calI.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots');
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Ember'); P.st.energy = 100; P.st.retro = false; const Rf = P.RIFT_BY_ID.caldera; if (!Rf.ease) Rf.ease = 0.01; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('caldera', Rf.stages.findIndex(s => s.boss === 'califrit')); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; window.__H = { P, G: P.arc.game, D: P.arc.game._dbg }; const { G, D } = window.__H; for (let k = 0; k < 600 && !D.g.boss; k++) G.update(1 / 60); });
  const PRE = `const { P, G, D } = window.__H, g = D.g, me = D.me, FX = D.FD.FX, S = D.FD.S, M = FX.mem, C = FX.C, I = P.FIEND_DEFS.califrit.IFRIT, b = g.boss;
    const step = (s, f) => { const t1 = g.t + s; let k = 0; while (g.t < t1 && k++ < 100000) { me.hp = D.ST.hp; me.inv = 0.2; G.update(1 / 60); if (f && f()) return true; } return false; };
    const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.push = null; };
    const force = kind => { I.test.endAct(FX, b); b.stunT = 0; b.act = 'fight'; I.test.begin(FX, b, kind); };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  // one strip: run setup, then n frames `every` s apart (game time), each the game drawn and cropped round him
  async function strip(name, setup, n, every, o) { o = o || {}; if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) return; const t0 = Date.now();
    await ev(setup);
    const url = await page.evaluate(async ([pre, n, every, gl, o]) => { const f = new Function('return (() => { ' + pre + ' return { P, G, D, g, me, FX, S, M, C, b, step }; })()')(); const { G, g, FX, M, b, step } = f;
      const cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), k = cv.width / cv.clientWidth, CW = o.w || 230, CH = o.h || 300, cols = Math.min(n, o.cols || 6), rows = Math.ceil(n / cols);
      const st = document.createElement('canvas'); st.width = cols * CW; st.height = rows * CH; const sc = st.getContext('2d'); sc.fillStyle = '#000'; sc.fillRect(0, 0, st.width, st.height);
      let t0 = g.t;
      const cx = b.x, cy = b.y; for (let i = 0; i < n; i++) { if (i) step(every); const cam = f.D.cam; cam.x = o.follow === false ? cx : b.x; cam.y = (o.follow === false ? cy : b.y) - 6; cam.sm = 0; f.D.banners.length = 0; window.__IFRIT_GL = gl; window.__IFRIT_GLHQ = gl; G.draw(c); window.__IFRIT_GL = 0; window.__IFRIT_GLHQ = 0;
        const T = FX.Tz(), X = FX.sx(b.x), Y = FX.sy(b.y) - T * (o.lift == null ? 3.2 : o.lift);
        // the feet's floor marks (where the rig's feet are planted)
        const L = M.loco; if (L && L.feet) { c.save(); for (const ft of [L.feet.L, L.feet.R]) { const fx = FX.sx(ft.x), fy = FX.sy(ft.y); c.strokeStyle = ft.t >= 0 ? 'rgba(255,80,80,.9)' : 'rgba(255,255,255,.95)'; c.lineWidth = 2; c.beginPath(); c.moveTo(fx - 5, fy); c.lineTo(fx + 5, fy); c.moveTo(fx, fy - 5); c.lineTo(fx, fy + 5); c.stroke(); } c.restore(); }
        sc.drawImage(cv, (X - CW * (o.zoom || 1) / 2) * k, (Y - CH * (o.zoom || 1) / 2) * k, CW * (o.zoom || 1) * k, CH * (o.zoom || 1) * k, (i % cols) * CW, Math.floor(i / cols) * CH, CW, CH);
        sc.fillStyle = '#FFE37A'; sc.font = '700 12px sans-serif'; sc.fillText(`${(g.t - t0).toFixed(2)}s ${M.A ? M.A.kind + ':' + M.A.phase : b.act}${b.stunT > 0 ? ' stun' : ''}`, (i % cols) * CW + 4, Math.floor(i / cols) * CH + 14);
        sc.strokeStyle = '#333'; sc.strokeRect((i % cols) * CW, Math.floor(i / cols) * CH, CW, CH); }
      return st.toDataURL('image/png'); }, [PRE, n, every, process.env.GL ? 1 : 0, o]);
    fs.writeFileSync(path.join(out, `cal-i-motion-${name}${process.env.SUF || ''}.png`), Buffer.from(url.split(',')[1], 'base64')); console.log(`strip ${name} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); }
  await strip('rise', `pin(C.x, C.y + 4);`, 18, 0.5, { zoom: 1.4, lift: 3.5 });
  await ev(`step(14, () => b.act === 'fight' && !M.A);`);
  await strip('walk', `I.test.endAct(FX, b); b.x = C.x - 4; b.y = C.y - 7; pin(C.x + 3, C.y + 9); M.idleT = 99;`, 18, 0.18, { zoom: 1.2 });
  await strip('turn', `I.test.endAct(FX, b); M.idleT = 99; step(1.5); pin(b.x + 0.5, b.y - 4.5);`, 18, 0.22, { zoom: 1.2 });
  await strip('idle', `I.test.endAct(FX, b); M.idleT = 99; pin(b.x + 1, b.y + 4.6); step(2);`, 18, 0.33, { zoom: 1.2 });
  await strip('fist', `pin(b.x + 1, b.y + 4.4); step(0.5); M.idleT = 99; force('fist');`, 24, 0.22, { zoom: 1.3 });
  await strip('breath', `step(4, () => !M.A); pin(b.x - 1, b.y + 5); M.idleT = 99; force('breath');`, 24, 0.22, { zoom: 1.4 });
  await strip('fault', `step(5, () => !M.A); pin(b.x + 1, b.y + 6); M.idleT = 99; force('fault');`, 18, 0.18, { zoom: 1.4 });
  await strip('p2', `step(5, () => !M.A); M.idleT = 99; pin(b.x + 1, b.y + 5); b.hp = b.maxhp * 0.69;`, 18, 0.18, { zoom: 1.3 });
  await strip('cleave', `step(4, () => !M.A && !(S.roarT > 0)); pin(b.x + 1, b.y + 4.4); M.idleT = 99; force('cleave');`, 24, 0.16, { zoom: 1.3 });
  await strip('rocks', `step(4, () => !M.A); pin(b.x + 1, b.y + 5); M.idleT = 99; force('rocks');`, 12, 0.2, { zoom: 1.3 });
  await strip('stagger', `step(4, () => !M.A); M.idleT = 99; const cr = M.crys.find(c => c.alive); if (cr && cr.obj) D.hitMon(cr.obj, cr.obj.hp + 1, { flat: true });`, 12, 0.2, { zoom: 1.3 });
  await strip('p3', `step(3, () => !(b.stunT > 0)); M.idleT = 99; b.hp = b.maxhp * 0.34;`, 18, 0.15, { zoom: 1.3 });
  await strip('walk3', `step(4, () => M.fracT > 1.6 && !(S.roarT > 0)); I.test.endAct(FX, b); M.hfT = 99; b.x = C.x - 4; b.y = C.y - 7; pin(C.x + 3, C.y + 9); M.idleT = 99;`, 18, 0.18, { zoom: 1.2 });
  await strip('hellfire', `I.test.endAct(FX, b); M.hfT = 0; M.idleT = 0; pin(b.x + 1, b.y + 6); step(3, () => M.A && M.A.kind === 'hellfire');`, 24, 0.75, { zoom: 1.3 });
  console.log('page errors', errors.length, errors.slice(0, 6));
  await browser.close();
})();
