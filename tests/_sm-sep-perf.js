// (v463 SM) the crowded floor: Rift 04 stage 0 (the Clockless Hall) with 40 more of the brood brought round the pet, in view. The game
// is stepped by hand (update + draw, 1/60 s), so the numbers are the JavaScript and canvas work of a frame on this machine:
//   draw ms (median / p90) with the crowd in view, and with it moved out of view (the difference: what the crowd costs),
//   GL passes and GL copies a frame (a draw from a WebGL canvas onto a 2D one), the brood's pictures held (MB), the loading time,
//   and after the stage closes: the pictures and the GPU buffers left (0 / 0).
// usage: HTML=<build> MODE=gl|2d DPR=1|3 node tests/_sm-sep-perf.js     (MODE gl forces the GPU route on the software rasteriser)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const MODE = process.env.MODE || 'gl', DPR = +(process.env.DPR || 1), N = +(process.env.N || 90), CROWD = +(process.env.CROWD || 40);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(([m, rounds]) => { if (rounds) window.__ROUNDS = rounds.split(','); window.__SB_GL = m === 'gl' ? 1 : 0; window.__SB_GLHQ = 1; window.__SP_OFF = 1;
    // GL canvases (made with a webgl context) and the copies from them onto 2D canvases; GL draw calls
    const GLC = new WeakSet(); window.__glc = { copies: 0, draws: 0 }; const g0 = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (k, o) { const x = g0.call(this, k, o); if (x && /webgl/.test(k)) GLC.add(this); return x; };
    const d0 = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (s) { if (s && GLC.has(s)) window.__glc.copies++; return d0.apply(this, arguments); };
    for (const P of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) if (P) { const e0 = P.prototype.drawElements; P.prototype.drawElements = function () { window.__glc.draws++; return e0.apply(this, arguments); }; } }, [MODE, process.env.ROUNDS || '']);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sm463.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 42; P.st.unlockAll = true; for (const id of ['belfry', 'garden', 'dunes']) P.riftState().seals[id] = 1; P.st.dun.best = 120; P.openMap(); P.dun.setMapTab('rift', true); const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  const t0 = Date.now();
  await page.evaluate(() => { const P = window.__pp; P.startRift('sepulchre', 0); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000 }); const loadS = (Date.now() - t0) / 1000;
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const r = await page.evaluate(async ([N, CROWD]) => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, c = document.getElementById('arcCanvas').getContext('2d'), MC = P.DunArt.monCache, TY = ['seceater', 'cornerpup', 'mourndisc'], SET = new Set(['seceater', 'cornerpup', 'mourndisc', 'tombram', 'tombeye', 'tombmole', 'tombmason', 'icecrystal']);
    const q = (a, f) => { const b = a.slice().sort((x, y) => x - y); return +b[Math.min(b.length - 1, Math.floor(b.length * f))].toFixed(2); };
    const memOf = () => { let px = 0, n = 0; for (const [k, s] of MC) { if (!SET.has(k.slice(0, k.indexOf('|'))) || !s || !s.cv) continue; px += s.cv.width * s.cv.height; n++; } return { n, MB: +(px * 4 / 1048576).toFixed(2) }; };
    // the crowd: in rings round the pet, inside the view
    const crowd = []; for (let i = 0; i < CROWD; i++) { const a = i / CROWD * 6.283 * 3.1, d = 1.6 + (i % 5) * 0.75, q = D.X.freeSpot(me.x + Math.cos(a) * d * 0.75, me.y + Math.sin(a) * d * 1.3, 0.4); if (!q) continue; const m = D.X.spawnMon(TY[i % 3], q.x, q.y, { aggro: true, pack: 900, rift: true }); crowd.push(m); }
    const step = n => { const ms = []; for (let i = 0; i < n; i++) { me.hp = D.ST.hp; me.mp = 999; for (const m of crowd) { m.hp = m.maxhp; } P.arc.game.update(1 / 60); const t1 = performance.now(); c.save(); P.arc.game.draw(c); c.restore(); ms.push(performance.now() - t1); } return ms; };
    const SB = window.SEP_BROOD, rounds = SB ? ((window.__ROUNDS || ['gl', '2d', 'gl', '2d'])) : ['before'], out = { rounds: [] };
    const TS = Math.round(Math.max(28, Math.min(64, Math.min(innerWidth / 9.6, innerHeight / 12.5))) * 1.15)   /* (20b layout) */, SKk = Math.min(P.arc.dpr || 1, 2);
    for (const rd of rounds) { const R = { route: rd };
      if (SB) { window.__SB_GL = rd === 'gl' ? 1 : 0; SB.release(); SB.bio = D.F.biome; }
      // the loading screen's work for this route (the stage's preload hook, run here in full: on this shared machine the real loading
      // screen's 10 s cap ends before it), then a second of play
      if (SB && rd === 'gl') { const t0 = performance.now(), jobs = SB.preload({ F: D.F, mons: D.mons.concat(crowd), reserve: D.g.reserve || [], T: TS, k: SKk, S: null, monPx: t => P.MON[t] ? P.MON[t].r * TS * SKk : 0 }); window.__SB_NOBUDGET = 1; for (const j of jobs) j(); window.__SB_NOBUDGET = 0; R.preload = { jobs: jobs.length, ms: Math.round(performance.now() - t0), baked: SB.stats.baked, mem: SB.mem() }; }
      const w0 = performance.now(); const wm = step(40); R.warmMs = Math.round(performance.now() - w0); R.warmMaxFrame = q(wm, 0.99);
      const G0 = Object.assign({}, window.__glc); const inView = step(N); const G1 = Object.assign({}, window.__glc);
      R.inViewNow = crowd.filter(m => !m.dead && Math.abs(m.x - D.cam.x) < 4.3 && Math.abs(m.y - D.cam.y) < 9).length;
      const saved = crowd.map(m => [m.x, m.y]); for (const m of crowd) { m.x += 60; m.y += 60; } const away = step(N); crowd.forEach((m, i) => { m.x = saved[i][0]; m.y = saved[i][1]; });
      R.drawMs = { inView: { med: q(inView, 0.5), p90: q(inView, 0.9), max: q(inView, 0.999) }, away: { med: q(away, 0.5), p90: q(away, 0.9) } };
      R.crowdMs = +(R.drawMs.inView.med - R.drawMs.away.med).toFixed(2);
      R.glPerFrame = { copies: +((G1.copies - G0.copies) / N).toFixed(2), draws: +((G1.draws - G0.draws) / N).toFixed(1) };
      R.mem = memOf(); if (SB) { const st = SB.stats; R.lazy = st.lazy; R.prov = st.prov; R.over = st.over; }
      out.rounds.push(R); }
    return Object.assign({ crowd: crowd.length }, out);
  }, [N, CROWD]);
  await page.evaluate(() => window.__pp.closeArcade(true)); await page.waitForTimeout(500);
  const rel = await page.evaluate(() => { const P = window.__pp, MC = P.DunArt.monCache, SET = new Set(['seceater', 'cornerpup', 'mourndisc', 'tombram', 'tombeye', 'tombmole', 'tombmason', 'icecrystal']); let n = 0; for (const k of MC.keys()) if (SET.has(k.slice(0, k.indexOf('|')))) n++; const SB = window.SEP_BROOD; return { pictures: n, gpuBuffers: SB ? SB.gpuBuffers : null }; });
  console.log(JSON.stringify(Object.assign({ mode: MODE, dpr: DPR, html: process.env.HTML || 'test-sm463.html', loadS }, r, { afterClose: rel })));
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
