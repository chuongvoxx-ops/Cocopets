// v447 K: a 5★/6★ pet's extra Strong attacks (Strong 2 at Adept, and the clash alternative) come from its own pool (its
// element's 5★ list, or its 6★ list), never from the 1–4★ body kit; 1–4★ pets keep the body kit. Then a 6★ and a 5★ pet
// cast their Strong 2 in a real Dungeon floor.
// usage: HTML=test-x.html node tests/_k-strong2.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x).slice(0, 500)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(process.env.HTML || path.resolve(__dirname, '..', 'test.html')));
  await page.waitForFunction(() => window.__pp && window.__pp.skillsK, null, { timeout: 20000 });
  await page.evaluate(() => window.__pp.quickStart('Kay')); await page.waitForTimeout(400);
  const r = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, out = { n: { 3: 0, 4: 0, 5: 0, 6: 0 }, bad: [], low: [], dup: [], stable: [] };
    let seed = 77; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (const stars of [3, 4, 5, 6]) for (let i = 0; i < 50; i++) {
      const g = P.summonGenome(stars, R), p = P.newPetFields('T' + i, g); p.stage = 4 + (i % 4);
      const t = K.skillTier(p), e8 = P.petElement(p), kit = P.dun.petKit(p).kit, s2 = kit.strong2;
      out.n[t] = (out.n[t] || 0) + 1;
      if (!s2) { out.bad.push(['no strong2', t, e8]); continue; }
      if (t >= 5) { if (!s2.elem || !K.skillPool(t, e8, 'strong').includes(s2.id)) out.bad.push([t, e8, s2.key, s2.id]); }
      else if (!/^s_/.test(s2.key)) out.low.push([t, s2.key]);
      if (s2.key === kit.strong.key) out.dup.push([t, s2.key]);
      if (JSON.stringify(P.dun.petKit(p).kit.strong2.key) !== JSON.stringify(s2.key)) out.stable.push(t);
    }
    return out;
  });
  ok(r.n[5] > 20 && r.n[6] > 20, 'pets of every tier rolled', r.n);
  ok(!r.bad.length, "every 5★/6★ pet's Strong 2 is a move of its own element's 5★/6★ list", r.bad.slice(0, 6));
  ok(!r.low.length, '1–4★ pets keep their body-kit Strong 2', r.low.slice(0, 4));
  ok(!r.dup.length && !r.stable.length, 'Strong 2 never repeats Strong 1, and is the same every time (from the seed)', [r.dup.slice(0, 3), r.stable.slice(0, 3)]);
  // a dev pick of the same move in Strong 1 clashes: Strong 2 takes the alternative, or keeps a valid move; no crash
  const clash = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK; let seed = 5; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const res = []; for (let i = 0; i < 16; i++) { const p = P.newPetFields('C' + i, P.summonGenome(6, R)); p.stage = 5; const s2 = P.dun.petKit(p).kit.strong2; P.st.devMoves = true; p.deck = { normal: null, strong: s2.id, strong2: null, ult: null }; let k2; try { const kit = P.dun.petKit(p).kit; k2 = [kit.strong.id, kit.strong2 && kit.strong2.id, K.skillPool(6, P.petElement(p), 'strong').includes(kit.strong2 && kit.strong2.id)]; } catch (e) { k2 = ['ERR', e.message]; } P.st.devMoves = false; res.push(k2); }
    return res;
  });
  ok(clash.every(c => c[0] !== 'ERR' && c[2]), 'a dev pick that clashes with Strong 2 keeps Strong 2 in the pool and never throws', clash.filter(c => c[0] === 'ERR' || !c[2]).slice(0, 3));
  // in a real floor: the player's pet as a 6★ (then a 5★) at Adept casts Strong 2
  for (const stars of [6, 5]) {
    const info = await page.evaluate(stars => {
      const P = window.__pp; let seed = 31 + stars; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
      const f = P.newPetFields('Kay', P.summonGenome(stars, R)); ['dna', 'forms', 'rarity', 'skills'].forEach(k => { if (k in f) P.st[k] = f[k]; }); P.st.skills = null; P.st.stage = 4; P.st.deck = null;
      const kit = P.dun.petKit(P.st).kit; return { tier: P.skillsK.skillTier(P.st), el: P.petElement(P.st), s1: kit.strong.id, s2: kit.strong2 && kit.strong2.id };
    }, stars);
    await page.evaluate(() => { const P = window.__pp; P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 90000 }).catch(e => console.log('state', errors.slice(0, 3)));
    await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2000);
    const e0 = errors.length;
    const c = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, me = D.me; me.mp = 999; D.g.cdS = D.g.cdS2 = 0; D.g.intro = 0; const k2 = D.KITR ? D.KITR.strong2 : null; const mp0 = me.mp; D.useStrong('strong2'); await new Promise(r => setTimeout(r, 2500)); return { key: k2 && k2.key, spent: mp0 - me.mp, cd: D.g.cdS2 }; });
    ok(info.tier === stars && info.s2 && info.s2.split(':')[1] === info.el && (c.spent > 0 || c.cd > 0) && errors.length === e0, `a ${stars}★ ${info.el} pet casts its own Strong 2 in the Dungeon (${info.s2})`, { info, c });
    await page.evaluate(() => { const P = window.__pp; P.arc.stop ? P.arc.stop() : 0; if (P.openMap) P.openMap(); }); await page.waitForTimeout(600);
  }
  ok(errors.length === 0, 'no page errors', errors.slice(0, 3));
  console.log(bad ? `${bad} FAILED` : 'ALL OK'); await browser.close(); process.exit(bad ? 1 : 0);
})();
