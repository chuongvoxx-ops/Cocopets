// v433 DS: the three lands' far views painted alone (no stage, no haze, no HUD): each land at camera heights from the jaw/sky to
// the deep desert, the same view panned along x, and the GPU light on (GL=0: off). Writes shots/v433-DS/studio-<land>.png
const L = require('./_ds-lib'); const fs = require('fs'), path = require('path');
(async () => {
  const T = await L.open({ dpr: +(process.env.DPR || 1) });
  try { const lands = (process.env.LANDS || 'dunes,mesa,nightdune').split(',');
    for (const land of lands) {
      const url = await T.M(async ([land, gl, dpr]) => { if (gl) window.__NG_GL = 1; const S = window.DUNE_SKY, W = 390, H = 844, Tt = 40, k = dpr, cols = [[-30, 48], [-17, 24], [-6, 0], [2, 0], [14, 0], [-6, 36]], out = document.createElement('canvas'); out.width = (W + 8) * cols.length * k; out.height = H * k; const oc = out.getContext('2d');
        for (let i = 0; i < cols.length; i++) { const [cy, cx] = cols[i], cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k; const c = cv.getContext('2d'); c.setTransform(k, 0, 0, k, 0, 0);
          const V = { W, H, T: Tt, sx: x => (x - cx) * Tt + W / 2, sy: y => (y - cy) * Tt + H / 2, t: 12.5, land, light: S.LANDS[land].light, hy: 0, span: 28, k };
          for (let f = 0; f < 2; f++) { c.clearRect(0, 0, W, H); S.vista(c, V, { gpu: !!gl }); }   // (twice: the pieces painted on the first pass are all there on the second)
          oc.drawImage(cv, i * (W + 8) * k, 0); }
        return out.toDataURL('image/png'); }, [land, process.env.GL !== '0', +(process.env.DPR || 1)]);
      const d = path.resolve(__dirname, '..', 'shots', 'v433-DS'); fs.mkdirSync(d, { recursive: true }); fs.writeFileSync(path.join(d, `studio-${land}${process.env.GL === '0' ? '-nogl' : ''}.png`), Buffer.from(url.split(',')[1], 'base64')); }
    console.log('stats', JSON.stringify(await T.M(() => window.DUNE_SKY.stats)));
    console.log('errors', JSON.stringify(T.errors.slice(0, 5)));
  } finally { await T.browser.close(); }
})();
