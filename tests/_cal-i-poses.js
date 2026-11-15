// Ifrit (Rift 0, 20zz8): every art pose of the GPU model painted big (and the 2D fallback beside it), the throne and the
// crystal growths. usage: HTML=test-calI.html node tests/_cal-i-poses.js   env: POSE_T (tile px, default 46), ONLY (pose index list)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 800 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { window.__IFRIT_GL = 1; window.__IFRIT_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calI.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);
  const out = path.resolve(__dirname, '../shots'); if (!fs.existsSync(out)) fs.mkdirSync(out);
  const T0 = +(process.env.POSE_T || 40), ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null, FB = !!process.env.FB, NP = await page.evaluate(() => window.__pp.FIEND_DEFS.califrit.artPoses.length);
  const jobs = []; for (let i = 0; i < NP; i++) if (!ONLY || ONLY.includes(i)) jobs.push(i); if (!ONLY || ONLY.includes(-1)) jobs.push('props');
  for (const job of jobs) { const t0 = Date.now();
  const res = await page.evaluate(([T, job, FB, TH]) => { const P = window.__pp, D = P.FIEND_DEFS.califrit, I = D.IFRIT, MD = I.MODEL, K = P.DunFiend.KIT, out = [], errs = [];
    const gl = MD.__dbg.gl; const only = job === 'props' ? [-99] : [job];
    (D.artPoses || []).forEach((ps, i) => { if (only && !only.includes(i)) return; for (const fb of [FB]) {
      const cv = document.createElement('canvas'); cv.width = T * 11; cv.height = T * 10.5; const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, '#2A0E08'); g.addColorStop(1, '#0E0504'); c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
      // a patch of floor
      c.fillStyle = '#3A302C'; c.beginPath(); c.ellipse(cv.width / 2, T * 8.6, T * 5, T * 1.8, 0, 0, Math.PI * 2); c.fill();
      const mem = JSON.parse(JSON.stringify(ps.mem || {})); if (TH != null) mem.th = TH; const m = { x: 0, y: 0, r: 2.2, face: 1, phase: 1, t: 1, dmg: 10, act: 'idle', dead: false };
      const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 1.5, y: 9 }, C: { x: 0, y: 0, R: 15 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
      MD.__dbg.noGL = fb;
      try { D.draw(c, FX, m, cv.width / 2, T * 8.6, T, 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')); }
      MD.__dbg.noGL = false;
      c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText(i + ': ' + ps.name + (fb ? ' (2D)' : ''), 10, 22); out.push({ i, fb, url: cv.toDataURL('image/png') }); } });
    // the props
    if (job === 'props') { const cv = document.createElement('canvas'); cv.width = T * 14; cv.height = T * 9; const c = cv.getContext('2d'); c.fillStyle = '#1A0805'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#3A302C'; c.fillRect(0, T * 6.5, cv.width, T * 3);
      const o = { T, sx: v => v * T, sy: v => v * T };
      try { MD.drawProp(c, 'throne', 3.5, 7.5, Math.PI / 2, Object.assign({}, o, { glow: 0.35, key: 'sheet' })); MD.drawProp(c, 'crystal', 8.5, 7.5, Math.PI / 2, Object.assign({}, o, { glow: 1, kind: 1, key: 'sheet1' })); MD.drawProp(c, 'crystal', 11.5, 7.5, 2.2, Object.assign({}, o, { glow: 0.28, kind: 1, key: 'sheet2' })); MD.drawProp(c, 'crystalBroken', 13, 8.2, 2.2, Object.assign({}, o, { glow: 0, kind: 1, key: 'sheet3' })); } catch (e) { errs.push('props: ' + e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')); }
      out.push({ i: 'props', fb: false, url: cv.toDataURL('image/png') }); }
    return { out, errs, gl, stats: MD.__dbg.glStats }; }, [T0, job, FB, process.env.TH != null ? +process.env.TH : null]);
  for (const p of res.out) fs.writeFileSync(path.join(out, `cal-i-pose-${p.i}${p.fb ? '-2d' : ''}${process.env.SUF || ''}.png`), Buffer.from(p.url.split(',')[1], 'base64'));
  console.log(job, 'gl', res.gl, ((Date.now() - t0) / 1000).toFixed(1) + 's', 'errs', res.errs.slice(0, 3)); }
  console.log('page errors', errors.length, errors.slice(0, 6));
  await browser.close();
})();
