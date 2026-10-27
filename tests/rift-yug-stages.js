// The Yuggoth Engine's three challenges: the Conductor Hunt, the Spinning Coil, the Meltdown Run
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, shot, start, run, exitStage } = T;
  const M = (f, a) => page.evaluate(f, a);
  /* ---- CONDUCTOR ---- */
  await start('yuggoth', 1); await run(2.5);
  let r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { nodes: mod.nodes.length, charged: mod.S.charged.filter(m => !m.dead).length }; });
  ok(r.nodes === 3 && r.charged >= 1, 'three dead nodes; a charged spark mite comes out of a dock ' + JSON.stringify(r));
  // a charged mite dashing into node A powers it
  const getMite = () => M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const t0 = performance.now(); while (performance.now() - t0 < 8000 && !mod.S.charged.some(m => !m.dead && !m._done)) { mod.S.dockT = 0; await new Promise(r => requestAnimationFrame(r)); } return mod.S.charged.filter(m => !m.dead && !m._done).length; });
  await getMite();
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, n = mod.nodes[0], m = mod.S.charged.find(q => !q.dead && !q._done); m.x = n.x + 2.2; m.y = n.y; m.chargeT = 0; m.dashT = 0.5; m.da = Math.PI; m.dhit = false; await new Promise(r => setTimeout(r, 500)); return { on: n.on, dead: m.dead }; });
  ok(r.on && r.dead, 'a charged mite that dashes into a dead node powers it');
  await getMite();
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, m = mod.S.charged.find(q => !q.dead && !q._done), l0 = mod.S.lost; m.x = mod.nodes[2].x + 6; m.y = mod.nodes[2].y - 3; D.hitMon(m, 1e9, { flat: true }); await new Promise(r => setTimeout(r, 300)); return { lost: mod.S.lost - l0, on: mod.nodes.filter(n => n.on).length }; });
  ok(r.lost === 1 && r.on === 1, 'one killed far from any node: its charge is lost');
  await getMite();
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, n = mod.nodes[1], m = mod.S.charged.find(q => !q.dead && !q._done); m.x = n.x + 1.2; m.y = n.y + 0.4; m.dashT = 0; m.chargeT = 0; D.hitMon(m, 1e9, { flat: true }); await new Promise(r => setTimeout(r, 300)); return n.on; });
  ok(r, 'one killed right beside a dead node powers it');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 4000 && seen.size < 3) { await new Promise(r => requestAnimationFrame(r)); seen.add(mod.S.stripSt); } return [...seen]; });
  ok(r.length === 3, 'the live strip warns, then crackles ' + r.join());
  await getMite();
  await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, n = mod.nodes[2], m = mod.S.charged.find(q => !q.dead && !q._done); m.x = n.x; m.y = n.y + 2.2; m.chargeT = 0; m.dashT = 0.5; m.da = -Math.PI / 2; await new Promise(r => setTimeout(r, 600)); });
  await run(0.6); r = await T.state(); ok(r.done, 'three circuits live: the blast door opens · ' + r.goal); await shot('yug-conductor'); await exitStage();
  /* ---- COIL ---- */
  await start('yuggoth', 4); await run(3);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, O = D.M.marks.O[0]; S.warnT = 0; S.hitT = 0; const b = S.rot; D.me.x = O.x + Math.cos(b) * 5; D.me.y = O.y + Math.sin(b) * 5; D.me.dodge = null; await new Promise(r => requestAnimationFrame(r)); await new Promise(r => requestAnimationFrame(r)); return { hit: S.hitT > 0, n: S.n }; });
  ok(r.hit && r.n === 2, 'standing in a beam: zapped (two beams to start)');
  await shot('yug-coil-a');
  const grab = k => M(async k => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; for (let i = 0; i < k; i++) { const s = S.sparks[0]; if (!s) { await new Promise(r => requestAnimationFrame(r)); continue; } D.me.x = s.x; D.me.y = s.y; for (let f = 0; f < 3; f++) await new Promise(r => requestAnimationFrame(r)); } return { got: S.got, n: S.n, stage: S.stage }; }, k);
  r = await grab(9); ok(r.got >= 8 && r.n === 3, 'eight sparks: a third beam joins ' + JSON.stringify(r));
  r = await M(async () => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S; const t0 = performance.now(); while (performance.now() - t0 < 10000 && !(S.ring && S.ring.pre <= 0)) await new Promise(r => requestAnimationFrame(r)); return !!S.ring; });
  ok(r, 'ring pulses run out from the coil'); await shot('yug-coil-ring');
  r = await grab(9); ok(r.n === 4, 'sixteen sparks: four beams ' + JSON.stringify(r));
  r = await M(async () => { const S = window.__pp.arc.game._dbg.RIFT.self.mod.S, d0 = S.dir; S.revT = 0.5; await new Promise(r => setTimeout(r, 900)); return S.dir !== d0; });
  ok(r, 'at full power it reverses');
  r = await grab(12); await run(0.5); r = await T.state(); ok(r.done, 'twenty-four sparks: the coil burns out · ' + r.goal); await exitStage();
  /* ---- MELTDOWN ---- */
  await start('yuggoth', 6); await run(2);
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; D.me.y -= 12; await new Promise(r => setTimeout(r, 100)); const y0 = S.py; await new Promise(r => setTimeout(r, 1500)); return { rose: y0 - S.py }; });
  ok(r.rose > 2, 'the meltdown rises behind you ' + JSON.stringify(r));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, c0 = S.caught; D.me.y = S.py + 0.2; await new Promise(r => setTimeout(r, 300)); return { caught: S.caught - c0, back: Math.abs(D.me.y - D.M.start.y) < 1 }; });
  ok(r.caught === 1 && r.back, 'caught by it: thrown back to the start');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S; const cv = D.M.marks.c[0]; D.me.x = cv.x; D.me.y = cv.y; D.me.dodge = null; const y0 = D.me.y; for (let i = 0; i < 20; i++) await new Promise(r => requestAnimationFrame(r)); return D.me.y - y0; });
  ok(r > 0.15, 'a conveyor carries you back toward it ' + r.toFixed(2));
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, d = mod.doors[0], seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 4500 && seen.size < 3) { await new Promise(r => requestAnimationFrame(r)); seen.add(d.st); } return [...seen]; });
  ok(r.length === 3, 'blast doors open, warn and shut ' + r.join());
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod; const t0 = performance.now(), seen = new Set(); while (performance.now() - t0 < 3500 && seen.size < 3) { await new Promise(r => requestAnimationFrame(r)); seen.add(mod.pistons[0].st); } return [...seen]; });
  ok(r.includes('warn') && r.includes('slam'), 'pistons show a red band, then slam ' + r.join());
  r = await M(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S, o = D.RIFT.objs.filter(q => q.kind === 'valve')[2]; D.me.x = o.x + 0.6; D.me.y = o.y + 0.3; D.me.vx = D.me.vy = 0; o.used = false; o.ch = 0; const t0 = performance.now(); while (performance.now() - t0 < 1500 && S.last.y > 70) { D.me.x = o.x + 0.6; D.me.y = o.y + 0.3; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); } return { pause: S.pause, cp: S.last.y, oy: o.y }; });
  ok(r.pause > 2, 'venting a coolant valve stalls the meltdown and sets a checkpoint ' + JSON.stringify(r));
  await shot('yug-melt');
  await M(() => { const D = window.__pp.arc.game._dbg, E = D.M.marks.E[0]; D.me.x = E.x; D.me.y = E.y + 1; }); await run(0.5); r = await T.state(); ok(r.done, 'at the top: you outran it · ' + r.goal); await exitStage();
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
