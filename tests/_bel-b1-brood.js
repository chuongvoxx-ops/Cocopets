// v391 B1: the Belfry brood in every pose, drawn large on a dark and a light ground -> shots/bel-b1-brood-sheet.png
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
const fs = require('fs'), path = require('path');
(async () => {
  const T = await open({ lvl: 14 }); const { page, errors } = T;
  const url = await page.evaluate(() => { const P = window.__pp, list = [['crawler', ['', 'side', 'raise', 'pinch']], ['leech', ['', 'cling', 'spit']], ['reeflantern', ['', 'bright', 'pulse']]], S = 150, cv = document.createElement('canvas'); cv.width = S * 4 * 2; cv.height = S * 3; const c = cv.getContext('2d');
    for (let half = 0; half < 2; half++) { c.fillStyle = half ? '#C8CCBC' : '#123C52'; c.fillRect(half * S * 4, 0, S * 4, S * 3); }
    list.forEach(([t, modes], row) => modes.forEach((md, i) => { for (let half = 0; half < 2; half++) { const s = P.DunArt.monSprite(t, 34, 0.3, P.MON[t].color, md, false), x = half * S * 4 + i * S + S / 2, y = row * S + S / 2; c.drawImage(s.cv, x - s.half, y - s.half, s.half * 2, s.half * 2); c.fillStyle = half ? '#2B2433' : '#FFFFFF'; c.font = '12px sans-serif'; c.textAlign = 'center'; c.fillText(t + (md ? ' · ' + md : ''), x, y + S * 0.45); } }));
    return cv.toDataURL('image/png'); });
  fs.writeFileSync(path.resolve(__dirname, '../shots/bel-b1-brood-sheet.png'), Buffer.from(url.split(',')[1], 'base64'));
  console.log('errors', errors.length); await T.browser.close();
})();
