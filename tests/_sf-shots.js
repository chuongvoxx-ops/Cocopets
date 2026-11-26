// v450 SF, v452 SF2 (the roam, climb, plunge and burst; default OUT shots/v452-SF2; the game's own hit-stop at the blast holds the move's clock ~0.3 s, so the burst's stills run to 10.2): Snake Flame in game, phase by phase (GLM + FGFX forced on the software rasteriser unless GL=0): a dungeon floor, monsters held
// round the aim, the pet beside it; one still per phase into shots/v450-SF/game-<dpr>x-evo<k>-<phase>.png (the game drawn by its own loop,
// stepped by hand). usage: HTML=<test html> node tests/_sf-shots.js   env: DPR (1), EVOS (1,4,7), PH (comma list of seconds from the cast), GL (1), LOW (1: Fewer effects)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const GL = process.env.GL !== '0', DPR = +(process.env.DPR || 1), OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v452-SF2'); fs.mkdirSync(OUT, { recursive: true });
  const EVOS = (process.env.EVOS || '1,4,7').split(',').map(Number), PH = (process.env.PH || '0.35,1.0,2.6,4.0,5.4,6.55,7.05,7.55,7.82,7.95,8.3,8.6,9.0,9.6,10.2').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/Snake Flame|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  page.setDefaultTimeout(1800000);
  await page.addInitScript(o => { if (o.gl) { window.__SF_GL = 1; window.__NG_GL = 1; if (o.hq) window.__SF_GLHQ = 1; } }, { gl: GL, hq: process.env.HQ !== '0' });
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  await page.evaluate(low => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.st.devMoves = true; if (low) P.st.lowFx = true; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); }, process.env.LOW === '1');
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000, polling: 500 }); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000 }); await page.waitForTimeout(300); await page.evaluate(() => { window.__pp.arc.paused = true; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const PRE = `const P = window.__pp, U = P.arc.game, D = U._dbg, me = D.me, g = D.g;
    const step = (secs, dt) => { dt = dt || 1 / 60; let t = 0; while (t < secs - 1e-9) { window.__hold && window.__hold(); U.update(dt); t += dt; } return t; };
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const info = await ev(`for (let k = 0; k < 30; k++) U.update(1 / 60); g.intro = 0; g.bossIntro = 0; D.banners.length = 0;
    let best = null, bs = -1; for (let k = 0; k < 3000; k++) { const sx = Math.floor(me.x + (Math.random() - 0.5) * 80) + 0.5, sy = Math.floor(me.y + (Math.random() - 0.5) * 80) + 0.5; if (!W(sx, sy)) continue; let n = 0; for (let dx = -5; dx <= 5; dx++) for (let dy = -5; dy <= 5; dy++) if (dx * dx + dy * dy <= 25 && W(sx + dx, sy + dy)) n++; if (n > bs) { bs = n; best = { x: sx, y: sy }; } }
    window.__T = best; me.x = best.x - 0.5; me.y = best.y + 2.4; if (!W(me.x, me.y)) { me.x = best.x; me.y = best.y + 1; } me.face = 1;
    const L = D.mons.filter(m => !m.dead && !m.boss && !m.fiend && !m.fobj).slice(0, 14);
    L.forEach((m, i) => { let x = best.x, y = best.y; for (let j = 0; j < 60; j++) { const a = i * 2.2 + j * 0.41, r = 1.2 + (i % 5) * 0.75 + j * 0.02, qx = best.x + Math.cos(a) * r, qy = best.y + Math.sin(a) * r; if (W(qx, qy) && Math.hypot(qx - me.x, qy - me.y) > 1.2) { x = qx; y = qy; break; } } m.__px = [x, y]; Object.assign(m, { x, y, hp: 1e9, maxhp: 1e9, aggro: true }); });
    window.__hold = () => { me.hp = D.ST.hp; me.mp = 999; for (const m of D.mons) { m.atkCd = 99; m.cd = 99; m.spd = 0; if (m.__px) { m.x = m.__px[0]; m.y = m.__px[1]; m.kbx = m.kby = 0; } } if (D.eshots) D.eshots.length = 0; D.banners.length = 0; };
    D.SKIP && (D.SKIP.fog = true); return { at: best, open: bs, mons: D.mons.filter(m => !m.dead).length };`);
  console.log('setup', JSON.stringify(info));
  const freeze = on => page.evaluate(on => { if (on) { if (window.__raf0) return; window.__rafQ = []; window.__raf0 = window.requestAnimationFrame; window.requestAnimationFrame = cb => { window.__rafQ.push(cb); return 0; }; }
    else if (window.__raf0) { window.requestAnimationFrame = window.__raf0; window.__raf0 = null; const q = window.__rafQ; window.__rafQ = []; for (const cb of q) window.requestAnimationFrame(cb); } }, on);
  const shot = async name => { await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(r))))); await freeze(true);
    try { await page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 900000 }); } finally { await freeze(false); } };
  for (const evo of EVOS) {
    await ev(`window.__hold(); const T = window.__T; me.castT = me.castM = 0.5; me.castUlt = true; D.ELEM.ult('snakeflame', { a: 0, base: 50, E: { color: '#FF7A2E' }, el: 'fire', e8: 'fire', evo: arg, tx: T.x, ty: T.y, A: {}, up: arg >= 7 }); window.__t0 = g.t; return 1;`, evo);
    let tNow = 0;
    for (const ph of PH) { await ev(`step(arg);`, ph - tNow); tNow = ph; const t0 = Date.now(); await shot(`game-${DPR}x-evo${evo}-${ph.toFixed(2)}${process.env.LOW === '1' ? '-low' : ''}${GL ? '' : '-2d'}`);
      const st = await ev(`const G = window.SNAKEFLAME_GL; return { gl: G.usable(), items: G.STATS.items, W: G.STATS.W, H: G.STATS.H, fx: D.ELEM.fx.length };`); console.log(`evo ${evo} t ${ph}`, JSON.stringify(st), ((Date.now() - t0) / 1000).toFixed(1) + ' s'); }
    await ev(`step(3);`);
  }
  console.log('errors', JSON.stringify(errors.slice(0, 5))); await browser.close();
})();
