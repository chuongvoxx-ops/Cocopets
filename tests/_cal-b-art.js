// Bomb King (Rift 0, worker B): the model's poses as a contact sheet, GPU (GLM under swiftshader, full resolution) and the
// 2D fallback.   usage: HTML=test-calB.html node tests/_cal-b-art.js   -> shots/cal-b-art-gl.png, shots/cal-b-art-2d.png
// (env SCALE=2.4 the model's tiles per unit; POSE=name to render one pose large -> shots/cal-b-pose-<name>.png)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calB.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const POSES = {
    rest: {}, breathe: { breath: 1, beat: 0.6 }, angry: { rune: 1, iris: 1, glow: 1.0, beat: 1 }, vent: { open: 0.6, glow: 1.3, pitch: 0.1 },
    furnace: { open: 1, glow: 1.6, rune: 1, pitch: 0.05 }, side: { look: 1.2 }, back: { look: 2.9 }, fuseLow: { fuse: 0.35, rune: 0.5 },
    fuseOut: { fuse: 0.05, fuseLit: 0, glow: 0.3, dark: 0.5 }, crackMid: { crack: 0.45, fuseLit: 0, fuse: 0, glow: 0.2, dark: 0.8, zc: 1.0 }, dead: { crack: 1, fuseLit: 0, fuse: 0, glow: 0.05, dark: 1, zc: 1.0 }, struck: { jolt: 1, open: 0.15, glow: 1.2, rune: 0.7 },
  };
  for (const mode of ['gl', '2d']) {
    const r = await page.evaluate(async ([POSES, mode, scale, one]) => {
      window.__CALBOMB_GL = 1; window.__CALBOMB_GLHQ = 1;
      const K = window.__pp.FIEND_DEFS.calbomb.MODEL; K.__dbg.noGL = mode === '2d';
      let cv = document.getElementById('art'); if (!cv) { cv = document.createElement('canvas'); cv.id = 'art'; cv.width = 1200; cv.height = 900; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#000'; document.body.appendChild(cv); }
      const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, 900); g.addColorStop(0, '#120806'); g.addColorStop(1, '#2A120A'); c.fillStyle = g; c.fillRect(0, 0, 1200, 900);
      const names = one ? [one] : Object.keys(POSES), cols = one ? 1 : 4, cw = 1200 / cols, ch = one ? 900 : 300, T = one ? 70 : 30;
      names.forEach((nm, i) => { const cx = (i % cols) * cw + cw / 2, cy = Math.floor(i / cols) * ch + ch * 0.78;
        // floor tile
        c.fillStyle = '#1E1612'; c.beginPath(); c.ellipse(cx, cy, cw * 0.45, ch * 0.13, 0, 0, Math.PI * 2); c.fill();
        const P = Object.assign(K.blankPose(), POSES[nm]), z = (P.crack > 0 ? 1.0 : 1.25) * scale;
        P.zc = z / scale;
        const o = { T, sx: x => cx + x * T, sy: y => cy + y * T, t: 3.3, scale };
        K.drawShadow(c, 0, 0, z, P, o); K.draw(c, 0, 0, z, Math.PI / 2, P, o);
        c.fillStyle = '#FFE6C8'; c.font = '14px sans-serif'; c.fillText(nm, cx - cw / 2 + 8, Math.floor(i / cols) * ch + 18); });
      return K.__dbg.glStats;
    }, [POSES, mode, +(process.env.SCALE || 2.4), process.env.POSE || null]);
    console.log(mode, JSON.stringify(r));
    await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-b-${process.env.POSE ? 'pose-' + process.env.POSE : 'art'}-${mode}.png`) });
  }
  console.log(errors.length ? 'ERRORS ' + errors.join('\n') : 'no page errors');
  await browser.close();
})();
