// v467 CF (the user, v466 on the iPhone: "Some props still leave behind square tiles like this"): no square patches on a rift's
// floor, whatever made the tile what it is. For each rift's stages (the Garden's three lands first):
//  1. every prop on the map broken through the game's own paths (DunResidue.hitProp, as a blow does; RES.areaHit, as a blast, a
//     skill's area or an ultimate does; the vehicles' smashProp goes through hitProp too), then each broken prop's tile as shown
//     (the cached chunk, painted while it stood) against that tile painted fresh as floor: mean difference ~0
//  2. every mud / ice tile on the map, and every tile a stage turns to floor (the Garden's withering hedge, 20p), painted as the game
//     paints it: at each edge it shares with a tile of another kind or another wet tile, the tone step across the edge against the
//     same step across the tile's middle (ratio ~1 = no edge; the v466 mud squares gave 5+)
//  3. the void's rectangles (v453 GP seenRects): the backdrop drawn clipped to them and drawn whole, the same frame, compared over
//     the screen outside the ground (no edges where a rectangle ends)
// usage: HTML=test-cf.html node tests/_cf-garden-tiles.js      (RIFTS=garden:0,garden:3,garden:6,belfry:0,dunes:0,sepulchre:0,caldera:0)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0, passes = 0; const ok = (c, s, d) => { if (c) passes++; else fails++; console.log((c ? 'ok   ' : 'FAIL ') + s + (d !== undefined ? '  ' + JSON.stringify(d) : '')); };
const LIST = (process.env.RIFTS || 'garden:0,garden:1,garden:3,garden:4,garden:6,garden:7,belfry:0,dunes:0,sepulchre:0,caldera:0,caldera:3').split(',').map(s => s.split(':'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.setDefaultTimeout(600000);
  const h = process.env.HTML || 'test-cf.html'; await page.goto('file://' + (h[0] === '/' ? h : path.resolve(__dirname, '..', h))); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { localStorage.clear(); const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 40; P.st.gq = 'balanced'; P.st.unlockAll = true; });
  for (const [rift, st] of LIST) {
    const ok0 = await page.evaluate(([r, s]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); if (!P.RIFT_BY_ID[r] || !P.RIFT_BY_ID[r].stages[+s]) return false; P.st.energy = 100; P.startRift(r, +s); return true; }, [rift, st]);
    if (!ok0) { console.log('skip', rift, st); continue; }
    await page.waitForFunction(() => window.__pp.arc.state === 'ready'); await page.evaluate(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; window.__pp.beginPlay(); });
    await page.waitForFunction(() => window.__pp.arc.state === 'play'); await page.waitForTimeout(800);
    const r = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, M = D.M, CH = P.DunWorld.CH, MW = M.MW, MH = M.MH, sl = ms => new Promise(r => setTimeout(r, ms));
      const dp = Math.min(P.arc.dpr || 1, 1.5), T = Math.round(Math.min(Math.max(Math.min(innerWidth / 9.6, innerHeight / 12.5), 28), 64) * 1.15), kT = Math.max(1, Math.round(T * dp)), k = kT / T;
      const chunkOf = new Map(), paint = (cx, cy) => { const key = cx + ',' + cy; let cv = chunkOf.get(key); if (!cv) { cv = P.DunWorld.chunk(M, cx, cy, T, k); chunkOf.set(key, cv); } return cv; };
      const lum = (d, i) => d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11;
      // 1. props: their chunks painted as they stand, then each broken (half by blows, half by blasts), then compared with fresh floor
      const props = D.propList.filter(p => !p.broken), before = new Map();
      for (const p of props) { const tx = p.k % MW, ty = Math.floor(p.k / MW); paint(Math.floor(tx / CH), Math.floor(ty / CH)); }
      for (const [key, cv] of chunkOf) { const c2 = document.createElement('canvas'); c2.width = cv.width; c2.height = cv.height; c2.getContext('2d').drawImage(cv, 0, 0); before.set(key, c2); }
      props.forEach((p, i) => { if (i % 2) { let n = 0; while (!p.broken && n++ < 12) D.RES.areaHit(p.x, p.y - 0.3, 0.6, 999, { el: 'fire', src: 'ult' }); } else { let n = 0; while (!p.broken && n++ < 12) D.RES.hitProp(p, 'gold', 9); } });
      await sl(200);
      const pd = []; for (const p of props) { if (!p.broken) { pd.push({ kind: p.kind, unbroken: 1 }); continue; } const tx = p.k % MW, ty = Math.floor(p.k / MW), cx = Math.floor(tx / CH), cy = Math.floor(ty / CH), A0 = before.get(cx + ',' + cy), F = P.DunWorld.chunk(M, cx, cy, T, k);
        const x0 = (tx - cx * CH) * kT, y0 = (ty - cy * CH) * kT, A = A0.getContext('2d').getImageData(x0 + 1, y0 + 1, kT - 2, kT - 2).data, B = F.getContext('2d').getImageData(x0 + 1, y0 + 1, kT - 2, kT - 2).data; F.width = F.height = 1;
        let d = 0; for (let i = 0; i < A.length; i += 4) d += (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3; pd.push({ kind: p.kind, diff: +(d / (A.length / 4)).toFixed(2) }); }
      // 2. wet tiles and the tiles a stage turns to floor: the step at their edges against the step inside them
      const want = []; for (let i = 0; i < MW * MH; i++) if (M.G[i] === 3 || M.G[i] === 4) want.push(i);
      const RF = D.RIFT && D.RIFT.self && D.RIFT.self.mod, hedge = RF && (RF.hedge || (RF.R && RF.R.hedge)); if (Array.isArray(hedge)) for (const q of hedge) { M.G[q.ty * MW + q.tx] = 1; want.push(q.ty * MW + q.tx); }
      const ed = []; const isG = i => M.G[i] === 1 || M.G[i] === 3 || M.G[i] === 4;
      for (const i of want.slice(0, 160)) { const tx = i % MW, ty = Math.floor(i / MW), cx = Math.floor(tx / CH), cy = Math.floor(ty / CH), cv = paint(cx, cy), c = cv.getContext('2d'), x0 = (tx - cx * CH) * kT, y0 = (ty - cy * CH) * kT;
        for (const [dx, dy] of [[1, 0], [0, 1]]) { const nx = tx + dx, ny = ty + dy; if (Math.floor(nx / CH) !== cx || Math.floor(ny / CH) !== cy || !isG(ny * MW + nx)) continue;
          // the edge: the two pixel columns (rows) either side of it, along its middle 60 %; inside: the same two lines across the tile's middle
          const L = Math.round(kT * 0.6), o = Math.round(kT * 0.2), strip = (ax, ay) => dx ? c.getImageData(ax, y0 + o, 2, L).data : c.getImageData(x0 + o, ay, L, 2).data;
          const e = dx ? strip(x0 + kT - 1, 0) : strip(0, y0 + kT - 1), m = dx ? strip(x0 + Math.round(kT / 2) - 1, 0) : strip(0, y0 + Math.round(kT / 2) - 1);
          const step = d => { let s = 0, n = 0; for (let j = 0; j < L; j++) { const a = dx ? (j * 2) * 4 : j * 4, b = dx ? (j * 2 + 1) * 4 : (L + j) * 4; s += Math.abs(lum(d, a) - lum(d, b)); n++; } return s / n; };
          ed.push({ x: tx, y: ty, d: dx ? 'E' : 'S', t: M.G[i], n: M.G[ny * MW + nx], e: +step(e).toFixed(2), m: +step(m).toFixed(2) }); } }
      for (const cv of chunkOf.values()) cv.width = cv.height = 1;
      return { biome: D.F.biome, props: pd, wet: want.length, edges: ed }; });
    const broken = r.props.filter(q => q.diff != null), badP = broken.filter(q => q.diff > 3), unb = r.props.filter(q => q.unbroken).length;
    const E = r.edges, eSum = E.reduce((s, q) => s + q.e, 0) / Math.max(1, E.length), mSum = E.reduce((s, q) => s + q.m, 0) / Math.max(1, E.length), worst = E.slice().sort((a, b) => (b.e - b.m) - (a.e - a.m)).slice(0, 3);
    console.log(rift, st, r.biome, 'props', broken.length, 'unbroken', unb, 'wet', r.wet, 'edges', E.length, 'edge step', eSum.toFixed(2), 'mid step', mSum.toFixed(2), JSON.stringify(worst));
    ok(!badP.length, `${rift} stage ${+st + 1} (${r.biome}): ${broken.length} props broken by blows and blasts leave the land's own floor (shown vs fresh floor <= 3)`, badP.length ? badP.slice(0, 5) : undefined);
    if (E.length) ok(eSum <= mSum * 1.6 + 1.2, `${rift} stage ${+st + 1}: mud / ice / turned tiles (${r.wet}) have no edge: mean step at their edges ${eSum.toFixed(2)} vs inside ${mSum.toFixed(2)}`);
  }
  // 3. the Garden's void rectangles
  const v = await page.evaluate(async () => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.startRift('garden', 6); return true; });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready'); await page.evaluate(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play'); await page.waitForTimeout(1200);
  const vr = await page.evaluate(async () => { const P = window.__pp, G = P.arc.game, D = G._dbg, cv = document.getElementById('arcCanvas') || document.querySelector('#arcade canvas'), c = cv.getContext('2d');
    cancelAnimationFrame(P.arc.raf); P.arc.open = false; const tr = c.getTransform(), res = [];   // (the loop held: the same frame drawn twice by hand)
    for (const z of [1, 0.75, 0.55, 0.4]) { D.g.zoom = z; for (let k = 0; k < 3; k++) G.update(1 / 60);
      const shot = gp => { window.__GP_OFF = gp; c.setTransform(tr); c.fillStyle = '#FF00FF'; c.fillRect(-9999, -9999, 99999, 99999); G.draw(c); return c.getImageData(0, 0, cv.width, cv.height).data; };
      const A = shot(0), B = shot(1); window.__GP_OFF = 0; let mag = 0, big = 0; for (let i = 0; i < A.length; i += 4) { if (A[i] === 255 && A[i + 1] === 0 && A[i + 2] === 255) mag++; const q = (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2])) / 3; if (q > 40) big++; }
      res.push({ z, unpainted: mag, big, share: +(big / (A.length / 4)).toFixed(4) }); }
    P.arc.open = true; P.arc.raf = requestAnimationFrame(t => {}); return res; });
  console.log('void rects vs whole', JSON.stringify(vr));
  ok(vr.every(q => q.unpainted === 0 && q.share < 0.03), 'the Garden\'s void drawn in rectangles: nothing left unpainted and the same as drawn whole (< 3 % of pixels differ, the live animations), at the zooms an Anima\'s pull-back uses', vr);
  const er = errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)); ok(er.length === 0, 'no page errors', er.slice(0, 3));
  console.log(`${passes} passed, ${fails} failed`); await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
