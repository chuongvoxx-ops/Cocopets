/* ---------- Dark's Final Eclipse, rebuilt on the GPU (worker U1, v391) ----------
   The same gameplay as before (20k5g-dark-ult-6-2d.js, the original, kept intact as the fallback): the aim, ONE Dark AoE
   hit at the impact (14 x base x K x evoK, kb 7, stun 0.5, R = 3.2 K .. 4.4 K), the demon's second burst as it dies (40 %,
   kb 5, 1.2 R), the same beats (drop 0.6 s, downbeat 1.05, raise 1.6, brace 2.6 / 2.85 Celestial, throw +0.42, impact
   +0.3, burst +0.95 / 1.05), the same cost, cooldown and upgrades. Only the picture is new:
   - A black sphere forms over the monsters: an event horizon (a solid black core with a soft limb, faint currents turning
     inside it), a lensing photon ring with a hot spot travelling round it, a soft corona of inward-spiralling light, a
     halo of darkness round it, and the world behind it bent by a real screen-space lens (the scene under it copied and
     warped toward it). A vortex of particles gathers into it.
   - The demon knight (20k5g-dark-eclipse-demon.js: a 3D model on GLM) materialises out of its underside, wings folded,
     falls, opens its wings and stops its fall with one huge downbeat; hovers on slow powerful wingbeats, its tail
     curling; raises both hands: streams of violet energy run from its palms and spiral up from the ground into the
     sphere, which swells, its corona quickening, the world darkening like an eclipse; it braces, then hurls the sphere
     down with both arms: the sphere falls stretched, trailing a soft smoky wake.
   - The impact: hitstop, a light flash and soft rays, a soft shockwave ring over the floor and one in the air, a
     refraction ring through the scene, obsidian debris, a violet ash storm and smoke, the ground scorched with glowing
     cracks, the world darkened for a moment, a heavy camera shake. Then the demon gathers itself and dissolves into
     violet ash (the second burst). Embers and ash drift throughout.
   Everything is drawn by ECLIPSE_GFX (below): a small WebGL painter of soft quads (each kind's picture made in the
   fragment shader from maths and noise, fading to nothing well inside its quad: no hard edges) in batches, a solid pass
   laid over and a light pass added (every output valid premultiplied colour), plus a distortion pass that warps a copy
   of the scene. Particles are pooled on the CPU and drawn as GPU quads. Used where WebGL runs on a real GPU (or
   window.__FE_GL = 1); otherwise (no WebGL, a lost context, a software rasteriser, __FE_GL = 0) the original 2D
   version plays. */
(() => {
  const U = ELEM_IMPL.dark.ult, legacy = U.finaleclipse;
  const TAU = Math.PI * 2;
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const smoo = u => { u = cl(u); return u * u * u * (u * (u * 6 - 15) + 10); };
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const CE = Math.cos(0.62);   // (heights on screen: GeoKit's camera, as the demon's)
  const C_EDGE = '#A55CFF', C_ACC = '#D9C2FF', C_VIO = '#7A2EE0', C_DEEP = '#3A1270', C_WHITE = '#FFFFFF', C_INK = '#07040C', C_ASH = '#2A2233', C_SMK = '#1E1428';

  /* ================= ECLIPSE_GFX: the soft painter =================
     kinds (light: added; solid: laid over):
      0 glow (L)              1 the horizon's body (S)  2 the corona and photon ring (L)  3 a stream segment (L)
      4 a soft ring (L)       5 smoke (S)               6 an ember / spark (L)            7 an ash flake (S)
      8 scorch (S)            9 glowing cracks (L)      10 a vortex disc (L)              11 an obsidian shard (S)
      12 the eclipse veil (S) 13 the wake's body (S)    14 soft rays (L)
     A quad: centre and half-axes in the game canvas's own coordinates (its transform the camera); 12 floats a vertex
     (device px, uv, kind, colour + alpha, three parameters). */
  const GFX = (() => {
    const SOLID = { 1: 1, 5: 1, 7: 1, 8: 1, 11: 1, 12: 1, 13: 1 };
    const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
    const VS = `attribute vec2 a_p, a_uv; attribute float a_k; attribute vec4 a_c; attribute vec3 a_q; uniform vec4 u_box; varying vec2 v_uv, v_px; varying float v_k; varying vec4 v_c; varying vec3 v_q;
void main(){ vec2 p = (a_p - u_box.xy) / u_box.zw; gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0); v_uv = a_uv; v_k = a_k; v_c = a_c; v_q = a_q; v_px = a_p; }`;
    const FS = HDR + `uniform float u_t; uniform vec3 u_pet; varying vec2 v_uv, v_px; varying float v_k; varying vec4 v_c; varying vec3 v_q;
float h1(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1.0, 0.0)), f.x), mix(h1(i + vec2(0.0, 1.0)), h1(i + vec2(1.0, 1.0)), f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * n2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s + 0.03125; }
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(mix(mix(h3(i), h3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 0.0)), h3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y), mix(mix(h3(i + vec3(0.0, 0.0, 1.0)), h3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(h3(i + vec3(0.0, 1.0, 1.0)), h3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z); }
float fbm3(vec3 p){ return 0.5 * n3(p) + 0.28 * n3(p * 2.07 + 3.1) + 0.16 * n3(p * 4.13 + 7.7); }
float win(float r, float a){ return 1.0 - smoothstep(a, 1.0, r); }
void main(){
  vec2 u = v_uv; float r = length(u), t = u_t, k = v_k, A = v_c.a; vec3 col = v_c.rgb, L = vec3(0.0); vec4 S = vec4(0.0); bool solid = false;
  float pk = u_pet.z > 0.0 ? mix(0.35, 1.0, smoothstep(0.45, 1.4, length((v_px - u_pet.xy) * vec2(1.0, 0.9)) / u_pet.z)) : 1.0;
  if (k < 0.5) { float q = max(0.0, 1.0 - r * r); L = col * q * q * exp(-r * r * 3.0); }
  else if (k < 1.5) { solid = true;   // the event horizon's body: a black core, a soft limb, faint currents turning in it; a halo of darkness round it
    float rc = v_q.x, d = r / rc, core = 1.0 - smoothstep(0.8, 1.05, d), halo = pow(clamp(1.0 - (r - rc * 0.9) / (1.0 - rc * 0.9), 0.0, 1.0), 2.0) * 0.6;
    vec3 n = vec3(u / rc, sqrt(max(0.0, 1.0 - d * d))); float ang = t * 0.22 * v_q.z + v_q.y, ca = cos(ang), sa = sin(ang); vec3 p = vec3(n.x * ca + n.z * sa, n.y, -n.x * sa + n.z * ca);
    float f = fbm3(p * 2.6 + vec3(0.0, t * 0.08, v_q.y)), bands = 0.5 + 0.5 * sin(p.y * 9.0 + f * 6.0 + t * v_q.z * 0.6);
    vec3 ci = vec3(0.004, 0.002, 0.01) + vec3(0.05, 0.016, 0.1) * bands * f * smoothstep(0.35, 1.0, d) * (1.0 - smoothstep(0.96, 1.05, d));
    float a = max(core, halo * win(r, 0.6)); S = vec4(mix(vec3(0.016, 0.006, 0.032), ci, core) * a, a); }
  else if (k < 2.5) {   // the corona: the photon ring (a hot spot travelling round), a fainter outer ring, inward-spiralling light, all fading out
    float rc = v_q.x, d = r / rc, th = atan(u.y, u.x), E = v_q.z;
    float ring = exp(-pow((d - 1.0) / 0.075, 2.0)) * 0.8, beam = 0.45 + 0.55 * pow(0.5 + 0.5 * cos(th - t * 0.8 - v_q.y), 2.0), ring2 = exp(-pow((d - 1.12) / 0.08, 2.0)) * 0.3;
    float s = th * 2.0 - log(max(d, 1.0)) * 4.5 + t * 1.1, f = fbm(vec2(s * 1.25 + 7.0, d * 2.4 - t * 0.4 + v_q.y)), g = fbm(vec2(s * 3.0 - 2.0, d * 5.0 - t * 0.9));
    float cor = exp(-max(d - 1.0, 0.0) * 2.4) * (0.2 + 1.1 * f * f + 0.4 * g * g) * smoothstep(0.93, 1.04, d);
    L = (col * (cor * 0.75 + ring2) * E + mix(col, vec3(1.0), 0.6) * ring * beam * (0.55 + 0.7 * E)) * win(r, 0.62); }
  else if (k < 3.5) {   // a stream: overlapping links whose windows sum to one; flowing filaments, a pale core
    float al = u.x * 0.5 + 0.5, w = sin(3.14159 * al); w *= w; float s = v_q.x + al * v_q.y;
    float f = fbm(vec2(s * 2.2 - t * v_q.z, u.y * 1.4 + 3.0)), g = fbm(vec2(s * 5.5 - t * v_q.z * 1.7, u.y * 2.6 + 9.0)), yy = u.y + (f - 0.5) * 0.7;
    L = (col * exp(-yy * yy * 4.5) * (0.3 + 0.95 * f) + mix(col, vec3(1.0), 0.5) * exp(-yy * yy * 12.0) * (0.25 + 0.6 * g)) * w * win(abs(u.y), 0.5); }
  else if (k < 4.5) {   // a soft ring (v_q.x its radius, v_q.y its width)
    float rr = v_q.x, ww = v_q.y, th = atan(u.y, u.x), nz = 0.65 + 0.7 * fbm(vec2(th * 3.0 + v_q.z, t * 0.7 + r * 3.0));
    L = (col * exp(-pow((r - rr) / ww, 2.0)) * nz + mix(col, vec3(1.0), 0.5) * exp(-pow((r - rr + ww * 0.25) / (ww * 0.35), 2.0)) * 0.5 + col * smoothstep(rr, rr * 0.2, r) * smoothstep(0.0, rr * 0.6, r) * 0.12) * win(r, 0.8); }
  else if (k < 5.5) { solid = true;   // smoke: billowing, darker in its heart, lit violet from below (v_q.x)
    float f = fbm(u * 2.1 + vec2(v_q.y * 3.1, v_q.y - t * 0.3)), d = clamp((1.0 - r * r) * (0.5 + 0.95 * f) - 0.22, 0.0, 1.0) * win(r, 0.82);
    vec3 c = mix(col * 0.55, col, smoothstep(-0.5, 0.6, -u.y + f * 0.5)) + vec3(0.22, 0.07, 0.45) * v_q.x * smoothstep(-0.2, 1.0, u.y); S = vec4(min(c, vec3(1.0)) * d, d); }
  else if (k < 6.5) { float q = max(0.0, 1.0 - r * r); q = q * q * q; L = col * q * (0.55 + 0.45 * q) + vec3(1.0) * pow(q, 5.0) * v_q.x; }   // an ember / a spark (stretched by its quad)
  else if (k < 7.5) { solid = true;   // an ash flake: an irregular soft-edged scrap
    float s = r + (n2(u * 2.4 + v_q.y * 7.0) - 0.5) * 0.6, a = 1.0 - smoothstep(0.3, 0.62, s); S = vec4(col * (0.7 + 0.5 * n2(u * 5.0 + v_q.y)) * a, a); }
  else if (k < 8.5) { solid = true;   // scorch: the floor darkened, ragged and soft
    float s = r + (fbm(u * 2.5 + v_q.y) - 0.5) * 0.55, a = (1.0 - smoothstep(0.3, 0.95, s)) * win(r, 0.85); S = vec4(col * a, a); }
  else if (k < 9.5) {   // glowing cracks in the floor, brightest near the heart
    float c1 = 1.0 - smoothstep(0.0, 0.03, abs(fbm(u * 2.3 + v_q.y) - 0.5)), c2 = (1.0 - smoothstep(0.0, 0.022, abs(fbm(u * 5.0 + v_q.y * 2.0 + 3.0) - 0.5))) * 0.55;
    L = (col * max(c1, c2) * (1.0 - smoothstep(0.15, 0.95, r)) + col * exp(-r * r * 5.0) * 0.18) * v_q.x * win(r, 0.85); }
  else if (k < 10.5) {   // a vortex disc round the sphere (v_q.x its hole, v_q.y 0 whole / 1 the far half / 2 the near half, v_q.z its spin)
    float th = atan(u.y, u.x), arms = pow(0.5 + 0.5 * sin(th * 4.0 + log(r + 0.04) * 6.5 + t * v_q.z), 3.0), f = fbm(vec2(th * 2.0 + t * 0.35, r * 4.0 - t * v_q.z * 0.3));
    float band = smoothstep(v_q.x * 0.8, v_q.x * 1.25, r) * win(r, 0.5), hf = v_q.y < 0.5 ? 1.0 : v_q.y < 1.5 ? 1.0 - smoothstep(-0.12, 0.12, u.y) : smoothstep(-0.12, 0.12, u.y);
    L = col * (arms * (0.35 + 1.0 * f) + 0.15 * f) * band * hf; }
  else if (k < 11.5) { solid = true;   // an obsidian shard: an irregular four-sided chip, its facets shaded, a hot violet rim (v_q.x)
    float best = -9.0, fi = 0.0; for (int i = 0; i < 4; i++) { float fa = float(i) * 1.5708 + (h1(vec2(v_q.y, float(i))) - 0.5) * 0.9, dd = dot(u, vec2(cos(fa), sin(fa))) * (0.8 + 0.45 * h1(vec2(float(i), v_q.y + 3.0))); if (dd > best) { best = dd; fi = float(i); } }
    float a = 1.0 - smoothstep(0.5, 0.6, best); vec3 c = mix(vec3(0.018, 0.014, 0.026), vec3(0.2, 0.17, 0.27), fract(fi * 0.37 + v_q.y) * 0.8) + vec3(0.45, 0.15, 0.85) * smoothstep(0.38, 0.55, best) * v_q.x; S = vec4(min(c, vec3(1.0)) * a, a); }
  else if (k < 12.5) { solid = true; float a = v_q.x * (0.6 + 0.4 * smoothstep(0.02, 0.45, r)); S = vec4(col * a, a); }   // the eclipse: the world darkened, least at the heart
  else if (k < 13.5) { solid = true;   // the wake's body: soft smoke along the plunge, densest at the head (uv.x 1)
    float al = u.x * 0.5 + 0.5, f = fbm(vec2(al * 3.0 + t * 1.5, u.y * 1.6 + v_q.y)), yy = u.y + (f - 0.5) * 0.6, d = exp(-yy * yy * 3.5) * pow(al, 1.4) * smoothstep(1.0, 0.82, al) * (0.45 + 0.8 * f) * win(abs(u.y), 0.6);
    d = clamp(d, 0.0, 1.0); S = vec4(col * d, d); }
  else {   // soft rays from a flash
    float th = atan(u.y, u.x), ry = pow(fbm(vec2(th * 3.2 + v_q.y, t * 0.6)), 2.2) * 2.2; L = (col * ry * exp(-r * 2.2) + mix(col, vec3(1.0), 0.6) * exp(-r * r * 14.0) * 0.7) * win(r, 0.7); }
  if (solid) { float a = clamp(S.a * A * pk, 0.0, 1.0); vec3 c = S.a > 0.0 ? S.rgb / S.a : vec3(0.0); gl_FragColor = vec4(min(c, vec3(1.0)) * a, a); }
  else { L = min(L * A * pk, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); } }`;
    /* the distortion: the scene copied under the effect, sampled displaced: a lens pulls toward its heart (the sphere), a
       ring pushes along its front (the shock); the copy covers the scene only where it moves (its alpha by the shift) */
    const VSD = `attribute vec2 a_p; void main(){ gl_Position = vec4(a_p, 0.0, 1.0); }`;
    const FSD = HDR + `uniform sampler2D u_tex; uniform vec2 u_sz; uniform vec4 u_s[4]; uniform vec4 u_k[4]; uniform float u_n, u_off;
void main(){ vec2 p = vec2(gl_FragCoord.x, u_sz.y - (gl_FragCoord.y - u_off)), dsp = vec2(0.0);
  for (int i = 0; i < 4; i++) { if (float(i) >= u_n) break; vec4 s = u_s[i], kk = u_k[i]; vec2 dv = p - s.xy; float d = max(length(dv), 1e-3); vec2 e = dv / d;
    if (kk.x < 0.5) { float R = s.z; dsp -= e * s.w * R * R / (d + R * 0.35) * (1.0 - smoothstep(R * 1.6, R * 3.4, d)) * smoothstep(R * 0.5, R * 0.95, d); }
    else { float x = (d - s.z) / kk.y; dsp += e * s.w * x * exp(-x * x) * 1.6 * kk.z; } }
  vec2 sz = u_sz; vec4 c = texture2D(u_tex, clamp((p + dsp) / sz, vec2(0.5) / sz, vec2(1.0) - vec2(0.5) / sz)); float m = smoothstep(0.15, 2.2, length(dsp));
  gl_FragColor = c * m; }`;
    let cv = null, gl = null, PR = null, PD = null, vb = null, db = null, tex = null, SC = null, ok = null, soft = false, info = '', why = '', lostAt = 0;
    const stats = { flush: 0, quads: 0, solid: 0, dist: 0, W: 0, H: 0 };
    function prog(vs, fs, attrs) { const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
      const Un = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const q = gl.getActiveUniform(p, i); Un[q.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, q.name); } return { p, U: Un }; }
    function build() {
      if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; lostAt = performance.now(); }); cv.addEventListener('webglcontextrestored', () => { ok = null; PR = PD = null; }); }
      const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false };
      gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
      try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
      PR = prog(VS, FS, ['a_p', 'a_uv', 'a_k', 'a_c', 'a_q']); PD = prog(VSD, FSD, ['a_p']); vb = gl.createBuffer(); db = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, db); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); for (const [pn, pv] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, pn, pv);
      return true; }
    const flag = () => { try { return typeof window !== 'undefined' ? window.__FE_GL : null; } catch (e) { return null; } };
    function usable() { const f = flag(); if (f === 0) return false;
      if (ok === false && why === 'context lost' && performance.now() - lostAt > 1500) { cv = null; gl = null; PR = PD = null; ok = null; why = ''; }
      if (ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Final Eclipse GFX: ' + why); } catch (e2) {} } }
      return !!ok && !(gl && gl.isContextLost && gl.isContextLost()) && (!soft || f === 1); }
    /* a batch of quads */
    const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
    const QV = [[-1, -1], [1, -1], [-1, 1], [-1, 1], [1, -1], [1, 1]];
    function Batch() {
      const B = { L: new Float32Array(72 * 400), nl: 0, S: new Float32Array(72 * 300), ns: 0, a: 1, b: 0, c: 0, d: 1, e: 0, f: 0,
        reset(c) { const M = c.getTransform(); this.a = M.a; this.b = M.b; this.c = M.c; this.d = M.d; this.e = M.e; this.f = M.f; this.nl = this.ns = 0; return this; },
        quad(kind, x, y, ux, uy, vx, vy, col, al, q0, q1, q2) { if (!(al > 0.003)) return; const sol = SOLID[kind] === 1, key = sol ? 'S' : 'L', nk = sol ? 'ns' : 'nl'; let Ar = this[key]; const n = this[nk];
          if ((n + 6) * 12 > Ar.length) { const z = new Float32Array(Ar.length * 2); z.set(Ar); Ar = z; this[key] = z; }
          const cx = this.a * x + this.c * y + this.e, cy = this.b * x + this.d * y + this.f, Ux = this.a * ux + this.c * uy, Uy = this.b * ux + this.d * uy, Vx = this.a * vx + this.c * vy, Vy = this.b * vx + this.d * vy, C = rgbOf(col); let o = n * 12;
          for (let j = 0; j < 6; j++) { const su = QV[j][0], sv = QV[j][1]; Ar[o++] = cx + Ux * su + Vx * sv; Ar[o++] = cy + Uy * su + Vy * sv; Ar[o++] = su; Ar[o++] = sv; Ar[o++] = kind; Ar[o++] = C[0]; Ar[o++] = C[1]; Ar[o++] = C[2]; Ar[o++] = al > 1 ? 1 : al; Ar[o++] = q0 || 0; Ar[o++] = q1 || 0; Ar[o++] = q2 || 0; }
          this[nk] += 6; },
        rq(kind, x, y, w, h, rot, col, al, q0, q1, q2) { const c = Math.cos(rot || 0), s = Math.sin(rot || 0); this.quad(kind, x, y, c * w, s * w, -s * h, c * h, col, al, q0, q1, q2); },
        seg(kind, x0, y0, x1, y1, w, col, al, q0, q1, q2) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 0.3) return; this.quad(kind, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col, al, q0, q1, q2); },
        glow(x, y, r, col, a, sy) { if (r > 0.5) this.quad(0, x, y, r, 0, 0, r * (sy || 1), col, a); },
        horizon(x, y, rc, sx, sy, a, seed, spin) { if (rc > 0.5) this.quad(1, x, y, rc / 0.42 * sx, 0, 0, rc / 0.42 * sy, C_INK, a, 0.42, seed || 0, spin || 1); },
        corona(x, y, rc, sx, sy, col, a, E, seed) { if (rc > 0.5) this.quad(2, x, y, rc / 0.42 * sx, 0, 0, rc / 0.42 * sy, col, a, 0.42, seed || 0, E); },
        /* a stream along a curve C(s) (s 0..1, screen points), n links overlapping by half, width w */
        stream(C, n, w, col, a, speed, seed) { const h = 1 / n; let len = 0, p0 = C(0); for (let i = 1; i <= 8; i++) { const p = C(i / 8); len += Math.hypot(p[0] - p0[0], p[1] - p0[1]); p0 = p; } const per = len / (w * 3);
          for (let j = 1; j < n; j++) { const s0 = (j - 1) * h, A = C(s0), B2 = C(Math.min(1, s0 + 2 * h)); this.seg(3, A[0], A[1], B2[0], B2[1], w, col, a, s0 * per + (seed || 0) * 3.7, 2 * h * per, speed); } },
        ring(x, y, r, col, a, w, sy, seed) { if (r > 1) { const R = r / 0.8; this.quad(4, x, y, R, 0, 0, R * (sy || 1), col, a, 0.8, Math.max(0.01, w / R), seed || 0); } },
        smoke(x, y, r, col, a, seed, lit) { if (r > 0.5) this.quad(5, x, y, r, 0, 0, r, col, a, lit || 0, seed || 0); },
        ember(x, y, s, col, a, hot, vx, vy) { if (s < 0.2) return; const v = Math.hypot(vx || 0, vy || 0); if (v > 0.5) { const L = s + v, ex = vx / v, ey = vy / v; this.quad(6, x, y, ex * L, ey * L, -ey * s, ex * s, col, a, hot || 0); } else this.quad(6, x, y, s, 0, 0, s, col, a, hot || 0); },
        ash(x, y, s, rot, col, a, seed, sq) { if (s > 0.3) this.rq(7, x, y, s, s * (sq || 0.7), rot, col, a, 0, seed || 0); },
        scorch(x, y, r, col, a, sy, seed) { if (r > 1) this.quad(8, x, y, r, 0, 0, r * (sy || 1), col, a, 0, seed || 0); },
        cracks(x, y, r, col, a, sy, heat, seed) { if (r > 1) this.quad(9, x, y, r, 0, 0, r * (sy || 1), col, a, heat, seed || 0); },
        vortex(x, y, r, sy, col, a, hole, half, spin) { if (r > 1) this.quad(10, x, y, r, 0, 0, r * sy, col, a, hole, half || 0, spin || 3); },
        shard(x, y, s, rot, a, seed, hot) { if (s > 0.4) this.rq(11, x, y, s, s, rot, C_INK, a, hot || 0, seed || 0); },
        veil(x, y, R, col, a) { this.quad(12, x, y, R, 0, 0, R, col, a, 1); },
        wake(x0, y0, x1, y1, w, col, a, seed) { this.seg(13, x0, y0, x1, y1, w, col, a, 0, seed || 0); },
        rays(x, y, r, col, a, seed) { if (r > 1) this.quad(14, x, y, r, 0, 0, r, col, a, 0, seed || 0); } };
      return B; }
    /* draw a batch into the game canvas: the solid pass laid over, then the light added; only the box its quads cover is
       rendered (at `res` of the canvas's pixels) and laid down */
    function flush(c, Bt, pet) {
      if (!Bt.nl && !Bt.ns) return true; if (!usable()) return false;
      try { const cv0 = c.canvas, CW = cv0.width, CH = cv0.height, res = Math.min(1, 1100 / Math.max(CW, CH)) * (LOW() ? 0.7 : 1), GW = Math.max(8, Math.ceil(CW * res)), GH = Math.max(8, Math.ceil(CH * res));
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [Ar, n] of [[Bt.L, Bt.nl], [Bt.S, Bt.ns]]) for (let i = 0; i < n; i++) { const X = Ar[i * 12], Y = Ar[i * 12 + 1]; if (X < x0) x0 = X; if (X > x1) x1 = X; if (Y < y0) y0 = Y; if (Y > y1) y1 = Y; }
        x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(CW, x1); y1 = Math.min(CH, y1); if (!(x1 > x0 && y1 > y0)) return true;
        const bx = Math.floor(x0 * res), by = Math.floor(y0 * res), bw = Math.min(GW - bx, Math.ceil(x1 * res) - bx + 1), bh = Math.min(GH - by, Math.ceil(y1 * res) - by + 1); if (bw < 1 || bh < 1) return true;
        if (cv.width !== GW || cv.height !== GH) { cv.width = GW; cv.height = GH; }
        gl.viewport(bx, GH - by - bh, bw, bh); gl.enable(gl.SCISSOR_TEST); gl.scissor(bx, GH - by - bh, bw, bh); gl.clearColor(0, 0, 0, 0); gl.enable(gl.BLEND); gl.useProgram(PR.p);
        gl.uniform4f(PR.U.u_box, bx / res, by / res, bw / res, bh / res); gl.uniform1f(PR.U.u_t, (performance.now() / 1000) % 1000); gl.uniform3f(PR.U.u_pet, pet ? pet[0] : 0, pet ? pet[1] : 0, pet ? pet[2] : 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, vb); const attr = (i, n, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, 48, off * 4); };
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
        for (const [Ar, n, sol] of [[Bt.S, Bt.ns, 1], [Bt.L, Bt.nl, 0]]) { if (!n) continue; gl.clear(gl.COLOR_BUFFER_BIT); if (sol) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); else gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
          gl.bufferData(gl.ARRAY_BUFFER, Ar.subarray(0, n * 12), gl.DYNAMIC_DRAW); attr(0, 2, 0); attr(1, 2, 2); attr(2, 1, 4); attr(3, 4, 5); attr(4, 3, 9); gl.drawArrays(gl.TRIANGLES, 0, n);
          c.globalCompositeOperation = sol ? 'source-over' : 'lighter'; c.drawImage(cv, bx, by, bw, bh, bx / res, by / res, bw / res, bh / res); }
        c.restore(); gl.disable(gl.SCISSOR_TEST); for (let i = 0; i < 5; i++) gl.disableVertexAttribArray(i);
        stats.flush++; stats.quads += (Bt.nl + Bt.ns) / 6; stats.solid += Bt.ns / 6; stats.W = bw; stats.H = bh; return true;
      } catch (e) { why = String(e && e.message || e); if (gl && gl.isContextLost && gl.isContextLost()) { ok = false; why = 'context lost'; lostAt = performance.now(); } return false; } }
    /* the distortion pass: sources [{ x, y, R (game coords), s (px of shift at its strongest), ring: { r, w } }] over the box
       [x0, y0, x1, y1] (game coords) */
    function distort(c, box, src) {
      if (!src.length || LOW() || !usable()) return false;
      try { const M = c.getTransform(), k = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)) || 1, cv0 = c.canvas, CW = cv0.width, CH = cv0.height;
        const dx0 = Math.max(0, Math.floor(M.a * box[0] + M.e)), dy0 = Math.max(0, Math.floor(M.d * box[1] + M.f)), dx1 = Math.min(CW, Math.ceil(M.a * box[2] + M.e)), dy1 = Math.min(CH, Math.ceil(M.d * box[3] + M.f)); if (!(dx1 - dx0 > 4 && dy1 - dy0 > 4)) return false;
        const sw = dx1 - dx0, sh = dy1 - dy0, res = Math.min(1, 560 / Math.max(sw, sh)), W = Math.max(4, Math.round(sw * res)), H = Math.max(4, Math.round(sh * res));
        if (!SC) SC = document.createElement('canvas'); if (SC.width !== W || SC.height !== H) { SC.width = W; SC.height = H; } const sg = SC.getContext('2d'); sg.clearRect(0, 0, W, H); sg.drawImage(cv0, dx0, dy0, sw, sh, 0, 0, W, H);
        if (cv.width < W || cv.height < H) { cv.width = Math.max(cv.width, W); cv.height = Math.max(cv.height, H); }
        gl.viewport(0, cv.height - H, W, H); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, cv.height - H, W, H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.disable(gl.BLEND); gl.useProgram(PD.p);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, SC);
        const S4 = new Float32Array(16), K4 = new Float32Array(16); let n = 0; const sc = k * res;
        for (const s of src) { if (n >= 4) break; const px = (M.a * s.x + M.e - dx0) * res, py = (M.d * s.y + M.f - dy0) * res; S4.set([px, py, (s.ring ? s.ring.r : s.R) * sc, s.ring ? s.s * sc : s.s], n * 4); K4.set(s.ring ? [1, Math.max(1, s.ring.w * sc), 1, 0] : [0, 0, 0, 0], n * 4); n++; }
        gl.uniform1i(PD.U.u_tex, 0); gl.uniform2f(PD.U.u_sz, W, H); gl.uniform4fv(PD.U.u_s, S4); gl.uniform4fv(PD.U.u_k, K4); gl.uniform1f(PD.U.u_n, n); gl.uniform1f(PD.U.u_off, cv.height - H);
        gl.bindBuffer(gl.ARRAY_BUFFER, db); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, 6); gl.disableVertexAttribArray(0); gl.disable(gl.SCISSOR_TEST);
        c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, cv.height - H, W, H, dx0, dy0, sw, sh); c.restore(); stats.dist++; return true;
      } catch (e) { why = String(e && e.message || e); return false; } }
    function check() { if (!gl) return null; const W = cv.width, H = cv.height, px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); let bad = 0, lit = 0; for (let i = 0; i < px.length; i += 4) { const a = px[i + 3]; if (a) lit++; if (px[i] > a + 1 || px[i + 1] > a + 1 || px[i + 2] > a + 1) bad++; } return { bad, lit }; }
    return { usable, Batch, flush, distort, check, stats, info: () => ({ ok, soft, renderer: info, why }) };
  })();

  /* ================= the GPU Final Eclipse ================= */
  const evoOf = C => Math.max(1, Math.min(7, Math.round(C.evo || 1)));
  // (the demon's poses through the cast, as keyframes [time, pose]; blended smootherstep)
  function poseAt(KF, t) { const D = ECLIPSE_DEMON; if (t <= KF[0][0]) return D.pose(KF[0][1]); for (let i = 0; i < KF.length - 1; i++) if (t < KF[i + 1][0]) { const u = (t - KF[i][0]) / Math.max(1e-6, KF[i + 1][0] - KF[i][0]); return D.blend(D.POSES[KF[i][1]], D.POSES[KF[i + 1][1]], smoo(u)); } return D.pose(KF[KF.length - 1][1]); }
  const gpuReady = () => { try { if (typeof window !== 'undefined' && window.__FE_GL === 0) return false; return GFX.usable() && ECLIPSE_DEMON.warm(); } catch (e) { return false; } };
  const rnd = (a, b) => a + Math.random() * (b - a);

  function castGPU(C, H) {
    const me = H.me, x = C.tx, y = C.ty, ev = evoOf(C), CEL = ev >= 7, ADE = ev >= 4, evoK = 1 + 0.08 * (ev - 1), K = C.K;
    const R = (3.2 + 0.2 * (ev - 1)) * K, DMG = C.base * 14 * K * evoK, seed = Math.floor(Math.random() * 1000);
    // the beats (as the original): the sphere forms, the drop and the downbeat, the raise, brace, throw, impact, the burst
    const T_DROP = 0.6, T_BEAT = 1.05, T_RAISE = 1.6, TB = CEL ? 2.85 : 2.6, T_THROW = TB + 0.42, IMP = T_THROW + 0.3, GATH = IMP + 0.45, EXP = IMP + (CEL ? 1.05 : 0.95), LIFE = EXP + (CEL ? 1.9 : 1.5);
    const KF = [[T_DROP, 'fall'], [T_BEAT - 0.34, 'fall'], [T_BEAT - 0.06, 'open'], [T_BEAT + 0.12, 'beat'], [T_BEAT + 0.6, 'hover'], [T_RAISE, 'hover'], [T_RAISE + 0.5, 'raise'], [TB, 'raise'], [TB + 0.22, 'brace'], [TB + 0.32, 'brace'], [T_THROW, 'throw'], [IMP + 0.15, 'throw'], [GATH + 0.1, 'hover'], [EXP - 0.12, 'gather'], [EXP, 'gather']];
    const SZ = ev <= 4 ? 1 + 0.25 * (ev - 1) / 3 : 1.25 + 0.25 * (ev - 4) / 3, RB = 1.12 * (ev <= 4 ? 0.95 + 0.45 * (ev - 1) / 3 : 1.4 + (ev - 4) / 3) * Math.sqrt(K);   // (the demon's size and the sphere's radius, tiles)
    const LOWQ = LOW(), NQ = k => Math.max(1, Math.round(k * (LOWQ ? 0.4 : 1)));
    H.X.banner('FINAL ECLIPSE', '', C.col, 1.5); H.X.sfx.hum(); H.warn(x, y, R, IMP, C.col);
    const S = { scl: SZ, ZH: 0, ZS: 0, laid: false, out: null, parts: [], yaw: Math.PI / 2 - 0.28 };
    /* the layout (at the first draw, from the room on screen): the demon's scale (its wings inside the screen), its hover
       height (pelvis) and the sphere's (its underside on the raised hands; its top under the HUD) */
    function layout(c, X, Y, T) { const M = c.getTransform(), sw = c.canvas.width / (M.a || 1), y0 = -M.f / (M.d || 1), lim = y0 + 92;
      let sc = Math.min(SZ * 1.15, sw * 0.94 / (7.4 * T)); const sc0 = Math.min(sc, 0.85 * SZ);
      // (the sphere's underside on the raised hands; the sphere's top under the HUD: the demon hangs lower, in front of the
      //  aim, before it is made smaller)
      for (let k = 0; k < 8; k++) { let ZH = 1.45 * sc + 0.6; const need = (ZS_of(ZH, sc) * CE + RB * 1.2) * T, room = Y - lim + T * 0.6;   /* (the sphere's soft halo may reach under the HUD) */
        if (need > room) ZH = Math.max(0.1 * sc, ZH - (need - room) / (CE * T)); const need2 = (ZS_of(ZH, sc) * CE + RB * 1.2) * T;
        S.scl = sc; S.ZH = ZH; S.ZS = ZS_of(ZH, sc); if (need2 <= room + 1 || sc <= sc0) break; sc = Math.max(sc0, sc * Math.max(0.7, Math.min(0.97, room / need2))); }
      S.laid = true; }
    const ZS_of = (ZH, sc) => ZH + 2.15 * sc + 0.8 * RB / CE;
    // the sphere at time t: its height, radius, stretch; its swell through the charge; torn free and plunging at the throw
    function sph(t) { const form = smoo(t / 0.65), sw = sstep(T_RAISE + 0.3, TB, t) * 0.3, br = cl((t - TB) / 0.3) * 0.06; let z = S.ZS + Math.sin(t * 1.8) * 0.04 - br * 2, rr = RB * (0.15 + 0.85 * form) * (1 + sw + br), sx = 1, sy = 1;
      if (t >= T_THROW) { const u = cl((t - T_THROW) / (IMP - T_THROW)), e = u * u; z = S.ZS * (1 - e) + rr * 0.5 * e; sx = 1 - 0.14 * Math.sin(u * Math.PI); sy = 1 + 0.24 * Math.sin(u * Math.PI); }
      return { z, r: rr, sx, sy, swell: sw, form }; }
    // the demon's pelvis height: out of the sphere, caught by the downbeat, hovering (it rises on each downstroke), dipping with the throw, lifting as it gathers
    function dz(t) { const ZH = S.ZH; if (t < T_BEAT) { const u = cl((t - T_DROP) / (T_BEAT - T_DROP)); return lerp(S.ZS - 0.4 * S.scl, ZH - 0.55, Math.pow(u, 1.7)); }
      if (t < T_BEAT + 0.5) { const u = cl((t - T_BEAT) / 0.5); return lerp(ZH - 0.55, ZH, 1 - Math.pow(1 - u, 3)) + Math.sin(u * Math.PI) * 0.1; }
      let z = ZH - 0.07 * Math.cos(TAU * 0.85 * t) * cl((t - T_BEAT - 0.5) / 0.5); if (t > T_THROW) z -= Math.sin(cl((t - T_THROW) / 0.55) * Math.PI) * 0.22; if (t > GATH) z += sstep(GATH, EXP, t) * 0.32; return z; }
    const charge = t => sstep(T_RAISE + 0.25, TB, t) * (t < T_THROW ? 1 : Math.max(0, 1 - (t - T_THROW) / 0.15));
    const disOf = t => t < T_DROP + 0.28 ? 0.75 * (1 - smoo((t - T_DROP) / 0.28)) : t > EXP - 0.15 ? smoo((t - EXP + 0.15) / 0.95) : 0;
    /* ---- particles (pooled; world tiles, z the height) ---- */
    const P = S.parts, CAP = LOWQ ? 380 : 950;
    const add = o => { if (P.length >= CAP) return null; o.t = 0; P.push(o); return o; };
    function spawnAsh(px, py, pz, n, sp, up, hot) { for (let i = 0; i < n; i++) { const b = Math.random() * TAU, v = sp * (0.3 + Math.random()); add({ k: 'ash', x: px + rnd(-0.15, 0.15), y: py + rnd(-0.1, 0.1), z: pz + rnd(-0.15, 0.15), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: up * (0.4 + Math.random()), life: rnd(1.4, 2.8), s: rnd(0.05, 0.11), rot: Math.random() * TAU, vr: rnd(-6, 6), ph: Math.random() * TAU, hot: Math.random() < hot ? rnd(0.5, 1) : 0, col: Math.random() < 0.5 ? C_ASH : '#3B2E4A' }); } }
    function spawnEmber(px, py, pz, n, sp, up) { for (let i = 0; i < n; i++) { const b = Math.random() * TAU, v = sp * (0.2 + Math.random()); add({ k: 'ember', x: px + rnd(-0.2, 0.2), y: py + rnd(-0.1, 0.1), z: pz + rnd(-0.1, 0.2), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: up * (0.5 + Math.random()), life: rnd(0.8, 2.2), s: rnd(0.035, 0.07), ph: Math.random() * TAU, col: Math.random() < 0.3 ? C_ACC : Math.random() < 0.5 ? C_EDGE : '#C07BFF' }); } }
    /* ---- the effect ---- */
    const F = H.add({ life: LIFE, x, y, gpu: true,
      update(dt, f) { const t = f.t; if (!S.laid) return; const sp = sph(t), ch = charge(t);
        // the gathering vortex: motes spiral in round the forming sphere and through the charge
        const vk = (t < 0.75 ? (1 - t / 0.75) : 0) + (t > T_RAISE && t < T_THROW ? sstep(T_RAISE, T_RAISE + 0.5, t) * (0.7 + 0.6 * ch) : 0);
        if (vk > 0.01) { let m = (LOWQ ? 22 : 60) * vk * dt; while (m > 0) { if (Math.random() < m) add({ k: 'mote', a: Math.random() * TAU, rad: RB * rnd(2.4, 4.2), h: rnd(-0.6, 0.6) * RB, w: rnd(1.6, 2.6), life: rnd(0.8, 1.3), s: rnd(0.035, 0.07), dark: Math.random() < 0.25, col: Math.random() < 0.3 ? C_ACC : C_EDGE }); m -= 1; } }
        // embers drifting off the sphere all through; more as it charges
        if (t > T_DROP && t < EXP + 0.6) { const ra = (LOWQ ? 3 : 8) * (1 + 2 * ch) * dt; if (Math.random() < ra) spawnEmber(x + rnd(-0.6, 0.6), y, sp.z - rnd(-0.5, 1) * sp.r, 1, 0.3, 0.4); }
        // the wake's embers as it falls
        if (t > T_THROW && t < IMP) { let m = (LOWQ ? 40 : 110) * dt; while (m > 0) { if (Math.random() < m) { const b = Math.random() * TAU; add({ k: 'ember', x: x + Math.cos(b) * sp.r * 0.8, y, z: sp.z + Math.sin(b) * sp.r * 0.8, vx: Math.cos(b) * 1.2, vy: 0, vz: rnd(0.5, 2.5), life: rnd(0.4, 0.9), s: rnd(0.04, 0.08), ph: 0, col: Math.random() < 0.4 ? C_ACC : C_EDGE }); } m -= 1; } }
        // the ash storm keeps blowing after the impact
        if (t > IMP && t < LIFE - 0.6) { let m = (LOWQ ? 16 : 45) * Math.max(0.15, 1 - (t - IMP) / 2) * dt; while (m > 0) { if (Math.random() < m) { const b = Math.random() * TAU, d = R * Math.sqrt(Math.random()) * 0.9; spawnAsh(x + Math.cos(b) * d, y + Math.sin(b) * d * 0.6, rnd(0, 0.4), 1, 1.2, 1.4, 0.35); } m -= 1; } }
        // the demon's ash as it dissolves (from every point of its figure)
        if (S.out && t > EXP - 0.15 && t < EXP + 0.85) { const pts = S.out.S.pts, T = H.X.Tz(); let m = (LOWQ ? 60 : 200) * dt; while (m > 0) { if (Math.random() < m) { const p = pts[Math.floor(Math.random() * pts.length)], wx = x + (p[0] - H.sx(x)) / T, wz = (H.sy(y) - p[1]) / (CE * T); if (Math.random() < 0.55) spawnAsh(wx, y, wz, 1, 0.8, 0.6, 0.7); else spawnEmber(wx, y, wz, 1, 0.6, 0.8); } m -= 1; } }
        // step them
        for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P.splice(i, 1); continue; }
          if (p.k === 'mote') { const k = p.t / p.life; p.a += p.w * dt * (1 + 2 * k); p.rad *= Math.exp(-dt * 2.2); p.h *= Math.exp(-dt * 2.5); }
          else if (p.k === 'ember') { p.vz += 0.5 * dt; p.vx *= 1 - 1.2 * dt; p.vy *= 1 - 1.2 * dt; p.vz *= 1 - 0.6 * dt; p.x += (p.vx + Math.sin(t * 2.3 + p.ph) * 0.25) * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
          else if (p.k === 'ash') { p.vx *= 1 - 0.9 * dt; p.vy *= 1 - 0.9 * dt; p.vz = p.vz * (1 - 1.1 * dt) - 0.2 * dt; p.x += (p.vx + Math.sin(t * 1.7 + p.ph) * 0.35) * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.rot += p.vr * dt; }
          else if (p.k === 'spark') { p.vz -= 9 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz *= -0.3; p.vx *= 0.6; } }
          else if (p.k === 'debris') { p.vz -= 14 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.rot += p.vr * dt; if (p.z < 0) { p.z = 0; if (p.vz < -2) { p.vz *= -0.32; p.vx *= 0.55; p.vy *= 0.55; p.vr *= 0.5; } else { p.vz = 0; p.vx *= 1 - 6 * dt; p.vy *= 1 - 6 * dt; p.vr *= 1 - 6 * dt; } } p.hot = Math.max(0, p.hot - dt * 0.9); }
          else if (p.k === 'smoke') { p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vx *= 1 - 1.3 * dt; p.vy *= 1 - 1.3 * dt; p.vz *= 1 - 0.8 * dt; p.r += p.gr * dt; } } },
      drawUnder(c, f, X, Y, T) {
        const tt = f.t; if (!S.laid) layout(c, X, Y, T); const Bq = GFX.Batch().reset(c), GY = H.GY, sp = sph(tt), RT = R * T, ch = charge(tt), endK = cl((LIFE - tt) / 0.6);
        if (tt < IMP) {
          // the sphere's light and its shadow on the floor (darker and tighter as it falls), the demon's soft shadow
          const fall = tt > T_THROW ? cl((tt - T_THROW) / (IMP - T_THROW)) : 0, near = 1 / (1 + sp.z * 0.25);
          Bq.scorch(X, Y, T * sp.r * (1.6 - 0.5 * fall), C_INK, Math.min(0.8, (0.18 + 0.35 * fall) * sp.form * near * 1.4), GY, seed);
          Bq.glow(X, Y, RT * (1.05 + 0.1 * ch), C_VIO, (0.1 + 0.3 * ch + 0.4 * fall) * sp.form, GY); Bq.glow(X, Y, RT * 0.5, C_EDGE, (0.06 + 0.22 * ch + 0.5 * fall) * sp.form, GY);
          Bq.ring(X, Y, RT, C_EDGE, (0.25 + 0.35 * ch) * sstep(0, 0.4, tt), T * 0.22, GY, seed);
          if (tt > T_DROP) Bq.scorch(X, Y + T * 0.05, T * S.scl * 2.2, C_INK, 0.22 * sstep(T_DROP, T_DROP + 0.4, tt), GY * 0.8, seed + 1);
        } else {
          const post = tt - IMP;
          // scorched ground and glowing cracks, the floor's shock rings, its light
          Bq.scorch(X, Y, RT * 1.05 * (0.6 + 0.4 * smoo(post / 0.25)), '#0A0610', 0.78 * endK, GY, seed + 2);
          Bq.cracks(X, Y, RT * 1.0, C_EDGE, endK * (0.4 + 0.6 * Math.exp(-post * 1.2)), GY, 1.3 * (0.35 + 0.65 * Math.exp(-post * 1.5)), seed + 3);
          Bq.glow(X, Y, RT * 1.3, C_VIO, 0.7 * Math.exp(-post * 2.2) * endK, GY); Bq.glow(X, Y, RT * 0.6, C_ACC, 0.9 * Math.exp(-post * 4), GY);
          for (const [d, sc, w, a] of CEL ? [[0, 1.0, 0.3, 1], [0.1, 1.25, 0.22, 0.8], [0.24, 1.55, 0.18, 0.6]] : [[0, 1.0, 0.3, 1], [0.12, 1.3, 0.22, 0.75]]) { const q = cl((post - d) / 0.8); if (q > 0 && q < 1) Bq.ring(X, Y, RT * 1.35 * sc * (1 - Math.pow(1 - q, 3)), C_EDGE, a * (1 - q) * (1 - q * 0.5), T * (0.4 + 1.1 * q) * w / 0.3, GY, seed + d * 9); }
          if (tt > EXP) { const q = cl((tt - EXP) / 0.9); if (q < 1) Bq.ring(X, Y, RT * 1.45 * (1 - Math.pow(1 - q, 3)), C_ACC, 0.7 * (1 - q), T * (0.4 + q), GY, seed + 5); }
        }
        GFX.flush(c, Bq, null); },
      draw(c, f, X, Y, T) {
        const tt = f.t; if (!S.laid) layout(c, X, Y, T); const sp = sph(tt), SX = X, SY = Y - sp.z * CE * T, rpx = T * sp.r, ch = charge(tt), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5, M = c.getTransform(), mk = Math.sqrt(Math.abs(M.a * M.d - M.b * M.c)) || 1;
        const pet = [M.a * PX + M.c * PY + M.e, M.b * PX + M.d * PY + M.f, T * 1.0 * mk];
        const endK = cl((LIFE - tt) / 0.6), fall = tt > T_THROW ? cl((tt - T_THROW) / (IMP - T_THROW)) : 0, pre = tt < IMP, post = tt - IMP;
        /* ---- the distortion: the lens round the sphere; the shock's refraction ring ---- */
        { const src = []; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9; const grow = (cx, cy, rr) => { bx0 = Math.min(bx0, cx - rr); by0 = Math.min(by0, cy - rr); bx1 = Math.max(bx1, cx + rr); by1 = Math.max(by1, cy + rr); };
          if (pre && sp.form > 0.05) { src.push({ x: SX, y: SY, R: rpx * 1.02, s: 0.3 + 0.15 * ch + 0.2 * fall }); grow(SX, SY, rpx * 3.5); }
          if (!pre && post < 0.75) { const q = post / 0.75, rr = R * T * 1.5 * (1 - Math.pow(1 - q, 2.4)); src.push({ x: X, y: Y - T * 0.3, R: rr, s: 14 * (1 - q) * (1 - q), ring: { r: rr, w: T * (0.5 + 0.6 * q) } }); grow(X, Y - T * 0.3, rr + T * 2); }
          if (src.length) GFX.distort(c, [bx0, by0, bx1, by1], src); }
        const A = GFX.Batch().reset(c), Bf = GFX.Batch().reset(c);
        /* ---- the eclipse veil ---- */
        const veil = 0.2 * ch * (pre ? 1 : 0) + (pre ? 0.25 * fall : 0.55 * Math.exp(-post * 1.6) * sstep(-0.02, 0.06, post)) + (tt > EXP ? 0.22 * Math.exp(-(tt - EXP) * 2.5) : 0);
        if (veil > 0.01) A.veil(X, Y - T, Math.max(c.canvas.width, c.canvas.height) * 2 / mk, '#05020B', veil * endK);
        /* ---- the sphere: the halo, the vortex, the body, the corona; the tear as the demon drops out of it ---- */
        const demonFirst = tt < T_BEAT - 0.05;
        const sphQ = Q => { if (!pre && post > 0.08) return; const al = pre ? 1 : 1 - post / 0.08, E = 0.5 + 0.9 * ch + 1.2 * fall;
          Q.glow(SX, SY, rpx * 2.8, C_DEEP, 0.35 * al * sp.form * (0.6 + ch));
          Q.horizon(SX, SY, rpx, sp.sx, sp.sy, al, seed, 1 + 2 * ch + 3 * fall);
          Q.corona(SX, SY, rpx, sp.sx, sp.sy, C_EDGE, al * sp.form, E, seed);
          const tear = tt < T_DROP - 0.1 ? 0 : tt < T_DROP + 0.1 ? cl((tt - T_DROP + 0.1) / 0.2) : tt < T_BEAT ? 1 : 1 - cl((tt - T_BEAT) / 0.5); if (tear > 0.01) { Q.glow(SX, SY + rpx * 0.85, rpx * 0.8, C_EDGE, 0.7 * tear); Q.glow(SX, SY + rpx * 0.95, rpx * 0.35, C_ACC, 0.6 * tear); } };
        const vortexK = (tt < 0.8 ? sstep(0, 0.15, tt) * (1 - sstep(0.5, 0.8, tt)) : 0) + (tt > T_RAISE && tt < T_THROW + 0.1 ? sstep(T_RAISE, T_RAISE + 0.5, tt) * (0.5 + 0.7 * ch) * (tt > T_THROW ? 1 - (tt - T_THROW) / 0.1 : 1) : 0);
        if (vortexK > 0.01) { A.vortex(SX, SY, rpx * 3.6, 0.36, C_EDGE, Math.min(1, vortexK * 1.3), 0.3, 1, 3 + 3 * ch); }
        // the ground's streams spiralling up into the sphere through the charge
        if (pre && ch > 0.01) { const n = (CEL ? 10 : ADE ? 8 : 6), GY = H.GY; for (let i = 0; i < n; i++) { const b0 = i / n * TAU + seed, k2 = ch * (0.6 + 0.4 * Math.sin(tt * 2 + i));
            A.stream(s => { const ang = b0 + s * 1.7 + tt * 0.3, rad = lerp(R * 0.95, sp.r * 0.5, Math.pow(s, 0.75)), z = lerp(0, sp.z - sp.r * 0.3, Math.pow(s, 1.25)); return [X + Math.cos(ang) * rad * T, Y + Math.sin(ang) * rad * T * GY - z * CE * T]; }, LOWQ ? 7 : 12, T * 0.24, i % 3 ? C_EDGE : '#C48BFF', k2, 2.2, i); } }
        // the motes of the vortex (the far ones behind the sphere)
        const moteQ = (Q, far) => { for (const p of P) { if (p.k !== 'mote') continue; const s = Math.sin(p.a); if ((s < 0) !== far) continue; const k = p.t / p.life, al = Math.sin(k * Math.PI) * (0.6 + 0.4 * k), px = SX + Math.cos(p.a) * p.rad * T, py = SY + s * p.rad * T * 0.36 + p.h * T * 0.4, sz = p.s * T * (1 + k);
            if (p.dark) Q.ash(px, py, sz * 1.3, p.a, C_INK, al * 0.8, p.a); else Q.ember(px, py, sz, p.col, al, 0.4 * k, -Math.sin(p.a) * p.rad * T * 0.06, Math.cos(p.a) * p.rad * T * 0.02); } };
        moteQ(A, true);
        // the wake of the plunge: soft smoke and violet streamers from where it was thrown down to where it is
        if (fall > 0.02 && pre) { const y0 = Y - S.ZS * CE * T, Lw = SY - y0; if (Lw > 4) { A.wake(SX, y0 - rpx * 0.4, SX, SY, rpx * 0.95 * sp.sx, C_SMK, 0.85, seed); for (let j = 0; j < 3; j++) { const o = (j - 1) * rpx * 0.55; A.stream(s => [SX + o * (1 - s * 0.3) + Math.sin(s * 5 + j + tt * 6) * rpx * 0.08, lerp(y0 - rpx * 0.2, SY - rpx * 0.3, s)], 6, rpx * 0.28, j === 1 ? C_ACC : C_EDGE, 0.55 * (1 - Math.abs(j - 1) * 0.3), -3, j); } } }
        if (!demonFirst) sphQ(A);
        // a violet aura behind the demon (it lifts the dark figure off a dark floor; the last frame's place)
        if (S.out && tt > T_DROP + 0.2 && tt < EXP + 0.4) { const O = S.out.S, k = (1 - sstep(EXP - 0.1, EXP + 0.4, tt)) * (0.5 + 0.5 * ch); A.glow(O.chest[0], O.chest[1], T * S.scl * 2.2, C_VIO, 0.32 * k); A.glow(O.pelvis[0], O.pelvis[1], T * S.scl * 1.4, C_DEEP, 0.3 * k); }
        GFX.flush(c, A, pet);
        /* ---- the demon ---- */
        if (tt >= T_DROP && tt < EXP + 0.85) { const Pz = poseAt(KF, tt), PL = poseAt(KF, tt - 0.1), gk = sstep(GATH, EXP, tt), jit = gk * gk * 0.04;
          Pz.chg = Math.max(Pz.chg, ch * 1.2); Pz.sph = (pre ? 0.4 + 0.9 * sp.form * (0.5 + ch) + fall * 0.8 : 0.25 + Math.exp(-post * 3) * 1.5); Pz.glow = Math.max(Pz.glow, gk * 1.6);
          S.out = ECLIPSE_DEMON.draw(c, x + Math.sin(tt * 61) * jit, y, dz(tt), S.yaw + 0.06 * Math.sin(tt * 0.7), Pz, { T, sx: H.sx, sy: H.sy, t: tt, scale: S.scl, ev, lagP: PL, dis: disOf(tt), noGL: typeof window !== 'undefined' && window.__FE_DEMON2D === 1 }); }
        /* ---- in front: the sphere while the demon drops out of it, the hand streams, the near motes, the particles, the impact ---- */
        if (demonFirst) sphQ(Bf);
        moteQ(Bf, false);
        if (vortexK > 0.01) Bf.vortex(SX, SY, rpx * 3.6, 0.36, C_EDGE, Math.min(1, vortexK * 1.3) * 0.8, 0.3, 2, 3 + 3 * ch);   // (the near half of the vortex, over the demon)
        if (S.out && pre && ch > 0.01 && tt < T_THROW + 0.05) { const O = S.out.S, k = ch * (tt > T_THROW ? 1 - (tt - T_THROW) / 0.05 : 1), bot = [SX, SY + rpx * 0.8 * sp.sy];
          for (const hp of [O.handL, O.handR]) { const n = ADE ? 3 : 2; for (let j = 0; j < n; j++) { const wob = (j - (n - 1) / 2) * T * 0.18, ph = j * 2.1 + hp[0] * 0.01;
              Bf.stream(s => { const q = 1 - s, mx = (hp[0] + bot[0]) / 2 + wob + Math.sin(tt * 5 + ph) * T * 0.12, my = (hp[1] + bot[1]) / 2 + Math.cos(tt * 4 + ph) * T * 0.08; return [q * q * hp[0] + 2 * q * s * mx + s * s * (bot[0] + wob * 0.4), q * q * hp[1] + 2 * q * s * my + s * s * bot[1]]; }, LOWQ ? 5 : 8, T * (0.2 + 0.08 * k), j === 0 ? C_ACC : C_EDGE, k, 3.2, j + hp[0]); }
            Bf.glow(hp[0], hp[1], T * (0.45 + 0.2 * k), C_EDGE, 0.55 * k); Bf.glow(hp[0], hp[1], T * 0.16, C_WHITE, 0.4 * k); } }
        // the eyes' glare, and the heart's light as it gathers
        if (S.out && tt < EXP + 0.3) { const O = S.out.S, gk = sstep(GATH, EXP, tt); Bf.glow(O.head[0], O.head[1], T * S.scl * (0.35 + 0.4 * ch + 0.6 * gk), C_EDGE, 0.3 + 0.3 * ch + 0.5 * gk); if (gk > 0) { Bf.glow(O.core[0], O.core[1], T * S.scl * (0.8 + 1.6 * gk), C_EDGE, 0.7 * gk); Bf.glow(O.core[0], O.core[1], T * S.scl * 0.5 * gk, C_WHITE, 0.6 * gk); } }
        // the particles
        for (const p of P) { if (p.k === 'mote') continue; const k = p.t / p.life, px = H.sx(p.x), py = H.sy(p.y) - p.z * CE * T;
          if (p.k === 'ember') { const fl = 0.7 + 0.3 * Math.sin(tt * 13 + p.ph * 5); Bf.ember(px, py, p.s * T * (1 - 0.4 * k), p.col, Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (1 - k) * fl, 0.5 * (1 - k), p.vx * T * 0.03, -p.vz * T * 0.03); }
          else if (p.k === 'ash') { const a = sstep(0, 0.12, k) * (1 - k * k); Bf.ash(px, py, p.s * T, p.rot, p.col, a * 0.9, p.ph, 0.45 + 0.45 * Math.abs(Math.sin(p.rot))); if (p.hot) Bf.ember(px, py, p.s * T * 0.7, C_EDGE, a * p.hot * (1 - k) * 0.6, 0); }
          else if (p.k === 'spark') Bf.ember(px, py, p.s * T, p.col, (1 - k) * (1 - k), 0.8 * (1 - k), p.vx * T * 0.02, -p.vz * T * 0.02);
          else if (p.k === 'debris') { const a = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1; Bf.shard(px, py, p.s * T, p.rot, a, p.ph, p.hot); }
          else if (p.k === 'smoke') Bf.smoke(px, py, p.r * T, C_SMK, (1 - k) * Math.min(1, k * 6) * 0.85, p.ph, Math.max(0, 1 - post * 0.8)); }
        // the impact: the flash, the rays, the air's ring; the demon's own burst as it dissolves
        if (!pre) { const fl = Math.exp(-post * 6), RT = R * T;
          if (fl > 0.01) { Bf.glow(X, Y - T * 0.45, RT * (0.7 + 0.5 * cl(post / 0.12)), C_ACC, fl * 0.95); Bf.glow(X, Y - T * 0.4, RT * 0.3, C_WHITE, fl); Bf.rays(X, Y - T * 0.5, RT * (1.1 + 0.5 * cl(post / 0.2)), C_EDGE, fl * 0.9, seed); }
          const q = cl(post / 0.6); if (q < 1) Bf.ring(X, Y - T * 0.55, RT * 1.35 * (1 - Math.pow(1 - q, 3)), C_ACC, (1 - q) * 0.75, T * (0.3 + 0.8 * q), 0.42, seed + 7);
          if (tt > EXP && tt < EXP + 0.7 && S.out) { const p2 = tt - EXP, O = S.out.S, f2 = Math.exp(-p2 * 5); Bf.glow(O.core[0], O.core[1], T * S.scl * 3.2 * (0.7 + 0.5 * cl(p2 / 0.1)), C_EDGE, f2 * 0.9); Bf.glow(O.core[0], O.core[1], T * S.scl * 1.1, C_WHITE, f2 * 0.8); Bf.rays(O.core[0], O.core[1], T * S.scl * 4, C_ACC, f2 * 0.7, seed + 9); const q2 = cl(p2 / 0.7); Bf.ring(O.core[0], O.core[1], T * S.scl * 5 * (1 - Math.pow(1 - q2, 3)), C_EDGE, (1 - q2) * 0.6, T * 0.5, 0.8, seed + 11); } }
        GFX.flush(c, Bf, pet);
      },
    });
    F.dbg = { S, sph, dz, charge, T: { T_DROP, T_BEAT, T_RAISE, TB, T_THROW, IMP, GATH, EXP, LIFE } };
    /* ---- the timeline ---- */
    H.X.after(T_DROP, () => { H.X.sfx.whoosh(); });
    H.X.after(T_BEAT + 0.05, () => { H.X.sfx.thud(); H.X.shake(4, 0.25); const sc = S.scl, z = dz(F.t); for (const s of [-1, 1]) spawnAsh(x + s * 2.6 * sc, y, z + 0.4, NQ(14), 1.6, -0.4, 0.3); spawnEmber(x, y, z, NQ(10), 1.5, 0.2); });
    H.X.after(T_RAISE + 0.4, () => H.X.sfx.hum());
    H.X.after(TB + 0.2, () => H.X.shake(2.5, 0.25));
    H.X.after(T_THROW, () => { H.X.sfx.whoosh(); H.X.shake(5, 0.3); });
    H.X.after(IMP, () => {
      H.hitArea(x, y, R, DMG, C.dmgO({ kb: 7, stun: 0.5 }));
      H.X.hitstop(0.1); H.X.sfx.crash(); H.X.shake(20 + 2 * ev, 0.5); H.X.light(x, y, R * 1.4, 0.4);
      for (let j = 0; j < NQ(26 + 3 * ev); j++) { const b = Math.random() * TAU, v = rnd(3, 8); add({ k: 'debris', x: x + Math.cos(b) * 0.3, y: y + Math.sin(b) * 0.2, z: 0.3, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.55, vz: rnd(4, 10), life: rnd(1.4, 2.4), s: rnd(0.1, 0.26) * Math.sqrt(SZ), rot: Math.random() * TAU, vr: rnd(-12, 12), ph: Math.random() * 9, hot: rnd(0.5, 1) }); }
      for (let j = 0; j < NQ(40 + 4 * ev); j++) { const b = Math.random() * TAU, v = rnd(4, 11); add({ k: 'spark', x, y, z: 0.4, vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: rnd(2, 8), life: rnd(0.35, 0.8), s: rnd(0.04, 0.08), col: j % 3 ? C_EDGE : C_ACC }); }
      for (let j = 0; j < NQ(16); j++) { const b = j / 16 * TAU + Math.random() * 0.3, v = rnd(1.8, 3.5); add({ k: 'smoke', x: x + Math.cos(b) * 0.5, y: y + Math.sin(b) * 0.3, z: rnd(0.1, 0.6), vx: Math.cos(b) * v, vy: Math.sin(b) * v * 0.5, vz: rnd(0.3, 1.2), life: rnd(1.2, 2.0), r: rnd(0.5, 0.9) * Math.sqrt(SZ), gr: rnd(0.4, 0.9), ph: Math.random() * 9 }); }
      spawnAsh(x, y, 0.4, NQ(90 + 8 * ev), 5, 2.2, 0.45); spawnEmber(x, y, 0.3, NQ(36), 4, 1.6);
    });
    H.X.after(IMP + 0.12, () => H.X.sfx.thud()); H.X.after(IMP + 0.35, () => { H.X.sfx.hum(); H.X.shake(5, 0.3); });
    H.X.after(GATH, () => { H.X.sfx.hum(); H.X.shake(2, EXP - GATH); });
    // the demon dissolves into violet ash: the second burst (40 % of the impact, kb 5, 1.2 x its radius)
    H.X.after(EXP, () => {
      H.hitArea(x, y, R * 1.2, DMG * 0.4, C.dmgO({ kb: 5 }));
      H.X.hitstop(0.06); H.X.sfx.crash(); H.X.shake(14 + 2 * ev, 0.4); H.X.light(x, y, R * 1.5, 0.35);
      const z = dz(F.t) + 0.62 * S.scl; spawnAsh(x, y, z, NQ(70 + 8 * ev), 3.2, 1.0, 0.7); spawnEmber(x, y, z, NQ(40), 3.5, 1.2);
    });
    return F;
  }

  U.finaleclipse = (C, h) => (gpuReady() ? castGPU(C, h) : legacy(C, h));
  U.finaleclipse.legacy = legacy;
  U.finaleclipse.__dbg = Object.assign({}, legacy && legacy.__dbg, { DEMON: ECLIPSE_DEMON, GFX, gpuReady, poseAt });
})();
