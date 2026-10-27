// What single canvas operations cost on this renderer: blits big and small, fills big and small, clips, blends, toon shapes.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 780; cv.height = 1688; document.body.appendChild(cv); cv.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:844px;z-index:99';
    const c = cv.getContext('2d'); c.setTransform(2, 0, 0, 2, 0, 0);
    const fl = () => c.getImageData(0, 0, 1, 1);
    const big = document.createElement('canvas'); big.width = 1600; big.height = 1600; const bg = big.getContext('2d'); for (let i = 0; i < 400; i++) { bg.fillStyle = `hsl(${i * 7},60%,50%)`; bg.fillRect(Math.random() * 1600, Math.random() * 1600, 80, 80); }
    const scr = document.createElement('canvas'); scr.width = 780; scr.height = 1688; const sg = scr.getContext('2d'); sg.drawImage(big, 0, 0);
    const small = document.createElement('canvas'); small.width = 128; small.height = 128; const smg = small.getContext('2d'); smg.fillStyle = '#f80'; smg.beginPath(); smg.arc(64, 64, 60, 0, 7); smg.fill();
    const N = 60, out = {};
    const time = (name, f) => { f(0); fl(); const t0 = performance.now(); for (let i = 0; i < N; i++) f(i); fl(); out[name] = +((performance.now() - t0) / N * 1000).toFixed(0); };   // microseconds per op
    time('flush', () => fl());
    time('blitScreen', () => c.drawImage(scr, 0, 0, 390, 844));
    time('blitBigScaled', () => c.drawImage(big, -100, -100, 900, 900));
    time('blitSmall', i => c.drawImage(small, (i * 37) % 300, (i * 53) % 700, 64, 64));
    time('blitSmallLighter', i => { c.globalCompositeOperation = 'lighter'; c.drawImage(small, (i * 37) % 300, (i * 53) % 700, 64, 64); c.globalCompositeOperation = 'source-over'; });
    time('fillScreen', () => { c.fillStyle = '#123'; c.fillRect(0, 0, 390, 844); });
    time('fillScreenAlpha', () => { c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(0, 0, 390, 844); });
    time('gradScreen', () => { const g = c.createRadialGradient(195, 422, 50, 195, 422, 500); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.5)'); c.fillStyle = g; c.fillRect(0, 0, 390, 844); });
    time('quadSmall', i => { const x = (i * 37) % 300, y = (i * 53) % 700; c.fillStyle = '#4a8'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 20, y + 3); c.lineTo(x + 18, y + 22); c.lineTo(x - 2, y + 19); c.closePath(); c.fill(); });
    time('quadBig', i => { c.fillStyle = '#4a8'; c.beginPath(); c.moveTo(10, 10); c.lineTo(380, 30); c.lineTo(370, 830); c.lineTo(20, 800); c.closePath(); c.fill(); });
    time('poly40', i => { const x = 100 + (i * 37) % 200, y = 100 + (i * 53) % 600; c.fillStyle = '#48a'; c.beginPath(); for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283, r = 40 + 8 * Math.sin(a * 5); k ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill(); });
    time('poly40stroke', i => { const x = 100 + (i * 37) % 200, y = 100 + (i * 53) % 600; c.strokeStyle = '#123'; c.lineWidth = 3; c.lineJoin = 'round'; c.beginPath(); for (let k = 0; k < 40; k++) { const a = k / 40 * 6.283, r = 40 + 8 * Math.sin(a * 5); k ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.stroke(); });
    time('ellipse', i => { c.fillStyle = '#a48'; c.beginPath(); c.ellipse(100 + (i * 37) % 200, 100 + (i * 53) % 600, 40, 25, 0.3, 0, 6.283); c.fill(); });
    time('clipFill', i => { const x = 100 + (i * 37) % 200, y = 100 + (i * 53) % 600; c.save(); c.beginPath(); c.ellipse(x, y, 40, 25, 0.3, 0, 6.283); c.clip(); c.fillStyle = '#fff'; c.fillRect(x - 50, y - 30, 100, 60); c.restore(); });
    time('clipEvenoddBand', i => { const x = 100 + (i * 37) % 200, y = 100 + (i * 53) % 600; c.save(); c.beginPath(); c.ellipse(x, y, 40, 25, 0.3, 0, 6.283); c.clip(); c.beginPath(); c.rect(x - 60, y - 40, 120, 80); c.ellipse(x - 6, y - 5, 40, 25, 0.3, 0, 6.283); c.fillStyle = 'rgba(0,0,0,.3)'; c.fill('evenodd'); c.restore(); });
    time('saveRestore', () => { c.save(); c.restore(); });
    const TN = window.__pp.FiendToon || (typeof FiendToon !== 'undefined' ? FiendToon : null);
    if (TN) time('toonShape', i => { const x = 100 + (i * 37) % 200, y = 100 + (i * 53) % 600; TN.shape(c, TN.ell(x, y, 40, 25), { col: '#D4783A', shade: '#A0522A', hi: '#FFC08A', line: '#4A2210', r: 40, lw: 2 }); });
    time('arcStroke', i => { c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(195, 422, 50 + i, 0, 6.283); c.stroke(); });
    time('text', i => { c.font = '900 14px sans-serif'; c.fillStyle = '#fff'; c.fillText('HELLO ' + i, 100, 100 + i * 5); });
    cv.remove();
    return out;
  });
  console.log(JSON.stringify(r, null, 0));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
