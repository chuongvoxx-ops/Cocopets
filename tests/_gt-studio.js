// v423 GT: every garden trap picture (and its light layer) painted at a given sharpness on a garden-floor colour, in one image
// (shots/v423-GT/studio-P<P>.png), with each picture's paint time. P=96 HTML=test-gt.html node tests/_gt-studio.js
const L = require('./_gt-lib.js'), path = require('path'), fs = require('fs');
(async () => { const { browser, page, errors } = await L.open({ w: 1200, h: 900 }); const P = +(process.env.P || 96);
  const msgs = []; page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') msgs.push(m.text()); });
  const r = await page.evaluate(P => { const GT = self.GARDEN_TRAPS, cv = document.createElement('canvas'), list = []; for (const kd in GT.PICS) for (const [n, v] of GT.PICS[kd]) list.push([n, v]);
    const cols = 6, cw = P * 2.6, ch = P * 2.4; cv.width = cols * cw; cv.height = Math.ceil(list.length / cols) * ch; const c = cv.getContext('2d'); c.fillStyle = '#3A2449'; c.fillRect(0, 0, cv.width, cv.height);
    const times = []; list.forEach(([n, v], i) => { const t0 = performance.now(), s = GT.sprite(n, v, P), ms = performance.now() - t0; times.push([n + '|' + v, Math.round(ms), s ? s.cv.width + 'x' + s.cv.height : 'FAIL']);
      const x = (i % cols) * cw + cw / 2, y = Math.floor(i / cols) * ch + ch * 0.7; if (s) { c.save(); if (/g$/.test(n)) { c.fillStyle = '#000'; c.fillRect(x - cw / 2 + 2, y - ch * 0.7 + 2, cw - 4, ch - 4); c.globalCompositeOperation = 'lighter'; } c.drawImage(s.cv, x - s.ax, y - s.ay); c.restore(); }
      c.fillStyle = '#FFF'; c.font = '12px sans-serif'; c.fillText(n + ' ' + v + ' ' + Math.round(ms) + 'ms', x - cw / 2 + 4, y - ch * 0.7 + 14); });
    return { url: cv.toDataURL('image/png'), times }; }, P);
  const f = path.resolve(__dirname, '..', 'shots', 'v423-GT', `studio-P${P}.png`); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(r.url.split(',')[1], 'base64'));
  console.log(f); console.log(r.times.map(t => t.join(' ')).join('\n')); console.log('total ms', r.times.reduce((s, t) => s + t[1], 0)); if (msgs.length) console.log(msgs.slice(0, 5).join('\n')); console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close(); })();
