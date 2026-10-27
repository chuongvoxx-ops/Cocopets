// the rifts' own songs (website build, songs as files): each rift's dungeons and trials its own song, puzzles Quest for the
// Crown, gates Anima Gates, an anima's summoning The Summoning while it lasts; the Claude build falls back to its four.
// usage: python3 src/build.py --web --test; serve dist/ on :8768; URL=http://0.0.0.0:8768/test.html node tests/music-rifts.js
//        (without URL: the Claude build, test.html, and its fallbacks)
const { open } = require('./_rift-lib');
(async () => {
  const web = !!process.env.URL;
  const T = await open({ lvl: 92, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'colours'] }); const { page, errors, start, run } = T;
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, JSON.stringify(x)); if (!c) bad++; };
  const loaded = new Set(); page.on('response', r => { if (/\/music\//.test(r.url()) && r.ok()) loaded.add(r.url().split('/').pop()); });
  await page.mouse.click(200, 400);
  const cases = [['belfry', 0, 'belfort'], ['garden', 0, 'rift2'], ['dunes', 0, 'desert'], ['sepulchre', 0, 'hours'], ['library', 1, 'library'], ['moon', 0, 'waltz'], ['aurora', 0, 'charge'], ['belfry', 1, 'crown'], ['colours', 'gate', 'gates']];
  const FALL = { belfort: 'charge', rift2: 'charge', desert: 'charge', hours: 'charge', library: 'charge', waltz: 'charge', crown: 'carta', gates: 'carta' };
  for (const [id, st, song] of cases) { const want = web ? song : FALL[song] || song; await start(id, st); await run(web ? 4 : 2.5);
    const m = await page.evaluate(() => { const m = window.__pp.music; return { track: m.track, playing: m.playing, err: m.err }; }); ok(m.track === want && m.playing, `${id} ${st}: ${want}`, m); }
  // an anima's summoning holds its song over the stage's, then lets it go
  await start('dunes', 0); await run(1); await page.evaluate(() => window.__pp.music.hold('summon')); await run(web ? 4 : 2); if (web) await page.waitForFunction(() => window.__pp.music.playing && window.__pp.music.track === 'summon', null, { timeout: 15000 }).catch(() => {});
  let m = await page.evaluate(() => { const m = window.__pp.music; return { track: m.track, playing: m.playing, has: m.has('summon') }; });
  ok(web ? m.track === 'summon' && m.playing : !m.has, web ? 'a summoning: The Summoning plays' : 'the Claude build has no Summoning song (the old tune plays instead)', m);
  await page.evaluate(() => window.__pp.music.release('summon')); await run(web ? 4 : 2); m = await page.evaluate(() => ({ track: window.__pp.music.track })); ok(m.track === (web ? 'desert' : 'charge'), 'the summoning over: back to the stage song', m);
  if (web) ok(['drowned-belfort.mp3', 'rift-2.mp3', 'desert-rose.mp3', 'time-after-time.mp3', 'the-library.mp3', 'waltz-for-the-moon.mp3', 'quest-for-the-crown.mp3', 'anima-gates.mp3', 'the-summoning.mp3'].every(f => loaded.has(f)), 'every new song file loaded', [...loaded]);
  ok(!errors.length, 'no page errors', errors.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); process.exit(bad ? 1 : 0);
})();
