/* ---------- Rift 07: The Library of Unwritten Lives ----------
   An endless library has folded into a ruined university and come loose into the dark of a dream: islands of warm
   parchment floor adrift in ink, giant shelves standing at their rims, closed books as long as bridges laid across the
   drops, ladders climbing into nothing, and a black moon hanging in the void. A whispering mind writes in the margins.
   Three lands:
   I   The Catalogue of Truth: warm parchment halls, burgundy shelves, gold trim.
   II  The Unfinished Fable: the binding workshop, ink-stained floors, presses and spilled ink.
   III The False Procession: pale gilded archive steps, the light going cold and violet towards the end.
   Monsters: margin worms (curled parchment strips: one unrolls straight along a shown line, then snaps forward),
   ink stalkers (four-legged ink blots: one flattens, then dashes, leaving a strip of ink that slows), false folios
   (floating closed books that glint like loot until you come near; then they open and throw page darts).
   Every dungeon here has teetering shelves: hit one and it topples AWAY from you, crushing every monster in its
   fall line (shown when you come close). Lure them in first.
   Stages: I  The Catalogue of Truth (trial) · The Reading Galleries (dungeon) · Syllax the Bookwyrm
           II The Unfinished Fable (trial) · The Ink Presses (dungeon) · Vellum the Inkbound
           III The False Procession (trial, an escort) · The Last Stacks (dungeon) · Nhalex the Unwritten Mind */
const LIB = { INK: '#1D1A28', PARCH: '#E4D3AF', PARCH_D: '#C9B48A', PARCH_HI: '#F4EAD2', BURG: '#6B324F', BURG_HI: '#9A4A72', GOLD: '#CFAD62', GOLD_HI: '#F2DC9A', VIOLET: '#8A5BD0', VIOLET_HI: '#CDB4FF', LEATHER: '#4A2236', WOOD: '#5A3A2E', WOOD_D: '#3A2420' };
(() => {
  const TAU = Math.PI * 2, { INK, PARCH, PARCH_D, PARCH_HI, BURG, BURG_HI, GOLD, GOLD_HI, VIOLET, VIOLET_HI, LEATHER, WOOD, WOOD_D } = LIB;
  const { PROPS } = DunWorld, { LN, shade, stroke, lwOf, MP, EXT, NF } = DunArt;
  const lw0 = T => Math.max(1.3, Math.min(3, T * 0.06));
  const hh = (x, y, s) => { let n = (x * 374761393 + y * 668265263 + s * 982451653) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967296; };
  const rnd = s => { let x = (s * 2654435761) >>> 0 || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, rx, ry, a || 0, 0, TAU); };
  const ink = (c, lw) => { c.strokeStyle = LN; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(); };
  const shadowEll = (c, T, w, a) => { c.fillStyle = `rgba(20,10,20,${a || 0.3})`; ell(c, 0, T * 0.03, T * w, T * w * 0.32); c.fill(); };
  const glowIn = (c, x, y, r, col, a) => { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = Math.max(0, Math.min(1, a)); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  const BOOKCOL = [BURG, '#2F3A5A', '#3E5A44', '#7A5A2A', '#5A2A3A', '#4A3A6A', '#8A3A3A', '#2A4A4A'];
  /* each land of the rift dresses the same furniture in its own materials: warm wood and gold (the Catalogue), white
     lacquer and silver (the Bindery), platinum and gold (the Ascent) */
  const THEMES = {
    lib: { wood: WOOD, woodD: WOOD_D, woodHi: '#7A5446', woodLo: '#2E1C18', back: '#24161A', trim: GOLD, trimHi: GOLD_HI, band: 'rgba(242,220,154,.75)', rung: '#A0745A', railA: '#8A5E44', railB: '#5A3A2E', books: BOOKCOL },
    silver: { wood: '#DCE1EA', woodD: '#9AA4B6', woodHi: '#FFFFFF', woodLo: '#7C8698', back: '#4A5266', trim: '#C9D2E2', trimHi: '#FFFFFF', band: 'rgba(235,240,250,.85)', rung: '#E6EAF2', railA: '#F2F4F8', railB: '#A9B2C2', books: ['#3C4A6A', '#E8ECF4', '#8FA0C0', '#5A5E7A', '#B7C3DA', '#2E3550', '#D7C8E8', '#6A7FA8'] },
    holy: { wood: '#F6F1E4', woodD: '#D6CBAE', woodHi: '#FFFFFF', woodLo: '#B9AD8E', back: '#E9E0C8', trim: '#E2B64A', trimHi: '#FFF1B8', band: 'rgba(255,236,170,.9)', rung: '#F2E6C2', railA: '#FFFFFF', railB: '#E2B64A', books: ['#FFFFFF', '#F2DC9A', '#CFE3FF', '#E8D8FF', '#FFE9C8', '#BFD8F0', '#F7F2E6', '#E6C46A'] },
  };
  let TH = THEMES.lib;
  const themeOf = B => (B && B.libTheme && THEMES[B.libTheme]) || THEMES.lib;

  /* ---- a block of books: one broad slab standing for a run of volumes; faint spines, gold bands ---- */
  function bookBlock(c, x, y, w, h, col, lw, R, lean) {
    c.save(); c.translate(x, y); if (lean) { c.translate(0, 0); c.rotate(lean); }
    c.beginPath(); c.rect(0, -h, w, h); const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, shadeC(col, 0.22)); g.addColorStop(0.5, col); g.addColorStop(1, shadeC(col, -0.3)); c.fillStyle = g; c.fill(); ink(c, lw * 0.8);
    // the spines inside the block: a few faint divisions, two gold bands across them
    c.strokeStyle = 'rgba(0,0,0,.28)'; c.lineWidth = Math.max(1, lw * 0.5); const n = Math.max(2, Math.round(w / (h * 0.28))); c.beginPath(); for (let i = 1; i < n; i++) { const u = i / n + (R() - 0.5) * 0.04; c.moveTo(w * u, -h + 1); c.lineTo(w * u, -1); } c.stroke();
    c.fillStyle = TH.band; for (const v of [0.18, 0.78]) c.fillRect(1, -h * v - Math.max(1, h * 0.03), w - 2, Math.max(1, h * 0.05));
    c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(1, -h + 1, Math.max(1, w * 0.12), h - 2);
    c.restore();
  }
  // a shelf's worth of blocks between x0 and x1 standing on y
  function shelfRow(c, x0, x1, y, hMax, lw, R) {
    let x = x0 + (x1 - x0) * 0.02;
    while (x < x1 - (x1 - x0) * 0.08) { const w = Math.min(x1 - x, (x1 - x0) * (0.22 + R() * 0.3)), h = hMax * (0.7 + R() * 0.28), col = TH.books[Math.floor(R() * TH.books.length)];
      if (R() < 0.15 && x1 - x > hMax * 0.5) { // one block lying down
        bookBlock(c, x, y, Math.min(x1 - x, hMax * 0.9), hMax * 0.28, col, lw, R); x += Math.min(x1 - x, hMax * 0.9) + 1; continue; }
      bookBlock(c, x, y, w, h, col, lw, R); x += w + 1; }
  }

  /* ---- props ---- */
  window.PROP_EXT = window.PROP_EXT || {};
  Object.assign(PROP_EXT, { bookcase: [3.0, 4.9], libladder: [2.2, 4.6], lectern: [2.4, 2.6], bookstack: [2.6, 2.6], candelabra: [1.8, 3.2], inkwell: [2.4, 3.6], orrery: [2.2, 2.8] });
  Object.assign(PROPS, {
    /* a giant bookcase: a dark frame with a gilded crown, four shelves of broad book blocks */
    bookcase(c, T, v, B) { TH = themeOf(B); const lw = lw0(T), R = rnd(13 + v * 77), w = T * 1.0, H = T * (3.5 + (v % 2) * 0.3);
      shadowEll(c, T, 1.25, 0.34);
      // the frame: lit left post, shaded right post, back panel
      c.beginPath(); c.rect(-w, -H, w * 2, H); c.fillStyle = TH.woodD; c.fill(); ink(c, lw);
      c.fillStyle = TH.back; c.fillRect(-w * 0.86, -H + T * 0.3, w * 1.72, H - T * 0.45);
      const rows = 4, top = -H + T * 0.32, bot = -T * 0.18, rh = (bot - top) / rows;
      for (let i = 0; i < rows; i++) { const y = top + rh * (i + 1); shelfRow(c, -w * 0.84, w * 0.84, y - T * 0.04, rh * 0.86, lw, R);
        c.fillStyle = TH.wood; c.fillRect(-w * 0.9, y - T * 0.06, w * 1.8, T * 0.12); c.strokeStyle = LN; c.lineWidth = lw * 0.7; c.strokeRect(-w * 0.9, y - T * 0.06, w * 1.8, T * 0.12); c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-w * 0.9, y - T * 0.06, w * 1.8, Math.max(1, T * 0.025)); }
      for (const sd of [-1, 1]) { c.beginPath(); c.rect(sd < 0 ? -w : w * 0.82, -H, w * 0.18, H); const g = c.createLinearGradient(sd * w, 0, sd * w * 0.82, 0); g.addColorStop(0, sd < 0 ? TH.woodHi : TH.woodLo); g.addColorStop(1, TH.wood); c.fillStyle = g; c.fill(); ink(c, lw); }
      // the crown: a gilded pediment
      c.beginPath(); c.moveTo(-w * 1.12, -H + T * 0.05); c.lineTo(-w * 1.12, -H - T * 0.12); c.quadraticCurveTo(0, -H - T * 0.55, w * 1.12, -H - T * 0.12); c.lineTo(w * 1.12, -H + T * 0.05); c.closePath(); c.fillStyle = shade(c, TH.wood, T, -T * 0.4, -H, 0.35); c.fill(); ink(c, lw);
      c.strokeStyle = TH.trim; c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.moveTo(-w * 1.0, -H - T * 0.06); c.quadraticCurveTo(0, -H - T * 0.42, w * 1.0, -H - T * 0.06); c.stroke();
      c.fillStyle = TH.trimHi; c.beginPath(); c.arc(0, -H - T * 0.22, T * 0.09, 0, TAU); c.fill(); ink(c, lw * 0.6);
    },
    /* a rolling library ladder climbing into empty air: its top rungs fade into the dark */
    libladder(c, T, v, B) { TH = themeOf(B); const lw = lw0(T), H = T * 3.9, lean = (v % 2 ? 1 : -1) * T * 0.45;
      shadowEll(c, T, 0.55, 0.28);
      const cv = document.createElement('canvas'); cv.width = Math.ceil(T * 2.2); cv.height = Math.ceil(H + T * 0.4); const q = cv.getContext('2d'); q.translate(cv.width / 2, H + T * 0.2);
      for (const sd of [-1, 1]) { q.beginPath(); q.moveTo(sd * T * 0.32, 0); q.lineTo(sd * T * 0.24 + lean, -H); q.lineWidth = T * 0.11 + lw * 2; q.strokeStyle = LN; q.lineCap = 'round'; q.stroke(); q.lineWidth = T * 0.11; q.strokeStyle = sd < 0 ? TH.railA : TH.railB; q.stroke(); }
      for (let i = 1; i < 12; i++) { const u = i / 12, y = -H * u, x = lean * u; q.beginPath(); q.moveTo(-T * 0.32 + T * 0.08 * u + x, y); q.lineTo(T * 0.32 - T * 0.08 * u + x, y); q.lineWidth = T * 0.06 + lw * 1.6; q.strokeStyle = LN; q.stroke(); q.lineWidth = T * 0.06; q.strokeStyle = TH.rung; q.stroke(); }
      // brass wheels at the foot
      for (const sd of [-1, 1]) { q.beginPath(); q.arc(sd * T * 0.32, -T * 0.02, T * 0.08, 0, TAU); q.fillStyle = TH.trim; q.fill(); q.lineWidth = lw * 0.7; q.strokeStyle = LN; q.stroke(); }
      // fade the top away into the air
      q.globalCompositeOperation = 'destination-out'; const g = q.createLinearGradient(0, -H, 0, -H * 0.35); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); q.fillStyle = g; q.fillRect(-cv.width, -H - T, cv.width * 2, H * 0.7 + T);
      c.drawImage(cv, -cv.width / 2, -H - T * 0.2);
    },
    /* a reading lectern holding a great open book; a simple gold eye glows on the blank pages */
    lectern(c, T, v, B) { TH = themeOf(B); const lw = lw0(T);
      shadowEll(c, T, 0.7, 0.3);
      c.beginPath(); c.moveTo(-T * 0.12, 0); c.lineTo(-T * 0.08, -T * 0.95); c.lineTo(T * 0.08, -T * 0.95); c.lineTo(T * 0.12, 0); c.closePath(); c.fillStyle = TH.wood; c.fill(); ink(c, lw);
      c.beginPath(); c.ellipse(0, -T * 0.02, T * 0.42, T * 0.12, 0, 0, TAU); c.fillStyle = TH.woodD; c.fill(); ink(c, lw);
      c.beginPath(); c.moveTo(-T * 0.7, -T * 1.0); c.lineTo(T * 0.7, -T * 1.0); c.lineTo(T * 0.55, -T * 1.25); c.lineTo(-T * 0.55, -T * 1.25); c.closePath(); c.fillStyle = TH.wood; c.fill(); ink(c, lw);
      // the open book: two pages curving up from the spine
      for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(0, -T * 1.2); c.quadraticCurveTo(sd * T * 0.3, -T * 1.42, sd * T * 0.66, -T * 1.3); c.lineTo(sd * T * 0.62, -T * 1.12); c.quadraticCurveTo(sd * T * 0.3, -T * 1.2, 0, -T * 1.08); c.closePath(); c.fillStyle = sd < 0 ? PARCH_HI : PARCH; c.fill(); ink(c, lw * 0.8); }
      c.strokeStyle = BURG; c.lineWidth = lw * 0.9; c.beginPath(); c.moveTo(0, -T * 1.2); c.lineTo(0, -T * 1.06); c.stroke();
      if (v % 2 === 0) { glowIn(c, -T * 0.32, -T * 1.24, T * 0.4, TH.trim, 0.6); c.strokeStyle = TH.trim; c.lineWidth = Math.max(1.2, lw * 0.7); ell(c, -T * 0.32, -T * 1.24, T * 0.15, T * 0.06); c.stroke(); c.fillStyle = TH.trim; c.beginPath(); c.arc(-T * 0.32, -T * 1.24, T * 0.035, 0, TAU); c.fill(); }
      else { c.strokeStyle = 'rgba(29,26,40,.3)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(T * 0.12, -T * (1.2 - i * 0.05)); c.lineTo(T * 0.55, -T * (1.22 - i * 0.05)); } c.stroke(); }
    },
    /* three stacks of books lying flat */
    bookstack(c, T, v, B) { TH = themeOf(B); const lw = lw0(T), R = rnd(31 + v * 19);
      shadowEll(c, T, 0.9, 0.3);
      for (const [x0, n] of [[-0.62, 3 + v % 2], [0.05, 5 - v % 2], [0.6, 2 + (v % 3)]]) { let y = 0; for (let i = 0; i < n; i++) { const w = T * (0.5 + R() * 0.15), h = T * (0.15 + R() * 0.07), dx = (R() - 0.5) * T * 0.1, col = TH.books[Math.floor(R() * TH.books.length)];
        c.beginPath(); c.rect(x0 * T - w / 2 + dx, y - h, w, h); c.fillStyle = shade(c, col, w, x0 * T - w * 0.2, y - h, 0.3); c.fill(); ink(c, lw * 0.8);
        c.fillStyle = PARCH_HI; c.fillRect(x0 * T + w / 2 + dx - w * 0.1, y - h + h * 0.2, w * 0.08, h * 0.6); c.fillStyle = TH.band; c.fillRect(x0 * T - w / 2 + dx + 2, y - h * 0.55, w * 0.7, Math.max(1, h * 0.1)); y -= h; } }
    },
    /* a gilded three-armed candelabra, the flames glowing */
    candelabra(c, T, v, B) { TH = themeOf(B); const lw = lw0(T);
      shadowEll(c, T, 0.42, 0.26);
      const gold = (pts, w) => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x * T, y * T) : c.moveTo(x * T, y * T))); c.lineWidth = T * w + lw * 2; c.strokeStyle = LN; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(); c.lineWidth = T * w; c.strokeStyle = TH.trim; c.stroke(); };
      gold([[0, 0], [0, -1.9]], 0.09); gold([[-0.45, -1.8], [-0.45, -1.5], [0, -1.35], [0.45, -1.5], [0.45, -1.8]], 0.07);
      ell(c, 0, -T * 0.02, T * 0.3, T * 0.09); c.fillStyle = TH.trim; c.fill(); ink(c, lw * 0.8);
      for (const [x, y] of [[-0.45, -1.8], [0, -2.0], [0.45, -1.8]]) { c.beginPath(); c.rect(x * T - T * 0.06, y * T - T * 0.3, T * 0.12, T * 0.3); c.fillStyle = PARCH_HI; c.fill(); ink(c, lw * 0.6);
        glowIn(c, x * T, y * T - T * 0.42, T * 0.6, '#FFC870', 0.7); c.beginPath(); c.moveTo(x * T, y * T - T * 0.6); c.quadraticCurveTo(x * T + T * 0.08, y * T - T * 0.38, x * T, y * T - T * 0.3); c.quadraticCurveTo(x * T - T * 0.08, y * T - T * 0.38, x * T, y * T - T * 0.6); c.fillStyle = '#FFE6A0'; c.fill(); }
    },
    /* a giant inkwell of black glass with a gold collar, and a great quill stood in it */
    inkwell(c, T, v, B) { TH = themeOf(B); const lw = lw0(T);
      shadowEll(c, T, 0.75, 0.32);
      c.beginPath(); c.moveTo(-T * 0.6, 0); c.quadraticCurveTo(-T * 0.75, -T * 0.6, -T * 0.32, -T * 0.85); c.lineTo(T * 0.32, -T * 0.85); c.quadraticCurveTo(T * 0.75, -T * 0.6, T * 0.6, 0); c.closePath(); c.fillStyle = shade(c, '#2A2440', T * 0.8, -T * 0.25, -T * 0.55, 0.45); c.fill(); ink(c, lw);
      c.fillStyle = 'rgba(255,255,255,.28)'; ell(c, -T * 0.3, -T * 0.5, T * 0.08, T * 0.22, 0.3); c.fill();
      c.beginPath(); c.rect(-T * 0.36, -T * 1.02, T * 0.72, T * 0.2); c.fillStyle = TH.trim; c.fill(); ink(c, lw * 0.8);
      c.fillStyle = '#0C0A14'; ell(c, 0, -T * 1.02, T * 0.32, T * 0.08); c.fill();
      // the quill: a long feather leaning out of it
      c.save(); c.translate(T * 0.05, -T * 1.0); c.rotate(0.35 * (v % 2 ? 1 : -1));
      c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -T * 2.4); c.lineWidth = Math.max(1.5, T * 0.04); c.strokeStyle = LN; c.stroke();
      c.beginPath(); c.moveTo(0, -T * 0.5); c.quadraticCurveTo(T * 0.38, -T * 1.2, T * 0.06, -T * 2.5); c.quadraticCurveTo(-T * 0.3, -T * 1.4, 0, -T * 0.5); c.closePath(); c.fillStyle = shade(c, PARCH_HI, T, -T * 0.1, -T * 1.6, 0.25); c.fill(); ink(c, lw * 0.8);
      c.strokeStyle = 'rgba(29,26,40,.35)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 9; i++) { const y = -T * (0.6 + i * 0.2); c.moveTo(0, y); c.lineTo(T * 0.22 * Math.sin(i / 9 * Math.PI), y - T * 0.12); c.moveTo(0, y); c.lineTo(-T * 0.18 * Math.sin(i / 9 * Math.PI), y - T * 0.1); } c.stroke();
      c.restore();
    },
    /* a small model of Gaia turning in a glassless gilded frame */
    orrery(c, T, v, B) { TH = themeOf(B); const lw = lw0(T);
      shadowEll(c, T, 0.5, 0.28);
      c.beginPath(); c.moveTo(-T * 0.3, 0); c.lineTo(0, -T * 0.45); c.lineTo(T * 0.3, 0); c.lineWidth = T * 0.07 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.07; c.strokeStyle = TH.trim; c.stroke();
      const cy = -T * 1.25; c.beginPath(); c.arc(0, cy, T * 0.62, 0, TAU); c.lineWidth = T * 0.06 + lw * 2; c.strokeStyle = LN; c.stroke(); c.lineWidth = T * 0.06; c.strokeStyle = TH.trim; c.stroke();
      c.beginPath(); c.arc(0, cy, T * 0.4, 0, TAU); c.fillStyle = shade(c, '#5A8AB8', T * 0.4, -T * 0.12, cy - T * 0.14, 0.45); c.fill(); ink(c, lw);
      c.fillStyle = '#6FA86A'; for (const [x, y, r] of [[-0.12, -0.1, 0.14], [0.15, 0.08, 0.1], [0.05, -0.22, 0.07]]) { c.beginPath(); c.ellipse(x * T, cy + y * T, r * T, r * T * 0.7, 0.4, 0, TAU); c.fill(); }
      c.strokeStyle = TH.trimHi; c.lineWidth = Math.max(1, lw * 0.6); ell(c, 0, cy, T * 0.62, T * 0.16, -0.3); c.stroke();
    },
  });

  /* ---- floor decals: ink blots, loose pages, gold letters ---- */
  window.DECAL_EXT = window.DECAL_EXT || {};
  Object.assign(DECAL_EXT, {
    inkblot(c, d, s) { c.fillStyle = 'rgba(29,26,40,.55)'; c.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rr = s * (1.4 + 0.45 * Math.sin(a * 3 + d.rot) + 0.25 * Math.sin(a * 7 + d.v)); i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.7) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.7); } c.closePath(); c.fill();
      c.beginPath(); c.arc(s * 2.2 * Math.cos(d.rot), s * 1.2 * Math.sin(d.rot), s * 0.3, 0, TAU); c.fill(); },
    page(c, d, s) { c.rotate(d.rot); c.fillStyle = 'rgba(0,0,0,.18)'; c.fillRect(-s * 1.1 + 2, -s * 1.4 + 2, s * 2.2, s * 2.8); c.fillStyle = '#F4EAD2'; c.fillRect(-s * 1.1, -s * 1.4, s * 2.2, s * 2.8); c.strokeStyle = 'rgba(29,26,40,.35)'; c.lineWidth = 1; c.strokeRect(-s * 1.1, -s * 1.4, s * 2.2, s * 2.8);
      c.beginPath(); for (let i = 0; i < 5; i++) { c.moveTo(-s * 0.8, -s * 0.9 + i * s * 0.45); c.lineTo(s * (0.2 + (i * 37 % 5) * 0.12), -s * 0.9 + i * s * 0.45); } c.stroke(); },
    goldleaf(c, d, s) { c.strokeStyle = 'rgba(207,173,98,.75)'; c.lineWidth = Math.max(1, s * 0.2); c.lineCap = 'round'; c.rotate(d.rot * 0.3); c.beginPath(); const g = d.v; if (g === 0) { c.arc(0, 0, s * 0.8, 0, TAU); c.moveTo(-s * 0.5, 0); c.lineTo(s * 0.5, 0); } else if (g === 1) { c.moveTo(-s * 0.7, s * 0.7); c.lineTo(0, -s * 0.8); c.lineTo(s * 0.7, s * 0.7); } else if (g === 2) { c.ellipse(0, 0, s, s * 0.45, 0, 0, TAU); c.moveTo(s * 0.12, 0); c.arc(0, 0, s * 0.12, 0, TAU); } else { c.moveTo(-s * 0.7, -s * 0.5); c.lineTo(s * 0.7, -s * 0.5); c.moveTo(0, -s * 0.5); c.lineTo(0, s * 0.8); } c.stroke(); },
    quillmark(c, d, s) { c.strokeStyle = 'rgba(29,26,40,.3)'; c.lineWidth = Math.max(1, s * 0.18); c.lineCap = 'round'; c.rotate(d.rot); c.beginPath(); c.moveTo(-s * 2.2, 0); for (let i = 1; i <= 8; i++) c.quadraticCurveTo(-s * 2.2 + (i - 0.5) * s * 0.55, (i % 2 ? -1 : 1) * s * 0.5, -s * 2.2 + i * s * 0.55, 0); c.stroke(); },
  });

  /* ---- the walls: bookshelf faces ---- */
  function shelfWall(c, X, Y, T, H, h, x, lw, B) { TH = themeOf(B);
    c.fillStyle = TH.woodD; c.fillRect(X, Y, T + 0.5, H); c.fillStyle = TH.back; c.fillRect(X + T * 0.05, Y + H * 0.12, T * 0.9, H * 0.72);
    const R = rnd(x * 7 + Math.floor(Y) * 3 + 5); shelfRow(c, X + T * 0.06, X + T * 0.94, Y + H * 0.84, H * 0.66, lw * 0.8, R);
    c.fillStyle = TH.wood; c.fillRect(X, Y + H * 0.82, T + 0.5, H * 0.12); c.fillStyle = TH.band; c.fillRect(X, Y + H * 0.02, T + 0.5, Math.max(1, H * 0.05));
  }

  /* ---- the bridges: closed books laid across the drop ---- */
  function bookBridge(c, x, y, X, Y, T, isGap, tt, lw, B) {
    const gNS = isGap(x, y - 1) || isGap(x, y + 1), gWE = isGap(x - 1, y) || isGap(x + 1, y);
    const run = (dx, dy) => { let n = 0; for (const s of [-1, 1]) for (let k = 1; k <= 6 && tt(x + dx * k * s, y + dy * k * s) === T_BRIDGE; k++) n++; return n; };
    const horiz = gNS && !gWE ? true : gWE && !gNS ? false : run(1, 0) >= run(0, 1);
    const W = horiz ? x : y, A = horiz ? x : y, sideA = horiz ? isGap(x, y - 1) : isGap(x - 1, y), sideB = horiz ? isGap(x, y + 1) : isGap(x + 1, y);
    const col = B.bridgeCol || BURG; TH = themeOf(B);
    c.save(); c.translate(X, Y); if (!horiz) c.transform(0, 1, 1, 0, 0, 0);
    // the cover leather, lit towards the top edge
    const g = c.createLinearGradient(0, 0, 0, T); g.addColorStop(0, shadeC(col, 0.18)); g.addColorStop(0.5, col); g.addColorStop(1, shadeC(col, -0.25)); c.fillStyle = g; c.fillRect(0, 0, T + 0.5, T + 0.5);
    c.fillStyle = 'rgba(0,0,0,.12)'; for (let k = 0; k < 3; k++) { ell(c, T * hh(x, y, 10 + k), T * (0.25 + hh(x, y, 20 + k) * 0.5), T * 0.2, T * 0.06); c.fill(); }
    // page edges where the book meets the drop (cream, finely lined), gold tooling inside them
    for (const [on, y0] of [[sideA, 0], [sideB, T * 0.86]]) if (on) { c.fillStyle = PARCH_HI; c.fillRect(0, y0, T + 0.5, T * 0.14); c.strokeStyle = 'rgba(120,96,60,.5)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 4; i++) { c.moveTo(0, y0 + T * 0.035 * i); c.lineTo(T + 0.5, y0 + T * 0.035 * i); } c.stroke(); c.fillStyle = LN; c.fillRect(0, y0 === 0 ? T * 0.14 : y0 - 1, T + 0.5, Math.max(1, T * 0.025)); }
    c.strokeStyle = TH.trim; c.lineWidth = Math.max(1.2, T * 0.035); c.beginPath(); c.moveTo(0, T * 0.22); c.lineTo(T + 0.5, T * 0.22); c.moveTo(0, T * 0.78); c.lineTo(T + 0.5, T * 0.78); c.stroke();
    // every few tiles a raised spine band and a gilded corner flourish
    const k = ((A % 4) + 4) % 4;
    if (k === 0) { c.fillStyle = shadeC(col, -0.3); c.fillRect(T * 0.38, 0, T * 0.24, T + 0.5); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(T * 0.38, 0, T * 0.05, T + 0.5); c.strokeStyle = TH.trim; c.lineWidth = Math.max(1, T * 0.025); c.strokeRect(T * 0.4, T * 0.24, T * 0.2, T * 0.52); }
    if (k === 2) { c.strokeStyle = TH.trimHi; c.lineWidth = Math.max(1.2, T * 0.03); c.beginPath(); c.moveTo(T * 0.5, T * 0.32); c.lineTo(T * 0.68, T * 0.5); c.lineTo(T * 0.5, T * 0.68); c.lineTo(T * 0.32, T * 0.5); c.closePath(); c.stroke(); c.fillStyle = TH.trim; c.beginPath(); c.arc(T * 0.5, T * 0.5, T * 0.05, 0, TAU); c.fill(); }
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1; c.beginPath(); c.moveTo(0.5, 0); c.lineTo(0.5, T); c.stroke();
    c.restore();
  }
  // under a bridge's south edge: the block of pages, then the back cover
  function bookEdge(c, x, y, X, Y, T, lw, B) {
    c.fillStyle = PARCH; c.fillRect(X, Y, T + 0.5, T * 0.2); c.strokeStyle = 'rgba(120,96,60,.5)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 5; i++) { c.moveTo(X, Y + T * 0.04 * i); c.lineTo(X + T + 0.5, Y + T * 0.04 * i); } c.stroke();
    c.fillStyle = shadeC(B.bridgeCol || BURG, -0.35); c.fillRect(X, Y + T * 0.2, T + 0.5, T * 0.07); c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(X, Y + T * 0.27, T + 0.5, T * 0.12);
  }

  /* ---- the void: ink, drifting script, gold motes, and a black moon ---- */
  window.GAP_EXT = window.GAP_EXT || {};
  GAP_EXT.inkvoid = { base: '#100D1A',
    paint(c, S, R) { c.fillStyle = '#100D1A'; c.fillRect(0, 0, S, S);
      for (let i = 0; i < 14; i++) { const x = R() * S, y = R() * S, w = 14 + R() * 26; c.strokeStyle = `rgba(90,60,130,${0.12 + R() * 0.18})`; c.lineWidth = 1.5 + R() * 2; for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) { c.beginPath(); c.moveTo(x + ox - w, y + oy); c.bezierCurveTo(x + ox - w * 0.3, y + oy - 8, x + ox + w * 0.3, y + oy + 8, x + ox + w, y + oy); c.stroke(); } }
      for (let i = 0; i < 6; i++) { const x = R() * S, y = R() * S; c.strokeStyle = 'rgba(207,173,98,.14)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); for (let j = 1; j <= 6; j++) c.quadraticCurveTo(x + (j - 0.5) * 4, y + (j % 2 ? -3 : 3), x + j * 4, y); c.stroke(); }
      for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(242,220,154,${0.2 + R() * 0.5})`; c.beginPath(); c.arc(R() * S, R() * S, R() < 0.15 ? 1.4 : 0.7, 0, TAU); c.fill(); } },
    back(c, o) { const { pat, pattern, k, P, W, H, t, wx, wy, bigGlow } = o;
      pat(pattern('inkvoid', k), 0.5, t * 2, t * 1.2);
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.14 + 0.04 * Math.sin(t * 0.9); bigGlow(c, P, '#6A3A8A', W * 0.2 - (wx * 0.04) % W, H * 0.5, W * 1.0); c.restore();
      // the black moon, high and far (it barely moves as you do)
      const mx = W * 0.72 - ((wx * 0.02) % (W * 2)), my = H * 0.16 - ((wy * 0.015) % H), mr = Math.min(W, H) * 0.12;
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5; blitSized(c, glowSprite(GOLD), mx - mr * 2.4, my - mr * 2.4, mr * 4.8, mr * 4.8); c.restore();
      c.fillStyle = '#05040A'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.strokeStyle = 'rgba(242,220,154,.8)'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(242,220,154,.25)'; c.lineWidth = 6; c.beginPath(); c.arc(mx, my, mr + 4, 0, TAU); c.stroke();
      // loose pages drifting through the dark
      for (let i = 0; i < 7; i++) { const sp = 6 + (i % 3) * 5, px = ((i * 137 + t * sp - wx * 0.25) % (W + 80) + W + 80) % (W + 80) - 40, py = ((i * 211 + Math.sin(t * 0.4 + i) * 30 - wy * 0.25) % (H + 80) + H + 80) % (H + 80) - 40, a = Math.sin(t * 0.7 + i * 2) * 0.6;
        c.save(); c.translate(px, py); c.rotate(a); c.scale(1, 0.6 + 0.4 * Math.abs(Math.sin(t * 0.9 + i))); c.globalAlpha = 0.55; c.fillStyle = PARCH_HI; c.fillRect(-9, -12, 18, 24); c.strokeStyle = 'rgba(29,26,40,.4)'; c.lineWidth = 1; c.beginPath(); for (let j = 0; j < 4; j++) { c.moveTo(-6, -7 + j * 5); c.lineTo(5, -7 + j * 5); } c.stroke(); c.restore(); } },
  };

  /* ---- the lands ---- */
  const land = (o) => Object.assign({ rift: true, tile: 'keep', out: true, dark: 0.22, gap: 'inkvoid', ambient: 'motes', grade: 'rgba(207,173,98,.06)', hazard: 'laser', wallFn: shelfWall, bridgeFn: bookBridge, bridgeEdge: bookEdge }, o);
  BIOMES.catalogue = land({ name: 'The Catalogue of Truth', bg: '#100D1A', accent: GOLD, light: GOLD_HI, bridgeCol: BURG,
    floor: ['#E4D3AF', '#DFCCA6', '#E8D8B6'], grout: '#B89C70', hi: '#F4EAD2', top: '#4A2A2E', face: WOOD, faceD: WOOD_D, cliff: '#5A3A2E', deco: GOLD,
    props: ['bookcase', 'bookcase', 'lectern', 'bookstack', 'candelabra', 'bookcase', 'libladder', 'inkwell'], propN: [5, 3], fog: '#100D1A', darkRGB: '16,13,26' });
  // II: the Silver Bindery: white marble, white-lacquered shelves bound in silver, books in navy, pearl and lilac
  BIOMES.binding = land({ name: 'The Silver Bindery', bg: '#1A2030', accent: '#DCE3F0', light: '#FFFFFF', bridgeCol: '#3C4A6A', dark: 0.12, gap: 'silvervoid', libTheme: 'silver',
    floor: ['#E9ECF2', '#E1E5EE', '#F1F3F8'], grout: '#B4BCCC', hi: '#FFFFFF', top: '#C9D0DC', face: '#AEB7C6', faceD: '#7E889A', cliff: '#8E98AA', deco: '#DCE3F0', grade: 'rgba(220,228,245,.08)',
    props: ['bookcase', 'bookcase', 'candelabra', 'bookstack', 'lectern', 'bookcase', 'libladder', 'orrery'], propN: [5, 3], fog: '#1A2030', darkRGB: '26,32,48' });
  // III: the Ascent: a stair of white marble and gold through the clouds, platinum furniture, holy light everywhere
  BIOMES.archive = land({ name: 'The Ascent of Light', tile: 'heaven', bg: '#FFF4DC', accent: '#FFE9A8', light: '#FFFFFF', bridgeCol: '#F2E6C8', dark: 0, gap: 'celestial', libTheme: 'holy', ambient: 'motes',
    floor: ['#FFFDF6', '#FBF6E8', '#FFF9EE'], grout: '#E8D9A8', hi: '#FFFFFF', top: '#F4ECD6', face: '#E6DCC0', faceD: '#C9BC98', cliff: '#FFFFFF', deco: '#FFE9A8', grade: 'rgba(255,240,200,.1)',
    props: ['platpillar', 'angelstatue', 'bookcase', 'haloarch', 'censer', 'platpillar', 'cloudbank', 'harp', 'angelstatue'], propN: [5, 3], fog: '#FFF4DC', darkRGB: '255,244,220' });
  BIOME_ORDER.push('catalogue', 'binding', 'archive');
  DARK_COL.catalogue = '16,13,26'; DARK_COL.binding = '26,32,48'; DARK_COL.archive = '255,244,220';
  if (typeof DECALS !== 'undefined') { DECALS.catalogue = [['page', 0.04], ['goldleaf', 0.05], ['quillmark', 0.03], ['inkblot', 0.02]]; DECALS.binding = [['inkblot', 0.07], ['page', 0.05], ['quillmark', 0.03], ['goldleaf', 0.02]]; DECALS.archive = [['feather', 0.05], ['goldinlay', 0.05], ['goldleaf', 0.05], ['page', 0.015]]; DECALS.binding = [['page', 0.05], ['silverleaf', 0.06], ['quillmark', 0.02]]; }
  // shelves stand round each room's rim, side by side, so long as every open tile of the room stays reachable
  const RIM = ['bookcase', 'bookcase', 'bookcase', 'libladder', 'bookstack', 'candelabra', 'bookcase'];
  function dressShelves({ rm, i, G, RM, props, R, MW, walk, okFeature, first, id }) {
    const cells = []; for (let y = rm.y; y < rm.y + rm.h; y++) for (let x = rm.x; x < rm.x + rm.w; x++) { const k = id(x, y); if (RM[k] === i && walk(k)) cells.push(k); }
    if (cells.length < 20) return;
    const rim = cells.filter(k => { const x = k % MW, y = (k / MW) | 0; return okFeature(x, y, i) && !walk(k - MW) && !props.has(k - MW); });  // tiles with the drop behind them (north)
    const connected = () => { const open = cells.filter(k => walk(k)); if (!open.length) return true; const seen = new Set([open[0]]), q = [open[0]]; for (let h = 0; h < q.length; h++) for (const d of [1, -1, MW, -MW]) { const kk = q[h] + d; if (!seen.has(kk) && RM[kk] === i && walk(kk)) { seen.add(kk); q.push(kk); } } return seen.size >= open.length; };
    let want = Math.round(rim.length * (first ? 0.3 : 0.5)), tries = 0;
    while (want > 0 && rim.length && tries++ < 150) { const j = Math.floor(R() * rim.length), k = rim[j]; rim.splice(j, 1); if (props.has(k - 1) && props.has(k + 1)) continue; const was = G[k]; G[k] = T_SOLID; if (!connected()) { G[k] = was; continue; } const L = (BIOMES[rm.biome] && BIOMES[rm.biome].rim) || RIM; props.set(k, L[Math.floor(R() * L.length)]); want--; }
  }
  BIOMES.catalogue.dress = BIOMES.binding.dress = BIOMES.archive.dress = dressShelves;

  /* ---- the brood ---- */
  Object.assign(MON, {
    marginworm: { name: 'Margin worm', from: 999, hp: 260, spd: 1.7, r: 0.4, dmg: 18, xp: 16, coin: 0.9, color: PARCH, bio: ['catalogue', 'binding', 'archive'], tip: 'A curled strip of parchment. It UNROLLS straight along a shown line, then snaps forward along it: step off the line.', kit: [] },
    inkstalker: { name: 'Ink stalker', from: 999, hp: 300, spd: 2.0, r: 0.45, dmg: 17, xp: 17, coin: 0.9, color: INK, bio: ['catalogue', 'binding', 'archive'], tip: 'A four-legged blot of ink with one white eye. It flattens, then dashes, leaving a strip of ink that slows you: don\'t follow its trail.', kit: [] },
    falsefolio: { name: 'False folio', from: 999, hp: 240, spd: 1.5, r: 0.42, dmg: 14, xp: 16, coin: 1.0, color: BURG, bio: ['catalogue', 'binding', 'archive'], fly: true, tip: 'A closed book glinting like treasure. Come near and it shows its red mark, opens and throws fans of page darts.', kit: [] },
  });
  const limb = (c, x0, y0, x1, y1, w, col) => { c.lineCap = 'round'; c.strokeStyle = LN; c.lineWidth = w + 2.2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = col; c.lineWidth = w; c.stroke(); };
  Object.assign(MP, {
    /* a pale curled strip of parchment: a burgundy spine down its back, a black triangle of a mouth; unrolled it lies
       straight and long, ready to snap */
    marginworm(c, r, ph, o) { const lw = lwOf(r), straight = o.mode === 'block' || o.mode === 'dash' ? 1 : 0, wob = Math.sin(ph * TAU) * 0.08;
      c.fillStyle = 'rgba(0,0,0,.22)'; ell(c, 0, r * 0.75, r * (0.9 + straight * 0.8), r * 0.25); c.fill();
      if (straight) { const L = r * 2.4; c.beginPath(); c.moveTo(-L * 0.6, r * 0.25); c.quadraticCurveTo(0, r * (0.05 + wob), L * 0.6, r * 0.1); c.lineTo(L * 0.62, -r * 0.35); c.quadraticCurveTo(0, -r * (0.45 + wob), -L * 0.6, -r * 0.2); c.closePath(); c.fillStyle = shade(c, PARCH_HI, L * 0.6, -L * 0.2, -r * 0.2, 0.25); c.fill(); stroke(c, lw);
        c.strokeStyle = BURG; c.lineWidth = lw * 1.6; c.beginPath(); c.moveTo(-L * 0.55, -r * 0.05); c.quadraticCurveTo(0, -r * 0.25, L * 0.55, -r * 0.12); c.stroke();
        c.strokeStyle = 'rgba(29,26,40,.3)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 6; i++) { const x = -L * 0.45 + i * L * 0.16; c.moveTo(x, r * 0.05); c.lineTo(x + L * 0.1, r * 0.03); } c.stroke();
        c.fillStyle = INK; c.beginPath(); c.moveTo(L * 0.62, -r * 0.35); c.lineTo(L * 0.95, -r * 0.1); c.lineTo(L * 0.6, r * 0.12); c.closePath(); c.fill(); stroke(c, lw * 0.8); c.fillStyle = GOLD_HI; c.beginPath(); c.arc(L * 0.5, -r * 0.2, r * 0.07, 0, TAU); c.fill(); return; }
      // curled: a spiral strip
      c.save(); c.rotate(wob); c.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU * 1.6, rr = r * (0.2 + u * 0.75); i ? c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.85) : c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.85); }
      c.lineWidth = r * 0.42 + lw * 2; c.strokeStyle = LN; c.lineCap = 'round'; c.stroke(); c.lineWidth = r * 0.42; c.strokeStyle = PARCH_HI; c.stroke(); c.lineWidth = r * 0.1; c.strokeStyle = BURG; c.stroke();
      const a1 = TAU * 1.6, ex = Math.cos(a1) * r * 0.95, ey = Math.sin(a1) * r * 0.95 * 0.85; c.fillStyle = INK; c.beginPath(); c.moveTo(ex - r * 0.1, ey - r * 0.22); c.lineTo(ex + r * 0.42, ey); c.lineTo(ex - r * 0.1, ey + r * 0.2); c.closePath(); c.fill(); stroke(c, lw * 0.7);
      c.fillStyle = GOLD_HI; c.beginPath(); c.arc(ex - r * 0.12, ey - r * 0.05, r * 0.07, 0, TAU); c.fill(); c.restore(); },
    /* a low blot of ink on four angular legs, one white eye; it flattens into a puddle before it dashes */
    inkstalker(c, r, ph, o) { const lw = lwOf(r), flat = o.mode === 'block' ? 1 : 0, dash = o.mode === 'dash' ? 1 : 0, run = Math.sin(ph * TAU * (dash ? 3 : 1));
      c.fillStyle = 'rgba(0,0,0,.3)'; ell(c, 0, r * 0.75, r * (1 + flat * 0.4), r * 0.28); c.fill();
      if (!flat) for (const [x, k] of [[-0.6, 1], [-0.2, -1], [0.25, 1], [0.6, -1]]) { const kx = x * r, ky = -r * 0.1; limb(c, kx * 0.5, r * 0.1, kx + r * 0.15 * k * run, r * 0.0 + ky - r * 0.25, lw * 1.1, '#2A2440'); limb(c, kx + r * 0.15 * k * run, ky - r * 0.25, kx * 1.25 + r * 0.1 * k * run, r * 0.75, lw * 1.0, '#2A2440'); }
      const sy = flat ? 0.45 : 1, bx = dash ? r * 0.2 : 0; c.beginPath(); for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, rr = r * (0.75 + 0.12 * Math.sin(a * 5 + ph * TAU)); i ? c.lineTo(bx + Math.cos(a) * rr * (1 + flat * 0.4), r * (0.2 + flat * 0.35) + Math.sin(a) * rr * 0.62 * sy) : c.moveTo(bx + Math.cos(a) * rr * (1 + flat * 0.4), r * (0.2 + flat * 0.35) + Math.sin(a) * rr * 0.62 * sy); } c.closePath();
      c.fillStyle = shade(c, '#2E2A44', r, -r * 0.2, -r * 0.1, 0.4); c.fill(); stroke(c, lw);
      c.fillStyle = 'rgba(205,180,255,.35)'; ell(c, bx - r * 0.25, r * (0.0 + flat * 0.3), r * 0.25, r * 0.08 * sy); c.fill();
      const eyY = r * (0.05 + flat * 0.32); c.fillStyle = '#FFFFFF'; ell(c, bx + r * 0.25, eyY, r * 0.2, r * 0.17 * (flat ? 0.6 : 1)); c.fill(); stroke(c, lw * 0.7); c.fillStyle = INK; c.beginPath(); c.arc(bx + r * 0.3, eyY, r * 0.07, 0, TAU); c.fill();
      if (!flat && Math.random() < 0.02) {} },
    /* a floating closed book, burgundy covers with one thin gold edge and two page fins; disguised it only glints;
       revealed it shows a red mark and its covers part */
    falsefolio(c, r, ph, o) { const lw = lwOf(r), bob = Math.sin(ph * TAU) * r * 0.12, open = o.mode === 'block' ? 1 : 0, fin = Math.sin(ph * TAU * 2) * 0.3;
      c.fillStyle = 'rgba(0,0,0,.2)'; ell(c, 0, r * 1.1, r * 0.7, r * 0.2); c.fill();
      c.save(); c.translate(0, -r * 0.3 + bob);
      for (const sd of [-1, 1]) { c.save(); c.scale(sd, 1); c.beginPath(); c.moveTo(r * 0.5, -r * 0.1); c.quadraticCurveTo(r * 1.2, -r * (0.6 + fin), r * 1.35, -r * (0.1 + fin)); c.quadraticCurveTo(r * 1.0, r * 0.1, r * 0.5, r * 0.15); c.closePath(); c.fillStyle = PARCH_HI; c.fill(); stroke(c, lw * 0.8); c.strokeStyle = 'rgba(29,26,40,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(r * 0.6, 0); c.lineTo(r * 1.2, -r * (0.2 + fin)); c.stroke(); c.restore(); }
      if (open) { for (const sd of [-1, 1]) { c.save(); c.rotate(sd * 0.35); c.beginPath(); c.rect(-r * 0.55, sd < 0 ? -r * 0.75 : 0, r * 1.1, r * 0.75); c.fillStyle = sd < 0 ? BURG_HI : BURG; c.fill(); stroke(c, lw); c.restore(); } c.fillStyle = PARCH_HI; c.beginPath(); c.moveTo(-r * 0.5, 0); c.lineTo(r * 0.5, 0); c.lineTo(r * 0.4, -r * 0.2); c.lineTo(-r * 0.4, -r * 0.2); c.closePath(); c.fill(); stroke(c, lw * 0.7); c.fillStyle = '#FF4F6A'; c.beginPath(); c.arc(0, -r * 0.08, r * 0.1, 0, TAU); c.fill(); }
      else { c.beginPath(); c.rect(-r * 0.55, -r * 0.7, r * 1.1, r * 1.0); c.fillStyle = shade(c, o.color, r, -r * 0.2, -r * 0.5, 0.35); c.fill(); stroke(c, lw); c.fillStyle = PARCH_HI; c.fillRect(r * 0.42, -r * 0.62, r * 0.1, r * 0.86); c.fillStyle = GOLD; c.fillRect(-r * 0.55, -r * 0.7, r * 1.1, Math.max(1.5, r * 0.08)); c.strokeStyle = GOLD; c.lineWidth = Math.max(1, lw * 0.6); c.strokeRect(-r * 0.4, -r * 0.55, r * 0.8, r * 0.7); }
      c.restore();
      // the glint that makes it look like loot, or (revealed) the red enemy mark above it
      if (o.disguised) { const k = Math.max(0, Math.sin(ph * TAU * 1.5)); glowIn(c, r * 0.3, -r * 1.0 + bob, r * 1.2, GOLD_HI, 0.3 + k * 0.5); c.fillStyle = '#FFFFFF'; c.globalAlpha = k; c.beginPath(); c.moveTo(r * 0.3, -r * 1.35 + bob); c.lineTo(r * 0.36, -r * 1.0 + bob); c.lineTo(r * 0.3, -r * 0.65 + bob); c.lineTo(r * 0.24, -r * 1.0 + bob); c.closePath(); c.fill(); c.globalAlpha = 1; } },
  });
  Object.assign(EXT, { marginworm: 3.2, inkstalker: 2.6, falsefolio: 3.0 }); Object.assign(NF, { marginworm: 6, inkstalker: 6, falsefolio: 6 });
  const { mon, keepRange } = DunAI;
  Object.assign(mon, {
    marginworm(m, A, X) {
      if (m.dashT > 0) { m.dashT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.da) * 14 * A.dt, Math.sin(m.da) * 14 * A.dt); if (!m.dhit && A.d < m.r + X.me.r + 0.3) { m.dhit = true; X.hurtPet(m.dmg * 1.3, m); X.push(m.da, 1.4); } if (m.dashT <= 0) { m.mode = null; m.cd = 2.2 + Math.random() * 1.2; } return; }
      if (m.rollT > 0) { m.rollT -= A.dt; m.mode = 'block'; m.face = Math.cos(m.da) >= 0 ? 1 : -1; if (m.rollT <= 0) { m.dashT = 0.4; m.dhit = false; X.part({ kind: 'spark', x: m.x, y: m.y, vx: 0, vy: -1, life: 0.3, max: 0.3, size: 3, color: PARCH_HI }); } return; }
      m.mode = null; keepRange(m, A, X, 2.6, 5);
      if (m.cd <= 0 && A.d < 5.8 && A.los()) { m.rollT = 0.7; m.da = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 5.8, w: 0.8, life: 0.7, max: 0.7, src: m, color: PARCH_HI }); }
    },
    inkstalker(m, A, X) {
      if (m.dashT > 0) { m.dashT -= A.dt; m.mode = 'dash'; X.moveEnt(m, Math.cos(m.da) * 12 * A.dt, Math.sin(m.da) * 12 * A.dt); m.trail = (m.trail || 0) - A.dt; if (m.trail <= 0) { m.trail = 0.07; X.zone({ kind: 'stall', x: m.x, y: m.y, r: 0.55, life: 3, max: 3, own: 'enemy' }); }
        if (!m.dhit && A.d < m.r + X.me.r + 0.25) { m.dhit = true; X.hurtPet(m.dmg * 1.2, m); } if (m.dashT <= 0) { m.mode = null; m.cd = 2.4 + Math.random(); } return; }
      if (m.flatT > 0) { m.flatT -= A.dt; m.mode = 'block'; if (m.flatT <= 0) { m.dashT = 0.5; m.dhit = false; } return; }
      m.mode = null; if (A.d > 2.5) A.steer(A.sp); m.face = A.dx >= 0 ? 1 : -1;
      if (m.cd <= 0 && A.d < 6 && A.los()) { m.flatT = 0.6; m.da = A.a; X.warn({ shape: 'line', x: m.x, y: m.y, a: A.a, len: 6, w: 0.7, life: 0.6, max: 0.6, src: m, color: VIOLET_HI }); }
    },
    falsefolio(m, A, X) {
      if (m.disguised == null) m.disguised = true;
      if (m.disguised) { m.mode = null; if (A.d < 4.2 || m.hp < m.maxhp) { m.disguised = false; m.cd = 0.8; X.text(m.x, m.y - 1.5, '!', '#FF4F6A', 20); X.sfx && X.sfx.tick && X.sfx.tick(); } return; }
      if (m.openT > 0) { m.openT -= A.dt; m.mode = 'block'; if (m.openT <= 0) { for (const da of [-0.32, 0, 0.32]) X.eshot(m.x, m.y - 0.4, m.da + da, 7.5, { dmg: m.dmg, color: PARCH_HI, core: '#FFFFFF', r: 0.16, style: 'orb', src: m }); m.cd = 2.6 + Math.random(); m.mode = null; } return; }
      keepRange(m, A, X, 3, 6);
      if (m.cd <= 0 && A.d < 7.5 && A.los()) { m.openT = 0.55; m.da = A.a; X.warn({ shape: 'cone', x: m.x, y: m.y, a: A.a, len: 6, spread: 0.36, life: 0.55, max: 0.55, src: m, color: PARCH_HI }); }
    },
  });

  /* ---- teetering shelves: hit one and it topples away from you, crushing the monsters in its fall ---- */
  Object.assign(MON, { tottershelf: { name: 'Teetering shelf', from: 999, hp: 140, spd: 0, r: 0.55, dmg: 0, xp: 2, coin: 0.2, color: WOOD, bio: ['catalogue', 'binding', 'archive'], still: true, tip: 'A tall shelf rocking on its base. Hit it and it topples AWAY from you, crushing every monster along its fall (shown when you come close). Lure them in first.', kit: [],
    onDeath(m, X) { topple(m, X); } } });
  const FALL = 5.2, FALLW = 1.7;
  const fallDir = (m, X) => Math.atan2(m.y - X.me.y, m.x - X.me.x);
  function topple(m, X) { const a = fallDir(m, X), ca = Math.cos(a), sa = Math.sin(a);
    for (let i = 1; i <= 4; i++) { const u = i / 4 * FALL; X.after(i * 0.05, () => { X.boom(m.x + ca * u, m.y + sa * u, 1.0, PARCH_HI, GOLD_HI, { n: 10, shake: i === 4 ? 9 : 3 }); for (let j = 0; j < 4; j++) X.part({ kind: 'spark', x: m.x + ca * u, y: m.y + sa * u - 0.3, vx: (Math.random() - 0.5) * 5, vy: -2 - Math.random() * 3, g: 8, life: 0.8, max: 0.8, size: 4, color: BOOKCOL[(i + j) % BOOKCOL.length] }); }); }
    if (X.sfx.crash) X.sfx.crash();
    let n = 0; for (const q of X.mons) { if (q.dead || q === m || q.boss || q.fobj || q.type === 'tottershelf') continue; const dx = q.x - m.x, dy = q.y - m.y, along = dx * ca + dy * sa, side = Math.abs(-dx * sa + dy * ca); if (along > -0.4 && along < FALL + 0.4 && side < FALLW / 2 + q.r) { n++; X.hitMon(q, q.maxhp * 0.85, { flat: true }); q.freeze = Math.max(q.freeze || 0, 1.0); } }
    { const dx = X.me.x - m.x, dy = X.me.y - m.y, along = dx * ca + dy * sa, side = Math.abs(-dx * sa + dy * ca); if (along > 0.4 && along < FALL && side < FALLW / 2 && !X.me.dodge) { X.hurtPet(X.ST().hp * 0.12, null); X.text(X.me.x, X.me.y - 1.4, 'Look out!', GOLD_HI, 13); } }
    X.text(m.x + ca * FALL * 0.5, m.y + sa * FALL * 0.5 - 1.2, n >= 2 ? `CRUSHED ×${n}!` : 'CRASH!', GOLD_HI, n >= 2 ? 17 : 13); }
  MP.tottershelf = (c, r, ph, o) => { const T = r / 0.55 * 0.9, rock = 0.1 + Math.sin(ph * TAU * 1.6) * 0.09;
    // a gold ring at its base, then the case itself leaning and rocking on one corner, books jumping on the shelves
    c.save(); c.strokeStyle = GOLD_HI; c.lineWidth = 2.5; c.setLineDash([6, 5]); c.globalAlpha = 0.85; ell(c, 0, r * 0.8, r * 1.5, r * 0.5); c.stroke(); c.restore();
    c.save(); c.translate(-r * 0.6, r * 0.8); c.rotate(rock); c.translate(r * 0.6, 0); c.scale(0.8, 0.8); PROPS.bookcase(c, T, 1, { libTheme: o.color === THEMES.silver.wood ? 'silver' : o.color === THEMES.holy.wood ? 'holy' : 'lib' }); c.restore();
    // a warning mark over it: a gold "!" in a ring
    const y = -r * 5.6; c.save(); c.fillStyle = GOLD; c.strokeStyle = LN; c.lineWidth = 2; c.beginPath(); c.arc(0, y, r * 0.42, 0, TAU); c.fill(); c.stroke(); c.fillStyle = LN; c.fillRect(-r * 0.07, y - r * 0.26, r * 0.14, r * 0.3); c.beginPath(); c.arc(0, y + r * 0.18, r * 0.08, 0, TAU); c.fill(); c.restore(); };
  Object.assign(EXT, { tottershelf: 7.5 }); Object.assign(NF, { tottershelf: 1 }); mon.tottershelf = () => {};
  function shelvesExtra(X, self, H) { const M = X.M, list = [];
    for (const rm of M.rooms.slice(1)) { const n = 1 + (Math.random() < 0.5 ? 1 : 0); for (let k = 0; k < n; k++) { const q = X.freeSpot(rm.x + rm.w * (0.25 + Math.random() * 0.5), rm.y + rm.h * (0.25 + Math.random() * 0.5), 0.8); if (!q) continue; const m = X.spawnMon('tottershelf', q.x, q.y, { pack: 881, rift: true }); m.aggro = false; m.optional = true; m.color = themeOf(BIOMES[X.F.biome]).wood; list.push(m); } }
    X.after(4.5, () => X.banner('TEETERING SHELVES', 'Hit one and it topples AWAY from you: lure monsters into its fall', GOLD_HI, 3, true));
    return { list,
      drawGround(c) { const T = X.Tz(), t = X.g.t; for (const m of list) { if (m.dead || Math.hypot(X.me.x - m.x, X.me.y - m.y) > 5.5) continue; const a = fallDir(m, X), ca = Math.cos(a), sa = Math.sin(a), x0 = X.sx(m.x), y0 = X.sy(m.y), nx = -sa * FALLW / 2, ny = ca * FALLW / 2;
        c.save(); c.globalAlpha = 0.5 + 0.2 * Math.sin(t * 6); c.fillStyle = 'rgba(242,220,154,.18)'; c.strokeStyle = GOLD_HI; c.lineWidth = 2; c.setLineDash([7, 6]); c.lineDashOffset = -t * 18; c.beginPath();
        c.moveTo(x0 + nx * T, y0 + ny * T); c.lineTo(X.sx(m.x + ca * FALL + nx), X.sy(m.y + sa * FALL + ny)); c.lineTo(X.sx(m.x + ca * FALL - nx), X.sy(m.y + sa * FALL - ny)); c.lineTo(x0 - nx * T, y0 - ny * T); c.closePath(); c.fill(); c.stroke(); c.restore(); } } }; }

  /* ---- the mini bosses: Rift-touched Cocopets ---- */
  const pick = (m, X, list) => { if (m.cd > 0) return; m.act = list[Math.floor(Math.random() * list.length)]; m.actT = 0; m.step = 0; };
  const done = (m, cd) => { m.act = 'move'; m.cd = cd * (m.phase === 3 ? 0.7 : 1); m.actT = 0; m.step = 0; };
  BOSSES.push(
    { id: 'quillpet', rift: true, name: 'Quill', title: 'A Rift-touched Cocopet', hp: 70000, dmg: 42, r: 1.35, spd: 1.9, color: PARCH_D, glow: GOLD_HI, biome: 'catalogue', el: 'light' },
    { id: 'blotpet', rift: true, name: 'Blot', title: 'A Rift-touched Cocopet', hp: 76000, dmg: 42, r: 1.4, spd: 1.8, color: '#2E2A44', glow: VIOLET_HI, biome: 'binding', el: 'dark' },
    { id: 'foliopet', rift: true, name: 'Folio', title: 'A Rift-touched Cocopet', hp: 84000, dmg: 46, r: 1.5, spd: 1.7, color: BURG, glow: GOLD, biome: 'archive', el: 'dark' });
  Object.assign(DunAI.boss, {
    /* Quill: writes three shown lines that strike one after another, then a sweep of its nib */
    quillpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['lines', 'nib', 'lines'] : ['lines', 'nib']); }
      const T = m.actT; switch (m.act) {
        case 'lines': { if (m.step < 3 && T > m.step * 0.45) { m.step++; const a0 = Math.atan2(X.me.y - m.y, X.me.x - m.x) + (m.step - 2) * 0.5, x = m.x, y = m.y; if (m.step === 1) X.say(m, 'Let me write you out.'); X.warn({ shape: 'line', x, y, a: a0, len: 11, w: 1.0, life: 0.9, max: 0.9, src: m, color: GOLD_HI, fn: () => { if (X.inLine(x, y, a0, 11, 1.0)) X.hurtPet(m.dmg * 1.1, m); } }); }
          if (T > 2.2) done(m, 1.4); break; }
        case 'nib': { if (m.step === 0) { m.step = 1; m.sa = Math.atan2(X.me.y - m.y, X.me.x - m.x); X.warn({ shape: 'cone', x: m.x, y: m.y, a: m.sa, len: 4.5, spread: 1.0, life: 0.7, max: 0.7, src: m, color: GOLD, fn: () => { if (X.inCone(m.x, m.y, m.sa, 4.5, 1.0)) X.hurtPet(m.dmg * 1.3, m); } }); }
          if (T > 1.1) done(m, 1.5); break; }
        default: done(m, 1); } },
    /* Blot: three ink pools at your recent steps, then it sinks and rises beneath you */
    blotpet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; m.trailP = m.trailP || []; if (!m.trailP.length || Math.hypot(m.trailP[m.trailP.length - 1][0] - X.me.x, m.trailP[m.trailP.length - 1][1] - X.me.y) > 1.5) { m.trailP.push([X.me.x, X.me.y]); if (m.trailP.length > 6) m.trailP.shift(); } return pick(m, X, m.phase >= 2 ? ['pools', 'rise', 'pools'] : ['pools', 'rise']); }
      const T = m.actT; switch (m.act) {
        case 'pools': { if (m.step === 0) { m.step = 1; X.say(m, 'Spill.'); const pts = (m.trailP || []).slice(-3); if (!pts.length) pts.push([X.me.x, X.me.y]); for (const [px, py] of pts) X.warn({ x: px, y: py, r: 1.6, life: 1.0, max: 1.0, src: m, color: VIOLET_HI, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 1.6 + X.me.r * 0.5) X.hurtPet(m.dmg * 1.1, m); X.zone({ kind: 'stall', x: px, y: py, r: 1.6, life: 4, max: 4, own: 'enemy' }); } }); }
          if (T > 1.4) done(m, 1.5); break; }
        case 'rise': { if (m.step === 0) { m.step = 1; const px = X.me.x, py = X.me.y; X.warn({ x: px, y: py, r: 2.2, life: 1.0, max: 1.0, src: m, color: VIOLET, fn: () => { const p = X.freeSpot(px, py, m.r) || { x: m.x, y: m.y }; m.x = p.x; m.y = p.y; if (Math.hypot(X.me.x - px, X.me.y - py) < 2.2 + X.me.r) X.hurtPet(m.dmg * 1.4, m); X.boom(px, py, 2, VIOLET, '#FFFFFF', { n: 18, shake: 5 }); } }); }
          if (T > 1.6) done(m, 1.6); break; }
        default: done(m, 1); } },
    /* Folio: a storm of pages circling out from it, then it snaps shut on a shown circle */
    foliopet(m, A, X, B) { if (m.act === 'move') { A.walk(B.spd * (A.d > 3 ? 1 : 0.3)); m.face = A.dx >= 0 ? 1 : -1; return pick(m, X, m.phase >= 2 ? ['storm', 'snap', 'storm'] : ['storm', 'snap']); }
      const T = m.actT; switch (m.act) {
        case 'storm': { if (m.step < 3 && T > m.step * 0.5) { m.step++; if (m.step === 1) X.say(m, 'Read me.'); const n = 10, off = m.step * 0.3; for (let i = 0; i < n; i++) X.eshot(m.x, m.y - 0.5, off + i / n * TAU, 5.5, { dmg: m.dmg * 0.8, color: PARCH_HI, core: '#FFFFFF', r: 0.18, style: 'orb', src: m }); }
          if (T > 2.0) done(m, 1.5); break; }
        case 'snap': { if (m.step === 0) { m.step = 1; const px = X.me.x, py = X.me.y; X.warn({ x: px, y: py, r: 2.6, life: 1.0, max: 1.0, src: m, color: BURG_HI, fn: () => { if (Math.hypot(X.me.x - px, X.me.y - py) < 2.6 + X.me.r) X.hurtPet(m.dmg * 1.4, m); X.ring(px, py, 0.3, 2.8, 0.35, GOLD_HI, 0.4); } }); }
          if (T > 1.4) done(m, 1.6); break; }
        default: done(m, 1); } },
  });

  /* ---- the rift ---- */
  const SEALING = { fall: 'THE MIND FALLS SILENT', sub: 'The black moon opens into a skylight; a blank book writes your names beside the sigil', sigil: 'THE TRUTH SIGIL', name: 'The Library of Unwritten Lives', color: GOLD_HI };
  const ST = (typeof LIB_STAGES !== 'undefined' && LIB_STAGES) || {};
  const placeholder = (name, goal) => ({ name, goal, how: goal, layout: ['##########', '#........#', '#...E....#', '#........#', '#...S....#', '##########'], legend: { E: {} }, make(X, self, H) { const e = X.M.marks.E[0]; self.done = true; H.setExit(e.x, e.y, 'The way on'); return {}; } });
  defRift({
    ease: 0.55, monEase: 0.5,   // (monsters at half the health and blows they first had; bosses as they were)
    id: 'library', n: 7, name: 'The Library of Unwritten Lives', lvl: 70, sigil: 'Truth', biome: 'catalogue', aff: ['dark', 'light'], region: 'the dream archive',
    blurb: 'An endless library come loose into the dark of a dream, where something writes in the margins. Find the true doors, mend the broken story, and walk the real procession home.', gate: { anima: 'virgo', name: 'The Starseed Conservatory' },
    mons: ['marginworm', 'inkstalker', 'falsefolio'], sealing: SEALING,
    stages: riftSections([
      { biome: 'catalogue', pattern: ['trial', 'fight', 'boss'], mods: ['random'], fights: ['The Reading Galleries'], minis: ['quillpet'], miniHp: 0.6, extra: shelvesExtra, trials: [ST.CATALOGUE || placeholder('The Catalogue of Truth', 'Find the true doors')], boss: 'syllax', bossName: 'Syllax the Bookwyrm', bossRoom: 'The Reading Circle' },
      { biome: 'binding', pattern: ['trial', 'fight', 'boss'], mods: ['random'], fights: ['The Silver Presses'], minis: ['blotpet'], miniHp: 0.6, extra: shelvesExtra, trials: [ST.FABLE || placeholder('The Unfinished Fable', 'Mend the broken story')], boss: 'vellum', bossName: 'Vellum the Inkbound', bossRoom: 'The Spilled-Ink Chamber' },
      { biome: 'archive', pattern: ['trial', 'fight', 'fight', 'boss'], mods: ['curse', 'random'], fights: ['The Gilded Stacks', 'The Stair of Clouds'], minis: ['foliopet'], miniHp: 0.6, mobs: ['seraphling', 'haloguard', 'ophanwheel', 'seraphling', 'falsefolio', 'haloguard'], extra: shelvesExtra, trials: [ST.PROCESSION || placeholder('The False Procession', 'Escort the true procession')], boss: 'nhalex', bossName: 'Nhalex the Unwritten Mind', bossRoom: 'The Final Archive' },
    ]),
  });
  LIB.THEMES = THEMES; LIB.themeOf = themeOf;
  LIB.shelvesExtra = shelvesExtra; LIB.bookcase = PROPS.bookcase; LIB.bookBlock = bookBlock; LIB.shelfRow = shelfRow;
})();
