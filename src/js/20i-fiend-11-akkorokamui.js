/* ---------- AKKOROKAMUI, Sovereign of the Dune Sea ----------
   A kraken the size of a harbour, orange as a desert noon, asleep under a desert that used to be a sea: the giant
   squid of the lower floors grown huge. Under the sand only its two great eyes show; risen, it stands out of the dunes
   on a tall speckled mantle with fins like an arrowhead, two great round eyes over a crown of eight thick arms, a siphon
   at each side and two long feeding tentacles held high. Its arena is the drowned city: rooftops and broken towers in a
   basin of sand, three bedrock terraces joined to a raised central terrace by stone causeways. Its arms share its
   health, but the arms that anchor it to the ruins each carry a stagger meter: break two anchors and its body heaves up,
   siphons bare (phase 1), or it reels, stunned (later). Phase 1, Something Beneath Your Feet: it stays buried while two
   arms hunt; a widening mound means an eruption, a long moving crease means a sweep. Phase 2, The Buried City Rises: it
   surfaces by the central ruins, fires Sandjet across the basin (its siphon turns first) and spits binding ink that
   slows you, but an arm slamming into ink sticks, and a stuck arm staggers twice as fast. Phase 3, The Desert Opens Its
   Mouth: its skin cracks over furnace flesh, hot sand spills in burning trails, and a current drags you toward the
   beak; The World Below pulls harder and then collapses the dunes: stand on the central terrace, or break two taut
   anchors to interrupt it for the fight's biggest opening. Painted with the toon kit: flat colour, hard bands, ink
   outlines, as if it swam out of a cartoon. */
FIEND_DEFS.akkorokamui = (() => {
  const TAU = Math.PI * 2, TN = FiendToon, NARM = 8;
  const COPPER = '#D4783A', COPPER_HI = '#F2B27A', COPPER_SH = '#A24E24', BELLY = '#F6D2A6', GOLD = '#F2C94C', GOLD_SH = '#B8891A', LINE = '#4A2210', SAND = '#E8C47C', SAND_DK = '#C99A4E', STONE = '#9C8A6A', INK = '#1A1222', AMBER = '#F2A51F', HOT = '#FF7A2A';
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ruinAt(C, i) { const a = i / 6 * TAU + 0.35; return { x: C.x + Math.cos(a) * 10.2, y: C.y + Math.sin(a) * 10.2 }; }
  function terrAt(C, i) { const a = Math.PI / 2 + i * TAU / 3; return { x: C.x + Math.cos(a) * 7.2, y: C.y + Math.sin(a) * 7.2 }; }
  const bodyAt = C => ({ x: C.x, y: C.y - 4.6 });   // the mantle lies north of the central terrace
  const OR = '#F28A2E', OR_SH = '#C9601C', OR_SH2 = '#A5481A', OR_HI = '#FFC27A', OR_LN = '#4A1A06', OR_BEL = '#FFDDB0', OR_BEL_SH = '#F2AE6C', SPOT = '#B04C16', CUP = '#FFEBD0', CUP_RING = '#9A4416', IRIS = '#3446A8', FIN = '#F7A14C';
  const HZ = 1.75, MANT = 5.4;   // the head's height over the sand when surfaced; the mantle's length above it
  // the head's centre and the arm crown, a little ahead of the body's own point, so the eyes look out where the weak point is
  const headU = 1.0, crownU = 1.6;
  function onTerrace(FX, x, y) { return Math.hypot(x - FX.C.x, y - FX.C.y) < 3.1 || [0, 1, 2].some(i => { const t = terrAt(FX.C, i); return Math.hypot(x - t.x, y - t.y) < 2.3; }); }
  return {
    arenaR: 15.5, firstAct: 'lurk', artY: 0.62, ambient: 'sand',
    artPoses: [{ name: 'buried: eyes in the sand', mem: { demoBuried: 1 } }, { name: 'surfacing', mem: { demoBuried: 0.35, demoRise: 1 } }, { name: 'surfaced, arms anchored', mem: { demoBuried: 0, demoAnchor: 1 } },
      { name: 'arm raised to slam', mem: { demoBuried: 0, demoSlam: 1 } }, { name: 'Sandjet', mem: { demoBuried: 0, demoJet: 1 } }, { name: 'The Desert Opens Its Mouth', mem: { demoBuried: 0, demoFurnace: 1, demoAnchor: 1 } }],
    phaseNames: ['Something Beneath Your Feet', 'The Buried City Rises', 'The Desert Opens Its Mouth'],
    carve(set, C) { const b = bodyAt(C); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 0; dy++) set(Math.floor(b.x + dx), Math.floor(b.y - 2 + dy), T_SOLID); for (let i = 0; i < 6; i++) { const r = ruinAt(C, i); set(Math.floor(r.x), Math.floor(r.y), T_SOLID); } },
    props(C) { const out = []; for (let i = 0; i < 6; i++) out.push(Object.assign({ kind: 'ruin', i, h: 2.6 + (i % 3) * 0.7, seed: 31 + i }, ruinAt(C, i))); out.push({ kind: 'ruin', i: 9, big: true, h: 4.2, seed: 77, x: bodyAt(C).x, y: bodyAt(C).y - 2.2 }); return out; },
    /* ---- the basin: wind-rippled sand, the rooftops of the drowned city, bedrock terraces and their causeways ---- */
    paintGround(c, A) {
      const R = A.R, rnd = A.rnd, Cx = 0, Cy = 0;
      let g = c.createRadialGradient(0, 0, R * 0.2, 0, 0, R + 1.4); g.addColorStop(0, '#EBC98A'); g.addColorStop(0.75, '#DDB46C'); g.addColorStop(0.95, '#C49A52'); g.addColorStop(1, 'rgba(180,140,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, R + 1.4, 0, TAU); c.fill();
      // dune ripples: long soft arcs with a hard cartoon shadow line
      c.lineCap = 'round'; for (let i = 0; i < 60; i++) { const a = rnd() * TAU, d = Math.sqrt(rnd()) * R, x = Math.cos(a) * d, y = Math.sin(a) * d, L = 1.5 + rnd() * 3, bow = (rnd() - 0.5) * 1.2; c.strokeStyle = 'rgba(255,240,200,.5)'; c.lineWidth = 0.14; c.beginPath(); c.moveTo(x - L, y); c.quadraticCurveTo(x, y + bow, x + L, y); c.stroke(); c.strokeStyle = 'rgba(150,100,40,.28)'; c.lineWidth = 0.1; c.beginPath(); c.moveTo(x - L, y + 0.22); c.quadraticCurveTo(x, y + bow + 0.22, x + L, y + 0.22); c.stroke(); }
      // drowned rooftops: flat sandstone slabs half under the sand, with a shadow edge and a dark window or two
      for (let i = 0; i < 22; i++) { const a = rnd() * TAU, d = 3.5 + Math.sqrt(rnd()) * (R - 5), x = Math.cos(a) * d, y = Math.sin(a) * d, w = 1.2 + rnd() * 1.8, h = 0.8 + rnd() * 1.2, rot = rnd() * 0.6 - 0.3; c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = 'rgba(120,80,40,.35)'; c.fillRect(-w / 2 + 0.25, -h / 2 + 0.3, w, h); c.fillStyle = i % 3 ? '#B9A07A' : '#A88E68'; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#D8C49C'; c.fillRect(-w / 2, -h / 2, w, 0.22); c.fillStyle = '#3A2A1E'; if (w > 1.8) { c.fillRect(-w * 0.25, -h * 0.1, 0.3, 0.4); c.fillRect(w * 0.1, -h * 0.1, 0.3, 0.4); } c.strokeStyle = 'rgba(60,40,20,.5)'; c.lineWidth = 0.08; c.strokeRect(-w / 2, -h / 2, w, h); c.restore(); }
      // bedrock terraces and causeways: dark compact stone the sand cannot swallow
      const terr = (x, y, r) => { c.fillStyle = 'rgba(70,50,30,.35)'; c.beginPath(); c.ellipse(x + 0.2, y + 0.3, r, r * 0.92, 0, 0, TAU); c.fill(); c.fillStyle = '#8A7858'; c.beginPath(); c.ellipse(x, y, r, r * 0.92, 0, 0, TAU); c.fill(); c.fillStyle = '#A08C68'; c.beginPath(); c.ellipse(x, y - 0.15, r * 0.92, r * 0.8, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(50,34,18,.6)'; c.lineWidth = 0.1; c.beginPath(); c.ellipse(x, y, r, r * 0.92, 0, 0, TAU); c.stroke(); for (let k = 0; k < 6; k++) { const aa = rnd() * TAU, dd = rnd() * r * 0.7; c.strokeStyle = 'rgba(50,34,18,.35)'; c.beginPath(); c.moveTo(x + Math.cos(aa) * dd, y + Math.sin(aa) * dd); c.lineTo(x + Math.cos(aa) * dd + 0.5, y + Math.sin(aa) * dd + 0.2); c.stroke(); } };
      for (let i = 0; i < 3; i++) { const t = terrAt({ x: Cx, y: Cy }, i); c.strokeStyle = '#8A7858'; c.lineWidth = 1.5; c.lineCap = 'butt'; c.beginPath(); c.moveTo(0, 0); c.lineTo(t.x, t.y); c.stroke(); c.strokeStyle = 'rgba(50,34,18,.4)'; c.lineWidth = 0.1; for (let k = 1; k < 7; k++) { const u = k / 7, px = t.x * u, py = t.y * u, nx = -t.y / 7.2, ny = t.x / 7.2; c.beginPath(); c.moveTo(px - nx * 0.75, py - ny * 0.75); c.lineTo(px + nx * 0.75, py + ny * 0.75); c.stroke(); } terr(t.x, t.y, 2.3); }
      terr(0, 0, 3.1); c.fillStyle = 'rgba(255,230,170,.35)'; c.beginPath(); c.arc(0, 0, 1.4, 0, TAU); c.fill(); c.strokeStyle = 'rgba(50,34,18,.5)'; c.lineWidth = 0.1; c.beginPath(); c.arc(0, 0, 1.4, 0, TAU); c.stroke(); for (let k = 0; k < 8; k++) { const aa = k / 8 * TAU; c.beginPath(); c.moveTo(Math.cos(aa) * 1.4, Math.sin(aa) * 1.4); c.lineTo(Math.cos(aa) * 2.6, Math.sin(aa) * 2.6); c.stroke(); }
      // the dried shoreline: a ring of pale salt at the edge, with shells and bones
      c.strokeStyle = 'rgba(255,255,240,.45)'; c.lineWidth = 0.5; c.beginPath(); c.arc(0, 0, R - 0.6, 0, TAU); c.stroke(); c.fillStyle = '#F4EEDC'; for (let i = 0; i < 24; i++) { const a = rnd() * TAU, d = R - 1 - rnd() * 2; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d, 0.12 + rnd() * 0.1, 0, TAU); c.fill(); }
      c.strokeStyle = 'rgba(120,80,40,.7)'; c.lineWidth = 1.0; c.beginPath(); c.arc(0, 0, R + 0.4, 0, TAU); c.stroke();
    },
    /* ---- the sky: a white desert noon, heat shimmer, far dunes in flat cartoon bands, a slow sand haze ---- */
    sky(c, W, H, t, cam, T) {
      const px = (cam.x - 28) * T;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5FB3E6'); g.addColorStop(0.45, '#BFE3F4'); g.addColorStop(0.62, '#F6E2B8'); g.addColorStop(1, '#D9B06A'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#FFF6D8'; c.beginPath(); c.arc(W * 0.72 - px * 0.02, H * 0.2, 46, 0, TAU); c.fill(); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite('#FFE9A8'), W * 0.72 - px * 0.02 - 140, H * 0.2 - 140, 280, 280); c.restore();
      // far dunes: three flat bands, each with a hard crest highlight
      [['#E2BE7C', 0.58, 90], ['#D4A95E', 0.66, 140], ['#C6964A', 0.75, 200]].forEach(([col, yy, per], i) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W + 10; x += 10) c.lineTo(x, H * yy + Math.sin((x + px * (0.06 + i * 0.04)) / per * TAU) * (18 + i * 8) + Math.sin((x - px * 0.03) / (per * 0.37)) * 6); c.lineTo(W, H); c.closePath(); c.fill(); c.strokeStyle = 'rgba(255,245,210,.55)'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= W + 10; x += 10) { const y = H * yy + Math.sin((x + px * (0.06 + i * 0.04)) / per * TAU) * (18 + i * 8) + Math.sin((x - px * 0.03) / (per * 0.37)) * 6; x ? c.lineTo(x, y - 2) : c.moveTo(x, y - 2); } c.stroke(); });
      // heat shimmer and blown sand
      c.save(); c.globalAlpha = 0.35; c.strokeStyle = '#FFFFFF'; c.lineWidth = 1.5; for (let i = 0; i < 6; i++) { const y = H * (0.5 + i * 0.03) + Math.sin(t * 2 + i) * 3; c.beginPath(); for (let x = 0; x <= W; x += 8) { const yy = y + Math.sin(x / 18 + t * 6 + i) * 1.5; x ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.stroke(); } c.restore();
      c.save(); c.globalAlpha = 0.5; c.strokeStyle = '#F4DCA0'; c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 14; i++) { const x = ((i * 97 + t * (140 + (i % 3) * 60)) % (W + 120)) - 60, y = H * 0.55 + (i * 53 % Math.round(H * 0.4)); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30 + (i % 3) * 12, y + 2); c.stroke(); } c.restore();
    },
    overlay(c, FX, t, T) {
      const M = FX.mem, m = FX.m; if (!m) return;
      // the pull toward the beak: streaks of sand flowing inward
      if (M.pull > 0) { const B = m, X = FX.sx(B.x), Y = FX.sy(B.y); c.save(); c.globalAlpha = 0.35 * Math.min(1, M.pull); c.strokeStyle = '#FFF0C8'; c.lineWidth = 2; c.lineCap = 'round'; for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + t * 0.3, d = ((i * 37 - t * 160 * M.pull) % 600 + 600) % 600 + 60; c.beginPath(); c.moveTo(X + Math.cos(a) * d, Y + Math.sin(a) * d * 0.7); c.lineTo(X + Math.cos(a + 0.03) * (d - 26), Y + Math.sin(a + 0.03) * (d - 26) * 0.7); c.stroke(); } c.restore(); }
      // (in the last stage the heat is in the kraken itself: its cracked skin, its embers)
    },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m, C = FX.C, B = bodyAt(C); m.x = B.x; m.y = B.y; m.noTouch = true; m.touchK = 0.7;
      Object.assign(M, { ang: Math.PI / 2, buried: 1, rise: 0, blink: 0, blinkT: 2, atkT: 2.5, hunting: 0, broken: [], brokenT: [], anchorT: 0, stag: {}, bursts: [], sweeps: [], jetT: 8, inkT: 5, ultT: 20, pull: 0, furnace: 0, look: [0, 0], hunger: 0 });
      ensure(M);
      setAnchors(FX, 4);
    },
    phase(FX, p, lv) {
      const M = FX.mem, H = FX.H, m = FX.m; M.atkT = 1.5;
      if (lv >= 2 && M.buried > 0) { M.surfaceT = 1e9; M.rising = true; H.banner('THE BURIED CITY RISES', 'It wraps the central ruins. Its siphon turns before a Sandjet; ink binds the sand, and binds any arm that slams into it', GOLD, 3, true); H.shake(14, 0.6); }
      if (lv >= 3) { M.furnace = 1; H.banner('THE DESERT OPENS ITS MOUTH', 'The armour cracks. Hot sand spills, and the dunes flow toward its beak', HOT, 3, true); setAnchors(FX, 4); }
    },
    ai(FX, m, dt) {
      const M = FX.mem, me = FX.me, lv = FX.S.lv, k = 1 / FX.S.fast, d = FX.dist(m.x, m.y);
      m.actT += dt; M.atkT -= dt; M.anchorT -= dt; M.blinkT -= dt; M.jetT -= dt; M.inkT -= dt; if (lv >= 3) M.ultT -= dt;
      // surfacing and burying
      if (M.rising) { M.buried = Math.max(0, M.buried - dt * 0.45); M.rise = Math.min(1, M.rise + dt * 0.5); if (M.buried <= 0) { M.rising = false; FX.untarget(false); m.noTouch = lv < 2; } }
      else if (M.surfaceT > 0 && M.surfaceT < 1e8) { M.surfaceT -= dt; if (M.surfaceT <= 0 && lv < 2) { M.sinking = true; FX.weak('siphon', 0, 0, 0, 0, false); } }
      if (M.sinking) { M.buried = Math.min(1, M.buried + dt * 0.5); M.rise = Math.max(0, M.rise - dt); if (M.buried >= 1) { M.sinking = false; FX.untarget(true); m.noTouch = true; } }
      if (M.buried >= 1 && !m.under) FX.untarget(true);
      // the eyes follow the pet and blink
      if (M.blinkT <= 0) { M.blink = 1; M.blinkT = 2.5 + Math.random() * 3; } M.blink = Math.max(0, M.blink - dt * 5);
      const la = Math.atan2(me.y - m.y, me.x - m.x); M.look = [lerp(M.look[0], Math.cos(la), dt * 4), lerp(M.look[1], Math.sin(la), dt * 4)];
      // the siphons and body as hit parts when surfaced
      if (M.buried < 0.5) { const sp = sidePts(FX, m, M); FX.parts([{ key: 'mantle', dx: 0, dy: -0.6, r: 2.6 }, { key: 'sipL', dx: sp[0].x - m.x, dy: sp[0].y - m.y, r: 1.0 }, { key: 'sipR', dx: sp[1].x - m.x, dy: sp[1].y - m.y, r: 1.0 }]); if (M.surfaceT > 0 && M.surfaceT < 1e8) { const w = sp[FX.me.x < m.x ? 0 : 1]; FX.weak('siphon', w.x, w.y, 1.1, 2.6, true); } }
      // anchors re-grip after a while
      if (M.anchorT <= 0) { M.anchorT = 6 * k; setAnchors(FX, lv >= 3 ? 4 : lv >= 2 ? 3 : 4); }
      // the pull of phase 3
      if (lv >= 3 && !m.stunT) { const want = M.ult ? 2.3 : 0.75; M.pull = lerp(M.pull, want, dt * 2); const dx = m.x - me.x, dy = m.y - me.y, dd = Math.hypot(dx, dy) || 1; if (dd > 2.2 && !onTerrace(FX, me.x, me.y)) FX.push(dx / dd * M.pull * dt * FX.S.fast, dy / dd * M.pull * dt * FX.S.fast); } else M.pull = Math.max(0, M.pull - dt * 2);
      // the beak beneath the mantle bites what the current brings
      if (lv >= 3 && d < 2.4 && !(M.biteCd > 0)) { M.biteCd = 1.6; M.hunger = 1; FX.hurt(m.dmg * 1.6); FX.H.text(me.x, me.y - 1.2, 'THE BEAK!', HOT, 16); me.push = { vx: Math.cos(la) * 11, vy: Math.sin(la) * 11, t: 0.3 }; } M.biteCd = (M.biteCd || 0) - dt; M.hunger = Math.max(0, M.hunger - dt * 2);
      // choose
      if (M.ult) { runUlt(FX, m, dt); }
      else if (lv >= 3 && M.ultT <= 0 && !M.rising) { startUlt(FX, m); }
      else if (M.atkT <= 0 && !M.rising && !M.sinking) {
        M.atkT = (lv >= 3 ? 1.9 : lv >= 2 ? 2.3 : 2.8) * k;
        const hunting = M.arms.filter(A => A.role === 'slam' || A.role === 'sweep').length;
        if (lv >= 2 && M.jetT <= 0) { M.jetT = 11 * k; sandjet(FX, m); }
        else if (lv >= 2 && M.inkT <= 0) { M.inkT = 9 * k; ink(FX, m); }
        else if (hunting < 2) { if (Math.random() < 0.55) eruption(FX, m, lv); else sweep(FX, m, lv); }
      }
      stepArms(FX, m, M, dt);
      hitProxies(FX, m, M);
    },
    stunned(FX, m, dt) { const M = FX.mem; M.reel = 1; stepArms(FX, m, M, dt); const sp = sidePts(FX, m, M); FX.weak('siphon', sp[FX.me.x < m.x ? 0 : 1].x, sp[FX.me.x < m.x ? 0 : 1].y, 1.2, 3, m.stunT > 0.05); if (m.stunT <= 0.05) M.reel = 0; },
    update(FX, dt) { const M = FX.mem; M.bursts = M.bursts.filter(b => (b.t += dt) < 1.4); M.sweeps = M.sweeps.filter(b => (b.t += dt) < 1.6); squidAir(FX, dt); },
    dmgK(FX, m, o) { return FX.mem.buried > 0.5 ? 0.8 : 1; },
    onWeakHit(FX, key, dmg) { if (key === 'siphon') FX.mem.sipHit = 1; },
    // the kraken is kept as a picture, painted a third a frame; the ruins are pictures too, their glow when gripped live
    keep: { steps: 3, sig: FX => `${FX.mem.furnace ? 1 : 0}` },
    draw(c, FX, m, X, Y, T, t, step) { drawSquid(c, FX, m, X, Y, T, t, step); },
    propKeep: { every: 30, box: p => [p.big ? -2.7 : -1.8, -(p.h + 1.4), p.big ? 2.7 : 1.8, 0.9] },
    drawProp(c, FX, p, X, Y, T, t) { drawRuin(c, FX, p, X, Y, T, t); },
    drawPropLive(c, FX, p, X, Y, T, t) { const anchored = (FX.mem.arms || []).some(A => A.role === 'anchor' && A.anchor === p.i); if (!anchored) return; const h = T * p.h, w = T * (p.big ? 2.2 : 1.3); c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.1 * Math.sin(t * 5); blitSized(c, glowSprite(GOLD), X - w * 1.4, Y - h * 0.6 - w, w * 2.8, w * 2.4); c.restore(); },
    drawObj(c, FX, o, X, Y, T, t) {
      if (o.kind === 'anchor') { const M = FX.mem, A = M.arms[o.arm], k = A ? (M.stag[o.arm] || 0) : 0; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.2 * Math.sin(t * 6); blitSized(c, glowSprite(k > 0.6 ? HOT : GOLD), X - T * 1.6, Y - T * 1.4, T * 3.2, T * 2.4); c.restore(); }
      if (o.kind === 'inkslam') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.2 * Math.sin(t * 8); blitSized(c, glowSprite(AMBER), X - T * 1.4, Y - T * 1.2, T * 2.8, T * 2.2); c.restore(); }
    },
    drawFx(c, FX, T, t) {
      const M = FX.mem, m = FX.m; if (!m || m.dead) return;
      // sand thrown up where an arm struck
      M.bursts.forEach(b => { const u = b.t / 1.4, X2 = FX.sx(b.x), Y2 = FX.sy(b.y); c.save(); c.globalAlpha = 1 - u; c.fillStyle = SAND; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + b.x, d = T * (1 + u * 3), r = T * (0.35 - u * 0.2); c.beginPath(); c.arc(X2 + Math.cos(a) * d, Y2 + Math.sin(a) * d * 0.6 - u * T * 2 + u * u * T * 3, Math.max(0.5, r), 0, TAU); c.fill(); } c.restore(); });
      // stagger meters over the anchors
      M.arms.forEach(A => { if (A.role !== 'anchor' && A.role !== 'stuck') return; const k = M.stag[A.i] || 0; if (k <= 0.02) return; FiendBeast.meter(c, FX.sx(A.x), FX.sy(A.y) - T * 1.5, T * 1.5, k, A.role === 'stuck' ? AMBER : GOLD, A.role === 'stuck' ? 'STUCK' : 'ANCHOR'); });
    },
  };
  /* ---- arms: roles, anchors, stagger ---- */
  function setAnchors(FX, n) {
    const M = FX.mem, C = FX.C, m = FX.m, free = M.arms.filter(A => A.role === 'idle'), taken = new Set(M.arms.filter(A => A.role === 'anchor').map(A => A.anchor));
    let have = M.arms.filter(A => A.role === 'anchor').length;
    const ruins = [0, 1, 2, 3, 4, 5].filter(i => !taken.has(i)).sort((a, b) => Math.random() - 0.5);
    for (const A of free) { if (have >= n || !ruins.length) break; const ri = ruins.pop(), r = ruinAt(C, ri); A.role = 'anchor'; A.anchor = ri; A.tx = r.x; A.ty = r.y; A.tz = 0.6; M.stag[A.i] = 0; have++;
      if (A.obj && !A.obj.dead) A.obj.dead = true;
      A.obj = FX.obj({ kind: 'anchor', arm: A.i, x: r.x, y: r.y + 0.6, r: 1.25, hp: 1e12, forward: 1, front: true, onHit: (ob, dmg, o) => anchorHit(FX, A, dmg, o) }); }
  }
  function anchorHit(FX, A, dmg, o) {
    const M = FX.mem, S = FX.S, m = FX.m, el = o && o.el, k = (A.role === 'stuck' ? 2 : 1) * (el === 'water' || el === 'ice' ? 1.5 : 1);
    M.stag[A.i] = Math.min(1, (M.stag[A.i] || 0) + dmg / (S.barHP * 0.09) * k);
    if (M.stag[A.i] >= 1) { breakAnchor(FX, A); }
  }
  function breakAnchor(FX, A) {
    const M = FX.mem, m = FX.m, H = FX.H; if (A.obj) { A.obj.dead = true; A.obj = null; } A.role = 'recoil'; A.rt = 0; M.stag[A.i] = 0;
    H.text(A.x, A.y - 2, 'ANCHOR BROKEN!', GOLD, 15); H.sfx.crash(); H.shake(8, 0.3); H.sparks(A.x, A.y, SAND, 18, 5); for (let i = 0; i < 2; i++) H.drop(i ? 'mp' : 'hp', A.x + FX.rnd(-1, 1), A.y + 1);
    const now = FX.S.t; M.brokenT.push(now); M.brokenT = M.brokenT.filter(v => now - v < 8);
    if (M.brokenT.length >= 2) { M.brokenT = [];
      if (M.ult) { M.ult = null; M.pull = 0; FX.S.tele.forEach(s => { if (s.ult) s.done = 'cut'; }); m.stunT = 7; H.banner('ITS GRIP IS BROKEN', 'The World Below collapses on itself: it reels. Strike!', '#FFFFFF', 2.2, true); H.ring(m.x, m.y, 0.5, 9, 0.8, GOLD, 0.4); }
      else if (M.buried > 0.5) { M.rising = true; M.surfaceT = 7; H.banner('IT HEAVES UP', 'Its siphons are bare: strike them before it sinks again', GOLD, 2.4, true); H.shake(12, 0.6); FX.H.sfx.crash(); }
      else { m.stunT = 5; H.banner('DESTABILISED', 'Two anchors gone: its mantle reels', GOLD, 2, true); } }
  }
  function sidePts(FX, m, M) { return [-1, 1].map(s => ({ x: m.x + Math.cos(M.ang + s * 1.5) * 2.9, y: m.y + Math.sin(M.ang + s * 1.5) * 2.9 * 0.8 })); }
  function waterNear(FX, x, y) { return FX.S.hz.some(z => z.kind === 'water' && Math.hypot(z.x - x, z.y - y) < z.r + 1); }
  /* the arms animate toward their targets; a slam rises then falls, a sweep swings */
  function stepArms(FX, m, M, dt) {
    const t = FX.S.t;
    M.arms.forEach(A => {
      const base = M.ang + A.a0 - Math.PI / 2;
      if (A.role === 'idle') { const R = 6.4 + Math.sin(t * 0.7 + A.ph) * 1.0; A.tx = m.x + Math.cos(base) * R; A.ty = m.y + Math.sin(base) * R * 0.85; A.tz = 0.1 + 0.25 * Math.sin(t * 1.3 + A.ph); A.curl = 1; }
      else if (A.role === 'recoil') { A.rt += dt; const R = 2.9; A.tx = m.x + Math.cos(base) * R; A.ty = m.y + Math.sin(base) * R; A.tz = 1.5 + Math.sin(A.rt * 9) * 0.5; A.curl = 1.6; if (A.rt > 4) A.role = 'idle'; }
      else if (A.role === 'slam') { const S = A.slam; S.t += dt; const u = Math.min(1, S.t / S.wait); A.tx = lerp(A.tx, S.x, dt * 5); A.ty = lerp(A.ty, S.y, dt * 5); A.tz = S.t < S.wait ? 1 + u * 3.2 : Math.max(0, A.tz - dt * 14); A.curl = 0.3; if (S.t > S.wait + 1.1 + (A.stuck > 0 ? 3 : 0)) { A.role = 'idle'; if (A.stuckObj) { A.stuckObj.dead = true; A.stuckObj = null; } A.stuck = 0; } }
      else if (A.role === 'sweep') { const S = A.sw; S.t += dt; if (S.t < S.wait) { A.tx = S.x0; A.ty = S.y0; A.tz = 0.3; } else { const u = Math.min(1, (S.t - S.wait) / 0.55); A.tx = lerp(S.x0, S.x1, u); A.ty = lerp(S.y0, S.y1, u); A.tz = 0.5 + Math.sin(u * Math.PI) * 0.6; } A.curl = 0.2; if (S.t > S.wait + 1.3) A.role = 'idle'; }
      else if (A.role === 'anchor' || A.role === 'stuck') { A.tz = A.role === 'stuck' ? 0.1 : 0.6 + 0.1 * Math.sin(t * 2 + A.ph); A.curl = 1.3; }
      const sp = dt * (A.role === 'slam' ? 8 : 3.5); A.x = lerp(A.x || A.tx, A.tx, sp); A.y = lerp(A.y || A.ty, A.ty, sp); A.z = lerp(A.z, A.tz, dt * 6);
    });
  }
  /* while it is under the sand its eyes are the target; the arms that are out (hunting, recoiling) can be struck too */
  function hitProxies(FX, m, M) {
    if (M.buried > 0.5) { const e = { x: m.x + Math.cos(M.ang) * 2.2, y: m.y + Math.sin(M.ang) * 2.2 * 0.85 }; FX.weak('eyes', e.x, e.y, 1.7, 1.0, true); }
    else if (FX.S.weak.eyes) FX.weak('eyes', 0, 0, 0, 0, false);
    M.arms.forEach(A => { const out = A.role === 'slam' || A.role === 'sweep' || A.role === 'recoil'; if (out && A.z < 3) { if (!A.hit || A.hit.dead) A.hit = FX.obj({ kind: 'part', x: A.x, y: A.y, r: 1.0, hp: 1e12, forward: 0.8, front: true }); A.hit.x = A.x; A.hit.y = A.y; A.hit.hp = 1e12; } else if (A.hit) { A.hit.dead = true; A.hit = null; } });
  }
  function freeArm(M) { const f = M.arms.filter(A => A.role === 'idle'); return f.length ? f[Math.floor(Math.random() * f.length)] : null; }
  /* ---- attacks ---- */
  function eruption(FX, m, lv) {
    const M = FX.mem, me = FX.me, A = freeArm(M); if (!A) return; const k = 1 / FX.S.fast, p = FX.clampArena({ x: me.x + FX.rnd(-0.8, 0.8), y: me.y + FX.rnd(-0.8, 0.8) }, 1), wait = (1.5 + (lv >= 3 ? -0.2 : 0)) * k * (waterNear(FX, p.x, p.y) ? 1.6 : 1);
    A.role = 'slam'; A.slam = { x: p.x, y: p.y, t: 0, wait }; A.tx = A.x; A.ty = A.y;
    // the mound: a widening hump of sand, then the arm bursts out of it
    FX.hz({ kind: 'mound', x: p.x, y: p.y, r: 2.2, life: wait, dps: 0, draw: (c, z, FX2, T, t) => { const u = z.age / z.life, X = FX2.sx(z.x), Y = FX2.sy(z.y), rr = T * (0.8 + u * 1.5); c.save(); c.fillStyle = SAND_DK; c.beginPath(); c.ellipse(X, Y, rr, rr * 0.55, 0, 0, TAU); c.fill(); c.fillStyle = SAND; c.beginPath(); c.ellipse(X, Y - rr * 0.25 * u, rr * 0.9, rr * 0.45, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = 2; c.beginPath(); c.ellipse(X, Y - rr * 0.25 * u, rr * 0.9, rr * 0.45, 0, 0, TAU); c.stroke(); c.restore(); } });
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 2.3, t: wait, dmg: m.dmg * 1.3, col: GOLD, label: 'ERUPTION', fn: q => { if (q.done === 'cut') return; M.bursts.push({ x: q.x, y: q.y, t: 0 }); FX.H.boom(q.x, q.y, 2.2, SAND, '#FFFFFF', { n: 22, shake: 10, smoke: 10 }); FX.H.sfx.crash(); inkCheck(FX, A, q.x, q.y); } });
  }
  function sweep(FX, m, lv) {
    const M = FX.mem, me = FX.me, A = freeArm(M); if (!A) return; const k = 1 / FX.S.fast, a = Math.atan2(me.y - m.y, me.x - m.x) + FX.rnd(-0.3, 0.3), L = 11, p0 = FX.clampArena({ x: me.x - Math.cos(a + Math.PI / 2) * L / 2, y: me.y - Math.sin(a + Math.PI / 2) * L / 2 }, 0.5), p1 = FX.clampArena({ x: me.x + Math.cos(a + Math.PI / 2) * L / 2, y: me.y + Math.sin(a + Math.PI / 2) * L / 2 }, 0.5), wait = (1.6 - (lv >= 3 ? 0.25 : 0)) * k * (waterNear(FX, me.x, me.y) ? 1.5 : 1), sa = Math.atan2(p1.y - p0.y, p1.x - p0.x);
    A.role = 'sweep'; A.sw = { x0: p0.x, y0: p0.y, x1: p1.x, y1: p1.y, t: 0, wait };
    // the crease: a long moving fold of sand along the line
    FX.hz({ kind: 'crease', x: p0.x, y: p0.y, a: sa, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), w: 1.6, shape: 'line', life: wait, dps: 0, draw: (c, z, FX2, T, t) => { const X = FX2.sx(z.x), Y = FX2.sy(z.y), u = z.age / z.life; c.save(); c.translate(X, Y); c.rotate(z.a); c.fillStyle = SAND_DK; c.beginPath(); c.ellipse(z.len * T * u, 0, T * 1.4, T * 0.55, 0, 0, TAU); c.fill(); c.strokeStyle = LINE; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(z.len * T * u, 0); c.stroke(); c.restore(); } });
    FX.tele({ shape: 'line', x: p0.x, y: p0.y, a: sa, len: Math.hypot(p1.x - p0.x, p1.y - p0.y), w: 2.4, t: wait, dmg: m.dmg * 1.1, col: GOLD, label: 'SWEEP', fn: q => { if (q.done === 'cut') return; M.sweeps.push({ x0: q.x, y0: q.y, a: q.a, len: q.len, t: 0 }); FX.H.shake(8, 0.3); FX.H.sfx.whoosh(); for (let i = 0; i < 5; i++) FX.H.part && FX.H.part({ kind: 'smoke', x: q.x + Math.cos(q.a) * q.len * i / 4, y: q.y + Math.sin(q.a) * q.len * i / 4, vx: 0, vy: -1, life: 0.9, max: 0.9, size: 0.8, color: 'rgba(230,200,140,' }); } });
  }
  function sandjet(FX, m) {
    const M = FX.mem, me = FX.me, k = 1 / FX.S.fast, sp = sidePts(FX, m, M), side = me.x < m.x ? 0 : 1, s = sp[side], a0 = Math.atan2(me.y - s.y, me.x - s.x), wait = 1.7 * k; M.jetSide = side; M.jetA = a0; M.jetT2 = wait + 2.6;
    FX.tele({ shape: 'cone', x: s.x, y: s.y, a: a0, len: 14, spread: 0.32, t: wait, dmg: 0, col: SAND, label: 'SANDJET', fn: q => {
      FX.H.sfx.whoosh(); FX.H.shake(6, 0.3); const z = FX.hz({ kind: 'jet', shape: 'cone', x: q.x, y: q.y, a: q.a - 0.9, len: 14, spread: 0.3, life: 2.6, dps: m.dmg * 0.9, tick: 0.25, col: SAND, update: (dt, zz) => { zz.a += dt * 0.7; M.jetA = zz.a; }, draw: (c, zz, FX2, T, t) => { const X = FX2.sx(zz.x), Y = FX2.sy(zz.y); c.save(); c.translate(X, Y); c.rotate(zz.a); for (let i = 0; i < 3; i++) { c.fillStyle = i === 0 ? 'rgba(240,210,150,.7)' : i === 1 ? 'rgba(255,240,200,.55)' : 'rgba(200,160,100,.5)'; c.beginPath(); c.moveTo(0, 0); for (let j = 0; j <= 10; j++) { const u = j / 10, L = zz.len * T * u, w = L * (0.3 - i * 0.07) + T * 0.3 * (1 - u) + Math.sin(u * 14 - t * 30 + i) * T * 0.15; c.lineTo(L, -w); } for (let j = 10; j >= 0; j--) { const u = j / 10, L = zz.len * T * u, w = L * (0.3 - i * 0.07) + T * 0.3 * (1 - u) + Math.sin(u * 14 - t * 30 + i + 2) * T * 0.15; c.lineTo(L, w); } c.closePath(); c.fill(); } c.restore(); } }); } });
  }
  function ink(FX, m) {
    const me = FX.me, p = FX.clampArena({ x: me.x + FX.rnd(-1.5, 1.5), y: me.y + FX.rnd(-1.5, 1.5) }, 1);
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r: 2.4, t: 1.2, dmg: m.dmg * 0.4, col: INK, label: 'INK', fn: q => { FX.hz({ kind: 'ink', x: q.x, y: q.y, r: 2.4, life: 14, dps: 0, slow: true, col: INK, draw: (c, z, FX2, T, t) => { const X = FX2.sx(z.x), Y = FX2.sy(z.y), f = Math.min(1, z.age * 2, (z.life - z.age)); c.save(); c.globalAlpha = f; const r = z.r * T; c.fillStyle = '#2A1A30'; c.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * TAU, rr = r * (0.85 + 0.15 * Math.sin(a * 5 + z.x)); i ? c.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr * 0.75) : c.moveTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr * 0.75); } c.closePath(); c.fill(); c.fillStyle = 'rgba(140,110,200,.25)'; c.beginPath(); c.ellipse(X - r * 0.3, Y - r * 0.25, r * 0.4, r * 0.18, -0.4, 0, TAU); c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke(); c.restore(); } }); FX.H.sfx.splash && FX.H.sfx.splash(); } });
  }
  function inkCheck(FX, A, x, y) { const M = FX.mem, z = FX.S.hz.find(z => z.kind === 'ink' && Math.hypot(z.x - x, z.y - y) < z.r + 0.5); if (!z) return; A.stuck = 3; A.role = 'slam'; A.slam.wait = -1; M.stag[A.i] = M.stag[A.i] || 0; A.x = x; A.y = y; A.tx = x; A.ty = y; FX.H.text(x, y - 1.5, 'STUCK IN THE INK!', AMBER, 15);
    A.stuckObj = FX.obj({ kind: 'inkslam', arm: A.i, x, y, r: 1.4, hp: 1e12, forward: 1.3, front: true, onHit: (ob, dmg, o) => { M.stag[A.i] = Math.min(1, (M.stag[A.i] || 0) + dmg / (FX.S.barHP * 0.09) * 2); if (M.stag[A.i] >= 1) { M.stag[A.i] = 0; ob.dead = true; A.role = 'recoil'; A.rt = 0; FX.H.text(x, y - 2, 'ARM STAGGERED!', GOLD, 15); FX.H.sfx.crash(); FX.m.stunT = Math.max(FX.m.stunT || 0, 2.5); } } }); }
  function startUlt(FX, m) {
    const M = FX.mem, k = 1 / FX.S.fast, wait = 4.6 * k; M.ultT = 24 * k; M.ult = { t: 0, wait };
    FX.H.banner('THE WORLD BELOW', 'The dunes flow to its beak. Reach the central terrace, or break two taut anchors to stop it', HOT, 3, true); FX.H.sfx.hum(); setAnchors(FX, 4);
    FX.tele({ shape: 'ring', ult: true, x: FX.C.x, y: FX.C.y, r0: 3.1, r1: FX.C.R + 1, t: wait, dmg: 0, col: HOT, label: 'COLLAPSE', fn: q => { if (q.done === 'cut') return; M.ult = null; M.pull = 0; FX.H.shake(18, 0.8); FX.H.flash(0.35, SAND); FX.H.sfx.crash(); if (!onTerrace(FX, FX.me.x, FX.me.y) || Math.hypot(FX.me.x - FX.C.x, FX.me.y - FX.C.y) > 3.1) { if (FX.inShape(q, FX.me.x, FX.me.y, FX.me.r)) FX.hurt(m.dmg * 2.6); } else FX.H.text(FX.me.x, FX.me.y - 1.4, 'The terrace holds!', GOLD, 14); for (let i = 0; i < 24; i++) { const a = FX.rnd(0, TAU), d = FX.rnd(4, FX.C.R); FX.H.part && FX.H.part({ kind: 'smoke', x: FX.C.x + Math.cos(a) * d, y: FX.C.y + Math.sin(a) * d, vx: -Math.cos(a) * 3, vy: -Math.sin(a) * 3 - 1, life: 1.2, max: 1.2, size: 1.2, color: 'rgba(230,200,140,' }); } m.stunT = 2.5; } });
  }
  function runUlt(FX, m, dt) { const M = FX.mem; M.ult.t += dt; if (M.ult.t > M.ult.wait + 0.2) M.ult = null; }
  /* ---- painting ---- */
  function armPts(FX, m, M, A, T, buried, t) {
    const base = M.ang + A.a0 - Math.PI / 2, cx = m.x + Math.cos(M.ang) * crownU, cy = m.y + Math.sin(M.ang) * crownU; let bx = cx + Math.cos(base) * 1.05, by = cy + Math.sin(base) * 1.05 * 0.8; const bz = buried > 0.5 ? 0 : 0.6 * (1 - buried);
    if (buried > 0.5) { const ex = A.x - bx, ey = A.y - by, el = Math.hypot(ex, ey) || 1, k = Math.max(0, el - 3.6) / el; bx += ex * k; by += ey * k; A.sandAt = [bx, by]; }   // buried: the arm rises out of the sand near where it strikes
    const dx = A.x - bx, dy = A.y - by, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, pts = [];
    const emerge = 0;
    for (let i = 0; i <= 11; i++) { const u = emerge + (1 - emerge) * i / 11, wig = (Math.sin(u * 4.2 + t * 2.0 + A.ph) * (0.55 + 0.75 * u) + Math.sin(u * 9 - t * 3.1 + A.ph * 2) * 0.22 * u) * A.curl * (A.role === 'idle' ? 1 : A.role === 'anchor' ? 0.6 : 0.35), curl = A.curl > 1 && u > 0.7 ? (u - 0.7) / 0.3 : 0;
      const x = bx + dx * u + nx * (wig + curl * Math.sin(curl * 4) * 1.2), y = by + dy * u + ny * (wig + curl * Math.cos(curl * 4) * 0.8), z = bz * (1 - u) + A.z * Math.sin(Math.min(1, u * 1.1) * Math.PI) * 1.3 + A.z * u * 0.3 + curl * 0.5;
      pts.push([x, y, z]); }
    return pts;
  }
  function ensure(M) { if (M.arms) return; Object.assign(M, { ang: Math.PI / 2, buried: M.buried == null ? 1 : M.buried, rise: 0, blink: 0, blinkT: 2, look: [0, 0], bursts: [], sweeps: [], stag: {}, brokenT: [], arms: [] }); for (let i = 0; i < NARM; i++) M.arms.push({ i, a0: i / NARM * TAU + Math.PI / NARM, role: 'idle', x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, ph: i * 1.7, curl: 1, w: 1, stuck: 0, anchor: -1 }); }
  /* ---- painting: a kraken of the dune sea, cel-shaded in orange ----
     Under the sand only its two great eyes show, peering out of rings of sand (and any arm it brings up to strike or to
     grip a ruin). Surfaced, it is the kraken of the lower floors grown huge: a tall torpedo mantle standing out of the
     sand, speckled and banded, with two fins like an arrowhead at its tip; under it a broad head with two great round
     eyes, a siphon at each side, a beak in the crown of eight thick arms spread over the sand, and two long feeding
     tentacles held up at its sides with their clubs high. In the fight it is kept as a picture painted a third a frame
     (the far arms; the mantle, head and eyes; the near arms), moved with it between */
  function squidFrame(m, M) { const th = M.ang, fx = Math.cos(th), fy = Math.sin(th); return { th, fx, fy, W: (u, v, z) => [m.x + fx * u - fy * v, m.y + fy * u + fx * v, z] }; }
  function drawSquid(c, FX, m, X, Y, T, t, step) {
    ensure(FX.mem); const K = FX.K, M = FX.mem, buried = M.demoBuried != null ? M.demoBuried : M.buried, furnace = M.demoFurnace || M.furnace, q = K.qq();
    if (M.demoBuried != null && !M.demoArms) { M.demoArms = 1; M.arms.forEach((A, i) => { const base = M.ang + A.a0 - Math.PI / 2, R = M.demoAnchor && i % 2 ? 9.5 : 6.4; A.x = m.x + Math.cos(base) * R; A.y = m.y + Math.sin(base) * R * 0.85; A.z = M.demoSlam && i === 2 ? 3.4 : 0.3; A.curl = M.demoAnchor && i % 2 ? 1.4 : 1; if (M.demoAnchor && i % 2) A.role = 'anchor'; if (M.demoSlam && i === 2) { A.role = 'slam'; A.slam = { t: 0, wait: 9, x: A.x, y: A.y }; } }); }
    const P3 = TN.cam(X, Y, T, m), F = squidFrame(m, M), go = i => step == null || step === i;
    // how far it has come out of the sand: 0 buried (only the eyes), 1 standing; as it rises the whole body comes up
    // through a ring of sand, the part still under it hidden
    const up = clamp(1 - buried, 0, 1), sink = (1 - up) * (HZ + MANT + 0.6), lw = Math.max(1.5, T * 0.075);
    const arms = M.arms.map(A => ({ A, pts: armPts(FX, m, M, A, T, buried, t) })), mid = o => o.pts[Math.floor(o.pts.length / 2)];
    const headY = F.W(headU, 0, 0)[1], behind = arms.filter(o => mid(o)[1] < headY - 0.2).sort((a, b) => mid(a)[1] - mid(b)[1]), front = arms.filter(o => mid(o)[1] >= headY - 0.2).sort((a, b) => mid(a)[1] - mid(b)[1]);
    if (go(0)) {
      if (up > 0.05) TN.groundShadow(c, P3(...F.W(headU, 0, 0))[0], P3(...F.W(headU, 0, 0))[1] + T * 0.2, T * 2.6 * up, T * 1.3 * up, 0, 0.42);
      behind.forEach(o => squidArm(c, FX, M, o, T, P3, buried, furnace, t, q, lw));
      if (up > 0.02) feeding(c, M, F, P3, T, t, -1, sink, furnace, lw, q, up);
    }
    // the near arms that lie on the sand come out from under the head (it is painted over their roots); a raised one is
    // nearer than the head, painted over it
    const low = front.filter(o => !(o.A.z > 0.8) || up < 0.5), high = front.filter(o => o.A.z > 0.8 && up >= 0.5);
    if (go(1)) {
      if (up > 0.02) { squidBody(c, FX, M, m, F, P3, T, t, sink, up, furnace, lw, q, 'back'); feeding(c, M, F, P3, T, t, 1, sink, furnace, lw, q, up); }
      low.forEach(o => squidArm(c, FX, M, o, T, P3, buried, furnace, t, q, lw));
    }
    if (go(2)) {
      if (up > 0.02) squidBody(c, FX, M, m, F, P3, T, t, sink, up, furnace, lw, q, 'head');
      if (buried > 0.5) buriedEyes(c, M, F, P3, T, t);
      high.forEach(o => squidArm(c, FX, M, o, T, P3, buried, furnace, t, q, lw));
    }
  }
  // the body: fins, mantle, head, eyes, siphons and beak, raised by how far it has surfaced and cut off at the sand
  function squidBody(c, FX, M, m, F, P3, T, t, sink, up, furnace, lw, q, part) {
    const W = F.W, Pz = (u, v, z) => P3(...W(u, v, z - sink)), hole = P3(...W(headU, 0, 0)), hx = T * 2.3, hy = T * 0.95, hcy = hole[1] + T * 0.2;
    c.save();
    // still rising: what is under the sand is hidden, everything above the hole's front lip or inside it shows
    if (up < 0.995) { c.beginPath(); c.rect(-1e4, -1e4, 2e4, 1e4 + hcy); c.ellipse(hole[0], hcy, hx * 1.04, hy * 1.04, 0, 0, TAU); c.clip(); }
    // the mantle's axis leans a little back as it rises; its girth swells just above the head, then tapers to a point
    const N = 14, ax = [], rad = s => 1.28 * (s < 0.16 ? 0.9 + s / 0.16 * 0.1 : 1 - Math.pow((s - 0.16) / 0.84, 1.55) * 0.9);
    for (let i = 0; i <= N; i++) { const s = i / N; ax.push(Pz(headU - 0.15 - s * 1.3, 0, HZ + 0.55 + s * MANT)); }
    const side = (i, k) => { const p = ax[i], a = ax[Math.max(0, i - 1)], b = ax[Math.min(N, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1; return [p[0] - dy / d * k * T, p[1] + dx / d * k * T]; };
    const edge = (s, k) => { const f = s * N, i = Math.min(N - 1, Math.floor(f)), e = f - i, A = side(i, k(i / N)), B = side(i + 1, k((i + 1) / N)); return [A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e]; };
    if (part === 'back') {
    // the fins: an arrowhead at the tip, one each side, behind the mantle
    for (const sd of [-1, 1]) {
      const pts = [edge(0.5, s => sd * rad(s) * 0.92), edge(0.6, s => sd * (rad(s) + 1.05)), edge(0.74, s => sd * (rad(s) + 1.75)), edge(0.86, s => sd * (rad(s) + 1.2)), edge(0.97, s => sd * (rad(s) + 0.15)), edge(0.9, s => sd * rad(s) * 0.5)];
      TN.shape(c, TN.blob(pts), { col: FIN, shade: OR_SH, shade2: OR_SH2, hi: '#FFD49A', line: OR_LN, lw: lw * 0.85, r: T * 1.0, d1: 0.1, d2: 0.22, spec: false,
        inner: g => { g.strokeStyle = 'rgba(160,70,20,.35)'; g.lineWidth = Math.max(1, T * 0.04); g.lineCap = 'round'; for (let k = 1; k <= 4; k++) { const a = edge(0.52 + k * 0.08, s => sd * rad(s) * 0.9), b = edge(0.58 + k * 0.07, s => sd * (rad(s) + 1.6 - Math.abs(k - 2.4) * 0.35)); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } } });
    }
    // the mantle itself: speckled, a paler stripe catching the light, furnace cracks in the last stage
    const L = [], R = []; for (let i = 0; i <= N; i++) { L.push(side(i, -rad(i / N))); R.push(side(i, rad(i / N))); }
    const tip = Pz(headU - 0.15 - 1.32, 0, HZ + 0.55 + MANT + 0.12), outline = L.concat([tip], R.slice().reverse());
    const RS = mulberry32(110);
    TN.shape(c, TN.blob(outline), { col: OR, shade: OR_SH, shade2: OR_SH2, hi: OR_HI, line: OR_LN, lw, r: T * 1.6, d1: 0.09, d2: 0.2, spec: 0.85, specR: 0.14, specAt: side(Math.round(N * 0.3), -0.55), glowCol: furnace ? HOT : null, glowA: 0.22 + (M.hunger || 0) * 0.2,
      inner: g => {
        // the pale stripe down its lit side
        g.fillStyle = 'rgba(255,214,160,.35)'; g.beginPath(); for (let i = 1; i < N; i++) { const p = side(i, -rad(i / N) * 0.62); i > 1 ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } for (let i = N - 1; i >= 1; i--) { const p = side(i, -rad(i / N) * 0.3); g.lineTo(p[0], p[1]); } g.closePath(); g.fill();
        // speckles, larger toward the middle, foreshortened toward the edges
        for (let k = 0; k < (q >= 1 ? 34 : 18); k++) { const s = 0.08 + RS() * 0.86, ph = (RS() - 0.5) * 2.6, f = s * N, i = Math.min(N - 1, Math.floor(f)), p = side(i, rad(s) * Math.sin(ph) * 0.95), sz = T * (0.07 + RS() * 0.1) * Math.max(0.35, Math.cos(ph)) * (1 - s * 0.4); g.fillStyle = k % 5 === 0 ? 'rgba(255,236,200,.55)' : 'rgba(150,62,14,.55)'; g.beginPath(); g.ellipse(p[0], p[1], sz * Math.max(0.4, Math.cos(ph)), sz, 0, 0, TAU); g.fill(); }
        // rings of muscle where it meets the head
        g.strokeStyle = 'rgba(140,60,16,.4)'; g.lineWidth = Math.max(1, T * 0.05); for (const s of [0.05, 0.11]) { const a = edge(s, z => -rad(z) * 0.98), b = edge(s, z => rad(z) * 0.98), mdp = ax[Math.round(s * N)]; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(mdp[0], mdp[1] + T * 0.32, b[0], b[1]); g.stroke(); }
        if (furnace) { g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; for (let k = 0; k < 5; k++) { const path = () => { g.beginPath(); let s = 0.12 + k * 0.15, ph = -0.75 + k * 0.38; for (let j = 0; j < 6; j++) { const p = side(Math.round(Math.min(0.95, s) * N), rad(s) * Math.sin(ph) * 0.95); j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); s += 0.045; ph += (j % 2 ? 0.34 : -0.27); } };
          const pul = 0.75 + 0.25 * Math.sin(t * 4 + k * 1.3); path(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.35 * pul; g.strokeStyle = HOT; g.lineWidth = Math.max(4, T * 0.28); g.stroke(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.strokeStyle = '#5A1206'; g.lineWidth = Math.max(2.5, T * 0.12); g.stroke(); g.strokeStyle = pul > 0.85 ? '#FFE28A' : '#FF9A3A'; g.lineWidth = Math.max(1.2, T * 0.055); g.stroke(); } g.restore(); }
      } });
    c.restore(); return; }
    // the head: broad and round, lighter beneath, under the mantle's rim
    const hd = TN.ellipsoid(c, (x, y, z) => P3(x, y, z - sink), F.th, W(headU, 0, HZ), [1.2, 1.72, 1.0], { T, col: OR, shade: OR_SH, shade2: OR_SH2, hi: OR_HI, line: OR_LN, lw, d1: 0.1, d2: 0.22, spec: 0.7, specR: 0.12,
      inner: g => { const b = Pz(headU + 0.4, 0, HZ - 0.85); g.fillStyle = OR_BEL; g.beginPath(); g.ellipse(b[0], b[1], T * 1.35, T * 0.55, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(150,62,14,.35)'; for (const [u, v, r] of [[0.2, -1.1, 0.12], [0.5, 1.2, 0.1], [-0.2, 0.9, 0.08], [0.1, -0.5, 0.07]]) { const p = Pz(headU + u, v, HZ + 0.55); g.beginPath(); g.ellipse(p[0], p[1], T * r * 1.3, T * r, 0, 0, TAU); g.fill(); } } });
    // the siphons: a funnel at each side, the one about to fire turned toward its mark and spouting
    [-1, 1].forEach((s, si) => { const jet = (M.jetT2 > 0 && M.jetSide === si) || (M.demoJet && si === 1), a = F.th + s * 1.5, ja = jet ? (M.jetA != null ? M.jetA : a) : a + s * 0.25, b0w = W(headU - 0.05, s * 1.35, HZ - 0.2), b0 = P3(b0w[0], b0w[1], b0w[2] - sink);
      const b1 = P3(b0w[0] + Math.cos(ja) * 0.75, b0w[1] + Math.sin(ja) * 0.75, HZ - 0.1 - sink), b2 = P3(b0w[0] + Math.cos(ja) * 1.35, b0w[1] + Math.sin(ja) * 1.35, HZ - 0.02 - sink);
      TN.tube(c, [b0, b1, b2], u => T * (0.78 - u * 0.22), { col: OR, shade: OR_SH, hi: OR_HI, line: OR_LN, lw: lw * 0.85, d2: 0.3, spec: false });
      c.save(); c.fillStyle = furnace ? '#5A1A10' : '#4A1A0A'; c.beginPath(); c.ellipse(b2[0], b2[1], T * 0.34, T * 0.26, ja, 0, TAU); c.fill(); c.strokeStyle = OR_LN; c.lineWidth = Math.max(1.2, T * 0.05); c.stroke(); if (furnace || jet) K_glow(c, b2[0], b2[1], T * 0.7, furnace ? HOT : '#FFE6B0', jet ? 0.55 : 0.4); c.restore(); });
    // the great eyes: wide and round, a ring of darker skin round each, following the pet
    const look = M.demoBuried != null ? [0.2, 0.6] : M.look, er = T * 0.78;
    for (const s of [-1, 1]) { const p = Pz(headU + 0.9, s * 0.88, HZ + 0.22);
      TN.shape(c, TN.ell(p[0], p[1], er * 1.16, er * 1.1), { col: OR_SH, shade: OR_SH2, hi: OR, line: OR_LN, lw: lw * 0.8, r: er, d2: 0.2, spec: false });
      TN.eye(c, p[0], p[1], er, { iris: IRIS, look, blink: M.blink, lid: OR, line: OR_LN, squash: 0.94, irisR: 0.7, pupilR: 0.46, brow: 0.35 + (M.hunger || 0) * 0.6, white: '#FFF8EE' });
      if (M.reel) { c.save(); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = Math.max(1.2, T * 0.05); c.beginPath(); for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU * 1.5 + t * 6 * s, rr = er * (0.15 + k / 16 * 0.6); k ? c.lineTo(p[0] + Math.cos(a) * rr, p[1] + Math.sin(a) * rr) : c.moveTo(p[0], p[1]); } c.stroke(); c.restore(); } }
    // rising, sand pours off the top of its head
    if (up < 0.995) { const pts = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * (1.08 + k / 8 * 0.84); pts.push([hd.p[0] + Math.cos(a) * hd.rx * 0.96, hd.p[1] + Math.sin(a) * hd.ry * 0.96]); } TN.drips(c, pts, SAND, T * 0.75, t, 9); }
    // the beak, between the near arms' roots: it gapes and glows when it bites
    { const b = Pz(crownU + 0.55, 0, HZ - 1.0), hu = M.hunger || 0, op = 0.12 + hu * 0.25; c.save(); c.fillStyle = '#2A1408'; c.strokeStyle = OR_LN; c.lineWidth = Math.max(1, T * 0.04); c.lineJoin = 'round';
      c.beginPath(); c.moveTo(b[0] - T * 0.3, b[1] - T * 0.08); c.lineTo(b[0], b[1] + T * (0.36 + op)); c.lineTo(b[0] + T * 0.3, b[1] - T * 0.08); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,.35)'; c.beginPath(); c.moveTo(b[0] - T * 0.16, b[1]); c.lineTo(b[0] - T * 0.04, b[1] + T * 0.22); c.lineTo(b[0] - T * 0.02, b[1]); c.closePath(); c.fill();
      if (furnace) K_glow(c, b[0], b[1] + T * 0.1, T * 1.1, HOT, 0.45 + hu * 0.5); c.restore(); }
    c.restore();
    // the ring of sand it is rising through, and the sand pouring off it
    if (up < 0.995) TN.shape(c, cc => { cc.ellipse(hole[0], hcy, hx * 1.3, hy * 1.3, 0, 0, Math.PI); cc.ellipse(hole[0], hcy, hx, hy, 0, Math.PI, 0, true); cc.closePath(); }, { col: SAND, shade: SAND_DK, hi: '#FFF0C8', line: '#8A6020', r: hx, lw: 2, d2: 0.25, spec: false });
  }
  // the two long feeding tentacles, rising at its sides and arching out, each ending in a broad club of suckers
  function feeding(c, M, F, P3, T, t, sd, sink, furnace, lw, q, up) {
    const W = F.W, sw = Math.sin(t * 1.1 + sd) * 0.35, reach = M.hunting ? 0.4 : 0, hz = z => z * up - sink * 0.15;
    // from under the head they run out low over the sand, then sweep up at its sides
    const ctrl = [W(crownU - 0.25, sd * 1.15, hz(0.45)), W(crownU - 0.2, sd * (3.0 + sw * 0.2), hz(0.5)), W(crownU - 0.6, sd * (3.8 + sw), hz(2.7 + reach)), W(crownU - 0.6, sd * (3.95 + sw * 1.2), hz(4.6 + reach))];
    const pts = []; for (let i = 0; i <= 12; i++) { const u = i / 12, a = 1 - u, b0 = a * a * a, b1 = 3 * a * a * u, b2 = 3 * a * u * u, b3 = u * u * u; pts.push(P3(b0 * ctrl[0][0] + b1 * ctrl[1][0] + b2 * ctrl[2][0] + b3 * ctrl[3][0], b0 * ctrl[0][1] + b1 * ctrl[1][1] + b2 * ctrl[2][1] + b3 * ctrl[3][1], b0 * ctrl[0][2] + b1 * ctrl[1][2] + b2 * ctrl[2][2] + b3 * ctrl[3][2])); }
    const wf = u => T * (0.42 - u * 0.2);
    TN.tube(c, pts, wf, { col: OR, shade: OR_SH, hi: OR_HI, line: OR_LN, lw: lw * 0.85, d1: 0.14, d2: 0.32 });
    // the club: a broad paddle facing out, rows of suckers on its face
    const e = pts[pts.length - 1], e2 = pts[pts.length - 3], a = Math.atan2(e[1] - e2[1], e[0] - e2[0]), cx = e[0] + Math.cos(a) * T * 0.55, cy = e[1] + Math.sin(a) * T * 0.55;
    TN.shape(c, TN.ell(cx, cy, T * 0.82, T * 0.4, a), { col: OR, shade: OR_SH, shade2: OR_SH2, hi: OR_HI, line: OR_LN, lw: lw * 0.85, r: T * 0.6, d2: 0.24, spec: 0.6, specAt: [cx - T * 0.2, cy - T * 0.15],
      inner: g => { if (q < 1) return; for (let k = -2; k <= 2; k++) for (const r2 of [-1, 1]) { const x = cx + Math.cos(a) * k * T * 0.26 - Math.sin(a) * r2 * T * 0.13, y = cy + Math.sin(a) * k * T * 0.26 + Math.cos(a) * r2 * T * 0.13, rr = T * (0.09 - Math.abs(k) * 0.012); g.fillStyle = CUP_RING; g.beginPath(); g.arc(x, y, rr, 0, TAU); g.fill(); g.fillStyle = CUP; g.beginPath(); g.arc(x, y, rr * 0.62, 0, TAU); g.fill(); } } });
  }
  // an arm: thick at the root, tapering long; its upper side orange and spotted, the side it shows when raised pale with
  // two rows of suckers; a gripping arm coils round its ruin; a resting one curls at the tip
  function squidArm(c, FX, M, o, T, P3, buried, furnace, t, q, lw) {
    const { A, pts } = o; if (buried > 0.5 && A.role === 'idle') return;
    if (buried > 0.5 && A.sandAt) { const p = P3(A.sandAt[0], A.sandAt[1], 0), r = T * 1.05; TN.shape(c, TN.ell(p[0], p[1], r * 1.3, r * 0.5), { col: SAND, shade: SAND_DK, hi: '#FFF0C8', line: '#8A6020', r, lw: 2, d2: 0.25, spec: false }); c.save(); c.fillStyle = '#7A5420'; c.beginPath(); c.ellipse(p[0], p[1], r * 0.75, r * 0.26, 0, 0, TAU); c.fill(); c.restore(); }
    const sp = pts.map(p => P3(...p)), wf = u => T * ((buried > 0.5 ? 0.78 : 0.92) * (1 - u) * (1 - u * 0.15) + 0.15) * A.w;
    if (A.z > 0.4) { c.save(); c.fillStyle = 'rgba(80,50,20,.25)'; sp.forEach((p, i) => { if (i % 2) return; const u = i / (sp.length - 1); c.beginPath(); c.ellipse(p[0], p[1] + pts[i][2] * T, wf(u) * 0.6, wf(u) * 0.25, 0, 0, TAU); c.fill(); }); c.restore(); }
    const raised = A.z > 0.8, gripping = A.role === 'anchor' || A.role === 'stuck';
    TN.tube(c, sp, wf, { col: raised ? OR_BEL : OR, shade: raised ? OR_BEL_SH : OR_SH, hi: raised ? '#FFF4E4' : OR_HI, line: OR_LN, lw: Math.max(1.5, T * 0.075), d1: 0.14, d2: 0.32,
      inner: raised || q < 1 ? null : g => { g.fillStyle = furnace ? HOT : 'rgba(150,62,14,.5)'; for (let i = 2; i < sp.length - 2; i += 2) { const p = sp[i], r = wf(i / (sp.length - 1)) * 0.13; g.beginPath(); g.ellipse(p[0] - r * 0.6, p[1] - wf(i / (sp.length - 1)) * 0.12, r * 1.3, r, 0, 0, TAU); g.fill(); } } });
    if (raised) TN.suckers(c, sp, wf, { n: 8, u0: 0.1, u1: 0.95, cup: CUP, ring: CUP_RING }); else if (gripping) TN.suckers(c, sp, wf, { n: 5, u0: 0.55, u1: 0.96, cup: CUP, ring: CUP_RING }); else if (A.i % 2 === 0 && q >= 1) TN.suckers(c, sp, wf, { n: 4, u0: 0.5, u1: 0.95, cup: CUP, ring: CUP_RING });
    // a resting arm curls at its tip
    if (A.curl > 0.8) { const e = sp[sp.length - 1], e2 = sp[sp.length - 2], a = Math.atan2(e[1] - e2[1], e[0] - e2[0]), w2 = Math.max(2, T * 0.2); c.save(); c.translate(e[0], e[1]); c.rotate(a); c.lineCap = 'round'; c.beginPath(); c.moveTo(-T * 0.15, 0); for (let k = 0; k <= 20; k++) { const u = k / 20, rr = T * 0.62 * (1 - u * 0.8), aa = u * 5.2; c.lineTo(Math.sin(aa) * rr + T * 0.2, -Math.cos(aa) * rr + T * 0.62 - T * 0.2 * u); } c.strokeStyle = OR_LN; c.lineWidth = w2 + Math.max(1.5, T * 0.075) * 2; c.stroke(); c.strokeStyle = raised ? OR_BEL : OR; c.lineWidth = w2; c.stroke(); c.restore(); }
    // the grip round a ruin, and an arm stuck in ink
    if (A.role === 'anchor') { const p = sp[sp.length - 1]; c.save(); c.lineCap = 'round'; c.beginPath(); c.ellipse(p[0], p[1] - T * 0.2, T * 1.1, T * 0.48, 0, 0.3, TAU - 0.6); c.strokeStyle = OR_LN; c.lineWidth = T * 0.3 + Math.max(1.5, T * 0.075) * 2; c.stroke(); c.strokeStyle = OR_BEL; c.lineWidth = T * 0.3; c.stroke(); c.restore(); }
    if (A.role === 'stuck') { const p = sp[sp.length - 1]; c.save(); c.fillStyle = INK; c.beginPath(); c.ellipse(p[0], p[1] + T * 0.1, T * 1.2, T * 0.45, 0, 0, TAU); c.fill(); c.restore(); }
  }
  // buried: two great eyes looking out of the sand, rings of sand rippling round them, a lid of sand over their lower edge
  function buriedEyes(c, M, F, P3, T, t) {
    const look = M.demoBuried != null ? [0.2, 0.6] : M.look, er = T * 0.8;
    for (const s of [-1, 1]) { const p = P3(...F.W(headU + 0.98, s * 0.95, 0.22));
      c.save(); c.strokeStyle = 'rgba(138,96,32,.5)'; c.lineWidth = 2; for (let k = 0; k < 2; k++) { const ph = (t * 0.5 + k * 0.5 + s * 0.25) % 1; c.globalAlpha = 1 - ph; c.beginPath(); c.ellipse(p[0], p[1] + er * 0.4, er * (1.4 + ph * 1.6), er * (0.5 + ph * 0.5), 0, 0, TAU); c.stroke(); } c.restore();
      c.save(); c.fillStyle = '#7A5420'; c.beginPath(); c.ellipse(p[0], p[1] + er * 0.25, er * 1.2, er * 0.62, 0, 0, TAU); c.fill(); c.restore();
      TN.eye(c, p[0], p[1], er, { iris: IRIS, look, blink: M.blink, lid: SAND_DK, line: OR_LN, squash: 0.7, irisR: 0.7, pupilR: 0.46, white: '#FFF8EE' });
      const sr = er * 1.4; TN.shape(c, c2 => { c2.moveTo(p[0] - sr, p[1] + er * 0.15); c2.quadraticCurveTo(p[0] - sr * 0.5, p[1] + er * 0.02, p[0], p[1] + er * 0.12); c2.quadraticCurveTo(p[0] + sr * 0.5, p[1] + er * 0.02, p[0] + sr, p[1] + er * 0.15); c2.quadraticCurveTo(p[0] + sr * 0.9, p[1] + er * 0.75, p[0], p[1] + er * 0.8); c2.quadraticCurveTo(p[0] - sr * 0.9, p[1] + er * 0.75, p[0] - sr, p[1] + er * 0.15); c2.closePath(); }, { col: SAND, shade: SAND_DK, hi: '#FFF0C8', line: '#8A6020', r: sr, lw: 2, d2: 0.2, spec: false }); }
  }
  function K_glow(c, x, y, r, col, a) { DunFiend.KIT.glow(c, x, y, r, col, a); }
  // what it sheds into the air each frame: sand off its body as it rises, its siphon's spray, heat over the furnace
  function squidAir(FX, dt) {
    const M = FX.mem, m = FX.m, H = FX.H; if (!m || !H.part || !M.arms) return; const k = dt * 60, up = 1 - (M.buried || 0);
    if (M.buried > 0.02 && M.buried < 0.98 && Math.random() < 0.9 * k) H.part({ kind: 'smoke', x: m.x + FX.rnd(-2, 2), y: m.y + 1 + FX.rnd(0, 1.2), vx: FX.rnd(-0.4, 0.4), vy: 0.6, life: 0.8, max: 0.8, size: 0.7, color: 'rgba(230,200,140,' });
    if (M.jetT2 > 0) { M.jetT2 -= dt; const sp = sidePts(FX, m, M)[M.jetSide || 0], ja = M.jetA != null ? M.jetA : 0; if (Math.random() < 0.7 * k) H.part({ kind: 'smoke', x: sp.x + Math.cos(ja) * 0.8, y: sp.y + Math.sin(ja) * 0.6 - 1.2, vx: Math.cos(ja) * 6, vy: Math.sin(ja) * 4, life: 0.7, max: 0.7, size: 0.9, color: M.furnace ? 'rgba(255,150,80,' : 'rgba(240,215,160,' }); }
    // a little dust shaken off its arms; in the last stage, embers rising off its cracked skin
    if (up > 0.5 && Math.random() < (M.furnace ? 0.3 : 0.12) * k) { const f = M.furnace; H.part({ kind: f ? 'ember' : 'smoke', x: m.x + FX.rnd(-2.2, 2.2), y: f ? m.y - FX.rnd(1.5, 6.5) : m.y + FX.rnd(1, 2.5), vx: FX.rnd(-0.6, 0.6), vy: -0.5, g: -0.5, life: 1, max: 1, size: f ? 2.4 : 0.6, color: f ? HOT : 'rgba(240,215,160,' }); }
  }
  /* a broken sandstone tower of the drowned city: flat toon faces, a dark doorway, sand heaped at its foot */
  function drawRuin(c, FX, p, X, Y, T, t) {
    const h = T * p.h, w = T * (p.big ? 2.2 : 1.3), R = mulberry32(p.seed || 3);
    c.save();
    c.fillStyle = 'rgba(80,50,20,.3)'; c.beginPath(); c.ellipse(X + w * 0.3, Y + T * 0.15, w * 1.1, T * 0.4, 0, 0, TAU); c.fill();
    // two faces, the lit one and the shaded one, with a broken top
    const top = Y - h, brk = (k) => top + (R() * 0.35) * T;
    const lit = [[X - w * 0.5, Y], [X - w * 0.5, brk()], [X - w * 0.3, brk() - T * 0.3], [X - w * 0.1, brk()], [X, top + T * 0.1], [X, Y]];
    const dark = [[X, Y], [X, top + T * 0.1], [X + w * 0.15, brk()], [X + w * 0.35, brk() - T * 0.25], [X + w * 0.5, brk()], [X + w * 0.5, Y]];
    TN.shape(c, TN.poly(lit), { col: '#D8B882', shade: '#B8945C', hi: '#F2DCB0', line: '#5A3A1E', r: w, lw: 2, d2: 0.18, spec: false });
    TN.shape(c, TN.poly(dark), { col: '#A8865A', shade: '#86663E', hi: '#C2A070', line: '#5A3A1E', r: w, lw: 2, d2: 0.18, spec: false, lx: 0.6, ly: -0.5 });
    c.fillStyle = '#3A2414'; c.fillRect(X - w * 0.32, Y - h * 0.45, w * 0.2, h * 0.28); c.fillRect(X + w * 0.12, Y - h * 0.7, w * 0.16, h * 0.2); c.fillRect(X - w * 0.2, Y - T * 0.9, w * 0.26, T * 0.9);
    c.strokeStyle = 'rgba(60,40,20,.45)'; c.lineWidth = 1.5; for (let k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X - w * 0.5, Y - h * k / 4); c.lineTo(X + w * 0.5, Y - h * k / 4); c.stroke(); }
    // sand heaped at the foot
    c.fillStyle = SAND; c.beginPath(); c.ellipse(X, Y + T * 0.05, w * 0.95, T * 0.3, 0, 0, TAU); c.fill(); c.strokeStyle = '#8A6020'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(X, Y + T * 0.05, w * 0.95, T * 0.3, 0, Math.PI * 0.05, Math.PI * 0.95); c.stroke();
    c.restore();
  }
})();
