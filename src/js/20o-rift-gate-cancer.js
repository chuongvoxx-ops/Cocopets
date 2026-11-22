/* ---------- Gate 01, Cancer: The Oracle Shell (v420 GC: rebuilt at the Drowned Belfry's quality) ----------
   Beside the belfry, a grotto inside an enormous shell floats in a violet night: a floor of polished nacre laid in a fan of
   ribs round a pearl bed, tide pools glinting, coral and scallops at its walls, and at its heart a giant clam that holds the
   oracle pearl. Stand beside the clam and it opens: it asks three riddles, one after another, each with five answers to
   choose from (one right, four wrong). The riddles come in a different order every time, and the answers are shuffled every
   time a riddle is asked. A wrong answer and the clam snaps shut: all three begin again, in a new order. Three right in a
   row and the great moon gate in the grotto's north wall opens (its three sockets lit one by one as the riddles fall, then
   its leaves part, moonlight pouring through and violet mist rolling out). Beyond it waits the Moonlit Arena, a pale
   platform of moonstone afloat in the night under a great moon: carved lunar rings inlaid with kintsugi gold, moonstone
   pillars on its rim, crescents of moonstone drifting round it. Step through and the gate seals behind: Abaddon, the
   Eternal Moonlight, is fought there (CANCER_BOSS, 20o2), or, without it, Cancer wakes at once.
   Pictures: CANCER_PROPS (20o1-cancer-props.js), painted once by the Belfry's shading pass; floors and walls are this file's
   own lands ('nursery': the Oracle Shell, 'lunarfloor': the arena), painted into the engine's cached ground chunks; the sky
   ('lunarsky') is the gap backdrop. Light and air (pearl light, caustics on the pools and the arena, the rings' running
   light, the moon's halo, the gate's light, violet mist, motes) are drawn on the GPU (NIDHOGG_MOVES.FGFX kinds 136..140,
   v420 GC) where a real GPU draws; elsewhere the pictures and floors stand without it. lowFx keeps only the light that
   tells the story (the pearl, the gate's sockets and its opening).
   Contract with the boss (20o2, CANCER_BOSS, all optional but begin): when the pet crosses into the arena the gate seals and
   CANCER_BOSS.begin(X, H, self, A) is called, A = { cx, cy, r, rx, ry, ax0, ay0, ax1, ay1, door: { x, y } } (world tiles:
   the arena's centre, its radius (the smaller half axis) and half axes, its walkable bounds, the sealed gate's foot);
   then every frame CANCER_BOSS.update(dt), drawGround(c) (under everything standing), drawOver(c) (over the HUD), and
   cam(), goal(), hideHud(), onBossDeath(m) when asked; CANCER_BOSS.stop() when the stage closes. BOSS calls X.winStage()
   itself when Abaddon falls. Without CANCER_BOSS, Cancer wakes as the gate seals (the old win).
   Memory: every picture is given back when the stage closes (CANCER_PROPS.release, through the dungeon game's destroy and
   BEL.onRelease); the stage keeps no pointer past it. Test hooks: the stage module's rightIndex(), answer(i), S (state). */
const CANCER_RIDDLES = [
  { q: 'I\'m tall when I\'m young, and I\'m short when I\'m old. What am I?', a: 'A candle', wrong: ['A tree', 'A shadow', 'A mountain', 'A tower'] },
  { q: 'What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?', a: 'A river', wrong: ['A clock', 'A road', 'A bottle', 'A mountain'] },
  { q: 'Some try to hide, some try to cheat; but time will show, we always will meet. Try as you might to guess my name, I promise you\'ll know when I do claim. Who am I?', a: 'Death', wrong: ['Time', 'Fate', 'Love', 'Sleep'] },
];
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v, lerp = (a, b, u) => a + (b - a) * u, ease = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const hh = (a, b, s) => { let n = (a * 374761393 + b * 668265263 + (s || 0) * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const vn = (x, y, s) => { const gx = Math.floor(x), gy = Math.floor(y), fx = x - gx, fy = y - gy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return lerp(lerp(hh(gx, gy, s), hh(gx + 1, gy, s), u), lerp(hh(gx, gy + 1, s), hh(gx + 1, gy + 1, s), u), v); };
  const wrapA = a => a - Math.round(a / TAU) * TAU;
  const lowFx = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const CP = () => (typeof CANCER_PROPS !== 'undefined' ? CANCER_PROPS : null);
  // (the boss, 20o2; tests may stand one in, window.__CX_BOSS, or leave it out, window.__CX_NOBOSS = 1, to play the gate's own ending)
  const CB = () => { const w = typeof window !== 'undefined' ? window : {}; if (w.__CX_BOSS) return w.__CX_BOSS; if (w.__CX_NOBOSS === 1) return null; return typeof CANCER_BOSS !== 'undefined' && CANCER_BOSS ? CANCER_BOSS : null; };
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__CX_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  const PINK = '#FFB3C8', PEARL = '#FFE6F0', LAV = '#B9A2FF', VIOLET = '#7B5BD6', MOONC = '#DCD4FF', GOLD = '#FFE3A0', MIST = '#8E72D8';

  /* ======================= the plan (world tiles: a layout cell (i, j) is world tile (i + 1, j + 1)) ======================= */
  const W0 = 31, H0 = 35;
  const AC = { x: 16.5, y: 13.0 }, ARX = 11.2, ARY = 8.2;                 // the arena: an ellipse of walkable moonstone (22 x 16 tiles)
  const WALLY = 21, DOORX = 16.5, DOORY = 22.0;                            // the wall between, the gate's foot (its floor line)
  const C0 = { x: 16.5, y: 26.5 };                                         // the clam (the fan of the chamber's floor radiates from it)
  const inArena = (x, y) => y <= 20 && ((x + 0.5 - AC.x) / ARX) ** 2 + ((y + 0.5 - AC.y) / ARY) ** 2 <= 1;
  const inChamber = (x, y) => { if (y < 22 || y > 32) return false; const dx = x + 0.5 - 16.5; if (y <= 27) return Math.abs(dx) <= 8 && !(y === 22 && Math.abs(dx) > 7.2); return (dx / 8) ** 2 + ((y + 0.5 - 27) / 6.0) ** 2 <= 1; };
  // the arena's rim: moonstone pillars (engine props, breakable), clear of the gate's side
  const PILLARS = [-115, -65, -155, -25, 168, 12, 132, 48].map(d => { const a = d * Math.PI / 180; let x = Math.floor(AC.x + Math.cos(a) * ARX * 0.9), y = Math.floor(AC.y + Math.sin(a) * ARY * 0.9); return [x, y]; });
  const CORALS = [[9, 23], [24, 23], [8, 27], [24, 27]], SCALLOPS = [[12, 31], [21, 31]];
  const POOLS = [{ x: 11.2, y: 28.0, rx: 1.75, ry: 1.05, s: 1 }, { x: 21.9, y: 28.4, rx: 1.6, ry: 1.0, s: 2 }, { x: 11.4, y: 24.7, rx: 0.95, ry: 0.62, s: 3 }, { x: 22.6, y: 24.6, rx: 0.9, ry: 0.6, s: 4 }, { x: 14.0, y: 31.4, rx: 0.85, ry: 0.5, s: 5 }, { x: 19.2, y: 31.6, rx: 0.9, ry: 0.52, s: 6 }];
  const LAYOUT = (() => { const rows = []; const at = new Map(); const mark = (x, y, ch) => at.set(x + ',' + y, ch);
    PILLARS.forEach(([x, y]) => mark(x, y, 'P')); CORALS.forEach(([x, y]) => mark(x, y, 'C')); SCALLOPS.forEach(([x, y]) => mark(x, y, 'L'));
    mark(16, 21, 'D'); mark(15, 21, 'd'); mark(17, 21, 'd'); mark(16, 13, 'A'); mark(16, 26, 'O'); mark(16, 31, 'S');
    for (let j = 0; j < H0; j++) { let s = ''; for (let i = 0; i < W0; i++) { const x = i + 1, y = j + 1, m = at.get(x + ',' + y);
      if (m && (m === 'D' || m === 'd' || inArena(x, y) || inChamber(x, y))) { s += m; continue; }
      if (inArena(x, y) || inChamber(x, y)) { s += '.'; continue; }
      let wall = false; if (y >= WALLY) for (let dy = -1; dy <= 1 && !wall; dy++) for (let dx = -1; dx <= 1; dx++) if (inChamber(x + dx, y + dy)) { wall = true; break; }
      s += wall ? '#' : '~'; } rows.push(s); }
    return rows; })();
  const RIBS = [[9.3, 22.02, 0], [11.1, 22.02, 0], [21.9, 22.02, 1], [23.7, 22.02, 1], [7.7, 25.4, 0], [25.3, 25.4, 1], [9.4, 30.3, 0], [23.6, 30.3, 1]];
  const SHARDS = []; { for (let i = 0; i < 14; i++) { const a = -Math.PI + (i + 0.5) / 14 * Math.PI * 1.55 - Math.PI * 0.27 + (hh(i, 3) - 0.5) * 0.15, k = 1.1 + hh(i, 5) * 0.22; SHARDS.push({ x: AC.x + Math.cos(a) * ARX * k, y: AC.y + Math.sin(a) * ARY * k, v: i % 3, ph: hh(i, 7) * TAU, s: 0.75 + hh(i, 9) * 0.5, lift: 0.6 + hh(i, 11) * 1.4 }); } }
  const MOONW = { x: AC.x, y: AC.y - ARY - 5.2 };   // (the moon's place in the sky, seen with parallax)

  /* ======================= the floors (painted into the engine's cached chunks, once) ======================= */
  const CH_TONES = ['#EFD6D4', '#EACDCD', '#F3DEDB', '#E5C8CB', '#F0D9DD'];
  const IRI = ['255,190,215', '190,230,240', '255,226,190', '214,196,255'];
  // the shell's floor: nacre slabs laid in a fan of ribs round the clam, growth rings, sand drifts, tiny shells; the tide pools; violet toward the gate
  function shellFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    c.fillStyle = '#EED9D6'; c.fillRect(X, Y, T, T);
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T];
    const dxc = x + 0.5 - C0.x, dyc = y + 0.5 - C0.y, rc = Math.hypot(dxc, dyc);
    if (rc > 2.2) { // the fan: rings of slabs (1.15 tiles deep), 30 to a ring, each its own tone and sheen
      const NR = 30, RW = 1.15, cs = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]].map(([a, b]) => [Math.hypot(a - C0.x, b - C0.y), Math.atan2(b - C0.y, a - C0.x)]);
      const r0 = Math.min(...cs.map(q => q[0])), r1 = Math.max(...cs.map(q => q[0])), ac = Math.atan2(dyc, dxc); let d0 = 9, d1 = -9; for (const q of cs) { const d = wrapA(q[1] - ac); d0 = Math.min(d0, d); d1 = Math.max(d1, d); }
      for (let k = Math.max(2, Math.floor(r0 / RW)); k <= Math.floor(r1 / RW); k++) { const ra = k * RW, rb = ra + RW, off = (k % 2) * 0.5;
        const j0 = Math.floor((ac + d0) / TAU * NR - off) - 1, j1 = Math.floor((ac + d1) / TAU * NR - off) + 1;
        for (let j = j0; j <= j1; j++) { const a0 = (j + off) / NR * TAU, a1 = (j + 1 + off) / NR * TAU, jj = ((j % NR) + NR) % NR, tone = CH_TONES[Math.floor(hh(k, jj, 3) * CH_TONES.length)];
          c.beginPath(); for (let i = 0; i <= 5; i++) { const a = lerp(a0, a1, i / 5), p = P(C0.x + Math.cos(a) * ra, C0.y + Math.sin(a) * ra); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let i = 5; i >= 0; i--) { const a = lerp(a0, a1, i / 5), p = P(C0.x + Math.cos(a) * rb, C0.y + Math.sin(a) * rb); c.lineTo(p[0], p[1]); } c.closePath();
          c.fillStyle = tone; c.fill();
          // its sheen: a soft iridescent wash across the slab, a lit lip on the clam's side
          const am = (a0 + a1) / 2, pm = P(C0.x + Math.cos(am) * (ra + RW * 0.5), C0.y + Math.sin(am) * (ra + RW * 0.5)), g = c.createRadialGradient(pm[0], pm[1], 0, pm[0], pm[1], T * 0.9), ic = IRI[Math.floor(hh(jj, k, 5) * IRI.length)];
          g.addColorStop(0, `rgba(${ic},${(0.16 + hh(k, jj, 7) * 0.14).toFixed(3)})`); g.addColorStop(1, `rgba(${ic},0)`); c.fillStyle = g; c.fill();
          c.strokeStyle = 'rgba(140,82,96,.42)'; c.lineWidth = Math.max(1, T * 0.032); c.stroke();
          const pa = P(C0.x + Math.cos(a0) * ra, C0.y + Math.sin(a0) * ra), pb = P(C0.x + Math.cos(a0) * rb, C0.y + Math.sin(a0) * rb); c.strokeStyle = 'rgba(255,250,248,.5)'; c.lineWidth = Math.max(0.8, T * 0.018); c.beginPath(); c.moveTo(pa[0] + 1, pa[1]); c.lineTo(pb[0] + 1, pb[1]); c.stroke(); } }
      // the ribs of the great shell: ridges running out from the clam every third slab, lit on one flank
      for (let j = Math.floor((ac + d0) / TAU * 10) - 1; j <= Math.floor((ac + d1) / TAU * 10) + 1; j++) { const a = j / 10 * TAU + 0.05, pa = P(C0.x + Math.cos(a) * 2.4, C0.y + Math.sin(a) * 2.4), pb = P(C0.x + Math.cos(a) * 14, C0.y + Math.sin(a) * 14);
        c.lineCap = 'round'; c.strokeStyle = 'rgba(160,100,110,.22)'; c.lineWidth = T * 0.16; c.beginPath(); c.moveTo(pa[0], pa[1]); c.lineTo(pb[0], pb[1]); c.stroke(); c.strokeStyle = 'rgba(255,248,246,.4)'; c.lineWidth = T * 0.05; c.beginPath(); c.moveTo(pa[0] - T * 0.04, pa[1] - T * 0.03); c.lineTo(pb[0] - T * 0.04, pb[1] - T * 0.03); c.stroke(); } }
    // sand drifts in soft world-space blobs, tiny shells and pearl grains
    for (let gy = Math.floor((y - 3) / 3.2); gy <= Math.floor((y + 4) / 3.2); gy++) for (let gx = Math.floor((x - 3) / 3.2); gx <= Math.floor((x + 4) / 3.2); gx++) { if (hh(gx, gy, 41) > 0.42) continue;
      const cx = (gx + hh(gx, gy, 53)) * 3.2, cy = (gy + hh(gx, gy, 59)) * 3.2, rr = 1.0 + hh(gx, gy, 61) * 1.4; if (cx + rr < x || cx - rr > x + 1 || cy + rr < y || cy - rr > y + 1 || Math.hypot(cx - C0.x, cy - C0.y) < 2.6) continue;
      const p = P(cx, cy), g = c.createRadialGradient(p[0], p[1], 0, p[0], p[1], rr * T); g.addColorStop(0, 'rgba(240,214,190,.5)'); g.addColorStop(0.6, 'rgba(240,214,190,.22)'); g.addColorStop(1, 'rgba(240,214,190,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    for (let i = 0; i < 5; i++) { const u = hh(x, y, 70 + i), v = hh(x, y, 80 + i), k = hh(x, y, 90 + i); if (k > 0.55) continue; const px = X + u * T, py = Y + v * T, s = T * (0.03 + k * 0.06);
      if (k < 0.18) { c.fillStyle = 'rgba(255,250,252,.85)'; c.beginPath(); c.arc(px, py, s * 0.6, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(px - s * 0.3, py - s * 0.3, Math.max(1, s * 0.25), Math.max(1, s * 0.25)); }
      else { c.strokeStyle = 'rgba(190,130,130,.45)'; c.lineWidth = Math.max(0.8, T * 0.016); c.beginPath(); c.arc(px, py, s, Math.PI * (0.9 + u), Math.PI * (2.1 + u)); c.stroke(); c.fillStyle = 'rgba(255,236,232,.6)'; c.beginPath(); c.arc(px, py, s * 0.8, Math.PI * (0.9 + u), Math.PI * (2.1 + u)); c.fill(); } }
    // the tide pools: a wet dark rim, barnacled stones, clear water over pale sand and pebbles, a bright edge (their light is the GPU's)
    for (const pl of POOLS) { if (pl.x + pl.rx + 0.4 < x || pl.x - pl.rx - 0.4 > x + 1 || pl.y + pl.ry + 0.4 < y || pl.y - pl.ry - 0.4 > y + 1) continue;
      const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * TAU, k = 1 + 0.12 * (vn(Math.cos(a) * 2 + pl.s * 3, Math.sin(a) * 2, 7) - 0.5); pts.push(P(pl.x + Math.cos(a) * pl.rx * k, pl.y + Math.sin(a) * pl.ry * k)); }
      const path = (sc) => { c.beginPath(); const cp = P(pl.x, pl.y); pts.forEach((p, i) => { const q = [cp[0] + (p[0] - cp[0]) * sc, cp[1] + (p[1] - cp[1]) * sc]; i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); };
      const cp = P(pl.x, pl.y);
      path(1.18); c.fillStyle = 'rgba(176,128,128,.35)'; c.fill();                                                 // the wet sand round it
      path(1.0); const wg = c.createRadialGradient(cp[0] - pl.rx * T * 0.2, cp[1] - pl.ry * T * 0.3, 0, cp[0], cp[1], pl.rx * T); wg.addColorStop(0, '#9EE7E2'); wg.addColorStop(0.55, '#5FC2C8'); wg.addColorStop(1, '#3A8EA6'); c.fillStyle = wg; c.fill();
      c.save(); path(1.0); c.clip(); for (let i = 0; i < 9; i++) { const a = hh(i, pl.s, 3) * TAU, d = Math.sqrt(hh(i, pl.s, 5)) * 0.8, q = P(pl.x + Math.cos(a) * pl.rx * d, pl.y + Math.sin(a) * pl.ry * d), r = T * (0.05 + hh(i, pl.s, 9) * 0.08); c.fillStyle = i % 3 ? 'rgba(240,220,214,.55)' : 'rgba(255,190,205,.6)'; c.beginPath(); c.ellipse(q[0], q[1], r, r * 0.7, 0, 0, TAU); c.fill(); }
        const sh = c.createLinearGradient(0, cp[1] - pl.ry * T, 0, cp[1] + pl.ry * T); sh.addColorStop(0, 'rgba(20,60,80,.35)'); sh.addColorStop(0.35, 'rgba(20,60,80,0)'); c.fillStyle = sh; c.fillRect(cp[0] - pl.rx * T * 1.2, cp[1] - pl.ry * T * 1.2, pl.rx * T * 2.4, pl.ry * T * 2.4); c.restore();
      path(1.0); c.strokeStyle = 'rgba(226,252,250,.8)'; c.lineWidth = Math.max(1, T * 0.035); c.stroke();
      for (let i = 0; i < 12; i++) { const a = hh(i, pl.s, 13) * TAU, q = P(pl.x + Math.cos(a) * pl.rx * 1.08, pl.y + Math.sin(a) * pl.ry * 1.1), r = T * (0.06 + hh(i, pl.s, 17) * 0.1); c.fillStyle = '#C9A9AE'; c.beginPath(); c.ellipse(q[0], q[1], r, r * 0.72, 0, 0, TAU); c.fill(); c.fillStyle = 'rgba(255,245,245,.6)'; c.beginPath(); c.ellipse(q[0] - r * 0.25, q[1] - r * 0.25, r * 0.45, r * 0.3, 0, 0, TAU); c.fill(); if (i % 3 === 0) { c.fillStyle = 'rgba(90,60,70,.5)'; c.beginPath(); c.arc(q[0], q[1], r * 0.22, 0, TAU); c.fill(); } } }
    // the moonstone threshold before the gate: a half disc of slabs, gold-edged, carved with a crescent
    { const R = 2.7, d = Math.hypot(x + 0.5 - DOORX, y + 0.5 - DOORY); if (d < R + 1) { const cp = P(DOORX, DOORY);
      c.save(); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, Math.PI); c.closePath(); const g = c.createRadialGradient(cp[0], cp[1], 0, cp[0], cp[1], R * T); g.addColorStop(0, '#E6E0F2'); g.addColorStop(1, '#C9BEDF'); c.fillStyle = g; c.fill(); c.clip();
      c.strokeStyle = 'rgba(70,52,120,.38)'; c.lineWidth = Math.max(1, T * 0.03); for (const rr of [1.2, 2.0]) { c.beginPath(); c.arc(cp[0], cp[1], rr * T, 0, Math.PI); c.stroke(); } for (let i = 1; i < 6; i++) { const a = i / 6 * Math.PI, r0 = i % 2 ? 1.2 : 2.0; c.beginPath(); c.moveTo(cp[0] + Math.cos(a) * r0 * T, cp[1] + Math.sin(a) * r0 * T); c.lineTo(cp[0] + Math.cos(a) * R * T, cp[1] + Math.sin(a) * R * T); c.stroke(); }
      c.fillStyle = 'rgba(232,194,106,.85)'; c.beginPath(); c.arc(cp[0], cp[1] + T * 0.55, T * 0.42, 0, TAU); c.arc(cp[0] + T * 0.14, cp[1] + T * 0.5, T * 0.36, 0, TAU, true); c.fill('evenodd'); c.restore();
      c.strokeStyle = '#D9B05E'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(cp[0], cp[1], R * T, 0, Math.PI); c.stroke(); c.strokeStyle = 'rgba(255,240,200,.7)'; c.lineWidth = Math.max(0.8, T * 0.02); c.beginPath(); c.arc(cp[0], cp[1], R * T - T * 0.03, 0.05, Math.PI - 0.05); c.stroke(); } }
    // violet creeping in from the gate, and a little shade at the grotto's edges
    { const p = P(DOORX, DOORY), g = c.createRadialGradient(p[0], p[1], T * 0.5, p[0], p[1], T * 7.5); g.addColorStop(0, 'rgba(120,90,210,.34)'); g.addColorStop(0.5, 'rgba(120,90,210,.14)'); g.addColorStop(1, 'rgba(120,90,210,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    { const p = P(C0.x, C0.y + 0.5), g = c.createRadialGradient(p[0], p[1], T * 4, p[0], p[1], T * 10); g.addColorStop(0, 'rgba(90,40,70,0)'); g.addColorStop(1, 'rgba(90,40,70,.22)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    c.restore(); }
  /* the arena's floor: moonstone pavers laid in courses round its heart (in its own ellipse), carved rings (gold-inlaid at 0.3 and 0.86, a
     plain groove at 0.58), sixteen moon phases carved round the band at 0.51, kintsugi gold along mended cracks, a gold sigil at its
     heart, the stone deepening to violet toward the rim */
  const AR_B = [0.13, 0.3, 0.44, 0.58, 0.72, 0.86, 1.06], AR_TONES = ['#A497C8', '#9C8EC1', '#AA9ECE', '#9588BB', '#AFA4D1', '#A092C4'];   // (v420 GC: mid-value, so the fight's light reads on it)
  const AP = (r, a) => [AC.x + Math.cos(a) * ARX * r, AC.y + Math.sin(a) * ARY * r];
  function lunarFloor(c, X, Y, T, x, y) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); c.fillStyle = '#9E91C4'; c.fillRect(X, Y, T, T);
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T], el = (wx, wy) => [Math.hypot((wx - AC.x) / ARX, (wy - AC.y) / ARY), Math.atan2((wy - AC.y) / ARY, (wx - AC.x) / ARX)];
    const cs = [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1], [x + 0.5, y + 0.5]].map(([a, b]) => el(a, b)), r0 = Math.min(...cs.map(q => q[0])), r1 = Math.max(...cs.map(q => q[0])), ac = cs[4][1];
    let d0 = 9, d1 = -9; for (const q of cs) { const d = wrapA(q[1] - ac); d0 = Math.min(d0, d); d1 = Math.max(d1, d); } const full = r0 < 0.16;
    const poly = (ra, rb, a0, a1, n) => { c.beginPath(); for (let i = 0; i <= n; i++) { const p = P(...AP(ra, lerp(a0, a1, i / n))); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } for (let i = n; i >= 0; i--) { const p = P(...AP(rb, lerp(a0, a1, i / n))); c.lineTo(p[0], p[1]); } c.closePath(); };
    // the pavers
    for (let k = 0; k < AR_B.length - 1; k++) { const ra = AR_B[k], rb = AR_B[k + 1]; if (rb < r0 - 0.02 || ra > r1 + 0.02) continue; const n = Math.max(8, Math.round(TAU * (ra + rb) / 2 * (ARX + ARY) / 2 / 1.7)), off = hh(k, 1, 9);
      const j0 = full ? 0 : Math.floor((ac + d0 + Math.PI) / TAU * n - off) - 1, j1 = full ? n - 1 : Math.floor((ac + d1 + Math.PI) / TAU * n - off) + 1;
      for (let j = j0; j <= j1; j++) { const a0 = (j + off) / n * TAU - Math.PI, a1 = (j + 1 + off) / n * TAU - Math.PI, jj = ((j % n) + n) % n, seg = Math.max(3, Math.ceil((a1 - a0) * rb * 6));
        poly(ra, rb, a0, a1, seg); c.fillStyle = AR_TONES[Math.floor(hh(k, jj, 3) * AR_TONES.length)]; c.fill();
        const am = (a0 + a1) / 2, pm = P(...AP((ra + rb) / 2, am)), g = c.createRadialGradient(pm[0] - T * 0.3, pm[1] - T * 0.3, 0, pm[0], pm[1], T * 1.3); g.addColorStop(0, `rgba(226,220,250,${(0.1 + hh(jj, k, 5) * 0.1).toFixed(3)})`); g.addColorStop(1, 'rgba(160,150,220,0)'); c.fillStyle = g; c.fill();
        c.strokeStyle = 'rgba(34,20,72,.62)'; c.lineWidth = Math.max(1, T * 0.04); c.stroke();
        // kintsugi: a mended crack across some slabs, gold with a bright core
        if (hh(k, jj, 11) < 0.26) { const pts = []; let w = 0.3 + 0.4 * hh(k, jj, 15); for (let i = 0; i <= 7; i++) { const u = i / 7, rr = lerp(ra + 0.004, rb - 0.004, u); if (i) w = clamp(w + (hh(k * 31 + jj, i, 13) - 0.5) * 0.12, 0.15, 0.85); pts.push(P(...AP(rr, lerp(a0, a1, w)))); }
          c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.strokeStyle = 'rgba(40,22,30,.72)'; c.lineWidth = Math.max(1.6, T * 0.08); c.stroke(); c.strokeStyle = '#C99A42'; c.lineWidth = Math.max(1, T * 0.044); c.stroke(); c.strokeStyle = 'rgba(255,232,170,.8)'; c.lineWidth = Math.max(0.6, T * 0.012); c.stroke(); } } }
    // the carved rings: a dark groove, gold inlay in two of them, a bright lip
    for (const [rr, gold] of [[0.3, 1], [0.58, 0], [0.86, 1]]) { if (rr < r0 - 0.03 || rr > r1 + 0.03) continue; const cp = P(AC.x, AC.y);
      const ring = (w, col) => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.ellipse(cp[0], cp[1], rr * ARX * T, rr * ARY * T, 0, 0, TAU); c.stroke(); };
      ring(Math.max(3, T * 0.2), 'rgba(196,186,230,.35)'); ring(Math.max(2.4, T * 0.15), 'rgba(22,12,52,.82)'); if (gold) { ring(Math.max(1.4, T * 0.075), '#C99A42'); ring(Math.max(0.7, T * 0.02), 'rgba(255,236,180,.85)'); } else { ring(Math.max(1, T * 0.06), 'rgba(14,8,40,.85)'); ring(Math.max(0.6, T * 0.014), 'rgba(214,206,244,.55)'); } }
    // sixteen moon phases carved round the band
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, [mx, my] = AP(0.51, a); if (mx < x - 0.6 || mx > x + 1.6 || my < y - 0.6 || my > y + 1.6) continue; const p = P(mx, my), R = T * 0.36, ph = i / 16, sh = Math.cos(ph * TAU);
      c.fillStyle = 'rgba(52,36,100,.5)'; c.beginPath(); c.arc(p[0], p[1], R + T * 0.04, 0, TAU); c.fill(); c.fillStyle = '#4C3C84'; c.beginPath(); c.arc(p[0], p[1], R, 0, TAU); c.fill();
      c.save(); c.beginPath(); c.arc(p[0], p[1], R, 0, TAU); c.clip(); c.fillStyle = '#DCD4F2'; c.beginPath(); c.ellipse(p[0], p[1], R * Math.abs(sh), R, 0, -Math.PI / 2, Math.PI / 2, sh < 0); if (ph < 0.5) { c.lineTo(p[0], p[1] + R); c.arc(p[0], p[1], R, Math.PI / 2, -Math.PI / 2, true); } else { c.lineTo(p[0], p[1] + R); c.arc(p[0], p[1], R, Math.PI / 2, Math.PI * 1.5, false); } c.closePath();
      if (ph > 0.02 && Math.abs(ph - 1) > 0.02) c.fill(); c.restore(); c.strokeStyle = 'rgba(232,194,106,.85)'; c.lineWidth = Math.max(0.8, T * 0.025); c.beginPath(); c.arc(p[0], p[1], R + T * 0.02, 0, TAU); c.stroke(); }
    // the sigil at the heart: a gold crescent cradling an eight-pointed star in a ring of silver
    if (r0 < 0.2) { const cp = P(AC.x, AC.y), R = T * 1.25; c.save(); c.translate(cp[0], cp[1]); c.scale(1, ARY / ARX);
      const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R * 1.3); g.addColorStop(0, '#C4B8E2'); g.addColorStop(1, '#9A8DC2'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R * 1.18, 0, TAU); c.fill(); c.strokeStyle = '#C99A42'; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke();
      c.fillStyle = '#C9A050'; c.beginPath(); c.arc(0, 0, R * 0.95, 0, TAU); c.arc(R * 0.3, -R * 0.12, R * 0.82, 0, TAU, true); c.fill('evenodd');
      c.fillStyle = '#E8D6A6'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU - Math.PI / 2, rr = i % 2 ? R * 0.16 : R * (i % 4 ? 0.34 : 0.48); i ? c.lineTo(Math.cos(a) * rr + R * 0.18, Math.sin(a) * rr) : c.moveTo(Math.cos(a) * rr + R * 0.18, Math.sin(a) * rr); } c.closePath(); c.fill(); c.restore(); }
    // its light: the stone deepening to violet toward the rim, cooler at the heart
    { const cp = P(AC.x, AC.y); c.save(); c.translate(cp[0], cp[1]); c.scale(1, ARY / ARX); const g = c.createRadialGradient(0, 0, ARX * T * 0.2, 0, 0, ARX * T); g.addColorStop(0, 'rgba(110,80,190,0)'); g.addColorStop(0.55, 'rgba(90,60,170,.08)'); g.addColorStop(0.85, 'rgba(84,52,170,.3)'); g.addColorStop(1, 'rgba(52,26,124,.52)'); c.fillStyle = g; c.fillRect(-ARX * T * 2, -ARX * T * 2, ARX * T * 4, ARX * T * 4); c.restore(); }
    c.restore(); }
  /* the arena's edge, laid over each chunk after its floors (a decal of the whole chunk): what lies outside the ellipse is cut away
     (the sky shows there), then the platform's rim: a bevelled lip all round, and under its near half the moonstone's thickness, in
     strata, with violet light under it */
  const EDGE = []; for (let y = 0; y <= WALLY; y++) for (let x = 0; x < W0 + 2; x++) { let n = 0; for (const [a, b] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) if (((a - AC.x) / ARX) ** 2 + ((b - AC.y) / ARY) ** 2 <= 1) n++; if (n > 0 && n < 4 && y < WALLY) EDGE.push([x, y]); }
  function arenaEdge(c, T, d) {
    // the rim's tiles painted again whole (a tile the ellipse cuts may be sky in the plan, or carry a straight lip of the engine's)
    const x0 = d && d.n ? d.cx * d.n - 1 : -9, x1 = d && d.n ? (d.cx + 1) * d.n : 99, y0 = d && d.n ? d.cy * d.n - 1 : -9, y1 = d && d.n ? (d.cy + 1) * d.n : 99;
    for (const [x, y] of EDGE) if (x >= x0 && x <= x1 && y >= y0 && y <= y1) lunarFloor(c, x * T, y * T, T, x, y);
    c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); c.ellipse(AC.x * T, AC.y * T, ARX * T, ARY * T, 0, 0, TAU); c.fill('evenodd'); c.restore();
    // the thickness under the near rim (in strata), a gold band, violet light beneath
    const TH = 0.75; c.save(); c.beginPath(); c.rect(-T * 4, AC.y * T, (W0 + 10) * T, (WALLY - AC.y) * T); c.clip();
    c.beginPath(); c.ellipse(AC.x * T, AC.y * T, ARX * T, ARY * T, 0, 0, Math.PI); c.ellipse(AC.x * T, (AC.y + TH) * T, ARX * T, ARY * T, 0, Math.PI, 0, true); c.closePath();
    const g = c.createLinearGradient(0, (AC.y + ARY - 0.6) * T, 0, (AC.y + ARY + TH) * T); g.addColorStop(0, '#B7AAD6'); g.addColorStop(0.35, '#8B7BB8'); g.addColorStop(0.7, '#5A4790'); g.addColorStop(1, '#2E1F5C'); c.fillStyle = g; c.fill();
    c.save(); c.clip(); c.strokeStyle = 'rgba(40,24,80,.35)'; c.lineWidth = Math.max(1, T * 0.03); for (const k of [0.22, 0.45, 0.62]) { c.beginPath(); c.ellipse(AC.x * T, (AC.y + TH * k) * T, ARX * T, ARY * T, 0, 0.02, Math.PI - 0.02); c.stroke(); }
      c.strokeStyle = '#D9AE58'; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.ellipse(AC.x * T, (AC.y + TH * 0.12) * T, ARX * T, ARY * T, 0, 0.02, Math.PI - 0.02); c.stroke();
      for (let i = 0; i < 26; i++) { const a = 0.08 + i / 26 * (Math.PI - 0.16), x = AC.x + Math.cos(a) * ARX, y = AC.y + Math.sin(a) * ARY; c.strokeStyle = 'rgba(30,18,64,.35)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(x * T, (y + TH * 0.14) * T); c.lineTo(x * T, (y + TH * (0.5 + hh(i, 2) * 0.4)) * T); c.stroke(); } c.restore();
    c.restore();
    // the lip: a bevel all round (bright on the far side, where the moon lights it), a dark line at the edge
    c.save(); c.beginPath(); c.rect(-T * 4, -T * 4, (W0 + 10) * T, (WALLY + 4) * T); c.clip();
    c.strokeStyle = 'rgba(40,24,90,.65)'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.ellipse(AC.x * T, AC.y * T, ARX * T - 1, ARY * T - 1, 0, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(246,242,255,.75)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.ellipse(AC.x * T, AC.y * T, (ARX - 0.12) * T, (ARY - 0.12) * T, 0, Math.PI * 1.02, Math.PI * 1.98); c.stroke();
    c.strokeStyle = 'rgba(217,174,88,.75)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.ellipse(AC.x * T, AC.y * T, (ARX - 0.32) * T, (ARY - 0.32) * T, 0, 0, TAU); c.stroke(); c.restore(); }
  /* the grotto's wall faces: nacre in growth bands, an iridescent sheen, violet near the gate */
  function shellWall(c, X, Y, T, H, h, x) {
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#F6E6E6'); g.addColorStop(0.5, '#E6C9CC'); g.addColorStop(1, '#B98E98'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    for (let i = 1; i < 5; i++) { const yy = Y + H * i / 5 + Math.sin(x * 1.7 + i) * H * 0.03; c.fillStyle = i % 2 ? 'rgba(150,90,105,.22)' : 'rgba(255,250,250,.35)'; c.fillRect(X, yy, T + 0.5, Math.max(1, H * 0.05)); }
    const ic = IRI[Math.floor(hh(x, 3, 7) * IRI.length)], sg = c.createLinearGradient(X, 0, X + T, 0); sg.addColorStop(0, `rgba(${ic},0)`); sg.addColorStop(0.5, `rgba(${ic},.28)`); sg.addColorStop(1, `rgba(${ic},0)`); c.fillStyle = sg; c.fillRect(X, Y, T + 0.5, H);
    if (((x % 3) + 3) % 3 === 1) { c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(X + T * 0.5, Y + H * 0.45, Math.max(1.2, T * 0.05), 0, TAU); c.fill(); }
    const dv = Math.abs(x + 0.5 - DOORX); if (dv < 6) { c.fillStyle = `rgba(110,80,200,${(0.3 * (1 - dv / 6)).toFixed(3)})`; c.fillRect(X, Y, T + 0.5, H); } }
  const noCliff = () => {};

  /* ======================= the lands and the sky ======================= */
  const land = (name, o) => Object.assign({ name, rift: true, tile: 'heaven', out: false, dark: 0, bg: '#1B1036', gap: 'lunarsky', ambient: 'motes', accent: PINK, light: '#FFFFFF', hazard: 'spikes', grade: null, fog: '#1B1036', darkRGB: '27,16,54', props: [], deco: '#B9A2FF', mud: ['#C9B0C0', '#BFA4B6'] }, o);
  BIOMES.nursery = land('The Oracle Shell', { floorFn: (c, X, Y, T, h, h2, x, y) => shellFloor(c, X, Y, T, x, y), wallFn: (c, X, Y, T, H, h, x) => shellWall(c, X, Y, T, H, h, x), cliffTint: noCliff,
    floor: ['#EED9D6', '#EED9D6', '#EED9D6'], grout: '#C9A4A8', hi: '#FFF4F2', top: '#C8A9B3', face: '#EBD3D5', faceD: '#B48C98', cliff: '#7E5A78', bridgeCol: '#E8D4D8' });
  BIOMES.lunarfloor = land('The Moonlit Arena', { floorFn: (c, X, Y, T, h, h2, x, y) => lunarFloor(c, X, Y, T, x, y), cliffTint: noCliff, accent: LAV, light: '#E6DEFF',
    floor: ['#9E91C4', '#9E91C4', '#9E91C4'], grout: '#5A4790', hi: '#F2EEFF', top: '#6A5A9A', face: '#B7AAD6', faceD: '#5A4790', cliff: '#3A2A6A', bridgeCol: '#D2CAE4' });
  for (const id of ['nursery', 'lunarfloor']) { if (!BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = '27,16,54'; }
  window.DECAL_EXT = window.DECAL_EXT || {};
  DECAL_EXT.cxedge = (c, d, s, lw, T) => arenaEdge(c, T, d);
  if (typeof DunWorld !== 'undefined' && DunWorld.PROPS && !DunWorld.PROPS.cxnone) DunWorld.PROPS.cxnone = () => {};
  /* the sky: deep violet night, stars in three depths, nebulae of violet and rose drifting, the great moon (its picture, CANCER_PROPS)
     with its halo on the GPU */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.lunarsky = { base: '#1B1036',
    paint(c, S, R) { c.fillStyle = '#1B1036'; c.fillRect(0, 0, S, S); const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
      for (let i = 0; i < 10; i++) { const x = R() * S, y = R() * S, w = 40 + R() * 70, col = R() < 0.5 ? '120,80,200' : '200,110,170', a = 0.07 + R() * 0.08; wrap((ox, oy) => { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x + ox - w, y + oy - w, w * 2, w * 2); }); }
      for (let i = 0; i < 120; i++) { const x = R() * S, y = R() * S, z = R(), a = 0.25 + z * 0.7, s = z > 0.93 ? 1.8 : z > 0.7 ? 1.2 : 0.8; c.fillStyle = `rgba(${z > 0.8 ? '255,240,255' : '220,215,255'},${a.toFixed(2)})`; c.fillRect(x, y, s, s); if (z > 0.95) { const g = c.createRadialGradient(x, y, 0, x, y, 5); g.addColorStop(0, 'rgba(220,200,255,.35)'); g.addColorStop(1, 'rgba(220,200,255,0)'); c.fillStyle = g; c.fillRect(x - 5, y - 5, 10, 10); } } },
    back(c, o) { const { pat, grad, pattern, k, P, W, H, t, wx, wy, bigGlow } = o; grad('#120828', '#3B2268');
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; bigGlow(c, P, '#5B3AA8', W * 0.5 - W * 0.9 - (wx * 0.08) % (W * 0.5), H * 0.05 - (wy * 0.05) % (H * 0.3), W * 1.8); c.globalAlpha = 0.25; bigGlow(c, P, '#A0508A', W * 0.2 - (wx * 0.12) % W, H * 0.45 - (wy * 0.1) % (H * 0.4), W * 1.2); c.restore();
      pat(pattern('lunarsky', k), 0.22, t * 0.6, 0);
      const C = CUR, T = C && C.X ? C.X.Tz() : 48, Rm = T * CANCER_PROPS_R(), par = 0.5, mx = W / 2 + (MOONW.x * T - wx) * par, my = H / 2 + (MOONW.y * T - wy) * par;
      if (mx > -Rm * 3 && mx < W + Rm * 3 && my > -Rm * 3 && my < H + Rm * 3) { const F = !lowFx() ? fgx() : null;
        // (one GPU pass: the halo and the violet haze drifting low over the moon, laid before its picture)
        if (F) { try { const Q = F.begin(c, null); Q.quad(139, mx, my, Rm * 3.2, 0, 0, Rm * 3.2, '#BBA6FF', 0.95, 1 / 3.2, 1.3, 1); for (let i = 0; i < 3; i++) Q.quad(131, mx + Math.sin(t * 0.05 + i * 2.1) * Rm * 1.4, my + Rm * (0.75 + 0.4 * i), Rm * 1.8, 0, 0, Rm * 0.5, '#8C70D8', 0.55, 0.4, i * 3.7, 0.7); F.flush(c); } catch (e) {} }
        const cp = CP(); if (cp) cp.draw(c, 'moon', 0, mx, my, Rm); } } };
  const CANCER_PROPS_R = () => (CP() ? CP().MOON_R : 3.4);

  /* ======================= the stage ======================= */
  let CUR = null;   // (the running stage: the sky reads its camera; let go when the stage closes)
  const PHASES = { riddle: 1, opening: 1, open: 1, sealing: 1, boss: 1, won: 1 };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const OPEN_T = 5.2, SEAL_T = 1.3;
  defGate('belfry', {
    name: 'The Oracle Shell', biome: 'nursery', goal: 'Answer the clam\'s three riddles', how: 'Stand beside the great clam to open it. It asks three riddles, each with five answers: choose the right one. The riddles come in a new order each time and the answers are shuffled. A wrong answer and the clam snaps shut: all three begin again. Answer all three in a row and the moon gate opens: what waits beyond it must be faced to wake Cancer.',
    layout: LAYOUT,
    legend: { O: {}, A: {}, D: { tile: T_SOLID }, d: { tile: T_SOLID }, P: { prop: 'cxpillar' }, C: { prop: 'cxcoral' }, L: { prop: 'cxscallop' } },
    // (the loading screen paints every picture at the floor's sharpness: nothing is painted mid-play)
    preload(P) { const cp = CP(), out = cp && P && P.T ? cp.warm(P.T * (P.k || 1)) : [];   /* (v447 K: and the boss's 3D model, built and on the GPU before the fight, not as it starts) */
      try { if (P && P.gl && typeof ABADDON_GL !== 'undefined' && ABADDON_GL.usable()) out.push(() => { try { ABADDON_GL.warm(); } catch (e) {} }); } catch (e) {} return out; },
    make(X, self, H) {
      const M = X.M, me = X.me, g = X.g, at = M.marks.O[0], MW = M.MW, MH = M.MH;
      const S = { phase: 'riddle', t: 0, open: 0, seal: 0, lit: 0, litK: [0, 0, 0], openT: 0, sealT: 0, passable: false, mist: [], fade: 1, ribFade: 1, shown: 0 };
      const R = { order: [], idx: 0, choices: [], open: false, el: null, tries: 0, lock: false, solved: 0, clamT: 0 };
      // the lands: the arena's tiles its own, the rest the shell's (the layout's frame was laid as the rift's land)
      { const li = BIOME_ORDER.indexOf('lunarfloor'), ni = BIOME_ORDER.indexOf('nursery'); for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) M.BI[y * MW + x] = y <= 20 ? li : ni; }
      // the arena's edge, laid over every ground chunk it crosses
      if (M.decalsByChunk && typeof DunWorld !== 'undefined') { const CHn = DunWorld.CH || 8; for (let cy = 0; cy <= Math.floor((WALLY + 1) / CHn); cy++) for (let cx = 0; cx <= Math.floor((MW - 1) / CHn); cx++) { const key = cx + ',' + cy, L = M.decalsByChunk.get(key) || []; L.push({ kind: 'cxedge', x: 0, y: 0, s: 1, rot: 0, cx, cy, n: CHn }); M.decalsByChunk.set(key, L); } }
      // the void all round: the frame of the layout (laid as wall) and whatever lies past the map are sky
      M.fill = T_GAP; for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) if (x === 0 || y === 0 || x === MW - 1 || y === MH - 1) X.setTile(x, y, T_GAP);
      // the clam stands solid on its bed (tiles held by a prop that draws nothing: never a wall)
      for (let x = 14; x <= 18; x++) { const k = 26 * MW + x; X.setTile(x, 26, T_SOLID); M.props.set(k, 'cxnone'); }
      const doorTiles = [[15, WALLY], [16, WALLY], [17, WALLY]];
      CUR = { X, S };
      try { X.F.name = 'The Gate of Cancer'; } catch (e) {}   // (the stage's title over its intro: the gate's own, not the rift's)
      /* ---- the riddles (the same rules and card as ever) ---- */
      function deal() { R.order = shuffle([0, 1, 2]); R.idx = 0; R.solved = 0; ask(); }
      function ask() { const Q = CANCER_RIDDLES[R.order[R.idx]]; R.choices = shuffle([Q.a].concat(Q.wrong)); R.lock = false; render(); }
      function openBoard() { if (R.open || S.phase !== 'riddle') return; R.open = true; document.querySelectorAll('.rift-riddle').forEach(e => e.remove()); const el = document.createElement('div'); el.className = 'arc-overlay rift-match rift-riddle'; el.id = 'riftRiddle'; R.el = el; document.getElementById('arcade').appendChild(el);
        el.addEventListener('click', ev => { const b = ev.target.closest('[data-ans]'); if (b) { answer(+b.dataset.ans); return; } if (ev.target.closest('.rm-close')) closeBoard(); });
        X.sfx.unlock(); deal(); }
      function closeBoard() { R.open = false; if (R.el) { R.el.remove(); R.el = null; } }
      function render(flash) { const el = R.el; if (!el) return; const Q = CANCER_RIDDLES[R.order[R.idx]];
        el.innerHTML = `<div class="rm-card rr-card${flash ? ' ' + flash : ''}"><div class="rm-head"><b>The Oracle Shell</b><button type="button" class="btn rm-close">Step away</button></div>
          <div class="rr-dots">${[0, 1, 2].map(i => `<i class="${i < R.solved ? 'on' : i === R.idx ? 'cur' : ''}"></i>`).join('')}<span>Riddle ${R.idx + 1} of 3</span></div>
          <p class="rr-q">${esc(Q.q)}</p>
          <div class="rr-list">${R.choices.map((a, i) => `<button type="button" class="rr-ans" data-ans="${i}"><span>${'ABCDE'[i]}</span>${esc(a)}</button>`).join('')}</div>
          <p class="rm-help">One answer is right. A wrong answer and all three begin again, in a new order.</p></div>`; }
      function answer(i) { if (R.lock || self.done || S.phase !== 'riddle' || !R.open) return; const Q = CANCER_RIDDLES[R.order[R.idx]], right = R.choices[i] === Q.a; R.lock = true; R.tries++;
        const btn = R.el && R.el.querySelector(`[data-ans="${i}"]`); if (btn) btn.classList.add(right ? 'right' : 'wrong');
        if (right) { R.solved++; S.lit = R.solved; X.sfx.chirp(); X.sparks(clam.x, clam.y - 1.4, '#FFE6F0', 10, 4); chime(R.solved);
          if (R.solved >= 3) { setTimeout(() => { if (CUR && CUR.S === S) { closeBoard(); startOpen(); } }, 700); return; }
          setTimeout(() => { if (!R.el) return; R.idx++; ask(); }, 650); }
        else { X.sfx.wrong(); X.shake(5, 0.2); setTimeout(() => { if (!R.el) return; X.banner('THE CLAM SNAPS SHUT', 'Wrong: the three riddles begin again', '#FF9BD2', 2.0, true); S.lit = 0; deal(); render('shake'); }, 750); } }
      const rightIndex = () => (R.open && R.choices.length ? R.choices.indexOf(CANCER_RIDDLES[R.order[R.idx]].a) : -1);
      const note = (f, d, ty, v, f1, dl) => { try { if (X.sfx && X.sfx.note) X.sfx.note(f, d, ty, v, f1, dl); } catch (e) {} };
      function chime(n) { const base = [523, 659, 784][Math.max(0, Math.min(2, n - 1))]; note(base, 1.4, 'sine', 0.22); note(base * 2, 0.8, 'sine', 0.08); note(base * 1.5, 1.1, 'triangle', 0.06, null, 0.06); }
      /* ---- the moon gate ---- */
      function setDoor(open) { for (const [x, y] of doorTiles) X.setTile(x, y, open ? T_FLOOR : T_SOLID); S.passable = open; try { X.retile(); } catch (e) {} }
      function startOpen() { if (S.phase !== 'riddle') return; S.phase = 'opening'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_FLOOR]));   /* (v447 K: the open door's floor painted ahead, no glitch as it opens) */ S.openT = 0; S.lit = 3; X.banner('THE ORACLE IS ANSWERED', 'The moon gate wakes in the north wall', '#FFE6F0', 1.7, true, true); X.flash(0.3, '#FFFFFF'); X.sfx.fanfare(); X.ring(clam.x, clam.y - 0.6, 0.3, 5, 0.8, PINK, 0.4); }
      function opened() { S.phase = 'open'; X.banner('THE MOON GATE OPENS', 'Beyond it waits the Moonlit Arena', MOONC, 2.6, true, true); }
      function seal() { if (S.phase !== 'open') return; S.phase = 'sealing'; if (X.prepTiles) X.prepTiles(doorTiles.map(([x, y]) => [x, y, T_SOLID])); S.sealT = 0; X.sfx.whoosh && X.sfx.whoosh(); }
      function sealed() { // the gate shut behind the pet: the fight, or (without the boss) Cancer wakes
        if (me.y > WALLY - 0.6) me.y = WALLY - 0.7; setDoor(false); X.shake(9, 0.5); X.sfx.thud && X.sfx.thud(); note(110, 2.4, 'sine', 0.3); note(55, 2.8, 'sine', 0.2);
        const B = CB(); if (B && typeof B.begin === 'function') { S.phase = 'boss'; X.banner('SEALED IN MOONLIGHT', 'The gate is shut behind you', LAV, 2.4, true, true);
          try { B.begin(X, H, self, { cx: AC.x, cy: AC.y, r: ARY, rx: ARX, ry: ARY, ax0: AC.x - ARX + 0.5, ay0: AC.y - ARY + 0.5, ax1: AC.x + ARX - 0.5, ay1: WALLY - 0.5, door: { x: DOORX, y: WALLY - 0.5 } }); } catch (e) { if (typeof console !== 'undefined') console.error(e); win(); } }
        else win(); }
      function win() { if (self.done) return; self.done = true; S.phase = 'won'; X.banner('THE ORACLE IS ANSWERED', 'Cancer wakes over the Moonlit Arena', GOLD, 2.8, true, true); X.flash(0.4, '#FFFFFF'); X.sfx.fanfare(); X.ring(me.x, me.y, 0.3, 6, 0.9, LAV, 0.4); X.after(2.6, () => X.winStage()); }
      /* ---- the objects: the clam, the gate, the wall's ribs, the drifting crescents, the light over them all ---- */
      const PZ = () => { const G = CP() ? CP().GEO : null; return G ? G.bedH + G.clamH + 0.02 + G.pearlR * 0.85 : 1.2; };
      const clam = H.obj({ x: at.x, y: at.y, kind: 'oracle', r: 1.7, h: 2.6, t: 0, label: () => (S.phase === 'riddle' ? (R.open ? '' : 'The Oracle Shell: hear its riddles') : ''), use() { if (S.phase === 'riddle') openBoard(); },
        draw(c, Xs, Ys, T) { const cp = CP(); if (!cp) return; const G = cp.GEO, k = ease(R.clamT), th = k * 1.31, K = 0.34, sc = (K * Math.cos(th) - Math.sin(th)) / K, so = (Math.sin(th) - K * Math.cos(th)) / (Math.sin(1.31) - K * Math.cos(1.31)), pv = Ys + G.hinge * T;
          const lidAt = (name, s) => { c.save(); c.translate(0, pv); c.scale(1, s); c.translate(0, -pv); cp.draw(c, name, 0, Xs, Ys, T); c.restore(); };
          if (so > 0.02) lidAt('lidup', Math.min(1, so));
          cp.draw(c, 'clam', 0, Xs, Ys, T);
          if (sc > 0.02) lidAt('lid', sc);
          // the three answered riddles: little pearls of light over the open clam
          if (R.open && k > 0.5) for (let i = 0; i < 3; i++) { const x = Xs + (i - 1) * T * 0.42, y = Ys - T * (G.lidLen - G.hinge + 0.35) - Math.sin(clam.t * 2 + i) * T * 0.05, on = i < R.solved, rr = T * 0.11; const gr = c.createRadialGradient(x - rr * 0.3, y - rr * 0.35, rr * 0.1, x, y, rr); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(1, on ? '#F7C7DA' : 'rgba(200,190,220,.55)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, rr, 0, TAU); c.fill(); c.strokeStyle = on ? 'rgba(150,70,110,.7)' : 'rgba(80,60,110,.45)'; c.lineWidth = 1.2; c.stroke(); } } });
      const door = H.obj({ x: DOORX, y: DOORY - 0.02, kind: 'moongate', r: 0, h: 4.9, label: '',
        draw(c, Xs, Ys, T) { const cp = CP(); if (!cp) return; const G = cp.GEO.ring, Yf = X.sy(DOORY), k = ease(S.open), off = k * (G.Ri + 0.2) * T, cy = Yf - G.cy * T, a = S.fade;
          c.save(); c.globalAlpha *= a; c.beginPath(); c.arc(Xs, cy, G.Ri * T, 0, TAU); c.clip(); cp.draw(c, 'leaf', 'l', Xs - off, Yf, T); cp.draw(c, 'leaf', 'r', Xs + off, Yf, T); c.restore();
          cp.draw(c, 'door', 0, Xs, Yf, T, { alpha: a }); } });
      const ribs = RIBS.map(([x, y, v]) => H.obj({ x, y, kind: 'shellrib', r: 0, label: '', draw(c, Xs, Ys, T) { const cp = CP(); if (cp) cp.draw(c, 'rib', v, Xs, X.sy(y), T, { alpha: y < 22.5 ? S.ribFade : 1 }); } }));
      const shards = SHARDS.map(q => H.obj({ x: q.x, y: q.y, kind: 'moonshard', r: 0, label: '', draw(c, Xs, Ys, T) { const cp = CP(); if (!cp) return; const t = g.t, bob = Math.sin(t * 0.8 + q.ph) * 0.18; cp.draw(c, 'shard', q.v, Xs, Ys - T * (q.lift + bob), T * q.s, { rot: Math.sin(t * 0.35 + q.ph) * 0.35 }); } }));
      // the light over everything standing (drawn last among them: its y is past every other)
      H.obj({ x: AC.x, y: 1e6, kind: 'cxlight', r: 0, label: '', draw(c) { lightOver(c); } });
      X.after(2.6, () => X.banner('THE ORACLE SHELL', 'Stand beside the great clam: answer its three riddles', PINK, 2.8, true, true));
      /* ---- the GPU light ---- */
      const onScr = (x, y, r) => { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y), Rr = r * T; return Xs + Rr > -T && Xs - Rr < X.W() + T && Ys + Rr > -T * 3 && Ys - Rr < X.H() + T * 3; };
      function lightGround(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the arena: its rings' running light, lavender caustics, the sigil's seal, mist pooled at its rim
        if (onScr(AC.x, AC.y, ARX + 2)) { const ax = X.sx(AC.x), ay = X.sy(AC.y), Q2 = q();
          if (!lf) { Q2.quad(136, ax, ay, ARX * T, 0, 0, ARY * T, '#A890F0', 0.38, 1, 0.7, 0.12); Q2.caustic(ax, ay, ARX * T * 0.98, '#9C86E8', 0.05, 3.3, ARY / ARX); Q2.quad(121, ax, ay, T * 1.9, 0, 0, T * 1.9 * ARY / ARX, '#E8C98A', 0.16, 1, t * 0.08, 0.6);
            for (let i = 0; i < 9; i++) { const a = -Math.PI + (i + 0.5) / 9 * Math.PI * 2 + Math.sin(t * 0.07 + i) * 0.12, [mx, my] = AP(0.94, a); if (my > WALLY - 1) continue; Q2.quad(137, X.sx(mx), X.sy(my), T * 3.2, 0, 0, T * 1.4, MIST, 0.8, 0.6 * (i % 2 ? 1 : -1), i * 2.3, 1); }
            // violet mist drifting low over the floor
            for (let i = 0; i < 4; i++) { const a = i * 1.57 + t * 0.03, [mx, my] = AP(0.45 + 0.12 * Math.sin(t * 0.05 + i), a); Q2.quad(137, X.sx(mx), X.sy(my), T * 5.5, 0, 0, T * 2.4, '#9A7EE0', 0.42, 0.4, 11 + i * 3.1, 0.6); } }
          for (const [x, y] of PILLARS) Q2.glow(X.sx(x + 0.5), X.sy(y + 0.92), T * 1.1, LAV, 0.14, 0.4); }
        // the grotto: pearl light round the clam, the pools' caustics
        if (onScr(C0.x, C0.y + 1, 10)) { const Q2 = q(), cx = X.sx(clam.x), cy = X.sy(clam.y), k = ease(R.clamT);
          Q2.glow(cx, cy, T * 3.2, '#FFC8DE', 0.16 + 0.14 * k + 0.04 * Math.sin(t * 1.3), 0.42); if (k > 0.05 || S.phase !== 'riddle') Q2.caustic(cx, cy, T * 2.6, '#FFE0EE', 0.16 * Math.max(k, S.phase === 'riddle' ? 0 : 1), 5.1, 0.42);
          for (const pl of POOLS) { const px = X.sx(pl.x), py = X.sy(pl.y); Q2.caustic(px, py, pl.rx * T, '#A8FFF2', lf ? 0.18 : 0.32, pl.s * 1.7, pl.ry / pl.rx); if (!lf) { Q2.glow(px, py, pl.rx * T * 1.3, '#7FE6E6', 0.12, pl.ry / pl.rx); const u = (t * 0.33 + pl.s * 0.37) % 1; Q2.ripple(px + Math.sin(pl.s * 4) * pl.rx * T * 0.3, py, pl.rx * T * 0.75 * u, '#E8FFFF', 0.35 * (1 - u), pl.s, pl.ry / pl.rx, 0.1); } } }
        // the gate: its threshold glowing; once open, light falling across the grotto's floor and violet mist rolling out over it
        if (onScr(DOORX, DOORY, 7)) { const Q2 = q(), dx = X.sx(DOORX), dy = X.sy(DOORY), o = ease(S.open), sk = Math.max(S.lit / 3 * 0.6, o);
          Q2.glow(dx, dy + T * 0.6, T * 3.4, VIOLET, 0.14 + 0.25 * sk, 0.45);
          if (o > 0.02) { Q2.quad(138, dx, dy + T * 3.6, T * 4.6, 0, 0, T * 3.8, '#D9CCFF', 0.55 * o, 0.42, 2.1, lf ? 0 : 0.8); Q2.caustic(dx, dy + T * 2.2, T * 3.2, '#C6B2FF', 0.22 * o, 7.7, 0.5); }
          if (!lf) for (const m of S.mist) Q2.quad(137, X.sx(m.x), X.sy(m.y), T * m.r, 0, 0, T * m.r * 0.45, MIST, m.a, m.dr, m.sd, 0.85); }
        if (Q) F.flush(c); }
      function lightOver(c) { const F = fgx(); if (!F) return; const lf = lowFx(), T = X.Tz(), t = g.t; let Q = null; const q = () => Q || (Q = F.begin(c, null));
        // the oracle pearl (always: it is the riddles' own light), the pearls of the answers
        if (onScr(clam.x, clam.y, 4)) { const Q2 = q(), cp = CP(), G = cp ? cp.GEO : null, k = ease(R.clamT), px = X.sx(clam.x), py = X.sy(clam.y) - PZ() * T, br = 0.5 + 0.5 * Math.sin(t * 1.6);
          if (k > 0.02 || S.phase !== 'riddle') { Q2.quad(140, px, py, T * (1.0 + 0.5 * k), 0, 0, T * (1.0 + 0.5 * k), '#FFE6F2', (0.55 + 0.25 * br) * Math.max(k, S.phase === 'riddle' ? 0 : 1), 0.4, 1.7, 1); Q2.star(px - T * 0.1, py - T * 0.12, T * (0.3 + 0.2 * br), 0.7 * Math.max(k, 0.3), '#FFFFFF'); }
          else Q2.glow(px, py + T * 0.3, T * 1.3, '#FFC8DE', 0.18 + 0.1 * br, 0.7);
          if (R.open && k > 0.5 && G) for (let i = 0; i < R.solved; i++) Q2.quad(140, X.sx(clam.x) + (i - 1) * T * 0.42, X.sy(clam.y) - T * (G.lidLen - G.hinge + 0.35), T * 0.45, 0, 0, T * 0.45, '#FFD6E8', 0.8, 1.2, i, 0.8);
          if (!lf) for (let i = 0; i < 4; i++) { const u = (t * 0.18 + i / 4) % 1, a = i * 1.7 + t * 0.2; Q2.star(px + Math.cos(a) * T * (0.6 + u * 0.8), py - T * u * 1.6, T * 0.06, 0.8 * Math.sin(u * Math.PI) * Math.max(0.3, k), '#FFF2F8'); } }
        // the gate: its three sockets lit as the riddles fall; the seam splitting; light pouring through the opening; motes in it
        if (onScr(DOORX, DOORY - 2, 7)) { const Q2 = q(), cp = CP(), G = cp ? cp.GEO.ring : { cy: 1.95, Ri: 1.55 }, dx = X.sx(DOORX), cy = X.sy(DOORY) - G.cy * T, o = ease(S.open), fa = S.fade;
          for (let i = 0; i < 3; i++) { S.litK[i] += ((i < S.lit ? 1 : 0) - S.litK[i]) * Math.min(1, (S.dt || 0.016) * 4); const kk = S.litK[i]; if (kk < 0.02 || o > 0.85) continue;
            const sy2 = i === 0 ? cy + 1.05 * T : i === 1 ? cy - 1.18 * T : cy; Q2.glow(dx, sy2, T * (i === 2 ? 1.4 : 0.6), i === 2 ? '#E8E2FF' : GOLD, (0.55 + 0.2 * Math.sin(t * 3 + i)) * kk * (1 - o) * fa); Q2.star(dx, sy2, T * (i === 2 ? 0.55 : 0.32), 0.85 * kk * (1 - o) * fa, '#FFFFFF'); }
          if (S.phase === 'opening' || o > 0.01) { const sp = clamp((S.openT - 0.8) / 1.0, 0, 1) * (1 - o * 0.6); if (sp > 0.01) { Q2.beam(dx, cy - G.Ri * T, dx, cy + G.Ri * T, T * 0.16, '#FFFFFF', 0.9 * sp * fa); Q2.beam(dx, cy - G.Ri * T, dx, cy + G.Ri * T, T * 0.6, LAV, 0.5 * sp * fa); }
            if (o > 0.01) { Q2.glow(dx, cy, G.Ri * T * (0.9 + 0.5 * o), '#E4DAFF', 0.55 * o * fa); Q2.quad(138, dx, cy + G.Ri * T * 1.2, G.Ri * T * 1.5, 0, 0, G.Ri * T * 2.2, '#EEE6FF', 0.4 * o * fa, 0.5, 4.4, lf ? 0 : 1); if (!lf) for (let i = 0; i < 6; i++) { const u = (t * 0.25 + i / 6) % 1; Q2.star(dx + Math.sin(i * 2.3 + t) * G.Ri * T * 0.7, cy + G.Ri * T * (u * 2.2 - 0.6), T * 0.06, 0.8 * Math.sin(u * Math.PI) * o * fa, '#FFFFFF'); } } } }
        // the arena: the pillars' crescents and orbs aglow, halos round the drifting crescents, motes rising in the moonlight, a shaft of it
        if (!lf && onScr(AC.x, AC.y, ARX + 3)) { const Q2 = q();
          for (const [x, y] of PILLARS) { const px = X.sx(x + 0.5), py = X.sy(y + 0.92) - T * 2.95; if (onScr(x, y - 3, 2)) { Q2.glow(px, py, T * 0.9, LAV, 0.32 + 0.1 * Math.sin(t * 1.2 + x)); } }
          for (const s of SHARDS) { if (!onScr(s.x, s.y - 1, 2)) continue; const bob = Math.sin(t * 0.8 + s.ph) * 0.18; Q2.glow(X.sx(s.x), X.sy(s.y) - T * (s.lift + bob + 0.3 * s.s), T * 1.0 * s.s, '#C9B6FF', 0.28); const tw = Math.pow(Math.max(0, Math.sin(t * 0.9 + s.ph * 3)), 30); if (tw > 0.03) Q2.star(X.sx(s.x) - T * 0.2 * s.s, X.sy(s.y) - T * (s.lift + bob + 0.55 * s.s), T * 0.35 * s.s, tw, '#FFFFFF'); }
          for (let i = 0; i < 10; i++) { const u = (t * 0.05 + i / 10) % 1, a = i * 2.39, rr = 0.25 + 0.65 * hh(i, 4), [mx, my] = AP(rr, a); Q2.star(X.sx(mx) + Math.sin(t * 0.6 + i) * T * 0.3, X.sy(my) - T * u * 3.5, T * 0.07, 0.7 * Math.sin(u * Math.PI), '#EEE8FF'); }
          const mx2 = X.sx(AC.x + 3), my2 = X.sy(AC.y); Q2.shafts(mx2 + T * 3, my2 - T * 9, mx2 - T * 1.5, my2 + T * 1.5, T * 3.2, '#CFC2FF', 0.06, 2.2); }
        if (Q) F.flush(c); }
      /* ---- the stage's turn ---- */
      function update(dt) { S.t += dt; clam.t += dt; S.dt = dt;
        { const cp = CP(); if (cp && !cp.base && cp.setBase) cp.setBase(X.Tz() / (g.zoom || 1) * Math.min(2, (typeof arc !== 'undefined' && arc.dpr) || 1)); }   // (no loading pass ran: the floor's sharpness, once)
        R.clamT = clamp(R.clamT + ((R.open || S.phase !== 'riddle') ? dt * 2.2 : -dt * 2.4), 0, 1);
        if (R.open && Math.hypot(me.x - clam.x, me.y - clam.y) > 5) closeBoard(); if (R.open && (me.dead || g.won)) closeBoard();
        if (S.phase === 'opening') { S.openT += dt; const u = S.openT;
          if (u > 0.8 && u - dt <= 0.8) { X.shake(4, 0.6); note(98, 2.6, 'sine', 0.32); note(49, 3.0, 'sine', 0.22); note(196 * 1.19, 1.6, 'sine', 0.12); }
          if (u > 1.8) S.open = clamp((u - 1.8) / 2.2, 0, 1);
          if (u > 1.8 && u - dt <= 1.8) { X.shake(7, 1.6); X.sfx.whoosh && X.sfx.whoosh(); }
          if (S.open > 0.75 && !S.passable) setDoor(true);
          if (u > 1.9 && !lowFx() && S.mist.length < 14 && Math.random() < dt * 6) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.9, vy: 0.9 + Math.random() * 0.8, r: 1.4 + Math.random() * 1.2, a: 0, life: 0, max: 4.5 + Math.random() * 2.5, dr: (Math.random() - 0.5) * 2, sd: Math.random() * 9 });
          if (u >= OPEN_T) opened(); }
        if (S.phase === 'open') { if (me.y < WALLY - 0.9 && Math.abs(me.x - DOORX) < 6 && !me.dead) seal(); else if (!lowFx() && S.mist.length < 8 && Math.random() < dt * 1.2) S.mist.push({ x: DOORX + (Math.random() - 0.5) * 2.2, y: DOORY + 0.3, vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 0.5, r: 1.2 + Math.random(), a: 0, life: 0, max: 5 + Math.random() * 2, dr: (Math.random() - 0.5) * 2, sd: Math.random() * 9 }); }
        if (S.phase === 'sealing') { S.sealT += dt; S.open = clamp(1 - S.sealT / SEAL_T, 0, 1); if (S.sealT >= SEAL_T) sealed(); }
        for (const m of S.mist) { m.life += dt; m.x += m.vx * dt; m.y += m.vy * dt; m.vy *= 1 - dt * 0.3; m.r += dt * 0.35; m.a = 0.5 * Math.sin(Math.min(1, m.life / m.max) * Math.PI); } for (let i = S.mist.length - 1; i >= 0; i--) if (S.mist[i].life >= S.mist[i].max) S.mist.splice(i, 1);
        // the gate and the wall's ribs grow faint while something stands behind them
        const B = CB(), boss = g.boss && !g.boss.dead ? g.boss : null, behind = (x, y, w) => y < DOORY - 0.2 && y > DOORY - 5.6 && Math.abs(x - DOORX) < w;
        const hid = behind(me.x, me.y, 3.6) || (boss && behind(boss.x, boss.y, 3.6 + (boss.r || 1))); S.fade += ((hid ? 0.42 : 1) - S.fade) * Math.min(1, dt * 6);
        const ribHid = me.y < DOORY - 0.2 && me.y > DOORY - 4 && (Math.abs(me.x - 10.2) < 2.2 || Math.abs(me.x - 22.8) < 2.2); S.ribFade += ((ribHid ? 0.45 : 1) - S.ribFade) * Math.min(1, dt * 6);
        if (S.phase === 'boss' && B && typeof B.update === 'function') { try { B.update(dt); } catch (e) { if (typeof console !== 'undefined') console.error(e); } } }
      const doorHint = { x: DOORX, y: DOORY - 0.4, h: 4.6, label: 'The moon gate' };
      const mod = { R, S, clam, door, ribs, shards, answer, openBoard, closeBoard, deal, rightIndex, riddles: CANCER_RIDDLES, geo: { AC, ARX, ARY, WALLY, DOORX, DOORY, C0 }, update,
        hint() { return S.phase === 'riddle' ? (R.open ? null : clam) : S.phase === 'open' ? doorHint : null; },
        goal: () => { if (S.phase === 'boss') { const B = CB(); return B && typeof B.goal === 'function' ? B.goal() : 'Face what waits in the Moonlit Arena'; }
          return S.phase === 'won' ? 'Cancer wakes' : S.phase === 'opening' ? 'The moon gate opens…' : S.phase === 'open' ? 'Walk through the moon gate' : S.phase === 'sealing' ? 'The gate seals behind you' : R.open ? `Riddle ${R.idx + 1} of 3 · ${R.solved} answered` : 'Stand beside the great clam to hear its riddles'; },
        cam() { if (S.phase === 'opening') return { x: DOORX, y: DOORY - 1.2, k: 0.9 }; if (S.phase === 'boss') { const B = CB(); if (B && typeof B.cam === 'function') { try { return B.cam(); } catch (e) {} } } return null; },
        hideHud() { const B = CB(); return S.phase === 'boss' && B && typeof B.hideHud === 'function' ? !!B.hideHud() : false; },
        onBossDeath(m) { const B = CB(); return S.phase === 'boss' && B && typeof B.onBossDeath === 'function' ? !!B.onBossDeath(m) : false; },
        drawGround(c) { lightGround(c); const B = CB(); if (S.phase === 'boss' && B && typeof B.drawGround === 'function') { try { B.drawGround(c); } catch (e) {} }
          if (S.phase === 'riddle' && !R.open && !lowFx()) { const F = fgx(); if (F) { try { const Q = F.begin(c, null), T = X.Tz(); Q.ring(X.sx(clam.x), X.sy(clam.y), T * 2.15, PINK, 0.3 + 0.15 * Math.sin(g.t * 3), T * 0.08, 0.42); F.flush(c); } catch (e) {} } } },
        drawOver(c) { const B = CB(); if (S.phase === 'boss' && B && typeof B.drawOver === 'function') { try { B.drawOver(c); } catch (e) {} } },
        teardown };
      function teardown() { closeBoard(); const B = CB(); if (B && typeof B.stop === 'function') { try { B.stop(); } catch (e) {} } if (CUR && CUR.S === S) CUR = null; S.mist.length = 0; }
      LIVE = mod;
      return mod;
    },
  });
  /* ---- letting go: when the dungeon game closes (its destroy) and whenever a new stage is made (BEL.releaseStale) the gate's
     boss is stopped, its card removed and every picture given back ---- */
  let LIVE = null;
  function release() { const m = LIVE; LIVE = null; CUR = null; if (m) { try { m.teardown(); } catch (e) {} } const cp = CP(); if (cp) { try { cp.release(); } catch (e) {} } }
  try { if (typeof BEL !== 'undefined' && BEL && Array.isArray(BEL.onRelease)) BEL.onRelease.push(() => { if (LIVE || CUR) release(); }); } catch (e) {}
  try { const GD = typeof GAMES !== 'undefined' && GAMES.dungeon; if (GD && GD.create && !GD.__cxRel) { const c0 = GD.create; GD.__cxRel = 1; GD.create = function () { const api = c0.apply(this, arguments); if (api && typeof api.destroy === 'function') { const d0 = api.destroy; api.destroy = function () { if (LIVE) release(); return d0.apply(this, arguments); }; } return api; }; } } catch (e) {}
  if (typeof window !== 'undefined') window.CANCER_GATE = { get live() { return LIVE; }, release, LAYOUT, PILLARS, SHARDS, POOLS, AC, ARX, ARY, WALLY, DOORX, DOORY };
})();
