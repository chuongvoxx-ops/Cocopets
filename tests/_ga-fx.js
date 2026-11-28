// (v475 GA) Gabriel's FGFX kinds 690..699: compile check and a picture sheet (SwiftShader). usage: HTML=test-ga.html node tests/_ga-fx.js [out.png]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 900, height: 620 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/GFX|shader/i.test(m.text())) errs.push(m.text().slice(0, 600)); });
  await p.addInitScript(() => { window.__NG_GL = 1; });
  await p.goto('file://' + path.resolve(process.env.HTML || 'test-ga.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  const r = await p.evaluate(() => {
    const F = window.NIDHOGG_MOVES.FGFX, M = window.GABRIEL_MOVES; if (!F.usable()) return 'FGFX not usable';
    const cv = document.createElement('canvas'); cv.width = 900; cv.height = 620; Object.assign(cv.style, { position: 'fixed', left: 0, top: 0, zIndex: 99999 }); document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.fillStyle = '#2a2030'; c.fillRect(0, 0, 900, 620); c.fillStyle = '#6a6a60'; c.fillRect(0, 310, 900, 310);
    const Q = F.begin(c, null), X = M.FXP, t = 3;
    X.heart(Q, 60, 70, 45, 0, 0, 1, 1, 0); X.heart(Q, 160, 70, 45, 0, 1, 1.5, 1, 0); X.heart(Q, 260, 70, 45, 0, 0, 1, 1, 0.8); X.heart(Q, 340, 70, 20, 0.3, 0, 1, 1, 0);
    X.wave(Q, 520, 90, 90, 0.8, 0, 1, 0.1); X.wave(Q, 760, 90, 90, 0.9, 0.9, 1, 0.08);
    for (let s = 0; s < 4; s++) X.flower(Q, 60 + s * 90, 260, 36, 1, s, 1, 3 + s);
    X.thread(Q, 400, 180, 600, 260, 10, 1, t, 0.5, '#FF7AC0'); X.seal(Q, 760, 230, 110, 0.85, 0.3, 1);
    X.pillar(Q, 60, 600, 30, 260, 1, 0, 1); X.pillar(Q, 130, 600, 30, 260, 1, 0, 2); X.pillar(Q, 210, 600, 50, 260, 1, 1, 1);
    X.ground(Q, 420, 470, 160, 0.85, 1, 7); X.dome(Q, 700, 600, 140, 200, 1, 0, 1, 3); X.tree(Q, 300, 600, 160, 1, 1, 4); X.arch(Q, 560, 600, 90, 140, 1, 1);
    F.flush(c); return 'ok';
  });
  await p.screenshot({ path: process.argv[2] || 'shots/v475-GA/fx-kinds.png' }); console.log(r, JSON.stringify(errs.slice(0, 4))); await b.close(); })();
