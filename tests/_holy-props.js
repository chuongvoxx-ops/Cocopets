// a sheet of the Ascent's props, big, for looking at
const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 72 }); const { page } = T;
  await page.evaluate(() => { const P = window.__pp; const cv = document.createElement('canvas'); cv.width = 780; cv.height = 520; cv.id = 'sheet'; cv.style.cssText = 'position:fixed;left:0;top:0;width:390px;height:260px;z-index:99999;background:#FFF6E6'; document.body.appendChild(cv); const c = cv.getContext('2d');
    const kinds = ['angelstatue', 'angelstatue', 'platpillar', 'haloarch', 'censer', 'harp']; kinds.forEach((k, i) => { const T = 44, s = P.DunWorld.propSprite(k, T, 1, i === 1 ? 1 : 0, 'archive'); c.drawImage(s.cv, 20 + (i % 3) * 255 + 110 - s.ax, 240 + Math.floor(i / 3) * 260 - s.ay); }); });
  await page.screenshot({ path: require('path').resolve(__dirname, '../shots/holy-props.png'), clip: { x: 0, y: 0, width: 390, height: 260 } }); process.exit(0); })();
