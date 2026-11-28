/* ---------- (v472 YB) YUG3: what the Yuggoth Engine's three bosses share on the GPU ----------
   On AUR3 (20z4a: a model's GL state, its failures, its release with the stage) and GB_KIT (20x2: vectors, many copies of one mesh).
   The Engine's bosses are drawn by their fights in the 2D bosses' own camera (a tile T px across; screen x = x, screen y = y - z), so
   every model is posed in the fight's own world (x east, y south, z up) on the fight's own skeleton and projected the same way: it
   stands exactly where the 2D drawing stood, its hit areas and its fight unchanged. One GPU pass a boss a frame, into the box round
   it (only the part of the box on the canvas), in its arena's light (breach: the torn hull under the violet void; hall: the
   Capacitor Hall's steel and teal coolant; core: the Core Chamber's flesh-lit dark), carried to the materials (GLM 850..889, the
   YB-YUG-MAT block in 20k5uz) as uAmb (the key's colour) and uRim (the rim's). A pass takes items { mesh, R, o, sc, glow, glow2, spill,
   kind, wear, fx, outline, al }: R a rotation (columns x y z), o the origin, both relative to the fight's point (ox, oy); meshes
   rewritten every frame are marked dyn and their bounds are found again each pass. Analytic occluders (spheres) give soft shadows
   and occlusion between a model's parts. Detail levels: 0 on High, 1 on Balanced, Performance and Fewer effects (and lowFx), the
   pass at the quality's resolution (GQ.glK); window.__YB_LOD = 0 | 1 forces one. Warnings are marked for light (AUR3.wrapFX: the
   engine paints nothing of them) and told on the FGFX painter as the Engine's light (kinds 600..619, YB-FX in 20k6h): 600 a disc
   (current gathering), 601 a lane, 602 a fan, 603 a ring with a gap, 604 a bolt of lightning (one feathered quad, never a beaded
   chain), 605 a lane of molten slag, 606 heat cracks in the deck, 607 coolant light (a floor wash), 608 a plate's guarded arc.
   Without WebGL (or on a software rasteriser, unless window.__AUR_GL) or without the painter, each boss is drawn by its 2D art. */
const YUG3 = (() => {
  const A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const win = k => { try { return typeof window !== 'undefined' ? window[k] : undefined; } catch (e) { return undefined; } };
  const inFight = () => { try { return typeof arc !== 'undefined' && !!arc.game && arc.mode === 'dungeon'; } catch (e) { return false; } };
  const gqL = () => { try { return typeof GQ !== 'undefined' && inFight() ? GQ.level() : 0; } catch (e) { return 0; } };
  const gqK = () => { try { return typeof GQ !== 'undefined' && inFight() && GQ.glK ? GQ.glK() : 1; } catch (e) { return 1; } };
  const lod = () => { const f = win('__YB_LOD'); if (f === 0 || f === 1) return f; return lowFx() || gqL() >= 1 ? 1 : 0; };
  /* the arenas' lights (world: x east, y south, z up): lk the key, ls the sky's bright patch, lr the rim; key and rim colours */
  const LIGHT = { breach: { lk: vnrm([-0.45, 0.35, 0.82]), ls: vnrm([0.25, -0.2, 0.95]), lr: vnrm([0.4, -0.85, 0.35]), key: [1.75, 1.7, 1.95], rim: [1.05, 0.5, 1.6] },
    hall: { lk: vnrm([-0.35, 0.45, 0.82]), ls: vnrm([0.2, 0.1, 0.97]), lr: vnrm([-0.3, -0.88, 0.36]), key: [1.6, 1.72, 1.85], rim: [0.35, 1.35, 1.25] },
    core: { lk: vnrm([-0.3, 0.55, 0.78]), ls: vnrm([0.1, 0.4, 0.9]), lr: vnrm([0.5, -0.8, 0.3]), key: [1.95, 1.52, 1.22], rim: [0.78, 0.55, 1.7] } };   // (v472c YB: the Core Chamber's key warmer (the lens, the furnace), its rim a cool violet)
  const PX = [1, 0, 0], PY = [0, 1, -1], PD = vnrm([0, 1, 1]), UPW = [0, 0, 1], ZS = 3, GLCAP = 1600, OUTC = [0.03, 0.018, 0.06], I3K = I3(), ONE = [1, 1, 1];
  /* a mesh's bounding sphere in its own frame (kept for still meshes; found again every pass for the ones rewritten: M.dyn) */
  function bsOf(M) { if (M.bs && !M.dyn) return M.bs; const p = M.pos; let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
    for (let i = 0; i < p.length; i += 3) { const x = p[i], y = p[i + 1], z = p[i + 2]; if (x === 0 && y === 0 && z === 0 && M.n) continue; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
    if (!(x1 >= x0)) return (M.bs = null); return (M.bs = [[(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 2 + 0.02]); }
  const GI = [], SO = {}, OCC = new Float32Array(48);
  /* one GPU pass: items into the box round them at (X0, Y0) (the fight's point ox, oy on the screen); o: { light, t, flash, occ: [[x, y, z, r]...], res } */
  function pass(c, X0, Y0, k, items, o, G, INFO) { const LT = LIGHT[o.light] || LIGHT.breach; let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
    for (const it of items) { if (!it.mesh || !((it.al == null ? 1 : it.al) > 0.004)) continue; const bs = bsOf(it.mesh); if (!bs) { it.skip = true; continue; } it.skip = false; const R = it.R || I3K, sc = it.sc || ONE, s = Math.max(sc[0], sc[1], sc[2]), oo = it.o || [0, 0, 0];
      const w = vadd(oo, mv(R, [bs[0][0] * sc[0], bs[0][1] * sc[1], bs[0][2] * sc[2]])), rr = bs[1] * s * k + 2, sx = X0 + w[0] * k, sy = Y0 + (w[1] - w[2]) * k;
      if (sx - rr < bx0) bx0 = sx - rr; if (sx + rr > bx1) bx1 = sx + rr; if (sy - rr * 1.42 < by0) by0 = sy - rr * 1.42; if (sy + rr * 1.42 > by1) by1 = sy + rr * 1.42; }
    if (!(bx1 > bx0)) return false;
    const m = c.getTransform ? c.getTransform() : null, soft = GLM.soft && !win('__AUR_GLHQ'), dev = (m ? Math.max(0.25, Math.hypot(m.a, m.b)) : 1) * (soft ? 0.45 : 1) * (o.res || (lowFx() ? 0.8 : 1)) * gqK();
    if (m) { const inv = 1 / Math.max(1e-6, Math.hypot(m.a, m.b)), vx0 = -m.e * inv - 8, vy0 = -m.f * inv - 8, vx1 = vx0 + c.canvas.width * inv + 16, vy1 = vy0 + c.canvas.height * inv + 16; bx0 = Math.max(bx0, vx0); by0 = Math.max(by0, vy0); bx1 = Math.min(bx1, vx1); by1 = Math.min(by1, vy1); if (!(bx1 > bx0) || !(by1 > by0)) return true; }
    let W = Math.ceil((bx1 - bx0) * dev), H = Math.ceil((by1 - by0) * dev); const scl = Math.min(1, GLCAP / Math.max(W, H)); W = Math.max(2, Math.ceil(W * scl)); H = Math.max(2, Math.ceil(H * scl)); const bw = bx1 - bx0, bh = by1 - by0;
    let no = 0; if (o.occ && !lowFx()) for (const q of o.occ) { if (no >= 12) break; OCC[no * 4] = q[0] / ZS; OCC[no * 4 + 1] = q[1] / ZS; OCC[no * 4 + 2] = q[2] / ZS; OCC[no * 4 + 3] = q[3] / ZS; no++; }
    Object.assign(SO, { px: PX, py: PY, pd: PD, cl: [2 * k * ZS / bw, 2 * (X0 - bx0) / bw - 1, -2 * k * ZS / bh, 1 - 2 * (Y0 - by0) / bh], v: PD, lk: LT.lk, ls: LT.ls, lr: LT.lr, up: UPW, low: lowFx(), rim: LT.rim, amb: LT.key, t: (o.t || 0) % 600,
      outline: o.outline === 0 ? 0 : Math.max(1, 1.05 * (W / bw)), outlineCol: o.outlineCol || OUTC, keep: 1, occ: no ? OCC : null, nocc: no });
    const L = []; let n = 0;
    for (const it of items) { if (!it.mesh || it.skip) continue; const al = it.al == null ? 1 : it.al; if (!(al > 0.004)) continue; const R = it.R || I3K, sc = it.sc || ONE, oo = it.o || [0, 0, 0];
      const g = GI[n] || (GI[n] = { R0: new Float32Array(3), R1: new Float32Array(3), R2: new Float32Array(3), T: new Float32Array(3) }); n++;
      for (let i = 0; i < 3; i++) { g.R0[i] = R.x[i] * sc[0] / ZS; g.R1[i] = R.y[i] * sc[1] / ZS; g.R2[i] = R.z[i] * sc[2] / ZS; g.T[i] = oo[i] / ZS; }
      g.mesh = it.mesh; g.alpha = al; g.glow = it.glow || 0; g.glow2 = it.glow2 || 0; g.spill = it.spill || 0; g.kind = it.kind || 0; g.wear = it.wear == null ? 0.5 : it.wear; g.fx = it.fx || 0; g.outline = it.outline; g.first = 0; g.cnt = 0; g.d = vdot(oo, PD); L.push(g); }
    L.sort((p, q) => (p.alpha > 0.995 ? 0 : 1) - (q.alpha > 0.995 ? 0 : 1) || (p.alpha > 0.995 ? 0 : p.d - q.d));
    const t0 = nowMs(), cvs = GLM.render(W, H, SO, L); if (!cvs) return false;
    c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); if (o.flash > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha *= Math.min(1, o.flash) * 0.3; c.drawImage(cvs, 0, 0, W, H, bx0, by0, bw, bh); c.restore(); }
    G.ms = G.ms * 0.9 + (nowMs() - t0) * 0.1; G.n++; G.box = [W, H]; try { const st = GLM.stats; G.calls = st.calls; G.drawTris = st.tris; if (INFO) Object.assign(INFO, { calls: st.calls, tris: st.tris, W, H, ms: +G.ms.toFixed(2) }); } catch (e) { /* (no stats) */ } return true; }
  /* halos on the painter: [0, p, r (tiles), col, a] a glow; [1, p0, p1, w (tiles), col, a] a fading streak; [2, p0, p1, w, col, a, seed] a bolt (p relative to the origin) */
  function halos(Q, list, X0, Y0, T, al) { if (!list) return; const sx = p => X0 + p[0] * T, sy = p => Y0 + (p[1] - p[2]) * T;
    for (const h of list) { if (h[0] === 0) Q.glow(sx(h[1]), sy(h[1]), h[2] * T, h[3], h[4] * al); else if (h[0] === 1) Q.rbeam(sx(h[1]), sy(h[1]), sx(h[2]), sy(h[2]), h[3] * T, h[4], h[5] * al, 1, 0.4); else bolt(Q, sx(h[1]), sy(h[1]), sx(h[2]), sy(h[2]), h[3] * T, h[4], h[5] * al, h[6] || 0); } }
  /* a bolt of lightning between two screen points: one feathered quad (604), jagged in the shader */
  function bolt(Q, x0, y0, x1, y1, w, col, a, seed) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 1 || !(a > 0.004)) return; const ww = Math.max(w, L * 0.18 + w);
    Q.quad(604, x0 + dx, y0 + dy, dx, dy, -dy / L * ww, dx / L * ww, col, a, seed || 0, w / ww, L / ww); }
  /* a warning's light on the deck: 600 a disc, 601 a lane, 602 a fan (u 0..1 the tell, 1..2 the strike fading) */
  function tell(Q, FX, s, T, t, mode) { const u = cl(s.age / s.t) * 0.999 + (s.done ? 1 : 0), sd = s.seed || 1, X = FX.sx(s.x), Y = FX.sy(s.y), col = s.col || '#E8B8FF', md = mode || 0;
    if (s.geo === 'line') { const ca = Math.cos(s.a), sa = Math.sin(s.a), hl = s.len / 2 * T, hw = s.w / 2 * T * 1.25; Q.quad(601, FX.sx(s.x + ca * s.len / 2), FX.sy(s.y + sa * s.len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, col, 1, u, (s.ord || 0) * 100 + (sd % 40), s.len / s.w); }
    else if (s.geo === 'cone') { const R = s.len * T * 1.04, ca = Math.cos(s.a), sa = Math.sin(s.a); Q.quad(602, X, Y, ca * R, sa * R, -sa * R, ca * R, col, 1, u, sd + md * 100, s.spread); }
    else if (s.geo === 'circle') { const R = s.r * T * 1.14; Q.quad(600, X, Y, R, 0, 0, R, col, 1, u, sd, md); } }
  /* the marked warnings in the boss's overlay (as the engine drew them, when the painter is lost) */
  function marked(c, FX, t, T, F, modeOf) { const list = FX.S.tele.filter(s => s.aur); if (!list.length) return; if (!F) { for (const s of list) A.tele2D(c, FX, s, T, t); return; }
    const Q = F.begin(c, null); try { for (const s of list) tell(Q, FX, s, T, t, modeOf ? modeOf(s) : 0); } finally { F.flush(c); } }
  /* ---- mesh helpers ---- */
  // many copies (k) of one small mesh; each copy's third attribute carries its index (4 k + its own value)
  function copies(base, n) { const M = K.multi(base, n), nv = base.nv; for (let k = 0; k < n; k++) for (let i = 0; i < nv; i++) M.att[(k * nv + i) * 3 + 2] = k * 4 + Math.min(3.9, base.att[i * 3 + 2]); for (let i = 0; i < M.pos.length; i++) M.pos[i] = 0; M.dyn = true; return M; }
  // (v472b YB) a unit sphere's own direction in its attributes (e = (x + 1) / 2, a = (y + 1) / 2 x 3.8; |z| follows): copies are written in the
  // world, so a pattern on them (an iris, a pupil) must come from these, not from the position
  function dirAtt(M) { for (let i = 0; i < M.nv; i++) { const x = M.pos[i * 3], y = M.pos[i * 3 + 1], z = M.pos[i * 3 + 2], l = Math.hypot(x, y, z) || 1; M.att[i * 3 + 1] = (x / l + 1) / 2; M.att[i * 3 + 2] = (y / l + 1) / 2 * 3.8; } return M; }
  // a grid (nu + 1 by nv + 1) whose points are written every frame: att(i, j) -> [e, a, m]
  function mkGrid(nu, nv, att, m) { const n1 = nu + 1, nvx = n1 * (nv + 1), pos = new Float32Array(nvx * 3), nrm = new Float32Array(nvx * 3), at = new Float32Array(nvx * 3), I = nvx > 65535 ? new Uint32Array(nu * nv * 6) : new Uint16Array(nu * nv * 6);
    let o = 0; for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = att(i, j); at[o] = q[2] == null ? m : q[2]; at[o + 1] = q[0]; at[o + 2] = q[1]; nrm[o + 2] = 1; o += 3; }
    o = 0; for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * n1 + i; I[o++] = a; I[o++] = a + 1; I[o++] = a + n1 + 1; I[o++] = a; I[o++] = a + n1 + 1; I[o++] = a + n1; }
    return { pos, nrm, att: at, idx: I, nv: nvx, ntri: nu * nv * 2, gl: null, nu, nvv: nv, dyn: true }; }
  // its normals from the grid (wrap: j closes round), committed
  function gridNormals(M, wrap) { const nu = M.nu, nv = M.nvv, n1 = nu + 1, P = M.pos, N = M.nrm;
    for (let j = 0; j <= nv; j++) { const jp = j === nv ? (wrap ? 1 : nv) : j + 1, jm = j === 0 ? (wrap ? nv - 1 : 0) : j - 1;
      for (let i = 0; i <= nu; i++) { const ip = Math.min(nu, i + 1), im = Math.max(0, i - 1), a = (j * n1 + ip) * 3, b = (j * n1 + im) * 3, c = (jp * n1 + i) * 3, d = (jm * n1 + i) * 3, o = (j * n1 + i) * 3;
        const ux = P[a] - P[b], uy = P[a + 1] - P[b + 1], uz = P[a + 2] - P[b + 2], vx = P[c] - P[d], vy = P[c + 1] - P[d + 1], vz = P[c + 2] - P[d + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, l = Math.sqrt(nx * nx + ny * ny + nz * nz); if (l < 1e-12) continue; N[o] = nx / l; N[o + 1] = ny / l; N[o + 2] = nz / l; } }
    K.commit(M); }
  // a swept tube written into a grid (i along, j round) along a polyline of points P (n + 1 samples) with radius rad(u)
  const TF = new Float32Array(6 * 200), TP = new Float32Array(3 * 200);
  function sweep(M, P, rad, flat) { const nu = M.nu, nv = M.nvv, n1 = nu + 1, PP = M.pos, NN = M.nrm, m = P.length - 1;
    for (let i = 0; i <= nu; i++) { const f = i / nu * m, q = Math.min(m - 1, Math.floor(f)), t = f - q, p0 = P[Math.max(0, q - 1)], p1 = P[q], p2 = P[q + 1], p3 = P[Math.min(m, q + 2)], t2 = t * t, t3 = t2 * t;
      for (let a = 0; a < 3; a++) TP[i * 3 + a] = 0.5 * (2 * p1[a] + (-p0[a] + p2[a]) * t + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * t2 + (-p0[a] + 3 * p1[a] - 3 * p2[a] + p3[a]) * t3); }
    let nx = 0, ny = 0, nz = 1;
    for (let i = 0; i <= nu; i++) { const a = Math.max(0, i - 1) * 3, b = Math.min(nu, i + 1) * 3; let tx = TP[b] - TP[a], ty = TP[b + 1] - TP[a + 1], tz = TP[b + 2] - TP[a + 2]; const tl = Math.sqrt(tx * tx + ty * ty + tz * tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      if (i === 0 && Math.abs(tz) > 0.9) { nx = 1; ny = 0; nz = 0; } const dn = nx * tx + ny * ty + nz * tz; nx -= tx * dn; ny -= ty * dn; nz -= tz * dn; let nl = Math.sqrt(nx * nx + ny * ny + nz * nz); if (nl < 1e-5) { nx = -ty; ny = tx; nz = 0; nl = Math.hypot(nx, ny) || 1; } nx /= nl; ny /= nl; nz /= nl;
      TF[i * 6] = nx; TF[i * 6 + 1] = ny; TF[i * 6 + 2] = nz; TF[i * 6 + 3] = ty * nz - tz * ny; TF[i * 6 + 4] = tz * nx - tx * nz; TF[i * 6 + 5] = tx * ny - ty * nx; }
    for (let i = 0; i <= nu; i++) { const u = i / nu, px = TP[i * 3], py = TP[i * 3 + 1], pz = TP[i * 3 + 2];
      for (let j = 0; j <= nv; j++) { const th = j / nv * TAU, r = rad(u, th), c = Math.cos(th), s = Math.sin(th) * (flat || 1), o3 = (j * n1 + i) * 3, ex = TF[i * 6] * c + TF[i * 6 + 3] * s, ey = TF[i * 6 + 1] * c + TF[i * 6 + 4] * s, ez = TF[i * 6 + 2] * c + TF[i * 6 + 5] * s;
        PP[o3] = px + ex * r; PP[o3 + 1] = py + ey * r; PP[o3 + 2] = pz + ez * r; } }
    gridNormals(M, true); return TP; }
  // a value noise in three dimensions (for sculpting meshes once)
  const hs3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  function n3(x, y, z) { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const L = (a, b, t) => a + (b - a) * t, c = (i, j, k) => hs3(xi + i, yi + j, zi + k);
    return L(L(L(c(0, 0, 0), c(1, 0, 0), u), L(c(0, 1, 0), c(1, 1, 0), u), v), L(L(c(0, 0, 1), c(1, 0, 1), u), L(c(0, 1, 1), c(1, 1, 1), u), v), w); }
  const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const rel = (p, ox, oy) => [p[0] - ox, p[1] - oy, p[2]];
  // a rotation with x along d, z as near the hint as it can be
  const along = (d, up) => K.frameXZ(d, up || (Math.abs(vnrm(d)[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
  // a copy laid as a segment from a to b with radius r (a unit tube along x 0..1)
  function seg(MS, k, a, b, r) { const d = vsub(b, a), L = vlen(d) || 1e-4; K.place(MS, k, along(d), a, [L, r, r]); }
  const rotZ = th => { const c = Math.cos(th), s = Math.sin(th); return M3([c, s, 0], [-s, c, 0], [0, 0, 1]); };
  const mm3 = (A2, B) => M3(mv(A2, B.x), mv(A2, B.y), mv(A2, B.z));
  return { dirAtt, A, K, LIGHT, lod, gqK, inFight, pass, halos, bolt, tell, marked, copies, mkGrid, gridNormals, sweep, n3, rng, rel, along, seg, rotZ, mm3, bsOf, ZS, PD, I3K, win };
})();

/* ---------- (v472 YB) KH'AAL THE HULL-EATER in three dimensions (Rift 06, the Yuggoth Engine's first boss: the Breach) ----------
   The 2D Kh'aal of 20z7-rift-fiend-yuggoth-1.js rebuilt as a sculpted, textured and lit GPU model, the same creature from its 2D
   drawing (a colossal fungal crustacean scavenger six metres across), posed every frame on the fight's own skeleton (its pose():
   the body frame at its height and roll, the six feet stepping in tripods, the head, the two claws, the plate, the wings), so it
   stands exactly where its hit areas are and its fight is untouched. Materials GLM 850..859 (YB-YUG-MAT, 20k5uz).
   THE SHELL (one still mesh in the body's frame, 850): the carapace's dome laid as the 2D's own rings of torn hull plates (a
   heptagon at the crown, six round it, eleven at the rim), each plate raised a little and tilted on its own so their edges step
   where they were fused, the seams cut between them with violet current running in them, rows of rivets, scratches, heat-tint and
   an oily sheen, a rolled lip at the rim; the torn-out panel a pit glowing violet with cables across it; eight jagged hull shards
   jutting flat from the rim; the dark chitin belly under it; a ruffled skirt of pink fungus all round the rim in two layers with
   its gills, fungal cushions and little teal caps taking root on three plates.
   THE HEAD (852): a ridged brain-lobe (its folds sculpted in the mesh, a fissure down its middle), wet, lit from inside in the
   colour that shifts teal, violet and amber (brightest in its grooves); mandibles and palps working under it; two eyes on stalks
   swivelling, four small eyes glowing at its front; the slag's glow in its mouth.
   THE LEGS (851): six legs of black-violet lacquered chitin, each one swept tube from the shoulder through a high knee and the ankle
   to a spike on the deck (rewritten every frame along the fight's own joints), segment joints, a riveted cuff of hull plate round
   each femur, spurs off the knees and ankles.
   THE CLAWS: the hammer (a heavy arm; a palm clad in riveted plate with violet seams; a short blunt fixed finger and a hooked finger
   opening and slamming shut, pale crushing teeth); the shear (a long arm; two steel blades with honed edges, current along them,
   scissoring about a violet hinge lamp; a plated palm). The plate it holds: a torn hull plate rising out of the deck, riveted, a
   scorched seam with current in it, its torn top edge catching the light.
   THE WINGS (853): ragged fungal membranes (folded flat on its back, spread and beating in phase two): veins from the root to every
   point, tears showing the dark through, spore-spots glowing teal, light through the membrane, a leading spar.
   LIGHT: one pass in the Breach's light (a pale violet-white key, the void's violet rim behind, the deck's grey bounce); soft shadows
   and occlusion from four spheres posed with it. Its 2D glows on the painter: the seams' violet pooled on the deck, the brain's
   inner light, the eyes, the mouth, the hinge; overcharged, a corona of stolen current and bolts round it; staggered, teal current
   crawling over the slumped shell. Its moves' light: the marked warnings (600..602), the slag's lanes (605), the globs, the cells'
   bolts (604), the slam craters' heat cracks (606), the guarded arc (608), the rim's crackling.
   LEVELS: full on High (~40k triangles); Balanced, Performance and Fewer effects take the lighter level. GPU buffers freed with the
   stage (AUR3's release). window.__YB_LOD forces a level (tests). */
const KHAAL_GL = (() => {
  const Y = YUG3, A = AUR3, K = GB_KIT, { TAU, cl, lerp, vadd, vsub, vmul, vdot, vlen, vnrm, vcross, M3, I3, mv } = K, lowFx = K.lowFx, nowMs = K.nowMs;
  const M_HULL = 850, M_CHIT = 851, M_BRAIN = 852, M_FUNG = 853, M_BLADE = 854, M_LENS = 855, M_TOOTH = 856;
  const VIOLET = '#9A5CFF', VIOLET_HI = '#E8B8FF', TEAL = '#3FD8C8', TEAL_HI = '#B8FFF2', AMBER = '#FFB23F', SLAG = '#FF7A2E', SLAG_HI = '#FFD27A', FUNGUS = '#E88AC0', WHITE = '#FFFFFF';
  const RIG = () => { try { return typeof FIEND_DEFS !== 'undefined' && FIEND_DEFS.khaal ? FIEND_DEFS.khaal.RIG : null; } catch (e) { return null; } };
  const G = A.model('Khaal', () => ({}));
  const gpu = () => !!RIG() && G.on() && !!A.fg();
  const ss = x => { x = cl(x); return x * x * (3 - 2 * x); };
  const INFO = { lod: 0, calls: 0, tris: 0, W: 0, H: 0, ms: 0, poseMs: 0 };
  // the two levels: the dome's rings and its turn, legs (along, round), arms, wings (span, rim), the brain, the skirt
  const CFG = [{ dr: 40, da: 176, lu: 40, lv: 12, au: 36, av: 12, wu: 12, wv: 72, bu: 112, bv: 64, sk: 168, sp: 9, q: 1 }, { dr: 22, da: 96, lu: 22, lv: 8, au: 20, av: 8, wu: 7, wv: 40, bu: 64, bv: 36, sk: 96, sp: 6, q: 0.6 }];
  // the carapace's rings of plates (as the 2D's PANELS: the crown a heptagon, six round it from 0.16951, eleven at the rim from 0.05241; the torn one the rim's third)
  const OFF1 = 0.16951, OFF2 = 0.05241, HEPT = r => 0.32 * Math.cos(Math.PI / 7) / Math.cos(((((r - 0.3) % (TAU / 7)) + TAU / 7) % (TAU / 7)) - Math.PI / 7);
  function panelOf(rho, th) { const t = ((th % TAU) + TAU) % TAU, h7 = HEPT(t);
    if (rho < h7) { return { ring: 0, i: 0, d: (h7 - rho) * 2.1, u: rho / h7, v: 0.5 }; }
    const two = rho >= 0.66, n = two ? 11 : 6, off = two ? OFF2 : OFF1, w = TAU / n, x = ((t - off) % TAU + TAU) % TAU, i = Math.floor(x / w), f = x / w - i, r0 = two ? 0.66 : h7, r1 = two ? 1.0 : 0.66;
    const dr = Math.min(rho - r0, two ? 9 : r1 - rho) * 2.1, da = Math.min(f, 1 - f) * w * rho * 2.1; return { ring: two ? 2 : 1, i, d: Math.min(dr, da), u: (rho - r0) / (r1 - r0), v: f }; }
  const hsh = (a, b) => { const s = Math.sin(a * 91.7 + b * 47.3) * 43758.5453; return s - Math.floor(s); };

  /* ---------- the meshes of one level (made once, on first use; kept in the model's MESH so letting go frees them all) ---------- */
  const SETS = [null, null];
  function set(L) { if (SETS[L] && G.MESH && G.MESH['shell' + L]) return SETS[L]; const t0 = nowMs(), C = CFG[L], R0 = RIG(), q = n => Math.max(3, Math.round(n * C.q)), out = {};
    const RIM = R0.RIM, DA = R0.DA, DB = R0.DB, DZ = R0.DZ;
    /* the shell: the carapace (polar: e its turn / 2pi, a its radius in the dome's unit disc), the lip, the belly, the shards, the skirt, the fungus */
    { const B = GLM.builder(1), NR = C.dr, NA = C.da, rT = []; for (let i = 0; i <= NR; i++) { const s = i / NR; rT.push(1.06 * (1 - Math.pow(1 - s, 1.7))); }
      const dome = (rho, th) => { const ca = Math.cos(th), sa = Math.sin(th); if (rho <= 1) { const w = Math.sqrt(Math.max(0, 1 - rho * rho)), p = [DA * rho * ca, DB * rho * sa, RIM + DZ * w], n = vnrm([p[0] / (DA * DA), p[1] / (DB * DB), (p[2] - RIM) / (DZ * DZ) + 1e-4]); return { p, n }; }
        const e = (rho - 1) / 0.06, k = 1 + 0.035 * Math.sin(Math.min(1, e) * Math.PI * 0.9); return { p: [DA * ca * k, DB * sa * k, RIM - 0.16 * e], n: vnrm([ca / DA, sa / DB, 0.2 - e]) }; };
      B.surf((u, v) => { const rho = rT[Math.round(v * NR)], th = u * TAU, D = dome(rho, th); if (rho > 1) return D.p; const P = panelOf(rho, th), torn = P.ring === 2 && P.i === 2;
          let dz = 0.045 * ss(P.d / 0.07) - 0.05 * Math.exp(-((P.d / 0.03) ** 2)); if (P.ring) { const h1 = hsh(P.ring * 13 + P.i, 1), h2 = hsh(P.ring * 13 + P.i, 2); dz += (0.05 * (h1 - 0.5) * (P.u - 0.5) * 2 + 0.045 * (h2 - 0.5) * (P.v - 0.5) * 2) * ss(P.d / 0.04); }
          if (torn) dz -= 0.22 * ss((P.d + 0.012 * Math.sin(th * 97) + 0.01 * Math.sin(rho * 60)) / 0.07);
          return vadd(D.p, vmul(D.n, dz)); }, NA, NR, () => M_HULL, { e: (u, v) => u, a: (u, v) => rT[Math.round(v * NR)], flip: true });
      // the belly (dark chitin) under the rim
      B.ell([0.1, 0, RIM - 0.3], [1.55, 2.2, 0.48], M_CHIT + 0.2, { seg: q(40), rings: q(16) });
      // the shards: torn hull fused into the rim, jutting flat (outline across the rim: radial x, along the rim y)
      for (const [ph, len, w] of R0.SPINES) for (const sd of [-1, 1]) { const a = ph * sd, rr = [DA * Math.cos(a), DB * Math.sin(a)], rl = Math.hypot(rr[0], rr[1]), xd = vnrm([rr[0], rr[1], -0.35 * rl * 0.3]), yd = vnrm([-Math.sin(a) * DA, Math.cos(a) * DB, 0]), zd = vnrm(vcross(xd, yd));
        const wd = w * rl * 1.3, L0 = len * rl * 1.6, pts = [[-0.08 * rl, -wd], [L0 * 0.55, wd * 0.15 * sd], [L0, wd * 0.6 * sd], [L0 * 0.35, wd * 0.95 * sd], [-0.08 * rl, wd]]; B.push(xd, yd, zd, [rr[0] * 0.95, rr[1] * 0.95, RIM + 0.12]); B.prism(pts, -0.07, 0.07, M_HULL + 0.8, { b: 0.025 }); B.pop(); }
      // the skirt: two layers of ruffled fungus hanging from the rim (e 0 its top .. 1 its hem, a its turn + 2 for the inner layer)
      for (const [drop, outw, lay] of [[0.66, 0.3, 0], [0.44, 0.17, 1]]) { const NS = C.sk, ND = q(6);
        B.surf((u, v) => { const th = u * TAU, ca = Math.cos(th), sa = Math.sin(th), wv = Math.sin(th * 23 + 0.7) * 0.25 + Math.sin(th * 9) * 0.15, rf = 0.07 * Math.sin(th * 31 + lay) * v, k = 1.0 + (outw * v + rf) * 0.55 + lay * 0.012;
          return [DA * ca * k, DB * sa * k, RIM - 0.08 - drop * v * (1 + wv) * (0.75 + 0.25 * Math.cos(th))]; }, NS, ND, () => M_FUNG, { e: (u, v) => v, a: (u, v) => u + lay * 2 }); }
      // fungus taking root on three plates: cushions and little teal caps on stalks
      const R = Y.rng(77); for (const [ring, i] of [[2, 5], [1, 1], [2, 9]]) { const n = ring === 2 ? 11 : 6, off = ring === 2 ? OFF2 : OFF1, th = off + (i + 0.5) / n * TAU, rho = ring === 2 ? 0.83 : 0.5, D = dome(rho, th), Rf = Y.along(vcross([0, 0, 1], D.n), D.n);
        B.push(Rf.x, Rf.y, Rf.z, D.p); for (const [dx, dy, r] of [[-0.25, 0.05, 0.22], [0.05, -0.08, 0.26], [0.3, 0.06, 0.2], [0.05, 0.16, 0.18]]) B.ell([dx, dy, 0.02], [r, r * 0.8, r * 0.55], M_FUNG + 0.2, { seg: q(14), rings: q(8) });
        for (let j = 0; j < 3; j++) { const x = (R() - 0.5) * 0.5, y = (R() - 0.5) * 0.3, h = 0.24 + R() * 0.12; B.tube([x, y, 0.05], [x + 0.03, y, h], 0.03, 0.025, M_FUNG + 0.6, { seg: q(6), cap0: false, cap1: false }); B.ell([x + 0.03, y, h], [0.11, 0.11, 0.055], M_FUNG + 0.6, { seg: q(12), rings: q(5), th1: Math.PI / 2, cap: true }); }
        B.pop(); }
      out['shell' + L] = B.done(); }
    /* the brain-lobe (e how deep in a groove, a near the fissure): an ellipsoid of radii 0.78 x 1.0 x 0.72, its folds sculpted */
    { const B = GLM.builder(1), NU = C.bu, NV = C.bv, fold = (d) => { const f = Y.n3(d[0] * 4.2 + 7, d[1] * 3.4, d[2] * 4.2) * 0.72 + Y.n3(d[0] * 9.0, d[1] * 9.0 + 3, d[2] * 9.0) * 0.28; return Math.exp(-(((f - 0.5) / 0.055) ** 2)); };   // (v472b YB: the sulci: narrow meandering grooves between broad gyri)
      const at = (u, v) => { const ph = u * TAU, th = 0.02 + v * (Math.PI - 0.04), d = [Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)], g = fold(d), fis = Math.exp(-((d[1] / 0.07) ** 2)) * ss((d[2] + 0.2) / 0.4);
        const k = 1 - 0.13 * g - 0.14 * fis + 0.02 * Math.sin(ph * 3) * Math.sin(th); return { p: [d[0] * 0.78 * k, d[1] * 1.0 * k, d[2] * 0.72 * k], g, fis }; };
      B.surf((u, v) => at(u, v).p, NU, NV, () => M_BRAIN, { e: (u, v) => at(u, v).g, a: (u, v) => at(u, v).fis, flip: true }); out['brain' + L] = B.done(); }
    /* the legs (six swept tubes: e round, a along x 3: femur, shin, tip) and the arms (two: x 2) */
    for (let i = 0; i < 6; i++) out['leg' + i + L] = Y.mkGrid(C.lu, C.lv, (a, j) => [j / C.lv, a / C.lu * 3], M_CHIT);
    for (const k of ['armH', 'armS']) out[k + L] = Y.mkGrid(C.au, C.av, (a, j) => [j / C.av, a / C.au * 2], M_CHIT);
    /* the knobs (knees, ankles, elbows), the cuffs, the spurs, the mouth's and the stalks' segments, the palps */
    { const B = GLM.builder(C.q); B.sph([0, 0, 0], 1, M_CHIT + 0.4, 14); out['knob' + L] = Y.copies(B.done(), 14); }
    { const B = GLM.builder(C.q); B.tube([0, 0, 0], [1, 0, 0], 1, 1, M_HULL + 0.3, { seg: 14, cap0: 'flat', cap1: 'flat' }); out['cuff' + L] = Y.copies(B.done(), 6); }
    { const B = GLM.builder(C.q); B.tube([0, 0, 0], [1, 0, 0], 1, 0.02, M_CHIT + 0.6, { seg: 7, cap0: 'flat', cap1: false }); out['spur' + L] = Y.copies(B.done(), 12); }
    { const B = GLM.builder(C.q); B.tube([0, 0, 0], [1, 0, 0], 1, 0.72, M_CHIT + 0.4, { seg: 10, cap0: 'round', cap1: 'round' }); out['segC' + L] = Y.copies(B.done(), 8); }
    { const B = GLM.builder(C.q); B.tube([0, 0, 0], [1, 0, 0], 1, 0.6, M_CHIT + 0.8, { seg: 9, cap0: 'round', cap1: 'round' }); out['segP' + L] = Y.copies(B.done(), 4); }
    /* the lenses: 0, 1 the stalk eyes, 2..5 the small eyes, 6 the hinge lamp, 7 the mouth's slag */
    { const B = GLM.builder(C.q); B.sph([0, 0, 0], 1, M_LENS, 14); out['lens' + L] = Y.copies(Y.dirAtt(B.done()), 8); }
    /* the hammer's palm (x along it): an ellipsoid clad in plate; its fixed finger and its hooked finger (in the palm's frame, x along, z up; the hook about its hinge at (0.55, 0.5)) */
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [1.08, 0.86, 0.8], M_HULL + 0.2, { seg: 32, rings: 20 }); out['palmH' + L] = B.done(); }
    { const B = GLM.builder(C.q), pts = [[0.8, 0, -0.3], [1.08, 0, -0.33], [1.35, 0, -0.32], [1.58, 0, -0.22], [1.72, 0, -0.1]];
      for (let k = 0; k < 4; k++) B.tube(pts[k], pts[k + 1], 0.33 - k * 0.03, 0.3 - k * 0.03, M_CHIT + 0.4, { seg: 14, cap0: 'round', cap1: 'round' });
      for (const [x, z] of [[0.95, -0.08], [1.25, -0.06], [1.5, 0.0]]) B.ell([x, 0, z], [0.1, 0.12, 0.08], M_TOOTH, { seg: 10, rings: 6 }); out['fingF' + L] = B.done(); }
    { const B = GLM.builder(C.q), pts = [[0, 0, 0], [0.33, 0, 0.1], [0.65, 0, 0.07], [0.98, 0, -0.12], [1.23, 0, -0.32]];
      for (let k = 0; k < 4; k++) B.tube(pts[k], pts[k + 1], 0.3 - k * 0.045, 0.27 - k * 0.05, M_CHIT + 0.4, { seg: 14, cap0: 'round', cap1: 'round' });
      for (const [x, z] of [[0.45, -0.17], [0.85, -0.22]]) B.ell([x, 0, z], [0.09, 0.11, 0.07], M_TOOTH, { seg: 10, rings: 6 }); out['fingH' + L] = B.done(); }
    /* the shear: its palm; two blades (x along 0.4 .. len, y toward the back of the blade, z its thickness; the cutting edge at y = 0 bevelled) */
    { const B = GLM.builder(C.q); B.ell([0, 0, 0], [0.72, 0.42, 0.4], M_HULL + 0.2, { seg: 26, rings: 14 }); out['palmS' + L] = B.done(); }
    for (const [nm, len] of [['bladeL', 2.45], ['bladeU', 2.3]]) { const B = GLM.builder(1), N = C.sp * 2, pts = [];
      for (let i = 0; i <= N; i++) { const u = i / N, x = lerp(0.35, len, u), back = 0.44 * (1 - Math.pow(u, 1.6)) * (0.9 + 0.1 * Math.sin(u * 3)) + 0.02; pts.push([x, back - 0.12 * Math.sin(u * Math.PI) * 0.4]); }
      const outl = pts.concat(pts.slice(1, -1).reverse().map(([x, y], k) => [x, -0.16 * (1 - Math.pow(x / len, 2)) - 0.02])); outl.push([0.35, -0.1]);
      B.prism(outl, -0.06, 0.06, M_BLADE, { b: 0.03 }); out[nm + L] = B.done(); }
    /* the plate it holds (a per-frame grid: e across 0..1, a its height 0..1, + 2 on its back) and the wings (e s along the span, a q along the chord) */
    out['plate' + L] = Y.mkGrid(C.sp * 3, 9, (i, j) => [i / (C.sp * 3), j <= 4 ? j / 4 : 2 + (9 - j) / 4], M_HULL + 0.4);
    { const NWv = C.wv, NWu = C.wu; for (const sd of [-1, 1]) out['wing' + (sd > 0 ? 'L' : 'R') + L] = Y.mkGrid(NWu, NWv, () => [0, 0], M_FUNG + 0.4); }
    for (const sd of [-1, 1]) out['spar' + (sd > 0 ? 'L' : 'R') + L] = Y.mkGrid(14, 7, (i, j) => [j / 7, i / 14], M_FUNG + 0.8);
    Object.assign(G.MESH, out);
    // the wings' outline (the 2D's WG, a closed smooth curve) and the fan's points in (s, q)
    const WG = R0.WG, nW = WG.length, cat = v => { const f = v * nW, k = Math.floor(f) % nW, t = f - Math.floor(f), a = WG[k], b = WG[(k + 1) % nW], p0 = WG[(k - 1 + nW) % nW], p3 = WG[(k + 2) % nW], t2 = t * t, t3 = t2 * t;
      return [0, 1].map(i => 0.5 * (2 * a[i] + (-p0[i] + b[i]) * t + (2 * p0[i] - 5 * a[i] + 4 * b[i] - p3[i]) * t2 + (-p0[i] + 3 * a[i] - 3 * b[i] + p3[i]) * t3)); };
    const WS = new Float32Array((C.wu + 1) * (C.wv + 1)), WQ = new Float32Array(WS.length), WR = new Float32Array(WS.length), c0 = [0.06, 0.32];
    for (let j = 0; j <= C.wv; j++) { const e = cat(j / C.wv); for (let i = 0; i <= C.wu; i++) { const r = Math.pow(i / C.wu, 0.85), o = j * (C.wu + 1) + i; WS[o] = c0[0] + (e[0] - c0[0]) * r; WQ[o] = c0[1] + (e[1] - c0[1]) * r; WR[o] = i / C.wu; } }
    for (const sd of [-1, 1]) { const Mw = G.MESH['wing' + (sd > 0 ? 'L' : 'R') + L]; for (let o = 0; o < WS.length; o++) { Mw.att[o * 3 + 1] = WS[o]; Mw.att[o * 3 + 2] = WQ[o]; } }
    SETS[L] = { C, WS, WQ, WR, ms: nowMs() - t0 }; return SETS[L]; }

  /* ---------- posing: everything in the fight's world, relative to its point (ox, oy) ---------- */
  const lerp3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
  const rotY = th => { const c = Math.cos(th), s = Math.sin(th); return M3([c, 0, -s], [0, 1, 0], [s, 0, c]); };
  // a frame with x along a yaw th tipped down by a pitch pt (z as near up as it can be)
  const yawPitch = (th, pt) => { const x = [Math.cos(th) * Math.cos(pt), Math.sin(th) * Math.cos(pt), -Math.sin(pt)]; return Y.along(x, [0, 0, 1]); };
  function pose(FX, m, M, o) { const R0 = RIG(), L = Y.lod(), S = set(L), C = S.C, ME = G.MESH, ox = m.x, oy = m.y, rel = p => [p[0] - ox, p[1] - oy, p[2]], P = R0.pose(m, M), W = P.W, bt = M.bt || 0, sk = M.stagK || 0, alt = P.alt, halo = [], items = [];
    if (!M.feet) R0.landFeet(m, M);
    const Rb = A.frameOf(W, 1), rc = M.recoil || 0, fl2 = o.flash ? 1 : 0, dead = o.dead || 0, glowK = M.glowK || 0, puls = 0.5 + 0.5 * Math.sin(bt * 3.1), seamA = 0.5 + 0.25 * puls + glowK * 0.4 + sk * 0.3 * Math.abs(Math.sin(bt * 17));
    // ---- the shell
    items.push({ mesh: ME['shell' + L], R: Rb, o: rel(W(-rc * 0.1, 0, 0)), glow: seamA, spill: sk, kind: glowK, glow2: fl2, fx: dead, wear: 0.4 });
    // ---- the legs: shoulder, a high knee, the ankle, the foot (as the 2D's drawLeg), one swept tube each; knobs, cuffs, spurs
    const KN = ME['knob' + L], CU = ME['cuff' + L], SPU = ME['spur' + L]; let nk = 0;
    for (let i = 0; i < 6; i++) { const j = i % 3, sd = i < 3 ? 1 : -1, Sh = W(R0.LEG_U[j], sd * 2.0, 1.15), Fo = M.feet[i], dx = Fo[0] - Sh[0], dy = Fo[1] - Sh[1], crouch = Math.min(0, alt);
      const Kn = [Sh[0] + dx * 0.38, Sh[1] + dy * 0.38, Math.max(Sh[2], Fo[2]) + 0.95 + sk * 0.25 - crouch * 0.5], An = [Sh[0] + dx * 0.78, Sh[1] + dy * 0.78, Fo[2] + 0.95 + sk * 0.1 - crouch * 0.2];
      const s0 = rel(Sh), k0 = rel(Kn), a0 = rel(An), f0 = rel(Fo), pts = [s0, lerp3(s0, k0, 0.5), k0, lerp3(k0, a0, 0.5), a0, lerp3(a0, f0, 0.55), f0];
      pts[1][2] += 0.12; pts[3][2] += 0.05;
      Y.sweep(ME['leg' + i + L], pts, u => { const s = u * 3, w = s < 1 ? lerp(0.27, 0.22, s) : s < 2 ? lerp(0.22, 0.17, s - 1) : lerp(0.17, 0.02, Math.pow(s - 2, 1.4)); return w + 0.05 * Math.exp(-(((s - 1) / 0.09) ** 2)) + 0.04 * Math.exp(-(((s - 2) / 0.09) ** 2)) - 0.015 * Math.exp(-((((s % 1) - 0.5) / 0.04) ** 2)); });
      items.push({ mesh: ME['leg' + i + L], glow2: fl2, fx: dead, wear: 0.1 + i * 0.13 });
      K.place(KN, nk++, Rb, k0, [0.27, 0.25, 0.25]); K.place(KN, nk++, Rb, a0, [0.21, 0.19, 0.19]);
      const c0 = lerp3(s0, k0, 0.28), c1 = lerp3(s0, k0, 0.66), cd = vsub(c1, c0); K.place(CU, i, Y.along(cd), c0, [vlen(cd), 0.3, 0.3]);
      for (const [p, q2, L0, sp] of [[k0, a0, 0.42, 0], [a0, f0, 0.3, 1]]) { const d = vnrm(vsub(q2, p)), up = vnrm(vadd([0, 0, 1], vmul(d, -d[2]))), dir = vnrm(vadd(vmul(up, 1), vmul(d, -0.45))); K.place(SPU, i * 2 + sp, Y.along(dir), vadd(p, vmul(up, 0.12)), [L0, 0.09, 0.09]); } }
    // ---- the claws
    const hsh0 = rel(P.hamSh), hel = rel(P.hamEl), hm = rel(P.ham), th = P.hamDir, ax = [Math.cos(th), Math.sin(th), 0], wrH = [hm[0] - ax[0] * 0.95, hm[1] - ax[1] * 0.95, hm[2] + 0.1];
    Y.sweep(ME['armH' + L], [hsh0, lerp3(hsh0, hel, 0.5), hel, lerp3(hel, wrH, 0.5), wrH], u => { const s = u * 2; return (s < 1 ? lerp(0.31, 0.26, s) : lerp(0.26, 0.29, s - 1)) - 0.02 * Math.exp(-(((((s * 2) % 1) - 0.5) / 0.05) ** 2)); });
    items.push({ mesh: ME['armH' + L], glow2: fl2, fx: dead, wear: 0.83 }); K.place(KN, nk++, Rb, hel, [0.36, 0.33, 0.33]);
    const Rh = rotZ(th), op = cl(M.hamOpen == null ? 0.25 : M.hamOpen);
    items.push({ mesh: ME['palmH' + L], R: Rh, o: hm, glow: seamA, glow2: fl2, fx: dead, wear: 0.62 });
    items.push({ mesh: ME['fingF' + L], R: Rh, o: hm, glow2: fl2, fx: dead, wear: 0.3 });
    { const a1 = Math.atan2(-0.32 + op * 0.65, 1.23), a0 = Math.atan2(-0.32 + 0.25 * 0.65, 1.23), hinge = vadd(hm, vadd(vmul(ax, 0.55), [0, 0, 0.5])); items.push({ mesh: ME['fingH' + L], R: Y.mm3(Rh, rotY(-(a1 - a0))), o: hinge, glow2: fl2, fx: dead, wear: 0.7 }); }
    const ssh = rel(P.shSh), sel = rel(P.shEl), swr = rel(P.wr), sa = P.sa, so = P.so;
    Y.sweep(ME['armS' + L], [ssh, lerp3(ssh, sel, 0.5), sel, lerp3(sel, swr, 0.5), swr], u => { const s = u * 2; return (s < 1 ? lerp(0.23, 0.2, s) : lerp(0.2, 0.19, s - 1)) - 0.015 * Math.exp(-(((((s * 2) % 1) - 0.5) / 0.05) ** 2)); });
    items.push({ mesh: ME['armS' + L], glow2: fl2, fx: dead, wear: 0.55 }); K.place(KN, nk++, Rb, sel, [0.28, 0.25, 0.25]);
    items.push({ mesh: ME['palmS' + L], R: rotZ(sa), o: vadd(swr, [Math.cos(sa) * 0.15, Math.sin(sa) * 0.15, 0]), glow: seamA, glow2: fl2, fx: dead, wear: 0.21 });
    for (const [nm, da, dz, len, up] of [['bladeL', -so * 0.35, -0.05, 2.45, -1], ['bladeU', so * 0.55, 0.15 + so * 0.4, 2.3, 1]]) { const a = sa + da, z1 = Math.max(0.1, swr[2] - 0.35 + dz), pt = Math.atan2(swr[2] - z1, len), Rbl = yawPitch(a, pt), Rf = up > 0 ? Rbl : M3(Rbl.x, vmul(Rbl.y, -1), vmul(Rbl.z, -1));
      items.push({ mesh: ME[nm + L], R: Rf, o: swr, glow: 0.6 + 0.3 * Math.sin(bt * 6), glow2: fl2, fx: dead, wear: up > 0 ? 0.4 : 0.8 }); }
    // ---- the head: the brain-lobe, its mandibles, palps and eye-stalks, the eyes
    const pk = P.pk, hd0 = rel(P.head), rr = M.rear || 0, hueK = ((bt / 2.4) % 3 + 3) % 3, mo = M.mouth || 0, jaw = 0.18 + 0.12 * Math.sin(bt * 3.3) + mo * 0.35;
    items.push({ mesh: ME['brain' + L], R: Rb, o: hd0, sc: [pk, pk, pk], glow: 0.55 + 0.25 * Math.sin(bt * 2.4) + (M.pulse || 0) * 0.4 + sk * 0.4, kind: hueK, spill: sk > 0.3 ? sk * (Math.sin(bt * 20) > 0 ? 1 : 0.4) : glowK * 0.6, glow2: fl2, fx: dead, wear: 0.5 });
    const SC = ME['segC' + L], SP = ME['segP' + L], LS = ME['lens' + L]; let nc = 0, np = 0;
    for (const s of [-1, 1]) { const a = rel(W(2.1, s * 0.34, 1.2 + rr * 0.6)), b = rel(W(2.6, s * (0.24 + jaw * 0.5), 0.92 + rr * 0.55)), e = rel(W(2.72, s * (0.06 + jaw * 0.2), 0.72 + rr * 0.5)); Y.seg(SC, nc++, a, b, 0.12); Y.seg(SC, nc++, b, e, 0.085);
      const p0 = rel(W(2.15, s * 0.66, 1.3)), p1 = rel(W(2.6, s * 0.92, 0.95 + Math.sin(bt * 4 + s) * 0.12)), pm = vadd(lerp3(p0, p1, 0.5), [0, 0, 0.08]); Y.seg(SP, np++, p0, pm, 0.06); Y.seg(SP, np++, pm, p1, 0.045);
      const lk = Math.sin(bt * 0.9 + s * 1.3) * 0.15, b0 = rel(W(2.0, s * 0.7, 1.6 + rr * 0.7 - sk * 0.3)), b1 = rel(W(2.2 + lk, s * (1.22 + lk * 0.4), 2.5 + rr * 0.8 - sk * 0.7)), bm = lerp3(b0, b1, 0.5); Y.seg(SC, nc++, b0, bm, 0.085); Y.seg(SC, nc++, bm, b1, 0.07);
      // the stalk's eye, gazing at the pet (local x its gaze)
      const me = FX.me, gz = me ? vnrm([me.x - ox - b1[0], me.y - oy - b1[1], 0.6 - b1[2]]) : Rb.x; K.place(LS, s > 0 ? 0 : 1, Y.along(vadd(vmul(gz, 0.7), vmul(Rb.x, 0.3))), b1, [0.21, 0.19, 0.19]); halo.push([0, b1, 0.55, TEAL, 0.7]); }
    { let k = 2; for (const [u, v, hh] of [[2.5, 0.2, 1.3], [2.45, 0.42, 1.38]]) for (const s of [-1, 1]) { const p = rel(W(u, s * v, hh + rr * 0.65 - sk * 0.25)); K.place(LS, k++, Rb, p, [0.085, 0.085, 0.085]); halo.push([0, p, 0.3, TEAL, 0.65]); } }
    { const hq = vadd(swr, [Math.cos(sa) * 0.45, Math.sin(sa) * 0.45, 0.2]); K.place(LS, 6, Rb, hq, [0.08, 0.08, 0.08]); halo.push([0, hq, 0.42, VIOLET, 0.8]);
      const mq = rel(P.mouth); if (mo > 0.05) { K.place(LS, 7, Rb, mq, [0.24, 0.24, 0.1 + 0.12 * mo]); halo.push([0, mq, 0.9, SLAG, Math.min(1, mo)]); } else K.hide(LS, 7); }
    for (; nk < 14; nk++) K.hide(KN, nk);
    for (const M2 of [KN, CU, SPU, SC, SP, LS]) K.commit(M2);
    items.push({ mesh: KN, glow2: fl2, fx: dead, wear: 0.15, outline: false }, { mesh: CU, glow: seamA, glow2: fl2, fx: dead, wear: 0.48 }, { mesh: SPU, glow2: fl2, fx: dead, wear: 0.9 }, { mesh: SC, glow2: fl2, fx: dead, wear: 0.33 }, { mesh: SP, glow2: fl2, fx: dead, wear: 0.71 },
      { mesh: LS, glow: 1 + sk * 0.6, spill: mo, kind: sk > 0.5 ? 1 : 0, glow2: fl2, fx: dead, outline: false });
    // ---- the plate: a torn hull plate risen out of the deck, held before it (front and back faces, its top edge closing them)
    if (P.sh > 0.02) { const Mp = ME['plate' + L], nu = Mp.nu, PP = Mp.pos, UP = P.UP, h0 = P.h0, Rr = Y.rng(17), jag = []; for (let i = 0; i <= nu; i++) { const f = i / nu * 7; jag.push((Math.floor(f) % 2 ? -0.22 : 0.12) * (f > 0.5 && f < 6.5 ? 1 : 0.3) + (Rr() - 0.5) * 0.12 + 0.05 * Math.sin(i * 2.7)); }
      let any = false; for (let j = 0; j <= 9; j++) for (let i = 0; i <= nu; i++) { const v = -1.5 + i / nu * 3.05, bow = 0.22 * (1 - (v / 1.55) ** 2), front = j <= 4, hh = front ? j / 4 : (9 - j) / 4, top = h0 + 2.45 + jag[i], z = Math.max(0, lerp(h0, top, hh)), uu = UP + bow - 0.25 * hh - (front ? 0 : 0.09), w = rel(W(uu, v, z)), o3 = (j * (nu + 1) + i) * 3;
          PP[o3] = w[0]; PP[o3 + 1] = w[1]; PP[o3 + 2] = w[2]; if (z > 0.02) any = true; }
      if (any) { Y.gridNormals(Mp, false); items.push({ mesh: Mp, glow: 0.7 + 0.3 * Math.sin(bt * 9), spill: M.clang || 0, glow2: fl2, fx: dead, al: Math.min(1, P.sh * 1.5), wear: 0.66 }); } }
    // ---- the wings: folded flat on the back, or spread and beating (as the 2D's drawWing)
    const wk = ss(1 - Math.pow(1 - (M.wingK || 0), 3)), beat = M.wingBeat || 0, fa = M.flapAmp || 0;
    for (const sd of [-1, 1]) { const nm = sd > 0 ? 'L' : 'R', Mw = ME['wing' + nm + L], PW = Mw.pos, root = rel(W(-0.15, sd * 0.4, R0.RIM + R0.DZ * 0.95)), tipF = rel(W(-1.55, sd * 1.05, R0.RIM + R0.DZ * 0.5)), tipO = rel(W(-0.85, sd * 4.2, R0.RIM + 2.5 + Math.sin(beat) * 1.3 * fa)), tip = lerp3(tipF, tipO, wk);
      const o0 = W(0, 0, 0), cF = W(0.25, sd * 1.15, -0.05), cO = W(-1.6, 0, -0.35 + Math.sin(beat - 0.6) * 0.3 * fa), chord = lerp3(vsub(cF, o0), vsub(cO, o0), wk), span = vsub(tip, root), nrm = vnrm(vcross(span, chord)), Lw = vlen(span), bil = (0.06 + 0.1 * wk) * (1 + 0.6 * fa * Math.sin(beat - 1.2));
      const WS = S.WS, WQ = S.WQ, WR = S.WR; for (let o = 0; o < WS.length; o++) { const s = WS[o], qq = WQ[o], tp = 1 - 0.35 * s, b = bil * Math.sin(Math.PI * WR[o]) * Lw * 0.25 + (wk < 0.4 ? 0.03 * (1 - wk) : 0), o3 = o * 3;
        PW[o3] = root[0] + span[0] * s + chord[0] * qq * tp + nrm[0] * b; PW[o3 + 1] = root[1] + span[1] * s + chord[1] * qq * tp + nrm[1] * b; PW[o3 + 2] = root[2] + span[2] * s + chord[2] * qq * tp + nrm[2] * b + (wk < 0.4 ? 0.06 : 0); }
      Y.gridNormals(Mw, false); items.push({ mesh: Mw, glow: 0.45 + 0.2 * Math.sin(bt * 3 + sd), spill: wk, glow2: fl2, fx: dead, al: 0.9, wear: sd > 0 ? 0.3 : 0.7, outline: false });
      const sp = [0, 0.2, 0.45, 0.7, 0.95].map(s => { const tp = 1 - 0.35 * s; return vadd(vadd(root, vmul(span, s)), vmul(chord, -0.03 * tp)); }); Y.sweep(ME['spar' + nm + L], sp, u => 0.09 - u * 0.06); items.push({ mesh: ME['spar' + nm + L], glow2: fl2, fx: dead, wear: 0.5 });
      if (wk > 0.3) { const cq = vadd(vadd(root, vmul(span, 0.5)), vmul(chord, 0.4)); halo.push([0, cq, Lw * 0.55, FUNGUS, 0.1 + wk * 0.1]); for (const [s, qq] of [[0.45, 0.3], [0.7, 0.45], [0.3, 0.7]]) { const p = vadd(vadd(root, vmul(span, s)), vmul(chord, qq * (1 - 0.35 * s))); halo.push([0, p, 0.35, TEAL_HI, (0.35 + 0.15 * Math.sin(bt * 3 + sd)) * wk]); } } }
    // ---- the glows: the brain's inner light (its hue), the seams' violet pooled on the deck, the corona, the stagger's current
    const hueCol = [TEAL, VIOLET, AMBER][Math.floor(hueK) % 3]; halo.push([0, hd0, 1.9, sk > 0.3 ? TEAL_HI : glowK > 0.3 ? VIOLET_HI : hueCol, 0.28 + 0.12 * Math.sin(bt * 2.4) + (M.pulse || 0) * 0.25 + sk * 0.25]);
    const dome = rel(P.dome), gnd = rel([P.B.x, P.B.y, 0]); halo.push([0, gnd, 3.6, VIOLET, (0.1 + 0.06 * Math.sin(bt * 2) + glowK * 0.25) / (1 + Math.max(0, alt) * 0.3)]);
    if (glowK > 0.02) { const q2 = vadd(dome, [0, 0, 0.8]); halo.push([0, q2, 4.2, VIOLET, glowK * (0.4 + 0.15 * Math.sin(bt * 13))], [0, q2, 2.4, VIOLET_HI, glowK * (0.3 + 0.12 * Math.sin(bt * 9))]);
      const Rr = Y.rng(Math.floor(bt * 12) + 1); for (let k = 0; k < 5; k++) { const a = Rr() * TAU, p0 = vadd(q2, [Math.cos(a) * 2.4, Math.sin(a) * 1.6, Rr() * 0.6]), p1 = vadd(p0, [(Rr() - 0.5) * 2, (Rr() - 0.5) * 1.4, 0.4 + Rr()]); halo.push([2, p0, p1, 0.09, VIOLET_HI, 0.9 * glowK, k + Math.floor(bt * 12)]); } }
    if (sk > 0.3) { const Rr = Y.rng(Math.floor(bt * 14) + 3); for (let k = 0; k < 3; k++) { const a = Rr() * TAU, p0 = vadd(dome, [Math.cos(a) * 1.4, Math.sin(a) * 2.0, 0.6]), p1 = vadd(p0, [(Rr() - 0.5) * 1.6, (Rr() - 0.5) * 1.6, (Rr() - 0.5) * 0.4]); halo.push([2, p0, p1, 0.08, TEAL_HI, 0.85 * sk, k * 7 + Math.floor(bt * 14)]); } }
    // ---- the occluders: the dome, the belly, the head
    const occ = [vadd(rel(W(0, 0, R0.RIM)), [0, 0, -0.2]).concat([1.35]), rel(W(0.1, 0, R0.RIM - 0.35)).concat([1.5]), hd0.concat([0.7 * pk])];
    INFO.lod = L; return { items, halo, occ }; }

  /* ---------- drawing: the fight's draw, the previews ---------- */
  function draw(c, FX, m, X, Y0, T, t) { if (!gpu()) return false; const M = FX.mem; if (!M) return false; let R;
    try { const t0 = nowMs(); R = pose(FX, m, M, { flash: m.flash > 0, dead: 0 }); INFO.poseMs = +(INFO.poseMs * 0.9 + (nowMs() - t0) * 0.1).toFixed(2); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Khaal: pose', e); return false; }
    const F = A.fg(), alt = M.alt || 0, k = 1 / (1 + Math.max(0, alt) * 0.12);
    // its shadow on the deck
    if (FX.K && FX.K.shade) { const P = RIG().pose(m, M), gx = X + (P.B.x - m.x) * T, gy = Y0 + (P.B.y - m.y) * T + T * 0.15; FX.K.shade(c, gx, gy, T * 3.6 * k, T * 1.6 * k, 0.5 * k, '#06040C'); }
    let ok = false; try { ok = Y.pass(c, X, Y0, T, R.items, { light: 'breach', t: M.bt || t, flash: m.flash > 0 ? 1 : 0, occ: R.occ }, G, INFO); } catch (e) { G.fail(); if (typeof console !== 'undefined') console.warn('Khaal: draw', e); }
    if (!ok) return false;
    if (F) { const Q = F.begin(c, null); try { Y.halos(Q, R.halo, X, Y0, T, 1); } finally { F.flush(c); } } return true; }

  /* ---------- its light on the deck and in the air ---------- */
  function init(FX) { if (!gpu()) return; A.wrapFX(FX); if (FX.__ybHz) return; FX.__ybHz = 1; const h0 = FX.hz;
    FX.hz = q2 => { const z = h0(q2); if (z && z.shape === 'line' && z.draw) { const d0 = z.draw; z.draw = (c, z2, F2, T, t) => { if (!slagGL(c, z2, F2, T, t)) d0(c, z2, F2, T, t); }; } return z; }; }
  // a lane of molten slag: glowing blobs crusting over as it cools (605)
  function slagGL(c, z, FX, T, t) { const F = A.fg(); if (!F) return false; const fade = Math.min(1, z.age / 0.15, Math.max(0, z.life - z.age) / 0.8); if (fade <= 0) return true; const ca = Math.cos(z.a), sa = Math.sin(z.a), hl = z.len / 2 * T, hw = z.w / 2 * T * 1.3, Q = F.begin(c, null);
    try { Q.quad(605, FX.sx(z.x + ca * z.len / 2), FX.sy(z.y + sa * z.len / 2), ca * hl, sa * hl, -sa * hw, ca * hw, SLAG, fade, cl(z.age / z.life), (z.seed || 7) % 97, z.len / z.w); } finally { F.flush(c); } return true; }
  /* the deck's light: the rim's crackling, the slam craters' heat, the guarded arc, the warnings; the 2D overlay keeps the holes, the
     dropped plates, the cells' rings and the labels (M.ybGL tells it what is drawn here) */
  function overlay(c, FX, t, T) { const M = FX.mem, m = FX.m, R0 = RIG(); if (!M || !M.slots || !R0) return false; const F = A.fg();
    if (!F || !G.on()) { M.ybGL = false; Y.marked(c, FX, t, T, null); return false; }
    M.ybGL = true; const Q = F.begin(c, null), sx = FX.sx, sy = FX.sy, C = FX.C;
    try {
      const Rr = Y.rng(Math.floor(t * 5) + 11); for (let k = 0; k < 3; k++) { const a = Rr() * TAU, a2 = a + (Rr() < 0.5 ? 1 : -1) * (0.2 + Rr() * 0.2), r1 = R0.AR + 0.3 + Rr() * 0.6, r2 = R0.AR + 0.2 + Rr() * 0.9; Y.bolt(Q, sx(C.x + Math.cos(a) * r1), sy(C.y + Math.sin(a) * r1), sx(C.x + Math.cos(a2) * r2), sy(C.y + Math.sin(a2) * r2), T * 0.07, VIOLET_HI, 0.5 + 0.4 * Rr(), k + Math.floor(t * 5) * 3); }
      for (const kq of M.craters) { const a = cl((3 - kq.t) / 1.5); Q.quad(606, sx(kq.x), sy(kq.y), T * 2.6, 0, 0, T * 1.7, AMBER, a, kq.t / 3, kq.seed % 97, 0); }
      if (m && !m.dead && (M.shieldK || 0) > 0.3 && !(m.stunT > 0) && (M.alt || 0) < 1) { const X = sx(m.x), Yy = sy(m.y), r1 = (m.r + 1.4) * T; Q.quad(608, X, Yy, r1, 0, 0, r1, VIOLET_HI, M.shieldK, ((M.hd % TAU) + TAU) % TAU, R0.SHIELD_ARC, (m.r + 0.5) / (m.r + 1.4) + Math.min(0.99, M.clang || 0) * 10); }
      for (const s of FX.S.tele) if (s.aur) Y.tell(Q, FX, s, T, t, s.col === AMBER || s.col === '#FFB23F' ? 0 : 1);
    } finally { F.flush(c); }
    return false; }
  /* the light in the air: the slag's globs in flight, the cells' lightning (the meter and the labels stay 2D) */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m; if (!m || !M.slots || !M.ybGL) return false; const F = A.fg(); if (!F) return false; const sx = FX.sx, sy = FX.sy, Q = F.begin(c, null);
    try {
      for (const gb of M.globs) { if (gb.t < 0) continue; const u = cl(gb.t / gb.d), d = gb.len * u, x = gb.x0 + Math.cos(gb.a) * d, y = gb.y0 + Math.sin(gb.a) * d, z = 1.4 + Math.sin(u * Math.PI) * 2.2 - u * 1.4, X = sx(x), Yy = sy(y) - z * T, vx = Math.cos(gb.a) * T * 0.5, vy = Math.sin(gb.a) * T * 0.5 - Math.cos(u * Math.PI) * T * 0.9;
        Q.glow(X, Yy, T * 0.75, SLAG, 0.75); Q.rbeam(X - vx, Yy - vy, X, Yy, T * 0.16, SLAG_HI, 0.6, 0, 1); Q.glow(X, Yy, T * 0.24, SLAG_HI, 1); Q.glow(X, Yy, T * 0.1, WHITE, 0.9); }
      for (const z of M.zaps) { const a = 1 - z.t / z.life, P = z.pts, A0 = P[0], B0 = P[P.length - 1], x0 = sx(A0[0]), y0 = sy(A0[1]) - A0[2] * T, x1 = sx(B0[0]), y1 = sy(B0[1]) - B0[2] * T, sd = (z.sd || (z.sd = 1 + Math.floor(Math.random() * 90)));
        Y.bolt(Q, x0, y0, x1, y1, T * 0.1, VIOLET_HI, a, sd); Q.glow(x0, y0, T * 0.6, VIOLET, 0.6 * a); Q.glow(x1, y1, T * 0.5, VIOLET_HI, 0.6 * a); }
    } finally { F.flush(c); }
    return true; }
  function preload(P) { if (!P || !P.gl) return []; return [() => { if (G.on() && RIG()) set(Y.lod()); }]; }
  function info() { const tr = L => { if (!SETS[L] || !G.MESH) return null; let n = 0; for (const k in G.MESH) if (k.endsWith(String(L)) && G.MESH[k]) n += G.MESH[k].ntri; return n; }; return Object.assign({}, INFO, { trisFull: tr(0), trisLod: tr(1), buildMs: [SETS[0] && Math.round(SETS[0].ms), SETS[1] && Math.round(SETS[1].ms)] }); }
  const rotZ = Y.rotZ;
  return { G, gpu, draw, overlay, drawFx, init, preload, info, get kit() { return A; }, get y3() { return Y; } };
})();
