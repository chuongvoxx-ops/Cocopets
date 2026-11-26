// (v463 SK) Khyros: studio portraits of the GPU model (one GLM pass each, no game running) over a plain violet stone floor, and the arena's
// still pieces (the Memory Loom, the release plate). -> shots/v463-SK/studio-*.png and a sheet.
// usage: HTML=test-sk.html node tests/_sk-studio.js   env: DPR (1), ONLY (a name)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots/v463-SK'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 600, height: 520 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/Khyros|GLM|KHY/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sk.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  const dpr = +(process.env.DPR || 1), W = 560, H = 400;
  // (v463 SK third pass: the whole hound in frame, from the game camera: a 3/4 front view, a side view, a pure black silhouette, its head close)
  const shots = [['front34', { hd: Math.PI / 2 - 0.75, look: 0.25, menace: 0.7, spdK: 0.4, gait: 1.6, T: 26 }], ['side', { hd: 0.05, look: 0.2, menace: 0.7, spdK: 0.5, gait: 1.3, T: 26 }], ['silhouette', { hd: 0.05, look: 0.2, spdK: 0.5, gait: 1.3, T: 26, sil: 1 }], ['back34', { hd: -Math.PI / 2 + 0.7, look: -0.3, T: 26 }],
    ['coiled', { hd: 2.6, crouch: 1, menace: 1, jaw: 0.3, T: 26 }], ['lunge', { hd: 0.05, lunge: 1, jaw: 0.5, menace: 0.9, T: 24 }], ['jaw', { hd: 0.4, jaw: 1, roar: 0.6, menace: 1, recoil: 0.3, T: 26 }], ['stuck', { hd: 0.8, stuck: 1, slitK: 1, jaw: 0.6, crouch: 0.35, T: 26 }],
    ['head', { hd: 0.35, look: 0.4, menace: 0.8, jaw: 0.5, T: 64, cx: 1 }], ['flank', { hd: 0.15, menace: 0.8, T: 60, cx: -0.3 }], ['loom', { piece: 'loom', glow: 1, T: 90 }], ['plate', { piece: 'plate', glow: 1.4, T: 90 }]];
  shots.unshift(['compare', { compare: true }]);   // (Oneira, Khyros, Thul-Ammon at one scale, the same light floor)
  const only = process.env.ONLY; const urls = [];
  for (const [name, s] of shots) { if (only && name !== only) continue; const t0 = Date.now();
    const url = await p.evaluate(([s, W, H, dpr]) => { window.__SK_GL = 1; window.__SK_GLHQ = 1; window.__DB_GL = 1; window.__DB_GLHQ = 1; const MD = window.__pp.FIEND_DEFS.khyros.MODEL;
      if (s.compare) { const FD = window.__pp.FIEND_DEFS, W2 = 1960, H2 = 640, T = 24, cv = document.createElement('canvas'); cv.width = W2 * dpr; cv.height = H2 * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
        const g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, '#2A2638'); g.addColorStop(1, '#3B3550'); c.fillStyle = g; c.fillRect(0, 0, W2, H2); c.strokeStyle = 'rgba(0,0,0,.25)'; for (let y = 0; y < H2; y += T * 2) { c.beginPath(); c.moveTo(0, y); c.lineTo(W2, y); c.stroke(); }
        let ok = 0; try { if (FD.oneira.MODEL.studio(c, 250, H2 * 0.78, 1.0, { pet: [2, 7, 0.4], menace: 0.5, pores: 0.9 }, { T })) ok++; } catch (e) { }
        try { if (MD.studio(c, 880, H2 * 0.6, { hd: Math.PI / 2 - 0.75, look: 0.3, menace: 0.7, spdK: 0.5, gait: 1.6 }, { T })) ok++; } catch (e) { }
        try { if (FD.thulammon.MODEL.studio(c, 1620, H2 * 0.56, 0, { menace: 0.6 }, { T })) ok++; } catch (e) { }
        c.font = '600 16px sans-serif'; c.fillStyle = '#E8E4F0'; c.fillText('Oneira (Rift 03)', 20, 26); c.fillText('Khyros (Rift 04, third pass)', 700, 26); c.fillText('Thul-Ammon (Rift 03)', 1480, 26);
        return ok ? cv.toDataURL('image/png') : null; }
      const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2B2348'); g.addColorStop(1, '#3A2F64'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const T = s.T || 44; c.strokeStyle = 'rgba(10,6,20,.45)'; c.lineWidth = 1; for (let y = 0; y < H; y += T * 2) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); } for (let x = 0; x < W; x += T * 2) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      let R = null; if (s.piece) R = MD.studioPiece(c, W * 0.5, H * 0.72, s.piece, s.glow, T); else { const dx = Math.cos(s.hd), dy = Math.sin(s.hd), sh = s.cx != null ? s.cx * 6 : -2.2; let cc2 = c; const tmp = s.sil ? document.createElement('canvas') : null; if (tmp) { tmp.width = cv.width; tmp.height = cv.height; cc2 = tmp.getContext('2d'); cc2.scale(dpr, dpr); }
        R = MD.studio(cc2, W * 0.5 - dx * T * sh, H * 0.6 - dy * T * sh * 0.72, s, { T });
        if (tmp) { const g2 = tmp.getContext('2d'); g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-in'; g2.fillStyle = '#000'; g2.fillRect(0, 0, tmp.width, tmp.height); c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#F2F0F6'; c.fillRect(0, 0, cv.width, cv.height); c.drawImage(tmp, 0, 0); } }
      return R ? cv.toDataURL('image/png') : null; }, [s, W, H, dpr]);
    console.log(name, url ? 'ok' : 'NOT DRAWN', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
    if (url) { const f = path.join(OUT, `studio-${name}${dpr > 1 ? '-d' + dpr : ''}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); urls.push(f + '=' + name); } }
  const st = await p.evaluate(() => { const MD = window.__pp.FIEND_DEFS.khyros.MODEL; return { gl: MD.__dbg.glStats, mem: MD.__dbg.mem }; }); console.log('gl', JSON.stringify(st));
  if (urls.length > 1) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(OUT, `studio-sheet${dpr > 1 ? '-d' + dpr : ''}.png`), ...urls], { stdio: 'inherit' });
  console.log('errors', errs.length, errs.slice(0, 4)); await b.close();
})();
