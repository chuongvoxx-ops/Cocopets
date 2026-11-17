// v394 PR: the Belfry's three dungeons, each its own place (20n9b-belfry-themes.js). Until B1's dungeon stages are in, a
// rolled dungeon (kind 'fight') is put on each land for the test: d1 belnave, d2 belfoundry, d3 belstorm.
//  - pictures of a typical room at 390x844, DPR 2: shots/bel-themes-d1|d2|d3.png (tests/_bel-themes-sheet.py: the sheet)
//  - the seam check: each land's floor painted tile by tile at an odd size (47 px) over the engine's own per-tile shade;
//    the step across a tile edge against the step inside a tile (1.0 = no seam): shots/bel-themes-seams.png
//  - every prop kind of each dungeon breaks through BREAK_FX (RES.areaHit, the path of areas and Ultimates)
//  - the frame's cost per dungeon ('world' = the floor, 'ground' + 'ents' = the dressing), and the one-time painting
// usage: HTML=test-calPR.html node tests/_bel-themes.js [shots] [seams] [break] [perf]
process.env.HTML = process.env.HTML || 'test.html'; if (process.env.DPR1 !== '1') process.env.SHOTS = '1';
const { open } = require('./_rift-lib');
const fs = require('fs'), path = require('path');
const want = process.argv.slice(2), W = n => !want.length || want.includes(n);
let fails = 0; const ok = (c, s, x) => { console.log((c ? 'ok   ' : 'FAIL ') + s + (x !== undefined ? ' ' + JSON.stringify(x) : '')); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors, start } = T; page.setDefaultTimeout(300000);
  const idx = await page.evaluate(() => { const Rf = window.__pp.RIFT_BY_ID.belfry, out = {}; for (const [k, land] of [['d1', 'belnave'], ['d2', 'belfoundry'], ['d3', 'belstorm']]) { let i = Rf.stages.findIndex(s => s && s.theme === k && s.kind === 'fight'); if (i < 0) { Rf.stages.push({ kind: 'fight', biome: land, theme: k, name: window.BEL_THEME[k].name }); i = Rf.stages.length - 1; } out[k] = i; } return out; });
  const gt = secs => page.evaluate(async secs => { const G = window.__pp.arc.game._dbg, t0 = G.g.t, w0 = performance.now(); while (G.g.t - t0 < secs && performance.now() - w0 < secs * 30000) { await new Promise(r => requestAnimationFrame(r)); if (G.me && !G.me.dead) { G.me.hp = G.ST.hp; G.me.mp = 999; } } }, secs);
  const peace = () => page.evaluate(() => { const G = window.__pp.arc.game._dbg; for (const m of G.mons) if (!m.boss) { m.aggro = false; m.x = -50; m.y = -50; } if (G.banners) G.banners.length = 0; });
  // the pet south of the room with the most props in view
  const toRoom = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, L = D.propList.filter(p => !p.broken); let best = null, bn = -1; for (const p of L) { const kinds = new Set(); const n = L.filter(q => Math.abs(q.x - p.x) < 4.5 && q.y - p.y > -4 && q.y - p.y < 6 && kinds.add(q.kind)).length + kinds.size * 2; if (n > bn) { bn = n; best = p; } }
    if (best) { const M = D.M, fl = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); return M && M.G && typeof T_FLOOR !== 'undefined' ? M.G[ty * M.MW + tx] === T_FLOOR && !(D.blocked && D.blocked(x, y, 0.3, 0)) : true; }; let sx = best.x, sy = best.y + 2.6;   // (the nearest open floor, not the sea)
      if (!fl(sx, sy)) { let bd = 1e9; for (let dy = -4; dy <= 4; dy += 0.5) for (let dx = -4; dx <= 4; dx += 0.5) { const x = best.x + dx, y = best.y + 2.6 + dy; if (fl(x, y) && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; sx = x; sy = y; } } }
      D.me.x = sx; D.me.y = sy; D.me.vx = D.me.vy = 0; } return { n: bn, kinds: [...new Set(L.map(p => p.kind))].join(',') }; });
  const props = {};
  if (W('shots') || W('break') || W('perf')) for (const k of ['d1', 'd2', 'd3']) { await start('belfry', idx[k]); await peace(); const r = await toRoom(); props[k] = r.kinds; await gt(3.2); await peace(); await gt(0.5); await peace(); await gt(0.3);
    if (W('shots')) { await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-themes-${k}.png`) }); console.log('shot', k, r.kinds);
      if (k === 'd3') { await page.evaluate(async () => { window.__BEL_FLASH = 0.85; for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r)); }); await page.screenshot({ path: path.resolve(__dirname, '../shots/bel-themes-d3-flash.png') }); await page.evaluate(() => { window.__BEL_FLASH = null; }); console.log('shot d3 lightning (held at 0.85)'); } }
    if (W('perf')) { const pf = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, raf = () => new Promise(r => requestAnimationFrame(r)), runs = []; for (let k = 0; k < 3; k++) { for (let i = 0; i < 2; i++) await raf(); D.g.prof = {}; for (let i = 0; i < 8; i++) await raf(); const P = D.g.prof; D.g.prof = null; runs.push({ world: (P.world || 0) / 8, dress: ((P.ground || 0) + (P.ents || 0)) / 8, over: (P.banners || 0) / 8 + (P.hud || 0) / 8 }); }
        const med = f => { const a = runs.map(f).sort((x, y) => x - y); return +a[1].toFixed(2); }; const S = window.BELPROPS.stats; return { world: med(r => r.world), dress: med(r => r.dress), painted: S.painted, paintMs: +S.paintMs.toFixed(0) }; }); console.log('PERF', k, JSON.stringify(pf)); }
    if (W('break')) { const r2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, BF = self.BREAK_FX, out = {}, seen = new Set(); for (const p of D.propList) { if (p.broken || seen.has(p.kind)) continue; seen.add(p.kind); for (let i = 0; i < 3 && !p.broken; i++) D.RES.areaHit(p.x, p.y - 0.3, 0.5, 9999, { src: 'ult' }); let s = BF.stats(); for (let i = 0; i < 24 && s.shards === 0; i++) { window.__pp.arc.game.update(1 / 30); s = BF.stats(); } out[p.kind] = { broken: !!p.broken, shards: s.shards, mat: (BF.KIND[p.kind] || {}).mat || BF.matOf(p.kind) }; for (let i = 0; i < 30; i++) window.__pp.arc.game.update(1 / 30); } return out; });
      const ks = Object.keys(r2); ok(ks.length > 0 && ks.every(q => r2[q].broken && r2[q].shards > 0), `${k}: every prop kind on the floor breaks through BREAK_FX (${ks.length} kinds)`, r2); } }
  if (W('seams')) { const r = await page.evaluate(() => { const lands = ['belnave', 'belfoundry', 'belstorm'], Tz = 47, NX = 12, NY = 9, cv = document.createElement('canvas'); cv.width = lands.length * (NX * Tz + 12); cv.height = NY * Tz + 30; const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height); const out = {};
      lands.forEach((id, li) => { const B = window.__pp.BIOMES[id], ox = li * (NX * Tz + 12); for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) { const X = ox + x * Tz, Y = y * Tz, h = ((x * 7 + y * 13) % 10) / 10; c.fillStyle = ['#C8CCBC', '#B0B4A4', '#D8DACA'][Math.floor(h * 3)]; c.fillRect(X, Y, Tz, Tz); B.floorFn(c, X, Y, Tz, h, h, x + 30, y + 21, 1.5, false, false, false, false); }
        // the step across tile edges against the step inside tiles, over every row
        const d = c.getImageData(ox, 0, NX * Tz, NY * Tz).data, w = NX * Tz, col = (x, y) => { const i = (y * w + x) * 4; return d[i] + d[i + 1] + d[i + 2]; }; let edge = 0, ne = 0, inner = 0, ni = 0;
        for (let y = 0; y < NY * Tz; y += 2) for (let x = 1; x < w - 1; x++) { const s = Math.abs(col(x, y) - col(x - 1, y)); if (x % Tz === 0) { edge += s; ne++; } else if (x % Tz > 1 && x % Tz < Tz - 1) { inner += s; ni++; } }
        for (let x = 0; x < w; x += 2) for (let y = 1; y < NY * Tz - 1; y++) { const s = Math.abs(col(x, y) - col(x, y - 1)); if (y % Tz === 0) { edge += s; ne++; } else if (y % Tz > 1 && y % Tz < Tz - 1) { inner += s; ni++; } }
        out[id] = +((edge / ne) / (inner / ni)).toFixed(2); c.fillStyle = '#FFF'; c.font = '14px sans-serif'; c.fillText(`${id}  (edge/inner step ${out[id]})`, ox + 4, NY * Tz + 20); });
      return { out, url: cv.toDataURL('image/png') }; });
    fs.writeFileSync(path.resolve(__dirname, '../shots/bel-themes-seams.png'), Buffer.from(r.url.split(',')[1], 'base64'));
    ok(Object.values(r.out).every(v => v < 1.35), 'seams: no tile lines in the three dungeons\' floors (the step across a tile edge as small as inside a tile)', r.out); }
  ok(errors.length === 0, 'no page errors', errors.slice(0, 4)); console.log(`\n${fails ? 'FAILED ' + fails : 'all passed'} · page errors: ${errors.length}`); await T.browser.close(); process.exit(fails || errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
