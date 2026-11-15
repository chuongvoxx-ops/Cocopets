/* ---------- (v381) The world map's ground, painted on the GPU ----------
   WorldMap.bake hands this a few plain pictures of the chart, drawn in 2D at the bake's size or less: where the land is
   (white on black; the lake black again), the colours of its regions, its relief (red: height, the mountains as soft
   peaks; green: the dunes; blue: the snow), and where its woods and marshes lie (red: forest; green: marsh). The GPU
   blurs the land's outline twice (a narrow blur for the shore, a wide one for the sea's depth and its swells) and then
   paints every pixel once, as an illustrated travellers' chart: a sea deep teal far out and turquoise in the shallows,
   painted in soft strokes, ripple lines following every shore outward, little inked waves, white surf and a sand rim;
   the land in its regions' colours, grained and brushed, lit from the top left over its relief (hills rolling
   everywhere, mountains rising rocky and snow-capped), woods as a dense canopy of lit crowns, dunes in ridged bands,
   marshes speckled with pools and reeds, snow fields; an inked coastline; all on fibred parchment. The picture comes
   back as a canvas the 2D bake draws its trees, peaks, rivers, roads, places and labels over. Without WebGL (or if
   anything fails) terrain() returns null and the bake paints the old 2D ground. */
const WorldMapGL = (() => {
  const VS = 'attribute vec2 aP; varying vec2 vUV; void main() { vUV = aP * 0.5 + 0.5; gl_Position = vec4(aP, 0.0, 1.0); }';
  const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  // a separable blur: 25 taps, spaced uStep apart along uDir (texels), weights of a gaussian of sigma 4.5 taps
  const FS_BLUR = HDR + `uniform sampler2D uT; uniform vec2 uDir; uniform float uStep; varying vec2 vUV;
void main() { vec4 s = vec4(0.0); float wt = 0.0;
  for (int i = -12; i <= 12; i++) { float f = float(i), w = exp(-f * f / 40.5); s += texture2D(uT, vUV + uDir * f * uStep) * w; wt += w; }
  gl_FragColor = s / wt; }`;
  const FS = HDR + `uniform sampler2D uMask, uBN, uBW, uReg, uRel, uFor; uniform vec2 uMap, uOff; uniform float uSeed; varying vec2 vUV;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p) { float n = h21(p); return vec2(n, h21(p + n * 17.17)); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return s; }
float fbm3(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { s += a * vn(p); p = p * 2.07 + vec2(5.3, 11.7); a *= 0.5; } return s / 0.875; }
// cells: the distance to the nearest and second nearest seed, and the nearest's id
vec4 cells(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 9.0, d2 = 9.0; vec2 id = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = h22(i + g) * 0.8 + 0.1, r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = i + g; } else if (d < d2) d2 = d; }
  return vec4(sqrt(d1), sqrt(d2), id); }
vec2 T(vec2 p) { return p / uMap; }   // map units to texture coordinates
float ridged(vec2 p) { float s = 0.0, a = 0.55; for (int i = 0; i < 4; i++) { float n = 1.0 - abs(2.0 * vn(p) - 1.0); s += a * n * n; p = p * 2.1 + vec2(3.1, 7.7); a *= 0.5; } return s; }
float relief(vec2 p) { vec4 r = texture2D(uRel, T(p)); float land = texture2D(uBN, T(p)).r;
  return r.r * (0.25 + 0.95 * ridged(p / 22.0 + 4.0)) + land * (0.34 * fbm3(p / 80.0) + 0.08 * fbm3(p / 21.0)) + r.g * 0.05 * sin(p.y * 0.42 + p.x * 0.08 + 6.0 * fbm3(p / 50.0)); }
void main() {
  vec2 p = (vUV * uMap); p.y = uMap.y - p.y; p += uOff;   // map units, y down
  vec2 q = vec2(fbm3(p / 70.0 + uSeed), fbm3(p / 70.0 + 31.7 + uSeed)) - 0.5;   // a warp, so no edge is ruled
  float m = texture2D(uMask, T(p)).r, bn = texture2D(uBN, T(p)).r, bw = texture2D(uBW, T(p)).r;
  float land = smoothstep(0.38, 0.62, m);
  vec3 col;
  // ---- the sea ----
  { float sh = smoothstep(0.02, 0.75, bw), n1 = fbm(p / 140.0 + 3.0), n2 = fbm(p / 33.0 + 9.0);
    vec3 deep = vec3(0.17, 0.39, 0.43), mid = vec3(0.30, 0.56, 0.57), shal = vec3(0.55, 0.78, 0.72);
    vec3 s = mix(deep, mid, smoothstep(0.0, 0.35, sh)); s = mix(s, shal, smoothstep(0.35, 1.0, sh));
    s *= 0.9 + 0.2 * n1; s = mix(s, s * vec3(0.92, 1.04, 1.06), smoothstep(0.4, 0.7, n2));
    // soft brushed swells
    float sw = sin((p.x * 0.6 + p.y * 0.25) * 0.09 + n1 * 9.0); s += vec3(0.03, 0.045, 0.04) * sw * (1.0 - sh);
    // ripple lines following the shores outward, fading with the distance
    float lv = bw * 11.0 + (n2 - 0.5) * 0.9, rl = abs(fract(lv) - 0.5), line = 1.0 - smoothstep(0.035, 0.085, rl);
    s = mix(s, vec3(0.82, 0.93, 0.88), line * smoothstep(0.03, 0.12, bw) * (1.0 - smoothstep(0.55, 0.9, bw)) * 0.42);
    // little inked waves out at sea
    { vec2 cp = (p + vec2(0.0, mod(floor(p.x / 26.0), 2.0) * 13.0)) / vec2(26.0, 22.0); vec2 ci = floor(cp), cf = fract(cp) - 0.5; float rn = h21(ci + 7.0);
      if (rn < 0.42) { vec2 o = (h22(ci) - 0.5) * 0.4, d = (cf - o) * vec2(26.0, 22.0); float r = 5.5 + 3.0 * h21(ci + 3.0), a = abs(length(d - vec2(0.0, r)) - r);
        float k = (1.0 - smoothstep(0.35, 0.95, a)) * step(d.y, r * 0.35) * (1.0 - smoothstep(r * 0.55, r * 0.95, abs(d.x)));
        s = mix(s, rn < 0.2 ? vec3(0.9, 0.96, 0.93) : vec3(0.12, 0.3, 0.33), k * 0.55 * (1.0 - smoothstep(0.1, 0.5, bw))); } }
    // the land's shadow on the water, the surf, the wet sand
    float shd = texture2D(uBN, T(p - vec2(4.0, 6.0))).r; s *= 1.0 - 0.28 * smoothstep(0.1, 0.6, shd) * (1.0 - land);
    float surf = smoothstep(0.18, 0.4, bn) * (1.0 - smoothstep(0.42, 0.5, bn)) * (0.55 + 0.45 * vn(p / 3.0 + 5.0));
    s = mix(s, vec3(0.93, 0.97, 0.94), surf * 0.75);
    col = s; }
  // ---- the land ----
  if (land > 0.001) {
    vec2 pw = p + q * 16.0; vec3 base = texture2D(uReg, T(pw)).rgb; vec4 fr = texture2D(uFor, T(pw)), rr = texture2D(uRel, T(p));
    float g1 = fbm(p / 55.0 + 2.0), g2 = fbm(p / 13.0 + 7.0), br = vn(vec2(p.x * 0.32 + p.y * 0.1, p.y * 0.95));
    vec3 c = base * (0.86 + 0.26 * g1) * (0.95 + 0.1 * g2); c = mix(c, c * vec3(1.08, 1.06, 0.86), smoothstep(0.55, 0.8, g1) * 0.5); c *= 0.97 + 0.06 * br;
    // the relief, lit from the top left
    float e = 1.6, h0 = relief(p), hx = relief(p + vec2(e, 0.0)), hy = relief(p + vec2(0.0, e));
    vec3 nrm = normalize(vec3(-(hx - h0) * 26.0, -(hy - h0) * 26.0, 1.0)), Lg = normalize(vec3(-0.55, -0.7, 0.75));
    float lit = dot(nrm, Lg), amb = 0.62; c *= amb + 0.55 * lit;
    // mountains: rock, scree and snow on the heights
    float hgt = rr.r * (0.55 + 0.75 * ridged(p / 22.0 + 4.0)); vec3 rock = mix(vec3(0.52, 0.48, 0.46), vec3(0.62, 0.58, 0.52), fbm3(p / 9.0)) * (amb + 0.6 * lit);
    c = mix(c, rock, smoothstep(0.32, 0.62, hgt + 0.15 * (g2 - 0.5)));
    float snow = max(smoothstep(0.66, 0.86, hgt + 0.2 * (g1 - 0.5)), rr.b * smoothstep(0.35, 0.6, fbm(p / 18.0) + rr.b * 0.4));
    c = mix(c, vec3(0.94, 0.96, 1.0) * (0.78 + 0.3 * lit), snow);
    // dunes: ridged bands with a lit face and a shaded one
    float dn = rr.g * smoothstep(0.3, 0.6, fbm3(p / 60.0 + 2.0) + 0.25); if (dn > 0.01) { float ph = p.y * 0.16 + p.x * 0.05 + 7.0 * fbm3(p / 45.0), rd = fract(ph / 6.2832); float face = smoothstep(0.0, 0.55, rd) - smoothstep(0.55, 0.62, rd);
      c = mix(c, c * mix(0.9, 1.08, face), dn * 0.6); c = mix(c, vec3(0.92, 0.8, 0.55), dn * 0.18 * vn(p / 4.0)); }
    // woods: a canopy of lit crowns
    float fo = fr.r * smoothstep(0.25, 0.55, fr.r + 0.25 * (g1 - 0.5)); if (fo > 0.01) { vec4 C = cells(p / 7.5); float crown = 1.0 - smoothstep(0.25, 0.62, C.x), edge = smoothstep(0.0, 0.18, C.y - C.x);
      vec3 tc = mix(vec3(0.2, 0.4, 0.2), vec3(0.3, 0.52, 0.26), h21(C.zw)); tc = mix(tc, base * 0.7, 0.4);
      vec2 rel = (fract(p / 7.5) - 0.5); float hl = 1.0 - smoothstep(0.0, 0.5, length(rel + vec2(0.18, 0.2)));
      vec3 cc = tc * (0.62 + 0.55 * crown) + vec3(0.12, 0.14, 0.06) * hl * crown; cc *= 0.75 + 0.25 * edge; cc *= amb + 0.45 * lit;
      c = mix(c, cc, fo * 0.8); }
    // marsh: pools and reeds
    float ms = fr.g; if (ms > 0.01) { float pool = smoothstep(0.62, 0.68, fbm(p / 11.0 + 4.0)); c = mix(c, vec3(0.32, 0.5, 0.5), pool * ms * 0.85);
      float reed = step(0.86, vn(vec2(p.x * 1.4, p.y * 0.25))) * step(0.5, fbm3(p / 6.0)); c = mix(c, vec3(0.25, 0.32, 0.17), reed * ms * 0.7); }
    // the shore: a sand rim, then the land darkening to an inked edge
    float sand = smoothstep(0.5, 0.56, bn) * (1.0 - smoothstep(0.6, 0.72, bn)); c = mix(c, vec3(0.86, 0.79, 0.6) * (0.9 + 0.15 * vn(p / 2.5)), sand * 0.75 * (1.0 - fo));
    float ink = 1.0 - smoothstep(0.0, 0.07, abs(m - 0.5));
    col = mix(col, c, land); col = mix(col, vec3(0.24, 0.17, 0.11), ink * 0.85); }
  // ---- parchment: fibres, stains, a warm print ----
  float fib = vn(vec2(p.x * 0.9, p.y * 0.07) + 3.0) * 0.6 + vn(vec2(p.x * 0.06, p.y * 0.8)) * 0.4, stn = fbm(p / 180.0 + 11.0);
  col *= 0.94 + 0.08 * fib; col *= mix(vec3(1.0), vec3(0.93, 0.86, 0.72), smoothstep(0.55, 0.85, stn) * 0.5);
  col = mix(col, col * vec3(1.04, 1.0, 0.9), 0.35);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0); }`;
  let last = null;
  /* o: { W, H (map units), K (pixels per unit), mask, reg, rel, forest: canvases covering the map } -> a canvas or null */
  function terrain(o) {
    let cv = null, gl = null;
    try {
      const PW = Math.round(o.W * o.K), PH = Math.round(o.H * o.K);
      cv = document.createElement('canvas'); cv.width = PW; cv.height = PH;
      gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: true, premultipliedAlpha: false });
      if (!gl) { last = 'no WebGL'; return null; }
      const mx = gl.getParameter(gl.MAX_TEXTURE_SIZE); if (PW > mx || PH > mx) { last = 'too big'; return null; }
      const sh = (t, s) => { const q = gl.createShader(t); gl.shaderSource(q, s); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(q)); return q; };
      const prog = fs => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'aP'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
      const PB = prog(FS_BLUR), PC = prog(FS);
      const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const tex = (src, w, h) => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);   /* (the picture's top row at t = 0: texture coordinates are map units over the map's size) */ else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); return t; };
      const fbo = t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo'); return f; };
      const tMask = tex(o.mask), tReg = tex(o.reg), tRel = tex(o.rel), tFor = tex(o.forest);
      // the two blurs of the land's outline: a narrow one at the mask's size, a wide one at an eighth of it
      const blur = (src, w, h, stepUnits) => { const a = tex(null, w, h), b = tex(null, w, h), fa = fbo(a), fb = fbo(b); gl.useProgram(PB); gl.uniform1i(gl.getUniformLocation(PB, 'uT'), 0); gl.activeTexture(gl.TEXTURE0); gl.viewport(0, 0, w, h);
        const st = stepUnits / o.W;   // the step in texture units across (map units over the map's width)
        gl.bindFramebuffer(gl.FRAMEBUFFER, fa); gl.bindTexture(gl.TEXTURE_2D, src); gl.uniform2f(gl.getUniformLocation(PB, 'uDir'), 1, 0); gl.uniform1f(gl.getUniformLocation(PB, 'uStep'), st); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.bindTexture(gl.TEXTURE_2D, a); gl.uniform2f(gl.getUniformLocation(PB, 'uDir'), 0, 1); gl.uniform1f(gl.getUniformLocation(PB, 'uStep'), stepUnits / o.H); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.deleteFramebuffer(fa); gl.deleteFramebuffer(fb); gl.deleteTexture(a); return b; };
      const mw = o.mask.width, mh = o.mask.height;
      const tBN = blur(tMask, mw, mh, 0.55), tBW1 = blur(tMask, Math.ceil(mw / 6), Math.ceil(mh / 6), 4.2), tBW = blur(tBW1, Math.ceil(mw / 6), Math.ceil(mh / 6), 4.2);
      // the picture, in strips (a phone's GPU may stop a single draw that runs too long)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.useProgram(PC); gl.viewport(0, 0, PW, PH);
      [['uMask', tMask], ['uBN', tBN], ['uBW', tBW], ['uReg', tReg], ['uRel', tRel], ['uFor', tFor]].forEach(([n, t], i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(gl.getUniformLocation(PC, n), i); });
      gl.uniform2f(gl.getUniformLocation(PC, 'uMap'), o.W, o.H); gl.uniform2f(gl.getUniformLocation(PC, 'uOff'), 0, 0); gl.uniform1f(gl.getUniformLocation(PC, 'uSeed'), 3.7);
      gl.enable(gl.SCISSOR_TEST); const N = 8; for (let i = 0; i < N; i++) { const y0 = Math.floor(PH * i / N), y1 = Math.floor(PH * (i + 1) / N); gl.scissor(0, y0, PW, y1 - y0); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.flush(); }
      gl.disable(gl.SCISSOR_TEST); gl.finish();
      // a copy in a plain 2D canvas, and the GPU's memory given back
      const out = document.createElement('canvas'); out.width = PW; out.height = PH; out.getContext('2d').drawImage(cv, 0, 0);
      last = 'ok'; return out;
    } catch (e) { last = String(e && e.message || e).slice(0, 300); try { console.warn('WorldMapGL: ' + last); } catch (e2) {} return null; }
    finally { try { const x = gl && gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); } catch (e) {} if (cv) { cv.width = cv.height = 1; } }
  }
  return { terrain, get last() { return last; } };
})();
