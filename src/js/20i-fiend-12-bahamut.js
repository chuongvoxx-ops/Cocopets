/* ---------- BAHAMUT, THE INFINITE — Final Guardian of the Tower of Oblivion ----------
   At the summit the tower has no ceiling. Above its last floor floats a little celestial fish, a gem on its brow,
   enclosed in four golden rune rings that turn like a celestial gyroscope, two giant feathered wings spread just
   outside them and eight enormous tentacles of light trailing into the dark. The fish opens its eyes, the tentacles
   rise, and the stars go out. Its rings share its life, so it never needs chasing: it floats over the centre, within reach.
   The arena is a broad round platform marked in eight sectors, an inner circle and an outer lane.
   Each of four stages wakes one ring and adds one rule, taught alone before the finale combines them:
   I, the Ring of Form (gold, turquoise): read the tentacles' poses and the lit floor. Heaven's Lash, the Wheel of
     Judgment, the Breath of Creation, the Feather Storm; the Fourfold Seal: bait the golden lance onto four rune marks.
   II, the Ring of Motion (sapphire, silver): keep moving. The Celestial Scythe, the Falling Firmament, the Tidal
     Halo, the Halo Discus; the Turning Sanctuary: follow two safe sectors round, laying its lances behind you.
   III, the Ring of Memory (violet, rose): gold strikes now, violet strikes again. Remembered Pain, Yesterday's
     Heaven, Borrowed Tomorrow, the Cage of Light; Oblivion's Record: three attacks, replayed in reverse.
   IV, the Ring of Oblivion (white gold, a black sky): the rules two at a time (Wings and Rings among them), then Final
     Judgment: break the outer ring's eight runes, pair by pair, before Oblivion is cast; then strike the jewel down the
     golden corridor. It has fifteen more bars than its floor gives, and hits a quarter harder.
   The design is original: a little pearl-blue fish with veil fins, swimming inside the smallest ring so that no ring
   ever passes through it; the fish, its rings and its wings are built in 3D and cel-shaded, the tentacles pure light. */
FIEND_DEFS.bahamut = (() => {
  const TAU = Math.PI * 2, TN = FiendToon;
  // the summit: the platform's radius, its inner circle, the dais under the fish, eight sectors
  const RIN = 6.2, RCORE = 2.2, NSEC = 8, SEC_A = TAU / NSEC;
  // the gyroscope floats over the centre; its own camera looks down from about 34 degrees
  const HC = 3.8, EL = 0.6, SE = Math.sin(EL), CE = Math.cos(EL);
  // the four rings: radius, band width, thickness, how they turn, their metal and their runes' light. The whole gyroscope
  // is built at RS of these sizes, the fish inside it at FS
  const RS = 0.7;
  // in the fight the rings turn faster than they are built to (the runes racing round, the rings swinging over), the
  // wings beat deeper and quicker, and the tentacles of light are slimmer, and at rest shorter
  const SPIN_K = 1.6, TUMBLE_K = 1.4, TENT_W = 0.7, TENT_L = 0.72;
  const RINGS = [
    // all four of antique gold, a shade apart; their runes burn turquoise, and the ring whose stage it is takes that stage's light
    // each tumbles about a tilted axis of its own, so it swings right over, while its runes run round it; the outer ring
    // only rocks, wide, so it never sweeps through the wings
    { R: 2.6, w: 0.5, th: 0.24, n0: [0.15, -0.55, 0.82], axis: [0.62, 0.32, 0.72], tumbleV: 1.5, spinV: 2.6, runes: 8, metal: ['#E6B850', '#B07E22', '#6A4610', '#FFF2B8'], rune: '#5FFFE8' },
    { R: 3.6, w: 0.58, th: 0.26, n0: [0.16, 0.12, 0.98], axis: [0.8, 0.55, 0.2], tumbleV: -0.95, spinV: 2.8, runes: 10, metal: ['#E2B95A', '#AA7C28', '#674512', '#FFF0C0'], rune: '#7FB4FF' },
    { R: 4.7, w: 0.66, th: 0.28, n0: [-0.38, 0.25, 0.89], axis: [0.25, 0.9, 0.35], tumbleV: 0.75, spinV: -2.2, runes: 12, metal: ['#DDAF4C', '#A6751E', '#62400C', '#FCEBB0'], rune: '#C690FF' },
    { R: 5.9, w: 0.76, th: 0.3, n0: [0.22, 0.34, 0.914], axis: [0, 0, 1], tumbleV: 0.6, spinV: 1.4, runes: 8, metal: ['#EBC662', '#B88A30', '#725018', '#FFF6CC'], rune: '#FFF1C0' },
  ].map(r => Object.assign(r, { R: r.R * RS, w: r.w * RS, th: r.th * RS }));
  // the stages' light
  const STAGE = [
    { key: 'form', main: '#FFD36B', glow: '#5FFFE8', sky: ['#050916', '#0A1A30'], neb: '#2AD6C8', tent: ['#6A5CFF', '#4FA6FF', '#86F2FF'] },
    { key: 'motion', main: '#CFE0FF', glow: '#6FA8FF', sky: ['#040820', '#0E2056'], neb: '#3F6FFF', tent: ['#5A62FF', '#4C8CFF', '#A8D2FF'] },
    { key: 'memory', main: '#FFB4DC', glow: '#B98CFF', sky: ['#0A0518', '#26102E'], neb: '#B05CFF', tent: ['#9A5CFF', '#D07CFF', '#FFC8F0'] },
    { key: 'oblivion', main: '#FFF3C8', glow: '#FFF8E0', sky: ['#000000', '#020104'], neb: '#FFE9A8', tent: ['#C8A0FF', '#FFE0A0', '#FFFBEA'] },
  ];
  const GOLD = '#FFD36B', ECHO = '#B98CFF', INK = '#2A1A08';
  // the fish's palette: sky azure, a cream belly, gold star freckles
  const AZ = '#5FB4F0', AZ_SH = '#3A86D2', AZ_SH2 = '#2A68B4', AZ_HI = '#C2E8FF', SK_INK = '#12305E', BELLY = '#FBEFCF', BELLY_SH = '#E2C996', CREST = '#D6FAFF', PEARL = '#FFF6E2';
  // the fish's size, and the light on the gyroscope: the key light, the half-vector for the brushed metal, the view
  const FS = 0.7, WS = 0.75;
  // the fight's Bahamut is drawn at a little over three quarters of the size it is built (the Anima keeps its own size):
  // rings, fish and wings, and where its body can be struck, all scale together about the floor under it. (It was drawn a
  // fifth larger once; at that size its wings spanned twice the screen and a phone spent most of each frame on it)
  const BIG = 0.78;
  // every few seconds, swimming freely, the fish does a trick: a pirouette, then a barrel roll
  const TRICK = 4.4;
  const LD0 = norm3([-0.5, 0.45, 0.78]), VW0 = [0, CE, SE], HV0 = norm3([LD0[0], LD0[1] + CE, LD0[2] + SE]);
  let LD = LD0, VW = VW0, HV = HV0;
  /* the whole model can turn about its upright axis (the Anima turning round to face where it goes): points and
     directions are turned before they meet the camera, and the view and the light are turned the other way for
     anything lit or culled by a direction in the model. The fight itself never turns it (YAW stays 0) */
  let YAW = 0, YC = 1, YS = 0;
  const yawV = v => [v[0] * YC - v[1] * YS, v[0] * YS + v[1] * YC, v[2]];
  function setYaw(a) { YAW = a || 0; YC = Math.cos(YAW); YS = Math.sin(YAW); const back = v => [v[0] * YC + v[1] * YS, -v[0] * YS + v[1] * YC, v[2]]; LD = YAW ? back(LD0) : LD0; VW = YAW ? back(VW0) : VW0; HV = YAW ? back(HV0) : HV0; }
  // eight runes engraved round the rings (strokes in a unit square, x along the band, y outward)
  const circ = (cx, cy, r, n) => { const o = []; for (let i = 0; i <= (n || 10); i++) { const a = i / (n || 10) * TAU; o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };
  const GLYPHS = [
    [[[0, -1], [0, 0.35]], circ(0, 0.66, 0.3, 9)],
    [[[-0.8, -0.8], [0, 0.9], [0.8, -0.8], [-0.8, -0.8]]],
    [[[0, -1], [0, 1]], [[-0.62, 0.38], [0, 1], [0.62, 0.38]]],
    [[[0, 1], [0.7, 0], [0, -1], [-0.7, 0], [0, 1]], [[0, 0.45], [0, -0.45]]],
    [[[0, -1], [0, 0.85]], [[-0.7, 0.15], [-0.7, 0.85]], [[0.7, 0.15], [0.7, 0.85]], [[-0.7, 0.15], [0.7, 0.15]]],
    [(() => { const s = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * Math.PI * 3, r = 0.95 * (1 - i / 19); s.push([Math.cos(a) * r, Math.sin(a) * r]); } return s; })()],
    [circ(0, 0, 0.72, 12), [[-1, 0], [1, 0]], [[0, -1], [0, 1]]],
    [[[-1, -0.1], [-0.5, 0.45], [0, -0.1], [0.5, -0.65], [1, -0.1]], circ(0, 0.62, 0.16, 6)],
  ];
  function lerp(a, b, u) { return a + (b - a) * u; }
  function sstep(a, b, x) { const u = clamp((x - a) / (b - a), 0, 1); return u * u * (3 - 2 * u); }
  function lerp3(a, b, u) { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; }
  function norm3(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross3(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot3(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function add3(a, b, k) { return [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k]; }
  // turn v about a unit axis by an angle (Rodrigues)
  function rotAx(v, ax, a) { const k = norm3(ax), c = Math.cos(a), s = Math.sin(a), d = dot3(k, v), x = cross3(k, v); return [v[0] * c + x[0] * s + k[0] * d * (1 - c), v[1] * c + x[1] * s + k[1] * d * (1 - c), v[2] * c + x[2] * s + k[2] * d * (1 - c)]; }
  function angTo(a, b) { let d = b - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
  // which of the eight sectors an angle falls in (sector 0 is centred due east)
  function secOf(a) { return ((Math.round(a / SEC_A) % NSEC) + NSEC) % NSEC; }
  function sf(FX, k) { const s = FX.H.sfx; if (s && s[k]) s[k](); }
  return {
    // (its platform is a solid disc of star-stone, so the sky need not be laid down behind it)
    arenaR: 14.5, firstAct: 'float', artY: 0.66, ambient: 'wisps', floorDisc: true,
    artPoses: [
      { name: 'The Ring of Form: four tentacles risen', mem: { art: 1, lv: 1 }, lv: 1 },
      { name: 'The Ring of Motion: the spiral', mem: { art: 1, lv: 2 }, lv: 2 },
      { name: 'The Ring of Memory: the ghost arena', mem: { art: 1, lv: 3 }, lv: 3 },
      { name: 'The Ring of Oblivion: full length', mem: { art: 1, lv: 4 }, lv: 4 },
      { name: 'casting', mem: { art: 1, lv: 2, castK: 1 }, lv: 2 },
      { name: 'wrapped in its fins', mem: { art: 1, lv: 4, curl: 1 }, lv: 4 },
      { name: 'Wheel of Judgment: ring one stands', mem: { art: 1, lv: 1, wheel: 0.4 }, lv: 1 },
      { name: 'the golden corridor', mem: { art: 1, lv: 4, corr: 1 }, lv: 4 },
      { name: 'at rest, on the platform', mem: { art: 1, lv: 4, rest: 1 }, lv: 4 },
    ],
    phaseNames: ['The Ring of Form', 'The Ring of Motion', 'The Ring of Memory', 'The Ring of Oblivion'],
    carve(set, C) { },
    props(C) { return []; },
    /* ---- the summit: a round platform of night-blue star-stone inlaid with gold, eight sectors, an inner circle and an outer lane ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd;
      // the dark under the platform, and its carved side seen below the southern rim
      c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.ellipse(0.2, 1.7, R + 0.6, R + 0.35, 0, 0, TAU); c.fill();
      let g = c.createLinearGradient(0, R - 3, 0, R + 1.3); g.addColorStop(0, '#2C2A4E'); g.addColorStop(1, '#0A0916'); c.fillStyle = g; c.beginPath(); c.arc(0, 1.15, R, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,214,140,.25)'; c.lineWidth = 0.06; for (let i = 0; i < 46; i++) { const a = Math.PI * (0.04 + 0.92 * i / 45), x = Math.cos(a) * R, y = Math.sin(a) * R; c.beginPath(); c.moveTo(x, y + 0.15); c.lineTo(x, y + 1.05); c.stroke(); }
      // the top: night-blue stone, polished, lit from the upper left
      g = c.createRadialGradient(-R * 0.35, -R * 0.45, R * 0.05, 0, 0, R * 1.02); g.addColorStop(0, '#454B86'); g.addColorStop(0.55, '#2A2F5C'); g.addColorStop(1, '#181B3A'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R, 0, TAU); c.fill();
      // stone courses: rings of blocks, their joints staggered
      c.strokeStyle = 'rgba(150,160,235,.16)'; c.lineWidth = 0.05; const courses = [RCORE, 3.6, 4.9, RIN, 7.7, 9.2, 10.7, 12.3, R - 0.55];
      courses.forEach(r => { c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); });
      for (let k = 0; k < courses.length - 1; k++) { const r0 = courses[k], r1 = courses[k + 1], n = Math.round(r1 * 3.2); for (let i = 0; i < n; i++) { const a = (i + (k % 2) * 0.5) / n * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); } }
      // flecks of starlight in the stone, and a few of gold
      for (let i = 0; i < 360; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * (R - 0.4), k = rnd(); c.fillStyle = k < 0.5 ? 'rgba(220,230,255,.45)' : k < 0.62 ? 'rgba(255,214,120,.55)' : 'rgba(0,0,20,.25)'; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.025 + rnd() * 0.06, 0, TAU); c.fill(); }
      // the outer lane, a shade deeper
      c.fillStyle = 'rgba(4,4,24,.2)'; c.beginPath(); c.arc(0, 0, R - 0.55, 0, TAU); c.arc(0, 0, RIN, 0, TAU, true); c.fill();
      // gold inlay, dark under bright: the sector lines, the inner circle, the dais and the rim
      const inlay = (draw, w) => { c.lineCap = 'round'; c.strokeStyle = '#7A5418'; c.lineWidth = w + 0.1; c.beginPath(); draw(); c.stroke(); c.strokeStyle = '#E8C46A'; c.lineWidth = w; c.beginPath(); draw(); c.stroke(); c.strokeStyle = 'rgba(255,248,214,.8)'; c.lineWidth = w * 0.3; c.beginPath(); draw(); c.stroke(); };
      inlay(() => { for (let k = 0; k < NSEC; k++) { const a = (k + 0.5) * SEC_A; c.moveTo(Math.cos(a) * RCORE, Math.sin(a) * RCORE); c.lineTo(Math.cos(a) * (R - 0.55), Math.sin(a) * (R - 0.55)); } }, 0.12);
      inlay(() => { c.arc(0, 0, RIN, 0, TAU); }, 0.16);
      inlay(() => { c.moveTo(R - 0.55, 0); c.arc(0, 0, R - 0.55, 0, TAU); }, 0.2);
      inlay(() => { c.moveTo(RCORE, 0); c.arc(0, 0, RCORE, 0, TAU); }, 0.14);
      // diamonds where the sector lines cross the inner circle
      for (let k = 0; k < NSEC; k++) { const a = (k + 0.5) * SEC_A, x = Math.cos(a) * RIN, y = Math.sin(a) * RIN; c.fillStyle = '#7A5418'; c.beginPath(); c.moveTo(x, y - 0.42); c.lineTo(x + 0.32, y); c.lineTo(x, y + 0.42); c.lineTo(x - 0.32, y); c.closePath(); c.fill(); c.fillStyle = '#F2D27A'; c.beginPath(); c.moveTo(x, y - 0.3); c.lineTo(x + 0.22, y); c.lineTo(x, y + 0.3); c.lineTo(x - 0.22, y); c.closePath(); c.fill(); }
      // a rune for each sector in the outer lane, and a smaller one in the inner circle
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let k = 0; k < NSEC; k++) { const a = k * SEC_A; [[(RIN + R) / 2 + 0.4, 0.78, 0.15], [RIN * 0.68, 0.42, 0.1]].forEach(([d, s, w]) => { const x = Math.cos(a) * d, y = Math.sin(a) * d;
        [['#7A5418', w + 0.07], ['#E0BA5E', w]].forEach(([col, lw]) => { c.strokeStyle = col; c.lineWidth = lw; GLYPHS[k].forEach(st => { c.beginPath(); st.forEach(([gx, gy], i) => { const px = x + (Math.cos(a + Math.PI / 2) * gx - Math.cos(a) * gy) * s, py = y + (Math.sin(a + Math.PI / 2) * gx - Math.sin(a) * gy) * s; i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); }); }); }); }
      // the dais: an eight-pointed star in gold
      c.fillStyle = 'rgba(122,84,24,.35)'; c.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? RCORE * 0.42 : RCORE * 0.92; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill();
      inlay(() => { for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU, r = i % 2 ? RCORE * 0.42 : RCORE * 0.92; i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } }, 0.08);
      // the stage's light over the platform, painted into it (gone at dawn)
      const lv = A.lv || 1, wash = lv === 2 ? 'rgba(70,110,255,.07)' : lv === 3 ? 'rgba(170,80,255,.08)' : lv >= 4 ? 'rgba(0,0,0,.28)' : null;
      if (wash && !(A.FX && A.FX.mem && A.FX.mem.dawn > 0.01)) { c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = wash; c.fillRect(-R - 3, -R - 3, R * 2 + 6, R * 2 + 6); c.restore(); }
    },
    // the ground is painted afresh for each stage's light, and once more at dawn
    groundKey(FX) { const M = FX.mem || {}; return `${FX.S.lv}|${M.dawn > 0.01 ? 1 : 0}`; },
    skyKey(FX) { const M = FX.mem || {}; return `${Math.round((M.stars == null ? 1 : M.stars) * 20)}|${Math.round((M.dawn || 0) * 30)}`; },
    /* ---- the sky above the summit: deep space in each stage's light; the stars go out when it wakes; dawn at the end ---- */
    sky(c, W, H, t, cam, T, FX) {
      const M = (FX && FX.mem) || {}, lv = FX && FX.S ? clamp(FX.S.lv || 1, 1, 4) : 1, P = STAGE[lv - 1], stars = M.stars == null ? 1 : M.stars, dawn = M.dawn || 0, px = ((cam && cam.x) || 28) * 3, py = ((cam && cam.y) || 28) * 2;
      let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.sky[0]); g.addColorStop(1, P.sky[1]); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const x = ((i * 233 + 140 - px * 0.12) % (W + 400) + W + 400) % (W + 400) - 200, y = H * (0.18 + 0.2 * i) + Math.sin(t * 0.1 + i) * 20, r = 230 + i * 70; c.globalAlpha = (lv >= 4 ? 0.05 : 0.15) * (1 - dawn * 0.7); blitSized(c, glowSprite(i % 2 ? P.neb : P.glow), x - r, y - r, r * 2, r * 2); }
      if (lv >= 4 && dawn < 1) for (let i = 0; i < 26; i++) { const x = (i * 61 + Math.sin(i) * 40) % W, y = H - ((t * (14 + i % 5 * 6) + i * 97) % (H + 40)); c.globalAlpha = 0.5 * (1 - dawn) * (0.5 + 0.5 * Math.sin(t * 3 + i)); blitSized(c, glowSprite('#FFE9A8'), x - 6, y - 6, 12, 12); }
      c.restore();
      c.save(); c.fillStyle = '#FFFFFF'; for (let i = 0; i < 120; i++) { const x = ((i * 137.7 - px * 0.05) % W + W) % W, y = ((i * 89.3 - py * 0.05) % H + H) % H, tw = 0.5 + 0.5 * Math.sin(t * (1 + i % 5) + i), s = i % 9 === 0 ? 2.2 : 1.2; c.globalAlpha = Math.min(1, stars + dawn * 0.3) * tw * (i % 7 === 0 ? 1 : 0.6) * (1 - dawn * 0.6); c.fillRect(x, y, s, s); } c.restore();
      if (dawn > 0) {
        g = c.createLinearGradient(0, H * 0.2, 0, H); g.addColorStop(0, 'rgba(120,150,255,0)'); g.addColorStop(0.55, `rgba(255,160,150,${0.5 * dawn})`); g.addColorStop(1, `rgba(255,226,160,${0.95 * dawn})`); c.fillStyle = g; c.fillRect(0, 0, W, H);
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = dawn * 0.85; const sy = H * (1.02 - 0.22 * dawn); blitSized(c, glowSprite('#FFE3A0'), W * 0.5 - 260, sy - 260, 520, 520); c.globalAlpha = dawn; c.fillStyle = '#FFF4D6'; c.beginPath(); c.arc(W * 0.5, sy, 34, 0, TAU); c.fill(); c.restore();
      }
    },
    overlay(c, FX, t, T) {
      const M = FX.mem, m = FX.m; if (!m) return; const lv = FX.S.lv, W = c.canvas.width, H = c.canvas.height;
      // (the stage's light over the platform is painted into the ground itself)
      if (M.dawn > 0.01) { c.save(); const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(255,170,150,${0.12 * M.dawn})`); g.addColorStop(1, `rgba(255,214,150,${0.3 * M.dawn})`); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
      drawGhost(c, FX, M, T, t);
    },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m, C = FX.C; m.x = C.x; m.y = C.y; m.noTouch = true;
      Object.assign(M, { t: 0, bt: 0, intro: 0, eyes: 0, stars: 1, dawn: 0, white: 0, gap: 2.4, job: null, cyc: 0, sealCd: 13, sancCd: 9, recCd: 9, expose: 0, curl: 0, castK: 0, look: [0, 1], ghost: 0, ghostFall: 0, beams: [], lances: [], falls: [], obl: null, corr: 0, freeze: 0, rest: 0, lastLash: 0, lv: 1 });
      M.rings = RINGS.map((R, i) => ({ i, awake: 0, wake: 0, spin: i * 0.7, tumble: i * 1.3, dir: 1, aim: null, aimK: 0, quarters: [1, 1, 1, 1], stall: 0, heat: 0, pulse: 0, pulseDir: 0, stored: 0, lit: -1, blaze: [1, 1, 1, 1, 1, 1, 1, 1], draw: 0 }));
      M.tents = [];
      for (let i = 0; i < 8; i++) M.tents.push({ i, a: i * SEC_A, role: 'below', t: 0, P: null, lit: 0, alpha: 0.5, gone: 0, frz: null });
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H; M.lv = lv; endJob(FX); M.gap = 3.2; M.expose = 0; M.cyc = 0; clearWarns(FX);
      if (lv === 2) { M.trans = { k: 'motion', t: 0 }; H.banner('THE RING OF MOTION', 'The safe ground turns: move with it, and lay its lances behind you', STAGE[1].glow, 3, true); M.sancCd = 10; }
      if (lv === 3) { M.trans = { k: 'memory', t: 0 }; M.freeze = 2.6; H.banner('THE RING OF MEMORY', 'Gold strikes now. Violet strikes again: remember where', STAGE[2].glow, 3, true); M.recCd = 10; }
      if (lv === 4) { M.trans = { k: 'oblivion', t: 0 }; M.curl = 1; H.banner('THE RING OF OBLIVION', 'Every rule returns, two at a time', STAGE[3].main, 3, true); M.sancCd = 6; }
    },
    ai(FX, m, dt) {
      const M = FX.mem, lv = FX.S.lv, C = FX.C; m.x = C.x; m.y = C.y; M.lv = lv;
      M.t += dt; M.gap -= dt; M.sealCd -= dt; M.sancCd -= dt; M.recCd -= dt;
      if (M.obl) { if (!M.fail) stepOblivion(FX, m, dt); }
      else if (lv >= 4 && m.hp / m.maxhp <= 0.06 && !M.trans && !M.fail) startOblivion(FX, m);
      else if (M.job) { if (stepJob(FX, m, M.job, dt)) { endJob(FX); M.gap = lv >= 4 ? 1.3 : lv >= 2 ? 1.6 : 1.9; } }
      else if (M.gap <= 0 && M.expose <= 0 && M.freeze <= 0 && !M.trans) M.job = pickJob(FX, m, lv);
      FX.parts(bodyParts(FX, m, M));
    },
    stunned(FX, m, dt) { FX.parts(bodyParts(FX, FX.m, FX.mem)); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m || !M.rings) return; const lv = FX.S.lv;
      M.bt += dt;
      // the waking: its eyes open, the tentacles rise, and the stars go out
      if (m.act === 'enter') { M.intro += dt; M.eyes = sstep(0.8, 1.6, M.intro); M.stars = lerp(1, 0.3, sstep(1.5, 2.8, M.intro)); if (M.intro > 1.2) M.tents.forEach(T2 => { if (T2.i % 2 === 0 && T2.role === 'below') T2.role = 'rest'; }); if (M.intro > 2.0) M.rings[0].awake = 1; }
      else { M.eyes = Math.max(M.eyes, 1 - M.curl * 0.95); M.stars = lerp(M.stars, lv >= 4 ? 0 : 0.3, Math.min(1, dt)); M.rings[0].awake = 1; }
      if (M.trans) stepTrans(FX, M, dt);
      if (M.freeze > 0) M.freeze -= dt;
      if (M.expose > 0) M.expose -= dt;
      M.castK = Math.max(0, M.castK - dt * 0.8); M.flare = Math.max(0, (M.flare || 0) - dt * 0.9);
      if (!M.trans || M.trans.k !== 'oblivion') M.curl = Math.max(0, M.curl - dt * 0.6);
      M.ghost = lerp(M.ghost, lv === 3 && !M.ghostDone ? 1 : 0, Math.min(1, dt * 1.5)); if (M.ghostFall > 0) M.ghostFall = Math.min(2, M.ghostFall + dt);
      const me = FX.me, la = Math.atan2(me.y - m.y, me.x - m.x); M.look = [lerp(M.look[0], Math.cos(la), Math.min(1, dt * 3)), lerp(M.look[1], Math.sin(la), Math.min(1, dt * 3))];
      // the fish turns to face the pet, though never quite head-on: it keeps a three-quarter view toward the side it last swam
      // swimming freely it circles inside the smallest ring and, every few seconds, pirouettes or rolls right over
      { const sk = fishSwim(M); M.swimA = (M.swimA == null ? 0 : M.swimA) + dt * 1.25 * sk; M.tailPh = (M.tailPh || 0) + dt * (3.2 + 3.6 * sk);
        const tr = sstep(TRICK - 1.0, TRICK - 0.1, M.bt % TRICK), roll = Math.floor(M.bt / TRICK) % 2 === 1, flip = roll ? 0 : TAU * tr;
        const cur = M.fyaw == null ? -M.swimA : M.fyaw; let tg = Math.atan2(Math.cos(la), Math.sin(la)); if (Math.abs(angTo(0, tg)) < 0.6) tg = (Math.sin(cur) >= 0 ? 1 : -1) * 0.6;
        if (sk > 0.5) tg = -M.swimA + flip; M.fyaw = cur + angTo(cur, tg) * Math.min(1, dt * (sk > 0.5 ? 9 : 2.4));
        const r0 = M.froll || 0; M.froll = r0 + angTo(r0, sk > 0.5 && roll ? TAU * tr : 0) * Math.min(1, dt * 10); }
      stepRings(FX, M, dt, lv); stepTents(FX, M, dt, lv);
      M.beams = M.beams.filter(b => (b.t += dt) < b.life); M.lances = M.lances.filter(b => (b.t += dt) < b.life); M.falls = M.falls.filter(b => (b.t += dt) < b.life);
      if (M.wind) { M.wind.t -= dt; if (M.wind.t <= 0) M.wind = null; }
      if (M.fail) stepFail(FX, M, dt);
      if (M.end) stepEnding(FX, M, dt);
    },
    // its rings take blows as it does; once Oblivion is cast it shrugs them off, and it cannot fall at all until its jewel is struck down the golden corridor
    dmgK(FX, m, o) { const M = FX.mem, O = M.obl; if (M.end) return 0; if (O && O.corr) return 1.6; if (FX.S.lv >= 4 && m.hp <= m.maxhp * 0.03) return 0; if (O) { if (Math.random() < 0.05) FX.H.text(m.x, m.y - HC - 1.5, 'Oblivion gathers: break the runes!', STAGE[3].main, 13); return 0.12; } return M.expose > 0 ? 1.75 : 1; },
    onWeakHit(FX, key, dmg) { const M = FX.mem, m = FX.m; if (key === 'jewel' && M.obl && M.obl.corr) { m.hp = Math.min(m.hp, dmg * 0.5); M.finisher = true; } },
    draw(c, FX, m, X, Y, T, t) { if (FX.mem.end) return; drawBahamut(c, FX, m, X, Y, T, t); },
    dbgDraw(c, FX, m, X, Y, T, t) { drawBahamut(c, FX, m, X, Y, T, t); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'orune') drawRuneTarget(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFxAll(c, FX, T, t); },
    // Ophiuchus, the thirteenth Anima, is this same creature drawn small: see miniMake
    mini: { make: miniMake, step: miniStep, pose: miniPose, draw: miniDraw, get PAIRS() { return wingPairs(); } },
    ending(FX, m) { const M = FX.mem; M.end = { t: 0 }; endJob(FX); clearWarns(FX); if (M.obl) { M.obl.objs.forEach(o => { o.dead = true; }); M.obl = null; } return { title: 'TOWER OF OBLIVION — CONQUERED', sub: 'At peace, Bahamut joins you: Ophiuchus, the thirteenth Anima', col: '#FFE9A8', delay: 9, bannerAt: 5.2, fanfareAt: 5.2, quiet: true, slow: 0.3 }; },
  };
  /* ---- jobs: an attack is a short timeline of cues; a signature runs its own step ---- */
  function job(name, end, ev, tick, o) { return Object.assign({ name, t: 0, end, ev: ev.sort((a, b) => a[0] - b[0]), i: 0, tick }, o || {}); }
  function stepJob(FX, m, J, dt) { J.t += dt; while (J.i < J.ev.length && J.ev[J.i][0] <= J.t) { J.ev[J.i][1](FX, m, J); J.i++; } if (J.tick) J.tick(FX, m, J, dt); return !J.hold && J.t >= J.end && J.i >= J.ev.length; }
  function endJob(FX) { const M = FX.mem; if (M.job && M.job.stop) M.job.stop(FX, M.job); M.job = null; }
  function clearWarns(FX) { FX.S.hz.forEach(z => { if (z.bw) { z.cut = true; z.life = Math.min(z.life, z.age + 0.3); } }); }
  function pickJob(FX, m, lv) {
    // each stage opens with its first attack and turns through the four in order, its signature coming round on its own clock
    const M = FX.mem, i = M.cyc++ % 4;
    if (lv === 1) { if (M.sealCd <= 0) return fourfoldSeal(FX, m); return [heavensLash, wheelJob, breathOfCreation, featherStorm][i](FX, m); }
    if (lv === 2) { if (M.sancCd <= 0) return sanctuary(FX, m, 8); return [scythe, firmament, tidalHalo, haloDiscus][i](FX, m); }
    if (lv === 3) { if (M.recCd <= 0) return record(FX, m); return [rememberedPain, yesterdaysHeaven, borrowedTomorrow, cageEcho][i](FX, m); }
    return [procession, lastHorizon, eightfoldRuin, wingsAndRings][i](FX, m);
  }
  /* ---- warnings on the floor, which strike when their time comes ----
     shapes: circle (x y r), line (x y a len w), beam (a w: a line through the centre), zone (r0 r1 about the centre),
     sectors (set r0 r1). Styles: 'gold' strikes now, 'echo' (violet, counting down) strikes again, 'lance' tracks the pet. */
  function warn(FX, o) {
    const C = FX.C, z = FX.hz(Object.assign({ kind: 'bw', bw: true, x: C.x, y: C.y, life: o.t + (o.linger == null ? 0.55 : o.linger), dps: 0, style: 'gold' }, o));
    z.draw = drawWarn;
    z.update = (dt, zz) => { if (o.upd) o.upd(dt, zz); if (!zz.fired && zz.age >= zz.t) { zz.fired = true; if (zz.cut) return; const me = FX.me; if (zz.dmg && inWarn(FX, zz, me.x, me.y, me.r)) FX.hurt(zz.dmg); sf(FX, zz.style === 'echo' ? 'twang' : zz.snd || 'thud'); if (zz.fn) zz.fn(FX, zz); } };
    return z;
  }
  function inWarn(FX, z, x, y, r) {
    const C = FX.C, dx = x - C.x, dy = y - C.y, d = Math.hypot(dx, dy);
    if (z.shape === 'circle') return Math.hypot(x - z.x, y - z.y) < z.r + r;
    if (z.shape === 'line') { const rx = x - z.x, ry = y - z.y, al = rx * Math.cos(z.a) + ry * Math.sin(z.a), of = Math.abs(-rx * Math.sin(z.a) + ry * Math.cos(z.a)); return al > -r && al < z.len + r && of < z.w / 2 + r; }
    if (z.shape === 'beam') return Math.abs(-dx * Math.sin(z.a) + dy * Math.cos(z.a)) < z.w / 2 + r;
    if (z.shape === 'zone') return d > z.r0 - r && d < z.r1 + r;
    if (z.shape === 'sectors') return d >= (z.r0 == null ? 0 : z.r0) - r && d <= (z.r1 == null ? 99 : z.r1) + r && (d < RCORE * 0.5 ? !!z.core : z.set.includes(secOf(Math.atan2(dy, dx))));
    return false;
  }
  function cutAt(FX, x, y) { FX.S.hz.forEach(z => { if (z.bw && !z.fired && z.shape === 'circle' && Math.hypot(z.x - x, z.y - y) < 0.5) { z.cut = true; z.life = Math.min(z.life, z.age + 0.3); } }); }
  /* ---- the attack pieces ---- */
  // a free fighting tentacle nearest an angle
  function grab(M, a, ok) { const free = M.tents.filter(T2 => !T2.gone && !T2.dur && T2.role !== 'below' && T2.role !== 'frozen' && (!ok || ok(T2))); if (!free.length) return null; free.sort((p, q) => Math.abs(angTo(p.a, a)) - Math.abs(angTo(q.a, a))); return free[0]; }
  function act(T2, role, data, dur) { if (!T2) return; T2.role = role; T2.data = data; T2.t = 0; T2.dur = dur; T2.lit = 1; }
  // a tentacle raised over a point, then brought down on it
  function slamAt(FX, m, x, y, r, tS, o) {
    const M = FX.mem, C = FX.C; o = o || {}; const T2 = o.noTent ? null : grab(M, Math.atan2(y - C.y, x - C.x));
    act(T2, 'slam', { x, y, tS }, tS + 0.7);
    return warn(FX, { shape: 'circle', x, y, r, t: tS, dmg: m.dmg * (o.dmgK || 1.4), label: o.label || '', snd: 'crash', style: o.style || 'gold', fn: (FX2, z) => { FX.H.boom(x, y, r * 0.85, o.style === 'echo' ? ECHO : GOLD, '#FFFFFF', { n: 18, shake: 10, smoke: 6 }); if (o.echo) echoAt(FX, m, { shape: 'circle', x, y, r }, o.echo, o.echoK); if (o.after) o.after(z); } });
  }
  // a violet echo of a strike: its outline counts down, then it strikes again in the same place
  function echoAt(FX, m, shape, delay, dmgK) {
    const M = FX.mem, C = FX.C, T2 = shape.shape === 'circle' ? grab(M, Math.atan2(shape.y - C.y, shape.x - C.x)) : null;
    return warn(FX, Object.assign({ t: delay, dmg: m.dmg * (dmgK || 1.3), style: 'echo', col: ECHO,
      upd: (dt, z) => { if (T2 && !z.raised && z.t - z.age < 1.3) { z.raised = true; act(T2, 'slam', { x: z.x, y: z.y, tS: z.t - z.age }, z.t - z.age + 0.7); } if (z.shape === 'beam' && !z.aimed && z.t - z.age < 1.6) { z.aimed = true; const R1 = M.rings[0]; R1.aim = [Math.sin(z.a), -Math.cos(z.a), 0]; R1.aimT = 1; } },
      fn: (FX2, z) => { if (z.shape === 'beam') { M.beams.push({ a: z.a, w: z.w, t: 0, life: 0.6, col: '#E8C8FF' }); M.rings[0].aimT = 0; } else if (z.shape === 'circle') FX.H.boom(z.x, z.y, z.r * 0.8, ECHO, '#FFFFFF', { n: 14, shake: 8, smoke: 4 }); else eruptFx(FX, z, true); } }, shape));
  }
  // the Wheel of Judgment: ring one stands on edge along the beam's line, then the beam crosses the centre
  function judgment(FX, m, a, tS, o) {
    const M = FX.mem, R1 = M.rings[0]; o = o || {}; R1.aim = [Math.sin(a), -Math.cos(a), 0]; R1.aimT = 1; M.castK = 1; sf(FX, 'hum');
    return warn(FX, { shape: 'beam', a, w: 3.6, t: tS, hide: Math.min(1.0, tS * 0.45), dmg: m.dmg * (o.dmgK || 1.5), label: o.label == null ? 'JUDGMENT' : o.label, snd: 'crash', style: o.style || 'gold', fn: (FX2, z) => { M.beams.push({ a: z.a, w: z.w, t: 0, life: 0.6, col: z.style === 'echo' ? '#E8C8FF' : '#FFF4D0' }); FX.H.shake(10, 0.4); R1.aimT = 0; if (o.echo) echoAt(FX, m, { shape: 'beam', a: z.a, w: z.w }, o.echo, 1.4); } });
  }
  function erupt(FX, m, inner, tS, o) { o = o || {}; const C = FX.C; return warn(FX, { shape: 'zone', r0: inner ? 0 : RIN, r1: inner ? RIN : C.R + 0.6, t: tS, dmg: m.dmg * (o.dmgK || 1.45), label: o.label == null ? (inner ? 'INNER' : 'OUTER') : o.label, style: o.style || 'gold', snd: 'crash', fn: (FX2, z) => { eruptFx(FX, z, z.style === 'echo'); if (o.echo) echoAt(FX, m, { shape: 'zone', r0: z.r0, r1: z.r1 }, o.echo, 1.4); } }); }
  function eruptFx(FX, z, echo) { const C = FX.C; FX.H.shake(9, 0.4); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU + Math.random() * 0.3, d = lerp(Math.max(0.5, z.r0), z.r1 - 0.4, Math.random()); FX.H.part && FX.H.part({ kind: 'spark', x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d, vx: 0, vy: -4, life: 0.8, max: 0.8, size: 4, color: echo ? ECHO : GOLD }); } }
  function sectorStrike(FX, m, set, tS, o) { o = o || {}; return warn(FX, { shape: 'sectors', set, r0: o.r0 == null ? RCORE * 0.5 : o.r0, r1: FX.C.R + 0.6, core: o.core, t: tS, hide: o.hide, dmg: m.dmg * (o.dmgK || 1.4), label: o.label || '', style: o.style || 'gold', snd: 'crash', fn: (FX2, z) => { if (o.tents !== false) set.forEach(s => { const T2 = FX.mem.tents.find(T3 => secOf(T3.a) === s && !T3.gone); if (T2) T2.lit = 1; }); FX.H.shake(8, 0.3); } }); }
  // a golden lance: it tracks the pet, locks in place, then falls
  function lance(FX, m, o) {
    const me = FX.me, M = FX.mem; sf(FX, 'blip');
    return warn(FX, { shape: 'circle', x: me.x, y: me.y, r: o.r || 1.5, t: o.track + o.lock, trackT: o.track, dmg: m.dmg * (o.dmgK || 1.2), style: 'lance', col: '#FFE9A8', label: 'LANCE', linger: 0.45, snd: 'crash',
      upd: (dt, z) => { if (z.age < o.track) { z.x = lerp(z.x, me.x, Math.min(1, dt * 7)); z.y = lerp(z.y, me.y, Math.min(1, dt * 7)); } else if (!z.locked) { z.locked = true; sf(FX, 'crack'); } },
      fn: (FX2, z) => { M.lances.push({ x: z.x, y: z.y, t: 0, life: 0.6 }); FX.H.boom(z.x, z.y, 1.5, '#FFE9A8', '#FFFFFF', { n: 14, shake: 6, smoke: 3 }); if (o.onFire) o.onFire(z.x, z.y); if (o.pool) FX.hz({ kind: 'lpool', bw: true, shape: 'circle', x: z.x, y: z.y, r: 1.8, life: 8.5, dps: m.dmg * 0.55, tick: 0.35, col: '#FFE9A8', draw: drawPool }); } });
  }
  // the expanding wave of the Breath of Creation, with one break in it
  function wave(FX, m, gap, speed, o) {
    const C = FX.C; o = o || {};
    return FX.hz({ kind: 'wave', bw: true, x: C.x, y: C.y, r: 1.2, gap, gw: o.gw || 0.42, speed, life: (C.R + 1.5) / speed, dps: 0, hit: false, col: o.col || '#FFF4D0', draw: drawWave,
      update: (dt, z) => { z.r = 1.2 + z.age * z.speed; const me = FX.me, dx = me.x - C.x, dy = me.y - C.y, d = Math.hypot(dx, dy); if (!z.hit && !z.cut && Math.abs(d - z.r) < 0.55 + me.r) { const inGap = Math.abs(angTo(z.gap, Math.atan2(dy, dx))) < z.gw - me.r / Math.max(1, d) * 0.6; if (!inGap) { z.hit = true; FX.hurt(m.dmg * 1.3); } } } });
  }
  // a ring stalls: it stops, its light gutters, and the fish lies exposed
  function stallRing(FX, m, k, secs, title) { const M = FX.mem, S = M.rings[k]; S.stall = 1; M.expose = secs; M.castK = 0; FX.H.banner(title, 'Its light gutters: strike while it lies exposed!', STAGE[k].glow, 2.4, true); FX.H.shake(10, 0.5); sf(FX, 'crash'); }
  /* ---- I: the Ring of Form ---- */
  function heavensLash(FX, m) {
    const M = FX.mem, C = FX.C, me = FX.me, k = 1 / FX.S.fast, first = M.lastLash++ === 0, n = first ? 2 : 4, ev = [], R = C.R + 1.5, pa = Math.atan2(me.y - C.y, me.x - C.x);
    const times = first ? [2.1, 2.6] : [1.6, 1.95, 2.9, 3.25];
    for (let j = 0; j < n; j++) {
      const a = pa + Math.PI / 2 + (j % 2 ? 0.55 : -0.55) + (j >= 2 ? Math.PI / 2 : 0) + (Math.random() - 0.5) * 0.4, nx = -Math.sin(a), ny = Math.cos(a), off = ((me.x - C.x) * nx + (me.y - C.y) * ny) + (Math.random() - 0.5) * 2.5;
      const cx = C.x + nx * off, cy = C.y + ny * off, x0 = cx - Math.cos(a) * R, y0 = cy - Math.sin(a) * R, x1 = cx + Math.cos(a) * R, y1 = cy + Math.sin(a) * R, tS = times[j] * k;
      ev.push([0.15 * j, () => { const T2 = grab(M, Math.atan2(y1 - C.y, x1 - C.x)); act(T2, 'lash', { x0, y0, x1, y1, tS: tS - 0.15 * j }, tS - 0.15 * j + 0.7);
        warn(FX, { shape: 'line', x: x0, y: y0, a, len: R * 2, w: 2.3, t: tS - 0.15 * j, dmg: m.dmg * 1.3, label: j === 0 ? "HEAVEN'S LASH" : '', snd: 'crash', fn: (FX2, z) => { for (let i = 0; i < 9; i++) { const u = i / 8; FX.H.sparks(lerp(x0, x1, u), lerp(y0, y1, u), GOLD, 4, 5); } FX.H.shake(8, 0.25); } }); }]);
    }
    return job('lash', times[n - 1] * k + 0.8, ev);
  }
  function wheelJob(FX, m) { const C = FX.C, me = FX.me, k = 1 / FX.S.fast, a = Math.atan2(me.y - C.y, me.x - C.x); return job('wheel', 2.4 * k + 0.9, [[0, () => judgment(FX, m, a, 2.4 * k)]]); }
  function breathOfCreation(FX, m) {
    const M = FX.mem, C = FX.C, k = 1 / FX.S.fast, gap = Math.random() * TAU, inhale = 1.4 * k, speed = 6.5;
    return job('breath', inhale + (C.R + 1) / speed + 0.4, [
      [0, () => { M.castK = 1; sf(FX, 'hum'); FX.hz({ kind: 'gapmark', bw: true, x: C.x, y: C.y, a: gap, life: inhale + (C.R + 1) / speed, dps: 0, draw: drawGapMark }); say(FX, C.x, C.y - HC - 2.2, 'BREATH OF CREATION', '#FFF4D0', 15); }],
      [inhale, () => { sf(FX, 'whoosh'); wave(FX, m, gap, speed); }],
    ]);
  }
  /* the Fourfold Seal: four rune marks, each the target of a coming tentacle strike; bait the golden lance onto them */
  function fourfoldSeal(FX, m) {
    const M = FX.mem, C = FX.C, k = 1 / FX.S.fast;
    const seals = [0, 1, 2, 3].map(i => { const a = Math.PI / 4 + i * Math.PI / 2, d = 9.6, tm = (9 + i * 3) * k; return { i, a, x: C.x + Math.cos(a) * d, y: C.y + Math.sin(a) * d, broken: false, tm, tm0: tm }; });
    M.seals = seals; M.rings[0].quarters = [1, 1, 1, 1];
    FX.H.banner('THE FOURFOLD SEAL', 'Bait the golden lance onto the four rune marks, then step away', GOLD, 2.6, true);
    const hz = FX.hz({ kind: 'seals', bw: true, x: C.x, y: C.y, life: 999, dps: 0, seals, draw: drawSeals });
    return job('seal', 0, [], (FX2, m2, J, dt) => {
      J.lt = (J.lt == null ? 1.8 : J.lt) - dt;
      if (J.lt <= 0 && !J.done) { J.lt = 3.4 * k; lance(FX, m, { track: 1.7 * k, lock: 1.0 * k, r: 1.5, onFire: (x, y) => { const s = seals.find(s2 => !s2.broken && Math.hypot(s2.x - x, s2.y - y) < 2.0); if (s) { s.broken = true; M.rings[0].quarters[s.i] = 0; cutAt(FX, s.x, s.y); say(FX, s.x, s.y - 1.6, 'SEAL SHATTERED', GOLD, 16); FX.H.sparks(s.x, s.y, '#5FFFE8', 22, 7); sf(FX, 'crack'); } } }); }
      seals.forEach(s => { if (s.broken || J.done) return; s.tm -= dt; if (s.tm <= 2.2 * k && !s.raised) { s.raised = true; slamAt(FX, m, s.x, s.y, 3.0, 2.2 * k, { label: 'STRIKE', dmgK: 1.5 }); } if (s.tm <= 0) { s.tm = s.tm0; s.raised = false; } });
      if (!J.done && seals.every(s => s.broken)) { J.done = true; J.dt = 0; stallRing(FX, m, 0, 9, 'THE RING OF FORM STALLS'); M.sealCd = 34 * k; }
      if (J.done) { J.dt += dt; if (J.dt > 0.4) J.hold = false; }
      if (!J.done && J.t > 38) { J.hold = false; M.sealCd = 20 * k; }
    }, { hold: true, stop: () => { hz.life = 0; M.seals = null; } });
  }
  /* ---- II: the Ring of Motion ---- */
  function scythe(FX, m) {
    const M = FX.mem, C = FX.C, me = FX.me, k = 1 / FX.S.fast, dir = Math.random() < 0.5 ? 1 : -1, a0 = Math.atan2(me.y - C.y, me.x - C.x) - dir * 1.25, warnT = 1.7 * k, dur = 3.4 * k, sweep = Math.PI + 0.7;
    const T1 = grab(M, a0), T2 = grab(M, a0 + Math.PI, X => X !== T1);
    return job('scythe', warnT + dur + 0.5, [[0, () => { sf(FX, 'hum'); say(FX, C.x, C.y - HC - 2.2, 'CELESTIAL SCYTHE', STAGE[1].glow, 15);
      FX.hz({ kind: 'scythe', bw: true, x: C.x, y: C.y, life: warnT + dur + 0.3, dps: 0, a0, dir, warnT, dur, sweep, ang: a0, hits: {}, draw: drawScythe,
        update: (dt, z) => { const u = clamp((z.age - warnT) / dur, 0, 1); z.ang = a0 + dir * sweep * u; [T1, T2].forEach((T3, b) => { const ba = z.ang + b * Math.PI; if (T3) act(T3, 'sweep', { a: ba, dir }, warnT + dur - z.age + 0.4);
          if (z.age > warnT && z.age < warnT + dur && !z.hits[b] && !z.cut) { const dx = me.x - C.x, dy = me.y - C.y, d = Math.hypot(dx, dy); if (d > RIN - 0.3 && Math.abs(angTo(ba, Math.atan2(dy, dx))) < 0.17 + me.r / Math.max(1, d)) { z.hits[b] = true; FX.hurt(m.dmg * 1.35); } } }); } }); }]]);
  }
  function firmament(FX, m) {
    const M = FX.mem, me = FX.me, k = 1 / FX.S.fast, ev = [];
    for (let v = 0; v < 3; v++) ev.push([v * 0.95 * k, () => { const p = FX.clampArena({ x: me.x, y: me.y }, 0.8); warn(FX, { shape: 'circle', x: p.x, y: p.y, r: 2.1, t: 1.25 * k, dmg: m.dmg * 1.15, label: v === 0 ? 'FALLING FIRMAMENT' : '', snd: 'crash', fn: (FX2, z) => FX.H.boom(z.x, z.y, 1.9, '#CFE0FF', '#FFFFFF', { n: 16, shake: 7, smoke: 4 }) }); M.falls.push({ x: p.x, y: p.y, t: 0, life: 1.25 * k }); }]);
    return job('firmament', 2 * 0.95 * k + 1.25 * k + 0.6, ev);
  }
  function tidalHalo(FX, m) {
    const M = FX.mem, k = 1 / FX.S.fast, inward = Math.random() < 0.5, t1 = 2.2 * k, t2 = t1 + 1.7 * k;
    return job('halo', t2 + 0.6, [
      [0, () => { M.rings[1].pulse = 1; M.rings[1].pulseDir = inward ? -1 : 1; sf(FX, 'hum'); say(FX, FX.C.x, FX.C.y - HC - 2.2, inward ? 'TIDAL HALO: INWARD' : 'TIDAL HALO: OUTWARD', STAGE[1].glow, 15); }],
      [0.6 * k, () => erupt(FX, m, inward, t1 - 0.6 * k)],
      [t1, () => erupt(FX, m, !inward, t2 - t1)],
    ]);
  }
  /* the Turning Sanctuary: six sectors go dark, two stay safe, and the safe pair turns round one sector at a time */
  function sanctuary(FX, m, steps, o) {
    const M = FX.mem, C = FX.C, me = FX.me, k = 1 / FX.S.fast, dir = Math.random() < 0.5 ? 1 : -1; o = o || {};
    const s0 = secOf(Math.atan2(me.y - C.y, me.x - C.x)), S = { safe: [s0, (s0 + dir + NSEC) % NSEC], next: -1, dir, n: 0, t: -(o.lead || 2.4) * k, stepT: (o.stepT || 2.7) * k, steps, dark: 0, tick: 0.5 };
    if (!o.quiet) FX.H.banner('THE TURNING SANCTUARY', 'Two sectors stay safe and turn round: follow them, and lay its lances behind you', STAGE[1].glow, 2.6, true);
    const hz = FX.hz({ kind: 'sanct', bw: true, x: C.x, y: C.y, life: 999, dps: 0, S, draw: drawSanct });
    return job('sanct', 0, [], (FX2, m2, J, dt) => {
      S.t += dt; S.dark = Math.min(1, S.dark + dt * 0.7);
      if (S.t >= 0 && S.n < S.steps) { const into = S.t - S.n * S.stepT;
        if (into >= 0 && S.next < 0 && !S.lit) { S.lit = true; S.next = (S.safe[1] + S.dir + NSEC) % NSEC; sf(FX, 'sparkle'); }
        if (into >= S.stepT * 0.5 && S.lit) { S.lit = false; S.safe = [S.safe[1], S.next]; S.next = -1; S.n++; if (o.onStep) o.onStep(FX, S); if (S.n >= S.steps) S.endT = 1.2; } }
      if (S.endT != null) { S.endT -= dt; S.dark = Math.max(0, S.dark - dt * 2); }
      // in the dark it burns; the dais at the centre burns too
      S.tick -= dt; if (S.t > 0.4 && S.endT == null && S.tick <= 0) { S.tick = 0.5; const dx = me.x - C.x, dy = me.y - C.y, d = Math.hypot(dx, dy), sc = secOf(Math.atan2(dy, dx)), safe = d > RCORE * 0.6 && (S.safe.includes(sc) || sc === S.next); if (!safe) FX.hurt(m.dmg * 0.55, { dot: true }); }
      M.rings[1].heat = S.n / S.steps;
      if (!o.noLances && S.endT == null) { J.lt = (J.lt == null ? 2.2 : J.lt) - dt; if (J.lt <= 0) { J.lt = 3.2 * k; lance(FX, m, { track: 2.1 * k, lock: 1.2 * k, r: 1.4, pool: true, dmgK: 1 }); } }
      if (S.endT != null && S.endT <= 0) { J.hold = false; if (o.onDone) o.onDone(FX, m); else { stallRing(FX, m, 1, 10, 'THE RING OF MOTION OVERHEATS'); M.sancCd = 42 * k; } }
    }, { hold: true, S, stop: () => { hz.life = 0; M.rings[1].heat = 0; } });
  }
  /* ---- III: the Ring of Memory ---- */
  function rememberedPain(FX, m) {
    const me = FX.me, k = 1 / FX.S.fast, p = FX.clampArena({ x: me.x, y: me.y }, 1), tS = 1.5 * k, delay = 4.0 * k;
    return job('pain', tS + delay + 0.7, [[0, () => { slamAt(FX, m, p.x, p.y, 2.5, tS, { label: 'REMEMBERED PAIN', echo: delay, echoK: 1.3 }); }]]);
  }
  function yesterdaysHeaven(FX, m) { const C = FX.C, me = FX.me, k = 1 / FX.S.fast, a = Math.atan2(me.y - C.y, me.x - C.x); return job('yesterday', 2.4 * k + 4.6 * k + 0.8, [[0, () => judgment(FX, m, a, 2.4 * k, { label: "YESTERDAY'S HEAVEN", echo: 4.6 * k })]]); }
  function pattern(avoid) { const out = []; let s = Math.floor(Math.random() * NSEC); while (out.length < 3) { s = (s + 2 + (Math.random() < 0.3 ? 1 : 0)) % NSEC; if (!out.includes(s) && !(avoid || []).includes(s)) out.push(s); else s = (s + 1) % NSEC; } return out; }
  function borrowedTomorrow(FX, m) {
    const k = 1 / FX.S.fast, A = pattern(), B = pattern(A), C = FX.C;
    return job('borrowed', 5.4 * k + 0.7, [
      [0, () => { FX.hz({ kind: 'preview', bw: true, x: C.x, y: C.y, set: A, col: GOLD, life: 1.3 * k, dps: 0, draw: drawPreview }); say(FX, C.x, C.y - HC - 2.2, 'BORROWED TOMORROW', STAGE[2].glow, 15); sf(FX, 'sparkle'); }],
      [1.4 * k, () => { FX.hz({ kind: 'preview', bw: true, x: C.x, y: C.y, set: B, col: ECHO, life: 1.3 * k, dps: 0, draw: drawPreview }); sf(FX, 'twang'); }],
      [2.8 * k, () => { sectorStrike(FX, m, A, 1.1 * k, { hide: 0.4 * k, label: 'FIRST' }); sectorStrike(FX, m, B, 2.5 * k, { hide: 1.7 * k, style: 'echo', label: 'SECOND' }); }],
    ]);
  }
  /* Oblivion's Record: three attacks, each stored as a rune on ring three, then played back in reverse */
  function record(FX, m) {
    const M = FX.mem, C = FX.C, me = FX.me, k = 1 / FX.S.fast, R3 = M.rings[2], inner = Math.random() < 0.5, pa = Math.atan2(me.y - C.y, me.x - C.x);
    const p1 = FX.clampArena({ x: me.x, y: me.y }, 1), p2 = FX.clampArena({ x: C.x - (me.x - C.x) * 0.9, y: C.y - (me.y - C.y) * 0.9 }, 1), ba = pa + 0.5;
    R3.stored = 0; R3.lit = -1;
    return job('record', 19.6 * k, [
      [0, () => { FX.H.banner("OBLIVION'S RECORD", 'It records three attacks, then plays them back in reverse', STAGE[2].glow, 2.6, true); M.castK = 1; }],
      [1.2 * k, () => { slamAt(FX, m, p1.x, p1.y, 2.6, 1.6 * k, { label: 'ONE' }); slamAt(FX, m, p2.x, p2.y, 2.6, 1.6 * k, { label: '' }); }],
      [2.8 * k, () => { R3.stored = 1; sf(FX, 'sparkle'); }],
      [3.6 * k, () => erupt(FX, m, inner, 2.0 * k, { label: inner ? 'TWO: INNER' : 'TWO: OUTER' })],
      [5.6 * k, () => { R3.stored = 2; sf(FX, 'sparkle'); }],
      [6.4 * k, () => judgment(FX, m, ba, 2.4 * k, { label: 'THREE' })],
      [8.8 * k, () => { R3.stored = 3; sf(FX, 'sparkle'); say(FX, C.x, C.y - HC - 2.4, 'IT PLAYS THEM BACK, LAST FIRST', ECHO, 15); }],
      [9.8 * k, () => { R3.lit = 2; echoAt(FX, m, { shape: 'beam', a: ba, w: 3.6, label: 'THREE' }, 2.3 * k, 1.4); }],
      [12.8 * k, () => { R3.lit = 1; echoAt(FX, m, { shape: 'zone', r0: inner ? 0 : RIN, r1: inner ? RIN : C.R + 0.6, label: 'TWO' }, 2.3 * k, 1.4); }],
      [15.8 * k, () => { R3.lit = 0; echoAt(FX, m, { shape: 'circle', x: p1.x, y: p1.y, r: 2.6, label: 'ONE' }, 2.3 * k, 1.4); echoAt(FX, m, { shape: 'circle', x: p2.x, y: p2.y, r: 2.6 }, 2.3 * k, 1.4); }],
      [18.8 * k, () => { R3.lit = -1; R3.stored = 0; R3.stall = 1; M.ghostDone = true; M.ghostFall = 0.01; M.expose = 10; FX.H.banner('THE RECORD IS SPENT', 'The ghostly arena falls to pieces, and it lies exposed: strike!', STAGE[2].glow, 2.4, true); sf(FX, 'crash'); M.recCd = 44 * k; }],
    ]);
  }
  /* ---- three more: the wings loose their feathers, the Ring of Motion throws its light, the tentacles close a cage ---- */
  // where a wing's feathers fly from: the middle of the wing, where the floor sees it (sd: -1 left, 1 right)
  function wingFrom(FX, m, M, sd) { return eqOf(m, M, wingW(M, FX.S.lv || 1, sd, [m.x, m.y, hcOf(M)])(3.0, 0.9)); }
  /* the Feather Storm (I): the wings rise and beat hard, and from each a fan of feathers flies at the pet, three volleys,
     each aimed where it stands then: keep moving across their line */
  function featherStorm(FX, m, o) {
    const M = FX.mem, k = 1 / FX.S.fast; o = o || {}; const n = o.volleys || 3, gap = (o.gap || 0.55) * k, lead = 1.0 * k, ev = [];
    ev.push([0, () => { M.flare = 1; if (!o.quiet) say(FX, FX.C.x, FX.C.y - HC - 2.2, 'FEATHER STORM', '#F4F8FF', 15); sf(FX, 'whoosh'); }]);
    for (let v = 0; v < n; v++) ev.push([lead + v * gap, () => { const me = FX.me; M.flare = 1;
      [-1, 1].forEach(sd => { const p = wingFrom(FX, m, M, sd), a = Math.atan2(me.y - p.y, me.x - p.x) + (v % 2 ? 0.12 : -0.12) * sd; FX.fan(p.x, p.y, a, 5, 0.62, o.speed || 8.5, { style: 'feather', color: '#E8F2FF', core: '#FFFFFF', r: 0.22, dmg: m.dmg * 0.6, life: 3.2 }); });
      sf(FX, 'blip'); }]);
    return job('feathers', lead + (n - 1) * gap + 1.2, ev);
  }
  /* the Halo Discus (II): the Ring of Motion flares and throws three halos of its light down lanes marked on the floor;
     they fly out past the pet and swing back home, so each is stepped round twice. Two throws, the second between the first */
  function haloDiscus(FX, m, o) {
    const M = FX.mem, C = FX.C, k = 1 / FX.S.fast; o = o || {}; const throws = o.throws || 2, lead = 1.15 * k, gap = 1.75 * k, fan = [-0.42, 0, 0.42], ev = [];
    ev.push([0, () => { M.rings[1].pulse = 1; M.rings[1].pulseDir = 1; if (!o.quiet) say(FX, C.x, C.y - HC - 2.2, 'HALO DISCUS', STAGE[1].glow, 15); sf(FX, 'hum'); }]);
    for (let w = 0; w < throws; w++) {
      const T0 = { a: 0 }, off = w % 2 ? 0.21 : 0;
      ev.push([w * gap, () => { const me = FX.me; T0.a = Math.atan2(me.y - C.y, me.x - C.x) + off; fan.forEach(da => warn(FX, { shape: 'line', x: C.x, y: C.y, a: T0.a + da, len: C.R, w: 1.6, t: lead, linger: 0, dmg: 0, style: 'gold', snd: 'whoosh' })); }]);
      ev.push([w * gap + lead, () => { fan.forEach(da => { const a = T0.a + da; FX.H.eshot(C.x + Math.cos(a) * 1.5, C.y + Math.sin(a) * 1.5, a, 11.5, { style: 'halo', color: '#FFE37A', core: '#FFFFFF', r: 0.75, dmg: m.dmg * 1.1, life: 3.4, keep: true, boomer: { out: 0.95, home: m } }); });
        M.rings[1].pulse = 1; FX.H.shake(5, 0.2); }]);
    }
    return job('discus', (throws - 1) * gap + lead + 2.4, ev);
  }
  /* the Cage of Light (III): seven blows come down in a ring round the pet, one gap left in it, and their light lingers as
     the cage's bars; then the centre is struck. Out through the gap before it closes; and, this being the Ring of Memory,
     the bars strike again, violet, where they stood */
  function cageOfLight(FX, m, o) {
    const M = FX.mem, k = 1 / FX.S.fast; o = o || {}; const me = FX.me, p = FX.clampArena({ x: me.x, y: me.y }, 2.4), R = 3.3, n = 8, gap = Math.floor(Math.random() * n), tS = 1.55 * k, tC = 2.5 * k, ga = gap / n * TAU;
    return job('cage', tC + (o.echo || 0) + 0.9, [
      [0, () => { if (!o.quiet) say(FX, p.x, p.y - 4.4, 'CAGE OF LIGHT', '#CFFFF8', 15); sf(FX, 'hum');
        for (let i = 0; i < n; i++) { if (i === gap) continue; const a = i / n * TAU, x = p.x + Math.cos(a) * R, y = p.y + Math.sin(a) * R;
          slamAt(FX, m, x, y, 1.45, tS, { dmgK: 1.3, noTent: i % 2 === 1, after: () => { FX.hz({ kind: 'cagebar', bw: true, shape: 'circle', x, y, r: 1.25, life: tC - tS + 0.7, dps: m.dmg * 0.6, tick: 0.3, col: '#FFE9A8', draw: drawPool }); if (o.echo) echoAt(FX, m, { shape: 'circle', x, y, r: 1.45 }, o.echo, 1.2); } }); }
        FX.hz({ kind: 'cagegap', bw: true, x: p.x + Math.cos(ga) * R, y: p.y + Math.sin(ga) * R, a: ga, life: tC + 0.2, dps: 0, draw: drawCageGap });
        slamAt(FX, m, p.x, p.y, 2.0, tC, { dmgK: 1.45 }); }],
    ]);
  }
  // (a declared function: this file's helpers lie past its return, where a const would never be ready)
  function cageEcho(FX, m) { return cageOfLight(FX, m, { echo: 3.2 / FX.S.fast }); }
  /* Wings and Rings (IV): the feathers and the halos at once */
  function wingsAndRings(FX, m) {
    const A = featherStorm(FX, m, { quiet: true, volleys: 3, gap: 0.62 }), B = haloDiscus(FX, m, { quiet: true, throws: 1 }), dB = 0.5;
    return job('wingsrings', Math.max(A.end, B.end + dB), A.ev.concat(B.ev.map(([t, f]) => [t + dB, f]), [[0, () => say(FX, FX.C.x, FX.C.y - HC - 2.2, 'WINGS AND RINGS', STAGE[3].main, 15)]]));
  }
  /* ---- IV: the Ring of Oblivion, every rule two at a time ---- */
  function procession(FX, m) {
    const C = FX.C, k = 1 / FX.S.fast;
    return sanctuary(FX, m, 4, { quiet: true, noLances: true, stepT: 2.6, lead: 2.0, onDone: () => {},
      onStep: (FX2, S) => { if (S.n === 1) { const s = (S.safe[1] + S.dir * 2 + NSEC) % NSEC, a = s * SEC_A, x = C.x + Math.cos(a) * 9.2, y = C.y + Math.sin(a) * 9.2; slamAt(FX, m, x, y, 2.4, 1.2 * k, { label: 'REMEMBER', echo: S.stepT * 1.9, echoK: 1.3 }); } } });
  }
  function lastHorizon(FX, m) { const C = FX.C, me = FX.me, k = 1 / FX.S.fast, inner = Math.hypot(me.x - C.x, me.y - C.y) < RIN, a = Math.atan2(me.y - C.y, me.x - C.x) + 0.3; return job('horizon', 2.8 * k + 0.8, [[0, () => { erupt(FX, m, inner, 2.8 * k, { label: 'THE LAST HORIZON' }); judgment(FX, m, a, 2.8 * k, { label: '' }); }]]); }
  function eightfoldRuin(FX, m) {
    const M = FX.mem, C = FX.C, me = FX.me, k = 1 / FX.S.fast, dir = Math.random() < 0.5 ? 1 : -1, skip = secOf(Math.atan2(me.y - C.y, me.x - C.x) + dir * SEC_A * 3), s0 = (skip + dir + NSEC) % NSEC, gap = 0.42 * k, ev = [];
    ev.push([0, () => { say(FX, C.x, C.y - HC - 2.2, 'EIGHTFOLD RUIN', STAGE[3].main, 16); sf(FX, 'hum'); }]);
    for (let i = 0; i < NSEC - 1; i++) { const s = (s0 + dir * i + NSEC * 2) % NSEC, tS = (1.5 + i * 0.42) * k; ev.push([0.1, () => { const T2 = M.tents.find(T3 => secOf(T3.a) === s && !T3.gone && !T3.dur); const a = s * SEC_A; if (T2) act(T2, 'slam', { x: C.x + Math.cos(a) * 9, y: C.y + Math.sin(a) * 9, tS: tS - 0.1 }, tS + 0.6); sectorStrike(FX, m, [s], tS - 0.1, { label: '', tents: false }); }]); }
    const last = (1.5 + (NSEC - 1) * 0.42) * k;
    ev.push([last - 0.4, () => { echoAt(FX, m, { shape: 'sectors', set: [skip], r0: RCORE * 0.5, r1: C.R + 0.6, label: 'LEAVE IT' }, 2.0 * k, 1.4); }]);
    return job('ruin', last + 2.6 * k, ev);
  }
  /* ---- Final Judgment: Oblivion is cast; the outer ring's eight runes, two at a time, each pair with a reprise of one stage ---- */
  function startOblivion(FX, m) {
    const M = FX.mem, k = 1 / FX.S.fast; endJob(FX); clearWarns(FX);
    M.obl = { t: 0, cast: 64 * k, total: 64 * k, pair: -1, objs: [], corr: false, win: 0, rep: 1.6, sub: null, wait: 0 };
    FX.H.banner('FINAL JUDGMENT', "It casts Oblivion. Break the outer ring's eight runes, two at a time, before it completes", STAGE[3].main, 3.4, true); sf(FX, 'hum'); FX.H.shake(14, 0.8);
    nextPair(FX, m);
  }
  function nextPair(FX, m) {
    const M = FX.mem, O = M.obl, C = FX.C; O.pair++; if (O.sub) { if (O.sub.stop) O.sub.stop(FX, O.sub); O.sub = null; }
    if (O.pair >= 4) return openCorridor(FX, m);
    const a0 = Math.random() * TAU;
    O.objs = [0, 1].map(j => { const a = a0 + j * Math.PI, x = C.x + Math.cos(a) * 8.4, y = C.y + Math.sin(a) * 8.4, ri = O.pair * 2 + j; return FX.obj({ kind: 'orune', ri, x, y, r: 1.25, hp: FX.S.barHP * 0.09, front: true, onKill: () => runeBroken(FX, m, ri) }); });
    O.rep = 1.2; O.left = 2;
    say(FX, C.x, C.y + 3.2, ['RUNES ONE AND TWO: DODGE THE STRIKES', 'RUNES THREE AND FOUR: FOLLOW THE SAFE GROUND', 'RUNES FIVE AND SIX: THE STRIKE AND ITS ECHO', 'RUNES SEVEN AND EIGHT: THE BEAM AND THE ERUPTION'][O.pair], STAGE[3].main, 15);
    if (O.pair === 1) O.sub = sanctuary(FX, m, 99, { quiet: true, noLances: true, lead: 1.6, stepT: 3.0, onDone: () => {} });
  }
  function runeBroken(FX, m, ri) {
    const M = FX.mem, O = M.obl; if (!O) return; M.rings[3].blaze[ri] = 0; O.left--; FX.H.sparks(m.x, m.y - HC, '#FFF3C8', 20, 7); sf(FX, 'crack');
    // each pair broken puts out two of its tentacles (the last pair only one: the last of them unravels at the very end)
    if (O.left <= 0) { O.cast += 7; let n = 0; const fade = O.pair >= 3 ? 1 : 2; M.tents.forEach(T2 => { if (!T2.gone && n < fade && M.tents.filter(X => !X.gone).length > 1) { T2.gone = 1; n++; } }); say(FX, m.x, m.y - HC - 3, fade === 2 ? 'TWO RUNES BROKEN · TWO TENTACLES FADE' : 'THE LAST RUNES BREAK', STAGE[3].main, 15); FX.H.shake(10, 0.4); clearWarns(FX); O.wait = 1.4; }
  }
  function openCorridor(FX, m) {
    const M = FX.mem, O = M.obl; O.corr = true; O.win = 10; M.castK = 0; clearWarns(FX);
    FX.H.banner('THE GOLDEN CORRIDOR', 'The rings align and its jewel is bare: deliver the final blow!', '#FFE9A8', 2.6, true); sf(FX, 'fanfare'); FX.H.shake(12, 0.6);
  }
  function stepOblivion(FX, m, dt) {
    const M = FX.mem, O = M.obl, k = 1 / FX.S.fast, C = FX.C, me = FX.me; O.t += dt;
    if (O.corr) {
      // (the jewel is struck within the reach it had when the colossus was drawn larger, so the last blow is no harder to land)
      O.win -= dt; const j = jewelAt(FX, m, M); FX.weak('jewel', j.x, j.y, 1.9 * Math.max(1.2, bigOf(M)), 1, O.win > 0);
      if (O.win <= 0) { FX.weak('jewel', 0, 0, 0, 0, false); O.corr = false; O.pair = 2; O.again = 6; say(FX, C.x, C.y - HC - 2.6, 'THE CORRIDOR CLOSES: IT WILL OPEN AGAIN', '#FFE9A8', 14); }
      return;
    }
    if (O.again != null) { O.again -= dt; O.rep -= dt; if (O.rep <= 0) { O.rep = 5.2 * k; lastHorizon(FX, m).ev.forEach(e => e[1](FX, m, {})); } if (O.again <= 0) { O.again = null; O.pair = 3; openCorridor(FX, m); } return; }
    O.cast -= dt;
    if (O.cast <= 0 && !M.fail) { M.fail = { t: 0 }; clearWarns(FX); FX.H.banner('OBLIVION', 'The arena dissolves into white', '#FFFFFF', 3, true); sf(FX, 'hum'); return; }
    if (O.wait > 0) { O.wait -= dt; if (O.wait <= 0) nextPair(FX, m); return; }
    if (O.sub) stepJob(FX, m, O.sub, dt);
    O.rep -= dt; if (O.rep > 0) return;
    if (O.pair === 0) { O.rep = 2.1 * k; slamAt(FX, m, me.x, me.y, 2.2, 1.3 * k); }
    else if (O.pair === 2) { O.rep = 3.3 * k; slamAt(FX, m, me.x, me.y, 2.4, 1.4 * k, { echo: 3.2 * k }); }
    else if (O.pair === 3) { O.rep = 5.2 * k; const inner = Math.hypot(me.x - C.x, me.y - C.y) < RIN; erupt(FX, m, inner, 2.6 * k, { label: '' }); judgment(FX, m, Math.atan2(me.y - C.y, me.x - C.x) + 0.3, 2.6 * k, { label: '' }); }
    else O.rep = 1;
  }
  // the failure: the arena dissolves into white (in a test with god mode on, Oblivion simply starts over)
  function stepFail(FX, M, dt) {
    const F = M.fail; F.t += dt; M.white = Math.min(1, F.t / 2.2);
    if (F.t > 2.2 && F.t < 6) { const ST = FX.H.ST ? FX.H.ST() : null; FX.hurt(((ST && ST.hp) || 9999) * 20); }
    if (F.t > 6.5) { M.fail = null; M.white = 0; if (M.obl) { M.obl.objs.forEach(o => { o.dead = true; }); M.obl = null; } M.rings[3].blaze = [1, 1, 1, 1, 1, 1, 1, 1]; M.tents.forEach(T2 => { T2.gone = 0; }); }
  }
  // the end: the rings break into motes of gold, the last tentacle unravels, the fish comes down to the platform, dawn
  function stepEnding(FX, M, dt) { const E = M.end; E.t += dt; M.dawn = sstep(3.4, 6.6, E.t); M.stars = lerp(M.stars, 0.6 * (1 - M.dawn), Math.min(1, dt)); M.white = Math.max(0, M.white - dt); if (E.t < 1.8 && FX.H.part && Math.random() < 0.9) { const k = Math.floor(Math.random() * 4), R = RINGS[k].R, a = Math.random() * TAU, m = FX.m; FX.H.part({ kind: 'spark', x: m.x + Math.cos(a) * R, y: m.y - HC + Math.sin(a) * R * 0.5, vx: Math.cos(a) * 2, vy: Math.sin(a) * 1.5 - 1, life: 1.6, max: 1.6, size: 3, color: '#FFE9A8' }); } }
  /* ---- where things are ---- */
  // the height the fish floats at (it comes down to the platform at the end)
  function hcOf(M) { const rest = M.end ? sstep(0.9, 3.6, M.end.t) : (M.rest || 0); return lerp(HC + Math.sin((M.bt || 0) * 1.1) * 0.14, 1.15, rest); }
  // the camera for the gyroscope and the fish: a true orthographic view from about 34 degrees, centred where the
  // arena's own view puts the fish, so its rings look round and its poses read; far from the centre (the
  // tentacles' tips, which strike the floor) points blend into the arena's view so they land where the floor says
  function bigOf(M) { return M && M.mini ? 1 : BIG; }
  function mkCam(FX, m, M, X, Y, T0) {
    const Ta = T0, T = T0 * bigOf(M), hc = hcOf(M), cx = m.x, cy = m.y, Yc = Y - hc * T, Rz = YAW ? p => [cx + (p[0] - cx) * YC - (p[1] - cy) * YS, cy + (p[0] - cx) * YS + (p[1] - cy) * YC, p[2]] : null;
    const L = Rz ? p => { p = Rz(p); return [X + (p[0] - cx) * T, Yc + ((p[1] - cy) * SE - (p[2] - hc) * CE) * T]; } : p => [X + (p[0] - cx) * T, Yc + ((p[1] - cy) * SE - (p[2] - hc) * CE) * T];
    const Cab = Rz ? p => { p = Rz(p); return [X + (p[0] - cx) * Ta, Y + (p[1] - cy) * Ta - p[2] * Ta]; } : p => [X + (p[0] - cx) * Ta, Y + (p[1] - cy) * Ta - p[2] * Ta];
    const B = p => { const d = Math.hypot(p[0] - cx, p[1] - cy, p[2] - hc), w = sstep(4.5, 10, d); if (w <= 0) return L(p); const a = L(p), b = Cab(p); return [lerp(a[0], b[0], w), lerp(a[1], b[1], w)]; };
    const dep = Rz ? p => { p = Rz(p); return (p[1] - cy) * CE + (p[2] - hc) * SE; } : p => (p[1] - cy) * CE + (p[2] - hc) * SE;
    return { L, Cab, B, dep, T, Ta, X, Y, Yc, hc, cx, cy, C3: [cx, cy, hc] };
  }
  function eqOf(m, M, p) { const hc = hcOf(M), k = bigOf(M); return { x: m.x + (p[0] - m.x) * k, y: m.y + (-hc + (p[1] - m.y) * SE - (p[2] - hc) * CE) * k }; }
  // a ring's frame: its normal (tumbling, or turned to aim, or aligned in the corridor), its centre and its plane
  function ringGeo(M, k, C3) {
    const D = RINGS[k], S = M.rings[k], sc = S.sc || 1;
    let n = rotAx(D.n0, D.axis, S.tumble);
    // the fight's rings sway on their axes and bob as they turn (none when aimed, nor in the corridor)
    const wk = S.wob == null ? 0 : (1 - (S.aimK || 0)) * (1 - (M.corr || 0)), wb = wk ? Math.sin(S.wob) * (k === 3 ? 0.07 : 0.15) * wk : 0;
    if (wb) n = rotAx(n, [Math.cos(k * 1.7 + 0.4), Math.sin(k * 1.7 + 0.4), 0], wb);
    if (S.aimK > 0.001 && S.aim) { const a = dot3(n, S.aim) < 0 ? [-S.aim[0], -S.aim[1], -S.aim[2]] : S.aim; n = norm3(lerp3(n, a, S.aimK)); }
    let c = wk ? [C3[0], C3[1], C3[2] + Math.sin(S.wob * 1.3 + k * 2.1) * 0.06 * wk] : C3;
    if (M.corr > 0.001) { const ax = norm3(M.corrAx || [0, 1, 0.2]), a = dot3(n, ax) < 0 ? [-ax[0], -ax[1], -ax[2]] : ax; n = norm3(lerp3(n, a, M.corr)); c = add3(C3, ax, (k - 0.4) * 1.2 * RS * M.corr); }
    const ref = Math.abs(n[2]) < 0.92 ? [0, 0, 1] : [1, 0, 0], e1 = norm3(cross3(n, ref)), e2 = cross3(n, e1);
    return { n, e1, e2, c, R: D.R * sc, w: D.w * sc, th: D.th * sc, D, S };
  }
  function ringPt(G, a, r, nOff) { const ca = Math.cos(a), sa = Math.sin(a); return [G.c[0] + (G.e1[0] * ca + G.e2[0] * sa) * r + G.n[0] * nOff, G.c[1] + (G.e1[1] * ca + G.e2[1] * sa) * r + G.n[1] * nOff, G.c[2] + (G.e1[2] * ca + G.e2[2] * sa) * r + G.n[2] * nOff]; }
  function jewelAt(FX, m, M) { const j = jewelLocal(M); return eqOf(m, M, [m.x + j[0], m.y + j[1], hcOf(M) + j[2]]); }
  function bodyParts(FX, m, M) {
    const k = bigOf(M), C3 = [m.x, m.y, hcOf(M)], core = eqOf(m, M, C3), out = [{ key: 'core', dx: core.x - m.x, dy: core.y - m.y, r: 2.3 * k }];
    // the rings share its life: their low front arcs, within reach of the platform, take blows too
    const G = ringGeo(M, 3, C3), V = [0, CE, SE], fwd = norm3([V[0] - G.n[0] * dot3(V, G.n), V[1] - G.n[1] * dot3(V, G.n), V[2] - G.n[2] * dot3(V, G.n)]);
    const a0 = Math.atan2(dot3(fwd, G.e2), dot3(fwd, G.e1));
    [-0.9, 0, 0.9].forEach((da, i) => { const p = eqOf(m, M, ringPt(G, a0 + da, G.R, 0)); out.push({ key: 'ring' + i, dx: p.x - m.x, dy: p.y - m.y, r: 1.3 * k }); });
    // and so do its wings
    [-1, 1].forEach(sd => { const p = eqOf(m, M, wingW(M, FX.S.lv || 1, sd, C3)(3.6, 0.8)); out.push({ key: sd < 0 ? 'wingL' : 'wingR', dx: p.x - m.x, dy: p.y - m.y, r: 2.4 * k }); });
    return out;
  }
  // a cubic Bezier through four control points
  function bez(P, u) { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1], a * P[0][2] + b * P[1][2] + c * P[2][2] + d * P[3][2]]; }
  /* ---- the rings: awake in turn, turning, aiming, stalling, overheating, pulsing ---- */
  function stepRings(FX, M, dt, lv) {
    const m = FX.m, frozen = M.freeze > 0 || !!M.end;
    if (M.obl && M.obl.corr) { const me = FX.me; M.corrAx = norm3([me.x - m.x, me.y - m.y, 0.3]); }
    M.corr = lerp(M.corr, M.art ? M.corr : (M.obl && M.obl.corr ? 1 : 0), Math.min(1, dt * 2));
    M.rings.forEach((S, k) => {
      const D = RINGS[k];
      if (!M.art) S.awake = k === 0 ? (M.intro > 2 || lv > 1 || FX.m.act !== 'enter' ? 1 : 0) : lv > k ? 1 : 0;
      S.wake = lerp(S.wake, S.awake, Math.min(1, dt * 1.6));
      // a ring not yet woken still turns, slowly, so the whole gyroscope is always in motion
      const run = !frozen && S.stall <= 0 && M.corr < 0.5 ? (S.awake ? 1 : 0.45) : 0, heat = k === 1 ? (S.heat || 0) : 0;
      // (they turn faster than they once did, runes racing round, and each sways on its axis and bobs as it turns)
      S.spin += dt * D.spinV * SPIN_K * S.dir * run * (1 + heat * 1.5); S.tumble += dt * D.tumbleV * TUMBLE_K * S.dir * run;
      S.wob = (S.wob == null ? k * 1.7 : S.wob) + dt * (1.15 + 0.35 * k) * (run > 0 ? 1 : 0.3);
      S.aimK = lerp(S.aimK, S.aimT ? 1 : 0, Math.min(1, dt * 3));
      S.pulse = Math.max(0, S.pulse - dt * 0.45);
      if (S.stall > 0) { S.stall -= dt / (k === 1 ? 10 : 9); if (S.stall <= 0 && k === 0) S.quarters = [1, 1, 1, 1]; }
      S.sc = lerp(S.sc || 1, M.draw ? 0.84 : 1, Math.min(1, dt * 2.5));
    });
  }
  /* the stage turns: the rings and tentacles change, each in its own way */
  function stepTrans(FX, M, dt) {
    const Tr = M.trans; Tr.t += dt;
    if (Tr.k === 'motion') { const R1 = M.rings[0]; if (Tr.t < 1.1) R1.stall = Math.max(R1.stall, 0.1); else if (!Tr.rev) { Tr.rev = true; R1.dir = -1; R1.stall = 0; sf(FX, 'hum'); } if (Tr.t > 0.4) M.tents.forEach(T2 => { if (T2.role === 'below') T2.role = 'spiral'; }); if (Tr.t > 2.4) M.trans = null; }
    else if (Tr.k === 'memory') { if (Tr.t > 2.6) M.trans = null; }
    else if (Tr.k === 'oblivion') { M.curl = Tr.t < 2.6 ? 1 : Math.max(0, 1 - (Tr.t - 2.6)); M.draw = Tr.t > 0.4 && Tr.t < 2.2; if (Tr.t > 2.0 && !Tr.turned) { Tr.turned = true; sf(FX, 'crash'); FX.H.shake(14, 0.8); } if (Tr.t > 3.6) M.trans = null; }
  }
  /* ---- the tentacles: eight curves of light from the fish, each with a role ---- */
  function idleRole(M, T2, lv) {
    if (T2.gone) return 'gone';
    if (M.trans && M.trans.k === 'memory' && M.trans.t < 2.6) return 'frozen';
    if (M.end) return 'rest';
    if (lv <= 1) return (M.art || M.intro > 1.2) && T2.i % 2 === 0 ? 'rest' : 'below';
    if (lv === 2) return 'spiral';
    if (lv === 3) return 'rest';
    return 'stretch';
  }
  function stepTents(FX, M, dt, lv) {
    const C3 = [FX.m.x, FX.m.y, hcOf(M)];
    M.tents.forEach(T2 => {
      T2.t += dt;
      if (T2.dur != null && T2.t > T2.dur) { T2.dur = null; T2.data = null; }
      if (T2.dur == null) { const r = idleRole(M, T2, lv); if (r === 'frozen' && T2.role !== 'frozen') T2.frz = T2.P && T2.P.map(p => p.slice()); T2.role = r; }
      const tg = tentTarget(FX, M, T2, C3, lv);
      if (!T2.P) T2.P = tg.map(p => p.slice());
      const striking = (T2.role === 'slam' || T2.role === 'lash') && T2.data && T2.t >= T2.data.tS, rate = T2.role === 'frozen' ? 0 : striking ? 18 : T2.role === 'sweep' ? 10 : T2.role === 'slam' || T2.role === 'lash' ? 4 : 2.4;
      T2.P = T2.P.map((p, j) => lerp3(p, tg[j], Math.min(1, dt * rate * (j === 0 ? 4 : 1))));
      T2.alpha = lerp(T2.alpha, T2.role === 'gone' ? 0 : T2.role === 'below' ? 0.42 : 1, Math.min(1, dt * 1.6));
      T2.lit = Math.max(0, T2.lit - dt * 1.5);
    });
  }
  function tentTarget(FX, M, T2, C3, lv) {
    const t = M.bt, i = T2.i, spin = T2.role === 'spiral' ? t * 0.12 : 0, a = T2.a + spin + Math.sin(t * 0.3 + i) * 0.05, dir = [Math.cos(a), Math.sin(a), 0], pp = [-Math.sin(a), Math.cos(a), 0], up = [0, 0, 1];
    const root = [C3[0] + dir[0] * 0.25, C3[1] + dir[1] * 0.25, C3[2] - 0.25], R = FX.C.R, art = M.art ? (M.tL || 0.6) : 1;
    if (T2.role === 'frozen' || T2.role === 'gone') return T2.frz || T2.P || [root, root, root, root];
    if (T2.role === 'below') return [root, add3(add3(C3, dir, 3.2), up, -1.0), [C3[0] + dir[0] * (R - 0.3), C3[1] + dir[1] * (R - 0.3), 0.4], [C3[0] + dir[0] * (R + 2.4) + pp[0] * Math.sin(t * 0.7 + i) * 1.2, C3[1] + dir[1] * (R + 2.4) + pp[1] * Math.sin(t * 0.7 + i) * 1.2, -6]];
    if (T2.role === 'slam') { const d = T2.data, ad = Math.atan2(d.y - C3[1], d.x - C3[0]), dq = [Math.cos(ad), Math.sin(ad), 0], dist = Math.hypot(d.x - C3[0], d.y - C3[1]);
      if (T2.t < d.tS) return [root, add3(add3(C3, dq, 2.2), up, 2.6), add3(add3(C3, dq, dist * 0.45), up, 7.6), [d.x, d.y, 8.8]];
      return [root, add3(add3(C3, dq, 2.2), up, 1.4), add3(add3(C3, dq, dist * 0.62), up, 2.8), [d.x, d.y, 0]]; }
    if (T2.role === 'lash') { const d = T2.data;
      if (T2.t < d.tS) return [root, add3(C3, up, 3.2), [lerp(d.x0, d.x1, 0.3), lerp(d.y0, d.y1, 0.3), 9.5], [d.x1, d.y1, 7.8]];
      return [root, [lerp(C3[0], d.x0, 0.45), lerp(C3[1], d.y0, 0.45), 1.6], [lerp(d.x0, d.x1, 0.38), lerp(d.y0, d.y1, 0.38), 0.25], [d.x1, d.y1, 0]]; }
    if (T2.role === 'sweep') { const d = T2.data, b = d.a, s = d.dir; return [root, [C3[0] + Math.cos(b - 0.45 * s) * 3, C3[1] + Math.sin(b - 0.45 * s) * 3, 1.5], [C3[0] + Math.cos(b - 0.16 * s) * 9.2, C3[1] + Math.sin(b - 0.16 * s) * 9.2, 0.5], [C3[0] + Math.cos(b + 0.2 * s) * 14.2, C3[1] + Math.sin(b + 0.2 * s) * 14.2, 0.15]]; }
    // at rest in its fighting position, in the spiral of stage two, or stretched to full length in stage four
    // each one bends in a slow S (one way near the root, the other way further out) and waves on its own phase
    const st = T2.role === 'stretch', sp = T2.role === 'spiral', L = (st ? 16.5 : 11.5) * art * (M.mini ? 1 : TENT_L), curl = sp ? 1.05 : st ? 0.6 : 0.42, sw = Math.sin(t * 0.55 + i * 1.3), sw2 = Math.cos(t * 0.42 + i * 0.9), hi = i % 2 ? 1 : 0;
    const P1 = add3(add3(add3(C3, dir, 2.6 * art), up, 1.6 + sw * 0.35), pp, -(1.3 + 0.5 * sw2) * art);
    const lk = M.mini ? 1 : 0.85, P2 = add3(add3(add3(C3, dir, L * 0.52), up, ((st ? (hi ? 8 : 5) : 4.6) * art + sw * 0.9) * lk), pp, (2.4 + 1.2 * sw2) * art * lk);
    const ta = a + curl * (0.55 + 0.25 * sw), tip = [C3[0] + Math.cos(ta) * L, C3[1] + Math.sin(ta) * L, (st ? (hi ? 7.5 : 3.5) : 3.2) * art + sw2 * 1.3 * art];
    return [root, P1, P2, tip];
  }
  /* ---- painting ---- */
  function rgbaH(h, a) { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; }
  function mixH(a, b, u) { return DunFiend.KIT.mixC(a, b, clamp(u, 0, 1)); }
  // an art pose has no fight behind it: give it rings and tentacles in the stage it shows
  function setupArt(FX, M) {
    const lv = M.lv || 1; FiendDefsBahamutInit(FX, M); M.art = 1; M.bt = M.bt || 1.3; M.intro = 9; M.eyes = M.curl ? 0 : 1; M.stars = lv >= 4 ? 0 : 0.3;
    M.rings.forEach((S, k) => { S.awake = lv > k ? 1 : 0; S.wake = S.awake; S.spin = 0.4 + k; S.tumble = 0.6 + k * 0.9; });
    if (M.wheel) { const R1 = M.rings[0]; R1.aim = [Math.sin(M.wheel), -Math.cos(M.wheel), 0]; R1.aimT = 1; R1.aimK = 1; }
    if (M.corr) M.corrAx = norm3([0.35, 1, 0.3]);
    M.tents.forEach(T2 => { T2.role = idleRole(M, T2, lv); T2.P = tentTarget(FX, M, T2, [FX.m.x, FX.m.y, hcOf(M)], lv); T2.alpha = T2.role === 'below' ? 0.42 : 1; });
    if (lv >= 3) M.ghost = 1;
  }
  function FiendDefsBahamutInit(FX, M) { const keep = Object.assign({}, M); FIEND_DEFS.bahamut.init({ mem: M, m: { x: FX.m.x, y: FX.m.y }, C: FX.C || { x: 0, y: 0, R: 14.5 } }); Object.assign(M, keep); }
  function drawBahamut(c, FX, m, X, Y, T, t) {
    const M = FX.mem; if (!M.rings) setupArt(FX, M);
    const q = FX.K.qq(), lv = clamp(M.art ? (M.lv || 1) : FX.S.lv || 1, 1, 4), cam = mkCam(FX, m, M, X, Y, T);
    if (M.dbgOnly === 'fish') { drawFish(c, FX, cam, M, lv, q); return; }
    if (M.dbgOnly === 'wings') { drawWings(c, cam, M, lv, q, 0); return; }
    // the soft shadow it throws on the dais, and the light of its roots
    if (!M.noShadow) TN.groundShadow(c, X, Y + T * 0.1, cam.T * 2.6, cam.T * 1.3, hcOf(M), 0.32);
    // the wings behind it all; the far halves of the rings, largest first; then the light; then the fish; then the near halves, smallest first
    const P = M.prof, tk = P ? k => { if (P._flush) c.getImageData(0, 0, 1, 1); const n = performance.now(); P[k] = (P[k] || 0) + n - P._t; P._t = n; } : null; if (P) P._t = performance.now();
    const SK = M.skipP || {};
    /* in the fight it is kept as two pictures, each painted a step a frame into a canvas off screen and moved with the
       camera in between: the wings, a wing a step; and the rest of it in steps, back to front: the far halves of the
       rings with the tentacles' light within them, the fish, the near halves of the rings, and the tentacles' far
       reaches, over all. So each frame paints a share of the colossus and copies two pictures to the screen, not five,
       each only as big as what it holds (worked out only when it is repainted). The Anima, art and tests paint it all
       directly */
    const K = FX.K, vb = !M.mini && !M.art && !P && K.layer && K.fightT(FX, t) != null ? viewRect(c, T * 1.2) : null, sig = `${Math.round(T * 8)}|${q}|${lv}|${M.rN || 4}`;
    // (each picture's box is what it holds, within the view: at the end, as it comes apart, they keep the whole view)
    const tight = vb && !M.end, within = b => { const x0 = Math.max(vb.x0, b[0]), y0 = Math.max(vb.y0, b[1]), x1 = Math.min(vb.x1, b[2]), y1 = Math.min(vb.y1, b[3]); return x1 > x0 + 1 && y1 > y0 + 1 ? [x0, y0, x1, y1] : [vb.x0, vb.y0, vb.x0 + 2, vb.y0 + 2]; };
    const holds = fill => { if (!tight) return [vb.x0, vb.y0, vb.x1, vb.y1]; const b = [1e9, 1e9, -1e9, -1e9]; fill(b); return within(b); };
    const nR = M.rN || 4, order = [0, 1, 2, 3].slice(0, nR), tents = M.dbgOnly !== 'gyro' && !SK.tents, wings = M.dbgOnly !== 'gyro' && !SK.wings;
    if (M.corr > 0.5) { const ds = order.map(k => cam.dep(ringGeo(M, k, cam.C3).c)); order.sort((a, b) => ds[a] - ds[b]); }
    // the three steps of the colossus, back to front
    const back = g => {
      if (SK.rings) {} else if (M.corr > 0.5) order.forEach(k => { drawRingHalf(g, cam, M, k, false, q, lv); drawRingHalf(g, cam, M, k, true, q, lv); });
      else for (let k = nR - 1; k >= 0; k--) drawRingHalf(g, cam, M, k, false, q, lv);
      if (tk) tk('rings');
      if (tents) drawTents(g, cam, M, lv, 'inner', q); if (tk) tk('tents'); };
    const fish = g => { if (!SK.fish) drawFish(g, FX, cam, M, lv, q); if (tk) tk('fish'); };
    const front = g => { if (M.corr <= 0.5 && !SK.rings) for (let k = 0; k < nR; k++) drawRingHalf(g, cam, M, k, true, q, lv); if (tk) tk('rings'); };
    const mid = g => { fish(g); front(g); };
    const over = g => { if (tents) drawTents(g, cam, M, lv, 'outer', q); if (tk) tk('tents'); };
    if (!vb) { if (wings) drawWings(c, cam, M, lv, q, 0); if (tk) tk('wings'); back(c); mid(c); over(c); return; }
    if (wings) K.layer(c, 'bh-wings', { t, ax: X, ay: Y, every: 3, steps: 2, slot: 2, sig, box: () => holds(b => { drawWings(null, cam, M, lv, q, 0, 0, b); const p = cam.L(cam.C3), d = T * 0.6; boxAdd(b, p[0], p[1], 0); b[0] -= d; b[1] -= d; b[2] += d; b[3] += d; }) },
      (g, i) => drawWings(g, cam, M, lv, q, 0, i == null ? 0 : i ? 1 : -1));
    // (the gyroscope with room for the light within it, and, while they show, the tentacles' far reaches across the floor)
    // (at full quality, on a device that keeps up, the colossus is repainted every other frame in two steps, so its fast
    // turning rings move smoothly; once quality has had to drop, every third frame in three, which costs a third less)
    const st2 = q >= 2, STEPS = st2 ? [g => { back(g); fish(g); }, g => { front(g); over(g); }] : [back, mid, over];
    K.layer(c, 'bh-body', { t, ax: X, ay: Y, every: STEPS.length, steps: STEPS.length, slot: 0, sig: sig + (st2 ? '|2' : ''), box: () => holds(b => { ringsBox(cam, M, b); const p = cam.L(cam.C3); boxAdd(b, p[0], p[1], (RINGS[3].R + 0.6 + 2.6) * cam.T); if (tents) tentsBox(cam, M, b); }) },
      (g, i) => { if (i == null) STEPS.forEach(f => f(g)); else STEPS[i](g); });
  }
  /* a ring: a band of brushed metal with bevelled edges, its face lit in cel bands with two bright arcs where the
     brushing catches the light, its rims, an ink outline, and runes engraved round it glowing in its stage's light */
  function drawRingHalf(c, cam, M, k, front, q, lv) {
    const G = ringGeo(M, k, cam.C3), { n, e1, e2, R, w, th, D, S } = G, T = cam.T, N = q >= 2 ? 36 : q >= 1 ? 26 : 20, eps = 0.012;
    const nV = dot3(n, VW), fs = nV >= 0 ? 1 : -1, cdep = cam.dep(G.c), asleep = 1 - S.wake, stall = S.stall > 0 ? S.stall : 0;
    const [mb, ms, md, mh] = D.metal, dim = 0.45 * asleep + 0.15 * stall, base = mixH(mb, md, dim), shade = mixH(ms, md, dim * 0.8), deep = md, hi = mixH(mh, mb, dim), light = mixH(base, hi, 0.5);
    const segs = [];
    for (let j = 0; j < N; j++) { const am = (j + 0.5) / N * TAU; if ((cam.dep(ringPt(G, am, R, 0)) >= cdep) === front) segs.push(j); }
    if (!segs.length) return;
    segs.sort((a, b) => cam.dep(ringPt(G, (a + 0.5) / N * TAU, R, 0)) - cam.dep(ringPt(G, (b + 0.5) / N * TAU, R, 0)));
    // its quads are gathered by colour and each colour filled once, the rims first and the faces over them; each is wound
    // the same way round, so where neighbours overlap (to hide their seams) the overlap stays filled
    const bins = [new Map(), new Map()], P = p => cam.L(p), quad = (a, b, cc, d, col, f) => { const m = bins[f ? 1 : 0]; let L = m.get(col); if (!L) m.set(col, L = []);
      const ar = (a[0] * b[1] - b[0] * a[1]) + (b[0] * cc[1] - cc[0] * b[1]) + (cc[0] * d[1] - d[0] * cc[1]) + (d[0] * a[1] - a[0] * d[1]); L.push(ar >= 0 ? [a, b, cc, d] : [d, cc, b, a]); };
    const fo = fs * th / 2, bo = -fs * th / 2, Ro = R + w / 2, Ri = R - w / 2;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    segs.forEach(j => {
      const a0 = j / N * TAU - eps, a1 = (j + 1) / N * TAU + eps, am = (a0 + a1) / 2, rm = [e1[0] * Math.cos(am) + e2[0] * Math.sin(am), e1[1] * Math.cos(am) + e2[1] * Math.sin(am), e1[2] * Math.cos(am) + e2[2] * Math.sin(am)];
      const Of0 = P(ringPt(G, a0, Ro, fo)), Of1 = P(ringPt(G, a1, Ro, fo)), If0 = P(ringPt(G, a0, Ri, fo)), If1 = P(ringPt(G, a1, Ri, fo));
      // the rim that faces us: the outer one on the far side of the ring's turn, the inner one on the near side
      const outer = dot3(rm, VW) > 0, rn = outer ? rm : [-rm[0], -rm[1], -rm[2]], rb = dot3(rn, LD), rimCol = rb > 0.45 ? light : rb > 0 ? base : rb > -0.4 ? shade : deep;
      if (outer) quad(Of0, Of1, P(ringPt(G, a1, Ro, bo)), P(ringPt(G, a0, Ro, bo)), rimCol); else quad(If0, If1, P(ringPt(G, a1, Ri, bo)), P(ringPt(G, a0, Ri, bo)), rimCol);
      // the face is bevelled: its outer and inner halves lean apart, each lit in hard cel bands, and the brushing
      // throws a bright streak where it runs across the light
      const nf = [n[0] * fs, n[1] * fs, n[2] * fs], tg = [-e1[0] * Math.sin(am) + e2[0] * Math.cos(am), -e1[1] * Math.sin(am) + e2[1] * Math.cos(am), -e1[2] * Math.sin(am) + e2[2] * Math.cos(am)], an = Math.pow(1 - Math.pow(dot3(tg, HV), 2), 9);
      const Mf0 = P(ringPt(G, a0, R, fo)), Mf1 = P(ringPt(G, a1, R, fo));
      [[1, Of0, Of1, Mf1, Mf0], [-1, Mf0, Mf1, If1, If0]].forEach(([sd, A, B, C2, D2]) => { const nb = norm3([nf[0] + rm[0] * 0.6 * sd, nf[1] + rm[1] * 0.6 * sd, nf[2] + rm[2] * 0.6 * sd]), l = dot3(nb, LD), sp = dot3(nb, HV);
        quad(A, B, C2, D2, sp > 0.94 || an > 0.93 ? hi : l > 0.62 ? light : l > 0.2 ? base : l > -0.25 ? shade : deep, 1); });
    });
    bins.forEach(m => m.forEach((L, col) => { c.fillStyle = col; c.beginPath(); L.forEach(([a, b, cc, d]) => { c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(cc[0], cc[1]); c.lineTo(d[0], d[1]); c.closePath(); }); c.fill(); }));
    // a bevel along each edge of the face, the brushing, and the ink outline
    const run = (rr, off, add) => { if (!add) c.beginPath(); let on = false, prev = -9; segs.slice().sort((a, b) => a - b).forEach(j => { const p0 = P(ringPt(G, j / N * TAU, rr, off)), p1 = P(ringPt(G, (j + 1) / N * TAU, rr, off)); if (j !== prev + 1 || !on) c.moveTo(p0[0], p0[1]); c.lineTo(p1[0], p1[1]); on = true; prev = j; }); };
    if (q >= 1) { c.strokeStyle = rgbaH(hi, 0.85); c.lineWidth = Math.max(1, T * 0.05); run(Ro - w * 0.12, fo); c.stroke();
      c.strokeStyle = rgbaH(deep, 0.6); run(Ri + w * 0.12, fo); c.stroke(); }
    // (the faint brushing lines that once ran along the face are gone: at a fifth of an alpha the eye could not find them,
    // and as hairlines they cost as much as the whole of a ring's faces)
    c.strokeStyle = INK; c.lineWidth = Math.max(1.4, T * 0.07); run(Ro, fo); run(Ri, fo, true); c.stroke(); c.lineWidth = Math.max(1, T * 0.05); run(Ro, bo); c.stroke();
    // a ring two that is overheating glows; a ring that pulses sends light inward or outward
    if (S.heat > 0.05 && k === 1) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaH('#FF8A4A', 0.35 * S.heat); c.lineWidth = w * T * 0.8; run(R, fo); c.stroke(); c.globalCompositeOperation = 'source-over'; }
    if (S.pulse > 0.02) { c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const ph = ((M.bt * 1.3 + i / 3) % 1), rr = R + (S.pulseDir || 1) * (ph - 0.5) * 2.2; c.strokeStyle = rgbaH(D.rune, S.pulse * (1 - Math.abs(ph - 0.5) * 2) * 0.8); c.lineWidth = Math.max(1.5, T * 0.07); run(Math.max(0.5, rr), 0); c.stroke(); } c.globalCompositeOperation = 'source-over'; }
    // the runes
    const nr = M.lite || (M.skipP && M.skipP.runes) ? 0 : D.runes, gs = w * 0.4;
    for (let r = 0; r < nr; r++) {
      const a = S.spin + r / nr * TAU, ctr = ringPt(G, a, R, fo * 1.02); if ((cam.dep(ringPt(G, a, R, 0)) >= cdep) !== front) continue;
      const tg = [-e1[0] * Math.sin(a) + e2[0] * Math.cos(a), -e1[1] * Math.sin(a) + e2[1] * Math.cos(a), -e1[2] * Math.sin(a) + e2[2] * Math.cos(a)], rd = [e1[0] * Math.cos(a) + e2[0] * Math.sin(a), e1[1] * Math.cos(a) + e2[1] * Math.sin(a), e1[2] * Math.cos(a) + e2[2] * Math.sin(a)];
      const gp = ([x, y]) => P([ctr[0] + (tg[0] * x + rd[0] * y) * gs, ctr[1] + (tg[1] * x + rd[1] * y) * gs, ctr[2] + (tg[2] * x + rd[2] * y) * gs]), strokes = GLYPHS[(r + k * 3) % 8];
      // how brightly this rune burns: asleep, extinguished, stored, broken, flickering in a stall
      let glow = S.wake * (0.65 + 0.25 * Math.sin(M.bt * 2 + r)), col = lv - 1 === k ? D.rune : RINGS[0].rune;
      if (k === 0 && !S.quarters[Math.floor(r / (nr / 4))]) glow = 0;
      if (k === 2) { if (r < (S.stored || 0)) { glow = 1.1; col = '#E2B4FF'; } if (S.lit === r) { glow = 1.6 + 0.4 * Math.sin(M.bt * 12); col = '#FFFFFF'; } }
      if (k === 3) { if (!S.blaze[r]) glow = 0; else if (S.wake > 0.5) glow = 1.2 + 0.2 * Math.sin(M.bt * 4 + r); }
      if (stall > 0) glow *= Math.random() < 0.5 ? 0.15 : 0.6;
      // each rune sits in a dark engraved cartouche, cut into the gold; lit, its strokes burn with a white core
      const cq = [gp([-1.25, -1.05]), gp([1.25, -1.05]), gp([1.25, 1.05]), gp([-1.25, 1.05])]; c.fillStyle = rgbaH(deep, glow > 0.02 ? 0.75 : 0.45); c.beginPath(); cq.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill();
      if (q >= 2) { c.strokeStyle = rgbaH(hi, 0.35); c.lineWidth = Math.max(0.8, T * 0.02); c.stroke(); }
      const GP = strokes.map(st => st.map(gp)), glyph = () => { c.beginPath(); GP.forEach(st => st.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); c.stroke(); };
      if (q < 1 && glow <= 0.02) continue;
      c.strokeStyle = rgbaH(mixH(deep, '#000000', 0.4), 0.9); c.lineWidth = Math.max(1.2, T * 0.05); glyph();
      if (glow > 0.02) { c.globalCompositeOperation = 'lighter'; (q < 1 ? [[Math.max(1.6, T * 0.07), mixH(col, '#FFFFFF', 0.35), Math.min(1, glow)]] : [[Math.max(2.2, T * 0.11), col, Math.min(1, glow * 0.6)], [Math.max(1, T * 0.04), mixH(col, '#FFFFFF', 0.6), Math.min(1, glow)]]).forEach(([lw2, cl, al]) => { c.strokeStyle = rgbaH(cl, al); c.lineWidth = lw2; glyph(); }); c.globalCompositeOperation = 'source-over'; }
    }
    c.restore();
  }
  /* ---- the tentacles of light: broad at the root, tapering to fine tips, white cores in cyan, blue and violet ---- */
  function ribbon(c, sp, wf, k) { const N = sp.length - 1, L = [], R = []; for (let i = 0; i <= N; i++) { const a = sp[Math.max(0, i - 1)], b = sp[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = wf(i / N) * k / 2; L.push([sp[i][0] - dy / d * w, sp[i][1] + dx / d * w]); R.push([sp[i][0] + dy / d * w, sp[i][1] - dx / d * w]); } c.beginPath(); c.moveTo(L[0][0], L[0][1]); for (let i = 1; i <= N; i++) c.lineTo(L[i][0], L[i][1]); for (let i = N; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.closePath(); }
  /* the passes: 'main' all of each tentacle; 'over' only what lies beyond the gyroscope, faintly, laid again over the near
     rings; 'inner' and 'outer' split each one at the gyroscope instead: what lies within it, under the near rings, and what
     lies beyond it, over everything, with the light of main and over added together there, so the far reaches (which
     span the floor) are painted once, in one picture, rather than twice in two */
  function drawTents(c, cam, M, lv, pass, q) {
    const P = STAGE[lv - 1].tent, T = cam.T, t = M.bt, N = q >= 2 ? 30 : q >= 1 ? 22 : 15, tw = M.mini ? 1 : TENT_W, over = pass === 'over', inner = pass === 'inner', outer = pass === 'outer', beyond = over || outer;
    // (two layers of light and the halo band below; a third, broad and faint, added nothing the eye could find and cost a
    // tenth of the whole summit)
    const MAIN = q >= 1 ? [[1.0, P[2], 0.36], [0.36, '#FFFFFF', 0.75]] : [[1.0, P[2], 0.38], [0.36, '#FFFFFF', 0.72]];
    const layers = over ? [[1.0, P[2], 0.14], [0.34, '#FFFFFF', 0.36]] : outer ? [[1.0, P[2], MAIN[0][2] + 0.14], [0.36, '#FFFFFF', Math.min(1, MAIN[1][2] + 0.36)]] : MAIN;
    const gyro = RINGS[3].R + 0.6, unr = M.end ? 1 - sstep(0.5, 3.2, M.end.t) : 1, bloomC = mixH(P[2], '#FFFFFF', 0.45);
    if (unr <= 0.01) return;
    const wmax = layers[0][0], rimR = cam.Ta * 14.5;
    c.save(); c.globalCompositeOperation = 'lighter';
    if (!beyond) { const cp = cam.L(cam.C3); c.globalAlpha = 0.24 * unr; blitSized(c, glowSprite(STAGE[lv - 1].glow), cp[0] - T * 2, cp[1] - T * 2, T * 4, T * 4); c.globalAlpha = 1; }
    M.tents.forEach(T2 => {
      if (!T2.P || T2.alpha < 0.02 || (M.tN && T2.i % Math.max(1, Math.round(8 / M.tN)))) return;
      // at the end the last of them unravels from its tip into sparks
      const Nn = Math.max(2, Math.round(N * unr));
      const pts = []; for (let s = 0; s <= Nn; s++) { const u = s / N, p = bez(T2.P, u), still = T2.role === 'frozen' ? 0 : 1, sw = Math.sin(t * 2.1 - u * 6 + T2.i * 1.7) * 0.3 * u * still; p[0] += -Math.sin(T2.a) * sw; p[1] += Math.cos(T2.a) * sw; p[2] += Math.cos(t * 1.7 - u * 5 + T2.i) * 0.16 * u * still; pts.push(p); }
      const dC = p => Math.hypot(p[0] - cam.cx, p[1] - cam.cy, p[2] - cam.hc), iG = pts.findIndex(p => dC(p) > gyro);
      // the stretch of it this pass paints: all of it, what lies within the gyroscope, or what lies beyond it
      let i0 = 0, i1 = Nn; if (beyond) { if (iG < 0) return; i0 = iG; } else if (inner && iG >= 0) i1 = iG;
      // (a point of it is this pass's to light: within the gyroscope for the inner pass, beyond it for the outer)
      const mine = s2 => inner ? iG < 0 || s2 < iG : outer ? iG >= 0 && s2 >= iG : true;
      // broad at the base, narrowing a little where it leaves the fish so their roots don't pool into one glare, tapering to a fine tip
      const wf = u => T * (1.05 * Math.pow(1 - u, 1.15) + 0.07) * (0.3 + 0.7 * sstep(0, 0.2, u)) * (1 + T2.lit * 0.3) * (T2.role === 'stretch' ? 1.12 : 1) * tw;
      if (M.end && (pass === 'main' || mine(Nn))) { const e = cam.B(pts[Nn]); for (let j = 0; j < 6; j++) { const a = j * 1.1 + t * 3, d = T * (0.3 + ((t * 1.7 + j * 0.37) % 1) * 1.6); TN.twinkle(c, e[0] + Math.cos(a) * d, e[1] + Math.sin(a) * d - d * 0.5, Math.max(1.5, T * 0.22), '#FFFFFF', 0.85 * T2.alpha); } }
      // a soft halo of light all along it, like the fish's own glow: within the rings in the main pass (fainter, and none
      // at their heart, where the fish's own glow is the only light), beyond them in the pass over the rings: one broad,
      // faint band about the tentacle's own layers of light, which make the rest of its soft edge
      const SP = pts.map(cam.B);
      // (at full quality only: at five parts in a hundred it is the faintest of its light, and it is the broadest)
      if (q >= 2 && !(M.skipP && M.skipP.bloom)) { const ba = 0.2 * T2.alpha, rr = u => Math.max(T * 0.5, wf(u) * 2.2);
        const ok = s2 => { const p = pts[s2], d = dC(p); if ((d > gyro) !== beyond || d < RINGS[1].R) return 0; if (p[2] < -0.15 && Math.hypot(SP[s2][0] - cam.X, SP[s2][1] - cam.Y) < rimR) return 0; return d > gyro ? 1 : 0.55; };
        let a = -1, k0 = 0; const run = (r0, r1, k) => { if (r1 - r0 < 1) return; const sub = SP.slice(r0, r1 + 1), w = u => rr((r0 + u * (r1 - r0)) / N); c.fillStyle = rgbaH(bloomC, 0.2 * ba * k); ribbon(c, sub, w, 1.7); c.fill(); };
        for (let s2 = 0; s2 <= Nn + 1; s2++) { const k = s2 <= Nn ? ok(s2) : 0; if (k && a < 0) { a = s2; k0 = k; } else if (a >= 0 && (k !== k0)) { run(a, s2 - 1, k0); a = k ? s2 : -1; k0 = k; } } }
      const below = pts.findIndex(p => p[2] < -0.15);
      const piece = (a, b, clip, k) => { if (b - a < 1) return; const sub = SP.slice(a, b + 1), wsub = u => wf((a + u * (b - a)) / N);
        if (clip) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, pad = 0; sub.forEach((p, i) => { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; pad = Math.max(pad, wf((a + i) / N) * wmax / 2 + 2); }); c.save(); c.beginPath(); c.rect(x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2); c.arc(cam.X, cam.Y, rimR, 0, TAU, true); c.clip('evenodd'); }
        // (at the lowest quality the soft stretch within the inner rings is one band of light, not two)
        (q < 1 && k ? layers.slice(0, 1) : layers).forEach(([wk, col, al]) => { c.fillStyle = rgbaH(col, al * T2.alpha * (k || 1)); ribbon(c, sub, wsub, wk); c.fill(); }); if (clip) c.restore(); };
      // what hangs below the platform shows only past its rim: the stretch wholly beneath it is skipped, the stretch wholly
      // beyond it is drawn as it is, and only the stretch that crosses the rim is clipped, so the clip stays small
      const seg = (a, b, clip, k) => { if (b - a < 1) return; if (!clip) { piece(a, b, false, k); return; }
        const dd = i => Math.hypot(SP[i][0] - cam.X, SP[i][1] - cam.Y), hw = i => wf(i / N) * wmax / 2 + 2, inn = i => dd(i) + hw(i) < rimR, outs = i => dd(i) - hw(i) > rimR;
        const kind = j => inn(j) && inn(j + 1) ? 0 : outs(j) && outs(j + 1) ? 2 : 1;   // a stretch: hidden, crossing the rim, or clear of it
        let lo = -1, hi = -1, c0 = -1, c1 = -1; for (let j = a; j < b; j++) { const kd = kind(j); if (kd === 0) continue; if (lo < 0) lo = j; hi = j; if (kd === 1) { if (c0 < 0) c0 = j; c1 = j; } }
        if (lo < 0) return; if (c0 < 0) { piece(lo, hi + 1, false, k); return; }
        piece(lo, c0, false, k); piece(c0, c1 + 1, true, k); piece(c1 + 1, hi + 1, false, k); };
      // inside the gyroscope its light is softer, so the fish at the heart of it stays clear
      let iR = beyond ? i0 : pts.findIndex(p => dC(p) > RINGS[1].R); if (iR < 0 || iR > i1) iR = i1;
      if (!beyond && iR > 1) { const sE = Math.min(iR, below > 0 ? below : iR); seg(0, sE, false, 0.4); i0 = Math.max(i0, sE - 1); }
      if (below > 0 && below > i0 && below <= i1) { seg(i0, below, false); seg(below - 1, i1, true); } else seg(i0, i1, below >= 0 && below <= i0);
      if (over) return;
      if (M.lite || (M.skipP && M.skipP.spark)) return;
      // pulses of light running out along it, and a trail of sparkles (each painted by the pass whose stretch holds it)
      const sp = SP;
      if (q >= 1) for (let j = 0; j < 2; j++) { const u = ((t * 0.32 + T2.i * 0.13 + j * 0.5) % 1), s2 = Math.min(Nn, Math.round(u * N)); if (pass !== 'main' && !mine(s2)) continue; const p = sp[s2], r = wf(u) * 1.6; c.globalAlpha = 0.55 * T2.alpha; blitSized(c, glowSprite('#FFFFFF'), p[0] - r, p[1] - r, r * 2, r * 2); }
      c.globalAlpha = 1;
      if (q >= 1) for (let j = 0; j < 5; j++) { const u = ((t * 0.17 + j / 5 + T2.i * 0.07) % 1), s = Math.min(Nn, Math.round(u * N)); if (pass !== 'main' && !mine(s)) continue; const p = sp[s], wv = wf(u) * (0.6 + 0.5 * Math.sin(t * 3 + j + T2.i)); TN.twinkle(c, p[0] + Math.sin(t * 2 + j * 2) * wv, p[1] + Math.cos(t * 1.7 + j) * wv, Math.max(1.2, T * 0.12 * (1 - u * 0.5)), '#FFFFFF', 0.7 * (1 - u) * T2.alpha); }
    });
    c.restore();
  }
  /* ---- the heart of the gyroscope: a little celestial fish, pearl and sky blue, with veil fins of light, big jewel eyes
     and a gem on its brow. It swims inside the smallest ring, small enough that no ring ever passes through it ---- */
  function spline(pts, n) { const out = []; for (let i = 0; i < pts.length - 1; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]; for (let j = 0; j < n; j++) { const s = j / n, s2 = s * s, s3 = s2 * s; out.push([0, 1, 2].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * s + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * s2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * s3))); } } out.push(pts[pts.length - 1]); return out; }
  function capPath(sp, wf) {
    const N = sp.length - 1, L = [], R = [], ang = [];
    for (let i = 0; i <= N; i++) { const p = sp[i], a = sp[Math.max(0, i - 1)], b = sp[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, w = Math.max(0.5, wf(i / N) / 2); L.push([p[0] - dy / d * w, p[1] + dx / d * w]); R.push([p[0] + dy / d * w, p[1] - dx / d * w]); ang.push(Math.atan2(dy, dx)); }
    return c => { c.moveTo(L[0][0], L[0][1]); for (let i = 1; i <= N; i++) c.lineTo(L[i][0], L[i][1]); c.arc(sp[N][0], sp[N][1], Math.max(0.5, wf(1) / 2), ang[N] + Math.PI / 2, ang[N] - Math.PI / 2, true); for (let i = N; i >= 0; i--) c.lineTo(R[i][0], R[i][1]); c.arc(sp[0][0], sp[0][1], Math.max(0.5, wf(0) / 2), ang[0] - Math.PI / 2, ang[0] + Math.PI / 2, true); c.closePath(); };
  }
  // ellipsoids for the head: a centre and three semi-axes in the world; their outlines on this camera are ellipses
  function ellW3(C, ax) { return { C, A: ax.map(([e, r]) => [e[0] * r, e[1] * r, e[2] * r]) }; }
  function ellScr3(E, cam) { let sxx = 0, sxy = 0, syy = 0; E.A.forEach(a0 => { const a = YAW ? yawV(a0) : a0, x = a[0], y = a[1] * SE - a[2] * CE; sxx += x * x; sxy += x * y; syy += y * y; }); const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)), p = cam.L(E.C); return { x: p[0], y: p[1], rx: Math.sqrt(tr / 2 + disc) * cam.T, ry: Math.sqrt(Math.max(1e-6, tr / 2 - disc)) * cam.T, rot: 0.5 * Math.atan2(2 * sxy, sxx - syy) }; }
  function onE3(E, s) { const A = E.A; return [0, 1, 2].map(j => E.C[j] + A[0][j] * s[0] + A[1][j] * s[1] + A[2][j] * s[2]); }
  function nE3(E, s) { const A = E.A, l = A.map(v => dot3(v, v) || 1); return [0, 1, 2].map(j => A[0][j] * s[0] / l[0] + A[1][j] * s[1] / l[1] + A[2][j] * s[2] / l[2]); }
  function visN(n) { return dot3(n, VW) / (Math.hypot(n[0], n[1], n[2]) || 1); }
  function hullPts(pts) { pts = pts.slice().sort((p, q) => p[0] - q[0] || p[1] - q[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], hi = []; for (const p of pts) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); } for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop(); hi.push(p); } return lo.slice(0, -1).concat(hi.slice(0, -1)); }
  function patch3(E, cam, d, cosMax) { const D = norm3(d), ref = Math.abs(D[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0], p = norm3(cross3(D, ref)), q = cross3(D, p), am = Math.acos(clamp(cosMax, -1, 1)), pts = []; for (let i = 0; i <= 4; i++) { const al = am * i / 4, ca = Math.cos(al), sa = Math.sin(al); for (let j = 0; j < (i ? 14 : 1); j++) { const be = j / 14 * TAU, s = [0, 1, 2].map(k => D[k] * ca + (p[k] * Math.cos(be) + q[k] * Math.sin(be)) * sa); if (visN(nE3(E, s)) > -0.06) pts.push(cam.L(onE3(E, s))); } } return pts.length >= 3 ? hullPts(pts) : null; }
  function restK(M) { return M.end ? sstep(0.9, 3.6, M.end.t) : (M.rest || 0); }
  // the fish's frame: it turns to face the pet three-quarters on, faces you when it curls up or comes to rest
  // how freely it swims: it stops to cast, curls up, comes to rest, and holds still in the golden corridor
  function fishSwim(M) { return clamp(1 - Math.max(M.curl || 0, restK(M), M.corr || 0, (M.castK || 0) * 0.85), 0, 1); }
  // the fish's frame: it swims little circles inside the smallest ring, banking into the turn and now and then spinning
  // right round; it turns to face the pet when it casts, and faces you when it curls up or comes to rest
  function fishFrame(M, C3) {
    const t = M.bt || 0, cu = M.curl || 0, ck = M.castK || 0, rest = restK(M), you = M.end ? sstep(3.4, 4.4, M.end.t) : 0, face = Math.max(cu, you, rest * 0.6), sk = fishSwim(M);
    const th = M.swimA == null ? t * 1.25 : M.swimA, tm = t % TRICK, hop = sstep(TRICK - 1.0, TRICK - 0.55, tm) * (1 - sstep(TRICK - 0.55, TRICK - 0.1, tm)), off = [Math.cos(th) * 0.26 * FS * sk, Math.sin(th) * 0.26 * FS * sk, (Math.sin(t * 1.7) * 0.09 + hop * 0.13) * FS * sk];
    const y0 = M.fyaw == null ? -th : M.fyaw, yaw = y0 + angTo(y0, 0.14) * face, pitch = ck * 0.3 + Math.sin(t * 1.1) * 0.07 - cu * 0.08 + hop * 0.25 * sk, roll = -0.26 * sk + Math.sin(t * 1.3) * 0.07 + (M.froll || 0);
    const f = norm3([Math.sin(yaw) * Math.cos(pitch), Math.cos(yaw) * Math.cos(pitch), Math.sin(pitch)]), s0 = norm3(cross3(f, [0, 0, 1])), u0 = cross3(s0, f), s = rotAx(s0, f, roll), u = rotAx(u0, f, roll);
    const O = [C3[0] + off[0], C3[1] + off[1], C3[2] + off[2]];
    const at = (a, b, cc) => [O[0] + (f[0] * a + s[0] * b + u[0] * cc) * FS, O[1] + (f[1] * a + s[1] * b + u[1] * cc) * FS, O[2] + (f[2] * a + s[2] * b + u[2] * cc) * FS];
    const tp = M.tailPh == null ? t * 4 : M.tailPh;
    return { t, cu, ck, rest, you, f, s, u, at, O, sk, tp, sw: Math.sin(tp) * (1 - cu * 0.85) * (0.8 + 0.4 * sk) };
  }
  function fishBody(F) { return ellW3(F.at(0.05, 0, 0), [[F.f, (0.86 - F.cu * 0.12) * FS], [F.s, 0.48 * FS], [F.u, 0.62 * FS]]); }
  function jewelLocal(M) { const F = fishFrame(M, [0, 0, 0]), B = fishBody(F), sv = norm3([0.42, 0, 0.9]), p = onE3(B, sv), n = norm3(nE3(B, sv)); return add3(p, n, 0.04 * FS); }
  function drawFish(c, FX, cam, M, lv, q) {
    const T = cam.T, F = fishFrame(M, cam.C3), { f, s, u, at, t, cu, ck, sw } = F, lw = Math.max(1.2, T * 0.05 * Math.sqrt(FS));
    const body = fishBody(F), near = visN(s) >= 0 ? 1 : -1, side = clamp(1 - Math.abs(f[0]) / 0.6, 0, 1), sgn = (M.fyaw == null ? 1 : M.fyaw) >= 0 ? 1 : -1;
    // (at the lowest quality its fins are plain: a fill and an outline, with no cel bands and no ribs, so nothing is clipped)
    const lo = q < 1, finO = (r, o) => Object.assign({ col: '#CFF6FF', shade: '#A4DCF4', shade2: '#8AC8EA', hi: '#FFFFFF', line: '#2C5C96', lw: lw * 0.75, r, d1: 0.1, d2: 0.2, spec: false, force: !lo, alpha: 0.9 }, o || {});
    // a fin: an outline in the fish's frame, a wash of violet light toward its edge, soft ribs fanning from its base
    const finShape = (pts3, ribs, edgeAt) => { const P2 = pts3.map(cam.L); TN.shape(c, TN.blob(P2), finO(T * FS * 0.3, lo ? {} : { inner: g => {
      if (edgeAt) { const a = cam.L(edgeAt[0]), b = cam.L(edgeAt[1]), gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, 'rgba(200,170,255,0)'); gr.addColorStop(1, 'rgba(214,180,255,.6)'); g.fillStyle = gr; g.fillRect(-1e4, -1e4, 2e4, 2e4); }
      g.strokeStyle = 'rgba(70,130,205,.42)'; g.lineWidth = Math.max(0.8, T * 0.022); g.lineCap = 'round'; ribs.forEach(([p0, p1]) => { const a = cam.L(p0), b = cam.L(p1); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }); } })); return P2; };
    // a soft light about it
    { const cp = cam.L(F.O); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3; blitSized(c, glowSprite('#BFF4FF'), cp[0] - T * 1.7 * FS, cp[1] - T * 1.7 * FS, T * 3.4 * FS, T * 3.4 * FS); c.restore(); }
    // its tail: a short stalk and a veil of two long lobes that swishes and ripples; seen head-on it turns aside
    const turn = sw * 0.42 + side * 1.35 * sgn, tb = at(-0.8, sw * 0.1 + side * 0.12 * sgn, 0.02), bk = rotAx([-f[0], -f[1], -f[2]], u, turn), bs = norm3(cross3(u, bk));
    const TL = (x, y) => { const k = x * FS, bend = (sw * 0.24 + side * 0.1 * sgn) * x * x, rip = Math.sin(t * 3 - x * 5) * 0.045 * x; return [tb[0] + bk[0] * k + u[0] * (y + rip) * FS + bs[0] * bend * FS, tb[1] + bk[1] * k + u[1] * (y + rip) * FS + bs[1] * bend * FS, tb[2] + bk[2] * k + u[2] * (y + rip) * FS + bs[2] * bend * FS]; };
    const tailOut = [[0, 0.12], [0.18, 0.28], [0.42, 0.5], [0.7, 0.7], [0.9, 0.74], [0.96, 0.6], [0.82, 0.38], [0.72, 0.16], [0.66, 0], [0.74, -0.18], [0.88, -0.4], [0.98, -0.62], [0.9, -0.74], [0.66, -0.66], [0.4, -0.46], [0.16, -0.26], [0, -0.12]];
    const drawTail = () => {
      TN.shape(c, capPath([at(-0.45, 0, 0), at(-0.66, sw * 0.05, 0.01), tb].map(cam.L), uu => T * FS * lerp(0.52, 0.28, uu)), { col: '#8FD2F6', shade: '#62B2EA', shade2: '#4C98D6', hi: '#D8F2FF', line: SK_INK, lw, r: T * FS * 0.3, force: !lo, spec: false });
      finShape(tailOut.map(([x, y]) => TL(x, y)), [[0.04, 0.06, 0.88, 0.7], [0.04, 0.03, 0.75, 0.36], [0.04, -0.03, 0.78, -0.38], [0.04, -0.06, 0.94, -0.68]].map(([x0, y0, x1, y1]) => [TL(x0, y0), TL(x1, y1)]), [TL(0.2, 0), TL(0.95, 0)]);
      if (q >= 1) [[0.92, 0.72], [0.95, -0.7]].forEach(([x, y], i) => { const p = cam.L(TL(x, y)); TN.twinkle(c, p[0], p[1], Math.max(1.5, T * 0.12 * (0.7 + 0.3 * Math.sin(t * 4 + i * 2))), '#FFFFFF', 0.85); }); };
    // the dorsal sail along its back (leaning aside when seen head-on), a little veil beneath, and the paired fins
    const lean = side * 0.5, DR = (a, cc) => { const h = 0.45 + (cc - 0.45) * (1 - side * 0.65); return at(a, Math.sin(F.tp * 0.8 - a * 4) * (0.05 + 0.04 * F.sk) + lean * Math.max(0, h - 0.45) * sgn, h); };
    const drawDorsal = () => { finShape([DR(0.32, 0.5), DR(0.2, 0.7), DR(0.0, 0.96), DR(-0.28, 1.08), DR(-0.56, 1.0), DR(-0.82, 0.74), DR(-0.74, 0.44), DR(-0.2, 0.52)],
      [[DR(0.12, 0.55), DR(0.02, 0.92)], [DR(-0.16, 0.55), DR(-0.28, 1.04)], [DR(-0.42, 0.5), DR(-0.6, 0.96)]], [DR(-0.2, 0.55), DR(-0.28, 1.08)]);
      if (q >= 1) { const p = cam.L(DR(-0.3, 1.08)); TN.twinkle(c, p[0], p[1], Math.max(1.5, T * 0.1), '#FFFFFF', 0.8); } };
    const AN = (a, cc) => at(a, Math.sin(t * 2.6 - a * 5) * 0.05, cc);
    const drawAnal = () => finShape([AN(-0.28, -0.5), AN(-0.42, -0.74), AN(-0.66, -0.84), AN(-0.86, -0.7), AN(-0.7, -0.44)], [[AN(-0.4, -0.52), AN(-0.6, -0.8)]], [AN(-0.4, -0.5), AN(-0.66, -0.84)]);
    const pecPts = sd => { const wv = Math.sin(F.tp * 0.9 + sd * 1.3) * (0.12 + 0.08 * F.sk), sp = ck * 0.3;
      const P = [[0.16, 0.42, -0.16], [-0.1, 0.55, -0.06], [-0.44, 0.68 + sp, -0.14 + wv * 0.5 + sp * 0.4], [-0.6, 0.74 + sp, -0.34 + wv + sp * 0.3], [-0.52, 0.74 + sp, -0.6 + wv * 0.8 + sp * 0.2], [-0.3, 0.66 + sp, -0.66 + wv * 0.6], [-0.02, 0.52, -0.42]];
      const W2 = [[0.2, 0.44, -0.16], [0.34, 0.5, -0.02], [0.56, 0.42, 0.06], [0.72, 0.28, 0.0], [0.68, 0.3, -0.2], [0.5, 0.42, -0.3], [0.26, 0.48, -0.34]];
      return P.map((p, i) => { const q2 = cu > 0.01 ? [lerp(p[0], W2[i][0], cu), lerp(p[1], W2[i][1], cu), lerp(p[2], W2[i][2], cu)] : p; return at(q2[0], sd * q2[1], q2[2]); }); };
    const drawPec = sd => { const P = pecPts(sd); finShape(P, [[P[0], P[2]], [P[0], P[3]], [P[0], P[4]], [P[0], P[5]]], [P[0], P[3]]); };
    const drawVent = sd => TN.shape(c, capPath(spline([at(0.08, sd * 0.2, -0.55), at(-0.12, sd * 0.28, -0.72), at(-0.32, sd * 0.3, -0.82)], 3).map(cam.L), uu => T * FS * lerp(0.2, 0.06, uu)), finO(T * FS * 0.15));
    const tailFar = cam.dep(at(-1.2, 0, 0)) < cam.dep(at(0.2, 0, 0));
    // mid-roll its back turns away: then the sail is behind the body and the little veil beneath in front of it
    const back = visN(u) >= -0.12;
    drawPec(-near); drawVent(-near); if (back) drawAnal(); else drawDorsal();
    if (tailFar) drawTail();
    // the body: pearl-blue, deeper blue down its back, a cream belly, gold star freckles
    const sc = ellScr3(body, cam);
    TN.shape(c, TN.ell(sc.x, sc.y, sc.rx, sc.ry, sc.rot), { col: '#9AD8F8', shade: '#6CB8EC', shade2: '#4E9CDA', hi: '#E6F7FF', line: SK_INK, lw, r: Math.max(sc.rx, sc.ry), d1: 0.12, d2: 0.24, spec: 0.7, specR: 0.2, specAt: [sc.x - sc.rx * 0.3, sc.y - sc.ry * 0.45], force: true, inner: g => {
      const pf = (d, cm, col) => { const hp = patch3(body, cam, d, cm); if (!hp) return; g.fillStyle = col; g.beginPath(); hp.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); g.fill(); };
      pf([u[0] - f[0] * 0.15, u[1] - f[1] * 0.15, u[2] - f[2] * 0.15], 0.58, rgbaH('#4FA6E6', 0.75));
      pf([f[0] * 0.25 - u[0], f[1] * 0.25 - u[1], f[2] * 0.25 - u[2]], 0.62, BELLY);
      // a gill line behind the eye
      [-1, 1].forEach(sd => { const pts = []; for (let i = 0; i <= 6; i++) { const k = i / 6, sv = norm3([0.18 - 0.05 * Math.sin(k * Math.PI), sd * 0.9, lerp(0.38, -0.32, k)]); if (visN(nE3(body, sv)) > 0.05) pts.push(cam.L(onE3(body, sv))); } if (pts.length > 2) { g.strokeStyle = 'rgba(30,90,160,.45)'; g.lineWidth = Math.max(1, T * 0.03); g.lineCap = 'round'; g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.stroke(); } });
      [[-0.1, 0.3, 0.92], [-0.4, 0.46, 0.76], [0.2, 0.48, 0.8], [-0.62, 0.2, 0.74], [0.04, 0.64, 0.66], [-0.3, 0.7, 0.55]].forEach(([a, b, cc], i) => [-1, 1].forEach(sd => { const sv = norm3([a, sd * b, cc]); if (visN(nE3(body, sv)) < 0.1) return; const p = cam.L(onE3(body, sv)); TN.twinkle(g, p[0], p[1], Math.max(1.5, T * FS * (i % 2 ? 0.06 : 0.045)), '#FFE38A', 0.95); }));
    } });
    drawVent(near); if (back) drawDorsal(); else drawAnal();
    // its face: big jewel eyes, a blush under each, a small smile (an 'o' when it casts)
    const open = clamp(M.eyes == null ? 1 : M.eyes, 0, 1) * (1 - cu * 0.95) * (M.end ? lerp(0.5, 0.82, F.you) : 1);
    [-1, 1].forEach(sd => { const sv = norm3([0.6, sd * 0.58, 0.3]), n = nE3(body, sv); if (visN(n) < -0.05) return;
      const bv = norm3([0.55, sd * 0.68, 0.02]); if (visN(nE3(body, bv)) > 0.1) { const bp = cam.L(onE3(body, bv)); c.fillStyle = 'rgba(255,150,190,.35)'; c.beginPath(); c.ellipse(bp[0], bp[1], T * FS * 0.11, T * FS * 0.06, 0, 0, TAU); c.fill(); }
      drawGemEye(c, cam.L(onE3(body, sv)), n, 0.2 * FS * T, { open, glow: ck, look: F.you > 0.5 ? [0, 1] : M.look, lid: '#86CCF4', lidK: 0.24 }); });
    { const mv = norm3([0.97, 0, -0.2]); if (visN(nE3(body, mv)) > -0.2) { c.save(); c.strokeStyle = SK_INK; c.fillStyle = '#1E3A6A'; c.lineWidth = Math.max(1, lw * 0.7); c.lineCap = 'round';
      if (ck > 0.3) { const p = cam.L(onE3(body, mv)); c.beginPath(); c.ellipse(p[0], p[1], T * FS * 0.05, T * FS * 0.065, 0, 0, TAU); c.fill(); }
      else { c.beginPath(); for (let i = 0; i <= 8; i++) { const k = -1 + i / 4, p = cam.L(onE3(body, norm3([0.97, k * 0.2, -0.17 - 0.06 * (1 - k * k)]))); i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke(); }
      c.restore(); } }
    // the gem on its brow (laid bare in the corridor)
    const jw = add3(cam.C3, jewelLocal(M), 1), gemV = visN(nE3(body, norm3([0.42, 0, 0.9]))); if (gemV > -0.3) drawJewel(c, cam, M, jw, T, false, 0.16 * FS);
    if (!tailFar) drawTail();
    drawPec(near);
    // its light too, unless the fish has rolled over and the gem is on its far side
    if (gemV > -0.45) drawJewel(c, cam, M, jw, T, true, 0.16 * FS);
    // and over all of it a soft bloom of warm light, as if it shone from within
    { const cp = cam.L(add3(cam.C3, jewelLocal(M), 0.6)), r = T * FS * 2.2; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.42 + 0.05 * Math.sin(t * 2.2); blitSized(c, glowSprite('#FFF4D0'), cp[0] - r, cp[1] - r, r * 2, r * 2); c.restore(); }
  }
  // a jewel of an eye: a turquoise iris ringed in gold that fills it, a tall pupil, two catchlights, a soft upper lid
  function drawGemEye(c, p, n, r, o) {
    const N = norm3(n); let t1 = [N[1], -N[0], 0]; const l1 = Math.hypot(t1[0], t1[1]) || 1; t1 = [t1[0] / l1, t1[1] / l1, 0]; const t2 = cross3(t1, N);
    const q1 = YAW ? yawV(t1) : t1, q2 = YAW ? yawV(t2) : t2, a1 = [q1[0] * r, (q1[1] * SE - q1[2] * CE) * r], a2 = [q2[0] * r * 1.1, (q2[1] * SE - q2[2] * CE) * r * 1.1], E2 = (x, y) => [p[0] + a1[0] * x + a2[0] * y, p[1] + a1[1] * x + a2[1] * y];
    const ring = (cx, cy, rx, ry, n2) => { const out = []; for (let i = 0; i < (n2 || 22); i++) { const a = i / (n2 || 22) * TAU; out.push(E2(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry)); } return out; };
    const path = pts => { c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); }, fill = (pts, col) => { path(pts); c.fillStyle = col; c.fill(); };
    const L3 = [o.look[0], o.look[1], -0.3], lx = clamp(dot3(L3, t1), -1, 1), ly = clamp(dot3(L3, t2), -1, 1), op = o.open, gl = o.glow || 0, lidC = o.lid || AZ;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    if (op < 0.12) { c.strokeStyle = SK_INK; c.lineWidth = Math.max(1.4, r * 0.2); c.beginPath(); for (let i = 0; i <= 8; i++) { const x = -0.9 + i / 8 * 1.8, q2 = E2(x, -0.1 - 0.28 * (1 - x * x)); i ? c.lineTo(q2[0], q2[1]) : c.moveTo(q2[0], q2[1]); } c.stroke(); c.restore(); return; }
    const eye = ring(0, 0, 1, 1.12, 26); fill(eye, '#FFFFFF'); path(eye); c.save(); c.clip();
    const ix = lx * 0.16, iy = ly * 0.14 - 0.04;
    fill(ring(ix, iy, 0.93, 1.0), '#E8B84A'); fill(ring(ix, iy, 0.85, 0.92), '#0A5670'); fill(ring(ix, iy - 0.1, 0.78, 0.8), '#1598B4'); fill(ring(ix, iy - 0.42, 0.56, 0.36), '#5FEFE6');
    fill(ring(ix, iy + 0.04, 0.2 - gl * 0.05, 0.56), '#041A26'); fill(ring(ix - 0.3, iy + 0.36, 0.24, 0.19), '#FFFFFF'); fill(ring(ix + 0.32, iy - 0.3, 0.1, 0.1), 'rgba(255,255,255,.9)');
    if (gl > 0.05) { c.globalCompositeOperation = 'lighter'; fill(ring(ix, iy, 0.85, 0.92), rgbaH('#7FFFF0', 0.4 * gl)); c.globalCompositeOperation = 'source-over'; }
    // the upper lid, low and serene; it lifts when it casts and closes as it sleeps
    const ly2 = 1.12 - (1 - op) * 2.1 - (o.lidK == null ? 0.4 : o.lidK) * (1 - gl); const lid = []; for (let i = 0; i <= 12; i++) { const x = -1.3 + i / 12 * 2.6; lid.push(E2(x, ly2 + 0.16 * (1 - x * x / 1.69))); } fill([E2(-1.4, 1.7), E2(1.4, 1.7)].concat(lid.slice().reverse()), lidC); const sh2 = []; for (let i = 0; i <= 12; i++) { const x = -1.3 + i / 12 * 2.6; sh2.push(E2(x, ly2 + 0.16 * (1 - x * x / 1.69) - 0.2)); } fill(lid.concat(sh2.slice().reverse()), rgbaH(AZ_SH2, 0.32));
    c.restore();
    c.strokeStyle = SK_INK; c.lineWidth = Math.max(1, r * 0.09); path(eye); c.stroke();
    c.lineWidth = Math.max(1.5, r * 0.2); c.beginPath(); for (let i = 0; i <= 12; i++) { const x = -1.0 + i / 12 * 2.0, q2 = E2(x, ly2 + 0.16 * (1 - x * x / 1.69)); i ? c.lineTo(q2[0], q2[1]) : c.moveTo(q2[0], q2[1]); } c.stroke();
    c.restore();
  }
  /* the gem on its brow: a round-cut jewel of turquoise and white light, its facets turning slowly; laid bare in the
     corridor it blazes. Drawn in two passes: the gem itself, then its light over everything */
  function drawJewel(c, cam, M, jw, T, glowPass, size) {
    const t = M.bt || 0, bare = M.obl && M.obl.corr ? 1 : M.corr || 0, cp = cam.L(jw), rJ = (size || 0.16) * T * (1 + bare * 0.4), rot = t * 0.5;
    if (glowPass) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = rJ * (2.8 + 0.3 * Math.sin(t * 3) + bare * 3.5); c.globalAlpha = 0.5 + bare * 0.4; blitSized(c, glowSprite('#9FFFF0'), cp[0] - gr, cp[1] - gr, gr * 2, gr * 2);
      TN.twinkle(c, cp[0] + rJ * 0.2, cp[1] - rJ * 0.25, rJ * (0.95 + 0.3 * Math.sin(t * 5)), '#FFFFFF', 0.9);
      if (bare) for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + t * 0.5, L = rJ * (7 + 2 * Math.sin(t * 4 + i)); c.strokeStyle = rgbaH('#FFF4C8', 0.5); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.moveTo(cp[0] + Math.cos(a) * rJ * 1.4, cp[1] + Math.sin(a) * rJ * 1.4); c.lineTo(cp[0] + Math.cos(a) * L, cp[1] + Math.sin(a) * L); c.stroke(); }
      c.restore(); return;
    }
    const oct = (r, a0) => { const o = []; for (let i = 0; i < 8; i++) { const a = a0 + i / 8 * TAU; o.push([cp[0] + Math.cos(a) * r, cp[1] + Math.sin(a) * r * 0.92]); } return o; };
    const G = oct(rJ, rot), Tb = oct(rJ * 0.52, rot + TAU / 16), poly = (P, col) => { c.beginPath(); P.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fillStyle = col; c.fill(); };
    c.save(); c.lineJoin = 'round';
    poly(G, '#2AB8C8');
    for (let i = 0; i < 8; i++) { const a = rot + (i + 0.5) / 8 * TAU, l = Math.cos(a - 2.3), col = l > 0.6 ? '#E8FFFC' : l > 0.1 ? '#8FF4EA' : l > -0.5 ? '#3CCFD6' : '#1E8EA8'; poly([G[i], G[(i + 1) % 8], Tb[i]], col); poly([Tb[i], G[(i + 1) % 8], Tb[(i + 1) % 8]], mixH(col, '#FFFFFF', 0.2)); }
    poly(Tb, '#C8FFF8');
    c.strokeStyle = '#0E4A5C'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); G.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.stroke();
    c.restore();
  }
  /* ---- the wings: two giant feathered wings spread just outside the outer ring, each a third of the arena across,
     cel-shaded white with the stage's light in their tips; four rows of feathers on a curved skeleton, beating slowly ---- */
  // the wing's arm, in its own plane (x out from the root, y up): shoulder, elbow, wrist, the hand's tip
  function wingBone(v) {
    const P = [[0, 0], [0.85, 1.15], [1.85, 2.0], [3.0, 2.5], [4.1, 2.7], [4.8, 2.6]], k = clamp(v, 0, 1) * (P.length - 1), i = Math.min(P.length - 2, Math.floor(k)), e = k - i;
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)], e2 = e * e, e3 = e2 * e;
    return [0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * e + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * e2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * e3));
  }
  // every feather of one wing, in the wing's own plane: [x, y, angle, length, width, row, index]. Long primaries fan out
  // from the hand, broad secondaries hang from the arm, and two rows of coverts lie over their roots
  function wingPlan() {
    if (wingPlan.c) return wingPlan.c; const F = [], D = Math.PI / 180;
    for (let i = 0; i < 6; i++) { const k = i / 5, b = wingBone(0.04 + 0.5 * k); F.push([b[0], b[1], lerp(-104, -80, k) * D, lerp(3.3, 3.9, k), 1.1, 0, i]); }
    for (let i = 6; i >= 0; i--) { const k = i / 6, b = wingBone(0.55 + 0.45 * k); F.push([b[0], b[1], lerp(-74, 4, Math.pow(k, 0.9)) * D, lerp(4.1, 5.1, Math.sin(k * 2.2) * 0.7 + k * 0.3), 1.12, 1, i]); }
    for (let i = 8; i >= 0; i--) { const k = i / 8, b = wingBone(0.05 + 0.9 * k); F.push([b[0], b[1] - 0.15, lerp(-100, -16, Math.pow(k, 0.85)) * D, lerp(1.9, 2.3, k), 0.92, 2, i]); }
    for (let i = 0; i < 8; i++) { const k = i / 7, b = wingBone(0.02 + 0.9 * k); F.push([b[0], b[1] + 0.08, lerp(-94, -36, k) * D, 1.05 + 0.1 * Math.sin(i * 1.7), 0.72, 3, i]); }
    return (wingPlan.c = F);
  }
  // the pairs of wings. The fight's Bahamut has one; the Anima has one in its first forms and four in its final form,
  // fanned like a seraph's: the great main pair spread wide, and above it three smaller, narrower pairs, each rooted a
  // little higher and further back and swept up more steeply, beating a moment after the one below, so they ripple
  // together, close but never crossing. s: size; lift: how far it is raised; up, back, inX: where its root sits (in
  // the main pair's size); ph: when it beats; beat, lag: how deep; sx: how long it is drawn out; fl, fl0: how long its
  // flight and inner feathers are; tint: how much it takes the pale teal of the far wings
  // (built on first use: this file's helpers live after its return, where only function declarations are hoisted)
  function wingPairs() {
    return wingPairs.c || (wingPairs.c = {
      boss: [{ s: 1, lift: 0, up: 0, back: 0, inX: 0, ph: 0, beat: 0.44, lag: 0.3, rate: 3.1, fl: 1, tint: 0 }],
      mini: [{ s: 1.25, lift: -0.4, up: 0, back: 0, inX: 0, ph: 0, beat: 0.12, lag: 0.08, fl: 1, tint: 0 }],
      seraph: [
        { s: 1.25, lift: -0.4, up: 0, back: 0, inX: 0, ph: 0, beat: 0.08, lag: 0.04, fl: 1, tint: 0 },
        { s: 0.95, sx: 1.85, lift: 0.2, up: 0.95, back: 0.15, inX: 0.25, ph: 0, beat: 0.08, lag: 0.04, fl: 0.6, fl0: 0.25, tint: 0.2 },
        { s: 0.9, sx: 1.8, lift: 0.64, up: 1.92, back: 0.3, inX: 0.64, ph: 0, beat: 0.08, lag: 0.04, fl: 0.56, fl0: 0.22, tint: 0.4 },
        { s: 0.85, sx: 1.75, lift: 1.08, up: 2.95, back: 0.45, inX: 1.1, ph: 0, beat: 0.08, lag: 0.04, fl: 0.52, fl0: 0.2, tint: 0.6 },
      ],
    });
  }
  function pairsOf(M) { const P = wingPairs(); return !M.mini ? P.boss : M.wings8 ? P.seraph : P.mini; }
  // a wing's frame: rooted just outside the outer ring, raised by the stage, beating slowly, cupped back toward its tip
  function wingW(M, lv, sd, C3, pair) {
    const PR = pairsOf(M)[pair || 0] || wingPairs().boss[0], t = M.bt || 0;
    const lift = [0.12, 0.2, 0.26, 0.34][clamp(lv, 1, 4) - 1] + (M.castK || 0) * 0.12 + (M.flare || 0) * 0.22 - (M.curl || 0) * 0.3 + (M.corr || 0) * 0.12 + PR.lift;
    // a slow, deep beat; the outer feathers lag behind the arm, so the wing bends through each stroke
    const ph = t * (PR.rate || 2.6) + (sd > 0 ? 0 : 0.18) + PR.ph, beat = Math.sin(ph) * PR.beat, lag = Math.sin(ph - 0.9) * PR.lag;
    // rooted just outside the outer ring (or, for the Anima's early forms, the outermost ring it has), M.wS of full size
    const w0 = WS * (M.wS || 1), ws = w0 * PR.s, k0 = w0 / WS, wr = (M.wR != null ? M.wR : RINGS[3].R + 0.5) - PR.inX * k0;
    const R0 = [C3[0] + sd * wr, C3[1] - 0.6 * k0 - PR.back * k0, C3[2] + 0.3 * k0 + PR.up * k0], e0 = norm3([sd, -0.26, 0]), f0 = norm3([0, -0.3, 1]);
    const rot = (v, a) => { const ca = Math.cos(a), sa = Math.sin(a); return [v[0] * ca + v[2] * sa, v[1], -v[0] * sa + v[2] * ca]; };
    const sx = PR.sx || 1, W = (x, y) => { x *= ws * sx; y *= ws; const a = -sd * (lift + beat + lag * x / 3.4), ex = rot(e0, a), ey = rot(f0, a); return [R0[0] + ex[0] * x + ey[0] * y, R0[1] + ex[1] * x + ey[1] * y - x * x * 0.024, R0[2] + ex[2] * x + ey[2] * y]; };
    W.fan = Math.sin(ph + 1.3); W.PR = PR; W.ws = ws; return W;
  }
  // (given a box [x0, y0, x1, y1] it paints nothing and only grows the box round every feather and glow it would paint)
  function drawWings(c, cam, M, lv, q, shed, only, box) {
    const T = cam.T, C3 = cam.C3, P = STAGE[lv - 1], plan = wingPlan(), tip = P.glow, vr = c ? viewRect(c, T * 0.5) : null, PS = pairsOf(M);
    // the highest pair first, furthest back, down to the main pair over them all (or one side only)
    const order = []; for (let pr = PS.length - 1; pr >= 0; pr--) order.push([-1, pr], [1, pr]);
    order.forEach(([sd, pair]) => {
      if (only && sd !== only) return;
      if (M.dbgPair != null && pair !== M.dbgPair) return;
      const W = wingW(M, lv, sd, C3, pair), PR = W.PR, wk = W.ws / WS, dbgC = M.dbgCol ? ['#FF5A5A', '#5AFF7A', '#5AA8FF', '#FFD45A'][pair] : null;
      if (q >= 1 && !shed) { const cp = cam.L(W(4, 1)), gr = T * 4.4 * WS * wk; if (box) boxAdd(box, cp[0], cp[1], gr); else { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.24 * (1 - PR.tint * 0.5); blitSized(c, glowSprite(P.glow), cp[0] - gr, cp[1] - gr, gr * 2, gr * 2); c.restore(); } }
      const col0 = PR.tint ? mixH('#F7FAFF', '#BFE6E6', PR.tint) : '#F7FAFF', col3 = PR.tint ? mixH('#FFF8EC', '#CDEBE3', PR.tint) : '#FFF8EC', sh1 = PR.tint ? mixH('#C6D6F2', '#8FBCC4', PR.tint) : '#C6D6F2', sh2 = PR.tint ? mixH('#A6BAE2', '#6E9AAA', PR.tint) : '#A6BAE2';
      plan.forEach((fe, j) => {
        if ((q < 1 && fe[5] === 3) || (M.lite && fe[5] >= 2)) return;
        let [x, y, a, L, w, row] = fe, off = null, al = 1;
        L *= row === 0 ? (PR.fl0 != null ? PR.fl0 : PR.fl) : row === 1 ? PR.fl : 0.5 + 0.5 * (PR.fl0 != null ? PR.fl0 : PR.fl);
        // the flight feathers spread apart on the downstroke and close up on the up
        if (row < 2) a += (row === 1 ? fe[6] / 6 - 0.5 : (fe[6] / 5 - 0.5) * 0.5) * 0.34 * W.fan;
        if (shed) { const st = 0.25 + ((j * 0.37 + (sd > 0 ? 0.17 : 0)) % 1) * 1.5, s = Math.max(0, shed - st); if (s > 0) { al = 1 - clamp(s / 2.4, 0, 1); if (al <= 0.01) return; a += s * (j % 2 ? 0.9 : -0.9); off = [sd * s * 0.7, -s * 0.3, -s * s * 1.3 - s * 0.4]; } }
        const d = [Math.cos(a), Math.sin(a)], n = [-d[1], d[0]], pt = (k, m) => { const p = W(x + d[0] * L * k + n[0] * w * m, y + d[1] * L * k + n[1] * w * m); return cam.L(off ? add3(p, off, 1) : p); };
        const out = [pt(-0.04, 0), pt(0.12, 0.3), pt(0.42, 0.5), pt(0.74, 0.48), pt(0.92, 0.3), pt(1.02, 0.04), pt(0.94, -0.2), pt(0.72, -0.38), pt(0.4, -0.4), pt(0.12, -0.26)];
        if (box) { const pd = Math.max(4, T * 0.12); for (const p of out) boxAdd(box, p[0], p[1], pd); return; }
        // close in, the wings spread past the edges of the screen: a feather wholly off it is not painted at all
        if (vr) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of out) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } if (x1 < vr.x0 || x0 > vr.x1 || y1 < vr.y0 || y0 > vr.y1) return; }
        const r = Math.max(M.lite ? 1.5 : 4, w * WS * wk * T * 0.8);
        if (dbgC) { c.save(); c.globalAlpha = 0.5; c.fillStyle = dbgC; c.beginPath(); out.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.restore(); return; }
        // the flight feathers carry the stage's light in their tips; the shaft runs down each
        feather(c, out, { col: row === 3 ? col3 : col0, sh1, sh2, line: '#2F4170', lw: Math.max(1, T * (row === 3 ? 0.035 : 0.045)), r, alpha: al, q,
          tip: row < 2 && q >= 2 ? [pt(0.55, 0), pt(1, 0), tip] : null, tint: row === 3 ? out.slice(0, 4) : null, shaft: (row >= 2 && q < 2) || q < 1 ? null : [pt(0.02, 0), pt(0.9, 0), Math.max(0.8, T * 0.025)] });
      });
    });
  }
  /* a feather, shaded as the toon kit's shape() shades a shape (a deep band on the side from the light, a highlight on the
     side toward it, its ink outline) but with no clip: its outline is the same smooth curve walked as a polygon, and each
     band is that polygon less the part of it its shifted copy covers, worked out here, so a feather is a few fills and two
     strokes. A wing is sixty of them, repainted three times a second, and a clip is a mask of the shape each time */
  function smoothPoly(pts) {
    // the Catmull-Rom curve the kit's blob() draws through the points, three points to each span
    const n = pts.length, P = i => pts[((i % n) + n) % n], out = [];
    for (let i = 0; i < n; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      out.push(p1); for (const u of [1 / 3, 2 / 3]) { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, cc = 3 * v * u * u, d = u * u * u; out.push([a * p1[0] + b * c1[0] + cc * c2[0] + d * p2[0], a * p1[1] + b * c1[1] + cc * c2[1] + d * p2[1]]); } }
    return out;
  }
  function feather(c, pts, o) {
    // (the kit's light from the upper left; worked out here, as this file's helpers lie past its return, where only
    // declared functions are ready)
    const FL_LX = -0.55 / 0.97082, FL_LY = -0.8 / 0.97082;
    const S = smoothPoly(pts), path = Q => { c.moveTo(Q[0][0], Q[0][1]); for (let i = 1; i < Q.length; i++) c.lineTo(Q[i][0], Q[i][1]); c.closePath(); }, d2 = o.r * 0.3, d1 = o.r * 0.16;
    c.save(); c.globalAlpha = o.alpha; c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); path(S); c.fillStyle = o.col; c.fill();
    if (o.q >= 1) {
      const band = (dx, dy, col) => { const keep = TN.clipTo(S, S.map(p => [p[0] + dx, p[1] + dy])); c.beginPath(); path(S); if (keep.length > 2) path(keep); c.fillStyle = col; c.fill('evenodd'); };
      // (at full quality the deeper band, as shape() paints it, at the very edge; else the plain shadow band)
      if (o.q >= 2) band(FL_LX * d2 * 1.9, FL_LY * d2 * 1.9, o.sh2); else band(FL_LX * d2, FL_LY * d2, o.sh1);
      band(-FL_LX * d1, -FL_LY * d1, '#FFFFFF');
    }
    // its tip lit by the stage's light (a gradient from nothing halfway down it, so the whole feather can take it)
    if (o.tip) { const [a0, a1, col] = o.tip, gr = c.createLinearGradient(a0[0], a0[1], a1[0], a1[1]); gr.addColorStop(0, rgbaH(col, 0)); gr.addColorStop(1, rgbaH(col, 0.6)); c.beginPath(); path(S); c.fillStyle = gr; c.fill(); }
    if (o.tint) { c.fillStyle = rgbaH('#E8C46A', 0.35); c.beginPath(); path(o.tint); c.fill(); }
    if (o.shaft) { const [s0, s1, lw] = o.shaft; c.strokeStyle = 'rgba(150,170,215,.7)'; c.lineWidth = lw; c.beginPath(); c.moveTo(s0[0], s0[1]); c.lineTo(s1[0], s1[1]); c.stroke(); }
    c.beginPath(); path(S); c.lineWidth = o.lw; c.strokeStyle = o.line; c.stroke();
    c.restore();
  }
  /* where on the screen each of its kept pictures has something in it, so each picture is only as big as what it holds
     (a picture the size of the view costs a clear and a copy of a whole screen every frame, however little is in it) */
  function boxAdd(b, x, y, r) { if (x - r < b[0]) b[0] = x - r; if (y - r < b[1]) b[1] = y - r; if (x + r > b[2]) b[2] = x + r; if (y + r > b[3]) b[3] = y + r; }
  // the rings, with room for their pulses of light and their glow
  function ringsBox(cam, M, b) { const nR = M.rN || 4; for (let k = 0; k < nR; k++) { const G = ringGeo(M, k, cam.C3), p = cam.L(G.c); boxAdd(b, p[0], p[1], (G.R + G.w + 1.3) * cam.T); } }
  // the tentacles: their curves sampled as they are drawn, with room for their halo, their sway and their sparkles
  function tentsBox(cam, M, b) { const T = cam.T; M.tents.forEach(T2 => { if (!T2.P || T2.alpha < 0.02) return; for (let s = 0; s <= 10; s++) { const p = cam.B(bez(T2.P, s / 10)); boxAdd(b, p[0], p[1], T * 2.0 + 6); } }); }
  // what of the drawing space the canvas shows, grown by a margin (null when the canvas is turned, and nothing is culled)
  function viewRect(c, pad) {
    const cv = c.canvas; if (!cv || !c.getTransform) return null;
    const m = c.getTransform(); if (Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 || !m.a || !m.d) return null;
    const xa = -m.e / m.a, xb = (cv.width - m.e) / m.a, ya = -m.f / m.d, yb = (cv.height - m.f) / m.d;
    return { x0: Math.min(xa, xb) - pad, x1: Math.max(xa, xb) + pad, y0: Math.min(ya, yb) - pad, y1: Math.max(ya, yb) + pad };
  }
  /* ---- the floor's language: gold strikes now, violet strikes again, a reticle hunts; all drawn on the platform ---- */
  function say(FX, x, y, s, col, size) { FX.H.text(x, y, s, col, size, { life: 2.2, max: 2.2, vy: -0.5 }); }
  function wedgeP(c, cx, cy, s, r0, r1) { const a0 = (s - 0.5) * SEC_A, a1 = (s + 0.5) * SEC_A; c.moveTo(cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0); c.arc(cx, cy, r1, a0, a1); c.arc(cx, cy, r0, a1, a0, true); c.closePath(); }
  function chev(c, x, y, a, s, st, lw) { const ca = Math.cos(a), sa = Math.sin(a); c.strokeStyle = st; c.lineWidth = lw || Math.max(2, s * 0.32); c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(x - ca * s * 0.5 - sa * s * 0.6, y - sa * s * 0.5 + ca * s * 0.6); c.lineTo(x + ca * s * 0.5, y + sa * s * 0.5); c.lineTo(x - ca * s * 0.5 + sa * s * 0.6, y - sa * s * 0.5 - ca * s * 0.6); c.stroke(); }
  function label(c, s, x, y, size, col, a) { if (!s) return; c.save(); c.globalCompositeOperation = 'source-over'; c.globalAlpha = a == null ? 1 : a; c.font = `900 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(3, size * 0.3); c.strokeStyle = 'rgba(10,6,24,.8)'; c.strokeText(s, x, y); c.fillStyle = col; c.fillText(s, x, y); c.restore(); }
  function strokeGlyph(c, g, X, Y, s, rot, layers) { const cr = Math.cos(rot || 0), sr = Math.sin(rot || 0); c.lineCap = 'round'; c.lineJoin = 'round'; layers.forEach(([lw, st]) => { c.lineWidth = lw; c.strokeStyle = st; g.forEach(seg => { c.beginPath(); seg.forEach(([gx, gy], i) => { const px = X + (cr * gx - sr * gy) * s, py = Y + (sr * gx + cr * gy) * s; i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); }); }); }
  // the outline of a warning's ground, grown from its source (0..1)
  function wPath(c, FX, z, T, grow) {
    const C = FX.C, cx = FX.sx(C.x), cy = FX.sy(C.y);
    c.beginPath();
    if (z.shape === 'circle') { c.arc(FX.sx(z.x), FX.sy(z.y), Math.max(0.5, z.r * T * grow), 0, TAU); return; }
    if (z.shape === 'line' || z.shape === 'beam') {
      const ca = Math.cos(z.a), sa = Math.sin(z.a), L = (z.shape === 'beam' ? (C.R + 1) * 2 : z.len) * T, hw = Math.max(0.5, z.w / 2 * T * grow);
      const x0 = z.shape === 'beam' ? cx - ca * L / 2 : FX.sx(z.x), y0 = z.shape === 'beam' ? cy - sa * L / 2 : FX.sy(z.y);
      c.moveTo(x0 - sa * hw, y0 + ca * hw); c.lineTo(x0 + ca * L - sa * hw, y0 + sa * L + ca * hw); c.lineTo(x0 + ca * L + sa * hw, y0 + sa * L - ca * hw); c.lineTo(x0 + sa * hw, y0 - ca * hw); c.closePath(); return; }
    if (z.shape === 'zone') { const r0 = Math.max(0, z.r0) * T, r1 = Math.min(C.R, z.r1) * T, ro = Math.max(0.5, r0 + (r1 - r0) * grow); c.arc(cx, cy, ro, 0, TAU); if (r0 > 0.5) { c.moveTo(cx + r0, cy); c.arc(cx, cy, r0, 0, TAU, true); } return; }
    if (z.shape === 'sectors') { const r0 = Math.max(0, z.r0 == null ? 0 : z.r0) * T, r1 = Math.min(C.R, z.r1 == null ? C.R : z.r1) * T, ro = Math.max(r0 + 0.5, r0 + (r1 - r0) * grow); z.set.forEach(s => wedgeP(c, cx, cy, s, r0, ro)); if (z.core) { c.moveTo(cx + RCORE * 0.5 * T, cy); c.arc(cx, cy, RCORE * 0.5 * T, 0, TAU); } }
  }
  function wLabelAt(FX, z) {
    const C = FX.C, me = FX.me;
    if (z.shape === 'circle') return [z.x, z.y];
    if (z.shape === 'line') return [z.x + Math.cos(z.a) * z.len * 0.5, z.y + Math.sin(z.a) * z.len * 0.5];
    if (z.shape === 'beam') { const s = Math.cos(z.a) * (me.x - C.x) + Math.sin(z.a) * (me.y - C.y) >= 0 ? 1 : -1; return [C.x + Math.cos(z.a) * 4.6 * s, C.y + Math.sin(z.a) * 4.6 * s]; }
    if (z.shape === 'zone') return [C.x, C.y + (Math.max(0, z.r0) + Math.min(C.R, z.r1)) / 2];
    if (z.shape === 'sectors') { const s = z.set[0], r = (Math.max(RCORE, z.r0 || 0) + Math.min(C.R, z.r1 || C.R)) / 2; return [C.x + Math.cos(s * SEC_A) * r, C.y + Math.sin(s * SEC_A) * r]; }
    return [z.x, z.y];
  }
  function drawWarn(c, z, FX, T, t) {
    if (z.hide && z.age < z.hide) return;
    const C = FX.C, echo = z.style === 'echo', ln = z.style === 'lance', col = z.col || (echo ? ECHO : ln ? '#FFE9A8' : GOLD), t0 = z.hide || 0, left = z.t - z.age, u = clamp((z.age - t0) / Math.max(0.05, z.t - t0), 0, 1);
    const fade = z.cut ? clamp((z.life - z.age) / 0.3, 0, 1) : Math.min(1, (z.age - t0) / 0.18 + 0.25);
    c.save(); c.globalAlpha = fade;
    c.beginPath(); c.arc(FX.sx(C.x), FX.sy(C.y), (C.R + 0.2) * T, 0, TAU); c.clip();
    if (z.fired) {
      // the strike: a flash of its light over the ground it marked
      const f = clamp(1 - (z.age - z.t) / 0.45, 0, 1); if (f > 0 && !z.cut && !ln) { c.globalCompositeOperation = 'lighter'; wPath(c, FX, z, T, 1); c.fillStyle = rgbaH(echo ? '#E8D4FF' : '#FFF4D0', 0.5 * f); c.fill(); }
      c.restore(); return;
    }
    if (ln) { drawReticle(c, FX, z, T, t, col); c.restore(); return; }
    // the ground darkens; gold fills with its light from the source as the moment nears; violet waits, outlined, then fills at the last
    wPath(c, FX, z, T, 1); c.fillStyle = echo ? 'rgba(34,8,60,.24)' : 'rgba(44,26,4,.2)'; c.fill();
    c.globalCompositeOperation = 'lighter';
    if (!echo) { wPath(c, FX, z, T, 0.08 + u * 0.92); c.fillStyle = rgbaH(col, 0.14 + u * 0.3); c.fill(); }
    else if (left < 0.75) { wPath(c, FX, z, T, 1); c.fillStyle = rgbaH(col, 0.08 + (0.75 - left) * 0.42); c.fill(); }
    wPath(c, FX, z, T, 1); c.lineWidth = Math.max(2, T * (echo ? 0.1 : 0.11)); c.strokeStyle = rgbaH(echo ? '#D8BCFF' : '#FFE9A8', 0.5 + 0.35 * u + 0.15 * Math.sin(t * (echo ? 6 : 10 + u * 14)));
    if (echo) { c.setLineDash([T * 0.55, T * 0.34]); c.lineDashOffset = -t * T * 2; }
    c.stroke(); c.setLineDash([]);
    // a violet circle has a second ring closing on it: when the two meet, it strikes
    if (echo && z.shape === 'circle') { const k = clamp(left / Math.max(0.1, z.t), 0, 1), X = FX.sx(z.x), Y = FX.sy(z.y); c.strokeStyle = rgbaH('#E8D4FF', 0.75); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.arc(X, Y, z.r * T * (1 + k * 0.9), 0, TAU); c.stroke(); for (let i = 0; i < 4; i++) { const a = t * 1.5 + i * Math.PI / 2, rr = z.r * T; c.fillStyle = rgbaH('#E8D4FF', 0.9); c.beginPath(); c.moveTo(X + Math.cos(a) * (rr + T * 0.3), Y + Math.sin(a) * (rr + T * 0.3)); c.lineTo(X + Math.cos(a + 0.08) * rr, Y + Math.sin(a + 0.08) * rr); c.lineTo(X + Math.cos(a) * (rr - T * 0.3), Y + Math.sin(a) * (rr - T * 0.3)); c.lineTo(X + Math.cos(a - 0.08) * rr, Y + Math.sin(a - 0.08) * rr); c.closePath(); c.fill(); } }
    // a gold circle under a falling tentacle shows its centre
    if (!echo && z.shape === 'circle') { const X = FX.sx(z.x), Y = FX.sy(z.y); c.strokeStyle = rgbaH('#FFF4D0', 0.5 + 0.4 * u); c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(X, Y, z.r * T * 0.32, 0, TAU); c.stroke(); }
    // its name, and for an echo the seconds until it strikes again
    const lp = wLabelAt(FX, z), lx = FX.sx(lp[0]), ly = FX.sy(lp[1]), txt = echo ? `${z.label ? z.label + ' ' : ''}${Math.max(1, Math.ceil(left))}` : z.label;
    label(c, txt, lx, ly, Math.max(11, T * 0.62), echo ? '#EBDDFF' : '#FFF6D8', 0.95);
    c.restore();
  }
  // the golden lance's mark: a reticle that hunts the pet, then locks, fills, and the lance comes down
  function drawReticle(c, FX, z, T, t, col) {
    const X = FX.sx(z.x), Y = FX.sy(z.y), r = z.r * T, lock = !!z.locked, left = z.t - z.age, tr = z.trackT || 1.5, k = lock ? clamp((z.age - tr) / Math.max(0.1, z.t - tr), 0, 1) : 0;
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rgbaH(col, lock ? 0.1 + 0.28 * k : 0.06); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
    if (lock) { c.fillStyle = rgbaH('#FFFFFF', 0.12 + 0.3 * k); c.beginPath(); c.arc(X, Y, r * Math.max(0.05, k), 0, TAU); c.fill(); }
    c.strokeStyle = rgbaH(col, lock ? 0.95 : 0.7); c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke();
    const sp = lock ? Math.PI / 4 : t * 3.2; c.lineCap = 'round';
    for (let i = 0; i < 4; i++) { const a = sp + i * Math.PI / 2; c.beginPath(); c.moveTo(X + Math.cos(a) * r * 0.55, Y + Math.sin(a) * r * 0.55); c.lineTo(X + Math.cos(a) * r * (lock ? 1.15 : 1.35), Y + Math.sin(a) * r * (lock ? 1.15 : 1.35)); c.stroke(); }
    if (!lock) label(c, 'LANCE', X, Y - r - T * 0.55, Math.max(10, T * 0.5), '#FFF6D8', 0.85);
    // the lance itself, falling from the sky in its last moment
    if (lock && left < 0.4) { const e = 1 - left / 0.4, h = (1 - e * e) * T * 13, tipY = Y - h, L = T * 4.2, w = T * 0.32;
      c.globalAlpha *= 0.5 + 0.5 * e; blitSized(c, glowSprite('#FFE9A8'), X - T * 1.4, tipY - L * 0.6 - T * 1.4, T * 2.8, L * 0.6 + T * 2.8);
      softRay(c, X, tipY - L, X, tipY - w * 0.6, w * 2.8, '#FFE9A8', 0.95); softRay(c, X, tipY - L * 0.9, X, tipY - w * 0.3, w * 1.2, '#FFFFFF', 1); }
  }
  /* the Fourfold Seal's four rune marks: each turns, and a ring of gold counts down to the tentacle that will strike it */
  function drawSeals(c, z, FX, T, t) {
    z.seals.forEach(s => {
      const X = FX.sx(s.x), Y = FX.sy(s.y), r = 1.6 * T, g = GLYPHS[(s.i * 2 + 1) % 8];
      c.save();
      if (s.broken) { c.globalAlpha = 0.55; c.strokeStyle = 'rgba(122,84,24,.8)'; c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(40,24,8,.75)'; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + s.i; c.beginPath(); c.moveTo(X + Math.cos(a) * r * 0.15, Y + Math.sin(a) * r * 0.15); c.lineTo(X + Math.cos(a + 0.25) * r * 0.55, Y + Math.sin(a + 0.25) * r * 0.55); c.lineTo(X + Math.cos(a - 0.1) * r * 0.95, Y + Math.sin(a - 0.1) * r * 0.95); c.stroke(); } c.restore(); return; }
      c.fillStyle = 'rgba(30,20,4,.28)'; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
      c.globalCompositeOperation = 'lighter';
      c.globalAlpha = 0.45 + 0.2 * Math.sin(t * 3 + s.i); blitSized(c, glowSprite('#5FFFE8'), X - r * 1.5, Y - r * 1.5, r * 3, r * 3); c.globalAlpha = 1;
      c.strokeStyle = rgbaH(GOLD, 0.95); c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(X, Y, r, 0, TAU); c.stroke();
      c.strokeStyle = rgbaH('#5FFFE8', 0.75); c.lineWidth = Math.max(1.5, T * 0.06); c.beginPath(); c.arc(X, Y, r * 0.8, 0, TAU); c.stroke();
      strokeGlyph(c, g, X, Y, r * 0.48, t * 0.6 + s.i, [[Math.max(3, T * 0.2), rgbaH('#5FFFE8', 0.55)], [Math.max(1.5, T * 0.08), '#FFFFFF']]);
      const k = clamp(s.tm / s.tm0, 0, 1); c.strokeStyle = rgbaH('#FFE9A8', 0.95); c.lineWidth = Math.max(2.5, T * 0.13); c.lineCap = 'round'; c.beginPath(); c.arc(X, Y, r * 1.2, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke();
      c.restore();
      label(c, 'SEAL', X, Y + r + T * 0.7, Math.max(10, T * 0.5), '#BFFFF4', 0.8);
    });
  }
  /* the Turning Sanctuary: six sectors burn in the dark, two stay safe, and the next one lights before it turns */
  function drawSanct(c, z, FX, T, t) {
    const S = z.S, C = FX.C, cx = FX.sx(C.x), cy = FX.sy(C.y), R = C.R * T, r0 = RCORE * 0.6 * T, dk = S.dark; if (dk <= 0.01) return;
    const safe = s => S.safe.includes(s) || s === S.next;
    c.save();
    c.beginPath(); for (let s = 0; s < NSEC; s++) if (!safe(s)) wedgeP(c, cx, cy, s, r0, R); c.moveTo(cx + r0, cy); c.arc(cx, cy, r0, 0, TAU);
    c.fillStyle = `rgba(0,0,12,${0.64 * dk})`; c.fill();
    c.globalCompositeOperation = 'lighter'; c.fillStyle = rgbaH('#3F6FFF', 0.12 * dk * (0.6 + 0.4 * Math.sin(t * 5))); c.fill();
    // embers rising off the burning ground
    for (let s = 0; s < NSEC; s++) { if (safe(s)) continue; for (let j = 0; j < 6; j++) { const ph = (t * 0.55 + j * 0.19 + s * 0.17) % 1, a = (s - 0.42 + 0.84 * ((j * 0.37 + s * 0.61) % 1)) * SEC_A, d = (RCORE + (C.R - RCORE - 0.5) * ((j * 0.53 + s * 0.29) % 1)) * T; TN.twinkle(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d - ph * T * 1.3, Math.max(1.5, T * 0.2), '#8FB4FF', dk * (1 - ph) * 0.85); } }
    // the safe pair, edged in light
    c.beginPath(); S.safe.forEach(s => wedgeP(c, cx, cy, s, r0, R)); c.fillStyle = rgbaH('#FFF2D0', 0.22 * dk); c.fill(); c.strokeStyle = rgbaH('#FFFFFF', 0.92 * dk); c.lineWidth = Math.max(2.5, T * 0.13); c.stroke();
    if (S.next >= 0) { c.beginPath(); wedgeP(c, cx, cy, S.next, r0, R); c.fillStyle = rgbaH('#9FD0FF', (0.12 + 0.1 * Math.sin(t * 14)) * dk); c.fill(); c.strokeStyle = rgbaH('#BFE0FF', 0.9 * dk); c.lineWidth = Math.max(2, T * 0.1); c.setLineDash([T * 0.45, T * 0.3]); c.lineDashOffset = -t * T * 3; c.stroke(); c.setLineDash([]); }
    // arrows round the lane, the way the safe ground turns
    const lead = S.safe[1], da = S.dir * SEC_A;
    for (let j = 0; j < 3; j++) { const a = (lead + S.dir * 0.15) * SEC_A + da * j * 0.3, d = (RIN + C.R) / 2 * T; chev(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, a + S.dir * Math.PI / 2, T * 0.55, rgbaH('#E6F0FF', dk * (0.85 - j * 0.22))); }
    c.restore();
    if (S.t < 0) label(c, 'STAND IN THE LIGHT', FX.sx(C.x + Math.cos(S.safe[0] * SEC_A + S.dir * SEC_A / 2) * 9.5), FX.sy(C.y + Math.sin(S.safe[0] * SEC_A + S.dir * SEC_A / 2) * 9.5), Math.max(11, T * 0.55), '#FFFFFF', dk);
  }
  /* the Celestial Scythe: the outer lane marked, the inner circle's edge the limit of its reach, then two blades sweep round */
  function drawScythe(c, z, FX, T, t) {
    const C = FX.C, cx = FX.sx(C.x), cy = FX.sy(C.y), R = C.R * T, ri = RIN * T, wk = clamp(z.age / z.warnT, 0, 1), on = z.age >= z.warnT, u = clamp((z.age - z.warnT) / z.dur, 0, 1), fade = Math.min(1, (z.life - z.age) / 0.3);
    c.save(); c.globalAlpha = fade;
    c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.moveTo(cx + ri, cy); c.arc(cx, cy, ri, 0, TAU, true); c.fillStyle = `rgba(6,10,40,${0.35 * (on ? 1 - u * 0.6 : wk)})`; c.fill();
    c.globalCompositeOperation = 'lighter'; c.fillStyle = rgbaH('#4F7FFF', (0.08 + 0.07 * Math.sin(t * 9)) * (on ? 1 - u : wk)); c.fill();
    c.strokeStyle = rgbaH('#BFE0FF', 0.85); c.lineWidth = Math.max(2.5, T * 0.14); c.setLineDash([T * 0.6, T * 0.32]); c.lineDashOffset = t * T * 2 * z.dir; c.beginPath(); c.arc(cx, cy, ri, 0, TAU); c.stroke(); c.setLineDash([]);
    [0, 1].forEach(b => {
      const ang = z.ang + b * Math.PI, ca = Math.cos(ang), sa = Math.sin(ang);
      if (!on) { c.strokeStyle = rgbaH('#9FC8FF', 0.35 + 0.55 * wk); c.lineWidth = Math.max(2, T * 0.12); c.beginPath(); c.moveTo(cx + ca * ri, cy + sa * ri); c.lineTo(cx + ca * R, cy + sa * R); c.stroke();
        for (let j = 1; j <= 3; j++) { const a = ang + z.dir * j * 0.2, d = (RIN + C.R) / 2 * T; chev(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, a + z.dir * Math.PI / 2, T * 0.6, rgbaH('#DCEBFF', (0.3 + 0.6 * wk) * (1 - j * 0.22))); } }
      else if (u < 1) {
        [[0.95, 0.2], [0.3, 0.32]].forEach(([tr, al]) => { c.beginPath(); c.moveTo(cx + ca * ri, cy + sa * ri); c.arc(cx, cy, ri, ang, ang - z.dir * tr, z.dir > 0); c.arc(cx, cy, R, ang - z.dir * tr, ang, z.dir < 0); c.closePath(); c.fillStyle = rgbaH('#9FC8FF', al); c.fill(); });
        [[T * 1.3, rgbaH('#4F7FFF', 0.35)], [T * 0.55, rgbaH('#DCEBFF', 0.85)], [T * 0.18, '#FFFFFF']].forEach(([w, st]) => { c.strokeStyle = st; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(cx + ca * ri, cy + sa * ri); c.lineTo(cx + ca * R, cy + sa * R); c.stroke(); });
        for (let j = 0; j < 4; j++) { const d = ri + (R - ri) * (j + 0.5) / 4; TN.twinkle(c, cx + ca * d, cy + sa * d, T * 0.3, '#FFFFFF', 0.8); } }
    });
    c.restore();
    if (!on) label(c, 'STAY INSIDE THE CIRCLE', cx, cy + (RIN - 1.1) * T, Math.max(11, T * 0.55), '#DCEBFF', wk);
  }
  /* the Breath of Creation: an expanding wave of white light with one break in it, and the path to that break */
  function drawWave(c, z, FX, T, t) {
    const C = FX.C, cx = FX.sx(C.x), cy = FX.sy(C.y), r = z.r * T, f = Math.min(1, (z.life - z.age) / 0.5, z.age / 0.15), a0 = z.gap + z.gw, a1 = z.gap - z.gw + TAU;
    c.save(); c.beginPath(); c.arc(cx, cy, (C.R + 0.8) * T, 0, TAU); c.clip();
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    [[T * 1.4, rgbaH('#5FFFE8', 0.16 * f)], [T * 0.62, rgbaH(z.col, 0.55 * f)], [T * 0.2, rgbaH('#FFFFFF', 0.95 * f)]].forEach(([lw, st]) => { c.lineWidth = lw; c.strokeStyle = st; c.beginPath(); c.arc(cx, cy, r, a0, a1); c.stroke(); });
    [a0, a1].forEach(a => { c.globalAlpha = f; blitSized(c, glowSprite('#5FFFE8'), cx + Math.cos(a) * r - T * 1.2, cy + Math.sin(a) * r - T * 1.2, T * 2.4, T * 2.4); });
    c.restore();
  }
  function drawGapMark(c, z, FX, T, t) {
    const C = FX.C, cx = FX.sx(C.x), cy = FX.sy(C.y), a = z.a, w = 0.42, f = Math.min(1, z.age / 0.4, (z.life - z.age) / 0.5);
    c.save(); c.globalCompositeOperation = 'lighter';
    c.beginPath(); c.moveTo(cx + Math.cos(a - w) * RCORE * T, cy + Math.sin(a - w) * RCORE * T); c.arc(cx, cy, C.R * T, a - w, a + w); c.arc(cx, cy, RCORE * T, a + w, a - w, true); c.closePath();
    c.fillStyle = rgbaH('#5FFFE8', 0.12 * f); c.fill(); c.strokeStyle = rgbaH('#8FFFF0', 0.6 * f); c.lineWidth = Math.max(1.5, T * 0.08); c.stroke();
    for (let j = 0; j < 5; j++) { const ph = (t * 0.7 + j / 5) % 1, d = (RCORE + 1 + ph * (C.R - RCORE - 2)) * T; chev(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d, a, T * 0.6, rgbaH('#CFFFF8', f * Math.sin(ph * Math.PI))); }
    c.restore();
    label(c, 'THE GAP', cx + Math.cos(a) * (C.R - 2.2) * T, cy + Math.sin(a) * (C.R - 2.2) * T, Math.max(11, T * 0.55), '#CFFFF8', f);
  }
  /* Borrowed Tomorrow: the sectors that will strike, shown in order, first gold, then violet */
  function drawPreview(c, z, FX, T, t) {
    const C = FX.C, cx = FX.sx(C.x), cy = FX.sy(C.y), f = Math.min(1, z.age / 0.2, (z.life - z.age) / 0.3), echo = z.col === ECHO;
    c.save(); c.globalAlpha = f;
    c.beginPath(); z.set.forEach(s => wedgeP(c, cx, cy, s, RCORE * 0.5 * T, C.R * T)); c.fillStyle = rgbaH(z.col, 0.22); c.fill(); c.lineWidth = Math.max(2, T * 0.11); c.strokeStyle = rgbaH(echo ? '#D8BCFF' : '#FFE9A8', 0.95); if (echo) c.setLineDash([T * 0.55, T * 0.34]); c.stroke(); c.setLineDash([]);
    c.restore();
    z.set.forEach(s => { const a = s * SEC_A, d = (RIN + 1.6) * T; label(c, echo ? 'SECOND' : 'FIRST', cx + Math.cos(a) * d, cy + Math.sin(a) * d, Math.max(11, T * 0.6), echo ? '#EBDDFF' : '#FFF6D8', f); });
  }
  // the Cage of Light's gap: arrows running out through it
  function drawCageGap(c, z, FX, T, t) {
    const X = FX.sx(z.x), Y = FX.sy(z.y), f = Math.min(1, z.age / 0.25, (z.life - z.age) / 0.3);
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let j = 0; j < 3; j++) { const ph = (t * 1.6 + j / 3) % 1, d = (ph - 0.5) * T * 2.4; chev(c, X + Math.cos(z.a) * d, Y + Math.sin(z.a) * d, z.a, T * 0.55, rgbaH('#CFFFF8', f * Math.sin(ph * Math.PI))); }
    c.restore();
    label(c, 'OUT', X + Math.cos(z.a) * T * 2.1, Y + Math.sin(z.a) * T * 2.1, Math.max(11, T * 0.55), '#CFFFF8', f);
  }
  // a pool of golden light where a sanctuary lance fell: it burns while it lasts
  function drawPool(c, z, FX, T, t) {
    const X = FX.sx(z.x), Y = FX.sy(z.y), r = z.r * T, f = Math.max(0, Math.min(1, z.age / 0.3, (z.life - z.age) / 0.8));
    c.save(); c.globalAlpha = f;
    const g = c.createRadialGradient(X, Y, r * 0.1, X, Y, r); g.addColorStop(0, 'rgba(255,240,190,.5)'); g.addColorStop(0.7, 'rgba(255,196,90,.3)'); g.addColorStop(1, 'rgba(255,196,90,0)'); c.fillStyle = g; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgbaH('#FFE9A8', 0.55 + 0.2 * Math.sin(t * 6 + z.x)); c.lineWidth = Math.max(1.5, T * 0.07); c.beginPath(); c.arc(X, Y, r * 0.92, 0, TAU); c.stroke();
    for (let i = 0; i < 4; i++) { const a = t * 0.9 + i * 1.57 + z.y, d = r * (0.25 + 0.17 * i); TN.twinkle(c, X + Math.cos(a) * d, Y + Math.sin(a) * d, Math.max(1.5, T * 0.16), '#FFFFFF', 0.7); }
    c.restore();
  }
  /* the ghost arena of the Ring of Memory: a violet copy of the platform hanging above it, turning backwards; when the
     record is spent it falls to pieces */
  function drawGhost(c, FX, M, T, t) {
    const C = FX.C, gh = M.ghost || 0, fall = M.ghostFall || 0; if (gh < 0.01 && !(fall > 0 && fall < 2)) return;
    const Zg = 6.5, Rg = C.R * 0.78, k = Rg / C.R, cx = FX.sx(C.x), cy = FX.sy(C.y) - Zg * T, rr = [RCORE * k * T, RIN * k * T, Rg * T];
    // in the fight the ghost is a kept picture, painted once (every other frame while it falls apart), faded as a whole
    // and laid over the platform as light
    const ft = FX.K.fightT ? FX.K.fightT(FX, t) : null, al = fall <= 0 ? gh * 0.8 : (1 - fall / 2) * 0.6;
    if (ft == null) { ghostPaint(c, FX, M, T, t, cx, cy, rr, fall, al); return; }
    const R2 = rr[2] * 1.12 + T * 0.4;
    FX.K.layer(c, 'bh-ghost', { t, box: [cx - R2, cy - R2, cx + R2, cy + R2 + (fall > 0 ? T * 16 : 0)], ax: cx, ay: cy, every: fall > 0 ? 2 : 1e6, slot: 1, sig: `${Math.round(T * 8)}|${fall > 0 ? 1 : 0}`, alpha: al, op: 'lighter' }, g => ghostPaint(g, FX, M, T, t, cx, cy, rr, fall, 1));
  }
  function ghostPaint(c, FX, M, T, t, cx, cy, rr, fall, al) {
    const rot = 0.2;
    c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
    const frag = (s, b, ox, oy, sp) => { const a0 = (s - 0.5) * SEC_A + rot, a1 = (s + 0.5) * SEC_A + rot, r0 = rr[b], r1 = rr[b + 1], am = s * SEC_A + rot, fx = Math.cos(am) * (r0 + r1) / 2, fy = Math.sin(am) * (r0 + r1) / 2;
      c.save(); c.translate(cx + fx + ox, cy + fy + oy); c.rotate(sp); c.translate(-fx, -fy);
      c.beginPath(); c.moveTo(Math.cos(a0) * r0, Math.sin(a0) * r0); c.arc(0, 0, r1, a0, a1); c.arc(0, 0, r0, a1, a0, true); c.closePath(); c.fillStyle = 'rgba(185,140,255,.13)'; c.fill(); c.strokeStyle = 'rgba(228,208,255,.9)'; c.lineWidth = Math.max(1.4, T * 0.09); c.stroke();
      if (b === 1) strokeGlyph(c, GLYPHS[s], Math.cos(am) * (r0 + r1) / 2, Math.sin(am) * (r0 + r1) / 2, T * 0.62, am + Math.PI / 2, [[Math.max(1.2, T * 0.07), 'rgba(232,212,255,.75)']]);
      c.restore(); };
    if (fall <= 0) {
      c.globalAlpha = al; c.globalCompositeOperation = 'lighter';
      blitSized(c, glowSprite('#B98CFF'), cx - rr[2] * 1.1, cy - rr[2] * 1.1, rr[2] * 2.2, rr[2] * 2.2);
      for (let s = 0; s < NSEC; s++) for (let b = 0; b < 2; b++) frag(s, b, 0, 0, 0);
      c.strokeStyle = 'rgba(232,212,255,.8)'; c.lineWidth = Math.max(1.5, T * 0.1); c.beginPath(); c.arc(cx, cy, rr[2] + T * 0.25, 0, TAU); c.stroke();
    } else {
      const u = fall / 2; c.globalAlpha = al; c.globalCompositeOperation = 'lighter';
      for (let s = 0; s < NSEC; s++) for (let b = 0; b < 2; b++) { const am = s * SEC_A + rot, sd = (s * 7 + b * 3) % 5; frag(s, b, Math.cos(am) * u * T * (1.5 + sd), Math.sin(am) * u * T * (1 + sd * 0.5) + u * u * T * (10 + sd * 2), u * (sd - 2) * 0.35); }
    }
    c.restore();
  }
  /* a rune of the outer ring brought within reach in Final Judgment: it hangs over its mark, a pillar of light above it */
  function drawRuneTarget(c, FX, o, X, Y, T, t) {
    const r = o.r * T, hov = T * (1.5 + 0.15 * Math.sin(t * 2 + o.ri)), g = GLYPHS[o.ri % 8], hp = clamp(o.hp / o.maxhp, 0, 1);
    c.save();
    c.fillStyle = 'rgba(40,30,0,.3)'; c.beginPath(); c.ellipse(X, Y, r * 1.1, r * 0.75, 0, 0, TAU); c.fill();
    c.strokeStyle = rgbaH('#FFF1C0', 0.75); c.lineWidth = Math.max(1.5, T * 0.08); c.beginPath(); c.ellipse(X, Y, r * 1.1, r * 0.75, 0, 0, TAU); c.stroke();
    c.globalCompositeOperation = 'lighter';
    { const a0 = c.globalAlpha; c.globalAlpha = a0 * 0.4; blitSized(c, columnSprite('#FFF1C0'), X - r * 0.5, Y - T * 15, r, T * 15); c.globalAlpha = a0; }   // (a column of light, soft at its sides)
    c.globalAlpha = 0.85; blitSized(c, glowSprite('#FFF1C0'), X - r * 2, Y - hov - r * 2, r * 4, r * 4); c.globalAlpha = 1;
    strokeGlyph(c, g, X, Y - hov, r * 0.78, 0, [[Math.max(4, T * 0.32), rgbaH('#FFE9A8', 0.6)], [Math.max(2, T * 0.13), '#FFFFFF']]);
    c.restore();
    if (hp < 1) { c.save(); c.strokeStyle = 'rgba(60,30,0,.85)'; c.lineWidth = Math.max(1.2, T * 0.06); const n = Math.ceil((1 - hp) * 7); for (let i = 0; i < n; i++) { const a = i * 2.4 + o.ri; c.beginPath(); c.moveTo(X, Y - hov); c.lineTo(X + Math.cos(a) * r * 0.5, Y - hov + Math.sin(a) * r * 0.5); c.lineTo(X + Math.cos(a + 0.4) * r * 0.85, Y - hov + Math.sin(a + 0.4) * r * 0.85); c.stroke(); } c.restore(); }
  }
  /* ---- over everything: the beams, the falling lances and stars, Oblivion's cast, the white, and the end ---- */
  function drawFxAll(c, FX, T, t) {
    const M = FX.mem, m = FX.m; if (!M || !M.rings || !m) return;
    const C = FX.C, cx = FX.sx(C.x), cy = FX.sy(C.y), W = FX.H.W(), Hh = FX.H.H();
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    // (each beam a soft ray right across the arena, its ends fading out at the rim: no cut edge anywhere)
    M.beams.forEach(b => { const u = b.t / b.life, f = 1 - u, L = C.R * T, ca = Math.cos(b.a), sa = Math.sin(b.a), x0 = cx - ca * L, y0 = cy - sa * L, x1 = cx + ca * L, y1 = cy + sa * L;
      c.save();
      softRay(c, x0, y0, x1, y1, b.w * T * (1.25 + u * 0.6) * 1.8, '#5FFFE8', 0.45 * f); softRay(c, x0, y0, x1, y1, b.w * T * 1.3, b.col, 0.9 * f, 0.32);
      for (let i = 0; i < 14; i++) { const d = (i / 13 - 0.5) * 2 * L, wob = Math.sin(i * 2.3 + t * 9) * b.w * T * 0.35; TN.twinkle(c, cx + ca * d - sa * wob, cy + sa * d + ca * wob - u * T * 2.4, Math.max(1.5, T * 0.28 * f), '#FFFFFF', f); }
      c.restore();
      // the light comes down from the ring standing over the centre
      const top = FX.sy(m.y) - hcOf(M) * T * bigOf(M); softRay(c, cx, top, cx, cy, T * 1.7 * f, '#FFF4D0', 0.55 * f); });
    M.lances.forEach(L => { const u = L.t / L.life, f = 1 - u, X = FX.sx(L.x), Y = FX.sy(L.y);
      softRay(c, X, Y - T * 13, X, Y, (T * 0.5 * f + 1) * 2.2, '#FFE9A8', 0.7 * f); softRay(c, X, Y - T * 10, X, Y, (T * 0.16 * f + 0.5) * 2.6, '#FFFFFF', 0.9 * f);
      c.globalAlpha = f; blitSized(c, glowSprite('#FFE9A8'), X - T * 2, Y - T * 2, T * 4, T * 4); c.globalAlpha = 1; });
    M.falls.forEach(F => { const u = clamp(F.t / F.life, 0, 1), e = u * u, X = FX.sx(F.x) + (1 - e) * T * 4, Y = FX.sy(F.y) - (1 - e) * T * 16, s = T * (0.55 + 0.5 * u);
      softRay(c, X + T * 1.6, Y - T * 6.4, X, Y, s * 1.6, '#CFE0FF', 0.5);
      c.globalAlpha = 0.9; blitSized(c, glowSprite('#CFE0FF'), X - s * 2.2, Y - s * 2.2, s * 4.4, s * 4.4); c.globalAlpha = 1; TN.twinkle(c, X, Y, s * 1.3, '#FFFFFF', 1); });
    c.restore();
    if (M.end) drawEnding(c, FX, M, m, T, t);
    if (M.obl && !M.end) drawCastBar(c, FX, M, W, Hh, t);
    if (M.white > 0.002) { c.save(); c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(255,255,255,${Math.min(1, M.white)})`; c.fillRect(-60, -60, W + 120, Hh + 120); c.restore(); }
  }
  // Oblivion's cast across the top of the screen: the bar, its seconds, and the eight runes beneath it
  function drawCastBar(c, FX, M, W, Hh, t) {
    const O = M.obl, corr = O.corr, again = O.again != null, bw = Math.min(260, W * 0.6), x0 = (W - bw) / 2, y = 10 + Math.min(88, W * 0.24) + 14 + 40;
    const k = corr ? clamp(O.win / 10, 0, 1) : again ? clamp(1 - O.again / 6, 0, 1) : clamp(1 - O.cast / O.total, 0, 1);
    const title = corr ? 'THE GOLDEN CORRIDOR · STRIKE THE JEWEL' : again ? 'THE CORRIDOR WILL OPEN AGAIN' : `OBLIVION · ${Math.max(0, Math.ceil(O.cast))}s`;
    c.save(); c.font = `900 11px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    c.lineWidth = 3.5; c.strokeStyle = 'rgba(0,0,0,.75)'; c.strokeText(title, W / 2, y - 11); c.fillStyle = corr ? '#FFE9A8' : '#FFF8E0'; c.fillText(title, W / 2, y - 11);
    c.fillStyle = 'rgba(0,0,0,.6)'; GFX.rr(c, x0 - 2, y - 2, bw + 4, 10, 5); c.fill();
    const gr = c.createLinearGradient(x0, 0, x0 + bw, 0); gr.addColorStop(0, corr ? '#FFE9A8' : '#B98CFF'); gr.addColorStop(1, corr ? '#FFFFFF' : '#FFF3C8'); c.fillStyle = gr; GFX.rr(c, x0, y, Math.max(6, bw * k), 6, 3); c.fill();
    if (!corr && !again && O.cast < 12) { c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 10); c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; GFX.rr(c, x0 - 2, y - 2, bw + 4, 10, 5); c.stroke(); c.globalAlpha = 1; }
    if (!corr) for (let i = 0; i < 8; i++) { const px = W / 2 + (i - 3.5) * 15, py = y + 19, on = M.rings[3].blaze[i]; c.fillStyle = on ? '#FFF1C0' : 'rgba(255,255,255,.16)'; c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, py - 5); c.lineTo(px + 4, py); c.lineTo(px, py + 5); c.lineTo(px - 4, py); c.closePath(); c.stroke(); c.fill(); }
    c.restore();
  }
  /* the end: the rings break into gold, the wings shed their feathers, the last tentacle unravels, the fish comes down to rest and looks up at you */
  function drawEnding(c, FX, M, m, T, t) {
    const E = M.end, X = FX.sx(m.x), Y = FX.sy(m.y), cam = mkCam(FX, m, M, X, Y, T), q = FX.K.qq();
    TN.groundShadow(c, X, Y + T * 0.1, cam.T * 2.2, cam.T * 1.1, hcOf(M), 0.32);
    if (E.t < 4.2) drawWings(c, cam, M, 4, q, E.t + 0.01);
    if (E.t < 3.2) for (let k = 3; k >= 0; k--) drawShards(c, cam, M, k, E.t, q);
    drawTents(c, cam, M, 4, 'main', q);
    drawFish(c, FX, cam, M, 4, q);
    // the jewel's light, fading to a soft glow as dawn comes
    const jp = cam.L(add3(cam.C3, jewelLocal(M), 1)); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4 * (1 - sstep(2, 6, E.t)); blitSized(c, glowSprite('#FFF4D0'), jp[0] - T * 2.2, jp[1] - T * 2.2, T * 4.4, T * 4.4); c.restore();
  }
  // a ring breaking: its band splits into pieces that crack with light, drift outward and fall, turning to gold
  function drawShards(c, cam, M, k, et, q) {
    const G = ringGeo(M, k, cam.C3), { n, e1, e2, R, w, th, D } = G, T = cam.T, N = D.runes * 3, fo = (dot3(n, VW) >= 0 ? 1 : -1) * th / 2, Ro = R + w / 2, Ri = R - w / 2;
    const pieces = [];
    for (let j = 0; j < N; j++) { const a0 = j / N * TAU, a1 = (j + 1) / N * TAU, am = (a0 + a1) / 2, st = 0.12 * (3 - k) + ((j * 37 + k * 11) % 13) / 13 * 0.7, s = Math.max(0, et - st);
      const rd = [e1[0] * Math.cos(am) + e2[0] * Math.sin(am), e1[1] * Math.cos(am) + e2[1] * Math.sin(am), e1[2] * Math.cos(am) + e2[2] * Math.sin(am)], off = [rd[0] * (s * 1.4 + s * s * 0.9), rd[1] * (s * 1.4 + s * s * 0.9), rd[2] * (s * 1.4 + s * s * 0.9) - s * s * 2.4];
      pieces.push({ a0, a1, s, off, d: cam.dep(add3(ringPt(G, am, R, 0), off, 1)) }); }
    pieces.sort((p1, p2) => p1.d - p2.d).forEach(p => {
      const al = 1 - clamp(p.s / 1.5, 0, 1); if (al <= 0.01) return;
      // a piece shrinks toward its middle as it burns down to a mote
      const kS = 1 - clamp(p.s / 1.3, 0, 0.85), am = (p.a0 + p.a1) / 2, hw = (p.a1 - p.a0) / 2 * 0.88 * kS, P = (a, r) => cam.L(add3(ringPt(G, a, lerp(R, r, kS), fo), p.off, 1)), A = P(am - hw, Ro), B = P(am + hw, Ro), Cc = P(am + hw, Ri), Dd = P(am - hw, Ri), mid = P(am, R);
      c.save(); c.globalAlpha = al;
      c.fillStyle = mixH(D.metal[0], '#FFF4C8', Math.min(1, p.s * 1.4)); c.strokeStyle = p.s > 0 ? rgbaH('#B8862E', 0.8) : INK; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(Cc[0], Cc[1]); c.lineTo(Dd[0], Dd[1]); c.closePath(); c.fill(); c.stroke();
      if (p.s > 0 || et > 0.05) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = al * (p.s > 0 ? 0.95 : 0.35 + 0.3 * Math.sin(t0(M) * 20 + p.a0 * 5)); const r = T * (0.55 + p.s * 0.7); blitSized(c, glowSprite('#FFE9A8'), mid[0] - r, mid[1] - r, r * 2, r * 2); if (p.s > 0.2) TN.twinkle(c, mid[0], mid[1], T * 0.35 * al, '#FFFFFF', al); }
      c.restore();
    });
  }
  function t0(M) { return M.bt || 0; }
  /* ---- Ophiuchus: at peace, Bahamut answers a pet's call as the thirteenth Anima. The same gyroscope, fish and wings,
     built as an art pose with no fight behind it, stepped here and drawn as small as an Anima needs.
     make(o) a new state; step(M, dt) moves it on (M.charge 0..1 winds the rings up and holds the fish still to cast;
     M.align 0..1 turns the rings into the golden corridor along M.alignAx); draw(c, M, X, Y, T, o) paints it with the
     gyroscope's centre at (X, Y) and T pixels to a unit ---- */
  function miniMake(o) {
    o = o || {};
    // the Anima's three forms: one ring, two, then all four; its wings and tentacles grow with it
    const F = [null, { rN: 1, tN: 2, wS: 0.42 * 1.35, tL: 0.28 }, { rN: 2, tN: 4, wS: 0.55 * 1.35, tL: 0.34 }, { rN: 4, tN: 8, wS: 0.62 * 1.35, tL: 0.4, w8: true }][clamp(o.k || 3, 1, 3)];
    const M = { art: 1, mini: 1, lv: o.lv || 1, rN: F.rN, tN: F.tN, wS: F.wS, tL: F.tL, wings8: !!F.w8, wR: RINGS[F.rN - 1].R + RINGS[F.rN - 1].w / 2 + 0.25, bt: 1.3 + Math.random() * 3, intro: 9, eyes: 1, stars: 0, dawn: 0, white: 0, curl: 0, castK: 0, look: [0, 1], ghost: 0, ghostFall: 0, ghostDone: true,
      beams: [], lances: [], falls: [], obl: null, corr: 0, freeze: 0, rest: 0, cyc: 0, expose: 0, charge: 0, align: 0, noShadow: true };
    M.rings = RINGS.map((R, i) => ({ i, awake: 1, wake: 1, spin: i * 0.7, tumble: i * 1.3, dir: 1, aim: null, aimK: 0, quarters: [1, 1, 1, 1], stall: 0, heat: 0, pulse: 0, pulseDir: 1, stored: 0, lit: -1, blaze: [1, 1, 1, 1, 1, 1, 1, 1], draw: 0, sc: 1 }));
    M.tents = []; for (let i = 0; i < 8; i++) M.tents.push({ i, a: i * SEC_A + 0.2, role: 'rest', t: 0, P: null, lit: 0, alpha: 1, gone: 0, frz: null });
    return M;
  }
  // a pose that is only a function of time, for pictures with no state of their own
  function miniPose(M, t, o) {
    o = o || {}; M.bt = t; const ch = clamp(o.charge || 0, 0, 1); M.castK = ch; M.charge = ch;
    M.corr = clamp(o.align || 0, 0, 1); if (M.corr > 0) M.corrAx = o.alignAx || [0, 1, 0.25];
    M.rings.forEach((S, k) => { const D = RINGS[k]; S.spin = k * 0.7 + t * D.spinV; S.tumble = k * 1.3 + t * D.tumbleV; S.pulse = 0; });
    const sk = fishSwim(M), tr = sstep(TRICK - 1.0, TRICK - 0.1, t % TRICK), roll = Math.floor(t / TRICK) % 2 === 1;
    M.swimA = t * 1.25; M.tailPh = t * 6.8; M.fyaw = sk > 0.5 ? -M.swimA + (roll ? 0 : TAU * tr) : 0.14; M.froll = sk > 0.5 && roll ? TAU * tr : 0;
  }
  function miniStep(M, dt) {
    M.bt += dt; const ch = clamp(M.charge || 0, 0, 1);
    M.castK = Math.max(ch, (M.castK || 0) - dt * 0.8);
    // the corridor: every ring turns to face along one axis, as the fight's Final Judgment does
    M.corr = clamp(M.align || 0, 0, 1); if (M.corr > 0) M.corrAx = M.alignAx || [0, 1, 0.25];
    M.rings.forEach((S, k) => { const D = RINGS[k]; S.spin += dt * D.spinV * S.dir * (1 + ch * 2.5); if (M.corr < 0.5) S.tumble += dt * D.tumbleV * S.dir * (1 + ch * 1.5); S.pulse = Math.max(0, S.pulse - dt * 0.45); if (ch > 0.6 && S.pulse < 0.05) { S.pulse = 0.9; S.pulseDir = -1; } });
    // the fish swims its circles and does its tricks; casting, it holds still and faces you
    const sk = fishSwim(M); M.swimA = (M.swimA || 0) + dt * 1.25 * sk; M.tailPh = (M.tailPh || 0) + dt * (3.2 + 3.6 * sk);
    const tr = sstep(TRICK - 1.0, TRICK - 0.1, M.bt % TRICK), roll = Math.floor(M.bt / TRICK) % 2 === 1, flip = roll ? 0 : TAU * tr;
    const cur = M.fyaw == null ? -M.swimA : M.fyaw, tg = sk > 0.5 ? -M.swimA + flip : 0.14; M.fyaw = cur + angTo(cur, tg) * Math.min(1, dt * (sk > 0.5 ? 9 : 4));
    const r0 = M.froll || 0; M.froll = r0 + angTo(r0, sk > 0.5 && roll ? TAU * tr : 0) * Math.min(1, dt * 10);
  }
  function miniDraw(c, M, X, Y, T, o) {
    o = o || {}; const q = o.q != null ? o.q : Math.min(1, DunFiend.KIT.qq());
    const m = { x: 0, y: 0, r: 2.4, face: 1, t: 1, dmg: 10, act: 'circle' };
    const FX = { K: { qq: () => q }, mem: M, m, S: { lv: M.lv, fast: 1, m, tele: [], hz: [], objs: [], weak: {} }, H: { part() {}, W: () => 400, H: () => 800, ST: () => ({ hp: 1 }) }, me: { x: 0, y: 6 }, C: { x: 0, y: 0, R: 14.5 }, sx: v => v * T, sy: v => v * T, Tz: () => T };
    const hc = hcOf(M), C3 = [0, 0, hc];
    M.tents.forEach(T2 => { T2.role = o.role || 'rest'; T2.P = tentTarget(FX, M, T2, C3, M.lv); T2.alpha = o.tentA == null ? 1 : o.tentA; });
    // small, the cel bands would be lost anyway: the whole toon kit is held to the chosen quality while it paints
    const Q = DunFiend.KIT.Q, keep = Q.pin; Q.pin = q; setYaw(M.yaw || 0);
    try { drawBahamut(c, FX, m, X, Y + hc * T, T, M.bt); } finally { Q.pin = keep; setYaw(0); }
  }
})();
