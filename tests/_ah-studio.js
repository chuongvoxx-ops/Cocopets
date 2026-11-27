// (v470b AH) Ahuul's studio: each pose painted large by the fight's own draw (FIEND_DEFS.ahuul.draw, the art-sheet path), as the 2D
// drawing (window.__AUR_GL = 0) and as the GPU model (window.__AUR_GL = 1, forced on a software rasteriser), from one or two builds
// (HTMLS="before.html,after.html": the 2D from the last, the GPU from each), side by side; HEAD=1 adds a close-up of the head.
// -> OUT/studio-<pose>-<2d|gpu-N>.png and OUT/studio-sheet[-head].png
// usage: HTMLS=a.html[,b.html] OUT=shots/v470b-AH [POSES=perch,sweep,...] [T=24] [DPR=1] [LOD=0|1] [HEAD=1] node tests/_ah-studio.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs'), cp = require('child_process');
const OUT = path.resolve(process.env.OUT || path.resolve(__dirname, '../shots/v470b-AH')); fs.mkdirSync(OUT, { recursive: true });
const HTMLS = (process.env.HTMLS || process.env.HTML || 'test-ah.html').split(','), T = +(process.env.T || 24), dpr = +(process.env.DPR || 1), head = process.env.HEAD === '1', lod = process.env.LOD;
const ALL = { perch: { demo: 1 }, sweep: { demo: 1, demoSweep: 1 }, inhale: { demo: 1, demoInhale: 1 }, stun: { demo: 1, demoStun: 1 }, bow: { demo: 1, demoPose: 'bow' }, exhale: { demo: 1, demoPose: 'exhale' }, over: { demo: 1, demoPose: 'over' } };
const POSES = (process.env.POSES || 'perch,sweep,inhale,stun,bow,exhale,over').split(',');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const shots = {}; let errs = [];
  for (let hi = 0; hi < HTMLS.length; hi++) { const p = await b.newPage({ viewport: { width: 600, height: 520 } }); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/Ahuul|GLM|AUR3/.test(m.text())) errs.push('console: ' + m.text()); });
    await p.goto('file://' + path.resolve(HTMLS[hi])); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
    const last = hi === HTMLS.length - 1;
    for (const ps of POSES) { const t0 = Date.now();
      for (const zoom of head ? [0, 1] : [0]) {
        const r = await p.evaluate(([mem0, last, dpr, T, zoom, lod]) => { const P = window.__pp, D = P.FIEND_DEFS.ahuul, K = P.DunFiend.KIT; if (lod != null) window.__AH_LOD = +lod;
          const W = zoom ? 760 : 900, H = zoom ? 620 : 900, T2 = zoom ? T * 2.6 : T;
          const one = gl => { window.__AUR_GL = gl ? 1 : 0; window.__AUR_GLHQ = 1; window.__NG_GL = gl ? 1 : undefined; const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
            const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0E1D3A'); g.addColorStop(0.55, '#3D6286'); g.addColorStop(1, '#C9D8E2'); c.fillStyle = g; c.fillRect(0, 0, W, H);
            const mem = JSON.parse(JSON.stringify(mem0)); mem.bt = 1.3; const m = { x: 0, y: 0, r: D.r || 3, t: 1.3, dmg: 10, act: 'idle', hitSq: 0, flash: 0 };
            const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {}, started: false }, H: { part() {}, sparks() {}, shake() {}, sfx: {} }, me: { x: 0, y: 6 }, C: { x: 0, y: 8, R: 14 }, sx: v => v * T2, sy: v => v * T2, Tz: () => T2, rnd: (a, b) => a + Math.random() * (b - a) };
            let X = W * 0.55, Y = H * 0.86; if (zoom) { D.RIG.demoPose(FX, m); const h = mem.G.frs[2].c; X = W * 0.5 - h[0] * T2; Y = H * 0.55 - (h[1] - h[2]) * T2; }
            let err = null; try { D.draw(c, FX, m, X, Y, T2, 1.3); } catch (e) { err = e.message + ' ' + (e.stack || '').split('\n')[1]; }
            return { url: cv.toDataURL('image/png'), err }; };
          const out = { gl: one(true) }; if (last) out.d2 = one(false); window.__AUR_GL = undefined;
          let info = null; try { info = P.FIEND_DEFS.ahuul.MODEL && P.FIEND_DEFS.ahuul.MODEL.info ? P.FIEND_DEFS.ahuul.MODEL.info() : null; } catch (e) { info = String(e); } out.info = info; return out; }, [ALL[ps] || { demo: 1 }, last, dpr, T, zoom, lod]);
        const key = ps + (zoom ? '-head' : ''); shots[key] = shots[key] || [];
        if (r.d2) { if (r.d2.err) console.log(key, '2D ERROR', r.d2.err); const f = path.join(OUT, `studio-${key}-2d.png`); fs.writeFileSync(f, Buffer.from(r.d2.url.split(',')[1], 'base64')); shots[key].unshift(f + '=2D ' + key); }
        if (r.gl) { if (r.gl.err) console.log(key, 'GPU ERROR', r.gl.err); const f = path.join(OUT, `studio-${key}-gpu-${lod != null ? 'lod' + lod : hi}.png`); fs.writeFileSync(f, Buffer.from(r.gl.url.split(',')[1], 'base64')); shots[key].push(f + '=GPU ' + (HTMLS.length > 1 ? (hi ? 'after ' : 'before ') : '') + key); }
        if (r.info) console.log('  info', JSON.stringify(r.info)); }
      console.log(ps, ((Date.now() - t0) / 1000).toFixed(1) + ' s'); }
    await p.close(); }
  const cols = HTMLS.length + 1; for (const z of head ? ['', '-head'] : ['']) { const list = []; for (const ps of POSES) for (const f of shots[ps + z] || []) list.push(f);
    if (list.length) cp.execFileSync('python3', [path.join(__dirname, '_ah-sheet.py'), path.join(OUT, `studio-sheet${z}${lod != null ? '-lod' + lod : ''}.png`), String(cols), ...list], { stdio: 'inherit' }); }
  console.log('errors', errs.length, errs.slice(0, 4)); await b.close();
})();
