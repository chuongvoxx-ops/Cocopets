// (v474 LB) The Library of Unwritten Lives' three bosses (Syllax, Vellum, Nhalex): each art pose painted large by the fight's own draw,
// once as the 2D drawing (window.__AUR_GL = 0) and once as the GPU model (window.__AUR_GL = 1, forced on a software rasteriser).
// -> shots/v474-LB/studio-<boss>-<pose>-<d2|gl>.png and a sheet per boss.   usage: HTML=... node tests/_lb-studio.js [syllax vellum nhalex]
// env: DPR (1), MODE ('both' | '2d' | 'gl'), T (tile px, 30), OUT (folder), LOD (0 | 1: force a detail level), LOW=1 (Fewer effects), POSES=0,2
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT ? path.resolve(process.env.OUT) : path.resolve(__dirname, '../shots/v474-LB'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 600, height: 520 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (/Syllax|Vellum|Nhalex|GLM|LIB3/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(process.env.HTML)); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  if (process.env.LOW === '1') await p.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.lowFx = true; });
  if (process.env.LOD) await p.evaluate(l => { window.__LB_LOD = +l; }, process.env.LOD);
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['syllax', 'vellum', 'nhalex'], mode = process.env.MODE || 'both', dpr = +(process.env.DPR || 1), T = +(process.env.T || 30), tag = (process.env.LOW === '1' ? '-low' : '') + (process.env.LOD ? '-lod' + process.env.LOD : '');
  // the box (tiles wide, high), where the fight's point sits in it (share of the height), the backdrop
  const CF = { syllax: [16, 15, 0.72, '#1A1220', '#C9AE80', 1], vellum: [17, 13, 0.62, '#120C16', '#4A3424', 1], nhalex: [26, 24, 0.78, '#0C0A18', '#D8C8A0', 0.55] };
  const POSES = process.env.POSES ? process.env.POSES.split(',').map(Number) : null;
  for (const id of ids) { const n = await p.evaluate(id => (window.__pp.FIEND_DEFS[id].artPoses || []).length, id), urls = [];
    for (let i = 0; i < n; i++) { if (POSES && !POSES.includes(i)) continue; const t0 = Date.now();
      const r = await p.evaluate(([id, i, mode, dpr, T, CF]) => { const P = window.__pp, D = P.FIEND_DEFS[id], K = P.DunFiend.KIT, ps = D.artPoses[i], T2 = Math.round(T * CF[5]), W = T2 * CF[0], H = T2 * CF[1];
        const one = gl => { window.__AUR_GL = gl ? 1 : 0; window.__AUR_GLHQ = 1; window.__NG_GL = gl ? 1 : undefined; const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
          const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, CF[3]); g.addColorStop(1, CF[4]); c.fillStyle = g; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < H; y += T2) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
          const mem = JSON.parse(JSON.stringify(ps.mem || {})); mem.bt = mem.bt == null ? 1.3 : mem.bt; if (id === 'vellum') Object.assign(mem, Object.assign({ look: [0.1, 0.6], blink: [0, 0, 0], th: Math.PI / 2, wake: 1 }, mem)); const m = Object.assign({ x: 0, y: 0, r: D.r || 2.5, t: 1.3, dmg: 10, act: 'idle', hitSq: 0, flash: 0 }, ps.m || {});
          const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {}, started: false, enterT: 9 }, H: { part() {}, sparks() {}, shake() {}, sfx: {} }, me: { x: 1.5, y: 6, r: 0.5 }, C: { x: 0, y: id === 'nhalex' ? 13.6 : 0, R: 14 }, sx: v => v * T2, sy: v => v * T2, Tz: () => T2 };
          let err = null; try { D.draw(c, FX, m, W / 2, H * CF[2], T2, 1.3); } catch (e) { err = e.message + ' ' + (e.stack || '').split('\n')[1]; }
          c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText((gl ? 'GPU: ' : '2D: ') + ps.name, 10, 22); return { url: cv.toDataURL('image/png'), err }; };
        const out = {}; if (mode !== 'gl') out.d2 = one(false); if (mode !== '2d') out.gl = one(true); window.__AUR_GL = undefined; return out; }, [id, i, mode, dpr, T, CF[id]]);
      for (const k of ['d2', 'gl']) { if (!r[k]) continue; if (r[k].err) console.log(id, i, k, 'ERROR', r[k].err); const f = path.join(OUT, `studio-${id}-${i}-${k}${tag}.png`); fs.writeFileSync(f, Buffer.from(r[k].url.split(',')[1], 'base64')); urls.push(f + '=' + id + ' ' + i + ' ' + (k === 'd2' ? '2D' : 'GPU') + tag); }
      console.log(id, 'pose', i, ((Date.now() - t0) / 1000).toFixed(1) + ' s'); }
    if (urls.length > 1) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(OUT, `studio-${id}-sheet-${mode}${tag}.png`), ...urls], { stdio: 'inherit' });
    const st = await p.evaluate(id => { try { const MD = window.__pp.FIEND_DEFS[id].MODEL; return MD ? { info: MD.info ? MD.info() : null, kit: MD.kit ? MD.kit.stats().models.filter(q => q.built) : null } : null; } catch (e) { return String(e); } }, id); console.log(id, 'gl', JSON.stringify(st)); }
  console.log('errors', errs.length, errs.slice(0, 6)); await b.close();
})();
