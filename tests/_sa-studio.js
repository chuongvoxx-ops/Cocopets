// (v463 SA) Threnn and Vaul: studio portraits of the GPU models (no game running: the fight's own init and update run on a stand-in
// FX, so the 2D posing drives the model exactly as in the fight), over a plain floor. -> shots/v463-SA/studio-<boss>-*.png and a sheet.
// usage: HTML=test-sa.html BOSS=threnn|vaul node tests/_sa-studio.js   env: DPR (1), ONLY (a pose name)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = path.resolve(__dirname, '../shots/v463-SA'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-accelerated-2d-canvas'] });
  const p = await b.newPage({ viewport: { width: 600, height: 520 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (/Threnn|Vaul|GLM|SEP3/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sa.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  const dpr = +(process.env.DPR || 1), W = 560, H = 480;
  for (const boss of (process.env.BOSS || 'threnn,vaul').split(',')) {
    const POSES = boss === 'threnn'
      ? [['idle', { t: 3 }], ['menace', { t: 3, mem: { menace: 1, fz: 1, fzK: 1, fzOn: true, fzAim: 2.4, hd: 0.9 } }], ['open', { t: 3, mem: { open: 1, expose: 0 } }], ['held', { t: 3, mem: { menace: 0.7, bm: { launched: true, released: false }, sand: 0.45 } }], ['rush', { t: 3, mem: { uncoil: 1, rushA: 0.3, hd: 0.3 } }], ['slump', { t: 3, stun: true }], ['close', { t: 3, T: 70, mem: { menace: 0.6, fz: 0, fzK: 1, fzOn: true, fzAim: 1.0 } }]]
      : [['idle', { t: 3 }], ['flare', { t: 3, mem: { menace: 1, flare: 1, spR: 4.6, hd: 1.2, rear: 1 } }], ['turned', { t: 3, mem: { hd: 0.5, spR: 3.2 } }], ['slump', { t: 3, mem: { slump: 1, alt: 1.3 } }], ['close', { t: 3, T: 60, mem: { menace: 0.5, hd: 1.4 } }], ['loom', { loom: 1, T: 60 }]];
    const urls = [];
    for (const [name, s] of POSES) { if (process.env.ONLY && name !== process.env.ONLY) continue; const t0 = Date.now();
      const url = await p.evaluate(([boss, s, W, H, dpr]) => { window.__SEP_GL = 1; window.__SEP_GLHQ = 1; window.__NG_GL = 1; const P = window.__pp, D = P.FIEND_DEFS[boss], MD = D.MODEL;
        const noop = () => {}, H2 = new Proxy({}, { get: (o, k) => k === 'sfx' ? new Proxy({}, { get: () => noop }) : k === 'mons' ? [] : noop });
        const me = { x: 0, y: 6, r: 0.4, face: 1 }, m = { x: 0, y: 0, act: 'drift', actT: 0, t: 0, hp: 1, maxhp: 1, dmg: 10, hitSq: 0, flash: 0, stunT: 0 };
        const FX = { mem: {}, m, me, C: { x: 0, y: 0, R: boss === 'threnn' ? 13 : 15 }, S: { lv: 1, tele: [], hz: [], weak: {}, fast: 1, enterT: 9, props: [] }, H: H2, K: { lerpA: (a, b2, u) => { let d = b2 - a; while (d > Math.PI) d -= 6.2832; while (d < -Math.PI) d += 6.2832; return a + d * u; } },
          tele: o => Object.assign({ age: 0 }, o), hz: o => Object.assign({ age: 0 }, o), obj: o => Object.assign({ hp: 1, maxhp: 1 }, o), weak: noop, parts: noop, minion: noop, hurt: noop, noParts: noop, inShape: () => false, rnd: (a, b2) => a + Math.random() * (b2 - a), sx: v => v, sy: v => v,
          clampArena: q => q, inArena: () => true, dist: (x, y) => Math.hypot(me.x - x, me.y - y), angPet: (x, y) => Math.atan2(me.y - y, me.x - x) };
        D.init(FX); m.act = boss === 'threnn' ? 'drift' : 'stalk';
        const M = FX.mem; for (let i = 0; i < Math.round((s.t || 3) / 0.05); i++) { Object.assign(M, s.mem || {}); if (s.stun) m.stunT = 2; D.update(FX, 0.05); }
        const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
        const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, boss === 'threnn' ? '#1E2534' : '#E8E1D2'); g.addColorStop(1, boss === 'threnn' ? '#0E121B' : '#CFC5AE'); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.strokeStyle = boss === 'threnn' ? 'rgba(178,150,93,.25)' : 'rgba(150,130,100,.25)'; for (let y = 0; y < H; y += 40) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
        const T = s.T || (boss === 'threnn' ? 46 : 30); let R;
        if (s.loom) R = MD.studioLoom(c, W * 0.5, H * 0.85, T, true, 2); else R = MD.studio(c, W * 0.5, H * (boss === 'threnn' ? (s.T ? 0.85 : 0.7) : (s.T ? 1.55 : 1.2)), FX, m, { T });
        return R ? cv.toDataURL('image/png') : null; }, [boss, s, W, H, dpr]);
      console.log(boss, name, url ? 'ok' : 'NOT DRAWN', ((Date.now() - t0) / 1000).toFixed(1) + ' s');
      if (url) { const f = path.join(OUT, `studio-${boss}-${name}${dpr > 1 ? '-d' + dpr : ''}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); urls.push(f); } }
    const st = await p.evaluate(boss => window.__pp.FIEND_DEFS[boss].MODEL.__dbg.glStats, boss); console.log('gl', JSON.stringify(st));
    if (urls.length > 1) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(OUT, `studio-${boss}-sheet${dpr > 1 ? '-d' + dpr : ''}.png`), ...urls], { stdio: 'inherit' }); }
  console.log('errors', errs.length, errs.slice(0, 4)); await b.close();
})();
