// The six-star wing kinds through the stages (butterfly, dragonfly, angel and dragon for comparison) and the rings
// a Celestial floats over. usage: node tests/_wing-kinds.js [seed]   env: HTML, OUT
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const seed = +(process.argv[2] || 7), out = process.env.OUT || 'wingkinds';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1.5 });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  const info = await page.evaluate(([seed, KS]) => { const P = window.__pp; P.quickStart('Bot');
    const kinds = KS.split(','), stages = [1, 3, 5, 7], rows = [], log = [];
    kinds.forEach((w, ki) => { const g = P.summonGenome(6, P.mulberry32(seed + ki * 11)), line = P.evolveLine(g.form, 7, P.mulberry32((seed + ki * 11) * 7));
      const L0 = line[0].x.leg, L = Object.assign({}, L0, { w, v: L0.v == null ? 0.5 : L0.v, n7: L0.n7 || 4 });
      if (w === 'butterfly') { L.a = '#E9D8FF'; L.b = '#3B2266'; } if (w === 'dragonfly') { L.a = '#CFF4FF'; L.b = '#24304A'; }
      const cells = stages.map(sg => { const f = JSON.parse(JSON.stringify(line[sg - 1])); f.x.leg = L; P.legendStage(f, sg); log.push(w + sg + ':' + f.x.wings.n + ' pairs'); return P.petSVG(f, { static: true, frame: 'fit' }); });
      rows.push(`<div class="row"><b>${w}</b>${cells.map((c, i) => `<div class="cell"><small>stage ${stages[i]}</small>${c}</div>`).join('')}</div>`); });
    const rings = [['circle', ''], ['light', ''], ['metal', ''], ...['fire', 'ice', 'water', 'thunder', 'wind', 'earth', 'dark', 'light'].map(e => ['element', e])], cols = ['#FF7AD9', '#7AE8FF', '#FFE37A', '#B98CFF'];
    const rr = rings.map(([st, el], i) => `<div class="ring"><small>${st} ${el}</small><div class="tilt">${P.magicCircleSVG(cols[i % 4], 'outer', st, el)}<div class="in">${P.magicCircleSVG(cols[i % 4], 'inner', st, el)}</div></div></div>`).join('');
    document.body.innerHTML = `<style>body{background:#9FC27A;margin:0;font:12px sans-serif}.row{display:flex;align-items:center;gap:6px;padding:4px}.row b{width:70px}.cell{width:260px;height:240px;position:relative;background:#B8D88E;border-radius:8px;margin-bottom:40px}.cell svg{width:100%;height:100%;overflow:visible}.cell small,.ring small{position:absolute;left:6px;top:4px}.rings{display:flex;flex-wrap:wrap;gap:6px;padding:4px}.ring{position:relative;width:140px;height:120px;background:#5E7A44;border-radius:8px}.tilt{position:absolute;inset:14px 8px 8px;}.tilt svg{position:absolute;inset:0;width:100%;height:100%}.in{position:absolute;inset:0}</style>${rows.join('')}<div class="rings">${rr}</div>`;
    return log; }, [seed, process.env.KINDS || 'butterfly,dragonfly']);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, `../shots/${out}.png`), fullPage: true });
  console.log(info.join(' '), 'errors', errors);
  await browser.close();
})();
