// music: Exploratory World in the house, Carta Misteriosa over the world map; none in the other map tabs or in a game.
// Phone-like: sound needs a real tap (finger lifted), taps by touch only. UA env to pretend to be an iPhone.
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: process.env.UA || 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, JSON.stringify(x)); if (!c) bad++; };
  await p.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await p.waitForFunction(() => window.__pp); await p.waitForTimeout(300);
  await p.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dlv = 40; });
  const M = () => p.evaluate(() => { const m = window.__pp.music; return { track: m.track, playing: m.playing, level: m.level, state: m.state, err: m.err, want: m.want() }; });
  await p.waitForTimeout(1500); let m = await M(); ok(m.want === 'explore', 'in the house before any tap: the house song is wanted', m);
  await p.touchscreen.tap(200, 600); await p.waitForTimeout(2500); m = await M(); ok(m.track === 'explore' && m.playing, 'a tap in the house: Exploratory World plays', m);
  await p.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('world', true); }); await p.waitForTimeout(3000); m = await M(); ok(m.track === 'carta' && m.playing, 'the world map: Carta Misteriosa', m);
  await p.evaluate(() => window.__pp.dun.setMapTab('rift', true)); await p.waitForTimeout(2000); m = await M(); ok(!m.track, 'the rift tab: quiet', m);
  await p.evaluate(() => window.__pp.dun.setMapTab('world', true)); await p.waitForTimeout(2500); m = await M(); ok(m.track === 'carta' && m.playing, 'back to the world map', m);
  await p.evaluate(() => window.__pp.closeMap()); await p.waitForTimeout(2500); m = await M(); ok(m.track === 'explore' && m.playing, 'home again: Exploratory World', m);
  await p.evaluate(() => { window.__pp.st.sound = false; }); await p.waitForTimeout(1500); m = await M(); ok(!m.track, 'sound off: quiet', m);
  ok(!errs.length, 'no page errors', errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await b.close(); process.exit(bad ? 1 : 0); })();
