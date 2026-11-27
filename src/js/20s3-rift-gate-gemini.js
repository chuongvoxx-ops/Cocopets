/* ---------- v468 GP: Gate 04, Gemini: CLASH OF THE TWINS (the Sepulchre of Borrowed Hours' Anima gate) ----------
   Replaces v2xx's Twin Reflection (a mirror of the pet fought as a boss: 'mirrorpet', 'mirrorshard', the 'twinhall' land: all gone).
   The gate keeps its key (RIFT_GATES.sepulchre: Rift 04's seal opens it, the 'gemini' Anima is its reward) and the save's
   st.rift.gates.sepulchre: a player who beat the old trial keeps Raziel; a replay runs the new one.
   THE CHAMBER OF TWIN DRAGONS: a round celestial temple floor hung over the cosmic abyss (the Sepulchre's own far view, SEP_SKY, in
   a land of this gate's: its galleries, stopped dials and gear wheels re-lit under a starfield, a far artificial sun to the west and
   a frozen planet to the east, each in turning rings). Its west half is gold and bronze over molten plasma (grates of fire in the
   floor, embers, fiery inscriptions), its east half platinum and cobalt over frost (crystal windows, cold mist, blue inscriptions);
   at its heart the engraved Gemini sign inside two turning mechanical rings; fire and ice channels in the floor run from the six
   pillars' sockets to the sealed Gemini Gate on the north rim (steam and white light where they cross). On the west and east rims
   two bastions are built into the temple: from each a long articulated neck carries an enormous mechanical dragon head, Raziel's own
   redesigned head (RAZIEL_GL, through GEMINI_GUARD, 20s3a): LUX the Infernal Guardian (west, gold, fire) and UMBRA the Cryogenic
   Guardian (east, platinum, ice); their necks bend and their heads turn to track the pet, their jaws open, their crown rings turn.
   BAIT -> LOCK -> DODGE -> DESTROY. A guardian tracks the controlled pet (a narrow translucent line from its mouth: 2 s), locks its
   aim (eyes flash, a mechanical clack, the line becomes a wide bright band along the fixed path: 0.8 s), then breathes along the
   locked path (1.2 s; it never follows after the lock) and recovers (1 s). Fire breaks Ice pillars, ice breaks Fire pillars; a
   matching breath is drunk in; nothing else harms a pillar. A pillar in the path stops the breath (beam collision against its
   circle: the breath's own visible width), so stand behind a pillar of the opposite element as the guardian locks, then step out:
   the breath breaks it (0.4 s) and goes on through where you stood. Caught in a breath the pet takes ordinary damage.
     I   THE INFERNAL TRIAL  Lux alone; two Ice pillars rise.
     II  THE FROZEN TRIAL    Umbra alone; two Fire pillars rise; its breath leaves frost patches (3.6 s: slow, a little damage).
     III TWIN CATACLYSM      both, staggered (Umbra starts 2 s after Lux; every other cycle 1.1 s, so the breaths sometimes overlap);
                             one Ice and one Fire pillar; where two live breaths cross, a Thermal Shock bursts (a growing ring).
     THE PARADOX             all six down: the chamber falls quiet, the guardians draw back, their armour unfolds, their heads reach to
                             the centre: stand on the Gemini sign, both charge their strongest breath and lock on it (1.5 s to leave),
                             the streams collide there. Caught inside: damage and another attempt; left before the lock: they reset.
   Then the convergence (the white nucleus, energy running back up both streams, the necks shaking, the compression, a colossal
   Thermal Shock), the guardians shut down (Lux frosted over, Umbra half melted, panels breaking away), and the gate unfolds: its
   plates part, its rings race, the Gemini sign burns white and the portal opens on THE EQUINOX SANCTUM, Raziel's arena, to the
   north. PARADOX RESOLVED, THE GEMINI GATE IS OPEN: control returns; walk in when ready. The door seals and GEMINI_BOSS (GB, 20s3b)
   begins (the contract: scratchpad hooks.md; as SCORPIO_BOSS / ARIES_BOSS). CHECKPOINT: the gate's opening sets st.rift.gck.sepulchre;
   while it is set the gate starts at the open gate (the puzzle is never replayed after a loss at the boss); 21b's gateFinish clears it
   on the win. The boss's Gemini Seals and its six mechanics are the boss's alone: nothing here counts toward them.
   No overall timer; missed breaths reset nothing; only the team's ordinary defeat ends the trial.
   Timers are game time (dt); lowFx and the quality tiers thin the cosmetics only (every line, band, patch and ring stays).
   Without the GPU painter the machines are drawn in 2D shapes and the light in 2D (functional, simple).
   Test hooks (the stage module): S, R, PIL, GU, geo, stage(n), breakPillar(id), solve(), paradox(), breathPath(G), hitTest(...);
   window.__GG_NOBOSS = 1 (the gate wins as the door seals), __GG_BOSS (a stand-in), __GG_GL = 0 (no GPU). */
(() => {
  const TAU = Math.PI * 2, PI = Math.PI;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, cl = u => clamp(u, 0, 1);
  const ease = u => { u = cl(u); return u * u * (3 - 2 * u); }, ss = (a, b, x) => ease((x - a) / (b - a)), eout = u => 1 - Math.pow(1 - cl(u), 3);
  const hh = (a, b, s) => { let n = (a * 374761393 + b * 668265263 + (s || 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > PI) d -= TAU; if (d < -PI) d += TAU; return d; };
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const W_ = typeof window !== 'undefined' ? window : {};
  const fgx = () => { try { if (W_.__GG_GL === 0 || W_.__DUN_GL === 0) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const GGd = () => (typeof GEMINI_GUARD !== 'undefined' && GEMINI_GUARD) || null;
  const glOn = () => { const G = GGd(); try { return !!(G && G.ok()); } catch (e) { return false; } };
  const FXP = () => (typeof RAZIEL_MOVES !== 'undefined' && RAZIEL_MOVES && RAZIEL_MOVES.FXP) || null;
  const GOLD = '#E8C070', GOLD_HI = '#FFE2A0', FIRE = '#FF8A2A', FIRE_HI = '#FFC060', ICE = '#5FC8FF', ICE_HI = '#BFEFFF', PLAT = '#D8E4F0', WHITE = '#FFFFFF', INK = '#1A1620';
  const hexA = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1).toFixed(3)})`; };
  const mixHx = (a, b, u) => { const p = parseInt(a.slice(1), 16), q = parseInt(b.slice(1), 16), f = (s) => Math.round(lerp(p >> s & 255, q >> s & 255, cl(u))); return `rgb(${f(16)},${f(8)},${f(0)})`; };

  /* ======================= the geometry (world tiles = the engine's map coordinates) ======================= */
  const CC = { x: 21.5, y: 39.0 }, CR = 9.0;               // the chamber: a circle of floor
  const BA = { x: 21.5, y: 15.5 }, BR = 11;                // THE EQUINOX SANCTUM (the boss's arena: GB's): floor = tile centres within 11
  const GATE = { x: 21.5, y: 30.35 };                      // the gate's base (its floor centre) on the chamber's north rim
  const DOOR = [[20, 28], [21, 28], [22, 28], [20, 29], [21, 29], [22, 29]], SEALT = [[20, 27], [21, 27], [22, 27]];
  const START = { x: 21.5, y: 46.5 }, CKPT = { x: 21.5, y: 34.2 };
  const GU0 = { L: { mx: CC.x - 13.6, my: CC.y + 0.2, base: 0 }, R: { mx: CC.x + 13.6, my: CC.y + 0.2, base: PI } };
  const PR = 1.0;                                          // a pillar's collision radius (its base's)
  const PIL0 = [
    { id: 'I1', el: 'ice', st: 1, x: CC.x - 3.3, y: CC.y - 3.8, sock: 0, lane: 0 }, { id: 'I2', el: 'ice', st: 1, x: CC.x - 2.8, y: CC.y + 4.2, sock: 1, lane: 1 },
    { id: 'F1', el: 'fire', st: 2, x: CC.x + 3.3, y: CC.y + 3.8, sock: 4, lane: 1 }, { id: 'F2', el: 'fire', st: 2, x: CC.x + 2.8, y: CC.y - 4.2, sock: 3, lane: 0 },
    { id: 'I3', el: 'ice', st: 3, x: CC.x + 1.4, y: CC.y + 5.2, sock: 2, lane: 2 }, { id: 'F3', el: 'fire', st: 3, x: CC.x - 1.4, y: CC.y - 5.2, sock: 5, lane: 2 }];
  const SOCK = [0, 1, 2, 3, 4, 5].map(i => ({ x: GATE.x + (i < 3 ? -1 : 1) * (1.0 + (i % 3) * 0.9) * 0.95, y: GATE.y + 0.55 }));   // (0..2 west: ice; 3..5 east: fire)
  // a channel from a pillar to its socket: out to its lane, along the lane's arc (ice by the west, fire by the east), north to the socket
  const CHAN = PIL0.map(p => { const pts = [[p.x, p.y]], a0 = Math.atan2(p.y - CC.y, p.x - CC.x), rl = 6.55 + p.lane * 0.42, s = SOCK[p.sock], a1 = Math.atan2(s.y + 1.4 - CC.y, s.x - CC.x);
    let d = angD(a1, a0); if (p.el === 'ice' && d > 0 && Math.cos(a0) < 0.3) d -= TAU; if (p.el === 'ice' && d < -TAU + 0.01) d += TAU; if (p.el === 'fire' && d < 0 && Math.cos(a0) > -0.3) d += TAU;
    if (p.el === 'ice' && Math.cos(a0) >= 0.3 && d > 0) d -= TAU; if (p.el === 'fire' && Math.cos(a0) <= -0.3 && d < 0) d += TAU;
    if (Math.abs(d) > PI * 1.6) d = d > 0 ? d - TAU : d + TAU;
    const n = Math.max(2, Math.ceil(Math.abs(d) / 0.22)); for (let i = 0; i <= n; i++) { const a = a0 + d * i / n; pts.push([CC.x + Math.cos(a) * rl, CC.y + Math.sin(a) * rl]); }
    pts.push([s.x, s.y + 0.9]); pts.push([s.x, s.y]); let L = 0; const cum = [0]; for (let i = 1; i < pts.length; i++) { L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); cum.push(L); } return { id: p.id, el: p.el, pts, cum, L }; });
  const CHAN_X = (() => { const out = []; for (let i = 0; i < CHAN.length; i++) for (let j = i + 1; j < CHAN.length; j++) { if (CHAN[i].el === CHAN[j].el) continue; const A = CHAN[i].pts, B = CHAN[j].pts;
      for (let a = 0; a < A.length - 1; a++) for (let b = 0; b < B.length - 1; b++) { const q = segX(A[a], A[a + 1], B[b], B[b + 1]); if (q) out.push({ x: q[0], y: q[1], i, j }); } } return out; })();
  function segX(p, q, r, s) { const d1x = q[0] - p[0], d1y = q[1] - p[1], d2x = s[0] - r[0], d2y = s[1] - r[1], den = d1x * d2y - d1y * d2x; if (Math.abs(den) < 1e-9) return null; const u = ((r[0] - p[0]) * d2y - (r[1] - p[1]) * d2x) / den, v = ((r[0] - p[0]) * d1y - (r[1] - p[1]) * d1x) / den; return u >= 0 && u <= 1 && v >= 0 && v <= 1 ? [p[0] + d1x * u, p[1] + d1y * u] : null; }
  const inChamber = (x, y) => Math.hypot(x - CC.x, y - CC.y) < CR - 0.35;
  const onFloorTile = (tx, ty) => Math.hypot(tx + 0.5 - CC.x, ty + 0.5 - CC.y) < CR;
  // (v468b) the rim row by the bridge (x 20..22, y 26) is the sanctum's threshold: the circle (< 11 from the centre) left it
  // wall, so a pet walking off the bridge stopped one tile short of the seal line and could never get in
  const onArenaTile = (tx, ty) => (Math.hypot(tx + 0.5 - BA.x, ty + 0.5 - BA.y) < BR && ty <= 26) || (ty === 26 && tx >= 20 && tx <= 22);
  const onBridge = (tx, ty) => tx >= 20 && tx <= 22 && ty >= 27 && ty <= 29;
  // the layout (map = layout + 1)
  const MW = 43, MH = 50;
  const LAYOUT = (() => { const rows = []; for (let y = 1; y < MH - 1; y++) { let r = ''; for (let x = 1; x < MW - 1; x++) { let ch = '~'; if (onFloorTile(x, y) || onArenaTile(x, y) || onBridge(x, y)) ch = '.'; if (DOOR.some(([a, b]) => a === x && b === y)) ch = 'D'; if (x === Math.floor(START.x) && y === Math.floor(START.y)) ch = 'S'; r += ch; } rows.push(r); } return rows; })();

  /* ======================= the floor (painted once into the engine's ground chunks) ======================= */
  const STW = ['#4A3424', '#55392A', '#3F2C20', '#5C4230'], STE = ['#2E3A4C', '#34425A', '#283446', '#3A4A62'];
  const RINGS = [2.5, 3.4], FR = 1.3;
  function gemSign(c, x, y, s, col, w) {   // the Gemini sign: two columns between a top and a bottom arc
    c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath();
    c.moveTo(x - s * 0.62, y - s * 0.74); c.quadraticCurveTo(x, y - s * 0.5, x + s * 0.62, y - s * 0.74); c.moveTo(x - s * 0.62, y + s * 0.74); c.quadraticCurveTo(x, y + s * 0.5, x + s * 0.62, y + s * 0.74);
    c.moveTo(x - s * 0.3, y - s * 0.6); c.lineTo(x - s * 0.3, y + s * 0.6); c.moveTo(x + s * 0.3, y - s * 0.6); c.lineTo(x + s * 0.3, y + s * 0.6); c.stroke(); c.restore(); }
  function chamberFloor(c, X, Y, T, x, y) {
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T], cp = P(CC.x, CC.y), k = ss(-1.4, 1.4, x + 0.5 - CC.x);
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); c.fillStyle = mixHx('#20150F', '#121822', k); c.fillRect(X, Y, T, T);
    if (onBridge(x, y)) { bridgeTile(c, X, Y, T, x, y); c.restore(); return; }
    let d0 = 1e9, d1 = 0; for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const d = Math.hypot(x + a - CC.x, y + b - CC.y); d0 = Math.min(d0, d); d1 = Math.max(d1, d); } if (x <= CC.x && x + 1 >= CC.x && y <= CC.y && y + 1 >= CC.y) d0 = 0;
    // the flagstones in rings round the emblem, each stone's colour by its own side
    const r00 = 3.75;
    for (let i = Math.max(0, Math.floor((d0 - r00) / FR)); i <= Math.floor((d1 - r00) / FR); i++) { const r0 = r00 + i * FR, r1 = r0 + FR, n = Math.max(10, Math.round(TAU * (r0 + FR / 2) / 1.5)), off = hh(i, 1, 4);
      const ca = Math.atan2(y + 0.5 - CC.y, x + 0.5 - CC.x), span = 1.0 / Math.max(0.6, r0) + 0.14, j0 = Math.floor(((ca - span) / TAU) * n - off) - 1, j1 = Math.ceil(((ca + span) / TAU) * n - off) + 1;
      for (let j = j0; j <= j1; j++) { const a0 = (j + off) / n * TAU, a1 = (j + 1 + off) / n * TAU, jj = ((j % n) + n) % n, gap = 0.05 / (r0 + 0.5), am = (a0 + a1) / 2, ks = ss(-1.6, 1.6, Math.cos(am) * (r0 + FR / 2));
        c.beginPath(); c.arc(cp[0], cp[1], (r1 - 0.04) * T, a0 + gap, a1 - gap); c.arc(cp[0], cp[1], (r0 + 0.04) * T, a1 - gap, a0 + gap, true); c.closePath();
        const v = Math.floor(hh(i, jj, 3) * 4); c.fillStyle = mixHx(STW[v], STE[v], ks); c.fill();
        const mx = cp[0] + Math.cos(am) * (r0 + FR / 2) * T, my = cp[1] + Math.sin(am) * (r0 + FR / 2) * T, g = c.createLinearGradient(mx - T * 0.7, my - T * 0.7, mx + T * 0.7, my + T * 0.7); g.addColorStop(0, ks > 0.5 ? 'rgba(220,235,255,.12)' : 'rgba(255,220,170,.12)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.26)'); c.fillStyle = g; c.fill();
        c.strokeStyle = 'rgba(6,4,6,.9)'; c.lineWidth = Math.max(1.2, T * 0.055); c.stroke();
        c.strokeStyle = ks > 0.5 ? 'rgba(200,220,240,.14)' : 'rgba(240,200,140,.14)'; c.lineWidth = Math.max(0.6, T * 0.02); c.beginPath(); c.arc(cp[0], cp[1], (r1 - 0.08) * T, a0 + gap * 2, a1 - gap * 2); c.stroke(); }
      // a metal inlay along the ring's inner edge: gold west, platinum east
      c.lineWidth = Math.max(1, T * 0.05); for (const [aa, bb, col] of [[PI * 0.5, PI * 1.5, '#B08A48'], [-PI * 0.5, PI * 0.5, '#A8B8CC']]) { c.strokeStyle = col; c.beginPath(); c.arc(cp[0], cp[1], r0 * T, aa, bb); c.stroke(); } }
    for (let k2 = 0; k2 < 8; k2++) { const u = hh(x * 3 + k2, y, 60), v = hh(x, y * 3 + k2, 61); c.fillStyle = `rgba(4,2,4,${(0.18 + hh(x, y, 62 + k2) * 0.3).toFixed(2)})`; c.fillRect(X + u * T, Y + v * T, Math.max(1, T * 0.022), Math.max(1, T * 0.022)); }
    // the emblem: a polished dark disc, the Gemini sign inlaid (gold on its west half, platinum on its east), two ring grooves
    if (d0 < r00 + 0.1) { c.save(); c.beginPath(); c.arc(cp[0], cp[1], r00 * T, 0, TAU); const g = c.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], r00 * T); g.addColorStop(0, '#2A2232'); g.addColorStop(0.75, '#16121C'); g.addColorStop(1, '#0C0A10'); c.fillStyle = g; c.fill(); c.clip();
      for (const [x0, col] of [[-99, '#C89A4A'], [CC.x, '#B8CCE0']]) { c.save(); c.beginPath(); const xa = x0 < 0 ? X - T * 9 : P(CC.x, 0)[0]; c.rect(xa, Y - T * 9, x0 < 0 ? P(CC.x, 0)[0] - xa : T * 20, T * 20); c.clip(); gemSign(c, cp[0], cp[1], T * 1.45, '#08060A', Math.max(3, T * 0.32)); gemSign(c, cp[0], cp[1], T * 1.45, col, Math.max(1.6, T * 0.15)); c.restore(); }
      for (const r of RINGS) { c.strokeStyle = 'rgba(4,2,6,.95)'; c.lineWidth = Math.max(3, T * 0.34); c.beginPath(); c.arc(cp[0], cp[1], r * T, 0, TAU); c.stroke(); c.strokeStyle = '#3A3240'; c.lineWidth = Math.max(1, T * 0.06); c.stroke(); }
      for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, r = 2.95, q = [cp[0] + Math.cos(a) * r * T, cp[1] + Math.sin(a) * r * T]; c.fillStyle = Math.cos(a) < 0 ? '#A07A3A' : '#90A4BC'; c.beginPath(); c.arc(q[0], q[1], Math.max(0.8, T * 0.045), 0, TAU); c.fill(); }
      c.restore(); }
    // the grates over the molten plasma (west) and the windows over the frozen deep (east)
    for (const gr of GRATES) { if (Math.abs(x + 0.5 - gr.x) > 1.6 || Math.abs(y + 0.5 - gr.y) > 1.6) continue; const q = P(gr.x, gr.y); c.save(); c.translate(q[0], q[1]); c.rotate(gr.a);
      const w = T * 1.25, h = T * 0.62; c.fillStyle = 'rgba(4,2,4,.95)'; GFXr(c, -w / 2 - T * 0.06, -h / 2 - T * 0.06, w + T * 0.12, h + T * 0.12, T * 0.12); c.fill();
      if (gr.el === 'fire') { const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#FFB050'); g.addColorStop(0.5, '#E2521A'); g.addColorStop(1, '#7A1C08'); c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#2A1A12'; for (let i = 0; i < 6; i++) c.fillRect(-w / 2 + (i + 0.35) * w / 6, -h / 2, Math.max(1.5, T * 0.07), h); c.strokeStyle = '#B08A48'; }
      else { const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, '#DDF6FF'); g.addColorStop(0.45, '#5FA8E0'); g.addColorStop(1, '#1A3A6A'); c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(0.6, T * 0.025); c.beginPath(); c.moveTo(-w * 0.4, -h * 0.3); c.lineTo(-w * 0.05, h * 0.05); c.lineTo(w * 0.3, -h * 0.35); c.moveTo(-w * 0.05, h * 0.05); c.lineTo(w * 0.1, h * 0.45); c.stroke(); c.strokeStyle = '#A8B8CC'; }
      c.lineWidth = Math.max(1.4, T * 0.07); GFXr(c, -w / 2, -h / 2, w, h, T * 0.08); c.stroke(); c.restore(); }
    // the channels: a dark groove with a dull core line (the light of the live ones is the GPU's)
    for (const ch of CHAN) { let near = false; for (const p of ch.pts) if (Math.abs(p[0] - x - 0.5) < 2 && Math.abs(p[1] - y - 0.5) < 2) { near = true; break; } if (!near) continue;
      const path = () => { c.beginPath(); ch.pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); };
      c.lineJoin = 'round'; c.lineCap = 'round'; path(); c.strokeStyle = 'rgba(4,2,6,.92)'; c.lineWidth = Math.max(3, T * 0.3); c.stroke(); c.strokeStyle = ch.el === 'fire' ? '#5A2A10' : '#1A3A5A'; c.lineWidth = Math.max(1.5, T * 0.14); c.stroke();
      c.strokeStyle = ch.el === 'fire' ? 'rgba(255,150,70,.35)' : 'rgba(140,210,255,.35)'; c.lineWidth = Math.max(0.6, T * 0.03); c.stroke(); }
    // the inscription band near the rim: glyphs inlaid in gold (west) and pale silver-blue (east)
    if (d1 > 7.7 && d0 < 8.6) { const n = 96; for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU, q = [cp[0] + Math.cos(a) * 8.2 * T, cp[1] + Math.sin(a) * 8.2 * T]; if (q[0] < X - T * 0.4 || q[0] > X + T * 1.4 || q[1] < Y - T * 0.4 || q[1] > Y + T * 1.4) continue;
        c.save(); c.translate(q[0], q[1]); c.rotate(a + PI / 2); c.strokeStyle = Math.cos(a) < 0 ? '#B8884A' : '#9EB4CE'; c.lineWidth = Math.max(0.8, T * 0.04); c.beginPath(); const v = Math.floor(hh(i, 9, 2) * 4), s = T * 0.14;
        if (v === 0) { c.moveTo(-s * 0.5, -s); c.lineTo(-s * 0.5, s); c.moveTo(s * 0.5, -s); c.lineTo(s * 0.5, s); c.moveTo(-s, -s); c.lineTo(s, -s); } else if (v === 1) { c.arc(0, 0, s * 0.7, 0, TAU); c.moveTo(0, -s); c.lineTo(0, s); } else if (v === 2) { c.moveTo(-s, s); c.lineTo(0, -s); c.lineTo(s, s); c.moveTo(-s * 0.5, 0); c.lineTo(s * 0.5, 0); } else { c.moveTo(-s, 0); c.lineTo(s, 0); c.moveTo(-s * 0.6, -s); c.lineTo(s * 0.6, s); }
        c.stroke(); c.restore(); }
      c.strokeStyle = 'rgba(6,4,8,.8)'; c.lineWidth = Math.max(1, T * 0.04); for (const r of [7.82, 8.58]) { c.beginPath(); c.arc(cp[0], cp[1], r * T, 0, TAU); c.stroke(); } }
    // the pillars' sockets in the floor: heavy rings (gold for the fire ones, platinum for the ice)
    for (const p of PIL0) { if (Math.hypot(x + 0.5 - p.x, y + 0.5 - p.y) > 2.3) continue; const q = P(p.x, p.y), gq = c.createRadialGradient(q[0], q[1], 0, q[0], q[1], 1.35 * T); gq.addColorStop(0, 'rgba(4,2,6,.7)'); gq.addColorStop(0.7, 'rgba(10,6,14,.55)'); gq.addColorStop(1, 'rgba(10,6,14,.25)'); c.fillStyle = gq; c.beginPath(); c.arc(q[0], q[1], 1.35 * T, 0, TAU); c.fill(); c.strokeStyle = p.el === 'fire' ? '#B08A48' : '#A8B8CC'; c.lineWidth = Math.max(1.2, T * 0.07); c.beginPath(); c.arc(q[0], q[1], 1.35 * T, 0, TAU); c.stroke();
      for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; c.fillStyle = p.el === 'fire' ? '#8A6A38' : '#7A8AA0'; c.beginPath(); c.arc(q[0] + Math.cos(a) * 1.18 * T, q[1] + Math.sin(a) * 1.18 * T, Math.max(0.8, T * 0.05), 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = Math.max(0.6, T * 0.03); c.beginPath(); c.arc(q[0], q[1], 1.38 * T, PI, PI * 1.7); c.stroke(); }
    // toward the rim the stone takes its half's light from below (molten west, cold east)
    { const r = Math.hypot(x + 0.5 - CC.x, y + 0.5 - CC.y) / CR; if (r > 0.7) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = k < 0.5 ? `rgba(120,40,10,${(0.16 * cl((r - 0.7) / 0.3)).toFixed(3)})` : `rgba(20,60,120,${(0.16 * cl((r - 0.7) / 0.3)).toFixed(3)})`; c.fillRect(X, Y, T, T); c.restore(); } }
    c.restore(); }
  function GFXr(c, x, y, w, h, r) { if (typeof GFX !== 'undefined' && GFX.rr) GFX.rr(c, x, y, w, h, r); else { c.beginPath(); c.rect(x, y, w, h); } }
  const GRATES = [[PI - 0.55, 7.0], [PI + 0.05, 7.25], [PI + 0.62, 7.0], [PI * 0.62, 5.9]].map(([a, r]) => ({ el: 'fire', x: CC.x + Math.cos(a) * r, y: CC.y + Math.sin(a) * r, a: a + PI / 2 }))
    .concat([[-0.55, 7.0], [0.05, 7.25], [0.62, 7.0], [PI * 0.38, 5.9]].map(([a, r]) => ({ el: 'ice', x: CC.x + Math.cos(a) * r, y: CC.y + Math.sin(a) * r, a: a + PI / 2 })));
  // the bridge to the sanctum: a deck of dark titanium plates between gold (west) and platinum (east) rails
  function bridgeTile(c, X, Y, T, x, y) { c.fillStyle = '#1C1A22'; c.fillRect(X, Y, T, T); c.fillStyle = '#26232E'; c.fillRect(X + T * 0.06, Y + T * 0.06, T * 0.88, T * 0.88); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = Math.max(1, T * 0.04); c.strokeRect(X + T * 0.06, Y + T * 0.06, T * 0.88, T * 0.88);
    c.fillStyle = 'rgba(255,255,255,.06)'; c.fillRect(X + T * 0.1, Y + T * 0.1, T * 0.8, T * 0.08);
    if (x === 20) { c.fillStyle = '#B08A48'; c.fillRect(X, Y, Math.max(2, T * 0.12), T); } if (x === 22) { c.fillStyle = '#A8B8CC'; c.fillRect(X + T - Math.max(2, T * 0.12), Y, Math.max(2, T * 0.12), T); }
    if (x === 21) { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(200,220,255,.10)'; c.fillRect(X + T * 0.42, Y, T * 0.16, T); c.restore(); } }
  // the chamber's edge, laid over each chunk after its floors: outside the circle is cut away (the abyss shows), a metal lip, and
  // under its near half the platform's thickness in strata of gold-bronze (west) and platinum-cobalt (east), lit from below
  const EDGE = []; for (let y = 28; y < MH; y++) for (let x = 0; x < MW; x++) { let n = 0; for (const [a, b] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (Math.hypot(a - CC.x, b - CC.y) <= CR) n++; if (n > 0 && n < 4) EDGE.push([x, y]); }
  function chamberEdge(c, T, d) {
    const x0 = d && d.n ? d.cx * d.n - 1 : -9, x1 = d && d.n ? (d.cx + 1) * d.n : 99, y0 = d && d.n ? d.cy * d.n - 1 : -9, y1 = d && d.n ? (d.cy + 1) * d.n : 99;
    if (y1 < 28) return; const cx = CC.x * T, cy = CC.y * T, R = CR * T;
    for (const [x, y] of EDGE) if (x >= x0 && x <= x1 && y >= y0 && y <= y1 && !onBridge(x, y)) chamberFloor(c, x * T, y * T, T, x, y);
    // cut: everything outside the circle in the chamber's rows, except the bridge
    c.save(); c.beginPath(); c.rect(-T * 4, 29.0 * T, (MW + 8) * T, (MH - 25) * T); c.arc(cx, cy, R, 0, TAU, true); c.rect(20 * T, 29.0 * T, 3 * T, 1.2 * T); c.clip('evenodd'); c.globalCompositeOperation = 'destination-out'; c.fillStyle = '#000'; c.fillRect(-T * 4, 29.0 * T, (MW + 8) * T, (MH - 25) * T); c.restore();
    // the strata under the near half
    const TH = 1.15; c.save(); c.beginPath(); c.rect(-T * 4, cy, (MW + 8) * T, R + TH * T + T); c.clip(); c.beginPath(); c.arc(cx, cy, R, 0, PI); c.lineTo(cx - R, cy + TH * T); c.arc(cx, cy + TH * T, R, PI, 0, true); c.closePath();
    const g = c.createLinearGradient(cx - R, 0, cx + R, 0); g.addColorStop(0, '#5A3A20'); g.addColorStop(0.46, '#3A2A24'); g.addColorStop(0.54, '#2A303C'); g.addColorStop(1, '#3A4A62'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); for (const k of [0.25, 0.5, 0.78]) { c.strokeStyle = k > 0.6 ? 'rgba(255,200,140,.22)' : 'rgba(6,4,6,.55)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.arc(cx, cy + TH * k * T, R, 0.05, PI - 0.05); c.stroke(); }
      const gl = c.createLinearGradient(0, cy + R * 0.4, 0, cy + R + TH * T); gl.addColorStop(0, 'rgba(0,0,0,0)'); gl.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = gl; c.fillRect(cx - R - T, cy, R * 2 + T * 2, R + TH * T + T);
      c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const a = 0.08 + i / 26 * (PI - 0.16), X2 = cx + Math.cos(a) * R, Y2 = cy + Math.sin(a) * R, col = Math.cos(a) < 0 ? '255,140,60' : '120,200,255', gg = c.createLinearGradient(0, Y2 + TH * 0.4 * T, 0, Y2 + TH * T); gg.addColorStop(0, `rgba(${col},0)`); gg.addColorStop(1, `rgba(${col},.35)`); c.strokeStyle = gg; c.lineWidth = Math.max(1, T * 0.045); c.beginPath(); c.moveTo(X2, Y2 + TH * 0.4 * T); c.lineTo(X2, Y2 + TH * T); c.stroke(); }
    c.restore(); c.restore();
    // the lip
    c.save(); c.lineWidth = Math.max(1.5, T * 0.08); for (const [a0, a1, col] of [[PI * 0.5, PI * 1.5, '#9A7A42'], [-PI * 0.5, PI * 0.5, '#8E9EB4']]) { c.strokeStyle = col; c.beginPath(); c.arc(cx, cy, R - T * 0.05, a0, a1); c.stroke(); }
    c.strokeStyle = 'rgba(6,4,8,.85)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.arc(cx, cy, R - T * 0.14, 0, TAU); c.stroke(); c.restore(); }
  // the sanctum's own floor when the boss's land is not built in (a plain celestial stone; GB's 'equinox' land paints the real one)
  function arenaFloor(c, X, Y, T, x, y) { const k = ss(-1.4, 1.4, x + 0.5 - BA.x); c.fillStyle = mixHx('#2A2230', '#1E2432', k); c.fillRect(X, Y, T, T); c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(1, T * 0.04); c.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
    const d = Math.hypot(x + 0.5 - BA.x, y + 0.5 - BA.y); if (Math.abs(d - 4) < 0.6 || Math.abs(d - 8) < 0.6) { c.fillStyle = 'rgba(255,240,200,.07)'; c.fillRect(X, Y, T, T); } }

  /* ======================= the lands and the backdrop ======================= */
  const noCliff = () => {};
  const land = (name, o) => Object.assign({ name, rift: true, tile: 'heaven', out: false, dark: 0, bg: '#05040C', gap: 'gemvoid', ambient: 'motes', accent: GOLD_HI, light: '#F2E8FF', hazard: 'holy', grade: null, fog: '#05040C', darkRGB: '4,3,10', props: [], deco: GOLD_HI, mud: ['#2A2230', '#1E1A28'] }, o);
  BIOMES.gemchamber = land('Chamber of Twin Dragons', { floorFn: (c, X, Y, T, h, h2, x, y) => chamberFloor(c, X, Y, T, x, y), cliffTint: noCliff, floor: ['#2A2028', '#2A2028', '#2A2028'], grout: '#0A0810', hi: '#5A5068', top: '#3A3046', face: '#2A2236', faceD: '#141020', cliff: '#1A1424', bridgeCol: '#26232E' });
  BIOMES.gemarena = land('The Equinox Sanctum', { floorFn: (c, X, Y, T, h, h2, x, y) => { const B = typeof GEMINI_BOSS !== 'undefined' && GEMINI_BOSS && GEMINI_BOSS.floor; if (B) { try { B(c, X, Y, T, x, y); return; } catch (e) {} } arenaFloor(c, X, Y, T, x, y); }, cliffTint: noCliff, floor: ['#26202E', '#26202E', '#26202E'], grout: '#0A0810', hi: '#5A5068', top: '#3A3046', face: '#2A2236', faceD: '#141020', cliff: '#1A1424' });
  for (const id of ['gemchamber', 'gemarena']) { if (!BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = '4,3,10'; }
  if (typeof window !== 'undefined') { window.DECAL_EXT = window.DECAL_EXT || {}; DECAL_EXT.ggedge = (c, d, s, lw, T) => chamberEdge(c, T, d); }
  /* the far view: the Sepulchre's own (SEP_SKY, 20s5) in a land of this gate's ('gemchamber'): its galleries, stopped dials and gear
     wheels under a starfield of the cosmic abyss, the horizon's radiance turned white-gold; added once (its pictures are SEP_SKY's,
     cached and given back with the rest of the rift's) */
  function skyLand() { const D = typeof SEP_SKY !== 'undefined' ? SEP_SKY : null; if (!D || !D.LANDS || !D.LANDS.sepulchre) return null; if (D.LANDS.gemchamber) return D; const S0 = D.LANDS.sepulchre;
    D.LANDS.gemchamber = Object.assign({}, S0, { stars: true, radiance: '#E8DCFF', base: '#03030A',
      sky: [[-1.7, '#010108'], [-1.1, '#030412'], [-0.7, '#070920'], [-0.42, '#0E1030'], [-0.2, '#18163C'], [-0.08, '#2A2248'], [-0.025, '#4A3A5A'], [0, '#6A5470'], [0.025, '#3E3050'], [0.1, '#1C1838'], [0.3, '#0E0E28'], [0.7, '#06071A'], [1.2, '#03040E'], [1.7, '#010206']],
      strips: [], _z: null,   /* (no galleries: the abyss stays open; its dials and gears hang and stand in the void) */
      veils: [{ y: -0.5, w: 34, h: 1.8, col: '#4A4070', a: 0.22, spd: 0.4 }, { y: 4.4, w: 40, h: 3, col: '#22224A', a: 0.3, spd: 0.3 }, { y: 11, w: 46, h: 4.4, col: '#181838', a: 0.3, spd: 0.25 }, { y: -7, w: 40, h: 3, col: '#2A2448', a: 0.18, spd: 0.3 }], motes: '#E8E0FF' });
    return D; }
  let CUR = null;   // (the running stage: the backdrop reads its camera)
  const bossHalf = () => { const C = CUR; if (!C) return false; const ph = C.S.phase; return ph === 'sealing' || ph === 'boss' || ph === 'won' || (C.X && C.X.me && C.X.me.y < 27.5); };
  if (typeof window !== 'undefined') { window.GAP_EXT = window.GAP_EXT || {};
    GAP_EXT.gemvoid = { base: '#05040C',
      paint(c, S, R) { c.fillStyle = '#07061A'; c.fillRect(0, 0, S, S); for (let i = 0; i < 46; i++) { c.fillStyle = `rgba(230,225,255,${0.2 + R() * 0.5})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.1 ? 1.2 : 0.6, 0, TAU); c.fill(); } },
      back(c, o) {   /* v469 GB: no hand-over to another far view at the door any more (it popped in): one backdrop, world-anchored, plain dark behind the sanctum (below) */
        const { W, H, t, wx, wy, k } = o, C = CUR, T = C && C.X ? C.X.Tz() : 40, sx = x => W / 2 + x * T - wx, sy = y => H / 2 + y * T - wy, D = skyLand();
        if (D) { const V = { W, H, T, sx, sy, t, land: 'gemchamber', light: 'halls', hy: 26.5, top: 4.5, span: 29, k: k || 1 }; try { D.vista(c, V, { gpu: !!(C && C.X) && W_.__GG_SKYGL !== 0 && (W_.__GG_SKYGL === 1 || hqOn()) }); }   /* (the far view's own GPU light (its veils, the radiance) only at High: elsewhere its pictures stay and the gate's own far machines carry the light: a pass and a copy saved) */ catch (e) { c.fillStyle = '#07061A'; c.fillRect(0, 0, W, H); } }
        else { const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#03030C'); g.addColorStop(1, '#141030'); c.fillStyle = g; c.fillRect(0, 0, W, H); }
        // the far machines beyond the rims: an artificial sun in gold rings (west), a frozen planet in platinum rings (east)
        const F = fgx(); if (F && C && C.X) { try { const Q = F.begin(c, null), lf = lowFx(); for (const m of FARM) { const X = sx(m.x), Y = sy(m.y), R = m.r * T; if (X < -R * 3 || X > W + R * 3 || Y < -R * 3 || Y > H + R * 3) continue;
              if (m.fire) { Q.glow(X, Y, R * 3.2, '#FF8A3A', 0.18); Q.shape(472, X, Y, R * 1.7, 0, 0, R * 1.7, '#FFFFFF', 0.95, 1 / 1.7, 0.7, 1.0, 0, 1); } else { Q.glow(X, Y, R * 3.0, '#3FA8FF', 0.16); Q.shape(473, X, Y, R * 1.6, 0, 0, R * 1.6, '#FFFFFF', 0.95, 1 / 1.6, PI, 1.0, 0, 1); }
              const sp = t * (m.fire ? 0.25 : -0.2); Q.quad(468, X, Y, R * 1.6, 0, 0, R * 1.6 * 0.42, m.fire ? '#C8984A' : '#B8C8DC', 0.9, 0.82, m.fire ? 1 : 2, sp); if (!lf) Q.quad(468, X, Y, 0, R * 1.35, R * 1.35 * 0.5, 0, m.fire ? '#A87A3A' : '#98A8C0', 0.8, 0.8, 0, -sp * 1.4); }
            F.flush(c); } catch (e) {} }
        /* v469 GB: behind the Equinox Sanctum the void is empty (the user: "have the background behind the arena empty"): the far view
           fades into the plain dark north of the door, fixed in the world (screen = world - camera), so nothing appears or switches as
           the pet walks in */
        { const yF = sy(DARK_Y0), yT = sy(DARK_Y1); if (yT > 0) { c.save(); c.fillStyle = '#05040C'; if (yF > 0) c.fillRect(0, 0, W, Math.min(H, yF)); if (yT > yF && yF < H) { const g = c.createLinearGradient(0, yF, 0, yT); g.addColorStop(0, 'rgba(5,4,12,1)'); g.addColorStop(1, 'rgba(5,4,12,0)'); c.fillStyle = g; c.fillRect(0, Math.max(0, yF), W, Math.min(H, yT) - Math.max(0, yF)); } c.restore(); } } } };
  }
  const hqOn = () => { try { return typeof RAZIEL_GL !== 'undefined' && RAZIEL_GL.hq ? !!RAZIEL_GL.hq() : !lowFx(); } catch (e) { return false; } };
  const FARM = [{ x: CC.x - 24, y: 34, r: 3.2, fire: true }, { x: CC.x + 24, y: 36, r: 2.8, fire: false }];   // v469 GB: beside the chamber (north of the door the void is empty)
  const DARK_Y0 = 25.0, DARK_Y1 = 30.5;   // v469 GB: the void plain dark north of y DARK_Y0, the far view fading in to y DARK_Y1 (the door's foot 26.5, the bridge 27..29)

  /* ======================= the stand-in guardian (when GEMINI_BOSS is missing or fails): an ordinary lesser boss ======================= */
  const STANDIN = (() => { let S = null;
    function begin(X, H, self, A) { stop(); S = { X, A, m: null, won: false };
      X.after(1.0, () => { if (!S || S.X !== X) return; const B = BOSSES.find(b => b.id === 'spider') || BOSSES[0], ST = X.ST(); const m = X.lesserBoss(A.cx, A.cy - 2, 1, '', B); if (!m) return; S.m = m;
        m.bname = 'The Equinox Warden'; m.glow = ICE_HI; m.aggro = true; m.hp = m.maxhp = Math.max(m.hp, Math.round((ST.atk || 10) * 160)); m.dmg = Math.max(m.dmg || 1, (ST.hp || 100) * 0.045);
        X.flash(0.4, '#FFFFFF'); X.shake(7, 0.5); X.banner('THE EQUINOX WARDEN', 'A warden of the twin heavens holds the sanctum', ICE_HI, 3, true, true); }); }
    function update() { if (!S || !S.m || S.won) return; if (S.m.dead) { S.won = true; const X = S.X; X.banner('THE SANCTUM FALLS SILENT', 'Gemini wakes', GOLD_HI, 3, true, true); X.flash(0.5, '#FFFFFF'); X.sfx.fanfare(); X.after(2.6, () => { try { X.winStage(); } catch (e) {} }); } }
    function stop() { if (!S) return; try { if (S.m && !S.m.dead) S.m.dead = true; } catch (e) {} S = null; }
    return { begin, update, stop, drawGround() {}, drawOver() {}, cam: () => null, hideHud: () => false, onBossDeath: () => false, active: () => !!S, goal: () => { const m = S && S.m; return !m ? 'Something stirs in the sanctum' : m.dead ? 'Gemini wakes' : `The Equinox Warden ${Math.max(0, Math.ceil(m.hp / m.maxhp * 100))}%`; } }; })();
  const AB = () => { if (W_.__GG_BOSS) return W_.__GG_BOSS; if (W_.__GG_NOBOSS === 1) return null; return typeof GEMINI_BOSS !== 'undefined' && GEMINI_BOSS ? GEMINI_BOSS : STANDIN; };
  const RS = () => (typeof riftState === 'function' ? riftState() : (st.rift || (st.rift = { seals: {}, prog: {}, gates: {} })));
  const ckOn = () => { try { const r = RS(); return !!(r.gck && r.gck.sepulchre); } catch (e) { return false; } };

  /* ======================= the numbers (every timing and damage a design choice; damage as shares of the pet's own health) ======================= */
  const CFG = { track: 2.0, lock: 0.8, breath: 1.2, rec: 1.0, rest: 0.8, turn: 2.6, reach: 24, w0: 0.5, w1: 1.15, wd: 11,
    breakT: 0.4, heal: 0.6, hitK: 0.12, shockR: 2.6, shockT: 0.7, shockK: 0.2, frostLife: 3.6, frostR: 1.25, frostK: 0.03, frostTick: 0.7,
    off: [2.0, 0.9], pzR: 2.1, pzCharge: 2.4, pzLock: 1.5, pzFire: 1.3, pzHit: 3.0, pzK: 0.3, quiet: 2.0, unfold: 2.2, wake: 2.4, cine: 9.6, open: 5.6 };

  /* ======================= the stage ======================= */
  defGate('sepulchre', {
    name: 'Clash of the Twins', biome: 'gemchamber', goal: 'Bait the twin guardians\' breath into the pillars, resolve the Paradox, then face Raziel beyond the gate',
    how: 'Two mechanical dragon heads guard the chamber: Lux breathes fire, Umbra breathes ice. Your attacks cannot harm the six pillars, but their breath can: fire breaks Ice pillars, ice breaks Fire pillars (a matching breath is absorbed). A guardian tracks you, then locks its aim (its eyes flash and the line turns into a bright band): stand behind a pillar of the opposite element as it locks, then dodge out of the band. Three trials, then The Paradox: stand on the Gemini sign, let both lock on it, and get clear before their streams collide. Beyond the opened gate, Raziel waits. A loss there restarts at the open gate.',
    layout: LAYOUT,
    legend: { D: { tile: T_SOLID } },
    preload(P) { const out = []; try { const D = skyLand(); if (D && P && P.F) out.push(...D.warm(P)); } catch (e) {}
      try { if (P && P.gl) { out.push(() => { try { const G = GGd(); if (G) G.warm(); } catch (e) {} }); } } catch (e) {}
      try { const B = AB(); if (B && typeof B.preload === 'function') out.push(...(B.preload(P) || [])); else if (B && typeof B.warm === 'function') out.push(() => { try { B.warm(); } catch (e) {} }); } catch (e) {}
      return out; },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g;
      const S = { phase: 'puzzle', t: 0, open: 0, openT: 0, sealT: 0, passable: false, fade: 1, emb: 0.4, embK: 0.4, live: [1, 1, 1, 1, 1, 1], dt: 0.016 };
      const R = { st: 'intro', stT: 0, stage: 0, t: 0, pz: null, cine: null, hold: false, msgT: 0, broke: 0, shocks: [], frost: [], hurtT: 0, frostT: 0, fx: [], hits: { breath: 0, shock: 0, frost: 0, pz: 0 }, attempts: 0, log: [] };
      // the lands: the chamber and its void in GP's land, the sanctum's floor in the boss's ('equinox' when GB's file is in, else 'gemarena')
      { const ci = BIOME_ORDER.indexOf('gemchamber'), ai = BIOME_ORDER.indexOf(BIOMES.equinox ? 'equinox' : 'gemarena'); for (let y = 0; y < MH; y++) for (let x = 0; x < M.MW; x++) M.BI[y * M.MW + x] = onArenaTile(x, y) ? ai : ci; }
      if (M.decalsByChunk && typeof DunWorld !== 'undefined') { const CHn = DunWorld.CH || 8; for (let cy = Math.floor(28 / CHn); cy <= Math.floor((MH - 1) / CHn); cy++) for (let cx = 0; cx <= Math.floor((M.MW - 1) / CHn); cx++) { const key = cx + ',' + cy, L = M.decalsByChunk.get(key) || []; L.push({ kind: 'ggedge', x: 0, y: 0, s: 1, rot: 0, cx, cy, n: CHn }); M.decalsByChunk.set(key, L); } }
      M.fill = T_GAP; for (let y = 0; y < MH; y++) for (let x = 0; x < M.MW; x++) if (x === 0 || y === 0 || x === M.MW - 1 || y === MH - 1) X.setTile(x, y, T_GAP);
      if (typeof DunWorld !== 'undefined' && DunWorld.PROPS && !DunWorld.PROPS.ggnone) DunWorld.PROPS.ggnone = () => {};
      for (const [x, y] of DOOR) { X.setTile(x, y, T_SOLID); M.props.set(y * M.MW + x, 'ggnone'); }
      try { X.F.name = 'The Gemini Gate'; } catch (e) {}
      CUR = { X, S, R };
      try { if (typeof GEMINI_BOSS !== 'undefined' && GEMINI_BOSS && typeof GEMINI_BOSS.attach === 'function') GEMINI_BOSS.attach(X); } catch (e) {}   // (the boss's far view reads X before its fight begins)
      const note = (f, d, ty, v, f1, dl) => { try { if (X.sfx && X.sfx.note) X.sfx.note(f, d, ty, v, f1, dl); } catch (e) {} };
      const sfx = n => { try { if (X.sfx[n]) X.sfx[n](); } catch (e) {} };
      const ST = () => X.ST();
      const hurt = (k, src, msg) => { if (me.dead || g.won) return false; const d = Math.max(1, Math.round((ST().hp || 100) * k)); const r = X.hurtPet(d, null, src || null); if (r && msg && R.msgT <= 0) { R.msgT = 2.2; X.text(me.x, me.y - 1.6, msg, WHITE, 12); } return r; };

      /* ---- the pillars ---- */
      const PIL = PIL0.map(p => Object.assign({}, p, { up: false, rise: 0, hit: 0, absorb: 0, broken: false, fall: 0, jolt: 0, seed: hh(p.x * 7, p.y * 3, 5) * 6, exp: 0, dark: 0 }));
      const pById = id => PIL.find(p => p.id === id);
      const live = p => p.up && p.rise > 0.85 && !p.broken;
      function raise(p) { if (p.up || p.broken) return; p.up = true; p.riseT = 0; X.shake(5, 1.2); sfx('thud'); note(70, 2.2, 'sine', 0.22); note(140, 1.6, 'triangle', 0.06, 210, 0.3); }
      function breakPillar(p, el) { if (!p || p.broken || !p.up) return false; p.broken = true; p.brokeT = 0; p.by = el; R.broke++; S.live[p.sock] = 0; R.log.push(['break', p.id, R.t.toFixed(2)]);
        X.shake(9, 0.7); X.flash(0.18, p.el === 'fire' ? '#DDF6FF' : '#FFE0B0'); sfx('crack'); note(p.el === 'fire' ? 1240 : 180, 1.2, 'triangle', 0.12, p.el === 'fire' ? 620 : 90); note(98, 1.8, 'sine', 0.2, 55, 0.12);
        X.banner(`${p.el === 'fire' ? 'FIRE' : 'ICE'} PILLAR DESTROYED`, `Pillars destroyed: ${R.broke}/6 · a channel to the gate goes dark`, p.el === 'fire' ? ICE_HI : FIRE_HI, 1.8, true);
        R.fx.push({ k: 'burst', x: p.x, y: p.y, el: p.el, t: 0, life: 2.0 }); if (!lowFx()) R.fx.push({ k: 'steam', x: p.x, y: p.y, t: 0, life: 2.6, r: 2.2 });
        check(); return true; }
      /* ---- the guardians ---- */
      const mkG = side => Object.assign({ side, el: side === 'L' ? 'fire' : 'ice', name: side === 'L' ? 'Lux' : 'Umbra', st: 'dormant', tt: 0, aim: GU0[side].base, lockA: null, jaw: 0.1, charge: 0, recoil: 0, awake: 0, aw: 0, ring: 0.3, reach: 0, lift: 0, dead: 0, tremble: 0, unfold: 0, frost: 0, melt: 0, erupt: 0, lockFlash: 0, cd: 0, n: 0, yaw: GU0[side].base, pitch: 0.4, tgt: null, path: null, hitT: 0, wake: 0, t: 0 }, GU0[side]);
      const GU = { L: mkG('L'), R: mkG('R') }, GL2 = [GU.L, GU.R];
      const rigOf = G => { const GG = GGd(); return GG ? GG.solveGuardian(G) : null; };
      // the mouth's floor point (world): from the rig (pure geometry) or, with no GL file, a fixed point by the bastion
      function mouthOf(G) { const r = rigOf(G); if (r) return r.mouth; const sg = G.side === 'L' ? 1 : -1; return { x: G.mx + sg * 6.4, y: G.my, h: 3.2 }; }
      // the breath's path: from the mouth's floor point along angle a: half-width w(d), clipped by the first live pillar in it and by the rim
      const wOf = d => CFG.w0 + (CFG.w1 - CFG.w0) * Math.min(1, Math.max(0, d) / CFG.wd);
      function pathOf(G, a, o0, noPil) { const o = o0 || mouthOf(G), dx = Math.cos(a), dy = Math.sin(a); let end = CFG.reach, hitP = null;
        { const fx = o.x - CC.x, fy = o.y - CC.y, b = fx * dx + fy * dy, c2 = fx * fx + fy * fy - (CR + 0.6) * (CR + 0.6), disc = b * b - c2; if (disc > 0) end = Math.min(end, -b + Math.sqrt(disc)); }
        if (!noPil) for (const p of PIL) { if (!live(p)) continue; const px = p.x - o.x, py = p.y - o.y, d = px * dx + py * dy; if (d <= 0 || d > end) continue; const perp = Math.abs(px * dy - py * dx), lim = PR + wOf(d) * 0.7; if (perp >= lim) continue;
          const de = Math.max(0.2, d - Math.sqrt(Math.max(0, PR * PR - Math.min(perp, PR * 0.99) ** 2)) * 0.8); if (de < end) { end = de; hitP = p; } }
        return { ox: o.x, oy: o.y, oh: o.h, a, dx, dy, end, hit: hitP, ex: o.x + dx * end, ey: o.y + dy * end }; }
      const inPath = (P2, x, y, pad) => { const px = x - P2.ox, py = y - P2.oy, d = px * P2.dx + py * P2.dy; if (d < 0.3 || d > P2.end) return false; return Math.abs(px * P2.dy - py * P2.dx) < wOf(d) + (pad || 0); };
      function aimAt(G, x, y) { const o = mouthOf(G); return Math.atan2(y - o.y, x - o.x); }
      function headTo(G, x, y, dt, k) { const o = rigOf(G), hx = o ? o.head.x : G.mx, hy = o ? o.head.y : G.my; const SEk = GGd() ? GGd().SE : 0.58, want = Math.atan2((y - hy) / SEk, x - hx), d = angD(want, G.yaw);   /* (a model-space heading: a world tile along y is 1 / SE model units) */ G.yaw += d * Math.min(1, dt * (k || 5)); const dist = Math.hypot(x - hx, y - hy); G.pitch += (clamp(0.05 + 1.4 / Math.max(2, dist), 0.05, 0.4) - G.pitch) * Math.min(1, dt * 4); }
      function wakeG(G, roar) { if (G.st !== 'dormant' && G.st !== 'sleep') return; G.st = 'wake'; G.tt = 0; G.cd = 0;
        if (roar) { X.shake(8, 1.4); sfx('hum'); note(G.side === 'L' ? 110 : 98, 2.0, 'sawtooth', 0.12, G.side === 'L' ? 82 : 147); note(G.side === 'L' ? 55 : 49, 2.4, 'sine', 0.22); note(G.side === 'L' ? 330 : 660, 1.0, 'triangle', 0.05, null, 0.4); } }
      function sleepG(G) { G.st = 'sleep'; G.tt = 0; G.charge = 0; G.path = null; G.lockA = null; }
      function lockSound(G) { note(G.side === 'L' ? 880 : 1175, 0.12, 'square', 0.1); note(G.side === 'L' ? 440 : 587, 0.18, 'square', 0.08, null, 0.06); note(220, 0.3, 'triangle', 0.08, 110, 0.08); sfx('blip'); }
      // one guardian's attack cycle: track -> lock -> breath -> recover -> rest (each its CFG time, game time)
      function runG(G, dt) {
        G.t = R.t; G.tt += dt; G.lockFlash = Math.max(0, G.lockFlash - dt * 2.5); G.recoil = Math.max(0, G.recoil - dt * 2.2);
        const want = G.st === 'dormant' || G.st === 'sleep' ? 0 : 1; G.awake += (want - G.awake) * Math.min(1, dt * (want ? 1.4 : 0.9));
        if (G.st === 'dormant' || G.st === 'sleep') { G.jaw += (0.05 - G.jaw) * Math.min(1, dt * 2); G.charge = Math.max(0, G.charge - dt * 1.5); G.ring += (0.15 - G.ring) * Math.min(1, dt); return; }
        if (G.st === 'wake') { G.jaw = 0.1 + 0.7 * Math.sin(Math.min(1, G.tt / CFG.wake) * PI) ; G.ring += ((R.stage === 3 ? 2.2 : 1.3) - G.ring) * Math.min(1, dt * 1.5); headTo(G, CC.x, CC.y, dt, 2); if (G.tt >= CFG.wake) { G.st = 'rest'; G.tt = 0; G.cd = G.wait || 0.4; G.wait = 0; } return; }
        G.ring += ((R.stage === 3 ? 2.2 : 1.3) - G.ring) * Math.min(1, dt);
        if (G.st === 'rest') { G.jaw += (0.15 - G.jaw) * Math.min(1, dt * 3); G.charge = Math.max(0, G.charge - dt * 2); headTo(G, me.x, me.y, dt, 2.5); if ((G.cd -= dt) <= 0 && G.active && !me.dead) { G.st = 'track'; G.tt = 0; G.aim = aimAt(G, me.x, me.y); G.n++; } return; }
        if (G.st === 'track') { const want2 = aimAt(G, me.x, me.y), d = angD(want2, G.aim), mx2 = CFG.turn * dt; G.aim += clamp(d, -mx2, mx2);
          headTo(G, me.x, me.y, dt, 6); G.charge = Math.min(1, G.tt / CFG.track) * 0.75; G.jaw = 0.15 + 0.45 * ease(G.tt / CFG.track); G.path = pathOf(G, G.aim);
          if (G.tt >= CFG.track) { G.st = 'lock'; G.tt = 0; G.lockA = G.aim; G.lockO = mouthOf(G); G.lockFlash = 1; lockSound(G); X.text(G.side === 'L' ? me.x - 0.6 : me.x + 0.6, me.y - 1.8, 'LOCKED', G.side === 'L' ? FIRE_HI : ICE_HI, 13); R.log.push(['lock', G.name, R.t.toFixed(2), +G.lockA.toFixed(3)]); }
          return; }
        if (G.st === 'lock') { G.charge = 0.75 + 0.25 * ease(G.tt / CFG.lock); G.jaw = 0.6 + 0.3 * ease(G.tt / CFG.lock); G.path = pathOf(G, G.lockA, G.lockO); const o = G.lockO; headTo(G, o.x + Math.cos(G.lockA) * 8, o.y + Math.sin(G.lockA) * 8, dt, 6);
          if (G.tt >= CFG.lock) { G.st = 'breath'; G.tt = 0; G.recoil = 0.6; G.hitT = 0; G.frostT = 0; X.shake(6, CFG.breath); if (G.el === 'fire') { note(90, CFG.breath + 0.3, 'sawtooth', 0.09, 60); sfx('whoosh'); } else { note(1400, CFG.breath, 'sine', 0.05, 900); sfx('hiss') ; } } return; }
        if (G.st === 'breath') { G.charge = 1; G.jaw = 1; const P2 = G.path = pathOf(G, G.lockA, G.lockO); const o = G.lockO; headTo(G, o.x + Math.cos(G.lockA) * 8, o.y + Math.sin(G.lockA) * 8, dt, 6);
          // the pillar in its path: the opposite element breaks it, the matching one drinks it in
          if (P2.hit) { const p = P2.hit; if (p.el !== G.el) { p.hit = Math.min(1, p.hit + dt / CFG.breakT); p.exp += dt; p.jolt = 1; if (p.hit >= 1) breakPillar(p, G.el); } else { p.absorb = 1; if (!p.toldAbs) { p.toldAbs = 1; X.text(p.x, p.y - 4.2, `${p.el === 'fire' ? 'Fire' : 'Ice'} absorbs ${G.el === 'fire' ? 'fire' : 'ice'}`, G.el === 'fire' ? FIRE_HI : ICE_HI, 12); } } }
          // the pet in its exposed path takes ordinary damage (the dodge's grace, as every hit)
          if (!me.dead && inPath(P2, me.x, me.y, (me.r || 0.3) * 0.5)) { G.hitT -= dt; if (G.hitT <= 0) { G.hitT = 0.3; if (hurt(CFG.hitK, null, G.el === 'fire' ? 'Burned!' : 'Frozen!')) { R.hits.breath++; if (G.el === 'ice') me.chill = Math.max(me.chill || 0, 1.0); } } }
          // Umbra's breath leaves frost where it meets the floor (the Frozen Trial and after)
          if (G.el === 'ice' && R.stage >= 2) { G.frostT -= dt; if (G.frostT <= 0) { G.frostT = 0.38; const ds = [P2.end - 0.6, 2.5 + hh(R.frost.length, G.n, 3) * Math.max(0, P2.end - 4)]; for (const d of ds) { const fx2 = P2.ox + P2.dx * d, fy2 = P2.oy + P2.dy * d; if (!inChamber(fx2, fy2) || R.frost.some(f => Math.hypot(f.x - fx2, f.y - fy2) < 1.2)) continue; if (PIL.some(p => live(p) && Math.hypot(p.x - fx2, p.y - fy2) < PR + 0.8)) continue; if (R.frost.length < 8) R.frost.push({ x: fx2, y: fy2, t: 0, life: CFG.frostLife, r: CFG.frostR, sd: hh(R.frost.length, 9, G.n) * 9 }); } } }
          if (G.tt >= CFG.breath) { G.st = 'rec'; G.tt = 0; G.path = null; } return; }
        if (G.st === 'rec') { G.charge = Math.max(0, 1 - G.tt / 0.4); G.jaw = lerp(0.9, 0.15, ease(G.tt / CFG.rec)); headTo(G, CC.x, CC.y, dt, 1.2); if (G.tt >= CFG.rec) { G.st = 'rest'; G.tt = 0; G.cd = G.wait != null && G.wait > 0 ? G.wait : CFG.rest; G.wait = 0; if (G.lockA != null) { G.lockA = null; } } return; }
      }
      // twin cataclysm: Umbra's cycle starts CFG.off[n] after Lux's (2 s, then 1.1 s: every other pair the breaths overlap)
      function stagger() { const L = GU.L, U2 = GU.R; if (R.stage !== 3 || !L.active || !U2.active) return; if (L.st === 'track' && L.tt < 0.05 && U2.st === 'rest') { U2.cd = Math.max(U2.cd, CFG.off[(L.n - 1) % 2]); } if (L.st === 'rest' && U2.st !== 'rest') L.cd = Math.max(L.cd, 0.4); }
      /* ---- the hazards: Thermal Shock where two live breaths cross; frost patches ---- */
      function hazards(dt) {
        const A = GU.L.st === 'breath' && GU.L.path, B2 = GU.R.st === 'breath' && GU.R.path;
        if (A && B2) { const q = segX([A.ox, A.oy], [A.ex, A.ey], [B2.ox, B2.oy], [B2.ex, B2.ey]); if (q && inChamber(q[0], q[1]) && !R.shocks.some(s => s.t < 1.3)) { R.shocks.push({ x: q[0], y: q[1], t: 0, hit: false, sd: R.t % 7 }); X.shake(10, 0.6); X.flash(0.2, '#FFFFFF'); sfx('crash'); note(196, 1.0, 'sawtooth', 0.08, 98); note(1568, 0.5, 'sine', 0.06, 784); R.log.push(['shock', q[0].toFixed(1), q[1].toFixed(1)]); if (!R.toldShock) { R.toldShock = 1; X.banner('THERMAL SHOCK', 'Where fire and ice cross, the air bursts: get clear of the ring', WHITE, 2.0, true); } } }
        for (const s of R.shocks) { s.t += dt; const r = CFG.shockR * eout(s.t / CFG.shockT); if (!s.hit && s.t < CFG.shockT + 0.2 && !me.dead && Math.hypot(me.x - s.x, me.y - s.y) < r + (me.r || 0.3) * 0.4) { if (hurt(CFG.shockK, null, 'Thermal Shock!')) { s.hit = true; R.hits.shock++; } } }
        for (let i = R.shocks.length - 1; i >= 0; i--) if (R.shocks[i].t > 1.6) R.shocks.splice(i, 1);
        let inF = false; for (const f of R.frost) { f.t += dt; if (f.t < f.life - 0.6 && Math.hypot(me.x - f.x, me.y - f.y) < f.r) inF = true; }
        for (let i = R.frost.length - 1; i >= 0; i--) if (R.frost[i].t >= R.frost[i].life) R.frost.splice(i, 1);
        if (inF && !me.dead) { me.chill = Math.max(me.chill || 0, 0.25); R.frostT -= dt; if (R.frostT <= 0) { R.frostT = CFG.frostTick; if (!me.dodge) { const ok = hurt(CFG.frostK, null, null); if (ok) R.hits.frost++; } } } else R.frostT = Math.min(R.frostT, 0.2);
      }
      function clearHaz() { R.frost.length = 0; R.shocks.length = 0; for (const G of GL2) { G.path = null; G.lockA = null; if (G.st !== 'dormant' && G.st !== 'sleep') { G.st = 'rest'; G.tt = 0; G.cd = 1.0; } G.charge = 0; } }

      /* ---- the trial's states ---- */
      function setSt(s) { R.st = s; R.stT = 0; R.log.push(['st', s, R.t.toFixed(2)]); }
      function startStage(n) { R.stage = n; clearHaz(); for (const p of PIL) if (p.st === n) raise(p);
        if (n === 1) { GU.L.active = true; GU.R.active = false; wakeG(GU.L, true); X.banner('CLASH OF THE TWINS', 'Bait Lux\'s fire breath into the Ice pillars', FIRE_HI, 3.4, true, true); }
        if (n === 2) { GU.L.active = false; sleepG(GU.L); GU.R.active = true; wakeG(GU.R, true); X.banner('THE FROZEN TRIAL', 'Bait Umbra\'s ice breath into the Fire pillars', ICE_HI, 3.2, true, true); }
        if (n === 3) { GU.L.active = true; GU.R.active = true; GU.L.st = GU.L.st === 'sleep' || GU.L.st === 'dormant' ? 'dormant' : GU.L.st; wakeG(GU.L, true); GU.R.st = 'dormant'; wakeG(GU.R, false); GU.L.wait = 0.4; GU.R.wait = CFG.off[0] + 0.4; GU.L.reachW = 1; GU.R.reachW = 1; X.banner('TWIN CATACLYSM', 'Destroy the remaining pillars using opposing elements', WHITE, 3.2, true, true); }
        setSt('s' + n); }
      function check() { const n = R.stage; if (!n || n > 3) return; const left = PIL.filter(p => p.st === n && !p.broken).length; if (left) return;
        if (n === 1) { setSt('t1'); GU.L.active = false; X.after(1.4, () => { if (R.st === 't1') { sleepG(GU.L); X.banner('THE INFERNAL TRIAL IS PASSED', 'Two channels fall dark · Lux sleeps · Umbra stirs', FIRE_HI, 2.4, true); } }); }
        if (n === 2) { setSt('t2'); GU.R.active = false; X.after(1.4, () => { if (R.st === 't2') { sleepG(GU.R); S.emb = 1.2; X.banner('THE FROZEN TRIAL IS PASSED', 'Four of six channels dark · the Gemini sign begins to glow', ICE_HI, 2.4, true); } }); }
        if (n === 3) { setSt('quiet'); GU.L.active = false; GU.R.active = false; R.frost.length = 0; X.after(0.6, () => { try { if (X.sfx.duck) X.sfx.duck(0.4, 1.6); } catch (e) {} }); } }
      function paradoxStep(dt) {
        const st = R.st, T2 = R.stT, both = GL2;
        if (st === 'quiet') { for (const G of both) { G.reach += (-0.6 - G.reach) * Math.min(1, dt * 1.5); G.lift += (-0.4 - G.lift) * Math.min(1, dt * 1.5); G.charge = Math.max(0, G.charge - dt); G.path = null; G.ring += (0.2 - G.ring) * Math.min(1, dt); G.st = G.st === 'sleep' || G.st === 'dormant' ? G.st : 'idle'; }
          if (T2 >= CFG.quiet) { setSt('unfold'); for (const G of both) { G.st = 'para'; G.tt = 0; } X.banner('THE PARADOX', 'Lure both dragons into attacking the centre', WHITE, 3.2, true, true); X.shake(6, 2); sfx('hum'); note(65, 3, 'sine', 0.22); note(98, 2.6, 'triangle', 0.08, 131); } return; }
        if (st === 'unfold') { const u = ease(T2 / CFG.unfold); S.emb = 1.4; for (const G of both) { G.unfold = u; G.reach = lerp(-0.6, 1.45, u); G.lift = lerp(-0.4, -0.15, u); G.ring += (3.0 - G.ring) * Math.min(1, dt); headTo(G, CC.x, CC.y, dt, 3); G.jaw = 0.25; }
          if (T2 >= CFG.unfold) { setSt('pwait'); R.pz = { n: 0 }; } return; }
        const inZ = Math.hypot(me.x - CC.x, me.y - CC.y) < CFG.pzR;
        if (st === 'pwait') { for (const G of both) { headTo(G, me.x, me.y, dt, 2); G.charge = Math.max(0, G.charge - dt); G.jaw += (0.25 - G.jaw) * Math.min(1, dt * 2); G.path = null; }
          if (inZ && !me.dead && T2 > 0.4) { setSt('pcharge'); R.attempts++; note(131, CFG.pzCharge, 'sawtooth', 0.06, 262); note(1047, CFG.pzCharge, 'sine', 0.03, 523); X.banner('THEY GATHER THEIR STRONGEST BREATH', 'Hold the Gemini sign until they lock on', WHITE, 1.8, true); } return; }
        if (st === 'pcharge') { const u = T2 / CFG.pzCharge; for (const G of both) { G.charge = Math.min(1, u * 1.05); G.jaw = 0.3 + 0.6 * ease(u); headTo(G, me.x, me.y, dt, 5); G.aim = aimAt(G, me.x, me.y); G.path = pathOf(G, G.aim); }
          if (!inZ || me.dead) { setSt('pfail'); R.pfail = 'left'; for (const G of both) { G.path = null; } X.banner('THE LURE BREAKS', 'Stay on the Gemini sign until both lock on', ICE_HI, 2.0, true); sfx('wrong'); return; }
          if (T2 >= CFG.pzCharge) { setSt('plock'); for (const G of both) { G.lockA = aimAt(G, CC.x, CC.y); G.lockFlash = 1; G.path = Object.assign(pathOf(G, G.lockA), {}); lockSound(G); }
            X.banner('BOTH LOCKED ON THE GEMINI SIGN', 'GET CLEAR NOW', WHITE, CFG.pzLock, true, true); X.flash(0.15, '#FFFFFF'); } return; }
        if (st === 'plock') { for (const G of both) { G.charge = 1; G.jaw = 0.95; const o = mouthOf(G); headTo(G, CC.x, CC.y, dt, 6); const P2 = pathOf(G, G.lockA), dC = Math.hypot(CC.x - o.x, CC.y - o.y); G.path = Object.assign(P2, { end: Math.min(P2.end, dC), ex: o.x + Math.cos(G.lockA) * Math.min(P2.end, dC), ey: o.y + Math.sin(G.lockA) * Math.min(P2.end, dC) }); }
          if (T2 >= CFG.pzLock) { setSt('pfire'); R.pz.hitDone = false; for (const G of both) { G.recoil = 0.6; } X.shake(10, CFG.pzFire); sfx('whoosh'); note(80, 1.4, 'sawtooth', 0.1, 50); note(1600, 1.2, 'sine', 0.05, 1000); } return; }
        if (st === 'pfire') { for (const G of both) { G.charge = 1; G.jaw = 1; const o = mouthOf(G), dC = Math.hypot(CC.x - o.x, CC.y - o.y), reach = Math.min(dC, dC * ss(0, 0.28, T2)); G.path = { ox: o.x, oy: o.y, oh: o.h, a: G.lockA, dx: Math.cos(G.lockA), dy: Math.sin(G.lockA), end: reach, ex: o.x + Math.cos(G.lockA) * reach, ey: o.y + Math.sin(G.lockA) * reach };
            if (!me.dead && inPath(G.path, me.x, me.y, 0.15)) { G.hitT -= dt; if (G.hitT <= 0) { G.hitT = 0.35; if (hurt(CFG.hitK, null, G.el === 'fire' ? 'Burned!' : 'Frozen!')) R.hits.breath++; } } }
          if (T2 >= 0.3 && !R.pz.hitDone) { R.pz.hitDone = true; const inside = Math.hypot(me.x - CC.x, me.y - CC.y) < CFG.pzHit && !me.dead;
            if (inside) { R.pfail = 'caught'; if (!me.dodge) me.inv = 0; const ok = hurt(CFG.pzK, null, 'Caught in the convergence!');   /* (the convergence's blow is its own: the streams' grace frames do not swallow it) */ if (ok) R.hits.pz++; R.shocks.push({ x: CC.x, y: CC.y, t: 0, hit: true, sd: 3, big: 1 }); X.flash(0.4, '#FFFFFF'); X.shake(14, 0.8); sfx('crash'); setSt('pfail'); X.banner('CAUGHT IN THE CONVERGENCE', 'Their streams tear apart · get clear after the lock next time', ICE_HI, 2.4, true); return; }
            startCine(); } return; }
        if (st === 'pfail') { for (const G of both) { G.charge = Math.max(0, G.charge - dt * 0.8); G.jaw += (0.25 - G.jaw) * Math.min(1, dt * 2); G.path = null; headTo(G, CC.x, CC.y, dt, 2); } if (T2 >= 1.8) setSt('pwait'); return; }
      }
      /* ---- the convergence and the gate ---- */
      function startCine() { setSt('cine'); R.cine = { t: 0 }; R.hold = true; S.emb = 2; clearHazOnly(); R.log.push(['cine', R.t.toFixed(2)]); X.flash(0.35, '#FFFFFF'); note(65, 6, 'sine', 0.2); }
      function clearHazOnly() { R.frost.length = 0; R.shocks.length = 0; }
      function cineStep(dt) { const C = R.cine; C.t += dt; const t = C.t, both = GL2;
        for (const G of both) { const o = mouthOf(G), dC = Math.hypot(CC.x - o.x, CC.y - o.y); G.lockA = aimAt(G, CC.x, CC.y);
          const on = t < 4.7; G.path = on ? { ox: o.x, oy: o.y, oh: o.h, a: G.lockA, dx: Math.cos(G.lockA), dy: Math.sin(G.lockA), end: dC, ex: CC.x, ey: CC.y } : null; G.charge = on ? 1 : Math.max(0, G.charge - dt * 0.5);
          G.tremble = ss(1.4, 2.2, t) * (1 - ss(6.0, 7.0, t)); G.ring = t < 4.6 ? lerp(3, 9, ss(1.4, 3.6, t)) : lerp(9, 0, ss(6.4, 8.6, t)); G.erupt = ss(1.6, 2.6, t) * (1 - ss(5.4, 6.8, t)); G.unfold = Math.min(1.6, 1 + ss(2.0, 3.6, t) * 0.6);
          if (t > 6.4) { G.dead = ss(6.4, 9.0, t); G.reach = lerp(1.45, -0.5, ss(6.6, 9.0, t)); G.jaw = lerp(1, 0.35, ss(6.4, 8.0, t)); if (G.el === 'fire') G.frost = ss(6.8, 9.2, t); else G.melt = ss(6.8, 9.2, t); } }
        if (t > 3.6 && t - dt <= 3.6) { try { if (X.sfx.duck) X.sfx.duck(0.15, 1.2); if (typeof music !== 'undefined' && music.duck) music.duck(0.25, 1.4); } catch (e) {} note(2093, 1.0, 'sine', 0.04, 4186); }
        if (t > 4.7 && t - dt <= 4.7) { X.flash(0.8, '#FFFFFF'); X.shake(18, 1.6); sfx('crash'); sfx('thud'); note(41, 3.4, 'sine', 0.32); note(82, 2.8, 'sawtooth', 0.1, 41); note(1318, 1.6, 'triangle', 0.06, 659); S.live = [0, 0, 0, 0, 0, 0]; }
        if (t > 6.8 && t - dt <= 6.8) { X.banner('PARADOX RESOLVED', 'Their opposing elements neutralise each other', WHITE, 2.6, true, true); sfx('thud'); }
        if (t >= CFG.cine) { R.cine = null; startOpen(); } }
      const doorSet = open => { for (const [x, y] of DOOR) X.setTile(x, y, open ? T_FLOOR : T_SOLID); S.passable = open; try { X.retile(); } catch (e) {} };
      function startOpen() { if (S.phase !== 'puzzle') return; S.phase = 'opening'; setSt('opening'); S.openT = 0; if (X.prepTiles) X.prepTiles(DOOR.map(([x, y]) => [x, y, T_FLOOR])); X.flash(0.25, '#E8F0FF'); sfx('fanfare'); note(131, 4, 'sine', 0.18); note(196, 4, 'sine', 0.1, null, 0.5); setCk(); try { const B = AB(); if (B && typeof B.warm === 'function') B.warm(); } catch (e) {} }
      function opened() { S.phase = 'open'; setSt('open'); R.hold = false; if (g.cineT > 0 && R.ownCine) g.cineT = 0; R.ownCine = false; X.banner('THE GEMINI GATE IS OPEN', 'Beyond it waits the Equinox Sanctum · enter when ready', GOLD_HI, 3.2, true, true); }
      function setCk() { try { const r = RS(); r.gck = r.gck || {}; if (!r.gck.sepulchre) { r.gck.sepulchre = 1; if (typeof saveSoon === 'function') saveSoon(); } X.text(GATE.x, GATE.y + 2, 'Checkpoint', GOLD_HI, 14); } catch (e) {} }
      function seal() { if (S.phase !== 'open') return; S.phase = 'sealing'; S.sealT = 0; if (X.prepTiles) X.prepTiles(SEALT.map(([x, y]) => [x, y, T_SOLID])); sfx('whoosh'); }
      const arenaA = () => ({ cx: BA.x, cy: BA.y, r: BR, door: { x: BA.x, y: 26.5 }, entry: { x: me.x, y: me.y }, checkpoint: !!R.fromCk, sectors: 8,
        inside: (x, y) => Math.hypot(x - BA.x, y - BA.y) < BR - 0.3 && y < 26.9, solid: () => false, light: k => { S.arenaK = clamp(+k || 0, 0, 2); } });
      function sealed() { if (me.y > 26.4) me.y = 26.3; for (const [x, y] of SEALT) X.setTile(x, y, T_SOLID); try { X.retile(); } catch (e) {} X.shake(9, 0.5); sfx('thud'); note(98, 2.4, 'sine', 0.3); note(49, 2.8, 'sine', 0.2);
        const B = AB(); if (B && typeof B.begin === 'function') { S.phase = 'boss'; X.banner('THE GATE SEALS BEHIND YOU', 'The Equinox Sanctum', GOLD_HI, 2.2, true, true); try { B.begin(X, H, self, arenaA()); } catch (e) { if (typeof console !== 'undefined') console.error(e); try { STANDIN.begin(X, H, self, arenaA()); W_.__GG_FELL = 1; } catch (e2) { win(); } } }
        else win(); }
      function win() { if (self.done) return; self.done = true; S.phase = 'won'; X.banner('GEMINI WAKES', 'The twin heavens answer', GOLD_HI, 2.8, true, true); X.flash(0.4, '#FFFFFF'); sfx('fanfare'); X.after(2.4, () => X.winStage()); }

      /* ---- the checkpoint: the gate already open (pillars down, guardians shut down), the pet before the door ---- */
      if (ckOn()) { R.fromCk = true; for (const p of PIL) { p.up = true; p.rise = 1; p.broken = true; p.fall = 1; p.brokeT = 9; } R.broke = 6; S.live = [0, 0, 0, 0, 0, 0]; for (const G of GL2) { G.st = 'off'; G.awake = 1; G.dead = 1; G.reach = -0.5; G.unfold = 1.6; G.frost = G.el === 'fire' ? 1 : 0; G.melt = G.el === 'ice' ? 1 : 0; G.ring = 0; G.jaw = 0.35; }
        S.phase = 'open'; S.open = 1; S.passable = true; for (const [x, y] of DOOR) { X.setTile(x, y, T_FLOOR); } try { X.retile(); } catch (e) {} me.x = CKPT.x; me.y = CKPT.y; R.st = 'open'; S.emb = 1.0;
        X.after(0.6, () => X.banner('CHECKPOINT', 'The Gemini Gate stands open · Raziel waits beyond it', GOLD_HI, 3.0, true, true)); }
      else { X.after(0.8, () => { if (R.st === 'intro') startStage(1); }); }
      X.after(0.3, () => { try { const G = GGd(); if (G && glOn()) G.warm(); } catch (e) {} });   // (the machines' buffers uploaded before they are first seen, if the loading screen could not)

      /* ---- the turn ---- */
      function update(dt) { R.t += dt; S.t += dt; S.dt = dt; R.stT += dt; R.msgT -= dt; S.embK += (S.emb - S.embK) * Math.min(1, dt * 1.5);
        for (const p of PIL) { if (p.up && p.rise < 1) { p.riseT += dt; p.rise = cl(p.riseT / 2.2); } p.absorb = Math.max(0, p.absorb - dt * 1.6); p.jolt = Math.max(0, p.jolt - dt * 3);
          if (!p.broken && p.hit > 0) { const working = GL2.some(G => G.st === 'breath' && G.path && G.path.hit === p && G.el !== p.el); if (!working) p.hit = Math.max(0, p.hit - dt * CFG.heal); }
          if (p.broken) { p.brokeT = (p.brokeT || 0) + dt; p.fall = cl(p.brokeT / 1.8); p.dark = cl(p.brokeT / 1.6); } }
        // pillars are solid: the pet is pushed out of a standing pillar's base
        for (const p of PIL) { if (!p.up || p.rise < 0.4 || (p.broken && p.fall > 0.6)) continue; const dx = me.x - p.x, dy = me.y - p.y, d = Math.hypot(dx, dy), lim = PR * (p.broken ? 0.7 : 0.95) + (me.r || 0.3) * 0.6; if (d < lim && d > 1e-4) { me.x = p.x + dx / d * lim; me.y = p.y + dy / d * lim; } }
        // a machine the pet stands behind grows faint (the pet stays in sight): a pillar's frame, a guardian's head and neck
        for (const p of PIL) { const bh = p.up && me.y < p.y - 0.1 && me.y > p.y - 4.6 && Math.abs(me.x - p.x) < 1.8; p.alpha = (p.alpha == null ? 1 : p.alpha) + ((bh ? 0.42 : 1) - (p.alpha == null ? 1 : p.alpha)) * Math.min(1, dt * 6); }
        for (const G of GL2) { const r = rigOf(G), hx = r ? r.head.x : G.mx, hy = r ? r.head.y : G.my, mxx = r ? r.mouth.x : hx, bh = me.y < hy + 0.6 && me.y > hy - 5.5 && (me.x - Math.min(hx, mxx) > -2.2) && (Math.max(hx, mxx) - me.x > -2.2); G.alpha = (G.alpha == null ? 1 : G.alpha) + ((bh ? 0.5 : 1) - (G.alpha == null ? 1 : G.alpha)) * Math.min(1, dt * 5); }
        if (R.hold) { g.cineT = Math.max(g.cineT || 0, 0.1); R.ownCine = true; me.vx = me.vy = 0; }
        if (S.phase === 'puzzle') {
          if (R.st === 't1' && R.stT > 3.2) startStage(2); else if (R.st === 't2' && R.stT > 3.2) startStage(3);
          if (/^s[123]$/.test(R.st)) { for (const G of GL2) runG(G, dt); stagger(); hazards(dt); for (const G of GL2) G.reach += ((R.stage === 3 ? 0.55 : 0) - G.reach) * Math.min(1, dt); }
          else if (R.st === 't1' || R.st === 't2') { for (const G of GL2) runG(G, dt); hazards(dt); }
          else if (R.st === 'cine') cineStep(dt);
          else if (R.st !== 'intro') { paradoxStep(dt); hazards(dt); for (const G of GL2) { G.t = R.t; G.lockFlash = Math.max(0, G.lockFlash - dt * 2.5); G.recoil = Math.max(0, G.recoil - dt * 2.2); } }
          for (const G of GL2) G.t = R.t; }
        for (const f of R.fx) f.t += dt; for (let i = R.fx.length - 1; i >= 0; i--) if (R.fx[i].t >= R.fx[i].life) R.fx.splice(i, 1);
        if (S.phase === 'opening') { S.openT += dt; S.open = ss(0.6, CFG.open - 0.6, S.openT); if (S.open > 0.7 && !S.passable) doorSet(true); if (S.openT > 1.0 && S.openT - dt <= 1.0) { X.shake(6, 2.4); note(65, 3, 'sine', 0.22); } if (S.openT >= CFG.open) opened(); }
        if (S.phase === 'open') { if (me.y < 26.4 && Math.abs(me.x - BA.x) < 3 && !me.dead) seal(); }
        if (S.phase === 'sealing') { S.sealT += dt; if (S.sealT >= 1.3) sealed(); }
        // the gate grows faint while the pet (or the boss) stands behind it
        { const boss = g.boss && !g.boss.dead ? g.boss : null, behind = (x, y, w) => y < GATE.y - 0.1 && y > GATE.y - 6.5 && Math.abs(x - GATE.x) < w; const hid = behind(me.x, me.y, 4.6) || (boss && behind(boss.x, boss.y, 4.6 + (boss.r || 1))); S.fade += ((hid ? 0.4 : 1) - S.fade) * Math.min(1, dt * 6); }
        if (S.phase === 'boss') { const B = AB(); if (B && typeof B.update === 'function') { try { B.update(dt); } catch (e) { if (typeof console !== 'undefined') console.error(e); } } } }

      /* ---- drawing ---- */
      const V = () => ({ sx: X.sx, sy: X.sy, T: X.Tz(), t: R.t, defer: true });   // (defer: the machines' light is laid with the air's, one FGFX batch)
      const onScr = (x, y, r) => { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y); return Xs > -r * T && Xs < X.W() + r * T && Ys > -r * T && Ys < X.H() + r * T; };
      // the machines, each an object drawn in depth by its feet
      const gObj = side => H.obj({ x: GU[side].mx, y: GU[side].my + 1.2, kind: 'ggguard', r: 0, label: '', draw(c) { const G = GU[side]; if (!onScr(G.mx + (side === 'L' ? 4 : -4), G.my, S.phase === 'boss' || S.phase === 'won' ? 6 : 12)) { G.anc = null; return; } const GG = GGd(); const A = glOn() && GG ? GG.guardian(c, G, V()) : null; G.anc = A; if (!A || !A.drew) guard2D(c, G); } });
      gObj('L'); gObj('R');
      for (const p of PIL) H.obj({ x: p.x, y: p.y + 0.05, kind: 'ggpillar', r: 0, label: '', p, draw(c, Xs, Ys, T, o) { const q = o.p; if (!q.up || !onScr(q.x, q.y, 6)) return; const GG = GGd(), gl = glOn() && GG; if (gl && q.broken && q.fall >= 1) return;   /* (a collapsed one's rubble is laid with the others' in one pass: rubbleGL) */ const done = gl && GG.pillar(c, q, V()); if (!done) pillar2D(c, q); } });
      const RUB = [];
      function rubbleGL(c) { const GG = GGd(); if (!glOn() || !GG) return; RUB.length = 0; for (const p of PIL) if (p.broken && p.fall >= 1 && onScr(p.x, p.y, 4)) RUB.push(p); if (RUB.length) GG.rubble(c, RUB, V()); }
      const GD = { x: GATE.x, y: GATE.y, live: S.live, open: 0, glow: 0, alpha: 1, anc: null };
      const gateObj = H.obj({ x: GATE.x, y: GATE.y + 0.4, kind: 'gggate', r: 0, label: '', draw(c) { GD.anc = null; const inFight = S.phase === 'boss' || S.phase === 'won'; if (!onScr(GATE.x, GATE.y - 3, inFight ? 3.5 : 9)) return;   /* (in the boss's fight: only while it is really in view) */ const GG = GGd(), D = Object.assign(GD, { live: S.live, open: S.open, glow: R.broke / 6 + (S.phase !== 'puzzle' ? 1 : 0), alpha: S.fade });
        const done = glOn() && GG && GG.gate(c, D, V()); if (!done) { GD.anc = null; gate2D(c, D); } } });
      // the air: the breaths, their flares, the bursts, the convergence (over everything on the floor)
      H.obj({ x: CC.x, y: 999, kind: 'ggair', r: 0, label: '', draw(c) { drawAir(c); } });
      void gateObj;

      // the floor's light: the emblem and its rings, the channels, the grates, the inscriptions, the targeting lines, frost, rings
      function lightGround(c) { const F = fgx(); if (!F) return false; const T = X.Tz(), t = R.t, lf = lowFx(), X2 = FXP(); let Q = null; const q = () => Q || (Q = F.begin(c, null));
        const cx = X.sx(CC.x), cy = X.sy(CC.y), e = S.embK;
        if (onScr(CC.x, CC.y, 5)) { const Q2 = q(); const sp = t * (0.25 + 0.5 * e) + (R.st === 'cine' ? R.cine.t * 2 : 0);
          Q2.glow(cx, cy, T * 3.8, '#B8A0FF', 0.08 + 0.12 * e); if (X2) { X2.seal(Q2, cx, cy, T * 2.2, 'L', 1, sp * 0.5, 0.22 + 0.3 * e, 1); X2.seal(Q2, cx, cy, T * 1.7, 'R', 1, -sp * 0.6, 0.18 + 0.28 * e, 1); }
          Q2.quad(468, cx, cy, T * RINGS[1] * 1.16, 0, 0, T * RINGS[1] * 1.16, '#C8984A', 0.9, 0.86, 0, sp); Q2.quad(468, cx, cy, T * RINGS[0] * 1.16, 0, 0, T * RINGS[0] * 1.16, '#B8C8DC', 0.9, 0.84, 0, -sp * 1.3);
          if (R.st === 'pwait' || R.st === 'pcharge' || R.st === 'plock' || R.st === 'unfold') { const k = R.st === 'plock' ? 1 : R.st === 'pcharge' ? 0.7 : 0.45, pul = 0.5 + 0.5 * Math.sin(t * (R.st === 'plock' ? 14 : 4));
            Q2.ring(cx, cy, T * CFG.pzR, WHITE, (0.35 + 0.35 * pul) * k, T * 0.14, 1); Q2.glow(cx, cy, T * CFG.pzR * 1.2, '#E8F0FF', 0.18 * k + 0.1 * pul * k, 1);
            if (R.st === 'plock') { Q2.ring(cx, cy, T * CFG.pzHit, '#FFFFFF', 0.4 + 0.4 * pul, T * 0.2, 1); Q2.ring(cx, cy, T * CFG.pzHit * 1.04, '#FFC060', 0.25, T * 0.08, 1); Q2.ring(cx, cy, T * CFG.pzHit * 0.96, '#7FE0FF', 0.25, T * 0.08, 1); } } }
        // the channels: alive they carry light toward the gate (pulses running along), broken they go dark from the pillar to the gate
        for (let i = 0; i < CHAN.length; i++) { const ch = CHAN[i], p = PIL[i], dark = p.broken ? p.dark : 0, col = ch.el === 'fire' ? '#FF8A3A' : '#5FC8FF'; if (dark >= 1 && R.st !== 'cine') continue; const Q2 = q();
          const lit = p.up ? 1 : 0.35; for (let j = 0; j < ch.pts.length - 1; j++) { const a = ch.pts[j], b = ch.pts[j + 1], u = (ch.cum[j] + ch.cum[j + 1]) / 2 / ch.L; if (u < dark) continue; if (!onScr(a[0], a[1], 2) && !onScr(b[0], b[1], 2)) continue; Q2.beam(X.sx(a[0]), X.sy(a[1]), X.sx(b[0]), X.sy(b[1]), T * 0.12, col, 0.45 * lit); }
          if (!lf && p.up && !p.broken) { const u = (t * 0.22 + i * 0.17) % 1, d = u * ch.L; let j = 0; while (j < ch.cum.length - 2 && ch.cum[j + 1] < d) j++; const a = ch.pts[j], b = ch.pts[j + 1], w = (d - ch.cum[j]) / Math.max(1e-4, ch.cum[j + 1] - ch.cum[j]), x = lerp(a[0], b[0], w), y = lerp(a[1], b[1], w); if (onScr(x, y, 1)) Q2.glow(X.sx(x), X.sy(y), T * 0.45, col, 0.5); } }
        // where fire and ice channels cross: steam and white light
        for (const k of CHAN_X) { if (!onScr(k.x, k.y, 2)) continue; const a = PIL[k.i], b = PIL[k.j], on = (a.up && !a.broken ? 1 : 0) * (b.up && !b.broken ? 1 : 0); const Q2 = q(); Q2.glow(X.sx(k.x), X.sy(k.y), T * 0.7, '#FFFFFF', 0.12 + 0.3 * on); if (on && !lf) Q2.smoke(X.sx(k.x), X.sy(k.y) - T * 0.4, T * 0.8, 0.22, k.i * 3 + k.j, '#E8F0FF', 0.4); }
        // the molten grates and the frozen windows, the embers and the mist over them; the inscriptions' light
        for (const gr of GRATES) { if (!onScr(gr.x, gr.y, 2)) continue; const Q2 = q(), X0 = X.sx(gr.x), Y0 = X.sy(gr.y);
          if (gr.el === 'fire') { Q2.glow(X0, Y0, T * 1.4, '#FF6A1E', 0.3 + 0.08 * Math.sin(t * 2 + gr.x)); if (X2) X2.fireField(Q2, X0, Y0, T * 0.75, 1, 0.35, gr.x * 3, 0.5, 0.3); if (X2 && !lf) X2.embers(Q2, X0, Y0 - T * 0.8, T * 1.3, (t * 0.12 + gr.x * 0.1) % 1, 0.55, gr.x * 7, 0.6); }
          else { Q2.glow(X0, Y0, T * 1.3, '#3FA8FF', 0.24); if (X2) X2.iceField(Q2, X0, Y0, T * 0.75, 1, 0.3, gr.y * 3, 0.5); if (!lf) Q2.smoke(X0, Y0 - T * 0.5, T * 1.1, 0.16, gr.y * 5, '#CFEFFF', 0.4); if (X2 && !lf) X2.snow(Q2, X0, Y0 - T * 0.8, T * 1.2, (t * 0.1 + gr.y * 0.1) % 1, 0.45, gr.y * 9, 0.5, 0.8); } }
        if (!lf) for (let i = 0; i < 10; i++) { const a = t * 0.06 + i / 10 * TAU, x = CC.x + Math.cos(a) * 8.2, y = CC.y + Math.sin(a) * 8.2; if (!onScr(x, y, 1)) continue; q().glow(X.sx(x), X.sy(y), T * 0.5, Math.cos(a) < 0 ? '#FFB050' : '#8FD8FF', 0.32); }
        // a standing pillar's light on the floor; a matching breath drunk in; a pillar being broken
        for (const p of PIL) { if (!p.up || !onScr(p.x, p.y, 3)) continue; const Q2 = q(), col = p.el === 'fire' ? '#FF7A2A' : '#4FB8FF', on = p.broken ? 1 - p.dark : 1; Q2.glow(X.sx(p.x), X.sy(p.y), T * 2.0, col, (0.22 + 0.35 * p.absorb) * on * p.rise); if (p.hit > 0.02) Q2.glow(X.sx(p.x), X.sy(p.y), T * 2.4, p.el === 'fire' ? '#BFEFFF' : '#FFC080', 0.4 * p.hit); }
        // frost patches: their boundary clear, frost growing in them, dissolving at their end
        for (const f of R.frost) { if (!onScr(f.x, f.y, 2)) continue; const Q2 = q(), u = f.t / f.life, k = ss(0, 0.15, u) * (1 - ss(0.75, 1, u)), X0 = X.sx(f.x), Y0 = X.sy(f.y); if (X2) X2.iceField(Q2, X0, Y0, T * f.r * 1.05, eout(u * 4), 0.75 * k, f.sd, 1); Q2.ring(X0, Y0, T * f.r, ICE_HI, 0.55 * k, T * 0.07, 1); Q2.glow(X0, Y0, T * f.r, '#9FDFFF', 0.14 * k, 1); }
        // the targeting lines (tracking: narrow and translucent; locked: a wide bright band along the fixed path)
        for (const G of GL2) { const P2 = G.path; if (!P2 || !(G.st === 'track' || G.st === 'lock' || (R.st === 'pcharge' || R.st === 'plock'))) continue; const Q2 = q(), col = G.el === 'fire' ? '#FFB040' : '#7FE0FF', hi = G.el === 'fire' ? '#FFE2A0' : '#DDF8FF', x0 = X.sx(P2.ox), y0 = X.sy(P2.oy), x1 = X.sx(P2.ex), y1 = X.sy(P2.ey);
          const full = G.st === 'track' || G.st === 'lock' ? pathOf(G, P2.a, { x: P2.ox, y: P2.oy, h: P2.oh }, true) : P2, xf = X.sx(full.ex), yf = X.sy(full.ey);
          if (G.st === 'track' || R.st === 'pcharge') { const k = G.st === 'track' ? 0.4 + 0.35 * (G.tt / CFG.track) : 0.5, px = X.sx(me.x), py = X.sy(me.y); Q2.beam(x0, y0, px, py, Math.max(1.5, T * 0.1), col, k); Q2.beam(x0, y0, px, py, T * 0.34, col, 0.16 * k); Q2.beam(px, py, xf, yf, Math.max(1, T * 0.06), col, 0.3 * k); Q2.glow(px, py, T * 0.8, col, 0.3 * k); Q2.glow(x0, y0, T * 0.6, col, 0.35 * k); }
          else if (G.st === 'lock') { const u = G.tt / CFG.lock, pul = 0.75 + 0.25 * Math.sin(R.t * 18), w = T * wOf(full.end * 0.5); Q2.beam(x0, y0, xf, yf, w * 2.1, col, (0.2 + 0.12 * u) * pul); Q2.beam(x0, y0, x1, y1, w * 2.1, col, (0.1 + 0.06 * u) * pul); Q2.beam(x0, y0, xf, yf, w * 1.15, hi, (0.24 + 0.16 * u) * pul); Q2.beam(x0, y0, xf, yf, Math.max(1.5, T * 0.1), WHITE, 0.7 * pul); Q2.glow(x1, y1, T * 1.1, col, 0.35 * pul); }
          else { const u = G.st === 'lock' ? G.tt / CFG.lock : R.stT / CFG.pzLock, pul = 0.75 + 0.25 * Math.sin(R.t * 18), w = T * wOf(P2.end * 0.6); Q2.beam(x0, y0, x1, y1, w * 2, col, (0.16 + 0.12 * u) * pul); Q2.beam(x0, y0, x1, y1, w * 1.1, hi, (0.2 + 0.15 * u) * pul); Q2.beam(x0, y0, x1, y1, T * 0.09, WHITE, 0.6 * pul);
            Q2.glow(x1, y1, T * 1.1, col, 0.35 * pul); } }
        // Thermal Shock rings: the hazard's boundary as it grows (white with an orange and a cyan edge: never a red disc)
        for (const s of R.shocks) { if (!onScr(s.x, s.y, 4)) continue; const Q2 = q(), r = CFG.shockR * eout(s.t / CFG.shockT) * (s.big ? 1.3 : 1), k = 1 - ss(0.9, 1.6, s.t), X0 = X.sx(s.x), Y0 = X.sy(s.y); Q2.ring(X0, Y0, T * r, WHITE, 0.6 * k, T * 0.12, 1); Q2.ring(X0, Y0, T * r * 1.05, '#FFB050', 0.35 * k, T * 0.07, 1); Q2.ring(X0, Y0, T * r * 0.95, '#7FE0FF', 0.35 * k, T * 0.07, 1); if (X2) { X2.fireRing(Q2, X0, Y0, T * r, 0.9, 0.5 * k, s.sd, 1); X2.frostRing(Q2, X0, Y0, T * r * 1.08, 0.9, 0.5 * k, s.sd + 2, 1); } }
        if (Q) F.flush(c); return true; }
      function drawAir(c) { const F = fgx(), T = X.Tz(), t = R.t, lf = lowFx(), X2 = FXP(); if (!F || !X2) { air2D(c); return; } const Q = F.begin(c, null);
        // the machines' own light (eyes, conduits, charge; the gate's sockets, its seal and portal): in this one batch
        { const GG = GGd(), v = V(); if (GG) { for (const G of GL2) if (G.anc && G.anc.drew) GG.lights(c, G, G.anc, v, Q); if (GD.anc) GG.gateLights(c, GD, v, Q); } }
        // the breaths: Lux's torrent of celestial fire, Umbra's concentrated blizzard (the ultimate's 469 / 470), from the real mouths
        for (const G of GL2) { const P2 = G.path, br = G.st === 'breath' || R.st === 'pfire' || (R.st === 'cine' && P2); if (!P2 || !br) continue; const A = G.anc, x0 = A && A.mouth ? A.mouth.X : X.sx(P2.ox), y0 = A && A.mouth ? A.mouth.Y : X.sy(P2.oy) - T * P2.oh * 0.81, x1 = X.sx(P2.ex), y1 = X.sy(P2.ey) - T * 0.35;
          const u = G.st === 'breath' ? G.tt / CFG.breath : 0.5, al = Math.min(1, ss(0, 0.08, u) * (1 - ss(0.88, 1, u)) * 1.1 + (R.st === 'cine' ? 0.3 : 0)), w = T * CFG.w1 * (R.st === 'cine' ? 2.2 : 1.75)   /* (the torrent's visible body is about 0.6 of its quad: 1.75 x the far half-width matches the collision cone) */, bend = (G.el === 'fire' ? 0.12 : -0.08) * Math.sin(t * 1.7) + (R.st === 'cine' ? (G.el === 'fire' ? 0.35 : -0.35) * Math.sin(t * 3) : 0), dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 2) continue;
          const hw = w * (1 + Math.abs(bend)); Q.quad(G.el === 'fire' ? 469 : 470, x0 + dx, y0 + dy, dx, dy, -dy / L * hw, dx / L * hw, '#FFFFFF', al, bend / (1 + Math.abs(bend)), G.el === 'fire' ? 3.1 : 5.7, 1);
          X2.charge(Q, x0, y0, T * 0.9, G.el === 'fire' ? 'L' : 'R', 1, 0.9 * al, G.el === 'fire' ? 1 : 2); if (G.el === 'fire' && !lf) Q.shimmer((x0 + x1 * 2) / 3, (y0 + y1 * 2) / 3 - T * 0.4, T * 1.6, 0.25 * al, 0.8, '#FFA640');
          Q.glow(x1, y1 + T * 0.3, T * 1.6, G.el === 'fire' ? '#FF6A1E' : '#3FA8FF', 0.45 * al, 0.6);
          if (P2.hit && R.st !== 'cine') { const p = P2.hit, opp = p.el !== G.el; Q.glow(x1, y1, T * 1.8, opp ? WHITE : (G.el === 'fire' ? '#FFB050' : '#9FE8FF'), (opp ? 0.5 : 0.35) * al); if (opp && !lf) X2.steam(Q, x1, y1 - T * 0.8, T * (1.0 + p.hit), 0.45 * al, p.seed); if (G.el === 'fire' && !lf) X2.embers(Q, x1, y1 - T, T * 1.6, (t * 0.5) % 1, 0.7 * al, 5, 0.7); if (G.el === 'ice' && !lf) X2.snow(Q, x1, y1 - T, T * 1.6, (t * 0.4) % 1, 0.7 * al, 6, 0.7, 0.9); } }
        // the charge gathering (the Paradox: Lux's molten plasma sun, Umbra's cryogenic sphere at their mouths)
        if (R.st === 'pcharge' || R.st === 'plock') for (const G of GL2) { const A = G.anc; if (!A || !A.mouth) continue; const k = G.charge, r = T * (0.5 + 1.1 * k); if (G.el === 'fire') X2.sun(Q, A.mouth.X, A.mouth.Y, r, Math.min(1, k * 1.4), 1, 1.2, 1 + k); else X2.planet(Q, A.mouth.X, A.mouth.Y, r, Math.min(1, k * 1.4), 2, 0.9, 0); Q.glow(A.mouth.X, A.mouth.Y, r * 2.2, G.el === 'fire' ? '#FF8A2A' : '#3FA8FF', 0.3 * k); }
        // a pillar's breaking: steam bursting through its frame, cracks of light, its shock as it collapses
        for (const p of PIL) { if (!p.up || !onScr(p.x, p.y, 4)) continue; const X0 = X.sx(p.x), Y0 = X.sy(p.y) - T * 2.0; if (p.hit > 0.05 && !p.broken) { Q.glow(X0, Y0, T * (1 + p.hit), p.el === 'fire' ? '#CFF2FF' : '#FFD090', 0.35 * p.hit); if (!lf) X2.steam(Q, X0, Y0 - T * 0.4, T * 1.2 * p.hit, 0.35 * p.hit, p.seed + 1); } }
        for (const f of R.fx) { if (!onScr(f.x, f.y, 5)) continue; const u = f.t / f.life, X0 = X.sx(f.x), Y0 = X.sy(f.y);
          if (f.k === 'burst') { if (f.t < 0.25) Q.glow(X0, Y0 - T * 2, T * 3 * (1 + f.t * 3), WHITE, 0.6 * (1 - f.t / 0.25)); X2.shock(Q, X0, Y0 - T * 1.2, T * 3.2, u, 0.9, 3 + f.x, 0.7); if (f.el === 'fire') X2.snow(Q, X0, Y0 - T * 1.6, T * 2.6, u, 1, 7, 1, 0.9); else X2.embers(Q, X0, Y0 - T * 1.6, T * 2.6, u, 1, 7, 1); if (f.el === 'ice') X2.snow(Q, X0, Y0 - T * 1.6, T * 2.2, u, 0.8, 9, 0.8, 0.9); }
          else if (f.k === 'steam' && !lf) X2.steam(Q, X0, Y0 - T * (1.2 + u * 2), T * f.r * (0.7 + u), 0.5 * (1 - u) * ss(0, 0.1, u), f.x); }
        // Thermal Shock bursts (the air part)
        for (const s of R.shocks) { if (!onScr(s.x, s.y, 4)) continue; const u = s.t / 1.6, X0 = X.sx(s.x), Y0 = X.sy(s.y) - T * 0.6, R2 = T * CFG.shockR * (s.big ? 1.6 : 1.2); X2.shock(Q, X0, Y0, R2, u, 1.2, s.sd, 0.8); if (s.t < 0.15) Q.glow(X0, Y0, R2 * 0.7, WHITE, 0.7 * (1 - s.t / 0.15)); if (!lf) X2.steam(Q, X0, Y0 - T * 0.5, R2 * (0.5 + u), 0.4 * (1 - u), s.sd); }
        if (R.st === 'cine') cineFx(Q, T, X2, lf);
        if (S.phase === 'opening' || S.phase === 'open') { const k = S.phase === 'opening' ? S.open : 1, X0 = X.sx(GATE.x), Y0 = X.sy(GATE.y) - T * 3.0; if (!lf) Q.glow(X0, Y0 + T * 2.5, T * 4.5 * k, '#DDE8FF', 0.16 * k, 0.5); }
        F.flush(c); }
      // the convergence: the streams spiral and meet, the white nucleus grows, energy runs back up the streams, it compresses to a point,
      // the colossal Thermal Shock (rings, white-hot light, plasma ribbons, ice fragments, rotating celestial geometry, steam), the quiet after
      function cineFx(Q, T, X2, lf) { const t = R.cine.t, cx = X.sx(CC.x), cy = X.sy(CC.y) - T * 1.2;
        const grow = ss(0.2, 3.2, t) * (1 - ss(3.6, 4.6, t)), pt = ss(3.6, 4.6, t) * (1 - ss(4.6, 4.75, t)), R0 = T * (0.4 + 1.8 * grow) * (1 - 0.85 * pt);
        if (t < 4.7) { Q.shape(474, cx, cy, R0 * 2.0, 0, 0, R0 * 2.0, '#FFFFFF', 0.9 + 0.1 * pt, 0.28, 1, 1 + pt, 0, 1); Q.glow(cx, cy, R0 * 3 + T * pt * 2, WHITE, 0.35 + 0.5 * pt); if (!lf) X2.steam(Q, cx, cy - T * 0.4, T * (1.5 + 2 * grow), 0.4 * grow, 11);
          if (t > 1.4) for (const G of GL2) { const A = G.anc; if (!A || !A.mouth) continue; for (let k = 0; k < 3; k++) { const u = ((t * 1.3 + k / 3) % 1), x = lerp(cx, A.mouth.X, u), y = lerp(cy, A.mouth.Y, u); Q.glow(x, y, T * (0.9 - 0.4 * u), WHITE, 0.6 * ss(1.4, 2.0, t)); } Q.glow(A.collar.X, A.collar.Y, T * 2, G.el === 'fire' ? '#FF3A2A' : '#2A6AFF', 0.4 * G.erupt); } }
        if (t >= 4.7) { const u = cl((t - 4.7) / 3.6), big = T * 13 * eout(u);
          if (u < 0.2) Q.glow(cx, cy, T * 9 * (0.5 + u * 3), WHITE, 0.9 * (1 - u / 0.2));
          X2.shock(Q, cx, cy, big, u, 1.3, 4, 0.75); X2.fireRing(Q, cx, cy + T * 1.2, big * 0.9, eout(u) * 0.95, 1.0 * (1 - u), 5, 0.75); X2.frostRing(Q, cx, cy + T * 1.2, big * 1.02, eout(cl(u * 1.2)) * 0.95, 1.0 * (1 - u), 7, 0.75);
          const sp = t * 2.4; Q.quad(468, cx, cy, big * 0.5, 0, 0, big * 0.5 * 0.55, '#E8C070', 0.9 * (1 - u), 0.86, 1, sp); Q.quad(468, cx, cy, 0, big * 0.36, big * 0.36 * 0.6, 0, '#C8D8EC', 0.9 * (1 - u), 0.84, 2, -sp * 1.4);
          if (!lf) { X2.embers(Q, cx, cy, big * 0.7, u, 1, 9, 1); X2.snow(Q, cx, cy, big * 0.8, u, 1, 13, 1, 0.95); for (let i = 0; i < 3; i++) X2.steam(Q, cx + (i - 1) * T * 3 * u, cy - T * (1 + i), T * (2.5 + 5 * u), 0.45 * (1 - u), 20 + i); }
          for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.3, r0 = big * 0.15, r1 = big * (0.45 + 0.1 * (i % 2)); if (u < 0.7) { const x0 = cx + Math.cos(a) * r0, y0 = cy + Math.sin(a) * r0 * 0.6, x1 = cx + Math.cos(a + 0.4) * r1, y1 = cy + Math.sin(a + 0.4) * r1 * 0.6; X2.trailFire(Q, x0, y0, x1, y1, T * 0.35, 0.8 * (1 - u / 0.7), i); } } } }
      function drawGroundAll(c) { const gl = lightGround(c); if (!gl) ground2D(c); rubbleGL(c); }

      /* ---- the 2D pictures (no GPU painter): simple shapes that keep every rule readable ---- */
      function guard2D(c, G) { const T = X.Tz(), fire = G.el === 'fire', A = rigOf(G), sg = fire ? 1 : -1, bx = X.sx(G.mx), by = X.sy(G.my); c.save();
        c.fillStyle = fire ? '#4A3A2A' : '#2A3444'; c.strokeStyle = INK; c.lineWidth = 2; GFXr(c, bx - T * 1.8, by - T * 4.4, T * 3.6, T * 4.4, T * 0.3); c.fill(); c.stroke();
        const m = A ? A.mouth : { x: G.mx + sg * 6.4, y: G.my, h: 3.2 }, hd = A ? A.head : { x: G.mx + sg * 3.4, y: G.my, h: 3.4 }, hx = X.sx(hd.x), hy = X.sy(hd.y) - T * hd.h * 0.81, mx = X.sx(m.x), my = X.sy(m.y) - T * m.h * 0.81;
        c.strokeStyle = fire ? '#8A6A40' : '#6A7A90'; c.lineWidth = T * 0.7; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx, by - T * 3.2); c.quadraticCurveTo((bx + hx) / 2, by - T * 4.4, hx, hy); c.stroke();
        c.fillStyle = fire ? '#E8D8B8' : '#D8E4F0'; c.strokeStyle = INK; c.lineWidth = 2; c.beginPath(); c.moveTo(hx - sg * T * 0.2, hy - T * 0.7); c.lineTo(mx, my - T * 0.15); c.lineTo(mx, my + T * 0.25 * (1 + G.jaw)); c.lineTo(hx - sg * T * 0.2, hy + T * 0.6); c.closePath(); c.fill(); c.stroke();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.5 * G.awake * (1 - G.dead); blitSized(c, glowSprite(fire ? FIRE_HI : ICE_HI), hx + sg * T * 0.6 - T * 0.5, hy - T * 0.7, T, T); c.restore(); }
      function pillar2D(c, p) { const T = X.Tz(), Xs = X.sx(p.x), Ys = X.sy(p.y), h = T * 3.4 * ease(p.rise) * (1 - 0.75 * ease(p.fall)), fire = p.el === 'fire'; c.save(); c.globalAlpha = p.alpha == null ? 1 : p.alpha; c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(Xs, Ys, T * 1.2, T * 0.5, 0, 0, TAU); c.fill();
        c.fillStyle = fire ? '#8A6A3A' : '#8A9AB0'; c.strokeStyle = INK; c.lineWidth = 2; GFXr(c, Xs - T * 0.7, Ys - h, T * 1.4, h, 6); c.fill(); c.stroke(); if (!p.broken) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7 * (p.alpha == null ? 1 : p.alpha); blitSized(c, glowSprite(fire ? FIRE : ICE), Xs - T * 0.9, Ys - h * 0.75 - T * 0.9, T * 1.8, T * 1.8); }
        if (p.hit > 0.05) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.strokeStyle = fire ? ICE_HI : FIRE_HI; c.lineWidth = 2; c.beginPath(); c.moveTo(Xs - T * 0.3, Ys - h * 0.9); c.lineTo(Xs + T * 0.1, Ys - h * 0.5); c.lineTo(Xs - T * 0.2, Ys - h * 0.2); c.stroke(); } c.restore(); }
      function gate2D(c, D) { const T = X.Tz(), Xs = X.sx(D.x), Ys = X.sy(D.y), R2 = T * 2.6; c.save(); c.globalAlpha = D.alpha; c.strokeStyle = '#B8A070'; c.lineWidth = T * 0.45; c.beginPath(); c.ellipse(Xs, Ys - T * 3, R2, R2 * 0.95, 0, 0, TAU); c.stroke(); c.fillStyle = D.open > 0.05 ? `rgba(220,235,255,${(0.25 + 0.4 * D.open).toFixed(3)})` : 'rgba(20,16,30,.85)'; c.beginPath(); c.ellipse(Xs, Ys - T * 3, R2 * 0.8, R2 * 0.76, 0, 0, TAU); c.fill();
        for (let i = 0; i < 6; i++) { const x = SOCK[i].x; c.fillStyle = D.live[i] ? (i < 3 ? ICE : FIRE) : '#2A2430'; c.beginPath(); c.arc(X.sx(x), X.sy(SOCK[i].y) - T * 0.3, T * 0.2, 0, TAU); c.fill(); } c.restore(); }
      function ground2D(c) { const T = X.Tz(); c.save();
        for (const G of GL2) { const P2 = G.path; if (!P2 || !(G.st === 'track' || G.st === 'lock' || R.st === 'pcharge' || R.st === 'plock')) continue; const col = G.el === 'fire' ? '255,176,64' : '127,224,255', locked = G.st === 'lock' || R.st === 'plock'; c.strokeStyle = `rgba(${col},${locked ? 0.55 : 0.35})`; c.lineWidth = locked ? T * wOf(P2.end * 0.6) * 2 : 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(X.sx(P2.ox), X.sy(P2.oy)); const full = G.st === 'lock' ? pathOf(G, P2.a, { x: P2.ox, y: P2.oy, h: P2.oh }, true) : P2; if (G.st === 'track') c.lineTo(X.sx(me.x), X.sy(me.y)); else c.lineTo(X.sx(full.ex), X.sy(full.ey)); c.stroke(); }
        for (const f of R.frost) { c.fillStyle = 'rgba(190,235,255,.3)'; c.strokeStyle = 'rgba(220,245,255,.8)'; c.lineWidth = 2; c.beginPath(); c.arc(X.sx(f.x), X.sy(f.y), T * f.r, 0, TAU); c.fill(); c.stroke(); }
        for (const s of R.shocks) { const r = CFG.shockR * eout(s.t / CFG.shockT); c.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - ss(0.9, 1.6, s.t))).toFixed(3)})`; c.lineWidth = 3; c.beginPath(); c.arc(X.sx(s.x), X.sy(s.y), T * r, 0, TAU); c.stroke(); }
        if (R.st === 'pwait' || R.st === 'pcharge' || R.st === 'plock') { c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 3; c.beginPath(); c.arc(X.sx(CC.x), X.sy(CC.y), T * (R.st === 'plock' ? CFG.pzHit : CFG.pzR), 0, TAU); c.stroke(); }
        c.restore(); }
      function air2D(c) { const T = X.Tz(); c.save(); c.globalCompositeOperation = 'lighter';
        for (const G of GL2) { const P2 = G.path; if (!P2 || !(G.st === 'breath' || R.st === 'pfire' || R.st === 'cine')) continue; const g2 = c.createLinearGradient(X.sx(P2.ox), X.sy(P2.oy), X.sx(P2.ex), X.sy(P2.ey)), col = G.el === 'fire' ? '255,140,50' : '120,210,255'; g2.addColorStop(0, `rgba(${col},.9)`); g2.addColorStop(1, `rgba(${col},.3)`); c.strokeStyle = g2; c.lineWidth = T * CFG.w1 * 1.6; c.lineCap = 'round'; c.beginPath(); c.moveTo(X.sx(P2.ox), X.sy(P2.oy) - T * 2); c.lineTo(X.sx(P2.ex), X.sy(P2.ey) - T * 0.3); c.stroke(); }
        if (R.st === 'cine') { const u = R.cine.t; c.globalAlpha = 0.6 * (1 - ss(5, 8, u)); blitSized(c, glowSprite('#FFFFFF'), X.sx(CC.x) - T * 6 * ss(0, 5, u), X.sy(CC.y) - T * 6 * ss(0, 5, u), T * 12 * ss(0, 5, u), T * 12 * ss(0, 5, u)); }
        c.restore(); }

      /* ---- the HUD: the trial's panel (pillars, their six signs, the stage), the edge glow of a guardian charging off the screen ---- */
      const STAGE_N = { intro: 'Infernal Trial', s1: 'Infernal Trial', t1: 'Infernal Trial', s2: 'Frozen Trial', t2: 'Frozen Trial', s3: 'Twin Cataclysm' };
      function hud(c) { if (S.phase !== 'puzzle' || R.st === 'cine') return; const W = X.W(), bw = Math.min(250, W - 120), y0 = 124; c.save(); c.fillStyle = 'rgba(6,4,12,.55)'; GFXr(c, 10, y0, bw, 66, 9); c.fill(); c.strokeStyle = 'rgba(232,192,112,.35)'; c.lineWidth = 1; c.stroke();
        c.textAlign = 'left'; c.font = `800 10px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.fillStyle = GOLD_HI; c.fillText('GEMINI GATE — CLASH OF THE TWINS', 18, y0 + 15);
        c.font = `800 11px ${typeof arcFont !== 'undefined' ? arcFont : 'sans-serif'}`; c.fillStyle = WHITE; c.fillText(`Pillars destroyed: ${R.broke}/6`, 18, y0 + 31); c.fillStyle = R.stage === 3 ? WHITE : R.stage === 2 ? ICE_HI : FIRE_HI; c.fillText(STAGE_N[R.st] || 'The Paradox', 18, y0 + 58);
        const order = ['F1', 'F2', 'F3', 'I1', 'I2', 'I3']; order.forEach((id, i) => { const p = pById(id), x = 132 + i * 19 + (i >= 3 ? 6 : 0), y = y0 + 28; sign(c, x, y, p.el, p.broken, p.up && !p.broken); }); c.restore();
        // a guardian charging off the screen: a soft glow at that edge
        for (const G of GL2) { if (!(G.st === 'track' || G.st === 'lock' || G.st === 'breath' || R.st === 'pcharge' || R.st === 'plock')) continue; const A = G.anc, hx = A && A.head ? A.head.X : X.sx(G.mx); if (hx > 60 && hx < W - 60) continue; const left = hx <= W / 2, Hh = X.H(), k = G.st === 'lock' || R.st === 'plock' ? 0.55 + 0.3 * Math.sin(R.t * 18) : 0.35;
          c.save(); const gr = c.createLinearGradient(left ? 0 : W, 0, left ? 36 : W - 36, 0), col = G.el === 'fire' ? '255,150,60' : '110,210,255'; gr.addColorStop(0, `rgba(${col},${k.toFixed(3)})`); gr.addColorStop(1, `rgba(${col},0)`); c.fillStyle = gr; c.fillRect(left ? 0 : W - 36, Hh * 0.2, 36, Hh * 0.6); c.restore(); } }
      function sign(c, x, y, el, broken, lit) { c.save(); c.translate(x, y); c.globalAlpha = broken ? 0.35 : 1; c.lineWidth = 1.6; c.strokeStyle = el === 'fire' ? '#FFB050' : '#8FD8FF'; c.fillStyle = el === 'fire' ? (lit ? '#FF8A2A' : '#5A3018') : (lit ? '#5FC8FF' : '#1A3A5A');
        c.beginPath(); if (el === 'fire') { c.moveTo(0, -7); c.quadraticCurveTo(6, -1, 4, 4); c.quadraticCurveTo(0, 7, -4, 4); c.quadraticCurveTo(-6, -1, 0, -7); } else { for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - PI / 2; c.moveTo(0, 0); c.lineTo(Math.cos(a) * 7, Math.sin(a) * 7); } }
        if (el === 'fire') { c.fill(); c.stroke(); } else { c.stroke(); c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill(); c.stroke(); }
        if (broken) { c.globalAlpha = 1; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-6, -6); c.lineTo(-1, 0); c.lineTo(-3, 2); c.lineTo(6, 7); c.stroke(); } c.restore(); }

      const gateHint = { x: GATE.x, y: GATE.y - 1.5, h: 4.8, label: 'The Gemini Gate' }, embHint = { x: CC.x, y: CC.y + 0.5, h: 1.0, label: 'Stand on the Gemini sign' };
      const mod = { S, R, PIL, GU, CFG, update,
        geo: { CC, CR, BA, BR, GATE, DOOR, SEALT, START, CKPT, PIL0, SOCK, CHAN, CHAN_X, GRATES, GU0, PR },
        stage: n => { for (const p of PIL) if (p.st < n && !p.broken) { p.up = true; p.rise = 1; breakPillar(p, p.el === 'fire' ? 'ice' : 'fire'); } startStage(n); },
        breakPillar: id => breakPillar(pById(id), 'test'), paradox: () => { for (const p of PIL) if (!p.broken) { p.up = true; p.rise = 1; breakPillar(p, 'test'); } R.stage = 3; check(); },
        solve: () => { for (const p of PIL) if (!p.broken) { p.up = true; p.rise = 1; p.broken = true; p.brokeT = 0; S.live[p.sock] = 0; } R.broke = 6; R.stage = 4; clearHaz(); for (const G of GL2) { G.dead = 1; G.st = 'off'; } startOpen(); },
        breathPath: (G, a) => pathOf(G, a), inPath, mouthOf, aimAt, wOf, live, startCine, setSt, check,
        hint() { if (S.phase === 'open') return gateHint; if (R.st === 'pwait' || R.st === 'pfail') return embHint; return null; },
        goal: () => { if (S.phase === 'boss') { const B = AB(); return B && typeof B.goal === 'function' ? B.goal() : 'Face Raziel in the Equinox Sanctum'; }
          if (S.phase === 'won' || self.done) return 'Gemini awakens'; if (S.phase === 'opening') return 'The Gemini Gate opens…'; if (S.phase === 'open') return R.fromCk ? 'Checkpoint · walk through the Gemini Gate' : 'Walk through the Gemini Gate when ready'; if (S.phase === 'sealing') return 'The gate seals behind you';
          if (R.st === 'cine') return 'PARADOX RESOLVED'; if (/^(quiet|unfold|pwait|pcharge|plock|pfire|pfail)$/.test(R.st)) return R.st === 'plock' ? 'The Paradox · LOCKED: get clear of the centre!' : R.st === 'pcharge' ? 'The Paradox · hold the Gemini sign…' : 'The Paradox · lure both dragons into attacking the centre';
          const n = R.stage, act = GL2.find(G => G.st === 'lock') ? ' · LOCKED: dodge!' : GL2.find(G => G.st === 'track') ? ' · get behind an opposing pillar' : ''; return `Clash of the Twins · ${STAGE_N[R.st] || ''} · pillars ${R.broke}/6${act}`; },
        cam() { if (S.phase === 'boss') { const B = AB(); if (B && typeof B.cam === 'function') { try { const v = B.cam(); if (v) return v; } catch (e) {} } return { x: me.x, y: me.y, k: 0, zoom: 0.72 }; }
          const port = X.W() < X.H(), zb = port ? 0.5 : 0.66;
          if (R.st === 'cine') { const t = R.cine.t; if (t < 1.4) return { x: CC.x, y: CC.y - 1, k: 0.9, zoom: zb * 0.92 }; if (t < 2.6) return { x: lerp(CC.x, GU.L.mx + 6, 0.5), y: CC.y - 2, k: 0.9, zoom: zb * 1.08 }; if (t < 3.6) return { x: lerp(CC.x, GU.R.mx - 6, 0.5), y: CC.y - 2, k: 0.9, zoom: zb * 1.08 }; if (t < 6.4) return { x: CC.x, y: CC.y - 1.5, k: 0.95, zoom: zb * 0.78 }; return { x: CC.x, y: CC.y - 2.5, k: 0.92, zoom: zb * 0.85 }; }
          if (S.phase === 'opening') return { x: GATE.x, y: GATE.y - 2.5, k: 0.85, zoom: zb * 1.1 };
          // the trial: the pet, leaning toward the guardian that charges (both: toward the centre), wide enough to read them
          let fx = me.x, fy = me.y, k = 0.25; const act = GL2.filter(G => G.st === 'track' || G.st === 'lock' || G.st === 'breath');
          if (/^(unfold|pwait|pcharge|plock|pfire|pfail|quiet)$/.test(R.st)) { fx = CC.x; fy = CC.y - 0.5; k = 0.45; }
          else if (act.length === 1) { const G = act[0], m = mouthOf(G), rg = rigOf(G), hx = rg ? (rg.head.x + m.x) / 2 : m.x; fx = (me.x + hx) / 2; fy = (me.y + m.y) / 2; k = port ? 0.85 : 0.5; } else if (act.length > 1) { fx = CC.x; fy = CC.y; k = 0.35; }
          return { x: fx, y: fy, k, zoom: zb }; },
        hideHud() { const B = AB(); if (S.phase === 'boss' && B && typeof B.hideHud === 'function') return !!B.hideHud(); return R.st === 'cine'; },
        onBossDeath(m) { const B = AB(); return S.phase === 'boss' && B && typeof B.onBossDeath === 'function' ? !!B.onBossDeath(m) : false; },
        drawGround(c) { if (S.phase !== 'boss' && S.phase !== 'won') drawGroundAll(c); else { const F = fgx(); if (F && onScr(CC.x, CC.y, 6)) lightGround(c); } const B = AB(); if ((S.phase === 'boss' || S.phase === 'won') && B && typeof B.drawGround === 'function') { try { B.drawGround(c); } catch (e) {} } },
        drawOver(c) { const B = AB(); if (S.phase === 'boss' && B && typeof B.drawOver === 'function') { try { B.drawOver(c); } catch (e) {} } hud(c); },
        leave() {}, teardown };
      function teardown() { const B = AB(); if (B && typeof B.stop === 'function') { try { B.stop(); } catch (e) {} } if (CUR && CUR.S === S) CUR = null; R.frost.length = 0; R.shocks.length = 0; R.fx.length = 0; for (const G of GL2) G.path = null; if (R.ownCine && g.cineT > 0) g.cineT = 0; }
      LIVE = mod; return mod;
    },
  });
  // (the Sepulchre's own warm-ups on the loading screen are not for its gate: skipped there; the gate warms its own)
  try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.sepulchre; if (Rf && !Rf.__ggGate) { const o = Rf.preload; Rf.__ggGate = 1; Rf.preload = function (P) { if (P && P.F && P.F.rift && P.F.rift.gate) return []; return o ? o.apply(this, arguments) : []; }; } } catch (e) {}
  /* ---- letting go: when the dungeon game closes and whenever a new stage is made, the boss is stopped and the GPU meshes given back ---- */
  let LIVE = null;
  function release() { const m = LIVE; LIVE = null; CUR = null; if (m) { try { m.teardown(); } catch (e) {} } try { STANDIN.stop(); } catch (e) {} try { const G = GGd(); if (G) G.release(); } catch (e) {} try { if (typeof RAZIEL_GL !== 'undefined' && RAZIEL_GL.free && !(typeof GEMINI_BOSS !== 'undefined' && GEMINI_BOSS && GEMINI_BOSS.active && GEMINI_BOSS.active())) RAZIEL_GL.free(); } catch (e) {} }   /* (Raziel's own meshes too: the gate drew its heads, crowns and cores with them) */
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (LIVE || CUR) release(); }); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__ggRel) { const c0 = GD.create; GD.__ggRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { if (LIVE) release(); return d0.apply(this, arguments); }; } return api; }; } } catch (e) {}
  if (typeof window !== 'undefined') window.GEMINI_GATE = { get live() { return LIVE; }, release, LAYOUT, CC, CR, BA, BR, GATE, DOOR, PIL0, CHAN, SOCK, GU0, CFG, STANDIN, MW, MH };
})();
