// The Tower's scaling and floor rules (v86): monsters' and bosses' health and blows by floor, twice the monsters from
// floor 10, Super Fiend bars and blows; keys (each challenge), four guardians, each curse, each boon and bane, the lesser
// bosses, Fortune Reversed. usage: node tests/floor-rules.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.openMap(); P.dun.setMapTab('dungeon', true); });
  // 1. the numbers by floor
  const nums = await page.evaluate(() => { const P = window.__pp; return [1, 9, 10, 11, 25, 50, 84, 119, 120].map(n => { const F = P.dun.floorDef(n); return { n, hp: +F.monHp.toFixed(2), dmg: +F.monDmg.toFixed(2), pack: F.pack, max: F.maxMons, band: F.band, fiend: F.fiend ? { bars: F.fiend.bars, base: F.fiend.baseBars, more: F.fiend.hardBars, hit: +F.fiend.dmgK.toFixed(2) } : null }; }); });
  console.log('  by floor', JSON.stringify(nums));
  const byN = Object.fromEntries(nums.map(o => [o.n, o]));
  ok(byN[1].hp === 4 && byN[1].dmg === 1.35 && byN[120].hp === 40 && byN[120].dmg === 4, 'the floor layer: health x4 at floor 1 to x10 at 120, blows x1.35 to x2 (x4 and x2 more from floor 10: x40 / x4 at the top)');
  ok(byN[9].hp < 5 && byN[10].hp >= 16 && byN[10].dmg >= 2.7 && byN[50].hp > 20 && byN[119].hp > 39 && byN[119].dmg > 3.9, 'from floor 10 the second layer: x4 health and x2 blows on top (floor 10: x' + byN[10].hp + ' / x' + byN[10].dmg + '; floor 119: x' + byN[119].hp + ' / x' + byN[119].dmg + ')');
  ok(byN[9].pack === 9 && byN[11].pack === 18 && byN[9].max === 97 && byN[11].max === 222 && byN[120].pack === 12 && byN[10].pack === 9, 'twice the monsters from floor 10 (packs 9 -> 18, cap 97 -> 222), never on a fiend floor');
  const fiends = await page.evaluate(() => { const P = window.__pp; return [10, 20, 40, 50, 60, 90, 120].map(n => { const f = P.fiendFor(n); return [n, f.hardBars, +f.hardK.toFixed(2)]; }); });
  console.log('  fiends', JSON.stringify(fiends));
  const fb = Object.fromEntries(fiends.map(o => [o[0], o]));
  ok(fb[10][1] === 10 && fb[40][1] === 25 && fb[20][2] === 1.3 && fb[40][2] === 1.3, 'Super Fiends 10-49: +10 bars rising to +25, blows x1.3');
  ok(fb[50][1] === 30 && fb[120][1] === 50 && fb[50][2] === 1.5 && fb[120][2] === 2 && fb[90][1] > 30 && fb[90][2] > 1.5, 'Super Fiends 50+: +30 bars rising to +50, blows x1.5 rising to x2');
  const bands = await page.evaluate(() => { const P = window.__pp; return [20, 21, 39, 40, 41, 59, 60, 61, 79, 80, 81, 99, 100, 101, 119, 120, 5].map(n => P.dun.floorDef(n).band || '-').join(' '); });
  ok(bands === '- keys keys - four four - curse curse - boon boon - chaos chaos - -', 'bands: keys 21-39, four 41-59, curse 61-79, boon 81-99, chaos 101-119, none on fiend floors (' + bands + ')');
  // the rolls over many seeds
  const rolls = await page.evaluate(() => { const P = window.__pp, out = { curses: {}, boons: {}, rev: 0, pb: {}, mb: {} }; for (let s = 0; s < 400; s++) { const r = P.rollFloorRules(P.dun.floorDef(65), P.mulberry32(s)); out.curses[r.curse.id] = (out.curses[r.curse.id] || 0) + 1; const b = P.rollFloorRules(P.dun.floorDef(85), P.mulberry32(s)); out.boons[b.mboon.id] = (out.boons[b.mboon.id] || 0) + 1; const c = P.rollFloorRules(P.dun.floorDef(105), P.mulberry32(s)); if (c.reversed) { out.rev++; out.pb[c.pboon.id] = 1; out.mb[c.mbane.id] = 1; if (!c.keys || c.curse) out.bad = 1; } else if (!c.curse || !c.mboon || !c.keys) out.bad = 1; } return out; });
  console.log('  rolls', JSON.stringify(rolls));
  ok(Object.keys(rolls.curses).length === 8 && Object.keys(rolls.boons).length === 4 && rolls.rev > 20 && rolls.rev < 70 && Object.keys(rolls.pb).length === 5 && Object.keys(rolls.mb).length === 4 && !rolls.bad, 'the rolls: every curse and boon turns up; chaos floors carry curse + boon + keys, and about one in ten is reversed (' + rolls.rev + '/400) with a party boon and a monster bane');

  // 2. a floor of each band, played by the hook
  const start = async (n, seed) => {
    await page.evaluate(([n, seed]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(n, seed); }, [n, seed]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
    await page.waitForTimeout(300);
    return page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { band: D.F.band, RU: JSON.parse(JSON.stringify(D.RU)), mons: D.mons.length, lessers: D.mons.filter(m => m.lesser && !m.brute).length, keys: D.RULES ? D.RULES.keys.map(k => k.kind.id) : [], pack: D.F.pack }; });
  };
  const run = secs => page.evaluate(async secs => { const P = window.__pp, A = P.arc, G = A.game, D = G._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D.me) { D.me.hp = D.ST.hp; D.me.mp = 9999; } } }, secs);
  // (in passes: a splitter leaves jellies when it dies)
  const killAll = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg; for (let k = 0; k < 4; k++) { for (const m of D.mons) if (!m.dead && (!m.boss || m.lesser)) D.hitMon(m, 1e12, {}); await new Promise(r => setTimeout(r, 250)); } });
  const state = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, g = D.g; return { cleared: g.cleared, won: g.won, bossN: g.bossN, down: g.bossDown, bosses: D.mons.filter(m => m.boss && !m.dead && !m.lesser && !m.brute).map(m => m.bname), held: D.RULES ? D.RULES.held() : -1, keys: D.RULES ? D.RULES.keys.map(k => k.kind.id + ':' + k.st) : [], goal: window.__pp.arc.goal || '' }; });

  // floor 25: keys. Each key's challenge in turn
  let s = await start(25, 2525); console.log('  floor 25', JSON.stringify(s));
  ok(s.band === 'keys' && s.RU.keys && s.keys.length === 4, 'floor 25 holds four keys (' + s.keys.join(', ') + ')');
  const plain = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const m = D.mons.find(m => !m.boss && !m.elite && m.type !== 'nest'); return { type: m.type, hp: Math.round(m.maxhp), dmg: +m.dmg.toFixed(1), base: window.__pp.MON[m.type].hp, bdmg: window.__pp.MON[m.type].dmg, hpMul: D.F.hpMul, dmgMul: D.F.dmgMul, monHp: D.F.monHp, monDmg: D.F.monDmg }; });
  console.log('  a monster', JSON.stringify(plain));
  ok(Math.abs(plain.hp - plain.base * plain.hpMul * plain.monHp) < plain.hp * 0.01 && Math.abs(plain.dmg - plain.bdmg * plain.dmgMul * plain.monDmg * 1.25) < plain.dmg * 0.02, 'a floor-25 monster carries the layers: health x' + plain.monHp.toFixed(1) + ', blows x' + plain.monDmg.toFixed(2) + ' on the old scaling');
  await killAll(); await run(1.5);
  let st = await state(); ok(!st.cleared && st.held === 0, 'all monsters down but no keys: the boss does not come (' + st.goal + ')');
  // play each key: walk the pet onto it, then satisfy its challenge by the hook
  for (let i = 0; i < 4; i++) {
    const kind = await page.evaluate(i => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[i]; D.me.x = k.x; D.me.y = k.y; D.me.wx = k.x; D.me.wy = k.y; return k.kind.id; }, i);
    await run(0.6);
    let kst = await page.evaluate(i => window.__pp.arc.game._dbg.RULES.keys[i].st, i);
    if (kst !== 'active') console.log('  key state', kst, await page.evaluate(i => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[i]; return JSON.stringify({ me: [D.me.x, D.me.y], k: [k.x, k.y], t: k.t, fail: k.failT, sh: k.shards.map(q => [q.got, Math.hypot(q.x - k.x, q.y - k.y).toFixed(1)]), dead: D.me.dead, intro: D.g.intro }); }, i));
    ok(kst === 'active', `key ${i + 1} (${kind}) begins when the pet reaches it`);
    if (kind === 'ward') { await page.evaluate(i => { const k = window.__pp.arc.game._dbg.RULES.keys[i]; k.t = 59.5; }, i); await run(1.2); }
    else if (kind === 'keeper') { ok(await page.evaluate(i => { const k = window.__pp.arc.game._dbg.RULES.keys[i]; return !!k.keeper && k.keeper.lesser && k.spawned.length >= 6; }, i), '  a keeper and its mob came'); await page.evaluate(i => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[i]; D.hitMon(k.keeper, 1e12, {}); }, i); await run(0.5); }
    else if (kind === 'shards') { ok(await page.evaluate(i => window.__pp.arc.game._dbg.RULES.keys[i].shards.length === 5, i), '  five shards lie about'); await page.evaluate(i => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[i]; for (const q of k.shards) { D.me.x = q.x; D.me.y = q.y; } k.shards.forEach(q => q.got = true); }, i); await run(0.5); }
    else if (kind === 'rift') { for (let w = 0; w < 4; w++) { await page.evaluate(i => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[i]; for (const m of k.spawned) if (!m.dead) D.hitMon(m, 1e12, {}); }, i); await run(2.6); } }
    kst = await page.evaluate(i => window.__pp.arc.game._dbg.RULES.keys[i].st, i);
    ok(kst === 'done', `  key ${i + 1} (${kind}) is held`);
  }
  await killAll(); await run(3); st = await state(); console.log('  after keys', JSON.stringify(st));
  ok(st.held === 4 && st.cleared, 'with four keys held the boss comes');
  // a ward that is broken
  s = await start(31, 3131);
  const wardI = s.keys.indexOf('ward');
  if (wardI >= 0) { await page.evaluate(i => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[i]; D.me.x = k.x; D.me.y = k.y; }, wardI); await run(0.6); await page.evaluate(i => { const D = window.__pp.arc.game._dbg, k = D.RULES.keys[i]; k.hp = 0.5; const m = D.mons.find(m => !m.dead && !m.boss); m.x = k.x + 0.3; m.y = k.y; m.wx = m.x; m.wy = m.y; }, wardI); await run(1.2); const kst = await page.evaluate(i => window.__pp.arc.game._dbg.RULES.keys[i].st, wardI); ok(kst === 'idle', 'a ward broken by a monster loses the key, to be tried again'); }
  else console.log('  (floor 31 rolled no ward; skipped the break check)');

  // floor 45: four guardians
  s = await start(45, 4545); console.log('  floor 45', JSON.stringify(s));
  ok(s.band === 'four' && s.RU.four, 'floor 45 is a four-guardian floor');
  await killAll(); await run(7.5); st = await state(); console.log('  guardians', JSON.stringify(st));
  ok(st.bossN === 4 && st.bosses.length === 4 && new Set(st.bosses).size === 4, 'four guardians of four kinds drop in');
  for (let i = 0; i < 3; i++) { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const b = D.mons.find(m => m.boss && !m.brute && !m.dead); D.hitMon(b, 1e12, {}); }); await run(0.4); st = await state(); ok(!st.won && st.down === i + 1, `guardian ${i + 1} down, the floor goes on (${st.bosses.length} left)`); }
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const b = D.mons.find(m => m.boss && !m.brute && !m.dead); D.hitMon(b, 1e12, {}); }); await run(0.4); st = await state();
  ok(st.won, 'the fourth guardian down wins the floor');

  // floor 65: a curse (find seeds for several)
  const curseSeeds = await page.evaluate(() => { const P = window.__pp, F = P.dun.floorDef(65), want = {}; for (let s = 1; s < 300 && Object.keys(want).length < 8; s++) { const r = P.rollFloorRules(F, P.mulberry32(s)); if (!want[r.curse.id]) want[r.curse.id] = s; } return want; });
  console.log('  curse seeds', JSON.stringify(curseSeeds));
  s = await start(65, curseSeeds.noheal); ok(s.RU.curse.id === 'noheal', 'floor 65: NO HEALING');
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.intro = 0; D.me.hp = 10; D.X.drop ? D.X.drop('hp', D.me.x, D.me.y) : D.AN; return D.me.hp; });
  await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < 1500) { await new Promise(r => requestAnimationFrame(r)); D.me.inv = 9; for (const q of D.picks) { q.x = D.me.x; q.y = D.me.y; q.z = 0; q.vz = 0; } } }); r = await page.evaluate(() => window.__pp.arc.game._dbg.me.hp);
  ok(r <= 10.5, 'a healing orb heals nothing under NO HEALING (hp ' + r.toFixed(1) + ')');
  s = await start(65, curseSeeds.noskill); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.intro = 0; D.me.mp = 999; const m0 = D.me.mp; D.useStrong('strong'); return [m0, D.me.mp]; });
  ok(r[0] === r[1], 'NO SKILLS: a Strong attack does nothing');
  s = await start(65, curseSeeds.noult); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.intro = 0; D.me.mp = 999; const m0 = D.me.mp; D.useUlt(); return [m0, D.me.mp]; });
  ok(r[0] === r[1], 'NO ULTIMATES: the Ultimate does nothing');
  s = await start(65, curseSeeds.drain); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.intro = 0; }); const h0 = await page.evaluate(() => window.__pp.arc.game._dbg.me.hp);
  await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < 3000) { await new Promise(r => requestAnimationFrame(r)); D.me.inv = 9; } });
  const h1 = await page.evaluate(() => window.__pp.arc.game._dbg.me.hp); ok(h1 < h0 - 1, `WITHERING drains HP (${h0.toFixed(0)} -> ${h1.toFixed(0)} in 3 s)`);
  s = await start(65, curseSeeds.nostone); r = await page.evaluate(() => window.__pp.arc.game._dbg.stones.length); ok(r === 0, 'BARREN: no stones on the floor');
  s = await start(65, curseSeeds.noacc); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return Object.keys(D.ST.acc || {}).length; }); ok(r === 0, 'BARE: the pet fights without its accessories');
  s = await start(65, curseSeeds.noswitch); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.intro = 0; return D.party.length > 1 ? D.switchTo(1) : 'one pet'; }); ok(r === false || r === 'one pet', 'BOUND: switching is refused (' + r + ')');
  s = await start(65, curseSeeds.nosummon); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.AN ? D.AN.ready() : 'no anima'; }); ok(r === false || r === 'no anima', 'NO SUMMONS: the Anima cannot answer (' + r + ')');

  // floor 85: a boon and the lesser bosses
  const boonSeeds = await page.evaluate(() => { const P = window.__pp, F = P.dun.floorDef(85), want = {}; for (let s = 1; s < 300 && Object.keys(want).length < 4; s++) { const r = P.rollFloorRules(F, P.mulberry32(s)); if (!want[r.mboon.id]) want[r.mboon.id] = s; } return want; });
  s = await start(85, boonSeeds.horde); console.log('  floor 85 horde', JSON.stringify(s));
  ok(s.RU.mboon.id === 'horde' && s.pack >= 36 && s.lessers === 4, 'A HORDE: twice the monsters again (packs of ' + s.pack + '), and four lesser bosses roam');
  const plainN = await page.evaluate(() => { const P = window.__pp; return P.dun.floorDef(85).pack; }); ok(plainN === 24 && s.pack === 48, 'floor 85 packs: 24 by the floor, 48 with the horde');
  s = await start(85, boonSeeds.tough); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(m => !m.boss && !m.elite && m.type !== 'nest'); return m.maxhp / (window.__pp.MON[m.type].hp * D.F.hpMul * D.F.monHp); }); ok(Math.abs(r - 2) < 0.02, 'HARDY: monsters at twice the health');
  s = await start(85, boonSeeds.swift); r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, m = D.mons.find(m => !m.boss && !m.elite && m.type !== 'nest'); return m.spd / window.__pp.MON[m.type].spd; }); ok(r > 1.8 && r < 2.2, 'SWIFT: monsters at twice the speed');
  r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.lesser && !m.brute); return { aggro: b.aggro, hpK: b.maxhp / D.makeBoss(b.bk).maxhp }; }); ok(!r.aggro && Math.abs(r.hpK - 0.5) < 0.01, 'a lesser boss sleeps till the pet comes near, at half a guardian\'s health');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.lesser && !m.brute); D.me.x = b.x + 2; D.me.y = b.y; }); await run(0.5); r = await page.evaluate(() => window.__pp.arc.game._dbg.mons.find(m => m.lesser).aggro); ok(r === true, 'it wakes when the pet comes near');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.lesser && !m.brute); D.hitMon(b, 1e12, {}); }); await run(0.3); st = await state(); ok(!st.won && !st.cleared, 'a lesser boss falling does not end the floor');

  // floor 105: chaos, and a reversed one
  const chaosSeeds = await page.evaluate(() => { const P = window.__pp, F = P.dun.floorDef(105); let rev = 0, norm = 0; for (let s = 1; s < 400; s++) { const r = P.rollFloorRules(F, P.mulberry32(s)); if (r.reversed && !rev) rev = s; if (!r.reversed && !norm) norm = s; } return { rev, norm }; });
  s = await start(105, chaosSeeds.norm); console.log('  floor 105', JSON.stringify(s));
  ok(s.band === 'chaos' && s.RU.curse && s.RU.mboon && s.keys.length === 4 && !s.RU.reversed, 'floor 105: a curse, a boon and four keys');
  s = await start(105, chaosSeeds.rev); console.log('  floor 105 reversed', JSON.stringify(s));
  ok(s.RU.reversed && s.RU.pboon && s.RU.mbane && !s.RU.curse && s.keys.length === 4, 'FORTUNE REVERSED: the party gets ' + (s.RU.pboon && s.RU.pboon.id) + ', the monsters ' + (s.RU.mbane && s.RU.mbane.id) + ', keys still');
  const card = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 4500) { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(b => seen.add(b.s)); } return [...seen]; });
  console.log('  cards', JSON.stringify(card));
  ok(card.includes('FORTUNE REVERSED'), 'the FORTUNE REVERSED card flashes up');
  console.log('errors', errors.length, errors.slice(0, 4));
  ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
