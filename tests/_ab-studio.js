// (v470 AB) The Pale Aurora's three bosses (Thul, Nivora, Ahuul): each art pose painted large by the fight's own draw, once as the 2D
// drawing (window.__AUR_GL = 0) and once as the GPU model (window.__AUR_GL = 1, forced on a software rasteriser), side by side.
// -> shots/v470-AB/studio-<boss>-<pose>.png (2D | GPU) and a sheet per boss.   usage: HTML=... node tests/_ab-studio.js [thul nivora ahuul]
// env: DPR (1), MODE ('both' | '2d' | 'gl'), T (tile px, 30), OUT (folder)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT ? path.resolve(process.env.OUT) : path.resolve(__dirname, '../shots/v470-AB'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 600, height: 520 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (/Thul|Nivora|Ahuul|GLM|AUR3/.test(m.text())) errs.push('console: ' + m.text()); });
  await p.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-ab.html')); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 }); if (process.env.LOW === '1') await p.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.lowFx = true; setInterval(() => { const g = document.getElementById('giftWrap'); if (g) g.hidden = true; }, 200); });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['thul', 'nivora', 'ahuul'], mode = process.env.MODE || 'both', dpr = +(process.env.DPR || 1), T = +(process.env.T || 30);
  const BG = { thul: ['#0B1A33', '#3E5670'], nivora: ['#0B1A36', '#5A6478'], ahuul: ['#14284A', '#C9D8E2'] };
  for (const id of ids) { const n = await p.evaluate(id => (window.__pp.FIEND_DEFS[id].artPoses || []).length, id) + (id === 'nivora' ? 1 : 0), urls = [];   /* (v470c AB: Nivora also in the concept's 3/4 view) */
    for (let i = 0; i < n; i++) { const t0 = Date.now();
      const r = await p.evaluate(([id, i, mode, dpr, T, BG]) => { const P = window.__pp, D = P.FIEND_DEFS[id], K = P.DunFiend.KIT, ps = i < D.artPoses.length ? D.artPoses[i] : { name: 'the concept\'s view: rising, facing us', mem: { alt: 3.8, pitch: -0.2, hd: Math.PI / 2 + 0.35, beat: 0.3, unfold: 1, menace: 0.6 } }, T2 = id === 'ahuul' ? Math.round(T * 0.62) : T, W = T2 * (id === 'ahuul' ? 34 : 15), H = T2 * (id === 'ahuul' ? 27 : 16);
        const one = gl => { window.__AUR_GL = gl ? 1 : 0; window.__AUR_GLHQ = 1; window.__NG_GL = gl ? 1 : undefined; const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
          const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, BG[0]); g.addColorStop(1, BG[1]); c.fillStyle = g; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < H; y += T) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
          const mem = JSON.parse(JSON.stringify(ps.mem || {})); mem.bt = mem.bt == null ? 1.3 : mem.bt; const m = Object.assign({ x: 0, y: 0, r: D.r || 2.5, t: 1.3, dmg: 10, act: 'idle', hitSq: 0, flash: 0 }, ps.m || {});
          const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {}, started: false }, H: { part() {}, sparks() {}, shake() {}, sfx: {} }, me: { x: 0, y: 6 }, C: { x: 0, y: id === 'ahuul' ? 8 : 0, R: 14 }, sx: v => v * T2, sy: v => v * T2, Tz: () => T2, rnd: (a, b) => a + Math.random() * (b - a) };
          let err = null; try { D.draw(c, FX, m, W / 2, H * (id === 'ahuul' ? 0.86 : 0.72), T2, 1.3); } catch (e) { err = e.message; }
          c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText((gl ? 'GPU: ' : '2D: ') + ps.name, 10, 22); return { url: cv.toDataURL('image/png'), err }; };
        const out = {}; if (mode !== 'gl') out.d2 = one(false); if (mode !== '2d') out.gl = one(true); window.__AUR_GL = undefined; return out; }, [id, i, mode, dpr, T, BG[id]]);
      for (const k of ['d2', 'gl']) { if (!r[k]) continue; if (r[k].err) console.log(id, i, k, 'ERROR', r[k].err); const f = path.join(OUT, `studio-${id}-${i}-${k}.png`); fs.writeFileSync(f, Buffer.from(r[k].url.split(',')[1], 'base64')); urls.push(f + '=' + id + ' ' + i + ' ' + (k === 'd2' ? '2D' : 'GPU')); }
      console.log(id, 'pose', i, ((Date.now() - t0) / 1000).toFixed(1) + ' s'); }
    if (urls.length > 1) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(OUT, `studio-${id}-sheet-${mode}.png`), ...urls], { stdio: 'inherit' }); }
  const st = await p.evaluate(ids => { try { const MD = window.__pp.FIEND_DEFS[ids[ids.length - 1]].MODEL; return MD && MD.kit ? MD.kit.stats().last : null; } catch (e) { return String(e); } }, ids); console.log('gl', JSON.stringify(st));
  console.log('errors', errs.length, errs.slice(0, 4)); await b.close();
})();
