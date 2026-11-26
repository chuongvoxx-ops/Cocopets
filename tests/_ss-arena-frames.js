// v463 SS: every pixel of a Sepulchre arena painted every frame. Before each draw of the game the whole canvas is filled with a
// marker colour (pure magenta); after it, the pixels still magenta are counted (none may be: a pixel the frame did not paint
// would show an earlier frame). From the first frame of play (the intro included), then the pet north and south of the arena.
// usage: HTML=... node tests/_ss-arena-frames.js   env: STAGES=3,6,10  GL=1|0  N (frames per phase, 6)  DPR (1)  OFF=1 (__SSKY 0)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const gl = process.env.GL !== '0', N = +(process.env.N || 6);
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'];
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: +(process.env.DPR || 1), hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(([gl, off]) => { if (gl) { window.__NG_GL = 1; window.__SEP_GL = 1; } else { window.__NG_GL = 0; window.__SEP_GL = 0; window.__DUN_GL = 0; } if (off) window.__SSKY = 0; }, [gl, process.env.OFF === '1']);
  await page.goto('file://' + path.resolve(process.env.HTML));
  await page.waitForFunction(() => window.__pp, null, { timeout: 300000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 40; P.st.unlockAll = true; P.st.dun.best = 120; });
  let bad = 0;
  try {
    for (const i of (process.env.STAGES || '3,6,10').split(',').map(Number)) {
      await page.evaluate(i => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; const w = document.getElementById('giftWrap'); if (w) w.hidden = true; P.riftState().prog.sepulchre = i; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('sepulchre', i); }, i);
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 1800000 });
      await page.evaluate(() => { const G = window.__pp.arc.game; window.__MK = []; if (G.__mk) return; G.__mk = 1; const d0 = G.draw;
        G.draw = function (c) { const cv = c.canvas; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.fillStyle = '#FF00FF'; c.fillRect(0, 0, cv.width, cv.height); c.restore();
          const r = d0.apply(this, arguments); try { const NM = window.NIDHOGG_MOVES; if (NM && NM.FGFX && NM.FGFX.frameEnd) NM.FGFX.frameEnd(); } catch (e) {}
          const s = 4, d = c.getImageData(0, 0, cv.width, cv.height).data; let n = 0, tot = 0, y0 = -1, y1 = -1; for (let y = 0; y < cv.height; y += s) for (let x = 0; x < cv.width; x += s) { const o = (y * cv.width + x) * 4; tot++; if (d[o] === 255 && d[o + 1] === 0 && d[o + 2] === 255) { n++; if (y0 < 0) y0 = y; y1 = y; } }
          window.__MK.push([+(n / tot).toFixed(4), y0, y1]); return r; }; });
      await page.evaluate(() => window.__pp.beginPlay());
      const frames = async n => page.evaluate(async n => { for (let k = 0; k < n; k++) await new Promise(r => requestAnimationFrame(() => r())); }, n);
      const take = async (name) => { const m = await page.evaluate(() => window.__MK.splice(0)); const worst = m.reduce((a, q) => (q[0] > a[0] ? q : a), [0, -1, -1]); if (worst[0] > 0) bad++; console.log(`stage ${i} ${name}: ${m.length} frames, worst unpainted ${(worst[0] * 100).toFixed(2)}% rows ${worst[1]}..${worst[2]}`); };
      await frames(N); await take('intro');
      await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000 }); await frames(N); await take('play');
      for (const [n, dx, dy] of [['north', 0, -10], ['south', 3, 9]]) { await page.evaluate(([dx, dy]) => { const D = window.__pp.arc.game._dbg, C = D.M.FC; D.me.x = C.x + dx; D.me.y = C.y + dy; D.me.hp = D.ST.hp; }, [dx, dy]); await frames(N); await take(n); }
      if (process.env.SHOT) await page.screenshot({ path: path.resolve(__dirname, '..', 'shots', 'v463-SS', `frames-s${i}-${gl ? 'gl' : '2d'}.png`) });
    }
    console.log(bad ? `FAIL ${bad} phase(s) left pixels unpainted` : 'ok   every pixel painted every frame'); console.log('errors', JSON.stringify(errors.slice(0, 3)));
  } finally { await browser.close(); }
})();
