// Legendary pets drawn large: seeds x stages, on light and dark. usage: node tests/_leg-zoom.js [seeds] [stages]   env: HTML, BG, OUT
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seeds = (process.argv[2] || '11,23,47').split(',').map(Number), stages = (process.argv[3] || '1,3,5,7').split(',').map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const Z = +(process.env.SZ || 250), W = (Z + 10) * stages.length + 20, H = (Z + 20) * seeds.length + 20;
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const info = await page.evaluate(([seeds, stages, bg, Z, STARS]) => {
    const P = window.__pp; P.quickStart('Z'); const out = [];
    let html = `<div id="lz" style="position:fixed;inset:0;z-index:99999;background:${bg};display:grid;grid-template-columns:repeat(${stages.length},${Z}px);gap:10px;padding:10px">`;
    seeds.forEach(sd => { const R = P.mulberry32(sd), g = P.summonGenome(STARS, R), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7));
      stages.forEach(s => { const f = line[s - 1]; out.push(sd + '/' + s + ' ' + JSON.stringify({ leg: f.x.leg, w: f.x.wings, l: f.x.lights, eyes: f.eyes.t, mouth: f.mouth })); html += `<div style="height:${Z + 10}px">${P.petSVG(f, { frame: 'fit' })}</div>`; }); });
    document.body.insertAdjacentHTML('beforeend', html + '</div>');
    document.querySelectorAll('#lz svg').forEach(s => { s.style.width = '100%'; s.style.height = '100%'; });
    return out;
  }, [seeds, stages, process.env.BG || '#FFF8EC', Z, +(process.env.STARS || 6)]);
  info.forEach(l => console.log(l));
  await page.waitForTimeout(300); await page.screenshot({ path: path.resolve(__dirname, '../shots/' + (process.env.OUT || 'leg-zoom') + '.png') });
  console.log('errors', errors);
  await browser.close();
})();
