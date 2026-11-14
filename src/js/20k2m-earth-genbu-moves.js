/* ================= GENBU_3D (GENBU_MOVES.G3D): Genbu's effects as real 3D geometry on the GPU =================
   The same approach as Nidhogg's (20k6hb): meshes in world space (tiles; z up) seen through the game's camera with a depth
   buffer, rebuilt each frame on the CPU into pooled buffers. Shapes are built in TRUE 3D (a floor offset dy is dy * GY in
   world y, as the lead's model and the core's rig: 20k2kz / 20k2l GY 0.72), so a rock is as deep as it is wide.
   Shapes: noise-displaced spheres (billows, mounds, blasts), tubes with per-point radius and alpha (furrow lips, ridges,
   glowing cracks, streaks), tori (shock waves), feathered floor ribbons (trenches), and flat-shaded meshes from templates
   (angular rocks, crystal prisms, crystal fragments, slabs) placed by a rotation and a scale.
   Materials (shader maths and 3D noise):
     0 amber energy (light; turbulent, feathered by the view angle) · 1 dust (solid, no depth write: soft billows, their limb
     feathered to nothing, warmed from below) · 2 stone (solid: sandstone strata, crevices, burnt-orange mineral seams that
     can glow) · 3 crystal fractures (light: a net of hot veins) · 4 a white-amber core (light) · 5 a glow strip (light:
     bright along its middle, feathered across) · 6 a drill's glowing helical seam (light) · 7 the body's depth stand-in.
   Everything is cut at the floor (z 0), feathered over a few hundredths of a tile, so what rises from below tears up
   through it. Three layers: stone (depth), dust (over, depth-tested only), light (screened, hidden behind stone and the
   turtle's stand-in ellipsoid). Real-GPU WebGL only; software GL needs window.__GB_GL = 1; 0 turns it off. */
(() => {
  const NM = self.GENBU_MOVES = self.GENBU_MOVES || {};
  const GYK = 0.72;
  let cv = null, gl = null, PR = null, buf = null, ok = null, soft = false, info = '', why = '';
  const stats = { draws: 0, verts: 0, solidVerts: 0, dustVerts: 0, occVerts: 0, W: 0, H: 0, frames: 0, maxVerts: 0, maxSolid: 0, maxDust: 0, maxTotal: 0 };
  const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const VS = `attribute vec3 a_p, a_n, a_q; attribute float a_k; attribute vec4 a_c; attribute vec3 a_m;
uniform vec4 u_px, u_py, u_pd; varying vec3 v_n, v_q, v_m; varying float v_k, v_z; varying vec4 v_c; varying vec2 v_s;
void main(){ vec4 q = vec4(a_p, 1.0); vec2 s = vec2(dot(q, u_px), dot(q, u_py)); gl_Position = vec4(s, clamp(dot(q, u_pd), -0.999, 0.999), 1.0); v_s = s; v_n = a_n; v_q = a_q; v_k = a_k; v_c = a_c; v_m = a_m; v_z = a_p.z; }`;
  const FS = HDR + `uniform float u_t, u_layer; uniform vec3 u_v, u_l, u_pet; uniform vec2 u_pa; varying vec3 v_n, v_q, v_m; varying float v_k, v_z; varying vec4 v_c; varying vec2 v_s;
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float fbm(vec3 p){ return 0.55 * n3(p) + 0.3 * n3(p * 2.03 + 3.1) + 0.15 * n3(p * 4.1 + 7.7); }
vec3 amb(float k){ k = clamp(k, 0.0, 1.25); vec3 c = mix(vec3(0.0), vec3(0.42, 0.13, 0.02), smoothstep(0.0, 0.25, k)); c = mix(c, vec3(0.9, 0.42, 0.09), smoothstep(0.2, 0.5, k)); c = mix(c, vec3(1.0, 0.7, 0.28), smoothstep(0.45, 0.78, k)); return mix(c, vec3(1.0, 0.94, 0.78), smoothstep(0.85, 1.2, k)); }
void main(){
  if (v_k > 6.5) { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }   // the turtle's depth stand-in (drawn with colour off)
  vec3 n = normalize(v_n); float ndv = abs(dot(n, u_v)), sil = smoothstep(0.0, 0.55, ndv), t = u_t + v_m.y * 3.7, heat = v_m.x, a0 = v_c.a;
  float gnd = smoothstep(-0.05, 0.012, v_z);   // nothing below the floor: what rises from under it tears up through it
  float pk = u_pet.z > 0.0 ? mix(0.1, 1.0, smoothstep(0.5, 1.45, length((v_s - u_pet.xy) * u_pa))) : 1.0;   // the rider's face stays clear
  if (v_k > 0.5 && v_k < 2.5) { float a; vec3 c;
    if (v_k < 1.5) { // dust: a soft billow of beige-grey earth, its limb feathered to nothing, warmed from below by amber light
      float f = fbm(v_q * 1.6 + vec3(0.0, 0.0, -t * 0.4)); a = sil * sil * smoothstep(0.16, 0.82, f) * a0; float lit = 0.62 + 0.38 * clamp(dot(n, u_l), 0.0, 1.0);
      c = v_c.rgb * lit * (0.85 + 0.25 * f) + vec3(0.55, 0.24, 0.05) * v_m.z * clamp(0.65 - 0.6 * n.z, 0.0, 1.0); }
    else { // stone: sandstone strata lit from the upper left, crevices, burnt-orange mineral seams (glowing when warm)
      float f = fbm(v_q * 3.2), cr = smoothstep(0.36, 0.2, f), band = 0.5 + 0.5 * sin(v_q.z * 7.0 + f * 5.0), sm = 1.0 - smoothstep(0.0, 0.05, abs(fbm(v_q * 1.7 + 4.0) - 0.5));
      float lit = 0.3 + 0.78 * clamp(dot(n, u_l), 0.0, 1.0) + 0.12 * clamp(n.z, 0.0, 1.0);
      c = v_c.rgb * (0.72 + 0.32 * f + 0.1 * band) * lit * (1.0 - 0.45 * cr); c = mix(c, vec3(0.52, 0.2, 0.05) * (0.55 + 0.5 * lit), sm * 0.8 * heat);
      c += amb(0.35 + 0.75 * v_m.z) * sm * v_m.z; a = a0; }
    a *= gnd * pk;
    if (u_layer > 0.5) { if (a < 0.5) discard; gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
    gl_FragColor = vec4(c * a, a); return; }
  vec3 L;
  if (v_k < 0.5) { // amber energy: turbulent, warm, feathered at the limb
    float f = fbm(v_q * 2.4 + vec3(0.0, 0.0, -t * 1.4)); float temp = heat * (0.35 + 0.9 * f) * (0.45 + 0.55 * ndv); L = amb(temp) * (0.6 + 0.6 * f) * sil; }
  else if (v_k < 3.5) { // glowing fractures inside a crystal: a net of thin hot veins
    float f = fbm(v_q * 1.5 + vec3(0.0, 0.0, -t * 0.2)), vein = pow(1.0 - abs(f * 2.0 - 1.0), 14.0), f2 = fbm(v_q * 3.1 + 9.0), v2 = pow(1.0 - abs(f2 * 2.0 - 1.0), 22.0);
    L = amb(heat * (0.6 + 0.55 * vein)) * (vein + v2 * 0.35 + 0.025) * (0.35 + 0.65 * ndv); }
  else if (v_k < 4.5) L = mix(v_c.rgb, vec3(1.0), 0.55) * pow(ndv, 1.5) * 1.2;   // a white-amber core
  else if (v_k < 5.5) { float w = ndv * ndv; L = amb(heat * (0.45 + 0.7 * w)) * w * 1.25; }   // a glow strip
  else { // a drill's helical seam: a hot line along each groove, veins between
    float s = fract(v_q.x), g = exp(-(s - 0.5) * (s - 0.5) * 60.0), f = fbm(vec3(v_q.y, v_q.z, v_q.x * 0.4) * 2.4 + vec3(0.0, 0.0, -t * 0.3)), vein = pow(1.0 - abs(f * 2.0 - 1.0), 10.0);
    L = amb(heat * (0.5 + 0.55 * g)) * (g * 0.95 + vein * 0.45) * (0.4 + 0.6 * ndv); }
  L *= a0 * pk * gnd; L = min(L, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
  function prog(vs, fs, attrs) { const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const q = gl.getActiveUniform(p, i); U[q.name] = gl.getUniformLocation(p, q.name); } return { p, U }; }
  function build() { if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; }); cv.addEventListener('webglcontextrestored', () => { ok = null; PR = null; }); }
    const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: true, stencil: false }; gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
    try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
    PR = prog(VS, FS, ['a_p', 'a_n', 'a_q', 'a_k', 'a_c', 'a_m']); buf = gl.createBuffer(); return true; }
  function usable() { let f = null, g = null; try { f = window.__GB_GL; g = window.__F3D; } catch (e) {} if (f === 0 || g === 0 || ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Genbu G3D: ' + why); } catch (e2) {} } } return !!ok && (!soft || f === 1); }
  const LOWQ = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h || '#FF7A2E'); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
  const SF = 18, CAP = 70000;   // floats a vertex (p3 n3 q3 k1 c4 m3); vertices a layer at most
  /* the layers: 0 light, 1 dust, 2 stone, 3 the depth stand-in. Positions arrive in true coordinates (x, y_true, z) */
  const mk = n => ({ A: new Float32Array(SF * n), n: 0 }), BUF = [mk(12000), mk(5000), mk(8000), mk(600)], LAY = k => k === 2 ? 2 : k === 1 ? 1 : k === 7 ? 3 : 0;
  const B = { ox: 0, oy: 0, low: false, t: 0 };
  function push(bi, x, y, z, nx, ny, nz, qx, qy, qz, k, C, a, m0, m1, m2) {
    const L = BUF[bi]; if (L.n >= CAP) return; if ((L.n + 1) * SF > L.A.length) { const q = new Float32Array(L.A.length * 2); q.set(L.A); L.A = q; }
    const A = L.A; let o = L.n * SF; A[o++] = x - B.ox; A[o++] = y * GYK - B.oy; A[o++] = z; A[o++] = nx; A[o++] = ny; A[o++] = nz; A[o++] = qx; A[o++] = qy; A[o++] = qz; A[o++] = k; A[o++] = C[0]; A[o++] = C[1]; A[o++] = C[2]; A[o++] = a; A[o++] = m0; A[o++] = m1; A[o] = m2; L.n++; }
  /* a grid surface: f(u, v, out) fills out = [x, y, z (true), nx, ny, nz, qx, qy, qz, w]; w mixes the colour toward C2
     (mode 1) or scales the alpha (mode 2). Vertices are computed once each into a scratch array; numN derives normals */
  let GV = new Float32Array(10 * 600); const GP = new Float32Array(10), TMPC = [0, 0, 0];
  function grid(nu, nv, f, k, C, a, m0, m1, m2, C2, mode, numN) { const bi = LAY(k), W = nu + 1, need = W * (nv + 1) * 10; if (GV.length < need) GV = new Float32Array(need * 2);
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { f(i / nu, j / nv, GP); GV.set(GP, (j * W + i) * 10); }
    if (numN) for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const o = (j * W + i) * 10, iu0 = (j * W + Math.max(0, i - 1)) * 10, iu1 = (j * W + Math.min(nu, i + 1)) * 10, iv0 = (Math.max(0, j - 1) * W + i) * 10, iv1 = (Math.min(nv, j + 1) * W + i) * 10;
      const ux = GV[iu1] - GV[iu0], uy = GV[iu1 + 1] - GV[iu0 + 1], uz = GV[iu1 + 2] - GV[iu0 + 2], vx = GV[iv1] - GV[iv0], vy = GV[iv1 + 1] - GV[iv0 + 1], vz = GV[iv1 + 2] - GV[iv0 + 2]; let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz); if (l > 1e-9) { GV[o + 3] = nx / l; GV[o + 4] = ny / l; GV[o + 5] = nz / l; } }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) for (const [di, dj] of QD) { const o = ((j + dj) * W + i + di) * 10, w = GV[o + 9]; let CC = C, aa = a;
      if (mode === 1) { TMPC[0] = C[0] + (C2[0] - C[0]) * w; TMPC[1] = C[1] + (C2[1] - C[1]) * w; TMPC[2] = C[2] + (C2[2] - C[2]) * w; CC = TMPC; } else if (mode === 2) aa = a * w;
      push(bi, GV[o], GV[o + 1], GV[o + 2], GV[o + 3], GV[o + 4], GV[o + 5], GV[o + 6], GV[o + 7], GV[o + 8], k, CC, aa, m0, m1, m2); } }
  const QD = [[0, 0], [1, 0], [0, 1], [0, 1], [1, 0], [1, 1]];
  /* smooth 3D value noise on the CPU (displaced spheres and tori) */
  const hh = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
  function vn(x, y, z) { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz), L = (a, b, u) => a + (b - a) * u;
    return L(L(L(hh(ix, iy, iz), hh(ix + 1, iy, iz), sx), L(hh(ix, iy + 1, iz), hh(ix + 1, iy + 1, iz), sx), sy), L(L(hh(ix, iy, iz + 1), hh(ix + 1, iy, iz + 1), sx), L(hh(ix, iy + 1, iz + 1), hh(ix + 1, iy + 1, iz + 1), sx), sy), sz); }
  /* a rotation (yaw about z, then pitch about the local y, then roll about the local x) into R (9 floats, columns x y z) */
  function rotM(R, yaw, pitch, roll) { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
    R[0] = cy * cp; R[1] = sy * cp; R[2] = -sp; R[3] = cy * sp * sr - sy * cr; R[4] = sy * sp * sr + cy * cr; R[5] = cp * sr; R[6] = cy * sp * cr + sy * sr; R[7] = sy * sp * cr - cy * sr; R[8] = cp * cr; return R; }
  const K = { amber: 0, dust: 1, stone: 2, crystal: 3, core: 4, strip: 5, seam: 6, occ: 7 }, sm01 = u => { u = u < 0 ? 0 : u > 1 ? 1 : u; return u * u * (3 - 2 * u); };
  const TP = new Float32Array(3 * 80), RG = new Float32Array(6 * 80 * 13), TA = new Float32Array(80), R9 = new Float32Array(9);
  const Q3 = {
    K, low: false, GY: GYK,
    /* a sphere at world (x, y, z), radius r (tiles), squashed by sz, stretched along heading o.ang by o.ex; its surface pushed out by noise turning with time */
    sphere(x, y, z, r, k, col, a, o) { if (!(r > 0.005) || !(a > 0.004)) return; o = o || {}; const cy = y / GYK, amp = o.amp == null ? 0.18 : o.amp, sd = o.seed || 0, sz = o.sz || 1, ex = o.ex || 1, ca = Math.cos(o.ang || 0), sa = Math.sin(o.ang || 0), t = B.t * (o.flow || 0.8), heat = o.heat == null ? 0.9 : o.heat, C = rgbOf(col), hemi = o.hemi ? 0.5 : 1;
      const nu = o.lod || Math.max(B.low ? 8 : 10, Math.min(B.low ? 14 : 22, Math.round(r * (B.low ? 3 : 5) + 6))), nv = Math.max(3, Math.round(nu * (o.hemi ? 0.38 : 0.6)));
      grid(nu, nv, (u, v, P) => { const th = u * Math.PI * 2, ph = v * Math.PI * hemi, sp = Math.sin(ph), dx = Math.cos(th) * sp, dy = Math.sin(th) * sp, dz = Math.cos(ph);
        const d = amp > 0 ? 1 + amp * (vn(dx * 2.2 + sd, dy * 2.2 + t, dz * 2.2 - t * 0.7) - 0.5) * 2 : 1, rr = r * d, lx = dx * rr * ex, ly = dy * rr; P[0] = x + lx * ca - ly * sa; P[1] = cy + lx * sa + ly * ca; P[2] = z + dz * rr * sz;
        const nx = dx / ex, ny = dy; P[3] = nx * ca - ny * sa; P[4] = nx * sa + ny * ca; P[5] = dz / sz; P[6] = dx * 1.5 + sd; P[7] = dy * 1.5; P[8] = dz * 1.5 - (o.rise || 0); P[9] = o.hemi ? sm01(dz / 0.45) : 1; }, k, C, a, heat, sd, o.warm || 0, null, o.hemi ? 2 : 0); },
    /* a tube through world points (x, y, z triples in Pts, n of them): radius rf(u) or o.rA[i], alpha a * (af(u) or o.aA[i]); an m-gon section */
    tube(Pts, n, rf, k, col, a, o) { if (n < 2 || !(a > 0.004)) return; o = o || {}; n = Math.min(n, 80); const bi = LAY(k), C = rgbOf(col), m = Math.min(12, o.m || (B.low ? 5 : 8)), heat = o.heat == null ? 0.9 : o.heat, sd = o.seed || 0, rA = o.rA, aA = o.aA, af = o.af, ql = o.qlen || 4, scr = B.t * (o.scroll || 0);
      for (let i = 0; i < n; i++) { TP[i * 3] = Pts[i * 3]; TP[i * 3 + 1] = Pts[i * 3 + 1] / GYK; TP[i * 3 + 2] = Pts[i * 3 + 2]; }
      let px = 0, py = 0, pz = 1;   // the section's reference, carried along (no twist)
      for (let i = 0; i < n; i++) { const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1); let tx = TP[i1 * 3] - TP[i0 * 3], ty = TP[i1 * 3 + 1] - TP[i0 * 3 + 1], tz = TP[i1 * 3 + 2] - TP[i0 * 3 + 2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        if (i === 0) { if (Math.abs(tz) > 0.9) { px = 1; py = 0; pz = 0; } else { px = 0; py = 0; pz = 1; } }
        let bx = ty * pz - tz * py, by = tz * px - tx * pz, bz = tx * py - ty * px; let bl = Math.hypot(bx, by, bz); if (bl < 1e-5) { bx = 1; by = 0; bz = 0; bl = 1; } bx /= bl; by /= bl; bz /= bl;
        const cx = ty * bz - tz * by, cy = tz * bx - tx * bz, cz = tx * by - ty * bx; px = cx; py = cy; pz = cz;
        const u = i / (n - 1), r = rA ? rA[i] : rf(u), al = aA ? aA[i] : af ? af(u) : 1;
        for (let j = 0; j <= m; j++) { const th = j / m * Math.PI * 2, ct = Math.cos(th), sn = Math.sin(th), nx = bx * ct + cx * sn, ny = by * ct + cy * sn, nz = bz * ct + cz * sn, o2 = (i * (m + 1) + j) * 6;
          RG[o2] = TP[i * 3] + nx * r; RG[o2 + 1] = TP[i * 3 + 1] + ny * r; RG[o2 + 2] = TP[i * 3 + 2] + nz * r; RG[o2 + 3] = nx; RG[o2 + 4] = ny; RG[o2 + 5] = nz; } TA[i] = al; }
      for (let i = 0; i + 1 < n; i++) for (let j = 0; j < m; j++) for (const [di, dj] of QD) { const ii = i + dj, jj = j + di, o2 = (ii * (m + 1) + jj) * 6, al = TA[ii], th = jj / m * Math.PI * 2;
        push(bi, RG[o2], RG[o2 + 1], RG[o2 + 2], RG[o2 + 3], RG[o2 + 4], RG[o2 + 5], ii / (n - 1) * ql + sd - scr, Math.cos(th), Math.sin(th), k, C, a * al, heat, sd, o.warm || 0); } },
    /* a torus round world (x, y, z), its plane's normal N (true, unit), major radius R, tube radius r; o.amp bumps the tube along its length */
    torus(x, y, z, R, r, N, spin, k, col, a, o) { if (!(R > 0.01) || !(a > 0.004)) return; o = o || {}; const cy0 = y / GYK, C = rgbOf(col), nu = o.nu || (B.low ? 22 : 36), nv = o.nv || (B.low ? 5 : 7), heat = o.heat == null ? 0.9 : o.heat, amp = o.amp || 0, sd = o.seed || 0;
      let ex = Math.abs(N[2]) < 0.9 ? -N[1] : 0, ey = Math.abs(N[2]) < 0.9 ? N[0] : -N[2], ez = Math.abs(N[2]) < 0.9 ? 0 : N[1]; const el = Math.hypot(ex, ey, ez) || 1; ex /= el; ey /= el; ez /= el; const fx = N[1] * ez - N[2] * ey, fy = N[2] * ex - N[0] * ez, fz = N[0] * ey - N[1] * ex;
      grid(nu, nv, (u, v, P) => { const th = u * Math.PI * 2 + spin, ph = v * Math.PI * 2, ct = Math.cos(th), sn = Math.sin(th), dx = ex * ct + fx * sn, dy = ey * ct + fy * sn, dz = ez * ct + fz * sn, cp = Math.cos(ph), sp = Math.sin(ph);
        const rr = amp ? r * (1 + amp * (vn(ct * 2.5 + sd, sn * 2.5, B.t * 0.3) - 0.5) * 2) : r, nx = dx * cp + N[0] * sp, ny = dy * cp + N[1] * sp, nz = dz * cp + N[2] * sp;
        P[0] = x + dx * R + nx * rr; P[1] = cy0 + dy * R + ny * rr; P[2] = z + dz * R + nz * rr; P[3] = nx; P[4] = ny; P[5] = nz; P[6] = ct * 2 + sd; P[7] = sn * 2; P[8] = sp; P[9] = 1; }, k, C, a, heat, sd, o.warm || 0); },
    /* a flat ribbon on the floor through world points (x, y): half-width w(i) and alpha from o.wA / o.aA, three lanes, feathered to nothing at both sides */
    ribbon(Pts, n, z, wA, aA, k, col, a, o) { if (n < 2 || !(a > 0.004)) return; o = o || {}; const C = rgbOf(col), heat = o.heat == null ? 0.9 : o.heat, sd = o.seed || 0;
      grid(2, n - 1, (u, v, P) => { const i = Math.round(v * (n - 1)), i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), x = Pts[i * 3], y = Pts[i * 3 + 1] / GYK; let tx = Pts[i1 * 3] - Pts[i0 * 3], ty = (Pts[i1 * 3 + 1] - Pts[i0 * 3 + 1]) / GYK; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const s = (u - 0.5) * 2, w = wA[i] * s; P[0] = x - ty * w; P[1] = y + tx * w; P[2] = z; P[3] = 0; P[4] = 0.25; P[5] = 1; P[6] = x * 1.3 + sd; P[7] = y * 1.3; P[8] = s * 0.6; P[9] = aA[i] * (u === 0.5 ? 1 : 0); }, k, C, a, heat, sd, o.warm || 0, null, 2); },
    /* a flat-shaded mesh from a template T ({ V: [x, y, z...], F: [i, j, k...] }), scaled (sx, sy, sz), turned by R (9), at world (x, y, z) */
    mesh(T, x, y, z, sx, sy, sz, R, k, col, a, o) { if (!(a > 0.004)) return; o = o || {}; const bi = LAY(k), C = rgbOf(col), cy = y / GYK, V = T.V, F = T.F, heat = o.heat == null ? 0.8 : o.heat, sd = o.seed || 0, qs = (o.qs || 1) * 2.5, warm = o.warm || 0, inf = o.inflate || 1;
      const nv = V.length / 3; if (WV.length < nv * 3) WV = new Float32Array(nv * 6);
      for (let i = 0; i < nv; i++) { const lx = V[i * 3] * sx * inf, ly = V[i * 3 + 1] * sy * inf, lz = V[i * 3 + 2] * sz * inf; WV[i * 3] = x + R[0] * lx + R[3] * ly + R[6] * lz; WV[i * 3 + 1] = cy + R[1] * lx + R[4] * ly + R[7] * lz; WV[i * 3 + 2] = z + R[2] * lx + R[5] * ly + R[8] * lz; }
      const ccx = x + R[6] * T.cz * sz, ccy = cy + R[7] * T.cz * sz, ccz = z + R[8] * T.cz * sz;
      for (let f = 0; f < F.length; f += 3) { const i0 = F[f] * 3, i1 = F[f + 1] * 3, i2 = F[f + 2] * 3, ux = WV[i1] - WV[i0], uy = WV[i1 + 1] - WV[i0 + 1], uz = WV[i1 + 2] - WV[i0 + 2], vx = WV[i2] - WV[i0], vy = WV[i2 + 1] - WV[i0 + 1], vz = WV[i2 + 2] - WV[i0 + 2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        if (nx * (WV[i0] - ccx) + ny * (WV[i0 + 1] - ccy) + nz * (WV[i0 + 2] - ccz) < 0) { nx = -nx; ny = -ny; nz = -nz; }
        for (const ii of [i0, i1, i2]) push(bi, WV[ii], WV[ii + 1], WV[ii + 2], nx, ny, nz, V[ii] * sx * qs + sd, V[ii + 1] * sy * qs, V[ii + 2] * sz * qs, k, C, a, heat, sd, warm); } },
    rot: (yaw, pitch, roll) => rotM(R9, yaw, pitch, roll),
    /* a grid surface from f (true coordinates; see grid), normals derived from the mesh */
    gridF(nu, nv, f, k, col, a, heat, sd, warm, col2, mode) { grid(nu, nv, f, k, rgbOf(col), a, heat, sd, warm || 0, col2 ? rgbOf(col2) : null, mode || 0, true); },
    /* the turtle's depth stand-in: an ellipsoid (true radii) turned by heading a; drawn into depth only, so debris and light behind the body hide behind it */
    occluder(x, y, z, rx, ry, rz, a) { const cy = y / GYK, ca = Math.cos(a), sa = Math.sin(a), C = rgbOf('#000000');
      grid(B.low ? 10 : 14, B.low ? 6 : 8, (u, v, P) => { const th = u * Math.PI * 2, ph = v * Math.PI, sp = Math.sin(ph), lx = Math.cos(th) * sp * rx, ly = Math.sin(th) * sp * ry; P[0] = x + lx * ca - ly * sa; P[1] = cy + lx * sa + ly * ca; P[2] = z + Math.cos(ph) * rz; P[3] = 0; P[4] = 0; P[5] = 1; P[6] = P[7] = P[8] = 0; P[9] = 1; }, 7, C, 1, 0, 0, 0); } };
  let WV = new Float32Array(3 * 64);
  /* begin a frame on the game canvas c (its transform is the camera); H the kit (sx, sy), Z screen px a tile of height,
     (ox, oy) a world origin near the action; pet: [screen x, y, radius] to keep clear, or null */
  let P0 = null;
  function begin(c, H, Z, ox, oy, pet) { const Bm = c.getTransform(), cv0 = c.canvas, L = LOWQ(), k0 = Math.min(L ? 0.45 : 0.62, 1200 / Math.max(cv0.width, cv0.height)), W = Math.max(8, Math.round(cv0.width * k0)), Hh = Math.max(8, Math.round(cv0.height * k0)), kx = W / cv0.width;
    for (const L2 of BUF) L2.n = 0; B.ox = ox; B.oy = oy; B.low = L; Q3.low = L; B.t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 % 1000;
    const SX0 = H.sx(ox), SY0 = H.sy(oy), Tx = (H.sx(ox + 1) - SX0) || 1, Ty = (H.sy(oy + 1) - SY0) || 1, A = Bm.a * kx, Bb = Bm.b * kx, Cc = Bm.c * kx, D = Bm.d * kx, E = Bm.e * kx, F = Bm.f * kx;
    /* world (x, y, z) -> canvas px: x' = SX0 + Tx x, y' = SY0 + Ty y - Z z, then the camera; -> clip space */
    const px = [A * Tx * 2 / W, Cc * Ty * 2 / W, -Cc * Z * 2 / W, (A * SX0 + Cc * SY0 + E) * 2 / W - 1], py = [-Bb * Tx * 2 / Hh, -D * Ty * 2 / Hh, D * Z * 2 / Hh, 1 - (Bb * SX0 + D * SY0 + F) * 2 / Hh];
    const zr = Z / Tx, gy = Ty / Tx * GYK, nn = Math.hypot(zr, gy), cy = zr / nn, cz = gy / nn;   // (the view in true coordinates: toward the camera, up and toward the screen's bottom)
    P0 = { W, Hh, px, py, pd: [0, -cy / (40 * GYK), -cz / 40, 0], v: [0, cy, cz], l: [-0.42, 0.32, 0.85], pet: [0, 0, 0], pa: [1, 1] };
    if (pet && pet[2] > 0) { const sx = (A * pet[0] + Cc * pet[1] + E) * 2 / W - 1, sy = 1 - (Bb * pet[0] + D * pet[1] + F) * 2 / Hh, r = pet[2] * Math.abs(A); P0.pet = [sx, sy, 1]; P0.pa = [W / 2 / r, Hh / 2 / r]; }
    return Q3; }
  const dry = { on: false };   // (tests: build and count the geometry without drawing it)
  function flush(c) { if (!P0) return; const nl = BUF[0].n, nd = BUF[1].n, ns = BUF[2].n, no = BUF[3].n;
    stats.verts = nl; stats.solidVerts = ns; stats.dustVerts = nd; stats.occVerts = no; stats.maxVerts = Math.max(stats.maxVerts, nl); stats.maxSolid = Math.max(stats.maxSolid, ns); stats.maxDust = Math.max(stats.maxDust, nd); stats.maxTotal = Math.max(stats.maxTotal, nl + nd + ns + no);
    if (dry.on || (!nl && !nd && !ns) || !usable()) return; const W = P0.W, Hh = P0.Hh;
    try { if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
      gl.viewport(0, 0, W, Hh); gl.useProgram(PR.p); const U = PR.U; gl.uniform4fv(U.u_px, P0.px); gl.uniform4fv(U.u_py, P0.py); gl.uniform4fv(U.u_pd, P0.pd); gl.uniform3fv(U.u_v, P0.v); gl.uniform3fv(U.u_l, P0.l); gl.uniform3fv(U.u_pet, P0.pet); gl.uniform2fv(U.u_pa, P0.pa); gl.uniform1f(U.u_t, B.t);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf); const S4 = SF * 4, attr = (i, n, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, S4, off * 4); };
      let draws = 0; const draw = L2 => { if (!L2.n) return; gl.bufferData(gl.ARRAY_BUFFER, L2.A.subarray(0, L2.n * SF), gl.DYNAMIC_DRAW); attr(0, 3, 0); attr(1, 3, 3); attr(2, 3, 6); attr(3, 1, 9); attr(4, 4, 10); attr(5, 3, 14); gl.drawArrays(gl.TRIANGLES, 0, L2.n); draws++; };
      const depthOnly = withStone => { gl.colorMask(false, false, false, false); gl.depthMask(true); gl.uniform1f(U.u_layer, 1); draw(BUF[3]); if (withStone) draw(BUF[2]); gl.colorMask(true, true, true, true); gl.uniform1f(U.u_layer, 0); };
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.enable(gl.BLEND);
      const cv0 = c.canvas; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1;
      if (ns || nd) { gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); depthOnly(false); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.depthMask(true); draw(BUF[2]); gl.depthMask(false); draw(BUF[1]); gl.depthMask(true);   // (stone writes depth; dust only tests it, so billows never cut each other)
        c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }
      if (nl) { gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); depthOnly(true);
        gl.depthMask(false); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR); draw(BUF[0]); gl.depthMask(true); c.globalCompositeOperation = 'lighter'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }
      c.restore(); stats.draws = draws; stats.W = W; stats.H = Hh; stats.frames++;
    } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Genbu G3D: ' + why); } catch (e2) {} } }
  NM.G3D = { usable, begin, flush, stats, dry, info: () => ({ ok, soft, renderer: info, why }), layers: () => BUF.map(L2 => L2.A.subarray(0, L2.n * SF)), SF };
})();

/* ================= GENBU_MOVES: every Genbu effect, drawn from the core's plans (20k2l) =================
   Nothing here deals damage or moves anything: each picture follows a plan on ctx (roll, jumpLand, rockPlan, drill,
   calamity, pose.crumble) at the core's own times, on the game clock (ctx.now). The volumes are 3D on the GPU (G3D above);
   the soft floor light, shock rings and flashes come from the shared feathered painter (NIDHOGG_MOVES.FGFX). drawsFx is
   true only while both can draw; otherwise the core keeps its own placeholder pictures.
   - Shell Roll: sparks scraped off the rim, dirt flung tangentially, amber accents turning with the shell, a low ring of
     dust following it.
   - Jump: the stomp's expanding wave of earth and dust, a ring of slabs tipped up, glowing cracks, broken stone.
   - Rock You: amber cracks spread to the target; each crystal is a sharp faceted prism (beige stone faces, burnt-orange
     seams, glowing fractures) with one or two smaller ones, thrust up through tipped slabs; the fractures brighten
     through the pause; the burst throws crystal fragments, stone and dust, with a wave and an amber blast.
   - Summon (ctx.summonT, ctx.SUMMON): the ground cracks, bulges and glows over the drill coming up, with rumbling dust;
     at the breach an eruption of earth (slabs and chunks thrown up, a column of dust, a shock ring, an amber blast); the
     dust settles after.
   - Drill Cannon (v336 flow: spin, out, drill, mat): amber arcs round the bearing and dust from the vents on the spin-up;
     in flight an amber trail with two strands of air wound round the arc; lodged, a churning ring of earth, a swirl of
     dust, clods, grit and sparks spiralling out, cracks that spread and pulse on each grinding tick, an amber glow and
     column building toward the explosion; the blast with crystal fragments; then on the carriage amber motes converge
     and a ring of light sweeps along the new bit, with a flash when it is whole.
   - Calamity: dust off the tracks in the transform; on the surface the drill throws earth and carves a furrow; under
     it, a heaving mound over the machine with a ridge of churned earth behind, cracks glowing over it, stones rolling
     off, an amber ring marking it; emergence throws slabs up in a wave and an amber blast. The climax: eight glowing
     fracture stars, eight rotating stone drills (burnt-orange crystal flutes, seams glowing hotter, energy spiralling in)
     tearing up through slabs, then one coordinated burst. The crumble: stone-coated fragments, grit and settling dust.
   Particles are pooled and capped per kind (lower on lowFx); errors in the hooks are reported once as console warnings
   ('Genbu FX ...') and listed in GENBU_MOVES.errors, since the core catches them silently. */
(() => {
  const GM = self.GENBU_MOVES = self.GENBU_MOVES || {};
  const TAU = Math.PI * 2, GY = 0.72, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, eout3 = u => { u = cl(u); return 1 - (1 - u) ** 3; }, lerp = (a, b, u) => a + (b - a) * u, rnd = (a, b) => a + Math.random() * (b - a);
  const eback = u => { u = cl(u); const s = 1.6; u -= 1; return u * u * ((s + 1) * u + s) + 1; };
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const SAND = '#D8C29B', SANDL = '#E6D4AE', EARTH = '#9A8160', EARTHD = '#7E6548', DEEP = '#4A3626', DUSTC = '#BBA684', ORANGE = '#BF5A22', ORANGEL = '#D7753A', STEEL = '#6E6862', AMBER = '#FFB347', GOLD = '#FFD27A';
  const g3 = () => { try { return GM.G3D && GM.G3D.usable() ? GM.G3D : null; } catch (e) { return null; } };
  const fg = () => { try { const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  Object.defineProperty(GM, 'drawsFx', { configurable: true, get: () => !!(g3() && fg()) });
  /* ---- errors: the core catches a hook's throw silently, so each distinct one is reported here once ---- */
  const ERR = new Set(); GM.errors = null;
  const guard = (nm, f) => (a, b) => { try { return f(a, b); } catch (e) { const m = nm + ': ' + String(e && e.message || e) + ' ' + String(e && e.stack || '').split('\n').slice(1, 2).join('').trim(); if (!ERR.has(m) && ERR.size < 20) { ERR.add(m); GM.errors = [...ERR]; try { console.warn('Genbu FX ' + m); } catch (e2) {} } } };
  /* ---- seeded randoms and the templates (unit size; flat-shaded) ---- */
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const tpl = (V, F, cz) => ({ V: new Float32Array(V), F: new Uint16Array(F), cz: cz || 0 });
  /* an angular rock: a ring of 6 at jittered heights, a top and a bottom */
  const ROCKS = []; for (let t = 0; t < 8; t++) { const V = [0.15 * (R1(t + 0.1) - 0.5), 0.15 * (R1(t + 0.2) - 0.5), 0.75 + 0.3 * R1(t + 0.3)], F = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5 * (R1(t * 7 + i) - 0.5), r = 0.8 + 0.4 * R1(t * 5 + i + 0.5); V.push(Math.cos(a) * r, Math.sin(a) * r * (0.75 + 0.25 * R1(t + i * 3)), 0.35 * (R1(t * 3 + i + 0.7) - 0.5)); }
    V.push(0.2 * (R1(t + 0.4) - 0.5), 0.2 * (R1(t + 0.6) - 0.5), -0.6 - 0.25 * R1(t + 0.8));
    for (let i = 0; i < 6; i++) { const a = 1 + i, b2 = 1 + (i + 1) % 6; F.push(0, a, b2, 7, b2, a); } ROCKS.push(tpl(V, F)); }
  /* a crystal fragment: a 5-sided bipyramid along x */
  const FRAGS = []; for (let t = 0; t < 6; t++) { const V = [1.3 + 0.6 * R1(t + 1.1), 0, 0, -(0.9 + 0.5 * R1(t + 1.7)), 0.1 * (R1(t + 2.2) - 0.5), 0], F = [];
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4 * (R1(t * 3 + i) - 0.5), r = 0.32 + 0.18 * R1(t * 9 + i); V.push(0.25 * (R1(t + i) - 0.5), Math.cos(a) * r, Math.sin(a) * r); }
    for (let i = 0; i < 5; i++) { const a = 2 + i, b2 = 2 + (i + 1) % 5; F.push(0, a, b2, 1, b2, a); } FRAGS.push(tpl(V, F)); }
  /* a slab: a thick plate (x by y by z = 1 x 0.75 x 0.2) with jittered corners */
  const SLABS = []; for (let t = 0; t < 6; t++) { const V = []; for (const z of [-1, 1]) for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) V.push(x * (0.85 + 0.3 * R1(t * 11 + V.length)), y * 0.75 * (0.85 + 0.3 * R1(t * 13 + V.length)), z * 0.2 * (0.8 + 0.4 * R1(t * 17 + V.length)) + 0.06 * (R1(t + V.length) - 0.5));
    SLABS.push(tpl(V, [0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6, 0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2, 2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0])); }
  /* a crystal: a six-sided prism from below the floor (z -0.35) to a shoulder (about 0.72), then a sharp off-centre point (z 1) */
  const CRYS = []; for (let t = 0; t < 8; t++) { const V = [], F = [], tx = 0.2 * (R1(t + 5.1) - 0.5), ty = 0.2 * (R1(t + 5.3) - 0.5);
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.25 * (R1(t * 4 + i) - 0.5), r = 0.85 + 0.3 * R1(t * 6 + i); V.push(Math.cos(a) * r, Math.sin(a) * r, -0.35); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.25 * (R1(t * 4 + i) - 0.5), r = (0.85 + 0.3 * R1(t * 6 + i)) * (0.82 + 0.12 * R1(t + i * 1.7)); V.push(Math.cos(a) * r, Math.sin(a) * r, 0.62 + 0.18 * R1(t * 8 + i)); }
    V.push(tx, ty, 1);
    for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; F.push(i, j, 6 + j, i, 6 + j, 6 + i, 6 + i, 6 + j, 12); } CRYS.push(tpl(V, F, 0.3)); }
  /* glowing crack lines (local true offsets from a centre): n jagged lines of length ~len, some branched */
  function mkCracks(n, len, seed, jag, r0) { const out = []; let s = Math.floor(seed * 1e5) % 2147483646 + 1; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < n; i++) { const L = len * (0.6 + 0.5 * r()), seg = 5; let a = i / n * TAU + (r() - 0.5) * 0.7, x = Math.cos(a) * (r0 || 0), y = Math.sin(a) * (r0 || 0); const pts = [x, y];
      for (let j = 1; j <= seg; j++) { a += (r() - 0.5) * jag; x += Math.cos(a) * L / seg; y += Math.sin(a) * L / seg; pts.push(x, y); } out.push({ pts, w: 1 });
      if (r() < 0.55) { let bx = pts[4], by = pts[5], ba = a + (r() < 0.5 ? 0.8 : -0.8); const q = [bx, by]; for (let j = 1; j <= 3; j++) { ba += (r() - 0.5) * jag; bx += Math.cos(ba) * L * 0.14; by += Math.sin(ba) * L * 0.14; q.push(bx, by); } out.push({ pts: q, w: 0.6, d0: 0.4 }); } }
    return out; }
  /* ---- the pooled pieces: 0 a rock, 1 a dust billow, 2 an amber spark, 3 a slab, 4 a crystal fragment ---- */
  const P = [], POOL = [], CAPS = [[150, 60], [46, 18], [120, 45], [40, 16], [84, 30]], NK = [0, 0, 0, 0, 0];
  function part(kind, x, y, z, vx, vy, vz, life, s, o) { if (NK[kind] >= CAPS[kind][LOW() ? 1 : 0]) return null; const p = POOL.pop() || {}; NK[kind]++;
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = p.max = life; p.s = s; p.age = 0;
    p.g = kind === 1 ? -0.25 : kind === 2 ? 7 : 12; p.drag = kind === 1 ? 2.2 : kind === 2 ? 0.9 : 0.3; p.grow = kind === 1 ? 1.1 : 0; p.bounce = 0.32; p.peak = 0.72;
    p.seed = Math.random() * 50; p.tpl = (Math.random() * 6) | 0; p.rx = rnd(0, TAU); p.ry = rnd(0, TAU); p.rz = rnd(0, TAU); p.wx = rnd(-8, 8); p.wy = rnd(-8, 8); p.wz = rnd(-5, 5);
    p.col = kind === 1 ? DUSTC : kind === 3 ? EARTH : SAND; p.heat = 0.7; p.warm = 0; p.st = null; p.ex = 1;
    if (o) for (const k in o) p[k] = o[k]; P.push(p); return p; }
  /* fling a piece from (x, y) at true heading a: horizontal speed vh (true), vertical vz */
  const fling = (kind, x, y, z, a, vh, vz, life, s, o) => part(kind, x, y, z, Math.cos(a) * vh, Math.sin(a) * vh * GY, vz, life, s, o);
  const at = (x, y, a, r) => [x + Math.cos(a) * r, y + Math.sin(a) * r * GY];
  function stepParts(dt) { for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.age += dt; p.life -= dt; if (p.life <= 0) { P[i] = P[P.length - 1]; P.pop(); POOL.push(p); NK[p.kind]--; continue; }
      const k = Math.max(0, 1 - p.drag * dt); p.vx *= k; p.vy *= k; p.vz = p.vz * (p.kind === 1 ? k : 1) - p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.kind !== 1) { p.rx += p.wx * dt; p.ry += p.wy * dt; p.rz += p.wz * dt; const fl = p.kind === 2 ? 0.02 : p.s * (p.kind === 3 ? 0.18 : 0.35); if (p.z < fl) { p.z = fl; if (p.vz < 0) p.vz = -p.vz * p.bounce; if (p.vz < 0.8) p.vz = 0; p.vx *= 0.5; p.vy *= 0.5; p.wx *= 0.4; p.wy *= 0.4; p.wz *= 0.4; if (p.kind === 2) p.life = Math.min(p.life, 0.08); } } } }
  /* ---- the timed events: 'wave' (a shock wave of earth and dust), 'blast' (an amber dome), 'cracks', 'slabs' (a ring tipped up); floor rings and glows ---- */
  const EV = [], RINGS = [], GLOWS = [], FLASH = [];
  const ev = o => { if (EV.length > 64) EV.shift(); EV.push(o); return o; };
  const ring = (x, y, R, life, col, t0, w) => { RINGS.push({ x, y, R, life, col: col || AMBER, t0, w: w || 0.16 }); if (RINGS.length > 30) RINGS.shift(); };
  const glow = (x, y, R, life, col, a, t0) => { GLOWS.push({ x, y, R, life, col: col || AMBER, a: a || 0.5, t0 }); if (GLOWS.length > 30) GLOWS.shift(); };
  const flash = (x, y, z, R, life, a, t0) => { FLASH.push({ x, y, z, R, life, a, t0 }); if (FLASH.length > 16) FLASH.shift(); };
  function mkSlabs(n, r0, r1, seed, big) { const L = []; for (let i = 0; i < n; i++) { const s = seed * 7 + i; L.push({ a: i / n * TAU + 0.5 * (R1(s) - 0.5), r: lerp(r0, r1, R1(s + 0.3)), w: (big || 1) * (0.32 + 0.14 * R1(s + 0.5)), tilt: 0.45 + 0.45 * R1(s + 0.7), tpl: i % SLABS.length, z: 0.04 + 0.08 * R1(s + 0.9), spin: (R1(s + 1.1) - 0.5) * 0.8 }); } return L; }
  /* a shock wave: a feathered ring of dust rolling out, earth clods hopping outward with it */
  function waveAt(x, y, R, life, h, now, lo) { const L = LOW(), sd = Math.random() * 100; ev({ type: 'wave', x, y, t0: now, life, R, h, seed: sd, lo });
    const n = lo ? (L ? 3 : 7) : (L ? 8 : 16), v = R / life * 0.75; for (let i = 0; i < n; i++) { const a = i / n * TAU + rnd(-0.2, 0.2), [px, py] = at(x, y, a, R * 0.3); fling(0, px, py, 0.1, a, v * rnd(0.75, 1.05), rnd(1.5, 3.5) * (0.6 + h * 1.5), life * rnd(1.4, 1.9), rnd(0.07, 0.15), { col: Math.random() < 0.5 ? EARTH : EARTHD, drag: 0.6 }); } }
  /* the summon's breach: an eruption of earth, chunks and slabs thrown up, a column of dust, a shock ring */
  function breach(x, y, now) { const L = LOW(); blastAt(x, y, 2.3, now, { wR: 3.6, h: 0.45, life: 0.5, k: 0.9 });
    ev({ type: 'slabs', x, y, t0: now, life: 2.0, rise: 0.12, list: mkSlabs(L ? 5 : 8, 1.8, 2.5, Math.random() * 50, 0.8) });
    for (let i = 0; i < (L ? 4 : 7); i++) { const a = i / 7 * TAU + rnd(-0.2, 0.2), [px, py] = at(x, y, a, rnd(0.6, 1.3)); fling(3, px, py, 0.3, a, rnd(2, 4), rnd(6, 10), rnd(1.1, 1.5), rnd(0.28, 0.45), { col: Math.random() < 0.5 ? EARTH : SAND, wx: rnd(-6, 6), wy: rnd(-6, 6) }); }
    for (let i = 0; i < (L ? 10 : 26); i++) { const a = rnd(0, TAU); fling(0, x + rnd(-0.6, 0.6), y + rnd(-0.4, 0.4), 0.4, a, rnd(1, 5), rnd(5, 10), rnd(1.1, 1.7), rnd(0.08, 0.24), { warm: Math.random() < 0.3 ? 0.6 : 0 }); }
    for (let i = 0; i < (L ? 5 : 12); i++) { const a = rnd(0, TAU), [px, py] = at(x, y, a, rnd(0, 0.9)); fling(1, px, py, rnd(0.2, 1.4), a, rnd(0.2, 0.8), rnd(2, 4.5), rnd(1.6, 2.4), rnd(0.6, 1.0), { peak: 0.62, drag: 1.0, g: -0.1, warm: 0.5 }); }   // the dust column
    for (let i = 0; i < (L ? 8 : 16); i++) fling(2, x, y, 0.5, rnd(0, TAU), rnd(3, 8), rnd(4, 8), rnd(0.35, 0.6), 0.03); }
  /* the Earth stomp: Jump's landing (and smaller versions elsewhere) */
  function stomp(x, y, R, now, k) { const L = LOW(), sd = Math.random() * 100; k = k || 1;
    ring(x, y, R * 1.08, 0.6, AMBER, now, 0.3); ring(x, y, R * 0.75, 0.8, SANDL, now, 0.16); glow(x, y, R * 1.05, 0.8, AMBER, 0.7, now); flash(x, y, 0.3, R * 0.5, 0.18, 0.4 * k, now);
    waveAt(x, y, R * 1.08, 0.62, 0.3 * k, now, false);
    ev({ type: 'cracks', x, y, t0: now, life: 1.3, grow: 0.12, w: 0.075, heat: 1.05, lines: mkCracks(L ? 6 : 9, R * 0.75, sd, 0.85, R * 0.4) });
    ev({ type: 'slabs', x, y, t0: now, life: 1.35, rise: 0.1, list: mkSlabs(L ? 5 : 9, R * 0.6, R * 0.82, sd, 0.85 * k) });
    ev({ type: 'blast', x, y, t0: now, life: 0.3, R: 1.6 * k, k: 0.5 });
    for (let i = 0; i < (L ? 8 : 18) * k; i++) { const a = rnd(0, TAU), [px, py] = at(x, y, a, rnd(1.2, 1.9) * R / 2.8); fling(0, px, py, 0.2, a, rnd(1.5, 4.5), rnd(4, 8), rnd(1.0, 1.6), rnd(0.08, 0.22), { col: Math.random() < 0.5 ? SAND : EARTH }); }
    for (let i = 0; i < (L ? 6 : 12); i++) { const a = i / (L ? 6 : 12) * TAU + rnd(-0.2, 0.2), [px, py] = at(x, y, a, 1.5 * R / 2.8); fling(1, px, py, 0.15, a, rnd(4, 6) * R / 2.8, rnd(0.3, 0.8), rnd(1.3, 1.8), rnd(0.5, 0.75), { warm: 0.3 }); }
    for (let i = 0; i < (L ? 5 : 12); i++) { const a = rnd(0, TAU), [px, py] = at(x, y, a, 1.4 * R / 2.8); fling(2, px, py, 0.2, a, rnd(4, 8), rnd(3, 6), rnd(0.3, 0.55), 0.03); } }
  function blastAt(x, y, R, now, o) { o = o || {}; const L = LOW(), sd = Math.random() * 100;
    ev({ type: 'blast', x, y, t0: now, life: o.life || 0.45, R, k: o.k || 1, sz: o.sz || 0.85 }); waveAt(x, y, o.wR || R * 1.2, o.wl || 0.65, o.h || 0.3, now, !!o.lo);
    ring(x, y, o.wR || R * 1.2, 0.6, AMBER, now, 0.22); ring(x, y, (o.wR || R * 1.2) * 0.65, 0.85, SANDL, now, 0.12); glow(x, y, R * 1.2, 0.9, AMBER, 0.65, now); flash(x, y, 0.6, R, 0.22, 0.55, now);
    if (o.cracks !== false) ev({ type: 'cracks', x, y, t0: now, life: 1.4, grow: 0.14, w: 0.06, heat: 1.05, lines: mkCracks(L ? 5 : 8, R * 1.05, sd, 0.85, 0.4) }); }
  /* ---- trails: Calamity's surface furrow and its underground ridge ---- */
  const mkTrail = (life, gap, cap) => ({ pts: [], life, gap, cap });
  function trailAdd(T, x, y, now) { const p = T.pts, l = p[p.length - 1]; if (l && Math.hypot(x - l.x, (y - l.y) / GY) < T.gap) return false; p.push({ x, y, t: now }); if (p.length > T.cap) p.shift(); return true; }
  const TRC = mkTrail(1.5, 0.22, 60), WAKE = mkTrail(1.35, 0.22, 50);
  /* ---- the session: everything is reset when a new Genbu appears ---- */
  let CTX = null, lastT = 0, seen = {}; const FT = [];   // (FT: the bit's flight, oldest first)
  function reset() { FT.length = 0; for (const p of P) POOL.push(p); P.length = 0; NK.fill(0); EV.length = 0; RINGS.length = 0; GLOWS.length = 0; FLASH.length = 0; TRC.pts.length = WAKE.pts.length = 0; seen = { up: [], drUp: [] }; }
  function sync(ctx) { if (ctx !== CTX) { CTX = ctx; reset(); lastT = ctx && ctx.now ? ctx.now() : 0; } }
  const nowOf = ctx => (ctx.now ? ctx.now() : 0);
  GM.nParts = () => ({ n: P.length, kinds: NK.slice(), ev: EV.length });
  function expire(now) { for (const L of [EV, RINGS, GLOWS, FLASH]) for (let i = L.length - 1; i >= 0; i--) if (now - L[i].t0 > L[i].life) L.splice(i, 1);
    for (const T of [TRC, WAKE]) while (T.pts.length && now - T.pts[0].t > T.life) T.pts.shift(); }
  const rate = (dt, r) => { const n = dt * r; return Math.floor(n) + (Math.random() < n - Math.floor(n) ? 1 : 0); };
  /* ================= update: step the pieces; read the plans for new events ================= */
  GM.update = guard('update', (ctx, dt) => { if (!ctx || !(dt > 0)) return; sync(ctx); const now = nowOf(ctx); stepParts(dt); expire(now); lastT = now; spawn(ctx, dt, now); });
  function spawn(ctx, dt, now) { const b = ctx.body || {}, L = LOW(), RM = ctx.calm && ctx.calm() ? 0.6 : 1;
    // ---- Jump: the landing stomp
    const jl = ctx.jumpLand; if (jl && jl !== seen.jl) { seen.jl = jl; if (now - jl.t < 0.2) stomp(jl.x, jl.y, jl.r || 2.8, now, 1); }
    // ---- Shell Roll: sparks scraped off the rim, dirt flung along it, dust kicked up behind
    const R = ctx.roll; if (R !== seen.roll) { seen.roll = R; if (R) for (let i = 0; i < (L ? 3 : 6); i++) { const a = i / 6 * TAU, [px, py] = at(b.x, b.y, a, 1.5); fling(1, px, py, 0.1, a, rnd(1, 2), 0.2, rnd(0.8, 1.1), rnd(0.4, 0.55)); } }
    if (R && R.ph === 1) { const w = R.w || 18, sg = w >= 0 ? 1 : -1, bvx = b.vx || 0, bvy = b.vy || 0, mv = Math.atan2((bvy || 0) / GY, bvx || 1);
      for (let i = rate(dt, (L ? 50 : 130) * RM); i > 0; i--) { const a = mv + rnd(-1.8, 1.8), [px, py] = at(b.x, b.y, a, 1.5), tg = a + sg * Math.PI / 2 + rnd(-0.3, 0.3), v = rnd(5, 11); part(2, px, py, rnd(0.05, 0.25), Math.cos(tg) * v + bvx * 0.5, Math.sin(tg) * v * GY + bvy * 0.5, rnd(1, 3.5), rnd(0.18, 0.4), 0.03); }
      for (let i = rate(dt, (L ? 10 : 22) * RM); i > 0; i--) { const a = rnd(0, TAU), [px, py] = at(b.x, b.y, a, 1.55), tg = a + sg * 1.2; fling(0, px, py, 0.1, tg, rnd(2.5, 5), rnd(1.5, 3.5), rnd(0.45, 0.7), rnd(0.05, 0.1), { col: Math.random() < 0.6 ? EARTHD : EARTH }); }
      for (let i = rate(dt, (L ? 5 : 11) * RM); i > 0; i--) { const a = mv + Math.PI + rnd(-1.2, 1.2), [px, py] = at(b.x, b.y, a, 1.6); fling(1, px, py, 0.12, a + sg * 0.8, rnd(0.6, 1.5), rnd(0.1, 0.4), rnd(0.9, 1.3), rnd(0.38, 0.55)); } }
    // ---- Rock You: dust and stone where each crystal breaks through; the burst
    const rp = ctx.rockPlan; if (rp !== seen.rp) { seen.rp = rp; seen.up = []; seen.rpB = false; }
    if (rp) { rp.crystals.forEach((c, i) => { if (!c.up || seen.up[i]) return; seen.up[i] = 1; for (let j = 0; j < (L ? 2 : 4); j++) { const a = rnd(0, TAU), [px, py] = at(c.x, c.y, a, 0.35); fling(0, px, py, 0.15, a, rnd(1, 3), rnd(3, 6), rnd(0.8, 1.2), rnd(0.06, 0.13)); }
        for (let j = 0; j < (L ? 1 : 2); j++) { const a = rnd(0, TAU), [px, py] = at(c.x, c.y, a, 0.4); fling(1, px, py, 0.1, a, rnd(0.8, 1.6), 0.3, rnd(0.9, 1.3), rnd(0.35, 0.5)); }
        ev({ type: 'cracks', x: c.x, y: c.y, t0: now, life: (rp.tBurst - c.rise) + 0.5, grow: 0.15, w: 0.04, heat: 0.85, lines: mkCracks(L ? 3 : 4, 0.9, c.x * 3.1 + c.y, 1.0, 0.25) }); });
      if (rp.burst && !seen.rpB) { seen.rpB = true; for (const c of rp.crystals) { for (let j = 0; j < (L ? 3 : 6); j++) { const a = rnd(0, TAU); fling(4, c.x, c.y, rnd(0.4, 1.5), a, rnd(2.5, 6.5), rnd(3, 7), rnd(1.0, 1.5), rnd(0.13, 0.24), { heat: 1, col: Math.random() < 0.7 ? SAND : ORANGEL }); }
          for (let j = 0; j < (L ? 1 : 3); j++) { const a = rnd(0, TAU); fling(0, c.x, c.y, 0.3, a, rnd(2, 4.5), rnd(3, 6), rnd(0.9, 1.3), rnd(0.08, 0.16)); }
          for (let j = 0; j < (L ? 2 : 4); j++) { const a = rnd(0, TAU); fling(2, c.x, c.y, rnd(0.5, 1.2), a, rnd(4, 9), rnd(2, 6), rnd(0.3, 0.6), 0.03); }
          fling(1, c.x, c.y, 0.3, rnd(0, TAU), rnd(0.5, 1.2), 0.6, rnd(1.1, 1.5), rnd(0.5, 0.7)); ring(c.x, c.y, 1.1, 0.5, GOLD, now, 0.14); }
        blastAt(rp.cx, rp.cy, 2.4, now, { wR: 3.4, h: 0.3, life: 0.4 }); } }
    // ---- Drill Cannon
    const D = ctx.drill; if (D) { const ds = D.state;
      if (ds === 'spin') { const a = ctx.anchor ? ctx.anchor('drillBase') : null; if (a) for (let i = rate(dt, L ? 8 : 18); i > 0; i--) { const sd = Math.random() < 0.5 ? 1 : -1, aa = (b.a || 0) + sd * Math.PI / 2, [px, py] = at(a.x, a.y, aa, 0.55); fling(1, px, py, a.z - 0.1, aa + rnd(-0.4, 0.4), rnd(0.8, 2), rnd(0.6, 1.4), rnd(0.6, 0.9), rnd(0.18, 0.3), { peak: 0.55 }); } }
      if (ds === 'out') { if (seen.ds !== 'out') FT.length = 0; const l = FT[FT.length - 1]; if (!l || Math.hypot(D.x - l[0], (D.y - l[1]) / GY, D.z - l[2]) > 0.09) { FT.push([D.x, D.y, D.z]); if (FT.length > 24) FT.shift(); } }
      if (ds === 'out' && seen.ds === 'spin') { const a = ctx.anchor ? ctx.anchor('drillTip') : null; if (a) { for (let i = 0; i < (L ? 5 : 12); i++) fling(2, a.x, a.y, a.z, rnd(0, TAU), rnd(2, 5), rnd(0.5, 3), rnd(0.2, 0.35), 0.03); flash(a.x, a.y, a.z, 0.7, 0.16, 0.45, now); } }   // (fired)
      if (ds === 'drill') { const x = D.x, y = D.y, k = cl(D.t / 1.2), sg = 1;
        if (seen.ds !== 'drill') { seen.tick = 0; ring(x, y, 1.7, 0.45, AMBER, now, 0.18); glow(x, y, 1.6, 0.5, AMBER, 0.5, now); ev({ type: 'cracks', x, y, t0: now, life: 1.6, grow: 0.12, w: 0.055, heat: 0.95, lines: mkCracks(L ? 4 : 6, 0.9, x * 2.3 + y, 0.9, 0.3) });   // (it lands, nose-down)
          for (let i = 0; i < (L ? 5 : 12); i++) { const a = rnd(0, TAU); fling(0, x, y, 0.2, a, rnd(1.5, 3.5), rnd(3, 6), rnd(0.8, 1.2), rnd(0.07, 0.16), { col: Math.random() < 0.5 ? EARTH : SAND }); }
          for (let i = 0; i < (L ? 3 : 6); i++) { const a = i / 6 * TAU, [px, py] = at(x, y, a, 0.5); fling(1, px, py, 0.15, a, rnd(1.5, 2.5), 0.4, rnd(1.0, 1.4), rnd(0.38, 0.55)); } }
        for (; seen.tick < (D.nTick || 0); seen.tick++) { const n = seen.tick + 1;   // each grinding tick: the cracks spread further and pulse, a burst of clods
          ev({ type: 'cracks', x, y, t0: now, life: Math.max(0.3, 1.25 - D.t) + 0.35, grow: 0.1, w: 0.05 + 0.008 * n, heat: 0.95 + 0.07 * n, lines: mkCracks(L ? 3 : 5, 0.9 + 0.42 * n, x * 1.7 + y + n * 3.1, 0.9, 0.35) });
          ring(x, y, 1.7, 0.32, GOLD, now, 0.14); flash(x, y, 0.3, 0.45 + 0.08 * n, 0.12, 0.2, now);
          for (let i = 0; i < (L ? 3 : 7); i++) { const a = rnd(0, TAU); fling(0, x, y, 0.25, a, rnd(2, 4.5), rnd(3.5, 6.5), rnd(0.7, 1.1), rnd(0.06, 0.14), { col: Math.random() < 0.5 ? EARTH : EARTHD }); } }
        for (let i = rate(dt, (L ? 14 : 38) * RM); i > 0; i--) { const a = rnd(0, TAU), [px, py] = at(x, y, a, rnd(0.45, 0.7)), tg = a + sg * Math.PI * 0.5 + rnd(-0.4, 0.2); fling(0, px, py, 0.1, tg, rnd(1.8, 4.2), rnd(2.5, 5.5), rnd(0.6, 1.0), rnd(0.05, 0.13), { col: Math.random() < 0.45 ? EARTHD : Math.random() < 0.6 ? EARTH : SAND }); }   // clods churned out, spiralling
        for (let i = rate(dt, (L ? 12 : 34) * RM); i > 0; i--) { const a = rnd(0, TAU), [px, py] = at(x, y, a, rnd(0.2, 0.5)); fling(0, px, py, 0.15, a + 1.2, rnd(1, 3), rnd(3.5, 7), rnd(0.45, 0.75), rnd(0.022, 0.045), { col: Math.random() < 0.5 ? SAND : EARTH }); }   // grit
        for (let i = rate(dt, (L ? 18 : 48) * RM); i > 0; i--) { const a = rnd(0, TAU); fling(2, x, y, 0.25, a + 1.4, rnd(3, 8), rnd(1.5, 5), rnd(0.18, 0.38), 0.03); }   // sparks off the bit
        for (let i = rate(dt, L ? 3 : 7); i > 0; i--) { const a = rnd(0, TAU), [px, py] = at(x, y, a, rnd(0.6, 1.0)); fling(1, px, py, 0.12, a + 1.3, rnd(0.6, 1.4), rnd(0.2, 0.5), rnd(0.8, 1.2), rnd(0.32, 0.5), { warm: 0.4 * k }); } }
      if (D.impact && D.impact !== seen.imp) { seen.imp = D.impact; const x = D.impact.x, y = D.impact.y; blastAt(x, y, 2.6, now, { wR: 3.0, h: 0.34 });
        ev({ type: 'slabs', x, y, t0: now, life: 1.5, rise: 0.12, list: mkSlabs(L ? 4 : 7, 1.4, 2.1, Math.random() * 50, 0.8) });
        for (let i = 0; i < (L ? 5 : 12); i++) { const a = rnd(0, TAU); fling(4, x, y, rnd(0.3, 1.2), a, rnd(3, 7.5), rnd(3.5, 8), rnd(1.0, 1.5), rnd(0.14, 0.27), { heat: 1, col: Math.random() < 0.55 ? ORANGEL : SAND }); }   // crystal fragments
        for (let i = 0; i < (L ? 7 : 16); i++) { const a = rnd(0, TAU); fling(0, x, y, 0.3, a, rnd(2, 6), rnd(4, 8), rnd(1.0, 1.5), rnd(0.08, 0.22), { warm: Math.random() < 0.3 ? 0.6 : 0 }); }
        for (let i = 0; i < (L ? 5 : 11); i++) { const a = i / 11 * TAU, [px, py] = at(x, y, a, 1); fling(1, px, py, 0.2, a, rnd(3.5, 6), rnd(0.3, 0.9), rnd(1.3, 1.9), rnd(0.5, 0.75), { warm: 0.4 }); }
        for (let i = 0; i < (L ? 5 : 12); i++) { const a = rnd(0, TAU); fling(2, x, y, 0.3, a, rnd(4, 9), rnd(3, 7), rnd(0.3, 0.6), 0.03); } }
      if (ds === 'docked' && seen.ds === 'mat') { const a = ctx.anchor ? ctx.anchor('dock') : null; if (a) { for (let i = 0; i < (L ? 6 : 14); i++) fling(2, a.x, a.y, a.z, rnd(0, TAU), rnd(1.5, 4), rnd(1, 3.5), rnd(0.25, 0.45), 0.025); flash(a.x, a.y, a.z, 1.0, 0.25, 0.6, now); } }   // (the new bit is whole)
      seen.ds = ds; }
    // ---- the summon: the ground cracks, bulges and glows over the drill coming up; it breaks the surface; the dust settles
    const su = ctx.summonT, SU = ctx.SUMMON || { burst: 1.0 }; if (su != null) { const k = cl(su / SU.burst);
      if (!seen.sum) { seen.sum = true; ev({ type: 'cracks', x: b.x, y: b.y, t0: now, life: SU.burst + 0.9, grow: SU.burst * 0.9, w: 0.07, heat: 1, lines: mkCracks(L ? 7 : 10, 2.5, b.x * 1.3 + b.y, 0.8, 0.9) }); }
      if (su < SU.burst) { for (let i = rate(dt, (L ? 5 : 12) * RM); i > 0; i--) { const a = rnd(0, TAU), [px, py] = at(b.x, b.y, a, rnd(0.6, 2.2)); fling(1, px, py, 0.1, a, rnd(0.2, 0.8), rnd(0.2, 0.6), rnd(1.1, 1.6), rnd(0.35, 0.6), { peak: 0.5, warm: 0.3 * k }); }   // rumbling dust
        for (let i = rate(dt, (L ? 8 : 22) * k * RM); i > 0; i--) { const a = rnd(0, TAU), [px, py] = at(b.x, b.y, a, rnd(0.3, 1.9)); fling(0, px, py, 0.12, a, rnd(0.2, 1.2), rnd(1, 2.8), rnd(0.45, 0.8), rnd(0.04, 0.1), { col: Math.random() < 0.5 ? EARTH : EARTHD }); } }   // stones jittering up
      if (su >= SU.burst && !seen.breach) { seen.breach = true; breach(b.x, b.y, now); }
      if (su > SU.burst + 0.15 && su < SU.burst + 1.0) for (let i = rate(dt, (L ? 3 : 8) * RM); i > 0; i--) { const a = rnd(0, TAU), [px, py] = at(b.x, b.y, a, rnd(1.2, 2.6)); fling(1, px, py, 0.1, a, rnd(0.3, 0.9), rnd(0.1, 0.3), rnd(1.8, 2.6), rnd(0.55, 0.9), { peak: 0.45, drag: 1.3, g: -0.12 }); } }   // settling dust
    // ---- Calamity
    const C = ctx.calamity; if (C !== seen.cal) { seen.cal = C; seen.drUp = []; seen.burst = false; seen.em = C && C.emerge && C.emerge.length ? C.emerge[C.emerge.length - 1] : null; seen.under = false; seen.lock = false; seen.marks = false; }
    if (C && !C.done) {
      if (C.phase === 'xform') { if (Math.random() < dt * (L ? 6 : 14)) { const tr = ctx.anchor ? ctx.anchor('track' + ['FL', 'FR', 'RL', 'RR'][(Math.random() * 4) | 0]) : null; if (tr) fling(1, tr.x, tr.y, 0.1, rnd(0, TAU), rnd(0.5, 1.2), 0.3, rnd(0.8, 1.1), rnd(0.3, 0.45)); }
        if (C.xf > 0.84 && !seen.lock) { seen.lock = true; const a = ctx.anchor ? ctx.anchor('dock') : null; if (a) { for (let i = 0; i < (L ? 6 : 14); i++) fling(2, a.x, a.y, a.z, rnd(0, TAU), rnd(2, 5), rnd(1, 4), rnd(0.25, 0.45), 0.03); flash(a.x, a.y, a.z, 0.7, 0.2, 0.5, now); } } }
      if (C.phase === 'drill') { const under = !!b.under, sp = Math.hypot(b.vx || 0, b.vy || 0), ha = b.a || 0;
        if (under && !seen.under) { stomp(b.x, b.y, 2.0, now, 0.7); }   // (the dive: it breaks into the floor)
        seen.under = under;
        if (under) { if (trailAdd(WAKE, b.x, b.y, now)) { seen.wakeN = (seen.wakeN || 0) + 1; if (seen.wakeN % 3 === 0) { const [cx, cy] = at(b.x, b.y, ha, 0.9); ev({ type: 'cracks', x: cx, y: cy, t0: now, life: 1.2, grow: 0.12, w: 0.045, heat: 0.95, lines: mkCracks(L ? 3 : 5, 1.1, Math.random() * 99, 1.0, 0.2) }); } }
          for (let i = rate(dt, (L ? 12 : 26) * RM); i > 0; i--) { const sd = Math.random() < 0.5 ? 1 : -1, a = ha + sd * rnd(1.2, 1.9), [px, py] = at(b.x, b.y, a, rnd(0.6, 1.0)); fling(0, px, py, 0.25, a, rnd(1.2, 2.8), rnd(1.5, 3.5), rnd(0.7, 1.1), rnd(0.06, 0.15), { col: Math.random() < 0.5 ? EARTH : EARTHD }); }
          for (let i = rate(dt, L ? 4 : 9); i > 0; i--) { const a = ha + Math.PI + rnd(-1, 1), [px, py] = at(b.x, b.y, a, rnd(0.6, 1.2)); fling(1, px, py, 0.15, a, rnd(0.3, 1), 0.3, rnd(0.9, 1.3), rnd(0.35, 0.55)); } }
        else if ((b.z || 0) < 0.25 && sp > 1.5) { const tip = ctx.anchor ? ctx.anchor('drillTip') : null; if (tip) { trailAdd(TRC, tip.x, tip.y, now);
            for (let i = rate(dt, (L ? 12 : 28) * RM); i > 0; i--) { const sd = Math.random() < 0.5 ? 1 : -1, a = ha + sd * rnd(1.0, 2.2); fling(0, tip.x, tip.y, 0.2, a, rnd(1.5, 4), rnd(2.5, 5), rnd(0.6, 1.0), rnd(0.06, 0.14), { col: Math.random() < 0.5 ? EARTH : SAND }); }
            for (let i = rate(dt, L ? 3 : 7); i > 0; i--) fling(1, tip.x, tip.y, 0.15, ha + Math.PI + rnd(-1, 1), rnd(0.5, 1.4), 0.3, rnd(0.8, 1.2), rnd(0.3, 0.45)); } } }
      // emergence: slabs thrown up, a powerful Earth shock wave
      const em = C.emerge || []; const e = em[em.length - 1]; if (e && e !== seen.em) { seen.em = e; if (now - e.t < 0.2) { blastAt(e.x, e.y, 2.2, now, { wR: 3.0, h: 0.38, life: 0.45, k: 0.8 });
          for (let i = 0; i < (L ? 4 : 8); i++) { const a = i / 8 * TAU + rnd(-0.25, 0.25), [px, py] = at(e.x, e.y, a, 0.9); fling(3, px, py, 0.25, a, rnd(2, 4), rnd(6, 9), rnd(1.2, 1.6), rnd(0.38, 0.58), { col: Math.random() < 0.5 ? EARTH : SAND, wx: rnd(-6, 6), wy: rnd(-6, 6) }); }
          for (let i = 0; i < (L ? 8 : 18); i++) { const a = rnd(0, TAU); fling(0, e.x, e.y, 0.3, a, rnd(2, 6), rnd(4, 8), rnd(1.0, 1.5), rnd(0.08, 0.2)); }
          for (let i = 0; i < (L ? 6 : 14); i++) { const a = i / 14 * TAU, [px, py] = at(e.x, e.y, a, 1.1); fling(1, px, py, 0.2, a, rnd(3.5, 6), rnd(0.3, 0.8), rnd(1.3, 1.9), rnd(0.5, 0.75), { warm: 0.35 }); }
          for (let i = 0; i < (L ? 6 : 14); i++) fling(2, e.x, e.y, 0.3, rnd(0, TAU), rnd(4, 9), rnd(3, 7), rnd(0.3, 0.6), 0.03); } }
      // the climax: fracture stars at the eight marks; each drill tearing up; the coordinated burst
      if (C.drills && C.drills.length) { if (!seen.marks) { seen.marks = true; for (const d of C.drills) ev({ type: 'cracks', x: d.x, y: d.y, t0: now, life: 4, grow: 0.3, w: 0.06, heat: 1, star: d, lines: mkCracks(L ? 4 : 6, 1.5, d.x * 1.7 + d.y * 0.3 + d.i, 0.8, 0.35) }); }
        C.drills.forEach((d, i) => { if (!d.up || seen.drUp[i]) return; seen.drUp[i] = 1; for (let j = 0; j < (L ? 3 : 6); j++) { const a = rnd(0, TAU); fling(0, d.x, d.y, 0.3, a, rnd(1.5, 3.5), rnd(4, 7), rnd(0.9, 1.3), rnd(0.08, 0.18)); }
          for (let j = 0; j < (L ? 1 : 3); j++) { const a = rnd(0, TAU), [px, py] = at(d.x, d.y, a, 0.9); fling(1, px, py, 0.2, a, rnd(1, 2.5), 0.4, rnd(1.1, 1.5), rnd(0.45, 0.65)); }
          ring(d.x, d.y, 1.6, 0.45, AMBER, now, 0.14); });
        if (C.burstDone && !seen.burst) { seen.burst = true; C.drills.forEach((d, i) => { blastAt(d.x, d.y, 1.9, now, { wR: 3.2, h: 0.36, life: 0.6, wl: 0.7, cracks: false, lo: true, sz: 1.5 });
            for (let j = 0; j < (L ? 3 : 8); j++) { const a = rnd(0, TAU); fling(4, d.x, d.y, rnd(0.5, 2.8), a, rnd(3, 8), rnd(3, 8), rnd(1.0, 1.6), rnd(0.16, 0.3), { heat: 1, col: Math.random() < 0.55 ? ORANGEL : SAND }); }
            for (let j = 0; j < (L ? 2 : 5); j++) { const a = rnd(0, TAU); fling(0, d.x, d.y, 0.3, a, rnd(2, 5), rnd(4, 8), rnd(1.0, 1.5), rnd(0.1, 0.22), { warm: 0.5 }); }
            for (let j = 0; j < (L ? 1 : 2); j++) { const a = rnd(0, TAU); fling(3, d.x, d.y, 0.3, a, rnd(1.5, 3), rnd(5, 8), rnd(1.2, 1.6), rnd(0.32, 0.48), { col: EARTH }); }
            for (let j = 0; j < (L ? 2 : 4); j++) { const a = j / 4 * TAU + rnd(-0.3, 0.3), [px, py] = at(d.x, d.y, a, 1); fling(1, px, py, 0.3, a, rnd(3, 5), rnd(0.5, 1.5), rnd(1.4, 2.0), rnd(0.55, 0.8), { warm: 0.5 }); }
            for (let j = 0; j < (L ? 2 : 5); j++) fling(2, d.x, d.y, rnd(0.5, 2.5), rnd(0, TAU), rnd(4, 9), rnd(2, 7), rnd(0.3, 0.6), 0.03); }); } } }
    // ---- the crumble (timeout or the end of Calamity): stone-coated fragments, grit, settling dust; first an amber flicker escaping the cracks
    const cr = ctx.pose && ctx.pose.crumble || 0; if (cr > 0.001) { const top = seen.top || (ctx.anchor ? ctx.anchor('shellTop') : null); if (!seen.top && top) seen.top = top; const zt = top ? Math.max(0.8, top.z) : 1.8, ha = b.a || 0;
        if (!seen.crumble) { seen.crumble = true; for (let i = 0; i < (L ? 6 : 14); i++) { const a = rnd(0, TAU), [px, py] = at(b.x, b.y, a, rnd(0.3, 1.2)); fling(2, px, py, rnd(0.5, zt), a, rnd(1, 3), rnd(1, 3), rnd(0.3, 0.6), 0.03); } }
        if (cr < 0.85) { const sp = (u, v, z) => { const a = rnd(0, TAU), rr = Math.sqrt(Math.random()) * (1 - 0.55 * z / zt), lx = Math.cos(a) * rr * 1.5, ly = Math.sin(a) * rr * 1.1; return [b.x + lx * Math.cos(ha) - ly * Math.sin(ha), b.y + (lx * Math.sin(ha) + ly * Math.cos(ha)) * GY]; };
          for (let i = rate(dt, (L ? 12 : 28) * RM); i > 0; i--) { const z = rnd(0.25, zt * (1 - 0.5 * cr)), [px, py] = sp(0, 0, z), a = Math.atan2((py - b.y) / GY, px - b.x); fling(0, px, py, z, a, rnd(0.6, 2.2), rnd(0, 2.5), rnd(0.9, 1.4), rnd(0.12, 0.3), { col: Math.random() < 0.55 ? SAND : Math.random() < 0.6 ? ORANGEL : STEEL, heat: 0.9 }); }
          for (let i = rate(dt, (L ? 16 : 40) * RM); i > 0; i--) { const z = rnd(0.2, zt * (1 - 0.5 * cr)), [px, py] = sp(0, 0, z); fling(0, px, py, z, rnd(0, TAU), rnd(0.3, 1.5), rnd(0, 1.5), rnd(0.6, 1.0), rnd(0.025, 0.055), { col: Math.random() < 0.6 ? SAND : EARTH, peak: 1 }); }
          for (let i = rate(dt, (L ? 3 : 7) * RM); i > 0; i--) { const z = rnd(0.1, 0.8), [px, py] = sp(0, 0, z); fling(1, px, py, z, rnd(0, TAU), rnd(0.4, 1.2), rnd(0.2, 0.6), rnd(1.6, 2.4), rnd(0.55, 0.9), { peak: 0.6, drag: 1.4, g: -0.35 }); } } }
    else { seen.crumble = false; seen.top = null; } }
  /* ================= the floor (under the actors): soft light, shock rings, markers ================= */
  GM.drawUnder = guard('drawUnder', (ctx, c) => { const F = fg(), G = g3(); if (!F || !G) return; sync(ctx); const now = nowOf(ctx), H = ctx.H, T = ctx.T ? ctx.T() : H.X.Tz(), Q = F.begin(c, null), sx = x => H.sx(x), sy = y => H.sy(y), b = ctx.body || {};
    for (const r of RINGS) { const u = (now - r.t0) / r.life; if (u < 0 || u > 1) continue; const R = r.R * T * (0.15 + 0.85 * eout(u)); Q.ring(sx(r.x), sy(r.y), R, r.col, (1 - u) * 0.85, T * r.w * (1 - 0.6 * u) + 1, GY); }
    for (const g of GLOWS) { const u = (now - g.t0) / g.life; if (u < 0 || u > 1) continue; Q.glow(sx(g.x), sy(g.y), g.R * T * (0.6 + 0.4 * eout(u)), g.col, g.a * (1 - u) * (1 - u), GY); }
    const R = ctx.roll; if (R) { const k = R.ph === 0 ? sm(R.t / 0.12) : R.ph === 1 ? 1 : 1 - sm(R.t / 0.25); Q.glow(sx(b.x), sy(b.y), T * 2.1, AMBER, 0.28 * k, GY); Q.ring(sx(b.x), sy(b.y), T * 1.62, GOLD, 0.35 * k, T * 0.16, GY); }
    const rp = ctx.rockPlan; if (rp) { const u = rp.burst ? 1 - cl((rp.t - rp.burstT) / 0.5) : sm(rp.t / Math.max(0.1, rp.tErupt)), pre = rp.burst ? 1 : sm((rp.t - rp.tErupt) / Math.max(0.1, rp.tBurst - rp.tErupt));
      Q.ring(sx(rp.cx), sy(rp.cy), T * 3.4, AMBER, (rp.burst ? 0 : 0.55) * u, T * 0.1, GY); Q.glow(sx(rp.cx), sy(rp.cy), T * 3.4, AMBER, (0.2 + 0.3 * pre) * u, GY); for (const k of rp.crystals) if (k.up) Q.glow(sx(k.x), sy(k.y), T * 1.0, GOLD, (0.35 + 0.35 * pre) * u, GY); }
    const D = ctx.drill; if (D && D.state === 'drill') { const k = cl(D.t / 1.2), nt = D.nTick || 0, pulse = nt > 0 ? Math.exp(-Math.max(0, D.t - 0.3 * (nt - 0.5)) * 9) : 0; Q.glow(sx(D.x), sy(D.y), T * (1.3 + 1.2 * k), AMBER, 0.22 + 0.25 * k + 0.15 * pulse, GY); Q.ground(sx(D.x), sy(D.y), T * 1.8, 0.32 + 0.3 * k + 0.1 * pulse, 0.4 + 0.2 * pulse, 2.3, GY, 1); }
    const su = ctx.summonT, SU = ctx.SUMMON || { burst: 1.0 }; if (su != null && su < SU.burst + 0.3) { const k = sm(su / SU.burst), f = 1 - sm((su - SU.burst) / 0.3); Q.glow(sx(b.x), sy(b.y), T * 2.8, AMBER, (0.2 + 0.4 * k) * f, GY); Q.ground(sx(b.x), sy(b.y), T * 2.6, 0.35 + 0.55 * k, 0.55 * k * f, 4.1, GY, 1); }
    const C = ctx.calamity; if (C && !C.done) { if (b.under) { const pu = (now * 1.6) % 1; Q.glow(sx(b.x), sy(b.y), T * 1.9, AMBER, 0.42 + 0.1 * Math.sin(now * 9), GY); Q.ring(sx(b.x), sy(b.y), T * (1.2 + 1.2 * pu), AMBER, 0.6 * (1 - pu), T * 0.12, GY); }
      if (C.drills && C.drills.length) for (const d of C.drills) { const gk = d.glow || 0, bu = d.burst > 1 ? cl((d.burst - 1) / 0.7) : 0; if (bu >= 1) continue; Q.glow(sx(d.x), sy(d.y), T * (1.3 + 0.9 * (d.rise || 0)), AMBER, (0.35 + 0.45 * gk) * (1 - bu), GY); if (!(d.rise > 0)) { const pu = (now * 2 + d.i * 0.13) % 1; Q.ring(sx(d.x), sy(d.y), T * (0.6 + 0.8 * pu), GOLD, 0.6 * (1 - pu), T * 0.1, GY); } } }
    F.flush(c); });
  /* ================= the volumes (over the actors; the rider's face kept clear) ================= */
  const PT = new Float32Array(3 * 80), PT2 = new Float32Array(3 * 80), HX = new Float32Array(3 * 80), RA = new Float32Array(80), AA = new Float32Array(80), RA2 = new Float32Array(80);
  GM.drawOver = guard('drawOver', (ctx, c) => { const G = g3(), F = fg(); if (!G || !F) return; sync(ctx);
    const now = nowOf(ctx); if (now - lastT > 1e-4) { const dt = Math.min(0.1, now - lastT); lastT = now; stepParts(dt); expire(now); }   // (after the release the core stops calling update: the dust still settles)
    const H = ctx.H, T = ctx.T ? ctx.T() : H.X.Tz(), Z = T * 0.695, b = ctx.body || { x: 0, y: 0, a: 0 }, Pz = ctx.pose || {}, cr = Pz.crumble || 0;
    const suP = ctx.summonT, onFoot = suP != null && suP < ((ctx.SUMMON && ctx.SUMMON.mount1) || 2.35), seat = ctx.anchor && cr < 0.01 && !onFoot ? ctx.anchor('seat') : null, me = H.me, pet = seat ? [H.sx(seat.x), H.sy(seat.y) - (seat.z + 0.45) * Z, T * 0.85] : me ? [H.sx(me.x), H.sy(me.y) - 0.6 * Z, T * 0.7] : null;
    const Q = G.begin(c, H, Z, b.x, b.y, pet), K = Q.K, L = Q.low;
    // the turtle's depth stand-in: what is behind the shell hides behind it
    const suT = ctx.summonT, rising = suT != null && suT < ((ctx.SUMMON && ctx.SUMMON.burst) || 1) + 0.2;
    if (!b.under && !rising && (Pz.alpha == null ? 1 : Pz.alpha) > 0.5 && cr < 0.3 && !(ctx.calamity && ctx.calamity.done)) { const top = ctx.anchor ? ctx.anchor('shellTop') : null, z0 = b.z || 0, ht = top ? Math.max(0.6, top.z - z0) : 1.6, xf = Pz.xf || 0;
      if (typeof window !== 'undefined' && window.__GB_OCC) Q.sphere(b.x, b.y, z0 + ht * 0.4, 1, K.core, AMBER, 0.6, { amp: 0, ex: 1.2, sz: ht * 0.45, ang: b.a || 0 }); else Q.occluder(b.x, b.y, z0 + ht * 0.38, 1.2 + 0.1 * xf, 0.88 - 0.15 * xf, ht * 0.46, b.a || 0); }
    drawSummon(Q, ctx, now); drawRoll(Q, ctx, now); drawRock(Q, ctx, now); drawDrill(Q, ctx, now); drawCal(Q, ctx, now); drawEvents(Q, now); drawParts(Q);
    G.flush(c);
    // flashes over everything (feathered glows), brief
    if (FLASH.length) { const Qf = F.begin(c, pet), RM = ctx.calm && ctx.calm() ? 0.4 : 1; for (const f of FLASH) { const u = (now - f.t0) / f.life; if (u < 0 || u > 1) continue; Qf.glow(H.sx(f.x), H.sy(f.y) - f.z * Z, T * f.R * (0.8 + 0.6 * u), GOLD, f.a * (1 - u) * (1 - u) * RM, 1); } F.flush(c); } });
  /* ---- the summon: the ground bulging, fissured and glowing over the drill before it breaks through ---- */
  function drawSummon(Q, ctx, now) { const su = ctx.summonT, SU = ctx.SUMMON || { burst: 1.0 }; if (su == null || su > SU.burst + 0.08) return; const b = ctx.body, K = Q.K, L = Q.low, k = sm(su / SU.burst), fade = 1 - sm((su - SU.burst) / 0.08), hv = 0.05 * Math.sin(now * 13) * k;
    const o = { sz: 0.42, ex: 1.2, ang: b.a || 0, amp: 0.42, seed: 4.4, flow: 2.2, heat: 0.8, warm: 0.55 * k, lod: L ? 12 : 18 }, z = -0.8 + 0.6 * k + hv;
    Q.sphere(b.x, b.y, z, 1.5, K.stone, EARTH, fade, o); Q.sphere(b.x, b.y, z, 1.5, K.crystal, AMBER, fade * (0.25 + 0.75 * k), Object.assign({}, o, { heat: 0.55 + 0.6 * k })); }
  /* ---- Shell Roll: amber accents turning with the shell, a low ring of dust following it ---- */
  function drawRoll(Q, ctx, now) { const R = ctx.roll; if (!R) return; const b = ctx.body, K = Q.K, L = Q.low, k = R.ph === 0 ? sm(R.t / 0.12) : R.ph === 1 ? 1 : 1 - sm(R.t / 0.25), sp = R.spin || 0;
    for (let tier = 0; tier < 2; tier++) { const n = 5, rr = tier ? 1.05 : 1.5, z = tier ? 1.05 : 0.5, span = tier ? 0.55 : 0.75, ph0 = sp + tier * 0.6;
      for (let i = 0; i < n; i++) { const a0 = ph0 + i / n * TAU; for (let j = 0; j < 7; j++) { const a = a0 + (j / 6 - 0.5) * span; PT[j * 3] = b.x + Math.cos(a) * rr; PT[j * 3 + 1] = b.y + Math.sin(a) * rr * GY; PT[j * 3 + 2] = (b.z || 0) + z; }
        Q.tube(PT, 7, () => 0.05, K.amber, AMBER, 0.95 * k, { m: 5, heat: 1.05, af: u => Math.sin(Math.PI * u) ** 1.5, seed: i }); } }
    const n = L ? 6 : 9; for (let i = 0; i < n; i++) { const a = i / n * TAU + sp * 0.3, [px, py] = at(b.x, b.y, a, 1.85); Q.sphere(px, py, 0.16, 0.5, K.dust, DUSTC, 0.5 * k, { sz: 0.55, amp: 0.4, seed: i * 3.1, flow: 1.4, lod: L ? 8 : 10 }); } }
  /* ---- Rock You: the crack running to the target; the crystal formations ---- */
  function drawRock(Q, ctx, now) { const rp = ctx.rockPlan; if (!rp) return; const K = Q.K, L = Q.low, b = ctx.body;
    // the brace: a glowing fracture runs along the floor from Genbu to the target
    if (!rp.burst) { const fr = ctx.anchor ? ctx.anchor('front') : null, x0 = fr ? fr.x : b.x, y0 = fr ? fr.y : b.y, g = sm(rp.t / Math.max(0.1, rp.tErupt)), fade = 1 - sm((rp.t - rp.tErupt - 0.3) / 0.4), n = 12, dx = rp.cx - x0, dy = (rp.cy - y0) / GY, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len, sd = rp.cx * 1.3;
      if (fade > 0.01) { for (let i = 0; i < n; i++) { const u = i / (n - 1) * g, off = (R1(sd + i) - 0.5) * 0.45 * Math.sin(Math.PI * u); PT[i * 3] = x0 + dx * u + nx * off; PT[i * 3 + 1] = y0 + (dy * u + ny * off) * GY; PT[i * 3 + 2] = 0.03; }
        Q.tube(PT, n, u => 0.06 * (1 - 0.6 * u), K.strip, AMBER, 0.9 * fade, { m: 4, heat: 1.05, af: u => sm(u * 6) }); } }
    const pre = rp.burst ? 1 : sm((rp.t - rp.tErupt) / Math.max(0.1, rp.tBurst - rp.tErupt)), pulse = 0.5 + 0.5 * Math.sin(now * 16);
    rp.crystals.forEach((c, i) => { if (!c.up) return; const age = rp.t - c.t, u = cl(age / 0.2), hk = eback(u); let al = 1, sc = 1;
      if (rp.burst) { const e = rp.t - rp.burstT; if (e > 0.07) return; al = 1 - e / 0.07; sc = 1 + e * 3; }
      const sd = c.x * 3.7 + c.y * 1.9 + i, h = (c.h || 2) * 1.0 * sc, r = (0.3 + 0.1 * R1(sd)) * sc, la = R1(sd + 2) * TAU, lean = 0.12 + Math.abs(c.lean || 0) * 0.5, gk = 0.35 + 0.65 * pre + 0.15 * pre * pulse, sink = -h * 1.05 * (1 - hk);
      // the main prism, then one or two smaller ones leaning out of it
      const draw = (x, y, hh, rr, yaw, tilt, t, z0) => { const Rm = Q.rot(yaw, tilt, 0), o = { heat: 1, seed: sd + t, qs: 0.42, warm: 0.25 * gk }; Q.mesh(CRYS[t % 8], x, y, z0, rr, rr, hh, Rm, K.stone, SAND, al, o); Q.mesh(CRYS[t % 8], x, y, z0, rr, rr, hh, Rm, K.crystal, AMBER, al * (0.3 + 0.7 * gk), { heat: 0.5 + 0.65 * gk, seed: sd + t, qs: 0.6 }); };
      draw(c.x, c.y, h, r, la, lean, i, sink);
      for (let j = 0; j < (L ? 1 : 2); j++) { const a = la + Math.PI * (0.7 + 0.6 * j) + 0.6 * (R1(sd + j * 5) - 0.5), [px, py] = at(c.x, c.y, a, r * 1.3), hh = h * (0.4 + 0.22 * R1(sd + j * 7)); draw(px, py, hh, r * 0.62, a, 0.45 + 0.3 * R1(sd + j * 3), i + 3 + j, -hh * 1.05 * (1 - eback(cl((age - 0.04 * (j + 1)) / 0.2)))); }
      // slabs of earth tipped up round its foot
      for (let j = 0; j < (L ? 2 : 3); j++) { const a = la + j / 3 * TAU + 0.9, [px, py] = at(c.x, c.y, a, 0.5 + 0.1 * R1(sd + j)), tl = (0.5 + 0.35 * R1(sd + j * 2)) * eout(u); Q.mesh(SLABS[(i + j) % 6], px, py, 0.02 + 0.07 * eout(u), 0.3, 0.24, 0.32, Q.rot(a, -tl, 0), K.stone, EARTH, al, { heat: 0.4, seed: sd + j }); } }); }
  /* ---- the Drill Cannon: the bearing's arcs; the flight; the grinding; the new bit materialising ---- */
  function drawDrill(Q, ctx, now) { const D = ctx.drill; if (!D) return; const K = Q.K, b = ctx.body;
    if (D.state === 'spin') { const a = ctx.anchor ? ctx.anchor('drillBase') : null, tip = ctx.anchor ? ctx.anchor('drillTip') : null; if (a && tip) { const k = sm(D.t / 0.35), ax = tip.x - a.x, ay = (tip.y - a.y) / GY, az = tip.z - a.z, al = Math.hypot(ax, ay, az) || 1, N = [ax / al, ay / al, az / al];
        let ex = -N[1], ey = N[0], ez = 0; const el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el; const fx = N[1] * ez - N[2] * ey, fy = N[2] * ex - N[0] * ez, fz = N[0] * ey - N[1] * ex, spin = now * (8 + 22 * k);
        for (let ri = 0; ri < 2; ri++) { const R = ri ? 0.78 : 0.6, cx = a.x + ax * (0.12 + 0.12 * ri), cy = a.y + ay * GY * (0.12 + 0.12 * ri), cz = a.z + az * (0.12 + 0.12 * ri);
          for (let s = 0; s < 3; s++) { const a0 = spin * (ri ? -1 : 1) + s / 3 * TAU; for (let j = 0; j < 7; j++) { const th = a0 + (j / 6 - 0.5) * 1.2, ct = Math.cos(th), sn = Math.sin(th); PT[j * 3] = cx + (ex * ct + fx * sn) * R; PT[j * 3 + 1] = cy + (ey * ct + fy * sn) * R * GY; PT[j * 3 + 2] = cz + (ez * ct + fz * sn) * R; }
            Q.tube(PT, 7, () => 0.045, K.amber, AMBER, 0.95 * k, { m: 5, heat: 1.05, af: u => Math.sin(Math.PI * u) ** 1.5, seed: s + ri * 3 }); } } } }
    drawFurrow(Q, TRC, now, 0.8);
    // in flight: an amber trail with two strands of air wound round its arc
    if (D.state === 'out') { const n = Math.min(FT.length, 14) + 1; if (n >= 3) { PT[0] = D.x; PT[1] = D.y; PT[2] = D.z; for (let i = 1; i < n; i++) { const q = FT[FT.length - i]; PT[i * 3] = q[0]; PT[i * 3 + 1] = q[1]; PT[i * 3 + 2] = q[2]; }
        Q.tube(PT, n, u => 0.13 * (1 - 0.6 * u), K.amber, AMBER, 0.95, { m: 6, heat: 1.05, af: u => sm(u * 6) * (1 - u) ** 1.1, scroll: 4 }); Q.sphere(D.x, D.y, D.z, 0.4, K.amber, AMBER, 0.55, { amp: 0.35, lod: 10, heat: 0.95, seed: 5.5, flow: 2.5 });
        const sub = 3, m = (n - 1) * sub + 1; for (let s2 = 0; s2 < 2; s2++) { for (let j = 0; j < m; j++) { const f = j / sub, i0 = Math.min(n - 2, Math.floor(f)), t = f - i0, ax = PT[i0 * 3], ay = PT[i0 * 3 + 1] / GY, az = PT[i0 * 3 + 2], bx = PT[i0 * 3 + 3], by = PT[i0 * 3 + 4] / GY, bz = PT[i0 * 3 + 5];
            let tx = bx - ax, ty = by - ay, tz = bz - az; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl; let ex = -ty, ey = tx, ez = 0; const el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el; const fx = ty * ez - tz * ey, fy = tz * ex - tx * ez, fz = tx * ey - ty * ex;
            const u = j / (m - 1), th = s2 * Math.PI + j * 0.9 - now * 20, r = 0.34 * (0.35 + 0.65 * u) * (1 - 0.2 * u), ct = Math.cos(th), sn = Math.sin(th), px = ax + (bx - ax) * t, py = ay + (by - ay) * t, pz = az + (bz - az) * t;
            HX[j * 3] = px + (ex * ct + fx * sn) * r; HX[j * 3 + 1] = (py + (ey * ct + fy * sn) * r) * GY; HX[j * 3 + 2] = pz + (ez * ct + fz * sn) * r; }
          Q.tube(HX, m, u => 0.045 * (1 - 0.4 * u), K.amber, GOLD, 1, { m: 4, heat: 1.15, af: u => sm(u * 5) * (1 - u) ** 0.8 }); } } }
    // lodged nose-down, grinding: a churning ring of earth, a swirl of dust, an amber glow building toward the explosion
    if (D.state === 'drill') { const x = D.x, y = D.y, k = cl(D.t / 1.2), sp = D.spin || 0, L = Q.low, nt = D.nTick || 0, pulse = nt > 0 ? Math.exp(-Math.max(0, D.t - 0.3 * (nt - 0.5)) * 9) : 0, n = L ? 14 : 22;
      for (let i = 0; i <= n; i++) { const th = i / n * TAU, nz = 0.5 + 0.5 * Math.sin(th * 5 - sp * 0.6 + 1.3 * Math.sin(th * 3 + now * 6)), r = 0.78 + 0.12 * nz; PT[i * 3] = x + Math.cos(th) * r; PT[i * 3 + 1] = y + Math.sin(th) * r * GY; PT[i * 3 + 2] = -0.04 + 0.08 * nz; RA[i] = 0.16 + 0.12 * nz; AA[i] = 1; }
      Q.tube(PT, n + 1, null, K.stone, EARTHD, 1, { m: L ? 5 : 7, heat: 0.7, rA: RA, aA: AA, seed: 3.7, qlen: 8, warm: 0.3 * k + 0.35 * pulse });
      Q.torus(x, y, 0.14, 1.0 + 0.15 * k, 0.26, [0, 0, 1], -sp * 0.25, K.dust, DUSTC, 0.5, { amp: 0.5, seed: 2.1, nu: L ? 16 : 24, nv: 5, warm: 0.4 * k });
      Q.sphere(x, y, 0, 0.26 + 0.3 * k + 0.1 * pulse, K.amber, AMBER, 0.2 + 0.35 * k + 0.2 * pulse, { hemi: true, sz: 1.3, amp: 0.45, heat: Math.min(0.92, 0.6 + 0.25 * k + 0.15 * pulse), seed: 6.6, flow: 2, lod: L ? 10 : 14 });
      Q.sphere(x, y, 0.06, 0.07 + 0.1 * k, K.core, GOLD, 0.8 * k * k, { amp: 0, lod: 7 });
      PT2[0] = x; PT2[1] = y; PT2[2] = 0.05; PT2[3] = x; PT2[4] = y; PT2[5] = 0.6 + 1.7 * k; Q.tube(PT2, 2, u => (0.07 + 0.1 * k) * (1 - u), K.amber, AMBER, 0.55 * k * k, { m: 6, heat: 0.95, af: u => 1 - u, scroll: 3 });
      const nm = L ? 3 : 6; for (let j = 0; j < nm; j++) { const ph = (now * 1.1 + j / nm) % 1, a = j * 2.1 + now * 5 + ph * 4, r = 1.5 * (1 - ph) + 0.15; Q.sphere(x + Math.cos(a) * r, y + Math.sin(a) * r * GY, 0.15 + 0.9 * ph * ph, 0.05 + 0.04 * k, K.core, GOLD, k * Math.sin(Math.PI * ph), { amp: 0, lod: 5 }); } }
    // a new bit materialising on the carriage: amber motes converging, a ring of light sweeping along it
    if (D.state === 'mat') { const a = ctx.anchor ? ctx.anchor('drillBase') : null, tip = ctx.anchor ? ctx.anchor('drillTip') : null; if (a && tip) { const k = cl(D.t / 0.6), L = Q.low, ax = tip.x - a.x, ay = (tip.y - a.y) / GY, az = tip.z - a.z, al = Math.hypot(ax, ay, az) || 1, N = [ax / al, ay / al, az / al];
        let ex = -N[1], ey = N[0], ez = 0; const el = Math.hypot(ex, ey) || 1; ex /= el; ey /= el; const fx = N[1] * ez - N[2] * ey, fy = N[2] * ex - N[0] * ez, fz = N[0] * ey - N[1] * ex;
        const nm = L ? 8 : 16; for (let j = 0; j < nm; j++) { const p = cl(k * 1.5 - (j / nm) * 0.5), f = 0.1 + 0.8 * R1(j * 1.7), th = j * 2.4 + p * 6, r = 1.8 * (1 - eout(p)) + 0.04, ct = Math.cos(th), sn = Math.sin(th);
          const px = a.x + ax * f + (ex * ct + fx * sn) * r, py = a.y + (ay * f + (ey * ct + fy * sn) * r) * GY, pz = a.z + az * f + (ez * ct + fz * sn) * r + 0.6 * (1 - p); const fa = Math.sin(Math.PI * Math.min(1, p * 1.05));
          if (fa > 0.01) { Q.sphere(px, py, pz, 0.05, K.core, GOLD, fa, { amp: 0, lod: 5 }); Q.sphere(px, py, pz, 0.14, K.amber, AMBER, 0.6 * fa, { amp: 0.3, lod: 6, heat: 1, seed: j }); } }
        const sw = eout(k), cx = a.x + ax * sw, cy = a.y + ay * GY * sw, cz = a.z + az * sw, Rr = 0.62 * (1 - 0.75 * sw) + 0.12;   // the sweeping ring, base to tip
        Q.torus(cx, cy, cz, Rr, 0.035, N, now * 12, K.amber, GOLD, 0.95 * Math.sin(Math.PI * Math.min(1, k * 1.1)), { heat: 1.15, nu: L ? 20 : 30, nv: 5 });
        Q.torus(a.x + ax * 0.15, a.y + ay * GY * 0.15, a.z + az * 0.15, 0.85 - 0.3 * k, 0.03, N, -now * 9, K.amber, AMBER, 0.7 * (1 - k * 0.5), { heat: 1.0, nu: L ? 20 : 30, nv: 5 });
        Q.sphere(a.x + ax * 0.5, a.y + ay * GY * 0.5, a.z + az * 0.5, 0.35 + 0.35 * k, K.amber, AMBER, 0.45 * k, { amp: 0.35, lod: 10, heat: 0.95, seed: 1.9 }); } } }
  /* a furrow: a dark feathered trench between two lips of upheaved earth, a glow along its fresh end; it settles and fades */
  function drawFurrow(Q, Tr, now, k0) { const p = Tr.pts, n = Math.min(p.length, 60); if (n < 2) return; const K = Q.K;
    for (let side = -1; side <= 1; side += 2) { for (let i = 0; i < n; i++) { const q = p[p.length - n + i], i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), a = p[p.length - n + i0], c = p[p.length - n + i1], tx = c.x - a.x, ty = (c.y - a.y) / GY, tl = Math.hypot(tx, ty) || 1, u = cl((now - q.t) / Tr.life), w = 0.3 + 0.08 * Math.sin(i * 1.7);
        PT[i * 3] = q.x - ty / tl * w * side; PT[i * 3 + 1] = q.y + tx / tl * w * side * GY; PT[i * 3 + 2] = 0.03 - 0.1 * u; RA[i] = 0.17 * k0 * (1 - 0.5 * u) * (0.8 + 0.3 * R1(i * 1.3 + side)); AA[i] = (1 - u * u) * sm(i / 2); RA[i] *= Math.min(1, (n - 1 - i) / 2 + 0.15); }
      Q.tube(PT, n, null, K.stone, '#B09670', 1, { m: Q.low ? 4 : 6, heat: 0.5, rA: RA, aA: AA, seed: side * 3 }); }
    for (let i = 0; i < n; i++) { const q = p[p.length - n + i], u = cl((now - q.t) / Tr.life); PT[i * 3] = q.x; PT[i * 3 + 1] = q.y; PT[i * 3 + 2] = 0; RA[i] = 0.36 * k0; AA[i] = (1 - u) * 0.9; RA2[i] = (1 - sm(u * 1.5)) * sm(i / 3); }
    Q.ribbon(PT, n, 0.012, RA, AA, K.stone, DEEP, 1, { heat: 0.2 }); Q.ribbon(PT, n, 0.02, RA, RA2, K.strip, AMBER, 0.95 * k0, { heat: 0.95 }); }
  /* ---- Calamity: the mound and its ridge underground; the eight Earth drills ---- */
  function drawCal(Q, ctx, now) { const C = ctx.calamity, K = Q.K, L = Q.low, b = ctx.body; if (!C || C.done) return;
    // the wake of churned earth behind the burrowing machine
    const w = WAKE.pts, n = Math.min(w.length, 50); if (n >= 2) { for (let i = 0; i < n; i++) { const q = w[w.length - n + i], u = cl((now - q.t) / WAKE.life); PT[i * 3] = q.x; PT[i * 3 + 1] = q.y; PT[i * 3 + 2] = -0.04; RA[i] = 0.34 * (1 - u) * (0.85 + 0.25 * R1(i * 2.1)); AA[i] = 1 - u * u; }
      Q.tube(PT, n, null, K.stone, EARTH, 1, { m: L ? 5 : 7, heat: 0.45, rA: RA, aA: AA, seed: 5 }); }
    if (b.under) { const ha = b.a || 0, hv = 0.06 * Math.sin(now * 11);   // the heaving mound over it (the cockpit rides above it)
      const n = L ? 18 : 28, ca = Math.cos(ha), sa = Math.sin(ha); for (let i = 0; i <= n; i++) { const th = i / n * TAU, c = Math.cos(th), sn = Math.sin(th), fr = Math.max(0, c), lx = c * (1.5 + 0.45 * fr * fr), ly = sn * 1.12, nz = 0.5 + 0.5 * Math.sin(th * 5 + now * 7 + 1.3 * Math.sin(th * 3 - now * 4));
        PT[i * 3] = b.x + lx * ca - ly * sa; PT[i * 3 + 1] = b.y + (lx * sa + ly * ca) * GY; PT[i * 3 + 2] = -0.04 + 0.05 * nz; RA[i] = 0.17 + 0.2 * fr * fr + 0.07 * nz; AA[i] = 1; }
      Q.tube(PT, n + 1, null, K.stone, EARTH, 1, { m: L ? 5 : 7, heat: 0.5, rA: RA, aA: AA, seed: 9.1, qlen: 9 });
      const [bx, by] = at(b.x, b.y, ha, 1.75); Q.sphere(bx, by, -0.06 + hv, 0.5, K.stone, '#A48A66', 1, { sz: 0.5, ex: 0.7, ang: ha, amp: 0.55, seed: 7, flow: 2.2, heat: 0.5, lod: L ? 9 : 12 });
      const [fx, fy] = at(b.x, b.y, ha, 1.3); Q.sphere(fx, fy, 0.05, 0.6, K.dust, DUSTC, 0.35, { hemi: true, sz: 0.6, amp: 0.4, flow: 1.8, seed: 2.2, lod: 10 }); }
    if (C.drills && C.drills.length) C.drills.forEach((d, i) => earthDrill(Q, d, i, now));   }
  /* one of the eight: a rotating stone drill with burnt-orange crystal flutes and amber seams, torn up through slabs */
  function earthDrill(Q, d, i, now) { const K = Q.K, L = Q.low, k = d.rise || 0; if (!(k > 0.001)) return; let al = 1, sc = 1; const bu = d.burst > 1 ? d.burst - 1 : -1; if (bu > 0.08) return; if (bu >= 0) { al = 1 - bu / 0.08; sc = 1 + bu * 4; }
    const Hd = 3.6 * sc, R0 = 0.8 * sc, z0 = -(Hd + 0.25) * (1 - eback(k)) - 0.15, sp = d.spin || 0, gk = d.glow || 0, x = d.x, y = d.y / GY, sd = d.i * 7.3 + 1, nu = L ? 16 : 24, nv = L ? 8 : 11, TW = TAU * 2.2;
    const f = (u, v, P) => { const th = u * TAU, w = v, ph = 2 * (th - sp) + w * TW, c = Math.cos(ph), bl = c > 0 ? Math.pow(c, 3) : 0, ta = Math.pow(1 - w, 0.95), r = R0 * ta * (0.6 + 0.4 * bl) + (w < 0.04 ? 0.03 : 0);
      P[0] = x + Math.cos(th) * r; P[1] = y + Math.sin(th) * r; P[2] = z0 + w * Hd; P[3] = Math.cos(th); P[4] = Math.sin(th); P[5] = 0.25; P[6] = Math.cos(th - sp) * 1.1 + sd; P[7] = Math.sin(th - sp) * 1.1; P[8] = w * 3.4; P[9] = sm((bl - 0.08) / 0.5); };
    gridOn(Q, nu, nv, f, K.stone, SAND, al, 1, sd, 0.3 * gk, ORANGE, 1);
    const fs = (u, v, P) => { f(u, v, P); const th = u * TAU; P[6] = (2 * (th - sp) + v * TW) / Math.PI; P[7] = Math.cos(th - sp) * 1.2 + sd; P[8] = v * 3; P[9] = 1; };
    gridOn(Q, nu, nv, fs, K.seam, AMBER, al * (0.3 + 0.7 * gk), 0.5 + 0.65 * gk, sd, 0, null, 0);
    // the tip's gathering light and energy spiralling in
    const tz = z0 + Hd; if (gk > 0.05) { Q.sphere(d.x, d.y, tz + 0.05, 0.06 + 0.12 * gk, K.core, GOLD, al * gk, { amp: 0, lod: 7 }); Q.sphere(d.x, d.y, tz - 0.1, 0.18 + 0.22 * gk, K.amber, AMBER, al * 0.6 * gk * gk, { amp: 0.35, lod: 9, heat: 0.8 + 0.35 * gk, seed: sd });
      const nm = L ? 3 : 5; for (let j = 0; j < nm; j++) { const ph = (now * (0.7 + 0.5 * gk) + j / nm + d.i * 0.17) % 1, a = j * 1.3 + now * (3 + 4 * gk) + ph * 5, r = 1.7 * (1 - ph) + 0.15, z = Math.max(0.15, tz * (0.15 + 0.8 * ph)); Q.sphere(d.x + Math.cos(a) * r, d.y + Math.sin(a) * r * GY, z, 0.07 + 0.05 * gk, K.core, GOLD, al * gk * Math.sin(Math.PI * ph), { amp: 0, lod: 5 }); } }
    // slabs torn up round its foot
    const ku = eout(cl(k * 1.4)); for (let j = 0; j < (L ? 3 : 4); j++) { const a = j / 4 * TAU + R1(sd + j) * 0.8, [px, py] = at(d.x, d.y, a, 0.95 + 0.15 * R1(sd + j * 3)), tl = (0.5 + 0.35 * R1(sd + j * 5)) * ku; Q.mesh(SLABS[(d.i + j) % 6], px, py, -0.12 + 0.2 * ku, 0.36, 0.28, 0.7, Q.rot(a, -tl, 0.2 * (R1(sd + j) - 0.5)), K.stone, j % 2 ? EARTH : EARTHD, al, { heat: 0.5, seed: sd + j }); } }
  const gridOn = (Q, nu, nv, f, k, col, a, heat, sd, warm, col2, mode) => { if (!(a > 0.004)) return; Q.gridF(nu, nv, f, k, col, a, heat, sd, warm, col2, mode); };
  /* ---- the timed events ---- */
  function drawEvents(Q, now) { const K = Q.K, L = Q.low;
    for (const e of EV) { const age = now - e.t0, u = cl(age / e.life); if (age < 0) continue;
      if (e.type === 'wave') { const R = e.R * (0.12 + 0.88 * eout3(u)), h = e.h * (1 - u) * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, u * 1.6)));
        Q.torus(e.x, e.y, 0.08 + 0.15 * u + h * 0.5, R, 0.2 + 0.4 * u + h * 0.4, [0, 0, 1], e.seed * 0.3, K.dust, DUSTC, (e.lo ? 0.38 : 0.6) * (1 - u) * sm(age / 0.05), { amp: 0.45, seed: e.seed + 1, nu: L || e.lo ? 18 : 30, nv: L || e.lo ? 5 : 7, warm: 0.3 * (1 - u) }); }
      else if (e.type === 'blast') { const r = e.R * (0.3 + 0.7 * eout3(u)), k = e.k || 1;
        Q.sphere(e.x, e.y, 0, r, K.amber, AMBER, k * (1 - u) ** 1.6, { hemi: true, sz: e.sz || 0.85, amp: 0.45, heat: 1.1 - 0.6 * u, seed: e.x, flow: 1.8, lod: L ? 12 : 18 });
        Q.sphere(e.x, e.y, 0, r * 0.32, K.core, GOLD, 0.8 * k * (1 - u) ** 3, { hemi: true, sz: 1.1, amp: 0, lod: 10 }); }
      else if (e.type === 'cracks') { const g = eout(age / e.grow), fade = e.star ? (e.star.burst > 1 ? 1 - cl((e.star.burst - 1) / 0.6) : 1) : 1 - sm((u - 0.45) / 0.55), heat = e.heat * (e.star ? 0.75 + 0.45 * (e.star.glow || 0) : 1); if (fade < 0.01) { if (e.star) e.life = 0; continue; }
        for (const ln of e.lines) { const m = ln.pts.length / 2, gg = cl((g - (ln.d0 || 0)) / (1 - (ln.d0 || 0))); if (gg <= 0) continue; const nn = Math.max(2, Math.ceil(gg * (m - 1)) + 1);
          for (let i = 0; i < nn; i++) { const f2 = Math.min(i, gg * (m - 1)), i0 = Math.floor(f2), i1 = Math.min(m - 1, i0 + 1), t = f2 - i0, lx = lerp(ln.pts[i0 * 2], ln.pts[i1 * 2], t), ly = lerp(ln.pts[i0 * 2 + 1], ln.pts[i1 * 2 + 1], t); PT[i * 3] = e.x + lx; PT[i * 3 + 1] = e.y + ly * GY; PT[i * 3 + 2] = 0.02; }
          Q.tube(PT, nn, uu => e.w * ln.w * (1 - 0.75 * uu), K.strip, AMBER, fade, { m: L ? 3 : 4, heat, af: uu => 1 - uu * uu }); } }
      else if (e.type === 'slabs') { const r = eout(age / e.rise), sink = sm((u - 0.6) / 0.4);
        for (const s of e.list) { const [px, py] = at(e.x, e.y, s.a, s.r), tl = s.tilt * r * (1 - 0.6 * sink); Q.mesh(SLABS[s.tpl], px, py, lerp(-0.2, s.z, r) - 0.25 * sink, s.w * 1.3, s.w, s.w * 1.6, Q.rot(s.a + s.spin, -tl, 0), K.stone, s.tpl % 2 ? EARTH : EARTHD, 1 - sink, { heat: 0.5, seed: s.a * 5 }); } } } }
  /* ---- the pieces ---- */
  function drawParts(Q) { const K = Q.K;
    for (const p of P) { const u = 1 - p.life / p.max, fo = Math.min(1, p.life / Math.min(0.3, p.max));
      if (p.kind === 0) Q.mesh(ROCKS[p.tpl % 8], p.x, p.y, p.z, p.s, p.s, p.s, Q.rot(p.rz, p.ry, p.rx), K.stone, p.col, fo, { heat: p.heat, seed: p.seed, warm: p.warm * (1 - u) });
      else if (p.kind === 3) Q.mesh(SLABS[p.tpl % 6], p.x, p.y, p.z, p.s * 1.3, p.s, p.s * 1.4, Q.rot(p.rz, p.ry, p.rx), K.stone, p.col, fo, { heat: 0.5, seed: p.seed });
      else if (p.kind === 4) { const Rm = Q.rot(p.rz, p.ry, p.rx); Q.mesh(FRAGS[p.tpl % 6], p.x, p.y, p.z, p.s, p.s, p.s, Rm, K.stone, p.col, fo, { heat: 0.95, seed: p.seed, warm: 0.3 * (1 - u) }); Q.mesh(FRAGS[p.tpl % 6], p.x, p.y, p.z, p.s, p.s, p.s, Rm, K.crystal, AMBER, fo * (1 - u), { heat: p.heat * (1 - 0.5 * u), seed: p.seed }); }
      else if (p.kind === 1) { const fi = sm(p.age / 0.12); Q.sphere(p.x, p.y, p.z, p.s * (1 + p.grow * u), K.dust, p.col, p.peak * fi * (1 - u) ** 1.4, { amp: 0.38, seed: p.seed, flow: 0.6, sz: 0.8, lod: Q.low ? 7 : 9, warm: p.warm * (1 - u) }); }
      else { const sp = Math.hypot(p.vx, p.vy / GY, p.vz) || 1, L = Math.min(0.42, sp * 0.045); PT2[0] = p.x; PT2[1] = p.y; PT2[2] = p.z; PT2[3] = p.x - p.vx / sp * L; PT2[4] = p.y - p.vy / sp * L; PT2[5] = p.z - p.vz / sp * L; Q.tube(PT2, 2, w => 0.04 * (1 - 0.85 * w), K.core, GOLD, fo, { m: 4 }); } } }
})();
