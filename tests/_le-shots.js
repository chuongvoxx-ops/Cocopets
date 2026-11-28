// v474 LE: shots of the Library of Unwritten Lives' lands, props, trial pieces, doors, hazards and arenas -> shots/v474-LE/<TAG>-<scene>.png
// env: HTML, TAG (after), DPR (3), ONLY (comma list), LOWFX, NOGL, OFF=1 (__LIBP = 0, __LSKY = 0), FR (frames before a shot)
const { open } = require('./_le-lib');
const near = kinds => ['prop', kinds];
const SCENES = [
  ['cat-wide', 1, null], ['cat-sky', 1, 'skytop'], ['cat-props', 1, near(['bookcase', 'candelabra', 'lectern'])], ['cat-props2', 1, near(['inkwell', 'libladder', 'bookstack'])], ['cat-totter', 1, 'totter'], ['cat-bridge', 1, 'bridge'], ['cat-laser', 1, 'laser'], ['door-cat', 1, 'door'],
  ['catalogue', 0, 'cattrial'], ['catalogue-door', 0, 'catdoor'],
  ['syllax', 2, 'boss'], ['syllax-case', 2, 'aprop0'],
  ['silver-wide', 4, null], ['silver-sky', 4, 'skytop'], ['silver-props', 4, near(['mirror', 'silverurn', 'candelabra'])], ['silver-props2', 4, near(['bookcase', 'lectern'])], ['door-silver', 4, 'door'],
  ['fable', 3, 'fable'],
  ['vellum', 5, 'boss'], ['vellum-lectern', 5, 'aprop0'],
  ['holy-wide', 7, null], ['holy-sky', 7, 'skytop'], ['holy-props', 7, near(['angelstatue', 'platpillar', 'haloarch'])], ['holy-props2', 8, near(['censer', 'harp', 'cloudbank'])], ['holy-bridge', 8, 'bridge'], ['door-holy', 7, 'door'], ['door-boss', 8, 'door'],
  ['procession', 6, 'proc'],
  ['nhalex', 9, 'boss'], ['nhalex-book', 9, 'aprop0'],
  ['broken', 1, 'broken'], ['broken-holy', 7, 'broken'],
];
(async () => {
  const tag = process.env.TAG || 'after', only = process.env.ONLY ? process.env.ONLY.split(',') : null, dir = process.env.DIR || 'v474-LE';
  const T = await open({ dpr: +(process.env.DPR || 3), lowFx: !!process.env.LOWFX, noGL: !!process.env.NOGL, noWebGL: !!process.env.NOGL, off: process.env.OFF === '1', fast: process.env.FULL !== '1' });
  let last = -1;
  for (const [name, si, what] of SCENES) { if (only && !only.includes(name)) continue;
    const t0 = Date.now();
    try {
      if (si !== last || what === 'broken' || what === 'door') { await T.stage(si); last = si; }
      await T.freeze();
      if (Array.isArray(what)) { const r = await T.toProp(what[1]); console.log(name, JSON.stringify(r)); await T.run(0.5, 8); }
      else if (what === null) { await T.move(4, -3); await T.run(0.5, 8); }
      else if (what === 'totter') { const r = await T.M(() => { const D = window.__pp.arc.game._dbg, me = D.me, L = D.mons.filter(m => m.type === 'tottershelf' && !m.dead); const q = L.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; if (!q) return null; me.x = q.x + 1.2; me.y = q.y + 2.2; if (D.cam) { D.cam.x = q.x; D.cam.y = q.y; } return { x: q.x, y: q.y }; }); console.log(name, JSON.stringify(r)); await T.run(0.6, 8); }
      else if (what === 'bridge') { const r = await T.M(() => { const D = window.__pp.arc.game._dbg, M = D.M, me = D.me; let best = null, bd = 1e9; for (let y = 0; y < M.MH; y++) for (let x = 0; x < M.MW; x++) if (M.G[y * M.MW + x] === 5) { const d = Math.hypot(x - me.x, y - me.y); if (d < bd) { bd = d; best = [x, y]; } } if (!best) return null; me.x = best[0] + 0.5; me.y = best[1] + 0.5; if (D.cam) { D.cam.x = me.x; D.cam.y = me.y; } return best; }); console.log(name, JSON.stringify(r)); await T.run(0.6, 8); }
      else if (what === 'laser') { const r = await T.M(() => { const D = window.__pp.arc.game._dbg, L = (D.hazards || D.HZ || []).filter(h => h.area); const h = L[0]; if (!h) return { n: 0 }; const rm = D.M.rooms && D.M.rooms[h.room]; if (rm) { D.me.x = rm.x + rm.w / 2; D.me.y = rm.y + rm.h / 2; } h.t = 0.05; return { n: L.length, kind: h.kind }; }); console.log(name, JSON.stringify(r)); await T.run(0.55, 8); }
      else if (what === 'door') { await T.M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); }); await T.run(2.5, 12); await T.M(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); }); await T.run(1.5, 12); await T.M(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; for (const q of D.mons) if (!q.dead) q.frozen = 99; if (e) { let best = null; for (const [dx, dy] of [[0, 2], [1.5, 1.5], [-1.5, 1.5], [0, 3], [2.2, 0.5], [-2.2, 0.5], [0, 4]]) if (D.walkAt(Math.floor(e.x + dx), Math.floor(e.y + dy)) && D.M.G[Math.floor(e.y + dy) * D.M.MW + Math.floor(e.x + dx)] !== 5) { best = [e.x + dx, e.y + dy]; break; } if (best) { D.me.x = best[0]; D.me.y = best[1]; } if (D.cam) { D.cam.x = e.x; D.cam.y = e.y + 1.5; } } }); await T.run(1.0, 10); }
      else if (what === 'skytop') { await T.M(() => { const D = window.__pp.arc.game._dbg, M = D.M; for (let y = 0; y < M.MH; y++) { let hit = null; for (let x = 0; x < M.MW; x++) if (D.walkAt(x, y)) { hit = x; break; } if (hit != null) { D.me.x = hit + 0.5; D.me.y = y + 1.5; break; } } if (D.cam) { D.cam.x = D.me.x; D.cam.y = D.me.y - 5; } }); await T.run(0.8, 10); }
      else if (what === 'cattrial') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, md = D.RIFT.self.mod; for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); if (md && md.S) { md.S.mob.left = 0; md.S.mob.alive = []; md.S.phase = 'ready'; md.S.pedK = 1; } }); await T.run(0.5, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, md = D.RIFT.self.mod; const K = D.M.marks.K[0]; D.me.x = K.x + 1.5; D.me.y = K.y + 1.5; }); await T.run(0.6, 10); }
      else if (what === 'catdoor') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, md = D.RIFT.self.mod; for (const m of D.mons) if (!m.dead && !m.boss) D.hitMon(m, 1e9, { flat: true }); if (md && md.S) { md.S.mob.left = 0; md.S.mob.alive = []; md.S.phase = 'done'; md.S.round = 2; } const E = D.M.marks.E[0]; D.me.x = E.x; D.me.y = E.y + 4; if (D.cam) { D.cam.x = E.x; D.cam.y = E.y + 2; } }); await T.run(0.6, 10); }
      else if (what === 'fable') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, md = D.RIFT.self.mod; if (md && md.lect && md.pages) { const pg = md.pages[0]; md.lect[0].page = pg; pg.at = md.lect[0]; } D.me.x = 11; D.me.y = 9; if (D.cam) { D.cam.x = 11; D.cam.y = 8; } }); await T.run(0.6, 10); }
      else if (what === 'proc') { await T.run(1.6, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, md = D.RIFT.self.mod; if (md && md.groups) { md.groups.forEach(g => { g.seen = 1; }); const g = md.groups[1]; D.me.x = g.x; D.me.y = g.y + 2.5; } }); await T.run(0.6, 10); }
      else if (what === 'boss') { await T.run(2.5, 12); }
      else if (what.startsWith('aprop')) { const k = +what.slice(5); await T.run(1.5, 12); const r = await T.M(k => { const D = window.__pp.arc.game._dbg, FD = D.FD, S = FD && FD.S; if (!S) return null; const L = S.props || [], p = L[Math.max(0, k) % Math.max(1, L.length)]; if (!p) return { n: 0 }; D.me.x = p.x + 0.5; D.me.y = p.y + 2.6; for (const m of D.mons) m.frozen = 99; return { kind: p.kind, n: L.length }; }, k); console.log(name, JSON.stringify(r)); await T.run(1.0, 12); }
      else if (what === 'broken') { const r = await T.toProp(null); console.log(name, JSON.stringify(r));
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
