// Frame cost on normal Tower floors: a bot explores and fights through the floor, then fights its boss, the game stepped
// by hand at 60 steps a second so every frame is timed on its own (update and draw apart, the draw flushed). Every third
// frame is also split into its pieces (each flushed; those frames are left out of the totals).
// usage: node tests/dun-frames.js [floors] [explore secs] [boss secs]   env: TAG (→ bat/dun-frames-<tag>.json), HTML, SEED, CANVAS=soft
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floors = (process.argv[2] || '3,6,11,14,18,22,26,31,34,38,43,46,51,55,59,63,102,106,111,114,118').split(',').map(Number);
  const exSecs = +(process.argv[3] || 14), bossSecs = +(process.argv[4] || 8), seed = +(process.env.SEED || 7);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  // every run plays the same game: Math.random is seeded (RNG env), so two builds can be compared floor by floor
  await page.addInitScript(seed => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, +(process.env.RNG || 12345));
  if (process.env.LEG) await page.addInitScript(n => { window.__leg = n; }, +process.env.LEG);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 199; P.st.dlv = 200; P.st.stage = 6; if (window.__leg) { const g = P.summonGenome(6, P.mulberry32(window.__leg)), line = P.evolveLine(g.form, 7, P.mulberry32(window.__leg * 7)); P.st.forms = line; P.st.stage = 7; P.st.rarity = 5; } P.openMap(); P.dun.setMapTab('dungeon', true); });
  // the game is drawn as the arcade draws it: on its own canvas (CANVAS=soft: on one the browser keeps in ordinary memory and
  // paints without the graphics chip, as phones without one for pages do)
  await page.evaluate(soft => { window.__ppCanvas = () => { const A = window.__pp.arc; if (!soft) return document.getElementById('arcCanvas').getContext('2d'); let cv = window.__soft; if (!cv || cv.width !== Math.round(A.W * A.dpr) || cv.height !== Math.round(A.H * A.dpr)) { cv = window.__soft = document.createElement('canvas'); cv.width = Math.round(A.W * A.dpr); cv.height = Math.round(A.H * A.dpr); } const c = cv.getContext('2d', { willReadFrequently: true }); c.setTransform(A.dpr, 0, 0, A.dpr, 0, 0); return c; }; }, process.env.CANVAS === 'soft');
  const all = {};
  for (const fl of floors) {
    // (the Tower drops to a lower resolution when it sees slow frames: held at the full 2x here so every run is alike)
    await page.evaluate(([n, s, r]) => { let a = (r + n * 7919) >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; window.__pp.arc.dunCap = 2; window.__pp.dun.startDungeon(n, s); }, [fl, seed, +(process.env.RNG || 12345)]);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    // (the game is held still from here on, so the steps it takes are only the probe's own, and every run plays alike)
    await page.evaluate(() => { const G = window.__pp.arc.game; window.__run = G.update; G.update = () => {}; });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 20000 });
    if (process.env.CPUPIECES) await page.evaluate(() => { window.__cpuPieces = true; });
    if (process.env.HUDPIECES) await page.evaluate(() => { window.__hudPieces = true; });
    const r = await page.evaluate(([exSecs, bossSecs]) => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = window.__run, c = window.__ppCanvas(), fl = () => c.getImageData(0, 0, 1, 1);
      { let a = (4242 + D.F.k * 7919) >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
      G.update = () => {};
      const W = A.W, H = A.H, tapW = (wx, wy) => { const X = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + H / 2)); G.down(X, Y, 77); G.up(X, Y, 77); };
      const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y), sv = d > keep ? D.steerTo(tx, ty) : null, hx = 72, hy = H - 100; if (!sv) { if (D.stick.id === 88) G.up(hx, hy, 88); return; } if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + sv[0] * 44, hy + sv[1] * 44, 88); };
      let lastKill = 0, kills = -1, lastTap = -9;
      const botStep = (bossOnly) => {
        if (g.kills !== kills) { kills = g.kills; lastKill = g.t; }
        let best = null, bd = 1e9; for (const m of D.mons) { if (m.dead || (!bossOnly && m.act === 'sleep') || (bossOnly && !m.boss)) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } }
        if (!best) return;
        if (g.t - lastKill > 6 && bd > 3) { const p = D.X.walkPoint(Math.round(best.x + 2.5), Math.round(best.y), { r: 0.3, mv: 0, x: me.x, y: me.y }); if (p) { me.x = p.x; me.y = p.y; } lastKill = g.t; }
        steer(best.x, best.y, best.boss ? 3.2 : 2.2);
        if (g.t - lastTap > 0.26) { lastTap = g.t; tapW(best.x, best.y); }
        ['strong', 'strong2', 'strong3'].forEach((k, i) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][i]]; if (ab && me.mp > ab.cost && cd <= 0 && bd < 5) D.useStrong(k); });
        if (me.mp >= D.KIT.ult.cost && g.cdU <= 0) D.useUlt();
        if (D.AN && D.AN.ready && D.AN.ready()) D.AN.summon();
      };
      const seg = (frames, bossOnly) => {
        const up = [], dr = [], cpu = [], pieces = {}, cnt = { alive: 0, vis: 0, parts: 0, shots: 0, eshots: 0, zones: 0, n: 0 }; let pn = 0;
        for (let i = 0; i < frames; i++) {
          botStep(bossOnly); me.hp = D.ST.hp;
          const t0 = performance.now(); run(1 / 60); const t1 = performance.now();
          if (A.state !== 'play') break;
          // one frame in three split into pieces, one in three timed without the flush (what the page itself spends issuing
          // the drawing, before any of it is rasterised), the rest timed whole (three, an odd number: whatever is painted
          // every other frame falls alike into each)
          const prof = i % 3 === 2, rec = i % 3 === 1; if (prof) { g.prof = {}; g.profNoFlush = !!window.__cpuPieces; g.profHud = !!window.__hudPieces; }
          fl(); const t2 = performance.now(); c.save(); G.draw(c); c.restore(); if (!rec) fl(); const t3 = performance.now(); if (rec) fl();
          if (prof) { for (const k in g.prof) pieces[k] = (pieces[k] || 0) + g.prof[k]; pn++; g.prof = null; }
          if (i < 30) continue;
          up.push(t1 - t0); if (rec) cpu.push(t3 - t2); else if (!prof) dr.push(t3 - t2);
          if (i % 10 === 0) { const vx = W / 2 / (40 * g.zoom) + 1, vy = H / 2 / (40 * g.zoom) + 1; cnt.alive += D.mons.filter(m => !m.dead).length; cnt.vis += D.mons.filter(m => !m.dead && Math.abs(m.x - me.x) < vx && Math.abs(m.y - me.y) < vy).length; cnt.parts += D.parts.length; cnt.shots += D.shots.length; cnt.eshots += D.eshots.length; cnt.zones += D.zones.length; cnt.n++; }
        }
        const st = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? { med: +b[b.length >> 1].toFixed(1), p90: +b[Math.floor(b.length * 0.9)].toFixed(1), mean: +(a.reduce((s, v) => s + v, 0) / a.length).toFixed(1) } : null; };
        const pc = {}; for (const k in pieces) pc[k] = +(pieces[k] / Math.max(1, pn)).toFixed(2);
        const ct = {}; for (const k in cnt) if (k !== 'n') ct[k] = +(cnt[k] / Math.max(1, cnt.n)).toFixed(1);
        return { draw: st(dr), cpu: st(cpu), upd: st(up), pieces: pc, counts: ct };
      };
      const out = { biome: D.F.biome, dark: D.F.dark, dpr: A.dpr };
      out.explore = seg(Math.round(exSecs * 60), false);
      // then the floor's boss, woken beside the pet (it rises near whoever wakes it)
      if (A.state === 'play' && bossSecs > 0) { D.wakeBoss(); if (g.boss) out.boss = seg(Math.round(bossSecs * 60), true); }
      G.update = run; return out;
    }, [exSecs, bossSecs]);
    all[fl] = r;
    const f = s => s ? `${s.draw ? s.draw.med + '/' + s.draw.p90 : '-'} cpu ${s.cpu ? s.cpu.med : '-'} upd ${s.upd ? s.upd.med + '/' + s.upd.p90 : '-'}` : '-';
    console.log(fl, r.biome, 'dark', r.dark, 'dpr', r.dpr, '| explore draw', f(r.explore), JSON.stringify(r.explore.counts), '| boss draw', f(r.boss));
    console.log('   pieces', JSON.stringify(r.explore.pieces));
    await page.evaluate(() => { window.__pp.closeArcade && window.__pp.closeArcade(true); }); await page.waitForTimeout(200);
  }
  require('fs').writeFileSync(path.resolve(__dirname, `../bat/dun-frames-${process.env.TAG || 'now'}.json`), JSON.stringify(all, null, 1));
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
