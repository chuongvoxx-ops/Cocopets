// A Legendary as a game image (petImage, used by the dungeon and the arcade): its wings, drawn by <use>, show in the
// image too. usage: node tests/_leg-img.js   env: HTML
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 600, height: 300 } });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const r = await page.evaluate(async () => {
    const P = window.__pp, out = [];
    const cv = document.createElement('canvas'); cv.width = 600; cv.height = 300; cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#fff'; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, 600, 300);
    let x = 0;
    for (const sd of [11, 23]) {
      const g = P.summonGenome(6, P.mulberry32(sd)), f = P.evolveLine(g.form, 5, P.mulberry32(sd * 7))[4];
      const plain = JSON.parse(JSON.stringify(f)); delete plain.x.wings;
      for (const ff of [f, plain]) {
        const im = await P.GFX ? null : null;
        const svg = P.petSVG(ff, { static: true, frame: 'fit', px: 150, lite: true });
        const img = await new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
        if (!img) { out.push('no image'); continue; }
        c.drawImage(img, x, 0, 150, 150); x += 150;
      }
      // count the wings' pixels: inked pixels in the image with wings that the one without lacks
      const a = c.getImageData(x - 300, 0, 150, 150).data, b = c.getImageData(x - 150, 0, 150, 150).data; let n = 0;
      for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++;
      out.push(sd + ': ' + n);
    }
    return out;
  });
  console.log(r.join('\n'));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/leg-img.png') });
  await browser.close();
})();
