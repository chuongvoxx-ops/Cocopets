/* ---------- The Drowned Belfry's three dungeons, each its own place (v394 PR) ----------
   As the Caldera's Cinder Galleries, Rimebound Forge and Glass Heart differ, so do the Belfry's three dungeons:
     d1  THE DROWNED LOWER CHURCH   ivory limestone and teal, moonlit, shallow water, columns (20n's lands: belnave,
                                    belfry, belcause), every prop the v392 repaint
     d2  THE BELL FOUNDRY UNDERCROFT a flooded industrial underlevel: dark slate and iron plate with brass inlay, casting
                                    channels of molten bronze against the cold sea seeping in, iron grating over black
                                    water, steam; chains, anvils, crucibles, cages, casting pits, braziers, giant moulds,
                                    pipes and valves; beyond the floor, the deep sea, the undercroft's furnace windows far off
     d3  THE STORM GALLERIES        the tower's exterior walks and upper galleries in a storm: rain-slicked dark limestone,
                                    puddles that hold the purple sky, gutters; broken statues, torn banners, bell-rope
                                    rigging, swinging lanterns, crumbling balustrades; beyond, the wind-lashed sea far below,
                                    storm cloud, lightning, the giant bell's silhouette overhead; rain on the screen
   Every floor is seamless (the Caldera's v389 F technique: 20n's world-space blocks under this file's world-space overlays;
   a tile is only a window). Every prop breaks through BREAK_FX in its own material (20n9).
   API (for B1's stage code; read at run time):
     BEL.THEMES = window.BEL_THEME = { d1 | d2 | d3: { key, name, land (a BIOMES key), lands, props (prop kinds), legend
       (20n's layout letters to this dungeon's props), glow (accent hex), gap (the backdrop), grade, ambient, paintSky(c, W, H,
       T, o) } }; BIOMES.belfoundry and BIOMES.belstorm (B1's land names) are this file's. Per-dungeon ambience (molten glow,
       steam, rain, puddle rings, lightning) rides on 20n's Rf.everyStage, keyed by BEL.dungeonCtx(X).key where 20n has it,
       else by the stage's land. window.__BEL_RAIN = 0 turns the rain off (st.lowFx thins it). */
var BEL_THEMES = (() => {
  if (typeof BEL === 'undefined' || typeof BIOMES === 'undefined') return null;
  const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const hh = BEL.hh || ((x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; });
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const glow = (c, x, y, r, col, a) => { if (BEL.glow) BEL.glow(c, x, y, r, col, a); };
  const mkc = (w, h) => { const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv; };

  /* ======================= the lands (20n's block floor, 20n's LANDS numbers) ======================= */
  Object.assign(BEL.LANDS, {
    belfoundry: { name: 'The Bell Foundry Undercroft', base: '#40484B', tones: ['#4A5255', '#434B4E', '#3C4447', '#515A5C', '#464E50'], seam: '#15191B', seamW: 0.06, bw: 1.85, bh: 1.2, jit: 0.15, split: 0.14, stain: 0.45, wet: 0.35, algae: 0.04, specks: 6, cracks: 0.5, sheen: 'rgba(120,190,210,', edgeWet: 1.4, rust: 0.7 },
    belstorm: { name: 'The Storm Galleries', base: '#4A4C60', tones: ['#53556A', '#4C4E62', '#46485C', '#595B70', '#505266'], seam: '#1B1C28',   /* v394 PR: colder, violet (the floor itself is herringbone, below) */ seamW: 0.05, bw: 2.45, bh: 1.35, jit: 0.25, split: 0.2, stain: 0.3, wet: 0.95, algae: 0.12, specks: 4, cracks: 0.55, sheen: 'rgba(200,195,255,', edgeWet: 1.6 },
  });
  const floorAt = (c, id, x, y, T, X, Y) => BEL.floorAt(c, id, x, y, T, X, Y);
  // the floor's edge over the sea: wet and dark (as 20n's own edges)
  function edges(c, X, Y, T, gN, gS, gW, gE, k) { const side = (x0, y0, x1, y1, w, h) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(6,20,26,${0.4 * k})`); g.addColorStop(0.45, `rgba(6,20,26,${0.12 * k})`); g.addColorStop(1, 'rgba(6,20,26,0)'); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h); };
    if (gN) side(X, Y, X, Y + T * 0.6, T, T * 0.6); if (gS) side(X, Y + T, X, Y + T * 0.4, T, T * 0.6); if (gW) side(X, Y, X + T * 0.55, Y, T * 0.55, T); if (gE) side(X + T, Y, X + T * 0.45, Y, T * 0.55, T); }

  /* ---- D2: the foundry's floor over the slate: brass inlay on a 6-tile world grid, iron grating panels over black water,
     casting channels of molten bronze (each a world-space run; the live glow is the ambience's) ---- */
  const GRATE = (px, py) => hh(px, py, 201) < 0.16;
  const channels = (j) => { const out = []; for (let bx = -2; bx < 40; bx++) if (hh(bx, j, 211) < 0.5) { const x0 = bx * 8 + 1 + hh(bx, j, 213) * 2, x1 = x0 + 3 + hh(bx, j, 217) * 3; out.push([x0, x1]); } return out; };   // (row y = 7j + 4.5)
  const CH_CACHE = new Map(); const chRow = j => { let r = CH_CACHE.get(j); if (!r) { r = channels(j); CH_CACHE.set(j, r); } return r; };
  function foundryOver(c, X, Y, T, x, y) {
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T];
    // the brass inlay: strips on world lines x = 6k + 1.5, y = 6k + 2.5, riveted every tile
    for (let k = Math.floor((x - 2) / 6); k <= Math.floor((x + 2) / 6) + 1; k++) { const wx = k * 6 + 1.5; if (wx < x - 0.1 || wx > x + 1.1) continue; const a = P(wx, y); c.fillStyle = '#5E4A26'; c.fillRect(a[0] - T * 0.05, Y, T * 0.1, T); c.fillStyle = 'rgba(217,179,95,.85)'; c.fillRect(a[0] - T * 0.035, Y, T * 0.05, T); c.fillStyle = 'rgba(255,240,190,.4)'; c.fillRect(a[0] - T * 0.035, Y, Math.max(1, T * 0.012), T); const r = P(wx, Math.floor(y) + 0.5); c.fillStyle = '#E8C77A'; c.beginPath(); c.arc(r[0], r[1], Math.max(1, T * 0.045), 0, TAU); c.fill(); }
    for (let k = Math.floor((y - 2) / 6); k <= Math.floor((y + 2) / 6) + 1; k++) { const wy = k * 6 + 2.5; if (wy < y - 0.1 || wy > y + 1.1) continue; const a = P(x, wy); c.fillStyle = '#5E4A26'; c.fillRect(X, a[1] - T * 0.05, T, T * 0.1); c.fillStyle = 'rgba(217,179,95,.85)'; c.fillRect(X, a[1] - T * 0.035, T, T * 0.05); c.fillStyle = 'rgba(255,240,190,.4)'; c.fillRect(X, a[1] - T * 0.035, T, Math.max(1, T * 0.012)); }
    // iron grating panels (3 x 2 tiles on a world grid) over the black sea beneath
    for (let py = Math.floor((y - 2) / 2); py <= Math.floor((y + 1) / 2); py++) for (let px = Math.floor((x - 3) / 3); px <= Math.floor((x + 1) / 3); px++) { if (!GRATE(px, py)) continue; const x0 = px * 3 + 0.15, x1 = px * 3 + 2.85, y0 = py * 2 + 0.15, y1 = py * 2 + 1.85; if (x1 < x || x0 > x + 1 || y1 < y || y0 > y + 1) continue;
      const a = P(x0, y0), b = P(x1, y1), w = b[0] - a[0], h = b[1] - a[1]; const g = c.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, '#04121A'); g.addColorStop(1, '#0A2632'); c.fillStyle = g; c.fillRect(a[0], a[1], w, h);
      c.strokeStyle = 'rgba(110,200,210,.18)'; c.lineWidth = Math.max(1, T * 0.02); for (let i = 0; i < 6; i++) { const u = hh(px * 7 + i, py, 223), v = hh(px, py * 7 + i, 227), p = P(x0 + u * 2.7, y0 + v * 1.7); c.beginPath(); c.moveTo(p[0] - T * 0.2, p[1]); c.quadraticCurveTo(p[0], p[1] - T * 0.05, p[0] + T * 0.2, p[1]); c.stroke(); }
      for (let bx = x0 + 0.12; bx < x1; bx += 0.24) { const p = P(bx, y0); c.fillStyle = '#23282B'; c.fillRect(p[0] - T * 0.035, a[1], T * 0.07, h); c.fillStyle = 'rgba(160,170,175,.35)'; c.fillRect(p[0] - T * 0.035, a[1], Math.max(1, T * 0.018), h); }
      for (let by = y0 + 0.45; by < y1; by += 0.6) { const p = P(x0, by); c.fillStyle = '#2C3236'; c.fillRect(a[0], p[1] - T * 0.04, w, T * 0.08); c.fillStyle = 'rgba(190,200,205,.3)'; c.fillRect(a[0], p[1] - T * 0.04, w, Math.max(1, T * 0.015)); }
      c.strokeStyle = '#1A1E21'; c.lineWidth = T * 0.14; c.strokeRect(a[0], a[1], w, h); c.strokeStyle = 'rgba(150,160,165,.4)'; c.lineWidth = Math.max(1, T * 0.025); c.strokeRect(a[0] - T * 0.05, a[1] - T * 0.05, w + T * 0.1, h + T * 0.1);
      for (let rx = x0; rx <= x1 + 0.01; rx += 0.9) for (const ry of [y0, y1]) { const p = P(rx, ry); c.fillStyle = '#6A7074'; c.beginPath(); c.arc(p[0], p[1], Math.max(1, T * 0.04), 0, TAU); c.fill(); } }
    // the casting channels: grooves of molten bronze under a broken crust, iron-lipped
    for (let j = Math.floor((y - 5) / 7); j <= Math.floor((y + 3) / 7); j++) { const wy = j * 7 + 4.5; if (wy < y - 0.4 || wy > y + 1.4) continue;
      for (const [x0, x1] of chRow(j)) { if (x1 < x - 0.4 || x0 > x + 1.4) continue; const a = P(x0, wy), b = P(x1, wy), hw = T * 0.16;
        c.fillStyle = '#16100C'; c.beginPath(); c.moveTo(a[0], a[1] - hw * 1.3); c.lineTo(b[0], b[1] - hw * 1.3); c.arc(b[0], b[1], hw * 1.3, -Math.PI / 2, Math.PI / 2); c.lineTo(a[0], a[1] + hw * 1.3); c.arc(a[0], a[1], hw * 1.3, Math.PI / 2, Math.PI * 1.5); c.fill();
        const g = c.createLinearGradient(0, a[1] - hw, 0, a[1] + hw); g.addColorStop(0, '#A8360C'); g.addColorStop(0.45, '#FFC060'); g.addColorStop(0.55, '#FFE7A0'); g.addColorStop(1, '#C04810'); c.fillStyle = g; c.beginPath(); c.moveTo(a[0], a[1] - hw); c.lineTo(b[0], b[1] - hw); c.arc(b[0], b[1], hw, -Math.PI / 2, Math.PI / 2); c.lineTo(a[0], a[1] + hw); c.arc(a[0], a[1], hw, Math.PI / 2, Math.PI * 1.5); c.fill();
        for (let u = Math.floor(x0 * 3); u < x1 * 3; u++) { if (hh(u, j, 229) < 0.55) continue; const p = P(u / 3 + hh(u, j, 231) * 0.2, wy + (hh(u, j, 233) - 0.5) * 0.12); c.fillStyle = 'rgba(40,18,10,.85)'; c.beginPath(); c.ellipse(p[0], p[1], T * (0.07 + hh(u, j, 237) * 0.08), hw * 0.55, 0, 0, TAU); c.fill(); }
        c.strokeStyle = 'rgba(150,150,150,.45)'; c.lineWidth = Math.max(1, T * 0.02); c.beginPath(); c.moveTo(a[0], a[1] - hw * 1.3); c.lineTo(b[0], b[1] - hw * 1.3); c.stroke(); } }
  }
  /* ---- D3: rain-slick gallery stone: puddles holding the purple sky (4 x 3 world cells), gutters every 9 rows, wet glints ---- */
  const PUD = (cx, cy) => { if (hh(cx, cy, 301) > 0.5) return null; return { x: cx * 4 + 0.8 + hh(cx, cy, 303) * 2.4, y: cy * 3 + 0.7 + hh(cx, cy, 307) * 1.6, rx: 0.55 + hh(cx, cy, 311) * 0.9, ry: 0.32 + hh(cx, cy, 313) * 0.35, k: hh(cx, cy, 317) }; };
  function stormOver(c, X, Y, T, x, y) {
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T];
    for (let j = Math.floor((y - 2) / 9); j <= Math.floor((y + 2) / 9); j++) { const wy = j * 9 + 0.5; if (wy < y - 0.5 || wy > y + 1.5) continue; const a = P(x, wy), hw = T * 0.15, lp = T * 0.08;   // v394 PR: a running gutter, stone-lipped, the rain flowing in it
      c.fillStyle = '#16171F'; c.fillRect(X, a[1] - hw - lp, T, hw * 2 + lp * 2);
      for (const [y0, lit] of [[a[1] - hw - lp, 1], [a[1] + hw, 0]]) { const g = c.createLinearGradient(0, y0, 0, y0 + lp); g.addColorStop(0, lit ? '#7E809A' : '#4A4C62'); g.addColorStop(1, lit ? '#45475C' : '#2A2C3C'); c.fillStyle = g; c.fillRect(X, y0 + 1, T, lp - 1); c.fillStyle = `rgba(230,228,255,${lit ? 0.35 : 0.15})`; c.fillRect(X, y0 + 1, T, Math.max(1, T * 0.018));
        c.fillStyle = '#16171F'; for (let k = Math.floor(x / 0.7) - 1; k <= Math.floor((x + 1) / 0.7) + 1; k++) { const kx = k * 0.7 + (lit ? 0 : 0.35); if (kx < x - 0.05 || kx > x + 1.05) continue; c.fillRect(X + (kx - x) * T - 0.5, y0, Math.max(1, T * 0.025), lp); } }
      const g = c.createLinearGradient(0, a[1] - hw, 0, a[1] + hw); g.addColorStop(0, '#0E1020'); g.addColorStop(0.5, '#2E2C52'); g.addColorStop(1, '#4E4884'); c.fillStyle = g; c.fillRect(X, a[1] - hw, T, hw * 2);
      c.strokeStyle = 'rgba(220,215,255,.45)'; c.lineWidth = Math.max(1, T * 0.02); c.beginPath(); for (let k = Math.floor(x * 3) - 1; k <= Math.floor((x + 1) * 3) + 1; k++) { if (hh(k, j, 341) < 0.45) continue; const sx = X + (k / 3 + hh(k, j, 343) * 0.2 - x) * T, sy = a[1] + (hh(k, j, 347) - 0.5) * hw * 1.4; c.moveTo(sx, sy); c.lineTo(sx + T * (0.12 + hh(k, j, 349) * 0.12), sy); } c.stroke(); }
    for (let cy = Math.floor((y - 3) / 3); cy <= Math.floor((y + 2) / 3); cy++) for (let cx = Math.floor((x - 4) / 4); cx <= Math.floor((x + 2) / 4); cx++) { const q = PUD(cx, cy); if (!q || q.x + q.rx * 1.6 < x || q.x - q.rx * 1.6 > x + 1 || q.y + q.ry * 1.4 < y || q.y - q.ry * 1.4 > y + 1) continue;
      const lobes = [[0, 0, 1, 1], [q.rx * 0.55, q.ry * 0.25, 0.6, 0.7], [-q.rx * 0.5, -q.ry * 0.2, 0.55, 0.65]];
      const path = () => { c.beginPath(); for (const [dx, dy, kx, ky] of lobes) { const p = P(q.x + dx, q.y + dy); c.moveTo(p[0] + q.rx * kx * T, p[1]); c.ellipse(p[0], p[1], q.rx * kx * T, q.ry * ky * T, 0, 0, TAU); } };
      const p0 = P(q.x, q.y); path(); c.fillStyle = 'rgba(14,16,26,.45)'; c.fill();
      c.save(); path(); c.clip(); const g = c.createLinearGradient(0, p0[1] - q.ry * T, 0, p0[1] + q.ry * T); g.addColorStop(0, 'rgba(170,156,220,.5)'); g.addColorStop(0.45, 'rgba(84,78,134,.46)'); g.addColorStop(1, 'rgba(26,28,46,.5)'); c.fillStyle = g; c.fillRect(p0[0] - q.rx * 2 * T, p0[1] - q.ry * 2 * T, q.rx * 4 * T, q.ry * 4 * T);
      c.strokeStyle = 'rgba(240,236,255,.4)'; c.lineWidth = Math.max(1, T * 0.02); for (let i = 0; i < 3; i++) { const yy = p0[1] - q.ry * T * (0.5 - i * 0.18), xx = p0[0] + (hh(cx + i, cy, 319) - 0.5) * q.rx * T; c.beginPath(); c.moveTo(xx - T * 0.25, yy); c.lineTo(xx + T * 0.25, yy); c.stroke(); } c.restore();
      c.save(); path(); c.clip(); const rg = c.createRadialGradient(p0[0], p0[1], q.ry * T * 0.4, p0[0], p0[1], q.rx * 1.3 * T); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(120,124,140,.35)'); c.fillStyle = rg; c.fillRect(p0[0] - q.rx * 2 * T, p0[1] - q.ry * 2 * T, q.rx * 4 * T, q.ry * 4 * T); c.restore(); }   // (its edge fading into the wet stone)
    for (let i = 0; i < 3; i++) { const u = hh(Math.floor(x), Math.floor(y) * 3 + i, 331), v = hh(Math.floor(x) * 3 + i, Math.floor(y), 337); if (u > 0.55) continue; const p = P(Math.floor(x) + v, Math.floor(y) + u * 1.8); c.strokeStyle = 'rgba(225,225,255,.22)'; c.lineWidth = Math.max(1, T * 0.02); c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0] + T * 0.18, p[1] - T * 0.05); c.stroke(); }
  }
  const floorFn = (id, over, ek) => (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) => { floorAt(c, id, x, y, T, X, Y); c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); over(c, X, Y, T, x, y); edges(c, X, Y, T, gN, gS, gW, gE, ek); c.restore(); };
  /* v394 PR: D3's own floor, not D1's squares: long gallery setts laid in herringbone (2:1 bricks on a world lattice: horizontal
     ones at (k+2m, k-2m), upright ones at (k+2m, k+1-2m), in brick units HB tiles, an odd size so no joint keeps to the tile edge) */
  const HB = 0.42, HBT = ['#53556A', '#4C4E62', '#46485C', '#595B70', '#505266', '#43455A'];
  function herring(c, X, Y, T, x, y) {
    const j = Math.max(1, T * 0.035), e = Math.max(1, T * 0.03); c.fillStyle = '#1B1C28'; c.fillRect(X, Y, T, T);
    for (let py = Math.floor(y / HB) - 2; py <= Math.ceil((y + 1) / HB); py++) for (let px = Math.floor(x / HB) - 2; px <= Math.ceil((x + 1) / HB); px++) {
      const s = px + py, d = px - py; let w, h; if (!(s & 1) && ((d % 4) + 4) % 4 === 0) { w = 2; h = 1; } else if ((s & 1) && (((d + 1) % 4) + 4) % 4 === 0) { w = 1; h = 2; } else continue;
      if ((px + w) * HB < x || px * HB > x + 1 || (py + h) * HB < y || py * HB > y + 1) continue;
      const x0 = X + (px * HB - x) * T + j / 2, y0 = Y + (py * HB - y) * T + j / 2, ww = w * HB * T - j, hh0 = h * HB * T - j, r = hh(px, py, 501), r2 = hh(px, py, 503);
      c.fillStyle = HBT[Math.floor(r * HBT.length)]; c.fillRect(x0, y0, ww, hh0);
      c.fillStyle = 'rgba(205,200,255,.17)'; c.fillRect(x0, y0, ww, e); c.fillRect(x0, y0, e, hh0);   // (a worn bevel, lit from the storm above)
      c.fillStyle = 'rgba(8,8,18,.34)'; c.fillRect(x0, y0 + hh0 - e, ww, e); c.fillRect(x0 + ww - e, y0, e, hh0);
      if (r2 < 0.42) { c.fillStyle = `rgba(190,184,250,${(0.05 + r2 * 0.16).toFixed(3)})`; c.fillRect(x0 + ww * 0.12, y0 + hh0 * 0.18, ww * 0.62, hh0 * 0.26); }   // (the wet sheen on its dished top)
      else if (r2 > 0.86) { c.fillStyle = 'rgba(10,10,24,.2)'; c.fillRect(x0, y0, ww, hh0); }
      if (hh(px, py, 507) < 0.12) { c.fillStyle = '#1B1C28'; c.beginPath(); c.moveTo(x0 + ww, y0); c.lineTo(x0 + ww - T * 0.12, y0); c.lineTo(x0 + ww, y0 + T * 0.1); c.closePath(); c.fill(); } }
  }
  // the galleries' open edge: a stone balustrade (one tile's run, cached per size), the sea and sky beyond it
  const BALC = new Map();
  function balSprite(Tp, broken) { const key = Tp + (broken ? 'b' : ''); let cv = BALC.get(key); if (cv) return cv; const T = Tp; cv = mkc(T, T * 0.8); const c = cv.getContext('2d');
    let g = c.createLinearGradient(0, T * 0.64, 0, T * 0.8); g.addColorStop(0, '#6A6C82'); g.addColorStop(1, '#30324A'); c.fillStyle = g; c.fillRect(0, T * 0.64, T, T * 0.16); c.fillStyle = 'rgba(225,222,255,.35)'; c.fillRect(0, T * 0.64, T, Math.max(1, T * 0.025));
    for (let i = 0; i < 3; i++) { if (broken && i === 1) continue; const cx = (i + 0.5) / 3 * T, w = T * 0.1, y0 = T * 0.14, y1 = T * 0.64, hg = y1 - y0, bg = c.createLinearGradient(cx - w, 0, cx + w, 0); bg.addColorStop(0, '#2C2E40'); bg.addColorStop(0.35, '#9496AE'); bg.addColorStop(0.6, '#5C5E74'); bg.addColorStop(1, '#24263A'); c.fillStyle = bg;
      c.beginPath(); c.moveTo(cx - w * 0.55, y0); c.lineTo(cx + w * 0.55, y0); c.quadraticCurveTo(cx + w * 0.3, y0 + hg * 0.25, cx + w * 0.5, y0 + hg * 0.4); c.quadraticCurveTo(cx + w * 1.25, y0 + hg * 0.7, cx + w * 0.6, y0 + hg * 0.88); c.lineTo(cx + w * 0.75, y1); c.lineTo(cx - w * 0.75, y1); c.lineTo(cx - w * 0.6, y0 + hg * 0.88); c.quadraticCurveTo(cx - w * 1.25, y0 + hg * 0.7, cx - w * 0.5, y0 + hg * 0.4); c.quadraticCurveTo(cx - w * 0.3, y0 + hg * 0.25, cx - w * 0.55, y0); c.closePath(); c.fill(); c.strokeStyle = 'rgba(12,12,24,.6)'; c.lineWidth = Math.max(1, T * 0.012); c.stroke(); }
    if (broken) { c.fillStyle = '#4A4C60'; c.fillRect(T * 0.43, T * 0.56, T * 0.14, T * 0.08); }
    g = c.createLinearGradient(0, 0, 0, T * 0.15); g.addColorStop(0, '#9A9CB4'); g.addColorStop(0.4, '#6A6C84'); g.addColorStop(1, '#2E3044'); c.fillStyle = g;
    if (broken) { c.beginPath(); c.moveTo(0, 0); c.lineTo(T * 0.42, 0); c.lineTo(T * 0.5, T * 0.06); c.lineTo(T * 0.46, T * 0.15); c.lineTo(0, T * 0.15); c.closePath(); c.fill(); c.beginPath(); c.moveTo(T * 0.62, T * 0.03); c.lineTo(T, 0); c.lineTo(T, T * 0.15); c.lineTo(T * 0.58, T * 0.15); c.closePath(); c.fill(); } else c.fillRect(0, 0, T, T * 0.15);
    c.fillStyle = 'rgba(235,232,255,.5)'; c.fillRect(broken ? T * 0.62 : 0, 0, broken ? T * 0.38 : T, Math.max(1, T * 0.022)); if (broken) c.fillRect(0, 0, T * 0.42, Math.max(1, T * 0.022));
    c.fillStyle = 'rgba(20,20,36,.3)'; c.fillRect(0, T * 0.15, T, Math.max(1, T * 0.02));
    BALC.set(key, cv); return cv; }
  function parapet(c, X, Y, T, x, y, gN, gS, gW, gE) {
    if (!(gN || gS || gW || gE)) return; const sc = Math.abs(c.getTransform().a) || 1, Tp = Math.max(8, Math.round(T * sc)), rw = T * 0.16;
    for (const [on, sx, dir] of [[gW, X, 1], [gE, X + T - rw, -1]]) { if (!on) continue;   // (a side run seen from above: its coping, a post every tile, its shadow on the floor)
      const sh = c.createLinearGradient(dir > 0 ? X + rw : X + T - rw, 0, dir > 0 ? X + rw * 2.2 : X + T - rw * 2.2, 0); sh.addColorStop(0, 'rgba(6,6,16,.35)'); sh.addColorStop(1, 'rgba(6,6,16,0)'); c.fillStyle = sh; c.fillRect(dir > 0 ? X + rw : X + T - rw * 2.2, Y, rw * 1.2, T);
      const g = c.createLinearGradient(sx, 0, sx + rw, 0); g.addColorStop(0, dir > 0 ? '#8C8EA8' : '#3E4054'); g.addColorStop(1, dir > 0 ? '#4A4C62' : '#7C7E98'); c.fillStyle = g; c.fillRect(sx, Y, rw, T);
      c.fillStyle = '#1B1C28'; c.fillRect(sx, Y, rw, Math.max(1, T * 0.025)); c.fillStyle = 'rgba(150,152,176,.9)'; c.fillRect(sx - T * 0.02, Y + T * 0.42, rw + T * 0.04, T * 0.16); c.fillStyle = 'rgba(235,232,255,.4)'; c.fillRect(sx - T * 0.02, Y + T * 0.42, rw + T * 0.04, Math.max(1, T * 0.02)); }
    if (gS) { const g = c.createLinearGradient(0, Y + T - rw, 0, Y + T); g.addColorStop(0, '#8A8CA6'); g.addColorStop(1, '#3A3C52'); c.fillStyle = g; c.fillRect(X, Y + T - rw, T, rw); c.fillStyle = 'rgba(235,232,255,.4)'; c.fillRect(X, Y + T - rw, T, Math.max(1, T * 0.02)); c.fillStyle = '#1B1C28'; c.fillRect(X, Y + T - rw, Math.max(1, T * 0.025), rw); }
    if (gN) { const sh = c.createLinearGradient(0, Y + T * 0.16, 0, Y + T * 0.4); sh.addColorStop(0, 'rgba(6,6,16,.38)'); sh.addColorStop(1, 'rgba(6,6,16,0)'); c.fillStyle = sh; c.fillRect(X, Y + T * 0.16, T, T * 0.24);
      c.drawImage(balSprite(Tp, hh(x, y, 511) < 0.12), X, Y - T * 0.62, T, T * 0.8); }
  }
  const stormFloor = (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) => { c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip(); herring(c, X, Y, T, x, y); stormOver(c, X, Y, T, x, y); edges(c, X, Y, T, gN, gS, gW, gE, 1.6); c.restore(); parapet(c, X, Y, T, x, y, gN, gS, gW, gE); };

  /* ======================= the walls ======================= */
  function foundryWall(c, X, Y, T, H, h, x, lw) {   // dark slate in courses, an iron band, iron girder pilasters, portholes onto the deep sea, the forge's warmth from below
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#3A4044'); g.addColorStop(0.6, '#2E3437'); g.addColorStop(1, '#22272A'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    for (let k = 0; k < 3; k++) { const y0 = Y + k * H / 3; c.fillStyle = '#15191B'; c.fillRect(X, y0 + H / 3 - Math.max(1, T * 0.04), T + 0.5, Math.max(1, T * 0.04)); c.fillStyle = 'rgba(200,210,215,.1)'; c.fillRect(X, y0, T + 0.5, Math.max(1, T * 0.03)); for (let j = Math.floor((x - 2) / 1.4) - 1; j <= Math.floor((x + 2) / 1.4) + 1; j++) { const jx = j * 1.4 + k * 0.7 + (hh(j, k, 341) - 0.5) * 0.3; if (jx < x - 0.05 || jx > x + 1.05) continue; c.fillStyle = '#15191B'; c.fillRect(X + (jx - x) * T - Math.max(0.5, T * 0.02), y0, Math.max(1, T * 0.04), H / 3); } }
    c.fillStyle = '#1C2023'; c.fillRect(X, Y + H * 0.06, T + 0.5, H * 0.1); for (let i = 0; i < 3; i++) { c.fillStyle = '#6A7074'; c.beginPath(); c.arc(X + T * (i + 0.5) / 3, Y + H * 0.11, Math.max(1, T * 0.035), 0, TAU); c.fill(); }
    const m = ((x % 5) + 5) % 5;
    if (m === 2) { const rx = X + T * 0.28, rw = T * 0.44; const bg = c.createLinearGradient(rx, 0, rx + rw, 0); bg.addColorStop(0, '#1A1E21'); bg.addColorStop(0.3, '#5A6064'); bg.addColorStop(0.55, '#33383C'); bg.addColorStop(1, '#14171A'); c.fillStyle = bg; c.fillRect(rx, Y - T * 0.1, rw, H + T * 0.1); c.fillStyle = '#101315'; c.fillRect(rx + rw * 0.4, Y, rw * 0.2, H);
      for (let i = 0; i < 6; i++) { c.fillStyle = '#7A8084'; c.beginPath(); c.arc(rx + rw * 0.18, Y + H * (0.08 + i * 0.17), Math.max(1, T * 0.03), 0, TAU); c.arc(rx + rw * 0.82, Y + H * (0.08 + i * 0.17), Math.max(1, T * 0.03), 0, TAU); c.fill(); } }
    else if (hh(x, 7, 343) < 0.24) { const cx = X + T * 0.5, cy = Y + H * 0.45, r = Math.min(T * 0.32, H * 0.22), gg = c.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r); gg.addColorStop(0, '#1C5466'); gg.addColorStop(0.6, '#0B2A38'); gg.addColorStop(1, '#04121A'); c.fillStyle = gg; c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.fill();
      c.fillStyle = 'rgba(190,240,250,.45)'; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(cx + (hh(x, i, 347) - 0.5) * r, cy + (0.5 - i * 0.35) * r, Math.max(0.8, r * 0.07), 0, TAU); c.fill(); }
      const bg = c.createLinearGradient(cx - r, cy - r, cx + r, cy + r); bg.addColorStop(0, '#F0D48A'); bg.addColorStop(0.5, '#957943'); bg.addColorStop(1, '#3E3018'); c.strokeStyle = bg; c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.arc(cx, cy, r, 0, TAU); c.stroke(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.fillStyle = '#E8C77A'; c.beginPath(); c.arc(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2, Math.max(0.8, T * 0.025), 0, TAU); c.fill(); } }
    const wg = c.createLinearGradient(0, Y + H, 0, Y + H * 0.45); wg.addColorStop(0, 'rgba(255,120,40,.2)'); wg.addColorStop(1, 'rgba(255,120,40,0)'); c.fillStyle = wg; c.fillRect(X, Y + H * 0.45, T + 0.5, H * 0.55);
    const sg = c.createLinearGradient(0, Y, 0, Y + H * 0.4); sg.addColorStop(0, 'rgba(6,8,10,.5)'); sg.addColorStop(1, 'rgba(6,8,10,0)'); c.fillStyle = sg; c.fillRect(X, Y, T + 0.5, H * 0.4);
    c.fillStyle = 'rgba(60,140,140,.22)'; for (let i = 0; i < 2; i++) { const px = X + T * (0.2 + hh(x, i, 349) * 0.6), len = H * (0.15 + hh(x, i, 353) * 0.25); c.fillRect(px, Y + H - len, Math.max(1, T * 0.03), len); }   // (the sea seeping through)
  }
  function stormWall(c, X, Y, T, H, h, x, lw) {   // wet dark limestone, rain running down it, moss in the joints, a cornice, now and then an arch open to the storm
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#727A80'); g.addColorStop(0.55, '#565E64'); g.addColorStop(1, '#383F45'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    for (let k = 0; k < 3; k++) { const y0 = Y + k * H / 3 + H * 0.08; c.fillStyle = '#20262C'; c.fillRect(X, y0 + H * 0.3 - Math.max(1, T * 0.035), T + 0.5, Math.max(1, T * 0.035)); c.fillStyle = 'rgba(70,110,70,.3)'; c.fillRect(X, y0 + H * 0.3 - Math.max(1, T * 0.035) - Math.max(1, T * 0.02), T + 0.5, Math.max(1, T * 0.02)); for (let j = Math.floor((x - 2) / 1.7) - 1; j <= Math.floor((x + 2) / 1.7) + 1; j++) { const jx = j * 1.7 + k * 0.85 + (hh(j, k, 361) - 0.5) * 0.4; if (jx < x - 0.05 || jx > x + 1.05) continue; c.fillStyle = '#20262C'; c.fillRect(X + (jx - x) * T - Math.max(0.5, T * 0.02), y0, Math.max(1, T * 0.035), H * 0.3); } }
    if (hh(x, 13, 365) > 0.14) { const ax = X + T * 0.16, aw = T * 0.68, ay = Y + H * 0.14, ah = H * 0.8; c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + aw * 0.5); c.arc(ax + aw / 2, ay + aw * 0.5, aw / 2, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.closePath();   // v394 PR: an open arcade on every bay (a solid pier now and then): the storm sky and the sea beyond, a balustrade across its foot
      const sg = c.createLinearGradient(0, ay, 0, ay + ah); sg.addColorStop(0, '#1E1638'); sg.addColorStop(0.5, '#4A3A78'); sg.addColorStop(0.64, '#7A6AAE'); sg.addColorStop(0.66, '#232C44'); sg.addColorStop(1, '#141A28'); c.fillStyle = sg; c.fill(); c.strokeStyle = '#262A36'; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke();
      c.save(); c.clip(); c.fillStyle = 'rgba(225,232,255,.35)'; for (let i = 0; i < 3; i++) c.fillRect(ax + aw * hh(x, i, 367), ay + ah * (0.72 + i * 0.08), aw * 0.18, Math.max(1, T * 0.015));
        c.fillStyle = 'rgba(20,14,40,.6)'; c.beginPath(); c.ellipse(ax + aw * hh(x, 4, 369), ay + ah * 0.28, aw * 0.6, ah * 0.08, 0, 0, TAU); c.fill();
        if (hh(x, 11, 363) < 0.22) { c.strokeStyle = 'rgba(230,220,255,.75)'; c.lineWidth = Math.max(1, T * 0.02); c.beginPath(); c.moveTo(ax + aw * 0.6, ay + aw * 0.1); c.lineTo(ax + aw * 0.45, ay + ah * 0.3); c.lineTo(ax + aw * 0.55, ay + ah * 0.34); c.lineTo(ax + aw * 0.42, ay + ah * 0.6); c.stroke(); }
        const sc = Math.abs(c.getTransform().a) || 1; c.drawImage(balSprite(Math.max(8, Math.round(aw * sc)), hh(x, 7, 371) < 0.15), ax, ay + ah - aw * 0.62, aw, aw * 0.8 * 0.775); c.restore(); }
    c.fillStyle = '#8A9298'; c.fillRect(X, Y, T + 0.5, H * 0.07); c.fillStyle = 'rgba(240,240,255,.35)'; c.fillRect(X, Y, T + 0.5, Math.max(1, H * 0.015)); c.fillStyle = '#2A3036'; c.fillRect(X, Y + H * 0.07, T + 0.5, Math.max(1, H * 0.025));
    c.strokeStyle = 'rgba(210,220,255,.3)'; c.lineWidth = Math.max(1, T * 0.018); c.beginPath(); for (let i = 0; i < 5; i++) { const px = X + T * hh(x, i, 367), y0 = Y + H * (0.1 + hh(x, i, 371) * 0.5), len = H * (0.15 + hh(x, i, 373) * 0.35); c.moveTo(px, y0); c.lineTo(px - T * 0.01, y0 + len); } c.stroke();
    const bg = c.createLinearGradient(0, Y + H * 0.7, 0, Y + H); bg.addColorStop(0, 'rgba(14,16,24,0)'); bg.addColorStop(1, 'rgba(14,16,24,.55)'); c.fillStyle = bg; c.fillRect(X, Y + H * 0.7, T + 0.5, H * 0.3);
  }
  function foundryCliff(c, x, y, X, Y, T) { const H = T * 0.62, g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, 'rgba(4,10,14,.5)'); g.addColorStop(1, 'rgba(4,10,14,0)'); c.fillStyle = g; c.fillRect(X, Y, T, H); c.fillStyle = '#1C2124'; c.fillRect(X, Y, T, T * 0.1); for (let i = 0; i < 2; i++) { c.fillStyle = '#6A7074'; c.beginPath(); c.arc(X + T * (0.25 + i * 0.5), Y + T * 0.05, Math.max(1, T * 0.03), 0, TAU); c.fill(); } c.fillStyle = 'rgba(160,220,230,.35)'; c.fillRect(X, Y + H * 0.9, T, Math.max(1, T * 0.03)); }
  function stormCliff(c, x, y, X, Y, T) { const H = T * 0.7, g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, 'rgba(10,12,22,.5)'); g.addColorStop(1, 'rgba(10,12,22,0)'); c.fillStyle = g; c.fillRect(X, Y, T, H); c.fillStyle = 'rgba(235,235,255,.5)'; for (let i = 0; i < 4; i++) { const u = hh(x, y * 4 + i, 381); c.fillRect(X + T * u, Y + H * (0.55 + 0.35 * hh(x * 4 + i, y, 383)), Math.max(1, T * 0.08), Math.max(1, T * 0.02)); } }
  function foundryBridge(c, x, y, X, Y, T, isGap) { const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), horiz = gNS && !gWE ? true : gWE && !gNS ? false : true;   // an iron catwalk: grating, a riveted frame
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0); c.fillStyle = '#04121A'; c.fillRect(0, T * 0.1, T, T * 0.8); for (let i = 0; i < 5; i++) { c.fillStyle = '#2A3034'; c.fillRect(T * (0.08 + i * 0.2), T * 0.1, T * 0.07, T * 0.8); c.fillStyle = 'rgba(180,190,195,.35)'; c.fillRect(T * (0.08 + i * 0.2), T * 0.1, Math.max(1, T * 0.018), T * 0.8); }
    for (const yy of [0.04, 0.84]) { c.fillStyle = '#1C2023'; c.fillRect(0, T * yy, T, T * 0.12); c.fillStyle = 'rgba(200,210,215,.35)'; c.fillRect(0, T * yy, T, Math.max(1, T * 0.02)); for (let i = 0; i < 3; i++) { c.fillStyle = '#7A8084'; c.beginPath(); c.arc(T * (i + 0.5) / 3, T * (yy + 0.06), Math.max(1, T * 0.03), 0, TAU); c.fill(); } } c.restore(); }

  /* ======================= the backdrops (the gap's far view) ======================= */
  const PAT = {}; function pat(c, kind, k, ox, oy, a) { const key = kind + '|' + k; let p = PAT[key]; if (!p) { try { p = PAT[key] = DunWorld.pattern(kind, k); } catch (e) { return; } } if (!p) return; try { p.setTransform(new DOMMatrix([1, 0, 0, 1, ox, oy])); } catch (e) {} c.save(); c.globalAlpha = a == null ? 1 : a; c.fillStyle = p; c.fillRect(0, 0, c.canvas.width, c.canvas.height); c.restore(); }
  // the lightning: one strike every few seconds (a double flicker), shared by the sky and the screen
  const strike = t => { if (typeof window !== 'undefined' && window.__BEL_FLASH != null) return { k: +window.__BEL_FLASH, n: 0, u: 0.3 };   /* v394 PR: (tests hold a strike) */ const P2 = 6.4, n = Math.floor(t / P2), at = n * P2 + 1.5 + hh(n, 3, 391) * 3.2, u = t - at; if (u < 0 || u > 0.7) return { k: 0, n }; return { k: Math.max(Math.exp(-u * 9), u > 0.14 ? 0.7 * Math.exp(-(u - 0.14) * 7) : 0), n, u }; };
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.belfoundsea = { base: '#05121A',   // the deep sea under the undercroft: near black, murk, particulate
    paint(c, S, R) { c.fillStyle = '#05121A'; c.fillRect(0, 0, S, S); const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
      for (let i = 0; i < 14; i++) { const x = R() * S, y = R() * S, w = 30 + R() * 70, dark = R() < 0.5; wrap((ox, oy) => { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); g.addColorStop(0, dark ? 'rgba(2,8,12,.6)' : 'rgba(16,52,62,.4)'); g.addColorStop(1, dark ? 'rgba(2,8,12,0)' : 'rgba(16,52,62,0)'); c.fillStyle = g; c.fillRect(x + ox - w, y + oy - w, w * 2, w * 2); }); }
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(150,210,210,${(0.08 + R() * 0.2).toFixed(2)})`; c.fillRect(R() * S, R() * S, 1 + R(), 1 + R()); } },
    back(c, o) { const { W, H, t } = o, k = o.k || 1, wx = o.wx || 0, wy = o.wy || 0; c.fillStyle = '#05121A'; c.fillRect(0, 0, W, H); pat(c, 'belfoundsea', k, W / 2 - wx * 0.15 + t * 0.6, H / 2 - wy * 0.15 + t * 0.4);
      // far off, the undercroft's wall: iron girders, its furnace windows glowing (slow parallax)
      const T = Math.max(24, Math.min(W, H) / 10), y0 = H * 0.08 - (wy * 0.05) % (H * 0.3); c.save(); c.fillStyle = 'rgba(10,14,16,.85)'; c.fillRect(0, y0, W, T * 2.6);
      const span = T * 3.2, off = ((-wx * 0.08) % span + span) % span; for (let x = off - span; x < W + span; x += span) { c.fillStyle = 'rgba(4,6,8,.9)'; c.fillRect(x - T * 0.25, y0 - T * 0.4, T * 0.5, T * 3.4); const fl = 0.75 + 0.25 * Math.sin(t * 2.3 + x * 0.01), g = c.createLinearGradient(0, y0 + T * 0.4, 0, y0 + T * 2.2); g.addColorStop(0, `rgba(255,190,90,${0.5 * fl})`); g.addColorStop(1, `rgba(200,70,20,${0.65 * fl})`); c.fillStyle = g; c.beginPath(); c.moveTo(x + T * 0.6, y0 + T * 2.2); c.lineTo(x + T * 0.6, y0 + T * 1.0); c.arc(x + T * 1.4, y0 + T * 1.0, T * 0.8, Math.PI, 0); c.lineTo(x + T * 2.2, y0 + T * 2.2); c.closePath(); c.fill(); c.strokeStyle = 'rgba(20,14,10,.9)'; c.lineWidth = Math.max(1.5, T * 0.1); c.stroke(); c.beginPath(); c.moveTo(x + T * 1.4, y0 + T * 0.2); c.lineTo(x + T * 1.4, y0 + T * 2.2); c.moveTo(x + T * 0.6, y0 + T * 1.5); c.lineTo(x + T * 2.2, y0 + T * 1.5); c.stroke();
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * fl; if (typeof glowSprite === 'function') blitSized(c, glowSprite('#FF8A3C'), x - T * 0.4, y0 - T * 0.5, T * 3.6, T * 4); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      c.restore();
      // light falling from far above, bubbles rising
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 4; i++) { const x = ((i * 0.31 * W + t * 6 - wx * 0.2) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2, g = c.createLinearGradient(x, 0, x + W * 0.12, H); g.addColorStop(0, 'rgba(90,190,200,.12)'); g.addColorStop(1, 'rgba(90,190,200,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + W * 0.08, 0); c.lineTo(x + W * 0.22, H); c.lineTo(x + W * 0.1, H); c.closePath(); c.fill(); }
      c.fillStyle = 'rgba(190,240,245,.35)'; for (let i = 0; i < (lowFx() ? 8 : 18); i++) { const x = (hh(i, 1, 401) * W * 1.2 - wx * 0.25) % W, yy = H - ((t * (14 + hh(i, 2, 403) * 22) + hh(i, 3, 405) * H) % H); c.beginPath(); c.arc((x + W) % W, yy, 1 + hh(i, 4, 407) * 2.2, 0, TAU); c.fill(); } c.restore(); } };
  GAP_EXT.belstormsea = { base: '#1A2232',   // the wind-lashed sea far below the galleries: slate blue, whitecaps
    paint(c, S, R) { c.fillStyle = '#1A2232'; c.fillRect(0, 0, S, S); const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
      for (let i = 0; i < 18; i++) { const x = R() * S, y = R() * S, w = 20 + R() * 50, dark = R() < 0.5; wrap((ox, oy) => { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); g.addColorStop(0, dark ? 'rgba(8,10,20,.5)' : 'rgba(60,74,104,.4)'); g.addColorStop(1, dark ? 'rgba(8,10,20,0)' : 'rgba(60,74,104,0)'); c.fillStyle = g; c.fillRect(x + ox - w, y + oy - w, w * 2, w * 2); }); }
      for (let i = 0; i < 46; i++) { const x = R() * S, y = R() * S, w = 4 + R() * 14, a = 0.12 + R() * 0.3; wrap((ox, oy) => { c.strokeStyle = `rgba(225,232,255,${a.toFixed(2)})`; c.lineWidth = 1 + R(); c.beginPath(); c.moveTo(x + ox - w, y + oy + w * 0.2); c.lineTo(x + ox + w, y + oy - w * 0.2); c.stroke(); }); } },
    back(c, o) { const { W, H, t } = o, k = o.k || 1, wx = o.wx || 0, wy = o.wy || 0, s = strike(t), T = Math.max(24, Math.min(W, H) / 10); c.fillStyle = '#1A2232'; c.fillRect(0, 0, W, H);
      pat(c, 'belstormsea', k, W / 2 - wx * 0.2 - t * 26, H / 2 - wy * 0.2 + t * 8);
      // storm cloud: dark purple drifts racing over, lit from inside by the lightning
      c.save(); for (let i = 0; i < 7; i++) { const span = W * 1.8, x = ((i * 0.29 * span - t * (22 + i * 5) - wx * 0.3) % span + span) % span - W * 0.4, y = H * (0.05 + (i % 4) * 0.12) - (wy * 0.04) % (H * 0.2), r = T * (3.2 + (i % 3) * 1.3), g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(${Math.round(60 + 140 * s.k)},${Math.round(44 + 130 * s.k)},${Math.round(96 + 140 * s.k)},.6)`); g.addColorStop(1, 'rgba(40,30,70,0)'); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1.9, 0.6); c.beginPath(); c.arc(0, 0, r, 0, TAU); c.restore(); c.fill(); } c.restore();
      // the giant bell overhead, hanging in the dark (its rim caught by the lightning)
      { const bx = W * 0.5 - (wx * 0.06) % (W * 0.6), by = -H * 0.06 - (wy * 0.03) % (H * 0.1), bw = T * 5.2, bh = T * 4.6; c.save(); c.beginPath(); c.moveTo(bx - bw * 0.36, by); c.quadraticCurveTo(bx - bw * 0.42, by + bh * 0.55, bx - bw * 0.78, by + bh * 0.88); c.quadraticCurveTo(bx - bw * 1.02, by + bh * 0.98, bx - bw, by + bh); c.lineTo(bx + bw, by + bh); c.quadraticCurveTo(bx + bw * 1.02, by + bh * 0.98, bx + bw * 0.78, by + bh * 0.88); c.quadraticCurveTo(bx + bw * 0.42, by + bh * 0.55, bx + bw * 0.36, by); c.closePath(); c.fillStyle = 'rgba(8,8,18,.92)'; c.fill();
        c.strokeStyle = `rgba(190,180,255,${0.12 + 0.6 * s.k})`; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke(); c.strokeStyle = 'rgba(8,8,18,.9)'; c.lineWidth = T * 0.12; c.beginPath(); c.moveTo(bx - bw * 0.5, by - T); c.lineTo(bx - bw * 0.3, by + T * 0.2); c.moveTo(bx + bw * 0.5, by - T); c.lineTo(bx + bw * 0.3, by + T * 0.2); c.stroke(); c.restore(); }
      // the bolt
      if (s.k > 0.05) { const R = (i, sd) => hh(s.n, i, sd), x0 = W * (0.15 + R(1, 409) * 0.7); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(235,230,255,${s.k})`; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); let px = x0, py = 0; c.moveTo(px, py); for (let i = 0; i < 9; i++) { px += (R(i, 411) - 0.5) * T * 1.4; py += H * 0.06; c.lineTo(px, py); } c.stroke(); c.globalAlpha = s.k * 0.25; c.fillStyle = '#C8C0FF'; c.fillRect(0, 0, W, H); c.restore(); } } };

  /* ======================= the lands as BIOMES (B1's names), the props, the grade ======================= */
  const base = BIOMES.belnave || BIOMES.belfry;
  const D1P = ['belcolumn', 'belstump', 'belcoral', 'bellamp', 'belbench', 'belrib', 'belrail', 'belbell', 'belpipe', 'belfall'];
  const D2P = ['belchains', 'belanvil', 'belcrucible', 'belsteamvent', 'belcage', 'belcastpit', 'belbrazier', 'belmould@d2', 'belpipe@d2', 'belbell@d2', 'belhalf@d2', 'belrib@d2', 'belcolumn@d2'];
  const D3P = ['belstatue', 'belstatuehead', 'belbanner', 'belrigging', 'belswinglamp', 'belbollard', 'belrail@d3', 'belcolumn@d3', 'belstump@d3', 'belarch@d3', 'belbell@d3', 'bellamp@d3'];
  const mkLand = (id, o) => Object.assign({}, base, { name: BEL.LANDS[id].name, floor: [BEL.LANDS[id].base, BEL.LANDS[id].base, BEL.LANDS[id].base], grout: BEL.LANDS[id].seam }, o);
  if (base) {
    BIOMES.belfoundry = mkLand('belfoundry', { floorFn: floorFn('belfoundry', foundryOver, 1.3), wallFn: foundryWall, cliffTint: foundryCliff, bridgeFn: foundryBridge, gap: 'belfoundsea', dark: 0.26, bg: '#05121A', fog: '#0A0C0E', darkRGB: '10,8,6',
      accent: '#FF9A3C', light: '#FFB070', deco: '#957943', grade: 'rgba(170,80,20,.08)', ambient: 'steam', hi: '#7A8084', top: '#1C2023', face: '#3A4044', faceD: '#1A1E21', cliff: '#0E1418', mud: ['#3A2A1E', '#2E241C'], mudSpot: 'rgba(255,150,60,.18)', bridgeCol: '#4A5054', props: D2P, propN: [2, 3] });
    BIOMES.belstorm = mkLand('belstorm', { floorFn: stormFloor /* v394 PR: herringbone + balustrade */, wallFn: stormWall, cliffTint: stormCliff, gap: 'belstormsea', dark: 0.2, bg: '#141A28', fog: '#141826', darkRGB: '18,16,34', out: true,
      accent: '#B9A8FF', light: '#D8D0FF', deco: '#8A9298', grade: 'rgba(34,24,92,.2)', ambient: 'wind', hi: '#9AA2A8', top: '#2C3338', face: '#5A6268', faceD: '#30363C', cliff: '#1C2232', mud: ['#2A3040', '#323848'], mudSpot: 'rgba(190,180,255,.2)', bridgeCol: '#6A7278', props: D3P, propN: [2, 3] });
    for (const id of ['belfoundry', 'belstorm']) { if (typeof BIOME_ORDER !== 'undefined' && !BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = BIOMES[id].darkRGB; if (typeof ROOM_SHAPES !== 'undefined') ROOM_SHAPES[id] = ['rect', 'oval', 'rect']; if (typeof BOSS_ARENA !== 'undefined') BOSS_ARENA[id] = 'oval'; }
    for (const t of ['crawler', 'leech', 'reeflantern']) { const m = typeof MON !== 'undefined' && MON[t]; if (m && Array.isArray(m.bio)) for (const id of ['belfoundry', 'belstorm']) if (!m.bio.includes(id)) m.bio.push(id); }
    if (BIOMES.belnave) BIOMES.belnave.props = D1P.slice();   // (d1: every one the v392 repaint)
    // each dungeon's own floor litter (not the generic halls' moss)
    if (typeof DECALS !== 'undefined') Object.assign(DECALS, { belnave: [['ripple', 0.045], ['crack', 0.05], ['pebbles', 0.04], ['moss', 0.025], ['shard', 0.01]], belfoundry: [['rivets', 0.05], ['oil', 0.045], ['ember', 0.04], ['crack', 0.035], ['cog', 0.012], ['ash', 0.02]], belstorm: [['puddle', 0.035], ['ripple', 0.05], ['crack', 0.05], ['pebbles', 0.04]] });
    // the storm's bridges: the gallery's own slabs, dark with rain
    { const b0 = BIOMES.belstorm.bridgeFn; if (b0) BIOMES.belstorm.bridgeFn = function (c, x, y, X, Y, T) { b0.apply(this, arguments); c.save(); c.fillStyle = 'rgba(26,30,48,.5)'; c.fillRect(X, Y, T, T); c.fillStyle = 'rgba(210,205,255,.16)'; c.fillRect(X, Y + T * 0.2, T, Math.max(1, T * 0.02)); c.restore(); }; }
  }
  // the layout letters (20n's PROP_LEGEND) as each dungeon's own props
  const L = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { prop: v }]));
  const LEG = { d1: BEL.PROP_LEGEND || {},
    d2: L({ C: 'belchains', U: 'belanvil', Y: 'belcrucible', F: 'belsteamvent', I: 'belrib@d2', Q: 'belbell@d2', O: 'belmould@d2', J: 'belcage', Z: 'belcastpit', N: 'belbrazier', A: 'belarch@d2', H: 'belhalf@d2', P: 'belpipe@d2' }),
    d3: L({ C: 'belcolumn@d3', U: 'belstatue', Y: 'belbanner', F: 'belrigging', I: 'belrib@d3', Q: 'belbell@d3', O: 'belstatuehead', J: 'belrail@d3', Z: 'belbollard', N: 'belswinglamp', A: 'belarch@d3', H: 'belhalf@d3', P: 'belpipe@d3' }) };
  const skyOf = gap => (c, W, H, T, o) => { o = o || {}; const cam = o.cam || { x: 0, y: 0 }; GAP_EXT[gap].back(c, { W, H, t: o.t || 0, wx: cam.x * T, wy: cam.y * T, k: o.k || 1 }); };
  const THEMES = {
    d1: { key: 'd1', name: 'The Drowned Lower Church', land: 'belnave', lands: ['belnave', 'belfry', 'belcause'], props: D1P, legend: LEG.d1, glow: BEL.TURQ || '#61D9D2', gap: 'belsea', grade: BIOMES.belnave && BIOMES.belnave.grade, ambient: 'motes', paintSky: BEL.paintSky },
    d2: { key: 'd2', name: 'The Bell Foundry Undercroft', land: 'belfoundry', lands: ['belfoundry'], props: D2P, legend: LEG.d2, glow: '#FF9A3C', gap: 'belfoundsea', grade: 'rgba(170,80,20,.08)', ambient: 'steam', paintSky: skyOf('belfoundsea') },
    d3: { key: 'd3', name: 'The Storm Galleries', land: 'belstorm', lands: ['belstorm'], props: D3P, legend: LEG.d3, glow: '#B9A8FF', gap: 'belstormsea', grade: 'rgba(34,24,92,.2)', ambient: 'wind', paintSky: skyOf('belstormsea') } };
  BEL.THEMES = Object.assign(BEL.THEMES || {}, THEMES); if (typeof window !== 'undefined') { window.BEL_THEME = BEL.THEMES; window.BEL_STRIKE = strike; }   /* v394 PR: (the lightning's envelope, for tests) */

  /* ======================= the ambience, laid over each dungeon (on 20n's Rf.everyStage) ======================= */
  const LANDKEY = { belfoundry: 'd2', belstorm: 'd3', belnave: 'd1', belfry: 'd1', belcause: 'd1' };
  const keyOf = (X, self) => { try { const d = BEL.dungeonCtx && BEL.dungeonCtx(X); if (d && d.key) return d.key; } catch (e) {} if (X.F && X.F.fiend) return null; const S = (self && self.S) || {}; return S.theme || LANDKEY[X.F && X.F.biome] || null; };
  const WARMK = { belcrucible: [0, -1.18, 0.9, '#FF9A3C'], belbrazier: [0, -1.35, 1.2, '#FFB060'], belcastpit: [0, 0.05, 1.3, '#FF8A2A'] }, COOLK = { belswinglamp: [0.1, -2.35, 1.0, '#BFF4F0'] };
  function ambience(key, X) {
    const vis = (x, y, r) => { const Xs = X.sx(x), Ys = X.sy(y), T = X.Tz(); return Xs > -r * T && Xs < X.W() + r * T && Ys > -r * T && Ys < X.H() + r * T; };
    const lit = (c, map) => { const T = X.Tz(), t = X.g.t; for (const p of X.props || []) { const q = map[p.kind]; if (!q || p.broken || !vis(p.x, p.y, 3)) continue; const k = 0.75 + 0.25 * Math.sin(t * 3.1 + p.x * 1.7); glow(c, X.sx(p.x + q[0]), X.sy(p.y) + q[1] * T, q[2] * T, q[3], 0.45 * k); } };
    if (key === 'd2') return {
      drawGround(c) { const T = X.Tz(), t = X.g.t, x0 = X.me.x - X.W() / T, x1 = X.me.x + X.W() / T, y0 = X.me.y - X.H() / T, y1 = X.me.y + X.H() / T;   // (the casting channels breathe: their glow, along each run on the screen)
        for (let j = Math.floor((y0 - 5) / 7); j <= Math.floor((y1 - 4) / 7) + 1; j++) { const wy = j * 7 + 4.5; for (const [a, b] of chRow(j)) { if (b < x0 || a > x1) continue; for (let u = Math.max(a, x0); u <= Math.min(b, x1); u += 0.9) { if (!vis(u, wy, 1)) continue; const k = 0.55 + 0.45 * Math.sin(t * 1.7 + u * 0.8); glow(c, X.sx(u), X.sy(wy), T * 0.9, '#FF8A2A', 0.22 * k); } } }
        lit(c, WARMK); },
      drawOver(c) { const T = X.Tz(), t = X.g.t; c.save(); for (const p of X.props || []) { if (p.kind !== 'belsteamvent' || p.broken || !vis(p.x, p.y, 3)) continue; for (let i = 0; i < 4; i++) { const u = ((t * 0.45 + i / 4 + p.x * 0.13) % 1), x = X.sx(p.x + 0.45 + u * 0.4), y = X.sy(p.y) - T * (1.1 + u * 1.8), r = T * (0.25 + u * 0.6), g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(235,240,240,${0.3 * (1 - u)})`); g.addColorStop(1, 'rgba(235,240,240,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); } } c.restore(); } };
    if (key === 'd3') { let flashN = -1; return {
      drawGround(c) { const T = X.Tz(), t = X.g.t, x0 = X.me.x - X.W() / T / 1.6, x1 = X.me.x + X.W() / T / 1.6, y0 = X.me.y - X.H() / T / 1.6, y1 = X.me.y + X.H() / T / 1.6, sk = strike(t).k; c.save(); c.lineWidth = Math.max(1, T * 0.025);   // (rain rings on the puddles)
        for (let cy = Math.floor(y0 / 3) - 1; cy <= Math.floor(y1 / 3) + 1; cy++) for (let cx = Math.floor(x0 / 4) - 1; cx <= Math.floor(x1 / 4) + 1; cx++) { const q = PUD(cx, cy); if (!q) continue; const tx = Math.floor(q.x), ty = Math.floor(q.y), G = X.M && X.M.G; if (G && typeof T_FLOOR !== 'undefined' && G[ty * X.M.MW + tx] !== T_FLOOR) continue;
          if (sk > 0.03) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(225,218,255,${Math.min(0.9, 0.95 * sk).toFixed(3)})`; c.beginPath(); for (const [dx, dy, kx, ky] of [[0, 0, 1, 1], [q.rx * 0.55, q.ry * 0.25, 0.6, 0.7], [-q.rx * 0.5, -q.ry * 0.2, 0.55, 0.65]]) { const px = X.sx(q.x + dx), py = X.sy(q.y + dy); c.moveTo(px + q.rx * kx * T, py); c.ellipse(px, py, q.rx * kx * T, q.ry * ky * T, 0, 0, TAU); } c.fill(); c.globalCompositeOperation = 'source-over'; }   // v394 PR: the puddles throw the lightning back
          for (let i = 0; i < (lowFx() ? 1 : 2); i++) { const u = (t * 1.3 + hh(cx, cy * 3 + i, 421)) % 1, rx = (0.08 + u * 0.35) * T, x = X.sx(q.x + (hh(cx + i, cy, 423) - 0.5) * q.rx), y = X.sy(q.y + (hh(cx, cy + i, 427) - 0.5) * q.ry * 0.8); c.strokeStyle = `rgba(230,230,255,${0.4 * (1 - u)})`; c.beginPath(); c.ellipse(x, y, rx, rx * 0.4, 0, 0, TAU); c.stroke(); } } c.restore(); lit(c, COOLK); },
      drawOver(c) { const W = X.W(), H = X.H(), t = X.g.t, s = strike(t + 0.0); c.save();
        if (!(typeof window !== 'undefined' && window.__BEL_RAIN === 0)) { const n = lowFx() ? 45 : 110, len = Math.max(10, X.Tz() * 0.32); c.strokeStyle = 'rgba(205,210,255,.32)'; c.lineWidth = 1.2; c.beginPath();   // (rain: one path, no allocation)
          for (let i = 0; i < n; i++) { const sp = 0.8 + hh(i, 5, 431) * 0.5, x = ((hh(i, 1, 433) * W * 1.3 - t * 160 * sp) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.1, y = ((hh(i, 2, 437) * H + t * 820 * sp) % H); c.moveTo(x, y); c.lineTo(x - len * 0.28, y + len * sp); } c.stroke(); }
        if (s.k > 0.02) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(200,190,255,${0.16 * s.k})`; c.fillRect(0, 0, W, H); if (s.n !== flashN && s.u < 0.05) { flashN = s.n; try { if (X.sfx && X.sfx.thud) X.after(0.6 + hh(s.n, 9, 441) * 0.8, () => X.sfx.thud()); } catch (e) {} } } c.restore(); } }; }
    return null; }
  function hook() { try { const Rf = typeof RIFT_BY_ID !== 'undefined' && RIFT_BY_ID.belfry; if (!Rf || Rf.__belth || !Rf.everyStage) return; const old = Rf.everyStage; Rf.__belth = 1;
    Rf.everyStage = function (X, self, H) { const a = old.apply(this, arguments) || {}; let L2 = null; try { const key = keyOf(X, self); L2 = key && key !== 'd1' ? ambience(key, X) : null; } catch (e) { L2 = null; } if (!L2) return a;
      const u0 = a.update, g0 = a.drawGround, o0 = a.drawOver; a.theme = L2;
      a.drawGround = function (c) { if (g0) g0.call(a, c); try { if (L2.drawGround) L2.drawGround(c); } catch (e) {} };
      a.drawOver = function (c) { if (o0) o0.call(a, c); try { if (L2.drawOver) L2.drawOver(c); } catch (e) {} };
      a.update = function (dt) { if (u0) u0.call(a, dt); }; return a; }; } catch (e) {} }
  hook();
  return { THEMES, strike, hook, LEG, D1P, D2P, D3P };
})();
