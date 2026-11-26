// v463 SS: a survey of the Sepulchre stages (names, kinds, biomes, map sizes, gap tiles) and a shot of each one asked (STAGES=0,4 TAG=before)
const L = require('./_ss-lib');
(async () => {
  const T = await L.open({ dpr: +(process.env.DPR || 1), lowFx: process.env.LOWFX === '1' }); const tag = process.env.TAG || 'after';
  try {
    console.log(JSON.stringify(await T.M(() => window.__pp.RIFT_BY_ID.sepulchre.stages.map((s, i) => i + ':' + s.kind + ':' + (s.name || '') + ':' + (s.biome || '')))));
    const list = (process.env.STAGES || '').split(',').filter(Boolean).map(Number), boss = (process.env.BOSS || '').split(',').filter(Boolean).map(Number);
    for (const i of list) { await T.stage(i, { boss: boss.includes(i) }); await T.run(+(process.env.SECS || 1));
      console.log(i, JSON.stringify(await T.M(() => { const D = window.__pp.arc.game._dbg, G = D.M && D.M.G; const cnt = {}; if (G) for (const v of G) cnt[v] = (cnt[v] || 0) + 1; return { biome: D.F.biome, MW: D.M.MW, MH: D.M.MH, me: [D.me.x | 0, D.me.y | 0], tiles: cnt, fiend: !!D.FD, gap: D.PB ? D.PB.gap : null }; })));
      if (process.env.SHOT !== "0") await T.shot("v463-SS", tag + "-survey-s" + i); }
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
