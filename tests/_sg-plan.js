// v445 AG: a planner for the Amber Vigil (the tests' proof that every shard can be fetched and brought home unseen, with no
// chime rung). It plans on the gate's own pure rules (m.litAt: the watch-stones' gazes on their clock, cut by cover;
// m.threadHit: a taut ruby thread; m.blocked: the courtyard's walls and solid pieces; m.inSafe: the sanctuary) over a grid of
// half tiles and the stones' clock in steps of 0.15 s, at a walking pace of 3.4 tiles a second (the pet's own is 4.3), never
// once in a gaze (stricter than the game, which gives half a second's grace). Then drive() walks the pet along the plan by
// the stones' clock (teleported each frame, so a slow software GPU's frame rate does not matter) while the game judges it.
// plan(page, goal) -> { ok, steps, path: [[x, y]] (one point a step), t0, secs }; goal: { altar: 'W' | 'E' | 'S' } or { safe: true }
async function plan(page, goal) {
  return page.evaluate(goal => {
    const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, G = m.geo, me = D.me;
    const x0 = G.CH.x0, y0 = G.CH.y0, NX = (G.CH.x1 + 1 - x0) * 2, NY = (G.CH.y1 + 1 - y0) * 2, cx = i => x0 + (i + 0.5) * 0.5, cy = j => y0 + (j + 0.5) * 0.5, DT = 0.15, MAXK = 700;
    const rad = 0.36, free = new Uint8Array(NX * NY);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) { const x = cx(i), y = cy(j); free[j * NX + i] = [[0, 0], [rad, 0], [-rad, 0], [0, rad], [0, -rad], [rad * 0.7, rad * 0.7], [-rad * 0.7, rad * 0.7], [rad * 0.7, -rad * 0.7], [-rad * 0.7, -rad * 0.7]].every(([a, b]) => !m.blocked(x + a, y + b)) ? 1 : 0; }
    const t0 = m.R.sclk + 0.1, slow = m.R.slow;   // (the stones' clock runs at R.slow of the game's)
    const ok = goal.free ? () => true : (x, y, t) => m.inSafe(x, y) || (!m.litAt(x, y, t) && !m.threadHit(x, y, t));
    const A = goal.altar ? G.ALTARS.find(a => a.id === goal.altar) : null, isGoal = (x, y) => A ? Math.hypot(x - (A.tx + 0.5), y - (A.ty + 0.5)) < 1.3 : m.inSafe(x, y) && y > G.SAFE.y + 0.3;
    const si = Math.max(0, Math.min(NX - 1, Math.floor((me.x - x0) / 0.5))), sj = Math.max(0, Math.min(NY - 1, Math.floor((me.y - y0) / 0.5)));
    let front = new Map([[sj * NX + si, -1]]); const par = [front];
    for (let k = 1; k <= MAXK; k++) { const t = t0 + k * DT * slow, tm = t0 + (k - 0.5) * DT * slow, next = new Map();
      for (const [c] of front) { const i = c % NX, j = (c - i) / NX; for (const [di, dj] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + di, nj = j + dj; if (ni < 0 || nj < 0 || ni >= NX || nj >= NY) continue; const n = nj * NX + ni; if (next.has(n) || !free[n]) continue;
        const x = cx(ni), y = cy(nj), mx = (cx(i) + x) / 2, my = (cy(j) + y) / 2; if (!ok(x, y, t) || !ok(mx, my, tm)) continue; next.set(n, c); } }
      par.push(next); front = next; if (!front.size) return { ok: false, steps: k, why: 'trapped' };
      for (const [c] of front) { const i = c % NX, j = (c - i) / NX; if (isGoal(cx(i), cy(j))) { const path = []; let cur = c; for (let kk = k; kk >= 0; kk--) { const ii = cur % NX, jj = (cur - ii) / NX; path.push([cx(ii), cy(jj)]); cur = par[kk].get(cur); if (cur === -1 || cur == null) break; } path.reverse(); return { ok: true, steps: k, path, t0, dt: DT * slow, secs: k * DT }; } } }
    return { ok: false, steps: MAXK, why: 'too long' };
  }, goal);
}
// walk the pet along a plan by the stones' clock (the first point at t0); returns how it went
async function drive(page, P) {
  return page.evaluate(async P => {
    const D = window.__pp.arc.game._dbg, m = D.RIFT.self.mod, me = D.me, n0 = m.R.seenN, b0 = m.R.binds, r0 = performance.now();
    let maxMeter = 0;
    while (performance.now() - r0 < 240000) { const u = (m.R.sclk - P.t0) / P.dt; if (u >= P.path.length - 1) break; const k = Math.max(0, Math.floor(u)), f = Math.max(0, u - k), a = P.path[k], b = P.path[Math.min(P.path.length - 1, k + 1)];
      me.x = a[0] + (b[0] - a[0]) * f; me.y = a[1] + (b[1] - a[1]) * f; me.vx = me.vy = 0; me.hp = D.ST.hp; maxMeter = Math.max(maxMeter, m.R.meter); if (m.R.seenN > n0) break; await new Promise(r => requestAnimationFrame(r)); }
    const e = P.path[P.path.length - 1]; if (m.R.seenN === n0) { me.x = e[0]; me.y = e[1]; } for (let i = 0; i < 3; i++) await new Promise(r => requestAnimationFrame(r));
    return { seen: m.R.seenN - n0, binds: m.R.binds - b0, maxMeter: +maxMeter.toFixed(2), carry: m.R.carry ? m.R.carry.id : null, banked: m.R.banked.slice(), at: [+me.x.toFixed(2), +me.y.toFixed(2)] };
  }, P);
}
module.exports = { plan, drive };
