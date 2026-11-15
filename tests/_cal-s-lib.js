// shared helpers for worker S's caldera stage tests: the page, and (until the core's defRift exists) a temporary test rift
// built from CAL_STAGES so the three trials can be played: stages 0, 2, 4 are the trials (as the core's riftSections makes them)
process.env.HTML = process.env.HTML || 'test-calS.html';
const { open } = require('./_rift-lib');
async function openCal(opts) {
  const T = await open(Object.assign({ lvl: 1 }, opts || {})); const { page } = T;
  // (god mode is read once when a stage starts: off, so hazards really hurt; the waits below keep the pet topped up)
  await page.evaluate(() => { window.__pp.st.dun.god = false; });
  const info = await page.evaluate(() => { const P = window.__pp, CS = self.__CAL_STAGES; if (!CS) return { err: 'no CAL_STAGES' };
    let temp = false;
    if (!P.RIFT_BY_ID.caldera) { temp = true; const bi = id => (P.BIOMES[id] ? id : 'volcano');
      const trial = (k, b) => Object.assign({ biome: bi(b) }, CS[k], { kind: 'puzzle', trial: true });
      const boss = (n, b) => ({ kind: 'boss', biome: bi(b), name: n, boss: 'none', goal: n, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'on'); return {}; } });
      const R = { id: 'caldera', n: 0, lvl: 1, name: 'The Blackfire Caldera', sigil: 'Ember', biome: bi('ashen'), aff: ['fire'], mons: [], ease: 1,
        stages: [trial('HOLLOWS', 'ashen'), boss('Fire Flan', 'ashen'), trial('FOUNDRY', 'foundry'), boss('Bomb King', 'foundry'), trial('DESCENT', 'heartward'), boss('Ifrit', 'heartward')] };
      P.RIFTS.push(R); P.RIFT_BY_ID.caldera = R; }
    const R = P.RIFT_BY_ID.caldera; return { temp, stages: R.stages.map(s => s.kind + (s.trial ? '*' : '') + ':' + s.name + ':' + s.biome) }; });
  T.calInfo = info;
  // game-time waits (health kept full): __w(secs, each, until)
  T.setupW = () => page.evaluate(() => { window.__w = async (secs, each, until, keepHp) => { const D = window.__pp.arc.game._dbg, g0 = D.g.t; let f = 0; while (D.g.t - g0 < secs && !(until && until())) { await new Promise(r => requestAnimationFrame(r)); f++; if (D.me && !D.me.dead && keepHp !== false) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (each) each(); } return f; };
    window.__use = async (kind, i, off) => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.filter(q => q.kind === kind)[i || 0]; o.used = false; o.ch = 0; let used = false; const u0 = o.use; o.use = q => { used = true; u0(q); }; off = off || [0.1, 0.2];
      await window.__w(3, () => { D.me.x = o.x + off[0]; D.me.y = o.y + off[1]; D.me.vx = D.me.vy = 0; }, () => used); o.use = u0; return used; };
    window.__kill = list => { const D = window.__pp.arc.game._dbg; for (const m of list) if (!m.dead) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } }; });
  T.runG = secs => page.evaluate(s => window.__w(s), secs);
  T.shotP = async (name) => { await page.evaluate(() => { const p = document.getElementById('arcPanel'); if (p && window.__pp.arc.state === 'play') p.style.display = 'none'; }); await page.screenshot({ path: require('path').resolve(__dirname, `../shots/cal-s-${name}.png`) }); await page.evaluate(() => { const p = document.getElementById('arcPanel'); if (p) p.style.display = ''; }); };
  return T;
}
module.exports = { openCal };
