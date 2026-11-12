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
  let gl = null, cv = null, prog = null, failed = false, lost = false, isGL2 = false, soft = false, U = {}, AT = {}, gen = 0, ext32 = null;
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
uniform float uGlow, uAlpha, uKind, uLow, uWear, uFx, uGlow2, uSpill, uTime; uniform vec4 uOutF;
uniform vec3 uRim, uAmb;
float hs(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p) { vec2 i = floor(p), f = p - i; vec2 u = f * f * (3.0 - 2.0 * f); return mix(mix(hs(i), hs(i + vec2(1.0, 0.0)), u.x), mix(hs(i + vec2(0.0, 1.0)), hs(i + vec2(1.0, 1.0)), u.x), u.y); }
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
  float hm = 0.5 + 0.5 * dot(n, uUP), x = dot(n, uLK) * 0.8 + (hm - 0.5) * 0.3, b = 0.5 * smoothstep(-0.12, -0.04, x) + 0.5 * smoothstep(0.42, 0.52, x); lit = b;
  vec3 c = b < 0.5 ? mix(sh, md, b * 2.0) : mix(md, li, b * 2.0 - 1.0); return c * (0.88 + 0.2 * hm + 0.08 * clamp(x, -1.0, 1.0)) * uAmb; }
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
  else if (id >= 30 && id <= 35) {   // ---- premium cel shading (Jaws). vA.y = 1 at a panel line or a plate's edge; vA.z = 1 sound paint, 0 worn to bare metal
    float lit, ndv = max(0.0, dot(n, uV)), hm = 0.5 + 0.5 * dot(n, uUP); vec3 c, r = 2.0 * ndv * n - uV;
    float line = smoothstep(0.82, 0.95, edge), scr = 0.0;
    if (uLow < 0.5) { float s1 = abs(fract(L.x * 11.0 + L.y * 7.0 + L.z * 5.0 + vn(L.xz * 4.0) * 2.5) - 0.5); if (s1 < 0.012 && hs(vec2(floor(L.x * 11.0 + L.y * 7.0 + L.z * 5.0), floor(L.z * 5.0))) > 0.6) scr = 1.0; }   // (fine scratches)
    if (id == 30) {   // cobalt paint: three blue bands, a tight gloss band and a soft sky band, panel variation, panel lines, chips to bare metal beside edges
      vec3 cell = floor(L * 2.6 + 0.5); float pv = hs(cell.xy + cell.z * 7.3) - 0.5;
      c = cel3(vec3(0.016, 0.06, 0.27), vec3(0.035, 0.2, 0.72), vec3(0.14, 0.4, 1.0), n, lit) * (1.0 + 0.12 * pv);
      c += celSpec(n, 0.955) * vec3(0.5, 0.72, 1.0) * 0.45 + smoothstep(0.3, 0.36, r.z) * (1.0 - smoothstep(0.52, 0.6, r.z)) * vec3(0.1, 0.22, 0.4) * (0.4 + 0.6 * lit);
      float chip = smoothstep(0.64, 0.72, vn(L.xy * 23.0 + L.z * 17.0) * (0.3 + 0.62 * smoothstep(0.55, 0.85, edge)) + (1.0 - clamp(ao, 0.0, 1.0)) * 0.75) * (1.0 - line) * (1.0 - uLow);   // (chips only beside a panel line or where vA.z marks a worn edge)
      vec3 bare = cel3(vec3(0.2, 0.22, 0.27), vec3(0.55, 0.58, 0.63), vec3(0.95, 0.96, 1.0), n, lit); c = mix(c, bare, chip * uWear);
      c = mix(c, c * 1.5 + 0.06, scr * 0.5) * (1.0 - 0.8 * line) + celRim(n); }
    else if (id == 31) {   // chrome: a stylised sky and ground with a hard horizon, one sharp key band, brushed machining
      float t = r.z + 0.1 * (vn(vec2(L.x * 2.0, (L.y + L.z) * 60.0)) - 0.5) * (1.0 - uLow);
      vec3 sky = mix(vec3(0.82, 0.9, 0.98), vec3(0.2, 0.36, 0.72), smoothstep(0.1, 0.9, t)), gnd = mix(vec3(0.15, 0.18, 0.27), vec3(0.44, 0.48, 0.58), smoothstep(-0.9, -0.05, t));
      c = mix(gnd, sky, smoothstep(-0.03, 0.03, t)) + smoothstep(0.0, 0.03, t) * (1.0 - smoothstep(0.09, 0.14, t)) * 0.3;
      cel3(vec3(0.0), vec3(0.5), vec3(1.0), n, lit); c *= 0.7 + 0.45 * lit; c += celSpec(n, 0.94) * 0.9 + smoothstep(0.8, 0.83, dot(r, uLS)) * 0.25;
      c = mix(c, c * 0.7, scr * 0.5) * (1.0 - 0.75 * line) + celRim(n); }
    else if (id == 32) {   // dark steel: recessed machinery, matte, a cyan bounce from the emitters near it (spill)
      c = cel3(vec3(0.012, 0.016, 0.03), vec3(0.045, 0.055, 0.08), vec3(0.11, 0.13, 0.17), n, lit) * (0.85 + 0.3 * vn(L.xy * 14.0 + L.z * 9.0));
      c *= 1.0 - 0.35 * step(0.62, fract((L.x + L.z * 0.35) * 18.0)) * (1.0 - uLow); c += celSpec(n, 0.9) * 0.1 + vec3(0.03, 0.42, 0.62) * uSpill * (0.2 + 0.5 * (1.0 - hm)) * (0.6 + 0.4 * lit);
      c *= 1.0 - 0.7 * line; }
    else if (id == 33) {   // reactor cyan: water-energy with its structure showing: bands flowing along the mesh's own x, cell walls, a darker limb
      float f = fract(L.x * 3.2 - uTime * 0.7 + 0.25 * vn(L.yz * 5.0)), bandf = smoothstep(0.0, 0.12, f) * (1.0 - smoothstep(0.55, 0.95, f)), wall = smoothstep(0.42, 0.5, abs(fract(atan(L.z, L.y) * 1.2732 + 0.5) - 0.5)), g = 0.45 + 1.0 * uGlow;
      float cau = vn(vec2(L.x * 9.0 - uTime * 1.6, atan(L.z, L.y) * 3.0)), fine = smoothstep(0.62, 0.8, cau);
      c = mix(vec3(0.0, 0.13, 0.34), vec3(0.08, 0.75, 1.15), bandf) * (0.5 + 0.5 * ndv) + vec3(0.6, 0.95, 1.0) * fine * bandf * 0.6;
      c = c * g * (1.0 - 0.72 * wall) * (1.0 - 0.6 * line) + vec3(0.02, 0.2, 0.3) * pow(1.0 - ndv, 2.0); }
    else if (id == 34) {   // a tooth: off-white enamel-chrome, hard bands, a sharp glint
      c = cel3(vec3(0.42, 0.47, 0.6), vec3(0.8, 0.83, 0.87), vec3(1.0, 1.0, 0.97), n, lit) + celSpec(n, 0.93) * 0.6 + smoothstep(0.0, 0.04, r.z) * (1.0 - smoothstep(0.1, 0.16, r.z)) * vec3(0.12, 0.16, 0.22);
      c = c * (1.0 - 0.6 * line) + celRim(n); }
    else {                 // canopy glass: dark blue, semi-gloss: a hard sky reflection, a glint streak, a lighter limb
      c = cel3(vec3(0.004, 0.012, 0.045), vec3(0.01, 0.035, 0.11), vec3(0.03, 0.09, 0.24), n, lit);
      c += smoothstep(0.25, 0.3, r.z) * (1.0 - smoothstep(0.62, 0.7, r.z)) * vec3(0.12, 0.28, 0.52) * (0.5 + 0.5 * lit) + celSpec(n, 0.985) * vec3(0.9, 0.97, 1.0) + smoothstep(0.55, 0.75, 1.0 - ndv) * vec3(0.05, 0.18, 0.32) + vec3(0.02, 0.2, 0.3) * uSpill * 0.4;
      c *= 1.0 - 0.7 * line; }
    c = frostFx(c, L); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id == 27) { alb = vec3(0.52, 0.47, 0.34); F0 = vec3(1.0, 0.94, 0.8); rough = 0.13;   // the ring's metal (its axis the mesh's own z): pale gold-white, an engraved vine with green enamel leaves
    float ang = atan(L.y, L.x), fu = fract(ang / 6.2832 * 18.0), v = clamp(L.z * 10.0, -1.0, 1.0), wv = 0.42 * sin(fu * 6.2832);
    if (abs(v - wv) < 0.07) { cav += 0.75; rough = 0.3; alb *= 0.35; F0 *= 0.3; }                                             // (the stem)
    vec2 lf = vec2((fract(fu * 2.0) - 0.5) * 1.7, v - wv - 0.3 * (fu < 0.5 ? 1.0 : -1.0)); float le = dot(lf * vec2(1.0, 2.6), lf * vec2(1.0, 2.6));
    if (le < 0.16) { alb = vec3(0.012, 0.32, 0.13) * (0.7 + 0.6 * step(abs(lf.x * 0.35 + lf.y), 0.03)); F0 = vec3(0.07); rough = 0.12; metal = 0.0; coat = 1.0; if (le > 0.12) cav += 0.6; }   // (a leaf of enamel, its rim cut in)
    if (abs(abs(v) - 0.86) < 0.035) cav += 0.6; }                                                     // (a bead line near each edge)
  else if (id == 28) { float ang = atan(L.y, L.x), ndv = max(0.0, dot(n, uV)), fl = 0.62 + 0.38 * sin(ang * 9.0 - uTime * 3.2 + 3.0 * vn(vec2(ang * 3.0, uTime * 0.7))), sp = vn(vec2(ang * 30.0 - uTime * 6.0, L.z * 20.0));   // mint energy, flowing round the ring
    vec3 c = frostFx((vec3(0.5, 1.5, 0.95) * fl + vec3(0.9, 1.0, 0.95) * (pow(ndv, 3.0) * 0.6 + smoothstep(0.7, 0.95, sp) * 0.7)) * (0.45 + 1.15 * uGlow), L); gl_FragColor = vec4(vec3(tone(c.r), tone(c.g), tone(c.b)) * uAlpha, uAlpha); return; }
  else if (id == 29) { alb = vec3(0.34, 0.36, 0.37); F0 = vec3(0.95, 0.97, 0.97); rough = 0.07;   // a sword's blade: pale mirror steel, a fuller line, a luminous mint edge (vA.y = 1 at the cutting edges, 0 at the spine)
    float eg = smoothstep(0.6, 1.0, edge); em = vec3(0.35, 1.35, 0.85) * (eg * eg * (0.55 + 1.3 * uGlow) + 0.06 * uGlow);
    if (edge > 0.1 && edge < 0.16) { cav += 0.7; rough = 0.2; } rough *= 0.8 + 0.5 * vn(L.xy * 40.0 + L.z * 3.0); }
  else { coat = 1.0; }
  // surface detail, from the part's own coordinates (it stays on the part as it moves)
  if (metal > 0.5 && uLow < 0.5) { float s1 = abs(fract(L.x * 13.0 + L.y * 8.0 + L.z * 5.0 + vn(L.xz * 4.0) * 2.5) - 0.5);
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
    prog = p; U = {}; for (const n of ['uR0', 'uR1', 'uR2', 'uT', 'uPX', 'uPY', 'uPD', 'uCl', 'uV', 'uLK', 'uLS', 'uLR', 'uUP', 'uGlow', 'uAlpha', 'uKind', 'uFx', 'uRim', 'uAmb', 'uLow', 'uWear', 'uGlow2', 'uSpill', 'uTime', 'uOutV', 'uOutF']) U[n] = gl.getUniformLocation(p, n);
    ext32 = isGL2 ? true : gl.getExtension('OES_element_index_uint'); gen++;
  }
  /* is WebGL ready (made on first call)? */
  function ok() {
    if (failed) return false; if (gl) return !lost && !gl.isContextLost();
    try {
      if (typeof document === 'undefined') { failed = true; return false; }
      cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const opt = { alpha: true, premultipliedAlpha: true, antialias: !(typeof window !== 'undefined' && window.__GLNOAA), depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'default' };
      gl = cv.getContext('webgl2', opt); isGL2 = !!gl; if (!gl) gl = cv.getContext('webgl', opt) || cv.getContext('experimental-webgl', opt);
      if (!gl) { failed = true; return false; }
      cv.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; }, false);
      cv.addEventListener('webglcontextrestored', () => { try { compile(); lost = false; } catch (e) { failed = true; } }, false);
      try { const di = gl.getExtension('WEBGL_debug_renderer_info'), rn = String(di ? gl.getParameter(di.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); soft = /swiftshader|llvmpipe|software|softpipe/i.test(rn); } catch (e) { soft = false; }   // (a CPU rasteriser: the model then renders at reduced resolution)
      compile(); return true;
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
    gl.uniform3fv(U.uV, S.v); gl.uniform3fv(U.uLK, S.lk); gl.uniform3fv(U.uLS, S.ls); gl.uniform3fv(U.uLR, S.lr); gl.uniform3fv(U.uUP, S.up); gl.uniform1f(U.uLow, S.low ? 1 : 0); gl.uniform1f(U.uTime, S.t || 0); gl.uniform3fv(U.uRim, S.rim || RIM0); gl.uniform3fv(U.uAmb, S.amb || AMB0);
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
      gl.uniform3fv(U.uR0, it.R0); gl.uniform3fv(U.uR1, it.R1); gl.uniform3fv(U.uR2, it.R2); gl.uniform3fv(U.uT, it.T);
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
