/* ---------- Rift 1, the Drowned Belfry: its floor traps (v394 B2) ----------
   Four original sea-and-bell traps for the Belfry's dungeons. Each one TELLS by itself only: its own glow and motion build
   from calm to bright to the burst (no red area circles, no countdown rings: the Caldera vents' rule), soft and glowing
   with no hard edges, so they read on the pale limestone floors as well as the dark ones. Learn them by watching:
     geyser   BRINE GEYSER    a round floor drain: the water in it swells, bubbles and whitens, then a column of brine
                              blasts up and throws the pet back
     toll     TOLL RING       a buried bronze bell plate: its engraved rings light one by one from the middle and it
                              hums and shivers, then a ring of force rolls out along the floor (it hits where it passes)
     riptide  RIPTIDE GRATE   a square sea grate: a whirl spins up in it and drags the pet toward it, then it sprays
     rod      LIGHTNING ROD   (the storm galleries) an iron rod on a stone foot: arcs crawl up it brighter and brighter
                              to the tip, then lightning strikes its spot
   A hit is 8% of the pet's health and a shove (as the Caldera vents); a dodge roll passes through every one of them.
   Staggered periods (4.6 to 6.8 s), and only those within 13 tiles of the pet run (one far off finishes its cycle and
   waits), so no burst or sound comes from off the screen. The FIRST trap of each kind the pet meets plays once,
   harmlessly ("SAFE TO WATCH"), with a banner that names the tell.
   GPU light through Nidhogg's painter (NIDHOGG_MOVES.FGFX) where a real GPU draws; the same soft glows in 2D sprites
   elsewhere; st.lowFx thins the particles.

   ======================= THE API =======================
   BEL_TRAPS.place(X, H, { count, kinds, avoid: [{ x, y, r }] }) -> field   (also self.BEL_TRAPS) inside a stage's
                 make(X, self, H) or a dungeon's extra (X: the rift stage's X, H: its helpers), once per dungeon:
       o.count   how many (15 / 22 / 30 for D1 / D2 / D3)
       o.kinds   a hint, may be missing: by dungeon otherwise (BEL.dungeonCtx(X).key: d1 geyser, riptide, toll; d2 toll,
                 geyser, riptide; d3 all four, the lightning rod first; d3 always gets the rod); dealt round-robin over a
                 seeded shuffle
       o.avoid   [{ x, y, r }] world points to keep clear (spawn, gates, doors, valves...); also always kept clear: the
                 start (4.5 tiles), the stage's exit (3.5), every object of the stage (2.2), and props (1.5)
       o.seed    deterministic placement (default the floor's seed)
       o.minGap  spacing between traps (default 3.5 tiles);  o.dmgK  damage scale (default 1: 8% of max health)
     Places them on plain walkable floor (the tile and its eight neighbours plain floor, no prop), spread room by room
     round-robin (or over the whole map when it has no rooms), at least minGap apart. The field drives itself (one engine
     timer a frame) and draws itself (depth-sorted objects, one GPU pass under them and one over): nothing to call.
       field = { traps: [{ kind, x, y, st, n, demo, ... }], tick(dt), stat: { hits, dodged, bursts }, stop() }
   BEL_TRAPS.clear()      stops and hides every placed trap (all fields)
   BEL_TRAPS.KINDS        { geyser, toll, riptide, rod }: { name, r, warn, burst } (the tests read them) */
var BEL_TRAPS = (() => {
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, hyp = Math.hypot, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__BEL_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  function glow(c, x, y, r, col, a, sy) { if (!(r > 0.5) || !(a > 0.01) || typeof glowSprite !== 'function') return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a, 0, 1); blitSized(c, glowSprite(col), x - r, y - r * (sy || 1), r * 2, r * 2 * (sy || 1)); c.restore(); }
  // a soft dark pool under a trap (it reads on a pale floor): a radial fade, no edge
  function pool(c, x, y, rx, ry, col, a) { c.save(); c.translate(x, y); c.scale(1, ry / rx); const g = c.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(col, a)); g.addColorStop(0.6, rgba(col, a * 0.6)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, TAU); c.fill(); c.restore(); }
  const R1 = s => { let x = s >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const KINDS = {
    geyser: { name: 'BRINE GEYSERS', tell: 'The drain swells and bubbles white before it blasts: step off it, or roll through', r: 1.0, warn: 1.7, burst: 0.75, col: '#7FE6F0', hi: '#E8FFFF', shove: 1.9 },
    toll: { name: 'TOLL RINGS', tell: 'The bell plate lights ring by ring and hums: its wave rolls out along the floor. Roll through the wave', r: 3.2, warn: 1.8, burst: 0.7, col: '#FFD27A', hi: '#FFF4D0', shove: 1.4 },
    riptide: { name: 'RIPTIDE GRATES', tell: 'The grate whirls and drags you in, then sprays: walk away from the whirl', r: 1.1, warn: 1.9, burst: 0.6, col: '#5FD0FF', hi: '#E0F8FF', shove: 1.7, pull: 3.2 },
    rod: { name: 'LIGHTNING RODS', tell: 'Arcs crawl up the rod to its tip, then lightning strikes its foot: stand clear', r: 1.25, warn: 1.6, burst: 0.5, col: '#C9B6FF', hi: '#FFFFFF', shove: 1.6 },
  };
  const FIELDS = [];
  const say = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };

  /* ---------------- placing ---------------- */
  function spots(X, o, rnd) { const M = X.M, MW = M.MW, G = M.G, props = M.props, me = X.me, start = M.start || { x: me.x, y: me.y };
    const plain = (tx, ty) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = (ty + dy) * MW + tx + dx; if (k < 0 || k >= G.length || G[k] !== T_FLOOR || (props && props.has(k))) return false; } return true; };
    // (a prop within a tile and a half, from the prop list or the map's props)
    const propNear = (x, y) => { const tx = Math.floor(x), ty = Math.floor(y); if (props) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (props.has((ty + dy) * MW + tx + dx) && hyp(dx, dy) < 2) return true; return false; };
    const keep = [{ x: start.x, y: start.y, r: 4.5 }].concat(o.avoid || []);
    try { const ex = X.rift && X.rift.exit; if (ex) keep.push({ x: ex.x, y: ex.y, r: 3.5 }); } catch (e) {}
    try { const objs = X.rift && X.rift.objs || []; for (const q of objs) if (q && isFinite(q.x) && isFinite(q.y) && Math.abs(q.y) < 1e5) keep.push({ x: q.x, y: q.y, r: 2.2 }); } catch (e) {}
    const ok = (x, y) => !keep.some(k => hyp(x - k.x, y - k.y) < (k.r || 2)) && !propNear(x, y);
    const rooms = (M.rooms && M.rooms.length > 1) ? M.rooms : [{ x: 0, y: 0, w: M.MW, h: M.MH }];
    const lists = rooms.map(r => { const c = []; for (let y = Math.max(1, r.y); y < Math.min(M.MH - 1, r.y + r.h); y++) for (let x = Math.max(1, r.x); x < Math.min(MW - 1, r.x + r.w); x++) if (plain(x, y) && ok(x + 0.5, y + 0.5)) c.push([x + 0.5, y + 0.5, rnd()]); c.sort((a, b) => a[2] - b[2]); return c; });
    return lists; }
  function place(X, H, o) { o = o || {}; const seed = o.seed != null ? o.seed : ((X.F && X.F.seed) || 7) * 2654435761, rnd = R1(seed), n = o.count == null ? 15 : o.count, gap = o.minGap || 3.5;
    // (kinds: the caller's hint, else by dungeon (BEL.dungeonCtx(X).key: d1 the lower church, d2 the foundry undercroft,
    // d3 the storm galleries, which always adds the lightning rod))
    let key = null; try { key = typeof BEL !== 'undefined' && BEL && typeof BEL.dungeonCtx === 'function' ? (BEL.dungeonCtx(X) || {}).key : null; } catch (e) { key = null; }
    const BY = { d1: ['geyser', 'riptide', 'toll'], d2: ['toll', 'geyser', 'riptide'], d3: ['rod', 'geyser', 'toll', 'riptide'] };
    let kinds = (o.kinds && o.kinds.length ? o.kinds.slice() : (BY[key] || BY.d1)).filter(k => KINDS[k]); if (key === 'd3' && !kinds.includes('rod')) kinds.unshift('rod'); if (!kinds.length) kinds = BY.d1.slice();
    const lists = spots(X, o, rnd), out = [];
    for (let pass = 0; pass < 60 && out.length < n; pass++) { let any = false; for (const L of lists) { if (out.length >= n) break; const i = L.findIndex(([x, y]) => !out.some(q => hyp(q.x - x, q.y - y) < gap)); if (i < 0) continue; const [x, y] = L.splice(i, 1)[0]; out.push({ x, y }); any = true; } if (!any) break; }
    // (kinds dealt round-robin over a seeded shuffle of the spots)
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const q = out[i]; out[i] = out[j]; out[j] = q; }
    const F = { X, traps: [], stat: { hits: 0, dodged: 0, bursts: 0, demos: 0 }, taught: {}, live: true, dmgK: o.dmgK || 1, lastT: X.g.t, LG: [], LL: [] };
    out.forEach((p, i) => { const kd = kinds[i % kinds.length], K = KINDS[kd], h = ((i * 2654435761) >>> 0) / 4294967296, period = 4.6 + h * 2.2;
      F.traps.push({ kind: kd, K, x: p.x, y: p.y, period, st: 'idle', t: (i * 0.618 % 1) * period, n: 0, on: false, demo: false, hit: false, front: 0, seed: i * 1.37, sparks: [] }); });
    // drawing: a ground layer first among the standing things, each trap's standing part depth-sorted, the light over all
    if (H && H.obj) { H.obj({ x: 0, y: -1e6, kind: 'beltrapG', r: 0, label: '', draw(c) { if (F.live) drawGround(F, c); } });
      for (const tp of F.traps) tp.obj = H.obj({ x: tp.x, y: tp.y + 0.05, kind: 'beltrap', r: 0, label: '', draw(c) { if (F.live) drawStand(F, tp, c); } });
      H.obj({ x: 0, y: 1e6 - 1, kind: 'beltrapL', r: 0, label: '', draw(c) { if (F.live) flush(c, F.LL); } }); }
    // the field drives itself: one engine timer a frame
    const loop = () => { if (!F.live) return; const t = X.g.t, dt = clamp(t - F.lastT, 0, 0.1); F.lastT = t; if (dt > 0 && !F.freeze) tick(F, dt); X.after(0, loop); };   // (F.freeze: held still, for pictures)
    if (o.auto !== false && X.after) X.after(0, loop);
    F.tick = dt => tick(F, dt); F.stop = () => { F.live = false; };
    FIELDS.push(F); return F; }
  function clear() { for (const F of FIELDS) F.live = false; FIELDS.length = 0; }

  /* ---------------- the cycle ---------------- */
  function tick(F, dt) { const X = F.X, me = X.me;
    for (const tp of F.traps) { tp.on = hyp(me.x - tp.x, me.y - tp.y) < 13; }
    // each kind's first one the pet comes near plays once, harmlessly
    for (const kd in KINDS) { if (F.taught[kd]) continue; const cand = F.traps.filter(tp => tp.kind === kd); if (!cand.length) { F.taught[kd] = true; continue; }
      const dm = cand.find(tp => tp.demo); if (dm) { if (dm.st === 'warn' && !dm.said) { dm.said = true; X.banner(KINDS[kd].name, KINDS[kd].tell, KINDS[kd].hi, 3.2, true); X.text(dm.x, dm.y - 1.8, 'Safe to watch…', KINDS[kd].hi, 14); } if (dm.n > dm.n0 && dm.st === 'idle') { dm.demo = false; F.taught[kd] = true; } continue; }
      let b = null, bd = 7.5; for (const tp of cand) { const d = hyp(me.x - tp.x, me.y - tp.y); if (d < bd && d > 2.3) { bd = d; b = tp; } } if (b) { b.demo = true; b.st = 'idle'; b.t = Math.max(0, b.period - b.K.warn - 0.7); b.n0 = b.n; F.stat.demos++; } }
    for (const tp of F.traps) step(F, tp, dt); }
  function step(F, tp, dt) { const X = F.X, me = X.me, K = tp.K; if (!tp.on && tp.st === 'idle') return; tp.t += dt;
    if (tp.st === 'idle') { if (tp.t >= tp.period - K.warn) { tp.st = 'warn'; tp.t = 0; if (tp.on) { if (tp.kind === 'geyser') say(X, 'hiss', K.warn * 0.9, 0.08, 500); else if (tp.kind === 'toll') say(X, 'note', 110, K.warn, 'sine', 0.12, 140); else if (tp.kind === 'riptide') say(X, 'hiss', K.warn, 0.06, 300); else say(X, 'hiss', K.warn * 0.8, 0.05, 2400); } } return; }
    if (tp.st === 'warn') { const k = tp.t / K.warn;
      // the riptide drags the pet in while it whirls (a dodge roll is never dragged)
      if (tp.kind === 'riptide' && !tp.demo && !me.dead && !me.dodge) { const dx = tp.x - me.x, dy = tp.y - me.y, d = hyp(dx, dy); if (d < K.pull && d > 0.35) { const v = (0.6 + 1.6 * k) * (1 - d / K.pull * 0.5) * dt; X.moveEnt(me, dx / d * v, dy / d * v, 0); } }
      if (tp.kind === 'rod' && Math.random() < dt * (4 + 22 * k)) tp.sparks.push({ u: Math.random() * 0.9, t: 0, s: Math.random() });
      if (tp.t >= K.warn) { tp.st = 'burst'; tp.t = 0; tp.hit = false; tp.n++; F.stat.bursts++; burstFx(F, tp); } return; }
    if (tp.st === 'burst') { const u = tp.t / K.burst;
      if (!tp.hit && !tp.demo && !me.dead) { let inside = false;
        if (tp.kind === 'toll') { const front = 0.4 + (K.r - 0.4) * ease(u), d = hyp(me.x - tp.x, me.y - tp.y); tp.front = front; inside = Math.abs(d - front) < 0.38 + (me.r || 0.3) * 0.5 && u < 1; }
        else inside = hyp(me.x - tp.x, me.y - tp.y) < K.r + (me.r || 0.3) * 0.6 && u < 0.6;
        if (inside) { tp.hit = true; if (me.dodge) F.stat.dodged++; else { const ok = X.hurtPet(X.ST().hp * 0.08 * F.dmgK, null); if (ok) { F.stat.hits++; const a = Math.atan2(me.y - tp.y, me.x - tp.x); X.push(isFinite(a) ? a : Math.random() * TAU, K.shove); } else F.stat.dodged++; } } }
      if (tp.t >= K.burst) { tp.st = 'idle'; tp.t = 0; tp.sparks.length = 0; } } }
  function burstFx(F, tp) { const X = F.X, K = tp.K, low = lowFx(); if (!tp.on) return;
    if (tp.kind === 'geyser') { for (let i = 0; i < (low ? 8 : 16); i++) X.part({ kind: 'bubble', x: tp.x + (Math.random() - 0.5) * 0.7, y: tp.y - 0.2, vx: (Math.random() - 0.5) * 2.2, vy: -5 - Math.random() * 5, g: 9, life: 0.8, max: 0.8, size: 3 + Math.random() * 4, color: Math.random() < 0.5 ? K.hi : K.col }); say(X, 'splash'); X.shake && X.shake(2.5, 0.2); }
    else if (tp.kind === 'toll') { say(X, 'note', 196, 1.2, 'sine', 0.22); say(X, 'note', 98, 1.6, 'sine', 0.18); X.shake && X.shake(3, 0.25); }
    else if (tp.kind === 'riptide') { for (let i = 0; i < (low ? 8 : 14); i++) { const a = Math.random() * TAU; X.part({ kind: 'bubble', x: tp.x, y: tp.y - 0.1, vx: Math.cos(a) * 4, vy: Math.sin(a) * 3 - 2, g: 7, life: 0.6, max: 0.6, size: 3 + Math.random() * 3, color: K.hi }); } say(X, 'splash'); }
    else { if (X.bolt) X.bolt(tp.x, tp.y, K.hi); if (X.flash) X.flash(0.18, '#E8E0FF'); say(X, 'crash'); X.shake && X.shake(4, 0.25); X.sparks && X.sparks(tp.x, tp.y - 0.2, K.col, low ? 8 : 16, 6); } }

  /* ---------------- drawing ---------------- */
  function flush(c, L) { if (!L.length) return; const F = fgx(); if (F) { try { const Q = F.begin(c, null); for (const f of L) f[0](Q); F.flush(c); } catch (e) { for (const f of L) if (f[1]) f[1](c); } } else for (const f of L) if (f[1]) f[1](c); L.length = 0; }
  const lvl = tp => tp.st === 'warn' ? ease(tp.t / tp.K.warn) : tp.st === 'burst' ? 1 : 0;   // (the build-up: calm 0 .. bright 1)
  function drawGround(F, c) { const X = F.X, T = X.Tz(), t = X.g.t, W = X.W(), Hh = X.H(), L = F.LG;
    for (const tp of F.traps) { const Xs = X.sx(tp.x), Ys = X.sy(tp.y); if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 4 || Ys > Hh + T * 4) continue; const K = tp.K, k = lvl(tp), u = tp.st === 'burst' ? tp.t / K.burst : 0, calm = 0.5 + 0.5 * Math.sin(t * 1.3 + tp.seed);
      if (tp.kind === 'geyser') { pool(c, Xs, Ys, T * 0.85, T * 0.5, '#0A1E26', 0.55);
        // the drain: a dark stone mouth, water inside rising, bubbles, the glow whitening
        const g = c.createRadialGradient(Xs, Ys, 0, Xs, Ys, T * 0.55); g.addColorStop(0, rgba(k > 0.6 ? K.hi : K.col, 0.35 + 0.55 * k)); g.addColorStop(0.7, rgba('#14505E', 0.75)); g.addColorStop(1, rgba('#0A2028', 0)); c.fillStyle = g; c.save(); c.translate(Xs, Ys); c.scale(1, 0.55); c.beginPath(); c.arc(0, 0, T * (0.55 + 0.08 * k), 0, TAU); c.fill();
        c.strokeStyle = rgba('#0A1A20', 0.45); c.lineWidth = Math.max(1.5, T * 0.06); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * T * 0.16, -T * 0.42); c.lineTo(i * T * 0.16, T * 0.42); c.stroke(); } c.restore();
        const nb = Math.round(1 + 7 * k); for (let i = 0; i < nb; i++) { const ph = (t * (0.8 + 1.8 * k) + i / nb + tp.seed) % 1, a = i * 2.4 + tp.seed, rr = T * 0.3 * (1 - ph * 0.5); c.fillStyle = rgba(K.hi, 0.7 * (1 - ph)); c.beginPath(); c.arc(Xs + Math.cos(a) * rr, Ys + Math.sin(a) * rr * 0.5 - ph * T * 0.25 * (1 + k), T * (0.04 + 0.04 * k), 0, TAU); c.fill(); }
        L.push([Q => { Q.glow(Xs, Ys, T * (0.7 + 0.9 * k), K.col, 0.15 + 0.55 * k + 0.08 * calm, 0.55); if (k > 0.3) Q.caustic(Xs, Ys, T * (0.6 + 0.6 * k), K.hi, 0.35 * k, tp.seed, 0.55); }, c2 => glow(c2, Xs, Ys, T * (0.7 + 0.9 * k), K.col, 0.15 + 0.5 * k, 0.55)]); }
      else if (tp.kind === 'toll') { pool(c, Xs, Ys, T * 1.0, T * 0.62, '#1C150A', 0.45); const jit = tp.st === 'warn' ? Math.sin(t * 70) * T * 0.015 * k : 0;
        // the bronze plate, its three engraved rings lighting from the middle out
        c.save(); c.translate(Xs + jit, Ys); c.scale(1, 0.6); const bg = c.createRadialGradient(-T * 0.2, -T * 0.25, T * 0.05, 0, 0, T * 0.8); bg.addColorStop(0, '#C9A15A'); bg.addColorStop(0.7, '#7A5A2A'); bg.addColorStop(1, 'rgba(70,50,22,0)'); c.fillStyle = bg; c.beginPath(); c.arc(0, 0, T * 0.8, 0, TAU); c.fill();
        for (let i = 0; i < 3; i++) { const rr = T * (0.2 + i * 0.2), on = clamp(k * 3 - i, 0, 1); c.strokeStyle = on > 0 ? rgba(K.hi, 0.35 + 0.6 * on) : 'rgba(40,28,12,.5)'; c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); }
        c.restore();
        if (tp.st === 'burst') { const fr = (0.4 + (K.r - 0.4) * ease(u)) * T, a = 1 - u; c.save(); c.translate(Xs, Ys); c.scale(1, 0.62); for (const [w, al] of [[T * 0.5, 0.18], [T * 0.26, 0.35], [T * 0.1, 0.7]]) { c.strokeStyle = rgba(K.hi, al * a); c.lineWidth = w; c.beginPath(); c.arc(0, 0, fr, 0, TAU); c.stroke(); } c.restore();
          L.push([Q => { Q.ewave(Xs, Ys, fr, K.col, 0.85, 0.75 * a, tp.seed, 0.62, 0.22); Q.glow(Xs, Ys, T * 1.2, K.hi, 0.4 * a, 0.6); }, null]); }
        L.push([Q => Q.glow(Xs, Ys, T * (0.8 + 0.8 * k), K.col, 0.1 + 0.5 * k + 0.06 * calm, 0.6), c2 => glow(c2, Xs, Ys, T * (0.8 + 0.8 * k), K.col, 0.1 + 0.45 * k, 0.6)]); }
      else if (tp.kind === 'riptide') { pool(c, Xs, Ys, T * 0.95, T * 0.6, '#08202C', 0.5);
        // the grate: a soft dark square of bars, a whirl spinning up beneath it
        c.save(); c.translate(Xs, Ys); c.scale(1, 0.6); const sp = t * (1 + 9 * k) + tp.seed; for (let j = 0; j < 3; j++) { c.strokeStyle = rgba(j ? K.col : K.hi, (0.18 + 0.6 * k) * (1 - j * 0.25)); c.lineWidth = Math.max(1.5, T * (0.07 - j * 0.015)); c.beginPath(); for (let i = 0; i <= 24; i++) { const a = sp + j * 2.1 + i / 24 * TAU * 0.8, rr = T * (0.62 - i / 24 * 0.5); i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.stroke(); }
        c.strokeStyle = 'rgba(12,22,28,.55)'; c.lineWidth = Math.max(2, T * 0.08); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * T * 0.15, -T * 0.45); c.lineTo(i * T * 0.15, T * 0.45); c.stroke(); c.beginPath(); c.moveTo(-T * 0.45, i * T * 0.15); c.lineTo(T * 0.45, i * T * 0.15); c.stroke(); } c.restore();
        // water streaks drawn inward while it pulls
        if (k > 0.05) for (let i = 0; i < 8; i++) { const ph = (t * (0.6 + 1.5 * k) + i / 8) % 1, a = i / 8 * TAU + tp.seed, rr = T * K.pull * 0.6 * (1 - ph); c.strokeStyle = rgba(K.hi, 0.45 * k * ph); c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(Xs + Math.cos(a) * rr, Ys + Math.sin(a) * rr * 0.6); c.lineTo(Xs + Math.cos(a + 0.3) * rr * 0.8, Ys + Math.sin(a + 0.3) * rr * 0.48); c.stroke(); }
        L.push([Q => { Q.glow(Xs, Ys, T * (0.8 + 1.2 * k), K.col, 0.12 + 0.5 * k + 0.06 * calm, 0.6); if (k > 0.2) Q.evortex(Xs, Ys, T * (0.7 + 0.5 * k), K.col, 0.8, 0.5 * k, tp.seed, 1 + 5 * k, 0.6); if (tp.st === 'burst') Q.spray(Xs, Ys - T * 0.2, T * (0.8 + 1.2 * u), K.hi, 0.7 * (1 - u), tp.seed, 1, 0.6); }, c2 => glow(c2, Xs, Ys, T * (0.8 + 1.2 * k), K.col, 0.12 + 0.45 * k, 0.6)]); }
      else { pool(c, Xs, Ys, T * 0.8, T * 0.48, '#120E22', 0.5); if (tp.st === 'burst') { const a = 1 - u; c.save(); c.translate(Xs, Ys); c.scale(1, 0.55); const g = c.createRadialGradient(0, 0, 0, 0, 0, T * K.r * 1.3); g.addColorStop(0, rgba('#FFFFFF', 0.8 * a)); g.addColorStop(0.4, rgba(K.col, 0.5 * a)); g.addColorStop(1, rgba(K.col, 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, T * K.r * 1.3, 0, TAU); c.fill(); c.restore(); }
        L.push([Q => Q.glow(Xs, Ys, T * (0.6 + 0.8 * k), K.col, 0.08 + 0.4 * k, 0.55), c2 => glow(c2, Xs, Ys, T * (0.6 + 0.8 * k), K.col, 0.08 + 0.35 * k, 0.55)]); } }
    flush(c, L); }
  function drawStand(F, tp, c) { const X = F.X, T = X.Tz(), t = X.g.t, Xs = X.sx(tp.x), Ys = X.sy(tp.y); if (Xs < -T * 3 || Xs > X.W() + T * 3 || Ys < -T * 4 || Ys > X.H() + T * 6) return; const K = tp.K, k = lvl(tp), u = tp.st === 'burst' ? tp.t / K.burst : 0, L = F.LL;
    if (tp.kind === 'geyser' && tp.st === 'burst') { const h = T * 2.8 * Math.sin(Math.min(1, u * 2.2) * Math.PI / 2) * (1 - Math.max(0, u - 0.6) / 0.4), a = 1 - Math.max(0, u - 0.5) * 2;
      // the column of brine (soft: a vertical gradient, no outline), its crown of spray
      c.save(); const g = c.createLinearGradient(0, Ys - h, 0, Ys); g.addColorStop(0, rgba(K.hi, 0)); g.addColorStop(0.25, rgba(K.hi, 0.75 * a)); g.addColorStop(1, rgba(K.col, 0.85 * a)); c.fillStyle = g; c.beginPath(); c.ellipse(Xs, Ys - h / 2, T * 0.32, h / 2 + 1, 0, 0, TAU); c.fill(); c.restore();
      L.push([Q => { Q.wstream(Xs, Ys, Xs, Ys - h, T * 0.42, K.col, 0.75 * a, tp.seed, 7, 0.65, 0.9); Q.spray(Xs, Ys - h, T * 1.1, K.hi, 0.7 * a, tp.seed, 1, 1); Q.glow(Xs, Ys - h * 0.5, T * 1.4, K.col, 0.35 * a, 1.5); }, c2 => glow(c2, Xs, Ys - h * 0.5, T * 1.2, K.col, 0.35 * a, 1.6)]); }
    if (tp.kind === 'rod') { const rh = T * 1.7, rx = Xs, top = Ys - rh;
      // the stone foot and the iron rod; arcs crawl up it brighter toward the strike; the tip glows
      c.save(); const fg = c.createLinearGradient(Xs - T * 0.3, 0, Xs + T * 0.3, 0); fg.addColorStop(0, '#8E948A'); fg.addColorStop(1, '#4E5450'); c.fillStyle = fg; c.beginPath(); c.ellipse(Xs, Ys - T * 0.08, T * 0.32, T * 0.16, 0, 0, TAU); c.fill(); c.fillRect(Xs - T * 0.26, Ys - T * 0.3, T * 0.52, T * 0.22); c.beginPath(); c.ellipse(Xs, Ys - T * 0.3, T * 0.26, T * 0.12, 0, 0, TAU); c.fillStyle = '#9EA49A'; c.fill();
      c.strokeStyle = '#2A2C30'; c.lineWidth = Math.max(2.5, T * 0.09); c.lineCap = 'round'; c.beginPath(); c.moveTo(rx, Ys - T * 0.3); c.lineTo(rx, top); c.stroke(); c.strokeStyle = '#7C8088'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(rx - T * 0.02, Ys - T * 0.3); c.lineTo(rx - T * 0.02, top); c.stroke();
      c.fillStyle = '#B9A06A'; c.beginPath(); c.arc(rx, top, T * 0.08, 0, TAU); c.fill();
      if (k > 0.02) { c.globalCompositeOperation = 'lighter'; for (const s of tp.sparks) { s.t += 1 / 60; if (s.t > 0.25) continue; const y0 = Ys - T * 0.3 - (rh - T * 0.3) * s.u, len = T * (0.2 + 0.3 * k); c.strokeStyle = rgba(K.hi, 0.9 * (1 - s.t / 0.25)); c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(rx, y0); let px = rx, py = y0; for (let j = 0; j < 3; j++) { px += (s.s - 0.5) * T * 0.3 + (Math.random() - 0.5) * T * 0.12; py -= len / 3; c.lineTo(px, py); } c.stroke(); }
        if (tp.sparks.length > 30) tp.sparks.splice(0, tp.sparks.length - 30); }
      c.restore();
      L.push([Q => { Q.glow(rx, top, T * (0.3 + 0.9 * k), K.col, 0.2 + 0.7 * k); Q.star(rx, top, T * (0.25 + 0.6 * k), 0.3 + 0.6 * k, K.hi); if (tp.st === 'burst') { Q.beam(rx, top - T * 8, rx, Ys, T * 0.5, K.col, 0.7 * (1 - u)); Q.beam(rx, top - T * 8, rx, Ys, T * 0.15, '#FFFFFF', 0.9 * (1 - u)); Q.glow(rx, Ys, T * 1.8, K.col, 0.6 * (1 - u), 0.6); } }, c2 => { glow(c2, rx, top, T * (0.3 + 0.8 * k), K.col, 0.2 + 0.6 * k);
        if (tp.st === 'burst') { const a = 1 - u; c2.save(); c2.globalCompositeOperation = 'lighter'; c2.lineCap = 'round'; for (const [w, col, al] of [[T * 0.6, K.col, 0.18], [T * 0.3, K.col, 0.35], [T * 0.1, '#FFFFFF', 0.85]]) { c2.strokeStyle = rgba(col, al * a); c2.lineWidth = w; c2.beginPath(); c2.moveTo(rx, top - T * 8); c2.lineTo(rx + T * 0.1, top - T * 4); c2.lineTo(rx - T * 0.08, top - T * 1.5); c2.lineTo(rx, Ys); c2.stroke(); } c2.restore(); glow(c2, rx, Ys, T * 1.6, K.col, 0.5 * a, 0.6); } }]); }   // (v394 B2: the strike, drawn without the GPU too)
    if (tp.kind === 'toll' && k > 0.05) L.push([Q => Q.glow(Xs, Ys - T * 0.1, T * (0.5 + 0.6 * k), K.hi, 0.25 * k), null]); }
  return { place, clear, KINDS, fields: () => FIELDS };
})();
try { self.BEL_TRAPS = BEL_TRAPS; } catch (e) {}   // (tests, and stage files that load before this one, at run time)
