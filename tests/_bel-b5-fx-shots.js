// Uldroth's attack and phase effects (worker B5, v398), shot in the game on the GPU (GLM and the FGFX painter forced on the
// software rasteriser): the Jaw's gathering and torrent, the Undertow's whirlpool and burst, the bell's toll, the island
// rising, the flood, the bell breaking, a wave, the drain. The loop is stopped and each frame drawn by hand.
// usage: HTML=test-belB5.html TAG=before|after node tests/_bel-b5-fx-shots.js -> shots/bel-b5-fx-<TAG>-NN-*.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const TAG = process.env.TAG || 'after';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__ULD_GL = 0; window.__NG_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-belB5.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots'); if (!fs.existsSync(out)) fs.mkdirSync(out);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = 10; P.st.lv10Eggs = 1; P.st.lv10Owed = 0; P.st.unlockAll = true; P.st.retro = false;
    const Rf = P.RIFT_BY_ID.belfry, i = Rf.stages.findIndex(s => s.boss === 'beluldroth'); P.openMap(); P.dun.setMapTab('rift', true); P.startRift('belfry', i); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; window.__H = { P, G: P.arc.game, D: P.arc.game._dbg }; Math.random = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })(); });
  const PRE = `const { P, G, D } = window.__H, g = D.g, me = D.me, FX = D.FD.FX, S = D.FD.S, M = FX.mem, C = FX.C, UL = P.FIEND_DEFS.beluldroth.ULDROTH, b = g.boss;
    const step = (s, f) => { const t1 = g.t + s; let k = 0; while (g.t < t1 && k++ < 100000) { me.hp = D.ST.hp; me.inv = 0.2; G.update(1 / 60); if (f && f()) return true; } return false; };
    const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.push = null; };
    const force = kind => { UL.test.endAct(FX, b); b.stunT = 0; b.act = 'fight'; UL.test.begin(FX, b, kind); };
    const isl = UL.test.islandsOf(FX);`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const done = [];
  const shot = async (name, note) => { const t0 = Date.now();
    await page.evaluate(() => { window.__ULD_GL = 1; window.__NG_GL = 1; const { P } = window.__H; P.arc.game.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__ULD_GL = 0; window.__NG_GL = 0; });
    await page.screenshot({ path: path.join(out, `bel-b5-fx-${TAG}-${name}.png`) }); done.push([name, note]); console.log(`shot ${name} (${((Date.now() - t0) / 1000).toFixed(0)} s)`); };
  await page.evaluate(() => { const { G, D } = window.__H; for (let k = 0; k < 600 && !D.g.boss; k++) G.update(1 / 60); });
  await ev(`pin(C.x, C.y + 4); step(60, () => b.act === 'fight'); M.idleT = 99;`);
  await ev(`pin(b.x + 1, b.y + 7); force('jaw'); step(4, () => M.A && M.A.t > 2.2);`); await shot('01-jaw-gather', 'Jaw of the Deep: the water gathers in his jaws, the throat glows');
  await ev(`step(4, () => M.A && M.A.phase === 'fire' && M.A.t > 0.3); pin(b.x + 6, b.y + 2);`); await shot('02-jaw-torrent', 'the torrent: foam, spray, mist');
  await ev(`step(5, () => !M.A); M.idleT = 99; pin(b.x - 1, b.y + 5.5); force('undertow'); step(4, () => M.A && M.A.phase === 'pull' && M.A.t > 1.9);`); await shot('03-undertow-pull', 'Undertow: the whirlpool drags inward');
  await ev(`step(4, () => M.A && M.A.phase === 'gasp' && M.A.t > 0.18); pin(b.x + 7, b.y + 4);`); await shot('04-undertow-burst', 'the point-blank burst: a dome of water');
  await ev(`step(5, () => !M.A); b.hp = b.maxhp * 0.69; step(5, () => S.phase === 2 && !(S.roarT > 0)); M.bellT = 0; M.idleT = 0; step(8, () => M.A && M.A.kind === 'bell' && M.A.i != null && M.A.t > 0.35); const s = isl[M.A.i]; pin(s.vx + 2.5, s.vy + 1.5);`); await shot('05-bell-toll', 'the Drowning Bell: the toll shock, the water starts to rise');
  await ev(`const s = isl[M.A.i]; pin(s.vx, s.vy + 0.6); step(3, () => s.want > 0.5); step(0.55); pin(s.vx + 1.5, s.vy + 2);`); await shot('06-island-rise', 'the island rises, water sheeting off it');
  await ev(`const s = isl[M.A.i]; step(14, () => { pin(s.x, s.y); return M.A && M.A.phase === 'crest' && M.A.t > 0.35; });`); await shot('07-flood', 'the flood crests: foam lines, the island a refuge');
  await ev(`step(10, () => !M.A); b.hp = b.maxhp * 0.34; step(5, () => S.phase === 3 && !(S.roarT > 0)); pin(C.x + 4, C.y - 4); step(14, () => M.A && M.A.kind === 'break' && M.A.phase === 'smash' && M.A.t > 1.75); D.banners.length = 0;`); await shot('08-bell-break', 'the bell breaks and falls: the splash');
  await ev(`step(4, () => !M.A); M.idleT = 99; force('wave'); step(0.05); const sd = M.A.side; pin(C.x + sd * 4.5, C.y + 2); step(6, () => M.waves.length && M.waves[0].d < 8.5); pin(C.x + sd * 4.5, C.y + 2);`); await shot('09-wave', 'a rolling crest over the marked half');
  await ev(`step(4, () => !M.A && !M.waves.length); pin(b.x + 2, b.y + 6); D.hitMon(b, b.hp * 20 + 1e6, { flat: true, pierce: true }); step(1.9);`); await shot('10-drain', 'the fall: the sea drains off the platform');
  fs.writeFileSync(path.join(out, `bel-b5-fx-${TAG}.json`), JSON.stringify(done));
  console.log('page errors', errors.length, errors.slice(0, 6));
  await browser.close();
})();
