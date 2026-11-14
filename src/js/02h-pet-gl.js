/* ---------- pets drawn on the GPU in 2.5D ----------
   A pet is cut once into layers from its own drawing (petSVG's rig: what lies behind the body split where the tail
   lies, the wings, the tail, the arms and shoulder plates, the feet, the body that keeps its outline and light, and
   what faces front: the coat's pattern, belly, marks and face, one picture for each expression), each layer drawn into
   a texture only as big as what it holds. Every frame the layers are laid down far to near on a grid each, in a WebGL
   canvas of its own (one for the whole game), bent and turned in its vertex shader: the pet turns a little about its
   upright axis (yaw), the face sliding round the body, the arms and plates growing out from behind its outline, the
   back parts keeping the drawing's own order, the wings beating and the tail swinging from their roots. The frame is
   then copied into the caller's 2D canvas (PetGL.draw), so a room, the Tower or anywhere else lays it down as it laid
   down the pet's picture before. Without WebGL (or until a pet's layers are ready, or for a Legendary, whose wings and
   lights have their own beat) callers draw the pet as they always did. */
const PetGL = (() => {
  let cv = null, gl = null, U = {}, aP = -1, failed = false, G1 = null, G2 = null, gen = 0;
  const VS = `attribute vec2 aP;
uniform vec4 uBox, uBase, uView, uBend, uP, uP2; uniform vec3 uA0, uA1; uniform float uWrap, uYaw, uWhole;
varying vec2 vUV, vBase; varying float vFace;
void main() {
  vec2 p = uBox.xy + aP * uBox.zw; vUV = aP; vFace = 1.0;
  if (uBend.w > 0.0) { vec2 d = p - uBend.xy; float k = clamp(length(d) / uBend.w, 0.0, 1.0); float a = uBend.z * (0.3 + 0.7 * k * k); float c = cos(a), s = sin(a); p = uBend.xy + vec2(c * d.x - s * d.y, s * d.x + c * d.y); }
  if (uWrap > 0.0) { float x = clamp(p.x / uWrap, -0.999, 0.999), a = asin(x) + uYaw; vFace = cos(a); p.x = uWrap * sin(a); }
  p = vec2(uA0.x * p.x + uA0.y * p.y + uA0.z, uA1.x * p.x + uA1.y * p.y + uA1.z);
  vBase = (p - uBase.xy) / uBase.zw;
  if (uWhole > 0.5) { float h = clamp(-p.y / 100.0, 0.0, 1.4); p.x += uP2.x * sin(p.y * 0.055 + uP2.y) * h * h; p = vec2(p.x * uP.x, p.y * uP.y); float cr = cos(uP.z), sr = sin(uP.z); p = vec2(cr * p.x - sr * p.y, sr * p.x + cr * p.y); p.y -= uP.w; }
  gl_Position = vec4((p.x - uView.x) * uView.z, -(p.y - uView.y) * uView.w, 0.0, 1.0); }`;
  const FS = `precision mediump float;
uniform sampler2D uT, uB; uniform float uWrapF, uAlpha, uDark, uMask, uGlow; uniform vec2 uErode;
varying vec2 vUV, vBase; varying float vFace;
void main() { vec4 c = texture2D(uT, vUV);
  if (uWrapF > 0.5) c *= smoothstep(0.0, 0.3, vFace);
  if (uMask > 0.5) { vec2 e = uErode; c *= min(min(texture2D(uB, vBase + vec2(e.x, 0.0)).a, texture2D(uB, vBase - vec2(e.x, 0.0)).a), min(texture2D(uB, vBase + vec2(0.0, e.y)).a, texture2D(uB, vBase - vec2(0.0, e.y)).a)); }
  c.rgb = mix(c.rgb, vec3(0.17, 0.14, 0.2) * c.a, uDark); c.rgb += c.rgb * uGlow;
  gl_FragColor = c * uAlpha; }`;
  /* a Legendary's aurora: ribbons of its element's light rising and drifting round it, each a strip along a wavy path
     (built in the vertex shader from a few numbers), soft across, fading at its ends, shimmering with fine streaks
     that run along it and a glow that climbs it; three shades of the colour mixed along it; each ribbon fades in,
     drifts and fades out, then comes back somewhere else. Laid on with light added */
  const VSA = `attribute vec2 aP;
uniform vec4 uView, uR0, uR1, uR2; varying vec2 vUV;
void main() { float u = aP.x, v = aP.y * 2.0 - 1.0;
  float y = uR0.y - u * uR0.z, x = uR0.x + uR1.x * sin(u * uR1.y + uR1.z) + uR1.w * sin(u * uR2.x + uR2.y) + uR2.z * u * u;
  float dx = uR1.x * uR1.y * cos(u * uR1.y + uR1.z) + uR1.w * uR2.x * cos(u * uR2.x + uR2.y) + 2.0 * uR2.z * u;
  vec2 tg = normalize(vec2(dx, -uR0.z)), nr = vec2(-tg.y, tg.x); float w = uR0.w * (0.45 + 0.55 * sin(u * 3.14159));
  vec2 p = vec2(x, y) + nr * v * w; vUV = vec2(u, v);
  gl_Position = vec4((p.x - uView.x) * uView.z, -(p.y - uView.y) * uView.w, 0.0, 1.0); }`;
  const FSA = `precision mediump float;
uniform vec3 uC0, uC1, uC2; uniform vec3 uAT; uniform float uThr; varying vec2 vUV;
void main() { float u = vUV.x, v = vUV.y, T = uAT.x, S = uAT.y;
  // (a curtain: broad, with a brighter line down it; a thread: narrow, its light blurred soft across with no sharp edge)
  float across = exp(-v * v * mix(1.8, 1.3, uThr)), thread = exp(-v * v * mix(14.0, 4.5, uThr)) * mix(0.45, 0.35, uThr);
  float ends = smoothstep(0.0, 0.14, u) * (1.0 - smoothstep(0.5, 0.97, u));
  float rays = 0.45 + 0.55 * pow(0.5 + 0.5 * sin(v * 8.0 + sin(u * 6.0 + T * 1.1 + S) * 2.4 + T * 0.7), 1.6);
  float climb = 0.65 + 0.35 * sin(u * 10.0 - T * 2.2 + S * 3.0);
  float a = (across * rays * climb + thread) * ends * uAT.z;
  float m = 0.5 + 0.5 * sin(u * 3.6 + T * 0.6 + S), n = clamp(thread * 1.4 + 0.3 * sin(u * 5.0 - T * 0.9 + S * 2.0), 0.0, 1.0);
  vec3 col = mix(mix(uC0, uC1, m), uC2, n * 0.7);
  gl_FragColor = vec4(col * a, a * 0.8); }`;
  let PA = null, UA = {}, aPA = -1, PR = null;
  function init() {
    if (gl) return true; if (failed) return false;
    try {
      cv = document.createElement('canvas'); cv.width = cv.height = 256;
      gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
      if (!gl) throw new Error('no webgl');
      const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
      const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
      gl.useProgram(pr); aP = gl.getAttribLocation(pr, 'aP');
      for (const k of ['uBox', 'uBase', 'uView', 'uBend', 'uP', 'uP2', 'uA0', 'uA1', 'uWrap', 'uYaw', 'uWhole', 'uT', 'uB', 'uWrapF', 'uAlpha', 'uDark', 'uMask', 'uGlow', 'uErode']) U[k] = gl.getUniformLocation(pr, k);
      gl.uniform1i(U.uT, 0); gl.uniform1i(U.uB, 1); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
      G1 = grid(40); G2 = grid(3);
      try { const pa = gl.createProgram(); gl.attachShader(pa, sh(gl.VERTEX_SHADER, VSA)); gl.attachShader(pa, sh(gl.FRAGMENT_SHADER, FSA)); gl.linkProgram(pa);
        if (gl.getProgramParameter(pa, gl.LINK_STATUS)) { PA = pa; aPA = gl.getAttribLocation(pa, 'aP'); for (const k of ['uView', 'uR0', 'uR1', 'uR2', 'uC0', 'uC1', 'uC2', 'uAT', 'uThr']) UA[k] = gl.getUniformLocation(pa, k); } } catch (e) { PA = null; }
      PR = pr;
      // (a lost context: every pet falls back to its picture, and its layers are made again when the context returns)
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); CACHE.clear(); gen++; }, false);
      cv.addEventListener('webglcontextrestored', () => { gl = null; failed = false; CACHE.clear(); gen++; init(); }, false);
      return true;
    } catch (e) { failed = true; gl = null; return false; }
  }
  // a grid over the unit square (each layer's box): fine for what bends or wraps, coarse for the rest
  function grid(N) {
    const v = [], ix = []; for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) v.push(i / N, j / N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i; ix.push(a, a + 1, a + N + 1, a + 1, a + N + 2, a + N + 1); }
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(v), gl.STATIC_DRAW);
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ix), gl.STATIC_DRAW);
    return { vb, ib, n: ix.length };
  }

  /* ---------- a pet's layers ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  // pull the elements of the given classes out of an SVG fragment: [what is left, what was pulled, the pulled elements]
  function pull(frag, re) {
    if (!frag) return ['', '', []];
    const doc = new DOMParser().parseFromString(`<svg xmlns="${NS}"><g id="r">${frag}</g></svg>`, 'image/svg+xml'), r = doc.getElementById('r'), got = [];
    if (!r) return [frag, '', []];
    r.querySelectorAll('[class]').forEach(e => { if (re.test(e.getAttribute('class'))) got.push(e); });
    const ser = new XMLSerializer(), outs = got.filter(e => !got.some(o2 => o2 !== e && o2.contains(e)));
    const pulled = outs.map(e => { const path = []; let a = e.parentNode; while (a && a !== r) { path.unshift(a); a = a.parentNode; } let s = ser.serializeToString(e);
      for (let i = path.length - 1; i >= 0; i--) { const t = path[i].cloneNode(false); t.removeAttribute('id'); s = ser.serializeToString(t).replace(/\/>$/, '>').replace(/<\/[a-z]+>$/, '') + s + `</${t.tagName}>`; } return s; }).join('');
    const els = outs.map(e => e.cloneNode(true)); outs.forEach(e => e.remove());
    const clean = s => s.replace(/ xmlns="[^"]*"/g, '');
    return [clean(Array.from(r.childNodes).map(n => ser.serializeToString(n)).join('')), clean(pulled), els];
  }
  const FACES = { normal: { eyes: 'normal', mouth: 'smile' }, happy: { eyes: 'happy', mouth: 'open' }, hurt: { eyes: 'dizzy', mouth: 'o' }, blink: { eyes: 'closed', mouth: 'smile' } };
  const faceOf = fc => typeof fc === 'string' ? (FACES[fc] || FACES.normal) : (fc || FACES.normal);
  const faceKey = fc => { const F = faceOf(fc); return (F.eyes || 'normal') + '|' + (F.mouth || 'smile') + '|' + (F.brows || '') + '|' + (F.cheeks || ''); };
  // (frame: 'fit', the picture framed to the pet as the Tower draws it; 'room', in the room's own frame as the room's picture is)
  const opts = (E, F) => Object.assign({ static: true, frame: E.frame === 'room' ? undefined : 'fit', lite: E.lite, rig: true, rig3: true, dirt: 1 }, F);
  // the layers as SVG, from the pet's normal face
  function cut(E) {
    const f = E.form; petSVG(f, opts(E, FACES.normal)); const r = petSVG.rig, y3 = r && r.y3, SPL = petSVG.split;
    if (!y3) return null;
    // what lies behind the body, split where the tail lies: behind the tail (a mane, the aura), in front of it (ears, horns)
    let bPre = y3.back || '', bPost = '';
    if (y3.tail) { const m = y3.tail.match(/^<g transform="scale\([^)]*\)">/), pf = m ? m[0] : '', inner = m ? y3.tail.slice(pf.length, -4) : y3.tail, i = r.back.indexOf(inner);
      if (i >= 0) { bPre = r.back.slice(0, i) + (pf ? '</g>' : ''); bPost = pf + r.back.slice(i + inner.length); } }
    const [backPost] = pull(bPost, /^p-aura/), [back, aura] = pull(bPre, /^p-aura/), [auraGlow, auraRing] = pull(aura, /^p-aura-ring/);
    const [b1, halo] = pull(y3.base, /^p-halo/), [b2, dirt] = pull(b1, /^p-dirt/), [base, , orbEls] = pull(b2, /^p-orbs/);
    // (each orb alike: one is kept, at the middle, and drawn round the orbit each frame)
    let orb = null, orbit = null; const oe = orbEls[0];
    if (oe) { const ring = (oe.getAttribute('data-orbit') || '').split(' ').map(Number), ones = Array.from(oe.children).filter(n => n.tagName === 'g');
      if (ones.length && ring.length === 3) { const one = ones[0].cloneNode(true); one.removeAttribute('transform'); orb = new XMLSerializer().serializeToString(one).replace(/ xmlns="[^"]*"/g, ''); orbit = { cy: ring[1], r: ring[2], n: ones.length }; } }
    const acy = +((auraGlow.match(/cy="([-\d.]+)"/) || [])[1] || (y3.top * 0.55));
    return { vb: r.vb, defs: r.defs, base, dirt: dirt.replace(/opacity="[\d.]+"/, 'opacity="1"'), back, backPost, auraGlow, auraRing, acy, halo, orb, orbit, tail: y3.tail, tp: y3.tp, yb: y3.yb, bw: y3.bw, top: y3.top,
      arm: r.arm, armPv: r.armPv, paul: r.paul, paulPv: r.paulPv, foot: r.foot, footPv: r.footPv, wing: r.wing || null, wingPv: r.wingPv || null, feat: y3.feat, leg: legParts(SPL, f.x && f.x.leg && f.x.leg.c, elColour(f), f) };
  }
  /* a Legendary's own parts, handed back apart from its picture (petSVG.split): its pairs of wings, each beating a moment
     after the one before and closing and opening as it beats; its golden aura (turning rays, a still glow, a pulse, a
     ring); its lights circling it on tilted rings, behind it on the far side and in front on the near side. (They are
     in the picture's own units; the rig's picture is scaled by sc) */
  // the colour of the pet's element (its aurora's light), or its Legendary colour
  function elColour(f) { try { return E8[e8Of(abilityElement(f.pal))].color; } catch (e) { return f.x && f.x.leg && f.x.leg.c || '#FFD447'; } }
  // three shades of a colour, a little apart in hue: deep, itself, bright (0..1 rgb)
  function elShades(c) { const rgb = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
    try { const [h, s, l] = hex2hsl(c); return [rgb(hsl2hex(h - 16, Math.min(100, s + 10), l * 0.62)), rgb(c), rgb(hsl2hex(h + 14, s * 0.85, Math.min(94, l + 22)))]; } catch (e) { const q = rgb(c); return [q.map(v => v * 0.6), q, q.map(v => v * 0.5 + 0.5)]; } }
  function legParts(SPL, col, elc, f) {
    if (!SPL || !SPL.SP) return null;
    // (they keep the page's line colour as a CSS variable, which a picture drawn on its own does not have: set it here)
    const SP = SPL.SP, sc = SPL.sc || 1, sh3 = elShades(elc || col || '#FFD447'), ink = r => (r || '').replace(/var\(--pet-line\)/g, '#2B2433'), S = r => `<g transform="scale(${+sc.toFixed(4)})">${ink(r)}</g>`, out = { sc, aurora: sh3 };
    if (SP.wings && SP.wings.length) { out.wings = SP.wings.map(w => ({ svg: S(`<g transform="translate(${w.x0} ${w.y0}) rotate(${w.rot})">${w.g}</g>`), pv: [w.x0 * sc, w.y0 * sc], lag: w.lag || 0, k: w.k == null ? 1 : w.k, th: 180 + (w.mid || 0) }));
      out.flap = SP.flap || [8, 8]; out.beat = SP.beat || [1, 1, 1]; }
    const A = SP.aura; if (A) out.aura = { cy: A.cy * sc, rot: S(A.rot), still: S(A.still), glow: S(A.glow), glowDef: ink(A.glowDef), ring: S(A.ring) };
    // (a plain drawing, the Tower's, leaves its lights out: they are drawn here all the same when the caller asks)
    const Lt = SP.lights || (f && f.x && f.x.lights && typeof legLightGeo === 'function' ? Object.assign({ n: f.x.lights >= 4 ? 4 : 2 }, legLightGeo(f)) : null); if (Lt) { const c = col || '#FFE7A0', wc = typeof mixHex === 'function' ? mixHex(c, '#FFFFFF', 0.55) : '#FFFFFF';
      // (each light a soft glow with no edge: a white-hot heart melting through its colour into nothing)
      out.lights = { cy: Lt.cy, Rr: Lt.Rr, n: Lt.n, soft: { def: `<radialGradient id="pglL"><stop offset="0" stop-color="#FFFFFF" stop-opacity="1"/><stop offset=".1" stop-color="#FFFFFF" stop-opacity=".95"/><stop offset=".22" stop-color="${wc}" stop-opacity=".75"/><stop offset=".42" stop-color="${c}" stop-opacity=".34"/><stop offset=".68" stop-color="${c}" stop-opacity=".1"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`, one: '<circle r="16" fill="url(#pglL)"/>' },
        // (and a solid heart: a bright bead with a rim of its colour, its edge only just softened)
        core: { def: `<radialGradient id="pglC"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#FFFFFF"/><stop offset=".78" stop-color="${wc}"/><stop offset=".92" stop-color="${c}" stop-opacity=".9"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`, one: '<circle r="5.2" fill="url(#pglC)"/>' } }; }
    return out;
  }
  // an SVG fragment drawn at d pixels per unit and cut to the pixels it paints: [canvas, its box in pet units]
  function raster(vb0, defs, content, d, wide) {
    // (over the picture's frame and well round it: wings, a mane or a halo reach past the frame, and the picture lets them)
    const vb = wide ? [vb0[0] - vb0[2] * 1.4, vb0[1] - vb0[3] * 0.9, vb0[2] * 3.8, vb0[3] * 2.5] : [vb0[0] - vb0[2] * 0.5, vb0[1] - vb0[3] * 0.45, vb0[2] * 2, vb0[3] * 1.6];   // (wide: a Legendary's wings and aura reach far out and down)
    return new Promise(res => {
      if (!content) { res(null); return; }
      const W = Math.max(1, Math.min(2048, Math.round(vb[2] * d))), H = Math.max(1, Math.min(2048, Math.round(vb[3] * d))), im = new Image();
      im.onload = () => {
        try {
          const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(im, 0, 0, W, H);
          const px = g.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
          for (let y = 0; y < H; y++) { const row = y * W * 4; for (let x = 0; x < W; x++) if (px[row + x * 4 + 3] > 1) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
          if (x1 < 0) { c.width = c.height = 0; res(null); return; }
          x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
          const w = x1 - x0 + 1, h = y1 - y0 + 1, o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(c, x0, y0, w, h, 0, 0, w, h); c.width = c.height = 0;
          const ux = vb[2] / W, uy = vb[3] / H; res({ cv: o, box: [vb[0] + x0 * ux, vb[1] + y0 * uy, w * ux, h * uy] });
        } catch (e) { res(null); }
      };
      im.onerror = () => res(null);
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="${NS}" viewBox="${vb.join(' ')}" width="${W}" height="${H}"><defs>${defs}</defs>${content}</svg>`);
    });
  }
  function tex(R) {
    if (!R || !gl) return null;
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, R.cv);
    const pow2 = v => (v & (v - 1)) === 0, mip = pow2(R.cv.width) && pow2(R.cv.height);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const L = { t, box: R.box, px: R.cv.width * R.cv.height }; R.cv.width = R.cv.height = 0; return L;
  }
  const mirror = s => s ? `<g transform="scale(-1 1)">${s}</g>` : '';
  const halfClip = sd => `<clipPath id="pglh${sd < 0 ? 'L' : 'R'}"><rect x="${sd < 0 ? -999 : 0}" y="-999" width="999" height="1998"/></clipPath>`;
  async function build(E) {
    const C = cut(E); if (!C) throw new Error('no rig');
    const d = E.d, defs = C.defs + halfClip(-1) + halfClip(1) + '<filter id="pglB" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5"/></filter>', R = s => raster(C.vb, defs, s, d);
    const parts = { base: C.base, dirt: C.dirt, back: C.back, backPost: C.backPost, auraGlow: C.auraGlow, auraRing: C.auraRing, halo: C.halo, orb: C.orb, tail: C.tail, arm: C.arm, armR: mirror(C.arm),
      paul: C.paul, paulR: mirror(C.paul), foot: C.foot, footR: mirror(C.foot), wing: C.wing, wingR: mirror(C.wing) };
    const LG = C.leg;
    if (LG) {
      if (LG.wings) LG.wings.forEach((w, i) => { parts['lw' + i] = w.svg; parts['lwR' + i] = mirror(w.svg); });
      if (LG.aura) { parts.laRot = LG.aura.rot; parts.laStill = LG.aura.still; parts.laRing = LG.aura.ring;
        // (and a soft glow of each, the same picture blurred, laid under it so the crown of rays seems to shine)
        parts.laRotG = `<g filter="url(#pglB)">${LG.aura.rot}</g>`; parts.laRingG = `<g filter="url(#pglB)">${LG.aura.ring}${LG.aura.still}</g>`; }
    }
    const keys = Object.keys(parts), got = await Promise.all(keys.map(k => /^l[wa]/.test(k) ? raster(C.vb, defs, parts[k], d, true) : R(parts[k])));
    const lgx = LG ? await Promise.all([LG.aura ? raster(C.vb, C.defs + LG.aura.glowDef, LG.aura.glow, d, true) : null, LG.lights ? raster([-16, -16, 32, 32], LG.lights.soft.def, LG.lights.soft.one, d * 2) : null, LG.lights ? raster([-8, -8, 16, 16], LG.lights.core.def, LG.lights.core.one, d * 4) : null]) : [null, null, null];
    if (E.gen !== gen || !gl) throw new Error('stale');
    const L = {}; keys.forEach((k, i) => { L[k] = tex(got[i]); }); L.laGlow = tex(lgx[0]); L.light = tex(lgx[1]); L.lightCore = tex(lgx[2]);
    if (!L.base) throw new Error('no body');
    // the frame each picture of it is made in: round everything it has, with room for a raised arm, a wing's beat, a turn
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; Object.values(L).forEach(l => { if (!l) return; const b = l.box; x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[0] + b[2]); y1 = Math.max(y1, b[1] + b[3]); });
    const pf = C.leg ? 1.3 : 1.12, mx = Math.max(Math.abs(x0), Math.abs(x1)) * pf + 10, h0 = y1 - y0; E.fb = [-mx, y0 - h0 * (pf - 1) - 10, mx * 2, h0 * (pf + 0.12) + 16];   // (a Legendary's wings swing further)
    E.C = C; E.L = L; E.feats = new Map(); E.featWant = new Set();
    E.feats.set(faceKey('normal'), tex(await raster(C.vb, C.defs, C.feat, d)));
    E.ready = true;
  }
  // a face not drawn yet is made in the background; until then the normal one stands in
  function featFor(E, fc) {
    const key = faceKey(fc), hit = E.feats.get(key); if (hit !== undefined) return hit;
    if (!E.featWant.has(key)) { E.featWant.add(key);
      Promise.resolve().then(() => { petSVG(E.form, opts(E, faceOf(fc))); const r = petSVG.rig; return r && r.y3 ? raster(r.vb, r.defs, r.y3.feat, E.d) : null; })
        .then(R => { if (E.dead) { if (R) R.cv.width = R.cv.height = 0; return; } E.feats.set(key, tex(R)); }).catch(() => E.feats.set(key, null)); }
    return null;
  }

  /* ---------- the cache: a pet's layers, kept while it is drawn ---------- */
  const CACHE = new Map(), DENS = [2, 3, 4.5, 7], COST = { ema: 0, n: 0, slow: false };
  let legendOK = true;
  function dispose(E) { E.dead = true; if (!gl) return; const del = L => { if (L && L.t) gl.deleteTexture(L.t); };
    if (E.L) Object.values(E.L).forEach(del); if (E.feats) E.feats.forEach(del); E.L = null; E.feats = null; }
  // (a pet: its form's layers at about the sharpness it is drawn at; the least used are let go past a few)
  function entry(f, ppu, lite, frame) {
    if (!f || !init()) return null;
    if (f.x && f.x.gold && !legendOK) return null;   // (PetGL.legends(false): a Legendary keeps its own drawing)
    let fr; const d = DENS.find(v => v >= ppu * 1.05) || DENS[DENS.length - 1], fk = f.__glk || JSON.stringify(f), key = fk + '|' + d + '|' + (lite ? 1 : 0) + '|' + (frame || ''), t = performance.now(); fr = frame || '';
    let E = CACHE.get(key);
    if (!E) {
      // (a sharper copy of the same pet, ready already, is used rather than waiting for this one)
      for (const [, E2] of CACHE) if (E2.ready && E2.fk === fk && E2.lite === !!lite && E2.frame === fr && E2.d >= d) { E2.used = t; return E2; }
      E = { form: f, fk, d, lite: !!lite, frame: fr, gen, ready: false, used: t }; CACHE.set(key, E);
      build(E).catch(() => { E.failed = true; });
      if (CACHE.size > 8) { const old = [...CACHE.entries()].filter(([, e]) => e !== E).sort((a, b) => a[1].used - b[1].used); while (CACHE.size > 8 && old.length) { const [k3, e3] = old.shift(); dispose(e3); CACHE.delete(k3); } }
    }
    E.used = t;
    if (!E.ready) {
      // (until it is ready, a blurrier copy already made will do)
      for (const E2 of CACHE.values()) if (E2.ready && E2.fk === fk && E2.lite === !!lite && E2.frame === fr) { E2.used = t; return E2; }
      return null;
    }
    return E;
  }

  /* ---------- one frame ---------- */
  const ID = [[1, 0, 0], [0, 1, 0]], ss = (a, b, x) => { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); };
  const place = (px, py, sx, ang, dx, dy, sy) => { const c = Math.cos(ang), s = Math.sin(ang); sy = sy || 1; return [[c * sx, -s * sy, px + dx - (c * sx * px - s * sy * py)], [s * sx, c * sy, py + dy - (s * sx * px + c * sy * py)]]; };
  let curBase = null;
  function lay(L, o) {
    if (!L) return; o = o || {}; const A = o.A || ID, B = o.bend, G = o.fine ? G1 : G2, b = L.box;
    gl.bindBuffer(gl.ARRAY_BUFFER, G.vb); gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, G.ib);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, L.t);
    gl.uniform4f(U.uBox, b[0], b[1], b[2], b[3]);
    gl.uniform3fv(U.uA0, A[0]); gl.uniform3fv(U.uA1, A[1]); gl.uniform4f(U.uBend, B ? B[0] : 0, B ? B[1] : 0, B ? B[2] : 0, B ? B[3] : 0);
    gl.uniform1f(U.uWrap, o.wrap || 0); gl.uniform1f(U.uWrapF, o.wrap ? 1 : 0); gl.uniform1f(U.uWhole, o.free ? 0 : 1); gl.uniform1f(U.uAlpha, o.alpha == null ? 1 : o.alpha);
    gl.uniform1f(U.uDark, o.dark || 0); gl.uniform1f(U.uMask, o.mask && curBase ? 1 : 0); gl.uniform1f(U.uGlow, o.glow || 0);
    gl.drawElements(gl.TRIANGLES, G.n, gl.UNSIGNED_SHORT, 0);
  }
  /* the pet drawn into the 2D context c with its feet at c's origin, one unit of its picture k of c's units; c's own
     transform turns, scales and flips it as before. P, its pose (all optional):
       yaw (rad, a little either way), face ('normal' | 'happy' | 'hurt' | 'blink' | { eyes, mouth, brows, cheeks }),
       armL, armR (deg: each arm turned about its shoulder, the right mirrored), footL, footR ([dx, dy] on screen),
       tail (deg), earR (deg), wing (deg), look ([x, y], -1..1), dirt (0..1), t (s), sx, sy, lean (rad), hop (units)
     Returns false when the pet cannot be drawn this way (yet): the caller then draws it as before */
  function draw(c, f, k, P, o) {
    o = o || {};
    if (!c || !f || !(k > 0) || window.__noPetGL || COST.slow) return false;   // (__noPetGL: the old drawing, to compare)
    const m = c.getTransform ? c.getTransform() : null, ppu = k * (m ? Math.max(Math.hypot(m.a, m.b), Math.hypot(m.c, m.d), 0.25) : 1);
    const E = entry(f, ppu, o.lite, o.frame); if (!E) return false;
    P = P || {}; const C = E.C, L = E.L, t = P.t || 0;
    const yaw = clamp(P.yaw || 0, -0.62, 0.62), cw = Math.cos(yaw), sw = Math.sin(yaw), bw = C.bw || 30, nar = 0.88 + 0.12 * Math.abs(cw);
    // the frame: the picture's box with room round it for a raised arm, a beating wing, a hop
    const fb = E.fb, hop = Math.max(0, P.hop || 0), fx = fb[0], fy = fb[1] - hop, fw = fb[2], fh = fb[3] + hop;
    let W = Math.ceil(fw * ppu), H = Math.ceil(fh * ppu); const big = Math.max(W, H); if (big > 1400) { W = Math.ceil(W * 1400 / big); H = Math.ceil(H * 1400 / big); }
    if (W < 2 || H < 2) return false;
    if (cv.width < W || cv.height < H) { cv.width = Math.max(cv.width, W); cv.height = Math.max(cv.height, H); }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.viewport(0, cv.height - H, W, H);   // (all of it cleared: a copy of part of it may take in a pixel round its edge)
    gl.uniform4f(U.uView, fx + fw / 2, fy + fh / 2, 2 / fw, 2 / fh);
    const base = L.base; curBase = base;
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, base.t); gl.uniform4f(U.uBase, base.box[0], base.box[1], base.box[2], base.box[3]); gl.uniform2f(U.uErode, 3.5 / base.box[2], 3.5 / base.box[3]);
    gl.uniform4f(U.uP, (P.sx || 1) * nar, P.sy || 1, P.lean || 0, P.hop || 0); gl.uniform4f(U.uP2, P.wob || 0, P.wobPh || 0, 0, 0); gl.uniform1f(U.uYaw, yaw);
    const D = Math.PI / 180;
    // the aura: a soft glow that breathes and a ring of rays turning slowly round the pet's middle
    if (L.auraGlow || L.auraRing) { const q = 1 + 0.05 * Math.sin(t * 2.1); lay(L.auraGlow, { free: true, A: place(0, C.acy, q, 0, 0, -(P.hop || 0) * 0.6, q), alpha: 0.9 + 0.1 * Math.sin(t * 2.1) });
      lay(L.auraRing, { free: true, A: place(0, C.acy, 1, t * 0.35, 0, -(P.hop || 0) * 0.6), alpha: 0.85 }); }
    // behind the body, in the drawing's own order at every angle: behind the tail (a mane), the wings, the tail, in front of it (ears, horns)
    const zB = -0.38 * bw, card = 0.55 + 0.45 * Math.abs(cw), backA = place(0, 0, card, 0, zB * sw, 0), earBend = [0, C.top + 40, -(P.earR || 0) * D * 0.15, 90];
    // a Legendary: its golden aura, its lights on the far side of their rings, its pairs of wings (behind all of it)
    const LG = C.leg, LS = LG ? LG.sc : 1;
    // the aurora's ribbons: the far ones now, the near ones (only out at its sides) over everything at the end
    const aurora = near => { if (!LG || !LG.aurora || !PA || !o.aurora) return;   // (o.aurora: only where the caller asks for it, in the dungeons and the Rift)
      const sh3 = LG.aurora, hgt = Math.max(60, -fb[1]), mx = fb[2] / 2;
      gl.useProgram(PA); gl.uniform4f(UA.uView, fx + fw / 2, fy + fh / 2, 2 / fw, 2 / fh); gl.blendFunc(gl.ONE, gl.ONE);
      gl.bindBuffer(gl.ARRAY_BUFFER, G1.vb); gl.enableVertexAttribArray(aPA); gl.vertexAttribPointer(aPA, 2, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, G1.ib);
      const hsh = x => { const v = Math.sin(x * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
      for (let i = 0; i < 10; i++) { if ((i % 3 === 2) !== near) continue;
        const per = 5.5 + hsh(i) * 3.5, q = (t + hsh(i + 9) * per) / per, cyc = Math.floor(q), ph = q - cyc, life = Math.pow(Math.sin(Math.PI * ph), 2), s0 = hsh(i * 13 + cyc * 7.3);
        if (life < 0.01) continue;
        const side = s0 < 0.5 ? -1 : 1, x0 = side * mx * (near ? 0.55 + 0.3 * hsh(s0 + 2) : 0.15 + 0.7 * hsh(s0 + 2)) + Math.sin(t * 0.3 + i) * 6;
        const y0 = 14 - hgt * 0.12 * hsh(s0 + 3) - ph * hgt * 0.14, L = hgt * (0.7 + 0.35 * hsh(s0 + 4)), thr = hsh(s0 + 20) < 0.55, w = thr ? 4.5 + 4.5 * hsh(s0 + 5) : 16 + 16 * hsh(s0 + 5);   // (some fine threads of light, some broad curtains)
        gl.uniform4f(UA.uR0, x0, y0, L, w); gl.uniform4f(UA.uR1, 5 + 10 * hsh(s0 + 6), 3.5 + 4.5 * hsh(s0 + 7), s0 * 9 - t * (0.9 + 0.6 * hsh(s0 + 8)), 2 + 4 * hsh(s0 + 10));
        gl.uniform4f(UA.uR2, 5 + 4 * hsh(s0 + 11), s0 * 5 + t * 1.3, -side * (8 + 22 * hsh(s0 + 12)), 0);
        const o = [sh3[0], sh3[1], sh3[2]], k3 = Math.floor(hsh(s0 + 14) * 3); gl.uniform3fv(UA.uC0, o[k3 % 3]); gl.uniform3fv(UA.uC1, o[(k3 + 1) % 3]); gl.uniform3fv(UA.uC2, o[2]);
        gl.uniform1f(UA.uThr, thr ? 1 : 0); gl.uniform3f(UA.uAT, t, s0 * 10, life * (near ? 0.6 : 0.95) * (thr ? 0.75 : 1));
        gl.drawElements(gl.TRIANGLES, G1.n, gl.UNSIGNED_SHORT, 0); }
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.useProgram(PR); };
    if (LG && LG.aura) { const cy = LG.aura.cy, sp = t * 0.7, q = 1 + 0.04 * Math.sin(t * 2.1);
      gl.blendFunc(gl.ONE, gl.ONE); const gq = 1.04 + 0.02 * Math.sin(t * 2.1), ga = 0.75 + 0.2 * Math.sin(t * 2.1);
      lay(L.laRotG, { free: true, A: place(0, cy, gq, sp, 0, 0, gq), alpha: ga }); lay(L.laRingG, { free: true, A: place(0, cy, gq, 0, 0, 0, gq), alpha: ga * 0.8 }); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      lay(L.laRot, { free: true, A: place(0, cy, 1, sp, 0, 0) }); lay(L.laStill, { free: true }); lay(L.laGlow, { free: true, A: place(0, cy, q, 0, 0, 0, q), alpha: 0.85 + 0.15 * Math.sin(t * 2.1) }); lay(L.laRing, { free: true, A: place(0, cy, 1, -sp, 0, 0) }); }
    // its lights: glows added onto what is under them, each trailing a fading tail back along its orbit, so the path reads
    // all the way round; on the far side they pass behind the body (in front of the wings), dimmer, on the near side in front
    const lights = front => { if (!LG || !LG.lights || !L.light || (E.lite && !o.lights)) return;   // (o.lights: a plain drawing's caller draws them unless it asks for these)
      const Lt = LG.lights; gl.blendFunc(gl.ONE, gl.ONE);
      for (let i = 0; i < Lt.n; i++) { const ring = i >= 2 ? 1 : 0, a0 = legLightPhase(i, t), dir = ring ? -1 : 1;
        for (let j = 6; j >= 0; j--) { const Q = legLightAt(a0 - dir * j * 0.11, Lt.cy, Lt.Rr, ring); if (Q[3] !== front) continue;
          const dep = 0.82 + 0.18 * (Q[1] - Lt.cy) / (Lt.Rr * 0.32 + 1e-3) * (ring ? -1 : 1), q = 2.3 * LS * (ring ? 0.78 : 1) * (j ? 0.62 - j * 0.05 : 1) * clamp(dep, 0.75, 1.1);
          lay(L.light, { free: true, A: place(0, 0, q, 0, Q[0] * LS, Q[1] * LS - (P.hop || 0), q), alpha: (j ? 0.32 * (1 - j / 7) : 1) * (front ? 1 : 0.7) });
          if (!j && L.lightCore) { gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); lay(L.lightCore, { free: true, A: place(0, 0, q, 0, Q[0] * LS, Q[1] * LS - (P.hop || 0), q), alpha: front ? 1 : 0.85 }); gl.blendFunc(gl.ONE, gl.ONE); } } }
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); };
    if (LG && LG.wings) {
      const B = LG.beat, up = LG.flap[0], down = LG.flap[1], amp0 = P.legAmp == null ? 8 : P.legAmp, fold = Math.min(B[2] > 1.2 ? 0.62 : 0.3, amp0 / 50 * B[2]), amp = amp0 * B[1], ph = (P.legPh == null ? t * 3.2 : P.legPh) * B[0];
      const zW = -0.62 * bw, card2 = 0.5 + 0.5 * Math.abs(cw), mul = (a, b) => [a[0] * b[0] + a[1] * b[2], a[0] * b[1] + a[1] * b[3], a[2] * b[0] + a[3] * b[2], a[2] * b[1] + a[3] * b[3]], R = a => [Math.cos(a), -Math.sin(a), Math.sin(a), Math.cos(a)];
      LG.wings.forEach((w, i) => {
        // the beat: a quick downstroke and a slower lift (the wave leans), and the wing bending as it goes, its tip
        // trailing behind its root (flex, against the way it moves) and trembling a little at the top of each stroke
        // (the swing stays a smooth wave within the wings' reach, up and down: a fast flight beats wider, never stuck at
        // the ends; a feathered or dragon wing barely closes as it beats, a butterfly's folds right up)
        const x = ph - w.lag, wv = Math.sin(x + 0.3 * Math.sin(x)), dv = Math.cos(x + 0.3 * Math.sin(x)) * (1 + 0.3 * Math.cos(x));
        const a = wv * Math.min(amp, wv >= 0 ? up : down) * w.k, kk = (0.5 + 0.5 * wv) * w.k, sp = 1 - fold * kk, su = 1 - fold * 0.25 * kk;
        const flex = (clamp(-dv * amp * 0.3, -6, 6) + Math.sin(t * 23 + i * 1.7) * 1.2 * (1 - Math.abs(dv) * 0.6)) * w.k;
        [[1, L['lw' + i]], [-1, L['lwR' + i]]].forEach(([sd, tx]) => { if (!tx) return;
          const px = sd * w.pv[0], py = w.pv[1], th = w.th * sd * D, M = mul([card2, 0, 0, 1], mul(R(a * sd * D), mul(R(th), mul([su, 0, 0, sp], R(-th))))), dx = (px * cw + zW * sw) - px;
          const b = tx.box, reach = Math.max(Math.hypot(b[0] - px, b[1] - py), Math.hypot(b[0] + b[2] - px, b[1] - py), Math.hypot(b[0] - px, b[1] + b[3] - py), Math.hypot(b[0] + b[2] - px, b[1] + b[3] - py));
          lay(tx, { fine: true, bend: [px, py, flex * sd * D, reach], A: [[M[0], M[1], px + dx - (M[0] * px + M[1] * py)], [M[2], M[3], py - (M[2] * px + M[3] * py)]] }); }); });
    }
    aurora(false);
    lay(L.back, { fine: true, A: backA, bend: earBend });
    if (L.wing && C.wingPv) { const [wx, wy] = C.wingPv, zW = -0.62 * bw, card2 = 0.42 + 0.58 * Math.abs(cw), fl = (P.wing || 0) * D;
      const ws = [[1, L.wing, wx], [-1, L.wingR, -wx]]; if (sw > 0) ws.reverse();
      ws.forEach(([sd, tx, px]) => lay(tx, { fine: true, A: place(px, wy, card2, 0, (px * cw + zW * sw) - px, 0), bend: [px, wy, sd * fl, 70] })); }
    if (L.tail && C.tp) { const [tx, ty] = C.tp, zT = -0.85 * bw, ax = tx * cw + zT * sw * 0.8; lay(L.tail, { fine: true, A: place(tx, ty, 1, 0, ax - tx, 0), bend: [tx, ty, (P.tail || 0) * D, 40] }); }
    lay(L.backPost, { fine: true, A: backA, bend: earBend });
    // arms and shoulder plates: behind the body's outline (the drawing already sets them out from its side), at its sides
    // whatever the turn (the outline does not turn); a raised arm swings out clear of the body; the far side first
    if (C.armPv && (L.arm || L.paul)) {
      const ax0 = C.armPv[0], ay0 = C.armPv[1], pv = C.paulPv, sides = [[1, -(P.armL || 0) * D, L.arm, L.paul], [-1, -(P.armR || 0) * D, L.armR, L.paulR]]; if (sw > 0) sides.reverse();
      const sh = (sd, a2) => { const lift = ss(0.6, 2.2, Math.abs(a2)); return { nw: 1 - 0.15 * Math.max(0, -sd * sw), out: -sd * 9 * lift, up: -6 * lift }; };
      sides.forEach(([sd, a2, tx]) => { if (!tx) return; const q = sh(sd, a2); lay(tx, { A: place(sd * ax0, ay0, q.nw, -sd * a2, q.out, q.up) }); });
      if (pv) sides.forEach(([sd, a2, , tx]) => { if (!tx) return; const q = sh(sd, a2); lay(tx, { A: place(sd * pv[0], pv[1], q.nw, -sd * a2 * 0.18, q.out, q.up * 0.6) }); });
    }
    lights(false);
    // the body; what faces front slides round it with the turn and keeps inside its outline; the dirt on it
    lay(base, { fine: true });
    if (L.dirt && P.dirt > 0.01) lay(L.dirt, { fine: true, alpha: Math.min(1, P.dirt) });
    const fe = featFor(E, P.face || 'normal') || E.feats.get(faceKey('normal')), lk = P.look || [0, 0];
    gl.uniform1f(U.uYaw, yaw * 0.62); lay(fe, { fine: true, wrap: bw * 1.08, mask: true, A: place(0, 0, 1, 0, 0, lk[1] * 3) }); gl.uniform1f(U.uYaw, yaw);
    // the feet on the floor, forward of the middle; the far one first
    if (L.foot && C.footPv) { const lx = -C.footPv[0], zF = 0.32 * bw, fs = [[1, P.footL || [0, 0]], [-1, P.footR || [0, 0]]]; if (sw > 0) fs.reverse();
      fs.forEach(([sd, ft]) => { const x = -sd * lx, xs = x * cw + zF * sw; lay(sd < 0 ? L.footR : L.foot, { A: place(0, 0, 1, 0, xs - x + ft[0], ft[1]) }); }); }
    // orbs of light round its middle (behind it on the far side), the halo or crown bobbing over its head
    if (L.orb && C.orbit) { const O = C.orbit; for (let i = 0; i < O.n; i++) { const a = t * 1.2 + i * Math.PI * 2 / O.n; lay(L.orb, { free: true, A: place(0, 0, 1, 0, Math.cos(a + yaw) * O.r, O.cy + Math.sin(a) * O.r * 0.5 - (P.hop || 0)), alpha: Math.sin(a) < -0.2 ? 0.55 : 1 }); } }
    lights(true);
    aurora(true);
    if (L.halo) lay(L.halo, { A: place(0, 0, 1, 0.03 * Math.sin(t * 1.3), 0, -Math.sin(t * 1.9) * 2), glow: 0.15 + 0.15 * Math.max(0, Math.sin(t * 3.1)) });
    // laid into the caller's picture where the pet's picture went
    const tg = performance.now();
    c.drawImage(cv, 0, 0, W, H, fx * k, fy * k, fw * k, fh * k);
    // (on a device where handing the frame over is slow, every pet goes back to its picture for the rest of the visit)
    const dt = performance.now() - tg; COST.ema = COST.n ? COST.ema * 0.92 + dt * 0.08 : dt; COST.n++;
    if (COST.n > 40 && COST.ema > 3.5 && !window.__forcePetGL) COST.slow = true;
    return true;
  }
  // (whether draw would draw this pet now, its layers made: a caller that draws a Legendary's lights itself otherwise)
  const will = (f, lite, frame) => { if (!f || !gl || window.__noPetGL || COST.slow || (f.x && f.x.gold && !legendOK)) return false;
    const fk = f.__glk || JSON.stringify(f), fr = frame || ''; for (const E2 of CACHE.values()) if (E2.ready && E2.fk === fk && E2.lite === !!lite && E2.frame === fr) return true; return false; };
  // (the frame a pet's picture is drawn in, in its units, once its layers are made: [x, y, w, h])
  const box = (f, lite, frame) => { if (!f || !gl) return null; const fk = f.__glk || JSON.stringify(f), fr = frame || ''; for (const E2 of CACHE.values()) if (E2.ready && E2.fk === fk && E2.lite === !!lite && E2.frame === fr) return E2.fb; return null; };
  return { cost: COST, legends: on => { legendOK = !!on; }, will, box, draw, ready: f => { const E = f && init() ? entry(f, 2, false) : null; return !!E; }, available: () => init(), get cache() { return CACHE; } };
})();
