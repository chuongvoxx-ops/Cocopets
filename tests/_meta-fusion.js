// v460 META: five-star fusion into six stars. The chance min(1, 0.10 + 0.05 (n - 2)) at 2, 3, 4, 10, 19, 20 and more
// than 20 pets; the live chance and the exact pets shown before confirming; one roll at the boundary; ingredients and
// stones consumed once (saved before the cinematic); the ordinary five-star child when the roll fails; leaving pets out.
// usage: HTML=test-meta.html node tests/_meta-fusion.js [shotsDir]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const HTML = process.env.HTML || 'test.html', SHOTS = process.argv[2] || null;
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 20000 }); await page.waitForTimeout(300);
  const fails = [], passes = []; const ok = (c, what, info) => { (c ? passes : fails).push(what + (c || info === undefined ? '' : ' :: ' + JSON.stringify(info))); };
  const finish = () => page.evaluate(() => new Promise(res => { const t0 = Date.now(); const k = () => { const d = document.querySelector('#evoDone'); if (d && !d.hidden) { d.click(); res(true); } else if (Date.now() - t0 > 20000) res(false); else setTimeout(k, 200); }; k(); }));

  // 1. the formula, exactly, and more pets never past 100%
  const ch = await page.evaluate(() => { const M = window.__pp.meta; return [2, 3, 4, 10, 19, 20, 21, 25, 49, 200].map(n => [n, M.fuseUpChance(5, n)]).concat([['full', M.fuseUpFull(5)], ['3★ at 2', M.fuseUpChance(3, 2)], ['4★ at 2', M.fuseUpChance(4, 2)]]); });
  const want = { 2: 0.1, 3: 0.15, 4: 0.2, 10: 0.5, 19: 0.95, 20: 1, 21: 1, 25: 1, 49: 1, 200: 1, full: 20, '3★ at 2': 0.2, '4★ at 2': 0.25 };
  ok(ch.every(([n, v]) => v === want[n]), 'chance table: 2→10%, 3→15%, 4→20%, 10→50%, 19→95%, 20+→100% (exact), 3★/4★ unchanged', ch);

  // a house with 30 five-stars of one kind (same element: copies of one body with their own seeds) and two of another
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Lead'); P.st.lv10Eggs = 1; P.closeSheet(); });
  const reset = () => page.evaluate(() => { const P = window.__pp; P.closeSheet(); P.st.others = [];
    const g = P.summonGenome(5, P.mulberry32(5150)); window.__five = [];
    for (let i = 0; i < 30; i++) { const f = P.newPetFields('Five' + i, { dna: Object.assign({}, g.dna, { seed: g.dna.seed + i * 7 + 1 }), form: JSON.parse(JSON.stringify(g.form)) }); f.dlv = 60 - i; P.st.others.push(f); window.__five.push(f.uid); }
    P.st.fusionStones = 200; P.st.party = null; P.partyPets(); });
  await reset();
  const grp = () => page.evaluate(() => { const M = window.__pp.meta, gs = M.sameKindGroups(); const gi = gs.findIndex(g => g.stars === 5 && g.pets.length >= 2 && g.pets.some(x => window.__five.includes(x.p.uid))); return { gi, n: gi >= 0 ? gs[gi].pets.length : 0 }; });

  // 2. a pair: the live 10% and both pets shown; the roll at 0.0999 rises, at 0.10 it does not (an ordinary five-star)
  for (const [r, six] of [[0.0999, true], [0.1, false]]) {
    const pr = await page.evaluate(r => { const P = window.__pp, M = P.meta, ids = window.__five.filter(u => P.st.others.some(p => p.uid === u)).slice(0, 2);
      const ia = P.st.others.findIndex(p => p.uid === ids[0]), ib = P.st.others.findIndex(p => p.uid === ids[1]);
      M.openFusion(); M.fuseSel = { a: ia, b: ib, seed: 77, pick: null }; M.renderFusion();
      const ui = { chance: (document.querySelector('.fuse-uses .fu-chance b') || {}).textContent, names: [...document.querySelectorAll('.fuse-uses .fu-list li b')].map(b => b.textContent), note: !!document.querySelector('[data-k="six-chance"]') };
      const n0 = P.meta.petCount(), s0 = P.st.fusionStones, Rr = Math.random; Math.random = () => r;
      try { M.fusePets(); } finally { Math.random = Rr; }
      const saved = JSON.parse(localStorage.getItem('pocket-pet-v1'));
      return { ui, stars: P.starsOf(P.st.rarity), n: P.meta.petCount(), n0, stones: P.st.fusionStones, s0, gone: ids.every(u => !P.st.others.some(p => p.uid === u) && P.st.uid !== u), savedNow: saved.fusionStones === s0 - 1 && saved.uid === P.st.uid, names: ids.map(u => u) }; }, r);
    if (SHOTS && r === 0.0999) {}   // (the pair UI shot is taken below)
    ok(pr.ui.chance === '10%' && pr.ui.names.length === 2 && pr.ui.note, `pair: the live chance 10% and the two pets shown before confirming`, pr.ui);
    ok(pr.stars === (six ? 6 : 5) && pr.n === pr.n0 - 1 && pr.stones === pr.s0 - 1 && pr.gone && pr.savedNow, `pair, roll ${r}: ${six ? 'a six-star' : 'an ordinary five-star, no other penalty'}; both parents and one stone consumed once, saved before the cinematic`, pr);
    await finish(); await page.waitForTimeout(300);
  }
  // the pair screen, for the record
  await page.evaluate(() => { const P = window.__pp, M = P.meta, ids = window.__five.filter(u => P.st.others.some(p => p.uid === u)).slice(0, 2); M.openFusion(); M.fuseSel = { a: P.st.others.findIndex(p => p.uid === ids[0]), b: P.st.others.findIndex(p => p.uid === ids[1]), seed: 9, pick: null }; M.renderFusion(); const el = document.querySelector('.fuse-uses'); if (el) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(400); if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'fusion-pair-chance-dpr1.png') });
  await page.evaluate(() => window.__pp.closeSheet());

  // 3. merge all: n = 3, 19, 20, 25 (leaving the rest out), the live chance, the exact list, the "cannot raise further" note
  const cases = [[3, 0.1499, 6], [3, 0.15, 5], [19, 0.9499, 6], [19, 0.95, 5], [20, 0.99999, 6], [25, 0.99999, 6]];
  for (const [n, r, expStars] of cases) {
    await reset(); const G = await grp();
    if (G.n < n) { ok(false, `merge ${n}: only ${G.n} five-stars of the kind left`); continue; }
    const res = await page.evaluate(([gi, n, r]) => { const P = window.__pp, M = P.meta; const g = M.sameKindGroups()[gi];
      M.fuseAll(gi);   // (the confirm screen with all of them)
      // leave out all but n, by tapping (fuseAllToggle) the weakest
      const order = M.fuseAllList(g).map(x => x.p.uid); for (const u of order.slice(n).reverse()) M.fuseAllToggle(gi, u);
      const L = M.fuseAllList(M.sameKindGroups()[gi]).map(x => x.p.uid);
      const ui = { chance: (document.querySelector('.fuse-uses .fu-chance b') || {}).textContent, listed: [...document.querySelectorAll('.fuse-uses .fu-list li')].length, over: /cannot raise it further/.test((document.querySelector('[data-k="six-chance"]') || {}).textContent || ''), go: !!document.querySelector('[data-go="fuse-all-go"]'), stonesTxt: (document.querySelector('.fuse-uses .fu-top') || {}).textContent };
      return { L, ui }; }, [G.gi, n, r]);
    if (SHOTS && n === 25) { await page.evaluate(() => { const el = document.querySelector('.fuse-uses'); if (el) el.scrollIntoView({ block: 'center' }); }); await page.waitForTimeout(300); await page.screenshot({ path: path.join(SHOTS, 'fusion-merge25-chance-dpr1.png') }); }
    const pct = Math.round(Math.min(1, 0.1 + 0.05 * (n - 2)) * 100) + '%';
    ok(res.L.length === n && res.ui.chance === pct && res.ui.listed === n && res.ui.over === (n > 20) && res.ui.go, `merge ${n}: live chance ${pct}, exactly ${n} pets listed${n > 20 ? ', and "more pets cannot raise it further"' : ''}`, res.ui);
    const ex = await page.evaluate(([gi, n, r, L]) => { const P = window.__pp, M = P.meta; const n0 = M.petCount(), s0 = P.st.fusionStones, need = P.shop.fuseStonesFor(n), others0 = P.st.others.filter(p => !L.includes(p.uid)).map(p => p.uid); const lead0 = P.st.uid;
      const Rr = Math.random; let draws = 0; Math.random = () => { draws++; return r; };
      try { M.fuseAll(gi, true); } finally { Math.random = Rr; }
      const child = L.includes(lead0) ? P.st : P.st.others[P.st.others.length - 1], saved = JSON.parse(localStorage.getItem('pocket-pet-v1'));
      return { stars: P.starsOf(child.rarity), n: M.petCount(), n0, stones: P.st.fusionStones, s0, need, gone: L.every(u => !P.st.others.some(p => p.uid === u)), kept: others0.every(u => P.st.others.some(p => p.uid === u)), saved: saved.fusionStones === s0 - need && saved.others.length === P.st.others.length, draws }; }, [G.gi, n, r, res.L]);
    ok(ex.stars === expStars && ex.n === ex.n0 - n + 1 && ex.stones === ex.s0 - ex.need && ex.gone && ex.kept && ex.saved, `merge ${n}, roll ${r}: ${expStars === 6 ? 'six-star' : 'ordinary five-star'}; exactly the ${n} chosen consumed, ${ex.need} stones, the others kept, saved at once`, ex);
    await finish(); await page.waitForTimeout(300);
  }

  // 4. not enough stones: nothing consumed
  const ns = await page.evaluate(() => { const P = window.__pp, M = P.meta; const gs = M.sameKindGroups(); const gi = gs.findIndex(g => g.pets.length >= 3); if (gi < 0) return null; P.st.fusionStones = 0; const n0 = M.petCount(); M.fuseAll(gi, true); return { n: M.petCount(), n0, sheet: P.sheetKind }; });
  ok(!ns || (ns.n === ns.n0 && ns.sheet === 'crystals'), 'no stones: the merge does nothing and opens the crystal shop', ns);

  console.log(passes.map(p => 'PASS ' + p).join('\n'));
  console.log(fails.map(p => 'FAIL ' + p).join('\n'));
  console.log(`${passes.length} passed, ${fails.length} failed; page errors: ${errors.length}`); errors.slice(0, 6).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(fails.length || errors.length ? 1 : 0);
})();
