/* ---------- Light's Sports Car (11th Light ult): the vehicle moves (Shooting Star, Love Sensation, Supernova) ----------
   The car itself, driving, Drift, the HUD swap and the meter live in 20k4p (U.sportscar); this file is the three moves
   it calls through the SPORTSCAR_MOVES contract (docs/LIGHT-CAR-BRIEF.md). Every hit goes through ctx.hit / ctx.hitArea
   (Supernova's with noCharge). Nothing here uses timers: each move is an "act" stepped by one per-transformation fx, which
   checks ctx.alive() every frame and drops everything the moment the form is cancelled.
   Shooting Star: five star sigils open on the floor round the car; 3/4/5 rapid radial volleys of 10/12/14 star missiles,
   each volley turned a little so the bursts interleave into a full starburst. A missile is a baked dimensional star
   (bevelled facets, gold-white core, rose edges) turning gently at the head of a long tapered comet tail; it is a real
   projectile (swept segment against monsters, walls stop it) and bursts on its first monster into a compact flash and
   little fading stars. Trails and fragments never hit.
   Love Sensation: the suspension squats while a heart of light gathers under the chassis; the car leaps along a short
   arc to the targeted point (clamped to range, walked back from the first wall or drop so it can never land through one,
   checked against the car's footprint), ribbons and stars curling behind it, a pink-gold landing marker and a moving
   shadow on the floor. One AoE hit on ground contact; a heart outline sweeps across the floor, stars, rose mist and
   glittering rays rise, the suspension compresses and settles.
   Supernova: the car brakes into a sideways pose and tears through 4/5/6 burnouts (round 3): each a donut of a turn or
   more round a wide circle, nose in and tail swung far out, the next one the other way round so the circles interlock,
   wheels spinning, pink tyre smoke; the sweeping body strikes what it passes with Drift's impacts, and a pink light wave
   bursts off the car at every burnout and every full turn; glowing tyre rings interlock on the floor; each burnout sends a wave (bright leading rim
   into soft pink smoke, large translucent hearts, spinning stars, gold-white ribbons) that hits each monster once as its
   rim reaches it, rising in strength. Then the light is pulled inward, a star-shaped aura forms, the headlights and hubs
   blaze, and the car explodes once (one hit per monster) into hearts, stars and sweeping rays, throwing the pet up along a
   short arc trailing ribbons to a safe landing on walkable ground. The big glows, rays and aura are drawn on the floor
   layer (under the actors) so the pet and the monsters stay readable; bright things above dim near the pet.
   Sprites are baked once (lazily, or ahead through warm(budgetMs)); particles and missiles are pooled. */
const SPORTSCAR_MOVES = (() => {
  const TAU = Math.PI * 2;
  const PINK = '#FFB3E0', CORE = '#FFF4FC', DARKP = '#C2508F', PEARL = '#FFF8FB', GOLD = '#FFD86B', ROSE = '#FF5CA8', CANDY = '#FF8FDB', WGOLD = '#FFF3C4', BLUSH = '#FFD4EE';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eio = u => { u = cl(u); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }, eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const wrapA = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  function mixH(h1, h2, k) { const a = hexRGB(h1), b = hexRGB(h2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`; }
  const rgbaH = (h, a) => { const [r, g, b] = hexRGB(h); return `rgba(${r},${g},${b},${a})`; };

  /* ---- the numbers (DK = base x K x (1 + 0.08 (evo - 1)); tiers: evo 1-3 / 4-6 / 7) ---- */
  const TUNE = {
    /* (round 3: both 1.5 s; Love Sensation's lock, 0.32 + 0.62 + 0.42 = 1.36 s, fits inside its cooldown) */
    cd: { shootingStar: 1.5, loveSensation: 1.5 }, starCd: 1.5, loveCd: 1.5,
    star: { volleys: [3, 4, 5], count: [10, 12, 14], dmg: 0.35, speed: 12.5, range: 7.5, hitR: 0.2, sigil: 0.3, gap: 0.17, turn: 0.38 },
    love: { dmg: 3.2, R: 2.4, range: 5.5, min: 1.8, crouch: 0.32, air: 0.62, peak: 1.9, settle: 0.42 },
    /* (round 2: every hit doubled, 1.6 -> 3.2 a pulse and 6 -> 12 the blast, still noCharge; the burnouts pivot faster and wider,
       so the whole sequence is about a second shorter) */
    /* (round 3: 4/5/6 burnouts, each a full donut and more (1 + 0.1 j turns) round a circle 2.0/2.3/2.6 tiles across its
       centre line, the nose held 0.6 rad in so the tail sweeps out to about 4 tiles; the circle is the widest one the car can
       drive all the way round (props it may smash count as open), else smaller, else it spins on the spot. The sweeping body
       strikes every monster within `sweepPad` of it once per burnout (2.5 DK, Drift's knockback 7.5, noCharge) with Drift's
       impact; each burnout's wave (rising 3.2 DK, noCharge) now reaches 4.2 + 0.5 j tiles; a pink light wave bursts off the
       car at every burnout and every full turn) */
    nova: { pulses: [4, 5, 6], dmg: 3.2, rise: 0.2, R0: 4.2, Rstep: 0.5, waveT: 0.5, brake: 0.36, burn: 0.7, burnStep: 0.03, turns: 1.0, turnStep: 0.1, orbit: [2.0, 2.3, 2.6], nose: 0.6,
      sweep: 2.5, sweepPad: 1.0, sweepKb: 7.5, pinkR: 3.6, pinkT: 0.5, wheel: 72, implode: 0.85, blast: 12.0, blastR: 4.6, eject: 1.0, ejectH: 2.4, ejectD: 1.7, settle: 0.3 },
  };

  /* ================= baked sprites ================= */
  const HPTS = (() => { const N = 72, p = []; for (let i = 0; i < N; i++) { const t = i / N * TAU, s = Math.sin(t); p.push([16 * s * s * s / 16, (-(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) - 2.5) / 16]); } return p; })();   // half-width 1, lobes up, point down
  function heartPath(g, s, ox, oy) { g.beginPath(); for (let i = 0; i < HPTS.length; i++) { const p = HPTS[i], x = ox + p[0] * s, y = oy + p[1] * s; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); }
  function starPath(g, cx, cy, R, r, rot) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = (rot || 0) - Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; i ? g.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) : g.moveTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q); } g.closePath(); }
  function imgSprite(key, w, h, fn) { return fxSprite(key, w, h, (g) => { const im = g.createImageData(w, h), d = im.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = fn(x, y, w, h); if (!o) continue; const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = o[4] != null ? o[4] : 255 * cl(o[3]); } g.putImageData(im, 0, 0); }); }
  /* the missile: a bevelled five-pointed star (ten facets lit from the upper left), gold-white core, rose edges, a halo */
  const sprStar = () => fxSprite('sc2star', 80, 80, g => {
    const C = 40, R = 25, r = 10.5, LX = -0.6, LY = -0.8;
    let gr = g.createRadialGradient(C, C, 0, C, C, 40); gr.addColorStop(0, 'rgba(255,230,150,0.5)'); gr.addColorStop(0.4, 'rgba(255,92,168,0.22)'); gr.addColorStop(1, 'rgba(255,92,168,0)'); g.fillStyle = gr; g.fillRect(0, 0, 80, 80);
    starPath(g, C, C, R, r); g.fillStyle = CANDY; g.fill();
    for (let k = 0; k < 5; k++) { const at = -Math.PI / 2 + k * TAU / 5, tip = [C + Math.cos(at) * R, C + Math.sin(at) * R];
      for (const sd of [-1, 1]) { const av = at + sd * Math.PI / 5, val = [C + Math.cos(av) * r, C + Math.sin(av) * r], nm = at + sd * Math.PI / 2 * 0.55, s = cl(0.5 + 0.65 * (Math.cos(nm) * LX + Math.sin(nm) * LY));
        gr = g.createLinearGradient(C, C, (tip[0] + val[0]) / 2, (tip[1] + val[1]) / 2);
        gr.addColorStop(0, '#FFFFF4'); gr.addColorStop(0.28, mixH(WGOLD, GOLD, 1 - s)); gr.addColorStop(0.7, mixH(PINK, ROSE, 1 - s * 0.85)); gr.addColorStop(1, mixH(ROSE, DARKP, 0.6 * (1 - s)));
        g.beginPath(); g.moveTo(C, C); g.lineTo(tip[0], tip[1]); g.lineTo(val[0], val[1]); g.closePath(); g.fillStyle = gr; g.fill(); g.strokeStyle = gr; g.lineWidth = 0.6; g.stroke(); } }
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let k = 0; k < 5; k++) { const at = -Math.PI / 2 + k * TAU / 5, lit = Math.cos(at) * LX + Math.sin(at) * LY; g.strokeStyle = `rgba(255,252,240,${0.35 + 0.4 * Math.max(0, lit)})`; g.lineWidth = 1.1; g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(at) * R * 0.94, C + Math.sin(at) * R * 0.94); g.stroke(); }
    starPath(g, C, C, R, r); g.strokeStyle = 'rgba(194,80,143,0.65)'; g.lineWidth = 1.3; g.stroke();
    g.save(); starPath(g, C, C, R, r); g.clip(); starPath(g, C - 0.9, C - 1.1, R * 0.97, r * 0.97); g.strokeStyle = 'rgba(255,248,251,0.7)'; g.lineWidth = 1.2; g.stroke(); g.restore();
    gr = g.createRadialGradient(C - 2, C - 3, 0, C, C, 9); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.5, 'rgba(255,250,225,0.6)'); gr.addColorStop(1, 'rgba(255,250,225,0)'); g.fillStyle = gr; g.fillRect(C - 10, C - 10, 20, 20); });
  /* a comet tail: head at the right edge, tapering and fading to nothing at the left, gold-white core in rose */
  const sprTail = () => imgSprite('sc2tail', 128, 32, (x, y, w, h) => { const u = (x + 0.5) / w, hw = 0.1 + 0.9 * Math.pow(u, 0.75), v = (y + 0.5 - h / 2) / (h / 2), q = v / hw;
    if (q * q >= 1) return null; const across = (Math.exp(-q * q * 3.4) - Math.exp(-3.4)) / (1 - Math.exp(-3.4)), a = across * Math.pow(u, 1.7) * Math.min(1, (1 - u) / 0.05 + 0.4), k = cl(across * 1.25) * (0.25 + 0.75 * u);
    return [255, Math.round(lerp(92, 246, k)), Math.round(lerp(168, 214, k)), a]; });
  /* a four-point glint (additive) */
  const sprGlint = col => fxSprite('sc2gl' + col, 32, 32, g => { const [r, gg, b] = hexRGB(col); let gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${r},${gg},${b},0.42)`); gr.addColorStop(0.3, `rgba(${r},${gg},${b},0.14)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    g.fillStyle = 'rgba(255,252,244,0.95)'; for (const [ax, ay, L, W] of [[1, 0, 14, 2.1], [0, 1, 14, 2.1], [0.7, 0.7, 7, 1.3], [0.7, -0.7, 7, 1.3]]) { g.beginPath(); g.moveTo(16 + ax * L, 16 + ay * L); g.lineTo(16 - ay * W, 16 + ax * W); g.lineTo(16 - ax * L, 16 - ay * L); g.lineTo(16 + ay * W, 16 - ax * W); g.closePath(); g.fill(); } });
  /* a small dimensional heart: a soft halo, a body lit at the upper-left lobe, a rim of reflected light, a specular dot */
  const sprHeart = col => fxSprite('sc2h' + col, 48, 48, g => { let gr = g.createRadialGradient(24, 24, 0, 24, 24, 24); gr.addColorStop(0, rgbaH(col, 0.45)); gr.addColorStop(1, rgbaH(col, 0)); g.fillStyle = gr; g.fillRect(0, 0, 48, 48);
    gr = g.createRadialGradient(19, 19, 1, 24, 25, 15); gr.addColorStop(0, PEARL); gr.addColorStop(0.35, mixH(col, '#FFFFFF', 0.25)); gr.addColorStop(0.8, col); gr.addColorStop(1, mixH(col, DARKP, 0.55)); heartPath(g, 12, 24, 23); g.fillStyle = gr; g.fill();
    g.save(); heartPath(g, 12, 24, 23); g.clip(); g.strokeStyle = 'rgba(255,240,248,0.55)'; g.lineWidth = 2; heartPath(g, 11.2, 25, 24); g.stroke(); g.restore();
    heartPath(g, 12, 24, 23); g.strokeStyle = rgbaH(DARKP, 0.55); g.lineWidth = 1; g.stroke(); g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.ellipse(18.5, 18.5, 2.8, 1.8, -0.6, 0, TAU); g.fill(); });
  /* a glowing heart outline, feathered both sides, a gold thread inside */
  const sprHeartLine = () => fxSprite('sc2hl', 192, 192, g => { g.lineJoin = 'round'; for (const [col, lw] of [['rgba(255,92,168,0.12)', 22], ['rgba(255,92,168,0.24)', 13], ['rgba(255,143,219,0.6)', 6.5], ['rgba(255,248,251,1)', 2.4]]) { heartPath(g, 74, 96, 96); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); } heartPath(g, 66, 96, 95); g.strokeStyle = 'rgba(255,216,107,0.65)'; g.lineWidth = 1.6; g.stroke(); });
  /* a large translucent love heart (pearl centre, pink body, bright rim, soft glow) */
  const sprHeartSoft = () => fxSprite('sc2hs', 160, 160, g => { g.lineJoin = 'round';
    for (const [col, lw] of [['rgba(255,92,168,0.08)', 20], ['rgba(255,92,168,0.14)', 11]]) { heartPath(g, 62, 80, 80); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); }
    let gr = g.createRadialGradient(66, 62, 4, 80, 84, 72); gr.addColorStop(0, 'rgba(255,248,251,0.75)'); gr.addColorStop(0.35, 'rgba(255,212,238,0.5)'); gr.addColorStop(0.8, 'rgba(255,143,219,0.45)'); gr.addColorStop(1, 'rgba(255,92,168,0.6)'); heartPath(g, 62, 80, 80); g.fillStyle = gr; g.fill();
    heartPath(g, 62, 80, 80); g.strokeStyle = 'rgba(255,240,248,0.85)'; g.lineWidth = 2.6; g.stroke();
    g.save(); heartPath(g, 62, 80, 80); g.clip(); g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.arc(56, 66, 24, Math.PI * 1.05, Math.PI * 1.45); g.stroke(); g.restore(); });
  /* rings, radially profiled: 'rim' (a wave's bright leading edge with a pink haze inside), 'gold' (a thin tyre ring) */
  /* a radial sprite through a 512-step profile table (one lookup a pixel: a 192 px ring bakes in about a millisecond) */
  function radialSprite(key, w, prof) { const N = 512, LUT = []; for (let i = 0; i < N; i++) { const o = prof((i + 0.5) / N); if (o) o[4] = Math.round(255 * cl(o[3])); LUT.push(o); } return imgSprite(key, w, w, (x, y) => { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - w / 2) / (w / 2); return d >= 1 ? null : LUT[Math.min(N - 1, (d * N) | 0)]; }); }
  const sprRing = kind => radialSprite('sc2r' + kind, kind === 'rim' ? 144 : 128, d => {
    const edge = sm((1 - d) / 0.07);
    if (kind === 'rim') { const pk = Math.exp(-Math.pow((d - 0.89) / 0.04, 2)), hz = 0.26 * sm((d - 0.3) / 0.55) * (d < 0.89 ? 1 : 0.4), s = pk + hz; if (s < 0.004) return null; const k = pk / s; return [255, Math.round(lerp(140, 244, k)), Math.round(lerp(205, 222, k)), Math.min(1, s) * edge]; }
    const pk = Math.exp(-Math.pow((d - 0.86) / 0.035, 2)), hz = 0.35 * Math.exp(-Math.pow((d - 0.86) / 0.11, 2)), s = pk + hz; if (s < 0.004) return null; const k = pk / s; return [255, Math.round(lerp(120, 236, k)), Math.round(lerp(190, 150, k)), Math.min(1, s) * edge]; });
  /* a launch sigil: two rings and a star, gold and pink, every line laid twice (soft wide, bright thin) */
  const sprSigil = () => fxSprite('sc2sig', 96, 96, g => { g.lineCap = 'round'; g.lineJoin = 'round';
    const L2 = (fn, col, w) => { for (const [a, k] of [[0.18, 3.2], [0.4, 1.8], [1, 1]]) { fn(); g.strokeStyle = rgbaH(col, a); g.lineWidth = w * k; g.stroke(); } };
    L2(() => { g.beginPath(); g.arc(48, 48, 38, 0, TAU); }, PINK, 1.6); L2(() => { g.beginPath(); g.arc(48, 48, 30, 0, TAU); }, GOLD, 0.9);
    starPath(g, 48, 48, 27, 11.5); let sg = g.createRadialGradient(48, 48, 0, 48, 48, 27); sg.addColorStop(0, 'rgba(255,243,196,0.75)'); sg.addColorStop(1, 'rgba(255,143,219,0.15)'); g.fillStyle = sg; g.fill(); L2(() => starPath(g, 48, 48, 27, 11.5), WGOLD, 1.3);
    g.fillStyle = PEARL; for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * TAU / 5; g.beginPath(); g.arc(48 + Math.cos(a) * 38, 48 + Math.sin(a) * 38, 2.4, 0, TAU); g.fill(); } });
  /* the landing marker: a gold ring with ticks, a dashed pink ring, a heart in the middle */
  const sprMarker = () => fxSprite('sc2mk', 160, 160, g => { g.lineCap = 'round'; g.lineJoin = 'round';
    const L2 = (fn, col, w) => { for (const [a, k] of [[0.16, 3.4], [0.38, 1.9], [1, 1]]) { fn(); g.strokeStyle = rgbaH(col, a); g.lineWidth = w * k; g.stroke(); } };
    L2(() => { g.beginPath(); g.arc(80, 80, 70, 0, TAU); }, GOLD, 2); g.setLineDash([9, 7]); L2(() => { g.beginPath(); g.arc(80, 80, 58, 0, TAU); }, ROSE, 1.6); g.setLineDash([]);
    L2(() => { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * TAU / 8; g.moveTo(80 + Math.cos(a) * 62, 80 + Math.sin(a) * 62); g.lineTo(80 + Math.cos(a) * 74, 80 + Math.sin(a) * 74); } }, WGOLD, 1.4);
    L2(() => heartPath(g, 26, 80, 80), PINK, 2); const gr = g.createRadialGradient(80, 80, 0, 80, 80, 40); gr.addColorStop(0, 'rgba(255,212,238,0.5)'); gr.addColorStop(1, 'rgba(255,212,238,0)'); g.fillStyle = gr; heartPath(g, 26, 80, 80); g.fill(); });
  /* a soft textured puff of smoke, pale pink-white, feathered to nothing */
  const sprSmoke = i => imgSprite('sc2sm' + i, 64, 64, (() => { let s = 7 + i * 13; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const B = []; for (let k = 0; k < 7; k++) B.push([32 + (R() - 0.5) * 26, 32 + (R() - 0.5) * 22, 8 + R() * 9, 0.5 + R() * 0.6]);
    return (x, y) => { let v = 0; for (const b of B) { const dx = x - b[0], dy = y - b[1]; v += b[3] * Math.exp(-(dx * dx + dy * dy) / (b[2] * b[2])); } const r = Math.hypot(x - 32, y - 32) / 32; const a = (1 - Math.exp(-v * 1.4)) * sm((1 - r) / 0.45); if (a < 0.004) return null; const k = cl(v / 1.6); return [255, Math.round(lerp(196, 240, k)), Math.round(lerp(226, 246, k)), a * 0.85]; }; })());
  /* a star-shaped aura (additive), gold-white at the heart, pink at the tips, feathered */
  const sprAura = () => imgSprite('sc2aura', 128, 128, (x, y, w) => { const dx = x + 0.5 - w / 2, dy = y + 0.5 - w / 2, d = Math.hypot(dx, dy) / (w / 2); if (d >= 1) return null; const th = Math.atan2(dy, dx), p = Math.pow(Math.abs(Math.cos(2.5 * (th + Math.PI / 2))), 5), rs = 0.3 + 0.66 * p, q = d / rs;
    const a = Math.exp(-q * q * 2.4) * sm((1 - d) / 0.12) + 0.25 * Math.exp(-d * d * 9); if (a < 0.004) return null; const k = cl(1 - q * 0.8); return [255, Math.round(lerp(120, 244, k)), Math.round(lerp(196, 205, k)), a]; });
  /* (round 3) the burnout's pink light wave: a bright pearl-white leading rim with a pink halo outside it, fading inward
     into soft pink light, feathered to nothing at both edges (additive, on the floor) */
  const sprPinkWave = () => radialSprite('sc2pw', 192, d => {
    const pk = Math.exp(-Math.pow((d - 0.86) / 0.045, 2)), halo = 0.42 * Math.exp(-Math.pow((d - 0.86) / 0.11, 2)), hz = 0.3 * sm((d - 0.28) / 0.55) * (d < 0.86 ? 1 : 0), s = pk + halo + hz;
    if (s < 0.004) return null; const k = cl(pk / s), edge = sm((1 - d) / 0.08); return [255, Math.round(lerp(150, 246, k)), Math.round(lerp(208, 252, k)), Math.min(1, s) * edge]; });
  const sprShadow = () => radialSprite('sc2shd', 64, d => { return [40, 20, 40, 0.55 * Math.pow(1 - sm(d), 1.4)]; });
  const BAKE = [sprStar, sprTail, () => sprGlint(GOLD), () => sprGlint(PINK), () => sprHeart(ROSE), () => sprHeart('#FFC56E'), sprHeartLine, sprHeartSoft, () => sprRing('rim'), () => sprRing('gold'), sprSigil, sprMarker, () => sprSmoke(0), () => sprSmoke(1), () => sprSmoke(2), sprAura, sprShadow, sprPinkWave,
    () => glowSprite(ROSE), () => glowSprite(WGOLD), () => glowSprite(PINK), () => glowSprite(GOLD), () => typeof raySprite === 'function' && raySprite(WGOLD), () => typeof raySprite === 'function' && raySprite(PINK)];
  let baked = 0;
  function warm(budgetMs) { const t0 = performance.now(), B = budgetMs == null ? 4 : budgetMs; while (baked < BAKE.length && performance.now() - t0 < B) { try { BAKE[baked](); } catch (e) {} baked++; } return baked >= BAKE.length; }

  /* ================= drawing helpers ================= */
  /* put the canvas at screen (x, y) on top of its base transform B, turned by rot, squashed vertically by sy (floor) */
  function setT(c, B, x, y, rot, sy) { const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0, k = sy == null ? 1 : sy; c.setTransform(B.a * cs + B.c * k * sn, B.b * cs + B.d * k * sn, -B.a * sn + B.c * k * cs, -B.b * sn + B.d * k * cs, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f); }
  function put(c, B, img, x, y, w, h, a, rot, sy, add) { if (!(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, rot, sy); c.drawImage(img, -w / 2, -h / 2, w, h); }
  /* a tapered curling ribbon through world points [x, y, z, age] (head first): additive, width and alpha falling to the tail */
  function ribbon(S, c, B, pts, w, col, core, a, curl, ph) { const n = pts.length; if (n < 3 || !(a > 0.01)) return; const H = S.H, T = S.T; c.setTransform(B); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
    let px = 0, py = 0; for (let i = 0; i < n; i++) { const p = pts[i], u = i / (n - 1), q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)], dx = q[0] - r[0], dy = q[1] - r[1], L = Math.hypot(dx, dy) || 1, off = curl * Math.sin(u * 7 + ph) * u;
      const X = H.sx(p[0] - dy / L * off), Y = H.sy(p[1] + dx / L * off) - p[2] * S.ZT;
      if (i) { const k = (1 - u), ia = sm(u / 0.12); c.globalAlpha = a * k * ia * 0.55; c.strokeStyle = col; c.lineWidth = Math.max(0.6, w * T * k); c.beginPath(); c.moveTo(px, py); c.lineTo(X, Y); c.stroke(); if (core) { c.globalAlpha = a * k * ia; c.strokeStyle = core; c.lineWidth = Math.max(0.5, w * T * k * 0.3); c.stroke(); } }
      px = X; py = Y; } }

  /* ================= the per-transformation system: acts + pooled particles ================= */
  const POOL = [], MPOOL = [];
  /* particle kinds: 0 gold glint, 1 pink glint, 2 rose heart, 3 gold heart, 4 smoke, 5 mist, 6 mini star, 7 flash, 8 ring pop, 9 streak */
  const ADD = [1, 1, 0, 0, 0, 1, 0, 1, 1, 1];
  function kitH(ctx) { const H = ctx.H && ctx.H.add ? ctx.H : ctx.X && ctx.X.add ? ctx.X : null; return H; }
  function sysOf(ctx) {
    if (ctx._sc2 && ctx._sc2.on) return ctx._sc2;
    const H = kitH(ctx); if (!H) return null;
    const S = { H, ctx, on: true, keep: false, acts: [], parts: [], T: H.X.Tz(), ZT: H.X.Tz(), PX: 0, PY: -1e4, PR: 30 };
    ctx._sc2 = S;
    function kill() { for (const a of S.acts) if (a.abort) try { a.abort(); } catch (e) {} S.acts.length = 0; for (const p of S.parts) POOL.push(p); S.parts.length = 0; S.on = false; }
    S.fx = H.add({ key: 'sportscar-moves', life: 1e9,
      update(dt, f) {
        if (!S.on) { f.life = 0; return; }
        let alive = true; try { alive = !ctx.alive || ctx.alive(); } catch (e) { alive = false; }
        if (!alive && !S.keep) { kill(); f.life = 0; return; }
        S.T = H.X.Tz();
        for (let i = S.acts.length - 1; i >= 0; i--) { const a = S.acts[i]; a.update(dt); if (a.dead) S.acts.splice(i, 1); }
        const P = S.parts; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); POOL.push(p); continue; }
          if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = 0; } p.rot += p.vr * dt; }
        if (!S.acts.length && !P.length) { S.on = false; f.life = 0; }
      },
      drawUnder(c) { if (!S.on) return; petPos(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.under) a.under(c, B); drawParts(S, c, B, 1); c.restore(); },
      draw(c) { if (!S.on) return; petPos(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.over) a.over(c, B); drawParts(S, c, B, 0); c.restore(); },
      onEnd() { if (S.on) kill(); } });
    return S;
  }
  /* screen px per tile of height, as C1 draws heights (ctx.scr), else one tile */
  function zk(ctx, T) { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 1; }
  /* where the pet's body is on screen (bright things above it dim there) */
  function petPos(S) { const H = S.H, ctx = S.ctx, car = ctx.car, T = S.T = H.X.Tz(); S.PR = T * 0.95; S.ZT = T * zk(ctx, T);
    if (ctx.ejecting && ctx.petX != null) { S.PX = H.sx(ctx.petX); S.PY = H.sy(ctx.petY) - ((ctx.petZ || 0) + 0.45) * S.ZT; }
    else if (car && !car.gone) { S.PX = H.sx(car.x); S.PY = H.sy(car.y) - ((car.z || 0) + 0.6) * S.ZT; }
    else { S.PX = H.sx(H.me.x); S.PY = H.sy(H.me.y) - 0.45 * T; } }
  const petK = (S, X, Y, lo) => { const d = Math.hypot(X - S.PX, (Y - S.PY) * 1.15) / S.PR; return d >= 1.4 ? 1 : (lo == null ? 0.3 : lo) + (1 - (lo == null ? 0.3 : lo)) * sm((d - 0.35) / 1.05); };
  function part(S, kind, x, y, z, vx, vy, vz, life, size, o) { if (!S || S.parts.length > (LOW() ? 300 : 640)) return null; const p = POOL.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.t = 0; p.size = size; p.g = 0; p.drag = 0; p.rot = 0; p.vr = 0; p.grow = 0; p.a = 1; p.u = 0; p.v = 0; p.fin = 0.12;
    if (o) for (const k in o) p[k] = o[k]; S.parts.push(p); return p; }
  function partImg(p) { switch (p.kind) { case 0: return sprGlint(GOLD); case 1: return sprGlint(PINK); case 2: return sprHeart(ROSE); case 3: return sprHeart('#FFC56E'); case 4: return sprSmoke(p.v); case 5: return glowSprite(ROSE); case 6: return sprStar(); case 7: return glowSprite(WGOLD); case 8: return sprRing('rim'); default: return sprTail(); } }
  function drawParts(S, c, B, under) { const H = S.H, T = S.T, P = S.parts; if (!P.length) return;
    for (let pass = 0; pass < 2; pass++) { c.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      for (let i = 0; i < P.length; i++) { const p = P[i]; if (ADD[p.kind] !== pass || (p.u ? 1 : 0) !== under) continue;
        const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 4 || p.kind === 5 ? (1 - u) * (1 - u) : 1 - u * u); if (a < 0.015) continue;
        const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), img = partImg(p);
        const k = under ? 1 : petK(S, X, Y, p.kind === 4 || pass ? 0.1 : 0.35);   // (additive light fades almost away over the pet: it must never wash it out) if (a * k < 0.015) continue;
        c.globalAlpha = a * k > 1 ? 1 : a * k;
        if (p.kind === 9) { const ang = Math.atan2(p.vy - p.vz, p.vx); setT(c, B, X, Y, ang); c.drawImage(img, -s, -s * 0.11, s, s * 0.22); }
        else { setT(c, B, X, Y, p.rot, p.flat ? H.GY : 1); c.drawImage(img, -s / 2, -s / 2, s, s); } } }
    c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }

  /* ================= shared bits ================= */
  function setup(ctx) { const S = sysOf(ctx); if (!S) return null; const H = S.H, C = ctx.C || {}, ev = Math.max(1, Math.min(7, Math.round(ctx.evo || C.evo || 1)));
    const base = C.base != null ? C.base : (H.X.ST ? H.X.ST().atk : 10);
    return { S, H, X: H.X, me: H.me, car: ctx.car, ev, tier: ev >= 7 ? 2 : ev >= 4 ? 1 : 0, DK: ctx.DK > 0 ? ctx.DK : base * (C.K || 1) * (1 + 0.08 * (ev - 1)) }; }
  /* the car's corners and anchors: f along its length (-0.5 rear .. 0.5 nose), l across (-0.5 .. 0.5) */
  function carPt(car, f, l) { const s = car.scale || 1, L = (car.len || 3.24) * s, W = (car.wid || 1.56) * s, ca = Math.cos(car.a || 0), sa = Math.sin(car.a || 0); return [car.x + ca * f * L - sa * l * W, car.y + sa * f * L + ca * l * W]; }
  const carL = car => (car.len || 3.24) * (car.scale || 1);
  const sfx = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  const stand = (ctx, x, y) => { try { return ctx.canStand ? !!ctx.canStand(x, y) : true; } catch (e) { return false; } };
  /* a point the car can sit on: its middle and four points round its footprint */
  /* (round 3: the car's own footprint uses ctx.canDrive when C1 gives it: a prop the car smashes is open road; the pet's
     landing after the ejection keeps the strict ctx.canStand) */
  const drv = (ctx, x, y) => { try { return ctx.canDrive ? !!ctx.canDrive(x, y) : stand(ctx, x, y); } catch (e) { return false; } };
  function standCar(ctx, x, y, car) { const s = car ? (car.scale || 1) : 1, rx = 0.5 * s, ry = 0.4 * s; return drv(ctx, x, y) && drv(ctx, x + rx, y) && drv(ctx, x - rx, y) && drv(ctx, x, y + ry) && drv(ctx, x, y - ry); }
  /* walk from (x0, y0) toward (x1, y1); the last point before the first one that is not standable (never through a wall) */
  function walkTo(ctx, x0, y0, x1, y1, ok) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.2)); let bx = x0, by = y0; for (let i = 1; i <= n; i++) { const x = lerp(x0, x1, i / n), y = lerp(y0, y1, i / n); if (!ok(x, y)) break; bx = x; by = y; } return [bx, by]; }
  function nearest(ctx, x, y) { try { const p = ctx.nearestStand && ctx.nearestStand(x, y); if (p && isFinite(p.x)) return [p.x, p.y]; if (Array.isArray(p)) return p; } catch (e) {} return [x, y]; }
  function burstAt(S, x, y, z, k, big) { const n = Math.max(1, Math.round(k * (LOW() ? 0.4 : 1))); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = rnd(1.2, 3.2) * (big || 1); part(S, i % 3 === 2 ? 6 : i % 2, x, y, z, Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(0.5, 2.6) * (big || 1), rnd(0.35, 0.6), i % 3 === 2 ? 0.22 : 0.42, { g: 5, drag: 2.2, vr: rnd(-7, 7), rot: Math.random() * TAU }); } }

  /* ================= Shooting Star ================= */
  function shootingStar(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E) { done(); return; }
    const { S, H, X, car, tier, DK } = E, tu = TUNE.star, NV = tu.volleys[tier], NM = tu.count[tier], dmg = DK * tu.dmg, base = Math.random() * TAU;
    const ms = []; let t = 0, fired = 0, sent = false, gone = 0; const sig = Math.max(1.2, carL(car) * 0.56);
    sfx(X, 'chime', 1318, 0.7); sfx(X, 'note', 2093, 0.35, 'sine', 0.07, 3136, 0.05);
    function fire(v) { const off = base + v * (TAU / NM) * tu.turn, cx = car.x, cy = car.y; car.glow = Math.max(car.glow || 0, 0.6);
      for (let i = 0; i < NM; i++) { const a = off + i * TAU / NM, m = MPOOL.pop() || {}; m.x = cx + Math.cos(a) * sig * 0.75; m.y = cy + Math.sin(a) * sig * 0.75; m.a = a; m.d = 0; m.t = 0; m.z = 0.55 + 0.12 * Math.sin(i * 1.7); m.rot = Math.random() * TAU; m.vr = (i % 2 ? 1 : -1) * rnd(2.2, 3.4); m.end = 0; m.ex = 0; ms.push(m); }
      for (let k = 0; k < 5; k++) { const a = base + k * TAU / 5 + t * 0.9; part(S, 7, cx + Math.cos(a) * sig, cy + Math.sin(a) * sig, 0.25, 0, 0, 1.5, 0.22, 0.9, { fin: 0.02 }); }
      sfx(X, 'note', 1760 + v * 150, 0.12, 'triangle', 0.06, 2637); sfx(X, 'note', 2637 + v * 200, 0.2, 'sine', 0.045, 3520, 0.03); sfx(X, 'hiss', 0.07, 0.045, 6500); }
    function pop(m, x, y, hard) { m.end = m.t; m.ex = 1; const z = m.z; part(S, 7, x, y, z, 0, 0, 0, 0.16, hard ? 1.1 : 0.6, { fin: 0.01 }); if (hard) part(S, 8, x, y, z, 0, 0, 0, 0.26, 0.35, { grow: 2.6, fin: 0.01 }); burstAt(S, x, y, z, hard ? 5 : 2); }
    const act = { update(dt) { t += dt;
        while (fired < NV && t >= tu.sigil + fired * tu.gap) fire(fired++);
        if (!sent && fired >= NV && t >= tu.sigil + (NV - 1) * tu.gap + 0.1) { sent = true; done(); }
        const L = ms.length ? H.living() : null; let hits = 0;
        for (let i = ms.length - 1; i >= 0; i--) { const m = ms[i]; m.t += dt; m.rot += m.vr * dt;
          if (m.ex) { if (m.t - m.end > 0.14) { ms[i] = ms[ms.length - 1]; ms.pop(); MPOOL.push(m); } continue; }
          const v = tu.speed * (0.55 + 0.45 * sm(m.t / 0.16)) * dt, ca = Math.cos(m.a), sa = Math.sin(m.a), x0 = m.x, y0 = m.y, x1 = x0 + ca * v, y1 = y0 + sa * v;
          let best = null, bt = 2; for (const mo of L) { const rx = mo.x - x0, ry = mo.y - y0, tt = cl((rx * ca + ry * sa) / v), qx = x0 + ca * v * tt - mo.x, qy = y0 + sa * v * tt - mo.y, rr = (mo.r || 0.4) + tu.hitR; if (qx * qx + qy * qy < rr * rr && tt < bt) { bt = tt; best = mo; } }
          if (best) { const hx = x0 + ca * v * bt, hy = y0 + sa * v * bt; m.x = hx; m.y = hy; m.d += v * bt; try { ctx.hit(best, dmg, { kb: 0.8 }); } catch (e) {} pop(m, hx, hy, true); if (hits++ < 2) { sfx(X, 'note', 2349 + Math.random() * 600, 0.09, 'sine', 0.05, 1760); } H.X.light && H.X.light(hx, hy, 1.1, 0.12); continue; }
          if (H.X.blocked && H.X.blocked(x1, y1, 0.1, 1)) { pop(m, x0, y0, false); continue; }
          m.x = x1; m.y = y1; m.d += v; if (m.d >= tu.range) pop(m, x1, y1, false); }
        if (sent && !ms.length && t > tu.sigil + NV * tu.gap + 0.35) act.dead = true; },
      under(c, B) { const T = S.T, cx = car.x, cy = car.y; const fa = Math.min(1, t / 0.2) * (1 - sm((t - (tu.sigil + NV * tu.gap)) / 0.35));
        if (fa > 0.01 && !car.gone) for (let k = 0; k < 5; k++) { const a = base + k * TAU / 5 + t * 0.9, x = H.sx(cx + Math.cos(a) * sig), y = H.sy(cy + Math.sin(a) * sig), pul = 1 + 0.12 * Math.sin(t * 14 + k); put(c, B, sprSigil(), x, y, T * 0.8 * pul * sm(t / 0.25 + 0.3), T * 0.8 * pul * sm(t / 0.25 + 0.3), fa * 0.95, -t * 2.2 + k, H.GY, true); put(c, B, glowSprite(PINK), x, y, T * 1.3, T * 1.3, fa * 0.35, 0, H.GY, true); }
        if (!LOW()) for (const m of ms) if (!m.ex) put(c, B, glowSprite(PINK), H.sx(m.x), H.sy(m.y), T * 0.9, T * 0.9, 0.28, 0, H.GY, true);
        c.setTransform(B); },
      over(c, B) { const T = S.T, tail = sprTail(), star = sprStar(), glo = glowSprite(ROSE);
        for (const m of ms) { const X0 = H.sx(m.x), Y0 = H.sy(m.y) - m.z * S.ZT, k = petK(S, X0, Y0, 0.4), fo = m.ex ? 1 - (m.t - m.end) / 0.14 : 1; if (fo <= 0.01) continue;
          const len = Math.min(m.d, 2.0) * T * fo, w = T * 0.42;
          if (len > 2) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.95 * k * fo; setT(c, B, X0, Y0, m.a); c.drawImage(tail, -len, -w / 2, len + w * 0.15, w); }
          if (m.ex) continue;
          put(c, B, glo, X0, Y0, T * 1.2, T * 1.2, 0.5 * k, 0, 1, true);
          const s = T * 0.74; put(c, B, star, X0, Y0, s, s, Math.min(1, m.t / 0.06) * (0.55 + 0.45 * k), m.rot * 0.35, 1, false); }
        c.setTransform(B); },
      abort() { for (const m of ms) MPOOL.push(m); ms.length = 0; } };
    S.acts.push(act);
  }

  /* ================= Love Sensation ================= */
  function loveSensation(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E) { done(); return; }
    const { S, H, X, car, DK } = E, tu = TUNE.love, wasC = car.contact;
    car.locked = true; car.contact = false; car.vx = car.vy = 0; car.speed = 0;
    // the landing point: the aimed point, held to range, walked back from the first wall, checked against the footprint
    const x0 = car.x, y0 = car.y; let tg = null; try { tg = ctx.target && ctx.target(); } catch (e) {}
    let tx = tg && isFinite(tg.x) ? (tg.m && !tg.m.dead ? tg.m.x : tg.x) : x0 + Math.cos(car.a || 0) * 3.2, ty = tg && isFinite(tg.y) ? (tg.m && !tg.m.dead ? tg.m.y : tg.y) : y0 + Math.sin(car.a || 0) * 3.2;
    let dx = tx - x0, dy = ty - y0, d = Math.hypot(dx, dy); if (d < 0.05) { dx = Math.cos(car.a || 0); dy = Math.sin(car.a || 0); d = 1; tx = x0 + dx; ty = y0 + dy; }
    const want = Math.max(tu.min, Math.min(tu.range, d)); tx = x0 + dx / d * want; ty = y0 + dy / d * want;
    [tx, ty] = walkTo(ctx, x0, y0, tx, ty, (x, y) => standCar(ctx, x, y, car));
    if (!standCar(ctx, tx, ty, car)) { [tx, ty] = stand(ctx, x0, y0) ? [x0, y0] : nearest(ctx, x0, y0); }
    const dist = Math.hypot(tx - x0, ty - y0), peak = tu.peak * (0.75 + 0.25 * Math.min(1, dist / 4)), a0 = car.a || 0, aT = dist > 1 ? Math.atan2(ty - y0, tx - x0) : a0, turn = wrapA(aT - a0) * (Math.abs(wrapA(aT - a0)) > 2.4 ? 0 : 1);
    const T0 = tu.crouch, T1 = T0 + tu.air, T2 = T1 + tu.settle; let t = 0, landed = false, flown = false; const trail = [[], []]; let slam = null;
    sfx(X, 'note', 196, 0.32, 'triangle', 0.12, 294); sfx(X, 'hum');
    const act = { update(dt) { t += dt;
        if (t < T0) { const u = t / T0; car.susp = sm(u) * 0.95; car.glow = Math.max(car.glow || 0, u * 0.7); car.a = a0 + turn * eio(u); car.z = 0;
          if (!LOW() || Math.random() < 0.4) { const a = Math.random() * TAU, r = rnd(1.2, 2); part(S, 1, x0 + Math.cos(a) * r, y0 + Math.sin(a) * r * 0.8, 0.15, -Math.cos(a) * r * 3.2, -Math.sin(a) * r * 2.6, 0, 0.3, 0.3, { u: 1, flat: 1, fin: 0.05 }); } }
        else if (t < T1) { if (!flown) { flown = true; sfx(X, 'whoosh'); sfx(X, 'note', 330, 0.35, 'sine', 0.15, 880); car.a = a0 + turn; }
          const u = (t - T0) / tu.air, e = lerp(u, eio(u), 0.35); car.x = lerp(x0, tx, e); car.y = lerp(y0, ty, e); car.z = peak * 4 * u * (1 - u); car.susp = Math.max(0, 0.95 - u * 6); car.glow = Math.max(car.glow || 0, 0.6);
          for (let s = 0; s < 2; s++) { const p = carPt(car, -0.5, s ? 0.42 : -0.42); trail[s].unshift([p[0], p[1], car.z + 0.35, t]); if (trail[s].length > 18) trail[s].pop(); }
          if (Math.random() < (LOW() ? 0.35 : 0.9)) { const p = carPt(car, rnd(-0.6, -0.3), rnd(-0.5, 0.5)); part(S, Math.random() < 0.5 ? 0 : 6, p[0], p[1], car.z + rnd(0.1, 0.6), rnd(-0.4, 0.4), rnd(-0.4, 0.4), -0.6, rnd(0.4, 0.7), rnd(0.25, 0.4), { vr: rnd(-5, 5), drag: 1.5 }); } }
        else if (!landed) { landed = true; car.x = tx; car.y = ty; car.z = 0; car.susp = 1; car.vx = car.vy = 0; car.speed = 0;
          let n = 0; try { n = ctx.hitArea(tx, ty, tu.R, DK * tu.dmg, { kb: 3 }); } catch (e) {}
          slam = { t: 0 }; landFx(S, tx, ty, tu.R); X.shake && X.shake(RM() ? 3 : 6, 0.2); X.flash && X.flash(RM() ? 0.08 : 0.16, '#FFE3F2'); X.hitstop && X.hitstop(n ? 0.05 : 0.02); X.light && X.light(tx, ty, tu.R * 2.2, 0.5);
          sfx(X, 'thud'); sfx(X, 'stomp'); sfx(X, 'note', 98, 0.6, 'sine', 0.5, 49); sfx(X, 'note', 196, 0.45, 'triangle', 0.14, 98); sfx(X, 'chime', 784, 0.8); }
        else { const u = (t - T1) / tu.settle; car.susp = Math.max(0, Math.exp(-u * 3.2) * Math.cos(u * 9)); car.glow = Math.max(0, (car.glow || 0) - dt * 2);
          if (t >= T2) { car.susp = 0; car.locked = false; car.contact = wasC !== false; act.dead = true; done(); } }
        for (const tr of trail) while (tr.length && t - tr[tr.length - 1][3] > 0.32) tr.pop();
        if (slam) slam.t += dt;
        if (ctx.smash) try { ctx.smash(); } catch (e) {} },
      under(c, B) { const T = S.T, X1 = H.sx(tx), Y1 = H.sy(ty);
        // the landing marker: in with the crouch, tightening and pulsing, gone at contact
        if (!landed) { const fa = sm(t / 0.2), pul = 1 + 0.06 * Math.sin(t * 16), sz = 2 * tu.R * T * (1.18 - 0.18 * sm((t - T0) / tu.air)) * pul; put(c, B, sprMarker(), X1, Y1, sz, sz, fa * 0.9, t * 1.6, H.GY, true); put(c, B, glowSprite(PINK), X1, Y1, sz * 0.7, sz * 0.7, fa * 0.35, 0, H.GY, true); }
        // the moving shadow under the car (darker and tighter as it nears the floor)
        if (t >= T0 && !landed) { const z = car.z || 0, s = carL(car) * T * (1.15 - 0.12 * z); put(c, B, sprShadow(), H.sx(car.x), H.sy(car.y), s, s * 0.62, 0.75 - 0.2 * z, car.a, 1, false); }
        // the heart gathering under the chassis (drawn before the car, so it glows out from beneath it)
        const ga = t < T0 ? sm(t / T0) : t < T1 ? 1 - sm((t - T0) / (tu.air * 0.7)) : 0;
        if (ga > 0.01) { const s = carL(car) * T * (0.55 + 0.45 * sm(t / T0)), Xc = H.sx(car.x), Yc = H.sy(car.y) - (car.z || 0) * S.ZT * 0.85; put(c, B, glowSprite(ROSE), Xc, Yc, s * 1.6, s * 1.6, ga * 0.5, 0, H.GY, true); put(c, B, sprHeartSoft(), Xc, Yc, s, s, ga * 0.85, 0, H.GY, true); put(c, B, sprHeartLine(), Xc, Yc, s * 1.1, s * 1.1, ga * 0.9, 0, H.GY, true); }
        if (slam) drawSlamUnder(S, c, B, slam.t, X1, Y1, tu.R);
        c.setTransform(B); },
      over(c, B) { if (t >= T0) for (let s = 0; s < 2; s++) ribbon(S, c, B, trail[s], 0.2, s ? ROSE : CANDY, PEARL, 0.9, 0.22, t * 6 + s * 2);
        if (slam) drawSlamOver(S, c, B, slam.t, tx, ty, tu.R); c.setTransform(B); },
      abort() { car.z = 0; car.susp = 0; } };
    S.acts.push(act);
  }
  function landFx(S, x, y, R) { const L = LOW();
    for (let i = 0; i < (L ? 8 : 18); i++) { const a = Math.random() * TAU, v = rnd(1.5, 4.5); part(S, i % 3 === 0 ? 6 : i % 2 ? 0 : 1, x + Math.cos(a) * 0.4, y + Math.sin(a) * 0.3, 0.2, Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(2.5, 6), rnd(0.6, 1), i % 3 === 0 ? rnd(0.3, 0.42) : rnd(0.4, 0.6), { g: 7, drag: 1.4, vr: rnd(-6, 6), rot: Math.random() * TAU }); }
    for (let i = 0; i < (L ? 3 : 7); i++) { const a = Math.random() * TAU, v = rnd(0.6, 1.4); part(S, 2, x + Math.cos(a) * R * 0.5, y + Math.sin(a) * R * 0.35, 0.3, Math.cos(a) * v, Math.sin(a) * v, rnd(1.2, 2.4), rnd(0.8, 1.1), rnd(0.32, 0.42), { g: 1.2, drag: 1.2, vr: rnd(-2, 2) }); }
    for (let i = 0; i < (L ? 4 : 9); i++) { const a = i / 9 * TAU + Math.random() * 0.4; part(S, 5, x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.4, 0.2, Math.cos(a) * 1.1, Math.sin(a) * 0.8, 0.25, rnd(0.9, 1.3), R * 0.7, { grow: 0.8, a: 0.35, u: 1, flat: 1 }); }
    for (let i = 0; i < (L ? 2 : 4); i++) { const a = Math.random() * TAU; part(S, 4, x + Math.cos(a) * R * 0.4, y + Math.sin(a) * R * 0.3, 0.1, Math.cos(a) * 0.8, Math.sin(a) * 0.5, 0.3, rnd(1.0, 1.4), R * 0.55, { grow: 1, a: 0.5, u: 1, v: i % 3, rot: Math.random() * TAU, vr: rnd(-0.4, 0.4) }); } }
  function drawSlamUnder(S, c, B, t, X1, Y1, R) { const T = S.T, H = S.H;
    if (t < 0.25) put(c, B, glowSprite(WGOLD), X1, Y1, R * 2.6 * T, R * 2.6 * T, (1 - t / 0.25) * 0.8, 0, H.GY, true);
    if (t < 0.6) { const u = t / 0.6; put(c, B, sprHeartSoft(), X1, Y1, R * 2.2 * T * (0.6 + 0.4 * eout(u)), R * 2.2 * T * (0.6 + 0.4 * eout(u)), (1 - u) * 0.7, 0, H.GY, true); }
    for (let k = 0; k < 2; k++) { const u = (t - k * 0.09) / 0.75; if (u <= 0 || u >= 1) continue; const s = R * 2 * T * (0.35 + 0.95 * eout(u)) * (k ? 0.8 : 1.12); put(c, B, sprHeartLine(), X1, Y1 + T * 0.05, s, s, (1 - u) * (k ? 0.7 : 1), 0, H.GY, true); }
    if (t < 0.45) { const u = t / 0.45, s = R * 2 * T * (0.3 + 0.85 * eout(u)); put(c, B, sprRing('rim'), X1, Y1, s, s, (1 - u) * 0.9, 0, H.GY, true); }
    if (t < 0.7 && typeof raySprite === 'function') { const u = t / 0.7, rs = raySprite(WGOLD); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.33 + Math.sin(i * 3.1) * 0.08, L = T * R * (0.6 + 0.9 * eout(u)) * (0.75 + 0.25 * Math.sin(i * 1.9)), w = T * 0.32; c.globalAlpha = (1 - u) * 0.75; setT(c, B, X1, Y1 - T * 0.2, a); c.drawImage(rs, 0, -w / 2, L, w); } } }
  function drawSlamOver(S, c, B, t, x, y, R) { /* the rising sparkle column above the impact (dims at the pet) */ const T = S.T, H = S.H; if (t > 0.5) return; const u = t / 0.5, X1 = H.sx(x), Y1 = H.sy(y) - T * (0.4 + 0.8 * u); put(c, B, sprGlint(GOLD), X1, Y1, T * 1.8 * (1 - u * 0.5), T * 1.8 * (1 - u * 0.5), (1 - u) * 0.8 * petK(S, X1, Y1, 0.3), t * 3, 1, true); }

  /* ================= Supernova ================= */
  function supernova(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E) { done(); return; }
    const { S, H, X, me, car, tier, DK } = E, tu = TUNE.nova, NP = tu.pulses[tier];
    car.locked = true; car.contact = false; ctx.supernova = true;
    let vx = car.vx || 0, vy = car.vy || 0; const vm = Math.hypot(vx, vy); if (vm > 8) { vx *= 8 / vm; vy *= 8 / vm; } car.vx = car.vy = 0; car.speed = 0;
    const side = Math.random() < 0.5 ? 1 : -1, a0 = car.a || 0;
    // brake | burnouts (round 3: each a little longer than the last) | implode | explosion at TE, ejection after
    const BS = [0]; for (let j = 0; j < NP; j++) BS.push(BS[j] + tu.burn + tu.burnStep * j);
    const TB = tu.brake, TI = TB + BS[NP], TE = TI + tu.implode, RO = tu.orbit[tier];
    let t = 0, ph = 'brake', bi = -1, O = null, ex = null, ej = null, finished = false;
    const rings = [], waves = [], pinks = [], tracks = [[], []], rib = [[], []];
    sfx(X, 'note', 880, 0.5, 'sawtooth', 0.05, 1500); sfx(X, 'hiss', 0.5, 0.18, 2600); sfx(X, 'chime', 659, 0.8);
    function smoke(rate, dt) { const n = rate * dt * (LOW() ? 0.4 : 1); for (let s = 0; s < 2; s++) { let k = n + Math.random(); while (k-- >= 1) { const p = carPt(car, -0.34, s ? 0.5 : -0.5), a = Math.random() * TAU, v = rnd(0.4, 1.4);
        part(S, 4, p[0], p[1], 0.1, Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(0.2, 0.6), rnd(0.9, 1.5), rnd(0.55, 0.85), { grow: 1.6, a: 0.5, u: Math.random() < 0.7 ? 1 : 0, v: (Math.random() * 3) | 0, rot: Math.random() * TAU, vr: rnd(-0.6, 0.6), drag: 1.2, fin: 0.15 });
        if (Math.random() < 0.25) part(S, s ? 0 : 1, p[0], p[1], 0.15, Math.cos(a) * v * 2, Math.sin(a) * v * 1.4, rnd(1, 2.5), rnd(0.3, 0.5), 0.3, { g: 6, drag: 1.5 }); } } }
    function track() { for (let s = 0; s < 2; s++) { const p = carPt(car, -0.34, s ? 0.46 : -0.46), tr = tracks[s], q = tr[0]; if (!q || Math.hypot(q[0] - p[0], q[1] - p[1]) > 0.16) { tr.unshift([p[0], p[1], t]); if (tr.length > 150) tr.pop(); } } }
    /* gold-white ribbons streaming off the rear corners, and sparks showering off the spinning rear tyres */
    function ribbons() { for (let s = 0; s < 2; s++) { const p = carPt(car, -0.5, s ? 0.5 : -0.5); rib[s].unshift([p[0], p[1], 0.32, t]); if (rib[s].length > 22) rib[s].pop(); } }
    function sparks(rate, dt) { let k = rate * dt * (LOW() ? 0.35 : 1) + Math.random(); while (k-- >= 1) { const s = Math.random() < 0.5, p = carPt(car, -0.36, s ? 0.5 : -0.5), a = Math.random() * TAU, v = rnd(1.5, 4);
        part(S, Math.random() < 0.6 ? 0 : 1, p[0], p[1], 0.15, Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(1.5, 3.8), rnd(0.3, 0.55), rnd(0.22, 0.34), { g: 9, drag: 1.4 }); } }
    /* (round 3) a burnout's circle: the car on it, its nose held `nose` rad inside the tangent so the tail swings out. The
       widest circle (of RO, then smaller) the car can drive all the way round, sampled every 0.3 tiles with its footprint
       (walls and drops never; props it smashes are open road), either way round; none: it spins on the spot */
    const K0 = Math.PI / 2 + tu.nose;
    function orbitOK(px, py, Rc, phi0, sd) { const N = Math.max(16, Math.ceil(TAU * Rc / 0.3)); for (let i = 1; i <= N; i++) { const a = phi0 + sd * TAU * i / N; if (!standCar(ctx, px + Math.cos(a) * Rc, py + Math.sin(a) * Rc, car)) return false; } return true; }
    function planOrbit(j) { const pref = side * (j % 2 ? -1 : 1);
      for (const k of [1, 0.74, 0.52, 0.32]) for (const sd of [pref, -pref]) { const Rc = RO * k, phi0 = car.a - sd * K0, px = car.x - Math.cos(phi0) * Rc, py = car.y - Math.sin(phi0) * Rc;
        if (orbitOK(px, py, Rc, phi0, sd)) return { px, py, Rc, phi0, sd }; }
      return { px: car.x, py: car.y, Rc: 0, phi0: car.a - pref * K0, sd: pref }; }
    /* the sweep: every monster the spinning body passes within sweepPad of (its pose sampled between frames), once a burnout */
    function sweepHits(x0, y0, a0) { const L = H.living(); if (!L.length) return; const da = wrapA(car.a - a0), n = Math.min(8, Math.max(1, Math.ceil(Math.max(Math.hypot(car.x - x0, car.y - y0) / 0.4, Math.abs(da) / 0.3))));
      const hl = carL(car) / 2, hw = (car.wid || 1.56) * (car.scale || 1) / 2;
      for (const m of L) { if (O.hit.has(m)) continue; const r = tu.sweepPad + (m.r || 0.4) * 0.85;
        for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(x0, car.x, u), y = lerp(y0, car.y, u), a = a0 + da * u, ca = Math.cos(a), sa = Math.sin(a), gx = m.x - x, gy = m.y - y, lx = gx * ca + gy * sa, ly = -gx * sa + gy * ca;
          if (Math.abs(lx) < hl + r && Math.abs(ly) < hw + r) { O.hit.add(m); let d = 0; try { d = ctx.hit(m, DK * tu.sweep, { noCharge: true, kb: tu.sweepKb }); } catch (e) {} try { if (ctx.impact) ctx.impact(m, d > 0, O.nHit === 0); } catch (e) {} O.nHit++; car.glow = 1; break; } } } }
    /* the pink light wave bursting off the car (each burnout and each full turn) */
    function pinkWave(big) { pinks.push({ x: car.x, y: car.y, t: 0, k: big ? 1 : 0.8 }); part(S, 7, car.x, car.y, 0.3, 0, 0, 0, 0.16, big ? 1.6 : 1.1, { fin: 0.01, u: 1 }); X.light && X.light(car.x, car.y, tu.pinkR * 1.3, 0.25); }
    function pulse(i) { const R = tu.R0 + tu.Rstep * i, w = { x: O && O.Rc > 0 ? O.px : car.x, y: O && O.Rc > 0 ? O.py : car.y, R, t: 0, i, hit: new Set(), dmg: DK * tu.dmg * (1 + tu.rise * i), rot: Math.random() * TAU };
      waves.push(w); X.shake && X.shake(RM() ? 2 : 3 + i * 1.2, 0.18); X.light && X.light(car.x, car.y, R * 1.6, 0.4); X.flash && !RM() && X.flash(0.05 + 0.02 * i, '#FFE3F2');
      sfx(X, 'note', 220 * Math.pow(1.26, i), 0.5, 'sine', 0.3, 110 * Math.pow(1.26, i)); sfx(X, 'chime', 523 * Math.pow(2, i / 4), 0.8 + 0.1 * i); sfx(X, 'hiss', 0.35, 0.12, 1800);
      for (let k = 0; k < (LOW() ? 5 : 12); k++) { const a = k / 12 * TAU + Math.random() * 0.3; part(S, 4, w.x + Math.cos(a) * 0.8, w.y + Math.sin(a) * 0.6, 0.1, Math.cos(a) * R * 1.3, Math.sin(a) * R, 0.2, rnd(0.9, 1.3), rnd(0.8, 1.1), { grow: 1.2, a: 0.32, u: 1, v: k % 3, drag: 2.6, rot: Math.random() * TAU }); }
      // (round 2) hearts and stars flung out with the rim, sparkles bursting off it, streaks of light racing outward
      const L = LOW(), NH = L ? 3 : 8 + 2 * i, NG = L ? 5 : 14 + 2 * i, NS = L ? 4 : 10 + i;
      for (let k = 0; k < NH; k++) { const a = w.rot + k / NH * TAU, v = R / tu.waveT * rnd(0.75, 1.0); part(S, k % 3 === 2 ? 3 : 2, w.x + Math.cos(a) * 0.9, w.y + Math.sin(a) * 0.7, rnd(0.3, 0.8), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(1.4, 3), rnd(0.6, 0.9), rnd(0.42, 0.6), { g: 3, drag: 2.4, vr: rnd(-3, 3) }); }
      for (let k = 0; k < NG; k++) { const a = Math.random() * TAU, v = R / tu.waveT * rnd(0.5, 1.05); part(S, k % 3 === 0 ? 6 : k % 2, w.x + Math.cos(a) * 1.2, w.y + Math.sin(a) * 0.9, rnd(0.2, 1.1), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(1, 4), rnd(0.45, 0.8), k % 3 === 0 ? rnd(0.3, 0.42) : rnd(0.35, 0.55), { g: 4, drag: 2.2, vr: rnd(-8, 8), rot: Math.random() * TAU }); }
      for (let k = 0; k < NS; k++) { const a = w.rot + (k + 0.5) / NS * TAU, v = R / tu.waveT * 1.25; part(S, 9, w.x + Math.cos(a) * 1.2, w.y + Math.sin(a) * 0.9, rnd(0.3, 0.9), Math.cos(a) * v, Math.sin(a) * v * 0.72, 0, 0.32, rnd(1.4, 2.1), { drag: 2.5, fin: 0.03 }); }
      part(S, 7, w.x, w.y, 0.4, 0, 0, 0, 0.2, 2.2 + 0.4 * i, { fin: 0.02, u: 1 }); }
    const act = { update(dt) { t += dt; if (finished) { if (!ex && !ej && !waves.length) act.dead = true; }
        // ---- brake into the sideways pose ----
        if (ph === 'brake') { const u = t / TB, k = Math.exp(-6 * dt); vx *= k; vy *= k; const nx = car.x + vx * dt, ny = car.y + vy * dt; if (standCar(ctx, nx, ny, car)) { car.x = nx; car.y = ny; } else { vx = vy = 0; }
          car.a = a0 + side * 1.35 * eio(u); car.susp = 0.55 * Math.sin(Math.PI * cl(u)); car.burn = 0.4 * u; car.wheelSpin = tu.wheel * 0.45 * u; smoke(20, dt); track(); ribbons(); sparks(14, dt);
          if (t >= TB) { ph = 'burn'; } }
        // ---- the burnouts (round 3): each a donut round a wide circle, the body sweeping, ending in a wave ----
        if (ph === 'burn') { let j = 0; while (j < NP - 1 && t - TB >= BS[j + 1]) j++; const D = BS[j + 1] - BS[j], u = cl((t - TB - BS[j]) / D);
          if (j !== bi) { bi = j; O = planOrbit(j); O.j = j; O.turns = tu.turns + tu.turnStep * j; O.spins = 0; O.hit = new Set(); O.nHit = 0; O.lx = car.x; O.ly = car.y; O.la = car.a;
            const rr = carPt(car, -0.34, 0); rings.push({ x: O.px, y: O.py, r: Math.max(0.66 * carL(car), Math.hypot(rr[0] - O.px, rr[1] - O.py) + 0.3), t: 0, w: j });
            part(S, 8, car.x, car.y, 0.1, 0, 0, 0, 0.3, 1.4, { grow: 1.8, fin: 0.01, u: 1, flat: 1 }); pinkWave(true);
            sfx(X, 'note', 700 + 120 * j, 0.6, 'sawtooth', 0.045, 1300 + 160 * j); sfx(X, 'hiss', 0.6, 0.16, 2200 + 300 * j); sfx(X, 'purr'); }
          // round the circle (eased a little in and out); a step the car cannot drive (a monster pushed it? never a wall) and it spins where it is
          const ang = O.turns * TAU * lerp(u, eio(u), 0.3), phi = O.phi0 + O.sd * ang;
          if (O.Rc > 0) { const nx = O.px + Math.cos(phi) * O.Rc, ny = O.py + Math.sin(phi) * O.Rc; if (standCar(ctx, nx, ny, car) && walkTo(ctx, car.x, car.y, nx, ny, (q, r) => drv(ctx, q, r)).every((v, k) => Math.abs(v - (k ? ny : nx)) < 1e-6)) { car.x = nx; car.y = ny; } else O.Rc = 0; }
          car.a = phi + O.sd * K0;
          const sp = Math.floor(ang / TAU + 1e-6); if (sp > O.spins) { O.spins = sp; if (!LOW() || u < 0.98) pinkWave(false); sfx(X, 'whoosh'); }
          sweepHits(O.lx, O.ly, O.la); O.lx = car.x; O.ly = car.y; O.la = car.a;
          car.burn = 1; car.wheelSpin = tu.wheel; car.susp = 0.25 + 0.12 * Math.sin(t * 46); car.lean = 0.1 * Math.sin(t * 13) * O.sd; car.glow = Math.max(car.glow || 0, 0.5 + 0.1 * j);
          smoke(40 + 8 * j, dt); track(); ribbons(); sparks(30 + 8 * j, dt);
          if (u >= 0.62 && !waves.some(w => w.i === j)) pulse(j);
          if (t >= TI) { ph = 'implode'; O = null; sfx(X, 'note', 196, tu.implode, 'sawtooth', 0.05, 784); sfx(X, 'note', 392, tu.implode, 'sine', 0.16, 1568); sfx(X, 'hiss', tu.implode, 0.12, 3200); } }
        // ---- the implosion: light streams inward, the aura forms, the lights blaze ----
        if (ph === 'implode') { const u = (t - TI) / tu.implode; car.burn = Math.max(0, 1 - u * 2); car.wheelSpin = 46 * (1 - u); car.lean = 0; car.susp = 0.35 * sm(u) + 0.05 * Math.sin(t * 50) * u; car.glow = 0.5 + 0.5 * sm(u);
          if (!LOW() || Math.random() < 0.4) { let q = 12 * dt + Math.random(); while (q-- >= 1) { const a = Math.random() * TAU, r = rnd(3, 4.6), v = rnd(5, 8) * (1 + u); part(S, Math.random() < 0.7 ? 2 : 3, car.x + Math.cos(a) * r, car.y + Math.sin(a) * r * 0.85, rnd(0.6, 1.6), -Math.cos(a) * v, -Math.sin(a) * v * 0.85, -0.6, r / v * 0.9, rnd(0.3, 0.46), { fin: 0.06, vr: rnd(-4, 4) }); } }
          X.light && Math.random() < 0.3 && X.light(car.x, car.y, 2.5 + 3 * u, 0.2);
          const n = (LOW() ? 20 : 72) * dt; let k = n + Math.random(); while (k-- >= 1) { const a = Math.random() * TAU, r = rnd(3.2, 5), v = rnd(6, 9) * (1 + u), x = car.x + Math.cos(a) * r, y = car.y + Math.sin(a) * r * 0.85, z = rnd(0.2, 1.6);
            part(S, 9, x, y, z, -Math.cos(a) * v, -Math.sin(a) * v * 0.85, (0.6 - z) * v / r, r / v * 0.95, rnd(0.6, 1.1), { fin: 0.05 }); }
          if (Math.floor((t - TI) / 0.13) !== Math.floor((t - TI - dt) / 0.13)) { const q = Math.floor((t - TI) / 0.13); sfx(X, 'chime', 784 * Math.pow(2, q / 5), 0.45); }
          if (t >= TE) { ph = 'blast'; blast(); } }
        for (const r of rings) r.t += dt;
        for (let i = pinks.length - 1; i >= 0; i--) { const q = pinks[i]; q.t += dt; if (q.t > tu.pinkT) pinks.splice(i, 1); }
        for (let i = waves.length - 1; i >= 0; i--) { const w = waves[i]; w.t += dt; const u = cl(w.t / tu.waveT), r = w.R * eout(u);
          if (!w.done) { for (const m of H.living()) { if (w.hit.has(m)) continue; if (Math.hypot(m.x - w.x, m.y - w.y) - (m.r || 0.4) * 0.5 <= r) { w.hit.add(m); try { ctx.hit(m, w.dmg, { noCharge: true, kb: 2 }); } catch (e) {} } } if (u >= 1) w.done = true; }
          if (w.t > tu.waveT + 0.5) waves.splice(i, 1); }
        for (const tr of tracks) while (tr.length && t - tr[tr.length - 1][2] > 1.6) tr.pop();
        for (const r of rib) while (r.length && t - r[r.length - 1][3] > 0.3) r.pop();
        if (ex) { ex.t += dt; for (const q of ex.pops) if (!q.on && ex.t >= q.t) { q.on = 1; popAt(q.x, q.y); } if (ex.t > 1.6) ex = null; }
        if (ej) stepEject(dt);
        // (round 3: the scenery the car moved through this frame breaks now, not a frame late)
        if (!car.gone && ctx.smash) try { ctx.smash(); } catch (e) {} },
      under(c, B) { const T = S.T;
        // the glowing tyre tracks (light only) and the interlocking burnout rings
        c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        // (round 3: the longer tracks are laid as a few polylines, one per step of fading, not a stroke a segment)
        setT(c, B, 0, 0); for (const tr of tracks) { let i = 1; while (i < tr.length) { const band = Math.ceil(Math.max(0, 1 - (t - tr[i][2]) / 1.6) * 6); if (band < 1) break; c.beginPath(); c.moveTo(H.sx(tr[i - 1][0]), H.sy(tr[i - 1][1]));
          while (i < tr.length && Math.ceil(Math.max(0, 1 - (t - tr[i][2]) / 1.6) * 6) === band) { c.lineTo(H.sx(tr[i][0]), H.sy(tr[i][1])); i++; }
          const a = band / 6; c.globalAlpha = a * 0.3; c.strokeStyle = PINK; c.lineWidth = T * 0.17; c.stroke(); c.globalAlpha = a * 0.5; c.strokeStyle = PEARL; c.lineWidth = T * 0.045; c.stroke(); } }
        for (let s = 0; s < 2; s++) ribbon(S, c, B, rib[s], 0.24, s ? ROSE : GOLD, PEARL, 0.95, 0.16, t * 9 + s * 2);   // (round 2: the burnouts' gold-white ribbons)
        const iu = ph === 'implode' || ph === 'blast' ? sm((t - TI) / tu.implode) : 0, endA = finished || ph === 'blast' ? Math.max(0, 1 - (t - TE) / 0.35) : 1;
        // (round 2) the implosion: rims of light closing in on the car, a core brightening under it
        if (ph === 'implode') { const u0 = (t - TI) / tu.implode, Xc = H.sx(car.x), Yc = H.sy(car.y);
          for (let k = 0; k < (LOW() ? 1 : 3); k++) { const u = u0 * 1.7 - k * 0.32; if (u <= 0 || u >= 1) continue; const s = 2 * T * lerp(5.6, 0.7, eio(u)); put(c, B, sprRing('rim'), Xc, Yc, s, s, sm(u / 0.25) * (1 - u * 0.6), 0, H.GY, true); }
          const cs = carL(car) * T * (0.9 + 2.2 * iu); put(c, B, glowSprite(WGOLD), Xc, Yc, cs, cs, 0.25 + 0.5 * iu, 0, H.GY, true); put(c, B, glowSprite(ROSE), Xc, Yc, cs * 1.6, cs * 1.6, 0.3 * iu, 0, H.GY, true); }
        // (round 3) the pink light waves: a feathered ring racing outward, its rim bright, fading as it goes
        if (pinks.length) { const pw = sprPinkWave(); for (const q of pinks) { const u = q.t / tu.pinkT, r = tu.pinkR * q.k * (0.15 + 0.85 * eout(u)), s2 = 2 * r * T * 1.08, a = Math.pow(1 - u, 1.3) * sm(q.t / 0.04);
          put(c, B, pw, H.sx(q.x), H.sy(q.y), s2, s2, a, 0, H.GY, true); if (!LOW() && u < 0.4) put(c, B, glowSprite(PINK), H.sx(q.x), H.sy(q.y), T * 2.4 * q.k, T * 2.4 * q.k, (1 - u / 0.4) * 0.45, 0, H.GY, true); } }
        // (round 3: the circles are wide now, so only the newest three stay (two on low), the oldest fading as the next arrives)
        const keepR = LOW() ? 2 : 3; for (let ri = Math.max(0, rings.length - keepR - 1); ri < rings.length; ri++) { const r = rings[ri], old = rings.length - 1 - ri >= keepR ? Math.max(0, 1 - rings[rings.length - 1].t / 0.35) : 1; if (old <= 0.01) continue; const a = sm(r.t / 0.3) * endA * old, s = 2 * r.r * T * (1 - 0.55 * iu) * (1 + 0.04 * Math.sin(r.t * 7 + r.w)), x = lerp(H.sx(r.x), H.sx(car.x), iu), y = lerp(H.sy(r.y), H.sy(car.y), iu); put(c, B, sprRing('gold'), x, y, s * 1.2, s * 1.2, a * (0.85 + 0.4 * iu), r.t * 0.6 * (r.w % 2 ? -1 : 1), H.GY, true); }
        // the waves: rim, inner haze and gold-white ribbons on the floor
        for (const w of waves) { const u = cl(w.t / tu.waveT), r = w.R * eout(u), fa = w.t < tu.waveT ? 1 - 0.3 * u : Math.max(0, 1 - (w.t - tu.waveT) / 0.5) * 0.7, X0 = H.sx(w.x), Y0 = H.sy(w.y), s = 2 * r * T * 1.12, br = 1 + 0.15 * w.i;
          put(c, B, sprRing('rim'), X0, Y0, s, s, fa * 0.95 * br, 0, H.GY, true); if (!LOW()) put(c, B, glowSprite(ROSE), X0, Y0, s * 0.9, s * 0.9, fa * 0.25, 0, H.GY, true);
          put(c, B, sprRing('gold'), X0, Y0, s * 0.82, s * 0.82, fa * 0.8, -w.rot, H.GY, true);
          if (w.t < 0.34 && !LOW() && typeof raySprite === 'function') { const ru = w.t / 0.34, rs = raySprite(w.i % 2 ? PINK : WGOLD), NR = LOW() ? 6 : 12; c.globalCompositeOperation = 'lighter'; for (let k = 0; k < NR; k++) { const a = w.rot + k * TAU / NR, Lr = T * w.R * (0.4 + 0.9 * eout(ru)) * (0.8 + 0.2 * Math.sin(k * 2.7)), wr = T * 0.36; c.globalAlpha = (1 - ru) * (1 - ru) * 0.8; setT(c, B, X0, Y0, a, H.GY); c.drawImage(rs, T * 0.5, -wr / 2, Lr, wr); } }
          c.globalCompositeOperation = 'lighter'; setT(c, B, X0, Y0, 0, H.GY); for (let k = 0; k < 3; k++) { const a0 = w.rot + k * TAU / 3 + u * 1.2, a1 = a0 + 0.8; c.globalAlpha = fa * 0.35; c.strokeStyle = GOLD; c.lineWidth = T * 0.3; c.beginPath(); c.arc(0, 0, r * T * 0.92, a0, a1); c.stroke(); c.globalAlpha = fa * 0.9; c.strokeStyle = WGOLD; c.lineWidth = T * 0.08; c.stroke(); } }
        // the star aura behind the car (forming through the implosion, flaring at the blast)
        if (iu > 0.01 && (!ex || ex.t < 0.5)) { const ea = ex ? 1 - ex.t / 0.5 : 1, s = carL(car) * T * (1.4 + 1.3 * iu) * (ex ? 1 + ex.t * 2 : 1), pu = 1 + 0.06 * Math.sin(t * 22); put(c, B, sprAura(), H.sx(car.x), H.sy(car.y) - T * 0.35, s * pu, s * pu, iu * 0.8 * ea * ea, t * 0.8, 1, true); put(c, B, sprAura(), H.sx(car.x), H.sy(car.y), s * 1.25, s * 1.25, iu * 0.55 * ea * ea, -t * 0.5, H.GY, true); }
        if (ex) drawBlastUnder(c, B);
        if (ej) drawEjectUnder(c, B);
        c.setTransform(B); },
      over(c, B) { const T = S.T;
        // hearts, stars riding each wave
        for (const w of waves) { const u = cl(w.t / tu.waveT), r = w.R * eout(u), fa = w.t < tu.waveT ? 1 : Math.max(0, 1 - (w.t - tu.waveT) / 0.45); if (fa < 0.02) continue; const NH = LOW() ? 4 : 9 + 2 * w.i;
          for (let k = 0; k < NH; k++) { const a = w.rot + k * TAU / NH, x = H.sx(w.x + Math.cos(a) * r * 0.97), y = H.sy(w.y + Math.sin(a) * r * 0.97) - T * (0.55 + 0.25 * Math.sin(u * 5 + k)), s = T * (0.85 + 0.35 * u) * (1 + 0.08 * w.i); put(c, B, sprHeartSoft(), x, y, s, s, fa * 0.6 * petK(S, x, y, 0.2), Math.sin(w.t * 6 + k) * 0.18, 1, false); }
          const NSt = LOW() ? 4 : 12 + 2 * w.i; for (let k = 0; k < NSt; k++) { const a = w.rot + (k + 0.5) * TAU / NSt, x = H.sx(w.x + Math.cos(a) * r * 0.86), y = H.sy(w.y + Math.sin(a) * r * 0.86) - T * 0.9, s = T * 0.5; put(c, B, sprStar(), x, y, s, s, fa * 0.95 * petK(S, x, y, 0.3), w.t * 9 + k, 1, false); } }
        // the blazing lights (headlights, hubs, emblem) through the implosion
        if ((ph === 'implode' || (ph === 'blast' && ex && ex.t < 0.05)) && !car.gone) { const u = sm((t - TI) / tu.implode), fl = 0.75 + 0.25 * Math.sin(t * 30);
          for (const [f, l, h, r] of [[0.5, -0.3, 0.32, 0.55], [0.5, 0.3, 0.32, 0.55], [0.32, -0.52, 0.2, 0.42], [0.32, 0.52, 0.2, 0.42], [-0.32, -0.52, 0.2, 0.42], [-0.32, 0.52, 0.2, 0.42], [0.4, 0, 0.42, 0.4], [-0.5, 0, 0.42, 0.35]]) { const p = carPt(car, f, l), x = H.sx(p[0]), y = H.sy(p[1]) - h * S.ZT; put(c, B, glowSprite(f === 0.5 ? WGOLD : PINK), x, y, r * T * 2 * (0.6 + u), r * T * 2 * (0.6 + u), u * fl * petK(S, x, y, 0.4), 0, 1, true); put(c, B, sprGlint(f === 0.5 ? GOLD : PINK), x, y, r * T * 1.6 * u, r * T * 1.6 * u, u * fl, t * 4, 1, true); } }
        if (ex) drawBlastOver(c, B);
        if (ej) drawEjectOver(c, B);
        c.setTransform(B); },
      abort() { car.z = 0; car.susp = 0; car.lean = 0; delete car.burn; delete car.wheelSpin; if (ctx.ejecting) { ctx.petZ = 0; } } };
    // ---- the explosion ----
    function blast() { const x = car.x, y = car.y; let n = 0; try { n = ctx.hitArea(x, y, tu.blastR, DK * tu.blast, { noCharge: true, kb: 5 }); } catch (e) {}
      // (round 2) a ring of after-pops round the blast, firework-like, a beat after it
      const pops = [], NPp = LOW() ? 3 : 7; for (let k = 0; k < NPp; k++) { const a = Math.random() * TAU / NPp + k * TAU / NPp, r = tu.blastR * rnd(0.45, 0.75); pops.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.8, t: 0.14 + k * 0.045 + Math.random() * 0.04, on: 0 }); }
      ex = { t: 0, x, y, rot: Math.random() * TAU, pops }; car.gone = true; car.vis = 0; car.burn = 0; delete car.wheelSpin; car.glow = 1;
      X.shake && X.shake(RM() ? 4 : 11, 0.4); X.flash && X.flash(RM() ? 0.14 : 0.3, '#FFF0F7');   // (round 2: softer than before; the layers below carry the brightness and the pet stays readable) X.hitstop && X.hitstop(n ? 0.07 : 0.03); X.light && X.light(x, y, 7, 0.6);
      sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'note', 55, 1.3, 'sine', 0.7, 30); sfx(X, 'note', 110, 0.9, 'triangle', 0.25, 55); sfx(X, 'chime', 1046, 1); sfx(X, 'sparkle'); sfx(X, 'hiss', 0.7, 0.3, 900);
      const L = LOW();
      for (let i = 0; i < (L ? 8 : 24); i++) { const a = i / 24 * TAU, v = rnd(9, 13); part(S, 9, x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.6, rnd(0.3, 1.4), Math.cos(a) * v, Math.sin(a) * v * 0.72, rnd(-1, 2), rnd(0.32, 0.45), rnd(1.8, 2.8), { drag: 2.2, fin: 0.02 }); }
      for (let i = 0; i < (L ? 4 : 18); i++) { const a = Math.random() * TAU, v = rnd(3, 8); part(S, i % 2 ? 2 : 3, x + Math.cos(a) * 0.6, y + Math.sin(a) * 0.4, rnd(0.5, 1.4), Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(3, 7), rnd(0.9, 1.4), rnd(0.42, 0.66), { g: 5, drag: 1.2, vr: rnd(-3, 3) }); }
      for (let i = 0; i < (L ? 4 : 16); i++) { const a = Math.random() * TAU, v = rnd(4, 10); part(S, 6, x, y, rnd(0.4, 1.2), Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(3, 8), rnd(0.9, 1.4), rnd(0.45, 0.7), { g: 6, drag: 1.1, vr: rnd(-11, 11), rot: Math.random() * TAU }); }
      for (let i = 0; i < (L ? 6 : 24); i++) { const a = Math.random() * TAU, v = rnd(2, 11); part(S, i % 2, x, y, rnd(0.2, 1.6), Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(1, 6), rnd(0.6, 1.1), rnd(0.32, 0.5), { g: 5, drag: 1.6, rot: Math.random() }); }
      part(S, 7, x, y, 0.3, 0, 0, 0, 0.3, tu.blastR * 1.5, { fin: 0.01, u: 1, a: 0.55 }); part(S, 8, x, y, 0.1, 0, 0, 0, 0.55, tu.blastR * 0.8, { grow: 2.4, fin: 0.01, u: 1, flat: 1 });
      for (let i = 0; i < (L ? 10 : 22); i++) { const a = Math.random() * TAU, v = rnd(2.5, 7); part(S, i % 2 ? 2 : 3, x + Math.cos(a) * 0.6, y + Math.sin(a) * 0.4, rnd(0.3, 0.9), Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(2, 6), rnd(0.8, 1.3), rnd(0.35, 0.55), { g: 5, drag: 1.3, vr: rnd(-3, 3) }); }
      for (let i = 0; i < (L ? 8 : 18); i++) { const a = Math.random() * TAU, v = rnd(3, 8); part(S, 6, x, y, rnd(0.4, 1), Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(2, 7), rnd(0.8, 1.3), rnd(0.4, 0.62), { g: 6, drag: 1.1, vr: rnd(-9, 9), rot: Math.random() * TAU }); }
      for (let i = 0; i < (L ? 8 : 20); i++) { const a = Math.random() * TAU, v = rnd(2, 9); part(S, i % 2, x, y, rnd(0.2, 1.2), Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(1, 5), rnd(0.5, 0.9), rnd(0.28, 0.42), { g: 5, drag: 1.6, rot: Math.random() }); }
      for (let i = 0; i < (L ? 4 : 10); i++) { const a = i / 10 * TAU; part(S, 4, x + Math.cos(a) * 1.2, y + Math.sin(a) * 0.9, 0.2, Math.cos(a) * 3, Math.sin(a) * 2.2, 0.3, rnd(1.2, 1.6), rnd(0.9, 1.2), { grow: 1.3, a: 0.22, u: 1, v: i % 3, drag: 1.8, rot: Math.random() * TAU }); part(S, 5, x + Math.cos(a) * 2, y + Math.sin(a) * 1.5, 0.3, Math.cos(a) * 2, Math.sin(a) * 1.5, 0.2, 1.2, 2.2, { grow: 0.6, a: 0.14, u: 1, flat: 1 }); }
      startEject(x, y); }
    function drawBlastUnder(c, B) { const T = S.T, X0 = H.sx(ex.x), Y0 = H.sy(ex.y), t2 = ex.t, R = tu.blastR;
      if (t2 < 0.45) { const u = t2 / 0.45; put(c, B, glowSprite(WGOLD), X0, Y0 - T * 0.5, R * T * 2.2 * (0.5 + 0.6 * eout(u)), R * T * 2.2 * (0.5 + 0.6 * eout(u)), (1 - u) * (1 - u) * 0.5, 0, 1, true); put(c, B, glowSprite(ROSE), X0, Y0, R * T * 3.4, R * T * 3.4, (1 - u) * 0.4, 0, H.GY, true); }
      if (t2 < 0.12) put(c, B, glowSprite('#FFFFFF'), X0, Y0, R * T * 2.2, R * T * 2.2, (1 - t2 / 0.12) * 0.4, 0, H.GY, true);
      // (round 2) three shock rims and two heart outlines, staggered; a ring of flat hearts riding out on the floor
      for (let k = 0; k < 3; k++) { const u = (t2 - k * 0.11) / (0.6 + 0.12 * k); if (u <= 0 || u >= 1) continue; const s = 2 * R * T * (1.2 - 0.18 * k) * eout(u); put(c, B, sprRing(k === 1 ? 'gold' : 'rim'), X0, Y0, s, s, (1 - u), k * 0.7, H.GY, true); }
      for (let k = 0; k < 2; k++) { const u = (t2 - k * 0.14) / 0.9; if (u > 0 && u < 1) put(c, B, sprHeartLine(), X0, Y0, 2 * R * T * (1.35 - 0.35 * k) * eout(u), 2 * R * T * (1.35 - 0.35 * k) * eout(u), (1 - u) * 0.9, 0, H.GY, true); }
      if (t2 < 0.85 && !LOW()) { const u = t2 / 0.85, NHr = 14, rr = R * 1.05 * eout(u); for (let k = 0; k < NHr; k++) { const a = ex.rot + k * TAU / NHr, s = T * (0.55 + 0.35 * (1 - u)); put(c, B, sprHeart(k % 2 ? ROSE : '#FFC56E'), H.sx(ex.x + Math.cos(a) * rr), H.sy(ex.y + Math.sin(a) * rr), s, s, (1 - u) * 0.9, a + Math.PI / 2, H.GY, true); } }
      if (typeof raySprite === 'function' && t2 < 1.2) { const u = t2 / 1.2, rs = [raySprite(WGOLD), raySprite(PINK)]; c.globalCompositeOperation = 'lighter'; const NR = LOW() ? 6 : 18; for (let i = 0; i < NR; i++) { const lay = i % 2, a = ex.rot + i * TAU / NR + u * 0.8 * (lay ? 1 : -1), L = T * R * (lay ? 0.85 : 1.45) * eout(Math.min(1, u * 2.4)) * (0.8 + 0.2 * Math.sin(i * 2.3)), w = T * (lay ? 0.8 - 0.4 * u : 0.42 - 0.2 * u); c.globalAlpha = (1 - u) * (1 - u) * (lay ? 0.7 : 0.9); setT(c, B, X0, Y0 - T * 0.4, a, 0.75); c.drawImage(rs[lay], 0, -w / 2, L, w); } } }
    function drawBlastOver(c, B) { const T = S.T, t2 = ex.t, R = tu.blastR;
      // layered heart silhouettes opening upright round the blast (outlines: the pet and monsters show through)
      // (round 2: five layers; dimmed where they cross the flying pet)
      for (let k = 0; k < (LOW() ? 3 : 5); k++) { const u = (t2 - k * 0.07) / 0.85; if (u <= 0 || u >= 1) continue; const x = H.sx(ex.x), y = H.sy(ex.y) - T * (0.7 + 0.22 * k), s = T * R * (0.5 + (0.4 + 0.18 * k) * eout(u)); put(c, B, sprHeartLine(), x, y, s, s, (1 - u) * (1 - u) * 0.9 * petK(S, x, y, 0.25), Math.sin(k * 1.7) * 0.12 * u, 1, true); } }
    function popAt(x, y) { const L = LOW(); part(S, 8, x, y, 0.5, 0, 0, 0, 0.32, 0.6, { grow: 2.6, fin: 0.01 }); part(S, 7, x, y, 0.5, 0, 0, 0, 0.18, 1.3, { fin: 0.01 });
      for (let i = 0; i < (L ? 3 : 7); i++) { const a = i / 7 * TAU + Math.random() * 0.4, v = rnd(2, 4.5); part(S, i % 3 === 0 ? 6 : i % 3 === 1 ? 0 : 2, x, y, 0.5, Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(1, 3), rnd(0.4, 0.7), i % 3 === 2 ? 0.4 : 0.32, { g: 5, drag: 2, vr: rnd(-6, 6), rot: Math.random() * TAU }); }
      if (Math.random() < 0.5) sfx(X, 'note', 2093 + Math.random() * 1200, 0.18, 'sine', 0.05, 3136); }
    // ---- the ejection: up along a short arc, ribbons and stars behind, down on clear ground ----
    function startEject(x, y) { const prefs = [Math.PI / 2, Math.PI / 2 - 0.7, Math.PI / 2 + 0.7, 0, Math.PI, -Math.PI / 2 + 0.7, -Math.PI / 2 - 0.7, -Math.PI / 2]; let L = null;
      for (const D of [tu.ejectD, tu.ejectD * 0.6, 0.6]) { for (const a of prefs) { const px = x + Math.cos(a) * D, py = y + Math.sin(a) * D; let ok = stand(ctx, px, py); if (ok) { const w = walkTo(ctx, x, y, px, py, (q, r) => stand(ctx, q, r)); ok = Math.hypot(w[0] - px, w[1] - py) < 0.05; } if (ok) { L = [px, py]; break; } } if (L) break; }
      if (!L) L = stand(ctx, x, y) ? [x, y] : nearest(ctx, x, y);
      let z0 = 0.45; try { const st0 = ctx.seat && ctx.seat(); if (st0 && isFinite(st0.x)) { x = st0.x; y = st0.y; z0 = st0.z || z0; } } catch (e) {}
      ej = { t: 0, z0, x0: x, y0: y, x1: L[0], y1: L[1], tr: [[], []], landed: false };
      ctx.ejecting = true; ctx.petX = x; ctx.petY = y; ctx.petZ = z0; }
    function stepEject(dt) { ej.t += dt; const D = tu.eject;
      if (!ej.landed) { const u = cl(ej.t / D); ctx.petX = lerp(ej.x0, ej.x1, u); ctx.petY = lerp(ej.y0, ej.y1, u); ctx.petZ = ej.z0 * (1 - u) + tu.ejectH * 4 * u * (1 - u);
        for (let s = 0; s < 2; s++) { ej.tr[s].unshift([ctx.petX + (s ? 0.18 : -0.18), ctx.petY, ctx.petZ + 0.25, ej.t]); if (ej.tr[s].length > 16) ej.tr[s].pop(); }
        if (Math.random() < (LOW() ? 0.3 : 0.8)) part(S, Math.random() < 0.5 ? 0 : 6, ctx.petX + rnd(-0.25, 0.25), ctx.petY, ctx.petZ + rnd(0, 0.4), rnd(-0.5, 0.5), rnd(-0.3, 0.3), -1, rnd(0.4, 0.7), rnd(0.25, 0.4), { vr: rnd(-6, 6), drag: 1.5 });
        if (u >= 1) { ej.landed = true; ej.lt = ej.t; ctx.petX = ej.x1; ctx.petY = ej.y1; ctx.petZ = 0; me.x = ej.x1; me.y = ej.y1; me.sq = Math.max(me.sq || 0, 0.7);
          sfx(X, 'bounce', 0.4); sfx(X, 'chime', 1318, 0.5); X.shake && X.shake(2, 0.1);
          for (let i = 0; i < (LOW() ? 4 : 9); i++) { const a = i / 9 * TAU; part(S, i % 2, ej.x1, ej.y1, 0.1, Math.cos(a) * 2.2, Math.sin(a) * 1.5, 1.2, 0.45, 0.35, { g: 5, drag: 2 }); } } }
      else if (ej.t - ej.lt >= tu.settle) { if (!finished) { finished = true; S.keep = true; delete car.burn; delete car.wheelSpin; car.locked = true; done(); } }
      for (const tr of ej.tr) while (tr.length && ej.t - tr[tr.length - 1][3] > 0.35) tr.pop();
      if (ej.landed && ej.t - ej.lt > 0.8) ej = null; }
    function drawEjectUnder(c, B) { const T = S.T; if (!ej.landed) { const z = ctx.petZ || 0, s = T * (0.9 - 0.1 * z); put(c, B, sprShadow(), H.sx(ctx.petX), H.sy(ctx.petY), s, s * 0.55, 0.6 - 0.12 * z, 0, 1, false); put(c, B, glowSprite(PINK), H.sx(ej.x1), H.sy(ej.y1), T * 1.4, T * 1.4, 0.35 * sm(ej.t / 0.3), 0, H.GY, true); }
      else { const u = (ej.t - ej.lt) / 0.5; if (u < 1) put(c, B, sprRing('rim'), H.sx(ej.x1), H.sy(ej.y1), T * 2.2 * eout(u), T * 2.2 * eout(u), 1 - u, 0, H.GY, true); } }
    function drawEjectOver(c, B) { for (let s = 0; s < 2; s++) ribbon(S, c, B, ej.tr[s], 0.16, s ? ROSE : CANDY, PEARL, 0.85, 0.2, ej.t * 8 + s * 2.4); }
    S.acts.push(act);
  }

  return { TUNE, shootingStar, loveSensation, supernova, warm };
})();
