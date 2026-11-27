// v472 YE: shots of the Yuggoth Engine's lands, props, trial pieces, doors, hazards and arenas -> shots/v472-YE/<TAG>-<scene>.png
// env: HTML, TAG (after), DPR (3), ONLY (comma list), LOWFX, NOGL, OFF=1 (__YUGP = 0, __YSKY = 0), FR (frames before a shot)
const { open } = require('./_ye-lib');
const near = kinds => ['prop', kinds];
const SCENES = [
  ['wreck-wide', 0, null], ['wreck-sky', 0, 'skytop'], ['wreck-props', 0, near(['metalspike', 'pylon', 'hullshard', 'wreckrib', 'neonpost'])], ['wreck-cells', 0, 'cells'], ['wreck-chain', 0, 'chain'],
  ['conductor', 1, 'conductor'], ['conductor-door', 1, 'blast'], ['door-conductor', 1, 'door'],
  ['khaal', 2, 'boss'], ['khaal-cell', 2, 'aobj'],
  ['cool-wide', 3, null], ['cool-sky', 3, 'skytop'], ['cool-props', 3, near(['coolanttank', 'pipestack'])], ['cool-vent', 3, 'vent'], ['door-cool', 3, 'door'],
  ['coil', 4, 'coil'],
  ['ixvorra', 5, 'boss'], ['ixvorra-pylon', 5, 'aprop0'],
  ['meltdown', 6, 'melt'], ['meltdown-top', 6, 'melttop'],
  ['heart-wide', 7, null], ['heart-sky', 7, 'skytop'], ['heart-props', 7, near(['piston', 'nervecable'])], ['heart-laser', 7, 'laser'], ['door-heart', 7, 'door'],
  ['nyarzhul', 8, 'boss'], ['nyarzhul-cap', 8, 'aprop0'],
  ['broken', 0, 'broken'],
];
(async () => {
  const tag = process.env.TAG || 'after', only = process.env.ONLY ? process.env.ONLY.split(',') : null, dir = process.env.DIR || 'v472-YE';
  const T = await open({ dpr: +(process.env.DPR || 3), lowFx: !!process.env.LOWFX, noGL: !!process.env.NOGL, noWebGL: !!process.env.NOGL, off: process.env.OFF === '1', fast: process.env.FULL !== '1' });
  let last = -1;
  for (const [name, si, what] of SCENES) { if (only && !only.includes(name)) continue;
    const t0 = Date.now();
    try {
      if (si !== last || what === 'broken' || what === 'chain') { await T.stage(si); last = si; }
      await T.freeze();
      if (Array.isArray(what)) { const r = await T.toProp(what[1]); console.log(name, JSON.stringify(r)); await T.run(0.5, 8); }
      else if (what === null) { await T.move(4, -3); await T.run(0.5, 8); }
      else if (what === 'cells' || what === 'chain') { const r = await T.M(chain => { const D = window.__pp.arc.game._dbg, me = D.me, cells = D.mons.filter(m => m.type === 'chargecell' && !m.dead); const c0 = cells.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; if (!c0) return null;
          me.x = c0.x + 2.4; me.y = c0.y + 2.4; if (D.cam) { D.cam.x = c0.x; D.cam.y = c0.y; }
          if (chain) { const near = D.mons.filter(m => !m.dead && !m.boss && m.type !== 'chargecell'); for (let i = 0; i < Math.min(4, near.length); i++) { const a = i * 1.6; near[i].x = c0.x + Math.cos(a) * 2.6; near[i].y = c0.y + Math.sin(a) * 2.0; } D.hitMon ? D.hitMon(c0, 1e7, { flat: true }) : (c0.hp = 0); }
          return { n: cells.length, x: c0.x, y: c0.y }; }, what === 'chain'); console.log(name, JSON.stringify(r)); await T.run(what === 'chain' ? 0.12 : 0.6, 8); }
      else if (what === 'conductor') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; if (m && m.nodes) { const n = m.nodes[0]; n.on = true; n.k = 1; D.me.x = n.x + 2.5; D.me.y = n.y + 1.5; } }); await T.run(0.8, 10); }
      else if (what === 'blast') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; if (m && m.nodes) { m.nodes[0].on = true; m.nodes[1].on = true; m.nodes.forEach(n => n.k = n.on ? 1 : 0); const n = m.nodes[1]; D.me.x = 12; D.me.y = 6.5; } }); await T.run(0.8, 10); }
      else if (what === 'coil') { await T.run(2.2, 12); await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; if (m && m.S) { m.S.got = 9; } D.me.x = 11.5; D.me.y = 15.5; }); await T.run(1.4, 12); }
      else if (what === 'melt') { await T.run(2.0, 12); await T.M(() => { const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod; if (m && m.S) m.S.py = D.me.y + 3.2; }); await T.run(0.4, 12); }
      else if (what === 'melttop') { await T.run(1.4, 12); await T.M(() => { const D = window.__pp.arc.game._dbg, M = D.M, m = D.RIFT.self.mod; D.me.x = 5.5; D.me.y = Math.max(6, Math.round(M.MH * 0.55)); if (m && m.S) { m.S.py = D.me.y + 6; m.S.pause = 99; } }); await T.run(0.8, 12); }
      else if (what === 'vent' || what === 'laser') { const r = await T.M(kind => { const D = window.__pp.arc.game._dbg, L = (D.hazards || D.HZ || []).filter(h => kind === 'laser' ? h.area : !h.area); const h = L[0]; if (!h) return { n: 0 }; if (!h.area) { D.me.x = h.x + 1.6; D.me.y = h.y + 1.2; h.t = 4.0; } else { const rm = D.M.rooms && D.M.rooms[h.room]; if (rm) { D.me.x = rm.x + rm.w / 2; D.me.y = rm.y + rm.h / 2; } h.t = 0.05; } return { n: L.length, kind: h.kind }; }, what); console.log(name, JSON.stringify(r)); await T.run(what === 'laser' ? 0.55 : 0.6, 8); }
      else if (what === 'door') { await T.M(() => { const D = window.__pp.arc.game._dbg; const md = D.RIFT.self.mod; if (md && md.nodes) md.nodes.forEach(n => { n.on = true; }); for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); }); await T.run(2.5, 12); await T.M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); }); await T.run(1.5, 12); await T.M(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit, m = D.RIFT.self.mod; for (const q of D.mons) if (!q.dead) q.frozen = 99; if (m && m.S) m.S.intro = true; if (e) { let best = null; for (const [dx, dy] of [[0, 2], [1.5, 1.5], [-1.5, 1.5], [0, 3], [2.2, 0.5], [-2.2, 0.5], [0, 4]]) if (D.walkAt(Math.floor(e.x + dx), Math.floor(e.y + dy)) && D.M.G[Math.floor(e.y + dy) * D.M.MW + Math.floor(e.x + dx)] !== 5) { best = [e.x + dx, e.y + dy]; break; } if (best) { D.me.x = best[0]; D.me.y = best[1]; } if (D.cam) { D.cam.x = e.x; D.cam.y = e.y + 1.5; } } }); await T.run(1.0, 10); }
      else if (what === 'skytop') { await T.M(() => { const D = window.__pp.arc.game._dbg, M = D.M; for (let y = 0; y < M.MH; y++) { let hit = null; for (let x = 0; x < M.MW; x++) if (D.walkAt(x, y)) { hit = x; break; } if (hit != null) { D.me.x = hit + 0.5; D.me.y = y + 1.5; break; } } if (D.cam) { D.cam.x = D.me.x; D.cam.y = D.me.y - 5; } }); await T.run(0.8, 10); }
      else if (what === 'boss') { await T.run(2.5, 12); }
      else if (what === 'aobj' || what.startsWith('aprop')) { const k = what === 'aobj' ? -1 : +what.slice(5); await T.run(1.5, 12); const r = await T.M(k => { const D = window.__pp.arc.game._dbg, FD = D.FD, S = FD && FD.S; if (!S) return null; const L = k < 0 ? (S.objs || []).filter(o => o.kind === 'cell') : (S.props || []), p = L[Math.max(0, k) % Math.max(1, L.length)]; if (!p) return { n: 0 }; D.me.x = p.x + 0.5; D.me.y = p.y + 2.6; for (const m of D.mons) m.frozen = 99; return { kind: p.kind, n: L.length }; }, k); console.log(name, JSON.stringify(r)); await T.run(1.0, 12); }
      else if (what === 'broken') { const r = await T.toProp(['metalspike', 'pylon', 'hullshard', 'wreckrib', 'neonpost']); console.log(name, JSON.stringify(r));
        await T.M(() => { const D = window.__pp.arc.game._dbg, me = D.me, L = D.propList || []; let best = null, bd = 1e9; for (const p of L) { if (p.broken) continue; const d = Math.hypot(p.x - me.x, p.y - me.y); if (d < bd) { bd = d; best = p; } } if (best) { let n = 0; while (!best.broken && n++ < 30) D.RES.hitProp(best, 'gold', 1); } });
        await T.run(0.3, 8); }
      await T.frames(+(process.env.FR || 14));
      await T.M(() => { const D = window.__pp.arc.game._dbg; if (D.banners) D.banners.length = 0; }); await T.frames(2);
      await T.shot(dir, `${tag}-${name}`);
    } catch (e) { console.log(name, 'ERR', String(e).slice(0, 300)); }
    console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  console.log('errors', JSON.stringify(T.errors.slice(0, 6)));
  await T.browser.close();
})();
