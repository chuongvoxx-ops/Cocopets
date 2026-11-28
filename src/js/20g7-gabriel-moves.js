/* ---------- (v475 GA) Gabriel, The Sacred Oracle, in a fight: Grace Threads, four powers, Eden Reborn (20g7b) ----------
   Summoned, Gabriel (the Virgo Anima, 02e; its model GABRIEL_GL, 02f8) fights through the Anima cycle (20g calls tick / fin / update and the
   draw hooks below). Light (the game's pink 'prism'). The user's summon rules: 30 s of active time from combat-ready (the entrance is not
   counted), no cooldown on any power (only a power's own animation and its effect's duration), autonomous, the ultimate once as its time
   ends, and it leaves only when the ultimate's last frame is done. It drives every motion of the model through the pose S (api.md):
   flight, wings, neck, legs, tail, the Heart of Eden, the Bound Oracle's own gestures, the halo and the twelve physical petals.
   Grace Threads: support powers lay Grace Hearts on the pet (me.gbGrace, max CFG.grace.max, refreshed, +CFG.grace.k healing and shield
   received from Gabriel each); offensive powers lay Judgement Marks on monsters (m.gbJ, max CFG.mark.max, a fractured pink crystal heart
   over them; allies' blows +CFG.mark.k each); Thresher of Stars and Eden Reborn consume them for extra Light damage.
     Bloom of Mercy     it hovers over the pet, the Oracle prays, the Heart pulses and opens, crystalline hearts fly to the pet and open
                        like flowers: a heal (lv4 + one ordinary status cleansed; lv7 + a 5 s restoration field), Grace +1, lilies bloom.
     Harvest Halo       the Oracle raises one arm, the halo races, 3 / 5 / 7 petals leave it as blades on curved paths, strike, mark,
                        and return (lv7: they converge into a blooming crystal heart).
     Sanctuary Weave    over the pet the Oracle spreads its arms, its wrist cuffs unfold, the twelve petals ring the pet in a heart and
                        their threads weave a heart cathedral dome: mitigation, a shield, Grace +1 (lv4 periodic cleanse, lv7 a burst
                        as it ends). One at a time: a recast replaces it. Never against a boss's named mechanics (see ward).
     Thresher of Stars  it rises, wings full, the Oracle raises both hands, the petals ring the target, a celestial spear forms and falls:
                        heavy Light damage, marks consumed, a heart shockwave blooming into a lotus (1 / 2 / 3 spears, lv7 a heart detonation).
   The mind: no cooldowns; heals only when the pet needs it, shields when the pet takes real damage, otherwise attacks.
   Heals go through the game's heal (curses that forbid healing refuse it), shields through g.guardHP (its own share tracked and
   removed when it expires, capped), mitigation through a ward that ignores a boss's named mechanics; a party wipe is never touched.
   Effects: the FGFX painter (kinds 690..699, 20k6h) and Gabriel's materials (drawParts); without them the powers act in full with the
   game's particles. lowFx thins cosmetics only. stop() / the end: every mark, Grace Heart, shield share, ward and effect dropped,
   the GPU meshes freed. */
const GABRIEL_MOVES = (() => {
  const { sin, cos, hypot, max, min, abs, exp, pow, atan2 } = Math, TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - pow(1 - cl(u), 3);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t)), ex = (r, dt) => 1 - exp(-r * dt);
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const FSY = 0.55, BIG = 1.0, EVO = [1, 1, 4, 7], FACE0 = 1.62;
  /* the numbers: damage x P (the pet's attack x ANIMA_POWER[form]); heals and shields x the pet's max health; [a, b, c] by form */
  const CFG = {
    life: 30, enter: 4.4, formK: [1.4, 1.15, 1.0],
    move: { hover: 0.62, high: 1.0, fly: 5.2, cruise: 3.0, acc: 2.4, arrive: 1.6, up: 2.4, maxR: 4.2, maxRy: 3.4, perch: 3.5 },
    grace: { max: 3, dur: 12, k: 0.12 },
    mark: { max: 3, dur: 9, k: 0.04 },
    bloom: { heal: [0.16, 0.22, 0.26], n: [5, 7, 9], pray: 0.55, launch: 0.85, fly: 0.75, end: 2.6, field: 5, fieldHeal: 0.03, fieldR: 2.3, need: 0.72 },
    harv: { n: [3, 5, 7], dmg: [1.15, 1.2, 1.25], side: 0.45, wind: 0.55, gap: 0.09, out: 0.5, back: 0.62, conv: 2.6, convR: 2.6, reach: 10 },
    sanct: { dur: [6, 7, 8], red: [0.3, 0.4, 0.5], shield: [0.1, 0.14, 0.18], R: [2.4, 2.8, 3.2], cast: 1.3, end: 2.3, cleanse: 2, boom: 3.2, boomR: 3.8, shT: 10, cap: 0.3 },
    thr: { n: [1, 2, 3], rise: 0.6, form: 1.05, drop: 0.3, gap: 0.8, dmg: 2.7, R: 2.4, mark: 0.9, det: 4.2, detR: 4.0, stun: 0.45, rec: 0.8 },
  };
  const COL = { pink: '#FF6FB5', rose: '#FF9BD2', blush: '#FFD3EA', mag: '#FF2E9A', gold: '#FFC86B', pearl: '#FFF4FA', white: '#FFFFFF' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const GLG = () => (typeof GABRIEL_GL !== 'undefined' ? GABRIEL_GL : null);
  /* ---- the painter's pictures (pure: Q an open FGFX batch, screen px; kinds 690..699 in 20k6h, their documentation here; 690, 692, 696,
     698, 699 laid over, the rest added light):
     690 heart: a crystal heart, faceted rose quartz in a bevelled gold frame, a filigree line, lit inside; q0 fractured 0..1 (a Judgement
         Mark), q1 its inner light, q2 open (its halves part like a flower). 691 wave: a heart-shaped shockwave on the floor (a unit disc):
         q0 its front 0..1, q1 blooming into a lotus behind it, q2 the front's width. 692 flower: q0 grow, q1 style (0 a white lily, 1 a
         two-layer pink lotus, 2 a rose-quartz flower, 3 a lone drifting petal), q2 seed / turn. 693 thread: a Grace Thread (uv.x along,
         uv.y across): a fine pink line gently curving (q2), soft pulses running along it (q0 their phase), feathered ends; v_c its colour.
         694 seal: the Virgo seal on the floor: three rings, a tick band, twelve heart ornaments, spokes, a heart at its centre; drawn round
         by q0, turned by q1, q2 strength. 695 pillar: uv.y -1 top .. 1 foot; q0 0 a pillar, 1 a waterfall of light; q1 tint (1 pink,
         2 magenta, 3 white). 696 ground: Eden's meadow (laid over, partly see-through) grown out to q0, light rivers, small flowers, a great
         faint heart; q1 seed. 697 dome: the Sanctuary's cathedral (uv.y -1 apex .. 1 base): gold meridian arches and rings, crystal panels,
         a floral band, a great heart arch at its front; woven up by q0, q1 a blow's flash, q2 its level (more arches). 698 tree: a pearl-gold
         trunk, a blossoming pink canopy; q0 grow, q1 seed. 699 arch: a golden heart arch (two pillars, the heart's two lobes, a rose crystal
         heart at its crown), rising by q0 ---- */
  const FXP = {
    heart(Q, x, y, r, ang, crack, glow, a, open) { if (r > 0.6) { const c = cos(ang || 0) * r, s = sin(ang || 0) * r; Q.quad(690, x, y, c, s, -s, c, '#FFFFFF', a, crack || 0, glow || 0, open || 0); } },
    wave(Q, x, y, R, front, bloom, a, w, sy) { if (R > 2) Q.quad(691, x, y, R, 0, 0, R * (sy || FSY), '#FFFFFF', a, front, bloom || 0, w || 0.1); },
    flower(Q, x, y, r, grow, style, a, seed) { if (r > 0.8) Q.quad(692, x, y - r * 0.85, r, 0, 0, r, '#FFFFFF', a, grow, style || 0, seed || 0); },
    thread(Q, x0, y0, x1, y1, w, a, ph, curl, col) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = hypot(dx, dy); if (L > 1) Q.quad(693, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, col || '#FF7AC0', a, ph || 0, 1, curl || 0); },
    seal(Q, x, y, R, draw, turn, a, sy) { if (R > 2) Q.quad(694, x, y, R, 0, 0, R * (sy || FSY), '#FFFFFF', a, draw, turn || 0, 1); },
    pillar(Q, x, y, w, h, a, mode, flow) { if (h > 2) Q.quad(695, x, y - h / 2, w, 0, 0, h / 2, '#FFFFFF', a, mode || 0, flow || 1, 1); },
    ground(Q, x, y, R, grow, a, seed, sy) { if (R > 4) Q.quad(696, x, y, R, 0, 0, R * (sy || FSY), '#FFFFFF', a, grow, seed || 0, 0); },
    dome(Q, x, y, R, H, build, flash, a, lvl) { if (R > 4) Q.quad(697, x, y - H / 2, R, 0, 0, H / 2, '#FFFFFF', a, build, flash || 0, lvl || 1); },
    tree(Q, x, y, h, grow, a, seed) { if (h > 4) Q.quad(698, x, y - h / 2, h * 0.6, 0, 0, h / 2, '#FFFFFF', a, grow, seed || 0, 0); },
    arch(Q, x, y, w, h, grow, a) { if (h > 4) Q.quad(699, x, y - h / 2, w / 2, 0, 0, h / 2, '#FFFFFF', a, grow, 0, 0); },
  };
  const HX = t => 16 * pow(sin(t), 3) / 17, HY = t => -(13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t)) / 17;   // (a heart's outline: x -0.94..0.94, y -0.7 (lobes)..1 (the point))

  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = H.T, ST = H.ST, S = H.S;
    const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
    const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
    const glOn = () => { const G = GLG(); try { return !!(G && G.ok()); } catch (e) { return false; } };
    const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
    const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
    const sfx = n => { try { if (X.sfx && X.sfx[n]) X.sfx[n](); } catch (e) {} };
    const FX = [], MARK = new Set();
    let RS = ((Math.random() * 2147483645) | 0) + 1; const rnd = () => (RS = RS * 16807 % 2147483647) / 2147483647;
    let released = true, wardOff = null, inc = 0, sanc = null, shield = null, field = null;
    const pwr = a => H.P(a) * CFG.formK[kOf(a) - 1];   // (a floor for the first forms: Gabriel's fight next to the other Zodiac Animas')
    const kOf = a => max(1, min(3, a.k | 0)), LQ = () => (lowFx() ? 0.5 : 1);
    const list = () => S.list.filter(a => a.id === 'virgo');
    const sx = x => X.sx(x), sy = y => X.sy(y), maxHP = () => ST().hp;
    const sizeT = a => { const aw = a.st === 'awaken' || a.gbUlt; return ANIMA_SIZE[aw ? 3 : kOf(a)] * (aw ? 1.18 : 1) * BIG; };
    /* ---- the ultimate (20g7b) ---- */
    let UL = null;
    const H2 = Object.assign({}, H, { pose: a => stOf(a) && a.gbS, anchors: a => a.gbOut || null, kOf, light: (a, m, d, o) => light(a, m, d, o), mark: (m, n) => addMark(m, n), consume: m => takeMarks(m),
      grace: n => addGrace(n), graceN: () => graceN(), heal: (f, q) => healPet(f, q), shield: (f, dur) => addShield(f, dur), cleanse: n => cleanse(n), petals: a => PET(a), spear: () => spearMesh(), sizeT,
      pp, ppReset: () => { PPN = 0; PARTS.length = 0; return PARTS; }, fx: () => FX, FXP, CFG, COL, gpu, glOn, fgOpen, fgClose, sfx, LQ });
    try { if (typeof GABRIEL_ULT !== 'undefined') { UL = GABRIEL_ULT.create(H2); if (UL && UL.warm) setTimeout(() => { try { UL.warm(); } catch (e) {} }, 400); } } catch (e) { UL = null; }
    const ulOn = () => { try { return !!(UL && UL.active()); } catch (e) { return false; } };

    /* ---- Light blows, Judgement Marks ---- */
    function light(a, m, d, o) { if (!m || m.dead || !(d > 0)) return 0; o = o || {}; const r = H.hit(m, d, { el: 'prism', gb: 1, noCrit: o.noCrit, big: o.big, kb: m.boss ? 0 : o.kb, stun: m.boss ? 0 : o.stun, noText: o.noText, dot: o.tick, noAggro: o.tick });
      if (a && a.gb) a.gb.dealt = (a.gb.dealt || 0) + (r || 0); if (o.mark && !m.dead) addMark(m, o.mark); return r; }
    function addMark(m, n) { if (!m || m.dead) return; m.gbJ = min(CFG.mark.max, (m.gbJ > 0 && m.gbJT > g.t ? m.gbJ : 0) + (n || 1)); m.gbJT = g.t + CFG.mark.dur; MARK.add(m); }
    const marksOf = m => (m && m.gbJ > 0 && m.gbJT > g.t ? m.gbJ : 0);
    function takeMarks(m) { const n = marksOf(m); if (n) { m.gbJ = 0; m.gbJT = 0; FX.push({ kind: 'mdet', x: m.x, y: m.y, n, t: 0, life: 0.7 }); } return n; }
    /* ---- Grace Hearts, heals, the shield share, cleansing (the pet on the field: Gabriel's ally) ---- */
    const graceN = () => (me.gbGrace > 0 && me.gbGraceT > g.t ? me.gbGrace : 0);
    function addGrace(n) { me.gbGrace = min(CFG.grace.max, graceN() + (n || 1)); me.gbGraceT = g.t + CFG.grace.dur; }
    const graceK = () => 1 + CFG.grace.k * graceN();
    function healPet(f, quiet) { if (me.dead || !(f > 0)) return 0; const h0 = me.hp; X.heal(maxHP() * f * graceK(), quiet); return me.hp - h0; }
    function addShield(f, dur) { if (me.dead) return 0; const cap = maxHP() * CFG.sanct.cap, want = min(cap, maxHP() * f * graceK()), left = shield ? min(shield.amt, g.guardHP || 0) : 0, add = max(0, want - left);
      if (add > 0) { g.guardHP = (g.guardHP || 0) + add; g.guardMax = max(g.guardMax || 1, g.guardHP); }
      shield = { amt: max(left, want), until: g.t + (dur || CFG.sanct.shT) }; return add; }
    function dropShield() { if (!shield) return; const left = min(shield.amt, g.guardHP || 0); g.guardHP = max(0, (g.guardHP || 0) - left); shield = null; }
    /* one ordinary harmful status at a time (n of them): a slow, venom, a web or poison pool it stands in. Never a boss's named
       mechanic (a debt, a seal, a curse of the floor, frostbite): those are the encounter's own and stay */
    function cleanse(n) { let done = 0; n = n || 1;
      while (done < n) { if (me.chill > 0) me.chill = 0; else if (me.venom > 0) me.venom = 0;
        else { const Z = X.zones || [], i = Z.findIndex(z => z.own === 'enemy' && (z.kind === 'web' || z.kind === 'poison') && hypot(z.x - me.x, z.y - me.y) < (z.r || 1) + 0.6); if (i < 0) break; Z.splice(i, 1); }
        done++; }
      if (done) { X.text(me.x, me.y - 1.4, 'Purified', COL.blush, 13); FX.push({ kind: 'pur', x: me.x, y: me.y, t: 0, life: 0.8 }); }
      return done; }
    const dirty = () => me.chill > 0.3 || me.venom > 0 || (X.zones || []).some(z => z.own === 'enemy' && (z.kind === 'web' || z.kind === 'poison') && hypot(z.x - me.x, z.y - me.y) < (z.r || 1) + 0.6);
    /* the ward: every blow at the pet counted (the mind's threat); inside the Sanctuary an ordinary blow is softened. A blow that names a
       mechanic (o carries anything but dot / burn / dotC) or a boss blow over 35% of the pet's health is the encounter's own: untouched */
    const ORD = { dot: 1, burn: 1, dotC: 1, el: 1, kb: 1 };
    function ward(d, src, o) { if (!(d > 0)) return d; inc += d;
      if (sanc && sanc.on && hypot(me.x - sanc.x, me.y - sanc.y) < sanc.R + 0.3) { const mech = o && Object.keys(o).some(k => !ORD[k]), exe = src && src.boss && d > maxHP() * 0.35;
        if (!mech && !exe) { d *= 1 - sanc.red; sanc.hitT = 0.25; } }
      return d; }

    /* ---- state ---- */
    function stOf(a) {
      if (!a.gb) { const G = GLG(); a.gb = { act: null, last: null, last2: null, ready: false, en: -1, beats: {}, clock: 0, fightT: 0, gap: 0, vx: 0, vy: 0, alt: 0.8, altV: 0, face: FACE0, faceT: null, bank: 0, hd: null, calm: 0, perch: false, dealt: 0, heals: 0, casts: {}, kick: 0, cry: 0, lookP: { x: 0, y: 0 } };
        let Sx = null; try { Sx = G && G.idle ? G.idle(EVO[kOf(a)], 0) : null; } catch (e) { Sx = null; } a.gbS = Sx || {};
        const P = []; for (let i = 0; i < 12; i++) P.push({ x: a.x, y: a.y, z: 2, vx: 0, vy: 0, vz: 0, free: 0, fT: 0, mode: 'home', tx: 0, ty: 0, tz: 0, open: 0, oT: 0, glow: 0, gT: 0, scale: 1, sT: 1, roll: 0, rT: 0, d: [0, 0, 1], E: { free: 0, x: 0, y: 0, z: 0, dir: [0, 0, 1], roll: 0, open: 0, glow: 0, scale: 1 } });
        a.gb.P = P; a.gbS.petals = P.map(p => p.E);
        a.gbS.orHead = { yaw: 0, pitch: 0, roll: 0 }; a.gbS.orTorso = { lean: 0, twist: 0, bend: 0 }; a.gbS.orHandL = { open: 0, g: 'rest' }; a.gbS.orHandR = { open: 0, g: 'rest' }; a.gbS.look = null; }
      return a.gb;
    }
    const PET = a => (a.gb ? a.gb.P : null);
    /* a halo slot in world tiles (the model's anchors; else an estimate: a ring behind the head facing the camera) */
    function slot(a, i, out) { const o = a.gbOut, s = o && o.slots && o.slots[i], ab = a.gb;
      if (s && isFinite(s.wx)) { out.x = a.x + s.wx; out.y = a.y + s.wy; out.z = s.wz; out.dx = s.dx || 0; out.dy = s.dy || 0; out.dz = s.dz == null ? 1 : s.dz; return out; }
      const h = sizeT(a), an = i / 12 * TAU - Math.PI / 2, r = 0.44 * h; out.x = a.x + cos(an) * r; out.y = a.y - 0.05; out.z = ab.alt + 0.78 * h - sin(an) * r; out.dx = cos(an); out.dy = 0; out.dz = -sin(an); return out; }
    const SL = { x: 0, y: 0, z: 0, dx: 0, dy: 0, dz: 0 };
    /* world point from a screen anchor (on the anima's own floor row: x across, z up) */
    const s2w = (a, P, out) => { const Tz = T(); out.x = a.x + (P.x - sx(a.x)) / Tz; out.y = a.y; out.z = max(0, (sy(a.y) - P.y) / Tz); return out; };
    /* ---- the twelve petals: each a physical piece; it is never in two places and never jumps: it leaves its slot from the slot, springs
       to a formation, flies a path, and comes home to the slot, where the model takes it back (free 0) ---- */
    function petTo(p, x, y, z, o, gl, s) { p.mode = 'spring'; p.tx = x; p.ty = y; p.tz = z; if (o != null) p.oT = o; if (gl != null) p.gT = gl; if (s != null) p.sT = s; }
    const petHome = p => { p.mode = 'home'; p.oT = 0; p.gT = 0; p.sT = 1; p.rT = 0; };
    function petals(a, dt) {
      const ab = a.gb, P = ab.P, w = 6.5;
      for (let i = 0; i < 12; i++) { const p = P[i], E = p.E; slot(a, i, SL);
        if (p.mode === 'home') { const d = hypot(SL.x - p.x, SL.y - p.y, SL.z - p.z);
          if (p.free < 0.02 && d < 0.05) { p.x = SL.x; p.y = SL.y; p.z = SL.z; p.vx = p.vy = p.vz = 0; p.free = 0; }
          else { spring(p, SL.x, SL.y, SL.z, w * 1.2, dt); if (d < 0.35) p.free = max(0, p.free - dt * 3.5); }
          p.d[0] = lerp(p.d[0], SL.dx, ex(6, dt)); p.d[1] = lerp(p.d[1], SL.dy, ex(6, dt)); p.d[2] = lerp(p.d[2], SL.dz, ex(6, dt)); }
        else { if (p.free < 0.02) { p.x = SL.x; p.y = SL.y; p.z = SL.z; } p.free = min(1, p.free + dt * 7); if (p.mode === 'spring') spring(p, p.tx, p.ty, p.tz, w, dt); }
        p.open += (p.oT - p.open) * ex(5, dt); p.glow += (p.gT - p.glow) * ex(6, dt); p.scale += (p.sT - p.scale) * ex(3.5, dt); p.roll += p.rT * dt;
        E.free = p.free; E.x = p.x - a.x; E.y = p.y - a.y; E.z = p.z; E.dir[0] = p.d[0]; E.dir[1] = p.d[1]; E.dir[2] = p.d[2]; E.roll = p.roll; E.open = p.open; E.glow = p.glow; E.scale = p.scale; }
    }
    function spring(p, x, y, z, w, dt) { const h = min(dt, 0.05); p.vx += (w * w * (x - p.x) - 2 * w * p.vx) * h; p.vy += (w * w * (y - p.y) - 2 * w * p.vy) * h; p.vz += (w * w * (z - p.z) - 2 * w * p.vz) * h; p.x += p.vx * h; p.y += p.vy * h; p.z += p.vz * h;
      const v = hypot(p.vx, p.vy, p.vz); if (v > 0.6) { const k = 1 - ex(5, dt); p.d[0] = p.d[0] * k + p.vx / v * (1 - k); p.d[1] = p.d[1] * k + p.vy / v * (1 - k); p.d[2] = p.d[2] * k + p.vz / v * (1 - k); } }
    const allHome = a => a.gb.P.every(p => p.mode === 'home');
    function homeAll(a) { for (const p of a.gb.P) if (p.mode !== 'home') petHome(p); }

    /* ---- flight: one mover, a target point and a height; the velocity and height follow exact exponential springs; airborne it may cross
       walls and gaps but keeps near the pet; it perches (lands) only on open floor when the room is calm ---- */
    const gOK = (x, y, r) => isFinite(x) && isFinite(y) && !X.blocked(x, y, r, 0);
    function flyTo(a, dt, tx, ty, vmax, alt, look) {
      const ab = a.gb, M = CFG.move; if (!(dt > 0)) return hypot(tx - a.x, ty - a.y);
      { const ox = tx - me.x, oy = ty - me.y, q = hypot(ox / M.maxR, oy / M.maxRy); if (q > 1) { tx = me.x + ox / q; ty = me.y + oy / q; } }
      const hT = sizeT(a) * 0.55, was = ab.alt; if (alt < 0.02 && !gOK(a.x, a.y, 0.5)) alt = M.hover * hT;
      const bob = alt > 0.05 ? 0.05 * sin(ab.clock * 1.7) * hT : 0; ab.alt += (alt + bob - ab.alt) * ex(alt > ab.alt ? M.up : M.up * 1.3, dt); ab.altV = (ab.alt - was) / dt;
      const dx = tx - a.x, dy = ty - a.y, d = hypot(dx, dy), want = d > 0.04 ? min(vmax, d * M.arrive) : 0, k = ex(M.acc, dt);
      ab.vx += ((d > 0.04 ? dx / d * want : 0) - ab.vx) * k; ab.vy += ((d > 0.04 ? dy / d * want : 0) - ab.vy) * k;
      if (ab.alt > 0.08 || gOK(a.x + ab.vx * dt, a.y + ab.vy * dt, 0.5)) { a.x += ab.vx * dt; a.y += ab.vy * dt; } else ab.vx = ab.vy = 0;
      const sp = hypot(ab.vx, ab.vy), hd = atan2(ab.vy, ab.vx);
      const bk = sp > 1 && ab.hd != null ? max(-1, min(1, -angD(hd, ab.hd) / dt * 0.25 * min(1, sp / 4))) : 0; if (sp > 0.3) ab.hd = hd; ab.bank += (bk - ab.bank) * ex(4, dt);
      if (look && sp < 1.4) ab.faceT = faceTo(a, look.x, look.y); else if (sp > 0.9) ab.faceT = faceTo(a, a.x + ab.vx, a.y + ab.vy); else if (ab.faceT == null) ab.faceT = FACE0;
      if (ab.alt > 0.15 && was <= 0.15) { FX.push({ kind: 'gust', x: a.x, y: a.y, t: 0, life: 0.8, seed: rnd() * 40 }); ab.kick = 1; sfx('whoosh'); }
      if (ab.alt <= 0.06 && was > 0.06) { FX.push({ kind: 'gust', x: a.x, y: a.y, t: 0, life: 0.7, seed: rnd() * 40, land: 1 }); sfx('thud'); }
      return d;
    }
    /* its heading: toward the quarry but kept turned to the viewer, so the Heart and the Oracle always read */
    const faceTo = (a, x, y) => { const an = atan2(y - a.y, x - a.x), d = angD(an, Math.PI / 2); return Math.PI / 2 + max(-1.05, min(1.05, d * 0.6)); };
    /* free: it hovers beside and a little above the pet, drifting between spots; when nothing is near for a while it perches on the floor */
    function guard(a, dt) {
      const ab = a.gb, side = a.side || -1, dp = hypot(me.x - a.x, me.y - a.y), f = H.near(a.x, a.y, 9)[0];
      if (dp > 14) { const p = X.walkPoint(me.x + side * 2.2, me.y - 0.8, { r: 0.6, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y; ab.vx = ab.vy = 0; return; }
      ab.calm = f ? 0 : ab.calm + dt; const perch = ab.calm > CFG.move.perch && (me.vx || 0) * (me.vx || 0) + (me.vy || 0) * (me.vy || 0) < 0.3;
      if (ab.strT == null || ab.clock > ab.strT) { ab.strT = ab.clock + 1.8 + rnd() * 1.8; ab.sOx = (rnd() - 0.5) * 2.0; ab.sOy = (rnd() - 0.5) * 1.2; }
      let tx = me.x + side * 2.3 + (me.vx || 0) * 0.45 + ab.sOx * (perch ? 0.3 : 1), ty = me.y - 0.9 + (me.vy || 0) * 0.45 + ab.sOy * (perch ? 0.3 : 1);
      if (f) { tx = lerp(tx, f.x, 0.25); ty = lerp(ty, f.y, 0.25); }
      flyTo(a, dt, tx, ty, CFG.move.cruise * (dp > 6 ? 1.8 : 1), perch ? 0 : CFG.move.hover * sizeT(a) * 0.55, f || (perch ? null : { x: me.x, y: me.y + 2 }));
    }

    /* ---- the mind: no cooldowns; it weighs the pet's health, the blows it takes, its statuses, the monsters, the marks, its time ---- */
    function crowd(x, y, reach, rr) { const tg = H.near(x, y, reach); if (!tg.length) return null; let best = null, bn = -1;
      for (const m of tg) { let n = 0; for (const q of tg) if (hypot(q.x - m.x, q.y - m.y) < rr) n += q.boss ? 3 : 1 + 0.4 * marksOf(q); if (n > bn) { bn = n; best = m; } }
      const L = tg.filter(q => hypot(q.x - best.x, q.y - best.y) < rr); return { x: L.reduce((s, m) => s + m.x, 0) / L.length, y: L.reduce((s, m) => s + m.y, 0) / L.length, n: L.length, m: best, list: L, boss: L.some(m => m.boss), marks: L.reduce((s, m) => s + marksOf(m), 0) }; }
    const durOf = (kind, k) => kind === 'bloom' ? CFG.bloom.end + 0.6 : kind === 'sanct' ? CFG.sanct.end + 0.6 : kind === 'harv' ? CFG.harv.wind + CFG.harv.n[k - 1] * CFG.harv.gap + CFG.harv.out + 0.4 + CFG.harv.back + (k >= 3 ? 1.0 : 0)
      : CFG.thr.rise + CFG.thr.form + CFG.thr.drop + (CFG.thr.n[k - 1] - 1) * CFG.thr.gap + (k >= 3 ? 0.9 : 0) + CFG.thr.rec;
    function choose(a) {
      const ab = a.gb, k = kOf(a), life = a.life, hp = me.hp / maxHP(), foes = H.near(a.x, a.y, 11), threat = inc / maxHP(), opts = [], fit = kd => life > durOf(kd, k) * 0.7;
      const boss = foes.find(m => m.boss), c = foes.length ? crowd(a.x, a.y, 11, 2.6) : null, sl = sanc && sanc.on ? sanc.until - g.t : 0;
      // the pet hurt (or carrying a status the form can cleanse): Bloom of Mercy - never on a healthy pet
      const need = hp < CFG.bloom.need, st2 = k >= 2 && dirty();
      if (!me.dead && (need || st2) && fit('bloom')) opts.push({ kind: 'bloom', s: 0.55 + 1.4 * max(0, CFG.bloom.need - hp) + (st2 ? 0.35 : 0) + (hp < 0.35 ? 0.5 : 0) });
      // the pet under real pressure (or a boss close and the pet worn): Sanctuary Weave, unless one stands with time to run
      if (!me.dead && sl < 1.5 && (threat > 0.07 || (boss && hp < 0.8 && hypot(boss.x - me.x, boss.y - me.y) < 7) || hp < 0.4) && fit('sanct')) opts.push({ kind: 'sanct', s: 0.55 + 4.5 * min(0.3, threat) + (boss ? 0.15 : 0) + (hp < 0.5 ? 0.2 : 0) });
      if (foes.length && fit('harv')) opts.push({ kind: 'harv', s: 0.5 + 0.06 * min(6, foes.length) + (foes.filter(m => !marksOf(m)).length > 1 ? 0.08 : 0) });
      if (c && (c.n >= 3 || c.boss || c.marks >= 3) && fit('thr')) opts.push({ kind: 'thr', s: 0.35 + 0.09 * min(6, c.n) + 0.06 * min(6, c.marks) + (c.boss ? 0.25 : 0) });
      for (const q of opts) { if (q.kind === ab.last) q.s *= 0.7; else if (q.kind === ab.last2) q.s *= 0.88; q.s += rnd() * 0.1; }
      if (!opts.length) return null; opts.sort((p, q) => q.s - p.s); ab.opts = opts; return opts[0].s > 0.3 ? opts[0] : null;
    }

    /* ---- the powers ---- */
    function start(a, kind, o) {
      const ab = a.gb, k = kOf(a); ab.act = Object.assign({ kind, t: 0, k }, o || {}); const A = ab.act; ab.last2 = ab.last; ab.last = kind; ab.casts[kind] = (ab.casts[kind] || 0) + 1; ab.calm = 0;
      const foes = H.near(a.x, a.y, 11);
      if (kind === 'bloom') { A.n = CFG.bloom.n[k - 1]; A.hit = 0; A.cl = false; sfx('hum'); }
      else if (kind === 'sanct') { A.on = false; sfx('hum'); }
      else if (kind === 'harv') { const C = CFG.harv, n = C.n[k - 1], tg = foes.filter(m => hypot(m.x - a.x, m.y - a.y) < C.reach).slice(0, n); A.bl = [];
        // (each blade its own petal and its own quarry: the nearest first, then round again)
        const used = new Set(); for (let i = 0; i < n; i++) { const m = tg.length ? tg[i % tg.length] : null; let pi = (i * 5 + 1) % 12; while (used.has(pi)) pi = (pi + 1) % 12; used.add(pi); A.bl.push({ i, p: pi, m, L: C.wind + i * C.gap, st: 0, side: i % 2 ? -1 : 1, hit: new Set() }); }
        A.cx = tg.length ? tg.reduce((s, m) => s + m.x, 0) / tg.length : a.x + 3; A.cy = tg.length ? tg.reduce((s, m) => s + m.y, 0) / tg.length : a.y; A.end = durOf('harv', k); sfx('chirp'); }
      else if (kind === 'thr') { const C = CFG.thr, c = crowd(a.x, a.y, 11, 2.6); A.cx = c ? c.x : a.x + 3; A.cy = c ? c.y : a.y; A.m = c ? (c.list.find(m => m.boss) || c.m) : null; A.n = C.n[k - 1];
        A.sp = []; for (let i = 0; i < A.n; i++) A.sp.push({ i, f0: C.rise + i * C.gap * 0.6, drop: C.rise + C.form + i * C.gap, st: 0, x: A.cx, y: A.cy, z: 4.2 });
        A.end = durOf('thr', k); A.det = k >= 3 ? A.sp[A.n - 1].drop + C.drop + 0.9 : 0; sfx('hum'); }
      ab.faceT = null;
    }
    function act(a, dt) {
      const ab = a.gb, A = ab.act, t0 = A.t, k = A.k; A.t += dt; const t = A.t, cross = x => t0 < x && t >= x, hT = sizeT(a) * 0.55, M = CFG.move;
      if (A.kind === 'bloom') { const C = CFG.bloom;
        flyTo(a, dt, me.x + (a.side || -1) * 0.5, me.y - 0.35, M.fly, M.high * hT, { x: me.x, y: me.y + 2 });
        if (t < C.end - 0.4) for (let i = 0; i < 12; i++) { const an = i / 12 * TAU + t * 0.9, p = ab.P[i]; petTo(p, me.x + cos(an) * 1.25, me.y + sin(an) * 0.8, 0.75 + 0.15 * sin(t * 3 + i), 0.55, 1.2 + 0.4 * sin(t * 5 + i), 1); p.d[0] = cos(an) * 0.3; p.d[1] = sin(an) * 0.3; p.d[2] = 1; }   // (Mercy: the petals ring the pet)
        else homeAll(a);
        if (cross(C.launch)) { const A0 = a.gbOut, hp = A0 && A0.heart ? s2w(a, A0.heart, { x: 0, y: 0, z: 0 }) : { x: a.x, y: a.y, z: ab.alt + sizeT(a) * 0.5 }, n = A.n;
          for (let i = 0; i < n; i++) FX.push({ kind: 'hfly', x0: hp.x, y0: hp.y, z0: hp.z, i, n, t: -i * 0.06, life: C.fly, a, seed: rnd() * 50, sd: (i / max(1, n - 1) - 0.5) * 2.4 });
          sfx('sparkle'); }
        if (cross(C.launch + C.fly)) { const got = healPet(C.heal[k - 1]); ab.heals += got; addGrace(1); FX.push({ kind: 'pulse', x: me.x, y: me.y, t: 0, life: 1.0 }); FX.push({ kind: 'lilies', x: me.x, y: me.y, t: 0, life: k >= 3 ? 1.2 + C.field : 3.2, seed: rnd() * 40, k });
          if (k >= 2) A.cl = cleanse(1) > 0; if (k >= 3) field = { x: me.x, y: me.y, t: 0, life: C.field, tick: 0 }; if (!gpu()) X.ring(me.x, me.y, 0.3, 1.8, 0.5, COL.rose, 0.2); sfx('chirp'); }
        if (t >= C.end) endAct(a); }
      else if (A.kind === 'sanct') { const C = CFG.sanct, R = C.R[k - 1];
        flyTo(a, dt, me.x + (a.side || -1) * 0.3, me.y - 0.5, M.fly, M.high * 1.15 * hT, { x: me.x, y: me.y + 2 });
        if (t < C.end - 0.35) for (let i = 0; i < 12; i++) { const th = (i + 0.5) / 12 * TAU, p = ab.P[i], u = sstep(0.25 + i * 0.03, 0.9 + i * 0.03, t); petTo(p, me.x + HX(th) * R, me.y + (HY(th) + 0.15) * R * 0.85, lerp(1.6, 0.55, u), 0.85, 1.4, 1.15); p.d[0] = HX(th) * 0.4; p.d[1] = 0; p.d[2] = 1; p.rT = 0; }
        else homeAll(a);
        if (cross(C.cast)) { const was = !!(sanc && sanc.on); sanc = { on: true, x: me.x, y: me.y, R, red: C.red[k - 1], k, t: 0, until: g.t + C.dur[k - 1], dur: C.dur[k - 1], cl: 0, hitT: 0, a, refreshed: was }; addShield(C.shield[k - 1], C.shT); addGrace(1); if (k >= 2) cleanse(1);
          X.shake(5, 0.25); sfx('crash'); if (!gpu()) X.ring(me.x, me.y, 0.4, R, 0.6, COL.rose, 0.3); }
        if (t >= C.end) endAct(a); }
      else if (A.kind === 'harv') harvStep(a, A, t0, t, dt);
      else if (A.kind === 'thr') thrStep(a, A, t0, t, dt);
    }
    function endAct(a) { const ab = a.gb; if (!ab || !ab.act) return; ab.act = null; ab.gap = 0.25 + rnd() * 0.3; homeAll(a); }
    function interrupt(a) { const ab = a.gb; if (!ab) return; ab.act = null; ab.gap = 0.2; homeAll(a); }
    /* Harvest Halo: each blade leaves its slot on a curved path, strikes its quarry (and what it passes), arcs on and comes home */
    function harvStep(a, A, t0, t, dt) {
      const ab = a.gb, C = CFG.harv, k = A.k, P0 = pwr(a), hT = sizeT(a) * 0.55; let last = 0, live = 0;
      flyTo(a, dt, a.x + ab.vx * 0.2, a.y + ab.vy * 0.2, 1.5, CFG.move.hover * hT * 1.1, { x: A.cx, y: A.cy });
      for (const B of A.bl) { const p = ab.P[B.p], u0 = t - B.L;
        if (u0 < 0) continue; if (B.st === 0) { B.st = 1; B.x0 = p.x; B.y0 = p.y; B.z0 = p.z; p.mode = 'path'; p.oT = 1; p.gT = 1.6; p.rT = 16 * B.side; sfx('whoosh'); }
        if (B.st === 1) { const m = B.m && !B.m.dead ? B.m : null; if (m) { B.tx = m.x; B.ty = m.y; } else if (B.tx == null) { B.tx = A.cx + (rnd() - 0.5) * 2; B.ty = A.cy + (rnd() - 0.5) * 2; }
          const u = cl(u0 / C.out), e = pow(u, 1.35), mx = (B.x0 + B.tx) / 2, my = (B.y0 + B.ty) / 2, dx = B.tx - B.x0, dy = B.ty - B.y0, L = hypot(dx, dy) || 1, cx = mx - dy / L * L * 0.38 * B.side, cy = my + dx / L * L * 0.3 * B.side;
          bez(p, B.x0, B.y0, B.z0, cx, cy, B.z0 + 1.2, B.tx, B.ty, 0.45, e);
          // (what it passes on the way: struck once, lighter)
          for (const q of H.living()) if (q !== m && !B.hit.has(q) && hypot(q.x - p.x, q.y - p.y) < 0.55 + q.r && p.z < 1.6) { B.hit.add(q); light(a, q, P0 * C.dmg[k - 1] * C.side, { mark: 1, kb: 1 }); burst(q.x, q.y, 0.7); }
          if (u >= 1) { B.st = 2; B.t2 = t; if (m && !B.hit.has(m)) { B.hit.add(m); light(a, m, P0 * C.dmg[k - 1], { mark: 1, kb: 2 }); } burst(B.tx, B.ty, 1); X.shake(2.5, 0.1); sfx(B.i % 2 ? 'thud' : 'chirp');
            B.x1 = p.x; B.y1 = p.y; B.z1 = p.z; } }
        if (B.st === 2) { const conv = k >= 3, u = cl((t - B.t2) / (conv ? 0.45 : C.back));
          if (conv) { const hx = A.cx + cos(B.i / A.bl.length * TAU) * 0.9, hy = A.cy + sin(B.i / A.bl.length * TAU) * 0.6; bez(p, B.x1, B.y1, B.z1, (B.x1 + hx) / 2 + B.side, (B.y1 + hy) / 2, 2.4, hx, hy, 2.0, eout(u)); if (u >= 1) { B.st = 3; p.mode = 'spring'; p.tx = p.x; p.ty = p.y; p.tz = p.z; } }
          else { slot(a, B.p, SL); bez(p, B.x1, B.y1, B.z1, (B.x1 + SL.x) / 2 - B.side * 1.5, (B.y1 + SL.y) / 2 + 0.8, max(B.z1, SL.z) + 1.0, SL.x, SL.y, SL.z, sstep(0, 1, u)); if (u >= 1) { B.st = 4; petHome(p); p.vx = p.vy = p.vz = 0; } } }
        if (B.st === 3) { const hx = A.cx + cos(B.i / A.bl.length * TAU + t * 3) * 0.9 * (1 - sstep(A.cT || 9, (A.cT || 9) + 0.25, t)), hy = A.cy + sin(B.i / A.bl.length * TAU + t * 3) * 0.6; petTo(p, hx, hy, 2.0, 1, 2, 1.2); }
        last = max(last, B.L); if (B.st < 4) live++; }
      // lv7: the blades gather over the crowd, spin, and burst as a blooming crystal heart; then home
      if (k >= 3 && A.bl.length && A.bl.every(B => B.st >= 3) && A.cT == null) { A.cT = t + 0.35; }
      if (A.cT != null && cross2(t0, t, A.cT + 0.25)) { const R = C.convR; for (const m of H.living()) { const d = hypot(m.x - A.cx, m.y - A.cy); if (d < R + m.r) light(a, m, P0 * C.conv * (1 - 0.4 * cl(d / R)), { mark: 1, big: true, kb: 3 }); }
        FX.push({ kind: 'conv', x: A.cx, y: A.cy, t: 0, life: 1.3, seed: rnd() * 40 }); X.shake(9, 0.35); X.flash(0.12, '#FFE6F4'); sfx('crash'); if (!gpu()) X.ring(A.cx, A.cy, 0.3, R, 0.5, COL.pink, 0.3);
        for (const B of A.bl) { petHome(ab.P[B.p]); B.st = 4; } }
      if (t > last + 0.3 && A.bl.every(B => B.st >= 4)) endAct(a);
      else if (t > A.end + 2.5) { homeAll(a); endAct(a); }
    }
    const cross2 = (t0, t, x) => t0 < x && t >= x;
    function bez(p, x0, y0, z0, cx, cy, cz, x1, y1, z1, u) { const v = 1 - u, nx = v * v * x0 + 2 * u * v * cx + u * u * x1, ny = v * v * y0 + 2 * u * v * cy + u * u * y1, nz = v * v * z0 + 2 * u * v * cz + u * u * z1;
      const dx = nx - p.x, dy = ny - p.y, dz = nz - p.z, L = hypot(dx, dy, dz); if (L > 1e-4) { p.d[0] = dx / L; p.d[1] = dy / L; p.d[2] = dz / L; } p.x = nx; p.y = ny; p.z = nz; p.vx = p.vy = p.vz = 0; }
    /* Thresher of Stars: up on full wings, the petals ring the target, a spear forms between them and falls; marks consumed on impact */
    function thrStep(a, A, t0, t, dt) {
      const ab = a.gb, C = CFG.thr, k = A.k, P0 = pwr(a), hT = sizeT(a) * 0.55, cross = x => t0 < x && t >= x, lastDrop = A.sp[A.n - 1].drop;
      if (A.m && !A.m.dead) { A.cx = lerp(A.cx, A.m.x, ex(1.5, dt)); A.cy = lerp(A.cy, A.m.y, ex(1.5, dt)); }
      const bx = lerp(me.x, A.cx, 0.35), by = lerp(me.y, A.cy, 0.35) - 0.8; flyTo(a, dt, bx, by, CFG.move.fly, (t < lastDrop + C.drop + 0.3 ? 1.55 : 0.8) * CFG.move.hover * hT * 1.6, { x: A.cx, y: A.cy });
      if (cross(0.05)) ab.kick = 1;
      const ringOn = t > C.rise * 0.6 && t < (A.det || lastDrop + C.drop) + 0.35;
      for (let i = 0; i < 12; i++) { const p = ab.P[i]; if (!ringOn) { if (p.mode !== 'home') petHome(p); continue; } const th = i / 12 * TAU + t * 2.2, R = 1.7 + 0.2 * sin(t * 2);
        petTo(p, A.cx + cos(th) * R, A.cy + sin(th) * R * 0.62, 4.0 + 0.25 * sin(th * 2 + t * 3), 0.35, 1.3 + 0.7 * bump(t, C.rise + C.form - 0.4, C.rise + C.form, lastDrop, lastDrop + 0.2), 1.1); p.d[0] = -cos(th) * 0.35; p.d[1] = -sin(th) * 0.35; p.d[2] = -1; p.rT = 2; }
      for (const s of A.sp) {
        if (s.st === 0 && t >= s.f0) { s.st = 1; sfx('hum'); }
        if (s.st === 1) { s.x = A.cx; s.y = A.cy; s.z = 4.2; s.g = sstep(s.f0, s.drop, t); if (t >= s.drop) { s.st = 2; sfx('whoosh'); } }
        if (s.st === 2) { const u = cl((t - s.drop) / C.drop); s.x = A.cx; s.y = A.cy; s.z = 4.2 * (1 - u * u); s.g = 1;
          if (u >= 1) { s.st = 3; impact(a, A, s, P0); } } }
      if (A.det && cross(A.det)) { const R = C.detR; for (const m of H.living()) { const d = hypot(m.x - A.cx, m.y - A.cy); if (d < R + m.r) light(a, m, P0 * C.det * (1 - 0.4 * cl(d / R)), { big: true, kb: 4, noCrit: true }); }
        FX.push({ kind: 'det', x: A.cx, y: A.cy, t: 0, life: 1.6, seed: rnd() * 40 }); X.flash(0.3, '#FFE2F2'); X.shake(18, 0.6); g.hitStop = max(g.hitStop || 0, 0.05); sfx('crash'); X.after(0.12, () => sfx('fanfare')); if (!gpu()) X.ring(A.cx, A.cy, 0.4, R, 0.7, COL.mag, 0.4); }
      if (t >= A.end) endAct(a);
    }
    function impact(a, A, s, P0) { const C = CFG.thr, R = C.R;
      for (const m of H.living()) { const d = hypot(m.x - s.x, m.y - s.y); if (d > R + m.r) continue; const n = takeMarks(m);
        light(a, m, P0 * (C.dmg * (1 - 0.4 * cl(d / R)) + C.mark * n), { big: true, kb: 2.5, stun: C.stun, noCrit: n > 0, mark: 1 }); }
      FX.push({ kind: 'hwave', x: s.x, y: s.y, t: 0, life: 1.6, seed: rnd() * 40, big: 1 }); FX.push({ kind: 'shards', x: s.x, y: s.y, t: 0, life: 1.1, seed: rnd() * 40 });
      X.shake(12, 0.4); X.flash(0.15, '#FFD8EE'); g.hitStop = max(g.hitStop || 0, 0.04); sfx('crash'); X.light && X.light(s.x, s.y, 5, 0.5); if (!gpu()) { X.ring(s.x, s.y, 0.3, R, 0.5, COL.pink, 0.3); X.sparks(s.x, s.y, COL.rose, 14, 6); } }
    function burst(x, y, k) { FX.push({ kind: 'burst', x, y, t: 0, life: 0.65, k, seed: rnd() * 40 }); if (!gpu()) X.sparks(x, y, COL.rose, 6, 4); }

    /* ---- the pose every frame (the model springs it): the flight, the power's gestures, the entrance, the last seconds ---- */
    function poseOf(a, dt) {
      const ab = stOf(a), Sx = a.gbS, A = ab.act, inU = ulOn(), hT = sizeT(a) * 0.55, t = a.at || 0;
      Sx.t = t; Sx.x = a.x; Sx.y = a.y; Sx.lowFx = lowFx(); Sx.evo = a.st === 'awaken' || a.gbUlt ? 7 : EVO[kOf(a)];
      if (!inU && ab.faceT != null) ab.face += angD(ab.faceT, ab.face) * ex(4, dt);
      if (!inU) Sx.face = ab.face;
      petals(a, dt);
      if (inU) return;
      const sp = hypot(ab.vx, ab.vy), air = cl(ab.alt / (0.3 * hT));
      Sx.fly = cl(ab.alt / hT); Sx.speed = air * cl(sp / CFG.move.fly); Sx.glide = air * cl((sp - 2.5) / 3) * (1 - cl(ab.altV * 2)); Sx.dive = air * max(-1, min(1, -ab.altV * 0.6)); Sx.bank = ab.bank; Sx.legsFold = null;
      Sx.wingBeat = air * cl(ab.altV * 0.9); Sx.wingKick = ab.kick; ab.kick = max(0, ab.kick - dt * 3);
      // rest: wings held half open (perched: folded), the heart's slow pulse, the Oracle at peace, the halo turning
      let wing = lerp(0.3, 0.82, air), shape = air > 0.5 ? 'full' : 'fold', pulse = 0.15, hOpen = 0, split = 0, ring = 1, hGlow = 0, pray = 0, raise = 0, spread = 0, cast = 0, side = 'R', strug = 0, orG = 0.3, halo = 1, hGl = 0.3, beak = 0, cry = ab.cry, neck = 0.4, wPulse = 0, glow = 0.15, wrist = 0;
      const look = Sx.look || (Sx.look = { x: 0, y: 0 }); let lk = null;
      const f0 = H.near(a.x, a.y, 9)[0]; if (f0) { look.x = f0.x; look.y = f0.y; lk = look; }
      if (A && A.kind === 'bloom') { const C = CFG.bloom, t1 = A.t, pr = bump(t1, 0.05, C.pray, C.launch - 0.05, C.launch + 0.2), op = bump(t1, C.launch - 0.15, C.launch + 0.05, C.end - 0.6, C.end);
        pray = pr; hOpen = 0.35 * bump(t1, 0.3, C.launch, C.end - 0.6, C.end); pulse = 0.4 + 0.6 * bump(t1, 0.2, 0.5, C.launch + C.fly, C.end); hGlow = 0.8 * op; shape = 'heart'; wing = 0.95; orG = 0.6 + 0.6 * op; neck = 0.2; spread = 0.45 * op;
        Sx.orHandL.open = Sx.orHandR.open = op; Sx.orHandL.g = Sx.orHandR.g = op > 0.3 ? 'open' : 'prayer'; Sx.orHead.pitch = -0.45 * pr + 0.1 * op; look.x = me.x; look.y = me.y; lk = look; }
      else if (A && A.kind === 'sanct') { const C = CFG.sanct, t1 = A.t, sp2 = bump(t1, 0.05, 0.5, C.end - 0.5, C.end); spread = sp2; wrist = bump(t1, 0.2, 0.6, C.end - 0.6, C.end); shape = 'heart'; wing = 1; hOpen = 0.25 * sp2; pulse = 0.5 * sp2; orG = 0.5 + 0.8 * sp2; glow = 0.4 * sp2; Sx.orHandL.g = Sx.orHandR.g = 'open'; Sx.orHandL.open = Sx.orHandR.open = sp2; Sx.orHead.pitch = 0.15 * sp2; look.x = me.x; look.y = me.y; lk = look; }
      else if (A && A.kind === 'harv') { const t1 = A.t, up = sstep(0, 0.4, t1) * (1 - sstep(A.end - 0.6, A.end, t1)); cast = up; side = (a.gbOut && a.gbOut.handL && a.gbOut.handR && (A.cx > a.x) === (a.gbOut.handL.x > a.gbOut.handR.x)) ? 'L' : 'R'; halo = 1 + 4 * up; ring = 1 + 2 * up; shape = 'attack'; hGl = 0.5 + 0.8 * up; split = 0.15 * up; glow = 0.3 + 0.5 * up; orG = 0.5 + 0.7 * up; beak = 0.2 * up;
        Sx.orHandL.g = side === 'L' ? 'point' : 'cast'; Sx.orHandR.g = side === 'R' ? 'point' : 'cast'; look.x = A.cx; look.y = A.cy; lk = look; }
      else if (A && A.kind === 'thr') { const C = CFG.thr, t1 = A.t, lastDrop = A.sp[A.n - 1].drop, up = sstep(0, C.rise, t1) * (1 - sstep(lastDrop + 0.05, lastDrop + 0.3, t1)), low = bump(t1, lastDrop - 0.08, lastDrop + 0.05, A.end - 0.6, A.end);
        raise = up; cast = 0; shape = 'full'; wing = 1; ring = 1 + 3 * up + 2 * low; split = 0.5 * max(up, low); halo = 1 + 2 * up; hGl = 0.8 * up + 0.4; wPulse = max(up * 0.6, low); strug = 0.35 * up; orG = 0.6 + 0.9 * max(up, low); neck = 0.85 * up; beak = 0.5 * low; glow = 0.5 + 0.5 * up;
        Sx.orHandL.g = Sx.orHandR.g = up > 0.3 ? 'cast' : 'open'; Sx.orHead.pitch = 0.35 * up - 0.2 * low; look.x = A.cx; look.y = A.cy; lk = look;
        if (low > 0.01) { Sx.orArmL = Sx.orArmL || {}; Sx.orArmR = Sx.orArmR || {}; Sx.orArmL.fwd = Sx.orArmR.fwd = 0.9 * low; Sx.orArmL.up = Sx.orArmR.up = -0.4 * low; } else { Sx.orArmL = Sx.orArmR = null; } }
      if (!A || A.kind !== 'thr') { Sx.orArmL = null; Sx.orArmR = null; }
      if (!A) { Sx.orHandL.g = Sx.orHandR.g = 'rest'; Sx.orHandL.open = Sx.orHandR.open = 0; Sx.orHead.pitch = 0.08 * sin(t * 0.6); Sx.orHead.yaw = 0.25 * sin(t * 0.37); }
      // the field's heart: Sanctuary up = the Heart pulses with it; Grace on the pet = the wing crystals glow
      if (sanc && sanc.on) { pulse = max(pulse, 0.3); ring = max(ring, 1.5); }
      // the awakening (the 30 s are up): it gathers before Eden Reborn takes over
      if (a.st === 'awaken') { const u = sstep(0, 0.7, a.aw || 0); raise = max(raise, 0.6 * u); strug = max(strug, 0.6 * u); orG = max(orG, 1.2 * u); halo = max(halo, 1 + 3 * u); wing = max(wing, u); }
      // the entrance: the model assembles on S.enter; the wings extend, energy runs through every feather, the cry
      let enter = 1; if (ab.en >= 0 && !ab.ready) { const e = ab.en; enter = sstep(0.7, 3.0, e); wing = lerp(0.1, 1, sstep(2.9, 3.4, e)); wPulse = bump(e, 3.3, 3.5, 3.8, 4.1); glow = max(glow, wPulse); cry = max(cry, bump(e, 3.75, 3.9, 4.05, 4.4)); neck = lerp(neck, 1, cry); beak = max(beak, cry); pulse = 0.3 + 0.7 * bump(e, 0.8, 1.2, 2.6, 3.2); orG = 0.4 + 1.2 * bump(e, 1.3, 1.6, 2.6, 3.4); halo = 1 + 3 * bump(e, 2.6, 3.0, 3.4, 4.0); lk = null; }
      // the last 5 s: the bindings strain, the heart races, the mask brightens
      const fin = a.st === 'fight' && ab.ready && a.life < 5 ? 1 - max(0, a.life) / 5 : 0;
      if (fin > 0) { strug = max(strug, 0.5 * fin); pulse = max(pulse, 0.3 + 0.5 * fin); orG = max(orG, 0.6 + 0.8 * fin); halo *= 1 + fin; }
      ab.cry = max(0, ab.cry - dt * 1.2);
      Object.assign(Sx, { wing, wingShape: shape, wingPulse: wPulse, glow, heartPulse: pulse, heartOpen: hOpen, heartSplit: split, ringSpin: ring, heartGlow: hGlow, orPray: pray, orRaise: raise, orSpread: spread, orCast: cast, orCastSide: side, orStruggle: strug, orGlow: orG, wristOpen: wrist,
        orRise: 0, restraintsOpen: wrist * 0.3, crownOpen: 0.2 * cast + 0.3 * raise, ribbons: 0.5 + 0.3 * air + 0.3 * max(spread, raise), haloSpin: halo, haloScale: 1, haloGlow: hGl, beakOpen: beak, cry, neck, look: lk, headYaw: 0, headPitch: 0,
        tailSwish: max(-1, min(1, -ab.bank * 0.8 + 0.25 * sin(t * 1.3))), tailSpread: 0.3 + 0.5 * max(spread, raise), enter, dissolve: 0, alpha: 1 });
    }

    /* ---- the fighter's loop (20g's tick in 'fight'). Its time counts only from combat-ready (the entrance done) ---- */
    function tick(a, dt) {
      const ab = stOf(a); a.feet = true; ab.clock += dt;
      if (!ab.ready) { a.life += dt; if (ab.en >= 0 && ab.en < CFG.enter) { flyTo(a, dt, a.x, a.y, 0.5, CFG.move.hover * sizeT(a) * 0.55 * sstep(2.6, 4.2, ab.en), null); return; } ab.ready = true; a.life = CFG.life - 1e-6; ab.fightT = 0; }
      else ab.fightT += dt;
      if (!wardOff && X.addWard) wardOff = X.addWard(ward, false);
      if (me.dead) { interrupt(a); flyTo(a, dt, a.x, a.y, 1, CFG.move.hover * sizeT(a) * 0.55, null); return; }
      if (ab.act) { act(a, dt); return; }
      ab.gap -= dt; const ch = ab.gap <= 0 && a.life > 0.6 ? choose(a) : null;
      if (ch) { start(a, ch.kind, ch.o); act(a, dt); return; }
      guard(a, dt);
    }
    /* ---- the end of its time: Eden Reborn (20g7b), once; started the frame its 30 s run out (fin, from the runner, is then a no-op) ---- */
    function fin(a) { begin(a); }
    function begin(a) { const ab = stOf(a); if (a.gbUlt) return; a.gbUlt = true; interrupt(a); a.hold = true; ab.vx = ab.vy = 0;
      let ok = false; if (UL) { try { ok = !!UL.start(a); } catch (e) { ok = false; } }
      if (!ok) { for (const m of H.living()) if (hypot(m.x - a.x, m.y - a.y) < 9 + m.r) light(a, m, pwr(a) * 6, { big: true, noCrit: true }); healPet(0.4); addShield(0.15, 8); a.hold = false; a.st = 'leave'; a.lv = 0; } }   // (the ultimate's module missing: a plain blessing, then it leaves)
    /* ---- the loop (every frame, from 20g's update) ---- */
    function update(dt, dtReal) {
      const L = list(); inc *= exp(-(dt || 0) / 2.5);
      for (const a of L) { const ab = stOf(a); a.feet = true;
        if (a.st === 'enter' && a.en >= 0) { if (ab.en < 0) { ab.en = 0; entranceStart(a); } ab.en += dtReal; a.dropZ = 0; a.scale = 1; a.alpha = 1; entranceBeats(a); }
        else if (ab.en >= 0 && !ab.ready) { ab.en += dtReal; entranceBeats(a); }
        if (a.st === 'awaken' && !a.gbUlt) begin(a);
        if (a.st === 'awaken' || a.gbUlt) a.hold = true;
        if (a.st !== 'fight' && ab.act) interrupt(a);
        poseOf(a, dtReal);
        const G = GLG(); if (G && G.solve && !glOn()) { try { const r = G.solve(sx(a.x), sy(a.y), T() * sizeT(a), a.gbS, { tile: T() }); if (r) a.gbOut = r; } catch (e) {} }
        trail(a, dtReal); released = false; }
      if (UL) { try { UL.update(dt, dtReal); } catch (e) { try { console.warn('Gabriel ult: ' + (e && e.message)); } catch (e2) {} UL = null; } }
      // the Sanctuary: its time, its periodic cleanse (lv4+), its retaliatory burst (lv7) as it ends
      if (sanc && sanc.on) { sanc.t += dt; sanc.hitT = max(0, sanc.hitT - dt);
        if (sanc.k >= 2) { sanc.cl += dt; if (sanc.cl >= CFG.sanct.cleanse) { sanc.cl = 0; if (dirty()) cleanse(1); } }
        if (g.t >= sanc.until || me.dead) { const s = sanc; sanc.on = false;
          if (s.k >= 3 && !me.dead) { const R = CFG.sanct.boomR, P0 = pwr(s.a); for (const m of H.living()) { const d = hypot(m.x - s.x, m.y - s.y); if (d < R + m.r) light(s.a, m, P0 * CFG.sanct.boom * (1 - 0.35 * cl(d / R)), { kb: 4, mark: 1 }); } FX.push({ kind: 'hwave', x: s.x, y: s.y, t: 0, life: 1.4, seed: 7, big: 1 }); X.shake(10, 0.4); sfx('crash'); }
          FX.push({ kind: 'sancOut', x: s.x, y: s.y, R: s.R, k: s.k, t: 0, life: 0.9 }); } }
      if (shield && (g.t >= shield.until || !(g.guardHP > 0))) dropShield();
      if (field) { field.t += dt; field.tick += dt; if (field.tick >= 1) { field.tick -= 1; if (hypot(me.x - field.x, me.y - field.y) < CFG.bloom.fieldR + 0.5) healPet(CFG.bloom.fieldHeal, true); } if (field.t >= field.life) field = null; }
      for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += f.cine ? dtReal : dt; if (f.t >= f.life) FX.splice(i, 1); }
      for (const m of MARK) if (m.dead || !(m.gbJT > g.t)) { m.gbJ = 0; MARK.delete(m); }
      if (!L.length && !ulOn()) { if (!released) { released = true; FX.length = 0; cleanup(); } }   // (Gabriel gone: its last effects go with it, and every GPU buffer)
      if (me.dead) for (const a of L) interrupt(a);
    }
    function cleanup() { for (const m of MARK) { m.gbJ = 0; m.gbJT = 0; } MARK.clear(); me.gbGrace = 0; me.gbGraceT = 0; dropShield(); if (sanc) sanc.on = false; sanc = null; field = null; if (wardOff) { try { wardOff(); } catch (e) {} wardOff = null; } freeGL(); }
    function freeGL() { const G = GLG(); if (G) try { G.free(); } catch (e) {} if (SPEAR && typeof GLM !== 'undefined' && !(G && G.own)) try { GLM.free(SPEAR); } catch (e) {} SPEAR = null; }
    function stop() { for (const a of S.list) if (a.id === 'virgo') { interrupt(a); a.hold = false; a.judg = false; a.jA = 1; }
      if (UL) try { UL.stop(); } catch (e) {} FX.length = 0; cleanup(); released = true; }
    /* allies strike marked monsters a little harder (20g's outK) */
    const outK = m => 1 + CFG.mark.k * marksOf(m);

    /* ---- the entrance: the Virgo constellation, a crystalline heart rising from it, the rings, the Oracle in the crystal, the armour
       assembling round it (the model's S.enter), the petals forming the crown, the wings, energy through every feather, hearts, the cry ---- */
    function descent(a) { const ab = stOf(a); ab.en = 0; ab.ready = false; ab.beats = {}; a.feet = true; a.dropZ = 0; a.scale = 1; a.life = CFG.life; ab.alt = 0.05;
      entranceStart(a); X.light && X.light(a.x, a.y, 4, 1); sfx('hum'); }
    function entranceStart(a) { if (a.gb.seal) return; a.gb.seal = 1; FX.push({ kind: 'seal', a, x: a.x, y: a.y, t: 0, life: 4.4, cine: 1 }); FX.push({ kind: 'eheart', a, x: a.x, y: a.y, t: 0, life: 2.6, cine: 1 });
      // (the petals start inside the rising heart and fly out to their slots once the crown forms)
      for (const p of a.gb.P) { p.mode = 'spring'; p.tx = p.x = a.x; p.ty = p.y = a.y; p.tz = p.z = 1.2; p.free = 1; p.sT = p.scale = 0.2; p.gT = 1.5; } }
    function entranceBeats(a) { const ab = a.gb, e = ab.en, B = ab.beats, once = (n, at, f) => { if (!B[n] && e >= at) { B[n] = 1; f(); } };
      if (e < 2.6) for (const p of ab.P) { p.tx = a.x; p.ty = a.y; p.tz = 0.8 + sstep(0.5, 2.0, e) * (ab.alt + sizeT(a) * 0.45); }
      once('rings', 1.0, () => sfx('chirp'));
      once('oracle', 1.5, () => { X.shake(3, 0.2); sfx('sparkle'); });
      once('petals', 2.6, () => { ab.P.forEach((p, i) => X.after(i * 0.04, () => { petHome(p); p.sT = 1; p.gT = 1.5; })); sfx('whoosh'); });
      once('wings', 3.0, () => { ab.kick = 1; FX.push({ kind: 'gust', x: a.x, y: a.y, t: 0, life: 0.9, seed: 5, big: 1, cine: 1 }); X.shake(6, 0.3); sfx('whoosh'); });
      once('glow', 3.4, () => { for (const p of ab.P) p.gT = 0.3; FX.push({ kind: 'scatter', a, x: a.x, y: a.y, t: 0, life: 1.4, cine: 1, seed: rnd() * 40 }); sfx('sparkle'); });
      once('cry', 3.8, () => { ab.cry = 1; X.shake(8, 0.4); sfx('crash'); g.zoomP = 0.97; g.zoomT = 0.6; FX.push({ kind: 'cry', a, x: a.x, y: a.y, t: 0, life: 0.9, cine: 1 }); if (!gpu()) X.ring(a.x, a.y, 0.4, 3, 0.6, COL.rose, 0.3); }); }
    function entrance(a) { stOf(a); }

    /* ================= drawing ================= */
    const anc = a => a.gbOut || null;
    const WS = [0, 0], W2S = (x, y, z) => { WS[0] = sx(x); WS[1] = sy(y) - (z || 0) * T(); return WS; };   // (a scratch pair: read at once)
    /* the GLM parts of a frame: pooled records, every field set each time (no allocation while drawing) */
    const PPL = [], PARTS = []; let PPN = 0;
    function pp(L, m, X, Y, z, s, yaw, tilt, a, gl, o, R, mesh, g2) { const e = PPL[PPN] || (PPL[PPN] = {}); PPN++; e.m = m; e.X = X; e.Y = Y; e.z = z; e.s = s; e.yaw = yaw; e.tilt = tilt; e.a = a; e.g = gl; e.o = o || 0; e.R = R || null; e.mesh = mesh || null; e.g2 = g2 || 0; e.r = mesh ? s * 7 : 0; e.kind = 0; e.t = g.t; L.push(e); }
    let SPEAR = null;
    /* the celestial spear (a GLM mesh in Gabriel's materials): white blade sections, a gold mechanical frame, a rose-quartz heart at its centre,
       rings of heart inscriptions; along +z, its point at z = -6, its butt at +6 (model units) */
    function spearMesh() {
      if (SPEAR) return SPEAR; const G = GLG(); if (typeof GLM === 'undefined' || !G) return null;
      const MT = G.MT || {}, Mc = MT.ceramic || 980, Mg = MT.gold || 981, Mq = MT.quartz || 983, Mb = (MT.blade || 986) + 0.2, Ml = MT.light || 989, B = GLM.builder(1);
      B.tube([0, 0, -1.2], [0, 0, 5.6], 0.16, 0.12, Mg, { seg: 10, cap: 'round' });
      B.crystal([0, 0, -1.4], [0, 0, -6.2], 0.55, Mb, { n: 6, belly: 0.25 });
      for (const s of [-1, 1]) { B.crystal([s * 0.35, 0, -1.6], [s * 1.0, 0, -4.6], 0.22, Mb, { n: 4, belly: 0.3 }); B.crystal([s * 0.3, 0, 3.2], [s * 0.9, 0, 5.9], 0.15, Mc, { n: 4, belly: 0.4 }); }
      const hp = []; for (let i = 0; i < 28; i++) { const t = i / 28 * TAU; hp.push([HX(t) * 1.25, -HY(t) * 1.25 + 0.15]); }
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0.6]); B.prism(hp, -0.32, 0.32, Mq + 0.2); B.pop();
      B.push([1, 0, 0], [0, 0, 1], [0, -1, 0], [0, 0, 0.6]); for (let i = 0; i < 28; i++) { const t0 = i / 28 * TAU, t1 = (i + 1) / 28 * TAU; B.tube([HX(t0) * 1.42, -HY(t0) * 1.42 + 0.15, 0], [HX(t1) * 1.42, -HY(t1) * 1.42 + 0.15, 0], 0.11, 0.11, Mg, { seg: 6 }); } B.pop();
      B.torZ([0, 0, 2.2], 0.55, 0.07, Mg, { seg: 18 }); B.torZ([0, 0, 3.0], 0.42, 0.06, Ml, { seg: 16 }); B.torZ([0, 0, -1.0], 0.62, 0.08, Mg, { seg: 18 });
      SPEAR = B.done(); if (G.own) try { G.own(SPEAR); } catch (e) {} return SPEAR;
    }
    /* the floor layer */
    function groundOne(Q, f, Tz, parts) {
      const X0 = f.x != null ? sx(f.x) : 0, Y0 = f.y != null ? sy(f.y) : 0, u = f.t / f.life, lq = LQ();
      if (f.kind === 'seal') { const R = Tz * 2.6, k2 = sstep(0, 0.4, f.t) * (1 - sstep(f.life - 0.8, f.life, f.t)); FXP.seal(Q, X0, Y0, R, sstep(0.1, 1.4, f.t), f.t * 0.25, 1.1 * k2); Q.glow(X0, Y0, R * 1.3, COL.pink, 0.25 * k2, FSY); }
      else if (f.kind === 'lilies') { const k2 = sstep(0, 0.4, f.t) * (1 - sstep(f.life - 0.8, f.life, f.t)), n = f.k >= 3 ? 9 : 6;
        for (let i = 0; i < n * lq; i++) { const an = i / n * TAU + f.seed, r = (0.7 + 0.5 * ((i * 7) % 3) / 2) * Tz, x = X0 + cos(an) * r, y = Y0 + sin(an) * r * FSY; FXP.flower(Q, x, y, Tz * (0.28 + 0.06 * (i % 3)), eout(cl((f.t - i * 0.05) / 0.6)) * k2, i % 3 === 0 ? 1 : 0, k2, f.seed + i); } Q.glow(X0, Y0, Tz * 1.6, COL.rose, 0.25 * k2, FSY); }
      else if (f.kind === 'pulse') { FXP.wave(Q, X0, Y0, Tz * 2.2, eout(u), 0.3, 1.1 * (1 - u), 0.12); Q.glow(X0, Y0, Tz * 1.4, COL.pink, 0.4 * (1 - u), FSY); }
      else if (f.kind === 'hwave') { const R = Tz * (f.big === 2 ? 7 : 3.4); FXP.wave(Q, X0, Y0, R, eout(cl(u * 1.4)), sstep(0.35, 0.8, u), 1.3 * (1 - sstep(0.6, 1, u)), 0.09); Q.glow(X0, Y0, R * 0.5, COL.mag, 0.5 * (1 - u), FSY);
        if (u > 0.3) for (let i = 0; i < 5 * lq; i++) { const an = i / 5 * TAU + f.seed; FXP.flower(Q, X0 + cos(an) * R * 0.35, Y0 + sin(an) * R * 0.35 * FSY, Tz * 0.32, sstep(0.3, 0.7, u), 1, 1 - sstep(0.75, 1, u), f.seed + i); } }
      else if (f.kind === 'det') { const R = Tz * CFG.thr.detR; FXP.wave(Q, X0, Y0, R * 1.2, eout(u), sstep(0.3, 0.8, u), 1.4 * (1 - u), 0.12); FXP.wave(Q, X0, Y0, R * 0.8, eout(cl(u * 1.6)), 0, 1.2 * (1 - u), 0.07); }
      else if (f.kind === 'gust') { const R = Tz * (f.big ? 2.6 : 1.7); Q.ring(X0, Y0, R * eout(u), COL.blush, 0.5 * (1 - u), R * 0.12, FSY); Q.glow(X0, Y0, R * 0.7, COL.pink, 0.22 * (1 - u), FSY); }
      else if (f.kind === 'pur') { Q.ring(X0, Y0, Tz * (0.4 + 1.2 * eout(u)), COL.pearl, 0.7 * (1 - u), Tz * 0.12, FSY); }
      else if (f.kind === 'sancOut') { FXP.wave(Q, X0, Y0, f.R * Tz * 1.1, 0.6 + 0.4 * u, 0, 0.8 * (1 - u), 0.15); }
      else if (f.kind === 'conv') { FXP.wave(Q, X0, Y0, Tz * CFG.harv.convR * 1.2, eout(u), sstep(0.3, 0.8, u), 1.2 * (1 - u), 0.1); }
      void parts;
    }
    function drawGround(c) {
      const L = list(); if (!FX.length && !L.length && !sanc && !field && !ulOn()) return;
      const Tz = T(); if (gpu()) { PARTS.length = 0; PPN = 0; const Q = fgOpen(c), parts = PARTS;
        for (const a of L) { const al = (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1); if (!(al > 0.02)) continue; const ab = a.gb, fl = ab ? cl(ab.alt / (sizeT(a) * 0.55)) : 0, gx = sx(a.x), gy = sy(a.y), r = sizeT(a) * Tz * 0.5;
          Q.sshadow(gx, gy, r * 0.55 * (1 - 0.35 * fl), r * 0.55 * 0.4 * (1 - 0.35 * fl), 0.35 * al * (1 - 0.5 * fl), '#0A0610'); Q.glow(gx, gy, r * 0.9, COL.pink, 0.1 * al, FSY); }
        if (sanc && sanc.on) { const X0 = sx(sanc.x), Y0 = sy(sanc.y), R = sanc.R * Tz, k2 = sstep(0, 0.5, sanc.t) * (1 - sstep(sanc.dur - 0.5, sanc.dur, sanc.t)); FXP.wave(Q, X0, Y0, R, 0.92, 0.5, 0.55 * k2, 0.05); Q.glow(X0, Y0, R, COL.pink, 0.16 * k2, FSY); FXP.seal(Q, X0, Y0, R * 0.8, 1, sanc.t * 0.2, 0.35 * k2); }
        if (field) { const X0 = sx(field.x), Y0 = sy(field.y), R = CFG.bloom.fieldR * Tz, k2 = sstep(0, 0.4, field.t) * (1 - sstep(field.life - 0.6, field.life, field.t)); Q.glow(X0, Y0, R * 1.1, COL.rose, 0.3 * k2, FSY); FXP.wave(Q, X0, Y0, R, 0.95, 1, 0.5 * k2, 0.05);
          for (let i = 0; i < 8 * LQ(); i++) { const an = i / 8 * TAU + field.t * 0.4; FXP.flower(Q, X0 + cos(an) * R * 0.8, Y0 + sin(an) * R * 0.8 * FSY, Tz * 0.3, k2, i % 2, k2, i * 3); } }
        for (const f of FX) groundOne(Q, f, Tz, parts);
        if (UL) try { UL.drawGround(c, Q); } catch (e) {}
        fgClose(c); }
    }
    /* the air layer: hearts, blades' trails, threads, the dome, the spears, bursts; GLM parts in one pass after the painter */
    function airOne(Q, f, Tz, parts) {
      const u = f.t / f.life, lq = LQ();
      if (f.kind === 'hfly') { if (f.t < 0) return; const v = 1 - eout(u), tx = me.x, ty = me.y, x = lerp(f.x0, tx, eout(u)) + sin(u * Math.PI) * f.sd * 0.7, y = lerp(f.y0, ty, eout(u)), z = lerp(f.z0, 0.9, eout(u)) + sin(u * Math.PI) * 1.1;
        const [X1, Y1] = W2S(x, y, z), r = Tz * (0.22 + 0.08 * sin(u * Math.PI)); Q.glow(X1, Y1, r * 3, COL.pink, 0.45 * (0.5 + 0.5 * v)); const [Xp, Yp] = W2S(lerp(f.x0, tx, eout(u - 0.12)), lerp(f.y0, ty, eout(u - 0.12)), lerp(f.z0, 0.9, eout(u - 0.12)) + sin((u - 0.12) * Math.PI) * 1.1); FXP.thread(Q, Xp, Yp, X1, Y1, r * 0.5, 0.6, f.t * 3, 0, COL.rose);
        if (glOn()) pp(parts, 'heart', X1, Y1, sy(y), r * 0.9, 1.57 + 0.5 * sin(f.t * 5 + f.seed), 0.2, 1, 1.2, sstep(0.8, 1, u)); else FXP.heart(Q, X1, Y1, r, 0, 0, 1, 1, sstep(0.8, 1, u)); }
      else if (f.kind === 'pulse') { const [X1, Y1] = W2S(f.x, f.y, 0.6); for (let i = 0; i < 6 * lq; i++) { const an = i / 6 * TAU + f.t * 2, rr = Tz * (0.3 + 1.2 * eout(u)); FXP.heart(Q, X1 + cos(an) * rr, Y1 + sin(an) * rr * 0.6 - u * Tz * 0.8, Tz * 0.14, 0, 0, 1, 1 - u, 1); } Q.glow(X1, Y1, Tz * 1.2, COL.blush, 0.5 * (1 - u)); }
      else if (f.kind === 'burst') { const [X1, Y1] = W2S(f.x, f.y, 0.5), R = Tz * 0.9 * f.k; Q.glow(X1, Y1, R * (0.5 + u), COL.pink, 0.8 * (1 - u)); Q.star(X1, Y1, R * 1.4 * (1 - u * 0.5), 0.9 * (1 - u), COL.pearl);
        for (let i = 0; i < 5 * lq; i++) { const an = i / 5 * TAU + f.seed, d = R * (0.2 + 1.1 * eout(u)); FXP.heart(Q, X1 + cos(an) * d, Y1 + sin(an) * d * 0.7 + u * u * Tz * 0.5, Tz * 0.13 * f.k, an + f.t * 6, 1, 0.8, 1 - u, 0); } }
      else if (f.kind === 'mdet') { const [X1, Y1] = W2S(f.x, f.y, 1.2); FXP.heart(Q, X1, Y1 - u * Tz * 0.4, Tz * (0.3 + 0.4 * eout(u)), 0, 1, 2, 1 - u, eout(u)); Q.glow(X1, Y1, Tz * 1.3, COL.mag, 0.6 * (1 - u)); }
      else if (f.kind === 'shards') { const [X1, Y1] = W2S(f.x, f.y, 0.4); for (let i = 0; i < 10 * lq; i++) { const an = i / 10 * TAU + f.seed, v = 2.6 + (i % 3), d = Tz * v * eout(u) * 0.8, up = Tz * (2.2 * u - 2.6 * u * u) * (1 + (i % 2));
          FXP.heart(Q, X1 + cos(an) * d, Y1 + sin(an) * d * 0.6 - up, Tz * 0.16, an + f.t * 9, 1, 1, 1 - sstep(0.6, 1, u), 0); } Q.glow(X1, Y1, Tz * 2, COL.pink, 0.7 * (1 - u)); }
      else if (f.kind === 'det' || f.kind === 'conv') { const big = f.kind === 'det', [X1, Y1] = W2S(f.x, f.y, big ? 1.6 : 1.2), R = Tz * (big ? 2.4 : 1.4), sw = bump(f.t, 0, 0.08, 0.2, 0.7);
          if (glOn()) pp(parts, 'heartBig', X1, Y1, Y1, R * 0.45 * (0.5 + 0.8 * eout(cl(u * 2))), 1.57 + 0.3 * sin(f.t * 2), 0.1, 1 - sstep(0.55, 0.9, u), 1.5 + 2 * sw, eout(u)); else FXP.heart(Q, X1, Y1, R * 0.8, 0, u, 2, 1 - u, eout(u));
          Q.glow(X1, Y1, R * (1.2 + u), COL.pink, 0.8 * (1 - u)); Q.glow(X1, Y1, R * 0.6, '#FFFFFF', 0.9 * sw); FXP.pillar(Q, X1, Y1 + R * 0.6, R * 0.6, Tz * 8 * (1 - u * 0.4), 0.9 * (1 - u), 0, 2);
          for (let i = 0; i < 8 * lq; i++) { const an = i / 8 * TAU + f.seed, d = R * (0.4 + 2.2 * eout(u)); FXP.heart(Q, X1 + cos(an) * d, Y1 + sin(an) * d * 0.65, Tz * 0.2, an, 1, 1.2, 1 - u, 0.5); } }
      else if (f.kind === 'scatter') { const r = anc(f.a), cx = r && r.heart ? r.heart.x : sx(f.x), cy = r && r.heart ? r.heart.y : sy(f.y) - Tz * 2; for (let i = 0; i < 16 * lq; i++) { const an = i / 16 * TAU + f.seed, d = Tz * (0.3 + 3.2 * eout(u)); FXP.heart(Q, cx + cos(an) * d, cy + sin(an) * d * 0.7 + u * u * Tz, Tz * 0.17, an * 0.3, 0, 1.2, 1 - u, 0); } Q.glow(cx, cy, Tz * 2.2, COL.pink, 0.6 * (1 - u)); }
      else if (f.kind === 'cry') { const r = anc(f.a), b = r && r.beak ? r.beak : { x: sx(f.x), y: sy(f.y) - Tz * 3 }; Q.ring(b.x, b.y, Tz * (0.4 + 3 * eout(u)), COL.blush, 0.6 * (1 - u), Tz * 0.15); Q.ring(b.x, b.y, Tz * (0.2 + 2 * eout(u)), COL.white, 0.5 * (1 - u), Tz * 0.08); }
      else if (f.kind === 'eheart') { const X0 = sx(f.x), z = 0.6 + 2.2 * eout(cl((f.t - 0.4) / 1.2)), [X1, Y1] = [X0, sy(f.y) - z * Tz - (f.a.gb ? f.a.gb.alt : 0) * Tz * 0], k2 = sstep(0.4, 0.9, f.t) * (1 - sstep(1.8, 2.6, f.t)), s = Tz * 0.9 * sstep(0.3, 1.2, f.t);
        Q.glow(X1, Y1, s * 2.4, COL.pink, 0.6 * k2); FXP.pillar(Q, X0, sy(f.y), s * 0.8, z * Tz, 0.6 * k2, 0, 1); if (glOn()) pp(parts, 'heartBig', X1, Y1, Y1, s * 0.4, 1.57 + 0.25 * sin(f.t * 1.3), 0.15, k2, 1.4); else FXP.heart(Q, X1, Y1, s, 0, 0, 1.4, k2, 0);
        if (f.t > 1.0) for (let i = 0; i < 3; i++) { const R = s * (1.4 + 0.35 * i) * (1.6 - 0.6 * sstep(1.0, 1.8, f.t)); Q.ring(X1, Y1, R, COL.gold, 0.7 * k2 * sstep(1.0 + i * 0.15, 1.3 + i * 0.15, f.t), Tz * 0.05, 0.35 + 0.2 * i); } }
      else if (f.kind === 'seal') { const X0 = sx(f.x), Y0 = sy(f.y), CS = typeof CONSTELLATION !== 'undefined' && CONSTELLATION.virgo, k2 = sstep(0, 0.4, f.t) * (1 - sstep(f.life - 1.2, f.life - 0.4, f.t)), dr = sstep(0.1, 1.3, f.t);
        if (CS) { const W = Tz * 4.2, Hh = Tz * 2.6, ox = X0 - W / 2, oy = Y0 - Tz * 4.6; CS.e.forEach(([i, j], n) => { const v = cl(dr * CS.e.length - n); if (v <= 0) return; const ax = ox + CS.p[i][0] * W, ay = oy + CS.p[i][1] * Hh, bx = ox + CS.p[j][0] * W, by = oy + CS.p[j][1] * Hh; FXP.thread(Q, ax, ay, lerp(ax, bx, v), lerp(ay, by, v), Tz * 0.08, 0.9 * k2, f.t, 0, COL.rose); });
          CS.p.forEach(([x, y], i) => { const on = cl(dr * CS.p.length - i); if (on > 0) { Q.star(ox + x * W, oy + y * Hh, Tz * 0.35 * on, k2, COL.pearl); Q.glow(ox + x * W, oy + y * Hh, Tz * 0.5, COL.pink, 0.6 * k2 * on); } }); } }
    }
    /* the rose-pink trails its tail ribbons leave in flight: a short ring of world points per tail tip (the model's anchors), drawn as
       tapering ribbons of light; nothing recorded when it hovers still */
    const TRN = 10, TRK = 3;
    function trail(a, dt) { const ab = a.gb, o = a.gbOut, tips = o && (o.tailTips || (o.tailTip ? [o.tailTip] : null)); if (!tips) return; const R = ab.tr || (ab.tr = { b: new Float32Array(TRN * TRK * 3), n: 0, i: 0, t: 0, x: a.x, y: a.y });
      if (Math.hypot(a.x - R.x, a.y - R.y) > 2.5) R.n = 0; R.x = a.x; R.y = a.y; R.t -= dt; const sp = Math.hypot(ab.vx, ab.vy); if (R.t > 0) return; R.t = 0.045;
      if (sp < 0.8 && !a.gbUlt) { R.n = Math.max(0, R.n - 1); return; } const Tz = T(); for (let k = 0; k < TRK; k++) { const p = tips[k % tips.length], j = (R.i * TRK + k) * 3; R.b[j] = a.x + (p.x - sx(a.x)) / Tz; R.b[j + 1] = a.y; R.b[j + 2] = (sy(a.y) - p.y) / Tz; }
      R.i = (R.i + 1) % TRN; R.n = Math.min(TRN, R.n + 1); }
    function trailAir(Q, a, Tz) { const R = a.gb && a.gb.tr; if (!R || R.n < 2) return; const al = (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1);
      for (let k = 0; k < TRK; k++) for (let q = 0; q < R.n - 1; q++) { const i0 = ((R.i - 1 - q + TRN * 2) % TRN * TRK + k) * 3, i1 = ((R.i - 2 - q + TRN * 2) % TRN * TRK + k) * 3, f = 1 - q / R.n;
        const x0 = sx(R.b[i0]), y0 = sy(R.b[i0 + 1]) - R.b[i0 + 2] * Tz, x1 = sx(R.b[i1]), y1 = sy(R.b[i1 + 1]) - R.b[i1 + 2] * Tz; FXP.thread(Q, x0, y0, x1, y1, Tz * 0.14 * f, 0.7 * f * al, g.t * 2 + k, 0.2, k ? COL.rose : COL.pink); } }
    /* a monster's Judgement Marks: a fractured crystal heart over it (one, two, three) */
    function marksAir(Q, Tz) { for (const m of MARK) { const n = marksOf(m); if (!n || m.dead) continue; const X0 = sx(m.x), Y0 = sy(m.y) - Tz * (0.9 + m.r * 1.6), fade = cl((m.gbJT - g.t) / 1.0), p = 0.85 + 0.15 * sin(g.t * 6 + m.x);
      for (let i = 0; i < n; i++) FXP.heart(Q, X0 + (i - (n - 1) / 2) * Tz * 0.36, Y0 - (i === 1 ? Tz * 0.08 : 0), Tz * 0.17 * p, 0, 1, 0.6 + 0.4 * n, 0.9 * fade, 0); Q.glow(X0, Y0, Tz * 0.5, COL.mag, 0.25 * fade); } }
    /* the pet's Grace Hearts: small crystal hearts circling it */
    function graceAir(Q, Tz) { const n = graceN(); if (!n || me.dead) return; const X0 = sx(me.x), Y0 = sy(me.y) - Tz * 0.55, fade = cl((me.gbGraceT - g.t) / 1.0);
      for (let i = 0; i < n; i++) { const an = g.t * 1.6 + i / n * TAU, x = X0 + cos(an) * Tz * 0.55, y = Y0 + sin(an) * Tz * 0.2 - Tz * 0.25 * sin(g.t * 2 + i), back = sin(an) < 0; FXP.heart(Q, x, y, Tz * (back ? 0.11 : 0.14), 0, 0, 1, fade * (back ? 0.6 : 1), 0); Q.glow(x, y, Tz * 0.3, COL.pink, 0.35 * fade); } }
    /* the Sanctuary's cathedral: the dome, its heart-arch front, the petals' threads woven up to the apex */
    function domeAir(Q, Tz, parts) { const s = sanc; if (!s) return; const X0 = sx(s.x), Y0 = sy(s.y), R = s.R * Tz, Hd = R * 1.25, k2 = s.on ? sstep(0, 0.6, s.t) * (1 - sstep(s.dur - 0.5, s.dur, s.t)) : 0; if (k2 < 0.01) return;
      FXP.dome(Q, X0, Y0 + R * FSY * 0.2, R * 1.05, Hd, sstep(0, 1.1, s.t), s.hitT * 3, k2 * (lowFx() ? 0.8 : 1), s.k);
      const a = s.a, ab = a && a.gb; if (ab && s.t < 1.4) for (let i = 0; i < 12; i++) { const p = ab.P[i]; if (p.mode === 'home') continue; const [px, py] = W2S(p.x, p.y, p.z); FXP.thread(Q, px, py, X0, Y0 - Hd * 0.95, Tz * 0.06, 0.8 * (1 - sstep(1.0, 1.4, s.t)), g.t * 2 + i, 0.4, COL.rose); }
      if (glOn() && !lowFx()) for (let i = 0; i < 3; i++) { const an = g.t * 0.8 + i / 3 * TAU; pp(parts, 'heart', X0 + cos(an) * R * 0.55, Y0 - Hd * (0.45 + 0.1 * sin(g.t + i)), Y0 + sin(an) * R * 0.3, Tz * 0.12, 1.57 + 0.5 * sin(g.t + i), 0.2, k2, 1); } }
    /* the blades' trails and the Oracle's threads to them; the spears */
    function actAir(Q, a, Tz, parts) { const ab = a.gb, A = ab && ab.act, r = anc(a); if (!A) return;
      if (A.kind === 'harv') { const hand = r && (A.kind && (r[(a.gbS.orCastSide === 'L' ? 'handL' : 'handR')])); for (const B of A.bl) { if (B.st < 1 || B.st >= 4) continue; const p = ab.P[B.p], [X1, Y1] = W2S(p.x, p.y, p.z);
          Q.glow(X1, Y1, Tz * 0.6, COL.pink, 0.55); const [X2, Y2] = W2S(p.x - p.d[0] * 0.9, p.y - p.d[1] * 0.9, p.z - p.d[2] * 0.9); Q.beam(X2, Y2, X1, Y1, Tz * 0.16, COL.rose, 0.6); if (hand) FXP.thread(Q, hand.x, hand.y, X1, Y1, Tz * 0.035, 0.55, g.t * 3 + B.i, 0.2, COL.rose); } }
      if (A.kind === 'thr') { for (const s of A.sp) { if (s.st < 1 || s.st > 2) continue; const [X1, Y1] = W2S(s.x, s.y, s.z), gk = s.g || 0, sc = Tz * 0.45 * (0.3 + 0.7 * eout(gk));
          Q.glow(X1, Y1, Tz * 2 * gk, COL.pink, 0.5 * gk); if (s.st === 2) FXP.pillar(Q, X1, sy(s.y), Tz * 0.7, Y1 - sy(s.y) < 0 ? (sy(s.y) - Y1) : 0, 0.5, 0, 3);
          if (glOn() && spearMesh()) pp(parts, 'mesh', X1, Y1, Y1, sc, 0, 0, min(1, gk * 1.5), 0.8 + gk, 0, SPR, SPEAR, s.st === 2 ? 1 : gk); else FXP.pillar(Q, X1, Y1 + Tz * 1.2, Tz * 0.25, Tz * 2.4, gk, 0, 2);
          if (r && s.st === 1) { if (r.handL) FXP.thread(Q, r.handL.x, r.handL.y, X1, Y1, Tz * 0.04, 0.6 * gk, g.t * 2, 0.3, COL.rose); if (r.handR) FXP.thread(Q, r.handR.x, r.handR.y, X1, Y1, Tz * 0.04, 0.6 * gk, g.t * 2 + 1, -0.3, COL.rose); } } } }
    const SPR = [1, 0, 0, 0, 0, -1, 0, 1, 0];   // (the spear upright on screen, its point down: model z -> screen +y)
    /* the light over the body: the Heart's glow, the threads of Grace (the Oracle's hands -> the Heart -> the wings -> the pet) */
    function bodyLight(c, a) {
      const r = anc(a); if (!r || !gpu()) return; const Sx = a.gbS || {}, al = (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1); if (!(al > 0.02)) return;
      const G = GLG(); if (G && G.lights) try { G.lights(c, r, Sx, al); } catch (e) {}
      const A = a.gb && a.gb.act, heal = A && (A.kind === 'bloom' || A.kind === 'sanct') ? bump(A.t, 0.4, 0.8, (A.kind === 'bloom' ? CFG.bloom.end : CFG.sanct.end) - 0.7, A.kind === 'bloom' ? CFG.bloom.end : CFG.sanct.end) : 0;
      if (heal < 0.02 && !(Sx.orStruggle > 0.2)) return; const Q = fgOpen(c), Tz = T(), u = r.unit || Tz * 0.1, ph = g.t * 2.5;
      if (heal > 0.02 && r.heart) { const P = [sx(me.x), sy(me.y) - Tz * 0.5], hk = r.heart;
        for (const hd of [r.handL, r.handR]) if (hd) FXP.thread(Q, hd.x, hd.y, hk.x, hk.y, u * 0.5, 0.8 * heal * al, ph, 0.3, COL.rose);
        for (const w of [r.wingNodeL || r.wingRootL, r.wingNodeR || r.wingRootR]) if (w) { FXP.thread(Q, hk.x, hk.y, w.x, w.y, u * 0.6, 0.7 * heal * al, ph + 1, 0.2, COL.pink); FXP.thread(Q, w.x, w.y, P[0], P[1], u * 0.5, 0.75 * heal * al, ph + 2, 0.5, COL.rose); Q.glow(w.x, w.y, u * 3, COL.pink, 0.5 * heal * al); }
        Q.glow(hk.x, hk.y, hk.r * 2.6, COL.pink, 0.55 * heal * al); if (r.handL) Q.glow(r.handL.x, r.handL.y, u * 2.5, COL.pearl, 0.6 * heal * al); if (r.handR) Q.glow(r.handR.x, r.handR.y, u * 2.5, COL.pearl, 0.6 * heal * al); }
      if (Sx.orStruggle > 0.2 && r.heart) Q.glow(r.heart.x, r.heart.y, r.heart.r * 2.2 * (1 + 0.2 * sin(g.t * 13)), COL.mag, 0.3 * Sx.orStruggle * al);
      fgClose(c);
    }
    function drawBodyFx(c, a) { bodyLight(c, a); }
    function drawFx(c) {
      const Tz = T(), L = list();
      if (gpu() && (FX.length || L.length || MARK.size || sanc || ulOn())) { PARTS.length = 0; PPN = 0; const Q = fgOpen(c), parts = PARTS;
        domeAir(Q, Tz, parts);
        for (const f of FX) airOne(Q, f, Tz, parts);
        for (const a of L) { actAir(Q, a, Tz, parts); if (field && a === L[0]) { const X0 = sx(field.x), Y0 = sy(field.y), k2 = sstep(0, 0.4, field.t) * (1 - sstep(field.life - 0.6, field.life, field.t)); for (let i = 0; i < 5; i++) { const an = field.t * 1.3 + i / 5 * TAU, x = X0 + cos(an) * CFG.bloom.fieldR * Tz * 0.7, y = Y0 + sin(an) * CFG.bloom.fieldR * Tz * 0.35 - Tz * (0.7 + 0.2 * sin(field.t * 2 + i));
            if (glOn()) pp(parts, 'heart', x, y, y, Tz * 0.13, 1.57 + 0.5 * sin(field.t * 2 + i), 0.2, k2, 1); else FXP.heart(Q, x, y, Tz * 0.17, 0, 0, 1, k2, 0); Q.glow(x, y, Tz * 0.5, COL.pink, 0.35 * k2); } } }
        marksAir(Q, Tz); graceAir(Q, Tz); for (const a of L) trailAir(Q, a, Tz);
        if (UL) try { UL.drawFx(c, Q, parts); } catch (e) {}
        fgClose(c);
        const G = GLG(); if (parts.length && glOn() && G.drawParts) { parts.sort((p, q) => p.z - q.z); c.save(); try { G.drawParts(c, parts); } catch (e) {} c.restore(); }
        if (UL) try { UL.drawSpec(c); } catch (e) {} }
      else if (UL) try { UL.drawFx(c); } catch (e) {}
    }
    /* screen space: a soft rosy dusk for the entrance; the ultimate's own */
    function drawCine(c, W, Hh) {
      let dim = 0; for (const a of list()) if (a.gb && a.gb.en >= 0 && !a.gb.ready) dim = max(dim, 0.3 * (1 - sstep(3.6, CFG.enter, max(0, a.gb.en))));
      if (dim > 0.005) { c.save(); const gr = c.createRadialGradient(W / 2, Hh * 0.45, min(W, Hh) * 0.2, W / 2, Hh * 0.45, max(W, Hh) * 0.75); gr.addColorStop(0, `rgba(30,8,24,${dim * 0.1})`); gr.addColorStop(1, `rgba(16,4,14,${min(0.9, dim * 1.1)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
      if (UL) try { UL.drawCine(c, W, Hh); } catch (e) {}
    }
    /* the summon button: the time left (a rose-gold arc) and the Grace Hearts laid on the pet */
    function drawBtn(c, b) {
      const a = list().find(q => q.st === 'fight' || q.st === 'awaken'); if (!a || !a.gb) return; const R = b.r + 6, life = cl(a.life / CFG.life), n = graceN();
      c.save(); c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(40,10,30,.75)'; c.beginPath(); c.arc(b.x, b.y, R, 0, TAU); c.stroke();
      c.strokeStyle = '#FFB3DA'; c.beginPath(); c.arc(b.x, b.y, R, -Math.PI / 2, -Math.PI / 2 + TAU * life); c.stroke();
      for (let i = 0; i < CFG.grace.max; i++) { const x = b.x + (i - 1) * 11, y = b.y - R - 9; c.fillStyle = i < n ? '#FF6FB5' : 'rgba(255,255,255,.25)'; c.beginPath(); c.moveTo(x, y + 3.5); c.bezierCurveTo(x - 5, y - 0.5, x - 2.6, y - 5, x, y - 2); c.bezierCurveTo(x + 2.6, y - 5, x + 5, y - 0.5, x, y + 3.5); c.fill(); }
      c.restore();
    }
    // (a power on demand, aimed as the mind would aim it: for showcases and tests)
    function cast(a, kind, o) { const ab = stOf(a); ab.ready = true; if (ab.act) interrupt(a); if (!H.near(a.x, a.y, 11).length && (kind === 'harv' || kind === 'thr')) return false; start(a, kind, o); return true; }
    return { tick, fin, cast, choose, update, stop, outK, descent, entrance, interrupt, drawGround, drawFx, drawBodyFx, drawCine, drawBtn, addMark, takeMarks, addGrace, cleanse, light, CFG, spear: () => spearMesh(), camFocus: () => { try { return UL && UL.cam ? UL.cam() : null; } catch (e) { return null; } },
      get ul() { return UL; }, get fx() { return FX; }, get marks() { return MARK; }, get sanc() { return sanc; }, get shield() { return shield; }, get field() { return field; }, get inc() { return inc; }, seed: v => { RS = (abs(v | 0) % 2147483646) + 1; } };
  }
  return { create, CFG, BIG, FXP, EVO, HX, HY, COL };
})();
if (typeof self !== 'undefined') self.GABRIEL_MOVES = GABRIEL_MOVES;
