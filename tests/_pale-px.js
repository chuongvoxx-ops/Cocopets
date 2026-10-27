// A few frames of the floor 100 fight drawn exactly alike in two builds (the dice seeded, the game stepped the same), saved
// as PNG so their pixels can be compared: the brains as they rest, while it thinks, in a hit flash, and both brains of
// phase 2. usage: node tests/_pale-px.js out-tag   env: HTML, PIN, CAP
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const tag = process.argv[2] || 'now';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, 777);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const shots = [];
  for (const phase of [1, 2, 3]) {
    await page.evaluate(cap => { if (cap) window.__pp.arc.dunCap = cap; window.__pp.dun.startDungeon(100, 7); }, +(process.env.CAP || 0));
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(pin => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; let a = 4242; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; window.__pp.beginPlay(); window.__pp.DunFiend.KIT.Q.pin = pin; }, +(process.env.PIN || 2));
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const got = await page.evaluate(phase => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, run = window.__run; for (let i = 0; i < 1200 && !D.g.boss; i++) run(1 / 60);
      const FD = D.FD, FX = FD.FX, M = FX.mem, me = D.me, C = FX.C, m = D.g.boss, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d');
      const frame = (draw) => { run(1 / 60); M.gap = 99; me.hp = D.ST.hp; me.x = C.x + 1; me.y = C.y + 5; if (draw) { c.save(); G.draw(c); c.restore(); } };
      for (let i = 0; i < 300; i++) frame(i > 240); if (phase > 1) { m.hp = m.maxhp * ([1, 0.66, 0.31][phase - 1]); for (let i = 0; i < 400; i++) frame(i > 340); }
      const out = [];
      // at rest, drawn as the game draws: a second of frames, the last one kept
      for (let i = 0; i < 61; i++) frame(true); out.push(['rest', cv.toDataURL('image/png')]);
      // thinking hard: its folds lit
      M.B.thinkK = 1; for (let i = 0; i < 13; i++) frame(true); out.push(['think', cv.toDataURL('image/png')]);
      // a hit flash, held over a few redraws
      for (let i = 0; i < 9; i++) { m.flash = 0.09; frame(true); } out.push(['flash', cv.toDataURL('image/png')]);
      for (let i = 0; i < 12; i++) frame(true); out.push(['after', cv.toDataURL('image/png')]);
      return { phase: FD.S.phase, lie: !!M.F, shots: out };
    }, phase);
    for (const [nm, url] of got.shots) { const f = path.resolve(__dirname, `../shots/px-${tag}-p${got.phase}-${nm}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); shots.push(f); }
    console.log('phase', got.phase, 'lie', got.lie);
    await page.evaluate(() => { const G = window.__pp.arc.game; G.update = window.__run; window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(150);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
