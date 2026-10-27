// Raziel (Gemini), the twin celestial dragons: summons them in a fight, plays their Astral Awakening (Twin Helix Nova),
// checks that it is the third strongest final attack of all the Animas and that nothing throws, and (SHOTS=1) photographs
// the summon, the cinematic mid-flight, the impact, the nova, the card and the portrait.
// usage: node tests/gemini-dragons.js            (SHOTS=1 to save pictures, FAST=1 to skip the ranking)
//
// The ranking: every Anima's final attack at its final form (3 stars), each measured twice, against the standard pack of
// seven monsters set out as in tests/anima-battle.js and against a lone monster (a duel); monsters cannot die (their
// health is topped far above their maximum, which is 150 times the pet's attack, so attacks that take a share of a
// monster's health count fairly) and the random numbers are seeded, so every Anima faces the same rolls. Overall = room + duel.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const ALL = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces', 'ophiuchus'];
(async () => {
  const SHOTS = !!process.env.SHOTS, FAST = !!process.env.FAST;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: SHOTS ? 2 : 1, hasTouch: true });
  // the same pet every run: the page's random numbers are seeded from the start
  await page.addInitScript(() => { let sd = 987654321; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  const shot = async name => { if (SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/gemini-${name}.png`) }); };
  const fails = [], ok = (c, msg) => { if (!c) fails.push(msg); console.log((c ? 'ok   ' : 'FAIL ') + msg); };
  await page.goto('file://' + (process.env.HTML ? path.resolve(process.env.HTML) : path.resolve(__dirname, '../test.html')));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { let sd = 424242; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'gemini'; P.openMap(); P.dun.setMapTab('dungeon', true); });
  // the words: no foxes left in Gemini's description
  const words = await page.evaluate(() => { const A = window.__pp.ANIMAS.gemini; return JSON.stringify([A.forms, A.skill, A.finisher, A.finDesc]); });
  ok(!/fox|kit\b|kits\b/i.test(words), 'Gemini is described as dragons: ' + words);
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  // ---- the ranking ----
  if (!FAST) {
    const res = {};
    const IDS = process.env.IDS ? process.env.IDS.split(',') : ALL;
    for (const N of [7, 1]) for (const id of IDS) for (let rep = 0; rep < (+process.env.REPS || 1); rep++) {
      const r = await page.evaluate(([id, N]) => {
        const P = window.__pp, D = P.arc.game._dbg, me = D.me, AN = D.AN, rnd = Math.random, G = P.arc.game, frame = () => G.update(1 / 60);
        let seed = 12345; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        // (the floor's own rules, rolled at random when it opens, would tilt every blow but Bahamut's flat share: set aside)
        const RU = D.RULES, dk = RU && RU.dmgK; if (RU) RU.dmgK = () => 1;
        try {
          AN.kit.main.id = id; AN.kit.main.k = 3; AN.kit.res = null; AN.kit.resonance = null;
          const live = D.mons.filter(m => !m.dead && !m.boss), pack = live.slice(0, N), MH = D.ST.atk * 150;
          pack.forEach((m, i) => { const p = D.X.walkPoint(me.x + 2.5 + (i % 3) * 1.3, me.y - 2 + i * 0.8, { r: m.r, mv: 0 }); Object.assign(m, { type: 'blob', r: 0.36, elite: false, affixes: null, guardFn: null, x: p.x, y: p.y, still: true, aggro: true, maxhp: MH, hp: 1e12, shield: 0, block: 0, kbx: 0, kby: 0, stun: 999, freeze: 0, cd: 99, atkCd: 99, act: 'move', state: 'move', st: 0, z: 0, chill: 0, curseT: 0, burn: 0, venom: 0, venomT: 0 }); ['mark', 'stagger', 'staggerT', 'deathfrost', 'rxCd', 'electro', 'brittle', 'prism', 'judge', 'curse', 'stunT', 'blockCd'].forEach(f => delete m[f]); });
          me.x = Math.round(me.x); me.y = Math.round(me.y); me.vx = me.vy = 0; D.g.t = 500; D.parts.length = 0; D.eshots.length = 0; D.shots.length = 0; D.zones.length = 0;
          D.mons.filter(m => !m.dead && !pack.includes(m)).forEach(m => { m.x = me.x + 300; m.y = me.y + 300; m.still = true; });
          if (AN.S.theme) { AN.S.theme.stop(); AN.S.theme = null; }
          Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [], q: [], judg: null, helix: null, circle: null, cine: null, dome: 0, flashT: 0 }); D.g.cineT = 0; D.g.slowT = 0; D.g.stopT = 0; D.banners.length = 0;
          if (!AN.summon()) return { id, err: 'refused' };
          // (the fight is stepped here by hand, a sixtieth of a second at a time, so every run sees the very same frames)
          let a, n = 0;
          while (n++ < 3000) { frame(); me.hp = D.ST.hp; a = AN.S.list[0]; if (a && a.st === 'fight') break; }
          a.life = 0.01;
          while (n++ < 6000) { frame(); me.hp = D.ST.hp; if (a.wait > 0) break; }
          // the banner is up: clear what the fight left in the air, then count only the final attack
          AN.S.fx.length = 0; for (let i = D.zones.length - 1; i >= 0; i--) if (D.zones[i].own === 'pet') D.zones.splice(i, 1); D.shots.length = 0;
          pack.forEach(m => { m.hp = 1e12; m.curseT = 0; m.burn = 0; m.venom = 0; m.stun = 999; });
          for (let f = 0; f < 3000 && (f < 390 || AN.S.helix || AN.S.judg); f++) { frame(); me.hp = D.ST.hp; }
          const dmg = pack.reduce((s, m) => s + (1e12 - m.hp), 0), atk = D.ST.atk;
          AN.S.list.length = 0; AN.S.fx.length = 0; AN.S.q.length = 0; AN.S.judg = null; AN.S.helix = null; D.g.cineT = 0; D.parts.length = 0; D.zones.length = 0;
          return { id, atkUnits: dmg / atk };
        } finally { Math.random = rnd; if (RU) RU.dmgK = dk; }
      }, [id, N]);
      if (r.err) { ok(false, `${id}: ${r.err}`); continue; }
      if (process.env.REPS) console.log('  rep', id, N, Math.round(r.atkUnits));
      const e = res[id] = res[id] || { id, room: 0, duel: 0 }; e[N === 7 ? 'room' : 'duel'] += Math.round(r.atkUnits / (+process.env.REPS || 1));
    }
    const rows = Object.values(res).map(r => Object.assign(r, { total: r.room + r.duel })).sort((a, b) => b.total - a.total);
    console.log('final attacks, in units of the pet\'s attack (room: pack of 7 · duel: one monster · total)');
    rows.forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${r.id.padEnd(12)} room ${String(r.room).padStart(6)}  duel ${String(r.duel).padStart(6)}  total ${String(r.total).padStart(6)}`));
    const gi = rows.findIndex(r => r.id === 'gemini');
    ok(gi === 2, `Twin Helix Nova ranks 3rd of ${rows.length} (it is ${gi + 1}; above it: ${rows.slice(0, gi).map(r => r.id).join(', ')})`);
  }
  // ---- the summon and the final attack, photographed ----
  const pack = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; D.mons.filter(m => !m.dead && !m.boss).slice(0, 7).forEach((m, i) => { const p = D.X.walkPoint(me.x + 2.5 + (i % 3) * 1.3, me.y - 2 + i * 0.8, { r: m.r, mv: 0 }); m.x = p.x; m.y = p.y; m.still = true; m.aggro = true; m.hp = 1e7; m.maxhp = 1e7; }); });
  await pack();
  const sum = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, AN = D.AN; AN.kit.main.id = 'gemini'; AN.kit.main.k = 3; AN.kit.res = null; AN.kit.resonance = null; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); return AN.summon(); });
  ok(sum, 'Gemini answers the summons');
  await page.waitForTimeout(1350); await shot('1-summon');
  await page.waitForFunction(() => { const a = window.__pp.arc.game._dbg.AN.S.list[0]; return a && a.st === 'fight'; }, null, { timeout: 15000 });
  await page.waitForTimeout(1800); await shot('2-fight');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; }); });
  const cine = await page.waitForFunction(() => !!window.__pp.arc.game._dbg.AN.S.helix, null, { timeout: 10000 }).then(() => true, () => false);
  ok(cine, 'the Twin Helix Nova cinematic plays');
  if (cine) {
  const at = t => page.waitForFunction(t => { const H = window.__pp.arc.game._dbg.AN.S.helix; return !H || H.t >= t; }, t, { timeout: 10000, polling: 'raf' });
  await at(0.55); await shot('3-rise');
  await at(1.4); await shot('4-charge');
  await at(1.83); await shot('5-impact');
  const hitN = await page.evaluate(() => { const H = window.__pp.arc.game._dbg.AN.S.helix; return H ? H.hitN : -1; });
  await at(2.35); await shot('6-nova');
  ok(hitN >= 6, `the nova strikes the crowd (${hitN} of 7 hit)`);
  await page.waitForFunction(() => !window.__pp.arc.game._dbg.AN.S.helix, null, { timeout: 10000 });
  await page.waitForTimeout(400);
  const after = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { cineT: D.g.cineT, list: D.AN.S.list.map(a => a.st) }; });
  ok(after.cineT === 0, 'the fight resumes after the cinematic ' + JSON.stringify(after));
  }
  // ---- the card and the portrait ----
  await page.evaluate(() => window.__pp.closeArcade(true)); await page.waitForTimeout(400);
  await page.evaluate(() => window.__pp.openAnimas('gemini')); await page.waitForTimeout(900);
  await shot('7-card');
  if (SHOTS) {
    const url = await page.evaluate(() => window.__pp.AnimaPortrait.canvas('gemini', 3, 340, 220).toDataURL());
    require('fs').writeFileSync(path.resolve(__dirname, '../shots/gemini-8-portrait.png'), Buffer.from(url.split(',')[1], 'base64'));
    const url2 = await page.evaluate(() => { const P = window.__pp, cv = document.createElement('canvas'); cv.width = 3 * 104 * 2; cv.height = 132 * 2; const c = cv.getContext('2d'); [1, 2, 3].forEach(k => c.drawImage(P.AnimaPortrait.canvas('gemini', k, 104, 132), (k - 1) * 208, 0, 208, 264)); return cv.toDataURL(); });
    require('fs').writeFileSync(path.resolve(__dirname, '../shots/gemini-9-forms.png'), Buffer.from(url2.split(',')[1], 'base64'));
  }
  ok(errors.length === 0, `no page errors (${errors.length}) ${errors.slice(0, 3).join(' | ')}`);
  await browser.close();
  console.log(fails.length ? `gemini-dragons: ${fails.length} FAILED` : 'gemini-dragons OK');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
