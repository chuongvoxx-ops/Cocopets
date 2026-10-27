// A party of four in the Tower: switching by tap and key, the bench taking over when one falls, and elemental reactions.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const setup = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Lead'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 20;
    // three more pets of different elements
    const want = ['fire', 'water', 'thunder', 'ice', 'earth', 'dark', 'light', 'wind'], have = new Set([P.petElement(P.st)]);
    for (let i = 0; i < 400 && P.st.others.length < 3; i++) { const gn = P.makeGenome(P.mulberry32(i * 77 + 5)), f = P.newPetFields('Pet' + i, gn); const el = P.petElement(f); if (!have.has(el)) { have.add(el); f.dlv = 20; P.st.others.push(f); } }
    P.st.party = null; const party = P.partyPets();
    P.openMap(); P.dun.setMapTab('dungeon', true);
    return party.map(p => p.name + ':' + P.petElement(p));
  });
  console.log('party', setup);
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 11));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  const out = {};
  const who = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.party.map((m, i) => (i === D.cur() ? '*' : '') + m.p.name + '(' + Math.round(m.hp) + ')'); });
  out.start = await who();
  // tap the avatar: the next pet comes in
  await page.evaluate(() => { const A = window.__pp.arc; A.game.down(30, 30, 3); A.game.up(30, 30, 3); }); await page.waitForTimeout(300);
  out.afterTap = await who();
  // too soon: the cooldown holds
  await page.evaluate(() => { const A = window.__pp.arc; A.game.down(30, 30, 4); A.game.up(30, 30, 4); }); await page.waitForTimeout(100);
  out.tooSoon = await who();
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const A = window.__pp.arc; A.game.key('swap', true); }); await page.waitForTimeout(300);
  out.afterKey = await who();
  // the party tabs under the bars, and the switch button at the bottom
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const A = window.__pp.arc; A.game.down(60, 70, 11); A.game.up(60, 70, 11); }); await page.waitForTimeout(300);
  out.afterTab = await who();
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const A = window.__pp.arc, D = A.game._dbg, b = D.btnSw(); A.game.down(b.x, b.y, 12); A.game.up(b.x, b.y, 12); }); await page.waitForTimeout(300);
  out.afterBtn = await who();
  await page.screenshot({ path: path.resolve(__dirname, '../shots/party-hud.png') });
  // the played pet falls: the bench steps in
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.inv = 0; D.hurtPet(99999, null); }); await page.waitForTimeout(3500);
  out.afterKO = await who(); out.state = await page.evaluate(() => window.__pp.arc.state);
  // reactions: mark a monster with the played pet's element, switch, hit again
  const rx = await page.evaluate(async () => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, m = D.mons.find(x => !x.dead && !x.boss); if (!m) return 'no monster';
    m.hp = 1e9; m.maxhp = 1e9; m.x = me.x + 1.5; m.y = me.y; m.still = true;
    const el1 = D.party[D.cur()].el; D.hitMon(m, 10, {}); const mark1 = m.mark && m.mark.el;
    const next = D.party.findIndex((q, i) => i !== D.cur() && !q.down && q.el !== el1); D.g.swapCd = 0; D.switchTo(next, true); const el2 = D.party[D.cur()].el;
    const n0 = D.RX.S.count; D.hitMon(m, 10, {}); return { el1, mark1, el2, reacted: D.RX.S.count > n0, last: D.RX.S.last, markAfter: m.mark && m.mark.el };
  });
  out.rx = rx;
  // every pair fires without errors
  const all = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, m = D.mons.find(x => !x.dead && !x.boss); const names = []; const els = P.E8_ORDER; const old = { fire: 'fire', ice: 'frost', water: 'bubble', thunder: 'spark', wind: 'leaf', earth: 'gold', dark: 'shadow', light: 'prism' };
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) { m.mark = { el: els[i], t: 9 }; m.rxCd = 0; m.hp = 1e9; const n0 = D.RX.S.count; D.hitMon(m, 10, { el: old[els[j]] }); if (D.RX.S.count > n0) names.push(D.RX.S.last); else names.push('MISSED ' + els[i] + '+' + els[j]); } return names; });
  out.pairs = all.length + ' pairs, missed: ' + all.filter(n => n.startsWith('MISSED')).length;
  await page.waitForTimeout(1500);
  console.log(JSON.stringify(out, null, 1));
  const ok = out.afterTab.join() !== out.afterKey.join() && out.afterBtn.join() !== out.afterTab.join() && out.afterTap[0] !== out.start[0] && out.tooSoon.join() === out.afterTap.join() && out.afterKey.join() !== out.afterTap.join() && out.state === 'play' && out.rx.reacted && all.every(n => !n.startsWith('MISSED'));
  console.log('party', ok ? 'OK' : 'FAIL');
  console.log('errors', errors.length, errors.slice(0, 4));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
