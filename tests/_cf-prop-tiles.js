// v466 CF (Task 5, the user: "in garden of the unborn stars, after the props were destroyed, it leaves behind these square tiles"):
// a broken prop must leave the land's own continuous floor (with its debris on top), never a square tile patch.
// For each rift's dungeon stages: every prop near the start is broken through the game's own path (DunResidue.hitProp until it
// breaks), then the ground under it as the game shows it (the cached chunk picture, painted while the prop stood) is compared,
// pixel for pixel over the prop's tile, with that tile painted fresh as plain floor (DunWorld.chunk now that the tile is floor):
// the mean difference must be ~0 (the land's floor painter ran under the prop too). Also: the floor round it is the same land's
// (the tile's mean tone vs its neighbours'). Shots: SHOTS=1 for a before/after frame at 440x956 DPR 3 per rift (shots/v466-CF/).
// usage: HTML=test-cf.html node tests/_cf-prop-tiles.js      (RIFTS=garden:0,garden:3,garden:6,dunes:0,sepulchre:0,belfry:0,caldera:0)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let fails = 0, passes = 0; const ok = (c, s, d) => { if (c) passes++; else fails++; console.log((c ? 'ok   ' : 'FAIL ') + s + (d !== undefined ? '  ' + JSON.stringify(d) : '')); };
const LIST = (process.env.RIFTS || 'garden:0,garden:3,garden:6,dunes:0,sepulchre:0,belfry:0,caldera:0,caldera:3,caldera:6').split(',').map(s => s.split(':'));
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 440, height: 956 }, deviceScaleFactor: process.env.SHOTS ? 3 : 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.setDefaultTimeout(600000);
  const h = process.env.HTML || 'test-cf.html'; await page.goto('file://' + (h[0] === '/' ? h : path.resolve(__dirname, '..', h))); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { localStorage.clear(); const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 40; P.st.gq = 'balanced'; P.st.unlockAll = true; });
  for (const [rift, st] of LIST) {
    const ok0 = await page.evaluate(([r, s]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); if (!P.RIFT_BY_ID[r]) return false; P.st.energy = 100; P.startRift(r, +s); return true; }, [rift, st]);
    if (!ok0) { console.log('skip', rift); continue; }
    await page.waitForFunction(() => window.__pp.arc.state === 'ready'); await page.evaluate(() => { const w = document.getElementById('giftWrap'); if (w) w.hidden = true; window.__pp.beginPlay(); });
    await page.waitForFunction(() => window.__pp.arc.state === 'play'); await page.waitForTimeout(1500);
    // the props near the pet: stand by the nearest, so its chunk is painted and on screen
    const pick = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const L = D.propList.filter(p => !p.broken).sort((a, b) => Math.hypot(a.x - D.me.x, a.y - D.me.y) - Math.hypot(b.x - D.me.x, b.y - D.me.y));
      const p = L[0]; if (!p) return null; D.me.x = p.x + 0.2; D.me.y = p.y + 2.2; for (const m of D.mons) if (!m.dead && Math.hypot(m.x - D.me.x, m.y - D.me.y) < 12) { m.dead = true; m.hp = 0; } return { n: L.length, kind: p.kind, x: p.x, y: p.y, biome: p.biome }; });
    if (!pick) { console.log('no props', rift, st); continue; }
    await page.waitForTimeout(1800);
    const tag = `${rift}${st}`, shots = !!process.env.SHOTS, out = path.resolve(__dirname, '../shots/v466-CF/');
    if (shots) await page.screenshot({ path: `${out}/props-${tag}-${process.env.TAG || 'now'}-a.png` });
    const r = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, M = D.M, CH = P.DunWorld.CH, MW = M.MW, me = D.me, sl = ms => new Promise(r => setTimeout(r, ms));
      const near = D.propList.filter(p => !p.broken && Math.hypot(p.x - me.x, p.y - me.y) < 6).slice(0, 6), res = [];
      for (const p of near) { let k = 0; while (!p.broken && k++ < 12) D.RES.hitProp(p, 'gold', 9); }
      await sl(900);
      for (const p of near) { if (!p.broken) continue; const tx = p.k % MW, ty = Math.floor(p.k / MW), cx = Math.floor(tx / CH), cy = Math.floor(ty / CH), cv = D.chunks.get(cx + ',' + cy); if (!cv) continue;
        const kT = cv.width / CH, dp = Math.min(P.arc.dpr || 1, 1.5), T0 = Math.round(Math.min(Math.max(Math.min(innerWidth / 9.6, innerHeight / 12.5), 28), 64) * 1.15), T = Math.round(T0 * dp) === kT ? T0 : Math.round(kT / dp), k = kT / T, fresh = P.DunWorld.chunk(M, cx, cy, T, k);
        const x0 = Math.round((tx - cx * CH) * kT), y0 = Math.round((ty - cy * CH) * kT), w = Math.round(kT);
        const A = cv.getContext('2d').getImageData(x0 + 1, y0 + 1, w - 2, w - 2).data, B = fresh.getContext('2d').getImageData(x0 + 1, y0 + 1, w - 2, w - 2).data;
        let d = 0; for (let i = 0; i < A.length; i += 4) d += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]); d /= (A.length / 4) * 3;
        // the tile's mean tone against its four neighbours' (as shown)
        const mean = (ax, ay) => { const q = cv.getContext('2d').getImageData(ax + 2, ay + 2, w - 4, w - 4).data; let s = 0; for (let i = 0; i < q.length; i += 4) s += q[i] + q[i + 1] + q[i + 2]; return s / (q.length / 4) / 3; };
        const m0 = mean(x0, y0), nb = []; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const nx = tx + dx, ny = ty + dy; if (nx < cx * CH || ny < cy * CH || nx >= cx * CH + CH || ny >= cy * CH + CH) continue; if (M.G[ny * MW + nx] !== 1 /* T_FLOOR? */ && !M.props.has(ny * MW + nx)) continue; nb.push(mean(x0 + dx * w, y0 + dy * w)); }
        fresh.width = fresh.height = 1; res.push({ kind: p.kind, diff: +d.toFixed(2), tone: +m0.toFixed(1), nb: nb.map(v => +v.toFixed(1)) }); }
      return { biome: D.F.biome, res }; });
    await page.waitForTimeout(4000);
    if (shots) await page.screenshot({ path: `${out}/props-${tag}-${process.env.TAG || 'now'}-b.png` });
    console.log(rift, st, r.biome, JSON.stringify(r.res));
    const bad = r.res.filter(q => q.diff > 3);
    ok(r.res.length > 0 && !bad.length, `${rift} stage ${+st + 1} (${r.biome}): every broken prop leaves the land's own floor (shown vs painted fresh as floor, mean diff <= 3)`, bad.length ? bad : r.res.map(q => q.kind + ':' + q.diff).join(' '));
  }
  const er = errors.filter(e => !/ERR_(TUNNEL|FILE_NOT|NAME)/.test(e)); ok(er.length === 0, 'no page errors', er.slice(0, 3));
  console.log(`${passes} passed, ${fails} failed`); await browser.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
