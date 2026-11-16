// v391 K: pet skills (Strong and Ult). Pets don't learn skills: each is born with one Strong and one Ult rolled from its
// seed, from its star tier's pool (1–4★: every non-elemental move incl. the star pools; 5★: its element's 5★ list;
// 6★: its element's 6★ list, ELEM_SIX). A save from before is re-rolled once. Players can't equip elemental moves;
// "Unlock all skills (dev)" lets any pet equip any move. Fusion offers each parent's move (if the child's pool allows
// it) or a roll. Screenshots of the skills screen (player and dev) and the fusion skill step in shots/k-*.png.
// usage: HTML=test-calK.html node tests/_k-skills.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x).slice(0, 400)); if (!c) bad++; };
  const shot = n => page.screenshot({ path: path.resolve(__dirname, '..', 'shots', n) });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp && window.__pp.skillsK, null, { timeout: 20000 });
  await page.evaluate(() => window.__pp.quickStart('Kay')); await page.waitForTimeout(400);

  /* ---- 1. the pools, for many seeds and every tier ---- */
  const pools = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, SIX = K.ELEM_SIX, out = { bad: [], counts: {}, seen: { 4: new Set(), 5: new Set(), 6: new Set() }, n: 0, six: { missing: [] }, kitBad: [], sunBad: [] };
    for (const e in SIX) for (const s of ['strong', 'ult']) SIX[e][s].forEach(k => { if (!P.ELEM_LIST[e][(s === 'ult' ? 'ey_' : 'ex_') + k]) out.six.missing.push(e + ':' + k); });
    out.six.dark = SIX.dark.ult.length; out.six.thunderRag = SIX.thunder.ult.includes('ragnarok');
    // the 5★ list is every element move not on the 6★ list
    out.split = P.E8_ORDER.every(e => ['strong', 'ult'].every(s => { const all = P.ELEM_MOVES[e][s].map(r => 'e:' + e + ':' + r[0]), five = K.skillPool(5, e, s), six = K.skillPool(6, e, s); return five.length + six.length === all.length && five.every(id => !six.includes(id)) && six.every(id => SIX[e][s].includes(id.split(':')[2])); }));
    let seed = 99; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (const stars of [3, 4, 5, 6]) for (let i = 0; i < 60; i++) {
      const g = P.summonGenome(stars, R), p = P.newPetFields('T' + i, g);
      for (let j = 0; j < 4; j++) {   // the same body under several seeds
        p.dna = Object.assign({}, p.dna, { seed: 1 + Math.floor(R() * 2e9) });
        const tier = K.skillTier(p), el = P.petElement(p), sk = K.rollSkills(p), sk2 = K.rollSkills(p); out.n++;
        out.counts[tier] = (out.counts[tier] || 0) + 1;
        for (const s of ['strong', 'ult']) {
          const id = sk[s].id, elem = id.startsWith('e:'), six = elem && SIX[el][s].includes(id.split(':')[2]);
          if (id !== sk2[s].id) out.bad.push(['not deterministic', tier, id]);
          if (!K.skillPool(tier, el, s).includes(id)) out.bad.push(['not in pool', tier, el, s, id]);
          if (tier <= 4 && elem) out.bad.push(['elemental at ' + tier, id]);
          { const tg = K.skillElems(id); if (tg && !tg.includes(el)) out.bad.push(['v392 tagged move on another element', el, id]); }
          if (tier === 5 && (!elem || six || id.split(':')[1] !== el)) out.bad.push(['bad 5★', el, id]);
          if (tier === 6 && (!elem || !six || id.split(':')[1] !== el)) out.bad.push(['bad 6★', el, id]);
          if (id === 'y6:sunthrone' && ['earth', 'wind', 'dark'].includes(el)) out.sunBad.push(el);
          out.seen[Math.max(4, tier)].add(id);
        }
        // the Tower kit fights with exactly these (no cards equipped)
        p.deck = { normal: null, strong: null, strong2: null, ult: null }; p.skills = sk;
        const kit = P.dun.petKit(p).kit; if (kit.strong.id !== sk.strong.id || kit.ult.id !== sk.ult.id) out.kitBad.push([kit.strong.id, sk.strong.id]);
      }
    }
    const low = [...out.seen[4]];
    out.lowKinds = { innate: low.filter(x => /^[su]:/.test(x)).length, s4: low.filter(x => /^[xy]4:/.test(x)).length, s5: low.filter(x => /^[xy]5:/.test(x)).length, golden: low.filter(x => /^[xy]6:/.test(x)).length };
    out.seen = { 4: out.seen[4].size, 5: out.seen[5].size, 6: out.seen[6].size };
    out.lowPool = [K.skillPool(3, 'fire', 'strong').length, K.skillPool(4, 'fire', 'ult').length, K.skillPool(4, 'earth', 'ult').includes('y6:sunthrone'), K.skillPool(4, 'fire', 'ult').includes('y6:sunthrone')];
    return out;
  });
  ok(!pools.six.missing.length && pools.six.dark === 4 && pools.six.thunderRag, 'ELEM_SIX names real moves (Dark has 4 Ults; Ragnarok is Thunder\'s)', pools.six);
  ok(pools.split, 'each element: 5★ list = its moves minus the 6★ list; the two never overlap');
  ok(pools.n >= 900 && [3, 4, 5, 6].every(t => pools.counts[t] >= 100), 'rolled many pets of every tier', pools.counts);
  ok(!pools.bad.length, 'every roll is deterministic and from the right pool: nothing elemental at 1–4★, 6★ moves never at 5★, 6★ only from its list', pools.bad.slice(0, 6));
  ok(!pools.sunBad.length && pools.lowPool[0] === 24 && !pools.lowPool[2] && pools.lowPool[3], '1–4★ pool: innate + STAR4/5/6 minus other elements\' tagged moves (fire: 24 Strongs; Throne of the Sun not for earth, wind, dark)', pools.lowPool);
  ok(pools.lowKinds.innate > 5 && pools.lowKinds.s4 > 5 && pools.lowKinds.s5 > 5 && pools.lowKinds.golden >= 4, 'low-tier rolls cover the innate kit, the 4★, 5★ and golden 6★ moves', pools.lowKinds);
  ok(pools.seen[5] > 40 && pools.seen[6] > 20, 'five- and six-stars roll many different moves', pools.seen);
  ok(!pools.kitBad.length, 'the Tower kit uses the rolled skills (petSkills -> innateAbility -> petKit)', pools.kitBad.slice(0, 3));

  /* ---- 1b. (v392 K) element-tagged moves: never rolled for another element ---- */
  const tags = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, out = { poolBad: [], rollBad: [], byEl: {}, tagHits: {}, n: 0 };
    // every pool of every element and slot holds no move tagged for another element, and keeps its own
    for (const e of P.E8_ORDER) for (const s of ['strong', 'ult']) for (const t of [3, 4]) { const pool = K.skillPool(t, e, s); pool.forEach(id => { const tg = K.skillElems(id); if (tg && !tg.includes(e)) out.poolBad.push([e, id]); }); }
    out.fireHasInferno = K.skillPool(4, 'fire', 'ult').includes('y4:inferno'); out.waterInferno = K.skillPool(4, 'water', 'ult').includes('y4:inferno'); out.waterTidal = K.skillPool(3, 'water', 'ult').includes('y4:tidal');
    // many pets, many seeds: rolls
    let seed = 4242; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < 300; i++) { const p = P.newPetFields('E' + i, P.summonGenome(i % 2 ? 4 : 3, R)), el = P.petElement(p);
      for (let j = 0; j < 6; j++) { p.dna = Object.assign({}, p.dna, { seed: 1 + Math.floor(R() * 2e9) }); const sk = P.skillsK.rollSkills(p); out.n++; out.byEl[el] = (out.byEl[el] || 0) + 1;
        for (const s of ['strong', 'ult']) { const tg = K.skillElems(sk[s].id); if (tg) { out.tagHits[sk[s].id] = (out.tagHits[sk[s].id] || new Set()).add(el); if (!tg.includes(el)) out.rollBad.push([el, sk[s].id]); } } } }
    for (const k in out.tagHits) out.tagHits[k] = [...out.tagHits[k]].join('/');
    out.why = K.skillWhyNot('y4:inferno', 4, 'water', 'ult'); out.whyOK = K.skillWhyNot('y4:inferno', 4, 'fire', 'ult');
    return out;
  });
  ok(!tags.poolBad.length && tags.fireHasInferno && !tags.waterInferno && tags.waterTidal, 'v392: no 1–4★ pool holds a move tagged for another element (Inferno Ring: fire\'s, not water\'s)', tags.poolBad.slice(0, 4));
  ok(tags.n >= 1800 && !tags.rollBad.length && Object.keys(tags.byEl).length === 8 && Object.keys(tags.tagHits).length > 10, 'v392: across 1800 low-tier rolls of all 8 elements, a tagged move only ever rolls for its own element', { byEl: tags.byEl, rolled: tags.tagHits, bad: tags.rollBad.slice(0, 4) });
  ok(tags.why === 'Fire move: the child is Water' && tags.whyOK === '', 'v392: fusion\'s reason for a tagged move: "Fire move: the child is Water"', tags.why);

  /* ---- 2. the one-time migration ---- */
  const mig = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, st = P.st; let seed = 7; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    st.others = []; [3, 4, 5, 6, 5].forEach((t, i) => st.others.push(P.newPetFields('Old' + i, P.summonGenome(t, R))));
    st.cards = { chain: 2, megabeam: 1 };
    // an old save: elemental moves equipped, a card, old fusion overrides, odd skills, no version marker
    st.deck = { normal: null, strong: 'chain', strong2: null, ult: 'e:fire:armageddon' };
    st.others[2].deck = { normal: null, strong: 'e:' + P.petElement(st.others[2]) + ':' + P.ELEM_MOVES[P.petElement(st.others[2])].strong[0][0], strong2: null, ult: 'megabeam' };
    st.others[0].abOv = { strong: { key: 'x_cometlance', tier: 4 }, ult: { key: 'y_starfall', tier: 4 } };
    const o = P.serialize(); delete o.skillsV; o.skills = { strong: { id: 'x4:cometlance', src: 'parent', of: 'X' }, ult: { id: 'y4:starfall', src: 'parent' } };
    const s1 = P.sanitize(JSON.parse(JSON.stringify(o))), s2 = P.sanitize(JSON.parse(JSON.stringify(o)));
    const pets = s => [s].concat(s.others), ids = s => pets(s).map(p => p.skills.strong.id + '|' + p.skills.ult.id);
    const rolledOK = pets(s1).every(p => { const r = K.rollSkills(p); return p.skills.strong.id === r.strong.id && p.skills.ult.id === r.ult.id && p.skills.strong.src === 'roll'; });
    const decks = { lead: s1.deck, o2: s1.others[2].deck, ov: s1.others[0].abOv };
    // after the migration: a fusion-given skill is kept through save and load (it does not run again)
    const o3 = JSON.parse(JSON.stringify(Object.assign({}, s1, { room: undefined })));
    const lowPet = o3.others.findIndex(p => K.skillTier(s1.others[o3.others.indexOf(p)]) <= 4);
    o3.skills = { strong: { id: 'x6:midas', src: 'parent', of: 'Zed' }, ult: s1.skills.ult };
    const s3 = P.sanitize(o3), s4 = P.sanitize(JSON.parse(JSON.stringify(Object.assign({}, s3, { room: undefined }))));
    return { v1: s1.skillsV, same: JSON.stringify(ids(s1)) === JSON.stringify(ids(s2)), rolledOK, decks, kept: s3.skills.strong, kept2: s4.skills.strong, v3: s3.skillsV, n: pets(s1).length, lowPet };
  });
  ok(mig.v1 === 2 && mig.same && mig.rolledOK && mig.n === 6, 'migration: every pet of an old save is re-rolled by its seed, the same every time, and marked done (skillsV 2)', { v: mig.v1, same: mig.same, rolled: mig.rolledOK });
  ok(mig.decks.lead.strong === 'chain' && !mig.decks.lead.ult && mig.decks.o2.ult === 'megabeam' && !mig.decks.o2.strong && !(mig.decks.ov && (mig.decks.ov.strong || mig.decks.ov.ult)), 'migration: ability cards stay equipped; elemental moves and old fusion Strong/Ult overrides are taken out', mig.decks);
  // (v392 K) a v1 save: only the slots whose move is wrong for the pet's element are rolled again (by the seed); valid moves stay
  const mig2 = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, st = P.st; let seed = 77; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    let wat = null, fir = null; for (let i = 0; i < 2000 && !(wat && fir); i++) { const p = P.newPetFields('M' + i, P.summonGenome(i % 2 ? 4 : 3, R)), e = P.petElement(p); if (e === 'water' && !wat) wat = p; if (e === 'fire' && !fir) fir = p; }
    wat.name = 'Wat'; fir.name = 'Fir';
    wat.skills = { strong: { id: 's:rush', src: 'roll' }, ult: { id: 'y4:inferno', src: 'roll' } };            // a water pet with Inferno Ring: wrong
    fir.skills = { strong: { id: 'x4:glacier', src: 'parent', of: 'Q' }, ult: { id: 'y4:inferno', src: 'roll' } };   // fire with Glacier Wall (ice): wrong; Inferno: fine
    st.others = [wat, fir]; st.skills = { strong: { id: 'x6:midas', src: 'roll' }, ult: { id: 'y6:crownfall', src: 'parent', of: 'Z' } };   // open moves: kept
    const o = P.serialize(); o.skillsV = 1;
    const a = P.sanitize(JSON.parse(JSON.stringify(o))), b = P.sanitize(JSON.parse(JSON.stringify(o)));
    const W = a.others.find(p => p.name === 'Wat'), F = a.others.find(p => p.name === 'Fir'), W2 = b.others.find(p => p.name === 'Wat'), F2 = b.others.find(p => p.name === 'Fir');
    const inPool = p => ['strong', 'ult'].every(s => K.skillPool(K.skillTier(p), P.petElement(p), s).includes(p.skills[s].id));
    return { v: a.skillsV, W: W.skills, F: F.skills, lead: a.skills, same: JSON.stringify([W.skills, F.skills]) === JSON.stringify([W2.skills, F2.skills]), wRoll: K.rollSkills(W).ult.id, fRoll: K.rollSkills(F).strong.id, okW: inPool(W), okF: inPool(F) };
  });
  ok(mig2.v === 2 && mig2.W.strong.id === 's:rush' && mig2.W.ult.id !== 'y4:inferno' && mig2.W.ult.id === mig2.wRoll && mig2.okW, 'v1 -> v2: a water pet\'s Inferno Ring is rolled again (by its seed); its valid Strong stays', mig2.W);
  ok(mig2.F.ult.id === 'y4:inferno' && mig2.F.strong.id !== 'x4:glacier' && mig2.F.strong.id === mig2.fRoll && mig2.okF && mig2.lead.strong.id === 'x6:midas' && mig2.lead.ult.id === 'y6:crownfall' && mig2.lead.ult.of === 'Z', 'v1 -> v2: a fire pet keeps Inferno Ring, loses Glacier Wall; open moves and fusion gifts are kept', { F: mig2.F, lead: mig2.lead });
  ok(mig2.same, 'v1 -> v2 is deterministic');
  ok(mig.kept.id === 'x6:midas' && mig.kept.of === 'Zed' && mig.kept2.id === 'x6:midas' && mig.v3 === 2, 'migration runs once: a saved (fusion-given) skill is kept on later loads', [mig.kept, mig.kept2]);

  /* ---- 3. the menu: no elemental learn or equip for players; the dev setting equips anything on anyone ---- */
  const devUI = await page.evaluate(() => { const P = window.__pp; P.openDev(); const b = document.querySelector('[data-go="dev-moves"]'), r = { label: document.getElementById('devMvLbl').textContent, note: b.parentElement.innerText.slice(0, 60), aria: b.getAttribute('aria-checked'), def: !!P.st.devMoves }; b.click(); r.after = !!P.st.devMoves; const o = P.serialize(); r.saved = o.devMoves === true && !!P.sanitize(o).devMoves; b.click(); r.back = !!P.st.devMoves; P.closeSheet(); return r; });
  ok(/Unlock all skills \(dev\)/.test(devUI.label) && devUI.aria === 'false' && !devUI.def && devUI.after && devUI.saved && !devUI.back, 'Developer tools: "Unlock all skills (dev)", off by default, toggles and is saved', devUI);
  const menu = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, st = P.st; let seed = 3; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    st.others = [P.newPetFields('Lowy', P.summonGenome(3, R)), P.newPetFields('Goldie', P.summonGenome(6, R))];
    st.devMoves = false; st.deck = { normal: null, strong: null, strong2: null, ult: null }; st.stage = 4;
    const low = st.others[0]; low.deck = { normal: null, strong: null, strong2: null, ult: null };
    P.dun.openCards('strong', low.uid);
    const q = s => document.querySelectorAll(s).length, own = K.petSkills(low);
    const player = { elemBtns: q('#sheet [data-id^="e:"], .sheet [data-id^="e:"]') + q('[data-go="card-pick"][data-id^="e:"]'), anySkillBtn: q('[data-go="card-pick"][data-id*=":"]'), elock: q('.elock'), learned: /learned/i.test(document.body.innerText.match(/moves · \d+\/\d+ learned/) || ''), devGrid: q('.dev-skillpick'), box: q('.sk-box'), boxText: (document.querySelector('.sk-box') || {}).innerText || '' };
    player.ownShown = player.boxText.includes(K.skillAbility(own.strong.id, 'strong', low).name) && player.boxText.includes(K.skillAbility(own.ult.id, 'ult', low).name);
    // try anyway: equip an elemental and a star move as a player
    const el = P.petElement(low), tries = ['e:' + el + ':' + P.ELEM_MOVES[el].strong[0][0], 'x6:midas'];
    tries.forEach(id => P.dun.equipCard(id));
    player.deckAfter = Object.assign({}, low.deck); player.fits = P.deckFits(tries[0], 'strong', low);
    P.dun.openCards('ult', low.uid); player.ultElem = q('[data-go="card-pick"][data-id*=":"]');
    // dev on: every move on the low pet and on the six-star, every slot type
    st.devMoves = true;
    const res = { strongN: 0, ultN: 0, fail: [] };
    for (const pet of [low, st.others[1]]) for (const slot of ['strong', 'ult']) {
      P.dun.openCards(slot, pet.uid);
      const ids = [...new Set(K.skillGroups(slot).flatMap(g => g.ids))];
      const btns = [...document.querySelectorAll('.dev-skillpick [data-go="card-pick"]')].map(b => b.dataset.id);
      if (btns.length !== ids.length) res.fail.push(['grid', pet.name, slot, btns.length, ids.length]);
      for (const id of ids) { P.dun.equipCard(id); const a = P.dun.petKit(pet).kit[slot]; if (!a || a.id !== id) res.fail.push([pet.name, slot, id, a && a.id]); else if (slot === 'ult' && a.elem && a.star < 5) res.fail.push(['ult gate', id]); }
      res[slot + 'N'] += ids.length;
    }
    // dev off again: the pet's own skills come back
    st.devMoves = false; const back = P.dun.petKit(low).kit;
    res.back = back.strong.id === own.strong.id && back.ult.id === own.ult.id;
    return { player, res };
  });
  ok(menu.player.anySkillBtn === 0 && menu.player.elock === 0 && !menu.player.learned && menu.player.devGrid === 0 && menu.player.ultElem === 0, 'player menu: no elemental (or any skill) moves to learn or equip, no level locks', menu.player);
  ok(menu.player.box === 1 && menu.player.ownShown, 'player menu: the pet\'s own Strong and Ult shown read-only (name, glyph, description)', menu.player.boxText.slice(0, 160));
  ok(!menu.player.deckAfter.strong && !menu.player.fits, 'player: equipping an elemental or star move is refused', menu.player.deckAfter);
  ok(!menu.res.fail.length && menu.res.strongN > 200 && menu.res.ultN > 200, 'dev on: every Strong and Ult of every pool equips on a 3★ and a 6★ pet (and an elemental Ult can be cast)', { n: [menu.res.strongN, menu.res.ultN], fail: menu.res.fail.slice(0, 5) });
  ok(menu.res.back, 'dev off again: the pet\'s own skills come back');

  // screenshots: the skills screen, player and dev
  await page.evaluate(() => { const P = window.__pp; P.st.devMoves = false; P.dun.openCards('strong', P.st.others[1].uid); const b = document.querySelector('.sk-box'); if (b) b.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(500); await shot('k-skills-player.png');
  await page.evaluate(() => { const P = window.__pp; P.st.devMoves = true; P.dun.openCards('ult', P.st.others[1].uid); const b = document.querySelector('.dev-skillpick'); if (b) b.scrollIntoView({ block: 'start' }); });
  await page.waitForTimeout(500); await shot('k-skills-dev.png');
  await page.evaluate(() => { const P = window.__pp; P.st.devMoves = false; P.closeSheet(); });

  /* ---- 4. fusion: each parent's move if the child's pool allows it, or a roll; the tier holds ---- */
  const fu = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, out = { bad: [], why: [], n: 0 }; let seed = 11; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    // many pairs, straight through fuseChild: every pick ends in the child's pool; a valid parent pick is that move
    for (let i = 0; i < 60; i++) {
      const ta = [3, 4, 5, 6][i % 4], tb = [3, 4, 5, 6][Math.floor(i / 4) % 4];
      const a = P.newPetFields('A' + i, P.summonGenome(ta, R)), b = P.newPetFields('B' + i, P.summonGenome(tb, R));
      for (const pick of [{ strong: 'a', ult: 'b' }, { strong: 'b', ult: 'a' }, { strong: 'r', ult: 'r' }]) {
        const c = P.fuseChild(a, b, 1000 + i, Object.assign({ normal: 'a' }, pick), false, Math.random), tier = K.skillTier(c), el = P.petElement(c); out.n++;
        for (const s of ['strong', 'ult']) {
          const S = c.skills[s], par = pick[s] === 'a' ? a : pick[s] === 'b' ? b : null, pid = par && K.petSkills(par)[s].id, why = pid ? K.skillWhyNot(pid, tier, el, s) : null;
          if (!K.skillPool(tier, el, s).includes(S.id)) out.bad.push(['out of pool', tier, el, S.id]);
          if (par && !why && (S.id !== pid || S.src !== 'parent')) out.bad.push(['valid parent move lost', pid, S]);
          if (par && why && S.src !== 'fuse-roll') out.bad.push(['invalid parent move kept', pid, why]);
          if (!par && S.src !== 'fuse-roll') out.bad.push(['roll not a roll', S]);
          if (why) out.why.push(why);
        }
      }
    }
    out.whyKinds = [...new Set(out.why)].slice(0, 8);
    // the screen: a 3★ parent and a 5★ parent make a 5★ child; the 3★ parent's moves are greyed "not available at 5★"
    const st = P.st; let lo = null, hi = null;
    for (let i = 0; i < 40 && !(lo && hi); i++) { const g = P.summonGenome(5, R), p = P.newPetFields('Fivey', g); if (!hi) hi = p; }
    lo = P.newPetFields('Threey', P.summonGenome(3, R));
    st.others = [lo, hi]; st.fusionStones = 5;
    P.fuseSel.a = 0; P.fuseSel.b = 1; P.fuseSel.pick = null; P.openFusion();
    const row = s => [...document.querySelectorAll(`.fab-opt[data-slot="${s}"]`)].map(b => ({ src: b.dataset.src, off: b.classList.contains('off'), on: b.classList.contains('on'), why: (b.querySelector('.fab-why') || {}).textContent || '', name: b.querySelector('b').textContent }));
    out.ui = { strong: row('strong'), ult: row('ult'), note: (document.querySelector('.sk-fnote') || {}).textContent || '' };
    return out;
  });
  ok(fu.n >= 150 && !fu.bad.length, 'fusion: the child\'s Strong and Ult always come from its own tier pool; a valid parent move is inherited, an invalid one or "roll" is rolled', fu.bad.slice(0, 4));
  ok(fu.whyKinds.some(w => /not available at [345]★/.test(w)), 'fusion explains why a parent move is not offered', fu.whyKinds);
  const ui = fu.ui, s3 = ui.strong.find(x => x.src === 'a'), rollS = ui.strong.find(x => x.src === 'r');
  ok(ui.strong.length === 3 && ui.ult.length === 3 && s3.off && /not available at 5★/.test(s3.why) && rollS && /Roll a random one/.test(rollS.name) && !ui.strong.find(x => x.src === 'b').off, 'fusion screen: Parent A, Parent B and "Roll a random one" per slot; the 3★ parent\'s move is greyed at 5★', ui.strong);
  ok(/5★/.test(ui.note) && /final/.test(ui.note), 'fusion screen says the child\'s pool and that the roll is final', ui.note.slice(0, 160));
  await page.evaluate(() => { const e = document.querySelector('[data-k="fuse-skills"]'); if (e) e.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(400); await shot('k-fusion-skills.png');
  // choose: Strong = Parent B's (valid), Ult = Roll; then fuse for real
  const pickRes = await page.evaluate(() => { document.querySelector('.fab-opt[data-slot="strong"][data-src="a"]').click(); const stayed = window.__pp.fuseSel.pick.strong; document.querySelector('.fab-opt[data-slot="strong"][data-src="b"]').click(); document.querySelector('.fab-opt[data-slot="ult"][data-src="r"]').click(); const P = window.__pp; return { stayed, pick: P.fuseSel.pick, bStrong: P.skillsK.petSkills(P.st.others[1]).strong.id }; });
  ok(pickRes.stayed !== 'a' && pickRes.pick.strong === 'b' && pickRes.pick.ult === 'r', 'a greyed move cannot be picked; B and the roll can', pickRes.pick);
  await page.evaluate(() => window.__pp.fusePets()); await page.waitForTimeout(5500);
  const child = await page.evaluate(() => { const P = window.__pp, K = P.skillsK, c = P.st, t = K.skillTier(c), el = P.petElement(c); return { name: c.name, t, el, sk: c.skills, inPool: ['strong', 'ult'].every(s => K.skillPool(t, el, s).includes(c.skills[s].id)), kit: [P.dun.petKit(c).kit.strong.id, P.dun.petKit(c).kit.ult.id], perk: document.querySelector('#evoPerk') ? document.querySelector('#evoPerk').innerText : '' }; });
  ok(child.sk.strong.id === pickRes.bStrong && child.sk.strong.src === 'parent' && child.sk.ult.src === 'fuse-roll' && child.inPool && child.kit[0] === child.sk.strong.id, 'fused: Strong inherited from B, Ult rolled from the child\'s pool, and the kit uses them', child);
  // and through a save and a reload the child keeps them
  await page.evaluate(() => window.__pp.saveLocalNow()); await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st, null, { timeout: 20000 }); await page.waitForTimeout(500);
  const after = await page.evaluate(() => window.__pp.st.skills);
  ok(after && after.strong.id === child.sk.strong.id && after.ult.id === child.sk.ult.id, 'the child keeps its skills through a save and reload', after);

  /* ---- 5. merge all (3+ pets): every parent's moves are offered, plus the roll ---- */
  const grp = await page.evaluate(() => {
    const P = window.__pp, K = P.skillsK, st = P.st; let seed = 5; const R = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    // three 4★ pets of one element (same kind)
    const byEl = {}; for (let i = 0; i < 400; i++) { const p = P.newPetFields('G' + i, P.summonGenome(4, R)), e = P.petElement(p); (byEl[e] = byEl[e] || []).push(p); if (byEl[e].length >= 3) { st.others = byEl[e].slice(0, 3); break; } }
    st.fusionStones = 9; const groups = P.sameKindGroups(), gi = groups.findIndex(g => g.pets.length >= 3 && g.pets.every(x => x.p !== st));
    const F = K.fuseAllSkills(gi); P.fuseAll(gi);
    const btns = s => [...document.querySelectorAll(`[data-go="fuse-all-ab"][data-slot="${s}"]`)].map(b => ({ id: b.dataset.id, off: b.classList.contains('off'), on: b.classList.contains('on') }));
    const parentIds = s => [...new Set(F.list.map(p => K.petSkills(p)[s].id))];
    return { gi, strong: btns('strong'), ult: btns('ult'), want: { strong: parentIds('strong'), ult: parentIds('ult') }, names: F.list.map(p => p.name) };
  });
  ok(grp.gi >= 0 && ['strong', 'ult'].every(s => grp.want[s].every(id => grp[s].some(b => b.id === id)) && grp[s].some(b => b.id === 'r') && grp[s].length === grp.want[s].length + 1), 'merge all: every parent\'s Strong and Ult is offered (once each), plus "Roll a random one"', { strong: grp.strong, want: grp.want.strong });
  await page.evaluate(() => { const e = document.querySelector('[data-k="fuse-all-skills"]'); if (e) e.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(400); await shot('k-fusion-all.png');
  const pickG = grp.strong.find(b => b.id !== 'r' && !b.off);
  const gres = await page.evaluate(([gi, sid]) => { const P = window.__pp, K = P.skillsK; if (sid) K.fuseAllAb(gi, 'strong', sid); K.fuseAllAb(gi, 'ult', 'r'); const sel = Object.assign({}, K.fuseAllSel); P.fuseAll(gi, true); return sel; }, [grp.gi, pickG && pickG.id]);
  await page.waitForTimeout(6500);
  const gchild = await page.evaluate(() => { const P = window.__pp, K = P.skillsK, all = [P.st].concat(P.st.others), c = all.find(p => p.gen >= 1 && /G\d/.test((p.fusedFrom || []).join(''))) || all[all.length - 1], t = K.skillTier(c), el = P.petElement(c); return { name: c.name, sk: c.skills, inPool: ['strong', 'ult'].every(s => K.skillPool(t, el, s).includes(c.skills[s].id)), t, el }; });
  ok(gchild.inPool && (!pickG || (gchild.sk.strong.id === pickG.id && gchild.sk.strong.src === 'parent')) && gchild.sk.ult.src === 'fuse-roll', 'merge all: the chosen parent move is inherited and the roll comes from the child\'s pool', { sel: gres, child: gchild });

  ok(!errors.length, 'no page errors', errors.slice(0, 5));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
