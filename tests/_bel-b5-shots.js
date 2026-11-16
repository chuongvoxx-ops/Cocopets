// Uldroth (worker B5, 20t5) in the game, shot with the GPU model (GLM forced on the software rasteriser) and the GPU water
// painter: the rise from the sea, the Herald, Jaw of the Deep, Undertow, the Drowning Bell (the lit valve, the island
// rising, the flood with the pet sheltered), the bell breaking, a half-arena wave with leeches on the valve, the fall
// (the sea drained, the sun). The game loop is stopped and each frame drawn by hand.
// usage: HTML=test-belB5.html node tests/_bel-b5-shots.js   env: ONLY (names), NOGL=1, DPR (default 1) -> shots/bel-b5-*.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: +(process.env.DPR || 1), hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); if (/Uldroth/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { window.__ULD_GL = 0; window.__NG_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-belB5.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots'); if (!fs.existsSync(out)) fs.mkdirSync(out);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dlv = 10; P.st.lv10Eggs = 1; P.st.lv10Owed = 0; P.st.unlockAll = true; P.st.retro = false;
    const Rf = P.RIFT_BY_ID.belfry, i = Rf.stages.findIndex(s => s.boss === 'beluldroth'); P.openMap(); P.dun.setMapTab('rift', true); P.startRift('belfry', i); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; window.__H = { P, G: P.arc.game, D: P.arc.game._dbg }; });
  const PRE = `const { P, G, D } = window.__H, g = D.g, me = D.me, FX = D.FD.FX, S = D.FD.S, M = FX.mem, C = FX.C, UL = P.FIEND_DEFS.beluldroth.ULDROTH, b = g.boss;
    const step = (s, f) => { const t1 = g.t + s; let k = 0; while (g.t < t1 && k++ < 100000) { me.hp = D.ST.hp; me.inv = 0.2; G.update(1 / 60); if (f && f()) return true; } return false; };
    const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.push = null; };
    const force = kind => { UL.test.endAct(FX, b); b.stunT = 0; b.act = 'fight'; UL.test.begin(FX, b, kind); };
    const isl = UL.test.islandsOf(FX);`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const want = process.env.ONLY ? process.env.ONLY.split(',') : null; const done = [];
  const shot = async (name, note) => { if (want && !want.includes(name)) return; const t0 = Date.now();
    await page.evaluate(gl => { window.__ULD_GL = gl; window.__NG_GL = gl; const { P } = window.__H; P.arc.game.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__ULD_GL = 0; window.__NG_GL = 0; }, process.env.NOGL ? 0 : 1);
    await page.screenshot({ path: path.join(out, `bel-b5-${name}.png`) }); done.push([name, note]); console.log(`shot ${name} (${((Date.now() - t0) / 1000).toFixed(0)} s)${note ? ' · ' + note : ''}`); };
  await page.evaluate(() => { const { G, D } = window.__H; for (let k = 0; k < 600 && !D.g.boss; k++) G.update(1 / 60); });
  await ev(`pin(C.x, C.y + 4); step(30, () => b.act === 'rise' && b.actT > 2.0);`); await shot('01-rise', 'he heaves himself out of the sea');
  await ev(`step(15, () => b.act === 'fight'); pin(b.x + 2, b.y + 6.5); M.idleT = 9; step(2.4); M.idleT = 0;`); await shot('02-herald', 'the Drowned Herald: idle, the throat swelling');
  await ev(`pin(b.x + 1, b.y + 7.5); force('jaw'); step(4, () => M.A && M.A.t > 1.3);`); await shot('03-jaw-track', 'Jaw of the Deep: the long cone tracks, a countdown and the jaws symbol');
  await ev(`step(4, () => M.A && M.A.phase === 'fire' && M.A.t > 0.25); pin(b.x + 6, b.y + 2);`); await shot('04-jaw-torrent', 'the torrent');
  await ev(`step(5, () => !M.A); pin(b.x - 1, b.y + 4.5); force('undertow'); step(4, () => M.A && M.A.phase === 'pull' && M.A.t > 1.6);`); await shot('05-undertow', 'Undertow: the pull (chevrons), the burst marked');
  await ev(`step(4, () => M.A && M.A.phase === 'gasp' && M.A.t > 0.3); pin(b.x + 2, b.y + 5.5);`); await shot('06-gasp', 'the gasp: the throat open (weak point)');
  await ev(`step(5, () => !M.A); b.hp = b.maxhp * 0.69; step(5, () => S.phase === 2 && !(S.roarT > 0)); M.bellT = 0; M.idleT = 0; step(4, () => M.A && M.A.kind === 'bell' && M.A.t > 1.0); const s = isl[M.A.i]; pin(s.vx + 2.5, s.vy + 1.5);`); await shot('07-bell-call', 'the Drowning Bell: the lit valve, its island announced, the count');
  await ev(`const s = isl[M.A.i]; pin(s.vx, s.vy + 0.5); step(3, () => s.want > 0.5); step(1.6); pin(s.x, s.y);`); await shot('08-island', 'the valve turned: the island rises; the pet climbs it');
  await ev(`const s = isl[M.A.i]; step(14, () => { pin(s.x, s.y); return M.A && M.A.phase === 'crest' && M.A.t > 0.5; });`); await shot('09-flood', 'the flood crests over the platform; the pet sheltered on the island');
  await ev(`step(10, () => !M.A); b.hp = b.maxhp * 0.34; step(5, () => S.phase === 3 && !(S.roarT > 0)); pin(C.x + 4, C.y - 4); step(12, () => M.A && M.A.kind === 'break' && M.A.phase === 'smash' && M.A.t > 0.9);`); await shot('10-break', 'he breaks the bell support: the bell falls into the sea');
  await ev(`step(4, () => !M.A); M.surgeT = 0; step(2, () => M.surge); const s = isl[M.surge.i]; force('wave'); step(0.05); pin(C.x + M.A.side * 4, C.y + 3); step(3, () => M.A && M.A.t > 1.6);`); await shot('11-wave-leeches', 'a half-arena wave marked; leeches hold the next valve');
  await ev(`step(3, () => M.waves.length && M.waves[0].d < 8.5); pin(C.x + M.waves[0].side * 4.5, C.y + 2);`); await shot('12-wave', 'the wave rolls in from the open sea over the marked half');
  await ev(`step(6, () => !M.A); const s = isl[M.surge.i]; for (const l of s.leeches) if (!l.dead) D.hitMon(l, 1e9, { flat: true }); step(0.5); pin(s.vx, s.vy + 0.5); step(3, () => s.want > 0.5); step(2.0); pin(s.x, s.y); force('wave'); step(3, () => M.A && M.A.t > 2.0);`); await shot('13-refuge', 'the leeches dead, the valve turned: the raised island is a refuge from the wave');
  await ev(`step(4, () => !M.A); pin(b.x + 2, b.y + 6); D.hitMon(b, b.hp * 20 + 1e6, { flat: true, pierce: true }); step(1.6);`); await shot('14-fall', 'his fall: the light leaves his throat, the sea drains');
  await ev(`step(2.4);`); await shot('15-sun', 'the sea drained down below the rim, the bell has sounded, warm sunlight');
  fs.writeFileSync(path.join(out, 'bel-b5-shots.json'), JSON.stringify(done));
  console.log('page errors', errors.length, errors.slice(0, 8));
  await browser.close();
})();
