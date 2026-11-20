// v430 BW: every rebuilt Belfry door, posed: std, boss and lift exits closed / unlocking / opening / open (their own motion
// stepped: lock, then the leaves or grille), the Hall's gate leaves, rosettes, bolts and sluice slab, the sump grate; on a
// Belfry floor tone, with the GPU light. DPR=1|3 OUT=dir -> v430-BW-doors-studio-dpr<N>.png
const { open } = require('./_bw-lib');
const fs = require('fs'), path = require('path');
(async () => {
  const dpr = +(process.env.DPR || 1), out = process.env.OUT || path.resolve(__dirname, '../shots/v430-BW'); fs.mkdirSync(out, { recursive: true });
  const T0 = await open({ dpr }); const { page, errors } = T0;
  await T0.start(3); await T0.run(0.5);   // (a Belfry stage loaded: the kit and the painter are up)
  const res = await page.evaluate(async dpr => { const BD = window.BEL_DOORS, T = 44, cols = 4, cw = 190, ch = 300, kinds = ['std', 'boss', 'lift'], poses = [['closed', 0, 0], ['unlocking', 0.5, 0], ['opening', 1, 0.45], ['open', 1, 1]];
    const W = cols * cw, H = kinds.length * ch + 260, cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2C3A3C'); g.addColorStop(1, '#1C2628'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(255,255,255,.05)'; for (let x = 0; x < W; x += T) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); } for (let y = 0; y < H; y += T) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    const t0 = performance.now(), info = []; for (const kd of kinds) for (const [n, v] of ({ std: [['frame', 'std'], ['leaf', 'stdl'], ['leaf', 'stdr'], ['lock', 'std']], boss: [['frame', 'boss'], ['leaf', 'bossl'], ['leaf', 'bossr'], ['lock', 'boss'], ['bolt', 's']], lift: [['frame', 'lift'], ['port', 0], ['wheel', 0], ['cwt', 0]] })[kd]) BD.sprite(n, v, Math.round(T * Math.min(2, dpr)));
    kinds.forEach((kind, r) => poses.forEach(([name, lock, k], i) => { const D = BD.mk(kind); D.want = k > 0 || lock > 0; D.lock = lock; D.k = k; D.kE = BD.heavy(k); D.lit = name === 'open' ? 1 : 0; D.vib = 0;
      const Xs = i * cw + cw / 2, Ys = r * ch + ch - 40, sc = kind === 'boss' ? 0.78 : 1; c.save(); c.translate(Xs, Ys); c.scale(sc, sc); const ok = BD.drawDoor(c, 0, 0, T, D, name === 'open', 1.3, name === 'open' ? (kind === 'lift' ? 'The lift' : kind === 'boss' ? 'Uldroth' : 'The way on') : ''); c.restore(); info.push([kind, name, ok]);
      c.fillStyle = '#E8F4F0'; c.font = '700 12px sans-serif'; c.textAlign = 'center'; c.fillText(`${kind} · ${name}`, Xs, Ys + 30); }));
    // the Hall's pieces, the lock rosettes, a bolt, the slab, the sump grate
    const y0 = kinds.length * ch + 20, row = [['leaf', 'halll', 0.42], ['leaf', 'hallr', 0.42], ['lock', 'std', 1], ['lock', 'boss', 1], ['lock', 'cer', 1], ['bolt', 's', 1], ['slab', 'f', 0.8], ['sump', 0, 1.2]]; let x = 14;
    for (const [n, v, s] of row) { const Ts = T * s, b = { leaf: [2.6, 3.5], lock: [0.9, 0.9], bolt: [3.0, 0.4], slab: [0.7, 1.6], sump: [1.1, 0.7] }[n], cxp = x + (n === 'leaf' ? (v === 'halll' ? b[0] * Ts : 0) : b[0] * Ts / 2), cyp = n === 'lock' || n === 'sump' || n === 'bolt' ? y0 + 120 : y0 + 200;
      BD.sprite(n, v, Math.round(Ts * Math.min(2, dpr))); info.push([n, v, BD.pic(c, n, v, cxp, cyp, Ts)]); x += b[0] * Ts + 18; }
    return { url: cv.toDataURL('image/png'), info, ms: performance.now() - t0, stats: BD.stats }; }, dpr);
  const f = path.join(out, `v430-BW-doors-studio-dpr${dpr}.png`); fs.writeFileSync(f, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log(JSON.stringify({ f, info: res.info, ms: Math.round(res.ms), stats: res.stats }));
  console.log('errors', errors.length, errors.slice(0, 3)); await T0.browser.close();
})();
