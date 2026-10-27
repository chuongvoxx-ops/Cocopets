// The Pale Aurora's three challenges: the Windbreak Crossing, the Avalanche Galleries, Whiteout Ascent
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, shot, start, run, goTo, useObj, killAll, state, exitStage } = T;
  const M = (f, a) => page.evaluate(f, a);
  /* ---- WIND ---- */
  await start('aurora', 1); await run(2); await killAll();
  let r = await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.bridges[0]; D.me.x = (B.b.x0 + B.b.x1) / 2; D.me.y = (B.b.y0 + B.b.y1) / 2; return { wind: B.wind, wall: B.wall }; });
  await run(3.5); r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { falls: mod.S.falls }; });
  ok(r.falls >= 1, 'caught in the open on bridge 1: blown off ' + JSON.stringify(r));
  await useObj('vane', 0); r = await M(() => { const B = window.__pp.arc.game._dbg.RIFT.self.mod.bridges[0]; return { wall: B.wall, wind: B.wind }; });
  ok(r.wall === -r.wind, 'turning the first vane raises the windbreak on the upwind (west) edge');
  await run(0.5);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, B = mod.bridges[0], f0 = mod.S.falls; D.me.x = (B.b.x0 + B.b.x1) / 2; D.me.y = B.b.y1 - 0.5; const x0 = D.me.x; for (let i = 0; i < 120; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.y -= 0.04; } return { falls: mod.S.falls - f0, drift: Math.abs(D.me.x - x0) }; });
  ok(r.falls === 0 && r.drift < 0.2, 'sheltered: crossing bridge 1 without a shove ' + JSON.stringify(r));
  r = await M(async () => { const B = window.__pp.arc.game._dbg.RIFT.self.mod.bridges[1], w0 = B.wind; const t0 = performance.now(); while (performance.now() - t0 < 9000 && B.wind === w0) await new Promise(r => requestAnimationFrame(r)); return { turned: B.wind !== w0, b3: window.__pp.arc.game._dbg.RIFT.self.mod.bridges[2].wind }; });
  ok(r.turned && r.b3 === -1, 'bridge 2\'s wind turns; bridge 3 blows the other way');
  await M(() => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; mod.bridges.forEach(B => { B.wall = -B.wind; B.wallK = 1; }); });
  for (const ch of ['b', 'c', 'd']) { await page.evaluate(ch => { const D = window.__pp.arc.game._dbg, p = D.M.marks[ch][0]; D.me.x = p.x; D.me.y = p.y; }, ch); await run(0.4); }
  await killAll(); await run(0.5); r = await state(); ok(r.done, 'all three shelves reached and the guards down: the crossing holds · ' + r.goal);
  await shot('aur-wind'); await exitStage();
  /* ---- AVALANCHE ---- */
  await start('aurora', 4); await run(2); await killAll();
  const drop = async (lane, up, lo) => { await M(([up, lo]) => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; mod.DEF[0].at = up; mod.DEF[1].at = lo; }, [up, lo]); await useObj('lever', lane - 1); await run(3.5); return M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { filled: mod.S.filled, rays: mod.S.rays.length }; }); };
  r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; mod.DEF[0].at = 2; mod.DEF[1].at = 3; return [mod.route(1).lane, mod.route(2).lane, mod.route(3).lane]; });
  ok(r.join() === '1,2,2', 'the preview route follows the deflectors ' + r.join());
  r = await drop(1, 2, 3); ok(r.filled === 0, 'a block into a drop shatters, nothing fills');
  r = await drop(1, 2, 1); ok(r.filled === 1 && r.rays >= 1, 'lower deflector at lane 1 turns chute 1 west into the left basin; veil rays arrive ' + JSON.stringify(r));
  r = await drop(2, 3, 1); ok(r.filled === 2, 'chute 2 straight down into the middle basin');
  r = await drop(3, 3, 1); ok(r.filled === 3, 'upper deflector turns chute 3 east into the right basin');
  await killAll(); await run(0.5); r = await state(); ok(r.done, 'three basins and the guards: the bridge is whole · ' + r.goal);
  r = await M(() => { const D = window.__pp.arc.game._dbg, t = D.M.marks.y[0]; return D.tileAt ? D.tileAt(t.tx, t.ty) : null; }); console.log('  bridge tile', r);
  await shot('aur-aval'); await exitStage();
  /* ---- EMBER ---- */
  await start('aurora', 6); await run(2);
  await useObj('bowl', 0); r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.carry); ok(r, 'take the star ember from the first bowl');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; D.me.x = mod.niches[0].x + 5; D.me.y = mod.niches[0].y; mod.S.warm = 0.05; await new Promise(r => setTimeout(r, 1200)); return { carry: mod.S.carry, back: mod.niches[0].ember }; });
  ok(!r.carry && r.back, 'warmth gone: the ember rekindles in the last shelter');
  await useObj('bowl', 0);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, n = mod.niches[1]; mod.S.warm = 0.3; D.me.x = n.x; D.me.y = n.y; await new Promise(r => setTimeout(r, 1500)); return { warm: mod.S.warm, last: mod.S.last }; });
  ok(r.warm > 0.5 && r.last === 1, 'inside shelter 2 the warmth refills ' + JSON.stringify(r));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, L = D.RIFT.self.mod.S.lanes, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 9000 && seen.size < 3) { await new Promise(r => requestAnimationFrame(r)); seen.add(L[0].st); } return [...seen]; });
  ok(['still', 'warn', 'blow'].every(s => r.includes(s)), 'wind lanes cycle still → warning → blowing ' + r.join());
  await killAll(); await M(() => { window.__pp.arc.game._dbg.RIFT.self.mod.S.lanes.forEach(L => { L.per = 1e9; L.off = 0; }); }); await useObj('bowl', 1, 2); r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { carry: mod.S.carry, inBowl: mod.niches[1].ember }; }); ok(!r.carry && r.inBowl, 'set the ember down in a bowl to fight');
  await useObj('bowl', 1, 2); await M(() => { window.__pp.arc.game._dbg.RIFT.self.mod.S.warm = 1; });
  await useObj('brazier', 0, 2); r = await M(() => window.__pp.arc.game._dbg.RIFT.self.mod.S.delivered); ok(r, 'the summit brazier is lit');
  await killAll(); await run(0.8); r = await state(); ok(r.done, 'guards down: the ice barrier falls · ' + r.goal);
  await shot('aur-ember'); await exitStage();
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
