// (v450 MD, v455 MD2) Moby Dick's studio sheets, the spirit whale on GLM (forced on the software rasteriser):
//   side: the whole performance seen from the side (the studio's side view), a cell per beat, the water's surface a line (the model cut
//         at it, the part under it traced as its spine), the tail-slap's contact checked on the posed mesh (the flukes' lowest point);
//   model: the turnaround from the game's camera and two large renders (skin, shading, constellations, fins, flukes).
// usage: HTML=<test html> [DPR=1] [OUT=dir] node tests/_md-studio.js [side|model|both]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const dpr = +(process.env.DPR || 1), which = process.argv[2] || 'both', OUT = process.env.OUT || path.resolve(__dirname, '../shots/v455-MD2');
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1040 }, deviceScaleFactor: dpr });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Moby/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(() => { window.__NG_GL = 1; window.__MD_GL = 1; window.__MD_GLHQ = 1; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 30000 });
  const mk = dpr => { const cv = document.createElement('canvas'); cv.width = 1600 * dpr; cv.height = 1040 * dpr; cv.style.cssText = 'position:fixed;left:0;top:0;width:1600px;height:1040px;z-index:99999'; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.fillStyle = '#0b1026'; c.fillRect(0, 0, 1600, 1040); return c; };
  if (which !== 'model' && which !== 'tail') {
    const info = await page.evaluate(([dpr, mkS]) => {
      const mk = eval(mkS), c = mk(dpr), G = self.MOBY_GL; G.init(); const lib = window.__pp.ELEM_IMPL.water.ult.mobydick.lib, TU = lib.TUNE, GE = lib.geom();
      const YW = +(window.__MDYAW || -0.3), S = { path: { O: { x: 0, y: 0 }, hx: Math.cos(YW), hy: Math.sin(YW), yaw: YW }, O: { x: 0, y: 0 } };
      const beats = [['approach', 0.7], ['rising', 1.3], ['breach: forehead', TU.breach + 0.05], ['chest', TU.breach + 0.2], ['belly', TU.breach + 0.38], ['tail clears', TU.clear],
        ['arc', TU.clear + 0.18], ['apex', TU.apex], ['pitching down', TU.apex + 0.25], ['nose re-enters', TU.reenter + 0.03], ['body submerges', TU.reenter + 0.3], ['tail stands', TU.hold],
        ['anticipation', TU.whip], ['whip', TU.whip + 0.13], ['CONTACT (slap)', TU.slap], ['tail slides under', TU.slap + 0.3]];
      const cw = 400, ch = 260, k = 21, out = []; let ok = 0;
      beats.forEach(([nm, t], j) => { const ci = j % 4, ri = Math.floor(j / 4), x0 = ci * cw, y0 = ri * ch, X0 = x0 + 230 - GE.off * k * Math.cos(YW), Y0 = y0 + 180;
        c.save(); c.beginPath(); c.rect(x0 + 2, y0 + 2, cw - 4, ch - 4); c.clip(); c.fillStyle = '#0b1026'; c.fillRect(x0, y0, cw, ch); c.fillStyle = 'rgba(16,40,96,0.85)'; c.fillRect(x0, Y0, cw, ch);
        c.strokeStyle = 'rgba(120,220,255,0.8)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x0, Y0); c.lineTo(x0 + cw, Y0); c.stroke();
        // the aim (where the flukes strike), the breach and re-entry points
        c.fillStyle = '#ffcf6b'; c.fillRect(X0 + GE.off * k * Math.cos(YW) - 1, Y0 - 3, 3, 6); c.fillStyle = '#9fb8ff'; c.fillRect(X0 + GE.B[0] * k * Math.cos(YW) - 1, Y0 - 2, 2, 4); c.fillRect(X0 - 1, Y0 - 2, 2, 4);
        const P = lib.poseAt(S, t); if (P) { const A = G.pose(P);
          c.strokeStyle = 'rgba(120,170,255,0.45)'; c.lineWidth = 2; c.beginPath(); A.spine.forEach((sp, i) => { const X = X0 + sp.p[0] * k, Y = Y0 + (sp.p[1] * 0.12 - sp.p[2]) * k; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.stroke();
          if (G.draw(c, { X0, Y0, k, t: 2, clip: true, side: true, glow: 0.7, glow2: Math.abs(t - TU.slap) < 0.01 ? 0.6 : 0 })) ok++;
          const fl = G.flukeLow(); out.push([nm, +t.toFixed(3), +fl.z.toFixed(3)]); }
        c.restore(); c.fillStyle = '#cfe0ff'; c.font = '14px sans-serif'; c.fillText(nm + '  t ' + t.toFixed(2), x0 + 10, y0 + 20); });
      // the contact: the flukes' lowest point just before, at and after TUNE.slap
      const ct = [-0.06, -0.03, -0.01, 0, 0.02].map(d => { G.pose(lib.poseAt(S, TU.slap + d)); const fl = G.flukeLow(); return [d, +fl.z.toFixed(3), +(Math.hypot(fl.x, fl.y) * Math.sign(fl.x) - GE.off).toFixed(2)]; });
      return { ok, out, ct, piStar: GE.piStar, off: GE.off, contact: GE.contact };
    }, [dpr, mk.toString()]);
    await page.screenshot({ path: path.join(OUT, 'studio-side' + (dpr > 1 ? '-dpr' + dpr : '') + '.png'), clip: { x: 0, y: 0, width: 1600, height: 1040 } });
    console.log(JSON.stringify(info));
  }
  if (which === 'tail' || which === 'both') {   // (v455 MD2) the tail standing and the slap from the game's camera at several headings
    const info = await page.evaluate(([dpr, mkS]) => {
      const mk = eval(mkS), c = mk(dpr), G = self.MOBY_GL; G.init(); const lib = window.__pp.ELEM_IMPL.water.ult.mobydick.lib, TU = lib.TUNE, GE = lib.geom();
      const yaws = [0, -0.8, -1.57, 0.8, 1.57, 3.14 - 0.6], beats = [['tail stands', TU.hold + 0.1], ['anticipation', TU.whip], ['whip', TU.whip + 0.14], ['contact', TU.slap]]; let ok = 0;
      yaws.forEach((yw, i) => beats.forEach(([nm, t], j) => { const S = { path: { O: { x: 0, y: 0 }, hx: Math.cos(yw), hy: Math.sin(yw), yaw: yw }, O: { x: 0, y: 0 } }, X0 = 130 + i * 260 - Math.cos(yw) * GE.off * 14, Y0 = 200 + j * 240 - Math.sin(yw) * GE.off * 14;
        c.fillStyle = 'rgba(16,40,96,0.85)'; c.fillRect(i * 260 + 4, j * 240 + 4, 252, 232); const P = lib.poseAt(S, t); G.pose(P); if (G.draw(c, { X0, Y0, k: 14, t: 2, clip: true, glow: 0.7 })) ok++;
        c.fillStyle = '#ffcf6b'; c.fillRect(X0 + Math.cos(yw) * GE.off * 14 - 2, Y0 + Math.sin(yw) * GE.off * 14 - 2, 4, 4); c.fillStyle = '#cfe0ff'; c.font = '13px sans-serif'; c.fillText(nm + ' yaw ' + yw.toFixed(2), i * 260 + 10, j * 240 + 20); }));
      return { ok };
    }, [dpr, mk.toString()]);
    await page.screenshot({ path: path.join(OUT, 'studio-tail' + (dpr > 1 ? '-dpr' + dpr : '') + '.png'), clip: { x: 0, y: 0, width: 1600, height: 1000 } });
    console.log(JSON.stringify(info));
  }
  if (which !== 'side' && which !== 'tail') {
    const info = await page.evaluate(([dpr, mkS]) => {
      const mk = eval(mkS), c = mk(dpr), G = self.MOBY_GL; G.init(); document.querySelectorAll('canvas[style*="99999"]').forEach((e, i, L) => { if (i < L.length - 1) e.remove(); });
      const views = [['side', { yaw: 0 }], ['3/4', { yaw: -0.7 }], ['front', { yaw: Math.PI / 2 }], ['back 3/4', { yaw: Math.PI + 0.7 }], ['tail up (anticipation)', null], ['flukes spread', null]];
      const lib = window.__pp.ELEM_IMPL.water.ult.mobydick.lib, TU = lib.TUNE, S = { path: { O: { x: 0, y: 0 }, hx: 1, hy: 0, yaw: -0.25 }, O: { x: 0, y: 0 } };
      let ok = 0;
      views.forEach(([nm, o], j) => { const X0 = 140 + (j % 3) * 270, Y0 = 150 + Math.floor(j / 3) * 300; let P;
        if (o) P = Object.assign({ x: 0.6, y: 0, z: 1.2, fin: 0.7, jaw: 0.1 }, o); else { P = lib.poseAt(S, j === 4 ? TU.whip : TU.whip - 0.1); P = Object.assign({}, P, { x: P.x, z: P.z + 2.2 }); }
        G.pose(P); if (G.draw(c, { X0, Y0, k: 21, t: 2, glow: 0.6 })) ok++; c.fillStyle = '#9fb8ff'; c.font = '14px sans-serif'; c.fillText(nm, X0 - 120, Y0 - 120); });
      G.pose({ x: 0.6, y: 0, z: 1.2, fin: 0.75, jaw: 0.18, yaw: -0.35, roll: -0.25, fluke: 0.2 }); G.draw(c, { X0: 1180, Y0: 290, k: 70, t: 2, glow: 0.7 });
      G.pose({ x: 0.6, y: 0, z: 1.2, fin: 0.9, yaw: 0.3, pitch: 0.25, arch: -0.3, fluke: -0.25 }); G.draw(c, { X0: 1180, Y0: 760, k: 62, t: 2, glow: 0.7 });
      return { ok, nv: G.nv, ntri: G.ntri, stats: G.STATS };
    }, [dpr, mk.toString()]);
    await page.screenshot({ path: path.join(OUT, 'studio-model' + (dpr > 1 ? '-dpr' + dpr : '') + '.png'), clip: { x: 0, y: 0, width: 1600, height: 1040 } });
    console.log(JSON.stringify(info));
  }
  console.log(errors.length ? 'ERRORS ' + JSON.stringify(errors.slice(0, 5)) : 'no page errors'); await browser.close();
})();
