// The Tower's fallbacks for a struggling phone: the canvas resolution steps 2 → 1.5 → 1.25 (the second step only once a
// Super Fiend has given up its light passes), and the fiend's quality, raised again too soon, waits twice as long next time.
// usage: node tests/_dpr-step.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  let fails = 0; const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) fails++; };

  // 1. the quality controller, fed frames of a chosen length through a stand-in clock
  const r1 = await page.evaluate(() => {
    const K = window.__pp.DunFiend.KIT, Q = K.Q, real = performance.now.bind(performance); let now = 1e6; performance.now = () => now;
    const feed = (ms, secs) => { for (let t = 0; t < secs * 1000; t += ms) { now += ms; K.pace(); } };
    Object.assign(Q, { q: 0, avg: 16, last: 0, slowT: 0, fastT: 0, pin: null, wait: 7000, upAt: -1e9 }); now += 16; K.pace();
    const out = {}; feed(16.7, 7.3); out.up1 = Q.q;                 // smooth for 7 s: one step up
    feed(33.3, 2); out.down1 = Q.q; out.wait1 = Q.wait;               // too slow there: back down, and the wait doubles
    feed(16.7, 8); out.after8 = Q.q;                                  // smooth again for 8 s: it waits (14 s now)
    feed(16.7, 7); out.after15 = Q.q;                                 // and tries again past 14 s
    feed(16.7, 20); out.held = Q.q; out.wait2 = Q.wait;               // this time it holds: no more doubling
    performance.now = real; Q.q = 2; Q.avg = 16; Q.last = 0; Q.wait = 7000; Q.upAt = -1e9; return out;
  });
  ok(r1.up1 === 1, `quality raised after 7 s of smooth frames (q ${r1.up1})`);
  ok(r1.down1 === 0 && r1.wait1 === 14000, `taken back when too slow, wait now ${r1.wait1} ms`);
  ok(r1.after8 === 0, `8 s later it is still waiting (q ${r1.after8})`);
  ok(r1.after15 === 1, `after 15 s it tries again (q ${r1.after15})`);
  ok(r1.held >= 1 && r1.wait2 === 14000, `a raise that holds keeps the wait (q ${r1.held}, wait ${r1.wait2})`);

  // 2. the canvas resolution, in a Tower floor whose frames are made slow on purpose
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 120; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(5, 7));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
  const slow = ms => page.evaluate(ms => { window.__slow = ms; const tick = () => { if (!window.__slow) return; const e = performance.now() + window.__slow; while (performance.now() < e) {} requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, ms);
  const st = () => page.evaluate(() => { const a = window.__pp.arc; return { dpr: a.dpr, cap: a.dunCap, w: document.getElementById('arcCanvas').width }; });
  const Qset = q => page.evaluate(q => { const Q = window.__pp.DunFiend.KIT.Q; Q.q = q; Q.pin = null; }, q);
  const s0 = await st(); ok(s0.dpr === 2, `starts at 2 pixels to the point on a 3x phone (${s0.dpr}, canvas ${s0.w} wide)`);
  await Qset(2); await slow(40); await page.waitForFunction(() => window.__pp.arc.dpr === 1.5, null, { timeout: 30000 }).catch(() => {});
  const s1 = await st(); ok(s1.dpr === 1.5, `slow: steps down to 1.5 (${s1.dpr}, canvas ${s1.w} wide)`);
  await page.waitForTimeout(9000); const s2 = await st(); ok(s2.dpr === 1.5, `still slow but the fiend still has light passes to give: stays at 1.5 (${s2.dpr})`);
  await Qset(0); await page.waitForFunction(() => window.__pp.arc.dpr === 1.25, null, { timeout: 30000 }).catch(() => {});
  const s3 = await st(); ok(s3.dpr === 1.25, `light passes gone and still slow: steps down to 1.25 (${s3.dpr}, canvas ${s3.w} wide)`);
  await page.waitForTimeout(9000); const s4 = await st(); ok(s4.dpr === 1.25, `and no lower (${s4.dpr})`);
  await slow(0); await Qset(2);
  console.log('errors', errors.length, errors.slice(0, 3)); console.log(fails ? `${fails} FAILED` : 'all passed');
  await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
