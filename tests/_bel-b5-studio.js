// Uldroth's model alone (worker B5, 20t5): the art poses drawn big on the GPU (GLM forced on the software rasteriser) on a
// pale stone backdrop, one picture: shots/bel-b5-studio.png (NOGL=1: the 2D fallback). env: POSES (indices), T (px per tile)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Uldroth|GLM/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(gl => { window.__ULD_GL = gl; if (!window.__noRaf) { window.__noRaf = 1; window.requestAnimationFrame = () => 0; } }, process.env.NOGL ? 0 : 1);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-belB5.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  const r = await page.evaluate(o => { const P = window.__pp, UL = P.FIEND_DEFS.beluldroth.ULDROTH, D = P.FIEND_DEFS.beluldroth, MD = UL.MODEL;
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 900; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(cv); const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#2E2148'); g.addColorStop(0.35, '#4A3866'); g.addColorStop(0.36, '#BFC2B3'); g.addColorStop(1, '#A9AD9E'); c.fillStyle = g; c.fillRect(0, 0, 1200, 900);
    const poses = o.poses ? o.poses.map(i => D.artPoses[i]) : D.artPoses.slice(0, 6), T = o.T || 34, cols = 3, cw = 400, ch = 450;
    const t0 = performance.now();
    poses.forEach((ps, i) => { const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch + ch * 0.82, P2 = Object.assign(MD.blankPose(), ps.mem.P);
      MD.draw(c, 0, 0, MD.headOf(Math.PI / 2 + 0.55), P2, { T, sx: v => cx + v * T, sy: v => cy + v * T, t: 2.0 });
      c.fillStyle = '#FFF'; c.font = '14px sans-serif'; c.fillText(ps.name, cx - cw / 2 + 8, cy - ch * 0.78); });
    return { ms: Math.round(performance.now() - t0), gl: MD.__dbg.gl, stats: MD.__dbg.glStats }; }, { poses: process.env.POSES ? process.env.POSES.split(',').map(Number) : null, T: +(process.env.T || 34) });
  console.log(JSON.stringify(r));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/' + (process.env.OUT || 'bel-b5-studio') + '.png') });
  console.log('errors', errors.slice(0, 5)); await browser.close();
})();
