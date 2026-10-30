/* ---------- Rift 11: The Choir Before Creation ----------
   A mountain's interior has become a vast hollow musical instrument: an original fragment of a primordial dream (this
   game's Azathoth-adjacent dream, not Azathoth itself). The ground is broad circular plates linked by short bridges over
   darkness; giant hollow pipes curve above them and vanish upward in three silhouettes (straight columns, low arches,
   large spirals); their openings pulse with soft light, so the whole cavern breathes. Bone horns frame the ways on.
   There is no audience, no orchestra and no humanoid choir: the architecture and the alien organisms make the sound.
   Three lands, climbing:
   I   The Silent Score (scorehall): pale bone plates engraved with staff lines, maroon organ columns round the rims.
   II  The Breathworks (breathworks): riveted maroon plates, bone conduits, bellows, gauges, low pipe arches.
   III The Resonating Depths (resonance): near-black maroon stone with gold rings, spiral pipes, suspended bells.
   Monsters: bell mites (round maroon shells on three gold legs, a bone clapper; the shell widens before a short pulse),
   pipe eels (thin ivory S-tubes with a dark trumpet mouth; three mouth lights count the beat, then three shots), hush
   moths (black oval bodies, two cape wings, a coral throat; they settle on a drum pad and silence it until hit).
   Stages: 0 The Horned Threshold (fight) · 1 The Silent Score (trial) · 2 Tammor the Living Drum (The Drum Chamber)
           3 The Pipe Gallery (fight) · 4 The Breathworks (trial) · 5 Veyra the Throat of Night (The Pipe Bridge)
           6 The Hollow Ascent (fight, curse) · 7 The Held Note (trial) · 8 The Heart That Hears (The Resonating Bowl, seal)

   ======================= THE SHARED API (CHO.*) — the stages (20zy), the gate and the bosses (20zz1/2/3) code against it =======================
   Palette: CHO.MAROON #341C2F (MAROON_HI / MAROON_D), CHO.BONE #D9C9A5 (BONE_HI / BONE_D), CHO.GOLD #A58A4E (GOLD_HI / GOLD_D),
            CHO.CORAL #DA8F86 (CORAL_HI / CORAL_D: decorative, soft), CHO.WARN '#FF4D6D' (hostile shapes keep the game's warning red),
            CHO.INK (outline), CHO.VOID (the darkness under the plates).
   Every stage of the rift runs the rift's everyStage, which keeps one context per running game: CHO.ctx(X) -> { X, pads,
   beats, t, hb, silentT }. It ticks and draws every pad and beat preview, the heartbeat, the pipe mouths' breathing and
   the plates' gold ring inlays. make() runs before everyStage, so anything made in make() registers into the same
   context (bosses reach it with CHO.ctx({ g: X.g }); tests through X.rift.self.amb: { CHO, C, H }).

   Reduced motion
     CHO.lowFx() -> !!st.lowFx (Settings "Fewer effects"). Decorative pulsing (pipe mouths, plate rings, the arenas'
     heartbeat) holds a steady glow instead. Never shake the camera for the heartbeat. Beat previews always animate their
     countdown (they are information, not decoration).
     CHO.heart(X) -> { k (0..1 now), n (beats so far), ph (0..1 in the beat) }: the cavern's heartbeat, a soft double
       thump every 1.6 s (k steady 0.35 under lowFx; 0 while the pipes fall silent at the end). CHO.breath(X, x, y) -> 0..1
       a slow wave of breath through the pipes, phased by place (steady 0.55 under lowFx).

   Drum pads  (the pet stands on them; there is no Hold command: standing IS holding)
     CHO.pad(X, { x, y, r, sym, label, need, latch, active, shelter, shelterR, onStep, onFull, onLeave }) -> pad
       A round drum on the floor (r tiles, default 1.25): maroon shell, gold studs, a bone membrane with an embossed
       symbol (sym: index or name of CHO.SYMS). Drawn by everyStage under everything (never an H.obj).
       pad fields: x, y, r, sym, on (the pet is on it this frame), hi (set true to highlight it as the current step: a
         soft coral glow and ring), count (null | { t, max, onEnd }: the countdown border), need (seconds of charge to
         fill; 0 = a step pad), charge, full, latch (seconds the charge keeps trickling after stepping off; default 2),
         latchT, charging (on or latched), active (false: it ignores steps and charge; default true), silencer (the hush
         moth on it, or null), shelter/shelterR (a full shelter pad casts a coral dome of shelterR, default 2.8).
       pad.onStep(pad) when the pet steps on (rising edge; not while silenced or inactive); pad.onFull(pad) once when the
       charge fills; pad.onLeave(pad).
       pad.light(on) sets hi; pad.countdown(sec, onEnd) starts the border; pad.flash(ok) a green-gold (true) or warning
       (false) burst; pad.reset() clears charge/full/latch/count/flash; pad.inside(x, y).
       Leaving pauses the charge (never erases it); the latch trickles it for 2 s after you step off.
     CHO.pads(X) -> the stage's pads. CHO.silenced(pad) -> whether a hush moth is silencing it (stages read this: a silenced
       pad takes no steps and no charge). CHO.sheltered(X, x, y) -> inside a full shelter pad's dome. CHO.unpad(X, pad).

   Beat previews  (every hostile beat is numbered and counted down; never frame-perfect)
     CHO.beat(X, { shape, x, y, r0, r1, a, len, w, spread, a0, a1, n, t, hush, echo, dmg, src, fn, col, follow, label })
       -> p. shape: 'ring' (annulus r0..r1 round x,y; r0 0 = a disc), 'disc' (r1), 'lane' (from x,y along a: len long, w
       wide), 'cone' (from x,y along a: len, half-angle spread), 'sector' (annular wedge r0..r1 between angles a0..a1).
       n: the order number in its badge; t: seconds until it strikes (its countdown border runs from t to 0); hush: an
       empty beat (no damage; bone-coloured, a closed-mouth icon); echo: drawn with a smaller second outline (an off-beat
       echo); dmg: on the strike, the pet inside (not dodging, not sheltered) takes dmg from src; fn(p, hit) runs on the
       strike either way; follow: an entity whose x, y the shape follows until 0.6 s before it strikes.
       Fields: t, lead (the t it began with), fired, flashT, done. p.cancel().
     CHO.phrase(X, [spec, ...], { lead, gap, n0 }) -> [p...]: a numbered phrase: spec i strikes at lead + i*gap (defaults
       2.4 s and 1.0 s), numbered n0 + i (default 1). CHO.inBeat(x, y, p, pad) the geometry (pad: an extra radius).
     CHO.beats(X) -> live previews; CHO.clearBeats(X).

   Art helpers (canvas, screen pixels; T = a tile in pixels; lw a line width)
     CHO.SYMS ['sun','crescent','triad','wave','spiral','chord']; CHO.symbol(c, x, y, s, sym, col, lw) an embossed symbol
     CHO.hushIcon(c, x, y, s, col, lw)       the closed-mouth icon (two pressed lips and a seam)
     CHO.badge(c, x, y, s, n, frac, col)     a number badge with a countdown border (frac 1..0 of the time left)
     CHO.tube(c, pts, w, col, lw, o)         a shaded tube along a polyline [[x,y]...]; o.bands (every k points a gold band),
                                             o.hi (highlight alpha)
     CHO.mouth(c, x, y, rx, ry, a, k, o)     a flared pipe/horn opening: bone lip, dark throat, coral light k (0..1)
     CHO.horn(c, x, y, s, o)                 a great curved bone horn standing at (x, y): o.dir ±1 (which way the bell faces),
                                             o.k mouth light, o.bands; returns { mx, my, mr } its bell's centre and radius
     CHO.bell(c, x, y, s, o)                 a hanging bone bell with a gold rim and clapper: o.swing (radians), o.k glow
     CHO.padArt(c, X, pad)                   a drum pad (world→screen through X.sx/X.sy/X.Tz)
     CHO.drumArt(c, x, y, R, o)              the same drum at screen (x, y) radius R: o.sym, o.k glow, o.depth
     CHO.gauge(c, x, y, s, k, sym)           a round pressure gauge, needle at k (0..1)
     CHO.glow(c, x, y, r, col, a)            a soft additive glow (unoutlined)
     CHO.ringInlay(c, X, x, y, rx, ry, k)    a gold inlay ring on the floor (world centre, radii in tiles), brighter with k

   Boss arenas  (the fiend files spread these into their FIEND_DEFS entry: arenaR, carve, start)
     CHO.arena.tammor { R: 14, carve, start, rings }  the 28-m drum chamber: three concentric rings, numbered outward
     CHO.arena.veyra  { R: 16, carve, start, W: 32, H: 28 } the pipe platform: three horn mouths on the far (north) edge,
                                                      three shelter wedges near the centre, a low arch to cling to
     CHO.arena.heart  { R: 18, carve, start }          the resonating bowl: four quadrants, four inward horns, four pads
     The boss stages' make() (here) builds the objects and exposes them on the stage module, X.rift.self.mod:
       Tammor: mod.rings [{ i, n, r0, r1, lit, warn, struck }] (lit 0..1 a coral fill the boss sets, warn 0..1 a red rim,
               struck a flash), mod.ringOf(x, y) -> 0..2 or -1, mod.hush { on, x, y } (the closed-mouth icon over the
               centre while on), mod.C
       Veyra:  mod.horns [{ i, x, y, a, lane: { x0, x1 }, sym, lit, warn }] (west, middle, east; lit/warn 0..1; sym the
               symbol its preview shows: the boss changes it for Stolen Note), mod.inLane(x, y, i), mod.wedges [{ i, x, y,
               w, tiles, shelter(x, y) }], mod.sheltered(x, y, i) (behind wedge i from horn i), mod.arch { x, y, w, h,
               hang: { x, y } }, mod.platform { x0, y0, x1, y1 }, mod.C
       Heart:  mod.quads [{ i, a0, a1, sym, x, y, lit, warn, struck, obscured }] (0 NE, 1 SE, 2 SW, 3 NW), mod.quadOf(x, y),
               mod.horns [{ i, x, y, a, obscured, k }] (one outside each quadrant, pointing in), mod.pads [4 CHO pads, one
               per quadrant, need 4.5 s, shelter, inactive until the boss sets pad.active and pad.hi], mod.rings [radii],
               mod.C
     RIFT_FIENDS is not touched here: the three fiend files register tammor, veyra and heart themselves.
   The seal reward: ACC_SPECIAL 'bell' (03b), a small bell necklace; its cosmetic chime (on a dodge) can be muted on the
   accessory or in Settings (st.bellMute). */
const CHO = { MAROON: '#341C2F', MAROON_HI: '#5C3550', MAROON_D: '#1D0E1A', BONE: '#D9C9A5', BONE_HI: '#F2E8CF', BONE_D: '#A6957A',
  GOLD: '#A58A4E', GOLD_HI: '#D4B978', GOLD_D: '#6B5530', CORAL: '#DA8F86', CORAL_HI: '#F6BDB2', CORAL_D: '#9C5A55', WARN: '#FF4D6D', INK: '#1A0D17', VOID: '#0B0509' };
(() => {
  const TAU = Math.PI * 2, { MAROON, MAROON_HI, MAROON_D, BONE, BONE_HI, BONE_D, GOLD, GOLD_HI, GOLD_D, CORAL, CORAL_HI, CORAL_D, WARN, INK, VOID } = CHO;
  const { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const glow = (c, x, y, r, col, a) => { if (a <= 0.004 || r <= 0) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(12,4,10,${a || 0.32})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  const rgba = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a))})`; };
  const angTo = (a, b) => { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cylG = (c, x0, x1, hi, lo) => { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, shadeC(hi, -0.1)); g.addColorStop(0.28, shadeC(hi, 0.12)); g.addColorStop(0.62, hi); g.addColorStop(1, lo); return g; };
  const label = (c, s, x, y, size, col) => { c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.65)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };

  /* ======================= art helpers ======================= */
  const SYMS = ['sun', 'crescent', 'triad', 'wave', 'spiral', 'chord'];
  const symIndex = s => typeof s === 'number' ? ((s % SYMS.length) + SYMS.length) % SYMS.length : Math.max(0, SYMS.indexOf(s));
  /* one symbol, s across, stroked in col (drawn twice by the embossed callers: a dark cut and a lit edge) */
  function symbolPath(c, x, y, s, sym, lw) { const i = symIndex(sym), r = s / 2; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = lw;
    if (i === 0) { c.beginPath(); c.arc(x, y, r * 0.42, 0, TAU); c.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62); c.lineTo(x + Math.cos(a) * r * 0.92, y + Math.sin(a) * r * 0.92); c.stroke(); } c.beginPath(); c.arc(x, y, Math.max(1, lw * 0.6), 0, TAU); c.fill(); }
    else if (i === 1) { c.beginPath(); c.arc(x, y, r * 0.82, Math.PI * 0.32, Math.PI * 1.68); c.arc(x + r * 0.38, y, r * 0.6, Math.PI * 1.52, Math.PI * 0.48, true); c.closePath(); c.stroke(); }
    else if (i === 2) { for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k / 3 * TAU; c.beginPath(); c.arc(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.24, 0, TAU); c.stroke(); } c.beginPath(); for (let k = 0; k <= 3; k++) { const a = -Math.PI / 2 + k / 3 * TAU; const px = x + Math.cos(a) * r * 0.55, py = y + Math.sin(a) * r * 0.55; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.globalAlpha *= 0.6; c.stroke(); c.globalAlpha /= 0.6; }
    else if (i === 3) { for (const dy of [-0.32, 0.32]) { c.beginPath(); for (let k = 0; k <= 16; k++) { const u = k / 16, px = x - r * 0.9 + u * r * 1.8, py = y + dy * r + Math.sin(u * TAU) * r * 0.24; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } }
    else if (i === 4) { c.beginPath(); for (let k = 0; k <= 40; k++) { const u = k / 40, a = u * TAU * 2.2, rr = r * 0.9 * u; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); }
    else { const hs = [0.5, 0.9, 0.7]; for (let k = 0; k < 3; k++) { const px = x + (k - 1) * r * 0.55; c.beginPath(); c.moveTo(px, y + r * 0.62); c.lineTo(px, y + r * 0.62 - hs[k] * r * 1.3); c.stroke(); c.beginPath(); c.arc(px, y + r * 0.62, r * 0.14, 0, TAU); c.fill(); } } }
  function symbol(c, x, y, s, sym, col, lw) { c.save(); c.strokeStyle = col || GOLD_D; c.fillStyle = col || GOLD_D; symbolPath(c, x, y, s, sym, lw || Math.max(1.4, s * 0.09)); c.restore(); }
  /* embossed: a dark cut below, a lit ridge above */
  function emboss(c, x, y, s, sym, lw, dark, lit) { const o = Math.max(0.8, s * 0.035); c.save(); c.strokeStyle = c.fillStyle = dark || 'rgba(60,30,40,.55)'; symbolPath(c, x + o, y + o, s, sym, lw); c.strokeStyle = c.fillStyle = lit || 'rgba(255,248,230,.7)'; symbolPath(c, x - o * 0.6, y - o * 0.6, s, sym, lw * 0.75); c.restore(); }
  /* the closed-mouth icon: two pressed lips (a lens) with a seam, two dimples */
  function hushIcon(c, x, y, s, col, lw) { const w = s / 2, h = s * 0.2; c.save(); c.strokeStyle = col || BONE_HI; c.lineWidth = lw || Math.max(1.5, s * 0.09); c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.5, y - h * 1.4, x, y - h * 0.7); c.quadraticCurveTo(x + w * 0.5, y - h * 1.4, x + w, y); c.quadraticCurveTo(x, y + h * 1.9, x - w, y); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(x - w * 0.86, y + h * 0.05); c.quadraticCurveTo(x, y + h * 0.45, x + w * 0.86, y + h * 0.05); c.stroke();
    c.beginPath(); c.moveTo(x - w * 1.18, y - h * 0.5); c.lineTo(x - w * 1.08, y + h * 0.4); c.moveTo(x + w * 1.18, y - h * 0.5); c.lineTo(x + w * 1.08, y + h * 0.4); c.stroke(); c.restore(); }
  /* a number badge with a countdown border: frac is the share of the time left (1 full, 0 striking) */
  function badge(c, x, y, s, n, frac, col) { const r = s / 2; col = col || WARN; c.save(); c.fillStyle = 'rgba(20,8,16,.82)'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
    c.lineWidth = Math.max(2, r * 0.22); c.strokeStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.arc(x, y, r * 0.86, 0, TAU); c.stroke();
    if (frac != null) { c.strokeStyle = col; c.lineCap = 'round'; c.beginPath(); c.arc(x, y, r * 0.86, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(frac, 0, 1)); c.stroke(); }
    if (n != null && n !== '') { c.font = `900 ${Math.round(r * 1.15)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#FFFFFF'; c.fillText(String(n), x, y + r * 0.06); }
    c.restore(); }
  /* a shaded tube along a polyline: ink outline, body, a shadow band, a highlight; gold bands every o.bands points */
  function tube(c, pts, w, col, lw, o) { o = o || {}; if (pts.length < 2) return; const path = (dx, dy) => { c.beginPath(); pts.forEach((p, i) => i ? c.lineTo(p[0] + dx, p[1] + dy) : c.moveTo(p[0] + dx, p[1] + dy)); };
    c.save(); c.lineCap = o.cap || 'butt'; c.lineJoin = 'round';
    path(0, 0); c.strokeStyle = LN; c.lineWidth = w + lw * 2; c.stroke();
    path(0, 0); c.strokeStyle = col; c.lineWidth = w; c.stroke();
    path(w * 0.17, w * 0.13); c.strokeStyle = shadeC(col, -0.32); c.lineWidth = w * 0.42; c.stroke();
    path(w * 0.27, w * 0.2); c.strokeStyle = shadeC(col, -0.48); c.lineWidth = w * 0.16; c.stroke();
    path(-w * 0.2, -w * 0.15); c.strokeStyle = rgba(shadeC(col, 0.4), o.hi == null ? 0.75 : o.hi); c.lineWidth = w * 0.18; c.stroke();
    path(-w * 0.28, -w * 0.22); c.strokeStyle = 'rgba(255,255,255,.4)'; c.lineWidth = w * 0.06; c.stroke();
    if (o.bands) for (let i = o.bands0 || 1; i < pts.length - 1; i += o.bands) { const p = pts[i], q = pts[i + 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2, ex = Math.cos(a) * w * 0.56, ey = Math.sin(a) * w * 0.56;
      c.lineCap = 'butt'; c.beginPath(); c.moveTo(p[0] - ex, p[1] - ey); c.lineTo(p[0] + ex, p[1] + ey); c.strokeStyle = LN; c.lineWidth = w * 0.26 + lw * 1.4; c.stroke(); c.strokeStyle = o.bandCol || GOLD; c.lineWidth = w * 0.26; c.stroke(); c.strokeStyle = rgba(GOLD_HI, 0.8); c.lineWidth = w * 0.07; c.beginPath(); c.moveTo(p[0] - ex * 0.8, p[1] - ey * 0.8 - w * 0.03); c.lineTo(p[0] + ex * 0.2, p[1] + ey * 0.2 - w * 0.03); c.stroke(); }
    c.restore(); }
  /* a flared opening: a bone lip (rx×ry, turned by a), the dark throat inside, coral light rising in it by k */
  function mouth(c, x, y, rx, ry, a, k, o) { o = o || {}; const lw = o.lw || Math.max(1.2, rx * 0.12); c.save(); c.translate(x, y); c.rotate(a || 0);
    ell(c, 0, 0, rx * 1.12, ry * 1.12); c.fillStyle = o.lip || BONE; c.fill(); ink(c, lw);
    ell(c, -rx * 0.04, -ry * 0.05, rx * 1.04, ry * 1.02); c.strokeStyle = rgba(BONE_HI, 0.8); c.lineWidth = lw * 0.6; c.stroke();
    ell(c, rx * 0.04, ry * 0.08, rx * 0.86, ry * 0.8); const g = c.createRadialGradient(rx * 0.1, ry * 0.15, 0, 0, 0, rx); g.addColorStop(0, rgba(CORAL_HI, 0.08 + 0.62 * k)); g.addColorStop(0.5, rgba(CORAL_D, 0.12 + 0.4 * k)); g.addColorStop(1, '#12060E'); c.fillStyle = g; c.fill(); ink(c, lw * 0.7);
    c.restore(); }
  /* a great curved bone horn standing on (x, y), s its height: it rises narrow from a gold-banded foot, sweeps back and
     flares into a bell facing o.dir (±1). Returns the bell's centre and radius */
  // the horn's centre line: a C that rises from the foot, leans back, curls over toward dir and opens forward and down
  const HORN_P = [[0, 0], [-0.34, -0.78], [0.42, -1.18], [0.66, -0.6]];
  const hornAt = (u, s, dir) => { const v = 1 - u, P = HORN_P, b = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u]; let x = 0, y = 0; for (let i = 0; i < 4; i++) { x += P[i][0] * b[i]; y += P[i][1] * b[i]; } return [dir * x * s, y * s]; };
  function horn(c, x, y, s, o) { o = o || {}; const dir = o.dir || 1, lw = o.lw || Math.max(1.3, s * 0.016), k = o.k == null ? 0.4 : o.k, N = 22, pts = [];
    for (let i = 0; i <= N; i++) { const q = hornAt(i / N, s, dir); pts.push([x + q[0], y + q[1]]); }
    // the horn's body: a tapered band along the centre line, narrow at the foot, flaring at the bell
    const wAt = u => s * (0.045 + 0.075 * u + 0.11 * Math.pow(u, 6)), L = [], R = [];
    for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], pp = pts[Math.max(0, i - 1)], a = Math.atan2(q[1] - pp[1], q[0] - pp[0]) + Math.PI / 2, w = wAt(i / N); L.push([p[0] + Math.cos(a) * w, p[1] + Math.sin(a) * w]); R.push([p[0] - Math.cos(a) * w, p[1] - Math.sin(a) * w]); }
    c.save(); c.fillStyle = 'rgba(12,4,10,.3)'; ell(c, x, y + s * 0.01, s * 0.24, s * 0.07); c.fill();
    poly(c, L.concat(R.slice().reverse())); c.closePath(); const g = c.createLinearGradient(x - s * 0.3 * dir, y - s, x + s * 0.4 * dir, y); g.addColorStop(0, BONE_HI); g.addColorStop(0.45, BONE); g.addColorStop(1, BONE_D); c.fillStyle = g; c.fill(); ink(c, lw);
    // a shadow along its lower edge and growth rings across it
    c.save(); poly(c, L.concat(R.slice().reverse())); c.closePath(); c.clip(); c.strokeStyle = rgba(MAROON, 0.35); c.lineWidth = s * 0.05; poly(c, R); c.stroke();
    c.strokeStyle = 'rgba(90,60,40,.32)'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 2; i < N - 1; i += 2) { c.beginPath(); c.moveTo(L[i][0], L[i][1]); c.quadraticCurveTo((L[i][0] + R[i][0]) / 2 + dir * s * 0.01, (L[i][1] + R[i][1]) / 2 + s * 0.02, R[i][0], R[i][1]); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = Math.max(1, lw * 0.7); poly(c, L.slice(1, N - 2)); c.stroke(); c.restore();
    for (const i of o.bands || [3, 12]) { c.beginPath(); c.moveTo(L[i][0], L[i][1]); c.lineTo(R[i][0], R[i][1]); c.strokeStyle = LN; c.lineWidth = s * 0.05 + lw; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = s * 0.05; c.stroke(); c.strokeStyle = rgba(GOLD_HI, 0.85); c.lineWidth = s * 0.012; c.stroke(); }
    // the foot: a gold collar on a maroon socket
    ell(c, x + (pts[0][0] - x), y, s * 0.12, s * 0.045); c.fillStyle = MAROON_HI; c.fill(); ink(c, lw);
    const e = pts[N], f = pts[N - 2], ma = Math.atan2(e[1] - f[1], e[0] - f[0]), mr = wAt(1) * 1.08; c.restore();
    mouth(c, e[0], e[1], mr * 0.42, mr, ma, k, { lw });
    return { mx: e[0], my: e[1], mr }; }
  /* a hanging bone bell: a gold crown loop at (x, y), the bell s tall below it, a gold rim, a bone clapper */
  function bell(c, x, y, s, o) { o = o || {}; const lw = o.lw || Math.max(1.2, s * 0.05), sw = o.swing || 0; c.save(); c.translate(x, y); c.rotate(sw);
    c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.beginPath(); c.arc(0, s * 0.02, s * 0.1, Math.PI, 0); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = lw; c.stroke();
    const w0 = s * 0.2, w1 = s * 0.46, h = s * 0.82;
    c.beginPath(); c.moveTo(-w0, s * 0.08); c.bezierCurveTo(-w0 * 1.2, s * 0.35, -w1 * 0.8, h * 0.7, -w1, h); c.lineTo(w1, h); c.bezierCurveTo(w1 * 0.8, h * 0.7, w0 * 1.2, s * 0.35, w0, s * 0.08); c.quadraticCurveTo(0, -s * 0.02, -w0, s * 0.08); c.closePath();
    c.fillStyle = cylG(c, -w1, w1, BONE, BONE_D); c.fill(); ink(c, lw);
    c.strokeStyle = 'rgba(255,255,255,.45)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(-w0 * 0.6, s * 0.16); c.bezierCurveTo(-w0 * 0.8, s * 0.4, -w1 * 0.55, h * 0.72, -w1 * 0.66, h * 0.9); c.stroke();
    c.fillStyle = GOLD; c.fillRect(-w1 * 0.86, h * 0.62, w1 * 1.72, s * 0.06); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(-w1 * 0.86, h * 0.62, w1 * 1.72, s * 0.06);
    ell(c, 0, h, w1 * 1.02, s * 0.09); c.fillStyle = GOLD_D; c.fill(); ink(c, lw); ell(c, 0, h + s * 0.01, w1 * 0.84, s * 0.06); c.fillStyle = '#1A0A12'; c.fill();
    if (o.k) glow(c, 0, h, s * 0.6, CORAL_HI, o.k * 0.6);
    const cl = Math.sin(sw * 3) * s * 0.06; c.strokeStyle = LN; c.lineWidth = lw; c.beginPath(); c.moveTo(0, h * 0.6); c.lineTo(cl, h + s * 0.1); c.stroke(); c.beginPath(); c.arc(cl, h + s * 0.12, s * 0.07, 0, TAU); c.fillStyle = BONE_HI; c.fill(); ink(c, lw * 0.7);
    c.restore(); }
  /* a drum at screen (x, y), membrane radius R: a maroon shell with gold studs round a bone membrane, the side band below */
  function drumArt(c, x, y, R, o) { o = o || {}; const lw = o.lw || Math.max(1.3, R * 0.06), dep = o.depth == null ? R * 0.16 : o.depth, k = o.k || 0;
    c.save(); c.fillStyle = 'rgba(10,3,8,.42)'; ell(c, x + R * 0.05, y + dep + R * 0.08, R * 1.2, R * 1.1); c.fill();
    // the shell's side band (below) and its rim
    c.beginPath(); c.arc(x, y + dep, R * 1.16, 0, Math.PI); c.lineTo(x - R * 1.16, y); c.arc(x, y, R * 1.16, Math.PI, 0, true); c.closePath(); c.fillStyle = cylG(c, x - R * 1.16, x + R * 1.16, MAROON_HI, MAROON_D); c.fill(); ink(c, lw);
    c.strokeStyle = GOLD; c.lineWidth = Math.max(1.2, dep * 0.24); c.beginPath(); for (let i = 0; i <= 12; i++) { const u = i / 12, a = Math.PI * u, px = x + Math.cos(a) * R * 1.16, py = y + Math.sin(a) * R * 1.16 + (i % 2 ? dep * 0.85 : dep * 0.15); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
    c.beginPath(); c.arc(x, y, R * 1.16, 0, TAU); c.fillStyle = shade(c, MAROON_HI, R * 1.2, x - R * 0.4, y - R * 0.5, 0.3); c.fill(); ink(c, lw);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.31, px = x + Math.cos(a) * R * 1.05, py = y + Math.sin(a) * R * 1.05; c.beginPath(); c.arc(px, py, Math.max(1.3, R * 0.06), 0, TAU); c.fillStyle = GOLD_HI; c.fill(); c.strokeStyle = GOLD_D; c.lineWidth = 1; c.stroke(); }
    // the membrane: pale bone, lit top-left, a faint dent where the beat lands
    c.beginPath(); c.arc(x, y, R * 0.92, 0, TAU); const g = c.createRadialGradient(x - R * 0.35, y - R * 0.4, R * 0.05, x, y, R * 0.95); g.addColorStop(0, o.full ? '#FFF4D8' : BONE_HI); g.addColorStop(0.6, o.full ? '#F2D79A' : BONE); g.addColorStop(1, BONE_D); c.fillStyle = g; c.fill(); ink(c, lw * 0.8);
    c.strokeStyle = 'rgba(120,90,60,.25)'; c.lineWidth = Math.max(1, lw * 0.5); c.beginPath(); c.arc(x, y, R * 0.7, 0, TAU); c.stroke();
    if (o.sym != null) emboss(c, x, y, R * 1.0, o.sym, Math.max(1.6, R * 0.1), 'rgba(80,40,40,.6)', 'rgba(255,250,235,.8)');
    if (k > 0) { glow(c, x, y, R * 1.9, CORAL_HI, 0.55 * k); c.strokeStyle = rgba(CORAL_HI, 0.85 * k); c.lineWidth = Math.max(2, R * 0.1); c.beginPath(); c.arc(x, y, R * 1.24, 0, TAU); c.stroke(); }
    c.restore(); }
  function padArt(c, X, pad) { const T = X.Tz(), Xs = X.sx(pad.x), Ys = X.sy(pad.y), R = pad.r * T * 0.82, lw = lw0(T), t = X.g.t, sil = silenced(pad);
    const k = sil ? 0 : Math.max(pad.hiK || 0, pad.flashT > 0 && pad.flashOk ? pad.flashT / 0.45 : 0, pad.full ? 0.5 : 0);
    drumArt(c, Xs, Ys, R, { sym: pad.sym, k, full: pad.full && !sil, lw });
    // the countdown border: a thick arc running down round the rim, coral turning to warning red as it runs out
    if (pad.count && !sil) { const f = clamp(pad.count.t / pad.count.max, 0, 1), col = f < 0.35 ? WARN : CORAL_HI; c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(20,8,16,.7)'; c.lineWidth = Math.max(5, T * 0.2); c.beginPath(); c.arc(Xs, Ys, R * 1.42, 0, TAU); c.stroke(); c.strokeStyle = col; c.lineWidth = Math.max(3.5, T * 0.14); c.beginPath(); c.arc(Xs, Ys, R * 1.42, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke();
      label(c, (Math.ceil(pad.count.t * 10) / 10).toFixed(1), Xs, Ys - R * 1.42 - T * 0.12, T * 0.3, col); c.restore(); }
    // the charge ring (a charge pad): coral filling round the rim; the latch a dashed trail
    if (pad.need > 0) { const f = clamp(pad.charge / pad.need, 0, 1); c.save(); c.lineCap = 'round'; c.strokeStyle = 'rgba(20,8,16,.6)'; c.lineWidth = Math.max(4, T * 0.16); c.beginPath(); c.arc(Xs, Ys, R * 1.3, 0, TAU); c.stroke();
      if (f > 0) { c.strokeStyle = pad.full ? GOLD_HI : CORAL; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.arc(Xs, Ys, R * 1.3, -Math.PI / 2, -Math.PI / 2 + TAU * f); c.stroke(); }
      if (pad.latchT > 0 && !pad.on && !pad.full) { c.setLineDash([T * 0.12, T * 0.1]); c.strokeStyle = rgba(CORAL_HI, 0.9); c.lineWidth = Math.max(2, T * 0.06); c.beginPath(); c.arc(Xs, Ys, R * 1.52, -Math.PI / 2, -Math.PI / 2 + TAU * pad.latchT / pad.latch); c.stroke(); c.setLineDash([]); }
      c.restore(); if (pad.charging && !pad.full && !sil && !lowFx()) glow(c, Xs, Ys, R * 1.6, CORAL, 0.25 + 0.1 * Math.sin(t * 6)); }
    if (pad.flashT > 0) { const u = 1 - pad.flashT / 0.45; c.save(); c.strokeStyle = rgba(pad.flashOk ? GOLD_HI : WARN, 1 - u); c.lineWidth = Math.max(2, T * 0.1) * (1 - u) + 1; c.beginPath(); c.arc(Xs, Ys, R * (1.2 + u * 0.8), 0, TAU); c.stroke(); c.restore(); }
    if (sil) { c.save(); c.beginPath(); c.arc(Xs, Ys, R * 0.95, 0, TAU); c.fillStyle = 'rgba(14,6,12,.62)'; c.fill(); hushIcon(c, Xs, Ys, R * 1.1, CORAL_HI, Math.max(2, T * 0.08)); label(c, 'HUSHED', Xs, Ys - R * 1.35, T * 0.26, CORAL_HI); c.restore(); }
    if (pad.shelter && pad.full && pad.shelterOn !== false) { const Rs = (pad.shelterR || 2.8) * T, br = lowFx() ? 0.8 : 0.8 + 0.2 * Math.sin(t * 3); c.save(); c.beginPath(); c.arc(Xs, Ys, Rs, 0, TAU); const g = c.createRadialGradient(Xs, Ys, Rs * 0.3, Xs, Ys, Rs); g.addColorStop(0, rgba(CORAL_HI, 0.05)); g.addColorStop(0.85, rgba(CORAL_HI, 0.18 * br)); g.addColorStop(1, rgba(BONE_HI, 0.35 * br)); c.fillStyle = g; c.fill(); c.strokeStyle = rgba(BONE_HI, 0.6 * br); c.lineWidth = 2; c.stroke(); label(c, 'SHELTER', Xs, Ys + Rs + T * 0.3, T * 0.24, BONE_HI); c.restore(); }
    if (pad.label && Math.hypot(X.me.x - pad.x, X.me.y - pad.y) < 5) label(c, typeof pad.label === 'function' ? pad.label(pad) : pad.label, Xs, Ys + R * 1.4 + T * 0.35, Math.max(11, T * 0.3), BONE_HI); }
  /* a round pressure gauge at (x, y): s across, needle at k, a symbol on its face */
  function gauge(c, x, y, s, k, sym) { const r = s / 2, lw = Math.max(1.2, s * 0.06); c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = shade(c, GOLD, r, x - r * 0.3, y - r * 0.3, 0.35); c.fill(); ink(c, lw);
    c.beginPath(); c.arc(x, y, r * 0.8, 0, TAU); c.fillStyle = BONE_HI; c.fill(); ink(c, lw * 0.7);
    c.lineWidth = r * 0.16; c.strokeStyle = rgba(CORAL, 0.85); c.beginPath(); c.arc(x, y, r * 0.62, Math.PI * 0.8, Math.PI * 0.8 + Math.PI * 1.4 * clamp(k, 0, 1)); c.stroke();
    c.strokeStyle = 'rgba(60,40,30,.6)'; c.lineWidth = 1; for (let i = 0; i <= 6; i++) { const a = Math.PI * 0.8 + i / 6 * Math.PI * 1.4; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72); c.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); c.stroke(); }
    if (sym != null) symbol(c, x, y + r * 0.28, r * 0.5, sym, GOLD_D, Math.max(1, r * 0.07));
    const a = Math.PI * 0.8 + Math.PI * 1.4 * clamp(k, 0, 1); c.strokeStyle = MAROON; c.lineWidth = Math.max(1.5, r * 0.1); c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * r * 0.66, y + Math.sin(a) * r * 0.66); c.stroke(); c.beginPath(); c.arc(x, y, r * 0.12, 0, TAU); c.fillStyle = GOLD_D; c.fill(); c.restore(); }
  /* a gold inlay ring on the floor (world centre and radii in tiles), brighter with k */
  function ringInlay(c, X, x, y, rx, ry, k) { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y); c.save(); ell(c, Xs, Ys, rx * T, ry * T); c.strokeStyle = 'rgba(20,8,16,.35)'; c.lineWidth = Math.max(2, T * 0.12); c.stroke(); c.strokeStyle = rgba(GOLD, 0.55 + 0.25 * k); c.lineWidth = Math.max(1.2, T * 0.06); c.stroke();
    if (k > 0.05) { c.strokeStyle = rgba(CORAL_HI, 0.55 * k); c.lineWidth = Math.max(1, T * 0.035); c.stroke(); } c.restore(); }
  Object.assign(CHO, { SYMS, symbol, emboss, hushIcon, badge, tube, mouth, horn, bell, drumArt, padArt, gauge, glow, ringInlay, lowFx });

  /* ======================= the running context: pads, beats, heartbeat ======================= */
  const CTX = new WeakMap(); let CUR = null;
  function ctx(X) { let C = CTX.get(X.g); if (!C) { C = { X, pads: [], beats: [], t: 0, hb: { k: 0, n: 0, ph: 0 }, silentT: 0, mouths: null }; CTX.set(X.g, C); CUR = C; } return C; }
  const HB = 1.6;
  function heartK(t) { const ph = ((t / HB) % 1 + 1) % 1, b = (u, w) => Math.exp(-Math.pow(u / w, 2)); return { ph, k: Math.max(b(ph, 0.06), 0.65 * b(ph - 0.2, 0.06), b(ph - 1, 0.06)) }; }
  function heart(X) { const C = X ? ctx(X) : CUR; return C ? C.hb : { k: 0, n: 0, ph: 0 }; }
  function breath(X, x, y) { const C = X ? ctx(X) : CUR; if (!C) return 0.5; if (C.silentT > 0) return 0; if (lowFx()) return 0.55; return 0.5 + 0.5 * Math.sin(C.t * 1.15 - (x * 0.21 + y * 0.13)); }
  /* ---- drum pads ---- */
  function pad(X, o) { const C = ctx(X); const p = Object.assign({ r: 1.25, sym: 0, hi: false, hiK: 0, count: null, need: 0, charge: 0, full: false, latch: 2, latchT: 0, on: false, was: false, active: true, silencer: null, flashT: 0, flashOk: true, shelter: false, shelterR: 2.8, label: '', kind: 'pad' }, o);
    p.light = on => { p.hi = !!on; return p; }; p.countdown = (sec, onEnd) => { p.count = { t: sec, max: sec, onEnd: onEnd || null }; return p; };
    p.flash = ok => { p.flashT = 0.45; p.flashOk = ok !== false; }; p.reset = () => { p.charge = 0; p.full = false; p.latchT = 0; p.count = null; p.flashT = 0; };
    p.inside = (x, y) => Math.hypot(x - p.x, y - p.y) < p.r; Object.defineProperty(p, 'charging', { get: () => !silenced(p) && p.active && (p.on || p.latchT > 0) && !p.full, configurable: true });
    C.pads.push(p); return p; }
  function unpad(X, p) { const C = ctx(X), i = C.pads.indexOf(p); if (i >= 0) C.pads.splice(i, 1); }
  function silenced(p) { const m = p && p.silencer; if (!m) return false; if (m.dead || m.hp <= 0 || m.silPad !== p) { p.silencer = null; return false; } return true; }
  function sheltered(X, x, y) { for (const p of (X ? ctx(X) : CUR || { pads: [] }).pads) if (p.shelter && p.full && p.shelterOn !== false && Math.hypot(x - p.x, y - p.y) < (p.shelterR || 2.8)) return true; return false; }
  function padTick(C, p, dt) { const X = C.X, me = X.me; p.hiK += ((p.hi ? 1 : 0) - p.hiK) * Math.min(1, dt * 8); p.flashT = Math.max(0, p.flashT - dt);
    p.was = p.on; p.on = !me.dead && Math.hypot(me.x - p.x, me.y - p.y) < p.r + 0.05; const sil = silenced(p);
    if (p.on && !p.was && !sil && p.active && p.onStep) p.onStep(p);
    if (!p.on && p.was && p.onLeave) p.onLeave(p);
    if (p.need > 0 && p.active && !sil && !p.full) { if (p.on) { p.charge += dt; p.latchT = p.latch; } else if (p.latchT > 0) { p.latchT = Math.max(0, p.latchT - dt); p.charge += dt; }
      if (p.charge >= p.need) { p.charge = p.need; p.full = true; p.latchT = 0; p.flash(true); if (X.sfx.chime) X.sfx.chime(784, 0.6); if (p.onFull) p.onFull(p); } }
    else if (sil) p.latchT = 0;
    if (p.count && !sil) { p.count.t -= dt; if (p.count.t <= 0) { const f = p.count.onEnd; p.count = null; if (f) f(p); } } }
  /* ---- beat previews ---- */
  function beat(X, o) { const C = ctx(X); const p = Object.assign({ shape: 'disc', x: 0, y: 0, r0: 0, r1: 2, a: 0, len: 6, w: 2, spread: 0.5, a0: 0, a1: Math.PI / 2, n: null, t: 2, hush: false, echo: false, dmg: 0, src: null, fn: null, col: null, fired: false, flashT: 0, done: false }, o);
    p.lead = p.lead || p.t; p.cancel = () => { p.done = true; }; C.beats.push(p); return p; }
  function phrase(X, list, o) { o = o || {}; const lead = o.lead == null ? 2.4 : o.lead, gap = o.gap == null ? 1.0 : o.gap, n0 = o.n0 == null ? 1 : o.n0;
    return list.map((s, i) => beat(X, Object.assign({ n: n0 + i, t: lead + i * gap, lead: lead + i * gap }, s))); }
  function inBeat(x, y, p, pad) { pad = pad || 0; const dx = x - p.x, dy = y - p.y, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    switch (p.shape) {
      case 'ring': return d >= p.r0 - pad && d <= p.r1 + pad;
      case 'disc': return d <= p.r1 + pad;
      case 'lane': { const al = dx * Math.cos(p.a) + dy * Math.sin(p.a), of = -dx * Math.sin(p.a) + dy * Math.cos(p.a); return al > -pad && al < p.len + pad && Math.abs(of) < p.w / 2 + pad; }
      case 'cone': return d <= p.len + pad && d >= (p.r0 || 0) && (d < 0.3 || Math.abs(angTo(p.a, a)) < p.spread + pad / Math.max(0.5, d));
      case 'sector': { if (d < p.r0 - pad || d > p.r1 + pad) return false; let u = a - p.a0; while (u < 0) u += TAU; while (u >= TAU) u -= TAU; let span = p.a1 - p.a0; while (span <= 0) span += TAU; return u <= span; }
    } return false; }
  function beatPath(c, X, p, s) { const T = X.Tz(), Xs = X.sx(p.x), Ys = X.sy(p.y); s = s || 1; c.beginPath();
    switch (p.shape) {
      case 'ring': { const r1 = p.r1 * T * s, r0 = p.r0 * T * (s < 1 ? 1 / s : 1); c.arc(Xs, Ys, Math.max(r0 + 2, r1), 0, TAU); if (p.r0 > 0) { c.moveTo(Xs + r0, Ys); c.arc(Xs, Ys, r0, 0, TAU, true); } break; }
      case 'disc': c.arc(Xs, Ys, p.r1 * T * s, 0, TAU); break;
      case 'lane': { const ca = Math.cos(p.a), sa = Math.sin(p.a), hw = p.w / 2 * s, L = p.len * (s < 1 ? 0.92 : 1), o0 = s < 1 ? p.len * 0.04 : 0; const P = [[o0, -hw], [o0 + L, -hw], [o0 + L, hw], [o0, hw]].map(([u, v]) => [Xs + (u * ca - v * sa) * T, Ys + (u * sa + v * ca) * T]); P.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); break; }
      case 'cone': { const sp = p.spread * s, L = p.len * T * s, r0 = (p.r0 || 0) * T; c.moveTo(Xs + Math.cos(p.a - sp) * r0, Ys + Math.sin(p.a - sp) * r0); c.arc(Xs, Ys, L, p.a - sp, p.a + sp); if (r0 > 0) c.arc(Xs, Ys, r0, p.a + sp, p.a - sp, true); else c.lineTo(Xs, Ys); c.closePath(); break; }
      case 'sector': { let span = p.a1 - p.a0; while (span <= 0) span += TAU; const m = (1 - s) * span / 2, a0 = p.a0 + m, a1 = p.a0 + span - m, rm = (p.r0 + p.r1) / 2, r1 = (rm + (p.r1 - rm) * s) * T, r0 = (rm - (rm - p.r0) * s) * T; c.arc(Xs, Ys, r1, a0, a1); c.arc(Xs, Ys, Math.max(0, r0), a1, a0, true); c.closePath(); break; }
    } }
  function beatAnchor(p) { switch (p.shape) {
      case 'ring': return [p.x, p.y - (p.r0 + p.r1) / 2]; case 'disc': return [p.x, p.y - p.r1 * 0.55];
      case 'lane': return [p.x + Math.cos(p.a) * Math.min(p.len * 0.5, 3), p.y + Math.sin(p.a) * Math.min(p.len * 0.5, 3)];
      case 'cone': return [p.x + Math.cos(p.a) * p.len * 0.55, p.y + Math.sin(p.a) * p.len * 0.55];
      case 'sector': { let span = p.a1 - p.a0; while (span <= 0) span += TAU; const am = p.a0 + span / 2, rm = (p.r0 + p.r1) / 2; return [p.x + Math.cos(am) * rm, p.y + Math.sin(am) * rm]; } } return [p.x, p.y]; }
  function drawBeat(c, X, p, next) { const T = X.Tz(), t = X.g.t, col = p.col || (p.hush ? BONE_HI : WARN), u = clamp(1 - p.t / p.lead, 0, 1);
    c.save();
    if (p.fired) { const k = clamp(p.flashT / 0.35, 0, 1); beatPath(c, X, p); c.fillStyle = rgba(p.hush ? BONE_HI : col, (p.hush ? 0.15 : 0.42) * k); c.fill('evenodd'); c.restore(); return; }
    beatPath(c, X, p); c.fillStyle = rgba(col, p.hush ? 0.06 : next ? 0.08 + u * 0.26 : 0.05); c.fill('evenodd');
    c.setLineDash([T * 0.3, T * 0.2]); c.lineDashOffset = -t * T * 0.8; c.strokeStyle = rgba(col, next ? 0.85 : 0.5); c.lineWidth = next ? 2.5 : 1.8; c.stroke(); c.setLineDash([]);
    if (p.echo) { beatPath(c, X, p, 0.8); c.setLineDash([T * 0.14, T * 0.14]); c.strokeStyle = rgba(col, 0.75); c.lineWidth = 1.6; c.stroke(); c.setLineDash([]); }
    if (next && !p.hush && u > 0.55) { beatPath(c, X, p); c.strokeStyle = rgba('#FFFFFF', 0.25 + 0.25 * Math.sin(t * 18)); c.lineWidth = 1.5; c.stroke(); }
    const [ax, ay] = beatAnchor(p), Xs = X.sx(ax), Ys = X.sy(ay), s = T * (next ? 0.62 : 0.5);
    if (p.hush) { badge(c, Xs, Ys, s * 1.1, '', p.t / p.lead, BONE_HI); hushIcon(c, Xs, Ys + s * 0.04, s * 0.7, BONE_HI, Math.max(1.5, s * 0.08)); if (p.n != null) label(c, String(p.n), Xs + s * 0.62, Ys - s * 0.4, s * 0.5, BONE_HI); }
    else badge(c, Xs, Ys, s, p.n != null ? p.n : '', p.t / p.lead, next ? WARN : rgba(WARN, 0.7));
    if (p.label) label(c, p.label, Xs, Ys - s * 0.75, Math.max(11, T * 0.3), col);
    c.restore(); }
  function beatTick(C, dt) { const X = C.X, me = X.me;
    for (const p of C.beats) { if (p.done) continue; if (p.fired) { p.flashT -= dt; if (p.flashT <= 0) p.done = true; continue; }
      if (p.follow && p.t > 0.6 && !p.follow.dead) { p.x = p.follow.x; p.y = p.follow.y; }
      p.t -= dt; if (p.t <= 0) { p.fired = true; p.flashT = 0.35; let hit = false;
        if (!p.hush && p.dmg && !me.dead && inBeat(me.x, me.y, p, me.r * 0.6) && !me.dodge && !sheltered(X, me.x, me.y)) { hit = true; X.hurtPet(p.dmg, p.src); }
        if (!p.hush && X.sfx && X.sfx.thud) X.sfx.thud();
        if (p.fn) p.fn(p, hit); } }
    for (let i = C.beats.length - 1; i >= 0; i--) if (C.beats[i].done) C.beats.splice(i, 1); }
  function beatsDraw(c, C) { const live = C.beats.filter(p => !p.done && !p.fired); let nextT = Infinity; for (const p of live) if (!p.hush) nextT = Math.min(nextT, p.t);
    for (const p of C.beats) if (!p.done) drawBeat(c, C.X, p, !p.fired && (p.hush ? p.t <= nextT + 0.05 : p.t <= nextT + 0.05)); }
  Object.assign(CHO, { ctx, heart, breath, pad, unpad, pads: X => ctx(X).pads, silenced, sheltered, beat, phrase, inBeat, beats: X => ctx(X).beats, clearBeats: X => { ctx(X).beats.length = 0; } });

  /* ======================= the lands ======================= */
  /* the darkness under the plates: a deep maroon black, coral haze far below, faint pipes going down into it */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.choirdeep = { base: '#0B0509',
    paint(c, S, R) { c.fillStyle = '#0B0509'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 4; i++) { const x = R() * S, y = R() * S, r = 18 + R() * 24; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { const g = c.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r); g.addColorStop(0, 'rgba(218,143,134,.13)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(x + ox - r, y + oy - r, r * 2, r * 2); } }
      for (let i = 0; i < 3; i++) { const x = R() * S, w = 3 + R() * 4; for (const ox of [-S, 0, S]) { const g = c.createLinearGradient(x + ox - w, 0, x + ox + w, 0); g.addColorStop(0, 'rgba(52,28,47,0)'); g.addColorStop(0.4, 'rgba(70,40,60,.45)'); g.addColorStop(1, 'rgba(52,28,47,0)'); c.fillStyle = g; c.fillRect(x + ox - w, 0, w * 2, S); } }
      for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(217,201,165,${0.06 + R() * 0.12})`; c.beginPath(); c.arc(R() * S, R() * S, 0.7 + R() * 0.5, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, W, H, t } = o; pat(pattern('choirdeep', k), 0.55, W / 2, H / 2 - t * 2); },
  };
  window.DECAL_EXT = window.DECAL_EXT || {};
  Object.assign(DECAL_EXT, {
    /* five engraved staff lines with a single note on them */
    staffline(c, d, s, lw) { c.rotate(d.rot * 0.3); c.strokeStyle = 'rgba(107,85,48,.38)'; c.lineWidth = Math.max(0.8, lw * 0.4); for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(-s * 2.4, i * s * 0.28); c.lineTo(s * 2.4, i * s * 0.28); c.stroke(); } c.fillStyle = 'rgba(107,85,48,.5)'; c.beginPath(); c.ellipse(s * (d.v - 0.5) * 2, -s * 0.14, s * 0.24, s * 0.17, -0.4, 0, TAU); c.fill(); c.fillRect(s * (d.v - 0.5) * 2 + s * 0.2, -s * 1.1, Math.max(1, lw * 0.4), s * 0.96); },
    goldring(c, d, s, lw) { c.scale(1, 0.85); c.strokeStyle = 'rgba(165,138,78,.5)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.arc(0, 0, s * 0.9, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.5, 0, TAU); c.stroke(); },
    coraldust(c, d, s) { c.rotate(d.rot); const g = c.createRadialGradient(0, 0, 0, 0, 0, s * 2.2); g.addColorStop(0, 'rgba(218,143,134,.28)'); g.addColorStop(1, 'rgba(218,143,134,0)'); c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, s * 2.2, s * 1.2, 0, 0, TAU); c.fill(); },
    bonechip(c, d, s) { c.rotate(d.rot); for (let i = 0; i < 4; i++) { c.fillStyle = i % 2 ? 'rgba(242,232,207,.7)' : 'rgba(166,149,122,.7)'; const x = Math.cos(i * 1.7 + d.v) * s * 1.0, y = Math.sin(i * 1.7 + d.v) * s * 0.5; c.beginPath(); c.ellipse(x, y, s * 0.2, s * 0.09, i, 0, TAU); c.fill(); } },
    restmark(c, d, s, lw) { c.strokeStyle = 'rgba(165,138,78,.45)'; c.lineWidth = Math.max(1, lw * 0.6); c.lineCap = 'round'; c.beginPath(); c.moveTo(-s * 0.2, -s * 0.8); c.lineTo(s * 0.25, -s * 0.3); c.lineTo(-s * 0.2, s * 0.05); c.lineTo(s * 0.2, s * 0.5); c.quadraticCurveTo(-s * 0.4, s * 0.3, -s * 0.05, s * 0.85); c.stroke(); },
  });
  /* the floors: each tile one plate of its land, bevelled, with a gold rivet here and there */
  function plate(c, X, Y, T, R, grout, lw, lit) { const w = Math.max(1, T * 0.03), inset = Math.max(1, T * 0.035); c.fillStyle = grout; c.fillRect(X, Y, T, w); c.fillRect(X, Y, w, T);
    c.fillStyle = `rgba(255,250,235,${lit || 0.16})`; c.fillRect(X + w, Y + w, T - w, inset); c.fillRect(X + w, Y + w, inset, T - w); c.fillStyle = 'rgba(20,8,16,.2)'; c.fillRect(X, Y + T - inset, T, inset); c.fillRect(X + T - inset, Y, inset, T); }
  const rivet = (c, x, y, r) => { c.fillStyle = GOLD_D; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.fillStyle = rgba(GOLD_HI, 0.85); c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.45, 0, TAU); c.fill(); };
  function scoreFloor(c, X, Y, T, h, h2, x, y, lw) { const R = rnd(x * 7919 + y * 104729 + 31), kind = Math.floor(hh(x, y, 83) * 13); c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 3 ? 'rgba(120,96,64,.12)' : 'rgba(255,250,235,.32)'; const s = Math.max(1, T * (0.015 + R() * 0.02)); c.fillRect(X + R() * T, Y + R() * T, s, s); }
    if (kind === 0 || kind === 1) { /* staff lines engraved across the plate */ c.strokeStyle = 'rgba(107,85,48,.3)'; c.lineWidth = Math.max(0.8, T * 0.02); for (let i = 0; i < 5; i++) { const yy = Y + T * (0.3 + i * 0.1); c.beginPath(); c.moveTo(X, yy); c.lineTo(X + T, yy); c.stroke(); } if (kind === 0) { c.fillStyle = 'rgba(107,85,48,.45)'; c.beginPath(); c.ellipse(X + T * (0.3 + R() * 0.4), Y + T * 0.45, T * 0.06, T * 0.045, -0.4, 0, TAU); c.fill(); } }
    else if (kind === 2) { c.save(); c.translate(X + T / 2, Y + T / 2); emboss(c, 0, 0, T * 0.48, Math.floor(R() * 6), Math.max(1, T * 0.03), 'rgba(107,85,48,.35)', 'rgba(255,250,235,.4)'); c.restore(); }
    else if (kind === 3) { const g = c.createRadialGradient(X + T * 0.5, Y + T * 0.5, 0, X + T * 0.5, Y + T * 0.5, T * 0.7); g.addColorStop(0, 'rgba(218,143,134,.16)'); g.addColorStop(1, 'rgba(218,143,134,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    else if (kind === 4) { c.strokeStyle = 'rgba(110,80,60,.45)'; c.lineWidth = Math.max(1, T * 0.025); c.beginPath(); c.moveTo(X + T * (0.2 + R() * 0.3), Y); c.lineTo(X + T * (0.4 + R() * 0.3), Y + T * 0.5); c.lineTo(X + T * (0.3 + R() * 0.4), Y + T); c.stroke(); }
    if ((x + y * 3) % 5 === 0) rivet(c, X + T * 0.12, Y + T * 0.12, Math.max(1, T * 0.035));
    plate(c, X, Y, T, R, 'rgba(120,92,58,.5)', lw, 0.24); c.restore(); }
  function breathFloor(c, X, Y, T, h, h2, x, y, lw) { const R = rnd(x * 6151 + y * 92821 + 37), kind = Math.floor(hh(x, y, 89) * 11); c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    for (let i = 0; i < 7; i++) { c.fillStyle = i % 2 ? 'rgba(0,0,0,.18)' : 'rgba(218,143,134,.08)'; const s = Math.max(1, T * (0.015 + R() * 0.02)); c.fillRect(X + R() * T, Y + R() * T, s, s); }
    if (kind === 0) { /* a grate: dark slots with coral breath below */ for (let i = 0; i < 4; i++) { const xx = X + T * (0.22 + i * 0.16); c.fillStyle = '#12070F'; c.fillRect(xx, Y + T * 0.24, T * 0.08, T * 0.52); c.fillStyle = 'rgba(218,143,134,.22)'; c.fillRect(xx, Y + T * 0.6, T * 0.08, T * 0.16); } c.strokeStyle = rgba(GOLD_D, 0.8); c.lineWidth = Math.max(1, T * 0.03); c.strokeRect(X + T * 0.18, Y + T * 0.2, T * 0.64, T * 0.6); }
    else if (kind === 1) { /* a bone seam (a buried conduit) */ c.fillStyle = 'rgba(217,201,165,.22)'; c.fillRect(X, Y + T * 0.44, T, T * 0.12); c.fillStyle = 'rgba(255,250,235,.14)'; c.fillRect(X, Y + T * 0.44, T, T * 0.03); }
    else if (kind === 2) { const g = c.createRadialGradient(X + T * 0.4, Y + T * 0.6, 0, X + T * 0.4, Y + T * 0.6, T * 0.6); g.addColorStop(0, 'rgba(218,143,134,.2)'); g.addColorStop(1, 'rgba(218,143,134,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    for (const [u, v] of [[0.14, 0.14], [0.86, 0.14], [0.14, 0.86], [0.86, 0.86]]) if (kind !== 0) rivet(c, X + T * u, Y + T * v, Math.max(0.8, T * 0.03));
    plate(c, X, Y, T, R, 'rgba(14,6,12,.7)', lw, 0.1); c.restore(); }
  function resoFloor(c, X, Y, T, h, h2, x, y, lw) { const R = rnd(x * 5003 + y * 90001 + 41), kind = Math.floor(hh(x, y, 97) * 12); c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
    for (let i = 0; i < 7; i++) { c.fillStyle = i % 3 ? 'rgba(0,0,0,.25)' : 'rgba(210,180,120,.22)'; const s = Math.max(1, T * (0.012 + R() * 0.018)); c.fillRect(X + R() * T, Y + R() * T, s, s); }
    if (kind === 0 || kind === 1) { /* ripples of a struck note, arcs of gold leaf */ c.strokeStyle = 'rgba(165,138,78,.4)'; c.lineWidth = Math.max(0.8, T * 0.02); const cx = X + (kind ? T : 0), cy = Y + T * (0.3 + R() * 0.4); for (let i = 1; i <= 3; i++) { c.beginPath(); c.arc(cx, cy, T * 0.22 * i, 0, TAU); c.stroke(); } }
    else if (kind === 2) { c.save(); c.translate(X + T / 2, Y + T / 2); emboss(c, 0, 0, T * 0.44, Math.floor(R() * 6), Math.max(1, T * 0.03), 'rgba(0,0,0,.4)', 'rgba(212,185,120,.4)'); c.restore(); }
    else if (kind === 3) { const g = c.createRadialGradient(X + T * 0.5, Y + T * 0.5, 0, X + T * 0.5, Y + T * 0.5, T * 0.6); g.addColorStop(0, 'rgba(218,143,134,.12)'); g.addColorStop(1, 'rgba(218,143,134,0)'); c.fillStyle = g; c.fillRect(X, Y, T, T); }
    plate(c, X, Y, T, R, 'rgba(8,3,7,.7)', lw, 0.08); c.restore(); }
  /* the walls (seldom seen: the plates float): the instrument's inside, maroon ribs of bone and a gold string course */
  function ribWall(c, X, Y, T, H, h, x, lw, B) { const g = c.createLinearGradient(0, Y, 0, Y + H); g.addColorStop(0, shadeC(B.face, -0.35)); g.addColorStop(0.35, B.face); g.addColorStop(1, B.faceD); c.fillStyle = g; c.fillRect(X, Y, T + 0.5, H);
    if (x % 2 === 0) { const rg = c.createLinearGradient(X + T * 0.3, 0, X + T * 0.7, 0); rg.addColorStop(0, BONE_D); rg.addColorStop(0.4, BONE); rg.addColorStop(1, shadeC(BONE_D, -0.3)); c.fillStyle = rg; c.fillRect(X + T * 0.34, Y, T * 0.32, H); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = Math.max(1, lw * 0.5); c.strokeRect(X + T * 0.34, Y, T * 0.32, H); }
    c.fillStyle = rgba(GOLD, 0.8); c.fillRect(X, Y + H * 0.28, T + 0.5, Math.max(1, H * 0.05)); c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(X, Y + H * 0.33, T + 0.5, Math.max(1, H * 0.02)); }
  /* the bridges: short spans of maroon lacquered planks on bone ribs, gold rails along both sides */
  function plankBridge(c, x, y, X, Y, T, isGap, tt, lw) { const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y); const horiz = gNS && !gWE ? true : gWE && !gNS ? false : true;
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(T * 0.02, T * 0.22, T * 0.96, T * 0.8);
    for (let i = 0; i < 3; i++) { const x0 = T * (0.02 + i * 0.32); const g = c.createLinearGradient(0, T * 0.14, 0, T * 0.86); g.addColorStop(0, MAROON_HI); g.addColorStop(1, MAROON); c.fillStyle = g; c.fillRect(x0, T * 0.14, T * 0.3, T * 0.72); c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.strokeRect(x0, T * 0.14, T * 0.3, T * 0.72); c.fillStyle = 'rgba(255,230,220,.12)'; c.fillRect(x0 + 1, T * 0.15, T * 0.3 - 2, T * 0.06); }
    for (const yy of [0.1, 0.82]) { c.fillStyle = GOLD; c.fillRect(0, T * yy, T, T * 0.08); c.fillStyle = rgba(GOLD_HI, 0.8); c.fillRect(0, T * yy, T, T * 0.025); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(0, T * yy, T, T * 0.08); }
    if (((horiz ? x : y) % 2) === 0) for (const yy of [0.14, 0.86]) { c.fillStyle = BONE; c.beginPath(); c.arc(T * 0.5, T * yy, T * 0.07, 0, TAU); c.fill(); ink(c, lw * 0.5); }
    c.restore(); }
  function plankEdge(c, x, y, X, Y, T, lw) { c.fillStyle = GOLD_D; c.fillRect(X + T * 0.02, Y, T * 0.96, T * 0.08); c.fillStyle = MAROON_D; c.fillRect(X + T * 0.02, Y + T * 0.08, T * 0.96, T * 0.14); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X + T * 0.1, Y + T * 0.22, T * 0.8, T * 0.1); }

  /* ---- props: the instrument ---- */
  /* the mouths (in T, from the prop's feet) where the live glow breathes: MOUTHS[kind](v) -> [[dx, dy, r], ...] */
  const MOUTHS = {};
  const fadeUp = (c, T, x0, x1, y0, y1) => { c.save(); c.globalCompositeOperation = 'source-atop'; const g = c.createLinearGradient(0, y1, 0, y0); g.addColorStop(0, 'rgba(11,5,9,0)'); g.addColorStop(0.55, 'rgba(11,5,9,.6)'); g.addColorStop(1, 'rgba(11,5,9,1)'); c.fillStyle = g; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore(); };
  const socket = (c, x, y, w, T, lw, col) => { ell(c, x, y, w * 0.95, w * 0.34); c.fillStyle = 'rgba(12,4,10,.4)'; c.fill(); c.beginPath(); c.moveTo(x - w * 0.8, y - T * 0.02); c.lineTo(x - w * 0.8, y - T * 0.3); c.lineTo(x + w * 0.8, y - T * 0.3); c.lineTo(x + w * 0.8, y - T * 0.02); c.closePath(); c.fillStyle = cylG(c, x - w * 0.8, x + w * 0.8, col || MAROON_HI, MAROON_D); c.fill(); ink(c, lw); c.fillStyle = GOLD; c.fillRect(x - w * 0.8, y - T * 0.24, w * 1.6, T * 0.06); ell(c, x, y - T * 0.3, w * 0.8, w * 0.26); c.fillStyle = shadeC(col || MAROON_HI, 0.15); c.fill(); ink(c, lw * 0.8); };
  /* straight columns: one to three organ pipes rising out of sockets into the dark, each with a lipped mouth slit */
  const COLS = [[[0, 1.15, 7.6]], [[-0.55, 0.92, 7.2], [0.55, 1.02, 7.8]], [[-0.85, 0.72, 6.6], [0.08, 1.0, 7.9], [0.95, 0.7, 7.0]], [[-0.2, 1.25, 7.8]]];
  function colMouthY(h) { return -1.7 - h * 0.04; }
  function pipecolumn(c, T, v) { const lw = lw0(T), set = COLS[v % 4], bone = v % 2 === 1; shadowEll(c, T, 1.0, 0.35);
    for (const [ox, w, h] of set) { const x = ox * T, W = w * T, H = h * T; socket(c, x, 0, W * 0.85, T, lw);
      c.beginPath(); c.rect(x - W / 2, -H, W, H - T * 0.3); c.fillStyle = cylG(c, x - W / 2, x + W / 2, bone ? BONE : MAROON_HI, bone ? BONE_D : MAROON_D); c.fill(); ink(c, lw);
      c.strokeStyle = 'rgba(255,255,255,.28)'; c.lineWidth = Math.max(1, W * 0.06); c.beginPath(); c.moveTo(x - W * 0.3, -T * 0.4); c.lineTo(x - W * 0.3, -H); c.stroke();
      for (let k = 1; k < 5; k++) { const yy = -T * (0.7 + k * 1.35); c.fillStyle = GOLD; c.fillRect(x - W / 2 - 1, yy, W + 2, T * 0.1); c.strokeStyle = LN; c.lineWidth = lw * 0.6; c.strokeRect(x - W / 2 - 1, yy, W + 2, T * 0.1); c.fillStyle = rgba(GOLD_HI, 0.8); c.fillRect(x - W / 2, yy, W * 0.4, T * 0.03); }
      // the mouth: a flattened lip over a dark slit, the soft light inside (the live glow breathes over it)
      const my = colMouthY(h) * T; c.beginPath(); c.moveTo(x - W * 0.34, my + T * 0.28); c.lineTo(x - W * 0.3, my - T * 0.16); c.quadraticCurveTo(x, my - T * 0.42, x + W * 0.3, my - T * 0.16); c.lineTo(x + W * 0.34, my + T * 0.28); c.closePath(); c.fillStyle = '#14070F'; c.fill(); ink(c, lw * 0.8);
      const g = c.createLinearGradient(0, my - T * 0.3, 0, my + T * 0.3); g.addColorStop(0, rgba(CORAL, 0.5)); g.addColorStop(1, rgba(CORAL_D, 0.1)); c.fillStyle = g; c.fill();
      c.beginPath(); c.moveTo(x - W * 0.36, my + T * 0.28); c.lineTo(x + W * 0.36, my + T * 0.28); c.lineTo(x + W * 0.3, my + T * 0.46); c.lineTo(x - W * 0.3, my + T * 0.46); c.closePath(); c.fillStyle = bone ? BONE_HI : BONE; c.fill(); ink(c, lw * 0.7); }
    fadeUp(c, T, -T * 1.4, T * 1.4, -T * 8.2, -T * 4.6); }
  MOUTHS.pipecolumn = v => COLS[v % 4].map(([ox, w, h]) => [ox, colMouthY(h) + 0.05, w * 0.9]);
  /* low arches: a thick pipe rises, bends over and hangs its flared mouth down into the air beside it */
  function archPts2(T, d) { const R0 = T * 1.35, cx = d * R0, cy = -T * 3.6, pts = []; for (let i = 0; i <= 5; i++) pts.push([0, -T * 0.3 + (cy + T * 0.3) * i / 5]);
    for (let i = 1; i <= 12; i++) { const a = Math.PI - i / 12 * Math.PI; pts.push([cx + d * Math.cos(a) * R0, cy - Math.sin(a) * R0]); } for (let i = 1; i <= 3; i++) pts.push([cx + d * R0, cy + i * T * 0.32]); return pts; }
  function pipearch(c, T, v) { const lw = lw0(T), d = v % 2 ? -1 : 1, W = T * 0.78, pts = archPts2(T, d), e = pts[pts.length - 1]; shadowEll(c, T, 0.9, 0.35);
    c.fillStyle = 'rgba(12,4,10,.22)'; ell(c, e[0], T * 0.05, T * 0.7, T * 0.2); c.fill();
    socket(c, 0, 0, W * 0.9, T, lw); tube(c, pts, W, v % 4 < 2 ? MAROON_HI : BONE_D, lw, { bands: 4, bands0: 2 });
    mouth(c, e[0], e[1] + T * 0.35, W * 0.75, W * 0.32, 0, 0.35, { lw }); fadeUp(c, T, -T * 2.8, T * 2.8, -T * 5.6, -T * 4.0); }
  MOUTHS.pipearch = v => { const d = v % 2 ? -1 : 1; return [[d * 2.7, -3.6 + 0.96 + 0.35, 0.8]]; };
  /* large spirals: a pipe climbs and coils into a great spiral, its mouth at the eye of the coil */
  function pipespiral(c, T, v) { const lw = lw0(T), d = v % 2 ? -1 : 1, W = T * 0.62; shadowEll(c, T, 1.0, 0.35);
    const n = 46, cy = -T * 4.3, pts = []; for (let i = 0; i <= 4; i++) pts.push([0, -T * 0.3 - i / 4 * T * 1.25]);
    for (let i = 0; i <= n; i++) { const u = i / n, a = Math.PI / 2 + d * u * TAU * 1.4, r = T * (1.75 - u * 1.25); pts.push([d * Math.cos(a) * r * 0 + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    // (the climbing leg meets the coil's foot: the coil's first point is straight below its centre)
    socket(c, 0, 0, W * 0.9, T, lw, v % 4 < 2 ? MAROON_HI : BONE_D);
    tube(c, pts.slice(0, 6), W, v % 4 < 2 ? MAROON_HI : BONE_D, lw); tube(c, pts.slice(5), W * 0.92, v % 4 < 2 ? MAROON_HI : BONE_D, lw, { bands: 7, bands0: 3 });
    const e = pts[pts.length - 1]; mouth(c, e[0], e[1], W * 0.55, W * 0.55, 0, 0.35, { lw }); fadeUp(c, T, -T * 2.6, T * 2.6, -T * 7.0, -T * 5.6); }
  MOUTHS.pipespiral = v => { const d = v % 2 ? -1 : 1, a = Math.PI / 2 + d * TAU * 1.4, r = 0.5; return [[Math.cos(a) * r, -4.3 + Math.sin(a) * r, 0.75]]; };
  /* a great bone horn rising from a socket, its bell flaring to the side */
  function bonehorn(c, T, v) { const d = v % 2 ? -1 : 1; shadowEll(c, T, 0.8, 0.32); horn(c, -d * T * 0.25, 0, T * 3.4, { dir: d, k: 0.3, lw: lw0(T) }); }
  // (the horn's bell centre: run horn()'s centre line once to find it, for each direction)
  const hornTip = (s, dir) => hornAt(1, s, dir);
  MOUTHS.bonehorn = v => { const d = v % 2 ? -1 : 1, [x, y] = hornTip(3.4, d); return [[x - d * 0.25, y, 0.7]]; };
  function greathorn(c, T, v) { const d = v % 2 ? -1 : 1; shadowEll(c, T, 1.2, 0.35); horn(c, -d * T * 0.45, 0, T * 5.4, { dir: d, k: 0.3, lw: lw0(T) * 1.2, bands: [3, 9, 15] }); }
  MOUTHS.greathorn = v => { const d = v % 2 ? -1 : 1, [x, y] = hornTip(5.4, d); return [[x - d * 0.45, y, 1.0]]; };
  /* a cluster of drums, bone membranes in maroon shells laced with gold */
  function drumstack(c, T, v) { const lw = lw0(T), R = rnd(13 + v * 7); shadowEll(c, T, 0.95, 0.35);
    const set = v % 2 ? [[-0.55, 0.06, 0.55], [0.58, 0.1, 0.46], [0.02, -0.5, 0.5]] : [[-0.4, 0.05, 0.66], [0.62, -0.1, 0.44]];
    for (const [x, yy, r] of set) { const X0 = x * T, Y0 = yy * T, Rr = r * T, H = Rr * 1.1; c.beginPath(); c.rect(X0 - Rr, Y0 - H, Rr * 2, H); c.fillStyle = cylG(c, X0 - Rr, X0 + Rr, MAROON_HI, MAROON_D); c.fill(); ink(c, lw);
      ell(c, X0, Y0, Rr, Rr * 0.34); c.fillStyle = MAROON_D; c.fill(); ink(c, lw * 0.8);
      c.strokeStyle = GOLD; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); for (let i = 0; i <= 8; i++) { const px = X0 - Rr + i / 8 * Rr * 2, py = Y0 - (i % 2 ? H * 0.85 : H * 0.15); i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
      ell(c, X0, Y0 - H, Rr, Rr * 0.34); const g = c.createRadialGradient(X0 - Rr * 0.3, Y0 - H - Rr * 0.1, 1, X0, Y0 - H, Rr); g.addColorStop(0, BONE_HI); g.addColorStop(1, BONE_D); c.fillStyle = g; c.fill(); ink(c, lw);
      c.save(); c.translate(X0, Y0 - H); c.scale(1, 0.34); emboss(c, 0, 0, Rr * 0.9, Math.floor(R() * 6), Math.max(1.2, Rr * 0.12)); c.restore(); } }
  /* the bellows of the Breathworks: pleated maroon hide between bone boards, a bone nozzle */
  function bellows(c, T, v) { const lw = lw0(T); shadowEll(c, T, 1.2, 0.35); const d = v % 2 ? -1 : 1;
    c.beginPath(); c.moveTo(-T * 1.1, -T * 0.2); c.lineTo(T * 1.1, -T * 0.2); c.lineTo(T * 1.0, -T * 0.42); c.lineTo(-T * 1.0, -T * 0.42); c.closePath(); c.fillStyle = BONE_D; c.fill(); ink(c, lw);
    for (let i = 0; i < 5; i++) { const y0 = -T * (0.42 + i * 0.26), y1 = y0 - T * 0.26, w0 = T * (1.0 - (i % 2) * 0.12), w1 = T * (0.88 + (i % 2) * 0.12); c.beginPath(); c.moveTo(-w0, y0); c.lineTo(w0, y0); c.lineTo(w1, y1); c.lineTo(-w1, y1); c.closePath(); c.fillStyle = i % 2 ? MAROON : MAROON_HI; c.fill(); ink(c, lw * 0.7); }
    const top = -T * 1.72; c.beginPath(); c.moveTo(-T * 1.05, top); c.lineTo(T * 1.05, top); c.lineTo(T * 0.92, top - T * 0.22); c.lineTo(-T * 0.92, top - T * 0.22); c.closePath(); c.fillStyle = BONE; c.fill(); ink(c, lw); c.fillStyle = GOLD; c.fillRect(-T * 0.3, top - T * 0.2, T * 0.6, T * 0.06);
    tube(c, [[d * T * 1.0, -T * 0.9], [d * T * 1.5, -T * 0.95], [d * T * 1.75, -T * 0.7]], T * 0.26, BONE, lw); mouth(c, d * T * 1.8, -T * 0.6, T * 0.16, T * 0.1, 0, 0.3, { lw: lw * 0.8 }); }
  MOUTHS.bellows = v => [[(v % 2 ? -1 : 1) * 1.8, -0.6, 0.45]];
  /* a pressure gauge on a bone post, a little horn on top */
  function gaugepost(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.5, 0.32); socket(c, 0, 0, T * 0.32, T, lw);
    c.beginPath(); c.rect(-T * 0.12, -T * 2.2, T * 0.24, T * 1.9); c.fillStyle = cylG(c, -T * 0.12, T * 0.12, BONE, BONE_D); c.fill(); ink(c, lw);
    gauge(c, 0, -T * 1.6, T * 0.8, 0.25 + (v % 4) * 0.18, v % 6); horn(c, -T * 0.05, -T * 2.15, T * 1.0, { dir: v % 2 ? -1 : 1, k: 0.25, lw: lw * 0.8, bands: [3] }); }
  /* a bone conduit lying on the floor between two gold clamps */
  function conduit(c, T, v) { const lw = lw0(T); shadowEll(c, T, 1.3, 0.3); const pts = []; for (let i = 0; i <= 10; i++) pts.push([-T * 1.4 + i / 10 * T * 2.8, -T * 0.42 - Math.sin(i / 10 * Math.PI) * T * 0.12]);
    tube(c, pts, T * 0.62, BONE, lw, { bands: 4, bands0: 2 }); for (const sd of [-1, 1]) { c.beginPath(); c.rect(sd * T * 1.25 - T * 0.12, -T * 0.42, T * 0.24, T * 0.42); c.fillStyle = MAROON_HI; c.fill(); ink(c, lw * 0.8); } }
  /* a bell hung from a gold-and-maroon frame */
  function bellframe(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.9, 0.32);
    for (const sd of [-1, 1]) { c.beginPath(); c.rect(sd * T * 0.85 - T * 0.09, -T * 3.9, T * 0.18, T * 3.9); c.fillStyle = cylG(c, sd * T * 0.85 - T * 0.09, sd * T * 0.85 + T * 0.09, MAROON_HI, MAROON_D); c.fill(); ink(c, lw); c.fillStyle = GOLD; c.fillRect(sd * T * 0.85 - T * 0.12, -T * 0.4, T * 0.24, T * 0.12); }
    c.beginPath(); c.moveTo(-T * 1.15, -T * 3.85); c.quadraticCurveTo(0, -T * 4.35, T * 1.15, -T * 3.85); c.lineTo(T * 1.1, -T * 3.65); c.quadraticCurveTo(0, -T * 4.1, -T * 1.1, -T * 3.65); c.closePath(); c.fillStyle = GOLD; c.fill(); ink(c, lw);
    bell(c, 0, -T * 3.8, T * 1.9 + (v % 3) * T * 0.15, { lw, swing: (v % 3 - 1) * 0.06 }); }
  MOUTHS.bellframe = v => [[0, -3.8 + (1.9 + (v % 3) * 0.15) * 0.82, 0.8]];
  /* a giant tuning fork of tarnished gold on a bone foot */
  function tuningfork(c, T, v) { const lw = lw0(T); shadowEll(c, T, 0.6, 0.32); socket(c, 0, 0, T * 0.4, T, lw, BONE_D);
    c.beginPath(); c.rect(-T * 0.1, -T * 1.6, T * 0.2, T * 1.3); c.fillStyle = cylG(c, -T * 0.1, T * 0.1, GOLD_HI, GOLD_D); c.fill(); ink(c, lw);
    c.beginPath(); c.moveTo(-T * 0.44, -T * 4.3); c.lineTo(-T * 0.44, -T * 2.0); c.quadraticCurveTo(-T * 0.44, -T * 1.5, 0, -T * 1.5); c.quadraticCurveTo(T * 0.44, -T * 1.5, T * 0.44, -T * 2.0); c.lineTo(T * 0.44, -T * 4.3); c.lineTo(T * 0.22, -T * 4.3); c.lineTo(T * 0.22, -T * 2.05); c.quadraticCurveTo(T * 0.2, -T * 1.75, 0, -T * 1.75); c.quadraticCurveTo(-T * 0.2, -T * 1.75, -T * 0.22, -T * 2.05); c.lineTo(-T * 0.22, -T * 4.3); c.closePath();
    c.fillStyle = cylG(c, -T * 0.44, T * 0.44, GOLD_HI, GOLD_D); c.fill(); ink(c, lw);
    c.strokeStyle = 'rgba(255,240,200,.5)'; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(-T * 0.38, -T * 4.2); c.lineTo(-T * 0.38, -T * 2.1); c.stroke();
    c.strokeStyle = rgba(CORAL_HI, 0.35); c.lineWidth = Math.max(1, lw * 0.6); for (const sd of [-1, 1]) for (let i = 1; i <= 2; i++) { c.beginPath(); c.arc(sd * T * 0.33, -T * 3.6, T * 0.25 * i + T * 0.2, sd > 0 ? -0.6 : Math.PI - 0.6, sd > 0 ? 0.6 : Math.PI + 0.6); c.stroke(); } }
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { pipecolumn: [4.0, 8.8], pipearch: [6.4, 6.2], pipespiral: [5.2, 7.4], bonehorn: [4.6, 4.6], greathorn: [6.6, 6.6], drumstack: [3.2, 3.0], bellows: [4.4, 2.8], gaugepost: [2.4, 3.6], conduit: [3.6, 1.6], bellframe: [3.0, 5.0], tuningfork: [2.2, 5.0] });
  Object.assign(PROPS, { pipecolumn, pipearch, pipespiral, bonehorn, greathorn, drumstack, bellows, gaugepost, conduit, bellframe, tuningfork });

  /* ---- the lands themselves ---- */
  const land = o => Object.assign({ rift: true, tile: 'keep', out: true, ambient: 'motes', hazard: 'laser', gap: 'choirdeep', bridgeFn: plankBridge, bridgeEdge: plankEdge, wallFn: ribWall, propN: [2, 2], fog: '#0B0509', darkRGB: '11,5,9' }, o);
  BIOMES.scorehall = land({ name: 'The Silent Score', dark: 0.14, bg: '#0B0509', accent: BONE_HI, light: CORAL_HI, bridgeCol: MAROON_HI, deco: GOLD,
    floor: ['#CFBF9C', '#C8B895', '#D5C6A4'], grout: '#8C7550', hi: '#F2E8CF', top: '#4A2A42', face: '#341C2F', faceD: '#1D0E1A', cliff: '#1D0E1A', grade: 'rgba(218,143,134,.04)', wallBand: GOLD,
    props: ['drumstack', 'drumstack', 'gaugepost', 'drumstack'], floorFn: scoreFloor });
  BIOMES.breathworks = land({ name: 'The Breathworks', dark: 0.18, bg: '#0B0509', accent: CORAL_HI, light: CORAL_HI, bridgeCol: MAROON_HI, deco: CORAL,
    floor: ['#4D2C43', '#48283F', '#53304A'], grout: '#1D0E1A', hi: '#6E4462', top: '#3A1F34', face: '#2A1424', faceD: '#160A13', cliff: '#160A13', grade: 'rgba(218,143,134,.06)', wallBand: BONE_D,
    props: ['bellows', 'gaugepost', 'conduit', 'drumstack', 'gaugepost'], floorFn: breathFloor });
  BIOMES.resonance = land({ name: 'The Resonating Depths', dark: 0.24, bg: '#080306', accent: GOLD_HI, light: CORAL_HI, bridgeCol: MAROON, deco: GOLD,
    floor: ['#2E1A2A', '#2A1726', '#33202F'], grout: '#0A0408', hi: '#4A3044', top: '#2A1724', face: '#1E0F1A', faceD: '#0E060C', cliff: '#0E060C', grade: 'rgba(212,185,120,.06)', wallBand: GOLD_D,
    props: ['tuningfork', 'drumstack', 'drumstack', 'tuningfork'], floorFn: resoFloor, fog: '#080306', darkRGB: '8,3,6' });
  BIOME_ORDER.push('scorehall', 'breathworks', 'resonance');
  DARK_COL.scorehall = '11,5,9'; DARK_COL.breathworks = '11,5,9'; DARK_COL.resonance = '8,3,6';
  // (broad circular plates: ovals and rings, a few islands; the arena of a Tower-style boss floor an oval)
  ROOM_SHAPES.scorehall = ['oval', 'oval', 'ring', 'oval']; ROOM_SHAPES.breathworks = ['oval', 'ring', 'oval', 'islands']; ROOM_SHAPES.resonance = ['oval', 'ring', 'oval', 'ring'];
  BOSS_ARENA.scorehall = BOSS_ARENA.breathworks = BOSS_ARENA.resonance = 'oval';
  if (typeof DECALS !== 'undefined') { DECALS.scorehall = [['staffline', 0.04], ['goldring', 0.03], ['bonechip', 0.04], ['restmark', 0.02]]; DECALS.breathworks = [['coraldust', 0.07], ['bonechip', 0.04], ['goldring', 0.02]]; DECALS.resonance = [['goldring', 0.05], ['coraldust', 0.05], ['restmark', 0.02], ['bonechip', 0.03]]; }
  /* the plates' rims: the pipes and horns stand round the edge of every plate, never across its walkable middle */
  // (tall pipes only where the plate's edge looks north over the dark, so they rise into it and never cover the floor;
  // short pieces elsewhere round the rim)
  const RIMS = { scorehall: { tall: ['pipecolumn', 'pipecolumn', 'pipearch', 'greathorn', 'pipecolumn'], short: ['drumstack', 'drumstack', 'gaugepost'] },
    breathworks: { tall: ['pipearch', 'pipecolumn', 'pipearch', 'pipespiral'], short: ['bellows', 'gaugepost', 'conduit', 'drumstack'] },
    resonance: { tall: ['pipespiral', 'pipecolumn', 'pipespiral', 'bellframe', 'greathorn'], short: ['tuningfork', 'drumstack', 'drumstack'] } };
  function dressRim({ rm, i, G, RM, props, R, MW, walk, okFeature, first, id }) {
    const L = RIMS[rm.biome]; if (!L) return; const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return; const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && [1, -1, MW, -MW].some(d => !walk(k + d) && !props.has(k + d)); });
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]]; for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } } return seen.size >= open.length; };
    const northOpen = k => !walk(k - MW) && !walk(k - 2 * MW) && !walk(k - MW - 1) && !walk(k - MW + 1);
    let want = Math.max(2, Math.round(rim.length * (first ? 0.09 : 0.13))), tries = 0; const placed = [];
    while (want > 0 && rim.length && tries++ < 200) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1); const x = k % MW, y = (k / MW) | 0, tall = northOpen(k);
      if (placed.some(([px, py, pt]) => Math.abs(px - x) + Math.abs(py - y) < (tall && pt ? 5 : 3))) continue;
      if (!tall && R() < 0.4) continue;
      const was = G[k]; G[k] = T_SOLID; if (!connected()) { G[k] = was; continue; } const list = tall ? L.tall : L.short; props.set(k, list[Math.floor(R() * list.length)]); placed.push([x, y, tall]); want--; } }
  BIOMES.scorehall.dress = BIOMES.breathworks.dress = BIOMES.resonance.dress = dressRim;

  /* ======================= the brood ======================= */
  Object.assign(MON, {
    bellmite: { name: 'Bell mite', from: 999, hp: 280, spd: 1.25, r: 0.48, dmg: 20, xp: 18, coin: 1.0, color: '#341C2F', bio: ['scorehall', 'breathworks', 'resonance'], tip: 'A round maroon shell on three gold legs with a little bone clapper hanging beneath. Before it pulses its shell visibly widens and a ring is shown round it: step out of the ring, then hit it while it rings out.', kit: [] },
    pipeeel: { name: 'Pipe eel', from: 999, hp: 240, spd: 1.0, r: 0.52, dmg: 17, xp: 19, coin: 1.1, color: '#D9C9A5', bio: ['scorehall', 'breathworks', 'resonance'], tip: 'A thin ivory tube bent into an S, with a dark trumpet mouth. Three lights round the mouth count the beat, one by one; then it fires three notes, one per light, along the shown line. Step off the line before the third light.', kit: [] },
    hushmoth: { name: 'Hush moth', from: 999, hp: 220, spd: 1.7, r: 0.52, dmg: 15, xp: 20, coin: 1.2, color: '#1E141C', fly: true, bio: ['scorehall', 'breathworks', 'resonance'], tip: 'A black oval body under two broad cape-like wings, with a soft coral throat. It settles on a drum pad and hushes it: the pad takes no steps and no charge until you hit the moth. It only ever silences the pad, never your moves.', kit: [] },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a round maroon shell on three gold legs, a bone clapper hanging under it; mode 'w1'..'w4' widens the shell before
       its pulse (the rim brightening coral), 'ring' the pulse itself */
    bellmite(c, r, ph, o) { const lw = lwOf(r), run = Math.sin(ph * TAU * 2), wi = o.mode && o.mode[0] === 'w' ? +o.mode.slice(1) / 4 : o.mode === 'ring' ? 1.15 : 0, sx = 1 + wi * 0.38, sy = 1 - wi * 0.12, bob = Math.sin(ph * TAU) * r * 0.04;
      c.fillStyle = 'rgba(12,4,10,.3)'; ell(c, 0, r * 0.62, r * 0.95 * sx, r * 0.26); c.fill();
      const up = r * 0.32;
      // three gold legs: a knee out to the side, a pointed foot (the middle one behind, the two others in front)
      for (const [a, k] of [[0, 1], [-1, 1], [1, -1]]) { const fx = a * r * 0.98 * (0.85 + sx * 0.15), fy = a === 0 ? r * 0.5 : r * 0.68, sw = run * k * r * 0.08, kx = a === 0 ? sw * 0.5 : a * r * 1.02 + sw, ky = a === 0 ? r * 0.2 : r * 0.1; limb(c, a * r * 0.38, -up + r * 0.15, kx, ky, Math.max(lw * 1.1, r * 0.11), GOLD); limb(c, kx, ky, fx + sw, fy, Math.max(lw * 0.95, r * 0.08), GOLD_D); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(kx, ky, r * 0.07, 0, TAU); c.fill(); stroke(c, lw * 0.5); c.beginPath(); c.moveTo(fx + sw - r * 0.06, fy - r * 0.04); c.lineTo(fx + sw, fy + r * 0.06); c.lineTo(fx + sw + r * 0.06, fy - r * 0.04); c.closePath(); c.fillStyle = GOLD_D; c.fill(); }
      // the clapper on a short cord under the shell
      const cx = Math.sin(ph * TAU * 2) * r * 0.09 * (1 + wi * 2); c.strokeStyle = LN; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(0, -up + r * 0.1); c.lineTo(cx, r * 0.24); c.stroke(); c.beginPath(); c.arc(cx, r * 0.3, r * 0.13, 0, TAU); c.fillStyle = shade(c, BONE_HI, r * 0.13, cx - r * 0.04, r * 0.25, 0.4); c.fill(); stroke(c, lw * 0.7);
      c.save(); c.translate(0, bob - up); c.scale(sx, sy);
      c.beginPath(); c.moveTo(-r * 0.9, r * 0.08); c.bezierCurveTo(-r * 0.95, -r * 0.6, -r * 0.45, -r * 0.95, 0, -r * 0.95); c.bezierCurveTo(r * 0.45, -r * 0.95, r * 0.95, -r * 0.6, r * 0.9, r * 0.08); c.quadraticCurveTo(0, r * 0.3, -r * 0.9, r * 0.08); c.closePath(); c.fillStyle = shade(c, o.color, r, -r * 0.35, -r * 0.55, 0.42); c.fill(); stroke(c, lw / Math.max(sx, 1));
      c.strokeStyle = rgba(MAROON_HI, 0.9); c.lineWidth = lw * 0.6; c.beginPath(); c.ellipse(0, -r * 0.25, r * 0.62, r * 0.42, 0, Math.PI * 1.08, Math.PI * 1.92); c.stroke();
      c.fillStyle = 'rgba(255,230,230,.32)'; ell(c, -r * 0.35, -r * 0.6, r * 0.24, r * 0.13, -0.5); c.fill();
      // the gold rim of the mouth, glowing coral as it widens
      c.beginPath(); c.moveTo(-r * 0.9, r * 0.08); c.quadraticCurveTo(0, r * 0.3, r * 0.9, r * 0.08); c.strokeStyle = LN; c.lineWidth = lw * 2.2; c.stroke(); c.strokeStyle = wi > 0 ? CORAL_HI : GOLD; c.lineWidth = lw * 1.2; c.stroke();
      for (let i = 0; i < 3; i++) { const a = -2.2 + i * 0.6; c.fillStyle = GOLD_HI; c.beginPath(); c.arc(Math.cos(a) * r * 0.62, -r * 0.25 + Math.sin(a) * r * 0.42, r * 0.06, 0, TAU); c.fill(); }
      c.restore(); if (wi > 0) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + wi * 0.4; blitSized(c, glowSprite(CORAL_HI), -r * 1.4, -r * 0.6, r * 2.8, r * 1.4); c.restore(); } },
    /* a thin ivory tube bent into an S, a dark trumpet mouth at its head; 'l1'..'l3' light the three mouth lights, 'fire' flares */
    pipeeel(c, r, ph, o) { const lw = lwOf(r), lights = o.mode && o.mode[0] === 'l' ? +o.mode.slice(1) : o.mode === 'fire' ? 3 : 0, w = r * 0.36, s = Math.sin(ph * TAU) * r * 0.12;
      c.fillStyle = 'rgba(12,4,10,.28)'; ell(c, 0, r * 0.72, r * 0.9, r * 0.22); c.fill();
      const pts = []; for (let i = 0; i <= 18; i++) { const u = i / 18; pts.push([-r * 0.55 + u * r * 1.0 + Math.sin(u * TAU * 1.0 + 0.2) * r * 0.62 * (1 - u * 0.25) + s * u * 0.6, r * 0.62 - u * r * 1.55]); }
      tube(c, pts, w, o.color, lw * 0.9, { bands: 5, bands0: 3, bandCol: GOLD });
      // the trumpet mouth: a flared dark bell, turned toward you
      const e = pts[18], q = pts[16], a = Math.atan2(e[1] - q[1], e[0] - q[0]) * 0.4 - 0.25; c.save(); c.translate(e[0], e[1]); c.rotate(a);
      c.beginPath(); c.moveTo(-w * 0.2, -w * 0.5); c.quadraticCurveTo(w * 0.6, -w * 0.6, w * 1.1, -w * 1.25); c.lineTo(w * 1.1, w * 1.25); c.quadraticCurveTo(w * 0.6, w * 0.6, -w * 0.2, w * 0.5); c.closePath(); c.fillStyle = shade(c, BONE, w, 0, -w * 0.4, 0.3); c.fill(); stroke(c, lw);
      ell(c, w * 1.1, 0, w * 0.34, w * 1.22); c.fillStyle = '#100509'; c.fill(); stroke(c, lw * 0.8);
      if (lights >= 3) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(CORAL_HI), w * 0.2, -w * 1.6, w * 2, w * 3.2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      for (let i = 0; i < 3; i++) { const la = -0.9 + i * 0.9, lx = w * 1.1 + Math.cos(la) * w * 0.05, ly = Math.sin(la) * w * 1.15; c.beginPath(); c.arc(lx, ly, w * 0.24, 0, TAU); c.fillStyle = i < lights ? '#FFE3A0' : GOLD_D; c.fill(); stroke(c, lw * 0.6); if (i < lights) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.8; blitSized(c, glowSprite(CORAL_HI), lx - w * 0.7, ly - w * 0.7, w * 1.4, w * 1.4); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } }
      c.restore();
      // the tail: a small gold cap
      const t0 = pts[0]; c.beginPath(); c.arc(t0[0], t0[1], w * 0.5, 0, TAU); c.fillStyle = GOLD; c.fill(); stroke(c, lw * 0.8); },
    /* a black oval body under two broad cape wings, a soft coral throat; flapping; 'hush' spreads the wings and lights the throat */
    hushmoth(c, r, ph, o) { const lw = lwOf(r), hush = o.mode === 'hush', fl = hush ? 0.3 + Math.sin(ph * TAU) * 0.1 : Math.sin(ph * TAU), bob = Math.sin(ph * TAU) * r * 0.08;
      c.fillStyle = 'rgba(12,4,10,.25)'; ell(c, 0, r * 0.95, r * 0.8, r * 0.18); c.fill();
      c.save(); c.translate(0, -r * 0.35 + bob);
      for (const sd of [-1, 1]) { const sp = hush ? 1.25 : 0.75 + fl * 0.35; c.save(); c.scale(sd, 1); c.beginPath(); c.moveTo(r * 0.1, -r * 0.42); c.bezierCurveTo(r * 0.5, -r * (0.95 + fl * 0.25), r * 1.25 * sp, -r * (0.85 + fl * 0.15), r * 1.32 * sp, -r * 0.2); c.bezierCurveTo(r * 1.38 * sp, r * 0.35, r * 1.05 * sp, r * 0.95, r * 0.62 * sp + r * 0.1, r * 1.02); c.quadraticCurveTo(r * 0.42, r * 1.1, r * 0.3, r * 0.92); c.quadraticCurveTo(r * 0.2, r * 0.5, r * 0.1, r * 0.4); c.closePath();
        const g = c.createLinearGradient(0, -r, r * 1.4, r); g.addColorStop(0, '#3A2A36'); g.addColorStop(0.5, '#1E141C'); g.addColorStop(1, '#0C070B'); c.fillStyle = g; c.fill(); stroke(c, lw);
        c.strokeStyle = 'rgba(218,143,134,.32)'; c.lineWidth = lw * 0.6; for (const [tx, ty] of [[1.2, -0.45], [1.15, 0.35], [0.7, 0.92]]) { c.beginPath(); c.moveTo(r * 0.16, -r * 0.1); c.quadraticCurveTo(r * tx * 0.6 * sp, r * ty * 0.4, r * tx * sp * 0.92, r * ty * 0.92); c.stroke(); }
        c.strokeStyle = 'rgba(218,143,134,.5)'; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(r * 1.3 * sp, -r * 0.1); c.bezierCurveTo(r * 1.34 * sp, r * 0.38, r * 1.03 * sp, r * 0.9, r * 0.62 * sp + r * 0.1, r * 0.98); c.stroke();
        c.fillStyle = 'rgba(217,201,165,.3)'; ell(c, r * 0.9 * sp, -r * 0.45, r * 0.13, r * 0.08, 0.4); c.fill(); c.restore(); }
      ell(c, 0, r * 0.05, r * 0.34, r * 0.6); c.fillStyle = shade(c, '#2A1E28', r * 0.5, -r * 0.1, -r * 0.3, 0.4); c.fill(); stroke(c, lw);
      ell(c, 0, -r * 0.08, r * 0.17, r * 0.24); c.fillStyle = hush ? CORAL_HI : CORAL; c.fill(); stroke(c, lw * 0.6); if (hush) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(CORAL_HI), -r * 0.6, -r * 0.7, r * 1.2, r * 1.2); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
      for (const sd of [-1, 1]) { c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(sd * r * 0.08, -r * 0.5); c.quadraticCurveTo(sd * r * 0.3, -r * 0.95, sd * r * 0.45, -r * 0.9); c.stroke(); }
      c.restore(); },
  });
  Object.assign(EXT, { bellmite: 2.6, pipeeel: 2.8, hushmoth: 3.0 }); Object.assign(NF, { bellmite: 6, pipeeel: 6, hushmoth: 6 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    /* the mite walks in; within reach its shell widens for 0.8 s (a ring is shown), then it pulses */
    bellmite(m, A, X) {
      if (m.wT > 0) { m.wT -= A.dt; const u = 1 - m.wT / 0.8; m.wid = u; m.mode = 'w' + Math.max(1, Math.min(4, Math.ceil(u * 4))); if (m.wT <= 0) { m.mode = 'ring'; m.ringT = 0.25; m.pulses = (m.pulses || 0) + 1; X.ring(m.x, m.y, 0.3, 2.4, 0.35, CORAL_HI, 0.45); if (A.d < 2.4 + X.me.r && !X.me.dodge) X.hurtPet(m.dmg * 1.2, m); if (X.sfx.chime) X.sfx.chime(660, 0.4); m.cd = 2.4 + Math.random(); } return; }
      if (m.ringT > 0) { m.ringT -= A.dt; if (m.ringT <= 0) { m.mode = null; m.wid = 0; } return; }
      m.mode = null; m.wid = 0; if (A.d > 1.6) A.steer(A.sp);
      if (m.cd <= 0 && A.d < 2.6) { m.wT = 0.8; X.warn({ x: m.x, y: m.y, r: 2.4, life: 0.8, max: 0.8, src: m, color: WARN }); }
    },
    /* the eel keeps its range; three mouth lights count the beat (0.45 s each, a line shown), then three notes, one a beat */
    pipeeel(m, A, X) {
      if (m.fireN > 0) { m.fireT -= A.dt; if (m.fireT <= 0) { m.fireN--; m.fireT = 0.32; m.shots = (m.shots || 0) + 1; X.eshot(m.x + Math.cos(m.fa) * 0.5, m.y - 0.25 + Math.sin(m.fa) * 0.4, m.fa, 6, { dmg: m.dmg, color: CORAL, core: BONE_HI, r: 0.2, style: 'orb', src: m }); if (X.sfx.note) X.sfx.note(520 + (3 - m.fireN) * 130, 0.18, 'triangle', 0.18); m.mode = 'l' + m.fireN; if (!m.fireN) { m.mode = null; m.cd = 2.6 + Math.random() * 1.2; } } m.face = Math.cos(m.fa) >= 0 ? 1 : -1; return; }
      if (m.litT != null && m.lights < 3) { m.litT -= A.dt; if (m.litT <= 0) { m.lights++; m.litT = 0.45; m.mode = 'l' + m.lights; if (X.sfx.blip) X.sfx.blip(); if (m.lights >= 3) { m.litT = null; m.fireN = 3; m.fireT = 0.32; m.fa = Math.atan2(X.me.y - m.y, X.me.x - m.x); m.mode = 'fire'; } } m.face = A.dx >= 0 ? 1 : -1; return; }
      keepRange(m, A, X, 3.5, 6.5); m.mode = null; m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd <= 0 && A.d < 8 && A.los()) { m.lights = 0; m.litT = 0.45; m.volleys = (m.volleys || 0) + 1; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: Math.min(9, A.d + 2), w: 0.9, life: 1.35, max: 1.35, src: m, color: WARN }); }
    },
    /* the moth seeks the nearest drum pad, settles on it and hushes it until a hit interrupts it (or ~18 s pass); with no
       pads near it flutters at you and drops a slow coral note now and then */
    hushmoth(m, A, X) { const C = ctx(X);
      if (m.silPad) { const p = m.silPad; m.silT += A.dt; m.mode = 'hush'; m.x += (p.x - m.x) * Math.min(1, A.dt * 5); m.y += (p.y - 0.15 - m.y) * Math.min(1, A.dt * 5);
        if (m.hp < m.hp0 - 0.5 || m.silT > 18 || m.stun > 0 || C.pads.indexOf(p) < 0) { const hit = m.hp < m.hp0 - 0.5; if (p.silencer === m) p.silencer = null; m.silPad = null; m.mode = null; m.cd = hit ? 6 : 3; m.interrupts = (m.interrupts || 0) + (hit ? 1 : 0); if (hit) { X.text(m.x, m.y - 1.3, 'Interrupted!', CORAL_HI, 14); m.kbx = (m.x - X.me.x) * 2; m.kby = (m.y - X.me.y) * 2; } }
        return; }
      m.mode = null; let best = null, bd = 12; if (m.cd <= 0) for (const p of C.pads) { if (silenced(p) || p.active === false && !p.hi) continue; const d = Math.hypot(p.x - m.x, p.y - m.y) - (p.hi || p.charging ? 3 : 0); if (d < bd) { bd = d; best = p; } }
      if (best) { const dx = best.x - m.x, dy = best.y - m.y, d = Math.hypot(dx, dy) || 1; X.moveEnt(m, dx / d * A.sp * 1.3 * A.dt, dy / d * A.sp * 1.3 * A.dt); m.face = dx >= 0 ? 1 : -1;
        if (d < 0.7) { m.silPad = best; best.silencer = m; m.hp0 = m.hp; m.silT = 0; m.silences = (m.silences || 0) + 1; X.text(best.x, best.y - 1.4, 'HUSH', CORAL_HI, 15); if (X.sfx.hiss) X.sfx.hiss(0.5, 0.12, 900); } return; }
      if (A.d > 2.2) A.steer(A.sp); else X.moveEnt(m, -A.uy * A.sp * 0.8 * A.dt, A.ux * A.sp * 0.8 * A.dt);
      if (m.cd <= 0 && A.d < 7 && A.los()) { m.cd = 3.2 + Math.random(); X.eshot(m.x, m.y - 0.3, A.a, 3.4, { dmg: m.dmg, color: CORAL, core: BONE_HI, r: 0.22, style: 'orb', src: m }); }
    },
  });

  /* ======================= the mini bosses: Rift-touched Cocopets ======================= */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'cadencepet', rift: true, name: 'Cadence', title: 'A Rift-touched Cocopet', hp: 90000, dmg: 50, r: 1.4, spd: 1.8, color: BONE, glow: CORAL_HI, biome: 'scorehall', el: 'wind' },
    { id: 'bellowspet', rift: true, name: 'Bellows', title: 'A Rift-touched Cocopet', hp: 96000, dmg: 50, r: 1.45, spd: 1.7, color: MAROON_HI, glow: CORAL, biome: 'breathworks', el: 'wind' },
    { id: 'hushpet', rift: true, name: 'Hush', title: 'A Rift-touched Cocopet', hp: 104000, dmg: 54, r: 1.5, spd: 1.75, color: MAROON, glow: GOLD_HI, biome: 'resonance', el: 'dark' });
  const shuffle3 = () => { const a = [0, 1, 2]; for (let i = 2; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  Object.assign(DunAI.boss, {
    /* Cadence: three rings round itself, numbered, struck in that order; then three volleys of notes on the beat */
    cadencepet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['rings', 'notes', 'rings'] : ['rings', 'notes']); }
      const T = m.actT; switch (m.act) {
        case 'rings': { if (m.step === 0) { m.step = 1; X.say(m, 'Keep time.'); const R = [[0, 2.2], [2.2, 4.4], [4.4, 6.6]], o = shuffle3(); phrase(X, o.map(i => ({ shape: 'ring', x: m.x, y: m.y, r0: R[i][0], r1: R[i][1], dmg: m.dmg, src: m })), { lead: 2.2, gap: 0.9 }); }
          if (T > 4.4) done(m, 1.6); break; }
        case 'notes': { if (m.step < 3 && T > 0.6 + m.step * 0.6) { m.step++; const n = 10, off = m.step * 0.3; for (let i = 0; i < n; i++) X.eshot(m.x, m.y - 0.5, off + i / n * TAU, 4.6, { dmg: m.dmg * 0.7, color: CORAL, core: BONE_HI, r: 0.18, style: 'orb', src: m }); }
          if (T > 2.6) done(m, 1.4); break; }
        default: done(m, 1); } },
    /* Bellows: three numbered lanes of wind toward you; then a gust cone that pushes */
    bellowspet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['lanes', 'gust', 'lanes'] : ['lanes', 'gust']); }
      const T = m.actT; switch (m.act) {
        case 'lanes': { if (m.step === 0) { m.step = 1; X.say(m, 'Breathe in.'); const a = A.a, px = -Math.sin(a), py = Math.cos(a), o = shuffle3(); phrase(X, o.map(i => { const off = (i - 1) * 2.6; return { shape: 'lane', x: m.x + px * off - Math.cos(a) * 1, y: m.y + py * off - Math.sin(a) * 1, a, len: 11, w: 2.4, dmg: m.dmg, src: m }; }), { lead: 2.2, gap: 0.9 }); }
          if (T > 4.4) done(m, 1.5); break; }
        case 'gust': { if (m.step === 0) { m.step = 1; const a = A.a; beat(X, { shape: 'cone', x: m.x, y: m.y, a, len: 7, spread: 0.55, n: 1, t: 1.4, dmg: m.dmg * 0.9, src: m, fn: (p, hit) => { if (hit) X.push(a, 2.6); X.ring(m.x, m.y, 0.3, 3, 0.3, CORAL_HI, 0.3); } }); }
          if (T > 2.2) done(m, 1.4); break; }
        default: done(m, 1); } },
    /* Hush: a struck disc under you and its smaller echo a beat later; then two numbered cones */
    hushpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['echo', 'cones', 'echo'] : ['echo', 'cones']); }
      const T = m.actT, me = X.me; switch (m.act) {
        case 'echo': { if (m.step === 0) { m.step = 1; X.say(m, 'Listen.'); const x = me.x, y = me.y; beat(X, { shape: 'disc', x, y, r1: 2.6, n: 1, t: 1.8, dmg: m.dmg, src: m }); beat(X, { shape: 'disc', x, y, r1: 2.6, n: 2, t: 2.9, echo: true, dmg: m.dmg * 0.8, src: m }); }
          if (T > 3.4) done(m, 1.5); break; }
        case 'cones': { if (m.step === 0) { m.step = 1; const a = A.a; phrase(X, [{ shape: 'cone', x: m.x, y: m.y, a: a - 0.5, len: 8, spread: 0.45, dmg: m.dmg, src: m }, { shape: 'cone', x: m.x, y: m.y, a: a + 0.5, len: 8, spread: 0.45, dmg: m.dmg, src: m }], { lead: 1.8, gap: 1.0 }); }
          if (T > 3.2) done(m, 1.5); break; }
        default: done(m, 1); } },
  });

  /* ======================= the boss arenas ======================= */
  const VW = 32, VH = 28;
  const arena = {
    /* the 28-m drum chamber: three concentric rings, numbered outward from the centre */
    tammor: { R: 14, rings: [[0, 4.6], [4.6, 9.2], [9.2, 13.6]], carve(set, C) {}, start(C) { return { x: C.x + 0.5, y: C.y + C.R - 2.6 }; } },
    /* the 32×28 pipe platform: three horn mouths on the far (north) edge, three shelter wedges near the centre, a low arch */
    veyra: { R: 16, W: VW, H: VH, wedges: C => [-10.6, 0, 10.6].map(dx => ({ x: Math.floor(C.x + dx), y: Math.floor(C.y + 1) })), arch: C => ({ x: C.x, y: C.y - 8, w: 9 }),
      carve(set, C) { const x0 = Math.floor(C.x - VW / 2), y0 = Math.floor(C.y - VH / 2); for (let y = -20; y < 20; y++) for (let x = -20; x < 20; x++) { const tx = Math.floor(C.x) + x, ty = Math.floor(C.y) + y, inside = tx >= x0 && tx < x0 + VW && ty >= y0 && ty < y0 + VH; set(tx, ty, inside ? T_FLOOR : T_SOLID); }
        for (const w of arena.veyra.wedges(C)) { set(w.x, w.y, T_SOLID); for (let dx = -1; dx <= 1; dx++) set(w.x + dx, w.y + 1, T_SOLID); }
        const A = arena.veyra.arch(C); set(Math.floor(A.x - A.w / 2), Math.floor(A.y), T_SOLID); set(Math.floor(A.x + A.w / 2), Math.floor(A.y), T_SOLID); },
      start(C) { return { x: C.x + 0.5, y: C.y + VH / 2 - 2.5 }; } },
    /* the 36-m resonating bowl: four quadrants, four great horns outside the edge pointing in */
    heart: { R: 18, carve(set, C) {}, start(C) { return { x: C.x + 0.5, y: C.y + C.R - 3 }; } },
  };
  CHO.arena = arena;
  const centreOf = X => X.M.FC || (() => { const rm = X.M.rooms[X.M.arena >= 0 ? X.M.arena : 0] || X.M.rooms[0]; return { x: rm.x + rm.w / 2, y: rm.y + rm.h / 2, R: Math.min(rm.w, rm.h) / 2 }; })();
  const blankTile = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  if (!PROPS.blank) PROPS.blank = () => {};
  // (on a fiend arena make() runs before the game has built its tile cache: a retile then is impossible and needless)
  const safeRetile = X => { try { X.retile(); } catch (e) { if (!(e instanceof ReferenceError)) throw e; } };
  const numberAt = (c, X, x, y, n, k) => { const T = X.Tz(), Xs = X.sx(x), Ys = X.sy(y), s = T * 0.62; c.save(); c.beginPath(); c.arc(Xs, Ys, s * 0.6, 0, TAU); c.fillStyle = rgba(MAROON_D, 0.75); c.fill(); c.strokeStyle = rgba(GOLD_HI, 0.7 + 0.3 * k); c.lineWidth = Math.max(1.5, T * 0.06); c.stroke(); c.font = `900 ${Math.round(s * 0.7)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = k > 0.3 ? '#FFF2D6' : BONE_HI; c.fillText(String(n), Xs, Ys + s * 0.04); c.restore(); };
  /* a cached floor picture for an arena: painted once per zoom on its own canvas at screen resolution (the rings, the
     symbols and the inlay: none of it moves); the live heartbeat and the boss's lights are drawn over it each frame */
  function cachedLayer(holder, key, c, X, R, paint) { const M = c.getTransform(), k = Math.max(1, M.a), T = X.Tz(), sig = `${Math.round(T * 8)}|${Math.round(k * 4)}`, S = Math.ceil((R * 2 + 2) * T * k);
    if (!holder[key] || holder[key + 'S'] !== sig) { const cv = holder[key] || document.createElement('canvas'); cv.width = cv.height = Math.min(4096, S); const g = cv.getContext('2d'); const kk = cv.width / ((R * 2 + 2) * T); g.setTransform(kk, 0, 0, kk, 0, 0); g.clearRect(0, 0, (R * 2 + 2) * T, (R * 2 + 2) * T); paint(g, (R + 1) * T, (R + 1) * T, T); holder[key] = cv; holder[key + 'S'] = sig; }
    return holder[key]; }
  const bossMake = {
    /* Tammor's drum chamber: the floor is a drum: three concentric rings numbered outward, a bone rim, gold studs */
    tammor(X, self, H) { const C = centreOf(X), A = arena.tammor, hold = {};
      const rings = A.rings.map(([r0, r1], i) => ({ i, n: i + 1, r0, r1, lit: 0, warn: 0, struck: 0 }));
      const ringOf = (x, y) => { const d = Math.hypot(x - C.x, y - C.y); for (const r of rings) if (d >= r.r0 && d < r.r1) return r.i; return -1; };
      const hush = { on: false, x: C.x, y: C.y };
      const paint = (g, cx, cy, T) => { const lw = lw0(T);
        g.beginPath(); g.arc(cx, cy, 13.9 * T, 0, TAU); const mg = g.createRadialGradient(cx - T * 3, cy - T * 3, T, cx, cy, 14 * T); mg.addColorStop(0, 'rgba(242,232,207,.22)'); mg.addColorStop(1, 'rgba(166,149,122,.1)'); g.fillStyle = mg; g.fill();
        for (const r of rings) { if (r.r0 > 0) { g.beginPath(); g.arc(cx, cy, r.r0 * T, 0, TAU); g.strokeStyle = 'rgba(29,14,26,.6)'; g.lineWidth = T * 0.34; g.stroke(); g.strokeStyle = GOLD; g.lineWidth = T * 0.14; g.stroke(); g.strokeStyle = rgba(GOLD_HI, 0.7); g.lineWidth = T * 0.04; g.stroke(); }
          for (let k = 0; k < 24; k++) { if (r.r0 <= 0) break; const a = k / 24 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * r.r0 * T, cy + Math.sin(a) * r.r0 * T, T * 0.09, 0, TAU); g.fillStyle = GOLD_HI; g.fill(); } }
        g.beginPath(); g.arc(cx, cy, 13.6 * T, 0, TAU); g.strokeStyle = MAROON_D; g.lineWidth = T * 0.5; g.stroke(); g.strokeStyle = MAROON_HI; g.lineWidth = T * 0.3; g.stroke();
        for (let k = 0; k < 36; k++) { const a = k / 36 * TAU; g.beginPath(); g.arc(cx + Math.cos(a) * 13.6 * T, cy + Math.sin(a) * 13.6 * T, T * 0.12, 0, TAU); g.fillStyle = GOLD; g.fill(); }
        // the tension cords running out from the centre plate, and the embossed centre
        g.strokeStyle = 'rgba(107,85,48,.25)'; g.lineWidth = T * 0.05; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + 0.13; g.beginPath(); g.moveTo(cx + Math.cos(a) * 1.4 * T, cy + Math.sin(a) * 1.4 * T); g.lineTo(cx + Math.cos(a) * 13.3 * T, cy + Math.sin(a) * 13.3 * T); g.stroke(); }
        emboss(g, cx, cy, T * 2.2, 5, Math.max(2, T * 0.12), 'rgba(80,40,40,.45)', 'rgba(255,248,230,.5)'); };
      const mod = { C, rings, ringOf, hush, A,
        drawGround(c) { const T = X.Tz(), R = 14, hb = heart(X).k; const cv = cachedLayer(hold, 'cv', c, X, R, paint); c.drawImage(cv, X.sx(C.x) - (R + 1) * T, X.sy(C.y) - (R + 1) * T, (R * 2 + 2) * T, (R * 2 + 2) * T);
          for (const r of rings) { r.struck = Math.max(0, r.struck - 0.03); const k = Math.max(r.lit, r.struck); const ann = s => { c.beginPath(); c.arc(X.sx(C.x), X.sy(C.y), r.r1 * T, 0, TAU); if (r.r0 > 0) { c.moveTo(X.sx(C.x) + r.r0 * T, X.sy(C.y)); c.arc(X.sx(C.x), X.sy(C.y), r.r0 * T, 0, TAU, true); } };
            if (k > 0.01) { c.save(); ann(); c.fillStyle = rgba(r.struck > r.lit ? '#FFFFFF' : CORAL, 0.28 * k); c.fill('evenodd'); c.restore(); }
            if (r.warn > 0.01) { c.save(); c.beginPath(); c.arc(X.sx(C.x), X.sy(C.y), r.r1 * T - 2, 0, TAU); c.strokeStyle = rgba(WARN, 0.8 * r.warn); c.lineWidth = 3; c.stroke(); c.restore(); }
            if (r.r0 > 0) ringInlay(c, X, C.x, C.y, r.r0, r.r0, hb);
            for (const a of [-Math.PI / 2, Math.PI / 2]) { const rm = (r.r0 + r.r1) / 2; numberAt(c, X, C.x + Math.cos(a) * rm, C.y + Math.sin(a) * rm, r.n, k); } }
          if (hush.on) { const Xs = X.sx(hush.x), Ys = X.sy(hush.y); badge(c, Xs, Ys - T * 1.4, T * 1.2, '', null, BONE_HI); hushIcon(c, Xs, Ys - T * 1.4, T * 0.8, BONE_HI, Math.max(2, T * 0.09)); } } };
      return mod; },
    /* Veyra's pipe bridge: the platform over darkness, three horn mouths on its far edge, three wedges, a low arch */
    veyra(X, self, H) { const C = centreOf(X), A = arena.veyra, x0 = C.x - VW / 2 + 0.5, y0 = C.y - VH / 2 + 0.5, x1 = x0 + VW - 1, y1 = y0 + VH - 1;
      const horns = [-10.6, 0, 10.6].map((dx, i) => ({ i, x: C.x + 0.5 + dx, y: y0 - 0.4, a: Math.PI / 2, lane: { x0: C.x + 0.5 + dx - 5.3, x1: C.x + 0.5 + dx + 5.3 }, sym: [0, 3, 4][i], lit: 0, warn: 0 }));
      const inLane = (x, y, i) => { const h = horns[i]; return x >= h.lane.x0 && x < h.lane.x1 && y >= y0 - 0.5 && y <= y1 + 0.5; };
      const wedges = A.wedges(C).map((w, i) => { const tiles = [[w.x, w.y], [w.x - 1, w.y + 1], [w.x, w.y + 1], [w.x + 1, w.y + 1]]; if (X.M.FC) for (const [tx, ty] of tiles) blankTile(X, tx, ty);
        const W = { i, x: w.x + 0.5, y: w.y + 1, w: 3, tiles, shelter: (px, py) => Math.abs(px - (w.x + 0.5)) < 1.45 && py > w.y + 2 && py < w.y + 2 + 7 };
        W.obj = H.obj({ x: W.x, y: w.y + 2, kind: 'wedge', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { wedgeArt(c, Xs, Ys - T * 0.1, T); } }); return W; });
      const sheltered = (x, y, i) => wedges[i] ? wedges[i].shelter(x, y) : false;
      const ar = A.arch(C), arch = { x: ar.x + 0.5, y: ar.y + 0.5, w: ar.w, h: 3.4, hang: { x: ar.x + 0.5, y: ar.y + 0.6 } };
      if (X.M.FC) { blankTile(X, Math.floor(ar.x - ar.w / 2), Math.floor(ar.y)); blankTile(X, Math.floor(ar.x + ar.w / 2), Math.floor(ar.y)); }
      H.obj({ x: arch.x, y: arch.y + 0.5, kind: 'arch', r: 0.1, h: 4, label: '', draw(c, Xs, Ys, T) { archArt(c, Xs, Ys, T, arch.w); } });
      for (const h of horns) h.obj = H.obj({ x: h.x, y: h.y + 0.2, kind: 'hornmouth', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { hornMouthArt(c, X, Xs, Ys, T, h); } });
      if (X.M.FC) safeRetile(X);
      const platform = { x0: x0 - 0.5, y0: y0 - 0.5, x1: x1 + 0.5, y1: y1 + 0.5 };
      return { C, horns, inLane, wedges, sheltered, arch, platform,
        drawGround(c) { const T = X.Tz(), hb = heart(X).k;
          // the lanes' guide lines along the platform, faint gold seams; lit lanes a coral wash; warning lanes red
          for (const h of horns) { const L = X.sx(h.lane.x0), R = X.sx(h.lane.x1), Tp = X.sy(platform.y0), B = X.sy(platform.y1);
            if (h.lit > 0.01) { c.fillStyle = rgba(CORAL, 0.18 * h.lit); c.fillRect(L, Tp, R - L, B - Tp); }
            if (h.warn > 0.01) { c.strokeStyle = rgba(WARN, 0.75 * h.warn); c.lineWidth = 3; c.strokeRect(L + 2, Tp + 2, R - L - 4, B - Tp - 4); } }
          c.save(); c.strokeStyle = rgba(GOLD, 0.45 + 0.2 * hb); c.lineWidth = Math.max(1.5, T * 0.06); c.setLineDash([T * 0.5, T * 0.3]); for (const xx of [horns[0].lane.x1, horns[1].lane.x1]) { c.beginPath(); c.moveTo(X.sx(xx), X.sy(platform.y0)); c.lineTo(X.sx(xx), X.sy(platform.y1)); c.stroke(); } c.restore();
          c.save(); c.strokeStyle = rgba(GOLD_D, 0.9); c.lineWidth = Math.max(2, T * 0.12); c.strokeRect(X.sx(platform.x0), X.sy(platform.y0), (platform.x1 - platform.x0) * T, (platform.y1 - platform.y0) * T); c.restore();
          for (const w of wedges) { c.save(); c.fillStyle = 'rgba(20,8,16,.22)'; c.fillRect(X.sx(w.x - 1.45), X.sy(w.y + 1), 2.9 * T, 7 * T); c.restore(); } } }; },
    /* the Heart's bowl: four quadrants with embossed symbols, rings that brighten with the heartbeat, four inward horns, four pads */
    heart(X, self, H) { const C = centreOf(X), R = 18, hold = {};
      const quads = [0, 1, 2, 3].map(i => { const a0 = -Math.PI / 2 + i * Math.PI / 2, a1 = a0 + Math.PI / 2, am = a0 + Math.PI / 4; return { i, a0, a1, sym: [0, 1, 2, 4][i], x: C.x + Math.cos(am) * 10.5, y: C.y + Math.sin(am) * 10.5, lit: 0, warn: 0, struck: 0, obscured: false }; });
      const quadOf = (x, y) => { let a = Math.atan2(y - C.y, x - C.x) + Math.PI / 2; while (a < 0) a += TAU; while (a >= TAU) a -= TAU; return Math.min(3, Math.floor(a / (Math.PI / 2))); };
      const horns = quads.map(q => { const am = q.a0 + Math.PI / 4; return { i: q.i, x: C.x + Math.cos(am) * (R + 1.6), y: C.y + Math.sin(am) * (R + 1.6), a: am + Math.PI, obscured: false, k: 0.4 }; });
      for (const h of horns) h.obj = H.obj({ x: h.x, y: h.y + (Math.sin(h.a + Math.PI) > 0 ? 0.4 : 0), kind: 'greathorn', r: 0.1, h: 5, label: '', draw(c, Xs, Ys, T) { greatHornArt(c, X, Xs, Ys, T, h); } });
      const pads = quads.map(q => pad(X, { x: q.x, y: q.y, r: 1.35, sym: q.sym, need: 4.5, latch: 2, active: false, shelter: true, shelterR: 2.9, quad: q.i }));
      const rings = [4.5, 9, 13.5, 17.6];
      const paint = (g, cx, cy, T) => { g.beginPath(); g.arc(cx, cy, R * T, 0, TAU); g.fillStyle = 'rgba(52,28,47,.18)'; g.fill();
        for (const q of quads) { g.save(); g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, (R - 0.3) * T, q.a0, q.a1); g.closePath(); g.fillStyle = q.i % 2 ? 'rgba(165,138,78,.06)' : 'rgba(217,201,165,.05)'; g.fill(); g.restore();
          emboss(g, cx + (q.x - C.x) * T, cy + (q.y - C.y) * T - T * 2.6, T * 2.6, q.sym, Math.max(2, T * 0.14), 'rgba(0,0,0,.5)', 'rgba(212,185,120,.55)'); }
        g.strokeStyle = MAROON_D; g.lineWidth = T * 0.3; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 - Math.PI / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 2 * T, cy + Math.sin(a) * 2 * T); g.lineTo(cx + Math.cos(a) * (R - 0.3) * T, cy + Math.sin(a) * (R - 0.3) * T); g.stroke(); }
        g.strokeStyle = GOLD_D; g.lineWidth = T * 0.1; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 - Math.PI / 2; g.beginPath(); g.moveTo(cx + Math.cos(a) * 2 * T, cy + Math.sin(a) * 2 * T); g.lineTo(cx + Math.cos(a) * (R - 0.3) * T, cy + Math.sin(a) * (R - 0.3) * T); g.stroke(); }
        g.beginPath(); g.arc(cx, cy, (R - 0.15) * T, 0, TAU); g.strokeStyle = GOLD_D; g.lineWidth = T * 0.4; g.stroke(); g.strokeStyle = GOLD; g.lineWidth = T * 0.16; g.stroke(); };
      return { C, quads, quadOf, horns, pads, rings,
        drawGround(c) { const T = X.Tz(), hb = heart(X).k, cv = cachedLayer(hold, 'cv', c, X, R, paint); c.drawImage(cv, X.sx(C.x) - (R + 1) * T, X.sy(C.y) - (R + 1) * T, (R * 2 + 2) * T, (R * 2 + 2) * T);
          for (const q of quads) { q.struck = Math.max(0, q.struck - 0.03); const k = Math.max(q.lit, q.struck); if (k > 0.01 || q.warn > 0.01) { c.save(); c.beginPath(); c.moveTo(X.sx(C.x), X.sy(C.y)); c.arc(X.sx(C.x), X.sy(C.y), (R - 0.3) * T, q.a0, q.a1); c.closePath(); if (k > 0.01) { c.fillStyle = rgba(q.struck > q.lit ? '#FFFFFF' : CORAL, 0.25 * k); c.fill(); } if (q.warn > 0.01) { c.strokeStyle = rgba(WARN, 0.8 * q.warn); c.lineWidth = 3; c.stroke(); } c.restore(); } }
          for (const r of rings) ringInlay(c, X, C.x, C.y, r, r, hb); } }; },
  };
  /* the arena pieces' art */
  /* a shelter wedge seen from the south: a low maroon prism pointing north (its top a triangle with a bone ridge, its
     front face a gold-banded block); Ys is its south foot, the tip two tiles north */
  function wedgeArt(c, Xs, Ys, T) { const lw = lw0(T), h = T * 0.9, W = T * 1.5, tipY = Ys - T * 2.05; c.save(); c.fillStyle = 'rgba(12,4,10,.4)'; ell(c, Xs + T * 0.2, Ys + T * 0.1, T * 1.8, T * 0.42); c.fill();
    poly(c, [[Xs - W, Ys - h], [Xs + W, Ys - h], [Xs, tipY - h]]); c.closePath(); const g = c.createLinearGradient(Xs - W, tipY, Xs + W, Ys); g.addColorStop(0, MAROON_HI); g.addColorStop(1, shadeC(MAROON_HI, -0.25)); c.fillStyle = g; c.fill(); ink(c, lw);
    poly(c, [[Xs, Ys - h], [Xs + W, Ys - h], [Xs, tipY - h]]); c.closePath(); c.fillStyle = 'rgba(20,8,16,.28)'; c.fill();
    c.strokeStyle = LN; c.lineWidth = T * 0.16 + lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(Xs, Ys - h); c.lineTo(Xs, tipY - h + T * 0.1); c.stroke(); c.strokeStyle = BONE; c.lineWidth = T * 0.16; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = T * 0.04; c.beginPath(); c.moveTo(Xs - T * 0.04, Ys - h - T * 0.05); c.lineTo(Xs - T * 0.04, tipY - h + T * 0.2); c.stroke();
    c.beginPath(); c.rect(Xs - W, Ys - h, W * 2, h); c.fillStyle = cylG(c, Xs - W, Xs + W, MAROON_HI, MAROON_D); c.fill(); ink(c, lw);
    c.fillStyle = GOLD; c.fillRect(Xs - W, Ys - h * 0.62, W * 2, T * 0.11); c.fillStyle = rgba(GOLD_HI, 0.8); c.fillRect(Xs - W, Ys - h * 0.62, W * 2, T * 0.03);
    for (const u of [-0.66, 0, 0.66]) { c.beginPath(); c.arc(Xs + u * W, Ys - h * 0.25, T * 0.07, 0, TAU); c.fillStyle = GOLD_HI; c.fill(); }
    c.restore(); }
  function archArt(c, Xs, Ys, T, w) { const lw = lw0(T), R0 = w / 2 * T, H0 = T * 3.4, pts = []; for (let i = 0; i <= 20; i++) { const a = Math.PI - i / 20 * Math.PI; pts.push([Xs + Math.cos(a) * R0, Ys - T * 0.3 - Math.sin(a) * H0]); }
    for (const sd of [-1, 1]) socket(c, Xs + sd * R0, Ys, T * 0.6, T, lw); tube(c, pts, T * 0.72, BONE_D, lw, { bands: 4, bands0: 2 });
    c.save(); c.strokeStyle = rgba(GOLD_HI, 0.7); c.lineWidth = Math.max(1, lw * 0.6); for (let i = 3; i < 18; i += 3) { const p = pts[i]; c.beginPath(); c.moveTo(p[0], p[1] + T * 0.38); c.lineTo(p[0], p[1] + T * 0.62); c.stroke(); } c.restore(); }
  function hornMouthArt(c, X, Xs, Ys, T, h) { const lw = lw0(T) * 1.2, s = T * 3.6, k = clamp(0.25 + 0.5 * breath(X, h.x, h.y) * 0.5 + h.lit * 0.75, 0, 1);
    c.save(); c.fillStyle = 'rgba(12,4,10,.4)'; ell(c, Xs, Ys + T * 0.1, T * 2.6, T * 0.6); c.fill();
    // the horn's body comes from behind the platform's edge and opens toward you
    const L = [[Xs - s * 0.18, Ys - s * 1.25], [Xs - s * 0.46, Ys - s * 0.65], [Xs - s * 0.7, Ys - s * 0.15]], R = [[Xs + s * 0.18, Ys - s * 1.25], [Xs + s * 0.46, Ys - s * 0.65], [Xs + s * 0.7, Ys - s * 0.15]];
    c.beginPath(); c.moveTo(Xs - s * 0.14, Ys - s * 1.6); c.bezierCurveTo(L[0][0], L[0][1], L[1][0], L[1][1], L[2][0], L[2][1]); c.lineTo(R[2][0], R[2][1]); c.bezierCurveTo(R[1][0], R[1][1], R[0][0], R[0][1], Xs + s * 0.14, Ys - s * 1.6); c.closePath();
    c.fillStyle = cylG(c, Xs - s * 0.7, Xs + s * 0.7, BONE, BONE_D); c.fill(); ink(c, lw);
    c.strokeStyle = 'rgba(90,60,40,.3)'; c.lineWidth = Math.max(1, lw * 0.6); for (let i = 1; i < 6; i++) { const u = i / 6, ww = s * (0.14 + u * 0.56), yy = Ys - s * 1.6 + u * s * 1.45; c.beginPath(); c.moveTo(Xs - ww, yy); c.quadraticCurveTo(Xs, yy + s * 0.06, Xs + ww, yy); c.stroke(); }
    c.fillStyle = GOLD; c.fillRect(Xs - s * 0.32, Ys - s * 1.05, s * 0.64, s * 0.05);
    mouth(c, Xs, Ys - s * 0.15, s * 0.62, s * 0.3, 0, k, { lw });
    if (h.warn > 0.01) { c.strokeStyle = rgba(WARN, 0.85 * h.warn); c.lineWidth = 3; ell(c, Xs, Ys - s * 0.15, s * 0.74, s * 0.38); c.stroke(); }
    if (!lowFx() || h.lit > 0) glow(c, Xs, Ys - s * 0.15, s * 0.9, CORAL_HI, 0.25 * k + 0.4 * h.lit);
    // its symbol on a gold plaque over the bell
    c.beginPath(); c.arc(Xs, Ys - s * 0.62, T * 0.48, 0, TAU); c.fillStyle = MAROON_D; c.fill(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke(); symbol(c, Xs, Ys - s * 0.62, T * 0.62, h.sym, h.lit > 0.3 ? '#FFF2D6' : GOLD_HI, Math.max(1.5, T * 0.07));
    c.restore(); }
  function greatHornArt(c, X, Xs, Ys, T, h) { const front = Math.sin(h.a + Math.PI) > 0, s = T * (front ? 3.2 : 5.2), dir = Math.cos(h.a) >= 0 ? 1 : -1, k = h.obscured ? 0.05 : clamp(0.3 + 0.5 * heart(X).k + (h.k || 0) * 0.3, 0, 1);
    horn(c, Xs - dir * s * 0.2, Ys, s, { dir, k, lw: lw0(T) * 1.2, bands: [3, 9, 15] });
    if (h.obscured) { const tip = hornTip(s / T, dir); c.save(); c.globalAlpha = 0.85; ell(c, Xs - dir * s * 0.2 + tip[0] * T, Ys + tip[1] * T, s * 0.22, s * 0.3); c.fillStyle = 'rgba(14,6,12,.7)'; c.fill(); hushIcon(c, Xs - dir * s * 0.2 + tip[0] * T, Ys + tip[1] * T, s * 0.22, CORAL_HI); c.restore(); } }
  Object.assign(CHO, { wedgeArt, archArt, hornMouthArt, greatHornArt, MOUTHS });

  /* ======================= the rift ======================= */
  const SEALING = { fall: 'THE HEART FALLS SILENT', sub: 'Every pipe holds its breath; then one gentle chord, and the heart is a motionless dark seed', sigil: 'THE RHYTHM SIGIL', name: 'The Choir Before Creation', color: CORAL_HI,
    onFall() { const C = CUR; if (!C) return; C.silentT = 2.2; C.beats.length = 0; const X = C.X; X.after(2.0, () => { if (X.sfx.chime) { X.sfx.chime(392, 0.9); X.after(0.05, () => X.sfx.chime(494, 0.7)); X.after(0.1, () => X.sfx.chime(587, 0.7)); } }); } };
  const ST = (typeof CHO_STAGES !== 'undefined' && CHO_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  const Rf = defRift({
    ease: 0.55, monEase: 0.35, miniDmg: 0.7,   // (Rift 9's tuning as it now stands: monsters and minis lighter, bosses as built)
    liveCap: 60, monCount: 0.65,   // (at most sixty on the field; fight floors 35% thinner)
    typeShare: { pipeeel: 0.18 },   // (the eels' three-note volleys stack up from range: held to about a sixth of a floor, three to a pack)
    id: 'choir', n: 11, name: 'The Choir Before Creation', lvl: 95, sigil: 'Rhythm', biome: 'scorehall', aff: ['wind', 'dark'], region: 'the primordial heights',
    blurb: 'A mountain\'s interior become a hollow instrument, older than the world. Read the silent score, route its breath, hold its note, and quiet the heart that hears.', gate: { anima: 'leo', name: 'The Crown Chase' },
    mons: ['bellmite', 'pipeeel', 'hushmoth'], sealing: SEALING,
    stages: riftSections([
      { biome: 'scorehall', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Horned Threshold'], minis: ['cadencepet'], miniHp: 0.294, mobs: ['bellmite', 'pipeeel', 'bellmite', 'hushmoth', 'bellmite', 'pipeeel', 'bellmite', 'bellmite', 'pipeeel', 'bellmite'], trials: [ST.SCORE || placeholder('The Silent Score', 'Play the score on the drum pads')], boss: 'tammor', bossName: 'Tammor the Living Drum', bossRoom: 'The Drum Chamber' },
      { biome: 'breathworks', pattern: ['fight', 'trial', 'boss'], mods: ['random'], fights: ['The Pipe Gallery'], minis: ['bellowspet'], miniHp: 0.294, mobs: ['pipeeel', 'bellmite', 'hushmoth', 'bellmite', 'pipeeel', 'bellmite', 'bellmite', 'hushmoth', 'bellmite', 'pipeeel'], trials: [ST.BREATHWORKS || placeholder('The Breathworks', 'Make the three horns breathe together')], boss: 'veyra', bossName: 'Veyra the Throat of Night', bossRoom: 'The Pipe Bridge' },
      { biome: 'resonance', pattern: ['fight', 'trial', 'boss'], mods: ['curse'], fights: ['The Hollow Ascent'], minis: ['hushpet'], miniHp: 0.294, mobs: ['hushmoth', 'bellmite', 'pipeeel', 'bellmite', 'bellmite', 'pipeeel', 'hushmoth', 'bellmite', 'pipeeel', 'bellmite', 'bellmite'], trials: [ST.HELDNOTE || placeholder('The Held Note', 'Hold the charge pad for thirty seconds')], boss: 'heart', bossName: 'The Heart That Hears', bossRoom: 'The Resonating Bowl' },
    ]),
  });
  for (const S of Rf.stages) if (S.kind === 'boss' && bossMake[S.boss]) S.make = bossMake[S.boss];
  /* every stage: the pads and beats run and draw here; the heartbeat; the pipes' mouths breathe; the plates' gold rings */
  Rf.everyStage = (X, self, H) => { const C = ctx(X); C.X = X; CUR = C; const motes = [];
    // the stage's breathing pipe mouths (props don't change once the floor is made)
    const mouths = []; for (const p of X.props || []) { const f = MOUTHS[p.kind]; if (f) for (const [dx, dy, r] of f(p.v | 0)) mouths.push({ p, dx, dy, r }); }
    const plates = (X.M.rooms || []).filter(r => !r.arena && (r.shape === 'oval' || r.shape === 'ring' || r.shape === 'islands') && !X.M.FC);
    return { CHO, C, H, mouths,
      update(dt) { CUR = C; C.t += dt; C.silentT = Math.max(0, C.silentT - dt);
        const hk = heartK(C.t); if (hk.ph < C.hb.ph) C.hb.n++; C.hb.ph = hk.ph; C.hb.k = C.silentT > 0 ? 0 : lowFx() ? 0.35 : hk.k;
        for (const p of C.pads) padTick(C, p, dt); beatTick(C, dt);
        if (!lowFx() && motes.length < 10 && Math.random() < 0.2) motes.push({ x: Math.random(), y: 1.05, v: 0.012 + Math.random() * 0.02, s: 1 + Math.random() * 1.3, ph: Math.random() * 6 }); for (const q of motes) q.y -= q.v * dt; for (let i = motes.length - 1; i >= 0; i--) if (motes[i].y < -0.05) motes.splice(i, 1); },
      drawGround(c) { const T = X.Tz(), hb = C.hb.k, W = X.W(), Hh = X.H();
        for (const r of plates) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, rx = r.w / 2 * 1.04, ry = r.h / 2 * 1.04, Xs = X.sx(cx), Ys = X.sy(cy); if (Xs + rx * T < 0 || Xs - rx * T > W || Ys + ry * T < 0 || Ys - ry * T > Hh) continue;
          for (const f of [0.38, 0.72]) ringInlay(c, X, cx, cy, rx * f, ry * f, hb * (f > 0.5 ? 0.7 : 1)); }
        for (const p of C.pads) padArt(c, X, p);
        // a hush moth's tether to the pad it silences: the priority target, plainly marked
        for (const p of C.pads) { const m = p.silencer; if (!m || !silenced(p)) continue; c.save(); c.setLineDash([T * 0.15, T * 0.12]); c.strokeStyle = rgba(CORAL_HI, 0.8); c.lineWidth = 2; c.beginPath(); c.moveTo(X.sx(p.x), X.sy(p.y)); c.lineTo(X.sx(m.x), X.sy(m.y) - T * 0.6); c.stroke(); c.restore(); }
        beatsDraw(c, C); },
      drawOver(c) { const T = X.Tz(), W = X.W(), Hh = X.H(), t = X.g.t;
        // the breathing mouths: a soft unoutlined glow over each pipe's opening (cheap: one blit each, on screen only)
        for (const q of mouths) { const p = q.p; if (p.broken) continue; const Xs = X.sx(p.x) + q.dx * T, Ys = X.sy(p.y) + q.dy * T; if (Xs < -T * 2 || Xs > W + T * 2 || Ys < -T * 2 || Ys > Hh + T * 2) continue; const k = breath(X, p.x, p.y); if (k > 0.02) glow(c, Xs, Ys, q.r * T * (1.1 + 0.35 * k), CORAL_HI, 0.12 + 0.32 * k); }
        if (motes.length) { c.save(); for (const q of motes) { c.globalAlpha = 0.18 + 0.14 * Math.sin(t * 2 + q.ph); c.fillStyle = CORAL_HI; c.beginPath(); c.arc(q.x * W + Math.sin(t * 0.5 + q.ph) * 10, q.y * Hh, q.s, 0, TAU); c.fill(); } c.restore(); } } }; };
  Object.assign(CHO, { SEALING, placeholder, dressRim, plankBridge, ribWall, heartK, bossMake });
})();
