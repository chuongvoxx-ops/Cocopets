// (v463 SM) in-game photos of Rift 04's brood, creatures and minis, for the before / after sheets: in each land (stage 0 the Clockless
// Halls with Tock, stage 4 the Hall in Two Ages, stage 7 the Corner Kennels with Howl and the ice crystals) a group of every kind is
// set round the pet (some facing left), the mini boss brought into view, a few frames stepped, then photographed. Works on any build.
// usage: HTML=<build> TAG=after|before DPR=1|3 MODE=gl|2d node tests/_sm-sep-shots.js [stages 0,4,7]   -> shots/v463-SM/<TAG>-d<DPR>-s<stage>.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const DPR = +(process.env.DPR || 1), TAG = process.env.TAG || 'after', MODE = process.env.MODE || 'gl', STAGES = (process.argv[2] || '0,4,7').split(',').map(Number);
  const OUT = path.resolve(__dirname, '..', 'shots', 'v463-SM'); fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(m => { window.__SB_GL = m === 'gl' ? 1 : 0; window.__SB_GLHQ = 1; window.__SB_NOBUDGET = 1; }, MODE);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sm463.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 42; P.st.unlockAll = true; for (const id of ['belfry', 'garden', 'dunes']) P.riftState().seals[id] = 1; P.st.dun.best = 120; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  for (const S of STAGES) {
    await page.evaluate(S => { const P = window.__pp; P.arc.paused = false; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('sepulchre', S); }, S);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    const info = await page.evaluate(async S => { const P = window.__pp, D = P.arc.game._dbg, me = D.me;
      // a clear spot: the pet where the open floor is widest near its start
      const kinds = S === 7 ? ['cornerpup', 'seceater', 'mourndisc', 'cornerpup', 'icecrystal', 'tombmason'] : S === 4 ? ['seceater', 'mourndisc', 'cornerpup', 'tombmason', 'tombeye', 'cornerpup'] : ['seceater', 'cornerpup', 'mourndisc', 'tombram', 'tombeye', 'tombmole', 'cornerpup', 'tombmason'];
      for (const m of D.mons) if (!m.boss && !m.fiend && Math.hypot(m.x - me.x, m.y - me.y) < 9) { m.x += 40; m.y += 40; }
      const spots = [[-1.9, -2.6], [0, -3.1], [1.9, -2.6], [-2.2, -0.6], [2.2, -0.4], [-1.7, 1.9], [1.6, 2.0], [0, 3.2]], list = [];
      kinds.forEach((t, i) => { const [dx, dy] = spots[i % spots.length], q = D.X.freeSpot(me.x + dx, me.y + dy, 0.5); if (!q) return; const m = D.X.spawnMon(t, q.x, q.y, { pack: 950, rift: true }); m.aggro = false; m.face = dx < 0 ? 1 : -1; list.push(m); });
      const mini = D.mons.find(m => m.boss && m.lesser); if (mini) { const q = D.X.freeSpot(me.x + 1.6, me.y + 4.6, 1.2); if (q) { mini.x = q.x; mini.y = q.y; } mini.aggro = false; mini.act = 'move'; }
      const c = document.getElementById('arcCanvas').getContext('2d');
      for (let i = 0; i < 24; i++) { me.hp = D.ST.hp; P.arc.game.update(1 / 60); for (const m of list) { m.x = m.x; if (i === 23 && m.type === 'cornerpup' && list.indexOf(m) > 4) m.mode = 'block'; } }
      // the poses shown: a pup crouched, a disc mourning, a ram lowered
      for (const m of list) { if (m.type === 'mourndisc') m.mode = 'block'; if (m.type === 'tombram') m.mode = 'block'; }
      D.banners.length = 0; if (D.texts) D.texts.length = 0; c.save(); P.arc.game.draw(c); c.restore(); P.arc.paused = true;   // (held still: drawn, not updated, until photographed)
      return { n: list.length, mini: mini ? mini.bk.id : null, sb: window.SEP_BROOD ? window.SEP_BROOD.stats.baked : null }; }, S);
    await page.waitForTimeout(400); { const url = await page.evaluate(() => document.getElementById('arcCanvas').toDataURL('image/png')); fs.writeFileSync(path.join(OUT, `${TAG}-d${DPR}-s${S}.png`), Buffer.from(url.split(',')[1], 'base64')); }   // (the game's canvas itself: no page overlay over it) await page.evaluate(() => { window.__pp.arc.paused = false; });
    console.log('stage', S, JSON.stringify(info));
  }
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
