// (v472 YM) Rift 06's brood studio: each monster's 2D drawing rendered large (the design reference) beside its GPU model (YUG_BROOD,
// 20u6f) in each of its modes, facing right and left, a later frame and the hit flash, on its land's floor colour; with a check that no
// picture is cut at its sprite's edge. Before YUG_BROOD exists it renders the 2D drawings alone (the "before" sheet).
// usage: HTML=<test page> node tests/_ym-studio.js [out dir shots/v472-YM] [types all] [rpx 70] [land wreckfield]
//   -> <out>/studio-<type>.png (one sheet per monster) and studio-all.png (every monster, 2D | GPU idle | GPU attack)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const OUT = path.resolve(__dirname, '..', process.argv[2] || 'shots/v472-YM'); fs.mkdirSync(OUT, { recursive: true });
  const ONLY = process.argv[3] && process.argv[3] !== 'all' ? process.argv[3].split(',') : null, RPX = +(process.argv[4] || 70), LANDQ = process.argv[5] || '';
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'], exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const browser = await chromium.launch({ executablePath: exe, args });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
  const T0 = Date.now(), lg = s => console.log(((Date.now() - T0) / 1000).toFixed(0) + 's ' + s), errors = [];
  page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.text().startsWith('ABLOG')) lg(m.text()); if ((m.type() === 'warning' || m.type() === 'error') && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
  await page.addInitScript(() => { window.__YUB_GL = 1; window.__YUB_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ym.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 180000 }); await page.waitForTimeout(300);
  const info = await page.evaluate(() => ({ gpu: !!window.YUG_BROOD, types: window.YUG_BROOD ? window.YUG_BROOD.TYPES : ['sparkmite', 'hullwing', 'coilsentry', 'chargecell', 'warmech', 'mechhound', 'mechegg', 'eggling'] }));
  lg('YUG_BROOD ' + info.gpu + ' types ' + info.types.join(','));
  const MODES = { sparkmite: ['', 'block', 'dash'], hullwing: [''], coilsentry: ['', 'block'], chargecell: [''], warmech: ['', 'block', 'fire'], mechhound: ['', 'block'], mechegg: ['', 'block'], eggling: [''] };
  const sheets = {};
  if (info.gpu) lg('compile ' + await page.evaluate(() => { const S = window.YUG_BROOD, { DunArt, MON } = S.env(); S.bio = 'wreckfield'; const t = performance.now(); DunArt.monSprite('eggling', 20, 0.1, MON.eggling.color, '', false); DunArt.monCache.clear(); return Math.round(performance.now() - t); }) + 'ms');
  for (const t of info.types) { if (ONLY && !ONLY.includes(t)) continue;
    const r = await page.evaluate(async ([t, RPX, MODES, gpu, LANDQ]) => { const P = window.__pp, { DunArt, MON, BIOMES } = P, S = window.YUG_BROOD, D = S && S.DEF[t], M = MON[t], col = M.color;
      const land = LANDQ || (M.bio && M.bio.length === 1 ? M.bio[0] : t === 'warmech' || t === 'mechhound' ? 'coolant' : 'wreckfield'), B = BIOMES[land];
      const rp = t === 'warmech' ? RPX * 0.75 : RPX, ext = 3.2, cell = Math.round(rp * ext), modes = (D && D.modes) || MODES[t] || [''], nf = (D && D.nf) || (DunArt.NF[t] || 4);
      const cols = 1 + (gpu ? modes.length * (D && D.faced ? 2 : 1) + 2 : modes.length), W = Math.max(cell * cols + 20, 400), H = cell + 40;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
      c.fillStyle = B.floor[0]; c.fillRect(0, 0, W, H); for (let y = 0; y < H; y += 40) for (let x = (y / 40 % 2) * 40; x < W; x += 80) { c.fillStyle = B.floor[1]; c.fillRect(x, y, 40, 40); }
      c.font = 'bold 14px sans-serif'; c.fillStyle = B.floor[0] > '#A' ? '#1A2238' : '#FFFFFF';
      const cutOf = s => { const g = s.cv.getContext('2d'), w = s.cv.width, h = s.cv.height, e = [g.getImageData(0, 0, w, 1), g.getImageData(0, h - 1, w, 1), g.getImageData(0, 0, 1, h), g.getImageData(w - 1, 0, 1, h)]; let mx = 0; for (const d of e) for (let i = 3; i < d.data.length; i += 4) mx = Math.max(mx, d.data[i]); return mx; };
      const put = (s, i, label) => { const x = 10 + cell * (i + 0.5), y = 30 + cell * 0.55; c.drawImage(s.cv, x - s.half, y - s.half); c.fillText(label, x - cell * 0.45, 20); };
      let i = 0, cut = 0, n = 0; const ms = [];
      window.__YUB_GL = 0; if (S) S.bio = land; DunArt.monCache.clear();
      if (gpu) { put(DunArt.monSprite(t, rp, 0.5 / nf, col, '', false), i++, t + ' (2D)'); }
      else for (const md of modes) put(DunArt.monSprite(t, rp, 0.5 / nf, col, md, false), i++, t + ' 2D ' + (md || 'idle'));
      if (gpu) { DunArt.monCache.clear(); window.__YUB_GL = 1; S.bio = land;
        for (const md of modes) for (const lf of D.faced ? [false, true] : [false]) { const tb = performance.now(), s = DunArt.monSprite(t, rp, 0.5 / nf, col, lf ? md + '<' : md, false); ms.push(Math.round(performance.now() - tb)); n++; cut = Math.max(cut, cutOf(s)); put(s, i++, 'GPU ' + (md || 'idle') + (lf ? ' L' : '')); await new Promise(r => setTimeout(r, 0)); }
        const s2 = DunArt.monSprite(t, rp, (Math.floor(nf / 2) + 0.5) / nf, col, '', false); cut = Math.max(cut, cutOf(s2)); put(s2, i++, 'GPU frame ' + Math.floor(nf / 2));
        put(DunArt.monSprite(t, rp, 0.5 / nf, col, '', true), i++, 'hit flash'); }
      return { url: cv.toDataURL('image/png'), land, n, ms, cutAlpha: cut, over: S ? S.stats.over[t] : null }; }, [t, RPX, MODES, info.gpu, LANDQ]);
    fs.writeFileSync(path.join(OUT, `studio-${t}${info.gpu ? '' : '-2d'}.png`), Buffer.from(r.url.split(',')[1], 'base64')); sheets[t] = r.url;
    delete r.url; lg(t + ' ' + JSON.stringify(r));
  }
  if (info.gpu) lg('stats ' + JSON.stringify(await page.evaluate(() => { const s = window.YUG_BROOD.stats; return { models: s.models.map(m => m.name + ':' + m.tris + 't/' + m.meshMs + 'ms/' + m.passMs + 'ms'), baked: s.baked, over: s.over, mem: window.YUG_BROOD.mem() }; })));
  lg('errors ' + JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})();
