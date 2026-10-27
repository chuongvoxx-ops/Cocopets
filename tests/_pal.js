const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 82, seals: [] }); const { page } = T;
  const r = await page.evaluate(() => { try { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 800; const c = cv.getContext('2d'); GAP_EXT.moonpool.back(c, { pat: () => {}, pattern: () => null, k: 1, W: 400, H: 800, t: 1, wx: 100, wy: 200, bigGlow: () => {} }); const d = c.getImageData(0, 500, 400, 200).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 150) n++; return 'ok ' + n; } catch (e) { return e.message + ' ' + e.stack.split('\n')[1]; } });
  console.log(r); process.exit(0); })();
