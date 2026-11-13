/* ================= FIRE_3D (NIDHOGG_MOVES.F3D): Nidhogg's effects as real 3D geometry on the GPU =================
   (v327, the user: "Are the strong attacks and ultima of Nidhogg in 3D and drawn on the GPU? It still looks very 2D")
   Meshes in world space (tiles; z up), seen through the game's own camera (the same affine projection the 2D draw uses:
   screen = H.sx / H.sy, height lifted by the camera's z scale), with a depth buffer, so volumes overlap and occlude in
   perspective. Built each frame on the CPU from a few shapes, as triangle lists into one pooled buffer:
     sphere (noise-displaced: a churning fireball, a billow, a puff of smoke) · tube (a tapered tube through points: comet
     trails, lances, spiral fire ribbons, a beam) · torus (tilted and spinning: the Ultima's rune ring, shock rings) ·
     dome (a squashed hemisphere: the blast's dome, the mushroom's cap).
   Materials, from maths and 3D noise in the fragment shader:
     0 fire (light: churning 3D fbm through a temperature ramp, its silhouette feathered by the view angle) ·
     1 smoke (solid: billowing density, lit from above, warmed from below) · 2 fire body (solid: the fire's colour laid
     over, so it holds on a pale floor) · 3 runes (light: luminous bands and turning glyphs round a torus) ·
     4 white-hot core (light) · 5 floor fire (light: a shock ring's hot rim).
   Two layers, one at a time on one canvas (copied whole each time): the solid layer with depth, then the light layer
   tested against the solids' depth (re-laid, colour off) and added. The rider's face is a soft hole in both.
   Real-GPU WebGL only; software GL keeps the old pictures unless window.__NG_GL = 1; window.__F3D = 0 turns it off.
   Mesh detail drops on lowFx; vertices are capped. */
(() => {
  const NM = self.NIDHOGG_MOVES = self.NIDHOGG_MOVES || {};
  let cv = null, gl = null, PR = null, buf = null, ok = null, soft = false, info = '', why = '';
  const stats = { draws: 0, verts: 0, solidVerts: 0, W: 0, H: 0, frames: 0, maxVerts: 0, maxSolid: 0 };
  const HDR = '#ifdef GL_FRAGMENT_PRECISION_HIGH\nprecision highp float;\n#else\nprecision mediump float;\n#endif\n';
  const VS = `attribute vec3 a_p, a_n, a_q; attribute float a_k; attribute vec4 a_c; attribute vec3 a_m;
uniform vec4 u_px, u_py, u_pd; varying vec3 v_n, v_q, v_m; varying float v_k; varying vec4 v_c; varying vec2 v_s;
void main(){ vec4 q = vec4(a_p, 1.0); vec2 s = vec2(dot(q, u_px), dot(q, u_py)); gl_Position = vec4(s, clamp(dot(q, u_pd), -0.999, 0.999), 1.0); v_s = s; v_n = a_n; v_q = a_q; v_k = a_k; v_c = a_c; v_m = a_m; }`;
  const FS = HDR + `uniform float u_t, u_layer; uniform vec3 u_v, u_l, u_pet; uniform vec2 u_pa; varying vec3 v_n, v_q, v_m; varying float v_k; varying vec4 v_c; varying vec2 v_s;
float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float fbm(vec3 p){ return 0.55 * n3(p) + 0.3 * n3(p * 2.03 + 3.1) + 0.15 * n3(p * 4.1 + 7.7); }
vec3 ramp(float k){ k = clamp(k, 0.0, 1.2); vec3 c = mix(vec3(0.0), vec3(0.62, 0.1, 0.03), smoothstep(0.0, 0.25, k)); c = mix(c, vec3(0.95, 0.32, 0.09), smoothstep(0.2, 0.45, k)); c = mix(c, vec3(1.0, 0.6, 0.2), smoothstep(0.42, 0.65, k)); c = mix(c, vec3(1.0, 0.86, 0.42), smoothstep(0.62, 0.85, k)); return mix(c, vec3(1.0, 0.98, 0.9), smoothstep(0.85, 1.1, k)); }
void main(){ vec3 n = normalize(v_n); float ndv = abs(dot(n, u_v)), sil = smoothstep(0.0, 0.5, ndv), t = u_t + v_m.y * 3.7, heat = v_m.x, a0 = v_c.a;
  float pk = u_pet.z > 0.0 ? mix(0.12, 1.0, smoothstep(0.45, 1.4, length((v_s - u_pet.xy) * u_pa))) : 1.0;
  if (v_k > 0.5 && v_k < 2.5) { // solid: smoke (1), fire body (2)
    float f = fbm(v_q * 1.7 + vec3(0.0, 0.0, -t * 0.6)), a; vec3 c;
    if (v_k < 1.5) { a = sil * sil * smoothstep(0.15, 0.85, f) * a0; float lit = 0.45 + 0.55 * clamp(dot(n, u_l), 0.0, 1.0); c = v_c.rgb * lit + vec3(0.45, 0.14, 0.03) * v_m.z * clamp(-n.z + 0.3, 0.0, 1.0); }
    else { float temp = heat * (0.5 + 0.8 * fbm(v_q * 2.2 + vec3(0.0, 0.0, -t * 1.5))) * (0.55 + 0.45 * ndv); a = sil * smoothstep(0.08, 0.5, temp) * a0; c = ramp(min(temp, 0.8)) * mix(0.45, 0.95, smoothstep(0.15, 0.75, ndv)); }   /* (soft-edged, its limb a darker burnt red so the ball reads on a pale floor too) */   /* (soft-edged: the body thins out gradually, never a cut sheet) */
    if (u_layer > 0.5) a = 1.0;   /* (the depth re-lay: colour is off, depth is what counts) */
    a *= pk; gl_FragColor = vec4(c * a, a); return; }
  vec3 L;
  if (v_k < 0.5 || v_k > 4.5) { // fire (0) and floor fire (5): churning 3D noise rising through the volume, the silhouette feathered
    float f = fbm(v_q * 2.4 + vec3(0.0, 0.0, -t * 1.8)), g = fbm(v_q * 5.0 + vec3(t * 0.7, 0.0, -t * 2.6));
    float temp = heat * (0.34 + 1.55 * f * f + 0.32 * g) * (0.45 + 0.55 * pow(ndv, 1.2)); L = ramp(temp) * (0.62 + 0.7 * f) * sil; }   /* (hot where the turbulence piles up and where the volume is thick, cooling to red at its limb) */
  else if (v_k < 3.5) { // runes round a torus: v_q.x the angle round it (0..1), v_q.y round its tube (0..1)
    float u = v_q.x * 28.0 - t * 0.0, cell = floor(u), fu = fract(u), gy = abs(v_q.y - 0.5) * 2.0, glyph = step(0.45, h3(vec3(cell, floor(fu * 3.0), 1.7))) * step(0.15, fu) * step(fu, 0.85) * (1.0 - smoothstep(0.55, 0.8, gy));
    float band = exp(-pow(gy / 0.35, 2.0)); L = v_c.rgb * (0.35 + 0.65 * band) * (0.6 + 0.4 * sil) + vec3(1.0, 0.8, 0.55) * glyph * 0.9; L *= 0.8 + 0.2 * sin(t * 6.0 + v_q.x * 40.0); }
  else { L = mix(v_c.rgb, vec3(1.0), 0.6) * pow(ndv, 1.5) * 1.3; }   // white-hot core
  L *= a0 * pk; L = min(L, vec3(1.0)); gl_FragColor = vec4(L, max(max(L.r, L.g), L.b)); }`;
  function prog(vs, fs, attrs) { const sh = (ty, src) => { const q = gl.createShader(ty); gl.shaderSource(q, src); gl.compileShader(q); if (!gl.getShaderParameter(q, gl.COMPILE_STATUS)) throw new Error('shader: ' + gl.getShaderInfoLog(q)); return q; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); attrs.forEach((a, i) => gl.bindAttribLocation(p, i, a)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(p));
    const U = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const q = gl.getActiveUniform(p, i); U[q.name] = gl.getUniformLocation(p, q.name); } return { p, U }; }
  function build() { if (!cv) { cv = document.createElement('canvas'); cv.width = cv.height = 4; cv.addEventListener('webglcontextlost', e => { e.preventDefault(); ok = false; why = 'context lost'; }); cv.addEventListener('webglcontextrestored', () => { ok = null; PR = null; }); }
    const o = { alpha: true, premultipliedAlpha: true, antialias: false, depth: true, stencil: false }; gl = gl || cv.getContext('webgl2', o) || cv.getContext('webgl', o); if (!gl) { why = 'no WebGL'; return false; }
    try { const di = gl.getExtension('WEBGL_debug_renderer_info'); info = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) { info = '?'; } soft = /swiftshader|llvmpipe|software|softpipe/i.test(info);
    PR = prog(VS, FS, ['a_p', 'a_n', 'a_q', 'a_k', 'a_c', 'a_m']); buf = gl.createBuffer(); return true; }
  function usable() { let f = null, g = null; try { f = window.__NG_GL; g = window.__F3D; } catch (e) {} if (f === 0 || g === 0 || ok === false) return false; if (ok === null) { try { ok = build(); } catch (e) { ok = false; why = String(e && e.message || e); try { console.warn('Nidhogg F3D: ' + why); } catch (e2) {} } } return !!ok && (!soft || f === 1); }
  const LOWQ = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const RGB = new Map(), rgbOf = h => { let v = RGB.get(h); if (!v) { const q = hexRGB(h || '#FF7A2E'); v = [q[0] / 255, q[1] / 255, q[2] / 255]; RGB.set(h, v); } return v; };
  const SF = 18;   // floats a vertex: p3 n3 q3 k1 c4 m3
  const CAP = 60000;
  /* the batch: light triangles and solid triangles; world positions are relative to an origin (ox, oy) near the action */
  const B = { lit: new Float32Array(SF * 12000), nl: 0, sol: new Float32Array(SF * 6000), ns: 0, ox: 0, oy: 0, low: false, t: 0, seg: 1 };
  function push(solid, x, y, z, nx, ny, nz, qx, qy, qz, k, C, a, m0, m1, m2) {
    let A = solid ? B.sol : B.lit; const n = solid ? B.ns : B.nl; if (n >= CAP) return;
    if ((n + 1) * SF > A.length) { const q = new Float32Array(A.length * 2); q.set(A); A = q; if (solid) B.sol = q; else B.lit = q; }
    let o = n * SF; A[o++] = x - B.ox; A[o++] = y - B.oy; A[o++] = z; A[o++] = nx; A[o++] = ny; A[o++] = nz; A[o++] = qx; A[o++] = qy; A[o++] = qz; A[o++] = k; A[o++] = C[0]; A[o++] = C[1]; A[o++] = C[2]; A[o++] = a; A[o++] = m0; A[o++] = m1; A[o++] = m2;
    if (solid) B.ns++; else B.nl++; }
  /* a grid surface (nu x nv cells) from a point function f(u, v, out) -> out = [x, y, z, nx, ny, nz, qx, qy, qz], two triangles a cell */
  const G = [], GP = (() => { const a = []; for (let i = 0; i < 4; i++) a.push(new Float32Array(9)); return a; })();
  function grid(nu, nv, f, k, C, a, m0, m1, m2) { const solid = k === 1 || k === 2, P = GP;
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      f(i / nu, j / nv, P[0]); f((i + 1) / nu, j / nv, P[1]); f(i / nu, (j + 1) / nv, P[2]); f((i + 1) / nu, (j + 1) / nv, P[3]);
      for (const idx of [0, 1, 2, 2, 1, 3]) { const p = P[idx]; push(solid, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], k, C, a, m0, m1, m2); } } }
  /* smooth 3D value noise on the CPU (for the displaced spheres) */
  const hh = (x, y, z) => { const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return v - Math.floor(v); };
  function vn(x, y, z) { const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz, sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz), L = (a, b, u) => a + (b - a) * u;
    return L(L(L(hh(ix, iy, iz), hh(ix + 1, iy, iz), sx), L(hh(ix, iy + 1, iz), hh(ix + 1, iy + 1, iz), sx), sy), L(L(hh(ix, iy, iz + 1), hh(ix + 1, iy, iz + 1), sx), L(hh(ix, iy + 1, iz + 1), hh(ix + 1, iy + 1, iz + 1), sx), sy), sz); }
  const K = { fire: 0, smoke: 1, body: 2, runes: 3, core: 4, floor: 5 };
  const Q3 = {
    K, low: false,
    /* a sphere at (x, y, z), radius r (tiles), squashed by sz, its surface pushed out by noise (amp, a share of r) turning with time */
    sphere(x, y, z, r, k, col, a, o) { if (!(r > 0.005) || !(a > 0.004)) return; o = o || {}; const amp = o.amp == null ? 0.18 : o.amp, sd = o.seed || 0, sz = o.sz || 1, t = B.t * (o.flow || 0.8), heat = o.heat == null ? 0.9 : o.heat, C = rgbOf(col), nu = Math.max(B.low ? 8 : 12, Math.min(B.low ? 16 : 24, Math.round(r * (B.low ? 3 : 4.5)))), nv = Math.max(5, Math.round(nu * (o.hemi ? 0.4 : 0.66))), hemi = o.hemi ? 0.5 : 1;   /* (big volumes get finer meshes: no flat facets on the blast's dome) */
      grid(nu, nv, (u, v, P) => { const th = u * Math.PI * 2, ph = v * Math.PI * hemi, sp = Math.sin(ph), dx = Math.cos(th) * sp, dy = Math.sin(th) * sp, dz = Math.cos(ph);
        const d = amp > 0 ? 1 + amp * (vn(dx * 2.2 + sd, dy * 2.2 + t, dz * 2.2 - t * 0.7) - 0.5) * 2 : 1, rr = r * d; P[0] = x + dx * rr; P[1] = y + dy * rr; P[2] = z + dz * rr * sz; P[3] = dx; P[4] = dy; P[5] = dz / sz; P[6] = dx * 1.5 + sd; P[7] = dy * 1.5; P[8] = dz * 1.5 - (o.rise || 0); }, k, C, a, heat, sd, o.warm || 0); },
    /* a tube through world points P (n of them, head first), radius r(i / (n - 1)); its cross-section an m-gon */
    tube(Pts, n, rf, k, col, a, o) { if (n < 2 || !(a > 0.004)) return; o = o || {}; const C = rgbOf(col), m = o.m || (B.low ? 6 : 9), heat = o.heat == null ? 0.9 : o.heat, sd = o.seed || 0, af = o.af;
      for (let i = 0; i + 1 < n; i++) { const p0 = Pts[i], p1 = Pts[i + 1]; let tx = p1[0] - p0[0], ty = p1[1] - p0[1], tz = p1[2] - p0[2]; const L = Math.hypot(tx, ty, tz) || 1; tx /= L; ty /= L; tz /= L;
        let ax = Math.abs(tz) < 0.9 ? 0 : 1, ay = 0, az = Math.abs(tz) < 0.9 ? 1 : 0; let bx = ty * az - tz * ay, by = tz * ax - tx * az, bz = tx * ay - ty * ax; const bl = Math.hypot(bx, by, bz) || 1; bx /= bl; by /= bl; bz /= bl; const cx = ty * bz - tz * by, cy = tz * bx - tx * bz, cz = tx * by - ty * bx;
        const u0 = i / (n - 1), u1 = (i + 1) / (n - 1), r0 = rf(u0), r1 = rf(u1), a0 = af ? af(u0) : 1, a1 = af ? af(u1) : 1;
        for (let j = 0; j < m; j++) { const t0 = j / m * Math.PI * 2, t1 = (j + 1) / m * Math.PI * 2, V = [];
          for (const [pp, rr, uu, th, aa] of [[p0, r0, u0, t0, a0], [p1, r1, u1, t0, a1], [p0, r0, u0, t1, a0], [p1, r1, u1, t1, a1]]) { const ct = Math.cos(th), sn = Math.sin(th), nx = bx * ct + cx * sn, ny = by * ct + cy * sn, nz = bz * ct + cz * sn; V.push([pp[0] + nx * rr, pp[1] + ny * rr, pp[2] + nz * rr, nx, ny, nz, uu * (o.qlen || 4) + sd, ct, sn, aa]); }
          for (const idx of [0, 1, 2, 2, 1, 3]) { const q = V[idx]; push(k === 1 || k === 2, q[0], q[1], q[2], q[3], q[4], q[5], q[6] - B.t * (o.scroll || 0), q[7], q[8], k, C, a * q[9], heat, sd, o.warm || 0); } } } },
    /* a torus round (x, y, z): major radius R, tube radius r, its plane's normal N (unit), turned by spin; q.x the angle round (0..1) */
    torus(x, y, z, R, r, N, spin, k, col, a, o) { if (!(R > 0.01) || !(a > 0.004)) return; o = o || {}; const C = rgbOf(col), nu = o.nu || (B.low ? 24 : 40), nv = B.low ? 5 : 8, heat = o.heat == null ? 0.9 : o.heat;
      let ex = Math.abs(N[2]) < 0.9 ? -N[1] : 0, ey = Math.abs(N[2]) < 0.9 ? N[0] : -N[2], ez = Math.abs(N[2]) < 0.9 ? 0 : N[1]; const el = Math.hypot(ex, ey, ez) || 1; ex /= el; ey /= el; ez /= el; const fx = N[1] * ez - N[2] * ey, fy = N[2] * ex - N[0] * ez, fz = N[0] * ey - N[1] * ex;
      grid(nu, nv, (u, v, P) => { const th = u * Math.PI * 2 + spin, ph = v * Math.PI * 2, ct = Math.cos(th), sn = Math.sin(th), dx = ex * ct + fx * sn, dy = ey * ct + fy * sn, dz = ez * ct + fz * sn, cp = Math.cos(ph), sp = Math.sin(ph);
        const nx = dx * cp + N[0] * sp, ny = dy * cp + N[1] * sp, nz = dz * cp + N[2] * sp; P[0] = x + dx * R + nx * r; P[1] = y + dy * R + ny * r; P[2] = z + dz * R + nz * r; P[3] = nx; P[4] = ny; P[5] = nz; P[6] = u; P[7] = v; P[8] = 0; }, k, C, a, heat, o.seed || 0, 0); } };
  /* begin a frame on the game canvas c (its transform is the camera); H the kit (sx, sy), Z screen px a tile of height,
     (ox, oy) an origin near the action; pet: [screen x, y, radius] to keep clear, or null */
  let P0 = null;
  function begin(c, H, Z, ox, oy, pet) { const Bm = c.getTransform(), cv0 = c.canvas, L = LOWQ(), k0 = Math.min(L ? 0.45 : 0.62, 1200 / Math.max(cv0.width, cv0.height)), W = Math.max(8, Math.round(cv0.width * k0)), Hh = Math.max(8, Math.round(cv0.height * k0)), kx = W / cv0.width;
    B.nl = B.ns = 0; B.ox = ox; B.oy = oy; B.low = L; Q3.low = L; B.t = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000 % 1000;
    const SX0 = H.sx(ox), SY0 = H.sy(oy), Tx = (H.sx(ox + 1) - SX0) || 1, Ty = (H.sy(oy + 1) - SY0) || 1, A = Bm.a * kx, Bb = Bm.b * kx, Cc = Bm.c * kx, D = Bm.d * kx, E = Bm.e * kx, F = Bm.f * kx;
    /* world (x, y, z) -> canvas px: x' = SX0 + Tx x, y' = SY0 + Ty y - Z z, then the camera; -> clip space */
    const px = [A * Tx * 2 / W, Cc * Ty * 2 / W, -Cc * Z * 2 / W, (A * SX0 + Cc * SY0 + E) * 2 / W - 1], py = [-Bb * Tx * 2 / Hh, -D * Ty * 2 / Hh, D * Z * 2 / Hh, 1 - (Bb * SX0 + D * SY0 + F) * 2 / Hh];
    const zr = Z / Tx, gy = Ty / Tx, nn = Math.hypot(zr, gy), cy = zr / nn, cz = gy / nn;   // (the view: toward the camera, up and toward the screen's bottom)
    P0 = { W, Hh, px, py, pd: [0, -cy / 40, -cz / 40, 0], v: [0, cy, cz], l: [-0.35, 0.3, 0.88], pet: [0, 0, 0], pa: [1, 1] };
    if (pet && pet[2] > 0) { const sx = (A * pet[0] + Cc * pet[1] + E) * 2 / W - 1, sy = 1 - (Bb * pet[0] + D * pet[1] + F) * 2 / Hh, r = pet[2] * Math.abs(A); P0.pet = [sx, sy, 1]; P0.pa = [W / 2 / r, Hh / 2 / r]; }
    return Q3; }
  function flush(c) { if (!P0 || (!B.nl && !B.ns)) return; if (!usable()) return; const W = P0.W, Hh = P0.Hh;
    try { if (cv.width !== W || cv.height !== Hh) { cv.width = W; cv.height = Hh; }
      gl.viewport(0, 0, W, Hh); gl.useProgram(PR.p); const U = PR.U; gl.uniform4fv(U.u_px, P0.px); gl.uniform4fv(U.u_py, P0.py); gl.uniform4fv(U.u_pd, P0.pd); gl.uniform3fv(U.u_v, P0.v); gl.uniform3fv(U.u_l, P0.l); gl.uniform3fv(U.u_pet, P0.pet); gl.uniform2fv(U.u_pa, P0.pa); gl.uniform1f(U.u_t, B.t);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf); const S4 = SF * 4, attr = (i, n, off) => { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, n, gl.FLOAT, false, S4, off * 4); };
      const draw = (A, n) => { gl.bufferData(gl.ARRAY_BUFFER, A.subarray(0, n * SF), gl.DYNAMIC_DRAW); attr(0, 3, 0); attr(1, 3, 3); attr(2, 3, 6); attr(3, 1, 9); attr(4, 4, 10); attr(5, 3, 14); gl.drawArrays(gl.TRIANGLES, 0, n); };
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.enable(gl.BLEND);
      const cv0 = c.canvas; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; let draws = 0;
      if (B.ns) { gl.depthMask(true); gl.colorMask(true, true, true, true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.uniform1f(U.u_layer, 0); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); draw(B.sol, B.ns); draws++; c.globalCompositeOperation = 'source-over'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }
      if (B.nl) { gl.depthMask(true); gl.colorMask(true, true, true, true); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        if (B.ns) { gl.colorMask(false, false, false, false); gl.uniform1f(U.u_layer, 1); draw(B.sol, B.ns); draws++; gl.colorMask(true, true, true, true); }   // (the solids' depth, so the light behind them is hidden)
        gl.depthMask(false); gl.uniform1f(U.u_layer, 0); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR); draw(B.lit, B.nl); draws++; gl.depthMask(true); c.globalCompositeOperation = 'lighter'; c.drawImage(cv, 0, 0, cv0.width, cv0.height); }
      c.restore();
      stats.draws = draws; stats.verts = B.nl; stats.solidVerts = B.ns; stats.W = W; stats.H = Hh; stats.frames++; stats.maxVerts = Math.max(stats.maxVerts, B.nl); stats.maxSolid = Math.max(stats.maxSolid, B.ns);
    } catch (e) { ok = false; why = String(e && e.message || e); } }
  NM.F3D = { usable, begin, flush, stats, info: () => ({ ok, soft, renderer: info, why }) };
})();
