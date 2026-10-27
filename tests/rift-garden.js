// The Garden of Unborn Stars (v95): twelve stages in three sections (dungeon, the Seedling March, dungeon, boss; dungeon, dungeon,
// starfall, boss; gallery, dungeon, dungeon, boss), every dungeon rolling a random hand of boons and curses, Rift-touched
// Cocopets as mini bosses, three Super Fiend-class bosses (Orrubel, Ambrel, Calyx Astrum), the sealing, and the Comet Meadow.
// usage: node tests/rift-garden.js   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 22, seals: ['belfry'] }); const { page, errors, shot, start, run, goTo, useObj, killAll, goal, state, exitStage, bossWake, watchActs, killBoss, rs } = T;
  const D = f => page.evaluate(f);
  let r = await D(() => ({ open: window.__pp.riftOpen('garden'), built: !!window.__pp.RIFT_BY_ID.garden, gate: !!window.__pp.RIFT_GATES.garden, stages: window.__pp.RIFT_BY_ID.garden.stages.map(s => s.kind).join() }));
  ok(r.open && r.built && r.gate, 'with the Belfry sealed the Garden is open, built, and has its gate');
  ok(r.stages === 'fight,puzzle,fight,boss,fight,fight,puzzle,boss,puzzle,fight,fight,boss', 'twelve stages: dungeon, march, dungeon, boss; dungeon, dungeon, starfall, boss; gallery, dungeon, dungeon, boss');
  const killMini = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && m.lesser) { m.guardFn = null; m.act = 'move'; D.hitMon(m, 1e12, { flat: true, pierce: true }); } await new Promise(r => setTimeout(r, 300)); });
  // 1. the Egg Orchard: a rolled floor of the garden's brood, a Rift-touched Cocopet for its mini boss, a random hand of rules
  await start('garden', 0); await run(1); r = await D(() => { const D = window.__pp.arc.game._dbg, RU = D.F.rules; return { name: D.F.rift.name, mons: D.mons.length, brood: D.mons.filter(m => ['thornling', 'milkcap', 'pollenmoth', 'egg'].includes(m.type)).length, mini: D.mons.filter(m => m.lesser && m.evil).map(m => m.boss), band: D.F.band, hand: [RU.curse && RU.curse.id, RU.mboon && RU.mboon.id, RU.pboon && RU.pboon.id, RU.mbane && RU.mbane.id].filter(Boolean), rules: !!D.RULES }; });
  console.log('  s0', JSON.stringify(r)); ok(r.name === 'The Egg Orchard' && r.mons > 60 && r.brood > 30 && r.mini[0] === 'briarpet' && r.band === 'rrand' && r.hand.length >= 1 && r.rules, 'the Egg Orchard: the garden\'s brood, Briar the Rift-touched pet, and a hand of rules dealt');
  // the hands vary from floor to floor
  const hands = new Set(); for (let i = 0; i < 6; i++) { await start('garden', i % 2 ? 2 : 0); hands.add(await D(() => { const RU = window.__pp.arc.game._dbg.F.rules; return [RU.curse && RU.curse.id, RU.mboon && RU.mboon.id, RU.pboon && RU.pboon.id, RU.mbane && RU.mbane.id].join('/'); })); }
  ok(hands.size >= 3, `the hands are random (${hands.size} different in six floors)`);
  await start('garden', 0); await killAll(); await run(0.5); r = await state(); ok(!r.done, 'the brood down, the mini boss still up: not done');
  await killMini(); await run(1); r = await state(); ok(r.done, 'the mini boss down: the floor is clear'); await exitStage(); r = await rs(); ok(r.prog.garden === 1, 'checkpoint: stage 2');
  // 2. the Seedling March (stage 1): an army run up the moss lane (played in full by tests/rift-gdn-march.js); here the
  // army is put before the Colossus, big and armed, and marches it down
  await start('garden', 1); await run(4.5); r = await D(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { name: D.F.rift.name, mode: mod.S.mode, n: mod.S.n, d: mod.S.d }; });
  console.log('  march', JSON.stringify(r)); ok(r.name === 'The Seedling March' && r.mode === 'run' && r.n === 8 && r.d > 0, 'the Seedling March: eight seedlings marching up the lane');
  await shot('march');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; m.warp(176); m.setN(300); m.S.bow = m.S.spread = true; const t0 = performance.now(); while (performance.now() - t0 < 90000 && !D.RIFT.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (m.S.n < 60) m.setN(300); } return { done: D.RIFT.done, exit: D.RIFT.exit && D.RIFT.exit.label }; });
  console.log('  colossus', JSON.stringify(r)); ok(r.done && r.exit === 'The Garden\'s heart', 'the Milkcap Colossus falls: the way to the Garden\'s heart opens');
  await exitStage();
  // 3. the Falling Nursery (stage 6): stand under the stars; shards spill; enough caught blooms the bud
  await start('garden', 6); await run(5); r = await D(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { mode: mod.R.mode, stars: mod.stars.length }; }); ok(r.mode === 'run' && r.stars >= 1, 'the stars are falling');
  await shot('starfall');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, R = mod.R; const t0 = performance.now(); let shardHit = false; while (performance.now() - t0 < 60000 && !D.RIFT.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const s = mod.stars.filter(q => !q.shard).sort((a, b) => (b.t / b.dur) - (a.t / a.dur))[0]; if (s) { D.me.x = s.x; D.me.y = s.y; } if (!shardHit && R.caught >= 8) { const sh = mod.stars.find(q => q.shard); if (sh && sh.t > sh.dur - 0.05) { D.me.x = sh.x; D.me.y = sh.y; shardHit = R.caught; } } } return { caught: R.caught, done: D.RIFT.done, shardHit }; });
  console.log('  stars', JSON.stringify(r)); ok(r.done && r.caught >= 24, 'standing under each star catches it: twenty-four caught, the star-bud blooms'); await exitStage();
  // 4. the Seedshot Gallery (stage 8): the pet's bolts pop the pods; enough and the hedge withers
  await start('garden', 8); await run(3); r = await D(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { mode: mod.R.mode, pods: mod.pods.length, hedge: D.M.marks.h.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 0) }; }); ok(r.mode === 'run' && r.pods >= 1 && r.hedge, 'pods drift over the moss; the hedge stands');
  await shot('gallery');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, R = mod.R; const t0 = performance.now(); let shotsFired = 0; while (performance.now() - t0 < 60000 && !D.RIFT.done) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; const p = mod.pods[0]; if (p && shotsFired % 6 === 0) { D.shots.push({ x: p.x, y: p.y, vx: 0, vy: 0, r: 0.14, dmg: 1, life: 0.2, t: 0, pierce: 0, style: 'bolt', el: 'leaf', src: 'normal' }); } shotsFired++; } return { pops: R.pops, done: D.RIFT.done, hedge: D.M.marks.h.every(p => D.M.G[p.ty * D.M.MW + p.tx] === 1) }; });
  console.log('  pods', JSON.stringify(r)); ok(r.done && r.pops >= 24 && r.hedge, 'bolts pop the pods: twenty-four popped, the hedge withers'); await exitStage();
  // 5. the three bosses: Super Fiend-class fights; each kill moves the checkpoint on; the last seals the rift
  const bossCheck = async (stage, id, name, bars, objKind, weakKey, stunBanner) => {
    await start('garden', stage); await run(6); let b = await D(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, boss: !!D.g.boss }; });
    console.log('  ' + id, JSON.stringify(b)); ok(b.fd && b.name === name && b.bars === bars && b.boss, `${name}: a Super Fiend-class fight of ${bars} bars`);
    const st = await page.evaluate(async ([objKind, weakKey]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss; const t0 = performance.now(); let obj = null; while (performance.now() - t0 < 20000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; const list = D.mons.filter(m => m.fobj && m.kind === objKind && !m.dead); if (objKind === 'blossom') obj = list.find(m => !m.invuln) || null; else obj = list[0] || null; if (obj) break; }
      if (!obj) return { obj: false }; const objs = D.mons.filter(m => m.fobj && m.kind === objKind && !m.dead); for (const o of (objKind === 'lantern' ? objs : [obj])) { o.invuln = false; D.hitMon(o, 1e12, { flat: true }); } await new Promise(r => setTimeout(r, 500)); return { obj: true, stun: b.stunT, weak: !!(D.FD.S.weak[weakKey]), banners: D.banners.map(x => x.s) }; }, [objKind, weakKey]);
    console.log('  stun', JSON.stringify(st)); ok(st.obj && st.stun > 3 && st.weak, `${name}: its ${objKind}s broken, it is stunned with the ${weakKey} bared`);
    await shot(id);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.hitMon(D.g.boss, 1e12, { pierce: true }); }); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 40000 }); await page.waitForTimeout(800);
  };
  await bossCheck(3, 'orrubel', 'Orrubel', 21, 'pod', 'eye'); r = await rs(); ok(r.prog.garden === 4, 'Orrubel slain: checkpoint 5 (section 2)');
  await bossCheck(7, 'ambrel', 'Ambrel', 24, 'lantern', 'thorax'); r = await rs(); ok(r.prog.garden === 8, 'Ambrel slain: checkpoint 9 (section 3)');
  await start('garden', 11); await run(6); r = await D(() => { const D = window.__pp.arc.game._dbg; return { name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, seal: D.F.rift.seal }; }); console.log('  calyx', JSON.stringify(r)); ok(r.name === 'Calyx Astrum' && r.bars === 25 && r.seal, 'Calyx Astrum: twenty-five bars; the sealing follows');
  await shot('calyx');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.hitMon(D.g.boss, 1e12, { pierce: true }); });
  const seal = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; const seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 25000) { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => seen.add(x.s)); if (window.__pp.arc.state !== 'play') break; } return [...seen]; });
  console.log('  seal', JSON.stringify(seal)); ok(seal.includes('THE ROOT WITHERS') && seal.includes('SEAL THE RIFT') && seal.includes('THE BLOOM SIGIL'), 'the sealing: the root withers, the pet goes to the wound, the Bloom Sigil');
  await page.waitForTimeout(1500); r = await page.evaluate(() => ({ sealed: !!window.__pp.riftState().seals.garden, gate: window.__pp.gateOpen('garden'), next: window.__pp.riftOpen('dunes') })); ok(r.sealed && r.gate, 'the Garden is sealed: its gate opens');
  // the Unbroken Constellation: trace every line once; revisiting a star is fine, a line twice is not; undo; the start
  // star; the bridge and the dark star; three skies
  await start('garden', 'gate'); await run(2.5); r = await D(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; return { sky: mod.R.sky, stars: mod.stars.length, lines: mod.lines.length, undo: !!document.querySelector('#riftTrace [data-undo]'), goal: document.getElementById('arcGoal').textContent }; });
  console.log('  sky1', JSON.stringify(r)); ok(r.sky === 0 && r.stars === 5 && r.lines === 8 && r.undo && /0\/8 lines/.test(r.goal), 'the first sky: five stars, eight dotted lines, an Undo button');
  await shot('constellation');
  const trace = (seq) => page.evaluate(async seq => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; const out = []; for (const i of seq) { mod.visit(i); out.push(mod.R.used.size); await new Promise(r => requestAnimationFrame(r)); } return { used: mod.R.used.size, end: mod.end(), path: mod.R.path.slice(), out }; }, seq);
  // the Lantern: begin at an even star (2): stranded; undo back; begin at an odd star (0) and trace all eight
  r = await trace([2, 1, 0, 2, 3, 0]); console.log('  evenstart', JSON.stringify(r)); ok(r.used === 5 && r.end === 0, 'from an even star: five lines in, stranded with no line from the end');
  r = await page.evaluate(async () => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; const u0 = mod.R.used.size; document.querySelector('#riftTrace [data-undo]').click(); const u1 = mod.R.used.size; mod.visit(0); const again = mod.R.used.size; mod.visit(3); const repeat = mod.R.used.size; document.querySelector('#riftTrace [data-restart]').click(); return { u0, u1, again, repeat, cleared: mod.R.used.size === 0 && mod.R.path.length === 0 }; });
  console.log('  undo', JSON.stringify(r)); ok(r.u1 === r.u0 - 1 && r.again === r.u1 + 1 && r.repeat === r.again && r.cleared, 'Undo takes the last line back; a traced line cannot be walked twice; Start over clears the sky');
  r = await trace([0, 1, 2, 3, 0, 2, 4, 3, 1]); await run(3.2); r = await D(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { sky: mod.R.sky, stars: mod.stars.length, start: mod.SKIES[1].start }; }); console.log('  sky2', JSON.stringify(r)); ok(r.sky === 1 && r.stars === 6 && r.start === 0, 'the Lantern traced: the Twin Horns, six stars with a star to begin at');
  // the Twin Horns: a wrong start is refused; from the bright star all eight lines
  r = await trace([4]); ok(r.path.length === 0, 'the thread may not begin away from the bright star');
  r = await trace([0, 1, 2, 3, 4, 2, 0, 5, 4]); await run(3.2); r = await D(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { sky: mod.R.sky, stars: mod.stars.length, bridge: mod.SKIES[2].bridge }; }); console.log('  sky3', JSON.stringify(r)); ok(r.sky === 2 && r.stars === 7 && r.bridge[1] === 6, 'the Twin Horns traced: the Bull\'s Eye, seven stars with a bridge and a dark star');
  // the Bull's Eye: the dark star refuses until the bridge is crossed; then the whole sky
  r = await trace([4, 6]); ok(r.path.length === 1 && r.used === 0, 'the dark star cannot be entered before the bridge');
  await page.evaluate(() => document.querySelector('#riftTrace [data-restart]').click());
  r = await trace([2, 0, 1, 2, 3, 6, 4, 5, 3, 4]); console.log('  eye', JSON.stringify(r)); ok(r.used === 9, 'after the bridge the dark star wakes: nine lines traced');
  await run(1); r = await state(); ok(r.done, 'three skies traced: Taurus wakes');
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 15000 }); await page.waitForTimeout(800);
  r = await page.evaluate(() => ({ gate: !!window.__pp.riftState().gates.garden, anima: window.__pp.st.animas.have.taurus || 0 })); ok(r.gate && r.anima >= 1, 'the Taurus Anima is unlocked');
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
