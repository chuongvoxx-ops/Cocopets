// (v463 SM) Rift 04's brood studio: every baked frame (type x mode x facing x two frames) beside the 2D art, on each land's floor
// colour, the hit flash, and the two mini bosses posed live (walk, their moves); with a check that no picture is cut at its sprite's
// edge. One page for all three lands (GLM's program is compiled once: minutes on the software rasteriser).
// usage: HTML=test-sm463.html node tests/_sm-sep-studio.js [lands sepulchre,twoages,borrowed] [dpr] [rpx]  -> shots/v463-SM/studio-<land>-d<dpr>.png
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const LANDS = (process.argv[2] || 'sepulchre,twoages,borrowed').split(','), DPR = +(process.argv[3] || 1), RPX = +(process.argv[4] || 46);
  const OUT = path.resolve(__dirname, '..', 'shots', 'v463-SM'); fs.mkdirSync(OUT, { recursive: true });
  const prof = process.env.PROFILE;   // (a kept browser profile: the compiled shader may be cached between runs)
  const args = ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'], exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const ctx = prof ? await chromium.launchPersistentContext(prof, { executablePath: exe, args, viewport: { width: 800, height: 600 }, deviceScaleFactor: DPR }) : null;
  const browser = ctx ? null : await chromium.launch({ executablePath: exe, args });
  const page = ctx ? await ctx.newPage() : await browser.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: DPR });
  const T0 = Date.now(); const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.text().startsWith('SBLOG')) console.log(((Date.now() - T0) / 1000).toFixed(0) + 's ' + m.text()); if ((m.type() === 'warning' || m.type() === 'error') && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text().slice(0, 600)); });
  await page.addInitScript(() => { window.__SB_GL = 1; window.__SB_GLHQ = 1; });
  const lg = s => console.log(((Date.now() - T0) / 1000).toFixed(0) + 's ' + s);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-sm463.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  lg('compile ' + JSON.stringify(await page.evaluate(() => { const S = window.SEP_BROOD, { DunArt, MON } = S.env(); const t = performance.now(); DunArt.monSprite('tombmole', 20, 0.125, MON.tombmole.color, '', false); return Math.round(performance.now() - t); })));
  for (const LAND of LANDS) {
    await page.evaluate(([LAND, RPX]) => { const S = window.SEP_BROOD, { DunArt, BIOMES } = S.env(), B = BIOMES[LAND], cv = document.createElement('canvas'); cv.width = 1600; cv.height = 1640; const c = cv.getContext('2d');
      c.fillStyle = B.floor[0]; c.fillRect(0, 0, cv.width, cv.height); for (let y = 0; y < cv.height; y += 48) for (let x = (y / 48 % 2) * 48; x < cv.width; x += 96) { c.fillStyle = B.floor[1]; c.fillRect(x, y, 48, 48); }
      c.font = 'bold 13px sans-serif'; window.__ST = { cv, c, y: 20, cut: {}, ms: {} }; DunArt.monCache.clear(); }, [LAND, RPX]);
    const types = await page.evaluate(() => window.SEP_BROOD.TYPES);
    for (const t of types) {
      const r = await page.evaluate(([t, LAND, RPX]) => { const S = window.SEP_BROOD, { DunArt, MON } = S.env(), Z = window.__ST, c = Z.c, D = S.DEF[t], col = MON[t].color, rp = t === 'icecrystal' ? RPX * 1.5 : RPX, cell = Math.round(rp * (t === 'icecrystal' ? 3.6 : 3.0)), y = Z.y + cell * (t === 'icecrystal' ? 0.62 : 0.5);
        const cutOf = s => { const g = s.cv.getContext('2d'), w = s.cv.width, h = s.cv.height, e = [g.getImageData(0, 0, w, 1), g.getImageData(0, h - 1, w, 1), g.getImageData(0, 0, 1, h), g.getImageData(w - 1, 0, 1, h)]; let mx = 0; for (const d of e) for (let i = 3; i < d.data.length; i += 4) mx = Math.max(mx, d.data[i]); return mx; };
        const draw = (s, x) => { c.drawImage(s.cv, x - s.half, y - s.half); };
        let x = 70; window.__SB_GL = 0; S.bio = LAND; const s2 = DunArt.monSprite(t, rp, 0.5 / D.nf, col, '', false); draw(s2, x); c.fillStyle = '#fff'; c.fillText(t + ' (2D)', 6, Z.y + 14);
        DunArt.monCache.clear(); window.__SB_GL = 1; S.bio = LAND; x += cell * 0.95; let n = 0, cut = 0; const t0 = performance.now();
        for (const md of D.modes) for (const lf of D.faced ? [false, true] : [false]) for (const f of D.nf > 1 ? [0, Math.floor(D.nf / 2)] : [0]) { if (x > 1560) break;
          const tb = performance.now(), s = DunArt.monSprite(t, rp, (f + 0.5) / D.nf, col, lf ? md + '<' : md, false); n++; console.log('SBLOG ' + t + ' ' + md + (lf ? '<' : '') + ' ' + f + ' ' + Math.round(performance.now() - tb) + 'ms'); cut = Math.max(cut, cutOf(s)); draw(s, x); c.fillStyle = '#fff'; c.fillText((md || 'idle') + (lf ? ' L' : '') + ' ' + f, x - 26, Z.y + 14); x += cell * 0.78; }
        if (x < 1560) { const fl = DunArt.monSprite(t, rp, 0.5 / D.nf, col, '', true); draw(fl, x); c.fillText('flash', x - 16, Z.y + 14); }
        Z.y += cell; return { n, msPerFrame: Math.round((performance.now() - t0) / n), cutAlpha: cut, half: s2.half }; }, [t, LAND, RPX]);
      lg(LAND + ' ' + t + ' ' + JSON.stringify(r));
    }
    // the minis, posed live (v469 MB: they are giant evil Cocopets now, drawn by EVIL_MINI: no GLM minis to pose here)
    if (!(await page.evaluate(() => !!window.SEP_BROOD.drawMini))) { lg(LAND + ' minis: EVIL_MINI (see the in-game shots)'); continue; }
    const mr = await page.evaluate(([LAND, RPX]) => { const S = window.SEP_BROOD, Z = window.__ST, c = Z.c, out = {}; S.bio = LAND; const r = RPX * 0.9 * 1.3; let y = Z.y + r * 2.4;
      const poses = { hourpet: [['move', 0, 1], ['stop', 0.5, 0], ['tick', 0.7, 0], ['move', 0, 1, 2.4]], kennelpet: [['move', 0, 1], ['lunge', 0.6, 0], ['lunge', 1.0, 0], ['call', 0.5, 0, -0.5]] };
      for (const id of ['hourpet', 'kennelpet']) { let x = 120; const t0 = performance.now();
        for (const [act, T, mvk, yaw] of poses[id]) { const m = { bk: { id }, x: 0, y: 0, act, actT: T, _sbMv: mvk, _sbW: 1.1, _sbYaw: yaw == null ? 0.45 : yaw, _sbx: 0, _sby: 0, r: 1.3, flash: 0, ca: 0.3 };
          const ok = S.drawMini(c, m, x, y, r, 1.0, { x: 3, y: 1 }); c.fillStyle = '#fff'; c.fillText(id + ' ' + act + (ok ? '' : ' (2D!)'), x - 50, y - r * 2.9); x += r * 3.2; }
        out[id] = Math.round((performance.now() - t0) / 4); y += r * 3.4; }
      return { url: Z.cv.toDataURL('image/png'), out, mem: S.mem() }; }, [LAND, RPX]);
    fs.writeFileSync(path.join(OUT, `studio-${LAND}-d${DPR}.png`), Buffer.from(mr.url.split(',')[1], 'base64'));
    lg(LAND + ' minis ms ' + JSON.stringify(mr.out) + ' mem ' + JSON.stringify(mr.mem));
  }
  lg('stats ' + JSON.stringify(await page.evaluate(() => { const s = window.SEP_BROOD.stats; return { models: s.models.map(m => m.name + ':' + m.tris + 't/' + m.meshMs + 'ms'), baked: s.baked }; })));
  lg('errors ' + JSON.stringify(errors.slice(0, 6)));
  if (ctx) await ctx.close(); else await browser.close();
})();
