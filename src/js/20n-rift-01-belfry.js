/* ---------- Rift 1: The Drowned Belfry (v391 B1: rebuilt as a new dungeon) ----------
   A coastal bell tower sunk halfway into an alien sea. Level 10, Water and Dark, an original brood associated with Dagon,
   the Tide Sigil. Oversized ivory blocks with dark teal seams, the bottom third stained almost black, tarnished brass ribs,
   sparse turquoise light, a low ceiling of purple cloud; one opaque, slowly scrolling sea plane; shallow walkable water
   (a live translucent layer on a walkable floor) kept apart from deep decorative sea (the gaps). The Cocopet is the only
   avatar: every interaction is the controlled pet standing at a thing for a moment (a short Resonance pulse).

   Stages (the spec's mandatory order; st.rift.prog.belfry is the next stage to play):
     0  The Hall of Three Tides      worker B2 (20n1-belfry-hall.js, BELFRY_HALL.stage; Varkul in 20t2); a stand-in until it loads
     1  Kharrox the Bellback         worker B3 (fiend 'belkharrox', 20t3-belfry-kharrox.js)
     2  The Clapper Counterweights   this file
     3  Nhalu the Lantern Eel        worker B4 (fiend 'belnhalu', 20t4-belfry-nhalu.js)
     4  The Rising Tide Walk         this file
     5  Uldroth the Drowned Herald   worker B5 (fiend 'beluldroth', 20t5-belfry-uldroth.js), then the sealing (Tide)
   (the 20t* files load after the fiend kit 20t; everything of theirs is read here at run time only, by id)
   Old 14-stage saves are mapped onto these six (belfryMigrate, called from 04-state's sanitize; st.rift.ver.belfry = 2).

   ======================= HOOKS FOR THE OTHER WORKERS (kept stable) =======================
   BEL (global; also window.BEL) — this file loads before 20n1 and the 20t* boss files ('20n-' sorts first), so they may
   read BEL at load time; this file only reads their names at run time.
   Palette: BEL.DEEP #123C52, LIME #C8CCBC, BRASS #957943, TURQ #61D9D2, IVORY #E2E0CF, SEAM #24504F (dark teal joints),
     STAIN #121B1F (the black tidal stain), PURPLE #5B4A86 (the low clouds), VIOLET #6B4FA8, FOAM #E2F7F2, SEA #0F3346,
     WARN #FF4D6D, SAFE #8FE0A6, GOLD #FFE37A, INK #2B2433.
   Lands (BIOMES, seamless world-space floors, v389 F technique): 'belfry' (the vestibule / hall), 'belcause' (the
     causeway), 'belbapt' (the baptism chamber, Kharrox), 'belcistern' (the counterweight cistern), 'belnave' (the
     submerged nave, Nhalu), 'beltide' (the tide ramp), 'belplat' (the bell platform, Uldroth). Each: floorFn, wallFn,
     cliffTint, bridgeFn, gap 'belsea'. BEL.floorAt(c, land, wx, wy, T, X, Y) paints one tile of a land's floor anywhere
     (fiend paintGround), BEL.LANDS[land] its numbers.
   Sky and sea: BEL.paintSky(c, W, H, T, o) the far view for a fiend's sky(): the sea plane, purple clouds, the moon,
     the tilted tower and its house-sized bell, the fish once a run (o: { cam: {x, y}, t, calm (0..1 drained), tower:
     { x, y } world spot of the tower }); BEL.paintSea(c, W, H, camX, camY, T, t) the plane alone.
   Shallow water (walkable, live): BEL.shallow(X, { kind: 'ring' | 'pool' | 'rect' | 'tiles', ... }) -> region
     ({ x, y, r0, r1 } | { x, y, r } | { x0, y0, x1, y1, r } | { tiles: [{ tx, ty }] }); BEL.inShallow(X, x, y);
     BEL.unshallow(X, region). A layout letter 'w' is shallow floor too (marks.w, registered automatically).
   Causeway waves: a stage spec's `causeway: { x0, x1, y0, y1 }` (world tiles) or the marks 'K' (the causeway's tiles)
     get three low waves sliding across (a soft shove and a splash, never damage). BEL.waves(X, rect) does it by hand.
   Vista: a stage spec's `vista: { x, y }` places the tilted tower (world tiles, north of the map by default).
   Props (PROPS kinds, all breakable through BREAK_FX with their own materials): belcolumn, belstump, belbench, belfall
     (an upward waterfall), belrib, belbell, belmould, belrail, belcoral, bellamp, belarch, belhalf (a broken bell half),
     belpipe. BEL.PROP_LEGEND: layout letters for them.
   Brood (MON): crawler (brine crawler), leech (bell leech), reeflantern (reef lantern) with modes for their tells.
     BEL.spawn(X, type, x, y, o) a brood member with the rift's numbers (o.swarm: a low-health swarm variant, o.aggro).
   Bosses: a boss stage calls BEL.bossMake[fiendId](X, self, H) (or FIEND_DEFS[id].bossMake) for its module; until the
     fiend is defined the stage falls back to the old 2D boss on a plain arena so the build always plays.
   Mini bosses (evil Cocopets, EVIL_MINI from 20zz9): a stage spec's `guard: 'hall' | 'cistern' | 'tide'` puts the
     section's guardian by its exit. Stages of this file place it themselves; for any other stage (the hall) everyStage
     sets it beside the exit once the stage is done and the exit exists (the raised central door), and keeps the exit
     shut until it falls. A stage may give mod.guardPost() -> { x, y } to choose its post, or S.noGuard to opt out.
   Saves: BEL.cp(key) / BEL.setCp(key, v) / BEL.clearCp(prefix) small integers kept in st.rift.bel (survive reloads;
     for the hall's crystal states). Cleared when the Belfry is sealed or migrated.
   Sealing: the Tide Sigil (Rf.sealing; onFall drains the sea: BEL.calm(X) 0..1 for arena painters), the reward
     ACC_SPECIAL.tide (a necklace, the Tidecaller's Drop: BEL.tideAccSVG / tideAccDraw).
   Tests: tests/_bel-b1-smoke.js. Run state: X.rift.self.amb.C (BEL.ctx(X)). */
const BEL = { DEEP: '#123C52', LIME: '#C8CCBC', BRASS: '#957943', BRASS_HI: '#D9B35F', BRASS_D: '#5E4A26', TURQ: '#61D9D2', TURQ_HI: '#C9FFF8', IVORY: '#E2E0CF', SEAM: '#24504F', STAIN: '#121B1F',
  PURPLE: '#5B4A86', VIOLET: '#6B4FA8', FOAM: '#E2F7F2', SEA: '#0F3346', WARN: '#FF4D6D', SAFE: '#8FE0A6', GOLD: '#FFE37A', INK: '#2B2433', CORAL: '#E07A6A', MINT: '#9FF0C8' };
BEL.bossMake = BEL.bossMake || {};
if (typeof window !== 'undefined') window.BEL = BEL;
(() => {
  const TAU = Math.PI * 2, { DEEP, LIME, BRASS, BRASS_HI, BRASS_D, TURQ, TURQ_HI, IVORY, SEAM, STAIN, PURPLE, VIOLET, FOAM, SEA, WARN, SAFE, GOLD, INK } = BEL;
  const { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt, { PROPS } = DunWorld;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
  const ink = (c, lw, a) => { c.strokeStyle = a == null ? LN : `rgba(43,36,51,${a})`; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const glow = (c, x, y, r, col, a) => { if (!(a > 0.004) || !(r > 0.5)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a, 0, 1); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const label = (c, s, x, y, size, col) => { if (!s) return; c.save(); c.font = `800 ${Math.round(Math.max(10, size))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineJoin = 'round'; c.lineWidth = 3.2; c.strokeStyle = 'rgba(6,14,20,.82)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const vnoise = (x, y, s) => { const gx = Math.floor(x), gy = Math.floor(y), fx = x - gx, fy = y - gy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy); return lerp(lerp(hh(gx, gy, s), hh(gx + 1, gy, s), u), lerp(hh(gx, gy + 1, s), hh(gx + 1, gy + 1, s), u), v); };
  const snd = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(4,12,18,${a || 0.34})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  /* the GPU painter (Nidhogg's FGFX, the soft glows, water streams, caustics, ripples and shafts); null where it cannot run
     (no WebGL, a software rasteriser, window.__BEL_GL = 0); deco: decoration only, so "Fewer effects" skips it */
  function gpu(c, deco) { try { if ((typeof window !== 'undefined' && (window.__BEL_GL === 0 || window.__DUN_GL === 0)) || (deco && lowFx())) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; if (!F || !F.usable()) return null; return { F, Q: F.begin(c, null) }; } catch (e) { return null; } }
  function gpuEnd(c, G) { if (G) try { G.F.flush(c); } catch (e) {} }
  Object.assign(BEL, { lowFx, glow, label, gpu, gpuEnd, rgba, hh, vnoise });

  /* ======================= the lands: seamless floors =======================
     (v389 F, as the Caldera: the engine paints every ground tile its own shade and light; each floor here starts from one
     flat colour for the whole land, which covers that exactly, and everything else belongs to the world, never to a tile:
     the stone blocks are laid in world space with sizes that are never whole tiles (so no joint can run along a tile
     edge), each block's tone, wear, bevel, chips and specks are the block's own, and the stains, wet sheen and algae are
     soft blobs placed on a coarse world grid that every tile they touch draws its share of. A tile is only a window) */
  const LANDS = {
    belfry:     { name: 'The Hall of Three Tides', base: '#C3C6B5', tones: ['#CDD0BF', '#C4C7B5', '#BBBFAD', '#D3D4C4', '#C7CABA'], seam: '#2D5B5B', seamW: 0.05, bw: 2.35, bh: 1.55, jit: 0.3, split: 0.22, stain: 0.45, wet: 0.35, algae: 0.15, specks: 5, cracks: 0.35, sheen: 'rgba(170,235,240,', edgeWet: 1 },
    belcause:   { name: 'The Drowned Causeway', base: '#B3B7A7', tones: ['#BEC1B1', '#B2B6A5', '#A9AE9D', '#C4C6B6'], seam: '#264E50', seamW: 0.055, bw: 3.15, bh: 0.95, jit: 0.25, split: 0.1, stain: 0.7, wet: 0.75, algae: 0.45, specks: 4, cracks: 0.55, sheen: 'rgba(170,235,240,', edgeWet: 1.3 },
    belbapt:    { name: 'The Baptism Chamber', base: '#CBCDBE', tones: ['#D3D5C6', '#CACCBC', '#C2C5B4', '#D8D9CB'], seam: '#2F5F5E', seamW: 0.045, bw: 1.9, bh: 1.85, jit: 0.12, split: 0.12, stain: 0.3, wet: 0.25, algae: 0.08, specks: 4, cracks: 0.25, sheen: 'rgba(190,240,240,', edgeWet: 1 },
    belcistern: { name: 'The Counterweight Cistern', base: '#8E9995', tones: ['#97A29E', '#8B9692', '#848F8B', '#9DA7A2', '#909B97'], seam: '#1E3C40', seamW: 0.055, bw: 1.45, bh: 1.05, jit: 0.2, split: 0.08, stain: 0.55, wet: 0.1, algae: 0.05, specks: 6, cracks: 0.45, sheen: 'rgba(150,220,225,', edgeWet: 0.7, rust: 0.35 },
    belnave:    { name: 'The Submerged Nave', base: '#5F7174', tones: ['#66787B', '#5C6E71', '#55676A', '#6C7D7F'], seam: '#163234', seamW: 0.06, bw: 2.15, bh: 1.7, jit: 0.38, split: 0.16, stain: 0.6, wet: 0.95, algae: 0.3, specks: 4, cracks: 0.4, sheen: 'rgba(150,230,240,', edgeWet: 1.4 },
    beltide:    { name: 'The Rising Tide Walk', base: '#AEB3A4', tones: ['#B8BCAE', '#ADB2A3', '#A4AA9A', '#BEC1B3'], seam: '#28504F', seamW: 0.05, bw: 2.7, bh: 1.25, jit: 0.28, split: 0.18, stain: 0.6, wet: 0.6, algae: 0.35, specks: 4, cracks: 0.45, sheen: 'rgba(170,235,240,', edgeWet: 1.3, treads: 1 },
    belplat:    { name: 'The Bell Platform', base: '#C6C8B9', tones: ['#CFD1C2', '#C5C7B7', '#BCBFAE', '#D4D5C6'], seam: '#2C5859', seamW: 0.05, bw: 2.8, bh: 2.15, jit: 0.22, split: 0.3, stain: 0.5, wet: 0.5, algae: 0.2, specks: 5, cracks: 0.5, sheen: 'rgba(180,240,240,', edgeWet: 1.2 },
  };
  BEL.LANDS = LANDS;
  // a row's block boundaries: b(q) = q * bw - off + jitter (jitter < half a block, so they stay in order)
  const bnd = (L, q, r, off) => q * L.bw - off + (hh(q, r, 7) - 0.5) * L.jit * L.bw;
  const rowOff = (L, r) => (r & 1 ? L.bw * 0.5 : 0) + hh(r, 3, 5) * L.bw * 0.3;
  /* one block: its own tone, a gentle top-left light anchored to the block, a bevel, its chips, cracks and specks */
  function block(c, L, P, T, bx0, by0, bx1, by1, q, r, k) {
    const a = P(bx0, by0), b = P(bx1, by1), w = b[0] - a[0], h = b[1] - a[1], s = hh(q, r, 13 + k), s2 = hh(q, r, 17 + k);
    c.fillStyle = L.tones[Math.floor(s * L.tones.length)]; c.fillRect(a[0], a[1], w, h);
    const g = c.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, 'rgba(255,255,250,.075)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(10,30,34,${(0.05 + s2 * 0.06).toFixed(3)})`); c.fillStyle = g; c.fillRect(a[0], a[1], w, h);
    // the stone's own mottling: two soft clouds of lighter and darker limestone placed in the block
    for (let i = 0; i < 2; i++) { const u = hh(q, r, 101 + i * 7 + k), v = hh(q, r, 103 + i * 5 + k), cx = a[0] + w * (0.15 + u * 0.7), cy = a[1] + h * (0.2 + v * 0.6), rr = Math.max(w, h) * (0.35 + hh(q, r, 107 + i) * 0.3), mg = c.createRadialGradient(cx, cy, 0, cx, cy, rr), dark = i === 1; mg.addColorStop(0, dark ? 'rgba(30,50,48,.09)' : 'rgba(255,255,245,.12)'); mg.addColorStop(1, dark ? 'rgba(30,50,48,0)' : 'rgba(255,255,245,0)'); c.fillStyle = mg; c.fillRect(a[0], a[1], w, h); }
    // the worn bevel: a lit lip on the top and left, a shade on the bottom and right
    const bv = Math.max(1, T * 0.035); c.fillStyle = 'rgba(255,255,248,.16)'; c.fillRect(a[0], a[1], w, bv); c.fillRect(a[0], a[1], bv, h); c.fillStyle = 'rgba(8,26,30,.16)'; c.fillRect(a[0], b[1] - bv, w, bv); c.fillRect(b[0] - bv, a[1], bv, h);
    // a chipped corner, a crack, the pitting of old limestone (all placed in the block)
    if (s2 > 1 - L.cracks * 0.5) { const R = rnd(q * 977 + r * 131 + k); c.strokeStyle = 'rgba(16,40,44,.42)'; c.lineWidth = Math.max(0.8, T * 0.022); c.beginPath(); let px = a[0] + w * (0.2 + R() * 0.6), py = a[1]; c.moveTo(px, py); for (let i = 0; i < 4; i++) { px += (R() - 0.5) * w * 0.25; py += h * 0.25; c.lineTo(px, py); } c.stroke(); }
    if (hh(q, r, 23 + k) > 0.72) { const cx = hh(q, r, 29) > 0.5 ? a[0] : b[0], cy = hh(q, r, 31) > 0.5 ? a[1] : b[1], sx2 = cx === a[0] ? 1 : -1, sy2 = cy === a[1] ? 1 : -1, z = T * (0.12 + hh(q, r, 37) * 0.14); poly(c, [[cx, cy], [cx + sx2 * z * 1.4, cy], [cx + sx2 * z * 0.4, cy + sy2 * z * 0.5], [cx, cy + sy2 * z * 1.2]]); c.closePath(); c.fillStyle = 'rgba(20,46,50,.32)'; c.fill(); }
    const R2 = rnd(q * 7919 + r * 104729 + 61 + k); for (let i = 0; i < L.specks * (w * h) / (T * T * 2.5); i++) { const x = a[0] + R2() * w, y = a[1] + R2() * h, z = Math.max(0.8, T * (0.015 + R2() * 0.02)); c.fillStyle = i % 3 ? 'rgba(30,50,52,.22)' : 'rgba(255,255,250,.22)'; c.fillRect(x, y, z, z); }
    if (L.rust && s2 < L.rust * 0.3) { const rg = c.createRadialGradient(a[0] + w * 0.5, a[1] + h * 0.6, 0, a[0] + w * 0.5, a[1] + h * 0.6, Math.max(w, h) * 0.6); rg.addColorStop(0, 'rgba(120,70,30,.18)'); rg.addColorStop(1, 'rgba(120,70,30,0)'); c.fillStyle = rg; c.fillRect(a[0], a[1], w, h); }
    // the joint: dark teal, opaque, so a joint painted by both blocks beside it is the same as one painted once
    c.strokeStyle = L.seam; c.lineWidth = Math.max(1, T * L.seamW); c.strokeRect(a[0], a[1], w, h);
  }
  /* soft world-space washes: the black tidal stain, wet sheen and green-teal algae, one blob per coarse cell */
  function washes(c, L, P, T, x, y) {
    const G = 3.4; for (let gy = Math.floor((y - 3) / G); gy <= Math.floor((y + 4) / G); gy++) for (let gx = Math.floor((x - 3) / G); gx <= Math.floor((x + 4) / G); gx++) {
      const kind = hh(gx, gy, 41); let col = null, a = 0;
      if (kind < L.stain * 0.55) { col = '14,26,30'; a = 0.16 + hh(gx, gy, 43) * 0.22; } else if (kind < L.stain * 0.55 + L.wet * 0.35) { col = null; a = 0.13 + hh(gx, gy, 47) * 0.14; } else if (kind < L.stain * 0.55 + L.wet * 0.35 + L.algae * 0.3) { col = '40,96,84'; a = 0.14 + hh(gx, gy, 49) * 0.16; } else continue;
      const cx = (gx + hh(gx, gy, 53)) * G, cy = (gy + hh(gx, gy, 59)) * G, rr = (0.9 + hh(gx, gy, 61) * 1.7); if (cx + rr < x || cx - rr > x + 1 || cy + rr * 0.8 < y || cy - rr * 0.8 > y + 1) continue;
      const p = P(cx, cy); c.save(); c.translate(p[0], p[1]); c.scale(1, 0.75); const g = c.createRadialGradient(0, 0, 0, 0, 0, rr * T);
      if (col) { g.addColorStop(0, `rgba(${col},${a.toFixed(3)})`); g.addColorStop(0.6, `rgba(${col},${(a * 0.55).toFixed(3)})`); g.addColorStop(1, `rgba(${col},0)`); }
      else { g.addColorStop(0, `${L.sheen}${a.toFixed(3)})`); g.addColorStop(0.5, `${L.sheen}${(a * 0.4).toFixed(3)})`); g.addColorStop(1, `${L.sheen}0)`); }
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, rr * T, 0, TAU); c.fill(); c.restore(); } }
  /* the floor of a land at world tile (x, y), screen rect (X, Y, T) */
  function floorTile(c, L, X, Y, T, x, y, gN, gS, gW, gE) {
    c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    c.fillStyle = L.base; c.fillRect(X, Y, T, T);
    const P = (wx, wy) => [X + (wx - x) * T, Y + (wy - y) * T];
    const r0 = Math.floor((y - 0.06) / L.bh), r1 = Math.floor((y + 1.06) / L.bh);
    for (let r = r0; r <= r1; r++) { const off = rowOff(L, r), by0 = r * L.bh, by1 = by0 + L.bh, q0 = Math.floor((x - 1 + off) / L.bw) - 1, q1 = Math.floor((x + 2 + off) / L.bw) + 1;
      for (let q = q0; q <= q1; q++) { const bx0 = bnd(L, q, r, off), bx1 = bnd(L, q + 1, r, off); if (bx1 < x - 0.06 || bx0 > x + 1.06) continue;
        if (hh(q, r, 11) < L.split) { const mx = (bx0 + bx1) / 2 + (hh(q, r, 19) - 0.5) * (bx1 - bx0) * 0.2; block(c, L, P, T, bx0, by0, mx, by1, q, r, 0); block(c, L, P, T, mx, by0, bx1, by1, q, r, 1); }
        else block(c, L, P, T, bx0, by0, bx1, by1, q, r, 0); }
    }
    // (the tide ramp: a worn brass nosing along every second course, a tread: laid after the blocks, over their joint)
    if (L.treads) for (let r = r0; r <= r1; r++) { if (r & 1) continue; const by1 = (r + 1) * L.bh, a = P(x - 1, by1), b = P(x + 2, by1); c.fillStyle = '#6E5730'; c.fillRect(a[0], a[1] - T * 0.07, b[0] - a[0], T * 0.12); c.fillStyle = 'rgba(217,179,95,.9)'; c.fillRect(a[0], a[1] - T * 0.07, b[0] - a[0], T * 0.05); c.fillStyle = 'rgba(255,240,190,.45)'; c.fillRect(a[0], a[1] - T * 0.07, b[0] - a[0], Math.max(1, T * 0.015)); c.fillStyle = 'rgba(70,150,120,.3)'; for (let k = Math.floor(x) - 1; k <= x + 2; k++) { const u = hh(k, r, 97); if (u < 0.4) { const p0 = P(k + u * 2, by1); c.fillRect(p0[0], a[1] - T * 0.07, T * 0.3, T * 0.12); } } }
    washes(c, L, P, T, x, y);
    // wet stone and a lip of foam where the floor meets the sea (along the edge itself)
    const we = L.edgeWet || 1, side = (x0, y0, x1, y1, w, h) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, `rgba(10,40,50,${0.32 * we})`); g.addColorStop(0.45, `rgba(10,40,50,${0.1 * we})`); g.addColorStop(1, 'rgba(10,40,50,0)'); c.fillStyle = g; c.fillRect(Math.min(x0, x1), Math.min(y0, y1), w, h); };
    if (gN) side(X, Y, X, Y + T * 0.6, T, T * 0.6); if (gS) side(X, Y + T, X, Y + T * 0.4, T, T * 0.6); if (gW) side(X, Y, X + T * 0.55, Y, T * 0.55, T); if (gE) side(X + T, Y, X + T * 0.45, Y, T * 0.55, T);
    c.restore(); }
  const floorFn = L => (c, X, Y, T, h, h2, x, y, lw, gN, gS, gW, gE) => floorTile(c, L, X, Y, T, x, y, gN, gS, gW, gE);
  BEL.floorAt = (c, land, wx, wy, T, X, Y) => floorTile(c, LANDS[land] || LANDS.belfry, X, Y, T, wx, wy, false, false, false, false);
  /* the walls' faces: ivory blocks in two courses with dark teal joints (laid in world x, never a tile apart), the bottom
     third stained almost black by the tide, now and then a thick brass rib, and turquoise light leaking through cracks */
  function belWall(c, X, Y, T, H, h, x, lw, B) {
    const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, '#E6E4D3'); g.addColorStop(0.45, '#CFCFBE'); g.addColorStop(1, '#A9AE9F'); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    const P = wx => X + (wx - x) * T;
    for (let k = 0; k < 2; k++) { const y0 = Y + k * H * 0.5, y1 = y0 + H * 0.5; c.fillStyle = 'rgba(255,255,248,.18)'; c.fillRect(X, y0, T + 0.5, Math.max(1, H * 0.04)); c.fillStyle = SEAM; c.fillRect(X, y1 - Math.max(1, T * 0.04), T + 0.5, Math.max(1, T * 0.04));
      for (let j = Math.floor((x - 2) / 1.63) - 1; j <= Math.floor((x + 2) / 1.63) + 1; j++) { const jx = j * 1.63 + k * 0.81 + (hh(j, k, 71) - 0.5) * 0.4; if (jx < x - 0.05 || jx > x + 1.05) continue; const px = P(jx); c.fillStyle = SEAM; c.fillRect(px - Math.max(0.5, T * 0.02), y0, Math.max(1, T * 0.04), y1 - y0); c.fillStyle = 'rgba(255,255,248,.14)'; c.fillRect(px + Math.max(0.5, T * 0.02), y0, Math.max(1, T * 0.02), y1 - y0); } }
    // the tidal stain: the bottom third almost black, a ragged waterline, a teal bloom above it
    const sg = c.createLinearGradient(0, Y + H * 0.5, 0, Y + H); sg.addColorStop(0, 'rgba(18,27,31,0)'); sg.addColorStop(0.3, 'rgba(18,27,31,.55)'); sg.addColorStop(0.42, 'rgba(18,27,31,.86)'); sg.addColorStop(1, 'rgba(10,16,19,.95)'); c.fillStyle = sg; c.fillRect(X, Y + H * 0.5, T + 0.5, H * 0.5);
    c.fillStyle = 'rgba(70,140,130,.22)'; for (let i = 0; i < 3; i++) { const wx = x + (i + hh(x, i, 73)) / 3, px = P(wx), len = H * (0.06 + hh(x, i, 79) * 0.14); c.fillRect(px, Y + H * 0.62 - len, Math.max(1, T * 0.03), len); }
    // a brass rib (every few blocks of wall, by world x)
    if (((x % 7) + 7) % 7 === 3) { const rx = X + T * 0.32, rw = T * 0.36; const bg = c.createLinearGradient(rx, 0, rx + rw, 0); bg.addColorStop(0, '#6E5730'); bg.addColorStop(0.35, BRASS_HI); bg.addColorStop(0.6, BRASS); bg.addColorStop(1, '#4A3A1C'); c.fillStyle = bg; c.fillRect(rx, Y - T * 0.1, rw, H + T * 0.1); c.strokeStyle = LN; c.lineWidth = Math.max(1, lw * 0.6); c.strokeRect(rx, Y - T * 0.1, rw, H + T * 0.1);
      for (let i = 0; i < 3; i++) { const ry = Y + H * (0.15 + i * 0.3); c.fillStyle = '#3A2E16'; c.beginPath(); c.arc(rx + rw / 2, ry, Math.max(1, T * 0.04), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,240,190,.6)'; c.beginPath(); c.arc(rx + rw / 2 - 0.5, ry - 0.5, Math.max(0.6, T * 0.018), 0, TAU); c.fill(); }
      c.fillStyle = 'rgba(60,120,100,.35)'; c.fillRect(rx, Y + H * 0.66, rw, H * 0.34); }
    // turquoise light leaking through a crack
    else if (hh(x, 5, 83) < 0.22) { const R = rnd(x * 31 + 7); let px = X + T * (0.25 + R() * 0.5), py = Y + H * 0.05; const pts = [[px, py]]; for (let i = 0; i < 5; i++) { px += (R() - 0.5) * T * 0.3; py += H * 0.12; pts.push([px, py]); }
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; poly(c, pts); c.strokeStyle = '#0E2A2E'; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(97,217,210,.55)'; c.lineWidth = Math.max(1.2, T * 0.05); c.stroke(); c.strokeStyle = 'rgba(210,255,250,.85)'; c.lineWidth = Math.max(0.6, T * 0.018); c.stroke(); c.restore(); }
  }
  /* the cliff over the sea (ground's edge): a wet dark lip, a line of foam where the water licks it */
  function belCliff(c, x, y, X, Y, T, lw, B) { const H = T * 0.62; const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, 'rgba(6,18,24,.35)'); g.addColorStop(1, 'rgba(6,18,24,0)'); c.fillStyle = g; c.fillRect(X, Y, T, H);
    c.fillStyle = 'rgba(226,247,242,.5)'; c.fillRect(X, Y + H * 0.92, T, Math.max(1, T * 0.035)); c.save(); c.globalCompositeOperation = 'lighter'; const g2 = c.createLinearGradient(0, Y + H, 0, Y + H * 0.4); g2.addColorStop(0, 'rgba(97,217,210,.22)'); g2.addColorStop(1, 'rgba(97,217,210,0)'); c.fillStyle = g2; c.fillRect(X, Y + H * 0.4, T, H * 0.6); c.restore(); }
  /* bridges over the sea: dressed slabs on a stone beam, brass edging, wet */
  function belBridge(c, x, y, X, Y, T, isGap, tt, lw) { const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y), horiz = gNS && !gWE ? true : gWE && !gNS ? false : true;
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0); c.fillStyle = 'rgba(4,14,20,.45)'; c.fillRect(0, T * 0.18, T, T * 0.82);
    for (let i = 0; i < 2; i++) { const x0 = T * (0.02 + i * 0.5), w = T * 0.46; const g = c.createLinearGradient(0, T * 0.1, 0, T * 0.9); g.addColorStop(0, '#D2D3C3'); g.addColorStop(1, '#A7AC9C'); c.fillStyle = g; c.fillRect(x0, T * 0.1, w, T * 0.8); c.strokeStyle = SEAM; c.lineWidth = Math.max(1, T * 0.04); c.strokeRect(x0, T * 0.1, w, T * 0.8); }
    for (const yy of [0.04, 0.86]) { c.fillStyle = BRASS; c.fillRect(0, T * yy, T, T * 0.1); c.fillStyle = 'rgba(255,236,170,.35)'; c.fillRect(0, T * yy, T, Math.max(1, T * 0.025)); }
    c.restore(); }
  function belBridgeEdge(c, x, y, X, Y, T) { c.fillStyle = '#1C2E33'; c.fillRect(X + T * 0.04, Y, T * 0.92, T * 0.14); c.fillStyle = 'rgba(226,247,242,.45)'; c.fillRect(X + T * 0.04, Y + T * 0.13, T * 0.92, Math.max(1, T * 0.03)); }

  /* ======================= the sea: one opaque plane, slowly scrolling, and the far view over it =======================
     The plane is a tile of deep ocean blue with long swells, troughs and pale glints (worked out once, wrapping). Over it,
     where the sea shows: the purple low clouds' reflections drifting, the moon's path, and the tilted tower with its
     house-sized bell standing out in the water to the north (its own parallax, so it reads as far away), and once in a
     run an enormous fish gliding across the moon. */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.belsea = { base: DEEP,
    paint(c, S, R) { c.fillStyle = DEEP; c.fillRect(0, 0, S, S);
      const wrap = f => { for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) f(ox, oy); };
      for (let i = 0; i < 16; i++) { const x = R() * S, y = R() * S, w = 30 + R() * 60, h = 8 + R() * 10, dark = R() < 0.45; wrap((ox, oy) => { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, w); g.addColorStop(0, dark ? 'rgba(8,34,48,.55)' : 'rgba(34,92,116,.42)'); g.addColorStop(1, dark ? 'rgba(8,34,48,0)' : 'rgba(34,92,116,0)'); c.save(); c.translate(x + ox, y + oy); c.scale(1, h / w); c.translate(-x - ox, -y - oy); c.fillStyle = g; c.beginPath(); c.arc(x + ox, y + oy, w, 0, TAU); c.fill(); c.restore(); }); }
      for (let i = 0; i < 34; i++) { const x = R() * S, y = R() * S, w = 6 + R() * 22, a = 0.06 + R() * 0.16; wrap((ox, oy) => { c.strokeStyle = `rgba(150,225,232,${a.toFixed(3)})`; c.lineWidth = 1 + R() * 0.8; c.beginPath(); c.moveTo(x + ox - w, y + oy); c.quadraticCurveTo(x + ox, y + oy - 2.5, x + ox + w, y + oy); c.stroke(); }); }
      for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(210,250,250,${(0.25 + R() * 0.4).toFixed(2)})`; const x = R() * S, y = R() * S; c.fillRect(x, y, 1.2, 1); } },
    back(c, o) { const { pat, pattern, k, W, H, t } = o; pat(pattern('belsea', k), 1, W / 2 + t * 1.6, H / 2 + t * 0.7 + Math.sin(t * 0.25) * 5);
      vista(c, W, H, o.wx, o.wy, t, CUR && CUR.X ? CUR.X.Tz() : null, CUR); } };
  let CUR = null;   // (the running stage's context: its vista, the fish, the drain)
  /* the tilted tower, painted once per size into its own canvas: a square stone tower of ivory blocks leaning ~7 degrees,
     its lower third black with the tide, foam round its foot, a broad belfry opening near the top with a bronze bell larger
     than a house hanging in it, turquoise light inside, brass bands, a broken parapet */
  const towerCache = new Map();
  function towerSprite(T, calm) { const key = Math.round(T * 4) + '|' + (calm > 0.5 ? 1 : 0); let s = towerCache.get(key); if (s) return s;
    const w = T * 7, H = T * 24, cv = document.createElement('canvas'); cv.width = Math.ceil(w * 2.4); cv.height = Math.ceil(H * 1.15); const c = cv.getContext('2d'), ox = cv.width / 2, oy = cv.height - T * 1.2, lw = Math.max(1.5, T * 0.08);
    c.translate(ox, oy); c.rotate(0.12);
    // the shaft: three faces seen (lit left, front, shade right), courses of ivory blocks
    const bw = w * 0.5, top = -H;
    const face = (x0, x1, col0, col1) => { const g = c.createLinearGradient(x0, top, x1, 0); g.addColorStop(0, col0); g.addColorStop(1, col1); c.fillStyle = g; c.fillRect(x0, top + T * 2.2, x1 - x0, -top - T * 2.2); };
    face(-bw, -bw * 0.25, '#D9D7C5', '#B9BBA9'); face(-bw * 0.25, bw, '#B5B8A6', '#8D9284');
    c.strokeStyle = 'rgba(36,80,79,.75)'; c.lineWidth = Math.max(1, T * 0.06); for (let y = top + T * 2.6; y < 0; y += T * 1.1) { c.beginPath(); c.moveTo(-bw, y); c.lineTo(bw, y); c.stroke(); const off = (Math.round(y / T) % 2) * T * 0.8; for (let x = -bw + off; x < bw; x += T * 1.6) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + T * 1.1); c.stroke(); } }
    const st2 = c.createLinearGradient(0, -H * 0.36, 0, 0); st2.addColorStop(0, 'rgba(18,27,31,0)'); st2.addColorStop(0.3, 'rgba(18,27,31,.8)'); st2.addColorStop(1, 'rgba(8,14,18,.96)'); c.fillStyle = st2; c.fillRect(-bw, -H * 0.36, bw * 2, H * 0.36);
    // brass bands
    for (const yy of [-H * 0.42, -H * 0.72]) { c.fillStyle = BRASS; c.fillRect(-bw - T * 0.1, yy, bw * 2 + T * 0.2, T * 0.45); c.fillStyle = 'rgba(255,236,170,.4)'; c.fillRect(-bw - T * 0.1, yy, bw * 2 + T * 0.2, T * 0.1); }
    // the belfry: a tall arched opening, dark inside, turquoise light, the giant bell
    const ax = -bw * 0.78, aw = bw * 1.56, ay = top + T * 3.2, ah = H * 0.3; c.beginPath(); c.moveTo(ax, ay + ah); c.lineTo(ax, ay + aw * 0.5); c.arc(0, ay + aw * 0.5, aw / 2, Math.PI, 0); c.lineTo(ax + aw, ay + ah); c.closePath(); const ig = c.createLinearGradient(0, ay, 0, ay + ah); ig.addColorStop(0, '#0A1A22'); ig.addColorStop(1, calm > 0.5 ? '#3A3020' : '#0F3038'); c.fillStyle = ig; c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
    c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(calm > 0.5 ? '#FFD27A' : TURQ), -aw * 0.7, ay + ah * 0.1, aw * 1.4, ah * 1.1); c.restore();
    // the bell: bronze, flared mouth, a crack, larger than a house (it fills the opening)
    const by = ay + aw * 0.28, bh2 = ah * 0.78, br = aw * 0.42; c.beginPath(); c.moveTo(-br * 0.42, by); c.quadraticCurveTo(-br * 0.5, by + bh2 * 0.45, -br * 0.78, by + bh2 * 0.82); c.quadraticCurveTo(-br * 1.05, by + bh2 * 0.95, -br * 1.02, by + bh2); c.lineTo(br * 1.02, by + bh2); c.quadraticCurveTo(br * 1.05, by + bh2 * 0.95, br * 0.78, by + bh2 * 0.82); c.quadraticCurveTo(br * 0.5, by + bh2 * 0.45, br * 0.42, by); c.quadraticCurveTo(0, by - bh2 * 0.12, -br * 0.42, by); c.closePath();
    const bgr = c.createLinearGradient(-br, 0, br, 0); bgr.addColorStop(0, '#5A4320'); bgr.addColorStop(0.3, '#C49A4E'); bgr.addColorStop(0.55, '#8A6A34'); bgr.addColorStop(1, '#3A2A12'); c.fillStyle = bgr; c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
    c.strokeStyle = 'rgba(60,140,120,.6)'; c.lineWidth = Math.max(1, T * 0.12); c.beginPath(); c.moveTo(-br * 0.9, by + bh2 * 0.9); c.lineTo(br * 0.9, by + bh2 * 0.9); c.stroke(); c.strokeStyle = '#2A1E0C'; c.lineWidth = Math.max(1, T * 0.07); c.beginPath(); c.moveTo(br * 0.2, by + bh2 * 0.15); c.lineTo(br * 0.32, by + bh2 * 0.5); c.lineTo(br * 0.22, by + bh2 * 0.75); c.stroke();
    // the parapet, broken; foam round its foot
    c.fillStyle = '#CFCFBE'; for (let i = 0; i < 5; i++) { if (i === 3) continue; c.fillRect(-bw + i * bw * 0.42, top + T * 1.2, bw * 0.3, T * 1.0 + (i % 2) * T * 0.3); } c.fillStyle = '#B9BBA9'; c.fillRect(-bw - T * 0.2, top + T * 2.1, bw * 2 + T * 0.4, T * 0.4);
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = lw; c.strokeRect(-bw, top + T * 2.2, bw * 2, H - T * 2.2);
    c.rotate(-0.12); c.fillStyle = 'rgba(226,247,242,.55)'; ell(c, 0, 0, bw * 1.5, T * 0.7); c.fill(); c.fillStyle = 'rgba(15,51,70,.6)'; ell(c, 0, T * 0.12, bw * 1.3, T * 0.45); c.fill();
    s = { cv, ax: ox, ay: oy }; if (towerCache.size > 6) towerCache.clear(); towerCache.set(key, s); return s; }
  /* the fish: a vast silhouette, blunt head, long body, a sail of a dorsal fin; seen once a run, crossing the moon */
  function fishShape(c, x, y, L, u) { c.save(); c.translate(x, y); const sw = Math.sin(u * TAU * 3) * L * 0.02; c.beginPath(); c.moveTo(L * 0.5, 0); c.quadraticCurveTo(L * 0.45, -L * 0.1, L * 0.2, -L * 0.12); c.quadraticCurveTo(L * 0.05, -L * 0.3, -L * 0.15, -L * 0.1); c.quadraticCurveTo(-L * 0.32, -L * 0.07 + sw, -L * 0.42, -L * 0.02 + sw); c.lineTo(-L * 0.56, -L * 0.14 + sw * 2); c.lineTo(-L * 0.5, sw); c.lineTo(-L * 0.58, L * 0.11 + sw * 2); c.lineTo(-L * 0.42, L * 0.03 + sw); c.quadraticCurveTo(-L * 0.1, L * 0.12, L * 0.28, L * 0.08); c.quadraticCurveTo(L * 0.46, L * 0.06, L * 0.5, 0); c.closePath(); c.fillStyle = 'rgba(4,10,22,.9)'; c.fill(); c.restore(); }
  /* the far view (screen px): the moon and its path, the clouds' reflections, the tower, the fish */
  function vista(c, W, H, wx, wy, t, Tz, C) { const T = Tz || Math.max(24, Math.min(W, H) / 10), calm = C ? C.calm || 0 : 0, lf = lowFx();
    // the moon's path on the water and the moon itself, far (slow parallax)
    const mx = W * 0.78 - (wx * 0.04) % (W * 0.3), my = H * 0.12 - (wy * 0.03) % (H * 0.1);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.28 * (1 - calm * 0.6); blitSized(c, glowSprite('#9FE8D8'), mx - T * 5, my - T * 3, T * 10, T * 6);
    if (!lf) for (let i = 0; i < 9; i++) { const yy = my + T * (1 + i * 0.9), w2 = T * (1.6 + i * 0.25) * (0.7 + 0.3 * Math.sin(t * 1.3 + i * 1.7)); c.globalAlpha = 0.16 * (1 - i / 10); c.fillStyle = '#DFF6F0'; c.fillRect(mx - w2 / 2, yy, w2, Math.max(1, T * 0.06)); }
    c.globalAlpha = 0.85; c.fillStyle = '#EAF8F2'; c.beginPath(); c.arc(mx, my, T * 0.9, 0, TAU); c.fill(); c.globalAlpha = 0.35; blitSized(c, glowSprite('#E8FFF8'), mx - T * 2, my - T * 2, T * 4, T * 4); c.restore();
    // the fish, once a run (C.fish: its start time), crossing the moon from the west
    if (C && C.fish && C.fish.on) { const u = clamp((C.t - C.fish.t0) / 16, 0, 1); if (u > 0 && u < 1) fishShape(c, mx - T * 12 + u * T * 24, my + Math.sin(u * Math.PI) * T * 0.4, T * 7.5, u); }
    // the purple low clouds, reflected: broad soft drifts
    c.save(); c.globalAlpha = lf ? 0.25 : 0.35; for (let i = 0; i < 6; i++) { const span = W * 1.6, x = ((i * 0.37 * span + t * (6 + i * 1.5) - wx * 0.6) % span + span) % span - W * 0.3, y = ((i * 0.53 * H * 1.4 - wy * 0.6) % (H * 1.4) + H * 1.4) % (H * 1.4) - H * 0.2, r = T * (3 + (i % 3) * 1.4); const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(calm > 0.5 ? '#C8A86A' : PURPLE, 0.55)); g.addColorStop(1, rgba(PURPLE, 0)); c.fillStyle = g; c.save(); c.translate(x, y); c.scale(1.8, 0.6); c.translate(-x, -y); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore(); } c.restore();
    // the tilted tower out in the sea, to the north (world spot C.vista; parallax 0.72)
    if (C && C.vista && C.X) { const X = C.X, par = 0.72, sx = W / 2 + (C.vista.x * T - wx) * par, sy = H / 2 + (C.vista.y * T - wy) * par, s = towerSprite(T * 0.9, calm);
      if (sx > -s.cv.width && sx < W + s.cv.width && sy - s.ay < H + T && sy > -T * 2) { c.drawImage(s.cv, sx - s.ax, sy - s.ay); if (!lf) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.22 + 0.08 * Math.sin(t * 0.8); blitSized(c, glowSprite(calm > 0.5 ? '#FFD27A' : TURQ), sx - T * 3, sy - T * 20, T * 6, T * 7); c.restore(); } } }
    if (calm > 0) { c.save(); c.globalAlpha = 0.25 * calm; c.fillStyle = '#FFE2A0'; c.fillRect(0, 0, W, H); c.restore(); } }
  BEL.paintSea = (c, W, H, camX, camY, T, t) => { const P = { k: 1 }, p = DunWorld.pattern('belsea', 1); try { p.setTransform(new DOMMatrix([1, 0, 0, 1, -camX * T + W / 2 + t * 1.6, -camY * T + H / 2 + t * 0.7])); } catch (e) {} c.fillStyle = DEEP; c.fillRect(0, 0, W, H); c.fillStyle = p; c.fillRect(0, 0, W, H); void P; };
  BEL.paintSky = (c, W, H, T, o) => { o = o || {}; const cam = o.cam || { x: 0, y: 0 }, t = o.t || 0; BEL.paintSea(c, W, H, cam.x, cam.y, T, t); const C = Object.assign({}, CUR || {}, { calm: o.calm != null ? o.calm : (CUR ? CUR.calm : 0), vista: o.tower || (CUR && CUR.vista), X: (CUR && CUR.X) || { Tz: () => T } }); vista(c, W, H, cam.x * T, cam.y * T, t, T, C); };
  BEL.towerSprite = towerSprite; BEL.fishShape = fishShape;

  /* ======================= props (set dressing; every one breaks through BREAK_FX in its own material) ======================= */
  const fadeUp = (c, x0, x1, y0, y1) => { c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, y1, 0, y0); g.addColorStop(0, 'rgba(6,16,22,0)'); g.addColorStop(0.6, 'rgba(6,16,22,.6)'); g.addColorStop(1, 'rgba(6,16,22,1)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore(); };
  const waterRing = (c, T, rx, a) => { c.fillStyle = `rgba(20,90,110,${(a || 0.55).toFixed(2)})`; ell(c, 0, T * 0.02, rx, rx * 0.34); c.fill(); c.strokeStyle = 'rgba(226,247,242,.6)'; c.lineWidth = Math.max(1, T * 0.035); ell(c, 0, T * 0.02, rx * 0.92, rx * 0.3); c.stroke(); c.strokeStyle = 'rgba(226,247,242,.25)'; ell(c, 0, T * 0.02, rx * 1.15, rx * 0.4); c.stroke(); };
  const stoneG = (c, x0, x1, lite) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, lite ? '#E6E4D3' : '#D5D4C2'); g.addColorStop(0.45, '#C3C5B3'); g.addColorStop(1, '#8E9385'); return g; };
  const stainBand = (c, x0, x1, yTop, yBot) => { const g = c.createLinearGradient(0, yTop, 0, yBot); g.addColorStop(0, 'rgba(18,27,31,0)'); g.addColorStop(0.35, 'rgba(18,27,31,.82)'); g.addColorStop(1, 'rgba(8,14,18,.95)'); c.fillStyle = g; c.fillRect(x0, yTop, x1 - x0, yBot - yTop); };
  const brassBand = (c, x0, x1, y, h) => { const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, BRASS_HI); g.addColorStop(0.5, BRASS); g.addColorStop(1, BRASS_D); c.fillStyle = g; c.fillRect(x0, y, x1 - x0, h); c.strokeStyle = LN; c.lineWidth = Math.max(1, h * 0.12); c.strokeRect(x0, y, x1 - x0, h); };
  /* a square column of ivory blocks standing in shallow water: dark teal joints, the black tide on its lower third, a brass collar */
  function belcolumn(c, T, v) { const lw = lw0(T), w = T * (0.62 + (v % 2) * 0.08), H = T * (4.6 + (v % 3) * 0.4), d = w * 0.42; waterRing(c, T, T * 1.05);
    c.fillStyle = '#7E8478'; poly(c, [[w, 0], [w + d, -d * 0.6], [w + d, -H - d * 0.6], [w, -H]]); c.closePath(); c.fill(); ink(c, lw * 0.8);
    c.fillStyle = stoneG(c, -w, w, true); c.fillRect(-w, -H, w * 2, H); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-w, -H, w * 2, H);
    c.strokeStyle = SEAM; c.lineWidth = Math.max(1, T * 0.045); for (let i = 1; i < H / (T * 0.95); i++) { const y = -i * T * 0.95; c.beginPath(); c.moveTo(-w, y); c.lineTo(w + d, y - d * 0.6); c.stroke(); const jx = (i % 2 ? -0.2 : 0.3) * w; c.beginPath(); c.moveTo(jx, y); c.lineTo(jx, y + T * 0.95); c.stroke(); }
    stainBand(c, -w, w + d, -H * 0.38, 0); brassBand(c, -w - T * 0.06, w + T * 0.06, -H * 0.58, T * 0.26);
    c.fillStyle = 'rgba(255,255,248,.22)'; c.fillRect(-w + T * 0.06, -H, T * 0.08, H * 0.6); fadeUp(c, -w - T, w + d + T, -H - T, -H + T * 1.4); }
  /* a broken column: a stump of blocks, its top shattered, rubble at its foot in the water */
  function belstump(c, T, v) { const lw = lw0(T), w = T * 0.66, H = T * (1.3 + (v % 3) * 0.4), d = w * 0.42, R = rnd(5 + v); waterRing(c, T, T * 1.0, 0.45);
    c.fillStyle = '#7E8478'; poly(c, [[w, 0], [w + d, -d * 0.6], [w + d, -H - d * 0.6], [w, -H]]); c.closePath(); c.fill(); ink(c, lw * 0.8);
    const top = [[-w, -H + T * 0.1]]; for (let i = 1; i < 6; i++) top.push([-w + i * w * 0.4, -H - (R() - 0.3) * T * 0.4]); top.push([w, -H]);
    poly(c, [[-w, 0], ...top, [w, 0]]); c.closePath(); c.fillStyle = stoneG(c, -w, w, true); c.fill(); ink(c, lw);
    stainBand(c, -w, w, -H * 0.55, 0); c.strokeStyle = SEAM; c.lineWidth = Math.max(1, T * 0.045); c.beginPath(); c.moveTo(-w, -T * 0.9); c.lineTo(w, -T * 0.9); c.stroke();
    for (let i = 0; i < 4; i++) { const x = (R() - 0.5) * T * 1.6, y = (R() - 0.2) * T * 0.3, s = T * (0.14 + R() * 0.16); c.fillStyle = '#B8BBAA'; poly(c, [[x - s, y], [x - s * 0.4, y - s * 0.8], [x + s, y - s * 0.4], [x + s * 0.6, y + s * 0.2]]); c.closePath(); c.fill(); ink(c, lw * 0.6); } }
  /* a pew become a broad floating slab: a thick stone bench top riding on the water, ripples round it */
  function belbench(c, T, v) { const lw = lw0(T), w = T * 1.4, h = T * 0.32, bob = (v % 2) * T * 0.05; c.fillStyle = 'rgba(20,90,110,.5)'; ell(c, 0, T * 0.04, w * 1.2, T * 0.42); c.fill(); c.strokeStyle = 'rgba(226,247,242,.55)'; c.lineWidth = Math.max(1, T * 0.035); ell(c, 0, T * 0.04, w * 1.08, T * 0.36); c.stroke();
    c.fillStyle = '#6E7568'; c.fillRect(-w, -h - bob, w * 2, h); ink(c, lw); c.fillStyle = stoneG(c, -w, w, true); poly(c, [[-w, -h - bob], [-w + T * 0.3, -h - T * 0.55 - bob], [w + T * 0.3, -h - T * 0.55 - bob], [w, -h - bob]]); c.closePath(); c.fill(); ink(c, lw);
    c.strokeStyle = SEAM; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(-w * 0.1, -h - bob); c.lineTo(-w * 0.1 + T * 0.3, -h - T * 0.55 - bob); c.stroke(); c.fillStyle = 'rgba(40,96,84,.35)'; c.fillRect(-w, -h * 0.5 - bob, w * 2, h * 0.5); }
  /* an upward waterfall: a basin of churning water, a narrow ribbon of water rising into a crack in the ceiling */
  function belfall(c, T, v) { const lw = lw0(T), H = T * (5.2 + (v % 3) * 0.5), w0 = T * 0.22, w1 = T * 0.12; c.fillStyle = 'rgba(14,70,90,.75)'; ell(c, 0, 0, T * 1.0, T * 0.36); c.fill(); ink(c, lw * 0.8, 0.6); c.fillStyle = 'rgba(226,247,242,.7)'; ell(c, 0, -T * 0.02, T * 0.5, T * 0.16); c.fill();
    c.beginPath(); c.moveTo(-w0, -T * 0.05); c.bezierCurveTo(-w0 * 0.9, -H * 0.4, -w1 * 1.4, -H * 0.7, -w1, -H); c.lineTo(w1, -H); c.bezierCurveTo(w1 * 1.4, -H * 0.7, w0 * 0.9, -H * 0.4, w0, -T * 0.05); c.closePath();
    const g = c.createLinearGradient(-w0, 0, w0, 0); g.addColorStop(0, 'rgba(60,170,190,.75)'); g.addColorStop(0.45, 'rgba(210,252,250,.92)'); g.addColorStop(1, 'rgba(50,150,175,.75)'); c.fillStyle = g; c.fill(); ink(c, lw * 0.6, 0.5);
    c.fillStyle = '#0A1A20'; poly(c, [[-T * 0.5, -H - T * 0.05], [-T * 0.12, -H - T * 0.22], [T * 0.2, -H - T * 0.1], [T * 0.55, -H - T * 0.24], [T * 0.4, -H + T * 0.06], [-T * 0.35, -H + T * 0.08]]); c.closePath(); c.fill(); fadeUp(c, -T * 1.2, T * 1.2, -H - T * 0.6, -H + T * 1.2); }
  /* a brass rib: a thick curved bronze-brass beam rising from the floor, riveted, green in its folds */
  function belrib(c, T, v) { const lw = lw0(T), H = T * (4.2 + (v % 2) * 0.6), sd = v % 2 ? -1 : 1; shadowEll(c, T, 0.7);
    c.beginPath(); c.moveTo(-T * 0.25, 0); c.quadraticCurveTo(-T * 0.3 + sd * T * 0.2, -H * 0.6, sd * T * 0.9, -H); c.lineTo(sd * T * 0.9 + T * 0.32, -H + T * 0.1); c.quadraticCurveTo(T * 0.1 + sd * T * 0.25, -H * 0.58, T * 0.25, 0); c.closePath(); const g = c.createLinearGradient(-T * 0.3, 0, T * 0.3, 0); g.addColorStop(0, BRASS_D); g.addColorStop(0.4, BRASS_HI); g.addColorStop(0.7, BRASS); g.addColorStop(1, '#3A2E16'); c.fillStyle = g; c.fill(); ink(c, lw);
    for (let i = 1; i < 6; i++) { const u = i / 6, x = lerp(0, sd * T * 0.9, u * u) , y = -H * u; c.fillStyle = '#3A2E16'; c.beginPath(); c.arc(x, y, Math.max(1, T * 0.05), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,240,190,.6)'; c.beginPath(); c.arc(x - 0.6, y - 0.6, Math.max(0.6, T * 0.02), 0, TAU); c.fill(); }
    c.fillStyle = 'rgba(70,150,120,.35)'; c.fillRect(-T * 0.25, -H * 0.3, T * 0.5, H * 0.3); fadeUp(c, -T * 1.5, T * 1.8, -H - T * 0.4, -H + T * 1.2); }
  /* a bell: a bronze bell on the floor (fallen), mouth down, chipped, three bands; v odd: a cracked one */
  function belbell(c, T, v) { const lw = lw0(T), s = T * (0.95 + (v % 3) * 0.18), H = s * 1.9; shadowEll(c, T, 1.15);
    c.beginPath(); c.moveTo(-s * 0.45, -H); c.quadraticCurveTo(-s * 0.55, -H * 0.5, -s * 0.85, -H * 0.15); c.quadraticCurveTo(-s * 1.12, -H * 0.05, -s * 1.1, 0); c.lineTo(s * 1.1, 0); c.quadraticCurveTo(s * 1.12, -H * 0.05, s * 0.85, -H * 0.15); c.quadraticCurveTo(s * 0.55, -H * 0.5, s * 0.45, -H); c.quadraticCurveTo(0, -H * 1.12, -s * 0.45, -H); c.closePath();
    const g = c.createLinearGradient(-s, 0, s, 0); g.addColorStop(0, '#4A3618'); g.addColorStop(0.28, '#C9A055'); g.addColorStop(0.5, '#8D6C33'); g.addColorStop(1, '#2E220E'); c.fillStyle = g; c.fill(); ink(c, lw);
    for (const u of [0.22, 0.5, 0.78]) { const y = -H * u, hw = lerp(s * 1.0, s * 0.5, u); c.strokeStyle = '#5A4320'; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.moveTo(-hw, y); c.lineTo(hw, y); c.stroke(); c.strokeStyle = 'rgba(255,230,160,.35)'; c.lineWidth = Math.max(0.8, T * 0.025); c.beginPath(); c.moveTo(-hw * 0.7, y - T * 0.04); c.lineTo(hw * 0.2, y - T * 0.04); c.stroke(); }
    c.fillStyle = 'rgba(80,170,140,.38)'; c.beginPath(); c.moveTo(-s * 1.1, 0); c.quadraticCurveTo(-s * 0.6, -H * 0.2, -s * 0.2, -H * 0.05); c.lineTo(s * 0.4, 0); c.closePath(); c.fill();
    if (v % 2) { c.strokeStyle = '#1A1206'; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); c.moveTo(s * 0.2, -H * 0.95); c.lineTo(s * 0.32, -H * 0.6); c.lineTo(s * 0.18, -H * 0.35); c.lineTo(s * 0.3, -H * 0.1); c.stroke(); }
    c.fillStyle = '#5A4320'; c.fillRect(-s * 0.18, -H - s * 0.22, s * 0.36, s * 0.24); ink(c, lw * 0.7); }
  /* a bronze bell mould: a squat open shell of dark bronze and clay, its seam flashing */
  function belmould(c, T, v) { const lw = lw0(T), s = T * 1.0; shadowEll(c, T, 1.05);
    c.beginPath(); c.moveTo(-s * 1.05, 0); c.quadraticCurveTo(-s * 1.1, -s * 1.3, -s * 0.2, -s * 1.5); c.lineTo(s * 0.2, -s * 1.5); c.quadraticCurveTo(s * 1.1, -s * 1.3, s * 1.05, 0); c.closePath(); const g = c.createLinearGradient(-s, 0, s, 0); g.addColorStop(0, '#3A2A16'); g.addColorStop(0.35, '#7A5A2E'); g.addColorStop(1, '#22180A'); c.fillStyle = g; c.fill(); ink(c, lw);
    ell(c, 0, -s * 1.5, s * 0.32, s * 0.1); c.fillStyle = '#120C06'; c.fill(); ink(c, lw * 0.7); c.strokeStyle = 'rgba(217,179,95,.75)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(0, -s * 1.48); c.lineTo(0, -s * 0.05); c.stroke();
    c.fillStyle = 'rgba(160,110,70,.4)'; for (let i = 0; i < 4; i++) { ell(c, (i - 1.5) * s * 0.45, -s * (0.25 + (i % 2) * 0.2), s * 0.16, s * 0.07); c.fill(); }
    for (const sd of [-1, 1]) { c.fillStyle = BRASS; c.fillRect(sd * s * 0.95 - s * 0.08, -s * 0.9, s * 0.16, s * 0.5); ink(c, lw * 0.5); } }
  /* a broken railing: stone balusters and a rail, a gap where it fell into the sea */
  function belrail(c, T, v) { const lw = lw0(T), n = 4, w = T * 1.9, brk = 1 + (v % 3); shadowEll(c, T, 0.9, 0.25);
    for (let i = 0; i < n; i++) { if (i === brk) continue; const x = -w / 2 + (i + 0.5) * w / n; c.beginPath(); c.moveTo(x - T * 0.1, 0); c.quadraticCurveTo(x - T * 0.2, -T * 0.4, x - T * 0.08, -T * 0.75); c.lineTo(x + T * 0.08, -T * 0.75); c.quadraticCurveTo(x + T * 0.2, -T * 0.4, x + T * 0.1, 0); c.closePath(); c.fillStyle = stoneG(c, x - T * 0.2, x + T * 0.2, true); c.fill(); ink(c, lw * 0.8); c.fillStyle = 'rgba(18,27,31,.5)'; c.fillRect(x - T * 0.14, -T * 0.25, T * 0.28, T * 0.25); }
    const L0 = -w / 2 - T * 0.05, br0 = -w / 2 + brk * w / n, br1 = br0 + w / n; c.fillStyle = '#CFCFBE'; c.fillRect(L0, -T * 0.92, br0 - L0 - T * 0.05, T * 0.18); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.strokeRect(L0, -T * 0.92, br0 - L0 - T * 0.05, T * 0.18); if (brk < n - 1) { c.fillStyle = '#CFCFBE'; c.fillRect(br1 + T * 0.05, -T * 0.92, w / 2 - br1, T * 0.18); c.strokeRect(br1 + T * 0.05, -T * 0.92, w / 2 - br1, T * 0.18); } }
  /* alien coral: ribbed ivory branches, barnacles, turquoise polyps that glow */
  function belcoral(c, T, v) { const lw = lw0(T), R = rnd(13 + v * 7); shadowEll(c, T, 0.8, 0.28);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42 + (R() - 0.5) * 0.2, L = T * (0.9 + R() * 1.1), x1 = Math.cos(a) * L, y1 = Math.sin(a) * L; c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = T * 0.24 + lw; c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(x1 * 0.3, y1 * 0.6, x1, y1); c.stroke(); c.strokeStyle = i % 2 ? '#E8DCCB' : '#D8B8A8'; c.lineWidth = T * 0.24; c.stroke();
      c.strokeStyle = 'rgba(120,80,70,.35)'; c.lineWidth = Math.max(0.8, T * 0.03); for (let k = 1; k < 4; k++) { const u = k / 4, px = x1 * u, py = y1 * u; c.beginPath(); c.moveTo(px - T * 0.08, py); c.lineTo(px + T * 0.08, py); c.stroke(); }
      c.fillStyle = TURQ; c.beginPath(); c.arc(x1, y1, T * 0.11, 0, TAU); c.fill(); c.fillStyle = '#E8FFFB'; c.beginPath(); c.arc(x1 - T * 0.03, y1 - T * 0.03, T * 0.04, 0, TAU); c.fill(); } }
  /* a brass sconce on a post with a turquoise flame in a sea-glass shade (the sparse turquoise light) */
  function bellamp(c, T, v) { const lw = lw0(T), H = T * 2.1; shadowEll(c, T, 0.4); c.strokeStyle = LN; c.lineWidth = T * 0.16 + lw; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -H); c.stroke(); c.strokeStyle = BRASS; c.lineWidth = T * 0.16; c.stroke(); c.strokeStyle = BRASS_HI; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(-T * 0.04, -T * 0.1); c.lineTo(-T * 0.04, -H); c.stroke();
    c.beginPath(); c.moveTo(-T * 0.26, -H); c.lineTo(-T * 0.2, -H - T * 0.55); c.lineTo(T * 0.2, -H - T * 0.55); c.lineTo(T * 0.26, -H); c.closePath(); const g = c.createLinearGradient(0, -H - T * 0.55, 0, -H); g.addColorStop(0, 'rgba(150,240,230,.85)'); g.addColorStop(1, 'rgba(40,150,150,.85)'); c.fillStyle = g; c.fill(); ink(c, lw);
    c.fillStyle = '#E8FFFB'; ell(c, 0, -H - T * 0.26, T * 0.08, T * 0.14); c.fill(); c.fillStyle = BRASS; poly(c, [[-T * 0.3, -H - T * 0.55], [0, -H - T * 0.78], [T * 0.3, -H - T * 0.55]]); c.closePath(); c.fill(); ink(c, lw * 0.8); }
  /* a broken stone arch half (the tide landings are framed by these): a pier and the spring of an arch, snapped off */
  function belarch(c, T, v) { const lw = lw0(T), sd = v % 2 ? -1 : 1, w = T * 0.7, H = T * 3.6; shadowEll(c, T, 0.85);
    c.fillStyle = stoneG(c, -w, w, true); c.fillRect(-w / 2, -H, w, H); ink(c, lw); c.beginPath(); c.moveTo(-w / 2, -H); c.quadraticCurveTo(-w / 2 + sd * T * 0.3, -H - T * 1.4, sd * T * 1.6, -H - T * 1.5); c.lineTo(sd * T * 1.55, -H - T * 0.9); c.quadraticCurveTo(sd * T * 0.4, -H - T * 0.75, w / 2 * sd, -H); c.closePath(); c.fillStyle = '#D3D3C2'; c.fill(); ink(c, lw);
    c.strokeStyle = SEAM; c.lineWidth = Math.max(1, T * 0.045); for (let y = -T; y > -H; y -= T) { c.beginPath(); c.moveTo(-w / 2, y); c.lineTo(w / 2, y); c.stroke(); } stainBand(c, -w / 2, w / 2, -H * 0.4, 0); fadeUp(c, -T * 2, T * 2, -H - T * 2, -H - T * 0.2); }
  /* half of a broken bell, a great bronze shard propped on its rim (the east foundry frames its mini boss with two) */
  function belhalf(c, T, v) { const lw = lw0(T), sd = v % 2 ? -1 : 1, s = T * 1.6; shadowEll(c, T, 1.4);
    c.beginPath(); c.moveTo(-s * sd * 0.9, 0); c.quadraticCurveTo(-s * sd * 1.0, -s * 1.6, sd * s * 0.1, -s * 2.0); c.lineTo(sd * s * 0.3, -s * 1.7); c.lineTo(sd * s * 0.05, -s * 1.3); c.lineTo(sd * s * 0.4, -s * 0.9); c.lineTo(sd * s * 0.15, -s * 0.4); c.lineTo(sd * s * 0.5, 0); c.closePath(); const g = c.createLinearGradient(-s, 0, s, 0); g.addColorStop(0, '#3A2A12'); g.addColorStop(0.4, '#B58C46'); g.addColorStop(1, '#4A3618'); c.fillStyle = g; c.fill(); ink(c, lw);
    c.strokeStyle = '#5A4320'; c.lineWidth = Math.max(1.5, T * 0.08); for (const u of [0.3, 0.62]) { c.beginPath(); c.moveTo(-s * sd * 0.92, -s * 2 * u); c.lineTo(sd * s * 0.1, -s * 2 * u - T * 0.1); c.stroke(); } c.fillStyle = 'rgba(80,170,140,.35)'; c.fillRect(-s, -s * 0.3, s * 2, s * 0.3); }
  /* a brass pipe with a valve wheel, green at the joints */
  function belpipe(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.45); c.fillStyle = BRASS; c.fillRect(-T * 0.18, -T * 2.6, T * 0.36, T * 2.6); ink(c, lw); c.fillStyle = 'rgba(255,236,170,.35)'; c.fillRect(-T * 0.12, -T * 2.6, T * 0.06, T * 2.6);
    for (const y of [-0.5, -1.6]) { c.fillStyle = BRASS_D; c.fillRect(-T * 0.26, y * T, T * 0.52, T * 0.16); ink(c, lw * 0.6); } c.strokeStyle = LN; c.lineWidth = T * 0.1 + lw; c.beginPath(); c.arc(T * 0.42, -T * 1.2, T * 0.26, 0, TAU); c.stroke(); c.strokeStyle = '#B04A3A'; c.lineWidth = T * 0.08; c.stroke(); c.fillStyle = 'rgba(70,150,120,.4)'; c.fillRect(-T * 0.18, -T * 0.6, T * 0.36, T * 0.18); }
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { belcolumn: [3.0, 6.2], belstump: [3.0, 2.6], belbench: [3.6, 1.6], belfall: [2.6, 6.6], belrib: [3.4, 5.6], belbell: [3.2, 3.4], belmould: [2.6, 2.4], belrail: [2.8, 1.6], belcoral: [3.0, 2.8], bellamp: [1.6, 3.4], belarch: [4.2, 6.0], belhalf: [3.8, 4.0], belpipe: [1.8, 3.2] });
  Object.assign(PROPS, { belcolumn, belstump, belbench, belfall, belrib, belbell, belmould, belrail, belcoral, bellamp, belarch, belhalf, belpipe });
  // (what each breaks into: limestone, brass and bronze, coral, sea glass for the waterfalls and the lamp's shade)
  const BRASS_COLS = ['#957943', '#5E4A26', '#E6C77A'], BRONZE_COLS = ['#8D6C33', '#4A3618', '#D9B35F'], LIME_COLS = ['#C8CCBC', '#8E9385', '#E8E6D6'], SEAGLASS_COLS = ['#7FD8D2', '#2E8A92', '#E2FBF8'];
  if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) Object.assign(BREAK_FX.KIND, {
    belcolumn: { mat: 'stone', cols: LIME_COLS }, belstump: { mat: 'stone', cols: LIME_COLS }, belbench: { mat: 'stone', cols: LIME_COLS }, belrail: { mat: 'stone', cols: LIME_COLS }, belarch: { mat: 'stone', cols: LIME_COLS },
    belfall: { mat: 'ice', cols: SEAGLASS_COLS, mix: 'stone' }, bellamp: { mat: 'glass', cols: SEAGLASS_COLS, hot: TURQ, mix: 'iron' },
    belrib: { mat: 'iron', cols: BRASS_COLS }, belpipe: { mat: 'iron', cols: BRASS_COLS, steam: true }, belbell: { mat: 'iron', cols: BRONZE_COLS }, belmould: { mat: 'iron', cols: BRONZE_COLS, mix: 'pottery' }, belhalf: { mat: 'iron', cols: BRONZE_COLS },
    belcoral: { mat: 'coral', cols: ['#E8DCCB', '#B0988A', '#FFFFFF'] } });
  if (typeof PROP_EL !== 'undefined') Object.assign(PROP_EL, { belcolumn: 'gold', belstump: 'gold', belbench: 'gold', belrail: 'gold', belarch: 'gold', belfall: 'bubble', belcoral: 'bubble', bellamp: 'prism', belrib: 'spark', belpipe: 'bubble', belbell: 'gold', belmould: 'gold', belhalf: 'gold' });
  // live lights over the props (in tiles from the prop's feet): [dx, dy, r, kind]
  const GLOWS = { bellamp: () => [[0, -2.36, 1.1, 'lamp']], belcoral: () => [[0, -1.0, 0.9, 'polyp']], belfall: v => [[0, -(5.2 + (v % 3) * 0.5), 0.6, 'fall']], belcolumn: () => [[0, 0, 1.0, 'ring']] };
  const PROP_LEGEND = { C: { prop: 'belcolumn' }, U: { prop: 'belstump' }, Y: { prop: 'belbench' }, F: { prop: 'belfall' }, I: { prop: 'belrib' }, Q: { prop: 'belbell' }, O: { prop: 'belmould' }, J: { prop: 'belrail' }, Z: { prop: 'belcoral' }, N: { prop: 'bellamp' }, A: { prop: 'belarch' }, H: { prop: 'belhalf' }, P: { prop: 'belpipe' } };
  BEL.PROP_LEGEND = PROP_LEGEND; BEL.GLOWS = GLOWS;

  /* ---- the lands themselves ---- */
  const land = (id, o) => Object.assign({ rift: true, tile: 'halls', out: false, ambient: 'motes', hazard: 'spikes', gap: 'belsea', bridgeFn: belBridge, bridgeEdge: belBridgeEdge, wallFn: belWall, cliffTint: belCliff, propN: [2, 2], fog: '#06141C', darkRGB: '6,20,30',
    floorFn: floorFn(LANDS[id]), mud: ['#2A6070', '#2F6A7A'], mudSpot: 'rgba(160,230,240,.22)', accent: TURQ, light: '#9FE8FF', bridgeCol: '#C8CCBC', deco: BRASS, grade: 'rgba(40,120,150,.06)', name: LANDS[id].name,
    floor: [LANDS[id].base, LANDS[id].base, LANDS[id].base], grout: LANDS[id].seam, hi: '#E2E6D8', top: '#33464A', face: '#C9CABA', faceD: '#5E665E', cliff: '#1D3A44', props: ['belcolumn', 'belstump', 'belcoral', 'bellamp'] }, o);
  BIOMES.belfry = land('belfry', { dark: 0.16, bg: '#0A2432' });
  BIOMES.belcause = land('belcause', { dark: 0.14, bg: '#0A2432', out: true });
  BIOMES.belbapt = land('belbapt', { dark: 0.16, bg: '#0A2432' });
  BIOMES.belcistern = land('belcistern', { dark: 0.22, bg: '#081C26', top: '#26343A' });
  BIOMES.belnave = land('belnave', { dark: 0.2, bg: '#081C26' });
  BIOMES.beltide = land('beltide', { dark: 0.14, bg: '#0A2432', out: true });
  BIOMES.belplat = land('belplat', { dark: 0.1, bg: '#0A2432', out: true });
  const LAND_IDS = ['belfry', 'belcause', 'belbapt', 'belcistern', 'belnave', 'beltide', 'belplat'];
  for (const id of LAND_IDS) { if (!BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = '6,20,30'; if (typeof ROOM_SHAPES !== 'undefined') ROOM_SHAPES[id] = ['oval', 'rect', 'oval']; if (typeof BOSS_ARENA !== 'undefined') BOSS_ARENA[id] = 'oval'; }

  /* ======================= the brood (original, after the Caldera's: every attack shown first, a recovery to punish) =======================
     Level-10 tuning (base stats; the rift's floor scales them; Rf.scale halves health and blows as before). */
  const BIO = LAND_IDS.slice();
  Object.assign(MON, {
    crawler: { name: 'Brine crawler', from: 999, hp: 110, spd: 1.7, r: 0.42, dmg: 11, xp: 9, coin: 0.5, color: '#4A8592', bio: BIO, kit: [], tip: 'A flat six-sided crab with one turquoise eye under its lip. It sidesteps, raises both claws (its tell), then pinches straight ahead in a narrow line: step to its side, then hit it while its claws are down.' },
    leech: { name: 'Bell leech', from: 999, hp: 70, spd: 0.5, r: 0.32, dmg: 8, xp: 6, coin: 0.4, color: '#6B4FA8', bio: BIO, still: true, kit: [], tip: 'A violet teardrop with a pale round mouth and a brass shell ring. It clings to a valve or a rack and swells before it spits a slow droplet. Nothing it holds can be used until it is pulled off (defeated).' },
    reeflantern: { name: 'Reef lantern', from: 999, hp: 60, spd: 1.2, r: 0.36, dmg: 6, xp: 7, coin: 0.5, color: '#A9DCEB', bio: BIO, fly: true, kit: [], tip: 'A floating pale-blue pear with three tassels. Its inner light brightens (a ring on the floor shows its reach) before it heals every monster near it: strike it while it brightens to stop the pulse, and beat it before the crawlers.' },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  const addGlow = (c, x, y, r, col, a) => glow(c, x, y, r, col, a);
  Object.assign(MP, {
    /* the brine crawler: a flattened hexagonal shell (teal slate, barnacled, a pale rim), four short legs, two rectangular
       claws on short arms, a single turquoise eye under its front lip. 'side' legs splayed mid-sidestep; 'raise' both claws
       high and open, the eye flaring (the tell); 'pinch' claws snapped shut forward. o.color tints a swarm variant */
    crawler(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', col = o.color || '#3F6E7A', run = Math.sin(ph * TAU * 2), raise = md === 'raise' ? 1 : 0, pinch = md === 'pinch' ? 1 : 0, side = md === 'side' ? 1 : 0;
      c.fillStyle = 'rgba(4,14,20,.34)'; ell(c, 0, r * 0.6, r * 1.15, r * 0.24); c.fill();
      // the legs: two each side, short and jointed, stepping
      const leg = (x, k, dark) => { const sw = run * k * r * 0.12 * (side ? 1.6 : 1), kx = x + sw, ky = r * 0.22, fx = x + sw * 1.6 + (side ? k * r * 0.1 : 0), fy = r * 0.6; limb(c, x, r * 0.12, kx, ky, Math.max(2, r * 0.13), dark ? shadeC(col, -0.35) : shadeC(col, -0.15)); limb(c, kx, ky, fx, fy, Math.max(1.6, r * 0.1), dark ? shadeC(col, -0.45) : shadeC(col, -0.25)); };
      leg(-r * 0.55, 1, true); leg(r * 0.15, -1, true);
      // the shell: a flat hexagon seen at an angle: its pale rim, its dark top plate with ridges, barnacles
      const hex = (sx, sy, dy) => { c.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6, x = Math.cos(a) * r * sx, y = Math.sin(a) * r * sy + dy; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); };
      hex(1.08, 0.6, r * 0.02); c.fillStyle = shadeC(col, -0.3); c.fill(); stroke(c, lw);
      hex(1.0, 0.52, -r * 0.1); const g = c.createLinearGradient(0, -r * 0.6, 0, r * 0.4); g.addColorStop(0, shadeC(col, 0.32)); g.addColorStop(0.55, col); g.addColorStop(1, shadeC(col, -0.25)); c.fillStyle = g; c.fill(); stroke(c, lw);
      c.save(); hex(1.0, 0.52, -r * 0.1); c.clip(); c.strokeStyle = 'rgba(10,30,36,.35)'; c.lineWidth = Math.max(1, lw * 0.6); for (const k of [-0.35, 0.1]) { c.beginPath(); c.moveTo(-r * 0.8, k * r - r * 0.05); c.quadraticCurveTo(0, k * r - r * 0.18, r * 0.8, k * r - r * 0.05); c.stroke(); }
        c.fillStyle = 'rgba(226,240,232,.65)'; for (const [x, y, s] of [[-0.45, -0.32, 0.09], [-0.3, -0.25, 0.06], [0.2, -0.38, 0.07], [0.48, -0.15, 0.05]]) { c.beginPath(); c.arc(x * r, y * r, s * r, 0, TAU); c.fill(); }
        c.fillStyle = 'rgba(255,255,255,.18)'; ell(c, -r * 0.2, -r * 0.42, r * 0.5, r * 0.1, -0.1); c.fill(); c.restore();
      // the eye under its front lip: turquoise, bright before a pinch
      const ex = r * 0.82, ey = r * 0.12, ek = 0.55 + 0.45 * raise; addGlow(c, ex, ey, r * (0.35 + 0.35 * raise), BEL.TURQ, 0.55 + 0.4 * raise); c.fillStyle = '#0A1E24'; ell(c, ex, ey, r * 0.16, r * 0.11); c.fill(); c.fillStyle = BEL.TURQ; ell(c, ex, ey, r * 0.12 * (0.8 + 0.3 * ek), r * 0.08 * (0.8 + 0.3 * ek)); c.fill(); c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(ex - r * 0.03, ey - r * 0.03, r * 0.035, 0, TAU); c.fill();
      leg(-r * 0.25, -1, false); leg(r * 0.45, 1, false);
      // the claws: rectangular blocks on short arms; raised (open) in the tell, shut and forward in the pinch
      for (const sd of [-1, 1]) { const back = sd < 0, ax = r * 0.66, ay = sd * r * 0.16 + r * 0.02, lift = raise * r * (back ? 0.7 : 0.5), bx = r * (0.98 + pinch * 0.3) - (back ? r * 0.12 : 0), by = ay - lift - (back ? r * 0.12 : 0), op = raise ? 0.32 : pinch ? 0 : 0.1;
        limb(c, ax, ay, bx - r * 0.1, by, Math.max(2.4, r * 0.17), shadeC(col, back ? -0.3 : -0.08));
        c.save(); c.translate(bx, by); c.rotate(-raise * (back ? 0.75 : 0.5) + (pinch ? 0.05 : 0)); const pw = r * (back ? 0.56 : 0.66), ph2 = r * (back ? 0.44 : 0.5), jl = r * (back ? 0.42 : 0.5), cl0 = back ? '#B8A48E' : '#E2D2B8', cl1 = back ? '#8E7C68' : '#BFAE94';
        // the palm: a squat rectangle; the two jaws: flat rectangles, open in the tell, shut in the pinch
        const pg = c.createLinearGradient(0, -ph2 / 2, 0, ph2 / 2); pg.addColorStop(0, cl0); pg.addColorStop(1, cl1); c.fillStyle = pg; c.fillRect(-pw * 0.4, -ph2 / 2, pw, ph2); c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.strokeRect(-pw * 0.4, -ph2 / 2, pw, ph2);
        c.save(); c.translate(pw * 0.55, -ph2 * 0.22); c.rotate(-op); c.fillStyle = cl0; c.fillRect(0, -ph2 * 0.2, jl, ph2 * 0.36); c.strokeRect(0, -ph2 * 0.2, jl, ph2 * 0.36); c.fillStyle = '#4A2E28'; c.fillRect(jl * 0.75, -ph2 * 0.2, jl * 0.25, ph2 * 0.36); c.restore();
        c.save(); c.translate(pw * 0.55, ph2 * 0.22); c.rotate(op); c.fillStyle = cl1; c.fillRect(0, -ph2 * 0.16, jl * 0.85, ph2 * 0.32); c.strokeRect(0, -ph2 * 0.16, jl * 0.85, ph2 * 0.32); c.fillStyle = '#4A2E28'; c.fillRect(jl * 0.62, -ph2 * 0.16, jl * 0.23, ph2 * 0.32); c.restore();
        c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-pw * 0.3, -ph2 * 0.4, pw * 0.7, Math.max(1, ph2 * 0.12)); c.restore(); }
      if (pinch) { c.strokeStyle = 'rgba(223,255,248,.6)'; c.lineWidth = lw; for (const y of [-0.15, 0.1]) { c.beginPath(); c.moveTo(r * 1.6, y * r); c.lineTo(r * 2.0, y * r); c.stroke(); } } },
    /* the bell leech: a violet teardrop (no eyes), a circular pale mouth at its broad end, a small brass shell ring near its
       tail. 'cling' flattened and pressed (holding a valve); 'spit' swollen, the mouth wide, a droplet forming */
    leech(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', col = o.color || '#6B4FA8', pul = Math.sin(ph * TAU), sp = md === 'spit' ? 1 : 0, cl = md === 'cling' ? 1 : 0, sq = 1 + 0.07 * pul + 0.18 * sp, fl = 1 - 0.25 * cl;
      c.fillStyle = 'rgba(4,14,20,.3)'; ell(c, 0, r * 0.62, r * 1.2, r * 0.22); c.fill();
      c.save(); c.translate(0, r * 0.18 * cl); c.scale(1, fl);
      c.beginPath(); c.moveTo(-r * 1.32, r * 0.1); c.quadraticCurveTo(-r * 0.7, -r * 0.82 * sq, r * 0.32, -r * 0.78 * sq); c.quadraticCurveTo(r * 1.08, -r * 0.5 * sq, r * 1.08, 0); c.quadraticCurveTo(r * 1.08, r * 0.5 * sq, r * 0.32, r * 0.7 * sq); c.quadraticCurveTo(-r * 0.7, r * 0.7 * sq, -r * 1.32, r * 0.1); c.closePath();
      const g = c.createRadialGradient(-r * 0.1, -r * 0.4, r * 0.1, 0, 0, r * 1.3); g.addColorStop(0, shadeC(col, 0.4)); g.addColorStop(0.5, col); g.addColorStop(1, shadeC(col, -0.4)); c.fillStyle = g; c.fill(); stroke(c, lw);
      // its ribbed body, a wet sheen
      c.save(); c.clip(); c.strokeStyle = 'rgba(30,14,50,.35)'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 0; i < 5; i++) { const x = -r * 0.9 + i * r * 0.36; c.beginPath(); c.moveTo(x, -r * 0.9); c.quadraticCurveTo(x + r * 0.1, 0, x, r * 0.9); c.stroke(); } c.fillStyle = 'rgba(255,240,255,.25)'; ell(c, -r * 0.15, -r * 0.42, r * 0.55, r * 0.12, -0.1); c.fill(); c.restore();
      // the brass shell ring near the tail
      c.strokeStyle = LN; c.lineWidth = r * 0.12 + lw; ell(c, -r * 0.82, r * 0.05, r * 0.08, r * 0.3 * sq); c.stroke(); c.strokeStyle = BEL.BRASS; c.lineWidth = r * 0.12; c.stroke(); c.strokeStyle = BEL.BRASS_HI; c.lineWidth = Math.max(0.8, r * 0.04); ell(c, -r * 0.84, 0, r * 0.05, r * 0.24 * sq); c.stroke();
      // the mouth: a pale ring, dark within, a droplet when it spits
      const mo = 0.28 + 0.14 * sp; c.fillStyle = '#F2E8FF'; c.beginPath(); c.arc(r * 0.8, 0, r * mo, 0, TAU); c.fill(); stroke(c, lw * 0.8); c.fillStyle = '#2B1E3A'; c.beginPath(); c.arc(r * 0.82, 0, r * mo * 0.55, 0, TAU); c.fill(); c.strokeStyle = 'rgba(190,160,230,.6)'; c.lineWidth = Math.max(0.8, r * 0.04); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; c.beginPath(); c.moveTo(r * 0.82 + Math.cos(a) * r * mo * 0.6, Math.sin(a) * r * mo * 0.6); c.lineTo(r * 0.82 + Math.cos(a) * r * mo * 0.9, Math.sin(a) * r * mo * 0.9); c.stroke(); }
      if (sp) { c.fillStyle = 'rgba(182,162,240,.9)'; c.beginPath(); c.arc(r * 1.2, -r * 0.05, r * 0.18, 0, TAU); c.fill(); stroke(c, lw * 0.6); addGlow(c, r * 1.2, -r * 0.05, r * 0.45, '#B6A2F0', 0.5); }
      c.restore(); },
    /* the reef lantern: a floating pear of opaque pale-blue shell, three short brass tassels with turquoise beads, an inner
       light that shows through a window in its shell. 'bright' the light swelling (the tell, before a heal); 'pulse' the flash */
    reeflantern(c, r, ph, o) { const lw = lwOf(r), md = o.mode || '', col = o.color || '#A9DCEB', bob = Math.sin(ph * TAU) * r * 0.08, br = md === 'bright' ? 1 : md === 'pulse' ? 1.4 : 0;
      c.fillStyle = 'rgba(4,14,20,.2)'; ell(c, 0, r * 1.15, r * 0.6, r * 0.14); c.fill();
      addGlow(c, 0, bob, r * (1.5 + br * 0.9), '#BFEFFF', 0.18 + 0.4 * br);
      [-0.3, 0, 0.3].forEach((x, i) => { const sw = Math.sin(ph * TAU + i) * r * 0.1; c.strokeStyle = LN; c.lineWidth = lw * 1.8; c.beginPath(); c.moveTo(x * r, r * 0.72 + bob); c.quadraticCurveTo(x * r + sw, r * 1.05 + bob, x * r + sw * 0.6, r * 1.35 + bob); c.stroke(); c.strokeStyle = BEL.BRASS; c.lineWidth = lw; c.stroke(); c.fillStyle = BEL.TURQ; c.beginPath(); c.arc(x * r + sw * 0.6, r * 1.38 + bob, r * 0.08, 0, TAU); c.fill(); });
      c.beginPath(); c.moveTo(0, -r * 1.08 + bob); c.bezierCurveTo(r * 0.5, -r * 1.0 + bob, r * 0.88, -r * 0.2 + bob, r * 0.82, r * 0.3 + bob); c.quadraticCurveTo(r * 0.7, r * 0.82 + bob, 0, r * 0.82 + bob); c.quadraticCurveTo(-r * 0.7, r * 0.82 + bob, -r * 0.82, r * 0.3 + bob); c.bezierCurveTo(-r * 0.88, -r * 0.2 + bob, -r * 0.5, -r * 1.0 + bob, 0, -r * 1.08 + bob); c.closePath();
      const g = c.createRadialGradient(-r * 0.3, -r * 0.45 + bob, r * 0.1, 0, bob, r * 1.1); g.addColorStop(0, '#F2FBFF'); g.addColorStop(0.45, col); g.addColorStop(1, shadeC(col, -0.35)); c.fillStyle = g; c.fill(); stroke(c, lw);
      // the shell's growth lines, the window over its heart, the heart's light
      c.save(); c.clip(); c.strokeStyle = 'rgba(40,90,110,.3)'; c.lineWidth = Math.max(0.8, lw * 0.5); for (let i = 1; i < 4; i++) { c.beginPath(); c.ellipse(0, r * 0.1 + bob, r * 0.9 * i / 3.3, r * 0.95 * i / 3.3, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); } c.restore();
      ell(c, 0, r * 0.15 + bob, r * 0.38, r * 0.42); c.fillStyle = '#1C3A48'; c.fill(); stroke(c, lw * 0.7);
      addGlow(c, 0, r * 0.15 + bob, r * (0.55 + 0.6 * br), '#FFF4C0', 0.55 + 0.45 * br); c.fillStyle = br ? '#FFFBE6' : '#F6E9A8'; ell(c, 0, r * 0.15 + bob, r * (0.2 + 0.08 * br), r * (0.24 + 0.08 * br)); c.fill();
      c.fillStyle = 'rgba(255,255,255,.6)'; ell(c, -r * 0.35, -r * 0.5 + bob, r * 0.14, r * 0.24, 0.4); c.fill();
      if (md === 'pulse') { c.strokeStyle = 'rgba(255,244,192,.8)'; c.lineWidth = lw; c.beginPath(); c.arc(0, r * 0.15 + bob, r * 1.25, 0, TAU); c.stroke(); } },
  });
  Object.assign(EXT, { crawler: 2.5, leech: 1.8, reeflantern: 2.0 });
  Object.assign(NF, { crawler: 6, leech: 4, reeflantern: 6 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    crawler(m, A, X) {
      // the tell: both claws raised (mode 'raise') with a narrow line shown ahead, then the pinch, then a moment to punish
      if (m.pinch > 0) { m.pinch -= A.dt; m.mode = 'raise'; if (m.pinch <= 0) { const a = m.pa; X.slash(m.x + Math.cos(a) * 0.8, m.y + Math.sin(a) * 0.8, a, 0.9, '#9FE8FF'); if (X.inCone(m.x, m.y, a, 1.8, 0.36)) X.hurtPet(m.dmg * 1.3, m); m.mode = 'pinch'; m.recT = 0.7; m.cd = 2.0 + Math.random(); } return; }
      if (m.recT > 0) { m.recT -= A.dt; if (m.recT <= 0) m.mode = ''; return; }
      m.side = m.side || (Math.random() < 0.5 ? 1 : -1); m.sideT = (m.sideT || 0) - A.dt; if (m.sideT <= 0) { m.sideT = 1.1 + Math.random(); m.side *= -1; }
      if (A.d > 1.5) { const sx2 = -A.uy * m.side * 0.6 + A.ux, sy2 = A.ux * m.side * 0.6 + A.uy, n = Math.hypot(sx2, sy2) || 1; X.moveEnt(m, sx2 / n * A.sp * A.dt, sy2 / n * A.sp * A.dt); m.face = A.dx >= 0 ? 1 : -1; m.mode = Math.abs(sx2 / n - A.ux) > 0.3 ? 'side' : ''; }
      else if (m.cd <= 0 && A.los()) { m.pinch = 1.1; m.mode = 'raise'; m.pa = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.pa) >= 0 ? 1 : -1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.pa, len: 1.9, spread: 0.36, life: 1.1, max: 1.1, src: m, color: '#9FE8FF' }); }
      else m.mode = '';
    },
    leech(m, A, X) {
      // held to its spot (clinging); swells, then spits one slow droplet at the pet
      m.face = A.dx >= 0 ? 1 : -1;
      if (m.spitT > 0) { m.spitT -= A.dt; m.mode = 'spit'; if (m.spitT <= 0) { X.lob(m.x, m.y - 0.2, X.me.x, X.me.y, { dur: 1.5, r: 0.8, dmg: m.dmg, kind: 'bubble', src: m, color: '#B6A2F0' }); m.mode = m.holds ? 'cling' : ''; m.cd = 2.8 + Math.random(); } return; }
      m.mode = m.holds ? 'cling' : '';
      if (m.cd <= 0 && A.d < 6.5 && A.los()) { m.spitT = 0.75; }
    },
    reeflantern(m, A, X) {
      // hangs back; brightens (a ring on the floor shows its reach), then heals every monster in it, unless struck meanwhile
      if (m.pulse > 0) { m.pulse -= A.dt; m.mode = 'bright'; if (m.flash > 0.05 && m.pulseHit !== m.flash) { m.pulse = 0; m.cd = 3; m.mode = ''; X.text(m.x, m.y - m.r - 0.5, 'Interrupted!', '#FFFFFF', 12); return; }
        if (m.pulse <= 0) { for (const o of X.mons) { if (o === m || o.dead || o.boss) continue; if (Math.hypot(o.x - m.x, o.y - m.y) < 4.5) { o.hp = Math.min(o.maxhp, o.hp + o.maxhp * 0.25); if (X.healBeam) X.healBeam(m, o); } } X.ring(m.x, m.y, 0.3, 4.5, 0.5, '#FFF4C0', 0.35); m.mode = 'pulse'; m.pulseT = 0.3; m.cd = 4.8 + Math.random(); } return; }
      if (m.pulseT > 0) { m.pulseT -= A.dt; if (m.pulseT <= 0) m.mode = ''; }
      keepRange(m, A, X, 3.5, 6);
      if (m.cd <= 0 && X.mons.some(o => o !== m && !o.dead && !o.boss && o.hp < o.maxhp * 0.9 && Math.hypot(o.x - m.x, o.y - m.y) < 4.5)) { m.pulse = 1.6; m.pulseHit = m.flash; X.warn({ x: m.x, y: m.y, r: 4.5, life: 1.6, max: 1.6, src: m, follow: m, color: '#FFF4C0' }); X.text(m.x, m.y - m.r - 0.6, 'It brightens: hit it!', '#FFF4C0', 12); }
    },
  });
  /* a brood member made by a stage (the rift's numbers; o.swarm a low-health swarm variant, o.aggro, o.pack, o.hpK) */
  BEL.spawn = (X, type, x, y, o) => { o = o || {}; const q = X.freeSpot(x, y, 0.45) || { x, y }; const m = X.spawnMon(type, q.x, q.y, { pack: o.pack || 700, rift: true, aggro: !!o.aggro }); if (!m) return null; if (o.aggro) m.aggro = true;
    if (o.swarm) { m.maxhp = Math.max(1, Math.round(m.maxhp * (o.swarmK || 0.25))); m.hp = m.maxhp; m.swarm = true; m.xp = Math.max(1, Math.round((m.xp || 4) * 0.4)); }
    if (o.hpK) { m.maxhp *= o.hpK; m.hp = m.maxhp; } if (o.dmgK) m.dmg *= o.dmgK; if (o.color) m.color = o.color; if (o.count !== false) X.g.total = (X.g.total || 0) + 1; return m; };

  /* ======================= the old 2D bosses (kept only as the fallback a boss stage plays while its 3D fiend file is
     missing: the stage then puts this boss on a plain arena so the build always plays) ======================= */
  BOSSES.push(
    { id: 'kharrox', rift: true, name: 'Kharrox the Bellback', title: 'Boss of the baptism floor', hp: 10500, dmg: 15, r: 1.45, spd: 1.35, color: '#2F4F8A', glow: '#61D9D2', biome: 'belfry', el: 'frost' },
    { id: 'nhalu', rift: true, name: 'Nhalu the Lantern Eel', title: 'Boss of the submerged nave', hp: 13000, dmg: 14, r: 1.25, spd: 2.4, color: '#3B2F7A', glow: '#FFC857', biome: 'belfry', el: 'spark', fly: true },
    { id: 'uldroth', rift: true, name: 'Uldroth the Drowned Herald', title: 'Herald of the drowned thing', hp: 26000, dmg: 17, r: 1.7, spd: 1.25, color: '#4C6B5A', glow: '#61D9D2', biome: 'belfry', el: 'bubble' });
  const PT = DunBoss.parts;
  Object.assign(DunBoss.P, {
    /* a crab carrying an upside-down bronze bell as its shell: squat, chipped, three bands; six ivory legs; the left
       claw twice the right; a turquoise eye on a stalk through the bell's crack */
    kharrox(c, m, r, t, me, lw) {
      const col = m.bk.color, rock = Math.sin(t * 2.2) * 0.06, raise = m.act === 'sweep' ? Math.min(1, (m.actT || 0) / 1.2) : 0;
      for (let i = 0; i < 3; i++) [-1, 1].forEach(sd => { const bx = (-0.6 + i * 0.6) * r, by = r * 0.55, ex = bx + sd * r * 0.25 + Math.sin(t * 6 + i) * r * 0.05, ey = r * 0.95; PT.limb(c, bx, by, ex, ey, r * 0.16, r * 0.1, '#E7D9B1', { lw }); });
      PT.orb(c, 0, r * 0.3, r * 1.15, r * 0.5, col, { lw, hi: shadeC(col, 0.3) });
      // the bell, mouth up, chipped on one side
      c.save(); c.translate(0, -r * 0.15); c.rotate(rock);
      c.beginPath(); c.moveTo(-r * 0.95, -r * 0.1); c.quadraticCurveTo(-r * 1.0, -r * 0.9, -r * 0.55, -r * 1.25); c.lineTo(r * 0.5, -r * 1.25); c.lineTo(r * 0.62, -r * 1.05); c.lineTo(r * 0.5, -r * 1.2); c.quadraticCurveTo(r * 1.0, -r * 0.9, r * 0.95, -r * 0.1); c.quadraticCurveTo(0, r * 0.2, -r * 0.95, -r * 0.1); c.closePath();
      c.fillStyle = PT.lit ? '#957943' : '#957943'; c.fillStyle = shade(c, '#957943', r, -r * 0.2, -r * 0.6, 0.45); c.fill(); c.strokeStyle = LN; c.lineWidth = lw * 1.3; c.stroke();
      for (let i = 0; i < 3; i++) { const y = -r * (0.35 + i * 0.28), vib = m.act === 'toll' ? Math.sin(t * 40 + i) * r * 0.02 : 0; c.strokeStyle = '#6A5430'; c.lineWidth = lw * 1.1; c.beginPath(); c.moveTo(-r * (0.86 - i * 0.08) + vib, y); c.lineTo(r * (0.86 - i * 0.08) + vib, y); c.stroke(); c.strokeStyle = '#D9B35F'; c.lineWidth = lw * 0.4; c.beginPath(); c.moveTo(-r * 0.6, y - lw * 0.5); c.lineTo(r * 0.3, y - lw * 0.5); c.stroke(); }
      c.strokeStyle = '#2B2433'; c.lineWidth = lw; c.beginPath(); c.moveTo(r * 0.3, -r * 0.6); c.lineTo(r * 0.42, -r * 0.95); c.lineTo(r * 0.3, -r * 1.2); c.stroke();
      c.restore();
      // the eye on its stalk, through the crack
      const ex = r * 0.4, ey = -r * 0.85; PT.limb(c, r * 0.3, -r * 0.3, ex, ey, r * 0.1, r * 0.08, '#E7D9B1', { lw }); PT.eye(c, ex, ey, r * 0.17, { sclera: '#DFFFF8', iris: '#61D9D2', lookX: me.x > m.x ? 1 : -1, lookY: 0, glow: '#61D9D2' });
      // the claws: the left twice the right, raised for a sweep
      [[-1, 1.0], [1, 0.55]].forEach(([sd, k]) => { const ax = sd * r * 0.9, ay = r * 0.25, cx = sd * r * (1.45 + 0.25 * k), cy = r * (0.35 - raise * 0.9 * k); PT.limb(c, ax, ay, cx, cy, r * 0.22 * k, r * 0.16 * k, '#E7D9B1', { lw });
        c.save(); c.translate(cx, cy); c.rotate(sd * (-0.3 - raise * 0.6)); PT.plate(c, 0, 0, r * 0.9 * k, r * 0.5 * k, r * 0.08, '#D8C9A0', { lw }); c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(sd * r * 0.45 * k, 0); c.lineTo(-sd * r * 0.1 * k, 0); c.stroke(); c.restore(); });
    },
    /* an eel of five curved segments tapering to a paddle tail, milk-white below and indigo above, three amber bulbs
       down its spine, a blunt wedge head with a hinged jaw and two whiskers */
    nhalu(c, m, r, t, me, lw) {
      const col = m.bk.color, dir = m.face || 1, sw = Math.sin(t * 5), lit = m.bulb != null ? m.bulb : -1;
      const pts = []; for (let i = 0; i < 6; i++) { const u = i / 5; pts.push([-dir * r * (0.2 + u * 2.6), Math.sin(t * 5 - u * 4) * r * 0.22]); }
      // the tail paddle
      const tl = pts[5]; c.fillStyle = shadeC(col, -0.1); c.beginPath(); c.ellipse(tl[0] - dir * r * 0.3, tl[1], r * 0.45, r * 0.28, 0.3 * sw, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
      for (let i = 4; i >= 0; i--) { const p = pts[i], w = r * (0.55 - i * 0.07); PT.orb(c, p[0], p[1], w * 1.1, w * 0.8, col, { lw, hi: shadeC(col, 0.35) }); c.fillStyle = '#F2F0FF'; c.beginPath(); c.ellipse(p[0], p[1] + w * 0.35, w * 0.8, w * 0.3, 0, 0, TAU); c.fill();
        if (i < 3) { const on = lit === i, a = on ? 0.95 : 0.5; PT.glow(c, p[0], p[1] - w * 0.6, w * (on ? 1.6 : 0.8), '#FFC857', a * 0.6); c.fillStyle = on ? '#FFE9A8' : '#E0A33A'; c.beginPath(); c.arc(p[0], p[1] - w * 0.6, w * 0.3, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.stroke(); } }
      // the head: a blunt wedge, the jaw hinged open for a bite
      const open = m.act === 'bite' ? 0.5 : 0.12; c.save(); c.translate(dir * r * 0.45, 0); c.scale(dir, 1);
      c.beginPath(); c.moveTo(-r * 0.55, -r * 0.5); c.lineTo(r * 0.75, -r * 0.3); c.quadraticCurveTo(r * 0.95, -r * 0.1, r * 0.75, r * 0.05); c.lineTo(-r * 0.55, r * 0.15); c.closePath(); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.4); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
      c.beginPath(); c.moveTo(-r * 0.5, r * 0.1); c.lineTo(r * 0.7, r * 0.1 + open * r); c.lineTo(r * 0.5, r * 0.3 + open * r); c.lineTo(-r * 0.5, r * 0.4); c.closePath(); c.fillStyle = '#F2F0FF'; c.fill(); c.stroke();
      PT.eye(c, r * 0.2, -r * 0.2, r * 0.13, { sclera: '#FFF8E0', iris: '#FFC857', glow: '#FFC857' });
      c.strokeStyle = '#F2F0FF'; c.lineWidth = lw * 0.7; [-1, 1].forEach(sd => { c.beginPath(); c.moveTo(r * 0.8, -r * 0.1); c.quadraticCurveTo(r * 1.2, -r * 0.1 + sd * r * 0.25, r * 1.35, sd * r * 0.1 + sw * r * 0.05); c.stroke(); });
      c.restore();
    },
    /* a pear-shaped amphibious beast on four flippers: a flat anglerfish head with a massive lower jaw, tiny far-set eyes,
       one hooked lure, three ribbed gill fins like a broken crown; slate green, pale below, turquoise throat slits */
    uldroth(c, m, r, t, me, lw) {
      const col = m.bk.color, breath = 1 + 0.05 * Math.sin(t * 1.4), dir = m.face || 1, jaw = m.act === 'jaw' ? Math.min(0.6, (m.actT || 0) * 0.4) : 0.1;
      [[-0.9, 0.6], [0.9, 0.6], [-0.6, 0.85], [0.6, 0.85]].forEach(([x, y], i) => { c.fillStyle = shadeC(col, -0.15); c.beginPath(); c.ellipse(x * r, y * r + Math.sin(t * 2 + i) * r * 0.02, r * 0.5, r * 0.2, x * 0.4, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke(); });
      PT.orb(c, 0, r * 0.1, r * 1.05 * breath, r * 0.9 * breath, col, { lw, hi: shadeC(col, 0.3) });
      c.fillStyle = '#B9C4B8'; c.beginPath(); c.ellipse(0, r * 0.5, r * 0.75 * breath, r * 0.4 * breath, 0, 0, TAU); c.fill();
      for (let i = -1; i <= 1; i++) { PT.glow(c, i * r * 0.28, r * 0.35, r * 0.25, '#61D9D2', 0.5 + 0.3 * Math.sin(t * 3 + i)); c.fillStyle = '#61D9D2'; c.beginPath(); c.ellipse(i * r * 0.28, r * 0.35, r * 0.06, r * 0.2, 0, 0, TAU); c.fill(); }
      // the gill fins behind the head
      for (let i = 0; i < 3; i++) { const a = -1.9 + i * 0.5; c.fillStyle = shadeC(col, 0.1); c.beginPath(); c.moveTo(0, -r * 0.6); c.lineTo(Math.cos(a) * r * 1.1, -r * 0.6 + Math.sin(a) * r * 1.1); c.lineTo(Math.cos(a + 0.3) * r * 0.9, -r * 0.6 + Math.sin(a + 0.3) * r * 0.9); c.closePath(); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke(); }
      // the head: flattened, with the great lower jaw
      c.save(); c.translate(dir * r * 0.25, -r * 0.55); c.scale(dir, 1);
      c.beginPath(); c.ellipse(0, 0, r * 0.95, r * 0.45, 0, 0, TAU); c.fillStyle = shade(c, col, r, 0, -r * 0.2, 0.45); c.fill(); c.strokeStyle = LN; c.lineWidth = lw; c.stroke();
      c.beginPath(); c.moveTo(-r * 0.7, r * 0.15); c.quadraticCurveTo(r * 0.3, r * (0.2 + jaw * 1.2), r * 1.05, r * (0.05 + jaw * 0.6)); c.quadraticCurveTo(r * 0.5, r * 0.35, -r * 0.7, r * 0.15); c.closePath(); c.fillStyle = '#A7B8AE'; c.fill(); c.stroke();
      PT.teeth(c, r * 0.3, r * (0.2 + jaw * 0.5), r * 0.7, r * 0.2, Math.PI + 0.3, TAU - 0.3, 7, r * 0.14, '#F2EFE4', true);
      PT.eye(c, -r * 0.55, -r * 0.15, r * 0.07, { sclera: '#FFFFFF', iris: '#1C2E2A' }); PT.eye(c, r * 0.55, -r * 0.15, r * 0.07, { sclera: '#FFFFFF', iris: '#1C2E2A' });
      c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(r * 0.2, -r * 0.4); c.quadraticCurveTo(r * 0.5, -r * 1.1, r * 0.95, -r * 0.95); c.stroke(); PT.glow(c, r * 0.95, -r * 0.95, r * 0.35, '#9FE8FF', 0.8); c.fillStyle = '#DFFFF8'; c.beginPath(); c.arc(r * 0.95, -r * 0.95, r * 0.1, 0, TAU); c.fill();
      c.restore();
    },
  });
  Object.assign(DunBoss.REACH, { kharrox: 3.4, nhalu: 3.6, uldroth: 3.4 });

  /* ---- how they fight (the stage module holds the arena's valves and water: X.rift) ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.65 : 1); m.actT = 0; m.step = 0; };
  Object.assign(DunAI.boss, {
    kharrox(m, A, X, B) {
      const RT = X.rift && X.rift.self.mod;
      if (m.act === 'move') { A.walk(B.spd * (A.d > 2.6 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; if (m.phase >= 2 && !m.summoned && m.cd <= 0) { m.summoned = true; m.act = 'summon'; m.actT = 0; m.step = 0; return; } return pick(m, X, m.phase >= 2 ? ['sweep', 'toll', 'sweep', 'toll'] : ['sweep', 'toll', 'sweep']); }
      const T = m.actT;
      switch (m.act) {
        case 'sweep': {   // the great claw rises for 2.5 s, then a 120-degree sweep in front: get behind the smaller claw
          if (m.step === 0) { m.step = 1; m.sa = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.sa) >= 0 ? 1 : -1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.sa, len: 4.2, spread: 1.05, life: 2.5, max: 2.5, src: m, color: '#9FE8FF', follow: m, fn: () => { if (X.inCone(m.x, m.y, m.sa, 4.2, 1.05)) X.hurtPet(m.dmg * 1.6, m); X.slash(m.x + Math.cos(m.sa) * 2, m.y + Math.sin(m.sa) * 2, m.sa, 2.6, '#DFFFF8'); X.shake(10, 0.4); X.sfx.crash(); } }); X.say(m, 'Clack.'); }
          if (T > 2.9) done(m, 1.6); break; }
        case 'toll': {   // the bands vibrate, then a widening ring with one opening: walk through it
          if (m.step === 0) { m.step = 1; X.say(m, 'Tolling...'); X.ring(m.x, m.y, 0.3, 1.2, 1.1, '#FFC857', 0.3); }
          if (T > 1.1 && m.step === 1) { m.step = 2; X.ringWave(m.x, m.y, { speed: 3.6, gaps: 1, dmg: m.dmg * 1.3, color: '#957943', life: 2.4, w: 0.5 }); X.shake(8, 0.3); X.sfx.hum(); }
          if (T > 1.6) done(m, 2.2); break; }
        case 'summon': { if (m.step === 0) { m.step = 1; X.say(m, 'Brood, come.'); for (let i = 0; i < 2; i++) { const a = i * Math.PI + 0.8, p = X.walkPoint(m.x + Math.cos(a) * 2.2, m.y + Math.sin(a) * 2.2, m); const c2 = X.spawnMon('crawler', p.x, p.y, { aggro: true, pack: 500 }); X.g.total++; X.sparks(p.x, p.y, '#61D9D2', 10, 5); } } if (T > 1) done(m, 1.4); break; }
        default: done(m, 1);
      }
    },
    nhalu(m, A, X, B) {
      const RT = X.rift && X.rift.self.mod, lanes = RT && RT.lanes;
      if (m.beachT > 0) { m.beachT -= A.dt; m.bulb = -1; if (m.beachT <= 0) { X.say(m, 'It slips back.'); done(m, 1); } return; }
      // swims the lanes: keeps to the water, out of your reach but never far
      if (m.act === 'move') { const ty = lanes ? lanes.yOf(m.lane == null ? (m.lane = 1) : m.lane) : X.me.y; const dx = X.me.x - m.x, dy = ty - m.y, d = Math.hypot(dx, dy) || 1; X.moveEnt(m, dx / d * B.spd * A.dt * (Math.abs(dx) > 3 ? 1 : 0.4), dy / d * B.spd * A.dt, 1); m.face = dx >= 0 ? 1 : -1; m.bulb = -1;
        if (m.cd <= 0 && m.laneT == null) m.laneT = 0; return pick(m, X, m.phase >= 2 ? ['hunt', 'bite', 'hunt'] : ['hunt', 'bite']); }
      const T = m.actT;
      switch (m.act) {
        case 'hunt': {   // a bulb lights and throws its symbol onto the next charged lane: leave it before the discharge
          if (m.step === 0) { m.step = 1; m.bulb = Math.floor(Math.random() * 3); const n = m.phase >= 2 ? 2 : 1, first = lanes ? lanes.laneOf(X.me.y) : 0; m.hunt = [first]; if (n > 1) m.hunt.push((first + 1 + Math.floor(Math.random() * 2)) % 3);
            m.hunt.forEach((ln, i) => { X.after(i * 1.4, () => { if (m.dead || !lanes) return; const y = lanes.yOf(ln); X.warn({ shape: 'line', x: lanes.x0, y, a: 0, len: lanes.len, w: lanes.w, life: 2.5, max: 2.5, src: m, color: '#FFC857', fn: () => { if (X.inLine(lanes.x0, y, 0, lanes.len, lanes.w)) X.hurtPet(m.dmg * 1.7, m); X.beamFx(lanes.x0, y, 0, lanes.len, '#FFE9A8'); X.bolt(lanes.x0 + lanes.len * 0.5, y, '#FFE9A8'); X.sfx.zap && X.sfx.zap(); X.shake(7, 0.3); } }); }); });
            X.say(m, 'Thunderwater.'); }
          if (T > 3.2 + (m.phase >= 2 ? 1.4 : 0)) done(m, 1.8); break; }
        case 'bite': {   // a lunge along its lane at you
          if (m.step === 0) { m.step = 1; m.ba = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'line', x: m.x, y: m.y, a: m.ba, len: 5, w: 1.1, life: 0.8, max: 0.8, src: m, color: '#F2F0FF' }); }
          if (T > 0.8 && T < 1.4) { X.moveEnt(m, Math.cos(m.ba) * 9 * A.dt, Math.sin(m.ba) * 9 * A.dt, 1); m.face = Math.cos(m.ba) >= 0 ? 1 : -1; if (A.d < m.r + X.me.r + 0.2 && m.atkCd <= 0) { X.hurtPet(m.dmg * 1.3, m); m.atkCd = 1; } }
          if (T > 1.6) done(m, 1.6); break; }
        default: done(m, 1);
      }
    },
    uldroth(m, A, X, B) {
      const RT = X.rift && X.rift.self.mod;
      if (RT && RT.bossTick) RT.bossTick(m, A.dt);
      if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.25)); m.face = A.dx >= 0 ? 1 : -1;
        const list = m.phase === 1 ? ['jaw', 'undertow', 'jaw'] : m.phase === 2 ? ['jaw', 'bell', 'undertow', 'bell'] : ['halves', 'jaw', 'halves', 'bell'];
        if (RT && RT.flood > 0 && list.includes('bell')) return pick(m, X, ['jaw', 'undertow']);
        return pick(m, X, list); }
      const T = m.actT;
      switch (m.act) {
        case 'jaw': {   // Jaw of the Deep: a long cone in front, 2.5 s coming
          if (m.step === 0) { m.step = 1; m.ja = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.face = Math.cos(m.ja) >= 0 ? 1 : -1; X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.ja, len: 7, spread: 0.5, life: 2.5, max: 2.5, src: m, color: '#9FE8FF', follow: m, fn: () => { if (X.inCone(m.x, m.y, m.ja, 7, 0.5)) X.hurtPet(m.dmg * 1.8, m); X.beamFx(m.x, m.y, m.ja, 7, '#61D9D2'); X.shake(10, 0.4); X.sfx.crash(); } }); X.say(m, 'Hrrrooom.'); }
          if (T > 2.9) done(m, 1.5); break; }
        case 'undertow': {   // a pull toward it, then a burst at its feet: run outward while the pull is weak
          if (m.step === 0) { m.step = 1; X.warn({ x: m.x, y: m.y, r: 3.2, life: 1.8, max: 1.8, src: m, follow: m, color: '#7FD3F2', fn: () => { if (A.d < 3.2 + X.me.r) X.hurtPet(m.dmg * 2, m); X.boom(m.x, m.y, 3.2, '#7FD3F2', '#FFFFFF', { n: 30, shake: 12 }); X.splash(m.x, m.y, 3); } }); X.say(m, 'Come down...'); }
          if (T < 1.8 && T > 0.2) { const a = Math.atan2(m.y - X.me.y, m.x - X.me.x); X.me.x += Math.cos(a) * 1.3 * A.dt; X.me.y += Math.sin(a) * 1.3 * A.dt; }
          if (T > 2.2) done(m, 1.6); break; }
        case 'bell': {   // Drowning Bell: the water rises; turn the lit valve to raise its refuge and shelter on it
          if (m.step === 0) { m.step = 1; if (RT && RT.drowningBell) RT.drowningBell(m); X.say(m, 'The bell drowns.'); }
          if (T > 1.2) done(m, 3.5); break; }
        case 'halves': {   // half the arena at a time, the marked half
          if (m.step === 0) { m.step = 1; if (RT && RT.halfWave) RT.halfWave(m); X.say(m, 'Break.'); }
          if (T > 1.4) done(m, 2.6); break; }
        default: done(m, 1);
      }
    },
  });

  /* ======================= the stage kit: the running context, shallow water, waves, the Resonance bubble, guardians ======================= */
  const CTX = new WeakMap();
  function ctx(X) { const k = X.g || X; let C = CTX.get(k); if (!C) CTX.set(k, C = { X, t: 0, shallow: [], waves: [], ripples: [], drops: [], calm: 0, calmTo: 0, vista: null, fish: null, guard: null, stat: { swept: 0, splashes: 0, shoves: 0 } }); C.X = X; return C; }
  BEL.ctx = ctx; BEL.calm = X => { const C = X ? ctx(X) : CUR; return C ? C.calm || 0 : 0; };
  /* ---- shallow walkable water ---- */
  function regionPath(c, X, R) { const T = X.Tz();
    if (R.kind === 'ring') { const Xs = X.sx(R.x), Ys = X.sy(R.y); c.moveTo(Xs + R.r1 * T, Ys); c.arc(Xs, Ys, R.r1 * T, 0, TAU); c.moveTo(Xs + R.r0 * T, Ys); c.arc(Xs, Ys, R.r0 * T, 0, TAU, true); }
    else if (R.kind === 'pool') { const Xs = X.sx(R.x), Ys = X.sy(R.y); c.moveTo(Xs + R.r * T, Ys); c.arc(Xs, Ys, R.r * T, 0, TAU); }
    else if (R.kind === 'rect') { const x0 = X.sx(R.x0), y0 = X.sy(R.y0), x1 = X.sx(R.x1), y1 = X.sy(R.y1), rr = Math.min((R.r || 0.4) * T, (x1 - x0) / 2, (y1 - y0) / 2); c.moveTo(x0 + rr, y0); c.arcTo(x1, y0, x1, y1, rr); c.arcTo(x1, y1, x0, y1, rr); c.arcTo(x0, y1, x0, y0, rr); c.arcTo(x0, y0, x1, y0, rr); c.closePath(); }
    else if (R.kind === 'tiles') { const W = X.W(), Hh = X.H(); for (const t of R.tiles) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); if (Xs < -T * 2 || Xs > W + T || Ys < -T * 2 || Ys > Hh + T) continue; const has = (dx, dy) => R.set.has((t.ty + dy) * R.MW + t.tx + dx), rr = T * 0.42, r1 = !has(0, -1) && !has(-1, 0) ? rr : 0, r2 = !has(0, -1) && !has(1, 0) ? rr : 0, r3 = !has(0, 1) && !has(1, 0) ? rr : 0, r4 = !has(0, 1) && !has(-1, 0) ? rr : 0, e = 0.5;
      c.moveTo(Xs + r1 - (r1 ? 0 : e), Ys - e); c.lineTo(Xs + T - r2 + (r2 ? 0 : e), Ys - e); if (r2) c.quadraticCurveTo(Xs + T, Ys, Xs + T, Ys + r2); c.lineTo(Xs + T + e, Ys + T - r3 + (r3 ? 0 : e)); if (r3) c.quadraticCurveTo(Xs + T, Ys + T, Xs + T - r3, Ys + T); c.lineTo(Xs + r4 - (r4 ? 0 : e), Ys + T + e); if (r4) c.quadraticCurveTo(Xs, Ys + T, Xs, Ys + T - r4); c.lineTo(Xs - e, Ys + r1); if (r1) c.quadraticCurveTo(Xs, Ys, Xs + r1, Ys); c.closePath(); } } }
  /* v392 B1: the outer edge of a tile region (the sides with no water beside them), for its line of foam */
  function regionEdge(c, X, R) { const T = X.Tz(), W = X.W(), Hh = X.H(); for (const t of R.tiles) { const Xs = X.sx(t.tx), Ys = X.sy(t.ty); if (Xs < -T * 2 || Xs > W + T || Ys < -T * 2 || Ys > Hh + T) continue; const has = (dx, dy) => R.set.has((t.ty + dy) * R.MW + t.tx + dx), rr = T * 0.42, n = !has(0, -1), so = !has(0, 1), w = !has(-1, 0), e = !has(1, 0);
      if (n) { c.moveTo(Xs + (w ? rr : 0), Ys); c.lineTo(Xs + T - (e ? rr : 0), Ys); } if (so) { c.moveTo(Xs + (w ? rr : 0), Ys + T); c.lineTo(Xs + T - (e ? rr : 0), Ys + T); } if (w) { c.moveTo(Xs, Ys + (n ? rr : 0)); c.lineTo(Xs, Ys + T - (so ? rr : 0)); } if (e) { c.moveTo(Xs + T, Ys + (n ? rr : 0)); c.lineTo(Xs + T, Ys + T - (so ? rr : 0)); }
      if (n && w) { c.moveTo(Xs, Ys + rr); c.quadraticCurveTo(Xs, Ys, Xs + rr, Ys); } if (n && e) { c.moveTo(Xs + T - rr, Ys); c.quadraticCurveTo(Xs + T, Ys, Xs + T, Ys + rr); } if (so && e) { c.moveTo(Xs + T, Ys + T - rr); c.quadraticCurveTo(Xs + T, Ys + T, Xs + T - rr, Ys + T); } if (so && w) { c.moveTo(Xs + rr, Ys + T); c.quadraticCurveTo(Xs, Ys + T, Xs, Ys + T - rr); } } }
  function inRegion(R, x, y) { if (R.kind === 'ring') { const d = Math.hypot(x - R.x, y - R.y); return d >= R.r0 && d <= R.r1; } if (R.kind === 'pool') return Math.hypot(x - R.x, y - R.y) <= R.r; if (R.kind === 'rect') return x >= R.x0 && x <= R.x1 && y >= R.y0 && y <= R.y1; if (R.kind === 'tiles') return R.set.has(Math.floor(y) * R.MW + Math.floor(x)); return false; }
  BEL.shallow = (X, R) => { const C = ctx(X); R = Object.assign({ kind: 'pool' }, R); if (R.kind === 'tiles') { R.MW = X.M.MW; R.set = new Set(R.tiles.map(t => t.ty * R.MW + t.tx)); } C.shallow.push(R); return R; };
  BEL.unshallow = (X, R) => { const C = ctx(X), i = C.shallow.indexOf(R); if (i >= 0) C.shallow.splice(i, 1); };
  BEL.inShallow = (X, x, y) => ctx(X).shallow.some(R => !R.off && inRegion(R, x, y));
  /* the caustic light pattern on the shallows (worked out once, wrapping; added over the water, sliding) */
  window.GAP_EXT.belcaustic = { base: '#000000', paint(c, S, R) { c.clearRect(0, 0, S, S); for (let i = 0; i < 26; i++) { const x = R() * S, y = R() * S, rr = 6 + R() * 16; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.strokeStyle = `rgba(200,255,250,${(0.12 + R() * 0.2).toFixed(2)})`; c.lineWidth = 1 + R() * 1.4; c.beginPath(); c.ellipse(x + ox, y + oy, rr, rr * (0.5 + R() * 0.4), R() * 3, 0, TAU); c.stroke(); } } }, back(c, o) { o.grad('#000000', '#000000'); } };
  function drawShallow(c, X, C) { if (!C.shallow.length) return; const T = X.Tz(), t = C.t; c.save(); c.beginPath(); for (const R of C.shallow) if (!R.off) regionPath(c, X, R);
    c.fillStyle = 'rgba(30,118,142,.34)'; c.fill(); c.clip();
    // a deeper tint toward the middle of broad water; the caustics sliding; a soft shine
    const p = DunWorld.pattern('belcaustic', 1), sc = T * 2.2 / 128; try { p.setTransform(new DOMMatrix([sc, 0, 0, sc, X.sx(0) + t * T * 0.22, X.sy(0) + t * T * 0.09])); } catch (e) {}
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = lowFx() ? 0.25 : 0.36; c.fillStyle = p; c.fillRect(0, 0, X.W(), X.H());
    if (!lowFx()) { try { p.setTransform(new DOMMatrix([sc * 1.3, 0, 0, sc * 1.3, X.sx(0) - t * T * 0.15, X.sy(0) + t * T * 0.05])); } catch (e) {} c.globalAlpha = 0.2; c.fillRect(0, 0, X.W(), X.H()); }
    c.restore();
    // its edge: a soft line of foam (so walkable water reads as water, apart from the opaque sea)
    c.save(); c.beginPath(); for (const R of C.shallow) if (!R.off) (R.kind === 'tiles' ? regionEdge : regionPath)(c, X, R); c.strokeStyle = 'rgba(226,247,242,.5)';   /* v392 B1: a tile region's foam runs along its outer edge only (not round every tile) */ c.lineWidth = Math.max(1.2, T * 0.045); c.stroke(); c.strokeStyle = 'rgba(14,60,74,.35)'; c.lineWidth = Math.max(2, T * 0.1); c.globalCompositeOperation = 'destination-over'; c.stroke(); c.restore();
    // the pet's wake
    for (const r of C.ripples) { const u = r.t / r.life; c.strokeStyle = `rgba(226,247,242,${(0.55 * (1 - u)).toFixed(3)})`; c.lineWidth = Math.max(1, T * 0.035); ell(c, X.sx(r.x), X.sy(r.y), T * (0.25 + u * 0.9), T * (0.1 + u * 0.36)); c.stroke(); } }
  /* ---- the causeway's three low waves: crests sliding across it from the sea (a shove and a splash, never damage) ---- */
  BEL.waves = (X, rect, o) => { const C = ctx(X); o = o || {}; const n = o.n || 3, L = rect.y1 - rect.y0, list = [];
    for (let i = 0; i < n; i++) list.push({ y: rect.y0 + L * (i + 0.5) / n, half: Math.min(2.2, L / n * 0.42), period: 6.5 + i * 0.8, ph: i * 2.3, dir: i % 2 ? -1 : 1, x0: rect.x0 - 1.2, x1: rect.x1 + 1.2, hitAt: -9 });
    C.waves.push(...list); return list; };
  const waveX = (w, t) => { const u = ((t + w.ph) % w.period) / w.period; if (u > 0.55) return null; const k = u / 0.55; return w.dir > 0 ? lerp(w.x0, w.x1, k) : lerp(w.x1, w.x0, k); };
  function wavesTick(X, C, dt) { const me = X.me; for (const w of C.waves) { const x = waveX(w, C.t); if (x == null || me.dead) continue; if (Math.abs(me.y - w.y) < w.half && Math.abs(me.x - x) < 0.45 && C.t - w.hitAt > 1.2 && !me.dodge) { w.hitAt = C.t; C.stat.shoves++; me.push = { vx: w.dir * 3.2, vy: 0, t: 0.28 }; X.splash(me.x, me.y, 1.1); X.text(me.x, me.y - 1.3, 'Splash!', '#DFF6F0', 12); snd(X, 'whoosh'); } } }
  function drawWaves(c, X, C, G) { const T = X.Tz(); for (const w of C.waves) { const x = waveX(w, C.t); if (x == null) continue; const Xs = X.sx(x), y0 = X.sy(w.y - w.half), y1 = X.sy(w.y + w.half); if (Xs < -T * 3 || Xs > X.W() + T * 3 || y1 < -T || y0 > X.H() + T) continue;
      // the sheet of water behind the crest, the crest of foam, spray
      const back = -w.dir * T * 2.6, g = c.createLinearGradient(Xs + back, 0, Xs, 0); g.addColorStop(0, 'rgba(30,110,140,0)'); g.addColorStop(0.55, 'rgba(30,110,140,.38)'); g.addColorStop(0.85, 'rgba(90,190,210,.55)'); g.addColorStop(1, 'rgba(190,245,245,.8)'); c.fillStyle = g;
      c.beginPath(); c.moveTo(Xs, y0); for (let i = 0; i <= 8; i++) { const yy = lerp(y0, y1, i / 8), bow = Math.sin(i / 8 * Math.PI) * T * 0.35 * w.dir; c.lineTo(Xs + bow, yy); } c.lineTo(Xs + back, y1); c.lineTo(Xs + back, y0); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(8,40,52,.45)'; c.lineWidth = Math.max(4, T * 0.2); c.lineCap = 'round'; c.beginPath(); for (let i = 0; i <= 8; i++) { const yy = lerp(y0, y1, i / 8), bow = Math.sin(i / 8 * Math.PI) * T * 0.35 * w.dir + w.dir * T * 0.08; i ? c.lineTo(Xs + bow, yy + T * 0.06) : c.moveTo(Xs + bow, yy + T * 0.06); } c.stroke();
      c.strokeStyle = 'rgba(240,255,252,.95)'; c.lineWidth = Math.max(3, T * 0.13); c.beginPath(); for (let i = 0; i <= 8; i++) { const yy = lerp(y0, y1, i / 8), bow = Math.sin(i / 8 * Math.PI) * T * 0.35 * w.dir + Math.sin(C.t * 9 + i) * T * 0.04; i ? c.lineTo(Xs + bow, yy) : c.moveTo(Xs + bow, yy); } c.stroke();
      if (G) for (let i = 0; i < 4; i++) G.Q.spray(Xs + w.dir * T * 0.2, lerp(y0, y1, (i + 0.5) / 4), T * 0.5, '#E8FBFF', 0.5, i + w.ph * 3, 1.2, 0.6); } }
  /* ---- the Resonance bubble: what the pet carries floats beside it in a sphere of its own resonance (no slot, no slowing) ---- */
  function bubbleArt(c, X, x, y, T, inner, t) { const Xs = X.sx(x), Ys = X.sy(y), r = T * 0.48, bob = Math.sin(t * 3) * T * 0.06, cy = Ys - T * 1.05 + bob;
    c.save(); c.fillStyle = 'rgba(4,14,20,.25)'; ell(c, Xs, Ys + T * 0.05, r * 0.7, r * 0.22); c.fill();
    const G = gpu(c, false); if (G) { G.Q.wsphere(Xs, cy, r, '#7FE8E0', 0.55, 3.1, t * 0.6, 0.35, 0.9); G.Q.glow(Xs, cy, r * 1.6, TURQ, 0.25); gpuEnd(c, G); }
    else { const g = c.createRadialGradient(Xs - r * 0.35, cy - r * 0.4, r * 0.1, Xs, cy, r); g.addColorStop(0, 'rgba(240,255,252,.55)'); g.addColorStop(0.6, 'rgba(97,217,210,.22)'); g.addColorStop(1, 'rgba(97,217,210,.45)'); c.fillStyle = g; c.beginPath(); c.arc(Xs, cy, r, 0, TAU); c.fill(); glow(c, Xs, cy, r * 1.5, TURQ, 0.3); }
    if (inner) inner(c, Xs, cy, r);
    c.strokeStyle = 'rgba(201,255,248,.85)'; c.lineWidth = Math.max(1.2, T * 0.04); c.beginPath(); c.arc(Xs, cy, r, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.arc(Xs, cy, r * 0.78, Math.PI * 1.1, Math.PI * 1.45); c.stroke();
    // the thread of resonance back to the pet
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(97,217,210,.4)'; c.lineWidth = Math.max(1, T * 0.025); c.setLineDash([T * 0.08, T * 0.1]); c.lineDashOffset = -t * T * 0.5; c.beginPath(); c.moveTo(Xs, cy + r); c.quadraticCurveTo(Xs - T * 0.3, Ys - T * 0.3, X.sx(X.me.x), X.sy(X.me.y) - T * 0.5); c.stroke(); c.setLineDash([]); c.restore(); }
  BEL.bubbleArt = bubbleArt;
  /* a brass valve wheel on a pipe (the refuge valves): o.on turned, o.spin its angle, o.locked (a leech or the brood holds it) */
  function wheelArt(c, Xs, Ys, T, o) { const r = T * 0.4, a = o.spin || 0, lw = lw0(T); c.save(); c.translate(Xs, Ys);
    c.fillStyle = 'rgba(4,14,20,.35)'; ell(c, 0, T * 0.1, T * 0.6, T * 0.2); c.fill(); c.fillStyle = '#3A4A50'; c.strokeStyle = LN; c.lineWidth = 1.5; GFX.rr(c, -T * 0.16, -T * 0.6, T * 0.32, T * 0.62, 3); c.fill(); c.stroke();
    c.translate(0, -T * 0.82); if (o.on) glow(c, 0, 0, T * 1.1, TURQ, 0.4 + 0.15 * Math.sin((o.t || 0) * 3)); c.rotate(a); c.strokeStyle = LN; c.lineWidth = r * 0.34; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); c.strokeStyle = o.on ? BRASS_HI : BRASS; c.lineWidth = r * 0.2; c.stroke();
    for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(i * Math.PI / 2) * r, Math.sin(i * Math.PI / 2) * r); c.strokeStyle = LN; c.lineWidth = r * 0.26; c.stroke(); c.strokeStyle = o.on ? BRASS_HI : BRASS; c.lineWidth = r * 0.13; c.stroke(); }
    c.fillStyle = o.on ? TURQ : BRASS; c.beginPath(); c.arc(0, 0, r * 0.24, 0, TAU); c.fill(); c.strokeStyle = LN; c.lineWidth = 1.2; c.stroke(); c.restore();
    if (o.locked && !o.on) { c.save(); c.strokeStyle = o.lockCol || 'rgba(255,77,109,.85)';   /* v394 B1: o.lockCol */ c.lineWidth = Math.max(2, T * 0.06); c.beginPath(); c.arc(Xs, Ys - T * 0.82, r * 1.35, 0, TAU); c.stroke(); c.restore(); } void lw; }
  BEL.wheelArt = wheelArt;
  /* ---- the section guardians: evil Cocopets of the sea and the abyss (worker M's EVIL_MINI, 20zz9) ---- */
  const GUARDS = {
    hall: { name: 'Brinefang the Tidebound', short: 'Brinefang', el: 'water', seed: 77, sub: 'A Cocopet the alien sea has taken guards the raised door', palette: { tint: '#163448', tintK: 0.8, pal: { sec: '#5FD0FF', cheek: '#12324A' }, col: '#4FC8F0', glow: '#2F9ED0', core: '#E8FBFF' }, hint: { tail: 'fish', ears: 'fin' }, hpK: 1 },
    cistern: { name: 'Knellmaw the Hollow Bell', short: 'Knellmaw', el: 'dark', seed: 141, sub: 'An abyss-soured Cocopet stands guard at the lift', palette: { tint: '#1C1630', tintK: 0.85, pal: { sec: '#8E6CF0', cheek: '#24183E' }, col: '#8E6CF0', glow: '#6A48D0', core: '#EBDDFF' }, hint: { horns: 'devil', wings: 'bat' }, hpK: 1.15 },
    tide: { name: 'Undertow the Drowned', short: 'Undertow', el: 'water', seed: 203, sub: 'The drowned Cocopet bars the upper doors', palette: { tint: '#10283A', tintK: 0.88, pal: { sec: '#3FB8E8', cheek: '#0C2234' }, col: '#3FB8E8', glow: '#2A7FC0', core: '#D8F6FF' }, hint: { tail: 'fish', wings: 'bat' }, hpK: 1.3 },
  };
  BEL.GUARDS = GUARDS;
  const EM = () => { try { return (typeof self !== 'undefined' && self.EVIL_MINI) || null; } catch (e) { return null; } };
  /* set the section's guardian at (x, y) guarding gate { x, y }; its layer runs from everyStage. Falls back to the engine's
     own Rift-touched lesser boss when worker M's module is not there */
  function placeGuard(X, key, x, y, gate, o) {   /* v394 B1: o.hpMin (a dungeon's guardian never weaker than its pack leaders) */ const C = ctx(X), d = GUARDS[key]; if (!d || C.guard) return C.guard ? C.guard.m : null; let m = null; const E = EM();
    if (E && E.spawn) { try { const lvl = (X.F && X.F.n) || 10, hp = E.hpFor ? E.hpFor(lvl) : null, dmg = E.dmgFor ? E.dmgFor(lvl) : null;
        m = E.spawn(X, { x, y, home: { x, y }, gate, el: d.el, seed: d.seed, palette: d.palette, hint: d.hint, name: d.name, short: d.short, sub: d.sub, lvl, hp: hp ? Math.round(hp * d.hpK) : undefined, dmg: dmg || undefined, wakeR: 8.5, leash: 15 });
        if (m && !C.layer && E.layer) C.layer = E.layer(X); } catch (e) { try { console.warn('bel guard', e); } catch (e2) {} m = null; } }
    if (!m) { const B2 = BOSSES.find(b => b.id === 'kharrox'); m = X.lesserBoss(x, y, 0.35, '', B2); if (m && typeof RiftEvil !== 'undefined') { const Ev = RiftEvil.make(d.seed * 7919 >>> 0, null); m.evil = Ev; m.glow = d.palette.col; } if (m) { m.bname = d.name; m.aggro = false; } }
    if (m && o && o.hpMin > m.maxhp) { m.maxhp = m.hp = Math.round(o.hpMin); }
    if (m) { m.belGuard = key; C.guard = { m, key, def: d, gate, home: { x, y } }; }
    return m; }
  BEL.placeGuard = placeGuard;
  const guardDown = X => { const G = ctx(X).guard; return !G || !G.m || G.m.dead; };
  BEL.guardDown = guardDown;

  /* ======================= stage layouts: a small grid builder (layout coords; world = layout + 1, a tile's centre + 1.5) ======================= */
  const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
  const rect = (g, x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (g[y] && g[y][x] != null) g[y][x] = ch; };
  const disc = (g, cx, cy, r, ch, ry) => { for (let y = 0; y < g.length; y++) for (let x = 0; x < g[0].length; x++) if (((x + 0.5 - cx) / r) ** 2 + ((y + 0.5 - cy) / (ry || r)) ** 2 < 1) g[y][x] = ch; };
  const put = (g, x, y, ch) => { if (g[y] && g[y][x] != null) g[y][x] = ch; };
  const rows = g => g.map(r => r.join(''));
  const Wp = (x, y) => ({ x: x + 1.5, y: y + 1.5 });
  const mk1 = (X, ch) => X.M.marks[ch] && X.M.marks[ch][0];

  /* ======================= SECTION 2: THE CLAPPER COUNTERWEIGHTS =======================
     After Kharrox a broken bell drops through the floor and opens a short ramp down into a dry maintenance cistern: two
     great scale pans hang from a brass beam, a barred lift waits in the east wall, three squat clappers (one, two and three
     rings) lie about, and blue water moves behind the far wall's open arches. Load both pans to exactly three: the
     three-ring clapper alone on one, the one and the two together on the other. The pet lifts a clapper into a Resonance
     bubble at its side (stand at it a moment), and sets it on a pan the same way; standing at a pan with nothing carried
     takes its top clapper back off. The one- and two-ring clappers sit behind three crawlers and a lantern; two leeches hold
     the three-ring clapper to its rack; a final pair of crawlers climbs from the drains when the first pan reads three.
     Both needles at three and the pair down: the lift's bars rise; its guardian (an evil Cocopet) must fall before it
     carries the pet up into the nave. */
  const CLAP_G = (() => { const g = grid(38, 33, '#');
    rect(g, 16, 1, 21, 6, '.'); rect(g, 3, 7, 34, 24, '.'); for (const [x, y] of [[3, 7], [34, 7], [3, 24], [34, 24]]) put(g, x, y, '#'); rect(g, 35, 18, 36, 22, '.');
    // the far wall's open arches (south), the sea behind them
    for (let x = 3; x <= 34; x++) put(g, x, 25, (x - 3) % 4 === 0 ? '#' : '~'); rect(g, 1, 26, 36, 31, '~');
    put(g, 18, 2, 'S'); put(g, 13, 13, 'L'); put(g, 25, 13, 'R'); put(g, 6, 11, '1'); put(g, 6, 15, '2'); put(g, 9, 13, 'a'); put(g, 31, 10, '3'); put(g, 13, 20, 'g'); put(g, 25, 20, 'g'); put(g, 36, 20, 'E'); put(g, 32, 20, 'G');
    // dressing on the walls: the fallen bell by the ramp, columns, ribs, pipes, lamps, moulds, coral
    for (const [x, y, ch] of [[15, 3, 'Q'], [22, 4, 'U'], [5, 6, 'C'], [10, 6, 'O'], [27, 6, 'O'], [31, 6, 'C'], [2, 10, 'I'], [2, 17, 'P'], [2, 21, 'N'], [35, 9, 'P'], [35, 13, 'I'], [35, 16, 'N'], [37, 24, 'Z'], [15, 6, 'N'], [22, 6, 'N']]) put(g, x, y, ch);
    for (let x = 7; x <= 31; x += 8) put(g, x, 25, 'U');
    return rows(g); })();
  const CLAP_LEGEND = Object.assign({}, PROP_LEGEND, { L: {}, R: {}, 1: {}, 2: {}, 3: {}, E: {}, G: {}, g: {}, a: { mons: ['crawler', 'crawler', 'crawler', 'reeflantern'] } });
  /* a clapper: a squat tapered bronze cylinder, its weight in engraved rings */
  function clapperArt(c, Xs, Ys, T, n, k) { const r = T * 0.26 * (k || 1), lw = lw0(T); c.save(); c.translate(Xs, Ys); c.fillStyle = 'rgba(4,14,20,.3)'; ell(c, 0, r * 0.4, r * 1.4, r * 0.4); c.fill();
    c.beginPath(); c.moveTo(-r * 0.62, -r * 1.7); c.lineTo(r * 0.62, -r * 1.7); c.lineTo(r * 1.0, 0); c.quadraticCurveTo(0, r * 0.35, -r * 1.0, 0); c.closePath(); const g = c.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, '#5A4320'); g.addColorStop(0.35, '#D2AE62'); g.addColorStop(0.6, BRASS); g.addColorStop(1, '#3A2A12'); c.fillStyle = g; c.fill(); ink(c, lw);
    ell(c, 0, -r * 1.7, r * 0.62, r * 0.2); c.fillStyle = '#B08C48'; c.fill(); ink(c, lw * 0.7);
    for (let i = 0; i < n; i++) { const y = -r * (0.45 + i * 0.42), hw = lerp(r * 0.95, r * 0.65, (i + 0.5) / 3.2); c.strokeStyle = '#3A2A12'; c.lineWidth = Math.max(1.4, r * 0.16); c.beginPath(); c.moveTo(-hw, y); c.quadraticCurveTo(0, y + r * 0.1, hw, y); c.stroke(); c.strokeStyle = 'rgba(255,236,170,.6)'; c.lineWidth = Math.max(0.7, r * 0.05); c.beginPath(); c.moveTo(-hw * 0.8, y - r * 0.08); c.quadraticCurveTo(0, y + r * 0.02, hw * 0.4, y - r * 0.06); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-r * 0.5, -r * 1.55, r * 0.14, r * 1.3); c.restore(); }
  BEL.clapperArt = clapperArt;
  function makeClappers(X, self, H) {
    const M = X.M, mk = M.marks, me = X.me, C = ctx(X), WANT = 3, T0 = () => X.Tz();
    const pans = ['L', 'R'].map((ch, i) => ({ i, x: mk[ch][0].x, y: mk[ch][0].y, items: [], w: 0, shown: 0, vel: 0, flash: 0 }));
    const beam = { x0: pans[0].x - 2.6, x1: pans[1].x + 2.6, y: pans[0].y - 3.2 };
    let carrying = null, finalPair = null, liftOpen = false, liftK = 0, firstPan = false, msgT = 0;
    const R = { pans, get carrying() { return carrying; }, get liftOpen() { return liftOpen; }, get finalPair() { return finalPair; }, places: 0, removes: 0 };
    // the clappers on the floor
    const claps = [1, 2, 3].map(n => { const p = mk[String(n)][0]; return H.obj({ x: p.x, y: p.y, kind: 'clapper', n, where: 'floor', home: { x: p.x, y: p.y }, r: 0.9, h: 1.3,
      label: o => (o.where !== 'floor' ? '' : n === 3 && held(o) ? 'Clapper · 3 rings (two leeches hold it)' : `Clapper · ${n} ring${n > 1 ? 's' : ''}: lift it`),
      draw(c, Xs, Ys, T, o) { if (o.where !== 'floor') return; if (n === 3) rackArt(c, Xs, Ys, T); clapperArt(c, Xs, Ys - (n === 3 ? T * 0.15 : 0), T, n); if (o === hintObj()) glow(c, Xs, Ys - T * 0.4, T * 0.9, GOLD, 0.25 + 0.1 * Math.sin(C.t * 5)); },
      use(o) { if (o.where !== 'floor') return; if (carrying) { X.text(me.x, me.y - 1.4, 'The bubble holds one clapper at a time', '#FFFFFF', 12); snd(X, 'wrong'); return; }
        if (n === 3 && held(o)) { X.text(o.x, o.y - 1.6, 'The leeches hold it to the rack!', '#B6A2F0', 13); snd(X, 'wrong'); return; }
        o.where = 'bubble'; carrying = o; X.ring(o.x, o.y, 0.2, 1.4, 0.4, TURQ, 0.3); X.text(me.x, me.y - 1.5, `Resonance: the ${n}-ring clapper rises into the bubble`, '#C9FFF8', 12); snd(X, 'chirp'); } }); });
    const held = o => X.mons.some(m => !m.dead && m.type === 'leech' && m.belHold === o);
    const rackP = mk['3'][0];
    // two leeches clinging to the rack
    [[-0.95, -0.15], [0.95, 0.2]].forEach(([dx, dy]) => { const m = BEL.spawn(X, 'leech', rackP.x + dx, rackP.y + dy, { pack: 520 }); if (m) { m.belHold = claps[2]; m.holds = true; m.x = rackP.x + dx; m.y = rackP.y + dy; } });
    H.spawnPacks(); X.g.total = X.mons.filter(m => !m.boss).length;
    // the pans: interacting places what the bubble carries, or takes the top clapper back off
    const panObjs = pans.map(P => H.obj({ x: P.x, y: P.y, kind: 'pan', i: P.i, r: 1.25, h: 3.4, label: () => (carrying ? `${P.i ? 'EAST' : 'WEST'} PAN: set the ${carrying.n}-ring clapper here` : P.items.length ? `${P.i ? 'EAST' : 'WEST'} PAN · ${P.w}/${WANT} · take the top clapper off` : `${P.i ? 'EAST' : 'WEST'} PAN · ${P.w}/${WANT}`),
      draw(c, Xs, Ys, T) { panArt(c, Xs, Ys, T, P); },
      use() { if (liftOpen) return; if (carrying) { const cl = carrying; carrying = null; cl.where = 'pan' + P.i; P.items.push(cl); P.w += cl.n; P.flash = 1; R.places++; X.text(P.x, P.y - 3.0, `+${cl.n}`, '#FFE9A8', 15); snd(X, 'chirp'); X.ring(P.x, P.y, 0.3, 1.6, 0.4, BRASS_HI, 0.3);
          if (P.w === WANT && !firstPan) { firstPan = true; X.after(0.8, spawnPair); }
          else if (P.w > WANT) { X.text(P.x, P.y - 3.6, `Too heavy: ${P.w} of ${WANT}`, '#FF9BD2', 13); snd(X, 'wrong'); } }
        else if (P.items.length) { const cl = P.items.pop(); P.w -= cl.n; cl.where = 'bubble'; carrying = cl; P.flash = 1; R.removes++; X.text(P.x, P.y - 3.0, `−${cl.n}: back in the bubble`, '#FFFFFF', 12); snd(X, 'boop'); } } }));
    function spawnPair() { finalPair = []; X.banner('A PAN READS THREE', 'Two crawlers climb out of the drains', '#FFE9A8', 2.4, true); for (const p of mk.g) { const m = BEL.spawn(X, 'crawler', p.x, p.y, { aggro: true, pack: 530 }); if (m) finalPair.push(m); X.splash(p.x, p.y, 1.4); X.sparks(p.x, p.y, TURQ, 10, 5); } snd(X, 'crash'); }
    // the lift (east), its bars, and its guardian
    const E = mk.E[0], liftObj = H.obj({ x: E.x - 0.9, y: E.y + 0.6, kind: 'lift', r: 0.1, h: 3.4, label: '', draw(c, Xs, Ys, T) { liftArt(c, X.sx(E.x - 0.9), X.sy(E.y + 0.6), T, liftK, liftOpen); } }); void liftObj;
    H.setExit(E.x, E.y, 'The lift');
    const gp = mk.G[0]; placeGuard(X, 'cistern', gp.x, gp.y, { x: E.x, y: E.y });
    X.after(1.6, () => X.banner('THE CLAPPER COUNTERWEIGHTS', 'Load both pans to exactly three: lift a clapper, set it on a pan', BRASS_HI, 3.0, true, true));
    // what to do next: the plan follows what is already on the pans (the three alone on one, the one and two on the other)
    function panFor(n) { const p3 = pans.find(P => P.items.some(o => o.n === 3)), p12 = pans.find(P => P.items.some(o => o.n !== 3)); if (n === 3) return p12 ? pans[1 - p12.i] : pans.find(P => !P.items.length) || pans[0]; return p3 ? pans[1 - p3.i] : p12 || pans[1]; }
    function wrongPan() { return pans.find(P => P.w > WANT || (P.items.some(o => o.n === 3) && P.items.length > 1)); }
    function hintObj() { if (liftOpen) return guardDown(X) ? null : (C.guard && C.guard.m) || null; const bad = wrongPan(); if (bad && !carrying) return panObjs[bad.i]; if (carrying) return panObjs[panFor(carrying.n).i];
      const next = [3, 1, 2].map(n => claps[n - 1]).find(o => o.where === 'floor' && !(o.n === 3 && held(o))) || claps.find(o => o.where === 'floor'); if (next) return next.n === 3 && held(next) ? X.mons.find(m => !m.dead && m.belHold === next) || next : next; return null; }
    const ok = () => pans[0].w === WANT && pans[1].w === WANT;
    const rig = { k: 0, zoom: 1, x: 0, y: 0 };
    return { R, claps, pans: panObjs, beam,
      hint: hintObj,
      update(dt) { C.t = C.t || 0; for (const P of pans) { P.vel += ((P.w - P.shown) * 28 - P.vel * 7) * dt; P.shown += P.vel * dt; P.flash = Math.max(0, P.flash - dt * 1.5); }
        if (!liftOpen && ok() && finalPair && finalPair.every(m => m.dead)) { liftOpen = true; X.banner('THE LIFT UNLOCKS', `Both needles read ${WANT}: the bars rise`, SAFE, 2.6, true); X.flash(0.25, '#FFE9A8'); snd(X, 'fanfare'); X.shake(4, 0.4); }
        if (liftOpen) liftK = Math.min(1, liftK + dt / 1.6);
        if (!self.done && liftOpen && guardDown(X)) { self.done = true; X.banner('THE WAY UP', 'Step onto the lift', SAFE, 2.2, true); }
        // the camera eases out to frame both pans while the pet works them
        const dc = Math.hypot(me.x - (beam.x0 + beam.x1) / 2, me.y - beam.y - 3), want = !liftOpen && dc < 10;
        rig.k = clamp(rig.k + (want ? dt : -dt) / 0.7, 0, 1); rig.x = lerp(me.x, (beam.x0 + beam.x1) / 2, 0.45); rig.y = lerp(me.y, beam.y + 3.2, 0.45); rig.zoom = want ? 0.84 : 1;
        if (msgT > 0) msgT -= dt; },
      cam: () => (rig.k > 0.01 ? { x: rig.x, y: rig.y, k: sm(rig.k), zoom: rig.zoom } : null),
      goal() { const pw = `West ${pans[0].w}/${WANT} · East ${pans[1].w}/${WANT}`; if (self.done) return 'The lift is open · step onto it';
        if (liftOpen) return `Defeat ${GUARDS.cistern.short} to use the lift`;
        if (ok()) return finalPair && finalPair.some(m => !m.dead) ? `Both pans read ${WANT} · beat the drain crawlers` : `Both pans read ${WANT}`;
        const bad = wrongPan(); if (bad && !carrying) return `${bad.i ? 'East' : 'West'} pan is off: stand at it to take a clapper back · ${pw}`;
        if (carrying) return `Set the ${carrying.n}-ring clapper on the ${panFor(carrying.n).i ? 'EAST' : 'WEST'} pan · ${pw}`;
        const h = hintObj(); if (h && h.type === 'leech') return `Pull the leeches off the rack · ${pw}`; return `Lift a clapper into your bubble (arrow) · ${pw}`; },
      drawGround(c) { const T = T0(); // the beam and its posts over the pans (drawn on the ground layer, behind)
        const xa = X.sx(beam.x0), xb = X.sx(beam.x1), yb = X.sy(beam.y); c.save(); for (const x of [xa, xb]) { c.fillStyle = '#2E3A3E'; c.fillRect(x - T * 0.22, yb, T * 0.44, X.sy(pans[0].y + 0.6) - yb); c.strokeStyle = LN; c.lineWidth = 1.5; c.strokeRect(x - T * 0.22, yb, T * 0.44, X.sy(pans[0].y + 0.6) - yb); }
          brassBand(c, xa - T * 0.4, xb + T * 0.4, yb - T * 0.32, T * 0.36); label(c, `${WANT}`, (xa + xb) / 2, yb - T * 0.42, T * 0.5, BRASS_HI); c.restore();
          // the drains the pair climbs out of
          for (const p of mk.g) { const Xs = X.sx(p.x), Ys = X.sy(p.y); c.fillStyle = '#0E1A1E'; ell(c, Xs, Ys, T * 0.6, T * 0.32); c.fill(); c.strokeStyle = BRASS; c.lineWidth = Math.max(1.5, T * 0.06); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(Xs + i * T * 0.2, Ys - T * 0.26); c.lineTo(Xs + i * T * 0.2, Ys + T * 0.26); c.stroke(); } ell(c, Xs, Ys, T * 0.6, T * 0.32); c.stroke(); } },
      drawOver(c) { const T = T0(); if (carrying) bubbleArt(c, X, me.x + 0.75 * (me.face || 1) * -1, me.y, T, (c2, x, y, r) => clapperArt(c2, x, y + r * 0.45, T, carrying.n, 0.85), C.t);
        // the target engraved over both pans, and each needle's dial
        for (const P of pans) dialArt(c, X.sx(P.x), X.sy(P.y) - T * 2.55, T, P, WANT); } };
    /* the rack the three-ring clapper rests on */
    function rackArt(c, Xs, Ys, T) { c.fillStyle = '#3A3020'; c.fillRect(Xs - T * 0.7, Ys - T * 0.1, T * 1.4, T * 0.22); c.strokeStyle = LN; c.lineWidth = 1.5; c.strokeRect(Xs - T * 0.7, Ys - T * 0.1, T * 1.4, T * 0.22); for (const sd of [-1, 1]) { c.fillStyle = BRASS_D; c.fillRect(Xs + sd * T * 0.62 - T * 0.06, Ys - T * 1.0, T * 0.12, T * 1.0); } }
    /* a scale pan: a broad brass dish on three chains, sinking with its load, the clappers on it */
    function panArt(c, Xs, Ys, T, P) { const dip = P.shown * T * 0.11, py = Ys - T * 0.35 + dip, top = X.sy(beam.y) + T * 0.05, r = T * 1.05, lw = lw0(T);
      c.fillStyle = 'rgba(4,14,20,.3)'; ell(c, Xs, Ys + T * 0.2, r * 1.05, r * 0.34); c.fill();
      c.strokeStyle = '#2A2618'; c.lineWidth = Math.max(1.5, T * 0.05); for (const dx of [-0.8, 0, 0.8]) { c.beginPath(); c.moveTo(Xs, top + T * 0.2); c.lineTo(Xs + dx * r, py - T * 0.05); c.stroke(); }
      c.fillStyle = BRASS_D; c.fillRect(Xs - T * 0.1, top, T * 0.2, T * 0.3);
      ell(c, Xs, py + T * 0.12, r, r * 0.36); c.fillStyle = '#4A3A1C'; c.fill(); ink(c, lw); ell(c, Xs, py, r, r * 0.34); const g = c.createLinearGradient(Xs - r, 0, Xs + r, 0); g.addColorStop(0, '#6E5730'); g.addColorStop(0.4, BRASS_HI); g.addColorStop(1, '#5A4626'); c.fillStyle = g; c.fill(); ink(c, lw);
      ell(c, Xs, py, r * 0.78, r * 0.25); c.fillStyle = 'rgba(40,30,12,.35)'; c.fill();
      P.items.forEach((o, i) => clapperArt(c, Xs + (i - (P.items.length - 1) / 2) * T * 0.62, py + T * 0.08, T, o.n, 0.8));
      if (P.flash > 0) glow(c, Xs, py, r * 1.4, BRASS_HI, 0.35 * P.flash); }
    /* the needle's dial over a pan: a face from 0 to 6, the target 3 engraved and lit, the needle springing to the load */
    function dialArt(c, Xs, Ys, T, P, want) { const r = T * 0.62, lw = lw0(T), val = clamp(P.shown, -0.4, 6.4), a0 = Math.PI * 0.8, a1 = Math.PI * 2.2, ang = lerp(a0, a1, val / 6), good = P.w === want, over = P.w > want;
      c.save(); c.fillStyle = '#1C2A2E'; c.beginPath(); c.arc(Xs, Ys, r * 1.12, 0, TAU); c.fill(); ink(c, lw); c.fillStyle = '#E8E2C8'; c.beginPath(); c.arc(Xs, Ys, r, 0, TAU); c.fill();
      // the target band
      const at = lerp(a0, a1, want / 6); c.strokeStyle = good ? SAFE : 'rgba(97,217,210,.8)'; c.lineWidth = r * 0.22; c.beginPath(); c.arc(Xs, Ys, r * 0.78, at - 0.16, at + 0.16); c.stroke();
      c.strokeStyle = '#3A3020'; c.lineWidth = Math.max(1, r * 0.06); for (let i = 0; i <= 6; i++) { const a = lerp(a0, a1, i / 6); c.beginPath(); c.moveTo(Xs + Math.cos(a) * r * 0.86, Ys + Math.sin(a) * r * 0.86); c.lineTo(Xs + Math.cos(a) * r * (i === want ? 0.55 : 0.7), Ys + Math.sin(a) * r * (i === want ? 0.55 : 0.7)); c.stroke(); }
      c.font = `900 ${Math.round(r * 0.42)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#3A3020'; c.fillText(String(want), Xs + Math.cos(at) * r * 0.36, Ys + Math.sin(at) * r * 0.36 + r * 0.02);
      c.strokeStyle = over ? WARN : '#8A1E14'; c.lineWidth = Math.max(1.5, r * 0.1); c.lineCap = 'round'; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs + Math.cos(ang) * r * 0.82, Ys + Math.sin(ang) * r * 0.82); c.stroke(); c.fillStyle = BRASS; c.beginPath(); c.arc(Xs, Ys, r * 0.14, 0, TAU); c.fill(); ink(c, lw * 0.6);
      c.restore(); label(c, `${P.w} / ${want}${good ? ' ✓' : ''}`, Xs, Ys + r * 1.75, T * 0.32, good ? SAFE : over ? '#FF9BD2' : '#FFFFFF'); }
    /* the barred lift: a brass cage platform in the east wall; its bars slide up when it unlocks */
    function liftArt(c, Xs, Ys, T, k, open) { const w = T * 1.8, h = T * 2.6, lw = lw0(T); c.save(); c.fillStyle = 'rgba(4,14,20,.4)'; ell(c, Xs, Ys + T * 0.1, w * 0.7, T * 0.3); c.fill();
      c.fillStyle = '#2A3236'; c.fillRect(Xs - w / 2, Ys - T * 0.25, w, T * 0.3); ink(c, lw); c.strokeStyle = BRASS; c.lineWidth = Math.max(2, T * 0.08); c.strokeRect(Xs - w / 2, Ys - h, w, h - T * 0.2);
      c.beginPath(); c.rect(Xs - w / 2, Ys - h, w, h); c.clip(); const lift = k * h * 0.95; c.strokeStyle = LN; c.lineWidth = Math.max(3, T * 0.12); for (let i = 0; i <= 6; i++) { const x = Xs - w / 2 + i * w / 6; c.beginPath(); c.moveTo(x, Ys - h - lift); c.lineTo(x, Ys - T * 0.2 - lift); c.stroke(); } c.strokeStyle = open ? BRASS_HI : BRASS; c.lineWidth = Math.max(1.5, T * 0.06); for (let i = 0; i <= 6; i++) { const x = Xs - w / 2 + i * w / 6; c.beginPath(); c.moveTo(x, Ys - h - lift); c.lineTo(x, Ys - T * 0.2 - lift); c.stroke(); }
      c.restore(); if (!open) label(c, 'LIFT · LOCKED', Xs, Ys - h - T * 0.25, T * 0.26, '#FFD9C8'); }
  }
  const CLAPPERS = { name: 'The Clapper Counterweights', biome: 'belcistern', guard: 'cistern', vista: { x: 19, y: 40 }, goal: 'Balance both scale pans at exactly three weight units, then take the lift',
    how: 'Stand at a clapper to lift it into a Resonance bubble beside your pet; stand at a scale pan to set it down (or, carrying nothing, to take the top clapper back off). Each pan must read 3: the three-ring clapper alone on one, the one- and two-ring clappers together on the other. Leeches hold the three-ring clapper to its rack. The lift unlocks when both needles read three and the drain crawlers are beaten; its guardian must fall.',
    layout: CLAP_G, legend: CLAP_LEGEND, make: makeClappers };

  /* ======================= SECTION 3: THE RISING TIDE WALK =======================
     Nhalu's fall releases a staircase inside the tower: a broad ramp climbs past three refuge landings, each framed by a
     broken stone arch, the sea showing through wide gaps on both sides, the bell platform visible above the final turn.
     A three-stage tide advances up the ramp. Cross the marked line at the foot and the first surge is timed: reach the
     next landing, clear what holds it (two crawlers; a leech on the valve and a lantern; three crawlers) and stand at its
     refuge valve before the surge. Turquoise warning lines crawl up the balustrades and the surge's reach is marked on the
     floor (a bright edge, a countdown, a wave symbol) in its last seconds. Each landing has a permanently dry shelf (a raised
     ledge) where the pet can shelter. A surge that catches the pet below its reach (and off a shelf) carries it back to the
     last secured landing with damage; secured valves stay secured, and the water below them stays risen (calm, walkable).
     All three secured, the upper doors open; their guardian (an evil Cocopet) must fall. About forty-five seconds of tide. */
  const TIDE_LEGS = [16, 15, 14];
  const TIDE_G = (() => { const W = 25, Hh = 74, g = grid(W, Hh, '~');
    rect(g, 8, 6, 16, 70, '.'); rect(g, 6, 63, 18, 71, '.'); put(g, 12, 69, 'S');
    const LAND = [[50, 55, 'e'], [32, 37, 'w'], [14, 19, 'e']];
    LAND.forEach(([y0, y1, sd], i) => { rect(g, 5, y0, 19, y1, '.'); if (sd === 'e') rect(g, 20, y0 + 1, 22, y0 + 3, 'D'); else rect(g, 2, y0 + 1, 4, y0 + 3, 'D');
      put(g, sd === 'e' ? 18 : 6, y0 + 4, 'v'); put(g, 4, y0 - 1, 'A'); put(g, 20, y0 - 1, 'B');
      put(g, 12, y0 + 2, ['h', 'j', 'k'][i]); });
    // the upper doors and the last short flight
    rect(g, 6, 1, 18, 7, '.'); for (let x = 5; x <= 19; x++) put(g, x, 0, '#'); put(g, 12, 2, 'E'); put(g, 12, 5, 'G'); put(g, 5, 1, '#'); put(g, 19, 1, '#'); put(g, 5, 2, 'C'); put(g, 19, 2, 'C');
    // balustrade stubs with broken railings, columns standing in the sea, upward falls, lamps
    for (let y = 9; y <= 66; y += 6) { if (LAND.some(([y0, y1]) => y >= y0 - 2 && y <= y1 + 2)) continue; put(g, 7, y, 'J'); if (!LAND.some(([y0, y1]) => y + 3 >= y0 - 2 && y + 3 <= y1 + 2)) put(g, 17, y + 3, 'J'); }
    for (const [x, y, ch] of [[2, 60, 'C'], [22, 45, 'C'], [1, 26, 'C'], [23, 10, 'C'], [3, 44, 'F'], [21, 27, 'F'], [22, 62, 'Z'], [2, 9, 'Z'], [5, 64, 'N'], [19, 64, 'N'], [7, 42, 'N'], [17, 24, 'N']]) put(g, x, y, ch);
    for (let x = 0; x < W; x++) { put(g, x, Hh - 1, '~'); put(g, x, Hh - 2, x >= 6 && x <= 18 ? '#' : '~'); }
    return rows(g); })();
  if (!PROPS.belarchr) { PROPS.belarchl = (c, T, v) => belarch(c, T, 0); PROPS.belarchr = (c, T, v) => belarch(c, T, 1); PROP_EXT.belarchl = PROP_EXT.belarchr = PROP_EXT.belarch; if (typeof BREAK_FX !== 'undefined' && BREAK_FX.KIND) BREAK_FX.KIND.belarchl = BREAK_FX.KIND.belarchr = BREAK_FX.KIND.belarch; if (typeof PROP_EL !== 'undefined') PROP_EL.belarchl = PROP_EL.belarchr = 'gold'; }
  const TIDE_LEGEND = Object.assign({}, PROP_LEGEND, { A: { prop: 'belarchl' }, B: { prop: 'belarchr' }, D: {}, v: {}, E: {}, G: {}, h: { mons: ['crawler', 'crawler'] }, j: { mons: ['reeflantern'] }, k: { mons: ['crawler', 'crawler', 'crawler'] } });
  function makeTide(X, self, H) {
    const M = X.M, mk = M.marks, me = X.me, C = ctx(X), T0 = () => X.Tz();
    const S0 = mk.S ? mk.S[0] : M.start, startLine = S0.y - 4.5, bottom = M.MH;
    const shelves = (mk.D || []).map(p => ({ tx: p.tx, ty: p.ty }));
    const shelfSet = new Set(shelves.map(t => t.ty * M.MW + t.tx)), onShelf = (x, y) => shelfSet.has(Math.floor(y) * M.MW + Math.floor(x));
    // the landings, bottom first (valves sorted by y, the lowest on the screen first)
    const vs = (mk.v || []).slice().sort((a, b) => b.y - a.y);
    const legs = vs.map((p, i) => { const y0 = p.y - 5.5, y1 = p.y + 1.5; return { i, valve: null, y0, y1, top: y0 - 0.2, mons: [], shelf: shelves.filter(t => t.ty + 0.5 > y0 - 1 && t.ty + 0.5 < y1 + 1) }; });
    const R = { legs, leg: 0, secured: 0, phase: 'wait', timer: 0, flood: bottom + 0.5, front: bottom + 0.5, surgeT: 0, swept: 0, breath: 0 };
    H.spawnPacks();
    // who holds each landing: its pack, and on the second a leech clinging to the valve itself
    for (const m of X.mons) { if (m.boss) continue; const L = legs.find(L => m.y > L.y0 - 2 && m.y < L.y1 + 2); if (L) L.mons.push(m); }
    if (legs[1]) { const v = vs[1], m = BEL.spawn(X, 'leech', v.x + 0.7, v.y - 0.3, { pack: 610 }); if (m) { m.x = v.x + 0.75; m.y = v.y - 0.25; m.holds = true; m.belHold = 'valve1'; legs[1].mons.push(m); } }
    X.g.total = X.mons.filter(m => !m.boss).length;
    legs.forEach((L, i) => { const p = vs[i]; L.valve = H.obj({ x: p.x, y: p.y, kind: 'valve', i, spin: 0, on: false, t: 0, r: 0.9, h: 1.9,
      locked: true,
      label: o => (o.on ? `Refuge ${i + 1} secured` : o.locked ? (L.mons.some(m => !m.dead && m.type === 'leech') ? `Refuge valve ${i + 1}: a leech holds it` : `Refuge valve ${i + 1}: clear the landing`) : i > R.leg ? `Refuge valve ${i + 1}` : `Refuge valve ${i + 1}: turn it`),
      draw(c, Xs, Ys, T, o) { wheelArt(c, Xs, Ys, T, o); },
      use(o) { if (o.on) return; o.locked = L.mons.some(m => !m.dead); if (i !== R.leg) { X.text(o.x, o.y - 2.2, 'The landing below is not yet secured', '#FFFFFF', 12); snd(X, 'wrong'); return; } if (o.locked) { X.text(o.x, o.y - 2.2, L.mons.some(m => !m.dead && m.type === 'leech') ? 'A leech clings to the valve!' : 'Clear the landing first', '#B6A2F0', 13); snd(X, 'wrong'); return; } secure(L); } }); });
    function secure(L) { const o = L.valve; o.on = true; o.spin += Math.PI; R.secured++; R.leg++; R.flood = L.y1 + 0.6; if (R.phase === 'surge') R.front = Math.max(R.front, R.flood);
      X.banner(`LANDING ${L.i + 1} SECURED`, R.leg < legs.length ? 'The refuge holds: the next surge is coming' : 'All three refuges hold: the upper doors open', SAFE, 2.4, true); snd(X, 'fanfare'); X.ring(o.x, o.y, 0.3, 3.5, 0.6, TURQ, 0.35); X.flash(0.15, TURQ_HI);
      if (R.leg < legs.length) { R.phase = 'breath'; R.breath = 2.6; } else { R.phase = 'done'; X.after(0.6, () => X.banner('THE UPPER DOORS OPEN', `${GUARDS.tide.short} bars the way to the bell platform`, '#C9FFF8', 2.6, true)); X.shake(5, 0.5); } }
    function startLeg() { R.phase = 'run'; R.timer = TIDE_LEGS[R.leg] || 14; X.banner(R.leg === 0 ? 'THE TIDE RISES' : `SURGE ${R.leg + 1} OF 3`, `${R.timer} seconds to landing ${R.leg + 1}: clear it and turn its valve`, '#7FD3F2', 2.4, true); snd(X, 'hum'); }
    function surge() { R.phase = 'surge'; R.surgeT = 0; R.front = R.flood; R.caught = false; X.banner('SURGE!', 'Shelter on a dry shelf, or be carried back', '#7FD3F2', 1.8, true); X.shake(9, 0.6); snd(X, 'crash'); snd(X, 'whoosh'); }
    function sweepBack() { R.swept++; C.stat.swept++; const back = R.secured > 0 ? legs[R.secured - 1] : null, sp = back ? (back.shelf[1] || back.shelf[0]) : null, to = sp ? { x: sp.tx + 0.5, y: sp.ty + 0.5 } : back ? { x: back.valve.x, y: back.valve.y + 1.2 } : { x: S0.x, y: S0.y };
      X.hurtPet(X.ST().hp * 0.18, null); X.splash(me.x, me.y, 2); me.x = to.x; me.y = to.y; me.vx = me.vy = 0; me.dodge = null; me.push = null; me.inv = Math.max(me.inv || 0, 0.8); X.text(me.x, me.y - 1.4, 'Swept back!', '#7FD3F2', 15); X.flash(0.2, '#7FD3F2'); }
    const E = mk.E[0]; H.setExit(E.x, E.y, 'The bell platform');
    const gp = mk.G[0]; placeGuard(X, 'tide', gp.x, gp.y, { x: E.x, y: E.y });
    X.after(1.4, () => X.banner('THE RISING TIDE WALK', 'Climb past three landings, securing each refuge before the surge', '#9FE8FF', 3, true, true));
    const target = () => legs[R.leg];
    return { R, legs,
      hint() { if (R.phase === 'done') return guardDown(X) ? null : (C.guard && C.guard.m) || null; if (R.phase === 'wait') return { x: S0.x, y: startLine - 1.5, h: 0.5, label: 'THE TIDE LINE' }; const L = target(); if (!L) return null; const live = L.mons.filter(m => !m.dead); if (live.length) return live.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; return L.valve; },
      update(dt) { for (const L of legs) { L.valve.t += dt; L.valve.locked = L.mons.some(m => !m.dead); }
        if (R.phase === 'wait') { if (me.y < startLine && !me.dead) startLeg(); }
        else if (R.phase === 'breath') { R.breath -= dt; if (R.breath <= 0) startLeg(); }
        else if (R.phase === 'run') { R.timer -= dt; if (R.timer <= 0) surge(); }
        else if (R.phase === 'surge') { R.surgeT += dt; const L = target(), reach = L ? L.top : R.flood, u = R.surgeT;
          // the wave climbs to the landing's top in 1.4 s, holds, then falls back to the risen water
          R.front = u < 1.4 ? lerp(R.flood, reach, sm(u / 1.4)) : u < 2.1 ? reach : lerp(reach, R.flood, sm((u - 2.1) / 1.4));
          if (!R.caught && !me.dead && me.y > R.front && me.y < R.flood + 0.5 && !onShelf(me.x, me.y)) { R.caught = true; sweepBack(); }
          if (u > 3.5) { if (L && !L.valve.on) { R.phase = 'run'; R.timer = (TIDE_LEGS[R.leg] || 14) + 2; X.banner('THE TIDE FALLS BACK', `${Math.round(R.timer)} seconds to the next surge`, '#7FD3F2', 2, true); } R.front = R.flood; } }
        if (!self.done && R.phase === 'done' && guardDown(X)) { self.done = true; X.banner('THE BELL PLATFORM', 'Climb the final flight', SAFE, 2.2, true); }
        if (R.phase === 'surge' && !lowFx() && Math.random() < dt * 20) X.part({ kind: 'smoke', x: 9 + Math.random() * 10, y: R.front + 0.1, vx: (Math.random() - 0.5) * 1.5, vy: -1.2, life: 0.5, max: 0.5, size: 0.3, color: 'rgba(220,250,250,' }); },
      goal() { if (self.done) return 'Climb to the bell platform'; if (R.phase === 'done') return `Defeat ${GUARDS.tide.short} to open the upper doors`; if (R.phase === 'wait') return 'Cross the tide line to begin'; const L = target(), live = L ? L.mons.filter(m => !m.dead).length : 0;
        return `Landing ${R.leg + 1} of 3: ${live ? `clear it (${live} left)` : 'turn its valve'}${R.phase === 'run' ? ` · SURGE in ${Math.ceil(R.timer)}s` : R.phase === 'surge' ? ' · SURGE!' : ''} · ${R.secured}/3 secured`; },
      drawGround(c) { const T = T0(), W = X.W(), Hh = X.H(), t = C.t;
        // the dry shelves: raised ledges of pale stone with a step and a shelter mark
        for (const L of legs) { if (!L.shelf.length) continue; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of L.shelf) { x0 = Math.min(x0, s.tx); y0 = Math.min(y0, s.ty); x1 = Math.max(x1, s.tx + 1); y1 = Math.max(y1, s.ty + 1); }
          const a = X.sx(x0), b = X.sy(y0), w = (x1 - x0) * T, h = (y1 - y0) * T; if (a > W || b > Hh || a + w < 0 || b + h < 0) continue; c.save(); c.fillStyle = 'rgba(4,14,20,.35)'; c.fillRect(a + T * 0.08, b + T * 0.12, w, h); c.fillStyle = '#DAD8C6'; c.fillRect(a, b - T * 0.12, w, h); c.strokeStyle = SEAM; c.lineWidth = Math.max(1, T * 0.05); c.strokeRect(a, b - T * 0.12, w, h); c.fillStyle = '#9EA394'; c.fillRect(a, b + h - T * 0.12, w, T * 0.14);
          const cx = a + w / 2, cy = b + h / 2 - T * 0.12, s = T * 0.42; c.strokeStyle = 'rgba(36,80,79,.8)'; c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.arc(cx, cy + s * 0.4, s, Math.PI, 0); c.stroke(); c.beginPath(); c.moveTo(cx - s, cy + s * 0.4); c.lineTo(cx + s, cy + s * 0.4); c.stroke(); c.restore(); label(c, 'DRY SHELF', cx, b - T * 0.25, T * 0.22, '#E2F7F2'); }
        // the risen water below the last secured landing (calm, walkable), and the surge
        const fy = X.sy(R.flood); if (fy < Hh) { c.save(); const g = c.createLinearGradient(0, fy, 0, fy + T * 3); g.addColorStop(0, 'rgba(40,130,160,.28)'); g.addColorStop(1, 'rgba(24,96,124,.42)'); c.fillStyle = g; c.fillRect(0, Math.max(0, fy), W, Hh - Math.max(0, fy)); c.strokeStyle = 'rgba(226,247,242,.55)'; c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); for (let x = 0; x <= W; x += T * 0.5) { const yy = fy + Math.sin(x / T * 1.3 + t * 2) * T * 0.06; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); c.restore(); }
        if (R.phase === 'surge' && R.front < R.flood) { const sy = X.sy(R.front), ey = Math.min(Hh, X.sy(R.flood) + T * 0.5); c.save(); const g = c.createLinearGradient(0, sy, 0, ey); g.addColorStop(0, 'rgba(160,235,240,.75)'); g.addColorStop(0.15, 'rgba(47,128,183,.62)'); g.addColorStop(1, 'rgba(24,90,130,.55)'); c.fillStyle = g; c.fillRect(0, sy, W, ey - sy);
          c.strokeStyle = 'rgba(245,255,253,.95)'; c.lineWidth = Math.max(3, T * 0.14); c.lineCap = 'round'; c.beginPath(); for (let x = -T; x <= W + T; x += T * 0.4) { const yy = sy + Math.sin(x / T * 2.1 + t * 9) * T * 0.1; x > -T ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); c.restore();
          const G = gpu(c, true); if (G) { for (let x = X.sx(9); x < X.sx(18); x += T * 1.1) G.Q.spray(x, sy, T * 0.8, '#E8FBFF', 0.6, x * 0.01, 1.2, 0.7); gpuEnd(c, G); } }
        // the surge's reach, marked on the floor in its last seconds: a bright edge, a countdown, a wave symbol
        const L = target(); if (L && R.phase === 'run' && R.timer < 6) { const k = 1 - R.timer / 6, ty = X.sy(L.top), xa = X.sx(6), xb = X.sx(21); c.save(); c.globalAlpha = 0.18 + 0.22 * k; c.fillStyle = 'rgba(97,217,210,.3)'; c.fillRect(xa, ty, xb - xa, Math.min(Hh, X.sy(R.flood)) - ty); c.globalAlpha = 0.7 + 0.3 * Math.sin(t * 10); c.strokeStyle = TURQ_HI; c.lineWidth = Math.max(3, T * 0.12); c.setLineDash([T * 0.4, T * 0.22]); c.lineDashOffset = -t * T; c.beginPath(); c.moveTo(xa, ty); c.lineTo(xb, ty); c.stroke(); c.setLineDash([]); c.restore();
          for (let i = 0; i < 3; i++) { const wx = lerp(xa, xb, (i + 0.5) / 3), wy = ty + T * 0.55; c.save(); c.strokeStyle = '#E2F7F2'; c.lineWidth = Math.max(2, T * 0.08); c.beginPath(); c.moveTo(wx - T * 0.45, wy); c.quadraticCurveTo(wx - T * 0.2, wy - T * 0.35, wx, wy); c.quadraticCurveTo(wx + T * 0.2, wy + T * 0.35, wx + T * 0.45, wy); c.stroke(); c.restore(); }
          label(c, `SURGE ${Math.ceil(R.timer)}`, (xa + xb) / 2, ty - T * 0.3, T * 0.55, '#C9FFF8'); }
        // the warning lines crawling up the balustrades before each surge
        if (L && R.phase === 'run' && R.timer < 5) { const k = 1 - R.timer / 5, y0 = X.sy(R.flood), y1 = X.sy(L.top), yk = lerp(y0, y1, k); const G = gpu(c, false);
          for (const ex of [8.95, 18.05]) { const Xs = X.sx(ex); if (G) G.Q.beam(Xs, y0, Xs, yk, T * 0.16, TURQ, 0.8); c.save(); c.strokeStyle = 'rgba(97,217,210,.9)'; c.lineWidth = Math.max(2, T * 0.07); c.setLineDash([T * 0.3, T * 0.18]); c.lineDashOffset = t * T * 2; c.beginPath(); c.moveTo(Xs, y0); c.lineTo(Xs, yk); c.stroke(); c.restore(); }
          gpuEnd(c, G); }
        // the tide line at the foot, until crossed
        if (R.phase === 'wait') { const ty = X.sy(startLine), xa = X.sx(7), xb = X.sx(20); c.save(); c.strokeStyle = 'rgba(201,255,248,.9)'; c.lineWidth = Math.max(3, T * 0.1); c.setLineDash([T * 0.3, T * 0.2]); c.lineDashOffset = -t * T; c.beginPath(); c.moveTo(xa, ty); c.lineTo(xb, ty); c.stroke(); c.restore(); label(c, 'THE TIDE LINE · cross to begin', (xa + xb) / 2, ty - T * 0.3, T * 0.32, '#C9FFF8'); }
        // the upper doors: shut until the three refuges hold (and the guardian falls)
        { const Xs = X.sx(E.x), Ys = X.sy(E.y + 0.6); if (!self.done) { c.save(); c.fillStyle = '#20343A'; c.fillRect(Xs - T * 1.3, Ys - T * 2.6, T * 2.6, T * 2.6); c.strokeStyle = BRASS; c.lineWidth = Math.max(2, T * 0.1); c.strokeRect(Xs - T * 1.3, Ys - T * 2.6, T * 2.6, T * 2.6); c.beginPath(); c.moveTo(Xs, Ys - T * 2.6); c.lineTo(Xs, Ys); c.stroke(); for (let i = 0; i < 3; i++) { c.fillStyle = legs[i] && legs[i].valve.on ? TURQ : '#3A4A50'; c.beginPath(); c.arc(Xs - T * 0.7 + i * T * 0.7, Ys - T * 2.0, T * 0.16, 0, TAU); c.fill(); } c.restore(); } } },
      drawOver(c) { const W = X.W(); if (R.phase === 'run' || R.phase === 'surge') { const k = R.phase === 'surge' ? 0 : R.timer / (TIDE_LEGS[R.leg] || 14), bw = Math.min(260, W - 40), x0 = (W - bw) / 2, y0 = 98; c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; GFX.rr(c, x0 - 4, y0 - 4, bw + 8, 22, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,.12)'; GFX.rr(c, x0, y0, bw, 14, 6); c.fill(); if (k > 0) { c.fillStyle = k < 0.3 ? '#FF9BD2' : '#7FD3F2'; GFX.rr(c, x0, y0, bw * k, 14, 6); c.fill(); } c.restore();
          label(c, R.phase === 'surge' ? 'SURGE!' : `Surge in ${Math.ceil(R.timer)}s · landing ${R.leg + 1}/3`, W / 2, y0 + 11, 11, '#FFFFFF'); } } };
  }
  const TIDE = { name: 'The Rising Tide Walk', biome: 'beltide', guard: 'tide', vista: { x: 13, y: -16 }, goal: 'Climb past three refuge landings, securing each valve before the surge',
    how: 'Cross the tide line and the surges begin: reach the next landing, clear its brood and stand at its refuge valve before the timer runs out. Turquoise lines climb the balustrades and the surge\'s reach is marked on the floor before it comes. Shelter on a dry shelf if you will not make it; caught below the surge, you are carried back to the last secured landing. Secure all three, then defeat the guardian at the upper doors.',
    layout: TIDE_G, legend: TIDE_LEGEND, make: makeTide };

  /* ======================= SECTION 1: THE HALL OF THREE TIDES (worker B2) and its stand-in =======================
     The real stage is BELFRY_HALL.stage (20n1-belfry-hall.js, loaded after this file): the stage entry below reads it at
     run time, field by field, and falls back to this stand-in while it is missing: the causeway (three low waves) into the
     round vestibule (a ring of shallow water round a dry dais, the three sealed gates with their emblems), one pack of the
     brood; when it is beaten the central doorway rises and its guardian comes out to hold it. */
  const HALL_G = (() => { const g = grid(41, 62, '~');
    disc(g, 20.5, 20.5, 13.6, '#'); disc(g, 20.5, 20.5, 12.6, '.'); rect(g, 17, 31, 23, 59, '.');
    for (const [x, y] of [[6, 20], [34, 20], [20, 6]]) { rect(g, x - 1, y - 1, x + 1, y + 1, '#'); } put(g, 20, 57, 'S');
    // columns standing in the ring of water, broken ones among them
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.31, x = Math.round(20 + Math.cos(a) * 10.4), y = Math.round(20 + Math.sin(a) * 10.4); if (y > 27 && Math.abs(x - 20) < 4) continue; put(g, x, y, i % 3 === 1 ? 'U' : 'C'); }
    put(g, 13, 14, 'a'); put(g, 27, 26, 'b');
    for (let y = 36; y <= 56; y += 5) { put(g, 16, y, 'J'); put(g, 24, y + 2, 'J'); }
    for (const [x, y, ch] of [[9, 9, 'N'], [31, 9, 'N'], [8, 30, 'Z'], [32, 30, 'F'], [11, 5, 'I'], [29, 5, 'I']]) put(g, x, y, ch);
    return rows(g); })();
  const HALL_PH = { name: 'The Hall of Three Tides', biome: 'belfry', guard: 'hall', vista: { x: 21, y: -18 }, causeway: { x0: 18, x1: 25, y0: 33, y1: 59 },
    goal: 'Clear the vestibule; the central doorway rises', how: 'A stand-in for the Hall of Three Tides: clear the brood in the round vestibule and the central doorway rises out of the dais.',
    layout: HALL_G, legend: Object.assign({}, PROP_LEGEND, { a: { mons: ['crawler', 'crawler', 'reeflantern'] }, b: { mons: ['crawler', 'leech', 'crawler'] } }),
    make(X, self, H) { const C = ctx(X), cx = 21.5, cy = 21.5; BEL.shallow(X, { kind: 'ring', x: cx, y: cy, r0: 7.4, r1: 9.6 }); H.spawnPacks();
      const gates = [{ x: 7.5, y: cy, dir: 'WEST', emb: 'shield', col: '#9FF0C8' }, { x: 35.5, y: cy, dir: 'EAST', emb: 'fangs', col: '#E07A6A' }, { x: cx, y: 8.6, dir: 'NORTH', emb: 'spiral', col: '#A8D8FF' }];
      gates.forEach(G => H.obj({ x: G.x, y: G.y + 1.2, kind: 'hallgate', r: 0.1, h: 3.6, label: '', draw(c, Xs, Ys, T) { sealedGateArt(c, Xs, Ys, T, G, C.t); } }));
      let door = 0; const D = H.obj({ x: cx, y: cy + 0.4, kind: 'hallgate', r: 0.1, h: 3.6, label: '', draw(c, Xs, Ys, T) { if (door > 0) risingDoorArt(c, Xs, Ys, T, door, C.t); } });
      return { update(dt) { if (!self.done && H.monstersLeft() === 0) { self.done = true; H.setExit(cx, cy, 'Kharrox'); X.banner('THE CENTRAL DOORWAY RISES', 'A limestone door lifts out of the dais', '#C9FFF8', 2.6, true); X.shake(6, 1.2); snd(X, 'hum'); }
          if (self.done) door = Math.min(1, door + dt / 2.2); },
        hint: () => null, goal: () => (self.done ? 'Through the central doorway' : `${H.monstersLeft()} of the brood left`) }; } };
  /* the emblems on the gates, the crystals and the sockets: west a shield, east crossed fangs, north a curled spiral */
  function emblem(c, x, y, s, kind, col, lw) { c.save(); c.translate(x, y); c.lineJoin = 'round'; c.lineCap = 'round'; c.fillStyle = col; c.strokeStyle = LN; c.lineWidth = lw || Math.max(1.2, s * 0.12);
    if (kind === 'shield') { c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.85, -s * 0.65); c.quadraticCurveTo(s * 0.8, s * 0.5, 0, s); c.quadraticCurveTo(-s * 0.8, s * 0.5, -s * 0.85, -s * 0.65); c.closePath(); c.fill(); c.stroke(); }
    else if (kind === 'fangs') { for (const sd of [-1, 1]) { c.save(); c.rotate(sd * 0.5); c.beginPath(); c.moveTo(-s * 0.22, -s); c.quadraticCurveTo(s * 0.3, -s * 0.2, 0, s); c.quadraticCurveTo(-s * 0.05, -s * 0.1, -s * 0.22, -s); c.closePath(); c.fill(); c.stroke(); c.restore(); } }
    else { c.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU * 1.6, r = s * (0.12 + u * 0.88); i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.lineWidth = Math.max(2, s * 0.28); c.strokeStyle = LN; c.stroke(); c.lineWidth = Math.max(1.2, s * 0.16); c.strokeStyle = col; c.stroke(); }
    c.restore(); }
  BEL.emblem = emblem;
  function sealedGateArt(c, Xs, Ys, T, G, t) { const w = T * 2.6, h = T * 3.4, lw = lw0(T); c.save(); c.fillStyle = 'rgba(4,14,20,.4)'; ell(c, Xs, Ys + T * 0.1, w * 0.6, T * 0.3); c.fill();
    c.fillStyle = '#CFCFBE'; c.fillRect(Xs - w / 2 - T * 0.3, Ys - h - T * 0.3, w + T * 0.6, h + T * 0.3); ink(c, lw); c.fillStyle = '#20343A'; c.fillRect(Xs - w / 2, Ys - h, w, h); c.strokeStyle = BRASS; c.lineWidth = Math.max(2, T * 0.1); c.strokeRect(Xs - w / 2, Ys - h, w, h); c.beginPath(); c.moveTo(Xs, Ys - h); c.lineTo(Xs, Ys); c.stroke();
    emblem(c, Xs, Ys - h * 0.6, T * 0.55, G.emb, G.col); glow(c, Xs, Ys - h * 0.6, T * 1.2, G.col, 0.25 + 0.1 * Math.sin(t * 2)); c.restore(); label(c, G.dir, Xs, Ys - h - T * 0.5, T * 0.32, '#FFFFFF'); }
  function risingDoorArt(c, Xs, Ys, T, k, t) { const u = sm(k), w = T * 2.4, h = T * 3.6 * u, lw = lw0(T); c.save(); c.fillStyle = 'rgba(4,14,20,.45)'; ell(c, Xs, Ys + T * 0.1, w * 0.8, T * 0.4); c.fill();
    c.fillStyle = stoneG(c, Xs - w / 2, Xs + w / 2, true); c.fillRect(Xs - w / 2, Ys - h, w, h); ink(c, lw); c.fillStyle = '#0E2A30'; c.fillRect(Xs - w * 0.3, Ys - h * 0.85, w * 0.6, h * 0.85);
    c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(97,217,210,.5)'; c.fillRect(Xs - T * 0.04, Ys - h * 0.85, T * 0.08, h * 0.85); c.restore(); brassBand(c, Xs - w / 2, Xs - w / 2 + T * 0.2, Ys - h, h); brassBand(c, Xs + w / 2 - T * 0.2, Xs + w / 2, Ys - h, h);
    if (u > 0.6) [['shield', '#9FF0C8'], ['fangs', '#E07A6A'], ['spiral', '#A8D8FF']].forEach(([e, col], i) => emblem(c, Xs + (i - 1) * T * 0.7, Ys - h + T * 0.3, T * 0.2, e, col));
    if (u < 1) for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(200,240,245,.6)'; c.fillRect(Xs - w / 2 + i * w / 3, Ys - h + ((t * 4 + i) % 1) * h, T * 0.04, T * 0.3); } c.restore(); }
  const hallSrc = () => { let H = null; try { if (typeof BELFRY_HALL !== 'undefined' && BELFRY_HALL) H = BELFRY_HALL; } catch (e) { H = null; } if (!H) try { H = (typeof window !== 'undefined' && window.BELFRY_HALL) || null; } catch (e) { H = null; } return H && H.stage ? H.stage : null; };
  const HALL = new Proxy({}, { get(_, k) { const S = hallSrc(); if (k === 'kind') return 'puzzle'; if (k === 'trial') return true; if (k === 'placeholder') return !S; if (k === 'guard') return S && 'guard' in S ? S.guard : 'hall'; if (k === 'biome') return (S && S.biome) || 'belfry'; return (S || HALL_PH)[k]; },
    has(_, k) { return k === 'kind' || k === 'trial' || k in (hallSrc() || HALL_PH); } });
  BEL.hallPlaceholder = HALL_PH; BEL.sealedGateArt = sealedGateArt; BEL.risingDoorArt = risingDoorArt;

  /* ======================= the boss stages (workers B3, B4, B5) and their stand-ins ======================= */
  const ARENA_G = (() => { const g = grid(30, 32, '~'); disc(g, 15, 15, 11.5, '.'); rect(g, 13, 25, 17, 30, '.'); put(g, 15, 28, 'S'); put(g, 15, 13, 'B'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, x = Math.round(14.5 + Math.cos(a) * 9.4), y = Math.round(14.5 + Math.sin(a) * 9.4); if (y > 22) continue; put(g, x, y, i % 2 ? 'U' : 'C'); } return rows(g); })();
  const fiendHere = id => { try { return !!(FIEND_DEFS[id] && RIFT_FIENDS[id]); } catch (e) { return false; } };
  function fallbackBoss(X, self, H, oldId, seal, title) { const B2 = BOSSES.find(b => b.id === oldId), bp = mk1(X, 'B') || { x: X.M.MW / 2, y: X.M.MH / 2 }, C = ctx(X); let m = B2 ? X.lesserBoss(bp.x, bp.y, 1, '', B2) : null; if (m) { m.aggro = false; m.bname = title; }
    const mod = { boss: m, update() { if (!m || self.done || self.cine) return; if (m.dead) { if (seal && mod.onBossDeath) { if (!mod.fell) { mod.fell = true; mod.onBossDeath(m); } } else { self.done = true; H.setExit(bp.x, bp.y - 6, 'Onward'); X.banner(`${title.toUpperCase()} FALLS`, 'The way on opens', SAFE, 2.4, true); } } },
      goal: () => (m && !m.dead ? `${title} · ${Math.max(0, Math.ceil(m.hp / m.maxhp * 100))}%` : 'The way on is open'), hint: () => (m && !m.dead && !m.aggro ? m : null) };
    if (seal) riftSealing(X, self, mod, Object.assign({ wound: { x: bp.x, y: bp.y - 2 } }, Rf0().sealing)); void C; return mod; }
  function bossStage(id, room, title, land, oldId, seal) { return { biome: land, name: room, boss: id, goal: title, seal: !!seal, oldBoss: oldId,
    get kind() { return fiendHere(id) ? 'boss' : 'puzzle'; }, get fallback() { return !fiendHere(id); }, layout: ARENA_G, legend: Object.assign({}, PROP_LEGEND, { B: {} }),
    get how() { return fiendHere(id) ? undefined : `${title} (a stand-in fight until the 3D boss is in): defeat it.`; },
    make(X, self, H) { if (fiendHere(id)) { const f = BEL.bossMake[id] || (FIEND_DEFS[id] && FIEND_DEFS[id].bossMake); return (f && f(X, self, H)) || {}; } return fallbackBoss(X, self, H, oldId, seal, title); } }; }

  /* the Drowned Lower Church's guardian (v392 B1; v394 B1: dungeon 1's) */
  GUARDS.church = { name: 'Gloomfin the Abyssal', short: 'Gloomfin', el: 'water', seed: 317, sub: 'A giant Cocopet of the abyss bars the gate to the Hall of Three Tides', palette: { tint: '#0B1C26', tintK: 0.9, pal: { sec: '#7CF2C8', cheek: '#08202A' }, col: '#5FE0B8', glow: '#2FB890', core: '#E6FFF6' }, hint: { tail: 'fish', ears: 'fin', horns: 'ram' }, hpK: 1 };
  /* ======================= v394 B1: THE THREE DUNGEONS (the Caldera's standard set-up) =======================
     The user (v394): "the first dungeon got to have the standard set up like blackfire caldera, where you have to fight 150
     enemies to proceed, I do like the turning the valve thing though so work it into that ... dungeon 1 > 3 gates trial >
     boss 1 > dungeon 2 > another trial/puzzle > boss 2 > dungeon 3 > boss 3. The dungeons will visually look different from
     one another ... add more traps and gradually increase the amount of enemies (150, 180, 200)".
     Each dungeon is a rolled floor of rooms and corridors (the engine's genFloor, as the Caldera's dungeons, through
     riftFight): its own land and props, the brood topped up or trimmed to EXACTLY its count (packs of the rolled floor plus
     packs of four to six), one leader to every pack (EVIL_MINI.packLeaders), a live cap of 36 (the far packs wait off the field
     and walk back in as it thins), a corrupted Cocopet at the exit gate (EVIL_MINI.spawn, the doubled body, PetGL), and the
     gate sealed until every one of the brood AND the guardian has fallen. The ramp (the rift's level 10, a little harder
     each time): D1 150 brood (0.8 health, 0.75 blows), D2 180 (0.9, 0.82), D3 200 (1.0, 0.9); guardians at 1.0 / 1.15 / 1.3 of
     EVIL_MINI's level-10 numbers; leaders at a quarter of their guardian's health. Traps (worker B2's BEL_TRAPS): 15, 22, 30.
     THE VALVE HALLS (the Rising Tide Walk's valves, worked in; the Tide Walk stage is retired): 2, 3 and 4 rooms per dungeon
     stand flooded and tidal. Every so often the sea surges into such a hall: its water rises (the shallows deepen, turquoise
     lines climb its walls; no red rings, no countdown), then a crest sweeps across it and carries the pet back toward the
     hall's mouth with a little damage (a dodge roll rides it). Each has a brass refuge valve near its mouth, a bell leech
     clinging to it. Pull the leech off and stand at the valve (a short Resonance turn): the hall drains, its surges stop for
     good, the brood in it is left beached (stunned a few seconds) and the drained floor gives up what the sea held (health and
     coins). Optional, but it makes the hall safe and turns its brood into easy prey.
     The lands (worker PR may repaint them, or set BEL.THEMES.dN.land): D1 the Drowned Lower Church (belnave: dark wet
     flagstones, columns in shallow water), D2 the Bell Foundry Undercroft (belfoundry: iron and bronze, moulds, chains, pipes,
     a molten glow against the cold sea), D3 the Storm Galleries (belstorm: the tower's exterior walks and galleries in a storm,
     broken balustrades and arches, the sea far below). */
  GUARDS.foundry = { name: 'Clangrot the Undertoll', short: 'Clangrot', el: 'dark', seed: 433, sub: 'A Cocopet the deep has cast in bronze guards the foundry gate', palette: { tint: '#1C1418', tintK: 0.86, pal: { sec: '#E0A050', cheek: '#2A1810' }, col: '#D89A48', glow: '#9A5A20', core: '#FFE6B8' }, hint: { horns: 'ram', armor: true, tail: 'spade' }, hpK: 1.15 };
  GUARDS.storm = { name: 'Squallmaw the Stormdrowned', short: 'Squallmaw', el: 'water', seed: 571, sub: 'A storm-drowned Cocopet holds the stair to the bell platform', palette: { tint: '#162030', tintK: 0.86, pal: { sec: '#BFE0FF', cheek: '#101A2A' }, col: '#9FC8FF', glow: '#5A8CE0', core: '#F2FAFF' }, hint: { wings: 'bat', tail: 'fish', horns: 'ram' }, hpK: 1.3 };
  /* the placeholder lands of D2 and D3 (repainted in place by the themes worker when its file loads) */
  if (!BIOMES.belfoundry) { LANDS.belfoundry = { name: 'The Bell Foundry Undercroft', base: '#4A4A4E', tones: ['#525256', '#48484C', '#3F3F44', '#58585C', '#4C4A4C'], seam: '#1A1A1E', seamW: 0.06, bw: 1.6, bh: 1.2, jit: 0.25, split: 0.12, stain: 0.6, wet: 0.35, algae: 0.08, specks: 6, cracks: 0.5, sheen: 'rgba(255,170,90,', edgeWet: 0.9, rust: 0.6 };
    BIOMES.belfoundry = land('belfoundry', { dark: 0.24, bg: '#0E0C10', top: '#22201E', face: '#6E6458', faceD: '#2A2420', accent: '#E0A050', light: '#FFB066', props: ['belmould', 'belfoundmould', 'belpipe', 'belhung', 'belbell', 'belfoundhalf', 'belrib', 'bellamp'] }); }
  if (!BIOMES.belstorm) { LANDS.belstorm = { name: 'The Storm Galleries', base: '#A9AEA6', tones: ['#B2B6AE', '#A6ABA3', '#9CA299', '#B8BBB3'], seam: '#2A3A44', seamW: 0.05, bw: 2.5, bh: 1.4, jit: 0.3, split: 0.2, stain: 0.55, wet: 0.95, algae: 0.12, specks: 4, cracks: 0.6, sheen: 'rgba(190,220,255,', edgeWet: 1.5 };
    BIOMES.belstorm = land('belstorm', { dark: 0.2, bg: '#0A1420', out: true, accent: '#9FC8FF', light: '#CFE4FF', props: ['belrail', 'belarchl', 'belarchr', 'belpillar', 'belstump', 'belcolumn', 'bellamp'] }); }
  for (const id of ['belfoundry', 'belstorm']) { if (!BIOME_ORDER.includes(id)) BIOME_ORDER.push(id); if (typeof DARK_COL !== 'undefined') DARK_COL[id] = id === 'belfoundry' ? '12,8,6' : '6,14,24'; if (typeof ROOM_SHAPES !== 'undefined') ROOM_SHAPES[id] = id === 'belfoundry' ? ['rect', 'rect', 'oval'] : ['oval', 'rect', 'oval']; if (typeof BOSS_ARENA !== 'undefined') BOSS_ARENA[id] = 'oval'; }
  if (BIOMES.belnave && !BIOMES.belnave.__d1) { BIOMES.belnave.props = ['belcolumn', 'belstump', 'belbench', 'belfall', 'belcoral', 'bellamp', 'belpillar']; BIOMES.belnave.__d1 = 1; }
  const DUNS = {
    d1: { key: 'd1', name: 'The Drowned Lower Church', land: 'belnave', n: 150, guard: 'church', valves: 3, gate: true, traps: 15,   // v395 B1: three gate valves drain the flooded gate hall (no surge halls here)
          hpK: 0.8, dmgK: 0.75, leadK: 0.25, period: 15, vista: { x: 32, y: -20 } },
    d2: { key: 'd2', name: 'The Bell Foundry Undercroft', land: 'belfoundry', n: 180, guard: 'foundry', valves: 3, traps: 22, hpK: 0.9, dmgK: 0.82, leadK: 0.25, period: 13, vista: { x: 32, y: 84 } },
    d3: { key: 'd3', name: 'The Storm Galleries', land: 'belstorm', n: 200, guard: 'storm', valves: 4, traps: 30, hpK: 1.0, dmgK: 0.9, leadK: 0.25, period: 11.5, vista: { x: 32, y: -24 } } };
  BEL.DUNS = DUNS;
  const BROOD_T = ['crawler', 'leech', 'reeflantern'], MOBS = ['crawler', 'crawler', 'reeflantern', 'crawler', 'leech', 'crawler'];
  const themeOf = key => { try { const Th = BEL.THEMES && BEL.THEMES[key]; return Th || null; } catch (e) { return null; } };
  const landOf = key => { const Th = themeOf(key); return Th && Th.land && BIOMES[Th.land] ? Th.land : DUNS[key].land; };
  const trapsAPI = () => { try { return (typeof self !== 'undefined' && self.BEL_TRAPS) || (typeof window !== 'undefined' && window.BEL_TRAPS) || null; } catch (e) { return null; } };
  const DCTX = new WeakMap(); BEL.dungeonCtx = X => DCTX.get(X.g || X) || null;
  /* the riftFight extra of a dungeon: the exact brood, the leaders, the live cap, the guardian at the gate, the valve halls, the traps */
  const dunExtra = key => (X, self, H) => { const D = DUNS[key], C = ctx(X), M = X.M, me = X.me, S0 = M.start, R = Math.random;
    const DS = { key, D, rooms: M.rooms, valveHalls: [], traps: null, trimmed: 0, added: 0, rolled: 0 }; DCTX.set(X.g || X, DS); C.dun = DS;
    X.F.events = false; M.gremlin = null; X.F.liveCap = 36;   // (no floor events or loot gremlin: the count stays exact; the cap holds the far packs)
    // (the exit: where riftFight put it, the farthest room's middle)
    let ex = M.bossAt || M.start, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = Math.hypot(cx - S0.x, cy - S0.y); if (d > best) { best = d; ex = X.freeSpot(cx, cy, 0.8) || { x: cx, y: cy }; } }
    const exRoom = M.rooms.reduce((a, r) => (Math.hypot(r.x + r.w / 2 - S0.x, r.y + r.h / 2 - S0.y) > Math.hypot(a.x + a.w / 2 - S0.x, a.y + a.h / 2 - S0.y) ? r : a), M.rooms[0]);
    // the brood: only the brood (anything else the floor rolled goes), trimmed or topped up to exactly D.n
    const all = () => X.mons.concat(X.g.reserve || []);
    const isB = m => !m.dead && !m.boss && !m.fobj && !m.optional;
    for (const m of all().filter(isB)) if (!BROOD_T.includes(m.type)) { const L = X.mons.includes(m) ? X.mons : X.g.reserve, i = L.indexOf(m); if (i >= 0) L.splice(i, 1); }
    DS.rolled = all().filter(isB).length;
    let have = DS.rolled;
    if (have > D.n) { const packs = new Map(); for (const m of all().filter(isB)) { if (!packs.has(m.pack)) packs.set(m.pack, []); packs.get(m.pack).push(m); }
      while (have > D.n) { let big = null; for (const [, l] of packs) if (!big || l.length > big.length) big = l; const m = big.sort((a, b) => Math.hypot(b.x - S0.x, b.y - S0.y) - Math.hypot(a.x - S0.x, a.y - S0.y)).pop(); const L = X.mons.includes(m) ? X.mons : X.g.reserve, i = L.indexOf(m); if (i >= 0) L.splice(i, 1); have--; DS.trimmed++; } }
    const rooms = M.rooms.map((r, i) => ({ r, i })).filter(({ r }) => r.w > 3 && r.h > 3 && Math.hypot(r.x + r.w / 2 - S0.x, r.y + r.h / 2 - S0.y) > 8);
    let pk = 0, tries = 0;
    while (have < D.n && rooms.length && tries++ < 600) { const { r, i } = rooms[Math.floor(R() * rooms.length)], c0 = X.freeSpot(r.x + 1 + R() * (r.w - 2), r.y + 1 + R() * (r.h - 2), 0.6); if (!c0 || Math.hypot(c0.x - S0.x, c0.y - S0.y) < 9 || Math.hypot(c0.x - ex.x, c0.y - ex.y) < 4) continue;
      const rem = D.n - have; let n = 4 + Math.floor(R() * 3); if (rem <= 7) n = rem; else if (rem - n < 4) n = rem - 4; pk++;   // (packs of four to six; the last one may be seven, never one to three)
      const mix = n >= 6 ? ['crawler', 'crawler', 'leech', 'reeflantern', 'crawler', 'leech'] : n === 5 ? ['crawler', 'crawler', 'leech', 'reeflantern', 'crawler'] : ['crawler', 'crawler', 'leech', 'crawler', 'crawler', 'reeflantern', 'crawler'];
      for (let j = 0; j < n; j++) { const a = j / n * TAU, q = X.freeSpot(c0.x + Math.cos(a) * 1.3, c0.y + Math.sin(a) * 1.3, 0.4) || c0; const m = X.spawnMon(mix[j % mix.length], q.x, q.y, { rift: true, pack: 200 + pk, room: i, flank: a }); if (m) { have++; DS.added++; } } }
    /* v395 B1: D1's gate hall stands flooded until its three valves are turned: none of the brood waits in it */
    if (D.gate) { const inEx = m => m.x > exRoom.x - 1 && m.x < exRoom.x + exRoom.w + 1 && m.y > exRoom.y - 1 && m.y < exRoom.y + exRoom.h + 1, away = rooms.filter(({ r }) => r !== exRoom);
      for (const m of all().filter(isB)) if (inEx(m) && away.length) { const { r } = away[Math.floor(R() * away.length)], q = X.freeSpot(r.x + 1 + R() * (r.w - 2), r.y + 1 + R() * (r.h - 2), 0.4); if (q) { m.x = q.x; m.y = q.y; if (m.home) m.home = { x: q.x, y: q.y }; } } }
    // the dungeon's numbers (a little harder each time), every one of the brood marked as this dungeon's
    for (const m of all().filter(isB)) { m.belDun = key; if (!m.belEased) { m.belEased = true; m.maxhp = Math.max(1, Math.round(m.maxhp * D.hpK)); m.hp = m.maxhp; m.dmg *= D.dmgK; } }
    X.g.total = all().filter(isB).length;
    // the guardian at the gate, then a leader to every pack
    // (the leaders and the guardian are measured against this floor's own brood: a leader three of its crawlers, the guardian
    // two and a half leaders, never below EVIL_MINI's own numbers for the level; a leader strikes a little harder than its pack)
    const cr = all().filter(m => isB(m) && m.type === 'crawler' && !m.elite).map(m => m.maxhp).sort((a, b) => a - b), B = cr[cr.length >> 1] || 1000, Bd = (all().find(m => isB(m) && m.type === 'crawler' && !m.elite) || { dmg: 10 }).dmg;
    const E = EM(), base = (E && E.hpFor ? E.hpFor((X.F && X.F.n) || 10) : 7200) * (GUARDS[D.guard].hpK || 1), leadHp = Math.round(Math.max(base * D.leadK, B * 3));
    const post = postNear(X, ex), mini = placeGuard(X, D.guard, post.x, post.y, { x: ex.x, y: ex.y }, { hpMin: Math.max(base, leadHp * 2) }); C.guardGeneric = true;
    DS.leaders = []; if (E && E.packLeaders && mini) { try { DS.leaders = E.packLeaders(X, mini, q => q.belDun === key, { hp: leadHp, dmg: Bd * 1.15 }) || []; } catch (e) { DS.leaders = []; } }
    DS.mini = mini; DS.exit = ex;
    /* v395 B1: D1's gate hall (the guardian's room and the door): deep water that cannot be crossed, the guardian asleep and
       untouchable under it, until the three gate valves are turned; then it drains and the guardian wakes */
    const GH = D.gate ? DS.gate = { room: exRoom, x0: exRoom.x, y0: exRoom.y, x1: exRoom.x + exRoom.w, y1: exRoom.y + exRoom.h, cx: exRoom.x + exRoom.w / 2, cy: exRoom.y + exRoom.h / 2, level: 1, want: 1, turned: 0, need: D.valves, open: false, camT: 0, last: null, toldT: 0, G: null } : null;
    if (GH && mini) { if (mini.calMini) mini.calMini.hold = true; mini.guardFn = () => (GH.open ? 1 : 0); mini.belSubmerged = true; try { GH.G = (E.guards(X) || []).find(G => G.m === mini) || null; } catch (e) { GH.G = null; } }
    // the valve halls: flooded, tidal rooms, each with a refuge valve at its mouth and a leech clinging to it
    const vh = rooms.filter(({ r }) => r !== exRoom && r.w >= 5 && r.h >= 5).sort((a, b) => Math.hypot(a.r.x + a.r.w / 2 - S0.x, a.r.y + a.r.h / 2 - S0.y) - Math.hypot(b.r.x + b.r.w / 2 - S0.x, b.r.y + b.r.h / 2 - S0.y));
    const pickN = Math.min(D.valves, vh.length), chosen = []; for (let k = 0; k < pickN; k++) chosen.push(vh[Math.floor((k + 0.5) * vh.length / pickN)]);
    chosen.forEach(({ r, i }, k) => { const tiles = []; for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) { const kk = y * M.MW + x; if (M.G[kk] === T_FLOOR && !M.props.has(kk)) tiles.push({ tx: x, ty: y }); } if (tiles.length < 12) return;
      const region = D.gate ? { off: true, kind: 'tiles', tiles: [] } : BEL.shallow(X, { kind: 'tiles', tiles }), cx = r.x + r.w / 2, cy = r.y + r.h / 2;   // (v395 B1: a gate valve's room is dry)
      // its mouth: the floor tile of the room nearest the start, beside a wall; the valve stands there
      let vt = null, vd = 1e9; for (const t of tiles) { const wallBy = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => M.G[(t.ty + dy) * M.MW + t.tx + dx] === T_SOLID); if (!wallBy) continue; const d = Math.hypot(t.tx + 0.5 - S0.x, t.ty + 0.5 - S0.y); if (d < vd) { vd = d; vt = t; } } if (!vt) vt = tiles[0];
      const mouth = { x: vt.tx + 0.5, y: vt.ty + 0.5 }, away = Math.atan2(cy - mouth.y, cx - mouth.x);
      const VH = { k, room: r, ri: i, region, tiles, mouth, cx, cy, away, drained: false, level: 0, phase: 'calm', t: R() * D.period * 0.6, crest: -1, hit: false, sweeps: 0, beachT: 0 };
      const lp = X.freeSpot(mouth.x + Math.cos(away) * 0.6, mouth.y + Math.sin(away) * 0.6, 0.4) || mouth, lch = BEL.spawn(X, 'leech', lp.x, lp.y, { pack: 380 + k, count: false });   // (pack 380+: never held off the field by the live cap)
      if (lch) { lch.holds = true; lch.x = lp.x; lch.y = lp.y; lch.belValve = k; lch.belDun = key; lch.maxhp = Math.round(lch.maxhp * D.hpK); lch.hp = lch.maxhp; VH.leech = lch; }
      VH.valve = H.obj({ x: mouth.x, y: mouth.y, kind: 'valve', valveHall: k, spin: 0, on: false, t: 0, r: 0.9, h: 1.9, locked: true, lockCol: 'rgba(182,162,240,.8)',
        label: o => (D.gate ? (o.on ? `Gate valve turned (${GH.turned}/${GH.need})` : VH.leech && !VH.leech.dead ? 'Gate valve: a leech holds it' : 'Gate valve: turn it') : o.on ? 'The hall is drained' : VH.leech && !VH.leech.dead ? 'Refuge valve: a leech holds it' : 'Refuge valve: turn it to drain the hall'),   // v395 B1
        draw(c, Xs, Ys, T, o) { wheelArt(c, Xs, Ys, T, o); },
        use(o) { if (o.on) return; if (VH.leech && !VH.leech.dead) { X.text(o.x, o.y - 2.1, 'A leech clings to the valve!', '#B6A2F0', 13); snd(X, 'wrong'); return; } if (D.gate) gateTurn(VH); else drain(VH); } });   // v395 B1
      DS.valveHalls.push(VH); });
    // a valve leech belongs to the floor's count: the dungeon's number stays exact (one of a full pack's leeches gives way to it)
    for (const VH of DS.valveHalls) { if (!VH.leech) continue; const extra = all().filter(m => isB(m) && m.belDun === key && m.type === 'leech' && !m.calLeader && m.belValve == null && m !== VH.leech).pop() || all().filter(m => isB(m) && m.belDun === key && !m.calLeader && m.belValve == null && m !== VH.leech).pop(); if (extra) { const L = X.mons.includes(extra) ? X.mons : X.g.reserve, i = L.indexOf(extra); if (i >= 0) L.splice(i, 1); } }
    X.g.total = all().filter(isB).length;
    function drain(VH) { const o = VH.valve; o.on = true; o.spin += Math.PI; VH.drained = true; VH.drainT = 0; VH.phase = 'drain'; DS.drained = (DS.drained || 0) + 1;
      X.banner('THE HALL DRAINS', 'The refuge holds: no more surges here, and the brood is left beached', '#C9FFF8', 2.4, true); snd(X, 'fanfare'); X.ring(o.x, o.y, 0.3, 4, 0.7, TURQ, 0.35); X.flash(0.12, TURQ_HI);
      const r = VH.room; for (const m of X.mons) if (!m.dead && !m.boss && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h) { m.stun = Math.max(m.stun || 0, 3.5); m.belBeached = 3.5; X.text(m.x, m.y - m.r - 0.6, 'Beached!', '#C9FFF8', 11); }
      for (let i = 0; i < 4; i++) X.after(0.4 + i * 0.25, () => { const a = R() * TAU, d = 1 + R() * 2, p = X.freeSpot(VH.cx + Math.cos(a) * d, VH.cy + Math.sin(a) * d, 0.4); if (p) X.drop(i % 2 ? 'coin' : 'hp', p.x, p.y); }); }
    /* v395 B1: a gate valve turned: the gate hall's water drops a step (a sound and a look at the hall); at the last one it drains */
    function gateTurn(VH) { const o = VH.valve; o.on = true; o.spin += Math.PI; VH.drained = true; GH.turned++; GH.want = 1 - GH.turned / GH.need; GH.camT = 1.8; DS.drained = GH.turned;
      X.ring(o.x, o.y, 0.3, 3.5, 0.6, TURQ, 0.35); X.flash(0.1, TURQ_HI); snd(X, 'chime', 262 + GH.turned * 66, 0.6); snd(X, 'whoosh'); X.shake(4, 0.35);
      if (GH.turned < GH.need) X.banner(`GATE VALVE ${GH.turned} OF ${GH.need}`, `The water in the gate hall drops: ${GH.need - GH.turned} more to turn`, '#C9FFF8', 2.4, true);
      else X.banner('THE GATE HALL DRAINS', `The last valve turns: the sea pours out, and ${GUARDS[D.guard].short} wakes`, '#C9FFF8', 2.8, true); }
    // the traps (worker B2's set), ramped by dungeon, kept off the start, the gate, the guardian's post, the valves and the doors
    try { const TR = trapsAPI(); if (TR && TR.place) { const avoid = [{ x: S0.x, y: S0.y, r: 6 }, { x: ex.x, y: ex.y, r: 5 }, { x: post.x, y: post.y, r: 6 }].concat(GH ? [{ x: GH.cx, y: GH.cy, r: Math.hypot(exRoom.w, exRoom.h) / 2 + 1 }] : []).concat(DS.valveHalls.map(V => ({ x: V.mouth.x, y: V.mouth.y, r: 3 }))); DS.traps = TR.place(X, H, { count: D.traps, kinds: null, avoid, dungeon: key, minGap: D.traps > 25 ? 2.8 : D.traps > 18 ? 3.2 : 3.5 }) || null; } } catch (e) { try { console.warn('bel traps', e); } catch (e2) {} }
    /* v395 B1: the gate hall: its water eases to the step the valves allow; the pet cannot wade in while it is deep; at the last
       valve it drains and the guardian, freed, wakes */
    function gateTick(dt) { GH.level += (GH.want - GH.level) * Math.min(1, dt * (GH.turned >= GH.need ? 0.9 : 1.4)); GH.camT = Math.max(0, GH.camT - dt); GH.toldT -= dt;
      const m = DS.mini;
      if (!GH.open && GH.turned >= GH.need && GH.level < 0.04) { GH.open = true; GH.level = 0;
        if (m && !m.dead) { m.belSubmerged = false; if (m.calMini) m.calMini.hold = false; if (GH.G) GH.G.wakeR = 40; X.splash(m.x, m.y, 2.2); X.text(m.x, m.y - m.r - 1.2, `${GUARDS[D.guard].short} wakes!`, GUARDS[D.guard].palette.col, 15); }
        X.flash(0.2, TURQ_HI); snd(X, 'crash'); }
      if (GH.open || me.dead) return;
      if (m && !m.dead) m.aggro = false;   // (it waits at its post, under the water)
      const pad = 0.25, inside = me.x > GH.x0 - pad && me.x < GH.x1 + pad && me.y > GH.y0 - pad && me.y < GH.y1 + pad;
      if (!inside) { GH.last = { x: me.x, y: me.y }; return; }
      let L = GH.last; if (!L) { const dl = me.x - GH.x0, dr = GH.x1 - me.x, du = me.y - GH.y0, dd = GH.y1 - me.y, k = Math.min(dl, dr, du, dd); L = k === dl ? { x: GH.x0 - 0.6, y: me.y } : k === dr ? { x: GH.x1 + 0.6, y: me.y } : k === du ? { x: me.x, y: GH.y0 - 0.6 } : { x: me.x, y: GH.y1 + 0.6 }; }
      me.x = L.x; me.y = L.y; me.vx = me.vy = 0; me.push = null;
      if (GH.toldT <= 0) { GH.toldT = 2.4; X.text(me.x, me.y - 1.4, `Too deep: turn the gate valves (${GH.turned}/${GH.need})`, '#C9FFF8', 13); X.splash(me.x, me.y, 1); snd(X, 'whoosh'); } }
    // the deep water: dark, swelling, caustic light on it, a pale rim; the drained floor shows as it falls
    function gateGround(c) { const lv = GH.level; if (lv < 0.01) return; const T = X.Tz(), W = X.W(), Hh = X.H(), t = C.t, x0 = X.sx(GH.x0), y0 = X.sy(GH.y0), x1 = X.sx(GH.x1), y1 = X.sy(GH.y1);
      if (x1 < -T || y1 < -T || x0 > W + T || y0 > Hh + T) return;
      c.save(); const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, `rgba(10,40,58,${(0.9 * lv).toFixed(3)})`); g.addColorStop(1, `rgba(4,18,30,${(0.94 * lv).toFixed(3)})`); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.beginPath(); c.rect(x0, y0, x1 - x0, y1 - y0); c.clip(); c.strokeStyle = `rgba(120,215,226,${(0.2 * lv).toFixed(3)})`; c.lineWidth = Math.max(1, T * 0.05);
      for (let yy = y0 + T * 0.45; yy < y1; yy += T * 0.9) { c.beginPath(); for (let xx = x0; xx <= x1 + T * 0.5; xx += T * 0.5) { const w = Math.sin(xx / T * 1.1 + t * 1.8 + yy / T) * T * 0.09; xx === x0 ? c.moveTo(xx, yy + w) : c.lineTo(xx, yy + w); } c.stroke(); }
      c.restore();
      const G = gpu(c, true); if (G) { for (let yy = GH.y0 + 1.2; yy < GH.y1 - 0.5; yy += 2.6) for (let xx = GH.x0 + 1.2; xx < GH.x1 - 0.5; xx += 2.6) G.Q.caustic(X.sx(xx), X.sy(yy), T * 1.5, '#6FD8E0', 0.24 * lv, xx * 0.7 + yy, 0.38); gpuEnd(c, G); }
      c.save(); c.strokeStyle = `rgba(226,247,242,${(0.6 * lv).toFixed(3)})`; c.lineWidth = Math.max(1.5, T * 0.07); c.strokeRect(x0 + 1, y0 + 1, x1 - x0 - 2, y1 - y0 - 2); c.restore(); }
    // over it all: the guardian seen through the water (a tint and moving light over it), three pips over the door (the valves
    // turned), and an arrow at the screen's edge toward every valve still to turn
    function gateOver(c) { const T = X.Tz(), W = X.W(), Hh = X.H(), t = C.t, lv = GH.level;
      if (lv > 0.01) { const x0 = X.sx(GH.x0), y0 = X.sy(GH.y0), x1 = X.sx(GH.x1), y1 = X.sy(GH.y1);
        if (!(x1 < -T || y1 < -T || x0 > W + T || y0 > Hh + T)) { c.save(); c.fillStyle = `rgba(14,62,86,${(0.4 * lv).toFixed(3)})`; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.globalCompositeOperation = 'lighter'; c.strokeStyle = `rgba(150,235,240,${(0.16 * lv).toFixed(3)})`; c.lineWidth = Math.max(1, T * 0.04);
          for (let k = 0; k < 6; k++) { const yy = y0 + (y1 - y0) * ((k + 0.5) / 6) + Math.sin(t * 1.3 + k) * T * 0.15; c.beginPath(); for (let xx = x0; xx <= x1; xx += T * 0.5) { const w = Math.sin(xx / T * 1.1 + t * 2 + k) * T * 0.08; xx === x0 ? c.moveTo(xx, yy + w) : c.lineTo(xx, yy + w); } c.stroke(); } c.restore(); } }
      if (DS.exit && !GH.open) { const Xs = X.sx(DS.exit.x), Ys = X.sy(DS.exit.y) - T * 2.9; if (Xs > -T * 2 && Xs < W + T * 2 && Ys > -T * 2 && Ys < Hh + T * 2) { c.save(); for (let i = 0; i < GH.need; i++) { const on = i < GH.turned, px = Xs + (i - (GH.need - 1) / 2) * T * 0.7; if (on) glow(c, px, Ys, T * 0.5, TURQ, 0.6); c.fillStyle = on ? TURQ : '#20343A'; c.strokeStyle = BRASS; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(px, Ys, T * 0.2, 0, TAU); c.fill(); c.stroke(); } c.restore(); } }
      if (GH.open) return; const m = T * 0.9, cx = W / 2, cy = Hh / 2;
      for (const VH of DS.valveHalls) { if (VH.valve.on) continue; const sx = X.sx(VH.valve.x), sy = X.sy(VH.valve.y - 0.8); if (sx > m && sx < W - m && sy > m * 2 && sy < Hh - m * 4.5) continue;
        const dx = sx - cx, dy = sy - cy, k = Math.min((W / 2 - m) / Math.max(1e-3, Math.abs(dx)), (dy < 0 ? Hh / 2 - m * 2 : Hh / 2 - m * 4.5) / Math.max(1e-3, Math.abs(dy))), px = cx + dx * k, py = cy + dy * k, a = Math.atan2(dy, dx), p = 0.75 + 0.25 * Math.sin(t * 5);
        c.save(); c.translate(px, py); glow(c, 0, 0, T * 0.7, TURQ, 0.35 * p); c.rotate(a); c.fillStyle = `rgba(97,217,210,${p.toFixed(3)})`; c.strokeStyle = 'rgba(10,30,36,.85)'; c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.moveTo(T * 0.42, 0); c.lineTo(-T * 0.22, -T * 0.3); c.lineTo(-T * 0.08, 0); c.lineTo(-T * 0.22, T * 0.3); c.closePath(); c.fill(); c.stroke(); c.restore(); } }
    // the surges: a tidal hall's water rises (the shallows deepen, turquoise lines climb its walls), then a crest sweeps across it
    function tick(dt) { if (GH) gateTick(dt); for (const VH of DS.valveHalls) { const r = VH.room; VH.valve.t += dt; VH.valve.locked = !!(VH.leech && !VH.leech.dead); if (GH) continue;   // (v395 B1: D1's valves only drain the gate hall)
        if (VH.drained) { VH.drainT += dt; VH.level = Math.max(0, VH.level - dt * 0.6); if (VH.drainT > 2.2 && !VH.region.off) VH.region.off = true; continue; }
        const near = Math.hypot(me.x - VH.cx, me.y - VH.cy) < Math.max(r.w, r.h) * 0.5 + 12; VH.t += dt * (near ? 1 : 0.4); const P = D.period, u = VH.t % P;
        // calm (most of the cycle), then the rise (3.5 s), the crest (0.9 s), the fall
        if (u < P - 5.2) { VH.phase = 'calm'; VH.level = Math.max(0, VH.level - dt); VH.crest = -1; VH.hit = false; }
        else if (u < P - 1.7) { VH.phase = 'rise'; VH.level = Math.min(1, (u - (P - 5.2)) / 3.5); if (VH.level > 0.5 && !VH.said && near) { VH.said = true; X.text(VH.cx, VH.cy - 1.5, 'The sea is coming in…', '#C9FFF8', 13); snd(X, 'hum'); } }
        else if (u < P - 0.8) { VH.phase = 'crest'; VH.crest = (u - (P - 1.7)) / 0.9; VH.level = 1;
          // the crest crosses the hall from its far side to its mouth; the pet in the hall, not rolling, is carried back
          const inRoom = me.x >= r.x && me.x <= r.x + r.w && me.y >= r.y && me.y <= r.y + r.h; if (!VH.hit && inRoom && !me.dead && !me.dodge && near) { const fx = VH.cx + Math.cos(VH.away) * (r.w / 2) * (1 - 2 * VH.crest), fy = VH.cy + Math.sin(VH.away) * (r.h / 2) * (1 - 2 * VH.crest), along = (me.x - fx) * Math.cos(VH.away) + (me.y - fy) * Math.sin(VH.away);
            if (Math.abs(along) < 0.9) { VH.hit = true; VH.sweeps++; C.stat.swept++; X.hurtPet(X.ST().hp * 0.06, null); me.push = { vx: -Math.cos(VH.away) * 6, vy: -Math.sin(VH.away) * 6, t: 0.35 }; X.splash(me.x, me.y, 1.6); X.text(me.x, me.y - 1.4, 'Swept by the surge!', '#C9FFF8', 14); snd(X, 'whoosh'); } } }
        else { VH.phase = 'fall'; VH.level = Math.max(0, 1 - (u - (P - 0.8)) / 0.8); VH.said = false; if (VH.crest >= 0 && near) { X.shake(3, 0.25); } VH.crest = -1; } } }
    function ground(c) { const T = X.Tz(), W = X.W(), Hh = X.H(), t = C.t; if (GH) { gateGround(c); return; }
      for (const VH of DS.valveHalls) { const r = VH.room, x0 = X.sx(r.x), y0 = X.sy(r.y), x1 = X.sx(r.x + r.w), y1 = X.sy(r.y + r.h); if (x1 < -T || y1 < -T || x0 > W + T || y0 > Hh + T) continue; const lv = VH.level;
        if (lv > 0.01) { c.save(); c.beginPath(); regionPath(c, X, VH.region); c.clip(); c.fillStyle = `rgba(24,96,124,${(0.28 * lv).toFixed(3)})`; c.fillRect(x0, y0, x1 - x0, y1 - y0);
          if (VH.phase === 'crest' && VH.crest >= 0) { const fx = X.sx(VH.cx + Math.cos(VH.away) * (r.w / 2) * (1 - 2 * VH.crest)), fy = X.sy(VH.cy + Math.sin(VH.away) * (r.h / 2) * (1 - 2 * VH.crest)), nx = -Math.sin(VH.away), ny = Math.cos(VH.away), L = Math.max(x1 - x0, y1 - y0);
            c.strokeStyle = 'rgba(245,255,253,.95)'; c.lineWidth = Math.max(3, T * 0.14); c.lineCap = 'round'; c.beginPath(); for (let i = -10; i <= 10; i++) { const s = i / 10 * L, wob = Math.sin(i * 1.3 + t * 9) * T * 0.1; const px = fx + nx * s - Math.cos(VH.away) * wob, py = fy + ny * s - Math.sin(VH.away) * wob; i > -10 ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
          c.restore(); }
        // the turquoise lines climbing the hall's walls as the sea rises (the tell: no red, no countdown)
        if ((VH.phase === 'rise' || VH.phase === 'crest') && lv > 0.02) { const yk = lerp(y1, y0, lv), G = gpu(c, false); for (const xx of [x0 + T * 0.1, x1 - T * 0.1]) { if (G) G.Q.beam(xx, y1, xx, yk, T * 0.16, TURQ, 0.75); c.save(); c.strokeStyle = 'rgba(97,217,210,.9)'; c.lineWidth = Math.max(2, T * 0.07); c.setLineDash([T * 0.3, T * 0.18]); c.lineDashOffset = t * T * 2; c.beginPath(); c.moveTo(xx, y1); c.lineTo(xx, yk); c.stroke(); c.restore(); } gpuEnd(c, G); } } }
    return { DS, update: tick, drawGround: ground, drawOver: c => { if (GH) gateOver(c); } }; };
  /* a dungeon stage (riftFight runs it: kind 'fight'; its land read at run time from the themes, else the placeholder) */
  function dunStage(key) { const D = DUNS[key], GD = GUARDS[D.guard]; return { kind: 'fight', dun: key, get biome() { return landOf(key); }, name: D.name, mini: null, mobs: MOBS, guard: D.guard, vista: D.vista, extra: dunExtra(key),
    introSub: D.gate ? `Drain the gate hall: turn ${D.valves} valves` : `${D.n} of the brood, then ${GD.name} at the gate`,   // v395 B1 (riftFight's opening banner)
    goal: D.gate ? `Turn the ${D.valves} gate valves to drain the gate hall, then defeat ${GD.short}: the door opens` : `Clear the dungeon: all ${D.n} of the brood and ${GD.short} at the gate`,
    get how() { return D.gate ? `A dungeon of rooms and corridors, ${D.n} of the brood in packs, each with a pack leader. The gate hall, with the door and ${GD.name}, stands flooded too deep to cross. Three gate valves wait in rooms around the dungeon, each held by a bell leech: kill the leech, then stand at the valve. Each one lowers the water; at the third the hall drains and ${GD.short} wakes. Defeat it and the door opens.` : this.howD; },
    howD: `A dungeon of rooms and corridors: ${D.n} of the brood in packs, each with a pack leader, and ${GUARDS[D.guard].name} at the gate. Some halls stand flooded and tidal: the sea surges through them (the water rises and turquoise lines climb the walls). Pull the leech off a hall's refuge valve and stand at it to drain the hall: its surges stop and its brood is left beached.` }; }
  const DUN1 = dunStage('d1'), DUN2 = dunStage('d2'), DUN3 = dunStage('d3');
  BEL.dunStage = dunStage;


  /* ======================= the rift ======================= */
  const SEALING = { fall: 'THE SEA DRAINS AWAY', sub: 'The bell sounds once, and warm sunlight enters the nave', sigil: 'THE TIDE SIGIL', name: 'The Drowned Belfry', color: '#61D9D2', glow: '#C9FFF8',
    onFall() { const C = CUR; if (C) C.calmTo = 1; try { if (C && C.X && C.X.sfx && C.X.sfx.chime) { C.X.sfx.chime(196, 1.4); C.X.after(0.05, () => C.X.sfx.chime(392, 0.8)); } } catch (e) {} BEL.clearCp('hall'); } };
  const STAGES = [   // v394 B1: dungeon 1 > the three-gate trial > boss 1 > dungeon 2 > the clapper puzzle > boss 2 > dungeon 3 > boss 3
    DUN1,
    HALL,
    bossStage('belkharrox', 'The Baptism Chamber', 'Kharrox the Bellback', 'belbapt', 'kharrox', false),
    DUN2,
    Object.assign(CLAPPERS, { kind: 'puzzle' }),
    bossStage('belnhalu', 'The Submerged Nave', 'Nhalu the Lantern Eel', 'belnave', 'nhalu', false),
    DUN3,
    bossStage('beluldroth', 'The Bell Platform', 'Uldroth the Drowned Herald', 'belplat', 'uldroth', true)];
  const Rf = defRift({
    id: 'belfry', n: 1, name: 'The Drowned Belfry', lvl: 10, sigil: 'Tide', biome: 'belfry', aff: ['water', 'dark'], region: 'the coast', layoutVer: 4,   // v394 B1: eight stages (three dungeons)
    blurb: 'A coastal bell tower sunk halfway into an alien sea. Fight down through three drowned dungeons, each held by a corrupted Cocopet, win three crystals in the Hall of Three Tides, balance the clapper counterweights, and silence the Drowned Herald.',
    stageNote: 'Eight stages: the Drowned Lower Church (a dungeon of 150 brood), the Hall of Three Tides (three gate trials), Kharrox the Bellback, the Bell Foundry Undercroft (a dungeon of 180), the Clapper Counterweights, Nhalu the Lantern Eel, the Storm Galleries (a dungeon of 200), and Uldroth the Drowned Herald, who seals the rift. A corrupted Cocopet guards each dungeon\'s gate; turn a flooded hall\'s valve to drain it.',
    gate: { anima: 'cancer', name: 'The Oracle Shell' }, mons: ['crawler', 'leech', 'reeflantern'], sealing: SEALING,
    scale: 0.5,   // (half the health and blows the brood was first built with)
    ease: 1, monCount: 0.55,   // v394 B1: the dungeons' rolled floors thinned (each is trimmed or topped up to its exact count), elites at the Tower's own share
    typeShare: Object.fromEntries(Object.keys(MON).filter(t => !BROOD_T.includes(t)).map(t => [t, 0])),   // v394 B1: only the brood rolls in the dungeons
    stages: STAGES });
  function Rf0() { return Rf; }
  BEL.Rf = Rf; BEL.STAGES = { DUN1, DUN2, DUN3, HALL, CLAPPERS, TIDE, HALL_PH };   // v394 B1 (TIDE: the retired Rising Tide Walk, kept for its parts)

  /* ======================= every stage: the sea, the shallows, the waves, the lights, the fish, the guardians ======================= */
  BEL.fishSeen = false;
  Rf.everyStage = (X, self, H) => { const C = ctx(X), S = self.S || {}, M = X.M, fiend = !!X.F.fiend; CUR = C; C.X = X; C.self = self; C.calm = C.calm || 0; C.calmTo = C.calmTo || 0;
    if (X.F.rift && X.F.rift.stage === 0) BEL.fishSeen = false;   // (a run starts at the first stage: the fish may pass again)
    C.vista = S.vista || { x: M.MW / 2, y: -12 };
    if (M.marks && M.marks.w && M.marks.w.length) BEL.shallow(X, { kind: 'tiles', tiles: M.marks.w.map(p => ({ tx: p.tx, ty: p.ty })) });
    { let cw = S.causeway || null; if (!cw && M.marks && M.marks.K && M.marks.K.length) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of M.marks.K) { x0 = Math.min(x0, p.tx); y0 = Math.min(y0, p.ty); x1 = Math.max(x1, p.tx + 1); y1 = Math.max(y1, p.ty + 1); } cw = { x0, x1, y0, y1 }; } if (cw && !C.waves.length) BEL.waves(X, cw); }
    // the props' live lights
    const glows = []; for (const p of X.props || []) { const f = GLOWS[p.kind]; if (f) for (const [dx, dy, r, kind] of f(p.v | 0)) glows.push({ p, dx, dy, r, kind, ph: hh(p.k || 0, 1, 3) * TAU }); }
    C.motes = C.motes || []; let wakeT = 0, gDelay = -1;
    const genericGuard = () => !!(S.guard && !S.noGuard && !C.guard);
    /* v394 B1: a dungeon (riftFight runs it): the gate opens only when every one of its brood AND its guardian has fallen;
       the goal counts the brood of this dungeon; the hint leads to the nearest far one, then to the guardian */
    if (S.dun && C.dun && self.mod && !self.mod.__dun) { const DS = C.dun, D = DS.D, GD = GUARDS[D.guard], xm = self.mod.xm || {}, md = self.mod; md.__dun = 1; let said = false;
      const GH = DS.gate;   // v395 B1: D1: the door waits on the gate hall's three valves and the guardian, not on the brood
      md.update = dt => { if (xm.update) xm.update(dt); const n = H.monstersLeft();
        /* (v396, the user: the monsters must be cleared first) the door waits on the valves, the guardian AND every brood */
        if (GH) { if (!said && GH.open && guardDown(X) && n > 0) { said = true; X.banner(`${GD.short.toUpperCase()} FALLS`, `${n} of the brood still roam the church: clear them to open the door`, '#C9FFF8', 2.6, true); }
          if (!self.done && GH.open && guardDown(X) && n === 0) { self.done = true; X.banner('THE DOOR OPENS', 'The church is clear: the way on is open', SAFE, 2.6, true); X.flash(0.25, '#FFFFFF'); snd(X, 'fanfare'); } return; }
        if (!said && n === 0 && !guardDown(X)) { said = true; X.banner('THE BROOD IS GONE', `${GD.short} still holds the gate`, '#C9FFF8', 2.4, true); }
        if (!self.done && n === 0 && guardDown(X)) { self.done = true; X.banner('THE GATE OPENS', 'The way on is clear: follow the arrow', SAFE, 2.6, true); X.flash(0.25, '#FFFFFF'); snd(X, 'fanfare'); } };
      md.goal = () => { const n = H.monstersLeft(); if (self.done) return GH ? `The door is open${n ? ` · ${n} brood left` : ''}` : 'The gate is open · the way on';
        if (GH) return GH.turned < GH.need ? `Drain the gate hall: turn the ${GH.need} valves (${GH.turned}/${GH.need}) · ${n} brood left` : !GH.open ? `The gate hall is draining… · ${n} brood left` : !guardDown(X) ? `Defeat ${GD.short} · ${n} brood left` : `Clear the brood to open the door · ${n} left`; return n > 0 ? `${n} of ${D.n} brood left${DS.mini && !DS.mini.dead ? ` · ${GD.short} at the gate` : ''}` : `Defeat ${GD.short} to open the gate`; };
      md.hint = () => { if (self.done) return null; const me = X.me, n = H.monstersLeft();
        if (GH && !(GH.open && guardDown(X))) { if (GH.open) return DS.mini && !DS.mini.dead ? DS.mini : null; let bv = null, bd2 = 1e9; for (const VH of DS.valveHalls) { if (VH.valve.on) continue; const d = Math.hypot(VH.valve.x - me.x, VH.valve.y - me.y); if (d < bd2) { bd2 = d; bv = VH.valve; } } return bv; } if (n === 0) return DS.mini && !DS.mini.dead ? DS.mini : null; let best = null, bd = 1e9; for (const m of X.mons) { if (m.dead || m.boss || m.optional || m.belDun !== D.key) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } } return bd > 8 ? best : null; };
      if (GH) md.cam = () => (GH.camT > 0 ? { x: GH.cx, y: GH.cy, k: Math.min(1, GH.camT * 1.6, (1.8 - GH.camT) * 3) * 0.9, zoom: 0.72 } : null); }   // v395 B1: a look at the gate hall as each valve turns
    return { C, BEL, glows,
      update(dt) { CUR = C; C.X = X; C.t += dt; C.calm += (C.calmTo - C.calm) * Math.min(1, dt * 0.5); const me = X.me;
        // the pet's wake in shallow water
        wakeT -= dt; if (!me.dead && C.shallow.length && Math.hypot(me.vx || 0, me.vy || 0) > 0.6 && wakeT <= 0 && BEL.inShallow(X, me.x, me.y)) { wakeT = 0.16; C.ripples.push({ x: me.x, y: me.y + 0.3, t: 0, life: 0.9 }); if (Math.random() < 0.25) X.splash(me.x, me.y + 0.2, 0.5); }
        for (const r of C.ripples) r.t += dt; C.ripples = C.ripples.filter(r => r.t < r.life);
        if (C.waves.length) wavesTick(X, C, dt);
        // the fish: once a run, some seconds into a stage where the sea can be seen
        if (!BEL.fishSeen && C.t > (fiend ? 24 : 12)) { BEL.fishSeen = true; C.fish = { on: true, t0: C.t }; }
        if (C.fish && C.fish.on && C.t - C.fish.t0 > 16.5) C.fish.on = false;
        // turquoise spores drifting up through the air (decoration)
        const want = lowFx() ? 6 : 18; if (C.motes.length < want && Math.random() < dt * 6) { const W = X.W() / X.Tz(), Hh = X.H() / X.Tz(); C.motes.push({ x: me.x + (Math.random() - 0.5) * W * 1.1, y: me.y + (Math.random() - 0.2) * Hh * 0.6, vx: (Math.random() - 0.5) * 0.3, vy: -(0.3 + Math.random() * 0.4), t: 0, life: 3 + Math.random() * 3, s: 0.6 + Math.random() * 0.8, ph: Math.random() * 6 }); }
        for (const e of C.motes) { e.t += dt; e.x += (e.vx + Math.sin(e.t * 1.3 + e.ph) * 0.2) * dt; e.y += e.vy * dt; } C.motes = C.motes.filter(e => e.t < e.life);
        // the section's guardian for a stage that does not place its own (the hall): beside its exit once it is done
        const ex = H.exit && H.exit(); if (genericGuard() && self.done && ex && !fiend) { if (gDelay < 0) gDelay = 1.4; gDelay -= dt; if (gDelay <= 0) { const p = (self.mod && self.mod.guardPost && self.mod.guardPost()) || postNear(X, ex); const m = placeGuard(X, S.guard, p.x, p.y, { x: ex.x, y: ex.y }); if (m) { C.guardGeneric = true; C.exitR = ex.r; X.banner(GUARDS[S.guard].name.toUpperCase(), GUARDS[S.guard].sub, GUARDS[S.guard].palette.col, 2.6, true); } } }
        if (C.guardGeneric && ex) { if (!guardDown(X)) { if (ex.r > 0) C.exitR = ex.r; ex.r = -1; const d = Math.hypot(me.x - ex.x, me.y - ex.y); if (d < 1.4 && !me.dead) { const a = Math.atan2(me.y - ex.y, me.x - ex.x); me.x = ex.x + Math.cos(a) * 1.45; me.y = ex.y + Math.sin(a) * 1.45; } } else if (ex.r < 0) { ex.r = C.exitR || 1.1; if (!S.dun) X.banner('THE WAY IS CLEAR', `${GUARDS[S.guard].short} falls: the door is yours`, SAFE, 2.2, true); } }
        if (C.layer) C.layer.update(dt); },
      drawGround(c) { const T = X.Tz(), W = X.W(), Hh = X.H(), t = C.t;
        drawShallow(c, X, C);
        // the water round each column's foot catches the light; caustics on the floor near the falls (GPU)
        const G = gpu(c, true); if (G) { for (const q of glows) { if (q.kind !== 'ring' && q.kind !== 'fall') continue; const Xs = X.sx(q.p.x), Ys = X.sy(q.p.y); if (Xs < -T * 3 || Xs > W + T * 3 || Ys < -T * 3 || Ys > Hh + T * 3) continue; G.Q.caustic(Xs, Ys + T * 0.05, T * 1.3, '#9FF0EA', 0.35, q.ph, 0.38); } }
        if (C.waves.length) drawWaves(c, X, C, G); gpuEnd(c, G);
        if (C.layer) C.layer.drawGround(c); },
      drawOver(c) { const T = X.Tz(), W = X.W(), Hh = X.H(), t = C.t, G = gpu(c, true);
        // the props' live light: lamps, coral polyps, the upward falls (a rising stream, spray at the basin and the crack)
        for (const q of glows) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 4 || Xs > W + T * 4 || Ys < -T * 8 || Ys > Hh + T * 6) continue;
          if (q.kind === 'lamp') { const k = 0.5 + 0.12 * Math.sin(t * 3 + q.ph); if (G) { G.Q.glow(Xs, Ys, q.r * T * 1.6, TURQ, k * 0.7); G.Q.glow(Xs, Ys, q.r * T * 0.5, '#E8FFFB', k); } else glow(c, Xs, Ys, q.r * T * 1.4, TURQ, k * 0.6); }
          else if (q.kind === 'polyp') { const k = 0.3 + 0.15 * Math.sin(t * 1.7 + q.ph); if (G) G.Q.glow(Xs, Ys, q.r * T * 1.2, TURQ, k); else glow(c, Xs, Ys, q.r * T, TURQ, k); }
          else if (q.kind === 'fall') { const fx = X.sx(p.x), fb = X.sy(p.y) - T * 0.05; if (G) { G.Q.wstream(fx, fb, fx, Ys, T * 0.2, '#7FE0E8', 0.8, q.ph, -3.5, 0.6, 0.8); G.Q.spray(fx, fb, T * 0.7, '#E8FBFF', 0.55, q.ph, 1.4, 0.6); G.Q.spray(fx, Ys + T * 0.2, T * 0.45, '#E8FBFF', 0.45, q.ph + 2, 1.1, 0.8); G.Q.glow(fx, (fb + Ys) / 2, T * 1.4, TURQ, 0.18, 2.5); }
            else { c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(220,255,252,.75)'; for (let i = 0; i < 7; i++) { const u = ((t * 0.55 + i / 7) % 1), y = lerp(fb, Ys, u); c.globalAlpha = Math.sin(u * Math.PI) * 0.8; c.beginPath(); c.arc(fx + Math.sin(i * 2.3 + t) * T * 0.06, y, Math.max(1, T * 0.05), 0, TAU); c.fill(); } c.restore(); } } }
        // drifting spores
        if (C.motes.length) { if (G) for (const e of C.motes) { const a = Math.sin(e.t / e.life * Math.PI); G.Q.glow(X.sx(e.x), X.sy(e.y), T * 0.1 * e.s, TURQ, a * 0.7); G.Q.glow(X.sx(e.x), X.sy(e.y), T * 0.03 * e.s, '#E8FFFB', a); }
          else { c.save(); c.globalCompositeOperation = 'lighter'; for (const e of C.motes) { const a = Math.sin(e.t / e.life * Math.PI), Xs = X.sx(e.x), Ys = X.sy(e.y); if (Xs < -5 || Xs > W + 5 || Ys < -5 || Ys > Hh + 5) continue; c.globalAlpha = a * 0.7; c.fillStyle = e.s > 1.1 ? '#E8FFFB' : TURQ; c.beginPath(); c.arc(Xs, Ys, Math.max(0.8, T * 0.035 * e.s), 0, TAU); c.fill(); } c.restore(); } }
        // after the sealing: the sea drains, warm sunlight pours in (shafts of light, a golden wash)
        if (C.calm > 0.02) { if (G) for (let i = 0; i < 4; i++) { const x = W * (0.15 + i * 0.25) + Math.sin(t * 0.3 + i) * T; G.Q.shafts(x, -T, x - W * 0.12, Hh * 0.9, T * 1.6, '#FFE2A0', 0.35 * C.calm, i * 1.7); } c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16 * C.calm; c.fillStyle = '#FFD890'; c.fillRect(0, 0, W, Hh); c.restore(); }
        gpuEnd(c, G);
        // the low purple ceiling: a soft band at the top of the view (never over the floor's cues)
        if (!fiend && C.calm < 0.9) { c.save(); const g = c.createLinearGradient(0, 0, 0, Hh * 0.16); g.addColorStop(0, rgba(PURPLE, 0.32 * (1 - C.calm))); g.addColorStop(1, rgba(PURPLE, 0)); c.fillStyle = g; c.fillRect(0, 0, W, Hh * 0.16); c.restore(); }
        if (C.layer) C.layer.drawOver(c); } }; };
  /* a post for a guardian: about two tiles from the exit, toward the open floor and the pet */
  function postNear(X, ex) { const me = X.me; let best = null, bs = -1e9; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, q = X.freeSpot(ex.x + Math.cos(a) * 2.4, ex.y + Math.sin(a) * 2.4, 0.7); if (!q) continue; const d = Math.hypot(q.x - ex.x, q.y - ex.y); if (d < 1.5 || d > 3.4) continue; const s = -Math.hypot(q.x - me.x, q.y - me.y) * 0.2 + (Math.hypot(q.x - me.x, q.y - me.y) > 3 ? 2 : 0); if (s > bs) { bs = s; best = q; } } return best || { x: ex.x, y: ex.y + 2.2 }; }

  /* ======================= the seal's reward: the Tidecaller's Drop (a necklace) ======================= */
  if (typeof ACC_SPECIAL !== 'undefined') ACC_SPECIAL.tide = { t: 'necklace', name: "Tidecaller's Drop", what: 'A droplet of turquoise sea glass caged in tarnished brass, a curl of tide caught inside it: the Tide Sigil of the Drowned Belfry. Held to the ear, it sounds like a far bell under water.' };
  BEL.tideAccSVG = n => { const id = `actd${n}`; return `<defs><radialGradient id="${id}" cx=".38" cy=".35"><stop offset="0" stop-color="#E8FFFB"/><stop offset=".45" stop-color="#61D9D2"/><stop offset="1" stop-color="#123C52"/></radialGradient></defs>`
    + `<path d="M11 6Q14 31 32 37Q50 31 53 6" fill="none" stroke="#2B2433" stroke-width="6.5" stroke-linecap="round"/><path d="M11 6Q14 31 32 37Q50 31 53 6" fill="none" stroke="#1C3A44" stroke-width="3.4" stroke-linecap="round"/><path d="M11 6Q14 31 32 37Q50 31 53 6" fill="none" stroke="#957943" stroke-width="1.4" stroke-dasharray="2 5"/>`
    + `<rect x="28" y="36" width="8" height="6" rx="2" fill="#957943" stroke="#2B2433" stroke-width="2"/>`
    + `<path d="M32 41C40 50 42 55 40 59.5C38 63.5 26 63.5 24 59.5C22 55 24 50 32 41Z" fill="url(#${id})" stroke="#2B2433" stroke-width="2.6" stroke-linejoin="round"/>`
    + `<path d="M26.5 56Q29 51.5 33 53.5Q36.5 55.5 34 58" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" opacity=".85"/><path d="M27 48.5L37 48.5M25.5 55L38.5 55" stroke="#957943" stroke-width="1.6" opacity=".9"/><path d="M28.5 46.5Q30 44.5 31.5 44" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`; };
  BEL.tideAccDraw = (c, x, y, s) => { c.save(); c.strokeStyle = '#2B2433'; c.lineWidth = s * 0.2; c.beginPath(); c.moveTo(x - s * 0.66, y - s * 0.8); c.quadraticCurveTo(x - s * 0.5, y + s * 0.05, x, y + s * 0.12); c.quadraticCurveTo(x + s * 0.5, y + s * 0.05, x + s * 0.66, y - s * 0.8); c.stroke(); c.strokeStyle = '#1C3A44'; c.lineWidth = s * 0.1; c.stroke();
    c.beginPath(); c.moveTo(x, y + s * 0.15); c.bezierCurveTo(x + s * 0.45, y + s * 0.55, x + s * 0.4, y + s * 0.95, x, y + s * 0.95); c.bezierCurveTo(x - s * 0.4, y + s * 0.95, x - s * 0.45, y + s * 0.55, x, y + s * 0.15); c.closePath(); const g = c.createRadialGradient(x - s * 0.1, y + s * 0.5, 0, x, y + s * 0.6, s * 0.45); g.addColorStop(0, '#E8FFFB'); g.addColorStop(0.5, '#61D9D2'); g.addColorStop(1, '#123C52'); c.fillStyle = g; c.fill(); c.strokeStyle = '#2B2433'; c.lineWidth = Math.max(1, s * 0.08); c.stroke(); c.restore(); };

  /* ======================= saves: the checkpoint scratch store and the move from the old fourteen stages ======================= */
  const BS = () => { if (typeof st === 'undefined' || !st) return null; const r = st.rift || (st.rift = { seals: {}, prog: {}, gates: {}, rlyeh: 0 }); if (!r.bel || typeof r.bel !== 'object') r.bel = {}; return r.bel; };
  BEL.cp = key => { const b = BS(); return b ? b[key] || 0 : 0; };
  BEL.setCp = (key, v) => { const b = BS(); if (!b || !/^[a-z0-9_]{1,24}$/.test(key)) return; v = Math.max(0, Math.min(9999, Math.round(+v || 0))); if (v) b[key] = v; else delete b[key]; if (typeof saveSoon === 'function') try { saveSoon(); } catch (e) {} };
  BEL.clearCp = prefix => { const b = BS(); if (!b) return; for (const k of Object.keys(b)) if (!prefix || k.indexOf(prefix) === 0) delete b[k]; };
  /* the old Belfry (v92..v390): fourteen stages, 0 F 1 CLAPPERS 2 F 3 TIDE 4 Thalassor | 5 F 6 WARDS 7 F 8 RUSH 9 Veilwrack |
     10 F 11 MOSAIC 12 F 13 Ulvora. Its checkpoint goes to the nearest safe new stage: an unfinished opening (0) starts at the
     hall; past the old opening dungeon but before its first boss (1-4) at Kharrox; the old second section (5-8) at the
     Clapper Counterweights, its boss (9) at Nhalu; the old third section (10-12) at the Rising Tide Walk, its boss (13) at
     Uldroth. A sealed Belfry stays sealed (its seal, gate and Cancer Anima are untouched). Done once: st.rift.ver.belfry = 2.
     v392 B1: the six-stage layout (v390-v391, ver 2: 0 hall 1 Kharrox 2 clappers 3 Nhalu 4 tide 5 Uldroth) gains the Drowned
     Lower Church in front: a checkpoint past the hall moves up one (keeping the player's progress); a save still in the hall
     with crystals won (st.rift.hall.belfry) keeps its place in the hall (1); one that had not begun starts at the church (0).
     The fourteen-stage saves map as above, then the same way. A sealed Belfry stays sealed. Now st.rift.ver.belfry = 3 */
  BEL.mapOld = p => (p <= 0 ? 0 : p <= 4 ? 1 : p <= 8 ? 2 : p === 9 ? 3 : p <= 12 ? 4 : 5);
  /* v394 B1: the seven-stage layout (v392-v393, ver 3: 0 church 1 hall 2 Kharrox 3 clappers 4 Nhalu 5 tide 6 Uldroth) becomes
     eight (0 D1 1 hall 2 Kharrox 3 D2 4 clappers 5 Nhalu 6 D3 7 Uldroth): the church is dungeon 1, a checkpoint at the
     clappers starts dungeon 2 (3), Nhalu stays Nhalu (5), the retired Rising Tide Walk becomes dungeon 3 (6), Uldroth stays
     Uldroth (7). Older saves map to the seven-stage layout as above first. A sealed Belfry stays sealed (its seal, gate and
     Cancer Anima untouched). The retired tide stage's checkpoints go. Now st.rift.ver.belfry = 4 */
  BEL.map3 = p => [0, 1, 2, 3, 5, 6, 7][Math.max(0, Math.min(6, p | 0))];
  BEL.VER = 4;
  BEL.migrate = (s, o) => { const r = s && s.rift; if (!r) return; if (!r.ver || typeof r.ver !== 'object') r.ver = {}; if (!r.bel || typeof r.bel !== 'object') r.bel = {};
    const was = o && o.rift && o.rift.ver && +o.rift.ver.belfry || 0; if (was >= 4) { r.ver.belfry = 4; return; }
    const sealed = !!(r.seals && r.seals.belfry);
    if (r.prog && r.prog.belfry != null) { let p = r.prog.belfry | 0;
      if (was < 3) { if (was < 2) { p = BEL.mapOld(p); r.bel = {}; }
        const h = r.hall && r.hall.belfry, inHall = !!(h && (h.dep || h.earn || h.carry || h.sel || h.door));
        p = Math.min(6, p > 0 ? p + 1 : inHall ? 1 : 0); }
      r.prog.belfry = sealed ? 0 : BEL.map3(p); }
    else if (was === 2 && r.hall && r.hall.belfry && !sealed) { const h = r.hall.belfry; if (h.dep || h.earn || h.carry || h.sel || h.door) { r.prog = r.prog || {}; r.prog.belfry = 1; } }
    if (was < 2) r.bel = {}; for (const k of Object.keys(r.bel)) if (k.indexOf('tide') === 0) delete r.bel[k];
    r.ver.belfry = 4; };
  if (typeof window !== 'undefined') window.belfryMigrate = BEL.migrate;

  /* ======================= the loading screen's warm-up (as the Caldera's): the brood in every pose, the patterns, the tower ======================= */
  BEL.MODES = { crawler: ['', 'side', 'raise', 'pinch'], leech: ['', 'cling', 'spit'], reeflantern: ['', 'bright', 'pulse'] };
  Rf.preload = P => { if (typeof window !== 'undefined' && window.__BEL_WARM === 0) return []; const jobs = [], job = f => jobs.push(() => { try { f(); } catch (e) {} });
    const sizes = new Set(); for (const m of (P.mons || []).concat(P.reserve || [])) if (!m.dead && BEL.MODES[m.type]) sizes.add(m.type + '|' + Math.round(m.r * P.T * P.k) + '|' + m.color);
    for (const t of Object.keys(BEL.MODES)) sizes.add(t + '|' + Math.round(P.monPx ? P.monPx(t) : MON[t].r * P.T * P.k) + '|' + MON[t].color);
    for (const key of sizes) { const [t, rpx, col] = key.split('|'), nf = NF[t] || 4; for (const md of BEL.MODES[t]) job(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, +rpx, (f + 0.5) / nf, col, md, false); }); job(() => { for (let f = 0; f < nf; f++) DunArt.monSprite(t, +rpx, (f + 0.5) / nf, col, '', true); }); }
    job(() => { DunWorld.pattern('belsea', 1); DunWorld.pattern('belcaustic', 1); if (P.k >= 1.5) DunWorld.pattern('belsea', P.k); for (const col of [TURQ, '#E8FFFB', '#9FE8D8', '#FFF4C0', '#BFEFFF', '#B6A2F0', PURPLE, '#FFD27A', GOLD, SAFE, WARN]) glowSprite(col); });
    job(() => { towerSprite((P.Tz ? P.Tz() : P.T) * 0.9, 0); });
    job(() => { const G = gpu(P.c, false); if (!G) return; const Q = G.Q, W = 64; Q.glow(W, W, 20, TURQ, 0.002); if (Q.wstream) Q.wstream(W, W, W, W - 30, 6, '#7FE0E8', 0.002, 1, -3, 0.6, 0.8); if (Q.spray) Q.spray(W, W, 10, '#E8FBFF', 0.002, 1, 1, 0.6); if (Q.caustic) Q.caustic(W, W, 10, '#9FF0EA', 0.002, 1, 0.4); if (Q.wsphere) Q.wsphere(W, W, 10, '#7FE8E0', 0.002, 1, 0, 0.35, 0.9); gpuEnd(P.c, G); });
    return jobs; };
})();
