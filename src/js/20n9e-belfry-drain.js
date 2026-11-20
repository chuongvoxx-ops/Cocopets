/* ---------- v430 BW: the Drowned Belfry's water draining (BEL_DRAIN) ----------
   The user (iPhone, v429): "when the water is drained from the affected floors of Drowned Belfry, the water disappears
   instantaneously ... the water level must gradually descend from its current height to the designated drained height".
   Every drainable body of water in the Belfry (D2's and D3's refuge-valve halls, D1's flooded gate hall; Nhalu's lanes keep
   their own lane drain, eased in 20t4) is now one of these: a hall of water over a floor that is not flat. The floor dips
   toward its drain (a bronze sump grate) and rises toward the walls, with a slow swell in it; the water's surface is a
   level L over that floor. Draining lowers L over a few seconds (configurable, by the hall's size: CFG), on an eased
   curve (it begins softly, runs steady, and slows into its end), dt-based. Where the surface falls below the floor the
   floor is revealed, dark and wet at first and drying after; the shoreline creeps in from the walls toward the drain,
   foam riding it; the waterline on the hall's north wall faces sinks; rings and streaks of flow run in toward the drain
   and a whirl turns over it while the water moves. Nothing is faded out: the water is where the floor is below L.
   The same floor and level answer the gameplay (BEL_DRAIN.depth): where the pet makes a wake, where the brood is beached,
   where a deep hall stops the pet, what the drained floor gives up. A re-trigger mid-drain starts from the current level
   (no jump); a paused game does not tick; a new stage (a reload or a checkpoint) builds its water afresh from its own
   state, as the dungeon always has.
   Drawing: the shared GPU painter (NIDHOGG_MOVES.FGFX, 20k6h kinds 216..219: the water's body and the wet floor (solid),
   its light (caustics, foam, flow, whirl, glints), a wall face's wet stain (solid) and its waterline and drips (light)),
   clipped to the hall's floor. Without the painter the old 2D shallows, drawn only on the tiles still under water.
   API: make(o) -> W; W.go(level 0..1, secs); W.tick(dt); W.depth(x, y) (> 0 under water, in floor units); W.wet(x, y);
   W.draw(c, X, clip, o); W.walls(c, X, runs); W.level (0..1), W.moving, W.done; durFor(tiles, kind); ease(u); CFG. */
var BEL_DRAIN = (() => {
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u;
  const ss = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  /* the durations (s): a hall drains in base + tiles x perTile, held to [min, max]; a gate valve's partial step in step */
  const CFG = { shallow: { base: 3.6, perTile: 0.012, min: 4.0, max: 6.0 }, deep: { base: 4.8, perTile: 0.01, min: 5.5, max: 7.0 }, step: 3.4, dryT: 7.0, wade: 0.04, LMAX: 1.08, LMIN: -0.03 };
  const durFor = (n, kind) => { const K = CFG[kind] || CFG.shallow; return clamp(K.base + (n || 0) * K.perTile, K.min, K.max); };
  /* the drain's ease: its speed rises softly over the first fifth, holds, and eases off over the last 40% (the integral
     of that speed profile, tabled once) */
  const LUT = (() => { const N = 128, v = new Float32Array(N + 1); let s = 0; v[0] = 0; for (let i = 1; i <= N; i++) { const u = (i - 0.5) / N, sp = 0.04 + ss(0, 0.2, u) * (1 - 0.68 * ss(0.58, 1, u)); s += sp; v[i] = s; } for (let i = 0; i <= N; i++) v[i] /= s; return v; })();
  const ease = u => { u = clamp(u, 0, 1) * 128; const i = Math.min(127, Math.floor(u)), f = u - i; return LUT[i] + (LUT[i + 1] - LUT[i]) * f; };
  const pack = (a, b) => Math.floor(clamp(a, 0, 1) * 1000 + 0.5) + clamp(b, 0, 1) * 0.998;
  const hex2 = v => { const s = Math.round(clamp(v, 0, 1) * 255).toString(16); return s.length < 2 ? '0' + s : s; };
  const FG = () => { try { if (typeof window !== 'undefined' && (window.__BEL_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };

  /* a body of water over a rect of floor (world tiles x0..x1, y0..y1), its drain at sump {x, y}; o.deep a deep hall (D1's gate
     hall: dark, opaque water) else the walkable shallows; o.level its starting level (0..1, 1 brim full) */
  function make(o) {
    const cx = (o.x0 + o.x1) / 2, cy = (o.y0 + o.y1) / 2, hw = Math.max(0.5, (o.x1 - o.x0) / 2), hh = Math.max(0.5, (o.y1 - o.y0) / 2), ar = clamp(hw / hh, 0.25, 3.98);
    const su = clamp((o.sump.x - cx) / hw, -0.95, 0.95), sv = clamp((o.sump.y - cy) / hh, -0.95, 0.95), sx = su * ar, sy = sv;
    const seed = ((o.seed || 0) * 0.618034) % 1, sd = seed * TAU;
    const dm = Math.max(Math.hypot(ar - sx, 1 - sy), Math.hypot(-ar - sx, 1 - sy), Math.hypot(ar - sx, -1 - sy), Math.hypot(-ar - sx, -1 - sy));
    const L01 = l => lerp(CFG.LMIN, CFG.LMAX, l);
    const W = { o, cx, cy, hw, hh, ar, su, sv, seed, deep: !!o.deep, L: L01(o.level == null ? 1 : o.level), from: 0, to: 0, t: 0, dur: 1, moving: false, turb: 0, dry: 1, done: false, drained: false, stat: { starts: 0, ticks: 0 },
      get level() { return clamp((this.L - CFG.LMIN) / (CFG.LMAX - CFG.LMIN), 0, 1); } };
    /* the floor's height (0 the drain .. ~1 by the walls), in floor units: the same function the shader draws */
    W.elev = (x, y) => { const px = (x - cx) / hw * ar, py = (y - cy) / hh, d = Math.hypot(px - sx, py - sy);
      return 0.06 + 0.84 * Math.pow(d / dm, 0.8) + 0.05 * Math.sin(px * 3.1 + sd) * Math.sin(py * 2.7 + sd * 0.7) + 0.07 * (1 - ss(0, 0.3, Math.min(ar - Math.abs(px), 1 - Math.abs(py)))); };
    W.depth = (x, y) => W.L - W.elev(x, y);
    W.wet = (x, y) => W.depth(x, y) > 0;
    /* lower (or raise) the surface to level (0..1) over secs: from wherever it stands now (a re-trigger never jumps) */
    W.go = (level, secs) => { const to = L01(clamp(level, 0, 1)); if (Math.abs(to - W.L) < 1e-4 && !W.moving) return; W.from = W.L; W.to = to; W.t = 0; W.dur = Math.max(0.2, secs || 4); W.moving = true; W.done = false; W.drained = false; W.dry = 0; W.stat.starts++; };
    W.tick = dt => { if (!(dt > 0)) return; dt = Math.min(dt, 0.1); W.stat.ticks++;
      if (W.moving) { W.t += dt; const u = clamp(W.t / W.dur, 0, 1); W.L = lerp(W.from, W.to, ease(u)); W.turb = Math.min(1, W.turb + dt * 2.5) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, u * 1.15 + 0.08)));
        if (u >= 1) { W.moving = false; W.L = W.to; if (W.to <= CFG.LMIN + 1e-3) W.drained = true; } }
      else { W.turb = Math.max(0, W.turb - dt * 0.8); if (W.drained && W.dry < 1) { W.dry = Math.min(1, W.dry + dt / CFG.dryT); if (W.dry >= 1 && W.turb <= 0) W.done = true; } } };
    /* the water drawn: clip(c) lays the floor's path (the hall's tiles); o: { over (the deep water's tint over what stands in it), alpha } */
    W.draw = (c, X, clip, d) => { d = d || {}; if (W.done) return; const T = X.Tz(), x0 = X.sx(o.x0), y0 = X.sy(o.y0), x1 = X.sx(o.x1), y1 = X.sy(o.y1);
      if (x1 < -T * 2 || y1 < -T * 2 || x0 > X.W() + T * 2 || y0 > X.H() + T * 2) return;
      const F = FG(); if (!F) { fallback(c, X, clip, d); return; }
      const lf = lowFx(), Xc = (x0 + x1) / 2, Yc = (y0 + y1) / 2, ux = (x1 - x0) / 2, vy = (y1 - y0) / 2, L = W.L, q1 = pack((su + 1) / 2, (sv + 1) / 2), q2 = pack(W.turb, W.dry);
      const mode = d.over ? 0.5 : W.deep ? 1 : 0, col = '#' + hex2(ar / 4) + hex2(seed) + hex2(mode);
      c.save(); c.beginPath(); clip(c); c.clip();
      const Q = F.begin(c, null);
      Q.quad(216, Xc, Yc, ux, 0, 0, vy, col, (d.alpha == null ? 1 : d.alpha), L, q1, q2);
      if (!d.over) Q.quad(217, Xc, Yc, ux, 0, 0, vy, col, (lf ? 0.6 : 1) * (d.alpha == null ? 1 : d.alpha), L, q1, q2 + (lf ? 0 : 0));
      F.flush(c); c.restore(); };
    /* the wet stain and the sinking waterline on the hall's north wall faces: runs [{ x0, x1, y }] (world: the face's foot line y,
       from x0 to x1), the face fh tiles tall; the water's height on a face is the depth of the water at its foot */
    W.walls = (c, X, runs, fh) => { if (W.done || !runs || !runs.length || !(W.moving || W.drained)) return;   // (a pass of its own: only while the water is going down and the stone drying)
      const F = FG(); if (!F) return; const T = X.Tz(), H0 = (fh || 0.75) * T, hmax = W.deep ? 0.9 : 0.42, Q = F.begin(c, null); let n = 0;
      for (const R of runs) { const a = X.sx(R.x0), b = X.sx(R.x1), y = X.sy(R.y); if (b < -T || a > X.W() + T || y < -T || y - H0 > X.H() + T) continue;
        const dep = W.depth((R.x0 + R.x1) / 2, R.y + 0.15), h = clamp(dep / (W.deep ? 0.55 : 0.3), 0, 1) * hmax, wet = clamp(1 - W.dry, 0, 1);
        if (h <= 0.002 && wet <= 0.01) continue; n++;
        Q.quad(218, (a + b) / 2, y - H0 / 2, (b - a) / 2, 0, 0, H0 / 2, W.deep ? '#0A2632' : '#123E4C', 0.9, h, pack(hmax, wet), (R.x0 * 0.37 + R.y * 0.11) % 1);
        if (h > 0.004) Q.quad(219, (a + b) / 2, y - H0 / 2, (b - a) / 2, 0, 0, H0 / 2, '#BFF4F0', lowFx() ? 0.6 : 0.95, h, W.turb, (R.x0 * 0.37 + R.y * 0.11) % 1); }
      if (n) F.flush(c); };
    /* (no painter) the old 2D shallows, laid only on the tiles still under water at their middles */
    function fallback(c, X, clip, d) { const T = X.Tz(), tiles = o.tiles; if (!tiles || d.over) return; c.save(); c.beginPath(); let any = false;
      for (const t of tiles) { const dep = W.depth(t.tx + 0.5, t.ty + 0.5); if (dep <= 0) continue; any = true; c.rect(X.sx(t.tx) - 0.5, X.sy(t.ty) - 0.5, T + 1, T + 1); }
      if (any) { c.clip(); c.beginPath(); clip(c); c.fillStyle = W.deep ? `rgba(8,34,50,${0.85})` : 'rgba(30,118,142,.34)'; c.fill(); } c.restore(); }
    return W; }
  /* the north wall faces over a tile region: runs of tiles with a wall straight above them */
  function northRuns(tiles, set, MW, solidAt) { const out = [], rows = new Map();
    for (const t of tiles) { if (set.has((t.ty - 1) * MW + t.tx) || !solidAt(t.tx, t.ty - 1)) continue; if (!rows.has(t.ty)) rows.set(t.ty, []); rows.get(t.ty).push(t.tx); }
    rows.forEach((xs, ty) => { xs.sort((a, b) => a - b); let s = xs[0], p = xs[0]; for (let i = 1; i <= xs.length; i++) { if (i < xs.length && xs[i] === p + 1) { p = xs[i]; continue; } out.push({ x0: s, x1: p + 1, y: ty }); if (i < xs.length) { s = p = xs[i]; } } });
    return out; }
  return { CFG, make, durFor, ease, northRuns, pack };
})();
if (typeof window !== 'undefined') window.BEL_DRAIN = BEL_DRAIN;
