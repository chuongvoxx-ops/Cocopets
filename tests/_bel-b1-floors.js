// v391 B1: the seven Belfry floors painted tile by tile, as the engine does (each tile clipped to itself, on top of the
// engine's own per-tile shade and light), at an odd tile size (47 px, a phone at k = 1.5) -> shots/bel-b1-floors.png
// (tests/_bel-b1-sheet.py boosts it to show there are no tile lines)
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
const fs = require('fs'), path = require('path');
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors } = T;
  const url = await page.evaluate(() => { const BEL = window.BEL, lands = Object.keys(BEL.LANDS), Tz = 47, NX = 8, NY = 6, cv = document.createElement('canvas'); cv.width = NX * Tz * 4 + 30; cv.height = Math.ceil(lands.length / 4) * (NY * Tz + 30); const c = cv.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, cv.width, cv.height);
    lands.forEach((id, li) => { const ox = (li % 4) * (NX * Tz + 10), oy = Math.floor(li / 4) * (NY * Tz + 30);
      for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) { const X = ox + x * Tz, Y = oy + y * Tz, h = ((x * 7 + y * 13) % 10) / 10;
        // the engine's per-tile shade (one of three colours) and per-tile light, which the land must cover
        c.fillStyle = ['#C8CCBC', '#B0B4A4', '#D8DACA'][Math.floor(h * 3)]; c.fillRect(X, Y, Tz, Tz); const g = c.createLinearGradient(X, Y, X + Tz, Y + Tz); g.addColorStop(0, 'rgba(255,255,255,.09)'); g.addColorStop(1, `rgba(0,0,0,${0.08 + h * 0.06})`); c.fillStyle = g; c.fillRect(X, Y, Tz, Tz);
        BEL.floorAt(c, id, x + 40, y + 20, Tz, X, Y); }
      c.fillStyle = '#FFF'; c.font = '14px sans-serif'; c.fillText(id, ox + 4, oy + NY * Tz + 18); });
    return cv.toDataURL('image/png'); });
  fs.writeFileSync(path.resolve(__dirname, '../shots/bel-b1-floors.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length); await T.browser.close();
})();
