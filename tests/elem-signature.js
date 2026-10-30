// Five- and six-star pets start with their own element's signature Strong and Ultimate (one pair per pet, by its seed),
// a six-star now and then keeps a golden move instead, lower stars keep their old pools, and the moves carry the pet's stage.
// usage: node tests/elem-signature.js   (HTML=test-x.html for a build of your own)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Sig'); const out = { 4: [], 5: [], 6: [] };
    let seed = 1; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (const stars of [4, 5, 6]) for (let i = 0; i < (stars === 4 ? 6 : 40); i++) {
      const g = P.summonGenome(stars, R), p = Object.assign({}, P.st, { forms: g.forms || [g.form], dna: Object.assign({}, P.st.dna, { seed: 1000 + i * 7919 + stars }), stage: 1, abOv: null, deck: {} });
      if (!g.forms) p.forms = [g.form];
      const el = P.petElement(p), AB = P.petAbility(P.formOf ? P.formOf(p) : p.forms[0], p.dna.seed), s = P.innateAbility('strong', AB, p), u = P.innateAbility('ult', AB, p);
      const p7 = Object.assign({}, p, { stage: 7 }), k7 = P.dun.petKit(p7).kit;
      out[stars].push({ el, s: s.key, u: u.key, sig: !!(s.sig && u.sig), sEl: s.e8 || null, uEl: u.e8 || null, evo1: s.evo || null, evo7: k7.strong.evo || null, ult7: k7.ult.name, ult7m: +(k7.ult.mult / u.mult).toFixed(2) });
    }
    return out;
  });
  const five = r[5], six = r[6];
  ok(five.every(x => x.s.startsWith('ex_') && x.u.startsWith('ey_') && x.sEl === x.el && x.uEl === x.el), 'every five-star starts with its own element\'s Strong and Ultimate', five.slice(0, 3));
  ok(new Set(five.map(x => x.el + x.s + x.u)).size > 20, 'five-star pets get many different pairs', new Set(five.map(x => x.s + x.u)).size);
  const gold = six.filter(x => !x.u.startsWith('ey_')).length;
  ok(six.filter(x => x.u.startsWith('ey_')).length >= 28 && gold >= 1 && gold <= 14, 'six-stars mostly get their element\'s moves, now and then a golden one', { golden: gold, of: six.length });
  ok(r[4].every(x => x.s.startsWith('x_') && x.u.startsWith('y_')), 'four-stars keep their own star pools', r[4].map(x => x.s));
  ok(five.every(x => x.evo1 === 1 && x.evo7 === 7 && x.ult7m > 1.4), 'the moves carry the pet\'s stage and grow at Celestial', five.slice(0, 2).map(x => [x.evo1, x.evo7, x.ult7, x.ult7m]));
  ok(true, 'six-star elements', [...new Set(six.map(x => x.el))]); ok(!errors.length, 'no page errors', errors.slice(0, 5));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
