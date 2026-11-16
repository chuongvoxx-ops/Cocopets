// Doomsday (20k5f) key beats in the real game at phone size (390 x 844, DPR 1), the GPU picture (GLM and FGFX forced on the
// software rasteriser) and the 2D fallback (the earlier Doomsday), each frame drawn by hand at a set moment of the cast.
// usage: HTML=test-u2.html node tests/_ult-doomsday-shots.js      env: EVO (default 4), ONLY=gpu|2d, BEATS=0.4,1.0 (seconds)
//        -> shots/ult-doomsday/<gpu|2d>-<beat>.png (+ beats.json); tests/_ult-doomsday-sheet.py makes the contact sheet
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const EVO = +(process.env.EVO || 4), IMP = 2.25 + 0.05 * (EVO - 1);
  const BEATS = process.env.BEATS ? process.env.BEATS.split(',').map(Number) : [0.8, 1.25, 1.75, IMP - 0.08, IMP + 0.02, IMP + 0.22, IMP + 0.65, IMP + 1.5];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /Doomsday|GLM|GFX/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { window.__NG_GL = 0; window.__DOOM_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots/ult-doomsday'); fs.mkdirSync(out, { recursive: true });
  const done = [];
  for (const mode of ['gpu', '2d']) {
    if (process.env.ONLY && process.env.ONLY !== mode) continue;
    await page.evaluate(() => { const P = window.__pp; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} P.quickStart('Doom'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(+(window.__FLOOR || 3), 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    const r = await page.evaluate(([evo, gpu]) => {
      const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
      const G = P.arc.game, D = G._dbg, me = D.me, g = D.g; window.__NG_GL = gpu ? 1 : 0; window.__DOOM_GL = gpu ? 1 : 0;
      for (let k = 0; k < 200; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); Math.random = (s => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; })(12345);
      let best = null; for (let k = 0; k < 2500; k++) { const sx = me.x + (Math.random() - 0.5) * 40, sy = me.y + (Math.random() - 0.5) * 40; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
      if (best) { me.x = best.x - 1.5; me.y = best.y + 1.5; }
      const live = D.mons.filter(m => !m.boss), place = [[3, -1.2], [4.4, -0.4], [2.2, -2.3], [5, -2.0], [3.6, 0.4]];
      live.forEach((m, i) => { if (i < place.length) Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0 }); else Object.assign(m, { dead: true, x: me.x + 90 }); });
      me.mp = 999; g.cdU = 0; g.intro = 0; g.bossIntro = 0; me.face = 1; D.SKIP.fog = true; D.banners.length = 0;
      const mv = P.ELEM_LIST.dark.ey_doomsday; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo, sig: false }));
      for (let k = 0; k < 30; k++) G.update(1 / 60);
      D.useUlt(); window.__DF = D.ELEM.fx[D.ELEM.fx.length - 1]; window.__T0 = g.t; window.__NEGSEEN = 0;
      return { n: D.ELEM.fx.length };
    }, [EVO, mode === 'gpu']);
    for (const b of BEATS) {
      const st = await page.evaluate(([b, gpu]) => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, f = window.__DF; window.__NG_GL = gpu ? 1 : 0; window.__DOOM_GL = gpu ? 1 : 0;
        let k = 0; while (f.t < b - 1e-4 && k++ < 2000) { D.me.inv = 1; G.update(1 / 60); }
        if (window.__NEGSEEN) { g.negT = 0; g.negF = 0; } if (g.negT > 0) window.__NEGSEEN = 1;   // (the negative frame runs on real time and drawn frames: frozen by the hand-driven loop, so it is shown once and cleared after)
        const t0 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); const dbg = P.ELEM_IMPL.dark.ult.doomsday.__dbg; return { t: +f.t.toFixed(3), ms: Math.round(performance.now() - t0), stats: dbg.stats ? Object.assign({}, dbg.stats) : null, view: f.view ? JSON.parse(JSON.stringify(f.view)) : null }; }, [b, mode === 'gpu']);
      const name = `${mode}-${b.toFixed(2)}`; await page.screenshot({ path: path.join(out, name + '.png') }); done.push({ mode, beat: b, name, t: st.t, ms: st.ms, view: st.view }); console.log(name, JSON.stringify(st));
    }
  }
  fs.writeFileSync(path.join(out, 'beats.json'), JSON.stringify({ evo: EVO, imp: IMP, shots: done }, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
