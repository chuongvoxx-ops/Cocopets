// Ifrit (Rift 0, 20zz8) in the game, every state shot with the GPU model (GLM forced on the software rasteriser) and the
// GPU fire painter: the throne, the rise, each attack's wind-up and strike, the tethers, a crystal cut, the armour breaking
// away, Hellfire's charge (the floor warning, the wells awake, a refuge), the wall, the overheat, the statue, the sealing.
// The game loop is stopped and each frame drawn by hand (a GPU frame takes a long while on a software rasteriser).
// usage: HTML=test-calI.html node tests/_cal-i-shots.js   env: ONLY (shot names, comma list), NOGL=1 (the 2D fallback),
// LOW=1 (st.lowFx), EASE (the rift's ease when the core gives none, default 0.01) -> shots/cal-i-game-*.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !/ERR_TUNNEL|Failed to load|GPU stall/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { window.__IFRIT_GL = 0; window.__NG_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calI.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots'); if (!fs.existsSync(out)) fs.mkdirSync(out);
  await page.evaluate(([ease, low]) => { const P = window.__pp; P.quickStart('Ember'); P.st.energy = 100; P.st.retro = false; if (low) P.st.lowFx = true; let Rf = P.RIFT_BY_ID.caldera;
    if (!Rf || !Rf.stages.some(s => s.boss === 'califrit')) { const D = P.FIEND_DEFS.califrit, st = (b, nm) => ({ kind: 'boss', biome: 'volcano', boss: b, name: nm, goal: nm }); Rf = { id: 'caldera', n: 0, name: 'The Blackfire Caldera (test)', lvl: 1, sigil: 'Ember', biome: 'volcano', aff: ['fire', 'earth'], gate: null, mons: [], ease, sealing: { fall: 'THE HEART OF THE VOLCANO GOES DARK', sub: 'test', sigil: 'THE EMBER SIGIL', name: 'The Blackfire Caldera', color: '#FF8A3D' }, stages: [st('califrit', 'a'), st('califrit', 'b'), Object.assign(st('califrit', 'The Crucible'), { seal: true, make: D.stageMake })] }; P.RIFTS.push(Rf); P.RIFT_BY_ID.caldera = Rf; }
    else if (!Rf.ease) Rf.ease = ease;
    P.openMap(); P.dun.setMapTab('rift', true); P.startRift('caldera', Rf.stages.findIndex(s => s.boss === 'califrit' && s.seal)); }, [+(process.env.EASE || 0.01), !!process.env.LOW]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  // stop the loop: from here every update and every frame is ours
  await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; window.__H = { P, G: P.arc.game, D: P.arc.game._dbg }; });
  const PRE = `const { P, G, D } = window.__H, g = D.g, me = D.me, FX = D.FD.FX, S = D.FD.S, M = FX.mem, C = FX.C, I = P.FIEND_DEFS.califrit.IFRIT, b = g.boss;
    const step = (s, f) => { const t1 = g.t + s; let k = 0; while (g.t < t1 && k++ < 100000) { me.hp = D.ST.hp; me.inv = 0.2; G.update(1 / 60); if (f && f()) return true; } return false; };
    const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.push = null; };
    const force = kind => { I.test.endAct(FX, b); b.stunT = 0; b.act = 'fight'; I.test.begin(FX, b, kind); };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const want = process.env.ONLY ? process.env.ONLY.split(',') : null; let shotN = 0;
  const shot = async (name, note) => { if (want && !want.includes(name)) return; const t0 = Date.now();
    await page.evaluate(gl => { window.__IFRIT_GL = gl; window.__IFRIT_GLHQ = gl; window.__NG_GL = gl; const { P } = window.__H; P.arc.game.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); window.__IFRIT_GL = 0; window.__NG_GL = 0; }, process.env.NOGL ? 0 : 1);
    await page.screenshot({ path: path.join(out, `cal-i-game-${name}.png`) }); shotN++; console.log(`shot ${name} (${((Date.now() - t0) / 1000).toFixed(0)} s)${note ? ' · ' + note : ''}`); };
  const has = name => !want || want.includes(name);
  // ---- the throne and the rise ----
  await page.evaluate(() => { const { G, D } = window.__H; for (let k = 0; k < 600 && !D.g.boss; k++) G.update(1 / 60); });
  let r = await ev(`step(0.8); return { act: b.act, x: b.x, y: b.y, C };`); console.log('  start', JSON.stringify(r));
  await shot('01-throne', 'dormant on the throne, the chest a distant furnace');
  await ev(`step(8, () => b.act === 'rise' && b.actT > 1.1);`); await shot('02-rise', 'he breathes: the light swells');
  await ev(`step(12, () => b.act === 'fight'); pin(b.x + 1.5, b.y + 5); M.idleT = 9; step(2.6); M.idleT = 0;`); await shot('03-tyrant', 'standing: the Basalt Tyrant');
  // ---- phase one ----
  if (has('04-fist-lift') || has('05-fist-open')) { await ev(`pin(b.x + 1.2, b.y + 4.2); force('fist'); step(4, () => M.A && M.A.tele && M.A.t > M.A.W * 0.6);`); await shot('04-fist-lift', 'Titan Fist: the high lift, the impact marked');
    await ev(`step(4, () => M.A && M.A.phase === 'rec' && M.A.t > 0.5); pin(b.x + 2.5, b.y + 5);`); await shot('05-fist-open', 'the long recovery: the chest exposed (weak point)'); }
  if (has('06-breath-track') || has('07-breath-gout')) { await ev(`step(3, () => !M.A); pin(b.x - 2, b.y + 5); force('breath'); step(3, () => M.A && M.A.t > 1.2);`); await shot('06-breath-track', 'Cinder Breath: the cone tracks while he draws breath');
    await ev(`step(4, () => M.A && M.A.phase === 'fire' && M.A.t > 0.35); pin(b.x + 5, b.y + 2);`); await shot('07-breath-gout', 'the gout, locked'); }
  if (has('08-fault')) { await ev(`step(4, () => !M.A); pin(b.x + 1, b.y + 7); force('fault'); step(4, () => M.A && M.A.phase === 'run' && M.A.t > M.A.line.run * 0.6); pin(me.x + 2.5, me.y);`); await shot('08-fault', 'Fault Line: the crack runs, then a narrow eruption'); }
  if (has('09-erupt')) { await ev(`step(3, () => M.A && M.A.phase === 'run' && M.A.t > M.A.line.run + 0.75);`); await shot('09-erupt', 'the eruption along the line'); }
  // ---- phase two ----
  await ev(`step(4, () => !M.A); b.hp = b.maxhp * 0.69; step(4, () => S.phase === 2 && !(S.roarT > 0)); pin(b.x + 2, b.y + 5); M.idleT = 9; step(3.0); M.idleT = 0;`); await shot('10-crown', 'Crown of Blackfire: horns flared, two crystal growths tethered');
  if (has('11-cleave')) { await ev(`pin(b.x + 1.5, b.y + 4); force('cleave'); step(4, () => M.A && M.A.tele && M.A.t > M.A.W * 0.7);`); await shot('11-cleave', 'Burning Cleave: drawn back, the broad sweep marked'); }
  if (has('12-rocks')) { await ev(`step(4, () => !M.A); pin(b.x - 1, b.y + 6); force('rocks'); step(4, () => M.A && M.A.phase === 'fall' && M.A.t > 0.9);`); await shot('12-rocks', 'marked falling lava rocks'); }
  await ev(`step(4, () => !M.A); const cr = M.crys[0]; pin(cr.x + 2, cr.y + 2.5); if (cr.obj) D.hitMon(cr.obj, cr.obj.hp + 1, { flat: true }); step(0.5);`); await shot('13-cut', 'a growth broken: its tether cut, that side of his armour dims, a stagger');
  // ---- phase three ----
  await ev(`step(3, () => !(b.stunT > 0)); b.hp = b.maxhp * 0.34; step(1.2, () => S.phase === 3 && M.fracT > 0.45); pin(C.x + 1, b.y + 5);`); await shot('14-break', 'Heart of the Volcano: the armour breaks away');
  await ev(`step(4, () => M.fracT > 1.6 && !(S.roarT > 0)); M.hfT = 99; M.idleT = 9; step(2.8); M.idleT = 0; pin(b.x + 1.5, b.y + 5); step(0.6);`); await shot('15-bare', 'the molten chest bare, fire streaming from his shoulders');
  await ev(`step(4, () => !M.A); M.hfT = 0; step(4, () => M.A && M.A.kind === 'hellfire' && M.A.t > 1.5); const w = M.wells[0]; pin(w.x + 3.5, w.y - 2);`); await shot('16-hell-charge', 'Hellfire: hands planted, the floor warns, the wells wake (the cue and the pointer)');
  await ev(`const w = M.wells[0]; pin(w.x + 0.9, w.y - 0.6); step(2.0, () => w.on); step(0.6);`); await shot('17-refuge', 'a cold refuge made at a frost well');
  await ev(`step(9, () => M.A && M.A.phase === 'wall' && M.A.y > C.y + 2);`); await shot('18-wall', 'the wall of Hellfire crosses the arena; the refuge holds');
  await ev(`step(5, () => b.stunT > 0 && M.stunKind === 'kneel'); step(1.2); pin(b.x + 1.5, b.y + 4.5);`); await shot('19-kneel', 'overheated: he kneels, the core open');
  // ---- the fall ----
  await ev(`b.stunT = 0; step(0.3); D.hitMon(b, b.hp * 20 + 1e6, { flat: true, pierce: true }); step(4.5);`); await shot('20-statue', 'the core dims: a dark, inert statue; the lava calm; the crystals dark');
  await ev(`step(5, () => D.RIFT.self.cine && D.RIFT.self.cine.step >= 2);`); await shot('21-seal', 'the sealing');
  console.log('page errors', errors.length, errors.slice(0, 8));
  await browser.close();
})();
