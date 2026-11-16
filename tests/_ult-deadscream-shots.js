// Dead Scream (v391 U4): phone-size frames (390 x 844, DPR 1) of the key moments, for the before/after sheet
// (tests/_ult-deadscream-sheet.py). The game is paused and stepped by hand to each moment on the effect's own clock, then
// drawn once and captured. Monsters ring the pet (one outside); Math.random is seeded, so a run is repeatable.
// usage: HTML=test-u4.html TAG=after GPU=1 EVO=7 node tests/_ult-deadscream-shots.js      (-> shots/ds-<TAG>-<moment>.png)
//        HTML=test-u4-before.html TAG=before GPU=0 ...          STUDIO=1: also a skull turnaround (shots/ds-<TAG>-studio.png)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const GPU = process.env.GPU === '1', TAG = process.env.TAG || (GPU ? 'gpu' : '2d'), EVO = +(process.env.EVO || 7), LIGHT = process.env.LIGHT === '1';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /Dead Scream|GLM|GFX|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
  await page.addInitScript(g => { window.__NG_GL = g ? 1 : 0; window.__DS_GL = g ? 1 : 0; window.__DS_GLHQ = 1; }, GPU);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 180000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Scream'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, +(window.__FLOOR || 11)); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000 });
  const setup = await page.evaluate(([evo]) => { const P = window.__pp; P.beginPlay(); P.arc.paused = true; const G = P.arc.game, D = G._dbg, me = D.me, g = D.g; for (let k = 0; k < 150; k++) G.update(1 / 60);
    const Wk = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 2000; k++) { const sx = me.x + (Math.random() - 0.5) * 34, sy = me.y + (Math.random() - 0.5) * 34; if (!Wk(sx, sy)) continue; let L = 0; while (L < 8 && Wk(sx + L, sy) && Wk(sx - L, sy) && Wk(sx, sy - L * 0.7) && Wk(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
    me.x = best.x; me.y = best.y; me.hp = D.ST.hp; me.mp = 999; g.cdU = 0; g.intro = 0; g.bossIntro = 0; for (let k = 0; k < 40; k++) G.update(1 / 60);
    const R = 3.0 + 0.27 * (evo - 1), live = D.mons.filter(m => !m.boss), place = [[2.0, 0.4], [-2.3, 0.9], [0.6, -(R - 0.9)], [-1.2, -1.6], [R - 0.6, -0.9], [R + 2.4, 1.6]];
    for (const m of D.mons) if (!m.boss) { m.dead = true; m.x = me.x + 80; m.y = me.y + 80; }
    live.slice(0, place.length).forEach((m, i) => Object.assign(m, { dead: false, x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e9, maxhp: 1e9, still: false, spd: 0, atkCd: 99, dmg: 0, stun: 0, fearT: 0, z: 0, elite: false }));
    let sd = 777; Math.random = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return 0.08 + 0.92 * sd / 4294967296; };
    const mv = P.ELEM_LIST.dark.ey_deadscream, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo, sig: false }); D.setKit('ult', ab);
    if (window.__DS_GL) P.ELEM_IMPL.dark.ult.deadscream.skull.prepare(1e9); window.__ctx = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d'); const nfx = D.ELEM.fx.length; D.useUlt();
    for (let k = 0; k < 120 && D.ELEM.fx.length <= nfx; k++) G.update(1 / 60); window.__F = D.ELEM.fx[nfx]; return { ok: !!window.__F, R }; }, [EVO]);
  if (!setup.ok) { console.log('FAIL no effect'); process.exit(1); }
  const Wn = [7, 8.5, 10, 12, 14.5, 17, 20][EVO - 1], TE = 1.1 + Wn, TB = TE + 0.5, P0 = 1.4;
  const moments = [['form', 0.75], ['risen', 1.3], ['scream', P0 + 0.5 * 3 + 0.06], ['wave', P0 + 0.5 * 4 + 0.22], ['late', TE - 0.62], ['jawshut', TE + 0.3], ['burst', TB + 0.08], ['shards', TB + 0.42], ['ash', TB + 1.1]];
  for (const [name, at] of moments) {
    const r = await page.evaluate(async at => { const P = window.__pp, G = P.arc.game, D = G._dbg, F = window.__F; let n = 0;
      window.__DS_GLQ = 0.06;   /* (the frames on the way drawn with the skull tiny: a software rasteriser is slow; the last one at full size) */
      while (F.t < at - 1e-6 && n < 4000) { D.me.hp = D.ST.hp; D.me.dead = false; G.update(Math.min(1 / 60, at - F.t + 1e-6)); n++; if (at - F.t < 0.26 && n % 8 === 0) G.draw(window.__ctx); }   /* (frames drawn on the way, so the picture's own state runs: trails, particles) */
      window.__DS_GLQ = 1; G.draw(window.__ctx); return { t: F.t, dbg: F.dbg, url: window.__ctx.canvas.toDataURL('image/png') }; }, at);   /* (the game canvas read at once: a screenshot would wait on the page's own slow frames) */
    fs.writeFileSync(path.resolve(__dirname, `../shots/ds-${TAG}-${name}.png`), Buffer.from(r.url.split(',')[1], 'base64')); delete r.url;
    console.log(name, JSON.stringify(r));
  }
  if (process.env.STUDIO === '1') {
    const url = await page.evaluate(() => { const SK = window.__pp.ELEM_IMPL.dark.ult.deadscream.skull; SK.prepare(1e9);
      const yaws = [-1.1, -0.55, 0, 0.55, 1.1, Math.PI * 0.8], S = 260, cv = document.createElement('canvas'); cv.width = S * yaws.length; cv.height = S * 2; const c = cv.getContext('2d');
      c.fillStyle = '#17121f'; c.fillRect(0, 0, cv.width, S); c.fillStyle = '#d8d0c2'; c.fillRect(0, S, cv.width, S);
      yaws.forEach((y, i) => { for (let row = 0; row < 2; row++) SK.draw(c, S * i + S / 2, S * row + S * 0.44, 78, { yaw: y, pitch: row ? 0.12 : -0.08, roll: 0, jaw: row ? 0.9 : 0, glow: row ? 1.1 : 0.45, crack: row ? 0.85 : 0.45, spill: 0, fire: 1, t: 3.3 }); });
      return cv.toDataURL('image/png'); });
    fs.writeFileSync(path.resolve(__dirname, `../shots/ds-${TAG}-studio.png`), Buffer.from(url.split(',')[1], 'base64')); console.log('studio written');
  }
  console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 5)) : 'no page errors'); await browser.close();
})();
