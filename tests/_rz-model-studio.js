// (v464 RZ-M) Raziel studio: renders the GPU model alone (forms, views, close-ups, poses, strips) on a dark backdrop split warm / cold.
// usage: HTML=<test html> node tests/_rz-model-studio.js [out.png] [mode] [dpr]
//   mode: one (a big 3/4 front, KT form), forms (the three forms), views (front / 3-4 / side / back / top), heads (both heads close),
//   core (the Gemini Core close), crowns, wings, poses (key poses), enter (the assembly strip), dissolve, spectral, walk (a strip), low,
//   parts (drawParts meshes). env: KT (form 1..3), FX=0 (no glow lights), YAW (a world face angle for 'one'), HIDE (parts to hide)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const OUT0 = process.argv[2] || 'shots/v464-RZM/studio.png', MODES = process.argv[3] || 'one', DPR = +(process.argv[4] || 1);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const W = +(process.env.W || 1500), H = +(process.env.H || 900);
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: DPR });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n')[1])); page.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errors.push('console: ' + m.text().slice(0, 1500)); });
  await page.addInitScript(([kt, hide, fx, yaw, lsz, gq, hj, hy]) => { window.__GQ = gq; window.__LODSZ = lsz; window.__KT = kt; window.__HIDE = hide ? hide.split(',') : null; window.__FX = fx; window.__YAW = yaw; window.__HJAW = hj; window.__HYAW = hy; }, [process.env.KT || '1', process.env.HIDE || '', process.env.FX || '1', process.env.YAW || '', process.env.LODSZ || '146', process.env.GQ || '', process.env.HJAW, process.env.HYAW]);
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-rzm.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  for (const MODE of MODES.split(',')) {
  const r = await page.evaluate(({ MODE, W, H, DPR }) => {
    const old = document.getElementById('rzcv'); if (old) old.remove();
    window.__RZ_GL = 1; window.__RZ_GLHQ = 1; window.__NG_GL = 1; const RG = window.RAZIEL_GL; if (MODE === 'low') { window.__pp.quickStart('Bot'); window.__pp.st.lowFx = true; }
    const cv = document.createElement('canvas'); cv.width = W * DPR; cv.height = H * DPR; cv.id = 'rzcv'; cv.style.cssText = `position:fixed;left:0;top:0;width:${W}px;height:${H}px;z-index:99999`; document.body.appendChild(cv);
    const c = cv.getContext('2d'); c.scale(DPR, DPR);
    const g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, '#1e0e0a'); g.addColorStop(0.5, '#120d18'); g.addColorStop(1, '#0a1222'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    const t0 = performance.now(); const ok = RG.ensure(); const tb = performance.now() - t0;
    const lab = (x, y, s) => { c.fillStyle = '#E8D8C0'; c.font = '600 14px serif'; c.textAlign = 'center'; c.fillText(s, x, y); };
    const KT = +(window.__KT || 1), EV = [0, 1, 4, 7][KT], FX = window.__FX !== '0', F0 = RG.FACE0;
    const S = (o, t) => Object.assign(RG.idle(EV, t == null ? 1.3 : t), o || {});
    const cells = [];
    const shadow = (x, y, w) => { const gr = c.createRadialGradient(x, y, 0, x, y, w); gr.addColorStop(0, 'rgba(0,0,0,0.55)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.translate(x, y); c.scale(1, 0.3); c.translate(-x, -y); c.fillStyle = gr; c.beginPath(); c.arc(x, y, w, 0, 6.3); c.fill(); c.restore(); };
    if (MODE === 'one' || MODE === 'low') cells.push({ x: W / 2, y: H - 110, size: H * 0.48, S: S({ face: window.__YAW ? +window.__YAW : F0 }), n: 'RAZIEL ' + ['', 'THE TWIN REVELATION (BASE)', 'THE MIRRORED SOVEREIGN (L4)', 'THE DIVINE EQUATION (L7)'][KT] });
    else if (MODE === 'forms') [1, 4, 7].forEach((ev, i) => cells.push({ x: W * (0.17 + i * 0.33), y: H - 80, size: W * 0.13, S: Object.assign(RG.idle(ev, 1.3), {}), n: ['THE TWIN REVELATION', 'THE MIRRORED SOVEREIGN', 'THE DIVINE EQUATION'][i] }));
    else if (MODE === 'views') [[Math.PI / 2, 'FRONT'], [F0, '3/4'], [0, 'SIDE'], [-Math.PI / 2, 'BACK']].forEach(([f, n], i) => cells.push({ x: 190 + i * 375, y: H - 120, size: 300, S: S({ face: f, faceFree: true }), n }));
    else if (MODE === 'poses') {
      const L = [['IDLE', {}], ['TWIN FANG (CHARGE)', { aimL: { x: 6, y: 4 }, aimR: { x: -6, y: 4 }, jawL: 0.6, jawR: 0.6, chargeL: 1, chargeR: 1 }], ['TWIN FANG (CROSSED)', { aimL: { x: -5, y: 5 }, aimR: { x: 5, y: 5 }, jawL: 1, jawR: 1, chargeL: 0.6, chargeR: 0.6 }],
        ['MIRROR DIVIDE', { raise: 1, crownExpand: 0.25, wing: 1 }], ['REVELATION CIRCUIT', { mode: 'concord', coreDetach: 1, coreAlign: 1, crownAlign: 1, raise: 0.7, wing: 1 }], ['BINARY CATACLYSM', { fly: 0.6, wing: 1, beat: 0.5, jawL: 0.7, jawR: 0.7 }],
        ['ROAR', { roar: 1 }], ['GUARD', { guard: 1 }], ['ULT: CORES UP, PORTALS', { coreUp: 1, crownExpand: 1, wing: 1, roar: 0.6 }], ['MEET (FINALE)', { meet: 1, wing: 0.45 }]];
      L.forEach(([n, o], i) => cells.push({ x: W * (0.1 + (i % 5) * 0.2), y: i < 5 ? H * 0.44 : H * 0.92, size: W * 0.062, S: S(Object.assign({ x: 0, y: 0 }, o)), n }));
    } else if (MODE === 'wings') { [[0, 'FOLDED'], [0.35, 'PARTIAL'], [1, 'FULL']].forEach(([w, n], i) => cells.push({ x: 260 + i * 490, y: H - 120, size: 330, S: S({ wing: w, face: Math.PI / 2 }), n: 'WINGS ' + n }));
    } else if (MODE === 'heads') { [[1.98, 'LUX', 'headL'], [1.98, 'UMBRA', 'headR'], [0.25, 'LUX SIDE', 'headL'], [Math.PI - 0.25, 'UMBRA SIDE', 'headR']].forEach(([f, n, fo], i) => cells.push({ fx: 190 + i * 375, fy: 470, size: 1150, S: S({ face: f, faceFree: true, jawL: 0.45, jawR: 0.45 }), n: 'HEAD ' + n, focus: fo, clip: [i * 375, 0, 375, H] }));
    } else if (MODE === 'hero') { cells.push({ x: W / 2, y: H - 150, size: H * 0.82, S: S({ face: window.__YAW ? +window.__YAW : F0, faceFree: !!window.__YAW }), n: 'RAZIEL, THE TWIN REVELATION · ' + ['', 'BASE', 'L4 THE MIRRORED SOVEREIGN', 'L7 THE DIVINE EQUATION'][KT] });
    } else if (MODE === 'heads2') { cells.push({ fx: W / 2, fy: H * 0.5, size: H * 1.75, S: S({ face: F0, jawL: 0.55, jawR: 0.45 }), n: 'LUX AND UMBRA', focus: 'headL', both: 1 });
    } else if (MODE === 'core') { cells.push({ fx: W / 2, fy: H / 2, size: 1700, S: S({ face: Math.PI / 2 }), n: 'THE GEMINI CORE', focus: 'body', fo2: 'coreL' });
    } else if (MODE === 'compare') {   // the rebuilt Zodiac Animas at their in-game size (Tz 95 px a tile: ANIMA_SIZE[3] x each one's BIG), Celestial form
      window.__SM_GL = 1; window.__AS_GL = 1; window.__BL_GL = 1; window.__AB_GL = 1; const Tz = 95, BIG = id => ({ aries: (self.SAMAEL_MOVES || {}).BIG || 1.1, taurus: (self.BELIAL_MOVES || {}).BIG || 1, scorpio: (self.ASMODEUS_MOVES || {}).BIG || 1, gemini: (self.RAZIEL_MOVES || {}).BIG || 1 })[id];
      [['aries', 'SAMAEL'], ['taurus', 'BELIAL'], ['scorpio', 'ASMODEUS'], ['gemini', 'RAZIEL']].forEach(([id, n], i) => { const x = [W * 0.09, W * 0.27, W * 0.44, W * 0.73][i], y = H - 90, size = Tz * 3.1 * BIG(id); shadow(x, y, size * 0.4); const t1 = performance.now(); try { window.__pp.AnimaArt.draw(c, id, 3, x, y, size, 1.3, { aura: false }); } catch (e) { lab(x, y - 200, String(e).slice(0, 40)); } lab(x, y + 22, n + ' (' + Math.round(performance.now() - t1) + ' ms)'); });
    } else if (MODE === 'portrait' || MODE === 'nogl') {   // the collection's portraits (the menu's splash, 340 x 220) for the three forms; nogl: without WebGL for the model
      if (MODE === 'nogl') window.__RZ_GL = 0; const AP = window.__pp.AnimaPortrait || null;
      [1, 2, 3].forEach((k, i) => { try { const cvp = AP ? AP.canvas('gemini', k, 340, 220) : null; if (cvp) c.drawImage(cvp, 20 + i * 490, 120, 460, 298); } catch (e) { lab(250 + i * 490, 200, String(e).slice(0, 60)); } lab(250 + i * 490, 440, (MODE === 'nogl' ? 'NO GL: ' : '') + 'FORM ' + k); });
      [1, 3].forEach((k, i) => { const x = 380 + i * 700, y = 820; shadow(x, y, 120); window.__pp.AnimaArt.draw(c, 'gemini', k, x, y, 300, 1.3, {}); lab(x, y + 24, (MODE === 'nogl' ? 'NO GL ' : '') + 'AnimaArt k' + k); });
    } else if (MODE === 'lod') {   // the game's level of detail beside the full mesh at the in-game size (146 css px: a phone's L7 summon; run at DPR 3), and at an iMac's (228 css px: run at DPR 2), with each pass's cost
      const sz = +(window.__LODSZ || 146); if (window.__GQ) { window.__pp.quickStart('Bot'); window.__pp.st.gq = window.__GQ; } window.__HQ = [RG.hq(), window.__GQ || 'auto']; [[false, 'FULL MESH'], [true, 'GAME LOD']].forEach(([lod, n], i) => cells.push({ x: W * (0.17 + 0.33 * i), y: H * 0.82, size: sz, S: S({}), n: n + ' @ ' + sz + ' css px', o: lod ? { lod: true } : { full: true } })); cells.push({ x: W * 0.83, y: H * 0.82, size: sz, S: S({}), n: 'AUTO (' + (window.__GQ || 'auto') + ')', o: {} });
    } else if (MODE === 'flight') {   // (v465 RZ-M) flight poses, each simulated with live springs (60 fps) from a start state into the pose
      const sim = (o0, t0, o1, t1) => { const S0 = S(Object.assign({ x: 0, y: 0 }, o0), 0); for (let f = 0; f <= t0 * 60; f++) { S0.t = f / 60; RG.solve(0, 0, 200, S0, { tile: 70 }); } Object.assign(S0, o1 || {}); for (let f = 1; f <= t1 * 60; f++) { S0.t = t0 + f / 60; RG.solve(0, 0, 200, S0, { tile: 70 }); } S0.t += 1 / 60; return S0; };
      const L = [['TAKEOFF', sim({ fly: 0 }, 1, { fly: 1 }, 0.4)], ['HOVER: DOWNSTROKE', sim({ fly: 0.6 }, 3.0)], ['HOVER: UPSTROKE', sim({ fly: 0.6 }, 3.62)], ['GLIDE', sim({ fly: 0.8, glide: 1, speed: 0.7 }, 2.5)], ['BANKING TURN', sim({ fly: 0.8, speed: 0.8, bank: 1, face: 1.2 }, 2.5)],
        ['SWOOPING DIVE', sim({ fly: 0.7, speed: 1, dive: 1 }, 2.5)], ['CLIMB', sim({ fly: 0.9, speed: 0.6, dive: -1 }, 2.5)], ['LANDING', sim({ fly: 0.6 }, 2, { fly: 0 }, 0.55)], ['FAST FLIGHT (SIDE)', sim({ fly: 0.8, speed: 1, face: 0, faceFree: true }, 2.5)], ['LANDED', sim({ fly: 0.6 }, 2, { fly: 0 }, 2.5)]];
      L.forEach(([n, S0], i) => cells.push({ x: W * (0.1 + (i % 5) * 0.2), y: i < 5 ? H * 0.47 : H * 0.95, size: W * 0.065, S: S0, live: S0, n }));
    } else if (MODE === 'enter') [0.1, 0.25, 0.4, 0.55, 0.7, 0.85, 1].forEach((e, i) => cells.push({ x: 110 + i * 212, y: 560, size: 170, S: S({ enter: e }), n: 'ENTER ' + e }));
    else if (MODE === 'dissolve') [0, 0.25, 0.5, 0.75, 0.95].forEach((e, i) => cells.push({ x: 160 + i * 295, y: 560, size: 220, S: S({ dissolve: e }), n: 'DISSOLVE ' + e }));
    else if (MODE === 'walk') { const S0 = S({ x: 0, y: 0, walk: 0.5, face: F0 }); for (let f = -30; f < 7; f++) { const tt = 1 + (f + 30) / 30; S0.t = tt; S0.x = -(f + 30) / 30 * 1.6 * 0.39; S0.y = (f + 30) / 30 * 1.6 * 0.92; if (f >= 0) cells.push({ x: 120 + f * 210, y: 600, size: 200, S: Object.assign({}, S0, { _rz: S0._rz }), live: S0, n: 'f' + f }); else RG.solve(0, 0, 200, S0, { tile: 70 }); } }
    const res = [];
    for (const C of cells) { if (C.focus) { const S2 = Object.assign({}, C.S); delete S2._rz; const o0 = RG.solve(0, 0, C.size, S2, { still: true, tile: 70 }); let ax = o0[C.focus].x, ay = o0[C.focus].y; if (C.fo2) { ax = (o0.coreL.x + o0.coreR.x) / 2; ay = (o0.coreL.y + o0.coreR.y) / 2; } if (C.both) { ax = (o0.headL.x + o0.headR.x) / 2; ay = (o0.headL.y + o0.headR.y) / 2; } C.x = C.fx - ax; C.y = C.fy - ay; }
      if (C.clip) { c.save(); c.beginPath(); c.rect(...C.clip); c.clip(); }
      const t1 = performance.now(); if (!C.focus) shadow(C.x, C.y, C.size * 0.45); const S1 = C.live || C.S; const o = RG.draw(c, C.x, C.y, C.size, S1, Object.assign({ still: !C.live, hide: window.__HIDE, tile: 70, fit: false }, C.o || {})); if (C.o) C.cost = { lod: o && o.lod, items: RG.STATS.items, calls: RG.STATS.calls, tris: RG.STATS.tris, W: RG.STATS.W, H: RG.STATS.H }; res.push([C.n, !!o, Math.round(performance.now() - t1), C.cost || null]); if (C.clip) c.restore(); if (C.focus) lab(C.fx, H - 20, C.n); else lab(C.x, C.y + 20, C.n); if (o && FX) RG.lights(c, o, S1, 1); }
    if (MODE === 'spectral') { const S2 = S({ jawL: 0.6, jawR: 0.6, wing: 1 }), S3 = S({ jawL: 0.6, jawR: 0.6, wing: 1 }); const a1 = RG.drawSpectral(c, W * 0.27, H - 150, H * 0.42, S2, 'L', { still: true }), s1 = Object.assign({}, RG.STATS); const a2 = RG.drawSpectral(c, W * 0.73, H - 150, H * 0.42, S3, 'R', { still: true }), s2 = Object.assign({}, RG.STATS); res.push(['spectral L', !!a1, s1], ['spectral R', !!a2, s2]); lab(W * 0.27, H - 40, 'SPECTRAL LUX'); lab(W * 0.73, H - 40, 'SPECTRAL UMBRA'); }
    if (MODE === 'parts') { RG.drawParts(c, [{ m: 'sun', X: 250, Y: 300, s: 70, g: 1, t: 1 }, { m: 'planet', X: 600, Y: 300, s: 70, t: 1 }, { m: 'crownL', X: 950, Y: 300, s: 90, t: 1 }, { m: 'crownR', X: 1300, Y: 300, s: 90, t: 1 },
      { m: 'spire', X: 250, Y: 800, s: 60, h: 1 }, { m: 'spire', X: 450, Y: 800, s: 50, h: 0.5 }, { m: 'shard', X: 650, Y: 700, s: 40, side: 'R' }, { m: 'ember', X: 800, Y: 700, s: 30 }, { m: 'ringL', X: 1000, Y: 700, s: 60 }, { m: 'ringR', X: 1250, Y: 700, s: 60 }]); }
    if (MODE === 'hprof') {   // (v465 RZ-M) the two heads alone: side profiles (top row) and 3/4 (bottom row), jaw at rest; env HYAW (the 3/4 yaw), HJAW
      const KH = KT, jw = window.__HJAW != null ? +window.__HJAW : 0.2, y3 = window.__HYAW != null ? +window.__HYAW : 0.75, s0 = Math.min(W / 4, H / 2) * 0.16;
      [[0, 'L', 0, 'LUX PROFILE'], [Math.PI, 'R', 1, 'UMBRA PROFILE'], [y3, 'L', 2, 'LUX 3/4'], [Math.PI - y3, 'R', 3, 'UMBRA 3/4']].forEach(([yaw, side, i, n]) => {
        const X = W * (0.25 + 0.5 * (i % 2)) + (i % 2 ? -1 : 1) * s0 * 0.2, Y = H * (i < 2 ? 0.3 : 0.78); RG.drawParts(c, [{ m: 'head', X, Y, s: s0, yaw, side, k: KH, jaw: jw, g: 0.6 }], { res: 1, full: !window.__LODH }); lab(X, Y + s0 * 2.6, n); });
    }
    return { hq: window.__HQ, ok, tb: Math.round(tb), nv: RG.nv, nt: RG.nt, res, stats: RG.STATS };
  }, { MODE, W, H, DPR });
  const OUT = MODES.includes(',') ? OUT0.replace(/\.png$/, '-' + MODE + '.png') : OUT0;
  await page.screenshot({ path: OUT });
  console.log(MODE, JSON.stringify(r)); }
  console.log('errors', JSON.stringify(errors.filter(e => !/GPU stall|TUNNEL/.test(e)).slice(0, 5)));
  await browser.close();
})();
