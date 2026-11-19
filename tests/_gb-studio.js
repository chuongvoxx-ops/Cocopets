// v423 GB: a studio turnaround of a garden boss's GLM model (one GPU draw each, no fight running), over a plain night floor,
// at several headings and in its key poses -> shots/v423-GB/<boss>-studio.png (one sheet).
// usage: HTML=test-gb.html node tests/_gb-studio.js ambrel|calyx   env: DPR (1), OUT (shots/v423-GB)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const boss = process.argv[2] || 'ambrel', DPR = +(process.env.DPR || 1), OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v423-GB');
(async () => { fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 400, height: 400 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-gb.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  const t0 = Date.now();
  const url = await p.evaluate(([boss, DPR]) => { window.__GB_GL = 1; window.__GB_GLHQ = 1; const D = window.__pp.FIEND_DEFS[boss], GL = D.GB.gl; if (!GL) return { err: 'no GL' };
    const cw = 360, ch = 360, poses = GL.studio(), cols = 4, rows = Math.ceil(poses.length / cols), W = cw * cols, H = ch * rows;
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const out = []; poses.forEach((ps, i) => { const x0 = (i % cols) * cw, y0 = Math.floor(i / cols) * ch;
      const g = c.createRadialGradient(x0 + cw / 2, y0 + ch * 0.62, 10, x0 + cw / 2, y0 + ch * 0.62, cw * 0.7); g.addColorStop(0, '#3A2449'); g.addColorStop(1, '#170B1E'); c.fillStyle = g; c.fillRect(x0, y0, cw, ch);
      c.save(); c.beginPath(); c.rect(x0, y0, cw, ch); c.clip(); const T = ps.T || 26, X = x0 + cw / 2, Y = y0 + ch * (ps.fy || 0.78);
      let ok = false; try { ok = GL.studioDraw(c, ps, { T, sx: v => X + v * T, sy: v => Y + v * T, t: ps.t || 2.0 }); } catch (e) { out.push(String(e && e.stack || e)); }
      c.restore(); c.fillStyle = '#FFFFFF'; c.font = '13px sans-serif'; c.fillText(ps.name + (ok ? '' : ' (not drawn)'), x0 + 8, y0 + 18); });
    return { url: cv.toDataURL('image/png'), out, stats: GL.__dbg.stats }; }, [boss, DPR]);
  if (url.url) fs.writeFileSync(path.join(OUT, `${boss}-studio${DPR > 1 ? '-dpr' + DPR : ''}.png`), Buffer.from(url.url.split(',')[1], 'base64'));
  console.log(boss, 'studio', url.err || 'ok', JSON.stringify(url.stats), (Date.now() - t0) / 1000 + 's'); if (url.out && url.out.length) console.log(url.out.join('\n'));
  console.log('errors', errs.slice(0, 5)); await b.close(); })();
