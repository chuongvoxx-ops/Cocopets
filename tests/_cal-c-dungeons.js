// Rift 0 core: the three fight dungeons (stages 0, 3, 6): how many monsters each rolls (on the field + waiting), their
// types, the champion, rooms, and pictures in several rooms (GPU=1 with the GPU painter forced on).
// HTML=test-calC.html node tests/_cal-c-dungeons.js [0 3 6]
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 1 }); const { page, start, run, errors } = T;
  const list = await page.evaluate(() => window.__pp.RIFT_BY_ID.caldera.stages.map((s, i) => i + ':' + s.kind + ':' + s.name + ':' + s.biome).join(' | '));
  console.log(list);
  const only = process.argv.slice(2).map(Number), stages = only.length ? only : [0, 3, 6];
  for (const st of stages) {
    await start('caldera', st); if (process.env.GPU) await page.evaluate(() => { window.__NG_GL = 1; }); await run(1.5);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, live = D.mons.filter(m => !m.dead && !m.boss), res = (D.g.reserve || []), all = live.concat(res), types = {}; for (const m of all) types[m.type] = (types[m.type] || 0) + 1; const ch = all.find(m => m.calChamp);
      return { kind: D.F.rift.kind, biome: D.F.biome, total: all.length, live: live.length, waiting: res.length, types, champ: ch ? ch.calChamp + ' hp ' + Math.round(ch.hp) : null, rooms: D.M.rooms.length, shrines: (D.shrines || []).length, goal: document.getElementById('arcGoal').textContent, size: D.M.MW + 'x' + D.M.MH }; });
    console.log(st, JSON.stringify(r));
    // pictures: the start, two rooms, the champion's room
    const rooms = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.M.rooms.map(r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 })); });
    const picks = [null, rooms[Math.floor(rooms.length / 3)], rooms[Math.floor(rooms.length * 2 / 3)], 'champ'];
    for (let i = 0; i < picks.length; i++) { const p = picks[i];
      if (p) await page.evaluate(p => { const D = window.__pp.arc.game._dbg; let q = p; if (p === 'champ') { const c = D.mons.find(m => m.calChamp && !m.dead) || (D.g.reserve || []).find(m => m.calChamp); if (!c) return; q = { x: c.x, y: c.y + 3 }; } const w = D.RIFT.self.amb.C.X.walkPoint(q.x, q.y, null); D.me.x = w.x; D.me.y = w.y; D.g.taps = 9; }, p);
      await run(2.2); await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-dun-${st}-${i}${process.env.GPU ? '-gpu' : ''}.png`) }); }
  }
  console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
