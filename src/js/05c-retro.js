/* ---------- the old-film look: an analog colour grade and a film filter laid over the whole game ----------
   (v442 FM) v440's look, the one the user chose, back exactly, without what made it cost half the frame rate on the iPhone.
   v440 (60 -> 34 fps on the user's iPhone): a backdrop blur over the whole page (on iOS the screen under it is captured and blurred
   again every frame), then a warm radial vignette (mix-blend multiply, opacity .52-.58 flickering), a grey wash (saturation .09), a
   brown lift (screen .05), grain (a noise tile, overlay .15), dust, and the lens fringe on the Tower's canvas; the flicker and the
   grain moved by style writes 12 times a second (each grain move a repaint of a full-screen layer). v441 replaced the grade by one
   plain-alpha picture: cheap, but the user found the look gone (an alpha layer cannot multiply the picture warm or take its colour
   down; the fit ended nearly transparent in the middle).
   v442 lays v440's own operations again (the same colours, modes and strengths: the same picture), only applied cheaply:
   A (the default) v440's blend layers, without the backdrop blur on touch screens (a computer at High keeps it, as before); the
       same elements with the same CSS backgrounds (static), the flicker an opacity animation and the grain a transform animation the
       compositor runs (no style write, no repaint a frame); the grey and the brown washes plain colour layers (nothing painted).
       The lift cannot be folded into the vignette exactly: the saturation wash lies between them and is not linear; so four blend
       layers, as v440, the blur and the repaints gone.
   B  the grade and the grain drawn inside the Tower's and rifts' canvas at the end of each frame, with the same operations
       (globalCompositeOperation multiply / saturation / screen / overlay: four passes over the canvas, no compositor blending over
       it), and v440's layers kept only over the HUD's strip above the canvas (small). Elsewhere (the town, menus, a paused or a
       finished stage) as A. For the benchmark (Settings > Run benchmark) to compare on the phone.
   soft: v440's faint softening without a backdrop: CSS blur on the game's canvas element itself (the HUD sharp). Off by default on a
       touch screen (the canvas, drawn at 2 px a point and enlarged on a 3x screen, is soft already); the benchmark measures it.
   By the visual quality (GQ, 09c): High A with all of it and the fringe (touch screens); Balanced A without the fringe;
   Performance A without the fringe and the grey 'saturation' wash (the faintest layer, and the costliest blend). Dust everywhere.
   window.__FL_OFF = 1: v440's layers and lens; window.__FM_OFF = 1: v441's; window.__FM_MODE = 'B': B as the default;
   window.__FM_SOFT = 1: the softening on; window.__FL_STILL = 1: grain, flicker and dust held still (tests).
   (v441 FL's notes, its layers kept below for __FM_OFF:) one plain-alpha grade picture by radius, plain-alpha grain jumped by a
   compositor transform, compositor flicker, dust repainted only when it changes, the fringe at High only. */
const retro = (() => {
  const BLUR = 0.48, CA = 0.10;   /* the blur in px; the chromatic aberration's strength (0..1: 1 is a 2% split at the edges) */
  const flag = k => { try { return typeof window !== 'undefined' && window[k] === 1; } catch (e) { return false; } };
  let on = false, tick = 0, key = '', P = { m: '', grade: 0, grain: 0, dust: 0, fringe: 0, blur: 0 }, force = null;
  let warm = null, grain = null, dust = null, dc = null, dustN = 0, tiles = [];
  const LAYERS = [], ANIMS = [];
  function noiseVals(seed) { const n = 128, R = mulberry32(seed), v = new Float32Array(n * n); for (let i = 0; i < n * n; i++) v[i] = R(); return v; }
  /* v440's noise tile: black or white, alpha |v - .5|^1.6 * 200 (v442 FM: as a canvas too, for the grain canvas and B's pattern) */
  function tileCanvas(seed) {
    const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d'), im = c.createImageData(n, n), V = noiseVals(seed);
    for (let i = 0; i < n * n; i++) { const v = V[i], g = v < 0.5 ? 0 : 255, a = Math.abs(v - 0.5) * 2; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = g; im.data[i * 4 + 3] = Math.round(Math.pow(a, 1.6) * 200); }
    c.putImageData(im, 0, 0); return cv;
  }
  function noiseTile(seed) { return tileCanvas(seed).toDataURL(); }   // (v440's tile, as a picture for a CSS background)
  // (each layer sits straight on the page, in its stacking context: a wrapper with a z-index would make a context of its
  // own, and the layers would blend with nothing but each other) (v442 FM: data-fm names the layer's part, for tests)
  function layer(css, tag, role) { const d = document.createElement(tag || 'div'); d.className = 'retroFx'; d.setAttribute('aria-hidden', 'true'); if (role) d.dataset.fm = role; d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;' + css; document.body.appendChild(d); LAYERS.push(d); return d; }
  /* on a desktop computer (a mouse, no touch screen) the film look is laid on without its chromatic aberration: the user
     found the iMac's lag went with it (27 Oct) */
  const DESKTOP = (() => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches && !(navigator.maxTouchPoints > 0); } catch (e) { return false; } })();
  let BIG = false;
  function dustLayer() { dust = layer('width:100%;height:100%;z-index:2147483001;opacity:.75;', 'canvas', 'dust'); dc = dust.getContext('2d'); dustN = -1; }

  /* ---- v440's layers (window.__FL_OFF = 1, and the benchmark's 'film v440') ---- */
  function buildOld() {
    BIG = innerWidth * innerHeight * Math.pow(devicePixelRatio || 1, 2) > 4.5e6;   /* a 5K iMac's window, a big monitor */
    // 0 the faintest softening of everything under it (a third of a pixel), as an old screen's picture is never quite sharp
    // (not on a very big screen: a full-screen blur of a 5K display every frame is a heavy load, and there the game's
    // canvas, drawn smaller and enlarged, is soft already)
    if (!BIG) layer('backdrop-filter:blur(' + BLUR + 'px);-webkit-backdrop-filter:blur(' + BLUR + 'px);', 0, 'blur');
    warm = layer('background:radial-gradient(ellipse 80% 74% at 50% 48%, #FFF6E4 0%, #FBEBCB 52%, #D9B98A 82%, #7A5A3C 100%);mix-blend-mode:multiply;opacity:.55;', 0, 'warm');
    // (the two faintest layers stay off on a very big screen: 'saturation' is the costliest blend of all to composite)
    if (!BIG) { layer('background:#8A8478;mix-blend-mode:saturation;opacity:.09;', 0, 'sat'); layer('background:#3B2A1A;mix-blend-mode:screen;opacity:.05;', 0, 'lift'); }
    if (!tiles.length) tiles = [11, 23, 37].map(noiseTile);
    grain = layer(`background-image:url(${tiles[0]});background-size:128px 128px;mix-blend-mode:overlay;opacity:.15;`, 0, 'grain');
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

  /* ---- (v441 FL) the plain-alpha layers (window.__FM_OFF = 1, and the benchmark's 'film v441') ---- */
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
    const cv = layer('width:100%;height:100%;will-change:opacity;opacity:' + (flag('__FL_STILL') ? FLK_MEAN.toFixed(4) : '1') + ';', 'canvas', 'grade441'); cv.width = w; cv.height = h;
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
    const cv = layer(`inset:auto;left:0;top:0;width:${W}px;height:${H}px;will-change:transform;opacity:${(1 / GK).toFixed(3)};`, 'canvas', 'grain441'); cv.width = W; cv.height = H;
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
  function build441() {
    BIG = innerWidth * innerHeight * Math.pow(devicePixelRatio || 1, 2) > 4.5e6;
    /* (a computer at High keeps v440's faint softening: a touch screen never has it, as there it re-blurred the whole screen every
       frame and, at 2-3 device pixels a point, it could hardly be seen) */
    if (P.blur && !BIG) layer('backdrop-filter:blur(' + BLUR + 'px);-webkit-backdrop-filter:blur(' + BLUR + 'px);', 0, 'blur');
    if (P.grade) { warm = gradeLayer(); const v = []; for (let i = 0; i < 24; i++) v.push((FLK + Math.random() * (1 - FLK)).toFixed(3)); jumps(warm, 'opacity', v, 83); }
    if (P.grain) { grain = grainLayer(); const v = []; for (let i = 0; i < 48; i++) v.push(`translate3d(${-Math.floor(Math.random() * 128)}px,${-Math.floor(Math.random() * 128)}px,0)`); jumps(grain, 'transform', v, 83); }
    if (P.dust) dustLayer();
  }

  /* ---- (v442 FM) v440's grade and grain, applied cheaply ---- */
  const WARM = [[0, '#FFF6E4'], [0.52, '#FBEBCB'], [0.82, '#D9B98A'], [1, '#7A5A3C']], WARM_CSS = '#FFF6E4 0%, #FBEBCB 52%, #D9B98A 82%, #7A5A3C 100%';
  const SAT = ['#8A8478', 0.09], LIFT = ['#3B2A1A', 0.05], GRAIN_A = 0.15, FL0 = 0.52, FL1 = 0.58, FLM = 0.55;
  /* v440's vignette (radial-gradient(ellipse 80% 74% at 50% 48%) of a vw x vh screen: radii 80% of the width and 74% of the height),
     the part of it over the rectangle x0, y0, cw, ch (CSS px) painted into a w x h picture */
  function warmPaint(c, w, h, vw, vh, x0, y0, cw, ch) {
    const sx = w / cw, sy = h / ch, rx = 0.8 * vw, ry = 0.74 * vh, cx = 0.5 * vw, cy = 0.48 * vh;
    c.setTransform(sx * rx, 0, 0, sy * ry, (cx - x0) * sx, (cy - y0) * sy);
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); for (const [o, col] of WARM) g.addColorStop(o, col);
    c.fillStyle = g; c.fillRect((x0 - cx) / rx, (y0 - cy) / ry, cw / rx, ch / ry); c.setTransform(1, 0, 0, 1, 0, 0);
  }
  /* the flicker: v440's multiply opacity, .52-.58, a new value every 83 ms, as a compositor animation (24 values, a 2 s loop) */
  function flicker(el) { const v = []; for (let i = 0; i < 24; i++) v.push((FL0 + Math.random() * (FL1 - FL0)).toFixed(3)); jumps(el, 'opacity', v, 83); }
  const still = () => flag('__FL_STILL');
  /* A: v440's four blend layers over the whole screen (or, under B, over the strip(s) outside the game's canvas: y0, h) */
  function blendLayers(y0, h) {
    const vw = innerWidth, vh = innerHeight, full = y0 == null, pos = full ? '' : `inset:auto;left:0;top:${y0}px;width:100%;height:${h}px;`;
    /* (every blend layer an element with a CSS background, as v440's, which the user's iPhone showed: no canvas, whose allocation can
       fail silently on iOS once the page's canvases near Safari's total, leaving a blank layer: a possible reason v441's canvases
       showed nothing there) */
    if (!tiles.length) tiles = [11, 23, 37].map(noiseTile);
    /* the vignette: v440's own gradient (the strip's part of it, in px, under B), static, multiply; its flicker the compositor's */
    warm = layer(pos + `background:radial-gradient(${full ? 'ellipse 80% 74% at 50% 48%' : `ellipse ${0.8 * vw}px ${0.74 * vh}px at ${0.5 * vw}px ${0.48 * vh - y0}px`}, ${WARM_CSS});mix-blend-mode:multiply;will-change:opacity;opacity:${FLM};`, 0, 'warm');
    flicker(warm);
    if (P.sat) layer(pos + `background:${SAT[0]};mix-blend-mode:saturation;opacity:${SAT[1]};`, 0, 'sat');   /* (plain colour layers: nothing painted) */
    layer(pos + `background:${LIFT[0]};mix-blend-mode:screen;opacity:${LIFT[1]};`, 0, 'lift');
    if (!P.grain) return;
    if (!full) { layer(pos + `background-image:url(${tiles[0]});background-size:128px 128px;background-position:0px ${-y0}px;mix-blend-mode:overlay;opacity:${GRAIN_A};`, 0, 'grain'); return; }   /* (the HUD's strip: still grain) */
    /* the grain: v440's tile (overlay .15) on a layer a tile larger than the screen each way, painted once and jumped about by a
       compositor transform animation (48 jumps, 4 s): no repaint and no style write a frame (v440 moved its background-position 12
       times a second: a repaint of a full-screen layer each time). (v440's tile swap every third tick always chose the first tile:
       tick % 3 === 0 there; so one tile is v440's grain) */
    const n = 128, W = Math.ceil(vw) + n, H = Math.ceil(vh) + n;
    grain = layer(`inset:auto;left:0;top:0;width:${W}px;height:${H}px;background-image:url(${tiles[0]});background-size:128px 128px;mix-blend-mode:overlay;opacity:${GRAIN_A};will-change:transform;`, 0, 'grain');
    const v = []; for (let i = 0; i < 48; i++) v.push(`translate3d(${-Math.floor(Math.random() * n)}px,${-Math.floor(Math.random() * n)}px,0)`); jumps(grain, 'transform', v, 83);
  }
  /* soft: the blur on the game's canvases themselves (v440's 0.48 px, which it laid on the whole page from behind a backdrop) */
  const SOFT = [];
  function softOn() { for (const id of ['arcCanvas', 'townCv']) { const e = document.getElementById(id); if (e) { SOFT.push([e, e.style.filter]); e.style.filter = 'blur(' + BLUR + 'px)'; } } }
  /* B: where the game's canvas grades itself (the Tower and the rifts, playing: no overlay over it): its CSS rectangle, or null */
  let bG = null, bA = FLM, bOx = 0, bOy = 0, bPic = null, bPicK = '', bTile = null, bPat = null, bPatC = null;
  function bWhere() {
    if (P.m !== 'B' || typeof arc === 'undefined' || !arc.open || arc.mode !== 'dungeon' || arc.state !== 'play' || !arc.W || !arc.H) return null;   /* (not while loading, ready or finished: A then) */
    try { if (!arcReady.hidden || !arcPanel.hidden || arcEl.hidden) return null; } catch (e) { return null; }
    return { ct: parseFloat(arcCanvas.style.top) || 0, cw: arc.W, ch: arc.H };
  }
  function buildNew(G) {
    BIG = innerWidth * innerHeight * Math.pow(devicePixelRatio || 1, 2) > 4.5e6;
    if (P.blur && !BIG && !G) layer('backdrop-filter:blur(' + BLUR + 'px);-webkit-backdrop-filter:blur(' + BLUR + 'px);', 0, 'blur');   /* (a computer at High, as v440/v441) */
    if (P.grade) { if (!G) blendLayers(); else { const y1 = G.ct + G.ch; if (G.ct >= 0.5) blendLayers(0, G.ct); if (innerHeight - y1 >= 0.5) blendLayers(y1, innerHeight - y1); } }
    if (P.dust) dustLayer();
    if (P.soft) softOn();
  }
  /* B's passes over the canvas (after the lens, as v440's layers lay over the lens): the vignette multiplied at the flicker's opacity,
     the grey 'saturation' wash, the brown 'screen' lift and the grain 'overlay', with v440's colours and strengths; the canvas's
     rectangle in the screen's coordinates (the vignette and the grain where v440 laid them) */
  function gradeCanvas(cv, c) {
    const G = bG, w = cv.width, h = cv.height; if (!G || !w || !h) return;
    const vw = innerWidth, vh = innerHeight, k = [w, h, G.ct, G.cw, G.ch, vw, vh].join(',');
    if (k !== bPicK) { bPicK = k; if (!bPic) bPic = document.createElement('canvas'); bPic.width = Math.ceil(w / 2); bPic.height = Math.ceil(h / 2); warmPaint(bPic.getContext('2d'), bPic.width, bPic.height, vw, vh, 0, G.ct, G.cw, G.ch); }
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = true;
    c.globalCompositeOperation = 'multiply'; c.globalAlpha = bA; c.drawImage(bPic, 0, 0, w, h);
    if (P.sat) { c.globalCompositeOperation = 'saturation'; c.globalAlpha = SAT[1]; c.fillStyle = SAT[0]; c.fillRect(0, 0, w, h); }
    c.globalCompositeOperation = 'screen'; c.globalAlpha = LIFT[1]; c.fillStyle = LIFT[0]; c.fillRect(0, 0, w, h);
    if (P.grain) {
      if (!bTile) bTile = tileCanvas(11); if (bPatC !== c) { bPatC = c; bPat = c.createPattern(bTile, 'repeat'); }
      const ox = bOx, oy = bOy - G.ct;   /* (the tile's origin at the screen's (bOx, bOy), as v440's background-position) */
      c.setTransform(w / G.cw, 0, 0, h / G.ch, 0, 0); c.translate(ox, oy);
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = GRAIN_A; c.fillStyle = bPat; c.fillRect(-ox, -oy, G.cw, G.ch);
    }
    c.restore();
  }
  function clear() { ANIMS.forEach(a => { try { a.cancel(); } catch (e) {} }); ANIMS.length = 0; LAYERS.forEach(d => d.remove()); LAYERS.length = 0; warm = grain = dust = dc = null;
    SOFT.forEach(([e, f]) => { e.style.filter = f; }); SOFT.length = 0; }   /* v442 FM */

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
  /* (v442 FM) the look now: v440's (__FL_OFF, the benchmark's 'v440'), v441's (__FM_OFF, 'v441'), or v442's by the visual quality
     (or the benchmark's choice, force: { m: 'A' | 'As' (A + soft) | 'B' | 'v441' | 'v440' | 'fringe' (the lens alone) }) */
  const isOld = () => flag('__FL_OFF') || !!(force && force.m === 'v440');
  function partsNow() {
    const L = typeof GQ !== 'undefined' ? GQ.level() : 0, hi = L === 0, m = force ? force.m : null, T = +!DESKTOP;
    if (m === 'v441' || (!m && flag('__FM_OFF'))) return m ? { m: 'v441', grade: 1, grain: 1, dust: 1, fringe: T, blur: +(hi && DESKTOP) } : { m: 'v441', grade: 1, grain: 1, dust: +hi, fringe: +(hi && T), blur: +(hi && DESKTOP) };
    if (m === 'fringe') return { m, fringe: T };
    if (m) return { m: m === 'B' ? 'B' : 'A', grade: 1, sat: 1, grain: 1, dust: 1, fringe: T, blur: +(hi && DESKTOP && m !== 'B'), soft: +(m === 'As') };
    let M = 'A'; try { if (window.__FM_MODE === 'B') M = 'B'; } catch (e) {}
    return { m: M, grade: 1, sat: +(L < 2), grain: 1, dust: 1, fringe: +(hi && T), blur: +(hi && DESKTOP && M === 'A'), soft: +flag('__FM_SOFT') };
  }
  /* the layers laid again when what they are changes (the look's parts, the screen's size, B's canvas rectangle) */
  function sync() {
    on = typeof st === 'undefined' || !st || st.retro !== false;
    const old = isOld(); if (on && !old) P = partsNow();
    const G = on && !old ? bWhere() : null;
    const k = !on ? 'off' : old ? 'old' : [P.m, P.grade, P.sat, P.grain, P.dust, P.blur, P.soft, Math.ceil(innerWidth), Math.ceil(innerHeight), still() ? 1 : 0, G ? [G.ct, G.cw, G.ch].join('/') : '-'].join(',');
    if (k !== key) { key = k; clear(); bG = G; if (on && document.body) { if (old) buildOld(); else if (P.m === 'v441') build441(); else buildNew(G); } }
    return old;
  }
  function frame() {
    const old = sync();
    if (!on || document.hidden) return;
    tick++;
    if (old) { tickOld(); return; }
    if (bG) { if (still()) { bA = FLM; bOx = bOy = 0; } else { bA = FL0 + Math.random() * (FL1 - FL0); bOx = Math.floor(Math.random() * 128); bOy = Math.floor(Math.random() * 128); } }   /* (B: v440's flicker and grain jumps, as numbers for the canvas passes) */
    paintDust(still());
  }

  /* chromatic aberration on the game canvas, after each frame: the red of the picture is scaled out from the centre a
     touch and the rest left where it is, so the split is nothing in the middle and grows toward the edges, red one way
     and cyan the other, like an old lens. Four passes over the canvas: a copy, its red kept, the canvas's red taken out,
     the copy's red added back enlarged. (The Tower and the rifts only, whose pictures are opaque) (v441 FL: at High only)
     (v442 FM: then B's grade, when B is laid) */
  let caCv = null;
  function post(cv, c) {
    try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (F && F.settle) F.settle(); } catch (e) {}   /* (v440 SQ: a run of the painter's passes still open is laid before the canvas is read) */
    if (!on || typeof arc === 'undefined' || arc.mode !== 'dungeon') return;
    const old = P.m === 'B' && !isOld() ? sync() : isOld();   /* (v442 FM: B follows the arcade's overlays at once: no frame graded twice or not at all) */
    if (on && CA > 0 && !(old ? DESKTOP : !P.fringe) && !(typeof PERF !== 'undefined' && PERF.noLens)) lens(cv, c);   /* (v439 SP: PERF.noLens, the benchmark's diagnostic phase without this pass) */
    if (on && !old && bG) gradeCanvas(cv, c);
  }
  function lens(cv, c) {
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
    /* (v441 FL) the parts laid now (v442 FM: with m, the way: A, B or v441), and the benchmark's choice (null: by the quality) */
    get parts() { return on && !isOld() ? Object.assign({}, P) : null; }, get mode() { return !on ? 'off' : isOld() ? 'v440' : P.m + (P.m === 'B' && !bG ? '(A here)' : '') + (P.soft ? '+soft' : ''); },
    set force(v) { force = v || null; }, get force() { return force; } };
})();
