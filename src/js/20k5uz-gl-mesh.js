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
void main() {
  if (uClip.x > 0.5) { if (vW.z < uClip.y) discard; if (vW.z < uClip.y + uClip.z) { float wl = 1.0 - (vW.z - uClip.y) / uClip.z; gl_FragColor = vec4(mix(vec3(0.35, 0.9, 1.0), vec3(1.0), wl * wl) * uAlpha, uAlpha); return; } }   // (S.clip: nothing below a level; a bright waterline band just above the cut)
  if (uOutF.a > 0.0) { gl_FragColor = vec4(uOutF.rgb * uAlpha, uAlpha); return; }
  int id = int(vA.x + 0.5); float edge = vA.y, ao = vA.z;
  vec3 n = normalize(vN); if (dot(n, uV) < -0.02) n = -n;   // (a surface seen from inside, a thin shell: face the viewer)
  vec3 L = vL, NL = normalize(vNL);
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
  else if (id >= 130 && id <= 134) {   // ---- Dead Scream's skull (v391 U4): 130 weathered bone (vA.x - 130 = 0.3 x the depth in an orbit or the nose, vA.y how thin the bone is, vA.z occlusion), 131 a broken shard of bone (vA.y its facet's edge), 133 a tooth (133.3 the lower row), 134 obsidian (vA.y facet edge, vA.z 1 - along it). uGlow the scream's light, uGlow2 how far the cracks have spread, uSpill dissolved (0 whole .. 1 gone, a burning violet edge), uWear the soul fire (1 .. 0 out)
    vec3 q = L, vio = vec3(0.6, 0.22, 1.0), hot = vec3(0.95, 0.78, 1.0); float tt = uTime, g0 = clamp(uGlow, 0.0, 2.0), sub = vA.x - float(id), fire = clamp(uWear, 0.0, 1.0);
    float n1 = (vn(q.xy * 3.0) + vn(q.yz * 3.0 + 3.7) + vn(q.zx * 3.0 + 7.1)) / 3.0, n2 = (vn(q.xy * 9.0 + 1.3) + vn(q.yz * 9.0 + 5.1) + vn(q.zx * 9.0 + 2.2)) / 3.0, n3 = (vn(q.xy * 27.0) + vn(q.yz * 27.0 + 1.9) + vn(q.zx * 27.0 + 4.4)) / 3.0;
    float de = 0.72 * n1 + 0.28 * n2 - (uSpill * 1.12 - 0.06), alK = 1.0, emb = 0.0;   // (the dissolve: noise below the threshold is gone, a hot violet edge just above it, the edge itself faded)
    if (uSpill > 0.001) { if (de < 0.0) discard; alK = smoothstep(0.0, 0.03, de); emb = 1.0 - smoothstep(0.02, 0.11, de); }
    vec3 nm = normalize(NL); if (uLow < 0.5 && id != 134) nm = normalize(nm + (vec3(vn(q.yz * 31.0), vn(q.zx * 31.0 + 3.0), vn(q.xy * 31.0 + 7.0)) - 0.5) * 0.16 + (vec3(n2, n3, n1) - 0.5) * 0.08);   // (pores, pits and weathering)
    vec3 nw = normalize(uM0 * nm.x + uM1 * nm.y + uM2 * nm.z); if (dot(nw, n) < 0.0) nw = -nw;
    float ndl = dot(nw, uLK), ndv = max(0.0, dot(nw, uV)), hm = 0.5 + 0.5 * dot(nw, uUP); vec3 hh = normalize(uLK + uV); float nh = max(0.0, dot(nw, hh));
    // the cracks: a warped cell network over the vault and face, spreading from the crown down as uGlow2 rises; a dark cut, violet light leaking out of it
    float crk = 0.0, crH = 0.0;
    if (id == 130 || id == 133) { vec3 cq = q - vec3(0.0, -0.16, 0.3); vec2 su = vec2(atan(cq.x, cq.y) * 1.25, cq.z * 1.1), w = su * 2.7 + (vec2(vn(su * 4.0), vn(su * 4.0 + 5.2)) - 0.5) * 0.8, ci = floor(w), cf = fract(w); float f1 = 9.0, f2 = 9.0;
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 gg = vec2(float(i), float(j)), r = gg + vec2(hs(ci + gg), hs(ci + gg + 17.3)) - cf; float d = dot(r, r); if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
      float ce = sqrt(f2) - sqrt(f1) + (vn(w * 9.0) - 0.5) * 0.03, spread = uGlow2 * 1.8 - length(su - vec2(0.0, 0.95)) * 0.8 + (vn(su * 2.3 + 9.0) - 0.5) * 0.6;
      float cov = smoothstep(0.0, 0.25, spread) * smoothstep(0.46, 0.6, vn(su * 1.7 + 4.0) * 0.7 + vn(w * 0.9 + 2.0) * 0.3 + 0.14 * uGlow2), cw = 0.5 + 0.7 * vn(w * 2.3 + 7.0);   // (a broken network: whole runs of it missing, each run its own width)
      crk = (1.0 - smoothstep(0.02 * cw, 0.065 * cw, ce)) * cov; crH = (1.0 - smoothstep(0.05, 0.28, ce)) * cov; }
    vec3 col; float a3 = ao;
    if (id == 134) {   // obsidian: black glass, the studio sky in it, a sharp glint, violet light along its facet edges and up toward the tip
      float ec; vec3 r = 2.0 * dot(nw, uV) * nw - uV; float ev = env(r, 0.06, ec), fr = 0.05 + 0.95 * pow(1.0 - ndv, 5.0);
      col = vec3(0.012, 0.008, 0.02) * (0.4 + max(0.0, ndl)) + (0.1 + 0.9 * fr) * (ev * vec3(0.5, 0.45, 0.62) + ec * uRim * 0.6) + pow(nh, 260.0) * vec3(2.2, 2.0, 2.6) * step(0.0, ndl);
      col += vio * (smoothstep(0.8, 1.0, edge) * 0.22 + pow(1.0 - ao, 4.0) * 0.3) * (0.35 + 0.7 * g0) + vio * smoothstep(0.62, 0.9, vn(q.xz * 13.0 + q.y * 5.0)) * 0.06 * (0.5 + g0);
      a3 = 1.0; }
    else {
      vec3 alb = mix(vec3(0.42, 0.4, 0.4), vec3(0.7, 0.63, 0.5), smoothstep(0.3, 0.72, n1)) * (0.8 + 0.32 * n2) * (0.86 + 0.14 * smoothstep(0.2, 0.6, n3));   // ash grey to old ivory, mottled, pitted
      float stn = smoothstep(0.5, 0.85, vn(vec2(q.x * 8.0 + n1 * 2.0, q.z * 1.1 + q.y * 2.5))); alb = mix(alb, vec3(0.2, 0.13, 0.16), stn * 0.32);   // (stains run down it)
      float rough = 0.62, spK = 0.14;
      if (id == 133) { float lo = step(0.15, sub), root = lo > 0.5 ? smoothstep(-1.0, -1.05, q.z) : smoothstep(-0.88, -0.82, q.z); alb = mix(vec3(0.68, 0.62, 0.47) * (0.86 + 0.25 * n2), vec3(0.22, 0.15, 0.13), root * 0.75); rough = 0.35; spK = 0.32; }
      if (id == 130) { float sz = smoothstep(0.42, 0.62, q.z), su1 = 1.0 - smoothstep(0.004, 0.014, abs(q.y - 0.04 + 0.025 * abs(fract(q.x * 9.0) - 0.5) * 4.0 - 0.05 * q.z)), sa = (1.0 - smoothstep(0.004, 0.014, abs(q.x + 0.02 * (abs(fract(q.y * 10.0) - 0.5) * 4.0 - 1.0)))) * step(q.y, 0.0);
        alb *= 1.0 - 0.55 * max(su1, sa) * sz; }   // (the coronal and sagittal sutures, zigzag, over the top)
      if (id == 131) alb = mix(alb, vec3(0.5, 0.45, 0.42), 0.15 + 0.3 * (1.0 - edge));   // (a shard: weathered bone outside, the broken faces paler and porous)
      alb = mix(vec3(0.07, 0.045, 0.08), alb, smoothstep(0.2, 0.85, ao));   // (grime in the hollows)
      float wrap = max(0.0, (ndl + 0.3) / 1.3); vec3 amb = mix(vec3(0.08, 0.05, 0.11), vec3(0.34, 0.33, 0.38), hm) * uAmb;
      vec3 under = vio * max(0.0, -dot(nw, uUP) + 0.15) * (0.22 + 0.3 * g0);   // (the violet light of the aura below and the mouth)
      float spec = pow(nh, mix(70.0, 18.0, rough)) * spK * smoothstep(-0.05, 0.25, ndl);
      col = alb * (wrap * wrap * vec3(1.55, 1.45, 1.36) * (0.45 + 0.55 * ao) + amb * ao * ao + under * ao) + spec * vec3(0.95, 0.92, 1.05) * ao;
      col += pow(1.0 - ndv, 2.8) * max(0.0, dot(nw, uLR) + 0.35) * uRim * 0.42 * ao;
      col += vio * edge * (0.14 + 0.34 * g0) * (0.35 + 0.65 * pow(1.0 - ndv, 1.4)) * (id == 130 ? 1.0 - smoothstep(0.0, 0.06, sub) : 0.0);   // (thin bone lit through, violet; not round the hollows' rims)
      // near the orbits the bone catches the soul fire; near the mouth, the scream's light
      vec2 so = vec2(abs(q.x) - 0.33, q.z + 0.14); float sglow = exp(-dot(so, so) * 14.0) * smoothstep(0.2, 0.75, q.y), mo = exp(-(q.x * q.x * 6.0 + (q.z + 0.98) * (q.z + 0.98) * 22.0)) * smoothstep(0.1, 0.6, q.y);
      col += vio * (sglow * 0.28 * fire * (0.5 + g0) + mo * 0.5 * g0) * (0.4 + 0.6 * ao);
      if (id == 130 && sub > 0.005) {   // an orbit's or the nose's wall: a carved hollow, dark; the orbits' backs burn with the soul fire
        float cav = clamp(sub / 0.3, 0.0, 1.0), isN = (1.0 - smoothstep(0.1, 0.2, abs(q.x))) * (1.0 - smoothstep(-0.3, -0.24, q.z));
        col *= mix(1.0, 0.035, smoothstep(0.0, 0.3, cav));
        float fl = vn(vec2(q.x * 9.0, q.z * 8.0 - tt * 3.4)) * 0.6 + vn(vec2(q.x * 21.0 + 3.0, q.z * 17.0 - tt * 6.1)) * 0.4, fk = smoothstep(0.55, 1.0, cav) * (1.0 - isN * 0.9);
        vec2 sa = vec2(abs(q.x) - 0.33, (q.z + 0.2) * 0.62 - 0.03 * sin(q.x * 31.0 + tt * 7.0)); float core = exp(-dot(sa, sa) * 70.0) * 0.55, cr2 = exp(-dot(sa, sa) * 260.0);   // (the fire burns low at the back of the orbit, a flickering flame-shaped heart; the walls round it stay dark)
        col += (vio * 0.55 * core + mix(vio, hot, 0.4) * cr2 * 0.5) * fk * (0.35 + 0.9 * fl) * fire * (0.6 + 0.9 * g0) + vio * smoothstep(0.1, 0.4, cav) * (1.0 - cav) * max(0.0, dot(nw, uUP)) * 0.12 * fire * (0.5 + g0); }   // (and its light caught on the lower inner walls)
      col *= 1.0 - 0.75 * crk;
      col += (mix(vio, hot, crk * 0.6) * crk * 1.7 + vio * crH * 0.28) * (0.55 + 0.85 * g0) * (0.8 + 0.2 * sin(tt * 5.0 + q.z * 9.0 + q.x * 4.0));
      if (id == 131) col += mix(vio, hot, 0.4) * smoothstep(0.55, 1.0, edge) * (0.5 + 0.8 * g0);   // (a shard's broken edges glow)
    }
    col = mix(col, hot * 1.4, emb * 0.85) + vio * emb * 0.4;
    col = min(vec3(tone(col.r), tone(col.g), tone(col.b)), vec3(1.0));
    float aOut = uAlpha * alK; gl_FragColor = vec4(col * aOut, aOut); return; }
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
  const OUTC = [0.012, 0.03, 0.1];
  function render(W, H, S, items) {
    if (!ok()) return null;
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
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
        gl.drawElements(gl.TRIANGLES, g.n3, g.it, 0); calls++; tris += g.n3 / 3; } }
    gl.uniform3f(U.uOutV, 0, 0, 0); gl.uniform4f(U.uOutF, 0, 0, 0, 0);
    for (const it of items) { const g = upload(it.mesh); if (!g) continue;
      if (lastM !== g) { gl.bindBuffer(gl.ARRAY_BUFFER, g.p); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, g.n); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ARRAY_BUFFER, g.a); gl.vertexAttribPointer(2, 3, gl.FLOAT, false, 0, 0); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g.i); lastM = g; }
      gl.uniform3fv(U.uR0, it.R0); gl.uniform3fv(U.uR1, it.R1); gl.uniform3fv(U.uR2, it.R2); gl.uniform3fv(U.uT, it.T); gl.uniform3fv(U.uM0, it.R0); gl.uniform3fv(U.uM1, it.R1); gl.uniform3fv(U.uM2, it.R2);
      gl.uniform1f(U.uAlpha, it.alpha); gl.uniform1f(U.uFx, it.fx || 0); gl.uniform1f(U.uGlow2, it.glow2 || 0); gl.uniform1f(U.uSpill, it.spill || 0); gl.uniform1f(U.uGlow, it.glow); gl.uniform1f(U.uKind, it.kind || 0); gl.uniform1f(U.uWear, it.wear == null ? 1 : it.wear);
      gl.depthMask(it.alpha > 0.995);
      gl.drawElements(gl.TRIANGLES, g.n3, g.it, 0); calls++; tris += g.n3 / 3; }
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
  return { builder, ok, render, touch, touchGeo, halos, HALO, get stats() { return { calls, tris, gl2: isGL2, lost, failed, soft }; }, get soft() { return soft; }, get canvas() { return cv; }, loseForTest() { LX = gl && gl.getExtension('WEBGL_lose_context'); if (LX) LX.loseContext(); return !!LX; }, restoreForTest() { if (LX) LX.restoreContext(); } };
})();
