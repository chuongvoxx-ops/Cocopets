// v433 DS: a survey of the dunes stages (names, map sizes, gap tiles) and a shot of each one asked (STAGES=0,4,8 TAG=before)
const L = require('./_ds-lib');
(async () => {
  const T = await L.open({ dpr: +(process.env.DPR || 1), lowFx: process.env.LOWFX === '1' }); const tag = process.env.TAG || 'after';
  try {
    console.log(JSON.stringify(await T.M(() => window.__pp.RIFT_BY_ID.dunes.stages.map((s, i) => i + ':' + s.kind + ':' + (s.name || '') + ':' + (s.biome || '')))));
    const list = (process.env.STAGES || '0').split(',').map(Number), boss = (process.env.BOSS || '').split(',').filter(Boolean).map(Number);
    for (const i of list) { await T.stage(i, { boss: boss.includes(i) }); await T.run(+(process.env.SECS || 1));
      console.log(i, JSON.stringify(await T.M(() => { const D = window.__pp.arc.game._dbg; return { biome: D.F.biome, size: D.SIZE, me: [D.me.x | 0, D.me.y | 0], gap: D.M && D.M.G ? [...D.M.G].filter(v => v === 0).length : null, fiend: !!D.FD }; })));
      await T.shot('v433-DS', tag + '-s' + i);
      for (const [n, dx, dy] of (process.env.PAN ? [['a', -12, 0], ['b', 12, -6]] : [])) { await T.move(dx, dy); await T.run(0.5); await T.shot('v433-DS', tag + '-s' + i + n); } }
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
