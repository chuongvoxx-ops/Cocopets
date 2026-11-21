/* ---------- the old-film look: an analog colour grade and a film filter laid over the whole game ----------
   (v441 FL) The user (2026-11-21, iPhone): 60 fps without the film look, 34 with it. v440's look was five full-screen layers composited
   by the browser every frame over a canvas that changes every frame: a backdrop blur (re-blurred each frame) and four blend modes
   (multiply, saturation, screen, overlay: each a pass that reads what is under it), the flicker and the grain moved by style writes,
   plus the lens fringe's four full-canvas passes. Rebuilt to look the same with plain alpha layers only, which the compositor lays as
   ordinary textures (no offscreen pass, no read-back of the page):
   1 the grade: one small static picture, stretched over the screen, laid with normal alpha: v440's warm multiply vignette, its grey
     'saturation' wash and its brown 'screen' lift fitted together by radius (tests: shots/v441-FL); its flicker is an opacity
     animation the compositor runs (no style write a frame);
   2 film grain: v440's noise tiles in black and white with alpha (normal blend), one layer jumped about by a transform animation
     (the compositor's: no repaint, no style write);
   3 dust and hairs, on a half-size canvas repainted a dozen times a second (only when there is something to show or to clear);
   4 the lens fringe on the Tower's and rifts' canvas (touch screens), as before.
   By the visual quality (Settings > Visual quality, GQ in 09c): High all four (and on a computer v440's faint backdrop softening, which
   it has always had there); Balanced and Performance the grade and the grain only. Settings: "Old film look" (st.retro, on unless
   turned off). window.__FL_OFF = 1: v440's layers and lens (A/B tests); window.__FL_STILL = 1: the grain, flicker and dust held still
   (tests: the same picture shot twice) */
const retro = (() => {
  const BLUR = 0.48, CA = 0.10;   /* the blur in px; the chromatic aberration's strength (0..1: 1 is a 2% split at the edges) */
  const flag = k => { try { return typeof window !== 'undefined' && window[k] === 1; } catch (e) { return false; } };
  let on = false, tick = 0, key = '', P = { grade: 0, grain: 0, dust: 0, fringe: 0, blur: 0 }, force = null;
  let warm = null, grain = null, dust = null, dc = null, dustN = 0, tiles = [];
  const LAYERS = [], ANIMS = [];
  function noiseVals(seed) { const n = 128, R = mulberry32(seed), v = new Float32Array(n * n); for (let i = 0; i < n * n; i++) v[i] = R(); return v; }
  function noiseTile(seed) {   // (v440's tile, as a picture for a CSS background)
    const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d'), im = c.createImageData(n, n), V = noiseVals(seed);
    for (let i = 0; i < n * n; i++) { const v = V[i], g = v < 0.5 ? 0 : 255, a = Math.abs(v - 0.5) * 2; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = g; im.data[i * 4 + 3] = Math.round(Math.pow(a, 1.6) * 200); }
    c.putImageData(im, 0, 0); return cv.toDataURL();
  }
  // (each layer sits straight on the page, in its stacking context: a wrapper with a z-index would make a context of its
  // own, and the layers would blend with nothing but each other)
  function layer(css, tag) { const d = document.createElement(tag || 'div'); d.className = 'retroFx'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;' + css; document.body.appendChild(d); LAYERS.push(d); return d; }
  /* on a desktop computer (a mouse, no touch screen) the film look is laid on without its chromatic aberration: the user
     found the iMac's lag went with it (27 Oct) */
  const DESKTOP = (() => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches && !(navigator.maxTouchPoints > 0); } catch (e) { return false; } })();
  let BIG = false;
  function dustLayer() { dust = layer('width:100%;height:100%;z-index:2147483001;opacity:.75;', 'canvas'); dc = dust.getContext('2d'); dustN = -1; }

  /* ---- v440's layers (window.__FL_OFF = 1) ---- */
  function buildOld() {
    BIG = innerWidth * innerHeight * Math.pow(devicePixelRatio || 1, 2) > 4.5e6;   /* a 5K iMac's window, a big monitor */
    // 0 the faintest softening of everything under it (a third of a pixel), as an old screen's picture is never quite sharp
    // (not on a very big screen: a full-screen blur of a 5K display every frame is a heavy load, and there the game's
    // canvas, drawn smaller and enlarged, is soft already)
    if (!BIG) layer('backdrop-filter:blur(' + BLUR + 'px);-webkit-backdrop-filter:blur(' + BLUR + 'px);');
    warm = layer('background:radial-gradient(ellipse 80% 74% at 50% 48%, #FFF6E4 0%, #FBEBCB 52%, #D9B98A 82%, #7A5A3C 100%);mix-blend-mode:multiply;opacity:.55;');
    // (the two faintest layers stay off on a very big screen: 'saturation' is the costliest blend of all to composite)
    if (!BIG) { layer('background:#8A8478;mix-blend-mode:saturation;opacity:.09;'); layer('background:#3B2A1A;mix-blend-mode:screen;opacity:.05;'); }
    if (!tiles.length) tiles = [11, 23, 37].map(noiseTile);
    grain = layer(`background-image:url(${tiles[0]});background-size:128px 128px;mix-blend-mode:overlay;opacity:.15;`);
    dustLayer();
  }
  function tickOld() {
    if (flag('__FL_STILL')) { grain.style.backgroundPosition = '0px 0px'; grain.style.backgroundImage = `url(${tiles[0]})`; warm.style.opacity = '0.55'; paintDust(true); return; }
    // the grain jumps every frame of this timer; the tile itself changes every third
    grain.style.backgroundPosition = `${Math.floor(Math.random() * 128)}px ${Math.floor(Math.random() * 128)}px`;
    if (tick % 3 === 0) grain.style.backgroundImage = `url(${tiles[tick % tiles.length]})`;
    // the light flickers a touch
    warm.style.opacity = (0.52 + Math.random() * 0.06).toFixed(3);
    paintDust();
  }

  /* ---- (v441 FL) the cheap layers ---- */
  /* the grade by radius t (v440's ellipse: 80% of the width, 74% of the height, centred at 50% / 48%; t = 1 on it): [t, alpha, r, g, b]
     of one normal-alpha layer that best matches, over the colours of real frames (the town, a Tower fight, a skill's flash, the
     Belfry), v440's warm multiply at its strongest flicker (.58), its saturation wash (.09) and its screen lift (.05) together
     (a least-squares fit by radius, bounded to real colours: shots/v441-FL/fit.py). The flicker then scales it from .52/.58 to 1 (v440: .52-.58) */
  const GRADE = [[0, 0.04, 139, 79, 0], [0.15, 0.0505, 124, 69, 0], [0.3, 0.0613, 114, 62, 0], [0.4, 0.0683, 110, 59, 0], [0.52, 0.0767, 106, 56, 0], [0.6, 0.1088, 84, 41, 0], [0.68, 0.1414, 73, 34, 0], [0.75, 0.1694, 66, 29, 0], [0.82, 0.1977, 62, 26, 0], [0.87, 0.2516, 47, 18, 0], [0.92, 0.3058, 37, 13, 0], [0.96, 0.3488, 31, 10, 0], [1, 0.3922, 27, 8, 0]];
  const FLK = 0.52 / 0.58, FLK_MEAN = 0.55 / 0.58;
  /* the grain: v440's overlay grain (black or white noise, alpha a, at .15) changes a tone C by a * .15 * min(C, 1 - C), which no plain
     alpha layer can follow exactly; the black specks at a * .08 and the white at a * .045 (normal alpha) fit it best over the same frames
     (each picture's grain about as strong as before: shots/v441-FL). Drawn GK times stronger, the layer at 1 / GK (finer steps of alpha) */
  const GR_D = 0.08, GR_L = 0.045, GK = 4;
  function gradeLayer() {
    const ar = innerHeight / Math.max(1, innerWidth), w = 96, h = Math.max(48, Math.min(288, Math.round(96 * ar)));
    const cv = layer('width:100%;height:100%;will-change:opacity;opacity:' + (flag('__FL_STILL') ? FLK_MEAN.toFixed(4) : '1') + ';', 'canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'), im = c.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {   /* (the picture is stretched over the screen: the ellipse is in its own proportions, as v440's was in the screen's) */
      const t = Math.min(1, Math.hypot(((x + 0.5) / w - 0.5) / 0.8, ((y + 0.5) / h - 0.48) / 0.74)); let k = 1; while (k < GRADE.length - 1 && GRADE[k][0] < t) k++;
      const A = GRADE[k - 1], B = GRADE[k], f = Math.max(0, Math.min(1, (t - A[0]) / (B[0] - A[0]))), i = (y * w + x) * 4;
      for (let j = 0; j < 3; j++) d[i + j] = Math.round(A[2 + j] + (B[2 + j] - A[2 + j]) * f);
      d[i + 3] = Math.round((A[1] + (B[1] - A[1]) * f) * 255);
    }
    c.putImageData(im, 0, 0); return cv;
  }
  function grainLayer() {
    const n = 128, tc = document.createElement('canvas'); tc.width = tc.height = n; const t = tc.getContext('2d'), im = t.createImageData(n, n), V = noiseVals(11);
    for (let i = 0; i < n * n; i++) { const v = V[i], a = Math.round(Math.pow(Math.abs(v - 0.5) * 2, 1.6) * 200) / 255; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v < 0.5 ? 0 : 255; im.data[i * 4 + 3] = Math.round(Math.min(1, a * (v < 0.5 ? GR_D : GR_L) * GK) * 255); }
    t.putImageData(im, 0, 0);
    /* one noise pixel a CSS px (as v440's tile), the layer a tile larger than the screen each way, jumped about by up to a tile */
    const W = Math.ceil(innerWidth) + n, H = Math.ceil(innerHeight) + n;
    const cv = layer(`inset:auto;left:0;top:0;width:${W}px;height:${H}px;will-change:transform;opacity:${(1 / GK).toFixed(3)};`, 'canvas'); cv.width = W; cv.height = H;
    const c = cv.getContext('2d'); c.fillStyle = c.createPattern(tc, 'repeat'); c.fillRect(0, 0, W, H); return cv;
  }
  /* a looping compositor animation of jumps: n values held for ms each (the jump itself a fraction of a millisecond, so the
     animation stays an ordinary keyframed one that the compositor runs) */
  function jumps(el, prop, vals, ms) {
    if (!el.animate || flag('__FL_STILL')) return;
    const n = vals.length, kf = [];
    for (let i = 0; i < n; i++) { kf.push({ offset: i / n, [prop]: vals[i] }); kf.push({ offset: (i + 1) / n - 0.0002, [prop]: vals[i] }); }
    kf.push({ offset: 1, [prop]: vals[n - 1] });
    try { ANIMS.push(el.animate(kf, { duration: n * ms, iterations: Infinity })); } catch (e) {}
  }
  function buildNew() {
    BIG = innerWidth * innerHeight * Math.pow(devicePixelRatio || 1, 2) > 4.5e6;
    /* (a computer at High keeps v440's faint softening: a touch screen never has it, as there it re-blurred the whole screen every
       frame and, at 2-3 device pixels a point, it could hardly be seen) */
    if (P.blur && !BIG) layer('backdrop-filter:blur(' + BLUR + 'px);-webkit-backdrop-filter:blur(' + BLUR + 'px);');
    if (P.grade) { warm = gradeLayer(); const v = []; for (let i = 0; i < 24; i++) v.push((FLK + Math.random() * (1 - FLK)).toFixed(3)); jumps(warm, 'opacity', v, 83); }
    if (P.grain) { grain = grainLayer(); const v = []; for (let i = 0; i < 48; i++) v.push(`translate3d(${-Math.floor(Math.random() * 128)}px,${-Math.floor(Math.random() * 128)}px,0)`); jumps(grain, 'transform', v, 83); }
    if (P.dust) dustLayer();
  }
  function clear() { ANIMS.forEach(a => { try { a.cancel(); } catch (e) {} }); ANIMS.length = 0; LAYERS.forEach(d => d.remove()); LAYERS.length = 0; warm = grain = dust = dc = null; }

  // dust and hairs, at half the screen's size (v441 FL: the canvas left alone while it has nothing to show and nothing to clear)
  function paintDust(none) {
    if (!dust) return;
    const W = Math.ceil(innerWidth / 2), H = Math.ceil(innerHeight / 2);
    if (dust.width !== W || dust.height !== H) { dust.width = W; dust.height = H; dustN = 0; }
    const n = !none && Math.random() < 0.55 ? Math.floor(Math.random() * 4) : 0;
    if (!n && !dustN) return;
    dc.clearRect(0, 0, W, H); dustN = n;
    for (let i = 0; i < n; i++) {
      const x = Math.random() * W, y = Math.random() * H, dark = Math.random() < 0.7, r = 0.6 + Math.random() * 1.6;
      dc.fillStyle = dark ? 'rgba(34,22,12,.6)' : 'rgba(255,248,230,.55)';
      if (Math.random() < 0.3) { dc.strokeStyle = dc.fillStyle; dc.lineWidth = 0.6; dc.beginPath(); dc.moveTo(x, y); dc.quadraticCurveTo(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 10, x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 14); dc.stroke(); }
      else { dc.beginPath(); dc.ellipse(x, y, r, r * (0.6 + Math.random() * 0.6), Math.random() * 3, 0, 6.283); dc.fill(); }
    }
    /* (v380) no more scratches down the frame: a faint line fading in and out over the pet read as a glitch */
  }
  /* (v441 FL) the parts this frame: by the visual quality, or the benchmark's diagnostic choice (force: { grade, grain, dust, fringe }) */
  function partsNow() {
    const L = typeof GQ !== 'undefined' ? GQ.level() : 0, hi = L === 0, F = force;
    if (F) return { grade: +!!F.grade, grain: +!!F.grain, dust: +!!F.dust, fringe: +!!(F.fringe && !DESKTOP), blur: +!!(F.grade && DESKTOP && hi) };
    return { grade: 1, grain: 1, dust: +hi, fringe: +(hi && !DESKTOP), blur: +(hi && DESKTOP) };
  }
  function frame() {
    on = typeof st === 'undefined' || !st || st.retro !== false;
    const old = flag('__FL_OFF'); if (on && !old) P = partsNow();
    const k = !on ? 'off' : old ? 'old' : [P.grade, P.grain, P.dust, P.blur, Math.ceil(innerWidth), Math.ceil(innerHeight), flag('__FL_STILL') ? 1 : 0].join(',');
    if (k !== key) { key = k; clear(); if (on && document.body) { if (old) buildOld(); else buildNew(); } }
    if (!on || document.hidden) return;
    tick++;
    if (old) tickOld(); else paintDust(flag('__FL_STILL'));
  }

  /* chromatic aberration on the game canvas, after each frame: the red of the picture is scaled out from the centre a
     touch and the rest left where it is, so the split is nothing in the middle and grows toward the edges, red one way
     and cyan the other, like an old lens. Four passes over the canvas: a copy, its red kept, the canvas's red taken out,
     the copy's red added back enlarged. (The Tower and the rifts only, whose pictures are opaque) (v441 FL: at High only) */
  let caCv = null;
  function post(cv, c) {
    try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (F && F.settle) F.settle(); } catch (e) {}   /* (v440 SQ: a run of the painter's passes still open is laid before the canvas is read) */
    if (!on || CA <= 0 || typeof arc === 'undefined' || arc.mode !== 'dungeon') return;
    if (flag('__FL_OFF') ? DESKTOP : !P.fringe) return;
    if (typeof PERF !== 'undefined' && PERF.noLens) return;   /* (v439 SP: the benchmark's diagnostic phase without this pass) */
    const w = cv.width, h = cv.height; if (!w || !h) return;
    /* (the red copy is made at half size: it is only a soft fringe, and a quarter of the pixels) */
    const tw = Math.ceil(w / 2), th = Math.ceil(h / 2);
    if (!caCv) caCv = document.createElement('canvas'); if (caCv.width !== tw || caCv.height !== th) { caCv.width = tw; caCv.height = th; }
    const t = caCv.getContext('2d');
    t.setTransform(1, 0, 0, 1, 0, 0); t.globalCompositeOperation = 'copy'; t.imageSmoothingEnabled = true; t.drawImage(cv, 0, 0, tw, th);
    t.globalCompositeOperation = 'multiply'; t.fillStyle = '#FF0000'; t.fillRect(0, 0, tw, th);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = '#00FFFF'; c.fillRect(0, 0, w, h);
    const k = 1 + 0.02 * CA * 2, dx = (w - w * k) / 2, dy = (h - h * k) / 2;
    c.globalCompositeOperation = 'lighter'; c.imageSmoothingEnabled = true; c.drawImage(caCv, dx, dy, w * k, h * k);
    c.restore();
  }
  setInterval(frame, 83);
  return { get on() { return on; }, get desktop() { return DESKTOP; }, frame, post,
    /* (v441 FL) the parts laid now, and the benchmark's choice of parts (null: by the quality) */
    get parts() { return on && !flag('__FL_OFF') ? Object.assign({}, P) : null; }, set force(v) { force = v || null; }, get force() { return force; } };
})();
