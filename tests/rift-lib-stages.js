// The Library of Unwritten Lives' three challenges: the Catalogue of Truth, the Unfinished Fable, the False Procession
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, errors, shot, start, run, exitStage } = T;
  const M = (f, a) => page.evaluate(f, a);
  const frames = n => M(async n => { for (let i = 0; i < n; i++) await new Promise(r => requestAnimationFrame(r)); }, n);
  const killGuards = list => M(l => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; for (const m of S[l]) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); }, list);
  const goTo = (x, y) => M(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; }, [x, y]);

  /* ---- THE CATALOGUE OF TRUTH: which is the true eye? ---- */
  await start('library', 0); await run(2.4);
  const cat = () => M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod, S = mod.S; return { phase: S.phase, round: S.round, left: S.mob.left, alive: S.mob.alive.filter(m => !m.dead).length, strong: !!S.mob.strong, eye: mod.eyeSlot(), wrong: S.wrong }; });
  // clear the mob: keep killing until the pedestal rises; count what came out
  const clearMob = () => M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; let n = 0, maxAlive = 0, strong = null; const seen = new Set(); const t0 = performance.now();
    while (performance.now() - t0 < 60000 && S.phase === 'mob') { await new Promise(r => requestAnimationFrame(r)); const al = S.mob.alive.filter(m => !m.dead); maxAlive = Math.max(maxAlive, al.length); for (const m of al) { if (!seen.has(m)) { seen.add(m); n++; } if (m.strong) strong = { hp: m.maxhp, r: m.r }; if (Math.random() < 0.25) D.hitMon(m, 1e9, { flat: true }); } }
    return { n, maxAlive, strong, phase: S.phase }; });
  r = await clearMob(); ok(r.n === 80 && r.maxAlive <= 24 && r.strong && r.strong.r > 0.9 && r.phase === 'ready', 'a mob of 80 (at most 24 at once, one strong ink warden); cleared: the pedestal rises ' + JSON.stringify(r)); await shot('lib-cat-ready');
  const wake = () => M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, K = D.M.marks.K[0]; const t0 = performance.now(); while (performance.now() - t0 < 10000 && mod.S.phase !== 'ready') await new Promise(r => requestAnimationFrame(r)); const t1 = performance.now(); while (performance.now() - t1 < 12000 && mod.S.phase === 'ready') { D.me.x = K.x; D.me.y = K.y; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); } const o = D.RIFT.self.objs.find(q => q.kind === 'pedestal'); window.__wk = { ph: mod.S.phase, used: o.used, ch: o.ch, dead: D.me.dead, intro: mod.S.intro }; return mod.S.phase; });
  // the shuffle: track the eye by its slot changes; it must end where the stage says
  const watch = () => M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; let swaps = 0, last = null, track = mod.eyeSlot(), shot = false; const t0 = performance.now();
    while (performance.now() - t0 < 30000 && S.phase !== 'pick') { await new Promise(r => requestAnimationFrame(r)); if (S.cur && S.cur !== last) { last = S.cur; swaps++; for (const [a, b] of S.cur.pairs) { if (track === a) track = b; else if (track === b) track = a; } } }
    return { swaps, track, eye: mod.eyeSlot(), phase: S.phase, faces: mod.banners.map(b => b.face) }; });
  const pickAt = i => M(async i => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, p = mod.slots[i]; D.me.x = p.x; D.me.y = p.y + 4; for (let f = 0; f < 4; f++) await new Promise(r => requestAnimationFrame(r)); for (let f = 0; f < 8; f++) { D.me.x = p.x; D.me.y = p.y + 1.9; await new Promise(r => requestAnimationFrame(r)); } D.me.x = p.x + 6; D.me.y = p.y + 8; return mod.S.phase; }, i);
  r = await wake(); ok(r === 'show', 'standing on the pedestal: the banners show their icons');
  await run(0.4); await shot('lib-cat-show');
  let w = await watch(); ok(w.phase === 'pick' && w.swaps === 6 && w.track === w.eye && w.faces.every(f => f === 0), 'round 1: the banners turn and shuffle six swaps; a watcher can follow the eye ' + JSON.stringify(w)); await shot('lib-cat-pick');
  // wrong: the ink spills again
  await pickAt((w.eye + 1) % 4); await run(2.6); r = await cat(); ok(r.phase === 'mob' && r.wrong === 1 && r.round === 0, 'a wrong banner: another mob of 80 pours out ' + JSON.stringify(r));
  r = await clearMob(); ok(r.n === 80 && r.strong && r.phase === 'ready', 'the second mob (with its strong one) cleared ' + JSON.stringify({ n: r.n, strong: !!r.strong }));
  for (let k = 0; k < 3; k++) { await wake(); w = await watch(); const want = [6, 10, 12][k]; ok(w.track === w.eye && w.swaps === want, `round ${k + 1}: ${w.swaps} swaps, the eye followed to slot ${w.eye}`); if (k === 2) await shot('lib-cat-r3'); await pickAt(w.eye); await run(2.6); }
  await run(1.2); r = await T.state(); ok(r.done, 'three true eyes: the passage opens · ' + r.goal); await shot('lib-cat-open'); await exitStage();

  /* ---- THE UNFINISHED FABLE ---- */
  await start('library', 3); await run(2.4);
  await killGuards('guards');
  const pageAt = k => M(k => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; const p = mod.pages.find(q => q.kind === k); return [p.x, p.y]; }, k);
  const slotAt = i => M(i => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod, s = i === 9 ? mod.side : mod.lect[i]; return [s.x, s.y + 0.9]; }, i);
  const carryTo = async (kind, slot) => { const p = await pageAt(kind); await goTo(p[0], p[1]); await run(0.3); const s = await slotAt(slot); await goTo(s[0], s[1] + 2.5); await run(0.2); await goTo(s[0], s[1]); await run(0.3); await goTo(s[0], s[1] + 2.5); await run(0.2); };
  // wrong first: the adult in the first slot
  await carryTo('adult', 0); r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { at0: mod.lect[0].page && mod.lect[0].page.kind, phase: mod.S.phase }; });
  ok(r.at0 === 'adult' && r.phase === 'story', 'a page can be set on any lectern (adult first: the story doesn\'t follow)');
  // take it back by walking up empty-handed, then set the story right
  { const s = await slotAt(0); await goTo(s[0], s[1]); await run(0.3); await goTo(s[0], s[1] + 2.5); await run(0.2); }
  r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { carry: mod.S.carry && mod.S.carry.kind, at0: !!mod.lect[0].page }; });
  ok(r.carry === 'adult' && !r.at0, 'walking up empty-handed takes the page back');
  { const s = await slotAt(2); await goTo(s[0], s[1]); await run(0.3); await goTo(s[0], s[1] + 2.5); await run(0.2); }
  await carryTo('egg', 0); await carryTo('hatch', 1); await run(1.6);
  r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { phase: mod.S.phase, thief: !!(mod.S.thief && !mod.S.thief.dead) }; });
  ok(r.phase === 'thief' && r.thief, 'egg, hatchling, adult: the story holds, and a false folio steals the shell'); await shot('lib-fable-thief');
  await M(() => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; D.hitMon(S.thief, 1e9, { flat: true }); }); await run(0.5);
  r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.phase); ok(r === 'shell', 'the thief falls: the shell drops');
  await killGuards('guards'); await carryTo('shell', 9); await run(0.5);
  r = await T.state(); ok(r.done, 'the shell beside the hatchling: the story is whole · ' + r.goal); await shot('lib-fable-done'); await exitStage();

  /* ---- THE FALSE PROCESSION ---- */
  await start('library', 6); await run(2.4);
  r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { groups: mod.groups.length, real: mod.groups.filter(g => g.real).length, circles: mod.circles.length }; });
  ok(r.groups === 3 && r.real === 1 && r.circles === 3, 'three processions, one true, three rest circles');
  const fake = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod, g = mod.groups.find(q => !q.real); return [g.x, g.y + 1]; });
  await goTo(fake[0], fake[1]); await run(1.0);
  r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { opened: mod.groups.filter(g => g.opened).length, mobs: mod.S.mobs.filter(m => !m.dead && m.type === 'falsefolio').length }; });
  ok(r.opened === 1 && r.mobs === 2, 'inspecting a false procession: it opens into false folios ' + JSON.stringify(r));
  await killGuards('mobs');
  const tru = await M(() => { const g = window.__pp.arc.game._dbg.RIFT.self.mod.G; return [g.x, g.y + 1]; }); await goTo(tru[0], tru[1]); await run(1.0);
  r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.phase); ok(r === 'walk', 'the true procession sets off');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; D.me.x = S.px; D.me.y = S.py + 1; for (let i = 0; i < 40; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.x = S.px; D.me.y = S.py + 1; } const a = { x: S.px, y: S.py }; D.me.x = S.px + 12; D.me.y = S.py + 2; for (let i = 0; i < 40; i++) await new Promise(r => requestAnimationFrame(r)); const b = { x: S.px, y: S.py }; D.me.x = S.px; D.me.y = S.py + 1; return { moved: Math.hypot(a.x - mod.route[0].x, a.y - mod.route[0].y) > 0.3, held: Math.hypot(b.x - a.x, b.y - a.y) < 0.05, waiting: S.waiting, turns: mod.route.length }; });
  ok(r.moved && r.held && r.turns === 9, 'the books follow a winding route (9 nodes) and only move while the pet leads them ' + JSON.stringify(r));
  await shot('lib-pro-walk');
  // a monster at the books hurts them; one that falls halts the procession until the pet stands by it
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; const b = mod.G.books[0]; b.hp = 0.05; const m = D.X.spawnMon('marginworm', S.px + b.ox, S.py + b.oy, { pack: 990, rift: true }); m.cd = 99; m.still = true; D.me.x = S.px + 6; D.me.y = S.py; for (let i = 0; i < 120 && !b.down; i++) { await new Promise(r => requestAnimationFrame(r)); m.x = S.px + b.ox; m.y = S.py + b.oy; } const res = { down: b.down, halted: S.halted, hp: b.hp, dead: m.dead, d: Math.hypot(m.x - S.px, m.y - S.py), inM: D.mons.includes(m), opt: m.optional }; D.hitMon(m, 1e9, { flat: true }); return res; });
  ok(r.down && r.halted, 'a monster beside the books hurts them: a book falls and the procession halts ' + JSON.stringify(r));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; D.me.x = S.px; D.me.y = S.py + 0.5; for (let i = 0; i < 90; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.x = S.px; D.me.y = S.py + 0.5; } return { down: mod.G.books[0].down, halted: S.halted }; });
  ok(!r.down && !r.halted, 'standing beside the fallen book: it rises and the procession goes on');
  // walk it home: wake each marker as it waits, clearing the ambushes
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, seen = new Set(); const t0 = performance.now();
    while (performance.now() - t0 < 60000 && !S.done) { await new Promise(r => requestAnimationFrame(r)); seen.add(S.phase); for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); for (const b of mod.G.books) b.hp = 1;
      if (S.phase === 'wait') { const cc = mod.circles[S.next]; D.me.x = cc.x; D.me.y = cc.y; D.me.vx = D.me.vy = 0; } else { D.me.x = S.px + 1.5; D.me.y = S.py + 0.5; } }
    return { done: S.done, woke: mod.circles.filter(c => c.woke).length, ambush: S.ambush.filter(Boolean).length, phases: [...seen].join() }; });
  ok(r.done && r.woke === 2 && r.ambush === 6, 'the books wait at each circle until the next marker wakes; ambushes on the way; they arrive ' + JSON.stringify(r));
  await run(0.4); r = await T.state(); ok(r.done, 'the archive door opens · ' + r.goal); await shot('lib-pro-done');
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
})();
