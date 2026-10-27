/* ---------- a small rigid-body engine (boxes and circles) for Sling Pop ----------
   Sequential impulses with warm starting and box clipping, after the classic "Box2D Lite" design. y points down. */
const Phys = (() => {
  let uid = 0;
  function Body(o) {
    const b = Object.assign({ shape: 'box', x: 0, y: 0, a: 0, vx: 0, vy: 0, av: 0, w: 20, h: 20, r: 10, density: 1, fr: 0.6, re: 0.05, isStatic: false, sleep: false, sleepT: 0, data: null }, o);
    b.id = ++uid;
    const area = b.shape === 'circle' ? Math.PI * b.r * b.r : b.w * b.h;
    b.mass = b.isStatic ? Infinity : area * b.density * 0.001;
    b.invMass = b.isStatic ? 0 : 1 / b.mass;
    const I = b.shape === 'circle' ? 0.5 * b.mass * b.r * b.r : b.mass * (b.w * b.w + b.h * b.h) / 12;
    b.invI = b.isStatic ? 0 : 1 / I;
    b.hx = b.w / 2; b.hy = b.h / 2;
    b.bound = b.shape === 'circle' ? b.r : Math.hypot(b.hx, b.hy);
    return b;
  }
  const NONE = 0;
  // incident edge of box (h, pos, rot) most anti-parallel to normal
  function incidentEdge(hx, hy, px, py, c, s, nx, ny) {
    const lnx = -(c * nx + s * ny), lny = -(-s * nx + c * ny);
    let v;
    if (Math.abs(lnx) > Math.abs(lny)) {
      v = lnx > 0 ? [[hx, -hy, 3, 4], [hx, hy, 4, 1]] : [[-hx, hy, 1, 2], [-hx, -hy, 2, 3]];
    } else {
      v = lny > 0 ? [[hx, hy, 4, 1], [-hx, hy, 1, 2]] : [[-hx, -hy, 2, 3], [hx, -hy, 3, 4]];
    }
    return v.map(([x, y, i2, o2]) => ({ x: px + c * x - s * y, y: py + s * x + c * y, in1: NONE, out1: NONE, in2: i2, out2: o2 }));
  }
  function clip(vIn, nx, ny, off, edge) {
    const out = [];
    const d0 = nx * vIn[0].x + ny * vIn[0].y - off, d1 = nx * vIn[1].x + ny * vIn[1].y - off;
    if (d0 <= 0) out.push(vIn[0]);
    if (d1 <= 0) out.push(vIn[1]);
    if (d0 * d1 < 0) {
      const t = d0 / (d0 - d1);
      const p = { x: vIn[0].x + t * (vIn[1].x - vIn[0].x), y: vIn[0].y + t * (vIn[1].y - vIn[0].y) };
      if (d0 > 0) Object.assign(p, { in1: edge, out1: vIn[0].out1, in2: NONE, out2: vIn[0].out2 });
      else Object.assign(p, { in1: vIn[1].in1, out1: edge, in2: vIn[1].in2, out2: NONE });
      out.push(p);
    }
    return out;
  }
  function boxBox(A, B) {
    const cA = Math.cos(A.a), sA = Math.sin(A.a), cB = Math.cos(B.a), sB = Math.sin(B.a);
    const dpx = B.x - A.x, dpy = B.y - A.y;
    const dAx = cA * dpx + sA * dpy, dAy = -sA * dpx + cA * dpy;
    const dBx = cB * dpx + sB * dpy, dBy = -sB * dpx + cB * dpy;
    // C = RotA^T RotB
    const c11 = cA * cB + sA * sB, c12 = -cA * sB + sA * cB, c21 = -sA * cB + cA * sB, c22 = sA * sB + cA * cB;
    const a11 = Math.abs(c11), a12 = Math.abs(c12), a21 = Math.abs(c21), a22 = Math.abs(c22);
    const faX = Math.abs(dAx) - A.hx - (a11 * B.hx + a12 * B.hy), faY = Math.abs(dAy) - A.hy - (a21 * B.hx + a22 * B.hy);
    if (faX > 0 || faY > 0) return null;
    const fbX = Math.abs(dBx) - (a11 * A.hx + a21 * A.hy) - B.hx, fbY = Math.abs(dBy) - (a12 * A.hx + a22 * A.hy) - B.hy;
    if (fbX > 0 || fbY > 0) return null;
    const rel = 0.95, abs = 0.01;
    let axis = 1, sep = faX, nx = dAx > 0 ? cA : -cA, ny = dAx > 0 ? sA : -sA;
    if (faY > rel * sep + abs * A.hy) { axis = 2; sep = faY; nx = dAy > 0 ? -sA : sA; ny = dAy > 0 ? cA : -cA; }
    if (fbX > rel * sep + abs * B.hx) { axis = 3; sep = fbX; nx = dBx > 0 ? cB : -cB; ny = dBx > 0 ? sB : -sB; }
    if (fbY > rel * sep + abs * B.hy) { axis = 4; sep = fbY; nx = dBy > 0 ? -sB : sB; ny = dBy > 0 ? cB : -cB; }
    let fnx, fny, front, snx, sny, side, negSide, posSide, negEdge, posEdge, inc;
    if (axis === 1) { fnx = nx; fny = ny; front = A.x * fnx + A.y * fny + A.hx; snx = -sA; sny = cA; side = A.x * snx + A.y * sny; negSide = -side + A.hy; posSide = side + A.hy; negEdge = 3; posEdge = 1; inc = incidentEdge(B.hx, B.hy, B.x, B.y, cB, sB, fnx, fny); }
    else if (axis === 2) { fnx = nx; fny = ny; front = A.x * fnx + A.y * fny + A.hy; snx = cA; sny = sA; side = A.x * snx + A.y * sny; negSide = -side + A.hx; posSide = side + A.hx; negEdge = 2; posEdge = 4; inc = incidentEdge(B.hx, B.hy, B.x, B.y, cB, sB, fnx, fny); }
    else if (axis === 3) { fnx = -nx; fny = -ny; front = B.x * fnx + B.y * fny + B.hx; snx = -sB; sny = cB; side = B.x * snx + B.y * sny; negSide = -side + B.hy; posSide = side + B.hy; negEdge = 3; posEdge = 1; inc = incidentEdge(A.hx, A.hy, A.x, A.y, cA, sA, fnx, fny); }
    else { fnx = -nx; fny = -ny; front = B.x * fnx + B.y * fny + B.hy; snx = cB; sny = sB; side = B.x * snx + B.y * sny; negSide = -side + B.hx; posSide = side + B.hx; negEdge = 2; posEdge = 4; inc = incidentEdge(A.hx, A.hy, A.x, A.y, cA, sA, fnx, fny); }
    let cp = clip(inc, -snx, -sny, negSide, negEdge);
    if (cp.length < 2) return null;
    cp = clip(cp, snx, sny, posSide, posEdge);
    if (cp.length < 2) return null;
    const out = [];
    for (const v of cp) {
      const s2 = fnx * v.x + fny * v.y - front;
      if (s2 <= 0) {
        let key = v.in1 * 1000 + v.out1 * 100 + v.in2 * 10 + v.out2;
        if (axis >= 3) key = v.in2 * 1000 + v.out2 * 100 + v.in1 * 10 + v.out1;
        out.push({ x: v.x - s2 * fnx, y: v.y - s2 * fny, nx, ny, sep: s2, key });
      }
    }
    return out.length ? out : null;
  }
  function boxCircle(Bx, C) {
    // normal from box to circle
    const c = Math.cos(Bx.a), s = Math.sin(Bx.a);
    const dx = C.x - Bx.x, dy = C.y - Bx.y;
    const lx = c * dx + s * dy, ly = -s * dx + c * dy;
    const qx = clamp(lx, -Bx.hx, Bx.hx), qy = clamp(ly, -Bx.hy, Bx.hy);
    let nlx, nly, sep;
    if (qx === lx && qy === ly) {
      const px = Bx.hx - Math.abs(lx), py = Bx.hy - Math.abs(ly);
      if (px < py) { nlx = Math.sign(lx) || 1; nly = 0; sep = -px - C.r; }
      else { nlx = 0; nly = Math.sign(ly) || 1; sep = -py - C.r; }
      const cpx = nlx ? nlx * Bx.hx : lx, cpy = nly ? nly * Bx.hy : ly;
      return [{ x: Bx.x + c * cpx - s * cpy, y: Bx.y + s * cpx + c * cpy, nx: c * nlx - s * nly, ny: s * nlx + c * nly, sep, key: 7 }];
    }
    const ex = lx - qx, ey = ly - qy, d = Math.hypot(ex, ey);
    if (d > C.r) return null;
    nlx = ex / d; nly = ey / d; sep = d - C.r;
    return [{ x: Bx.x + c * qx - s * qy, y: Bx.y + s * qx + c * qy, nx: c * nlx - s * nly, ny: s * nlx + c * nly, sep, key: 7 }];
  }
  function circleCircle(A, B) {
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    if (d > A.r + B.r) return null;
    const nx = d > 1e-6 ? dx / d : 0, ny = d > 1e-6 ? dy / d : 1;
    return [{ x: A.x + nx * A.r, y: A.y + ny * A.r, nx, ny, sep: d - A.r - B.r, key: 9 }];
  }
  function collide(A, B) {
    if (A.shape === 'box' && B.shape === 'box') return boxBox(A, B);
    if (A.shape === 'circle' && B.shape === 'circle') return circleCircle(A, B);
    if (A.shape === 'box') return boxCircle(A, B);
    const r = boxCircle(B, A);
    if (r) r.forEach(k => { k.nx = -k.nx; k.ny = -k.ny; });
    return r;
  }
  function World(o) {
    o = o || {};
    const W = { bodies: [], arbs: new Map(), g: o.gravity || 900, iters: o.iters || 12, onImpact: o.onImpact || null };
    W.add = b => { W.bodies.push(b); return b; };
    W.remove = b => { const i = W.bodies.indexOf(b); if (i >= 0) W.bodies.splice(i, 1); for (const k of W.arbs.keys()) if (k.startsWith(b.id + ':') || k.endsWith(':' + b.id)) W.arbs.delete(k); };
    W.wake = b => { b.sleep = false; b.sleepT = 0; };
    W.step = dt => {
      const bs = W.bodies, inv = 1 / dt;
      for (const b of bs) { if (!b.isStatic && !b.sleep) b.vy += W.g * dt; b._im = b.sleep ? 0 : b.invMass; b._ii = b.sleep ? 0 : b.invI; }
      // contacts
      const live = new Map();
      for (let i = 0; i < bs.length; i++) {
        const A = bs[i];
        for (let j = i + 1; j < bs.length; j++) {
          const B = bs[j];
          const key = A.id + ':' + B.id;
          if ((A.isStatic || A.sleep) && (B.isStatic || B.sleep)) { const keep = W.arbs.get(key); if (keep) { keep.fresh = false; live.set(key, keep); } continue; }
          if (Math.abs(A.x - B.x) > A.bound + B.bound || Math.abs(A.y - B.y) > A.bound + B.bound) continue;
          const cs = collide(A, B);
          if (!cs) continue;
          const old = W.arbs.get(key);
          const fresh = !old;
          for (const c of cs) {
            if (old) { const m = old.cs.find(o2 => o2.key === c.key); if (m) { c.Pn = m.Pn; c.Pt = m.Pt; } }
            c.Pn = c.Pn || 0; c.Pt = c.Pt || 0;
          }
          if (A.sleep && !B.isStatic && Math.hypot(B.vx, B.vy) > 25) W.wake(A);
          if (B.sleep && !A.isStatic && Math.hypot(A.vx, A.vy) > 25) W.wake(B);
          live.set(key, { A, B, cs, fresh, fr: Math.sqrt(A.fr * B.fr), re: Math.max(A.re, B.re) });
        }
      }
      // a body that lost a support wakes up and falls
      for (const [k, arb] of W.arbs) if (!live.has(k)) { if (!arb.A.isStatic) W.wake(arb.A); if (!arb.B.isStatic) W.wake(arb.B); }
      W.arbs = live;
      for (const b of bs) { b._im = b.sleep ? 0 : b.invMass; b._ii = b.sleep ? 0 : b.invI; }
      // pre-step
      for (const arb of live.values()) {
        const { A, B } = arb;
        arb.dead = A._im + B._im + A._ii + B._ii === 0;
        if (arb.dead) continue;
        let maxV = 0;
        for (const c of arb.cs) {
          const r1x = c.x - A.x, r1y = c.y - A.y, r2x = c.x - B.x, r2y = c.y - B.y;
          const rn1 = r1x * c.nx + r1y * c.ny, rn2 = r2x * c.nx + r2y * c.ny;
          c.mn = 1 / (A._im + B._im + A._ii * (r1x * r1x + r1y * r1y - rn1 * rn1) + B._ii * (r2x * r2x + r2y * r2y - rn2 * rn2));
          const tx = c.ny, ty = -c.nx;
          const rt1 = r1x * tx + r1y * ty, rt2 = r2x * tx + r2y * ty;
          c.mt = 1 / (A._im + B._im + A._ii * (r1x * r1x + r1y * r1y - rt1 * rt1) + B._ii * (r2x * r2x + r2y * r2y - rt2 * rt2));
          c.bias = -0.2 * inv * Math.min(0, c.sep + 0.6);
          const dvx = B.vx - B.av * r2y - A.vx + A.av * r1y, dvy = B.vy + B.av * r2x - A.vy - A.av * r1x;
          const vn = dvx * c.nx + dvy * c.ny;
          if (vn < -80) { c.bias = Math.max(c.bias, -arb.re * vn); }
          if (-vn > maxV) maxV = -vn;
          const Px = c.Pn * c.nx + c.Pt * tx, Py = c.Pn * c.ny + c.Pt * ty;
          A.vx -= A._im * Px; A.vy -= A._im * Py; A.av -= A._ii * (r1x * Py - r1y * Px);
          B.vx += B._im * Px; B.vy += B._im * Py; B.av += B._ii * (r2x * Py - r2y * Px);
        }
        arb.impact = arb.fresh ? maxV : 0;
      }
      // solve
      for (let it = 0; it < W.iters; it++) {
        for (const arb of live.values()) {
          if (arb.dead) continue;
          const { A, B } = arb;
          for (const c of arb.cs) {
            const r1x = c.x - A.x, r1y = c.y - A.y, r2x = c.x - B.x, r2y = c.y - B.y;
            let dvx = B.vx - B.av * r2y - A.vx + A.av * r1y, dvy = B.vy + B.av * r2x - A.vy - A.av * r1x;
            const vn = dvx * c.nx + dvy * c.ny;
            let dPn = c.mn * (-vn + c.bias);
            const Pn0 = c.Pn; c.Pn = Math.max(Pn0 + dPn, 0); dPn = c.Pn - Pn0;
            let Px = dPn * c.nx, Py = dPn * c.ny;
            A.vx -= A._im * Px; A.vy -= A._im * Py; A.av -= A._ii * (r1x * Py - r1y * Px);
            B.vx += B._im * Px; B.vy += B._im * Py; B.av += B._ii * (r2x * Py - r2y * Px);
            dvx = B.vx - B.av * r2y - A.vx + A.av * r1y; dvy = B.vy + B.av * r2x - A.vy - A.av * r1x;
            const tx = c.ny, ty = -c.nx;
            const vt = dvx * tx + dvy * ty;
            let dPt = c.mt * -vt;
            const maxPt = arb.fr * c.Pn, Pt0 = c.Pt;
            c.Pt = clamp(Pt0 + dPt, -maxPt, maxPt); dPt = c.Pt - Pt0;
            Px = dPt * tx; Py = dPt * ty;
            A.vx -= A._im * Px; A.vy -= A._im * Py; A.av -= A._ii * (r1x * Py - r1y * Px);
            B.vx += B._im * Px; B.vy += B._im * Py; B.av += B._ii * (r2x * Py - r2y * Px);
          }
        }
      }
      if (W.onImpact) for (const arb of live.values()) if (arb.impact > 60) W.onImpact(arb.A, arb.B, arb.impact);
      // integrate and sleep
      for (const b of bs) {
        if (b.isStatic || b.sleep) continue;
        b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.av * dt;
        b.vx *= 0.9995; b.vy *= 0.9995; b.av *= 0.995;
        if (Math.hypot(b.vx, b.vy) < 9 && Math.abs(b.av) < 0.1) { b.sleepT += dt; if (b.sleepT > 0.5) { b.sleep = true; b.vx = b.vy = b.av = 0; } }
        else b.sleepT = 0;
      }
    };
    return W;
  }
  return { Body, World };
})();
