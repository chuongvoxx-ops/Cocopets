// Rift 0 (v389 F): are the floor tiles seamless? HTML=test-calF.html node tests/_cal-f-seams.js [tag]   (ST=0,1,3,4,6,7)
// For each stage: paints one ground chunk the way the game does (DunWorld.chunk at the phone's k = 1.5) and measures, at
// every boundary between two plain floor tiles, the jump in tone across it (strips of 3px either side, over the whole edge)
// and the sharpest pixel step there, each against the same measure taken across the middle of the tile (ratio 1 = no seam).
// Then stands on the plainest stretch of floor and takes a phone-size shot: shots/cal-seam-<stage>-<tag>.png
process.env.HTML = process.env.HTML || 'test.html'; process.env.SHOTS = '1';
const path = require('path');
const { open } = require('./_rift-lib');
const tag = process.argv[2] || 'now';
(async () => { const T = await open({ lvl: 12 }); const { page, start, run } = T; const res = {};
  for (const st of (process.env.ST || '0,1,3,4,6,7').split(',').map(Number)) {
    // (the same map before and after: Math.random seeded for the stage's making)
    await page.evaluate(sd => { let a = sd >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, 1234 + st); await start('caldera', st); await run(1.5);
    const r = await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, M = D.M, G = M.G, MW = M.MW, MH = M.MH, CH = P.DunWorld.CH;
      for (const m of D.mons) m.dead = true;
      const plain = (x, y) => x >= 0 && y >= 0 && x < MW && y < MH && G[y * MW + x] === 1 && !M.props.has(y * MW + x);
      const inner = (x, y) => plain(x, y) && plain(x - 1, y) && plain(x + 1, y) && plain(x, y - 1) && plain(x, y + 1);
      // the chunk with the most plain floor, and the plainest spot for the camera (a 9 x 13 window)
      const cl = []; for (let cy = 0; cy * CH < MH; cy++) for (let cx = 0; cx * CH < MW; cx++) { let n = 0; for (let y = cy * CH; y < cy * CH + CH; y++) for (let x = cx * CH; x < cx * CH + CH; x++) if (inner(x, y)) n++; cl.push([n, cx, cy]); }
      cl.sort((a, b) => b[0] - a[0]); const picks = cl.slice(0, 6).map(v => [v[1], v[2]]);
      let bs = null, bsn = -1; for (let y = 6; y < MH - 6; y++) for (let x = 4; x < MW - 4; x++) { if (!inner(x, y)) continue; let n = 0; for (let dy = -6; dy <= 6; dy++) for (let dx = -4; dx <= 4; dx++) if (plain(x + dx, y + dy)) n++; if (n > bsn) { bsn = n; bs = [x, y]; } }
      const any = [...D.chunks.values()][0], TS = Math.round(any.width / (CH * Math.min(P.arc.dpr || 1, 1.5))), k = any.width / (CH * TS);   // (the game's own k)
      const acc = { stepB: 0, stepM: 0, edgeB: 0, edgeM: 0, n: 0 }; let png = null;
      for (const bc of picks) {
      const dbc = M.decalsByChunk; M.decalsByChunk = null; const cv = P.DunWorld.chunk(M, bc[0], bc[1], TS, k); M.decalsByChunk = dbc; const W = cv.width,   // (no decals: they are blobs laid over the floor, not part of it)
      d = cv.getContext('2d').getImageData(0, 0, W, cv.height).data;
      const L = (px, py) => { const i = (py * W + px) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; };
      const Tk = TS * k, ox = bc[0] * CH, oy = bc[1] * CH;
      // across a line at pixel position b (vertical line if vert), over the span [s0, s1) of the other axis
      const across = (b, s0, s1, vert) => { let l = 0, r = 0, e = 0, n = 0; const bi = Math.round(b); for (let s = Math.ceil(s0 + 3); s < Math.floor(s1 - 3); s++) { const at = o => vert ? L(bi + o, s) : L(s, bi + o); l += at(-4) + at(-3) + at(-2); r += at(1) + at(2) + at(3); e += Math.max(Math.abs(at(0) - at(-1)), Math.abs(at(1) - at(0)), Math.abs(at(-1) - at(-2))); n++; } return n ? [Math.abs(l - r) / (3 * n), e / n] : null; };
      for (let y = oy; y < oy + CH; y++) for (let x = ox; x < ox + CH; x++) { if (!inner(x, y)) continue;
        for (const [nx, ny, vert] of [[x + 1, y, true], [x, y + 1, false]]) { if (!inner(nx, ny) || nx >= ox + CH || ny >= oy + CH) continue;
          const px0 = (x - ox) * Tk, py0 = (y - oy) * Tk, b = vert ? px0 + Tk : py0 + Tk, m = vert ? px0 + Tk / 2 : py0 + Tk / 2, s0 = vert ? py0 : px0, s1 = s0 + Tk;
          const B = across(b, s0, s1, vert), Mm = across(m, s0, s1, vert); if (!B || !Mm) continue; acc.stepB += B[0]; acc.edgeB += B[1]; acc.stepM += Mm[0]; acc.edgeM += Mm[1]; acc.n++; } }
      if (!png) png = cv.toDataURL(); }
      const f = v => +(v / acc.n).toFixed(2);
      return { name: D.RIFT.self.S.name, biome: P.BIOME_ORDER[M.BI[bs[1] * MW + bs[0]]], TS, Tk: TS * k, chunks: picks.length, pairs: acc.n, step: [f(acc.stepB), f(acc.stepM), +(acc.stepB / acc.stepM).toFixed(2)], edge: [f(acc.edgeB), f(acc.edgeM), +(acc.edgeB / acc.edgeM).toFixed(2)], spot: bs, png }; });
    require('fs').writeFileSync(path.resolve(__dirname, `../shots/cal-seam-chunk-${st}-${tag}.png`), Buffer.from(r.png.split(',')[1], 'base64')); delete r.png;
    await T.goTo(r.spot[0] + 0.5, r.spot[1] + 0.5); await run(4);
    await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-seam-${st}-${tag}.png`) });
    res[st] = r; console.log(st, JSON.stringify(r)); }
  console.log('errors', T.errors.length, T.errors.slice(0, 3)); await T.browser.close(); })();
