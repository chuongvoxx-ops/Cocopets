// Final Eclipse's demon knight (worker U1, v391): a turnaround on GLM (front, three-quarter, side), each a phone-size panel: the whole figure with its wings spread, then a close-up with them folded. usage: HTML=test-u1.html node tests/_ult-finaleclipse-turn.js -> shots/fe/turn-all.png (env LIGHT=1 a pale backdrop, POSE, T)
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1170, height: 844 }, deviceScaleFactor: 1 }); const errs = []; p.on('pageerror', e => errs.push(e.message + (e.stack||'').split('\n').slice(1,3).join(' '))); p.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push('console: ' + m.text().slice(0, 400)); });
  await p.addInitScript(f => { window.__FE_GL = f; window.__FE_GLHQ = 1; }, process.env.NOGL ? 0 : 1);
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-u1.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const r = await p.evaluate(({ pose, t, bg }) => {
    const D = window.__pp.ELEM_IMPL.dark.ult.finaleclipse.__dbg.DEMON;
    const cv = document.createElement('canvas'); cv.width = 1170; cv.height = 844; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999'; document.body.appendChild(cv);
    const c = cv.getContext('2d'); const out = [];
    const views = [Math.PI / 2, Math.PI / 2 - 0.75, 0.02];
    views.forEach((a, i) => { const x0 = i * 390; c.save(); c.beginPath(); c.rect(x0, 0, 390, 844); c.clip();
      const g = c.createLinearGradient(0, 0, 0, 844); g.addColorStop(0, bg[0]); g.addColorStop(1, bg[1]); c.fillStyle = g; c.fillRect(x0, 0, 390, 844);
      const P = D.pose(pose); const o = { T: 50, sx: v => v, sy: v => v, t, scale: 1, ev: +(window.__EV || 1), lagP: P };
      const R1 = D.draw(c, x0 + 195, 300, 0, a, P, o);
      const P2 = Object.assign(D.pose(pose), { wFold: 1, wBeat: 0, wEl: 0.1, tailC: 0.5 }), o2 = Object.assign({}, o, { T: 125, lagP: P2 }); c.save(); c.beginPath(); c.rect(x0, 420, 390, 424); c.clip(); c.fillStyle = bg[1]; c.fillRect(x0, 420, 390, 424); D.draw(c, x0 + 195, 660, 0, a, P2, o2); c.restore();
      out.push(R1.gl); c.restore(); });
    return { gl: out, stats: D.__dbg.glStats };
  }, { pose: process.env.POSE || 'hover', t: +(process.env.T || 0.3), bg: process.env.LIGHT ? ['#D8D2C4', '#B9B3A6'] : ['#2B2F38', '#14161B'] });
  await p.screenshot({ path: process.env.OUT || path.resolve(__dirname, '../shots/fe/turn-all.png') });
  console.log(JSON.stringify(r), errs.slice(0, 5)); await b.close(); })();
