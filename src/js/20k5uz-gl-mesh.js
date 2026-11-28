/* ---------- GLM: a small self-contained WebGL mesh renderer (for models drawn live on the GPU: Susano O) ----------
   Builds meshes procedurally (bevelled boxes, ellipsoids and domes, tubes and cones, tori, lathes, extruded outlines,
   parametric surfaces), each vertex carrying a material id, an edge-wear weight and an occlusion term; renders posed
   rigid parts into one offscreen WebGL canvas (WebGL2 where there is one, else WebGL1) with a physically based shader
   (metal / roughness per material, a lacquer clear coat, a key light, a cool rim, a studio environment, procedural
   seams, filigree, scratches, braid, emissive violet), which the 2D game canvas then draws as one image.
   The context is made on first use; if WebGL is missing, or the context is lost, ok() says so (the model then draws its
   own fallback); a restored context rebuilds the program and re-uploads every mesh. */
const GLM = (() => {
  /* ================= mesh building ================= */
  // a builder: positions, normals, attributes (material id, edge wear, occlusion), indices; a frame stack (rotation
  // columns x, y, z and an origin) the primitives are placed in
  function builder(q) {
    q = q || 1; const sq = (n, lo) => Math.max(lo || 3, Math.round(n * q));   // (q: the detail level - the round segment counts scale with it)
    const P = [], N = [], A = [], I = []; let F = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], o: [0, 0, 0] }; const stack = [];
    const tp = p => [F.o[0] + F.x[0] * p[0] + F.y[0] * p[1] + F.z[0] * p[2], F.o[1] + F.x[1] * p[0] + F.y[1] * p[1] + F.z[1] * p[2], F.o[2] + F.x[2] * p[0] + F.y[2] * p[1] + F.z[2] * p[2]];
    const tn = n => { const A2 = F.n ? F.n[0] : F.x, B2 = F.n ? F.n[1] : F.y, C2 = F.n ? F.n[2] : F.z, v = [A2[0] * n[0] + B2[0] * n[1] + C2[0] * n[2], A2[1] * n[0] + B2[1] * n[1] + C2[1] * n[2], A2[2] * n[0] + B2[2] * n[1] + C2[2] * n[2]]; const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
    let AUX = 1;   // (the third attribute: occlusion, 1 = open; a crystal writes 1 - its length-wise position there, for the ice's gradient)
    const vtx = (p, n, m, e) => { const q = tp(p), nn = tn(n); P.push(q[0], q[1], q[2]); N.push(nn[0], nn[1], nn[2]); A.push(m, e || 0, AUX); return P.length / 3 - 1; };
    const quad = (a, b, c, d) => { I.push(a, b, c, a, c, d); };
    const B = {
      /* place what follows in a frame: columns x, y, z (need not be unit: a scale) and origin o, within the current one */
      push(x, y, z, o) { stack.push(F); const nf = { x: [0, 0, 0], y: [0, 0, 0], z: [0, 0, 0], o: tp(o || [0, 0, 0]) }; const lin = v => [F.x[0] * v[0] + F.y[0] * v[1] + F.z[0] * v[2], F.x[1] * v[0] + F.y[1] * v[1] + F.z[1] * v[2], F.x[2] * v[0] + F.y[2] * v[1] + F.z[2] * v[2]]; nf.x = lin(x); nf.y = lin(y); nf.z = lin(z);
        const cr = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; nf.n = [cr(nf.y, nf.z), cr(nf.z, nf.x), cr(nf.x, nf.y)];   // (normals: the inverse transpose, for a scaled frame)
        F = nf; return B; },
      at(o) { return B.push([1, 0, 0], [0, 1, 0], [0, 0, 1], o); },
      /* a frame with x along d (from o), z as near zh as it can be */
      along(o, d, zh) { const l = Math.hypot(d[0], d[1], d[2]) || 1, x = [d[0] / l, d[1] / l, d[2] / l]; zh = zh || (Math.abs(x[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]); let y = [zh[1] * x[2] - zh[2] * x[1], zh[2] * x[0] - zh[0] * x[2], zh[0] * x[1] - zh[1] * x[0]]; const ly = Math.hypot(y[0], y[1], y[2]) || 1; y = [y[0] / ly, y[1] / ly, y[2] / ly]; const z = [x[1] * y[2] - x[2] * y[1], x[2] * y[0] - x[0] * y[2], x[0] * y[1] - x[1] * y[0]]; return B.push(x, y, z, o); },
      pop() { F = stack.pop(); return B; },
      /* a box with rounded (bevelled) edges: centre c, half sizes h, bevel radius b; the bevels carry edge wear */
      box(c, h, b, m, mf) { b = Math.min(b || 0, h[0], h[1], h[2]); if (b < 0.0065) b = 0; const S = hx => b > 0.07 ? [-hx, -hx + 0.3 * b, -hx + b, hx - b, hx - 0.3 * b, hx] : b > 1e-4 ? [-hx, -hx + b, hx - b, hx] : [-hx, hx];   // (a big bevel rounded in two steps, a small one chamfered)
        const ax = [S(h[0]), S(h[1]), S(h[2])];
        for (let f = 0; f < 6; f++) { const k = f >> 1, sg = f & 1 ? 1 : -1, u = (k + 1) % 3, v = (k + 2) % 3, U = ax[u], Vv = ax[v], base = P.length / 3;
          for (let j = 0; j < Vv.length; j++) for (let i = 0; i < U.length; i++) { const q = [0, 0, 0]; q[k] = sg * h[k]; q[u] = U[i]; q[v] = Vv[j];
            const inr = [Math.max(-h[0] + b, Math.min(h[0] - b, q[0])), Math.max(-h[1] + b, Math.min(h[1] - b, q[1])), Math.max(-h[2] + b, Math.min(h[2] - b, q[2]))];
            let d = [q[0] - inr[0], q[1] - inr[1], q[2] - inr[2]]; const l = Math.hypot(d[0], d[1], d[2]); if (l < 1e-6) { d = [0, 0, 0]; d[k] = sg; } else d = [d[0] / l, d[1] / l, d[2] / l];
            const p = b > 1e-4 ? [inr[0] + d[0] * b, inr[1] + d[1] * b, inr[2] + d[2] * b] : q, e = 1 - Math.abs(d[k]);
            vtx([p[0] + c[0], p[1] + c[1], p[2] + c[2]], d, mf ? mf(p, d) : m, Math.min(1, e * 2.2)); }
          const nu = U.length; for (let j = 0; j < Vv.length - 1; j++) for (let i = 0; i < nu - 1; i++) { const a = base + j * nu + i; if (sg > 0) quad(a, a + 1, a + nu + 1, a + nu); else quad(a, a + nu, a + nu + 1, a + 1); } }
        return B; },
      /* an ellipsoid (radii r) or a part of one: polar angle from th0 to th1 (0 = +z pole); seg round, rings down */
      ell(c, r, m, o) { o = o || {}; const seg = sq(o.seg || 16, 6), rings = sq(o.rings || 10, 1), t0 = o.th0 || 0, t1 = o.th1 == null ? Math.PI : o.th1, base = P.length / 3, ph0 = o.ph0 || 0, ph1 = o.ph1 == null ? Math.PI * 2 : o.ph1;
        for (let j = 0; j <= rings; j++) { const th = t0 + (t1 - t0) * j / rings, st = Math.sin(th), ct = Math.cos(th);
          for (let i = 0; i <= seg; i++) { const ph = ph0 + (ph1 - ph0) * i / seg, x = st * Math.cos(ph), y = st * Math.sin(ph), z = ct;
            const e = o.rim && j === rings ? 1 : o.rim && j === rings - 1 ? 0.5 : 0;
            vtx([c[0] + r[0] * x, c[1] + r[1] * y, c[2] + r[2] * z], [x / r[0], y / r[1], z / r[2]], o.mf ? o.mf(x, y, z, j / rings) : m, e); } }
        for (let j = 0; j < rings; j++) for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i; quad(a, a + seg + 1, a + seg + 2, a + 1); }
        if (o.cap && t1 < Math.PI - 1e-3) { const zc = Math.cos(t1), rr = Math.sin(t1), cb = vtx([c[0], c[1], c[2] + r[2] * zc], [0, 0, -1], o.capM == null ? m : o.capM, 0), b2 = P.length / 3;
          for (let i = 0; i <= seg; i++) { const ph = ph0 + (ph1 - ph0) * i / seg; vtx([c[0] + r[0] * rr * Math.cos(ph), c[1] + r[1] * rr * Math.sin(ph), c[2] + r[2] * zc], [0, 0, -1], o.capM == null ? m : o.capM, 0.6); }
          for (let i = 0; i < seg; i++) I.push(cb, b2 + i + 1, b2 + i); }
        return B; },
      /* a flat-shaded polygon (a facet): its own vertices, one normal; the edge weight runs from 0 at its centre to 1 at
         its rim (for bright, frosted facet edges) */
      facet(pts, m) { const n = pts.length; let cx = 0, cy = 0, cz = 0; for (const q of pts) { cx += q[0]; cy += q[1]; cz += q[2]; } cx /= n; cy /= n; cz /= n;
        let nx = 0, ny = 0, nz = 0; for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; nx += (a[1] - b[1]) * (a[2] + b[2]); ny += (a[2] - b[2]) * (a[0] + b[0]); nz += (a[0] - b[0]) * (a[1] + b[1]); }
        const nn = [nx, ny, nz], c0 = vtx([cx, cy, cz], nn, m, 0), b0 = P.length / 3; for (const q of pts) vtx(q, nn, m, 1); for (let i = 0; i < n; i++) I.push(c0, b0 + i, b0 + (i + 1) % n); return B; },
      /* a crystal shard from base a to a sharp tip b: n flat sides (hard facets), widest (r) at `belly` of its length,
         flattened to a blade by `thin` across the frame's z (up hint `up`), its tip bent sideways by `bend` */
      crystal(a, b, r, m, o) { o = o || {}; const n = o.n || 5, d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6, th = o.thin == null ? 1 : o.thin, bl = o.belly == null ? 0.3 : o.belly, sd = o.seed || 0, bend = o.bend || 0, r0 = o.base == null ? 0.6 : o.base;
        const jk = o.jit == null ? 0.22 : o.jit, jit = i => 1 + jk * Math.sin(i * 2.7 + sd * 5.3), rot = o.rot == null ? sd * 1.3 : o.rot;
        B.along(a, d, o.up); const ring = (x, rr, yo) => { const R2 = []; for (let i = 0; i < n; i++) { const ph = rot + i / n * Math.PI * 2; R2.push([x, yo + rr * jit(i) * Math.cos(ph), rr * jit(i) * Math.sin(ph) * th]); } return R2; };
        const A0 = ring(0, r * r0, 0), A1 = ring(L * bl, r, bend * L * bl * bl), tip = [L, bend * L, 0];
        // (each facet's vertices carry the place along the shard, base to tip, through AUX: set per vertex by z order here)
        const fac = (pts, ts) => { const n2 = pts.length; let cx = 0, cy = 0, cz = 0, ct = 0; for (let i = 0; i < n2; i++) { cx += pts[i][0]; cy += pts[i][1]; cz += pts[i][2]; ct += ts[i]; } cx /= n2; cy /= n2; cz /= n2; ct /= n2;
          let nx = 0, ny = 0, nz = 0; for (let i = 0; i < n2; i++) { const a2 = pts[i], b2 = pts[(i + 1) % n2]; nx += (a2[1] - b2[1]) * (a2[2] + b2[2]); ny += (a2[2] - b2[2]) * (a2[0] + b2[0]); nz += (a2[0] - b2[0]) * (a2[1] + b2[1]); }
          const nn = [nx, ny, nz]; AUX = 1 - ct; const c0 = vtx([cx, cy, cz], nn, m, 0), b0 = P.length / 3; for (let i = 0; i < n2; i++) { AUX = 1 - ts[i]; vtx(pts[i], nn, m, 1); } for (let i = 0; i < n2; i++) I.push(c0, b0 + i, b0 + (i + 1) % n2); AUX = 1; };
        for (let i = 0; i < n; i++) { const j = (i + 1) % n; fac([A0[i], A0[j], A1[j], A1[i]], [0, 0, bl, bl]); fac([A1[i], A1[j], tip], [bl, bl, 1]); }
        if (o.cap !== false) fac(A0.slice().reverse(), A0.map(() => 0));
        return B.pop(); },
      /* a spike: a faceted, bevelled cone from base a to a sharp tip b (base radius r); its ridges carry edge wear */
      spike(a, b, r, m, o) { o = o || {}; return B.tube(a, b, r, 0.0015, m, { seg: o.seg || 6, cap0: 'flat', cap1: false, edge: 0.7, up: o.up }); },
      sph(c, r, m, seg) { return B.ell(c, [r, r, r], m, { seg: seg || 10, rings: Math.max(4, (seg || 10) >> 1) }); },
      /* a tube from a to b (radii r1, r2), its ends capped: 'round' (a hemisphere), 'flat' or none */
      tube(a, b, r1, r2, m, o) { o = o || {}; const seg = sq(o.seg || 12, 5), d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1e-6;
        B.along(a, d, o.up); const base = P.length / 3, sl = (r1 - r2) / L, nl = 1 / Math.hypot(1, sl), rs = o.rings || 1;
        for (let j = 0; j <= rs; j++) { const u = j / rs, x = L * u, r = r1 + (r2 - r1) * u; for (let i = 0; i <= seg; i++) { const ph = i / seg * Math.PI * 2, cy = Math.cos(ph), sz = Math.sin(ph); vtx([x, r * cy, r * sz], [sl * nl, cy * nl, sz * nl], o.mf ? o.mf(u, ph) : m, o.edge || 0); } }
        for (let j = 0; j < rs; j++) for (let i = 0; i < seg; i++) { const q = base + j * (seg + 1) + i; quad(q, q + 1, q + seg + 2, q + seg + 1); }
        const capE = (x, r, sg, kind) => { if (!kind || r < 1e-4) return; if (kind === 'round') { const b0 = P.length / 3, rr = 3; for (let j = 0; j <= rr; j++) { const t = j / rr * Math.PI / 2, cx = Math.cos(t), sx = Math.sin(t); for (let i = 0; i <= seg; i++) { const ph = i / seg * Math.PI * 2; vtx([x + sg * r * sx, r * cx * Math.cos(ph), r * cx * Math.sin(ph)], [sg * sx, cx * Math.cos(ph), cx * Math.sin(ph)], m, 0); } }
            for (let j = 0; j < rr; j++) for (let i = 0; i < seg; i++) { const q = b0 + j * (seg + 1) + i; if (sg > 0) quad(q, q + 1, q + seg + 2, q + seg + 1); else quad(q, q + seg + 1, q + seg + 2, q + 1); } }
          else { const cc = vtx([x, 0, 0], [sg, 0, 0], o.capM == null ? m : o.capM, 0), b0 = P.length / 3; for (let i = 0; i <= seg; i++) { const ph = i / seg * Math.PI * 2; vtx([x, r * Math.cos(ph), r * Math.sin(ph)], [sg, 0, 0], o.capM == null ? m : o.capM, 0.8); } for (let i = 0; i < seg; i++) { if (sg > 0) I.push(cc, b0 + i, b0 + i + 1); else I.push(cc, b0 + i + 1, b0 + i); } } };
        capE(0, r1, -1, o.cap0 == null ? 'round' : o.cap0); capE(L, r2, 1, o.cap1 == null ? 'round' : o.cap1);
        return B.pop(); },
      /* a torus round the z axis of the frame (centre c, ring radius R, tube radius r) */
      tor(c, R, r, m, o) { o = o || {}; const seg = o.teeth ? o.seg || 24 : sq(o.seg || 24, 6), rs = sq(o.rseg || 8, 4), base = P.length / 3, ph0 = o.ph0 || 0, ph1 = o.ph1 == null ? Math.PI * 2 : o.ph1;
        for (let j = 0; j <= seg; j++) { const ph = ph0 + (ph1 - ph0) * j / seg, cp = Math.cos(ph), sp = Math.sin(ph), rr = R + (o.teeth && (Math.floor(j * o.teeth / seg) & 1) ? o.tooth : 0);
          for (let i = 0; i <= rs; i++) { const t = i / rs * Math.PI * 2, ct = Math.cos(t), st = Math.sin(t); vtx([c[0] + (rr + r * ct) * cp, c[1] + (rr + r * ct) * sp, c[2] + r * st], [ct * cp, ct * sp, st], m, 0.25 + 0.5 * Math.max(0, ct)); } }
        for (let j = 0; j < seg; j++) for (let i = 0; i < rs; i++) { const a = base + j * (rs + 1) + i; quad(a, a + rs + 1, a + rs + 2, a + 1); }
        return B; },
      torX(c, R, r, m, o) { B.push([0, 1, 0], [0, 0, 1], [1, 0, 0], c); B.tor([0, 0, 0], R, r, m, o); return B.pop(); },
      torY(c, R, r, m, o) { B.push([0, 0, 1], [1, 0, 0], [0, 1, 0], c); B.tor([0, 0, 0], R, r, m, o); return B.pop(); },
      torZ(c, R, r, m, o) { return B.tor(c, R, r, m, o); },
      /* a lathe round the frame's x axis: profile [[x, r, material], ...] (an open polyline; a material change is made
         by repeating a point with the new material, so no triangle mixes two materials) */
      lathe(prof, m, o) { o = o || {}; const seg = sq(o.seg || 20, 6), base = P.length / 3, n = prof.length, mt = j => prof[j][2] == null ? m : prof[j][2];
        const same = (a, b) => Math.abs(prof[a][0] - prof[b][0]) + Math.abs(prof[a][1] - prof[b][1]) < 1e-7;
        for (let j = 0; j < n; j++) { let ja = j - 1, jb = j + 1; while (ja >= 0 && same(ja, j)) ja--; while (jb < n && same(jb, j)) jb++;
          if (ja >= 0 && mt(ja) !== mt(j) && jb < n) ja = j; if (jb < n && mt(jb) !== mt(j) && ja >= 0 && ja !== j) jb = j;
          const pa = prof[Math.max(0, ja)], pb = prof[Math.min(n - 1, jb)], dx = pb[0] - pa[0], dr = pb[1] - pa[1], l = Math.hypot(dx, dr) || 1, nx = -dr / l, nr = dx / l;
          for (let i = 0; i <= seg; i++) { const ph = i / seg * Math.PI * 2, cy = Math.cos(ph), sz = Math.sin(ph); vtx([prof[j][0], prof[j][1] * cy, prof[j][1] * sz], [nx, nr * cy, nr * sz], mt(j), o.edge ? o.edge(j) : 0); } }
        for (let j = 0; j < n - 1; j++) { if (same(j, j + 1)) continue; for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i; quad(a, a + 1, a + seg + 2, a + seg + 1); } }
        return B; },
      /* a parametric surface: pos(u, v) for u, v in [0, 1] (nu x nv cells), m(u, v), e(u, v); normals from the grid */
      surf(pos, nu, nv, m, o) { o = o || {}; const base = P.length / 3, G = [];
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) G.push(pos(i / nu, j / nv));
        const at = (i, j) => G[Math.max(0, Math.min(nv, j)) * (nu + 1) + Math.max(0, Math.min(nu, i))];
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const a = at(i + 1, j), b = at(i - 1, j), c2 = at(i, j + 1), d = at(i, j - 1), du = [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dv = [c2[0] - d[0], c2[1] - d[1], c2[2] - d[2]];
          let n = [du[1] * dv[2] - du[2] * dv[1], du[2] * dv[0] - du[0] * dv[2], du[0] * dv[1] - du[1] * dv[0]]; if (o.flip) n = [-n[0], -n[1], -n[2]];
          const ax0 = AUX; if (o.a) AUX = o.a(i / nu, j / nv); vtx(at(i, j), n, m(i / nu, j / nv), o.e ? o.e(i / nu, j / nv) : 0); AUX = ax0; }   // (o.e: the second attribute; o.a: the third, else the current AUX)
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = base + j * (nu + 1) + i; if (o.flip) quad(a, a + nu + 1, a + nu + 2, a + 1); else quad(a, a + 1, a + nu + 2, a + nu + 1); }
        return B; },
      /* an outline (2D points in the frame's x-y plane, star-shaped about its centroid) extruded along z from z0 to z1;
         the faces bevelled by b (the face inset, the sides chamfered) */
      prism(pts, z0, z1, m, o) { o = o || {}; const n = pts.length, b = o.b || 0, cx = pts.reduce((s, p) => s + p[0], 0) / n, cy = pts.reduce((s, p) => s + p[1], 0) / n;
        const ins = (p, k) => { const dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] - dx / l * k, p[1] - dy / l * k]; };
        const face = (z, sg, mm) => { const c0 = vtx([cx, cy, z], [0, 0, sg], mm, 0), b0 = P.length / 3; for (let i = 0; i < n; i++) { const q = ins(pts[i], b); vtx([q[0], q[1], z], [0, 0, sg], o.mf ? o.mf(q[0], q[1], z) : mm, 0); } for (let i = 0; i < n; i++) { const a = b0 + i, c2 = b0 + (i + 1) % n; if (sg > 0) I.push(c0, a, c2); else I.push(c0, c2, a); } return b0; };
        const zz0 = z0 + (b ? b : 0), zz1 = z1 - (b ? b : 0);
        const f1 = face(z1, 1, m), f0 = o.back === false ? -1 : face(z0, -1, o.backM == null ? m : o.backM);
        const ring = (z, k, nz) => { const r0 = P.length / 3; for (let i = 0; i < n; i++) { const p = ins(pts[i], k), pp = pts[(i + n - 1) % n], pn = pts[(i + 1) % n]; let tx = pn[0] - pp[0], ty = pn[1] - pp[1]; const l = Math.hypot(tx, ty) || 1; const nx = ty / l, ny = -tx / l; const sgn = ((p[0] - cx) * nx + (p[1] - cy) * ny) < 0 ? -1 : 1; vtx([p[0], p[1], z], [nx * sgn, ny * sgn, nz], o.sideM == null ? m : o.sideM, 1); } return r0; };
        const rings = b ? [ring(z1, b, 0.7), ring(zz1, 0, 0), ring(zz0, 0, 0), ring(z0, b, -0.7)] : [ring(z1, 0, 0), ring(z0, 0, 0)];
        for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < n; i++) { const a = rings[r] + i, c2 = rings[r] + (i + 1) % n, d = rings[r + 1] + (i + 1) % n, e = rings[r + 1] + i; quad(a, e, d, c2); }
        if (b) { for (let i = 0; i < n; i++) { const a = f1 + i, c2 = f1 + (i + 1) % n; quad(a, c2, rings[0] + (i + 1) % n, rings[0] + i); } if (f0 >= 0) for (let i = 0; i < n; i++) { const a = f0 + i, c2 = f0 + (i + 1) % n; quad(a, rings[3] + i, rings[3] + (i + 1) % n, c2); } }
        return B; },
      /* the finished mesh (typed arrays) */
      done() { const nv = P.length / 3; return { pos: new Float32Array(P), nrm: new Float32Array(N), att: new Float32Array(A), idx: nv > 65535 ? new Uint32Array(I) : new Uint16Array(I), nv, ntri: I.length / 3, gl: null }; },
      get nv() { return P.length / 3; },
    };
    return B;
  }

  /* ================= the renderer ================= */
  let lostT = 0, gl = null, cv = null, prog = null, failed = false, lost = false, isGL2 = false, soft = false, U = {}, AT = {}, gen = 0, ext32 = null;
  const VS = `
attribute vec3 aP; attribute vec3 aN; attribute vec3 aA;
uniform vec3 uR0, uR1, uR2, uT, uPX, uPY, uPD, uOutV; uniform vec4 uCl;
varying vec3 vW, vN, vL, vNL, vA;
void main() {
  vec3 w = uR0 * aP.x + uR1 * aP.y + uR2 * aP.z + uT;
  vW = w; vN = uR0 * aN.x + uR1 * aN.y + uR2 * aN.z; vL = aP; vNL = aN; vA = aA;
  vec4 p = vec4(dot(w, uPX) * uCl.x + uCl.y, dot(w, uPY) * uCl.z + uCl.w, 0.5 - dot(w, uPD) * 0.06, 1.0);
  if (uOutV.z > 0.0) { vec2 d = vec2(dot(vN, uPX), dot(vN, uPY)); float l = length(d); if (l > 1e-5) p.xy += d / l * vec2(uOutV.x, -uOutV.y); p.z += uOutV.z; }   // (the outline pass: the hull pushed out a fixed number of pixels along the normal as seen, and back in depth)
  gl_Position = p;
}`;
  const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vW, vN, vL, vNL, vA;
uniform vec3 uV, uLK, uLS, uLR, uUP;
uniform float uGlow, uAlpha, uKind, uLow, uWear, uFx, uGlow2, uSpill, uTime; uniform vec4 uOutF; uniform vec3 uClip;
uniform vec3 uRim, uAmb; uniform vec3 uM0, uM1, uM2; uniform vec4 uOcc[12]; uniform float uNOcc;   // (uOcc: analytic occluders, spheres posed with the model: occlusion and soft key-light shadows between its parts)   // (uM*: the part's axes, for normal detail made in its own frame)
float hs(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = p - i; vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), u.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), u.x), u.y); }
float hrt(vec2 p) { p = vec2(p.x * 1.05, p.y * 1.05 + 0.1); float a = dot(p, p) - 1.0; return a * a * a - p.x * p.x * p.y * p.y * p.y; }   // (the heart curve, y up: < 0 inside)
float occAO(vec3 p, vec3 nr) { float o = 1.0; for (int i = 0; i < 12; i++) { if (float(i) >= uNOcc) break; vec4 s = uOcc[i]; vec3 d = s.xyz - p; float l = length(d); if (l < s.w * 1.02) continue; float h = l / s.w; o *= 1.0 - clamp(max(0.0, dot(nr, d / l)) / (h * h), 0.0, 0.9); } return o; }
float occSH(vec3 p, vec3 rd) { float sh = 1.0; for (int i = 0; i < 12; i++) { if (float(i) >= uNOcc) break; vec4 s = uOcc[i]; vec3 oc = p - s.xyz; float b = dot(oc, rd), c = dot(oc, oc) - s.w * s.w; if (c < 0.0) continue; float h = b * b - c, d = sqrt(max(0.0, s.w * s.w - h)) - s.w, t = -b - sqrt(max(h, 0.0)); if (t > 0.0) sh = min(sh, smoothstep(0.0, 1.0, 2.5 * 4.0 * d / t)); } return sh; }
float tone5(float v) { v = max(0.0, v); return v * (1.0 + v / 5.5) / (1.0 + v); }   // (the Beast's 2D tone curve)
float tone(float v) { v = max(0.0, v); return v * (1.0 + v / 6.0) / (1.0 + v); }
float env(vec3 r, float rough, out float ec) {
  float up = dot(r, uUP);
  float e = up >= 0.0 ? 0.18 + 0.48 * pow(up, 1.2) : 0.13 + 0.06 * (1.0 + up);
  float hz = (up - 0.1) / (0.035 + rough * 0.3); e += 0.55 * exp(-hz * hz) / (1.0 + rough * 2.0);
  float w = 0.05 + rough * 0.32, sb = dot(r, uLS); e += 3.3 * smoothstep(1.0 - 2.6 * w, 1.0 - 0.25 * w, sb) / (1.0 + rough * 2.5);
  float rr = dot(r, uLR); ec = smoothstep(0.62 - w * 1.5, 0.97 - w * 0.5, rr) / (1.0 + rough * 2.0);
  return e;
}
// cel shading (ids 30..35): three designed bands (shadow, midtone, light) with soft joins, and a little gradient inside
// each so a curved surface keeps its volume; lit returns 0 shadow .. 0.5 midtone .. 1 light
vec3 cel3(vec3 sh, vec3 md, vec3 li, vec3 n, out float lit) {
  float hm = 0.5 + 0.5 * dot(n, uUP), x = dot(n, uLK) * 0.8 + (hm - 0.5) * 0.3, b = 0.5 * smoothstep(0.02, 0.09, x) + 0.5 * smoothstep(0.5, 0.57, x); lit = b;   // (a clear shadow band, a crisp light band)
  vec3 c = b < 0.5 ? mix(sh, md, b * 2.0) : mix(md, li, b * 2.0 - 1.0); return c * (0.84 + 0.24 * hm + 0.12 * clamp(x, -1.0, 1.0)) * uAmb; }
float celSpec(vec3 n, float tight) { vec3 hh = normalize(uLK + uV); return smoothstep(tight, tight + 0.012, dot(n, hh)); }
vec3 celRim(vec3 n) { float ndv = max(0.0, dot(n, uV)); return smoothstep(0.62, 0.72, 1.0 - ndv) * max(0.0, dot(n, uLR) + 0.3) * uRim * 0.22; }
// soft plant tissue (petals, leaves, tentacles): wrapped key light, sky/ground ambient, light coming through from behind
// (trans), a broad or tight highlight (gloss, glossK), the rim light
vec3 petalLit(vec3 alb, vec3 n, vec3 trans, float gloss, float glossK) {
  float ndl = dot(n, uLK), wrap = max(0.0, (ndl + 0.45) / 1.45), ndv = max(0.0, dot(n, uV)), hm = 0.5 + 0.5 * dot(n, uUP);
  vec3 amb = mix(vec3(0.22, 0.16, 0.26), vec3(0.66, 0.64, 0.8), hm) * uAmb;
  float back = max(0.0, -ndl) * (0.45 + 0.55 * pow(max(0.0, dot(uV, -uLK)), 2.0));
  vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh));
  vec3 c = alb * (wrap * vec3(1.5, 1.42, 1.36) + amb) + trans * (back * 0.95 + 0.1 * (1.0 - wrap));
  c += pow(nh, gloss) * glossK * max(0.0, ndl + 0.2) * vec3(1.0, 0.98, 0.95);
  c += pow(1.0 - ndv, 3.0) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.35;
  return c; }
// (uFx: a frost that cracks across every surface - a summon freezing over as it leaves)
vec3 frostFx(vec3 c, vec3 L) { if (uFx <= 0.0) return c; float w = vn(L.xy * 5.0 + L.z * 3.0), c1 = abs(fract(dot(L, vec3(4.3, 2.9, 3.7)) + w * 1.8) - 0.5), c2 = abs(fract(dot(L, vec3(-3.1, 5.2, 2.2)) + w * 1.4) - 0.5);
  float k = smoothstep(0.5 * uFx, 0.0, min(c1, c2)) * min(1.0, uFx * 2.0); return mix(c, vec3(0.82, 0.93, 1.05) * (0.7 + 0.5 * w), min(1.0, k + uFx * uFx * 0.6)); }
/*<LB-FN v474 LB: the Library bosses' patterns (LB-LIB-MAT, 20zea/20zfa/20zga): fbm; cells (the nearest two distances: leather's pebbled grain); a segment's distance; a cover's gilt tooling (st across the cover 0..1; k 0 a volume: the fillet frame, a dotted band, studs, the lozenge; k 2 the head: the eye sigil)>*/
float lbF(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
vec2 lbC(vec2 p) { vec2 i = floor(p), f = p - i; float d1 = 8.0, d2 = 8.0; for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)), o = vec2(hs(i + g), hs(i + g + 17.3)); float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; } return vec2(d1, d2); }
float lbSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
float lbTool(vec2 st, float k) { vec2 c = abs(st - 0.5); float bx = max(c.x, c.y), m = smoothstep(0.016, 0.007, abs(bx - 0.4)); m = max(m, smoothstep(0.008, 0.003, abs(bx - 0.335)));
  float al = c.x > c.y ? st.y : st.x; m = max(m, smoothstep(0.35, 0.22, length(vec2(fract(al * 22.0) - 0.5, (bx - 0.368) * 22.0))) * step(abs(bx - 0.368), 0.03));
  m = max(m, smoothstep(0.04, 0.028, length(c - vec2(0.4))));
  if (k < 1.0) { float dia = (c.x + c.y) / 0.25; m = max(m, smoothstep(0.08, 0.035, abs(dia - 1.0))); m = max(m, smoothstep(0.06, 0.045, length(c))); m = max(m, smoothstep(0.07, 0.03, abs((c.x + c.y) / 0.14 - 1.0)) * 0.85);
    for (int i = 0; i < 2; i++) { vec2 dd = i == 0 ? vec2(0.21, 0.0) : vec2(0.0, 0.21); m = max(m, smoothstep(0.03, 0.018, length(c - dd) - 0.01)); } }
  else { vec2 e = (st - vec2(0.55, 0.5)) / vec2(0.27, 0.15); m = max(m, smoothstep(0.16, 0.06, abs(length(e) - 1.0))); float pr = length((st - vec2(0.56, 0.5)) * vec2(1.0, 0.75)); m = max(m, smoothstep(0.075, 0.06, pr)); m = max(m, smoothstep(0.012, 0.0, abs(pr - 0.1) - 0.006) * 0.8); }
  return m; }
float lbScr(vec2 p) { float d = 9.0; for (int k = 0; k < 2; k++) { vec2 q = vec2(p.x, k == 0 ? p.y : -p.y);   /* (v474b LB: Vellum's shoulder scrollwork, both sides: its distance, sampled thrice for the raised gilt's slope) */
    d = min(d, lbSeg(q, vec2(1.05, 1.55), vec2(0.55, 1.5))); d = min(d, lbSeg(q, vec2(0.55, 1.5), vec2(-0.2, 1.22))); d = min(d, lbSeg(q, vec2(-0.2, 1.22), vec2(-0.9, 0.82))); d = min(d, lbSeg(q, vec2(-0.9, 0.82), vec2(-1.45, 0.42)));
    vec2 c0 = q - vec2(0.82, 1.18); float ang = atan(c0.y, c0.x) / 6.28318 + 0.5, rs = 0.28 - ang * 0.16; d = min(d, abs(length(c0) - rs) + step(0.88, ang) * 9.0); } return d; }
/*</LB-FN>*/
/*<MD-FN v450 MD: Moby Dick's skin (20k7q): a gaussian; its inner stars, a drifting field of star points in surface cells with the constellation lines joining neighbours (x the stars, y the lines, z the cell's hash)>*/
float mdG(float x) { return exp(-x * x); }
float mdSL(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)); }
vec2 mdSP(vec2 ci) { return vec2(0.2) + 0.6 * vec2(hs(ci + 1.3), hs(ci + 2.7)); }
float mdOn(vec2 ci) { return step(0.52, hs(ci)); }
vec3 mdStars(vec2 g, float t) { vec2 ci = floor(g), f = g - ci, sp = mdSP(ci); float on = mdOn(ci), b = hs(ci + 5.1), ln = 0.0, d2 = dot(f - sp, f - sp);
  float st = on * (exp(-d2 * (110.0 + 240.0 * b)) + 0.14 * exp(-d2 * 16.0)) * (0.72 + 0.28 * sin(t * (1.3 + 2.0 * b) + b * 40.0)) * (0.6 + b);
  vec2 cR = ci + vec2(1.0, 0.0), cU = ci + vec2(0.0, 1.0), cL = ci - vec2(1.0, 0.0), cD = ci - vec2(0.0, 1.0);
  if (on > 0.5) {
    if (mdOn(cR) > 0.5 && hs(ci + 9.1) > 0.55) ln = max(ln, mdG(mdSL(f, sp, vec2(1.0, 0.0) + mdSP(cR)) / 0.035));
    if (mdOn(cU) > 0.5 && hs(ci + 4.4) > 0.62) ln = max(ln, mdG(mdSL(f, sp, vec2(0.0, 1.0) + mdSP(cU)) / 0.035));
    if (mdOn(cL) > 0.5 && hs(cL + 9.1) > 0.55) ln = max(ln, mdG(mdSL(f, vec2(-1.0, 0.0) + mdSP(cL), sp) / 0.035));
    if (mdOn(cD) > 0.5 && hs(cD + 4.4) > 0.62) ln = max(ln, mdG(mdSL(f, vec2(0.0, -1.0) + mdSP(cD), sp) / 0.035)); }
  return vec3(st, ln, b); }
/*</MD-FN>*/
void main() {
  if (uClip.x > 0.5) { if (vW.z < uClip.y) discard; if (vW.z < uClip.y + uClip.z) { float wl = 1.0 - (vW.z - uClip.y) / uClip.z; gl_FragColor = vec4(mix(vec3(0.35, 0.9, 1.0), vec3(1.0), wl * wl) * uAlpha, uAlpha); return; } }   // (S.clip: nothing below a level; a bright waterline band just above the cut)
  if (uOutF.a > 0.0) { gl_FragColor = vec4(uOutF.rgb * uAlpha, uAlpha); return; }
  int id = int(vA.x + 0.5); float edge = vA.y, ao = vA.z;
  vec3 n = normalize(vN); if (dot(n, uV) < -0.02) n = -n;   // (a surface seen from inside, a thin shell: face the viewer)
  vec3 L = vL, NL = normalize(vNL);
  /*<GB-MAT 980..999 (v475 GM: 02f8 Gabriel; ids in its api)>*/
  if(id>=980&&id<=999){
    float gF=vA.x-float(id),gG=clamp(uGlow,0.0,4.0),gG2=clamp(uGlow2,0.0,4.0),gT=uTime,gDE=0.0;
    if(uSpill>0.0){float dn=vn(L.xy*9.0+L.z*5.3)*0.55+vn(L.yz*21.0+L.x*7.0)*0.3+vn(L.xz*43.0+3.0)*0.15,th=uSpill*1.15-0.08;if(dn<th)discard;gDE=smoothstep(th+0.08,th,dn);}
    float gNV=max(0.001,dot(n,uV)),gNL=dot(n,uLK),gFr=pow(1.0-gNV,5.0),gHm=0.5+0.5*dot(n,uUP);
    float gOc=uNOcc>0.5?occAO(vW,n):1.0,gSh=uNOcc>0.5&&uLow<0.5?occSH(vW,uLK):1.0,gDif=max(gNL,0.0)*gSh;
    vec3 gR=2.0*gNV*n-uV;float gUp=dot(gR,uUP),gSb=max(dot(gR,uLK),0.0)*gSh,gHz=gUp-0.06;
    vec3 gEv=(gUp>0.0?mix(vec3(0.5,0.42,0.47),vec3(1.05,0.98,1.02),pow(clamp(gUp,0.0,1.0),1.2)):mix(vec3(0.4,0.18,0.28),vec3(0.2,0.12,0.16),clamp(-gUp*2.5,0.0,1.0)))+vec3(1.0,0.45,0.7)*exp(-gHz*gHz/0.005)*0.45;
    vec3 gKEY=vec3(1.5,1.42,1.4),gAmb=mix(vec3(0.17,0.13,0.16),vec3(0.46,0.42,0.46),gHm)*gOc,gRim=pow(1.0-gNV,2.4)*max(0.0,dot(n,uLR)+0.35)*vec3(1.3,0.75,1.0);
    vec3 PK=vec3(1.25,0.32,0.72),PH=vec3(1.7,0.85,1.25),MG=vec3(1.1,0.12,0.55),WH=vec3(1.7,1.55,1.6),gC=vec3(0.0);
    if(uFx>0.75){float fr=pow(1.0-gNV,2.0),lw=0.4+0.6*pow(clamp(gNL*0.5+0.5,0.0,1.0),1.3),cir=(id==984||id==985||id==983)?1.0:0.0,eg=smoothstep(0.82,1.0,edge),fl=vn(vec2(L.x*1.3+L.y*0.9,L.z*1.6-gT*0.9)),fth=id==986?1.0:0.0;
    vec3 c=mix(vec3(1.0,0.94,0.97),WH,0.6)*lw*(0.95+0.45*fl)+mix(PK,MG,0.4)*fr*0.9+PH*eg*0.5+PK*cir*0.9+PH*fth*smoothstep(0.7,1.0,clamp(ao,0.0,1.0))*0.5+vec3(1.0)*pow(gSb,60.0)*0.8+PK*gDE*2.0;
    c=vec3(tone(c.r),tone(c.g),tone(c.b));float a=clamp(0.42+0.4*fr+0.2*fl+eg*0.2+cir*0.3,0.0,0.94);gl_FragColor=vec4(c*a*uAlpha,a*uAlpha);return;}
    vec3 g0=id==981&&gF>0.15&&gF<0.25?vec3(1.0,0.68,0.58):vec3(1.0,0.8,0.45),gF0=g0+(1.0-g0)*gFr;
    vec3 gGold=(g0*(0.3+0.62*gDif)*gKEY*0.62+gF0*mix(gEv,vec3(dot(gEv,vec3(0.33)))*vec3(1.0,0.8,0.6),0.4)*1.6*gOc+vec3(1.0,0.92,0.8)*(pow(gSb,70.0)*2.4+pow(gSb,9.0)*0.28)+gRim*0.35)*1.3;
    if(id==980){float und=step(0.15,gF)*step(gF,0.25),eng=step(0.25,gF),gr=vn(L.xy*14.0+L.z*6.0)*0.05;
    vec3 alb=vec3(0.97,0.94,0.95)*(und>0.5?0.85:1.0)*mix(vec3(1.0,0.93,0.97),vec3(0.94,0.97,1.02),0.5+0.5*sin(gNV*6.0+L.z*2.0));
    vec3 c=alb*((0.12+0.72*gDif)*gKEY*(1.0-gr)+gAmb*1.5+0.05*gOc)+gEv*(0.06+0.7*gFr)*gOc+vec3(1.0,0.96,0.98)*(pow(gSb,80.0)*1.6+pow(gSb,10.0)*0.3)+mix(vec3(1.0,0.75,0.9),vec3(0.8,0.9,1.0),gNV)*pow(1.0-gNV,2.0)*0.25+gRim*0.35;
    if(eng>0.5&&uLow<0.5){vec2 q=vec2(L.x*2.8+L.y*2.2,L.z*2.8+L.y*0.6),cq=fract(q)-0.5;float hl=smoothstep(0.08,0.0,abs(hrt(cq*3.4+vec2(0.0,0.2))))*step(0.55,hs(floor(q))),w1=vn(q*1.3),s1=abs(fract(q.x+0.35*sin(q.y*3.1+w1*2.0))-0.5),fil=max(smoothstep(0.03,0.01,s1)*step(0.4,w1),hl);
    c=mix(c,gGold*0.9,fil*0.85);c+=PK*fil*gG2*0.4;}
    gC=mix(c*1.85,gGold,smoothstep(0.8,0.95,edge)*(1.0-und));}
    if(id==981){float ln=(1.0-uLow)*step(0.25,gF)*smoothstep(0.06,0.02,abs(fract(L.x*6.0+L.z*4.0+0.5*sin(L.y*8.0))-0.5));gC=gGold*(1.0-ln*0.5)+PK*ln*(0.1+0.4*gG2)+PK*gG*0.08;}
    if(id==982){float rib=step(0.15,gF)*step(gF,0.25),rec=step(0.25,gF),br=vn(vec2(L.x*40.0+L.y*40.0,L.z*2.0)),rg=0.24+0.08*br;
    vec3 T0=vec3(0.74,0.72,0.76)*(0.85+0.2*br),TF=T0+(1.0-T0)*gFr,c=T0*(0.1+0.6*gDif)*gKEY*0.45*gOc+TF*gEv*1.1*gOc+vec3(1.0,0.97,1.0)*pow(gSb,2.0/(rg*rg))*0.9+gRim*0.4;
    if(rib>0.5&&uLow<0.5){float rb=abs(fract(L.z*9.0+L.x*2.0)-0.5);c*=0.7+0.45*smoothstep(0.1,0.3,rb);c+=PK*smoothstep(0.07,0.0,rb)*(0.05+0.4*gG2);}
    if(rec>0.5){float fl=vn(vec2(L.z*1.5-gT*0.8,atan(L.y,L.x)*2.0));c=c*0.25+mix(MG*0.5,PK,fl)*(0.45+0.3*gG+0.5*gG2)*(0.8+0.25*sin(gT*2.0+L.z*3.0));}
    gC=c;}
    if(id==983){float nuc=step(0.15,gF)*step(gF,0.25),shl=step(0.25,gF);vec3 rf=refract(-uV,n,0.68),p1=L*0.9+rf*0.5;
    float w1=vn(p1.xy*2.5+p1.z*1.7+vec2(0.0,-gT*0.15)),w2=vn(L.yz*6.0+L.x*4.0),crk=smoothstep(0.03,0.0,abs(fract(dot(L,vec3(2.1,1.3,1.7))+w1*1.3)-0.5))*smoothstep(0.3,0.6,w2),dep=clamp(0.3+0.7*gNV,0.0,1.0),ec,ev=env(gR,0.04,ec);
    vec3 c=mix(vec3(1.0,0.5,0.7),vec3(0.58,0.1,0.3),dep*0.75)*(0.7+0.4*w1)*(0.6+0.5*max(0.0,gNL*0.5+0.5))+(ev*(0.04+0.9*pow(1.0-gNV,4.0))+pow(max(0.0,dot(n,normalize(uLK+uV))),220.0)*10.0*max(0.0,gNL))*vec3(1.05,0.95,1.0);
    c+=PK*(0.28+0.3*gG)+PK*pow(1.0-gNV,2.5)*0.5+PH*crk*(0.35+gG)+PK*smoothstep(0.82,1.0,edge)*(0.3+0.25*gG)+PK*(0.12+0.3*gG)*(0.5+0.5*w2)*(1.0-dep*0.5);
    if(nuc>0.5)c=c*1.1+mix(PK,WH,0.35+0.3*gG2)*(0.35+0.25*sin(gT*2.4)+0.4*gG2)*(1.0-0.5*dep)+PH*0.15*gG;
    if(shl>0.5){float a=clamp(0.1+0.55*pow(1.0-gNV,1.8)+0.35*smoothstep(0.85,1.0,edge)+crk*0.3,0.0,0.9)*(1.0-gDE);c=vec3(tone(c.r),tone(c.g),tone(c.b));gl_FragColor=vec4(c*a*uAlpha,a*uAlpha);return;}
    gC=c;}
    if(id==984){float s=ao+uKind,pul=pow(0.5+0.5*sin(s*9.0-gT*3.5),6.0),fl=vn(vec2(s*5.0-gT*1.4,edge*3.0));
    gC=(mix(MG*0.55,PK,0.45+0.35*fl+0.3*pul)+PH*(pul*0.4+gG2*0.6)*(0.6+0.4*gG))*(0.75+0.4*smoothstep(0.0,0.5,edge)*smoothstep(1.0,0.5,edge)+0.2*gG)+vec3(1.0)*pow(gSb,40.0)*0.4;}
    if(id==985)gC=mix(PK,WH,0.25+0.5*gNV*gNV)*(1.0+0.4*gG+0.5*gG2)*(0.92+0.08*sin(gT*6.0))+vec3(1.0)*pow(gSb,60.0)*2.0;
    if(id==986){float cry=step(0.15,gF)*step(gF,0.25),lot=step(0.25,gF),ac=edge,al=clamp(ao,0.0,1.0),fr2=max(smoothstep(0.86,0.99,abs(ac*2.0-1.0)),smoothstep(0.9,1.0,al)),run=gG2*pow(max(0.0,1.0-abs(al-fract(gT*0.8+uKind*0.3))*5.0),2.0);vec3 c;
    if(lot>0.5){vec3 alb=mix(vec3(1.0,0.97,0.98),vec3(1.0,0.55,0.75),smoothstep(0.2,1.0,al*0.7+abs(ac*2.0-1.0)*0.4));float vein=smoothstep(0.03,0.0,abs(fract(ac*7.0+al*0.5)-0.5)-0.42)*(1.0-uLow),wrap=max(0.0,(gNL+0.45)/1.45);
    c=alb*(wrap*gKEY*0.9+gAmb*1.4)+PK*max(0.0,-gNL)*0.5+PK*vein*0.15+vec3(1.0,0.95,0.97)*pow(gSb,30.0)*0.4+gRim*0.4+PK*(gG*0.3+run);}
    else if(cry>0.5){vec3 rf=refract(-uV,n,0.7);float w1=vn(vec2(al*8.0,ac*3.0)+rf.xy),crk=smoothstep(0.03,0.0,abs(fract(al*4.0+ac*2.0+w1)-0.5))*step(0.45,w1),ec,ev=env(gR,0.05,ec);
    c=mix(vec3(1.15,0.62,0.85),vec3(0.82,0.24,0.5),clamp(0.3+0.6*gNV,0.0,1.0))*(0.75+0.35*w1)+vec3(1.0,0.92,0.98)*(ev*(0.04+0.9*pow(1.0-gNV,4.0))+pow(max(0.0,dot(n,normalize(uLK+uV))),200.0)*8.0)+PH*crk*(0.4+gG)+PK*fr2*0.6+PK*pow(1.0-gNV,2.0)*0.4+mix(PK,WH,0.4)*run*1.4+PK*(0.25+gG*0.3);}
    else{float barb=smoothstep(0.08,0.0,abs(fract(al*16.0-abs(ac*2.0-1.0)*1.6)-0.5)-0.38)*(1.0-uLow),spine=smoothstep(0.08,0.0,abs(ac-0.5));
    c=vec3(0.96,0.94,0.95)*((0.3+0.6*clamp((gNL+0.6)/1.6,0.0,1.0)*gSh)*gKEY+gAmb*1.5)*(1.0-barb*0.12)+gEv*(0.06+0.7*gFr)*gOc+vec3(1.0,0.96,0.98)*pow(gSb,60.0)*1.3+gRim*0.35;
    c=mix(c*1.7,gGold,max(fr2,spine)*0.9)+mix(PK,WH,0.3)*(run*1.6+gG2*0.15)*(0.4+0.6*spine)+PK*smoothstep(0.6,1.0,al)*gG*0.3;}
    gC=c;}
    if(id==987){if(gF>0.15)gC=mix(PK,WH,0.3+0.3*gG2)*(1.1+0.8*gG+0.6*gG2)*(0.9+0.1*sin(gT*3.0));
    else{float wrap=max(0.0,(gNL+0.3)/1.3),hl=smoothstep(0.05,0.0,abs(vn(L.yz*7.0+2.0)-0.5))*(1.0-uLow);vec3 c=vec3(0.99,0.96,0.95)*(wrap*gKEY*0.8+gAmb*1.6)+vec3(1.0,0.5,0.65)*(1.0-wrap)*0.04+vec3(1.0)*(pow(gSb,120.0)*2.0+pow(gSb,16.0)*0.15)+gEv*gFr*0.6+gRim*0.3;
    gC=mix(c*1.5+PK*hl*(0.06+0.25*gG2)+PK*gG*0.25*pow(1.0-gNV,2.0),gGold,smoothstep(0.85,1.0,edge)*0.8);}}
    if(id==988){float ac=abs(edge*2.0-1.0),al=clamp(ao,0.0,1.0),fl=vn(vec2(al*14.0-gT*2.2,ac*2.0)),st2=pow(0.5+0.5*sin(al*30.0-gT*5.0+uKind),4.0);
    if(gF>0.15){float wrap=max(0.0,(gNL+0.5)/1.5),nh=max(0.0,dot(n,normalize(uLK+uV)));vec3 c=mix(vec3(1.0,0.55,0.74),vec3(1.0,0.82,0.9),smoothstep(0.6,0.0,ac))*(wrap*gKEY*0.75+gAmb*1.5)+vec3(1.0,0.8,0.9)*pow(nh,20.0)*0.6+PK*(0.15+0.4*gG)*(0.6+0.4*fl)+PH*st2*0.25*gG+gRim*0.3;
    c=mix(c,gGold,smoothstep(0.82,0.95,ac)*0.85);float a=(1.0-0.75*smoothstep(0.7,1.0,al))*(1.0-gDE);c=vec3(tone(c.r),tone(c.g),tone(c.b));gl_FragColor=vec4(c*a*uAlpha,a*uAlpha);return;}
    else{vec3 c=mix(PK,WH,smoothstep(0.7,0.0,ac)*0.6)*(0.55+0.5*fl+0.4*st2)*(0.7+0.5*gG);c=vec3(tone(c.r),tone(c.g),tone(c.b));float a=clamp((1.0-ac*ac)*(0.45+0.4*fl)*(0.6+0.4*gG)*smoothstep(0.0,0.06,al)*smoothstep(1.0,0.85,al),0.0,0.95)*(1.0-gDE);gl_FragColor=vec4(c*a*uAlpha,a*uAlpha);return;}}
    if(id==989){float fl=0.6+0.4*vn(L.xy*3.0+gT);vec3 c=mix(PK,WH,0.4+0.4*gNV)*fl*(0.6+0.5*gG);c=vec3(tone(c.r),tone(c.g),tone(c.b));float a=clamp((0.3+0.55*gNV*gNV)*fl,0.0,1.0);gl_FragColor=vec4(c*a*uAlpha,a*uAlpha);return;}
    if(id==990){float band=step(0.25,gF),an=atan(L.y,L.x),crd=an*7.6394+24.0,cell=floor(crd),dd=fract(crd)-0.5,ac=NL.z,h=hs(vec2(cell,9.0+uKind)),stem=smoothstep(0.1,0.05,abs(dd-(h-0.5)*0.2)),brn=smoothstep(0.09,0.035,abs(ac-dd*1.4*(h>0.6?1.0:-1.0)))*step(abs(dd),0.35),rune=max(stem,brn)*step(0.3,h),pl=pow(0.5+0.5*sin(crd*0.45-gT*2.0),6.0);
    gC=(band>0.5?vec3(0.05,0.03,0.05)*(0.3+gDif)+gEv*gFr*0.5:gGold*0.8)*(1.0-rune*0.5)+mix(PK,PH,pl)*rune*(0.3+0.4*gG+0.6*pl);}
    if(id==991){if(gF>0.15){vec3 cw=vec3(0.97,0.94,0.94)*((0.15+0.7*gDif)*gKEY+gAmb*1.4)*1.5+vec3(1.0)*pow(gSb,70.0)*1.4+gEv*gFr*0.6+gRim*0.3;gC=mix(cw,gGold,smoothstep(0.5,0.92,clamp(ao,0.0,1.0)));}
    else gC=gGold*1.05+vec3(1.0,0.9,0.8)*pow(gSb,160.0)*2.5;}
    if(id==993)gC=mix(PK,WH,0.3+0.3*gNV)*(0.8+0.5*gG);
    gC+=PK*smoothstep(1.2,3.0,gG)*0.8+PK*gDE*2.0+WH*gDE*gDE;
    gl_FragColor=vec4(vec3(tone(gC.r),tone(gC.g),tone(gC.b))*uAlpha,uAlpha);return;}
  /*</GB-MAT>*/
  vec3 alb = vec3(0.03, 0.026, 0.038), F0 = vec3(0.17, 0.16, 0.21), em = vec3(0.0); float rough = 0.27, metal = 1.0, cav = 0.0, wear = 0.0, coat = 0.0;
  if (id == 1) { alb = vec3(0.12, 0.12, 0.13); F0 = vec3(0.55, 0.56, 0.6); rough = 0.3; }
  else if (id == 2) { alb = vec3(0.3, 0.3, 0.32); F0 = vec3(0.95, 0.95, 0.98); rough = 0.16; }
  else if (id == 3) { alb = vec3(0.55, 0.38, 0.1); F0 = vec3(1.0, 0.78, 0.36); rough = 0.22; }
  else if (id == 4) { alb = vec3(0.62, 0.05, 0.08); F0 = vec3(0.06, 0.05, 0.05); rough = 0.55; metal = 0.0; }
  else if (id == 5) { alb = vec3(0.32, 0.012, 0.035); F0 = vec3(0.07, 0.06, 0.06); rough = 0.12; metal = 0.0; coat = 1.2; }
  else if (id == 6 || id == 8) { float ndv = max(0.0, dot(n, uV)), k = 0.55 + 0.6 * ndv * ndv, fl = 0.85 + 0.3 * vn(L.xy * 30.0 + L.z * 7.0);
    vec3 e = id == 6 ? vec3(0.85, 0.32, 1.7) : vec3(1.2, 0.85, 1.7); float g = 0.75 + 0.9 * uGlow;
    gl_FragColor = vec4(vec3(tone(e.r * k * fl * g), tone(e.g * k * fl * g), tone(e.b * k * fl * g)) * uAlpha, uAlpha); return; }
  else if (id == 7) { float k = 0.6 + 0.4 * ao; gl_FragColor = vec4(vec3(0.016, 0.012, 0.024) * k * uAlpha, uAlpha); return; }
  else if (id == 9) { alb = vec3(0.55, 0.55, 0.6); F0 = vec3(0.9, 0.9, 0.95); rough = 0.2; }
  else if (id == 10) { alb = vec3(0.025, 0.022, 0.03); F0 = vec3(0.05); rough = 0.55; metal = 0.0; }
  else if (id == 11) { alb = vec3(0.2, 0.2, 0.22); F0 = vec3(0.7, 0.72, 0.77); rough = 0.14; }
  else if (id == 12) { alb = vec3(0.5, 0.35, 0.8); F0 = vec3(0.7, 0.6, 0.85); rough = 0.12; em = vec3(0.65, 0.25, 1.3) * (0.5 + uGlow); }
  else if (id == 13) { alb = vec3(0.4, 0.03, 0.05); F0 = vec3(0.05, 0.04, 0.04); rough = 0.5; metal = 0.0; }
  else if (id == 14) {   // faceted translucent ice (flat-shaded crystal blades; ao carries 1 - the place along the blade): deep sapphire
    // at the root to luminous cyan at the tip, the studio seen through it (a fake refraction), sharp reflections, bright
    // white facet edges, internal cracks, a fresnel rim, frost
    float tp = clamp(1.0 - ao, 0.0, 1.0), ndv = max(0.001, dot(n, uV)), w1 = vn(L.xy * 7.0 + L.z * 3.0), w2 = vn(L.yz * 6.0 + L.x * 4.0);
    float k1 = abs(fract(dot(L, vec3(5.1, 3.3, 4.2)) + w1 * 1.6) - 0.5), k2 = abs(fract(dot(L, vec3(-3.7, 6.1, 2.4)) + w2 * 1.6) - 0.5);
    float crack = smoothstep(0.035, 0.0, min(k1, k2)) * smoothstep(0.25, 0.5, vn(L.zx * 3.0 + L.y * 2.0));
    vec3 deep = vec3(0.01, 0.045, 0.5), mid = vec3(0.04, 0.3, 1.15), tipc = vec3(0.3, 0.95, 1.5);
    vec3 body = mix(mix(deep, mid, smoothstep(0.0, 0.55, tp + 0.25 * (w1 - 0.5))), tipc, smoothstep(0.45, 1.0, tp)) * (0.55 + 0.45 * (1.0 - ndv * ndv * 0.7));
    vec3 rf = refract(-uV, n, 0.72); float e2; float tr = env(normalize(n * (0.6 * (w2 - 0.5)) - rf), 0.25, e2); body += mid * tr * 0.4 + vec3(0.15, 0.5, 0.95) * e2 * 0.45;
    float wrap = max(0.0, dot(n, uLK) * 0.5 + 0.5); body *= 0.5 + 0.75 * wrap * wrap;
    vec3 r = 2.0 * ndv * n - uV; float ec; float ev = env(r, 0.05, ec); float F = 0.05 + 0.95 * pow(1.0 - ndv, 4.0);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), spec = pow(nh, 260.0) * 12.0 * max(0.0, dot(n, uLK));
    vec3 c = body + (ev * F * 0.9 + spec) * vec3(0.8, 0.92, 1.1) + ec * F * uRim * 1.2 + pow(1.0 - ndv, 3.0) * vec3(0.1, 0.5, 0.9) * 0.6;
    c += crack * vec3(0.5, 0.9, 1.3) * (0.5 + uGlow);
    float eg = smoothstep(0.8, 1.0, edge); c = mix(c, vec3(0.82, 0.95, 1.2) * (0.6 + 0.6 * ev + 0.4 * wrap), eg * 0.85);
    float fr = smoothstep(0.55, 0.95, dot(n, uUP) * 0.55 + vn(L.xy * 38.0 + L.z * 17.0) * 0.75); c = mix(c, vec3(0.75, 0.87, 1.0) * (0.45 + 0.55 * wrap), fr * 0.3 * (1.0 - uLow));
    c += (vec3(0.0, 0.1, 0.32) + tipc * 0.22 * tp) * (0.5 + uGlow) * (0.6 + 0.4 * w2);
    if (uGlow2 > 0.0) { float core = ndv * ndv * (0.55 + 0.45 * w1), vein = smoothstep(0.09, 0.0, min(k1, k2));   // (lit from within: a core seen through the flat faces, brighter veins, cracks and edges)
      c += uGlow2 * (vec3(0.03, 0.3, 1.2) * core * (0.35 + 0.5 * tp) + vec3(0.2, 0.7, 1.4) * vein * 0.4 + crack * vec3(0.7, 1.0, 1.3) * 0.9 + eg * vec3(0.3, 0.75, 1.2) * 0.7); }
    c = frostFx(c, L);
    gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id == 15) { alb = vec3(0.022, 0.022, 0.026); F0 = vec3(0.04); rough = 0.8; metal = 0.0;   // rough rubber: fine sidewall ribs, dusty wear
    float rr = length(L.xz); cav += 0.35 * step(0.5, fract(rr * 46.0)) * step(rr, 0.47); alb *= 0.75 + 0.6 * vn(L.xz * 30.0 + L.y * 11.0); }
  else if (id == 16) { float ndv = max(0.0, dot(n, uV)), k = 0.6 + 0.6 * ndv * ndv, fl = 0.88 + 0.24 * vn(L.xy * 26.0 + L.z * 9.0), g = 0.55 + 1.1 * uGlow;   // cyan energy
    vec3 c = frostFx(vec3(0.22, 1.25, 1.75) * k * fl * g, L); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id == 17) { alb = vec3(0.018, 0.018, 0.022); F0 = vec3(0.045); rough = 0.42; metal = 0.0;   // the black saddle: quilted leather
    vec2 q = vec2(L.x + L.y, L.x - L.y) * 9.0; vec2 f = abs(fract(q) - 0.5); float st = min(f.x, f.y); if (st < 0.04) cav += 0.7; else n = normalize(n + vec3(fract(q.x) - 0.5, fract(q.y) - 0.5, 0.0) * 0.5); }
  else if (id == 18) { alb = vec3(0.045, 0.047, 0.055); F0 = vec3(0.3, 0.31, 0.34); rough = 0.42;   // dark machinery: cast, ribbed
    cav += 0.3 * step(0.6, fract((L.x + L.z * 0.4) * 24.0)); rough *= 0.8 + 0.5 * vn(L.xy * 22.0 + L.z * 13.0); em += vec3(0.05, 0.04, 0.3) * uSpill; }
  else if (id == 19) { alb = vec3(0.3, 0.31, 0.34); F0 = vec3(0.93, 0.94, 0.98); rough = 0.17;   // polished silver armour: panel seams, rivets
    vec3 an = abs(NL); vec2 uv = an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz;
    float row = floor(uv.y / 0.19), fu = fract(uv.x / 0.31 + mod(row, 2.0) * 0.5), fv = fract(uv.y / 0.19), du = min(fu, 1.0 - fu) * 0.31, dv = min(fv, 1.0 - fv) * 0.19, dm = min(du, dv);
    if (dm < 0.005) cav += (1.0 - dm / 0.005) * 0.9; else if (dm < 0.016) wear += 0.3;
    float rd = length(vec2(du, dv) - 0.028); if (rd < 0.011) { rough = 0.1; wear += 0.5; if (rd > 0.007) cav += 0.5; }
    rough *= 0.75 + 0.6 * vn(L.xy * 9.0 + L.z * 5.0);
    if (uLow < 0.5) { n = normalize(n + (vec3(vn(L.yz * 3.3), vn(L.zx * 3.3 + 5.0), vn(L.xy * 3.3 + 9.0)) - 0.5) * 0.1);   // (plates are never dead flat)
      vec2 cell = vec2(floor(uv.x / 0.31 + mod(row, 2.0) * 0.5), row); float hc = hs(cell + 3.7);
      if (dm > 0.03) { if (hc > 0.7) { float g2 = abs(fract((fu * 0.5 + fv) * 5.0) - 0.5); if (g2 < 0.035 && fv > 0.25 && fv < 0.75) cav += 0.55; }                 // (engraved chevrons)
        else if (hc > 0.5) { float g3 = abs(fract(fu * 9.0) - 0.5); if (g3 < 0.14 && fu > 0.5 && fu < 0.9 && fv > 0.3 && fv < 0.62) { cav += 0.9; rough = 0.5; } }     // (vent slots)
        else if (hc < 0.12) { if (fu > 0.2 && fu < 0.52 && fv > 0.4 && fv < 0.52) { float st = step(0.5, fract((fu + fv * 0.6) * 14.0)); alb = mix(vec3(0.02), vec3(0.2, 0.25, 0.9), st); F0 = vec3(0.1); rough = 0.4; em += st * vec3(0.06, 0.07, 0.5) * (0.4 + uGlow); } } }   // (a hazard inlay)
      float sc2 = vn(uv * vec2(60.0, 7.0)); if (sc2 > 0.78) rough *= 0.6; }
    rough *= 0.85; em += vec3(0.07, 0.06, 0.42) * uSpill * smoothstep(0.35, -0.7, dot(n, uUP)) * (0.6 + 0.4 * vn(L.xy * 2.0));
    float fz = smoothstep(0.62, 0.95, edge * 0.5 + dot(n, uUP) * 0.3 + vn(L.xy * 31.0 + L.z * 19.0) * 0.55) * (1.0 - uLow); if (fz > 0.0) { alb = mix(alb, vec3(0.7, 0.8, 0.95), fz * 0.8); F0 = mix(F0, vec3(0.3, 0.4, 0.55), fz * 0.8); rough = mix(rough, 0.6, fz); } }   // (frost gathering on the armour's edges)
  else if (id == 20) { float ndv = max(0.0, dot(n, uV)), k = 0.55 + 0.7 * ndv * ndv, fl = 0.85 + 0.3 * vn(L.xy * 22.0 + L.z * 9.0), g = 0.6 + 1.1 * uGlow;   // the engine's light: a deep electric violet-blue, white-hot at its heart
    vec3 c = frostFx((vec3(0.3, 0.16, 1.7) + vec3(0.3, 0.32, 0.3) * pow(ndv, 8.0)) * k * fl * g * 0.85, L); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id == 21) { float h = clamp(L.x * -2.4 - 0.9 + 0.5 * vn(L.yz * 14.0), 0.0, 1.0);   // heat-tinted steel (an exhaust tip): straw to purple to blue
    alb = mix(vec3(0.3, 0.3, 0.32), mix(vec3(0.5, 0.36, 0.12), vec3(0.2, 0.14, 0.5), smoothstep(0.3, 0.9, h)), smoothstep(0.0, 0.3, h)) * 0.6; F0 = mix(vec3(0.9, 0.9, 0.93), mix(vec3(1.0, 0.75, 0.35), vec3(0.45, 0.4, 1.0), smoothstep(0.3, 0.9, h)), smoothstep(0.0, 0.3, h)); rough = 0.2; }
  else if (id >= 22 && id <= 26) {   // ---- plant tissue. Petals and leaves: vA.y = along the blade (0 root, 1 tip), vA.z = across it (0.5 the midrib)
    float al = clamp(edge, 0.0, 1.0), ac = clamp(ao, 0.0, 1.0), d = abs(ac - 0.5) * 2.0, under = dot(normalize(vN), uV) < -0.02 ? 1.0 : 0.0, ndv = max(0.0, dot(n, uV)); vec3 c;
    if (id == 22) {   // a leaf: emerald to spring green, a pale-gold midrib and side veins, waxy, lit yellow-green from behind
      vec3 alb = mix(vec3(0.012, 0.15, 0.055), vec3(0.2, 0.55, 0.1), smoothstep(0.0, 1.0, al + 0.2 * (vn(vec2(al * 9.0, ac * 6.0)) - 0.5)));
      float mid = smoothstep(0.075 * (1.0 - 0.6 * al), 0.0, d), sf = abs(fract(al * 8.0 - d * 1.9) - 0.5), side = smoothstep(0.07, 0.0, sf) * (1.0 - d * 0.55) * step(0.04, d), fine = smoothstep(0.1, 0.0, abs(fract(al * 31.0 - d * 5.0 + ac * 13.0) - 0.5)) * 0.25;
      alb = mix(alb, vec3(0.78, 0.72, 0.36), min(1.0, mid * 0.9 + side * 0.5)) * (1.0 - fine * 0.25) * (1.0 - 0.45 * under) * (0.82 + 0.18 * (1.0 - d * d));
      n = normalize(n + (vec3(vn(L.yz * 17.0), vn(L.zx * 17.0 + 3.0), vn(L.xy * 17.0 + 7.0)) - 0.5) * 0.12);
      c = petalLit(alb, n, vec3(0.5, 0.75, 0.08), 70.0, 0.55 * (1.0 - under));
      vec3 r = 2.0 * ndv * n - uV; float e2; float ce = env(r, 0.08, e2); c += (0.04 + 0.96 * pow(1.0 - ndv, 5.0)) * (ce + e2) * 0.4 * (1.0 - under); }
    else if (id == 23) {   // a pink petal: deep rose in the fold, rich pink, blush at the ruffled edge; fine veins; satin; glows warm pink from behind
      float t2 = max(al, d * 0.92 * smoothstep(0.1, 0.6, al));
      vec3 alb = mix(mix(vec3(0.42, 0.0, 0.09), vec3(1.0, 0.1, 0.36), smoothstep(0.0, 0.5, al)), vec3(1.0, 0.56, 0.7), smoothstep(0.66, 1.0, t2)) * (0.72 + 0.28 * smoothstep(0.0, 0.3, al));
      float vv = smoothstep(0.16, 0.0, abs(fract((ac - 0.5) * (22.0 - 9.0 * al) + 0.5 + 0.25 * vn(vec2(al * 7.0, ac * 3.0))) - 0.5)) * (1.0 - 0.6 * al);
      alb *= (1.0 - 0.2 * vv) * (1.0 - 0.3 * under) * (0.9 + 0.2 * vn(vec2(ac * 40.0, al * 5.0)));
      c = petalLit(alb, n, vec3(1.0, 0.3, 0.48), 9.0, 0.34) + pow(1.0 - ndv, 2.5) * vec3(0.55, 0.22, 0.34) * 0.4; c = mix(vec3(dot(c, vec3(0.3, 0.5, 0.2))), c, 1.18);
      c += uGlow * vec3(1.15, 0.42, 0.6) * pow(1.0 - al, 2.0) * (0.8 + 0.4 * (1.0 - d)); }
    else if (id == 24) {   // a pearl petal: white, ivory toward the root, a pink bounce, an iridescent sheen at grazing angles
      vec3 alb = mix(vec3(0.9, 0.7, 0.6), vec3(0.94, 0.94, 0.96), smoothstep(0.0, 0.62, al)) * (0.74 + 0.26 * smoothstep(0.0, 0.5, al)) * (1.0 - 0.14 * d * d * (1.0 - 0.5 * al));   // (pink-ivory and shaded toward the base and the sides: neighbours read apart)
      alb *= (1.0 - 0.1 * smoothstep(0.2, 0.0, abs(fract((ac - 0.5) * 16.0 + 0.5) - 0.5)) * (1.0 - al)) * (1.0 - 0.2 * under);
      c = petalLit(alb, n, vec3(1.0, 0.8, 0.78), 16.0, 0.4) + alb * 0.07; float fr = pow(1.0 - ndv, 2.2);
      c += (0.5 + 0.5 * cos(6.2832 * (fr * 1.4 + al * 0.6 + vec3(0.0, 0.33, 0.67)))) * fr * 0.4 + vec3(0.12, 0.02, 0.05) * (1.0 - (0.5 + 0.5 * dot(n, uUP)));
      c += uGlow * vec3(1.1, 1.0, 0.85) * (0.22 + 0.6 * pow(1.0 - al, 2.0)); }
    else if (id == 25) {   // a green tentacle (a tube: its own normal runs the veins length-wise): a paler belly, a soft sheen
      float belly = smoothstep(0.15, -0.7, dot(n, uUP)), vs = smoothstep(0.5, 0.72, vn(NL.xy * 8.0 + NL.z * 6.0));
      vec3 alb = mix(vec3(0.03, 0.27, 0.07), vec3(0.42, 0.62, 0.22), belly) * (1.0 - 0.3 * vs) * (0.85 + 0.3 * vn(L.xy * 9.0 + L.z * 5.0));
      c = petalLit(alb, n, vec3(0.4, 0.65, 0.08), 28.0, 0.45) + pow(1.0 - ndv, 3.0) * vec3(0.2, 0.45, 0.15) * 0.4; }
    else {                 // a white tentacle: pearl, a cool rim
      vec3 alb = vec3(0.9, 0.9, 0.9) * (0.9 + 0.1 * smoothstep(0.5, 0.72, vn(NL.xy * 8.0 + NL.z * 6.0))) - vec3(0.0, 0.02, 0.06) * smoothstep(0.15, -0.7, dot(n, uUP));
      c = petalLit(alb, n, vec3(0.9, 0.85, 0.8), 30.0, 0.5) + pow(1.0 - ndv, 2.4) * vec3(0.45, 0.75, 1.1) * 0.6 + uGlow * vec3(0.3, 0.5, 0.4) * 0.3; }
    c = frostFx(c, L); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id >= 30 && id <= 36) {   // ---- premium cel shading (Jaws). vA.y = 1 at a panel line or a plate's edge; vA.z = 1 sound paint, 0 worn to bare metal
    float lit, ndv = max(0.0, dot(n, uV)), hm = 0.5 + 0.5 * dot(n, uUP); vec3 c, r = 2.0 * ndv * n - uV;
    float line = smoothstep(0.82, 0.95, edge), scr = 0.0, occ = 1.0 - 0.3 * smoothstep(0.35, 0.8, edge) * (1.0 - line);   // (occ: the recess beside a panel line or a plate's step is in shade)
    if (uLow < 0.5) { float s1 = abs(fract(L.x * 11.0 + L.y * 7.0 + L.z * 5.0 + vn(L.xz * 4.0) * 2.5) - 0.5); if (s1 < 0.012 && hs(vec2(floor(L.x * 11.0 + L.y * 7.0 + L.z * 5.0), floor(L.z * 5.0))) > 0.6) scr = 1.0; }   // (fine scratches)
    if (id == 30) {   // cobalt paint: three blue bands, a tight gloss band and a soft sky band, panel variation, panel lines, chips to bare metal beside edges
      vec3 cell = floor(L * 2.6 + 0.5); float pv = hs(cell.xy + cell.z * 7.3) - 0.5;
      c = cel3(vec3(0.012, 0.045, 0.22), vec3(0.03, 0.16, 0.62), vec3(0.12, 0.37, 0.96), n, lit) * (1.0 + 0.18 * pv) * occ;
      c += celSpec(n, 0.955) * vec3(0.5, 0.72, 1.0) * 0.45 * (1.0 - 0.8 * smoothstep(0.7, 0.95, dot(n, uUP))) + smoothstep(0.3, 0.36, r.z) * (1.0 - smoothstep(0.52, 0.6, r.z)) * vec3(0.1, 0.22, 0.4) * (0.4 + 0.6 * lit);
      float chip = smoothstep(0.64, 0.72, vn(L.xy * 23.0 + L.z * 17.0) * (0.3 + 0.62 * smoothstep(0.55, 0.85, edge)) + (1.0 - clamp(ao, 0.0, 1.0)) * 0.75) * (1.0 - line) * (1.0 - uLow);   // (chips only beside a panel line or where vA.z marks a worn edge)
      vec3 bare = cel3(vec3(0.2, 0.22, 0.27), vec3(0.55, 0.58, 0.63), vec3(0.95, 0.96, 1.0), n, lit); c = mix(c, bare, chip * uWear);
      c = min(c, vec3(0.17, 0.44, 1.12)); c = mix(c, c * 1.5 + 0.06, scr * 0.5) * (1.0 - 0.8 * line) + celRim(n) + vec3(0.42, 0.72, 0.95) * uGlow2 * (line * 0.7 + 0.25 * smoothstep(0.35, 0.8, edge) * (1.0 - line) + 0.05); }   // (a ceiling: a flat fin square to the light stays cobalt)
    else if (id == 31) {   // chrome: a stylised sky and ground with a hard horizon, one sharp key band, brushed machining
      float t = r.z + 0.045 * (vn(vec2(L.x * 2.0, (L.y + L.z) * 60.0)) - 0.5) * (1.0 - uLow);
      vec3 sky = mix(vec3(0.86, 0.93, 1.0), vec3(0.18, 0.34, 0.72), smoothstep(0.08, 0.85, t)), gnd = mix(vec3(0.07, 0.09, 0.15), vec3(0.4, 0.44, 0.54), smoothstep(-0.9, -0.04, t));
      c = mix(gnd, sky, smoothstep(-0.025, 0.025, t)) + smoothstep(0.0, 0.025, t) * (1.0 - smoothstep(0.07, 0.11, t)) * 0.42 + smoothstep(0.4, 0.48, t) * (1.0 - smoothstep(0.56, 0.66, t)) * 0.14;   // (a hard horizon, a hot line over it, a soft second band higher up)
      vec3 cell = floor(L * 3.0 + 0.5); c *= 0.93 + 0.14 * hs(cell.xy + cell.z * 5.1); c *= occ;
      cel3(vec3(0.0), vec3(0.5), vec3(1.0), n, lit); c *= 0.7 + 0.45 * lit; c += celSpec(n, 0.94) * 0.9 + smoothstep(0.8, 0.83, dot(r, uLS)) * 0.25;
      c = mix(c, c * 0.7, scr * 0.6) * (1.0 - 0.75 * line) + celRim(n) + vec3(0.42, 0.72, 0.95) * uGlow2 * line * 0.6; }
    else if (id == 32) {   // dark steel: recessed machinery, matte, a cyan bounce from the emitters near it (spill)
      c = cel3(vec3(0.01, 0.013, 0.026), vec3(0.042, 0.05, 0.075), vec3(0.12, 0.14, 0.19), n, lit) * (0.85 + 0.3 * vn(L.xy * 14.0 + L.z * 9.0)) * occ; c *= 1.0 - 0.18 * smoothstep(0.35, 0.5, abs(fract(length(L.yz) * 30.0) - 0.5)) * (1.0 - uLow);   // (turned machining rings)
      c *= 1.0 - 0.35 * step(0.62, fract((L.x + L.z * 0.35) * 18.0)) * (1.0 - uLow); c += celSpec(n, 0.9) * 0.1 + vec3(0.03, 0.42, 0.62) * uSpill * (0.2 + 0.5 * (1.0 - hm)) * (0.6 + 0.4 * lit);
      c *= 1.0 - 0.7 * line; }
    else if (id == 33) {   // reactor cyan: water-energy with its structure showing: bands flowing along the mesh's own x, cell walls, a darker limb
      float f = fract(L.x * 3.2 - uTime * 0.7 + 0.25 * vn(L.yz * 5.0)), bandf = smoothstep(0.0, 0.12, f) * (1.0 - smoothstep(0.55, 0.95, f)), wall = smoothstep(0.42, 0.5, abs(fract(atan(L.z, L.y) * 1.2732 + 0.5) - 0.5)), g = 0.75 + 1.5 * uGlow;
      float cau = vn(vec2(L.x * 9.0 - uTime * 1.6, atan(L.z, L.y) * 3.0)), fine = smoothstep(0.62, 0.8, cau);
      c = mix(vec3(0.03, 0.17, 0.38), vec3(0.42, 0.82, 1.2), bandf) * (0.55 + 0.45 * ndv) + vec3(0.7, 0.92, 1.1) * fine * bandf * 0.45;   // (baby blue)
      c = c * g * (1.0 - 0.62 * wall) * (1.0 - 0.5 * line) + vec3(0.25, 0.5, 0.65) * pow(1.0 - ndv, 2.0) * (0.4 + 0.4 * uGlow); }
    else if (id == 34) {   // a tooth: off-white enamel-chrome, hard bands, a sharp glint
      c = cel3(vec3(0.42, 0.47, 0.6), vec3(0.8, 0.83, 0.87), vec3(1.0, 1.0, 0.97), n, lit) + celSpec(n, 0.93) * 0.6 + smoothstep(0.0, 0.04, r.z) * (1.0 - smoothstep(0.1, 0.16, r.z)) * vec3(0.12, 0.16, 0.22);
      c = c * (1.0 - 0.6 * line) + celRim(n); }
    else if (id == 36) {   // cel leather (a seat): near-black navy in three bands, quilted stitching, a soft sheen
      vec2 qd = vec2(L.x + L.y, L.x - L.y) * 14.0; vec2 fq = abs(fract(qd) - 0.5); float stc = smoothstep(0.06, 0.02, min(fq.x, fq.y));
      c = cel3(vec3(0.008, 0.01, 0.022), vec3(0.03, 0.036, 0.062), vec3(0.085, 0.1, 0.15), n, lit) * (1.0 - 0.55 * stc) + celSpec(n, 0.9) * vec3(0.1, 0.13, 0.2) + celRim(n) * 0.6; c *= 1.0 - 0.6 * line; }
    else {                 // canopy glass: dark blue, semi-gloss: a hard sky reflection, a glint streak, a lighter limb
      c = cel3(vec3(0.004, 0.012, 0.045), vec3(0.01, 0.035, 0.11), vec3(0.03, 0.09, 0.24), n, lit);
      c += smoothstep(0.25, 0.3, r.z) * (1.0 - smoothstep(0.62, 0.7, r.z)) * vec3(0.12, 0.28, 0.52) * (0.5 + 0.5 * lit) + celSpec(n, 0.985) * vec3(0.9, 0.97, 1.0) + smoothstep(0.55, 0.75, 1.0 - ndv) * vec3(0.05, 0.18, 0.32) + vec3(0.02, 0.2, 0.3) * uSpill * 0.4;
      c += (vec3(0.18, 0.42, 0.62) * smoothstep(0.35, 0.95, 1.0 - ndv) + vec3(0.35, 0.65, 0.9) * smoothstep(0.55, 0.6, r.z) * (1.0 - smoothstep(0.66, 0.72, r.z))) * uGlow2 * 1.6;   // (uGlow2: Jaws' baby-blue light on the canopy)
      c *= 1.0 - 0.7 * line; }
    c = frostFx(c, L); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id == 37) {   // ---- a Tidal Pool's water (Jaws): a unit disc on the floor (its own x-y). uGlow2 = forming 0..1, uWear = draining (+) or bursting (-) 0..1,
    // uGlow = claimed 0..1 (brighter, swirling), uSpill = the pool's seed. Feathered: it writes its own alpha (premultiplied), nothing past its lapping rim.
    vec2 q = L.xy; float rr = length(q), ang = atan(q.y, q.x), sd = uSpill * 7.13, t = uTime;
    float form = clamp(uGlow2, 0.0, 1.0), dr = max(uWear, 0.0), bu = max(-uWear, 0.0), clm = clamp(uGlow, 0.0, 1.0), fe = 1.0 - pow(1.0 - form, 3.0);
    float R0 = mix(0.25, 1.0, fe) * (1.0 - 0.85 * dr) * (1.0 + 0.45 * bu), rn = rr / max(R0, 0.02);
    float lap = 0.022 * sin(ang * 5.0 + t * 1.7 + sd) + 0.014 * sin(ang * 11.0 - t * 2.3 + sd * 2.0) + 0.018 * sin(ang * 3.0 + t * 0.9 - sd), eR = 1.0 + lap;   // (the rim laps in and out)
    if (rn > eR + 0.14) discard;
    float sw = clm * (t * 1.8 + (1.0 - min(rn, 1.0)) * 3.5) + 0.25 * t + dr * (1.0 - min(rn, 1.0)) * 9.0,   // (a drain: the water spirals in)
          ca = cos(sw), sa = sin(sw); vec2 p = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca) / max(R0, 0.3);   // (claimed: the water swirls)
    vec2 c1 = p * 4.2 + vec2(t * 0.31, -t * 0.23) + sd; float n1 = vn(c1 + vn(c1 * 0.7 + t * 0.17) * 1.6), n2 = vn(p * 5.6 - vec2(t * 0.27, t * 0.36) + sd * 3.0 + vn(p * 3.0 - t * 0.2) * 1.2);
    float caus = smoothstep(0.09, 0.0, abs(n1 - n2)) * (0.55 + 0.45 * vn(p * 2.0 + t * 0.4)), caus2 = smoothstep(0.05, 0.0, abs(vn(p * 7.0 + t * 0.5 + 4.0) - vn(p * 7.0 - t * 0.43 + 9.0)));   // (caustics: where two moving fields cross)
    float rip = sin(rn * 15.0 - t * 2.8 + sd) * 0.5 + 0.5, rip2 = sin(rn * 23.0 - t * 4.1 + ang * 0.0 + sd * 1.3) * 0.5 + 0.5, ripK = smoothstep(0.15, 0.6, rn) * (1.0 - smoothstep(0.85, 1.0, rn));   // (ripples running out)
    vec3 deep = vec3(0.02, 0.1, 0.3), shal = vec3(0.17, 0.5, 0.86), c = mix(deep, shal, smoothstep(0.05, 0.95, rn * rn));   // (deeper toward the centre)
    c *= 0.85 + 0.25 * ripK * (rip * 0.7 + rip2 * 0.3);
    c += vec3(0.45, 0.82, 1.1) * (caus * 0.7 + caus2 * 0.35) * (0.55 + 0.45 * rn) * (1.0 + 0.8 * clm);
    float spiral = clm * smoothstep(0.55, 1.0, sin(ang * 3.0 - rn * 9.0 + t * 5.0)) * (1.0 - smoothstep(0.7, 1.0, rn)) * smoothstep(0.08, 0.3, rn); c += vec3(0.6, 0.9, 1.15) * spiral * 0.55;
    float fb = smoothstep(eR - 0.2, eR - 0.05, rn) * (1.0 - smoothstep(eR - 0.02, eR + 0.1, rn)), fn = vn(vec2(ang * 9.0 + t * 0.6, rn * 14.0 - t * 1.2) + sd) * 0.6 + vn(vec2(ang * 23.0 - t, rn * 30.0) + sd) * 0.4;
    float foam = fb * smoothstep(0.35, 0.7, fn + 0.25 * sin(t * 2.2 + ang * 4.0 + sd));   // (a foamy luminous rim)
    c = mix(c, vec3(0.75, 0.93, 1.1), foam * 0.85) + vec3(0.3, 0.65, 0.95) * fb * 0.45;
    vec2 gc = floor(p * 9.0); float gh = hs(gc + sd), gl = step(0.93, gh) * pow(max(0.0, sin(t * (3.0 + gh * 6.0) + gh * 40.0)), 12.0) * smoothstep(0.08, 0.0, length(fract(p * 9.0) - 0.5) - 0.06) * (1.0 - smoothstep(0.9, 1.0, rn));   // (glints)
    float bb = step(0.9, hs(gc * 1.7 + sd + 3.0)) * smoothstep(0.1, 0.0, abs(length(fract(p * 9.0 + vec2(0.0, t * 0.2)) - 0.5) - 0.12)) * (1.0 - rn);   // (small bubbles)
    c += vec3(1.0) * gl * 1.4 + vec3(0.7, 0.9, 1.0) * bb * 0.35;
    float lift = 0.85 + 0.15 * sin(t * 1.3 + sd) + 0.6 * clm; c *= lift * (1.0 - 0.45 * dr); c += vec3(0.5, 0.8, 1.0) * (1.0 - smoothstep(0.0, 0.18, abs(rn - (0.3 + 0.7 * bu)))) * bu * 2.2 + vec3(0.6, 0.85, 1.0) * bu * (1.0 - bu) * 0.6;   // (claimed: brighter; a burst: a bright ring running out)
    float a = (1.0 - smoothstep(eR - 0.04, eR + 0.12, rn)) * mix(0.82, 0.62, smoothstep(0.3, 1.0, rn)) * smoothstep(0.0, 0.35, form) * (1.0 - dr * dr) * (1.0 - bu * bu);
    a = max(a, foam * 0.9 * smoothstep(0.0, 0.3, form) * (1.0 - dr) * (1.0 - bu)); a *= uAlpha;
    gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * a, a); return; }
  else if (id == 27) { alb = vec3(0.52, 0.47, 0.34); F0 = vec3(1.0, 0.94, 0.8); rough = 0.13;   // the ring's metal (its axis the mesh's own z): pale gold-white, an engraved vine with green enamel leaves
    float ang = atan(L.y, L.x), fu = fract(ang / 6.2832 * 18.0), v = clamp(L.z * 10.0, -1.0, 1.0), wv = 0.42 * sin(fu * 6.2832);
    if (abs(v - wv) < 0.07) { cav += 0.75; rough = 0.3; alb *= 0.35; F0 *= 0.3; }                                             // (the stem)
    vec2 lf = vec2((fract(fu * 2.0) - 0.5) * 1.7, v - wv - 0.3 * (fu < 0.5 ? 1.0 : -1.0)); float le = dot(lf * vec2(1.0, 2.6), lf * vec2(1.0, 2.6));
    if (le < 0.16) { alb = vec3(0.012, 0.32, 0.13) * (0.7 + 0.6 * step(abs(lf.x * 0.35 + lf.y), 0.03)); F0 = vec3(0.07); rough = 0.12; metal = 0.0; coat = 1.0; if (le > 0.12) cav += 0.6; }   // (a leaf of enamel, its rim cut in)
    if (abs(abs(v) - 0.86) < 0.035) cav += 0.6; }                                                     // (a bead line near each edge)
  else if (id == 28) { float ang = atan(L.y, L.x), ndv = max(0.0, dot(n, uV)), fl = 0.62 + 0.38 * sin(ang * 9.0 - uTime * 3.2 + 3.0 * vn(vec2(ang * 3.0, uTime * 0.7))), sp = vn(vec2(ang * 30.0 - uTime * 6.0, L.z * 20.0));   // mint energy, flowing round the ring
    float gr = clamp(uGlow2, 0.0, 1.0); vec3 c = frostFx((mix(vec3(0.5, 1.5, 0.95), vec3(0.32, 1.9, 0.5), gr) * fl * (1.0 + 0.6 * gr) + mix(vec3(0.9, 1.0, 0.95), vec3(0.75, 1.15, 0.8), gr) * (pow(ndv, 3.0) * 0.6 + smoothstep(0.7, 0.95, sp) * 0.7)) * (0.45 + 1.15 * uGlow), L); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }   // (uGlow2: Belladonna's ringGreen, a saturated green light)
  else if (id == 29) { alb = vec3(0.34, 0.36, 0.37); F0 = vec3(0.95, 0.97, 0.97); rough = 0.07;   // a sword's blade: pale mirror steel, a fuller line, a luminous mint edge (vA.y = 1 at the cutting edges, 0 at the spine)
    float eg = smoothstep(0.6, 1.0, edge), gr = clamp(uGlow2, 0.0, 1.0); em = mix(vec3(0.35, 1.35, 0.85), vec3(0.25, 1.7, 0.42), gr) * (eg * eg * (0.55 + 1.3 * uGlow) * (1.0 + 0.7 * gr) + (0.06 + 0.12 * gr) * uGlow);
    if (edge > 0.1 && edge < 0.16) { cav += 0.7; rough = 0.2; } rough *= 0.8 + 0.5 * vn(L.xy * 40.0 + L.z * 3.0); }
  else if (id == 48) {   // ---- Nidhogg's wing membrane: vA.y = across the panels (a finger at each whole number), vA.z = out from the arm (0) to the trailing edge (1). Dark thin leather lit through toward its edge, a network of dark veins branching out from the bones (thick there, thinning outward)
    float pu = edge, pv = ao, fi = fract(pu), pi = floor(pu), ndl = dot(n, uLK), ndv = max(0.0, dot(n, uV)), hm = 0.5 + 0.5 * dot(n, uUP), trc = clamp(uGlow2, 0.0, 1.0), w1 = vn(vec2(pu * 3.0, pv * 4.0)), w2 = vn(vec2(pu * 9.0 + 3.0, pv * 11.0));
    float d = min(fi, 1.0 - fi), sd = fi < 0.5 ? 0.0 : 1.0;   // (d: the distance from the nearer bone, across the panel)
    float vb = smoothstep(0.075, 0.035, d);   // (the vein running beside each bone)
    vec2 wq = vec2(vn(vec2(pu * 4.0, pv * 3.0) + 7.0), vn(vec2(pu * 4.0, pv * 3.0) + 13.0)) - 0.5;   // (a warp: the veins meander)
    float r1 = abs(vn(vec2(pu * 9.0, pv * 2.2) + wq * 1.0 + 2.0) * 2.0 - 1.0), r2 = abs(vn(vec2(pu * 18.0, pv * 5.5) + wq * 1.5 + 5.0) * 2.0 - 1.0), r3 = abs(vn(vec2(pu * 34.0, pv * 12.0) + wq * 2.2 + 9.0) * 2.0 - 1.0);   // (ridged noise: its zero lines form a branching network, elongated outward)
    float tp = 1.0 - 0.65 * pv;   // (every vein thins toward the edge)
    float rad = 1.0; for (int k = 1; k <= 3; k++) { float fk = float(k) / 4.0 + 0.05 * sin(pv * 7.0 + float(k) * 2.3 + pi * 1.7) + 0.08 * (wq.x); rad = min(rad, abs(fi - fk)); }   // (three main veins fanning out from the wrist across each panel)
    float b0 = smoothstep(0.03 * tp + 0.006, 0.004, rad) * smoothstep(0.02, 0.1, pv);
    float b1 = smoothstep(0.13 * tp * (1.2 - d), 0.02, r1) * smoothstep(0.04, 0.12, pv), b2 = smoothstep(0.1 * tp, 0.012, r2) * 0.85 * smoothstep(0.08, 0.18, pv), b3 = smoothstep(0.075, 0.01, r3) * 0.55 * smoothstep(0.2, 0.35, pv);
    float vein = clamp(max(max(vb, max(b0, b1)), max(b2, b3)) * smoothstep(0.0, 0.05, pv), 0.0, 1.0);
    vec3 a2 = mix(vec3(0.07, 0.005, 0.012), vec3(0.32, 0.02, 0.04), smoothstep(0.0, 0.9, pv)) * (0.8 + 0.4 * w1);   // (dark at the arm, lighter toward the edge)
    a2 = mix(a2, vec3(0.035, 0.002, 0.008), vein * 0.92);
    float wrap = max(0.0, (ndl + 0.3) / 1.3), back = max(0.0, -ndl) * (0.5 + 0.5 * max(0.0, dot(uV, -uLK) + 0.5));
    vec3 amb2 = mix(vec3(0.12, 0.07, 0.11), vec3(0.42, 0.38, 0.5), hm) * uAmb;
    vec3 trans = vec3(1.0, 0.17, 0.04) * (0.2 + 0.6 * back + 0.45 * uGlow) * (0.25 + 1.15 * smoothstep(0.15, 0.95, pv)) * (0.75 + 0.5 * w1) * (1.0 - 0.85 * vein);   // (light through the membrane: warmest toward the edge, blocked by the veins)
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh));
    vec3 c = a2 * (wrap * vec3(1.45, 1.35, 1.25) + amb2) + trans * 0.7 + pow(nh, 30.0) * 0.18 * max(0.0, ndl) * (1.0 - 0.5 * vein) + pow(1.0 - ndv, 3.0) * max(0.0, dot(n, uLR) + 0.3) * uRim * 0.3 + vec3(1.0, 0.35, 0.08) * vein * trc * 0.9;
    float hem = smoothstep(0.93, 0.985, pv) + smoothstep(0.025, 0.0, pv); c = mix(c, vec3(0.06, 0.005, 0.012), min(1.0, hem) * 0.85) + vec3(1.6, 0.8, 0.35) * trc * smoothstep(0.92, 0.99, pv) * 0.9;
    gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id >= 140 && id <= 146) {   // ---- (v415 TI) Titan, the moss-grown stone golem (20k2jz): 140 its stone plates (140.2 a cooler stone), 141 the charcoal core between them, 142 a mossy face (142.2 a raised moss cushion), 143 a fracture (a strip: vA.y its length, vA.z 0..1 across; 143.3 an engraved marking), 144 an eye, 145 the gauntlets' basalt, 146 amber crystal. uGlow the region's golden light, uGlow2 the eyes, uSpill 1: light runs along the fractures (Celestial)
    float gg = clamp(uGlow, 0.0, 1.6), ndv0 = max(0.0, dot(n, uV)), up = dot(n, uUP), w1 = vn(L.xy * 0.55 + L.z * 0.37), w2 = vn(L.yz * 1.9 + L.x * 1.3), w3 = vn(L.xz * 5.7 + L.y * 3.9), fr = vA.x - float(id);
    vec3 AMB1 = vec3(0.95, 0.42, 0.06), GOLD1 = vec3(1.25, 0.82, 0.3), HOT1 = vec3(1.45, 1.28, 0.98);
    if (id == 143) { float x = (clamp(ao, 0.0, 1.0) - 0.5) * 2.0, core = exp(-x * x * 7.0), lip = exp(-x * x * 1.8), gv = fr > 0.15 ? 0.12 + 0.8 * gg : gg;
      if (uSpill > 0.5) gv += gg * 1.0 * smoothstep(0.6, 0.98, sin(edge * 1.6 - uTime * 6.5 + L.x * 0.7 + L.z * 0.5));   // (Celestial: light running along it)
      float fl = 0.82 + 0.18 * vn(vec2(edge * 1.7 - uTime * 2.4, L.z * 0.6 + L.y)), e = 1.0 - exp(-2.4 * gv);   // (v417 POL: warmer, brighter: ember red at the lips to rich gold at the core, a hot pale-gold heart only at full power)
      vec3 c = vec3(0.03, 0.022, 0.015) * (1.0 - 0.6 * core) + mix(vec3(1.7, 0.62, 0.1), vec3(2.3, 1.55, 0.42), core) * lip * min(1.0, e * 1.6) * fl + vec3(3.2, 2.5, 1.2) * core * core * smoothstep(0.45, 1.0, e) * 0.4 * fl;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 144) { float e = clamp(uGlow2, 0.0, 1.0), k = 0.6 + 0.4 * pow(ndv0, 1.5); vec3 c = mix(vec3(0.015, 0.02, 0.015), mix(vec3(0.42, 0.95, 0.38), vec3(1.3, 1.4, 1.22), pow(ndv0, 2.5)) * k * 1.35, e);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 146) { float k = pow(ndv0, 1.3), vein = smoothstep(0.035, 0.0, abs(vn(L.xy * 2.3 + L.z * 1.7) - 0.5)); vec3 hh = normalize(uLK + uV);
      vec3 c = mix(vec3(0.3, 0.1, 0.012), vec3(1.05, 0.58, 0.12), k) * (0.45 + 0.8 * gg) + GOLD1 * vein * (0.3 + 0.9 * gg) + HOT1 * smoothstep(0.82, 1.0, edge) * (0.25 + 0.5 * gg) + pow(max(0.0, dot(n, hh)), 90.0) * 1.4 + pow(1.0 - ndv0, 3.0) * AMB1 * 0.5;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    metal = 0.0; F0 = vec3(0.035); rough = 0.86;
    n = normalize(n + (vec3(vn(L.yz * 1.6), vn(L.zx * 1.6 + 3.0), vn(L.xy * 1.6 + 7.0)) - 0.5) * 0.28 + (vec3(vn(L.yz * 5.3 + 1.0), vn(L.zx * 5.3 + 4.0), vn(L.xy * 5.3 + 8.0)) - 0.5) * (uLow > 0.5 ? 0.0 : 0.18));   // (rough stone: lumps and grit in the light)
    alb = (fr > 0.1 && id == 140 ? vec3(0.5, 0.505, 0.5) : vec3(0.57, 0.53, 0.475)) * (0.76 + 0.38 * w1) * (0.87 + 0.2 * w2);
    float c1 = abs(fract(dot(L, vec3(0.31, 0.19, 0.27)) + w1 * 1.6) - 0.5), c2 = abs(fract(dot(L, vec3(-0.23, 0.35, 0.16)) + w2 * 1.1) - 0.5);
    float fis = smoothstep(0.024, 0.004, min(c1, c2)) * smoothstep(0.42, 0.62, vn(L.zx * 0.31 + L.y * 0.23)), pit = smoothstep(0.8, 0.9, vn(L.xy * 7.3 + L.z * 4.1)) * (1.0 - uLow);   // (a fissure net here and there; pits)
    cav += fis * 0.8 + pit * 0.55;
    alb = mix(alb, vec3(0.68, 0.65, 0.58), smoothstep(0.6, 0.95, edge) * (0.5 + 0.5 * w3) * 0.6);   // (worn pale edges)
    float lich = smoothstep(0.74, 0.8, vn(L.yz * 3.7 + L.x * 2.9)) * smoothstep(0.1, 0.6, up) * (1.0 - uLow); alb = mix(alb, w3 > 0.5 ? vec3(0.62, 0.58, 0.36) : vec3(0.55, 0.33, 0.12), lich * 0.6);   // (lichen)
    float mossK = smoothstep(0.62, 0.92, up + (w1 - 0.5) * 0.6) * smoothstep(0.45, 0.68, w2);   // (moss settles on what faces up)
    if (id == 141) { alb = vec3(0.13, 0.115, 0.1) * (0.7 + 0.6 * w2); mossK = 0.0; rough = 0.92; float mv = vn(L.xy * 0.8 + L.z * 0.6 + vec2(uTime * 0.12, 0.0)); em += AMB1 * (0.035 + 0.6 * gg) * mv * mv; }   // (the core smoulders, molten when powered)
    else if (id == 145) { alb = vec3(0.16, 0.145, 0.13) * (0.8 + 0.4 * w2); mossK *= 0.3; }
    else if (id == 142) mossK = max(mossK, fr > 0.1 ? 1.0 : smoothstep(0.44, 0.6, vn(L.xy * 0.7 + L.z * 0.45) + 0.18 * up));
    if (mossK > 0.0) { float ms = vn(L.xy * 6.5 + L.z * 4.7), tuft = smoothstep(0.68, 0.85, vn(L.yz * 13.0 + L.x * 9.0));
      vec3 mc = mix(mix(vec3(0.11, 0.22, 0.05), vec3(0.26, 0.47, 0.1), ms), vec3(0.55, 0.74, 0.22), tuft * 0.8) * (0.8 + 0.3 * w1);
      alb = mix(alb, mc, mossK); rough = mix(rough, 0.97, mossK); cav *= 1.0 - mossK * 0.7; em += vec3(0.05, 0.085, 0.012) * pow(1.0 - ndv0, 2.0) * mossK;
      n = normalize(n + (vec3(vn(L.yz * 9.0), vn(L.zx * 9.0 + 2.0), vn(L.xy * 9.0 + 5.0)) - 0.5) * 0.5 * mossK); fis *= 1.0 - mossK; }
    alb *= (1.0 - 0.3 * smoothstep(-0.25, -0.85, up)) * (1.0 - 0.75 * fis);
    em += mix(AMB1, GOLD1, gg * 0.6) * fis * (0.06 + (id == 145 ? 2.6 : 2.1) * gg) * (0.75 + 0.25 * sin(uTime * 2.6 + L.x * 0.8 + L.z)); }   // (ember in the fissures: brighter in the light; v417 POL 2.1, was 1.5)
  else if (id >= 69 && id <= 74) {   // ---- Genbu (lead): 69 sandstone armour (warm beige, stone grain, carved geometric markings, chipped edges to rust primer, dust on top), 70 burnt-orange paint (borders, fittings, drill flutes; chips to steel), 71 dark steel machinery (machined, oily), 72 polished piston chrome, 73 amber light (eyes, slots; uGlow = power, uFx-free), 74 track iron (treads along x)
    float ndv0 = max(0.0, dot(n, uV)), up = max(0.0, dot(n, uUP)), w1 = vn(L.xy * 3.1 + L.z * 1.7), w2 = vn(L.yz * 9.0 + L.x * 4.0), w3 = vn(L.xz * 27.0 + L.y * 11.0);
    if (id == 73) { vec3 hh = normalize(uLK + uV); float fl = 0.9 + 0.1 * sin(uTime * 3.0 + L.x * 9.0); vec3 c = mix(vec3(0.95, 0.38, 0.04), vec3(1.7, 1.15, 0.5), pow(ndv0, 1.6)) * (0.55 + 0.6 * uGlow) * fl + pow(max(0.0, dot(n, hh)), 160.0) * 1.2;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float chipN = smoothstep(0.62, 0.72, w3 * 0.6 + smoothstep(0.35, 0.95, edge) * 0.55) * (1.0 - uLow);
    if (id == 69) { metal = 0.0; F0 = vec3(0.04); rough = 0.66 + 0.2 * w2; alb = vec3(0.64, 0.53, 0.38) * (0.82 + 0.3 * w1) * vec3(1.0, 0.98 + 0.04 * w2, 0.95 + 0.06 * w2);
      if (uLow < 0.5) { n = normalize(n + (vec3(vn(L.yz * 17.0), vn(L.zx * 17.0 + 3.0), vn(L.xy * 17.0 + 7.0)) - 0.5) * 0.16);   // (stone grain)
        vec3 an = abs(NL); vec2 uv = (an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz) * 2.6; vec2 g = fract(uv) - 0.5, ci = floor(uv); float mk = hs(ci) > 0.55 ? 1.0 : 0.0;   // (carved geometric markings: a stepped chevron in some cells)
        float ch = abs(abs(g.x) * 1.4 + g.y - 0.12); if (mk > 0.5 && max(abs(g.x), abs(g.y)) < 0.36 && ch < 0.035) cav += 0.9;
        float sc = abs(fract(L.x * 9.0 + L.y * 5.0 + w2 * 2.0) - 0.5); if (sc < 0.02 && hs(floor(L.xz * 6.0)) > 0.62) { alb *= 1.18; rough *= 0.8; } }   // (fine scratches)
      if (chipN > 0.0) alb = mix(alb, vec3(0.3, 0.12, 0.05), chipN);   // (chipped to the rust primer)
      if (vA.x - 69.0 > 0.15) { alb = vec3(0.2, 0.12, 0.07) * (0.75 + 0.35 * w2); rough = 0.92; cav += 0.55; }   // (69.3: a carved groove of the shell's glyphs, dark with dust and old pigment)
      alb = mix(alb, vec3(0.74, 0.66, 0.52), up * up * 0.35 * (0.6 + 0.4 * w1)); }   // (dust settled on top)
    else if (id == 70) { metal = 0.0; F0 = vec3(0.05); rough = 0.48 + 0.18 * w2; coat = 0.12; alb = vec3(0.4, 0.13, 0.04) * (0.82 + 0.3 * w1);
      if (chipN > 0.0) { metal = chipN; alb = mix(alb, vec3(0.1, 0.095, 0.1), chipN); F0 = mix(F0, vec3(0.5, 0.48, 0.47), chipN); rough = mix(rough, 0.32, chipN); }
      alb = mix(alb, vec3(0.6, 0.47, 0.34), up * up * 0.22 * w1); }
    else if (id == 71) { alb = vec3(0.07, 0.068, 0.072); F0 = vec3(0.4, 0.39, 0.41); rough = 0.38 + 0.2 * w2; if (uLow < 0.5) cav += 0.3 * step(0.66, fract((L.x + L.z * 0.4) * 18.0)); em += vec3(0.28, 0.1, 0.01) * 0.25 * uGlow * smoothstep(0.1, -0.6, dot(n, uUP)); }
    else if (id == 72) { alb = vec3(0.32, 0.32, 0.34); F0 = vec3(0.94, 0.94, 0.96); rough = 0.09 + 0.06 * w3; }
    else { metal = 0.6; alb = vec3(0.045, 0.042, 0.04); F0 = vec3(0.28, 0.27, 0.27); rough = 0.62; float tr = abs(fract(L.x * 7.0) - 0.5); cav += smoothstep(0.12, 0.02, tr) * 0.8; alb = mix(alb, vec3(0.42, 0.33, 0.23), up * 0.3 * w1); }   // (track iron, caked with dirt)
    cav += smoothstep(0.9, 0.99, edge) * 0.5; ao *= 1.0 - 0.18 * (1.0 - w1) * (1.0 - uLow);
    if (uClip.x > 0.5) { float bd = 1.0 - smoothstep(-0.05, 0.6 + 0.2 * w1, vW.z - uClip.y); if (bd > 0.0) { bd *= 0.88 + 0.12 * w2; alb = mix(alb, vec3(0.24, 0.165, 0.1) * (0.7 + 0.4 * w3), bd * 0.95); F0 = mix(F0, vec3(0.035), bd); rough = mix(rough, 0.97, bd); metal *= 1.0 - step(0.5, bd); coat *= 1.0 - bd; cav += bd * 0.7; ao *= 1.0 - 0.55 * bd; } } }   // (burrowing: caked in dirt and in shade toward the ground line, so the hull reads buried, not sliced)
  /*<CAL-FLAN-MAT ids 80..84>*/
  else if (id >= 80 && id <= 84) {   // ---- Fire Flan (worker F, 20zz6): 80 the gel (translucent: uGlow heat, uGlow2 chill, uSpill brittle cracks, uKind its phase (4 = the spent puddle), uWear its radius for the thickness, uFx a hit: + bright, - muted by the armour), 81 the molten core, 82 trapped ash, 83 a rising bubble, 84 hard facets (84.0 obsidian, its edges cooling by uGlow; 84.3 a frost crystal: uGlow its cold light, uSpill its damage). uOcc[0] = the core (world centre, radius)
    vec3 hh = normalize(uLK + uV); float ndv = max(0.0, dot(n, uV)), nh = max(0.0, dot(n, hh)), ndl = dot(n, uLK), heat = uGlow, chill = clamp(uGlow2, 0.0, 1.0);
    vec3 HOT = vec3(1.75, 1.1, 0.45), ORG = vec3(1.3, 0.4, 0.05), RED = vec3(0.6, 0.07, 0.015);
    if (id == 81 && vA.x - 81.0 > 0.15) {   // 81.3, an eye: an ember slit in the gel (its own frame: y along the slit, z across it), hot white-yellow at the heart to orange-red at the rim; uGlow its fire (flaring in wind-ups), uGlow2 how cold and dull (brittle), flickering
      // (cut to a pointed slit: thickest toward the outer end (y = +1), tapering to a point at both ends)
      float wy = (1.0 - L.y * L.y) * (0.45 + 0.55 * (L.y * 0.5 + 0.5)); if (abs(L.z) > wy) discard;
      float d = max(abs(L.z) / max(wy, 1e-3), abs(L.y)) * 0.85, cold = clamp(uGlow2, 0.0, 1.0), flk = 0.85 + 0.15 * sin(uTime * (17.0 + 9.0 * cold) + L.y * 3.0) * (0.6 + 0.4 * sin(uTime * 5.3));
      vec3 hi = mix(vec3(2.1, 1.6, 0.7), vec3(0.62, 0.1, 0.06), cold), lo = mix(vec3(1.0, 0.1, 0.02), vec3(0.22, 0.02, 0.02), cold);
      vec3 c = mix(lo, hi, smoothstep(0.92, 0.2, d)) * (0.45 + 0.75 * heat) * flk * mix(1.0, 0.12, smoothstep(0.72, 0.97, d));   // (a dark rim round the slit)
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 81) {   // the core: churning magma, a dark crust drifting over a white-hot heart, flickering (uGlow: its heat, which surges with its attacks)
      vec2 q = L.xy * 2.4 + vec2(L.z * 1.7, -L.z); float w = vn(q + vec2(uTime * 0.55, -uTime * 0.35)) * 0.62 + vn(q * 2.6 - vec2(uTime * 0.8, uTime * 0.25) + L.z * 3.0) * 0.38;
      float lim = pow(ndv, 0.55), flk = 0.88 + 0.12 * sin(uTime * 13.0 + L.x * 6.0) * vn(vec2(uTime * 4.0, L.y * 3.0)), tt = clamp((0.3 + 0.95 * w) * (0.6 + 0.6 * lim) * (0.85 + 0.45 * heat) * flk, 0.0, 1.5);
      vec3 c = tt < 0.38 ? mix(vec3(0.16, 0.02, 0.0), RED * 1.6, tt / 0.38) : tt < 0.72 ? mix(RED * 1.6, ORG * 1.15, (tt - 0.38) / 0.34) : mix(ORG * 1.15, HOT * 1.35, min(1.0, (tt - 0.72) / 0.45));
      c += pow(nh, 50.0) * 0.5 * vec3(1.0, 0.9, 0.7);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 82) {   // ash: charcoal flakes, a few edges still glowing
      float w = vn(L.xy * 37.0 + L.z * 13.0); vec3 c = vec3(0.03, 0.024, 0.022) * (0.6 + 0.8 * w) * (0.45 + 0.8 * max(0.0, ndl)) + ORG * smoothstep(0.6, 1.0, edge) * 0.35 * heat * w + pow(nh, 24.0) * 0.06;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 83) {   // a bubble: clear in the middle, a bright lit rim and a glint
      float fr = pow(1.0 - ndv, 2.0), a = uAlpha * clamp(0.1 + 0.8 * fr, 0.0, 1.0);
      vec3 c = mix(ORG, HOT, 0.6 * fr) * (0.5 + 0.9 * fr) * (0.6 + 0.6 * heat) * a + vec3(1.0, 0.95, 0.85) * (pow(nh, 60.0) * 2.6 + pow(nh, 10.0) * 0.2) * uAlpha;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)), a); return; }
    if (id == 84) {
      float ec;
      if (vA.x - 84.0 > 0.15) {   // a frost crystal: white-blue facets, frost in the hollows, a cold light inside, cracks as it is hurt
        vec3 r = 2.0 * ndv * n - uV; float w1 = vn(L.xy * 6.0 + L.z * 2.0), w2 = vn(L.yz * 13.0 + L.x * 5.0), tp = clamp(1.0 - ao, 0.0, 1.0);
        float ev = env(r, 0.08, ec), F = 0.06 + 0.94 * pow(1.0 - ndv, 4.0);
        vec3 body = mix(vec3(0.3, 0.52, 0.82), vec3(0.86, 0.95, 1.05), smoothstep(0.1, 0.95, tp * 0.75 + w1 * 0.4)) * (0.4 + 0.7 * max(0.0, ndl * 0.6 + 0.4));
        vec3 rf = refract(-uV, n, 0.75); float e2; float tr = env(normalize(rf + n * (w2 - 0.5)), 0.3, e2); body += vec3(0.3, 0.55, 0.9) * tr * 0.3;
        float frost = smoothstep(0.55, 0.85, vn(L.xy * 9.0 + L.z * 7.0) * 0.6 + (1.0 - tp) * 0.55); body = mix(body, vec3(0.9, 0.95, 1.0) * (0.6 + 0.45 * max(0.0, ndl)), frost * 0.6);
        float k1 = abs(fract(dot(L, vec3(4.1, 2.7, 3.3)) + w1 * 1.4) - 0.5), k2 = abs(fract(dot(L, vec3(-2.9, 5.3, 1.9)) + w2 * 1.2) - 0.5);
        float crk = smoothstep(0.02 + 0.03 * uSpill, 0.0, min(k1, k2)) * smoothstep(0.02, 0.3, uSpill);
        vec3 c = body + (ev * F * 0.8 + pow(nh, 220.0) * 10.0 * max(0.0, ndl)) * vec3(0.85, 0.93, 1.1) + smoothstep(0.7, 1.0, edge) * vec3(0.75, 0.88, 1.0) * 0.5;
        c += vec3(0.35, 0.8, 1.3) * uGlow * (0.2 + 0.55 * tp + 0.45 * pow(1.0 - ndv, 2.0));
        c = mix(c, vec3(0.05, 0.08, 0.16), crk * 0.85);
        gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
      // obsidian: black glass, rippled like a shell where it broke, red-hot along the fresh edges until it cools
      float w = vn(L.xy * 9.0 + L.z * 5.0); vec3 nn = normalize(n + (vec3(vn(L.yz * 21.0), vn(L.zx * 21.0 + 3.0), vn(L.xy * 21.0 + 7.0)) - 0.5) * 0.35);
      vec3 r2 = 2.0 * max(0.0, dot(nn, uV)) * nn - uV; float ev = env(r2, 0.04, ec), F = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
      vec3 c = vec3(0.014, 0.011, 0.016) * (0.6 + 0.8 * max(0.0, ndl)) + vec3(0.8, 0.85, 1.0) * ev * (0.1 + F) * 0.6 + pow(max(0.0, dot(nn, hh)), 300.0) * 6.0 * max(0.0, ndl) + ec * F * uRim * 0.6;
      float hot = smoothstep(0.8, 1.0, edge) * uGlow * (0.6 + 0.4 * w); c += mix(RED, ORG, hot) * hot * 1.2;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    // ---- the gel: only its front surface is shaded; the volume behind it is worked out from the thickness along the view.
    // vA.y (edge) carries, per vertex, how much a boiling lobe or a straining pseudopod swells the skin there
    if (dot(normalize(vN), uV) < -0.02) discard;
    float puddle = step(3.5, uKind), p3 = step(2.5, uKind) * (1.0 - puddle), lob = clamp(edge, 0.0, 1.0);
    vec3 vl = vec3(dot(uV, uM0) / max(1e-4, dot(uM0, uM0)), dot(uV, uM1) / max(1e-4, dot(uM1, uM1)), dot(uV, uM2) / max(1e-4, dot(uM2, uM2)));   // (the view direction in the gel's own frame)
    vec3 cc = uOcc[0].xyz; float cr = max(0.05, uOcc[0].w);
    float th = uWear * 2.0 * (0.12 + 0.88 * ndv);
    // where the view ray passes the core: how near (a window onto it), and how much gel lies in front of it
    vec3 toC = cc - vW; float tc = dot(toC, -uV), dc = length(toC + uV * tc), win = smoothstep(cr * 1.8, cr * 0.4, dc) * step(0.0, tc) * 0.8;
    float dS = max(0.0, length(vW - cc) - cr), sss = exp(-dS * 1.85) * (0.5 + 0.5 * heat);   // (the core's light reaching this part of the skin)
    float thin = pow(1.0 - ndv, 1.8), wrap = max(0.0, ndl * 0.55 + 0.45);
    // the gel's own light: hot toward the core and where it thins at the edge (light shining through), deep crimson only
    // where it is thick and far from the core; a ramp crimson > fire orange > amber > hot yellow
    // its eyes (uOcc[1], uOcc[2]: their centres and sizes; uOcc[3].x their fire, .y how cold): a window in the jelly over each, and their bloom in it
    float eyeH = 0.0, eyeS = 0.0; for (int e = 1; e <= 2; e++) { vec4 E = e == 1 ? uOcc[1] : uOcc[2]; if (E.w > 0.0) { vec3 tE = E.xyz - vW; float te = dot(tE, -uV), de2 = dot(tE + uV * te, tE + uV * te) / (E.w * E.w); eyeH += exp(-de2 / 2.4) * step(-0.25, te); eyeS += exp(-de2 / 7.0) * step(-0.25, te); } }
    eyeS = clamp(eyeS - eyeH * 0.6, 0.0, 1.0) * clamp(uOcc[3].x, 0.0, 1.0);   // (a dark socket in the jelly round each eye, so the slits read)
    vec3 eyeC = mix(vec3(1.9, 0.85, 0.22), vec3(0.42, 0.05, 0.035), clamp(uOcc[3].y, 0.0, 1.0)) * uOcc[3].x;
    vec3 CRIM = vec3(0.32, 0.02, 0.01), FIRE = vec3(1.08, 0.22, 0.02), AMBR = vec3(1.45, 0.6, 0.08), YEL = vec3(1.8, 1.22, 0.45);
    float lum = clamp(sss * 1.05 + thin * 0.34 * (0.6 + 0.4 * heat) + lob * 0.5, 0.0, 1.6) * (1.0 - 0.3 * chill);
    vec3 body = lum < 0.4 ? mix(CRIM, FIRE, lum / 0.4) : lum < 0.85 ? mix(FIRE, AMBR, (lum - 0.4) / 0.45) : mix(AMBR, YEL, min(1.0, (lum - 0.85) / 0.75));
    body *= 0.62 + 0.45 * wrap;
    // veins of glow reaching from the core toward the surface (ridges in the direction away from the core), and its halo
    vec3 dirC = normalize(vW - cc), vq = dirC * 2.4 + vec3(0.0, 0.0, -uTime * 0.22);
    float vr = 1.0 - abs(vn(vq.xy + vq.z * 1.7) * 2.0 - 1.0), vr2 = 1.0 - abs(vn(vq.yz * 1.9 + vq.x + 3.1) * 2.0 - 1.0);
    float vein = pow(vr, 16.0) * smoothstep(0.25, 0.75, vr2) * exp(-dS * 1.5) * (0.6 + 0.6 * heat) * (1.0 - chill) * (1.0 - puddle * 0.6);
    float halo = exp(-dc * dc / (cr * cr * 5.0)) * step(0.0, tc) * (0.7 + 0.6 * heat);
    float flk = 0.9 + 0.1 * sin(uTime * 11.0 + dS * 4.0) * (0.5 + vn(vec2(uTime * 3.0, dS * 2.0)));
    body = (body + mix(AMBR, YEL, 0.5) * vein * 0.85 + mix(AMBR, YEL, 0.3) * halo * 0.75 + YEL * lob * 0.25 * heat) * flk * (1.0 - 0.8 * eyeS);
    float aB = (0.58 + 0.34 * ndv) * (1.0 - 0.32 * p3) * (1.0 - 0.55 * win * (1.0 - chill * 0.4)) * (1.0 - 0.7 * min(1.0, eyeH));
    if (puddle > 0.5) { body *= 0.3 + 0.7 * clamp(heat, 0.0, 1.2); aB = 0.82; }
    // trapped ash: a few dark flecks at two depths, drifting with the gel
    float ash = 0.0; for (int i = 0; i < 2; i++) { float dd = (0.22 + 0.32 * float(i)) * th; vec3 s = L - vl * dd; float a1 = vn(s.xy * 5.6 + s.z * 3.1 + float(i) * 7.3), a2 = vn(s.yz * 11.0 - s.x * 2.7 + float(i) * 3.1); ash += smoothstep(0.85, 0.92, a1 * 0.55 + a2 * 0.5) * (0.75 - 0.25 * float(i)); }
    ash = min(1.0, ash) * (1.0 - win * 0.8) * (1.0 - puddle * 0.5);
    // rising micro-bubbles, deeper in (thick in a boiling lobe)
    float bub = 0.0; for (int i = 0; i < 2; i++) { vec3 s = (L - vl * (0.3 + 0.35 * float(i)) * th) * (5.0 + 2.0 * float(i)) + vec3(float(i) * 3.7, float(i) * 1.3, -uTime * (0.9 + 0.4 * float(i) + lob)); vec3 ci = floor(s), f = fract(s) - 0.5; float hb = hs(ci.xy + ci.z * 7.7);
      if (hb > 0.82 - lob * 0.25) { vec3 o2 = (vec3(hs(ci.xy + 1.3), hs(ci.yz + 2.1), hs(ci.zx + 3.7)) - 0.5) * 0.45; float d = length(f - o2), rb = 0.07 + 0.08 * hs(ci.xz); bub += smoothstep(rb, rb * 0.6, d) * smoothstep(rb * 0.3, rb * 0.75, d); } }
    bub *= (1.0 - chill) * (1.0 + p3 + lob) * (1.0 - puddle);
    // cracks: the chill's brittle shell (a network over the frost) and, in its last phase, hot fractures where the steam escapes
    // (the fracture network: the edges of a cellular pattern on the face the surface turns most toward, a coarse net and a fine one)
    vec3 an = abs(NL); vec2 cuv = (an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz) + vec2(vn(L.yz * 3.0), vn(L.zx * 3.0)) * 0.25;
    float ev1 = 9.0, ev2 = 9.0;
    for (int q = 0; q < 2; q++) { vec2 uv = cuv * (q == 0 ? 1.8 : 4.1) + float(q) * 5.3; vec2 ip = floor(uv), fp = fract(uv); float f1 = 9.0, f2 = 9.0;
      for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) { vec2 gq = vec2(float(xx), float(yy)), oq = vec2(hs(ip + gq), hs(ip + gq + 17.3)), dq = gq + oq - fp; float d2 = dot(dq, dq); if (d2 < f1) { f2 = f1; f1 = d2; } else if (d2 < f2) f2 = d2; }
      if (q == 0) ev1 = sqrt(f2) - sqrt(f1); else ev2 = sqrt(f2) - sqrt(f1); }
    float crack = max(smoothstep(0.07 + 0.05 * uSpill, 0.0, ev1), smoothstep(0.05, 0.0, ev2) * smoothstep(0.2, 0.9, uSpill) * 0.8) * clamp((chill - 0.45) * 1.8 + uSpill, 0.0, 1.0);
    float frac3 = p3 * smoothstep(0.06, 0.0, ev1) * smoothstep(0.45, 0.7, vn(cuv * 1.3 + vec2(0.0, uTime * 0.12))) * (1.0 - chill);
    // the wet surface: the key light stretched into a long soft band over the dome (a strip of light reflected), small sharp
    // glints, the cavern in the fresnel, a hot rim of light round the edge and a faint glow off the far inner wall
    vec3 r = 2.0 * ndv * n - uV; float ec; float ev = env(r, 0.05, ec); float F = 0.04 + 0.96 * pow(1.0 - ndv, 4.0);
    vec3 sd = normalize(cross(uLS, uUP) + vec3(1e-4, 0.0, 0.0)), pn = normalize(cross(uLS, sd));
    float pr = dot(r, pn), band = exp(-pr * pr / 0.012) * smoothstep(0.15, 0.55, dot(r, uLS)) * (0.55 + 0.45 * smoothstep(0.0, 0.6, ndl + 0.3));
    float glint = pow(nh, 900.0) * 18.0 * max(0.0, ndl) + step(0.975, hs(floor(L.xy * 26.0) + floor(L.z * 26.0) * 3.1)) * pow(nh, 30.0) * 1.6;
    vec3 spec = vec3(1.0, 0.94, 0.84) * (band * 0.85 + glint) + vec3(1.0, 0.86, 0.75) * ev * F * 0.6 + ec * F * uRim * 0.9;
    vec3 rim = vec3(1.7, 0.78, 0.2) * pow(1.0 - ndv, 2.4) * (0.5 + 0.6 * heat) * (1.0 - chill * 0.7) + pow(1.0 - ndv, 3.0) * max(0.0, dot(n, uLR) + 0.3) * uRim * 0.5;
    float inner = exp(-pow((dot(n, -uLS) - 0.45) / 0.22, 2.0)) * (0.3 + 0.7 * thin);   // (the light caught on the inside of the far wall)
    rim += AMBR * inner * 0.22 * (1.0 - chill);
    // the chill's frost: pale and matte, sparkling, thinner over the core so it stays plain to see
    float fr0 = vn(L.xy * 11.0 + L.z * 5.0), frost = pow(chill, 1.4) * (0.5 + 0.45 * fr0) * (1.0 - 0.9 * win) * (1.0 - crack);
    vec3 frostC = mix(vec3(0.5, 0.64, 0.8), vec3(0.9, 0.95, 1.02), fr0) * (0.42 + 0.65 * wrap);
    float spark = chill * step(0.965, hs(floor(cuv * 34.0))) * pow(nh, 6.0) * 1.6;
    // put together, premultiplied
    float aG = aB; vec3 col = body * aG * (1.0 - ash * 0.85); aG += (1.0 - aG) * ash * 0.55;
    col += vec3(1.0, 0.75, 0.42) * bub * 0.85; aG = max(aG, bub * 0.6);
    col += rim + spec * (1.0 - frost * 0.6); aG = max(aG, F * 0.85);
    col = mix(col, frostC + spec * 0.4, frost * 0.85); aG = mix(aG, 0.92, frost * 0.85);
    col += mix(ORG, HOT, 0.5) * crack * (0.7 + 0.8 * sss) * (0.6 + 0.5 * heat); aG = max(aG, crack * 0.9);
    col += HOT * frac3 * 1.6; aG = max(aG, frac3);
    col += vec3(0.95, 0.98, 1.0) * spark;
    col += mix(ORG, HOT, 0.5) * halo * chill * 0.9;   // (chilled, its core shows plainly through the pale shell)
    col += eyeC * eyeH * (1.0 - 0.4 * frost);   // (the eyes' glow, through the jelly and over the frost)
    if (uFx > 0.0) col += vec3(1.0, 0.75, 0.45) * uFx * 0.55; else if (uFx < 0.0) col *= 1.0 + uFx * 0.3;
    aG = max(aG, puddle * 0.75);
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, clamp(aG, 0.0, 1.0) * uAlpha); return; }
  /*</CAL-FLAN-MAT>*/
  /*<CAL-BOMB-MAT ids 85..89>*/
  else if (id >= 85 && id <= 89) {   // ---- the Bomb King (Rift 0, B): 85 its shell plates (weathered riveted iron, rust and soot, hammered, temper colours toward the edges by uSpill, engraved runes that glow and tighten with uGlow2; 85.3 a plate's cut side, lit by the core), 86 the molten core (uKind 1: the eye's lens), 87 forged dark iron (87.3 a plate's inner face, glowing from the core; 87.6 temper-blued), 88 the braided fuse (vA.y round it, vA.z along it), 89 embers. uGlow = the core's heat, uWear = the part's seed
    float sub = vA.x - float(id), ndv = max(0.001, dot(n, uV)), heat = clamp(uGlow, 0.0, 2.5), rage = clamp(uGlow2, 0.0, 1.0), sd = uWear * 37.0;
    vec3 hotC = vec3(1.55, 0.34, 0.05), midC = vec3(1.8, 0.82, 0.2), whC = vec3(1.95, 1.55, 0.9);
    if (id == 86) { float tt = uTime; vec3 q = L * 3.2;
      float f1 = vn(q.xy * 1.3 + vec2(tt * 0.31, -tt * 0.19) + q.z * 0.7), f2 = vn(q.yz * 2.7 + vec2(-tt * 0.42, tt * 0.27) + q.x * 1.1), f3 = vn(q.zx * 6.0 + vec2(tt * 0.8, tt * 0.5));
      float conv = f1 * 0.55 + f2 * 0.3 + f3 * 0.15, crust = smoothstep(0.6, 0.82, conv);
      vec3 c = mix(mix(vec3(0.7, 0.07, 0.01), hotC, smoothstep(0.2, 0.55, conv)), midC, smoothstep(0.45, 0.85, 1.0 - abs(conv - 0.5) * 2.2));
      c = mix(c, vec3(0.1, 0.025, 0.01), crust * 0.8 * (1.0 - 0.35 * min(1.0, heat)));   // (a dark crust drifting over it)
      c = mix(c, whC, pow(ndv, 3.0) * 0.4 * min(1.0, heat));
      if (uKind > 0.5) { float rr = length(L.yz) / 0.255, ring = 0.5 + 0.5 * sin(rr * 19.0 - tt * 2.6 + f1 * 3.0);   // (the eye: a white-hot heart, molten rings drawn in toward it)
        c = mix(c, whC * 1.1, smoothstep(0.5, 0.0, rr) * 0.85); c += hotC * ring * smoothstep(1.0, 0.35, rr) * 0.4 * (0.6 + rage); c *= 0.75 + 0.35 * smoothstep(1.05, 0.8, rr); }
      c *= 0.05 + 0.95 * heat; c += pow(1.0 - ndv, 2.0) * hotC * 0.22 * heat;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 89) { float fl = vn(L.xy * 18.0 + L.z * 9.0 + vec2(uTime * 2.3, -uTime * 1.7)); vec3 c = mix(hotC, whC, fl * fl) * (0.3 + 0.9 * heat) * (0.55 + 0.6 * fl); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 aB = vec3(0.05), F0b = vec3(0.3), emB = vec3(0.0); float rgh = 0.5, mtl = 1.0, cvB = 0.0;
    float w1 = vn(L.xy * 4.1 + L.z * 2.3 + sd), w2 = vn(L.yz * 11.0 + L.x * 6.0 + sd * 0.7), w3 = vn(L.xz * 37.0 + L.y * 19.0 + sd);
    float te = 0.0;
    if (id == 88) { float ar = edge, al = ao; float b1 = abs(fract(ar * 3.0 + al * 26.0) - 0.5), b2 = abs(fract(ar * 3.0 - al * 26.0) - 0.5), grv = smoothstep(0.1, 0.0, min(b1, b2));
      mtl = 0.0; aB = vec3(0.17, 0.115, 0.07) * (0.7 + 0.5 * w2); F0b = vec3(0.04); rgh = 0.85; cvB += grv * 0.7;
      float emb = grv * smoothstep(0.3, 0.75, vn(vec2(al * 46.0 - uTime * 2.4, ar * 6.0 + sd))); emB += mix(hotC, midC, emb) * emb * (0.3 + 1.3 * heat) + hotC * heat * 0.05;
      n = normalize(n + (vec3(vn(vec2(ar * 30.0, al * 90.0)), vn(vec2(al * 80.0, ar * 20.0)), 0.5) - 0.5) * 0.4); edge = 0.0; ao = 1.0; }
    else if (id == 87) { aB = vec3(0.04, 0.036, 0.034) * (0.8 + 0.4 * w1); F0b = vec3(0.27, 0.26, 0.255) * (0.9 + 0.2 * w2); rgh = 0.48 + 0.22 * w2;
      if (sub > 0.45) te = 0.45 + 0.5 * smoothstep(0.2, 0.9, w1 * 0.6 + edge * 0.5);   // (temper-blued: straw to bronze to violet to blue)
      else if (sub > 0.15) { emB += mix(hotC, midC, w2 * 0.6) * heat * (0.32 + 0.25 * w2); rgh = 0.75; F0b *= 0.5; }   // (an inner face, glowing from the core)
      else te = smoothstep(0.5, 1.0, edge) * 0.35; }
    else {   // 85: the shell's plates
      aB = vec3(0.058, 0.052, 0.048) * (0.7 + 0.6 * w1); F0b = vec3(0.3, 0.29, 0.28) * (0.85 + 0.3 * w2); rgh = 0.44 + 0.3 * w2;
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 9.0 + sd), vn(L.zx * 9.0 + 3.0 + sd), vn(L.xy * 9.0 + 7.0 + sd)) - 0.5) * 0.2);   // (hammered, never flat)
      float rs = smoothstep(0.6, 0.88, vn(L.xy * 6.0 + vec2(sd * 1.3, -sd) + L.z) * 0.72 + w3 * 0.34) * (1.0 - smoothstep(0.55, 0.9, edge));   // (rust in the flats)
      aB = mix(aB, vec3(0.2, 0.072, 0.028) * (0.7 + 0.5 * w3), rs); F0b = mix(F0b, vec3(0.05), rs); rgh = mix(rgh, 0.9, rs); mtl = 1.0 - rs * 0.85;
      aB *= 1.0 - 0.45 * smoothstep(-0.2, -0.8, dot(n, uUP));   // (soot under it)
      te = smoothstep(0.3, 1.0, edge + (w2 - 0.5) * 0.3) * (0.4 + 0.6 * clamp(uSpill, 0.0, 1.0)) * (1.0 - rs);
      if (sub > 0.15) { emB += mix(hotC, midC, w2) * heat * (0.35 + 0.3 * w2); te *= 0.4; }   // (a cut side: red-hot from the core)
      else { emB += mix(hotC, midC, 0.3) * heat * 0.32 * smoothstep(0.82, 1.0, edge);   // (the seam's lip, lit from within)
        vec2 f = L.xy / 0.21; float h1 = hs(vec2(sd, 1.7)), h2 = hs(vec2(sd, 5.3)), h3 = hs(vec2(sd, 9.1)), h4 = hs(vec2(sd, 12.9)), sx = h1 > 0.5 ? 1.0 : -1.0;   // (the plate's rune: a stem and three or four strokes, drawn from its seed)
        if (max(abs(f.x), abs(f.y)) < 0.62) { float lw = mix(0.085, 0.055, rage); vec2 pa, ba;
          float g = abs(f.x) + max(0.0, abs(f.y) - 0.42);
          pa = f - vec2(0.0, 0.1); ba = vec2(0.3 * sx, 0.32); g = min(g, length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)));
          if (h2 > 0.3) { pa = f - vec2(0.0, -0.12); ba = vec2(-0.3 * sx, 0.24); g = min(g, length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0))); }
          if (h3 > 0.45) g = min(g, abs(f.y + 0.3) + max(0.0, abs(f.x) - 0.24));
          if (h4 > 0.4) g = min(g, abs(length(f - vec2(0.0, h4 > 0.7 ? 0.42 : -0.42)) - 0.1));
          float kk = smoothstep(lw, lw * 0.35, g); cvB += kk * 0.8;
          emB += mix(hotC, midC, rage * 0.7) * kk * (0.14 + 1.9 * rage * rage) * (0.8 + 0.2 * sin(uTime * 6.0 + sd)); } } }
    if (te > 0.0) { vec3 tc = te < 0.4 ? mix(vec3(0.74, 0.58, 0.28), vec3(0.6, 0.33, 0.14), te * 2.5) : te < 0.7 ? mix(vec3(0.6, 0.33, 0.14), vec3(0.36, 0.2, 0.38), (te - 0.4) * 3.333) : mix(vec3(0.36, 0.2, 0.38), vec3(0.2, 0.34, 0.74), (te - 0.7) * 3.333);
      float tk = smoothstep(0.04, 0.4, te); F0b = mix(F0b, tc, tk * 0.85); rgh = mix(rgh, 0.28, tk * 0.8); mtl = max(mtl, tk); }
    float ndl = dot(n, uLK), dif = max(0.0, ndl), hm = 0.5 + 0.5 * dot(n, uUP);
    vec3 r = 2.0 * ndv * n - uV; float ec; float ev = env(r, rgh, ec) * 0.5;
    float fk = pow(1.0 - ndv, 5.0) * (1.0 - rgh * 0.7); vec3 Fr = F0b + (1.0 - F0b) * fk;
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rgh * rgh + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * dif * 0.8;
    vec3 KEY = vec3(1.35, 1.16, 0.98), amb = mix(vec3(0.5, 0.18, 0.06), vec3(0.2, 0.2, 0.26), hm) * (0.55 + 0.45 * ao) * uAmb;   // (the lava's warm bounce from below, a dim cavern above)
    float aoS = (0.6 + 0.4 * ao) * (1.0 - cvB * 0.65); vec3 c;
    if (mtl > 0.5) c = aB * (dif * KEY * 0.6 + amb * 0.7) + Fr * (ev * vec3(1.0, 0.85, 0.7) * aoS + spec * KEY) + ec * uRim * Fr * aoS * 0.8;
    else c = aB * (dif * KEY + amb) + Fr * (ev * 0.4 * aoS + spec * KEY * 2.0) + ec * uRim * 0.15;
    c += pow(1.0 - ndv, 2.6) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.3 * ao;
    c *= 1.0 - min(0.85, cvB * 0.55); if (id == 85) c *= 0.55 + 0.45 * smoothstep(0.05, 0.4, uSpill); c += emB;   // (cold, inert plates go dull)
    gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  /*</CAL-BOMB-MAT>*/
  /*<CAL-IFRIT-MAT ids 90..96>*/
  else if (id >= 90 && id <= 96) {   // ---- Ifrit (I, Rift 0, 20zz8): 90 basalt plate (cooled sooty crust, vesicles, ash on top; rims glow with the core: uGlow; uSpill the tethers' blackfire; uGlow2 cracks before the plate breaks away), 91 basalt flesh (a fissure network glowing with uGlow), 92 molten core, 93 obsidian (kind 0 the horns: rough black glass, red-hot ridges and tip, uGlow2 the flare; kind 1 a black-fire crystal: violet-black glass, smouldering fractures, light circulating inside, uGlow alive, uGlow2 a pulse), 94 claws, 95 columnar basalt (the throne, the crystals' feet), 96 lava light (eyes, mouth); uFx = cooled to a dark statue. Its own light: a dim warm key, the lava's orange bounce from below, a hot rim
    float heat = clamp(uGlow, 0.0, 2.5) * (1.0 - uFx), ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime;
    vec3 fireA = vec3(1.0, 0.22, 0.025), fireB = vec3(1.8, 0.92, 0.3), bfC = vec3(0.55, 0.1, 0.95);
    float fl = 0.84 + 0.16 * sin(tt * 6.3 + L.x * 5.0 + L.z * 3.0) * sin(tt * 2.9 + L.y * 4.0);
    if (id == 92 || id == 96) {
      float f1 = vn(L.xz * 3.1 + L.y * 1.7 + vec2(tt * 0.32, -tt * 0.45)), f2 = vn(L.yz * 7.3 + L.x * 2.1 + vec2(-tt * 0.55, tt * 0.33)), f = f1 * 0.62 + f2 * 0.38; vec3 c;
      if (id == 92) { float crust = smoothstep(0.5, 0.7, vn(L.xy * 4.1 + L.z * 2.2 + vec2(tt * 0.07, tt * 0.05))) * (1.0 - smoothstep(0.9, 1.7, heat));
        c = mix(fireA * 0.85, fireB, smoothstep(0.2, 0.85, f) * (0.4 + 0.6 * ndv0)) * (0.18 + 0.8 * heat);
        float vein = smoothstep(0.07, 0.0, abs(f2 - 0.5)); c = mix(c, vec3(0.05, 0.022, 0.018) + fireA * 0.06 * heat, crust * 0.88) + fireA * vein * crust * heat * 0.9;
        c += fireB * pow(ndv0, 3.0) * 0.2 * heat; }
      else c = mix(fireA, fireB * 1.2, 0.3 + 0.55 * f) * (0.25 + 0.85 * heat) * fl;
      c = mix(c, vec3(0.035, 0.03, 0.03), uFx * 0.96);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float w1 = vn(L.xy * 3.1 + L.z * 1.9), w2 = vn(L.yz * 9.0 + L.x * 4.1), w3 = vn(L.xz * 23.0 + L.y * 9.0);
    vec3 a = vec3(0.1), emi = vec3(0.0); float rg = 0.85, F0s = 0.04, cvv = 0.0, cc = 0.0, occ = ao, bfk = clamp(uSpill, 0.0, 1.0) * (1.0 - uFx);
    if (id == 90) {   // basalt plate
      a = vec3(0.135, 0.112, 0.1) * (0.62 + 0.62 * w1); a *= mix(0.5, 1.0, smoothstep(0.28, 0.72, w2));
      if (uLow < 0.5) { n = normalize(n + (vec3(vn(L.yz * 12.0), vn(L.zx * 12.0 + 3.0), vn(L.xy * 12.0 + 7.0)) - 0.5) * 0.42 + (vec3(w3, vn(L.yx * 23.0 + 1.0), vn(L.zy * 23.0 + 2.0)) - 0.5) * 0.18);
        float ves = vn(L.xy * 34.0 + L.z * 19.0); if (ves > 0.72) cvv += (ves - 0.72) * 3.2;
        float rope = sin(L.x * 15.0 + L.z * 10.0 + L.y * 4.0 + w1 * 7.0); cvv += smoothstep(0.8, 1.0, rope) * 0.35; }
      a = mix(a, vec3(0.3, 0.27, 0.255), smoothstep(0.3, 0.9, hm) * 0.5 * smoothstep(0.35, 0.75, w1));   // (ash settled on the tops)
      float seam = smoothstep(0.5, 1.0, edge), sk = seam * seam;
      emi += mix(fireA, fireB, sk) * sk * (0.12 + 0.95 * heat) * fl;
      emi = mix(emi, mix(bfC, fireA, 0.25) * sk * 1.4, bfk * 0.75) + bfC * bfk * (0.05 + 0.2 * pow(1.0 - ndv0, 2.0));
      float crk = smoothstep(0.03, 0.0, abs(vn(L.xy * 5.5 + L.z * 3.7) - 0.5)) + smoothstep(0.022, 0.0, abs(vn(L.yz * 9.0 + L.x * 2.0) - 0.5)) * 0.7; emi += fireB * crk * uGlow2 * step(uKind, 1.5) * (0.6 + 0.6 * fl);
      a *= 1.0 - 0.35 * sk; }
    else if (id == 91) {   // basalt flesh, fissured
      a = vec3(0.078, 0.064, 0.06) * (0.68 + 0.55 * w1);
      float fz = abs(vn(L.xy * 4.4 + L.z * 3.3) - 0.5) + abs(vn(L.yz * 5.6 + L.x * 2.1 + 4.0) - 0.5) * 0.7, fis = smoothstep(0.075, 0.012, fz);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 10.0), vn(L.zx * 10.0 + 3.0), vn(L.xy * 10.0 + 7.0)) - 0.5) * 0.48);
      emi += mix(fireA, fireB, fis * 0.55) * fis * (0.1 + 0.95 * heat) * fl; a *= 1.0 - 0.7 * fis; cvv += fis * 0.3;
      emi += bfC * bfk * fis * 0.5;
      a = mix(a, vec3(0.24, 0.22, 0.21), smoothstep(0.4, 0.95, hm) * 0.35 * w2); }
    else if (id == 93 && uKind > 0.5 && uKind < 1.5) {   // a black-fire crystal growth
      float alive = clamp(uGlow, 0.0, 1.5); occ = 1.0; a = vec3(0.028, 0.012, 0.05); rg = 0.1; F0s = 0.07; cc = 0.9;
      float fpos = 1.0 - ao, circ = vn(vec2(L.x * 2.2 + L.y * 1.3, L.z * 1.6 - tt * 0.7)), fr = smoothstep(0.035, 0.0, abs(vn(L.xy * 4.0 + L.z * 2.5) - 0.5)) + smoothstep(0.03, 0.0, abs(vn(L.zx * 6.0 + L.y * 3.0 + 9.0) - 0.5)) * 0.6;
      emi += mix(vec3(0.35, 0.05, 0.75), vec3(1.0, 0.25, 0.08), smoothstep(0.35, 0.8, circ)) * (0.1 + 0.55 * smoothstep(0.3, 0.9, circ)) * alive * (0.4 + 0.6 * ndv0);
      emi += mix(fireA, fireB, 0.3) * fr * alive * 1.1 * fl + vec3(0.6, 0.35, 1.0) * smoothstep(0.85, 1.0, edge) * 0.18 * (0.3 + alive);
      emi += bfC * clamp(uGlow2, 0.0, 1.0) * smoothstep(0.2, 0.9, fract(fpos * 1.5 - tt * 0.9)) * 0.9 * alive; }
    else if (id == 93) {   // the horns: rough black glass, red-hot ridges, a burning tip
      occ = 1.0; a = vec3(0.03, 0.026, 0.026); rg = 0.34 + 0.3 * w2; F0s = 0.05; cc = 0.25;
      if (uLow < 0.5) { float rip = sin(length(L.xz - vec2(0.3, 1.0)) * 70.0 + w1 * 9.0); n = normalize(n + (vec3(w3, vn(L.yx * 30.0), vn(L.zy * 30.0)) - 0.5) * 0.3 + vec3(rip, -rip, rip) * 0.05); }
      float tipk = 1.0 - ao, hot = max(smoothstep(0.7, 1.0, edge) * (0.5 + 0.5 * tipk), smoothstep(0.7, 1.0, tipk)), fk = clamp(uGlow2, 0.0, 1.5);
      emi += mix(fireA, fireB, hot * hot * (0.45 + 0.5 * fk)) * hot * (0.7 + 0.7 * heat + 1.8 * fk) * fl;
      emi += bfC * bfk * hot * 0.6; }
    else if (id == 94) { occ = max(occ, 0.8); a = vec3(0.03, 0.024, 0.028); rg = 0.18; F0s = 0.06; cc = 0.5; emi += fireA * 0.08 * heat; }
    else if (id == 95) {   // columnar basalt: the throne and the crystals' feet
      a = vec3(0.12, 0.1, 0.092) * (0.6 + 0.55 * w1); a *= mix(0.6, 1.0, smoothstep(0.3, 0.7, w2));
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 8.0), vn(L.zx * 8.0 + 3.0), vn(L.xy * 8.0 + 7.0)) - 0.5) * 0.3);
      a = mix(a, vec3(0.3, 0.27, 0.25), smoothstep(0.5, 0.95, hm) * 0.55 * w1); cvv += smoothstep(0.85, 1.0, edge) * 0.35;
      float fz = abs(vn(L.xz * 3.0 + L.y * 2.0) - 0.5), fis = smoothstep(0.03, 0.005, fz); emi += fireA * fis * heat * 0.7 * fl; }
    else { a = vec3(0.1); }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl = max(0.0, dot(n, uLK)) * oSH, below = max(0.0, -hm), side = 1.0 - abs(hm);
    vec3 key = vec3(1.3, 1.08, 0.92), bounce = vec3(1.0, 0.33, 0.08) * (0.6 + 0.25 * heat) * (1.0 - uFx * 0.6), ambC = mix(vec3(0.15, 0.065, 0.05), vec3(0.15, 0.13, 0.15), 0.5 + 0.5 * hm);
    vec3 col = a * (ndl * key * 1.25 + ambC * occ + (below * 0.9 + side * 0.25) * bounce * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl;
    float fres = F0s + (1.0 - F0s) * pow(1.0 - ndv0, 5.0) * (1.0 - rg * 0.7);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP); vec3 envC = mix(vec3(1.0, 0.32, 0.07) * (0.5 + 0.3 * heat) * (1.0 - uFx * 0.7), vec3(0.08, 0.055, 0.06), smoothstep(-0.4, 0.25, ru));
    col += (envC * fres * (1.4 / (1.0 + rg * 3.0)) + spec * key * fres * 3.0) * occ;
    if (cc > 0.0) col += cc * (pow(nh, 260.0) * 5.0 * ndl + 0.6 * pow(1.0 - ndv0, 4.0) * envC) * occ;
    col += pow(1.0 - ndv0, 2.2) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.6 * occ * (1.0 - uFx * 0.6);
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - uFx);
    if (uFx > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.95, 0.92, 0.9), uFx * 0.7); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</CAL-IFRIT-MAT>*/
  /*<BEL-KHARROX-MAT ids 100..104 (v391 B3: 20t3-belfry-kharrox.js)>*/
  else if (id >= 100 && id <= 104) {   // ---- Kharrox the Bellback (the Drowned Belfry's first boss): 100 tarnished bronze (the bell: verdigris in the hollows and in streaks run down by the sea, wear polished bright on the edges by vA.y, a sea-wet sheen by uSpill; 100.1 its inside; 100.2 the engraved bands, vA.y across the band: waves and bell-script lit turquoise by uGlow2, the toll; 100.3 a fresh break), 101 ivory chitin (vA.y a joint; 101.2 the dark claw tips, vA.z 1 at the root .. 0 at the point), 102 the wet dark-blue underside (photophores lit by uGlow; 102.2 the eye stalk), 103 the turquoise eye (its frame's x the gaze, a slit pupil; uKind 1 a plain sea-glass lamp; uGlow), 104 limestone (the arena's pillars, stained black below; 104.1 barnacles, 104.2 weed). uWear = the part's seed, uFx = dead. Its own light: a cool moon key, the water's turquoise bounce below, purple cloud above, a turquoise rim
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, wet = clamp(uSpill, 0.0, 1.0), dead = clamp(uFx, 0.0, 1.0);
    vec3 TQ = vec3(0.22, 1.2, 1.1);
    if (id == 103) { vec3 c;
      if (uKind > 0.5) { float wq = vn(L.xy * 9.0 + L.z * 5.0 + vec2(tt * 0.6, -tt * 0.4)); c = TQ * (0.45 + 0.75 * uGlow) * (0.7 + 0.4 * wq) * (0.55 + 0.6 * pow(ndv0, 1.5)) + vec3(0.8, 1.0, 1.0) * pow(ndv0, 6.0) * 0.35 * uGlow; }
      else { vec3 p = normalize(L); float fr = smoothstep(0.25, 0.62, p.x), ang = atan(p.z, p.y), rr = length(p.yz), gl = clamp(uGlow, 0.0, 2.5);
        float stri = 0.72 + 0.28 * sin(ang * 21.0 + vn(vec2(ang * 3.0, rr * 9.0)) * 5.0);
        float slit = smoothstep(0.13, 0.06, abs(p.y) / (0.4 + 0.6 * smoothstep(1.0, 0.7, p.x))) * smoothstep(0.62, 0.8, p.x);
        c = mix(vec3(0.015, 0.045, 0.05), TQ * (0.5 + 0.85 * gl) * stri * (0.75 + 0.35 * (1.0 - rr)), fr);
        c = mix(c, vec3(0.004, 0.016, 0.02), slit * 0.94);
        vec3 hq = normalize(uLK + uV); c += vec3(1.0) * pow(max(0.0, dot(n, hq)), 140.0) * 2.4 + pow(1.0 - ndv0, 3.0) * TQ * 0.3 * (0.5 + gl); }
      c = mix(c, vec3(0.05, 0.065, 0.065) * (0.6 + 0.4 * ndv0), dead * 0.92);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float w1 = vn(L.xy * 3.3 + L.z * 1.7 + sd), w2 = vn(L.yz * 9.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 27.0 + L.y * 13.0 + sd);
    vec3 a = vec3(0.1), F0c = vec3(0.04), emi = vec3(0.0); float rg = 0.6, mt = 0.0, cvv = 0.0, cc = 0.0, occ = ao;
    if (id == 100) {   // bronze: tarnish, verdigris, wear, the engraving, the wet
      float ang = atan(L.y, L.x), hz = L.z, wr = smoothstep(0.45, 0.95, edge) * (0.55 + 0.45 * w3);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 13.0 + sd), vn(L.zx * 13.0 + 3.0), vn(L.xy * 13.0 + 7.0)) - 0.5) * 0.13);   // (cast and hammered: never dead smooth)
      float st1 = vn(vec2(ang * 8.0 + sd, hz * 1.4)), st2 = vn(vec2(ang * 21.0 - sd, hz * 3.2)), streak = st1 * 0.6 + st2 * 0.4;   // (verdigris run down the wall by the sea)
      float pk = clamp(smoothstep(0.5, 0.8, streak + 0.3 * (w2 - 0.5)) * 0.85 + smoothstep(0.75, 0.0, hz) * 0.45 * w1 + (1.0 - ao) * 0.4, 0.0, 1.0);
      if (sk == 1) { pk = max(pk, 0.5 + 0.4 * w1); wr *= 0.5; }
      if (sk == 2) { float bv = clamp(edge, 0.0, 1.0), au = ang / 6.2832 * 30.0, rimL = min(bv, 1.0 - bv), sw = sin(au * 3.1416 + sd);
        float grv = smoothstep(0.075, 0.03, abs(bv - 0.5 - 0.22 * sw)) + smoothstep(0.06, 0.025, abs(bv - 0.5 + 0.22 * sw)) * step(0.5, fract(au * 0.25 + 0.1));   // (a running wave and its braided echo)
        float dots = smoothstep(0.07, 0.035, length(vec2((fract(au * 0.5) - 0.5) * 0.9, bv - 0.5)));   // (a ring of bell-script in each trough)
        float lip = smoothstep(0.12, 0.03, rimL), eng = min(1.0, grv + dots);
        cvv += eng * 0.85; pk = max(pk * 0.7, eng * 0.75); wr = max(wr * 0.25, lip * 0.95);
        emi += TQ * eng * clamp(uGlow2, 0.0, 2.5) * (0.55 + 0.45 * sin(tt * 13.0 - au * 0.9)) * 1.5; }
      if (sk == 3) { pk = 0.0; wr = 0.75 + 0.25 * w3; }
      mt = 1.0 - pk * 0.92;
      a = mix(vec3(0.2, 0.13, 0.07) * (0.7 + 0.5 * w1), mix(vec3(0.13, 0.36, 0.31), vec3(0.32, 0.58, 0.47), w3) * (0.7 + 0.45 * w2), pk);
      F0c = mix(vec3(0.4, 0.26, 0.13) * (0.8 + 0.35 * w2), vec3(0.98, 0.7, 0.4), wr); rg = mix(mix(0.46, 0.2, wr), 0.88, pk);
      float drip = smoothstep(0.62, 0.9, vn(vec2(ang * 34.0 + sd, hz * 0.9 - tt * 0.05))) * wet;   // (the sea running off it)
      rg = mix(rg, rg * 0.45, wet * 0.6); cc = wet * (0.25 + 0.6 * drip) * (1.0 - wr * 0.5); a *= 1.0 - 0.25 * wet;
      emi += TQ * clamp(uGlow2, 0.0, 2.5) * 0.04 * (1.0 - pk); }
    else if (id == 101) {   // ivory chitin: growth lines, a faint mottle, darker joints, a wet gloss; dark tips
      a = vec3(0.8, 0.74, 0.62) * (0.82 + 0.28 * w1); rg = 0.34 - 0.12 * wet; F0c = vec3(0.045); cc = 0.45 + 0.45 * wet;
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 19.0 + sd), vn(L.zx * 19.0 + 3.0), vn(L.xy * 19.0 + 7.0)) - 0.5) * 0.08);
      float gln = abs(fract(L.x * 7.0 + w1 * 1.3) - 0.5); a *= 1.0 - 0.1 * smoothstep(0.08, 0.0, gln);
      float spot = smoothstep(0.68, 0.82, vn(L.xy * 16.0 + L.z * 7.0 + sd)); a = mix(a, vec3(0.62, 0.42, 0.3), spot * 0.45);
      a = mix(a, vec3(0.42, 0.33, 0.27), smoothstep(0.4, 1.0, edge) * 0.65);
      a *= 0.72 + 0.28 * smoothstep(-0.6, 0.4, hm);
      emi += vec3(1.0, 0.86, 0.72) * clamp(uGlow2, 0.0, 2.0) * (0.1 + 0.65 * pow(1.0 - ndv0, 2.0) + 0.3 * smoothstep(0.4, 1.0, edge));   // (v398 B3: uGlow2, the great claw's tell: light gathering at its rim)
      if (sk == 2) { float tk = smoothstep(0.75, 0.2, ao); a = mix(a, vec3(0.07, 0.05, 0.055), tk); rg = mix(rg, 0.18, tk); cc = max(cc, 0.8 * tk); occ = 1.0; } }
    else if (id == 102) {   // the wet dark-blue underside: granular, glossy, a few photophores; the eye stalk ringed
      a = vec3(0.025, 0.05, 0.12) * (0.7 + 0.5 * w1); rg = 0.32 - 0.16 * wet; F0c = vec3(0.05); cc = 0.7 + 0.6 * wet;
      if (uLow < 0.5) { n = normalize(n + (vec3(vn(L.yz * 15.0 + sd), vn(L.zx * 15.0 + 3.0), vn(L.xy * 15.0 + 7.0)) - 0.5) * 0.3); cvv += smoothstep(0.6, 0.85, w3) * 0.3; }
      float ph = smoothstep(0.86, 0.94, vn(L.xy * 6.5 + L.z * 4.0 + sd)); emi += TQ * ph * (0.12 + 0.6 * clamp(uGlow, 0.0, 2.0)) * (0.7 + 0.3 * sin(tt * 2.0 + sd));
      a = mix(a, vec3(0.06, 0.1, 0.18), smoothstep(0.2, 0.9, hm) * 0.3 * w2);
      if (sk == 2) { a = vec3(0.1, 0.15, 0.22) * (0.8 + 0.3 * w1); cvv += smoothstep(0.1, 0.0, abs(fract(L.x * 9.0) - 0.5)) * 0.5; } }
    else {   // 104 limestone, stained black below, pitted; barnacles; weed
      a = vec3(0.7, 0.71, 0.63) * (0.78 + 0.3 * w1) * (0.9 + 0.15 * w2); rg = 0.82; F0c = vec3(0.04);
      if (uLow < 0.5) { n = normalize(n + (vec3(vn(L.yz * 9.0 + sd), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.2); float pit = vn(L.xy * 31.0 + L.z * 17.0); if (pit > 0.75) cvv += (pit - 0.75) * 2.0; }
      float stain = smoothstep(0.55, 0.12, L.z + (w2 - 0.5) * 0.15); a = mix(a, vec3(0.05, 0.07, 0.07), stain * 0.88); rg = mix(rg, 0.35, stain * wet); cc = stain * wet * 0.5;
      a = mix(a, vec3(0.5, 0.56, 0.5), smoothstep(0.5, 0.8, vn(L.xy * 4.0 + L.z * 6.0 + sd)) * 0.18 * (1.0 - stain));
      cvv += smoothstep(0.85, 1.0, edge) * 0.25;
      if (sk == 1) { a = vec3(0.74, 0.73, 0.68) * (0.8 + 0.3 * w3); rg = 0.7; cvv += smoothstep(0.6, 1.0, 1.0 - ao) * 0.8; occ = 1.0; }
      else if (sk == 2) { a = vec3(0.04, 0.11, 0.06) * (0.7 + 0.5 * w1); rg = 0.3; cc = 0.7; } }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl = max(0.0, dot(n, uLK)) * oSH;
    vec3 key = vec3(1.15, 1.2, 1.32), ambC = mix(vec3(0.07, 0.26, 0.27), vec3(0.2, 0.17, 0.3), 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ) * uAmb;
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl;
    vec3 Fr = F0c + (1.0 - F0c) * pow(1.0 - ndv0, 5.0) * (1.0 - rg * 0.7);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(vec3(0.05, 0.2, 0.22), vec3(0.42, 0.4, 0.55), smoothstep(-0.35, 0.35, ru)) + vec3(0.95, 1.0, 1.05) * 1.8 * smoothstep(0.84, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);   // (the dark sea below, the cloud above, the moon's highlight)
    vec3 col = a * (1.0 - mt) * (ndl * key + ambC) + F0c * mt * (ndl * key * 0.55 + ambC * 0.5) + (envC * (1.3 / (1.0 + rg * 2.5)) * occ + spec * key * 1.5) * Fr;
    if (cc > 0.0) col += cc * (pow(nh, 300.0) * 5.0 * ndl + 0.45 * pow(1.0 - ndv0, 4.0) * envC) * occ;
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.5 * occ;
    col *= 1.0 - min(0.82, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.86, 0.9) * 0.75, dead * 0.6); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</BEL-KHARROX-MAT>*/
  /*<BEL-ULDROTH-MAT ids 110..116 (v391 B5)>*/
  else if (id >= 110 && id <= 116) {   // ---- Uldroth the Drowned Herald (B5, the Belfry, 20t5): 110 wet slate-green skin (pores, nodules, folds, a wet clear coat), 110.2 the mouth's wet dark flesh (lit turquoise from the throat), 110.3 drowned limestone (islands, the bell's piers: pale, dark-teal block seams, stained black below uWear), 111 the pale grey underside (ventral pleats), 112 the throat sac seen through its slits (translucent turquoise, uGlow its inflation), 113 the lure (an emissive bulb; uGlow2 its pulse), 113.3 an eye (black glass, a turquoise glint), 114 bone (teeth, fin rays), 114.3 tarnished bronze (the bell, the valves; uGlow a valve's light), 115 gill-fin membrane (thin, lit through from behind), 116 the sea (uKind 0 the open sea, 1 the flood over the platform; uGlow sunlight, uGlow2 foam, uSpill the flood's depth). uSpill on the others = the sunlight of the victory; uFx = death (the light leaves, the skin dulls)
    float sub = vA.x - float(id), tt = uTime, ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), dth = clamp(uFx, 0.0, 1.0);
    vec3 tq = vec3(0.24, 0.86, 0.83), tqH = vec3(0.75, 1.45, 1.35), sunC = vec3(1.25, 0.82, 0.45);
    float thr = clamp(uGlow, 0.0, 2.5) * (1.0 - dth);
    if (id == 112 || (id == 113 && sub < 0.15)) {   // the throat's light and the lure: emissive, turbulent, pulsing
      float f1 = vn(L.xy * 5.0 + L.z * 3.0 + vec2(tt * 0.6, -tt * 0.45)), f2 = vn(L.yz * 11.0 + L.x * 4.0 + vec2(-tt * 0.9, tt * 0.7)); vec3 c;
      if (id == 112) { float vein = smoothstep(0.06, 0.0, abs(f2 - 0.5)), k = (0.3 + 0.95 * thr) * (0.7 + 0.5 * f1);
        c = mix(tq * 0.5, tqH, smoothstep(0.3, 0.9, f1) * (0.35 + 0.65 * ndv0)) * k; c *= 1.0 - 0.5 * vein; c += tqH * pow(ndv0, 4.0) * 0.4 * thr; }
      else { float pul = 0.75 + 0.25 * sin(tt * 3.1) + 0.6 * clamp(uGlow2, 0.0, 1.5), core = pow(ndv0, 2.2);
        c = mix(tq * 0.9, vec3(1.3, 1.65, 1.55), core) * (0.55 + 0.9 * thr) * pul * (0.85 + 0.3 * f1) + tqH * pow(1.0 - ndv0, 3.0) * 0.5 * thr; }
      c = mix(c, vec3(0.05, 0.07, 0.07) * (0.6 + 0.4 * f1), dth * 0.95);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 116) {   // the sea: drifting swells and chop (a height field read three times for its normal), the purple sky and the moon in it, light through the crests, foam
      vec2 p = L.xy * 3.2, q1 = p + vec2(0.05, 0.0), q2 = p + vec2(0.0, 0.05); float sn = clamp(uGlow, 0.0, 1.0);
      float h0 = sin(dot(p, vec2(0.9, 0.45)) * 2.0 + tt * 1.1) * 0.5 + sin(dot(p, vec2(-0.35, 1.0)) * 3.1 - tt * 1.4) * 0.3 + vn(p * 2.3 + vec2(tt * 0.35, tt * 0.2)) * 0.9 + vn(p * 7.0 - vec2(tt * 0.6, -tt * 0.4)) * 0.22;
      float h1 = sin(dot(q1, vec2(0.9, 0.45)) * 2.0 + tt * 1.1) * 0.5 + sin(dot(q1, vec2(-0.35, 1.0)) * 3.1 - tt * 1.4) * 0.3 + vn(q1 * 2.3 + vec2(tt * 0.35, tt * 0.2)) * 0.9 + vn(q1 * 7.0 - vec2(tt * 0.6, -tt * 0.4)) * 0.22;
      float h2 = sin(dot(q2, vec2(0.9, 0.45)) * 2.0 + tt * 1.1) * 0.5 + sin(dot(q2, vec2(-0.35, 1.0)) * 3.1 - tt * 1.4) * 0.3 + vn(q2 * 2.3 + vec2(tt * 0.35, tt * 0.2)) * 0.9 + vn(q2 * 7.0 - vec2(tt * 0.6, -tt * 0.4)) * 0.22;
      vec3 wn = normalize(vec3(-(h1 - h0) * 2.4, -(h2 - h0) * 2.4, 1.0)); float ndv = max(0.03, dot(wn, uV)); vec3 r = 2.0 * dot(wn, uV) * wn - uV;
      vec3 sky = mix(vec3(0.32, 0.22, 0.44), vec3(0.08, 0.06, 0.16), smoothstep(0.0, 0.75, r.z)); sky = mix(sky, vec3(1.15, 0.74, 0.42), sn * 0.75);
      float F = 0.03 + 0.97 * pow(1.0 - ndv, 5.0), crest = smoothstep(0.55, 1.1, h0);
      vec3 c = mix(vec3(0.025, 0.1, 0.15), vec3(0.07, 0.235, 0.32), clamp(0.5 + 0.35 * h0, 0.0, 1.0)) * (0.55 + 0.45 * max(0.0, dot(wn, uLK)));
      c += tq * crest * 0.16; c = mix(c, sky, F * 0.85);
      vec3 hh0 = normalize(uLK + uV); float nh0 = max(0.0, dot(wn, hh0)); c += (vec3(0.8, 1.0, 1.05) + sunC * sn) * pow(nh0, 220.0) * 3.0 + tqH * pow(nh0, 40.0) * 0.1;
      float fm = clamp(uGlow2, 0.0, 1.5) * smoothstep(0.62, 0.92, vn(p * 4.0 + vec2(-tt * 0.8, tt * 0.5)) * 0.6 + crest * 0.6); c = mix(c, vec3(0.85, 0.95, 0.98), clamp(fm, 0.0, 1.0) * 0.8);
      c = mix(c, c * vec3(1.15, 0.95, 0.75) + sunC * 0.08, sn);
      float a = clamp(ao, 0.0, 1.0); if (uKind > 0.5) { float dep = clamp(uSpill, 0.0, 3.0); a *= max(clamp(0.2 + dep * 0.55, 0.0, 0.92), clamp(fm, 0.0, 1.0) * 0.8); }
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * a * uAlpha, a * uAlpha); return; }
    float w1 = vn(L.xy * 3.3 + L.z * 2.1), w2 = vn(L.yz * 8.7 + L.x * 3.9), w3 = vn(L.xz * 24.0 + L.y * 11.0), w4 = vn(L.yx * 47.0 + L.z * 19.0), sun = clamp(uSpill, 0.0, 1.0);
    vec3 a = vec3(0.1), emi = vec3(0.0), F0m = vec3(0.04); float rg = 0.5, F0s = 0.04, cvv = 0.0, cc = 0.0, occ = ao, mtl = 0.0;
    if (id == 110 && sub < 0.1) {   // the hide: slate green, mottled, darker blotches, pale specks; nodules, pores and folds; wet in streaks
      a = vec3(0.13, 0.2, 0.17) * (0.72 + 0.5 * w1); a = mix(a, vec3(0.06, 0.1, 0.09), smoothstep(0.55, 0.8, w2) * 0.7); a += vec3(0.05, 0.07, 0.06) * smoothstep(0.8, 0.95, w3);
      if (uLow < 0.5) { n = normalize(n + (vec3(vn(L.yz * 14.0), vn(L.zx * 14.0 + 3.0), vn(L.xy * 14.0 + 7.0)) - 0.5) * 0.36 + (vec3(w4, vn(L.zy * 47.0 + 2.0), vn(L.xz * 47.0 + 5.0)) - 0.5) * 0.14);
        cvv += smoothstep(0.72, 0.9, w4) * 0.45; float fold = abs(sin(L.z * 17.0 + w1 * 5.0)); cvv += smoothstep(0.12, 0.0, fold) * 0.25 * smoothstep(0.3, -0.2, hm); }
      float wet = 0.5 + 0.5 * smoothstep(0.3, 0.7, vn(L.xz * 2.2 + L.y * 1.7 + vec2(0.0, tt * 0.05)));
      rg = mix(0.6, 0.15, wet); cc = 0.6 * wet; emi += tq * thr * 0.05 * max(0.0, -hm); }
    else if (id == 110 && sub < 0.25) { a = vec3(0.07, 0.028, 0.038) * (0.7 + 0.6 * w1); rg = 0.16; cc = 0.85; emi += tq * (0.06 + 0.32 * thr) * (0.5 + 0.5 * w2); }   // the mouth
    else if (id == 110) {   // drowned limestone: big blocks, dark teal seams, worn; black-stained and wet below the tide line (uWear)
      vec3 an = abs(NL); vec2 uv = an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz; float row = floor(uv.y / 0.36), fu = fract(uv.x / 0.62 + mod(row, 2.0) * 0.5), fv = fract(uv.y / 0.36), dm = min(min(fu, 1.0 - fu) * 0.62, min(fv, 1.0 - fv) * 0.36);
      float hc = hs(vec2(floor(uv.x / 0.62 + mod(row, 2.0) * 0.5), row));
      a = vec3(0.8, 0.82, 0.74) * (0.8 + 0.25 * w1 + 0.1 * hc); rg = 0.78; cvv += smoothstep(0.03, 0.0, dm) * 0.6;
      a = mix(a, vec3(0.1, 0.24, 0.24), smoothstep(0.022, 0.0, dm) * 0.8);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 9.0), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.25);
      float stain = smoothstep(uWear + 0.35, uWear - 0.55, L.z + (w2 - 0.5) * 0.4); a = mix(a, vec3(0.05, 0.075, 0.08), stain * 0.88); rg = mix(rg, 0.3, stain); cc += stain * 0.3;
      a = mix(a, vec3(0.2, 0.32, 0.22), smoothstep(0.62, 0.85, w2) * stain * 0.5); }   // (algae in the stain)
    else if (id == 111) {   // the underside: pale grey, ventral pleats, wet
      a = vec3(0.4, 0.42, 0.4) * (0.8 + 0.3 * w1); float pl = abs(fract(atan(L.y, L.x + 0.001) * 2.6 + w1 * 0.6) - 0.5); cvv += smoothstep(0.08, 0.0, pl) * 0.4;
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 16.0), vn(L.zx * 16.0 + 3.0), vn(L.xy * 16.0 + 7.0)) - 0.5) * 0.22);
      rg = 0.32; cc = 0.4; emi += tq * thr * 0.06 * (0.4 + 0.6 * max(0.0, -hm)); }
    else if (id == 113) { a = vec3(0.008); rg = 0.05; cc = 1.0; F0s = 0.06; emi += tq * (0.25 + 0.4 * thr) * pow(ndv0, 6.0) + tqH * 0.04; occ = 1.0; }   // an eye
    else if (id == 114 && sub < 0.15) { a = vec3(0.64, 0.61, 0.5) * (0.82 + 0.3 * w2); rg = 0.28; cc = 0.5; occ = max(occ, 0.7); emi += tq * thr * 0.03; }   // bone
    else if (id == 114) {   // tarnished bronze with verdigris
      a = vec3(0.36, 0.26, 0.13) * (0.7 + 0.5 * w1); F0m = vec3(0.78, 0.55, 0.3) * (0.75 + 0.3 * w2); mtl = 1.0; rg = 0.34 + 0.2 * w3;
      float pat = smoothstep(0.5, 0.8, w2 * 0.65 + max(0.0, hm) * 0.35 + w1 * 0.25); a = mix(a, vec3(0.16, 0.4, 0.34), pat); mtl = 1.0 - pat; rg = mix(rg, 0.8, pat);
      cvv += smoothstep(0.85, 1.0, edge) * 0.5; emi += tq * clamp(uGlow, 0.0, 2.0) * (0.25 + 0.75 * smoothstep(0.7, 1.0, edge)) * 0.6; }
    else if (id == 115) {   // the gill fins' membrane: thin, ribbed (edge = near a ray), lit through from behind, torn
      a = vec3(0.1, 0.17, 0.16) * (0.75 + 0.45 * w1); float ray = smoothstep(0.6, 1.0, edge); a *= 1.0 - 0.35 * ray; cvv += smoothstep(0.04, 0.0, abs(w2 - 0.5)) * 0.3;
      rg = 0.32; cc = 0.4; emi += vec3(0.08, 0.36, 0.33) * (0.2 + 0.8 * max(0.0, -dot(n, uLK))) * (1.0 - 0.7 * ray) * 0.45 + tq * thr * 0.12 * (1.0 - ray); }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl = max(0.0, dot(n, uLK)) * oSH, below = max(0.0, -hm), side = 1.0 - abs(hm), ndv1 = max(0.0, dot(n, uV));
    vec3 key = mix(vec3(0.85, 0.94, 1.12), sunC, sun) * 1.6, sea = vec3(0.09, 0.3, 0.32) * (1.0 + 0.6 * sun), ambC = mix(mix(vec3(0.05, 0.09, 0.1), vec3(0.17, 0.13, 0.24), 0.5 + 0.5 * hm), vec3(0.22, 0.17, 0.12), sun * 0.6);
    vec3 col = a * (1.0 - mtl * 0.85) * (ndl * key + ambC * occ * 1.6 + (below * 0.85 + side * 0.25) * (sea + tq * thr * 0.22) * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl;
    vec3 F0v = mix(vec3(F0s), F0m, mtl), fres = F0v + (vec3(1.0) - F0v) * pow(1.0 - ndv1, 5.0) * (1.0 - rg * 0.7);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP); vec3 envC = mix(mix(vec3(0.05, 0.16, 0.19), vec3(0.3, 0.22, 0.44), smoothstep(-0.35, 0.3, ru)), vec3(1.0, 0.7, 0.42), sun * 0.6);
    col += (envC * fres * (1.4 / (1.0 + rg * 3.0)) + spec * key * fres * 2.6) * occ;
    if (cc > 0.0) col += cc * (pow(nh, 300.0) * 6.0 * ndl + 0.5 * pow(1.0 - ndv1, 4.0) * envC) * occ;
    col += pow(1.0 - ndv1, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.55 * occ * (1.0 - dth * 0.5);
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dth);
    if (dth > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.9, 0.95, 0.95), dth * 0.6); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</BEL-ULDROTH-MAT>*/
  /*<BEL-NHALU-MAT ids 105..109 (v391 B4)>*/
  else if (id >= 105 && id <= 109) {   // ---- Nhalu the Lantern Eel (B4, the Belfry, 20t4): 105 skin (a wet iridescent indigo back, a milk-white belly lit through, by the part's own normal NL.z; ao = its place along the body, 0 the snout .. 1 the tail; edge = a segment joint's crease; uGlow = the amber the lit bulbs spill on it; uSpill = electric charge crawling over it; uGlow2 = dried out (beached); uFx = dead), 106 fins and whiskers (a membrane lit through its edge; edge = the rays), 107 a lantern bulb (amber glass lit from within: uGlow its light 0..2.5; uKind its symbol 1 ring, 2 triangle, 3 diamond, seen through the top of the glass), 108 the mouth's wet flesh (108.3 an eye: black glass with an amber glint), 109 a bulb's socket collar (dark nacre, its lip lit by uGlow)
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, dead = clamp(uFx, 0.0, 1.0), sub = vA.x - float(id), ndl0 = dot(n, uLK);
    vec3 amb1 = vec3(1.0, 0.56, 0.14), amb2 = vec3(1.75, 1.2, 0.6), volt = vec3(0.5, 0.9, 1.7), hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh));
    if (id == 107) {   // the lantern: glass lit from inside, its symbol a brighter filament, a slow swirl in the light
      vec3 q = NL; float lit = clamp(uGlow, 0.0, 2.5) * (1.0 - dead); vec2 p = q.xy * 1.25; float d = 1.0;
      if (uKind > 0.5 && uKind < 1.5) d = abs(length(p) - 0.42);
      else if (uKind > 1.5 && uKind < 2.5) { vec2 r = vec2(p.x, p.y + 0.1); d = abs(max(abs(r.x) * 0.866 + r.y * 0.5, -r.y) - 0.24); }
      else if (uKind > 2.5) d = abs(abs(p.x) + abs(p.y) * 1.15 - 0.46);
      float sym = (1.0 - smoothstep(0.045, 0.095, d)) * smoothstep(0.15, 0.5, q.z);
      float sw = vn(L.xy * 9.0 + vec2(tt * 0.6, -tt * 0.4)) * 0.5 + vn(L.yz * 15.0 - vec2(tt * 0.3, tt * 0.7)) * 0.5;
      float L1 = min(lit, 1.0), L2 = max(0.0, lit - 0.8); vec3 core = vec3(1.8, 0.78, 0.12) * (0.45 + 0.75 * L1) + vec3(1.4, 1.2, 0.55) * L2 * 0.9, rimc = vec3(0.55, 0.16, 0.02) * (0.5 + 0.6 * L1);
      vec3 c = mix(rimc, core, pow(ndv0, 0.9)) * (0.85 + 0.3 * sw);
      c += amb2 * sym * (0.12 + 1.1 * lit) + vec3(1.6, 1.45, 1.15) * sym * max(0.0, lit - 1.0) * 0.8 - amb1 * sym * 0.1 * (1.0 - min(lit, 1.0));
      c = mix(c, vec3(0.05, 0.03, 0.02), dead);
      float fr = pow(1.0 - ndv0, 3.0);
      c += vec3(0.45, 0.7, 0.85) * fr * 0.5 + pow(nh, 180.0) * 3.0 * max(0.0, ndl0) + fr * max(0.0, dot(n, uLR) + 0.3) * uRim * 0.3;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float w1 = vn(L.xy * 3.0 + L.z * 2.1 + ao * 9.0), w3 = vn(L.yz * 17.0 + L.x * 6.0);
    vec3 a = vec3(0.1), emi = vec3(0.0); float rg = 0.4, F0s = 0.04, cc = 0.0, cvv = 0.0, sss = 0.0, iri = 0.0;
    float dry = clamp(uGlow2, 0.0, 1.0), chg = clamp(uSpill, 0.0, 1.5), spill = clamp(uGlow, 0.0, 2.0);
    float vein = smoothstep(0.05, 0.0, abs(vn(L.xy * 4.0 + L.z * 3.0 + vec2(tt * 3.1, ao * 30.0)) - 0.5)), flick = step(0.35, vn(vec2(tt * 14.0, ao * 20.0 + L.z * 3.0)));
    if (id == 105) {   // skin
      float top = smoothstep(-0.42, 0.18, NL.z);
      vec3 ind = vec3(0.05, 0.045, 0.15) * (0.72 + 0.56 * w1), milk = vec3(0.8, 0.78, 0.72) * (0.92 + 0.12 * w3);
      float mot = smoothstep(0.55, 0.78, vn(L.xy * 6.0 + vec2(ao * 23.0, 0.0))) * top; ind *= 1.0 - 0.45 * mot;
      float lat = 1.0 - smoothstep(0.02, 0.07, abs(NL.z + 0.1));
      a = mix(milk, ind, top); a = mix(a, vec3(0.42, 0.48, 0.62), lat * 0.4); a *= 1.0 - 0.55 * edge; cvv += edge * 0.35;
      a = mix(a, a * 0.82 + vec3(0.06, 0.06, 0.07), dry * 0.6);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 14.0), vn(L.zx * 14.0 + 3.0), vn(L.xy * 14.0 + 7.0)) - 0.5) * (0.08 + 0.2 * dry));
      rg = mix(mix(0.42, 0.2, top), 0.62, dry); cc = (1.0 - dry) * (0.95 * top + 0.5 * (1.0 - top)); iri = top * (1.0 - dry); sss = 1.0 - top;
      emi += amb1 * spill * top * 0.11 * (0.6 + 0.4 * ndv0) + amb1 * spill * (1.0 - top) * 0.05;
      emi += volt * vein * chg * (0.45 + 0.8 * flick); }
    else if (id == 106) {   // fin membrane, whiskers
      float ray = smoothstep(0.35, 0.5, abs(fract(edge * 7.0) - 0.5));
      a = mix(vec3(0.07, 0.06, 0.19), vec3(0.22, 0.3, 0.5), 0.35 * (1.0 - ray)); a *= 0.8 + 0.3 * w1; rg = 0.3; cc = 0.55; sss = 0.7; iri = 0.6;
      emi += (vec3(0.25, 0.55, 0.65) * 0.12 + amb1 * spill * 0.08) * pow(1.0 - ndv0, 1.5) + volt * vein * chg * 0.4 * flick; }
    else if (id == 108) {   // wet flesh; 108.3 an eye
      if (sub > 0.2) { a = vec3(0.008, 0.008, 0.012); rg = 0.04; F0s = 0.08; cc = 1.4; emi += amb1 * 0.25 * smoothstep(0.7, 0.95, ndv0) * (0.3 + 0.7 * (1.0 - dead)); }
      else { a = vec3(0.17, 0.05, 0.08) * (0.8 + 0.4 * w1); rg = 0.22; cc = 0.85; sss = 0.4; emi += amb1 * 0.05 * spill; } }
    else {   // 109 the collar: dark ridged nacre, its lip lit by its bulb
      float rid = 0.5 + 0.5 * sin(L.z * 70.0 + w1 * 4.0); a = vec3(0.06, 0.05, 0.12) * (0.7 + 0.5 * w1) * (0.8 + 0.3 * rid); rg = 0.26; cc = 0.7; iri = 0.8;
      emi += amb2 * edge * spill * 0.55 * (1.0 - dead) + amb1 * spill * 0.04; }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); }
    float ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.5) / 1.5) * oSH, below = max(0.0, -hm), side = 1.0 - abs(hm);
    vec3 key = vec3(1.05, 1.08, 1.18), sky = mix(vec3(0.06, 0.08, 0.15), vec3(0.16, 0.18, 0.3), 0.5 + 0.5 * hm), bounce = vec3(0.1, 0.42, 0.46);
    vec3 col = a * (mix(ndl, wrap, sss) * key * 1.3 + sky * oAO + (below * 0.85 + side * 0.2) * bounce * oAO);
    col += sss * a * vec3(1.0, 0.82, 0.72) * (0.16 * (1.0 - ndl) + 0.4 * pow(max(0.0, dot(uV, -uLK)), 2.0) * (1.0 - ndv0)) * oAO;   // (light through the belly)
    float pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, fres = F0s + (1.0 - F0s) * pow(1.0 - ndv0, 5.0) * (1.0 - rg * 0.7);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP); vec3 envC = mix(vec3(0.08, 0.32, 0.36), vec3(0.3, 0.3, 0.5), smoothstep(-0.3, 0.4, ru));
    vec3 film = 0.5 + 0.5 * cos(6.2832 * (vec3(0.0, 0.33, 0.67) + ndv0 * 1.1 + w1 * 0.25)), tint = mix(vec3(1.0), film * 1.5, iri * 0.55);
    col += (envC * fres * (1.4 / (1.0 + rg * 3.0)) + spec * key * fres * 3.0) * tint * oAO;
    if (cc > 0.0) col += cc * (pow(nh, 220.0) * 4.5 * ndl + 0.5 * pow(1.0 - ndv0, 4.0) * envC * tint) * oAO;
    col += pow(1.0 - ndv0, 2.2) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.6 * oAO;
    col *= 1.0 - min(0.8, cvv * 0.5);
    col += emi * (1.0 - dead * 0.85);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.85, 0.95), dead * 0.75); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</BEL-NHALU-MAT>*/
  /*<BEL-VARKUL-MAT ids 117..119 (v391 B2: 20t2-belfry-varkul.js)>*/
  else if (id >= 117 && id <= 119) {   // ---- Varkul, the Chainbound (the east trial's mini boss): 117 wet blue-black hide (mottled, folded; 117.3 the pale grey-blue belly), 118 metal (118.0 worn bronze rings with verdigris, 118.2 the brass clapper and its chain, 118.4 ivory teeth), 119 coral light (uKind 0 the throat, by uGlow2 the breath's wind-up; uKind 1 the eyes, by uGlow). uWear = the part's seed, uFx = dying. Its light: a cool moon key, the sea's teal bounce from below, a turquoise rim
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), sd = uWear * 23.0, dead = clamp(uFx, 0.0, 1.0);
    if (id == 119) { float fl = 0.85 + 0.3 * vn(L.xy * 14.0 + L.z * 7.0 + vec2(uTime * 1.7, -uTime * 1.1)); vec3 c;
      if (uKind > 0.5) c = mix(vec3(1.2, 0.32, 0.18), vec3(1.9, 1.3, 0.85), pow(ndv0, 4.0)) * (0.55 + 0.7 * uGlow) * fl;
      else { float g2 = clamp(uGlow2, 0.0, 1.5), slit = 0.6 + 0.4 * sin(L.y * 40.0 + uTime * 3.0); c = mix(vec3(0.16, 0.05, 0.06), mix(vec3(1.5, 0.36, 0.22), vec3(2.0, 1.15, 0.75), g2 * g2 * 0.5) * slit, smoothstep(0.0, 0.35, g2)) * fl * (0.4 + 0.6 * pow(ndv0, 0.7)) + vec3(1.4, 0.4, 0.25) * pow(1.0 - ndv0, 2.0) * g2 * 0.5; }
      c *= 1.0 - dead * 0.8; gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float w1 = vn(L.xy * 3.1 + L.z * 2.3 + sd), w2 = vn(L.yz * 8.0 + L.x * 5.0 + sd * 0.7), w3 = vn(L.xz * 29.0 + L.y * 15.0 + sd);
    vec3 a = vec3(0.04), F0c = vec3(0.04); float rg = 0.5, mt = 0.0, cvv = 0.0, cc = 0.0;
    if (id == 117) {
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 6.0 + sd), vn(L.zx * 6.0 + 3.0), vn(L.xy * 6.0 + 7.0)) - 0.5) * 0.22);   // (folds and creases in the hide)
      float fold = smoothstep(0.45, 0.0, abs(fract(L.x * 4.5 + w1 * 0.8) - 0.5)) * 0.35;
      if (sk >= 3) { a = vec3(0.26, 0.3, 0.34) * (0.8 + 0.35 * w2); rg = 0.55; cvv += fold * 0.4; }
      else { a = vec3(0.022, 0.034, 0.052) * (0.75 + 0.6 * w1); float spot = smoothstep(0.62, 0.8, vn(L.xy * 7.0 + L.z * 3.0 + sd)); a = mix(a, vec3(0.06, 0.09, 0.12), spot * 0.7); a = mix(a, vec3(0.14, 0.18, 0.2), smoothstep(-0.2, -0.75, hm) * 0.6); rg = 0.28 + 0.2 * w3; cc = 0.85; cvv += fold; }
      F0c = vec3(0.045); }
    else {
      if (sk >= 4) { a = vec3(0.82, 0.77, 0.64) * (0.85 + 0.2 * w2); F0c = vec3(0.05); rg = 0.42; cvv += smoothstep(0.7, 1.0, w3) * 0.3; }
      else if (sk >= 2) { mt = 1.0; F0c = vec3(0.93, 0.74, 0.38) * (0.8 + 0.25 * w2); rg = 0.26 + 0.25 * w1; a = F0c * 0.25; float tarn = smoothstep(0.55, 0.85, w1 * 0.7 + w3 * 0.4); F0c = mix(F0c, vec3(0.32, 0.24, 0.12), tarn * 0.7); rg = mix(rg, 0.6, tarn); F0c = mix(F0c, vec3(1.0, 0.86, 0.56), smoothstep(0.6, 1.0, edge) * 0.6); }
      else { mt = 1.0; F0c = vec3(0.72, 0.48, 0.26) * (0.8 + 0.3 * w2); rg = 0.38 + 0.2 * w1; float vg = clamp(smoothstep(0.5, 0.78, w1 * 0.6 + w3 * 0.5) * (1.0 - smoothstep(0.55, 0.95, edge)) + (1.0 - ao) * 0.35, 0.0, 1.0); a = mix(F0c * 0.2, vec3(0.16, 0.42, 0.36) * (0.8 + 0.3 * w3), vg); F0c = mix(F0c, vec3(0.05), vg); rg = mix(rg, 0.85, vg); mt = 1.0 - vg * 0.9; F0c = mix(F0c, vec3(0.98, 0.8, 0.55), smoothstep(0.65, 1.0, edge) * (1.0 - vg) * 0.7); } }
    float ndl = dot(n, uLK), dif = max(0.0, ndl);
    vec3 r = 2.0 * ndv0 * n - uV; float ec; float ev = env(r, rg, ec) * 0.5;
    float fk = pow(1.0 - ndv0, 5.0) * (1.0 - rg * 0.7); vec3 Fr = F0c + (1.0 - F0c) * fk;
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * dif * 0.8;
    vec3 KEY = vec3(1.05, 1.12, 1.22), amb = mix(vec3(0.05, 0.24, 0.27), vec3(0.17, 0.2, 0.3), 0.5 + 0.5 * hm) * (0.55 + 0.45 * ao) * uAmb;
    float aoS = (0.6 + 0.4 * ao) * (1.0 - cvv * 0.6); vec3 col;
    if (mt > 0.5) col = a * (dif * KEY * 0.6 + amb * 0.7) + Fr * (ev * vec3(0.8, 0.95, 1.05) * aoS + spec * KEY) + ec * uRim * Fr * aoS * 0.8;
    else col = a * (dif * KEY + amb) + Fr * (ev * 0.55 * aoS + spec * KEY * 2.0) + ec * uRim * 0.18;
    if (cc > 0.0) col += cc * (pow(nh, 220.0) * 4.0 * max(0.0, ndl) + 0.5 * pow(1.0 - ndv0, 4.0) * ev) * aoS;   // (the wet sheen)
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.55 * ao;
    col *= 1.0 - min(0.8, cvv * 0.45);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.85, 0.95), dead * 0.6); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</BEL-VARKUL-MAT>*/
  /*<FE-DEMON-MAT ids 120..129 (v391 U1: 20k5g-dark-eclipse-demon.js)>*/
  else if (id >= 120 && id <= 126) {   // ---- Final Eclipse's demon knight (v391 U1): 120 obsidian plate faces (glossy volcanic glass, a deep violet sheen, conchoidal ripples; faint violet energy in its cracks and along its rim: uGlow), 121 the rough break round a plate (dark rock, violet magma in its crevices), 122 sinew (dark corded muscle, fibres along the part's x, uKind 1 along z; violet light through its thin edges), 123 horn and claw (polished black; vA.z 1 at the root .. 0 the tip: violet tips with the charge), 124 wing membrane (dark, translucent: violet light through it from behind; vA.y 1 at a bone, vA.z 0 at the free trailing edge: veins, ragged holes), 125 wing bone, 126 light (the eyes, the heart: emissive). uGlow = the seams' light, uGlow2 = the charge (every seam flares), uSpill = the sphere's violet light from above, uFx = dissolving into ash (a burning violet front), uWear = the part's seed
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, dis = clamp(uFx, 0.0, 1.0), chg = clamp(uGlow2, 0.0, 2.0), glo = clamp(uGlow, 0.0, 2.0), sph = clamp(uSpill, 0.0, 2.0), sd = uWear * 13.0;
    vec3 VIO = vec3(0.5, 0.14, 1.1), VIOH = vec3(0.95, 0.6, 1.4);
    float bedge = 0.0;
    if (dis > 0.0) { float bn = vn(L.xy * 6.0 + L.z * 4.3 + sd) * 0.6 + vn(L.yz * 17.0 + L.x * 6.1 + 3.0) * 0.4, th = dis * 1.25 - 0.12; if (bn < th) discard; bedge = 1.0 - smoothstep(0.0, 0.08, bn - th); }
    if (id == 126) { float pul = 0.85 + 0.15 * sin(tt * 6.0 + L.x * 30.0); vec3 c = mix(VIO * 1.3, VIOH * 1.2, 0.35 + 0.5 * pow(ndv0, 2.0)) * (0.6 + 0.5 * glo + 0.9 * chg) * pul + VIOH * bedge;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float w1 = vn(L.xy * 3.3 + L.z * 2.1 + sd), w2 = vn(L.yz * 8.7 + L.x * 3.9 + sd), w3 = vn(L.xz * 21.0 + L.y * 8.0);
    vec3 a = vec3(0.02), emi = vec3(0.0); float rg = 0.5, F0s = 0.04, cc = 0.0, occ = ao, thin = 0.0, alK = 1.0;
    if (id == 120) {   // the glass: near black, a violet depth under the gloss, rippled like a fracture face
      a = vec3(0.011, 0.009, 0.017) * (0.8 + 0.4 * w1); rg = 0.05 + 0.07 * w2; F0s = 0.06; cc = 1.0; occ = max(occ, 0.75);
      if (uLow < 0.5) { float rip = sin(dot(L, vec3(37.0, 23.0, 29.0)) + w1 * 11.0); n = normalize(n + (vec3(w2, vn(L.zx * 8.7 + 2.0), vn(L.xy * 8.7 + 5.0)) - 0.5) * 0.1 + vec3(rip, -rip, rip * 0.5) * 0.02); }
      float crk = smoothstep(0.03, 0.0, abs(vn(L.xy * 7.0 + L.z * 3.1 + sd) - 0.5)) * smoothstep(0.4, 0.7, vn(L.zx * 2.3 + L.y + sd)), seam = smoothstep(0.8, 1.0, edge);
      emi += VIO * (crk * 0.6 + seam * seam * 0.3) * (0.35 + 0.8 * glo + 1.3 * chg);
      emi += vec3(0.06, 0.02, 0.14) * pow(1.0 - ndv0, 1.5) * (0.4 + 0.6 * glo); }   // (the deep violet sheen at grazing angles)
    else if (id == 121) {   // the break: rough rock, magma in its crevices
      a = vec3(0.04, 0.034, 0.045) * (0.55 + 0.65 * w1); rg = 0.75; F0s = 0.035; occ *= 0.85;
      if (uLow < 0.5) n = normalize(n + (vec3(w3, vn(L.yx * 21.0 + 1.0), vn(L.zy * 21.0 + 2.0)) - 0.5) * 0.6);
      float cr = smoothstep(0.09, 0.0, abs(vn(L.xy * 11.0 + L.z * 7.0 + sd) - 0.5)) + smoothstep(0.06, 0.0, abs(vn(L.yz * 17.0 + L.x * 5.0 + 4.0) - 0.5)) * 0.6, puls = 0.7 + 0.3 * sin(tt * 2.1 + L.z * 7.0 + w1 * 6.0);
      emi += mix(VIO, VIOH, min(1.0, cr) * 0.35) * min(1.2, cr) * (0.4 + 0.95 * glo + 1.6 * chg) * puls; a *= 1.0 - 0.6 * min(1.0, cr); }
    else if (id == 122 || id == 125) {   // sinew and wing bone: corded dark muscle, a violet light through its thin edges
      float ang = uKind > 0.5 ? atan(NL.y, NL.x) : atan(NL.z, NL.y), fib = 0.5 + 0.5 * sin(ang * 14.0 + w1 * 4.0 + (uKind > 0.5 ? L.z : L.x) * 3.0), fib2 = 0.5 + 0.5 * sin(ang * 37.0 + w2 * 5.0);
      a = vec3(0.034, 0.024, 0.042) * (0.7 + 0.45 * w2) * (0.72 + 0.4 * fib * (0.6 + 0.4 * fib2)); rg = id == 125 ? 0.3 : 0.4 - 0.12 * fib; F0s = 0.04; thin = 1.0; cc = id == 125 ? 0.35 : 0.15;
      if (uLow < 0.5) n = normalize(n + (vec3(w3, vn(L.yx * 19.0 + 1.0), vn(L.zy * 19.0 + 2.0)) - 0.5) * 0.18);
      emi += VIO * smoothstep(0.86, 1.0, fib2 * fib) * 0.05 * (0.4 + glo + chg); }
    else if (id == 123) {   // horn and claw: polished black, violet tips
      float tip = 1.0 - ao; occ = 1.0; a = vec3(0.012, 0.01, 0.016); rg = 0.12 + 0.12 * w2; F0s = 0.06; cc = 0.7;
      if (uLow < 0.5) { float rg2 = sin(tip * 60.0 + w1 * 4.0); n = normalize(n + vec3(rg2, -rg2, rg2) * 0.03); }
      emi += mix(VIO, VIOH, tip) * smoothstep(0.55, 1.0, tip) * (0.15 + 0.35 * glo + 1.4 * chg); }
    else {   // the membrane (a moving mesh: its pattern follows the panel's own u (vA.z = 1 - u: from the root .. the free edge) and v (vA.y: across), the panel in vA.x's tenths (0 the inner panel to the flank, 1..3 between the fingers))
      float pu = 1.0 - ao, pv = edge, pnl = floor((vA.x - 124.0) * 10.0 + 0.5); occ = 1.0;
      float free = pnl < 0.5 ? pv * smoothstep(0.0, 0.25, pu) : pu, bone = pnl < 0.5 ? max(0.0, 1.0 - pv * 6.0) : max(0.0, 1.0 - min(pv, 1.0 - pv) * 10.0);
      vec2 q = vec2(pu * 5.0 + pnl * 3.7, pv * 3.0 + pnl * 1.3 + sd);
      float hn = vn(q * 2.3) * 0.65 + vn(q * 6.1 + 3.0) * 0.35; if (free > 0.62 && hn > 0.86 - (free - 0.62) * 0.75 && bone < 0.35) discard;
      float vein = smoothstep(0.05, 0.0, abs(vn(q * vec2(0.45, 2.6) + 2.0) - 0.5)) + smoothstep(0.035, 0.0, abs(vn(q * vec2(1.1, 4.0) + 7.0) - 0.5)) * 0.55;
      a = vec3(0.03, 0.02, 0.04) * (0.75 + 0.4 * w1); rg = 0.48; F0s = 0.035; cc = 0.25; thin = 1.0 - bone * 0.6;
      float back = max(0.0, dot(-n, uLR)) * 0.75 + 0.25 + max(0.0, dot(-n, uUP)) * 0.3, rimTear = smoothstep(0.75, 1.0, free) * smoothstep(0.5, 0.86, hn);
      emi += VIO * back * (0.16 + 0.42 * sph + 0.16 * glo) * thin * (1.0 - 0.75 * min(1.0, vein)) * (0.75 + 0.5 * w2) + VIOH * rimTear * 0.25 * (0.3 + sph);
      a *= 1.0 + 0.6 * min(1.0, vein); alK = mix(0.8, 0.97, max(bone, min(1.0, vein))) * (1.0 - 0.25 * smoothstep(0.7, 1.0, free)); }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl = max(0.0, dot(n, uLK)) * oSH, up = max(0.0, hm);
    vec3 key = vec3(1.25, 1.18, 1.32), ambC = mix(vec3(0.07, 0.045, 0.1), vec3(0.2, 0.17, 0.26), 0.5 + 0.5 * hm) * uAmb, sphC = vec3(0.45, 0.16, 1.0) * sph;
    vec3 col = a * (ndl * key * 1.35 + ambC * occ + up * up * sphC * occ);
    if (thin > 0.0) col += VIO * thin * pow(1.0 - ndv0, 3.0) * (0.06 + 0.12 * sph + 0.1 * chg);   // (light through the thin edges of muscle and skin)
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl;
    float fres = F0s + (1.0 - F0s) * pow(1.0 - ndv0, 5.0) * (1.0 - rg * 0.7);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(vec3(0.025, 0.02, 0.035), mix(vec3(0.17, 0.15, 0.22), vec3(0.42, 0.18, 0.9) * (0.35 + 0.9 * sph), smoothstep(0.4, 0.95, ru)), smoothstep(-0.35, 0.15, ru));   // (dark ground, a grey-violet sky, the sphere overhead)
    float sb = smoothstep(0.9, 0.975, dot(rr, normalize(uLK + vec3(0.0, 0.0, 0.25))));   // (a soft studio window caught in the glass)
    col += (envC * fres * (1.6 / (1.0 + rg * 3.0)) + spec * key * fres * 3.0 + sb * fres * vec3(0.92, 0.9, 1.0) * 2.2 / (1.0 + rg * 9.0)) * occ;
    if (cc > 0.0) col += cc * (pow(nh, 320.0) * 7.0 * ndl + 0.5 * pow(1.0 - ndv0, 4.0) * envC) * occ;
    col += pow(1.0 - ndv0, 2.2) * max(0.0, dot(n, uLR) + 0.45) * uRim * (0.85 + 0.35 * sph) * occ;
    col *= 1.0 - (1.0 - occ) * 0.45;
    col += emi + VIOH * bedge * (1.6 + 0.6 * sin(tt * 23.0 + L.x * 9.0));
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha * alK, uAlpha * alK); return; }
  /*</FE-DEMON-MAT>*/
  /*<DS-SKULL-MAT ids 130..134 (v391 U4: 20k5k2-dark-deadscream-skull.js)>*/
  else if (id >= 130 && id <= 134) {   // ---- Dead Scream's skull (v391 U4), shaded exactly as its 2D picture (20k5k buildSkull): its five-step obsidian ramp (near black to a cold lilac grey) in soft cel bands from a light at the upper left, a tight obsidian highlight broken by noise and a broad sheen, a violet bounce rim from below right and a cold one top left, the holes sunk to void with a restrained violet depth, a soft ink edge; the socket and nose light added by uGlow; uSpill the crumble's threshold. 130 bone (vA.x - 130 = 0.3 x the depth in a hole), 131 a fragment, 133 a tooth, 134 obsidian (the crown); uKind 2 at Celestial (the layered holes), 1 a fragment in flight
    vec3 q = L; float sub = vA.x - float(id), CEL = step(1.5, uKind);
    vec3 EX = normalize(cross(uV, uUP)), EY = cross(uV, EX);   // (the screen's right and down)
    vec3 nm = normalize(uM0 * NL.x + uM1 * NL.y + uM2 * NL.z); if (dot(nm, n) < 0.0) nm = -nm;
    float nx = dot(nm, EX), ny = dot(nm, EY), nzv = max(0.0, dot(nm, uV));
    vec3 Ls = normalize(EX * -0.5 + EY * -0.62 + uV * 0.6), Hs = normalize(Ls + uV); float ndl = max(0.0, dot(nm, Ls)), ndh = max(0.0, dot(nm, Hs));
    vec2 p2 = vec2(q.x, -q.z);   // (the 2D picture's own units: x right, y down from the brow)
    float n1 = vn(p2 * 7.0 + vec2(3.0, 0.0)), n2 = vn(p2 * 23.0 + vec2(0.0, 7.0));
    float cav = id == 130 ? clamp(sub / 0.3, 0.0, 1.0) : 0.0, hm = pow(smoothstep(0.0, 0.55, cav), 0.8), hq = 1.0 - smoothstep(0.0, 0.4, hm), ao2 = id == 131 || id == 134 ? 1.0 : max(0.22, mix(0.35, 1.0, ao)), TM = id == 133 ? 1.0 : 0.0;
    float bands = 0.25 * smoothstep(0.08, 0.22, ndl) + 0.35 * smoothstep(0.38, 0.52, ndl) + 0.4 * smoothstep(0.7, 0.82, ndl);
    float bb = clamp(0.08 + 0.9 * ((0.62 * bands + 0.38 * ndl) * (0.82 + 0.3 * n1) * ao2 + 0.22 * TM * (0.4 + ndl)), 0.0, 1.0) * 4.0;
    vec3 RA = vec3(8.0, 5.0, 15.0), RB = vec3(22.0, 11.0, 40.0), RC = vec3(43.0, 18.0, 66.0), RD = vec3(80.0, 64.0, 100.0), RE = vec3(138.0, 124.0, 158.0);
    vec3 col = bb < 1.0 ? mix(RA, RB, bb) : bb < 2.0 ? mix(RB, RC, bb - 1.0) : bb < 3.0 ? mix(RC, RD, bb - 2.0) : mix(RD, RE, bb - 3.0);
    float n4 = ndh * ndh * ndh * ndh, spec = pow(ndh, 34.0) * (0.45 + 0.55 * n2) * ao2 * hq * (id == 134 ? 1.8 : 1.0), sheen = n4 * ndh * ndh * 0.1 * ao2;
    col += vec3(210.0, 194.0, 255.0) * spec + vec3(120.0, 100.0, 170.0) * sheen;
    float fr = pow(1.0 - nzv, 2.2) * (0.25 + 0.75 * hq), rim = fr * clamp(0.25 + ny * 0.9 + nx * 0.35, 0.0, 1.0) * (0.6 + 0.4 * ao2) * 0.75, cold = fr * clamp(-ny * 0.8 - nx * 0.5, 0.0, 1.0) * 0.25;
    col += vec3(140.0, 70.0, 230.0) * rim + vec3(120.0, 110.0, 150.0) * cold;
    if (hm > 0.0) { float k = hm * 0.92; if (CEL > 0.5) k *= 0.82 + 0.18 * cos(hm * 9.4248); col = mix(col, RA, k); col += vec3(109.0, 40.0, 168.0) * pow(hm, 3.0) * (CEL > 0.5 ? 0.3 : 0.22); }
    col *= 0.28 + 0.72 * smoothstep(0.0, 0.28, nzv);   // (the soft ink edge, so it reads on a bright floor)
    col /= 255.0;
    if (id == 134) col += vec3(0.647, 0.361, 1.0) * smoothstep(0.75, 1.0, edge) * 0.22 * (0.4 + 0.6 * clamp(uGlow, 0.0, 1.0));   // (the crown's facet edges catch the violet)
    if (id == 131) col = mix(vec3(0.0941, 0.0431, 0.1804) * (0.75 + 0.6 * ndl), col, 0.25);   // (a fragment: the 2D's dark body)
    if (cav > 0.02) { float isN = (1.0 - smoothstep(0.1, 0.2, abs(q.x))) * (1.0 - smoothstep(-0.3, -0.24, q.z)), sk = cav * (1.0 - 0.4 * isN), lc0 = pow(sk, 1.6), lc1 = pow(sk, 3.0), lc2 = pow(sk, 6.0);   // (the socket and nose light: deep violet to lavender toward the back)
      col += min(vec3(1.0), (vec3(109.0, 40.0, 168.0) * lc0 * 0.7 + vec3(165.0, 92.0, 255.0) * lc1 * 0.5 + vec3(208.0, 174.0, 255.0) * lc2 * 0.6) / 255.0) * clamp(lc0 * 1.2, 0.0, 1.0) * uGlow; }
    float aK = 1.0;
    if (uSpill > 0.001) { float nzd = vn(p2 * 3.9 + vec2(7.0, 0.0)) * 0.62 + vn(p2 * 12.2) * 0.18 + clamp((1.47 + q.z) / 2.85, 0.0, 1.0) * 0.2, e2 = nzd - uSpill * 1.05; if (e2 < 0.0) discard; float k2 = smoothstep(0.0, 0.07, e2); col += vec3(0.745, 0.392, 1.0) * (1.0 - k2); aK = smoothstep(0.0, 0.02, e2) * 0.7 + 0.3 * k2; }   // (the crumble, as the 2D's: a violet ember line at its edge)
    col = min(col, vec3(1.0)); float aOut = uAlpha * aK; gl_FragColor = vec4(col * aOut, aOut); return; }
  /*</DS-SKULL-MAT>*/
  /*<DOOM-MAT ids 135..139 (v391 U2: 20k5f-dark-ult-5.js)>*/
  else if (id >= 135 && id <= 139) {   // ---- Doomsday's meteor (v391 U2): 135 the core (craggy obsidian: near-black volcanic glass, conchoidal ripples, sharp glints on the facets, a network of violet-hot fissures; vA.y a facet ridge, vA.z how proud the surface stands: 0 deep in a crevice .. 1 a peak), 136 a broken chunk of it (the same, its fissures cooling with uFx). uGlow the fissures' heat, uGlow2 the impact's white-hot flare, uSpill the ground's violet light from below, uWear a per-part seed
    float heat = clamp(uGlow, 0.0, 3.0) * (1.0 - clamp(uFx, 0.0, 1.0)), ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 7.31, prd = clamp(ao, 0.0, 1.0), rid = clamp(edge, 0.0, 1.0);
    vec3 VIO = vec3(0.5, 0.09, 1.05), VIOH = vec3(1.05, 0.62, 1.5), WH = vec3(1.25, 1.12, 1.45);
    float w1 = vn(L.xy * 2.6 + L.z * 1.7 + sd), w2 = vn(L.yz * 3.3 + L.x * 2.1 + 4.0 + sd), w3 = vn(L.zx * 9.0 + L.y * 6.0 + sd);
    float f1 = abs(vn(L.xy * 3.4 + L.z * 2.7 + w2 * 1.5 + sd) - 0.5), f2 = abs(vn(L.zx * 4.6 + L.y * 3.1 + w1 * 1.3 + 7.0 + sd) - 0.5) * 1.12, f3 = abs(vn(L.yz * 7.5 + L.x * 5.2 + w3 * 0.6 + 2.0 + sd) - 0.5) * 1.5;
    float fz = min(min(f1, f2), f3 + 0.02), fis = smoothstep(0.05, 0.006, fz) * (0.55 + 0.45 * smoothstep(0.2, 0.7, 1.0 - prd)), halo = smoothstep(0.17, 0.0, fz);
    float fl = 0.82 + 0.18 * sin(tt * 6.7 + L.x * 7.0 + L.y * 5.0) * sin(tt * 3.1 + L.z * 6.0 + sd);
    // obsidian: black glass with a violet depth, rippled like a fracture face, rougher in the crevices
    vec3 a = vec3(0.016, 0.012, 0.024) * (0.75 + 0.5 * w1); float rg = mix(0.32, 0.07, prd) + 0.12 * w3, F0s = 0.055;
    if (uLow < 0.5) { float rip = sin((L.x * 0.7 + L.y * 0.5 + L.z * 0.6) * 38.0 + w2 * 10.0); n = normalize(n + (vec3(w3, vn(L.yx * 9.0 + 3.0 + sd), vn(L.zy * 9.0 + 5.0 + sd)) - 0.5) * 0.22 + vec3(rip, -rip * 0.6, rip * 0.4) * 0.035 * prd); }
    float ndv = max(0.0, dot(n, uV)), ndl = max(0.0, dot(n, uLK)), below = max(0.0, -dot(n, uUP));
    vec3 key = vec3(0.85, 0.82, 1.0), ambC = mix(vec3(0.03, 0.02, 0.05), vec3(0.09, 0.07, 0.13), 0.5 + 0.5 * hm);
    vec3 col = a * (ndl * key * 1.2 + ambC + VIO * below * uSpill * 0.9);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl;
    float fres = F0s + (1.0 - F0s) * pow(1.0 - ndv, 5.0) * (1.0 - rg * 0.6);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(VIO * (0.12 + 0.5 * uSpill), mix(vec3(0.05, 0.04, 0.08), vec3(0.22, 0.14, 0.4), smoothstep(0.3, 0.95, ru)), smoothstep(-0.4, 0.1, ru));   // (a violet ground below, a dark storm sky above)
    float sb = smoothstep(0.92, 0.985, dot(rr, normalize(uLK + vec3(0.0, 0.0, 0.3))));   // (a sharp glint on each glassy facet)
    col += (envC * fres * 1.5 + spec * key * fres * 3.2 + sb * fres * vec3(0.9, 0.86, 1.0) * 2.4 / (1.0 + rg * 8.0)) * (0.35 + 0.65 * prd);
    col += vec3(0.75, 0.62, 1.0) * smoothstep(0.55, 1.0, rid) * pow(1.0 - ndv, 1.5) * 0.12 * (0.4 + prd);   // (a cold sheen along the facet ridges)
    col += pow(1.0 - ndv, 2.2) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.55;
    col *= 0.55 + 0.45 * smoothstep(0.0, 0.5, prd);   // (crevices deep and dark)
    // the light inside: violet-hot fissures, white at their hearts, bleeding into the glass round them, deep crevices lit
    float hot = heat * fl, core = fis * fis;
    col += mix(VIO, VIOH, smoothstep(0.3, 1.0, core * hot * 0.8)) * fis * hot * (0.55 + 0.5 * ndv0) + WH * core * smoothstep(0.9, 2.2, hot) * 0.6;
    col += VIO * halo * halo * hot * 0.16 * (0.4 + 0.6 * ndv0) + VIO * (1.0 - smoothstep(0.0, 0.45, prd)) * hot * 0.22;
    if (id == 136) col += vec3(0.9, 0.2, 0.55) * fis * clamp(uFx, 0.0, 1.0) * (1.0 - clamp(uFx, 0.0, 1.0)) * 1.4;   // (a chunk's fissures cool through a deep magenta to nothing)
    float flare = clamp(uGlow2, 0.0, 1.5); col = mix(col, WH * (0.8 + 0.4 * fis), clamp(flare * (0.35 + 0.5 * fis + 0.25 * (1.0 - ndv0)), 0.0, 1.0));
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</DOOM-MAT>*/
  /*<DB-DUNE-MAT ids 360..389 (v433 DB: 20y2-oneira-gl.js Oneira the Listening Shell, 20y3-thulammon-gl.js Thul-Ammon the Sand Kraken)>*/
  else if (id >= 360 && id <= 389) {   // ---- (v433 DB) Rift 03's second and third bosses. Their passes (DUNE3) carry the key light's colour in uAmb and the rim's in uRim (the dusk under the jaw, or the moonlit night); vW.z is the height over the sand. 360 the shell (vA.y the seam's nearness, vA.z along the coil, 0 its heart .. 1 the opening: bleached bone banded with basalt flames, fine growth lines, a nacre sheen, its seam humming cyan by uSpill; 360.2 a resonance pore: cyan light by uGlow, pulsing round the coil; 360.4 the lip: polished bone, nacre on its inner side; 360.3 the opening's depths: dark nacre glowing cyan by uGlow, vA.y how deep), 361 soft wet flesh (the mantle; 361.2 an eye stalk, vA.z along it, its rings lit cyan by uGlow; 361.4 a lid), 362 Oneira's eye (its frame's x the gaze; uKind 1 dizzy), 363 basalt (an echo stone; 363.2 its fossil, lit cyan by uGlow; uKind its cracks 0..1), 364 sand, 370 the kraken's hide (wrinkled violet-grey, wet, crusted with sand toward the ground; 370.2 a lid, 370.4 the brow), 371 its amber eye (uKind the pupil's opening), 372 an arm (vA.y along it 0 the root .. 1 the tip, vA.z round it, 0.75 underneath: suckers down its underside; uGlow amber toward its tip), 373 bone (tips, barnacles, shards), 374 ink (glossy black-violet), 375 an anchor's flesh (amber veins by uGlow; uKind cracks). uGlow2 a blow's flash, uFx dead, uWear the part's seed
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 2.5), dead = clamp(uFx, 0.0, 1.0), gz = vW.z;
    vec3 CY = vec3(0.3, 1.0, 1.1), AM = vec3(1.3, 0.72, 0.2);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    if (id == 362 || id == 371) { vec3 p = normalize(L); float fr0 = smoothstep(-0.05, 0.1, p.x), dz = clamp(uKind, 0.0, 1.5); vec3 c;
      vec3 hq = normalize(uLK + uV); float spc = pow(max(0.0, dot(n, hq)), 160.0) * 2.4 + pow(max(0.0, dot(n, normalize(uLS + uV))), 320.0) * 1.2;
      if (id == 362) { float rr = length(p.yz), ang = atan(p.z, p.y), iris = (1.0 - smoothstep(0.74, 0.8, rr)) * fr0, pupR = 0.26 + 0.12 * dz + 0.015 * sin(tt * 2.1 + sd), pup = (1.0 - smoothstep(pupR - 0.03, pupR, rr)) * fr0;
        float stri = 0.7 + 0.3 * sin(ang * 22.0 + vn(vec2(ang * 3.0, rr * 9.0) + sd) * 5.0);
        vec3 scl = mix(vec3(0.93, 0.95, 0.92), vec3(0.62, 0.5, 0.5), smoothstep(0.3, -0.6, p.x));
        vec3 irc = mix(vec3(0.75, 1.15, 1.15), vec3(0.06, 0.42, 0.5), smoothstep(0.15, 0.62, rr)) * stri * (0.7 + 0.5 * gl);
        c = mix(scl * (0.35 + 0.65 * max(0.0, dot(n, uLK))) * uAmb * 0.8 + 0.12, irc, iris); c = mix(c, vec3(0.02, 0.05, 0.07), pup); c += CY * iris * (1.0 - pup) * gl * 0.4 + CY * smoothstep(0.06, 0.0, abs(rr - 0.71)) * fr0 * (0.55 + 0.9 * gl); }   // (v433 DB: a glowing ring at the iris's edge)
      else { float ry = p.y / 0.6, rz = p.z / 0.6, rr = length(vec2(ry, rz)), ang = atan(rz, ry), iris = (1.0 - smoothstep(0.93, 0.99, rr)) * fr0, pz = 0.045 + 0.22 * dz, pup = (1.0 - smoothstep(0.8, 1.0, length(vec2(ry / 0.86, rz / pz)))) * fr0;   // (v433 DB: a wide iris, a thin horizontal slit)
        float stri = 0.8 + 0.12 * sin(ang * 52.0 + vn(vec2(ang * 5.0, rr * 9.0) + sd) * 7.0) + 0.08 * sin(ang * 17.0 + rr * 6.0) + 0.3 * exp(-(rr - 0.42) * (rr - 0.42) / 0.0036), vei = smoothstep(0.05, 0.0, abs(vn(p.yz * 7.0 + sd) - 0.5)) * smoothstep(0.7, 0.95, length(p.yz)) * (1.0 - iris);
        vec3 scl = mix(vec3(0.9, 0.82, 0.62), vec3(0.45, 0.25, 0.22), smoothstep(0.35, -0.5, p.x)) * (1.0 - 0.45 * vei);
        vec3 irc = mix(vec3(1.35, 0.95, 0.35), vec3(0.75, 0.33, 0.06), smoothstep(0.2, 0.95, rr)) * stri * (0.75 + 0.45 * gl); irc = mix(irc, vec3(0.2, 0.07, 0.02), smoothstep(0.82, 0.98, rr) * 0.85);
        c = mix(scl * (0.3 + 0.7 * max(0.0, dot(n, uLK))) * uAmb * 0.75 + 0.06, irc, iris); c = mix(c, vec3(0.03, 0.01, 0.01), pup); c += AM * iris * (1.0 - pup) * gl * 0.35 * (1.0 - smoothstep(0.3, 0.9, rr)) + AM * smoothstep(0.07, 0.0, abs(rr - 1.02)) * fr0 * (0.25 + 0.4 * gl); }
      c += vec3(1.0) * (spc + (id == 371 ? pow(max(0.0, dot(n, normalize(uV + uLK * 0.7 + vec3(0.0, 0.0, 0.3)))), 90.0) * 1.6 : 0.0)) + pow(1.0 - ndv0, 3.0) * uRim * 0.25 + vec3(1.0, 0.9, 0.85) * clamp(uGlow2, 0.0, 1.0) * 0.3;
      c = mix(c, vec3(0.12, 0.1, 0.1) * (0.5 + 0.5 * ndv0), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.5), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.6, cvv = 0.0, cc = 0.0, occ = 1.0;
    if (id == 360) { float al = clamp(ao, 0.0, 1.0), ang = atan(L.z, L.x);
      if (sk == 2) { float pl = 0.55 + 0.45 * sin(tt * 5.0 - ang * 2.0); a = vec3(0.1, 0.16, 0.18); rg = 0.25; cc = 0.8; emi = CY * (0.2 + gl * 1.1 * pl); }
      else if (sk == 3) { float dp = clamp(edge, 0.0, 1.0), ir = sin(dot(L, vec3(9.0, 7.0, 5.0)) + w2 * 3.0); a = mix(vec3(0.5, 0.62, 0.66), vec3(0.03, 0.05, 0.07), dp); rg = 0.2; cc = 0.6;
        emi = CY * gl * (0.12 + 0.6 * dp) * (0.75 + 0.25 * sin(tt * 3.0 + w1 * 6.0)); thru = (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ir * 2.0)) * 0.12 * (1.0 - dp); }
      else if (sk == 4) { a = mix(vec3(0.95, 0.91, 0.82) * (0.9 + 0.12 * w2), vec3(0.62, 0.8, 0.84), smoothstep(0.3, 0.9, edge)); rg = 0.3; cc = 0.6; emi += CY * edge * 0.08 + (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndv0 * 7.0 + w1 * 4.0)) * edge * 0.1; cvv += smoothstep(0.72, 0.8, w3) * 0.3; }
      else {   // (v433 DB, second pass) the coil: vA.y the rib crest's height, vA.z the rib phase / 3 (its fract x 3: 0 a rib, 0.5 mid-groove)
        float cr = clamp(edge, 0.0, 1.0), gph = fract(ao * 3.0), bph = fract(ao), inl = smoothstep(0.12, 0.03, abs(gph - 0.5)) * (1.0 - smoothstep(0.1, 0.4, cr)) * (0.75 + 0.25 * smoothstep(0.3, 0.6, w2));
        vec3 bone = mix(vec3(0.78, 0.71, 0.56), vec3(0.97, 0.94, 0.86), smoothstep(0.15, 0.9, cr) * 0.75 + w1 * 0.25) * (0.9 + 0.12 * w2);
        float band = smoothstep(0.3, 0.4, bph) * (1.0 - smoothstep(0.62, 0.72, bph)), pit = smoothstep(0.78, 0.84, vn(vec2(dot(L, vec3(17.0, 5.0, 11.0)), dot(L, vec3(-6.0, 15.0, 9.0))) + sd)) * 0.7, chip = smoothstep(0.66, 0.74, vn(L.xz * 9.0 + L.y * 5.0 + sd)) * cr;
        a = mix(bone, vec3(0.6, 0.44, 0.28) * (0.9 + 0.2 * w1), band * 0.5 * (0.5 + 0.5 * cr));   // (banding that follows the ribs: every third a warm umber zone)
        a = mix(a, vec3(0.1, 0.09, 0.12) * (0.8 + 0.4 * w3), inl * 0.85);   // (basalt inlay in the grooves, worn away in places)
        a = mix(a, vec3(0.99, 0.97, 0.91), chip * 0.5); a *= (1.0 - 0.35 * pit) * (0.78 + 0.3 * cr);
        cvv += smoothstep(0.1, 0.0, abs(fract(gph * 7.0) - 0.5)) * 0.14 * (1.0 - cr) + pit * 0.4 + (1.0 - smoothstep(0.0, 0.25, cr)) * 0.12; rg = mix(0.55, 0.38, cr) + chip * 0.25; cc = 0.2 * cr;
        a = mix(a, vec3(0.76, 0.58, 0.34) * (0.85 + 0.2 * w3), smoothstep(-0.25, -0.75, hm) * 0.4);
        emi += (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndv0 * 6.0 + w2 * 3.0)) * pow(1.0 - ndv0, 2.0) * 0.05;
        emi += CY * clamp(uSpill, 0.0, 2.0) * inl * (0.55 + 0.45 * sin(tt * 6.0 - ao * 9.0)); } }
    else if (id == 361) { a = mix(vec3(0.88, 0.66, 0.58), vec3(0.97, 0.83, 0.75), w1) * (0.9 + 0.15 * w2); a = mix(a, vec3(0.6, 0.42, 0.52), smoothstep(0.64, 0.8, w3) * 0.45);
      cvv += clamp(edge, 0.0, 1.0) * 0.32; rg = 0.28; cc = 1.0; thru = vec3(1.0, 0.45, 0.35) * 0.32 + vec3(1.0, 0.42, 0.5) * pow(1.0 - ndv0, 1.6) * 0.45;   // (v433 DB: wet, light through its thin edges)
      float vei = smoothstep(0.06, 0.0, abs(vn(L.xy * 4.0 + L.z * 2.0 + sd) - 0.5));
      if (sk == 2) { float al = clamp(ao, 0.0, 1.0), rng = smoothstep(0.12, 0.0, abs(fract(al * 7.0 - tt * 0.6) - 0.5)) * al; a = mix(a, vec3(0.78, 0.62, 0.66), 0.25); emi += CY * gl * (0.12 + rng * 0.8) * (0.3 + 0.7 * al) + CY * vei * gl * 0.15; }
      else if (sk == 4) { a *= 0.86; cvv += 0.1; }
      else emi += CY * gl * (0.3 * smoothstep(0.2, -0.6, hm) + 0.5 * vei) * (0.7 + 0.3 * sin(tt * 2.0 + w1 * 6.0));
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 7.0 + sd), vn(L.zx * 7.0 + 3.0), vn(L.xy * 7.0 + 7.0)) - 0.5) * 0.18); }
    else if (id == 363) { a = vec3(0.1, 0.095, 0.12) * (0.75 + 0.5 * w1); float ves = smoothstep(0.72, 0.8, w3); cvv += ves * 0.6; rg = 0.55;
      emi += vec3(0.9, 0.95, 1.0) * pow(w3, 24.0) * 0.6 * max(0.0, dot(n, uLK));
      if (sk == 2) { float al = clamp(ao, 0.0, 1.0); a = mix(vec3(0.72, 0.64, 0.5), vec3(0.95, 0.9, 0.78), w2); rg = 0.35; cc = 0.4; cvv = 0.0; emi += CY * gl * (0.35 + 0.65 * (0.5 + 0.5 * sin(tt * 4.0 - al * 12.0))); }
      float ck = clamp(uKind, 0.0, 1.0), crk = smoothstep(0.03 + 0.02 * ck, 0.0, abs(fract(dot(L, vec3(3.0, 4.0, 5.0)) + w2 * 1.6) - 0.5)) * step(0.05, ck) * step(1.0 - ck, w1 + 0.25);
      a = mix(a, vec3(0.02), crk); emi += CY * crk * (0.3 + gl);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 9.0 + sd), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.3); }
    else if (id == 364) { float rp = sin(L.x * 5.0 + L.y * 2.0 + w1 * 3.0); a = (uKind > 1.5 ? vec3(0.36, 0.42, 0.58) : vec3(0.8, 0.6, 0.34)) * (0.86 + 0.2 * w1) * (0.92 + 0.1 * w3); rg = 0.92;   // (uKind 2: the Moonlit Dunes' blue night sand) cvv += 0.12 * smoothstep(0.6, 1.0, rp);
      emi += vec3(1.0, 0.9, 0.7) * pow(w3, 30.0) * 0.5 * max(0.0, dot(n, uLK)); cvv += (1.0 - smoothstep(0.0, 0.32, ao)) * 0.85; }   // (vA.z under 0.3: the shadowed throat of a crater)
    else if (id == 370) { float fz = vn(vec2(L.x * 2.2 + w1 * 1.5, L.z * 5.5 + L.y * 0.8) + sd);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 6.0 + sd), vn(L.zx * 6.0 + 3.0), vn(L.xy * 6.0 + 7.0)) - 0.5) * 0.36 + vec3(0.0, 0.0, (fz - 0.5) * 0.3));
      a = mix(vec3(0.16, 0.12, 0.2), vec3(0.37, 0.31, 0.41), smoothstep(0.2, 0.8, fz)) * (0.85 + 0.25 * w2); a = mix(a, vec3(0.5, 0.43, 0.47), smoothstep(-0.2, -0.8, hm) * 0.5);
      a *= 1.0 - 0.42 * smoothstep(0.66, 0.74, w3 * 0.6 + w1 * 0.5); cvv += smoothstep(0.45, 0.2, fz) * 0.35; rg = 0.36; cc = 0.6;
      { float bl = smoothstep(0.52, 0.68, vn(L.xy * 1.1 + L.z * 0.7 + sd * 0.3)), scr = smoothstep(0.03, 0.0, abs(vn(L.xy * 0.8 + vec2(L.z * 0.6, 3.0)) - 0.5)) * smoothstep(0.55, 0.72, vn(L.yz * 0.6 + 9.0));   // (v433 DB: dark blotches; old pale scars)
        a = mix(a, vec3(0.07, 0.05, 0.1), bl * 0.55); a = mix(a, vec3(0.62, 0.5, 0.56), scr * 0.7); cvv += scr * 0.15; }
      if (sk == 2) { a *= 0.86; cvv += 0.12 * smoothstep(0.5, 1.0, edge); } else if (sk == 4) a *= 0.78; else cvv += clamp(edge, 0.0, 1.0) * 0.6;   // (v433 DB: the dome's creases, deep and dark)
      float cr = (1.0 - smoothstep(0.0, 0.9 + 0.5 * w1, gz)) * smoothstep(0.3, 0.55, w2 + 0.25 * (1.0 - smoothstep(0.0, 0.5, gz))); a = mix(a, vec3(0.7, 0.53, 0.3) * (0.8 + 0.3 * w3), cr); rg = mix(rg, 0.95, cr); cc *= 1.0 - cr;
      emi += AM * gl * 0.18 * (0.6 + 0.4 * w1); }
    else if (id == 372 && sk > 1) { a = sk == 2 ? vec3(0.86, 0.72, 0.74) * (0.9 + 0.15 * w2) : vec3(0.32, 0.14, 0.22) * (0.8 + 0.3 * w1); rg = sk == 2 ? 0.34 : 0.5; cc = 0.7; cvv += sk == 4 ? 0.35 : 0.0; }   // (v433 DB: 372.2 a sucker's rim, 372.4 its cup)
    else if (id == 372) { float al = clamp(edge, 0.0, 1.0), ar = ao * 6.2832, und = smoothstep(0.15, -0.55, sin(ar));
      a = mix(vec3(0.17, 0.12, 0.22), vec3(0.38, 0.31, 0.42), w1) * (0.85 + 0.25 * w2); a = mix(a, vec3(0.72, 0.6, 0.64), und);
      vec2 q2 = vec2(al * 24.0, (ar - 4.7124) / 0.62); float row = floor(q2.y + 0.5); vec2 f2 = vec2(fract(q2.x + 0.5 * row) - 0.5, q2.y - row);
      float cel = length(f2 * vec2(1.0, 1.25)), sz = 0.38 * (1.0 - 0.45 * al), cup = (1.0 - smoothstep(sz - 0.05, sz, cel)) * step(abs(q2.y), 1.55) * und, pit = 1.0 - smoothstep(sz * 0.32, sz * 0.58, cel);
      a = mix(a, vec3(0.88, 0.76, 0.76), cup * smoothstep(sz * 0.5, sz * 0.8, cel) * 0.8); a = mix(a, vec3(0.24, 0.1, 0.16), pit * cup); cvv += pit * cup * 0.5 + smoothstep(0.1, 0.0, abs(fract(al * 38.0 + w1) - 0.5)) * 0.2 * (1.0 - und);
      a *= 1.0 - 0.35 * smoothstep(0.68, 0.75, w3) * (1.0 - und); rg = 0.38; cc = 0.55;
      float cr = (1.0 - smoothstep(0.0, 0.7 + 0.4 * w1, gz)) * smoothstep(0.35, 0.6, w2 + 0.3 * (1.0 - smoothstep(0.0, 0.4, gz))); a = mix(a, vec3(0.7, 0.53, 0.3) * (0.8 + 0.3 * w3), cr); rg = mix(rg, 0.95, cr); cc *= 1.0 - cr;
      emi += AM * gl * smoothstep(0.55, 1.0, al) * 0.7 * (0.75 + 0.25 * sin(tt * 9.0));
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 8.0 + sd), vn(L.zx * 8.0 + 3.0), vn(L.xy * 8.0 + 7.0)) - 0.5) * 0.22); }
    else if (id == 373) { a = mix(vec3(0.8, 0.72, 0.55), vec3(0.96, 0.92, 0.8), w1) * (0.9 + 0.15 * w2); float pts = smoothstep(0.7, 0.78, w3); cvv += pts * 0.5; a *= 1.0 - 0.3 * pts;
      a = mix(a, vec3(0.5, 0.4, 0.28), (1.0 - smoothstep(0.0, 0.45, clamp(ao, 0.0, 1.0))) * 0.35); rg = 0.45; cc = 0.25; }
    else if (id == 374) { a = vec3(0.035, 0.022, 0.055); rg = 0.12; cc = 1.2; emi += (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndv0 * 7.0 + w1 * 4.0)) * pow(1.0 - ndv0, 2.0) * 0.22; }
    else { float vei = smoothstep(0.07, 0.0, abs(vn(L.xy * 3.5 + L.z * 2.0 + sd) - 0.5)); a = mix(vec3(0.22, 0.14, 0.27), vec3(0.44, 0.3, 0.46), w1) * (0.85 + 0.25 * w2); a = mix(a, vec3(0.5, 0.26, 0.12), vei * 0.6);
      emi += AM * vei * (0.12 + 0.9 * gl) * (0.7 + 0.3 * sin(tt * 4.0 + sd)); rg = 0.35; cc = 0.6; thru = vec3(0.6, 0.25, 0.4) * 0.2;
      float ck = clamp(uKind, 0.0, 1.0), crk = smoothstep(0.03 + 0.02 * ck, 0.0, abs(fract(dot(L, vec3(3.0, 4.0, 5.0)) + w2 * 1.6) - 0.5)) * step(0.05, ck) * step(1.0 - ck, w1 + 0.25); a = mix(a, vec3(0.04, 0.02, 0.03), crk); emi += AM * crk * (0.4 + gl);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 6.0 + sd), vn(L.zx * 6.0 + 3.0), vn(L.xy * 6.0 + 7.0)) - 0.5) * 0.25); }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.4) / 1.4) * mix(1.0, oSH, 0.7);
    vec3 key = uAmb, sky = uRim * 0.1 + vec3(0.14, 0.12, 0.15), gnd = vec3(0.3, 0.2, 0.1) * dot(uAmb, vec3(0.33));
    vec3 ambC = mix(gnd, sky, 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(gnd * 0.8, sky * 1.6, smoothstep(-0.35, 0.4, ru)) + key * 0.9 * smoothstep(0.85, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);
    vec3 col = a * (mix(ndl, wrap, 0.45) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (0.04 + 0.96 * frs * (1.0 - rg * 0.6));
    if (cc > 0.0) col += cc * (pow(nh, 200.0) * 3.5 * ndl * key + 0.3 * frs * envC) * occ;
    col += thru * (0.5 + 0.5 * max(0.0, -ndl0)) * key;
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.5 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead * 0.85);
    col += vec3(1.0, 0.92, 0.85) * clamp(uGlow2, 0.0, 1.0) * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.85, 0.8, 0.75) * 0.7, dead * 0.7); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</DB-DUNE-MAT>*/
  /*<SA-SEP-MAT ids 550..569 (v463 SA: 20z1a-threnn-gl.js Threnn the Second Eater, 20z2a-vaul-gl.js Vaul the Mourning Reflection)>*/
  else if (id >= 550 && id <= 569) {   // ---- (v463 SA) Rift 04's first two bosses. Their passes (SEP3) carry the key light's colour in uAmb and the rim's in uRim; 550..559 are lit by the Clockless Halls (a dark hall, the hours' gold bounced from below, gold glints in what they reflect), 560..569 by the Raised Gallery (open sky above, ivory marble below, a white sun). Threnn: 550 blue-black polished stone (mica flecks, veins of gold dust; .2 the dark ribbed flesh between its segments; .4 its legs' jointed stone), 551 a slate plate (engraved with the rings of the hours on its top face, worn bright at its edges (vA.y); .2 a small one, darker), 552 old gold (tarnished in its hollows; .2 polished; uGlow the hours' gold light in it), 553 the enamel dial (its local x-y the face, +y twelve o'clock: crazed enamel, hour bars, minute ticks, a chapter ring; uGlow its violet ring), 554 a blued-steel hand (uGlow: the stopped one burning violet, a white-hot core), 555 the glass (see-through: its own alpha by the fresnel, the halls' glints in it; uKind its cracks 0..1), 556 the sand (its local z the hourglass's axis: kept only up to uKind above the neck and uSpill below it; uWear 1 violet (a borrowed moment) / 0 gold; uGlow its light; .2 not cut). Vaul: 560 polished silver (the diamond: a gold inlay round its face and two bands of the hours' runes lit violet by uGlow, by its own local x-y; .2 plain), 561 gold, 562 the eye (its local +x the gaze: a lilac white, a violet iris of fibres, a slit pupil; uKind 1 a round wide one (bared, dazed)), 563 a silver lid, 564 a spike's steel (flat facets: edges (vA.y) lit by uGlow; .2 violet steel), 565 the hollow's dark nacre (uGlow the eye's light in it), 566 ivory marble (the Loom's plinth), 567 violet cloth woven with silver diamonds (vA.y, vA.z its weave), 568 gold thread (uGlow its light). uKind 9 on 560..565: the echo (a violet glass ghost of it). uGlow2 a blow's flash, uFx dead (ashen), uWear the part's seed
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    bool hall = id < 560;
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, dead = clamp(uFx, 0.0, 1.0), gl = clamp(uGlow, 0.0, 3.0), fa = 1.0;
    vec3 VI = vec3(0.62, 0.4, 1.3), GO = vec3(1.3, 0.92, 0.45);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    vec3 rr0 = 2.0 * dot(n, uV) * n - uV; float ru0 = dot(rr0, uUP);
    vec3 envC = hall ? (ru0 > 0.0 ? mix(vec3(0.2, 0.15, 0.28), vec3(0.035, 0.04, 0.07), smoothstep(0.0, 0.7, ru0)) : mix(vec3(0.2, 0.15, 0.28), vec3(0.22, 0.15, 0.06), smoothstep(0.0, -0.4, ru0))) + GO * 0.7 * pow(vn(rr0.xy * 6.0 + rr0.z * 3.0 + 2.0), 12.0)
                     : (ru0 > 0.0 ? mix(vec3(1.05, 1.0, 0.92), vec3(0.42, 0.6, 0.98), smoothstep(0.0, 0.6, ru0)) : mix(vec3(0.98, 0.94, 0.84), vec3(0.7, 0.64, 0.54), smoothstep(0.0, -0.4, ru0)));
    envC += vec3(1.0, 0.95, 0.85) * (hall ? 0.9 : 1.8) * smoothstep(0.86, 0.97, dot(rr0, uLS));
    // the glass, and the echo of Vaul: see-through, their own alpha
    if (id == 555 || (id >= 560 && id <= 565 && uKind > 8.5)) { float frs = pow(1.0 - ndv0, 2.6); vec3 hq = normalize(uLK + uV); float sp = pow(max(0.0, dot(n, hq)), 120.0) * 2.5;
      vec3 c = envC * (0.12 + 0.88 * frs) + vec3(1.0) * sp; float al = 0.08 + 0.62 * frs;
      if (id == 555) { float ck = clamp(uKind, 0.0, 1.0), crk = smoothstep(0.035, 0.0, abs(vn(L.xz * 2.4 + L.y * 1.7 + 5.0) - 0.5)) * step(1.0 - ck * 1.1, vn(L.xy * 1.3 + L.z * 0.6 + 2.0)) * step(0.04, ck);
        c += vec3(1.0, 0.97, 0.9) * crk * 0.9 + GO * 0.25 * pow(1.0 - ndv0, 4.0); al += crk * 0.55; }
      else { c = c * vec3(0.75, 0.6, 1.0) + VI * (0.18 + 0.7 * frs) * (0.8 + 0.2 * sin(tt * 3.0 + L.y * 4.0)); al = 0.18 + 0.5 * frs; }
      al = clamp(al, 0.0, 1.0) * (1.0 - dead); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, al * uAlpha); return; }
    if (id == 556 && sk == 0) { float zz = L.z; if (zz > 0.0 ? zz > uKind : zz > uSpill) discard; }
    vec3 a = vec3(0.1), emi = vec3(0.0), F0m = vec3(0.04); float rg = 0.6, cvv = 0.0, cc = 0.0, occ = 1.0, met = 0.0;
    if (id == 550) {
      if (sk == 2) { a = vec3(0.035, 0.04, 0.065) * (0.8 + 0.4 * w1); float rib = 0.5 + 0.5 * cos(L.x * 37.7); cvv += smoothstep(0.55, 1.0, rib) * 0.45; a *= 0.8 + 0.35 * (1.0 - rib); rg = 0.48; cc = 0.35; }
      else if (sk == 4) { a = vec3(0.15, 0.18, 0.26) * (0.8 + 0.35 * w1); float jb = smoothstep(0.86, 1.0, abs(fract(L.x * 2.0) - 0.5) * 2.0); a *= 1.0 - 0.35 * jb; cvv += jb * 0.3; rg = 0.38; cc = 0.45; }
      else { a = vec3(0.1, 0.12, 0.17) * (0.72 + 0.55 * w1); float vein= smoothstep(0.03, 0.0, abs(vn(L.xy * 2.3 + L.z * 1.4 + sd) - 0.5)) * smoothstep(0.35, 0.6, w2);
        a = mix(a, vec3(0.55, 0.42, 0.2), vein * 0.55); emi += GO * vein * (0.04 + 0.12 * gl); float mica = pow(vn(L.xy * 61.0 + L.z * 37.0 + sd), 18.0); emi += vec3(0.85, 0.85, 1.0) * mica * 0.5 * max(0.0, dot(n, uLK));
        rg = 0.3 + 0.12 * w3; cc = 0.6; }
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 11.0 + sd), vn(L.zx * 11.0 + 3.0), vn(L.xy * 11.0 + 7.0)) - 0.5) * 0.12); }
    else if (id == 551) { a = (sk == 2 ? vec3(0.22, 0.26, 0.33) : vec3(0.42, 0.48, 0.58)) * (0.82 + 0.3 * w1); float topF = smoothstep(0.4, 0.8, NL.z), ringsE = abs(fract(length(L.xy * vec2(1.0, 1.7)) * 6.5 + 0.2 * w1) - 0.5), grv = smoothstep(0.07, 0.02, ringsE) * topF;
      a *= 1.0 - 0.45 * grv; cvv += grv * 0.5; a = mix(a, a * 1.7 + vec3(0.04, 0.05, 0.06), clamp(edge, 0.0, 1.0) * 0.55);
      float pit = smoothstep(0.8, 0.95, w3); a *= 1.0 - 0.3 * pit; rg = 0.4 + 0.15 * w2; cc = 0.3;
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 14.0 + sd), vn(L.zx * 14.0 + 3.0), vn(L.xy * 14.0 + 7.0)) - 0.5) * 0.14); }
    else if (id == 552 || id == 561 || id == 568) { met = 1.0; F0m = vec3(1.0, 0.76, 0.38) * (0.78 + 0.28 * w2); rg = (sk == 2 ? 0.16 : 0.28) + 0.16 * w1; float tn = smoothstep(0.55, 0.85, w3) * (sk == 2 ? 0.3 : 0.7); F0m *= 1.0 - 0.5 * tn; rg += tn * 0.25;
      emi += GO * gl * (id == 568 ? 0.6 : 0.3); }
    else if (id == 553) { float R0 = 0.86, rr = length(L.xy) / R0, ang = atan(L.x, L.y), h12 = fract(ang / 6.28318 * 12.0 + 0.5) - 0.5, h60 = fract(ang / 6.28318 * 60.0 + 0.5) - 0.5, kq = floor(ang / 6.28318 * 12.0 + 0.5 + 12.0);
      float big = step(mod(kq, 3.0), 0.5), hb = (1.0 - smoothstep(0.04 + 0.03 * big, 0.06 + 0.035 * big, abs(h12) * 6.28318 / 12.0 * rr * 6.0)) * step(0.6 - 0.07 * big, rr) * step(rr, 0.82);
      float mt = (1.0 - smoothstep(0.012, 0.022, abs(h60) * 6.28318 / 60.0 * rr * 6.0)) * step(0.77, rr) * step(rr, 0.85), ring = exp(-pow((rr - 0.87) / 0.008, 2.0)) + 0.6 * exp(-pow((rr - 0.74) / 0.006, 2.0));
      float crz = smoothstep(0.025, 0.0, abs(vn(L.xy * 10.0 + sd) - 0.5)) * 0.6 + smoothstep(0.02, 0.0, abs(vn(L.xy * 23.0 + 4.0) - 0.5)) * 0.4;
      a = vec3(0.86, 0.87, 0.9) * (0.9 + 0.1 * w1) * (1.0 - 0.18 * crz); a = mix(a, mix(vec3(0.12, 0.13, 0.18), vec3(0.6, 0.45, 0.2), big), max(hb, mt * 0.8)); a = mix(a, vec3(0.5, 0.4, 0.2), ring * 0.7);
      a = mix(a, vec3(0.78, 0.74, 0.62), smoothstep(0.55, 1.0, rr) * 0.25 * w2); rg = 0.24; cc = 0.7; cvv += crz * 0.08;
      emi += VI * gl * (0.08 + 0.7 * smoothstep(0.8, 1.0, rr) * (0.7 + 0.3 * sin(tt * 10.0))); }
    else if (id == 554) { met = 1.0; F0m = vec3(0.22, 0.26, 0.42) * (0.8 + 0.3 * w2); rg = 0.22; float core = exp(-pow(L.y / 0.018, 2.0)) * step(0.0, L.x);
      emi += VI * gl * (0.35 + 0.25 * sin(tt * 10.0)) + vec3(1.2, 1.1, 1.4) * core * gl * 0.7; }
    else if (id == 556) { float vio = clamp(uWear, 0.0, 1.0), gr = pow(vn(L.xy * 70.0 + L.z * 55.0), 14.0);
      a = mix(vec3(0.8, 0.56, 0.22), vec3(0.42, 0.3, 0.86), vio) * (0.85 + 0.25 * w2); rg = 0.85; emi += mix(GO, VI, vio) * gl * 0.35 + vec3(1.0, 0.92, 0.7) * gr * 0.6; }
    else if (id == 560 || id == 563) { met = 1.0; F0m = vec3(0.9, 0.91, 0.96) * (0.86 + 0.14 * w2) * (id == 563 ? 0.75 : 1.0); rg = 0.08 + 0.08 * w1;
      if (id == 560 && sk == 0) { float dd = abs(L.x) / 0.9 + abs(L.y) / 1.18, face = smoothstep(0.5, 0.8, abs(NL.z)), inl = exp(-pow((dd - 0.8) / 0.022, 2.0)) * face;
        float s24 = atan(L.y, L.x) / 6.28318 * 28.0, cel = fract(s24), cid = floor(s24), bnd = max(step(abs(dd - 0.7), 0.035), step(abs(dd - 0.9), 0.035)) * face;
        float gly = step(0.35, fract(sin(cid * 12.9898 + floor(dd * 30.0) * 78.233) * 43758.5)) * smoothstep(0.12, 0.05, abs(cel - 0.5) - 0.25) * bnd;
        F0m = mix(F0m, vec3(1.0, 0.78, 0.4), inl); rg += inl * 0.1; emi += VI * gly * (0.15 + 0.9 * gl) + GO * inl * gl * 0.1; F0m *= 1.0 - 0.35 * gly; }
      F0m = mix(F0m, F0m * 1.12 + 0.04, clamp(edge, 0.0, 1.0) * 0.4); }
    else if (id == 562) { vec3 p = normalize(L); float ir = length(p.yz), front = step(0.0, p.x), iris = (1.0 - smoothstep(0.7, 0.76, ir)) * front, fib = vn(vec2(atan(p.z, p.y) * 9.0 + sd, ir * 7.0));
      float pup = uKind > 0.5 ? (1.0 - smoothstep(0.34, 0.4, ir)) * front : (1.0 - smoothstep(0.85, 1.0, length(vec2(p.y / 0.12, p.z / 0.58)))) * front;
      vec3 irc = mix(vec3(0.3, 0.12, 0.7), vec3(0.88, 0.72, 1.25), clamp(ir / 0.72 + (fib - 0.5) * 0.5, 0.0, 1.0)); irc *= 1.0 - 0.55 * exp(-pow((ir - 0.71) / 0.03, 2.0));
      a = mix(vec3(0.78, 0.73, 0.88) * (0.9 + 0.1 * w1), irc, iris); a = mix(a, vec3(0.03, 0.01, 0.06), pup); rg = 0.12; cc = 1.0; emi += VI * iris * (1.0 - pup) * (0.25 + 0.7 * gl); }
    else if (id == 564) { met = 1.0; F0m = (sk == 2 ? vec3(0.62, 0.5, 0.96) : vec3(0.88, 0.9, 0.96)) * (0.85 + 0.2 * w2); rg = 0.1 + 0.06 * w1; float eg = smoothstep(0.82, 1.0, edge);
      emi += (sk == 2 ? VI : vec3(1.05, 1.0, 1.3)) * eg * (0.12 + 0.95 * gl); F0m *= 1.0 - 0.25 * smoothstep(0.75, 0.9, w3); }
    else if (id == 565) { a = vec3(0.05, 0.035, 0.09) * (0.8 + 0.4 * w1); rg = 0.3; cc = 0.7; emi += (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndv0 * 6.0 + w1 * 3.0)) * 0.05 + VI * gl * 0.35 * (0.6 + 0.4 * w2); }
    else if (id == 566) { float vein = smoothstep(0.04, 0.0, abs(vn(L.xy * 1.8 + L.z * 2.3 + sd) - 0.5)); a = vec3(0.9, 0.87, 0.8) * (0.9 + 0.1 * w1) * (1.0 - 0.3 * vein); rg = 0.32; cc = 0.45; }
    else if (id == 567) { float u2 = edge * 14.0, v2 = ao * 9.0, wv = 0.5 + 0.5 * sin(u2 * 18.0) * sin(v2 * 18.0), dm = abs(fract(u2) - 0.5) + abs(fract(v2) - 0.5), dia = smoothstep(0.32, 0.27, dm) - smoothstep(0.22, 0.17, dm);
      a = vec3(0.24, 0.16, 0.44) * (0.85 + 0.2 * wv); a = mix(a, vec3(0.8, 0.82, 0.9), dia * 0.8); rg = 0.85; emi += VI * gl * 0.15; }
    /* (v463 SA, Vaul's shading pass) 560 its bars as faceted mirror glass: a fine hammered facet field in the normal, glints that
       spark as it turns, a violet depth seen through the face (inclusions drifting behind the silvering), prismatic fire along the
       bevels (vA.y); the inlay widened into a gilded band of engraved filigree scrolls, rubbed back to silver at its edges by wear.
       564 the spikes: 564.2 violet crystal with thickness (light through it, internal facet planes, a bright refracted core along its
       length, its edges lit), 564 polished steel brushed along its length, nicked; 562 the eye wet (a sharp window highlight, a caustic
       in the iris); 565 the nacre's iridescence deeper */
    float vGl = 0.0, vIn = 0.0; vec3 vRef = vec3(0.0);
    if (id == 560 && uKind < 8.5) { if (uLow < 0.5) { vec2 fc = floor(L.xy * 9.0 + 0.5 * w2); vec3 fn = vec3(fract(sin(dot(fc, vec2(12.9, 78.2))) * 43758.5) - 0.5, fract(sin(dot(fc, vec2(39.3, 11.7))) * 24634.6) - 0.5, 0.0); n = normalize(n + (uM0 * fn.x + uM1 * fn.y) * 0.16); }
      F0m *= 0.74;   // (a mirror backed with violet glass: not the whole sky back, so its depth and its facets read)
      float ndvF = max(0.0, dot(n, uV)); vGl = pow(vn(L.xy * 38.0 + vec2(ndvF * 9.0, tt * 0.15) + sd), 22.0) * 3.0;
      vec3 rf = refract(-uV, n, 0.66); vec2 pp = L.xy + rf.xy * 0.35; float inc = pow(vn(pp * 7.0 + sd), 6.0) + 0.5 * pow(vn(pp * 17.0 + 3.0), 10.0); vIn = 0.12 + 0.6 * inc;
      vRef = (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndvF * 9.0 + L.x * 3.0)) * smoothstep(0.55, 1.0, edge) * 0.55;
      if (sk == 0) { float dd = abs(L.x) / 0.9 + abs(L.y) / 1.18, face = smoothstep(0.5, 0.8, abs(NL.z)), band = smoothstep(0.735, 0.75, dd) * (1.0 - smoothstep(0.85, 0.865, dd)) * face;
        float sc1 = abs(sin(L.x * 22.0 + 3.0 * sin(L.y * 15.0 + sd)) * cos(L.y * 19.0 - 2.0 * sin(L.x * 11.0))), fil = smoothstep(0.16, 0.05, sc1) * band, rub = smoothstep(0.62, 0.85, w2 + 0.3 * smoothstep(0.82, 0.865, dd));
        F0m = mix(F0m, mix(vec3(1.0, 0.77, 0.38), vec3(0.88, 0.88, 0.9), rub * 0.6) * (1.0 - 0.45 * fil), band); rg = mix(rg, 0.22 + 0.12 * w3, band); vIn *= 1.0 - band; vGl *= 1.0 - band * 0.6; cvv += fil * 0.35; }
      else vIn *= 0.6; }
    if (id == 564 && uKind < 8.5) { if (sk == 2) { met = 0.0; float ndvF = max(0.0, dot(n, uV)), pl = smoothstep(0.035, 0.0, abs(fract(dot(L, vec3(3.1, 5.3, 2.2)) + w1 * 0.4) - 0.5) - 0.44) + smoothstep(0.03, 0.0, abs(fract(dot(L, vec3(-4.2, 2.1, 6.3)) + 0.3) - 0.5) - 0.45);
        float core = exp(-pow(length(L.yz) / 0.05, 2.0)) * smoothstep(-0.3, 0.6, L.x); a = vec3(0.16, 0.1, 0.34) * (0.8 + 0.4 * w1); rg = 0.06; cc = 1.0;
        emi += VI * (0.18 + 0.35 * pl + 0.9 * core * (0.5 + 0.5 * gl)) * (0.75 + 0.25 * sin(tt * 2.0 + L.x * 6.0)) + vec3(1.0, 0.92, 1.2) * pow(1.0 - ndvF, 3.0) * 0.35 + vec3(1.2, 1.1, 1.4) * smoothstep(0.82, 1.0, edge) * (0.35 + 0.8 * gl); }
      else { F0m *= 0.88 + 0.16 * vn(vec2(L.x * 3.0 + sd, (L.y + L.z) * 120.0)); rg = 0.08 + 0.1 * vn(vec2(L.x * 2.0, (L.y - L.z) * 60.0)); float nick = smoothstep(0.86, 0.95, vn(L.xy * 31.0 + L.z * 17.0 + sd)); F0m *= 1.0 - 0.4 * nick; } }
    if (id == 562 && uKind < 8.5) { vec3 hq2 = normalize(uLK + uV); emi += vec3(1.0) * pow(max(0.0, dot(n, hq2)), 400.0) * 3.0; vec3 p2 = normalize(L); float irc2 = length(p2.yz); emi += VI * smoothstep(0.75, 0.2, irc2) * step(0.0, p2.x) * pow(vn(p2.yz * 14.0 + tt * 0.4), 5.0) * 0.6; }
    if (id == 565) emi += (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndv0 * 9.0 + w2 * 5.0)) * 0.06;
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.4) / 1.4) * mix(1.0, oSH, 0.7);
    vec3 key = uAmb, ambC = (hall ? mix(vec3(0.09, 0.085, 0.13), vec3(0.17, 0.19, 0.28), 0.5 + 0.5 * hm) + vec3(0.32, 0.2, 0.07) * max(0.0, -hm) : mix(vec3(0.5, 0.46, 0.4), vec3(0.5, 0.58, 0.76), 0.5 + 0.5 * hm)) * (0.55 + 0.45 * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 col;
    if (met > 0.5) { vec3 Fr = F0m + (1.0 - F0m) * frs; col = Fr * ((envC + (hall ? vec3(0.08, 0.07, 0.1) : vec3(0.3, 0.28, 0.26))) * 1.25 * occ + spec * key * 1.4) + F0m * 0.3 * (wrap * key + ambC); }
    else { col = a * (mix(ndl, wrap, 0.45) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (0.04 + 0.96 * frs * (1.0 - rg * 0.6));
      if (cc > 0.0) col += cc * (pow(nh, 200.0) * 3.5 * ndl + 0.3 * frs * envC) * occ; }
    col += (vec3(1.0, 0.97, 1.0) * vGl * (0.3 + ndl) + VI * vIn * 0.8 * (1.0 - frs) + vRef) * occ;   // (v463 SA: Vaul's glass: glints, the depth inside it, the bevels' fire)
    col += pow(1.0 - ndv0, hall ? 2.4 : 1.8) * max(0.0, dot(n, uLR) + 0.35) * uRim * (hall ? 0.45 : 0.9) * occ;   // (v463 SA: the gallery's rim stronger, violet)
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.78, 0.78, 0.84) * 0.7, dead * 0.8); }
    col += emi * (1.0 - dead * 0.92) + vec3(1.0, 0.95, 0.9) * clamp(uGlow2, 0.0, 1.0) * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));   // (a blow's flash)
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha * fa, uAlpha * fa); return; }
  /*</SA-SEP-MAT>*/
  /*<SK-KHYROS-MAT ids 570..579 (v463 SK: 20z3a-khyros-gl.js, Khyros the Hound Beyond the Angles)>*/
  else if (id >= 570 && id <= 579) {   // ---- (v463 SK) Rift 04's last boss and its arena's still pieces, lit by the void (KHY_GL's pass: the key's colour in uAmb, the violet rim in uRim). 570 the hull's obsidian plates (vA.z its side + the ring / 15 along it, 0 the tail .. 14 the snout; vA.y across the plate 0..1: dark seams at each ring, engraved chevrons pointing to the snout that carry a violet wave by uGlow (menace), white by uKind (wedged)); 570.2 the chamfer along a plate's long edge (a bright bevel); 570.4 a leg's prism or knuckle (a facet: vA.y 0 its centre .. 1 its rim, the rim lit). 571 a flank slit (vA.z its index + along it, vA.y across: a burning core in a wave from shoulder to waist by uTime, uGlow, white-hot by uKind), 572 an eye (white-violet), 573 the mouth (lit violet by uGlow, the jaw's opening), 574 silver (the teeth; 574.2 a claw: dark, silver along its facet rims), 575 a spearhead (black glass, its facet rims burning violet by uGlow), 577 gold (the loom's frame; 577.2 a thread, lit by uGlow), 578 violet stone (the dais, the plate; 578.2 silver inlay). uGlow2 a blow's flash, uFx dead
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 2.5), dead = clamp(uFx, 0.0, 1.0), kk = clamp(uKind, 0.0, 1.0);
    vec3 VI = vec3(0.56, 0.34, 1.0), VH = vec3(0.86, 0.72, 1.22), WV = vec3(1.0, 0.95, 1.12), GO = vec3(1.0, 0.78, 0.42);
    if (id == 571 || id == 572) { float si = floor(ao + 0.001), al = fract(ao), ac = abs(clamp(edge, 0.0, 1.0) - 0.5) * 2.0, core = exp(-ac * ac * 5.0), hot = exp(-ac * ac * 30.0), ends = smoothstep(0.0, 0.2, al) * smoothstep(1.0, 0.8, al);
      float pul = id == 571 ? 0.35 + 0.65 * max(0.0, sin(tt * 3.4 - si * 0.75)) * (0.6 + 0.4 * min(gl, 1.0)) + kk * 0.6 : 0.85 + 0.45 * min(gl, 1.0);
      vec3 lc = mix(vec3(0.62, 0.36, 1.25), WV, clamp((id == 572 ? 0.5 : kk * 0.8) + hot * 0.45, 0.0, 1.0)), c = vec3(0.015, 0.008, 0.03) * (1.0 - core) + lc * core * ends * (0.6 + 1.6 * pul) + VI * (1.0 - core) * ends * pul * 0.8;
      c += vec3(1.0, 0.95, 1.0) * clamp(uGlow2, 0.0, 1.0) * 0.3; c = mix(c, vec3(0.05, 0.045, 0.06), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.04), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.55, cvv = 0.0, cc = 0.0, occ = 1.0, mtl = 0.0;
    if (id == 570 && sk == 4) { float rim = smoothstep(0.8, 1.0, edge), g = vn(L.xy * 9.0 + L.z * 5.0 + sd);
      a = vec3(0.085, 0.075, 0.11) * (0.85 + 0.3 * g); a = mix(a, vec3(0.36, 0.33, 0.48), rim * 0.6); rg = mix(0.48, 0.28, rim); cc = 0.3; cvv += smoothstep(0.97, 1.0, edge) * 0.3; emi += VI * smoothstep(0.92, 1.0, edge) * (0.03 + 0.08 * gl); }
    else if (id == 570) {   // (v463 SK rework) 570 the body (vA.y round it 0..1 from the ridge, vA.z the ring / 15), 570.3 a limb (vA.y round, vA.z along), 570.2 an armour plate (a facet: vA.y 0 its centre .. 1 its rim): polished obsidian in staggered plates, each of two facets turned its own way about a crease, grooves between, bevels edged in silver, violet runes engraved in some; the belly bare dark muscle in cords, violet light through it
      if (sk == 2) { float rim = smoothstep(0.8, 0.97, edge), cr = smoothstep(0.975, 1.0, edge);
        a = mix(vec3(0.03, 0.026, 0.045), vec3(0.42, 0.43, 0.52), rim); mtl = rim * 0.7; rg = 0.34; cc = 0.3 * (1.0 - rim); cvv += cr * 0.5 + (1.0 - smoothstep(0.0, 0.5, edge)) * 0.15;
        emi += VI * smoothstep(0.55, 0.75, edge) * (1.0 - rim) * (0.05 + 0.3 * gl) + WV * kk * rim * 0.25; }
      else { float f = sk == 3 ? ao * 9.0 : ao * 15.0, v = fract(edge + 1.0), belly = (sk == 3 || f < 0.0) ? 0.0 : smoothstep(0.35, 0.43, v) * smoothstep(0.65, 0.57, v);
        // (v463 SK third pass) the plates follow the anatomy: big over the haunches, back and shoulders, small down the waist, the neck, the limbs and the tail; each a scale whose chevron rear edge lies over the plate behind, its front tucked under the plate before it
        float cols = 9.0, rows = 1.0, f0 = 0.0;
        if (sk == 3) { cols = 4.0; rows = 1.5; } else if (f < 0.0) { cols = 6.0; rows = 3.2; } else if (f < 3.0) { cols = 8.0; rows = 0.9; } else if (f < 5.0) { cols = 10.0; rows = 1.5; f0 = 3.0; } else if (f < 8.0) { cols = 7.0; rows = 0.8; f0 = 5.0; } else if (f < 9.8) { cols = 12.0; rows = 2.4; f0 = 8.0; } else { cols = 8.0; rows = 1.3; f0 = 9.8; }
        vec2 g = vec2(v * cols, (f - f0) * rows); float row = floor(g.y); g.x += mod(row, 2.0) * 0.5; vec2 cid = vec2(floor(g.x), row + f0 * 17.0 + float(sk) * 31.0), q = fract(g) - 0.5;
        float dr = q.y - (-0.5 + 0.34 * abs(q.x) * 2.0 * 0.5), groove = dr < 0.0 ? 1.0 : smoothstep(0.045, 0.0, dr), sg = smoothstep(0.045, 0.01, 0.5 - abs(q.x)), seam = max(groove, sg), lip = dr > 0.0 ? smoothstep(0.12, 0.045, dr) * (1.0 - sg) : 0.0, tuck = smoothstep(0.12, 0.5, q.y);
        float h1 = hs(cid + sd), h2 = hs(cid * 1.7 + 3.1), h3 = hs(cid * 2.3 + 7.7), wave = 0.55 + 0.45 * sin(tt * 3.4 - f * 0.75);
        vec3 lat = normalize(cross(n, uUP) + vec3(1e-4, 0.0, 0.0));
        n = normalize(n + (lat * q.x * 0.5 + (vec3(h1, h2, h3) - 0.5) * 0.08) * (1.0 - belly) * (1.0 - seam));   // (each plate curved across, glints running along it)
        float rn = 0.0; if (h2 > 0.6 && cols < 9.5 && belly < 0.5 && sk != 3) { vec2 r1 = (q - vec2(0.0, 0.06)) * vec2(1.1, 1.3), pa = r1 - vec2(-0.24, -0.18), ba = vec2(0.24, 0.38); float d = length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
          pa = r1 - vec2(0.0, 0.2); ba = vec2(0.24, -0.38); d = min(d, length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)));
          pa = r1 - vec2(-0.2 + 0.4 * h3, -0.26); ba = vec2(0.0, 0.38); d = min(d, length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0)));
          if (h1 > 0.5) { pa = r1 - vec2(-0.22, 0.02); ba = vec2(0.44, 0.0); d = min(d, length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0))); }
          rn = smoothstep(0.045, 0.018, d); }
        a = vec3(0.034, 0.03, 0.048) * (0.8 + 0.35 * h1); rg = 0.3 + 0.1 * h3; cc = 0.45;
        a = mix(a, vec3(0.36, 0.37, 0.46), lip * 0.75); mtl = lip * 0.7; rg = mix(rg, 0.3, lip);   // (the rear lip edged in dull silver)
        a = mix(a, vec3(0.004, 0.003, 0.008), seam); cc *= 1.0 - seam; cvv += seam * 0.75 + tuck * 0.4;   // (deep in the seams, shadowed under the plate before)
        a = mix(a, vec3(0.006, 0.004, 0.01), rn); emi += VI * rn * (0.3 + 0.9 * gl * wave) + WV * rn * kk * 0.8 + VI * seam * (0.07 + 0.3 * gl * wave);   // (runes; the seams' faint violet)
        if (belly > 0.0) { float cord = 0.5 + 0.5 * sin(f * 26.0 + sin(v * 40.0) * 0.6); a = mix(a, vec3(0.07, 0.035, 0.1) * (0.7 + 0.5 * cord), belly); rg = mix(rg, 0.45, belly); cc = mix(cc, 0.2, belly); mtl *= 1.0 - belly; cvv = mix(cvv, (1.0 - cord) * 0.3, belly); thru = VI * 0.35 * belly; emi += VI * belly * (0.04 + 0.2 * gl * wave) * cord; } }
      a = mix(a, a * 0.7 + vec3(0.02, 0.01, 0.04), smoothstep(-0.2, -0.8, hm) * 0.4); }
    else if (id == 573) { a = vec3(0.05, 0.02, 0.08); rg = 0.4; cc = 0.4; cvv += 0.4; emi += VI * (0.03 + 0.9 * smoothstep(0.25, 1.0, gl)) * (0.75 + 0.25 * sin(tt * 7.0)); }   // (v463 SK third pass: dark until it gapes)
    else if (id == 574) { if (sk == 2) { float rim = smoothstep(0.72, 1.0, edge); a = mix(vec3(0.05, 0.045, 0.07), vec3(0.8, 0.84, 0.92), rim); rg = mix(0.45, 0.16, rim); cc = 0.4 + 0.5 * rim; mtl = rim; }
      else { a = vec3(0.8, 0.84, 0.92) * (0.85 + 0.2 * vn(L.xz * 30.0 + sd)); rg = 0.16; cc = 0.9; mtl = 1.0; } }
    else if (id == 575) { float rim = smoothstep(0.66, 1.0, edge); a = vec3(0.025, 0.02, 0.04); rg = 0.14; cc = 1.1; emi += mix(VI, VH, rim * 0.45) * rim * rim * (0.22 + 0.5 * gl) + VI * 0.05 * gl; cc = 0.6; }
    else if (id == 577) { if (sk == 2) { a = GO * 0.45; rg = 0.3; emi += GO * (0.12 + 1.2 * gl) * (0.75 + 0.25 * sin(tt * 6.0 + L.x * 9.0)); }
      else { a = GO * (0.6 + 0.3 * vn(L.xz * 14.0 + sd)); rg = 0.22; cc = 0.7; mtl = 1.0; emi += GO * gl * 0.05; } }
    else { if (sk == 2) { a = vec3(0.8, 0.84, 0.92); rg = 0.18; cc = 0.8; mtl = 1.0; emi += vec3(0.9, 0.85, 1.0) * gl * 0.12; }
      else { float g = vn(L.xy * 7.0 + sd), vv = smoothstep(0.03, 0.0, abs(vn(L.xy * 2.5 + 4.0) - 0.5)); a = mix(vec3(0.15, 0.12, 0.25), vec3(0.24, 0.2, 0.37), g) * (1.0 - 0.3 * vv); rg = 0.62; cc = 0.15; emi += GO * gl * 0.035; } }
    if (uLow < 0.5 && (id == 577 || id == 578)) n = normalize(n + (vec3(vn(L.yz * 9.0 + sd), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.12);
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.4) / 1.4) * mix(1.0, oSH, 0.7);
    vec3 key = uAmb, sky = uRim * 0.08 + vec3(0.1, 0.09, 0.14), gnd = vec3(0.16, 0.1, 0.3) * 0.7;
    vec3 ambC = mix(gnd, sky, 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP), sp2 = pow(max(0.0, dot(n, normalize(uLS + uV))), pw * 0.7) * 0.4;
    vec3 envC = mix(gnd * 0.9, sky * 1.8 + vec3(0.06, 0.04, 0.1), smoothstep(-0.35, 0.4, ru)) + key * 0.9 * smoothstep(0.85, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0) + vec3(0.5, 0.46, 0.72) * smoothstep(0.12, 0.3, ru) * (1.0 - smoothstep(0.5, 0.8, ru)) * 0.22 / (1.0 + rg * 4.0), tint = mix(vec3(1.0), a * 1.4, mtl);   // (v463 SK rework: a soft band of the void's light in the reflections, the obsidian's glints)
    if (id == 570) tint *= vec3(0.82, 0.74, 1.12);   // (the obsidian's sheen goes violet)
    vec3 col = a * (mix(ndl, wrap, 0.4) * key + ambC) * (1.0 - mtl * 0.6) + (envC * (0.62 / (1.0 + rg * 2.5)) * occ + (spec + sp2) * key * 0.9) * tint * mix(0.1 + 0.9 * frs * (1.0 - rg * 0.6), 1.0, mtl * 0.85);
    col += thru * (0.5 + 0.5 * max(0.0, -ndl0)) * key;
    if (cc > 0.0) col += cc * (pow(nh, 70.0) * 1.5 * ndl * key + 0.28 * frs * envC) * occ;   // (v463 SK third pass: a soft clear-coat sheen, no hard white)
    col += pow(1.0 - ndv0, 2.2) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.8 * occ;   // (the violet rim from behind)
    col += vec3(0.3, 0.18, 0.55) * max(0.0, -hm) * 0.12 * occ;   // (the stone's violet bounce under it)
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead * 0.85);
    col += vec3(1.0, 0.94, 1.0) * clamp(uGlow2, 0.0, 1.0) * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.78, 0.85) * 0.7, dead * 0.7); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</SK-KHYROS-MAT>*/
  /*<LB-LIB-MAT ids 940..979 (v474 LB: 20zea-syllax-gl.js, 20zfa-vellum-gl.js, 20zga-nhalex-gl.js, the Library of Unwritten Lives' bosses). Lit by LIB3's passes (YUG3.pass) in their arenas' light: the key's colour in uAmb, the rim's in uRim; 940..949 the Reading Circle (warm lamplight, the ink void's violet behind, the parchment floor's bounce), 950..959 the Spilled-Ink Chamber (candle-gold key, burgundy dusk, the boards' warm bounce), 960..979 the Final Archive (pale gilt key, violet void, the bright parchment's bounce). Every pattern from the surface's own coordinates (vA, or the local position of a still mesh: vL, its normal vNL), never the moving position; separate "if (id == N)" blocks (SwiftShader mis-shades deep else-if chains).
     SYLLAX 940 leather (vA.y s along the book 0..1, vA.z t across 0..1; the face from the local normal: top the tooled cover (a gilt fillet frame, a dotted band, the lozenge and its stud, corner studs; .2 the head's lid: the eye sigil), underneath the marbled endpaper, the sides plain; morocco grain, scuffed edges, varnish; uKind 1 the copy: washed violet), 941 the page block (sides: the stacked page edges, gilt at the boards; faces: a written page; .2 a page tooth), 942 the leather cord (vA.y round, vA.z along: a thong wound round), 943 gilt brass, 944 the gold eye (copies, its own direction in vA: a slit pupil; uKind 1 violet), 945 the ribbon (vA.y across, vA.z along: crimson satin, gold edge stripes), 947 light (uKind 0 gold, 1 violet).
     VELLUM 950 the mantle's enamel (vA.y its radius 0 middle .. 1 rim, local xy the body's u v: black lacquer, the inlaid gold trim, the shoulders' scrollwork, the slit and the breather ring; uSpill the slit cracked open on its gold-white heart; .4 the head's cap), 951 the cream underside (.2 the chin), 952 the fin (vA.y out 0..1, vA.z along: burgundy membrane, rays, light through it, an iridescent edge), 953 tentacle and arm skin (vA.y round, vA.z along: mottled burgundy, chromatophores; .4 a sucker's cup), 954 a gold eye (copies: a W-shaped pupil), 955 gold, 957 ink (a drip).
     NHALEX 960 a brain lobe (vA.y how deep in a fold, vA.z a burgundy groove: ivory, wet, light under the skin; .4 the parted lobe's cut face; uSpill the last page's rose boil, uFx its fall), 961 the golden core, 962 an eye (copies: 0 round, 1 slit, 2 round small), 963 an eyelid (ivory), 964 ink (the plume and the tendrils: vA.y round, vA.z along; glossy black, violet streaks running down, uSpill boiling rose; .4 the pool at its foot), 965 a gold nib and its rings, 966 a page of the ring (vA.y across, vA.z down its height: parchment, a gilt frame line, script, the great symbol uKind 0..3, the folded corner; uSpill the unwritten's violet), 967 the ring's gilt band, 968 the model of Gaia (local: its own sphere; uSpill the points lit 0..7).
     uGlow2 a blow's flash, uFx the death's fade, uWear the part's seed>*/
  else if (id >= 940 && id <= 979) {
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), tt = uTime, gl = clamp(uGlow, 0.0, 3.0), dead = clamp(uFx, 0.0, 1.0), fl2 = clamp(uGlow2, 0.0, 1.0), sd = uWear * 17.0, hm = dot(n, uUP), cpy = step(0.5, uKind);
    float inst = floor((ao + 0.01) * 0.25), loc = ao - inst * 4.0;
    vec3 GO = vec3(0.92, 0.66, 0.26), GH = vec3(1.0, 0.88, 0.58), VI = vec3(0.6, 0.38, 1.0), VH = vec3(0.88, 0.78, 1.05), RO = vec3(1.0, 0.36, 0.5), PA = vec3(0.93, 0.84, 0.64);
    vec3 a = vec3(0.5), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.5, cc = 0.0, cvv = 0.0, occ = 1.0, spk = 0.0, met = 0.0, ssk = 0.0, shb = 0.0; vec2 tex = L.xy * 6.0;
    vec3 TX = normalize(uM0), TY = normalize(uM1), TZ = normalize(uM2);
    // ---- the eyes and the lights: their own colour, a wet glint
    if (id == 944 || id == 954 || id == 962) { float bk = step(1.5, edge), ly = (edge - bk * 2.0) * 2.0 - 1.0, lz = loc / 3.8 * 2.0 - 1.0; vec3 lp = vec3(sqrt(max(0.0, 1.0 - ly * ly - lz * lz)) * (1.0 - 2.0 * bk), ly, lz);   // (LIB3.eyeAtt: a unit sphere's own direction; copies are written in the world)
      float IR = id == 944 ? 0.78 : id == 954 ? 0.86 : 0.56; vec2 q = vec2(-lp.y, lp.z) / IR; float rr = length(q), iris = (1.0 - smoothstep(0.9, 1.0, rr)) * step(0.0, lp.x);
      vec3 IRA = mix(vec3(0.6, 0.34, 0.07), vec3(1.0, 0.84, 0.4), smoothstep(1.0, 0.05, rr)), IRB = mix(vec3(0.3, 0.18, 0.6), VH, smoothstep(1.0, 0.05, rr)), ir = mix(IRA, IRB, cpy);
      float fib = 0.8 + 0.2 * sin(atan(q.y, q.x) * 26.0 + vn(q * 5.0) * 4.0) * smoothstep(0.15, 0.4, rr), pup = 0.0;
      if (id == 944) { float w = 0.17 * (1.0 - q.y * q.y * 0.7) * (1.0 + 0.6 * clamp(uSpill, 0.0, 1.0)); pup = smoothstep(w, w * 0.6, abs(q.x)) * smoothstep(0.95, 0.8, abs(q.y)); }
      if (id == 954) { float ax2 = abs(q.x), tp = 0.2 + 0.14 * (ax2 / 0.66) * (ax2 / 0.66), bt2 = -0.36 + 0.26 * smoothstep(0.32, 0.0, ax2);   /* (v474b LB: the 2D's glossy gold eye: a bright gradient lit from up-left, the scowling lid-mask with its W edge, a fixed catchlight) */
        pup = smoothstep(0.025, -0.015, q.y - tp) * smoothstep(-0.025, 0.015, q.y - bt2) * smoothstep(0.64, 0.56, ax2); if (uSpill > 0.5) pup = smoothstep(0.24, 0.16, rr);
        float rc = length(q - vec2(-0.3, 0.35)); ir = rc < 0.45 ? mix(vec3(1.0, 0.95, 0.77), vec3(0.92, 0.76, 0.35), rc / 0.45) : mix(vec3(0.92, 0.76, 0.35), vec3(0.58, 0.4, 0.12), clamp((rc - 0.45) / 0.8, 0.0, 1.0)); fib = 1.0; }
      if (id == 962) { if (inst < 0.5) pup = smoothstep(0.46, 0.4, rr); else if (inst < 1.5) pup = smoothstep(0.14, 0.09, abs(q.x)) * smoothstep(0.95, 0.8, abs(q.y)); else pup = smoothstep(0.36, 0.3, rr); }
      vec3 sclera = id == 962 ? vec3(1.0, 0.95, 0.84) : vec3(0.1, 0.06, 0.03); vec3 c = mix(sclera * (0.45 + 0.55 * max(0.0, dot(n, uLK))) * uAmb * 0.6, ir * fib * (0.75 + 0.5 * gl), iris);
      c = mix(c, vec3(0.03, 0.015, 0.01), pup * iris); c += ir * 0.2 * pow(1.0 - ndv0, 2.0) * gl;
      if (id == 954) c = mix(c, vec3(1.0, 0.99, 0.95), smoothstep(0.16, 0.1, length((q - vec2(-0.38, 0.4)) * vec2(1.0, 1.5))) * 0.9 * iris);   // (v474b LB)
      vec3 rr3 = reflect(-uV, n); c += vec3(1.0, 0.97, 0.9) * (pow(max(0.0, dot(rr3, uLK)), 90.0) * 1.6 + smoothstep(0.92, 0.97, dot(rr3, uLS)) * 0.6);
      c += vec3(1.0) * fl2 * 0.3; c = mix(c, vec3(0.05, 0.04, 0.06), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 947) { vec3 c = mix(mix(GO, GH * 1.4, pow(ndv0, 1.5)), mix(VI, VH * 1.4, pow(ndv0, 1.5)), cpy) * (0.5 + 0.6 * gl); c = mix(c, vec3(0.05), dead * 0.85); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    // ---- SYLLAX: leather, pages, cord, gilt, ribbon
    if (id == 940) { float s = edge, t2 = ao; vec3 an = abs(NL); vec2 p2 = an.z > 0.6 ? L.xy : an.x > an.y ? L.yz : L.xz; tex = p2 * 9.0;
      vec3 b0 = mix(vec3(0.5, 0.15, 0.29), vec3(0.6, 0.21, 0.36), hs(vec2(floor(sd), 3.1))); if (sk == 2) b0 = vec3(0.58, 0.21, 0.38); if (sk == 4) b0 = vec3(0.34, 0.13, 0.16);
      b0 = mix(b0, vec3(0.3, 0.25, 0.6), cpy);
      vec2 gc = lbC(p2 * 34.0 + sd); float peb = smoothstep(0.0, 0.25, gc.y - gc.x), mot = lbF(p2 * 3.0 + sd);
      a = b0 * (0.72 + 0.28 * peb) * (0.85 + 0.3 * mot); rg = mix(0.62, 0.38, peb); cc = 0.28; cvv += (1.0 - peb) * 0.25;
      float ed = min(min(s, 1.0 - s), min(t2, 1.0 - t2)), scuff = smoothstep(0.05, 0.0, ed) * (0.4 + 0.6 * vn(p2 * 20.0 + sd)) + smoothstep(0.97, 0.75, max(max(an.x, an.y), an.z)) * 0.7;
      a = mix(a, mix(vec3(0.55, 0.3, 0.26), vec3(0.6, 0.55, 0.75), cpy), clamp(scuff, 0.0, 1.0) * 0.45); rg = mix(rg, 0.7, clamp(scuff, 0.0, 1.0) * 0.5);
      if (NL.z > 0.6) { vec2 st = vec2(s, t2); float tl = lbTool(st, float(sk)), emb = tl - lbTool(st + vec2(0.006, -0.004), float(sk));
        vec3 gold = mix(GO, vec3(0.75, 0.68, 0.95), cpy) * (0.85 + 0.25 * vn(st * 60.0));
        a = mix(a, gold, tl); met = tl; rg = mix(rg, 0.24, tl); spk += tl * 0.8;
        if (uLow < 0.5) n = normalize(n + (TX * 0.6 - TY * 0.4) * emb * 1.6);
        cvv += max(0.0, -emb) * 0.6; }
      else if (NL.z < -0.6) { vec2 m2 = vec2(s * 2.0, t2 * 3.0); float fl = lbF(m2 * 2.0 + sd), mb = sin((m2.x + fl * 1.8) * 9.0 + sin(m2.y * 6.0 + fl * 3.0) * 1.5);
        a = mix(vec3(0.16, 0.1, 0.34), vec3(0.42, 0.28, 0.66), smoothstep(-0.4, 0.6, mb)); a = mix(a, vec3(0.86, 0.66, 0.3), smoothstep(0.88, 0.98, mb) * 0.8); a = mix(a, vec3(0.12, 0.3, 0.36), smoothstep(0.7, 0.9, sin(m2.y * 17.0 + fl * 4.0)) * 0.35);
        a = mix(a, b0, smoothstep(0.035, 0.0, min(min(s, 1.0 - s), min(t2, 1.0 - t2))));   // (the turn-in of the leather round the endpaper)
        rg = 0.6; cc = 0.05; met = 0.0; }
      else { a *= 0.82; } }
    if (id == 941) { vec3 an = abs(NL); a = PA * (0.92 + 0.1 * vn(L.xy * 7.0 + sd)); rg = 0.75; ssk = 0.25; thru = vec3(0.6, 0.42, 0.2) * 0.3;
      float fox = smoothstep(0.62, 0.8, lbF(L.xy * 4.0 + L.z * 3.0 + sd)); a = mix(a, vec3(0.7, 0.52, 0.3), fox * 0.3);
      if (sk == 2) { float tip = smoothstep(0.3, 0.9, edge); a = mix(PA * 1.05, vec3(0.55, 0.4, 0.26), tip * 0.5); rg = 0.65; }
      else if (an.z < 0.6) { float h = edge, hz = h * 64.0 + vn(vec2(ao * 30.0, h * 9.0)) * 0.6, ln = smoothstep(0.35, 0.5, abs(fract(hz) - 0.5)), pg = hs(vec2(floor(hz), sd));   // (the sides: vA.y the height 0..1, vA.z round)
        a *= 0.9 + 0.1 * pg; a = mix(a, a * 0.78, ln * 0.6); cvv += ln * 0.06; tex = vec2(ao * 20.0, h * 20.0);
        float gilt = smoothstep(0.12, 0.0, min(h, 1.0 - h)); a = mix(a, GO * 1.05, gilt * 0.8); met = gilt * 0.8; rg = mix(rg, 0.3, gilt); spk += gilt; }
      else if (sk == 4 && NL.z < -0.6) { vec2 m2 = vec2(edge * 2.0, ao * 3.0); float fl = lbF(m2 * 2.0 + sd), mb = sin((m2.x + fl * 1.8) * 9.0 + sin(m2.y * 6.0 + fl * 3.0) * 1.5);   // (.4 an upper page block: its underside the 2D's dark endpaper, the roof of the mouth)
        a = mix(vec3(0.13, 0.08, 0.28), vec3(0.34, 0.22, 0.56), smoothstep(-0.4, 0.6, mb)); a = mix(a, vec3(0.86, 0.66, 0.3), smoothstep(0.9, 0.98, mb) * 0.6); a = mix(a, mix(vec3(0.3, 0.25, 0.6), vec3(0.55, 0.45, 0.85), cpy), cpy * 0.5); rg = 0.6; ssk = 0.0; thru = vec3(0.0); }
      else { vec2 st = vec2(edge, ao); float rows = st.x * 9.0, row = floor(rows), fr = fract(rows), inm = step(0.12, st.y) * step(st.y, 0.88) * step(0.08, st.x) * step(st.x, 0.92);
        float w0 = 0.14 + hs(vec2(row, 1.3 + sd)) * 0.08, word = step(0.35, fract((st.y - w0) * 5.5 + hs(vec2(row, 7.0)) * 0.5)) * smoothstep(0.42, 0.3, abs(fr - 0.5)) * smoothstep(0.2, 0.3, fr);
        float scr = word * (0.6 + 0.4 * vn(vec2(st.y * 140.0, row))) * inm, cap = step(0.1, st.x) * step(st.x, 0.28) * step(0.13, st.y) * step(st.y, 0.27);
        a = mix(a, vec3(0.12, 0.08, 0.1), scr * 0.75); a = mix(a, mix(vec3(0.55, 0.12, 0.22), GO, step(0.5, hs(vec2(floor(st.y * 30.0), floor(st.x * 30.0))))), cap * 0.85);
        a = mix(a, a * 0.85, smoothstep(0.2, 0.0, abs(st.y - 0.5)) * 0.3); rg = 0.85; } }
    if (id == 942) { float al = ao, rd = edge, wr = fract(al * 46.0 + rd), rid = smoothstep(0.0, 0.5, wr) * smoothstep(1.0, 0.5, wr); tex = vec2(rd * 4.0, al * 40.0);
      a = mix(vec3(0.16, 0.05, 0.08), vec3(0.32, 0.12, 0.16), rid) * (0.85 + 0.3 * vn(tex + sd)); a = mix(a, vec3(0.28, 0.22, 0.5), cpy); rg = mix(0.7, 0.4, rid); cc = 0.2; cvv += (1.0 - rid) * 0.35;
      float st2 = smoothstep(0.06, 0.0, abs(fract(al * 9.0) - 0.5) - 0.45) * smoothstep(0.1, 0.0, abs(fract(rd * 2.0) - 0.5) - 0.38); a = mix(a, GO, st2 * 0.8); met = st2; }
    if (id == 943) { a = mix(GO, vec3(0.7, 0.66, 0.92), cpy) * (0.82 + 0.3 * vn(L.xy * 23.0 + L.z * 11.0 + sd)); met = 1.0; rg = 0.2 + 0.18 * vn(L.yz * 40.0); cc = 0.2; spk += 0.5;
      a = mix(a, a * 0.45, smoothstep(0.4, 0.9, vn(L.xz * 15.0 + sd)) * 0.35); }
    if (id == 945) { float ac = edge, al = ao; tex = vec2(ac * 6.0, al * 60.0); float tw = 0.88 + 0.12 * sin((ac * 70.0 + al * 260.0)), wv = vn(vec2(ac * 3.0, al * 20.0) + sd);
      a = mix(vec3(0.6, 0.06, 0.13), vec3(0.78, 0.14, 0.22), wv) * tw; float strp = smoothstep(0.03, 0.0, abs(abs(ac - 0.5) - 0.38) - 0.025); a = mix(a, GO * 1.05, strp); met = strp * 0.8;
      a = mix(a, vec3(0.42, 0.3, 0.75), cpy); rg = mix(0.32, 0.22, strp); shb = 1.2; thru = vec3(0.9, 0.12, 0.18) * 0.6; cc = 0.1; }
    // ---- VELLUM: enamel, the underside, the fin, skin, gold, ink
    /* (v474b LB: Vellum's texture pass: navy lacquer under a clear coat (a broad soft highlight, a sharp streak, the key's dot, from a domed coat normal), violet and burgundy sheen at its edges, raised gilt with real slopes (the scrollwork's distance sampled thrice), a polished medallion; blinded, a jagged crack glowing warm gold, its lacquer chipped back to the vellum; the head the same lacquer, shadowed under the mantle; a translucent fin with ribs, veins and a pale rim; violet-burgundy skin, dark above and pale beneath, suckers pale-rimmed and dark-hearted; ink glossy black with a violet-teal sheen) */
    if (id == 950) { vec2 p = L.xy; float r = edge; tex = p * 4.0;
      float rimz = sk == 4 ? 0.0 : smoothstep(0.45, 1.0, r);
      a = mix(vec3(0.045, 0.052, 0.1), vec3(0.07, 0.078, 0.145), lbF(p * 2.2 + sd));
      a = mix(a, mix(vec3(0.19, 0.075, 0.25), vec3(0.24, 0.06, 0.14), 0.5 + 0.5 * sin(p.x * 1.4 + p.y * 0.9)), rimz * 0.22);
      rg = 0.14 + (vn(p * 40.0 + sd) - 0.5) * 0.05; cc = 1.3; met = 0.0;
      vec3 nb = n; vec2 tv = vec2(0.0); float gold = 0.0, gH = 0.0, dk = 0.0, chip = 0.0;
      if (sk == 4) { float cd = abs(p.x - 1.38 - 0.25 * (p.y / 1.15) * (p.y / 1.15)); gold = smoothstep(0.075, 0.05, cd) * step(abs(p.y), 1.2); cvv += smoothstep(1.75, 1.2, p.x) * 0.7 * (1.0 - gold); }   // (.4 the head's cap: the collar line; the mantle's shadow on its back)
      else { vec2 bd = (p - vec2(-0.55, 0.0)) * vec2(0.3, 0.4); nb = normalize(n + (TX * bd.x + TY * bd.y) * 0.9);
        float dS = lbScr(p), wS = 0.046, mS = smoothstep(wS, wS * 0.6, dS);
        if (mS > 0.0 && uLow < 0.5) { float e = 0.008; vec2 gS = vec2(lbScr(p + vec2(e, 0.0)) - dS, lbScr(p + vec2(0.0, e)) - dS) / e; tv += gS * (dS / wS) * mS; }
        float dT = abs(r - 0.86), mT = smoothstep(0.03, 0.018, dT) * step(p.x, 1.25); tv += normalize(p - vec2(-0.6, 0.0) + 1e-4) * sign(r - 0.86) * (dT / 0.03) * mT;
        vec2 bq = (p - vec2(-0.42, 0.0)) * vec2(1.0, 1.0 / 1.1); float br = length(bq); vec2 bn = bq / max(br, 1e-4);
        float mR = smoothstep(0.36, 0.34, br) * smoothstep(0.255, 0.265, br), mR2 = smoothstep(0.245, 0.235, br) * smoothstep(0.16, 0.17, br), hole = smoothstep(0.165, 0.15, br);
        tv += bn * ((br - 0.305) / 0.05 * mR + (br - 0.205) / 0.04 * mR2);
        float slit = smoothstep(0.034, 0.024, abs(p.y)) * step(p.x, -0.68) * step(-2.88, p.x), slitC = smoothstep(0.012, 0.005, abs(p.y)) * slit; tv += vec2(0.0, p.y / 0.034) * slit;
        gold = max(max(mS, mT), max(slit, max(mR, mR2))); gH = max(mR2, slit * 0.6); dk = max(hole, slitC); cvv += hole * 0.3;
        float op = clamp(uSpill, 0.0, 1.0); if (op > 0.01) { float su = clamp((1.0 - p.x) / 3.75, 0.0, 1.0), w = op * 0.5 * pow(sin(3.14159 * su), 0.7) * (1.0 + 0.1 * sin(tt * 9.0 + su * 12.0)), on = step(0.0, w - 0.01);
          float ay = abs(p.y) + ((vn(vec2(su * 34.0, 3.0 + sd)) - 0.5) * 0.09 + (vn(vec2(su * 95.0, 7.0)) - 0.5) * 0.035) * op, inn = smoothstep(w, w - 0.04, ay) * on;
          float lip = smoothstep(w + 0.035, w, ay) * (1.0 - inn) * on, cz = ay - w + (vn(p * 16.0 + sd) - 0.5) * 0.1; chip = smoothstep(0.12, 0.07, cz) * (1.0 - inn) * on;
          vec2 hq = p - vec2(-0.8, 0.0); float hr = length(hq * vec2(0.6, 1.0)), pul = 0.8 + 0.2 * sin(tt * 7.0);
          gold *= 1.0 - max(inn, chip); dk *= 1.0 - inn;
          a = mix(a, vec3(0.5, 0.38, 0.24) * (0.85 + 0.3 * vn(p * 40.0)), chip * 0.85); a = mix(a, vec3(0.13, 0.06, 0.025), lip); rg = mix(rg, 0.7, chip); cc *= 1.0 - chip;
          emi += mix(vec3(2.0, 1.72, 1.2), GO * 1.4, smoothstep(0.0, 1.6, hr)) * inn * pul + GO * 0.9 * exp(-max(0.0, ay - w) * 14.0) * (1.0 - inn) * op * pul + GH * lip * 0.5 * op; } }
      if (uLow < 0.5) n = normalize(n + (TX * tv.x + TY * tv.y) * 0.85);
      vec3 gc = mix(GO, GH, gH) * (0.9 + 0.15 * vn(p * 30.0 + sd)); a = mix(a, gc, gold); met = gold * 0.7; rg = mix(rg, 0.2, gold); cc = mix(cc, 0.35, gold);
      a = mix(a, vec3(0.012, 0.01, 0.02), dk);
      vec3 rc = reflect(-uV, nb); float sb = dot(rc, uLS); vec3 ax = normalize(cross(uLS, uV) + 1e-4), ay2 = cross(ax, uLS); float x1 = dot(rc, ax) / 0.4, x2 = dot(rc, ay2) / 0.13;
      float coat = (1.0 - gold * 0.5) * (1.0 - chip) * (1.0 - dk);
      emi += uAmb * (smoothstep(0.4, 0.95, sb) * 0.06 + smoothstep(1.0, 0.3, x1 * x1 + x2 * x2) * step(0.0, sb) * 0.85 + pow(max(0.0, dot(rc, uLK)), 320.0) * 0.9) * coat;
      emi += gold * uAmb * GO * (0.17 + 0.5 * pow(max(0.0, dot(reflect(-uV, n), uLS)), 6.0));
      emi += mix(vec3(0.3, 0.12, 0.5), vec3(0.45, 0.1, 0.22), rimz) * pow(1.0 - ndv0, 2.5) * 0.12 * (1.0 - gold) * (1.0 - chip); }
    if (id == 951) { vec2 p = L.xy; tex = p * 6.0; float wr = vn(p * 9.0 + sd) * 0.6 + vn(p * 23.0) * 0.4; a = mix(vec3(0.86, 0.76, 0.6), vec3(0.95, 0.88, 0.74), wr); if (sk == 2) { a *= 1.03; cvv += smoothstep(1.6, 1.1, p.x) * 0.5 + smoothstep(-0.3, 0.1, L.z) * 0.35; }   // (.2 the chin: under the cap and the mantle, shadowed)
      rg = 0.55; ssk = 0.6; thru = vec3(0.9, 0.55, 0.4) * 0.5; cc = 0.35;
      a = mix(a, vec3(0.2, 0.15, 0.22), smoothstep(0.75, 1.0, lbF(p * 1.5 + 3.0)) * 0.25); }
    if (id == 952) { float o = edge, al = ao; tex = vec2(o * 3.0, al * 40.0);
      float ray = smoothstep(0.12, 0.0, abs(abs(fract(al * 30.0) - 0.5) - 0.5) - 0.05 * (1.0 - o * 0.5)), vn2 = smoothstep(0.06, 0.0, abs(fract(al * 90.0 + sin(o * 6.0 + al * 40.0) * 0.3) - 0.5) - 0.44) * smoothstep(0.2, 0.6, o);
      a = mix(vec3(0.3, 0.06, 0.17), vec3(0.6, 0.24, 0.42), smoothstep(0.0, 0.9, o)) * (0.92 + 0.12 * vn(tex + sd)); a = mix(a, vec3(0.88, 0.58, 0.74), ray * 0.7); a = mix(a, a * 0.8, vn2);
      a = mix(a, vec3(0.2, 0.03, 0.11), smoothstep(0.74, 0.88, vn(vec2(o * 10.0, al * 110.0) + sd)) * 0.4);
      float rimL = smoothstep(0.82, 0.98, o), thin = (1.0 - ray) * smoothstep(0.1, 0.8, o); a = mix(a, vec3(0.9, 0.66, 0.8), rimL * 0.6);
      thru = mix(vec3(0.7, 0.12, 0.3), vec3(1.0, 0.45, 0.65), o) * (0.25 + 0.55 * thin); rg = 0.3; cc = 0.7; ssk = 0.3; shb = 0.5; cvv += ray * 0.05;
      vec3 film = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + ndv0 * 1.5 + al * 2.0)); emi += film * rimL * 0.04 * (1.0 - dead); }
    if (id == 953) { float rd = edge, al = ao - floor(ao * 0.5) * 2.0, up = smoothstep(-0.35, 0.55, hm); tex = vec2(rd * 5.0, al * 30.0);
      a = mix(vec3(0.6, 0.34, 0.48), vec3(0.24, 0.09, 0.2), up) * (0.9 + 0.15 * lbF(tex * 0.6 + sd)); a = mix(a, vec3(0.13, 0.03, 0.1), smoothstep(0.7, 0.82, vn(vec2(rd * 14.0, al * 70.0) + sd)) * up * 0.5);
      rg = 0.26; cc = 0.95; ssk = 0.55; thru = vec3(0.9, 0.3, 0.4) * 0.3; shb = 0.4;
      emi += GO * clamp(uGlow, 0.0, 1.5) * 0.35 * smoothstep(0.4, 0.55, al) * (1.0 - smoothstep(0.75, 0.9, al)) * (0.6 + 0.4 * sin(al * 30.0 - tt * 6.0));   // (uGlow: the tethered arm's exposed middle lit gold)
      if (sk == 4) { float rr = edge, cen = smoothstep(0.24, 0.1, rr), rimP = smoothstep(0.16, 0.32, rr) * smoothstep(0.78, 0.6, rr); a = mix(vec3(0.5, 0.28, 0.4), vec3(0.93, 0.82, 0.76), rimP); a = mix(a, vec3(0.12, 0.03, 0.08), cen); rg = 0.35; cc = 0.6; ssk = 0.3; cvv += cen * 0.3; } }
    if (id == 955) { a = GO * (0.85 + 0.25 * vn(L.xy * 30.0 + sd)); met = 1.0; rg = 0.2; cc = 0.25; spk += 0.6; }
    if (id == 957) { a = vec3(0.022, 0.018, 0.032); rg = 0.05; cc = 1.6; met = 0.0; thru = vec3(0.3, 0.2, 0.6) * 0.12; vec3 ri = reflect(-uV, n);
      emi += mix(vec3(0.42, 0.25, 0.85), vec3(0.15, 0.6, 0.62), 0.5 + 0.5 * sin(ndv0 * 9.0 + hm * 3.0)) * pow(1.0 - ndv0, 1.6) * 0.28 + uAmb * (pow(max(0.0, dot(ri, uLK)), 200.0) * 1.2 + smoothstep(0.93, 0.97, dot(ri, uLS)) * 0.35); }
    // ---- NHALEX: the brain, its core and eyes, ink, gold, the pages, the model of Gaia
    if (id == 960) { float g = clamp(edge, 0.0, 1.0), gv = clamp(ao, 0.0, 1.0); tex = L.xz * 3.0;
      a = mix(vec3(0.9, 0.85, 0.7), vec3(0.98, 0.94, 0.82), vn(L.xz * 2.5 + sd)); a = mix(a, vec3(0.78, 0.66, 0.5), smoothstep(0.3, 1.0, g) * 0.55); cvv += g * 0.35;
      a = mix(a, vec3(0.5, 0.17, 0.3), smoothstep(0.15, 0.6, gv)); a = mix(a, vec3(0.3, 0.08, 0.18), smoothstep(0.6, 0.95, gv)); cvv += gv * 0.25;
      float vein = smoothstep(0.025, 0.0, abs(vn(L.xz * 5.0 + L.y * 3.0 + sd) - 0.5)) * (1.0 - gv); a = mix(a, vec3(0.86, 0.6, 0.58), vein * 0.35);
      rg = mix(0.32, 0.6, g); cc = 0.75 * (1.0 - gv * 0.5); ssk = 0.3; shb = 0.55; thru = vec3(1.0, 0.7, 0.5) * 0.25;
      if (sk == 4) { a = mix(vec3(0.62, 0.2, 0.32), vec3(0.85, 0.45, 0.5), vn(L.xz * 6.0)); rg = 0.3; cc = 0.9; emi += GO * 0.15 * gl; }
      emi += RO * clamp(uSpill, 0.0, 1.0) * (0.15 + 0.35 * gv + 0.25 * g) * (0.7 + 0.3 * sin(tt * 7.0 + L.x * 3.0)); }
    if (id == 961) { vec3 q = normalize(L + 1e-4); float fr = smoothstep(0.03, 0.0, abs(lbF(q.xz * 3.0 + vec2(q.y * 2.0, tt * 0.1)) - 0.5));
      a = mix(vec3(0.96, 0.66, 0.2), vec3(1.0, 0.92, 0.6), pow(ndv0, 1.2)); met = 0.55; rg = 0.18; cc = 0.6; emi += mix(GO, vec3(1.6, 1.45, 1.1), fr) * (0.35 + 0.55 * gl) * (0.85 + 0.15 * sin(tt * 7.0)) + GH * pow(1.0 - ndv0, 2.0) * 0.6 * gl; }
    if (id == 963) { a = vec3(0.86, 0.76, 0.6) * (0.9 + 0.15 * vn(L.xy * 8.0 + sd)); rg = 0.5; ssk = 0.6; cc = 0.4; thru = vec3(0.9, 0.5, 0.4) * 0.3; if (sk == 2) { a = vec3(0.32, 0.08, 0.18); rg = 0.4; } }
    if (id == 964) { float rd = edge, al = ao; tex = vec2(rd * 4.0, al * 12.0); float bo = clamp(uSpill, 0.0, 1.0);
      a = vec3(0.04, 0.035, 0.065) * (0.85 + 0.3 * vn(tex + sd)); rg = 0.08; cc = 1.3; spk += 0.3; shb = 0.6;
      if (sk == 4) { float rr = length(L.xy), rip = 0.5 + 0.5 * sin(rr * 10.0 - tt * 2.5); a *= 0.8 + 0.3 * rip; emi += vec3(0.35, 0.25, 0.7) * pow(rip, 8.0) * 0.12; }
      else { float st = pow(vn(vec2(rd * 7.0 + sin(al * 6.0) * 0.4, al * 9.0 - tt * 0.9) + sd), 6.0); emi += vec3(0.42, 0.3, 0.85) * st * 0.35 * (1.0 - dead);
        emi += RO * bo * pow(vn(vec2(rd * 6.0, al * 14.0 - tt * 3.0) + sd), 3.0) * 0.9; } }
    if (id == 965) { a = GO * (0.85 + 0.25 * vn(L.xy * 18.0 + L.z * 7.0 + sd)); met = 1.0; rg = 0.17; cc = 0.25; spk += 0.7;
      if (sk == 2) { float sl = smoothstep(0.03, 0.012, abs(L.y)) * step(0.62, L.x), hole = smoothstep(0.075, 0.06, length(L.xy - vec2(0.36, 0.0))); a = mix(a, vec3(0.03, 0.02, 0.03), max(sl, hole)); met *= 1.0 - max(sl, hole); cvv += max(sl, hole) * 0.4;
        float eng = smoothstep(0.02, 0.0, abs(abs(L.y) - 0.18 + L.x * 0.08) - 0.006) * step(L.x, 0.55) * step(0.05, L.x); a = mix(a, a * 0.5, eng); } }
    if (id == 966) { float s = edge, h = ao; vec2 st = vec2(s, h); tex = st * 20.0; int sy = int(uKind + 0.5);
      a = PA * (0.92 + 0.12 * lbF(st * 5.0 + sd)); a = mix(a, vec3(0.72, 0.56, 0.34), smoothstep(0.35, 0.0, min(min(s, 1.0 - s), min(h, 1.0 - h))) * 0.35); rg = 0.78; ssk = 0.35; thru = vec3(0.9, 0.7, 0.4) * 0.45;
      float fr = smoothstep(0.012, 0.0, abs(max(abs(s - 0.5) / 0.4, abs(h - 0.5) / 0.42) - 1.0) - 0.006); a = mix(a, GO, fr * 0.85); met = fr * 0.7;
      float tl = 0.0; for (int i = 0; i < 4; i++) { float yy = 0.86 - float(i) * 0.055; tl = max(tl, smoothstep(0.012, 0.004, abs(h - yy)) * step(0.17, s) * step(s, 0.83 - float(i - (i / 2) * 2) * 0.12) * step(0.4, fract(s * 9.0 + float(i) * 0.3))); }
      a = mix(a, vec3(0.2, 0.15, 0.2), tl * 0.55);
      vec2 q = vec2((s - 0.5) * 3.0, (h - 0.45) * 3.9); float d = 9.0;   // (the 2D symbol's own units, y down the page)
      if (sy == 0) { vec2 e2 = q * vec2(1.0, 2.35); float le = max(0.001, length(e2)); d = abs(le - 1.0) / length(e2 / le * vec2(1.0, 2.35)); d = min(d, max(0.0, length(q) - 0.3)); for (int k = 0; k < 3; k++) { float an2 = -0.9 - float(k) * 0.65; vec2 dr = vec2(cos(an2), sin(an2)); d = min(d, lbSeg(q, dr * 0.62, dr * 0.95)); } }
      if (sy == 1) { float r2 = length(q), th2 = atan(q.y, q.x); th2 = th2 < 0.0 ? th2 + 6.28318 : th2; float f = (r2 - 0.08) / 0.375 - th2 / 6.28318; d = abs(fract(f + 0.5) - 0.5) * 0.375 + step(0.99, r2) * 9.0; }
      if (sy == 2) { d = min(min(lbSeg(q, vec2(-0.55, -0.7), vec2(-0.55, 0.15)), lbSeg(q, vec2(0.0, -0.95), vec2(0.0, 0.15))), lbSeg(q, vec2(0.55, -0.7), vec2(0.55, 0.15))); d = min(d, abs(length((q - vec2(0.0, 0.15)) / vec2(0.55, 0.4)) - 1.0) * 0.45 + step(q.y, 0.15) * 9.0); d = min(d, max(0.0, length(q - vec2(0.0, 0.5)) - 0.14)); }
      if (sy == 3) { d = abs(length(q - vec2(0.0, -0.48)) - 0.36); d = min(d, lbSeg(q, vec2(0.0, -0.12), vec2(0.0, 0.95))); d = min(d, lbSeg(q, vec2(-0.55, 0.22), vec2(0.55, 0.22))); d = min(d, lbSeg(q, vec2(0.0, 0.62), vec2(0.3, 0.62))); }
      float sym = smoothstep(0.13, 0.095, d); vec3 ink = mix(vec3(0.07, 0.05, 0.09), VI * 0.8, clamp(uSpill, 0.0, 1.0)); a = mix(a, ink, sym); rg = mix(rg, 0.25, sym); cc = sym * 0.6;
      emi += VH * sym * clamp(uSpill, 0.0, 1.0) * 0.6 + VH * clamp(uSpill, 0.0, 1.0) * 0.06;
      float fc = step(1.0, (s - 0.8) / 0.2 + (h - 0.86) / 0.14); a = mix(a, vec3(0.78, 0.64, 0.42), fc * 0.7); cvv += fc * 0.1; }
    if (id == 967) { a = GO * (0.88 + 0.2 * vn(L.xy * 12.0 + sd)); met = 1.0; rg = 0.22; cc = 0.3; spk += 0.6; if (sk == 2) { a *= 0.75; rg = 0.35; } }
    if (id == 968) { vec3 q = normalize(L + 1e-4); float lon = atan(q.y, q.x), lat = asin(clamp(q.z, -1.0, 1.0));
      float land = smoothstep(0.52, 0.56, lbF(vec2(lon * 1.6, lat * 3.2) + 7.0) + 0.08 * cos(lat * 2.0)), ice = smoothstep(1.15, 1.3, abs(lat));
      a = mix(vec3(0.12, 0.32, 0.62), vec3(0.2, 0.46, 0.78), vn(q.xy * 6.0)); a = mix(a, mix(vec3(0.3, 0.55, 0.28), vec3(0.62, 0.55, 0.32), vn(q.yz * 9.0)), land); a = mix(a, vec3(0.92, 0.95, 1.0), ice);
      rg = mix(0.14, 0.7, land); cc = (1.0 - land) * 0.7;
      float lit = uSpill; for (int i = 0; i < 7; i++) { if (float(i) >= lit) break; float lo = i == 0 ? 0.3 : i == 1 ? 1.2 : i == 2 ? 2.1 : i == 3 ? 2.9 : i == 4 ? 3.8 : i == 5 ? 4.7 : 5.6, la = i == 0 ? 0.35 : i == 1 ? -0.2 : i == 2 ? 0.5 : i == 3 ? -0.45 : i == 4 ? 0.1 : i == 5 ? 0.62 : -0.3;
        vec3 pd = vec3(cos(la) * cos(lo), cos(la) * sin(lo), sin(la)); emi += GH * 2.2 * exp(-dot(q - pd, q - pd) / 0.004); } }
    // ---- the shared light: key with soft shadows, the arena's sky above and its floor's bounce below, reflections of both, metal, a clear coat, glints, light under the skin, the rim from behind
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.5) / 1.5) * mix(1.0, oSH, 0.7); hm = dot(n, uUP);
    vec3 key = uAmb, sky = id < 950 ? vec3(0.17, 0.11, 0.13) : id < 960 ? vec3(0.11, 0.07, 0.13) : vec3(0.13, 0.11, 0.21), gnd = id < 950 ? vec3(0.5, 0.39, 0.26) : id < 960 ? vec3(0.3, 0.19, 0.14) : vec3(0.55, 0.47, 0.32);
    vec3 ambC = mix(gnd, sky, 0.5 + 0.5 * hm) * (0.5 + 0.5 * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(gnd * 0.6, sky * 1.6 + uRim * 0.06, smoothstep(-0.3, 0.45, ru)) + uRim * 0.16 * smoothstep(0.15, 0.5, ru) * (1.0 - smoothstep(0.65, 0.92, ru)) / (1.0 + rg * 4.0) + key * 0.9 * smoothstep(0.85, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);
    vec3 F0 = mix(vec3(0.04), a, met), Fr = F0 + (1.0 - F0) * frs * (1.0 - rg * 0.6);
    vec3 col = a * (1.0 - met * 0.85) * (mix(ndl, wrap, 0.35) * key + ambC) + envC * Fr * occ * (0.55 + met * 1.05) / (1.0 + rg * 1.2) + spec * key * mix(vec3(0.07), F0 * 1.5, met);
    col += thru * (0.35 * (1.0 - ndl) + 0.3 * max(0.0, -ndl0) + 0.3 * max(0.0, dot(n, uLR))) * key * (0.6 + 0.4 * occ);
    if (cc > 0.0) col += cc * (pow(nh, 140.0) * 0.8 * ndl * key + (0.04 + 0.96 * frs) * envC * 0.5) * occ;
    if (spk > 0.0 && uLow < 0.5) col += vec3(1.0, 0.96, 0.88) * pow(vn(tex * 9.0 + sd), 24.0) * 2.0 * spk * max(0.0, ndl0 + 0.2);
    if (ssk > 0.0) col += ssk * a * vec3(1.0, 0.45, 0.35) * (max(0.0, wrap - ndl) * 1.3 * key + pow(1.0 - ndv0, 2.2) * (key * 0.3 + uRim * 0.4)) * (0.5 + 0.5 * occ);
    if (shb > 0.0) { float sbx = dot(rr, uLS); col += shb * key * (pow(nh, 12.0) * 0.14 * ndl + smoothstep(0.82, 0.93, sbx) * (1.0 - smoothstep(0.975, 1.0, sbx)) * 0.25) * occ; }
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.6 * occ + a * max(0.0, -hm) * gnd * 0.55 * occ;
    if (id >= 950 && id < 960) col += a * (1.0 - met * 0.7) * vec3(0.3, 0.26, 0.42) * max(0.0, dot(n, normalize(uV - uLK * 0.6))) * 0.3 * occ;   // (v474b LB: Vellum's cool fill from the viewer's side, opposite the key)
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead * 0.85) + vec3(1.0, 0.98, 0.95) * fl2 * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.78, 0.86) * 0.7, dead * 0.7); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</LB-LIB-MAT>*/
  /*<AB-AUR-MAT ids 730..749 (v470 AB: 20z4a-thul-gl.js, 20z5a-nivora-gl.js, 20z6a-ahuul-gl.js, the Pale Aurora's bosses)>*/
  else if (id >= 730 && id <= 749) {   // ---- (v470 AB) Rift 05's bosses, lit by AUR3's passes (the key's colour in uAmb, the aurora's rim in uRim). 730 Thul's cocoon (local: z its axis, +2.05 the crown, x y across, radius 1.32: chalk-white frosted shell, faint silk wraps, five raised navy seams (the mesh's ridges, painted navy), a crown of frost; uSpill its cracks, green light pouring out); 730.2 a shell shard. 731 navy lacquered chitin (a faint aurora sheen; .2 a dark joint; .6 Thul's tail (a swept tube: vA.z its place along it x 14, vA.y round it): ice plates over every other segment, dark joints). 732 black root (.0 a swept leg: vA.y round, vA.z along, fibres and grooves, frost in them; .2 a still piece by its own coordinates). 733 eyes and lights: .0 the cocoon's eye (local x the gaze: a green iris, a slit pupil narrowed by uKind), .2 a compound eye (hex facets), .4 Nivora's eye slit (vA.y along it, vA.z across; its bright core at uSpill), .6 a light (green, by uGlow), .8 a vent (vA.y across, vA.z along). 734 a wing membrane (seen through): uKind 0 / 1 Thul's fore / hind wing (local x y its plane: the 2D wing's own design: ice-blue to aurora green, veins, the eye-spot, a navy border with white dots), 2 Nivora's (vA.z root 0 .. tip 1, vA.y leading 0 .. trailing 1: frozen white to aurora green, veins and cross-veins, the leading rib). 735 ice (.0 a crystal: facet edges in vA.y, .2 a plate). 736 Nivora's head (dark glass). 737 Ahuul's hide (.0 the body: vA.y round it (0 its right side, .25 the back), vA.z snout 0 .. fluke 1: a navy back, a white belly and throat with pleats (lit green by uGlow), the mouth's line, frost; .2 a fin and .4 the fluke by their own coordinates). 738 a tendril (vA.z along it). 739 snow (a cap of it). uGlow2 a blow's flash, uFx the death's fade
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 3.0), dead = clamp(uFx, 0.0, 1.0), fl2 = clamp(uGlow2, 0.0, 1.0);
    vec3 GRN = vec3(0.3, 1.0, 0.68), GRH = vec3(0.72, 1.18, 0.95), ICH = vec3(0.8, 0.92, 1.0), NV = vec3(0.022, 0.05, 0.13);
    // ---- the lights: emissive, flat
    if (id == 733 && sk >= 4) { vec3 c = vec3(0.0); float al = 1.0;
      if (sk == 4) { float x = clamp(edge, 0.0, 1.0), y = abs(ao * 2.0 - 1.0), core = exp(-pow((x - uSpill) / 0.07, 2.0)), lid = smoothstep(1.0, 0.7, y);
        c = mix(vec3(0.22, 0.72, 0.56), vec3(0.82, 1.15, 1.0), 1.0 - y * 0.8) * (0.7 + 0.5 * gl) * lid + vec3(1.4) * core * (1.0 - y * y) * (0.8 + 0.6 * gl); c *= 0.85 + 0.15 * sin(tt * 3.0 + x * 9.0); }
      else if (sk == 6) { c = mix(GRN, vec3(1.25), pow(ndv0, 3.0) * 0.6) * (0.55 + 0.6 * gl); }
      else { float ac = abs(edge * 2.0 - 1.0), core = exp(-ac * ac * 6.0), ends = smoothstep(0.0, 0.2, ao) * smoothstep(1.0, 0.8, ao); c = mix(vec3(0.03, 0.14, 0.15), GRN * (0.45 + 0.8 * gl), core * ends) + GRH * exp(-ac * ac * 40.0) * ends * gl * 0.35; }
      c += vec3(1.0) * fl2 * 0.25; c = mix(c, vec3(0.06, 0.07, 0.08), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha * al, uAlpha * al); return; }
    // ---- the membranes: seen through, their own alpha
    if (id == 734) { vec3 c; float al;
      if (uKind < 1.5) { bool hind = uKind > 0.5; vec2 p = L.xy; float rr = length(p - vec2(0.1, 0.0)) / (hind ? 2.4 : 3.2), bd = smoothstep(0.84, 0.9, edge), bi = smoothstep(0.93, 0.97, edge);
        vec3 f0 = vec3(0.17, 0.37, 0.54), f1 = vec3(0.53, 0.72, 0.82), f2 = vec3(0.47, 0.84, 0.7), f3 = vec3(0.72, 0.96, 0.85), f4 = vec3(0.91, 1.0, 0.96);
        c = rr < 0.3 ? mix(f0, f1, rr / 0.3) : rr < 0.62 ? mix(f1, f2, (rr - 0.3) / 0.32) : rr < 0.9 ? mix(f2, f3, (rr - 0.62) / 0.28) : mix(f3, f4, clamp((rr - 0.9) / 0.1, 0.0, 1.0));
        float an = atan(p.y, p.x - 0.05), vein = smoothstep(0.035, 0.0, abs(fract(an * 3.3 + 0.15 * sin(length(p) * 2.0)) - 0.5) * length(p) * 0.45) * smoothstep(0.1, 0.4, length(p)) * (1.0 - bd);
        c = mix(c, NV * 2.2, vein * 0.55);
        vec3 es = hind ? vec3(1.3, -1.0, 0.36) : vec3(2.0, 0.35, 0.48); float er = length(p - es.xy) / es.z;
        if (er < 1.0) c = er < 0.13 ? vec3(1.0) : er < 0.3 ? NV * 1.5 : er < 0.5 ? ICH : er < 0.74 ? GRH * 0.9 : NV * 1.4;
        float sh = 0.75 + 0.25 * sin(tt * 4.0 + (hind ? 1.0 : 0.0) + rr * 3.0);
        vec3 emi = c * (0.4 + 0.45 * gl) * sh + GRN * smoothstep(0.45, 1.0, rr) * (0.25 + 0.45 * gl) * sh;
        float dot2 = smoothstep(0.32, 0.12, length(vec2((fract(ao * 22.0) - 0.5) * 2.2, (edge - 0.875) / 0.03))) * step(0.2, rr);
        c = mix(c, NV * 1.6 + vec3(0.03, 0.05, 0.09) * bi, bd); c = mix(c, vec3(1.0), dot2 * 0.95); emi *= 1.0 - bd * 0.85;
        float ndl = abs(dot(n, uLK)), frs = pow(1.0 - ndv0, 3.0); c = c * (0.55 + 0.75 * ndl) * uAmb * 0.75 + emi + uRim * frs * 0.25 * (1.0 - bd) + vec3(1.0) * pow(max(0.0, dot(n, normalize(uLK + uV))), 60.0) * 0.5;
        al = mix(0.86, 1.0, bd); }
      else { float u = clamp(ao, 0.0, 1.0), v = clamp(edge, 0.0, 1.0);
        vec3 g0 = vec3(0.96, 0.98, 0.99), g1 = vec3(0.88, 0.93, 0.95), g2 = vec3(0.74, 0.92, 0.86), g3 = vec3(0.52, 0.87, 0.72), g4 = vec3(0.33, 0.78, 0.61);
        c = u < 0.38 ? mix(g0, g1, u / 0.38) : u < 0.62 ? mix(g1, g2, (u - 0.38) / 0.24) : u < 0.84 ? mix(g2, g3, (u - 0.62) / 0.22) : mix(g3, g4, (u - 0.84) / 0.16);
        float vein = smoothstep(0.03, 0.0, abs(fract(v * 6.0) - 0.5) - 0.47) * smoothstep(0.03, 0.12, u), cross2 = (exp(-pow((u - 0.45) / 0.012, 2.0)) + exp(-pow((u - 0.72) / 0.012, 2.0))) * 0.8, rib = smoothstep(0.06, 0.0, v);
        c = mix(c, vec3(0.09, 0.17, 0.3), clamp(vein * 0.32 + cross2 * 0.22, 0.0, 0.5));
        float ndl = abs(dot(n, uLK)), frs = pow(1.0 - ndv0, 3.0), sh = 0.8 + 0.2 * sin(tt * 2.6 + u * 5.0 - v * 2.0);
        c = c * (0.6 + 0.7 * ndl) * uAmb * 0.8 + c * 0.45 + GRN * smoothstep(0.55, 1.0, u) * (0.12 + 0.3 * gl) * sh + vec3(1.0) * smoothstep(0.0, 0.4, 1.0 - u) * 0.06 + uRim * frs * 0.3 + vec3(1.2) * rib * (0.35 + 0.4 * ndl)
          + vec3(1.0) * pow(max(0.0, dot(n, normalize(uLK + uV))), 50.0) * 0.45;
        al = 0.9 - 0.12 * smoothstep(0.5, 1.0, u) + rib * 0.1; }
      c += vec3(1.0) * fl2 * 0.3; c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * 0.7, dead * 0.8); al = clamp(al, 0.0, 1.0) * (1.0 - dead * 0.5);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha * al, uAlpha * al); return; }
    // ---- the solid ones
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    vec3 a = vec3(0.1), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.5, cc = 0.0, cvv = 0.0, occ = 1.0, mtl = 0.0, spk = 0.0;
    if (id == 730) { float r0 = length(L.xy), ph = atan(L.y, L.x), zc = clamp(L.z / 2.05, -1.0, 1.0);
      float sq = abs(fract(ph / 6.28318 * 5.0 + 0.5) - 0.5) * 1.2566 * max(0.2, r0), seam = sk == 0 ? smoothstep(0.2, 0.15, sq) : 0.0, seamE = sk == 0 ? exp(-pow((sq - 0.13) / 0.035, 2.0)) : 0.0;
      float wrap2 = smoothstep(0.03, 0.0, abs(fract(L.z * 1.9 + 0.12 * sin(ph * 2.0 + 1.0)) - 0.5) - 0.46) * (1.0 - seam);
      a = vec3(0.93, 0.96, 0.98) * (0.93 + 0.07 * w1) * (1.0 - 0.07 * wrap2); thru = vec3(0.16, 0.36, 0.58); rg = 0.78; cc = 0.08; spk = 1.0; cvv += wrap2 * 0.12; emi += vec3(0.2, 0.25, 0.32) * (1.0 - smoothstep(-0.2, 0.6, dot(n, uLK))) * (1.0 - smoothstep(0.2, 0.15, sq));   // (v470 AB: chalk, lit softly in its shade as the 2D's)
      float cap = smoothstep(0.72, 0.8, zc + 0.04 * sin(ph * 5.0 + w1 * 4.0)); a = mix(a, vec3(0.97, 0.985, 1.0), cap); rg = mix(rg, 0.8, cap); spk += cap;
      a = mix(a, vec3(0.025, 0.055, 0.14) * (0.85 + 0.3 * w2), seam * (1.0 - cap)); rg = mix(rg, 0.22, seam); cc = mix(cc, 0.9, seam); thru *= 1.0 - seam; spk *= 1.0 - seam * 0.8; a += vec3(0.08, 0.13, 0.24) * seamE * (1.0 - cap);
      if (uSpill > 0.01) { float c1 = abs(vn(L.xz * 2.2 + L.y * 1.3 + 3.0) - 0.5), c2 = abs(vn(L.yz * 2.6 - L.x * 1.1 + 7.0) - 0.5), ln2 = smoothstep(0.03, 0.0, min(c1, c2)), rev = step(vn(L.xy * 0.9 + L.z * 0.7 + 11.0), uSpill * 1.2);
        float ck = ln2 * rev; a = mix(a, vec3(0.02, 0.04, 0.05), ck); emi += mix(GRN, vec3(1.3), smoothstep(0.012, 0.0, min(c1, c2))) * ck * (0.7 + 1.5 * uSpill) * (0.8 + 0.2 * sin(tt * 20.0)); cvv += ck * 0.2; } }
    else if (id == 731) { a = NV * (0.85 + 0.35 * w1); rg = 0.24 + 0.08 * w3; cc = 0.85;
      if (sk == 2) { a *= 0.55; rg = 0.45; cc = 0.3; }
      if (sk == 6) { float s = ao, seg = floor(s), f = fract(s), pl = mod(seg, 2.0) < 0.5 ? smoothstep(0.1, 0.2, f) * smoothstep(0.9, 0.8, f) : 0.0, jn = smoothstep(0.12, 0.0, min(f, 1.0 - f));
        a = mix(a, mod(seg, 4.0) < 1.5 ? vec3(0.6, 0.78, 0.9) : vec3(0.82, 0.92, 0.98), pl); rg = mix(rg, 0.18, pl); cc = mix(cc, 1.0, pl); thru += vec3(0.2, 0.45, 0.7) * pl * 0.4; a *= 1.0 - jn * 0.6; cvv += jn * 0.4;
        emi += GRN * pl * smoothstep(0.75, 1.0, s / 14.0) * 0.12 * gl; }
      emi += (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndv0 * 6.0 + w1 * 3.0)) * 0.025 + GRN * pow(1.0 - ndv0, 3.0) * 0.06 * gl; }
    else if (id == 732) { vec2 uv = sk == 0 ? vec2(edge * 6.28318 * 1.2, ao * 3.0) : vec2(atan(L.y, L.x) * 1.2 + L.z * 2.0, L.x * 3.0 + L.z * 1.5);
      float fib = vn(vec2(uv.x * 2.2 + vn(uv * vec2(1.0, 0.6)) * 1.5, uv.y * 0.35) + sd), grv = smoothstep(0.42, 0.25, abs(fract(uv.x * 1.1 + fib * 0.7) - 0.5) * 2.0) , knot = pow(vn(uv * vec2(1.3, 0.9) + 4.0), 6.0);
      a = mix(vec3(0.028, 0.032, 0.048), vec3(0.11, 0.14, 0.2), fib) * (1.0 - 0.45 * grv) + vec3(0.06, 0.07, 0.1) * knot; rg = 0.62 - 0.15 * fib; cc = 0.12; cvv += grv * 0.35;
      float fr = smoothstep(0.62, 0.95, hm * 0.8 + 0.3 * grv + 0.45 * (vn(uv * 3.0 + 9.0) - 0.5)) * 0.55; a = mix(a, vec3(0.78, 0.86, 0.94), fr * 0.75); spk += fr; rg = mix(rg, 0.7, fr);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(uv * 4.0), vn(uv * 4.0 + 3.0), vn(uv * 4.0 + 7.0)) - 0.5) * 0.35 * (1.0 - fr)); }
    else if (id == 733) { vec3 p = normalize(L); float front = smoothstep(-0.1, 0.25, p.x);
      if (sk == 0) { float ir = length(p.yz), iris = (1.0 - smoothstep(0.74, 0.8, ir)) * front, pw = max(0.05, 0.2 - 0.12 * clamp(uKind, 0.0, 1.0)), pup = (1.0 - smoothstep(0.9, 1.0, length(vec2(p.y / pw, p.z / 0.62)))) * front;
        vec3 irc = mix(vec3(0.75, 1.1, 0.95), vec3(0.12, 0.5, 0.38), smoothstep(0.0, 0.74, ir)) * (0.85 + 0.3 * vn(vec2(atan(p.z, p.y) * 7.0 + sd, ir * 9.0)));
        a = mix(vec3(0.04, 0.1, 0.08), irc, iris); a = mix(a, vec3(0.005, 0.02, 0.01), pup); rg = 0.08; cc = 1.2; emi += GRN * iris * (1.0 - pup) * (0.35 + 0.6 * gl) + GRH * (1.0 - smoothstep(0.0, 0.3, ir)) * (1.0 - pup) * front * 0.3; }
      else { vec2 q = vec2(atan(p.y, p.x), asin(clamp(p.z, -1.0, 1.0))) * 7.0; q.x += mod(floor(q.y), 2.0) * 0.5; vec2 f = fract(q) - 0.5; float fc = smoothstep(0.5, 0.36, max(abs(f.x) * 1.15, abs(f.y)));
        a = mix(vec3(0.02, 0.07, 0.05), vec3(0.32, 0.8, 0.6) * (0.75 + 0.4 * hs(floor(q))), fc); rg = 0.1; cc = 1.3; emi += GRN * fc * (0.25 + 0.5 * gl) * (0.8 + 0.2 * sin(tt * 2.0 + hs(floor(q)) * 6.0)) + GRH * exp(-dot(f, f) * 30.0) * fc * 0.2; } }
    else if (id == 735) { float rim = smoothstep(0.75, 1.0, edge), dep2 = 0.5 + 0.5 * w1;
      a = (sk == 2 ? vec3(0.62, 0.8, 0.92) : vec3(0.42, 0.66, 0.86)) * (0.85 + 0.2 * w2); thru = vec3(0.3, 0.62, 0.95) * (0.5 + 0.5 * dep2); rg = 0.08; cc = 1.2;
      a = mix(a, vec3(0.94, 0.98, 1.0), rim * 0.8); emi += vec3(0.25, 0.6, 0.85) * (0.08 + 0.1 * dep2) + GRN * gl * 0.25 * (0.6 + 0.4 * w2) + vec3(0.9, 1.0, 1.1) * rim * (0.12 + 0.3 * gl);
      if (uLow < 0.5) { float c1 = abs(fract(dot(L, vec3(5.1, 3.3, 4.2)) + w1 * 1.6) - 0.5); emi += vec3(0.6, 0.9, 1.1) * smoothstep(0.03, 0.0, c1) * 0.25; } spk += 0.5; }
    else if (id == 736) { a = vec3(0.012, 0.022, 0.05) * (0.9 + 0.2 * w1); rg = 0.07; cc = 1.4; emi += GRN * pow(1.0 - ndv0, 4.0) * 0.12 * (0.6 + 0.4 * gl); }
    else if (id == 737) { if (sk == 0) { float rd = edge * 6.28318, s = ao, sn = sin(rd), lim = s < 0.24 ? -0.12 : -0.3, belly = smoothstep(lim + 0.08, lim - 0.08, sn) * smoothstep(0.0, 0.015, s);
          float mot = vn(vec2(rd * 3.0, s * 40.0) + sd), mot2 = vn(vec2(rd * 9.0, s * 120.0) + 3.0);
          vec3 back = mix(vec3(0.075, 0.15, 0.29), vec3(0.1, 0.2, 0.36), mot) * (0.95 + 0.1 * mot2);
          a = mix(back, vec3(0.86, 0.91, 0.94) * (0.94 + 0.06 * mot2), belly); rg = mix(0.32, 0.5, belly); cc = mix(0.6, 0.2, belly); thru = vec3(0.15, 0.3, 0.45) * belly;
          float plA = (rd - 4.712) / 0.24, pleat = smoothstep(0.34, 0.0, s) * smoothstep(0.02, 0.05, s) * step(abs(plA), 3.6) * smoothstep(0.18, 0.0, abs(fract(plA + 0.5) - 0.5) - 0.3);
          a *= 1.0 - pleat * 0.35; cvv += pleat * 0.4; emi += GRH * pleat * gl * (0.6 + 0.4 * sin(tt * 5.0)) + GRN * belly * smoothstep(0.36, 0.08, s) * gl * 0.7;   // (the bared throat lit mint, as the 2D's)
          float ph0 = -0.34 - max(0.0, s - 0.15) * 9.0, rdm = min(abs(rd - (6.28318 + ph0)), min(abs(rd - (3.14159 - ph0)), abs(rd - ph0))), mouth = smoothstep(0.035, 0.0, rdm - 0.01) * step(s, 0.2) * smoothstep(0.004, 0.012, s);
          a = mix(a, vec3(0.01, 0.02, 0.04), mouth); cvv += mouth * 0.5;
          float st2 = pow(vn(vec2(rd * 2.0 + tt * 0.05, s * 30.0 - tt * 0.3) + 5.0), 6.0) * (1.0 - belly); emi += GRN * st2 * 0.14 + vec3(0.6, 0.8, 1.0) * pow(mot2, 14.0) * (1.0 - belly) * 0.3; spk += (1.0 - belly) * 0.3; }
      else { float top = step(0.0, NL.z), lead = smoothstep(0.85, 1.0, edge);
        if (sk == 2) { float t = clamp(L.x, 0.0, 1.0); a = top > 0.5 ? mix(vec3(0.11, 0.21, 0.37), vec3(0.66, 0.78, 0.86), smoothstep(0.04, 0.24, t)) : vec3(0.86, 0.91, 0.94); }
        else a = top > 0.5 ? vec3(0.09, 0.18, 0.33) : vec3(0.84, 0.9, 0.93);
        a *= 0.92 + 0.12 * w1; rg = 0.36; cc = 0.5; a = mix(a, vec3(0.92, 0.96, 1.0), lead * 0.5); emi += GRH * lead * gl * 0.6; } }
    else if (id == 738) { float s = clamp(ao, 0.0, 1.0); a = vec3(0.72, 0.9, 0.84); thru = vec3(0.3, 0.7, 0.55); rg = 0.3; cc = 0.6; emi += GRN * smoothstep(0.6, 1.0, s) * (0.4 + 0.5 * gl) + GRN * 0.06; }
    else { a = vec3(0.95, 0.97, 1.0) * (0.94 + 0.06 * w1); thru = vec3(0.2, 0.4, 0.65); rg = 0.82; spk = 2.0; }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.45) / 1.45) * mix(1.0, oSH, 0.7);
    vec3 key = uAmb, sky = vec3(0.16, 0.22, 0.34) + uRim * 0.05, gnd = vec3(0.42, 0.5, 0.6);   // (the night's blue above, the snow's light bounced from below)
    vec3 ambC = mix(gnd, sky, 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(gnd * 0.8, sky * 1.6, smoothstep(-0.3, 0.4, ru)) + uRim * 0.5 * smoothstep(0.25, 0.55, ru) * (1.0 - smoothstep(0.7, 0.95, ru)) / (1.0 + rg * 4.0) + key * 0.7 * smoothstep(0.86, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);
    vec3 col = a * (mix(ndl, wrap, 0.45) * key + ambC) + (envC * (0.7 / (1.0 + rg * 2.5)) * occ + spec * key) * (0.06 + 0.94 * frs * (1.0 - rg * 0.6));
    col += thru * (0.35 * (1.0 - ndl) + 0.25 * max(0.0, -ndl0)) * key * (0.6 + 0.4 * occ);   // (light through the shell, the snow, the ice)
    if (cc > 0.0) col += cc * (pow(nh, 90.0) * 1.8 * ndl * key + 0.3 * frs * envC) * occ;
    if (spk > 0.0 && uLow < 0.5) col += vec3(1.0, 1.0, 1.1) * pow(vn(L.xy * 61.0 + L.z * 37.0 + sd), 22.0) * 2.5 * spk * max(0.0, ndl0 + 0.2);   // (rime glints)
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.7 * occ;   // (the aurora's rim)
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead * 0.85) + vec3(1.0, 0.98, 0.95) * fl2 * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.84, 0.9) * 0.75, dead * 0.75); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</AB-AUR-MAT>*/
  /*<AB2-NIV-MAT ids 750..759 (v470b AB, rebuilt v470c AB from the user's concept art: 20z5a-nivora-gl.js, Nivora the Aurorawing)>*/
  else if (id >= 750 && id <= 759) {   // ---- (v470d AB: 750 an armour plate (.2 the core, .4 the chest's green V), 753 the wings' white crystal shards (bevelled), 754 the navy spines, 755 a wing's emerald glass (one smooth sheet; facets and veins cut by the shader), 756 an icicle, 757 a tail blade turning to green glass; 751 the black-violet glass head, 752 the eye slit; the notes below are v470b's where they differ) (v470b AB) Nivora, lit by AUR3's 'obs' pass (the key's colour in uAmb, the aurora's rim in uRim). 750 its body's chitin (local: x forward, y left, z up; vA.z the plate's place: its index + the share along it (0 its front edge .. 1 its rear lip), vA.y round the body 0..1 from the back): navy lacquer plates shingled front to back, a bevel of light along each rear lip, a dark seam under it, fine scale-scratches, an aurora sheen; .2 the ventral plates (softer, darker); .4 the abdomen's rings (an ice-blue band along each lip); 751 its head of dark glass (local a unit sphere, x its gaze): the night's aurora seen deep inside through refraction, the eye's light scattered in the glass by uGlow, a hard window highlight, a broad soft one, fresnel; 752 the eye slit (vA.y along it 0..1, vA.z across 0..1): striations of light, its white-hot core at uSpill; 753 ice of the keel (a faceted crystal: vA.y its facet rims, vA.z 1 - its place along it): pale cyan, light refracted through, green-white inner light by uGlow, its edges bright; 754 jointed chitin of a leg or an antenna (vA.z along it in segments: dark joints, a gloss band); .2 a knuckle; 755 a wing's membrane (vA.z root 0 .. tip 1, vA.y leading 0 .. trailing 1; seen through): mint aurora (frosted white at the root to aurora green to teal at the tip), longitudinal veins and a net of cross-veins, iridescence, light through it from the key, its trailing rim glowing, the aurora's folds running across it (uTime, uGlow), uKind its beat; 756 the leading rib (ice glass, lit); 757 a tail vane (vA.y round its flat section 0..1, vA.z root 0 .. tip 1): navy blade, an ice rib down its middle, its edges lit mint, its point glowing. uGlow2 a blow's flash, uFx the death's fade
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 3.0), dead = clamp(uFx, 0.0, 1.0), fl2 = clamp(uGlow2, 0.0, 1.0);
    vec3 GRN = vec3(0.3, 1.0, 0.68), GRH = vec3(0.72, 1.18, 0.95), VIO = vec3(0.62, 0.45, 1.1), NV = vec3(0.016, 0.04, 0.11);
    vec3 hh = normalize(uLK + uV); float nh0 = max(0.0, dot(n, hh)), frs0 = pow(1.0 - ndv0, 4.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 env = mix(vec3(0.3, 0.36, 0.46), vec3(0.06, 0.1, 0.2), smoothstep(-0.2, 0.5, ru)) + GRN * 0.55 * exp(-pow((ru - 0.45) / 0.12, 2.0)) * (0.7 + 0.3 * sin(rr.x * 6.0 + tt * 0.5)) + VIO * 0.25 * exp(-pow((ru - 0.7) / 0.1, 2.0));   // (the night above, the aurora's band in it, the stone below)
    // ---- the eye slit: emissive
    if (id == 752) { float x = clamp(edge, 0.0, 1.0), y = abs(ao * 2.0 - 1.0), core = exp(-pow((x - uSpill) / 0.06, 2.0)), lid = smoothstep(1.0, 0.62, y), str = 0.65 + 0.35 * pow(abs(sin(x * 60.0 + sin(x * 13.0) * 2.0)), 3.0);
      vec3 c = mix(vec3(0.12, 0.55, 0.42), vec3(0.78, 1.15, 1.0), (1.0 - y) * (1.0 - y)) * (0.75 + 0.55 * gl) * lid * str + vec3(1.5, 1.6, 1.55) * core * (1.0 - y * y) * (0.8 + 0.7 * gl) + GRH * exp(-y * y * 30.0) * 0.4 * gl;
      c *= 0.88 + 0.12 * sin(tt * 3.0 + x * 9.0); c += vec3(1.0) * fl2 * 0.25; c = mix(c, vec3(0.05), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    // ---- the wings' membranes: seen through, their own alpha
    if (id == 755) {   // (v470d AB) a wing's emerald glass: one smooth sheet (local x along the span 0..1, y across; vA.y its rim, vA.z across it 0 the trailing edge .. 1 the leading; .1 the lower pair): facets cut by the shader (cells, each tilted), brighter green fracture veins between them and through them, opal-white by the root and the leading edge turning to emerald glowing from within toward the tip and the trailing edge, its rim bright
      float tq = clamp(ao, 0.0, 1.0), rimF = smoothstep(0.8, 1.0, edge), ndv = max(0.001, ndv0), w1 = vn(L.xy * vec2(6.0, 14.0) + sd), w2 = vn(L.xy * vec2(19.0, 40.0) + sd * 1.7 + 3.0);
      float g = smoothstep(0.16, 0.42, L.x + (0.5 - tq) * 0.22 + (w1 - 0.5) * 0.12);
      vec2 vp = vec2(L.x * 19.0, L.y * 46.0) + vec2(w1, w2) * 0.8, ip = floor(vp), fp = vp - ip, cid = ip; float d1 = 9.0, d2 = 9.0;
      for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) { vec2 gg = vec2(float(xx), float(yy)), q2 = gg + vec2(hs(ip + gg), hs(ip + gg + 17.3)) * 0.9 - fp; float d = dot(q2, q2); if (d < d1) { d2 = d1; d1 = d; cid = ip + gg; } else if (d < d2) d2 = d; }
      float bd = sqrt(d2) - sqrt(d1), vein = smoothstep(0.075, 0.0, bd) * (0.55 + 0.45 * hs(cid + 1.3)), fr = hs(cid + 3.7);
      float c1 = abs(vn(L.xy * vec2(4.0, 11.0) + sd + 2.0) - 0.5), c2 = abs(vn(L.xy * vec2(11.0, 26.0) + 5.0) - 0.5), crk = smoothstep(0.022, 0.0, c1) + 0.5 * smoothstep(0.014, 0.0, c2);
      vec3 nf = normalize(n + (normalize(uM0) * (hs(cid) - 0.5) + normalize(uM1) * (hs(cid + 9.1) - 0.5)) * mix(0.35, 0.7, g)); if (dot(nf, uV) < 0.0) nf = -nf;   // (each facet tilted its own way)
      float ndl = dot(nf, uLK), nhf = max(0.0, dot(nf, hh)), ndvf = max(0.001, dot(nf, uV));
      vec3 iri = 0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndvf * 6.0 + fr * 5.0 + L.x * 4.0);
      vec3 white = (vec3(0.78, 0.84, 0.95) * (0.3 + 0.75 * max(0.0, ndl) + 0.2 * fr) + iri * 0.22) * mix(vec3(1.0), uAmb, 0.4);
      vec3 emer = mix(vec3(0.03, 0.42, 0.2), vec3(0.22, 1.05, 0.55), 0.25 + 0.5 * fr + 0.25 * w1) * (0.8 + 0.55 * gl) * (0.85 + 0.15 * sin(tt * 2.0 + L.x * 6.0 - L.y * 9.0));
      emer += vec3(0.1, 0.5, 0.25) * smoothstep(0.4, 1.0, L.x) * (1.0 - tq) * (0.5 + 0.5 * gl);   // (the light inside, toward the tip and the trailing edge)
      vec3 c = mix(white, emer, g) + mix(vec3(0.75, 0.85, 1.0), vec3(0.5, 1.6, 0.85), g) * (vein * (0.18 + 0.8 * g) + crk * (0.12 + 0.9 * g)) * (0.6 + 0.5 * gl);
      c += mix(vec3(0.9, 0.95, 1.0), GRH * 1.3, g) * rimF * (0.35 + 0.5 * g * (0.6 + gl));
      float F = 0.05 + 0.95 * pow(1.0 - ndvf, 4.0); c += env * F * 0.4 + vec3(1.0) * pow(nhf, 220.0) * 1.2 * max(0.0, ndl) + iri * pow(nhf, 20.0) * 0.18 * (1.0 - g * 0.6);
      if (uLow < 0.5) c += vec3(1.0, 0.98, 1.05) * pow(vn(L.xy * vec2(90.0, 160.0) + sd), 30.0) * 4.0 * (1.0 - g * 0.5);   // (sparkle)
      float al = mix(0.9, 0.78, g) + rimF * 0.1 + (vein + crk) * 0.1 * g;
      c += vec3(1.0) * fl2 * 0.3; c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * 0.7, dead * 0.8); al = clamp(al, 0.0, 1.0) * (1.0 - dead * 0.5);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha * al, uAlpha * al); return; }
    // ---- the head of glass
    if (id == 751) { vec3 p = normalize(L), rf = refract(-uV, n, 0.68); float ndv = max(0.001, ndv0);
      vec2 q = rf.xy * 2.2 + p.yz * 1.3 + vec2(tt * 0.04, -tt * 0.03); float neb = vn(q * 2.0 + sd) * 0.6 + vn(q * 5.0 + 3.0) * 0.3 + vn(q * 11.0) * 0.1, wisp = pow(neb, 3.0);
      vec3 deep = mix(vec3(0.008, 0.004, 0.03), vec3(0.06, 0.04, 0.13), ndv) + mix(VIO, GRN, vn(q * 1.5 + 7.0) * 0.6) * wisp * 0.4 * ndv;   // (v470c AB: black-violet glass, as the concept's)
      if (uLow < 0.5) deep += mix(vec3(0.9, 0.85, 1.2), GRH, step(0.7, hs(floor(rf.xy * 40.0)))) * pow(vn(rf.xy * 40.0 + p.yz * 9.0 + sd), 26.0) * 2.2 * ndv;   // (stars deep in the glass)
      float eyeS = exp(-pow(p.z / 0.18, 2.0)) * smoothstep(-0.3, 0.7, p.x), inner = exp(-pow(p.z / 0.42, 2.0)) * smoothstep(-0.5, 0.9, p.x);
      vec3 c = deep + GRN * (eyeS * 0.32 + inner * 0.1) * (0.6 + 0.7 * gl) * (0.5 + 0.5 * ndv);
      float F = 0.04 + 0.96 * pow(1.0 - ndv, 4.0);   // (v470d AB: darker, its rim cooler and finer, as the concept's)
      c = mix(c, env * vec3(0.8, 0.85, 1.1), F * 0.6) + vec3(1.0) * pow(nh0, 420.0) * 4.0 * max(0.0, dot(n, uLK)) + vec3(0.9, 0.95, 1.0) * pow(nh0, 40.0) * 0.18 + mix(uRim, vec3(0.7, 0.8, 1.2), 0.6) * pow(1.0 - ndv, 3.0) * max(0.0, dot(n, uLR) + 0.3) * 0.45;
      vec3 hs2 = normalize(uLS + uV); c += vec3(0.7, 0.85, 1.0) * pow(max(0.0, dot(n, hs2)), 260.0) * 1.2;   // (a second, smaller window)
      c += vec3(1.0) * fl2 * (0.2 + 0.4 * F); if (dead > 0.0) c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * 0.8, dead * 0.7);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    // ---- ice: the keel's plates and the leading ribs
    if (id == 753 || id == 756) { float tp = clamp(1.0 - ao, 0.0, 1.0), ndv = max(0.001, ndv0), eg = smoothstep(0.8, 1.0, edge), w1 = vn(L.xy * 7.0 + L.z * 3.0 + sd);
      vec3 rf = refract(-uV, n, 0.75); float sky = 0.5 + 0.5 * rf.z;
      // (v470d AB) 753 the wings' white shards (crystal blades: a lit face and a dark one either side of the ridge, the bevel's edge bright, a pastel rainbow sheen by the facet's turn, sparkle); 756 an icicle (pale ice, its point lit green)
      float ndl = dot(n, uLK), lit = max(0.0, ndl), fct = hs(floor(n.xy * 5.0 + n.z * 3.0) + sd);
      vec3 iri = 0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + dot(L, vec3(9.0, 13.0, 7.0)) + ndv * 4.0 + w1 * 3.0 + fct * 6.0);
      vec3 wz = normalize(uM2), lp = uLK - wz * dot(uLK, wz); float tilt = dot(n - wz * dot(n, wz), lp / max(0.05, length(lp)));   // (a facet turned toward the light across the wing, or away: its bevel)
      vec3 body = id == 753 ? mix(vec3(0.46, 0.54, 0.74), vec3(1.4, 1.42, 1.45), smoothstep(-0.32, 0.12, tilt) * 0.85 + 0.15 * smoothstep(0.3, 0.9, ndl)) * mix(vec3(1.0), iri, 0.16) * vec3(0.93, 0.97, 1.05) * (0.9 + 0.2 * fct) : mix(vec3(0.3, 0.55, 0.72), vec3(0.75, 0.92, 1.0), sky * 0.7 + 0.3 * ndv) * (0.6 + 0.4 * ndv);
      body += id == 756 ? GRN * smoothstep(0.55, 1.0, tp) * (0.4 + 0.5 * gl) : GRN * 0.04 * gl * (1.0 - tp);
      if (uLow < 0.5 && id == 753) body += vec3(1.0, 0.98, 1.05) * pow(vn(L.xy * 70.0 + L.z * 40.0 + sd), 26.0) * 4.0;
      float F = 0.05 + 0.95 * pow(1.0 - ndv, 4.0); float wrap = id == 753 ? 0.6 + 0.6 * lit : max(0.0, ndl * 0.5 + 0.5);
      vec3 c = body * (0.5 + 0.6 * wrap) * mix(vec3(1.0), uAmb, 0.15) + env * F * 0.6 + vec3(1.0) * pow(nh0, 260.0) * 6.0 * lit + iri * pow(nh0, 30.0) * 0.4 + vec3(0.9, 0.97, 1.1) * eg * (0.08 + 0.12 * lit) + uRim * pow(1.0 - ndv, 2.5) * 0.5;
      c += vec3(1.0) * fl2 * 0.3; if (dead > 0.0) c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * 0.8, dead * 0.7);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    // ---- the chitin: body, legs, vanes
    vec3 a = NV, emi = vec3(0.0); float rg = 0.22, cc = 0.9, cvv = 0.0, w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    if (id == 750) {   // (v470c AB) an armour plate (a pointed petal: vA.y 0 its midline .. 1 its sides, vA.z 0 its root .. 1 its point): navy lacquer, a raised midrib, its edges bevelled to ice, starlike glints; .2 the dark core under the plates
      if (sk == 2) { a = NV * 0.55 * (0.8 + 0.4 * w1); rg = 0.3; cc = 0.6; }
      else if (sk == 4) { a = vec3(0.02, 0.12, 0.07); rg = 0.2; cc = 0.5; emi += mix(GRN, GRH, 0.25 + 0.25 * pow(ndv0, 4.0)) * (1.0 + 0.8 * gl) * (0.9 + 0.1 * sin(tt * 2.5 + L.z * 6.0)); }   // (v470d AB: .4 the V glowing green on its chest)
      else { float side = clamp(edge, 0.0, 1.0), u = clamp(ao, 0.0, 1.0), bev = clamp(smoothstep(0.7, 0.95, side) + smoothstep(0.85, 1.0, u) * 0.8, 0.0, 1.0), mid = smoothstep(0.14, 0.0, side) * smoothstep(0.1, 0.4, u);
        float scr = smoothstep(0.92, 1.0, vn(vec2(L.x * 40.0 + L.y * 3.0, L.z * 70.0) + sd)) * 0.35;
        a = NV * (0.8 + 0.4 * w1) * (1.0 + mid * 0.9); a = mix(a, vec3(0.42, 0.6, 0.84), bev * 0.7); rg = 0.16 + 0.1 * w3 + scr * 0.2; cc = 1.0 - scr; cvv += smoothstep(0.98, 1.0, side) * 0.3;
        emi += vec3(0.4, 0.62, 0.95) * smoothstep(0.9, 1.0, side) * 0.1 + (0.5 + 0.5 * cos(vec3(0.0, 2.1, 4.2) + ndv0 * 7.0 + w1 * 4.0 + u * 2.0)) * 0.04;
        if (uLow < 0.5) emi += vec3(0.9, 0.9, 1.2) * pow(vn(L.xy * 80.0 + L.z * 55.0 + sd), 30.0) * 2.5; } }
    else if (id == 754) { float s = ao, f = fract(s), jn = smoothstep(0.1, 0.0, min(f, 1.0 - f)), band = smoothstep(0.35, 0.5, f) * smoothstep(0.65, 0.5, f);
      a = NV * (0.75 + 0.3 * w1) * (1.0 - jn * 0.6); a += vec3(0.05, 0.1, 0.18) * band * (sk == 2 ? 0.0 : 1.0); rg = 0.25; cc = 0.8; cvv += jn * 0.4; if (sk == 2) { a = NV * 0.9; rg = 0.15; } }
    else {   // (v470c AB) 757 a tail blade (vA.y round its flat section, vA.z root 0 .. point 1): a dark shard, its edges iced, turning to green glass toward its point
      float s = clamp(ao, 0.0, 1.0), eg = smoothstep(0.07, 0.0, min(min(edge, 1.0 - edge), abs(edge - 0.5))), gt = smoothstep(0.55, 0.78, s);
      a = mix(NV * (0.8 + 0.35 * w1), vec3(0.04, 0.42, 0.24), gt); rg = mix(0.2, 0.06, gt); cc = 1.0; a = mix(a, vec3(0.5, 0.7, 0.9), eg * 0.6 * (1.0 - gt));
      emi += vec3(0.15, 0.95, 0.5) * gt * (0.45 + 0.6 * gl) * (0.8 + 0.2 * sin(tt * 3.0 + s * 9.0)) + GRH * eg * gt * 0.5; }
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0), wrap = max(0.0, (ndl0 + 0.45) / 1.45), nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 key = uAmb, ambC = mix(vec3(0.16, 0.2, 0.28), vec3(0.1, 0.14, 0.26) + uRim * 0.06, 0.5 + 0.5 * hm);
    vec3 col = a * (mix(ndl, wrap, 0.4) * key + ambC) + (env * (0.75 / (1.0 + rg * 2.5)) + spec * key) * (0.05 + 0.95 * frs * (1.0 - rg * 0.6));
    col += cc * (pow(nh, 110.0) * 2.0 * ndl * key + 0.35 * frs * env);
    col += pow(1.0 - ndv0, 2.2) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.85;   // (the aurora's rim)
    col *= 1.0 - min(0.8, cvv * 0.5);
    col += emi * (1.0 - dead * 0.85) + vec3(1.0, 0.98, 0.95) * fl2 * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.84, 0.9) * 0.75, dead * 0.75); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</AB2-NIV-MAT>*/
  /*<GO-ORRUBEL-MAT ids 250..257 (v423 GO: 20x1-orrubel-gl.js, Orrubel the Seed-Mother)>*/
  else if (id >= 250 && id <= 259) {   // ---- (v423 GO) Orrubel the Seed-Mother (Rift 02's first boss, 20x1): 250 an outer petal (a thick blade: vA.y its place along the petal, 0 the root .. 1 the tip; vA.z across it 0..1 on its outer face, 2 + across on its inner: velvet plum-violet outside, darker veins, a pale bloom at its sides; satin rose inside, gold at the root; its thin rim lit through by uGlow's gold), 251 the heart (plum flesh in ribs: vA.y a rib's ridge; a web of veins lit gold by uSpill; 251.2 an eyelid, 251.4 the eye's socket), 252 jade root bark (furrowed, knotted, mossed: vA.y a joint; uSpill jade light in the furrows (digging in); 252.2 a pale root tip, 252.4 a thorn, 252.6 the jade collar and the pods' stalks), 253 the golden eye (its frame's x the gaze; uKind 1 dizzy: the pupil wide), 254 an egg (cream shell, plum seams from its poles, speckled; uKind its cracking 0..1; uGlow the light inside), 255 gold (an anther: emissive; 255.2 a filament), 256 a jade leaf (a sepal; vA as 250), 257 an inner petal (rose satin; vA as 250). uGlow2 a blow's flash, uFx withered (dead), uWear the part's seed. Its own light: a cream moon key, the plum night above, the moss's jade bounce below, a rose rim
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, dead = clamp(uFx, 0.0, 1.0), gl = clamp(uGlow, 0.0, 2.5);
    vec3 GD = vec3(1.3, 0.88, 0.32);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    if (id == 253) { vec3 p = normalize(L); float rr = length(p.yz), fr0 = step(0.0, p.x), ang = atan(p.z, p.y), dz = clamp(uKind, 0.0, 1.0);
      float iris = (1.0 - smoothstep(0.64, 0.7, rr)) * fr0, pupR = 0.24 + 0.1 * dz + 0.02 * sin(tt * 2.3), pup = (1.0 - smoothstep(pupR - 0.035, pupR, rr)) * fr0;
      float stri = 0.68 + 0.32 * sin(ang * 26.0 + vn(vec2(ang * 4.0, rr * 10.0)) * 6.0), vei = smoothstep(0.05, 0.0, abs(vn(p.yz * 9.0 + sd) - 0.5)) * smoothstep(0.75, 0.95, rr);
      vec3 scl = mix(vec3(0.96, 0.87, 0.66), vec3(0.55, 0.28, 0.4), smoothstep(0.35, -0.5, p.x)) * (1.0 - 0.35 * vei);
      vec3 irc = mix(vec3(1.3, 0.82, 0.2), vec3(0.72, 0.3, 0.05), smoothstep(0.28, 0.66, rr)) * stri * (0.65 + 0.55 * gl);
      irc = mix(irc, vec3(0.16, 0.04, 0.03), smoothstep(0.6, 0.69, rr) * 0.8);
      vec3 c = mix(scl * (0.35 + 0.65 * max(0.0, dot(n, uLK)) + 0.2), irc, iris); c = mix(c, vec3(0.03, 0.01, 0.03), pup);
      c += GD * iris * (1.0 - pup) * gl * 0.35 * (1.0 - smoothstep(0.2, 0.6, rr));
      vec3 hq = normalize(uLK + uV); c += vec3(1.0) * pow(max(0.0, dot(n, hq)), 140.0) * 2.2 + vec3(1.0, 0.92, 0.85) * pow(max(0.0, dot(n, normalize(uLS + uV))), 300.0) * 1.2 + pow(1.0 - ndv0, 3.0) * uRim * 0.3;
      c = mix(c, vec3(0.13, 0.09, 0.11) * (0.5 + 0.5 * ndv0), dead * 0.88);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 255) { float k = sk == 2 ? 0.4 : 1.0, ndl = max(0.0, dot(n, uLK)); vec3 c = mix(vec3(0.45, 0.28, 0.07), vec3(1.35, 1.0, 0.42), 0.35 + 0.65 * ndl) * k * (0.8 + 0.4 * w3);
      c += GD * (0.25 + gl * 0.85) * (sk == 2 ? 0.25 : 1.0) * (0.75 + 0.25 * sin(tt * 4.0 + sd)) + vec3(1.0) * pow(max(0.0, dot(n, normalize(uLK + uV))), 60.0) * 0.8;
      c = mix(c, vec3(dot(c, vec3(0.3, 0.55, 0.15))) * vec3(0.7, 0.6, 0.5) * 0.45, dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.1), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.6, cvv = 0.0, cc = 0.0, vel = 0.0, occ = 1.0;
    if (id == 250 || id == 256 || id == 257) {   // the blades
      float al = clamp(edge, 0.0, 1.0), inner = step(1.5, ao), ac = clamp(ao - 2.0 * inner, 0.0, 1.0), rim = step(1.02, ao) * step(ao, 1.98), dm = abs(ac - 0.5) * 2.0;
      float vein = smoothstep(0.1, 0.0, abs(fract((ac - 0.5) * (9.0 - 4.0 * al) + 0.5 + 0.18 * vn(vec2(al * 6.0, ac * 3.0) + sd)) - 0.5)) * (1.0 - 0.6 * al), mid = smoothstep(0.08, 0.0, dm * (1.0 + al));
      if (id == 250) {
        if (inner > 0.5) { a = mix(mix(vec3(0.78, 0.46, 0.18), vec3(0.62, 0.2, 0.42), smoothstep(0.0, 0.35, al)), vec3(0.75, 0.38, 0.6), smoothstep(0.55, 1.0, al)) * (0.85 + 0.25 * w1); rg = 0.4; cc = 0.35; vel = 0.35; }
        else { a = mix(vec3(0.13, 0.05, 0.22), vec3(0.3, 0.16, 0.44), smoothstep(0.1, 0.95, al + 0.2 * (w1 - 0.5))) * (0.82 + 0.3 * w2); a = mix(a, vec3(0.52, 0.32, 0.62), smoothstep(0.72, 1.0, dm) * 0.42); rg = 0.55; vel = 1.0; }
        a *= 1.0 - 0.3 * vein - 0.22 * mid * (1.0 - inner); cvv += vein * 0.15;
        thru = mix(vec3(1.0, 0.42, 0.62), GD, 0.55) * (0.15 + gl) * (smoothstep(0.55, 1.0, dm) * 0.7 + rim + (1.0 - al) * 0.2 * gl); }
      else if (id == 257) { a = mix(vec3(0.88, 0.52, 0.24), vec3(0.88, 0.3, 0.55), smoothstep(0.0, 0.5, al)) * (0.8 + 0.3 * w1) * (1.0 - 0.2 * vein); rg = 0.35; cc = 0.45; vel = 0.4; thru = vec3(1.0, 0.5, 0.6) * (0.3 + gl) * (smoothstep(0.5, 1.0, dm) + rim); }
      else { a = mix(vec3(0.04, 0.17, 0.13), vec3(0.22, 0.5, 0.38), smoothstep(0.0, 1.0, al + 0.25 * (w1 - 0.5))) * (0.85 + 0.25 * w2); a = mix(a, vec3(0.62, 0.8, 0.6), mid * 0.55) * (1.0 - 0.25 * vein); rg = 0.4; cc = 0.5; thru = vec3(0.3, 0.6, 0.35) * 0.3 * (smoothstep(0.6, 1.0, dm) + rim); }
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 11.0 + sd), vn(L.zx * 11.0 + 3.0), vn(L.xy * 11.0 + 7.0)) - 0.5) * 0.12); }
    else if (id == 251) {
      if (sk == 0) { float rib = clamp(edge, 0.0, 1.0), vv = vn(vec2(atan(L.y, L.x) * 5.0 + sd, L.z * 2.6) + vec2(w1 * 0.6)), vein = smoothstep(0.06, 0.0, abs(vv - 0.5));
        a = mix(vec3(0.15, 0.06, 0.2), vec3(0.34, 0.19, 0.42), rib) * (0.8 + 0.35 * w1) * (1.0 - 0.3 * vein); cvv += (1.0 - rib) * 0.3; rg = 0.36; cc = 0.6; vel = 0.3;
        emi += GD * vein * (0.06 + 0.75 * clamp(uSpill, 0.0, 2.0)) * (0.7 + 0.3 * sin(tt * 3.0 + L.z * 4.0)) + GD * gl * 0.12 * (0.5 + 0.5 * w2);
        if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 9.0 + sd), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.16); }
      else { a = vec3(0.27, 0.13, 0.32) * (0.8 + 0.3 * w1); rg = 0.42; cc = 0.5; vel = 0.5; cvv += 0.2 * smoothstep(0.4, 1.0, edge); } }
    else if (id == 252) { float knot = clamp(edge, 0.0, 1.0), gr = abs(fract(atan(L.z, L.y) * 0.95 + L.x * 0.9 + w1 * 1.4) - 0.5);
      a = mix(vec3(0.06, 0.18, 0.15), vec3(0.27, 0.56, 0.46), smoothstep(0.06, 0.4, gr) * (0.7 + 0.3 * w2)) * (0.75 + 0.35 * w1);
      cvv += smoothstep(0.12, 0.0, gr) * 0.55 + knot * 0.3; rg = 0.62;
      float moss = smoothstep(0.55, 0.85, vn(L.xy * 5.0 + L.z * 3.0 + sd) + hm * 0.35); a = mix(a, vec3(0.2, 0.33, 0.13) * (0.8 + 0.4 * w3), moss * 0.55);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 14.0 + sd), vn(L.zx * 14.0 + 3.0), vn(L.xy * 14.0 + 7.0)) - 0.5) * 0.28);
      if (sk == 2) { a = mix(a, vec3(0.55, 0.76, 0.6), 0.5); cvv *= 0.5; }
      if (sk == 4) { a = vec3(0.1, 0.05, 0.11) * (0.8 + 0.3 * w1); rg = 0.3; cc = 0.6; }
      if (sk == 6) { a = mix(vec3(0.1, 0.3, 0.24), vec3(0.34, 0.62, 0.48), w2); cvv *= 0.5; cc = 0.3; }
      emi += vec3(0.45, 1.1, 0.8) * clamp(uSpill, 0.0, 2.0) * 0.32 * smoothstep(0.14, 0.0, gr); }
    else {   // 254 an egg
      vec3 p = normalize(L); float an = atan(p.y, p.x), sm = abs(sin(an * 2.0 + 0.8 + p.z * 1.4)) * sqrt(max(0.0, 1.0 - p.z * p.z)), seam = smoothstep(0.07, 0.0, sm) * (1.0 - smoothstep(0.75, 0.95, abs(p.z)));
      a = vec3(0.92, 0.81, 0.58) * (0.86 + 0.2 * w1) * (1.0 - 0.28 * smoothstep(0.72, 0.86, w3)); a = mix(a, vec3(0.22, 0.09, 0.25), seam); rg = 0.42; cc = 0.4; cvv += seam * 0.2;
      float ck = clamp(uKind, 0.0, 1.0), crk = smoothstep(0.035 + 0.02 * ck, 0.0, abs(fract(dot(L, vec3(5.0, 3.0, 4.0)) + w2 * 2.0) - 0.5)) * step(0.05, ck) * step(1.0 - ck, w1 + 0.3);
      a = mix(a, vec3(0.08, 0.03, 0.06), crk); emi += GD * crk * (0.6 + gl) + GD * gl * 0.18 * (0.4 + 0.6 * ndv0) + vec3(1.0, 0.75, 0.5) * seam * gl * 0.3;
      thru = vec3(1.0, 0.82, 0.5) * 0.1; }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.4) / 1.4) * mix(1.0, oSH, 0.7);
    vec3 key = vec3(1.3, 1.2, 1.05), ambC = mix(vec3(0.07, 0.17, 0.13), vec3(0.3, 0.2, 0.4), 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ) * uAmb;
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(vec3(0.06, 0.14, 0.1), vec3(0.42, 0.3, 0.5), smoothstep(-0.35, 0.4, ru)) + vec3(1.0, 0.95, 0.85) * 1.6 * smoothstep(0.85, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);
    vec3 col = a * (mix(ndl, wrap, 0.5) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (0.04 + 0.96 * frs * (1.0 - rg * 0.6));
    col += vel * a * pow(1.0 - ndv0, 2.2) * vec3(1.2, 1.0, 1.3) * 0.9 * occ;   // (velvet: a soft bright sheen at grazing angles)
    if (cc > 0.0) col += cc * (pow(nh, 220.0) * 4.0 * ndl + 0.35 * frs * envC) * occ;
    col += thru * (0.6 + 0.4 * max(0.0, -ndl0));   // (light through the thin parts)
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.45 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead * 0.85);
    col += vec3(1.0, 0.8, 0.9) * clamp(uGlow2, 0.0, 1.0) * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));   // (a blow's flash)
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.95, 0.8, 0.66) * 0.72, dead * 0.72); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</GO-ORRUBEL-MAT>*/
  /*<GH-MAT ids 160..166 (v417 GH: 20k2nh God's Hand, 20k2ni Fault Line)>*/
  else if (id >= 160 && id <= 166) {   // ---- (v417 GH) Earth's Strongs in stone: 160 a sandstone plate (160.3 a terracotta plate; vA.y 1 on a bevel), 161 charcoal basalt (the core showing in the seams), 162 the fist's striking face (sandstone, runes cut in it lit amber by uGlow2), 163 bronze (the cuff), 164 champagne crystal, 165 a wedge (layered strata by its own height: champagne sandstone, terracotta, dark orange, a charcoal basalt root; amber light where it meets the floor), 166 amber mineral. uGlow the amber in the cracks, uKind the tier (2: deeper sculpted cracks), uSpill dust settled on top, uWear crumbling 0..1 (dulled, its light dying)
    float fr = vA.x - float(id), gg = clamp(uGlow, 0.0, 2.0), ndv0 = max(0.0, dot(n, uV)), up = dot(n, uUP), crm = clamp(uWear, 0.0, 1.0), w1 = vn(L.xy * 2.3 + L.z * 1.7), w2 = vn(L.yz * 7.0 + L.x * 4.0), w3 = vn(L.xz * 19.0 + L.y * 11.0);
    vec3 AMB1 = vec3(1.0, 0.45, 0.07), GOLD1 = vec3(1.35, 0.86, 0.32), HOT1 = vec3(1.5, 1.3, 0.95);
    if (id == 164 || id == 166) { vec3 hh = normalize(uLK + uV); float k = pow(ndv0, 1.2), sp = pow(max(0.0, dot(n, hh)), 70.0); vec3 c;   // crystal and mineral: glassy, lit from within, bright facet edges, a sharp glint
      if (id == 164) c = mix(vec3(0.4, 0.31, 0.19), vec3(1.05, 0.93, 0.72), 0.2 + 0.8 * k) * (0.6 + 0.45 * max(0.0, dot(n, uLK))) + vec3(1.0, 0.94, 0.8) * smoothstep(0.8, 1.0, edge) * 0.45 + vec3(1.0, 0.82, 0.5) * 0.2 * gg;
      else c = mix(vec3(0.34, 0.1, 0.01), vec3(1.15, 0.62, 0.14), k) * (0.55 + 0.7 * gg) + GOLD1 * smoothstep(0.8, 1.0, edge) * (0.3 + 0.5 * gg);
      c += vec3(1.0, 0.97, 0.9) * sp * 1.6 + pow(1.0 - ndv0, 3.0) * AMB1 * 0.35; c *= 1.0 - 0.55 * crm;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    metal = 0.0; F0 = vec3(0.04); rough = 0.8;
    if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 6.0), vn(L.zx * 6.0 + 3.0), vn(L.xy * 6.0 + 7.0)) - 0.5) * 0.22 + (vec3(vn(L.yz * 21.0 + 1.0), vn(L.zx * 21.0 + 4.0), vn(L.xy * 21.0 + 8.0)) - 0.5) * 0.12);   // (stone grain: lumps and grit in the light)
    if (uLow < 0.5 && id != 163) { vec3 an = abs(NL); vec2 cuv = (an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz) * 6.5 + fr * 3.0, ci = floor(cuv), cf = cuv - ci, bc = vec2(0.0); float d1 = 9.0, d2 = 9.0;   // (chisel facets: each cell of the face tilted its own way, a faint ridge between)
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)), cc = ci + g, dd = g + vec2(hs(cc), hs(cc + 17.3)) * 0.8 + 0.1 - cf; float dq = dot(dd, dd); if (dq < d1) { d2 = d1; d1 = dq; bc = cc; } else if (dq < d2) d2 = dq; }
      n = normalize(n + (vec3(hs(bc + 3.1), hs(bc + 7.7), hs(bc + 11.9)) - 0.5) * (id == 165 ? 0.2 : 0.38)); cav += (1.0 - smoothstep(0.0, 0.07, sqrt(d2) - sqrt(d1))) * 0.3; }
    float c1 = abs(fract(dot(L, vec3(2.1, 1.3, 1.7)) + w1 * 1.5) - 0.5), c2 = abs(fract(dot(L, vec3(-1.6, 2.4, 1.1)) + w2 * 0.9) - 0.5), cw = 0.009 + 0.008 * uKind + 0.03 * crm, cm = min(c1, c2);
    float msk = smoothstep(0.6 - 0.12 * uKind - 0.3 * crm, 0.74 - 0.1 * uKind, vn(L.zx * 1.1 + L.y * 0.8 + fr * 5.0)), fis = smoothstep(cw, cw * 0.2, cm) * msk; cav += smoothstep(cw * 3.5, cw, cm) * msk * 0.3;   // (a few cracks here and there: more and deeper at Celestial, opening as it crumbles; darkened lips)
    if (id == 163) { metal = 1.0; alb = vec3(0.36, 0.22, 0.1) * (0.85 + 0.3 * w2); F0 = vec3(0.93, 0.64, 0.36) * (0.86 + 0.24 * w1); rough = 0.3 + 0.16 * w3; fis = 0.0;   // bronze: engraved bands, dull tarnish in places, a warm controlled sheen
      if (abs(fract(L.z * 30.0 + w1 * 0.4) - 0.5) < 0.07) cav += 0.5; if (w3 > 0.72) { F0 *= 0.72; rough = 0.58; } }
    else if (id == 161) { alb = vec3(0.075, 0.064, 0.058) * (0.75 + 0.5 * w2); rough = 0.9; float mv = vn(L.xy * 3.0 + L.z * 2.0 + vec2(uTime * 0.2, 0.0)); em += AMB1 * (0.05 + 0.55 * gg) * mv * mv; }   // charcoal basalt, smouldering
    else {
      float strata = sin((L.z + 0.07 * w1) * 46.0) * 0.5 + 0.5;   // (fine sedimentary layers)
      alb = vec3(0.7, 0.56, 0.38) * (0.8 + 0.28 * w1) * (0.92 + 0.12 * strata);
      if (fr > 0.15 && fr < 0.45) alb = vec3(0.6, 0.31, 0.16) * (0.82 + 0.3 * w1) * (0.92 + 0.1 * strata);   // (160.3: terracotta)
      if (id == 165) { float zz = L.z + 0.05 * (w1 - 0.5) + 0.03 * L.x, b = floor(zz * 4.5 + 3.0), hb = hs(vec2(b, 3.0 + fr * 10.0)), bl = abs(fract(zz * 4.5 + 3.0) - 0.5);   // (broad layers; its top face dusty pale)
        alb = (zz < -0.12 ? vec3(0.1, 0.085, 0.075) : hb < 0.28 ? vec3(0.68, 0.37, 0.19) : hb < 0.45 ? vec3(0.62, 0.33, 0.12) : vec3(0.8, 0.67, 0.48)) * (0.86 + 0.26 * w1) * (0.94 + 0.08 * strata); if (bl > 0.46) cav += 0.35;
        alb = mix(alb, vec3(0.84, 0.74, 0.58), smoothstep(0.45, 0.9, up) * 0.55); fis *= 0.5;
        em += AMB1 * (1.0 - smoothstep(0.0, 0.32, vW.z)) * (0.08 + 0.75 * gg) * (0.7 + 0.3 * w2); }   // (the amber of the crack below lighting its foot)
      alb = mix(alb, vec3(0.55, 0.27, 0.08), smoothstep(0.62, 0.85, w2) * 0.35);   // (dark orange weathering)
      alb = mix(alb, vec3(0.86, 0.76, 0.6), (id == 165 ? smoothstep(0.86, 1.0, edge) : smoothstep(0.55, 0.95, edge)) * (0.4 + 0.4 * w3));   // (pale chipped edges on the bevels; a wedge's facets only right at their rims)
      cav += smoothstep(0.82, 0.9, vn(L.xy * 13.0 + L.z * 7.0)) * (1.0 - uLow) * 0.5;   // (pits)
      if (id == 162) { vec2 q = L.xy * 9.0, ci = floor(q), f = fract(q) - 0.5; float h = hs(ci + 0.37), d = abs(f.x - (h - 0.5) * 0.3) + step(0.32, abs(f.y));   // (runes: a stem, a branch, a ring, cell by cell)
        if (h > 0.35) d = min(d, abs(f.y - f.x * (h > 0.6 ? 0.8 : -0.8) - 0.05) + step(0.3, abs(f.x))); if (fract(h * 7.1) > 0.5) d = min(d, abs(length(f - vec2(0.0, 0.17)) - 0.1));
        float rn = smoothstep(0.075, 0.03, d) * step(0.18, hs(ci + 9.1)); cav += rn * 0.7;
        em += mix(AMB1, HOT1, clamp(uGlow2 - 1.3, 0.0, 1.0) * 0.6) * rn * uGlow2 * 2.2 + AMB1 * 0.16 * uGlow2 * (1.0 - smoothstep(-0.2, 0.6, up)); } }
    cav += fis * (0.7 + 0.35 * uKind); alb *= 1.0 - 0.65 * fis;
    em += mix(vec3(0.75, 0.24, 0.03), mix(AMB1, GOLD1, gg * 0.4), smoothstep(cw * 0.7, cw * 0.15, cm)) * fis * (0.02 + (0.55 + 0.45 * uKind) * gg) * (0.8 + 0.2 * sin(uTime * 3.0 + L.x * 4.0 + L.z * 3.0));   // (amber light deep inside the cracks: ember red at the lips)
    alb = mix(alb, vec3(0.63, 0.54, 0.42), smoothstep(0.2, 0.9, up) * clamp(uSpill, 0.0, 1.0) * 0.6 * (0.6 + 0.4 * w1));   // (dust settled on top)
    alb *= 1.0 - 0.42 * crm; em *= 1.0 - 0.7 * crm; }
  /*</GH-MAT>*/
  /*<AB-MAT ids 190..209 (v418 AB: 02f3-abaddon-model.js, Abaddon the Eternal Moonlight)>*/
  else if (id >= 190 && id <= 209) {   // ---- (v418 AB) Abaddon, the Eternal Moonlight (02f3): 190 porcelain ivory (190.1 the mask: no veins, 190.2 an underside; vA.y 1 on a rim: gilded trim), 191 brushed platinum, 192 dark titanium (192.1 darker; sapphire light in its seams), 193 antique gold, 194 a sapphire light channel (vA.z its length: pulses run along it; 194.2 the halo's spear), 195 a claw's luminous cutting edge (vA.z 0 at the edge .. 1 inward), 196 the eye slit, 197 the moon (uGlow2: the black moon of the eclipse), 198 the heart's water and 199 its glass shell (both see-through: their own alpha), 200 a halo ring's metal (200.2 platinum; glowing runes), 201 a ring of light (see-through), 202 the lunar shell's dark inside (its seams lit), 203 the sea of the Ninth Tide (see-through; vA.z along its flow, vA.y 1 at its foaming rim). uGlow the body's light, uGlow2 the eye's / the blade edge's / the eclipse's, uKind a ring's phase, uTime
    float abF = vA.x - float(id), abG = clamp(uGlow, 0.0, 3.0), abT = uTime;
    float abNV = max(0.001, dot(n, uV)), abNL = dot(n, uLK), abDif = max(abNL, 0.0), abWr = clamp(abNL * 0.5 + 0.5, 0.0, 1.0);
    vec3 abR = 2.0 * abNV * n - uV; float abUp = dot(abR, uUP), abSb = max(dot(abR, uLK), 0.0), abSr = max(dot(abR, uLR), 0.0), abHz = abUp - 0.06;
    vec3 abEv = abUp > 0.0 ? mix(vec3(0.06, 0.08, 0.19), vec3(0.6, 0.68, 1.0), pow(clamp(abUp, 0.0, 1.0), 1.25)) : mix(vec3(0.08, 0.13, 0.32), vec3(0.012, 0.016, 0.045), clamp(-abUp * 2.5, 0.0, 1.0));
    abEv += vec3(0.85, 0.9, 1.0) * exp(-abHz * abHz / 0.003) * 0.55;   // (a moonlit horizon in its reflections)
    float abOcc = mix(0.35, 1.0, clamp(ao, 0.0, 1.0)), abFr = pow(1.0 - abNV, 5.0), abHm = 0.5 + 0.5 * dot(n, uUP);
    vec3 abKEY = vec3(1.5, 1.52, 1.68), abAmb = mix(vec3(0.09, 0.11, 0.24), vec3(0.4, 0.44, 0.64), abHm) * uAmb,   /* (v418 AB: brighter, so the porcelain reads in a dark room) */ abRim = pow(1.0 - abNV, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim;
    vec3 abC = vec3(0.0); float abA = 1.0;
    vec3 abG0 = vec3(0.92, 0.68, 0.34) * (abF > 0.05 && id == 193 ? 0.8 : 1.0), abGF = abG0 + (1.0 - abG0) * abFr;   // (the gilding every trim shares: antique gold, warm reflections of the night sky, a bright glint)
    vec3 abGold = (abG0 * (0.1 + 0.62 * abDif) * abKEY * 0.55 + abGF * mix(abEv, vec3(dot(abEv, vec3(0.33))) * vec3(1.0, 0.8, 0.5), 0.45) * 1.25 + vec3(1.0, 0.93, 0.78) * (pow(abSb, 70.0) * 2.4 + pow(abSb, 12.0) * 0.3) + abRim * 0.35) * abOcc;
    if (id == 190) {   // porcelain: a cool glaze, a pearl sheen at grazing angles, kintsugi veins and faint carved runes, gilded rims
      float abU = step(0.15, abF) * step(abF, 0.3), abMk = step(0.05, abF) * step(abF, 0.15), w1 = vn(L.xy * 2.1 + L.z * 1.4 + 7.0), w2 = vn(L.yz * 4.3 + L.x * 2.0);
      float abAr = step(0.32, abF) * step(abF, 0.45);   // (v418 AB round 2: 190.35 the armour blades - warm ivory, dense gold kintsugi cracks; 190.2 a dark navy undercoat; the blue only as light)
      vec3 alb = mix(vec3(0.93, 0.9, 0.83), vec3(0.07, 0.09, 0.2), abU) * (0.94 + 0.08 * w2);
      vec3 ir = 0.5 + 0.5 * cos(6.2832 * (abNV * 1.3 + w1 * 0.6 + vec3(0.0, 0.33, 0.67))), abEw = mix(abEv, vec3(dot(abEv, vec3(0.33))) * vec3(1.06, 1.0, 0.9), 0.6);
      float F = 0.04 + 0.96 * abFr;
      vec3 c = alb * (abDif * abKEY * vec3(1.0, 0.97, 0.9) + abAmb * 1.15) * abOcc + alb * vec3(0.16, 0.18, 0.28) * (1.0 - abWr) * 0.3;
      c += abEw * mix(vec3(1.0), ir * 1.3, 0.3) * F * (1.1 - abU * 0.5) * abOcc + vec3(1.0, 0.98, 0.95) * (pow(abSb, 160.0) * 2.2 + pow(abSb, 26.0) * 0.22) * abOcc + abRim * 0.4 * alb;
      float vq = 1.0 + abAr * 0.9, vv = abs(vn(L.xy * 1.7 * vq + L.z * 1.2 * vq + 3.0) - 0.5) + abs(vn(L.yz * 2.6 * vq + 1.0) - 0.5) * 0.35;
      float vein = (1.0 - abMk) * (1.0 - abU) * smoothstep(0.035 + abAr * 0.05, 0.012 + abAr * 0.022, vv) * smoothstep(0.35 - abAr * 0.3, 0.6 - abAr * 0.3, vn(L.zx * 1.1 + 9.0));
      vein = max(vein, abAr * (1.0 - abU) * smoothstep(0.06, 0.025, abs(vn(L.yz * 3.3 + L.x * 1.9 + 17.0) - 0.5)) * smoothstep(0.42, 0.62, vn(L.xy * 0.9 + 4.0)));   // (v418 AB round 3: a second, branching net of cracks on the armour)
      vec2 ru = vec2(L.x * 6.0 + L.y * 3.0, L.z * 9.0), rf = fract(ru); float rc = hs(floor(ru));
      float rune = (1.0 - abMk) * (1.0 - uLow) * step(0.72, rc) * step(0.5, vn(L.xz * 0.7 + 2.0)) * max(smoothstep(0.08, 0.03, abs(rf.x - 0.5)) * step(0.2, rf.y) * step(rf.y, 0.8), smoothstep(0.06, 0.02, abs(rf.y - 0.5)) * step(0.3, rf.x) * step(rf.x, 0.7) * step(0.86, rc));
      c = c * (1.0 - rune * 0.28) + vec3(0.25, 0.5, 1.2) * rune * 0.18 * (0.3 + abG);
      abC = mix(c, abGold, clamp(max(smoothstep(0.78 - abAr * 0.12, 0.93, edge), vein * 0.95), 0.0, 1.0)) + vec3(1.0, 0.7, 0.28) * vein * (0.12 + abAr * 0.4); }   // (v418 AB round 3: the kintsugi glows a little, warm, so it reads at the fight's size)
    else if (id == 193) abC = abGold;
    else if (id == 202) { float F = 0.04 + 0.96 * abFr; abC = vec3(0.012, 0.015, 0.032) * (0.4 + abWr) + abEv * F * 0.6 + vec3(0.2, 0.5, 1.4) * smoothstep(0.55, 1.0, edge) * (0.35 + abG * 0.6 + uGlow2 * 1.6); }
    else if (id == 191) { vec3 P0 = vec3(0.78, 0.8, 0.86), PF = P0 + (1.0 - P0) * abFr; float st = vn(vec2(L.x * 3.0 + L.y * 2.0, L.z * 46.0 + L.y * 9.0));   // brushed platinum: fine streaks along it
      abC = (P0 * (0.06 + 0.35 * abDif) * abKEY * 0.5 + PF * abEv * (0.85 + 0.35 * st) + vec3(1.0) * (pow(abSb, 50.0) * 1.6 * (0.7 + 0.6 * st) + pow(abSb, 8.0) * 0.12) + abRim * 0.4) * abOcc; }
    else if (id == 192) { vec3 T0 = vec3(0.075, 0.08, 0.11) * (abF > 0.05 ? 0.7 : 1.0), TF = T0 + (vec3(0.55, 0.58, 0.66) - T0) * abFr;   // dark titanium: panels with seams that hold a sapphire light
      float pn = fract(L.z * 3.2 + 0.25 * floor(L.x * 2.0)), seam = smoothstep(0.045, 0.0, min(pn, 1.0 - pn)) * (1.0 - uLow * 0.5), rg = 0.35 + 0.2 * vn(L.xy * 9.0 + L.z * 5.0);
      abC = (T0 * (0.15 + 0.85 * abDif) * abKEY + TF * abEv * 0.9 + vec3(0.8, 0.85, 1.0) * pow(abSb, 2.0 / (rg * rg)) * 0.9 + abRim * 0.6) * abOcc * (1.0 - seam * 0.5) + vec3(0.12, 0.4, 1.3) * seam * (0.15 + 0.6 * abG + uSpill); }
    else if (id == 194) { float fl = pow(0.5 + 0.5 * sin(ao * 18.0 - abT * 5.5), 5.0), fl2 = pow(0.5 + 0.5 * sin(ao * 7.0 - abT * 2.3 + 1.0), 3.0), k = (0.55 + 0.75 * abG) * (abF > 0.15 ? 1.5 : 1.0);   // a channel of sapphire light, pulses running along it
      abC = mix(vec3(0.06, 0.24, 1.0), vec3(0.75, 0.92, 1.35), fl * 0.7 + fl2 * 0.2) * k + vec3(0.1, 0.2, 0.5) * abNV; }
    else if (id == 195) { float x = clamp(ao, 0.0, 1.0), fl = vn(vec2(L.x * 1.5 + L.z * 1.5 - abT * 1.6, x * 3.0));   // the cutting edge: white-hot at the edge, sapphire, then deep blue into the blade
      vec3 e = mix(vec3(1.25, 1.4, 1.6), vec3(0.25, 0.6, 1.45), smoothstep(0.0, 0.35, x)); e = mix(e, vec3(0.03, 0.12, 0.6), smoothstep(0.35, 1.0, x));
      abC = e * (0.75 + 0.5 * abG + 0.6 * uGlow2) * (0.85 + 0.3 * fl) + abEv * (0.04 + 0.96 * abFr) * 0.8 + vec3(1.0) * pow(abSb, 90.0) * 2.0; }
    else if (id == 196) abC = vec3(0.8, 0.95, 1.6) * (0.9 + 1.4 * uGlow2) * (0.9 + 0.1 * sin(abT * 11.0));
    else if (id == 197) {   // the moon: maria and craters, lit by the key light and its own glow; the eclipse turns it black with a blue corona
      vec3 lp = normalize(L); vec2 mu = vec2(atan(lp.y, lp.x) * 0.9549, lp.z * 2.4);
      float cr = vn(mu * 2.0 + 3.0) * 0.55 + vn(mu * 5.0) * 0.28 + vn(mu * 11.0) * 0.17, mar = smoothstep(0.42, 0.62, vn(mu * 1.3 + 11.0));
      vec2 cc = mu * 3.2, ci = floor(cc), cf = fract(cc) - 0.5; float rr = length(cf + (vec2(hs(ci + 3.1), hs(ci + 7.7)) - 0.5) * 0.4), crat = step(0.55, hs(ci)) * (smoothstep(0.32, 0.22, rr) * 0.6 - smoothstep(0.22, 0.12, rr) * 0.35);
      vec3 ma = mix(vec3(0.82, 0.85, 0.95), vec3(0.42, 0.46, 0.62), mar) * (0.82 + 0.3 * cr) * (1.0 + crat * 0.6);
      abC = ma * (0.3 + 0.95 * abWr) * (0.9 + 0.5 * abG) + vec3(0.2, 0.4, 1.0) * 0.18 * (0.5 + abG) + vec3(0.55, 0.75, 1.3) * pow(1.0 - abNV, 2.5) * 0.6;
      abC = mix(abC, vec3(0.004, 0.005, 0.012), uGlow2 * 0.96) + vec3(0.35, 0.62, 1.5) * pow(1.0 - abNV, 3.0) * uGlow2 * 2.6; }
    else if (id == 198) {   // the heart's water: currents swirling round the moon, bright filaments, see-through
      vec3 lp = normalize(L); float an = atan(lp.y, lp.x);
      float sw = vn(vec2(an * 2.0 + lp.z * 3.0 + abT * 0.9, lp.z * 4.0 - abT * 0.5)), sw2 = vn(vec2(an * 4.0 - lp.z * 5.0 - abT * 1.3, lp.z * 7.0 + abT * 0.7) + 5.0);
      float fil = smoothstep(0.05, 0.0, abs(sw - 0.5)) + smoothstep(0.04, 0.0, abs(sw2 - 0.5)) * 0.6;
      vec3 cw = mix(vec3(0.02, 0.1, 0.45), vec3(0.3, 0.7, 1.35), sw * 0.6 + 0.2) * (0.6 + 0.6 * abG) + vec3(0.7, 0.9, 1.4) * fil * (0.5 + 0.7 * abG);
      cw = mix(cw, vec3(0.02, 0.03, 0.08), uGlow2 * 0.85) + vec3(0.3, 0.55, 1.4) * fil * uGlow2 * 0.4;
      vec3 cc = vec3(tone(cw.r), tone(cw.g), tone(cw.b)); abA = clamp(max(0.3 + 0.28 * sw + 0.4 * fil + 0.25 * (1.0 - abNV), max(cc.r, max(cc.g, cc.b)) * 0.9), 0.0, 0.94);
      gl_FragColor = vec4(min(cc * abA, vec3(abA)) * uAlpha, abA * uAlpha); return; }
    else if (id == 199) {   // the glass shell: clear, its reflections and fresnel rim, the heart's light caught in it
      vec3 cg = abEv * (0.04 + 0.96 * abFr) * 1.6 + vec3(1.0, 0.98, 1.0) * (pow(abSb, 200.0) * 4.0 + pow(abSb, 40.0) * 0.5) + vec3(0.6, 0.75, 1.0) * pow(abSr, 60.0) * 0.8 + vec3(0.25, 0.5, 1.2) * pow(1.0 - abNV, 2.0) * (0.3 + 0.4 * abG) * (1.0 - uGlow2 * 0.5);
      cg = vec3(tone(cg.r), tone(cg.g), tone(cg.b)); abA = clamp(0.04 + 0.7 * pow(1.0 - abNV, 3.0) + max(cg.r, max(cg.g, cg.b)) * 0.8, 0.0, 1.0);
      gl_FragColor = vec4(min(cg, vec3(abA)) * uAlpha, abA * uAlpha); return; }
    else if (id == 200) {   // a halo ring: gold (or platinum), its runes lit in a slow pulse running round it
      float an = atan(L.y, L.x), cell = floor(an * 7.6394 + 24.0), dd = fract(an * 7.6394) - 0.5, on = step(0.42, hs(vec2(cell, 3.0 + uKind))) * smoothstep(0.32, 0.12, abs(dd)) * step(0.35, abs(NL.z) + 0.2);
      float pl = pow(0.5 + 0.5 * sin(an * 3.0 - abT * 2.0 + uKind * 1.3), 6.0);
      vec3 PF = vec3(0.78, 0.8, 0.86) + (1.0 - vec3(0.78, 0.8, 0.86)) * abFr, plat = (vec3(0.78, 0.8, 0.86) * (0.06 + 0.35 * abDif) * abKEY * 0.5 + PF * abEv + vec3(1.0) * pow(abSb, 50.0) * 1.5 + abRim * 0.4) * abOcc;
      abC = (abF > 0.15 ? plat : abGold) + vec3(0.35, 0.65, 1.5) * on * (0.3 + 0.8 * abG + 1.2 * pl); }
    else if (id == 201 || id == 203) {
      if (id == 201) { float an = atan(L.y, L.x), pl = pow(0.5 + 0.5 * sin(an * 5.0 - abT * 3.0 + uKind * 1.7), 6.0);   // a ring of light: see-through, a pulse running round
        vec3 cl2 = vec3(0.3, 0.58, 1.4) * (0.55 + 0.6 * abG) + vec3(0.8, 0.9, 1.3) * pl * 0.8; cl2 = vec3(tone(cl2.r), tone(cl2.g), tone(cl2.b));
        abA = clamp(max(cl2.r, max(cl2.g, cl2.b)) * (0.45 + 0.55 * abNV), 0.0, 1.0); gl_FragColor = vec4(cl2 * abA * uAlpha, abA * uAlpha); return; }
      // the sea of the Ninth Tide: moving water (its normal stirred by two noises flowing along it), fresnel reflections, glints, foam at its rim, caustic threads
      vec2 fq = vec2(ao * 6.0 - abT * 1.2, edge * 3.0 + abT * 0.2); float wv = vn(fq * 2.0 + L.xy * 0.5), wv2 = vn(fq * 5.3 + 3.0);
      vec3 nn = normalize(n + (vec3(wv, wv2, 0.5) - 0.5) * 0.6); float nd2 = max(0.001, dot(nn, uV)), F = 0.04 + 0.96 * pow(1.0 - nd2, 5.0); vec3 r2 = 2.0 * nd2 * nn - uV; float sb2 = max(dot(r2, uLK), 0.0);
      float foam = smoothstep(0.75, 1.0, edge + wv2 * 0.25) + smoothstep(0.55, 0.9, wv2) * 0.25;
      float cau = smoothstep(0.03, 0.0, abs(wv - 0.5)) + smoothstep(0.025, 0.0, abs(wv2 - 0.5)) * 0.6;   // (v418 AB: clearer, lighter water - caustic threads and foam carry it, the body thin)
      vec3 cs = mix(vec3(0.06, 0.28, 0.66), vec3(0.32, 0.78, 1.25), wv * 0.6 + 0.2) * (0.6 + 0.6 * abG) + abEv * F * 1.3 + vec3(1.0) * pow(sb2, 120.0) * 2.5 + vec3(0.85, 0.95, 1.1) * foam * 0.9 + vec3(0.5, 0.85, 1.4) * cau * 0.7;
      cs = vec3(tone(cs.r), tone(cs.g), tone(cs.b)); abA = clamp(max(0.16 + 0.45 * F + foam * 0.6 + cau * 0.3 + 0.08 * wv, max(cs.r, max(cs.g, cs.b)) * 0.45), 0.0, 0.92);
      gl_FragColor = vec4(min(cs * abA, vec3(abA)) * uAlpha, abA * uAlpha); return; }
    gl_FragColor = vec4(vec3(tone(abC.r), tone(abC.g), tone(abC.b)) * uAlpha, uAlpha); return; }
  /*</AB-MAT>*/
  /*<BL-MAT ids 280..299 (v426 BL: 02f4-belial-model.js, Belial the World Pillar)>*/
  else if (id >= 280 && id <= 299) {   // ---- (v426 BL) Belial, the World Pillar (02f4): 280 ivory stone-ceramic (280.1 the faceplate: no joints or cracks; 280.3 weathered; masonry joints, carved grooves, hairline cracks lit amber by uGlow; vA.y 1 on a rim: gilded trim), 281 obsidian black metal (281.2 a recess; panel seams holding amber light), 282 weathered bronze (patina in its hollows), 283 antique gold (283.2 engraved), 284 an amber energy channel (vA.z along it: pulses), 285 an eye (uGlow2), 286 the Core's planet (bands, continents, amber fissures; uGlow2 compression to white heat), 287 its transparent amber field, 288 a ring's metal with runes lit in a pulse running round (288.3 a dark runic band: vA.z along, vA.y across), 289 a ring of light (see-through), 290 a temple wall (arched windows lit amber by uGlow), 291 roof tiles (gilded eaves and hips on vA.y), 292 banner cloth (maroon, a gold border and the sign), 293 weathered stone (293.3 carved runes lit by uGlow2; amber cracks by uGlow). uSpill 0..1 dissolves every one into gold dust (burning gold edges); uKind a ring's phase; uTime
    float bF = vA.x - float(id), bG = clamp(uGlow, 0.0, 3.0), bG2 = clamp(uGlow2, 0.0, 3.0), bT = uTime, bDE = 0.0;
    if (uSpill > 0.0) { float bDn = vn(L.xy * 4.3 + L.z * 2.7) * 0.55 + vn(L.yz * 11.0 + L.x * 6.0) * 0.3 + vn(L.xz * 23.0 + 5.0) * 0.15, bTh = uSpill * 1.15 - 0.08; if (bDn < bTh) discard; bDE = smoothstep(bTh + 0.09, bTh, bDn); }
    float bNV = max(0.001, dot(n, uV)), bNL = dot(n, uLK), bDif = max(bNL, 0.0), bWr = clamp(bNL * 0.5 + 0.5, 0.0, 1.0);
    vec3 bR = 2.0 * bNV * n - uV; float bUp = dot(bR, uUP), bSb = max(dot(bR, uLK), 0.0), bHz = bUp - 0.05;
    vec3 bEv = bUp > 0.0 ? mix(vec3(0.17, 0.14, 0.12), vec3(0.82, 0.74, 0.62), pow(clamp(bUp, 0.0, 1.0), 1.2)) : mix(vec3(0.24, 0.16, 0.08), vec3(0.035, 0.028, 0.022), clamp(-bUp * 2.5, 0.0, 1.0));
    bEv += vec3(1.0, 0.82, 0.52) * exp(-bHz * bHz / 0.004) * 0.6;   // (a warm stormlit horizon in its reflections)
    float bOcc = mix(0.38, 1.0, clamp(ao, 0.0, 1.0)), bFr = pow(1.0 - bNV, 5.0), bHm = 0.5 + 0.5 * dot(n, uUP);
    vec3 bKEY = vec3(1.62, 1.46, 1.24), bAmb = mix(vec3(0.11, 0.09, 0.09), vec3(0.42, 0.37, 0.32), bHm) * uAmb, bRim = pow(1.0 - bNV, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim;
    vec3 bAMB = vec3(1.0, 0.56, 0.12), bHOT = vec3(1.5, 1.2, 0.75), bG0 = vec3(1.0, 0.72, 0.33), bGF = bG0 + (1.0 - bG0) * bFr;
    float bEng = (1.0 - uLow) * smoothstep(0.075, 0.03, abs(fract(L.x * 5.0 + L.y * 3.0 + 0.6 * sin(L.z * 7.0 + L.x * 3.0)) - 0.5)) * step(0.45, vn(L.xz * 1.7 + L.y)) * (id == 283 && bF > 0.1 ? 1.0 : 0.45);   // (engraved filigree)
    vec3 bGold = (bG0 * (0.12 + 0.68 * bDif) * bKEY * 0.55 + bGF * mix(bEv, vec3(dot(bEv, vec3(0.33))) * vec3(1.0, 0.8, 0.5), 0.45) * 1.3 + vec3(1.0, 0.93, 0.76) * (pow(bSb, 60.0) * 2.4 + pow(bSb, 11.0) * 0.32) + bRim * 0.45) * bOcc * (1.0 - bEng * 0.45);
    vec3 bC = vec3(0.0); float bA = 1.0;
    if (id == 280) {   // ivory stone-ceramic: a warm glaze, masonry joints, carved grooves, weathering, hairline cracks with amber light deep in them, gilded rims
      float sm = step(0.05, bF) * step(bF, 0.15), wth = step(0.25, bF) * step(bF, 0.45), w1 = vn(L.xy * 1.9 + L.z * 1.3 + 3.0), w2 = vn(L.yz * 5.0 + L.x * 2.5);
      vec3 alb = vec3(0.86, 0.8, 0.68) * (0.9 + 0.12 * w2) * (1.0 - wth * 0.1 * w1);
      alb = mix(alb, vec3(0.58, 0.48, 0.36), wth * smoothstep(0.5, 0.85, w1) * 0.5);
      vec3 c = alb * (bDif * bKEY * vec3(1.0, 0.96, 0.88) + bAmb * 1.1) * bOcc + alb * vec3(0.18, 0.14, 0.1) * (1.0 - bWr) * 0.25;
      c += bEv * (0.035 + 0.965 * bFr) * 0.9 * bOcc + vec3(1.0, 0.97, 0.9) * (pow(bSb, 90.0) * 1.2 + pow(bSb, 18.0) * 0.12) * bOcc * (1.0 - wth * 0.6) + bRim * 0.35 * alb;
      vec2 bq = vec2((L.x + L.y) * 1.7, L.z * 3.4); float row = floor(bq.y); bq.x += 0.5 * mod(row, 2.0); vec2 bfq = fract(bq);
      float joint = (1.0 - sm) * (1.0 - uLow * 0.5) * max(smoothstep(0.035, 0.0, min(bfq.y, 1.0 - bfq.y)), smoothstep(0.03, 0.0, min(bfq.x, 1.0 - bfq.x)) * 0.8);
      c *= 1.0 - joint * 0.42;
      float ck = abs(vn(L.xy * 2.3 + L.z * 1.6 + 11.0) - 0.5) + abs(vn(L.yz * 3.7 + 2.0) - 0.5) * 0.4, crack = (1.0 - sm) * smoothstep(0.03, 0.008, ck) * smoothstep(0.4, 0.62, vn(L.zx * 0.9 + 7.0));
      c = c * (1.0 - crack * 0.6) + bAMB * crack * (0.12 + 0.85 * bG) + bHOT * crack * bG * bG * 0.25;
      bC = mix(c, bGold, clamp(smoothstep(0.8, 0.94, edge), 0.0, 1.0)); }
    else if (id == 281) { float rec = step(0.15, bF); vec3 T0 = vec3(0.03, 0.027, 0.03) * (rec > 0.5 ? 0.55 : 1.0), TF = T0 + (vec3(0.6, 0.55, 0.5) - T0) * bFr;   // obsidian: glossy black metal, panel seams holding amber light
      float pn = fract(L.z * 2.6 + 0.3 * floor(L.x * 1.8 + L.y * 1.8)), seam = smoothstep(0.05, 0.0, min(pn, 1.0 - pn)) * (1.0 - uLow * 0.5), rg = 0.18 + 0.14 * vn(L.xy * 8.0 + L.z * 4.0);
      bC = (T0 * (0.2 + 0.8 * bDif) * bKEY + TF * bEv * 1.05 + vec3(1.0, 0.92, 0.8) * pow(bSb, 2.0 / (rg * rg)) * 1.1 + bRim * 0.55) * bOcc * (1.0 - seam * 0.5) + bAMB * seam * (0.06 + 0.5 * bG) * (1.0 - rec * 0.5); bC = mix(bC, bGold, smoothstep(0.86, 0.97, edge) * (1.0 - rec)); }
    else if (id == 282) { float w1 = vn(L.xy * 3.0 + L.z * 2.0), w2 = vn(L.yz * 9.0 + L.x * 5.0), pat = smoothstep(0.55, 0.8, w1) * (0.6 + 0.4 * w2);   // weathered bronze: patina in its hollows, a warm sheen
      vec3 B0 = mix(vec3(0.62, 0.38, 0.2), vec3(0.22, 0.2, 0.14), pat * 0.7) * (0.85 + 0.25 * w2), BF = B0 + (1.0 - B0) * bFr; float rg = 0.32 + 0.25 * pat;
      bC = (B0 * (0.1 + 0.55 * bDif) * bKEY * 0.5 + BF * bEv * (1.0 - pat * 0.6) + vec3(1.0, 0.85, 0.65) * pow(bSb, 2.0 / (rg * rg)) * (0.9 - pat * 0.5) + bRim * 0.35) * bOcc + vec3(0.05, 0.06, 0.04) * pat * bAmb + bAMB * smoothstep(0.85, 1.0, edge) * bG * 0.25; }
    else if (id == 283) bC = bGold + bAMB * bEng * bG * 0.45;
    else if (id == 284) { float fl = pow(0.5 + 0.5 * sin(ao * 16.0 - bT * 4.5), 5.0), fl2 = pow(0.5 + 0.5 * sin(ao * 6.0 - bT * 1.9 + 1.0), 3.0), k = 0.6 + 0.8 * bG;   // amber energy, pulses running along it
      bC = mix(vec3(0.9, 0.38, 0.05), vec3(1.6, 1.25, 0.75), fl * 0.7 + fl2 * 0.25) * k + vec3(0.35, 0.18, 0.05) * bNV; }
    else if (id == 285) bC = mix(vec3(1.5, 0.75, 0.15), vec3(1.7, 1.45, 1.0), 0.3 + 0.3 * min(bG2, 1.5)) * (0.8 + 0.8 * bG2) * (0.92 + 0.08 * sin(bT * 9.0));
    else if (id == 286) { vec3 lp = normalize(L); float lat = lp.z, lon = atan(lp.y, lp.x);   // the planet: dense, banded, amber fissures and continents; compression turns it white-hot
      float bands = sin(lat * 15.0 + 2.0 * vn(vec2(lon * 2.0 + bT * 0.15, lat * 3.0))) * 0.5 + 0.5, cont = smoothstep(0.45, 0.62, vn(vec2(lon * 1.6 - bT * 0.2, lat * 2.4) + 4.0) * 0.7 + vn(vec2(lon * 4.0, lat * 6.0)) * 0.3);
      float fis = smoothstep(0.035, 0.0, abs(vn(vec2(lon * 3.0 - bT * 0.3, lat * 5.0) + 9.0) - 0.5));
      vec3 sf = mix(vec3(0.16, 0.09, 0.04), vec3(0.42, 0.26, 0.1), bands) * (0.6 + 0.4 * cont);
      vec3 c = sf * (0.5 + 0.8 * bWr) + bAMB * (fis * (0.9 + 1.1 * bG) + (1.0 - cont) * 0.2 * (0.5 + bG)) + vec3(1.0, 0.7, 0.3) * pow(1.0 - bNV, 2.5) * (0.5 + 0.6 * bG);
      bC = mix(c, bHOT * (1.0 + 0.6 * bG), clamp(bG2 * 0.55, 0.0, 0.9)) + vec3(1.0, 0.95, 0.85) * pow(bSb, 40.0) * 0.6; }
    else if (id == 287) { vec3 lp = normalize(L); float an = atan(lp.y, lp.x), sw = vn(vec2(an * 2.5 + lp.z * 3.0 - bT * 0.8, lp.z * 4.0 + bT * 0.4)), fil = smoothstep(0.05, 0.0, abs(sw - 0.5));   // the amber field: see-through, currents of light turning in it
      vec3 cs = vec3(1.0, 0.5, 0.1) * (0.15 + 0.6 * pow(1.0 - bNV, 2.0)) * (0.6 + 0.8 * bG) + vec3(1.4, 1.0, 0.55) * fil * (0.4 + 0.7 * bG) + bEv * (0.04 + 0.96 * bFr) * 0.6 + vec3(1.0, 0.95, 0.85) * pow(bSb, 120.0) * 3.0;
      cs = vec3(tone(cs.r), tone(cs.g), tone(cs.b)); bA = clamp(0.03 + 0.45 * pow(1.0 - bNV, 2.5) + fil * 0.25 + max(cs.r, max(cs.g, cs.b)) * 0.18, 0.0, 0.85);
      gl_FragColor = vec4(min(cs, vec3(bA)) * uAlpha, bA * uAlpha); return; }
    else if (id == 288) { float band = step(0.25, bF) * step(bF, 0.45), an = atan(L.y, L.x), crd = band > 0.5 ? ao * 14.0 : an * 7.6394 + 24.0, cell = floor(crd), dd = fract(crd) - 0.5, ac = band > 0.5 ? (edge - 0.5) * 2.0 : NL.z;   // runes lit in a pulse running round (or along a band)
      float h = hs(vec2(cell, 3.0 + uKind)), stem = smoothstep(0.1, 0.05, abs(dd - (h - 0.5) * 0.2)) * step(abs(ac), 0.72);
      float brn = h > 0.55 ? smoothstep(0.09, 0.035, abs(ac - dd * 1.4 * (h > 0.8 ? 1.0 : -1.0))) * step(abs(dd), 0.35) : smoothstep(0.09, 0.035, abs(ac - (h - 0.5) * 0.8)) * step(abs(dd), 0.3);
      float rune = max(stem, brn) * step(0.22, h) * (band > 0.5 ? 1.0 : step(0.25, abs(ac)) * 0.0 + 1.0);
      float pl = pow(0.5 + 0.5 * sin(crd * 0.45 - bT * 3.0 + uKind * 1.7), 6.0);
      vec3 base = band > 0.5 ? vec3(0.035, 0.028, 0.025) * (0.4 + bDif) + bEv * (0.04 + 0.96 * bFr) * 0.5 : bGold;
      bC = base * (1.0 - rune * 0.5) + mix(bAMB, bHOT, pl) * rune * (0.3 + 0.7 * bG + 1.0 * pl * (0.4 + bG2)); }
    else if (id == 289) { float an = atan(L.y, L.x), pl = pow(0.5 + 0.5 * sin(an * 5.0 - bT * 3.2 + uKind * 1.7), 6.0);   // a ring of light
      vec3 cl2 = vec3(1.1, 0.62, 0.16) * (0.55 + 0.6 * bG) + vec3(1.4, 1.15, 0.7) * pl * 0.8; cl2 = vec3(tone(cl2.r), tone(cl2.g), tone(cl2.b));
      bA = clamp(max(cl2.r, max(cl2.g, cl2.b)) * (0.45 + 0.55 * bNV), 0.0, 1.0); gl_FragColor = vec4(cl2 * bA * uAlpha, bA * uAlpha); return; }
    else if (id == 290) { vec3 an3 = abs(NL); float side = step(an3.z, max(an3.x, an3.y)); vec2 wq = an3.x > an3.y ? vec2(L.y, L.z) : vec2(L.x, L.z);   // a temple wall: ivory masonry, arched windows lit amber
      vec2 cq = vec2(wq.x * 2.4, wq.y * 2.6), ci = floor(cq), cf = fract(cq) - 0.5;
      float arch = cf.y < 0.05 ? abs(cf.x) - 0.17 : length(vec2(cf.x, cf.y - 0.05)) - 0.17, win = smoothstep(0.02, -0.02, arch) * step(-0.36, cf.y) * step(0.3, hs(ci + 7.0) + 0.25) * side;
      float frm = smoothstep(0.05, 0.0, abs(arch) - 0.035) * step(-0.38, cf.y) * side;
      vec3 alb = vec3(0.84, 0.78, 0.66) * (0.9 + 0.12 * vn(wq * 3.0));
      vec3 c = alb * (bDif * bKEY + bAmb * 1.1) * bOcc + bEv * (0.035 + 0.965 * bFr) * 0.7 * bOcc;
      float lit = 0.55 + 0.45 * hs(ci + 3.0), fl = 0.85 + 0.15 * sin(bT * 2.0 + hs(ci) * 20.0);
      c = mix(c, bGold, frm * 0.75 * (1.0 - uLow * 0.5));
      c = mix(c, mix(vec3(0.5, 0.2, 0.04), bHOT, 0.3 + 0.3 * cf.y) * lit * fl * (0.45 + 0.8 * bG), win);
      bC = mix(c, bGold, smoothstep(0.82, 0.95, edge)); }
    else if (id == 291) { float tl = fract(L.z * 9.0), tc = fract((L.x + L.y) * 6.0 + 0.5 * floor(L.z * 9.0)), gro = smoothstep(0.1, 0.0, tl) + smoothstep(0.07, 0.0, min(tc, 1.0 - tc)) * 0.6, w1 = vn(L.xy * 4.0);   // roof tiles: dark glazed rows, gilded eaves and hips
      vec3 T0 = mix(vec3(0.05, 0.04, 0.035), vec3(0.16, 0.1, 0.06), w1 * 0.6), TF = T0 + (vec3(0.6, 0.5, 0.4) - T0) * bFr;
      vec3 c = (T0 * (0.25 + 0.75 * bDif) * bKEY + TF * bEv * 0.9 + vec3(1.0, 0.9, 0.75) * pow(bSb, 30.0) * 0.6 + bRim * 0.4) * bOcc * (1.0 - gro * 0.45);
      bC = mix(c, bGold, smoothstep(0.75, 0.92, edge)); }
    else if (id == 292) { float wv = vn(vec2(L.y, L.z) * vec2(8.0, 2.0) + 3.0); vec3 alb = vec3(0.32, 0.05, 0.07) * (0.75 + 0.35 * wv);   // banner cloth: maroon, a gold border, the sign
      vec2 g = vec2(L.y, L.z + 0.55); float cir = abs(length(g - vec2(0.0, -0.08)) - 0.1), cre = abs(length(g - vec2(0.0, 0.12)) - 0.13) + step(0.12, g.y) * 9.0, gly = smoothstep(0.03, 0.015, min(cir, cre));
      vec3 c = alb * (bDif * bKEY * 0.9 + bAmb) * bOcc + vec3(0.5, 0.2, 0.2) * pow(1.0 - bNV, 3.0) * 0.4 + bRim * 0.25 * alb;
      bC = mix(c, bGold, max(gly, smoothstep(0.7, 0.9, edge))) + bAMB * gly * bG * 0.4; }
    else {   // 293 weathered stone: grain, chisel marks, carved runes (lit by uGlow2), cracks with amber light (uGlow), gilded bevels
      float w1 = vn(L.xy * 2.2 + L.z * 1.7), w2 = vn(L.yz * 7.0 + L.x * 4.0), w3 = vn(L.xz * 19.0 + L.y * 11.0);
      vec3 ns = uLow < 0.5 ? normalize(n + (vec3(vn(L.yz * 6.0), vn(L.zx * 6.0 + 3.0), vn(L.xy * 6.0 + 7.0)) - 0.5) * 0.3) : n; float dd2 = max(dot(ns, uLK), 0.0);
      vec3 alb = mix(vec3(0.42, 0.38, 0.33), vec3(0.64, 0.58, 0.49), w1) * (0.85 + 0.25 * w2) * (1.0 - 0.25 * smoothstep(0.7, 0.9, w3));
      vec3 c = alb * (dd2 * bKEY + bAmb * 1.05) * bOcc + bEv * (0.03 + 0.97 * bFr) * 0.4 * bOcc;
      if (bF > 0.25) { vec2 q = vec2(atan(L.y, L.x) * 2.546, L.z * 6.0), ci = floor(q), f = fract(q) - 0.5; float hh = hs(ci + 0.37), dr = abs(f.x - (hh - 0.5) * 0.3) + step(0.32, abs(f.y));
        if (hh > 0.35) dr = min(dr, abs(f.y - f.x * (hh > 0.6 ? 0.8 : -0.8) - 0.05) + step(0.3, abs(f.x))); float rn = smoothstep(0.075, 0.03, dr) * step(0.3, hs(ci + 9.1));
        c = c * (1.0 - rn * 0.45) + mix(bAMB, bHOT, 0.3) * rn * (0.25 + 1.6 * bG2); }
      float c1 = abs(fract(dot(L, vec3(2.1, 1.3, 1.7)) + w1 * 1.5) - 0.5), c2 = abs(fract(dot(L, vec3(-1.6, 2.4, 1.1)) + w2 * 0.9) - 0.5), fis = smoothstep(0.014, 0.003, min(c1, c2)) * smoothstep(0.55, 0.72, vn(L.zx * 1.1 + L.y * 0.8));
      c = c * (1.0 - fis * 0.7) + bAMB * fis * (0.05 + 1.2 * bG);
      bC = mix(c, bGold, smoothstep(0.88, 1.0, edge) * 0.6); }
    bC += bAMB * bDE * 2.2 + bHOT * bDE * bDE * 1.5;   // (the dissolve's burning gold edge)
    gl_FragColor = vec4(vec3(tone(bC.r), tone(bC.g), tone(bC.b)) * uAlpha, uAlpha); return; }
  /*</BL-MAT>*/
  /*<MD-MAT ids 495..499 (v450 MD: 20k7q-water-mobydick-model.js, Moby Dick the spirit whale)>*/
  else if (id >= 495 && id <= 499) {   // ---- (v450 MD) Moby Dick (20k7q): 495 its skin (vA.y round the body: 0 the back .. 0.5 the belly .. 1; vA.z along it: 0 the snout .. 1 the flukes' root): pearl white and pale silver in the light, deep blue-violet in shadow and along the belly, star fields and constellation lines drifting inside it, luminous contour lines, fine creases behind the head, a pearly fresnel edge; 496 a fin or fluke (vA.y 0 its middle .. 1 its free edge: translucent, glowing; vA.z along it); 497 an eye (vA.y 0 the pupil .. 1 behind it); 498 a tooth; 499 the inside of the mouth. uGlow the markings, uGlow2 the slam's flash, uFx the dissolve into foam (0..1), uTime the stars' drift. Colours in display space (no tone curve)
    float lit, ndv = max(0.0, dot(n, uV)), fres = pow(1.0 - ndv, 2.2), sv = edge, su = clamp(ao, 0.0, 1.0), dz = 0.0; vec3 c;
    if (uFx > 0.0) { if (dot(normalize(vN), uV) < 0.0) discard;   // (its inside never shows through the holes)
      float nz = vn(vec2(su * 24.0, sv * 17.0) + float(id) * 1.7) * 0.45 + vn(vec2(su * 61.0, sv * 43.0) + 5.0) * 0.2 + vn(vec2(su * 7.0, sv * 5.0) + 3.0) * 0.35, th = uFx * 1.25 - 0.15; if (nz < th) discard; dz = max(1.0 - smoothstep(th, th + 0.16, nz), uFx * 0.55); }   // (the dissolve: a noise front, its edge foaming white)
    if (id == 497) { float pu = 1.0 - smoothstep(0.12, 0.2, sv), ir = smoothstep(0.17, 0.24, sv) * (1.0 - smoothstep(0.36, 0.46, sv));
      c = cel3(vec3(0.02, 0.03, 0.1), vec3(0.05, 0.08, 0.22), vec3(0.12, 0.17, 0.4), n, lit) * (1.0 - 0.6 * pu) + vec3(0.35, 0.85, 1.25) * ir * (0.6 + 0.5 * uGlow) + vec3(1.0) * celSpec(n, 0.975) * 0.9; }
    else if (id == 498) c = cel3(vec3(0.42, 0.4, 0.52), vec3(0.82, 0.81, 0.84), vec3(1.0, 0.99, 0.95), n, lit) + vec3(0.25, 0.4, 0.6) * fres * 0.5;
    else if (id == 499) c = cel3(vec3(0.05, 0.02, 0.1), vec3(0.17, 0.07, 0.22), vec3(0.32, 0.15, 0.36), n, lit);
    else {
      float bk = id == 495 ? smoothstep(0.42, 0.86, 1.0 - abs(sv * 2.0 - 1.0)) * (1.0 - 0.65 * smoothstep(0.6, 0.82, su)) : 0.0;   // (v455 MD2: the belly's violet fading down the tail stock, so the raised tail reads pearl from any side)
      { float hm = 0.5 + 0.5 * dot(n, uUP), x = dot(n, uLK) * 0.85 + (hm - 0.5) * 0.5 - bk * 0.22; lit = 0.5 * smoothstep(0.0, 0.07, x) + 0.5 * smoothstep(0.4, 0.47, x);   // (its own cel bands: a broad shadow band under it, deep blue-violet)
        vec3 SH = mix(vec3(0.16, 0.14, 0.44), vec3(0.08, 0.06, 0.28), bk), MD = mix(vec3(0.58, 0.62, 0.86), vec3(0.3, 0.28, 0.64), bk), LI = mix(vec3(0.94, 0.96, 1.0), vec3(0.64, 0.64, 0.92), bk);   // (v455 MD2: the pearl kept, a deeper blue-violet under it)
        c = (lit < 0.5 ? mix(SH, MD, lit * 2.0) : mix(MD, LI, lit * 2.0 - 1.0)) * (0.86 + 0.2 * hm + 0.1 * clamp(x, -1.0, 1.0));
        c = mix(c, c * vec3(0.72, 0.74, 0.95), (1.0 - smoothstep(0.2, 0.85, x)) * smoothstep(0.5, 0.75, lit) * 0.6); }   // (v455 MD2: the lit pearl rolling off toward lilac before its shadow band, so the body reads round)
      c += vec3(0.07, 0.03, 0.12) * fres * (1.0 - bk) + vec3(0.9, 0.95, 1.0) * celSpec(n, 0.965) * 0.35 * (1.0 - bk);   // (a pearl's violet sheen toward its edge; a soft highlight)
      if (id == 495 && uLow < 0.5) { float w = abs(fract(sv * 64.0 + vn(vec2(su * 26.0, sv * 18.0)) * 1.6) - 0.5); c *= 1.0 - 0.09 * (1.0 - smoothstep(0.02, 0.12, w)) * smoothstep(0.33, 0.45, su) * (1.0 - bk * 0.5); }   // (fine creases along the body behind the head)
      // the stars inside: a slow-drifting field, brighter where the body is in shade; nebulae of violet light round them
      vec2 g = id == 495 ? vec2(su * 15.0 + uTime * 0.035, sv * 11.0) : vec2(su * 6.0 + uTime * 0.03, sv * 4.0 + 7.0);
      vec3 S3 = mdStars(g, uTime); float inner = 0.55 + 0.65 * (1.0 - lit), neb = vn(g * 0.32 + vec2(uTime * 0.02, 0.0)) * vn(g * 0.71 - 3.0);
      vec3 sc = mix(vec3(0.75, 0.9, 1.25), vec3(1.15, 0.98, 0.7), step(0.82, S3.z));
      c += vec3(0.05, -0.012, 0.06) * sin(ndv * 9.0 + su * 5.0 + sv * 3.0) * (1.0 - bk) * smoothstep(0.5, 0.9, lit);   // (mother-of-pearl: a faint shift of hue across the lit skin)
      c = mix(c, vec3(0.6, 0.66, 0.9), neb * 0.3 * smoothstep(0.5, 1.0, lit));   // (the slow star patterns show through the pearl as lilac clouds)
      c = mix(c, vec3(0.42, 0.62, 1.0), clamp((S3.x * 0.95 + S3.y * 0.5) * smoothstep(0.45, 1.0, lit), 0.0, 0.85));   // (v455 MD2: the constellations a little clearer on the lit pearl)   // (and its stars as blue points and lines where it is lit: light on white would not show)
      c += sc * S3.x * inner * 1.2 + vec3(0.55, 0.75, 1.2) * S3.y * 0.32 * inner + vec3(0.16, 0.1, 0.38) * neb * inner * (0.6 + 0.4 * bk);
      // the luminous contour lines: the flanks' lateral lines, the head's case, the dorsal ridge, a curve over the brow; a fin's glowing free edge
      float mk = 0.0;
      if (id == 495) { float sd = abs(sv - 0.5); mk = mdG((sd - 0.235 + 0.012 * sin(su * 26.0)) / 0.0075) * smoothstep(0.3, 0.36, su) * (1.0 - smoothstep(0.86, 0.95, su));
        mk += mdG((su - 0.3 + 0.06 * (sd * 2.0) * (sd * 2.0)) / 0.0045) * smoothstep(0.12, 0.3, sd) * 0.6 + mdG(min(sv, 1.0 - sv) / 0.009) * smoothstep(0.56, 0.62, su) * 0.75;   // (the head's case: a curve low on each side, swept back at the top)
        mk += mdG((su - 0.07 - 0.11 * (sd * 2.0) * (sd * 2.0)) / 0.005) * (1.0 - smoothstep(0.32, 0.46, sd)) * 0.55; }
      else mk = smoothstep(0.78, 0.98, sv) * 0.9 + mdG((fract(su * 5.0) - 0.5) / 0.05) * (1.0 - sv) * 0.12;
      c += vec3(0.45, 0.85, 1.3) * mk * (0.55 + 0.6 * uGlow);
      if (id == 496) c = mix(c, vec3(0.62, 0.86, 1.2), smoothstep(0.7, 1.0, sv) * 0.45);   // (translucent toward the edge)
    }
    if (id == 495 || id == 496) { float wl = uClip.x > 0.5 ? exp(-max(vW.z - uClip.y, 0.0) / 0.16) : 0.0, dn = clamp(0.45 - 0.75 * dot(n, uUP), 0.0, 1.0);
      c += vec3(0.16, 0.5, 0.62) * dn * (1.0 - lit) * 0.55 + vec3(0.3, 0.85, 1.0) * wl * (0.3 + 0.3 * fres); }   // (v455 MD2: the aqua water's light thrown up on its shaded underside, and its reflection glowing on the skin just above the waterline)
    c = mix(c, vec3(0.78, 0.92, 1.25), fres * fres * 0.6) + celRim(n) * 1.4;   // (the spectral edge)
    c += vec3(0.6, 0.85, 1.25) * uGlow2 * (0.3 + 0.7 * fres);
    c = mix(c, vec3(1.0, 1.02, 1.05), dz * 0.9) + vec3(0.4, 0.7, 1.0) * dz * 0.3;   // (the dissolve's foaming edge)
    gl_FragColor = vec4(min(c, vec3(1.0)) * uAlpha, uAlpha); return; }
  /*</MD-MAT>*/
  /*<GE-MAT ids 500..504, 510 (v451 GE, v455 GE2: 20k5yd-wind-goldeneagle-model.js, the Golden Eagle)>*/
  else if ((id >= 500 && id <= 504) || id == 510) {   // ---- (v451 GE; v455 GE2: 510 a feather's underside, as 500's variants: duller, barred; the occluders' shaped shadows; the face kept readable) the Golden Eagle (20k5yd): 500 a feather card (vA.x's tenth: 0 a primary, 1 a secondary, 2 a tertial, 3 a rectrix, 4 a covert; vA.y along it, 0 the quill .. 1 the tip; vA.z the card's index + its place across, 0 the leading edge .. 1 the trailing), 501 plumage (0 the body: vA.y 0 the tail .. 1 the neck, vA.z round, 0 the back .. 0.5 the belly; 1 the head; 2 a hackle; 3 the trousers; 4 a brow ridge), 502 horn (0 the ivory beak, vA.y 0 its root .. 1 the hook; 1 the cere and the scaled toes; 2 a talon; 3 the gape), 503 an eye (its local +x the gaze), 504 an air current between the layers (see-through, emissive: vA.y downstream, vA.z across). uGlow the air currents, uGlow2 a pulse of light (a beat, the inhale), uSpill the dissolve into golden feathers, uWear a seed. Colours in display space
    float gv = floor((vA.x - float(id)) * 10.0 + 0.5), gu = clamp(edge, 0.0, 1.0), gci = floor(ao + 0.0001), ga = ao - gci, ndv = max(0.0, dot(n, uV)), fres = pow(1.0 - ndv, 2.4), lit = 0.5, gz = 0.0, tt = uTime, gG = clamp(uGlow, 0.0, 2.0);
    vec3 c = vec3(0.0), em = vec3(0.0), JADE = vec3(0.14, 0.86, 0.6), MINT = vec3(0.62, 1.0, 0.86), CHAMP = vec3(1.0, 0.93, 0.74);
    if (uSpill > 0.0) { float nz = vn(L.xy * 7.0 + L.z * 4.0 + uWear * 23.0) * 0.55 + vn(L.yz * 19.0 + uWear * 5.0) * 0.3 + gu * 0.15, th = uSpill * 1.25 - 0.12; if (nz < th) discard; gz = 1.0 - smoothstep(th, th + 0.1, nz); }   // (the dissolve: noise fronts eat it away, each edge burning champagne gold)
    if (id == 504) { // the air current: streaks of jade and mint running downstream between the layers, feathered at every edge
      float fl = vn(vec2(gu * 4.5 - tt * 2.6 + uWear * 9.0, ga * 7.0)), f2 = vn(vec2(gu * 9.0 - tt * 4.1, ga * 15.0 + 3.0)), lq = (fract(ga * 5.0 + 0.15 * sin(gu * 6.0 - tt * 3.0)) - 0.5) / 0.07, ln = exp(-lq * lq);
      float a = (smoothstep(0.45, 0.85, fl) * 0.55 + ln * smoothstep(0.35, 0.8, f2) * 0.6) * smoothstep(0.0, 0.2, gu) * (1.0 - smoothstep(0.65, 1.0, gu)) * smoothstep(0.0, 0.15, ga) * (1.0 - smoothstep(0.85, 1.0, ga)) * gG * 1.05 * (1.0 - gz);
      if (a < 0.008) discard; vec3 ac = mix(JADE, MINT, smoothstep(0.5, 1.0, f2 + ln * 0.4)); a *= uAlpha; gl_FragColor = vec4(min(ac * a * 1.35, vec3(1.0)), a * 0.55); return; }
    if (id == 500 || id == 510) {
      float und = id == 510 ? 1.0 : 0.0;   // (v455 GE2: the underside of a feather)
      float sd = hs(vec2(gci + uWear * 31.0, gv * 3.1)), rp = gv < 0.5 ? 0.3 : gv > 3.5 ? 0.46 : 0.4, wl = ga < rp ? (ga - rp) / rp : (ga - rp) / (1.0 - rp), ed = 1.0 - abs(wl);
      vec3 B1 = vec3(0.44, 0.25, 0.075), G0 = vec3(0.8, 0.55, 0.2), md;   // (deep bronze at the roots, warm gold along the vanes; the coverts bronze with a golden fringe, deepest on the humerus and the back: the wing's roots, uWear < 0.72)
      if (gv > 3.5) { float rk = uWear < 0.705 ? 1.0 : clamp((0.75 - uWear) / 0.04, 0.0, 1.0); md = mix(vec3(0.6, 0.37, 0.12), vec3(0.24, 0.12, 0.035), rk * 0.85); md = mix(md * mix(0.75, 1.0, smoothstep(0.0, 0.5, gu)), mix(G0, vec3(0.62, 0.4, 0.14), rk * 0.6), smoothstep(0.66, 0.95, gu) * 0.8); }
      else { md = mix(B1, G0, smoothstep(0.08, 0.45, gu)); md = mix(md, vec3(0.4, 0.23, 0.07), smoothstep(0.6, 1.0, gu) * (gv < 0.5 ? 0.85 : gv < 1.5 ? 0.6 : 0.45)); }   // (the long feathers deep bronze-gold toward the tip: the champagne edge glows against it)
      md *= 0.9 + 0.2 * sd;
      if (und > 0.5) { md = mix(md, vec3(0.5, 0.38, 0.22), 0.4); if (gv < 3.5) md *= 1.0 - 0.24 * smoothstep(0.35, 0.7, abs(fract(gu * 6.0 + sd) - 0.5) * 2.0) * smoothstep(0.15, 0.3, gu); }   // (v455 GE2: the underside duller and cooler, dark bars across the flight feathers)
      if (uLow < 0.5) { float bb = fract(gu * (gv > 3.5 ? 14.0 : 34.0) - abs(wl) * 2.2 + sd * 3.0); md *= 0.93 + 0.07 * smoothstep(0.15, 0.5, bb) * smoothstep(0.95, 0.6, bb); }   // (the barbs: fine oblique lines down each vane)
      c = cel3(md * vec3(0.42, 0.36, 0.38) + vec3(0.02, 0.025, 0.05), md, md * 1.13 + vec3(0.05, 0.04, 0.015), n, lit);
      if (und > 0.5) c = max(c, md * vec3(0.66, 0.58, 0.5)) + vec3(0.06, 0.045, 0.02) + JADE * 0.06 * gG;   // (v455 GE2: the underside lifted by the light bounced off the floor and the jade air beneath)
      float rs = (ga - rp) / 0.018; c = mix(c, vec3(0.93, 0.86, 0.7) * (0.6 + 0.5 * lit), exp(-rs * rs) * (1.0 - smoothstep(0.75, 1.0, gu)) * (gv > 3.5 ? 0.35 : 0.8));   // (the ivory rachis)
      c *= 1.0 - 0.45 * (1.0 - smoothstep(0.0, 0.08, ed)) * (1.0 - 0.6 * smoothstep(0.0, 0.08, gu));   // (a dark seam at the vane's edge: each feather reads against the next)
      if (und < 0.5) c *= 1.0 - (gv < 3.5 ? 0.42 : 0.3) * (gv < 3.5 ? 1.0 - smoothstep(0.14, 0.3 + 0.05 * sin(ga * 20.0 + gci * 1.7), gu) : 1.0 - smoothstep(0.0, 0.34, gu));   // (v455 GE2: contact shade where the row above lies over a feather's root, its edge scalloped by the coverts' tips)
      c += vec3(1.0, 0.9, 0.62) * celSpec(n, 0.94) * 0.22 * (0.5 + 0.5 * sd) * (1.0 - 0.7 * und);
      float ck = gv < 0.5 ? 1.0 : gv < 1.5 ? 0.55 : gv < 2.5 ? 0.3 : gv < 3.5 ? 0.6 : 0.0;   // (the luminous champagne edges: the primaries' brightest)
      em += CHAMP * ck * ((1.0 - smoothstep(0.0, 0.2, ed)) * 0.9 + (1.0 - smoothstep(0.0, 0.45, ed)) * 0.25) * smoothstep(0.3, 0.85, gu) * (wl > 0.0 ? 1.0 : 0.6) * (0.7 + 0.35 * uGlow2 + 0.15 * step(1.5, uKind)) * (1.0 - 0.55 * und);
      float fw = smoothstep(0.6, 0.92, vn(vec2(gu * 2.4 - tt * 1.8 + sd * 5.0, ga * 13.0 + gci * 3.1))) * (0.6 + 0.4 * sin(ga * 40.0 + gu * 3.0)), fe = smoothstep(0.5, 0.95, vn(vec2(gu * 8.0 - tt * 3.4, gci * 2.3 + sd * 7.0)));
      em += (JADE * fw * (1.0 - smoothstep(0.18, 0.55, gu)) * 0.9 + MINT * fe * (1.0 - smoothstep(0.0, 0.14, ed)) * smoothstep(0.2, 0.6, gu) * 0.45) * gG * (gv > 3.5 ? 0.6 : 1.0); }   // (the air between the layers: jade streaks out along the quills under the coverts, mint along the edges)
    else if (id == 501) {
      vec3 md; float sd = hs(vec2(floor(gu * 24.0), floor(ga * 28.0)) + uWear * 7.0);
      if (gv < 0.5) { float bel = 1.0 - abs(ga * 2.0 - 1.0), ch = smoothstep(0.42, 0.85, bel) * smoothstep(0.25, 0.8, gu), nape = smoothstep(0.82, 1.0, gu) * (1.0 - bel);   // (the body: the chest pale gold, the flanks gold, the back deep bronze; small round feathers in shingled rows)
        md = mix(vec3(0.33, 0.18, 0.06), vec3(0.72, 0.48, 0.18), smoothstep(0.15, 0.6, bel)); md = mix(md, vec3(0.98, 0.86, 0.55), ch); md = mix(md, vec3(0.92, 0.72, 0.32), nape * 0.8);
        vec2 f = fract(vec2(gu * 30.0, ga * 34.0 + floor(gu * 30.0) * 0.5)) - 0.5; float s2 = length(vec2(f.x * 1.2, f.y));
        md *= (0.9 + 0.14 * sd) * (1.0 - 0.14 * smoothstep(0.3, 0.5, s2) * (1.0 - uLow)); }
      else if (gv < 1.5) { float top = smoothstep(0.0, 0.25, L.z - 0.05), face = smoothstep(0.12, 0.3, L.x);   // (the head: golden cream, the crown and nape a richer gold with fine streaks, darker round the eye)
        md = mix(vec3(0.95, 0.83, 0.55), vec3(0.93, 0.7, 0.3), top * (1.0 - face * 0.6)); md = mix(md, vec3(0.62, 0.42, 0.18), face * (1.0 - top) * 0.45); md *= 0.92 + 0.12 * vn(vec2(L.x * 40.0, L.y * 12.0 + L.z * 30.0));
        vec3 eq = vec3(L.x - 0.23, abs(L.y) - 0.13, L.z - 0.075); md *= 1.0 - 0.42 * (1.0 - smoothstep(0.05, 0.13, length(eq * vec3(0.8, 1.6, 1.3)))); }   // (v455 GE2: a dark ring of feathers round each eye, under the brow: the face reads through the glow)
      else if (gv < 2.5) md = mix(vec3(0.85, 0.6, 0.22), vec3(1.0, 0.88, 0.55), gu) * (0.9 + 0.2 * hs(vec2(gci, 3.0)));   // (a hackle: golden, paling to its point)
      else if (gv < 3.5) md = mix(vec3(0.9, 0.74, 0.42), vec3(0.99, 0.9, 0.66), 0.5 + 0.5 * vn(L.xy * 30.0 + L.z * 18.0)) * 0.95;   // (the trousers: soft pale gold)
      else md = vec3(0.66, 0.45, 0.17);   // (the brow: a bronze-gold shelf)
      float pale = gv < 0.5 ? smoothstep(0.5, 0.9, 1.0 - abs(ga * 2.0 - 1.0)) * smoothstep(0.3, 0.8, gu) : 0.0;   // (the chest keeps its pale gold even turned from the light: a lighter shade band there)
      c = cel3(md * mix(vec3(0.42, 0.36, 0.4), vec3(0.7, 0.62, 0.58), pale) + vec3(0.02, 0.02, 0.045), md, md * 1.12 + vec3(0.05, 0.04, 0.02), n, lit);
      if (gv > 3.5) c += vec3(1.0, 0.85, 0.5) * celSpec(n, 0.95) * 0.25;
      em += MINT * fres * 0.06 * gG * (gv > 0.5 && gv < 1.5 ? 0.0 : 1.0); }
    else if (id == 502) {
      if (gv < 0.5) { vec3 md = mix(vec3(0.96, 0.91, 0.78), vec3(0.62, 0.56, 0.48), smoothstep(0.55, 1.0, gu)); c = cel3(md * vec3(0.55, 0.5, 0.55), md, min(md * 1.12 + 0.05, vec3(1.0)), n, lit) + vec3(1.0) * celSpec(n, 0.965) * 0.55; }   // (the ivory beak, a faint slate-honey at the hook, glossy)
      else if (gv < 1.5) { vec3 md = vec3(0.98, 0.76, 0.22) * (0.9 + 0.1 * smoothstep(0.1, 0.5, abs(fract(L.x * 26.0 + L.y * 9.0) - 0.5) * 2.0)); c = cel3(md * vec3(0.5, 0.36, 0.3), md, min(md * 1.15, vec3(1.0)), n, lit) + vec3(1.0, 0.95, 0.8) * celSpec(n, 0.96) * 0.3; }   // (the cere and the toes: gold-yellow scutes)
      else if (gv < 2.5) c = cel3(vec3(0.03, 0.025, 0.025), vec3(0.11, 0.09, 0.08), vec3(0.24, 0.21, 0.19), n, lit) + vec3(0.9, 0.85, 0.8) * celSpec(n, 0.95) * 0.6;   // (a talon: dark horn, a glossy edge)
      else c = vec3(0.16, 0.05, 0.04) * (0.6 + 0.4 * lit); }
    else { vec3 q = normalize(L); float rr = q.x > 0.0 ? length(q.yz) : 2.0, an = atan(q.z, q.y);   // (an eye: a bright emerald iris with fine rays round a black pupil, a dark rim, a wet highlight, its own glow)
      float pu = 1.0 - smoothstep(0.3, 0.36, rr), ir = 1.0 - smoothstep(0.82, 0.9, rr), ray = 0.75 + 0.25 * vn(vec2(an * 6.0, rr * 9.0));
      vec3 iris = mix(vec3(0.02, 0.4, 0.16), vec3(0.22, 0.95, 0.45), smoothstep(0.3, 0.85, rr)) * ray;
      c = mix(vec3(0.03, 0.06, 0.04), iris, ir); c = mix(c, vec3(0.01), pu); c *= 0.75 + 0.35 * max(0.0, dot(n, uLK));
      em += vec3(0.15, 0.9, 0.55) * ir * (1.0 - pu) * (0.35 + 0.3 * gG + 0.4 * uGlow2); c += vec3(1.0) * celSpec(n, 0.97) * 0.9; }
    float fce = id == 502 || (id == 501 && (abs(gv - 1.0) < 0.5 || gv > 3.5)) ? 1.0 : 0.0;   // (v455 GE2: the face: its rim and the pulse's sheen held down)
    if (uNOcc > 0.5 && uLow < 0.5 && id != 503) { float oS = occSH(vW, uLK), oA = occAO(vW, n); c *= mix(vec3(0.5, 0.4, 0.37), vec3(1.0), oS) * (0.62 + 0.38 * oA); }   // (v455 GE2: shaped shadows from the body's, the head's and the wing roots' occluders)
    c += celRim(n) * (1.3 - 0.6 * fce) + em + MINT * uGlow2 * fres * 0.35 * (1.0 - 0.75 * fce);
    c = mix(c, mix(CHAMP * 1.15, MINT, 0.4), gz * 0.9) + vec3(1.0, 0.8, 0.35) * gz * 0.25;   // (v455 GE2: the dissolve's edge burning champagne into mint wind)
    gl_FragColor = vec4(min(c, vec3(1.0)) * uAlpha, uAlpha); return; }
  /*</GE-MAT>*/
  /*<SM-MAT ids 400..429 (v435 SM: 02f5-samael-model.js, Samael the First Cataclysm)>*/
  else if (id >= 400 && id <= 429) {   // ---- (v435 SM) Samael (02f5): 400 obsidian black lacquer (400.2 a recess; 400.3 a plate: molten cracks glowing through it; vA.y 1 a rim: burnished gold trim), 401 dark titanium (brushed; 401.3 ribbed), 402 burnished gold (402.2 engraved), 403 a molten crimson channel (vA.z along it: pulses; 403.3 a lit slot), 404 living plasma (404.3 the horns' core: pulses flowing to the tips, uGlow2 white heat), 405 an eye, 406 the Heart of Ruin's star (uGlow2 0..1 crimson to white-hot), 407 its corona (see-through), 408 a containment ring (runes lit in a pulse; uKind its phase; 408.3 a band), 409 a ring of light, 410 the lattice cage (open cells), 411 a black glass blade (411.3 its molten cutting edge), 412 molten rock (412.3 hotter), 413 horn armour (ridged lacquer, engraved gold; 413.3 the molten crimson underside), 414 the meteor's plasma shell, 415 an incandescent mote, 416 a crescent blade of plasma (vA.y 1 its cutting edge; vA.z along it). uSpill: the dissolve into crimson embers. Approximates PBR (a lacquer's fresnel and sharp reflections, brushed metal, gold's tinted reflection) with the scene's analytic environment: a violet-crimson sky, a burning horizon, a glowing ground
    float sF = vA.x - float(id), sG = clamp(uGlow, 0.0, 4.0), sG2 = clamp(uGlow2, 0.0, 3.0), sT = uTime, sDE = 0.0;
    if (uSpill > 0.0) { float sDn = vn(L.xy * 4.7 + L.z * 2.9) * 0.55 + vn(L.yz * 12.0 + L.x * 6.0) * 0.3 + vn(L.xz * 25.0 + 3.0) * 0.15, sTh = uSpill * 1.15 - 0.08; if (sDn < sTh) discard; sDE = smoothstep(sTh + 0.1, sTh, sDn); }
    float sNV = max(0.001, dot(n, uV)), sNL = dot(n, uLK), sDif = max(sNL, 0.0), sWr = clamp(sNL * 0.5 + 0.5, 0.0, 1.0);
    vec3 sR = 2.0 * sNV * n - uV; float sUp = dot(sR, uUP), sSb = max(dot(sR, uLK), 0.0), sHz = sUp - 0.05;
    vec3 sEv = sUp > 0.0 ? mix(vec3(0.12, 0.07, 0.11), vec3(0.46, 0.34, 0.46), pow(clamp(sUp, 0.0, 1.0), 1.3)) : mix(vec3(0.32, 0.09, 0.03), vec3(0.04, 0.02, 0.02), clamp(-sUp * 2.5, 0.0, 1.0));
    sEv += vec3(1.0, 0.45, 0.18) * exp(-sHz * sHz / 0.004) * 0.7;   // (a burning horizon in its reflections)
    float sOcc = mix(0.42, 1.0, clamp(ao, 0.0, 1.0)), sFr = pow(1.0 - sNV, 5.0), sHm = 0.5 + 0.5 * dot(n, uUP);
    vec3 sKEY = vec3(1.55, 1.4, 1.26), sAmb = mix(vec3(0.1, 0.05, 0.06), vec3(0.36, 0.3, 0.34), sHm) * uAmb, sRim = pow(1.0 - sNV, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim;
    vec3 sCR = vec3(0.75, 0.05, 0.02), sOR = vec3(1.45, 0.5, 0.08), sWH = vec3(1.7, 1.45, 1.05), sG0 = vec3(1.0, 0.64, 0.28), sGF = sG0 + (1.0 - sG0) * sFr;
    float sEng = 0.0; vec3 sGold = vec3(0.0);   // (v444 SL: the gold and its engraving worked out only for the materials that show them: 400, 402, 410, 413; the same values)
    if (id == 400 || id == 402 || id == 410 || id == 413) { sEng = (1.0 - uLow) * smoothstep(0.07, 0.025, abs(fract(L.x * 5.5 + L.z * 3.0 + 0.6 * sin(L.y * 7.0 + L.x * 3.0)) - 0.5)) * step(0.45, vn(L.xz * 1.9 + L.y));
      sGold = (sG0 * (0.1 + 0.62 * sDif) * sKEY * 0.55 + sGF * mix(sEv, vec3(dot(sEv, vec3(0.33))) * vec3(1.0, 0.75, 0.45), 0.4) * 1.35 + vec3(1.0, 0.88, 0.7) * (pow(sSb, 60.0) * 2.4 + pow(sSb, 10.0) * 0.3) + sRim * 0.4) * sOcc * (1.0 - sEng * 0.4) * 1.25; }
    vec3 sC = vec3(0.0); float sA = 1.0;
    if (id == 400 || id == 413) {   // black lacquer (the armour, the horns): near-black, a deep clear coat with sharp reflections, panel seams, cracks glowing molten
      float rec = step(0.15, sF) * step(sF, 0.25), crk = step(0.25, sF), hornIn = id == 413 ? step(0.25, sF) : 0.0;
      if (hornIn > 0.5) {   // the horn's underside: crimson lacquer lit from within, darker ridges across it, flowing heat
        float rid = 0.5 + 0.5 * sin(ao * 120.0), fl = pow(0.5 + 0.5 * sin(ao * 22.0 - sT * 3.0), 3.0);
        float cel = abs(vn(L.xy * 15.0 + L.z * 9.0 + 3.0) - 0.5) + abs(vn(L.yz * 19.0 + L.x * 7.0 + 9.0) - 0.5) * 0.5, lines = smoothstep(0.06, 0.015, cel) * (1.0 - uLow * 0.5);   // (v435 SM concept2: lava seen through a net of dark scale-seams)
        vec3 hc = mix(vec3(0.62, 0.05, 0.02), vec3(1.45, 0.5, 0.08), clamp(0.15 + 0.25 * sG + 0.25 * fl + 0.35 * smoothstep(0.25, 0.0, cel), 0.0, 1.0)) * (0.8 + 0.2 * rid) * 1.35;
        sC = hc * (1.0 - lines * 0.45) + vec3(1.0, 0.75, 0.6) * pow(sSb, 40.0) * 0.8 + sEv * sFr * 0.5 + vec3(1.0, 0.6, 0.3) * sRim * 0.4;
        sC = mix(sC, sGold, smoothstep(0.82, 0.96, edge)); }
      else {
        vec3 T0 = vec3(0.022, 0.016, 0.02) * (rec > 0.5 ? 0.5 : 1.0), TF = T0 + (vec3(0.55, 0.48, 0.5) - T0) * sFr;
        float rg = id == 413 ? 0.12 + 0.05 * sin(ao * 120.0) : 0.1 + 0.08 * vn(L.xy * 7.0 + L.z * 4.0), pn = fract(L.z * 2.3 + 0.35 * floor(L.x * 1.6 + L.y * 1.6)), seam = smoothstep(0.045, 0.0, min(pn, 1.0 - pn)) * (1.0 - uLow * 0.5) * (id == 413 ? 0.0 : 1.0);
        float ann = 0.0;   // (v435 SM concept2: no annulation ridges: the horn is scaled)   // (the horn's annulation ridges)
        sC = (T0 * (0.2 + 0.8 * sDif) * sKEY + TF * sEv * 1.15 + vec3(1.0, 0.9, 0.85) * pow(sSb, 2.0 / (rg * rg)) * 1.25 + sRim * 0.55) * sOcc * (1.0 - seam * 0.5) * (1.0 - ann * 0.25);
        bool sCk = crk > 0.5 || id == 400 && rec < 0.5; float ck = 0.0, sCz = 0.0;   // (v444 SL: the crack noise only where cracks can show (not the horns' scaled outer half), its mask's noise once for the crack and its halo; the same values)
        if (sCk) { ck = abs(vn(L.xy * 2.6 + L.z * 1.7 + 11.0) - 0.5) + abs(vn(L.yz * 4.1 + 2.0) - 0.5) * 0.45; sCz = smoothstep(0.3, 0.5, vn(L.zx * 1.1 + 7.0)); }
        float crack = sCk ? smoothstep(0.085, 0.02, ck) * sCz * (crk > 0.5 ? 1.0 : 0.8) : 0.0;
        float halo = sCk ? smoothstep(0.22, 0.03, ck) * sCz * 0.4 : 0.0;   // (the molten light bleeding round each crack, as the concept: the body glowing red through its armour)
        sC = sC * (1.0 - crack * 0.7) + mix(sCR, sOR, clamp(0.08 + sG * 0.3, 0.0, 1.0)) * 1.9 * (crack * (0.95 + 0.9 * sG) + halo * (0.6 + 0.5 * sG)) + sWH * crack * sG * sG * 0.08 + sCR * seam * (0.18 + 0.35 * sG) + vec3(1.0, 0.12, 0.05) * pow(1.0 - sNV, 2.5) * 0.32 * (1.0 - rec);   // (a crimson fresnel: the furnace's light caught along the lacquer's rims)
        if (id == 413) {   // (v435 SM concept2) the horn's outer half: tight, flush, overlapping dragon scales drawn by u (ao, along the horn) and v (edge, round the tube): gold-rimmed, molten in their seams
          float ru = ao * 18.0, row = floor(ru), fu = fract(ru), fv = fract(edge * 3.0 + 0.5 * mod(row, 2.0)) - 0.5, ev = 0.62 + 0.36 * (1.0 - pow(abs(2.0 * fv), 1.3));   // (larger, fewer scales: rounded, ending in a point toward the tip)
          float on = step(fu, ev), up = clamp(fu / ev, 0.0, 1.0), hi = smoothstep(ev - 0.16, ev - 0.03, fu) * on, sm2 = abs(fu - ev), mol = smoothstep(0.03, 0.0, sm2) * (1.0 - uLow * 0.3), sh = (1.0 - on) * (1.0 - 0.6 * smoothstep(ev, 1.0, fu)), side = smoothstep(0.05, 0.0, 0.5 - abs(fv)) * on;
          sC = sC * (0.5 + 0.7 * pow(up, 1.5)) * (1.0 - 0.7 * sh) * (1.0 - 0.5 * side) + vec3(1.0, 0.85, 0.75) * pow(sSb, 14.0) * 0.4 * up * on;   // (each scale lifting toward its free edge, a shadow under it)
          sC = mix(sC, sGold * 0.85, hi * 0.6); sC = mix(sC, mix(sCR, sOR, 0.3 + 0.3 * sG) * 1.8, mol); }   // (a bronze-gold highlight on its edge, the molten seam only in the thin gap)
        else sC = mix(sC, sGold, smoothstep(0.8, 0.95, edge) * (1.0 - rec)); } }
    else if (id == 401) { float rib = step(0.25, sF), br = vn(vec2(L.x * 40.0 + L.y * 40.0, L.z * 2.0)), rg = 0.28 + 0.1 * br;   // dark titanium: brushed gunmetal, a cool sheen, worn bevels
      vec3 T0 = vec3(0.16, 0.16, 0.18) * (0.85 + 0.25 * br) * (rib > 0.5 ? 0.7 + 0.3 * smoothstep(0.2, 0.0, abs(fract(L.z * 9.0) - 0.5)) : 1.0), TF = T0 + (1.0 - T0) * sFr * 0.5;
      sC = (T0 * (0.15 + 0.75 * sDif) * sKEY * 0.6 + TF * sEv * 0.9 + vec3(0.9, 0.9, 1.0) * pow(sSb, 2.0 / (rg * rg)) * 0.8 + sRim * 0.4) * sOcc + vec3(0.5, 0.48, 0.5) * smoothstep(0.7, 1.0, edge) * 0.25 + sCR * smoothstep(0.85, 1.0, edge) * sG * 0.15; }
    else if (id == 402) sC = sGold + sOR * sEng * sG * 0.35 + sOR * smoothstep(0.85, 1.0, edge) * sG * 0.2;
    else if (id == 403) { float fl = pow(0.5 + 0.5 * sin(ao * 18.0 - sT * 5.0), 5.0), fl2 = pow(0.5 + 0.5 * sin(ao * 7.0 - sT * 2.1 + 1.0), 3.0), k = 0.55 + 0.6 * sG, slot = step(0.25, sF);   // molten crimson, pulses running along it
      float hk = clamp(0.25 + 0.3 * sG + 0.5 * fl * (1.0 - slot) + 0.2 * fl2, 0.0, 2.0); sC = (hk < 1.0 ? mix(sCR, sOR, hk) : mix(sOR, sWH, hk - 1.0)) * k * (slot > 0.5 ? 0.85 + 0.15 * sin(sT * 7.0 + L.x * 9.0) : 1.0) + vec3(0.3, 0.05, 0.02) * sNV; }
    else if (id == 404) { float core = step(0.25, sF);   // living plasma: dark crust cells over a turbulent molten glow (the horns' core: heat flowing to the tips)
      vec2 pq = core > 0.5 ? vec2(ao * 26.0 - sT * 1.8, (L.z + L.y) * 3.0) : L.xy * 2.6 + L.z * 1.3 + vec2(sT * 0.25, -sT * 0.18);
      float w1 = vn(pq), w2 = vn(pq * 2.7 + 5.0 + sT * 0.4), crust = smoothstep(0.42, 0.62, w1 * 0.65 + w2 * 0.35), pul = core > 0.5 ? pow(0.5 + 0.5 * sin(ao * 30.0 - sT * 6.0), 4.0) : 0.5 + 0.5 * sin(sT * 2.3 + w1 * 6.0);
      float hk = clamp(0.18 + 0.3 * sG + 0.3 * pul * w2 + (core > 0.5 ? 0.15 + sG2 * ao * 1.2 : 0.0), 0.0, 2.2);   // (crimson first, orange in its hottest veins, as the concept)
      vec3 hot = (hk < 1.0 ? mix(sCR, sOR, hk * 0.45) : mix(sOR, sWH, min(1.0, hk - 1.0))) * 2.1;
      float vein = smoothstep(0.66, 0.82, w2);
      sC = mix(hot * (0.7 + 0.6 * w2) + sOR * vein * 0.45, vec3(0.05, 0.008, 0.008) + hot * 0.18, crust * (0.55 - 0.2 * min(1.0, sG * 0.5))) + vec3(1.0, 0.2, 0.1) * pow(1.0 - sNV, 2.0) * 0.3 * (0.5 + sG); }
    else if (id == 405) sC = mix(vec3(1.4, 0.12, 0.05), vec3(1.7, 1.2, 0.8), clamp(0.15 + 0.3 * sG2, 0.0, 1.0)) * (0.8 + 0.7 * sG2) * (0.92 + 0.08 * sin(sT * 11.0));
    else if (id == 406) { vec3 lp = normalize(L); float lat = asin(clamp(lp.z, -1.0, 1.0)), lon = atan(lp.y, lp.x);   // the dying star: convection cells, sunspots, a bright limb; white-hot with uGlow2
      vec2 g1 = vec2(lon * 4.0 + sT * 0.35, lat * 5.0 - sT * 0.2), g2 = vec2(lon * 9.0 - sT * 0.6, lat * 11.0 + sT * 0.3);
      float cells = vn(g1) * 0.6 + vn(g2) * 0.4, gran = smoothstep(0.35, 0.75, cells), spot = smoothstep(0.78, 0.86, vn(vec2(lon * 1.7 + sT * 0.08, lat * 2.2) + 7.0)), turb = vn(vec2(lon * 3.0 + sin(lat * 6.0 + sT), lat * 4.0 - sT * 0.5) + 3.0);
      float hk = clamp(0.55 + 0.25 * gran + 0.2 * turb + 0.25 * sG + 0.9 * sG2 - 0.6 * spot * (1.0 - sG2 * 0.6), 0.0, 2.4), limb = pow(1.0 - sNV, 1.6);
      vec3 hot = hk < 1.0 ? mix(sCR, sOR, hk) : mix(sOR, sWH, min(1.0, hk - 1.0));
      sC = hot * (0.75 + 0.6 * gran) * (1.0 - 0.35 * limb * (1.0 - sG2)) + sOR * limb * 0.5 + sWH * max(0.0, sG2 - 0.6) * 0.6; }
    else if (id == 407) { vec3 lp = normalize(L); float an = atan(lp.y, lp.x), sw = vn(vec2(an * 3.0 + lp.z * 3.0 - sT * 1.2, lp.z * 5.0 + sT * 0.5)), fil = smoothstep(0.06, 0.0, abs(sw - 0.5)), fr = pow(1.0 - sNV, 1.8);   // the corona: turbulent plasma, see-through
      vec3 cs = mix(sCR, sOR, 0.4 + 0.3 * sG2) * (0.25 + 0.9 * fr) * (0.6 + 0.6 * sG) + mix(sOR, sWH, sG2 * 0.6) * fil * (0.6 + 0.6 * sG);
      cs = vec3(tone(cs.r), tone(cs.g), tone(cs.b)); sA = clamp(0.05 + 0.6 * fr + fil * 0.35, 0.0, 0.9);
      gl_FragColor = vec4(min(cs, vec3(sA)) * uAlpha, sA * uAlpha); return; }
    else if (id == 408) { float band = step(0.25, sF), an = atan(L.y, L.x), crd = band > 0.5 ? ao * 14.0 : an * 7.6394 + 24.0, cell = floor(crd), dd = fract(crd) - 0.5, ac = band > 0.5 ? (edge - 0.5) * 2.0 : NL.z;   // titanium with crimson runes, a pulse running round
      float h = hs(vec2(cell, 5.0 + uKind)), stem = smoothstep(0.1, 0.05, abs(dd - (h - 0.5) * 0.2)) * step(abs(ac), 0.72), brn = smoothstep(0.09, 0.035, abs(ac - dd * 1.4 * (h > 0.6 ? 1.0 : -1.0))) * step(abs(dd), 0.35), rune = max(stem, brn) * step(0.25, h);
      float pl = pow(0.5 + 0.5 * sin(crd * 0.45 - sT * 3.6 + uKind * 1.7), 6.0); vec3 T0 = vec3(0.15, 0.15, 0.17);
      vec3 base = (T0 * (0.2 + 0.7 * sDif) * sKEY * 0.6 + (T0 + (1.0 - T0) * sFr * 0.5) * sEv + vec3(0.9) * pow(sSb, 30.0) * 0.6) * sOcc;
      sC = base * (1.0 - rune * 0.6) + mix(sCR, sOR, pl) * rune * (0.35 + 0.6 * sG + 1.1 * pl * (0.4 + sG2)); }
    else if (id == 409) { float an = atan(L.y, L.x), pl = pow(0.5 + 0.5 * sin(an * 5.0 - sT * 3.0 + uKind * 1.7), 6.0);   // a ring of crimson-gold light
      vec3 cl2 = mix(vec3(1.0, 0.18, 0.05), vec3(1.3, 0.7, 0.25), 0.4 + 0.3 * pl) * (0.55 + 0.5 * sG) + vec3(1.5, 1.1, 0.7) * pl * 0.6; cl2 = vec3(tone(cl2.r), tone(cl2.g), tone(cl2.b));
      sA = clamp(max(cl2.r, max(cl2.g, cl2.b)) * (0.45 + 0.55 * sNV), 0.0, 1.0); gl_FragColor = vec4(cl2 * sA * uAlpha, sA * uAlpha); return; }
    else if (id == 410) { vec3 lp = normalize(L); vec2 q = vec2(atan(lp.y, lp.x) * 2.2, asin(clamp(lp.z, -1.0, 1.0)) * 2.6); vec2 hsz = vec2(1.0, 1.7320508), ha = mod(q, hsz) - hsz * 0.5, hb = mod(q - hsz * 0.5, hsz) - hsz * 0.5, gv = dot(ha, ha) < dot(hb, hb) ? ha : hb;   // the lattice cage: a hexagonal frame, the cells open
      float hd = max(dot(abs(gv), vec2(0.5, 0.8660254)), abs(gv.x)); if (hd < 0.4) discard;
      vec3 T0 = vec3(0.14, 0.13, 0.15); sC = (T0 * (0.25 + 0.7 * sDif) * sKEY * 0.6 + (T0 + (1.0 - T0) * sFr * 0.5) * sEv + vec3(1.0) * pow(sSb, 40.0) * 0.8) * sOcc;
      sC = mix(sC, sGold, smoothstep(0.47, 0.5, hd) * 0.8) + sOR * (0.2 + 0.4 * sG) * (1.0 - sNV) * 0.4; }
    else if (id == 411) { float tip = 1.0 - clamp(ao, 0.0, 1.0), side = step(0.25, sF);   // black glass: a dark mirror with a molten edge (the facet rims toward its tip; a prism's sides)
      vec3 T0 = vec3(0.025, 0.015, 0.02), TF = T0 + (vec3(0.6, 0.5, 0.55) - T0) * sFr;
      vec3 c = (T0 * (0.2 + 0.7 * sDif) * sKEY + TF * sEv * 1.2 + vec3(1.0, 0.9, 0.85) * pow(sSb, 120.0) * 2.2 + sRim * 0.6) * sOcc;
      float hotE = side > 0.5 ? 1.0 : pow(clamp(edge, 0.0, 1.0), 3.0) * (0.25 + 0.75 * tip), hk = clamp(0.3 + 0.5 * sG + 0.3 * sin(sT * 3.0 + L.x * 4.0) * 0.3, 0.0, 2.0);
      sC = c + (hk < 1.0 ? mix(sCR, sOR, hk) : mix(sOR, sWH, hk - 1.0)) * hotE * (0.35 + 0.5 * sG); }
    else if (id == 412) { float hot = step(0.25, sF), w1 = vn(L.xy * 2.4 + L.z * 1.8), w2 = vn(L.yz * 7.0 + L.x * 4.0);   // molten rock: basalt, glowing fissures and a hot underside
      vec3 alb = mix(vec3(0.07, 0.055, 0.06), vec3(0.16, 0.12, 0.11), w1) * (0.8 + 0.3 * w2), c = alb * (sDif * sKEY + sAmb) * sOcc + sEv * sFr * 0.3;
      float c1 = abs(fract(dot(L, vec3(2.2, 1.4, 1.8)) + w1 * 1.5) - 0.5), c2 = abs(fract(dot(L, vec3(-1.7, 2.5, 1.2)) + w2 * 0.9) - 0.5), fis = smoothstep(0.03, 0.005, min(c1, c2));
      float hk = clamp(0.4 + 0.4 * sG + 0.5 * hot, 0.0, 2.0); vec3 lava = hk < 1.0 ? mix(sCR, sOR, hk) : mix(sOR, sWH, hk - 1.0);
      sC = c * (1.0 - fis * 0.8) + lava * (fis * (0.6 + 0.6 * sG) + max(0.0, -n.z) * 0.15 * sG + hot * smoothstep(0.55, 0.8, w2) * 0.4 * sG); }
    else if (id == 414) { vec3 lp = normalize(L); float st2 = vn(vec2(lp.y * 9.0 + lp.z * 4.0, L.x * 2.5 + sT * 9.0)), fr = pow(1.0 - sNV, 1.5), front = smoothstep(-0.2, 0.9, lp.x);   // the meteor's shell: streaming plasma, white-hot at its front
      float k = clamp(0.15 + 0.7 * front * front + 0.35 * st2 + 0.15 * sG, 0.0, 1.8); vec3 cs = (k < 1.0 ? mix(sCR, sOR, k) : mix(sOR, sWH, k - 1.0)) * (0.3 + 0.8 * fr + 0.3 * front) * (0.6 + 0.4 * sG2);
      sA = clamp(0.06 + 0.55 * fr * (0.5 + 0.5 * st2) + 0.3 * front * st2, 0.0, 0.85); cs = vec3(tone(cs.r), tone(cs.g), tone(cs.b)) * sA;   // (premultiplied: the colour carries its own alpha, staying crimson)
      gl_FragColor = vec4(cs * uAlpha, sA * uAlpha); return; }
    else if (id == 415) { float k = clamp(0.8 + 0.4 * sG, 0.0, 2.0); sC = (k < 1.0 ? mix(sCR, sOR, k) : mix(sOR, sWH, k - 1.0)) * (0.8 + 0.4 * sNV); }
    else if (sF > 0.25) { float v = clamp(edge, 0.0, 1.0), u2 = clamp(ao, 0.0, 1.0), fl = vn(vec2(u2 * 9.0 - sT * 4.0, v * 2.5 + sT * 0.7)), fl2 = vn(vec2(u2 * 23.0 - sT * 7.0, v * 6.0));   // (v435 SM concept2) 416.3 a flame ribbon: crimson fire streaming off it, hot at its root, tattered and fading to its tip
      float bd = smoothstep(0.0, 0.3 + 0.2 * fl2, v) * smoothstep(1.0, 0.7 - 0.2 * fl, v), k = clamp(0.3 * pow(1.0 - u2, 2.5) + 0.15 * fl + 0.08 * sG, 0.0, 2.0);
      vec3 cs = (k < 1.0 ? mix(sCR, sOR, k) : mix(sOR, sWH, min(1.0, k - 1.0))) * (1.0 + 0.6 * fl) * 1.3; cs = vec3(tone(cs.r), tone(cs.g), tone(cs.b));
      sA = clamp(bd * pow(1.0 - u2, 0.7) * (0.5 + 0.7 * fl + 0.3 * fl2) * 1.6, 0.0, 0.95) * smoothstep(0.0, 0.06, u2 + 0.02); gl_FragColor = vec4(cs * sA * uAlpha, sA * uAlpha); return; }
    else { float v = clamp(edge, 0.0, 1.0), u2 = clamp(ao, 0.0, 1.0), fl = vn(vec2(u2 * 14.0 - sT * 5.0, v * 3.0 + sT));   // 416 a crescent of plasma: a white-hot cutting edge, crimson inward, fading to nothing toward the arc's centre
      float ends = smoothstep(0.0, 0.15, u2) * smoothstep(1.0, 0.85, u2), k = clamp(0.3 + 1.6 * pow(v, 3.0) + 0.3 * fl + 0.3 * sG, 0.0, 2.3);
      vec3 cs = (k < 1.0 ? mix(sCR, sOR, k) : mix(sOR, sWH, min(1.0, k - 1.0))) * (0.6 + 0.6 * fl); cs = vec3(tone(cs.r), tone(cs.g), tone(cs.b));
      sA = clamp((0.08 + 0.9 * pow(v, 2.2) + 0.25 * fl * v) * ends, 0.0, 1.0); gl_FragColor = vec4(cs * sA * uAlpha, sA * uAlpha); return; }
    sC += sOR * sDE * 2.0 + sWH * sDE * sDE * 1.2;   // (the dissolve's burning crimson edge: it breaks into embers)
    gl_FragColor = vec4(vec3(tone(sC.r), tone(sC.g), tone(sC.b)) * uAlpha, uAlpha); return; }
  /*</SM-MAT>*/
  /*<SF-MAT ids 490..494 (v450 SF: 20k6j-fire-snakeflame-model.js, Snake Flame, the serpent of living flame)>*/
  else if (id >= 490 && id <= 494) {   // ---- (v450 SF) 490 the body's volcanic plates (a body slice: vA.y its place along the body, 0 the neck .. 1 the tail; vA.z 1 mid-slice .. 0 at a joint; its own normal NL.z the back (+) or the belly (-)): dark basalt plates in staggered shingled rows, orange-gold fire in every seam, the molten core showing between the belly's scutes and at the joints; 491 the head's angular plates (491.2 the mouth, palate and nostrils: molten flesh; 491.4 the lower jaw's plates), 492 fang and horn bone (vA.z 1 at its root .. 0 at its tip; 492.3 a black horn with molten cracks), 493 an amber eye (its own +x the gaze, +z up: a slit pupil), 494 a flame membrane (crests, fins, the tail's flame: vA.y 0 the root .. 1 the tip, vA.z across 0..1; see-through, premultiplied). uGlow the fire (1 at rest, to 3 in the last second), uGlow2 white heat (the collapse), uSpill the dissolve (burning away into embers), uKind the tier 0..2 (gold in the seams, richer flames), uWear a per-part seed, uTime the flow
    float fF = vA.x - float(id), fG = clamp(uGlow, 0.0, 3.5), fG2 = clamp(uGlow2, 0.0, 2.0), fT = uTime, fDE = 0.0, fK = clamp(uKind, 0.0, 2.0);
    float fNV = max(0.001, dot(n, uV)), fHm = 0.5 + 0.5 * dot(n, uUP);
    vec3 fCR = vec3(0.85, 0.11, 0.02), fOR = vec3(1.65, 0.58, 0.08), fGD = vec3(1.9, 1.25, 0.42), fWH = vec3(2.1, 1.85, 1.35);
    float fAn = atan(NL.z, NL.y); vec2 fQ = id == 490 ? vec2(edge * 46.0, fAn * 1.75) : vec2(L.x * 3.4 + L.z * 1.3, L.y * 3.4 - L.z * 0.9);
    if (uSpill > 0.0) { float dn = vn(fQ * 1.3 + 3.1 + uWear * 5.0) * 0.6 + vn(fQ * 4.1 + 7.7) * 0.4, th = uSpill * 1.12 - 0.06; if (dn < th) discard; fDE = smoothstep(th + 0.12, th, dn); }
    if (id == 494) { float al = clamp(edge, 0.0, 1.0), ac = clamp(ao, 0.0, 1.0), cx = abs(ac - 0.5) * 2.0;
      float fl = vn(vec2(ac * 5.0 + uWear * 11.0, al * 3.2 - fT * 3.4)), fl2 = vn(vec2(ac * 13.0 + uWear * 7.0, al * 7.0 - fT * 6.1));
      float w = 1.0 - al * (0.8 + 0.3 * fl), body = smoothstep(w + 0.02, w - 0.24, cx) * smoothstep(1.0, 0.8 - 0.22 * fl2, al);   // (a tongue of flame tapering to its tip, its outline eaten by the flicker)
      float k = clamp(1.12 - al * 1.05 + (1.0 - cx) * 0.48 + 0.3 * (fl2 - 0.5) + 0.25 * (fG - 1.0) + 0.22 * fK, 0.0, 3.0), root = 1.0 - smoothstep(0.0, 0.16, al);
      vec3 cs = k < 1.0 ? mix(fCR, fOR, k) : k < 2.0 ? mix(fOR, fGD, k - 1.0) : mix(fGD, fWH, min(1.0, k - 2.0));
      cs = mix(cs, vec3(0.36, 0.07, 0.02) + fOR * 0.22, root * 0.55) * (0.85 + 0.35 * fl);   // (its root an ember membrane, part of the body)
      float A = clamp(body * (0.7 + 0.45 * fl + 0.3 * root) * (1.0 - 0.6 * fDE), 0.0, 0.97);
      cs = vec3(tone(cs.r), tone(cs.g), tone(cs.b)); cs = mix(cs, vec3(1.0, 0.95, 0.86), min(1.0, fG2 * 0.5));
      gl_FragColor = vec4(cs * A * uAlpha, A * 0.8 * uAlpha); return; }
    if (id == 493) { vec3 p = normalize(L); float fr = clamp(p.x, -1.0, 1.0), rr = length(p.yz), iris = smoothstep(0.5, 0.58, fr);
      float slit = smoothstep(0.1, 0.05, abs(p.y) / max(0.05, 1.0 - pow(abs(p.z) / 0.75, 2.0))) * iris, fib = 0.75 + 0.25 * vn(vec2(atan(p.z, p.y) * 9.0, rr * 14.0));
      vec3 ic = mix(vec3(1.95, 1.25, 0.28), vec3(1.25, 0.42, 0.05), smoothstep(0.1, 0.8, rr)) * fib * (0.75 + 0.3 * fG), c = mix(vec3(0.16, 0.05, 0.02), ic, iris);
      c = mix(c, vec3(0.06, 0.0, 0.0) + fCR * 0.35 * fG, slit * 0.92);   // (the slit's depth glows a little red)
      vec3 hh = normalize(uLK + uV); c += vec3(1.0, 0.95, 0.85) * (smoothstep(0.9, 0.93, dot(n, hh)) * 1.4 + pow(1.0 - fNV, 3.0) * 0.4); c = mix(c, fWH, fG2 * 0.5);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 nn = n, alb = vec3(0.05), emi = vec3(0.0); float gloss = 0.35, seam = 0.0, kh = 0.6 + 0.3 * (fG - 1.0) + 0.12 * fK;
    if (id == 490) { float s = clamp(edge, 0.0, 1.0), bk = NL.z, jt = clamp(ao, 0.0, 1.0), bel = smoothstep(-0.25, -0.5, bk); vec3 TA = normalize(uM0);
      vec2 q = vec2(s * 46.0, fAn * 1.75); q.y += mod(floor(q.x), 2.0) * 0.5; if (bel > 0.5) q = vec2(s * 30.0, fAn * 0.6 + 0.5);
      vec2 ci = floor(q), cf = fract(q); float hv = hs(ci + uWear * 0.1), ay = abs(cf.y - 0.5);
      float e = bel > 0.5 ? min(0.5 - abs(cf.x - 0.5), 0.5 - ay) * 1.2 : min(min((1.0 - cf.x) * 0.9 - ay * 0.55 + 0.06, (0.5 - ay) * 1.2), (cf.x + 0.04) * 1.6);   // (a shield-shaped plate pointing to the tail; the belly's broad scutes)
      float sw = mix(0.026, 0.075, bel) + 0.022 * (1.0 - jt); seam = 1.0 - smoothstep(sw * 0.35, sw, e);
      if (uLow < 0.5) nn = normalize(n - TA * 0.22 * (1.0 - seam) * (1.0 - 0.6 * bel) * (cf.x - 0.2));   // (each plate tilted up toward its free edge: angular, shingled)
      float g1 = vn(vec2(s * 260.0, fAn * 9.0) + hv * 7.0), g2 = vn(vec2(s * 90.0, fAn * 3.0) + hv * 3.0);
      alb = mix(vec3(0.03, 0.027, 0.03), vec3(0.085, 0.068, 0.065), 0.55 * hv + 0.45 * g2) * (1.0 - 0.45 * smoothstep(0.72, 0.88, g1)); alb += vec3(0.06, 0.055, 0.055) * smoothstep(0.1, 0.04, e) * (1.0 - seam);   // (vesicles; ash-pale worn edges)
      alb = mix(alb, vec3(0.022, 0.02, 0.024), smoothstep(0.75, 0.95, bk) * 0.5); gloss = (0.18 + 0.2 * hv) * (0.4 + g1);
      kh += 0.25 * sin(fT * 4.0 - s * 42.0 + hv * 3.0);   // (pulses of heat running down the seams toward the tail)
      float k = kh + 0.35 * bel; vec3 hc = k < 1.0 ? mix(fCR, fOR, clamp(k, 0.0, 1.0)) : k < 2.0 ? mix(fOR, fGD, k - 1.0) : mix(fGD, fWH, min(1.0, k - 2.0));
      emi += hc * seam * (1.0 + 0.6 * fG) + fCR * exp(-max(e, 0.0) / 0.035) * 0.22 * fG * (1.0 - seam);   // (the seams' fire, and the plates' edges red-hot from beneath) (v452 SF2: brighter)
      emi += mix(fOR, fGD, 0.4) * bel * (0.08 + 0.75 * seam) * (0.7 + 0.4 * fG) + mix(fCR, fOR, 0.6) * pow(1.0 - jt, 3.0) * 0.45 * fG;   // (the molten core showing under the belly and at the joints)
      emi += fGD * step(0.986, hs(floor(vec2(s * 420.0, fAn * 15.0)))) * fK * 0.6 * (1.0 - seam); }   // (gold flecks at the higher tiers)
    else if (id == 491) { if (fF > 0.1 && fF < 0.3) { float rg = 0.5 + 0.5 * sin(L.x * 34.0 + vn(L.yz * 9.0) * 3.0), k = 1.0 + 0.35 * (fG - 1.0) + 0.3 * rg;   // 491.2 the mouth: molten flesh, ridged
          alb = vec3(0.3, 0.05, 0.02); emi = (k < 1.0 ? mix(fCR, fOR, k) : mix(fOR, fGD, min(1.0, k - 1.0))) * (0.55 + 0.25 * rg) * (0.8 + 0.3 * fG); gloss = 0.7; }
      else { vec2 p = vec2(L.x * 2.7 + fF * 3.0, L.y * 3.1 + L.z * 2.2); vec2 pi = floor(p), pf = fract(p); float d1 = 9.0, d2 = 9.0; vec2 pc = vec2(0.0);
        for (int ii = -1; ii <= 1; ii++) for (int jj = -1; jj <= 1; jj++) { vec2 gq = vec2(float(ii), float(jj)), o = vec2(hs(pi + gq), hs(pi + gq + 17.3)) * 0.8 + 0.1, dd = gq + o - pf; float l = dot(dd, dd); if (l < d1) { d2 = d1; d1 = l; pc = pi + gq; } else if (l < d2) d2 = l; }
        float ed = sqrt(d2) - sqrt(d1), hv = hs(pc + 3.7); seam = 1.0 - smoothstep(0.03, 0.09, ed);
        alb = mix(vec3(0.034, 0.03, 0.033), vec3(0.095, 0.074, 0.068), hv) * (0.85 + 0.3 * (1.0 - sqrt(d1))); alb += vec3(0.06, 0.055, 0.05) * smoothstep(0.14, 0.07, ed) * (1.0 - seam); gloss = 0.3 + 0.15 * hv;
        float k = kh + 0.2 * sin(fT * 3.0 + hv * 6.0); emi += (k < 1.0 ? mix(fCR, fOR, clamp(k, 0.0, 1.0)) : mix(fOR, fGD, min(1.0, k - 1.0))) * seam * (0.8 + 0.5 * fG) + fCR * smoothstep(0.14, 0.05, ed) * 0.14 * fG * (1.0 - seam); } }
    else { float tip = 1.0 - clamp(ao, 0.0, 1.0);
      if (fF > 0.2) { float cr = smoothstep(0.05, 0.0, abs(vn(vec2(L.x * 5.0 + L.z * 2.0, L.y * 5.0 + L.z * 3.0) + uWear * 3.0) - 0.5));   // 492.5 a black horn: obsidian, molten cracks
          alb = vec3(0.035, 0.03, 0.035); gloss = 0.45; emi += mix(fCR, fOR, 0.5 + 0.3 * (fG - 1.0)) * cr * (0.6 + 0.5 * fG) + fOR * pow(tip, 3.0) * 0.35 * fG; }
      else { alb = mix(vec3(0.16, 0.1, 0.07), mix(vec3(0.8, 0.72, 0.58), vec3(0.97, 0.92, 0.8), tip), smoothstep(0.0, 0.3, tip)); gloss = 0.8; emi += fOR * 0.1 * pow(tip, 2.0) * fG; } }   // 492 fang bone: charred at the root, ivory, its point lit through
    if (id < 492) emi += mix(fOR, fGD, 0.25) * pow(1.0 - fNV, 2.6) * (0.16 + 0.12 * fG) * (0.8 + 0.2 * sin(fT * 9.0 + L.x * 5.0 + L.y * 3.0));   // (v452 SF2: the skin's heat glowing round its silhouette, flickering: the fire emanating from it)
    float ndl = dot(nn, uLK), b = 0.5 * smoothstep(-0.02, 0.07, ndl) + 0.5 * smoothstep(0.42, 0.5, ndl);   // (cel bands: shadow, midtone, light)
    vec3 amb = mix(vec3(0.34, 0.1, 0.03), vec3(0.13, 0.12, 0.16), fHm) * uAmb;   // (the fire under it lights it from below)
    vec3 c = alb * (vec3(1.55, 1.4, 1.25) * mix(0.16, 1.0, b) + amb * 1.25) * (1.0 - 0.6 * seam);
    vec3 hh = normalize(uLK + uV); c += vec3(1.0, 0.9, 0.8) * smoothstep(0.94, 0.965, dot(nn, hh)) * gloss * 0.7 * (1.0 - seam) * (0.4 + 0.6 * b);
    c += pow(1.0 - fNV, 2.4) * max(0.0, dot(nn, uLR) + 0.35) * uRim * 0.5;
    c += emi + fOR * fDE * 2.2 + fWH * fDE * fDE * 1.2; c = mix(c, fWH * 0.85 + emi * 0.25, min(1.0, fG2 * 0.55));
    gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  /*</SF-MAT>*/
  /*<RZ-MAT ids 600..629 (v464 RZ-M: 02f7-raziel-model.js, Raziel the Twin Revelation)>*/
  else if (id >= 600 && id <= 629) {   // ---- (v464 RZ-M) Raziel (02f7). uWear the side: 0 Lux (fire: ivory ceramic, burnished gold heat-stained at its edges, dark titanium, molten conduits), 1 Umbra (ice: silver-white ceramic, platinum, dark cobalt, sapphire, cyan conduits, frost on its edges), 2 by the vertex's own y (+y Lux: the torso, the tail). 600 ceramic armour (600.2 an underside; 600.3 engraved with celestial lines inlaid in metal; vA.y 1 a rim: metal trim), 601 the noble metal (601.2 engraved, 601.3 heavily stained / frosted), 602 the dark structure (602.2 ribbed machinery, 602.3 a recess lit by the element), 603 a conduit (vA.z along it, uKind the part's place from the core 0 .. 1 the jaw, uGlow2 the charge: its front), 604 an eye, 605 plasma (the sun: domain-warped turbulence; 605.2 a prominence; 605.3 the see-through corona), 606 crystal (Lux's amber-ruby, Umbra's sapphire; 606.2 a lit nucleus, 606.3 a see-through faceted shell), 607 a feather-blade (vA.y across 0 leading .. 1 trailing, vA.z along 0 root .. 1 tip; 607.0 its metal frame, 607.2 its element panel: molten gold with flame filaments / sapphire crystal with fractures), 608 a runed ring (608.3 a dark band), 609 light (see-through; uKind 0 fire, 1 ice, 2 the white bridge along vA... its z), 610 the throat inside (lit by uGlow2), 611 a fang (611.2 a claw), 612 a mote. uGlow2 on the armour: Lux's seams white-hot, frost creeping over Umbra. uFx 1 / 2: the spectral plasma / crystal construct (see-through, premultiplied). uSpill the dissolve (Lux burns away, Umbra shatters along crystal planes)
    float rF = vA.x - float(id), rG = clamp(uGlow, 0.0, 4.0), rG2 = clamp(uGlow2, 0.0, 4.0), rT = uTime, rDE = 0.0;
    float sd = uWear > 1.5 ? smoothstep(0.1, -0.1, L.y) : clamp(uWear, 0.0, 1.0);
    vec3 cHot = vec3(1.7, 0.62, 0.14), cCr = vec3(0.8, 0.1, 0.04), cWH = vec3(1.9, 1.65, 1.2), cCy = vec3(0.3, 1.15, 1.75), cIc = vec3(0.78, 0.97, 1.6), rEl = mix(cHot, cCy, sd);
    if (uSpill > 0.0) { float dn = vn(L.xy * 9.0 + L.z * 5.3) * 0.55 + vn(L.yz * 21.0 + L.x * 7.0) * 0.3 + vn(L.xz * 43.0 + 3.0) * 0.15;
      dn = mix(dn, abs(fract(dot(L, vec3(3.1, 4.7, 2.3)) * 1.7 + dn) - 0.5) * 2.0, 0.5 * sd); float th = uSpill * 1.15 - 0.08; if (dn < th) discard; rDE = smoothstep(th + 0.08, th, dn); }
    float rSc = 0.0, rScE = 0.0;   // (v465 RZ-M) overlapping metallic scales on the ceramic armour (600, 600.3): rows of rounded scales, each lifted and tilted out from its lower edge (a normal from its own shape), its rim edged in the side's metal, a darker overlap shadow at its root
    if (id == 600 && rF < 0.15 && uLow < 0.5 && uFx < 0.75 || id == 600 && rF > 0.25 && uLow < 0.5 && uFx < 0.75) { vec3 an = abs(NL); vec2 uv = an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz; uv *= 4.2;
      float row = floor(uv.y), sx = uv.x + 0.5 * mod(row, 2.0), cx = floor(sx), fx = fract(sx) - 0.5, fy = fract(uv.y), dd = length(vec2(fx * 1.15, fy - 0.05));
      if (dd > 0.62) { fx = fract(sx + 0.5) - 0.5; fy += 1.0; dd = length(vec2(fx * 1.15, fy - 0.05)); }   // (the scale of the row below overlaps its lower part)
      rSc = 1.0 - smoothstep(0.5, 0.62, dd); rScE = smoothstep(0.47, 0.57, dd) * (1.0 - smoothstep(0.58, 0.64, dd));
      vec3 to = vec3(0.0); if (an.z >= an.x && an.z >= an.y) to = vec3(fx, fy - 0.3, 0.0); else if (an.y >= an.x) to = vec3(fx, 0.0, fy - 0.3); else to = vec3(0.0, fx, fy - 0.3);
      vec3 tw = uM0 * to.x + uM1 * to.y + uM2 * to.z; float tl = length(tw); if (tl > 1e-5) n = normalize(n + tw / tl * (0.22 * dd + 0.25 * rScE)); }
    float rNV = max(0.001, dot(n, uV)), rNL = dot(n, uLK), rFr = pow(1.0 - rNV, 5.0), rHm = 0.5 + 0.5 * dot(n, uUP);
    float rOc = uNOcc > 0.5 ? occAO(vW, n) : 1.0, rSh = uNOcc > 0.5 && uLow < 0.5 ? occSH(vW, uLK) : 1.0, rDif = max(rNL, 0.0) * rSh;
    vec3 rR = 2.0 * rNV * n - uV; float rUp = dot(rR, uUP), rSb = max(dot(rR, uLK), 0.0) * rSh, rHz = rUp - 0.06;
    vec3 evF = rUp > 0.0 ? mix(vec3(0.16, 0.09, 0.07), vec3(0.6, 0.46, 0.36), pow(clamp(rUp, 0.0, 1.0), 1.2)) : mix(vec3(0.3, 0.1, 0.035), vec3(0.04, 0.02, 0.015), clamp(-rUp * 2.5, 0.0, 1.0));
    vec3 evI = rUp > 0.0 ? mix(vec3(0.08, 0.11, 0.2), vec3(0.45, 0.58, 0.8), pow(clamp(rUp, 0.0, 1.0), 1.2)) : mix(vec3(0.07, 0.15, 0.3), vec3(0.015, 0.02, 0.04), clamp(-rUp * 2.5, 0.0, 1.0));
    vec3 rEv = mix(evF, evI, sd) + mix(vec3(1.0, 0.45, 0.15), vec3(0.35, 0.75, 1.0), sd) * exp(-rHz * rHz / 0.005) * 0.45;
    vec3 rKEY = vec3(1.5, 1.4, 1.3), rAmb = mix(vec3(0.07, 0.06, 0.07), vec3(0.3, 0.29, 0.33), rHm) * rOc, rRim = pow(1.0 - rNV, 2.4) * max(0.0, dot(n, uLR) + 0.35) * mix(vec3(1.35, 0.6, 0.25), vec3(0.45, 0.85, 1.5), sd);
    if (uFx > 0.75) {   // the spectral constructs of the ultimate (v464 RZ-M): lit, layered and see-through, never a flat cut-out: the armour a translucent shell over a radiant skeleton (the structural parts), circuitry and flowing energy inside, a fresnel rim, the key light's form
      float fr = pow(1.0 - rNV, 2.2), lw = 0.35 + 0.65 * pow(clamp(rNL * 0.5 + 0.5, 0.0, 1.0), 1.4), sk = (id == 601 || id == 602 || id == 608) ? 1.0 : 0.0, hot = (id == 603 || id == 604 || id == 605 || id == 612) ? 1.0 : 0.0, eg = smoothstep(0.82, 1.0, edge);
      vec3 c; float a;
      if (uFx < 1.5) {   // Lux: molten plasma armour (turbulent, rising), a white-gold skeleton, white-hot circuitry, burning edges
        vec2 fq = vec2(L.x * 2.1 + L.y * 1.3, L.z * 2.4 - rT * 1.1); float w0 = vn(fq * 0.8 + rT * 0.15), tb = vn(fq * 1.6 + w0 * 1.8), tb2 = vn(fq * 4.2 - w0 * 2.0 + rT * 0.6);
        float cir = smoothstep(0.05, 0.0, abs(fract(L.x * 2.6 + L.z * 1.9 + tb * 0.5) - 0.5) - 0.44) * step(0.45, vn(L.yz * 1.7 + 3.0)) * (1.0 - uLow);
        vec3 body = mix(vec3(0.22, 0.025, 0.01), vec3(1.0, 0.3, 0.04), smoothstep(0.3, 0.85, tb)) + vec3(1.2, 0.6, 0.15) * smoothstep(0.72, 0.95, tb2) * 0.5;
        c = body * lw * 0.95 + vec3(1.25, 0.55, 0.14) * fr * 0.95 + mix(cHot, cWH, 0.45) * cir * 0.85 + cHot * eg * 0.35 + vec3(1.0, 0.8, 0.5) * pow(rSb, 40.0) * 0.4;
        c = mix(c, mix(cHot, cWH, 0.3) * (0.45 + 0.45 * lw) * (0.8 + 0.3 * tb), sk * 0.8); c = mix(c, mix(cHot, cWH, 0.6), hot * 0.7); c += cHot * rDE * 2.0;
        a = clamp(mix(0.3 + 0.45 * fr + 0.25 * tb + cir * 0.4 + eg * 0.3, 0.88, max(sk, hot)), 0.0, 0.95); }
      else {   // Umbra: translucent crystal armour (depth, refraction, fractures, frost), frozen pale vertebrae, blue-white energy, bright facet edges
        float w1 = vn(L.xy * 2.6 + L.z * 1.8), w2 = vn(L.yz * 6.0 + L.x * 3.0), k1 = abs(fract(dot(L, vec3(2.1, 3.3, 1.7)) + w1) - 0.5), k2 = abs(fract(dot(L, vec3(-1.7, 2.6, 3.1)) + w2 * 0.8) - 0.5), crk = smoothstep(0.035, 0.0, min(k1, k2));
        vec3 rf = refract(-uV, n, 0.72); float e2; float tr = env(normalize(n * 0.4 - rf), 0.2, e2);
        vec3 body = mix(vec3(0.02, 0.07, 0.24), vec3(0.14, 0.42, 0.95), smoothstep(0.2, 0.8, w1)) * (0.55 + 0.45 * lw) + vec3(0.25, 0.55, 1.0) * tr * 0.3;
        float pul = pow(0.5 + 0.5 * sin(L.z * 3.0 - rT * 2.0 + w1 * 4.0), 8.0);
        c = body + cIc * fr * 1.0 + cCy * crk * 0.9 + cIc * eg * 0.6 + vec3(1.0) * pow(rSb, 90.0) * 2.2 + cCy * pul * 0.25 + vec3(0.8, 0.9, 1.0) * smoothstep(0.82, 0.95, w2) * 0.25 * (1.0 - uLow);
        c = mix(c, vec3(0.6, 0.82, 1.15) * (0.4 + 0.6 * lw) + cIc * fr * 0.5, sk * 0.75); c = mix(c, cIc * 1.1, hot * 0.7); c += cCy * rDE * 2.0;
        a = clamp(mix(0.2 + 0.55 * fr + crk * 0.45 + eg * 0.3 + 0.1 * w1, 0.8, max(sk, hot)), 0.0, 0.92); }
      c = vec3(tone(c.r), tone(c.g), tone(c.b)); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
    vec3 rM0 = mix(vec3(0.98, 0.7, 0.32), vec3(0.86, 0.89, 0.95), sd), rMF = rM0 + (1.0 - rM0) * rFr;   // (burnished gold / polished platinum)
    vec3 rMet = (rM0 * (0.16 + 0.75 * rDif) * rKEY * mix(0.85, 0.55, sd) * rOc + rMF * mix(rEv, vec3(dot(rEv, vec3(0.33))), 0.35) * mix(1.6, 1.3, sd) * rOc + mix(vec3(1.0, 0.9, 0.72), vec3(0.92, 0.96, 1.0), sd) * (pow(rSb, 70.0) * 2.4 + pow(rSb, 9.0) * 0.3) + rRim * 0.35) * 1.15;
    vec3 aC = vec3(0.0);
    if (id == 600) { float und = step(0.15, rF) * step(rF, 0.25), eng = step(0.25, rF);   // ceramic: a glazed ivory / silver-white, fine grain, engraved celestial lines, metal rims
      vec3 alb = mix(vec3(0.99, 0.94, 0.84), vec3(0.84, 0.89, 0.97), sd) * (und > 0.5 ? 0.5 : 1.0); float gr = vn(L.xy * 14.0 + L.z * 6.0) * 0.07;
      vec3 c = alb * (0.1 + 0.74 * rDif) * rKEY * (1.0 - gr) + alb * (rAmb * 1.5 + 0.06 * rOc) + rEv * (0.05 + 0.6 * rFr) * rOc + vec3(1.0, 0.97, 0.92) * pow(rSb, 60.0) * 1.1 + rRim * 0.3;
      if (rSc + rScE > 0.0) { c = c * (0.72 + 0.28 * rSc) + vec3(1.0, 0.97, 0.92) * pow(rSb, 28.0) * 0.35 * rSc + rEv * rFr * 0.35 * rSc; c = mix(c, rMet * 0.95, rScE * 0.8); }   // (v465 RZ-M: the scales: a shadow where each tucks under the next, a metallic sheen, their gilded rims)
      if (eng > 0.5 && uLow < 0.5) { vec2 q = vec2(L.x * 3.2 + L.z * 1.3, L.y * 3.2 - L.z * 2.1); float w1 = vn(q * 0.9), r1 = abs(fract(length(fract(q) - 0.5) * 3.0 + w1 * 0.5) - 0.5), ln = smoothstep(0.06, 0.02, r1) * step(0.45, w1), ry2 = smoothstep(0.035, 0.012, abs(fract(q.x * 2.0 + q.y * 0.5) - 0.5)) * step(0.62, w1), g = max(ln, ry2);
        c = mix(c, rMet * 0.9, g * 0.85); c += rEl * g * (0.04 + 0.3 * rG2 * (1.0 - sd)); }
      aC = mix(c, rMet, smoothstep(0.78, 0.95, edge) * (1.0 - und)); }
    else if (id == 601) { float eg = step(0.15, rF) * step(rF, 0.25), st2 = step(0.25, rF), ln = (1.0 - uLow) * eg * smoothstep(0.06, 0.02, abs(fract(L.x * 6.0 + L.z * 4.0 + 0.5 * sin(L.y * 8.0)) - 0.5));
      vec3 c = rMet * (1.0 - ln * 0.5) + rEl * ln * 0.15;
      float hst = (1.0 - sd) * smoothstep(0.4, 1.0, edge + 0.3 * vn(L.xy * 5.0)) * (0.35 + 0.65 * st2); c = mix(c, c * mix(vec3(1.0, 0.62, 0.35), vec3(0.55, 0.42, 0.95), smoothstep(0.7, 1.0, edge)), hst * 0.45);   // (heat-stained: straw, bronze, a blue-violet temper)
      aC = c; }
    else if (id == 602) { float rib = step(0.15, rF) * step(rF, 0.25), rec = step(0.25, rF), br = vn(vec2(L.x * 40.0 + L.y * 40.0, L.z * 2.0)), rg = 0.3 + 0.1 * br;   // titanium / cobalt: brushed, machined
      vec3 T0 = mix(vec3(0.13, 0.12, 0.125), vec3(0.06, 0.1, 0.2), sd) * (0.85 + 0.25 * br), TF = T0 + (1.0 - T0) * rFr * 0.5;
      vec3 c = T0 * (0.15 + 0.75 * rDif) * rKEY * 0.6 * rOc + TF * rEv * 0.9 * rOc + vec3(0.9, 0.92, 1.0) * pow(rSb, 2.0 / (rg * rg)) * 0.7 + rRim * 0.4;
      if (rib > 0.5 && uLow < 0.5) { float rb = abs(fract(L.z * 9.0 + L.x * 2.0) - 0.5); c *= 0.7 + 0.5 * smoothstep(0.1, 0.3, rb); c += rEl * smoothstep(0.08, 0.0, rb) * (0.06 + 0.3 * rG2) * (0.6 + 0.4 * sin(rT * 3.0 + L.z * 7.0)); }
      if (rec > 0.5) c = c * 0.4 + rEl * (0.35 + 0.35 * rG + 0.6 * rG2) * (0.8 + 0.2 * sin(rT * 5.0 + L.x * 9.0));
      aC = c; }
    else if (id == 603) { float s = ao + uKind, front = smoothstep(uKind + 0.12, uKind - 0.04, rG2 * 0.87); vec3 c;   // a conduit: molten lava rolling along it / crisp cyan pulses
      if (sd < 0.5) { float w = vn(vec2(s * 6.0 - rT * 1.6, edge * 3.0 + rT * 0.4)), w2 = vn(vec2(s * 13.0 - rT * 2.7, edge * 5.0)), heat = clamp(0.35 + 0.5 * w + 0.3 * w2 + 0.7 * front + 0.2 * rG, 0.0, 2.0);
        c = mix(cCr * 0.6, cHot, clamp(heat, 0.0, 1.0)) + cWH * max(0.0, heat - 1.0) * 0.9; }
      else { float pul = pow(0.5 + 0.5 * sin(s * 9.0 - rT * 4.0), 6.0), fk = step(0.82, hs(floor(vec2(s * 20.0, rT * 6.0))));
        c = mix(vec3(0.02, 0.12, 0.35), cCy, 0.45 + 0.35 * pul + 0.2 * fk) + cIc * (pul * 0.4 + front * 0.8) * (0.6 + 0.4 * rG); }
      c *= 0.7 + 0.5 * smoothstep(0.0, 0.5, edge) * smoothstep(1.0, 0.5, edge) + 0.15 * rG; aC = c + vec3(1.0) * pow(rSb, 40.0) * 0.4 + rEv * rFr * 0.3; }
    else if (id == 604) aC = mix(rEl, mix(cWH, cIc, sd), 0.35 + 0.45 * rNV * rNV) * (1.0 + 0.6 * rG2 + 0.3 * rG) * (0.92 + 0.08 * sin(rT * 7.0));
    else if (id == 605) { vec3 lp = normalize(L + vec3(1e-4));   // plasma: the sun (turbulent, white-hot), a prominence, the corona (see-through)
      if (rF > 0.25) { float fl = vn(vec2(atan(lp.y, lp.x) * 3.0 + rT * 0.8, lp.z * 4.0 - rT * 1.5)), fr = pow(1.0 - rNV, 1.4); vec3 c = mix(cHot, cWH, 0.3) * (0.4 + fl) * (0.8 + 0.3 * rG); c = vec3(tone(c.r), tone(c.g), tone(c.b));
        float a = clamp(fr * (0.5 + 0.6 * fl) + 0.06, 0.0, 0.85); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
      vec2 q = vec2(atan(lp.y, lp.x) * 1.6, asin(clamp(lp.z, -1.0, 1.0)) * 2.0), w = vec2(vn(q * 2.0 + rT * 0.5), vn(q * 2.0 + 7.0 - rT * 0.4)); float tb = vn(q * 3.5 + w * 2.5 + vec2(rT * 0.3, -rT * 0.6)), tb2 = vn(q * 9.0 - w * 3.0 + rT);
      float h = clamp(0.3 + 0.55 * tb + 0.25 * tb2 + 0.35 * rNV * rNV + 0.2 * rG2, 0.0, 1.6); vec3 c = mix(cCr, cHot, smoothstep(0.2, 0.7, h)); c = mix(c, cWH, smoothstep(0.85, 1.4, h)) * (0.9 + 0.35 * rG);
      if (rF > 0.15) c = mix(cHot, cWH, 0.3 + 0.4 * tb2) * (1.0 + 0.4 * rG); aC = c; }
    else if (id == 606) { float nuc = step(0.15, rF) * step(rF, 0.25), shl = step(0.25, rF), tp = clamp(1.0 - ao, 0.0, 1.0), w1 = vn(L.xy * 7.0 + L.z * 3.0), w2 = vn(L.yz * 6.0 + L.x * 4.0);   // crystal: amber-ruby (Lux) / sapphire (Umbra): depth, a fake refraction, fractures, bright facet edges
      float k1 = abs(fract(dot(L, vec3(5.1, 3.3, 4.2)) + w1 * 1.6) - 0.5), k2 = abs(fract(dot(L, vec3(-3.7, 6.1, 2.4)) + w2 * 1.6) - 0.5), crack = smoothstep(0.035, 0.0, min(k1, k2)) * smoothstep(0.25, 0.5, vn(L.zx * 3.0 + L.y * 2.0));
      vec3 deep = mix(vec3(0.4, 0.03, 0.02), vec3(0.01, 0.045, 0.5), sd), mid = mix(vec3(1.3, 0.35, 0.06), vec3(0.04, 0.3, 1.15), sd), tipc = mix(vec3(1.7, 0.95, 0.4), vec3(0.3, 0.95, 1.5), sd);
      vec3 body = mix(mix(deep, mid, smoothstep(0.0, 0.55, tp + 0.25 * (w1 - 0.5))), tipc, smoothstep(0.45, 1.0, tp)) * (0.55 + 0.45 * (1.0 - rNV * rNV * 0.7));
      vec3 rf = refract(-uV, n, 0.72); float e2; float tr = env(normalize(n * (0.6 * (w2 - 0.5)) - rf), 0.25, e2); body += mid * tr * 0.35 + mix(vec3(0.9, 0.4, 0.1), vec3(0.15, 0.5, 0.95), sd) * e2 * 0.4;
      float wrap = max(0.0, rNL * 0.5 + 0.5); body *= 0.5 + 0.75 * wrap * wrap;
      float ec; float ev = env(rR, 0.05, ec); float Fq = 0.05 + 0.95 * pow(1.0 - rNV, 4.0), spec = pow(max(0.0, dot(n, normalize(uLK + uV))), 260.0) * 12.0 * max(0.0, rNL);
      vec3 c = body + (ev * Fq * 0.9 + spec) * mix(vec3(1.1, 0.95, 0.8), vec3(0.8, 0.92, 1.1), sd) + pow(1.0 - rNV, 3.0) * mix(vec3(0.9, 0.35, 0.1), vec3(0.1, 0.5, 0.9), sd) * 0.6 + crack * mix(vec3(1.4, 0.8, 0.4), vec3(0.5, 0.9, 1.3), sd) * (0.5 + rG);
      float eg = smoothstep(0.8, 1.0, edge); c = mix(c, mix(vec3(1.2, 0.95, 0.75), vec3(0.82, 0.95, 1.2), sd) * (0.6 + 0.6 * ev + 0.4 * wrap), eg * 0.8);
      c += (mix(vec3(0.3, 0.06, 0.0), vec3(0.0, 0.1, 0.32), sd) + tipc * 0.22 * tp) * (0.5 + rG) * (0.6 + 0.4 * w2);
      if (nuc > 0.5) c = c * 1.15 + tipc * (0.35 + 0.3 * sin(rT * 2.0 + tp * 6.0)) * (0.5 + 0.5 * rG) + cWH * 0.1 * rG2;
      if (shl > 0.5) { float a = clamp(0.16 + 0.6 * pow(1.0 - rNV, 1.6) + 0.3 * eg, 0.0, 0.9); c = vec3(tone(c.r), tone(c.g), tone(c.b)); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
      aC = c; }
    else if (id == 607) { float pan = step(0.15, rF), ac = edge, al = clamp(ao, 0.0, 1.0), eB = max(smoothstep(0.62, 0.97, ac), smoothstep(0.82, 1.0, al)); vec3 c;   // a feather-blade
      if (pan < 0.5) { c = rMet * (0.85 + 0.15 * vn(vec2(al * 30.0, ac * 4.0))); c *= 1.0 - 0.35 * smoothstep(0.04, 0.0, abs(fract(al * 7.0) - 0.5) - 0.44) * (1.0 - uLow); }
      else if (sd < 0.5) { float fl = vn(vec2(al * 9.0 - rT * 2.2, ac * 4.0 + uKind * 7.0)), fl2 = vn(vec2(al * 23.0 - rT * 3.5, ac * 9.0)), fil = smoothstep(0.55, 0.7, fl) * smoothstep(0.85, 0.7, fl);   // Lux: gold-ivory glowing molten toward its edge, flame filaments licking along it
        vec3 pl = mix(vec3(0.95, 0.85, 0.68), rM0, 0.5) * (0.1 + 0.7 * rDif) * rKEY * 0.7 + rEv * 0.3 + rMF * rEv * 0.4 * rFr + vec3(1.0, 0.9, 0.7) * pow(rSb, 40.0) * 1.2;
        float heat = clamp(0.8 + smoothstep(0.1, 0.9, ac) * (0.55 + 0.3 * fl) + 0.6 * eB + 0.35 * rG2 + 0.3 * rG, 0.0, 1.7);
        c = mix(pl, mix(mix(cCr, cHot, clamp(heat * 1.3 - 0.25, 0.0, 1.0)), vec3(1.9, 1.15, 0.45), clamp(heat - 1.0, 0.0, 0.7)) * (0.85 + 0.5 * rG), clamp(heat, 0.0, 1.0) * 0.9) + cWH * fil * (0.35 + 0.65 * eB) * 0.9 + cWH * smoothstep(0.88, 1.0, ac) * 0.8 * (0.7 + 0.3 * fl2); }
      else { float w1 = vn(vec2(al * 8.0, ac * 3.0)), k1 = abs(fract(al * 5.0 + ac * 2.0 + w1) - 0.5), crk = smoothstep(0.03, 0.0, k1) * step(0.4, w1);   // Umbra: sapphire crystal in a platinum frame: depth, fractures, frost, a blue-white edge
        vec3 rf = refract(-uV, n, 0.7); float e2; float tr = env(normalize(n * 0.3 - rf), 0.2, e2); float ec; float ev = env(rR, 0.05, ec);
        vec3 body = mix(vec3(0.02, 0.1, 0.55), vec3(0.15, 0.6, 1.4), smoothstep(0.1, 1.0, ac * 0.6 + al * 0.5)) * (0.45 + 0.5 * (1.0 - rNV)) + vec3(0.2, 0.55, 1.0) * tr * 0.35;
        c = body + vec3(0.8, 0.92, 1.1) * (ev * (0.05 + 0.9 * pow(1.0 - rNV, 4.0)) + pow(max(0.0, dot(n, normalize(uLK + uV))), 200.0) * 8.0) + crk * cIc * (0.6 + rG) + cIc * eB * 0.7 * (0.8 + 0.2 * sin(rT * 2.0 + al * 9.0));
        c = mix(c, vec3(0.85, 0.93, 1.05) * (0.5 + 0.5 * rDif), smoothstep(0.6, 0.95, vn(L.xy * 31.0 + L.z * 11.0) + 0.3 * (1.0 - ac)) * 0.25 * (1.0 - uLow)); }
      aC = c; }
    else if (id == 608) { float band = step(0.25, rF), an = atan(L.y, L.x), crd = an * 7.6394 + 24.0, cell = floor(crd), dd = fract(crd) - 0.5, ac = clamp((length(L.xy) - 0.74) / 0.06, -1.0, 1.0);   // a runed ring: fiery / cryogenic runes, a pulse running round
      float h = hs(vec2(cell, 9.0)), stem = smoothstep(0.1, 0.05, abs(dd - (h - 0.5) * 0.2)), brn = smoothstep(0.09, 0.035, abs(ac - dd * 1.4 * (h > 0.6 ? 1.0 : -1.0))) * step(abs(dd), 0.35), rune = max(stem, brn) * step(0.3, h), pl = pow(0.5 + 0.5 * sin(crd * 0.45 - rT * 3.0 + uKind * 1.7), 6.0);
      vec3 base = band > 0.5 ? mix(vec3(0.03, 0.02, 0.02), vec3(0.02, 0.03, 0.06), sd) * (0.3 + rDif) + rEv * rFr * 0.5 + vec3(1.0) * pow(rSb, 30.0) * 0.5 : rMet * 0.8;
      aC = base * (1.0 - rune * 0.5) + mix(rEl, mix(cWH, cIc, sd), pl) * rune * (0.35 + 0.4 * rG + 0.6 * pl); }
    else if (id == 609) { float zz = clamp(L.z, 0.0, 1.0), fl = 0.5 + 0.5 * sin(zz * 14.0 - rT * 6.0 + L.x * 3.0);   // light (see-through)
      vec3 col = uKind > 1.5 ? mix(mix(cHot, cWH, smoothstep(0.0, 0.5, zz)), cCy, smoothstep(0.5, 1.0, zz)) : mix(cHot, cCy, uKind), c = col * (0.6 + 0.6 * fl) * (0.6 + 0.5 * rG) + vec3(1.0) * pow(rNV, 4.0) * 0.6;
      c = vec3(tone(c.r), tone(c.g), tone(c.b)); float a = clamp((0.35 + 0.5 * rNV * rNV) * (0.6 + 0.4 * fl), 0.0, 1.0); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
    else if (id == 610) { vec3 wall = mix(vec3(0.2, 0.05, 0.02), vec3(0.02, 0.05, 0.14), sd), lit = sd < 0.5 ? mix(cCr, mix(cHot, cWH, clamp(rG2 - 0.5, 0.0, 1.0)), clamp(0.3 + rG2 + 0.3 * rG, 0.0, 1.0)) : mix(vec3(0.05, 0.3, 0.8), cIc, clamp(rG2, 0.0, 1.0));   // the throat: lit from inside
      aC = wall * (0.3 + 0.4 * rDif) + lit * (0.75 + 0.25 * vn(vec2(L.x * 8.0 - rT * 3.0, L.y * 6.0))) * (0.25 + 0.8 * rG2 + 0.25 * rG) * (0.5 + 0.5 * rNV); }
    else if (id == 611) { float tip = 1.0 - clamp(ao, 0.0, 1.0);   // a fang (ivory, white-hot tips when charging / long crystal), a claw (polished metal)
      if (rF > 0.25) { if (sd < 0.5) { float fl = vn(vec2(tip * 6.0 - rT * 2.5, edge * 3.0 + L.x * 4.0)); aC = mix(rMet, mix(cHot, cWH, smoothstep(0.55, 1.0, tip)) * (0.9 + 0.4 * fl + 0.3 * rG + 0.3 * rG2), smoothstep(0.05, 0.5, tip + 0.15 * fl)); }   // a spike's tip: molten orange to white-hot (Lux) / sapphire crystal (Umbra)
        else { vec3 sa = mix(vec3(0.03, 0.18, 0.75), vec3(0.45, 0.85, 1.5), tip) * (0.45 + 0.55 * (1.0 - rNV)) + cIc * pow(1.0 - rNV, 3.0) * 0.6 + vec3(1.0) * pow(rSb, 140.0) * 2.5 + cIc * smoothstep(0.8, 1.0, edge) * 0.5; aC = mix(rMet, sa, smoothstep(0.02, 0.35, tip)); } }
      else if (rF > 0.15) aC = rMet * 1.05 + rEl * tip * tip * 0.15 * rG;
      else if (sd < 0.5) { vec3 alb = vec3(0.96, 0.92, 0.84); aC = alb * (0.25 + 0.75 * rDif) * rKEY * 0.75 + alb * rAmb + vec3(1.0) * pow(rSb, 50.0) * 1.2 + rEv * rFr * 0.5 + mix(cHot, cWH, tip) * tip * tip * rG2 * 0.9; }
      else aC = mix(vec3(0.55, 0.75, 1.0), vec3(0.9, 0.98, 1.1), tip) * (0.35 + 0.6 * rDif) + cIc * pow(1.0 - rNV, 2.0) * 0.5 + vec3(1.0) * pow(rSb, 120.0) * 2.0 + cCy * rG2 * 0.4 * tip; }
    else aC = mix(rEl, mix(cWH, cIc, sd), 0.35 + 0.3 * rNV) * (0.8 + 0.5 * rG);   // 612 a mote
    if (id <= 602) { if (rG2 > 0.01 && sd < 0.5) { float ck = abs(vn(L.xy * 4.1 + L.z * 2.7 + 3.0) - 0.5) + abs(vn(L.yz * 7.3 + 1.0) - 0.5) * 0.5, crk = smoothstep(0.05 + 0.04 * rG2, 0.0, ck) * (1.0 - sd);   // (Lux charging: its seams white-hot)
        aC += mix(cCr, mix(cHot, cWH, clamp(rG2 - 0.6, 0.0, 1.0)), crk) * crk * rG2 * 1.2 + cHot * rG2 * 0.12 * pow(1.0 - rNV, 2.0) * (1.0 - sd); }
      float fz = sd * clamp(0.16 + 0.6 * rG2, 0.0, 1.0) * smoothstep(0.45, 0.95, edge * 0.45 + max(0.0, dot(n, uUP)) * 0.4 + vn(L.xy * 23.0 + L.z * 13.0) * 0.6) * (1.0 - uLow * 0.5);   // (frost on Umbra: on its edges and up-facing surfaces, creeping as it charges)
      if (fz > 0.0) aC = mix(aC, vec3(0.78, 0.9, 1.05) * (0.45 + 0.6 * rDif + 0.3 * rHm) + cIc * pow(rSb, 30.0) * 0.6, fz * 0.85); }
    aC += rEl * smoothstep(1.2, 3.0, rG) * 0.8 + mix(cHot, cCy, sd) * rDE * 2.0 + mix(cWH, cIc, sd) * rDE * rDE * 1.2;   // (materialising; the dissolve's burning / crystalline edge)
    gl_FragColor = vec4(vec3(tone(aC.r), tone(aC.g), tone(aC.b)) * uAlpha, uAlpha); return; }
  /*</RZ-MAT>*/
  /*<AS-MAT ids 440..469 (v436 AS: 02f6-asmodeus-model.js, Asmodeus the Fester)>*/
  else if (id >= 440 && id <= 469) {   // ---- (v436 AS) Asmodeus (02f6): 440 obsidian lacquer (440.2 a recess; 440.3 engraved: gold filigree inlaid; vA.y 1 a rim: gold trim), 441 dark titanium, 442 antique gold (442.2 engraved), 443 a venom channel (vA.z along the part, uKind the part's place along its chain, uWear the venom's front along it, uGlow2 the flow; 443.3 a lit slot), 444 ivory porcelain (crimson channels under the glaze by uGlow2), 445 an eye, 446 ruby venom crystal (vA.z 1 - the place along a shard; 446.3 a see-through faceted shell, 446.6 the heart: hotter; uGlow2 white-hot crimson), 447 venom fluid (see-through), 448 a runed ring (448.3 its dark band; uKind its phase), 449 scarlet cloth (449.3 its back; vA.y 1 the gold border), 450 a ring of crimson-violet light (see-through), 451 dark crystal (the cocoon: uGlow2 its cracks), 453 a mote. uFx 0..0.5 crimson cracks through the armour (Eclipse Molt), uFx > 0.75 the whole part a spectral crystal replica (the decoy shells); uSpill the dissolve into black-crimson crystal grains. Approximates PBR with the scene's analytic environment: a violet night, a crimson horizon, a dark ground
    float aF = vA.x - float(id), aG = clamp(uGlow, 0.0, 4.0), aG2 = clamp(uGlow2, 0.0, 4.0), aT = uTime, aDE = 0.0;
    if (uSpill > 0.0) { float aDn = vn(L.xy * 9.0 + L.z * 5.3) * 0.55 + vn(L.yz * 21.0 + L.x * 7.0) * 0.3 + vn(L.xz * 43.0 + 3.0) * 0.15, aTh = uSpill * 1.15 - 0.08; if (aDn < aTh) discard; aDE = smoothstep(aTh + 0.08, aTh, aDn); }
    float aNV = max(0.001, dot(n, uV)), aNL = dot(n, uLK), aDif = max(aNL, 0.0), aFr = pow(1.0 - aNV, 5.0), aHm = 0.5 + 0.5 * dot(n, uUP);
    vec3 aR = 2.0 * aNV * n - uV; float aUp = dot(aR, uUP), aSb = max(dot(aR, uLK), 0.0), aHz = aUp - 0.06;
    vec3 aEv = aUp > 0.0 ? mix(vec3(0.1, 0.06, 0.13), vec3(0.42, 0.32, 0.5), pow(clamp(aUp, 0.0, 1.0), 1.2)) : mix(vec3(0.22, 0.04, 0.08), vec3(0.03, 0.015, 0.025), clamp(-aUp * 2.5, 0.0, 1.0));
    aEv += vec3(1.0, 0.28, 0.36) * exp(-aHz * aHz / 0.005) * 0.5;   // (a crimson horizon in its reflections)
    vec3 aKEY = vec3(1.5, 1.38, 1.32), aAmb = mix(vec3(0.08, 0.05, 0.08), vec3(0.32, 0.28, 0.34), aHm) * uAmb, aRim = pow(1.0 - aNV, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim;
    vec3 aCR = vec3(0.85, 0.03, 0.09), aRU = vec3(1.25, 0.1, 0.22), aPK = vec3(1.6, 0.55, 0.68), aVI = vec3(0.45, 0.08, 0.66), aWH = vec3(1.7, 1.3, 1.35);
    if (uFx > 0.75) {   // the spectral replica: see-through ruby glass, a bright fresnel, its armour lines traced, crimson cracks spreading as it nears its end (uFx - 1)
      float ck = abs(vn(L.xy * 2.7 + L.z * 1.9 + 3.0) - 0.5) + abs(vn(L.yz * 5.0 + 1.0) - 0.5) * 0.5, crk = smoothstep(0.06, 0.0, ck) * clamp(uFx - 0.9, 0.0, 1.5), fr = pow(1.0 - aNV, 2.0);
      vec3 c = aRU * 0.2 + aPK * fr * 0.9 + aVI * 0.3 * (1.0 - fr) + vec3(1.0, 0.85, 0.95) * pow(aSb, 90.0) * 2.0 + aRU * crk * 2.2 + aPK * smoothstep(0.85, 1.0, edge) * 0.45;
      c = vec3(tone(c.r), tone(c.g), tone(c.b)); float a = clamp(0.14 + 0.6 * fr + crk * 0.6 + 0.2 * smoothstep(0.85, 1.0, edge), 0.0, 0.9); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
    float aCk = uFx > 0.0 && uFx < 0.75 ? uFx * 2.0 : 0.0;
    vec3 aG0 = vec3(0.92, 0.64, 0.32), aGF = aG0 + (1.0 - aG0) * aFr;   // (antique gold: a warm tinted reflection, a broad sheen and a sharp glint)
    vec3 aGold = vec3(0.0);   // (v446 AL: the gold worked out only for the materials that show it: 440, 442, 444, 448, 449; the same values)
    if (id == 440 || id == 442 || id == 444 || id == 448 || id == 449) aGold = (aG0 * (0.12 + 0.6 * aDif) * aKEY * 0.5 + aGF * mix(aEv, vec3(dot(aEv, vec3(0.33))) * vec3(1.0, 0.78, 0.5), 0.45) * 1.3 + vec3(1.0, 0.9, 0.72) * (pow(aSb, 70.0) * 2.4 + pow(aSb, 9.0) * 0.28) + aRim * 0.35) * 1.2;
    vec3 aC = vec3(0.0);
    if (id == 440) { float rec = step(0.15, aF) * step(aF, 0.25), eng = step(0.25, aF);   // obsidian lacquer: near-black, a deep clear coat, a dark violet fresnel, gold filigree inlaid, gold rims
      vec3 T0 = vec3(0.022, 0.017, 0.026) * (rec > 0.5 ? 0.45 : 1.0), TF = T0 + (vec3(0.5, 0.44, 0.56) - T0) * aFr; float rg = 0.1 + 0.07 * vn(L.xy * 6.0 + L.z * 3.0);
      aC = T0 * (0.2 + 0.8 * aDif) * aKEY + TF * aEv * 1.15 + vec3(1.0, 0.92, 0.95) * pow(aSb, 2.0 / (rg * rg)) * 1.2 + aRim * 0.5 + vec3(0.5, 0.06, 0.4) * pow(1.0 - aNV, 2.6) * 0.16 * (1.0 - rec);
      if (eng > 0.5 && uLow < 0.5) { vec2 q = vec2(L.x * 2.6 + L.y * 2.0, L.z * 2.8); float w1 = vn(q * 1.3), s1 = abs(fract(q.x + 0.35 * sin(q.y * 3.1 + w1 * 2.0)) - 0.5), s2 = abs(length(fract(q + vec2(0.5 * w1, 0.0)) - 0.5) - 0.3);
        float fil = max(smoothstep(0.03, 0.01, s1) * step(0.35, w1), smoothstep(0.026, 0.008, s2) * step(0.5, w1)); aC = mix(aC, aGold * 0.85, fil * 0.8); }
      if (aCk > 0.0) { float ck = abs(vn(L.xy * 3.1 + L.z * 2.3 + 7.0) - 0.5) + abs(vn(L.yz * 6.3 + 2.0) - 0.5) * 0.5, crk = smoothstep(0.07, 0.015, ck) * clamp(aCk, 0.0, 1.0); aC = aC * (1.0 - crk * 0.6) + mix(aRU, aPK, 0.3) * crk * 1.8 + aCR * smoothstep(0.2, 0.03, ck) * aCk * 0.3; }
      aC = mix(aC, aGold, smoothstep(0.8, 0.95, edge) * (1.0 - rec)); }
    else if (id == 441) { float br = vn(vec2(L.x * 40.0 + L.y * 40.0, L.z * 2.0)), rg = 0.28 + 0.1 * br;   // dark titanium: brushed gunmetal, a cool sheen
      vec3 T0 = vec3(0.15, 0.14, 0.17) * (0.85 + 0.25 * br), TF = T0 + (1.0 - T0) * aFr * 0.5;
      aC = T0 * (0.15 + 0.75 * aDif) * aKEY * 0.6 + TF * aEv * 0.9 + vec3(0.9, 0.9, 1.0) * pow(aSb, 2.0 / (rg * rg)) * 0.8 + aRim * 0.4 + vec3(0.5, 0.46, 0.5) * smoothstep(0.7, 1.0, edge) * 0.25; }
    else if (id == 442) { float eg = step(0.15, aF), ln = (1.0 - uLow) * eg * smoothstep(0.06, 0.02, abs(fract(L.x * 7.0 + L.z * 4.0 + 0.5 * sin(L.y * 9.0)) - 0.5)); aC = aGold * (1.0 - ln * 0.55) + aCR * ln * aG * 0.3; }
    else if (id == 443) { float slot = step(0.25, aF), s = ao + uKind, fill = smoothstep(uWear + 0.6, uWear - 0.2, s);   // venom: thick, viscous pulses rolling along the channel toward the blade, blobs in it, a glassy cover
      float pul = pow(0.5 + 0.5 * sin(s * 3.2 - aT * (2.0 + 2.5 * aG2)), 4.0), blob = pow(vn(vec2(s * 2.5 - aT * (1.2 + aG2), edge * 2.0)), 2.0);
      float hk = clamp(0.2 + 0.25 * aG2 + 0.55 * pul * fill + 0.35 * blob * fill, 0.0, 2.0) * (0.3 + 0.7 * fill);
      vec3 c = mix(vec3(0.16, 0.0, 0.03), aRU, clamp(hk, 0.0, 1.0)) + aPK * max(0.0, hk - 1.0) * 0.8;
      c *= 0.55 + 0.6 * smoothstep(0.0, 0.45, edge) * smoothstep(1.0, 0.55, edge) + 0.25; c += vec3(1.0, 0.8, 0.85) * pow(aSb, 40.0) * 0.6 + aEv * aFr * 0.4;
      if (slot > 0.5) c = aRU * (0.55 + 0.5 * aG2 * fill) * (0.85 + 0.15 * sin(aT * 6.0 + L.z * 9.0)); aC = c; }
    else if (id == 444) { vec3 alb = vec3(0.95, 0.9, 0.82);   // ivory porcelain: a warm glaze, a soft sheen, faint crimson channels under it
      vec3 c = alb * (0.62 + aDif * 0.6 + aHm * 0.12) * vec3(1.0, 0.97, 0.94) + vec3(0.9, 0.35, 0.35) * (1.0 - aDif) * 0.04 + vec3(1.0, 0.96, 0.92) * pow(aSb, 90.0) * 1.6 + aEv * aFr * 0.5 + aRim * 0.25;
      float vein = smoothstep(0.035, 0.0, abs(vn(L.yz * 8.0 + 2.0) - 0.5)) * (1.0 - uLow);
      c += aCR * vein * (0.1 + 0.2 * aG2 * (0.6 + 0.4 * sin(aT * 2.0 + L.z * 6.0))); aC = mix(c, aGold, smoothstep(0.85, 1.0, edge) * 0.75); }
    else if (id == 445) aC = mix(aRU, aWH, clamp(0.12 + 0.22 * aG2, 0.0, 0.6)) * (0.9 + 0.55 * aG2) * (0.92 + 0.08 * sin(aT * 9.0));
    else if (id == 446) { float sh = step(0.2, aF) * step(aF, 0.45), hrt = step(0.45, aF), tip = 1.0 - clamp(ao, 0.0, 1.0);   // ruby venom crystal: dark interior facets, light caught at the rims, two layers seen through it (a fake refraction), liquid flowing inside, violet filaments, bright edges, glints
      vec3 rf = refract(-uV, n, 0.66), p1 = L * 3.0 + rf * 0.6, p2 = L * 5.5 + rf * 1.4;
      float f1 = vn(p1.xy + p1.z * 0.7 + vec2(0.0, -aT * 0.35)), f2 = vn(p2.yz * 1.3 + p2.x + vec2(aT * 0.25, 0.0)), flw = pow(0.5 + 0.5 * sin((tip + f1 * 0.3) * 14.0 - aT * 2.2), 3.0), dep = clamp(0.3 + 0.7 * aNV, 0.0, 1.0);
      vec3 body = mix(vec3(0.09, 0.0, 0.025), aCR * 0.9, f1 * 0.6 + 0.2), c = mix(aRU * (0.75 + 0.5 * f2), body, dep * 0.85);
      c += aCR * flw * (0.25 + 0.35 * aG) * (0.5 + 0.5 * f2) + aVI * smoothstep(0.62, 0.8, f2) * 0.35 + aPK * pow(1.0 - aNV, 3.0) * 0.6 + aPK * smoothstep(0.86, 1.0, edge) * (0.22 + 0.3 * aG);
      c += vec3(1.0, 0.85, 0.9) * pow(aSb, 160.0) * 3.0 + aEv * aFr * 0.6 + aRU * tip * tip * (0.15 + 0.45 * aG); c *= 0.75 + 0.35 * min(aG, 2.0);
      if (aG2 > 0.0) c += mix(aRU, aWH, clamp(aG2 * 0.3, 0.0, 0.8)) * aG2 * (0.15 + 0.3 * (1.0 - dep));
      if (hrt > 0.5) c = c * 1.25 + aRU * (0.25 + 0.2 * sin(aT * 3.0)) * (1.0 - dep);
      if (aF > 0.05 && aF < 0.2) { float fac = floor((NL.y + 1.0) * 2.5 + L.z * 6.0), fv = hs(vec2(fac, 3.0)); c = c * (0.55 + 0.35 * fv) + aRU * (0.35 + 0.25 * fv) * (0.6 + 0.4 * sin(tip * 9.0 - aT * 2.5)) + aCR * 0.25 + mix(aPK, aWH, 0.45) * smoothstep(0.6, 0.95, edge) * 1.1 + aPK * pow(1.0 - aNV, 2.0) * 0.5; }
      if (sh > 0.5) { float a = clamp(0.26 + 0.55 * pow(1.0 - aNV, 1.6) + 0.35 * smoothstep(0.8, 1.0, edge), 0.0, 0.92); c = vec3(tone(c.r), tone(c.g), tone(c.b)); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
      aC = c; }
    else if (id == 447) { vec3 lp = normalize(L); float an = atan(lp.y, lp.x), la = asin(clamp(lp.z, -1.0, 1.0));   // venom fluid: thick, swirling, domain-warped, violet filaments, a wet sheen (see-through)
      vec2 q = vec2(an * 2.0 + aT * 0.5, la * 2.5 - aT * 0.2), w = vec2(vn(q * 1.7 + aT * 0.3), vn(q * 1.7 + 5.0 - aT * 0.25)); float sw = vn(q * 2.4 + w * 2.2), sw2 = vn(q * 5.0 - w * 1.5 + 3.0), fr = pow(1.0 - aNV, 1.6);
      vec3 c = mix(vec3(0.3, 0.0, 0.05), aRU, smoothstep(0.3, 0.75, sw)) * (0.85 + 0.15 * aG2) + aPK * smoothstep(0.7, 0.85, sw2) * 0.5 + aVI * smoothstep(0.55, 0.62, sw) * smoothstep(0.7, 0.62, sw) * 0.8 + aPK * fr * 0.6 + vec3(1.0, 0.8, 0.85) * pow(aSb, 50.0) * 1.2;
      c = vec3(tone(c.r), tone(c.g), tone(c.b)); float a = clamp(0.32 + 0.35 * sw + 0.35 * fr, 0.0, 0.85); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
    else if (id == 448) { float band = step(0.25, aF), an = atan(L.y, L.x), crd = an * 7.6394 + 24.0, cell = floor(crd), dd = fract(crd) - 0.5, ac = NL.z;   // a runed ring: gold (or a dark band) with crimson runes, a pulse running round
      float h = hs(vec2(cell, 9.0 + uKind)), stem = smoothstep(0.1, 0.05, abs(dd - (h - 0.5) * 0.2)), brn = smoothstep(0.09, 0.035, abs(ac - dd * 1.4 * (h > 0.6 ? 1.0 : -1.0))) * step(abs(dd), 0.35), rune = max(stem, brn) * step(0.3, h), pl = pow(0.5 + 0.5 * sin(crd * 0.45 - aT * 3.0 + uKind * 1.7), 6.0);
      vec3 base = band > 0.5 ? vec3(0.03, 0.02, 0.03) * (0.3 + aDif) + aEv * aFr * 0.5 + vec3(1.0) * pow(aSb, 30.0) * 0.5 : aGold * 0.75;
      aC = base * (1.0 - rune * 0.5) + mix(aCR, aPK, pl) * rune * (0.3 + 0.4 * aG + 0.9 * pl * (0.3 + aG2)); }
    else if (id == 449) { float bk = step(0.25, aF); vec3 alb = vec3(0.36, 0.012, 0.045) * (bk > 0.5 ? 0.6 : 1.0);   // scarlet cloth: velvet (a bright grazing sheen), a faint damask, folds lit by a wrapped key, a gold border
      float dam = vn(L.xy * 6.0 + L.z * 2.0) * 0.5 + vn(L.yz * 13.0) * 0.5, pat = smoothstep(0.55, 0.6, dam) * (1.0 - uLow), wrap = clamp((aNL + 0.4) / 1.4, 0.0, 1.0), vel = pow(1.0 - aNV, 2.2);
      vec3 c = alb * (1.0 - pat * 0.25) * (wrap * aKEY * 0.85 + aAmb * 0.9) + vec3(0.95, 0.2, 0.32) * vel * 0.35 * (0.4 + wrap) + aRim * 0.25 + aVI * pow(1.0 - aNV, 4.0) * 0.12;
      aC = mix(c, aGold * 0.85, smoothstep(0.8, 0.95, edge) * (1.0 - bk * 0.3)); }
    else if (id == 450) { float an = atan(L.y, L.x), pl = pow(0.5 + 0.5 * sin(an * 4.0 - aT * 2.5 + uKind * 1.9), 5.0);   // a ring of crimson-violet light (see-through)
      vec3 c = mix(aCR, aVI * 1.5, 0.35 + 0.3 * sin(an * 2.0 + aT)) * (0.55 + 0.5 * aG) + aPK * pl * 0.8; c = vec3(tone(c.r), tone(c.g), tone(c.b));
      float a = clamp(max(c.r, max(c.g, c.b)) * (0.5 + 0.5 * aNV), 0.0, 1.0); gl_FragColor = vec4(c * a * uAlpha, a * uAlpha); return; }
    else if (id == 451) { float ck = abs(vn(L.xy * 3.3 + L.z * 2.1 + 5.0) - 0.5) + abs(vn(L.yz * 6.0 + L.x * 3.0) - 0.5) * 0.5, crk = smoothstep(0.06 + 0.04 * aG2, 0.0, ck) * clamp(aG2, 0.0, 1.5);   // dark crystal (the cocoon): a black-violet glass, crimson light in its cracks
      aC = vec3(0.04, 0.012, 0.03) * (0.3 + aDif) + aEv * aFr * 0.9 + vec3(1.0, 0.85, 0.95) * pow(aSb, 120.0) * 2.0 + aVI * pow(1.0 - aNV, 2.0) * 0.4 + aRU * crk * 1.6 + aCR * smoothstep(0.85, 1.0, edge) * 0.25; }
    else aC = mix(aRU, aPK, clamp(0.3 + 0.3 * aG, 0.0, 1.0)) * (0.8 + 0.4 * aNV) * (0.8 + 0.3 * aG);   // 453 a mote
    aC += aRU * aDE * 2.0 + aPK * aDE * aDE * 1.2;   // (the dissolve's burning crimson edge: it breaks into grains)
    gl_FragColor = vec4(vec3(tone(aC.r), tone(aC.g), tone(aC.b)) * uAlpha, uAlpha); return; }
  /*</AS-MAT>*/
  /*<TM-MAT ids 505..509 (v451 TM, remade v454 TM2: 20k9l-thunder-tiamat-model.js, Tiamat the serpentine lightning dragon)>*/
  else if (id >= 505 && id <= 509) {   // ---- (v451 TM, v454 TM2) Tiamat (20k9l): the materials as below. uSpill the formation's front (under 1.45 still forming: what is beyond it not there yet, a white edge where it appears), uKind the charge's front along q (tail 0 .. jaws 1), uFx the break-up into arcs (0..1), uGlow its brightness, uGlow2 a white flash
    // (v454 TM2: remade for the user's concept, cel-shaded: 505 the scaled body (vA.y q: 1 the head .. 0 the tail; vA.z round it: 0 the spine .. 0.5 the belly): deep violet-blue overlapping scales, a pale plated belly, magenta veins of light down the flanks with dotted rows above them; 506 a spike, ray, claw or crest spine (its fraction 0.4 q; vA.y along it, root 0 .. tip 1): ice-white, violet at the root; 507 an icy fin membrane and 509 the dark sail (fraction 0.4 q; vA.y root 0 .. free edge 1; vA.z across in rays, a ray at each whole number): translucent, violet edges, glowing magenta dots strung along the rays, the sail's rows of dots; 508 an eye (508.2 the mouth's glow, 508.4 a fang). The charge (uKind) brightens the veins and dots from the tail to the jaws)
    float tV = vA.x - float(id), tT = uTime, tNV = max(0.0, dot(n, uV)), tQ, tOrd; vec2 tP;
    if (id == 505) { tQ = edge; tOrd = abs(edge - 0.68) * 1.4; tP = vec2(edge * 110.0, ao * 22.0); }
    else if (id == 508) { tQ = 1.0; tOrd = 0.45; tP = vec2(ao * 9.0, edge * 5.0); }
    else { tQ = clamp(tV / 0.4, 0.0, 1.0); tOrd = (id == 506 ? 0.25 : 0.38) + abs(tQ - 0.68) * 1.1 + edge * 0.3; tP = vec2(edge * 6.0 + tQ * 20.0, ao * 2.0); }
    vec3 tW = vec3(1.0, 0.98, 1.0), tMag = vec3(1.0, 0.3, 0.92), tVio = vec3(0.58, 0.32, 1.0); float tDE = 0.0;
    if (uSpill < 1.45) { float th = tOrd + vn(tP * 0.5 + 2.3) * 0.22; if (th > uSpill) discard; tDE = smoothstep(uSpill - 0.14, uSpill, th); }   // (forming: the parts appear in order, white where they arrive)
    if (uFx > 0.0) { float nz = vn(tP * 0.9 + 5.1) * 0.6 + vn(tP * 2.6 + 1.7) * 0.4, th2 = uFx * 1.25 - 0.12; if (nz < th2) discard; tDE = max(tDE, smoothstep(th2 + 0.14, th2, nz)); }   // (breaking up: holes eaten by a noise front, edged white)
    float tBq = (tQ - uKind) / 0.06, tBand = uKind > 0.001 && uKind < 1.2 ? exp(-tBq * tBq) : 0.0, tDone = uKind > 0.001 ? smoothstep(uKind + 0.03, uKind - 0.12, tQ) : 0.0, tGl = 0.75 + 0.25 * uGlow + 0.6 * tDone + 1.2 * tBand;   // (the charge: the veins and dots brighter behind its front, a flare at it)
    float tLit = 0.0; vec3 c, em = vec3(0.0); float tA = 1.0;
    if (id == 505) { float bel = smoothstep(0.34, 0.4, ao) * (1.0 - smoothstep(0.6, 0.66, ao)), aw = abs(ao - 0.5);
      vec2 g = vec2(tP.x, tP.y + mod(floor(tP.x), 2.0) * 0.5), gi = floor(g), gf = fract(g) - vec2(0.62, 0.5); float sc = smoothstep(0.3, 0.52, length(gf * vec2(1.0, 1.15)) + 0.1 * hs(gi));   // (overlapping round scales: their rims)
      float scu = smoothstep(0.4, 0.5, abs(fract(edge * 90.0) - 0.5));   // (the belly's plates)
      vec3 back = cel3(vec3(0.09, 0.07, 0.24), vec3(0.24, 0.21, 0.54), vec3(0.47, 0.46, 0.86), n, tLit) * (1.0 - 0.3 * sc) + vec3(0.12, 0.1, 0.25) * (1.0 - sc) * 0.25, belly = cel3(vec3(0.36, 0.33, 0.56), vec3(0.64, 0.62, 0.84), vec3(0.88, 0.87, 0.99), n, tLit) * (1.0 - 0.3 * scu);
      c = mix(back, belly, bel);
      float vq = (aw - 0.16) / 0.026, vein = exp(-vq * vq) + 0.35 * exp(-vq * vq * 0.12) * (1.0 - 0.4 * hs(vec2(floor(edge * 40.0), 3.0)));
      float dts = step(0.5, hs(vec2(floor(edge * 150.0), floor(aw * 30.0)))) * smoothstep(0.35, 0.05, length(vec2(fract(edge * 150.0) - 0.5, (fract(aw * 30.0) - 0.5) * 0.6))) * step(0.18, aw) * step(aw, 0.33);
      em = tMag * (vein * 1.3 + dts * 0.7) * tGl; }   // (v454 TM3: stronger veins, a soft glow round them)
    else if (id == 506) { float al = clamp(edge, 0.0, 1.0); c = cel3(vec3(0.3, 0.22, 0.6), vec3(0.62, 0.62, 0.9), vec3(0.92, 0.95, 1.0), n, tLit); c = mix(c * vec3(0.7, 0.55, 1.0), c, smoothstep(0.0, 0.4, al)) + vec3(0.6, 0.75, 1.0) * al * al * al * 0.25; em = tVio * smoothstep(0.3, 0.0, al) * 0.15 * tGl; }
    else if (id == 508) { if (tV > 0.3) c = cel3(vec3(0.6, 0.6, 0.75), vec3(0.88, 0.88, 0.95), vec3(1.0), n, tLit);
      else if (tV > 0.1) { c = vec3(0.35, 0.05, 0.3); em = tMag * (0.55 + 0.5 * tDone + tBand) + tW * 0.4 * tDone; }
      else { c = vec3(0.4, 0.3, 0.7); em = mix(tVio, tW, 0.55 + 0.45 * tNV) * (0.7 + 0.4 * tGl); } }
    else { float u = clamp(edge, 0.0, 1.0), r = ao, rf = abs(fract(r + 0.5) - 0.5), rq = rf / 0.06, ray = exp(-rq * rq), dk = id == 509 ? 1.0 : 0.0;
      float dot1 = smoothstep(0.38, 0.12, length(vec2(fract(u * 13.0 + floor(r + 0.5) * 0.37) - 0.5, rf * 3.2))) * step(0.12, u) * step(u, 0.93);   // (dots strung along each ray)
      float dot2 = dk * smoothstep(0.3, 0.1, length(vec2(fract(u * 11.0) - 0.5, (fract(r * 3.0) - 0.5) * 0.9))) * step(0.1, u) * step(u, 0.85);   // (the sail's rows of dots)
      float edg = smoothstep(0.72, 1.0, u), cur = vn(vec2(u * 4.0 - tT * 1.6, r * 1.3 + tT * 0.3));
      vec3 ice = mix(vec3(0.78, 0.88, 1.0), vec3(0.46, 0.6, 0.97), 0.45 * u + 0.25 * cur), drk = mix(vec3(0.16, 0.1, 0.4), vec3(0.32, 0.2, 0.62), cur * 0.6 + 0.3 * (1.0 - u));
      c = mix(ice, drk, dk); c = mix(c, mix(vec3(0.62, 0.42, 1.0), vec3(0.88, 0.95, 1.0), dk), edg * (0.6 + 0.3 * dk)) + vec3(0.95, 0.97, 1.0) * ray * (0.16 - 0.06 * dk);   // (violet edges on the icy fins, the sail's edge icy white; bright rays)
      c *= 0.78 + 0.3 * smoothstep(-0.3, 0.6, abs(dot(n, uLK)));
      em = tMag * (dot1 * (0.65 - 0.3 * dk) + dot2 * 0.8) * tGl + (1.0 - dk) * (vec3(0.25, 0.36, 0.75) * (0.16 + 0.16 * cur) + vec3(0.45, 0.3, 0.9) * edg * 0.22) + tMag * (edg * 0.3 + ray * u * 0.22) * tGl * (1.0 - 0.5 * dk);   // (the icy fins glow a little of their own; v454 TM3: lit magenta edges and rays)
      tA = clamp(mix(0.3 + 0.22 * u, 0.82, dk) + 0.22 * ray + 0.15 * edg + 0.4 * tDE, 0.0, 0.88); }
    if (id != 507 && id != 509) { c += celRim(n) * 1.4 + vec3(0.45, 0.4, 1.0) * smoothstep(0.55, 0.9, 1.0 - tNV) * 0.28 + vec3(1.0) * celSpec(n, 0.965) * 0.25; }
    c += em; c += tW * (tBand * 0.25 + tDE * 1.1); c = mix(c, tW, clamp(uGlow2, 0.0, 1.0));
    tA *= uAlpha; gl_FragColor = vec4(min(c, vec3(1.0)) * tA + (id == 507 || id == 509 ? min(em, vec3(1.0)) * (1.0 - tA) : vec3(0.0)), tA); return; }   // (a membrane: its dots glow through it)
  /*</TM-MAT>*/
  /*<OD-DRILL-MAT ids 150..151 (v416 OD: 20k2iz-earth-drill-gpu.js)>*/
  else if (id >= 150 && id <= 151) {   // ---- (v416 OD) the Obsidian Drill (20k2iz), z its axis in its own frame: 150 black volcanic glass (150.2 its core, 150.4 its tip; vA.y 1 on a bevel or a facet's rim, vA.z the occlusion), 151 gold crystal (151.0 the inlay along a flight's rim: vA.z its length along the helix; 151.3 a joint's crystal). uGlow the gold's light, uWear world units a model unit (its height over the floor from vW.z), uTime.
    // Glass: a near-black body with a grey-violet lit flank; a cool sky above, a bright horizon strip and the floor's warm light below in its reflections; a fresnel rim; sharp glints with a faint rainbow sheen; conchoidal facets (a cell net round the axis, each cell tilting the normal its own way, rippled from its seed) that turn with it; bright bevels
    float fr = vA.x - float(id), gw = clamp(uGlow, 0.0, 1.5), zm = vW.z / max(uWear, 1e-4), ang = atan(L.y, L.x), rr = length(L.xy), ridge = 1.0, hx = 0.5;
    vec3 nl = NL;
    if (uLow < 0.5) { vec2 cp = vec2(ang * 2.5464791, L.z * 3.4 + rr * 1.7), ci = floor(cp), cf = cp - ci, bc = vec2(0.0), bo = vec2(0.0); float d1 = 9.0, d2 = 9.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(float(i), float(j)), cc = ci + g; cc.x = mod(cc.x, 16.0); vec2 dd = g + vec2(hs(cc), hs(cc + 17.3)) * 0.8 + 0.1 - cf; float d = dot(dd, dd); if (d < d1) { d2 = d1; d1 = d; bc = cc; bo = dd; } else if (d < d2) d2 = d; }
      float rl = sqrt(d1); ridge = sqrt(d2) - rl; hx = hs(bc + 3.1); vec3 Tf = vec3(-sin(ang), cos(ang), 0.0);
      nl = normalize(nl + (vec3(hx, hs(bc + 7.7), hs(bc + 11.9)) - 0.5) * (id == 151 ? 0.55 : 0.32) - (Tf * bo.x + vec3(0.0, 0.0, bo.y)) / max(rl, 1e-3) * sin(rl * 26.0) * 0.045); }
    { vec3 n2 = normalize(uM0 * nl.x + uM1 * nl.y + uM2 * nl.z); if (dot(n2, uV) < -0.02) n2 = -n2; n = n2; }
    float ndv = max(0.001, dot(n, uV)), ndl = dot(n, uLK), dif = max(ndl, 0.0), wrap = clamp(ndl * 0.5 + 0.5, 0.0, 1.0);
    vec3 R = 2.0 * ndv * n - uV; float up = dot(R, uUP), sb = max(dot(R, uLK), 0.0), sr = max(dot(R, uLR), 0.0), hz = up - 0.07;
    vec3 sky = mix(vec3(0.095, 0.09, 0.14), vec3(0.76, 0.74, 0.88), pow(smoothstep(0.0, 1.0, up), 1.4)) /* v417 POL: a warmer sky (was 0.09 0.095 0.16 / 0.7 0.74 0.98) */, flo = mix(vec3(0.95, 0.45, 0.1) * (0.4 + 0.6 * gw), vec3(0.1, 0.06, 0.045), smoothstep(-0.04, -0.6, up));
    vec3 ev = (up > 0.0 ? sky : flo) + vec3(0.95, 0.9, 1.0) * exp(-hz * hz / 0.0022) * 0.55, c;
    if (id == 151) { float jt = step(0.15, fr); vec3 G0 = vec3(1.0, 0.66, 0.2), Fg = G0 + (1.0 - G0) * pow(1.0 - ndv, 5.0);   // (v417 POL: a richer gold, its reflections tinted warm, a brighter inner light)
      c = G0 * (0.22 + 0.9 * dif) * vec3(1.0, 0.9, 0.65) + Fg * mix(ev, vec3(dot(ev, vec3(0.33))) * vec3(1.0, 0.72, 0.36), 0.55) * 1.4 + vec3(1.0, 0.94, 0.78) * (pow(sb, 90.0) * 3.0 + pow(sb, 14.0) * 0.45) + vec3(0.7, 0.8, 1.0) * pow(sr, 30.0) * 0.6;
      c += mix(vec3(0.95, 0.42, 0.04), vec3(1.65, 1.0, 0.3), pow(ndv, 1.2)) * (0.75 + 1.05 * gw) * (1.0 + 0.35 * jt);   // (its warm inner light)
      if (jt < 0.5) c += vec3(1.5, 1.2, 0.7) * pow(max(0.0, sin(ao * 0.9 - uTime * 4.2)), 24.0) * (0.5 + 0.7 * gw);   // (a light running up along the rim)
      c += vec3(1.0, 0.9, 0.7) * (1.0 - smoothstep(0.0, 0.07, ridge)) * 0.35 * (0.3 + dif); }
    else { float occ = mix(0.3, 1.0, clamp(ao, 0.0, 1.0)), F = 0.045 + 0.955 * pow(1.0 - ndv, 4.0); vec3 ir = 0.5 + 0.5 * cos(6.2832 * (ndv * 1.4 + hx * 0.7 + vec3(0.0, 0.33, 0.67)));
      c = (vec3(0.008, 0.006, 0.008) + vec3(0.033, 0.027, 0.036) * wrap * wrap + vec3(0.125, 0.105, 0.13) * smoothstep(0.66, 0.98, wrap)) * occ;   /* (v417 POL: a touch warmer) */
      float pnl = smoothstep(0.86, 0.95, dot(R, uLS)), sbk = 0.22 + F;   // (a soft window high behind: whole facets flash with it as they turn)
      c += ev * F * (0.4 + 0.6 * occ) * 1.3 + vec3(1.0, 0.96, 0.9) * pnl * sbk * 1.25 * (0.4 + 0.6 * occ) + mix(vec3(1.0), ir, 0.6) * pow(sb, 14.0) * 0.3 * occ + ir * pow(sb, 22.0) * 0.3 * occ + vec3(1.0, 0.97, 0.93) * (pow(sb, 220.0) * 4.0 + pow(sb, 60.0) * 0.8) * (0.5 + 0.5 * occ);
      c += vec3(0.55, 0.65, 1.0) * (pow(sr, 120.0) * 1.1 + pow(sr, 30.0) * 0.06) + pow(1.0 - ndv, 3.0) * max(0.0, dot(n, uLR) + 0.3) * vec3(0.45, 0.52, 0.9) * 0.45 * (1.0 - 0.7 * dif);
      c += vec3(0.85, 0.82, 1.0) * (1.0 - smoothstep(0.0, 0.05, ridge)) * (0.03 + 0.35 * dif) * 0.5;
      c += vec3(0.95, 0.82, 0.62) * smoothstep(0.82, 1.0, edge) * (0.02 + 0.4 * dif * dif * dif + 0.3 * pow(sb, 6.0));   // (the bevels catch the light)
      c += vec3(0.85, 0.42, 0.1) * (1.0 - smoothstep(0.0, 2.4, zm)) * clamp(0.5 - n.z, 0.0, 1.0) * (0.42 + 0.5 * gw) + vec3(0.1, 0.05, 0.015) * (1.0 - smoothstep(0.0, 1.8, zm));   // (the floor's warm bounce: v417 POL stronger, higher up the body)
      if (fr > 0.1 && fr < 0.3 && uLow < 0.5) { float vv = abs(vn(L.xy * 3.0 + L.z * 2.1) - 0.5), vein = smoothstep(0.03, 0.006, vv) * smoothstep(0.4, 0.7, vn(L.yz * 1.3 + 4.0)); c = mix(c, vec3(1.0, 0.65, 0.18) * (0.5 + 0.8 * gw) + pow(sb, 30.0), vein * 0.9); } }   // (faint gold veins in the core)
    c *= 0.22 + 0.78 * smoothstep(0.0, 0.6, zm);   // (dark where it grinds into the floor)
    gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  /*</OD-DRILL-MAT>*/
  /*<MH-HAMMER-MAT ids 180..189 (v417 MH: 20k2r-earth-mercury-hammer.js)>*/
  else if (id >= 180 && id <= 189) {   // ---- (v417 MH) Mercury's Hammer (20k2r), model z along the handle (0 the grip's lower end, the head's centre at 1.5), x the striking axis: 180 the stone head (sandstone, terracotta and dark-orange strata, charcoal basalt grit, champagne mineral veins, chipped pale bevels, amber light in selected seams by uGlow; 180.2 a proud stratum), 181 bevelled steel (181.3 a striking face: concentric polish, the impact's heat by uGlow2), 182 bronze (clamps, rings, socket, straps; 182.3 a rivet), 183 the handle's basalt (an amber vein by uGlow), 184 champagne crystal (184.3 amber), 185 the grip's terracotta cord. uSpill 0..1: breaking into mineral grains (uFx stays the frost) (a dissolve with amber edges)
    float fr = vA.x - float(id), w1 = vn(L.xy * 3.1 + L.z * 1.9), w2 = vn(L.yz * 8.3 + L.x * 5.1), w3 = vn(L.xz * 21.0 + L.y * 13.0), upn = dot(n, uUP), gg = clamp(uGlow, 0.0, 2.0), ndv0 = max(0.0, dot(n, uV));
    vec3 MAMB = vec3(1.0, 0.5, 0.08), MGLD = vec3(1.3, 0.88, 0.36);
    if (uSpill > 0.0) { float nz = vn(L.xy * 9.0 + L.z * 6.1) * 0.55 + vn(L.yz * 17.0 + L.x * 11.0) * 0.3 + vn(L.xz * 4.0 + 2.0) * 0.15, th = uSpill * 1.12 - 0.06; if (nz < th) discard; em += mix(MAMB, MGLD, 0.5) * smoothstep(th + 0.07, th, nz) * 2.4; }
    if (id == 184) { float k = pow(ndv0, 1.3); vec3 hh = normalize(uLK + uV); float isA = step(0.15, fr);
      vec3 c = mix(mix(vec3(0.42, 0.33, 0.2), vec3(1.05, 0.92, 0.7), k), mix(vec3(0.35, 0.1, 0.01), vec3(1.15, 0.6, 0.12), k), isA) * (0.55 + 0.4 * max(dot(n, uLK), 0.0) + 0.35 * gg)
        + vec3(1.0, 0.95, 0.85) * smoothstep(0.8, 1.0, edge) * (0.35 + 0.4 * gg) + pow(max(0.0, dot(n, hh)), 110.0) * 1.6 + pow(1.0 - ndv0, 3.0) * mix(vec3(1.0, 0.82, 0.55), MAMB, isA) * 0.6 + em;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 180) { metal = 0.0; F0 = vec3(0.04); rough = 0.8 + 0.1 * w2; float m1 = vn(L.xy * 1.3 + L.z * 0.9 + 4.0);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 6.0), vn(L.zx * 6.0 + 3.0), vn(L.xy * 6.0 + 7.0)) - 0.5) * 0.3 + (vec3(vn(L.yz * 19.0 + 1.0), vn(L.zx * 19.0 + 4.0), vn(L.xy * 19.0 + 8.0)) - 0.5) * 0.14);   // (rough stone: lumps and grit in the light)
      float zz = (L.z - 1.5) * 4.6 + (vn(L.xy * 1.6 + 1.0) - 0.5) * 1.1 + L.x * 0.35, bi = floor(zz), bf = zz - bi, hb = hs(vec2(bi, 3.7)), hb2 = hs(vec2(bi + 1.0, 3.7));   // (strata of uneven depth, gently warped)
      vec3 CRM = vec3(0.86, 0.74, 0.55), SAND = vec3(0.76, 0.6, 0.41), TERR = vec3(0.64, 0.35, 0.2), DORG = vec3(0.72, 0.38, 0.12);
      vec3 c0 = hb < 0.3 ? SAND : hb < 0.55 ? CRM : hb < 0.8 ? TERR : DORG, c1 = hb2 < 0.3 ? SAND : hb2 < 0.55 ? CRM : hb2 < 0.8 ? TERR : DORG;
      alb = mix(c0, c1, smoothstep(0.7, 1.0, bf)) * (0.78 + 0.28 * m1) * (0.86 + 0.2 * w2) * (0.92 + 0.12 * w3) * (0.93 + 0.07 * sin((zz * 6.0 + w2 * 2.0) * 3.1416));   // (fine laminations in each stratum)
      float seam = 1.0 - smoothstep(0.0, 0.035, min(bf, 1.0 - bf)); cav += seam * 0.45;
      float q1 = abs(fract(dot(L, vec3(2.3, 1.7, 2.9)) + w1 * 1.4) - 0.5), q2 = abs(fract(dot(L, vec3(-1.9, 2.6, 1.4)) + w2 * 0.9) - 0.5), fis = smoothstep(0.03, 0.006, min(q1, q2)) * smoothstep(0.45, 0.65, vn(L.zx * 2.1 + L.y * 1.7));   // (a fissure net)
      cav += fis * 0.8 + smoothstep(0.82, 0.92, vn(L.xy * 13.0 + L.z * 9.0)) * (1.0 - uLow) * 0.4; alb *= 1.0 - 0.55 * fis;   // (and pits)
      em += mix(MAMB, MGLD, 0.4) * max(seam * step(0.6, hs(vec2(bi, 9.1))), fis * step(0.5, vn(L.xy * 1.1 + 9.0))) * (0.05 + 1.3 * gg) * (0.8 + 0.2 * sin(uTime * 2.4 + L.x * 4.0));   // (amber light inside selected seams and cracks)
      float grit = smoothstep(0.82, 0.9, vn(L.xy * 26.0 + L.z * 19.0)) * (1.0 - uLow); alb = mix(alb, vec3(0.13, 0.12, 0.12), grit * 0.75);   // (charcoal basalt grit)
      float vv = abs(vn(L.xy * 2.4 + L.z * 3.3 + 7.0) - 0.5), vein = smoothstep(0.02, 0.005, vv) * smoothstep(0.35, 0.65, vn(L.yz * 1.7 + 2.0));
      alb = mix(alb, vec3(0.95, 0.84, 0.6), vein * 0.85); F0 = mix(F0, vec3(0.9, 0.75, 0.45), vein * 0.6); rough = mix(rough, 0.25, vein); em += MGLD * vein * 0.12 * gg;   // (champagne mineral veins)
      float chip = smoothstep(0.5, 0.9, edge) * smoothstep(0.35, 0.65, w3 + 0.25); alb = mix(alb, vec3(0.93, 0.84, 0.68), chip * 0.6); rough = mix(rough, 0.92, chip);   // (chipped to fresh pale stone at the bevels)
      alb = mix(alb, vec3(0.82, 0.72, 0.56), max(upn, 0.0) * max(upn, 0.0) * 0.18); }   // (dust on what faces up)
    else if (id == 181) { alb = vec3(0.28, 0.29, 0.31); F0 = vec3(0.82, 0.84, 0.88); rough = 0.2 + 0.1 * w2; vec2 fp = vec2(L.y, L.z - 1.5); float rr = length(fp);
      if (fr > 0.15) { rough = 0.11 + 0.06 * w3; if (abs(fract(rr * 38.0 + w2 * 0.6) - 0.5) < 0.12) rough += 0.08; wear += 0.4; cav += smoothstep(0.86, 0.94, vn(fp * 40.0)) * (1.0 - uLow) * 0.5; }   // (the face: concentric polish, a few pits)
      else if (abs(fract(L.x * 60.0 + w2 * 2.0) - 0.5) < 0.1) rough += 0.06;   // (a brushed collar)
      wear += smoothstep(0.7, 1.0, edge) * 0.8;   // (bright bevels)
      float heat = clamp(uGlow2, 0.0, 2.0) * (fr > 0.15 ? 1.0 : 0.35) * (1.0 - smoothstep(0.1, 0.4, rr * (fr > 0.15 ? 1.0 : 0.6)));
      em += mix(vec3(1.4, 0.35, 0.05), vec3(1.9, 1.5, 0.95), smoothstep(0.6, 1.6, heat)) * heat * 0.9; }
    else if (id == 182) { alb = vec3(0.34, 0.19, 0.07); F0 = vec3(0.93, 0.62, 0.34); rough = 0.3 + 0.16 * w2;
      float pat = smoothstep(0.5, 0.75, w2 * 0.7 + w1 * 0.5) * (1.0 - smoothstep(0.3, 0.7, edge)) * (fr > 0.15 ? 0.3 : 1.0);
      alb = mix(alb, vec3(0.12, 0.24, 0.19), pat * 0.7); F0 = mix(F0, vec3(0.06), pat * 0.8); metal = 1.0 - step(0.45, pat); rough = mix(rough, 0.75, pat);   // (verdigris in the hollows)
      wear += smoothstep(0.6, 1.0, edge) * 0.9; if (fr > 0.15) rough *= 0.7;
      if (fr < 0.1 && uLow < 0.5 && abs(fract(L.z * 18.0 + L.x * 2.0) - 0.5) < 0.06) cav += 0.35; }   // (engraved lines)
    else if (id == 183) { metal = 0.0; F0 = vec3(0.045); rough = 0.55 + 0.2 * w2; alb = vec3(0.13, 0.12, 0.115) * (0.75 + 0.45 * w2) * (0.9 + 0.2 * w3);
      cav += smoothstep(0.8, 0.9, vn(L.xy * 40.0 + L.z * 33.0)) * (1.0 - uLow) * 0.6;   // (vesicles)
      float an = atan(L.y, L.x), sv = abs(fract(an / 6.2832 * 2.0 + L.z * 1.3 + w1 * 0.3) - 0.5), vein = smoothstep(0.03, 0.008, sv) * smoothstep(0.3, 0.6, vn(vec2(L.z * 3.0, 1.0)));
      em += mix(MAMB, MGLD, 0.3) * vein * (0.04 + 0.9 * gg); alb = mix(alb, vec3(0.7, 0.4, 0.12), vein * 0.4); alb = mix(alb, vec3(0.3, 0.27, 0.24), smoothstep(0.5, 0.95, edge) * 0.4); }
    else { metal = 0.0; F0 = vec3(0.04); rough = 0.82; float an = atan(L.y, L.x), s = fract(L.z * 30.0 + an / 6.2832 * 2.0), rid = abs(s - 0.5) * 2.0;   // (the corded grip)
      alb = vec3(0.5, 0.23, 0.11) * (0.75 + 0.35 * w3) * (0.7 + 0.3 * (1.0 - rid)); cav += smoothstep(0.75, 1.0, rid) * 0.7; } }
  /*</MH-HAMMER-MAT>*/
  /*<BR-MAT ids 170..174 (v417 BR: 20k2r-earth-br-model.js)>*/
  else if (id >= 170 && id <= 179) {   // ---- (v417 BR) Ball Crusher's boulder and Rapid Fire's shards (20k2r), in their own frames: 170 the boulder's layered stone (170.25 near a glowing seam; vA.y a crack's depth 0..1, vA.z occlusion), 171 a champagne crystal (171.2 a bronze nugget), 172 a charcoal basalt inclusion, 173 a shard of compacted basalt and sandstone (vA.y 1 at a facet's rim: a fresh chip; uKind 1: in the boulder's own stone, a chunk of it crumbling), 174 the shard's amber core. uGlow the seams' and the core's amber light, uWear world units a model unit (its height from vW.z), uTime.
    float bFr = vA.x - float(id), bGw = clamp(uGlow, 0.0, 1.5), bZm = vW.z / max(uWear, 1e-4); vec3 bP = L, bNl = NL;
    float bW1 = vn(bP.xy * 1.7 + bP.z * 1.1), bW2 = vn(bP.yz * 4.3 + bP.x * 2.9), bW3 = vn(bP.xz * 11.0 + bP.y * 7.0);
    if (uLow < 0.5 && id != 171 && id != 174) bNl = normalize(bNl + (vec3(vn(bP.yz * 6.0), vn(bP.zx * 6.0 + 3.0), vn(bP.xy * 6.0 + 7.0)) - 0.5) * 0.34 + (vec3(vn(bP.yz * 17.0 + 1.0), vn(bP.zx * 17.0 + 4.0), vn(bP.xy * 17.0 + 8.0)) - 0.5) * 0.2);   // (grit and pitting in the light)
    { vec3 n2 = normalize(uM0 * bNl.x + uM1 * bNl.y + uM2 * bNl.z); if (dot(n2, uV) < -0.02) n2 = -n2; n = n2; }
    float bNdv = max(0.001, dot(n, uV)), bNdl = dot(n, uLK), bDif = max(bNdl, 0.0), bUp = dot(n, uUP);
    float bCel = 0.22 * smoothstep(-0.05, 0.06, bNdl) + 0.38 * smoothstep(0.26, 0.36, bNdl) + 0.4 * smoothstep(0.62, 0.72, bNdl);   // (cel bands, as the game's art: shadow, midtone, light)
    float bLit = mix(bDif, bCel, 0.6); vec3 bHh = normalize(uLK + uV); float bNh = max(0.0, dot(n, bHh));
    vec3 bAmb = mix(vec3(0.17, 0.12, 0.1), vec3(0.4, 0.4, 0.47), 0.5 + 0.5 * bUp), bKey = vec3(1.28, 1.12, 0.92), bRim = pow(1.0 - bNdv, 3.0) * max(0.0, dot(n, uLR) + 0.3) * vec3(0.6, 0.55, 0.62);
    vec3 bAM = vec3(1.0, 0.5, 0.08), bGO = vec3(1.35, 0.92, 0.38), bC = vec3(0.0), bA = vec3(0.5);
    if (id == 174) { bC = mix(vec3(0.75, 0.3, 0.04), vec3(1.7, 1.15, 0.5), pow(bNdv, 1.4)) * (0.65 + 0.55 * bGw) + vec3(1.0, 0.95, 0.85) * pow(bNh, 70.0) * 1.4 + bGO * smoothstep(0.85, 1.0, edge) * 0.35;
      gl_FragColor = vec4(vec3(tone(bC.r), tone(bC.g), tone(bC.b)) * uAlpha, uAlpha); return; }
    if (id == 171) { vec3 bR = 2.0 * bNdv * n - uV; float bRu = dot(bR, uUP), bSb = max(dot(bR, uLS), 0.0);
      if (bFr > 0.1) { vec3 bFb = vec3(0.86, 0.56, 0.3); bC = bFb * (0.12 + 0.55 * bLit) + bFb * mix(vec3(0.25, 0.16, 0.1), vec3(0.85, 0.8, 0.75), smoothstep(-0.2, 0.6, bRu)) * 0.55 + vec3(1.0, 0.9, 0.75) * pow(bNh, 60.0) * 1.6 + bRim * 0.5; }   // a bronze nugget: polished, warm reflections
      else { vec3 bG0 = vec3(0.98, 0.85, 0.6);   // a champagne crystal: pale gold glass, sharp glints, bright rims, a little warm light inside
        bC = bG0 * (0.22 + 0.7 * bLit) * vec3(1.0, 0.95, 0.85) + mix(vec3(0.25, 0.2, 0.18), vec3(0.95, 0.92, 0.9), smoothstep(-0.1, 0.7, bRu)) * (0.15 + 0.6 * pow(1.0 - bNdv, 2.0)) + vec3(1.0, 0.97, 0.9) * (pow(bNh, 90.0) * 2.2 + pow(bSb, 30.0) * 0.8) + vec3(1.0, 0.92, 0.7) * smoothstep(0.8, 1.0, edge) * (0.25 + 0.4 * bDif) + bAM * 0.12 * (0.5 + bGw); }
      bC *= 0.4 + 0.6 * smoothstep(0.0, 0.5, bZm);
      gl_FragColor = vec4(vec3(tone(bC.r), tone(bC.g), tone(bC.b)) * uAlpha, uAlpha); return; }
    float bSp = 0.1, bCrk = 0.0, bOcc = 1.0, bGk = 0.0;
    if (id == 172) { bA = vec3(0.12, 0.11, 0.105) * (0.75 + 0.5 * bW2) + vec3(0.5, 0.45, 0.38) * step(0.93, hs(floor(bP.xy * 40.0 + bP.z * 23.0))) * pow(bNh, 8.0); bSp = 0.35; }   // (charcoal basalt, a few glinting grains)
    else if (id == 170 || uKind > 0.5) {   // layered strata, tilted bedding, warped: sandstone beige, terracotta, dark orange, pale bands and now and then a charcoal parting
      float bS = dot(bP, vec3(0.26, 0.14, 0.95)) * 5.0 + (bW1 - 0.5) * 1.5 + (bW2 - 0.5) * 0.3, bLi = floor(bS), bB = bS - bLi, bH0 = hs(vec2(bLi, 3.7)), bH1 = hs(vec2(bLi + 1.0, 3.7));
      vec3 bC0 = bH0 < 0.28 ? vec3(0.86, 0.71, 0.5) : bH0 < 0.52 ? vec3(0.56, 0.25, 0.12) : bH0 < 0.74 ? vec3(0.83, 0.44, 0.12) : bH0 < 0.86 ? vec3(0.95, 0.86, 0.68) : vec3(0.17, 0.145, 0.13);
      vec3 bC1 = bH1 < 0.28 ? vec3(0.86, 0.71, 0.5) : bH1 < 0.52 ? vec3(0.56, 0.25, 0.12) : bH1 < 0.74 ? vec3(0.83, 0.44, 0.12) : bH1 < 0.86 ? vec3(0.95, 0.86, 0.68) : vec3(0.17, 0.145, 0.13);   // (sandstone beige, terracotta, dark orange, a pale band, a charcoal parting)
      bA = mix(bC0, bC1, smoothstep(0.86, 0.98, bB)) * (0.8 + 0.32 * bW2) * (0.9 + 0.2 * bW3);
      bA = mix(bA, vec3(0.24, 0.14, 0.08), (smoothstep(0.1, 0.0, bB) + smoothstep(0.9, 0.99, bB) * 0.6) * 0.45);   // (thin dark partings between the beds)
      bA = mix(bA, bA * vec3(0.92, 0.85, 0.8), smoothstep(0.55, 0.8, vn(vec2(bS * 3.0, bW3 * 4.0))) * 0.5);   // (laminations within a bed)
      if (id == 170) { bCrk = clamp(edge, 0.0, 1.0); bOcc = clamp(ao, 0.0, 1.0); bGk = smoothstep(0.04, 0.2, bFr) * smoothstep(0.25, 0.8, bCrk); }
      else { bA = mix(bA, vec3(0.95, 0.85, 0.66), smoothstep(0.86, 1.0, edge) * (0.4 + 0.4 * bW3)); bOcc = 0.85 + 0.15 * smoothstep(0.0, 0.5, edge); } }
    else {   // a shard: compacted basalt and sandstone in sharp, slanted beds; fresh pale chips along its facets' rims
      float bS = dot(bP, vec3(0.62, 0.7, 0.5)) * 3.4 + (bW1 - 0.5) * 0.7, bH0 = fract(floor(bS) * 0.5 + 0.25) < 0.5 ? 0.2 : hs(vec2(floor(bS), 9.1)) * 0.55 + 0.45;   // (charcoal basalt every other bed)
      bA = bH0 < 0.45 ? vec3(0.12, 0.11, 0.105) * (0.8 + 0.4 * bW2) : bH0 < 0.75 ? vec3(0.86, 0.7, 0.48) * (0.85 + 0.25 * bW2) : vec3(0.66, 0.32, 0.15) * (0.85 + 0.25 * bW2);
      float bChip = smoothstep(0.82, 0.98, edge) * (0.45 + 0.55 * step(0.45, bW3)); bA = mix(bA, bH0 < 0.45 ? vec3(0.42, 0.4, 0.38) : vec3(0.96, 0.88, 0.7), bChip * 0.75); bSp = bH0 < 0.45 ? 0.4 : 0.15;
      bOcc = 0.8 + 0.2 * smoothstep(0.0, 0.4, edge); }
    bA *= 1.0 - 0.35 * smoothstep(0.82, 0.9, vn(bP.xy * 13.0 + bP.z * 9.0)) * (1.0 - uLow);   // (pits)
    bA *= 1.0 - 0.72 * bCrk;   // (a crack: dark inside)
    bC = bA * (bAmb * 0.85 + bKey * (0.14 + 0.92 * bLit)) * bOcc + vec3(1.0, 0.92, 0.8) * pow(bNh, 22.0) * bSp * (1.0 - bCrk) + bRim * (1.0 - 0.6 * bCrk);
    if (id == 170) bC += mix(bAM, bGO, smoothstep(0.7, 1.0, bCrk)) * bGk * (0.7 + 1.5 * bGw) * (0.82 + 0.18 * sin(uTime * 3.1 + bP.x * 5.0 + bP.y * 3.0)) + bAM * smoothstep(0.2, 0.6, bCrk) * (1.0 - bGk) * 0.04;   // (the amber light inside the selected seams)
    bC *= 0.45 + 0.55 * smoothstep(0.0, 0.45, bZm);   // (darker where it meets the floor)
    gl_FragColor = vec4(vec3(tone(bC.r), tone(bC.g), tone(bC.b)) * uAlpha, uAlpha); return; }
  /*</BR-MAT>*/
  /*<GB-AMBREL-MAT ids 260..266 (v423 GB: 20x2-ambrel-gl.js, Ambrel the Void Moth)>*/
  else if (id >= 260 && id <= 266) {   // ---- 260 the eyeball (its frame's x the gaze: a yellow sclera, smoke churning inside it by uSpill, veins from the back, an orange rayed iris lit by uGlow, a slit pupil dilated by uGlow2), 261 the fleshy violet lids (vA.y toward the wet lip), 262 a velvet lash (vA.z root .. tip; uGlow2 its tips lit), 263 a wing's membrane (vA.y round its outline, vA.z out from the root; 263.2 the hind wing; uGlow the constellations' light, uGlow2 a hard beat, uSpill grounded), 264 rose lantern paper (uGlow lit; uWear > 0.9 cracked), 265 plum lacquer (frames, chains, beads), 266 velvet. uWear the part's seed, uFx dead. The night garden's light: the moons' cool key, a violet sky, the lanterns' rose from below
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, dead = clamp(uFx, 0.0, 1.0), ndl0 = dot(n, uLK);
    vec3 hq = normalize(uLK + uV); float nh = max(0.0, dot(n, hq));
    vec3 KEY = vec3(0.95, 0.93, 1.12), AMBU = vec3(0.36, 0.3, 0.55), AMBD = vec3(0.34, 0.12, 0.24);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(vec3(0.09, 0.03, 0.1), vec3(0.4, 0.35, 0.62), smoothstep(-0.35, 0.6, ru)) + vec3(1.0, 0.98, 1.05) * 2.0 * smoothstep(0.9, 0.985, dot(rr, uLS));
    if (id == 260) {
      vec3 p = normalize(L); float th = acos(clamp(p.x, -1.0, 1.0)), ph = atan(p.z, p.y), dil = clamp(uGlow2, 0.05, 1.4), men = clamp(uGlow, 0.0, 2.0), ch = max(uSpill, 0.3);
      float w1 = vn(vec2(ph * 2.0 + sd, th * 3.0));
      vec3 a = mix(vec3(1.0, 0.85, 0.28), vec3(0.95, 0.7, 0.12), smoothstep(0.5, 1.6, th)); a = mix(a, vec3(0.5, 0.3, 0.06), smoothstep(1.7, 2.9, th)); a *= 0.9 + 0.18 * w1;
      vec2 s0 = vec2(ph * 1.3 + tt * 0.22 * ch, th * 1.8 - tt * 0.1 * ch); float sm = vn(s0 + vn(s0 * 1.7 + 3.0) * 1.3) * 0.65 + vn(vec2(ph * 3.1 - tt * 0.37 * ch, th * 4.4 + tt * 0.15)) * 0.35;   // (the dark inside it, drifting)
      float smk = smoothstep(0.36, 0.72, sm) * (0.35 + 0.65 * smoothstep(0.25, -0.7, p.z)) * smoothstep(0.5, 1.05, th);
      a = mix(a, vec3(0.13, 0.04, 0.2), smk * 0.9);
      float vq = abs(vn(vec2(ph * 5.0 + vn(vec2(th * 2.5, ph * 1.5 + sd)) * 2.2, th * 0.9 + sd)) - 0.5), vq2 = abs(vn(vec2(ph * 11.0 + vn(vec2(th * 5.0, ph * 3.0)) * 2.0, th * 2.2 + 7.0)) - 0.5);   // (veins: ridged noise along the meridians)
      float vein = max(smoothstep(0.03 * (0.5 + th * 0.35), 0.006, vq), smoothstep(0.02, 0.004, vq2) * 0.7 * smoothstep(1.3, 1.9, th)) * smoothstep(0.7, 1.45, th) * (uLow > 0.5 ? 0.6 : 1.0);
      a = mix(a, vec3(0.42, 0.04, 0.16), vein * 0.85);
      float IR = 0.47, ir = th / IR, irisK = 1.0 - smoothstep(0.97, 1.03, ir); vec3 em = vec3(0.0);
      if (ir < 1.2) { float ra = atan(p.z, p.y), fib = 0.6 + 0.4 * sin(ra * 31.0 + vn(vec2(ra * 4.0, ir * 6.0)) * 6.0) * (0.6 + 0.4 * vn(vec2(ra * 9.0, ir * 3.0 + sd)));
        vec3 ic = mix(vec3(1.0, 0.8, 0.25), vec3(0.95, 0.48, 0.07), smoothstep(0.25, 0.8, ir)); ic = mix(ic, vec3(0.5, 0.16, 0.03), smoothstep(0.78, 1.0, ir)); ic *= 0.72 + 0.48 * fib;
        ic = mix(ic, vec3(1.0, 0.86, 0.5), exp(-((ir - 0.52) / 0.05) * ((ir - 0.52) / 0.05)) * 0.25 * fib);   // (a pale collarette)
        ic = mix(ic, vec3(0.18, 0.04, 0.02), smoothstep(0.82, 0.99, ir) * irisK * 0.85);   // (the dark limbal ring)
        vec2 q = vec2(p.y, p.z) / sin(IR); float hw = (0.12 + 0.88 * dil) * 0.27, hv = 0.56 * min(1.12, 0.88 + dil * 0.2), pd = length(vec2(q.x / max(hw, 0.02), q.y / hv)), pup = 1.0 - smoothstep(0.9, 1.04, pd);
        ic = mix(ic, vec3(0.01, 0.003, 0.012), pup); ic = mix(ic, vec3(0.62, 0.24, 0.04), exp(-((pd - 1.12) / 0.09) * ((pd - 1.12) / 0.09)) * 0.4 * (1.0 - pup));
        a = mix(a, ic, irisK); em += vec3(1.3, 0.52, 0.1) * irisK * (1.0 - pup) * (0.1 + 0.6 * men) * (0.75 + 0.25 * sin(tt * 14.0)) * (1.0 - dead); }
      float wrap = max(0.0, (ndl0 + 0.35) / 1.35), sss = pow(1.0 - ndv0, 2.0) * 0.4;
      vec3 c = a * (wrap * KEY * 1.15 + mix(AMBD, AMBU, 0.5 + 0.5 * hm) * 0.85 * uAmb) + a * vec3(1.0, 0.5, 0.12) * sss;
      float Fr = 0.04 + 0.96 * pow(1.0 - ndv0, 5.0);
      c += envC * (0.05 + Fr * 0.7) + KEY * (pow(nh, 240.0) * 3.6 + pow(nh, 36.0) * 0.22) * max(0.0, ndl0);   // (the wet cornea)
      c += pow(1.0 - ndv0, 2.5) * max(0.0, dot(n, uLR) + 0.3) * uRim * 0.5 + em;
      if (dead > 0.0) { float lum = dot(c, vec3(0.3, 0.55, 0.15)); c = mix(c, vec3(lum) * vec3(0.72, 0.68, 0.82) * 0.65, dead * 0.8); }
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); }
    if (id == 263) {
      float s = edge, k = clamp(ao, 0.0, 1.0), hind = sk >= 1 ? 1.0 : 0.0, fl = clamp(uGlow, 0.0, 1.5), beat = clamp(uGlow2, 0.0, 1.0);
      float NV = hind > 0.5 ? 10.0 : 13.0, sv = s * NV + 0.22 * sin(k * 3.0 + s * 9.0), cell = floor(sv), d = abs(fract(sv) - 0.5);
      float vr = smoothstep(0.075 - 0.035 * k, 0.02 - 0.01 * k, 0.5 - d) * smoothstep(0.03, 0.12, k);   // (the veins from the root, between the cells)
      float bow = 0.09 * sin(3.1416 * fract(sv)), x1 = abs(k - bow - 0.5 - 0.04 * sin(cell * 1.7 + sd)), x2 = abs(k - bow * 0.7 - 0.77 - 0.03 * sin(cell * 2.3));
      float cv = max(smoothstep(0.016, 0.004, x1), smoothstep(0.013, 0.003, x2) * 0.85) * (uLow > 0.5 ? 0.7 : 1.0);
      float vein = max(vr, cv), rim = smoothstep(0.9, 0.985, k), dust = smoothstep(0.78, 0.92, k) * (1.0 - rim), rootV = smoothstep(0.16, 0.0, k);
      float sh = 0.5 + 0.5 * sin(ndv0 * 6.0 + s * 9.0 + k * 3.0 + tt * 0.7 + sd);   // (iridescence: lilac to mint with the angle and along the wing)
      vec3 pearl = vec3(0.93, 0.88, 0.98), irc = mix(vec3(0.76, 0.58, 1.0), vec3(0.55, 0.98, 0.82), sh);
      vec3 a = mix(pearl, irc, 0.38 + 0.22 * k) * (1.0 + 0.2 * vn(vec2(s * 40.0, k * 9.0) + sd));
      a = mix(a, vec3(0.2, 0.11, 0.35), vein * 0.85); a = mix(a, vec3(0.74, 0.55, 1.0), dust * 0.5); a = mix(a, vec3(0.23, 0.12, 0.38), rim * 0.9); a = mix(a, vec3(0.12, 0.07, 0.19), rootV * 0.9);
      float wrap = max(0.0, (ndl0 + 0.5) / 1.5) * oSH, back = max(0.0, -ndl0);
      vec3 c = a * (wrap * KEY * 1.55 + mix(AMBD, AMBU, 0.5 + 0.5 * hm) * 1.35 * uAmb + 0.12) * (0.65 + 0.35 * oAO);
      c += irc * (back * 0.55 + 0.24) * (1.0 - vein) * (1.0 - rim) * (0.7 + 0.3 * oAO);   // (light through the membrane: it glows pearl)
      c += vec3(1.0) * pow(nh, 60.0) * 0.5 * max(0.0, ndl0) + envC * pow(1.0 - ndv0, 3.0) * 0.4;
      // star glitter: fine dust twinkling over it, and the constellations: brighter stars that blaze when it flares
      vec2 gq = vec2(s * (hind > 0.5 ? 46.0 : 60.0), k * 16.0); vec2 gi = floor(gq), gf = fract(gq) - 0.5; float gh = hs(gi + sd);
      float spark = step(0.86, gh) * smoothstep(0.22, 0.0, length(gf)) * (0.35 + 0.65 * pow(0.5 + 0.5 * sin(tt * (2.0 + gh * 7.0) + gh * 60.0), 6.0)) * (1.0 - rim) * smoothstep(0.15, 0.3, k);
      vec2 cq = vec2(s * 17.0, k * 5.0); vec2 ci = floor(cq), cf = fract(cq) - 0.5; float chs = hs(ci + 3.7 + sd), star = step(0.62, chs) * exp(-dot(cf, cf) * 70.0) * smoothstep(0.3, 0.5, k) * (1.0 - rim);
      float tw = 0.6 + 0.4 * sin(tt * 4.0 + chs * 40.0);
      c += vec3(1.0, 0.95, 0.85) * spark * (uLow > 0.5 ? 0.6 : 1.0) * (1.0 + beat) + mix(vec3(1.0, 0.92, 0.7), vec3(0.85, 0.5, 1.0), fl) * star * tw * (0.9 + 1.6 * fl);
      c += vec3(0.6, 0.3, 1.0) * fl * 0.18 * (1.0 - vein) * (1.0 - rim) * smoothstep(0.2, 0.7, k);
      c += pow(1.0 - ndv0, 2.0) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.35;
      if (dead > 0.0) { float lum = dot(c, vec3(0.3, 0.55, 0.15)); c = mix(c, vec3(lum) * vec3(0.7, 0.66, 0.8) * 0.6, dead * 0.7); }
      float al = uAlpha * mix(0.8, 1.0, max(max(vein * 0.8, rim), rootV)) * (1.0 - 0.1 * dust);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * al, al); return; }
    if (id == 264) {
      float x = L.x, ang = atan(L.z, L.y), lit = clamp(uGlow, 0.0, 1.5), crk = uWear > 0.9 ? 1.0 : 0.0, fl = 0.85 + 0.15 * sin(tt * 19.0 + sd);
      float rib = smoothstep(0.1, 0.0, abs(fract(ang / 6.2832 * 8.0 + 0.5) - 0.5)), band = smoothstep(0.012, 0.0, min(min(abs(x - 0.15), abs(x - 0.28)), abs(x - 0.41)));
      float paper = 0.85 + 0.15 * vn(vec2(ang * 7.0, x * 30.0) + sd);
      float cr = crk * smoothstep(0.03, 0.0, abs(vn(vec2(ang * 3.0 + 1.0, x * 9.0)) - 0.5)) * smoothstep(0.2, 0.0, abs(ang - 0.6));
      vec3 a = vec3(0.66, 0.37, 0.53) * paper; a = mix(a, vec3(0.2, 0.08, 0.17), max(rib, band) * 0.8);
      float wrap = max(0.0, (ndl0 + 0.4) / 1.4) * oSH;
      vec3 c = a * (wrap * KEY * 0.9 + mix(AMBD, AMBU, 0.5 + 0.5 * hm) * 0.7) * (0.6 + 0.4 * oAO);
      float th2 = 1.0 - smoothstep(0.0, 0.5, abs(x - 0.28) * 2.0);   // (lit from within: brightest at its middle, the ribs and bands dark against it)
      c += vec3(1.25, 0.55, 0.78) * lit * fl * (0.45 + 0.7 * pow(ndv0, 0.8)) * (0.55 + 0.45 * th2) * (1.0 - 0.75 * max(rib, band)) * paper + vec3(1.2, 1.0, 0.95) * lit * fl * pow(ndv0, 3.0) * th2 * 0.45;
      c = mix(c, vec3(0.06, 0.02, 0.05), cr * 0.9);
      c += vec3(1.0) * pow(nh, 50.0) * 0.12;
      if (dead > 0.0) { float lum = dot(c, vec3(0.3, 0.55, 0.15)); c = mix(c, vec3(lum) * 0.6, dead * 0.6); }
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.1); vec3 F0c = vec3(0.04), emi = vec3(0.0); float rg = 0.6, mt = 0.0, cvv = 0.0, cc = 0.0, sheen = 0.0;
    float w1 = vn(L.xy * 9.0 + L.z * 5.0 + sd), w2 = vn(L.yz * 23.0 + L.x * 11.0 + sd);
    if (id == 261) {   // the lids: violet flesh, fine creases running along the lip, the lip wet and dark
      vec3 p = normalize(L); float th = acos(clamp(abs(p.z), 0.0, 1.0)), lip = smoothstep(0.62, 1.0, edge);
      a = vec3(0.47, 0.29, 0.56) * (0.85 + 0.25 * w1); rg = 0.5; cc = 0.25;
      float cr2 = smoothstep(0.55, 1.0, sin(th * 38.0 + vn(vec2(atan(p.y, p.x) * 3.0, th * 4.0) + sd) * 4.0)) * smoothstep(0.35, 1.2, th) * (1.0 - lip);
      cvv += cr2 * 0.16 * (1.0 - uLow); a = mix(a, vec3(0.62, 0.36, 0.6), smoothstep(0.3, 0.0, th) * 0.3);
      a = mix(a, vec3(0.27, 0.14, 0.34), lip * 0.85); rg = mix(rg, 0.2, lip); cc = mix(cc, 0.9, lip);
      emi += vec3(0.5, 0.12, 0.2) * pow(1.0 - ndv0, 2.0) * 0.25; }
    else if (id == 262) {   // a lash: dark velvet at the root, paler violet toward its tip, a fine sheen along it
      float u = clamp(ao, 0.0, 1.0); a = mix(vec3(0.07, 0.04, 0.12), vec3(0.42, 0.29, 0.56), smoothstep(0.2, 1.0, u)); rg = 0.55; sheen = 0.5;
      emi += vec3(0.75, 0.38, 1.0) * clamp(uGlow2, 0.0, 1.5) * smoothstep(0.55, 1.0, u) * 0.45; }
    else if (id == 265) {   // plum lacquer over dark metal: chains, beads, the lanterns' caps
      a = vec3(0.17, 0.07, 0.19) * (0.8 + 0.3 * w1); F0c = vec3(0.45, 0.28, 0.4); mt = 0.55; rg = 0.32 + 0.15 * w2; cc = 0.4;
      cvv += smoothstep(0.75, 1.0, edge) * 0.2; }
    else {   // 266 velvet: the wing roots, a lure's seed-pod (uKind 1: jade)
      a = vec3(0.11, 0.06, 0.18) * (0.8 + 0.4 * w2); rg = 0.85; sheen = 1.0; cvv += smoothstep(0.55, 0.8, w2) * 0.25 * (1.0 - uLow);
      if (uKind > 0.5) { a = mix(vec3(0.16, 0.36, 0.3), vec3(0.42, 0.7, 0.6), smoothstep(-0.2, 0.8, hm)) * (0.85 + 0.25 * w1); rg = 0.45; sheen = 0.3; cc = 0.35; } }
    float ndl = max(0.0, ndl0) * oSH, occ = oAO;
    vec3 ambC = mix(AMBD, AMBU, 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ) * uAmb;
    float pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl;
    vec3 Fr = F0c + (1.0 - F0c) * pow(1.0 - ndv0, 5.0) * (1.0 - rg * 0.7);
    vec3 col = a * (1.0 - mt) * (ndl * KEY + ambC) + F0c * mt * (ndl * KEY * 0.55 + ambC * 0.5) + (envC * (1.2 / (1.0 + rg * 2.5)) * occ + spec * KEY * 1.3) * Fr;
    if (cc > 0.0) col += cc * (pow(nh, 260.0) * 4.0 * ndl + 0.4 * pow(1.0 - ndv0, 4.0) * envC) * occ;
    col += sheen * pow(1.0 - ndv0, 2.2) * vec3(0.4, 0.3, 0.62) * (0.4 + 0.6 * ndl) * occ;
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.45 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.4);
    col += emi * (1.0 - dead);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.75, 0.72, 0.85) * 0.7, dead * 0.6); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</GB-AMBREL-MAT>*/
  /*<GB-CALYX-MAT ids 270..277 (v423 GB: 20x3-calyx-gl.js, Calyx Astrum the Starborn Vine)>*/
  else if (id >= 270 && id <= 277) {   // ---- 270 the woven vine (vA.y along it, vA.z round it: three strands plaited, starlight down the spine by uGlow, a tremble's sheen by uGlow2), 271 ivory thorns and fangs (vA.z root .. tip), 272 a blossom's cream petal (uGlow its light), 273 its gold heart, 274 the bud's plum petals (vA.y toward the rose lip), 275 the star core (uGlow), 276 jade leaves and tendrils, 277 a gold slit eye (uGlow). uFx dead (withered)
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, dead = clamp(uFx, 0.0, 1.0), ndl0 = dot(n, uLK), gl = clamp(uGlow, 0.0, 2.5);
    vec3 hq = normalize(uLK + uV); float nh = max(0.0, dot(n, hq));
    vec3 KEY = vec3(0.95, 0.93, 1.1), AMBU = vec3(0.34, 0.3, 0.52), AMBD = vec3(0.12, 0.18, 0.16), GLD = vec3(1.35, 0.95, 0.35);
    if (id == 275) { float k = pow(ndv0, 1.2), fl = 0.85 + 0.15 * sin(tt * 13.0 + vn(L.xy * 20.0) * 4.0); vec3 c = mix(vec3(1.2, 0.6, 0.12), vec3(1.6, 1.5, 1.2), k) * (0.35 + 0.9 * gl) * fl + vec3(1.0) * pow(k, 6.0) * gl * 0.6;
      c = mix(c, vec3(0.12, 0.1, 0.08), dead * 0.85); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 277) { vec3 p = normalize(L / vec3(0.19, 0.07, 0.12)); float sl = smoothstep(0.32, 0.18, abs(p.x)) * step(0.0, p.y * sign(L.y + 1e-4) + 0.2), seiz = clamp(uGlow2, 0.0, 1.0);
      vec3 c = mix(vec3(0.75, 0.48, 0.08), vec3(1.4, 1.05, 0.4), pow(ndv0, 1.5)) * (0.55 + 0.5 * gl); c = mix(c, vec3(0.03, 0.01, 0.04), sl * (1.0 - seiz * 0.5));
      c += vec3(1.0) * pow(nh, 120.0) * 1.5; c = mix(c, vec3(0.1, 0.08, 0.06), dead * 0.8); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); }
    vec3 a = vec3(0.3), emi = vec3(0.0); float rg = 0.55, cc = 0.0, cvv = 0.0, trans = 0.0;
    float w1 = vn(L.xy * 7.0 + L.z * 3.0 + sd), w2 = vn(L.yz * 19.0 + L.x * 9.0 + sd);
    if (id == 270) {   // three strands plaited round the tube: each a ridge winding along it, over and under; leaf-veins of jade light between; gold down the spine
      float u = edge * 34.0, v = ao, s = 0.0, ridge = 0.0;
      for (int k = 0; k < 3; k++) { float ph = fract(v * 3.0 + float(k) / 3.0 + sin(u * 0.5 + float(k) * 2.1) * 0.12 + u * 0.16 * (k == 1 ? -1.0 : 1.0)), d = abs(ph - 0.5); ridge = max(ridge, smoothstep(0.5, 0.08, d)); }
      float groove = 1.0 - ridge; a = mix(vec3(0.11, 0.33, 0.22), vec3(0.27, 0.55, 0.4), w1) * (0.6 + 0.5 * ridge); a = mix(a, vec3(0.03, 0.11, 0.08), groove * 0.8);
      cvv += groove * 0.55 * (1.0 - uLow); rg = 0.5 - 0.15 * ridge; cc = 0.2;
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 9.0), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.35 * ridge);
      float sv1 = (v - 0.25) / 0.045, sv2 = (v - 0.25) / 0.12, spine = exp(-sv1 * sv1) + 0.4 * exp(-sv2 * sv2), run = 0.6 + 0.4 * sin(u * 0.7 - tt * 2.5);
      emi += GLD * spine * (0.22 + 0.7 * gl) * run;
      float dots = step(0.9, hs(floor(vec2(u * 2.0, v * 24.0)) + sd)) * pow(0.5 + 0.5 * sin(tt * 3.0 + u * 9.0 + v * 20.0), 8.0); emi += vec3(1.0, 0.96, 0.8) * dots * 0.7 * (1.0 - uLow);   // (starlight caught in the weave)
      emi += vec3(0.5, 1.0, 0.8) * clamp(uGlow2, 0.0, 1.0) * 0.15 * ridge * (0.5 + 0.5 * sin(tt * 30.0 + u * 3.0));
      a = mix(a, a * vec3(0.9, 0.8, 0.55), smoothstep(0.65, 0.95, v + 0.25 * w2) * 0.0); }
    else if (id == 271) { float u = clamp(ao, 0.0, 1.0); a = mix(vec3(0.82, 0.74, 0.56), vec3(0.98, 0.94, 0.84), u) * (0.85 + 0.2 * w2); rg = 0.32; cc = 0.5; a = mix(a, vec3(0.42, 0.3, 0.2), smoothstep(0.15, 0.0, u) * 0.5); }
    else if (id == 272 || id == 273) { float u = clamp(ao, 0.0, 1.0), e = clamp(edge, 0.0, 1.0);
      if (id == 272) { a = mix(vec3(1.0, 0.92, 0.7), vec3(0.95, 0.84, 0.6), u) * (0.9 + 0.15 * w1); a = mix(a, vec3(1.0, 0.98, 0.9), smoothstep(0.6, 1.0, e) * 0.4); trans = 0.6; rg = 0.6; emi += vec3(1.3, 1.05, 0.6) * gl * (0.25 + 0.55 * (1.0 - u)) * (0.85 + 0.15 * sin(tt * 2.4 + sd)); }
      else { a = vec3(0.95, 0.68, 0.18); rg = 0.3; cc = 0.6; emi += GLD * (0.35 + 0.8 * gl) * (0.85 + 0.15 * sin(tt * 4.0 + sd)); } }
    else if (id == 274) {   // the bud: plum petals, veined, a rose lip, a sheen; glowing within before a blow (uGlow)
      float lip = smoothstep(0.55, 1.0, edge), vein = smoothstep(0.04, 0.0, abs(fract(atan(L.z, L.y) * 2.2 + L.x * 0.6) - 0.5) - 0.42) * (1.0 - lip);
      a = mix(vec3(0.3, 0.16, 0.38), vec3(0.42, 0.25, 0.5), w1) * (0.85 + 0.25 * smoothstep(-0.3, 0.8, hm)); a = mix(a, vec3(0.85, 0.5, 0.7), lip * 0.75); a = mix(a, vec3(0.16, 0.07, 0.2), vein * 0.5);
      rg = 0.4; cc = 0.45; trans = 0.35; emi += vec3(1.1, 0.55, 0.3) * gl * 0.25 * (1.0 - ndv0) * (0.6 + 0.4 * sin(tt * 9.0)); }
    else {   // 276 jade leaves, sepals, tendrils
      float mid = smoothstep(0.08, 0.0, edge) * step(0.05, ao); a = mix(vec3(0.2, 0.45, 0.38), vec3(0.42, 0.72, 0.6), w1 * 0.6 + 0.4 * clamp(ao, 0.0, 1.0)); a = mix(a, vec3(0.6, 0.85, 0.72), mid * 0.6); rg = 0.45; cc = 0.3; trans = 0.5; }
    if (dead > 0.0) a = mix(a, vec3(dot(a, vec3(0.3, 0.5, 0.2))) * vec3(0.9, 0.82, 0.62), dead * 0.75);
    float ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.4) / 1.4) * oSH, occ = oAO, back = max(0.0, -ndl0);
    vec3 ambC = mix(AMBD, AMBU, 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ) * uAmb;
    float pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl;
    vec3 rr = 2.0 * dot(n, uV) * n - uV; vec3 envC = mix(vec3(0.05, 0.06, 0.08), vec3(0.38, 0.34, 0.56), smoothstep(-0.35, 0.6, dot(rr, uUP)));
    vec3 col = a * (mix(ndl, wrap, 0.5) * KEY * 1.15 + ambC) + a * back * trans * 0.6 + (envC * 0.35 * occ + spec * KEY * 0.9) * (0.04 + 0.96 * pow(1.0 - ndv0, 5.0) * (1.0 - rg * 0.6) + 0.06);
    if (cc > 0.0) col += cc * (pow(nh, 220.0) * 3.0 * ndl + 0.35 * pow(1.0 - ndv0, 4.0) * envC) * occ;
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.4 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.4);
    col += emi * (1.0 - dead);
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</GB-CALYX-MAT>*/
  /*<SM-SEP-MAT ids 535..549 (v463 SM: 20s7-sep-brood-gl.js, Rift 04's brood, its creatures and its two mini bosses)>*/
  else if (id >= 535 && id <= 549) {   // ---- (v463 SM) the Sepulchre's brood (baked into sprite frames once; the minis posed live). Its passes carry the land's key light colour in uAmb and its rim in uRim (the Clockless Halls' gold candle and silver rim, the Hall in Two Ages' white sun and gold, the Borrowed Stairs' lavender and violet). 535 silver (engraved bands round its own z, tarnish in the hollows; .1 brushed), 536 hour glass (see-through: tinted, a strong fresnel, a slow drift of silver seconds inside by uTime), 537 old gold (hammered, an engraved band; .1 polished bright; .2 cracked: dark cracks across a ring, its local x-z the ring's plane), 538 tomb stone (blue-black, silver veins, chipped bright edges; .1 grey mason stone; .2 dark hood stone; .3 violet stair stone), 539 obsidian hide (glassy black facets, violet seams at the bevels by uGlow; .2 three violet slashes down the flank by its own x), 540 light (emissive only: uKind 0 violet, 1 gold, 2 ice, 3 white; uGlow its strength), 541 an eye (its local +x the gaze: sclera, an iris coloured by uKind (0 violet, 1 ice blue, 2 gold, 3 ember), a pupil narrowed to a slit by uSpill), 542 amber crystal (light through it), 543 bone and pale marble (.1 a horn: ridged rings along vA.z), 544 earth velvet (a mole's coat; .1 old wood), 545 bare pink skin, 546 pale ice (vA.z 1 - the place along a shard: frosted root, clear luminous tip, bright facet edges), 547 dark iron (riveted, a little rust), 548 an enamel clock face (its local +x the face's normal: twelve gold marks round it, a gold rim), 549 a dark void (a mouth's slit, a socket). uGlow2 a white flash, uWear the part's seed, uFx dead (ashen)
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 3.0), fa = 1.0, dead = clamp(uFx, 0.0, 1.0);
    vec3 VI = vec3(0.7, 0.42, 1.35), GO = vec3(1.35, 0.98, 0.45), IC = vec3(0.55, 0.92, 1.3);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    vec3 hq0 = normalize(uLK + uV);
    if (id == 540) { vec3 ec = uKind < 0.5 ? VI : uKind < 1.5 ? GO : uKind < 2.5 ? IC : vec3(1.3, 1.25, 1.2); float fl = 0.85 + 0.3 * vn(L.xy * 9.0 + L.z * 5.0 + vec2(tt * 1.7, -tt));
      vec3 c = mix(ec * 0.8, vec3(1.6, 1.55, 1.5), pow(ndv0, 2.0) * 0.6) * (0.45 + 0.75 * gl) * fl;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.1), emi = vec3(0.0), thru = vec3(0.0), F0m = vec3(0.04); float rg = 0.6, cvv = 0.0, cc = 0.0, occ = clamp(ao, 0.0, 1.0) * 0.4 + 0.6, met = 0.0;
    if (id == 536 || id == 546) occ = 1.0;
    if (id == 535) { met = 1.0; float eg = clamp(edge, 0.0, 1.0), band = smoothstep(0.08, 0.0, abs(fract(L.z * 5.0 + 0.25) - 0.5) - 0.38), fil = smoothstep(0.06, 0.0, abs(vn(vec2(atan(L.y, L.x) * 3.0, L.z * 9.0) + sd) - 0.5));
      F0m = vec3(0.8, 0.83, 0.9) * (0.86 + 0.16 * w2); rg = (sk == 1 ? 0.3 : 0.17) + 0.14 * w3; F0m *= 1.0 - 0.35 * (band * 0.6 + fil * 0.5); cvv += band * 0.35 + fil * 0.25;
      F0m = mix(F0m, vec3(0.35, 0.33, 0.36), (1.0 - occ) * 0.8 + 0.2 * smoothstep(0.7, 0.9, w1)); F0m += vec3(0.15) * eg; }
    else if (id == 536) { float frs = pow(1.0 - ndv0, 3.0); a = vec3(0.7, 0.78, 0.9); rg = 0.05; cc = 1.0;
      vec2 sp = vec2(atan(L.y, L.x) * 2.0 + tt * 0.4, L.z * 6.0 - tt * 0.9); float mote = smoothstep(0.9, 1.0, vn(sp * 3.0 + sd)) * 0.9;
      emi += vec3(0.9, 0.95, 1.1) * mote * 0.6 + GO * gl * 0.15; thru = vec3(0.55, 0.62, 0.8) * 0.1; fa = clamp(0.22 + 0.7 * frs + mote * 0.4, 0.0, 1.0); }
    else if (id == 537) { met = 1.0; float hmr = vn(L.xy * 14.0 + L.z * 7.0 + sd), eg = clamp(edge, 0.0, 1.0);
      F0m = vec3(1.0, 0.76, 0.36) * (0.82 + 0.2 * w2 + 0.1 * hmr); rg = (sk == 1 ? 0.12 : 0.24) + 0.16 * w1;
      if (uLow < 0.5 && sk != 1) n = normalize(n + (vec3(vn(L.yz * 16.0 + sd), vn(L.zx * 16.0 + 3.0), vn(L.xy * 16.0 + 7.0)) - 0.5) * 0.18);
      float eng = smoothstep(0.05, 0.0, abs(fract(atan(L.z, L.x) * 1.91 + 0.5 * w1) - 0.5) - 0.42) * step(0.5, float(sk == 0 ? 1 : 0)); F0m *= 1.0 - 0.4 * eng; cvv += eng * 0.3;
      if (sk == 2) { float ang = atan(L.z, L.x), crk = smoothstep(0.05, 0.0, abs(vn(vec2(ang * 3.0, length(L.xz) * 9.0) + sd) - 0.5)) * step(0.55, vn(vec2(ang * 1.2 + 4.0, 1.0))); F0m *= 1.0 - 0.85 * crk; cvv += crk * 0.8; emi += VI * crk * gl * 0.6; }
      F0m = mix(F0m, vec3(0.3, 0.2, 0.1), (1.0 - occ) * 0.9); F0m += vec3(0.25, 0.2, 0.1) * eg * 0.6; }
    else if (id == 538) { float eg = clamp(edge, 0.0, 1.0), vein = smoothstep(0.04, 0.0, abs(vn(L.xy * 2.3 + L.z * 1.7 + sd) - 0.5)) * (0.5 + 0.5 * w2);
      vec3 base = sk == 1 ? vec3(0.46, 0.48, 0.54) : sk == 2 ? vec3(0.17, 0.18, 0.24) : sk == 3 ? vec3(0.2, 0.15, 0.32) : sk == 4 ? vec3(0.24, 0.3, 0.42) : vec3(0.11, 0.13, 0.19);   // (.4 polished blue slate: Tock)
      a = base * (0.75 + 0.4 * w1) * (0.9 + 0.2 * w3); a = mix(a, sk == 3 ? vec3(0.62, 0.5, 0.95) : vec3(0.66, 0.7, 0.78), vein * (sk == 1 ? 0.25 : 0.55)); a += vec3(0.18, 0.19, 0.22) * eg * (0.4 + 0.6 * w3);
      rg = sk == 1 ? 0.62 : 0.34 + 0.15 * w2; cc = sk == 1 ? 0.05 : 0.45; cvv += smoothstep(0.78, 0.92, w3) * 0.35;
      if (sk == 3) emi += VI * vein * (0.15 + 0.6 * gl);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 11.0 + sd), vn(L.zx * 11.0 + 3.0), vn(L.xy * 11.0 + 7.0)) - 0.5) * 0.14); }
    else if (id == 539) { float eg = clamp(edge, 0.0, 1.0); a = vec3(0.034, 0.03, 0.05) * (0.8 + 0.4 * w1); rg = 0.1 + 0.12 * w2; cc = 0.95;
      float seam = smoothstep(0.45, 0.7, eg) * (1.0 - smoothstep(0.86, 0.97, eg)), pul = 0.75 + 0.25 * sin(tt * 4.0 + sd);   // (a line along each bevel: a flat side (edge 1) stays black glass)
      emi += VI * seam * (0.12 + 0.75 * gl) * pul; a += vec3(0.08, 0.06, 0.14) * seam;
      if (sk == 2) { float sl = exp(-pow((fract(L.x * 2.6 + L.z * 0.6 + 0.15) - 0.5) / 0.06, 2.0)) * step(-0.9, L.x) * step(L.x, 0.5) * smoothstep(0.0, 0.25, L.z); emi += VI * sl * (0.35 + 0.9 * gl) * pul; a = mix(a, vec3(0.3, 0.2, 0.5), sl * 0.4); }
      cvv += smoothstep(0.82, 0.95, w3) * 0.2; }
    else if (id == 541) { vec3 p = normalize(L); float fr0 = smoothstep(0.0, 0.25, p.x), ry = p.y, rz = p.z, rr = length(vec2(ry, rz)) / 0.62, sl = clamp(uSpill, 0.0, 1.0);
      float iris = (1.0 - smoothstep(0.92, 1.0, rr)) * fr0, pup = (1.0 - smoothstep(0.85, 1.0, length(vec2(ry / mix(0.42, 0.1, sl), rz / 0.44)) / 1.0)) * fr0;
      vec3 irc = uKind < 0.5 ? vec3(0.55, 0.3, 1.0) : uKind < 1.5 ? vec3(0.25, 0.62, 0.95) : uKind < 2.5 ? vec3(1.0, 0.72, 0.2) : vec3(1.0, 0.4, 0.15);
      float ring = smoothstep(0.2, 0.0, abs(rr - 0.55)) * 0.4 + vn(vec2(atan(rz, ry) * 5.0, rr * 4.0) + sd) * 0.3;
      a = mix(vec3(0.9, 0.9, 0.95), irc * (0.7 + ring), iris); a = mix(a, vec3(0.02, 0.015, 0.03), pup); rg = 0.08; cc = 1.0;
      emi += irc * iris * (1.0 - pup) * (0.35 + 0.8 * gl); a *= 0.75 + 0.25 * smoothstep(-0.6, 0.3, p.z); }
    else if (id == 542) { a = vec3(0.95, 0.6, 0.18) * (0.8 + 0.3 * w1); rg = 0.12; cc = 0.9; thru = vec3(1.2, 0.62, 0.15) * 0.5; emi += vec3(1.1, 0.55, 0.12) * (0.18 + 0.7 * gl) * (0.6 + 0.4 * clamp(edge, 0.0, 1.0)); }
    else if (id == 543) { float gr = abs(fract(L.z * 6.0 + w1 * 1.5) - 0.5); a = vec3(0.84, 0.8, 0.72) * (0.84 + 0.2 * w1) * (1.0 - 0.15 * smoothstep(0.1, 0.0, gr)); rg = 0.5; cc = 0.2;
      if (sk == 1) { float rib = smoothstep(0.3, 0.5, abs(fract(clamp(ao, 0.0, 1.0) * 14.0) - 0.5)); a *= 0.72 + 0.32 * rib; cvv += (1.0 - rib) * 0.3; a = mix(a, vec3(0.55, 0.45, 0.32), 0.25 * clamp(ao, 0.0, 1.0)); } }
    else if (id == 544) { if (sk == 1) { float gr2 = sin(L.z * 40.0 + w1 * 6.0); a = vec3(0.36, 0.22, 0.12) * (0.8 + 0.12 * gr2 + 0.2 * w2); rg = 0.7; }
      else { a = vec3(0.32, 0.25, 0.19) * (0.8 + 0.35 * w2) * (0.9 + 0.2 * w3); rg = 0.9; emi += vec3(0.55, 0.45, 0.36) * pow(1.0 - ndv0, 2.2) * 0.3 * (0.5 + 0.5 * max(0.0, dot(n, uLK))); } }
    else if (id == 545) { a = vec3(0.86, 0.58, 0.56) * (0.88 + 0.2 * w1); rg = 0.45; cc = 0.25; thru = vec3(0.9, 0.35, 0.3) * 0.25; }
    else if (id == 546) { float tp = clamp(1.0 - ao, 0.0, 1.0), eg = smoothstep(0.75, 1.0, edge), frs = pow(1.0 - ndv0, 3.0);
      a = mix(vec3(0.62, 0.82, 0.95), vec3(0.93, 0.98, 1.0), tp) * (0.85 + 0.2 * w1); rg = 0.08; cc = 1.0; thru = mix(vec3(0.15, 0.4, 0.7), vec3(0.6, 0.9, 1.1), tp) * 0.45;
      emi += vec3(0.75, 0.95, 1.15) * eg * 0.4 + IC * frs * 0.25 + IC * gl * 0.25 * tp; a = mix(a, vec3(1.0), smoothstep(0.65, 0.9, hm + 0.4 * w3) * 0.35); }
    else if (id == 547) { met = 1.0; F0m = vec3(0.3, 0.31, 0.36) * (0.8 + 0.3 * w2); rg = 0.42 + 0.2 * w3; float rust = smoothstep(0.62, 0.85, w1) * (1.0 - occ * 0.5); F0m = mix(F0m, vec3(0.28, 0.16, 0.1), rust * 0.6); rg += rust * 0.3; F0m += vec3(0.18) * clamp(edge, 0.0, 1.0); }
    else if (id == 548) { vec2 q = L.yz; float rr = length(q), ang = atan(q.y, q.x), tk = exp(-pow((fract(ang / 6.2832 * 12.0 + 0.5) - 0.5) / 0.06, 2.0)) * smoothstep(0.55, 0.68, rr / max(0.001, ao * 0.0 + 1.0) * 1.0);
      float rimG = smoothstep(0.86, 0.92, rr); a = vec3(0.9, 0.86, 0.76) * (0.9 + 0.12 * w1); a = mix(a, vec3(0.75, 0.55, 0.25), tk * 0.85); rg = 0.25; cc = 0.85;
      if (rimG > 0.0) { met = rimG; F0m = vec3(1.0, 0.76, 0.36); rg = 0.22; } emi += GO * tk * gl * 0.5; }
    else { a = vec3(0.01, 0.006, 0.016); rg = 0.3; cc = 0.4; emi += VI * 0.05 * (0.4 + gl); }
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0), wrap = max(0.0, (ndl0 + 0.4) / 1.4);
    vec3 key = uAmb, ambC = mix(uAmb * 0.16 + vec3(0.04, 0.04, 0.07), uRim * 0.18 + uAmb * 0.12, 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ);
    float nh = max(0.0, dot(n, hq0)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr2 = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr2, uUP);
    vec3 envC = ru > 0.0 ? mix(uAmb * 0.55, uRim * 0.35 + vec3(0.05), smoothstep(0.0, 0.6, ru)) : mix(uAmb * 0.45, vec3(0.06, 0.05, 0.08), smoothstep(0.0, -0.4, ru));
    envC += uAmb * 1.1 * smoothstep(0.86, 0.97, dot(rr2, uLS)) / (1.0 + rg * 5.0);
    vec3 col;
    if (met > 0.5) { vec3 Fr = F0m + (1.0 - F0m) * frs; col = Fr * ((envC + vec3(0.16)) * 1.2 * occ + spec * key * 1.3) + F0m * 0.3 * (wrap * key + ambC); }
    else { col = a * (mix(ndl, wrap, 0.45) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (0.04 + 0.96 * frs * (1.0 - rg * 0.6));
      if (cc > 0.0) col += cc * (pow(nh, 200.0) * 3.0 * ndl + 0.3 * frs * envC) * occ;
      col += thru * (0.6 + 0.4 * max(0.0, -ndl0)); }
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.5 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * 0.7, dead * 0.75); }
    col += emi * (1.0 - dead * 0.9) + vec3(1.0, 0.97, 0.92) * clamp(uGlow2, 0.0, 1.0) * (0.3 + 0.5 * pow(1.0 - ndv0, 2.0));
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha * fa, uAlpha * fa); return; }
  /*</SM-SEP-MAT>*/
  /*<YM-YUG-MAT ids 830..849 (v472 YM: 20u6f-yug-brood-gl.js, Rift 06's brood baked into sprite frames once). Its passes carry the land's key light in uAmb and its rim in uRim (the Torn Hull's violet night, the Coolant Vaults' teal, the Engine Heart's rose and amber). Every pattern from the surface's own coordinates. 830 gunmetal hull plate (panel seams and rivets laid on the face the normal points along, bright worn bevels, scratches, a clear coat; .1 a dark plate, .2 a light plate, .3 near-black joints, .4 a ribbed shell: grooves across x; 839 a round light plate: its panels radial; sub-ids stay under .5: the id is rounded), 831 light (emissive only: uKind 0 violet, 1 teal, 2 amber, 3 white, 4 a hot red-orange; uGlow its strength), 832 a glass window (dark glass, current swirling and forking inside by uGlow in uKind's colour, a sheen), 833 fungal flesh (rose, lumpy, light through it; .1 the brain lobe: ridged, glowing by uGlow in uKind's colour; .2 a claw's glossy shell), 834 a wing membrane (rose, veins from its root, light through it), 835 leathery egg hide (plated bands, wet; its crown's four seams glowing violet, parted and amber by uSpill), 836 black chrome (glossy biomech; .1 bright steel: a blade), 837 hazard stripes (amber and black), 838 matte rubber and cable (the dark legs); uGlow2 a white flash, uFx a death's fade, uWear the part's seed>*/
  else if (id >= 830 && id <= 849) {   // ---- (v472 YM) the Yuggoth Engine's brood
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 3.0), dead = clamp(uFx, 0.0, 1.0);
    vec3 EC = uKind < 0.5 ? vec3(1.05, 0.42, 1.6) : uKind < 1.5 ? vec3(0.32, 1.35, 1.15) : uKind < 2.5 ? vec3(1.55, 0.92, 0.28) : uKind < 3.5 ? vec3(1.4, 1.36, 1.5) : vec3(1.65, 0.5, 0.3);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    vec3 hq0 = normalize(uLK + uV);
    if (id == 831) { float fl = 0.88 + 0.24 * vn(L.xy * 9.0 + L.z * 5.0 + vec2(tt * 1.3, -tt));
      vec3 c = mix(EC * 0.85, vec3(1.7, 1.65, 1.75), pow(ndv0, 2.2) * 0.6) * (0.45 + 0.8 * gl) * fl;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.1), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.5, cvv = 0.0, cc = 0.0, mt = 0.0, occ = clamp(ao, 0.0, 1.0) * 0.4 + 0.6, eg = clamp(edge, 0.0, 1.0);
    if (id == 830 || id == 839) { bool rnd = id == 839; vec3 base = sk == 1 ? vec3(0.24, 0.26, 0.33) : sk == 2 || rnd ? vec3(0.46, 0.5, 0.6) : sk == 3 ? vec3(0.08, 0.085, 0.11) : vec3(0.33, 0.36, 0.45);
      vec3 an = abs(NL); vec2 q = (rnd ? vec2(atan(L.y, L.x) * 1.2732, length(L.xy) * 2.2) : an.z > max(an.x, an.y) ? L.xy : an.x > an.y ? L.yz : L.xz) * (rnd ? 1.0 : 3.0) + sd;
      vec2 g = fract(q), e2 = min(g, 1.0 - g); float sm = min(e2.x, e2.y), seam = 1.0 - smoothstep(0.012, 0.035, sm);
      vec2 rq = fract(q * 4.0) - 0.5; float riv = (1.0 - smoothstep(0.1, 0.17, length(rq))) * (1.0 - smoothstep(0.07, 0.11, sm)) * smoothstep(0.03, 0.05, sm);
      a = base * (0.84 + 0.26 * w1); a *= 1.0 - seam * 0.55; a = mix(a, vec3(0.62, 0.64, 0.72), eg * 0.4 + smoothstep(0.9, 0.97, w3) * 0.3); a += vec3(0.22, 0.23, 0.27) * riv;
      cvv += seam * 0.35; mt = sk == 3 ? 0.6 : 0.3; rg = 0.3 + 0.18 * w2 - riv * 0.12; cc = 0.55;
      if (sk == 4) { float rb = smoothstep(0.3, 0.47, abs(fract(L.x * 3.4 + 0.5) - 0.5)); cvv += rb * 0.5; a *= 1.0 - rb * 0.3; }
      emi += EC * gl * 0.04; }
    else if (id == 832) { vec3 p = L * 3.0; float sw = vn(vec2(p.x * 2.0 + tt * 1.4 + p.z, p.y * 2.0 - tt + sd)), arc = 1.0 - smoothstep(0.0, 0.05, abs(vn(vec2(p.x * 3.0 + p.y * 2.0, p.z * 3.0 + tt * 3.0) + sd) - 0.5)), frs2 = pow(1.0 - ndv0, 3.0);
      a = vec3(0.02, 0.012, 0.05); rg = 0.05; cc = 1.0; emi += EC * (0.15 + 0.85 * gl) * (0.35 + 0.65 * sw) * 0.65 + vec3(1.2, 1.12, 1.4) * arc * gl * 0.6 + vec3(0.5, 0.45, 0.65) * frs2 * 0.25; thru = EC * gl * 0.08; }
    else if (id == 833) { if (sk == 2) { a = vec3(0.74, 0.3, 0.52) * (0.85 + 0.2 * w1); a = mix(a, vec3(0.98, 0.78, 0.88), eg * 0.3); rg = 0.2; cc = 0.85; thru = vec3(0.4, 0.1, 0.25) * 0.3; }
      else if (sk == 1) { float rid = smoothstep(0.25, 0.5, abs(fract(L.x * 4.2 + 0.6 * sin(L.y * 9.0 + L.z * 6.0) + w1 * 0.5) - 0.5)); a = mix(vec3(0.96, 0.74, 0.86), vec3(0.6, 0.28, 0.48), rid * 0.6) * (0.9 + 0.15 * w2); cvv += rid * 0.25; rg = 0.34; cc = 0.5; thru = EC * 0.22;
        emi += EC * gl * (0.22 + 0.5 * (1.0 - rid)) * (0.85 + 0.15 * sin(tt * 2.0 + L.x * 5.0)); }
      else { float lump = vn(L.xy * 5.0 + L.z * 3.0 + sd); a = mix(vec3(0.8, 0.4, 0.64), vec3(0.96, 0.62, 0.8), lump) * (0.85 + 0.2 * w3); a = mix(a, vec3(0.48, 0.18, 0.38), smoothstep(0.65, 0.85, w2) * 0.45); rg = 0.42; cc = 0.4; thru = vec3(0.55, 0.15, 0.35) * 0.35; cvv += smoothstep(0.7, 0.9, w2) * 0.15; } }
    else if (id == 834) { vec2 q = L.xz; float ang = atan(q.y, q.x), vein = 1.0 - smoothstep(0.0, 0.07, abs(fract(ang * 1.6 + length(q) * 0.4) - 0.5) - 0.42), frs2 = pow(1.0 - ndv0, 2.5);
      a = mix(vec3(0.6, 0.3, 0.54), vec3(0.86, 0.56, 0.78), 0.4 + 0.3 * w1); a = mix(a, vec3(1.0, 0.82, 0.93), vein * 0.5); rg = 0.3; cc = 0.4; thru = vec3(0.7, 0.3, 0.55) * 0.5; emi += vec3(0.9, 0.5, 0.8) * frs2 * 0.15; occ = 1.0; }
    else if (id == 835) { float bands = smoothstep(0.3, 0.48, abs(fract(L.z * 2.6 + 0.15 * sin(atan(L.y, L.x) * 3.0)) - 0.5)), an3 = atan(L.y, L.x) + 0.4, sa = abs(fract(an3 * 0.63662) - 0.5) * 1.5708 * length(L.xy), crown = smoothstep(1.1, 1.7, L.z), op = clamp(uSpill, 0.0, 1.0);
      float dd = sa / (0.025 + 0.06 * op), seam = exp(-dd * dd) * crown; vec3 sc = mix(vec3(1.05, 0.42, 1.6), vec3(1.55, 0.92, 0.28), op);
      a = mix(vec3(0.2, 0.16, 0.24), vec3(0.44, 0.37, 0.48), w1 * 0.6 + 0.2) * (1.0 - bands * 0.35); cvv += bands * 0.3; rg = 0.26 + 0.15 * w2; cc = 0.9; a = mix(a, vec3(0.05, 0.02, 0.06), seam * 0.5);
      emi += sc * seam * (0.35 + 0.35 * gl + 0.9 * op) + sc * crown * op * 0.15; }
    else if (id == 836) { if (sk == 1) { a = vec3(0.8, 0.84, 0.92); mt = 0.2; rg = 0.14 + 0.06 * w2; cc = 0.3; a = mix(a, vec3(0.95), eg * 0.4); } else { a = vec3(0.1, 0.11, 0.14) * (0.8 + 0.3 * w1); mt = 0.9; rg = 0.12 + 0.08 * w2; cc = 1.0; } }
    else if (id == 837) { float s = step(0.5, fract((L.x + L.y * 0.6 + L.z) * 3.2)); a = mix(vec3(0.06, 0.06, 0.07), vec3(0.95, 0.62, 0.15), s) * (0.88 + 0.15 * w1); a = mix(a, a * 0.6, smoothstep(0.85, 0.95, w3)); rg = 0.5; cc = 0.4; }
    else { a = vec3(0.07, 0.075, 0.095) * (0.85 + 0.25 * w2); rg = 0.55; cc = 0.15; mt = 0.2; a = mix(a, vec3(0.3, 0.32, 0.38), eg * 0.25); }
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0), wrap = max(0.0, (ndl0 + 0.4) / 1.4);
    vec3 key = uAmb, ambC = mix(uAmb * 0.16 + vec3(0.05, 0.04, 0.08), uRim * 0.2 + uAmb * 0.18 + vec3(0.05, 0.04, 0.08), 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ);
    float nh = max(0.0, dot(n, hq0)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr2 = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr2, uUP);
    vec3 envC = ru > 0.0 ? mix(uAmb * 0.45, uRim * 0.5 + vec3(0.08, 0.06, 0.12), smoothstep(0.0, 0.6, ru)) : mix(uAmb * 0.4, vec3(0.06, 0.05, 0.08), smoothstep(0.0, -0.4, ru));
    envC += uAmb * 1.2 * smoothstep(0.86, 0.97, dot(rr2, uLS)) / (1.0 + rg * 5.0);
    vec3 Fr = mix(mix(vec3(0.04), a, mt), vec3(1.0), frs * (1.0 - rg * 0.6));
    vec3 col = a * (1.0 - mt * 0.82) * (mix(ndl, wrap, 0.5) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (Fr * (0.35 + 0.65 * mt) + 0.65 * (1.0 - mt) * Fr);
    if (cc > 0.0) col += cc * (pow(nh, 200.0) * 3.0 * ndl + 0.3 * frs * envC) * occ;
    col += thru * (0.6 + 0.4 * max(0.0, -ndl0));
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.55 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.4);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * 0.7, dead * 0.75); }
    col += emi * (1.0 - dead * 0.9) + vec3(1.0, 0.98, 0.95) * clamp(uGlow2, 0.0, 1.0) * (0.3 + 0.5 * pow(1.0 - ndv0, 2.0));
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</YM-YUG-MAT>*/
  /*<LM-LIB-MAT ids 910..929 (v474 LM: 20zb5-lib-brood-gl.js, Rift 07's brood baked into sprite frames once). Its passes carry the land's key light in uAmb and its rim in uRim (the Catalogue's candle gold and ink violet, the Silver Bindery's cool silver, the Ascent's white sun and gold). Every pattern from the surface's own coordinates (L, or a strip's own u / v in the edge / occlusion attributes). 910 paper (warm parchment fibres and foxing, light through it; .1 aged parchment, .2 a page block: the leaves' fine lines across L.x, .3 an inked sheet (edge = u along, occlusion = v across: rows of script), .4 a margin worm's strip (edge = u along, occlusion = v across: a burgundy spine down its middle, script either side)), 911 light (emissive only: uKind 0 gold, 1 ink violet, 2 holy white-gold, 3 white, 4 fire amber; uGlow its strength), 912 book leather (burgundy grain, polished, worn lighter at the edges; .1 a dark spine), 913 gilt (polished gold, worn bright edges; .1 pale holy gold, .2 antique gold), 914 ink (glossy black-violet, a violet sheen and slow swirls inside, wet; .1 white enamel: an eye; .2 a black glossy pupil), 915 wood by uKind's theme (0 polished walnut with grain, 1 white lacquer, 2 ivory; .1 the back panel, darker), 916 a row of book spines by uKind's theme (sub-ids .0-.4 its colour, spine divisions along L.y), 917 platinum (polished pale metal; .1 darker), 918 a feather (edge = u along the shaft, occlusion = v across: barbs, the shaft, translucent; .1 silvered), 919 cloth and porcelain (.0 a white robe with soft folds; .1 a pale gold porcelain mask), 920 an eye (a sphere looking along +x: white, iris by uKind (0 sky blue, 1 hot amber, 2 gold, 3 a small ink pupil only), pupil, glint; uGlow lights the iris); uGlow2 a white flash, uFx a death's fade, uWear the part's seed. Per-id branches are separate ifs (SwiftShader mis-shades deep else-if chains)>*/
  else if (id >= 910 && id <= 929) {   // ---- (v474 LM) the Library's brood
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 3.0), dead = clamp(uFx, 0.0, 1.0);
    vec3 EC = uKind < 0.5 ? vec3(1.6, 1.12, 0.42) : uKind < 1.5 ? vec3(0.95, 0.5, 1.65) : uKind < 2.5 ? vec3(1.7, 1.5, 0.95) : uKind < 3.5 ? vec3(1.5, 1.48, 1.42) : vec3(1.75, 0.78, 0.3);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    vec3 hq0 = normalize(uLK + uV);
    if (id == 911) { float fl = 0.9 + 0.2 * vn(L.xy * 9.0 + L.z * 5.0 + vec2(tt * 1.3, -tt));
      vec3 c = mix(EC * 0.85, vec3(1.75, 1.7, 1.6), pow(ndv0, 2.2) * 0.55) * (0.45 + 0.8 * gl) * fl;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.5), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.5, cvv = 0.0, cc = 0.0, mt = 0.0, occ = clamp(ao, 0.0, 1.0) * 0.4 + 0.6, eg = clamp(edge, 0.0, 1.0);
    if (id == 910) { vec3 p0 = sk == 1 ? vec3(0.8, 0.67, 0.47) : vec3(0.93, 0.85, 0.69), p1 = sk == 1 ? vec3(0.9, 0.79, 0.6) : vec3(0.99, 0.95, 0.85);
      float fib = vn(vec2(L.x * 40.0 + L.z * 7.0, L.y * 6.0) + sd), fox = smoothstep(0.74, 0.9, vn(L.xy * 5.0 + L.z * 4.0 + sd * 1.3));
      a = mix(p0, p1, w1 * 0.7 + 0.15) * (0.94 + 0.1 * fib); a = mix(a, vec3(0.62, 0.45, 0.26), fox * 0.35); rg = 0.78; thru = vec3(0.42, 0.34, 0.2) * 0.45;
      if (sk == 2) { float lv = smoothstep(0.25, 0.5, abs(fract(L.x * 62.0 + w2 * 0.6) - 0.5)); a = mix(vec3(0.97, 0.93, 0.82), vec3(0.7, 0.6, 0.45), lv * 0.45) * (0.95 + 0.08 * w3); cvv += lv * 0.12; thru = vec3(0.0); }
      if (sk == 3 || sk == 4) { float u = edge, v = clamp(ao, 0.0, 1.0); occ = 1.0; eg = 0.0;
        float rows = sk == 3 ? 7.0 : 2.0, rv = sk == 3 ? v * rows : abs(v - 0.5) * 2.0 * rows, rf = fract(rv), ri = floor(rv);
        float word = step(0.42, vn(vec2(u * (sk == 3 ? 34.0 : 70.0) + ri * 13.0, ri + sd))) * step(0.06, u) * step(u, 0.95), line = smoothstep(0.32, 0.42, rf) * (1.0 - smoothstep(0.55, 0.66, rf));
        if (sk == 4) line *= step(0.32, abs(v - 0.5) * 2.0) * (1.0 - step(0.9, abs(v - 0.5) * 2.0));
        a = mix(a, vec3(0.22, 0.16, 0.24), word * line * 0.62);
        if (sk == 4) { float sp = 1.0 - smoothstep(0.1, 0.14, abs(v - 0.5)); a = mix(a, vec3(0.42, 0.13, 0.26) * (0.85 + 0.2 * w2), sp); rg = mix(rg, 0.42, sp); cc += sp * 0.4; float rim = smoothstep(0.42, 0.5, abs(v - 0.5)); a *= 1.0 - rim * 0.18; } } }
    if (id == 912) { vec3 b0 = sk == 1 ? vec3(0.2, 0.07, 0.11) : vec3(0.42, 0.12, 0.22);
      a = b0 * (0.84 + 0.24 * w1) * (0.9 + 0.12 * smoothstep(0.4, 0.7, w3)); a = mix(a, b0 * 1.7 + vec3(0.06, 0.03, 0.02), eg * 0.45); rg = 0.4 - 0.12 * w2; cc = 0.45; cvv += smoothstep(0.75, 0.95, w3) * 0.12; }
    if (id == 913) { a = (sk == 1 ? vec3(1.0, 0.86, 0.56) : sk == 2 ? vec3(0.72, 0.5, 0.22) : vec3(1.0, 0.75, 0.32)) * (0.84 + 0.22 * w1); mt = 1.0; rg = 0.2 + 0.12 * w2 - eg * 0.08; a = mix(a, vec3(1.0, 0.93, 0.7), eg * 0.35); cvv += smoothstep(0.8, 0.95, w3) * 0.2; emi += EC * gl * 0.06; }
    if (id == 914) { if (sk == 1) { a = vec3(0.93, 0.92, 0.96); rg = 0.1; cc = 1.0; thru = vec3(0.2, 0.18, 0.24) * 0.3; }
      else if (sk == 2) { a = vec3(0.02, 0.015, 0.03); rg = 0.06; cc = 1.0; }
      else { float sw = vn(vec2(L.x * 3.0 + L.z * 2.0 + tt * 0.35, L.y * 3.0 - tt * 0.25) + sd), frs2 = pow(1.0 - ndv0, 2.2);
        a = mix(vec3(0.045, 0.032, 0.075), vec3(0.15, 0.085, 0.25), smoothstep(0.55, 0.85, sw)) * (0.85 + 0.3 * w1); rg = 0.07 + 0.06 * w2; cc = 1.1;
        emi += vec3(0.32, 0.16, 0.55) * frs2 * 0.55 + EC * gl * 0.05; } }
    if (id == 915) { float th = uKind;
      vec3 w0 = th < 0.5 ? vec3(0.34, 0.2, 0.15) : th < 1.5 ? vec3(0.88, 0.9, 0.95) : vec3(0.96, 0.93, 0.84);
      if (sk == 1) w0 = th < 0.5 ? vec3(0.13, 0.075, 0.075) : th < 1.5 ? vec3(0.33, 0.36, 0.46) : vec3(0.84, 0.78, 0.63);
      float grain = smoothstep(0.35, 0.65, vn(vec2(L.x * 2.0 + L.y * 9.0 + w1 * 1.5, L.z * 0.7) + sd)), ring = abs(fract(L.y * 6.0 + L.x * 3.0 + w1 * 1.3) - 0.5);
      a = w0 * (th < 0.5 ? 0.82 + 0.3 * grain - smoothstep(0.42, 0.5, ring) * 0.15 : 0.95 + 0.06 * grain); a = mix(a, th < 0.5 ? vec3(0.55, 0.36, 0.26) : vec3(1.0), eg * 0.3);
      rg = th < 0.5 ? 0.38 - 0.1 * grain : 0.2; cc = th < 0.5 ? 0.45 : 0.9; }
    if (id == 916) { float th = uKind, s0 = floor(L.y * 7.0 + sd), hb = hs(vec2(s0, sd)), dv = smoothstep(0.42, 0.5, abs(fract(L.y * 7.0 + sd) - 0.5));
      vec3 c0 = th < 0.5 ? vec3(0.42, 0.13, 0.24) : th < 1.5 ? vec3(0.24, 0.29, 0.44) : vec3(0.97, 0.96, 0.92), c1 = th < 0.5 ? vec3(0.18, 0.23, 0.36) : th < 1.5 ? vec3(0.92, 0.93, 0.96) : vec3(0.95, 0.86, 0.6);
      vec3 c2 = th < 0.5 ? vec3(0.24, 0.35, 0.27) : th < 1.5 ? vec3(0.56, 0.62, 0.76) : vec3(0.8, 0.86, 1.0), c3 = th < 0.5 ? vec3(0.48, 0.35, 0.16) : th < 1.5 ? vec3(0.36, 0.37, 0.48) : vec3(0.92, 0.85, 1.0), c4 = th < 0.5 ? vec3(0.3, 0.22, 0.42) : th < 1.5 ? vec3(0.72, 0.76, 0.86) : vec3(1.0, 0.92, 0.8);
      a = sk == 1 ? c1 : sk == 2 ? c2 : sk == 3 ? c3 : sk == 4 ? c4 : c0; a *= (0.82 + 0.3 * hb) * (0.9 + 0.12 * w2); cvv += dv * 0.4; rg = 0.48; cc = 0.25; }
    if (id == 917) { a = (sk == 1 ? vec3(0.7, 0.73, 0.8) : vec3(0.93, 0.94, 0.98)) * (0.9 + 0.12 * w1); mt = 0.45; rg = 0.2 + 0.1 * w2 + (sk == 1 ? 0.1 : 0.0); a = mix(a, vec3(1.0), eg * 0.3); cc = 0.6; emi += a * uAmb * 0.08; }
    if (id == 918) { float u = edge, v = clamp(ao, 0.0, 1.0), dv = abs(v - 0.5) * 2.0; occ = 1.0; eg = 0.0;
      float barb = smoothstep(0.3, 0.5, abs(fract(u * 22.0 + dv * 3.2 + vn(vec2(u * 9.0, v * 3.0) + sd) * 0.5) - 0.5)), shaft = 1.0 - smoothstep(0.03, 0.07, dv);
      a = (sk == 1 ? vec3(0.86, 0.88, 0.93) : vec3(0.98, 0.97, 1.0)) * (0.9 + 0.1 * barb); a = mix(a, vec3(0.82, 0.78, 0.88), (1.0 - u) * 0.25 + dv * dv * 0.12); a = mix(a, vec3(0.93, 0.86, 0.66), shaft * 0.6);
      cvv += barb * 0.05 * (1.0 - shaft); rg = 0.62; thru = vec3(0.5, 0.48, 0.55) * 0.45; emi += a * uAmb * 0.2; }
    if (id == 919) { if (sk == 1) { a = vec3(0.97, 0.87, 0.6) * (0.92 + 0.1 * w1); rg = 0.22; cc = 1.0; thru = vec3(0.3, 0.22, 0.1) * 0.25; }
      else { float fold = 0.5 + 0.5 * sin(atan(L.y, L.x) * 7.0 + w1 * 2.0 + L.z * 1.5); a = vec3(0.97, 0.96, 0.93) * (0.9 + 0.08 * w2); cvv += fold * 0.16; rg = 0.7; thru = vec3(0.4, 0.37, 0.3) * 0.35; emi += a * uAmb * 0.16; } }
    if (id == 920) { vec3 d = normalize(L); float c = d.x, iris = smoothstep(0.7, 0.74, c), pup = smoothstep(uKind > 2.5 ? 0.9 : 0.93, uKind > 2.5 ? 0.93 : 0.96, c);
      vec3 ic = uKind < 0.5 ? vec3(0.22, 0.42, 0.95) : uKind < 1.5 ? vec3(1.0, 0.52, 0.16) : vec3(0.95, 0.72, 0.22); float ir = vn(vec2(atan(d.y, d.z) * 3.0, c * 20.0) + sd);
      a = vec3(0.95, 0.94, 0.97); if (uKind < 2.5) { a = mix(a, ic * (0.6 + 0.6 * ir) * (0.7 + 0.5 * smoothstep(0.74, 0.92, c)), iris); emi += ic * iris * (1.0 - pup) * (0.08 + 0.5 * gl); }
      a = mix(a, vec3(0.015, 0.012, 0.02), pup); a *= 1.0 - (1.0 - smoothstep(0.66, 0.7, c)) * smoothstep(0.62, 0.7, c) * 0.25 * step(uKind, 2.5); rg = 0.08; cc = 1.2; }
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0), wrap = max(0.0, (ndl0 + 0.45) / 1.45);
    vec3 key = uAmb, ambC = mix(uAmb * 0.2 + vec3(0.06, 0.05, 0.08), uRim * 0.18 + uAmb * 0.26 + vec3(0.06, 0.05, 0.07), 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ);
    float nh = max(0.0, dot(n, hq0)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr2 = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr2, uUP);
    vec3 envC = ru > 0.0 ? mix(uAmb * 0.48, uRim * 0.45 + uAmb * 0.2, smoothstep(0.0, 0.6, ru)) : mix(uAmb * 0.42, uAmb * 0.18 + vec3(0.04, 0.03, 0.05), smoothstep(0.0, -0.4, ru));
    envC += uAmb * 1.2 * smoothstep(0.86, 0.97, dot(rr2, uLS)) / (1.0 + rg * 5.0);
    vec3 Fr = mix(mix(vec3(0.04), a, mt), vec3(1.0), frs * (1.0 - rg * 0.6));
    vec3 col = a * (1.0 - mt * 0.82) * (mix(ndl, wrap, 0.55) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (Fr * (0.35 + 0.65 * mt) + 0.65 * (1.0 - mt) * Fr);
    if (cc > 0.0) col += cc * (pow(nh, 200.0) * 3.0 * ndl + 0.3 * frs * envC) * occ;
    col += thru * (0.6 + 0.4 * max(0.0, -ndl0)) * uAmb;
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.5 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.4);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * 0.7, dead * 0.75); }
    col += emi * (1.0 - dead * 0.9) + vec3(1.0, 0.98, 0.95) * clamp(uGlow2, 0.0, 1.0) * (0.3 + 0.5 * pow(1.0 - ndv0, 2.0));
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</LM-LIB-MAT>*/
  /*<AM-AUR-MAT ids 710..729 (v470 AM: 20s6f-aur-brood-gl.js, Rift 05's brood baked into sprite frames once). Its passes carry the land's key light in uAmb and its rim in uRim (the Split Iceberg's cold moonlight and aurora green, the Observatory's pale key and bright green, the Whiteout's white sun and amber). 710 rime shell (faceted frosted ice: bright facet rims by the facet's edge weight, frost, a cold glow through it; .1 ice blue, .2 snow white), 711 navy chitin (glossy deep navy; .1 matte navy hide: a yeti's face and hands), 712 light (emissive only: uKind 0 aurora green, 1 ice white, 2 amber, 3 white; uGlow its strength), 713 a veil ray's membrane (pale blue, see-through, fine veins fanning from its middle, a sheen; .1 a green ribbon, .2 an ice ribbon: lit edges), 714 clear ice (a crystal's vA.z 1 - its place along: frosted root, clear tip, aurora green rising inside by uGlow), 715 a dark core (black glass, green light swirling inside by uGlow), 716 shaggy fur (white strands, blue in the hollows; .1 the back limbs' greyer fur), 718 block ice (bevelled slabs: cracks inside, frosted faces, bright bevels; .1 deep blue, .2 pale; uSpill green cracks of light), 720 snow (bright, glinting), 721 enamel (fangs), 722 an ice horn (ridged along vA.z), 723 glacier rock (blue-grey, snow dust on its tops); uGlow2 a white flash, uWear the part's seed>*/
  else if (id >= 710 && id <= 729) {   // ---- (v470 AM) the Pale Aurora's brood
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, gl = clamp(uGlow, 0.0, 3.0), fa = 1.0, dead = clamp(uFx, 0.0, 1.0);
    vec3 GR = vec3(0.42, 1.25, 0.82), IW = vec3(0.8, 1.05, 1.3), AM = vec3(1.4, 0.82, 0.3);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    vec3 hq0 = normalize(uLK + uV);
    if (id == 712) { vec3 ec = uKind < 0.5 ? GR : uKind < 1.5 ? IW : uKind < 2.5 ? AM : vec3(1.3, 1.28, 1.25); float fl = 0.88 + 0.24 * vn(L.xy * 9.0 + L.z * 5.0 + vec2(tt * 1.3, -tt));
      vec3 c = mix(ec * 0.85, vec3(1.65, 1.7, 1.65), pow(ndv0, 2.2) * 0.65) * (0.5 + 0.75 * gl) * fl;
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.1), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.6, cvv = 0.0, cc = 0.0, occ = clamp(ao, 0.0, 1.0) * 0.4 + 0.6;
    if (id == 714 || id == 713) occ = 1.0;
    if (id == 710) { float eg = smoothstep(0.78, 1.0, edge), fr = vn(L.xy * 17.0 + L.z * 9.0 + sd);
      vec3 base = sk == 1 ? vec3(0.42, 0.64, 0.82) : sk == 2 ? vec3(0.97, 0.98, 1.0) : vec3(0.76, 0.88, 0.96);
      a = base * (0.9 + 0.14 * w1) * (0.94 + 0.1 * fr); a = mix(a, vec3(1.0), eg * 0.55); rg = 0.22 + 0.2 * fr; cc = 0.65; thru = vec3(0.35, 0.6, 0.85) * 0.22;
      cvv += smoothstep(0.86, 0.95, w3) * 0.15; emi += IW * eg * 0.12 + GR * gl * 0.12 * (1.0 - eg); }
    else if (id == 711) { if (sk == 1) { a = vec3(0.07, 0.1, 0.19) * (0.85 + 0.3 * w2) * (0.92 + 0.12 * w3); rg = 0.62; cc = 0.1; }
      else { float bd = smoothstep(0.1, 0.0, abs(fract(L.x * 3.2 + 0.3 * w1) - 0.5) - 0.38); a = vec3(0.06, 0.1, 0.21) * (0.85 + 0.25 * w1); a *= 1.0 - 0.3 * bd; cvv += bd * 0.25; rg = 0.2 + 0.1 * w2; cc = 0.8; a += vec3(0.08, 0.12, 0.2) * clamp(edge, 0.0, 1.0); } }
    else if (id == 713) { vec2 q = L.xy; float ang = atan(q.y, q.x), vein = smoothstep(0.06, 0.0, abs(fract(ang * 2.55 + length(q) * 0.6) - 0.5) - 0.44) * smoothstep(0.08, 0.3, length(q)), frs = pow(1.0 - ndv0, 2.5);
      if (sk == 0) { a = mix(vec3(0.6, 0.78, 0.92), vec3(0.88, 0.95, 1.0), smoothstep(-0.2, 0.7, hm) * 0.6 + 0.2 * w1); a = mix(a, vec3(1.0), vein * 0.4); rg = 0.18; cc = 0.7; thru = vec3(0.4, 0.75, 0.95) * 0.45; emi += IW * frs * 0.18 + GR * gl * 0.06; }
      else { float eg = smoothstep(0.5, 1.0, abs(L.y) / 0.05); vec3 rc = sk == 1 ? vec3(0.62, 0.98, 0.82) : vec3(0.82, 0.93, 1.0); a = rc * (0.85 + 0.2 * w1); rg = 0.3; cc = 0.4; thru = rc * 0.4; emi += (sk == 1 ? GR : IW) * (0.18 + 0.3 * gl) * (0.6 + 0.4 * eg); } }
    else if (id == 714) { float tp = sk == 1 ? 0.8 : clamp(1.0 - ao, 0.0, 1.0), eg = smoothstep(0.75, 1.0, edge), frs = pow(1.0 - ndv0, 3.0);
      a = mix(vec3(0.58, 0.78, 0.92), vec3(0.92, 0.98, 1.0), tp) * (0.86 + 0.18 * w1); rg = 0.08; cc = 1.0; thru = mix(vec3(0.12, 0.36, 0.66), vec3(0.55, 0.88, 1.05), tp) * 0.5;
      emi += vec3(0.8, 0.97, 1.15) * eg * 0.42 + IW * frs * 0.22 + GR * gl * (0.12 + 0.45 * tp) * (0.7 + 0.3 * sin(tt * 2.0 + L.z * 3.0 + sd)); a = mix(a, vec3(1.0), smoothstep(0.7, 0.92, hm + 0.4 * w3) * 0.3); }
    else if (id == 715) { vec3 p = normalize(L); float sw = vn(vec2(atan(p.y, p.x) * 2.0 + tt * 0.8 + p.z * 2.0, p.z * 3.0 - tt * 0.5) + sd), core = pow(ndv0, 3.0);
      a = vec3(0.012, 0.02, 0.04); rg = 0.06; cc = 1.0; emi += GR * (0.12 + 0.9 * gl) * (smoothstep(0.55, 0.9, sw) * 0.7 + core * 0.55) + vec3(0.6, 1.0, 0.85) * pow(core, 4.0) * gl * 0.5; }
    else if (id == 716) { float an = atan(L.y, L.x), str = vn(vec2(an * 9.0 + w1 * 2.0, L.z * 26.0) + sd), str2 = vn(vec2(an * 23.0, L.z * 60.0 + w2 * 3.0) + sd * 1.7), dk = sk == 1 ? 0.88 : 1.0;
      a = mix(vec3(0.7, 0.82, 0.93), vec3(1.0, 1.0, 1.0), 0.45 + 0.4 * str + 0.15 * str2) * dk; a = mix(a, vec3(0.55, 0.72, 0.88), (1.0 - occ) * 1.2); rg = 0.82; cc = 0.0; cvv += smoothstep(0.35, 0.1, str) * 0.16; thru = a * vec3(0.22, 0.26, 0.32);
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 13.0 + sd), vn(L.zx * 13.0 + 3.0), vn(L.xy * 13.0 + 7.0)) - 0.5) * 0.45); emi += vec3(0.6, 0.7, 0.85) * pow(1.0 - ndv0, 3.0) * 0.12; }
    else if (id == 718) { float eg = clamp(edge, 0.0, 1.0), crk = smoothstep(0.035, 0.0, abs(vn(L.xy * 2.6 + L.z * 1.9 + sd) - 0.5)) * (0.4 + 0.6 * w2), crk2 = smoothstep(0.03, 0.0, abs(vn(L.yz * 5.0 + L.x * 2.0 + sd * 1.3) - 0.5)), frs = pow(1.0 - ndv0, 3.0);
      vec3 base = sk == 1 ? vec3(0.32, 0.55, 0.78) : sk == 2 ? vec3(0.7, 0.87, 0.98) : vec3(0.5, 0.74, 0.9);
      a = base * (0.88 + 0.16 * w1); a = mix(a, a * vec3(0.55, 0.72, 0.9), (crk + crk2 * 0.6) * 0.6); a = mix(a, vec3(1.0), eg * 0.35 + smoothstep(0.8, 0.97, hm) * 0.15); rg = 0.16 + 0.15 * w3; cc = 0.85; thru = base * 0.3;
      emi += IW * frs * 0.15 + GR * clamp(uSpill, 0.0, 1.0) * (crk + crk2) * (0.8 + 0.6 * gl) + GR * gl * 0.05; }
    else if (id == 720) { float gl3 = step(0.93, hs(floor(L.xy * 40.0 + L.z * 17.0) + sd)); a = vec3(0.95, 0.97, 1.0) * (0.92 + 0.08 * w2); a = mix(a, vec3(0.7, 0.8, 0.92), (1.0 - occ) * 0.9); rg = 0.75; emi += a * 0.16 + vec3(1.0) * gl3 * pow(max(0.0, dot(n, hq0)), 8.0) * 0.6; }
    else if (id == 721) { a = vec3(0.95, 0.94, 0.9) * (0.92 + 0.1 * w1); rg = 0.25; cc = 0.6; }
    else if (id == 722) { float rib = smoothstep(0.25, 0.5, abs(fract(clamp(ao, 0.0, 1.0) * 9.0) - 0.5)), tp = clamp(ao, 0.0, 1.0);
      a = mix(vec3(0.5, 0.7, 0.83), vec3(0.85, 0.95, 1.0), tp) * (0.78 + 0.28 * rib); rg = 0.18; cc = 0.8; thru = vec3(0.3, 0.55, 0.8) * 0.3; cvv += (1.0 - rib) * 0.2; emi += IW * pow(1.0 - ndv0, 3.0) * 0.18; }
    else { float eg = clamp(edge, 0.0, 1.0), top = smoothstep(0.45, 0.8, hm + 0.25 * w2); a = vec3(0.15, 0.13, 0.25) * (0.75 + 0.45 * w1) * (0.9 + 0.2 * w3); a = mix(a, vec3(0.92, 0.95, 1.0), top * 0.85); a += vec3(0.15, 0.17, 0.2) * eg * (1.0 - top); rg = 0.6 - top * 0.1; cc = 0.1;
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 9.0 + sd), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.2); }
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0), wrap = max(0.0, (ndl0 + 0.4) / 1.4);
    vec3 key = uAmb, ambC = mix(uAmb * 0.2 + vec3(0.06, 0.08, 0.12), uRim * 0.16 + uAmb * 0.2 + vec3(0.04, 0.06, 0.1), 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ);
    float nh = max(0.0, dot(n, hq0)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr2 = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr2, uUP);
    vec3 envC = ru > 0.0 ? mix(uAmb * 0.5, uRim * 0.4 + vec3(0.08, 0.1, 0.14), smoothstep(0.0, 0.6, ru)) : mix(uAmb * 0.55, vec3(0.1, 0.12, 0.16), smoothstep(0.0, -0.4, ru));
    envC += uAmb * 1.1 * smoothstep(0.86, 0.97, dot(rr2, uLS)) / (1.0 + rg * 5.0);
    vec3 col = a * (mix(ndl, wrap, 0.5) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (0.04 + 0.96 * frs * (1.0 - rg * 0.6));
    if (cc > 0.0) col += cc * (pow(nh, 200.0) * 3.0 * ndl + 0.3 * frs * envC) * occ;
    col += thru * (0.6 + 0.4 * max(0.0, -ndl0));
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.5 * occ;
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.4);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * 0.7, dead * 0.75); }
    col += emi * (1.0 - dead * 0.9) + vec3(1.0, 0.98, 0.95) * clamp(uGlow2, 0.0, 1.0) * (0.3 + 0.5 * pow(1.0 - ndv0, 2.0));
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha * fa, uAlpha * fa); return; }
  /*</AM-AUR-MAT>*/
  /*<YB-YUG-MAT ids 850..889 (v472 YB: 20z7a-khaal-gl.js, 20z8a-ixvorra-gl.js, 20z9a-nyarzhul-gl.js, the Yuggoth Engine's bosses). Lit by YUG3's passes in their arenas' light (the key's colour in uAmb, the rim's in uRim; 850..859 the Breach: the void's violet above, the grey deck below; 860..869 the Capacitor Hall: dark steel above, the teal coolant's light below; 870..889 the Core Chamber: flesh-lit dark). Every pattern from the surface's own coordinates (vA, or the local position of a still mesh), never the moving position.
     KH'AAL 850 hull plate (.0 the carapace: vA.y its turn / 2pi, vA.z its radius in the dome's unit disc: the 2D's rings of plates (a heptagon, six, eleven), seams with violet current (uGlow), rivets, scratches, heat tint, an oily sheen, the torn panel's glowing pit, the rolled lip; .2 a palm (local), .3 a cuff (local: x along 0..1), .4 the plate it holds (vA.y across, vA.z its height, + 2 its back; uSpill the clang), .8 a hull shard). 851 chitin (.0 a leg or an arm: vA.y round, vA.z along in segments; .2 the belly; .4 knobs, fingers, the mouth's parts; .6 a spur; .8 a palp's flesh). 852 the brain-lobe (vA.y how deep in a fold, vA.z the fissure; uKind its hue 0..3 teal violet amber, uGlow its light, uSpill the stagger's flicker). 853 fungus (.0 the skirt: vA.y down it, vA.z round it (+ 2 inside); .2 a cushion; .4 a wing's membrane: vA.y s along the span, vA.z q along the chord, torn through; .6 a cap; .8 a wing's spar). 854 a shear blade (local: x along, y to its back, the honed edge lit by uGlow). 855 a lens (copies: 0, 1 the stalk eyes (local x the gaze), 2..5 the small eyes, 6 the hinge lamp, 7 the mouth's slag; uKind 1 the stagger's white). 856 a tooth.
     uGlow2 a blow's flash, uFx the death's fade, uWear the part's seed>*/
  else if (id >= 850 && id <= 889) {
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), tt = uTime, gl = clamp(uGlow, 0.0, 3.0), dead = clamp(uFx, 0.0, 1.0), fl2 = clamp(uGlow2, 0.0, 1.0), sd = uWear * 17.0, hm = dot(n, uUP);
    float inst = floor((ao + 0.01) * 0.25), loc = ao - inst * 4.0;
    vec3 VIO = vec3(0.6, 0.3, 1.0), VIH = vec3(0.92, 0.74, 1.05), TEA = vec3(0.18, 0.85, 0.78), TEH = vec3(0.72, 1.0, 0.95), AMB = vec3(1.0, 0.66, 0.22), SLG = vec3(1.0, 0.42, 0.12);
    vec3 a = vec3(0.5), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.5, cc = 0.0, cvv = 0.0, occ = 1.0, spk = 0.0, met = 0.0; vec2 tex = L.xy * 6.0;
    float ssk = 0.0, shb = 0.0, chr = 0.0, shd = 1.0;   // (v472c YB: light under the skin, a broad wet sheen, chrome's room reflections, a painted contact shadow on the key)
    // ---- the lights: emissive
    if (id == 855) { vec3 c; float lx = edge * 2.0 - 1.0, ly = loc / 3.8 * 2.0 - 1.0; vec3 lp = vec3(lx, ly, sqrt(max(0.0, 1.0 - lx * lx - ly * ly)));   // (v472b YB: the eye's own direction from its attributes: copies are written in the world)
      if (inst < 1.5) { float st = uKind; float pup = smoothstep(0.62, 0.7, lp.x) * smoothstep(0.2, 0.08, abs(lp.y)), iris = smoothstep(0.35, 0.55, lp.x);
        c = mix(vec3(0.03, 0.12, 0.12), mix(TEA, TEH, pow(max(0.0, lp.x), 3.0)) * 1.3, iris); c = mix(c, vec3(1.6), st * iris * 0.8); c = mix(c, vec3(0.01, 0.02, 0.03), pup * (1.0 - st));
        c += vec3(1.0) * pow(max(0.0, dot(reflect(-uV, n), uLK)), 60.0) * 1.2; }
      else if (inst < 5.5) c = mix(vec3(0.04, 0.2, 0.2), mix(TEA, TEH, pow(ndv0, 2.0)) * 1.4, smoothstep(0.1, 0.6, ndv0)) + (uKind > 0.5 ? vec3(0.8) : vec3(0.0));
      else if (inst < 6.5) c = mix(VIO, VIH * 1.5, pow(ndv0, 1.5)) * (0.8 + 0.3 * sin(tt * 6.0));
      else c = mix(SLG, vec3(1.6, 1.25, 0.7), pow(ndv0, 1.4)) * (0.6 + 0.7 * clamp(uSpill, 0.0, 1.0)) * (0.85 + 0.15 * sin(tt * 17.0));
      c *= 0.55 + 0.45 * gl; c += vec3(1.0) * fl2 * 0.25; c = mix(c, vec3(0.05, 0.04, 0.06), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    // ---- KH'AAL's solids
    if (id == 850) { met = 0.78; rg = 0.36; cc = 0.32;
      if (sk == 0) { float th = edge * 6.28318, rho = ao, h7 = 0.32 * cos(0.448799) / cos(mod(th - 0.3, 0.897598) - 0.448799), ring = 0.0, pin = 0.0, d = 0.0, pu = 0.0, pv = 0.5;
        if (rho < h7) { d = (h7 - rho) * 2.1; pu = rho / h7; }
        else { bool two = rho >= 0.66; float nn = two ? 11.0 : 6.0, off = two ? 0.05241 : 0.16951, w = 6.28318 / nn, x = mod(th - off, 6.28318), fi = floor(x / w), f = x / w - fi, r0 = two ? 0.66 : h7, r1 = two ? 1.0 : 0.66;
          ring = two ? 2.0 : 1.0; pin = fi; d = min(min(rho - r0, two ? 9.0 : r1 - rho) * 2.1, min(f, 1.0 - f) * w * rho * 2.1); pu = (rho - r0) / (r1 - r0); pv = f; }
        float pid = ring * 13.0 + pin, h1 = hs(vec2(pid, 3.7)), h2 = hs(vec2(pid, 9.1)), torn = (ring > 1.5 && abs(pin - 2.0) < 0.5) ? 1.0 : 0.0, fung = ((ring > 1.5 && (abs(pin - 5.0) < 0.5 || abs(pin - 9.0) < 0.5)) || (ring > 0.5 && ring < 1.5 && abs(pin - 1.0) < 0.5)) ? 1.0 : 0.0;
        vec3 P0 = vec3(0.4, 0.44, 0.57), P1 = vec3(0.46, 0.5, 0.63), P2 = vec3(0.35, 0.39, 0.51), P3 = vec3(0.43, 0.4, 0.57), P4 = vec3(0.5, 0.54, 0.68);
        float ci = floor(h1 * 5.0); a = ci < 0.5 ? P0 : ci < 1.5 ? P1 : ci < 2.5 ? P2 : ci < 3.5 ? P3 : P4; a *= 0.92 + 0.12 * h2;
        vec2 mm = L.xy; tex = mm * 9.0; float g1 = vn(mm * 3.0 + pid), g2 = vn(mm * 11.0 + 3.0 * pid), scr = pow(vn(vec2(mm.x * 55.0 + mm.y * 13.0 + pid * 7.0, mm.y * 4.0 - mm.x)), 16.0), scr2 = pow(vn(vec2(mm.y * 48.0 - mm.x * 9.0, mm.x * 3.0) + pid), 18.0);
        a *= 0.88 + 0.16 * g1; a = mix(a, a * 1.5 + 0.08, (scr + scr2) * 0.6); rg = mix(0.36, 0.22, scr + scr2) + 0.1 * g2;
        // scorch and rust patches, heat tint round the seams, the oily film
        float sco = smoothstep(0.62, 0.78, vn(mm * 2.2 + pid * 1.3 + 40.0)); a = mix(a, vec3(0.14, 0.1, 0.13), sco * 0.6); rg = mix(rg, 0.6, sco * 0.6);
        float ht = exp(-(d - 0.07) * (d - 0.07) / 0.0025) * (0.5 + 0.5 * h2); vec3 film = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + d * 9.0 + h1)); a = mix(a, a * film * 1.4, ht * 0.35);
        // the seams: dark grooves, violet current running in them; the plates' edges bevelled bright
        float s1 = smoothstep(0.0, 0.05, d), core = exp(-d * d / 0.0005), bev = (1.0 - smoothstep(0.05, 0.11, d)) * s1;
        a *= 0.78; a = mix(a * 0.12, a, s1); cvv += (1.0 - s1) * 0.55; a = mix(a, a * 1.45 + 0.06, bev * 0.55); rg = mix(rg, 0.18, bev * 0.6);
        float run = pow(max(0.0, sin(th * 7.0 - tt * 2.6 + ring * 2.1 + rho * 9.0)), 24.0);
        emi += mix(VIO, VIH, core) * core * gl * (0.75 + 0.35 * sin(tt * 3.0 + th * 5.0 + ring)) * 1.15 + VIH * core * run * 1.6 + VIO * (1.0 - s1) * gl * 0.18;
        // rivets in a band inside each plate's edge
        vec2 rc = mm / 0.21, ri = floor(rc), rf = fract(rc) - 0.5; float band = smoothstep(0.07, 0.085, d) * (1.0 - smoothstep(0.13, 0.15, d)), rv = smoothstep(0.3, 0.2, length(rf)) * band, rh = smoothstep(0.17, 0.05, length(rf - vec2(-0.07, 0.07))) * band;
        a = mix(a, vec3(0.08, 0.09, 0.12), rv * 0.7); a = mix(a, vec3(0.85, 0.88, 0.98), rh * 0.8); if (uLow < 0.5) n = normalize(n + (uM0 * rf.x + uM1 * rf.y) * rv * 1.4);
        // the torn panel: a pit, violet light inside, cables across it, its edge torn bright
        if (torn > 0.5) { float pit = smoothstep(0.03, 0.09, d), lip = exp(-(d - 0.035) * (d - 0.035) / 0.000225), puls = 0.5 + 0.5 * sin(tt * 3.1);
          vec2 cq = vec2(pu, pv); float cab = 0.0; for (int k = 0; k < 3; k++) { float fk = float(k), yy = 0.25 + fk * 0.25 + 0.06 * sin(cq.x * 9.0 + fk * 2.0); cab = max(cab, smoothstep(0.045, 0.02, abs(cq.y - yy))); }
          a = mix(a, vec3(0.05, 0.02, 0.07), pit); emi += VIO * pit * (0.45 + 0.4 * puls) * (0.5 + 0.5 * gl) * (1.0 - cab) + VIH * pit * pow(1.0 - pu, 2.0) * 0.3 * gl; a = mix(a, vec3(0.03, 0.02, 0.04), cab * pit); cvv += pit * 0.2;
          a = mix(a, vec3(0.8, 0.82, 0.92), lip * 0.6); rg = mix(rg, 0.15, lip); }
        if (fung > 0.5) { float fs = smoothstep(0.55, 0.85, vn(mm * 6.0 + 2.0)) * smoothstep(0.05, 0.2, d); a = mix(a, vec3(0.55, 0.28, 0.42), fs * 0.5); rg = mix(rg, 0.6, fs * 0.5); }
        if (rho > 1.0) { float e2 = clamp((rho - 1.0) / 0.06, 0.0, 1.0); a = mix(a, vec3(0.2, 0.2, 0.27), 0.7); a = mix(a, vec3(0.75, 0.78, 0.9), exp(-(e2 - 0.15) * (e2 - 0.15) / 0.0144) * 0.5); }
        spk += 0.25 + bev * 0.6; }
      else if (sk == 2 || sk == 3) { vec3 q = L; float d = 1.0, sm = 0.0; tex = q.xz * 7.0; met = 0.55;
        if (sk == 2) { d = min(abs(q.x + 0.4), abs(q.x - 0.3)) * 1.0; sm = 1.0; } else { d = min(q.x, 1.0 - q.x) * 0.7; }
        a = vec3(0.45, 0.49, 0.62) * (0.88 + 0.16 * vn(q.xy * 5.0 + sd)); float s1 = smoothstep(0.0, 0.03, d), core = exp(-pow(d / 0.012, 2.0));
        a = mix(a * 0.2, a, s1); cvv += (1.0 - s1) * 0.4; emi += mix(VIO, VIH, core) * core * gl * 1.1 * sm + VIO * core * gl * 0.6 * (1.0 - sm);
        float an = atan(q.z, q.y), rc = fract(an / 6.28318 * 10.0) - 0.5, rv = smoothstep(0.22, 0.12, length(vec2(rc, (sk == 2 ? fract(q.x * 3.0) - 0.5 : min(q.x, 1.0 - q.x) - 0.12) * 2.2))); a = mix(a, vec3(0.06, 0.07, 0.1), rv * 0.75);
        a = mix(a, a * 1.5 + 0.06, pow(vn(vec2(q.x * 40.0, an * 3.0) + sd), 14.0)); }
      else if (sk == 4) { float u = edge, hgt = ao, back = step(1.5, hgt), hh = back > 0.5 ? hgt - 2.0 : hgt; vec2 mm = vec2(u * 3.0, hh * 2.4); tex = mm * 3.0; met = 0.4; rg = 0.45;
        a = mix(vec3(0.4, 0.44, 0.56), vec3(0.2, 0.22, 0.29), back) * (0.86 + 0.18 * vn(mm * 4.0 + 5.0)); float scr = pow(vn(vec2(mm.x * 30.0 + mm.y * 4.0, mm.y * 3.0)), 14.0); a = mix(a, a * 1.5 + 0.07, scr * 0.6 * (1.0 - back));
        for (int k = 0; k < 2; k++) { float yy = k == 0 ? 0.18 : 0.8, rf = fract(u * 8.0) - 0.5; float rv = smoothstep(0.24, 0.12, length(vec2(rf, (hh - yy) * 6.0))); a = mix(a, vec3(0.07, 0.08, 0.1), rv * 0.75 * (1.0 - back)); }
        float sl = abs(hh - (0.35 + 0.3 * smoothstep(0.3, 0.55, u) - 0.15 * smoothstep(0.55, 0.75, u))), seam = smoothstep(0.035, 0.0, sl) * step(0.33, u) * step(u, 0.78);
        a = mix(a, vec3(0.05, 0.03, 0.06), seam * 0.8); emi += VIH * smoothstep(0.016, 0.0, sl) * step(0.33, u) * step(u, 0.78) * gl * 1.1 * (1.0 - back);
        float dent = exp(-dot(mm - vec2(0.6, 1.55), mm - vec2(0.6, 1.55)) * 9.0); a *= 1.0 - dent * 0.35; cvv += dent * 0.3;
        float topE = smoothstep(0.9, 1.0, hh); a = mix(a, vec3(0.86, 0.9, 1.0), topE * 0.55); emi += vec3(1.0) * clamp(uSpill, 0.0, 1.0) * 0.35 * (1.0 - back); spk += topE; }
      else { vec3 q = L; a = vec3(0.42, 0.45, 0.58) * (0.82 + 0.22 * vn(q.xy * 7.0 + sd)); rg = 0.42; cc = 0.06; met = 0.6;   /* (v472b YB: the shards: no oily film, which tinted them magenta) */ float e1 = smoothstep(0.5, 0.95, edge); a = mix(a, vec3(0.78, 0.82, 0.95), e1 * 0.5); spk += e1; a = mix(a, vec3(0.12, 0.08, 0.12), smoothstep(0.65, 0.8, vn(q.xy * 4.0 + 9.0)) * 0.5); } }
    if (id == 851) { met = 0.0; vec3 lc = vec3(0.13, 0.1, 0.19), hc = vec3(0.3, 0.24, 0.42);
      if (sk == 0) { float al = ao, f = fract(al), jnt = exp(-f * f / 0.0025) + exp(-(f - 1.0) * (f - 1.0) / 0.0025) + 0.6 * exp(-(f - 0.5) * (f - 0.5) / 0.0009); tex = vec2(edge * 9.0, al * 14.0);
        float pit = smoothstep(0.7, 0.85, vn(tex * 2.6 + sd)), mo = vn(tex * 0.7 + sd); a = mix(lc, hc, mo * 0.5) * (1.0 - pit * 0.3); a = mix(a, vec3(0.05, 0.03, 0.07), jnt * 0.7); cvv += jnt * 0.45 + pit * 0.2;
        rg = 0.28 + pit * 0.2; cc = 0.95 * (1.0 - jnt * 0.6); thru = vec3(0.12, 0.04, 0.16) * jnt; spk += 0.1; }
      else if (sk == 2) { tex = L.xy * 8.0; float bnd = smoothstep(0.08, 0.0, abs(fract(L.x * 3.2) - 0.5) - 0.42); a = vec3(0.09, 0.07, 0.12) * (0.85 + 0.2 * vn(tex)); a *= 1.0 - bnd * 0.5; rg = 0.5; cc = 0.4; cvv += bnd * 0.3; }
      else if (sk == 4) { tex = L.xy * 9.0 + L.z * 3.0; a = mix(lc, hc, vn(tex * 0.8 + sd) * 0.45); rg = 0.26; cc = 1.0; spk += 0.1; }
      else if (sk == 6) { float u = clamp(L.x, 0.0, 1.0); a = mix(lc, vec3(0.62, 0.55, 0.72), smoothstep(0.4, 1.0, u)); rg = 0.3; cc = 0.8; }
      else { tex = L.xy * 10.0; a = vec3(0.36, 0.09, 0.25) * (0.85 + 0.25 * vn(tex + sd)); rg = 0.3; cc = 0.85; thru = vec3(0.4, 0.08, 0.2); } }
    if (id == 852) { float g = clamp(edge, 0.0, 1.0), fis = clamp(ao, 0.0, 1.0), k = mod(uKind, 3.0), ki = floor(k), kf = smoothstep(0.0, 1.0, k - ki);
      vec3 h0 = ki < 0.5 ? TEA : ki < 1.5 ? VIO : AMB, h1c = ki < 0.5 ? VIO : ki < 1.5 ? AMB : TEA, hue = mix(vec3(1.0, 0.4, 0.85), mix(h0, h1c, kf), 0.45); hue = mix(hue, vec3(1.0), clamp(uSpill, 0.0, 1.0) * 0.7);   // (v472b YB: a pink-violet glow from within, tinted by the shifting hue)
      tex = L.xy * 7.0 + L.z * 4.0; float wob = vn(tex * 1.5 + sd), sul = smoothstep(0.3, 0.85, g);   // (v472b YB: vA.y now the sulcus: 1 at the bottom of a fold's groove)
      a = mix(vec3(0.96, 0.5, 0.76), vec3(0.72, 0.26, 0.56), smoothstep(0.0, 0.45, g)); a = mix(a, vec3(0.2, 0.03, 0.18), sul * 0.92 + fis * 0.7); a *= 0.92 + 0.12 * wob;
      emi += hue * (sul * 0.85 + fis * 0.6) * (0.35 + 0.5 * gl) + hue * 0.08 * gl * (1.0 - g) + hue * pow(1.0 - ndv0, 2.5) * 0.25 * gl;
      thru = mix(vec3(0.6, 0.15, 0.4), hue, 0.4) * 0.3; rg = 0.22; cc = 1.0; cvv += sul * 0.6; spk += 0.15; }
    if (id == 853) { met = 0.0;
      if (sk == 0) { float dn = edge, ar = ao, lay = step(1.5, ar), au = ar - lay * 2.0; tex = vec2(au * 90.0, dn * 4.0);
        float gill = smoothstep(0.12, 0.0, abs(fract(au * 210.0 + dn * 0.6) - 0.5) - 0.32) * smoothstep(0.1, 0.4, dn);
        a = mix(vec3(0.5, 0.2, 0.4), vec3(0.88, 0.48, 0.72), lay) * (0.85 + 0.2 * vn(tex * 0.5 + sd)); a = mix(a, a * 0.55, gill * 0.6); a = mix(a, vec3(1.0, 0.78, 0.9), smoothstep(0.8, 1.0, dn) * 0.35);
        float spo = step(0.93, hs(floor(tex * vec2(0.6, 3.0)))) * smoothstep(0.3, 0.6, dn); emi += TEA * spo * 0.6 * (0.6 + 0.4 * sin(tt * 3.0 + au * 40.0));
        thru = vec3(0.7, 0.25, 0.45) * 0.8; rg = 0.55; cc = 0.25; cvv += gill * 0.3; }
      else if (sk == 2) { tex = L.xy * 9.0; float bmp = vn(tex * 1.5 + sd), por = smoothstep(0.75, 0.9, vn(tex * 4.0)); a = mix(vec3(0.78, 0.38, 0.6), vec3(1.0, 0.74, 0.88), bmp * 0.6) * (1.0 - por * 0.4); thru = vec3(0.7, 0.25, 0.45) * 0.6; rg = 0.5; cc = 0.4; cvv += por * 0.3; spk += 0.2; }
      else if (sk == 4) { float s = edge, q = ao; tex = vec2(s * 18.0, q * 14.0);
        for (int k = 0; k < 4; k++) { vec3 H = k == 0 ? vec3(0.62, 0.3, 0.06) : k == 1 ? vec3(0.36, 0.52, 0.07) : k == 2 ? vec3(0.8, 0.2, 0.045) : vec3(0.2, 0.62, 0.05); vec2 dd = vec2(s - H.x, (q - H.y) * 0.8); float rr2 = length(dd) / H.z + 0.35 * (vn(vec2(s, q) * 40.0 + float(k) * 3.0) - 0.5); if (rr2 < 0.9) discard; }
        vec2 rt = vec2(s, q - 0.15); float ang = atan(rt.y, rt.x), rad = length(rt), vein = smoothstep(0.06, 0.0, abs(fract(ang * 2.6 + 0.2 * sin(rad * 9.0)) - 0.5) - 0.42) * smoothstep(0.05, 0.2, rad), root = 1.0 - smoothstep(0.0, 0.6, rad);
        a = mix(vec3(0.9, 0.52, 0.76), vec3(0.48, 0.22, 0.42), root * 0.6) * (0.88 + 0.18 * vn(tex * 0.6 + sd)); a = mix(a, vec3(0.42, 0.14, 0.35), vein * 0.75);
        float spo = 0.0; for (int k = 0; k < 3; k++) { vec2 sp = k == 0 ? vec2(0.45, 0.3) : k == 1 ? vec2(0.7, 0.45) : vec2(0.3, 0.7); spo += exp(-dot(vec2(s, q) - sp, vec2(s, q) - sp) * 900.0); }
        emi += TEH * spo * (0.9 + 0.4 * sin(tt * 3.0)) * (0.5 + 0.5 * gl) + vec3(0.9, 0.4, 0.7) * gl * 0.05; thru = vec3(1.0, 0.42, 0.7) * (1.1 - vein * 0.6) * (0.6 + 0.4 * clamp(uSpill, 0.0, 1.0)); rg = 0.5; cc = 0.3; cvv += vein * 0.2; }
      else if (sk == 6) { a = mix(vec3(0.82, 0.7, 0.8), vec3(0.15, 0.7, 0.66), smoothstep(0.0, 0.05, L.z - 0.2)); emi += TEA * smoothstep(0.0, 0.05, L.z - 0.2) * 0.35 * (0.7 + 0.3 * sin(tt * 2.0 + L.x * 20.0)); thru = TEA * 0.4; rg = 0.4; cc = 0.5; spk += 0.3; }
      else { tex = vec2(edge * 6.0, ao * 20.0); a = vec3(0.36, 0.12, 0.28) * (0.85 + 0.25 * vn(tex + sd)); a = mix(a, vec3(0.62, 0.3, 0.52), smoothstep(0.3, 0.0, abs(edge - 0.25)) * 0.4); rg = 0.32; cc = 0.85; thru = vec3(0.5, 0.15, 0.35); } }
    if (id == 854) { met = 0.9; vec3 q = L; float len = 2.4, yb = -0.16 * (1.0 - pow(clamp(q.x / len, 0.0, 1.0), 2.0)) - 0.02, ed = smoothstep(0.1, 0.0, q.y - yb), tip = smoothstep(0.7, 1.0, q.x / len); tex = vec2(q.x * 30.0, q.y * 3.0);
      float scr = pow(vn(vec2(q.x * 70.0, q.y * 6.0 + q.z * 40.0) + sd), 12.0); a = vec3(0.42, 0.45, 0.58) * (0.86 + 0.16 * vn(q.xy * 6.0 + sd)); a = mix(a, vec3(0.86, 0.9, 1.0), ed * 0.8 + scr * 0.4); rg = mix(0.3, 0.12, ed);
      a = mix(a, vec3(0.2, 0.2, 0.28), smoothstep(0.25, 0.42, q.y) * 0.5); emi += VIH * smoothstep(0.03, 0.0, q.y - yb) * gl * (0.8 + 0.4 * sin(tt * 9.0 + q.x * 6.0)) + VIO * ed * gl * 0.2; cc = 0.3; spk += 0.5 + tip; }
    if (id == 856) { a = vec3(0.88, 0.84, 0.92) * (0.9 + 0.1 * vn(L.xy * 30.0)); rg = 0.35; cc = 0.4; thru = vec3(0.4, 0.35, 0.45); spk += 0.3; }
    // ---- IX-VORRA (v472 YB): 860 a ring segment (vA.y its section: floor(8 x) the face (1 and 5 the flat faces, 7 the outer rim, 3 the inner, the rest chamfers), vA.z its place along + 2 x its index; uWear the split (the odd ones teal), uKind the parting, uSpill the menace), 861 the plasma core (vA.y round, vA.z down; uSpill the parting), 862 an eye (copies, local x the gaze; its iris by its index), 863 a lid (.2 its rim), 864 a copper cable (vA.y round, vA.z along + 2 x its index; uSpill its pulse's place), 865 a lamp (copies: 0..19 violet, 20..39 teal, 40..49 amber running lights, 50..55 the cables' tips)
    if (id == 865) { vec3 c = inst < 19.5 ? mix(VIO, VIH * 1.6, pow(ndv0, 1.4)) : inst < 39.5 ? mix(TEA, TEH * 1.5, pow(ndv0, 1.4)) : mix(AMB, vec3(1.6, 1.4, 1.0), pow(ndv0, 1.3));
      c *= 0.7 + 0.3 * sin(tt * 7.0 + inst * 1.7); c += vec3(1.0) * fl2 * 0.25; gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 860) { met = 0.8; rg = 0.34; cc = 0.35; float face = floor(edge * 8.0 + 0.001), fu = fract(edge * 8.0), seg = floor(ao * 0.5 + 0.001), al = ao - seg * 2.0, flatF = (abs(face - 1.0) < 0.5 || abs(face - 5.0) < 0.5) ? 1.0 : 0.0, rimF = (abs(face - 7.0) < 0.5 || abs(face - 3.0) < 0.5) ? 1.0 : 0.0, chm = 1.0 - max(flatF, rimF);
      float tl = (mod(seg, 2.0) > 0.5 && uWear > 0.5) ? 1.0 : 0.0; vec3 sc = mix(VIO, TEA, tl), sch = mix(VIH, TEH, tl); tex = vec2(al * 22.0, fu * 3.0 + seg * 5.0);
      /* (v472c YB) blackened steel, brushed along and scratched; machined chamfers polished bright with a crisp line at each edge, worn; panel lines with a lit lip; grooves on the outer rim; bolts; the channel's crisp core, its light bleeding onto the steel; electrodes on the inner face, the core's violet mirrored there */
      float hsg = hs(vec2(seg, 2.0)), g1 = vn(vec2(al * 9.0, fu * 40.0) + seg * 3.0), scr = pow(vn(vec2(al * 90.0 + fu * 7.0, fu * 4.0 + seg)), 14.0) + pow(vn(vec2(al * 60.0 - fu * 11.0, fu * 9.0 + seg * 2.0)), 16.0);
      a = mix(vec3(0.07, 0.075, 0.095), vec3(0.16, 0.17, 0.21), g1 * 0.7 + hsg * 0.3); rg = 0.34 + 0.1 * g1; met = 0.85; cc = 0.25;
      float chE = chm * (exp(-fu * fu / 0.004) + exp(-(1.0 - fu) * (1.0 - fu) / 0.004)), wr = chm * smoothstep(0.45, 0.8, vn(vec2(al * 50.0, fu * 4.0) + seg * 7.0));
      a = mix(a, vec3(0.42, 0.44, 0.5), chm * 0.55); a = mix(a, vec3(0.86, 0.89, 0.96), max(chE * 0.8, wr * 0.25)); rg = mix(rg, 0.14, chm * 0.8); a = mix(a, a * 1.6 + 0.06, min(1.0, scr) * 0.3 * (0.4 + 0.6 * chm)); a *= 1.0 - rimF * 0.2;
      float pl = smoothstep(0.012, 0.0, min(abs(al - 0.33), abs(al - 0.66))) * flatF, lipL = (smoothstep(0.024, 0.01, abs(al - 0.348)) + smoothstep(0.024, 0.01, abs(al - 0.678))) * flatF * (1.0 - pl); a *= 1.0 - pl * 0.85; a = mix(a, vec3(0.6, 0.62, 0.7), lipL * 0.45); cvv += pl * 0.5;
      float grv = abs(face - 7.0) < 0.5 ? smoothstep(0.1, 0.0, abs(fract(fu * 3.0) - 0.5) - 0.36) : 0.0; a *= 1.0 - grv * 0.6; cvv += grv * 0.3;
      float topF = flatF, fc = abs(face - 1.0) < 0.5 ? fu - 0.36 : fu - 0.64, chan = exp(-fc * fc / 0.032) * topF, core = exp(-fc * fc / 0.011) * topF, bleed = exp(-fc * fc / 0.06) * topF, run = pow(max(0.0, sin(al * 9.0 - tt * 4.0 + seg * 1.3)), 16.0), k = (0.6 + 0.4 * sin(tt * 3.0 + seg * 1.3)) * (1.0 - clamp(uKind, 0.0, 1.0) * 0.7);   // (v472c YB: the channel along the top, toward its outer edge as the 2D's, crisp and bright)
      a = mix(a, vec3(0.02, 0.02, 0.03), chan * 0.9); cvv += chan * 0.3; emi += sc * chan * 0.7 * k * (0.7 + 0.5 * gl) + sch * core * (k * 1.5 + run * 1.6 + 0.35) * (0.75 + 0.4 * gl) + sc * bleed * (1.0 - chan) * 0.2 * k * (0.7 + 0.4 * gl) + sc * clamp(uSpill, 0.0, 1.0) * 0.06;
      for (int i = 0; i < 2; i++) { float ra = i == 0 ? 0.12 : 0.88; for (int j = 0; j < 2; j++) { float rf = j == 0 ? 0.2 : 0.8; vec2 dd = vec2((al - ra) * 8.0, (fu - rf) * 1.2); float rr0 = length(dd), gm = smoothstep(0.13, 0.09, rr0) * flatF, rv = smoothstep(0.08, 0.06, rr0) * flatF, rh = smoothstep(0.035, 0.0, length(dd - vec2(-0.02, 0.025))) * flatF;
        a = mix(a, vec3(0.025, 0.02, 0.03), gm * (1.0 - rv) * 0.8); a = mix(a, vec3(0.3, 0.31, 0.36), rv); a = mix(a, vec3(0.95, 0.97, 1.0), rh * 0.9); cvv += gm * (1.0 - rv) * 0.3; spk += rv * 0.6; } }
      float inn = abs(face - 3.0) < 0.5 ? 1.0 : 0.0, el = 0.0; for (int i = 0; i < 2; i++) { float ea = i == 0 ? 0.28 : 0.72; vec2 de = vec2((al - ea) * 7.0, (fu - 0.5) * 1.3); el += exp(-dot(de, de) / 0.012); }
      emi += inn * (vec3(0.55, 0.2, 0.9) * 0.2 * (0.7 + 0.3 * gl) * (1.0 - clamp(uKind, 0.0, 1.0) * 0.5) + sch * el * 1.6 * (0.7 + 0.5 * gl) + sc * el * 0.6);
      float endG = exp(-al * al / 0.004) + exp(-(1.0 - al) * (1.0 - al) / 0.004); emi += sc * endG * 0.5 * (0.6 + 0.4 * gl); spk += 0.08 + chm * 0.15; }
    if (id == 861) { float u = edge, v = ao, th = v * 3.14159, ph = u * 6.28318; vec3 d = vec3(sin(th) * cos(ph), sin(th) * sin(ph), cos(th)); float opn = clamp(uSpill, 0.0, 1.0);
      vec2 q1 = vec2(ph * 1.1 + tt * 0.25, th * 1.8 - tt * 0.2); float b1 = vn(q1 * 1.4) * 0.65 + vn(q1 * 3.3 + 5.0) * 0.35;   // (v472b YB: a smooth glossy orb: a slow boil, a swirl of bright plasma round it, a deep inner glow, a bright rim)
      float sw = 0.0; for (int i = 0; i < 2; i++) { float fi = float(i), s = fract(ph / 6.28318 * 2.0 + th * 0.55 + 0.25 * sin(th * 3.0 + tt * 0.6 + fi * 2.0) - tt * 0.06 + fi * 0.5); sw += exp(-(s - 0.5) * (s - 0.5) / 0.006) * smoothstep(0.15, 0.6, th) * (1.0 - smoothstep(2.4, 3.0, th)); }
      /* (v472c YB) a dark violet body lit from within: two deeper layers drifting at their own speeds, each sampled where the view ray meets it under the surface (parallax), a hot magenta heart, the swirl on top, the Fresnel rim, a glossy highlight, a darker terminator */
      vec3 dA = normalize(d - uV * 0.55), dB = normalize(d - uV * 0.3), aw = abs(d) + vec3(1e-3); aw /= aw.x + aw.y + aw.z;
      float lA = vn(dA.xy * 2.2 + vec2(tt * 0.05, 0.0)) * aw.z + vn(dA.yz * 2.2 + vec2(0.0, tt * 0.04)) * aw.x + vn(dA.xz * 2.2 - tt * 0.045) * aw.y, lB = vn(dB.xy * 4.5 - vec2(tt * 0.12, 0.0)) * aw.z + vn(dB.yz * 4.5 + vec2(tt * 0.1, 0.0)) * aw.x + vn(dB.xz * 4.5 + tt * 0.11) * aw.y;
      float lam = clamp(dot(n, uLK) * 0.5 + 0.5, 0.0, 1.0), cen = pow(ndv0, 1.6); vec3 dpC = vec3(0.22, 0.02, 0.48), mdC = vec3(0.62, 0.12, 0.95), htC = vec3(1.05, 0.35, 1.0);
      a = vec3(0.14, 0.025, 0.28); tex = q1 * 3.0; rg = 0.07; cc = 1.5; thru = vec3(0.6, 0.15, 0.95) * 0.3;
      emi += (dpC * (0.45 + 0.8 * smoothstep(0.3, 0.8, lA)) + mdC * smoothstep(0.4, 0.85, lB) * 0.75 * cen + htC * smoothstep(0.5, 0.9, lA * 0.5 + lB * 0.5 + b1 * 0.15) * cen * 0.8) * (0.5 + 0.5 * lam) * (0.75 + 0.25 * gl + opn * 0.5)
        + vec3(1.1, 0.75, 1.3) * sw * 0.45 * (0.7 + 0.3 * gl) * (0.5 + 0.5 * lam) + vec3(0.85, 0.35, 1.25) * pow(1.0 - ndv0, 3.0) * 1.1 + htC * cen * cen * 0.22 * (0.6 + 0.4 * gl); }
    if (id == 862) { float lx = edge * 2.0 - 1.0, ly = loc / 3.8 * 2.0 - 1.0; vec3 lp = vec3(lx, ly, sqrt(max(0.0, 1.0 - lx * lx - ly * ly))); float ix = mod(inst, 6.0), slit = mod(inst, 3.0) < 0.5 ? 1.0 : 0.0, opn = clamp(uSpill, 0.0, 1.0), iR = mix(0.62, 0.7, opn), pR = mix(0.36, 0.22, opn);   // (v472b YB: flush in the plasma: the iris fills the cap that shows)
      vec3 ic = ix < 0.5 ? TEA : ix < 1.5 ? AMB : ix < 2.5 ? VIH : ix < 3.5 ? vec3(0.5, 0.95, 0.88) : ix < 4.5 ? AMB : vec3(1.0, 0.56, 0.82); float ang = acos(clamp(lp.x, -1.0, 1.0)), ir = ang / 1.1;
      float iris = 1.0 - smoothstep(iR - 0.03, iR + 0.02, ir), limb = exp(-(ir - iR) * (ir - iR) / 0.0012), pr = slit > 0.5 ? length(vec2(lp.y / max(0.05, pR * 0.32), lp.z / max(0.05, pR * 1.15))) / 1.1 : ir / pR, pup = 1.0 - smoothstep(0.85, 1.0, pr);
      float fib = 0.75 + 0.25 * sin(atan(lp.z, lp.y) * 24.0 + vn(lp.yz * 9.0) * 3.0), vein = smoothstep(0.06, 0.0, abs(vn(lp.yz * 11.0 + inst) - 0.5)) * smoothstep(0.6, 1.4, ang);
      a = mix(vec3(0.85, 0.78, 0.92), vec3(0.5, 0.2, 0.55), vein * 0.5 + smoothstep(0.55, 1.2, ang)); a = mix(a, ic * fib * 0.75, iris); a = mix(a, vec3(0.015, 0.01, 0.03), max(limb * 0.85 * iris, pup * iris));
      emi += ic * iris * (1.0 - pup) * (0.7 + 0.5 * gl) * fib + ic * limb * 0.2; rg = 0.06; cc = 1.6;
      float sock = smoothstep(0.95, 1.3, ang); a = mix(a, vec3(0.05, 0.0, 0.09), sock * 0.85); emi += vec3(0.22, 0.03, 0.38) * sock * 0.3; vec3 rf2 = reflect(-uV, n);   // (v472c YB: a dark socket ring into the plasma; wet glints)
      emi += vec3(1.0) * (pow(max(0.0, dot(rf2, uLK)), 90.0) * 1.6 + pow(max(0.0, dot(rf2, normalize(uLK + vec3(0.5, 0.0, 0.3)))), 300.0)) * (1.0 - sock); }
    if (id == 863) { tex = L.xy * 6.0; a = mix(vec3(0.22, 0.05, 0.38), vec3(0.4, 0.12, 0.6), vn(tex + sd) * 0.6); if (sk == 2) a = vec3(0.1, 0.02, 0.16); thru = vec3(0.6, 0.2, 0.9) * 0.5; rg = 0.25; cc = 0.9; emi += VIO * (0.1 + 0.08 * gl); }   // (v472b YB: lids of the plasma's own dark violet)
    if (id == 864) { met = 0.85; float al = fract(ao * 0.5) * 2.0, ci = floor(ao * 0.5); tex = vec2(edge * 8.0, al * 40.0 + ci * 9.0); float bnd = smoothstep(0.1, 0.0, abs(fract(al * 4.5 + 0.5) - 0.5) - 0.38);
      a = mix(vec3(0.7, 0.36, 0.17), vec3(0.95, 0.6, 0.34), vn(tex * 0.5 + ci) * 0.6); float tar = smoothstep(0.58, 0.76, vn(tex * 0.8 + 11.0 + ci)), wnd = smoothstep(0.3, 0.5, abs(fract(edge * 8.0 + al * 40.0) - 0.5));   // (v472c YB: copper wound in wire, a metal sheen, verdigris in spots; the pulse crisp, its glow on the copper)
      a *= 1.0 - wnd * 0.35; cvv += wnd * 0.15; rg = 0.2 + 0.08 * wnd; a = mix(a, vec3(0.2, 0.5, 0.4), tar * 0.7); rg = mix(rg, 0.7, tar); met = mix(0.92, 0.1, tar);
      a = mix(a, vec3(0.2, 0.1, 0.05), bnd * 0.7); cvv += bnd * 0.35; float pz = exp(-(al - uSpill) * (al - uSpill) / 0.0012), pw2 = exp(-(al - uSpill) * (al - uSpill) / 0.02); emi += VIH * pz * 2.0 + VIO * pz * 0.8 + VIO * pw2 * 0.35 + VIO * 0.04 * gl; spk += 0.5; }
    // ---- NYAR'ZHUL (v472 YB): 870 flesh (.0 the heart: vA.y its vein + 2 x round(200 x its place across), vA.z its place up (both in its plane, shared with the 2D's layout); uKind the beat, uSpill the heat; .2 an atrium (local), .4 a vessel's root, a hose, a tendon, a sleeve), 871 steel (.0 a strap: vA.y round, vA.z along; .2 a vessel's pipe; .4 housings, collars, the bezel, the clamps; .6 a rivet; .8 a piston's head (local: a box +-1, +-1, +-0.55)), 872 a chrome rod, 873 the lens's amber glass, 874 the iris (.0 its disc: vA.y out from its middle, vA.z round; uKind the aperture; .2 a blade), 875 a lamp (amber; .2 the valve's red wheel), 876 fungus, 877 a vent (.0 its frame, .2 a slat, .4 its light by uGlow), 878 a tentacle's armoured hose (vA.y round, vA.z along x 6; uSpill its nerve's pulse), 879 the wall (.0 plates: vA.y across, vA.z up; .2 a rib)
    if (id == 875 && sk == 0) { vec3 c = mix(AMB, vec3(1.6, 1.35, 0.9), pow(ndv0, 1.3)) * (0.75 + 0.35 * gl); c = mix(c, vec3(1.4, 0.4, 0.15), clamp(uSpill, 0.0, 1.0) * 0.5); c += vec3(1.0) * fl2 * 0.25; c = mix(c, vec3(0.05, 0.04, 0.05), dead * 0.85); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 870) { float heat = clamp(uSpill, 0.0, 1.0), be = clamp(uKind, 0.0, 1.0); vec3 FC = vec3(0.5, 0.2, 0.44), FS = vec3(0.3, 0.09, 0.27), FH = vec3(0.8, 0.42, 0.7); rg = 0.34; cc = 0.85; spk += 0.12;
      vec3 FB = vec3(0.56, 0.17, 0.45), FD = vec3(0.3, 0.05, 0.22), FL = vec3(0.78, 0.38, 0.66), WN = vec3(0.13, 0.015, 0.08); ssk = 0.5; shb = 1.0;   // (v472c YB: three skin tones and the wine of the creases; light under the skin, a wet sheen)
      if (sk == 0) { float vv = clamp((vA.x - 870.0) * 25.0, 0.0, 1.0); vec2 pp = vec2((edge * 2.3 - 1.15) * 9.2, (ao * 2.4 - 1.2) * 8.2); tex = pp * 1.3;   // (v472c YB: the vein's height from the material's fraction, the place from edge and aux)
        // (v472c YB) a height field in the heart's plane, tapped for its slope: pillows swelling between the straps and round the bezel, branching raised veins, fine wrinkles at the straps' edges and under the atria; a tap toward the key for the straps' contact shadow
        float h0 = 0.0, hx = 0.0, hy = 0.0, d0 = 9.0, dsh = 9.0, vn0 = 0.0, wr0 = 0.0;
        for (int i = 0; i < 4; i++) { if (i > 0 && i < 3 && uLow > 0.5) continue; vec2 q = pp + (i == 1 ? vec2(0.14, 0.0) : i == 2 ? vec2(0.0, 0.14) : i == 3 ? vec2(-0.3, 0.55) : vec2(0.0));
          float xx = q.x * q.x / 84.6, d = min(min(abs(q.y - 2.9 + 1.5 * xx), abs(q.y + 5.2 + xx)), abs(abs(q.x) - 5.5 - 1.7 * (1.0 - q.y * q.y / 72.25)) + max(0.0, q.y - 8.5)) - 0.6; d = min(d, length(q - vec2(0.0, -1.4)) - 3.3);
          if (i == 3) { dsh = d; continue; }
          float vein = 0.0;   // (the veins are the mesh's own, raised along the 2D's vein lines: vv)
          float wr = sin(d * 15.0 + vn(q * 1.3) * 3.0) * exp(-max(d, 0.0) * 1.6) + sin(q.x * 4.0 + vn(q * 0.7 + 2.0) * 5.0) * smoothstep(4.8, 7.5, q.y) * 0.8, h = smoothstep(-0.1, 2.4, d) * 0.55 + vn(q * 0.45 + 5.0) * 0.12 + wr * 0.03;
          if (i == 0) { h0 = h; d0 = d; vn0 = vein; wr0 = wr; } if (i == 1) hx = h; if (i == 2) hy = h; }
        if (uLow < 0.5) { vec2 gr = vec2(hx - h0, hy - h0) / 0.14; vec3 tX = normalize(uM0 - n * dot(n, uM0)), tZ = normalize(uM2 - n * dot(n, uM2)); n = normalize(n - (tX * gr.x + tZ * gr.y) * 0.9); }
        float m1 = vn(pp * 0.2 + 3.0), m2 = vn(pp * 0.5 + 9.0), m3 = vn(pp * 1.1 + 1.0); a = mix(FB, FD, smoothstep(0.42, 0.85, m1) * 0.7); a = mix(a, FL, smoothstep(0.5, 0.85, m2) * 0.4); a *= 0.94 + 0.08 * m3;   // (mottled in three tones, broad)
        float vf = vv + vn0 * 0.9; a = mix(a, WN * 1.6, smoothstep(0.06, 0.35, vf) * (1.0 - smoothstep(0.55, 0.85, vf)) * 0.8); cvv += smoothstep(0.06, 0.3, vf) * (1.0 - smoothstep(0.4, 0.7, vf)) * 0.3; a = mix(a, mix(FL, vec3(0.75, 0.45, 0.95), 0.4), smoothstep(0.6, 1.0, vf) * 0.5);   // (the veins: dark flanks, lit crests)
        float cr = 1.0 - smoothstep(-0.05, 1.2, d0); a = mix(a, WN, cr * 0.8); occ *= 1.0 - cr * 0.5; cvv += cr * 0.7; shd = mix(0.3, 1.0, smoothstep(-0.25, 0.7, dsh)); cvv += (1.0 - shd) * 0.35; a = mix(a, WN, smoothstep(0.3, 1.0, -wr0) * 0.25 * exp(-max(d0, 0.0) * 1.2));   // (the creases, the straps' shadows, the wrinkles' valleys)
        rg = 0.2 - vf * 0.05; cc = 1.1; float mo = m1;
        float sm = 0.0; for (int i = 0; i < 3; i++) { vec2 p0 = i == 0 ? vec2(-7.5, 4.5) : i == 1 ? vec2(6.8, 5.0) : vec2(-3.4, -5.6), p1 = i == 0 ? vec2(-4.8, -1.2) : i == 1 ? vec2(5.5, 0.2) : vec2(2.6, -6.6), cpt = (p0 + p1) * 0.5 + vec2(1.0, 0.0);
          for (int j = 0; j < 8; j++) { float u0 = float(j) / 8.0, u1 = float(j + 1) / 8.0; vec2 a0 = mix(mix(p0, cpt, u0), mix(cpt, p1, u0), u0), a1 = mix(mix(p0, cpt, u1), mix(cpt, p1, u1), u1), dd = a1 - a0; float uu = clamp(dot(pp - a0, dd) / dot(dd, dd), 0.0, 1.0); sm = max(sm, exp(-dot(pp - a0 - dd * uu, pp - a0 - dd * uu) / 0.03)); } }
        emi += mix(VIO, mix(VIH, vec3(1.0, 0.55, 0.3), heat), sm) * sm * (0.5 + 0.9 * gl) + VIO * sm * be * 0.5;
        emi += vec3(1.0, 0.3, 0.1) * heat * (0.55 + 0.3 * mo + 0.15 * sin(tt * 9.0 + pp.y)) * (1.0 - cr * 0.4) + vec3(1.2, 0.55, 0.2) * sm * heat * 1.2 + vec3(1.0, 0.25, 0.08) * vf * heat * 0.6 + vec3(1.0, 0.35, 0.12) * cr * heat * 0.6 + vec3(0.55, 0.12, 0.35) * vf * be * 0.35;   // (v472b YB: overheated, red-orange glowing through the flesh, the seams and the veins; v472c: the creases too)
        emi += a * vec3(1.0, 0.45, 0.6) * be * 0.22; thru = vec3(0.45, 0.1, 0.22) + vec3(0.6, 0.2, 0.0) * heat; }   // (v472c YB: the flesh flushing brighter on each beat)
      else if (sk == 2) { vec3 q = L; tex = q.xy * 3.0; float fz = q.z * 2.4 + 0.35 * vn(q.xy * 2.0), fo = sin(fz * 6.28318), m1 = vn(q.xy * 1.6 + sd), m2 = vn(q.xz * 3.0 + sd);   // (v472c YB: an atrium: mottled, folded (its folds bent into the normal), wet, light through it)
        a = mix(FB, FD, smoothstep(0.4, 0.85, m1) * 0.6); a = mix(a, FL, smoothstep(0.55, 0.9, m2) * 0.35); a = mix(a, WN, smoothstep(0.4, 1.0, -fo) * 0.4); occ *= 1.0 - smoothstep(0.5, 1.0, -fo) * 0.3;
        if (uLow < 0.5) { vec3 tZ = normalize(uM2 - n * dot(n, uM2)); n = normalize(n - tZ * cos(fz * 6.28318) * 0.35); }
        rg = 0.22; cc = 1.0; ssk = 1.1; thru = vec3(0.8, 0.2, 0.32) + vec3(0.5, 0.2, 0.0) * heat; emi += vec3(0.9, 0.35, 0.2) * heat * 0.25 + a * vec3(1.0, 0.45, 0.6) * be * 0.15; }
      else { tex = vec2(edge * 6.0, ao * 20.0) + L.xy; float rgv = smoothstep(0.1, 0.0, abs(fract(ao * 8.0) - 0.5) - 0.4); a = mix(FB, FD, 0.3 + 0.45 * vn(tex * 0.6 + sd)); a = mix(a, WN, rgv * 0.6); occ *= 1.0 - rgv * 0.3; rg = 0.24; cc = 1.0; thru = vec3(0.6, 0.15, 0.3); emi += vec3(0.9, 0.35, 0.2) * heat * 0.2; } }   // (v472c YB: the vessels' roots, hoses, tendons, sleeves in the same skin)
    if (id == 871) { met = 0.82; rg = 0.36; cc = 0.25; vec3 ST = vec3(0.33, 0.36, 0.45);
      if (sk == 0) { float th = edge * 6.28318, ce = abs(cos(th)), bvl = exp(-(ce - 0.93) * (ce - 0.93) / 0.003), br = vn(vec2(ao * 5.0, edge * 60.0) + sd), wr = smoothstep(0.45, 0.75, vn(vec2(ao * 70.0, edge * 6.0) + sd)) * smoothstep(0.6, 0.92, ce), gr = smoothstep(0.55, 0.8, vn(vec2(ao * 18.0, edge * 2.0) + sd + 7.0));   // (v472c YB: a strap: dark gunmetal brushed along it, machined edges catching a bright line, worn bright at its edges, grime in patches)
        tex = vec2(ao * 8.0, edge * 50.0); a = vec3(0.3, 0.31, 0.37) * (0.8 + 0.35 * br); a = mix(a, vec3(0.08, 0.06, 0.065), gr * 0.55); a = mix(a, vec3(0.75, 0.77, 0.84), max(bvl * 0.9, wr * 0.6));
        met = 0.85; rg = mix(0.3 + 0.1 * br, 0.12, max(bvl, wr)); rg = mix(rg, 0.62, gr * 0.6); cc = 0.12; spk += 0.05 + bvl * 0.4; emi += VIO * bvl * gl * 0.15; }
      else if (sk == 2) { vec3 q = L, wn = abs(normalize(vNL)) + vec3(1e-3); wn /= wn.x + wn.y + wn.z; tex = q.xz * 2.0;   // (v472c YB: a vessel's pipe: grey-violet paint chipped to bright steel (a dark lip round each chip), rust and soot, its underside dark)
        float t1 = vn(q.yz * 5.0) * wn.x + vn(q.xz * 5.0) * wn.y + vn(q.xy * 5.0) * wn.z, t2 = vn(q.yz * 0.7 + 3.0) * wn.x + vn(q.xz * 0.7 + 3.0) * wn.y + vn(q.xy * 0.7 + 3.0) * wn.z;
        float chip = smoothstep(0.74, 0.77, t1), cl2 = smoothstep(0.68, 0.74, t1) * (1.0 - chip), rust = smoothstep(0.58, 0.8, t2) * (1.0 - chip), und = 1.0 - smoothstep(-0.7, 0.25, hm);
        a = vec3(0.34, 0.35, 0.45) * (0.88 + 0.16 * t2); met = 0.3; rg = 0.32; cc = 0.4; a = mix(a, vec3(0.1, 0.09, 0.11), cl2 * 0.6);
        a = mix(a, vec3(0.4, 0.4, 0.44), chip); met = mix(met, 0.9, chip); rg = mix(rg, 0.42, chip); a = mix(a, vec3(0.24, 0.1, 0.05), rust * 0.7); rg = mix(rg, 0.75, rust); met = mix(met, 0.1, rust); cc *= 1.0 - rust;
        a = mix(a, vec3(0.05, 0.04, 0.05), und * 0.55); occ *= 1.0 - und * 0.35; spk += chip * 0.3 + 0.05; }
      else if (sk == 3) { vec3 q = L; float r = length(q.xy), an = atan(q.y, q.x); met = 0.94; cc = 0.35; tex = vec2(an * 6.0, q.z * 9.0);   // (v472b YB: 871.3 the lens's bronze bezel; v472c: its inner lip polished bright, its body hammered and darker)
        if (r < 0.995) { a = vec3(0.9, 0.62, 0.3) * (0.9 + 0.12 * vn(vec2(an * 40.0, r * 3.0))); rg = 0.12; spk += 0.8; }
        else { float ta = atan(q.z, r - 1.06), hd = 0.0, hdx = 0.0, hdy = 0.0;
          for (int i = 0; i < 3; i++) { if (i > 0 && uLow > 0.5) continue; vec2 c2 = vec2(an * 15.0, ta * 2.2) + (i == 1 ? vec2(0.08, 0.0) : i == 2 ? vec2(0.0, 0.08) : vec2(0.0)), ci = floor(c2), cf = fract(c2) - 0.5 + (vec2(hs(ci), hs(ci + 7.0)) - 0.5) * 0.4; float h = -exp(-dot(cf, cf) * 6.0); if (i == 0) hd = h; if (i == 1) hdx = h; if (i == 2) hdy = h; }
          if (uLow < 0.5) { vec3 tA = normalize(-uM0 * sin(an) + uM1 * cos(an)), tR = normalize(uM0 * cos(an) + uM1 * sin(an)), tT = -tR * sin(ta) + normalize(uM2) * cos(ta); tA = normalize(tA - n * dot(n, tA)); tT = normalize(tT - n * dot(n, tT)); n = normalize(n - (tA * (hdx - hd) + tT * (hdy - hd)) / 0.08 * 0.1); }
          float pat = vn(vec2(an * 3.0, ta) + sd); a = mix(vec3(0.5, 0.29, 0.11), vec3(0.3, 0.16, 0.06), smoothstep(0.3, 0.8, pat) * 0.7) * (0.85 - hd * 0.25); rg = 0.22 + 0.1 * pat; float lip = 1.0 - smoothstep(0.35, 0.6, abs(ta)); a = mix(a, vec3(0.92, 0.66, 0.34), lip * 0.8); rg = mix(rg, 0.12, lip); spk += 0.5 + lip; } }
      else if (sk == 4) { vec3 q = L; tex = q.xy * 4.0 + q.z; float g1 = vn(tex + sd), scr = pow(vn(vec2(q.x * 40.0 + q.z * 9.0, q.y * 3.0)), 12.0), wr = smoothstep(0.5, 1.0, edge) * smoothstep(0.4, 0.7, vn(q.xy * 9.0 + q.z * 5.0));   // (v472c YB: housings, collars, clamps: gunmetal, scratched, worn bright on the edges, grimy in the flats)
        a = vec3(0.19, 0.2, 0.25) * (0.8 + 0.3 * g1); a = mix(a, vec3(0.64, 0.66, 0.74), scr * 0.5 + wr * 0.7); a = mix(a, vec3(0.06, 0.045, 0.05), smoothstep(0.6, 0.85, vn(tex * 0.6 + 4.0)) * 0.5 * (1.0 - edge)); rg = mix(0.36, 0.15, clamp(wr + scr, 0.0, 1.0)); spk += wr * 0.8; occ *= 1.0 - smoothstep(-0.2, -0.8, hm) * 0.3; }
      else if (sk == 6) { a = vec3(0.64, 0.66, 0.74); rg = 0.12; met = 0.95; spk += 1.0; }   /* (v472c YB: rivets polished) */
      else { vec3 q = L; float front = smoothstep(0.85, 0.95, q.y), band = front * smoothstep(-0.05, 0.0, -q.z - 0.05) * smoothstep(-0.55, -0.45, q.z), str = step(0.5, fract((q.x - q.z) * 1.6)); a = mix(vec3(0.38, 0.42, 0.52), vec3(0.2, 0.22, 0.28), front);
        a = mix(a, mix(vec3(0.04, 0.04, 0.04), AMB * 0.9, str), band); rg = mix(0.34, 0.5, band); met = mix(0.82, 0.2, band); spk += 0.2; } }
    if (id == 872) { met = 1.0; a = vec3(0.92, 0.92, 0.97); rg = 0.06; cc = 0.3; float st = smoothstep(0.7, 0.9, vn(vec2(L.y * 30.0, L.x * 2.0) + sd)); a *= 1.0 - st * 0.25; spk += 0.6; chr = 0.85; }   /* (v472c YB: real chrome, the room's lights in it) */
    if (id == 873) { met = 0.0; float heat = clamp(uSpill, 0.0, 1.0); vec3 lp = L; a = mix(vec3(0.5, 0.25, 0.05), vec3(0.75, 0.42, 0.1), smoothstep(0.0, 0.4, lp.z)); rg = 0.05; cc = 1.4; thru = vec3(1.0, 0.55, 0.15) * 0.8;
      a *= 0.45; thru *= 0.4; emi += mix(AMB, vec3(1.0, 0.35, 0.15), heat) * (0.03 + 0.05 * gl) * (1.0 - ndv0 * 0.5); spk += 0.4;   // (v472b YB: dark glass, the iris seen through it)
      vec2 sq2 = vec2(lp.x, -lp.y) / 0.88; float rq = length(sq2), aq = atan(sq2.y, sq2.x), arc = exp(-(rq - 0.76) * (rq - 0.76) / 0.0012) * smoothstep(1.8, 2.05, aq) * (1.0 - smoothstep(2.6, 2.85, aq)), dt2 = exp(-dot(sq2 - vec2(0.4, 0.46), sq2 - vec2(0.4, 0.46)) / 0.003);
      emi += vec3(1.0, 0.96, 0.9) * (arc * 0.85 + dt2 * 1.1); cc = 1.6; }   // (v472c YB: the glass's reflections, as the 2D's: a curved streak upper left, a bright dot)
    if (id == 874) { if (sk == 2) { met = 0.7; a = vec3(0.2, 0.15, 0.12); rg = 0.3; float ed = smoothstep(0.004, 0.0, abs(L.z) - 0.008); a = mix(a, vec3(0.48, 0.38, 0.32), smoothstep(0.7, 1.0, edge) * 0.6); cc = 0.3; }
      else { float R = 0.02 + edge * 1.18, an = ao * 6.28318, ap = clamp(uKind, 0.0, 1.2), heat = clamp(uSpill, 0.0, 1.0), rot = uWear * 6.28318, a7 = 0.8975979;   // (v472c YB: the 2D's iris painted crisp: R in the disc's units: the aperture inside 0.78, the toothed amber ring to 0.95, the dark glass well under the bezel; uWear the blades' turn)
        vec3 HOT = mix(vec3(1.7, 1.15, 0.5), vec3(1.8, 0.6, 0.25), heat), AM2 = mix(AMB, vec3(1.0, 0.38, 0.12), heat); met = 0.55; rg = 0.36; cc = 0.4;
        if (R > 0.95) { a = vec3(0.05, 0.025, 0.015); emi += AM2 * exp(-(R - 0.95) * 30.0) * 0.4 * (0.6 + 0.4 * gl); rg = 0.2; }
        if (R > 0.78 && R <= 0.95) { float tk = smoothstep(0.32, 0.44, abs(fract(an * 32.0 / 6.28318) - 0.5)), lip = exp(-(R - 0.785) * (R - 0.785) / 0.0002) + exp(-(R - 0.945) * (R - 0.945) / 0.0002); a = vec3(0.1, 0.05, 0.02); emi += AM2 * (1.0 - tk * 0.75) * (0.9 + 0.6 * gl) * (0.8 + 0.2 * sin(R * 40.0)) + HOT * lip * 0.4; }
        if (R <= 0.78) { float rb = R / 0.78, ro = mix(0.16, 0.56, clamp(ap / 1.15, 0.0, 1.0)), aa = an - rot, rp = rb * cos(mod(aa, a7) - a7 * 0.5) / cos(a7 * 0.5);
          if (rp < ro) { float k = rp / ro; a = vec3(0.04, 0.02, 0.01); emi += mix(HOT * 1.3, AM2 * 0.9, k * k) * (0.85 + 0.5 * gl); }   // (the opening: a heptagon of hot amber)
          else { float s = fract(aa / a7 - log(rb / ro) * 0.85), ln2 = exp(-min(s, 1.0 - s) * min(s, 1.0 - s) / 0.0016), shade = 0.4 + 0.6 * s;   // (the blades: a spiral, each one shaded across, its edge a pale line)
            a = vec3(0.2, 0.11, 0.06) * shade; a = mix(a, vec3(0.85, 0.62, 0.36), ln2 * 0.85); emi += AM2 * (exp(-(rp - ro) * (rp - ro) / 0.0015) * 1.2 + 0.06 * shade) * (0.7 + 0.4 * gl) + AM2 * ln2 * 0.12; met = 0.7; rg = 0.3; } } } }
    if (id == 875) { float wr = smoothstep(0.55, 0.8, vn(L.xy * 14.0 + L.z * 9.0)); a = mix(vec3(0.62, 0.09, 0.07) * (0.85 + 0.2 * vn(L.xy * 9.0)), vec3(0.58, 0.58, 0.62), wr * 0.8); met = mix(0.15, 0.9, wr); rg = mix(0.38, 0.2, wr); cc = 0.4 * (1.0 - wr); spk += wr; }   /* (v472c YB: the valve's red paint worn to steel) */
    if (id == 876) { vec3 q = L; float top = smoothstep(0.08, 0.14, q.z), spot = step(0.8, hs(floor(q.xy * 5.0))) * top; a = mix(vec3(0.5, 0.2, 0.4), vec3(0.95, 0.55, 0.78), top); a = mix(a, vec3(1.0, 0.92, 0.96), spot * 0.7); thru = vec3(0.9, 0.35, 0.6) * 0.7; rg = 0.45; cc = 0.5; emi += vec3(0.85, 0.35, 0.65) * (0.1 + 0.15 * gl) * top; }
    if (id == 877) { if (sk == 4) { float k = clamp(uGlow, 0.0, 1.0); vec3 c = mix(vec3(0.03, 0.02, 0.03), mix(AMB * 1.4, vec3(1.8, 0.55, 0.18), clamp(uSpill, 0.0, 1.0)), k) * (0.85 + 0.15 * sin(tt * 11.0)); /* (v472b YB: blazing red-orange when it overheats) */ gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
      met = 0.75; rg = 0.36; a = sk == 2 ? vec3(0.29, 0.32, 0.41) : vec3(0.08, 0.05, 0.08); a = mix(a, vec3(0.68, 0.71, 0.8), smoothstep(0.6, 1.0, edge) * 0.4); }
    if (id == 878) { float al = ao, f = fract(al), rgv = smoothstep(0.08, 0.0, abs(f - 0.5) - 0.42); tex = vec2(edge * 8.0, al * 6.0); a = mix(vec3(0.27, 0.11, 0.25), vec3(0.45, 0.2, 0.42), vn(tex + sd) * 0.6); a *= 1.0 - rgv * 0.45; cvv += rgv * 0.3; rg = 0.3; cc = 0.85; thru = vec3(0.5, 0.15, 0.35);
      float nerve = exp(-(edge - 0.25) * (edge - 0.25) / 0.002) + exp(-(edge - 1.25) * (edge - 1.25) / 0.002), pz = exp(-(al / 6.0 - uSpill) * (al / 6.0 - uSpill) / 0.003) * step(0.01, uSpill) * step(uSpill, 0.99); emi += AMB * nerve * (0.15 + 1.4 * pz) * (0.5 + 0.5 * gl) + vec3(0.9, 0.35, 0.2) * clamp(uKind, 0.0, 1.0) * 0.2; }
    if (id == 879) { met = 0.6; rg = 0.45; cc = 0.15;
      if (sk == 2) { vec3 q = L; tex = q.xz; a = vec3(0.2, 0.17, 0.26) * (0.85 + 0.25 * vn(q.xz * 2.0)); float rv = smoothstep(0.1, 0.04, length(vec2(fract(q.z * 0.55) - 0.5, 0.0))) * smoothstep(0.0, 0.3, q.y + 20.2); a = mix(a, vec3(0.05, 0.04, 0.06), rv * 0.6); }
      else { float xu = edge * 56.0 - 28.0, zv = ao * 20.0, pr = floor(zv / 3.6), pc = floor((xu + hs(vec2(pr, 1.0)) * 3.0) / 4.6); vec2 g = vec2(xu, zv); tex = g;
        float sz = abs(fract(zv / 3.6) - 0.5) * 3.6, sx2 = abs(fract((xu + hs(vec2(pr, 1.0)) * 3.0) / 4.6) - 0.5) * 4.6, sd2 = min(1.8 - sz, 2.3 - sx2), h1 = hs(vec2(pr, pc)); a = mix(vec3(0.1, 0.07, 0.13), vec3(0.2, 0.15, 0.25), h1) * (0.8 + 0.3 * vn(g * 0.8));
        float seam = smoothstep(0.09, 0.0, sd2); a *= 1.0 - seam * 0.7; cvv += seam * 0.3; emi += VIO * smoothstep(0.05, 0.0, 1.8 - sz) * (0.25 + 0.75 * gl) * (0.6 + 0.4 * h1) * 0.8;
        a = mix(a, vec3(0.38, 0.33, 0.44), pow(vn(vec2(xu * 6.0, zv * 0.6)), 10.0) * 0.6); float rv = smoothstep(0.1, 0.05, length(vec2(fract(xu * 1.2) - 0.5, (sz - 1.55) * 3.0))); a = mix(a, vec3(0.03, 0.02, 0.04), rv * 0.7); } a *= 0.7; }   /* (v472c YB: the wall darker, so the heart stands out) */
    /*<YB-YUG-MAT-880>*/
    // ---- the shared light: key with soft shadows, the arena's sky above and its floor's bounce below, reflections of both, metal, a clear coat, glints, the rim from behind
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH * shd, wrap = max(0.0, (ndl0 + 0.5) / 1.5) * mix(1.0, oSH * shd, 0.7); hm = dot(n, uUP);   /* (v472c YB: shd) */
    vec3 key = uAmb, sky = id < 860 ? vec3(0.1, 0.08, 0.17) : id < 870 ? vec3(0.08, 0.13, 0.2) : vec3(0.15, 0.07, 0.13), gnd = id < 860 ? vec3(0.3, 0.3, 0.38) : id < 870 ? vec3(0.1, 0.34, 0.36) : vec3(0.36, 0.17, 0.22);
    vec3 ambC = mix(gnd, sky, 0.5 + 0.5 * hm) * (0.5 + 0.5 * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(gnd * 0.55, sky * 1.5 + uRim * 0.06, smoothstep(-0.3, 0.45, ru)) + uRim * 0.14 * smoothstep(0.15, 0.5, ru) * (1.0 - smoothstep(0.65, 0.92, ru)) / (1.0 + rg * 4.0) + key * 0.9 * smoothstep(0.85, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);
    vec3 F0 = mix(vec3(0.04), a, met), Fr = F0 + (1.0 - F0) * frs * (1.0 - rg * 0.6);
    vec3 col = a * (1.0 - met * 0.82) * (mix(ndl, wrap, 0.35) * key + ambC) + envC * Fr * occ * (0.55 + met * 0.95) / (1.0 + rg * 1.2) + spec * key * mix(vec3(0.07), F0 * 1.5, met);
    col += thru * (0.35 * (1.0 - ndl) + 0.3 * max(0.0, -ndl0) + 0.25 * max(0.0, dot(n, uLR))) * key * (0.6 + 0.4 * occ);   // (light through the membranes, the flesh, the glass)
    if (cc > 0.0) { vec3 film = 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + ndv0 * 1.4 + vn(tex * 0.3) * 0.8)); col += cc * (pow(nh, 140.0) * 0.8 * ndl * key + (0.04 + 0.96 * frs) * envC * 0.55 * mix(vec3(1.0), film, met * 0.6)) * occ; }   // (the wet coat; on the hull an oily film)
    if (spk > 0.0 && uLow < 0.5) col += vec3(1.0, 0.98, 1.05) * pow(vn(tex * 9.0 + sd), 24.0) * 2.2 * spk * max(0.0, ndl0 + 0.2);
    /* (v472c YB) light under the skin: a red band at the terminator, the thin edges glowing warm; a broad wet sheen and the softbox's stripe; chrome mirroring the room */
    if (ssk > 0.0) col += ssk * a * vec3(1.0, 0.34, 0.42) * (max(0.0, wrap - ndl) * 1.4 * key + pow(1.0 - ndv0, 2.2) * (key * 0.35 + uRim * 0.45)) * (0.5 + 0.5 * occ);
    if (shb > 0.0) { float sbx = dot(rr, uLS); col += shb * key * (pow(nh, 14.0) * 0.16 * ndl + smoothstep(0.82, 0.93, sbx) * (1.0 - smoothstep(0.975, 1.0, sbx)) * 0.32) * occ; }
    if (chr > 0.0) { vec3 cen = mix(vec3(0.05, 0.02, 0.04), vec3(0.75, 0.26, 0.52), smoothstep(-0.25, 0.15, rr.z)) * (1.0 - smoothstep(0.35, 0.9, rr.z) * 0.7) + vec3(1.7, 1.15, 0.55) * exp(-(rr.x - 0.45) * (rr.x - 0.45) / 0.004) + vec3(0.9, 0.6, 1.3) * exp(-(rr.x + 0.6) * (rr.x + 0.6) / 0.01) * 0.6;
      col = mix(col, cen * a + spec * key, chr); }
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * (id == 850 ? 0.3 : 0.65) * occ + a * max(0.0, -hm) * gnd * 0.5 * occ;   // (the rim from behind; the floor's light bounced up under it; v472b YB: the hull's rim light toned down)
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead * 0.85) + vec3(1.0, 0.98, 0.95) * fl2 * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.78, 0.86) * 0.7, dead * 0.75); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</YB-YUG-MAT>*/
  /*<AH-AHU-MAT ids 770..789 (v470b AH: 20z6a-ahuul-gl.js, Ahuul the White Horizon rebuilt from scratch). Lit by its own pass in the Broad Summit's light (AUR3 'summit': the key's colour in uAmb, the aurora's green rim in uRim; the night's navy above, the snow's light below). Every pattern from the surface's own coordinates (vA), never the moving position. 770 the hide (vA.y round it: (a + pi) / 2pi, a the angle from the belly's middle; vA.z its place s from the snout 0 to the tail 1): a navy back mottled, frost freckles, rake scars, the countershaded border, the white belly speckled, the pleats' grooves, the mouth and its lip, the eye bands' sockets and the vents' light under the skin (uKind the eyes' strength, uSpill the vents' flare), the bared throat (uGlow), aurora drift, chin rime; a wet clear coat; 770.2 a tubercle (vA.y its height). 771 a fin (vA.y round its section, 0..0.5 over the top from the leading edge, 0.5..1 back beneath; vA.z along it, 0 the root .. 1 the tips): navy root to pale ice, three bones, membrane with veins and light through it, a white scalloped leading edge; uGlow the lifted fin's edge. 772 the fluke (vA.y as a fin's, vA.z across 0..1): navy above, white with navy marks beneath. 773 ice (a crystal: vA.y its facet edge, vA.z 4 x its copy + 1 - its place along): blue root to clear tip, bright facet rims, light running down the ridge, aurora green rising inside by uGlow; .2 a rime shard. 774 a barnacle (.0 the shell, .2 its rim, .4 inside; vA.y up it, vA.z round). 775 a lens (copies 0..13 the eye lights by uGlow, 14..19 the tendrils' tips by uSpill). 776 a vent (vA.y 0 the slit's core .. 1 its edge; copy 0..9: a wave from head to tail, uGlow its flare). 777 a tendril (vA.z 4 x its index + along it; seen through, light pulses running down). uGlow2 a blow's flash, uFx the death's fade, uWear the part's seed>*/
  else if (id >= 770 && id <= 789) {
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, gl = clamp(uGlow, 0.0, 3.0), dead = clamp(uFx, 0.0, 1.0), fl2 = clamp(uGlow2, 0.0, 1.0), sd = uWear * 17.0;
    vec3 GRN = vec3(0.3, 1.0, 0.68), GRH = vec3(0.72, 1.18, 0.95);
    float inst = floor((ao + 0.01) * 0.25), loc = ao - inst * 4.0;
    // ---- the lights: emissive
    if (id == 775) { float lv; if (inst < 13.5) { float i = mod(inst, 7.0), sg = inst < 6.5 ? 1.0 : -1.0; lv = gl * (0.7 + 0.3 * sin(tt * 3.0 + i * 0.9 + sg)); } else lv = (0.6 + 0.3 * sin(tt * 2.0 + inst - 14.0)) * (1.0 + 0.5 * uSpill);
      vec3 c = mix(GRN * 0.85, vec3(1.4, 1.65, 1.5), pow(ndv0, 2.2)) * (0.3 + 0.95 * lv) + GRH * pow(1.0 - ndv0, 2.0) * 0.35 * lv;
      c += vec3(1.0) * fl2 * 0.25; c = mix(c, vec3(0.06, 0.07, 0.08), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    float vlv = 0.0; if (id == 776) vlv = 0.35 + 0.65 * max(0.0, sin(tt * 1.5 - mod(inst, 5.0) * 0.85)) + gl;
    if (id == 776 && edge < 0.56) { float core = 1.0 - smoothstep(0.1, 0.54, edge), hot = exp(-edge * edge * 50.0);
      vec3 c = mix(vec3(0.015, 0.07, 0.08), GRN * (0.45 + 0.9 * vlv), core) + GRH * hot * vlv * 0.85; c += vec3(1.0) * fl2 * 0.2; c = mix(c, vec3(0.05, 0.06, 0.07), dead * 0.85);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    // ---- the solid ones
    vec3 a = vec3(0.5), emi = vec3(0.0), thru = vec3(0.0); float rg = 0.5, cc = 0.0, cvv = 0.0, occ = 1.0, spk = 0.0; vec2 tex = vec2(edge * 13.0, ao * 7.0);
    if (id == 770 && sk == 0) { float s = ao, aa = edge * 6.28318 - 3.14159, ph = aa - 1.5708, q = atan(sin(ph), abs(cos(ph))), rs = 2.1 * sqrt(clamp(s / 0.07, 0.02, 1.0)) * (1.0 - 0.72 * smoothstep(0.55, 1.0, s)); vec2 mm = vec2(s * 20.0, abs(aa) * rs + 0.37); tex = mm;
      float mot = vn(mm * 0.8 + sd), mot2 = vn(mm * 2.6 + 7.0), fine = vn(mm * 13.0 + 3.0);
      float nz2 = smoothstep(0.03, 0.12, s), lim = mix(-0.14, -0.46, smoothstep(0.1, 0.22, s)) - 0.55 * (1.0 - smoothstep(0.012, 0.05, s)) + (0.26 * (vn(mm * vec2(0.5, 1.1) + 11.0) - 0.5) + 0.1 * (mot2 - 0.5)) * nz2;
      float belly = smoothstep(lim + 0.05, lim - 0.05, q) * smoothstep(0.0, 0.01, s);
      float blot = smoothstep(0.7, 0.76, vn(mm * vec2(0.65, 1.4) + 21.0)) * smoothstep(lim + 0.45, lim + 0.12, q) * nz2 * smoothstep(0.25, 0.35, s);
      float isl = smoothstep(0.74, 0.8, vn(mm * vec2(0.9, 1.6) + 33.0)) * smoothstep(lim - 0.1, lim - 0.5, q) * smoothstep(0.42, 0.5, s);
      belly = clamp(max(belly, blot * 0.9) - isl * 0.85, 0.0, 1.0);
      // the navy back: mottled, frost freckles, a few pale rake scars
      vec3 nav = mix(vec3(0.05, 0.11, 0.24), vec3(0.1, 0.2, 0.37), mot) * (0.88 + 0.24 * mot2);
      vec2 cg = mm * 5.0, ci = floor(cg), cf = fract(cg) - 0.5; float h1 = hs(ci + sd);
      float frk = step(0.72, h1) * smoothstep(0.2 + 0.12 * hs(ci + 1.7), 0.04, length(cf - (vec2(hs(ci + 3.1), hs(ci + 5.7)) - 0.5) * 0.5));
      nav = mix(nav, vec3(0.3, 0.44, 0.58), frk * 0.32);
            vec3 wht = vec3(0.86, 0.9, 0.93) * (0.93 + 0.07 * fine); float dk = step(0.9, hs(floor(mm * 7.0) + 9.0)) * smoothstep(0.28, 0.0, length(fract(mm * 7.0) - 0.5)); wht *= 1.0 - dk * 0.35;
      a = mix(nav, wht, belly);
      // the pleats' grooves (the mesh cuts them; the same lattice: 14 across +-1 radian)
      float pe = smoothstep(0.012, 0.042, s) * (1.0 - smoothstep(0.3, 0.42, s)) * (1.0 - smoothstep(0.78, 1.02, abs(aa))), pc = cos(6.28318 * (aa + 1.0) * 7.0);
      float gp = pow(0.5 - 0.5 * pc, 7.0) * pe, rid = pow(0.5 + 0.5 * pc, 3.0) * pe;
      a = mix(a, vec3(0.32, 0.4, 0.5) * (0.85 + 0.15 * fine), gp * 0.75); a *= 1.0 + rid * 0.05; cvv += gp * 0.55;
      // the mouth's line and its lip
      float phm = -0.34 - max(0.0, s - 0.15) * 9.0, me = smoothstep(0.004, 0.02, s) * (1.0 - smoothstep(0.18, 0.205, s)), dq = q - phm;
      float mouth = smoothstep(0.03, 0.008, abs(dq)) * me, lip = smoothstep(0.03, 0.0, abs(dq - 0.05)) * me;
      a = mix(a, vec3(0.008, 0.015, 0.03), mouth); cvv += mouth * 0.6; a = mix(a, vec3(0.4, 0.52, 0.64), lip * 0.18 * smoothstep(0.03, 0.06, s));
      // the eye bands' sockets, their light under the skin
      float eg = 0.0, er = 0.0; if (s > 0.1 && s < 0.22) { float sg = cos(ph) > 0.0 ? 1.0 : -1.0; for (int i = 0; i < 7; i++) { float fi = float(i), es = 0.128 + fi * 0.005 + fi * fi * 0.0014, eq = 0.36 - fi * 0.16, d = length(vec2((s - es) * 20.0, (q - eq) * 1.75)), e1 = (d - 0.15) / 0.035;
          eg += exp(-d * d * 12.0) * (0.7 + 0.3 * sin(tt * 3.0 + fi * 0.9 + sg)); er += exp(-e1 * e1); } }
      a = mix(a, vec3(0.01, 0.03, 0.05), clamp(er, 0.0, 1.0) * 0.7); emi += GRN * eg * 0.5 * uKind; thru += GRN * eg * 0.15 * uKind;
      // the vents' light under the skin, in a wave from head to tail
      float vg = 0.0; if (s > 0.24 && s < 0.62) { for (int i = 0; i < 5; i++) { float fi = float(i), lv = 0.35 + 0.65 * max(0.0, sin(tt * 1.5 - fi * 0.85)) + uSpill; vec2 dd = vec2((s - 0.3 - fi * 0.065) * 20.0 / 0.6, (q - 0.62) * 2.3 / 0.32); vg += exp(-dot(dd, dd) * 0.8) * lv; } }
      emi += GRN * vg * 0.26; thru += GRN * vg * 0.1;
      // the bared throat lit mint from inside, brightest down its grooves
      float te = smoothstep(0.46, 0.1, s) * smoothstep(0.0, 0.03, s);
      a = mix(a, vec3(0.5, 0.86, 0.74), belly * te * min(1.0, gl) * 0.65); emi += GRN * belly * te * gl * 0.55 + GRH * gp * te * gl * 1.6 + GRN * rid * te * gl * 0.25;
      // aurora light drifting along the back; rime on the chin
      float st2 = pow(vn(vec2(aa * 2.0 + tt * 0.05, s * 30.0 - tt * 0.3) + 5.0), 6.0) * (1.0 - belly); emi += GRN * st2 * 0.07;
      float crust = smoothstep(0.62, 0.7, vn(mm * 2.6 + 50.0)) * (1.0 - smoothstep(0.05, 0.11, s)) * smoothstep(-0.15, -0.45, q); a = mix(a, vec3(0.8, 0.86, 0.9) * (0.85 + 0.15 * fine), crust * 0.9);
      rg = mix(0.3, 0.5, belly); rg = mix(rg, 0.8, crust); cc = mix(0.8, 0.25, belly) * (1.0 - crust); thru += vec3(0.22, 0.3, 0.36) * belly; spk += (1.0 - belly) * 0.12 + crust * 1.5;
      if (uLow < 0.5) n = normalize(n + (vec3(vn(mm * 6.0 + sd), vn(mm * 6.0 + 3.3), vn(mm * 6.0 + 7.7)) - 0.5) * 0.05 + (vec3(vn(mm * 21.0), vn(mm * 21.0 + 2.2), vn(mm * 21.0 + 5.1)) - 0.5) * (0.05 + crust * 0.25)); }
    else if (id == 770 || id == 776) { vec2 mt = vec2(loc * 9.0, edge * 3.0 + inst * 1.7); tex = mt; float w = vn(mt * 2.0 + sd);
      a = vec3(0.09, 0.18, 0.34) * (0.85 + 0.3 * w); rg = 0.36; cc = 0.55;
      if (id == 770) { float cap = smoothstep(0.7, 1.0, edge); a = mix(a, vec3(0.62, 0.74, 0.85), cap * 0.3); spk += cap * 0.5; rg = 0.55; cc = 0.15; }   // (a tubercle, a little frost on its top)
      else { float lipL = 1.0 - smoothstep(0.55, 0.85, edge); emi += GRN * lipL * 0.35 * vlv; thru += GRN * lipL * 0.2 * vlv; a = mix(a, vec3(0.02, 0.05, 0.08), lipL * 0.5); } }   // (a vent's lip, its light spilling over)
    else if (id == 771) { float v = edge, t = clamp(ao, 0.0, 1.06), w = 0.5 - 0.5 * cos(6.28318 * v), up = step(v, 0.5); tex = vec2(t * 24.0, w * 9.0);
      float bone = 0.0, sh = 0.0, st = clamp(t, 0.0, 1.0), se = st * st * (3.0 - 2.0 * st); for (int k = 0; k < 3; k++) { float r0 = k == 0 ? 0.17 : k == 1 ? 0.3 : 0.43, r1 = k == 0 ? 0.14 : k == 1 ? 0.488 : 0.835, dw = abs(w - mix(r0, r1, se)), e2 = (dw - 0.055) / 0.02; bone = max(bone, exp(-dw * dw / 0.0009)); sh = max(sh, exp(-e2 * e2)); }
      bone *= smoothstep(0.02, 0.1, t); sh *= smoothstep(0.02, 0.1, t);
      float lead = smoothstep(0.12, 0.0, w), memb = smoothstep(0.5, 0.88, w) * (1.0 - bone), mo = vn(tex * 0.5 + sd), fk = smoothstep(0.66, 0.72, vn(tex + sd * 2.0));
      vec3 top = mix(vec3(0.1, 0.2, 0.37), vec3(0.74, 0.84, 0.91) * (0.94 + 0.08 * mo), smoothstep(0.03, 0.26, t)); top = mix(top, vec3(0.5, 0.64, 0.78), fk * 0.25 * smoothstep(0.1, 0.5, t));
      top = mix(top, vec3(0.8, 0.9, 0.96), bone * 0.4 * smoothstep(0.1, 0.3, t)); vec3 bot = vec3(0.87, 0.91, 0.94) * (0.94 + 0.06 * mo);
      a = mix(bot, top, up); a = mix(a, vec3(0.93, 0.96, 0.98), lead * 0.6); a *= 1.0 - sh * 0.1;
      float vein = smoothstep(0.06, 0.0, abs(fract(t * 16.0 + w * 2.5) - 0.5) - 0.44) * memb; a *= 1.0 - vein * 0.08;
      rg = mix(0.36, 0.28, bone); cc = 0.5 + 0.2 * bone; thru = vec3(0.32, 0.58, 0.72) * (0.15 + 0.85 * memb) * 0.9; cvv += sh * 0.3; spk += lead * 0.6 + 0.15;
      emi += GRH * lead * gl * 0.9 + GRN * bone * gl * 0.4 + GRN * memb * gl * 0.08; }
    else if (id == 772) { float v = edge, xa = ao * 2.0 - 1.0, w = 0.5 - 0.5 * cos(6.28318 * v), up = step(v, 0.5); tex = vec2(xa * 14.0, w * 5.0);
      float mo = vn(tex * 0.45 + sd), mo2 = vn(tex * 1.6 + 3.0);
      vec3 top = mix(vec3(0.04, 0.09, 0.19), vec3(0.085, 0.17, 0.31), mo) * (0.9 + 0.2 * mo2);
      float mk = smoothstep(0.55, 0.6, vn(vec2(xa * 4.5, w * 2.6) + sd * 2.0 + 4.0)) * (1.0 - smoothstep(0.75, 0.95, abs(xa))), edB = smoothstep(0.82, 0.98, w);
      vec3 bot = mix(vec3(0.88, 0.92, 0.94) * (0.94 + 0.06 * mo2), vec3(0.06, 0.12, 0.24), max(mk, edB * 0.9));
      a = mix(bot, top, up); a = mix(a, vec3(0.85, 0.9, 0.94), smoothstep(0.95, 1.0, abs(xa)) * 0.4);
      rg = 0.32; cc = mix(0.4, 0.75, up); thru = vec3(0.2, 0.3, 0.4) * (1.0 - up) * 0.4; spk += 0.2; }
    else if (id == 773) { float tip = clamp(1.0 - loc, 0.0, 1.0), rim = smoothstep(0.7, 1.0, edge); tex = vec2(edge * 5.0 + inst * 3.1, tip * 4.0);
      if (sk == 2) { a = mix(vec3(0.84, 0.93, 1.0), vec3(1.0), rim * 0.6); thru = vec3(0.4, 0.7, 1.0) * 0.5; rg = 0.12; cc = 1.0; spk += 1.5; emi += vec3(0.4, 0.6, 0.8) * 0.05; }
      else { a = mix(vec3(0.16, 0.36, 0.62), vec3(0.82, 0.93, 1.0), pow(tip, 0.75)) * (0.9 + 0.15 * vn(tex * 2.0)); thru = mix(vec3(0.2, 0.45, 0.85), vec3(0.6, 0.85, 1.1), tip) * 0.75; rg = 0.06; cc = 1.3;
        a = mix(a, vec3(0.95, 0.99, 1.0), rim * 0.75);
        float run = pow(max(0.0, sin(tt * 1.2 - inst * 0.55)), 12.0), crk = smoothstep(0.035, 0.0, abs(fract(edge * 2.3 + tip * 3.0 + inst * 0.37) - 0.5) - 0.45) * (1.0 - rim);
        emi += vec3(0.25, 0.55, 0.85) * (0.06 + 0.06 * tip) + vec3(0.9, 1.0, 1.15) * rim * (0.08 + 0.5 * run) + vec3(0.9, 1.0, 1.1) * run * tip * 0.35 + GRN * gl * 0.35 * (1.0 - tip) * (0.7 + 0.3 * sin(tt * 2.0 + inst)) + vec3(0.6, 0.85, 1.1) * crk * 0.25;
        spk += 0.6; } }
    else if (id == 774) { tex = vec2(loc * 12.0, edge * 4.0 + inst); float pl = smoothstep(0.1, 0.0, abs(fract(loc * 6.0 + inst * 0.3) - 0.5) - 0.4), g = vn(tex * 3.0 + sd);
      if (sk == 4) { a = vec3(0.03, 0.045, 0.07); rg = 0.5; cvv += 0.4; }
      else { a = mix(vec3(0.72, 0.75, 0.78), vec3(0.88, 0.9, 0.9), g) * (1.0 - pl * 0.3); if (sk == 2) a = vec3(0.9, 0.92, 0.93); rg = 0.78; cc = 0.1; cvv += pl * 0.2; spk += 0.8; a = mix(a, vec3(0.88, 0.94, 1.0), smoothstep(0.55, 0.9, hm) * 0.4); } }
    else if (id == 777) { float al = clamp(loc, 0.0, 1.0), pul = pow(max(0.0, sin(al * 11.0 - tt * 4.0 + inst * 1.3)), 8.0), pu2 = 0.6 + 0.3 * sin(tt * 2.0 + inst); tex = vec2(edge * 6.0, al * 20.0 + inst * 7.0);
      a = vec3(0.62, 0.86, 0.8); thru = vec3(0.3, 0.75, 0.58) * 0.9; rg = 0.3; cc = 0.7;
      emi += GRN * (0.1 + 0.55 * al * al) * pu2 * gl + GRH * pul * 0.55 * gl + GRH * pow(ndv0, 3.0) * 0.12 * gl; }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.5) / 1.5) * mix(1.0, oSH, 0.7); hm = dot(n, uUP);
    vec3 key = uAmb, sky = vec3(0.12, 0.18, 0.32) + uRim * 0.04, gnd = vec3(0.48, 0.56, 0.67);   // (the night's navy above, the snow's light below)
    vec3 ambC = mix(gnd, sky, 0.5 + 0.5 * hm) * (0.5 + 0.5 * occ);
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - max(0.0, dot(n, uV)), 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = mix(gnd * 0.42, mix(vec3(0.28, 0.36, 0.48), sky * 1.3, smoothstep(0.04, 0.55, ru)), smoothstep(-0.25, 0.06, ru)) + GRN * 0.16 * smoothstep(0.28, 0.48, ru) * (1.0 - smoothstep(0.6, 0.85, ru)) / (1.0 + rg * 4.0) + key * 0.8 * smoothstep(0.86, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);   // (the snow below the horizon, the pale horizon, the night, the aurora's band)
    vec3 col = a * (mix(ndl, wrap, 0.4) * key + ambC) + envC * (0.75 / (1.0 + rg * 2.5)) * occ * (0.05 + 0.95 * frs * (1.0 - rg * 0.6)) + spec * key * 0.07;
    col += thru * (0.35 * (1.0 - ndl) + 0.3 * max(0.0, -ndl0) + 0.2 * max(0.0, dot(n, uLR))) * key * (0.6 + 0.4 * occ);   // (light through the belly, the membranes, the ice; the glow under the skin)
    if (cc > 0.0) col += cc * (pow(nh, 110.0) * 0.7 * ndl * key + (0.04 + 0.96 * frs) * envC * 0.5) * occ;   // (the wet coat)
    if (spk > 0.0 && uLow < 0.5) col += vec3(1.0, 1.0, 1.1) * pow(vn(tex * 9.0 + sd), 24.0) * 2.6 * spk * max(0.0, ndl0 + 0.2);   // (rime glints)
    col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.8 * occ + pow(1.0 - ndv0, 3.0) * max(0.0, hm) * vec3(0.3, 0.45, 0.66) * 0.35 * occ;   // (the aurora's rim from the sky behind; the sky's own above)
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    col += emi * (1.0 - dead * 0.85) + vec3(1.0, 0.98, 0.95) * fl2 * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.8, 0.84, 0.9) * 0.75, dead * 0.75); }
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha, uAlpha); return; }
  /*</AH-AHU-MAT>*/
  /*<DA-SARRUKH-MAT ids 340..349 (v433 DA: 20y1-sarrukh-gl.js, Sarrukh the Bloom Serpent)>*/
  else if (id >= 340 && id <= 349) {   // ---- (v433 DA) Sarrukh the Bloom Serpent (Rift 03's first boss, 20y1): 340 its scales (a body slice: vA.y its place along the body, 0 the neck .. 1 the tail; its own normal NL.z the back (+) or the belly (-): bone-and-ochre scales in rows, darker saddles, pale belly scutes, cyan veins down the back pulsing toward the tail by uGlow; uSpill sand dusting it), 341 a fin's bone membrane (vA.y root..tip, vA.z across: cyan rays), 342 basalt (dark, glassy, vesicled; its root lit cyan by uGlow: 342 a dorsal plate (its own z its height), 342.1 a sepal and 342.3 the fluke (vA.y along), 342.2 a Resonator Spire's needle (resonance bands; uKind its cracks 0..1)), 343 bone, 344 an outer petal (a thick blade: vA.y along it, vA.z 0..1 across its outer face, 2 + across its inner: bone outside, rose within, a cyan rim; uKind the bloom), 345 an inner petal (amber to rose), 346 the heart (dark wet rose, veins lit by uGlow), 347 the orb (cyan-white light; uKind 1 flickering), 348 steel (a blade: vA.y 1 at its cutting edge, lit cyan (uKind 0) or amber (1) by uGlow), 349 sand (349 a lip round where it goes in, 349.1 the wake's hump and ridges: vA.y 0 at the hole or the crest .. 1 at the rim, where it fades into the floor; uGlow cyan from under it). uGlow2 a blow's flash, uFx dead (ashen), uWear the part's seed. Its light: a low amber dusk sun, the violet sky above, the sand's warm bounce below, a cyan rim
    int sk = int((vA.x - float(id)) * 10.0 + 0.5);
    float ndv0 = max(0.0, dot(n, uV)), hm = dot(n, uUP), tt = uTime, sd = uWear * 17.0, dead = clamp(uFx, 0.0, 1.0), gl = clamp(uGlow, 0.0, 3.0), fa = 1.0;
    vec3 CY = vec3(0.32, 1.0, 1.1);
    float w1 = vn(L.xy * 3.1 + L.z * 1.9 + sd), w2 = vn(L.yz * 8.0 + L.x * 4.0 + sd * 0.7), w3 = vn(L.xz * 23.0 + L.y * 11.0 + sd);
    if (id == 347) { vec3 p = normalize(L); float swl = vn(p.xy * 3.0 + vec2(tt * 0.7, -tt * 0.5) + p.z * 2.0), fl = mix(1.0, 0.55 + 0.45 * abs(sin(tt * 13.0) * sin(tt * 5.3 + 1.0)), clamp(uKind, 0.0, 1.0));
      vec3 hq = normalize(uLK + uV), c = mix(CY * 0.9, vec3(1.5, 1.85, 1.85), pow(ndv0, 1.6) * (0.6 + 0.4 * swl)) * (0.35 + 0.75 * gl) * fl + vec3(1.0) * pow(max(0.0, dot(n, hq)), 90.0) * 1.5;
      c = mix(c, vec3(0.09, 0.11, 0.12) * (0.6 + 0.6 * ndv0) + vec3(0.6) * pow(max(0.0, dot(n, hq)), 60.0), dead);
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    vec3 a = vec3(0.1), emi = vec3(0.0), thru = vec3(0.0), F0m = vec3(0.04); float rg = 0.6, cvv = 0.0, cc = 0.0, occ = 1.0, met = 0.0;
    if (id == 340 && sk == 2) {   // (v433 DA detail) the head's large plates: cells over its own surface, seams dark, each plate domed and edged bright
      vec2 hp = vec2(L.x * 4.2, atan(L.z + 0.2, L.y) * 2.2 + L.x * 0.6); vec2 hi = floor(hp), hf = fract(hp); float d1 = 9.0, d2 = 9.0; vec2 hc = vec2(0.0);
      for (int ii = -1; ii <= 1; ii++) for (int jj = -1; jj <= 1; jj++) { vec2 g = vec2(float(ii), float(jj)), o = vec2(fract(sin(dot(hi + g, vec2(41.3, 289.1))) * 43758.5), fract(sin(dot(hi + g, vec2(127.7, 61.9))) * 24634.6)) * 0.8 + 0.1, dd = g + o - hf; float l = dot(dd, dd); if (l < d1) { d2 = d1; d1 = l; hc = hi + g; } else if (l < d2) d2 = l; }
      float seam = 1.0 - smoothstep(0.02, 0.09, sqrt(d2) - sqrt(d1)), hv = fract(sin(dot(hc, vec2(12.9898, 78.233))) * 43758.5453), dome = 1.0 - sqrt(d1);
      a = mix(vec3(0.3, 0.2, 0.12), vec3(0.78, 0.64, 0.42), 0.25 + 0.5 * hv + 0.25 * smoothstep(0.0, 0.5, L.z)) * (0.75 + 0.35 * dome); a *= 1.0 - 0.75 * seam; cvv += seam * 0.6; rg = 0.4; cc = 0.5 * (1.0 - seam);
      emi += CY * seam * gl * 0.25 * smoothstep(0.2, 0.5, L.z); }
    else if (id == 340) { float s = clamp(edge, 0.0, 1.0), bk = NL.z, an = atan(NL.z, NL.y), adn = abs(an - 1.5708);
      vec3 TA = normalize(uM0), TR = normalize(-sin(an) * uM1 + cos(an) * uM2);   // (along the body toward the head; round it)
      float bel = smoothstep(-0.2, -0.45, bk), dor = 1.0 - smoothstep(0.3, 0.36, adn);
      // flank scales: staggered rows of keeled scales, each overlapping the next like shingles (it rises toward its free edge, toward the tail)
      vec2 q = vec2(s * 82.0, an * 4.456); float row = floor(q.x); q.y += mod(row, 2.0) * 0.5;
      if (dor > 0.5) q = vec2(s * 44.0 + 0.5, (an - 1.5708) / 0.66 + 0.5);   // (a row of large plates down the spine)
      if (bel > 0.5) q = vec2(s * 46.0, 0.5);   // (the belly: broad scutes across it)
      vec2 ci = floor(q), cf = fract(q); float ey = cf.y - 0.5, eg = 0.7 + 0.28 * sqrt(max(0.0, 1.0 - 4.0 * ey * ey)), fu = cf.x;
      if (bel > 0.5) eg = 0.86;
      float ins = 1.0 - smoothstep(eg - 0.03, eg + 0.015, fu), h = ins * fu / eg + (1.0 - ins) * 0.12 * (fu - eg) / max(0.02, 1.0 - eg), gap = exp(-pow((fu - eg) / 0.03, 2.0)), sheen = smoothstep(eg - 0.16, eg - 0.03, fu) * ins;
      float keel = exp(-pow(ey / 0.07, 2.0)) * ins * (1.0 - bel) * smoothstep(0.1, 0.5, fu), hv = fract(sin(dot(ci, vec2(12.9898, 78.233))) * 43758.5453);
      if (uLow < 0.5) n = normalize(n + TA * (0.42 * ins - 0.25 * gap) * (bel > 0.5 ? 0.6 : 1.0) + TR * (-sign(ey) * keel * 0.35 + ey * 0.35 * ins * (1.0 - bel)));
      // colour: ochre and bone scales, diagonal saddles wrapping down the flanks (dark umber, a pale rim), the spine's plates darker, the belly pale
      float dg = sin(s * 6.2832 * 8.0 + an * 1.7 + 0.8 * (w1 - 0.5) + sd), sad = smoothstep(0.15, 0.4, dg) * (1.0 - bel), srm = exp(-pow((dg - 0.08) / 0.09, 2.0)) * (1.0 - bel);
      vec3 sca = mix(vec3(0.58, 0.42, 0.21), vec3(0.88, 0.74, 0.49), 0.35 + 0.45 * hv + 0.2 * (w1 - 0.5));
      sca = mix(sca, vec3(0.27, 0.15, 0.09) * (0.8 + 0.4 * hv), sad * 0.8); sca = mix(sca, vec3(0.95, 0.88, 0.7), srm * 0.55); sca = mix(sca, vec3(0.32, 0.24, 0.18) * (0.85 + 0.3 * hv), dor * 0.65);
      vec3 bc = mix(vec3(0.96, 0.9, 0.74), vec3(0.84, 0.72, 0.5), 0.35 * w2);
      a = mix(sca, bc, bel) * (0.62 + 0.38 * h) * (1.0 - 0.55 * gap); cvv += gap * 0.7 + (1.0 - h) * 0.25;
      a *= 1.0 - 0.45 * exp(-pow((bk + 0.32) / 0.06, 2.0));   // (the seam between the flank and the belly)
      rg = mix(0.38, 0.5, bel) - 0.12 * sheen; cc = (0.35 + 0.5 * sheen) * (1.0 - 0.5 * bel); a += vec3(0.16, 0.13, 0.09) * sheen * (1.0 - sad * 0.6);
      float pul = 0.7 + 0.3 * sin(tt * 5.0 - s * 38.0), wv = 0.06 * sin(s * 55.0 + sd), v1 = exp(-pow((an - 1.93 - wv) / 0.04, 2.0)), v2 = exp(-pow((an - 1.21 + wv) / 0.04, 2.0)), v0 = exp(-pow(fu - eg, 2.0) / 0.0016) * dor * 0.6;
      float vein = (v1 + v2 + v0) * (1.0 - bel) * smoothstep(0.98, 0.85, s);
      emi += CY * vein * (0.12 + 0.85 * gl) * pul; a = mix(a, vec3(0.2, 0.42, 0.45), (v1 + v2) * 0.4 * (1.0 - bel));
      float du = clamp(uSpill, 0.0, 1.5) * smoothstep(0.1, 0.8, hm + 0.35 * (w2 - 0.5)) * 0.5; a = mix(a, vec3(0.86, 0.68, 0.42) * (0.9 + 0.2 * w3), du * (0.4 + 0.6 * (1.0 - h))); cc *= 1.0 - du; }
    else if (id == 341) { float al = clamp(edge, 0.0, 1.0), ac = clamp(ao, 0.0, 1.0), ray = exp(-pow((fract(ac * 5.0) - 0.5) / 0.1, 2.0));
      a = mix(mix(vec3(0.55, 0.38, 0.18), vec3(0.9, 0.78, 0.55), al), vec3(0.97, 0.93, 0.82), smoothstep(0.75, 1.0, al)) * (0.85 + 0.25 * w2) * (1.0 - 0.2 * ray);
      rg = 0.5; cc = 0.2; thru = vec3(1.0, 0.72, 0.4) * (0.25 + 0.2 * al) * (1.0 - 0.6 * ray); emi += CY * ray * (0.08 + 0.55 * gl) * (0.6 + 0.4 * al); }
    else if (id == 342) { float ht = sk == 0 ? L.z : clamp(edge, 0.0, 1.0);
      a = vec3(0.075, 0.068, 0.085) * (0.75 + 0.5 * w1); float ves = smoothstep(0.78, 0.92, w3); a *= 1.0 - 0.6 * ves; cvv += ves * 0.4; rg = 0.24 + 0.2 * w2; cc = 0.65;
      float root = sk == 2 ? 0.0 : 1.0 - smoothstep(0.0, sk == 0 ? 0.22 : 0.3, ht); emi += CY * root * (0.1 + 0.6 * gl) * (0.7 + 0.3 * sin(tt * 4.0 + sd));
      if (sk == 2) { float hz = L.z, band = exp(-pow((fract((hz - L.x * 0.25) * 1.1 + 0.2) - 0.5) / 0.045, 2.0)) * step(0.3, hz) * step(hz, 3.9), ck = clamp(uKind, 0.0, 1.0);
        emi += CY * band * (0.25 + 0.75 * gl) * (0.75 + 0.25 * sin(tt * 6.0 - hz * 2.0)); a = mix(a, vec3(0.18, 0.4, 0.45), band * 0.5);
        float crk = smoothstep(0.045, 0.0, abs(vn(L.xz * 2.6 + L.y * 1.9 + 5.0) - 0.5)) * step(1.0 - ck * 1.1, vn(L.xy * 1.3 + L.z * 0.7 + 2.0)) * step(0.05, ck);
        a = mix(a, vec3(0.01), crk); emi += CY * crk * (0.7 + 0.6 * ck); }
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 9.0 + sd), vn(L.zx * 9.0 + 3.0), vn(L.xy * 9.0 + 7.0)) - 0.5) * 0.22); }
    else if (id == 343) { float gr = abs(fract(L.z * 6.0 + w1 * 1.5) - 0.5); a = vec3(0.9, 0.84, 0.7) * (0.82 + 0.22 * w1) * (1.0 - 0.18 * smoothstep(0.1, 0.0, gr)); a *= 1.0 - 0.3 * smoothstep(0.82, 0.95, w3); rg = 0.55; cc = 0.15;
      emi += CY * gl * 0.25 * smoothstep(5.2, 5.7, L.z); }
    else if (id == 344 || id == 345) { float al = clamp(edge, 0.0, 1.0), inner = step(1.5, ao), ac = clamp(ao - 2.0 * inner, 0.0, 1.0), dm = abs(ac - 0.5) * 2.0, bl = clamp(uKind, 0.0, 1.0);
      float vein = smoothstep(0.1, 0.0, abs(fract((ac - 0.5) * (7.0 - 3.0 * al) + 0.5 + 0.15 * vn(vec2(al * 5.0, ac * 3.0) + sd)) - 0.5)) * (1.0 - 0.6 * al);
      if (id == 344) { if (inner > 0.5) a = mix(mix(vec3(0.85, 0.5, 0.2), vec3(0.62, 0.2, 0.3), smoothstep(0.0, 0.35, al)), vec3(0.86, 0.42, 0.48), smoothstep(0.5, 1.0, al));
        else a = mix(mix(vec3(0.66, 0.53, 0.33), vec3(0.93, 0.87, 0.71), smoothstep(0.0, 0.7, al)), vec3(0.8, 0.45, 0.5), bl * 0.35 * smoothstep(0.3, 1.0, al));
        a *= (0.85 + 0.25 * w1) * (1.0 - 0.42 * vein); rg = 0.45; cc = 0.3; thru = vec3(1.0, 0.55, 0.5) * (0.12 + 0.25 * bl) * (smoothstep(0.6, 1.0, dm) + 0.3 * al); }
      else { a = mix(vec3(0.95, 0.58, 0.18), vec3(0.85, 0.32, 0.42), smoothstep(0.0, 0.55, al)) * (0.85 + 0.25 * w1) * (1.0 - 0.2 * vein); rg = 0.38; cc = 0.4; thru = vec3(1.0, 0.5, 0.45) * (0.25 + 0.4 * bl) * (smoothstep(0.5, 1.0, dm) + 0.4); }
      float rim = smoothstep(0.78, 0.98, dm) + smoothstep(0.86, 1.0, al) * 0.8; emi += CY * rim * (0.2 + 0.7 * gl) * (0.8 + 0.2 * sin(tt * 3.0 + sd));
      if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 10.0 + sd), vn(L.zx * 10.0 + 3.0), vn(L.xy * 10.0 + 7.0)) - 0.5) * 0.1); }
    else if (id == 346) { float rib = clamp(edge, 0.0, 1.0), vv = vn(vec2(atan(L.z, L.y) * 4.0 + sd, L.x * 5.0) + w1 * 0.6), vein = smoothstep(0.06, 0.0, abs(vv - 0.5));
      a = mix(vec3(0.22, 0.06, 0.1), vec3(0.45, 0.16, 0.22), rib) * (0.8 + 0.35 * w1); rg = 0.25; cc = 0.85; cvv += (1.0 - rib) * 0.25; emi += CY * vein * (0.08 + 0.7 * gl) * (0.7 + 0.3 * sin(tt * 3.0 + L.x * 4.0)); }
    else if (id == 348) { met = 1.0; float eg = clamp(edge, 0.0, 1.0), br = vn(vec2(L.x * 2.0 + sd, L.y * 60.0)); F0m = vec3(0.72, 0.76, 0.82) * (0.85 + 0.2 * br); rg = 0.16 + 0.12 * br;
      vec3 ec = uKind > 0.5 ? vec3(1.3, 0.75, 0.22) : CY; emi += ec * eg * (0.15 + 1.2 * gl) + vec3(1.0) * eg * 0.12; }
    else { float rm = clamp(edge, 0.0, 1.0), rip = 0.5 + 0.5 * sin((L.x * 0.8 + L.y * 0.3) * 9.0 + w1 * 3.0);
      a = mix(vec3(0.8, 0.6, 0.34), vec3(0.93, 0.77, 0.5), w1 * 0.7 + 0.15) * (0.9 + 0.15 * w3) * (0.94 + 0.08 * rip);
      if (sk == 0) a = mix(a, vec3(0.42, 0.28, 0.15), smoothstep(0.16, 0.0, rm) * 0.6); else a *= 1.0 + 0.12 * smoothstep(0.3, 0.0, rm);
      rg = 0.92; fa = 1.0 - smoothstep(0.5, 1.0, rm); emi += vec3(1.0, 0.95, 0.8) * step(0.965, vn(L.xy * 70.0 + L.z * 40.0)) * 0.25 + CY * gl * 0.3 * (1.0 - rm); }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } occ *= oAO;
    float ndl0 = dot(n, uLK), ndl = max(0.0, ndl0) * oSH, wrap = max(0.0, (ndl0 + 0.4) / 1.4) * mix(1.0, oSH, 0.7);
    vec3 key = vec3(1.45, 1.12, 0.78), ambC = mix(vec3(0.34, 0.24, 0.14), vec3(0.3, 0.22, 0.36), 0.5 + 0.5 * hm) * (0.55 + 0.45 * occ) * uAmb;
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rg * rg + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * ndl, frs = pow(1.0 - ndv0, 5.0);
    vec3 rr = 2.0 * dot(n, uV) * n - uV; float ru = dot(rr, uUP);
    vec3 envC = ru > 0.0 ? mix(vec3(0.95, 0.55, 0.32), vec3(0.32, 0.18, 0.32), smoothstep(0.0, 0.6, ru)) : mix(vec3(0.95, 0.55, 0.32), vec3(0.42, 0.3, 0.17), smoothstep(0.0, -0.3, ru));
    envC += vec3(1.0, 0.85, 0.6) * 1.4 * smoothstep(0.86, 0.97, dot(rr, uLS)) / (1.0 + rg * 5.0);
    vec3 col;
    if (met > 0.5) { vec3 Fr = F0m + (1.0 - F0m) * frs; col = Fr * ((envC + vec3(0.35, 0.3, 0.28)) * 1.25 * occ + spec * key * 1.4) + F0m * 0.3 * (wrap * key + ambC); }
    else { col = a * (mix(ndl, wrap, 0.45) * key + ambC) + (envC * (0.9 / (1.0 + rg * 2.5)) * occ + spec * key * 0.9) * (0.04 + 0.96 * frs * (1.0 - rg * 0.6));
      if (cc > 0.0) col += cc * (pow(nh, 200.0) * 3.5 * ndl + 0.3 * frs * envC) * occ;
      col += thru * (0.6 + 0.4 * max(0.0, -ndl0)); }
    if (id != 349) col += pow(1.0 - ndv0, 2.4) * max(0.0, dot(n, uLR) + 0.35) * uRim * 0.4 * occ; else col *= 1.85;   // (the sand lifted to the painted floor's brightness after the tone curve)
    col *= 1.0 - min(0.8, cvv * 0.5 + (1.0 - occ) * 0.45);
    if (dead > 0.0) { float lum = dot(col, vec3(0.3, 0.55, 0.15)); col = mix(col, vec3(lum) * vec3(0.82, 0.78, 0.74) * 0.75, dead * 0.75); }
    col += emi * (1.0 - dead * 0.9) + vec3(1.0, 0.92, 0.8) * clamp(uGlow2, 0.0, 1.0) * (0.22 + 0.45 * pow(1.0 - ndv0, 2.0));   // (a blow's flash)
    gl_FragColor = vec4(vec3(tone(col.r), tone(col.g), tone(col.b)) * uAlpha * fa, uAlpha * fa); return; }
  /*</DA-SARRUKH-MAT>*/
  else if (id >= 38 && id <= 47) {   // ---- Nidhogg (M). uKind 0 a rigid part (detail from its own coordinates), 6 a swept tube (vA.y = along it in armour periods, vA.z = round it, 0 the top, 0.5 the belly), 7 a moving part with a true edge and occlusion; uGlow2 = the trace (Ultima: every seam white-hot)
    float su = edge, sv = ao, trc = clamp(uGlow2, 0.0, 1.0), gK = 0.35 + 0.9 * uGlow + 0.45 * trc, ndv0 = max(0.0, dot(n, uV)); vec3 fireC = vec3(1.0, 0.3, 0.05), hotC = vec3(1.6, 0.9, 0.42);
    if (uKind > 5.5 && uKind < 6.5) { edge = 0.0; ao = 0.72 + 0.28 * smoothstep(0.0, 0.32, abs(sv - 0.5)); }   // (a tube: its underside shaded)
    if (id == 43 || id == 44 || id == 47) { float fl = 0.86 + 0.28 * vn(L.xy * 23.0 + L.z * 9.0 + vec2(uTime * 1.3, -uTime)); vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)); vec3 c;
      if (id == 43) c = mix(vec3(0.85, 0.1, 0.02), hotC, ndv0 * ndv0 * (0.45 + 0.55 * min(1.0, uGlow + trc))) * fl * gK;   // fire: seams, vent slots, the mouth, the hubs' rings
      else if (id == 44) c = mix(vec3(1.1, 0.28, 0.02), vec3(1.8, 1.25, 0.55), pow(ndv0, 3.0)) * (0.7 + 0.4 * uGlow) * fl + pow(nh, 240.0) * 1.4;   // an eye: molten amber, a small wet glint
      else c = vec3(0.36, 0.008, 0.035) * (0.8 + 0.8 * uGlow) + vec3(1.0, 0.3, 0.38) * pow(1.0 - ndv0, 2.0) * 0.7 + pow(nh, 70.0) * 2.4 + vec3(0.9, 0.1, 0.15) * smoothstep(0.7, 1.0, edge) * 0.5;   // the gem: crimson glass, hard facet glints
      gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
    if (id == 38) {   // crimson scales: staggered rows of rounded scales, each tilted its own way (a sparkle of tight highlights), dark in the crevice at its root, a lighter worn edge, a dark line where the next overlaps; a faint fire in the joints
      metal = 0.0; F0 = vec3(0.05); vec2 uv; if (uKind > 5.5 && uKind < 6.5) uv = vec2(su * 3.0, sv * 16.0); else { vec3 an = abs(NL); uv = (an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz) * 12.0; }
      float row = floor(uv.x); vec2 f = vec2(fract(uv.x), fract(uv.y + 0.5 * mod(row, 2.0))); vec2 cell = vec2(row, floor(uv.y + 0.5 * mod(row, 2.0))); float d = length(vec2(f.x, (f.y - 0.5) * 1.5)), hc = hs(cell), hc2 = hs(cell + 4.1), hc3 = hs(cell + 8.3);
      alb = mix(vec3(0.08, 0.005, 0.012), vec3(0.46, 0.026, 0.045), smoothstep(0.05, 0.8, d)) * (0.8 + 0.4 * hc); alb = mix(alb, vec3(0.62, 0.07, 0.07), smoothstep(0.8, 0.95, d) * (1.0 - smoothstep(0.95, 1.0, d)) * 0.6);   // (deep crimson, a lighter rim)
      if (uLow < 0.5) n = normalize(n + (vec3(hc, hc2, hc3) - 0.5) * 0.55 * smoothstep(0.15, 0.6, d) * smoothstep(1.0, 0.92, d));   // (each scale's own tilt)
      rough = mix(0.5, 0.16, smoothstep(0.3, 0.9, d)) * (0.75 + 0.5 * hc2); coat = 0.08 + 0.18 * hc * smoothstep(0.5, 0.9, d); cav += smoothstep(0.88, 1.0, d) * 1.1 + smoothstep(0.35, 0.0, d) * 0.45;
      em += fireC * smoothstep(0.93, 1.0, d) * 0.12 * uGlow;
      if (uKind > 5.5 && uKind < 6.5) { float top = smoothstep(0.17, 0.1, min(sv, 1.0 - sv)), fs = fract(su), sm = smoothstep(0.08, 0.0, fs) + smoothstep(0.97, 1.0, fs); em += mix(fireC, hotC, sm) * sm * top * gK * 0.7; } }   // (the glowing seam between two lames)
    else if (id == 39) {   // scarlet lacquered armour: a deep coat, panel lines at the plate's rims, chips to bare steel near the edges
      metal = 0.0; alb = vec3(0.5, 0.026, 0.042); F0 = vec3(0.05); rough = 0.3; coat = 0.38; float line = smoothstep(0.82, 0.96, edge); cav += line * 0.85;
      if (uKind < 5.5) { alb *= 0.9 + 0.2 * vn(L.xy * 7.0 + L.z * 3.0); if (uLow < 0.5) n = normalize(n + (vec3(vn(L.yz * 21.0), vn(L.zx * 21.0 + 3.0), vn(L.xy * 21.0 + 7.0)) - 0.5) * 0.12); float chip = smoothstep(0.66, 0.74, vn(L.xy * 27.0 + L.z * 13.0) * 0.55 + smoothstep(0.3, 0.8, edge) * 0.5) * (1.0 - line) * (1.0 - uLow);
        if (chip > 0.0) { metal = chip; alb = mix(alb, vec3(0.12, 0.11, 0.12), chip); F0 = mix(F0, vec3(0.55, 0.53, 0.52), chip); rough = mix(rough, 0.28, chip); coat *= 1.0 - chip; } }
      em += (fireC * 0.6 * uGlow + hotC * 0.9 * trc) * line; }
    else if (id == 40) {   // dark steel / gunmetal: turned machining, a warm bounce from the belly's light below; a moving rail's glowing centre seam
      alb = vec3(0.06, 0.055, 0.062); F0 = vec3(0.42, 0.4, 0.43); rough = 0.34; if (uKind < 5.5) { cav += 0.25 * step(0.62, fract((L.x + L.z * 0.3) * 20.0)) * (1.0 - uLow); rough *= 0.8 + 0.4 * vn(L.xy * 15.0 + L.z * 7.0); }
      em += vec3(0.3, 0.06, 0.012) * uGlow * smoothstep(0.2, -0.7, dot(n, uUP));
      if (uKind > 6.5) { float sm = smoothstep(0.9, 0.98, edge); em += mix(fireC, hotC, sm) * sm * gK; edge = 0.0; } }
    else if (id == 41) {   // horn: gunmetal with growth grooves
      alb = vec3(0.05, 0.048, 0.055); F0 = vec3(0.3, 0.29, 0.32); rough = 0.4; float g = abs(fract(length(L) * 34.0 + vn(L.xy * 6.0) * 0.6) - 0.5); cav += smoothstep(0.12, 0.0, g) * 0.5 * (1.0 - uLow); rough *= 0.85 + 0.3 * vn(L.yz * 20.0); }
    else if (id == 42) {   // the belly: bronze-dark plates lit from within, the seams between them glowing
      metal = 0.0; alb = vec3(0.28, 0.05, 0.03); F0 = vec3(0.05); rough = 0.36; coat = 0.6; float sm;
      if (uKind > 5.5 && uKind < 6.5) { float fs = fract(su * 2.0); sm = max(smoothstep(0.08, 0.0, fs) + smoothstep(0.96, 1.0, fs), smoothstep(0.012, 0.0, abs(sv - 0.5))); alb *= 0.75 + 0.5 * fs; }
      else sm = smoothstep(0.84, 0.97, edge);
      cav += sm * 0.4; em += mix(fireC, hotC, sm * 0.7) * (sm * 1.3 + 0.16 + 0.12 * (1.0 - ndv0)) * gK; }
    else if (id == 45) { metal = 0.0; alb = vec3(0.78, 0.71, 0.6); F0 = vec3(0.06); rough = 0.28; coat = 0.6; em += fireC * 0.05 * uGlow; }   // teeth: old ivory, lit a little by the mouth
    else { metal = 0.0; alb = vec3(0.022, 0.01, 0.013); F0 = vec3(0.06); rough = 0.17; coat = 1.0; } }   // talons, pupils: black-red, glossy
  else if ((id >= 49 && id <= 57) || id == 67 || id == 68) {   // ---- the Beast Machine (M): the core's own 2D shading (20k9i shade()) on the GPU: its palette, mottled rust, pitting, scratches, hex panels with corner rivets (uKind 1), the domes' riveted panels (uKind 2), gold rivets, worn edges, a warm key, cool sky and rim, its tone curve. 49 bronze, 50 plate, 51 gold, 52 steel, 54 leather, 55 cable, 56 eye, 57 dark bronze, 67 vent glow, 68 jewel. uGlow2 = the stored charge (a thin pulse of light along the rims and seams)
    float chg = clamp(uGlow2, 0.0, 1.0), ndv = max(0.001, dot(n, uV));
    if (id == 56) { float k = 0.6 + 0.5 * ndv * ndv, d3 = ndv * ndv * ndv; vec3 hh0 = normalize(uLK + uV); float glint = pow(max(0.0, dot(n, hh0)), 240.0) * 1.4;   // (the 2D's eye: a red iris, a small hot core where it faces you, a tiny glint)
      float hc = pow(max(ndv, 0.0), 1.2); vec3 c = vec3(tone5(2.4 * k * (0.8 + 0.3 * uGlow)), tone5(0.35 + 1.5 * hc), tone5(0.18 + 0.9 * hc * hc)) + glint; gl_FragColor = vec4(c * uAlpha, uAlpha); return; }
    if (id == 67) { float k = 0.6 + 0.5 * ndv * ndv; gl_FragColor = vec4(vec3(tone5(1.5 * k), tone5(0.3 * k), tone5(0.12 * k)) * uAlpha, uAlpha); return; }
    vec3 a, f; float rgh, mt = 1.0, cv = 0.0, wk = 0.0, su = 0.0;
    if (id == 49) { a = vec3(0.23, 0.105, 0.065); f = vec3(0.58, 0.33, 0.23); rgh = 0.46; }
    else if (id == 50) { a = vec3(0.26, 0.12, 0.07); f = vec3(0.68, 0.4, 0.27); rgh = 0.36; }
    else if (id == 51) { a = vec3(0.5, 0.33, 0.08); f = vec3(1.0, 0.76, 0.3); rgh = 0.2; }
    else if (id == 52) { a = vec3(0.12, 0.125, 0.14); f = vec3(0.52, 0.54, 0.6); rgh = 0.26; }
    else if (id == 54) { a = vec3(0.42, 0.05, 0.06); f = vec3(0.05, 0.04, 0.04); rgh = 0.5; mt = 0.0; }
    else if (id == 55) { a = vec3(0.25, 0.1, 0.36); f = vec3(0.06, 0.05, 0.08); rgh = 0.32; mt = 0.0; }
    else if (id == 68) { a = vec3(0.5, 0.02, 0.05); f = vec3(0.09, 0.08, 0.08); rgh = 0.03; mt = 0.0; }
    else { a = vec3(0.17, 0.075, 0.045); f = vec3(0.62, 0.32, 0.2); rgh = 0.33; }
    bool dyn = uKind > 5.5, bronze = id == 49 || id == 50 || id == 57; vec3 q = L, nl = NL;
    if (uKind > 5.5 && uKind < 6.5) { su = edge; edge = 0.0; ao = 1.0; }
    if (!dyn && uLow < 0.5 && (bronze || id == 51 || id == 52)) { float dk = id == 51 ? 0.05 : 0.1; nl += (vec3(vn(vec2(q.y, q.z) * 11.0), vn(vec2(q.z, q.x) * 11.0 + 3.0), vn(vec2(q.x, q.y) * 11.0 + 7.0)) - 0.5) * dk; }   // (dents)
    if (bronze && !dyn) {
      float wn = (vn(vec2(q.x + q.z * 0.7, q.y - q.z * 0.3) * 6.0 + vec2(3.0, 0.0)) + vn(vec2(q.y * 1.3 + 5.0 / 6.0, q.z * 1.3 - q.x * 0.4) * 6.0)) * 0.5, wn2 = vn(vec2(q.x * 23.0 + q.y * 7.0, q.z * 23.0 - q.y * 5.0));
      float k = 0.55 + 0.85 * wn * (0.8 + 0.4 * wn2); a *= vec3(k, k * (0.92 + 0.12 * wn), k * 0.9); f *= vec3(0.85 + 0.25 * wn, 0.8 + 0.3 * wn, 0.8 + 0.25 * wn); rgh = min(0.75, rgh * (0.75 + 0.7 * (1.0 - wn)) + 0.08 * wn2);   // (mottled rust)
      float pit = vn(vec2(q.x * 70.0 + q.z * 31.0, q.y * 70.0 - q.z * 23.0)); if (pit > 0.78) { cv += (pit - 0.78) * 2.2; rgh = min(0.8, rgh + 0.2); }
      if (wn < 0.44) { float v = min(1.0, (0.44 - wn) * 2.4); a = mix(a, vec3(0.33, 0.12, 0.06), v * 0.5); f *= vec3(1.0 - v * 0.45, 1.0 - v * 0.55, 1.0 - v * 0.55); rgh = mix(rgh, 0.7, v); }
      if (uKind > 0.5 && uKind < 1.5 && id != 57 && uLow < 0.5) {   // hex panels: bevelled edges, dark seams, an inner step, rivets at the corners
        vec3 an = abs(nl); vec2 uv; vec3 t1, t2; if (an.z >= an.x && an.z >= an.y) { uv = q.xy; t1 = vec3(1.0, 0.0, 0.0); t2 = vec3(0.0, 1.0, 0.0); } else if (an.y >= an.x) { uv = q.xz; t1 = vec3(1.0, 0.0, 0.0); t2 = vec3(0.0, 0.0, 1.0); } else { uv = q.yz; t1 = vec3(0.0, 1.0, 0.0); t2 = vec3(0.0, 0.0, 1.0); }
        uv = uv / 0.12 + vec2(0.37, 0.21);
        vec2 A2 = vec2(mod(uv.x, 1.0) - 0.5, mod(uv.y, 1.7320508) - 0.8660254), B2 = vec2(mod(uv.x - 0.5, 1.0) - 0.5, mod(uv.y - 0.8660254, 1.7320508) - 0.8660254), g = dot(A2, A2) < dot(B2, B2) ? A2 : B2, ag = abs(g);
        float hr = max(ag.x, ag.x * 0.5 + ag.y * 0.8660254); vec3 td = (t1 * g.x + t2 * g.y) / (length(g) + 1e-4);
        float tilt = hr > 0.4 ? (hr - 0.4) / 0.1 * 0.55 : (hr > 0.28 && hr < 0.32 ? -0.35 * (1.0 - abs(hr - 0.3) / 0.02) : 0.0); nl += td * tilt; if (hr > 0.475) cv += (hr - 0.475) / 0.025 * 0.75;
        float rd1 = length(vec2(ag.x, ag.y - 0.577)), rd2 = length(vec2(ag.x - 0.5, ag.y - 0.2887)); vec2 cc = rd2 < rd1 ? vec2(0.5, 0.2887) : vec2(0.0, 0.577); float rd = min(rd1, rd2);
        if (rd < 0.085) { vec2 s2 = sign(g) * (ag - cc) / 0.085; nl += (t1 * s2.x + t2 * s2.y) * 0.9; f = min(vec3(1.0), f * vec3(1.25, 1.2, 1.15)); rgh *= 0.6; cv = max(0.0, cv - 0.9) + (rd / 0.085 > 0.8 ? 0.5 : 0.0); } }
      if (uKind > 1.5 && uKind < 2.5 && id == 49 && uLow < 0.5) {   // the dome's panels: latitude and longitude seams, bevelled, riveted along the seams
        float px = q.x, py = abs(q.y) - 0.04, pz = q.z + 0.02, rh = length(vec2(px, py)), az = atan(py, px), el = atan(pz, rh), rr = length(vec2(rh, pz)), sy = q.y < 0.0 ? -1.0 : 1.0;
        float fa = fract(az / 0.62 + 0.3), fe = fract(el / 0.5 + 0.25), da = min(fa, 1.0 - fa) * 0.62 * rr, de = min(fe, 1.0 - fe) * 0.5 * rr, dmin = min(da, de);
        if (dmin < 0.04) { float k3 = (1.0 - dmin / 0.04) * 0.5; if (da < de) { float sg = fa < 0.5 ? 1.0 : -1.0; nl += vec3(-sin(az) * sg, cos(az) * sg * sy, 0.0) * k3; } else { float sg = fe < 0.5 ? 1.0 : -1.0; nl += vec3(-sin(el) * cos(az) * sg, -sin(el) * sin(az) * sg * sy, cos(el) * sg) * k3; } if (dmin < 0.008) cv += (1.0 - dmin / 0.008) * 0.85; }
        float ra = da < de ? fract(el * rr / 0.075) : fract(az * rr / 0.075), rd3 = length(vec2(min(ra, 1.0 - ra) * 0.075, dmin - 0.022));
        if (rd3 < 0.016) { f = min(vec3(1.0), f * vec3(1.3, 1.25, 1.2)); rgh *= 0.55; if (rd3 > 0.012) cv += 0.5; else nl.z += 0.4; } }
      float sc1 = abs(fract(q.x * 13.0 + q.y * 8.0 + q.z * 5.0 + vn(q.xz * 4.0) * 2.5) - 0.5), sc2 = abs(fract(-q.x * 7.0 + q.y * 11.0 + q.z * 9.0 + vn(q.yx * 4.0) * 2.5) - 0.5);   // (fine scratches)
      if ((sc1 < 0.018 && hs(vec2(floor(q.x * 13.0 + q.y * 8.0 + q.z * 5.0), floor(q.z * 6.0))) > 0.6) || (sc2 < 0.014 && hs(vec2(floor(q.y * 11.0 - q.x * 7.0), floor(q.x * 5.0))) > 0.7)) { wk += 0.55; rgh *= 0.5; } }
    if (id == 51 && !dyn && uLow < 0.5) { vec3 gq = floor(q / 0.085 + 0.5) * 0.085, dq = q - gq; float rd = length(dq); if (rd < 0.024 && hs(gq.xy * 9.0 + gq.z * 3.7) < 0.75) { nl += dq / 0.024 * 1.3; rgh *= 0.7; if (rd / 0.024 > 0.85) cv += 0.4; }   // (gold: rivets on a fine lattice, worn)
      float wn = vn(vec2(q.x * 18.0, q.y * 18.0 + q.z * 9.0)); rgh *= 0.7 + 0.8 * wn; if (wn < 0.3) f *= vec3(0.82, 0.75, 0.7); }
    if (id == 52 && !dyn) { float s2 = abs(fract((q.x + q.z) * 40.0 + vn(q.yx * 9.0) * 3.0) - 0.5); if (s2 < 0.1) rgh *= 0.6; }
    if (id == 55) { float fr = abs(fract(dyn ? su * 0.8 : (q.x + q.y * 0.3) * 26.0) - 0.5); if (fr < 0.16) cv += 0.6; }
    if (id == 54 && !dyn) { vec2 uv2 = vec2(q.x + q.y, q.x - q.y) * 11.0, dd = fract(uv2) - 0.5; float d = length(dd); if (d < 0.18) { cv += (0.18 - d) * 2.6; nl.xy -= dd * 0.6; if (d < 0.07) a = vec3(0.75, 0.5, 0.18); } else { nl.xy += dd * 0.25; nl.z += 0.2; } }
    { vec3 n2 = normalize(normalize(uM0) * nl.x + normalize(uM1) * nl.y + normalize(uM2) * nl.z); if (dot(n2, n) < 0.0) n2 = -n2; n = n2; ndv = max(0.001, dot(n, uV)); }
    wk += smoothstep(0.3, 0.9, edge) * (id == 52 ? 0.4 : 0.9);   // (edges worn bright)
    if (wk > 0.0) { float v = min(1.0, wk); f = mix(f, vec3(1.0, id == 51 ? 0.92 : 0.72, id == 51 ? 0.6 : 0.5), v * 0.5); rgh *= 1.0 - v * 0.45; }
    float oAO = 1.0, oSH = 1.0; if (uNOcc > 0.5 && uLow < 0.5) { oAO = occAO(vW, n); oSH = occSH(vW, uLK); } ao *= oAO;   // (the other parts: occlusion, the key light's soft shadow)
    float ndl = dot(n, uLK), dif = max(0.0, ndl) * oSH, hm = 0.5 + 0.5 * dot(n, uUP); vec3 am = mix(vec3(0.11, 0.065, 0.045), vec3(0.34, 0.35, 0.43), hm * hm) * ao * ao * 0.66;
    vec3 r = 2.0 * ndv * n - uV; float upr = dot(r, uUP), ev = upr >= 0.0 ? 0.08 + 0.3 * pow(upr, 1.4) : 0.03 + 0.05 * (1.0 + upr), hz = (upr - 0.1) / (0.035 + rgh * 0.3); ev += 0.45 * exp(-hz * hz) / (1.0 + rgh * 2.0);
    float w = 0.05 + rgh * 0.32; ev += 3.4 * smoothstep(1.0 - 2.6 * w, 1.0 - 0.25 * w, dot(r, uLS)) / (1.0 + rgh * 2.5); float ec = smoothstep(0.62 - w * 1.5, 0.97 - w * 0.5, dot(r, uLR)) / (1.0 + rgh * 2.0);
    float fk = pow(1.0 - ndv, 5.0) * (1.0 - rgh * 0.7); vec3 Fr = f + (1.0 - f) * fk;
    vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rgh * rgh + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * dif * 0.9;
    float aoS = min(1.0, ao + 0.1) * (1.0 - cv * 0.6), rimT = pow(1.0 - ndv, 2.6) * max(0.0, dot(n, uLR) + 0.35) * ao; vec3 KEY = vec3(1.25, 1.12, 0.94), RIM = vec3(0.42, 0.8, 1.2), c;
    if (mt > 0.5) c = a * 0.18 * (dif * KEY + am) + Fr * (ev * aoS + spec * KEY) + ec * RIM * Fr * aoS * 0.6 + a * (dif * 0.55 + am * 0.45);
    else c = a * (dif * KEY + am) + Fr * (ev * aoS + spec * KEY * 3.0) + ec * RIM * 0.3;
    c += rimT * RIM * (id == 68 ? 0.15 : 0.75);
    if (id == 68) { float inner = pow(ndv, 1.4), cs = max(0.0, -dot(n.xy, uLK.xy) * 0.8 + n.z * 0.3); c += vec3(0.75, 0.04, 0.08) * inner + vec3(0.5, 0.05, 0.06) * cs * cs; }
    float grime = min(0.85, (1.0 - ao) * 0.35 + cv * 0.55); c *= (1.0 - grime) * 1.14 * vec3(1.0, 1.0 - grime * 0.05, 1.0 - grime * 0.1);
    if (chg > 0.0) { float pl = 0.75 + 0.25 * sin(uTime * 3.2 + dot(q, vec3(2.0, 1.3, 1.7))); c += vec3(0.25, 0.7, 1.25) * chg * pl * (smoothstep(0.75, 1.0, edge) * 0.35 + min(1.0, cv) * 0.18 + (id == 51 ? 0.06 : 0.0)); }   // (the charge: a thin light along the rims and the seams)
    if (id == 55 && dyn && chg > 0.0) c += vec3(0.25, 0.7, 1.25) * smoothstep(0.86, 1.0, fract(su * 1.5 - uTime * 1.7)) * chg * 0.6;
    gl_FragColor = vec4(vec3(tone5(c.r), tone5(c.g), tone5(c.b)) * uAlpha, uAlpha); return; }
  else if (id >= 58 && id <= 66) {   // ---- the Sports Car (M): 58 candy-pink paint (flake, clear coat, a pearl flip; its decals and lamps by the car's own coordinates: x forward, y left, z up), 59 pearl, 60 the cockpit floor, 61 the seat's pearl-pink leather, 62 the dash, 63 the heart headrest, 64 the bonnet's heart emblem, 66 glass. uGlow2 = the lamps (headlights, taillights, the sill strip), uGlow = the car's glow
    float ndv0 = max(0.0, dot(n, uV)), ayc = abs(L.y), lmp = clamp(uGlow2, 0.0, 1.0); vec3 NLc = NL;
    metal = 0.0; F0 = vec3(0.05); rough = 0.22; coat = 0.0;
    if (id == 58) {
      float hf1 = (NLc.z > 0.38 && L.x > 1.14) ? hrt(vec2((ayc - 0.44) / 0.15, (L.x - 1.34) / 0.15)) : 1.0, hf2 = NLc.x < -0.5 ? hrt(vec2((ayc - 0.42) / 0.12, (L.z - 0.37) / 0.12)) : 1.0, hf3 = (NLc.x > 0.55 && L.z < 0.4) ? hrt(vec2(ayc / 0.13, (L.z - 0.26) / 0.1)) : 1.0;
      float dh = (abs(NLc.y) > 0.45 && L.x > -0.52 && L.x < 0.08 && L.z > 0.22) ? hrt(vec2((L.x + 0.22) / 0.15, (L.z - 0.36) / 0.13)) : 1.0;
      if (hf1 < 0.0) { if (hrt(vec2((ayc - 0.44) / 0.108, (L.x - 1.346) / 0.108)) < 0.0) { float hot = hrt(vec2((ayc - 0.44) / 0.06, (L.x - 1.352) / 0.06)) < 0.0 ? 1.0 : 0.0; vec3 c = mix(vec3(1.0, 0.66, 0.84), vec3(1.25, 1.18, 1.22), hot) * (0.45 + 0.75 * lmp) + vec3(0.25) * pow(ndv0, 4.0); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
        metal = 1.0; alb = vec3(0.5, 0.35, 0.1); F0 = vec3(1.0, 0.8, 0.38); rough = 0.2; }   // (the heart headlights in gold bezels)
      else if (hf2 < 0.0) { if (hrt(vec2((ayc - 0.42) / 0.085, (L.z - 0.37) / 0.085)) < 0.0) { vec3 c = vec3(1.1, 0.22, 0.45) * (0.4 + 0.8 * lmp); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
        metal = 1.0; alb = vec3(0.5, 0.35, 0.1); F0 = vec3(1.0, 0.8, 0.38); rough = 0.2; }   // (the heart taillights)
      else if (hf3 < 0.0) { if (hrt(vec2(ayc / 0.095, (L.z - 0.262) / 0.072)) < 0.0) { alb = vec3(0.3, 0.03, 0.15); rough = 0.25; coat = 0.6; } else { metal = 1.0; alb = vec3(0.5, 0.35, 0.1); F0 = vec3(1.0, 0.8, 0.38); rough = 0.2; } }   // (the heart grille)
      else if (dh < 0.0) { if (hrt(vec2((L.x + 0.22) / 0.15 * 1.25, (L.z - 0.36) / 0.13 * 1.25 + 0.02)) < 0.0) { alb = vec3(0.9, 0.85, 0.9); rough = 0.12; coat = 1.0; } else { metal = 1.0; alb = vec3(0.5, 0.35, 0.1); F0 = vec3(1.0, 0.8, 0.38); rough = 0.2; } }   // (pearl hearts on the doors, gold rims)
      else if (abs(NLc.y) > 0.8 && L.z > 0.19 && L.z < 0.225 && L.x > -1.4 && L.x < 1.22 && abs(L.x - 0.98) > 0.43 && abs(L.x + 0.98) > 0.43) { vec3 c = vec3(1.0, 0.75, 0.93) * (0.55 + 0.6 * lmp); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }   // (the glowing sill strip)
      else if (abs(NLc.y) > 0.3 && L.z > 0.455 && L.z < 0.475 && L.x > -1.5 && L.x < 1.36) { metal = 1.0; alb = vec3(0.5, 0.35, 0.1); F0 = vec3(1.0, 0.8, 0.38); rough = 0.18; }   // (the gold pin-stripe)
      else if (L.z < 0.235 && abs(NLc.y) > 0.65) { alb = vec3(0.86, 0.8, 0.88); rough = 0.14; coat = 0.9; }   // (the pearl sill)
      else {   // candy pink: a deep base, metallic flake sparkling under the clear coat, a pearl-lavender flip at grazing angles
        alb = vec3(0.78, 0.13, 0.42); F0 = vec3(0.07, 0.04, 0.06); rough = 0.3; coat = 1.15;
        float fl = vn(L.xy * 180.0 + L.z * 90.0), fk = smoothstep(0.82, 0.95, fl) * (1.0 - uLow); vec3 hh = normalize(uLK + uV); em += vec3(1.0, 0.7, 0.85) * fk * pow(max(0.0, dot(n, hh)), 18.0) * 0.9;
        alb = mix(alb, vec3(0.86, 0.66, 0.95), pow(1.0 - ndv0, 2.5) * 0.55); alb = mix(vec3(0.38, 0.03, 0.17), alb, 0.55 + 0.45 * smoothstep(-0.3, 0.6, dot(n, uLK))); }
      em += vec3(0.5, 0.12, 0.3) * uGlow * 0.1; }
    else if (id == 59) { alb = vec3(0.9, 0.86, 0.9); rough = 0.12; coat = 1.0; alb = mix(alb, vec3(0.95, 0.72, 0.95), pow(1.0 - ndv0, 2.0) * 0.6); }   // pearl
    else if (id == 60) { alb = vec3(0.16, 0.03, 0.1); rough = 0.6; }   // the cockpit floor: deep plum
    else if (id == 61) { alb = vec3(0.92, 0.76, 0.86); rough = 0.4; coat = 0.3; float ch = abs(sin(L.y * 19.0)); if (ch < 0.12 && ayc < 0.36) cav += 0.6 * (1.0 - ch / 0.12); alb = mix(alb, vec3(0.96, 0.8, 0.98), pow(1.0 - ndv0, 2.0) * 0.4); }   // pearl-pink leather, channel-stitched
    else if (id == 62) { alb = vec3(0.7, 0.13, 0.38); rough = 0.35; coat = 0.6; }   // the dash
    else if (id == 63) { alb = vec3(0.98, 0.58, 0.8); rough = 0.2; coat = 0.9; }   // the heart headrest
    else if (id == 64) { alb = vec3(1.0, 0.7, 0.88); rough = 0.06; coat = 1.4; em += vec3(0.25, 0.06, 0.14) * (0.3 + uGlow); }   // the heart emblem
    else { float fr = pow(1.0 - ndv0, 3.0); vec3 c = vec3(0.1, 0.04, 0.08) + vec3(1.0, 0.85, 0.95) * (0.08 + 0.8 * fr) + smoothstep(0.3, 0.36, (2.0 * ndv0 * n - uV).z) * (1.0 - smoothstep(0.55, 0.62, (2.0 * ndv0 * n - uV).z)) * vec3(0.5, 0.45, 0.55);   // glass: a pink-tinted pane, a sky reflection
      float a = uAlpha * (0.35 + 0.5 * fr); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * a, a); return; } }
  else { coat = 1.0; }
  // surface detail, from the part's own coordinates (it stays on the part as it moves)
  if (metal > 0.5 && uLow < 0.5 && !(uKind > 5.5)) { float s1 = abs(fract(L.x * 13.0 + L.y * 8.0 + L.z * 5.0 + vn(L.xz * 4.0) * 2.5) - 0.5);
    if (s1 < 0.014 && hs(vec2(floor(L.x * 13.0 + L.y * 8.0 + L.z * 5.0), floor(L.z * 6.0))) > 0.62) { wear += 0.5; rough *= 0.55; }
    n = normalize(n + (vec3(vn(L.yz * 13.0), vn(L.zx * 13.0 + 3.0), vn(L.xy * 13.0 + 7.0)) - 0.5) * (id == 2 || id == 9 ? 0.04 : 0.07)); }
  if (id == 0) { float wn = vn(L.xy * 6.0 + L.z * 4.0); rough = min(0.5, rough * (0.75 + 0.6 * wn)); F0.b *= 1.0 + 0.12 * wn;
    if (uKind < 0.5) { vec3 an = abs(NL); vec2 uv = an.z >= an.x && an.z >= an.y ? L.xy : an.y >= an.x ? L.xz : L.yz;
      float row = floor(uv.y / 0.23), fu = fract(uv.x / 0.34 + mod(row, 2.0) * 0.5), fv = fract(uv.y / 0.23), du = min(fu, 1.0 - fu) * 0.34, dv = min(fv, 1.0 - fv) * 0.23, dm = min(du, dv);
      float sw = 0.006 + 0.004 * uLow; if (dm < sw) cav += (1.0 - dm / sw) * 0.85; else if (dm < 0.02) wear += (0.02 - dm) / 0.014 * 0.25;
      float rd = length(vec2(du, dv) - 0.03); if (rd < 0.012 && hs(floor(vec2(uv.x / 0.34 * 2.0 + 0.5, uv.y / 0.23 * 2.0 + 0.5))) > 0.45) { F0 = vec3(0.85, 0.85, 0.9); rough = 0.18; wear += 0.3; if (rd > 0.008) cav += 0.4; } }
    float sc = vn(vec2(L.x * 44.0 + L.z * 21.0, L.y * 44.0 - L.z * 13.0)); if (sc > 0.82) wear += (sc - 0.82) * 2.2; }
  if (id == 0 && uKind > 2.5) { vec2 q = vec2(abs(L.y), L.z + 0.3); float sc = abs(sin(q.x * 26.0 + cos(q.y * 18.0) * 1.6) * 0.5 + sin(q.y * 30.0 + q.x * 8.0) * 0.5); if (sc < 0.08 && L.x > 0.03) { alb = vec3(0.55, 0.38, 0.1); F0 = vec3(1.0, 0.78, 0.36); rough = 0.25; coat = 0.0; } }   // (the hatch: gold filigree inlaid in its obsidian field)
  if (id == 1) { float s2 = abs(fract((L.x + L.z * 0.6) * 46.0 + vn(L.yx * 9.0) * 3.0) - 0.5); rough *= s2 < 0.12 ? 0.6 : 1.08; }
  if (id == 3) { vec3 q = L * 26.0; float u = q.x + sin(q.z * 0.5) * 1.2, v = (q.y + q.z) * 0.7, sc = abs(sin(u) * 0.5 + sin(v * 0.8 + cos(u * 0.5) * 1.6) * 0.5);
    if (sc < 0.08) { cav += (0.08 - sc) * 7.0; rough = min(0.6, rough + 0.15); }
    float wn = vn(L.xy * 16.0 + L.z * 9.0); rough *= 0.7 + 0.8 * wn; if (wn < 0.3) F0 *= vec3(0.8, 0.72, 0.66); }
  if (id == 9 && uKind > 0.5 && uKind < 1.5) { float x = L.x, w = x < 0.28 ? 0.0 : x < 1.0 ? mix(0.2, 0.5, sqrt((x - 0.28) / 0.72)) : 0.5 * pow(clamp(2.0 - x, 0.0, 1.0), 0.7);
    float v = L.y - 0.42 * pow(clamp(x / 2.0, 0.0, 1.0), 2.0), vv = (v - w * 0.12) / max(0.02, w * 0.5);
    if (abs(vv) < 0.75 && x > 0.4 && x < 1.75) { float ph = x * 13.0, c1 = abs(vv - 0.45 * sin(ph)), c2 = abs(vv + 0.45 * sin(ph)), cc = length(vec2(fract(x * 13.0 / 3.14159) - 0.5, vv * 0.6));
      if (min(c1, c2) < 0.075 || abs(cc - 0.16) < 0.03) { cav += 0.55; rough = 0.35; F0 *= vec3(0.55, 0.55, 0.6); } }
    if (abs(abs(vv) - 0.85) < 0.04 && x > 0.4) cav += 0.35; }
  else if (id == 9) { float sc = abs(sin(L.x * 22.0) * 0.5 + sin(L.y * 30.0 + cos(L.x * 11.0) * 2.0) * 0.5); if (sc < 0.06) cav += 0.45; }
  if (id == 4) { float a = (L.x * 1.3 + L.y + L.z * 0.7) * 52.0, b = (L.x * 0.7 - L.y * 1.1 + L.z * 1.2) * 52.0, f1 = sin(a), f2 = sin(b);
    n = normalize(n + vec3(f1, f2, f1 - f2) * 0.3); if (abs(f1) < 0.2 || abs(f2) < 0.2) cav += 0.35; alb *= 0.8 + 0.4 * vn(vec2(L.x * 120.0 + L.y * 40.0, L.z * 120.0)); }
  if (id == 13) { float an = atan(L.z, L.y), f1 = fract(L.x * 16.0 + an * 1.3), f2 = fract(L.x * 16.0 - an * 1.3); if (min(f1, 1.0 - f1) < 0.1 || min(f2, 1.0 - f2) < 0.1) cav += 0.6; }
  if (id == 5) alb *= 0.8 + 0.4 * vn(L.xy * 20.0 + L.z * 10.0);
  wear += edge * (id == 0 ? 1.1 * uWear : id == 3 ? 0.9 : 0.5);
  float grime = min(0.85, (1.0 - ao) * 0.5 + cav * 0.5);
  if (wear > 0.0 && metal > 0.5) { float v = min(1.0, wear); if (id == 0) { F0 = mix(F0, vec3(0.9, 0.9, 0.95), v * 0.75); rough = mix(rough, 0.14, v); } else { F0 = mix(F0, id == 3 ? vec3(1.0, 0.92, 0.62) : vec3(1.0, 0.95, 0.98), v * 0.45); } rough *= 1.0 - v * 0.4; }
  float ndl = dot(n, uLK), ndv = max(0.001, dot(n, uV));
  float dif = id == 4 ? max(0.0, (ndl + 0.25) / 1.25) : max(0.0, ndl);
  float hm = 0.5 + 0.5 * dot(n, uUP); vec3 amb = mix(vec3(0.22, 0.16, 0.26), vec3(0.66, 0.64, 0.8), hm) * ao * uAmb;
  vec3 r = 2.0 * ndv * n - uV; float ec; float ev = env(r, rough, ec);
  float fk = pow(1.0 - ndv, 5.0) * (1.0 - rough * 0.7); vec3 Fr = F0 + (1.0 - F0) * fk;
  vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(n, hh)), pw = 2.0 / (rough * rough + 0.004), spec = pow(nh, pw) * (pw + 2.0) / 8.0 * max(0.0, ndl) * 0.9;
  float aoS = min(1.0, ao * 0.85 + 0.15) * (1.0 - cav * 0.6);
  float rimT = pow(1.0 - ndv, 2.6) * max(0.0, dot(n, uLR) + 0.35) * ao;
  vec3 KEYC = vec3(1.5, 1.42, 1.36), RIMC = uRim, c;
  if (metal > 0.5) c = alb * (dif * KEYC * 0.7 + amb * 0.5) + Fr * (ev * aoS + spec * KEYC) + ec * RIMC * Fr * aoS * 0.7;
  else { float sk = id == 5 ? 5.0 : 2.5; c = alb * (dif * KEYC + amb) + Fr * (ev * aoS * 0.6 + spec * KEYC * sk) + ec * RIMC * 0.15; }
  c += rimT * RIMC * 0.45;
  if (coat > 0.0) { float ccF = 0.04 + 0.96 * pow(1.0 - ndv, 5.0), ec2; float ccE = env(r, 0.03, ec2); float ccS = pow(nh, 900.0) * 120.0 * max(0.0, ndl); float kk = (0.55 * ccF * (ccE + ec2 * 0.8) * aoS + 0.025 * ccS) * coat; c += kk * vec3(0.95, 0.93, 1.05); }
  c *= 1.0 - grime * 0.55; c += em; c = frostFx(c, L);
  gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha);
}`;
  function compile() {
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error('GLM shader: ' + gl.getShaderInfoLog(o)); return o; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS));
    gl.bindAttribLocation(p, 0, 'aP'); gl.bindAttribLocation(p, 1, 'aN'); gl.bindAttribLocation(p, 2, 'aA'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error('GLM link: ' + gl.getProgramInfoLog(p));
    prog = p; U = {}; for (const n of ['uR0', 'uR1', 'uR2', 'uT', 'uPX', 'uPY', 'uPD', 'uCl', 'uV', 'uLK', 'uLS', 'uLR', 'uUP', 'uGlow', 'uAlpha', 'uKind', 'uFx', 'uRim', 'uAmb', 'uLow', 'uWear', 'uGlow2', 'uSpill', 'uTime', 'uOutV', 'uOutF', 'uClip', 'uM0', 'uM1', 'uM2', 'uOcc', 'uNOcc']) U[n] = gl.getUniformLocation(p, n);
    ext32 = isGL2 ? true : gl.getExtension('OES_element_index_uint'); gen++;
  }
  /* is WebGL ready (made on first call)? */
  function ok() {
    if (failed) return false;
    if (gl) { const L = lost || gl.isContextLost(), t = typeof performance !== 'undefined' ? performance.now() : Date.now(); if (!L) { lostT = 0; return true; } if (!lostT) lostT = t; if (t - lostT < 1500) return false;
      gl = null; cv = null; prog = null; lost = false; lostT = 0; }   // (lost and not restored: drop it and make a fresh context; the meshes upload again, their buffers are tagged by gen)
    try {
      if (typeof document === 'undefined') { failed = true; return false; }
      cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const opt = { alpha: true, premultipliedAlpha: true, antialias: !(typeof window !== 'undefined' && window.__GLNOAA), depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'default' };
      gl = cv.getContext('webgl2', opt); isGL2 = !!gl; if (!gl) gl = cv.getContext('webgl', opt) || cv.getContext('experimental-webgl', opt);
      if (!gl) { failed = true; return false; }
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; }, false);
      cv.addEventListener('webglcontextrestored', () => { try { compile(); lost = false; } catch (e) { failed = true; } }, false);
      try { const di = gl.getExtension('WEBGL_debug_renderer_info'), rn = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); soft = /swiftshader|llvmpipe|software|softpipe/i.test(rn); } catch (e) { soft = false; }   // (a CPU rasteriser: the model then renders at reduced resolution)
      gen++; compile(); return true;
    } catch (e) { failed = true; gl = null; return false; }
  }
  function upload(M) {
    if (M.gl && M.gl.gen === gen) return M.gl;
    if (M.idx instanceof Uint32Array && !ext32) return null;
    const mk = (t, d) => { const b = gl.createBuffer(); gl.bindBuffer(t, b); gl.bufferData(t, d, gl.STATIC_DRAW); return b; };
    M.gl = { gen, p: mk(gl.ARRAY_BUFFER, M.pos), n: mk(gl.ARRAY_BUFFER, M.nrm), a: mk(gl.ARRAY_BUFFER, M.att), i: mk(gl.ELEMENT_ARRAY_BUFFER, M.idx), it: M.idx instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT, n3: M.idx.length };
    return M.gl;
  }
  /* refresh a mesh's attributes (occlusion) after it changed */
  /* touchGeo(M): a mesh whose positions and normals were rewritten in place (a tube rebuilt along a moving curve) */
  function touchGeo(M) { if (M.gl && gl && M.gl.gen === gen) { gl.bindBuffer(gl.ARRAY_BUFFER, M.gl.p); gl.bufferData(gl.ARRAY_BUFFER, M.pos, gl.DYNAMIC_DRAW); gl.bindBuffer(gl.ARRAY_BUFFER, M.gl.n); gl.bufferData(gl.ARRAY_BUFFER, M.nrm, gl.DYNAMIC_DRAW); } }
  function touch(M) { if (M.gl && gl && M.gl.gen === gen) { gl.bindBuffer(gl.ARRAY_BUFFER, M.gl.a); gl.bufferData(gl.ARRAY_BUFFER, M.att, gl.STATIC_DRAW); } }
  /* render a frame: W x H pixels; S = { px, py, pd (projection rows), cl ([ax, bx, ay, by]), v, lk, ls, lr, up, low };
     items: [{ mesh, R0, R1, R2, T (part -> world), alpha, glow, kind, wear }] (opaque ones first). Returns the canvas. */
  let calls = 0, tris = 0, LX = null; const RIM0 = [0.8, 0.55, 1.45], AMB0 = [1, 1, 1];   // (the defaults: Susano O's violet rim)
  const KEPT = new Int32Array(16); let KI = 0;   /* v460 R3: the sizes (W, H) of the last 8 kept passes, for the canvas's envelope (render) */
  const OUTC = [0.012, 0.03, 0.1];
  function render(W, H, S, items) {
    if (!ok()) return null;
    if (typeof PERF !== 'undefined' && W * H > 64) PERF.copy();   /* (v439 SP: a model pass, laid on the canvas by its caller: counted for the readout) */
    /* (v434 PO) S.keep: a pass whose size wanders a few pixels every frame (a boss's box following its moving parts) no longer
       reallocates the drawing buffer and its depth buffer every frame: the canvas is kept while it holds W x H and is not much
       larger (sizes rounded up to 32 px when it must change), and the picture is drawn into its top-left W x H, which is what
       every caller copies out (source rectangle 0, 0, W, H). window.__PO_OFF = 1: resized to W x H every time, as v433 */
    /* v460 R3: S.keep 'r3' (the six-star summons' model passes, which all copy out 0, 0, W, H): kept as keep 1. And while kept
       passes of different sizes take turns (a Rift 03 boss's pass and a summon's in the same frame: measured 2 reallocations of the
       canvas and its depth buffer a frame, 0 without the summon) the canvas is sized to the envelope of the last 8 kept passes
       (the widest, the tallest) and shrunk only when it holds 1.35x more than that envelope (4x / 1.5 Mpx for keep 2), instead of
       to each pass in turn. window.__R3_OFF = 1: as v459 (keep 'r3' then not kept, the canvas sized to each pass) */
    const R3 = !(typeof window !== 'undefined' && window.__R3_OFF === 1), K0 = S.keep === 'r3' ? (R3 ? 1 : 0) : S.keep;
    let VY = 0; const keep = K0 && !(typeof window !== 'undefined' && window.__PO_OFF === 1);
    if (keep && R3) { KEPT[KI] = W; KEPT[KI + 1] = H; KI = (KI + 2) % KEPT.length; let eW = W, eH = H; for (let i = 0; i < KEPT.length; i += 2) { if (KEPT[i] > eW) eW = KEPT[i]; if (KEPT[i + 1] > eH) eH = KEPT[i + 1]; }
      if (cv.width < W || cv.height < H || cv.width * cv.height > (K0 === 2 ? Math.max(eW * eH * 4, 1.5e6) : eW * eH * 1.35)) { cv.width = Math.ceil(eW / 32) * 32; cv.height = Math.ceil(eH / 32) * 32; } VY = cv.height - H; }
    else
    /* (v446 AL) S.keep === 2: passes of different sizes taking turns in one frame (a body's pass, then its effect meshes') keep the canvas
       at the larger one instead of trading it back and forth (shrunk only when it holds more than 4x the pass and 1.5 Mpx) */
    if (keep) { if (cv.width < W || cv.height < H || (S.keep === 2 ? cv.width * cv.height > Math.max(W * H * 4, 1.5e6) : cv.width * cv.height > W * H * 1.35)) { cv.width = Math.ceil(Math.max(W, S.keep === 2 ? Math.min(cv.width, W * 2) : 0) / 32) * 32; cv.height = Math.ceil(Math.max(H, S.keep === 2 ? Math.min(cv.height, H * 2) : 0) / 32) * 32; } VY = cv.height - H; }
    else if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    gl.viewport(0, VY, W, H); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(prog);
    gl.uniform3fv(U.uPX, S.px); gl.uniform3fv(U.uPY, S.py); gl.uniform3fv(U.uPD, S.pd); gl.uniform4fv(U.uCl, S.cl);
    gl.uniform3fv(U.uV, S.v); gl.uniform3fv(U.uLK, S.lk); gl.uniform3fv(U.uLS, S.ls); gl.uniform3fv(U.uLR, S.lr); gl.uniform3fv(U.uUP, S.up); gl.uniform1f(U.uLow, S.low ? 1 : 0); gl.uniform1f(U.uTime, S.t || 0); if (S.clip) gl.uniform3f(U.uClip, 1, S.clip[0], S.clip[1] || 0.05); else gl.uniform3f(U.uClip, 0, 0, 0); if (S.occ && U.uOcc) { gl.uniform4fv(U.uOcc, S.occ); gl.uniform1f(U.uNOcc, S.nocc || 0); } else gl.uniform1f(U.uNOcc, 0); gl.uniform3fv(U.uRim, S.rim || RIM0); gl.uniform3fv(U.uAmb, S.amb || AMB0);
    gl.enableVertexAttribArray(0); gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
    calls = 0; tris = 0; let lastM = null;
    const bindM = g => { if (lastM !== g) { gl.bindBuffer(gl.ARRAY_BUFFER, g.p); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, g.n); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, g.a); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.i); lastM = g; } };
    // the outline (S.outline: its thickness in pixels of this image; off when absent): every opaque item that has not opted out
    // (item.outline === false) is drawn first as a hull pushed out along its normals by that many pixels and set back in
    // depth, in one flat colour (S.outlineCol, a dark blue by default); the items then draw over their own hulls
    if (S.outline > 0) { const oc = S.outlineCol || OUTC; gl.uniform3f(U.uOutV, 2 * S.outline / W, 2 * S.outline / H, S.outlineBias || 0.006); gl.uniform4f(U.uOutF, oc[0], oc[1], oc[2], 1); gl.depthMask(true);
      for (const it of items) { if (it.outline === false || !(it.alpha > 0.6)) continue; const g = upload(it.mesh); if (!g) continue; bindM(g);
        gl.uniform3fv(U.uR0, it.R0); gl.uniform3fv(U.uR1, it.R1); gl.uniform3fv(U.uR2, it.R2); gl.uniform3fv(U.uT, it.T); gl.uniform1f(U.uAlpha, it.alpha > 0.995 ? 1 : it.alpha);
        gl.drawElements(gl.TRIANGLES, it.cnt || g.n3, g.it, (it.first || 0) * (g.it === gl.UNSIGNED_INT ? 4 : 2)); calls++; tris += (it.cnt || g.n3) / 3; } }   /* (v415 TI: it.first, it.cnt draw one stretch of a mesh's indices - one stone of a merged bone) */
    gl.uniform3f(U.uOutV, 0, 0, 0); gl.uniform4f(U.uOutF, 0, 0, 0, 0);
    for (const it of items) { const g = upload(it.mesh); if (!g) continue;
      if (lastM !== g) { gl.bindBuffer(gl.ARRAY_BUFFER, g.p); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, g.n); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, g.a); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.i); lastM = g; }
      gl.uniform3fv(U.uR0, it.R0); gl.uniform3fv(U.uR1, it.R1); gl.uniform3fv(U.uR2, it.R2); gl.uniform3fv(U.uT, it.T); gl.uniform3fv(U.uM0, it.R0); gl.uniform3fv(U.uM1, it.R1); gl.uniform3fv(U.uM2, it.R2);
      gl.uniform1f(U.uAlpha, it.alpha); gl.uniform1f(U.uFx, it.fx || 0); gl.uniform1f(U.uGlow2, it.glow2 || 0); gl.uniform1f(U.uSpill, it.spill || 0); gl.uniform1f(U.uGlow, it.glow); gl.uniform1f(U.uKind, it.kind || 0); gl.uniform1f(U.uWear, it.wear == null ? 1 : it.wear);
      gl.depthMask(it.alpha > 0.995);
      gl.drawElements(gl.TRIANGLES, it.cnt || g.n3, g.it, (it.first || 0) * (g.it === gl.UNSIGNED_INT ? 4 : 2)); calls++; tris += (it.cnt || g.n3) / 3; }   /* (v415 TI) */
    gl.depthMask(true);
    return cv;
  }
  /* halos(c, list): soft feathered light discs composited with 'lighter' over what is drawn (a ring's, a blade edge's, a
     flower's inner glow). list = [{ x, y, r, a, col, sy }] in the canvas's own units: r the radius, a the strength 0..1, col a
     '#RRGGBB' (see HALO for the stock ones), sy an optional vertical squash (an ellipse on the floor plane). */
  const HALO = { mint: '#7CFFC4', pink: '#FF7EB0', pearl: '#FFF1DC', gold: '#FFD98A', ice: '#3FA8FF', engine: '#6A4DFF' }, HSPR = {};
  function haloSprite(col) { let s = HSPR[col]; if (s) return s; if (typeof document === 'undefined') return null; s = document.createElement('canvas'); s.width = s.height = 64; const g = s.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, col); gr.addColorStop(0.35, col + '88'); gr.addColorStop(0.7, col + '22'); gr.addColorStop(1, col + '00'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (HSPR[col] = s); }
  function halos(c, list) { if (!list || !list.length) return; c.save(); c.globalCompositeOperation = 'lighter';
    for (const h of list) { const a = Math.max(0, Math.min(1, h.a == null ? 0.3 : h.a)); if (!(a > 0.004) || !(h.r > 0)) continue; const sp = haloSprite(HALO[h.col] || h.col || HALO.mint); if (!sp) break; const ry = h.r * (h.sy == null ? 1 : h.sy); c.globalAlpha = a; c.drawImage(sp, h.x - h.r, h.y - ry, h.r * 2, ry * 2); }
    c.restore(); }
  /* (v426 BL) free a mesh's GPU buffers (its arrays stay: it uploads again when next drawn) */
  function free(M) { if (M && M.gl && gl && M.gl.gen === gen && !gl.isContextLost()) { try { gl.deleteBuffer(M.gl.p); gl.deleteBuffer(M.gl.n); gl.deleteBuffer(M.gl.a); gl.deleteBuffer(M.gl.i); } catch (e) {} } if (M) M.gl = null; }
  return { builder, ok, render, touch, touchGeo, halos, HALO, free /* v426 BL */, get stats() { return { calls, tris, gl2: isGL2, lost, failed, soft }; }, get soft() { return soft; }, get canvas() { return cv; }, loseForTest() { LX = gl && gl.getExtension('WEBGL_lose_context'); if (LX) LX.loseContext(); return !!LX; }, restoreForTest() { if (LX) LX.restoreContext(); } };
})();
