// (v475 GM) Gabriel studio: renders the GPU model alone (forms, views, close-ups, poses, strips) on a dark rose backdrop.
// usage: HTML=<test html> node tests/_gm-studio.js [out.png] [modes,comma] [dpr]
//   modes: one, hero, forms, views, poses, heart (closed / open / split), oracle (close-up poses), head, wing, halo (the twelve petals),
//   enter, dissolve, spectral, flight, parts, compare (beside Raziel / Samael / Asmodeus / Abaddon at the same scale), nogl (the 2D model),
//   low. env: KT (form 1..3), FX=0 (no glow lights), HIDE (parts), W, H
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT0 = process.argv[2] || 'shots/v475-GM/studio.png', MODES = process.argv[3] || 'one', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const W = +(process.env.W || 1500), H = +(process.env.H || 900);
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 1500)); });
  await page.addInitScript(([kt, hide, fx, hq]) => { window.__KT = kt; window.__HIDE = hide ? hide.split(',') : null; window.__FX = fx; if (hq === '1') window.__GB_GLHQ = 1; }, [process.env.KT || '1', process.env.HIDE || '', process.env.FX || '1', process.env.HQ || '0']);
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-gm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  for (const MODE of MODES.split(',')) {
    const r = await page.evaluate(({ MODE, W, H, DPR }) => {
      const old = document.getElementById('gmcv'); if (old) old.remove();
      window.__GB_GL = 1; window.__NG_GL = 1; const G = window.GABRIEL_GL; if (MODE === 'low') { window.__pp.quickStart('Bot'); window.__pp.st.lowFx = true; }
      const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.id = 'gmcv'; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
      const c = cv.getContext('2d'); c.scale(DPR, DPR);
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0c18'); g.addColorStop(0.6, '#140a16'); g.addColorStop(1, '#0c070e'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      const t0 = performance.now(); const ok = G.ensure(); const tb = performance.now() - t0;
      const lab = (x, y, s) => { c.fillStyle = '#F0D8E4'; c.font = '600 14px serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
      const KT = +(window.__KT || 1), EV = [0, 1, 4, 7][KT], FX = window.__FX !== '0', F0 = G.FACE0;
      const S = (o, t) => Object.assign(G.idle(EV, t == null ? 1.3 : t), o || {});
      const shadow = (x, y, w) => { const gr = c.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.translate(x, y); c.scale(1, 0.3); c.translate(-x, -y); c.fillStyle = gr; c.beginPath(); c.arc(x, y, w, 0, 6.3); c.fill(); c.restore(); };
      const sim = (o0, t0, o1, t1) => { const S0 = S(Object.assign({ x: 0, y: 0 }, o0), 0); for (let f = 0; f <= t0 * 60; f++) { S0.t = f / 60; G.solve(0, 0, 200, S0, { tile: 70 }); } Object.assign(S0, o1 || {}); for (let f = 1; f <= (t1 || 0) * 60; f++) { S0.t = t0 + f / 60; G.solve(0, 0, 200, S0, { tile: 70 }); } return S0; };
      const cells = []; const P12 = f => { const P = []; for (let i = 0; i < 12; i++) P.push(f(i)); return P; };
      if (MODE === 'one' || MODE === 'low') cells.push({ x: W / 2, y: H - 70, size: H * 0.5, S: S({}), n: 'GABRIEL ' + ['', 'THE BOUND SERAPH (BASE)', 'THE HEART OF MERCY (L4)', 'EDEN INCARNATE (L7)'][KT] });
      else if (MODE === 'hero') cells.push({ x: W / 2, y: H - 60, size: H * 0.62, S: S({}), n: 'GABRIEL, THE SACRED ORACLE · ' + ['', 'THE BOUND SERAPH', 'THE HEART OF MERCY (L4)', 'EDEN INCARNATE (L7)'][KT] });
      else if (MODE === 'forms') [1, 4, 7].forEach((ev, i) => cells.push({ x: W * (0.18 + i * 0.32), y: H - 70, size: H * 0.36, S: G.idle(ev, 1.3), n: ['THE BOUND SERAPH', 'THE HEART OF MERCY (L4)', 'EDEN INCARNATE (L7)'][i] }));
      else if (MODE === 'views') [[Math.PI / 2, 'FRONT', 0], [F0 + 0.55, '3/4', 0], [0, 'SIDE', 0], [-Math.PI / 2, 'BACK', 0], [Math.PI / 2, 'TOP', 0.95]].forEach(([f, n, vp], i) => cells.push({ x: W * (0.1 + i * 0.2), y: H - 90 - (vp ? 60 : 0), size: H * 0.26, S: S({ face: f, faceFree: true, viewPitch: vp }), n }));
      else if (MODE === 'ult') [[{ wingShape: 'ult', wing: 1, heartOpen: 1, heartSplit: 1, restraintsOpen: 1, orRise: 1, crownOpen: 1, orPose: 'spread', ribbons: 1, orGlow: 1.5, cry: 0.5 }, 'EDEN REBORN: THE UNBOUND HEART'], [{ wingShape: 'heart', heartOpen: 0.35, orPose: 'pray', glow: 1, heartPulse: 1 }, 'BLOOM OF MERCY (HEART WINGS)']].forEach(([o, n], i) => cells.push({ x: W * (0.27 + i * 0.46), y: H - 70, size: H * 0.42, S: S(o), n, sim: true }));
      else if (MODE === 'poses') {
        const L = [['IDLE', {}], ['BLOOM OF MERCY', { wingShape: 'heart', orPose: 'pray', heartOpen: 0.3, heartPulse: 0.8 }], ['HEALING RELEASE', { wingShape: 'heart', orPose: 'open', heartOpen: 0.35, glow: 0.6 }],
          ['HARVEST HALO', { wingShape: 'attack', orPose: 'raise1', haloSpin: 2.0, ringSpin: 3, petals: P12(i => i < 5 ? { home: 0, x: -3 + i * 1.5, y: 1.5, z: 1.2, ang: 1.6, open: 0.4, glow: 1 } : { home: 1 }) }],
          ['SANCTUARY WEAVE', { wingShape: 'full', wing: 1, orPose: 'spread', wristOpen: 1, petals: P12(i => ({ home: 0, x: 3.2 * Math.cos(i / 12 * 6.283), y: 1.6 + 1.6 * Math.sin(i / 12 * 6.283), z: 0.6, ang: 0, open: 0.6, glow: 0.8 })) }],
          ['THRESHER OF STARS', { wingShape: 'ult', wing: 1, orPose: 'raise2', heartSplit: 0.5, ringSpin: 4, glow: 1 }], ['CRY', { cry: 1 }], ['STRUGGLE (CHARGING)', { orStruggle: 1, heartPulse: 1, orGlow: 1 }],
          ['ULT: UNBOUND', { wingShape: 'ult', wing: 1, heartOpen: 1, heartSplit: 1, restraintsOpen: 1, orRise: 1, crownOpen: 1, orPose: 'spread', ribbons: 1, orGlow: 1.5 }], ['ULT: EDEN LOTUS', { wingShape: 'ult', wing: 1, heartOpen: 1, restraintsOpen: 1, orRise: 1, crownOpen: 1, orPose: 'clasp', petals: P12(i => ({ home: 0, x: 1.6 * Math.sin(i / 12 * 6.283), y: 0.2, z: 3.9 + 1.6 * Math.cos(i / 12 * 6.283), ang: i / 12 * 6.283, open: 1, glow: 1, s: 1.6 })) }]];
        L.forEach(([n, o], i) => cells.push({ x: W * (0.1 + (i % 5) * 0.2), y: i < 5 ? H * 0.47 : H * 0.96, size: W * 0.075, S: S(Object.assign({ x: 0, y: 0 }, o)), n, sim: true }));
      } else if (MODE === 'heart') [[{}, 'CLOSED'], [{ heartOpen: 0.35 }, 'HEALING (OPEN 0.35)'], [{ heartOpen: 1, heartSplit: 1, restraintsOpen: 1 }, 'OPEN + SPLIT']].forEach(([o, n], i) => cells.push({ fx: W * (0.17 + i * 0.33), fy: H * 0.55, size: 1500, S: S(Object.assign({ face: Math.PI / 2 }, o)), n: 'THE HEART OF EDEN · ' + n, focus: 'heart', hide: ['halo', 'haloIn', 'haloOut', 'pcore', 'pvane'] }));
      else if (MODE === 'oracle') [['rest', {}], ['pray', {}], ['raise2', {}], ['spread', { wristOpen: 1 }], ['cast', {}]].forEach(([p, o], i) => cells.push({ fx: W * (0.1 + i * 0.2), fy: H * 0.5, size: 2600, S: S(Object.assign({ face: Math.PI / 2, orPose: p }, o)), n: 'ORACLE · ' + p.toUpperCase(), focus: 'oracle', sim: true, hide: ['hlobe', 'cplate', 'halo', 'haloIn', 'haloOut', 'pcore', 'pvane', 'nvert', 'pskull', 'pjaw', 'crest'] }));
      else if (MODE === 'head') [[Math.PI / 2 - 0.2, 'HEAD 3/4'], [0.2, 'PROFILE']].forEach(([f, n], i) => cells.push({ fx: W * (0.27 + i * 0.46), fy: H * 0.5, size: 2600, S: S({ face: f, faceFree: true, beakOpen: i * 0.4 }), n, focus: 'head' }));
      else if (MODE === 'wing') [[0, 'FOLDED'], [0.5, 'HALF'], [1, 'FULL']].forEach(([w, n], i) => cells.push({ x: W * (0.18 + i * 0.32), y: H - 80, size: H * 0.36, S: S({ wing: w, face: Math.PI / 2 }), n: 'WINGS ' + n }));
      else if (MODE === 'halo') cells.push({ fx: W / 2, fy: H * 0.5, size: 1500, S: S({ face: Math.PI / 2 }), n: 'THE HALO AND THE TWELVE PETALS OF MERCY', focus: 'halo' });
      else if (MODE === 'flight') { const L = [['TAKEOFF', sim({ fly: 0 }, 1, { fly: 1.2 }, 0.4)], ['HOVER', sim({ fly: 1.0 }, 3.0)], ['GLIDE', sim({ fly: 1.2, glide: 1, speed: 0.7 }, 2.5)], ['BANK', sim({ fly: 1.2, speed: 0.8, bank: 1, face: 1.2 }, 2.5)], ['LANDING', sim({ fly: 1.0 }, 2, { fly: 0 }, 0.5)]];
        L.forEach(([n, S0], i) => cells.push({ x: W * (0.1 + i * 0.2), y: H * 0.9, size: W * 0.07, S: S0, live: S0, n })); }
      else if (MODE === 'enter') [0.08, 0.2, 0.35, 0.5, 0.65, 0.8, 1].forEach((e, i) => cells.push({ x: 110 + i * 212, y: H * 0.75, size: 170, S: S({ enter: e }), n: 'ENTER ' + e }));
      else if (MODE === 'dissolve') [0, 0.3, 0.55, 0.8, 0.95].forEach((e, i) => cells.push({ x: 160 + i * 295, y: H * 0.75, size: 220, S: S({ dissolve: e }), n: 'DISSOLVE ' + e }));
      const res = [];
      for (const C of cells) {
        let x = C.x, y = C.y; const S1 = C.live || C.S;
        if (C.sim) { for (let f = 0; f < (MODE === 'ult' ? 150 : 30); f++) { S1.t = 1 + f / 60; G.solve(0, 0, C.size, S1, { tile: 70 }); } }
        if (C.focus) { const S2 = Object.assign({}, C.S); delete S2._gb; const o0 = G.solve(0, 0, C.size, S2, { still: true, tile: 70 }); const a = o0[C.focus]; x = C.fx - a.x; y = C.fy - a.y; c.save(); c.beginPath(); c.rect(C.fx - W * 0.16, 0, W * 0.32, H); c.clip(); }
        else shadow(x, y, C.size * 0.4);
        const t1 = performance.now(); const o = G.draw(c, x, y, C.size, S1, { still: !C.live && !C.sim, hide: C.hide || window.__HIDE, tile: 70, full: true });
        if (o && FX) G.lights(c, o, S1, 1);
        if (C.focus) c.restore();
        res.push({ n: C.n, ms: Math.round(performance.now() - t1), ok: !!o, items: G.STATS.items, tris: G.STATS.tris, calls: G.STATS.calls, passes: G.STATS.passes });
        lab(C.focus ? C.fx : x, C.focus ? H - 30 : y + 26, C.n);
      }
      if (MODE === 'spectral') { const S2 = S({ wingShape: 'ult', wing: 1, cry: 0.6 }); const a = G.drawSpectral(c, W / 2, H - 80, H * 0.55, S2, { still: true }); lab(W / 2, H - 30, 'THE SPECTRAL WHITE PHOENIX · ' + (a ? 'ok' : 'null')); res.push(Object.assign({}, G.STATS)); }
      if (MODE === 'parts') { G.drawParts(c, [{ m: 'heart', X: 200, Y: 300, s: 60, g: 0.6 }, { m: 'heartBig', X: 550, Y: 320, s: 22, g: 0.6 }, { m: 'petal', X: 850, Y: 280, s: 40, o: 0 }, { m: 'petal', X: 1000, Y: 280, s: 40, o: 1 }, { m: 'lotus', X: 1250, Y: 320, s: 70 },
        { m: 'lily', X: 250, Y: 700, s: 80 }, { m: 'ring', X: 600, Y: 700, s: 90, t: 1 }, { m: 'feather', X: 950, Y: 700, s: 50, tilt: -1.2 }]); }
      if (MODE === 'compare') { window.__SM_GL = 1; window.__AS_GL = 1; window.__AB_GL = 1; window.__RZ_GL = 1; window.__RZ_GLHQ = 1; const Tz = 95, AA = window.__pp.AnimaArt;
        const L = [['cancer', 'ABADDON'], ['scorpio', 'ASMODEUS'], ['virgo', 'GABRIEL'], ['gemini', 'RAZIEL'], ['aries', 'SAMAEL']], BIG = id => ({ aries: (self.SAMAEL_MOVES || {}).BIG || 1, scorpio: (self.ASMODEUS_MOVES || {}).BIG || 1, gemini: (self.RAZIEL_MOVES || {}).BIG || 1, virgo: (self.GABRIEL_MOVES || {}).BIG || 1 })[id] || 1;
        L.forEach(([id, n], i) => { const x = W * (0.1 + i * 0.2), y = H - 90, size = Tz * 3.1 * BIG(id); shadow(x, y, size * 0.4); const t1 = performance.now(); try { AA.draw(c, id, 3, x, y, size, 1.3, {}); } catch (e) { lab(x, y - 200, String(e).slice(0, 50)); } res.push({ n, ms: Math.round(performance.now() - t1) }); lab(x, y + 26, n + ' (L7)'); }); }
      if (MODE === 'nogl') { window.__GB_GL = 0; const AA = window.__pp.AnimaArt, AP = window.__pp.AnimaPortrait; [1, 2, 3].forEach((k, i) => { const x = W * (0.18 + i * 0.32), y = H * 0.55; shadow(x, y, 120); AA.draw(c, 'virgo', k, x, y, 300, 1.3, {}); lab(x, y + 26, 'NO GL · FORM ' + k); try { const cvp = AP ? AP.canvas('virgo', k, 340, 220) : null; if (cvp) c.drawImage(cvp, x - 170, H * 0.62, 340, 220); } catch (e) { lab(x, H * 0.7, String(e).slice(0, 60)); } }); window.__GB_GL = 1; }
      return { ok, tb: Math.round(tb), nv: G.nv, nt: G.nt, ntL: G.ntL, res };
    }, { MODE, W, H, DPR });
    const OUT = MODES.includes(',') ? OUT0.replace(/\.png$/, '-' + MODE + '.png') : OUT0;
    await page.screenshot({ path: OUT });
    console.log(MODE, JSON.stringify(r));
  }
  console.log('errors', JSON.stringify(errors.filter(e => !/GPU stall|TUNNEL/.test(e)).slice(0, 6)));
  await browser.close();
})();
