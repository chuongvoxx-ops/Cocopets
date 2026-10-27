// Accessories: rolls by floor and rarity, their bonuses on a pet, saving and loading, the lobby row and the sheet,
// and real drops from a Super Fiend banked at the end of the run. usage: node tests/accessories.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const fails = [];
  const check = (ok, what) => { if (!ok) fails.push(what); };
  // 1. rolls
  const rolls = await page.evaluate(() => {
    const P = window.__pp, A = P.acc, out = {};
    [1, 18, 30, 54, 60, 90, 120].forEach(n => { const w = A.accRarityWeights(n, 0), t = w.reduce((a, b) => a + b, 0); out['f' + n] = w.map(x => Math.round(x / t * 1000) / 10); });
    const w = A.accRarityWeights(120, 40), t = w.reduce((a, b) => a + b, 0); out.fiend120 = w.map(x => Math.round(x / t * 1000) / 10);
    // main bonus ranges and extra bonus counts, for each kind at each rarity
    const ranges = {}; A.ACC_TYPES.forEach(ty => { for (let r = 0; r < 6; r++) { let lo = 9, hi = 0, aff = 0; for (let i = 0; i < 200; i++) { const a = A.rollAccessory(60, { t: ty, r }); const main = { ring: 'atk', bracelet: 'mp', necklace: 'hp' }[ty]; lo = Math.min(lo, a.s[main]); hi = Math.max(hi, a.s[main]); aff = Math.max(aff, Object.keys(a.s).filter(k => !['atk', 'hp', 'mp', 'rg'].includes(k)).length); } ranges[ty + r] = [lo, hi, aff]; } });
    out.ranges = ranges;
    // a thousand drops on floor 120: how they come out
    const cnt = [0, 0, 0, 0, 0, 0]; for (let i = 0; i < 2000; i++) cnt[A.rollAccessory(120).r]++; out.f120drops = cnt;
    const cnt1 = [0, 0, 0, 0, 0, 0]; for (let i = 0; i < 2000; i++) cnt1[A.rollAccessory(1).r]++; out.f1drops = cnt1;
    out.names = [A.accName(A.rollAccessory(120, { t: 'ring', r: 5 })), A.accName(A.rollAccessory(30, { t: 'necklace', r: 2 })), A.accName(A.rollAccessory(5, { t: 'bracelet', r: 0 }))];
    out.lines = A.accLines(A.rollAccessory(120, { t: 'bracelet', r: 5 }));
    return out;
  });
  check(rolls.f1[4] === 0 && rolls.f1[5] === 0, 'no Legendary or Mythic on floor 1');
  check(rolls.f54[5] === 0 && rolls.f60[5] > 0, 'Mythic begins past floor 54');
  check(rolls.f18[4] === 0 && rolls.f30[4] > 0, 'Legendary begins past floor 18');
  check(rolls.ranges.ring5[0] >= 1.5 && rolls.ranges.ring5[1] <= 2.0, 'Mythic ring +150-200% power');
  check(rolls.ranges.necklace5[0] >= 2.3 && rolls.ranges.necklace5[1] <= 3.0, 'Mythic necklace +230-300% HP');
  check(rolls.ranges.ring0[2] === 0 && rolls.ranges.ring5[2] === 3, 'extra bonuses: none on Common, three on Mythic');
  check(rolls.f120drops[0] < rolls.f1drops[0] && rolls.f120drops[5] > 0, 'higher floors drop rarer pieces');
  // 2. bonuses on a pet, worn and taken off, saved and loaded
  const pet = await page.evaluate(() => {
    const P = window.__pp, A = P.acc; P.quickStart('Bot'); const st = P.st; st.dlv = 40; st.unlockAll = true; st.energy = 100; st.dun.best = 120; st.dun.god = true;
    const base = P.dun.petCombat(st);
    const ring = A.rollAccessory(120, { t: 'ring', r: 5 }), neck = A.rollAccessory(120, { t: 'necklace', r: 5 }), brace = A.rollAccessory(120, { t: 'bracelet', r: 4 }), spare = A.rollAccessory(10, { t: 'ring', r: 0 });
    A.accBank([ring, neck, brace, spare]);
    st.acc.ring = ring.u; st.acc.necklace = neck.u; st.acc.bracelet = brace.u;
    const worn = P.dun.petCombat(st);
    // load it back, with a bad reference and a piece worn twice slipped in
    const o = P.serialize(); o.others = o.others || []; o.acc.ring = ring.u;
    const s2 = P.sanitize(JSON.parse(JSON.stringify(o)));
    const bad = JSON.parse(JSON.stringify(o)); bad.acc.ring = 'azzzzzz9'; bad.acc.bracelet = ring.u;
    const s3 = P.sanitize(bad);
    return { base: { hp: base.hp, atk: base.atk, mp: base.mp }, worn: { hp: worn.hp, atk: worn.atk, mp: worn.mp, crit: worn.acc.crit || 0 }, ringAtk: ring.s.atk, neckHp: neck.s.hp, bag: st.accs.length, loaded: { n: s2.accs.length, ring: s2.acc.ring === ring.u, neck: s2.acc.necklace === neck.u }, bad: { ring: s3.acc.ring, bracelet: s3.acc.bracelet } };
  });
  check(Math.abs(pet.worn.hp / pet.base.hp - (1 + pet.neckHp)) < 0.02, 'a necklace multiplies HP');
  check(Math.abs(pet.worn.atk / pet.base.atk - (1 + pet.ringAtk)) < 0.03, 'a ring multiplies power');
  check(pet.worn.mp > pet.base.mp, 'a bracelet adds MP');
  check(pet.loaded.n === 4 && pet.loaded.ring && pet.loaded.neck, 'accessories survive a save and load');
  check(pet.bad.ring === null && pet.bad.bracelet === null, 'bad references are dropped on load');
  // 3. the lobby and the sheet
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.waitForTimeout(400);
  const ui1 = await page.evaluate(() => ({ slots: document.querySelectorAll('.aslot').length, sum: (document.querySelector('.dp-accsum') || {}).textContent || '' }));
  check(ui1.slots === 3 && /Power/.test(ui1.sum), 'the lobby shows three slots and the bonuses');
  await page.click('.aslot[data-t="ring"]'); await page.waitForTimeout(300);
  const ui2 = await page.evaluate(() => ({ kind: window.__pp.sheetKind, tiles: document.querySelectorAll('.acc-tile').length, detail: (document.querySelector('.acc-detail h3') || {}).textContent }));
  check(ui2.kind === 'accs' && ui2.tiles === 2, 'the sheet lists the two rings');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/acc-sheet.png') });
  // pick the spare ring, wear it, then take it off
  await page.evaluate(() => { const t = [...document.querySelectorAll('.acc-tile')].find(b => !b.querySelector('.at-who')); t.click(); });
  await page.waitForTimeout(200);
  await page.evaluate(() => document.querySelector('[data-go="acc-eq"]').click()); await page.waitForTimeout(200);
  const ui3 = await page.evaluate(() => { const st = window.__pp.st, a = st.accs.find(x => x.u === st.acc.ring); return { r: a && a.r }; });
  check(ui3.r === 0, 'wearing the spare ring swaps it in');
  await page.evaluate(() => document.querySelector('[data-go="acc-off"]').click()); await page.waitForTimeout(200);
  const ui4 = await page.evaluate(() => window.__pp.st.acc.ring);
  check(ui4 === null, 'taking it off empties the slot');
  // salvage asks twice for Epic and up
  const sal = await page.evaluate(() => { const P = window.__pp, A = P.acc, st = P.st; const e = A.rollAccessory(80, { t: 'ring', r: 3 }); A.accBank([e]); P.acc.openAccs('ring'); const n0 = st.accs.length, c0 = st.coins; A.accScrap(e.u); const n1 = st.accs.length; A.accScrap(e.u); return { n0, n1, n2: st.accs.length, coins: st.coins - c0 }; });
  check(sal.n1 === sal.n0 && sal.n2 === sal.n0 - 1 && sal.coins === 250, 'an Epic is salvaged only on the second tap, for 250 coins');
  await page.evaluate(() => window.__pp.closeSheet());
  await page.waitForTimeout(400);
  const fit = await page.evaluate(() => { const ids = [...document.querySelectorAll('svg.accsvg [id]')].map(e => e.id); return { big: [...document.querySelectorAll('.dp-acc svg.accsvg')].filter(s => s.getBoundingClientRect().width > 60).length, n: document.querySelectorAll('.dp-acc svg.accsvg').length, dup: ids.length - new Set(ids).size }; });
  check(fit.n === 3 && fit.big === 0, 'every slot icon, the empty one too, stays inside its slot');
  check(fit.dup === 0, 'no two accessory drawings share a gradient id');
  await page.evaluate(() => document.querySelector('.dp-acc').scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/acc-lobby.png') });
  // 4. a Super Fiend's drops, picked up and banked
  await page.evaluate(() => { const P = window.__pp; P.st.accs = P.st.accs.slice(0, 4); P.dun.startDungeon(10, 7); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; return D && D.g.boss && D.g.boss.act !== 'enter'; }, null, { timeout: 40000 });
  const run = await page.evaluate(() => {
    const P = window.__pp, A = P.arc, G = A.game, D = G._dbg; A.paused = true; const m = D.g.boss, n0 = P.st.accs.length;
    m.hp = 1; D.hitMon(m, 50, {});
    // the drops come down a moment after it falls (in slow motion)
    let drops = 0; for (let i = 0; i < 60 * 6 && !drops; i++) { G.update(1 / 60); drops = D.picks.filter(p => p.kind === 'acc').length; }
    const rar = D.picks.filter(p => p.kind === 'acc').map(p => p.acc.r);
    // one is walked over; the rest are left lying where they fell, for the win to sweep up
    const accP = D.picks.filter(p => p.kind === 'acc'), one = accP[0]; accP.slice(1).forEach(p => { p.t = -999; }); one.x = D.me.x; one.y = D.me.y; one.t = 1;
    for (let i = 0; i < 30; i++) G.update(1 / 60);
    const got = D.g.accs.map(a => a.r), left = D.picks.filter(p => p.kind === 'acc').length;
    for (let i = 0; i < 60 * 12 && A.state !== 'done' && !document.querySelector('.rewards li'); i++) G.update(1 / 60);
    A.paused = false;
    return { drops, rar, got, left, n0 };
  });
  await page.waitForTimeout(1500);
  const end = await page.evaluate(() => ({ n: window.__pp.st.accs.length, lines: [...document.querySelectorAll('.rewards li')].map(l => l.textContent).filter(t => /Ring|Bracelet|Necklace/.test(t)) }));
  check(run.drops >= 2 && run.rar.every(r => r >= 2), 'a Super Fiend drops two or three pieces, Rare or better');
  check(run.got.length === 1 && run.left === run.drops - 1, 'one is picked up, the rest left lying');
  check(end.n >= run.n0 + run.drops, 'every piece is banked at the end of the run, those left lying swept up by the win');
  check(end.lines.length >= run.drops, 'the result screen lists them');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/acc-result.png') });
  console.log(JSON.stringify({ rolls: { f1: rolls.f1, f30: rolls.f30, f60: rolls.f60, f120: rolls.f120, fiend120: rolls.fiend120, names: rolls.names, lines: rolls.lines }, pet, run, end }, null, 1));
  console.log(fails.length ? 'accessories FAIL: ' + fails.join('; ') : 'accessories OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
