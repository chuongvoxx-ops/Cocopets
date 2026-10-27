// The 10-egg guarantee and star ranks by fusion: the counter of 10-egg summons without a six-star, the certain six-star
// after ten, the rank a fused child takes and the chance it rises (pairs and whole-group merges), its abilities, the
// screens that tell the chances, and saving. usage: node tests/rank-pity.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/rankpity-${n}.png`) });
  await page.evaluate(() => { window.__pp.quickStart('Bot'); });

  // ---- the guarantee ----
  const pity = await page.evaluate(() => {
    const P = window.__pp, st = P.st, sixes = () => st.others.filter(p => P.starsOf(p.rarity) >= 6).length;
    const pull = n => { st.others = []; st.crystals = 1e6; P.doSummon(n); const g = document.querySelector('#giftWrap'); if (g) g.hidden = true; return { six: sixes(), got: st.others.length }; };
    const out = { N: P.PITY_N, steps: [], forced: [], singles: null, saved: null };
    // a natural run from zero: each 10-egg summon without a six-star adds one, a six-star resets it
    st.pity10 = 0; let bad = 0;
    for (let i = 0; i < 40; i++) { const before = st.pity10, r = pull(10), want = r.six ? 0 : Math.min(P.PITY_N, before + 1); if (st.pity10 !== want || r.got !== 10) bad++; out.steps.push(before + (r.six ? '*' : '')); }
    out.bad = bad;
    // at ten, the next 10-egg summon always holds a six-star, then the count starts again
    for (let i = 0; i < 40; i++) { st.pity10 = P.PITY_N; const r = pull(10); out.forced.push([r.six, st.pity10]); }
    // single eggs leave the count alone, even at ten
    st.pity10 = 7; for (let i = 0; i < 20; i++) pull(1); out.singles = st.pity10;
    st.pity10 = 10; pull(1); out.singlesAt10 = st.pity10;
    // saving keeps it; nonsense is mended
    st.pity10 = 6; out.saved = P.sanitize(JSON.parse(JSON.stringify(P.serialize ? P.serialize() : st))).pity10;
    const bogus = JSON.parse(JSON.stringify(st)); bogus.pity10 = 999; out.bogus = P.sanitize(bogus).pity10; bogus.pity10 = 'x'; out.bogus2 = P.sanitize(bogus).pity10;
    return out;
  });
  console.log('  run', pity.steps.join(' '));
  ok(pity.N === 10, 'the guarantee comes after ten 10-egg summons');
  ok(pity.bad === 0, 'each 10-egg summon without a six-star adds one; one with a six-star resets it');
  ok(pity.forced.every(([six, n]) => six >= 1 && n === 0), `at 10/10 the next 10-egg summon held a six-star 40 times out of 40, then the count went back to 0`);
  ok(pity.forced.every(([six]) => six <= 3), 'a guarantee gives one six-star (others only by chance)');
  ok(pity.singles === 7 && pity.singlesAt10 === 10, 'single eggs leave the count alone');
  ok(pity.saved === 6 && pity.bogus === 10 && pity.bogus2 === 0, `saving keeps the count (${pity.saved}); bad values are mended (${pity.bogus}, ${pity.bogus2})`);
  // the summon sheet shows it
  await page.evaluate(() => { const P = window.__pp; P.st.pity10 = 7; P.st.others = []; P.st.crystals = 5000; P.openSummon(); });
  await page.waitForTimeout(300);
  const sheet = await page.evaluate(() => (document.querySelector('.pity') || {}).textContent || '');
  ok(/7\/10/.test(sheet) && /3 more 10-egg summons/.test(sheet), `summon sheet: "${sheet.replace(/\s+/g, ' ').trim().slice(0, 90)}"`);
  await page.evaluate(() => document.querySelector('.pity').scrollIntoView({ block: 'center' })); await shot('pity');
  await page.evaluate(() => { const P = window.__pp; P.st.pity10 = 10; P.openSummon(); });
  const ready = await page.evaluate(() => { const e = document.querySelector('.pity'); return { t: e.textContent, ready: e.classList.contains('ready') }; });
  ok(ready.ready && /guaranteed/i.test(ready.t), 'at 10/10 the sheet says the next is guaranteed'); await shot('pity-ready');
  await page.evaluate(() => { window.__pp.doSummon(10); });
  await page.waitForTimeout(500);
  const sub = await page.evaluate(() => (document.querySelector('#gwSub') || {}).textContent || '');
  ok(/guaranteed/.test(sub), `the ceremony says so: "${sub}"`);
  await page.evaluate(() => { const g = document.querySelector('#giftWrap'); if (g) g.hidden = true; window.__pp.closeSheet(); });

  // ---- star ranks by fusion ----
  const fu = await page.evaluate(() => {
    const P = window.__pp, R = P.mulberry32(5), mk = (s, nm) => P.newPetFields(nm || 'P' + s, P.summonGenome(s, R)), S = p => P.starsOf(p.rarity);
    const out = { chance: {}, keep: {}, rise: {}, mixed: {}, abil: {}, save: null };
    [[3, 2], [3, 3], [3, 8], [4, 2], [4, 3], [4, 4], [4, 7], [4, 12], [5, 2], [5, 3], [5, 6], [6, 2]].forEach(([s, n]) => { out.chance[s + '/' + n] = Math.round(P.fuseUpChance(s, n) * 1000) / 10; });
    for (const s of [3, 4, 5]) {
      let keep = 0, rise = 0, abl = 0, N = 40;
      for (let i = 0; i < N; i++) {
        const a = mk(s), b = mk(s), c0 = P.fuseChild(a, b, 100 + i, null, false), c1 = P.fuseChild(a, b, 100 + i, null, true);
        if (S(c0) === s) keep++;
        if (S(c1) === s + 1 && (s + 1 < 6 || c1.forms.every(f => f.x.gold))) rise++;
        const f1 = c1.forms[c1.forms.length - 1]; if (P.starsOf(P.rarityOf(f1)) === s + 1) abl++;
      }
      out.keep[s] = keep + '/' + N; out.rise[s] = rise + '/' + N; out.abil[s] = abl + '/' + N;
    }
    // different ranks: the higher, and no rise
    const m1 = P.fuseChild(mk(3), mk(5), 9, null, true), m2 = P.fuseChild(mk(4), mk(3), 9, null, true), m3 = P.fuseChild(mk(6), mk(3), 9, null, false);
    out.mixed = { '3+5': S(m1), '4+3': S(m2), '6+3': S(m3) };
    // the real roll's rate over many pairs of four-stars (25%)
    const a4 = mk(4), b4 = mk(4); let up = 0; const N = 3000; for (let i = 0; i < N; i++) { const c = P.fuseChild(a4, b4, i, null, Math.random() < P.fuseUpChance(4, 2)); if (S(c) === 5) up++; } out.rate4 = Math.round(up / N * 1000) / 10;
    // evolving and saving a risen child keep its rank
    const c = P.fuseChild(mk(3), mk(3), 4, null, true); P.st.others = [c];
    const back = P.sanitize(JSON.parse(JSON.stringify(P.st))).others[0];
    out.save = { stars: S(back), form: P.starsOf(P.rarityOf(back.forms[back.forms.length - 1])), rank: back.forms[0].x.rank, forged: back.forms[0].x.forged };
    const line = P.evolveLine(c.forms[0], 7, P.mulberry32(3)); out.evo = line.map(f => P.starsOf(P.rarityOf(P.cleanForm(f)))).join('');
    return out;
  });
  console.log('  ', JSON.stringify(fu));
  const C = fu.chance;
  ok(C['3/2'] === 20 && C['4/2'] === 25 && C['4/3'] === 30 && C['4/4'] === 35 && C['4/7'] === 50 && C['4/12'] === 50, `rise chances: 3★ pair ${C['3/2']}%; 4★ ${C['4/2']}/${C['4/3']}/${C['4/4']}% for 2/3/4 pets, ${C['4/7']}% at 7, capped ${C['4/12']}%`);
  ok(C['5/2'] === 5 && C['5/3'] === 6 && C['5/6'] === 9 && C['6/2'] === 0, `5★ to 6★: ${C['5/2']}% for two, ${C['5/3']}% for three, ${C['5/6']}% for six; six-stars don't rise (${C['6/2']}%)`);
  ok(C['3/3'] === 25 && C['3/8'] === 50, `3★ groups: ${C['3/3']}% for three, ${C['3/8']}% for eight`);
  for (const s of [3, 4, 5]) {
    ok(fu.keep[s] === '40/40', `two ${s}★ without the roll: the child stays ${s}★ (${fu.keep[s]})`);
    ok(fu.rise[s] === '40/40', `with the roll: ${s + 1}★${s === 5 ? ' golden' : ''} (${fu.rise[s]})`);
    ok(fu.abil[s] === '40/40', `its abilities follow the new rank (${fu.abil[s]})`);
  }
  ok(fu.mixed['3+5'] === 5 && fu.mixed['4+3'] === 4 && fu.mixed['6+3'] === 6, `different ranks take the higher, never rise (${JSON.stringify(fu.mixed)})`);
  ok(Math.abs(fu.rate4 - 25) < 3, `two four-stars rose ${fu.rate4}% of 3000 fusions`);
  ok(fu.save.stars === 4 && fu.save.form === 4 && fu.save.rank === 4 && fu.save.forged === 1, `a risen child saves and loads as 4★ (${JSON.stringify(fu.save)})`);
  ok(/^4{7}$/.test(fu.evo), `and stays 4★ as it evolves (${fu.evo})`);

  // ---- the fusion screens ----
  const ui = await page.evaluate(() => {
    const P = window.__pp, R = P.mulberry32(11), mk = (s, nm) => P.newPetFields(nm, P.summonGenome(s, R));
    const out = {};
    const pair = (s, t) => { P.st.others = [mk(s, 'Ann'), mk(t, 'Bo')]; P.st.fusionStones = 9; P.openFusion(); P.fuseSel.a = 0; P.fuseSel.b = 1; P.fuseSel.pick = null; P.openFusion(); return ((document.querySelector('.rank-note,.gold-note') || {}).textContent || '').replace(/\s+/g, ' ').trim(); };
    out.p3 = pair(3, 3); out.p4 = pair(4, 4); out.p5 = pair(5, 5); out.mix = pair(3, 4);
    return out;
  });
  ok(/20%/.test(ui.p3) && /4★/.test(ui.p3), `two 3★: "${ui.p3.slice(0, 80)}"`);
  ok(/25%/.test(ui.p4), `two 4★: "${ui.p4.slice(0, 80)}"`);
  ok(/5%/.test(ui.p5) && /Legendary/.test(ui.p5), `two 5★: "${ui.p5.slice(0, 80)}"`);
  ok(/higher rank/.test(ui.mix), `mixed ranks: "${ui.mix.slice(0, 80)}"`);
  await page.evaluate(() => document.querySelector('.rank-note').scrollIntoView({ block: 'center' })); await shot('fuse-note');
  // a group of four 4★ of one element: the list shows 35%, the merge sheet too, and a lucky merge rises
  const grp = await page.evaluate(() => {
    const P = window.__pp, R = P.mulberry32(19), want = [];
    const el0 = (() => { for (let i = 0; i < 400; i++) { const p = P.newPetFields('X', P.summonGenome(4, R)); want.push(p); } const mine = P.starsOf(P.st.rarity) === 4 ? P.petElement(P.st) : null; return P.petElement(want.find(p => P.petElement(p) !== mine)); })();   // (not the lead pet's kind, so it stays a group of four)
    const four = want.filter(p => P.petElement(p) === el0).slice(0, 4); four.forEach((p, i) => { p.name = 'Kin' + i; });
    P.st.others = four; P.st.fusionStones = 9; P.closeSheet(); P.openFusion();
    const gi = P.sameKindGroups().findIndex(g => g.stars === 4 && g.pets.length === 4);
    const chip = [...document.querySelectorAll('.sk-up')].map(e => e.textContent).join(' | ');
    P.fuseAll(gi, false);
    const note = ((document.querySelector('.rank-note') || {}).textContent || '').replace(/\s+/g, ' ').trim();
    return { gi, chip, note, n: four.length };
  });
  ok(grp.n === 4 && grp.gi >= 0, 'four 4★ pets of one element make a group');
  ok(/35% to 5★/.test(grp.chip), `the group shows "${grp.chip}"`);
  ok(/35%/.test(grp.note), `the merge sheet: "${grp.note.slice(0, 80)}"`);
  await shot('merge-sheet');
  await page.evaluate(() => { const P = window.__pp, rnd = Math.random; Math.random = () => 0.01; try { P.fuseAll(P.sameKindGroups().findIndex(g => g.stars === 4), true); } finally { Math.random = rnd; } });
  await page.waitForTimeout(6500);
  const merged = await page.evaluate(() => { const P = window.__pp, all = [P.st].concat(P.st.others), kid = all.find(p => (p.fusedFrom || []).length); return { n: P.st.others.length, stars: kid && P.starsOf(kid.rarity), perk: (document.querySelector('#evoPerk') || {}).textContent || '' }; });
  ok(merged.stars === 5 && /Rose to 5★/.test(merged.perk), `a lucky merge of four: ${merged.stars}★, "${merged.perk.slice(0, 70)}"`);
  await shot('merged');
  // ---- the developer switch: every egg a six-star ----
  await page.evaluate(() => { const g = document.querySelector('#giftWrap'); if (g) g.hidden = true; const P = window.__pp; P.closeSheet(); P.st.dev = true; P.openDev(); });
  await page.waitForTimeout(300);
  const dv = await page.evaluate(async () => {
    const P = window.__pp, sw = document.querySelector('[data-go="dev-six"]'); if (!sw) return { sw: false };
    sw.click(); const on = P.st.dev6 && sw.getAttribute('aria-checked') === 'true';
    P.closeSheet(); P.st.others = []; P.st.crystals = 1e6; const pity0 = P.st.pity10; P.doSummon(10);
    const g = document.querySelector('#giftWrap'); const sub = (document.querySelector('#gwSub') || {}).textContent || ''; if (g) g.hidden = true;
    const all6 = P.st.others.length === 10 && P.st.others.every(p => P.starsOf(p.rarity) === 6);
    P.st.others = []; P.doSummon(1); if (g) g.hidden = true; const one6 = P.st.others.length === 1 && P.starsOf(P.st.others[0].rarity) === 6;
    const kept = P.sanitize(JSON.parse(JSON.stringify(P.st))).dev6;
    P.openSummon(); const note = /Developer test/.test(document.querySelector('.sheet') ? document.querySelector('.sheet').textContent : document.body.textContent); P.closeSheet();
    P.openDev(); const sw2 = document.querySelector('[data-go="dev-six"]'); sw2.click(); const off = !P.st.dev6; P.closeSheet();
    P.st.others = []; let six = 0; for (let i = 0; i < 5; i++) { P.st.others = []; P.st.pity10 = 0; P.doSummon(10); if (g) g.hidden = true; six += P.st.others.filter(p => P.starsOf(p.rarity) === 6).length; }
    return { sw: true, on, all6, one6, kept, note, off, six, sub };
  });
  console.log('  dev', JSON.stringify(dv));
  ok(dv.sw && dv.on && dv.all6 && dv.one6, 'developer switch on: a 10-egg summon gives ten six-stars, a single egg a six-star');
  ok(dv.kept && dv.note && /every egg a ★6/.test(dv.sub), 'it is saved, and the summon screen and ceremony say it is on');
  ok(dv.off && dv.six < 10, `switched off, eggs roll their usual odds again (${dv.six} six-stars in 50 eggs)`);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(!errors.length, 'no page errors');
  console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
