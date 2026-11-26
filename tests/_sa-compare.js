// (v463 SA) Vaul (and Threnn) next to Rift 03's Oneira, studio portraits at the same scale (T px a tile), one picture.
// usage: HTML=test-sa.html OUT=shots/v463-SA/compare-<tag>.png node tests/_sa-compare.js   env: T (34), DPR (1)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-accelerated-2d-canvas'] });
  const p = await b.newPage({ viewport: { width: 600, height: 520 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/Threnn|Vaul|Oneira|GLM|SEP3|DUNE3/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sa.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  const url = await p.evaluate(([T, dpr]) => { window.__SEP_GL = 1; window.__SEP_GLHQ = 1; window.__DB_GL = 1; window.__DB_GLHQ = 1; window.__NG_GL = 1; const P = window.__pp, W = 1500, H = 560;
    const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#6E6A72'); g.addColorStop(1, '#3E3B44'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.font = '700 16px sans-serif'; c.fillStyle = '#FFFFFF';
    const mock = boss => { const D = P.FIEND_DEFS[boss], noop = () => {}, H2 = new Proxy({}, { get: (o, k) => k === 'sfx' ? new Proxy({}, { get: () => noop }) : k === 'mons' ? [] : noop }), me = { x: 0, y: 6, r: 0.4, face: 1 }, m = { x: 0, y: 0, act: boss === 'threnn' ? 'drift' : 'stalk', actT: 0, t: 0, hp: 1, maxhp: 1, dmg: 10, hitSq: 0, flash: 0, stunT: 0 };
      const FX = { mem: {}, m, me, C: { x: 0, y: 0, R: 15 }, S: { lv: 1, tele: [], hz: [], weak: {}, fast: 1, enterT: 9, props: [] }, H: H2, K: { lerpA: (a, b2, u) => { let d = b2 - a; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return a + d * u; } }, tele: o => Object.assign({ age: 0 }, o), hz: o => Object.assign({ age: 0 }, o), obj: o => Object.assign({ hp: 1, maxhp: 1 }, o), weak: noop, parts: noop, minion: noop, hurt: noop, noParts: noop, inShape: () => false, rnd: (a, b2) => a + Math.random() * (b2 - a), sx: v => v, sy: v => v, clampArena: q => q, inArena: () => true, dist: (x, y) => Math.hypot(me.x - x, me.y - y), angPet: (x, y) => Math.atan2(me.y - y, me.x - x) };
      D.init(FX); for (let i = 0; i < 60; i++) { if (boss === 'vaul') Object.assign(FX.mem, { menace: 0.5, hd: 1.3 }); D.update(FX, 0.05); } return { D, FX, m }; };
    let x = 0; const col = 300, put = (name, fn) => { c.fillText(name, x + 10, 22); fn(x + col / 2); x += col; };
    put("Oneira (Rift 03)", cx => P.FIEND_DEFS.oneira.MODEL.studio(c, cx, H * 0.86, 0.9, { pet: [2, 7, 0.4], menace: 0.4 }, { T }));
    put("Thul-Ammon (Rift 03)", cx => P.FIEND_DEFS.thulammon.MODEL.studio(c, cx, H * 0.6, 0, { menace: 0.4 }, { T: T * 0.55 }));
    put("Threnn (Rift 04)", cx => { const o = mock('threnn'); o.D.MODEL.studio(c, cx, H * 0.75, o.FX, o.m, { T }); });
    put("Vaul (Rift 04)", cx => { const o = mock('vaul'); o.D.MODEL.studio(c, cx, H * 0.95, o.FX, o.m, { T }); });
    put("Vaul, close", cx => { const o = mock('vaul'); o.D.MODEL.studio(c, cx, H * 1.3, o.FX, o.m, { T: T * 1.7 }); });
    return cv.toDataURL('image/png'); }, [+(process.env.T || 34), +(process.env.DPR || 1)]);
  const out = path.resolve(__dirname, '..', process.env.OUT || 'shots/v463-SA/compare.png'); fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote', out, 'errors', errs.length, errs.slice(0, 3)); await b.close(); })();
