// (v451 TM, v454 TM2, v457 TM4) Tiamat's studio sheets: the lightning dragon on GLM (forced on the software rasteriser), at DPR 1 (DPR=3 for
// the phone's). NOGL=1: the painted fallback from the same poses.
//   default: a turnaround of its swimming pose (on a dark floor and on a pale one), then poses of the flight (v457 TM4: the model's path
//            mode, from a cast's own flight plan): forming, swimming, banking in a turn, a bolt's snap (head dipped, jaws open, the charge
//            in the jaws), the climb's corkscrew, the apex, the plunge
//   TWIRL=1: the side-view strip of the twirl and the plunge (the climb, the corkscrew rolling down the body, over the top, head first
//            down to the aim), with the course drawn faintly behind it
// usage: HTML=test-tm.html [DPR=1] [NOGL=1] [TWIRL=1] node tests/_tm-studio.js [out.png]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const dpr = +(process.env.DPR || 1), nogl = process.env.NOGL === '1', twirl = process.env.TWIRL === '1', SD = process.env.SHOTDIR || 'v457-TM4';
  const out = process.argv[2] || path.resolve(path.isAbsolute(SD) ? SD : path.resolve(__dirname, '../shots/' + SD), (twirl ? 'studio-twirl' : 'studio') + (nogl ? '-2d' : '') + '-dpr' + dpr + '.png');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
  const VW = twirl ? 1500 : 1200, VH = twirl ? 560 : 1200;
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: dpr });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Tiamat|GLM/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.__NG_GL = 1; window.__TM_GL = 1; window.__TM_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 });
  const info = await page.evaluate(([dpr, nogl, twirl, VW, VH]) => {
    const G = self.TIAMAT_GL; G.init(); const cv = document.createElement('canvas'); cv.width = VW * dpr; cv.height = VH * dpr; cv.style.cssText = `position:fixed;left:0;top:0;width:${VW}px;height:${VH}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0d1022'; c.fillRect(0, 0, VW, VH);
    const lib = window.__pp.ELEM_IMPL.thunder.ult.tiamat.lib, TU = lib.TUNE;
    const form = t => Math.max(0, Math.min(1.5, (t - TU.form0) / (TU.form1 - TU.form0) * 1.5));
    const charge = t => { if (t >= TU.tw0) return t < TU.tw1 - 0.1 ? 0.02 + 1.03 * Math.min(1, Math.max(0, (t - TU.tw0 - 0.05) / (TU.tw1 - 0.15 - TU.tw0))) : 1.15; for (const tb of S.tB) if (t >= tb - 0.32 && t < tb) return 0.02 + 1.03 * (t - tb + 0.32) / 0.32; return 0; };
    // a cast's flight plan: the aim at the origin, the pet 3 tiles to its left, a phone's view round the pet
    const tB = [1.6, 1.89, 2.18, 2.47, 2.76, 3.04, 3.33, 3.62, 3.91, 4.2];
    const S = lib.plan({ T: { x: 0, y: 0 }, me: { x: -3, y: 0.5 }, view: { gx: -2.2, gy: 0.5, hw: 4.5, hh: 9.3 }, tB, foes: [[0.4, 0.3], [-1.5, 1.2], [1.6, -1.1], [-0.4, 2.6]] });
    let ok = 0; const drawP = (P, X0, Y0, k, o) => { const A = G.pose(P); const oo = Object.assign({ X0, Y0, k, t: 3, glow: 1 }, o || {}); if (!nogl && G.draw(c, oo)) ok++; else G.draw2D(c, oo); return A; };
    const label = (s, x, y) => { c.fillStyle = '#9fb8ff'; c.font = '14px sans-serif'; c.fillText(s, x, y); };
    const flight = (t, cx, cy, k, extra) => { const P = lib.poseAt(S, t), p = S.path.at(S.lc(t)).p; drawP(P, cx - p[0] * k, cy - (p[1] - 0.9 * p[2]) * k, k, Object.assign({ form: form(t), charge: charge(t), glow: 1 + 0.6 * Math.min(1, charge(t)) + 0.35 * lib.snapOf(S.tB, t), jaw: P.jaw, clip: t > TU.tw1 }, extra || {})); };
    if (twirl) {   // the side view: the climb, the corkscrew, over the top, the plunge (the aim at each panel's foot; the course behind it)
      const ts = [4.4, 4.6, 4.8, 5.0, 5.15, 5.3, 5.45, 5.6, 5.72, 5.84], k = 36, pw = VW / ts.length;
      ts.forEach((t, j) => { const X0 = pw * (j + 0.5), Y0 = VH - 40; c.fillStyle = j % 2 ? '#11152b' : '#0f1327'; c.fillRect(pw * j, 0, pw, VH); c.fillStyle = '#272c4a'; c.fillRect(pw * j, Y0, pw, 40);
        c.strokeStyle = 'rgba(150,170,255,0.25)'; c.lineWidth = 1; c.beginPath(); for (let l = S.marks.lE - 6; l <= S.marks.lT; l += 0.1) { const p = S.path.at(l).p, x = X0 + p[0] * k, y = Y0 + (p[1] - 0.9 * p[2]) * k; if (l === S.marks.lE - 6) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
        const P = lib.poseAt(S, t); drawP(P, X0, Y0, k, { form: 2, charge: charge(t), glow: 1 + 0.6 * Math.min(1, charge(t)), jaw: P.jaw, clip: t > TU.tw1 }); label(t.toFixed(2) + ' s', pw * j + 8, 20); });
      label('climb  >  corkscrew (barrel roll down the body)  >  over the top  >  plunge, head first, onto the aim', 10, 40);
      return { ok, nv: G.nv, ntri: G.ntri, stats: G.STATS, marks: S.marks, zA: S.zA };
    }
    const cell = (i, j) => [40 + j * 380 + 190, 30 + i * 290 + 175];
    // rows 0..1: a turnaround of the swimming pose
    const swim = yaw => ({ k: 0.6, yaw, x: 0, y: 0, z: 0, neck: 0.5, head: -0.25, jaw: 0.25, pitch: 0.05, arch: 0, tail: 0.4, wave: 0.9, waveL: 0.2, waveF: 0.85, sail: 1, flut: 1, reach: 0.3, hind: 0.1, t: 1 });
    const views = [['swimming (profile, 3/4)', 0.4], ['side', 0], ['back 3/4', -Math.PI / 2 + 0.6], ['on a pale floor', 0.4], ['front 3/4', Math.PI / 2 - 0.5], ['other side', Math.PI]];
    views.forEach(([nm, yaw], j) => { const [X0, Y0] = cell(Math.floor(j / 3), j % 3); if (j === 3) { c.fillStyle = '#7d8aa6'; c.fillRect(X0 - 190, Y0 - 175, 380, 290); }
      drawP(swim(yaw), X0, Y0, 34, { form: 2 }); label(nm, X0 - 180, Y0 - 155); });
    // rows 2..3: the flight (path mode)
    const seq = [['forming (path mode)', 0.95], ['swimming in a sweep', 2.3], ['banking in the bottom turn', 3.45], ['a bolt: head dips, jaws open', 3.33], ['the corkscrew climb', 4.85], ['the plunge, head first', 5.62]];
    seq.forEach(([nm, t], j) => { const [X0, Y0] = cell(2 + Math.floor(j / 3), j % 3); flight(t, X0, Y0 - 30, 30); label(nm + '  (' + t + ' s)', X0 - 180, Y0 - 155); });
    return { ok, nv: G.nv, ntri: G.ntri, stats: G.STATS, marks: S.marks };
  }, [dpr, nogl, twirl, VW, VH]);
  await page.screenshot({ path: out, clip: { x: 0, y: 0, width: VW, height: VH } });
  console.log(out, JSON.stringify(info), errors.slice(0, 5)); await browser.close();
})();
