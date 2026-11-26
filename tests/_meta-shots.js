// v460 META: screenshots of the Pets & Team hub (three areas), the twins reveal, the fusion chance screens and the shop
// packs with the mock checkout, at DPR 1 and 3 (390x844). usage: HTML=test-meta.html node tests/_meta-shots.js [dpr...]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const HTML = process.env.HTML || 'test.html', OUT = path.resolve(__dirname, '../shots/v460-META');
const DPRS = process.argv.slice(2).map(Number).filter(Boolean); if (!DPRS.length) DPRS.push(1, 3);
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const errors = [], made = [];
  for (const dpr of DPRS) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + path.resolve(__dirname, '..', HTML));
    await page.waitForFunction(() => window.__pp, null, { timeout: 20000 }); await page.waitForTimeout(300);
    const shot = async (name, prep, wait) => { await page.evaluate(prep); await page.waitForTimeout(wait || 900); const f = path.join(OUT, `${name}-dpr${dpr}.png`); await page.screenshot({ path: f }); made.push(path.basename(f)); };
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Mochi'); P.st.lv10Eggs = 1; P.st.fps = false; setInterval(() => { if (P.st) P.st.lv10Eggs = 1; }, 50);
      const g5 = P.summonGenome(5, P.mulberry32(5150));
      for (let i = 0; i < 6; i++) { const f = P.newPetFields(['Pip', 'Taro', 'Bean', 'Kiwi', 'Luma', 'Tofu'][i], P.makeGenome(P.mulberry32(i * 31 + 9))); f.dlv = 12 + i * 3; P.st.others.push(f); }
      for (let i = 0; i < 24; i++) { const f = P.newPetFields('Star' + (i + 1), { dna: Object.assign({}, g5.dna, { seed: g5.dna.seed + i * 7 + 1 }), form: JSON.parse(JSON.stringify(g5.form)) }); f.dlv = 40 - i; P.st.others.push(f); }
      P.st.party = null; P.partyPets(); P.st.crystals = 2600; P.st.fusionStones = 12; P.closeSheet(); if (window.FPSM) {} });
    await page.waitForTimeout(500);
    // the hub
    await shot('hub-team', () => window.__pp.meta.openHub('team'), 2500);
    await shot('hub-team-loadout', () => { const el = document.querySelector('.dp-slots'); if (el) el.scrollIntoView({ block: 'start' }); }, 600);
    await shot('hub-card', () => { const P = window.__pp; P.meta.openHub('card', P.st.others[1].uid); }, 2500);
    await shot('hub-card-details', () => { const el = document.querySelector('.hub-card'); if (el) el.scrollIntoView({ block: 'start' }); }, 600);
    await shot('hub-collection', () => { const P = window.__pp; P.meta.openHub('pets', P.st.others[2].uid); }, 1200);
    await shot('hub-collection-grid', () => { const el = document.querySelector('.tm-all'); if (el) el.scrollIntoView({ block: 'start' }); }, 600);
    // fusion: a pair of five-stars, and 22 of them merging (past 20: the note)
    await shot('fusion-pair-chance', () => { const P = window.__pp, M = P.meta, a = P.st.others.findIndex(p => p.name === 'Star1'), b = P.st.others.findIndex(p => p.name === 'Star2'); M.openFusion(); M.fuseSel = { a, b, seed: 9, pick: null }; M.renderFusion(); const el = document.querySelector('.fuse-uses'); if (el) el.scrollIntoView({ block: 'end' }); }, 900);
    await shot('fusion-merge-chance', () => { const P = window.__pp, M = P.meta, gs = M.sameKindGroups(), gi = gs.findIndex(g => g.stars === 5 && g.pets.length >= 20); M.fuseAll(gi); const L = M.fuseAllList(gs[gi]).map(x => x.p.uid); for (const u of L.slice(22)) M.fuseAllToggle(gi, u); const el = document.querySelector('.fuse-uses'); if (el) el.scrollIntoView({ block: 'end' }); }, 900);
    await shot('fusion-merge-top', () => { const el = document.querySelector('[data-k="six-chance"]'); if (el) el.scrollIntoView({ block: 'center' }); }, 600);
    // the shop packs, then the development-only mock checkout after a success and a repeated callback
    await shot('shop-packs', () => { const P = window.__pp; P.closeSheet(); P.st.devPay = false; P.shop.openShop(); }, 900);
    await shot('shop-stones', () => { const el = document.querySelector('[data-shop-sec="stones"]'); if (el) el.scrollIntoView({ block: 'start' }); }, 500);
    await shot('shop-mock-checkout', () => { const P = window.__pp; P.st.devPay = true; P.meta.crystalPackTap('cr5k'); P.meta.mockPay('success'); P.meta.mockPay('dup'); }, 700);
    await page.evaluate(() => { const P = window.__pp; P.st.devPay = false; P.closeSheet(); });
    // the twins reveal: the first-ever six-star roll
    await page.evaluate(() => { const P = window.__pp; P.st.dev6 = true; P.st.crystals = 5000; P.st.twinGuaranteeUsed = 0; P.st.twinIntro = 0; P.meta.TWIN_RNG.f = () => 0.99; P.doSummon(1); P.st.dev6 = false; });
    await page.waitForTimeout(700); await page.evaluate(() => document.querySelector('#gwBox').click()); await page.waitForTimeout(2800);
    await shot('twins-reveal', () => {}, 100);
    await page.evaluate(() => document.querySelector('[data-gw="done"]').click());
    // a ten-roll with two pairs of twins
    await page.evaluate(() => { const P = window.__pp; P.st.others = P.st.others.slice(0, 10); P.st.dev6 = true; P.st.crystals = 5000; let k = 0; P.meta.TWIN_RNG.f = () => [0.9, 0.1, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9, 0.9][k++] ?? 0.9; P.doSummon(10); P.st.dev6 = false; });
    await page.waitForTimeout(700); await page.evaluate(() => document.querySelector('#gwBox').click()); await page.waitForTimeout(4200);
    await shot('twins-ten-roll', () => {}, 100);
    await page.close();
  }
  fs.writeFileSync(path.join(OUT, 'done.txt'), `v460 META shots (${new Date().toISOString()}), 390x844, DPR ${DPRS.join(' and ')}, SwiftShader headless Chromium:\n${made.join('\n')}\npage errors: ${errors.length}\n${errors.slice(0, 5).join('\n')}\n`);
  console.log(made.length, 'shots; page errors:', errors.length, errors.slice(0, 5));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
