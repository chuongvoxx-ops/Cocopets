// the Tower's dragons on one sheet: the five kinds at rest, then the Inferno Dragon's poses. env HTML for an older build
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html')); await p.waitForFunction(() => window.__pp); await p.waitForTimeout(400);
  await p.evaluate(() => { const P = window.__pp, cv = document.createElement('canvas'); cv.width = 1500; cv.height = 900; Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(cv); const c = cv.getContext('2d');
    c.fillStyle = '#2A2440'; c.fillRect(0, 0, 1500, 900);
    const ids = ['dragon', 'frostdragon', 'bonedragon', 'stormdragon', 'venomdragon'], R = 62;
    const mk = (id, o) => { const B = P.BOSSES.find(x => x.id === id); return Object.assign({ bk: B, color: B.color, glow: B.glow, act: 'move', actT: 0, step: 1, phase: 1, flash: 0, x: 0, y: 0, r: B.r }, o || {}); };
    const draw = (m, X, Y, t, me) => { c.fillStyle = 'rgba(0,0,0,.25)'; c.beginPath(); c.ellipse(X, Y + R * 1.1, R * 1.3, R * 0.3, 0, 0, 6.283); c.fill(); P.DunBoss.draw(c, m, X, Y, R, t, me || { x: 5, y: 3 }, v => v, v => v, 40, false); };
    ids.forEach((id, i) => { draw(mk(id), 150 + i * 300, 210, 1.3 + i * 0.7); c.fillStyle = '#fff'; c.font = '16px sans-serif'; c.textAlign = 'center'; c.fillText(P.BOSSES.find(x => x.id === id).name, 150 + i * 300, 400); });
    const poses = [['breath, wind-up', { act: 'breath', actT: 0.6 }], ['breath', { act: 'breath', actT: 1.6, ba: 0.3 }], ['tail, wind-up', { act: 'tail', actT: 0.55 }], ['fireballs', { act: 'fireballs', actT: 0.3 }], ['hit, phase 2', { flash: 0.2, phase: 2 }], ['stunned', { act: 'stunned' }], ['asleep', { act: 'sleep' }]];
    poses.forEach(([n, o], i) => { const X = 110 + i * 212; draw(mk('dragon', o), X, 640, 2.1 + i * 0.37, i === 3 ? { x: -5, y: 2 } : null); c.fillStyle = '#fff'; c.font = '15px sans-serif'; c.textAlign = 'center'; c.fillText(n, X, 860); }); });
  await p.waitForTimeout(200); await p.screenshot({ path: path.resolve(__dirname, '../shots/' + (process.env.OUT || 'dragon-sheet') + '.png') }); console.log('errors', errs); await b.close(); })();
