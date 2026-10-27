/* ---------- the old-film look: an analog colour grade and a film filter laid over the whole game ----------
   Five layers, fixed over everything and deaf to taps, so they cost the game nothing but compositing:
   1 a warm wash multiplied over the picture, darkening to a brown vignette at the edges;
   2 a grey 'saturation' wash that takes the edge off the colours, as old prints do;
   3 a faint brown 'screen' that lifts the blacks, so nothing is ever quite black;
   4 film grain: tiles of noise, re-rolled and jumped about every few frames;
   5 dust, hairs and the odd scratch down the frame, on a small canvas repainted a dozen times a second;
   and a slight flicker of the light. Settings: "Old film look" (st.retro, on unless turned off). */
const retro = (() => {
  const BLUR = 0.48, CA = 0.10;   /* the blur in px; the chromatic aberration's strength (0..1: 1 is a 2% split at the edges) */
  let root = null, warm = null, grain = null, dust = null, dc = null, tiles = [], on = false, tick = 0, scratch = null;
  function noiseTile(seed) {
    const n = 128, cv = document.createElement('canvas'); cv.width = cv.height = n; const c = cv.getContext('2d'), im = c.createImageData(n, n), R = mulberry32(seed);
    for (let i = 0; i < n * n; i++) { const v = R(), g = v < 0.5 ? 0 : 255, a = Math.abs(v - 0.5) * 2; im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = g; im.data[i * 4 + 3] = Math.round(Math.pow(a, 1.6) * 200); }
    c.putImageData(im, 0, 0); return cv.toDataURL();
  }
  // (each layer sits straight on the page, in its stacking context: a wrapper with a z-index would make a context of its
  // own, and the layers would blend with nothing but each other)
  const LAYERS = [];
  function layer(css) { const d = document.createElement('div'); d.className = 'retroFx'; d.setAttribute('aria-hidden', 'true'); d.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483000;' + css; document.body.appendChild(d); LAYERS.push(d); return d; }
  /* on a desktop computer (a mouse, no touch screen) the film look is laid on without its chromatic aberration: the user
     found the iMac's lag went with it (27 Oct) */
  const DESKTOP = (() => { try { return matchMedia('(hover: hover) and (pointer: fine)').matches && !(navigator.maxTouchPoints > 0); } catch (e) { return false; } })();
  let BIG = false;
  function build() {
    BIG = innerWidth * innerHeight * Math.pow(devicePixelRatio || 1, 2) > 4.5e6;   /* a 5K iMac's window, a big monitor */
    root = true;
    // 0 the faintest softening of everything under it (a third of a pixel), as an old screen's picture is never quite sharp
    // (not on a very big screen: a full-screen blur of a 5K display every frame is a heavy load, and there the game's
    // canvas, drawn smaller and enlarged, is soft already)
    if (!BIG) layer('backdrop-filter:blur(' + BLUR + 'px);-webkit-backdrop-filter:blur(' + BLUR + 'px);');
    warm = layer('background:radial-gradient(ellipse 80% 74% at 50% 48%, #FFF6E4 0%, #FBEBCB 52%, #D9B98A 82%, #7A5A3C 100%);mix-blend-mode:multiply;opacity:.55;');
    // (the two faintest layers stay off on a very big screen: 'saturation' is the costliest blend of all to composite)
    if (!BIG) { layer('background:#8A8478;mix-blend-mode:saturation;opacity:.09;'); layer('background:#3B2A1A;mix-blend-mode:screen;opacity:.05;'); }
    tiles = [11, 23, 37].map(noiseTile);
    grain = layer(`background-image:url(${tiles[0]});background-size:128px 128px;mix-blend-mode:overlay;opacity:.15;`);
    dust = document.createElement('canvas'); dust.className = 'retroFx'; dust.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2147483001;opacity:.75;'; document.body.appendChild(dust); LAYERS.push(dust); dc = dust.getContext('2d');
  }
  // dust and scratches, at half the screen's size
  function paintDust() {
    const W = Math.ceil(innerWidth / 2), H = Math.ceil(innerHeight / 2);
    if (dust.width !== W || dust.height !== H) { dust.width = W; dust.height = H; }
    dc.clearRect(0, 0, W, H);
    const n = Math.random() < 0.55 ? Math.floor(Math.random() * 4) : 0;
    for (let i = 0; i < n; i++) {
      const x = Math.random() * W, y = Math.random() * H, dark = Math.random() < 0.7, r = 0.6 + Math.random() * 1.6;
      dc.fillStyle = dark ? 'rgba(34,22,12,.6)' : 'rgba(255,248,230,.55)';
      if (Math.random() < 0.3) { dc.strokeStyle = dc.fillStyle; dc.lineWidth = 0.6; dc.beginPath(); dc.moveTo(x, y); dc.quadraticCurveTo(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 10, x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 14); dc.stroke(); }
      else { dc.beginPath(); dc.ellipse(x, y, r, r * (0.6 + Math.random() * 0.6), Math.random() * 3, 0, 6.283); dc.fill(); }
    }
    // a scratch running down the frame now and then, holding for a few frames and wandering a little
    if (!scratch && Math.random() < 0.04) scratch = { x: Math.random() * W, life: 3 + Math.floor(Math.random() * 6), light: Math.random() < 0.6 };
    if (scratch) { scratch.x += (Math.random() - 0.5) * 2; dc.strokeStyle = scratch.light ? 'rgba(255,248,230,.35)' : 'rgba(34,22,12,.35)'; dc.lineWidth = 0.7; dc.beginPath(); dc.moveTo(scratch.x, 0); dc.lineTo(scratch.x + (Math.random() - 0.5) * 3, H); dc.stroke(); if (--scratch.life <= 0) scratch = null; }
  }
  function frame() {
    const want = typeof st === 'undefined' || !st || st.retro !== false;
    if (want !== on) { on = want; if (on && !root) build(); if (root) LAYERS.forEach(d => { d.style.display = on ? '' : 'none'; }); }
    if (!on || document.hidden) return;
    tick++;
    // the grain jumps every frame of this timer; the tile itself changes every third
    grain.style.backgroundPosition = `${Math.floor(Math.random() * 128)}px ${Math.floor(Math.random() * 128)}px`;
    if (tick % 3 === 0) grain.style.backgroundImage = `url(${tiles[tick % tiles.length]})`;
    // the light flickers a touch
    warm.style.opacity = (0.52 + Math.random() * 0.06).toFixed(3);
    paintDust();
  }

  /* chromatic aberration on the game canvas, after each frame: the red of the picture is scaled out from the centre a
     touch and the rest left where it is, so the split is nothing in the middle and grows toward the edges, red one way
     and cyan the other, like an old lens. Four passes over the canvas: a copy, its red kept, the canvas's red taken out,
     the copy's red added back enlarged. (The Tower and the rifts only, whose pictures are opaque) */
  let caCv = null;
  function post(cv, c) {
    if (!on || CA <= 0 || DESKTOP || typeof arc === 'undefined' || arc.mode !== 'dungeon') return;
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
  return { get on() { return on; }, get desktop() { return DESKTOP; }, frame, post };
})();
