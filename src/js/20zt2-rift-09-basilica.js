/* ---------- Rift 9: The Basilica of the Veiled Eye ----------
   A mountain monastery has fused with a sightless stone organism. Tall narrow pillars stand round broad open walkways;
   the cloth banners have turned to rigid sheets of stone that hang without bending; every statue is an abstract beast
   curled round an eye-shaped stone. Red light falls from narrow ceiling slits in stripes across the floor. The walls
   lean inward a little, watchful. Three lands, climbing:
   I   The Outer Cloister: pale calcite flagstones, black basalt walls, the entry stair between two monolithic closed
       eyelids; the red eye pylons watch the walkways.
   II  The Calcite Courtyard: a broad bright court of calcite and ochre dust, purification basins, veiled arches.
   III The Petrified Sanctuary: black volcanic stone inlaid with ochre, ruined calcite horn-columns, petrified plants,
       the great sealed eye in the north wall.
   Monsters: calcite leeches (still pale cones; they spit slow petrification droplets), witness scarabs (flat black
   beetles carrying an upright red eye plate; a narrow, slowly turning gaze cone), broken sentinels (headless four-
   legged stone beasts; a red orb floats where the head was and locks a thin red line to you; after one second
   unbroken, they charge).
   Stages: 0 The Outer Cloister (fight) · 1 The Blind Pilgrimage (trial) · 2 Eshra the Many-Lidded (The Ossuary)
           3 The Witness Containment (trial) · 4 The Calcite Courtyard (fight) · 5 Thessarym the Veil Serpent (The Reliquary)
           6 The Ritual Avenue (fight) · 7 The Procession of Stone (trial) · 8 Gharaal the Buried Witness (The Sanctuary of the Veiled Eye)

   ======================= THE SHARED API (BAS.*) — the stages (20zt) and the bosses (20zv/20zw/20zx) code against it =======================
   Palette: BAS.BLACK #242428 (BLACK_HI/BLACK_D), BAS.OCHRE #A18E65 (OCHRE_HI/OCHRE_D), BAS.CALCITE #D8D1BB (CALCITE_HI/CALCITE_D),
            BAS.RED #BF675D (RED_HI/RED_D: decorative, desaturated), BAS.WARN '#FF4D6D' (hostile cones keep the game's warning red).
   Every stage of the rift (fights, trials and boss rooms) runs the rift's everyStage, which keeps one context per running
   game: BAS.ctx(X) -> { X, screens, pylons, sources, drops, t }. It updates and draws screens' rails and shadows, every
   gaze cone, the petrification droplets, and the Calcification meter. make() runs before everyStage, so anything made in
   make() registers itself into the same context.

   Screens on rails
     BAS.screen(X, H, { x, y, a, stops: [[x,y],[x,y],...], len, i0, label }) -> scr (an H.obj of kind 'screen')
       a: the direction the sheet runs along (radians); the sheet is len tiles wide (default 3) and 1.6 tall; stops are
       its parking places along a short black rail (x,y default to stops[i0 || 0]). The pet moves it by standing at its
       HANDLE (scr.handle: a second H.obj of kind 'handle', r 0.7, the black bar just past the sheet's +a end) and
       channelling (the use button: 0.75 s): it slides to the next stop in one second, back and forth along the rail.
       Hiding behind the sheet never moves it. The sheet eases the pet out of its own thickness (it is cover, not a door).
       scr fields: x, y, a, len, stops, i (stop it is at or heading for), moving (0|1), k (0..1 of the slide), locked
       (true: the handle refuses: "The screen waits"), onArrive(scr) (a callback the stage may set), handle (its H.obj).
       scr.goTo(i) slides it to stop i (one second per stop: bosses drag screens with this); scr.next() as the handle does;
       scr.ends() -> [[x0,y0],[x1,y1]] the sheet's two ends; scr.blocks(x0,y0,x1,y1) whether the sheet cuts the segment.
     BAS.screens(X) -> every screen of the running stage (also X.rift.objs.filter(o => o.kind === 'screen'), and the boss
       stages' modules expose mod.screens). Tests reach everything through X.rift.self.amb: { BAS, C (the context), H }.
     BAS.shadowOf(scr, src) -> [[x,y]×4] the floor polygon the screen shades from the source {x, y, len} (len: how far the
       shadow reaches; default 14), or null. BAS.inShadow(x, y, src) -> whether any screen shades the point from src.
       BAS.drawShadow(c, X, poly, k) draws a shadow polygon: a darker double-bordered region with a closed-eye icon (k alpha).

   Gaze
     A gaze source is { x, y, a, len, spread, open } (spread is a half-angle, as X.inCone). BAS.inCone(x, y, src),
     BAS.gazeSeen(x, y, src) -> inside the cone, not in a screen's shadow, and not behind a wall (X.los): geometry only,
     never where the camera faces. BAS.source(X, src) registers a source the context tests and draws every frame while
     src.open is truthy (bosses' eyes); BAS.unsource(X, src) removes it. BAS.drawCone(c, X, src, k) draws one cone
     (warning red) with the screens' shadows cut into it; BAS.drawPreview(c, X, src, a) a dim dashed preview cone at angle a.
     BAS.pylon(X, H, { x, y, angles: [a0,a1,a2], period, len, spread, i0, label }) -> pyl (an H.obj of kind 'pylon'):
       a tall red-eye pylon that watches angles[i] for period seconds (default 7), shows a dim dashed preview of the next
       angle one second before it turns, closes its lid, swings (0.5 s) and opens on the new angle. Fields: a, ai, open
       (0..1), preview (null or the angle), t, period, len (default 9), spread (default 0.42), src (its gaze source).
       pyl.setAngle(i) turns it at once; pyl.hold = true stops the cycle.
     BAS.pylons(X) -> the stage's pylons.

   Calcification  (BAS.calcify)
     .k (0..3 continuous), .stage (0..3), .rooted (seconds left), .seen (this frame), .immune (seconds).
     One stage per 0.8 s seen (by any open source, a scarab's cone, or a droplet: .add(n) adds n stages); out of every cone
     the stages clear over 1.5 s. At stage 3 the pet is rooted 1.2 s and takes 20% of its max HP, then is released and
     reset (1.5 s immune). .onRoot = fn(X) runs when stage 3 lands (The Procession sets it to send the pet back).
     .see() marks the pet seen this frame; .reset(); .tick(dt, X) and the drawing are done by the everyStage context.
     Shown as a HUD meter of grey stone filling three segments and stone creeping up over the pet's feet.

   Droplets  BAS.spit(X, m, tx, ty, o) -> a slow petrification droplet from m toward (tx, ty) (speed o.v default 3.2);
     touching the pet (not while it dodge-rolls) it deals m.dmg and adds one stage; it dies on walls. Drawn by the context.

   Art helpers (canvas, in screen pixels unless said)
     BAS.eyeStone(c, x, y, w, open, lw, o)  an almond eye of calcite w wide: open 0 is a sealed lid, 1 a red iris
     BAS.closedEye(c, x, y, w, col, lw)     the closed-eye icon (lid arc + three lashes)
     BAS.banner(c, x, y, w, h, lw, v)       a rigid stone banner hanging from (x, y): w×h sheet, glyph by v
     BAS.beast(c, x, y, s, lw, v)           an abstract stone beast curled round an eye stone, on a plinth, s = scale
     BAS.pillarArt(c, x, y, w, h, lw, o)    a tall narrow square pillar standing on (x, y): o.cracked (0..1), o.col
     BAS.pylonArt(c, x, y, T, pyl)          the eye pylon (pyl: { a, open, preview })
     BAS.screenArt(c, X, scr)               a screen's sheet (world→screen through X.sx/X.sy/X.Tz)
     BAS.wallEye(c, X, eye)                 the great sealed eye of the sanctuary's north wall: eye = { x, y, w, open (0..1) }
     BAS.stripes(c, X, k)                   the red ceiling-slit light stripes over the floor (decorative, unoutlined)

   Boss arenas  (the fiend files spread these into their FIEND_DEFS entry: arenaR, carve, start)
     BAS.arena.eshra     { R: 14, carve, start, pillars(C) -> [{x,y}] }   the ossuary: three permanent 2×2 square pillars in a wide triangle
     BAS.arena.thessarym { R: 16, carve, start }                           the circular reliquary (two screens on N–S rails, a central lane)
     BAS.arena.gharaal   { R: 19, carve, start }                           the 38-m square sanctuary (the wall-eye on the north wall, four screens)
     The boss stages' make() (here) builds the objects and exposes them on the stage module, X.rift.self.mod:
       Eshra:     mod.pillars [{ x, y, tiles, obj, cracked, gone, crack(k), destroy() }]
       Thessarym: mod.screens [west, east] (3 stops each, i0 = 1 the middle), mod.lane { x, w }
       Gharaal:   mod.screens [NW, NE, SW, SE] (2 stops each), mod.wallEye { x, y, w, open, sealed }, mod.nodes [] (for the stage's eye nodes)
     RIFT_FIENDS is not touched here: the three fiend files register eshra, thessarym and gharaal themselves. */
const BAS = { BLACK: '#242428', BLACK_HI: '#3A3A42', BLACK_D: '#141416', OCHRE: '#A18E65', OCHRE_HI: '#C4B38C', OCHRE_D: '#6E6046', CALCITE: '#D8D1BB', CALCITE_HI: '#F0EBDB', CALCITE_D: '#B3AB95',
  RED: '#BF675D', RED_HI: '#E08A7E', RED_D: '#8A4640', WARN: '#FF4D6D', INK: '#1A1A1E', SHADOW: '#3A3832' };
(() => {
  const TAU = Math.PI * 2, { BLACK, BLACK_HI, BLACK_D, OCHRE, OCHRE_HI, OCHRE_D, CALCITE, CALCITE_HI, CALCITE_D, RED, RED_HI, RED_D, WARN, INK } = BAS;
  const { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(20,18,24,${a || 0.3})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  // a cylinder gradient across x0..x1: lit on the left, shaded on the right
  const cylG = (c, x0, x1, hi, lo) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, shadeC(hi, -0.08)); g.addColorStop(0.3, hi); g.addColorStop(0.65, shadeC(hi, -0.14)); g.addColorStop(1, lo); return g; };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };

  /* ======================= art helpers ======================= */
  // a square block standing on (x, y): a lit front face, a shaded side face, a pale top (the stone of the basilica)
  function block(c, x, y, w, h, dep, col, lw, o) { o = o || {}; const side = shadeC(col, -0.42), top = shadeC(col, 0.22);
    c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2 + dep, y - dep * 0.6); c.lineTo(x + w / 2 + dep, y - h - dep * 0.6); c.lineTo(x + w / 2, y - h); c.closePath(); c.fillStyle = side; c.fill(); ink(c, lw * 0.8);
    c.beginPath(); c.rect(x - w / 2, y - h, w, h); c.fillStyle = cylG(c, x - w / 2, x + w / 2, col, shadeC(col, -0.22)); c.fill(); ink(c, lw);
    c.beginPath(); c.moveTo(x - w / 2, y - h); c.lineTo(x - w / 2 + dep, y - h - dep * 0.6); c.lineTo(x + w / 2 + dep, y - h - dep * 0.6); c.lineTo(x + w / 2, y - h); c.closePath(); c.fillStyle = top; c.fill(); ink(c, lw * 0.8);
    if (o.joints) { c.strokeStyle = 'rgba(20,18,24,.28)'; c.lineWidth = Math.max(1, lw * 0.5); for (let k = 1; k < o.joints; k++) { const yy = y - h * k / o.joints; c.beginPath(); c.moveTo(x - w / 2 + 1, yy); c.lineTo(x + w / 2 - 1, yy); c.stroke(); } } }
  /* an almond eye of calcite, w wide: open 0 is a sealed lid (one curved seam, three lash grooves), 1 a red iris with a black
     slit pupil behind parting lids. o.red the iris colour (default the muted red), o.glow a glow when open */
  function eyeStone(c, x, y, w, open, lw, o) { o = o || {}; const h = w * 0.42, k = clamp(open, 0, 1), red = o.red || RED;
    c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y - h * 1.15, x + w / 2, y); c.quadraticCurveTo(x, y + h * 1.15, x - w / 2, y); c.closePath(); c.fillStyle = shade(c, o.col || CALCITE, w * 0.5, x - w * 0.15, y - h * 0.3, 0.3); c.fill(); ink(c, lw);
    if (k > 0.02) { c.save(); c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y - h * 1.15 * k, x + w / 2, y); c.quadraticCurveTo(x, y + h * 1.15 * k, x - w / 2, y); c.closePath(); c.clip();
      c.fillStyle = '#1A1012'; c.fillRect(x - w / 2, y - h, w, h * 2); const ir = h * 0.9; c.beginPath(); c.arc(x, y, ir, 0, TAU); c.fillStyle = shade(c, red, ir, x - ir * 0.3, y - ir * 0.3, 0.4); c.fill(); c.fillStyle = INK; ell(c, x, y, ir * 0.22, ir * 0.85); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, x - ir * 0.35, y - ir * 0.4, ir * 0.18, ir * 0.1, -0.5); c.fill();
      c.restore(); c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y - h * 1.15 * k, x + w / 2, y); c.quadraticCurveTo(x, y + h * 1.15 * k, x - w / 2, y); c.closePath(); ink(c, lw * 0.8); if (o.glow) glowIn(c, x, y, w * 0.9, RED_HI, 0.45 * k); }
    if (k < 0.98) { c.strokeStyle = 'rgba(20,18,24,.55)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(x - w * 0.42, y + h * 0.05); c.quadraticCurveTo(x, y + h * 0.55 * (1 - k) - h * 0.1 * k, x + w * 0.42, y + h * 0.05); c.stroke();
      c.lineWidth = Math.max(1, lw * 0.5); for (const u of [-0.22, 0, 0.22]) { c.beginPath(); c.moveTo(x + u * w, y + h * 0.5); c.lineTo(x + u * w * 1.2, y + h * 0.95); c.stroke(); } } }
  /* the closed-eye icon: a lid arc and three lashes under it */
  function closedEye(c, x, y, w, col, lw) { c.save(); c.strokeStyle = col || CALCITE_HI; c.lineWidth = lw || 2; c.lineCap = 'round'; c.beginPath(); c.moveTo(x - w / 2, y); c.quadraticCurveTo(x, y + w * 0.55, x + w / 2, y); c.stroke(); c.lineWidth = Math.max(1, (lw || 2) * 0.75); for (const u of [-0.3, 0, 0.3]) { c.beginPath(); c.moveTo(x + u * w, y + w * (0.27 - Math.abs(u) * 0.25)); c.lineTo(x + u * w * 1.25, y + w * (0.5 - Math.abs(u) * 0.3)); c.stroke(); } c.restore(); }
  /* a rigid stone banner: a dark crossbar at (x, y), a thin sheet of calcite hanging from it without a bend, cut into
     stiff points at the foot, a carved closed eye and an ochre band on it; v picks the glyph */
  function banner(c, x, y, w, h, lw, v) { c.fillStyle = BLACK_D; c.fillRect(x - w * 0.62, y - h * 0.03, w * 1.24, h * 0.05); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.strokeRect(x - w * 0.62, y - h * 0.03, w * 1.24, h * 0.05);
    const pts = [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + h * 0.78]]; const n = 3; for (let i = 0; i <= n * 2; i++) { const u = i / (n * 2); pts.push([x + w / 2 - u * w, y + h * (i % 2 ? 1 : 0.78)]); } pts.push([x - w / 2, y + h * 0.78]);
    c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, CALCITE_HI); g.addColorStop(0.55, CALCITE); g.addColorStop(1, CALCITE_D); c.fillStyle = g; c.fill(); ink(c, lw);
    c.fillStyle = rgba(OCHRE, 0.9); c.fillRect(x - w / 2 + 1, y + h * 0.1, w - 2, h * 0.07); c.fillRect(x - w / 2 + 1, y + h * 0.62, w - 2, h * 0.05);
    c.fillStyle = rgba(BLACK, 0.85); c.fillRect(x - w / 2 + 1, y + h * 0.175, w - 2, Math.max(1, h * 0.012));
    if ((v | 0) % 3 === 0) closedEye(c, x, y + h * 0.36, w * 0.6, BLACK, Math.max(1.2, lw * 0.9)); else if ((v | 0) % 3 === 1) { c.strokeStyle = BLACK; c.lineWidth = Math.max(1.2, lw * 0.9); for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(x - w * 0.25, y + h * (0.3 + k * 0.08)); c.lineTo(x + w * 0.25, y + h * (0.3 + k * 0.08)); c.stroke(); } } else eyeStone(c, x, y + h * 0.4, w * 0.55, 0, lw * 0.8);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.moveTo(x - w / 2 + 2, y + h * 0.05); c.lineTo(x - w / 2 + 2, y + h * 0.75); c.stroke(); }
  /* an abstract stone beast curled round an eye stone: a plinth, a smooth C of a body with legs tucked under, a blunt
     lowered head meeting the tail, the eye stone sealed in the hollow. s is the scale (the plinth is about 1.6 s wide) */
  function beast(c, x, y, s, lw, v) { const R = rnd(31 + (v | 0) * 7), col = (v | 0) % 2 ? OCHRE : CALCITE_D;
    c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, x, y + s * 0.04, s * 0.95, s * 0.3); c.fill();
    block(c, x, y, s * 1.6, s * 0.34, s * 0.16, BLACK_HI, lw, { joints: 0 });
    const by = y - s * 0.34 - s * 0.04;
    // the body: a thick C from the head (lower right) up over the back and down to the tail (lower left)
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const body = () => { c.beginPath(); c.moveTo(x + s * 0.55, by - s * 0.22); c.quadraticCurveTo(x + s * 0.75, by - s * 0.9, x + s * 0.1, by - s * 1.05); c.quadraticCurveTo(x - s * 0.7, by - s * 1.1, x - s * 0.6, by - s * 0.45); c.quadraticCurveTo(x - s * 0.55, by - s * 0.12, x - s * 0.2, by - s * 0.14); };
    body(); c.strokeStyle = LN; c.lineWidth = s * 0.34 + lw * 1.8; c.stroke(); body(); c.strokeStyle = col; c.lineWidth = s * 0.34; c.stroke();
    body(); c.strokeStyle = shadeC(col, -0.3); c.lineWidth = s * 0.12; c.save(); c.translate(s * 0.04, s * 0.08); c.stroke(); c.restore();
    body(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = s * 0.06; c.save(); c.translate(-s * 0.06, -s * 0.1); c.stroke(); c.restore();
    // the legs tucked under, the head a blunt wedge with no eyes, a ridge of three knobs along the back
    for (const [lx, ly] of [[-0.35, -0.08], [0.3, -0.06]]) { ell(c, x + lx * s, by + ly * s, s * 0.2, s * 0.1); c.fillStyle = shadeC(col, -0.15); c.fill(); ink(c, lw * 0.8); }
    c.beginPath(); c.moveTo(x + s * 0.45, by - s * 0.42); c.lineTo(x + s * 0.78, by - s * 0.3); c.lineTo(x + s * 0.72, by - s * 0.02); c.lineTo(x + s * 0.4, by - s * 0.05); c.closePath(); c.fillStyle = shade(c, col, s * 0.3, x + s * 0.5, by - s * 0.35, 0.35); c.fill(); ink(c, lw);
    for (let i = 0; i < 3; i++) { const u = 0.25 + i * 0.22, px = x + s * (0.55 - u * 1.1), py = by - s * (0.95 + Math.sin(u * Math.PI) * 0.18); c.beginPath(); c.arc(px, py, s * 0.07, 0, TAU); c.fillStyle = shadeC(col, 0.2); c.fill(); ink(c, lw * 0.6); }
    c.restore();
    // the eye stone sealed in the hollow of the body
    eyeStone(c, x - s * 0.05, by - s * 0.5, s * 0.62, 0, lw * 0.9, { col: (v | 0) % 2 ? CALCITE : CALCITE_HI });
    if (R() < 0.5) { c.strokeStyle = 'rgba(20,18,24,.3)'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.3); c.lineTo(x - s * 0.42, y - s * 0.1); c.stroke(); } }
  /* a tall narrow square pillar standing on (x, y): shaft w wide and h tall, a plinth and a plain capital, a lit face and
     a shaded side; o.cracked (0..1) draws cracks across it, o.col its stone (default calcite), o.band an ochre band */
  function pillarArt(c, x, y, w, h, lw, o) { o = o || {}; const col = o.col || CALCITE, dep = w * 0.55;
    c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, x + dep * 0.3, y + w * 0.1, w * 1.3, w * 0.45); c.fill();
    block(c, x, y, w * 1.5, w * 0.5, dep, shadeC(col, -0.1), lw);
    block(c, x, y - w * 0.5, w, h - w * 1.1, dep, col, lw, { joints: Math.max(2, Math.round(h / w / 1.6)) });
    block(c, x, y - h + w * 0.6, w * 1.4, w * 0.6, dep, shadeC(col, 0.06), lw);
    if (o.band) { c.fillStyle = rgba(OCHRE, 0.85); c.fillRect(x - w / 2 + 1, y - h * 0.62, w - 2, w * 0.18); c.fillStyle = rgba(BLACK, 0.8); c.fillRect(x - w / 2 + 1, y - h * 0.62 + w * 0.18, w - 2, Math.max(1, w * 0.05)); }
    if (o.eye) eyeStone(c, x, y - h * 0.78, w * 0.7, o.eyeOpen || 0, lw * 0.7, { glow: true });
    const k = o.cracked || 0; if (k > 0) { c.strokeStyle = 'rgba(20,18,24,.8)'; c.lineWidth = Math.max(1.2, lw * (0.6 + k)); c.beginPath(); c.moveTo(x - w * 0.3, y - h * 0.15); c.lineTo(x - w * 0.05, y - h * 0.35); c.lineTo(x - w * 0.3, y - h * 0.5); c.lineTo(x + w * 0.1, y - h * (0.5 + k * 0.3)); c.stroke(); if (k > 0.5) { c.beginPath(); c.moveTo(x + w * 0.4, y - h * 0.3); c.lineTo(x + w * 0.1, y - h * 0.45); c.stroke(); } glowIn(c, x, y - h * 0.4, w * 1.4, RED_HI, 0.3 * k); } }
  /* the eye pylon: a tall tapering black monolith on a stepped foot with calcite bands, a great red eye near its top
     behind two stone lids; pyl = { a, open, preview }: the pupil looks along a, the lids part by open */
  function pylonArt(c, x, y, T, pyl) { const lw = lw0(T), H = T * 3.6, wb = T * 0.5, wt = T * 0.3;
    c.fillStyle = 'rgba(20,18,24,.32)'; ell(c, x, y + T * 0.06, T * 0.9, T * 0.32); c.fill();
    block(c, x, y, T * 1.3, T * 0.3, T * 0.18, BLACK_HI, lw); block(c, x, y - T * 0.3, T * 1.0, T * 0.22, T * 0.14, shadeC(OCHRE, -0.2), lw);
    const y0 = y - T * 0.52; c.beginPath(); c.moveTo(x - wb, y0); c.lineTo(x - wt, y0 - H); c.lineTo(x + wt, y0 - H); c.lineTo(x + wb, y0); c.closePath(); c.fillStyle = cylG(c, x - wb, x + wb, BLACK_HI, BLACK_D); c.fill(); ink(c, lw);
    c.beginPath(); c.moveTo(x + wb, y0); c.lineTo(x + wb + T * 0.16, y0 - T * 0.1); c.lineTo(x + wt + T * 0.16, y0 - H - T * 0.1); c.lineTo(x + wt, y0 - H); c.closePath(); c.fillStyle = BLACK_D; c.fill(); ink(c, lw * 0.8);
    c.fillStyle = rgba(CALCITE_D, 0.8); for (const u of [0.18, 0.3]) { const yy = y0 - H * u, ww = wb + (wt - wb) * u; c.fillRect(x - ww + 1, yy, ww * 2 - 2, Math.max(1.5, T * 0.05)); }
    c.fillStyle = rgba(OCHRE, 0.8); c.fillRect(x - (wb + (wt - wb) * 0.24) + 1, y0 - H * 0.24, (wb + (wt - wb) * 0.24) * 2 - 2, Math.max(1, T * 0.035));
    const ey = y0 - H * 0.72, ew = T * 0.56, open = clamp(pyl.open == null ? 1 : pyl.open, 0, 1);
    if (pyl.blind) { /* a dead pylon: its socket empty and cracked, the stone round it stained */ c.beginPath(); c.moveTo(x - ew / 2, ey); c.quadraticCurveTo(x, ey - ew * 0.48, x + ew / 2, ey); c.quadraticCurveTo(x, ey + ew * 0.48, x - ew / 2, ey); c.closePath(); c.fillStyle = '#0C0C10'; c.fill(); ink(c, lw);
      c.strokeStyle = rgba(CALCITE_D, 0.7); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(x + ew * 0.2, ey - ew * 0.1); c.lineTo(x + ew * 0.45, ey - ew * 0.5); c.lineTo(x + ew * 0.4, ey - ew * 0.9); c.moveTo(x - ew * 0.3, ey + ew * 0.1); c.lineTo(x - ew * 0.5, ey + ew * 0.5); c.stroke(); c.fillStyle = rgba(RED_D, 0.35); c.fillRect(x - ew * 0.1, ey + ew * 0.2, ew * 0.2, H * 0.3); }
    else { if (open > 0.1) glowIn(c, x, ey, T * 1.3, RED_HI, 0.5 * open); eyeStone(c, x, ey, ew, open, lw, { glow: false, col: CALCITE_D }); }
    if (open > 0.1 && !pyl.blind) { const ir = ew * 0.42 * 0.9, dx = Math.cos(pyl.a || 0) * ir * 0.35, dy = Math.sin(pyl.a || 0) * ir * 0.25; c.fillStyle = INK; ell(c, x + dx, ey + dy, ir * 0.22, ir * 0.78 * open); c.fill(); }
    // the lids' stone frame and a crown of three short spikes
    if (!pyl.blind) { c.strokeStyle = CALCITE_D; c.lineWidth = Math.max(1.2, lw * 0.9); c.beginPath(); c.moveTo(x - ew * 0.56, ey); c.quadraticCurveTo(x, ey - ew * 0.55, x + ew * 0.56, ey); c.stroke(); }
    for (const u of [-0.6, 0, 0.6]) { c.beginPath(); c.moveTo(x + u * wt - T * 0.07, y0 - H); c.lineTo(x + u * wt, y0 - H - T * 0.32 - Math.abs(u) * -T * 0.1); c.lineTo(x + u * wt + T * 0.07, y0 - H); c.closePath(); c.fillStyle = BLACK_HI; c.fill(); ink(c, lw * 0.7); } }
  /* a screen's sheet: a pale calcite slab len wide and 1.6 tall standing on its rail, an ochre band, a black handle bar,
     a closed eye carved in it; drawn as a flat sheet with the side you see slightly lit */
  function screenArt(c, X, scr) { const T = X.Tz(), lw = lw0(T), e = scr.ends(), X0 = X.sx(e[0][0]), Y0 = X.sy(e[0][1]), X1 = X.sx(e[1][0]), Y1 = X.sy(e[1][1]), H = T * 1.6;
    // the sheet stands on its segment; it is drawn sheared a little toward its +a side when it runs up the screen, so a
    // north–south sheet still shows its face: local x runs along the sheet (0..L px), local y up it (0..H px)
    const ax = X1 - X0, ay = Y1 - Y0, L = Math.hypot(ax, ay) || 1, sh = -Math.sin(scr.a) * H * 0.42, hh = Math.sqrt(H * H - sh * sh), th = Math.max(2, T * 0.13);
    const nx = -ay / L, ny = ax / L, back = ny > 0 ? -1 : 1;   // (back: the normal's sign that points up the screen)
    c.save(); c.lineJoin = 'round';
    c.fillStyle = 'rgba(20,18,24,.3)'; c.beginPath(); c.moveTo(X0 - nx * th * 1.5, Y0 - ny * th * 1.5 + T * 0.1); c.lineTo(X1 - nx * th * 1.5, Y1 - ny * th * 1.5 + T * 0.1); c.lineTo(X1 + nx * th * 2.5, Y1 + ny * th * 2.5 + T * 0.14); c.lineTo(X0 + nx * th * 2.5, Y0 + ny * th * 2.5 + T * 0.14); c.closePath(); c.fill();
    // the thickness: the same sheet a little behind, on the side that faces up the screen
    { const ox = nx * th * back, oy = ny * th * back; c.beginPath(); c.moveTo(X0 + ox, Y0 + oy); c.lineTo(X1 + ox, Y1 + oy); c.lineTo(X1 + ox + sh, Y1 + oy - hh); c.lineTo(X0 + ox + sh, Y0 + oy - hh); c.closePath(); c.fillStyle = CALCITE_D; c.fill(); ink(c, lw * 0.8); }
    c.save(); c.transform(ax / L, ay / L, sh / H, -hh / H, X0, Y0);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(L, 0); c.lineTo(L, H); c.lineTo(0, H); c.closePath(); const g = c.createLinearGradient(0, H, 0, 0); g.addColorStop(0, CALCITE_HI); g.addColorStop(1, CALCITE); c.fillStyle = g; c.fill(); ink(c, lw);
    c.save(); c.clip();
    c.fillStyle = rgba(OCHRE, 0.85); c.fillRect(0, H * 0.78, L, H * 0.07); c.fillStyle = rgba(BLACK, 0.8); c.fillRect(0, H * 0.765, L, Math.max(1, H * 0.012));
    c.strokeStyle = 'rgba(20,18,24,.22)'; c.lineWidth = 1; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(L * k / 5, H * 0.05); c.lineTo(L * k / 5, H * 0.72); c.stroke(); }
    c.save(); c.scale(1, -1); closedEye(c, L / 2, -H * 0.5, Math.min(L * 0.4, T * 0.9), BLACK, Math.max(1.4, lw)); c.restore();
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(L * 0.04, H * 0.08); c.lineTo(L * 0.04, H * 0.92); c.stroke();
    c.restore();
    // the handle: a black bar standing out past the +a end, an ochre grip on it
    c.strokeStyle = LN; c.lineWidth = Math.max(3, T * 0.16); c.lineCap = 'round'; c.beginPath(); c.moveTo(L, H * 0.45); c.lineTo(L + T * 0.42, H * 0.45); c.stroke(); c.strokeStyle = BLACK_HI; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke(); c.fillStyle = OCHRE; c.beginPath(); c.arc(L + T * 0.42, H * 0.45, Math.max(2, T * 0.11), 0, TAU); c.fill(); ink(c, lw * 0.8);
    c.restore();
    if (scr.locked) label(c, 'THE SCREEN WAITS', (X0 + X1) / 2 + sh / 2, (Y0 + Y1) / 2 - hh - T * 0.25, T * 0.22, CALCITE_HI);
    c.restore(); }
  /* the great sealed eye of the sanctuary's north wall: eye = { x, y, w, open } in world tiles (x, y its centre) */
  function wallEye(c, X, eye) { const T = X.Tz(), Xs = X.sx(eye.x), Ys = X.sy(eye.y), W = eye.w * T, lw = lw0(T) * 1.4, open = clamp(eye.open || 0, 0, 1);
    c.save(); c.fillStyle = 'rgba(20,18,24,.4)'; ell(c, Xs, Ys + W * 0.06, W * 0.58, W * 0.3); c.fill();
    // the stone brow and the four wedge lids round it
    c.beginPath(); c.moveTo(Xs - W * 0.62, Ys + W * 0.02); c.quadraticCurveTo(Xs, Ys - W * 0.48, Xs + W * 0.62, Ys + W * 0.02); c.quadraticCurveTo(Xs, Ys + W * 0.42, Xs - W * 0.62, Ys + W * 0.02); c.closePath(); c.fillStyle = cylG(c, Xs - W * 0.6, Xs + W * 0.6, BLACK_HI, BLACK_D); c.fill(); ink(c, lw);
    if (open > 0.02) glowIn(c, Xs, Ys, W * 0.9, RED_HI, 0.6 * open);
    eyeStone(c, Xs, Ys, W, open, lw, { col: CALCITE_D, red: RED });
    c.strokeStyle = rgba(CALCITE_D, 0.9); c.lineWidth = Math.max(1.5, lw * 0.8); for (const u of [-0.5, 0.5]) { c.beginPath(); c.moveTo(Xs + u * W * 0.5, Ys + W * 0.18); c.lineTo(Xs + u * W * 0.3, Ys - W * 0.02); c.stroke(); c.beginPath(); c.moveTo(Xs + u * W * 0.5, Ys - W * 0.18); c.lineTo(Xs + u * W * 0.3, Ys - W * 0.02); c.stroke(); }
    c.fillStyle = rgba(OCHRE, 0.8); c.fillRect(Xs - W * 0.66, Ys - W * 0.5, W * 1.32, Math.max(2, T * 0.08)); c.restore(); }
  /* the red light of the ceiling slits: parallel stripes across the floor, anchored to the world, desaturated and
     unoutlined so they never read as lanes; k their strength */
  function stripes(c, X, k) { const T = X.Tz(), W = X.W(), Hh = X.H(), nx = 0.42, ny = 0.907, sp = 7.5, w = 1.25, t = X.g.t;
    const cx = X.me.x, cy = X.me.y, s0 = cx * nx + cy * ny, L = Math.hypot(W, Hh) * 1.2, ang = Math.atan2(nx, -ny);
    c.save(); for (let i = -4; i <= 4; i++) { const s = (Math.round(s0 / sp) + i) * sp, px = nx * s, py = ny * s, Xs = X.sx(px), Ys = X.sy(py), br = 0.75 + 0.25 * Math.sin(t * 0.7 + i * 1.3);
      c.save(); c.translate(Xs, Ys); c.rotate(ang); const g = c.createLinearGradient(0, -w * T, 0, w * T); g.addColorStop(0, rgba(RED, 0)); g.addColorStop(0.3, rgba(RED, 0.2 * k * br)); g.addColorStop(0.7, rgba(RED, 0.2 * k * br)); g.addColorStop(1, rgba(RED, 0)); c.fillStyle = g; c.fillRect(-L, -w * T, L * 2, w * T * 2);
      c.fillStyle = rgba(RED_HI, 0.07 * k * br); c.fillRect(-L, -w * T * 0.35, L * 2, w * T * 0.7); c.restore(); }
    c.restore(); }
  Object.assign(BAS, { eyeStone, closedEye, banner, beast, pillarArt, pylonArt, screenArt, wallEye, stripes, block });

  /* ======================= the running context: screens, pylons, sources, droplets, Calcification ======================= */
  const CTX = new WeakMap();
  function ctx(X) { let C = CTX.get(X.g); if (!C) { C = { X, screens: [], pylons: [], sources: [], drops: [], t: 0 }; CTX.set(X.g, C); calcify.reset(); CUR = C; } return C; }
  const SHADOW_FAR = 14;
  function inCone(x, y, src) { const d = Math.hypot(x - src.x, y - src.y); if (d > (src.len || 9)) return false; if (d < 0.3) return true; return Math.abs(angTo(src.a, Math.atan2(y - src.y, x - src.x))) < (src.spread == null ? 0.42 : src.spread); }
  function shadowOf(scr, src) { const e = scr.ends(), far = (src.len || SHADOW_FAR) + 2, out = []; for (const p of e) { const dx = p[0] - src.x, dy = p[1] - src.y, d = Math.hypot(dx, dy); if (d < 0.05) return null; out.push([p[0] + dx / d * far, p[1] + dy / d * far]); }
    return [e[0], e[1], out[1], out[0]]; }
  function inPoly(x, y, P) { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]); if (Math.abs(cr) < 1e-9) continue; const sg = cr > 0 ? 1 : -1; if (s === 0) s = sg; else if (s !== sg) return false; } return true; }
  let CUR = null;   // the context of the stage being played (set by everyStage and by make through ctx())
  function screensOf(X) { return (X ? ctx(X) : CUR || { screens: [] }).screens; }
  function inShadow(x, y, src) { for (const s of screensOf()) { const P = shadowOf(s, src); if (P && inPoly(x, y, P)) return true; } return false; }
  function gazeSeen(x, y, src) { if (!inCone(x, y, src)) return false; if (inShadow(x, y, src)) return false; const X = CUR && CUR.X; if (X && X.los && !X.los(src.x, src.y, x, y)) return false; return true; }
  function drawShadow(c, X, P, k) { const T = X.Tz(); c.save(); c.beginPath(); P.forEach((p, i) => i ? c.lineTo(X.sx(p[0]), X.sy(p[1])) : c.moveTo(X.sx(p[0]), X.sy(p[1]))); c.closePath();
    c.fillStyle = `rgba(28,26,34,${0.5 * k})`; c.fill(); c.strokeStyle = `rgba(20,18,24,${0.9 * k})`; c.lineWidth = Math.max(2, T * 0.09); c.stroke(); c.strokeStyle = rgba(CALCITE_HI, 0.75 * k); c.lineWidth = Math.max(1, T * 0.03); c.stroke();
    const cx = (P[0][0] + P[1][0] + P[2][0] + P[3][0]) / 4, cy = (P[0][1] + P[1][1] + P[2][1] + P[3][1]) / 4; c.globalAlpha = k; closedEye(c, X.sx(cx), X.sy(cy) - T * 0.1, T * 0.9, CALCITE_HI, Math.max(1.5, T * 0.06)); c.restore(); }
  /* one gaze cone in the game's warning red, the screens' shadows cut into it */
  function drawCone(c, X, src, k) { const T = X.Tz(), Xs = X.sx(src.x), Ys = X.sy(src.y), len = (src.len || 9) * T, sp = src.spread == null ? 0.42 : src.spread, t = X.g.t; k = k == null ? 1 : k;
    const cone = () => { c.beginPath(); c.moveTo(Xs, Ys); c.arc(Xs, Ys, len, src.a - sp, src.a + sp); c.closePath(); };
    c.save(); cone(); c.fillStyle = rgba(WARN, 0.16 * k); c.fill(); c.strokeStyle = rgba(WARN, 0.7 * k); c.lineWidth = 2; c.stroke();
    c.save(); cone(); c.clip(); c.globalCompositeOperation = 'lighter'; const pu = ((t * 0.9) % 1); c.strokeStyle = rgba(WARN, 0.35 * k * (1 - pu)); c.lineWidth = 3; c.beginPath(); c.arc(Xs, Ys, len * pu, src.a - sp, src.a + sp); c.stroke(); c.restore();
    c.save(); cone(); c.clip(); for (const s of screensOf()) { const P = shadowOf(s, src); if (P) drawShadow(c, X, P, k); } c.restore(); c.restore(); }
  function drawPreview(c, X, src, a) { const T = X.Tz(), Xs = X.sx(src.x), Ys = X.sy(src.y), len = (src.len || 9) * T, sp = src.spread == null ? 0.42 : src.spread; c.save(); c.setLineDash([T * 0.25, T * 0.2]); c.lineDashOffset = -X.g.t * T; c.strokeStyle = rgba(WARN, 0.55); c.lineWidth = 2; c.beginPath(); c.moveTo(Xs, Ys); c.arc(Xs, Ys, len, a - sp, a + sp); c.closePath(); c.stroke(); c.fillStyle = rgba(WARN, 0.05); c.fill(); c.restore(); }
  function source(X, src) { const C = ctx(X); if (!C.sources.includes(src)) C.sources.push(src); return src; }
  function unsource(X, src) { const C = ctx(X), i = C.sources.indexOf(src); if (i >= 0) C.sources.splice(i, 1); }

  /* ---- Calcification ---- */
  const calcify = { k: 0, stage: 0, rooted: 0, seen: false, pending: false, immune: 0, rx: 0, ry: 0, onRoot: null, flashT: 0, total: 0,
    reset() { this.k = 0; this.stage = 0; this.rooted = 0; this.seen = false; this.pending = false; this.immune = 0; this.flashT = 0; this.onRoot = null; },
    see() { this.pending = true; },
    add(n, X) { if (this.rooted > 0 || this.immune > 0) return; this.k = Math.min(3, this.k + (n || 1)); this.flashT = 0.4; if (X && this.k >= 3) this.root(X); },
    root(X) { const me = X.me; this.rooted = 1.2; this.rx = me.x; this.ry = me.y; this.k = 3; this.stage = 3; this.total++; X.hurtPet(X.ST().hp * 0.2, null); X.boom(me.x, me.y, 1.2, CALCITE_D, CALCITE_HI, { n: 14, shake: 6 }); X.text(me.x, me.y - 1.6, 'CALCIFIED', CALCITE_HI, 16); X.banner('CALCIFIED', 'Rooted in stone: the gaze lets go of what it has turned', CALCITE_HI, 1.8, true); if (X.sfx.crack) X.sfx.crack(); if (this.onRoot) this.onRoot(X); },
    tick(dt, X) { const me = X.me; this.seen = this.pending && !me.dead && !X.g.won; this.pending = false; this.flashT = Math.max(0, this.flashT - dt); this.immune = Math.max(0, this.immune - dt);
      if (this.rooted > 0) { this.rooted -= dt; me.x = this.rx; me.y = this.ry; me.vx = me.vy = 0; if (this.rooted <= 0) { this.rooted = 0; this.k = 0; this.stage = 0; this.immune = 1.5; X.ring(me.x, me.y, 0.3, 1.6, 0.4, CALCITE_HI, 0.4); X.text(me.x, me.y - 1.4, 'Released', CALCITE_HI, 13); } return; }
      if (this.seen && this.immune <= 0 && !me.dodge) { const was = Math.floor(this.k); this.k = Math.min(3, this.k + dt / 0.8); if (Math.floor(this.k) > was && this.k < 3) { X.text(me.x, me.y - 1.4, `Calcification ${Math.floor(this.k)}`, CALCITE_HI, 13); if (X.sfx.crack) X.sfx.crack(); } if (this.k >= 3) this.root(X); }
      else this.k = Math.max(0, this.k - dt * 2);
      this.stage = Math.floor(this.k + 1e-6); },
    // the HUD meter: three segments filling with grey stone, and the stone creeping up over the pet's feet
    drawHUD(c, X) { if (this.k <= 0.01 && this.rooted <= 0) return; const W = X.W(), x0 = W / 2 - 96, y = 128, w = 192, h = 14, k = this.rooted > 0 ? 3 : this.k;
      c.save(); c.fillStyle = 'rgba(16,16,20,.8)'; GFX.rr(c, x0 - 4, y - 4, w + 8, h + 8, 9); c.fill();
      for (let i = 0; i < 3; i++) { const sx = x0 + i * (w / 3) + 2, sw = w / 3 - 4, f = clamp(k - i, 0, 1); c.fillStyle = 'rgba(255,255,255,.1)'; GFX.rr(c, sx, y, sw, h, 5); c.fill(); if (f > 0) { c.save(); GFX.rr(c, sx, y, sw, h, 5); c.clip(); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, CALCITE_HI); g.addColorStop(1, CALCITE_D); c.fillStyle = g; c.fillRect(sx, y, sw * f, h); c.fillStyle = 'rgba(20,18,24,.35)'; for (let j = 0; j < 4; j++) c.fillRect(sx + sw * f * (0.15 + j * 0.22), y + (j % 2) * h * 0.5, 1.2, h * 0.5); c.restore(); } }
      if (this.seen || this.rooted > 0) { c.strokeStyle = rgba(WARN, 0.8 + 0.2 * Math.sin(X.g.t * 12)); c.lineWidth = 2; GFX.rr(c, x0 - 4, y - 4, w + 8, h + 8, 9); c.stroke(); }
      c.restore(); label(c, this.rooted > 0 ? 'CALCIFIED · ROOTED' : this.seen ? 'SEEN · CALCIFICATION ' + Math.floor(k) + '/3' : 'CALCIFICATION ' + Math.floor(k) + '/3', W / 2, y + h + 17, 13, this.seen || this.rooted > 0 ? WARN : CALCITE_HI); },
    drawFeet(c, X) { const k = this.rooted > 0 ? 1 : this.k / 3; if (k <= 0.01) return; const me = X.me, T = X.Tz(), Xs = X.sx(me.x), Ys = X.sy(me.y), r = T * 0.5, hgt = T * (this.rooted > 0 ? 0.8 : 0.1 + k * 0.5);
      c.save(); c.globalAlpha = 0.95; c.beginPath(); for (let i = 0; i <= 10; i++) { const u = i / 10, x = Xs - r + u * r * 2, bump = hh(i, Math.floor(me.x * 3), 5) * 0.35; c.lineTo(x, Ys + T * 0.1 - hgt * (0.55 + bump) * Math.sin(u * Math.PI)); } c.lineTo(Xs + r, Ys + T * 0.18); c.lineTo(Xs - r, Ys + T * 0.18); c.closePath();
      const g = c.createLinearGradient(0, Ys - hgt, 0, Ys + T * 0.2); g.addColorStop(0, CALCITE_HI); g.addColorStop(1, CALCITE_D); c.fillStyle = g; c.fill(); ink(c, Math.max(1.2, T * 0.05));
      c.strokeStyle = 'rgba(20,18,24,.4)'; c.lineWidth = 1; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(Xs - r * 0.5 + i * r * 0.5, Ys + T * 0.15); c.lineTo(Xs - r * 0.4 + i * r * 0.45, Ys + T * 0.15 - hgt * 0.4); c.stroke(); }
      if (this.rooted > 0) { c.globalAlpha = 0.5 + 0.3 * Math.sin(X.g.t * 10); c.strokeStyle = WARN; c.lineWidth = 2; ell(c, Xs, Ys + T * 0.15, r * 1.25, r * 0.5); c.stroke(); } c.restore(); } };

  /* ---- petrification droplets ---- */
  function spit(X, m, tx, ty, o) { o = o || {}; const C = ctx(X), a = Math.atan2(ty - m.y, tx - m.x), v = o.v || 3.2; C.drops.push({ x: m.x + Math.cos(a) * m.r * 0.8, y: m.y + Math.sin(a) * m.r * 0.6, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: o.life || 3.4, dmg: o.dmg != null ? o.dmg : m.dmg, r: 0.24, src: m, ph: Math.random() * 6 }); if (X.sfx.pop) X.sfx.pop(); }
  function dropsTick(C, dt) { const X = C.X, me = X.me; for (const d of C.drops) { d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; const tx = Math.floor(d.x), ty = Math.floor(d.y); if (X.tileAt(tx, ty) === T_SOLID) { d.life = 0; X.sparks(d.x, d.y, CALCITE_HI, 5, 3); continue; }
      if (!me.dead && Math.hypot(me.x - d.x, me.y - d.y) < me.r + d.r) { if (me.dodge) continue; d.life = 0; X.hurtPet(d.dmg, d.src); calcify.add(1, X); X.text(me.x, me.y - 1.8, 'Petrifying!', CALCITE_HI, 13); X.sparks(d.x, d.y, CALCITE_HI, 8, 4); } }
    for (let i = C.drops.length - 1; i >= 0; i--) if (C.drops[i].life <= 0) C.drops.splice(i, 1); }
  function dropsDraw(c, C) { const X = C.X, T = X.Tz(), t = X.g.t; for (const d of C.drops) { const Xs = X.sx(d.x), Ys = X.sy(d.y), r = d.r * T; c.save(); c.fillStyle = 'rgba(20,18,24,.25)'; ell(c, Xs, Ys + T * 0.1, r * 0.9, r * 0.35); c.fill(); const Y2 = Ys - T * 0.35 + Math.sin(t * 6 + d.ph) * T * 0.03;
      glowIn(c, Xs, Y2, r * 2.2, RED_HI, 0.35); c.beginPath(); c.moveTo(Xs - d.vx / Math.hypot(d.vx, d.vy) * r * 1.6, Y2 - d.vy / Math.hypot(d.vx, d.vy) * r * 1.0); c.arc(Xs, Y2, r, 0, TAU); c.closePath(); c.fillStyle = shade(c, CALCITE_HI, r, Xs - r * 0.3, Y2 - r * 0.3, 0.4); c.fill(); ink(c, Math.max(1, T * 0.04));
      c.fillStyle = RED; c.beginPath(); c.arc(Xs, Y2, r * 0.42, 0, TAU); c.fill(); c.fillStyle = INK; c.beginPath(); c.arc(Xs, Y2, r * 0.16, 0, TAU); c.fill(); c.restore(); } }

  /* ---- screens on rails ---- */
  function screen(X, H, o) { const C = ctx(X), stops = (o.stops || [[o.x, o.y]]).map(p => [p[0], p[1]]), i0 = clamp(o.i0 || 0, 0, stops.length - 1), len = o.len || 3, a = o.a || 0;
    const scr = H.obj({ x: o.x != null && !o.stops ? o.x : stops[i0][0], y: o.y != null && !o.stops ? o.y : stops[i0][1], kind: 'screen', r: 0.4, h: 2.0, a, len, stops, i: i0, from: i0, moving: 0, k: 0, dir: 1, locked: false, onArrive: null, busy: false, label: '',
      draw(c, Xs, Ys, T, s) { screenArt(c, X, s); } });
    // the handle: a small spot at the sheet's +a end (so hiding behind the sheet never slides it); it moves with the sheet
    scr.handle = H.obj({ x: scr.x, y: scr.y, kind: 'handle', r: 0.7, h: 1.3, screen: scr, dy: 0.02, label: s => s.screen.locked || s.screen.moving ? '' : (o.label || (stops.length > 1 ? 'SLIDE THE SCREEN' : '')), draw() {},
      use(s) { const sc = s.screen; if (sc.locked) { X.text(sc.x, sc.y - 1.8, 'The screen waits', CALCITE_HI, 13); return; } if (!sc.moving) sc.next(); } });
    scr.ends = () => { const hx = Math.cos(scr.a) * scr.len / 2, hy = Math.sin(scr.a) * scr.len / 2; return [[scr.x - hx, scr.y - hy], [scr.x + hx, scr.y + hy]]; };
    scr.blocks = (x0, y0, x1, y1) => { const e = scr.ends(), d = (ax, ay, bx, by, cx, cy) => (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); const d1 = d(x0, y0, x1, y1, e[0][0], e[0][1]), d2 = d(x0, y0, x1, y1, e[1][0], e[1][1]), d3 = d(e[0][0], e[0][1], e[1][0], e[1][1], x0, y0), d4 = d(e[0][0], e[0][1], e[1][0], e[1][1], x1, y1); return d1 * d2 < 0 && d3 * d4 < 0; };
    scr.goTo = i => { i = clamp(i | 0, 0, stops.length - 1); if (i === scr.i && !scr.moving) return false; scr.from = scr.moving ? scr.i : scr.i; scr.fx = scr.x; scr.fy = scr.y; scr.i = i; scr.moving = 1; scr.k = 0; scr.busy = true; if (X.sfx.whoosh) X.sfx.whoosh(); return true; };
    scr.next = () => { if (stops.length < 2) return false; let n = scr.i + scr.dir; if (n < 0 || n >= stops.length) { scr.dir *= -1; n = scr.i + scr.dir; } return scr.goTo(n); };
    scr.handleAt = () => { const e = scr.ends()[1]; return [e[0] + Math.cos(scr.a) * 0.45, e[1] + Math.sin(scr.a) * 0.45]; };
    scr.tick = dt => { if (scr.moving) { scr.k = Math.min(1, scr.k + dt); const u = scr.k < 0.5 ? 2 * scr.k * scr.k : 1 - Math.pow(-2 * scr.k + 2, 2) / 2, tx = stops[scr.i][0], ty = stops[scr.i][1]; scr.x = scr.fx + (tx - scr.fx) * u; scr.y = scr.fy + (ty - scr.fy) * u;
        if (scr.k >= 1) { scr.moving = 0; scr.busy = false; scr.x = tx; scr.y = ty; X.ring(scr.x, scr.y, 0.3, 1.4, 0.3, CALCITE_HI, 0.3); if (X.sfx.crack) X.sfx.crack(); if (scr.onArrive) scr.onArrive(scr); } }
      const hp = scr.handleAt(); scr.handle.x = hp[0]; scr.handle.y = hp[1]; scr.handle.busy = scr.moving > 0;
      // the sheet carries no one through it: the pet is eased out of its thickness (never while it is rooted in stone)
      const me = X.me; if (calcify.rooted > 0 || me.dead) return; const e = scr.ends(), dx = e[1][0] - e[0][0], dy = e[1][1] - e[0][1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, rx = me.x - e[0][0], ry = me.y - e[0][1], al = rx * ux + ry * uy, of = -rx * uy + ry * ux;
      if (al > -0.2 && al < L + 0.2 && Math.abs(of) < 0.45) { const s = of >= 0 ? 1 : -1, push = (0.45 - Math.abs(of)) * s; X.moveEnt(me, -uy * push, ux * push, 0); } };
    C.screens.push(scr); return scr; }
  function drawRail(c, X, scr) { const T = X.Tz(), lw = lw0(T), st = scr.stops; if (st.length < 2) return; c.save(); c.lineCap = 'round';
    c.strokeStyle = 'rgba(20,18,24,.35)'; c.lineWidth = Math.max(3, T * 0.22); c.beginPath(); st.forEach((p, i) => i ? c.lineTo(X.sx(p[0]), X.sy(p[1]) + T * 0.06) : c.moveTo(X.sx(p[0]), X.sy(p[1]) + T * 0.06)); c.stroke();
    c.strokeStyle = BLACK_D; c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); st.forEach((p, i) => i ? c.lineTo(X.sx(p[0]), X.sy(p[1])) : c.moveTo(X.sx(p[0]), X.sy(p[1]))); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.18)'; c.lineWidth = Math.max(1, T * 0.03); c.stroke();
    st.forEach((p, i) => { const Xs = X.sx(p[0]), Ys = X.sy(p[1]), here = i === scr.i && !scr.moving; ell(c, Xs, Ys, T * 0.26, T * 0.12); c.fillStyle = here ? OCHRE : BLACK_HI; c.fill(); ink(c, lw * 0.7); if (!here) { c.strokeStyle = rgba(CALCITE_HI, 0.7); c.lineWidth = Math.max(1, lw * 0.6); ell(c, Xs, Ys, T * 0.16, T * 0.07); c.stroke(); } });
    c.restore(); }
  /* ---- eye pylons ---- */
  function pylon(X, H, o) { const C = ctx(X), angles = o.angles && o.angles.length ? o.angles.slice() : [o.a || 0], i0 = clamp(o.i0 || 0, 0, angles.length - 1);
    const pyl = H.obj({ x: o.x, y: o.y, kind: 'pylon', r: 0.9, h: 4.2, angles, ai: i0, a: angles[i0], open: 1, preview: null, t: o.t0 || 0, period: o.period || 7, len: o.len || 9, spread: o.spread == null ? 0.42 : o.spread, hold: false, turning: 0, label: '',
      draw(c, Xs, Ys, T, s) { pylonArt(c, Xs, Ys, T, s); } });
    pyl.src = source(X, { x: o.x, y: o.y, a: pyl.a, len: pyl.len, spread: pyl.spread, open: true, pylon: pyl });
    pyl.setAngle = i => { pyl.ai = ((i % angles.length) + angles.length) % angles.length; pyl.a = angles[pyl.ai]; pyl.src.a = pyl.a; pyl.preview = null; pyl.t = 0; };
    pyl.timeToTurn = () => Math.max(0, pyl.period - pyl.t);
    pyl.tick = dt => { if (pyl.turning > 0) { pyl.turning -= dt; const u = clamp(1 - pyl.turning / 0.5, 0, 1); pyl.a = pyl.a0 + angTo(pyl.a0, pyl.a1) * (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2); pyl.open = u < 0.3 ? 1 - u / 0.3 : u > 0.7 ? (u - 0.7) / 0.3 : 0; if (pyl.turning <= 0) { pyl.turning = 0; pyl.a = pyl.a1; pyl.open = 1; pyl.t = 0; } pyl.src.a = pyl.a; pyl.src.open = pyl.open > 0.6; return; }
      if (pyl.hold || angles.length < 2) { pyl.src.open = true; return; } pyl.t += dt;
      if (pyl.t >= pyl.period - 1 && pyl.preview == null) pyl.preview = angles[(pyl.ai + 1) % angles.length];
      if (pyl.t >= pyl.period) { pyl.ai = (pyl.ai + 1) % angles.length; pyl.a0 = pyl.a; pyl.a1 = angles[pyl.ai]; pyl.turning = 0.5; pyl.preview = null; if (X.sfx.hum) X.sfx.hum(); } };
    C.pylons.push(pyl); return pyl; }
  Object.assign(BAS, { ctx, inCone, shadowOf, inShadow, gazeSeen, drawShadow, drawCone, drawPreview, source, unsource, calcify, spit, screen, pylon, screens: screensOf, pylons: X => ctx(X).pylons, sources: X => ctx(X).sources, inPoly });

  /* ======================= the lands ======================= */
  /* the chasm the monastery hangs over: black depth, a faint red haze far down, slow motes */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.veilchasm = { base: '#101014',
    paint(c, S, R) { c.fillStyle = '#101014'; c.fillRect(0, 0, S, S); for (let i = 0; i < 5; i++) { const x = R() * S, y = R() * S, r = 14 + R() * 20; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, 'rgba(191,103,93,.14)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } }
      for (let i = 0; i < 12; i++) { c.fillStyle = `rgba(216,209,187,${0.08 + R() * 0.12})`; c.beginPath(); c.arc(R() * S, R() * S, 0.8, 0, TAU); c.fill(); }
      for (let i = 0; i < 6; i++) { const x = R() * S, y = R() * S, w = 8 + R() * 14; c.strokeStyle = 'rgba(36,36,40,.9)'; c.lineWidth = 1.5; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.lineTo(x + ox + w * 0.3, y + oy + 3); c.lineTo(x + ox + w, y + oy - 2); c.stroke(); } } },
    back(c, o) { const { pat, pattern, k, W, H, t } = o; pat(pattern('veilchasm', k), 1, W / 2 + t * 1.5, H / 2 - t * 2); },
  };
  /* the floors' decals */
  window.DECAL_EXT = window.DECAL_EXT || {};
  Object.assign(DECAL_EXT, {
    eyeglyph(c, d, s, lw) { c.scale(1, 0.62); closedEye(c, 0, -s * 0.3, s * 2.2, 'rgba(36,36,40,.55)', Math.max(1, lw * 0.7)); },
    calcitecrust(c, d, s) { c.rotate(d.rot); c.fillStyle = 'rgba(240,235,219,.55)'; c.beginPath(); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = s * (1.3 + Math.sin(i * 2.7 + d.v * 9) * 0.5); c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.6); } c.closePath(); c.fill(); c.fillStyle = 'rgba(179,171,149,.45)'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(Math.cos(i * 1.9 + d.v) * s * 0.7, Math.sin(i * 1.9 + d.v) * s * 0.35, s * 0.14, 0, TAU); c.fill(); } },
    ochredust(c, d, s) { c.rotate(d.rot); const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 2.4); g.addColorStop(0, 'rgba(161,142,101,.35)'); g.addColorStop(1, 'rgba(161,142,101,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, s * 2.4, s * 1.2, 0, 0, TAU); c.fill(); },
    redseam(c, d, s) { c.rotate(d.rot); c.strokeStyle = 'rgba(191,103,93,.35)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(-s * 2.2, 0); c.lineTo(-s * 0.8, -s * 0.3); c.lineTo(s * 0.4, s * 0.2); c.lineTo(s * 2.2, -s * 0.1); c.stroke(); c.strokeStyle = 'rgba(20,18,24,.45)'; c.lineWidth = 0.8; c.stroke(); },
    stonechip(c, d, s) { c.rotate(d.rot); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? 'rgba(216,209,187,.7)' : 'rgba(58,58,66,.7)'; c.beginPath(); const x = Math.cos(i * 1.6 + d.v) * s * 1.1, y = Math.sin(i * 1.6 + d.v) * s * 0.5; c.moveTo(x - s * 0.2, y); c.lineTo(x, y - s * 0.16); c.lineTo(x + s * 0.22, y + s * 0.05); c.lineTo(x, y + s * 0.15); c.closePath(); c.fill(); } },
  });
  /* the floors: flagstones of calcite with ochre grout (the cloister), broad bright pavers crusted with calcite (the court),
     black volcanic slabs inlaid with ochre lines (the sanctuary); every tile its own slab, bevelled and cracked here and there */
  function slab(c, X, Y, T, R, tone, grout, lw) { const w = Math.max(1, T * 0.035), inset = Math.max(1, T * 0.03); c.fillStyle = grout; c.fillRect(X, Y, T, w); c.fillRect(X, Y, w, T);
    c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(X + w, Y + w, T - w, inset); c.fillRect(X + w, Y + w, inset, T - w); c.fillStyle = 'rgba(20,18,24,.18)'; c.fillRect(X, Y + T - inset, T, inset); c.fillRect(X + T - inset, Y, inset, T);
    if (R() < 0.3) { c.strokeStyle = `rgba(20,18,24,${tone})`; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); const x0 = X + T * (0.1 + R() * 0.3), y0 = Y + T * (0.1 + R() * 0.8); c.moveTo(x0, y0); c.lineTo(x0 + T * 0.25, y0 + (R() - 0.5) * T * 0.3); c.lineTo(x0 + T * (0.45 + R() * 0.3), y0 + (R() - 0.5) * T * 0.4); c.stroke(); } }
  function cloisterFloor(c, X, Y, T, h, h2, x, y, lw) { const R = rnd(x * 7919 + y * 104729 + 11), kind = Math.floor(hh(x, y, 61) * 14); c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 3 ? 'rgba(110,96,70,.14)' : 'rgba(255,255,255,.35)'; const s = Math.max(1, T * (0.015 + R() * 0.02)); c.fillRect(X + R() * T, Y + R() * T, s, s); }
    if (kind === 0) { /* calcite crust crept over the stone */ c.fillStyle = 'rgba(240,235,219,.5)'; c.beginPath(); const cx = X + T * (0.3 + R() * 0.4), cy = Y + T * (0.3 + R() * 0.4); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, r = T * (0.2 + R() * 0.16); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.7); } c.closePath(); c.fill(); }
    else if (kind === 1) { /* a carved closed eye worn by feet */ c.save(); c.translate(X + T / 2, Y + T * 0.45); c.scale(1, 0.6); closedEye(c, 0, 0, T * 0.55, 'rgba(36,36,40,.4)', Math.max(1, lw * 0.6)); c.restore(); }
    else if (kind === 2) { /* a drift of ochre dust along one edge */ const g = c.createLinearGradient(X, Y + T, X + T * 0.3, Y); g.addColorStop(0, 'rgba(161,142,101,.4)'); g.addColorStop(1, 'rgba(161,142,101,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    else if (kind === 3) { /* a slab split in two */ c.strokeStyle = 'rgba(110,96,70,.6)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(X + T * (0.2 + R() * 0.3), Y); c.lineTo(X + T * (0.4 + R() * 0.3), Y + T * 0.5); c.lineTo(X + T * (0.3 + R() * 0.4), Y + T); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 1; c.stroke(); }
    slab(c, X, Y, T, R, 0.3, 'rgba(110,96,70,.55)', lw); c.restore(); }
  function courtFloor(c, X, Y, T, h, h2, x, y, lw) { const R = rnd(x * 6151 + y * 92821 + 13), kind = Math.floor(hh(x, y, 67) * 12); c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? 'rgba(161,142,101,.22)' : 'rgba(255,255,255,.4)'; const s = Math.max(1, T * (0.015 + R() * 0.02)); c.fillRect(X + R() * T, Y + R() * T, s, s); }
    if (kind === 0) { c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); const cx = X + T * (0.3 + R() * 0.4), cy = Y + T * (0.3 + R() * 0.4); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU, r = T * (0.22 + R() * 0.2); c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.75); } c.closePath(); c.fill(); }
    else if (kind === 1) { c.strokeStyle = 'rgba(161,142,101,.6)'; c.lineWidth = Math.max(1, T * 0.04); c.beginPath(); c.moveTo(X + T * 0.15, Y + T * 0.5); c.lineTo(X + T * 0.85, Y + T * 0.5); c.moveTo(X + T * 0.5, Y + T * 0.15); c.lineTo(X + T * 0.5, Y + T * 0.85); c.stroke(); }
    else if (kind === 2) { const g = c.createRadialGradient(X + T * 0.5, Y + T * 0.5, 0, X + T * 0.5, Y + T * 0.5, T * 0.6); g.addColorStop(0, 'rgba(161,142,101,.3)'); g.addColorStop(1, 'rgba(161,142,101,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    else if (kind === 3) { c.save(); c.translate(X + T / 2, Y + T * 0.45); c.scale(1, 0.6); c.strokeStyle = 'rgba(161,142,101,.7)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.arc(0, 0, T * 0.32, 0, TAU); c.stroke(); c.restore(); }
    slab(c, X, Y, T, R, 0.22, 'rgba(161,142,101,.5)', lw); c.restore(); }
  function sanctFloor(c, X, Y, T, h, h2, x, y, lw) { const R = rnd(x * 5003 + y * 90001 + 17), kind = Math.floor(hh(x, y, 71) * 12); c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    for (let i = 0; i < 7; i++) { c.fillStyle = i % 3 ? 'rgba(0,0,0,.25)' : 'rgba(216,209,187,.18)'; const s = Math.max(1, T * (0.015 + R() * 0.02)); c.fillRect(X + R() * T, Y + R() * T, s, s); }
    if (kind === 0) { /* an ochre inlay line */ c.strokeStyle = 'rgba(161,142,101,.75)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(X, Y + T * 0.5); c.lineTo(X + T, Y + T * 0.5); c.stroke(); }
    else if (kind === 1) { c.strokeStyle = 'rgba(161,142,101,.75)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(X + T * 0.5, Y); c.lineTo(X + T * 0.5, Y + T); c.stroke(); }
    else if (kind === 2) { /* a faint red seam */ c.strokeStyle = 'rgba(191,103,93,.3)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(X + T * 0.1, Y + T * (0.2 + R() * 0.6)); c.lineTo(X + T * 0.5, Y + T * (0.2 + R() * 0.6)); c.lineTo(X + T * 0.9, Y + T * (0.2 + R() * 0.6)); c.stroke(); }
    else if (kind === 3) { /* a calcite deposit */ c.fillStyle = 'rgba(216,209,187,.4)'; ell(c, X + T * (0.3 + R() * 0.4), Y + T * (0.3 + R() * 0.4), T * (0.12 + R() * 0.1), T * (0.07 + R() * 0.06), R() * 3); c.fill(); }
    else if (kind === 4) { c.save(); c.translate(X + T / 2, Y + T * 0.45); c.scale(1, 0.6); closedEye(c, 0, 0, T * 0.5, 'rgba(161,142,101,.5)', Math.max(1, lw * 0.6)); c.restore(); }
    slab(c, X, Y, T, R, 0.5, 'rgba(10,10,12,.6)', lw); c.restore(); }
  /* the walls: black basalt blocks leaning inward (the courses narrow toward the top and a dark band under the roof reads
     as the overhang), a calcite string course, a carved closed eye every few tiles; the courtyard's walls are dusted ochre */
  function leanWall(c, X, Y, T, H, h, x, lw, B) { const lean = T * 0.07, g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, shadeC(B.face, -0.35)); g.addColorStop(0.3, B.face); g.addColorStop(1, B.faceD); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.moveTo(X, Y); c.lineTo(X + T + 0.5, Y); c.lineTo(X + T + 0.5, Y + lean * 1.4); c.lineTo(X, Y + lean * 1.4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, lw * 0.55); const rows = 3; for (let r = 1; r < rows; r++) { const yy = Y + H * r / rows; c.beginPath(); c.moveTo(X, yy); c.lineTo(X + T + 0.5, yy); c.stroke(); }
    for (let r = 0; r < rows; r++) { const off = (r % 2 ? 0.5 : 0) + (x % 2 ? 0.25 : 0), yy0 = Y + H * r / rows, yy1 = Y + H * (r + 1) / rows, k = 1 - (r / rows) * 0.18; const xx = X + ((off * T) % T) * k + (T - T * k) / 2; c.beginPath(); c.moveTo(xx, yy0); c.lineTo(xx + (r / rows - 0.5) * lean, yy1); c.stroke(); }
    c.fillStyle = rgba(B.wallBand || CALCITE_D, 0.75); c.fillRect(X, Y + H * 0.3, T + 0.5, Math.max(1, H * 0.05)); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X, Y + H * 0.35, T + 0.5, Math.max(1, H * 0.02));
    if (x % 4 === 1 && H > T * 0.4) { c.save(); c.translate(X + T / 2, Y + H * 0.62); closedEye(c, 0, 0, T * 0.5, rgba(B.wallGlyph || CALCITE_D, 0.8), Math.max(1, lw * 0.7)); c.restore(); }
    if (x % 4 === 3 && H > T * 0.4) { c.fillStyle = rgba(RED_D, 0.5); c.fillRect(X + T * 0.46, Y + H * 0.5, T * 0.08, H * 0.35); }
    c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(X + T - 1, Y, 1, H); }
  /* the bridges: slabs of calcite laid across the chasm on black beams, a closed eye on every third */
  function slabBridge(c, x, y, X, Y, T, isGap, tt, lw) { const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y); const horiz = gNS && !gWE ? true : gWE && !gNS ? false : true;
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(T * 0.02, T * 0.2, T * 0.96, T * 0.8); c.fillStyle = BLACK_D; c.fillRect(0, T * 0.1, T, T * 0.08); c.fillRect(0, T * 0.84, T, T * 0.08);
    const g = c.createLinearGradient(0, T * 0.14, 0, T * 0.88); g.addColorStop(0, CALCITE_HI); g.addColorStop(1, CALCITE_D); c.fillStyle = g; c.fillRect(T * 0.02, T * 0.14, T * 0.96, T * 0.74); c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.strokeRect(T * 0.02, T * 0.14, T * 0.96, T * 0.74);
    c.strokeStyle = 'rgba(110,96,70,.5)'; c.lineWidth = 1; c.beginPath(); c.moveTo(T * 0.5, T * 0.14); c.lineTo(T * 0.5, T * 0.88); c.stroke();
    if (((horiz ? x : y) % 3) === 0) { c.save(); c.translate(T / 2, T * 0.45); c.scale(1, 0.6); closedEye(c, 0, 0, T * 0.5, 'rgba(36,36,40,.5)', Math.max(1, lw * 0.6)); c.restore(); }
    c.restore(); }
  function slabEdge(c, x, y, X, Y, T, lw) { c.fillStyle = CALCITE_D; c.fillRect(X + T * 0.02, Y, T * 0.96, T * 0.12); c.fillStyle = BLACK_D; c.fillRect(X + T * 0.02, Y + T * 0.12, T * 0.96, T * 0.1); c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(X + T * 0.1, Y + T * 0.22, T * 0.8, T * 0.1); }

  /* ---- props ---- */
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { narrowpillar: [1.6, 4.6], stonebanner: [1.8, 4.2], beaststatue: [2.4, 2.6], eyelidmonolith: [4.2, 4.2], eyepylon: [2.0, 4.8], calcitecairn: [2.0, 2.0], purifybasin: [2.8, 2.0], veilarch: [3.4, 4.0], hornpillar: [2.0, 4.6], petrifiedplant: [2.2, 2.8], eyeshrine: [2.2, 3.2], basaltblock: [2.4, 2.2] });
  Object.assign(PROPS, {
    /* a tall narrow square pillar of calcite on a black plinth, an ochre band near the top */
    narrowpillar(c, T, v) { pillarArt(c, 0, 0, T * 0.3, T * 3.8 + (v % 3) * T * 0.2, lw0(T), { band: true, col: v % 4 === 0 ? CALCITE_D : CALCITE }); },
    /* a rigid stone banner on a black pole: a crossbar high up, the sheet hanging stiff below it */
    stonebanner(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.4); block(c, 0, 0, T * 0.5, T * 0.25, T * 0.1, BLACK_HI, lw);
      c.fillStyle = cylG(c, -T * 0.08, T * 0.08, BLACK_HI, BLACK_D); c.fillRect(-T * 0.08, -T * 3.9, T * 0.16, T * 3.7); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.strokeRect(-T * 0.08, -T * 3.9, T * 0.16, T * 3.7);
      c.fillStyle = OCHRE; c.beginPath(); c.moveTo(-T * 0.14, -T * 3.9); c.lineTo(0, -T * 4.15); c.lineTo(T * 0.14, -T * 3.9); c.closePath(); c.fill(); ink(c, lw * 0.7);
      banner(c, T * 0.42, -T * 3.5, T * 0.78, T * 2.6, lw, v); },
    /* an abstract beast of stone curled round an eye stone */
    beaststatue(c, T, v) { beast(c, 0, 0, T * 0.95, lw0(T), v); },
    /* a monolithic closed eyelid carved into a mass of black mountain rock */
    eyelidmonolith(c, T, v) { const lw = lw0(T), R = rnd(77 + v * 3); c.fillStyle = 'rgba(20,18,24,.35)'; ell(c, 0, T * 0.05, T * 2.0, T * 0.6); c.fill();
      c.beginPath(); c.moveTo(-T * 1.9, 0); c.lineTo(-T * 1.7, -T * 1.6); c.lineTo(-T * 1.0, -T * 3.2); c.lineTo(T * 0.2, -T * 3.7); c.lineTo(T * 1.3, -T * 3.0); c.lineTo(T * 1.85, -T * 1.4); c.lineTo(T * 1.9, 0); c.closePath(); c.fillStyle = shade(c, BLACK_HI, T * 2, -T * 0.6, -T * 2.2, 0.35); c.fill(); ink(c, lw * 1.2);
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(-T * 1.5 + i * T * 0.8, -T * (0.3 + R() * 0.4)); c.lineTo(-T * 1.3 + i * T * 0.8, -T * (1.4 + R() * 1.2)); c.stroke(); }
      c.save(); c.translate(0, -T * 1.75); eyeStone(c, 0, 0, T * 3.0, 0, lw * 1.3, { col: CALCITE_D }); c.restore();
      c.fillStyle = rgba(OCHRE, 0.7); c.fillRect(-T * 1.3, -T * 0.55, T * 2.6, Math.max(1.5, T * 0.07)); glowIn(c, 0, -T * 1.75, T * 1.2, RED_D, 0.12); },
    /* a dead eye pylon of the cloister: its socket empty and cracked (the live ones are BAS.pylon objects) */
    eyepylon(c, T, v) { pylonArt(c, 0, 0, T, { a: 0, open: 0, blind: true }); },
    /* a cairn of calcite lumps, the stone of what the gaze has turned */
    calcitecairn(c, T, v) { const lw = lw0(T), R = rnd(19 + v * 5); shadowEll(c, T, 0.7); for (let i = 0; i < 7; i++) { const u = i / 7, x = (R() - 0.5) * T * (0.9 - u * 0.6), y = -T * (0.12 + u * 0.75), r = T * (0.28 - u * 0.1); ell(c, x, y, r * 1.1, r * 0.8, (R() - 0.5) * 0.6); c.fillStyle = shade(c, i % 3 ? CALCITE : CALCITE_D, r, x - r * 0.3, y - r * 0.4, 0.4); c.fill(); ink(c, lw * 0.8); }
      eyeStone(c, T * 0.1, -T * 0.95, T * 0.5, 0, lw * 0.8); },
    /* a purification basin: a high pale rim, two gaps in it, a closed eye in its floor */
    purifybasin(c, T, v) { const lw = lw0(T); c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, 0, T * 0.05, T * 1.35, T * 0.5); c.fill();
      const rim = sd => { for (let i = 0; i < 4; i++) { const a = sd * (0.55 + i * 0.5), px = Math.cos(a) * T * 1.1, py = -T * 0.08 + Math.sin(a) * T * 0.42; block(c, px, py, T * 0.26, T * 0.42, T * 0.07, CALCITE, lw * 0.8); } };
      rim(-1); ell(c, 0, -T * 0.1, T * 1.15, T * 0.44); c.fillStyle = shadeC(CALCITE_D, -0.1); c.fill(); ink(c, lw); ell(c, 0, -T * 0.12, T * 0.92, T * 0.33); c.fillStyle = shadeC(OCHRE, -0.25); c.fill(); ink(c, lw * 0.7);
      c.save(); c.translate(0, -T * 0.12); c.scale(1, 0.4); closedEye(c, 0, -T * 0.1, T * 0.9, CALCITE_HI, Math.max(1.4, lw)); c.restore(); rim(1); },
    /* a veiled arch: two narrow pillars and a flat stone lintel, a stone veil hanging from it like a banner */
    veilarch(c, T, v) { const lw = lw0(T); shadowEll(c, T, 1.3); for (const sd of [-1, 1]) pillarArt(c, sd * T * 1.1, 0, T * 0.26, T * 3.2, lw, { col: CALCITE });
      block(c, 0, -T * 3.2, T * 2.9, T * 0.4, T * 0.14, BLACK_HI, lw); c.fillStyle = rgba(OCHRE, 0.85); c.fillRect(-T * 1.3, -T * 3.5, T * 2.6, Math.max(1.5, T * 0.08));
      banner(c, 0, -T * 3.2, T * 1.3, T * 2.0, lw, v + 2); },
    /* a calcite horn: a ruined column grown crooked like a tusk, ribbed, broken at its top */
    hornpillar(c, T, v) { const lw = lw0(T), R = rnd(41 + v * 7), lean = (v % 2 ? 1 : -1) * T * 0.35; shadowEll(c, T, 0.6);
      c.beginPath(); c.moveTo(-T * 0.42, 0); c.quadraticCurveTo(-T * 0.5 + lean * 0.5, -T * 2.2, -T * 0.12 + lean, -T * 3.9); c.lineTo(T * 0.1 + lean, -T * 3.75); c.lineTo(T * 0.2 + lean, -T * 3.95); c.quadraticCurveTo(T * 0.55 + lean * 0.4, -T * 2.0, T * 0.42, 0); c.closePath(); c.fillStyle = cylG(c, -T * 0.4, T * 0.4, CALCITE, CALCITE_D); c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(110,96,70,.4)'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 1; i < 8; i++) { const u = i / 8, w = T * (0.42 - u * 0.28), x = lean * u * u, y = -T * 3.9 * u; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x, y + T * 0.08, x + w, y); c.stroke(); }
      if (R() < 0.6) eyeStone(c, lean * 0.3, -T * 1.6, T * 0.42, 0, lw * 0.8, { col: CALCITE_D }); c.fillStyle = rgba(OCHRE, 0.8); c.fillRect(-T * 0.38, -T * 0.45, T * 0.76, Math.max(1.5, T * 0.07)); },
    /* a calcified plant: a shrub turned to grey stone, every leaf stiff; a last trace of green in its heart (it will come
       back when the eye closes) */
    petrifiedplant(c, T, v) { const lw = lw0(T), R = rnd(23 + v * 11), col = v % 5 === 0 ? '#8FA082' : CALCITE_D; shadowEll(c, T, 0.6);
      c.fillStyle = cylG(c, -T * 0.4, T * 0.4, OCHRE, OCHRE_D); c.fillRect(-T * 0.4, -T * 0.3, T * 0.8, T * 0.3); c.strokeStyle = LN; c.lineWidth = lw; c.strokeRect(-T * 0.4, -T * 0.3, T * 0.8, T * 0.3);
      for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.28 + (R() - 0.5) * 0.1, L = T * (1.2 + R() * 1.0), x1 = Math.cos(a) * L, y1 = -T * 0.3 + Math.sin(a) * L; c.strokeStyle = LN; c.lineWidth = T * 0.07 + lw * 1.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -T * 0.3); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = shadeC(col, -0.2); c.lineWidth = T * 0.07; c.stroke();
        c.save(); c.translate(x1, y1); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(T * 0.3, -T * 0.22, T * 0.55, 0); c.quadraticCurveTo(T * 0.3, T * 0.22, 0, 0); c.closePath(); c.fillStyle = shade(c, col, T * 0.3, T * 0.2, -T * 0.1, 0.35); c.fill(); ink(c, lw * 0.7); c.restore(); } },
    /* a little shrine: a black niche with an eye stone sealed in it, calcite drip below */
    eyeshrine(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.75); block(c, 0, 0, T * 1.3, T * 0.35, T * 0.14, BLACK_HI, lw); block(c, 0, -T * 0.35, T * 1.0, T * 2.0, T * 0.14, BLACK, lw);
      c.beginPath(); c.moveTo(-T * 0.32, -T * 0.6); c.lineTo(-T * 0.32, -T * 1.7); c.quadraticCurveTo(0, -T * 2.15, T * 0.32, -T * 1.7); c.lineTo(T * 0.32, -T * 0.6); c.closePath(); c.fillStyle = BLACK_D; c.fill(); c.strokeStyle = rgba(OCHRE, 0.8); c.lineWidth = Math.max(1.2, lw * 0.8); c.stroke();
      eyeStone(c, 0, -T * 1.15, T * 0.5, 0, lw * 0.8, { col: CALCITE }); glowIn(c, 0, -T * 1.15, T * 0.6, RED_D, 0.18);
      block(c, 0, -T * 2.35, T * 1.2, T * 0.25, T * 0.14, CALCITE_D, lw); c.fillStyle = rgba(CALCITE_HI, 0.8); for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-T * 0.2 + i * T * 0.2, -T * 0.6); c.lineTo(-T * 0.15 + i * T * 0.2, -T * 0.3); c.lineTo(-T * 0.1 + i * T * 0.2, -T * 0.6); c.closePath(); c.fill(); } },
    /* a block of basalt fallen from the roof, a red crack in it */
    basaltblock(c, T, v) { const lw = lw0(T), R = rnd(53 + v * 7); shadowEll(c, T, 0.85); c.save(); c.rotate((R() - 0.5) * 0.2); block(c, 0, 0, T * 1.3, T * 0.9 + R() * T * 0.3, T * 0.3, BLACK_HI, lw, { joints: 0 }); c.restore();
      c.strokeStyle = rgba(RED, 0.7); c.lineWidth = Math.max(1.2, lw * 0.7); c.beginPath(); c.moveTo(-T * 0.3, -T * 0.1); c.lineTo(-T * 0.05, -T * 0.5); c.lineTo(T * 0.15, -T * 0.4); c.lineTo(T * 0.3, -T * 0.9); c.stroke(); glowIn(c, 0, -T * 0.5, T * 0.6, RED_D, 0.15); },
  });

  /* ---- the lands themselves ---- */
  const land = o => Object.assign({ rift: true, tile: 'keep', out: true, ambient: 'motes', hazard: 'laser', gap: 'veilchasm', bridgeFn: slabBridge, bridgeEdge: slabEdge, wallFn: leanWall, propN: [6, 4], fog: '#101014', darkRGB: '14,12,16' }, o);
  BIOMES.cloister = land({ name: 'The Outer Cloister', out: false, dark: 0.16, bg: '#101014', accent: CALCITE_HI, light: CALCITE_HI, bridgeCol: CALCITE, deco: OCHRE,
    floor: ['#CFC8B3', '#C8C1AC', '#D6CFBA'], grout: '#8E7F60', hi: '#F0EBDB', top: '#44444C', face: '#2E2E34', faceD: '#1A1A1E', cliff: '#1E1E22', grade: 'rgba(191,103,93,.045)', wallBand: CALCITE_D,
    props: ['narrowpillar', 'stonebanner', 'beaststatue', 'narrowpillar', 'calcitecairn', 'eyepylon', 'eyelidmonolith', 'stonebanner', 'narrowpillar'], floorFn: cloisterFloor });
  BIOMES.courtyard = land({ name: 'The Calcite Courtyard', dark: 0.08, bg: '#101014', accent: OCHRE_HI, light: '#FFFFFF', bridgeCol: CALCITE_HI, deco: OCHRE,
    floor: ['#E2DCC8', '#DAD3BE', '#E8E2CF'], grout: '#A18E65', hi: '#FFFFFF', top: '#5A5244', face: '#3E3830', faceD: '#26221C', cliff: '#2A2620', grade: 'rgba(161,142,101,.05)', wallBand: OCHRE, wallGlyph: OCHRE_HI,
    props: ['narrowpillar', 'purifybasin', 'veilarch', 'beaststatue', 'stonebanner', 'narrowpillar', 'calcitecairn', 'veilarch'], floorFn: courtFloor });
  BIOMES.sanctuary = land({ name: 'The Petrified Sanctuary', out: false, dark: 0.26, bg: '#0A0A0E', accent: RED_HI, light: RED_HI, bridgeCol: CALCITE_D, deco: RED,
    floor: ['#37373E', '#33333A', '#3C3C44'], grout: '#0E0E10', hi: '#52525A', top: '#303036', face: '#222226', faceD: '#121214', cliff: '#141416', grade: 'rgba(191,103,93,.07)', wallBand: OCHRE_D, wallGlyph: CALCITE_D,
    props: ['hornpillar', 'petrifiedplant', 'eyeshrine', 'beaststatue', 'stonebanner', 'hornpillar', 'basaltblock', 'petrifiedplant', 'narrowpillar'], floorFn: sanctFloor, fog: '#0A0A0E', darkRGB: '10,10,14' });
  BIOME_ORDER.push('cloister', 'courtyard', 'sanctuary');
  DARK_COL.cloister = '14,12,16'; DARK_COL.courtyard = '16,14,12'; DARK_COL.sanctuary = '10,10,14';
  if (typeof DECALS !== 'undefined') { DECALS.cloister = [['eyeglyph', 0.03], ['calcitecrust', 0.06], ['ochredust', 0.05], ['stonechip', 0.04]]; DECALS.courtyard = [['calcitecrust', 0.07], ['ochredust', 0.07], ['eyeglyph', 0.02]]; DECALS.sanctuary = [['redseam', 0.06], ['stonechip', 0.05], ['eyeglyph', 0.03], ['calcitecrust', 0.03]]; }
  /* the rooms' rims: pillars at intervals round the walkways (a colonnade), banners and beasts between them */
  const RIMS = { cloister: ['narrowpillar', 'narrowpillar', 'stonebanner', 'beaststatue', 'narrowpillar', 'calcitecairn'], courtyard: ['narrowpillar', 'narrowpillar', 'veilarch', 'beaststatue', 'stonebanner', 'purifybasin'], sanctuary: ['hornpillar', 'narrowpillar', 'stonebanner', 'beaststatue', 'eyeshrine', 'petrifiedplant'] };
  function dressRim({ rm, i, G, RM, props, R, MW, walk, okFeature, first, id }) {
    const L = RIMS[rm.biome]; if (!L) return; const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return; const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => !walk(k + d) && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]]; for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } } return seen.size >= open.length; };
    let want = Math.round(rim.length * (first ? 0.14 : 0.24)), tries = 0;
    // (pillars prefer a rhythm: every third rim cell along a wall)
    rim.sort((a, b) => a - b);
    while (want > 0 && rim.length && tries++ < 160) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1); if ([1, -1, MW, -MW].filter(d => props.has(k + d)).length > 1) continue; const was = G[k]; G[k] = T_SOLID; if (!connected()) { G[k] = was; continue; } const x = k % MW, y = (k / MW) | 0; props.set(k, (x + y) % 3 === 0 ? L[0] : L[Math.floor(R() * L.length)]); want--; }
  }
  BIOMES.cloister.dress = BIOMES.courtyard.dress = BIOMES.sanctuary.dress = dressRim;

  /* ======================= the brood ======================= */
  Object.assign(MON, {
    calciteleech: { name: 'Calcite leech', from: 999, hp: 300, spd: 0, r: 0.5, dmg: 18, xp: 17, coin: 1.0, color: '#D8D1BB', bio: ['cloister', 'courtyard', 'sanctuary'], still: true, tip: 'A pale smooth cone of calcite with a round black mouth and three red eyes down its spine. It never moves; it spits slow petrification droplets: each that lands adds a stage of Calcification. Step aside; they are slow.', kit: [] },
    witnessscarab: { name: 'Witness scarab', from: 999, hp: 360, spd: 1.0, r: 0.56, dmg: 20, xp: 20, coin: 1.1, color: '#242428', bio: ['cloister', 'courtyard', 'sanctuary'], tip: 'A flat black beetle carrying a tall red eye plate on its back. The eye casts a narrow cone that turns slowly toward you: stand in it and you calcify (three stages root you). It turns slowly enough to flank: get round behind it, or kill it from a screen\'s shadow.', kit: [] },
    brokensentinel: { name: 'Broken sentinel', from: 999, hp: 460, spd: 1.1, r: 0.62, dmg: 24, xp: 22, coin: 1.2, color: '#B3AB95', bio: ['cloister', 'courtyard', 'sanctuary'], tip: 'A four-legged stone beast with a rectangular torso and no head: a small red orb floats where the head should be. The orb locks a thin red line to you; once the line has been unbroken for a second it charges along the shown lane. Break the line behind a pillar, a screen or a wall, or sidestep the charge.', kit: [] },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a pale smooth cone lying on the floor, its wide round end (the mouth) toward you, three red eyes down its spine;
       spitting, the mouth gapes and the eyes flare */
    calciteleech(c, r, ph, o) { const lw = lwOf(r), sp = o.mode === 'block' ? 1 : 0, br = Math.sin(ph * TAU) * r * 0.04;
      c.fillStyle = 'rgba(20,18,24,.28)'; ell(c, -r * 0.1, r * 0.55, r * 1.15, r * 0.3); c.fill();
      c.beginPath(); c.moveTo(-r * 1.25, r * 0.3); c.quadraticCurveTo(-r * 0.4, -r * 0.75 - br, r * 0.55, -r * 0.62 - br); c.quadraticCurveTo(r * 0.95, -r * 0.55, r * 0.95, r * 0.02); c.quadraticCurveTo(r * 0.95, r * 0.6, r * 0.55, r * 0.62); c.quadraticCurveTo(-r * 0.4, r * 0.72, -r * 1.25, r * 0.3); c.closePath(); c.fillStyle = shade(c, o.color, r, -r * 0.3, -r * 0.4, 0.4); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(110,96,70,.35)'; c.lineWidth = lw * 0.6; for (let i = 0; i < 4; i++) { const u = 0.15 + i * 0.22, x = -r * 1.2 + u * r * 2.1, h = r * (0.1 + u * 0.55); c.beginPath(); c.moveTo(x, -h - br * u); c.quadraticCurveTo(x + r * 0.05, 0, x, h * 0.95); c.stroke(); }
      ell(c, r * 0.72, 0, r * 0.3 * (1 + sp * 0.2), r * 0.52 * (1 + sp * 0.25)); c.fillStyle = INK; c.fill(); stroke(c, lw * 0.8); c.fillStyle = 'rgba(191,103,93,.55)'; ell(c, r * 0.78, 0, r * 0.12 * (1 + sp), r * 0.28 * (1 + sp * 0.3)); c.fill();
      for (let i = 0; i < 3; i++) { const u = 0.3 + i * 0.2, x = -r * 1.2 + u * r * 2.1, y = -r * (0.12 + u * 0.55) * 0.92 - br * u; c.beginPath(); c.arc(x, y, r * 0.11, 0, TAU); c.fillStyle = sp ? RED_HI : RED; c.fill(); stroke(c, lw * 0.6); c.fillStyle = INK; c.beginPath(); c.arc(x + r * 0.02, y, r * 0.045, 0, TAU); c.fill(); }
      if (sp) glowIn(c, r * 0.75, 0, r * 0.9, RED_HI, 0.5); },
    /* a flat black beetle, six legs working, with a tall red eye plate standing upright on its back; the mode 'g0'..'g7'
       tells which way its eye looks (the pupil slides that way) */
    witnessscarab(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 2), gi = o.mode && o.mode[0] === 'g' ? +o.mode.slice(1) : 2, ga = gi / 8 * TAU;
      c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, 0, r * 0.6, r * 1.0, r * 0.28); c.fill();
      for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) { const x0 = sd * r * 0.5, y0 = r * (0.05 + i * 0.16), x1 = sd * r * (0.95 + i * 0.04), y1 = r * (0.3 + i * 0.2) + run * sd * r * 0.07 * (i % 2 ? 1 : -1); limb(c, x0, y0, x1 - sd * r * 0.1, y1 - r * 0.15, lw * 0.9, BLACK_HI); limb(c, x1 - sd * r * 0.1, y1 - r * 0.15, x1, y1 + r * 0.05, lw * 0.8, BLACK_HI); }
      ell(c, 0, r * 0.2, r * 0.82, r * 0.5); c.fillStyle = shade(c, '#2E2E36', r, -r * 0.3, -r * 0.1, 0.45); c.fill(); stroke(c, lw);
      c.strokeStyle = 'rgba(216,209,187,.35)'; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(0, -r * 0.25); c.lineTo(0, r * 0.65); c.stroke(); c.beginPath(); c.ellipse(0, r * 0.2, r * 0.6, r * 0.34, 0, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
      ell(c, r * 0.6, r * 0.1, r * 0.3, r * 0.22); c.fillStyle = BLACK_D; c.fill(); stroke(c, lw * 0.8); for (const sd of [-1, 1]) { c.strokeStyle = LN; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(r * 0.8, r * (0.1 + sd * 0.08)); c.quadraticCurveTo(r * 1.1, r * (0.05 + sd * 0.2), r * 1.25, r * (-0.1 + sd * 0.3)); c.stroke(); }
      // the eye plate: a tall rounded slab of black stone standing on the back, the red eye set in it looking the way of the gaze
      const px = -r * 0.1, py = -r * 0.05, pw = r * 0.62, phh = r * 1.1; c.beginPath(); c.moveTo(px - pw / 2, py); c.lineTo(px - pw / 2, py - phh * 0.7); c.quadraticCurveTo(px, py - phh * 1.15, px + pw / 2, py - phh * 0.7); c.lineTo(px + pw / 2, py); c.closePath(); c.fillStyle = cylG(c, px - pw / 2, px + pw / 2, '#34343C', BLACK_D); c.fill(); stroke(c, lw);
      c.fillStyle = rgba(CALCITE_D, 0.8); c.fillRect(px - pw / 2 + 1, py - phh * 0.2, pw - 2, Math.max(1, r * 0.05));
      glowIn(c, px, py - phh * 0.62, r * 0.75, RED_HI, 0.5); c.beginPath(); c.arc(px, py - phh * 0.62, r * 0.24, 0, TAU); c.fillStyle = shade(c, RED, r * 0.24, px - r * 0.06, py - phh * 0.62 - r * 0.08, 0.4); c.fill(); stroke(c, lw * 0.8);
      c.fillStyle = INK; ell(c, px + Math.cos(ga) * r * 0.1, py - phh * 0.62 + Math.sin(ga) * r * 0.08, r * 0.07, r * 0.17); c.fill(); c.fillStyle = 'rgba(255,255,255,.55)'; ell(c, px - r * 0.08, py - phh * 0.62 - r * 0.1, r * 0.05, r * 0.03, -0.5); c.fill(); },
    /* a four-legged stone beast with a rectangular torso and no head; a red orb floats where the head should be;
       'lock' brightens the orb, 'dash' stretches the legs */
    brokensentinel(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 2), lock = o.mode === 'lock' ? 1 : 0, dash = o.mode === 'dash' ? 1 : 0, bob = Math.sin(ph * TAU) * r * 0.05;
      c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, 0, r * 0.75, r * 1.0, r * 0.28); c.fill();
      for (const [x, y, k] of [[-0.55, 0.45, 1], [0.55, 0.45, -1], [-0.4, 0.1, -1], [0.45, 0.1, 1]]) { const sw = dash ? Math.sign(x) * r * 0.25 : run * k * r * 0.08; limb(c, x * r * 0.75, y * r - r * 0.1, x * r + sw, y * r + r * 0.32, lw * 1.9, CALCITE_D); c.fillStyle = BLACK_HI; ell(c, x * r + sw, y * r + r * 0.36, r * 0.14, r * 0.07); c.fill(); }
      c.save(); c.translate(0, bob); const bw = r * 1.3, bh = r * 0.62, by = -r * 0.1; c.beginPath(); c.moveTo(bw / 2, by); c.lineTo(bw / 2 + r * 0.14, by - r * 0.08); c.lineTo(bw / 2 + r * 0.14, by - bh - r * 0.08); c.lineTo(bw / 2, by - bh); c.closePath(); c.fillStyle = shadeC(o.color, -0.4); c.fill(); stroke(c, lw * 0.8);
      c.beginPath(); c.rect(-bw / 2, by - bh, bw, bh); c.fillStyle = cylG(c, -bw / 2, bw / 2, o.color, shadeC(o.color, -0.2)); c.fill(); stroke(c, lw);
      c.beginPath(); c.moveTo(-bw / 2, by - bh); c.lineTo(-bw / 2 + r * 0.14, by - bh - r * 0.08); c.lineTo(bw / 2 + r * 0.14, by - bh - r * 0.08); c.lineTo(bw / 2, by - bh); c.closePath(); c.fillStyle = shadeC(o.color, 0.2); c.fill(); stroke(c, lw * 0.8);
      c.strokeStyle = 'rgba(20,18,24,.35)'; c.lineWidth = lw * 0.6; c.beginPath(); c.moveTo(-bw * 0.2, by - bh); c.lineTo(-bw * 0.25, by); c.moveTo(bw * 0.2, by - bh); c.lineTo(bw * 0.15, by); c.stroke(); c.fillStyle = rgba(OCHRE, 0.85); c.fillRect(-bw / 2 + 1, by - bh * 0.45, bw - 2, Math.max(1, r * 0.06));
      // the broken neck: a jagged stump at the front; the orb floating above it
      c.beginPath(); c.moveTo(bw * 0.25, by - bh); c.lineTo(bw * 0.3, by - bh - r * 0.2); c.lineTo(bw * 0.38, by - bh - r * 0.08); c.lineTo(bw * 0.45, by - bh - r * 0.26); c.lineTo(bw / 2, by - bh); c.closePath(); c.fillStyle = shadeC(o.color, -0.1); c.fill(); stroke(c, lw * 0.8);
      const ox = bw * 0.38, oy = by - bh - r * 0.7 + Math.sin(ph * TAU) * r * 0.06; glowIn(c, ox, oy, r * (0.6 + lock * 0.4), RED_HI, 0.5 + lock * 0.4); c.beginPath(); c.arc(ox, oy, r * 0.18, 0, TAU); c.fillStyle = shade(c, lock ? RED_HI : RED, r * 0.18, ox - r * 0.05, oy - r * 0.06, 0.4); c.fill(); stroke(c, lw * 0.7); c.fillStyle = 'rgba(255,255,255,.6)'; c.beginPath(); c.arc(ox - r * 0.06, oy - r * 0.07, r * 0.05, 0, TAU); c.fill();
      c.restore(); },
  });
  Object.assign(EXT, { calciteleech: 2.8, witnessscarab: 3.0, brokensentinel: 3.0 }); Object.assign(NF, { calciteleech: 6, witnessscarab: 6, brokensentinel: 6 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    calciteleech(m, A, X) {
      if (m.spT > 0) { m.spT -= A.dt; m.mode = 'block'; if (m.spT <= 0) { m.mode = null; m.cd = 2.4 + Math.random() * 1.2; spit(X, m, X.me.x + (X.me.vx || 0) * 0.35, X.me.y + (X.me.vy || 0) * 0.35); } return; }
      m.mode = null; m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd <= 0 && A.d < 7.5 && A.los()) { m.spT = 0.55; X.text(m.x, m.y - 1.2, 'spits', CALCITE_HI, 11); }
    },
    /* the scarab's gaze turns in the context (BAS everyStage), aggro or not; here it only walks: slowly, keeping a little
       range, so the cone does the work */
    witnessscarab(m, A, X) { keepRange(m, A, X, 2.6, 4.2); m.face = A.dx >= 0 ? 1 : -1; },
    brokensentinel(m, A, X) {
      if (m.chT > 0) { m.chT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.ca) * 9 * A.dt, Math.sin(m.ca) * 9 * A.dt); if (!m.chit && A.d < m.r + X.me.r + 0.3 && !X.me.dodge) { m.chit = true; X.hurtPet(m.dmg * 1.3, m); X.push && X.push(m.ca, 2.4); } if (m.chT <= 0) { m.mode = null; m.cd = 2.6 + Math.random(); m.lockT = 0; } return; }
      if (m.wT > 0) { m.wT -= A.dt; m.mode = 'lock'; if (m.wT <= 0) { m.chT = 0.55; m.chit = false; } return; }
      // the lock line: unbroken while it sees you within ten tiles; a second of it and it charges
      const seen = A.d < 10 && A.los() && !inShadowFrom(m, X.me.x, X.me.y);
      m.lockT = seen && m.cd <= 0 ? (m.lockT || 0) + A.dt : 0; m.lock = seen ? { x: X.me.x, y: X.me.y, t: m.lockT } : null;
      m.mode = m.lockT > 0.25 ? 'lock' : null; m.face = A.dx >= 0 ? 1 : -1;
      if (A.d > 2.2 && m.lockT < 0.6) A.steer(A.sp * 0.8);
      if (m.lockT >= 1) { m.lockT = 1; m.wT = 0.45; m.ca = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: Math.min(9, A.d + 2.5), w: 1.3, life: 0.45, max: 0.45, src: m, color: WARN }); X.text(m.x, m.y - m.r - 0.8, 'LOCKED', WARN, 13); }
    },
  });
  // (a screen between a monster and a point breaks its line, as it breaks a gaze)
  function inShadowFrom(m, x, y) { for (const s of screensOf()) if (s.blocks(m.x, m.y, x, y)) return true; return false; }

  /* ======================= the mini bosses: Rift-touched Cocopets ======================= */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; if (m.gz) { unsource(m.gzX, m.gz); m.gz = null; } };
  BOSSES.push(
    { id: 'veilpet', rift: true, name: 'Veil', title: 'A Rift-touched Cocopet', hp: 86000, dmg: 48, r: 1.4, spd: 1.8, color: CALCITE, glow: RED_HI, biome: 'cloister', el: 'earth' },
    { id: 'witnesspet', rift: true, name: 'Witness', title: 'A Rift-touched Cocopet', hp: 92000, dmg: 48, r: 1.45, spd: 1.7, color: BLACK_HI, glow: RED, biome: 'courtyard', el: 'dark' },
    { id: 'basaltpet', rift: true, name: 'Basalt', title: 'A Rift-touched Cocopet', hp: 100000, dmg: 52, r: 1.5, spd: 1.7, color: BLACK, glow: OCHRE_HI, biome: 'sanctuary', el: 'earth' });
  // a mini's own gaze: a source registered for a while, swept or held; being seen in it calcifies like any other
  function gazeOn(m, X, len, spread) { m.gzX = X; m.gz = source(X, { x: m.x, y: m.y, a: Math.atan2(X.me.y - m.y, X.me.x - m.x), len, spread, open: false, mini: m }); return m.gz; }
  Object.assign(DunAI.boss, {
    /* Veil: it opens a veiled eye and sweeps a cone across the floor (a dashed preview first), then flings stone chips */
    veilpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['sweep', 'chips', 'sweep'] : ['sweep', 'chips']); }
      const T = m.actT; switch (m.act) {
        case 'sweep': { if (m.step === 0) { m.step = 1; X.say(m, 'Look at me.'); const g = gazeOn(m, X, 7.5, 0.3); g.a0 = g.a - 0.9; g.a = g.a0; g.previewA = g.a0 + 0.9; }
          const g = m.gz; if (g) { g.x = m.x; g.y = m.y; if (T < 1) { g.open = false; g.preview = g.a0; } else if (T < 3.2) { g.preview = null; g.open = true; g.a = g.a0 + (T - 1) / 2.2 * 1.8; } else g.open = false; }
          if (T > 3.4) done(m, 1.6); break; }
        case 'chips': { if (m.step < 2 && T > m.step * 0.7) { m.step++; const n = 12, off = m.step * 0.26; for (let i = 0; i < n; i++) X.eshot(m.x, m.y - 0.5, off + i / n * TAU, 5, { dmg: m.dmg * 0.8, color: CALCITE_HI, core: RED, r: 0.17, style: 'orb', src: m }); }
          if (T > 2.0) done(m, 1.4); break; }
        default: done(m, 1); } },
    /* Witness: a long narrow stare that follows you slowly, then a spray of petrification droplets */
    witnesspet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['stare', 'spray', 'stare'] : ['stare', 'spray']); }
      const T = m.actT; switch (m.act) {
        case 'stare': { if (m.step === 0) { m.step = 1; X.say(m, 'I see you.'); const g = gazeOn(m, X, 9, 0.2); g.preview = g.a; }
          const g = m.gz; if (g) { g.x = m.x; g.y = m.y; const want = Math.atan2(X.me.y - m.y, X.me.x - m.x); if (T < 0.9) { g.open = false; g.preview = g.a; } else { g.preview = null; g.open = T < 3.6; g.a += clamp(angTo(g.a, want), -0.55 * A.dt, 0.55 * A.dt); } }
          if (T > 3.8) done(m, 1.5); break; }
        case 'spray': { if (m.step < 5 && T > m.step * 0.3) { m.step++; spit(X, m, X.me.x + (Math.random() - 0.5) * 3, X.me.y + (Math.random() - 0.5) * 3, { v: 3.6, dmg: m.dmg * 0.6 }); }
          if (T > 2.0) done(m, 1.4); break; }
        default: done(m, 1); } },
    /* Basalt: slabs of the roof fall on shown lanes, then it heaves itself along a line at you */
    basaltpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['slabs', 'heave', 'slabs'] : ['slabs', 'heave']); }
      const T = m.actT; switch (m.act) {
        case 'slabs': { if (m.step < 3 && T > m.step * 0.4) { m.step++; const px = X.me.x + (m.step - 2) * 2.2 * Math.cos(A.a + Math.PI / 2), py = X.me.y + (m.step - 2) * 2.2 * Math.sin(A.a + Math.PI / 2), a = A.a + Math.PI / 2; if (m.step === 1) X.say(m, 'The roof remembers you.');
            X.warn({ shape: 'line', x: px - Math.cos(a) * 1.5, y: py - Math.sin(a) * 1.5, a, len: 3, w: 1.8, life: 1.1, max: 1.1, src: m, color: OCHRE_HI, fn: () => { if (X.inLine(px - Math.cos(a) * 1.5, py - Math.sin(a) * 1.5, a, 3, 1.8) && !X.me.dodge) X.hurtPet(m.dmg * 1.2, m); X.boom(px, py, 1.6, BLACK_HI, CALCITE_HI, { n: 16, shake: 7 }); } }); }
          if (T > 2.4) done(m, 1.5); break; }
        case 'heave': { if (m.step === 0) { m.step = 1; const a = A.a; m.ha = a; X.warn({ shape: 'line', x: m.x, y: m.y, a, len: 7, w: 2.2, life: 0.9, max: 0.9, src: m, color: OCHRE_HI, fn: () => { if (X.inLine(m.x, m.y, a, 7, 2.2) && !X.me.dodge) { X.hurtPet(m.dmg * 1.3, m); X.push(a, 2.5); } const p = X.walkPoint(m.x + Math.cos(a) * 5.5, m.y + Math.sin(a) * 5.5, m); m.x = p.x; m.y = p.y; X.boom(m.x, m.y, 1.8, BLACK_HI, OCHRE_HI, { n: 18, shake: 9 }); } }); }
          if (T > 1.6) done(m, 1.5); break; }
        default: done(m, 1); } },
  });

  /* ======================= the boss arenas ======================= */
  const arena = {
    eshra: { R: 14, pillars: C => [-Math.PI / 2, Math.PI / 6, Math.PI * 5 / 6].map(a => ({ x: Math.floor(C.x + Math.cos(a) * C.R * 0.5), y: Math.floor(C.y + Math.sin(a) * C.R * 0.5) })),
      carve(set, C) { for (const p of arena.eshra.pillars(C)) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) set(p.x + dx, p.y + dy, T_SOLID); }, start(C) { return { x: C.x + 0.5, y: C.y + C.R - 3.2 }; } },
    thessarym: { R: 16, carve(set, C) {}, start(C) { return { x: C.x + 0.5, y: C.y + C.R - 3.2 }; } },
    gharaal: { R: 19, carve(set, C) { const RR = Math.ceil(C.R); for (let y = -RR; y < RR; y++) for (let x = -RR; x < RR; x++) set(Math.floor(C.x) + x, Math.floor(C.y) + y, T_FLOOR); }, start(C) { return { x: C.x + 0.5, y: C.y + C.R - 3.5 }; } },
  };
  BAS.arena = arena;
  const centreOf = X => X.M.FC || (() => { const rm = X.M.rooms[X.M.arena >= 0 ? X.M.arena : 0] || X.M.rooms[0]; return { x: rm.x + rm.w / 2, y: rm.y + rm.h / 2, R: Math.min(rm.w, rm.h) / 2 }; })();
  const blankTile = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  if (!PROPS.blank) PROPS.blank = () => {};
  const bossMake = {
    /* Eshra's ossuary: the three square pillars drawn tall over their solid tiles; the fiend cracks and fells them */
    eshra(X, self, H) { const C = centreOf(X), pillars = [];
      for (const p of arena.eshra.pillars(C)) { const tiles = []; for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { tiles.push([p.x + dx, p.y + dy]); if (X.M.FC) blankTile(X, p.x + dx, p.y + dy); }
        const P = { x: p.x + 1, y: p.y + 1, tiles, cracked: 0, gone: false };
        P.obj = H.obj({ x: P.x, y: P.y + 0.45, kind: 'pillar', r: 1.3, h: 4.6, label: '', draw(c, Xs, Ys, T) { if (P.gone) { c.fillStyle = 'rgba(20,18,24,.3)'; ell(c, Xs, Ys, T * 1.1, T * 0.4); c.fill(); for (let i = 0; i < 5; i++) { const a = i * 1.3; block(c, Xs + Math.cos(a) * T * 0.6, Ys + Math.sin(a) * T * 0.25, T * 0.45, T * 0.3, T * 0.1, CALCITE_D, lw0(T), { joints: 0 }); } return; } pillarArt(c, Xs, Ys, T * 1.7, T * 4.0, lw0(T) * 1.2, { cracked: P.cracked, col: CALCITE, band: true, eye: true }); } });
        P.crack = k => { P.cracked = clamp(k, 0, 1); }; P.destroy = () => { if (P.gone) return; P.gone = true; for (const [tx, ty] of tiles) { X.M.props.delete(ty * X.M.MW + tx); X.setTile(tx, ty, T_FLOOR); } X.retile(); X.boom(P.x, P.y, 1.8, CALCITE_D, CALCITE_HI, { n: 24, shake: 10 }); if (X.sfx.crash) X.sfx.crash(); };
        pillars.push(P); }
      // (on a fiend arena make() runs before the game has built its tile cache: nothing is cached yet, so a retile then is
      // both impossible and needless; later ones (a pillar's destroy) run as usual)
      if (X.M.FC) { try { X.retile(); } catch (e) { if (!(e instanceof ReferenceError)) throw e; } }
      return { pillars, C }; },
    /* Thessarym's reliquary: two screens on north–south rails either side of a central lane */
    thessarym(X, self, H) { const C = centreOf(X), screens = [];
      for (const sd of [-1, 1]) { const x = C.x + sd * 5; screens.push(screen(X, H, { a: Math.PI / 2, len: 3.2, stops: [[x, C.y - 6], [x, C.y], [x, C.y + 6]], i0: 1, label: 'SLIDE THE SCREEN' })); }
      return { screens, C, lane: { x: C.x, w: 3 }, drawGround(c) { const T = X.Tz(); c.save(); c.globalAlpha = 0.35; c.setLineDash([T * 0.3, T * 0.3]); c.strokeStyle = CALCITE_HI; c.lineWidth = 2; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(X.sx(C.x + sd * 1.5), X.sy(C.y - C.R + 2)); c.lineTo(X.sx(C.x + sd * 1.5), X.sy(C.y + C.R - 2)); c.stroke(); } c.restore(); } }; },
    /* Gharaal's sanctuary: the great sealed eye in the north wall, four screens on short east–west rails */
    gharaal(X, self, H) { const C = centreOf(X), screens = [], wallEyeO = { x: C.x, y: C.y - C.R + 0.6, w: 9, open: 0, sealed: false };
      for (const [sx, sy] of [[-7, -5], [7, -5], [-7, 6], [7, 6]]) screens.push(screen(X, H, { a: 0, len: 3.4, stops: [[C.x + sx - 2, C.y + sy], [C.x + sx + 2, C.y + sy]], i0: sx < 0 ? 1 : 0, label: 'SLIDE THE SCREEN' }));
      return { screens, C, wallEye: wallEyeO, nodes: [], drawGround(c) { wallEye(c, X, wallEyeO); } }; },
  };

  /* ======================= the rift ======================= */
  const SEALING = { fall: 'THE WITNESS IS BURIED', sub: 'The eye in the wall closes for good; the calcified gardens take back their colour and the stone banners crumble to dust', sigil: 'THE VEIL SIGIL', name: 'The Basilica of the Veiled Eye', color: RED_HI };
  const ST = (typeof BAS_STAGES !== 'undefined' && BAS_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  const Rf = defRift({
    ease: 0.55, monEase: 0.5,
    id: 'basilica', n: 9, name: 'The Basilica of the Veiled Eye', lvl: 85, sigil: 'Veil', biome: 'cloister', aff: ['earth', 'dark'], region: 'the petrified sanctuary',
    blurb: 'A mountain monastery fused with a sightless stone organism. Its red eyes turn you to calcite where they look; cross in the shadows of the stone screens, contain the witnesses, and bury the eye in the wall.', gate: { anima: 'libra', name: 'The Suspended Garden' },
    mons: ['calciteleech', 'witnessscarab', 'brokensentinel'], sealing: SEALING,
    stages: riftSections([
      { biome: 'cloister', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Outer Cloister'], minis: ['veilpet'], miniHp: 0.6, mobs: ['calciteleech', 'brokensentinel', 'witnessscarab', 'calciteleech'], trials: [ST.PILGRIMAGE || placeholder('The Blind Pilgrimage', 'Cross the watched ground in the screens\' shadows')], boss: 'eshra', bossName: 'Eshra the Many-Lidded', bossRoom: 'The Ossuary' },
      { biome: 'courtyard', pattern: ['trial', 'fight', 'boss'], mods: ['random'], fights: ['The Calcite Courtyard'], minis: ['witnesspet'], miniHp: 0.6, mobs: ['witnessscarab', 'calciteleech', 'brokensentinel', 'calciteleech'], trials: [ST.CONTAINMENT || placeholder('The Witness Containment', 'Defeat a witness in each basin')], boss: 'thessarym', bossName: 'Thessarym the Veil Serpent', bossRoom: 'The Reliquary' },
      { biome: 'sanctuary', pattern: ['fight', 'trial', 'boss'], mods: ['curse'], fights: ['The Ritual Avenue'], minis: ['basaltpet'], miniHp: 0.6, mobs: ['brokensentinel', 'witnessscarab', 'calciteleech', 'brokensentinel', 'calciteleech'], trials: [ST.PROCESSION || placeholder('The Procession of Stone', 'Follow the moving screen to the sanctuary')], boss: 'gharaal', bossName: 'Gharaal the Buried Witness', bossRoom: 'The Sanctuary of the Veiled Eye' },
    ]),
  });
  for (const S of Rf.stages) if (S.kind === 'boss' && bossMake[S.boss]) S.make = bossMake[S.boss];
  /* every stage: the context's screens, pylons, sources and droplets run and draw here; the Calcification meter; the
     red light of the ceiling slits in stripes across the floor */
  Rf.everyStage = (X, self, H) => { const C = ctx(X); CUR = C; const motes = []; const scarabs = () => X.mons.filter(m => m.type === 'witnessscarab' && !m.dead);
    return { BAS, C, H,
      update(dt) { CUR = C; C.t += dt; const me = X.me;
        for (const s of C.screens) s.tick(dt); for (const p of C.pylons) p.tick(dt);
        // the scarabs' gazes: each carries a source that turns slowly (idle: round and round; roused: toward you)
        for (const m of scarabs()) { if (!m.gaze) { m.gaze = source(X, { x: m.x, y: m.y, a: Math.random() * TAU, len: 6.5, spread: 0.22, open: true, mon: m }); } const g = m.gaze; g.x = m.x; g.y = m.y; g.open = !(m.stun > 0 || m.freeze > 0);
          if (m.aggro) { const want = Math.atan2(me.y - m.y, me.x - m.x); g.a += clamp(angTo(g.a, want), -0.45 * dt, 0.45 * dt); } else g.a += 0.35 * dt; m.mode = 'g' + (((Math.round(g.a / TAU * 8) % 8) + 8) % 8); }
        for (let i = C.sources.length - 1; i >= 0; i--) { const s = C.sources[i]; if (s.mon && s.mon.dead) { C.sources.splice(i, 1); continue; } if (s.mini && (s.mini.dead || s.mini.act === 'move')) { C.sources.splice(i, 1); continue; } }
        if (!me.dead) for (const s of C.sources) if (s.open && gazeSeen(me.x, me.y, s)) { calcify.see(); break; }
        calcify.tick(dt, X); dropsTick(C, dt);
        if (motes.length < 10 && Math.random() < 0.2) motes.push({ x: Math.random(), y: 1.05, v: 0.015 + Math.random() * 0.025, s: 1 + Math.random() * 1.3, ph: Math.random() * 6 }); for (const q of motes) q.y -= q.v * dt; for (let i = motes.length - 1; i >= 0; i--) if (motes[i].y < -0.05) motes.splice(i, 1); },
      drawGround(c) { stripes(c, X, X.F.biome === 'sanctuary' ? 1.6 : 0.85);
        for (const s of C.screens) drawRail(c, X, s);
        for (const p of C.pylons) if (p.preview != null) drawPreview(c, X, p.src, p.preview);
        for (const s of C.sources) { if (s.preview != null) drawPreview(c, X, s, s.preview); if (s.open) drawCone(c, X, s, s.pylon ? Math.max(0.25, s.pylon.open) : 1); }
        dropsDraw(c, C);
        // the sentinels' lock lines: thin red, from the orb to you, brightening as the second runs out
        const T = X.Tz(); for (const m of X.mons) { if (m.type !== 'brokensentinel' || m.dead || !m.lock) continue; const k = 0.35 + 0.65 * Math.min(1, m.lock.t), Xs = X.sx(m.x) + m.face * T * 0.45, Ys = X.sy(m.y) - T * 1.15; c.save(); c.strokeStyle = rgba(WARN, k); c.lineWidth = 1.2 + k * 1.3; c.setLineDash(m.lock.t > 0.6 ? [] : [T * 0.2, T * 0.12]); c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(X.sx(m.lock.x), X.sy(m.lock.y) - T * 0.4); c.stroke(); c.restore(); } },
      drawOver(c) { const W = X.W(), Hh = X.H(), t = X.g.t; c.save(); for (const q of motes) { c.globalAlpha = 0.2 + 0.15 * Math.sin(t * 2 + q.ph); c.fillStyle = RED_HI; c.beginPath(); c.arc(q.x * W + Math.sin(t * 0.5 + q.ph) * 10, q.y * Hh, q.s, 0, TAU); c.fill(); } c.restore();
        calcify.drawFeet(c, X); calcify.drawHUD(c, X); } }; };
  Object.assign(BAS, { SEALING, placeholder, dressRim, leanWall, slabBridge });
})();
