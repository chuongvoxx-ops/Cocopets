/* ---------- (v464 RZ-U) Raziel, The Twin Revelation: its ultimate, The Book of Two Heavens ----------
   Fired once when Raziel's 30 s of active time end (RAZIEL_MOVES, 20g6, calls start(a) from its fin), and run on the cinematic's clock
   (dtReal) until its last frame; the Anima stays (a.judg) until then and leaves dissolved. Six phases (UT, ~15 s):
     1 Twin Awakening        the heads rise, the cores pulse and leave the open chest to orbit it, Lux's neck runs molten, frost grows
                             over Umbra, the crowns expand and race, the wings spread, the camera pulls back, the floor divides (crimson
                             volcanic | luminous frost), both heads roar
     2 The Two Heavens       the crowns rise into the sky and unfold into two colossal portals (the Infernal Heaven: a solar surface in
                             gold astrolabe rings with solar blades; the Frozen Heaven: a crystalline vault in platinum rings with frost
                             spikes), turning against each other; the sky splits orange | cobalt; streams join each portal to its core
     3 Mirror Genesis        a spectral Lux (molten plasma) and a spectral Umbra (translucent crystal) emerge from the portals
                             (RAZIEL_GL.drawSpectral: Raziel's own geometry, its spectral shader) and turn to the field
     4 Judgement L / R       the spectral torrent of fire and the spectral cryogenic beam sweep the field in mirrored spirals while the
                             real heads breathe their own: four streams converge on the target; damage in ticks along each visible
                             stream (never per particle), Thermal Shock bursts where fire and ice meet; the domains collapse inward
     5 The Book              the cores rise between the portals, which turn and align; the spectral dragons dissolve into them; the
                             cores orbit each other, swell into an artificial sun and a frozen sphere, spiral in with white instability
                             at their boundaries; a hush; they collide into a white singularity in orange and cyan rings; both heads
                             breathe on the target, a white pillar falls on it, and the arena erupts in layers that keep Fire and Ice
                             apart: flash, a molten plasma sphere, crystal shockwaves, fire rings, ice formations, steam on the divide,
                             gold / platinum ring fragments, orange / cyan ribbons, spectral silhouettes thrown out, embers and ice
                             fragments by the thousand (one shader quad each), Thermal Shock detonations, a last celestial shockwave
     6 Revelation Complete   the ground cools, the ice fractures, steam rises, the portals collapse to rings and return as crowns, the
                             cores come home, the wings half-fold, the heads turn to each other and roar, and Raziel dissolves into two
                             spiralling streams (orange particles, blue-white fragments) that meet in a point of white light
   Damage (CFG.ult, x the Anima's power P, x CFG.formK [1.5, 1.2, 1] by form): stream ticks every 0.25 s (spectral 0.18, real 0.13 each); bursts 0.7; the main impact
   k1 with falloff and kc in the core, split half Fire, half Ice, then the final Thermal Shock (weight ks) on those in the core;
   three detonations (kd) and the last shockwave (kw). Bosses take the same multipliers of P (no share of their health).
   Rendering: the game's FGFX painter only (kinds 466..479 in 20k6h), the model through RAZIEL_GL (draw by the Anima runner,
   drawSpectral here); no GL resource of its own, no per-frame allocation in the draw (records preallocated, picture caches made once).
   Ground layer: one FGFX pass; air layer: one pass, split in two only while spectral dragons are drawn between them. lowFx thins the
   cosmetics (fields, depth copies, steam, fragments, silhouettes), never the damage. Without the painter (no WebGL) the damage and the
   pose run in full, shown with the game's own particles.
   Performance (measured, tests/_rz-ult.js): one air pass with the spectral dragons drawn after it (not between two passes), the floor's dim one
   screen-sized fill, stream ticks showing their number once a second (each new number is a new label picture), the eruption's mote fields cut
   to where their motes are. window.__RZU_V1 = 1 restores the first build's drawing, for A/B measurements in one page.
   Hooks (RZ-A's H2, 20g6; scratchpad hooks.md): pose(a), anchors(a), fire / ice / shock / kOf / onDone. */
const RAZIEL_ULT = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3), ein = u => cl(u) * cl(u);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  const FSY = 0.55;
  /* the timeline (s from start) */
  const UT = { p1: 2.2, roar: 1.5, p2: 4.0, p3: 5.8, p4: 8.6, rise: 9.6, swell: 10.6, mute: 10.95, coll: 11.2, breath: 11.3, pillar: 11.45, hit: 11.7, d1: 11.95, d2: 12.2, d3: 12.45, wave: 12.9,
    p6: 12.4, roar2: 13.2, diss: 13.6, white: 14.6, len: 15.0 };
  /* the numbers (x P = the pet's attack x ANIMA_POWER[form] x 2 awakened); radii in tiles; [a, b, c] by form 1..3 */
  const CFG = {
    tick: 0.25, kSpec: 0.18, kReal: 0.13, wSpec: 0.95, wReal: 0.75, trail: 3.0, burst: 0.7, burstR: 1.8, burstGap: 0.45,
    ult: { r: [8.0, 8.8, 9.6], core: 3.2, k1: 5.5, kc: 2.5, ks: 1.5, kd: 1.0, dR: 2.4, kw: 1.8, freeze: 1.4, kb: 6 },
    spiral: { R: [6.0, 6.6, 7.2], turns: 3.4, real: 0.58 },
    formK: [1.5, 1.2, 1.0]
  };
  /* (v465 RZ-U) the heavens' places in the world, in tiles: the portals rp (+0.2 a form) in radius, dx to each side of Raziel's feet and h up;
     span the scale of the two celestial bodies' dance (it was a share of the screen); the sky's tint round him; the pillar's height; the
     last white point's height */
  const WORLD = { rp: 2.3, dx: 3.4, h: 6.6, span: 12, tint: 11, pillar: 16, white: 9.5 };
  const COL = { crim: '#C8180C', fire: '#FF6A1A', hot: '#FFB04A', gold: '#FFC24D', white: '#FFF6E6', cob: '#1E4FB8', sap: '#3A7CF0', cyan: '#8EE6FF', ice: '#DDF4FF', plat: '#D9E2EE', goldM: '#D8A440', steam: '#DCE6EE', dark: '#05060C' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const SFX = () => (typeof sfx !== 'undefined' ? sfx : null);   // (the game's sound: its duck() for the hush)
  const RR3 = [1.0, 0.86, 0.7, 1.18];   // (the portals' rings: 2 at the first form, 3 at Lv4, a fourth, outermost, at Lv7)
  const TICK_T = { tick: true }, TICK_Q = { tick: true, noText: true };
  /* window.__RZU_V1 = 1: the first build's drawing (tests compare the two in one page) */
  const V1 = () => { try { return typeof window !== 'undefined' && window.__RZU_V1 === 1; } catch (e) { return false; } };
  const NMv = () => (typeof NIDHOGG_MOVES !== 'undefined' ? NIDHOGG_MOVES : (typeof self !== 'undefined' ? self.NIDHOGG_MOVES : null));
  const GLR = () => (typeof RAZIEL_GL !== 'undefined' ? RAZIEL_GL : null);
  /* picture caches (made once, kept across summons): the sky split (fire left: drawn mirrored for fire right) and the vignette */
  let SKY = null, VIG = null;
  function skyPic() { if (SKY) return SKY; try { const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64; const x = cv.getContext('2d');
      const L = x.createLinearGradient(0, 0, 0, 64); L.addColorStop(0, 'rgba(255,96,30,0.95)'); L.addColorStop(0.35, 'rgba(170,30,20,0.55)'); L.addColorStop(1, 'rgba(60,8,8,0)');
      const R = x.createLinearGradient(0, 0, 0, 64); R.addColorStop(0, 'rgba(150,200,255,0.9)'); R.addColorStop(0.35, 'rgba(30,70,190,0.55)'); R.addColorStop(1, 'rgba(8,16,60,0)');
      const H = x.createLinearGradient(0, 0, 64, 0); H.addColorStop(0, 'rgba(0,0,0,1)'); H.addColorStop(0.42, 'rgba(0,0,0,1)'); H.addColorStop(0.58, 'rgba(0,0,0,0)'); H.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = R; x.fillRect(0, 0, 64, 64); const c2 = document.createElement('canvas'); c2.width = 64; c2.height = 64; const y = c2.getContext('2d'); y.fillStyle = L; y.fillRect(0, 0, 64, 64); y.globalCompositeOperation = 'destination-in'; y.fillStyle = H; y.fillRect(0, 0, 64, 64);
      x.globalCompositeOperation = 'destination-out'; x.fillStyle = H; x.fillRect(0, 0, 64, 64); x.globalCompositeOperation = 'source-over'; x.drawImage(c2, 0, 0); SKY = cv; } catch (e) { SKY = null; } return SKY; }
  function vigPic() { if (VIG) return VIG; try { const cv = document.createElement('canvas'); cv.width = 96; cv.height = 96; const x = cv.getContext('2d'), G = x.createRadialGradient(48, 48, 18, 48, 48, 68);
      G.addColorStop(0, 'rgba(3,3,10,0)'); G.addColorStop(0.55, 'rgba(3,3,10,0.45)'); G.addColorStop(1, 'rgba(2,2,8,0.92)'); x.fillStyle = G; x.fillRect(0, 0, 96, 96); VIG = cv; } catch (e) { VIG = null; } return VIG; }

  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = () => H.T();
    const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
    const glOn = () => { const G = GLR(); try { return !!(G && (G.ok ? G.ok() : G.usable && G.usable())); } catch (e) { return false; } };
    const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
    const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
    const kOf = a => (H.kOf ? H.kOf(a) : Math.max(1, Math.min(3, a.k | 0)));
    const poseOf = a => (H.pose ? H.pose(a) : (a.rzS || (a.rzS = {})));
    const anchOf = a => { try { return H.anchors ? H.anchors(a) : (a.rzOut || null); } catch (e) { return null; } };
    /* (v465 RZ-U) the effects' tier: 2 the richest (the resolved visual quality High: RAZIEL_GL.hq(), else GQ level 0), 1 Balanced, 0 Performance or lowFx */
    const tier = () => { if (lowFx()) return 0; try { const R = GLR(); if (R && R.hq) return R.hq() ? 2 : (typeof GQ !== 'undefined' && GQ.level() >= 2 ? 0 : 1); if (typeof GQ !== 'undefined') { const L = GQ.level(); return L === 0 ? 2 : L === 1 ? 1 : 0; } } catch (e) {} return 2; };
    const LQ = () => [0.5, 0.75, 1][tier()];
    const snd = k => { try { if (X.sfx && X.sfx[k]) X.sfx[k](); } catch (e) {} };
    const sx = x => X.sx(x), sy = y => X.sy(y);
    let UL = null;
    /* preallocated: the four streams' world impact points, the burst pool, fragments, ice clusters, the scene's screen geometry */
    const STR = [0, 1, 2, 3].map(i => ({ i, fire: i % 2 === 0, spec: i < 2, x: 0, y: 0, sx0: 0, sy0: 0, dx: 0, dy: 0, on: 0 }));
    const BUR = []; for (let i = 0; i < 10; i++) BUR.push({ t0: -9, x: 0, y: 0, big: 1, seed: i * 7.3 });
    const FRAG = []; for (let i = 0; i < 12; i++) FRAG.push({ an: 0, v: 0, up: 0, spin: 0, s: 0, gold: true });
    const ICE = []; for (let i = 0; i < 8; i++) ICE.push({ x: 0, y: 0, s: 0, seed: 0, t0: 0 });
    const G = { t: -1, W: 0, H: 0, fs: -1, Tz: 1, pF: { x: 0, y: 0, r: 0, op: 0, ang: 0 }, pI: { x: 0, y: 0, r: 0, op: 0, ang: 0 }, cF: { x: 0, y: 0, r: 0, vis: 0 }, cI: { x: 0, y: 0, r: 0, vis: 0 },
      body: { x: 0, y: 0, r: 0 }, tX: 0, tY: 0, mL: null, mR: null, sL: null, sR: null, sky: { x: 0, y: 0 } };
    const SPL = { t: 0, mode: 'concord', side: 'L', wing: 1, beat: 0.35, fly: 1, raise: 0.4, jawL: 0, chargeL: 0, aimL: { x: 0, y: 0 }, x: 0, y: 0, face: 0, evo: 1, lowFx: false };
    const SPR = { t: 0, mode: 'concord', side: 'R', wing: 1, beat: 0.35, fly: 1, raise: 0.4, jawR: 0, chargeR: 0, aimR: { x: 0, y: 0 }, x: 0, y: 0, face: 0, evo: 1, lowFx: false };
    const OPL = { alpha: 1, fade: 0, emerge: 1, tile: 40 }, OPR = { alpha: 1, fade: 0, emerge: 1, tile: 40 };
    const AIML = { x: 0, y: 0 }, AIMR = { x: 0, y: 0 };

    function crowd(x, y, R, r) { const L = H.living(); let best = null, bn = 0; for (const m of L) { const d = Math.hypot(m.x - x, m.y - y); if (d > R) continue; let n = 0, w = 0; for (const q of L) if (Math.hypot(q.x - m.x, q.y - m.y) < r) { n++; w += q.boss ? 3 : 1; } if (w > bn) { bn = w; best = m; } } return best; }
    /* the hits: through RZ-A's elemental rules when given, else the game's own (Burning / Chill), Thermal Shock as a once-per-window burst */
    const fireHit = (a, m, d, o) => { if (H.fire) return H.fire(a, m, d, o); return H.hit(m, d, Object.assign({ el: 'fire', burn: true }, o)); };
    const iceHit = (a, m, d, o) => { if (H.ice) return H.ice(a, m, d, o); return H.hit(m, d, Object.assign({ el: 'frost', chill: true }, o)); };
    const shock = (a, m, x, y, k) => { if (H.shock) return H.shock(a, m, x, y, k); if (m.rzuShockT > g.t) return false; m.rzuShockT = g.t + 1.2; H.hit(m, pw(a) * (k || 1), { el: 'fire', noCrit: true }); return true; };
    const pw = a => H.P(a) * CFG.formK[kOf(a) - 1];   // (a floor for the first forms: their finale stands next to the other Zodiac Animas')

    /* ---- start: once, when the 30 s are over ---- */
    function start(a) {
      if (!a || a.rzuOn || a.rzuDone || UL) return false;   // (exactly once per summon; a.rzUlt is the moves' own flag, set before they call this)
      a.rzUlt = true; a.rzuOn = true; a.rzuDone = true; a.judg = true; a.jA = 1; a.hold = true; a.vx = a.vy = 0;
      const k = kOf(a), c = crowd(a.x, a.y, 11, 3.0), fw = a.face || 1;
      let tx = c ? c.x : a.x + fw * 3.5, ty = c ? c.y : a.y + 0.8; if (Math.hypot(tx - a.x, ty - a.y) < 2.2) { tx = a.x + fw * 3.0; ty = a.y + 1.0; }
      if (X.walkPoint) { const p = X.walkPoint(tx, ty, { r: 0.6, mv: 0, x: a.x, y: a.y }); if (p) { tx = p.x; ty = p.y; } }
      const A = anchOf(a); let fs = -1; if (A && A.mouthL && A.mouthR) fs = A.mouthL.x <= A.mouthR.x ? -1 : 1;
      UL = { a, t: 0, k, tx, ty, fs, seed: Math.random() * 1000, ticks: 0, nextTick: UT.p3 + 0.2, burstT: 0, nb: 0, ev: {}, done: false, ex0: a.x, ey0: a.y, n1: 0, need: 1, spk: [1, 1] };
      /* (v465 RZ-U) the heavens' centre, latched once in the world: between Raziel and the view's centre, clamped so both portals fit the view at
         the pulled-back zoom (0.78 of now); it stays put for the whole ultimate (so the portals pan with the camera and never slide with it) */
      { const Tz = T(), W = X.W ? X.W() : 390, Hh = X.H ? X.H() : 844, vx = a.x + (W / 2 - sx(a.x)) / Tz, vy = a.y + (Hh / 2 - sy(a.y)) / Tz, zr = 0.78 / Math.max(0.3, g.zoomP || 1),
          hw = W / 2 / (Tz * zr), hh = Hh / 2 / (Tz * zr), rp = WORLD.rp + 0.2 * k, ex = Math.max(0, hw - (WORLD.dx * 1.04 + rp) - 0.3), top = WORLD.h + rp * 1.15 + 1.2;
        let hx = (a.x + vx) / 2, hy = (a.y + vy) / 2; hx = Math.max(vx - ex, Math.min(vx + ex, hx)); hy = Math.max(vy - hh + top, Math.min(vy + hh - 1, hy)); UL.hx = hx; UL.hy = hy; }
      for (const b of BUR) b.t0 = -9;
      for (let i = 0; i < FRAG.length; i++) { const f = FRAG[i]; f.an = (i / FRAG.length) * TAU + Math.random() * 0.4; f.v = 3.5 + Math.random() * 3.5; f.up = 2.5 + Math.random() * 3; f.spin = (Math.random() - 0.5) * 9; f.s = 0.35 + Math.random() * 0.35; f.gold = i % 2 === 0; }
      for (let i = 0; i < ICE.length; i++) { const f = ICE[i], an = (i / ICE.length - 0.5) * 2.4 + (fs > 0 ? Math.PI : 0), rr = 2.2 + (i % 3) * 1.7 + Math.random() * 0.8; f.x = tx + Math.cos(an) * rr; f.y = ty + Math.sin(an) * rr * 0.8; f.s = 0.55 + Math.random() * 0.45 + (i % 3) * 0.12; f.seed = Math.random() * 40; f.t0 = UT.hit + 0.04 * i; }
      g.cineT = Math.max(g.cineT || 0, UT.hit + 0.6); me.inv = Math.max(me.inv || 0, UT.hit + 1.0);
      snd('hum'); X.after && X.after(0.5, () => snd('hum'));
      return true;
    }
    const active = () => !!UL;

    /* ---- the four streams: where each touches the field at t (world tiles; pure from the record) ---- */
    function streamPts(J, t) {
      const u = cl((t - UT.p3) / (UT.p4 - UT.p3)), R0 = CFG.spiral.R[J.k - 1], R = R0 * Math.pow(1 - u, 0.85) + 0.25, th0 = J.fs > 0 ? 0 : Math.PI, th = th0 + CFG.spiral.turns * u * (J.fs > 0 ? -1 : 1) + 0.25 * Math.sin(t * 1.3);
      const Rr = R * CFG.spiral.real, ph = th0 + 0.5 - 2.6 * u * (J.fs > 0 ? -1 : 1);
      STR[0].x = J.tx + Math.cos(th) * R; STR[0].y = J.ty + Math.sin(th) * R * 0.72;                       // spectral Lux's torrent
      STR[1].x = J.tx + Math.cos(th + Math.PI) * R; STR[1].y = J.ty + Math.sin(th + Math.PI) * R * 0.72;   // spectral Umbra's beam (mirrored)
      STR[2].x = J.tx + Math.cos(ph + Math.PI) * Rr; STR[2].y = J.ty + Math.sin(ph + Math.PI) * Rr * 0.72; // the real Lux
      STR[3].x = J.tx + Math.cos(ph) * Rr; STR[3].y = J.ty + Math.sin(ph) * Rr * 0.72;                     // the real Umbra
      return u;
    }

    /* ---- the pose: the targets the model's springs follow (RAZIEL_GL api) ---- */
    function pose(J, S, t) {
      const br4 = bump(t, UT.p3 + 0.05, UT.p3 + 0.35, UT.p4 - 0.3, UT.p4), br5 = bump(t, UT.breath - 0.15, UT.breath + 0.05, UT.hit + 0.2, UT.hit + 0.6), roar = bump(t, UT.roar - 0.3, UT.roar, UT.roar + 0.45, UT.roar + 0.8), roar2 = bump(t, UT.roar2 - 0.3, UT.roar2, UT.roar2 + 0.4, UT.roar2 + 0.75);
      const p6 = sstep(UT.p6, UT.p6 + 1.2, t), keep = 1 - p6;
      S.mode = 'concord'; S.walk = 0; S.final = keep;
      S.raise = Math.max(0, 0.9 * sstep(0.1, 1.0, t) * (1 - 0.65 * sstep(UT.p3 - 0.2, UT.p3 + 0.3, t)) * (1 - sstep(UT.p4 - 0.2, UT.p4, t)) + 0.8 * bump(t, UT.p4, UT.rise, UT.coll - 0.3, UT.coll) + 0.35 * p6 * (1 - sstep(UT.diss, UT.white, t)));
      S.roar = Math.max(roar, roar2); S.meet = sstep(UT.roar2 - 0.7, UT.roar2 - 0.2, t) * (1 - sstep(UT.white, UT.len, t));
      const jw = Math.max(roar, roar2, br4, br5, 0.25 * bump(t, 0.4, 0.8, 1.0, 1.3)); S.jawL = jw; S.jawR = jw;
      const ch = Math.max(sstep(0.15, 1.2, t) * keep, br5) * (1 - sstep(UT.p6 + 0.3, UT.p6 + 1.4, t)); S.chargeL = ch; S.chargeR = ch;
      S.recoilL = S.recoilR = 0.7 * bump(t, UT.p3 + 0.05, UT.p3 + 0.12, UT.p3 + 0.2, UT.p3 + 0.5) + bump(t, UT.hit - 0.02, UT.hit + 0.04, UT.hit + 0.12, UT.hit + 0.5);
      S.coreDetach = sstep(0.4, 1.1, t) * (1 - sstep(UT.p6 + 0.6, UT.p6 + 1.3, t)); S.coreOut = sstep(0.9, 1.15, t) * (1 - sstep(UT.p6 + 1.0, UT.p6 + 1.1, t));
      S.coreAlign = bump(t, UT.p4 + 0.4, UT.swell, UT.coll + 0.6, UT.p6 + 0.8); S.coreSpinL = 1 + 4 * sstep(0, 1.5, t) * keep + 3 * bump(t, UT.p4, UT.swell, UT.coll, UT.p6); S.coreSpinR = S.coreSpinL * 0.85;
      S.crownSpeedL = 1 + 3 * sstep(0.2, 1.6, t) * keep; S.crownSpeedR = S.crownSpeedL * 1.1; S.crownAlign = sstep(UT.p4, UT.rise, t) * keep;
      S.crownExpand = 0.3 * sstep(0.3, 1.6, t) * (1 - sstep(UT.p6 + 0.4, UT.p6 + 1.1, t));   // (a little: the portals themselves rise from the crowns; S.crownOut hides them meanwhile) S.crownOut = sstep(UT.p1 + 0.05, UT.p1 + 0.25, t) * (1 - sstep(UT.p6 + 0.55, UT.p6 + 0.7, t));   // (the model's crowns hidden as the portals rise out of their places)
      S.wing = lerp(lerp(0.35, 1, sstep(0.5, 1.7, t)), 0.55, sstep(UT.p6 + 0.3, UT.p6 + 1.3, t)); S.beat = 0.25 * bump(t, UT.p2, UT.p3, UT.p4, UT.rise) + 0.5 * bump(t, UT.roar - 0.2, UT.roar, UT.roar + 0.3, UT.roar + 0.7);
      S.fly = 0; S.bank = 0; S.stagger = 0.5 * bump(t, UT.hit, UT.hit + 0.05, UT.hit + 0.15, UT.hit + 0.6);
      S.dissolve = sstep(UT.diss, UT.white, t);
      // aims: P4 the real heads follow their streams; P5 both on the target; idle look otherwise
      if (t > UT.p3 - 0.3 && t < UT.p4) { AIML.x = STR[2].x; AIML.y = STR[2].y; AIMR.x = STR[3].x; AIMR.y = STR[3].y; S.aimL = AIML; S.aimR = AIMR; }
      else if (t > UT.p4 + 1.4 && t < UT.p6 + 0.4) { AIML.x = AIMR.x = J.tx; AIML.y = AIMR.y = J.ty; S.aimL = AIML; S.aimR = AIMR; }
      else { S.aimL = null; S.aimR = null; }
      S.face = Math.atan2(J.ty - J.a.y, J.tx - J.a.x);
    }

    /* ---- the loop ---- */
    /* the floor the pull-back will show (to the zoom it will reach: 0.66, down to 0.5 for a wider model), painted ahead by the dungeon in its idle frames (20b warmView, v464 RZ-U): asked
       for once a second while Raziel fights and while the ultimate runs, so its chunks are ready before the camera widens */
    let warmT = 0;
    function warmFloor(dtReal) { warmT -= dtReal; if (warmT > 0 || !X.warmView) return; warmT = 1; if (typeof window !== 'undefined' && window.__RZU_NOWARM === 1) return; const L = H.S && H.S.list; const a = UL ? UL.a : L && L.find(b => b.id === 'gemini' && (b.st === 'fight' || b.st === 'awaken')); if (!a) return;
      // (the zoom it will reach: the timeline's widest, 0.66, or less when the drawn model (wings and all) needs it, as geo measures it)
      const A0 = anchOf(a), bb = A0 && A0.bb, W = X.W ? X.W() : 0; let z = 0.66;
      if (bb && W > 0 && bb[2] > bb[0] && g.zoomP > 0) { const L0 = A0.wingTipL, R0 = A0.wingTipR, span = Math.max(bb[2] - bb[0], L0 && R0 ? Math.abs(R0.x - L0.x) * 1.1 : 0); z = Math.max(0.5, Math.min(0.66, 0.92 * W * g.zoomP / span)); }
      if (UL) z = Math.min(z, UL.need); X.warmView(z / Math.max(0.3, g.zoomP || 1), null, null, 2.5); }
    function update(dt, dtReal) {
      warmFloor(dtReal || dt || 0);
      if (!UL) return;
      const J = UL, a = J.a;
      if (me.dead || (H.S && H.S.list && !H.S.list.includes(a))) { end(false); return; }
      const t0 = J.t; J.t += dtReal; const t = J.t, cross = x => t0 < x && t >= x;
      a.judg = true; a.hold = true; a.vx = a.vy = 0; a.jA = 1;
      if (t < UT.hit + 0.6) { g.cineT = Math.max(0.02, UT.hit + 0.6 - t); me.inv = Math.max(me.inv || 0, 0.4); } else if (t0 < UT.hit + 0.6) g.cineT = 0;
      // the camera: pulled back to frame it, wider for the two heavens, widest for the two celestial bodies, a punch at the impact, home at the end
      const zp = t < UT.p1 ? lerp(1, 0.84, sstep(0, UT.p1, t)) : t < UT.p4 ? lerp(0.84, 0.78, sstep(UT.p1, UT.p2, t)) : t < UT.hit ? lerp(0.78, 0.7, sstep(UT.p4, UT.swell, t)) : t < UT.p6 + 0.8 ? lerp(0.66, 0.76, eout(cl((t - UT.hit) / 0.6))) : lerp(0.76, 1, sstep(UT.p6 + 0.8, UT.len - 0.2, t));
      /* the framing follows the model's own drawn extent (anchors' bb: wings, crowns, spikes), never fixed offsets: it pulls back further when
         the spread wings would not fit 92% of the screen's width (J.need, measured in geo), down to 0.5; the return home is the timeline's */
      g.zoomP = t < UT.p6 + 0.8 ? Math.min(zp, J.need) : Math.min(zp, lerp(J.need, 1, sstep(UT.p6 + 0.8, UT.len - 0.2, t))); g.zoomT = t < UT.len - 0.05 ? 0.25 : 0;
      streamPts(J, t);
      const S = poseOf(a); if (S) pose(J, S, t);
      // phase events
      if (t < UT.p1 && Math.random() < dtReal * 8) X.shake(1 + t, 0.08);
      if (cross(UT.roar)) { X.shake(12, 0.6); snd('crash'); J.ev.roar = 1; if (!gpu()) X.ring(a.x, a.y, 0.4, 5, 0.6, COL.fire, 0.3); }
      if (cross(UT.p1)) { snd('whoosh'); }
      if (cross(UT.p2 - 0.2)) { snd('hum'); X.shake(6, 0.4); }
      if (cross(UT.p3)) { snd('whoosh'); snd('crash'); X.shake(10, 0.5); }
      // Judgement: damage ticks along the four visible streams, bursts where fire meets ice
      if (t >= J.nextTick && t < UT.p4 + 0.05) { J.nextTick += CFG.tick; J.ticks++; tickStreams(J); }
      if (t > UT.p3 + 0.4 && t < UT.p4 - 0.1) { J.burstT -= dtReal; if (J.burstT <= 0) { const d1 = Math.hypot(STR[0].x - STR[3].x, STR[0].y - STR[3].y), d2 = Math.hypot(STR[1].x - STR[2].x, STR[1].y - STR[2].y), use = d1 < d2 ? 0 : 1, dd = Math.min(d1, d2);
        if (dd < 2.4 || J.nb < Math.floor((t - UT.p3) / 0.7)) { const p = use ? STR[1] : STR[0], q = use ? STR[2] : STR[3]; burstAt(J, (p.x + q.x) / 2, (p.y + q.y) / 2, 1, t); J.burstT = CFG.burstGap; } } }
      if (Math.random() < dtReal * 5 && t > UT.p3 && t < UT.p4) X.shake(2.5, 0.08);
      // the Book: the hush, the collision, the breaths, the pillar, the eruption
      if (cross(UT.rise)) snd('hum');
      if (cross(UT.mute)) { try { const F = SFX(); if (F && F.duck) F.duck(0.04, UT.coll - UT.mute + 0.15); } catch (e) {} J.ev.mute = 1; }
      if (t > UT.swell && t < UT.coll && Math.random() < dtReal * 10) X.shake(1.5 + 4 * sstep(UT.swell, UT.coll, t), 0.06);
      if (cross(UT.coll)) { X.flash(0.35, '#FFFFFF'); X.shake(16, 0.5); snd('crash'); g.hitStop = Math.max(g.hitStop || 0, 0.06); }
      if (cross(UT.breath)) snd('whoosh');
      if (cross(UT.hit)) mainHit(J);
      if (cross(UT.d1)) det(J, 0); if (cross(UT.d2)) det(J, 1); if (cross(UT.d3)) det(J, 2);
      if (cross(UT.wave)) lastWave(J);
      if (cross(UT.roar2)) { X.shake(8, 0.4); snd('hum'); }
      if (cross(UT.white)) { snd('sparkle'); }
      if (t >= UT.len) end(true);
    }
    function inCapsule(m, x0, y0, x1, y1, w) { const dx = x1 - x0, dy = y1 - y0, L2 = dx * dx + dy * dy || 1, u = cl(((m.x - x0) * dx + (m.y - y0) * dy) / L2), px = x0 + dx * u - m.x, py = y0 + dy * u - m.y; return px * px + py * py < (w + m.r) * (w + m.r); }
    function tickStreams(J) {
      const a = J.a, P = pw(a), L = H.living(), A = anchOf(a);
      for (const s of STR) {
        // the stream's footprint: a spectral one scorches the last stretch of its fall (trail tiles back toward its portal); a real one the whole
        // line from the mouth's floor point to where it lands
        let x0, y0; if (s.spec) { const sd = s.fire ? J.fs : -J.fs; x0 = s.x + sd * CFG.trail * 0.45; y0 = s.y - CFG.trail * 0.9; }
        else { const mo = A && (s.fire ? A.mouthL : A.mouthR); x0 = mo && mo.wx != null ? mo.wx : a.x + (s.fire ? J.fs : -J.fs) * 0.8; y0 = mo && mo.wy != null ? mo.wy : a.y - 0.2; }
        const w = s.spec ? CFG.wSpec : CFG.wReal, d = P * (s.spec ? CFG.kSpec : CFG.kReal);
        for (const m of L) { if (!inCapsule(m, x0, y0, s.x, s.y, w)) continue; const o = J.ticks % 4 === 0 || V1() ? TICK_T : TICK_Q; if (s.fire) fireHit(a, m, d, o); else iceHit(a, m, d, o); }   // (its number shown once a second: each new number is a new label picture)
      }
    }
    function burstAt(J, x, y, big, t) { const b = BUR[J.nb % BUR.length]; J.nb++; b.t0 = t; b.x = x; b.y = y; b.big = big; const a = J.a, P = pw(a);
      for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) > CFG.burstR * big + m.r) continue; fireHit(a, m, P * CFG.burst * 0.5, { noShock: true }); iceHit(a, m, P * CFG.burst * 0.5, { noShock: true }); shock(a, m, x, y, 1); }
      X.shake(5 * big, 0.25); if (Math.random() < 0.6) snd('thud'); if (!gpu()) { X.ring(x, y, 0.3, 1.8 * big, 0.4, COL.cyan, 0.2); X.ring(x, y, 0.3, 1.4 * big, 0.35, COL.fire, 0.2); } }
    function mainHit(J) { const a = J.a, P = pw(a), C = CFG.ult, R = C.r[J.k - 1]; let n = 0;
      for (const m of H.living()) { const d = Math.hypot(m.x - J.tx, m.y - J.ty); if (d > R + m.r) continue; const core = d < C.core + m.r, k = C.k1 * (1 - 0.45 * cl(d / R)) + (core ? C.kc : 0);
        fireHit(a, m, P * k * 0.5, { big: true, noCrit: true, noShock: true, kb: core ? C.kb : C.kb * 0.6 }); iceHit(a, m, P * k * 0.5, { big: true, noCrit: true, noShock: true, freeze: C.freeze }); if (core) shock(a, m, J.tx, J.ty, C.ks); n++; }
      J.n1 = n; X.flash(0.28, '#FFF4E8'); X.shake(28, 0.9); snd('crash'); X.after && X.after(0.2, () => snd('fanfare')); X.light && X.light(J.tx, J.ty, 12, 1.2); g.hitStop = Math.max(g.hitStop || 0, 0.09);
      if (!gpu()) { X.boom(J.tx, J.ty, 5, '#FF6A1A', '#FFE7B0', { n: 40, shake: 0, smoke: 8 }); X.ring(J.tx, J.ty, 0.5, R, 0.8, COL.cyan, 0.4); X.ring(J.tx, J.ty, 0.5, R * 0.8, 0.7, COL.fire, 0.4); } }
    function det(J, i) { const an = J.seed + i * 2.1, rr = 2.6, x = J.tx + Math.cos(an) * rr, y = J.ty + Math.sin(an) * rr * 0.75, a = J.a, P = pw(a);
      for (const m of H.living()) { if (Math.hypot(m.x - x, m.y - y) > CFG.ult.dR + m.r) continue; (i % 2 ? iceHit : fireHit)(a, m, P * CFG.ult.kd, { noShock: true }); }   // (no per-monster Thermal Shock here: the detonation is one; the main impact's shock has just landed)
      const b = BUR[J.nb % BUR.length]; J.nb++; b.t0 = J.t; b.x = x; b.y = y; b.big = 1.4; X.shake(12, 0.35); snd(i === 1 ? 'crash' : 'thud'); }
    function lastWave(J) { const a = J.a, P = pw(a), R = CFG.ult.r[J.k - 1] * 1.15;
      for (const m of H.living()) { const d = Math.hypot(m.x - J.tx, m.y - J.ty); if (d > R + m.r) continue; fireHit(a, m, P * CFG.ult.kw * 0.5, { noShock: true, kb: 4 }); iceHit(a, m, P * CFG.ult.kw * 0.5, { noShock: true }); }
      X.flash(0.22, '#E8F4FF'); X.shake(18, 0.5); snd('crash'); }
    function end(done) { if (!UL) return; const J = UL, a = J.a; UL = null;
      if (g.cineT > 0 && J.t < UT.hit + 0.6) g.cineT = 0; g.zoomP = 1; g.zoomT = 0;
      a.judg = false; a.hold = false; a.rzuOn = false; a.jA = 1;
      const S = poseOf(a); if (S) { S.aimL = S.aimR = null; S.coreOut = 0; S.crownOut = 0; }
      if (done) { a.st = 'leave'; a.lv = 0.8; a.alpha = 0; a.waved = true; if (H.onDone) try { H.onDone(a); } catch (e) {} } }
    function stop() { end(false); }

    /* ================= drawing ================= */
    /* the scene's screen geometry this frame (into G: no allocation) */
    function geo(c) {
      const J = UL, t = J.t, a = J.a, Tz = T(), M = c.getTransform(), k = Math.hypot(M.a, M.b) || 1;
      G.W = c.canvas.width / k; G.H = c.canvas.height / k; G.Tz = Tz; G.fs = J.fs; G.t = t;
      { const A0 = anchOf(a), bb = A0 && A0.bb; if (bb && bb[2] > bb[0] && g.zoomP > 0) { const L0 = A0.wingTipL, R0 = A0.wingTipR, span = Math.max(bb[2] - bb[0], L0 && R0 ? Math.abs(R0.x - L0.x) * 1.1 : 0), nd = cl(0.92 * G.W * g.zoomP / span); J.need += (Math.max(0.5, Math.min(1, nd)) - J.need) * (nd < J.need ? 0.25 : 0.04); } }
      const A = anchOf(a), W = G.W, Hh = G.H, fs = J.fs, kk = J.k;
      if (A && A.body) { G.body.x = A.body.x; G.body.y = A.body.y; G.body.r = A.body.r; } else { G.body.x = sx(a.x); G.body.y = sy(a.y) - Tz * 1.6; G.body.r = Tz * 1.3; }
      G.mL = A && A.mouthL || null; G.mR = A && A.mouthR || null; G.tX = sx(J.tx); G.tY = sy(J.ty);
      // the portals: from the crowns into the sky, open, turned toward each other for the Book, collapsed back to crowns at the end
      /* (v465 RZ-U) everything lives in the world, drawn through the camera: the heavens hang at world places above Raziel (WORLD: tiles off his
         feet and up), so they pan and zoom with the field and follow him if he moves; sizes are in tiles (x Tz) */
      const Rp = (WORLD.rp + 0.2 * kk) * Tz, ax0 = sx(a.x), ay0 = sy(a.y), hx0 = sx(J.hx), hy0 = sy(J.hy), inX = sstep(UT.rise, UT.coll, t) * (1 - sstep(UT.p6, UT.p6 + 0.8, t)); G.Rp = Rp; G.ax = ax0; G.ay = ay0; G.hx = hx0; G.hy = hy0;
      const pyW = hy0 - WORLD.h * Tz, mn = WORLD.span * Tz;
      const go = eout(cl((t - UT.p1) / 1.3)), back = sstep(UT.p6 + 0.1, UT.p6 + 0.8, t);
      for (let side = 0; side < 2; side++) { const P = side ? G.pI : G.pF, cr = A && (side ? A.crownR : A.crownL), sd = side ? -fs : fs;
        const hx = cr ? cr.x : G.body.x + sd * G.body.r * 0.8, hy = cr ? cr.y : G.body.y - G.body.r * 1.2, hr = cr ? cr.r : Tz * 0.8;
        const px = hx0 + sd * WORLD.dx * Tz * (1 + 0.04 * inX), py = pyW - Rp * 0.15 * inX;   // (the Book: they lift apart and turn their faces in, the two bodies between them)
        const u = go * (1 - back); P.x = lerp(hx, px, u); P.y = lerp(hy, py, u); P.r = lerp(hr, Rp, u); P.op = sstep(UT.p1 + 0.6, UT.p2, t) * (1 - sstep(UT.p6, UT.p6 + 0.6, t)); P.ang = (cr ? cr.ang : 0) * (1 - u); }
      G.sky.x = hx0; G.sky.y = pyW + Rp * 1.25;
      // the cores: out of the chest to orbit it; above its back; up between the portals to swell and spiral together; home again
      const oc = G.body, t1 = 1.0, cx0 = oc.x, cy0 = oc.y - oc.r * 0.15, orb = sstep(t1, t1 + 0.6, t), wv = t * (2.4 + 1.5 * sstep(UT.p4, UT.swell, t));
      const up = sstep(UT.p4, UT.rise, t), sp = UT.swell, spi = sstep(UT.rise, UT.coll, t), ret = sstep(UT.p6 + 0.3, UT.p6 + 1.1, t), sepR = mn * 0.3 * (1 - ein(spi)), home = 1 - ret;
      for (let side = 0; side < 2; side++) { const C = side ? G.cI : G.cF, aC = A && (side ? A.coreR : A.coreL), sd = side ? -1 : 1;
        const hx = aC ? aC.x : oc.x + (side ? -fs : fs) * oc.r * 0.25, hy = aC ? aC.y : oc.y, an = wv * 1.0 + side * Math.PI, R1 = oc.r * (1.25 - 0.25 * sstep(UT.p2, UT.p3, t));
        const ox = cx0 + Math.cos(an) * R1, oy = cy0 - oc.r * 0.6 * sstep(UT.p1, UT.p2, t) + Math.sin(an) * R1 * 0.45;
        const ang2 = t * (3 + 9 * spi) + side * Math.PI, bx = G.sky.x + Math.cos(ang2) * sepR * (0.5 + 0.5 * (1 - spi)), by = G.sky.y + Math.sin(ang2) * sepR * 0.4;
        let x = lerp(hx, ox, orb), y = lerp(hy, oy, orb); x = lerp(x, bx, up); y = lerp(y, by, up);
        if (ret > 0) { x = lerp(G.sky.x, hx, ret); y = lerp(G.sky.y, hy, ret); }
        C.x = x; C.y = y; C.r = (aC ? aC.r : oc.r * 0.18) * (1 + 0.4 * orb) * (1 - up) + mn * lerp(0.05, 0.16, sstep(UT.rise, sp + 0.2, t)) * up * (1 - ret) + (aC ? aC.r : oc.r * 0.18) * ret;
        C.vis = sstep(0.95, 1.1, t) * (t < UT.coll ? 1 : t < UT.p6 + 0.3 ? 0 : 1) * (t > UT.p6 + 1.15 ? 1 - sstep(UT.p6 + 1.1, UT.p6 + 1.2, t) : 1); void sd; void home; }
    }

    /* the ground layer: the floor dimmed and the sky split over it, then one painter pass: the divided field, rings and the floor of the blast */
    function drawGround(c) {
      if (!UL) return; geo(c); const J = UL, t = J.t, Tz = G.Tz, fs = J.fs, low = tier() < 1;
      const dim = 0.55 * sstep(0, 1.2, t) * (1 - sstep(UT.hit, UT.hit + 0.5, t)) + 0.3 * sstep(UT.hit, UT.hit + 0.5, t) * (1 - sstep(UT.p6 + 0.5, UT.len, t));
      if (dim > 0.004) { c.save(); c.globalAlpha = dim; c.fillStyle = COL.dark; const D0 = 40 * Tz, x0 = Math.max(G.ax - D0, -24), y0 = Math.max(G.ay - D0, -24), x1 = Math.min(G.ax + D0, G.W + 24), y1 = Math.min(G.ay + D0, G.H + 24); if (x1 > x0 && y1 > y0) c.fillRect(x0, y0, x1 - x0, y1 - y0);   /* (v465 RZ-U: a world square 80 tiles across round Raziel: one fill, no gradient, panning with the field) */ c.restore(); }
      const sk = sstep(UT.p1, UT.p2, t) * (1 - sstep(UT.p6, UT.len - 0.5, t)) * (0.5 + 0.25 * sstep(UT.p4, UT.swell, t));
      if (sk > 0.004) { const P = skyPic(); if (P) { c.save(); c.globalAlpha = sk; const w2 = WORLD.tint * Tz; c.translate(G.hx, G.hy); if (fs > 0) c.scale(-1, 1); c.drawImage(P, -w2, -w2 * 1.3, w2 * 2, w2 * 1.45); c.restore(); } }   // (v465 RZ-U: the sky split laid on the world round Raziel, not on the screen)
      if (!gpu()) return;
      const Q = fgOpen(c);
      // the divided battlefield: spreads out from Raziel's feet, collapses on the target, cools at the end
      const cx = lerp(sx(J.a.x), G.tX, sstep(UT.p3, UT.p4, t)), cy = lerp(sy(J.a.y), G.tY, sstep(UT.p3, UT.p4, t)), Rf = Tz * (CFG.ult.r[J.k - 1] + 2.5);
      const spread = sstep(0.6, UT.p1 + 0.6, t) * (1 - 0.55 * sstep(UT.p3 + 0.8, UT.p4 + 0.6, t)) + 0.55 * sstep(UT.hit, UT.hit + 0.4, t) * (1 - sstep(UT.hit + 0.4, UT.len, t) * 0.0);
      const heat = lerp(1.0, 1.45, sstep(UT.p3, UT.p4, t)) * (1 - 0.8 * sstep(UT.p6, UT.len, t)), fa = sstep(0.4, 1.4, t) * (1 - sstep(UT.len - 1.2, UT.len, t));
      if (fa > 0.01) Q.quad(471, cx, cy, -fs * Rf, 0, 0, Rf * FSY, '#FFFFFF', fa, Math.max(0.02, spread), heat, 1);
      // the roar's two waves (fire and frost) out of its feet
      { const u = (t - UT.roar) / 1.1; if (u > 0 && u < 1) { const R = Tz * 6.5 * eout(u); Q.shape(476, sx(J.a.x), sy(J.a.y), R * 1.08, 0, 0, R * 1.08 * FSY, '#FFFFFF', (1 - u) * 1.2, 0.92, 3, 1, 0.75, 1); Q.shape(477, sx(J.a.x), sy(J.a.y), R * 0.98, 0, 0, R * 0.98 * FSY, '#FFFFFF', (1 - u) * 1.1, 0.92, 5, 1, 0.75, 1); } }
      // the bursts' floor: a fire ring and a crystal ring
      for (const b of BUR) { const u = (t - b.t0) / 0.8; if (u < 0 || u > 1) continue; const X0 = sx(b.x), Y0 = sy(b.y), R = Tz * CFG.burstR * b.big * 1.3 * (0.3 + 0.7 * eout(u));
        Q.shape(476, X0, Y0, R * 1.1, 0, 0, R * 1.1 * FSY, '#FFFFFF', 1 - u, 0.9, b.seed, 1, 0.7, 1); Q.shape(477, X0, Y0, R * 0.95, 0, 0, R * 0.95 * FSY, '#FFFFFF', 1 - u, 0.92, b.seed + 2, 1, 0.7, 1); }
      // the eruption's floor: fire rings and crystal shockwaves one after another, the last celestial shockwave
      if (t > UT.hit) { const X0 = G.tX, Y0 = G.tY, RR = Tz * CFG.ult.r[J.k - 1];
        for (let i = 0; i < 1 + J.k; i++) { const u = (t - UT.hit - i * 0.22) / 1.1; if (u > 0 && u < 1) { const R = RR * (0.5 + 0.35 * i) * eout(u) + Tz; Q.shape(476, X0, Y0, R * 1.08, 0, 0, R * 1.08 * FSY, '#FFFFFF', (1 - u) * 1.3, 0.92, 11 + i, 1.2, 0.7, 1); } }
        for (let i = 0; i < 2; i++) { const u = (t - UT.hit - 0.1 - i * 0.3) / 1.0; if (u > 0 && u < 1) { const R = RR * (0.65 + 0.4 * i) * eout(u) + Tz; Q.shape(477, X0, Y0, R * 1.05, 0, 0, R * 1.05 * FSY, '#FFFFFF', (1 - u) * 1.3, 0.93, 21 + i, 1.2, 0.72, 1); } }
        { const u = (t - UT.wave) / 1.2; if (u > 0 && u < 1) { const R = RR * 1.25 * eout(u) + Tz; Q.shape(476, X0, Y0, R * 1.06, 0, 0, R * 1.06 * FSY, '#FFFFFF', (1 - u) * 1.1, 0.94, 31, 1, 0.75, 1); Q.shape(477, X0, Y0, R, 0, 0, R * FSY, '#FFFFFF', (1 - u) * 1.1, 0.94, 33, 1, 0.75, 1); Q.ring(X0, Y0, R * 0.98, COL.white, 0.5 * (1 - u), Tz * 0.12, FSY); } }
        // the floor's glow under the pillar and the plasma: white-gold on the fire half, white-blue on the ice half
        const gl = bump(t, UT.hit - 0.05, UT.hit + 0.05, UT.hit + 0.4, UT.hit + 1.2); if (gl > 0.01) { Q.glow(X0 + fs * RR * 0.18, Y0, RR * 0.45, COL.fire, 0.24 * gl, FSY); Q.glow(X0 - fs * RR * 0.18, Y0, RR * 0.45, COL.sap, 0.24 * gl, FSY); } }
      // the pillar's light on the floor before it lands, the streams' scorch where they touch
      if (t > UT.p3 && t < UT.p4) for (const s of STR) { const X0 = sx(s.x), Y0 = sy(s.y), fl = 0.7 + 0.3 * Math.sin(t * 23 + s.i); Q.glow(X0, Y0, Tz * (s.spec ? 1.6 : 1.1), s.fire ? COL.fire : COL.cyan, 0.45 * fl, FSY); }
      if (!low && t > UT.p4 && t < UT.hit) { const u = sstep(UT.breath, UT.hit, t); if (u > 0) Q.glow(G.tX, G.tY, Tz * (1 + 2.5 * u), COL.white, 0.5 * u, FSY); }
      fgClose(c);
    }

    /* the air layer, first half: the portals (fire surface or crystal vault, their astrolabe rings), the streams to the cores, the cores */
    function ringSet(Q, P, fire, t, low, sp) {
      const R = P.r, col = fire ? COL.goldM : COL.plat, s0 = fire ? 1 : 2, dep = R * 0.045, nr = 1 + UL.k;
      for (let i = 0; i < nr; i++) { const rr = R * RR3[i], tl = i === 0 ? 1 : i === 1 ? 0.72 + 0.12 * Math.sin(t * 0.7 + i) : i === 2 ? 0.55 + 0.2 * Math.cos(t * 0.5 + i * 2) : 0.36 + 0.08 * Math.sin(t * 0.9), rot = (fire ? 1 : -1) * t * (0.25 + 0.2 * i) * sp + i * 1.1 + P.ang,
          c0 = Math.cos(rot), s1 = Math.sin(rot), ux = c0 * rr, uy = s1 * rr, vx = -s1 * rr * tl, vy = c0 * rr * tl, sty = i === 0 ? s0 : 0, ri = i === 0 ? 0.72 : i === 3 ? 0.8 : 0.78, spin = (fire ? -1 : 1) * t * (0.6 + 0.4 * i) * sp;
        if (!low) Q.quad(468, P.x + dep, P.y + dep * 1.4, ux, uy, vx, vy, '#2A2228', 0.85, ri, sty, spin);   // its depth: the band's dark far side
        Q.quad(468, P.x, P.y, ux, uy, vx, vy, col, 1, ri, sty, spin); }
    }
    function airA(Q, t, low) {
      const J = UL, fs = J.fs;
      // the portals' surfaces, then their rings
      for (let side = 0; side < 2; side++) { const P = side ? G.pI : G.pF; if (P.op <= 0.01 && t < UT.p1) continue; const R = P.r, al = sstep(UT.p1, UT.p1 + 0.5, t) * (1 - sstep(UT.p6 + 0.5, UT.p6 + 0.9, t)) * (1 - 0.4 * bump(t, UT.rise, UT.swell, UT.coll, UT.p6));
        if (al <= 0.01) continue; if (P.op > 0.01) Q.shape(side ? 467 : 466, P.x, P.y, R * 1.35, 0, 0, R * 1.35, '#FFFFFF', al, P.op, side ? -1 : 1, 1.1, 0, 1);
        Q.glow(P.x, P.y, R * 1.9, side ? COL.sap : COL.fire, 0.18 * al * P.op);
        ringSet(Q, P, !side, t, low, 1 + 2 * sstep(UT.p1, UT.p2, t) + 2 * bump(t, UT.rise, UT.swell, UT.coll, UT.p6)); }
      // the streams from each heaven to its core (P2..P4), then the cores themselves (P1..P5) and their rings
      const st = sstep(UT.p2 - 0.6, UT.p2, t) * (1 - sstep(UT.p4, UT.rise, t)) * (1 - sstep(UT.p6 + 0.8, UT.p6 + 1.2, t));
      if (st > 0.01) { const fl = 0.75 + 0.25 * Math.sin(t * 13); Q.ebeam(G.pF.x, G.pF.y, G.cF.x, G.cF.y, G.pF.r * 0.1, COL.fire, 0.8, 0.6 * st * fl, 3, 5); Q.ebeam(G.pI.x, G.pI.y, G.cI.x, G.cI.y, G.pI.r * 0.08, COL.cyan, 0.7, 0.55 * st, 7, 2);
        Q.beam(G.pF.x, G.pF.y, G.cF.x, G.cF.y, G.pF.r * 0.03, COL.white, 0.5 * st); Q.beam(G.pI.x, G.pI.y, G.cI.x, G.cI.y, G.pI.r * 0.025, COL.ice, 0.5 * st); }
      for (let side = 0; side < 2; side++) { const C = side ? G.cI : G.cF; if (C.vis <= 0.01) continue; const r = Math.max(3, C.r), pul = 1 + 0.12 * Math.sin(t * 17 + side);
        if (side) { Q.shape(473, C.x, C.y, r * 1.6 * pul, 0, 0, r * 1.6 * pul, '#FFFFFF', C.vis, 1 / 1.6, Math.atan2(G.cF.y - C.y, G.cF.x - C.x), 1.1, 0, 1); }
        else Q.shape(472, C.x, C.y, r * 1.7 * pul, 0, 0, r * 1.7 * pul, '#FFFFFF', C.vis, 1 / 1.7, 0.6 + 0.4 * sstep(UT.rise, UT.swell, t), 1.2, 0, 1);
        if (t < UT.rise + 0.4 && r > 4) { const rr = r * 1.45, sp = t * (side ? -2.6 : 3.1); Q.quad(468, C.x, C.y, rr, 0, 0, rr * 0.6, side ? COL.plat : COL.goldM, C.vis, 0.8, side ? 2 : 1, sp); Q.quad(468, C.x, C.y, 0, rr * 0.82, rr * 0.82 * 0.55, 0, side ? COL.plat : COL.goldM, C.vis * 0.9, 0.82, 0, -sp * 0.7); } }
      void fs;
    }
    /* the spectral dragons (P3..P5) and their silhouettes thrown out by the eruption: RAZIEL_GL.drawSpectral between the two halves */
    function spectralOn(t) { return (t > UT.p3 - 1.9 && t < UT.rise + 0.7) || (t > UT.hit - 0.02 && t < UT.hit + 0.85 && tier() >= 2); }   // (v465 RZ-U: the silhouettes thrown out by the eruption on High only)
    function drawSpectrals(c, t) {
      const R = GLR(); if (!R || !R.drawSpectral) return; const J = UL, a = J.a, Tz = G.Tz, S0 = poseOf(a) || {};
      const evo = S0.evo || [1, 4, 7][J.k - 1], tile = Tz;
      for (let side = 0; side < 2; side++) { const P = side ? G.pI : G.pF, S = side ? SPR : SPL, O = side ? OPR : OPL, sd = side ? -J.fs : J.fs;
        let x, y, size, al, fade, emg;
        if (t < UT.rise + 0.7) { const e = sstep(UT.p3 - 1.8, UT.p3 - 0.2, t); size = P.r * (0.9 + 0.08 * UL.k + 0.25 * e); x = P.x - sd * P.r * 0.1; y = P.y + size * 0.62 - P.r * 0.15 * e; al = sstep(UT.p3 - 1.8, UT.p3 - 1.1, t); fade = sstep(UT.p4 - 0.2, UT.rise + 0.6, t); emg = 1 - 0.75 * e; }
        else { const u = cl((t - UT.hit) / 0.85); size = Tz * (5 + 6 * eout(u)); x = G.tX + sd * Tz * (1.5 + 6 * eout(u)); y = G.tY + Tz * 0.5 - Tz * 2.5 * eout(u); al = 0.75 * (1 - u); fade = 0.45 + 0.5 * u; emg = 0; }
        if (al <= 0.01) continue;
        S.t = 100 + t; S.evo = evo; S.lowFx = lowFx(); S.x = J.a.x + (x - sx(J.a.x)) / Tz; S.y = J.a.y + (y - sy(J.a.y)) / Tz; S.face = Math.atan2(J.ty - S.y, J.tx - S.x);
        const s = side ? STR[1] : STR[0], aim = side ? S.aimR : S.aimL; if (t < UT.rise) { aim.x = t > UT.p3 - 0.3 ? s.x : J.tx; aim.y = t > UT.p3 - 0.3 ? s.y : J.ty; } else { aim.x = J.tx; aim.y = J.ty; }
        const jw = Math.max(bump(t, UT.p3 - 1.0, UT.p3 - 0.7, UT.p3 - 0.5, UT.p3 - 0.2), bump(t, UT.p3 - 0.1, UT.p3 + 0.1, UT.p4 - 0.2, UT.p4 + 0.2), t > UT.hit ? 1 : 0);
        if (side) { S.jawR = jw; S.chargeR = 1; } else { S.jawL = jw; S.chargeL = 1; }
        S.roar = bump(t, UT.p3 - 1.0, UT.p3 - 0.75, UT.p3 - 0.45, UT.p3 - 0.2); S.wing = 1; S.beat = 0.3 + 0.3 * (t > UT.hit ? 1 : 0); S.fly = 0.15;
        O.alpha = al; O.fade = fade; O.emerge = emg; O.tile = tile; S.alpha = al; S.dissolve = fade;
        size *= J.spk[side]; let An = null; try { An = R.drawSpectral(c, x, y, size, S, side ? 'R' : 'L', O); } catch (e) { An = null; }
        if (An && An.bb && t < UT.rise + 0.7) { const wd = An.bb[2] - An.bb[0], want = P.r * 2.6; if (wd > 1) J.spk[side] = Math.max(0.4, Math.min(1.3, J.spk[side] * Math.pow(want / wd, 0.25))); }   // (its drawn width, wings and all, kept to its portal's: the model's size may change)
        const mo = An && (An.mouth || (side ? An.mouthR : An.mouthL));
        if (side) G.sR = mo || null; else G.sL = mo || null;
        if (!mo) { const M = side ? FAKE_R : FAKE_L; M.x = x + sd * -size * 0.25; M.y = y - size * 0.72; M.dx = 0; M.dy = 1; if (side) G.sR = M; else G.sL = M; }
      }
    }
    const FAKE_L = { x: 0, y: 0, dx: 0, dy: 1 }, FAKE_R = { x: 0, y: 0, dx: 0, dy: 1 };
    /* a breath stream (469 fire / 470 ice) from a mouth to a floor point: its quad wide enough for its bend */
    function stream(Q, fire, x0, y0, x1, y1, w, al, seed, bend) {
      const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 2 || al < 0.01) return; const hw = w * (1 + Math.abs(bend));
      Q.quad(fire ? 469 : 470, x0 + dx, y0 + dy, dx, dy, -dy / L * hw, dx / L * hw, '#FFFFFF', al, bend / (1 + Math.abs(bend)), seed, 1);
    }
    /* the air layer, second half: the breaths, the bursts, the two celestial bodies, the singularity, the pillar, the eruption, the dissolve */
    function airB(Q, t, low) {
      const J = UL, Tz = G.Tz, fs = J.fs, k = J.k, rich = tier() >= 2;
      // P4: the spectral torrent and beam from the sky, the real breaths from the mouths
      const s4 = bump(t, UT.p3 - 0.15, UT.p3 + 0.15, UT.p4 - 0.25, UT.p4 + 0.1);
      if (s4 > 0.01) {
        for (let i = 0; i < 4; i++) { const s = STR[i], X1 = sx(s.x), Y1 = sy(s.y); let mo = s.spec ? (i === 0 ? G.sL : G.sR) : (i === 2 ? G.mL : G.mR);
          if (!s.spec && !mo) { FAKE_M.x = G.body.x + (s.fire ? fs : -fs) * G.body.r * 0.5; FAKE_M.y = G.body.y - G.body.r * 0.9; mo = FAKE_M; }
          if (!mo) continue; const w = s.spec ? Tz * (1.3 + 0.15 * k) : Tz * (0.75 + 0.1 * k), bend = (s.fire ? 1 : -1) * 0.35 * Math.sin(t * 1.7 + i);
          stream(Q, s.fire, mo.x, mo.y, X1, Y1, w, s4 * (s.spec ? 1.15 : 1), i * 3.1 + J.seed % 7, bend);
          Q.glow(X1, Y1 - Tz * 0.3, Tz * (s.spec ? 1.5 : 1.0), s.fire ? COL.hot : COL.ice, 0.4 * s4);
          if (rich) Q.shape(479, X1, Y1 - Tz * 0.6, Tz * (s.spec ? 2.2 : 1.6), 0, 0, Tz * (s.spec ? 2.2 : 1.6), '#FFFFFF', s4, (t * 0.7 + i * 0.25) % 1, i * 5 + 3, s.fire ? 0.9 : -0.9, 0, 1); }   // (v465 RZ-U, High: embers / ice fragments thrown up where each stream lands)
      }
      // the Thermal Shock bursts: a white flash, a steam bloom, embers one way and ice the other
      for (const b of BUR) { const u = (t - b.t0) / 1.2; if (u < 0 || u > 1) continue; const X0 = sx(b.x), Y0 = sy(b.y), R = Tz * CFG.burstR * b.big;
        if (u < 0.25) Q.glow(X0, Y0 - Tz * 0.4, R * (0.6 + 2 * u), COL.white, 0.9 * (1 - u / 0.25));
        if (u < 0.5) Q.shape(474, X0, Y0 - Tz * 0.5, R * 0.9, 0, 0, R * 0.9, '#FFFFFF', (1 - u * 2) * 0.9, 0.28, 1, 1, 0, 1);
        const sn = low ? 1 : 3; for (let j = 0; j < sn; j++) { const an = b.seed + j * 2.1, rr = R * (0.2 + 0.5 * eout(u)); Q.smoke(X0 + Math.cos(an) * rr, Y0 - Tz * (0.4 + 1.6 * u) + Math.sin(an) * rr * 0.4, R * (0.45 + 0.4 * u), 0.45 * (1 - u) * sstep(0, 0.12, u), b.seed + j, COL.steam, 0.12 * (1 - u)); }
        Q.shape(479, X0 + fs * R * 0.3, Y0 - Tz * 0.6, R * 1.4, 0, 0, R * 1.4, '#FFFFFF', 1 - u, u, b.seed, 0.8 * LQ(), 0, 1); Q.shape(479, X0 - fs * R * 0.3, Y0 - Tz * 0.6, R * 1.4, 0, 0, R * 1.4, '#FFFFFF', 1 - u, u, b.seed + 3, -0.8 * LQ(), 0, 1); }
      // P5: the artificial sun and the frozen sphere, white instability where they near; the hush; the collision; the singularity
      if (t > UT.rise && t < UT.coll + 0.05) { const d = Math.hypot(G.cF.x - G.cI.x, G.cF.y - G.cI.y), near2 = 1 - cl((d - (G.cF.r + G.cI.r) * 1.1) / (WORLD.span * Tz * 0.25)), ins = sstep(UT.swell - 0.3, UT.coll, t) * near2;
        if (ins > 0.05) { const mx = (G.cF.x + G.cI.x) / 2, my = (G.cF.y + G.cI.y) / 2, nx = -(G.cI.y - G.cF.y) / (d || 1), ny = (G.cI.x - G.cF.x) / (d || 1);
          for (let j = 0; j < (low ? 3 : 6); j++) { const L0 = (Math.random() - 0.5) * (G.cF.r + G.cI.r) * 1.4, x0 = mx + nx * L0, y0 = my + ny * L0, x1 = x0 + (Math.random() - 0.5) * G.cF.r * 0.9, y1 = y0 + (Math.random() - 0.5) * G.cF.r * 0.9, x2 = x1 + (Math.random() - 0.5) * G.cF.r * 0.7, y2 = y1 + (Math.random() - 0.5) * G.cF.r * 0.7;
            Q.beam(x0, y0, x1, y1, Tz * 0.07, COL.white, 0.9 * ins); Q.beam(x1, y1, x2, y2, Tz * 0.05, COL.white, 0.7 * ins); }
          for (let j = 0; j < (low ? 2 : 4); j++) { const an = j * 1.7 + t * 0.6; Q.smoke(mx + Math.cos(an) * d * 0.25, my + Math.sin(an) * d * 0.15, Math.max(G.cF.r, G.cI.r) * 0.7, 0.4 * ins, j + 31, COL.steam, 0.4); } } }
      { const u = (t - UT.coll) / (UT.p6 + 0.3 - UT.coll); if (u > 0 && u < 1) { const R = WORLD.span * Tz * 0.11 * (0.4 + 0.6 * eout(u * 3)) * (1 - 0.6 * sstep(0.7, 1, u)), fl = u < 0.06 ? 1 - u / 0.06 : 0;
        Q.shape(474, G.sky.x, G.sky.y, R * 3.6, 0, 0, R * 3.6, '#FFFFFF', 1.1 * (1 - sstep(0.75, 1, u)), 0.28, 1, 1.2, 0, 1); if (fl > 0) Q.glow(G.sky.x, G.sky.y, R * 6, COL.white, 0.8 * fl);
        // the singularity channels into the convergence point
        const ch = bump(t, UT.breath, UT.pillar - 0.05, UT.hit, UT.hit + 0.3); if (ch > 0.01) Q.ebeam(G.sky.x, G.sky.y, G.tX, G.tY - Tz * 1.0, Tz * 0.35, COL.white, 1.0, 0.7 * ch, 13, 6); } }
      // P5: both heads breathe on the target, the pillar falls
      { const b5 = bump(t, UT.breath - 0.05, UT.breath + 0.12, UT.hit + 0.15, UT.hit + 0.5); if (b5 > 0.01) for (let i = 0; i < 2; i++) { const fire = i === 0; let mo = fire ? G.mL : G.mR;
          if (!mo) { FAKE_M.x = G.body.x + (fire ? fs : -fs) * G.body.r * 0.5; FAKE_M.y = G.body.y - G.body.r * 0.9; mo = FAKE_M; } stream(Q, fire, mo.x, mo.y, G.tX, G.tY - Tz * 0.2, Tz * (1.15 + 0.15 * k), b5 * 1.25, 17 + i, fire ? 0.25 : -0.25); } }
      { const u = (t - UT.pillar) / (UT.hit + 1.3 - UT.pillar); if (u > 0 && u < 1) { const top = G.tY - WORLD.pillar * Tz, h2 = (G.tY - top) / 2, w = Tz * (1.2 + 0.25 * k) * (1 + 0.5 * sstep(0.25, 0.4, u)), desc = cl(u / 0.16), fade = 1 - 0.75 * sstep(0.14, 0.3, u) - 0.25 * sstep(0.3, 0.7, u);
        Q.quad(475, G.tX, top + h2, w, 0, 0, h2, '#FFFFFF', 1.2 * fade, desc, 5, 1); } }
      // the eruption: flash, molten plasma sphere, ice formations, steam on the divide, fragments, ribbons, the fields
      if (t > UT.hit) { const tt = t - UT.hit, X0 = G.tX, Y0 = G.tY, RR = Tz * CFG.ult.r[k - 1];
        if (tt < 0.25) Q.glow(X0, Y0 - Tz, RR * (0.25 + tt * 1.6), COL.white, 0.6 * (1 - tt / 0.25));
        { const u = cl(tt / 2.2); if (u < 1) { const R = RR * 0.42 * (0.35 + 0.65 * eout(u * 1.4)); Q.shape(472, X0 + fs * RR * 0.3, Y0 - R * 0.55, R * 1.45, 0, 0, R * 1.45, '#FFFFFF', 1.0 * (1 - sstep(0.4, 1, u)), 1 / 1.45, 1.1 - u, 1.0, 0, 1);
          if (u < 0.6) { const R2 = R * 0.85 * (1 + 0.25 * eout(u / 0.6)); Q.shape(473, X0 - fs * RR * 0.3, Y0 - R2 * 0.55, R2 * 1.4, 0, 0, R2 * 1.4, '#FFFFFF', 0.95 * (1 - sstep(0.25, 0.6, u)), 1 / 1.4, fs > 0 ? 0 : Math.PI, 1.0, 0, 1); } } }   // (its frozen twin, cracking apart on the ice side)
        for (let fi = 0; fi < 4 + 2 * k - (k > 2 ? 2 : 0); fi++) { const f = ICE[fi], age = t - f.t0; if (age < 0) continue; const gr = eout(cl(age / 0.3)), fr = sstep(UT.p6 + 0.4, UT.p6 + 1.6, t) * 2, s = f.s * Tz * (1 + 0.15 * k); if (fr >= 1.98) continue;
          Q.quad(478, sx(f.x), sy(f.y) - s * 1.2, s * 1.3, 0, 0, s * 1.3, '#FFFFFF', 1, fr, f.seed, gr); if (age < 0.4) Q.glow(sx(f.x), sy(f.y), s * 1.4, COL.cyan, 0.5 * (1 - age / 0.4), FSY); }
        const sn = low ? 4 : 8; for (let j = 0; j < sn; j++) { const u = (tt - 0.15 - j * 0.07) / 3.2; if (u <= 0 || u >= 1) continue; const yy = (j / (sn - 1) - 0.5) * 2, px = X0 + Math.sin(j * 1.9 + tt * 0.4) * Tz * 0.8, py = Y0 + yy * RR * 0.55 * FSY - Tz * (0.6 + 2.2 * u);
          Q.smoke(px, py, RR * (0.1 + 0.1 * u), 0.42 * (1 - u) * sstep(0, 0.1, u), j + 51, COL.steam, 0.12 * (1 - u)); }
        const fn = low ? 6 : 3 + 3 * k; for (let i = 0; i < fn; i++) { const f = FRAG[i], u = tt / 1.9; if (u >= 1) continue; const d = f.v * tt * (1 - 0.35 * tt / 1.9), px = X0 + Math.cos(f.an) * d * Tz, py = Y0 + Math.sin(f.an) * d * Tz * FSY - (f.up * tt - 3.2 * tt * tt) * Tz, s = f.s * Tz * 1.3, r0 = f.spin * tt;
          Q.quad(468, px, py, Math.cos(r0) * s, Math.sin(r0) * s, -Math.sin(r0) * s * 0.6, Math.cos(r0) * s * 0.6, f.gold ? COL.goldM : COL.plat, 1 - sstep(0.7, 1, u), 0.72, 3.13 + (i % 3) * 0.04, 0);
          if (!low) Q.glow(px, py, s * 1.2, f.gold ? COL.fire : COL.cyan, 0.3 * (1 - u)); }
        const rn = low ? 4 : 3 + k; for (let i = 0; i < rn; i++) { const u = (tt - 0.05) / 1.4; if (u <= 0 || u >= 1) continue; const a0 = i / rn * TAU + J.seed * 0.1, fire = i % 2 === 0, col = fire ? COL.fire : COL.cyan; let px = X0, py = Y0 - Tz * 0.8;
          for (let j = 1; j <= 4; j++) { const q = j / 4 * eout(u), an = a0 + q * 1.6 * (fire ? 1 : -1), rr = RR * 0.85 * q, nx = X0 + Math.cos(an) * rr, ny = Y0 - Tz * 0.8 + Math.sin(an) * rr * 0.6 - Tz * 1.5 * q; Q.beam(px, py, nx, ny, Tz * 0.22 * (1 - q * 0.5), col, 0.85 * (1 - u)); px = nx; py = ny; } }
        { const u = cl(tt / 3.0); if (u < 1) { const fr = V1() ? 1.0 : 0.62; Q.shape(479, X0 + fs * RR * 0.4, Y0 - RR * 0.35, RR * fr, 0, 0, RR * fr, '#FFFFFF', 1, u, J.seed % 13, 1.0 * LQ(), 0, 1); Q.shape(479, X0 - fs * RR * 0.4, Y0 - RR * 0.3, RR * fr, 0, 0, RR * fr, '#FFFFFF', 1, u, J.seed % 17 + 4, -1.0 * LQ(), 0, 1); } } }
      // P6: the steam rising across the field, the portals' last light; the dissolve into two spiralling streams and the white point
      if (t > UT.p6 + 0.6 && t < UT.len) { const u = cl((t - UT.p6 - 0.6) / 2.0); if (!low) for (let j = 0; j < 4; j++) { const v = (u + j * 0.25) % 1, px = G.tX + (j - 1.5) * Tz * 2.0, py = G.tY - Tz * (0.4 + 2.0 * v); Q.smoke(px, py, Tz * (1.2 + v), 0.35 * Math.sin(Math.PI * v) * (1 - sstep(UT.white, UT.len, t)), j + 71, COL.steam, 0.3); } }
      if (t > UT.diss - 0.1) { const u = cl((t - UT.diss) / (UT.white - UT.diss)), ax = G.body.x, ay = G.ay - WORLD.white * Tz, n = low ? 10 : 18, fadeOut = 1 - sstep(UT.white + 0.15, UT.len, t);
        for (let s = 0; s < 2; s++) { const fire = s === 0, col = fire ? COL.fire : COL.cyan, col2 = fire ? COL.hot : COL.ice;
          for (let i = 0; i < n; i++) { const q = ((i / n) + t * 0.9) % 1; if (q > u * 1.15) continue; const hx = lerp(G.body.x, ax, q), hy = lerp(G.body.y, ay, ein(q)), rr = G.body.r * 1.1 * (1 - q) * (1 - 0.5 * u), an = q * 9 + t * 4 + s * Math.PI;
            const px = hx + Math.cos(an) * rr, py = hy + Math.sin(an) * rr * 0.45, al = 0.75 * Math.sin(Math.PI * cl(q / Math.max(0.05, u * 1.15))) * fadeOut;
            if (fire) Q.glow(px, py, Tz * 0.22, col, al); else Q.star(px, py, Tz * 0.2, al, col2); if (i % 3 === 0) Q.star(px, py, Tz * 0.12, al, col2); } }
        const wp = bump(t, UT.white - 0.3, UT.white, UT.white + 0.15, UT.len); if (wp > 0.01) { Q.glow(ax, ay, Tz * 2.2 * wp, COL.white, 0.9 * wp); Q.star(ax, ay, Tz * 1.4 * wp, wp, COL.white); } }
    }
    const FAKE_M = { x: 0, y: 0, dx: 0, dy: 1 };
    function fakeMouths() { if (!G.sL || G.sL === FAKE_L) { FAKE_L.x = G.pF.x; FAKE_L.y = G.pF.y + G.pF.r * 0.3; G.sL = FAKE_L; } if (!G.sR || G.sR === FAKE_R) { FAKE_R.x = G.pI.x; FAKE_R.y = G.pI.y + G.pI.r * 0.3; G.sR = FAKE_R; } }
    function drawFx(c) {
      if (!UL) return; geo(c); const t = UL.t, low = tier() < 1;   // (v465 RZ-U: always re-measured here, after the model is drawn: its anchors are this frame's, with this frame's camera and shake; the ground layer's, before the model, were the last frame's)
      if (!gpu()) return;
      const spec = spectralOn(t) && glOn();
      if (V1()) {   // (the first build's order, for A/B measurements: the painter pass split round the spectral dragons)
        G.sL = G.sR = null; let Q = fgOpen(c); airA(Q, t, low);
        if (spec) { fgClose(c); drawSpectrals(c, t); Q = fgOpen(c); }
        fakeMouths(); airB(Q, t, low); fgClose(c); return; }
      /* one painter pass for the whole air layer, then the spectral dragons over it (their breaths start inside their mouths, from the
         mouths' places drawn last frame): one GL -> 2D copy fewer a frame while they are out */
      if (!spec) G.sL = G.sR = null; fakeMouths();
      const Q = fgOpen(c); airA(Q, t, low); airB(Q, t, low); fgClose(c);
      if (spec) drawSpectrals(c, t);
    }
    /* screen space: only a brief vignette at the impact (v465 RZ-U) */
    function drawCine(c, W, Hh) {
      if (!UL) return; const t = UL.t, v = 0.45 * bump(t, UT.hit - 0.12, UT.hit, UT.hit + 0.15, UT.hit + 0.6);   // (v465 RZ-U: the only screen-space layer left: a brief darkening of the edges at the impact; everything else is in the world)
      if (v > 0.01) { const P = vigPic(); if (P) { c.save(); c.globalAlpha = v; c.drawImage(P, 0, 0, W, Hh); c.restore(); } }
    }
    /* prewarm: the picture caches and the painter's program before the summon needs them */
    function warm() { skyPic(); vigPic(); try { const N = NMv(); if (N && N.FGFX) N.FGFX.usable(); } catch (e) {} }
    return { start, update, drawGround, drawFx, drawCine, active, stop, warm, T: UT, CFG, get ul() { return UL; }, get geo() { return G; } /* v465 RZ-U: the scene's screen places this frame (tests) */, get streams() { return STR; } };
  }
  return { create, UT, CFG };
})();
if (typeof self !== 'undefined') self.RAZIEL_ULT = RAZIEL_ULT;
