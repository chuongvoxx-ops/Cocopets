/* ---------- Thunder's Beast Machine (11th Thunder ult): the two Strongs (Homing Missiles, Heaven's Wrath) ----------
   The machine, its gait, Jump, the meter, the HUD and the cooldowns live in 20k9i (U.beastmachine); Judgement Day is
   20k9k. This file adds BM.missiles(ctx), BM.wrath(ctx), BM.TUNE_S and BM.warmS to the BEAST_MOVES contract
   (docs/THUNDER-BEAST-BRIEF.md). Every hit goes through ctx.hit. Nothing uses timers: each move is an "act" stepped by
   one per-form fx that checks ctx.alive() every frame and drops everything (no damage) the moment the form ends.
   Homing Missiles: the twin cannon banks tilt up (pose.cannonTilt), the barrels brighten, and exactly 10/15/20 missiles
   leave the muzzles from alternating sides, each with recoil (pose.recoilL/R), a muzzle spark and a short exhaust plume.
   Each flies a live cubic curve: straight up out of the barrel, out to its own side of a wide fan high over the field,
   then over and down onto its target, whose position the curve's end follows every frame, so the descent homes. A
   missile is a baked dimensional sprite (steel body lit from above, gold-bronze nose and bands, swept fins, a glowing
   cyan core window, a cyan-blue exhaust flame) at the head of a tapered blue-white trail of its recent path. Targets
   are dealt out over the monsters in range, nearest-in-front first, each given about as many as it takes to fall,
   the rest dealt round again, so a lone boss draws every missile; a missile whose target dies turns onto the nearest
   living monster near its aim, else it fizzles in the air. Impact: one damage event (the target, then splash r 0.9 at
   half on everyone else in it, the target excluded), a compact electric burst, branching sparks, a floor ring of light.
   Heaven's Wrath: the machine locks in place; 1/2/3 strikes, alternating hands. Each strike: lift (the hand rises,
   sparks crawl round it, the oval footprint ahead lights up and fills), slam (the hand drives down), impact (one hit
   for each monster whose circle meets the oval, then filaments race out from the hand over that same oval, golden
   flashes, blue-white sparks, spectral fractures of light, an oval shock rim), recoil. Between strikes the heading
   turns toward ctx.aimDir() by at most TUNE_S.wrath.maxTurn. ctx.done() at the end of the final strike's recoil (20k9i
   starts the 2 s cooldown there). The oval is drawn unsquashed in world units, so the light is exactly the hit area.
   Sprites are baked once (lazily, or ahead through BM.warmS(budgetMs)); particles and missiles are pooled. */
const BM = (self.BEAST_MOVES = self.BEAST_MOVES || {});
(() => {
  const TAU = Math.PI * 2;
  const WHITE = '#FFFFFF', CORE = '#F4FBFF', CYAN = '#5FE4FF', BLUE = '#3FA8FF', ICE = '#BFF2FF', VIOLET = '#8A5CFF', GOLD = '#FFD266', AMBER = '#FFB238';
  const cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), sm = u => { u = cl(u); return u * u * (3 - 2 * u); }, lerp = (a, b, u) => a + (b - a) * u;
  const eout = u => { u = cl(u); return 1 - (1 - u) * (1 - u); }, ein = u => { u = cl(u); return u * u * u; };
  const RM = () => typeof reduceMotion !== 'undefined' && !!reduceMotion;
  const LOW = () => typeof st !== 'undefined' && st && !!st.lowFx;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const wrapA = d => { while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };
  const R1 = s => { const v = Math.sin(s * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };
  function mixH(h1, h2, k) { const a = hexRGB(h1), b = hexRGB(h2); return `rgb(${Math.round(a[0] + (b[0] - a[0]) * k)},${Math.round(a[1] + (b[1] - a[1]) * k)},${Math.round(a[2] + (b[2] - a[2]) * k)})`; }

  /* ---- the numbers (DK = base x K x (1 + 0.08 (evo - 1)); tiers 0/1/2 = evo 1-3 / 4-6 / 7) ---- */
  const TUNE = BM.TUNE_S = {
    /* Homing Missiles: 20k9i starts missileCd at the press; ctx.done() comes as the cannons settle after the last launch
       (0.24 + (n - 1) x gap + 0.28 s: about 1.0 / 1.4 / 1.5 s), inside the cooldown; impacts land about 1.2-2.6 s after the press */
    missileCd: 1.8,
    missiles: { count: [10, 15, 20], dmg: 0.45, splash: 0.5, splashR: 0.9, range: 9, tilt: 0.24, gap: [0.054, 0.06, 0.05], settle: 0.22,
      rise: [5.0, 6.6], fan: [1.8, 3.2], over: [2.2, 3.2], dur: 0.95, durPer: 0.055, life: 4, kb: 0.5, retarget: 6, hitZ: 0.35 },
    /* Heaven's Wrath: strikes 1/2/3; the oval is `ahead` tiles in front of the machine's centre, rx along the heading,
       ry across it (3.4 x 2.2 tiles across x deep); a strike is lift + slam + recoil (the first lift a little longer) */
    wrath: { strikes: [1, 2, 3], dmg: 3.0, kb: 2.6, ahead: 1.8, rx: 1.1, ry: 1.7, lift0: 0.32, lift: 0.24, slam: 0.09, recoil: 0.3, maxTurn: 0.7, turnRate: 3.4 },
    cd: 2.0,   // (Heaven's Wrath: 20k9i owns it; exactly 2 s from the final strike's recoil end)
  };

  /* ================= baked sprites ================= */
  function imgSprite(key, w, h, fn) { return fxSprite(key, w, h, (g) => { const im = g.createImageData(w, h), d = im.data; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = fn(x, y, w, h); if (!o) continue; const i = (y * w + x) * 4; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255 * cl(o[3]); } g.putImageData(im, 0, 0); }); }
  const RAD = new Map();   // (made once: the profile table is built only the first time)
  function radialSprite(key, w, prof) { const had = RAD.get(key); if (had) return had; const N = 512, LUT = []; for (let i = 0; i < N; i++) LUT.push(prof((i + 0.5) / N)); const spr = imgSprite(key, w, w, (x, y) => { const d = Math.hypot(x + 0.5 - w / 2, y + 0.5 - w / 2) / (w / 2); return d >= 1 ? null : LUT[Math.min(N - 1, (d * N) | 0)]; }); RAD.set(key, spr); return spr; }
  /* the missile, nose to the right, 112 x 36 (body axis on y = 18): a steel cylinder lit from above (dark belly, a bright
     specular line, a rim of reflected light), a gold-bronze ogive nose, bronze bands with rivet dots, two swept fins
     (top and bottom) and a third seen edge-on, a nozzle with a cyan glow inside, and a cyan core window with seams */
  const sprMissile = () => fxSprite('bm2mis', 112, 36, g => {
    const Y = 18, R = 6.4, x0 = 22, x1 = 80, xn = 104;
    g.lineJoin = 'round'; g.lineCap = 'round';
    // fins (behind the body): top and bottom, swept back, dark bronze with a lit leading edge
    for (const s of [-1, 1]) { const gr = g.createLinearGradient(0, Y + s * R, 0, Y + s * 16); gr.addColorStop(0, s < 0 ? '#B8864A' : '#6E4A26'); gr.addColorStop(1, s < 0 ? '#E3B66A' : '#4A2F18');
      g.beginPath(); g.moveTo(x0 + 16, Y + s * (R - 1)); g.lineTo(x0 + 2, Y + s * 16); g.lineTo(x0 - 6, Y + s * 16); g.lineTo(x0 - 1, Y + s * (R - 1)); g.closePath(); g.fillStyle = gr; g.fill();
      g.strokeStyle = s < 0 ? 'rgba(255,236,180,0.9)' : 'rgba(255,214,140,0.45)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x0 + 16, Y + s * (R - 1)); g.lineTo(x0 + 2, Y + s * 16); g.stroke();
      g.strokeStyle = 'rgba(40,24,10,0.6)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x0 + 2, Y + s * 16); g.lineTo(x0 - 6, Y + s * 16); g.lineTo(x0 - 1, Y + s * (R - 1)); g.stroke(); }
    // nozzle: a dark flared ring, cyan inside
    let gr = g.createLinearGradient(0, Y - R, 0, Y + R); gr.addColorStop(0, '#8A93A6'); gr.addColorStop(0.45, '#4C5466'); gr.addColorStop(1, '#22262F');
    g.beginPath(); g.moveTo(x0 + 1, Y - R + 0.5); g.lineTo(x0 - 7, Y - R - 1.2); g.lineTo(x0 - 7, Y + R + 1.2); g.lineTo(x0 + 1, Y + R - 0.5); g.closePath(); g.fillStyle = gr; g.fill();
    gr = g.createRadialGradient(x0 - 7, Y, 0, x0 - 7, Y, R + 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(95,228,255,0.95)'); gr.addColorStop(1, 'rgba(63,168,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x0 - 7, Y, 2.4, R + 0.6, 0, 0, TAU); g.fill();
    // the body: a cylinder
    gr = g.createLinearGradient(0, Y - R, 0, Y + R); gr.addColorStop(0, '#9AA3B5'); gr.addColorStop(0.18, '#F2F6FF'); gr.addColorStop(0.32, '#C3CAD8'); gr.addColorStop(0.62, '#6A7386'); gr.addColorStop(0.86, '#383E4C'); gr.addColorStop(1, '#5A6274');
    g.beginPath(); g.rect(x0, Y - R, x1 - x0, R * 2); g.fillStyle = gr; g.fill();
    // the nose: a gold-bronze ogive to a point
    const nose = () => { g.beginPath(); g.moveTo(x1, Y - R); g.bezierCurveTo(x1 + 12, Y - R, xn - 6, Y - 2.2, xn, Y); g.bezierCurveTo(xn - 6, Y + 2.2, x1 + 12, Y + R, x1, Y + R); g.closePath(); };
    gr = g.createLinearGradient(0, Y - R, 0, Y + R); gr.addColorStop(0, '#E8B860'); gr.addColorStop(0.2, '#FFF1C0'); gr.addColorStop(0.36, '#F2C460'); gr.addColorStop(0.68, '#A8702E'); gr.addColorStop(1, '#5E3A16');
    nose(); g.fillStyle = gr; g.fill(); nose(); g.strokeStyle = 'rgba(70,40,14,0.55)'; g.lineWidth = 0.8; g.stroke();
    g.strokeStyle = 'rgba(255,250,225,0.85)'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x1 + 1, Y - R * 0.62); g.bezierCurveTo(x1 + 10, Y - R * 0.6, xn - 9, Y - 2, xn - 2, Y - 0.4); g.stroke();
    // bronze bands with rivets
    for (const bx of [x0 + 1, x1 - 6]) { gr = g.createLinearGradient(0, Y - R, 0, Y + R); gr.addColorStop(0, '#D9A452'); gr.addColorStop(0.2, '#FFE2A0'); gr.addColorStop(0.5, '#B07A36'); gr.addColorStop(1, '#5A3816'); g.fillStyle = gr; g.fillRect(bx, Y - R - 0.4, 5, R * 2 + 0.8);
      g.fillStyle = 'rgba(255,246,214,0.9)'; for (const ry of [-3.4, 0.4]) { g.beginPath(); g.arc(bx + 2.5, Y + ry, 0.8, 0, TAU); g.fill(); } }
    // the core window: a cyan slot with a white heart and two seams either side
    gr = g.createRadialGradient(50, Y - 0.5, 0, 50, Y, 12); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(191,242,255,1)'); gr.addColorStop(0.65, 'rgba(95,228,255,0.9)'); gr.addColorStop(1, 'rgba(63,168,255,0.0)');
    g.save(); g.beginPath(); g.rect(42, Y - R + 1.4, 17, R * 2 - 2.8); g.clip(); g.fillStyle = '#1C3A66'; g.fillRect(40, 0, 22, 36); g.fillStyle = gr; g.fillRect(36, 0, 30, 36); g.restore();
    g.strokeStyle = 'rgba(20,26,40,0.75)'; g.lineWidth = 0.9; g.strokeRect(42, Y - R + 1.4, 17, R * 2 - 2.8);
    g.strokeStyle = 'rgba(30,34,46,0.5)'; g.lineWidth = 0.7; for (const sx of [36, 65]) { g.beginPath(); g.moveTo(sx, Y - R); g.lineTo(sx, Y + R); g.stroke(); }
    // the edge-on middle fin and the specular line along the top
    g.strokeStyle = 'rgba(60,40,20,0.8)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x0 + 14, Y + 0.6); g.lineTo(x0 - 4, Y + 1.4); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x0 + 6, Y - R * 0.64); g.lineTo(x1 - 7, Y - R * 0.64); g.stroke();
    g.strokeStyle = 'rgba(150,200,255,0.35)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x0 + 6, Y + R * 0.8); g.lineTo(x1, Y + R * 0.8); g.stroke(); });
  /* the exhaust flame (additive), its root at the right edge: a white core in cyan in blue, tapering and feathering left */
  const sprFlame = () => imgSprite('bm2fl', 72, 24, (x, y, w, h) => { const u = (x + 0.5) / w, hw = 0.12 + 0.88 * Math.pow(u, 0.6), v = (y + 0.5 - h / 2) / (h / 2), q = v / hw;
    if (q * q >= 1) return null; const across = Math.exp(-q * q * 3) * (1 - q * q), a = across * Math.pow(u, 1.3), k = cl(across * 1.4 * Math.pow(u, 2.2));
    return [Math.round(lerp(80, 255, k)), Math.round(lerp(170, 255, k)), 255, a]; });
  /* a four-point glint (additive) */
  const sprGlint = col => fxSprite('bm2gl' + col, 32, 32, g => { const [r, gg, b] = hexRGB(col); let gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, `rgba(${r},${gg},${b},0.5)`); gr.addColorStop(0.3, `rgba(${r},${gg},${b},0.16)`); gr.addColorStop(1, `rgba(${r},${gg},${b},0)`); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
    g.fillStyle = 'rgba(255,255,255,0.95)'; for (const [ax, ay, L, W] of [[1, 0, 14, 1.9], [0, 1, 14, 1.9], [0.7, 0.7, 6, 1.1], [0.7, -0.7, 6, 1.1]]) { g.beginPath(); g.moveTo(16 + ax * L, 16 + ay * L); g.lineTo(16 - ay * W, 16 + ax * W); g.lineTo(16 - ax * L, 16 - ay * L); g.lineTo(16 + ay * W, 16 - ax * W); g.closePath(); g.fill(); } });
  /* a spark streak (additive): bright head at the right, a fading tail */
  const sprStreak = col => imgSprite('bm2st' + col, 48, 8, (x, y, w, h) => { const [r, gg, b] = hexRGB(col), u = (x + 0.5) / w, v = Math.abs(y + 0.5 - h / 2) / (h / 2), a = Math.pow(u, 1.6) * Math.exp(-v * v * 4) * (1 - v * v) * Math.min(1, (1 - u) / 0.08 + 0.3); if (a < 0.004) return null; const k = cl(Math.pow(u, 3) * (1 - v)); return [Math.round(lerp(r, 255, k)), Math.round(lerp(gg, 255, k)), Math.round(lerp(b, 255, k)), a]; });
  /* a soft exhaust puff: pale blue-grey, textured, feathered to nothing (never dark) */
  const PUFF = [], sprPuff = i => PUFF[i] || (PUFF[i] = mkPuff(i));
  const mkPuff = i => imgSprite('bm2pf' + i, 48, 48, (() => { let s = 11 + i * 17; const R = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; const B = []; for (let k = 0; k < 6; k++) B.push([24 + (R() - 0.5) * 18, 24 + (R() - 0.5) * 16, 6 + R() * 7, 0.5 + R() * 0.6]);
    return (x, y) => { let v = 0; for (const b of B) { const dx = x - b[0], dy = y - b[1]; v += b[3] * Math.exp(-(dx * dx + dy * dy) / (b[2] * b[2])); } const r = Math.hypot(x - 24, y - 24) / 24, a = (1 - Math.exp(-v * 1.3)) * sm((1 - r) / 0.45); if (a < 0.004) return null; const k = cl(v / 1.6); return [Math.round(lerp(176, 232, k)), Math.round(lerp(196, 240, k)), Math.round(lerp(222, 252, k)), a * 0.7]; }; })());
  /* rings: 'rim' a thin bright ring with a soft halo (missile impacts, the shock rim); 'tele' the oval telegraph (a
     bright feathered rim, a second faint ring inside, a soft fill rising to the rim, gold ticks); 'fill' the impact's
     oval of light (bright, falling off to the rim) */
  const sprRing = kind => kind === 'tele' ? fxSprite('bm2tele', 256, 256, g => {
      const C = 128; g.drawImage(radialSprite('bm2tele0', 256, d => { const rim = Math.exp(-Math.pow((d - 0.93) / 0.022, 2)), halo = 0.45 * Math.exp(-Math.pow((d - 0.93) / 0.07, 2)), inner = 0.22 * Math.exp(-Math.pow((d - 0.6) / 0.02, 2)), fill = 0.16 * Math.pow(d, 2.2) * (d < 0.93 ? 1 : 0), s = rim + halo + inner + fill; if (s < 0.004) return null; const k = cl(rim / s + 0.15); return [Math.round(lerp(63, 240, k)), Math.round(lerp(168, 252, k)), 255, Math.min(1, s) * sm((1 - d) / 0.035)]; }), 0, 0);
      g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r0 = C * (i % 2 ? 0.8 : 0.76), r1 = C * 0.87; for (const [col, lw] of [['rgba(255,210,102,0.25)', 5], ['rgba(255,226,150,0.9)', 1.8]]) { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); g.moveTo(C + Math.cos(a) * r0, C + Math.sin(a) * r0); g.lineTo(C + Math.cos(a) * r1, C + Math.sin(a) * r1); g.stroke(); } } })
    : radialSprite('bm2r' + kind, kind === 'fill' ? 160 : 128, d => {
      if (kind === 'fill') { const a = (0.45 + 0.55 * (1 - d * d)) * sm((1 - d) / 0.12), k = 0.75 * cl(1 - d * 1.1); return [Math.round(lerp(95, 250, k)), Math.round(lerp(190, 252, k)), 255, a]; }
      const pk = Math.exp(-Math.pow((d - 0.88) / 0.035, 2)), hz = 0.4 * Math.exp(-Math.pow((d - 0.86) / 0.11, 2)), s = pk + hz; if (s < 0.004) return null; const k = pk / s; return [Math.round(lerp(63, 245, k)), Math.round(lerp(168, 252, k)), 255, Math.min(1, s) * sm((1 - d) / 0.06)]; });
  const sprShadow = () => radialSprite('bm2shd', 48, d => [30, 30, 60, 0.4 * Math.pow(1 - sm(d), 1.4)]);
  const BAKE = [sprMissile, sprFlame, () => sprGlint(CYAN), () => sprGlint(GOLD), () => sprStreak(CYAN), () => sprStreak(GOLD), () => sprPuff(0), () => sprPuff(1), () => sprPuff(2),
    () => sprRing('rim'), () => sprRing('tele'), () => sprRing('fill'), sprShadow, () => glowSprite(CYAN), () => glowSprite(BLUE), () => glowSprite(WHITE), () => glowSprite(GOLD), () => glowSprite(VIOLET)];
  let baked = 0;
  function warmS(budgetMs) { const t0 = performance.now(), B = budgetMs == null ? 4 : budgetMs; while (baked < BAKE.length && performance.now() - t0 < B) { try { BAKE[baked](); } catch (e) {} baked++; } return baked >= BAKE.length; }
  BM.warmS = warmS;

  /* ================= drawing helpers ================= */
  /* the canvas at screen (x, y) over the base transform B, turned by rot, scaled by (kx, ky) */
  function setT(c, B, x, y, rot, kx, ky) { const cs = rot ? Math.cos(rot) : 1, sn = rot ? Math.sin(rot) : 0, a = kx == null ? 1 : kx, d = ky == null ? a : ky;
    c.setTransform((B.a * cs + B.c * sn) * a, (B.b * cs + B.d * sn) * a, (-B.a * sn + B.c * cs) * d, (-B.b * sn + B.d * cs) * d, B.a * x + B.c * y + B.e, B.b * x + B.d * y + B.f); }
  function put(c, B, img, x, y, w, h, a, rot, add) { if (!(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = add ? 'lighter' : 'source-over'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, rot); c.drawImage(img, -w / 2, -h / 2, w, h); }
  /* a floor sprite squashed to the kit's floor look (decorative rings only; the Wrath oval is drawn true) */
  function putFloor(c, B, img, x, y, w, a, GY) { if (!(a > 0.01) || !(w > 0.5)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, x, y, 0, 1, GY); c.drawImage(img, -w / 2, -w / 2, w, w); }

  /* ================= the per-form system: acts + pooled particles ================= */
  const POOL = [], MPOOL = [];
  /* particle kinds: 0 cyan glint, 1 gold glint, 2 puff, 3 white flash, 4 floor ring, 5 cyan streak, 6 gold streak, 7 cyan glow, 8 gold glow */
  const ADD = [1, 1, 0, 1, 1, 1, 1, 1, 1];
  function sysOf(ctx) {
    if (ctx._bm2 && ctx._bm2.on) return ctx._bm2;
    const H = ctx.H && ctx.H.add ? ctx.H : null; if (!H) return null;
    const S = { H, ctx, on: true, acts: [], parts: [], zaps: [], T: H.X.Tz(), ZT: H.X.Tz(), PX: 0, PY: -1e4, PR: 30, sndT: 0, t: 0 };
    ctx._bm2 = S;
    function kill() { for (const a of S.acts) if (a.abort) try { a.abort(); } catch (e) {} S.acts.length = 0; for (const p of S.parts) POOL.push(p); S.parts.length = 0; S.zaps.length = 0; S.on = false; }
    S.kill = kill;
    S.fx = H.add({ key: 'beast-strongs', life: 1e9,
      update(dt, f) {
        if (!S.on) { f.life = 0; return; }
        let alive = true; try { alive = !ctx.alive || ctx.alive(); } catch (e) { alive = false; }
        S.alive = alive; S.t += dt; S.sndT -= dt;
        if (!alive) for (const a of S.acts) if (!a.dying && a.cancel) { a.dying = true; try { a.cancel(); } catch (e) {} }
        S.T = H.X.Tz();
        for (let i = S.acts.length - 1; i >= 0; i--) { const a = S.acts[i]; a.update(dt); if (a.dead) S.acts.splice(i, 1); }
        const P = S.parts; for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; if (p.t >= p.life) { P[i] = P[P.length - 1]; P.pop(); POOL.push(p); continue; }
          if (p.drag) { const k = Math.exp(-p.drag * dt); p.vx *= k; p.vy *= k; p.vz *= k; } p.vz -= p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.z < 0) { p.z = 0; p.vz = 0; } p.rot += p.vr * dt; }
        const Z = S.zaps; for (let i = Z.length - 1; i >= 0; i--) { Z[i].t += dt; if (Z[i].t >= Z[i].life) { Z[i] = Z[Z.length - 1]; Z.pop(); } }
        if (!S.acts.length && !P.length && !Z.length) { S.on = false; f.life = 0; }
      },
      drawUnder(c) { if (!S.on) return; view(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.under) a.under(c, B); drawParts(S, c, B, 1); c.setTransform(B); c.restore(); },
      draw(c) { if (!S.on) return; view(S); const B = c.getTransform(); c.save(); for (const a of S.acts) if (a.over) a.over(c, B); drawZaps(S, c, B); drawParts(S, c, B, 0); c.setTransform(B); c.restore(); },
      onEnd() { if (S.on) kill(); } });
    return S;
  }
  /* screen px per tile of height (ctx.scr), else the kit's tile */
  function zk(ctx, T) { try { if (ctx.scr && T > 0) { const a = ctx.scr(0, 0, 0), b = ctx.scr(0, 0, 1), k = (a[1] - b[1]) / T; if (k > 0.2 && k < 2) return k; } } catch (e) {} return 1; }
  /* the pet's place on the screen (bright things dim over it) */
  function view(S) { const H = S.H, ctx = S.ctx, T = S.T = H.X.Tz(); S.ZT = T * zk(ctx, T); S.PR = T * 0.85; S.GY = H.GY || 0.55;
    const s = anchor(ctx, 'seat'); S.PX = H.sx(s.x); S.PY = H.sy(s.y) - (s.z + 0.4) * S.ZT; }
  const petK = (S, X, Y, lo) => { const d = Math.hypot(X - S.PX, (Y - S.PY) * 1.1) / S.PR; return d >= 1.4 ? 1 : lo + (1 - lo) * sm((d - 0.3) / 1.1); };
  function part(S, kind, x, y, z, vx, vy, vz, life, size, o) { if (!S || S.parts.length > (LOW() ? 220 : 520)) return null; const p = POOL.pop() || {};
    p.kind = kind; p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.life = life; p.t = 0; p.size = size; p.g = 0; p.drag = 0; p.rot = 0; p.vr = 0; p.grow = 0; p.a = 1; p.u = 0; p.v = 0; p.fin = 0.06; p.flat = 0;
    if (o) for (const k in o) p[k] = o[k]; S.parts.push(p); return p; }
  function partImg(p) { switch (p.kind) { case 0: return sprGlint(CYAN); case 1: return sprGlint(GOLD); case 2: return sprPuff(p.v); case 3: return glowSprite(WHITE); case 4: return sprRing('rim'); case 5: return sprStreak(CYAN); case 6: return sprStreak(GOLD); case 7: return glowSprite(CYAN); default: return glowSprite(GOLD); } }
  function drawParts(S, c, B, under) { const H = S.H, T = S.T, P = S.parts; if (!P.length) return;
    for (let pass = 0; pass < 2; pass++) { c.globalCompositeOperation = pass ? 'lighter' : 'source-over';
      for (let i = 0; i < P.length; i++) { const p = P[i]; if (ADD[p.kind] !== pass || (p.u ? 1 : 0) !== under) continue;
        const u = p.t / p.life, a = p.a * Math.min(1, p.t / p.fin) * (p.kind === 2 ? (1 - u) * (1 - u) : 1 - u * u); if (a < 0.015) continue;
        const X = H.sx(p.x), Y = H.sy(p.y) - p.z * S.ZT, s = p.size * T * (1 + p.grow * u), img = partImg(p);
        const k = under ? 1 : petK(S, X, Y, pass ? 0.12 : 0.3), al = a * k; if (al < 0.015) continue;
        c.globalAlpha = al > 1 ? 1 : al;
        if (p.kind === 5 || p.kind === 6) { const sx = p.vx * T, sy = p.vy * T - p.vz * S.ZT; setT(c, B, X, Y, Math.atan2(sy, sx)); const L = s * (0.5 + Math.min(1.5, Math.hypot(sx, sy) / (T * 6))); c.drawImage(img, -L, -s * 0.09, L, s * 0.18); }
        else if (p.flat) { setT(c, B, X, Y, 0, 1, S.GY); c.drawImage(img, -s / 2, -s / 2, s, s); }
        else { setT(c, B, X, Y, p.rot); c.drawImage(img, -s / 2, -s / 2, s, s); } } }
    c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; }
  /* short-lived lightning (screen-space arcs re-grown at 24 Hz from world end points): impact sparks, hand crackle */
  function zap(S, x0, y0, z0, x1, y1, z1, w, life, o) { if (S.zaps.length > (LOW() ? 10 : 28)) return; S.zaps.push({ x0, y0, z0, x1, y1, z1, w, life, t: 0, s: Math.random() * 1000, gold: !!(o && o.gold), forks: o && o.forks != null ? o.forks : 1 }); }
  function drawZaps(S, c, B) { const Z = S.zaps; if (!Z.length || typeof TK === 'undefined') return; const H = S.H, K = TK.bind(H), T = S.T; c.setTransform(B);
    for (const z of Z) { const u = z.t / z.life, a = (1 - u * u) * Math.min(1, z.t / 0.02); if (a < 0.02) continue;
      const X0 = H.sx(z.x0), Y0 = H.sy(z.y0) - z.z0 * S.ZT, X1 = H.sx(z.x1), Y1 = H.sy(z.y1) - z.z1 * S.ZT, k = Math.min(petK(S, X0, Y0, 0.15), petK(S, X1, Y1, 0.15));
      K.arc(c, X0, Y0, X1, Y1, Math.floor(S.t * 24) + z.s, Math.max(0.8, z.w * T), a * k, { forks: LOW() ? 0 : z.forks, gold: z.gold, jit: Math.hypot(X1 - X0, Y1 - Y0) * 0.22 }); }
    c.setTransform(B); }

  /* ================= shared bits ================= */
  const sfx = (X, k, ...a) => { try { if (X.sfx && X.sfx[k]) X.sfx[k](...a); } catch (e) {} };
  const once = ctx => { let d = false; return () => { if (d) return; d = true; try { ctx.done && ctx.done(); } catch (e) {} }; };
  /* an anchor from 20k9i, else a fair guess from the machine's place and heading */
  const GUESS = { cannonL: [-0.35, -0.62, 1.55], cannonR: [-0.35, 0.62, 1.55], muzzleL: [-0.15, -0.62, 2.05], muzzleR: [-0.15, 0.62, 2.05], handL: [0.95, -0.7, 0.2], handR: [0.95, 0.7, 0.2], seat: [-0.3, 0, 1.1], eyes: [1.1, 0, 0.9], chest: [0.4, 0, 0.8] };
  function anchor(ctx, name, alt) { try { const p = ctx.anchor && ctx.anchor(name); if (p && isFinite(p.x) && isFinite(p.y)) return { x: p.x, y: p.y, z: p.z || 0 }; } catch (e) {} if (alt) return anchor(ctx, alt);
    const b = ctx.beast || { x: 0, y: 0, a: 0 }, q = GUESS[name] || [0, 0, 0.8], s = b.scale || 1, ca = Math.cos(b.a || 0), sa = Math.sin(b.a || 0); return { x: b.x + (ca * q[0] - sa * q[1]) * s, y: b.y + (sa * q[0] + ca * q[1]) * s, z: (b.z || 0) + q[2] * s }; }
  /* the barrels' direction (unit, z up), from 20k9i, else straight up and a little out to the side */
  function cannonDir(ctx, side) { try { const d = ctx.cannonDir && ctx.cannonDir(side); if (d && isFinite(d.x) && isFinite(d.z)) return d; } catch (e) {} const b = ctx.beast || { a: 0 }, s = side === 'R' ? 1 : -1, a = (b.a || 0) + s * Math.PI / 2; return { x: Math.cos(a) * 0.2, y: Math.sin(a) * 0.2, z: 0.98 }; }
  function setup(ctx) { const S = sysOf(ctx); if (!S) return null; const H = S.H, C = ctx.C || {}, ev = Math.max(1, Math.min(7, Math.round(ctx.evo || C.evo || 1)));
    const base = C.base != null ? C.base : (H.X.ST ? H.X.ST().atk : 10), tier = ctx.tier != null ? ctx.tier : ev >= 7 ? 2 : ev >= 4 ? 1 : 0;
    return { S, H, X: H.X, b: ctx.beast, tier, DK: ctx.DK > 0 ? ctx.DK : base * (C.K || 1) * (1 + 0.08 * (ev - 1)) }; }
  function mons(ctx, H) { try { const L = ctx.mons && ctx.mons(); if (L) return L; } catch (e) {} return H.living(); }
  const gone = m => !m || m.dead || m.under || m.falling || m.fobj || !(m.hp > 0);
  function pose(b) { return b && (b.pose || (b.pose = {})); }
  /* wall between two floor points (a stretch of mode-1 wall) */
  function wallBetween(X, x0, y0, x1, y1) { if (!X.blocked) return false; const d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.35)); for (let i = 1; i < n; i++) { const u = i / n; if (X.blocked(lerp(x0, x1, u), lerp(y0, y1, u), 0.05, 1)) return true; } return false; }

  /* ================= Homing Missiles ================= */
  function bez(P, u, o) { const v = 1 - u, a = v * v * v, b = 3 * v * v * u, c = 3 * v * u * u, d = u * u * u; for (let k = 0; k < 3; k++) o[k] = a * P[0][k] + b * P[1][k] + c * P[2][k] + d * P[3][k]; return o; }
  function bezD(P, u, o) { const v = 1 - u, a = 3 * v * v, b = 6 * v * u, c = 3 * u * u; for (let k = 0; k < 3; k++) o[k] = a * (P[1][k] - P[0][k]) + b * (P[2][k] - P[1][k]) + c * (P[3][k] - P[2][k]); return o; }
  function missiles(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E) { done(); return; }
    const { S, H, X, b, tier, DK } = E, tu = TUNE.missiles, N = tu.count[tier], gap = tu.gap[tier], dmg = DK * tu.dmg, P0 = pose(b);
    const ms = []; let t = 0, fired = 0, sent = false; const tmp = [0, 0, 0], tmpD = [0, 0, 0];
    // the plan: monsters in range, nearest in front first; each given about as many missiles as it takes to fall, then round again
    const plan = (() => { const L = mons(ctx, H).filter(m => !gone(m) && Math.hypot(m.x - b.x, m.y - b.y) < tu.range + (m.r || 0.4)), ca = Math.cos(b.a || 0), sa = Math.sin(b.a || 0);
      L.sort((p, q) => { const sc = m => { const dx = m.x - b.x, dy = m.y - b.y, d = Math.hypot(dx, dy) || 1; return d - 1.6 * (dx * ca + dy * sa) / d; }; return sc(p) - sc(q); });
      const out = []; if (!L.length) return out; const need = L.map(m => Math.max(1, Math.ceil((m.hp || dmg) / (dmg * 0.9))));
      // round robin over those still needing missiles, then round robin over all of them
      for (let any = true; any && out.length < N;) { any = false; for (let i = 0; i < L.length && out.length < N; i++) if (need[i] > 0) { need[i]--; out.push(L[i]); any = true; } }
      for (let j = 0; out.length < N; j++) out.push(L[j % L.length]);
      return out; })();
    const load = new Map(); for (const m of plan) load.set(m, (load.get(m) || 0) + 1);
    sfx(X, 'note', 140, 0.28, 'sawtooth', 0.06, 220); sfx(X, 'note', 880, 0.22, 'triangle', 0.04, 1320, 0.08); sfx(X, 'hiss', 0.12, 0.05, 3000);
    function aimPt(m, i) { if (m && !gone(m)) return [m.x, m.y, tu.hitZ + (m.z || 0)];
      const a = (b.a || 0) + ((i % 2 ? 1 : -1) * (0.15 + 0.5 * R1(i * 3.1))), d = 3 + 3 * R1(i * 7.7); let x = b.x + Math.cos(a) * d, y = b.y + Math.sin(a) * d; return [x, y, 0]; }
    function fire(i) { const side = i % 2 ? 'R' : 'L', mz = anchor(ctx, 'muzzle' + side + (Math.floor(i / 2) % 3), 'muzzle' + side), cd = cannonDir(ctx, side), tg = plan.length ? plan[i % plan.length] : null, m = MPOOL.pop() || { P: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]], tr: [] };
      const sg = side === 'R' ? 1 : -1, a0 = b.a || 0, k = (Math.floor(i / 2) + 0.5) / Math.ceil(N / 2), fanA = a0 + sg * lerp(0.3, 1.75, k) + rnd(-0.12, 0.12), A = aimPt(tg, i);
      const rise = lerp(tu.rise[0], tu.rise[1], R1(i * 1.37 + 0.2)), fan = lerp(tu.fan[0], tu.fan[1], R1(i * 2.71 + 0.5)), over = lerp(tu.over[0], tu.over[1], R1(i * 4.13 + 0.9));
      m.P[0][0] = mz.x; m.P[0][1] = mz.y; m.P[0][2] = mz.z;
      // (the fan's reach toward the viewer is halved: on the screen it would cancel the climb and read as a flat stream)
      const fy = Math.sin(fanA) * (Math.sin(fanA) > 0 ? 0.45 : 0.8);
      m.P[1][0] = mz.x + Math.cos(fanA) * fan + cd.x * rise * 0.35; m.P[1][1] = mz.y + fy * fan + cd.y * rise * 0.35; m.P[1][2] = mz.z + rise * (0.65 + 0.35 * cd.z);   // (out along the barrel, then up and out to its side)
      m.fx = Math.cos(fanA) * fan * 0.4; m.fy = fy * fan * 0.4; m.over = over;
      m.P[3][0] = A[0]; m.P[3][1] = A[1]; m.P[3][2] = A[2]; aimP2(m);
      const d = Math.hypot(A[0] - mz.x, A[1] - mz.y); m.dur = tu.dur + d * tu.durPer + rnd(0, 0.12); m.t = 0; m.age = 0; m.u = 0; m.tg = tg; m.ex = 0; m.fz = 0; m.i = i; m.tr.length = 0; m.trT = 0; m.whistle = 0; m.x = mz.x; m.y = mz.y; m.z = mz.z; m.ang = -Math.PI / 2; m.left = false;
      ms.push(m);
      // the launch: recoil, a muzzle spark, an exhaust plume, sparks
      P0['recoil' + side] = 1; P0.glow = Math.max(P0.glow || 0, 0.7);
      part(S, 3, mz.x, mz.y, mz.z + 0.1, 0, 0, 0, 0.12, 1.0, { fin: 0.01 }); part(S, 7, mz.x, mz.y, mz.z + 0.1, 0, 0, 0, 0.2, 1.3, { fin: 0.01, a: 0.7 });
      part(S, 0, mz.x, mz.y, mz.z + 0.15, 0, 0, 0, 0.1, 0.75, { fin: 0.01, rot: Math.random() });
      if (!LOW() || i % 2 === 0) for (let k2 = 0; k2 < 3; k2++) part(S, 2, mz.x + rnd(-0.12, 0.12), mz.y + rnd(-0.1, 0.1), mz.z - 0.05 + k2 * 0.12, rnd(-0.6, 0.6) - sg * Math.sin(a0) * 0.4, rnd(-0.4, 0.4) + sg * Math.cos(a0) * 0.4, rnd(-0.5, 0.6), rnd(0.35, 0.55), rnd(0.42, 0.62), { drag: 2.5, grow: 1.1, v: (i + k2) % 3, rot: Math.random() * TAU, vr: rnd(-1, 1), a: 0.7 });
      for (let k2 = 0; k2 < (LOW() ? 2 : 4); k2++) { const a = Math.random() * TAU; part(S, 5, mz.x, mz.y, mz.z + 0.1, Math.cos(a) * rnd(1.5, 3.5), Math.sin(a) * rnd(1.5, 3.5), rnd(1.5, 4.5), rnd(0.18, 0.3), rnd(0.35, 0.5), { g: 6, drag: 2 }); }
      sfx(X, 'note', 260 + (i % 4) * 30, 0.16, 'square', 0.03, 760); sfx(X, 'hiss', 0.1, 0.06, 2600 + (i % 3) * 600); }
    /* the curve's third point: high over the target, drawn out to the missile's own side of the fan */
    function aimP2(m) { m.P[2][0] = m.P[3][0] + m.fx; m.P[2][1] = m.P[3][1] + m.fy; m.P[2][2] = m.P[3][2] + m.over; }
    /* a new target for a missile whose own has gone: the nearest living monster near its aim, least loaded first; the
       curve restarts from where it is, along its present heading, so the turn is smooth */
    function retarget(m, L) { let best = null, bs = 1e9; const ax = m.P[3][0], ay = m.P[3][1];
      for (const q of L) { if (gone(q)) continue; const d = Math.hypot(q.x - ax, q.y - ay); if (d > tu.retarget) continue; const s = d + 1.2 * (load.get(q) || 0); if (s < bs) { bs = s; best = q; } }
      if (m.tg) load.set(m.tg, Math.max(0, (load.get(m.tg) || 1) - 1));
      if (!best) { m.tg = null; return false; }
      load.set(best, (load.get(best) || 0) + 1); m.tg = best; bezD(m.P, m.u, tmpD); const rem = Math.max(0.35, (1 - m.u) * m.dur);
      m.P[0][0] = m.x; m.P[0][1] = m.y; m.P[0][2] = m.z; for (let k = 0; k < 3; k++) m.P[1][k] = m.P[0][k] + tmpD[k] / m.dur * rem / 3;   // (the new curve leaves at the present velocity)
      m.P[3][0] = best.x; m.P[3][1] = best.y; m.P[3][2] = tu.hitZ + (best.z || 0); m.over = Math.max(0.6, Math.min(m.over, m.z * 0.7)); m.fx *= 0.4; m.fy *= 0.4; aimP2(m); m.dur = rem; m.t = 0; m.u = 0; return true; }
    function fizzle(m) { m.ex = 1; m.fz = 1; m.end = S.t; part(S, 7, m.x, m.y, m.z, 0, 0, 0, 0.2, 0.7, { fin: 0.01, a: 0.6 }); for (let k = 0; k < 3; k++) { const a = Math.random() * TAU; part(S, 5, m.x, m.y, m.z, Math.cos(a) * 2, Math.sin(a) * 2, rnd(-1, 2), 0.22, 0.35, { g: 5 }); } }
    function boom(m, L) { m.ex = 1; m.end = S.t; const x = m.x, y = m.y, z0 = Math.max(0, m.z), big = !LOW();
      // one damage event: the target (or, untargeted, whoever stands at the spot), then splash on the rest, the target excluded
      let prim = m.tg && !gone(m.tg) ? m.tg : null, n = 0;
      if (!prim) { let bd = 1e9; for (const q of L) { if (gone(q)) continue; const d = Math.hypot(q.x - x, q.y - y); if (d < (q.r || 0.4) + 0.35 && d < bd) { bd = d; prim = q; } } }
      if (S.alive) { if (prim) { try { ctx.hit(prim, dmg, { kb: tu.kb, src: 'strong', el: 'thunder' }); } catch (e) {} n++; }
        for (const q of L) { if (q === prim || gone(q)) continue; if (Math.hypot(q.x - x, q.y - y) < tu.splashR + (q.r || 0.4)) { try { ctx.hit(q, dmg * tu.splash, { kb: tu.kb * 0.5, src: 'strong', el: 'thunder', splash: true }); } catch (e) {} n++; } } }
      // a compact electric burst, branching sparks, a floor ring of light
      part(S, 3, x, y, z0 + 0.1, 0, 0, 0, 0.14, 1.5, { fin: 0.01 }); part(S, 7, x, y, z0 + 0.1, 0, 0, 0, 0.32, 2.2, { fin: 0.01, a: 0.75 });
      part(S, 4, x, y, 0.02, 0, 0, 0, 0.34, 0.5, { u: 1, flat: 1, grow: (tu.splashR * 2.2) / 0.5 - 1, fin: 0.01 }); part(S, 7, x, y, 0.02, 0, 0, 0, 0.4, 2.0, { u: 1, flat: 1, fin: 0.01, a: 0.4 });
      if (m.i % 3 === 0) part(S, 8, x, y, z0 + 0.2, 0, 0, 0, 0.2, 1.1, { fin: 0.01, a: 0.6 });
      for (let k = 0; k < (big ? 7 : 3); k++) { const a = Math.random() * TAU, v = rnd(2.5, 6); part(S, k % 4 === 3 ? 6 : 5, x, y, z0 + 0.15, Math.cos(a) * v, Math.sin(a) * v * 0.75, rnd(1, 4.5), rnd(0.22, 0.4), rnd(0.38, 0.55), { g: 9, drag: 1.5 }); }
      if (big) for (let k = 0; k < 3; k++) part(S, 0, x + rnd(-0.3, 0.3), y + rnd(-0.25, 0.25), z0 + rnd(0.1, 0.6), 0, 0, rnd(0.3, 1), rnd(0.16, 0.26), rnd(0.3, 0.45), { fin: 0.01, rot: Math.random() });
      const nz = big ? 2 : 1; for (let k = 0; k < nz; k++) { const a = Math.random() * TAU, r = rnd(0.55, 0.95); zap(S, x, y, z0 + 0.15, x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8, rnd(0, 0.5), 0.05, rnd(0.12, 0.18), { forks: k ? 0 : 1, gold: m.i % 4 === 1 && k === 1 }); }
      X.light && X.light(x, y, 1.4, 0.16);
      if (S.sndT <= 0) { S.sndT = 0.05; sfx(X, 'crack'); sfx(X, 'note', 120 + Math.random() * 40, 0.18, 'sine', 0.18, 60); if (n) sfx(X, 'hiss', 0.08, 0.06, 5200); }
      if (n && X.shake && !RM()) X.shake(1.4, 0.08); }
    const act = { update(dt) { t += dt; const p = pose(b);
        // the cannons: tilt up and brighten, hold through the volley, settle; the recoil springs back
        const tEnd = tu.tilt + (N - 1) * gap, set = t < tEnd + 0.06 ? sm(t / tu.tilt) : 1 - sm((t - tEnd - 0.06) / tu.settle);
        if (!act.dying && !sent && p) { p.cannonTilt = Math.max(0, set); p.charge = Math.max(p.charge || 0, 0.35 * set); p.glow = Math.max(0, Math.min(1, (p.glow || 0) * Math.exp(-dt * 3) + 0.25 * set)); for (const s of ['L', 'R']) p['recoil' + s] = (p['recoil' + s] || 0) * Math.exp(-dt * 16); }
        if (!act.dying) while (fired < N && t >= tu.tilt + fired * gap) fire(fired++);
        if (!sent && (act.dying || (fired >= N && t >= tEnd + 0.06 + tu.settle))) { sent = true; done(); }   // (20k9i relaxes the pose after done())
        if (!act.dying && t < tEnd && Math.random() < (LOW() ? 0.2 : 0.5)) { const mz = anchor(ctx, Math.random() < 0.5 ? 'muzzleL' : 'muzzleR'); part(S, 0, mz.x + rnd(-0.12, 0.12), mz.y + rnd(-0.1, 0.1), mz.z + rnd(-0.1, 0.1), 0, 0, 0.6, 0.14, 0.3, { fin: 0.01, rot: Math.random() }); }
        const L = ms.length ? mons(ctx, H) : null;
        for (let i = ms.length - 1; i >= 0; i--) { const m = ms[i];
          if (m.ex) { if (S.t - m.end > 0.3) { ms[i] = ms[ms.length - 1]; ms.pop(); MPOOL.push(m); } continue; }
          if (act.dying) { fizzle(m); continue; }
          m.t += dt; m.age = (m.age || 0) + dt;
          if (m.tg && gone(m.tg) && !retarget(m, L)) { fizzle(m); continue; }
          if (m.tg) { m.P[3][0] = m.tg.x; m.P[3][1] = m.tg.y; m.P[3][2] = tu.hitZ + (m.tg.z || 0); aimP2(m); }
          m.u = cl(m.t / m.dur); bez(m.P, m.u, tmp); m.x = tmp[0]; m.y = tmp[1]; m.z = tmp[2];
          bezD(m.P, Math.min(0.999, Math.max(0.001, m.u)), tmpD); const sx = tmpD[0], sy = tmpD[1] - tmpD[2] * (S.ZT / (S.T || 1)); m.ang = Math.atan2(sy, sx); m.left = sx < 0;
          m.trT -= dt; if (m.trT <= 0) { m.trT = 0.026; const q = m.tr.length >= 16 ? m.tr.pop() : [0, 0, 0, 0]; q[0] = m.x; q[1] = m.y; q[2] = m.z; q[3] = S.t; m.tr.unshift(q); }
          if (!m.whistle && m.u > 0.55 && tmpD[2] < 0) { m.whistle = 1; if (m.i % 3 === 0) sfx(X, 'note', 1900 + Math.random() * 300, 0.45, 'sine', 0.025, 700); }
          if (m.u >= 1 || m.age > tu.life) { if (m.u >= 1) boom(m, L); else fizzle(m); } }
        if (sent && !ms.length && fired >= (act.dying ? 0 : N)) act.dead = true; },
      cancel() { /* the form ended: nothing more leaves the barrels; missiles in the air fizzle out, harmless */ },
      under(c, B) { const T = S.T; if (LOW()) return; for (const m of ms) { if (m.ex) continue; const k = cl(1 - m.z / 4); if (k > 0.05) put(c, B, sprShadow(), H.sx(m.x), H.sy(m.y), T * 0.45, T * 0.22, 0.5 * k, 0, false); } c.setTransform(B); },
      over(c, B) { const T = S.T, ZT = S.ZT, mis = sprMissile(), fl = sprFlame(), glo = glowSprite(CYAN);
        // the barrels brighten while the volley lasts
        const tEnd = tu.tilt + (N - 1) * gap, br = act.dying ? 0 : sm(t / tu.tilt) * (1 - sm((t - tEnd) / 0.3));
        if (br > 0.02) for (const s of ['L', 'R']) { const mz = anchor(ctx, 'muzzle' + s), X0 = H.sx(mz.x), Y0 = H.sy(mz.y) - mz.z * ZT, k = petK(S, X0, Y0, 0.3); put(c, B, glo, X0, Y0, T * 0.9, T * 0.9, br * 0.7 * k * (0.8 + 0.2 * Math.sin(t * 40 + (s === 'L' ? 0 : 2))), 0, true); put(c, B, glowSprite(WHITE), X0, Y0, T * 0.35, T * 0.35, br * 0.8 * k, 0, true); }
        // trails: tapered, blue haze under cyan under a white core, in three chunks narrowing to the tail
        c.setTransform(B); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
        const LAY = LOW() ? [[BLUE, 1.6, 0.3], [ICE, 0.45, 0.9]] : [[BLUE, 1.9, 0.26], [CYAN, 0.8, 0.55], [WHITE, 0.32, 0.95]], TW = T * 0.13, NC = ms.length > 12 ? 2 : 3;   // (a crowded sky tapers in two steps: the stroke count stays near 120)
        for (const m of ms) { const n = m.tr.length; if (n < 2) continue; const fo = m.ex ? cl(1 - (S.t - m.end) / 0.3) : 1; if (fo <= 0.01) continue;
          const hx = H.sx(m.x) - Math.cos(m.ang) * T * 0.3, hy = H.sy(m.y) - m.z * ZT - Math.sin(m.ang) * T * 0.3, kp = petK(S, hx, hy, 0.25), age = S.t - m.tr[n - 1][3];
          for (const [col, wk, al] of LAY) { c.strokeStyle = col;
            for (let ch = 0; ch < NC; ch++) { const i0 = Math.floor(ch * (n - 1) / NC), i1 = Math.floor((ch + 1) * (n - 1) / NC); if (i1 <= i0) continue; const w = TW * wk * (1 - ch / (NC + 0.3)), aa = al * fo * kp * (1 - ch / (NC + 0.5)) * (ch === NC - 1 ? cl(1 - age / 0.5) * 0.8 + 0.2 : 1); if (aa < 0.02) continue;
              c.globalAlpha = aa > 1 ? 1 : aa; c.lineWidth = Math.max(0.5, w); c.beginPath(); if (ch === 0) c.moveTo(hx, hy); else c.moveTo(H.sx(m.tr[i0][0]), H.sy(m.tr[i0][1]) - m.tr[i0][2] * ZT);
              for (let j = i0 + (ch === 0 ? 0 : 1); j <= i1; j++) c.lineTo(H.sx(m.tr[j][0]), H.sy(m.tr[j][1]) - m.tr[j][2] * ZT); c.stroke(); } } }
        // the missiles: a glow, the flame, the body (flipped when it heads left so its light stays above)
        for (const m of ms) { if (m.ex) continue; const X0 = H.sx(m.x), Y0 = H.sy(m.y) - m.z * ZT, k = petK(S, X0, Y0, 0.35), L = T * 0.68, Wd = L * 36 / 112, ca = Math.cos(m.ang), sa = Math.sin(m.ang), ia = Math.min(1, m.age / 0.04);
          put(c, B, glo, X0 - ca * L * 0.05, Y0 - sa * L * 0.05, T * 0.8, T * 0.8, 0.42 * k * ia, 0, true);
          const fk = 0.85 + 0.3 * R1(Math.floor(S.t * 30) + m.i), FL = L * 0.62 * fk; c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.95 * k * ia; setT(c, B, X0 - ca * L * 0.3, Y0 - sa * L * 0.3, m.ang); c.drawImage(fl, -FL, -Wd * 0.38, FL, Wd * 0.76);
          c.globalCompositeOperation = 'source-over'; c.globalAlpha = (0.6 + 0.4 * k) * ia; setT(c, B, X0, Y0, m.ang, 1, m.left ? -1 : 1); c.drawImage(mis, -L * 0.5, -Wd / 2, L, Wd); }
        c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; },
      abort() { for (const m of ms) MPOOL.push(m); ms.length = 0; const p = pose(b); if (p) { p.cannonTilt = 0; p.recoilL = p.recoilR = 0; p.charge = 0; } } };
    S.acts.push(act);
  }

  /* ================= Heaven's Wrath ================= */
  function aimAngle(ctx) { try { const v = ctx.aimDir && ctx.aimDir(); if (v == null) return null; if (typeof v === 'number') return isFinite(v) ? v : null; if (Array.isArray(v)) return Math.hypot(v[0], v[1]) > 1e-4 ? Math.atan2(v[1], v[0]) : null; if (isFinite(v.a)) return v.a; if (isFinite(v.x) && Math.hypot(v.x, v.y) > 1e-4) return Math.atan2(v.y, v.x); } catch (e) {} return null; }
  /* monsters whose circle meets the oval (centre, rx along ang, ry across): one hit each, nothing behind a wall from the machine */
  function hitOval(ctx, H, X, b, cx, cy, rx, ry, ang, dmg, o) { const ca = Math.cos(ang), sa = Math.sin(ang); let n = 0;
    for (const m of mons(ctx, H)) { if (gone(m)) continue; const dx = m.x - cx, dy = m.y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca, r = m.r || 0.4;
      if ((u * u) / ((rx + r) * (rx + r)) + (v * v) / ((ry + r) * (ry + r)) >= 1) continue; if (wallBetween(X, b.x, b.y, m.x, m.y)) continue;
      try { ctx.hit(m, dmg, o); } catch (e) {} n++; } return n; }
  function wrath(ctx) {
    const E = setup(ctx), done = once(ctx); if (!E) { done(); return; }
    const { S, H, X, b, tier, DK } = E, tu = TUNE.wrath, NS = tu.strikes[tier], dmg = DK * tu.dmg;
    const wasC = b.contact; b.locked = true; b.contact = false; b.vx = 0; b.vy = 0; if (b.speed != null) b.speed = 0;
    let k = 0, t = 0, ph = 'lift', a0 = b.a || 0, aT = a0, finished = false; const hits = [];   // hits: per strike { t, cx, cy, ang, hx, hy, fil, cracks, n }
    const hand = i => (i % 2 ? 'L' : 'R'), D = i => (i ? tu.lift : tu.lift0);
    const oval = () => { const a = b.a || 0; return { cx: b.x + Math.cos(a) * tu.ahead * 1, cy: b.y + Math.sin(a) * tu.ahead, ang: a }; };
    sfx(X, 'note', 70, 0.5, 'sawtooth', 0.08, 110); sfx(X, 'hum');
    function impact() { const o = oval(), hd = hand(k), ha = anchor(ctx, 'hand' + hd), a = o.ang, ca = Math.cos(a), sa = Math.sin(a);
      // the hand's place on the floor (held to the oval's near half, so the eruption starts where the hand lands)
      let hx = ha.x, hy = ha.y; { const du = (hx - o.cx) * ca + (hy - o.cy) * sa, dv = -(hx - o.cx) * sa + (hy - o.cy) * ca, uu = Math.max(-tu.rx * 0.95, Math.min(0, du)), vv = Math.max(-tu.ry * 0.6, Math.min(tu.ry * 0.6, dv)); hx = o.cx + uu * ca - vv * sa; hy = o.cy + uu * sa + vv * ca; }
      a0 = a; aT = a; const n = S.alive ? hitOval(ctx, H, X, b, o.cx, o.cy, tu.rx, tu.ry, a, dmg, { kb: tu.kb, src: 'strong', el: 'thunder' }) : 0;
      // filaments: from the hand to points spread over the oval (golden-angle), each relayed through a nearer point, so
      // the lightning forms a branching net that reaches across the whole footprint; spectral fractures of light
      const NF = LOW() ? 7 : 13, fil = [], cracks = [];
      for (let i = 0; i < NF; i++) { const r = Math.sqrt((i + 0.6) / NF) * 0.96, th = i * 2.39996 + k * 0.7, u = Math.cos(th) * r * tu.rx, v = Math.sin(th) * r * tu.ry, x = o.cx + u * ca - v * sa, y = o.cy + u * sa + v * ca, d = Math.hypot(x - hx, y - hy);
        let px = hx, py = hy; if (fil.length && d > 1) { let bd = 1e9; for (const f of fil) { const dd = Math.hypot(f.x - x, f.y - y), dh = Math.hypot(f.x - hx, f.y - hy); if (dh < d * 0.8 && dd < bd) { bd = dd; px = f.x; py = f.y; } } }
        fil.push({ x, y, px, py, d: Math.hypot(x - hx, y - hy), s: Math.random() * 1000, gold: i % 5 === 2 }); }
      for (let i = 0; i < (LOW() ? 5 : 8); i++) { const th = (i + 0.5) / 8 * TAU + rnd(-0.3, 0.3), pts = [[hx, hy]]; let x = hx, y = hy, dir = th;
        const reach = () => { const du = (x - o.cx) * ca + (y - o.cy) * sa, dv = -(x - o.cx) * sa + (y - o.cy) * ca; return (du * du) / (tu.rx * tu.rx) + (dv * dv) / (tu.ry * tu.ry); };
        for (let j = 0; j < 6; j++) { dir += rnd(-0.55, 0.55); x += Math.cos(dir) * rnd(0.25, 0.42); y += Math.sin(dir) * rnd(0.25, 0.42); if (reach() > 0.92) break; pts.push([x, y]); } if (pts.length > 2) cracks.push(pts); }
      hits.push({ t: 0, cx: o.cx, cy: o.cy, ang: a, hx, hy, fil, cracks, n });
      // the flash: sparks, golden flashes, an oval shock, the shake
      const big = !LOW();
      part(S, 3, hx, hy, 0.25, 0, 0, 0, 0.12, 1.5, { fin: 0.01 }); part(S, 7, hx, hy, 0.2, 0, 0, 0, 0.35, 2.4, { fin: 0.01, a: 0.45 });
      for (let i = 0; i < (big ? 18 : 8); i++) { const f = fil[i % fil.length], a2 = Math.random() * TAU, v = rnd(2, 6); part(S, i % 4 === 0 ? 6 : 5, f.x, f.y, 0.1, Math.cos(a2) * v, Math.sin(a2) * v * 0.7, rnd(2, 6), rnd(0.25, 0.45), rnd(0.4, 0.6), { g: 10, drag: 1.4 }); }
      for (let i = 0; i < (big ? 5 : 2); i++) { const f = fil[(i * 3 + 1) % fil.length]; part(S, 8, f.x, f.y, 0.2, 0, 0, 0.5, rnd(0.18, 0.3), rnd(1.0, 1.5), { fin: 0.02, a: 0.75 }); part(S, 1, f.x, f.y, rnd(0.2, 0.5), 0, 0, 0.6, 0.22, rnd(0.5, 0.7), { fin: 0.01, rot: Math.random() }); }
      for (let i = 0; i < (big ? 6 : 3); i++) part(S, 2, hx + rnd(-0.4, 0.4), hy + rnd(-0.3, 0.3), 0.1, rnd(-1.5, 1.5), rnd(-1.2, 1.2), rnd(0.3, 1), rnd(0.5, 0.8), rnd(0.6, 0.9), { drag: 2.2, grow: 0.8, v: i % 3, rot: Math.random() * TAU, a: 0.45 });
      X.shake && X.shake(RM() ? 2.5 : 7, 0.24); X.flash && X.flash(RM() ? 0.06 : 0.12, '#DDF6FF'); X.hitstop && n && X.hitstop(0.05); X.light && X.light(o.cx, o.cy, 4, 0.45);
      sfx(X, 'note', 62, 0.55, 'sine', 0.6, 34); sfx(X, 'crash'); sfx(X, 'thud'); sfx(X, 'stomp'); sfx(X, 'crack'); sfx(X, 'hiss', 0.25, 0.12, 4200, 0.04); sfx(X, 'hiss', 0.12, 0.08, 6500, 0.11); sfx(X, 'note', 1600, 0.09, 'square', 0.03, 400, 0.07); sfx(X, 'note', 2400, 0.06, 'square', 0.02, 900, 0.15); }
    function setPose(dt) { const p = pose(b); if (!p) return; const hd = hand(k), oh = hd === 'L' ? 'R' : 'L', d = D(k);
      let raise = 0, slam = 0, dip = 0, crouch = 0.15, shud = 0;
      if (ph === 'lift') { const u = t / d; raise = eout(u); crouch = 0.15 + 0.15 * sm(u); dip = -0.0; }
      else if (ph === 'slam') { const u = t / tu.slam; raise = 1 - ein(u); slam = ein(u); dip = ein(u); crouch = 0.3 + 0.35 * u; }
      else { const u = t / tu.recoil; slam = 1 - sm(u * 1.15); dip = 1 - sm(u); crouch = 0.65 * (1 - sm(u)) + 0.15; shud = 0.6 * (1 - u); }
      p['arm' + hd + 'Raise'] = raise; p['arm' + hd + 'Slam'] = slam; p['arm' + oh + 'Raise'] = 0; p['arm' + oh + 'Slam'] = (p['arm' + oh + 'Slam'] || 0) * Math.exp(-dt * 10);
      p.torsoDip = Math.max(0, dip); p.crouch = crouch; p.shudder = shud; p.glow = Math.max(0.35, Math.min(1, ph === 'lift' ? 0.4 + 0.6 * sm(t / d) : 1 - 0.5 * (ph === 'recoil' ? t / tu.recoil : 0))); p.charge = ph === 'lift' ? 0.6 * sm(t / d) : ph === 'slam' ? 0.7 : 0.3 * (1 - t / tu.recoil); }
    function clearPose() { const p = pose(b); if (!p) return; for (const s of ['L', 'R']) { p['arm' + s + 'Raise'] = 0; p['arm' + s + 'Slam'] = 0; } p.torsoDip = 0; p.crouch = 0; p.shudder = 0; p.charge = 0; p.glow = 0; }
    function finish() { if (finished) return; finished = true; b.locked = false; b.contact = wasC == null ? true : wasC; done(); }
    const act = { update(dt) {
        for (let i = hits.length - 1; i >= 0; i--) { hits[i].t += dt; if (hits[i].t > 1.0) hits.splice(i, 1); }
        if (act.dying) { if (!finished) { finished = true; b.locked = false; b.contact = wasC == null ? true : wasC; done(); } if (!hits.length) act.dead = true; return; }
        if (finished) { if (!hits.length) act.dead = true; return; }
        t += dt; b.vx = 0; b.vy = 0;
        // aim: between strikes (the recoil before another, and the lift after the first), turn toward the aim, bounded
        if (k > 0 && ph === 'lift' || (ph === 'recoil' && k < NS - 1)) { const want = aimAngle(ctx); if (want != null) { const lim = wrapA(want - a0); aT = a0 + Math.max(-tu.maxTurn, Math.min(tu.maxTurn, lim)); }
          const d = wrapA(aT - (b.a || 0)), st2 = tu.turnRate * dt; b.a = (b.a || 0) + Math.max(-st2, Math.min(st2, d)); }
        if (ph === 'lift') { const d = D(k), u = t / d, ha = anchor(ctx, 'hand' + hand(k));
          if (Math.random() < (LOW() ? 0.25 : 0.6) * (0.4 + u)) { const a = Math.random() * TAU, r = rnd(0.3, 0.6); zap(S, ha.x, ha.y, ha.z, ha.x + Math.cos(a) * r, ha.y + Math.sin(a) * r * 0.6, ha.z + rnd(-0.3, 0.4), 0.035, 0.08, { forks: 0 }); }
          if (Math.random() < 0.8) { const a = Math.random() * TAU, r = rnd(0.6, 1.1); part(S, 0, ha.x + Math.cos(a) * r, ha.y + Math.sin(a) * r * 0.7, ha.z + rnd(-0.3, 0.5), -Math.cos(a) * r * 4, -Math.sin(a) * r * 3, 0, 0.2, rnd(0.25, 0.4), { fin: 0.03, rot: Math.random() }); }
          if (t >= d) { t -= d; ph = 'slam'; sfx(X, 'whoosh'); sfx(X, 'note', 180, 0.12, 'sawtooth', 0.06, 90); } }
        else if (ph === 'slam') { if (t >= tu.slam) { t -= tu.slam; ph = 'recoil'; impact(); } }
        else if (t >= tu.recoil) { t -= tu.recoil; k++; if (k >= NS) { finish(); } else { ph = 'lift'; sfx(X, 'note', 90, 0.25, 'triangle', 0.08, 140); } }
        if (!finished) setPose(dt); },
      cancel() {},
      /* the floor: the telegraph (from the lift on), the fill at impact, the fractures, the shock rim (light only) */
      under(c, B) { const T = S.T, tele = sprRing('tele'), fill = sprRing('fill'), rim = sprRing('rim');
        const ovalAt = (img, cx, cy, ang, kx, ky, a) => { if (!(a > 0.01)) return; c.globalCompositeOperation = 'lighter'; c.globalAlpha = a > 1 ? 1 : a; setT(c, B, H.sx(cx), H.sy(cy), ang, tu.rx * T * kx, tu.ry * T * ky); c.drawImage(img, -1, -1, 2, 2); };
        if (!finished && !act.dying) { const o = oval(), d = D(k), u = ph === 'lift' ? t / d : ph === 'slam' ? 1 : 0;
          if (ph !== 'recoil') { const a = sm(u * 1.6) * (0.75 + 0.25 * Math.sin(S.t * 22)); ovalAt(tele, o.cx, o.cy, o.ang, 1, 1, a); ovalAt(fill, o.cx, o.cy, o.ang, 1, 1, 0.12 * sm(u) + (ph === 'slam' ? 0.15 : 0));
            const sw = 1 - (u * 1.3 % 1); ovalAt(rim, o.cx, o.cy, o.ang, sw * 1.05, sw * 1.05, 0.35 * sm(u * 3) * (1 - sw * 0.5)); }
          else if (k < NS - 1) { const o2 = oval(); ovalAt(tele, o2.cx, o2.cy, o2.ang, 1, 1, 0.3 * sm(t / tu.recoil)); } }
        for (const h of hits) { const u = h.t; ovalAt(fill, h.cx, h.cy, h.ang, 1, 1, u < 0.04 ? u / 0.04 * 0.5 : 0.5 * (1 - sm((u - 0.04) / 0.35)));
          ovalAt(tele, h.cx, h.cy, h.ang, 1, 1, 0.9 * (1 - sm(u / 0.5)));
          const su = eout(u / 0.32); ovalAt(rim, h.cx, h.cy, h.ang, 0.25 + 0.85 * su, 0.25 + 0.85 * su, (1 - sm(u / 0.4)) * 0.95);
          // spectral fractures: violet haze under an ice-white thread, fading (no dark marks)
          const fa = 1 - sm((u - 0.15) / 0.8); if (fa > 0.02) { c.setTransform(B); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.lineJoin = 'round';
            for (const [col, w, al] of [[VIOLET, 0.09, 0.35], [CYAN, 0.04, 0.55], [ICE, 0.016, 0.9]]) { c.strokeStyle = col; c.lineWidth = Math.max(0.6, w * T); c.globalAlpha = al * fa; c.beginPath();
              for (const pts of h.cracks) { const g = Math.min(pts.length, 1 + Math.floor(pts.length * cl(u / 0.12))); c.moveTo(H.sx(pts[0][0]), H.sy(pts[0][1])); for (let i = 1; i < g; i++) c.lineTo(H.sx(pts[i][0]), H.sy(pts[i][1])); } c.stroke(); } }
          put(c, B, glowSprite(BLUE), H.sx(h.hx), H.sy(h.hy), T * 3.2, T * 1.8, 0.6 * (1 - sm(u / 0.6)), 0, true); }
        c.setTransform(B); },
      /* above: the filaments racing out over the oval, crackling while they last */
      over(c, B) { if (!hits.length || typeof TK === 'undefined') return; const T = S.T, K = TK.bind(H); c.setTransform(B);
        for (const h of hits) { const u = h.t; if (u > 0.5) continue; const front = eout(u / 0.12) * 4.2, fa = 1 - sm((u - 0.18) / 0.32);
          for (const f of h.fil) { if (f.d > front + 0.2) continue; const ia = cl((front - f.d) / 0.6 + 0.3), a = fa * ia; if (a < 0.03) continue;
            const X0 = H.sx(f.px), Y0 = H.sy(f.py) - 0.05 * S.ZT, X1 = H.sx(f.x), Y1 = H.sy(f.y) - 0.05 * S.ZT, L = Math.hypot(X1 - X0, Y1 - Y0);
            K.arc(c, X0, Y0, X1, Y1, Math.floor(S.t * 24) + f.s, Math.max(1, T * (u < 0.08 ? 0.07 : 0.05)), a, { forks: LOW() ? 0 : 1, gold: f.gold, jit: L * 0.2 });
            if (u < 0.3 && !LOW()) { const pr = 0.4 * (1 - u / 0.3); put(c, B, glowSprite(f.gold ? GOLD : CYAN), X1, Y1, T * 0.9, T * 0.9, pr * a, 0, true); } }
          if (u < 0.22) { const X0 = H.sx(h.hx), Y0 = H.sy(h.hy); K.arc(c, X0, Y0 - T * 2.4, X0, Y0, Math.floor(S.t * 30) + 7, Math.max(1, T * 0.06), (1 - u / 0.22) * 0.8 * petK(S, X0, Y0 - T, 0.2), { forks: LOW() ? 0 : 2 }); c.setTransform(B); } }
        c.setTransform(B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; },
      abort() { if (!finished) { finished = true; clearPose(); b.locked = false; b.contact = wasC == null ? true : wasC; } } };
    S.acts.push(act);
  }

  BM.missiles = missiles;
  BM.wrath = wrath;
  BM.__dbgS = { TUNE, BAKE, sprMissile, sprFlame, sprRing, hitOval, anchor };
})();
