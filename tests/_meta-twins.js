// v460 META: six-star twins. Seeded and boundary checks of the one 25% twin check, a large simulated sample, the
// first-roll guarantee with its exact message (once), multi-roll order, the mystery-egg path, fusion leaving the
// guarantee alone, the save migration, and save/reload. usage: HTML=test-meta.html node tests/_meta-twins.js [shotsDir]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const HTML = process.env.HTML || 'test.html', SHOTS = process.argv[2] || null;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 20000 }); await page.waitForTimeout(300);
  const openBox = () => page.evaluate(() => { const b = document.querySelector('#gwBox'); if (!document.querySelector('#giftWrap').hidden && !b.hidden) b.click(); });
  const fails = [], passes = []; const ok = (c, what, info) => { (c ? passes : fails).push(what + (c || info === undefined ? '' : ' :: ' + JSON.stringify(info))); };

  // 1. pure: seeded and boundary cases of twinResolve
  const pure = await page.evaluate(() => {
    const P = window.__pp, M = P.meta, out = {};
    const at = v => () => v;
    out.first = M.twinResolve([3, 4, 6, 5, 6, 6], false, at(0.99)).list.map(r => [r.stars, r.twin, r.sure]);
    out.used = M.twinResolve([6, 6], true, at(0.99)).list.map(r => r.twin);
    out.below = M.twinResolve([6], true, at(0.2499999)).list[0].twin;
    out.edge = M.twinResolve([6], true, at(0.25)).list[0].twin;
    out.zero = M.twinResolve([6], true, at(0)).list[0].twin;
    out.low = M.twinResolve([3, 4, 5], false, at(0)).list.map(r => r.twin);   // (never a twin below 6★, and the guarantee stays)
    out.lowUsed = M.twinResolve([3, 4, 5], false, at(0)).used;
    // the dice are drawn once per later 6★, and never for the guaranteed one or a lower roll
    let draws = 0; const R = () => { draws++; return 0.5; }; M.twinResolve([6, 3, 6, 6, 4], false, R); out.draws = draws;
    // a large sample: later 6★ rolls (seeded), the share of twins
    const R2 = P.mulberry32(460460); let tw = 0; const N = 400000; for (let i = 0; i < N; i++) if (M.twinResolve([6], true, R2).list[0].twin) tw++;
    out.rate = tw / N; out.N = N;
    // and the base 6★ rate is unchanged (rollStars, 1 in 100)
    const R3 = P.mulberry32(77); let six = 0; const N3 = 400000; for (let i = 0; i < N3; i++) if (P.rollStars(R3) === 6) six++;
    out.six = six / N3;
    out.msg = M.TWIN_MSG; out.chance = M.TWIN_CHANCE;
    return out;
  });
  ok(JSON.stringify(pure.first) === JSON.stringify([[3, false, false], [4, false, false], [6, true, true], [5, false, false], [6, false, false], [6, false, false]]), 'first 6★ in a multi-roll takes the guarantee, in order; later ones roll (0.99: no twin)', pure.first);
  ok(pure.used.every(t => !t), 'guarantee used: 0.99 gives no twins', pure.used);
  ok(pure.below === true && pure.edge === false && pure.zero === true, 'boundary: R < 0.25 twins, R = 0.25 does not', [pure.below, pure.edge, pure.zero]);
  ok(pure.low.every(t => !t) && pure.lowUsed === false, 'no twin below 6★, and lower rolls never spend the guarantee');
  ok(pure.draws === 2, 'one twin check per later 6★ (none for the guaranteed one or lower rolls)', pure.draws);
  ok(Math.abs(pure.rate - 0.25) < 0.004, `large sample: ${(pure.rate * 100).toFixed(2)}% twins over ${pure.N} later 6★ rolls`, pure.rate);
  ok(Math.abs(pure.six - 0.01) < 0.0008, `base 6★ rate unchanged: ${(pure.six * 100).toFixed(3)}%`, pure.six);
  ok(pure.msg === 'congrats, sometimes there’s a twins and this can happen' && pure.chance === 0.25, 'the exact message and 25%');

  // 2. in the game: a fresh account, the first 6★ single summon is twins, with the message, both 6★, separate ids
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Twinner'); P.st.crystals = 100000; P.st.dev6 = true; P.closeSheet(); });
  await page.waitForTimeout(400);
  const g1 = await page.evaluate(() => { const P = window.__pp, n0 = P.st.others.length; P.meta.TWIN_RNG.f = () => 0.99; P.doSummon(1); const add = P.st.others.slice(n0); return { add: add.length, stars: add.map(p => P.starsOf(p.rarity)), uids: add.map(p => p.uid), used: P.st.twinGuaranteeUsed, intro: P.st.twinIntro, ls: JSON.parse(localStorage.getItem('pocket-pet-v1')) }; });
  ok(g1.add === 2 && g1.stars.every(s => s === 6) && g1.uids[0] !== g1.uids[1], 'first-ever 6★ roll awards two 6★ pets with separate ids (even with the dice at 0.99)', g1);
  ok(g1.used === 1 && g1.ls.twinGuaranteeUsed === 1 && g1.uids.every(u => g1.ls.others.some(p => p.uid === u)), 'the guarantee is saved in the same save as both pets', { used: g1.used, saved: g1.ls.twinGuaranteeUsed });
  await page.waitForTimeout(700); await openBox(); await page.waitForTimeout(2600);
  const rv = await page.evaluate(() => ({ title: document.querySelector('#gwTitle').textContent, msg: (document.querySelector('#gwTwinMsg') || {}).textContent || null, tiles: document.querySelectorAll('.gw-tile.k-twins').length, pets: document.querySelectorAll('.gw-tile.k-twins .gw-item.gw-pet.s6').length, intro: window.__pp.st.twinIntro }));
  ok(rv.title === 'SIX-STAR TWINS!' && rv.tiles === 1 && rv.pets === 2, 'the twins reveal: one Twins tile showing both 6★ pets', rv);
  ok(rv.msg === 'congrats, sometimes there’s a twins and this can happen' && rv.intro === 2, 'the exact message shows with the first guaranteed twins, and is marked shown', rv);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'twins-reveal-dpr1.png') });
  await page.click('[data-gw="done"]'); await page.waitForTimeout(300);

  // 3. later 6★ rolls: 25% check; the message never again
  const g2 = await page.evaluate(() => { const P = window.__pp, n0 = P.st.others.length; P.meta.TWIN_RNG.f = () => 0.3; P.doSummon(1); return { add: P.st.others.length - n0 }; });
  await page.waitForTimeout(700); await openBox(); await page.waitForTimeout(1800);
  const m2 = await page.evaluate(() => ({ msg: !!document.querySelector('#gwTwinMsg'), title: document.querySelector('#gwTitle').textContent }));
  await page.click('[data-gw="done"]'); await page.waitForTimeout(200);
  ok(g2.add === 1 && !m2.msg && m2.title === 'A SIX-STAR LEGENDARY!', 'a later 6★ with the dice at 0.30: one pet, no message', { g2, m2 });
  const g3 = await page.evaluate(() => { const P = window.__pp, n0 = P.st.others.length; P.meta.TWIN_RNG.f = () => 0.1; P.doSummon(1); const add = P.st.others.slice(n0); return { add: add.length, stars: add.map(p => P.starsOf(p.rarity)) }; });
  await page.waitForTimeout(700); await openBox(); await page.waitForTimeout(1800);
  const m3 = await page.evaluate(() => ({ msg: !!document.querySelector('#gwTwinMsg'), title: document.querySelector('#gwTitle').textContent }));
  await page.click('[data-gw="done"]'); await page.waitForTimeout(200);
  ok(g3.add === 2 && g3.stars.every(s => s === 6) && !m3.msg && m3.title === 'SIX-STAR TWINS!', 'a later 6★ with the dice at 0.10: twins, both 6★, no message', { g3, m3 });

  // 4. a ten-roll, resolved in order: guarantee (reset by the developer button) on the first 6★ only
  const g4 = await page.evaluate(() => { const P = window.__pp; P.st.twinGuaranteeUsed = 0; P.st.twinIntro = 0; const n0 = P.st.others.length; let k = 0; P.meta.TWIN_RNG.f = () => [0.9, 0.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9][k++] ?? 0.9; P.doSummon(10); const add = P.st.others.slice(n0); return { add: add.length, names: add.map(p => p.name), stars: add.map(p => P.starsOf(p.rarity)), draws: k, used: P.st.twinGuaranteeUsed }; });
  // eggs: 1st 6★ = guaranteed twin (no draw), 2nd..10th draw 0.9, 0.1 (twin), 0.9...: 10 + 1 + 1 = 12 pets, twin pets right after their egg
  ok(g4.add === 12 && g4.draws === 9 && g4.stars.every(s => s === 6) && /II$/.test(g4.names[1]) && /II$/.test(g4.names[4]) && g4.used === 1, 'ten 6★ eggs: guaranteed twins on egg 1, one more by the dice on egg 3, in order', g4);
  await page.waitForTimeout(700); await openBox(); await page.waitForTimeout(3600);
  const m4 = await page.evaluate(() => ({ msg: (document.querySelector('#gwTwinMsg') || {}).textContent || null, twins: document.querySelectorAll('.gw-tile.k-twins').length, tiles: document.querySelectorAll('.gw-tile').length }));
  ok(m4.twins === 2 && m4.tiles === 10 && m4.msg, 'the ten-roll reveal: 10 tiles, two of them Twins', m4);
  if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'twins-ten-roll-dpr1.png') });
  await page.click('[data-gw="done"]'); await page.waitForTimeout(200);

  // 5. save and reload: the flag and every pet survive, and a reload cannot repeat the guarantee
  const before = await page.evaluate(() => { const P = window.__pp; P.saveLocalNow(); return { n: P.st.others.length, used: P.st.twinGuaranteeUsed, uids: P.st.others.map(p => p.uid) }; });
  await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st, null, { timeout: 20000 }); await page.waitForTimeout(600);
  const after = await page.evaluate(() => { const P = window.__pp; return { n: P.st.others.length, used: P.st.twinGuaranteeUsed, uniq: new Set(P.st.others.map(p => p.uid).concat([P.st.uid])).size }; });
  ok(after.n === before.n && after.used === 1 && after.uniq === before.n + 1, 'after a reload: all pets (unique ids) and the used guarantee are there', { before: before.n, after });
  const g5 = await page.evaluate(() => { const P = window.__pp; P.closeSheet(); P.st.dev6 = true; P.st.crystals = 10000; P.meta.TWIN_RNG.f = () => 0.99; const n0 = P.st.others.length; P.doSummon(1); return P.st.others.length - n0; });
  ok(g5 === 1, 'after reload the next 6★ is not guaranteed (0.99: one pet)', g5);
  await page.waitForTimeout(700); await openBox(); await page.waitForTimeout(1500); await page.click('[data-gw="done"]'); await page.waitForTimeout(200);

  // 6. migration: an old save (no flag) that owns an egg 6★ counts as used; one with only a fused 6★ or none keeps it
  const mig = await page.evaluate(() => {
    const P = window.__pp, base = P.serialize(); delete base.twinGuaranteeUsed; delete base.twinIntro;
    const six = base.others.find(p => P.starsOf(p.rarity) >= 6);
    const a = JSON.parse(JSON.stringify(base)); const A = P.sanitize(a);
    const b = JSON.parse(JSON.stringify(base)); b.others = b.others.filter(p => P.starsOf(p.rarity) < 6); if (P.starsOf(b.rarity) >= 6) b.rarity = 2; const B = P.sanitize(b);
    const c = JSON.parse(JSON.stringify(b)); const f = JSON.parse(JSON.stringify(six)); f.fusedFrom = ['X', 'Y']; f.gen = 1; c.others.push(f); const C = P.sanitize(c);
    const d = JSON.parse(JSON.stringify(base)); d.twinGuaranteeUsed = 0; const D = P.sanitize(d);
    return { egg6: A.twinGuaranteeUsed, intro: A.twinIntro, none: B.twinGuaranteeUsed, fused6: C.twinGuaranteeUsed, kept0: D.twinGuaranteeUsed };
  });
  ok(mig.egg6 === 1 && mig.intro === 2 && mig.none === 0 && mig.fused6 === 0 && mig.kept0 === 0, 'migration: owns an egg 6★ → used (no message); none or only fused 6★ → guarantee kept; a saved flag is kept as is', mig);

  // 7. fusion: two 5★ fused into a 6★ never touch the guarantee
  const fu = await page.evaluate(() => { const P = window.__pp; P.st.twinGuaranteeUsed = 0; P.st.twinIntro = 0; P.st.dev6 = false;
    const g = P.summonGenome(5, P.mulberry32(11)), a = P.newPetFields('FiveA', g), b = P.newPetFields('FiveB', { dna: Object.assign({}, g.dna, { seed: g.dna.seed + 1 }), form: JSON.parse(JSON.stringify(g.form)) });
    P.st.others.push(a, b); P.st.fusionStones = 5; const n0 = P.meta.petCount();
    P.meta.fuseSel = { a: P.st.others.indexOf(a), b: P.st.others.indexOf(b), seed: 5, pick: null };
    const R = Math.random; Math.random = () => 0.01; try { P.meta.openFusion(); P.meta.fuseSel = { a: P.st.others.indexOf(a), b: P.st.others.indexOf(b), seed: 5, pick: null }; P.meta.fusePets(); } finally { Math.random = R; }
    return { stars: P.starsOf(P.st.rarity), used: P.st.twinGuaranteeUsed, n: P.meta.petCount(), n0 }; });
  ok(fu.stars === 6 && fu.used === 0 && fu.n === fu.n0 - 1, 'a fusion 6★ leaves the first-roll guarantee unspent', fu);
  await page.waitForTimeout(5500); await page.evaluate(() => { const b = document.querySelector('#evoDone'); if (b && !b.hidden) b.click(); });

  // 8. the mystery egg is a gacha roll too: a 6★ hatch gets the same check (guarantee unspent → twins)
  const eg = await page.evaluate(() => { const P = window.__pp; P.meta.TWIN_RNG.f = () => 0.99; const g = P.summonGenome(6, P.mulberry32(3)); const f = P.newPetFields('Eggy', g); P.st.others.push(f); const n0 = P.st.others.length; P.meta.eggTwinCheck(f); return { add: P.st.others.length - n0, used: P.st.twinGuaranteeUsed, last: P.starsOf(P.st.others[P.st.others.length - 1].rarity), name: P.st.others[P.st.others.length - 1].name }; });
  ok(eg.add === 1 && eg.used === 1 && eg.last === 6 && eg.name === 'Eggy II', 'a 6★ mystery egg spends the guarantee on twins', eg);
  await page.waitForTimeout(1200); await page.evaluate(() => { const b = document.querySelector('#gwBox'); if (b && !document.querySelector('#giftWrap').hidden) b.click(); }); await page.waitForTimeout(1600);

  // 9. a full house: the twin waits (owed, same golden body) and moves in when a place frees up
  const ow = await page.evaluate(() => { const P = window.__pp; P.closeSheet(); document.querySelector('[data-gw="done"]') && document.querySelector('#giftWrap').hidden === false && document.querySelector('[data-gw="done"]').click();
    while (P.meta.petCount() < 49) { const g = P.makeGenome(P.mulberry32(P.meta.petCount() * 7 + 1)); P.st.others.push(P.newPetFields('Fill', g)); }
    P.st.dev6 = true; P.st.crystals = 10000; P.meta.TWIN_RNG.f = () => 0.0; P.doSummon(1); P.st.dev6 = false;
    return { n: P.meta.petCount(), owed: P.st.twinOwed.length, saved: JSON.parse(localStorage.getItem('pocket-pet-v1')).twinOwed.length }; });
  ok(ow.n === 50 && ow.owed === 1 && ow.saved === 1, 'house full: the egg fills the last place and its twin is owed (saved)', ow);
  await page.waitForTimeout(700); await openBox(); await page.waitForTimeout(1500); await page.click('[data-gw="done"]'); await page.waitForTimeout(200);
  const ow2 = await page.evaluate(async () => { const P = window.__pp; P.st.others.splice(0, 1); P.closeSheet(); P.meta.twinOwedCheck(); return { n: P.meta.petCount(), owed: P.st.twinOwed.length, last: P.starsOf(P.st.others[P.st.others.length - 1].rarity) }; });
  ok(ow2.n === 50 && ow2.owed === 0 && ow2.last === 6, 'a freed place: the owed 6★ twin moves in', ow2);

  console.log(passes.map(p => 'PASS ' + p).join('\n'));
  console.log(fails.map(p => 'FAIL ' + p).join('\n'));
  console.log(`${passes.length} passed, ${fails.length} failed; page errors: ${errors.length}`); errors.slice(0, 6).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(fails.length || errors.length ? 1 : 0);
})();
