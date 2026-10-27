// What the floor boss costs frame by frame (its own painting and the laying down of its picture, flushed on both sides),
// so a boss painted in steps or every other frame shows its pattern rather than an average.
// usage: node tests/_boss-steps.js [floors] [frames]   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '3,14,38').split(',').map(Number), frames = +(process.argv[3] || 60);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const seedJS = `(r => { let a = r >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; })`;
  await page.addInitScript(`${seedJS}(12345)`);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; P.openMap(); P.dun.setMapTab('dungeon', true); });
  for (const fl of floors) {
    await page.evaluate(([n, js]) => { eval(js)((12345 + n * 7919) >>> 0); window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, 7); }, [fl, seedJS]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    const r = await page.evaluate((frames) => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = G.update, c = document.getElementById('arcCanvas').getContext('2d'), fl = () => c.getImageData(0, 0, 1, 1);
      G.update = () => {};
      const DB = P.DunBoss, o = DB.draw; let acc = 0, cpu = 0;
      DB.draw = function (...a) { if (!a[10]) return o.apply(this, a); fl(); const t0 = performance.now(); o.apply(this, a); const t1 = performance.now(); fl(); const t2 = performance.now(); acc += t2 - t0; cpu += t1 - t0; };
      D.wakeBoss();
      const seq = [], whole = [], wh = [], st0 = [], st1 = []; let lastW = -1;
      for (let i = 0; i < frames + 20; i++) {
        me.hp = D.ST.hp; run(1 / 60); if (A.state !== 'play') break;
        acc = 0; cpu = 0; fl(); const t0 = performance.now(); c.save(); G.draw(c); c.restore(); fl(); const t1 = performance.now();
        if (i >= 20) { const K = g.boss && g.boss._keep; seq.push(+acc.toFixed(1)); whole.push(+(t1 - t0).toFixed(1)); if (K) { const w = K.wholes !== lastW; lastW = K.wholes; (w ? wh : K.step === 1 ? st0 : st1).push(acc); } }
      }
      DB.draw = o; G.update = run;
      const med = a => { const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; }, p90 = a => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length * 0.9)]; };
      const ev = seq.filter((_, i) => i % 2 === 0), od = seq.filter((_, i) => i % 2 === 1);
      return { kind: g.boss && (g.boss.bk.art || g.boss.bk.id), r: g.boss && +(g.boss.r).toFixed(2), boss: { med: med(seq), p90: p90(seq), mean: +(seq.reduce((s, v) => s + v, 0) / seq.length).toFixed(1), even: med(ev), odd: med(od), paintStep: st0.length ? +med(st0).toFixed(1) : null, lightStep: st1.length ? +med(st1).toFixed(1) : null, wholes: wh.length }, frame: { med: med(whole), p90: p90(whole), mean: +(whole.reduce((s, v) => s + v, 0) / whole.length).toFixed(1) }, seq: seq.slice(0, 16) };
    }, frames);
    console.log(fl, JSON.stringify(r));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(200);
  }
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
