// pictures of the garden forest: a few rooms and a vine bridge (SHOTS=1)
const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 40, seals: ['belfry'] }); const { page, errors, shot, start, run, goTo } = T;
  const st = +(process.argv[2] || 0); await start('garden', st); await run(6);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (m.type !== 'boss') m.hp = 0; });
  const info = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.M; const br = []; for (let i = 0; i < M.G.length; i++) if (M.G[i] === 5) br.push([i % M.MW, Math.floor(i / M.MW)]);
    const counts = M.rooms.map((rm, i) => { let n = 0; M.props.forEach((k, id) => { if (M.RM[id] === i) n++; }); return n; });
    return { rooms: M.rooms.map(r => [r.x + r.w / 2, r.y + r.h / 2, r.w, r.h]), br, counts, kinds: [...new Set([...M.props.values()])] }; });
  console.log('props per room', info.counts.join(','), 'kinds', info.kinds.join(','), 'bridge tiles', info.br.length);
  for (const i of [1, 2, 3]) { const r = info.rooms[i]; if (!r) continue; await goTo(r[0], r[1] + 1); await run(1.2); await shot(`gdn-room${i}`); }
  // a bridge tile with drops on both sides
  const b = info.br[Math.floor(info.br.length / 2)]; if (b) { await goTo(b[0] + 0.5, b[1] + 0.5); await run(1.2); await shot('gdn-bridge'); }
  const b2 = info.br[Math.floor(info.br.length / 5)]; if (b2) { await goTo(b2[0] + 0.5, b2[1] + 0.5); await run(1.2); await shot('gdn-bridge2'); }
  console.log('errors', errors.length, errors.slice(0, 3)); process.exit(0); })();
