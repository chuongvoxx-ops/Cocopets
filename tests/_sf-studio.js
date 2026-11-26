// v450 SF, v452 SF2 (the fire glowing off its skin: the move's FGFX aura laid over the model, aura: false for the bare model): Snake Flame's studio sheets: the serpent alone (GLM forced on the software rasteriser), a turnaround and poses per tier,
// and the painted 2D serpent for comparison. usage: HTML=<test html> node tests/_sf-studio.js   env: OUT (shots/v450-SF), DPR (2)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v452-SF2'); fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await browser.newPage({ viewport: { width: 1200, height: 760 }, deviceScaleFactor: +(process.env.DPR || 1) });
  const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (/Snake|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
  await page.addInitScript(() => { window.__SF_GL = 1; window.__SF_GLHQ = 1; window.__NG_GL = 1; });
  await page.goto('file://' + path.resolve(process.env.HTML)); await page.waitForFunction(() => window.__pp, null, { timeout: 120000 });
  const sheet = async (name, spec) => {
    const r = await page.evaluate(async spec => {
      const G = window.SNAKEFLAME_GL, cv = document.createElement('canvas'), W = 1200, Hh = 760, dpr = window.devicePixelRatio || 1; cv.width = W * dpr; cv.height = Hh * dpr; cv.style.cssText = 'position:fixed;left:0;top:0;width:1200px;height:760px;z-index:99999'; document.body.appendChild(cv);
      const c = cv.getContext('2d'); c.scale(dpr, dpr); const gr = c.createLinearGradient(0, 0, 0, Hh); gr.addColorStop(0, '#2A2228'); gr.addColorStop(1, '#141014'); c.fillStyle = gr; c.fillRect(0, 0, W, Hh);
      c.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < W; x += 40) c.fillRect(x, 0, 1, Hh); for (let y = 0; y < Hh; y += 22) c.fillRect(0, y, W, 1);
      const out = [];
      for (const s of spec) { const LB = s.LB || 15.84, RM = s.RM || 0.7, fpt = new Function('d', 'LB', 'RM', 'return ' + s.pt), P = { k: s.k || 0, RM, LB, t: s.t || 1.3, glow: s.glow == null ? 1 : s.glow, glow2: s.glow2 || 0, spill: s.spill || 0, shrink: s.shrink == null ? 1 : s.shrink, jaw: s.jaw == null ? 0.2 : s.jaw, pitch: s.pitch == null ? 0.15 : s.pitch, fin: 1,
          pt: d => fpt(d, LB, RM) };
        const t0 = performance.now(); const r = G.studio(c, s.x, s.y, P, { T: s.T || 30, d2: !!s.d2, key: 'studio' + (s.k || 0) + '-' + LB }); let au = false;
        if (s.aura !== false && !s.d2) { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (F && F.usable()) { const Q = F.begin(c, null); window.__pp.ELEM_IMPL.fire.ult.snakeflame.aura(Q, { X0: s.x, Y0: s.y, k: s.T || 30 }, r.R, s.T || 30, { glow: P.glow, al: 1 - P.spill, SL: LB / G.NSL, low: false }); F.flush(c); au = true; } }
        out.push({ gl: r.gl, aura: au, ms: Math.round(performance.now() - t0) });
        c.fillStyle = '#DDD'; c.font = '13px sans-serif'; c.fillText(s.label || '', s.x - 60, s.y + (s.T || 30) * 2.2); }
      return out; }, spec);
    await page.screenshot({ path: path.join(OUT, name + '.png') }); await page.evaluate(() => { document.querySelectorAll('canvas[style*="99999"]').forEach(e => e.remove()); }); console.log(name, JSON.stringify(r));
  };
  // spines: d tiles behind the head; LB the length; relative to the drawing point (the coil's centre)
  const straight = `[2.5 - d * 0.95, 0.35 * Math.sin(d * 0.5), (d < 2.2 ? 0.9 * Math.pow(1 - d / 2.2, 2) : 0) + RM * (d < LB * 0.12 ? 0.8 : 1) * Math.max(0.15, 1 - d / LB) * 0.92 + 0.05]`;
  const toward = `[0.3 * Math.sin(d * 0.6), 2.0 - d * 0.9, (d < 2.2 ? 1.0 * Math.pow(1 - d / 2.2, 2) : 0) + RM * Math.max(0.15, 1 - d / LB) * 0.92 + 0.05]`;
  const away = `[0.3 * Math.sin(d * 0.6), -2.0 + d * 0.9, (d < 2.2 ? 1.0 * Math.pow(1 - d / 2.2, 2) : 0) + RM * Math.max(0.15, 1 - d / LB) * 0.92 + 0.05]`;
  const coil = `(() => { const a = -d / 2.6 + 0.4, r = 2.5 - d * 0.035; return [Math.cos(a) * r, Math.sin(a) * r, (d < 2.2 ? 1.0 * Math.pow(1 - d / 2.2, 2) : 0) + RM * Math.max(0.15, 1 - d / LB) * 0.92 + 0.05 + 0.15 * Math.sin(d)]; })()`;
  const L = [15.84, 18.22, 20.59], RMs = [0.7, 0.742, 0.784];
  const hside = `[-d * 0.95, 0.2 * Math.sin(d * 0.5), (d < 2.2 ? 0.9 * Math.pow(1 - d / 2.2, 2) : 0) + RM * Math.max(0.15, 1 - d / LB) * 0.92 + 0.05]`;
  await sheet('studio-turn', [
    { x: 240, y: 200, pt: straight, label: 'side (Base)', T: 34 }, { x: 760, y: 200, pt: toward, label: 'toward the camera', T: 34 },
    { x: 240, y: 560, pt: away, label: 'away', T: 34 }, { x: 800, y: 560, pt: coil, label: 'coiled', T: 34 } ]);
  await sheet('studio-glow', [
    { x: 260, y: 330, pt: coil, label: 'v450: the bare model (no aura)', T: 34, aura: false }, { x: 820, y: 330, pt: coil, label: 'v452: the fire off its skin', T: 34 },
    { x: 520, y: 640, pt: hside, label: 'the plunge (white heat, glow 2.6)', T: 30, glow: 2.6, jaw: 0.9 } ]);
  await sheet('studio-tiers', [
    { x: 200, y: 330, k: 0, LB: L[0], RM: RMs[0], pt: coil, label: 'Base', T: 30 }, { x: 600, y: 330, k: 1, LB: L[1], RM: RMs[1], pt: coil, label: 'Adept', T: 30 }, { x: 1000, y: 330, k: 2, LB: L[2], RM: RMs[2], pt: coil, label: 'Celestial', T: 30 } ]);
  await sheet('studio-poses', [
    { x: 520, y: 160, pt: hside, label: 'coiling (rest)', T: 34, jaw: 0.15 }, { x: 1060, y: 300, pt: hside, label: 'the last second', T: 34, glow: 2.6, jaw: 0.9, pitch: -0.1 },
    { x: 520, y: 480, pt: hside, label: 'collapse (white heat, dissolve)', T: 34, glow: 2.8, glow2: 0.8, spill: 0.45, shrink: 0.7 }, { x: 1060, y: 640, pt: hside, label: 'painted 2D fallback', T: 34, d2: true } ]);
  await sheet('studio-head', [
    { x: 380, y: 420, pt: hside, label: 'head (side)', T: 150, jaw: 0.5, aura: false }, { x: 980, y: 380, pt: toward, label: 'head (front)', T: 120, jaw: 0.35, k: 2 } ]);
  console.log('errors', JSON.stringify(errors.slice(0, 6))); await browser.close();
})();
