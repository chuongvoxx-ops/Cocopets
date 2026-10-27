/* ---------- the geometric kit: the shapes that rule the upper tower ----------
   Abaddon is an octahedron and four blades, Choronzon a crystal and six spikes, the Pale Intellect a brain whose folds
   are drawn on a true surface. They share a camera that looks down on the arena from about 35 degrees; flat faces lit in
   hard cel bands, with rough surfaces mapped onto each face so they turn with it (scratched obsidian, fissured crystal,
   brushed metal, worn stone, porcelain), a glint that slides across polished faces, ink outlines and edges that glow.
   And they share the machinery of their fights: attacks as timed jobs, warnings on the floor that strike when their
   time comes (solid ones that are real, broken ones that lie), light that rises from a cut, and walls the pet cannot
   pass. Each part is drawn about an anchor: a point on the floor, as the game's own view places it, and a height. */
const GeoKit = (() => {
  const TAU = Math.PI * 2, EL = 0.62, SE = Math.sin(EL), CE = Math.cos(EL);
  const clamp01 = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = u => { u = clamp01(u); return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
  const snap = u => 1 - Math.pow(1 - clamp01(u), 4);
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a < 0 ? 0 : a > 1 ? 1 : a})`; };
  const mixC = (a, b, t) => DunFiend.KIT.mixC(a, b, clamp01(t));
  /* ---- vectors and turns (3x3 matrices, row major) ---- */
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]), norm = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
  const I3 = () => [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const mm = (A, B) => { const R = new Array(9); for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) R[r * 3 + c] = A[r * 3] * B[c] + A[r * 3 + 1] * B[3 + c] + A[r * 3 + 2] * B[6 + c]; return R; };
  const mv = (M, v) => [M[0] * v[0] + M[1] * v[1] + M[2] * v[2], M[3] * v[0] + M[4] * v[1] + M[5] * v[2], M[6] * v[0] + M[7] * v[1] + M[8] * v[2]];
  const rx = a => { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, c, -s, 0, s, c]; };
  const ry = a => { const c = Math.cos(a), s = Math.sin(a); return [c, 0, s, 0, 1, 0, -s, 0, c]; };
  const rz = a => { const c = Math.cos(a), s = Math.sin(a); return [c, -s, 0, s, c, 0, 0, 0, 1]; };
  // a turn of a about the axis u
  function axisR(u, a) { const [x, y, z] = norm(u), c = Math.cos(a), s = Math.sin(a), C = 1 - c; return [c + x * x * C, x * y * C - z * s, x * z * C + y * s, y * x * C + z * s, c + y * y * C, y * z * C - x * s, z * x * C - y * s, z * y * C + x * s, c + z * z * C]; }
  // a frame whose x axis runs along dir, its z leaning toward up
  function frame(dir, up) {
    const X = norm(dir), U = up || [0, 0, 1]; let Z = sub(U, mul(X, dot(U, X)));
    if (len(Z) < 1e-4) Z = Math.abs(X[2]) < 0.9 ? sub([0, 0, 1], mul(X, X[2])) : sub([0, 1, 0], mul(X, X[1]));
    Z = norm(Z); const Y = cross(Z, X); return [X[0], Y[0], Z[0], X[1], Y[1], Z[1], X[2], Y[2], Z[2]];
  }
  /* ---- the camera: true orthographic from EL above the horizon; V points at the viewer, LD at the key light ---- */
  const V = [0, CE, SE], LD = norm([-0.5, 0.32, 0.8]), SKY = norm([0.3, -0.35, 0.88]);
  function cam(X, Y, T) { return { X, Y, T, P: p => [X + p[0] * T, Y + (p[1] * SE - p[2] * CE) * T], dep: p => p[1] * CE + p[2] * SE }; }
  // a point at height z above the floor point (x, y), on screen
  const at = (FX, x, y, z) => [FX.sx(x), FX.sy(y) - (z || 0) * CE * FX.Tz()];

  /* ---- surfaces: tiles painted once, laid over faces in each face's own frame. Transparent overlays of light and
     dark, so one tile serves any colour ---- */
  const tiles = {};
  function tile(kind) {
    if (tiles[kind]) return tiles[kind];
    const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
    const R = mulberry32(kind.split('').reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 19));
    const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { g.save(); g.translate(ox, oy); f(); g.restore(); } };
    const blob = (x, y, r, col) => wrap(() => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); });
    const crack = (x, y, a, L, w, col, depth) => { const pts = [[x, y]]; let cx = x, cy = y, ca = a; for (let i = 0; i < 6; i++) { ca += (R() - 0.5) * 0.9; const l = L / 6 * (0.6 + R() * 0.8); cx += Math.cos(ca) * l; cy += Math.sin(ca) * l; pts.push([cx, cy]); }
      wrap(() => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([px, py], i) => i ? g.lineTo(px, py) : g.moveTo(px, py)); g.stroke(); });
      if (depth > 0) for (let k = 0; k < 2; k++) { const p = pts[1 + Math.floor(R() * 4)]; crack(p[0], p[1], ca + (R() - 0.5) * 2.2, L * 0.45, w * 0.6, col, depth - 1); } };
    g.lineCap = 'round'; g.lineJoin = 'round';
    if (kind === 'obsidian') {   // volcanic glass: grain, conchoidal ripples, broad silver scratches and chipped edges
      for (let i = 0; i < 2200; i++) { g.fillStyle = R() < 0.55 ? `rgba(0,0,0,${0.06 + R() * 0.1})` : `rgba(255,255,255,${0.03 + R() * 0.06})`; g.fillRect(R() * S, R() * S, 1 + R() * 1.5, 1 + R() * 1.5); }
      for (let i = 0; i < 10; i++) blob(R() * S, R() * S, 30 + R() * 60, `rgba(255,255,255,${0.025 + R() * 0.03})`);
      for (let i = 0; i < 16; i++) { const x = R() * S, y = R() * S, r0 = 8 + R() * 30, a0 = R() * TAU; wrap(() => { for (let k = 0; k < 4; k++) { g.strokeStyle = `rgba(255,255,255,${0.05 + R() * 0.06})`; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, r0 + k * (4 + R() * 3), a0, a0 + 1 + R() * 1.6); g.stroke(); } }); }
      // the scratches: two main grains of them, some in bundles, some single deep gouges
      for (let i = 0; i < 30; i++) { const x = R() * S, y = R() * S, a = (R() < 0.5 ? 0.45 : -0.75) + (R() - 0.5) * 0.5, L = 40 + R() * 170, bow = (R() - 0.5) * 18, n = R() < 0.4 ? 3 + Math.floor(R() * 3) : 1, w = n > 1 ? 0.7 : 1 + R() * 1.6;
        for (let k = 0; k < n; k++) { const ox = -Math.sin(a) * k * 2.4, oy = Math.cos(a) * k * 2.4, x1 = x + ox + Math.cos(a) * L, y1 = y + oy + Math.sin(a) * L, mx = (x + x1) / 2 + ox - Math.sin(a) * bow, my = (y + y1) / 2 + oy + Math.cos(a) * bow;
          wrap(() => { g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = w * 1.8; g.beginPath(); g.moveTo(x + ox + 0.8, y + oy + 0.8); g.quadraticCurveTo(mx + 0.8, my + 0.8, x1 + 0.8, y1 + 0.8); g.stroke(); g.strokeStyle = `rgba(226,232,246,${0.22 + R() * 0.38})`; g.lineWidth = w; g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(mx, my, x1, y1); g.stroke(); }); } }
      for (let i = 0; i < 34; i++) { const x = R() * S, y = R() * S, r = 2 + R() * 6, n = 4 + Math.floor(R() * 3), pts = []; for (let k = 0; k < n; k++) { const a = k / n * TAU + R() * 0.6; pts.push([x + Math.cos(a) * r * (0.6 + R() * 0.5), y + Math.sin(a) * r * (0.6 + R() * 0.5)]); }
        wrap(() => { g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); pts.forEach(([px, py], k) => k ? g.lineTo(px, py) : g.moveTo(px, py)); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); g.lineTo(pts[1][0], pts[1][1]); g.stroke(); }); }
    } else if (kind === 'crystal') {   // smoky crystal: clouds within, white fissures that branch, growth lines, sparkles
      for (let i = 0; i < 26; i++) blob(R() * S, R() * S, 16 + R() * 50, R() < 0.5 ? `rgba(255,255,255,${0.05 + R() * 0.08})` : `rgba(0,0,0,${0.08 + R() * 0.12})`);
      for (let i = 0; i < 9; i++) { const y = R() * S, a = (R() - 0.5) * 0.3; wrap(() => { g.strokeStyle = 'rgba(255,255,255,.07)'; g.lineWidth = 2 + R() * 3; g.beginPath(); g.moveTo(-10, y); g.lineTo(S + 10, y + Math.tan(a) * S); g.stroke(); }); }
      for (let i = 0; i < 7; i++) { const x = R() * S, y = R() * S, a = R() * TAU; crack(x, y, a, 90 + R() * 90, 3.2, 'rgba(255,255,255,.08)', 0); crack(x, y, a, 90 + R() * 90, 1 + R() * 0.8, `rgba(255,255,255,${0.5 + R() * 0.35})`, 2); }
      for (let i = 0; i < 50; i++) { g.fillStyle = `rgba(255,255,255,${0.4 + R() * 0.5})`; g.beginPath(); g.arc(R() * S, R() * S, 0.5 + R() * 1.1, 0, TAU); g.fill(); }
    } else if (kind === 'metal') {   // dark brushed metal: long streaks, pits, scuffs with bright lips
      for (let i = 0; i < 520; i++) { const y = R() * S, x = R() * S, L = 30 + R() * 140; g.strokeStyle = R() < 0.5 ? `rgba(255,255,255,${0.03 + R() * 0.07})` : `rgba(0,0,0,${0.06 + R() * 0.12})`; g.lineWidth = 0.5 + R() * 1.2; wrap(() => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + L, y + (R() - 0.5) * 3); g.stroke(); }); }
      for (let i = 0; i < 420; i++) { g.fillStyle = `rgba(0,0,0,${0.2 + R() * 0.3})`; g.beginPath(); g.arc(R() * S, R() * S, 0.4 + R() * 0.9, 0, TAU); g.fill(); }
      for (let i = 0; i < 26; i++) { const x = R() * S, y = R() * S, a = R() * TAU, L = 6 + R() * 20; wrap(() => { g.strokeStyle = 'rgba(0,0,0,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 1, y - 1); g.lineTo(x + Math.cos(a) * L - 1, y + Math.sin(a) * L - 1); g.stroke(); }); }
      for (let i = 0; i < 8; i++) blob(R() * S, R() * S, 20 + R() * 40, 'rgba(170,120,255,.07)');
    } else if (kind === 'stone') {   // worn stone: mottling, grit, chisel marks and hairline cracks
      for (let i = 0; i < 40; i++) blob(R() * S, R() * S, 10 + R() * 34, R() < 0.45 ? `rgba(255,255,255,${0.05 + R() * 0.06})` : `rgba(0,0,0,${0.08 + R() * 0.12})`);
      for (let i = 0; i < 2600; i++) { g.fillStyle = R() < 0.5 ? `rgba(0,0,0,${0.12 + R() * 0.2})` : `rgba(255,255,255,${0.06 + R() * 0.1})`; g.fillRect(R() * S, R() * S, 1 + R(), 1 + R()); }
      for (let i = 0; i < 60; i++) { const x = R() * S, y = R() * S, a = R() * TAU, L = 4 + R() * 9; g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke(); }
      for (let i = 0; i < 6; i++) crack(R() * S, R() * S, R() * TAU, 70 + R() * 80, 1 + R() * 0.6, 'rgba(0,0,0,.5)', 1);
    } else if (kind === 'porcelain') {   // the brain's skin: pores, fine capillaries, a pearl sheen in drifting flecks
      for (let i = 0; i < 1600; i++) { g.fillStyle = `rgba(40,0,40,${0.06 + R() * 0.12})`; g.beginPath(); g.arc(R() * S, R() * S, 0.4 + R() * 0.9, 0, TAU); g.fill(); }
      for (let i = 0; i < 18; i++) blob(R() * S, R() * S, 14 + R() * 40, ['rgba(255,220,255,.08)', 'rgba(200,240,255,.07)', 'rgba(255,240,220,.06)', 'rgba(60,0,60,.08)'][i % 4]);
      for (let i = 0; i < 12; i++) crack(R() * S, R() * S, R() * TAU, 50 + R() * 70, 0.6 + R() * 0.5, 'rgba(110,20,80,.22)', 2);
    } else if (kind === 'stain') {   // an old floor: soot, wear and spatters
      for (let i = 0; i < 30; i++) blob(R() * S, R() * S, 12 + R() * 50, `rgba(0,0,0,${0.08 + R() * 0.14})`);
      for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(0,0,0,${0.1 + R() * 0.25})`; g.beginPath(); g.arc(R() * S, R() * S, 0.5 + R() * 2.2, 0, TAU); g.fill(); }
    }
    const p = g.createPattern(cv, 'repeat'); tiles[kind] = { cv, p }; return tiles[kind];
  }
  function pat(kind, k, ox, oy) { const t = tile(kind); if (t.p.setTransform) t.p.setTransform(new DOMMatrix([k, 0, 0, k, ox || 0, oy || 0])); return t.p; }

  /* ---- solids ---- */
  // every solid here is convex: faces are wound so their normals point away from its centre
  function mesh(v, f, o) {
    const cen = mul(v.reduce((a, p) => add(a, p), [0, 0, 0]), 1 / v.length);
    f = f.map(F => { const n = cross(sub(v[F[1]], v[F[0]]), sub(v[F[2]], v[F[0]])), fc = mul(F.reduce((a, i) => add(a, v[i]), [0, 0, 0]), 1 / F.length); return dot(n, sub(fc, cen)) < 0 ? F.slice().reverse() : F; });
    const E = new Map();
    f.forEach((F, fi) => F.forEach((a, k) => { const b = F[(k + 1) % F.length], lo = Math.min(a, b), hi = Math.max(a, b), key = lo * 4096 + hi, e = E.get(key); if (e) e[3] = fi; else E.set(key, [lo, hi, fi, -1]); }));
    return Object.assign({ v, f, e: [...E.values()], mat: f.map(() => 0) }, o || {});
  }
  // an n-sided bipyramid: an equator at radius r (nudged by jit), apexes at +hT and -hB
  function bipyramid(n, r, hT, hB, o) {
    o = o || {}; const R = mulberry32(o.seed || 7), v = [];
    for (let i = 0; i < n; i++) { const a = i / n * TAU + (o.a0 || 0) + (o.jit ? (R() - 0.5) * o.jit : 0), rr = r * (1 + (o.jitR ? (R() - 0.5) * o.jitR : 0)); v.push([Math.cos(a) * rr * (o.sx || 1), Math.sin(a) * rr * (o.sy || 1), o.jitZ ? (R() - 0.5) * o.jitZ : 0]); }
    v.push([o.tx || 0, o.ty || 0, hT]); v.push([o.bx || 0, o.by || 0, -hB]);
    const f = []; for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, j, n]); f.push([j, i, n + 1]); }
    return mesh(v, f);
  }
  // a pyramid: an n-gon base at z=0, its apex at z=h
  function pyramid(n, r, h, o) { o = o || {}; const v = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + (o.a0 || 0); v.push([Math.cos(a) * r * (o.sx || 1), Math.sin(a) * r * (o.sy || 1), 0]); } v.push([o.tx || 0, o.ty || 0, h]); const f = [v.slice(0, n).map((_, i) => i)]; for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n]); return mesh(v, f); }
  // a prism: a flat polygon (x, y) pushed through a thickness along z, centred
  function prism(poly, th) { const n = poly.length, v = poly.map(([x, y]) => [x, y, th / 2]).concat(poly.map(([x, y]) => [x, y, -th / 2])), f = [poly.map((_, i) => i), poly.map((_, i) => n + i)]; for (let i = 0; i < n; i++) { const j = (i + 1) % n; f.push([i, j, n + j, n + i]); } return mesh(v, f); }
  // a shard: an irregular base round the x axis at x=0 tapering to a needle at x=L
  function shard(n, w, L, o) { o = o || {}; const R = mulberry32(o.seed || 3), v = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + (o.a0 || 0) + (R() - 0.5) * 0.5, rr = w * (0.8 + R() * 0.4); v.push([0, Math.cos(a) * rr, Math.sin(a) * rr * (o.flat || 1)]); } v.push([L, (R() - 0.5) * w * 0.12, (R() - 0.5) * w * 0.12]); const f = [v.slice(0, n).map((_, i) => i)]; for (let i = 0; i < n; i++) f.push([i, (i + 1) % n, n]); return mesh(v, f); }
  // a block: half sizes along x, y, z, optionally tapering toward its top (an obelisk's shaft)
  function block(hx, hy, hz, taper) { const k = taper == null ? 1 : taper, v = []; for (const z of [-hz, hz]) for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) v.push([sx * hx * (z > 0 ? k : 1), sy * hy * (z > 0 ? k : 1), z]); return mesh(v, [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]]); }

  // the part of a polygon inside a convex one (both [[x, y], ...]): each edge of the convex one cuts away what lies outside it
  function clipConvex(P, Cp) {
    let ar = 0; for (let i = 0; i < Cp.length; i++) { const a = Cp[i], b = Cp[(i + 1) % Cp.length]; ar += a[0] * b[1] - b[0] * a[1]; }
    const sg = ar >= 0 ? 1 : -1; let out = P;
    for (let i = 0; i < Cp.length && out.length > 2; i++) {
      const a = Cp[i], b = Cp[(i + 1) % Cp.length], ex = b[0] - a[0], ey = b[1] - a[1], side = p => sg * (ex * (p[1] - a[1]) - ey * (p[0] - a[0])), inp = out; out = [];
      for (let j = 0; j < inp.length; j++) { const p = inp[j], q2 = inp[(j + 1) % inp.length], sp = side(p), sq = side(q2);
        if (sp >= 0) out.push(p);
        if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q2[0] - p[0]) * t, p[1] + (q2[1] - p[1]) * t]); } }
    }
    return out;
  }
  /* paint a solid. xf = { R, t, s } places it in the anchor's space; o.mat (or o.mats, chosen per face by mesh.mat)
     gives a face its three cel tones (c: [shadow, base, light]), a surface (tex, texA, texS: units per tile), a gloss
     that slides a glint across it, a light from below (under) and glowing edges (edge, edgeA). o.back paints the far
     faces first, faintly (for crystal); o.face(c, i, frame) paints extra detail into a face, clipped to it */
  function solid(c, cm, M, xf, o) {
    o = o || {}; const q = DunFiend.KIT.qq(), R = xf.R || I3(), t = xf.t || [0, 0, 0], s = xf.s == null ? 1 : xf.s, sv = Array.isArray(s) ? s : [s, s, s], T = cm.T;
    const W = M.v.map(p => add(t, mv(R, [p[0] * sv[0], p[1] * sv[1], p[2] * sv[2]]))), S = W.map(cm.P);
    const nf = M.f.length, N = new Array(nf), vis = new Array(nf), dep = new Array(nf);
    for (let i = 0; i < nf; i++) { const F = M.f[i]; N[i] = norm(cross(sub(W[F[1]], W[F[0]]), sub(W[F[2]], W[F[0]]))); vis[i] = dot(N[i], V) > 0.002; let d = 0; for (const k of F) d += cm.dep(W[k]); dep[i] = d / F.length; }
    const order = []; for (let i = 0; i < nf; i++) if (vis[i] || o.back) order.push(i);
    order.sort((a, b) => (vis[a] - vis[b]) || dep[a] - dep[b]);
    const mats = o.mats || [o.mat], alpha = o.alpha == null ? 1 : o.alpha;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    for (const i of order) {
      const F = M.f[i], n = N[i], mt = mats[M.mat[i]] || mats[0], front = vis[i];
      const path = () => { c.beginPath(); c.moveTo(S[F[0]][0], S[F[0]][1]); for (let k = 1; k < F.length; k++) c.lineTo(S[F[k]][0], S[F[k]][1]); c.closePath(); };
      if (!front) { c.globalAlpha = alpha * (mt.backA == null ? 0.55 : mt.backA); path(); c.fillStyle = mt.back || mt.c[0]; c.fill(); continue; }
      const ndl = dot(n, o.light || LD), band = ndl > 0.5 ? 2 : ndl > 0.04 ? 1 : 0;
      c.globalAlpha = alpha * (mt.a == null ? 1 : mt.a); path(); c.fillStyle = mt.c[band]; c.fill();
      if (q >= 1 || o.force) {
        // the face's own frame: uv in world units from its first corner, mapped to the screen by an affine fit
        const A = W[F[0]], ex = norm(sub(W[F[1]], A)), ey = cross(n, ex), uv = p => { const d = sub(p, A); return [dot(d, ex), dot(d, ey)]; };
        const ub = uv(W[F[1]]), uc = uv(W[F[2]]), det = ub[0] * uc[1] - uc[0] * ub[1];
        if (Math.abs(det) > 1e-6) {
          const sa = S[F[0]], db = [S[F[1]][0] - sa[0], S[F[1]][1] - sa[1]], dc = [S[F[2]][0] - sa[0], S[F[2]][1] - sa[1]], i00 = uc[1] / det, i01 = -uc[0] / det, i10 = -ub[1] / det, i11 = ub[0] / det;
          const J00 = db[0] * i00 + dc[0] * i10, J01 = db[0] * i01 + dc[0] * i11, J10 = db[1] * i00 + dc[1] * i10, J11 = db[1] * i01 + dc[1] * i11;
          let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9; for (const k of F) { const p = uv(W[k]); if (p[0] < u0) u0 = p[0]; if (p[0] > u1) u1 = p[0]; if (p[1] < v0) v0 = p[1]; if (p[1] > v1) v1 = p[1]; }
          const ext = Math.max(u1 - u0, v1 - v0), fr = { u0, u1, v0, v1, ext, n, i, uv, band };
          // each layer goes through the face's own outline, its surface carried by the face's frame (the pattern turned
          // with it, the glint cut to it here): a clip would cost a mask of the face each time
          const toS = (u, v) => [sa[0] + J00 * u + J01 * v, sa[1] + J10 * u + J11 * v], fill = P => { c.beginPath(); P.forEach((p, k) => { const s2 = toS(p[0], p[1]); k ? c.lineTo(s2[0], s2[1]) : c.moveTo(s2[0], s2[1]); }); c.closePath(); c.fill(); };
          if (mt.tex && q >= 2) { const k = (mt.texS || 4) / 256, ox = ((i * 0.37) % 1) * 256 * k + (o.texO || 0), oy = ((i * 0.61) % 1) * 256 * k, tl = tile(mt.tex); c.globalAlpha = alpha * (mt.texA == null ? 0.85 : mt.texA);
            if (tl.p.setTransform) { tl.p.setTransform(new DOMMatrix([J00 * k, J10 * k, J01 * k, J11 * k, sa[0] + J00 * ox + J01 * oy, sa[1] + J10 * ox + J11 * oy])); c.fillStyle = tl.p; path(); c.fill(); }
            else { c.save(); path(); c.clip(); c.transform(J00, J10, J01, J11, sa[0], sa[1]); c.fillStyle = tl.p; c.fillRect(u0 - 0.1, v0 - 0.1, u1 - u0 + 0.2, v1 - v0 + 0.2); c.restore(); } }
          // light from below (a red abyss, a lit floor) on the faces that look down at it
          if (mt.under && n[2] < -0.12) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = alpha * Math.min(0.55, -n[2] * 0.65) * (o.underK == null ? 1 : o.underK); c.fillStyle = mt.under; path(); c.fill(); c.globalCompositeOperation = 'source-over'; }
          // a polished face shows the bright sky as a hard-edged glint that slides across it as it turns
          if (mt.gloss && q >= 1) { const Rv = sub(mul(n, 2 * dot(n, V)), V), gk = dot(Rv, mt.sky || SKY); if (gk > -0.1) { const off = lerp(-0.7, 0.7, clamp01((gk + 0.1) / 1.0)), ga = mt.glintA == null ? 0.8 : mt.glintA, dx = Math.cos(ga), dy = Math.sin(ga), cx = (u0 + u1) / 2 - dy * off * ext, cy = (v0 + v1) / 2 + dx * off * ext, FU = F.map(kk => uv(W[kk]));
              const quad = (w, o2) => { const ox = -dy * o2 * ext, oy = dx * o2 * ext, L = ext * 2, P = clipConvex([[cx + ox - dx * L - dy * w * ext, cy + oy - dy * L + dx * w * ext], [cx + ox + dx * L - dy * w * ext, cy + oy + dy * L + dx * w * ext], [cx + ox + dx * L + dy * w * ext, cy + oy + dy * L - dx * w * ext], [cx + ox - dx * L + dy * w * ext, cy + oy - dy * L - dx * w * ext]], FU); if (P.length > 2) fill(P); };
              c.globalCompositeOperation = 'lighter'; c.fillStyle = mt.glint || '#FFFFFF'; const gl = mt.gloss * (0.55 + 0.45 * clamp01(gk)); c.globalAlpha = alpha * gl * 0.2; quad(0.16, 0); c.globalAlpha = alpha * gl * 0.55; quad(0.025, 0.22); c.globalCompositeOperation = 'source-over'; } }
          if (o.face) { c.save(); path(); c.clip(); c.transform(J00, J10, J01, J11, sa[0], sa[1]); o.face(c, i, fr); c.restore(); }
        }
      }
      if (o.flash > 0) { c.globalAlpha = alpha * 0.35 * o.flash; path(); c.fillStyle = '#FFF4EC'; c.fill(); }
      if (o.tint) { c.globalAlpha = alpha * o.tint[1]; path(); c.fillStyle = o.tint[0]; c.fill(); }
    }
    // the edges: ink round the silhouette, finer ink on the creases, and light where the solid glows
    c.globalAlpha = alpha;
    const ink = o.ink || '#06040A', lwS = Math.max(1.4, T * (o.lw || 0.07)), lwI = Math.max(0.7, T * (o.lwI || 0.028)), m0 = mats[0], seam = o.seam;
    const sil = new Path2D(), cre = new Path2D(), glw = new Path2D(), sm = new Path2D(); let nG = 0, nS = 0;
    for (const [a, b, f1, f2] of M.e) {
      const v1 = f1 >= 0 && vis[f1], v2 = f2 >= 0 && vis[f2]; if (!v1 && !v2) continue;
      const P = (v1 !== v2) ? sil : cre; P.moveTo(S[a][0], S[a][1]); P.lineTo(S[b][0], S[b][1]);
      if (seam && seam(a, b)) { sm.moveTo(S[a][0], S[a][1]); sm.lineTo(S[b][0], S[b][1]); nS++; }
      else if (m0.edge) { glw.moveTo(S[a][0], S[a][1]); glw.lineTo(S[b][0], S[b][1]); nG++; }
    }
    if (o.inner !== false) { c.strokeStyle = o.inkI || ink; c.lineWidth = lwI; c.globalAlpha = alpha * (o.inkIA == null ? 0.75 : o.inkIA); c.stroke(cre); }
    c.globalAlpha = alpha; c.strokeStyle = ink; c.lineWidth = lwS; c.stroke(sil);
    if (nG && q >= 1) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(m0.edge, (m0.edgeA == null ? 0.5 : m0.edgeA) * 0.35); c.lineWidth = Math.max(2, T * 0.12); c.stroke(glw); c.strokeStyle = rgba(m0.edge, m0.edgeA == null ? 0.5 : m0.edgeA); c.lineWidth = Math.max(0.8, T * 0.03); c.stroke(glw); c.globalCompositeOperation = 'source-over'; }
    if (nS) { const sc = o.seamCol || '#FF2A3A', k = o.seamK == null ? 1 : o.seamK; c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(sc, 0.35 * k); c.lineWidth = Math.max(4, T * 0.3); c.stroke(sm); c.strokeStyle = rgba(sc, 0.9 * k); c.lineWidth = Math.max(1.5, T * 0.08); c.stroke(sm); c.strokeStyle = rgba('#FFFFFF', 0.85 * k); c.lineWidth = Math.max(0.8, T * 0.025); c.stroke(sm); c.globalCompositeOperation = 'source-over'; }
    c.restore();
    return { W, S, N, vis };
  }
  // a soft shadow on the floor under something that hovers (smaller and fainter the higher it is)
  function shadow(c, X, Y, rx, ry, z, a) { const k = 1 / (1 + (z || 0) * 0.12), ga = c.globalAlpha; if (!(rx > 0) || !(ry > 0)) return; c.globalAlpha = ga * Math.min(1, (a == null ? 0.45 : a) * k); blitSized(c, shadeSprite('#040208'), X - rx * k, Y - ry * k, rx * k * 2, ry * k * 2); c.globalAlpha = ga; }
  function glow(c, x, y, r, col, a) { if (!(r > 0) || !(a > 0.004)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.min(1, a); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }

  /* ---- the fight's machinery ---- */
  // a job is a list of timed events [t, fn], a tick each frame, and an end; hold keeps it running
  function job(ev, end, o) { ev.sort((a, b) => a[0] - b[0]); return Object.assign({ t: 0, i: 0, ev, end }, o || {}); }
  function stepJob(FX, m, J, dt) { J.t += dt; while (J.i < J.ev.length && J.ev[J.i][0] <= J.t) { J.ev[J.i][1](FX, m, J); J.i++; } if (J.tick) J.tick(FX, m, J, dt); return !J.hold && J.t >= J.end && J.i >= J.ev.length; }
  // a blow that lands on the pet; blows that land together count once
  function hurt(FX, d, o) { const M = FX.mem, now = FX.S.t; if (now - (M._lastHit || -9) < 0.25) return false; if (FX.hurt(d, o)) { M._lastHit = now; return true; } return false; }
  /* warnings on the floor. Shapes: circle (x, y, r), band (x0, y0, x1, y1, hw), rect (x, y, w, h), ring (x, y, r0, r1,
     gaps [[a, half width]]), sector (x, y, a0, a1, r0, r1), poly (pts), multi (parts). solid:false is an illusion: a broken
     outline over nothing, and it does no harm. fillin: a broken mark that fills in until it strikes */
  function warn(FX, o) {
    const z = FX.hz(Object.assign({ kind: 'gw', gw: true, x: FX.C.x, y: FX.C.y, dps: 0, solid: true, col: '#FF3048' }, o));
    z.t = o.t || 1; z.life = z.t + (o.linger == null ? 0.45 : o.linger); z.draw = drawWarn;
    z.update = (dt, zz) => {
      if (FX.g.cineT > 0 || FX.g.stopT > 0) { zz.age -= dt; return; }
      if (o.upd) o.upd(dt, zz, FX);
      if (!zz.fired && zz.age >= zz.t) { zz.fired = true; if (zz.cut) { zz.life = zz.age; return; } const me = FX.me; if (zz.dmg && zz.solid !== false && inZone(zz, me.x, me.y, me.r)) hurt(FX, zz.dmg, zz.hurtO); if (zz.fn) zz.fn(FX, zz); }
    };
    return z;
  }
  function clearWarns(FX) { FX.S.hz.forEach(z => { if (z.gw && !z.fired) { z.cut = true; z.life = Math.min(z.life, z.age + 0.25); } }); }
  function inPoly(P, x, y) { let ins = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1]; if (((yi > y) !== (yj > y)) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }
  function segD(x, y, x0, y0, x1, y1) { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, u = clamp01(((x - x0) * dx + (y - y0) * dy) / L2); return Math.hypot(x - x0 - dx * u, y - y0 - dy * u); }
  function inZone(z, x, y, r) {
    r = r || 0;
    switch (z.shape) {
      case 'circle': return Math.hypot(x - z.x, y - z.y) < z.r + r;
      case 'band': { const dx = z.x1 - z.x0, dy = z.y1 - z.y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, s = (x - z.x0) * ux + (y - z.y0) * uy, d = Math.abs(-(x - z.x0) * uy + (y - z.y0) * ux); return s > -r && s < L + r && d < z.hw + r; }
      case 'rect': return Math.abs(x - z.x) < z.w / 2 + r && Math.abs(y - z.y) < z.h / 2 + r;
      case 'ring': { const d = Math.hypot(x - z.x, y - z.y); if (d < z.r0 - r || d > z.r1 + r) return false; if (z.gaps) { const a = Math.atan2(y - z.y, x - z.x); if (z.gaps.some(([g0, w]) => Math.abs(angTo(g0, a)) < w)) return false; } return true; }
      case 'sector': { const d = Math.hypot(x - z.x, y - z.y); if (d < (z.r0 || 0) - r || d > z.r1 + r) return false; const a = Math.atan2(y - z.y, x - z.x), mid = (z.a0 + z.a1) / 2; return Math.abs(angTo(mid, a)) < (z.a1 - z.a0) / 2 + r / Math.max(1, d); }
      case 'poly': { if (inPoly(z.pts, x, y)) return true; let dm = 1e9; for (let i = 0; i < z.pts.length; i++) { const p = z.pts[i], q2 = z.pts[(i + 1) % z.pts.length]; dm = Math.min(dm, segD(x, y, p[0], p[1], q2[0], q2[1])); } return dm < r * 0.5; }
      case 'multi': return z.parts.some(p => inZone(p, x, y, r));
    }
    return false;
  }
  // the outline of a zone on screen; g grows it from nothing (0) to whole (1)
  function zonePath(c, z, FX, T, g) { c.beginPath(); addZone(c, z, FX, T, g == null ? 1 : g); }
  function addZone(c, z, FX, T, g) {
    const sx = FX.sx, sy = FX.sy;
    switch (z.shape) {
      case 'circle': { const X = sx(z.x), Y = sy(z.y), r = Math.max(0.1, z.r * T * g); c.moveTo(X + r, Y); c.arc(X, Y, r, 0, TAU); break; }
      case 'band': { const dx = z.x1 - z.x0, dy = z.y1 - z.y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, gw = z.grow === 'len', hw = z.hw * (gw ? 1 : g), L2 = L * (gw ? g : 1), mx = gw ? 0 : 0;
        const p = [[z.x0 + nx * hw, z.y0 + ny * hw], [z.x0 + ux * L2 + nx * hw, z.y0 + uy * L2 + ny * hw], [z.x0 + ux * L2 - nx * hw, z.y0 + uy * L2 - ny * hw], [z.x0 - nx * hw, z.y0 - ny * hw]]; c.moveTo(sx(p[0][0]) + mx, sy(p[0][1])); for (let i = 1; i < 4; i++) c.lineTo(sx(p[i][0]), sy(p[i][1])); c.closePath(); break; }
      case 'rect': { const w = z.w * g / 2, h = z.h * g / 2; c.rect(sx(z.x - w), sy(z.y - h), w * 2 * T, h * 2 * T); break; }
      case 'ring': { const X = sx(z.x), Y = sy(z.y), r0 = z.r0 * T, r1 = (z.r0 + (z.r1 - z.r0) * g) * T;
        if (z.gaps && z.gaps.length) { const gs = z.gaps.map(([a, w]) => [a - w, a + w]).sort((p, q2) => p[0] - q2[0]); for (let i = 0; i < gs.length; i++) { const b0 = gs[i][1], b1 = gs[(i + 1) % gs.length][0] + (i === gs.length - 1 ? TAU : 0); c.moveTo(X + Math.cos(b0) * r1, Y + Math.sin(b0) * r1); c.arc(X, Y, r1, b0, b1); c.arc(X, Y, Math.max(0.1, r0), b1, b0, true); c.closePath(); } }
        else { c.moveTo(X + r1, Y); c.arc(X, Y, r1, 0, TAU); c.moveTo(X + r0, Y); c.arc(X, Y, Math.max(0.1, r0), 0, TAU, true); } break; }
      case 'sector': { const X = sx(z.x), Y = sy(z.y), r0 = (z.r0 || 0) * T, r1 = Math.max(r0 + 0.1, ((z.r0 || 0) + (z.r1 - (z.r0 || 0)) * g) * T); c.moveTo(X + Math.cos(z.a0) * r1, Y + Math.sin(z.a0) * r1); c.arc(X, Y, r1, z.a0, z.a1); if (r0 > 0.1) c.arc(X, Y, r0, z.a1, z.a0, true); else c.lineTo(X, Y); c.closePath(); break; }
      case 'poly': { let cx = 0, cy = 0; z.pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= z.pts.length; cy /= z.pts.length; z.pts.forEach((p, i) => { const x = sx(cx + (p[0] - cx) * g), y = sy(cy + (p[1] - cy) * g); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); break; }
      case 'multi': z.parts.forEach(p => addZone(c, p, FX, T, g)); break;
    }
  }
  // the outline of a zone drawn in from its edge by d (in tiles), to feather what fills it
  function insetPath(c, z, FX, T, d) { c.beginPath(); addInset(c, z, FX, T, d); }
  function addInset(c, z, FX, T, d) {
    const sx = FX.sx, sy = FX.sy;
    switch (z.shape) {
      case 'circle': { const r = (z.r - d) * T; if (r > 0.5) { const X = sx(z.x), Y = sy(z.y); c.moveTo(X + r, Y); c.arc(X, Y, r, 0, TAU); } break; }
      case 'band': { const dx = z.x1 - z.x0, dy = z.y1 - z.y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, hw = z.hw - d, s0 = Math.min(d, L * 0.45), s1 = L - s0; if (hw <= 0.03) break;
        [[s0, hw], [s1, hw], [s1, -hw], [s0, -hw]].forEach(([u, n], i) => { const x = sx(z.x0 + ux * u - uy * n), y = sy(z.y0 + uy * u + ux * n); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); break; }
      case 'rect': { const w = z.w / 2 - d, h = z.h / 2 - d; if (w > 0.03 && h > 0.03) c.rect(sx(z.x - w), sy(z.y - h), w * 2 * T, h * 2 * T); break; }
      case 'ring': { const r0 = z.r0 + d, r1 = z.r1 - d, da = d / Math.max(0.5, (r0 + r1) / 2); if (r1 - r0 > 0.03) addZone(c, { shape: 'ring', x: z.x, y: z.y, r0, r1, gaps: z.gaps && z.gaps.map(([a, w]) => [a, w + da]) }, FX, T, 1); break; }
      case 'sector': { const r0 = z.r0 ? z.r0 + d : 0, r1 = z.r1 - d, da = d / Math.max(0.5, (r0 + r1) / 2); if (r1 - r0 > 0.03 && z.a1 - z.a0 > da * 2.2) addZone(c, { shape: 'sector', x: z.x, y: z.y, r0, r1, a0: z.a0 + da, a1: z.a1 - da }, FX, T, 1); break; }
      case 'poly': { let cx = 0, cy = 0; z.pts.forEach(p => { cx += p[0]; cy += p[1]; }); cx /= z.pts.length; cy /= z.pts.length; let ir = 1e9; z.pts.forEach((p, i) => { const q2 = z.pts[(i + 1) % z.pts.length]; ir = Math.min(ir, segD(cx, cy, p[0], p[1], q2[0], q2[1])); });
        const f = 1 - d / Math.max(0.05, ir); if (f <= 0.05) break; z.pts.forEach((p, i) => { const x = sx(cx + (p[0] - cx) * f), y = sy(cy + (p[1] - cy) * f); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); break; }
      case 'multi': z.parts.forEach(p => addInset(c, p, FX, T, d)); break;
    }
  }
  // a struck zone's flash, feathered: brightest well within and fading out across its rim, where a soft glow in its colour
  // straddles the edge, so it never ends in a hard line
  function softZone(c, z, FX, T, fill, col, k) {
    c.lineJoin = 'round';
    for (let i = 0; i < 6; i++) { insetPath(c, z, FX, T, 0.04 + i * 0.11); c.fillStyle = rgba(fill, 0.06 * k); c.fill(); }
    zonePath(c, z, FX, T); [[0.7, 0.035], [0.5, 0.05], [0.32, 0.08], [0.18, 0.12], [0.07, 0.2]].forEach(([w, a]) => { c.lineWidth = Math.max(1, w * T); c.strokeStyle = rgba(col, a * k); c.stroke(); });
  }
  function labelAt(z) { if (z.lx != null) return [z.lx, z.ly]; switch (z.shape) { case 'band': return [(z.x0 + z.x1) / 2, (z.y0 + z.y1) / 2]; case 'multi': return labelAt(z.parts[0]); case 'poly': { let cx = 0, cy = 0; z.pts.forEach(p => { cx += p[0]; cy += p[1]; }); return [cx / z.pts.length, cy / z.pts.length]; } case 'ring': return [z.x + (z.r0 + z.r1) / 2, z.y]; case 'sector': { const a = (z.a0 + z.a1) / 2, r = ((z.r0 || 0) + z.r1) / 2; return [z.x + Math.cos(a) * r, z.y + Math.sin(a) * r]; } default: return [z.x, z.y]; } }
  function drawWarn(c, z, FX, T, t) {
    const u = clamp01(z.age / z.t), col = z.col, real = z.solid !== false;
    if (z.fired) { const L = z.linger == null ? 0.45 : z.linger, k = 1 - clamp01((z.age - z.t) / Math.max(0.05, L)); if (k <= 0 || z.cut || !real) return; c.save(); c.globalCompositeOperation = 'lighter'; softZone(c, z, FX, T, z.flash || '#FFFFFF', col, k); c.restore(); return; }
    const fade = Math.min(1, z.age / 0.15) * (z.cut ? 0.4 : 1);
    c.save(); c.globalAlpha = fade; c.lineJoin = 'round';
    if (real && z.fillin) {
      // a broken mark that mends as its time comes: the gaps in its outline close and its fill rises
      zonePath(c, z, FX, T); c.fillStyle = `rgba(6,2,10,${0.08 + 0.2 * u})`; c.fill();
      c.globalCompositeOperation = 'lighter'; zonePath(c, z, FX, T, u); c.fillStyle = rgba(col, 0.06 + 0.24 * u); c.fill();
      c.setLineDash([T * (0.2 + 0.8 * u), T * 0.5 * (1 - u) + 0.01]); zonePath(c, z, FX, T); c.lineWidth = 2 + u * 1.5; c.strokeStyle = rgba(col, 0.45 + 0.45 * u); c.stroke(); c.setLineDash([]);
    } else if (real) {
      // the real thing pools a shadow (a solid mark on the floor), fills toward its strike and quickens its edge
      zonePath(c, z, FX, T); c.fillStyle = `rgba(6,2,10,${0.2 + 0.14 * u})`; c.fill();
      c.globalCompositeOperation = 'lighter';
      zonePath(c, z, FX, T, z.grow === false ? 1 : u); c.fillStyle = rgba(col, 0.1 + 0.22 * u); c.fill();
      zonePath(c, z, FX, T); c.lineWidth = 2 + u * 1.6; c.strokeStyle = rgba(col, 0.5 + 0.3 * u + 0.15 * Math.sin(t * (8 + u * 20))); c.stroke();
      if (u > 0.82) { zonePath(c, z, FX, T); c.fillStyle = rgba('#FFFFFF', (u - 0.82) * 0.5); c.fill(); }
    } else {
      // an illusion: a broken outline, flickering, over nothing
      c.globalCompositeOperation = 'lighter'; c.setLineDash([T * 0.42, T * 0.34]); c.lineDashOffset = -t * T * 1.4;
      const fl = (0.6 + 0.25 * Math.sin(t * 23 + z.x)) * (0.75 + 0.25 * u);
      zonePath(c, z, FX, T); c.lineWidth = 3; c.strokeStyle = rgba(col, fl); c.stroke(); c.lineWidth = 1.1; c.strokeStyle = rgba('#FFFFFF', fl * 0.55); c.stroke(); c.setLineDash([]);
    }
    if (z.label) { const [lx, ly] = labelAt(z), X = FX.sx(lx), Y = FX.sy(ly); c.globalCompositeOperation = 'source-over'; c.globalAlpha = fade * (real ? 1 : 0.55); c.font = `900 ${Math.round(Math.max(12, T * 0.62))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText(z.label, X, Y); c.fillStyle = real ? '#FFFFFF' : rgba('#FFFFFF', 0.6); c.fillText(z.label, X, Y); }
    c.restore();
  }
  // a picture laid over a parallelogram on the screen: o its first corner, u and v its two sides from there
  function quad(c, img, ox, oy, ux, uy, vx, vy) { c.save(); c.transform(ux, uy, vx, vy, ox, oy); c.drawImage(img, 0, 0, 1, 1); c.restore(); }
  /* ---- light in the air: planes that rise from a cut, columns of light, beams between points, all fading ---- */
  function vfx(M, o) { (M.vfx || (M.vfx = [])).push(Object.assign({ t: 0, life: 0.6 }, o)); }
  function stepVfx(M, dt) { if (M.vfx && M.vfx.length) M.vfx = M.vfx.filter(e => (e.t += dt) < e.life); }
  function drawVfx(c, FX, M, T) {
    if (!M.vfx || !M.vfx.length) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const e of M.vfx) {
      const k = 1 - e.t / e.life, rise = snap(e.t / (e.rise || 0.12)), col = e.col || '#FF3048';
      if (e.kind === 'plane') {   // a sheet of light standing up from a line on the floor
        const a = [FX.sx(e.x0), FX.sy(e.y0)], b = [FX.sx(e.x1), FX.sy(e.y1)], H = (e.h || 6) * T * CE * rise;
        // (every part a soft picture laid over its shape, so nothing ends in a hard edge: the cut's glow on the floor,
        // the sheet rising from it, and a fine bright line at the heart of the cut)
        if (e.w > 0) { const dx = e.x1 - e.x0, dy = e.y1 - e.y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L * e.w, ny = dx / L * e.w, o0 = [FX.sx(e.x0 - nx), FX.sy(e.y0 - ny)];
          c.globalAlpha = 0.55 * k; quad(c, beamSprite(col), o0[0], o0[1], FX.sx(e.x1 - nx) - o0[0], FX.sy(e.y1 - ny) - o0[1], FX.sx(e.x0 + nx) - o0[0], FX.sy(e.y0 + ny) - o0[1]); }
        c.globalAlpha = k; quad(c, sheetSprite(col), a[0], a[1] - H, b[0] - a[0], b[1] - a[1], 0, H);
        const dxs = b[0] - a[0], dys = b[1] - a[1], Ls = Math.hypot(dxs, dys) || 1, gw = Math.max(8, T * 0.7 * k), px = -dys / Ls * gw, py = dxs / Ls * gw;
        c.globalAlpha = 0.8 * k; quad(c, beamSprite(col), a[0] - px / 2, a[1] - py / 2, dxs, dys, px, py);
        const cw = Math.max(4, T * 0.22 * k), qx = -dys / Ls * cw, qy = dxs / Ls * cw; c.globalAlpha = k; quad(c, beamSprite('#FFFFFF'), a[0] - qx / 2, a[1] - qy / 2, dxs, dys, qx, qy);
      } else if (e.kind === 'pillar') {   // a column of light on a circle of floor, soft at its sides and its top
        const X = FX.sx(e.x), Y = FX.sy(e.y), r = e.r * T, H = (e.h || 9) * T * CE * rise;
        c.globalAlpha = 0.9 * k; blitSized(c, columnSprite(col), X - r * 1.2, Y - H, r * 2.4, H);
        c.globalAlpha = k; c.save(); c.translate(X, Y); c.scale(1, 0.5); blitSized(c, glowSprite(col), -r * 2, -r * 2, r * 4, r * 4); c.restore();
        c.globalAlpha = 0.75 * k; blitSized(c, columnSprite('#FFFFFF'), X - r * 0.35, Y - H, r * 0.7, H);
      } else if (e.kind === 'beam') {   // a line of light between points in the air ([x, y, z] each)
        // (each stretch a soft ray: gaussian across, its ends rounded and soft, a white heart down the middle)
        const P = e.pts.map(p => at(FX, p[0], p[1], p[2])); c.globalAlpha = 1;
        for (let i = 1; i < P.length; i++) { softRay(c, P[i - 1][0], P[i - 1][1], P[i][0], P[i][1], Math.max(3, e.w * 3.4 * T), col, 0.7 * k); softRay(c, P[i - 1][0], P[i - 1][1], P[i][0], P[i][1], Math.max(2, e.w * 1.5 * T), col, k, 0.45); }
      } else if (e.kind === 'flare') {   // a burst of light at a point in the air
        const p = at(FX, e.x, e.y, e.z || 0), r = (e.r || 2) * T * (0.6 + 0.4 * rise); c.globalAlpha = k; blitSized(c, glowSprite(col), p[0] - r, p[1] - r, r * 2, r * 2); blitSized(c, glowSprite('#FFFFFF'), p[0] - r * 0.35, p[1] - r * 0.35, r * 0.7, r * 0.7);
      } else if (e.draw) { c.save(); e.draw(c, FX, e, T, k); c.restore(); }
    }
    c.restore();
  }
  /* ---- walls the pet cannot pass: segments (x0, y0, x1, y1, hw) and posts (x, y, r). The pet is put back on the side
     it came from. A wall may also sting (hurt, with its own cooldown) ---- */
  function walls(FX, list) {
    const me = FX.me, M = FX.mem, P = M._prev || (M._prev = { x: me.x, y: me.y });
    for (const w of list) {
      if (!w || w.off) continue;
      if (w.r != null) { const dx = me.x - w.x, dy = me.y - w.y, d = Math.hypot(dx, dy) || 1e-3, lim = w.r + me.r; if (d < lim) { me.x = w.x + dx / d * lim; me.y = w.y + dy / d * lim; if (w.sting) sting(FX, w); } continue; }
      const dx = w.x1 - w.x0, dy = w.y1 - w.y0, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
      const s = (me.x - w.x0) * ux + (me.y - w.y0) * uy; if (s < -me.r * 0.5 || s > L + me.r * 0.5) continue;
      const d = (me.x - w.x0) * nx + (me.y - w.y0) * ny, lim = (w.hw || 0.3) + me.r; if (Math.abs(d) >= lim) continue;
      const dp = (P.x - w.x0) * nx + (P.y - w.y0) * ny, side = dp >= 0 ? 1 : -1, push = side * lim - d;
      me.x += nx * push; me.y += ny * push; if (w.sting) sting(FX, w);
    }
    P.x = me.x; P.y = me.y;
  }
  function sting(FX, w) { const now = FX.S.t; if (now - (w._st || -9) < (w.cd || 0.8)) return; w._st = now; hurt(FX, w.sting); }
  /* ---- little symbols for fights that announce their order: shown over the boss and beside the arena ---- */
  function glyph(c, kind, x, y, s, col, a) {
    c.save(); c.translate(x, y); c.globalAlpha = a == null ? 1 : a; c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = 'rgba(8,4,12,.72)'; c.beginPath(); c.moveTo(0, -s); c.lineTo(s, 0); c.lineTo(0, s); c.lineTo(-s, 0); c.closePath(); c.fill(); c.strokeStyle = col; c.lineWidth = Math.max(1.5, s * 0.12); c.stroke();
    c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(1.5, s * 0.16); c.beginPath(); const k = s * 0.5;
    switch (kind) {
      case 'h': c.moveTo(-k, 0); c.lineTo(k, 0); break;
      case 'v': c.moveTo(0, -k); c.lineTo(0, k); break;
      case 'd1': c.moveTo(-k * 0.75, -k * 0.75); c.lineTo(k * 0.75, k * 0.75); break;
      case 'd2': c.moveTo(-k * 0.75, k * 0.75); c.lineTo(k * 0.75, -k * 0.75); break;
      case 'x': c.moveTo(-k, 0); c.lineTo(k, 0); c.moveTo(0, -k); c.lineTo(0, k); break;
      case 'xd': c.moveTo(-k * 0.75, -k * 0.75); c.lineTo(k * 0.75, k * 0.75); c.moveTo(-k * 0.75, k * 0.75); c.lineTo(k * 0.75, -k * 0.75); break;
      case 'lanes': for (const o2 of [-0.55, 0, 0.55]) { c.moveTo(o2 * k, -k * 0.8); c.lineTo(o2 * k, k * 0.8); } break;
      case 'pin': c.moveTo(0, -k * 0.9); c.lineTo(0, k * 0.3); c.moveTo(-k * 0.4, k * 0.1); c.lineTo(0, k * 0.7); c.lineTo(k * 0.4, k * 0.1); break;
      case 'ring': c.arc(0, 0, k * 0.75, 0.5, TAU - 0.5); break;
      case 'lash': c.moveTo(-k, -k * 0.6); c.quadraticCurveTo(0, k * 0.2, k, k * 0.6); break;
      case 'quad': c.moveTo(-k, 0); c.lineTo(k, 0); c.moveTo(0, -k); c.lineTo(0, k); c.moveTo(-k * 0.6, -k * 0.6); c.lineTo(k * 0.6, k * 0.6); break;
      case 'dot': c.arc(0, 0, k * 0.35, 0, TAU); break;
      default: c.arc(0, 0, k * 0.5, 0, TAU);
    }
    c.stroke(); c.restore();
  }
  // a pulse of light travelling a polyline of screen points (u 0..1 along it)
  function pulseAt(pts, u) { const n = pts.length - 1, k = clamp01(u) * n, i = Math.min(n - 1, Math.floor(k)), e = k - i; return [lerp(pts[i][0], pts[i + 1][0], e), lerp(pts[i][1], pts[i + 1][1], e)]; }
  return { TAU, EL, SE, CE, V, LD, SKY, clamp01, lerp, sstep, ease, snap, angTo, rgba, mixC, add, sub, mul, dot, cross, len, norm, lerp3, I3, mm, mv, rx, ry, rz, axisR, frame, cam, at,
    tile, pat, mesh, bipyramid, pyramid, prism, shard, block, solid, shadow, glow, job, stepJob, hurt, warn, clearWarns, inZone, inPoly, segD, zonePath, vfx, stepVfx, drawVfx, walls, glyph, pulseAt };
})();
