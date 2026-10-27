// music in the games: rift dungeons/trials and Tower floors Champions Charge; every boss Triumph of the Hero; rift puzzles and gates Carta Misteriosa
const { open } = require('./_rift-lib');
(async () => {
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'colours'] }); const { page, errors, start, run } = T;
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, JSON.stringify(x)); if (!c) bad++; };
  await page.mouse.click(200, 400);
  const M = () => page.evaluate(() => { const m = window.__pp.music; return { track: m.track, playing: m.playing, want: m.want() }; });
  for (const [id, st, want] of [['belfry', 0, 'charge'], ['belfry', 1, 'carta'], ['belfry', 4, 'triumph'], ['colours', 1, 'charge'], ['colours', 9, 'triumph'], ['colours', 'gate', 'carta']]) {
    await start(id, st); await run(2.5); const m = await M(); ok(m.track === want && m.playing, `${id} ${st}: ${want}`, m); }
  await page.evaluate(() => { const P = window.__pp; P.closeArcade(true); P.st.energy = 100; P.st.dun.best = 10; P.openMap(); P.dun.setMapTab('dungeon', true); }); await page.evaluate(() => window.__pp.dun.startDungeon(2, 77));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 }); await page.evaluate(() => window.__pp.beginPlay()); await run(2.5);
  let m = await M(); ok(m.track === 'charge' && m.playing, 'a Tower floor: Champions Charge', m);
  await page.evaluate(() => window.__pp.arc.game._dbg.wakeBoss()); await run(2.5); m = await M(); ok(m.track === 'triumph' && m.playing, 'the Tower guardian wakes: Triumph of the Hero', m);
  await page.evaluate(() => window.__pp.closeArcade(true)); await page.waitForTimeout(2500); m = await M(); ok(m.want !== 'triumph' && m.want !== 'charge', 'out of the Tower: back to the map tabs', m);
  ok(!errors.length, 'no page errors', errors.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); process.exit(bad ? 1 : 0);
})();
