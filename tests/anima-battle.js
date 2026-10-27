// Summons every Anima in a dungeon and photographs the cinematic, the fight and the Astral Awakening.
// usage: node tests/anima-battle.js [ids,...] [stage] [res]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const only = process.argv[2] && process.argv[2] !== 'all' ? process.argv[2].split(',') : null, K = +(process.argv[3] || 1), MODE = process.argv[4] || '', RES = MODE === 'res' || MODE === 'harmony', TAG = RES ? '-' + MODE : '';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K, RES }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; if (RES) P.st.stage = 7; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.eq = 'aries'; P.openMap(); P.dun.setMapTab('dungeon', true); }, { K, RES });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  const ids = (only || ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']);
  const out = [];
  for (const id of ids) {
    const ok = await page.evaluate(({ id, K, RES, MODE }) => {
      const P = window.__pp, D = P.arc.game._dbg, me = D.me, AN = D.AN;
      if (!AN.kit) return 'no kit';
      AN.kit.main.id = id; AN.kit.main.k = K;
      if (RES) { const o = MODE === 'harmony' ? P.ANIMA_ORDER[(P.ANIMA_ORDER.indexOf(id) + 1) % 12] : P.ANIMAS[id].opp; AN.kit.res = { id: o, k: K }; AN.kit.resonance = P.pairResonance(id, o); } else { AN.kit.res = null; AN.kit.resonance = null; }
      D.mons.filter(m => !m.dead && !m.boss).slice(0, 7).forEach((m, i) => { const p = D.X.walkPoint(me.x + 2.5 + (i % 3) * 1.3, me.y - 2 + i * 0.8, { r: m.r, mv: 0 }); m.x = p.x; m.y = p.y; m.still = true; m.aggro = true; m.hp = 1e6; m.maxhp = 1e6; });
      Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
      return AN.summon() ? 'ok' : 'refused';
    }, { id, K, RES, MODE });
    if (ok !== 'ok') { console.log(id, ok); continue; }
    const snap = async (tag, ms) => { await page.waitForTimeout(ms); await page.screenshot({ path: path.resolve(__dirname, `../shots/an-${id}${TAG}-${tag}.png`) }); out.push(`an-${id}${TAG}-${tag}`); };
    await snap('1cine', 700);
    await snap('2land', 650);
    await snap('3fight', 2200);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; }); });
    await snap('4awaken', RES ? 1000 : 950);
    const st = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { list: D.AN.S.list.map(a => a.st), dmg: D.mons.filter(m => !m.boss).slice(0, 7).reduce((s, m) => s + (1e6 - Math.max(0, m.hp)), 0) | 0 }; });
    console.log(id, JSON.stringify(st));
    await page.waitForTimeout(2600);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.parts.length = 0; D.zones.length = 0; });
  }
  require('fs').writeFileSync(path.resolve(__dirname, '../shots/an-list.json'), JSON.stringify(out));
  console.log('shots', out.length, 'errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
