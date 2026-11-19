// (v417 BR) Ball Crusher / Rapid Fire showcase frames in the real game at phone size (390 x 844), each frame drawn by hand at a
// set moment of the cast, on the GPU path (GLM + FGFX forced on the software rasteriser) or the 2D one.
// usage: HTML=test-br.html KEY=ballcrusher EVOS=1,4,7 DPR=1 MODES=gpu,2d BEATS=0.3,0.8 node tests/_earth-strong-br-shots.js
//        -> shots/v417-BR/<key>-e<evo>-d<dpr>-<mode>-<beat>.png ; tests/_earth-strong-br-sheet.py makes the sheets
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const KEY = process.env.KEY || 'ballcrusher', EVOS = (process.env.EVOS || process.env.EVO || '1').split(',').map(Number), DPR = +(process.env.DPR || 1), MODES = (process.env.MODES || 'gpu').split(',');
  const BEATS = (process.env.BEATS || (KEY === 'ballcrusher' ? '0.25,0.7,1.4,2.6' : '0.2,0.45,0.75,1.1')).split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /BR|GLM|GFX|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
  await page.addInitScript(() => { window.__NG_GL = 0; window.__BR_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots/v417-BR'); fs.mkdirSync(out, { recursive: true });
  for (const mode of MODES) for (const EVO of EVOS) { const first = EVO === EVOS[0];   // (one floor a mode: the later tiers are cast in the same scene, set again)
    if (first) { await page.evaluate(() => { window.__BEST = null; const P = window.__pp; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} P.quickStart('Rock'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(+(window.__FLOOR || 3), 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 }); }
    const r = await page.evaluate(([evo, gpu, key]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; window.__NG_GL = gpu ? 1 : 0; D.ELEM.fx.length = 0;
      if (!window.__BEST) { cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; for (let k = 0; k < 200; k++) G.update(1 / 60); }
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(4242);
      let best = window.__BEST; if (!best) for (let k = 0; k < 3000; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; if (!W(sx, sy)) continue; let L = 0; while (L < 8 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.8) && W(sx, sy + L * 0.8)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
      window.__BEST = best; if (best) { me.x = best.x - 2.2; me.y = best.y + 0.6; }
      const live = D.mons.filter(m => !m.boss), place = key === 'ballcrusher' ? [[2.6, 0.2], [4.2, -1.4], [5.4, 1.2], [3.6, 2.4], [1.2, -2.6]] : [[3.4, -0.6], [4.6, 0.9], [5.2, -1.8], [2.6, 2.2], [6, 0.2]];
      live.forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, aggro: true }); else Object.assign(m, { dead: true, x: me.x + 90 }); });
      me.mp = 999; g.cdS = 0; g.intro = 0; g.bossIntro = 0; me.face = 1; D.SKIP.fog = true; D.banners.length = 0; me.ax = 1; me.ay = 0;
      const mv = P.ELEM_LIST.earth['ex_' + key]; D.setKit('strong', Object.assign(P.elemAbility(mv, 'strong', P.st), { star: 5, mult: 1.2, cost: 0, cd: 0, tier: 1, evo, sig: false }));
      for (let k = 0; k < 30; k++) G.update(1 / 60);
      D.useStrong('strong'); window.__DF = D.ELEM.fx.filter(f => f.key === key); window.__T0 = g.t;
      return { n: window.__DF.length, best };
    }, [EVO, mode === 'gpu', KEY]);
    console.log(mode, JSON.stringify(r));
    for (const b of BEATS) {
      const st = await page.evaluate(([b, gpu]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g; window.__NG_GL = gpu ? 1 : 0;
        g.zoomP = +(window.__ZP || 0.75); g.zoomT = 99; let k = 0; while (g.t - window.__T0 < b - 1e-4 && k++ < 3000) { D.me.hp = D.ST.hp; D.me.inv = 0; D.eshots.length = 0; for (const m of D.mons) { m.atkCd = 99; m.spd = 0; } for (let i = D.zones.length - 1; i >= 0; i--) if (D.zones[i].own !== 'pet') D.zones.splice(i, 1); G.update(1 / 60); }   // (the monsters held still and harmless, nothing of theirs on the floor, the pet not blinking) for (let q = 0; q < 40; q++) g.zoom += (g.zoomP - g.zoom) * 0.3;
        const t0 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); const BR = window.EARTH_BR_GPU;
        return { t: +(g.t - window.__T0).toFixed(3), ms: Math.round(performance.now() - t0), br: BR ? { W: BR.STATS.W, H: BR.STATS.H, n: BR.STATS.n, items: BR.STATS.items, build: Math.round(BR.STATS.buildMs), nv: BR.STATS.nv } : null }; }, [b, mode === 'gpu']);
      const name = `${KEY}-e${EVO}-d${DPR}-${mode}-${b.toFixed(2)}`; await page.screenshot({ path: path.join(out, name + '.png') }); console.log(name, JSON.stringify(st));
    }
  }
  console.log('page errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
