// Measures Final Judgement against a Tower floor's Super Fiend: how many of its health bars one judgement takes.
// usage: node tests/_judg-dmg.js [floor] [k] [dlv]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 120), K = +(process.argv[3] || 3), DLV = +(process.argv[4] || 200);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(([K, DLV]) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = DLV; P.st.animas.have.ophiuchus = K; P.st.animas.eq = 'ophiuchus'; P.openMap(); P.dun.setMapTab('dungeon', true); }, [K, DLV]);
  await page.evaluate(n => window.__pp.dun.startDungeon(n, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss; }, null, { timeout: 30000 });
  const r = await page.evaluate(() => {
    const G = window.__pp.arc.game, D = G._dbg, me = D.me, m = D.g.boss, FD = D.FD, AN = D.AN;
    for (let i = 0; i < 60 * 6; i++) { G.update(1 / 60); me.hp = D.ST.hp; }
    // bring the pet close, summon, let it land and fight a moment, then end its time so it awakens
    me.x = m.x; me.y = m.y + 5; AN.S.gauge = 1; AN.S.used = false; const ok = AN.summon(); const hpS = m.hp;
    for (let i = 0; i < 60 * 6; i++) { G.update(1 / 60); me.hp = D.ST.hp; } const fought = hpS - m.hp;
    const hp0 = m.hp; let hpPre = null, hit = 0; const a = AN.S.list[0]; if (a) a.life = 0;
    for (let i = 0; i < 60 * 8; i++) { const J = AN.S.judg; if (J && !J.done && hpPre == null && J.t > 1.4) hpPre = m.hp; const before = m.hp; G.update(1 / 60); me.hp = D.ST.hp; if (J && J.done && hpPre != null && !hit) { hit = hpPre - m.hp; } }
    return { ok, atk: D.ST.atk, k: a && a.k, maxhp: Math.round(m.maxhp), bars: FD.S.bars, barHP: Math.round(FD.barHP), fight: Math.round(hp0 - (hpPre == null ? hp0 : hpPre)), judgement: Math.round(hit), judgementBars: +(hit / FD.barHP).toFixed(2), fought: Math.round(fought), foughtBars: +(fought / FD.barHP).toFixed(3), dead: !!m.dead, phase: FD.S.phase };
  });
  console.log(JSON.stringify(r));
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
