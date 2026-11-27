// (v472 YB) The Yuggoth Engine's three bosses (Kh'aal, Ix-Vorra, Nyar'zhul): each art pose painted large by the fight's own draw, once as
// the 2D drawing (window.__AUR_GL = 0) and once as the GPU model (window.__AUR_GL = 1, forced on a software rasteriser), side by side.
// -> shots/v472-YB/studio-<boss>-<pose>-<d2|gl>.png and a sheet per boss.   usage: HTML=... node tests/_yb-studio.js [khaal ixvorra nyarzhul]
// env: DPR (1), MODE ('both' | '2d' | 'gl'), T (tile px, 30), OUT (folder), LOD (0 | 1: force a detail level), LOW=1 (Fewer effects)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const OUT = process.env.OUT ? path.resolve(process.env.OUT) : path.resolve(__dirname, '../shots/v472-YB'); fs.mkdirSync(OUT, { recursive: true });
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const p = await b.newPage({ viewport: { width: 600, height: 520 } }); const errs = []; p.on('pageerror', e => errs.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); p.on('console', m => { if (/Khaal|Ixvorra|Nyarzhul|GLM|YUG3/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  await p.goto('file://' + path.resolve(process.env.HTML)); await p.waitForFunction(() => window.__pp, null, { timeout: 300000 });
  if (process.env.LOW === '1') await p.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.lowFx = true; });
  if (process.env.LOD) await p.evaluate(l => { window.__YB_LOD = +l; }, process.env.LOD);
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['khaal', 'ixvorra', 'nyarzhul'], mode = process.env.MODE || 'both', dpr = +(process.env.DPR || 1), T = +(process.env.T || 30), tag = (process.env.LOW === '1' ? '-low' : '') + (process.env.LOD ? '-lod' + process.env.LOD : '');
  const BG = { khaal: ['#140C24', '#4A4E62'], ixvorra: ['#0A1418', '#2E4650'], nyarzhul: ['#120812', '#3A2430'] };
  const POSES = process.env.POSES ? process.env.POSES.split(',').map(Number) : null;
  for (const id of ids) { const n = await p.evaluate(id => (window.__pp.FIEND_DEFS[id].artPoses || []).length, id), urls = [];
    for (let i = 0; i < n; i++) { if (POSES && !POSES.includes(i)) continue; const t0 = Date.now();
      const r = await p.evaluate(([id, i, mode, dpr, T, BG]) => { const P = window.__pp, D = P.FIEND_DEFS[id], K = P.DunFiend.KIT, ps = D.artPoses[i], big = id === 'nyarzhul', T2 = big ? Math.round(T * 0.5) : T, W = T2 * (big ? 44 : 16), H = T2 * (big ? 26 : 15);
        const one = gl => { window.__AUR_GL = gl ? 1 : 0; window.__AUR_GLHQ = 1; window.__NG_GL = gl ? 1 : undefined; const cv = document.createElement('canvas'); cv.width = W * dpr; cv.height = H * dpr; const c = cv.getContext('2d'); c.scale(dpr, dpr);
          const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, BG[0]); g.addColorStop(1, BG[1]); c.fillStyle = g; c.fillRect(0, 0, W, H); c.strokeStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < H; y += T2) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
          const mem = JSON.parse(JSON.stringify(ps.mem || {})); mem.bt = mem.bt == null ? 1.3 : mem.bt; const m = Object.assign({ x: 0, y: 0, r: D.r || 2.5, t: 1.3, dmg: 10, act: 'idle', hitSq: 0, flash: 0 }, ps.m || {});
          const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {}, started: false, enterT: 9 }, H: { part() {}, sparks() {}, shake() {}, sfx: {} }, me: { x: 1.5, y: 6 }, C: { x: 0, y: big ? 15.3 : 0, R: 14 }, sx: v => v * T2, sy: v => v * T2, Tz: () => T2 };
          let err = null; try { D.draw(c, FX, m, W / 2, H * (big ? 0.94 : 0.7), T2, 1.3); } catch (e) { err = e.message + ' ' + (e.stack || '').split('\n')[1]; }
          c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText((gl ? 'GPU: ' : '2D: ') + ps.name, 10, 22); return { url: cv.toDataURL('image/png'), err }; };
        const out = {}; if (mode !== 'gl') out.d2 = one(false); if (mode !== '2d') out.gl = one(true); window.__AUR_GL = undefined; return out; }, [id, i, mode, dpr, T, BG[id]]);
      for (const k of ['d2', 'gl']) { if (!r[k]) continue; if (r[k].err) console.log(id, i, k, 'ERROR', r[k].err); const f = path.join(OUT, `studio-${id}-${i}-${k}${tag}.png`); fs.writeFileSync(f, Buffer.from(r[k].url.split(',')[1], 'base64')); urls.push(f + '=' + id + ' ' + i + ' ' + (k === 'd2' ? '2D' : 'GPU') + tag); }
      console.log(id, 'pose', i, ((Date.now() - t0) / 1000).toFixed(1) + ' s'); }
    if (urls.length > 1) require('child_process').execFileSync('python3', [path.join(__dirname, '_db-sheet.py'), path.join(OUT, `studio-${id}-sheet-${mode}${tag}.png`), ...urls], { stdio: 'inherit' });
    const st = await p.evaluate(id => { try { const MD = window.__pp.FIEND_DEFS[id].MODEL; return MD ? { info: MD.info ? MD.info() : null, kit: MD.kit ? MD.kit.stats().models.filter(q => q.built) : null } : null; } catch (e) { return String(e); } }, id); console.log(id, 'gl', JSON.stringify(st)); }
  console.log('errors', errs.length, errs.slice(0, 6)); await b.close();
})();
