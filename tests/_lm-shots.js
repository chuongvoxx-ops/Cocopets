// (v474 LM) in-game photos of Rift 07's brood and its mini bosses, for the before / after sheets: in each land's dungeon (stage 1 the
// Reading Galleries with Quill, stage 4 the Silver Presses with Blot, stage 7 the Gilded Stacks; stage 8 the Stair of Clouds with Folio)
// a group of every kind is set round the pet (a teetering shelf among them) (some facing left, some in their attack pose), the mini boss brought into view, a
// few frames stepped, then the game's canvas photographed. MODE=2d: the 2D art (the "before": the brood exactly as it was drawn).
// BOTH=1: then the group made to attack, photographed mid-attack. Works on any build.
// usage: HTML=<build> TAG=after|before DPR=1|3 MODE=gl|2d [BOTH=1] node tests/_lm-shots.js [stages 1,4,7] [out shots/v474-LM]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const DPR = +(process.env.DPR || 1), TAG = process.env.TAG || 'after', MODE = process.env.MODE || 'gl', ATK = !!process.env.ATK, STAGES = (process.argv[2] || '1,4,7').split(',').map(Number);
  const OUT = path.resolve(__dirname, '..', process.argv[3] || 'shots/v474-LM'); fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(m => { window.__LIB_GL = m === 'gl' ? 1 : 0; window.__LIB_GLHQ = 1; window.__LIB_NOBUDGET = 1; if (m !== 'gl') { window.__DUN_GL = 0; window.__NG_GL = 0; } else window.__NG_GL = 1; }, MODE);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-lm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 180000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 62; P.st.unlockAll = true; for (const id of ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth']) P.riftState().seals[id] = 1; P.st.dun.best = 120; P.st.dlv = 72; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; });
  for (const S of STAGES) {
    const t0 = Date.now();
    await page.evaluate(S => { const P = window.__pp; P.arc.paused = false; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.riftState().prog.library = S; P.startRift('library', S); }, S);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 }); const load = Date.now() - t0; await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 1800000 });
    const info = await page.evaluate(async ([S, ATK]) => { const P = window.__pp, D = P.arc.game._dbg, me = D.me;
      const kinds = S >= 6 ? ['seraphling', 'haloguard', 'ophanwheel', 'falsefolio', 'seraphling', 'haloguard', 'ophanwheel', 'inkstalker'] : S >= 9 ? [] : ['marginworm', 'inkstalker', 'falsefolio', 'loosepage', 'marginworm', 'inkstalker', 'falsefolio', 'marginworm'];
      for (const m of D.mons) if (!m.boss && !m.fiend && Math.hypot(m.x - me.x, m.y - me.y) < 10 && m.type !== 'tottershelf') { m.x += 40; m.y += 40; }
      const spots = [[-1.9, -2.7], [0.1, -3.3], [2.0, -2.6], [-2.3, -0.5], [2.3, -0.3], [-1.8, 2.0], [1.7, 2.1], [0, 3.3]], list = [];
      kinds.forEach((t, i) => { const [dx, dy] = spots[i % spots.length], q = D.X.freeSpot(me.x + dx, me.y + dy, 0.5); if (!q) return; const m = D.X.spawnMon(t, q.x, q.y, { pack: 950, rift: true }); m.aggro = !!ATK; m.face = dx < 0 ? 1 : -1; if (!ATK) m.cd = m.atkCd = 99; list.push(m); }); window.__amList = list;
      { const q = D.X.freeSpot(me.x - 3.6, me.y - 4.6, 1.0); if (q) { const sh = D.X.spawnMon('tottershelf', q.x, q.y, { pack: 951, rift: true }); sh.aggro = false; sh.color = (window.__pp.BIOMES[D.F.biome] && window.__pp.BIOMES[D.F.biome].libTheme === 'silver') ? '#DCE1EA' : (window.__pp.BIOMES[D.F.biome] && window.__pp.BIOMES[D.F.biome].libTheme === 'holy') ? '#F6F1E4' : '#5A3A2E'; } }
      const mini = D.mons.find(m => m.boss && m.lesser); if (mini) { const q = D.X.freeSpot(me.x + 0.6, me.y + 5.2, 1.2); if (q) { mini.x = q.x; mini.y = q.y; mini.wx = q.x; mini.wy = q.y; if (mini.calMini && mini.calMini.home) { mini.calMini.home.x = q.x; mini.calMini.home.y = q.y; } } mini.aggro = false; mini.act = 'move'; }
      const c = document.getElementById('arcCanvas').getContext('2d'), fr = () => new Promise(r => requestAnimationFrame(r));
      if (ATK) { const t1 = performance.now(); while (performance.now() - t1 < 2600) { me.hp = D.ST.hp; me.x = me.x; await fr(); } }
      else for (let i = 0; i < 24; i++) { me.hp = D.ST.hp; P.arc.game.update(1 / 60); }
      if (!ATK) for (const m of list) { const i = list.indexOf(m); if (i > 3) m.mode = m.type === 'marginworm' || m.type === 'loosepage' || m.type === 'haloguard' ? (i % 2 ? 'block' : 'dash') : (m.type === 'inkstalker' && i % 2 ? 'dash' : 'block'); if (m.type === 'falsefolio' && i < 4) m.disguised = true; }
      D.banners.length = 0; if (D.texts) D.texts.length = 0; P.arc.paused = true; for (let i = 0; i < 4; i++) await fr();   // (paused: the arcade's own loop keeps drawing the held scene with its own transform)
      const AB = window.LIB_BROOD; return { n: list.length, mini: mini ? mini.bk.id + ' ' + mini.bname + (mini.calMini ? ' (armed)' : '') : null, zones: D.zones.length, eshots: D.eshots.length, ab: AB ? { baked: AB.stats.baked, prov: AB.stats.prov, fx: AB.stats.fx } : null }; }, [S, ATK]);
    await page.waitForTimeout(400); { const url = await page.evaluate(() => document.getElementById('arcCanvas').toDataURL('image/png')); fs.writeFileSync(path.join(OUT, `${TAG}${ATK ? '-atk' : ''}-d${DPR}-s${S}.png`), Buffer.from(url.split(',')[1], 'base64')); }
    console.log('stage', S, 'load', load + 'ms', JSON.stringify(info));
    if (process.env.BOTH && !ATK) {   // (then the same group made to attack, photographed mid-attack)
      const i2 = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, fr = () => new Promise(r => requestAnimationFrame(r)); P.arc.paused = false;
        for (const m of window.__amList || []) { m.aggro = true; m.cd = Math.random() * 0.5; m.atkCd = Math.random() * 0.8; m.mode = null; }
        const t1 = performance.now(); while (performance.now() - t1 < 2400) { me.hp = D.ST.hp; await fr(); } D.banners.length = 0; if (D.texts) D.texts.length = 0; P.arc.paused = true; for (let i = 0; i < 4; i++) await fr();
        const AB = window.LIB_BROOD; return { zones: D.zones.map(z => z.kind + (z.shape ? ':' + z.shape : '')).join(','), eshots: D.eshots.length, fx: AB ? AB.stats.fx : null }; });
      await page.waitForTimeout(300); const url = await page.evaluate(() => document.getElementById('arcCanvas').toDataURL('image/png')); fs.writeFileSync(path.join(OUT, `${TAG}-atk-d${DPR}-s${S}.png`), Buffer.from(url.split(',')[1], 'base64'));
      console.log('  attack', JSON.stringify(i2)); }
  }
  console.log('errors', JSON.stringify(errors.slice(0, 5)));
  await browser.close();
})();
