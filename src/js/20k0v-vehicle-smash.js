/* ---------- The vehicles' scenery smashing, shared by Light's Sports Car (20k4p) and Lightning's Beast Machine (20k9i) ----------
   A vehicle smashes the environmental props it drives, spins, lands or strikes through, using the game's own break
   paths behind 20b's X.carProps hook (a prop on a wall tile: 20l's residue, loot and sound, the tile turned to floor,
   the minimap repainted, the flow field rebuilt on its own 0.25 s timer; a pot, crate or barrel: breakPot, never a chest).
   20b gives no hook (X.carProps null) on a hand-drawn rift puzzle, trial or gate stage, whose props are its walls, nor on
   a Super Fiend floor: there nothing is smashed and every prop blocks as before.
   Only the kinds in KINDS break. They are every purely environmental blocking prop the generators place (the Tower's
   lands in 20-dun-data / 20a, the rift lands' scatter and room-edge dressing in 20p2 ... 20zy2). Never touched: walls,
   gaps, bridges (T_BRIDGE tiles: only a broken prop's own tile changes, always to floor), the map's edge, doors, gates,
   exits and stairs, floor keys, rift stage objects (RIFT.objs are not props), and the props listed in PROTECT (a stage
   mechanic, a stair or a shrine-like prop by name, a stage's own wall blocks); any kind not listed blocks as before.
   (Beast round 3, the user: "Chest and shrines should be destroyable aswell") Chests burst open through breakPot (their
   full reward, exactly once) and the floor's shrines give their blessing through useShrine (once, as if walked onto;
   no shrine in the game has a cost or a choice, and none is a rift objective or counted by a floor rule), then break.
   Smashing deals no damage and gives no meter charge (it never goes through a vehicle's ctx.hit).
   VEH_SMASH.create(X, g) -> V (one per form; X = 20b's toolkit the ult gets as H.X, g = the game state):
     V.props               the 20b hook (null: nothing smashes here)
     V.smashable(tx, ty)   the unbroken prop of an allowed kind on that tile, or null
     V.blk(x, y, r, mode)  X.blocked(x, y, r, mode) with smashable props open (mode 1: walls alone, for the air)
     V.prop(p, x, y, fx)   break one prop (the quiet rule: a prop broken within QUIET s of the last one makes no crash or
                           floating name of its own); fx(x, y, quiet, isPot) is the vehicle's own touch; true if broken
     V.sweep(bx0, by0, bx1, by1, hitAt, fx)   every smashable prop with hitAt(tile centre, 0.42) and every pot with
                           hitAt(pot, 0.3) inside the tile box breaks (the car's round 3 sweep), then every shrine with
                           hitAt(shrine, 0.35)
     V.circle(x, y, r, fx, ox, oy)   / V.oval(cx, cy, rx, ry, ang, fx, ox, oy)   everything inside the area that a line
                           from (ox, oy) (default the centre) reaches without crossing a real wall (props on the way do
                           not count: they are smashed too); returns the count
     V.flowAt(x, y)        20b's flow distance, except that a smashable prop's tile counts as reachable when a chain of
                           smashable props joins it to reachable floor (so a vehicle may plan a landing among them) */
const VEH_SMASH = (() => {
  const KINDS = new Set([
    // the Tower's lands (20-dun-data's prop lists and 20a's room and arena dressing)
    'pillar', 'brokenpillar', 'barrel', 'mangrove', 'reeds', 'stump', 'shroom', 'crystal', 'stalag', 'rock', 'pine', 'boulder', 'bush',
    'iceblock', 'icespike', 'snowman', 'obsidian', 'bones', 'brazier', 'marble', 'cloudbush', 'statue', 'candles', 'cactus', 'dunerock',
    'palm', 'frozentree', 'igloo', 'volcrock', 'ashtree', 'peakrock', 'cairn', 'server', 'neonpillar', 'console', 'drum', 'gear', 'pipe',
    'boiler', 'lamp', 'crate', 'oak', 'log', 'fern', 'bigflower', 'tulips', 'lantern', 'pinkshroom',
    // rift 2, the Garden (20p2: the Egg Orchard and its sister lands, scatter and the thicket round each room)
    'eggtree', 'thornpine', 'weepwillow', 'giantfern', 'bulbtree', 'glowcaps', 'starlily', 'thornbush', 'mossrock',
    // rift 3, the Dunes (20r1)
    'mesarock', 'pinkcrystal', 'nightrock', 'deadshrub', 'skullpile',
    // rift 4, the Sepulchre (20s2; never its hourglass, a stage mechanic, nor the stair stub)
    'boxtomb', 'fallstone', 'silverurn', 'silverpillar', 'sunclock', 'marblebench', 'voidobelisk', 'cornerglow',
    // rift 5, the Aurora (20s6 / 20s6b)
    'snowhill', 'snowrock', 'icewedge', 'icetree', 'frozenvane', 'obsarch', 'telescope', 'stonearch',
    // rift 6, Yuggoth (20u6 / 20u6b)
    'hullshard', 'metalspike', 'neonpost', 'pylon', 'wreckrib', 'pipestack', 'coolanttank', 'biotube', 'xenospire', 'vertebra', 'piston',
    // rift 7, the Library and its heights (20zb / 20zb2)
    'bookcase', 'mirror', 'candelabra', 'bookstack', 'lectern', 'libladder', 'inkwell', 'cloudbank', 'harp', 'platpillar', 'haloarch', 'angelstatue', 'censer',
    // rift 8, the Moon and its castle (20zi / 20zi2)
    'moonrock', 'obelisk', 'moonspire', 'geodecleft', 'floatrock', 'gravring', 'moonstone', 'chhatri', 'cypress', 'jali', 'moonlantern', 'minaret', 'fountain', 'tajdome', 'pishtaq',
    // rift 9, the Basilica (20zt2; never its eye shrine)
    'stonebanner', 'narrowpillar', 'beaststatue', 'eyepylon', 'calcitecairn', 'eyelidmonolith', 'purifybasin', 'veilarch', 'veilshard', 'eyespire', 'splitmonolith', 'hornpillar', 'basaltblock', 'petrifiedplant',
    // rift 10, the Colours (20zo)
    'greyrock', 'driftwood', 'greylighthouse', 'bleachcoral', 'prismshard', 'lightkelp', 'glassurchin', 'prismspire', 'glasscoral', 'crystalarch', 'voidpearl', 'huebloom', 'starcoral', 'huecolumn', 'meteorshard',
    // rift 11, the Choir (20zy2)
    'drumstack', 'pipecolumn', 'gaugepost', 'greathorn', 'pipearch', 'bellows', 'pipespiral', 'conduit', 'tuningfork', 'bellframe']);
  /* named here so nobody adds them: the Sepulchre's hourglass (shattering one is that stage's mechanic, 20s2), its stair
     stub (a stair), the Basilica's eye shrine (a shrine), a hand-drawn stage's wall block ('blank') */
  const PROTECT = new Set(['hourglass', 'stairstub', 'eyeshrine', 'blank']);
  for (const k of PROTECT) KINDS.delete(k);
  const POTS = new Set(['pot', 'crate', 'barrel', 'chest']);   // (round 3: chests too, opened through breakPot)
  const QUIET = 0.14;
  const cl2 = (v, a, b) => v < a ? a : v > b ? b : v;
  function create(X, g) {
    const P = X.carProps || null; g = g || X.g;
    const V = { props: P, KINDS, t: -9, n: 0, pots: 0, shrines: 0 };
    V.smashable = (tx, ty) => { if (!P) return null; const p = P.propAt(tx, ty); return p && !p.broken && KINDS.has(p.kind) ? p : null; };
    V.blk = (x, y, r, mode) => {
      mode = mode || 0; if (!X.blocked(x, y, r, mode)) return false; if (!P) return true;
      const x0 = Math.floor(x - r), x1 = Math.floor(x + r), y0 = Math.floor(y - r), y1 = Math.floor(y + r);
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        if (!X.blocked(tx + 0.5, ty + 0.5, 0.02, mode) || V.smashable(tx, ty)) continue;
        const cx = cl2(x, tx, tx + 1), cy = cl2(y, ty, ty + 1); if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true; }
      return false; };
    V.prop = (p, x, y, fx) => { const t = g ? g.t : 0, quiet = t - V.t < QUIET; if (!P || !P.smashProp(p, quiet)) return false; V.t = t; V.n++; if (fx) fx(x, y, quiet, false); return true; };
    V.pot = (p, fx) => { if (!P || !P.smashPot(p)) return false; V.pots++; if (fx) fx(p.x, p.y, true, true); return true; };
    V.shrine = (s, fx) => { if (!P || !P.smashShrine || !P.smashShrine(s)) return false; V.shrines++; if (fx) fx(s.x, s.y, true, true); return true; };
    const shrinesIn = (x0, y0, x1, y1, hit, fx) => { const L = P && P.shrines ? P.shrines() : null; if (L) for (const s of L) { if (s.broken || s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue; if (hit(s)) V.shrine(s, fx); } };
    V.sweep = (bx0, by0, bx1, by1, hitAt, fx) => {
      if (!P) return 0; const n0 = V.n + V.pots + V.shrines;
      for (let ty = by0; ty <= by1; ty++) for (let tx = bx0; tx <= bx1; tx++) { const p = V.smashable(tx, ty); if (p && hitAt(tx + 0.5, ty + 0.5, 0.42)) V.prop(p, tx + 0.5, ty + 0.5, fx); }
      const pots = P.pots ? P.pots() : null; if (pots) for (const p of pots) { if (p.broken || !POTS.has(p.kind) || p.x < bx0 || p.x > bx1 + 1 || p.y < by0 || p.y > by1 + 1) continue; if (hitAt(p.x, p.y, 0.3)) V.pot(p, fx); }
      shrinesIn(bx0, by0, bx1 + 1, by1 + 1, q => hitAt(q.x, q.y, 0.35), fx);
      return V.n + V.pots + V.shrines - n0; };
    /* a line from (ox, oy) to the tile (tx, ty) without crossing a real wall (walls alone, mode 1; smashable props on the
       way do not stop it; the target tile itself is skipped) */
    V.clear = (ox, oy, x, y, tx, ty) => { const d = Math.hypot(x - ox, y - oy), n = Math.ceil(d / 0.3);
      for (let i = 1; i < n; i++) { const u = i / n, px = ox + (x - ox) * u, py = oy + (y - oy) * u, qx = Math.floor(px), qy = Math.floor(py); if ((qx === tx && qy === ty) || !X.blocked(qx + 0.5, qy + 0.5, 0.02, 1) || V.smashable(qx, qy)) continue; return false; }
      return true; };
    const area = (x0, y0, x1, y1, inside, fx, ox, oy) => {
      if (!P) return 0; const n0 = V.n + V.pots + V.shrines, bx0 = Math.floor(x0), bx1 = Math.floor(x1), by0 = Math.floor(y0), by1 = Math.floor(y1);
      for (let ty = by0; ty <= by1; ty++) for (let tx = bx0; tx <= bx1; tx++) { const p = V.smashable(tx, ty); if (!p) continue; const cx = tx + 0.5, cy = ty + 0.5; if (inside(cx, cy, 0.42) && V.clear(ox, oy, cx, cy, tx, ty)) V.prop(p, cx, cy, fx); }
      const pots = P.pots ? P.pots() : null; if (pots) for (const p of pots) { if (p.broken || !POTS.has(p.kind) || p.x < x0 - 1 || p.x > x1 + 1 || p.y < y0 - 1 || p.y > y1 + 1) continue; if (inside(p.x, p.y, 0.3) && V.clear(ox, oy, p.x, p.y, -9, -9)) V.pot(p, fx); }
      shrinesIn(x0 - 1, y0 - 1, x1 + 1, y1 + 1, q => inside(q.x, q.y, 0.35) && V.clear(ox, oy, q.x, q.y, -9, -9), fx);
      return V.n + V.pots + V.shrines - n0; };
    V.circle = (x, y, r, fx, ox, oy) => area(x - r - 0.5, y - r - 0.5, x + r + 0.5, y + r + 0.5, (px, py, pad) => Math.hypot(px - x, py - y) < r + pad, fx, ox == null ? x : ox, oy == null ? y : oy);
    V.oval = (cx, cy, rx, ry, ang, fx, ox, oy) => { const ca = Math.cos(ang), sa = Math.sin(ang), R = Math.max(rx, ry) + 0.5;
      return area(cx - R, cy - R, cx + R, cy + R, (px, py, pad) => { const dx = px - cx, dy = py - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca; return (u * u) / ((rx + pad) * (rx + pad)) + (v * v) / ((ry + pad) * (ry + pad)) < 1; }, fx, ox == null ? cx : ox, oy == null ? cy : oy); };
    /* the flow field, with smashable props passable: a prop tile counts as reachable (its neighbour's distance + the
       steps) when a short chain of smashable props joins it to reachable floor */
    const raw = (tx, ty) => (X.flowAt ? X.flowAt(tx + 0.5, ty + 0.5) : 0);
    V.flowAt = (x, y) => {
      const tx0 = Math.floor(x), ty0 = Math.floor(y), f = raw(tx0, ty0); if (f < 9999 || !P || !V.smashable(tx0, ty0)) return f;
      const seen = new Set([ty0 * 4096 + tx0]), q = [[tx0, ty0, 0]];
      for (let h = 0; h < q.length && h < 64; h++) { const [tx, ty, d] = q[h];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = tx + dx, ny = ty + dy, k = ny * 4096 + nx; if (seen.has(k)) continue; seen.add(k);
          const fn = raw(nx, ny); if (fn < 9999) return fn + d + 1; if (V.smashable(nx, ny)) q.push([nx, ny, d + 1]); } }
      return 9999; };
    return V;
  }
  return { create, KINDS, PROTECT, POTS, QUIET };
})();
