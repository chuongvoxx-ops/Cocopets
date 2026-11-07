// Every elemental Strong and Ultimate fires in the Tower without errors, lands damage, and cleans up its effects.
// usage: node tests/elem-moves.js            (every element that has an implementation)
//        HTML=test-wind.html (a build made with: python3 src/build.py --test-only test-wind.html)
//        ELEM=earth,wind node tests/elem-moves.js      ONLY=faultline,rosary       SHOTS=1 (a screenshot each into shots/)
//        SHOT_MS=900 (when to take the screenshot after the cast)   EVO=7 (cast as an evolved pet: 1 Hatchling .. 7 Celestial)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));   // (HTML=name.html: a test build of your own)
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const P = window.__pp; P.quickStart('Elem'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30;
    // the rules: a move's lock reads element, stars and level; the deck keeps only moves the pet may use
    const p = P.st, el = P.petElement(p), M = P.ELEM_LIST[el], keys = Object.keys(M), s0 = M[keys.find(k => k[1] === 'x')], u0 = M[keys.find(k => k[1] === 'y')];
    const other = Object.keys(P.ELEM_LIST).find(e => e !== el), oth = P.ELEM_LIST[other][Object.keys(P.ELEM_LIST[other])[0]];
    p.dlv = 1; const lockS0 = P.elemLock(s0, p), lockLast = P.elemLock(Object.values(M).filter(m => m.slot === 'strong')[9], p), lockOther = P.elemLock(oth, p), lockUlt = P.elemLock(u0, p);
    p.deck = { normal: null, strong: P.elemId(el, s0.key), strong2: P.elemId(other, oth.key), ult: P.elemId(el, u0.key) }; const st0 = p.stage; p.stage = 4; const kit = P.dun.petKit(p).kit; p.stage = st0;
    P.st.devMoves = true; const lockDev = P.elemLock(Object.values(M).filter(m => m.slot === 'strong')[9], p); P.st.devMoves = false;
    const counts = {}; for (const e in P.ELEM_MOVES) counts[e] = [P.ELEM_MOVES[e].strong.length, P.ELEM_MOVES[e].ult.length];
    const dupKeys = []; for (const e in P.ELEM_MOVES) { const k = P.ELEM_MOVES[e].strong.concat(P.ELEM_MOVES[e].ult).map(r => r[0]); k.forEach((x, n) => { if (k.indexOf(x) !== n) dupKeys.push(e + ':' + x); }); }
    const impl = {}; for (const e in P.ELEM_IMPL) impl[e] = [Object.keys(P.ELEM_IMPL[e].strong).length, Object.keys(P.ELEM_IMPL[e].ult).length];
    p.deck = { normal: null, strong: null, strong2: null, ult: null };
    P.openMap(); P.dun.setMapTab('dungeon', true);
    return { dupKeys, el, stars: P.starsOf(P.rarityOf(p.forms[p.stage - 1] || p.forms[p.forms.length - 1])), lockS0, lockLast, lockOther, lockUlt, lockDev, kitStrong: kit.strong.key, kitStrong2: kit.strong2 ? kit.strong2.key : null, kitUlt: kit.ult.key, counts, impl };
  });
  ok(info.lockS0 === '' && info.lockLast === 'level' && info.lockOther === 'element' && info.lockDev === '', 'locks: first Strong open at level 1, the tenth needs a level, another element\'s refused, the dev switch lifts levels', info);
  ok(info.stars >= 5 ? info.lockUlt === '' : info.lockUlt === 'stars', `an Ultimate needs five stars (this pet has ${info.stars})`, info.lockUlt);
  ok(info.kitStrong.slice(0, 3) === 'ex_' && info.kitStrong2 !== null && info.kitStrong2.slice(0, 3) !== 'ex_' && (info.stars >= 5 ? info.kitUlt.slice(0, 3) === 'ey_' : info.kitUlt.slice(0, 3) !== 'ey_'), 'the kit takes a learned move and drops one the pet may not use', { s: info.kitStrong, s2: info.kitStrong2, u: info.kitUlt });
  ok(info.dupKeys.length === 0, 'no Strong and Ultimate of one element share a key (a shared key makes the Ultimate unpickable)', info.dupKeys);
  ok(Object.values(info.counts).every(c => c[0] === 10 && c[1] >= 10) && Object.keys(info.counts).length === 8, 'eight elements, ten Strongs and ten or more Ultimates each (Dark has an 11th)', info.counts);
  console.log('implemented', JSON.stringify(info.impl));
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 11));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  const ELEMS = process.env.ELEM ? process.env.ELEM.split(',') : Object.keys(info.impl), ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const results = [];
  const fire = async (el, slot, key, star) => {
    if (ONLY && !ONLY.includes(key)) return;
    const before = errors.length;
    const r = await page.evaluate(([el, slot, key, star, evo]) => {
      const P = window.__pp, D = P.arc.game._dbg, me = D.me, mv = P.ELEM_LIST[el][(slot === 'ult' ? 'ey_' : 'ex_') + key];
      // a ring of sturdy monsters round the pet, plus one in front
      let i = 0; for (const m of D.mons) { if (m.boss || m.dead) continue; m.hp = 1e7; m.maxhp = 1e7; if (i < 6) { let ok = false; for (let k = 0; k < 24 && !ok; k++) { const aa = i + k * 0.7, rr = 1.6 + (i % 3) * 0.7 + k * 0.1, x = me.x + Math.cos(aa) * rr, y = me.y + Math.sin(aa) * rr; const W = (px, py) => D.walkAt(Math.floor(px), Math.floor(py)); if (W(x, y) && W(x + 0.4, y) && W(x - 0.4, y) && W(x, y + 0.4) && W(x, y - 0.4)) { m.x = x; m.y = y; ok = true; } } if (!ok) { m.x = me.x; m.y = me.y; } } else { m.x = me.x + 60; m.y = me.y; m.dead = true; } m.freeze = 0; m.stun = 0; m.falling = null; m.under = false; m.still = false; m.z = 0; m.lifted = false; m.kbx = m.kby = 0; m._tag = i < 6; i++; }
      me.hp = D.ST.hp; me.mp = 999; D.g.cdS = 0; D.g.cdU = 0; D.g.swapCd = 0; me.dead = false; D.g.intro = 0; D.g.bossIntro = 0; me.leap = null; me.dash = null;
      const ab = Object.assign(P.elemAbility(mv, slot === 'ult' ? 'ult' : 'strong', P.st), { star, mult: 1.2, cost: 0, cd: 0, tier: 1, evo });
      D.setKit(slot === 'ult' ? 'ult' : 'strong', ab);
      // (Dark's Day of the Dead raises fallen teammates: the test pet's party gets one downed member carrying a Dark Ult and two Strongs)
      if (key === 'dayofthedead' && !D.party.some(m => m.down)) { const L = P.ELEM_LIST.dark, mk = (k, s) => Object.assign(P.elemAbility(L[k], s, P.st), { star: 6, evo, tier: 1 }); D.party.push({ p: P.st, kit: { kit: { normal: D.KITR.normal, ult: mk('ey_hollowmoon', 'ult'), strong: mk('ex_inkfang', 'strong'), strong2: mk('ex_eclipsedisc', 'strong2') } }, ST: D.ST, hp: 0, mp: 0, cd: { cdS: 0, cdS2: 0, cdS3: 0, cdU: 0 }, down: true, sprites: P.arc.sprites, el: 'dark' }); }
      const live = D.mons.filter(m => !m.dead).length, hp0 = D.mons.filter(m => m._tag).reduce((a, m) => a + m.hp, 0), mp0 = me.mp;
      if (slot === 'ult') D.useUlt(); else D.useStrong('strong');
      return { live, hp0, cast: me.mp !== mp0 || me.castT > 0 };
    }, [el, slot, key, star, +(process.env.EVO || 1)]);
    await page.waitForTimeout(slot === 'ult' && process.env.SHOT_MS_ULT ? +process.env.SHOT_MS_ULT : +(process.env.SHOT_MS || 700));
    if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/elem-${el}-${slot}-${key}${process.env.EVO ? '-evo' + process.env.EVO : ''}.png`) });
    // (Dark's Thriller deals its damage by echoing the pet's normal attacks, so the pet attacks while it is tested)
    await page.evaluate(async ([secs, tap, car]) => { const D = window.__pp.arc.game._dbg, g0 = D.g.t; const t0 = performance.now(); while ((D.g.t - g0 < secs || performance.now() - t0 < 2500) && performance.now() - t0 < 45000) {   /* game time: the headless page runs slowly */ await new Promise(r => requestAnimationFrame(r)); if (D && D.me) { D.me.hp = D.ST.hp; D.me.dead = false; D.me.mp = 999; } if (tap && D.g.t - g0 > 1.5 && D.g.normalT <= 0) window.__pp.arc.game.key('tap', true);
        /* (Light's Sports Car: drive in circles through the ring of monsters so ramming lands; afterwards the form is ended below) */
        if (car) { const K = window.__pp.arc.keys, ph = Math.floor((D.g.t - g0) / 0.7) % 4; K.right = ph === 0; K.down = ph === 1; K.left = ph === 2; K.up = ph === 3; } } }, [slot === 'ult' ? (key === 'sportscar' ? 9 : 6.5) : key === 'witchsbrand' ? 9.5 : 3.5, key === 'thriller', key === 'sportscar']);
    /* (Sports Car: release the keys, then press Supernova if the meter is full, else time the car out so its effect is cleaned up in the tail) */
    if (key === 'sportscar') await page.evaluate(() => { const K = window.__pp.arc.keys; K.left = K.right = K.up = K.down = false; const D = window.__pp.arc.game._dbg, S = D.g._sportscar; if (!S || S.released) return; if (S.charge >= 1) D.useUlt(); else S.left = 0; });
    const after = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { hp1: D.mons.filter(m => m._tag).reduce((a, m) => a + m.hp, 0), fx: D.ELEM.fx.length, dead: D.mons.filter(m => m.dead).length, bad: D.mons.filter(m => !m.dead && !(m.hp >= 0)).map(m => m.type + ':' + m.hp), z: D.mons.filter(m => !m.dead && m.z).length, texts: D.texts ? D.texts.map(t => t.s).filter(s => /forged/.test(s)) : [] }; });
    if (after.bad.length) console.log('bad hp', after.bad);
    results.push({ el, slot, key, dmg: Math.round(r.hp0 - after.hp1), live: r.live, fx: after.fx, z: after.z, errs: errors.length - before, missing: after.texts.length > 0 });
  };
  for (const el of ELEMS) { const I = await page.evaluate(el => ({ s: Object.keys(window.__pp.ELEM_IMPL[el] ? window.__pp.ELEM_IMPL[el].strong : {}), u: Object.keys(window.__pp.ELEM_IMPL[el] ? window.__pp.ELEM_IMPL[el].ult : {}) }), el); for (const k of I.s) await fire(el, 'strong', k, 5); for (const k of I.u) await fire(el, 'ult', k, 5); }
  // the five-star rule at the cast: a three-star pet is refused an elemental Ultimate
  const refused = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, me = D.me, el = Object.keys(P.ELEM_IMPL)[0]; if (!el) return null; const mv = Object.values(P.ELEM_LIST[el]).find(m => m.slot === 'ult'); const ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 3, mult: 1.2, cost: 10, cd: 0 }); D.setKit('ult', ab); me.mp = 500; D.g.cdU = 0; const n0 = D.ELEM.fx.length; D.useUlt(); return { mp: me.mp, fxAdded: D.ELEM.fx.length - n0 }; });
  if (refused) ok(refused.mp === 500 && refused.fxAdded === 0, 'a three-star pet cannot cast an elemental Ultimate (no MP spent, nothing happens)', refused);
  const TAILW = results.some(r => r.key === 'dayofthedead') ? 30 : results.some(r => r.key === 'titan') ? 20 : results.some(r => r.key === 'thriller') ? 30 : results.some(r => r.key === 'rocksteady') ? 30 : results.some(r => r.key === 'deadscream') ? 24 : results.some(r => r.key === 'lovesanctuary') ? 24 : results.some(r => r.key === 'umbraheart') ? 14 : results.some(r => r.key === 'pandemonium') ? 20 : results.some(r => r.key === 'monsoon') ? 16 : results.some(r => r.key === 'breathofthewild') ? 26 : results.some(r => r.key === 'fujin') ? 12 : results.some(r => r.key === 'zephyrblessing') ? 40 : results.some(r => r.key === 'oblivion') ? 22 : 9;   // long-lasting moves (Thriller's 30 s army, the 20 s ward) need a longer tail before the cleanup count
  await page.evaluate(async TW => { const D = window.__pp.arc.game._dbg, g0 = D.g.t; const t0 = performance.now(); while ((D.g.t - g0 < TW || performance.now() - t0 < 6000) && performance.now() - t0 < Math.max(90000, TW * 6000)) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me) { D.me.hp = D.ST.hp; D.me.dead = false; } } }, TAILW);
  const tail = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fx: D.ELEM.fx.length, state: window.__pp.arc.state, petHP: Math.round(D.me.hp), zones: D.zones.filter(z => z.own === 'pet').length }; });
  for (const r of results) console.log(`${r.el.padEnd(8)} ${r.slot.padEnd(6)} ${r.key.padEnd(16)} dmg ${String(r.dmg).padStart(7)} live ${r.live} fxLeft ${r.fx} ${r.z ? 'Z ' + r.z : ''}${r.errs ? 'ERRORS ' + r.errs : ''}${r.missing ? ' MISSING' : ''}`);
  console.log('tail', JSON.stringify(tail));
  const NODMG = new Set(['salvation', 'lovesanctuary', 'breathofthewild', 'zephyrblessing', 'oblivion', 'eclipsemantle']);   // (Witch's Brand's damage is its detonation at expiry: it gets a 9.5 s window above)   // support moves (the party heal/revive) deal no damage; tested by their own behaviour
  const zero = results.filter(r => r.dmg <= 0 && !NODMG.has(r.key)).map(r => r.key), missing = results.filter(r => r.missing).map(r => r.key);
  ok(!zero.length, 'every move lands damage', zero); ok(!missing.length, 'every move has an implementation', missing);
  ok(tail.fx === 0 && tail.zones === 0, 'every effect and warning is cleaned up afterwards', tail);
  ok(!errors.length, 'no page errors', errors.slice(0, 8)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
