/* ---------- Wind ultimate: Winds of Oblivion (replaces Horizon Severance) ----------
   Row in 20k1: key 'oblivion', cost 100, cd 60, glyph 'feather'. An enemy debuff and dispel; it deals no damage itself.
   The cast: the pet draws a breath (a small squash) and exhales a pale emerald breeze; its streaks curl outward into one
   expanding halo that sweeps the floor from the pet (radius 5 / 6 / 7 x K at levels 1 / 4 / 7, interpolated: 5 + (evo - 1) / 3
   tiles, in 1.25 s, eased out). The halo: a feathered ring of light on the floor (light-only) with a slowly turning
   circle of wind runes behind its front, a ring of hanging wind chimes (cached metal-and-glass sprites that sway, the
   more while the front races, and glint) and spectral feathers riding the front; back halves are drawn under the
   monsters, front halves over them, dimmed near the pet. After the front stops it turns on a moment and fades upward.
   Windworn: every monster the front passes (its centre within the front, or within the full radius at the end) is
   marked for 10 / 14 / 17 s (interpolated: 10 + 4/3 per level to Adept, then +1 per level). Stored on the monster:
   m.wornUntil (game clock g.t), m.wornT0 (first marking, for the visuals). Recasting refreshes the time; the
   reductions never stack (each hook is a plain on/off test of wornUntil > g.t). The mark stays wherever it goes.
   The hooks (20b-game-dungeon.js):
     - attack power -25%: hurtPet multiplies by 0.75 a hit whose source is a Windworn monster (bosses too). The source is
       the hit's src when it names a monster, else the monster in whose name the code runs: byRun() runs each monster's
       turn (and timers it set) with `wornBy` set and stamps what that turn added to eshots / zones (b.wby / z.wby); the
       shot and zone loops set wornBy while they resolve a hit.
     - defence -25%: hitMon multiplies every allied hit on a Windworn non-boss by 1.25 (+25%), damage over time included
       (not a flat share). Bosses keep their defence (the spec names only attack power for them).
     - attack speed -20%: a Windworn non-boss's `slow` (its timers: m.cd, every AI timer through A.dt) x0.8, and its
       contact-attack cooldown (m.atkCd) ticks at 0.8.
     - movement -30%: its walking speed A.sp x0.875 on top of that 0.8 (0.8 x 0.875 = 0.7). Charges and dashes that move by
       A.dt alone run at 0.8 with the rest of its timing.
     - bosses keep their scripted movement and attack timing (none of the speed hooks touch updBoss) and only lose attack power.
   Dispel on marking (each marking, so a refresh dispels again): up to 1 removable beneficial effect per monster (2 from
   Adept), shields first, then attack buffs, then speed buffs. What the game has that is explicitly removable:
     shields: m.shield (the Shielded elite's bubble pool and the 'shield' kit move; stripping it sets the 4 s regen delay a
       break sets), m.block (the crab's raised guard);
     attack buffs: none exist in the game today;
     speed buffs: m.hasted (the 'howl' kit move's 3 s haste and the totem's aura).
   Generic hook for future buffs: an entry { kind: 'shield' | 'atk' | 'speed', strip(m) } in m.mbuffs is removable by its
   kind's priority (strip is called, the entry dropped). Never removed: elite affixes (innate), boss phases and rages,
   a Super Fiend's or rift boss's scripted shields / guards / invulnerability.
   Celestial: an affected monster takes no new removable buff for 5 s (m.noBuffUntil = g.t + 5; checked where those buffs
   are applied: the shield kit move, the Shielded regen, howl, the totem aura (20d-dun-ai.js) and the crab's guard (20b)).
   The signature dispel: the stripped buff's symbol (a shield, a blade, a winged chevron in the buff's own colour) is torn
   off the monster on two snapping currents, held in a tiny wind spiral as it cracks, then shatters into luminous dust.
   While Windworn: a broken wind sigil hovers over the monster (a cached cracked rune, a faint pulse) and tattered emerald
   ribbons stream from it on the halo's wind (a short trail of 6 samples, two strands, feathered). Thin currents peel
   glowing fragments off each monster as the front passes. The marks fade in over 0.3 s and dissolve over the last 0.5 s,
   ending exactly at the debuff's end; a monster's death drops its marks at once (a puff of dust).
   Lifetimes: the wave is one fx (3.1 s); the marks live in one persistent fx per floor's fx list (it ends when no monster
   is Windworn and no dispel is playing). Everything (fields on monsters) is cleared at expiry, death and with the floor.
   Performance: every soft shape is a cached sprite (ring, rune circle, chimes x3, feathers x2, glint, sigil, three buff
   symbols, a shard atlas) baked lazily a step at a time (or in idle time via U.oblivion.warm); per frame only blits and
   a few short ribbon strokes; no gradients, no shadowBlur. */
(() => {
  const U = ELEM_IMPL.wind.ult; delete U.severance;
  const TAU = Math.PI * 2, GY = 0.55;
  const MINT = '#73E8B6', EMER = '#16A57B', DEEP = '#0B5E48', PALE = '#E7FFF6', WHITE = '#FFFFFF';
  const SYMCOL = { shield: '#8FE3F0', atk: '#FF9F7A', speed: '#B983F5' };
  const cl = u => u < 0 ? 0 : u > 1 ? 1 : u, lerp = (a, b, u) => a + (b - a) * u, sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
  const eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, eout3 = u => { u = cl(u); return 1 - Math.pow(1 - u, 3); };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  const rgbaS = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const evoOf = C => Math.max(1, Math.min(7, C.evo || 1));
  const durOf = ev => (ev <= 4 ? 10 + (ev - 1) * 4 / 3 : 14 + (ev - 4));
  let H;

  /* ---- the bake queue: pictures painted a step at a time, never all at once ---- */
  const BK = { q: [], keys: new Set(), done: new Map(), ms: 0, maxSlice: 0, job: null };
  const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return cv; };
  function want(key) { const s = BK.done.get(key); if (s) return s; if (!BK.keys.has(key) && BAKE[key]) { BK.keys.add(key); BK.q.push(key); } return null; }
  function bakeStep(budget) { const t0 = performance.now(); while ((BK.job || BK.q.length) && performance.now() - t0 < budget) { const s = performance.now();
      if (BK.job) { const j = BK.job; j.step(j.i++); if (j.i >= j.n) { finish(j.key, j.cv); BK.job = null; } }
      else { const k = BK.q.shift(), r = BAKE[k](); if (r.step) { r.key = k; r.i = 0; BK.job = r; } else finish(k, r); }
      const d = performance.now() - s; BK.ms += d; if (d > BK.maxSlice) BK.maxSlice = d; } }
  function finish(k, cv) { BK.done.set(k, cv); if (typeof createImageBitmap === 'function') createImageBitmap(cv).then(bm => { if (BK.done.get(k) === cv) BK.done.set(k, bm); }, () => {}); }
  const ORDER = ['ring', 'sigil', 'feather0', 'feather1', 'chime0', 'chime1', 'chime2', 'glint', 'shards', 'sym_shield', 'sym_atk', 'sym_speed', 'runes'];
  function wantAll() { for (const k of ORDER) want(k); }

  function radialBake(stops, S) { const cv = mk(S, S), g = cv.getContext('2d'), gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); for (const [u, c] of stops) gr.addColorStop(u, c); g.fillStyle = gr; g.fillRect(0, 0, S, S); return cv; }
  /* a stroke in nested passes, wide and faint to narrow and bright, so it has no hard edge */
  function soft(g, path, passes) { for (const [col, a, w] of passes) { g.strokeStyle = rgbaS(col, a); g.lineWidth = w; g.beginPath(); path(g); g.stroke(); } }

  /* a wind chime: a hook, a metal cap, hanging tubes on threads and a glass feather pendant, anchored at (32, 6) */
  const CW = 64, CH = 168;
  function chimeBake(v) { const cv = mk(CW, CH), g = cv.getContext('2d'), n = [3, 4, 5][v];
    return { cv, n: 3, step(i) { g.lineCap = 'round'; g.lineJoin = 'round';
      if (i === 0) {   // the hook, its thread, the cap
        g.strokeStyle = rgbaS(DEEP, 0.7); g.lineWidth = 3; g.beginPath(); g.arc(32, 7, 4, 0, TAU); g.stroke(); g.strokeStyle = '#D8F5EA'; g.lineWidth = 1.5; g.stroke();
        g.strokeStyle = 'rgba(220,245,235,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(32, 11); g.lineTo(32, 19); g.stroke();
        const gr = g.createLinearGradient(0, 16, 0, 28); gr.addColorStop(0, '#F4FFFA'); gr.addColorStop(0.35, '#A9DCCB'); gr.addColorStop(0.8, '#3E8F78'); gr.addColorStop(1, '#1D5C4C');
        g.fillStyle = gr; g.beginPath(); g.ellipse(32, 23, 21, 5.5, 0, 0, TAU); g.fill(); g.strokeStyle = rgbaS(DEEP, 0.8); g.lineWidth = 1.2; g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.7)'; g.beginPath(); g.ellipse(27, 21.2, 9, 1.6, -0.05, 0, TAU); g.fill(); }
      else if (i === 1) {   // the tubes on their threads (a dark edge, a mint-silver body, a bright highlight, an emerald foot)
        for (let k = 0; k < n; k++) { const x = 15 + (n === 1 ? 17 : k * 34 / (n - 1)), L = 54 + 40 * R1(k * 3.1 + v * 7) + (k === (n >> 1) ? 0 : 10 * Math.abs(k - (n - 1) / 2) / n), y0 = 34 + 4 * R1(k + v), w = n >= 5 ? 4.4 : 5.2;
          g.strokeStyle = 'rgba(220,245,235,0.65)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(32 + (x - 32) * 0.7, 27); g.lineTo(x, y0); g.stroke();
          const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, '#2B5A50'); gr.addColorStop(0.2, '#B9DCD2'); gr.addColorStop(0.36, '#FFFFFF'); gr.addColorStop(0.52, '#E4F7F0'); gr.addColorStop(0.8, '#7FB3A5'); gr.addColorStop(1, '#244C43');
          g.fillStyle = gr; g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, y0, w, L, w / 2) : g.rect(x - w / 2, y0, w, L); g.fill();
          const gf = g.createLinearGradient(0, y0 + L * 0.6, 0, y0 + L); gf.addColorStop(0, 'rgba(22,165,123,0)'); gf.addColorStop(1, 'rgba(22,165,123,0.35)'); g.fillStyle = gf; g.fillRect(x - w / 2, y0 + L * 0.6, w, L * 0.4);
          g.strokeStyle = rgbaS(DEEP, 0.55); g.lineWidth = 0.8; g.beginPath(); g.roundRect ? g.roundRect(x - w / 2, y0, w, L, w / 2) : g.rect(x - w / 2, y0, w, L); g.stroke(); } }
      else {   // the clapper and the glass feather pendant
        g.strokeStyle = 'rgba(220,245,235,0.75)'; g.lineWidth = 1; g.beginPath(); g.moveTo(32, 27); g.lineTo(32, 118); g.stroke();
        const gd = g.createRadialGradient(30, 78, 0.5, 32, 80, 6); gd.addColorStop(0, '#FFFFFF'); gd.addColorStop(0.5, '#9AD9C3'); gd.addColorStop(1, '#245E50'); g.fillStyle = gd; g.beginPath(); g.ellipse(32, 80, 6, 3, 0, 0, TAU); g.fill();
        const top = 118, bot = 162; g.beginPath(); g.moveTo(32, top); g.bezierCurveTo(44, top + 10, 42, bot - 12, 32, bot); g.bezierCurveTo(22, bot - 12, 20, top + 10, 32, top); g.closePath();
        const gg = g.createLinearGradient(22, top, 42, bot); gg.addColorStop(0, 'rgba(231,255,246,0.95)'); gg.addColorStop(0.35, 'rgba(115,232,182,0.55)'); gg.addColorStop(0.8, 'rgba(22,165,123,0.7)'); gg.addColorStop(1, 'rgba(11,94,72,0.85)');
        g.fillStyle = gg; g.fill(); g.strokeStyle = 'rgba(231,255,246,0.8)'; g.lineWidth = 1; g.stroke();
        g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(32, top + 3); g.quadraticCurveTo(30, (top + bot) / 2, 32, bot - 3); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath(); g.ellipse(28.5, top + 11, 1.6, 4, 0.25, 0, TAU); g.fill(); } } }; }
  /* a spectral feather, vertical (quill at the bottom), its barbs fading to nothing at the vane's edge */
  const FW = 48, FH = 128;
  function featherBake(v) { const cv = mk(FW, FH), g = cv.getContext('2d'), bend = v ? -5 : 5, at = u => [FW / 2 + bend * Math.sin(u * Math.PI * 0.9), FH - 8 - u * (FH - 16)];
    return { cv, n: 2, step(i) { g.lineCap = 'round';
      if (i === 0) { // the vane's soft body, then the barbs
        for (const [a, wk] of [[0.1, 1], [0.16, 0.7]]) { g.fillStyle = rgbaS(EMER, a); g.beginPath(); for (let k = 0; k <= 30; k++) { const u = 0.1 + 0.9 * k / 30, p = at(u), w = 15 * wk * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.75); k ? g.lineTo(p[0] - w, p[1] - 4) : g.moveTo(p[0] - w, p[1] - 4); } for (let k = 30; k >= 0; k--) { const u = 0.1 + 0.9 * k / 30, p = at(u), w = 15 * wk * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.75); g.lineTo(p[0] + w, p[1] - 4); } g.closePath(); g.fill(); }
        for (let k = 0; k < 64; k++) { const u = 0.12 + 0.86 * k / 64, p = at(u), side = k & 1 ? 1 : -1, w = 16 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05)), 0.75) * (0.8 + 0.3 * R1(k * 1.7 + v)), gap = R1(k * 3.3 + v * 5) < 0.12;
          if (gap) continue; const ex = p[0] + side * w, ey = p[1] - w * 0.55, gr = g.createLinearGradient(p[0], p[1], ex, ey); gr.addColorStop(0, 'rgba(231,255,246,0.55)'); gr.addColorStop(0.55, 'rgba(115,232,182,0.32)'); gr.addColorStop(1, 'rgba(115,232,182,0)');
          g.strokeStyle = gr; g.lineWidth = 1.3; g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + side * w * 0.55, p[1] - w * 0.15, ex, ey); g.stroke(); } }
      else { // the rachis: bright, tapering to the tip; the quill a little darker
        for (const [col, a, w] of [[MINT, 0.25, 4], [PALE, 0.85, 1.7]]) { for (let k = 0; k < 24; k++) { const u0 = k / 24, u1 = (k + 1) / 24, p0 = at(u0), p1 = at(u1); g.strokeStyle = rgbaS(col, a * (1 - 0.5 * u0) * Math.min(1, (1 - u0) * 6)); g.lineWidth = w * (1 - 0.65 * u0); g.beginPath(); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.stroke(); } } } } }; }
  /* a glint: a four-pointed star of light */
  function glintBake() { const S = 64, cv = mk(S, S), g = cv.getContext('2d'), c = S / 2;
    const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.12, 'rgba(231,255,246,0.7)'); gr.addColorStop(0.35, 'rgba(115,232,182,0.15)'); gr.addColorStop(1, 'rgba(115,232,182,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S);
    for (const [rx, ry] of [[c, 2.2], [2.2, c], [c * 0.5, 1.4], [1.4, c * 0.5]]) { const k = rx > ry ? 1 : 0; g.save(); g.translate(c, c); if (rx === c * 0.5 || ry === c * 0.5) g.rotate(Math.PI / 4); const gl = k ? g.createLinearGradient(-rx, 0, rx, 0) : g.createLinearGradient(0, -ry, 0, ry); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gl; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, TAU); g.fill(); g.restore(); }
    return cv; }
  /* the wind rune: a ring and a three-armed wind curl; the broken sigil is the rune split along a jagged crack */
  function runeGlyph(g, cx, cy, R, passes) {
    soft(g, gg => gg.arc(cx, cy, R, 0, TAU), passes);
    soft(g, gg => gg.arc(cx, cy, R * 0.8, -2.6, -0.5), passes.map(([c, a, w]) => [c, a * 0.6, w * 0.6]));
    soft(g, gg => gg.arc(cx, cy, R * 0.8, 0.55, 2.55), passes.map(([c, a, w]) => [c, a * 0.6, w * 0.6]));
    // three gusts: wavy strokes, each ending in a curl (the top and bottom curl right, the middle left)
    for (let k = -1; k <= 1; k++) { const y0 = cy + k * R * 0.36, x0 = cx - R * 0.62 + (k ? 0 : R * 0.2), x1 = cx + R * 0.38 - (k ? 0 : R * 0.15), dir = k ? 1 : -1, rc = R * (k ? 0.17 : 0.15);
      soft(g, gg => { const L = 14; for (let j = 0; j <= L; j++) { const u = j / L, x = dir > 0 ? lerp(x0, x1, u) : lerp(x1 + R * 0.24, x0 - R * 0.05, u), y = y0 + Math.sin(u * Math.PI * 1.5) * R * 0.05; j ? gg.lineTo(x, y) : gg.moveTo(x, y); }
        const ex = dir > 0 ? x1 : x0 - R * 0.05, ccx = ex, ccy = y0 - rc; for (let j = 1; j <= 12; j++) { const u = j / 12, a = Math.PI / 2 - dir * u * 4.2, r = rc * (1 - 0.55 * u); gg.lineTo(ccx + Math.cos(a) * r * dir, ccy + Math.sin(a) * r); } }, passes); } }
  const SG = 112;
  function sigilBake() { const cv = mk(SG, SG), g = cv.getContext('2d'), c = SG / 2, R = 40;
    return { cv, n: 3, step(i) {
      if (i === 0) { const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, 'rgba(11,94,72,0.5)'); gr.addColorStop(0.55, 'rgba(11,94,72,0.32)'); gr.addColorStop(0.75, 'rgba(22,165,123,0.12)'); gr.addColorStop(1, 'rgba(22,165,123,0)'); g.fillStyle = gr; g.fillRect(0, 0, SG, SG); }
      else if (i === 1) {   // the rune drawn once into a scratch canvas, then its two halves set down apart along the crack
        const tmp = mk(SG, SG), t = tmp.getContext('2d'); t.lineCap = 'round'; t.lineJoin = 'round';
        runeGlyph(t, c, c, R, [[DEEP, 0.45, 8], [EMER, 0.5, 5], [MINT, 0.75, 2.8], [PALE, 0.95, 1.2]]);
        const crack = [[c + 14, 2], [c + 5, c - 24], [c + 12, c - 10], [c - 2, c + 2], [c + 6, c + 14], [c - 8, c + 26], [c - 4, SG - 2]];
        const half = (side) => { g.save(); g.beginPath(); g.moveTo(side < 0 ? 0 : SG, 0); crack.forEach(p => g.lineTo(p[0], p[1])); g.lineTo(side < 0 ? 0 : SG, SG); g.closePath(); g.clip(); g.translate(c, c); g.rotate(side * 0.12); g.translate(-c + side * 5, -c + side * 3.5); g.drawImage(tmp, 0, 0); g.restore(); };
        half(-1); half(1); BK.crack = crack; }
      else { const crack = BK.crack || []; g.lineCap = 'round'; g.lineJoin = 'round';   // the crack's glowing seam
        soft(g, gg => crack.forEach((p, j) => (j ? gg.lineTo(p[0], p[1]) : gg.moveTo(p[0], p[1]))), [[MINT, 0.22, 8], [PALE, 0.6, 3], [WHITE, 0.95, 1.2]]);
        for (let k = 0; k < 5; k++) { const a = R1(k * 2.9) * TAU, r = R * (0.85 + 0.35 * R1(k * 5.1)); g.fillStyle = rgbaS(PALE, 0.8); g.beginPath(); g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 1.3, 0, TAU); g.fill(); } } } }; }
  /* the buff symbols, each in its own colour with a soft halo: a heater shield, a blade, a winged double chevron */
  const SY = 96;
  function symBake(kind) { const cv = mk(SY, SY), g = cv.getContext('2d'), c = SY / 2, col = SYMCOL[kind], [r0, g0, b0] = hexRGB(col);
    const gr = g.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, `rgba(${r0},${g0},${b0},0.45)`); gr.addColorStop(0.5, `rgba(${r0},${g0},${b0},0.16)`); gr.addColorStop(1, `rgba(${r0},${g0},${b0},0)`); g.fillStyle = gr; g.fillRect(0, 0, SY, SY);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const body = (path, light) => { path(); const gb = g.createLinearGradient(c - 20, c - 26, c + 20, c + 26); gb.addColorStop(0, '#FFFFFF'); gb.addColorStop(0.3, light); gb.addColorStop(0.75, col); gb.addColorStop(1, `rgb(${r0 * 0.45 | 0},${g0 * 0.45 | 0},${b0 * 0.45 | 0})`); g.fillStyle = gb; g.fill(); g.strokeStyle = `rgba(${r0 * 0.3 | 0},${g0 * 0.3 | 0},${b0 * 0.3 | 0},0.85)`; g.lineWidth = 2; g.stroke(); g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1; g.stroke(); };
    if (kind === 'shield') { const P = () => { g.beginPath(); g.moveTo(c, c - 26); g.quadraticCurveTo(c + 12, c - 20, c + 22, c - 21); g.quadraticCurveTo(c + 22, c + 6, c, c + 28); g.quadraticCurveTo(c - 22, c + 6, c - 22, c - 21); g.quadraticCurveTo(c - 12, c - 20, c, c - 26); g.closePath(); }; body(P, '#DDFBFF');
      g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(c, c - 18); g.lineTo(c, c + 18); g.moveTo(c - 14, c - 8); g.lineTo(c + 14, c - 8); g.stroke(); }
    else if (kind === 'atk') { const P = () => { g.beginPath(); g.moveTo(c, c - 30); g.lineTo(c + 6, c - 20); g.lineTo(c + 5, c + 10); g.lineTo(c + 16, c + 10); g.lineTo(c + 16, c + 15); g.lineTo(c + 4, c + 15); g.lineTo(c + 4, c + 27); g.lineTo(c - 4, c + 27); g.lineTo(c - 4, c + 15); g.lineTo(c - 16, c + 15); g.lineTo(c - 16, c + 10); g.lineTo(c - 5, c + 10); g.lineTo(c - 6, c - 20); g.closePath(); }; body(P, '#FFE8DC');
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(c, c - 26); g.lineTo(c, c + 8); g.stroke(); }
    else { const P = () => { g.beginPath(); for (const dy of [-12, 6]) { g.moveTo(c - 18, c + dy - 4); g.lineTo(c, c + dy - 18); g.lineTo(c + 18, c + dy - 4); g.lineTo(c + 18, c + dy + 4); g.lineTo(c, c + dy - 10); g.lineTo(c - 18, c + dy + 4); g.closePath(); } }; body(P, '#EFE2FF');
      for (const s of [-1, 1]) { g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 1.4; g.beginPath(); for (let k = 0; k < 3; k++) { g.moveTo(c + s * 20, c + 8 + k * 5); g.quadraticCurveTo(c + s * (28 + k * 2), c + 6 + k * 5, c + s * (32 - k * 3), c + 14 + k * 6); } g.stroke(); } }
    return cv; }
  /* shards: 3 shapes x 4 colours (mint for the peeled fragments, then the three buff colours), 24 px cells */
  const SHC = 24, SHCOL = [MINT, SYMCOL.shield, SYMCOL.atk, SYMCOL.speed];
  function shardsBake() { const cv = mk(SHC * 3, SHC * 4), g = cv.getContext('2d');
    SHCOL.forEach((col, j) => { for (let i = 0; i < 3; i++) { const x = i * SHC + SHC / 2, y = j * SHC + SHC / 2, pts = [[[-7, -5], [8, -2], [-1, 7]], [[-4, -8], [6, -3], [3, 7], [-6, 3]], [[-8, 0], [0, -6], [7, 2], [0, 5]]][i];
      const gl = g.createRadialGradient(x, y, 0, x, y, SHC / 2); gl.addColorStop(0, rgbaS(col, 0.5)); gl.addColorStop(1, rgbaS(col, 0)); g.fillStyle = gl; g.fillRect(x - SHC / 2, y - SHC / 2, SHC, SHC);
      g.beginPath(); pts.forEach((p, k) => (k ? g.lineTo(x + p[0], y + p[1]) : g.moveTo(x + p[0], y + p[1]))); g.closePath(); g.fillStyle = rgbaS(col, 0.9); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 1; g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(x + pts[0][0] * 0.4, y + pts[0][1] * 0.4, 1.2, 0, TAU); g.fill(); } });
    return cv; }
  /* the circle of wind runes behind the front: two thin rings, sixteen small wind curls and broken arcs between */
  const RW = 512, RC = RW / 2, RR = 236;
  function runesBake() { const cv = mk(RW, RW), g = cv.getContext('2d');
    return { cv, n: 4, step(i) { g.lineCap = 'round'; g.lineJoin = 'round'; const P = [[MINT, 0.07, 9], [MINT, 0.16, 4], [PALE, 0.55, 1.4]];
      if (i === 0) { soft(g, gg => gg.arc(RC, RC, RR, 0, TAU), P); soft(g, gg => gg.arc(RC, RC, RR - 34, 0, TAU), [[MINT, 0.06, 7], [PALE, 0.35, 1.1]]); }
      else if (i < 3) { for (let k = (i - 1) * 8; k < i * 8; k++) { const a = k / 16 * TAU, r = RR - 17, x = RC + Math.cos(a) * r, y = RC + Math.sin(a) * r, s = 9;
          soft(g, gg => { for (let j = 0; j <= 10; j++) { const u = j / 10, b = a + Math.PI / 2 + u * 3.6, rr = s * (1 - 0.75 * u); const px = x + Math.cos(b) * rr - Math.cos(a + Math.PI / 2) * s * 0.4, py = y + Math.sin(b) * rr - Math.sin(a + Math.PI / 2) * s * 0.4; j ? gg.lineTo(px, py) : gg.moveTo(px, py); } }, [[MINT, 0.12, 5], [PALE, 0.6, 1.4]]); } }
      else { for (let k = 0; k < 16; k++) { const a = (k + 0.5) / 16 * TAU, sp = 0.09 + 0.05 * R1(k); soft(g, gg => gg.arc(RC, RC, RR - 17, a - sp, a + sp), [[MINT, 0.1, 4], [PALE, 0.4, 1.1]]); } } } }; }
  const BAKE = {
    ring: () => radialBake([[0, 'rgba(115,232,182,0)'], [0.82, 'rgba(115,232,182,0)'], [0.91, 'rgba(22,165,123,0.1)'], [0.95, 'rgba(115,232,182,0.42)'], [0.972, 'rgba(231,255,246,0.9)'], [0.988, 'rgba(231,255,246,0.18)'], [1, 'rgba(231,255,246,0)']], 512),
    wash: () => radialBake([[0, 'rgba(231,255,246,0.12)'], [0.6, 'rgba(115,232,182,0.08)'], [0.9, 'rgba(22,165,123,0.05)'], [1, 'rgba(22,165,123,0)']], 128),
    puff: () => radialBake([[0, 'rgba(255,255,255,0.9)'], [0.25, 'rgba(231,255,246,0.6)'], [0.6, 'rgba(115,232,182,0.2)'], [1, 'rgba(115,232,182,0)']], 96),
    chime0: () => chimeBake(0), chime1: () => chimeBake(1), chime2: () => chimeBake(2), feather0: () => featherBake(0), feather1: () => featherBake(1),
    glint: glintBake, sigil: sigilBake, runes: runesBake, shards: shardsBake, sym_shield: () => symBake('shield'), sym_atk: () => symBake('atk'), sym_speed: () => symBake('speed'),
  };
  ORDER.push('wash', 'puff');
  let warmT = 0;
  const warm = () => { wantAll(); if (warmT || !(BK.q.length || BK.job)) return; const step = () => { bakeStep(4); warmT = BK.q.length || BK.job ? setTimeout(step, 40) : 0; }; warmT = setTimeout(step, 60); };

  /* ---- the removable buffs, in priority order: [kind, has(m), strip(m)] ---- */
  const BUFFS = [
    ['shield', m => m.shield > 0, m => { m.shield = 0; m.shieldT = 4; }],
    ['shield', m => m.block > 0, m => { m.block = 0; m.blockCd = Math.max(m.blockCd || 0, 2); }],
    ['shield', m => hasMB(m, 'shield'), m => stripMB(m, 'shield')],
    ['atk', m => hasMB(m, 'atk'), m => stripMB(m, 'atk')],
    ['speed', m => m.hasted > 0, m => { m.hasted = 0; }],
    ['speed', m => hasMB(m, 'speed'), m => stripMB(m, 'speed')],
  ];
  function hasMB(m, k) { const L = m.mbuffs; if (!L) return false; for (const b of L) if (b && b.kind === k) return true; return false; }
  function stripMB(m, k) { const L = m.mbuffs, i = L.findIndex(b => b && b.kind === k); if (i < 0) return; const b = L[i]; L.splice(i, 1); if (b.strip) b.strip(m); }
  function dispel(m, n) { const out = []; for (const [kind, has, strip] of BUFFS) { if (out.length >= n) break; if (has(m)) { strip(m); out.push(kind); } } return out; }

  /* ================= the marks: one persistent fx per floor's fx list ================= */
  const MGR = new WeakMap();
  function manager() {
    let M = MGR.get(H.fx); if (M && M.life > 0 && H.fx.indexOf(M) >= 0) return M;
    const me = H.me, g = H.g, recs = new Map(), anims = [], parts = [];
    const NS = 7, SAMP = 0.1;
    function clearRec(m) { delete m.wornUntil; delete m.wornT0; delete m.noBuffUntil; }
    function puff(x, y, z, n, col) { for (let i = 0; i < H.n(n); i++) { const a = Math.random() * TAU, v = 0.4 + Math.random() * 0.9; parts.push({ k: 0, x, y, z, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: 0.4 + Math.random() * 0.8, life: 0.5 + Math.random() * 0.5, max: 1, s: 0.08 + Math.random() * 0.08, col: col || MINT }); } }
    M = H.add({ life: 1e9, key: 'oblivionWorn', recs, anims, parts,
      mark(m, o) { const now = g.t, was = m.wornUntil > now; m.wornUntil = now + o.dur; if (!was || m.wornT0 == null) m.wornT0 = now; if (o.cel) m.noBuffUntil = now + 5;
        let q = recs.get(m); if (!q) { q = { m, ph: Math.random() * TAU, pts: [], st: 0, ang: o.ang, fl: now }; recs.set(m, q); } q.ang = o.ang; q.fl = now;
        const z0 = (m.z || 0) + (m.liftZ || 0) + m.r;
        // the peel: thin currents curl off it and glowing fragments tear away on the wind
        for (let i = 0; i < H.n(m.boss ? 9 : 5); i++) { const a = o.ang + (Math.random() - 0.5) * 1.6, v = 1.6 + Math.random() * 2.2; parts.push({ k: 1, sh: Math.floor(Math.random() * 3), row: 0, x: m.x + (Math.random() - 0.5) * m.r, y: m.y + (Math.random() - 0.5) * m.r * 0.6, z: z0 * (0.4 + Math.random() * 0.9), vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, vz: 0.6 + Math.random() * 1.4, life: 0.55 + Math.random() * 0.4, max: 0.95, s: 0.1 + Math.random() * 0.07, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 12 }); }
        for (let i = 0; i < 3; i++) parts.push({ k: 2, m, x: m.x, y: m.y, z: z0, a0: o.ang + (i - 1) * 0.9, life: 0.6, max: 0.6, ph: i * 2.1, sgn: i % 2 ? 1 : -1 });
        // the dispel: each stripped buff's symbol
        const got = dispel(m, o.n); got.forEach((kind, i) => anims.push({ m, kind, t: -i * 0.18, x: m.x, y: m.y, z: z0, ang: o.ang + (i ? 0.7 : -0.25), cr: Math.random() * 9, shattered: false }));
        if (got.length) { M.dispels = (M.dispels || 0) + got.length; }
        return got; },
      update(dt, f) { const now = g.t;
        for (const [m, q] of recs) {
          if (m.dead || m.falling != null) { puff(m.x, m.y, (m.z || 0) + m.r * 1.6, 6); clearRec(m); recs.delete(m); continue; }
          if (!(m.wornUntil > now)) { clearRec(m); recs.delete(m); continue; }
          q.st -= dt; if (q.st <= 0) { q.st = SAMP; q.pts.unshift({ x: m.x, y: m.y, z: (m.z || 0) + (m.liftZ || 0), age: 0 }); if (q.pts.length > NS) q.pts.length = NS; }
          for (const p of q.pts) p.age += dt;
          // the sigil crumbles in its last half second (motes off its rim), gone exactly at the end
          const left = m.wornUntil - now; if (left < 0.5 && Math.random() < dt * 14 * H.Q()) { const zz = (m.z || 0) + (m.liftZ || 0) + m.r * 2.1 + 0.45; parts.push({ k: 0, x: m.x + (Math.random() - 0.5) * 0.4, y: m.y, z: zz, vx: (Math.random() - 0.5) * 0.6, vy: 0, vz: 0.5 + Math.random() * 0.5, life: 0.5, max: 0.5, s: 0.06 + Math.random() * 0.05, col: PALE }); }
        }
        for (let i = anims.length - 1; i >= 0; i--) { const A = anims[i]; A.t += dt; if (A.t < 0) continue; const m = A.m; if (!m.dead) { A.x = m.x; A.y = m.y; A.z = (m.z || 0) + (m.liftZ || 0) + m.r; }
          if (!A.shattered && A.t >= 1.05) { A.shattered = true; shatter(A); }
          if (A.t >= 1.35) anims.splice(i, 1); }
        for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; if (p.life <= 0) { parts.splice(i, 1); continue; } if (p.k === 2) continue;
          if (p.k === 3) { p.th += p.w * dt; p.r += p.vr0 * dt; p.vr0 *= Math.pow(0.3, dt); p.z += p.vz * dt; continue; }
          const dr = p.k === 1 ? 1.6 : 0.8; p.x += p.vx * dt; p.y += p.vy * dt; p.z = Math.max(0, p.z + p.vz * dt); p.vx *= Math.pow(0.4, dt * dr); p.vy *= Math.pow(0.4, dt * dr); if (p.rot != null) p.rot += p.vr * dt; }
        if (!recs.size && !anims.length && !parts.length && !(M.hold > 0)) f.life = 0; if (M.hold > 0) M.hold -= dt; },
      onEnd() { for (const m of recs.keys()) clearRec(m); recs.clear(); anims.length = 0; parts.length = 0; MGR.delete(H.fx); },
      drawUnder(c, f, X, Y, T) { ribbons(c, T); },
      draw(c, f, X, Y, T) { sigils(c, T); dispels(c, T); bits(c, T); } });
    MGR.set(H.fx, M);
    function shatter(A) { const row = A.kind === 'shield' ? 1 : A.kind === 'atk' ? 2 : 3, col = SYMCOL[A.kind], hx = A.hx != null ? A.hx : A.x, hy = A.hy != null ? A.hy : A.y, hz = A.hz != null ? A.hz : A.z + 1;
      for (let i = 0; i < H.n(12); i++) { const a = i / 12 * TAU + Math.random() * 0.4, v = 1.4 + Math.random() * 1.8; parts.push({ k: 1, sh: i % 3, row, x: hx, y: hy, z: hz, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: Math.sin(a) * 0.8 + 0.3, life: 0.5 + Math.random() * 0.35, max: 0.85, s: 0.12 + Math.random() * 0.08, rot: a, vr: (Math.random() - 0.5) * 16 }); }
      for (let i = 0; i < H.n(26); i++) parts.push({ k: 3, cx: hx, cy: hy, z: hz + (Math.random() - 0.5) * 0.3, th: Math.random() * TAU, r: 0.05 + Math.random() * 0.15, vr0: 1.6 + Math.random() * 2.2, w: 5 + Math.random() * 3, vz: 0.3 + Math.random() * 0.7, life: 0.7 + Math.random() * 0.6, max: 1.3, s: 0.025 + Math.random() * 0.04, col: i % 3 ? MINT : col });
      H.X.sfx.chime && H.X.sfx.chime(1568 + Math.random() * 200, 0.4); H.X.light && H.X.light(hx, hy, 1.4, 0.25); }
    /* the tattered ribbons: two strands from the monster down its last few positions, carried off on the halo's wind */
    const RIBP = [[1.5, EMER, 0.16, 'source-over'], [1, EMER, 0.38, 'source-over'], [0.45, MINT, 0.3, 'lighter']];
    function ribbons(c, T) { const now = g.t; c.lineCap = 'round';
      for (const q of recs.values()) { const m = q.m, A = markA(m, now); if (A <= 0.01 || q.pts.length < 2) continue;
        const wx = Math.cos(q.ang) * 1.5, wy = Math.sin(q.ang) * 1.5 * GY, h0 = m.r * 0.9, n = q.pts.length, px = [], py = [];
        for (let i = 0; i < n; i++) { const p = i === 0 ? null : q.pts[i], age = i === 0 ? 0 : p.age, bx = i === 0 ? m.x : p.x, by = i === 0 ? m.y : p.y, bz = i === 0 ? (m.z || 0) + (m.liftZ || 0) : p.z;
          const fl = Math.sin(now * 6 + i * 1.1 + q.ph) * 0.16 * i / NS; px.push(H.sx(bx) + (wx * age - Math.sin(q.ang) * fl) * T); py.push(H.sy(by) - (bz + h0 + 0.5 * age) * T + (wy * age + Math.cos(q.ang) * fl) * T); }
        // a satin strip whose width turns with a slow twist, narrowing to a point at the tail; a soft wide pass, the body,
        // a bright edge; the tail frays into two loose threads
        const W = T * (m.boss ? 0.26 : 0.19), lx = [], ly = [], rx = [], ry = [];
        for (let i = 0; i < n; i++) { const u = i / (n - 1), j0 = Math.max(0, i - 1), j1 = Math.min(n - 1, i + 1); let dx = px[j1] - px[j0], dy = py[j1] - py[j0]; const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
          const hw = W * Math.pow(1 - u, 0.7) * (0.3 + 0.7 * Math.abs(Math.cos(now * 3.2 + i * 0.85 + q.ph))); lx.push(px[i] - dy * hw); ly.push(py[i] + dx * hw); rx.push(px[i] + dy * hw); ry.push(py[i] - dx * hw); }
        for (const [k, col, al, op] of RIBP) { c.globalCompositeOperation = op; c.fillStyle = rgbaS(col, al * A); c.beginPath();
          for (let i = 0; i < n; i++) { const mx = (lx[i] + rx[i]) / 2, my = (ly[i] + ry[i]) / 2, x = mx + (lx[i] - mx) * k, y = my + (ly[i] - my) * k; i ? c.lineTo(x, y) : c.moveTo(x, y); }
          for (let i = n - 1; i >= 0; i--) { const mx = (lx[i] + rx[i]) / 2, my = (ly[i] + ry[i]) / 2; c.lineTo(mx + (rx[i] - mx) * k, my + (ry[i] - my) * k); } c.closePath(); c.fill(); }
        c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaS(PALE, 0.4 * A); c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); for (let i = 1; i < n - 1; i++) (i > 1 ? c.lineTo(lx[i], ly[i]) : c.moveTo(lx[i], ly[i])); c.stroke();
        const ex = px[n - 1], ey = py[n - 1], tdx = ex - px[n - 2], tdy = ey - py[n - 2], tl = Math.hypot(tdx, tdy) || 1; c.strokeStyle = rgbaS(MINT, 0.45 * A); c.lineWidth = Math.max(1, T * 0.02); c.beginPath();
        for (let s = -1; s <= 1; s += 2) { const a = Math.atan2(tdy, tdx) + s * (0.35 + 0.2 * Math.sin(now * 5 + q.ph + s)), L2 = T * 0.3; c.moveTo(px[n - 2], py[n - 2]); c.quadraticCurveTo(ex, ey, ex + Math.cos(a) * L2, ey + Math.sin(a) * L2); } c.stroke(); }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    /* the broken sigils over Windworn heads: fade in over 0.3 s, a faint pulse, dissolving over the last 0.5 s */
    function sigils(c, T) { const sg = want('sigil'), now = g.t; if (!sg) return;
      for (const q of recs.values()) { const m = q.m, A = markA(m, now); if (A <= 0.01) continue; const r = m.r * T, z = ((m.z || 0) + (m.liftZ || 0)) * T, X = H.sx(m.x), Y = H.sy(m.y) - z - r * 1.15 - T * (m.elite ? 0.62 : 0.42) + Math.sin(now * 2.1 + q.ph) * T * 0.04;
        const left = m.wornUntil - now, crumble = left < 0.5 ? 1 - left / 0.5 : 0, s = T * (m.boss ? 0.5 : 0.36) * (1 + 0.25 * Math.exp(-(now - q.fl) / 0.25)) * (1 + 0.15 * crumble), pulse = 0.82 + 0.18 * Math.sin(now * 3.1 + q.ph);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = A * 0.28 * pulse; const gs = s * 1.05; c.drawImage(glowSprite(EMER), X - gs, Y - gs, gs * 2, gs * 2);
        c.globalCompositeOperation = 'source-over'; c.globalAlpha = A * (0.72 + 0.2 * pulse); c.drawImage(sg, X - s, Y - s, s * 2, s * 2); }
      c.globalAlpha = 1; }
    /* the dispel: torn off (0-0.28 s), held in a tiny wind spiral as it cracks (to 1.05 s), shattered into dust */
    function dispels(c, T) { const gl = want('glint');
      for (const A of anims) { if (A.t < 0) continue; const sym = want('sym_' + A.kind); if (!sym) continue; const t = A.t, col = SYMCOL[A.kind];
        const bx = H.sx(A.x), by = H.sy(A.y) - A.z * T, hx = A.x + Math.cos(A.ang) * 0.45, hy = A.y + Math.sin(A.ang) * 0.3, hz = A.z + 1.0, HX = H.sx(hx), HY = H.sy(hy) - hz * T; A.hx = hx; A.hy = hy; A.hz = hz;
        if (t < 1.05) { const u = cl(t / 0.28), e = eout3(u), jit = t > 0.28 ? Math.sin(t * 47 + A.cr) * T * 0.025 * cl((t - 0.28) / 0.6) : 0, x = lerp(bx, HX, e) + jit, y = lerp(by, HY, e) - Math.sin(Math.PI * u) * T * 0.15, s = T * 0.3 * (0.75 + 0.25 * e), st = 1 + 0.45 * Math.sin(Math.PI * u);
          // the two snapping currents from the body to the symbol while it is torn away
          if (t < 0.4) { const a = (1 - sm((t - 0.2) / 0.2)); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
            for (let k = 0; k < 2; k++) { const sg = k ? 1 : -1, mx = (bx + x) / 2 + sg * T * 0.35, my = (by + y) / 2; c.strokeStyle = rgbaS(MINT, 0.3 * a); c.lineWidth = T * 0.07; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(mx, my, x, y); c.stroke(); c.strokeStyle = rgbaS(PALE, 0.8 * a); c.lineWidth = T * 0.022; c.stroke(); } }
          // the tiny wind spiral: three curls closing round it, motes riding them
          if (t > 0.15) { const k = cl((t - 0.15) / 0.3), rr = T * (0.62 - 0.2 * cl((t - 0.3) / 0.75)), rot = t * 9; c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
            for (let j = 0; j < 3; j++) { const a0 = rot + j * TAU / 3; c.save(); c.translate(x, y); c.scale(1, 0.62);
              c.strokeStyle = rgbaS(MINT, 0.22 * k); c.lineWidth = T * 0.08; c.beginPath(); c.arc(0, 0, rr * (0.85 + 0.15 * j / 2), a0, a0 + 1.9); c.stroke();
              c.strokeStyle = rgbaS(PALE, 0.75 * k); c.lineWidth = T * 0.022; c.stroke(); c.restore();
              const ma = a0 + 1.9, mxp = x + Math.cos(ma) * rr * (0.85 + 0.15 * j / 2), myp = y + Math.sin(ma) * rr * 0.62 * (0.85 + 0.15 * j / 2), ms = T * 0.09; c.globalAlpha = k; c.drawImage(glowSprite(PALE), mxp - ms, myp - ms, ms * 2, ms * 2); c.globalAlpha = 1; } }
          // the symbol, stretched as it tears, then cracking (light seams across it)
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = cl(t / 0.08); c.save(); c.translate(x, y); c.rotate(Math.sin(t * 6 + A.cr) * 0.18 * cl((t - 0.28) / 0.4)); c.scale(1 / Math.sqrt(st), st); c.drawImage(sym, -s * 1.6, -s * 1.6, s * 3.2, s * 3.2);
          const ck = cl((t - 0.45) / 0.55); if (ck > 0) { c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.strokeStyle = rgbaS(WHITE, 0.9 * ck); c.lineWidth = Math.max(1, T * 0.025); c.beginPath();
            for (let j = 0; j < 3; j++) { const a = A.cr + j * 2.1; let px = 0, py = 0; c.moveTo(0, 0); for (let q = 1; q <= 3; q++) { if (q / 3 > ck * 1.2) break; px += Math.cos(a + (R1(A.cr + j * 3 + q) - 0.5) * 1.4) * s * 0.36; py += Math.sin(a + (R1(A.cr * 2 + j + q) - 0.5) * 1.4) * s * 0.36; c.lineTo(px, py); } } c.stroke();
            c.globalAlpha = 0.5 * ck * ck; c.drawImage(glowSprite(col), -s * 1.3, -s * 1.3, s * 2.6, s * 2.6); }
          c.restore(); c.globalAlpha = 1; }
        else if (gl) { const u = (t - 1.05) / 0.3, s = T * (0.35 + 0.55 * eout(u)); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.85 * (1 - sm(u)); c.drawImage(gl, HX - s, HY - s, s * 2, s * 2); c.globalAlpha = 1; } }
      c.globalCompositeOperation = 'source-over'; }
    /* peeled fragments, currents, symbol shards and luminous dust */
    function bits(c, T) { const sh = want('shards'), now = g.t; c.globalCompositeOperation = 'lighter';
      for (const p of parts) { const a = cl(p.life / (p.max * 0.5));
        if (p.k === 0 || p.k === 3) { const x = p.k === 3 ? p.cx + Math.cos(p.th) * p.r : p.x, y = p.k === 3 ? p.cy + Math.sin(p.th) * p.r * GY : p.y, s = p.s * T * 2; c.globalAlpha = a * 0.75; c.drawImage(glowSprite(p.col), H.sx(x) - s, H.sy(y) - p.z * T - s, s * 2, s * 2); }
        else if (p.k === 1 && sh) { const s = p.s * T, X = H.sx(p.x), Y = H.sy(p.y) - p.z * T; c.globalAlpha = a; c.save(); c.translate(X, Y); c.rotate(p.rot); c.drawImage(sh, p.sh * SHC, p.row * SHC, SHC, SHC, -s, -s, s * 2, s * 2); c.restore(); }
        else if (p.k === 2) { const m = p.m, u = 1 - p.life / p.max, X = H.sx(m.dead ? p.x : m.x), Y = H.sy(m.dead ? p.y : m.y) - p.z * T * 0.8, R0 = m.r * T * 1.2;   // a current curling off the body and away on the wind
          c.lineCap = 'round'; const al = Math.sin(Math.PI * u); c.beginPath(); for (let j = 0; j <= 8; j++) { const v = j / 8, ang = p.a0 + p.sgn * (v * 2.6 - 1.3 + u * 1.5), rr = R0 * (0.8 + v * 1.4 * (0.4 + u)), x = X + Math.cos(ang) * rr + Math.cos(p.a0) * u * T * 1.2, y = Y + Math.sin(ang) * rr * 0.6 - v * u * T * 0.3; j ? c.lineTo(x, y) : c.moveTo(x, y); }
          c.globalAlpha = 1; c.strokeStyle = rgbaS(MINT, 0.25 * al); c.lineWidth = T * 0.07; c.stroke(); c.strokeStyle = rgbaS(PALE, 0.7 * al); c.lineWidth = T * 0.02; c.stroke(); } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    function markA(m, now) { if (!(m.wornUntil > now)) return 0; return sm((now - (m.wornT0 || now)) / 0.3) * sm((m.wornUntil - now) / 0.5); }
    return M; }

  /* ================= Winds of Oblivion ================= */
  U.oblivion = (C, h) => {
    H = h; wantAll(); bakeStep(2);
    const me = H.me, g = H.g, ev = evoOf(C), ADE = ev >= 4, CEL = ev >= 7, K = C.K || 1, DUR = durOf(ev), R = (5 + (ev - 1) / 3) * K, NDIS = ADE ? 2 : 1;
    const BR = 0.42, WT = 1.25, LIFE = BR + WT + 1.45, cx = me.x, cy = me.y, face = me.face || 1;
    const MG = manager(); MG.hold = LIFE;
    const hit = new Set(); let dead = false, endK = 1, braced = false, marked = 0, dispelled = 0;
    H.X.banner('WINDS OF OBLIVION', '', C.col, 1.4); H.X.sfx.hum();
    H.X.after(BR * 0.8, () => { if (!dead) H.X.sfx.whoosh(); });
    // the halo's furniture: chimes on the front, feathers riding it, exhaled streaks curling out from the pet
    const NC = CEL ? 20 : ADE ? 16 : 12, NF = H.n(CEL ? 54 : ADE ? 44 : 34), NB = 12;
    const chimes = []; for (let i = 0; i < NC; i++) chimes.push({ th: i / NC * TAU + (R1(i * 3.3) - 0.5) * 0.15, rk: 0.93 + 0.06 * R1(i * 1.7), z: 1.05 + 0.4 * R1(i * 2.9), v: i % 3, ph: R1(i * 7.1) * TAU, sz: 0.62 + 0.18 * R1(i * 4.4), gl: R1(i * 9.2) * 7 });
    const feathers = []; for (let i = 0; i < NF; i++) feathers.push({ th: R1(i * 5.3) * TAU, dr: -0.15 - 0.95 * R1(i * 2.2), z: 0.15 + 1.7 * R1(i * 8.8), v: i & 1, ph: R1(i * 3.9) * TAU, sz: 0.5 + 0.3 * R1(i * 6.6), spin: (R1(i * 1.1) - 0.5) * 2.4, dz: 0.25 + 0.35 * R1(i * 4.8) });
    const streaks = []; for (let i = 0; i < NB; i++) streaks.push({ a: (face > 0 ? 0 : Math.PI) + (i / NB - 0.5) * 2.2 + (R1(i * 2.7) - 0.5) * 0.3, t0: BR - 0.12 + 0.03 * i % 0.2, sg: i % 2 ? 1 : -1, z: 0.35 + 0.5 * R1(i * 6.1) });
    const front = t => lerp(0.45, R, eout3((t - BR) / WT));
    function markIn(rf, end) { for (const m of H.living()) { if (hit.has(m)) continue; const d = Math.hypot(m.x - cx, m.y - cy); if (d - m.r * 0.6 <= rf || (end && d <= R + m.r)) { hit.add(m); const got = MG.mark(m, { dur: DUR, cel: CEL, n: NDIS, ang: d > 0.05 ? Math.atan2(m.y - cy, m.x - cx) : Math.random() * TAU });
      marked++; dispelled += got.length; if (got.length) { if (dispelled <= 4) H.X.after(0.3, () => H.X.sfx.twang && H.X.sfx.twang()); } if (marked <= 6 && H.X.sfx.chime) H.X.sfx.chime(1046 + 180 * (marked % 4), 0.3); } } }
    const F = H.add({ life: LIFE, x: cx, y: cy, key: 'oblivion', hit, stats: () => ({ marked, dispelled }), R, DUR,
      update(dt, f) { const t = f.t; bakeStep(3);
        if (me.dead && !dead) { dead = true; f.life = Math.min(f.life, 0.6); }
        if (dead) endK = cl(f.life / 0.6);
        // the breath: a small squash as it draws in, released as it exhales
        if (t < BR + 0.3 && !dead) { braced = true; me.hopSq = 0.14 * sm(t / (BR * 0.8)) * (1 - sm((t - BR + 0.05) / 0.2)); } else if (braced) { me.hopSq = 0; braced = false; }
        if (!dead && t >= BR) { const u = (t - BR) / WT; if (u < 1) markIn(front(t), false); else if (!f.swept) { f.swept = true; markIn(R, true); H.X.sfx.chime && H.X.sfx.chime(784, 0.35); } } },
      onEnd() { if (braced) { me.hopSq = 0; braced = false; } },
      drawUnder(c, f, X, Y, T) { const t = f.t, A = haloA(t) * endK; floor(c, X, Y, T, t, A); air(c, X, Y, T, t, A, -1); },
      draw(c, f, X, Y, T) { const t = f.t, A = haloA(t) * endK; air(c, X, Y, T, t, A, 1); breath(c, T, t); } });
    function haloA(t) { return sm((t - BR + 0.1) / 0.25) * (1 - sm((t - BR - WT - 0.25) / 1.15)); }
    const rotOf = t => 0.3 * t + 0.25 * eout3((t - BR) / WT);
    /* the floor: the bright feathered front, a faint wash inside it, the turning circle of wind runes behind it (light only) */
    function floor(c, X, Y, T, t, A) { if (A <= 0.01) return; const rf = front(t) * T, ring = want('ring'), wash = want('wash'), runes = want('runes'), u = cl((t - BR) / WT);
      c.globalCompositeOperation = 'lighter';
      if (wash) { c.globalAlpha = A * 0.45; c.drawImage(wash, X - rf, Y - rf * GY, rf * 2, rf * 2 * GY); }
      if (runes) { const rr = rf * 0.93 * (RC / RR); c.save(); c.translate(X, Y); c.scale(1, GY); c.rotate(-rotOf(t) * 0.7); c.globalAlpha = A * (0.5 + 0.2 * (1 - u)); c.drawImage(runes, -rr, -rr, rr * 2, rr * 2); c.restore(); }
      if (ring) { const s = rf / 0.972; c.globalAlpha = A * (0.85 - 0.35 * sm((t - BR - WT) / 0.6)); c.drawImage(ring, X - s, Y - s * GY, s * 2, s * 2 * GY); const s2 = s * 0.86; c.globalAlpha = A * 0.18 * (1 - u); c.drawImage(ring, X - s2, Y - s2 * GY, s2 * 2, s2 * 2 * GY); }
      // short arcs of wind racing round just inside the front
      c.lineCap = 'round'; c.save(); c.translate(X, Y); c.scale(1, GY); const ro = rotOf(t) * 2.2;
      for (let i = 0; i < 7; i++) { const a0 = ro + i / 7 * TAU, rr = rf * (0.9 - 0.05 * (i % 3)); c.strokeStyle = rgbaS(MINT, 0.14 * A); c.lineWidth = T * 0.16; c.beginPath(); c.arc(0, 0, rr, a0, a0 + 0.55); c.stroke(); c.strokeStyle = rgbaS(PALE, 0.45 * A); c.lineWidth = T * 0.035; c.beginPath(); c.arc(0, 0, rr, a0 + 0.08, a0 + 0.47); c.stroke(); }
      c.restore(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    /* the air: chimes and feathers on the halo (side -1: the back half, under the monsters; +1: the front half, over them) */
    function air(c, X, Y, T, t, A, side) { if (A <= 0.01) return; const rf = front(t), ro = rotOf(t), vel = (t > BR && t < BR + WT) ? 1 - eout((t - BR) / WT) : 0, rise = sm((t - BR - WT - 0.25) / 1.15), PX = H.sx(me.x), PY = H.sy(me.y) - T * 0.5;
      const near = (x, y) => { const d = Math.hypot(x - PX, (y - PY) * 1.2); return sm((d - T * 0.55) / (T * 0.7)); };
      const fs = [want('feather0'), want('feather1')];
      if (fs[0] && fs[1]) { c.globalCompositeOperation = 'lighter';
        for (const q of feathers) { const th = q.th + ro * 1.35 + Math.sin(t * 0.9 + q.ph) * 0.05, sn = Math.sin(th); if ((sn >= 0 ? 1 : -1) !== side) continue; const r = Math.max(0.3, rf + q.dr * K * (0.5 + 0.5 * (1 - vel))), z = q.z + rise * q.dz * 2 + Math.sin(t * 1.7 + q.ph) * 0.12;
          const x = X + Math.cos(th) * r * T, y = Y + sn * r * T * GY - z * T, s = q.sz * T, a = A * (0.55 + 0.25 * Math.sin(t * 2.3 + q.ph)) * (side > 0 ? near(x, y) : 1) * (1 - 0.6 * rise); if (a <= 0.01) continue;
          c.globalAlpha = a; c.save(); c.translate(x, y); c.rotate(th + Math.PI / 2 + q.spin + Math.sin(t * 3 + q.ph) * 0.5); c.drawImage(fs[q.v], -s * FW / FH * 0.5 * 2, -s, s * FW / FH * 2, s * 2); c.restore(); } }
      const gl = want('glint'); c.globalCompositeOperation = 'source-over';
      for (const q of chimes) { const ch = want('chime' + q.v); if (!ch) continue; const th = q.th + ro, sn = Math.sin(th); if ((sn >= 0 ? 1 : -1) !== side) continue; const r = rf * q.rk, z = q.z + rise * 1.2, x = X + Math.cos(th) * r * T, y = Y + sn * r * T * GY - z * T;
        const a = A * (1 - rise) * (side > 0 ? near(x, y + T * 0.5) : 1) * (0.75 + 0.25 * sn * side); if (a <= 0.01) continue; const s = q.sz * T, sway = Math.sin(t * 2.6 + q.ph) * (0.16 + 0.45 * vel) + Math.sin(t * 4.3 + q.ph * 2) * 0.06 - Math.cos(th) * 0.25 * vel;
        c.globalAlpha = a; c.save(); c.translate(x, y); c.rotate(sway); c.drawImage(ch, -s * CW / CH, -s * 6 / CH * 2, s * CW / CH * 2, s * 2); c.restore();
        if (gl) { const gk = Math.max(0, Math.sin(t * 2.2 + q.gl)); const gp = gk * gk * gk * gk * gk * gk; if (gp > 0.05) { const gs = T * 0.32 * gp, tx = x + Math.sin(-sway) * s * 1.2, ty = y + Math.cos(sway) * s * 1.2 * 0.55; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a * gp; c.drawImage(gl, tx - gs, ty - gs, gs * 2, gs * 2); c.globalCompositeOperation = 'source-over'; } } }
      c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
    /* the exhale: a soft puff at the mouth, streaks of pale breeze curling out to the front */
    function breath(c, T, t) { if (t > BR + 1.1 || endK <= 0.01) return; const pf = want('puff'), PX = H.sx(me.x) + face * T * 0.28, PY = H.sy(me.y) - ((me.z || 0) + 0.62) * T;
      c.globalCompositeOperation = 'lighter';
      if (pf) { const u = (t - BR + 0.15) / 0.6; if (u > 0 && u < 1) { const s = T * (0.25 + 0.7 * eout(u)); c.globalAlpha = Math.sin(Math.PI * u) * 0.7 * endK; c.drawImage(pf, PX + face * T * 0.25 * u - s, PY - s, s * 2, s * 2); } }
      c.lineCap = 'round';
      for (const q of streaks) { const u = (t - q.t0) / 0.95; if (u <= 0 || u >= 1.15) continue; const rf = front(Math.max(t, BR)) * 0.92, al = Math.sin(Math.PI * cl(u / 1.15)) * endK;
        let x0, y0; for (let j = 0; j <= 6; j++) { const v = cl(u - 0.22 + j * 0.04), r = lerp(0.25, rf, eout(v)), a = q.a + q.sg * 1.3 * v, z = lerp(0.62, q.z, v), x = lerp(PX, H.sx(cx) + Math.cos(a) * r * T, sm(v * 3)), y = lerp(PY, H.sy(cy) + Math.sin(a) * r * T * GY - z * T, sm(v * 3));
          if (j) { const k = j / 6; c.strokeStyle = rgbaS(MINT, 0.22 * al * k); c.lineWidth = T * 0.14 * k; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke(); c.strokeStyle = rgbaS(PALE, 0.7 * al * k); c.lineWidth = T * 0.035 * k; c.stroke(); } x0 = x; y0 = y; } }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
    return F;
  };
  U.oblivion.warm = warm;
  U.oblivion.__dbg = { BK, bakeStep, BUFFS, dispel, durOf };
})();
