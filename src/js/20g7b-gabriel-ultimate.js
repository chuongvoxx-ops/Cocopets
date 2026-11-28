/* ---------- (v475 GA) Eden Reborn, Gabriel's ultimate (20g7 creates it; GABRIEL_ULT.create(H2)) ----------
   Fires once, the frame Gabriel's 30 s of active time run out; Gabriel stays (a.judg) until its last frame, then leaves. ~14.2 s, six phases,
   every element anchored in the world at Gabriel's floor point (C) so a moving camera never drags it:
     I   The First Prayer    0 - 2.2   it rises, wings unfold, the halo races, the Oracle lifts its head and its mask lights, the bindings
                                       tremble, heart fragments pour from the chest, Grace Threads reach the pet, a pink-white dawn
     II  The Unbound Heart   2.2 - 4.4 the chest unfolds, the Heart separates, the restraints unlock into ribbons, the Oracle rises out of
                                       the chest on them, arms spread, its crown unfolds into a halo
     III The Sacred Bloom    4.4 - 6.6 the twelve petals ascend round the Oracle and open into a celestial lotus; a colossal layered
                                       crystal heart forms at its centre; Gabriel circles beneath, its tail streaming ribbons of light
     IV  Eden Descends       6.6 - 9.0 arms open; Grace Threads everywhere; a pink paradise grows over the field on the GPU (meadow,
                                       light rivers, lilies, rose-quartz flowers, flowering trees, golden heart arches, waterfalls of
                                       light, floating hearts, turning gold rings, drifting petals) - nothing of the dungeon touched
     V   The Perfect Harvest 9.0 - 11.8 hands together, the heart beats, the petals turn inward, a wingbeat: the wave (heal, shield,
                                       cleanse, Grace; Light damage; the marks show and detonate), the heart rises, compresses to a
                                       point, a silence, and opens: colossal heart, heart shockwaves, pillars, giant lotus, gold rings,
                                       hundreds of hearts, ribbons, blooms, the spectral white phoenix, the last purifying wave
     VI  Benediction         11.8 - 14.2 the paradise fades, the heart contracts, the petals return, the Oracle descends into the chest,
                                       the restraints close, the chest closes, a last peaceful cry, Gabriel dissolves into pearl
                                       feathers, hearts and ribbons; the Heart of Eden lingers and fades into one small pink heart.
   Values (CFG.ult) are the spec's suggestions, configurable: heal 60% max health, shield 20% for 10 s. Heals / shields go through
   20g7's rules (curses, caps); it never stops a scripted wipe. Effects: FGFX kinds 690..699 and Gabriel's drawParts / drawSpectral. */
const GABRIEL_ULT = (() => {
  const { sin, cos, hypot, max, min, exp, round, pow, sqrt } = Math, TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - pow(1 - cl(u), 3);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t)), FSY = 0.55;
  const UT = { p2: 2.2, p3: 4.4, p4: 6.6, p5: 9.0, wave: 9.85, det: 10.2, rise: 10.4, comp: 11.0, open: 11.35, last: 11.7, p6: 11.8, cry: 13.0, diss: 13.1, len: 14.2 };
  const CFG = { heal: 0.6, shield: 0.2, shieldT: 10, cleanse: 3, R: 10, wave: 7.5, mark: 1.2, fin: 9.5, core: 4.5, formK: [1.5, 1.2, 1.0], zoom: 0.7 };
  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = H.T, FXP = H.FXP, COL = H.COL, sx = x => X.sx(x), sy = y => X.sy(y);
    const { gpu, glOn, fgOpen, fgClose, sfx } = H, GLG = () => (typeof GABRIEL_GL !== 'undefined' ? GABRIEL_GL : null), low = () => H.LQ() < 1;
    let UL = null, warmT = 0;
    /* the paradise's layout, made once per ultimate (tiles off C, seeds): no allocation while it plays */
    const LAY = { fl: [], tr: [], ar: [], wf: [], ht: [], pt: [] };
    function layout(seed) { let s = (seed | 0) + 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647; for (const k in LAY) LAY[k].length = 0;
      for (let i = 0; i < 46; i++) { const an = r() * TAU, d = 1.2 + sqrt(r()) * 7.8; LAY.fl.push([cos(an) * d, sin(an) * d * 0.75, r() * 50, r() < 0.3 ? 2 : r() < 0.5 ? 1 : 0, d / 9]); }
      for (let i = 0; i < 9; i++) { const an = Math.PI + 0.25 + i / 8 * (Math.PI - 0.5), d = 6 + r() * 2.2; LAY.tr.push([cos(an) * d, sin(an) * d * 0.6 - 0.5, r() * 50, 0.9 + r() * 0.5, d / 9]); }
      for (let i = 0; i < 5; i++) { const an = Math.PI + 0.45 + i / 4 * (Math.PI - 0.9), d = 4.6; LAY.ar.push([cos(an) * d, sin(an) * d * 0.6 - 0.3, 0, 1, 0.5 + i * 0.05]); }
      for (let i = 0; i < 3; i++) LAY.wf.push([(i - 1) * 4.2, -6.4 - (i % 2) * 0.6, r() * 50, 1, 0.6]);
      for (let i = 0; i < 28; i++) LAY.ht.push([(r() - 0.5) * 16, (r() - 0.5) * 11, 1 + r() * 4, r() * 50, r()]);
      for (let i = 0; i < 36; i++) LAY.pt.push([(r() - 0.5) * 18, (r() - 0.5) * 12, r() * 6, r() * 50, r()]); }
    const SPS = { evo: 7, wing: 1, wingShape: 'ult', cry: 0, beakOpen: 0, t: 0, face: 1.6, fly: 0.6, alpha: 1 }, SPO = { alpha: 1, fade: 0, emerge: 0.3 };
    const HP = { x: 0, y: 0, z: 0 };   // the colossal heart (world tiles + height), this frame

    function start(a) {
      if (!a || a.gbuOn || UL) return false; a.gbuOn = true; a.judg = true; a.jA = 1; a.hold = true;
      const k = H.kOf(a); UL = { a, t: 0, k, cx: a.x, cy: a.y, seed: Math.random() * 1000, ev: {}, n: 0, zO: 0, alt0: a.gb ? a.gb.alt : 0.5 };
      layout(UL.seed); try { const G = GLG(); if (G && G.idle) Object.assign(SPS, G.idle(7, 0), { wing: 1, wingShape: 'ult' }); } catch (e) {}
      g.cineT = max(g.cineT || 0, UT.p6); me.inv = max(me.inv || 0, UT.p6 + 0.5); sfx('hum'); X.after && X.after(0.4, () => sfx('sparkle'));
      if (X.warmView) try { X.warmView(CFG.zoom / max(0.3, g.zoomP || 1), null, null, 2.5); } catch (e) {}
      return true;
    }
    const active = () => !!UL;
    const pw = J => H.P(J.a) * CFG.formK[J.k - 1];
    function hitAll(J, R, k, core, o) { let n = 0; for (const m of H.living()) { const d = hypot(m.x - J.cx, m.y - J.cy); if (d > R + m.r) continue; H.light(J.a, m, pw(J) * (k * (1 - 0.45 * cl(d / R)) + (d < core ? k * 0.4 : 0)), o); n++; } return n; }
    function update(dt, dtReal) {
      warmT -= dtReal; if (warmT <= 0 && UL && X.warmView) { warmT = 1; try { X.warmView(CFG.zoom / max(0.3, g.zoomP || 1), null, null, 2.5); } catch (e) {} }
      if (!UL) return; const J = UL, a = J.a;
      if (me.dead || !H.S.list.includes(a)) { end(false); return; }
      const t0 = J.t; J.t += dtReal; const t = J.t, cross = x => t0 < x && t >= x;
      a.judg = true; a.hold = true; a.jA = 1; a.vx = a.vy = 0;
      if (t < UT.p6) { g.cineT = max(0.02, UT.p6 - t); me.inv = max(me.inv || 0, 0.4); } else if (t0 < UT.p6) g.cineT = 0;
      // the camera: back to frame the risen Oracle and the lotus, widest for the paradise and the bloom, a punch at the opening, home
      const zp = t < UT.p3 ? lerp(1, 0.84, sstep(0, UT.p3, t)) : t < UT.p6 ? lerp(0.84, CFG.zoom, sstep(UT.p3, UT.p4 + 1, t)) - 0.04 * bump(t, UT.open - 0.05, UT.open, UT.open + 0.1, UT.open + 0.6) : lerp(CFG.zoom, 1, sstep(UT.p6 + 0.6, UT.len - 0.2, t));
      g.zoomP = zp; g.zoomT = t < UT.len - 0.05 ? 0.25 : 0;
      // the heart's place: over C, above the risen Oracle; it rises before it compresses
      const ab = a.gb, hT = H.sizeT(a); J.zO = (ab ? ab.alt : 0.6) + hT * 1.18; HP.x = J.cx; HP.y = J.cy + 0.05; HP.z = J.zO + 0.2 + 1.6 * sstep(UT.rise, UT.comp, t) - 1.0 * sstep(UT.p6, UT.p6 + 1.2, t);
      flight(J, a, dtReal, t); pose(J, a, t); petals(J, a, t);
      // events
      if (t < UT.p2 && Math.random() < dtReal * 6) X.shake(1 + t * 0.8, 0.08);
      if (cross(0.9)) sfx('chirp');
      if (cross(UT.p2 + 0.3)) { X.shake(8, 0.4); sfx('crash'); }
      if (cross(UT.p2 + 1.0)) sfx('sparkle');
      if (cross(UT.p3)) sfx('whoosh');
      if (cross(UT.p4)) { sfx('hum'); X.shake(5, 0.6); }
      if (cross(UT.wave)) wave(J);
      if (cross(UT.det)) { let n = 0; for (const m of H.living()) { if (hypot(m.x - J.cx, m.y - J.cy) > CFG.R + m.r) continue; const s = H.consume(m); if (s) { H.light(a, m, pw(J) * CFG.mark * s, { big: true, noCrit: true }); n++; } } J.n = n; if (n) { X.shake(9, 0.3); sfx('crash'); } }
      if (cross(UT.comp)) { try { const F = X.sfx; if (F && F.duck) F.duck(0.03, UT.open - UT.comp + 0.1); } catch (e) {} X.shake(4, 0.3); }
      if (cross(UT.open)) { hitAll(J, CFG.R, CFG.fin, CFG.core, { big: true, noCrit: true, kb: 5 }); X.flash(0.12, '#FFF0F8'); X.shake(26, 0.9); g.hitStop = max(g.hitStop || 0, 0.08); sfx('crash'); X.after && X.after(0.18, () => sfx('fanfare')); X.light && X.light(J.cx, J.cy, 12, 1.2);
        if (!gpu()) { X.boom(J.cx, J.cy, 5, '#FF6FB5', '#FFF0F8', { n: 40, shake: 0, smoke: 0 }); X.ring(J.cx, J.cy, 0.5, CFG.R, 0.8, '#FFB3DA', 0.4); } }
      if (cross(UT.last)) { H.cleanse(CFG.cleanse); X.flash(0.15, '#FFE6F4'); sfx('sparkle'); }
      if (cross(UT.cry)) { if (ab) ab.cry = 1; sfx('chirp'); }
      if (t >= UT.len) end(true);
    }
    /* the Perfect Harvest's wave: the pet healed, shielded, cleansed (its Grace Hearts deepen it); every monster in reach struck */
    function wave(J) { const a = J.a; if (!me.dead) { H.heal(CFG.heal); H.shield(CFG.shield, CFG.shieldT); H.cleanse(CFG.cleanse); H.grace(3); }
      hitAll(J, CFG.R, CFG.wave, 0, { big: true, noCrit: true, kb: 3, mark: 1 }); if (a.gb) a.gb.kick = 1; X.flash(0.25, '#FFE6F4'); X.shake(14, 0.5); sfx('crash'); if (!gpu()) X.ring(J.cx, J.cy, 0.5, CFG.R, 0.9, '#FFB3DA', 0.35); }
    /* it rises, circles gently beneath the lotus (a small orbit, banking), settles, and sinks a little as it dissolves */
    function flight(J, a, dt, t) { const ab = a.gb; if (!ab) return; const hT = H.sizeT(a) * 0.55, orb = bump(t, UT.p3, UT.p3 + 0.8, UT.p6, UT.p6 + 0.8), an = (t - UT.p3) * 0.9;
      const tx = J.cx + cos(an) * 0.8 * orb, ty = J.cy + sin(an) * 0.45 * orb, alt = hT * lerp(lerp(J.alt0 / hT, 1.15, sstep(0, 1.6, t)), 0.7, sstep(UT.p6 + 0.4, UT.len, t));
      const k = 1 - exp(-3 * dt), x0 = a.x; a.x += (tx - a.x) * k; a.y += (ty - a.y) * k; ab.alt += (alt - ab.alt) * (1 - exp(-2.4 * dt)); ab.vx = (a.x - x0) / max(dt, 1e-3); ab.bank = -0.5 * orb * cos(an);
      a.gbS.face = 1.6 + 0.45 * orb * sin(an); a.gbS.fly = cl(ab.alt / hT); a.gbS.bank = ab.bank; a.gbS.speed = 0.3 * orb; a.gbS.glide = 0.5 * orb; }
    /* the pose (the model springs it) */
    function pose(J, a, t) { const S = H.pose(a); if (!S) return;
      const strain = sstep(0.9, 2.2, t) * (1 - sstep(UT.p2 + 0.5, UT.p2 + 1, t)), open = sstep(UT.p2 + 0.1, UT.p2 + 1.0, t) * (1 - sstep(UT.p6 + 0.8, UT.p6 + 1.4, t)), rise = sstep(UT.p2 + 0.8, UT.p3, t) * (1 - sstep(UT.p6 + 0.2, UT.p6 + 1.1, t));
      const pray = bump(t, UT.p5, UT.p5 + 0.5, UT.comp, UT.open), spread = max(sstep(UT.p2 + 1.3, UT.p3, t) * (1 - sstep(UT.p5 - 0.1, UT.p5 + 0.4, t)), bump(t, UT.open, UT.open + 0.15, UT.p6 + 0.4, UT.p6 + 1.2));
      S.wing = lerp(0.6, 1, sstep(0.2, 1.2, t)) * (1 - 0.4 * sstep(UT.cry + 0.2, UT.len, t)); S.wingShape = t < UT.p6 + 0.8 ? 'ult' : 'full'; S.wingPulse = max(bump(t, 1.4, 1.8, 2.1, 2.6), bump(t, UT.wave - 0.3, UT.wave, UT.wave + 0.2, UT.wave + 0.7), bump(t, UT.open - 0.1, UT.open, UT.open + 0.3, UT.open + 1));
      S.wingBeat = 0.4 * bump(t, 0, 0.3, 1.2, 1.8); S.glow = 0.4 + 0.6 * sstep(0.5, 2, t) * (1 - sstep(UT.p6, UT.len, t));
      S.heartPulse = 0.5 + 0.5 * max(strain, bump(t, UT.p5, UT.p5 + 0.3, UT.wave, UT.wave + 0.5)); S.heartOpen = open; S.heartSplit = open; S.ringSpin = 1 + 4 * sstep(0, 1.5, t) * (1 - sstep(UT.p6, UT.p6 + 1, t)); S.heartGlow = 0.8 + 1.2 * open;
      S.orStruggle = strain; S.restraintsOpen = sstep(UT.p2 + 0.4, UT.p2 + 1.0, t) * (1 - sstep(UT.p6 + 0.8, UT.p6 + 1.2, t)); S.orRise = rise; S.crownOpen = sstep(UT.p2 + 1.4, UT.p3, t) * (1 - sstep(UT.p6 + 0.4, UT.p6 + 0.9, t));
      S.orGlow = 0.6 + 1.4 * sstep(0.6, 1.6, t) * (1 - sstep(UT.p6 + 1, UT.len, t)); S.ribbons = 0.5 + 0.5 * sstep(UT.p2, UT.p2 + 1.4, t) * (1 - sstep(UT.p6 + 0.6, UT.p6 + 1.6, t));
      S.orArmL = S.orArmR = null; S.orPray = pray; S.orSpread = spread; S.orRaise = 0; S.orCast = 0; S.orHead.pitch = 0.45 * bump(t, 0.6, 1.2, UT.p2 + 1, UT.p3) - 0.35 * pray; S.orHead.yaw = 0;
      S.orHandL.g = S.orHandR.g = pray > 0.3 ? 'prayer' : 'open'; S.orHandL.open = S.orHandR.open = spread;
      S.haloSpin = 1 + 5 * sstep(0, 1.2, t) * (1 - sstep(UT.p3, UT.p3 + 1, t)) + 2 * bump(t, UT.p6 + 0.4, UT.p6 + 0.8, UT.len - 1, UT.len); S.haloGlow = 1.2; S.haloScale = 1;
      S.neck = 0.6 + 0.4 * max(sstep(0, 1, t) * (1 - sstep(UT.p3, UT.p4, t)), bump(t, UT.cry - 0.2, UT.cry, UT.cry + 0.4, UT.cry + 0.8)); S.cry = max(bump(t, 0.5, 0.7, 0.9, 1.3) * 0.6, bump(t, UT.cry - 0.15, UT.cry, UT.cry + 0.35, UT.cry + 0.8)); S.beakOpen = S.cry;
      S.wingKick = a.gb ? a.gb.kick : 0; if (a.gb) a.gb.kick = max(0, a.gb.kick - 0.05);
      S.look = null; S.tailSpread = 0.4 + 0.6 * sstep(UT.p3, UT.p4, t); S.tailSwish = 0.4 * sin(t * 1.4); S.legsFold = 1; S.dissolve = sstep(UT.diss, UT.len - 0.25, t); S.enter = 1; S.orRiseH = 1; }
    /* the twelve petals: up round the Oracle, open into the lotus, turn inward for the Harvest, burst wide at the opening, home */
    function petals(J, a, t) { const P = H.petals(a); if (!P) return; const lo = t > UT.p3 - 0.2 && t < UT.p6 + 0.4;
      for (let i = 0; i < 12; i++) { const p = P[i]; if (!lo) { if (p.mode !== 'home') { p.mode = 'home'; p.oT = 0; p.gT = 0; p.sT = 1; } continue; }
        const th = i / 12 * TAU + 0.25 * sin(t * 0.4) + t * 0.12, inw = bump(t, UT.p5, UT.p5 + 0.6, UT.comp, UT.open), wide = bump(t, UT.open, UT.open + 0.15, UT.p6, UT.p6 + 0.4), R = 1.7 + 0.35 * sstep(UT.p3, UT.p3 + 1.5, t) - 0.7 * inw + 1.4 * wide;
        p.mode = 'spring'; p.tx = HP.x + cos(th) * R; p.ty = HP.y - 0.05; p.tz = HP.z + sin(th) * R * 0.95; p.oT = sstep(UT.p3 + 0.4, UT.p3 + 1.6, t); p.gT = 1 + inw + 1.5 * wide; p.sT = lerp(1, 2.3, sstep(UT.p3 + 0.4, UT.p3 + 1.8, t)) * (1 - 0.25 * inw);
        const c = cos(th), s = sin(th), q = 1 - 2 * inw; p.d[0] = c * q; p.d[1] = -0.25 * inw; p.d[2] = s * q; p.rT = 0; } }
    function end(done) { if (!UL) return; const J = UL, a = J.a; UL = null; if (g.cineT > 0 && J.t < UT.p6) g.cineT = 0; g.zoomP = 1; g.zoomT = 0;
      a.judg = false; a.hold = false; a.jA = 1; const S = H.pose(a); if (S) { S.orRise = 0; S.restraintsOpen = 0; S.heartOpen = 0; S.heartSplit = 0; S.crownOpen = 0; }
      if (done) { a.st = 'leave'; a.lv = 0.8; a.alpha = 0; a.waved = true; } }
    function stop() { end(false); }
    /* the camera (20b camPick): drawn up over Gabriel so the risen Oracle, the lotus and the heart high over the field stay in view */
    const CAM = { x: 0, y: 0, k: 0 };
    function cam() { const J = UL; if (!J) return null; const k = 0.85 * bump(J.t, 0.2, 1.8, UT.p6 + 0.6, UT.len - 0.3); if (k < 0.01) return null; CAM.x = J.cx; CAM.y = J.cy - 2.4 * sstep(0.2, UT.p3, J.t); CAM.k = k; return CAM; }

    /* ================= drawing (world-anchored: C is J.cx, J.cy) ================= */
    const WS = [0, 0], W = (x, y, z) => { WS[0] = sx(x); WS[1] = sy(y) - (z || 0) * T(); return WS; }, pp = H.pp;
    function drawGround(c, Q0) { const J = UL; if (!J || !gpu()) return; const t = J.t, Tz = T(), Q = Q0 || fgOpen(c), X0 = sx(J.cx), Y0 = sy(J.cy), lq = low() ? 0.5 : 1;
      const dawn = sstep(0.4, UT.p2, t) * (1 - sstep(UT.p6 + 0.4, UT.len - 0.4, t)), eden = sstep(UT.p4, UT.p4 + 1.4, t) * (1 - sstep(UT.p6, UT.p6 + 1.4, t)), grow = sstep(UT.p4, UT.p5 - 0.2, t);
      Q.glow(X0, Y0, Tz * 7, COL.pink, 0.22 * dawn, FSY); FXP.seal(Q, X0, Y0, Tz * 3.4, sstep(0, 1.2, t), t * 0.3, 0.7 * dawn * (1 - eden * 0.5));
      if (eden > 0.01) { FXP.ground(Q, X0, Y0, Tz * 9.5, grow, eden, J.seed % 50);
        // the paradise's far side: waterfalls of light, golden heart arches, flowering trees (behind everything; a back-to-front order)
        for (const w of LAY.wf) { const [x, y] = W(J.cx + w[0], J.cy + w[1]), gk = sstep(w[4] * 0.6, w[4], grow); FXP.pillar(Q, x, y, Tz * 0.9, Tz * 6.5 * eout(gk), 0.85 * eden * gk, 1, 1); Q.glow(x, y, Tz * 1.4, COL.blush, 0.3 * eden * gk, FSY); }
        for (const r of LAY.tr) { const [x, y] = W(J.cx + r[0], J.cy + r[1]); FXP.tree(Q, x, y, Tz * 3.2 * r[3], sstep(r[4] * 0.7, r[4] * 0.7 + 0.35, grow), eden, r[2]); }
        for (const r of LAY.ar) { const [x, y] = W(J.cx + r[0], J.cy + r[1]); FXP.arch(Q, x, y, Tz * 2.4, Tz * 3.4, sstep(r[4], r[4] + 0.3, grow), eden); }
        for (let i = 0; i < LAY.fl.length * lq; i++) { const f = LAY.fl[i], [x, y] = W(J.cx + f[0], J.cy + f[1]); FXP.flower(Q, x, y, Tz * (f[3] === 2 ? 0.42 : 0.3), sstep(f[4] * 0.8, f[4] * 0.8 + 0.25, grow), f[3], eden, f[2]); } }
      // the Harvest's heart shockwaves and the opening's: heart-shaped fronts across the floor turning to lotus blooms
      for (const [t1, R, w] of [[UT.wave, CFG.R, 0.08], [UT.open, CFG.R * 1.1, 0.12], [UT.open + 0.3, CFG.R * 0.6, 0.07], [UT.last, CFG.R * 1.2, 0.05]]) { const u = (t - t1) / 1.3; if (u > 0 && u < 1) FXP.wave(Q, X0, Y0, R * Tz, eout(u), sstep(0.3, 0.9, u), 0.65 * (1 - sstep(0.55, 1, u)), w); }
      const bl = bump(t, UT.open, UT.open + 0.4, UT.p6 + 0.5, UT.p6 + 1.3); if (bl > 0.01) for (let i = 0; i < 10 * lq; i++) { const an = i / 10 * TAU, d = Tz * (2 + 1.2 * (i % 2)); FXP.flower(Q, X0 + cos(an) * d, Y0 + sin(an) * d * FSY, Tz * 0.6, bl, 1, bl, i * 7); }
      if (!Q0) fgClose(c); }
    function drawFx(c, Q0, P0) { const J = UL; if (!J) return; const t = J.t, a = J.a, Tz = T(), r = H.anchors(a), lq = low() ? 0.5 : 1, G = GLG();
      const eden = sstep(UT.p4, UT.p4 + 1.4, t) * (1 - sstep(UT.p6, UT.p6 + 1.4, t)), [hx, hy] = W(HP.x, HP.y, HP.z), heart = r && r.heart, parts = P0 || H.ppReset();
      const big = sstep(UT.p3 + 0.5, UT.p4 - 0.4, t) * (1 - sstep(UT.comp - 0.35, UT.comp, t)) + bump(t, UT.open - 0.02, UT.open + 0.1, UT.p6, UT.p6 + 1.3) * 1.15, comp = bump(t, UT.comp - 0.35, UT.comp, UT.open - 0.05, UT.open + 0.05), beat = 1 + 0.08 * sin(t * 7) + 0.15 * bump(t, UT.p5, UT.p5 + 0.2, UT.wave - 0.2, UT.wave + 0.1) * sin(t * 16);
      if (gpu()) { const Q = Q0 || fgOpen(c);
        // Phase I: heart fragments pour from the chest; Grace Threads to the pet; the Oracle's ribbons to the heart (II-V)
        if (heart) { const fr = bump(t, 0.6, 1.0, UT.p2 + 0.5, UT.p3); for (let i = 0; i < 18 * lq * fr; i++) { const ph = (t * 0.6 + i * 0.137) % 1, an = i * 2.39 + J.seed; FXP.heart(Q, heart.x + cos(an) * Tz * 3 * ph, heart.y + sin(an) * Tz * 1.6 * ph - ph * Tz * 2, Tz * 0.12 * (1 - ph * 0.5), an, 0, 1, fr * (1 - ph), 0); }
          const th = bump(t, 1.0, 1.5, UT.p6 + 0.5, UT.p6 + 1.2); if (th > 0.01 && !me.dead) FXP.thread(Q, heart.x, heart.y, sx(me.x), sy(me.y) - Tz * 0.5, Tz * 0.08, 0.8 * th, t * 2, 0.5, COL.rose);
          const rib = bump(t, UT.p2 + 0.6, UT.p3, UT.p6 + 0.4, UT.p6 + 1.1); if (rib > 0.01 && r.orHead) for (let i = 0; i < 4; i++) FXP.thread(Q, heart.x + (i - 1.5) * Tz * 0.25, heart.y, r.oracle ? r.oracle.x : r.orHead.x, r.oracle ? r.oracle.y : r.orHead.y, Tz * 0.07, 0.85 * rib, t * 1.5 + i, (i - 1.5) * 0.6, COL.pink); }
        // II-V: ribbons of celestial light streaming from the wing tips; III-V: the tail's ribbons coiling round the heart
        const rb = bump(t, UT.p2 + 0.5, UT.p3, UT.p6, UT.p6 + 0.8); if (rb > 0.01 && r) { for (const w of [r.wingTipL, r.wingTipR]) if (w) for (let i = 0; i < 2; i++) { const s2 = w.x < hx ? -1 : 1, ph = t * 1.3 + i * 2; FXP.thread(Q, w.x, w.y, w.x + s2 * Tz * (2.5 + i), w.y + Tz * (1.5 * sin(ph) - 0.5 - i), Tz * (0.35 - 0.1 * i), 0.7 * rb, ph, 0.9 * sin(ph * 0.7), i ? COL.blush : COL.pink); }
          const tp = r.tailTips || (r.tailTip ? [r.tailTip] : null); if (tp && t > UT.p3) for (let i = 0; i < 3; i++) { const p = tp[i % tp.length], an = t * 1.1 + i * 2.1; FXP.thread(Q, p.x, p.y, hx + cos(an) * Tz * 2.6, hy + sin(an) * Tz * 1.4, Tz * 0.28, 0.65 * rb, t * 2 + i, 1.1, COL.rose); } }
        // III-V: the colossal heart's light, its threads to the whole field (IV), the floating hearts, petals in the air, the turning golden rings
        if (big > 0.01 || comp > 0.01) { Q.glow(hx, hy, Tz * (2.2 * min(1, big) + 0.6) * beat, COL.pink, 0.35 * min(1, big + comp)); if (comp > 0.01) { const rp = Tz * 0.25 * (1 - comp) + 2; Q.glow(hx, hy, rp * 4, '#FFFFFF', 0.8 * comp); Q.star(hx, hy, Tz * 2 * comp, comp, COL.pearl); } }
        if (eden > 0.01) { for (let i = 0; i < 24 * lq; i++) { const an = i / 24 * TAU + t * 0.1, d = 4 + 4 * ((i * 7) % 5) / 5, [x, y] = W(HP.x + cos(an) * d, HP.y + sin(an) * d * 0.7, 0.2); FXP.thread(Q, hx, hy, x, y, Tz * 0.04, 0.5 * eden, t * 2 + i, 0.3 * sin(i), COL.rose); }
          for (const h of LAY.ht) { const [x, y] = W(J.cx + h[0], J.cy + h[1], h[2] + 0.3 * sin(t + h[3])); FXP.heart(Q, x, y, Tz * (0.14 + 0.1 * h[4]), 0.2 * sin(t + h[3]), 0, 1, eden * 0.9, 0); Q.glow(x, y, Tz * 0.5, COL.pink, 0.25 * eden); }
          for (let i = 0; i < LAY.pt.length * lq; i++) { const p = LAY.pt[i], z = 6 - ((t * 0.5 + p[2] / 6) % 1) * 6, [x, y] = W(J.cx + p[0] + sin(t + p[3]) * 0.6, J.cy + p[1], z); FXP.flower(Q, x, y + Tz * 0.1, Tz * 0.12, 1, 3, eden * 0.9, p[3] + t * 2); }
          for (let i = 0; i < 3; i++) Q.ring(hx, hy, Tz * (3.4 + i * 1.3), COL.gold, 0.45 * eden, Tz * 0.06, 0.28 + 0.12 * sin(t * 0.5 + i * 2)); }
        // V: the opening - pillars of white and magenta, hundreds of hearts flung out, ribbons of light spiralling, the second pearl wave
        const op = (t - UT.open) / 1.6; if (op > 0 && op < 1) { const k2 = 1 - sstep(0.6, 1, op), n = round(120 * lq);
          for (let i = 0; i < 8; i++) { const an = i / 8 * TAU, [x, y] = W(J.cx + cos(an) * 5.5, J.cy + sin(an) * 4); FXP.pillar(Q, x, y, Tz * 0.45, Tz * 9 * eout(op * 3), 0.5 * k2, 0, i % 2 ? 2 : 3); }
          FXP.pillar(Q, hx, sy(J.cy), Tz * 1.4, sy(J.cy) - hy + Tz * 8, 0.45 * k2, 0, 3);
          for (let i = 0; i < n; i++) { const an = i * 2.39996 + J.seed, sp = 0.4 + (i % 7) / 7, d = Tz * 9 * sp * eout(op), x = hx + cos(an) * d, y = hy + sin(an) * d * 0.7 + op * op * Tz * 3; FXP.heart(Q, x, y, Tz * (0.1 + 0.12 * ((i * 3) % 5) / 5), an + t * 3, i % 4 === 0 ? 1 : 0, 1.2, k2, 0); }
          for (let i = 0; i < 10; i++) { const an = i / 10 * TAU + op * 3, d0 = Tz * 1.5, d1 = Tz * (2 + 7 * eout(op)); FXP.thread(Q, hx + cos(an) * d0, hy + sin(an) * d0, hx + cos(an + 0.8) * d1, hy + sin(an + 0.8) * d1 * 0.7, Tz * 0.16, 0.5 * k2, t * 3 + i, 1, COL.pink); }
          Q.glow(hx, hy, Tz * 10 * eout(op), COL.blush, 0.14 * k2); }
        // VI: the dissolve - pearl feathers, hearts and ribbons; the Heart of Eden lasts, then one small pink heart
        const ds = sstep(UT.diss, UT.len, t); if (ds > 0 && heart) { for (let i = 0; i < 30 * lq; i++) { const an = i * 2.39996, d = Tz * (0.5 + 3.5 * ds) * (0.4 + (i % 5) / 5), x = heart.x + cos(an) * d, y = heart.y + sin(an) * d * 0.8 - ds * Tz * (1 + i % 3);
            if (i % 3) Q.star(x, y, Tz * 0.25, 1 - ds, COL.pearl); else FXP.heart(Q, x, y, Tz * 0.12, an, 0, 1, 1 - ds, 0); }
          const lh = bump(t, UT.len - 0.9, UT.len - 0.6, UT.len - 0.2, UT.len); FXP.heart(Q, heart.x, heart.y - Tz * 0.3 * lh, Tz * 0.3 * (1 - 0.5 * sstep(UT.len - 0.6, UT.len, t)), 0, 0, 2, max(lh, sstep(UT.diss + 0.5, UT.len - 0.6, t) * (1 - sstep(UT.len - 0.3, UT.len, t))), 0); Q.glow(heart.x, heart.y, Tz * 1.2, COL.pink, 0.6 * lh); }
        if (!Q0) fgClose(c); }
      // the GLM parts: the colossal layered heart, the giant lotus it opens into, the paradise's rose-quartz flowers and lilies, its golden rings
      if (glOn() && G && G.drawParts) { const hs = Tz * 0.55 * beat;
        if (big > 0.01 && comp < 0.95) pp(parts, 'heartBig', hx, hy, hy, hs * max(0.05, big * (1 - comp)), 1.57 + sin(t * 0.7) * 0.3, 0.1, min(1, big * 1.5), min(1.6, 0.9 + 1.2 * bump(t, UT.p5, UT.p5 + 0.3, UT.wave, UT.wave + 0.5) + 1.5 * comp) * (t > UT.open ? 0.6 : 1));
        const lo = bump(t, UT.open, UT.open + 0.25, UT.p6, UT.p6 + 1.2); if (lo > 0.01) pp(parts, 'lotus', hx, hy + Tz * 0.4, hy + Tz * 0.4, Tz * 0.9 * eout(lo), 0, -0.5, lo, 0.9, lo);
        if (eden > 0.05 && !low()) { for (let i = 0; i < 6; i++) { const f = LAY.fl[i * 7], [x, y] = W(J.cx + f[0], J.cy + f[1]); pp(parts, i % 2 ? 'lily' : 'lotus', x, y, y, Tz * 0.22 * eden, f[2], -0.9, eden, 0.8, sstep(UT.p4 + 0.5, UT.p5, t)); }
          for (let i = 0; i < 2; i++) pp(parts, 'ring', hx, hy, hy, Tz * (1.1 + 0.5 * i) * eden, t * (0.4 + 0.2 * i) * (i ? -1 : 1), 1.1 + 0.2 * i, eden, 0.8); }
        if (!P0 && parts.length) { parts.sort((p, q) => p.z - q.z); c.save(); try { G.drawParts(c, parts); } catch (e) {} c.restore(); } }
      if (!P0) drawSpec(c);
    }
    /* the enormous spectral white phoenix, rising over the bloom (after the parts) */
    function drawSpec(c) { const J = UL; if (!J) return; const t = J.t, Tz = T(), G = GLG();
      const sp = bump(t, UT.open + 0.05, UT.open + 0.4, UT.p6 + 0.3, UT.p6 + 1.1); if (sp > 0.01 && glOn() && G && G.drawSpectral) { SPS.t = t; SPS.cry = bump(t, UT.open + 0.1, UT.open + 0.3, UT.p6, UT.p6 + 0.6); SPS.beakOpen = SPS.cry; SPO.alpha = 0.32 * sp; SPO.fade = sstep(UT.p6 + 0.2, UT.p6 + 1.1, t);
        try { G.drawSpectral(c, sx(J.cx), sy(J.cy) - Tz * (1.5 + 1.5 * sp), Tz * 8.5, SPS, SPO); } catch (e) {} }
    }
    /* screen space: the pink-white dawn over the field (I-V), the hush before the opening, the white bloom of it */
    function drawCine(c, Wd, Hh) { const J = UL; if (!J) return; const t = J.t, dawn = sstep(0.4, UT.p2, t) * (1 - sstep(UT.p6, UT.len - 0.3, t)), hush = bump(t, UT.comp - 0.3, UT.comp, UT.open - 0.02, UT.open), wh = bump(t, UT.open - 0.02, UT.open, UT.open + 0.05, UT.open + 0.5);
      c.save(); if (dawn > 0.01) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,190,222,${0.13 * dawn})`; c.fillRect(0, 0, Wd, Hh); c.globalCompositeOperation = 'source-over';
        const gr = c.createRadialGradient(Wd / 2, Hh * 0.42, min(Wd, Hh) * 0.25, Wd / 2, Hh * 0.42, max(Wd, Hh) * 0.75); gr.addColorStop(0, 'rgba(60,10,40,0)'); gr.addColorStop(1, `rgba(70,16,50,${0.16 * dawn})`); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hh); }
      if (hush > 0.01) { c.fillStyle = `rgba(20,6,16,${0.35 * hush})`; c.fillRect(0, 0, Wd, Hh); }
      if (wh > 0.01) { c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,236,246,${0.12 * wh})`; c.fillRect(0, 0, Wd, Hh); }
      c.restore(); }
    function warm() { gpu(); }
    return { start, update, drawGround, drawFx, drawSpec, drawCine, active, stop, warm, cam, UT, CFG, get ul() { return UL; } };
  }
  return { create, UT, CFG };
})();
if (typeof self !== 'undefined') self.GABRIEL_ULT = GABRIEL_ULT;
