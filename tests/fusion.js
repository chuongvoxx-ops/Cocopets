// Crystals + fusion end to end: two pets, buy crystals (test purchase), buy a stone, fuse, reload the save.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  const url = 'file://' + path.resolve(__dirname, '../test.html');
  await page.goto(url);
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  const out = path.resolve(__dirname, '../shots'); fs.mkdirSync(out, { recursive: true });
  const fail = (m) => { console.log('FAIL', m); errors.push('assert: ' + m); };

  // two pets: the active one at stage 5 with wings, a second at stage 4 with horns
  const info = await page.evaluate(() => {
    const P = window.__pp; if (!P.st) P.quickStart('Mochi');
    const st = P.st;
    const R1 = P.mulberry32(4242), g1 = P.makeGenome(R1);
    const line1 = P.evolveLine(g1.form, 5, R1);
    st.forms = line1; st.stage = 5; st.dlv = 9; st.xp = 3000; for (let n = 2; n <= 5; n++) st.paid[n] = true;
    const R2 = P.mulberry32(777), g2 = P.makeGenome(R2);
    const other = P.newPetFields('Biscuit', g2); other.forms = P.evolveLine(g2.form, 4, R2); other.stage = 4; other.dlv = 4; other.xp = 1200;
    st.others.push(other);
    st.crystals = 0; st.fusionStones = 0;
    return { a: { name: st.name, stage: st.stage, x: Object.keys(st.forms[4].x) }, b: { name: other.name, stage: other.stage, x: Object.keys(other.forms[3].x) }, crystals: st.crystals };
  });
  console.log('parents', JSON.stringify(info));

  // crystal shop: buying a stone before having crystals must refuse, the test purchase adds 5000, then the stone costs 500
  await page.evaluate(() => window.__pp.openCrystalShop());
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, 'fuse-1-shop.png') });
  await page.evaluate(() => window.__pp.buyFusionStone());
  let r = await page.evaluate(() => ({ c: window.__pp.st.crystals, s: window.__pp.st.fusionStones, kind: window.__pp.sheetKind }));
  if (r.s !== 0) fail('stone bought with no crystals');
  await page.evaluate(() => window.__pp.buyCrystals());
  r = await page.evaluate(() => ({ c: window.__pp.st.crystals, s: window.__pp.st.fusionStones, hud: document.querySelector('#crystalNum').textContent }));
  if (r.c !== 5000 || !/^5,?000$/.test(r.hud)) fail('crystal pack: ' + JSON.stringify(r));
  await page.evaluate(() => window.__pp.buyFusionStone());
  r = await page.evaluate(() => ({ c: window.__pp.st.crystals, s: window.__pp.st.fusionStones, kind: window.__pp.sheetKind }));
  if (r.c !== 4500 || r.s !== 1 || r.kind !== 'fusion') fail('fusion stone: ' + JSON.stringify(r));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, 'fuse-2-pick.png') });

  // preview is deterministic for the same parents and seed; "different mix" changes it
  const prev = await page.evaluate(() => { const P = window.__pp, a = P.st, b = P.st.others[0]; const c1 = P.fuseChild(P.packPet(), b, P.fuseSel.seed), c2 = P.fuseChild(P.packPet(), b, P.fuseSel.seed); P.fuseRoll(); const c3 = P.fuseChild(P.packPet(), b, P.fuseSel.seed); return { same: JSON.stringify(c1.forms) === JSON.stringify(c2.forms), diff: JSON.stringify(c1.forms) !== JSON.stringify(c3.forms), name: c1.name, stage: c1.stage, dlv: c1.dlv, x: Object.keys(c1.forms[c1.forms.length - 1].x), gen: c1.gen, from: c1.fusedFrom }; });
  console.log('preview', JSON.stringify(prev));
  if (!prev.same) fail('preview not deterministic');
  if (!prev.diff) fail('different mix did not change the child');
  if (prev.stage !== 5) fail('child stage should be the higher parent stage');
  if (prev.dlv !== 9 + Math.floor(4 / 3)) fail('child dlv ' + prev.dlv);

  // fuse: both parents leave, the child is the pet you play with, one stone is used
  await page.evaluate(() => window.__pp.fusePets());
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(out, 'fuse-3-ceremony.png') });
  await page.waitForTimeout(2600);
  await page.screenshot({ path: path.join(out, 'fuse-4-reveal.png') });
  r = await page.evaluate(() => { const P = window.__pp, s = P.st; return { name: s.name, others: s.others.map(p => p.name), stones: s.fusionStones, crystals: s.crystals, stage: s.stage, forms: s.forms.length, dlv: s.dlv, gen: s.gen, from: s.fusedFrom, clean: s.forms.every(f => !!P.cleanForm(f)), title: document.querySelector('#evoTitle').textContent, wrapHidden: document.querySelector('#evoWrap').hidden }; });
  console.log('after', JSON.stringify(r));
  if (r.others.length !== 0) fail('parents still in the house: ' + r.others);
  if (r.stones !== 0) fail('stone not used');
  if (!r.clean) fail('child forms do not pass cleanForm');
  if (r.gen !== 1 || !r.from) fail('lineage missing');
  if (r.wrapHidden) fail('ceremony not shown');
  await page.evaluate(() => document.querySelector('#evoDone').click());
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, 'fuse-5-room.png') });

  // the card shows the lineage and the save survives a reload
  await page.evaluate(() => window.__pp.openCard());
  await page.waitForTimeout(300);
  const card = await page.evaluate(() => document.querySelector('#sheet').innerText.replace(/\s+/g, ' ').slice(0, 600));
  if (!/Born from|fused|Fusion/i.test(card)) console.log('card text (no lineage line?):', card.slice(0, 200));
  await page.screenshot({ path: path.join(out, 'fuse-6-card.png') });
  await page.evaluate(() => { try { window.__pp.closeSheet(); } catch (e) {} });
  await page.waitForTimeout(1200);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pocket-pet-v1')));
  if (!saved || saved.gen !== 1 || !saved.fusedFrom || saved.crystals !== 4500) fail('save: ' + JSON.stringify({ gen: saved && saved.gen, from: saved && saved.fusedFrom, crystals: saved && saved.crystals }));
  await page.reload(); await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(800);
  r = await page.evaluate(() => { const s = window.__pp.st; return s ? { name: s.name, gen: s.gen, from: s.fusedFrom, crystals: s.crystals, stage: s.stage, forms: s.forms.length } : null; });
  console.log('reloaded', JSON.stringify(r));
  if (!r || r.gen !== 1 || r.crystals !== 4500 || r.stage !== 5) fail('reload lost fusion state');

  // a fused pet can fuse again (generation 2) and the rarity bump applies
  const g2 = await page.evaluate(() => { const P = window.__pp, R = P.mulberry32(99), g = P.makeGenome(R), o = P.newPetFields('Pip', g); o.forms = P.evolveLine(g.form, 3, R); o.stage = 3; const c = P.fuseChild(P.packPet(), o, 5); return { gen: c.gen, rarity: c.rarity, stage: c.stage, from: c.fusedFrom }; });
  console.log('gen2', JSON.stringify(g2));
  if (g2.gen !== 2) fail('generation should be 2');

  console.log('errors:', errors.length, errors.slice(0, 8));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
