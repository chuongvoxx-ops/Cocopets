/* ---------- (v464 RZ-A) Raziel, The Twin Revelation, in a fight: Dual Alignment, Thermal Shock, four powers, the lifecycle ----------
   Summoned, Raziel (the Gemini Anima, 02e; its model RAZIEL_GL, 02f7) fights through the Anima cycle (20g-dun-anima.js calls tick / fin /
   update and the draw hooks below), like Samael (20g4) and Asmodeus (20g5). Fire / Ice: Lux, its own left head, breathes fire (the game's
   'fire' blows and Burning), Umbra, its right, breathes ice (the game's 'frost' blows, Chill, and Freeze where the game allows it; a boss is
   only chilled). The summon rules (the user's): 30 s of active time counted from when it is combat-ready (the entrance is not counted); no
   cooldown on any power (an animation lock while a power plays, the buff's own duration, nothing else); it fights on its own; at the end
   of its time it starts nothing more, leaves its power cleanly, The Book of Two Heavens (RZ-U, 20g6b) fires once, and it leaves only when
   the ultimate's last frame is done. Whenever it is free its two minds weigh the field:
     Twin Fang Protocol   monsters at medium range (or a boss): both heads lower, Lux's throat runs white-hot from the Fire Core, frost
                          climbs Umbra's face, the crowns race; then a turbulent stream of fire and a blizzard of spiralling ice sweep the
                          field from opposite sides, following the real mouths, crossing into an X and meeting on the target in a Thermal
                          Shock explosion (steam, fractured crystal, white light). Damage in ticks along each visible stream. Level 4: two
                          sweeps (back and forth), level 7: three and a concentrated convergence blast.
     Mirror Divide        a crowd, or separated groups: both heads rise, the crowns part and turn against each other; the Infernal Heaven
                          (molten fractures, fiery glyphs, flame pillars, embers) and the Frozen Heaven (dendritic frost, crystal glyphs,
                          rising ice, snow) open on the floor and drift together, steam boiling on their shared edge. Burning in one, Chill
                          (and a short Freeze for one held there, never a boss) in the other. Level 4: larger, with eruptions of flame and
                          rising ice; level 7: both collapse to their middle in a great Thermal Shock detonation.
     Revelation Circuit   an opening to strengthen its combined attacks: both heads rise, the cores slide out of the chest, their rings
                          align, a white bridge of energy joins them and fire and frost run over the body, the wings spread. A buff for
                          8 / 10 / 12 s: Raziel's blows and its Thermal Shocks hit harder, the pet's (and every ally's) blows too; Concord
                          is held while it lasts; level 7 adds a convergence burst to every crossing. Casting it again refreshes it
                          (never stacks); the mind does not recast it while it has time to run.
     Binary Cataclysm     clustered targets (or a boss): it half rises on spread wings, Lux forms a turbulent plasma sun and Umbra a
                          turning planet of layered crystal; they fly on curved paths that spiral round each other (a molten trail, a trail
                          of frost and fragments) and collide on the target: the ice fractures, the sun swells, a Thermal Shock explosion
                          (white flash, fire rings, crystal shockwave, steam, plasma, fragments). 1 / 2 / 3 pairs, the last one enormous:
                          its strongest burst.
   Dual Alignment: Concord (the heads coordinate on one target or group, cores aligned, crowns in step: combined attacks +10%, Thermal
   Shock +15%) or Dissonance (each head on its own group, cores and crowns on their own rhythms: wider coverage, Burning and Chill held
   longer). The mind picks it from the field (a boss or one tight group: Concord; groups apart: Dissonance), holding a state at least
   CFG.align.hold s and leaving it only for a clear margin: no flicker. No manual stance.
   Thermal Shock: a monster struck by Raziel's fire and its ice within CFG.shock.win s: a burst of bonus damage (half Fire, half Ice, no
   new element) and a short defence break (+20% damage taken; a boss +8%, its bonus cut and capped at a small share of its health). The
   pairing is consumed and the monster cannot be shocked again for CFG.shock.lock s: never a loop, never once per particle or tick. The
   game's own Fire + Ice reaction (Melt, which would thaw Raziel's frost) is left to Thermal Shock for Raziel's own pairs (20j, v464 RZ-A).
   The last 5 s: the reactors flare, the crowns race, Lux's flames turn unstable, frost creeps over Umbra (the pose's `final`).
   Every number a design choice is in CFG. Without the GPU painter every power acts in full, shown with the game's own particles; lowFx
   thins the cosmetics (steam, embers, fragments), never the damage. The painter's pictures (kinds 450..465 in 20k6h) are exported as FXP
   for the ultimate.
   Clean-up: stop() (the stage ends), the pet's death, the end of the summon: every effect, mark and defence break dropped, the
   ultimate stopped, RAZIEL_GL freed once nothing is left on screen. */
const RAZIEL_MOVES = (() => {
  const TAU = Math.PI * 2, cl = u => (u < 0 ? 0 : u > 1 ? 1 : u), lerp = (a, b, u) => a + (b - a) * u;
  const sstep = (a, b, x) => { const u = cl((x - a) / (b - a)); return u * u * (3 - 2 * u); }, eout = u => 1 - Math.pow(1 - cl(u), 3);
  const bump = (t, a, b, c, d) => sstep(a, b, t) * (1 - sstep(c, d, t));
  const angD = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
  const FSY = 0.55, BIG = 1.0, EVO = [1, 1, 4, 7];
  /* ---- the numbers (damage multipliers times the Anima's power P = the pet's attack x ANIMA_POWER[form] (x 2 awakened); [a, b, c] by form) ---- */
  const CFG = {
    life: 30,
    enter: 4.4,                                                       // the entrance (s, not counted in the 30)
    walk: { speed: 2.5, acc: 2.6, turn: 2.6 },
    align: { hold: 3.2, margin: 0.2, every: 0.4, concordK: 1.1 },
    shock: { win: 2.6, lock: 2.0, lockBoss: 2.6, dmg: [0.55, 0.65, 0.75], bossK: 0.6, capBoss: 0.012, defT: [2.5, 3.0, 3.5], def: 0.15, defBoss: 0.08, concordK: 1.15 },
    status: { chill: 2.2, chillBoss: 1.0, burn: 3, burnK: 0.3, dis: 1.5 },
    fang: { sweeps: [1, 2, 3], wind: 0.75, sweep: 1.55, gap: 0.3, reach: 8.5, half: [2.2, 2.5, 2.8], w0: 0.3, w1: 0.62, tick: 0.1, dmgF: 0.07, dmgI: 0.065, cross: 0.6, crossR: 2.0, conv: 0.5, blast: 1.8, blastR: 2.8, rec: 0.55 },
    divide: { R: [2.6, 3.1, 3.6], dur: [5.5, 6.5, 7.5], cast: 1.1, tick: 0.5, dmgF: 0.09, dmgI: 0.08, drift: 0.32, hold: 2.0, freeze: 0.8, erupt: 0.8, eruptDmg: 0.4, eruptR: 1.0, collapse: 2.4, collapseR: 4.2, rec: 0.4 },
    circuit: { dur: [8, 10, 12], cast: 1.5, on: 1.0, self: [1.08, 1.12, 1.15], shockK: [1.2, 1.3, 1.45], ally: [0.06, 0.09, 0.12], pulse: 0.5, pulseR: 2.6, refresh: 2.5, conv: 0.8 },
    cata: { n: [1, 2, 3], rise: 0.8, form: 0.85, fly: 1.05, gap: 1.25, R: [3.2, 3.6, 4.0], core: 1.4, dmg: 2.4, coreK: 1.3, fin: 4.4, finR: 5.0, rec: 0.7 },
    fin: { len: 3.2, hit: 2.0, k: 8, R: 9 },
    // (v465 RZ-A) lively movement: speeds (tiles/s), the springs (1/s), how far from the pet it may roam (an ellipse, tiles)
    move: { rWalk: 0.5, rPath: 0.55, rLand: 0.8, touch: 0.2, hopAlt: 0.95, hopGap: 1.2, blockMax: 0.25, hover: 0.75, walk: 2.6, run: 4.2, fly: 6.2, swoop: 8.0, accG: 3.4, accA: 2.2, arrive: 1.6, up: 3.2, down: 3.8, maxR: 3.3, maxRy: 4.0, stride: [1.6, 3.2] },
    strafe: { L: 6.5, pass: 1.5, turn: 0.85, alt: 0.55, ahead: 2.3, lat: 1.0, rec: 0.9, chance: 0.3 },   // Twin Fang as a strafing pass
    soar: { R: 3.0, steps: 5, alt: 0.75, low: 0.35, dur: 5.0, every: 12, buffet: 1.2, buffetR: 2.2 },                               // a flying circuit and a swooping pass                          // (the finale when the ultimate's module is missing)
  };
  const COL = { fire: '#FF7A2E', hot: '#FFD9A0', gold: '#FFC24D', crim: '#E0301E', ice: '#7FD8FF', pale: '#DDF6FF', deep: '#2F6FE0', white: '#FFFFFF', steam: '#E4ECF2', ash: '#2A1C18' };
  const lowFx = () => !!(typeof st !== 'undefined' && st && st.lowFx);
  const GLR = () => (typeof RAZIEL_GL !== 'undefined' ? RAZIEL_GL : null);
  /* the painter's parameter colours, quantised (the painter caches every colour string it is given: a bounded set) */
  const PCS = []; const hx = i => Math.min(255, i * 16).toString(16).padStart(2, '0');
  const pcol = (r, g) => { const i = Math.round(cl(r) * 16), j = Math.round(cl(g || 0) * 16), k = i * 17 + j; return PCS[k] || (PCS[k] = '#' + hx(i) + hx(j) + '00'); };

  /* ================= the painter's pictures (pure: Q an open FGFX batch, screen px) ================= */
  const FXP = {
    /* a stream from (x0, y0) (the mouth) to (x1, y1): w its widest half-width (px), heat 0..1, a alpha, bend (-0.6..0.6) */
    fireStream(Q, x0, y0, x1, y1, w, heat, a, seed, bend) { let dx = x1 - x0, dy = y1 - y0; const L0 = Math.hypot(dx, dy); if (L0 < 2 || !(a > 0.004)) return; const ux = dx / L0, uy = dy / L0; x0 -= ux * L0 * 0.06; y0 -= uy * L0 * 0.06; dx = (x1 - x0) / 2; dy = (y1 - y0) / 2; const L = Math.hypot(dx, dy), H = w / 0.43, vx = -dy / L * H, vy = dx / L * H;
      Q.quad(450, x0 + dx, y0 + dy, dx, dy, vx, vy, pcol(0.5 - 0.5 * vy / H, heat), a, bend || 0, seed || 0, 1); },
    iceStream(Q, x0, y0, x1, y1, w, a, seed, bend) { let dx = x1 - x0, dy = y1 - y0; const L0 = Math.hypot(dx, dy); if (L0 < 2 || !(a > 0.004)) return; const ux = dx / L0, uy = dy / L0; x0 -= ux * L0 * 0.05; y0 -= uy * L0 * 0.05; dx = (x1 - x0) / 2; dy = (y1 - y0) / 2; const L = Math.hypot(dx, dy), H = w / 0.38, vx = -dy / L * H, vy = dx / L * H;
      Q.quad(451, x0 + dx, y0 + dy, dx, dy, vx, vy, '#FFFFFF', a, bend || 0, seed || 0, 1); },
    sun(Q, x, y, r, a, seed, spin, hot) { if (r > 0.5) Q.quad(454, x, y, r / 0.6, 0, 0, r / 0.6, '#FFFFFF', a, spin == null ? 0.5 : spin, seed || 0, hot || 1); },
    planet(Q, x, y, r, a, seed, spin, crack) { if (r > 0.5) Q.quad(455, x, y, r / 0.6, 0, 0, r / 0.6, '#FFFFFF', a, spin == null ? 0.4 : spin, seed || 0, 1 + (crack || 0)); },
    shock(Q, x, y, R, age, a, seed, sy) { if (R > 0.5 && age < 1) Q.quad(456, x, y, R, 0, 0, R * (sy || 1), '#FFFFFF', a, age, seed || 0, 1); },
    fireRing(Q, x, y, R, front, a, seed, sy) { if (R > 1) Q.quad(460, x, y, R, 0, 0, R * (sy || FSY), '#FFFFFF', a, front, seed || 0, 1); },
    frostRing(Q, x, y, R, front, a, seed, sy) { if (R > 1) Q.quad(461, x, y, R, 0, 0, R * (sy || FSY), '#FFFFFF', a, front, seed || 0, 1); },
    embers(Q, x, y, r, age, a, seed, dens) { if (r > 1) Q.quad(458, x, y, r, 0, 0, r, '#FFFFFF', a, age, seed || 0, dens == null ? 1 : dens); },
    snow(Q, x, y, r, age, a, seed, dens, swirl) { if (r > 1) Q.quad(459, x, y, r, 0, 0, r, pcol(swirl == null ? 0.75 : swirl), a, age, seed || 0, dens == null ? 1 : dens); },
    seal(Q, x, y, R, side, draw, turn, a, sy) { if (R > 1) Q.quad(457, x, y, R, 0, 0, R * (sy || 1), pcol(side === 'R' ? 1 : 0), a, draw, turn || 0, 1); },
    fireField(Q, x, y, R, grow, a, seed, sy, pulse) { if (R > 1) Q.quad(452, x, y, R, 0, 0, R * (sy || FSY), pcol(pulse || 0), a, grow, seed || 0, 1); },
    iceField(Q, x, y, R, grow, a, seed, sy) { if (R > 1) Q.quad(453, x, y, R, 0, 0, R * (sy || FSY), '#FFFFFF', a, grow, seed || 0, 1); },
    bridge(Q, x0, y0, x1, y1, w, a, seed, turns) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 1) return; Q.quad(465, x0 + dx, y0 + dy, dx * 1.12, dy * 1.12, -dy / L * w, dx / L * w, '#FFFFFF', a, turns || 2, seed || 0, 1); },
    trailFire(Q, x0, y0, x1, y1, w, a, seed) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 1) return; Q.quad(462, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, '#FFFFFF', a, 0, seed || 0, 1); },
    trailIce(Q, x0, y0, x1, y1, w, a, seed) { const dx = (x1 - x0) / 2, dy = (y1 - y0) / 2, L = Math.hypot(dx, dy); if (L < 1) return; Q.quad(463, x0 + dx, y0 + dy, dx, dy, -dy / L * w, dx / L * w, '#FFFFFF', a, 0, seed || 0, 1); },
    charge(Q, x, y, r, side, ch, a, seed) { if (r > 1) Q.quad(464, x, y, r, 0, 0, r, pcol(side === 'R' ? 1 : 0), a, ch, seed || 0, 1); },
    steam(Q, x, y, r, a, seed) { if (r > 1) Q.smoke(x, y, r, a, seed || 0, COL.steam, 0.15); },
  };

  function create(H) {
    const X = H.X, me = H.me, g = H.g, T = H.T, ST = H.ST, S = H.S;
    const NMv = () => (typeof self !== 'undefined' && self.NIDHOGG_MOVES) || null;
    const gpu = () => { try { const N = NMv(); return !!(N && N.FGFX && N.FGFX.usable()); } catch (e) { return false; } };
    const glOn = () => { const G = GLR(); try { return !!(G && G.ok()); } catch (e) { return false; } };
    const fgOpen = c => { const F = NMv().FGFX; F.flush(c); return F.begin(c, null); };
    const fgClose = c => { const F = NMv().FGFX; F.flush(c); F.begin(c, null); };
    const sfx = n => { try { if (X.sfx && X.sfx[n]) X.sfx[n](); } catch (e) {} };
    const FX = [];                 // effects in the world: { kind, t, life, ... } (world tiles)
    /* (v465 RZ-A) its own dice for what it decides (where it goes, what it casts): the game's random also feeds sounds and particles, so a
       test can seed these alone (seed(v)) and every decision replays exactly */
    let RS = ((Math.random() * 2147483645) | 0) + 1; const rnd = () => (RS = RS * 16807 % 2147483647) / 2147483647;
    const MARK = new Set();        // monsters carrying Raziel's fire / ice marks or its defence break
    let released = true, FIN = null, txtT = 0, BURST = 4;
    const PEND = [];   // (Thermal Shock bursts past this frame's budget, shown over the next frames: 4 new a frame, 16 while the ultimate runs)
    const kOf = a => Math.max(1, Math.min(3, a.k | 0)), LQ = () => (lowFx() ? 0.5 : 1);
    const list = () => S.list.filter(a => a.id === 'gemini');
    const sx = x => X.sx(x), sy = y => X.sy(y);
    const sizeT = a => { const aw = a.st === 'awaken' || a.rzUlt; return ANIMA_SIZE[aw ? 3 : kOf(a)] * (aw ? 1.18 : 1) * BIG; };
    /* ---- the ultimate (RZ-U's module) plugs in here (scratchpad hooks.md) ---- */
    let UL = null;
    const H2 = Object.assign({}, H, {
      pose: a => stOf(a) && a.rzS, anchors: a => a.rzOut || null, kOf,
      fire: (a, m, d, o) => fireHit(a, m, d, o), ice: (a, m, d, o) => iceHit(a, m, d, o),
      shock: (a, m, x, y, k) => thermalShock(a, m, k, true),
      onDone: a => { if (a.rz) { a.rz.act = null; } },
    });
    try { if (typeof RAZIEL_ULT !== 'undefined') { UL = RAZIEL_ULT.create(H2); if (UL && UL.warm) setTimeout(() => { try { UL.warm(); } catch (e) {} }, 400); } } catch (e) { UL = null; }
    const ulOn = () => { try { return !!(UL && UL.active()); } catch (e) { return false; } };

    /* ---- its blows: Fire and Ice through the game's own hit, statuses, the Revelation Circuit, Dual Alignment; Thermal Shock ---- */
    const buffOn = a => !!(a && a.rz && a.rz.buffT > g.t);
    const selfK = a => (buffOn(a) ? CFG.circuit.self[a.rz.buffK - 1] : 1);
    const pw = a => H.P(a) * selfK(a);
    const modeOf = a => (a && a.rz && a.rz.mode) || 'concord';
    function fireHit(a, m, d, o) {
      if (!m || m.dead || !(d > 0)) return 0; o = o || {}; const tick = !!o.tick;
      const r = H.hit(m, d * (o.combined && modeOf(a) === 'concord' ? CFG.align.concordK : 1), { el: 'fire', rz: 1, dot: tick, dotC: '#FFB070', noAggro: tick && !o.aggro, noCrit: o.noCrit, big: o.big, kb: o.kb, noText: o.noText });
      if (a && a.rz) a.rz.dealt = (a.rz.dealt || 0) + (r || 0);   // (v465 RZ-A: its own blows' total, for the tests)
      if (m.dead) return r; const C = CFG.status, ext = modeOf(a) === 'dissonance' ? C.dis : 1;
      m.burn = Math.max(m.burn || 0, C.burn * ext); m.burnD = Math.max(m.burnD || 0, ST().atk * C.burnK);
      m.rzF = g.t; MARK.add(m); if (!o.noShock) shockCheck(a, m); return r;
    }
    function iceHit(a, m, d, o) {
      if (!m || m.dead || !(d > 0)) return 0; o = o || {}; const tick = !!o.tick;
      const r = H.hit(m, d * (o.combined && modeOf(a) === 'concord' ? CFG.align.concordK : 1), { el: 'frost', rz: 1, dot: tick, dotC: '#BFEFFF', noAggro: tick && !o.aggro, noCrit: o.noCrit, big: o.big, kb: o.kb, noText: o.noText, freeze: o.freeze });
      if (a && a.rz) a.rz.dealt = (a.rz.dealt || 0) + (r || 0);
      if (m.dead) return r; const C = CFG.status, ext = modeOf(a) === 'dissonance' ? C.dis : 1;
      m.chill = Math.max(m.chill || 0, (m.boss ? C.chillBoss : C.chill) * ext);
      if (o.freeze && tick) { if (!m.boss) m.freeze = Math.max(m.freeze || 0, o.freeze); else m.chill = Math.max(m.chill, 1.5); }   // (as the game's own: a boss is only chilled)
      m.rzI = g.t; MARK.add(m); if (!o.noShock) shockCheck(a, m); return r;
    }
    /* half Fire, half Ice (a convergence: both elements land; the pairing is checked once after both) */
    function dualHit(a, m, d, o) { const o2 = Object.assign({}, o, { noShock: true, combined: true }); fireHit(a, m, d * 0.5, o2); iceHit(a, m, d * 0.5, o2); if (!(o && o.noShock)) shockCheck(a, m); }
    function shockCheck(a, m) { const W = CFG.shock.win; if (!m.dead && m.rzF > g.t - W && m.rzI > g.t - W && !(m.rzTS > g.t)) thermalShock(a, m, 1, false); }
    /* a Thermal Shock on m: bonus damage, a short defence break; the pairing consumed and the monster locked out for a moment.
       forced (the ultimate's bursts): no pairing needed, the lock-out still applies */
    function thermalShock(a, m, k, forced) {
      if (!a || !m || m.dead || m.rzTS > g.t) return false; if (!forced && !(m.rzF > g.t - CFG.shock.win && m.rzI > g.t - CFG.shock.win)) return false;
      const C = CFG.shock, kk = kOf(a); let d = H.P(a) * C.dmg[kk - 1] * (k || 1) * (buffOn(a) ? CFG.circuit.shockK[a.rz.buffK - 1] : 1) * (modeOf(a) === 'concord' ? C.concordK : 1);
      if (m.boss) d = Math.min(d * C.bossK, m.maxhp * C.capBoss);
      m.rzF = 0; m.rzI = 0; m.rzTS = g.t + (m.boss ? C.lockBoss : C.lock); m.rzDefT = g.t + C.defT[kk - 1]; MARK.add(m);
      const r1 = H.hit(m, d * 0.5, { el: 'fire', rz: 1, noCrit: true, big: true }) || 0, r2 = !m.dead ? H.hit(m, d * 0.5, { el: 'frost', rz: 1, noCrit: true, big: true, noText: true }) || 0 : 0; if (a.rz) a.rz.dealt = (a.rz.dealt || 0) + r1 + r2;
      if (a.rz) { a.rz.shocks = (a.rz.shocks || 0) + 1; a.rz.heat = Math.min(1, (a.rz.heat || 0) + 0.25); }
      shockFx(m.x, m.y, 0.9 + 0.1 * kk, false);
      if (g.t > txtT) { txtT = g.t + 0.7; X.text(m.x, m.y - (m.r || 0.5) - 1.0, 'THERMAL SHOCK', '#F2FBFF', 13, { life: 0.9 }); }
      return true;
    }
    /* ---- effect records ---- */
    const nSteam = () => { let n = 0; for (const f of FX) if (f.kind === 'steam') n++; return n; };
    /* steam: bounded (18 puffs, 9 in lowFx): past the bound the oldest puff is taken over, never another layer added */
    function steamAt(x, y, r, life, n) { const cap = Math.round(18 * LQ()); n = Math.round((n || 1) * LQ()) || 1; for (let i = 0; i < n; i++) { let o = null;
      if (nSteam() >= cap) { for (const f of FX) if (f.kind === 'steam' && (!o || f.t / f.life > o.t / o.life)) o = f; if (!o) return; } else { o = { kind: 'steam' }; FX.push(o); }
      Object.assign(o, { x: x + (Math.random() - 0.5) * r * 0.6, y: y + (Math.random() - 0.5) * r * 0.4, z: 0.3 + Math.random() * 0.5, r: r * (0.6 + Math.random() * 0.5), vz: 0.8 + Math.random() * 0.8, t: 0, life: life || 1.4, seed: Math.random() * 40 }); } }
    function shockFx(x, y, R, big) {
      if (BURST <= 0) { const o = PEND.find(q => Math.hypot(q.x - x, q.y - y) < 1.2); if (o) { o.R = Math.max(o.R, R); o.big = o.big || big; o.n++; } else if (PEND.length < 24) PEND.push({ x, y, R, big, n: 1, t: g.t }); return; }   // (merged with a near one, else queued)
      BURST--; shockFx0(x, y, R, big); }
    function shockFx0(x, y, R, big) {
      FX.push({ kind: 'shock', x, y, R: R * (big ? 1.6 : 1), t: 0, life: big ? 0.9 : 0.65, seed: Math.random() * 40, big: !!big });
      steamAt(x, y, R * 1.1, big ? 1.8 : 1.3, big ? 3 : 2);
      if (big) { FX.push({ kind: 'ringF', x, y, R: R * 2.2, t: 0, life: 0.8, seed: Math.random() * 40 }); FX.push({ kind: 'ringI', x, y, R: R * 2.5, t: 0, life: 0.65, seed: Math.random() * 40 }); }
      for (let i = 0; i < Math.round((big ? 6 : 3) * LQ()); i++) { const an = Math.random() * TAU, v = 1.5 + Math.random() * 2.5; FX.push({ kind: i % 2 ? 'frag' : 'ember', x, y, z: 0.5, vx: Math.cos(an) * v, vy: Math.sin(an) * v * 0.6, vz: 2 + Math.random() * 3, t: 0, life: 0.9, s: 0.1 + Math.random() * 0.08, rot: Math.random() * 6, seed: Math.random() * 90 }); }
      if (!gpu()) { X.boom(x, y, R, '#FF8A3A', '#CFEFFF', { n: big ? 18 : 8, shake: 0, smoke: big ? 4 : 2 }); X.ring(x, y, 0.2, R * 1.4, 0.35, '#BFEFFF', 0.12); }
      if (big) { X.shake(9, 0.3); X.light(x, y, 4, 0.4); sfx('crash'); } else sfx('whoosh');
    }

    /* ---- state ---- */
    function stOf(a) {
      if (!a.rz) { const G = GLR(); a.rz = { act: null, last: null, last2: null, mode: 'concord', modeT: -99, evalT: 0, clock: 0, ready: false, first: false, en: -1, beats: {}, gap: 0, vx: 0, vy: 0, face: Math.PI / 2 + 0.35, faceT: null, walk: 0, buffT: 0, buffK: 1,
        recL: 0, recR: 0, heat: 0, shocks: 0, aL: { x: 0, y: 0 }, aR: { x: 0, y: 0 }, lkL: null, lkR: null, alt: 0, altV: 0, altT: 0, bank: 0, beat: 0, hd: null, airT: -99, strT: null, sOx: 0, sOy: 0, hp: { L: { x: 0, y: 0, dx: 0, dy: 1, wx: 0, wy: 0 }, R: { x: 0, y: 0, dx: 0, dy: 1, wx: 0, wy: 0 } }, steps: 0 };
        a.rzS = (G && G.idle ? G.idle(EVO[kOf(a)], 0) : {}) || {}; a.rzS.x = a.x; a.rzS.y = a.y; }
      return a.rz;
    }
    /* the two mouths (screen px and their floor points in world tiles): the model's anchors, else an estimate from its heading */
    function heads(a) {
      const ab = a.rz, o = a.rzOut, Tz = T(), R = ab.hp;
      for (let i = 0; i < 2; i++) { const sd = i ? 'R' : 'L', m = o && (i ? o.mouthR : o.mouthL), P = R[sd];
        if (m && isFinite(m.x) && isFinite(m.y)) { P.x = m.x; P.y = m.y; P.dx = m.dx || 0; P.dy = m.dy || 0; P.wx = m.wx != null && isFinite(m.wx) ? m.wx : a.x + (m.x - sx(a.x)) / Tz; P.wy = m.wy != null && isFinite(m.wy) ? m.wy : a.y + (m.gy != null ? (m.gy - sy(a.y)) / Tz : 0.3); }
        else { const f = ab.face, lx = Math.sin(f), ly = -Math.cos(f), s = i ? -1 : 1, hT = sizeT(a); P.wx = a.x + Math.cos(f) * hT * 0.28 + lx * s * hT * 0.2; P.wy = a.y + Math.sin(f) * hT * 0.2 + ly * s * hT * 0.15; P.x = sx(P.wx); P.y = sy(P.wy) - hT * 0.72 * Tz * (1 + 0.4 * (a.rzS.fly || 0)); P.dx = Math.cos(f); P.dy = 0.4; } }
      return R;
    }
    function crowd(x, y, reach, rr) { const tg = H.near(x, y, reach); if (!tg.length) return null; let best = null, bn = -1;
      for (const m of tg) { let n = 0; for (const q of tg) if (Math.hypot(q.x - m.x, q.y - m.y) < rr) n++; if (n > bn) { bn = n; best = m; } }
      const L = tg.filter(q => Math.hypot(q.x - best.x, q.y - best.y) < rr); return { x: L.reduce((s, m) => s + m.x, 0) / L.length, y: L.reduce((s, m) => s + m.y, 0) / L.length, n: L.length, m: best, list: L, boss: L.some(m => m.boss) }; }
    /* the groups on the field, largest first (at most 4) */
    function groups(foes, rr) { const left = foes.slice(), out = [];
      while (left.length && out.length < 4) { let bn = null; for (const m of left) { const nb = left.filter(q => Math.hypot(q.x - m.x, q.y - m.y) < rr); if (!bn || nb.length > bn.length) bn = nb; }
        out.push({ x: bn.reduce((s, m) => s + m.x, 0) / bn.length, y: bn.reduce((s, m) => s + m.y, 0) / bn.length, n: bn.length, boss: bn.some(m => m.boss), list: bn }); for (const q of bn) left.splice(left.indexOf(q), 1); }
      return out; }
    /* its heading: toward its quarry, but turned toward the viewer so both heads read */
    const faceTo = (a, x, y) => { const an = Math.atan2(y - a.y, x - a.x), d = angD(an, Math.PI / 2); return Math.PI / 2 + Math.max(-1.15, Math.min(1.15, d * 0.62)); };

    /* ---- Dual Alignment: weighed every CFG.align.every s; a state held at least `hold` s, left only for a margin ---- */
    function evalMode(a, foes) {
      const ab = a.rz; if (buffOn(a)) { if (ab.mode !== 'concord') setMode(a, 'concord'); return; }
      if (!foes.length) return; const G2 = groups(foes, 2.8), top = G2[0], n = foes.length, boss = foes.some(m => m.boss), sep = G2.length > 1 ? Math.hypot(G2[0].x - G2[1].x, G2[0].y - G2[1].y) : 0;
      const W = CFG.shock.win, half = foes.filter(m => (m.rzF > g.t - W) !== (m.rzI > g.t - W)).length;
      const con = 0.5 + (boss ? 0.45 : 0) + (n <= 2 ? 0.35 : 0) + (top.n / n > 0.7 ? 0.35 : 0) + 0.04 * Math.min(4, half);
      const dis = 0.45 + (G2.length >= 2 && sep > 4 ? 0.4 : 0) + 0.06 * Math.min(6, n) * (top.n / n < 0.6 ? 1 : 0.3) + (G2.length >= 3 ? 0.15 : 0);
      ab.score = { con, dis };
      const want = dis > con ? 'dissonance' : 'concord';
      if (want !== ab.mode && ab.clock - ab.modeT > CFG.align.hold && Math.abs(dis - con) > CFG.align.margin) setMode(a, want);
    }
    function setMode(a, m) { const ab = a.rz; if (ab.mode === m) return; ab.mode = m; ab.modeT = ab.clock; ab.flips = (ab.flips || 0) + 1; FX.push({ kind: 'modeFx', a, t: 0, life: 0.9, m }); sfx('chirp'); }

    /* ---- moving: it walks on four legs beside the pet, turned to its quarry; the gait follows the distance it covers ---- */
    /* ---- (v465 RZ-A) lively movement: it strides, takes off, flies circuits and swooping passes, banks, hovers and lands. One mover for all
       of it: a target point and a target height; the velocity and the height follow by exact exponential springs (the same at any frame
       rate). On the ground every step stays on the floor (walkPoint); in the air it may cross walls and gaps, but keeps near the pet and on
       screen, and it only comes down on floor. look: what it turns to when it is nearly still (moving, it faces where it goes) ---- */
    /* (v467 RZ-A) the floor under it: clear of walls, props, gaps and void for a footprint of radius r; the straight way between two
       points clear for its stride (from 0.2 tiles out: where it stands is judged by gOK alone); a spot to come down on: room for the
       whole footprint, on floor joined to the pet's (the game's walkPoint), cached a moment per target */
    const gOK = (x, y, r) => isFinite(x) && isFinite(y) && !X.blocked(x, y, r, 0);
    function pathOK(x0, y0, x1, y1) { const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 0.2); for (let i = 1; i <= n; i++) { const t = i / n; if (t * d < 0.2) continue; if (!gOK(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, CFG.move.rPath)) return false; } return true; }
    function landAt(ab, tx, ty) { const kx = Math.round(tx * 4), ky = Math.round(ty * 4), c = ab.lc; if (c && c.kx === kx && c.ky === ky && ab.clock - c.t < 0.5) return c.p;
      const R = CFG.move.rLand; let p = X.walkPoint(tx, ty, { r: R, mv: 0 }); if (!gOK(p.x, p.y, R)) p = X.walkPoint(me.x, me.y, { r: R, mv: 0 }); if (!gOK(p.x, p.y, R)) p = X.walkPoint(me.x, me.y, { r: CFG.move.rWalk + 0.05, mv: 0 });
      ab.lc = { kx, ky, t: ab.clock, p: { x: p.x, y: p.y } }; return ab.lc.p; }
    function moveTo(a, dt, tx, ty, vmax, alt, look) {
      const ab = a.rz, M = CFG.move; if (!(dt > 0)) return Math.hypot(tx - a.x, ty - a.y);
      { const ox = tx - me.x, oy = ty - me.y, q = Math.hypot(ox / M.maxR, oy / M.maxRy); if (q > 1) { tx = me.x + ox / q; ty = me.y + oy / q; } }
      const wasAir = ab.alt > 0.12;
      // (v467 RZ-A) on the ground only along clear floor. A ground target becomes a spot with room for its feet (and joined to the pet's
      // floor); the straight way there is checked step by step against its footprint, walls, props, gaps and void. A blocked way, a spot it
      // is not standing clear on, or a stride held back for a moment: it takes off, crosses high, and comes straight down on that spot
      // (a hop). Down from any flight the same way: only onto open floor, and only once above it. Nothing pushes it while it is in the air.
      let alt2 = alt;
      if (!(alt > 0.02)) {
        const L = landAt(ab, tx, ty); tx = L.x; ty = L.y;
        if (ab.hop && Math.hypot(ab.hop.x - tx, ab.hop.y - ty) > 1.2) ab.hop = { x: tx, y: ty, hi: ab.hop.hi };   // (the target moved on: so does the spot)
        if (!ab.hop) {
          if (ab.alt > 0.02) ab.hop = { x: tx, y: ty, hi: false };
          else { const stuck = !gOK(a.x, a.y, M.rWalk);
            if (stuck || ab.blockT > M.blockMax || (Math.hypot(tx - a.x, ty - a.y) > 0.3 && !pathOK(a.x, a.y, tx, ty))) { if (stuck || ab.clock - (ab.hopT == null ? -99 : ab.hopT) > M.hopGap) ab.hop = { x: tx, y: ty, hi: true }; else { tx = a.x; ty = a.y; } } }   // (just down: it waits a beat before another hop)
        }
        if (ab.hop) { const H0 = ab.hop, dH = Math.hypot(H0.x - a.x, H0.y - a.y); tx = H0.x; ty = H0.y; vmax = Math.max(vmax, M.run);
          if (!H0.down && (dH < M.touch || (dH < 3.5 && gOK(a.x, a.y, M.rLand) && pathOK(a.x, a.y, H0.x, H0.y)))) H0.down = true;   // (over open floor with a clear way on to the spot: it comes down here and strides the rest)
          else if (H0.down && dH > M.touch && !gOK(a.x, a.y, M.rWalk)) H0.down = false;   // (drifted over an edge while coming down: up again)
          if (H0.down && ab.alt > 0.02 && dH > M.touch && !pathOK(a.x, a.y, H0.x, H0.y)) { tx = a.x + ab.vx * 0.15; ty = a.y + ab.vy * 0.15; if (!gOK(tx, ty, M.rWalk)) { tx = a.x; ty = a.y; } }   // (the spot moved on past an edge: it settles where it is, and goes on from the ground)
          alt2 = H0.down ? 0 : H0.hi ? M.hopAlt : 0.35;
          if (H0.down && ab.alt <= 0.02) { if (gOK(a.x, a.y, M.rWalk)) { ab.hop = null; ab.hopT = ab.clock; ab.blockT = 0; } else { ab.lc = null; ab.hop = { x: tx, y: ty, hi: true }; } } }
      } else ab.hop = null;
      const tgt = alt2 > 0.02 ? alt2 + 0.05 * Math.sin(ab.clock * 2.3) : 0, w = tgt > ab.alt ? M.up : M.down, e = Math.exp(-w * dt), dd = ab.alt - tgt, j = (ab.altV + w * dd) * dt;
      ab.alt = Math.max(0, tgt + (dd + j) * e); ab.altV = (ab.altV - j * w) * e; ab.altT = alt2; if (ab.alt < 1e-3 && !(alt2 > 0.02)) { ab.alt = 0; ab.altV = 0; }
      const air = ab.alt > 0.12, dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy), want = d > 0.05 ? Math.min(vmax, d * M.arrive) : 0, k = 1 - Math.exp(-(air ? M.accA : M.accG) * dt);
      ab.vx += ((d > 0.05 ? dx / d * want : 0) - ab.vx) * k; ab.vy += ((d > 0.05 ? dy / d * want : 0) - ab.vy) * k;
      if (ab.alt > 0.02) { a.x += ab.vx * dt; a.y += ab.vy * dt; }   // (in the air: over walls, props and gaps, free)
      else {   // (on the ground: a step only onto clear floor, else along one axis, else none; held back, it counts the time and soon hops)
        const x0 = a.x, y0 = a.y, nx = x0 + ab.vx * dt, ny = y0 + ab.vy * dt, r = M.rWalk, in0 = gOK(x0, y0, r), ok = (x, y) => gOK(x, y, r) || (!in0 && gOK(x, y, 0.3));
        if (ok(nx, ny)) { a.x = nx; a.y = ny; } else if (ok(nx, y0)) a.x = nx; else if (ok(x0, ny)) a.y = ny;
        const wnt = Math.hypot(ab.vx, ab.vy) * dt, got = Math.hypot(a.x - x0, a.y - y0);
        if (wnt > 0.5 * dt && got < wnt * 0.8) ab.blockT = (ab.blockT || 0) + dt; else ab.blockT = Math.max(0, (ab.blockT || 0) - 2 * dt);
        if (got < wnt * 0.999) { ab.vx = (a.x - x0) / dt; ab.vy = (a.y - y0) / dt; } }
      // the heading, the bank into a turn, the wingbeats (climbing and hovering beat hard, a fast level flight glides)
      const sp = Math.hypot(ab.vx, ab.vy), hd = Math.atan2(ab.vy, ab.vx), kb = 1 - Math.exp(-5 * dt);
      const bk = air && sp > 1 && ab.hd != null ? Math.max(-1, Math.min(1, -angD(hd, ab.hd) / dt * 0.22 * Math.min(1, sp / 4))) : 0; if (sp > 0.3) ab.hd = hd;
      ab.bank += (bk - ab.bank) * kb; const bt = air || alt > 0.02 ? Math.max(0.15, Math.min(1, 0.3 + 0.9 * Math.max(0, ab.altV) + 0.55 * (1 - Math.min(1, sp / M.fly)))) : 0; ab.beat += (bt - ab.beat) * kb;
      if (look && sp < 1.2) ab.faceT = faceTo(a, look.cx != null ? look.cx : look.x, look.cy != null ? look.cy : look.y); else if (sp > 0.8) ab.faceT = hd;
      // a lift-off and a touchdown: a downdraft of embers and frost; the ground thumps
      if (air && !wasAir) { FX.push({ kind: 'gust', x: a.x, y: a.y, t: 0, life: 0.7, seed: Math.random() * 40 }); sfx('whoosh'); }
      if (!air && wasAir) { FX.push({ kind: 'gust', x: a.x, y: a.y, t: 0, life: 0.6, seed: Math.random() * 40, land: 1 }); X.shake(4, 0.18); sfx('thud'); }
      if (air) ab.airT = ab.clock;
      return d;
    }
    /* a spot d tiles from c, on the side of `from`, turned by rot */
    const spotNear = (c0, from, d, rot) => { const c = { x: c0.cx != null ? c0.cx : c0.x, y: c0.cy != null ? c0.cy : c0.y }; let dx = from.x - c.x, dy = from.y - c.y; const L = Math.hypot(dx, dy) || 1; dx /= L; dy /= L; const cs = Math.cos(rot), sn = Math.sin(rot); return { x: c.x + (dx * cs - dy * sn) * d, y: c.y + (dx * sn + dy * cs) * d }; };
    /* free: it strides beside the pet between spots (never planted for long), turned to its quarry; far behind, it flies back */
    function guard(a, dt) {
      const ab = a.rz, side = a.side || -1, dp = Math.hypot(me.x - a.x, me.y - a.y);
      if (dp > 14) { const p = X.walkPoint(me.x + side * 2.6, me.y - 1.0, { r: 0.7, mv: 0, x: me.x, y: me.y }); a.x = p.x; a.y = p.y; ab.vx = ab.vy = 0; ab.alt = ab.altV = 0; return; }
      const f = H.near(a.x, a.y, 9)[0]; let tx = me.x + side * 2.8 + (me.vx || 0) * 0.4, ty = me.y - 1.2 + (me.vy || 0) * 0.4;
      if (f) { tx = lerp(tx, f.x, 0.35); ty = lerp(ty, f.y, 0.35); } else ab.faceT = Math.PI / 2 - 0.35 * side;
      if (ab.strT == null || ab.clock > ab.strT) { const S2 = CFG.move.stride; ab.strT = ab.clock + S2[0] + rnd() * (S2[1] - S2[0]); ab.sOx = (rnd() - 0.5) * 2.4; ab.sOy = (rnd() - 0.5) * 1.5; }
      moveTo(a, dt, tx + ab.sOx, ty + ab.sOy, CFG.move.walk * (dp > 6 ? 1.6 : 1), dp > 8 ? 0.6 : 0, f || null);
    }
    /* the heads' quarry when free: Concord one monster for both, Dissonance each its own (the one on its side) */
    function lookFree(a) {
      const ab = a.rz, foes = H.near(a.x, a.y, 9); ab.lkL = ab.lkR = null; if (!foes.length) return;
      if (ab.mode === 'concord' || foes.length < 2) { ab.lkL = ab.lkR = foes[0]; return; }
      // (each head on its own side; Lux drawn to a monster carrying frost, Umbra to one burning: the pairing a Thermal Shock needs)
      const f = ab.face, lx = Math.sin(f), ly = -Math.cos(f), W = CFG.shock.win, side = m => (m.x - a.x) * lx + (m.y - a.y) * ly, frost = m => m.rzI > g.t - W && !(m.rzF > g.t - W), burnt = m => m.rzF > g.t - W && !(m.rzI > g.t - W);
      const byL = foes.slice(0, 6).sort((p, q) => side(q) - side(p)); ab.lkL = byL.find(frost) || byL[0]; ab.lkR = byL.slice().reverse().find(m => burnt(m) && m !== ab.lkL) || byL[byL.length - 1];
    }

    /* ---- the mind: no cooldowns; when free it weighs the field (distance, groups, statuses, a boss, its time left), never a fixed order ---- */
    const domainsOn = () => FX.some(f => (f.kind === 'domF' || f.kind === 'domI') && f.t < f.life - 1.0);
    const buffLeft = a => Math.max(0, (a.rz.buffT || 0) - g.t);
    function durOf(kind, k, n, air) { if (kind === 'fang' && air) { const C = CFG.strafe; return 1.0 + n * C.pass + (n - 1) * C.turn + (k >= 3 ? 0.9 : 0) + C.rec; } if (kind === 'soar') return 3.5; if (kind === 'fang') { const C = CFG.fang; return C.wind + n * C.sweep + (n - 1) * C.gap + (k >= 3 ? 0.9 : 0) + C.rec; }
      if (kind === 'divide') return CFG.divide.cast + CFG.divide.rec; if (kind === 'circuit') return CFG.circuit.cast; if (kind === 'cata') { const C = CFG.cata; return C.rise + C.form + C.fly + (n - 1) * C.gap + C.rec; } return 1; }
    /* how many sweeps / pairs fit in the time left (at least one) */
    function fitN(kind, k, nMax, life, air) { let n = nMax; while (n > 1 && durOf(kind, k, n, air) > life + 0.2) n--; return n; }
    function choose(a) {
      const ab = a.rz, k = kOf(a), foes = H.near(a.x, a.y, 11); if (!foes.length) return null;
      const life = a.life, opts = [], G2 = groups(foes, 2.8), top = G2[0], boss = foes.find(m => m.boss), d0 = Math.hypot(foes[0].x - a.x, foes[0].y - a.y);
      const W = CFG.shock.win, half = foes.filter(m => (m.rzF > g.t - W) !== (m.rzI > g.t - W)).length, med = foes.filter(m => { const d = Math.hypot(m.x - a.x, m.y - a.y); return d > 2.2 && d < 8.5; }).length;
      const sep = G2.length > 1 ? Math.hypot(G2[0].x - G2[1].x, G2[0].y - G2[1].y) : 0, bl = buffLeft(a);
      // monsters at medium range (or a boss): Twin Fang Protocol; one carrying one element: the complementary crossing
      if (life > CFG.fang.wind + CFG.fang.sweep * 0.55 + CFG.fang.rec) opts.push({ kind: 'fang', s: 0.5 + 0.06 * Math.min(5, med) + (boss ? 0.15 : 0) + 0.08 * Math.min(3, half) + (d0 < 2 ? -0.1 : 0), o: { air: foes.length >= 2 && life > durOf('fang', k, 1, true) && rnd() < CFG.strafe.chance } });   // (v465 RZ-A: half the time a strafing pass)
      // a crowd, or groups apart: Mirror Divide (one pair of domains at a time)
      if (!domainsOn() && life > 1.6) opts.push({ kind: 'divide', s: 0.3 + 0.04 * Math.min(6, foes.length) + (G2.length >= 2 && G2[1].n >= 2 && sep > 3.5 ? 0.3 : 0) + (ab.mode === 'dissonance' ? 0.12 : 0) + (top.n >= 4 ? 0.08 : 0) });
      // the opening to strengthen what follows: Revelation Circuit (not while it still has time to run, nor when too little time is left to use it)
      if (bl < CFG.circuit.refresh && life > 5) opts.push({ kind: 'circuit', s: 0.45 + 0.04 * Math.min(6, foes.length) + (boss ? 0.2 : 0) + (top.n >= 3 ? 0.08 : 0) - (bl > 0 ? 0.1 : 0) });
      // clustered high-priority targets (or a boss): Binary Cataclysm
      if ((top.n >= 2 || boss) && life > durOf('cata', k, 1) - 0.3) opts.push({ kind: 'cata', s: 0.32 + 0.09 * Math.min(5, top.n) + (boss ? 0.3 : 0) + (bl > 0 ? 0.12 : 0) });
      // (v465 RZ-A) now and then, between powers, a flying circuit and a swooping pass over the monsters
      if (life > 4.5 && ab.clock - (ab.soarT == null ? -99 : ab.soarT) > CFG.soar.every && ab.last !== 'soar') opts.push({ kind: 'soar', s: 0.52 + 0.03 * Math.min(6, foes.length) });
      for (const q of opts) { if (q.kind === ab.last) q.s *= 0.6; else if (q.kind === ab.last2) q.s *= 0.85; q.s += rnd() * 0.12; }
      if (!opts.length) return null; opts.sort((p, q) => q.s - p.s); return opts[0].s > 0.3 ? opts[0] : null;
    }

    /* ---- the powers ---- */
    function start(a, kind, o) {
      const ab = a.rz, k = kOf(a); ab.act = Object.assign({ kind, t: 0, k }, o || {}); const A = ab.act; ab.last2 = ab.last; ab.last = kind; ab.faceT = null;
      const foes = H.near(a.x, a.y, 11), G2 = groups(foes, 2.8);
      if (kind === 'fang') { const C = CFG.fang; A.n = fitN('fang', k, C.sweeps[k - 1], a.life); A.tk = 0; A.blast = k >= 3 && durOf('fang', k, A.n) <= a.life + 0.2; A.sw = C.sweep * Math.max(0.55, Math.min(1, (a.life - C.wind - C.rec - (A.blast ? 0.9 : 0)) / (A.n * C.sweep + (A.n - 1) * C.gap) * 1.0)); A.end = C.wind + A.n * A.sw + (A.n - 1) * C.gap + (A.blast ? 0.9 : 0) + C.rec;
        const tgA = A.m || (foes.find(m => m.boss) || (G2[0] ? G2[0] : foes[0]));
        A.cx = tgA ? tgA.x : a.x + Math.cos(ab.face) * 4; A.cy = tgA ? tgA.y : a.y + Math.sin(ab.face) * 3;
        if (ab.mode === 'dissonance' && G2.length > 1) { A.gL = { x: G2[0].x, y: G2[0].y }; A.gR = { x: G2[1].x, y: G2[1].y }; } else A.gL = A.gR = null;
        A.sL = 0; A.sR = 0; A.cross = null; A.xT = 0; A.bl = false; A.fx0 = FX.length; ab.faceT = faceTo(a, A.cx, A.cy); sfx('hum');
        if (A.air) { A.n = fitN('fang', k, C.sweeps[k - 1], a.life, true); A.blast = k >= 3 && durOf('fang', k, A.n, true) <= a.life + 0.2; A.gL = A.gR = null; strafeInit(a, A); }   // (v465 RZ-A: a strafing pass)
        else goTo(a, A, spotNear(A, me, 3.3, (rnd() - 0.5) * 2.0), 1.2, true); }   // (v465 RZ-A: to a good angle first)
      else if (kind === 'divide') { const C = CFG.divide; A.end = C.cast + C.rec; A.laid = false; sfx('hum'); const c = G2[0]; if (c) { A.cx = c.x; A.cy = c.y; goTo(a, A, spotNear(c, a, 3.4, (rnd() - 0.5) * 1.6), 1.4, true); } }
      else if (kind === 'circuit') { A.end = CFG.circuit.cast + 0.3; A.on = false; sfx('hum'); }
      else if (kind === 'cata') { const C = CFG.cata; A.n = fitN('cata', k, C.n[k - 1], a.life); A.pairs = []; for (let i = 0; i < A.n; i++) A.pairs.push({ i, launch: C.rise + C.form + i * C.gap, form0: i ? C.rise + C.form + i * C.gap - 0.9 : C.rise, st: 0, hist: [], sx0: 0, done: false, last: i === A.n - 1 && k >= 3 && A.n >= 3 });
        A.end = durOf('cata', k, A.n) + 0.7; const c = (foes.find(m => m.boss)) || G2[0]; A.cx = c ? c.x : a.x + 3; A.cy = c ? c.y : a.y; ab.faceT = faceTo(a, A.cx, A.cy); sfx('hum');
        const h = spotNear(A, me, 3.2, (rnd() < 0.5 ? -1 : 1) * (0.5 + rnd() * 0.8)); goTo(a, A, h, 1.2, false); A.orb = rnd() < 0.5 ? -1 : 1; }   // (v465 RZ-A: strides in (flies if far), takes off as the spheres rise, casts from a hover)
      else if (kind === 'soar') { ab.soarT = ab.clock; soarInit(a, A, G2[0] || me); }
      if (A.hx == null) { A.hx = a.x; A.hy = a.y; }
    }
    /* (v465 RZ-A) the move before a power: to the spot (walking, or a short flight when it is far), only if it is worth the trip */
    function goTo(a, A, s, minD, land) { const d = Math.hypot(s.x - a.x, s.y - a.y); if (d < minD) { if (land && a.rz.alt > 0.1) A.go = { x: a.x + a.rz.vx * 0.3, y: a.y + a.rz.vy * 0.3, alt: 0, v: CFG.move.run, tmax: 1.2, land }; return; }   /* (a grounded power: down first) */ s = landAt(a.rz, s.x, s.y); const clear = a.rz.alt <= 0.02 && pathOK(a.x, a.y, s.x, s.y), far = d > (clear ? 6.5 : 4.5); A.go = { x: s.x, y: s.y, alt: far ? 0.6 : 0, v: far ? CFG.move.fly : CFG.move.run, tmax: far ? 1.7 : Math.max(1.3, d / CFG.move.run + 0.5), land }; }   // (v467 RZ-A: a spot it can stand on; it runs the clear way, flies a long or blocked one)
    /* (v465 RZ-A) Twin Fang as a strafing pass: in from one side, low over the monsters, both breaths raking the ground ahead and crossing, a
       banked turn and back (2, 3 passes by form), at level 7 a hover over the target for the convergence blast, then it lands */
    function strafeInit(a, A) {
      const C = CFG.strafe; let dx = A.cx - me.x, dy = A.cy - me.y; const L = Math.hypot(dx, dy) || 1; let ux = -dy / L, uy = dx / L;
      if (Math.abs(uy) > 0.75) { ux = (ux >= 0 ? 1 : -1); uy = 0.3 * (uy >= 0 ? 1 : -1); const l = Math.hypot(ux, uy); ux /= l; uy /= l; }   // (passes across the screen read best)
      if ((a.x - A.cx) * ux + (a.y - A.cy) * uy > 0) { ux = -ux; uy = -uy; }   // (in from the side it is on)
      A.ux = ux; A.uy = uy; A.nx = -uy; A.ny = ux; A.go = { x: A.cx - ux * C.L / 2, y: A.cy - uy * C.L / 2, alt: C.alt + 0.2, v: CFG.move.fly, tmax: 1.8 };
      A.end = A.n * C.pass + (A.n - 1) * C.turn + (A.blast ? 0.9 : 0) + C.rec; }
    function strafeStep(a, A, t0, t, dt, cross) {
      const ab = a.rz, C = CFG.strafe, F = CFG.fang, P = pw(a), cyc = C.pass + C.turn, lastEnd = A.n * C.pass + (A.n - 1) * C.turn, blT = lastEnd + 0.55;
      const i = Math.min(A.n - 1, Math.floor(t / cyc)), u = (t - i * cyc) / C.pass, dir = i % 2 ? -1 : 1, pos = q => ({ x: A.cx + A.ux * C.L * (q - 0.5) * dir, y: A.cy + A.uy * C.L * (q - 0.5) * dir });
      const tg = A.m && !A.m.dead ? A.m : null; if (tg) { A.cx = lerp(A.cx, tg.x, 0.03); A.cy = lerp(A.cy, tg.y, 0.03); }
      if (t < lastEnd && u <= 1) {   // a pass
        const q = pos(Math.min(1.15, u + 0.18)); moveTo(a, dt, q.x, q.y, CFG.move.swoop, C.alt, null);
        const hp = heads(a), on = sstep(0, 0.08, u) * (1 - sstep(0.92, 1, u)), ax = a.x + A.ux * dir * C.ahead, ay = a.y + A.uy * dir * C.ahead, sL = ((hp.L.wx - a.x) * A.nx + (hp.L.wy - a.y) * A.ny) >= 0 ? 1 : -1;
        if (ab.mode === 'concord') { const sw = C.lat * (0.55 + 0.45 * Math.sin(u * TAU * 1.25)); ab.aL.x = ax - A.nx * sL * sw; ab.aL.y = ay - A.ny * sL * sw; ab.aR.x = ax + A.nx * sL * sw; ab.aR.y = ay + A.ny * sL * sw; }   // (raking side to side, crossing)
        else { ab.aL.x = ax + A.nx * sL * C.lat * 1.5; ab.aL.y = ay + A.ny * sL * C.lat * 1.5; ab.aR.x = ax - A.nx * sL * C.lat * 1.5; ab.aR.y = ay - A.ny * sL * C.lat * 1.5; }   // (two lanes)
        A.sL = A.sR = on; if (cross(i * cyc + 0.02)) { ab.recL = ab.recR = 0.8; sfx('whoosh'); X.shake(3, 0.15); }
        A.tk -= dt; if (A.tk <= 0 && on > 0.3) { A.tk += F.tick; streamHits(a, hp.L, ab.aL, P * F.dmgF, 'F'); streamHits(a, hp.R, ab.aR, P * F.dmgI, 'I'); }
        A.cross = segX(hp.L.wx, hp.L.wy, ab.aL.x, ab.aL.y, hp.R.wx, hp.R.wy, ab.aR.x, ab.aR.y); if (A.cross) { A.xT -= dt; if (A.xT <= 0) { A.xT = 0.12; steamAt(A.cross.x, A.cross.y, 0.9, 1.0, 1); } }
        if (cross(i * cyc + C.pass * 0.5) && (ab.mode === 'concord' || (buffOn(a) && kOf(a) >= 3))) convergence(a, ax, ay, P * F.cross * (buffOn(a) && kOf(a) >= 3 ? 1 + CFG.circuit.conv : 1), F.crossR, false); }
      else if (t < lastEnd) {   // the banked turn: wide and climbing, to the next pass's start
        A.sL = A.sR = 0; A.cross = null; const e = pos(1.0), q = { x: e.x + A.ux * dir * 0.9 + A.nx * 1.2 * dir, y: e.y + A.uy * dir * 0.9 + A.ny * 1.2 * dir }; moveTo(a, dt, q.x, q.y, CFG.move.fly, C.alt + 0.3, null); }
      else if (A.blast && t < blT + 0.25) {   // level 7: hover over the target, both heads on it, the blast
        const h = spotNear(A, me, 2.4, 0), hp = heads(a); moveTo(a, dt, h.x, h.y, CFG.move.fly, CFG.move.hover, A); ab.aL.x = ab.aR.x = A.cx; ab.aL.y = ab.aR.y = A.cy;
        A.sL = A.sR = bump(t, lastEnd + 0.1, lastEnd + 0.2, blT - 0.05, blT + 0.05) * 1.25; A.conv = true;
        A.tk -= dt; if (A.tk <= 0 && A.sL > 0.3) { A.tk += F.tick; streamHits(a, hp.L, ab.aL, P * F.dmgF * 0.6, 'F'); streamHits(a, hp.R, ab.aR, P * F.dmgI * 0.6, 'I'); }
        if (cross(blT)) { convergence(a, A.cx, A.cy, P * F.blast, F.blastR, true); ab.recL = ab.recR = 1; } }
      else { A.sL = A.sR = 0; A.conv = false; A.cross = null; moveTo(a, dt, a.x + ab.vx * 0.3, a.y + ab.vy * 0.3, CFG.move.run, 0, A); }   // (it lands)
    }
    /* (v465 RZ-A) a flying circuit round the monsters, then a swooping pass low over them, and down at a new vantage beside the pet */
    function soarInit(a, A, c) {
      const C = CFG.soar, a0 = Math.atan2(a.y - c.y, a.x - c.x), dir = rnd() < 0.5 ? -1 : 1; A.wp = []; A.wi = 0; A.cx = c.x; A.cy = c.y;
      for (let i = 1; i <= C.steps; i++) { const an = a0 + dir * i * 0.72; A.wp.push({ x: c.x + Math.cos(an) * C.R, y: c.y + Math.sin(an) * C.R * 0.8, alt: C.alt, v: CFG.move.fly }); }
      const l = A.wp[A.wp.length - 1]; A.wp.push({ x: c.x, y: c.y, alt: C.low, v: CFG.move.swoop, low: 1 }); A.wp.push({ x: c.x - (l.x - c.x) * 0.9, y: c.y - (l.y - c.y) * 0.9, alt: 0.8, v: CFG.move.swoop });
      const ld = spotNear(c, me, 3.0, (rnd() - 0.5) * 1.2); A.wp.push({ x: ld.x, y: ld.y, alt: 0, v: CFG.move.fly, land: 1 }); A.end = C.dur; A.hx = a.x; A.hy = a.y; }
    function soarStep(a, A, dt) { const ab = a.rz, W = A.wp[Math.min(A.wi, A.wp.length - 1)], d0 = Math.hypot(W.x - a.x, W.y - a.y), d = moveTo(a, dt, W.x, W.y, W.v, W.land && d0 < 1.4 ? 0 : W.alt, W.land ? A : null);
      if (W.low && d < 1.0 && !A.gusted) { A.gusted = true; FX.push({ kind: 'gust', x: a.x, y: a.y, t: 0, life: 0.9, seed: Math.random() * 40, big: 1 }); X.shake(3, 0.2); sfx('whoosh');   // (the downdraft as it sweeps over them: its wings' fire and frost buffet what is under it)
        const P = pw(a); for (const m of H.living()) if (Math.hypot(m.x - a.x, m.y - a.y) < CFG.soar.buffetR + m.r) dualHit(a, m, P * CFG.soar.buffet, { kb: 2 }); }
      if (d < (W.land ? 0.45 : 1.0) && A.wi < A.wp.length - 1) A.wi++; if (A.wi >= A.wp.length - 1 && W.land && d < 0.45 && ab.alt < 0.03) A.t = Math.max(A.t, A.end); }
    function act(a, dt) {
      const ab = a.rz, A = ab.act;
      // (v465 RZ-A) first the move to the power's spot (its own clock waits): heads already on the quarry
      if (A.go && !A.went) { const G0 = A.go; A.gt = (A.gt || 0) + dt; const d = Math.hypot(G0.x - a.x, G0.y - a.y), alt = G0.land && d < 1.2 ? 0 : G0.alt; moveTo(a, dt, G0.x, G0.y, G0.v, alt, A.cx != null ? { x: A.cx, y: A.cy } : null);
        if ((d < 0.45 && Math.abs(ab.alt - alt) < 0.12) || A.gt > G0.tmax) { A.went = true; const at = d < 0.45; A.hx = at ? G0.x : a.x; A.hy = at ? G0.y : a.y; }   /* (it settles on the spot itself: the same place at any frame rate) */ return; }   /* (one move a frame: the power's clock starts next frame) */
      const t0 = A.t; A.t += dt; const t = A.t, k = A.k, cross = x => t0 < x && t >= x, look = A.cx != null ? { x: A.cx, y: A.cy } : null;
      // (v465 RZ-A) where it is while the power plays: planted, lifted (the Circuit), hovering (the Cataclysm, landing after), or flying (the pass, the circuit)
      if (A.kind === 'cata') { const C = CFG.cata, lastL = A.pairs.length ? A.pairs[A.pairs.length - 1].launch : 0, hov = t < lastL + 0.6;   // (v465 RZ-A: down once the last pair is away)
        if (hov) { const dx = A.hx - A.cx, dy = A.hy - A.cy, an = (A.orb || 1) * 0.3 * dt, c2 = Math.cos(an), s2 = Math.sin(an); A.hx = A.cx + dx * c2 - dy * s2; A.hy = A.cy + dx * s2 + dy * c2; }   // (hovering, it drifts round its target)
        moveTo(a, dt, A.hx, A.hy, 1.8, hov ? CFG.move.hover : 0, look); }
      else if (A.kind === 'circuit') moveTo(a, dt, A.hx, A.hy, 1.2, 0, look);   // (v465 RZ-A: cast standing, reared up on the long legs)
      else if (A.kind === 'soar') soarStep(a, A, dt);
      else if (!(A.kind === 'fang' && A.air)) moveTo(a, dt, A.hx, A.hy, 1.2, 0, look);
      if (A.kind === 'fang') (A.air ? strafeStep : fangStep)(a, A, t0, t, dt, cross);
      else if (A.kind === 'divide') divideStep(a, A, t, cross);
      else if (A.kind === 'circuit') circuitStep(a, A, t, cross);
      else if (A.kind === 'cata') cataStep(a, A, t, dt);
      if (ab.act === A && t >= A.end) endAct(a);
    }
    function endAct(a) { const ab = a.rz; if (!ab || !ab.act) return; ab.act = null; ab.gap = 0.15; if (ab.alt < 0.05 && a.life > 4) { ab.gap = 0.55 + rnd() * 0.45; ab.strT = null; } }   // (v465 RZ-A: on the ground, a few strides to a new spot before the next power)
    /* a power cut short (the 30 s are up, the pet fell, the stage ends): no more blows; its pictures fade out; spheres in flight fizzle */
    function interrupt(a) { const ab = a.rz; if (!ab || !ab.act) return; const A = ab.act;
      if (A.kind === 'fang' && (A.sL > 0.05 || A.sR > 0.05)) FX.push({ kind: 'fade', a, t: 0, life: 0.3, sL: A.sL, sR: A.sR, aL: { x: ab.aL.x, y: ab.aL.y }, aR: { x: ab.aR.x, y: ab.aR.y } });
      if (A.kind === 'cata') for (const p of A.pairs) if (p.st === 1 || p.st === 2) { steamAt(p.lx != null ? p.lx : a.x, p.ly != null ? p.ly : a.y, 1.2, 1.2, 2); p.st = 3; }
      ab.act = null; ab.gap = 0.2; }

    /* Twin Fang Protocol: the wind-up, then each sweep: the two aims cross the target from opposite sides (an X), meeting on it mid-sweep */
    function fangGeo(a, A, i, u) {
      const ab = a.rz, C = CFG.fang, hp = heads(a), k = A.k, dirS = i % 2 ? -1 : 1, e = sstep(0, 1, u);
      const tg = A.m && !A.m.dead ? A.m : null; if (tg) { A.cx = lerp(A.cx, tg.x, 0.08); A.cy = lerp(A.cy, tg.y, 0.08); }
      const mx = (hp.L.wx + hp.R.wx) / 2, my = (hp.L.wy + hp.R.wy) / 2; let fx = A.cx - mx, fy = A.cy - my; const fl = Math.hypot(fx, fy) || 1; fx /= fl; fy /= fl;
      const sg = ((hp.L.wx - mx) * -fy + (hp.L.wy - my) * fx) >= 0 ? -1 : 1, px = -fy * sg, py = fx * sg, half = C.half[k - 1];   // (+p: away from Lux's side, so the streams start crossed)
      if (A.gL && A.gR) {   // Dissonance: each head sweeps its own group
        const s = (1 - 2 * e) * dirS; ab.aL.x = A.gL.x + px * half * s; ab.aL.y = A.gL.y + py * half * s * 0.8; ab.aR.x = A.gR.x - px * half * s; ab.aR.y = A.gR.y - py * half * s * 0.8;
      } else {             // Concord: the aims cross the target from opposite sides and meet on it at mid-sweep
        const s = (1 - 2 * e) * dirS, dep = (u - 0.5) * 0.9; ab.aL.x = A.cx + px * half * s + fx * dep; ab.aL.y = A.cy + py * half * s * 0.8 + fy * dep; ab.aR.x = A.cx - px * half * s + fx * dep; ab.aR.y = A.cy - py * half * s * 0.8 + fy * dep; }
      // (clamped to the reach of the breath)
      for (const [P, q] of [[hp.L, ab.aL], [hp.R, ab.aR]]) { const dx = q.x - P.wx, dy = q.y - P.wy, d = Math.hypot(dx, dy); if (d > C.reach) { q.x = P.wx + dx / d * C.reach; q.y = P.wy + dy / d * C.reach; } }
      return hp;
    }
    function fangStep(a, A, t0, t, dt, cross) {
      const ab = a.rz, C = CFG.fang, k = A.k, sw = A.sw || C.sweep, P = pw(a);
      // which sweep, how far through it
      let i = -1, u = 0; for (let j = 0; j < A.n; j++) { const s0 = C.wind + j * (sw + C.gap); if (t >= s0 && t < s0 + sw) { i = j; u = (t - s0) / sw; } }
      const lastEnd = C.wind + A.n * sw + (A.n - 1) * C.gap, blT = lastEnd + 0.45;
      if (t < C.wind) { fangGeo(a, A, 0, 0); A.sL = A.sR = 0; }
      else if (i >= 0) { const hp = fangGeo(a, A, i, u); const on = sstep(0, 0.08, u) * (1 - sstep(0.94, 1, u)); A.sL = on; A.sR = on; A.i = i; A.u = u;
        if (cross(C.wind + i * (sw + C.gap) + 0.02)) { ab.recL = 1; ab.recR = 1; X.shake(3, 0.15); sfx('whoosh'); }
        // the damage ticks along the visible streams
        A.tk -= dt; if (A.tk <= 0 && on > 0.3) { A.tk += C.tick; streamHits(a, hp.L, ab.aL, P * C.dmgF, 'F'); streamHits(a, hp.R, ab.aR, P * C.dmgI, 'I'); }
        // where the streams cross: steam and instability; in Concord they meet on the target mid-sweep: the Thermal Shock explosion
        A.cross = segX(hp.L.wx, hp.L.wy, ab.aL.x, ab.aL.y, hp.R.wx, hp.R.wy, ab.aR.x, ab.aR.y);
        if (A.cross) { A.xT -= dt; if (A.xT <= 0) { A.xT = 0.12; steamAt(A.cross.x, A.cross.y, 0.9, 1.0, 1); } }
        const mid = C.wind + i * (sw + C.gap) + sw * 0.5;
        if (cross(mid) && (!A.gL || (buffOn(a) && kOf(a) >= 3))) convergence(a, A.gL ? (ab.aL.x + ab.aR.x) / 2 : A.cx, A.gL ? (ab.aL.y + ab.aR.y) / 2 : A.cy, P * C.cross * (buffOn(a) && kOf(a) >= 3 ? 1 + CFG.circuit.conv : 1), C.crossR, false); }
      else { A.sL = A.sR = 0; A.cross = null; }
      // level 7: the concentrated convergence blast: both heads on the target, the streams narrowed and white-hot, then the blast
      if (A.blast && t >= lastEnd && t < blT + 0.2) { const hp = heads(a); ab.aL.x = ab.aR.x = A.cx; ab.aL.y = ab.aR.y = A.cy; A.sL = A.sR = bump(t, lastEnd, lastEnd + 0.1, blT - 0.05, blT + 0.05) * 1.25; A.conv = true;
        A.tk -= dt; if (A.tk <= 0 && A.sL > 0.3) { A.tk += C.tick; streamHits(a, hp.L, ab.aL, P * C.dmgF * 0.6, 'F'); streamHits(a, hp.R, ab.aR, P * C.dmgI * 0.6, 'I'); } }
      if (A.blast && cross(blT)) { convergence(a, A.cx, A.cy, P * C.blast, C.blastR, true); ab.recL = ab.recR = 1; A.conv = false; }
    }
    /* the blows along one stream: monsters within its widening width, between the mouth's floor point and the aim */
    function streamHits(a, P0, q, d, el) {
      const C = CFG.fang, dx = q.x - P0.wx, dy = q.y - P0.wy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L; let n = 0;
      for (const m of H.living()) { const rx = m.x - P0.wx, ry = m.y - P0.wy, al = rx * ux + ry * uy; if (al < -0.3 || al > L + 0.6 + m.r) continue; const s = cl(al / L), w = lerp(C.w0, C.w1, s), of = Math.abs(-rx * uy + ry * ux);
        if (of > w + m.r) continue; n++; if (el === 'F') fireHit(a, m, d, { tick: true }); else iceHit(a, m, d, { tick: true }); }
      if (!gpu() && Math.random() < 0.6) X.part({ kind: 'beamfx', x: P0.wx, y: P0.wy, a: Math.atan2(dy, dx), r: L, life: 0.14, max: 0.14, color: el === 'F' ? '#FF8A3A' : '#9FE4FF', vx: 0, vy: 0, w: el === 'F' ? 1.1 : 0.8 });
      return n;
    }
    /* two segments' crossing (world), or null */
    function segX(ax, ay, bx, by, cx, cy, dx, dy) { const r1x = bx - ax, r1y = by - ay, r2x = dx - cx, r2y = dy - cy, den = r1x * r2y - r1y * r2x; if (Math.abs(den) < 1e-6) return null;
      const s = ((cx - ax) * r2y - (cy - ay) * r2x) / den, u = ((cx - ax) * r1y - (cy - ay) * r1x) / den; if (s < 0.05 || s > 1 || u < 0.05 || u > 1) return null; return { x: ax + r1x * s, y: ay + r1y * s }; }
    /* fire meeting ice on a point: a Thermal Shock explosion (half Fire, half Ice: the pairing is then made on everything it reaches) */
    function convergence(a, x, y, d, R, big) {
      for (const m of H.living()) { const dd = Math.hypot(m.x - x, m.y - y); if (dd > R + m.r) continue; dualHit(a, m, d * (dd < R * 0.4 ? 1.15 : 1), { big: true, kb: big ? 4 : 2, noCrit: !big }); }
      shockFx(x, y, R * 0.75, big); if (big) { X.flash(0.18, '#F4FBFF'); g.hitStop = Math.max(g.hitStop || 0, 0.06); }
    }

    /* Mirror Divide: the cast (heads rise, crowns part), then the two domains laid; they live on their own as Raziel moves on */
    function divideStep(a, A, t, cross) {
      const C = CFG.divide, k = A.k, ab = a.rz;
      if (cross(0.15)) { FX.push({ kind: 'crownFx', a, t: 0, life: C.cast }); }
      if (cross(C.cast - 0.1)) { A.laid = true; const foes = H.near(a.x, a.y, 11), G2 = groups(foes, 2.8), R = C.R[k - 1];
        let fx, fy, ix, iy; const c = G2[0] || { x: a.x + Math.cos(ab.face) * 3.5, y: a.y + Math.sin(ab.face) * 2.5 };
        if (ab.mode === 'dissonance' && G2.length > 1 && Math.hypot(G2[0].x - G2[1].x, G2[0].y - G2[1].y) > R) { fx = G2[0].x; fy = G2[0].y; ix = G2[1].x; iy = G2[1].y; }
        else { const f = ab.face, px = Math.sin(f), py = -Math.cos(f); fx = c.x + px * R * 0.72; fy = c.y + py * R * 0.6; ix = c.x - px * R * 0.72; iy = c.y - py * R * 0.6; }
        const p1 = X.walkPoint(fx, fy, { r: 0.5, mv: 0, x: c.x, y: c.y }), p2 = X.walkPoint(ix, iy, { r: 0.5, mv: 0, x: c.x, y: c.y });
        const life = C.dur[k - 1], col = k >= 3 || (buffOn(a) && kOf(a) >= 3), seed = rnd() * 40;
        const F = { kind: 'domF', a, x: p1.x, y: p1.y, R, t: 0, life, k, tk: 0.2, ek: C.erupt * 0.5, seed, col, frz: null, pulse: 0 }, I = { kind: 'domI', a, x: p2.x, y: p2.y, R, t: 0, life, k, tk: 0.45, ek: C.erupt, seed: seed + 7, col, frz: new Map(), pulse: 0 };
        F.o = I; I.o = F; FX.push(F, I); X.shake(6, 0.25); sfx('crash'); X.text((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 1.6, 'MIRROR DIVIDE', '#F4E6D6', 13, { crit: true, life: 1.0 });
        if (!gpu()) { X.ring(p1.x, p1.y, 0.3, R, 0.5, '#FF7A2E', 0.2); X.ring(p2.x, p2.y, 0.3, R, 0.5, '#7FD8FF', 0.2); } }
    }
    /* a domain's life: growing, drifting toward its twin, its ticks (Burning / Chill, a short Freeze for one held in the frost), eruptions
       from level 4, steam on the shared edge, the level 7 collapse into one detonation */
    function domainStep(f, dt) {
      const C = CFG.divide, a = f.a, o = f.o, live = a && S.list.includes(a); if (!a) return;
      const coll = f.col ? sstep(f.life - 0.9, f.life - 0.25, f.t) : 0;
      if (o) { const mx = (f.x + o.x) / 2, my = (f.y + o.y) / 2, dx = o.x - f.x, dy = o.y - f.y, d = Math.hypot(dx, dy) || 1;
        if (coll > 0) { f.x = lerp(f.x, mx, Math.min(1, dt * 6 * coll)); f.y = lerp(f.y, my, Math.min(1, dt * 6 * coll)); }
        else if (d > f.R * 0.9) { const v = C.drift * dt; f.x += dx / d * v; f.y += dy / d * v; } }
      f.rad = f.R * sstep(0, 0.5, f.t) * (1 - 0.7 * coll); f.pulse = Math.max(0, f.pulse - dt * 2);
      if (f.t > f.life - 0.3 || !live) return;
      const P = H.P(a) * selfK(a), fire = f.kind === 'domF'; f.tk -= dt; f.ek -= dt; const tick = f.tk <= 0; if (tick) f.tk += C.tick;
      for (const m of H.living()) { const d = Math.hypot(m.x - f.x, m.y - f.y); if (d > f.rad + m.r) { if (!fire && f.frz) f.frz.delete(m); continue; }
        if (!fire) { const h = (f.frz.get(m) || 0) + dt; f.frz.set(m, h); if (f.k >= 2 && h >= C.hold && h - dt < C.hold) iceHit(a, m, P * C.dmgI, { tick: true, freeze: C.freeze }); }
        if (tick) { if (fire) fireHit(a, m, P * C.dmgF, { tick: true }); else iceHit(a, m, P * C.dmgI, { tick: true }); } }
      // eruptions (level 4 and up): a pillar of flame in the fire, a formation of ice rising in the frost
      if (f.k >= 2 && f.ek <= 0 && f.rad > 0.5 && coll < 0.2) { f.ek += C.erupt; f.rn = ((f.rn || (f.seed * 7919 | 0) + 1) * 16807) % 2147483647; const r1 = f.rn / 2147483647, r2 = ((f.rn * 48271) % 2147483647) / 2147483647, an = r1 * TAU, rr = f.rad * Math.sqrt(r2) * 0.8,   /* (its own sequence: the same eruptions at any frame rate) */ x = f.x + Math.cos(an) * rr, y = f.y + Math.sin(an) * rr * 0.8;
        FX.push({ kind: fire ? 'pillar' : 'spire', x, y, t: 0, life: fire ? 1.1 : 1.6, seed: Math.random() * 40, s: 0.55 + Math.random() * 0.25 }); f.pulse = 1;
        for (const m of H.living()) if (Math.hypot(m.x - x, m.y - y) < C.eruptR + m.r) { if (fire) fireHit(a, m, P * C.eruptDmg, {}); else iceHit(a, m, P * C.eruptDmg, {}); }
        if (!gpu()) { if (fire) X.boom(x, y, 0.9, '#FF6A1E', '#FFE08A', { n: 8, shake: 0, smoke: 2 }); else X.sparks(x, y, '#CFEFFF', 10, 4); } }
      // the shared edge boils
      if (fire && o && Math.random() < dt * 5 * LQ()) { const dx = o.x - f.x, dy = o.y - f.y, d = Math.hypot(dx, dy) || 1; if (d < f.rad + (o.rad || 0)) { const t1 = cl((f.rad - (d - (o.rad || 0))) / 2 / Math.max(0.1, f.rad)), cx = f.x + dx / d * (f.rad - (f.rad + (o.rad || 0) - d) / 2), cy = f.y + dy / d * (f.rad - (f.rad + (o.rad || 0) - d) / 2), sp = (Math.random() - 0.5) * 2 * Math.min(f.rad, o.rad || 0) * 0.8;
        steamAt(cx - dy / d * sp, cy + dx / d * sp * 0.8, 0.8 + t1, 1.3, 1); } }
      // level 7: the collapse detonation, once (the fire domain fires it for both)
      if (fire && f.col && !f.boom && f.t >= f.life - 0.35 && o) { f.boom = true; const x = (f.x + o.x) / 2, y = (f.y + o.y) / 2; convergence(a, x, y, P * C.collapse, C.collapseR, true); X.flash(0.22, '#FFF6EA'); X.shake(14, 0.45); X.light(x, y, 6, 0.6); }
    }

    /* Revelation Circuit: the reactor transforms (the pose), the bridge forms, the buff starts (refreshed, never stacked) */
    function circuitStep(a, A, t, cross) {
      const C = CFG.circuit, ab = a.rz, k = A.k;
      if (cross(0.35)) FX.push({ kind: 'bridge', a, t: 0, life: C.cast - 0.35 + 0.4 });
      if (cross(C.on)) { A.on = true; const was = buffOn(a); ab.buffT = Math.max(ab.buffT || 0, g.t + C.dur[k - 1]); ab.buffK = k; ab.buffN = (ab.buffN || 0) + 1; setMode(a, 'concord'); ab.modeT = ab.clock;
        for (const m of H.living()) if (Math.hypot(m.x - a.x, m.y - a.y) < C.pulseR + m.r) dualHit(a, m, H.P(a) * C.pulse, { noShock: true });
        FX.push({ kind: 'pulse', a, x: a.x, y: a.y, t: 0, life: 0.8, seed: Math.random() * 40 }); steamAt(a.x, a.y, 1.4, 1.4, 3);
        X.text(a.x, a.y - sizeT(a) - 0.6, was ? 'CIRCUIT RENEWED' : 'REVELATION CIRCUIT', '#FFF1DA', 13, { crit: true, life: 1.1 }); X.flash(0.12, '#FFF6EA'); sfx('sparkle'); X.light(a.x, a.y, 5, 0.6);
        if (!gpu()) { X.ring(a.x, a.y, 0.3, C.pulseR, 0.4, '#FFB070', 0.15); X.ring(a.x, a.y, 0.3, C.pulseR * 1.1, 0.45, '#9FE4FF', 0.15); } }
    }

    /* Binary Cataclysm: a sun and an ice planet formed at the mouths, launched on spiralling curves that meet on the target */
    function spherePos(a, p, side, u, out) {
      const A = a.rz.act, sL = side === 'L' ? 1 : -1, x0 = p.x0[side === 'L' ? 0 : 1], y0 = p.y0[side === 'L' ? 0 : 1], z0 = p.z0, e = sstep(0, 1, u) * 0.85 + u * 0.15;
      const tx = A.cx, ty = A.cy, dx = tx - x0, dy = ty - y0, L = Math.hypot(dx, dy) || 1, px = -dy / L, py = dx / L, th = u * TAU * 1.15 + (sL > 0 ? 0 : Math.PI), amp = 1.5 * Math.sin(Math.PI * u) * (1 - 0.2 * u);
      out.x = x0 + dx * e + px * Math.cos(th) * amp; out.y = y0 + dy * e + py * Math.cos(th) * amp * 0.8; out.z = lerp(z0, 0.6, e) + 2.2 * Math.sin(Math.PI * u) + Math.sin(th) * amp * 0.6; return out;
    }
    function cataStep(a, A, t, dt) {
      const C = CFG.cata, ab = a.rz, hp = heads(a), Tz = T(), P = pw(a);
      const tg = A.m && !A.m.dead ? A.m : null; if (tg) { A.cx = lerp(A.cx, tg.x, 0.05); A.cy = lerp(A.cy, tg.y, 0.05); }
      ab.aL.x = ab.aR.x = A.cx; ab.aL.y = ab.aR.y = A.cy;
      for (const p of A.pairs) {
        if (p.st === 0 && t >= p.form0) { p.st = 1; sfx('hum'); }
        if (p.st === 1) { p.g = sstep(p.form0, p.launch, t); p.lx = (hp.L.wx + hp.R.wx) / 2; p.ly = (hp.L.wy + hp.R.wy) / 2;
          if (t >= p.launch) { p.st = 2; p.x0 = [hp.L.wx, hp.R.wx]; p.y0 = [hp.L.wy, hp.R.wy]; p.z0 = Math.max(0.5, (sy(a.y) - hp.L.y) / Tz); p.u = 0; ab.recL = ab.recR = 0.8; sfx('whoosh'); X.shake(4, 0.2); } }
        if (p.st === 2) { p.u = Math.min(1, (t - p.launch) / C.fly); const qL = p.qL || (p.qL = {}), qR = p.qR || (p.qR = {}); spherePos(a, p, 'L', p.u, qL); spherePos(a, p, 'R', p.u, qR); p.lx = (qL.x + qR.x) / 2; p.ly = (qL.y + qR.y) / 2;
          p.hist.push(qL.x, qL.y, qL.z, qR.x, qR.y, qR.z); if (p.hist.length > 6 * 14) p.hist.splice(0, 6);
          if (p.u >= 1) { p.st = 3; const big = p.last, R = big ? C.finR : C.R[A.k - 1], d = P * (big ? C.fin : C.dmg) * (buffOn(a) && kOf(a) >= 3 ? 1 + 0.3 * CFG.circuit.conv : 1);
            for (const m of H.living()) { const dd = Math.hypot(m.x - A.cx, m.y - A.cy); if (dd > R + m.r) continue; dualHit(a, m, d * (dd < C.core ? C.coreK : 1) * (1 - 0.25 * cl(dd / R)), { big: true, kb: big ? 6 : 4 }); }
            FX.push({ kind: 'cboom', x: A.cx, y: A.cy, R, t: 0, life: big ? 1.6 : 1.15, seed: Math.random() * 40, big });
            shockFx(A.cx, A.cy, R * 0.7, true); steamAt(A.cx, A.cy, R * 0.8, 2.0, big ? 5 : 3); X.flash(big ? 0.4 : 0.22, '#FFF8EE'); X.shake(big ? 22 : 13, big ? 0.7 : 0.4); X.light(A.cx, A.cy, big ? 9 : 6, 0.8); g.hitStop = Math.max(g.hitStop || 0, big ? 0.09 : 0.06);
            if (big) { sfx('crash'); X.after(0.12, () => sfx('fanfare')); X.text(A.cx, A.cy - 2.2, 'BINARY CATACLYSM', '#FFF1DA', 15, { crit: true, life: 1.2 }); }
            if (!gpu()) { X.boom(A.cx, A.cy, R, '#FF7A2E', '#FFFFFF', { n: 30, shake: 0, smoke: 6 }); X.ring(A.cx, A.cy, 0.3, R * 1.2, 0.5, '#9FE4FF', 0.25); } } }
      }
    }

    /* ---- the pose every frame (the model springs it): the power's, the entrance, the last seconds' rising instability ---- */
    function poseOf(a, dt) {
      const ab = stOf(a), Sx = a.rzS, A = ab.act, inU = ulOn(), Tz = T();
      Sx.t = a.at || 0; Sx.x = a.x; Sx.y = a.y; Sx.lowFx = lowFx(); Sx.evo = a.st === 'awaken' || a.rzUlt ? 7 : EVO[kOf(a)];
      if (!inU && ab.faceT != null) { const rate = CFG.walk.turn * dt, dd = angD(ab.faceT, ab.face); ab.face += Math.max(-rate, Math.min(rate, dd * (1 - Math.exp(-10 * dt)))); }   // (v465 RZ-A: an exponential turn, the same at any frame rate)
      if (!inU) Sx.face = ab.face; const v = Math.hypot(ab.vx, ab.vy); ab.walk += ((inU || ab.alt > 0.12 ? 0 : Math.min(1, v / (CFG.move.walk * 1.6))) - ab.walk) * (1 - Math.exp(-5 * dt)); Sx.walk = ab.walk;   // (v465 RZ-A: the gait follows its real ground speed, in a power's move too)
      if (inU) return;   // (the ultimate owns the rest)
      ab.recL = Math.max(0, ab.recL - dt * 2.5); ab.recR = Math.max(0, ab.recR - dt * 2.5);
      // rest
      let jawL = 0, jawR = 0, chL = 0, chR = 0, cDet = 0, cAl = ab.mode === 'concord' ? 0.35 : 0, csL = 1, csR = 1, crL = 1, crR = 1, crA = ab.mode === 'concord' ? 0.6 : 0, crE = 0, wing = 0.4, beat = 0, fly = 0, raise = 0, meet = 0, roar = 0, guardP = 0, bank = 0, aimL = null, aimR = null;
      if (ab.mode === 'dissonance') { csL = 1.35; csR = 0.7; crL = 1.4; crR = 0.75; }
      if (buffOn(a)) { cDet = 0.25; cAl = 0.7; crA = 1; csL = csR = 1.6; wing = 0.55; }
      if (A && A.go && !A.went) { if (A.cx != null) { ab.aL.x = ab.aR.x = A.cx; ab.aL.y = ab.aR.y = A.cy; aimL = ab.aL; aimR = ab.aR; } chL = chR = 0.25 * cl((A.gt || 0) / 0.8); crL = crR = 1.6; }   // (v465 RZ-A: on its way to the spot, eyes on the quarry)
      else if (!A || A.kind === 'soar') { lookFree(a); if (ab.lkL && !ab.lkL.dead) { ab.aL.x = ab.lkL.x; ab.aL.y = ab.lkL.y; aimL = ab.aL; } if (ab.lkR && !ab.lkR.dead) { ab.aR.x = ab.lkR.x; ab.aR.y = ab.lkR.y; aimR = ab.aR; } }
      else if (A.kind === 'fang' && A.air) { const S2 = CFG.strafe, lastEnd = A.n * S2.pass + (A.n - 1) * S2.turn; aimL = ab.aL; aimR = ab.aR; chL = chR = 0.7 * (1 - sstep(lastEnd + 0.6, A.end, A.t)); jawL = Math.max(0.2, A.sL); jawR = Math.max(0.2, A.sR); crL = crR = 2.5; meet = A.conv ? 0.5 : 0; }   // (v465 RZ-A: the strafing pass)
      else if (A.kind === 'fang') { const C = CFG.fang, w = sstep(0, C.wind, A.t), lastEnd = C.wind + A.n * (A.sw || C.sweep) + (A.n - 1) * C.gap, out = 1 - sstep(lastEnd + (A.blast ? 0.6 : 0), A.end, A.t);
        aimL = ab.aL; aimR = ab.aR; chL = w * out * (A.sL > 0.1 ? 0.75 : 1); chR = chL; jawL = Math.max(0.15 * w, A.sL) * out; jawR = Math.max(0.15 * w, A.sR) * out; crL = crR = 1 + 2.5 * w * out; wing = 0.45 + 0.25 * w * out; guardP = 0; meet = A.conv ? 0.5 : 0; }
      else if (A.kind === 'divide') { const C = CFG.divide, up = sstep(0, 0.45, A.t) * (1 - sstep(C.cast, C.cast + C.rec, A.t)); raise = up; crE = 0.25 * up; crL = 1 + 2.2 * up; crR = 1 + 2.2 * up; crA = 0; wing = 0.4 + 0.45 * up; jawL = jawR = 0.35 * up; roar = 0.3 * bump(A.t, C.cast - 0.3, C.cast - 0.1, C.cast + 0.05, C.cast + 0.35); }
      else if (A.kind === 'circuit') { const C = CFG.circuit, up = sstep(0, 0.5, A.t), al = sstep(0.3, 0.95, A.t), on = A.on ? 1 : 0; raise = up * (1 - 0.3 * on); cDet = 0.7 * up; cAl = Math.max(cAl, al); csL = csR = 1 + 2 * al; crA = al; crL = crR = 1 + 1.5 * al; wing = 0.4 + 0.6 * sstep(0.6, 1.1, A.t); beat = 0.3 * bump(A.t, 0.9, 1.1, 1.3, 1.5); roar = 0.6 * bump(A.t, 0.95, 1.05, 1.25, 1.5); meet = 0.4 * bump(A.t, 0.3, 0.6, 0.9, 1.2); }
      else if (A.kind === 'cata') { const C = CFG.cata, lastImp = A.pairs.length ? A.pairs[A.pairs.length - 1].launch + C.fly : 0, up = sstep(0, C.rise, A.t) * (1 - sstep(lastImp, lastImp + C.rec, A.t));
        wing = 0.45 + 0.55 * up; aimL = ab.aL; aimR = ab.aR; let fm = 0; for (const p of A.pairs) if (p.st === 1) fm = Math.max(fm, p.g || 0); chL = chR = fm; jawL = jawR = 0.4 * up + 0.5 * fm; crL = crR = 1 + 2 * up; }
      // the awakening (the 30 s are up, the banner): the heads rise and the reactors gather
      if (a.st === 'awaken') { const u = sstep(0, 0.7, a.aw || 0); raise = Math.max(raise, 0.7 * u); chL = Math.max(chL, 0.6 * u); chR = Math.max(chR, 0.6 * u); crL = crR = 1 + 2 * u; wing = Math.max(wing, 0.7 * u); aimL = aimR = null; }
      // the entrance (the model assembles itself on S.enter)
      let enter = 1; if (ab.en >= 0 && !ab.ready) { const e = ab.en; enter = sstep(1.2, 3.4, e); wing = lerp(0.1, 1.0, sstep(3.0, 3.4, e)) * (1 - 0.6 * sstep(3.9, CFG.enter, e)) + 0.4 * sstep(3.9, CFG.enter, e); roar = bump(e, 3.6, 3.75, 4.0, 4.3); raise = Math.max(raise, 0.4 * bump(e, 2.3, 2.6, 3.8, 4.3)); crL = crR = 1 + 3 * bump(e, 2.8, 3.0, 3.3, 3.8); aimL = aimR = null; }
      // the last 5 s: the reactors flare, the crowns race, Lux unstable, frost creeping over Umbra
      const fin = a.st === 'fight' && ab.ready && a.life < 5 ? 1 - Math.max(0, a.life) / 5 : 0;
      if (fin > 0) { const fl = 0.5 + 0.5 * Math.sin((a.at || 0) * (9 + 14 * fin)); chL = Math.max(chL, fin * (0.3 + 0.35 * fl)); chR = Math.max(chR, fin * 0.45); crL *= 1 + 1.5 * fin; crR *= 1 + 1.5 * fin; csL *= 1 + fin; csR *= 1 + fin; }
      // (v465 RZ-A) the flight: its height, the bank into turns, the wingbeats, the wings spread wide in the air; glide and dive as hints for the model
      { const airK = cl(ab.alt / 0.4), sp = Math.hypot(ab.vx, ab.vy); fly = Math.max(fly, ab.alt); bank = 0;   // (the model banks on its own with the turn of `face`, and reads take-off / landing from how `fly` changes)
        beat = Math.max(beat, airK * cl(ab.altV * 1.4)); wing = lerp(wing, 1.0, airK); Sx.speed = airK * cl(sp / CFG.move.fly); Sx.glide = airK * cl((sp - 3) / 3) * (1 - cl(ab.altV * 2)); Sx.dive = airK * Math.max(-1, Math.min(1, -ab.altV * 0.9)); }
      Object.assign(Sx, { mode: ab.mode, aimL, aimR, jawL, jawR, chargeL: chL, chargeR: chR, recoilL: ab.recL, recoilR: ab.recR, coreDetach: cDet, coreAlign: cAl, coreSpinL: csL, coreSpinR: csR, coreUp: 0,
        crownSpeedL: crL, crownSpeedR: crR, crownAlign: crA, crownExpand: crE, wing, beat, guard: guardP, fly, bank, raise, meet, roar, stagger: 0, final: fin, enter, dissolve: FIN ? sstep(CFG.fin.len - 1.0, CFG.fin.len, FIN.t) : 0 });
      void Tz;
    }

    /* ---- the fighter's loop (20g's tick, in its 'fight'). Its time counts only once it is combat-ready (the entrance done) ---- */
    function tick(a, dt) {
      const ab = stOf(a); a.feet = true; ab.clock += dt;
      if (!ab.ready) { a.life += dt; if (ab.en >= 0 && ab.en < CFG.enter) return; ab.ready = true; a.life = CFG.life - 1e-6; ab.fightT = 0; ab.modeT = ab.clock - CFG.align.hold; }   // (combat-ready: 30 s from the next frame on)
      else ab.fightT = (ab.fightT || 0) + dt;   // (its active time on the game's own clock, as a.life counts it down)
      if (me.dead) { interrupt(a); return; }
      ab.evalT -= dt; if (ab.evalT <= 0 && !ab.act) { ab.evalT = CFG.align.every; evalMode(a, H.near(a.x, a.y, 11)); }
      if (ab.act) { act(a, dt); return; }
      ab.gap -= dt;
      const ch = ab.gap <= 0 && a.life > 0.6 ? choose(a) : null;
      if (ch) { start(a, ch.kind, ch.o); act(a, dt); return; }   // (v465 RZ-A: it keeps moving on the frame a power starts)
      guard(a, dt);
    }
    /* ---- the end of its time: its current power left cleanly, then The Book of Two Heavens (RZ-U), once ---- */
    function fin(a) {
      const ab = stOf(a); if (a.rzUlt) return; a.rzUlt = true; interrupt(a); a.dropZ = 0; ab.vx = ab.vy = 0;
      let ok = false; if (UL) { try { UL.start(a); ok = ulOn(); } catch (e) { ok = false; } }
      if (!ok) { FIN = { a, t: 0, done: false, x: a.x, y: a.y }; a.judg = true; a.jA = 1; a.hold = true; const c = crowd(a.x, a.y, 11, 3); if (c) { FIN.x = c.x; FIN.y = c.y; } g.cineT = Math.max(g.cineT || 0, CFG.fin.hit + 0.4); me.inv = Math.max(me.inv, CFG.fin.len); sfx('hum'); }
    }
    function stepFin(dt) {
      const J = FIN, a = J.a, t0 = J.t; J.t += dt; const cross = x => t0 < x && J.t >= x, C = CFG.fin;
      const S2 = a.rzS; if (S2) { S2.raise = J.t < C.hit ? 1 : 0.3; S2.chargeL = S2.chargeR = sstep(0, C.hit, J.t); S2.jawL = S2.jawR = bump(J.t, C.hit - 0.4, C.hit - 0.2, C.hit + 0.3, C.hit + 0.6); S2.aimL = S2.aimR = { x: J.x, y: J.y }; S2.dissolve = sstep(C.len - 1.0, C.len, J.t); }
      if (cross(C.hit)) { for (const m of H.living()) { const d = Math.hypot(m.x - J.x, m.y - J.y); if (d < C.R + m.r) dualHit(a, m, H.P(a) * C.k * (1 - 0.4 * cl(d / C.R)), { big: true, kb: 5, noCrit: true }); }
        FX.push({ kind: 'cboom', x: J.x, y: J.y, R: C.R * 0.6, t: 0, life: 1.6, seed: 3, big: true }); shockFx(J.x, J.y, 3, true); X.flash(0.6, '#FFFFFF'); X.shake(24, 0.8); sfx('crash'); X.after(0.15, () => sfx('fanfare')); }
      if (J.t >= C.len) { a.judg = false; a.hold = false; a.st = 'leave'; a.lv = 0.8; a.alpha = 0; a.waved = true; FIN = null; if (g.cineT > 0) g.cineT = 0; }
      else if (J.t < C.hit + 0.4) { g.cineT = Math.max(0.02, C.hit + 0.4 - J.t); me.inv = Math.max(me.inv, 0.4); }
    }
    /* ---- the loop (every frame, from 20g's update) ---- */
    function update(dt, dtReal) {
      BURST = ulOn() ? 16 : 4; while (PEND.length && BURST > 0) { const q = PEND.shift(); if (g.t - q.t > 0.35) continue; BURST--; shockFx0(q.x, q.y, Math.min(q.R * (1 + 0.15 * (q.n - 1)), q.R * 1.6), q.big); }
      const L = list();
      for (const a of L) { const ab = stOf(a); a.feet = true;
        if (a.st === 'enter' && a.en >= 0) { if (ab.en < 0) ab.en = 0; ab.en += dtReal; a.dropZ = 0; a.scale = 1; a.alpha = 1; entranceBeats(a); }
        else if (ab.en >= 0 && !ab.ready) { ab.en += dtReal; entranceBeats(a); }
        if (a.st === 'awaken' || a.rzUlt) a.hold = true;
        if (a.st !== 'fight' && ab.act) interrupt(a);
        if (a.st !== 'enter' && (a.st !== 'fight' || me.dead) && !ulOn() && !FIN && ab.alt > 0) moveTo(a, dtReal, a.x, a.y, CFG.move.run, 0, null);   // (v465 RZ-A: its time up, or the pet down: it lands)
        poseOf(a, dtReal);
        // the anchors: the model's own when it draws; without the GPU the same springs solved here
        const G = GLR(); if (G && G.solve && !glOn()) { const r = G.solve(sx(a.x), sy(a.y), T() * sizeT(a), a.rzS, { tile: T() }); if (r) a.rzOut = r; }
        footfalls(a);
        released = false; }
      if (UL) { try { UL.update(dt, dtReal); } catch (e) { try { console.warn('Raziel ult: ' + (e && e.message)); } catch (e2) {} UL = null; } }
      if (FIN) { if (!L.includes(FIN.a)) FIN = null; else stepFin(dtReal); }
      for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.t += f.cine ? dtReal : dt;
        if (f.kind === 'frag' || f.kind === 'ember') { const tt = Math.max(0, dt); f.x += f.vx * tt; f.y += f.vy * tt; f.vz -= 12 * tt; f.z += f.vz * tt; if (f.z < 0) { f.z = 0; f.vz *= -0.3; f.vx *= 0.5; f.vy *= 0.5; } }
        else if (f.kind === 'steam') { f.z += f.vz * dt; f.vz *= 1 - Math.min(1, dt * 0.8); }
        else if (f.kind === 'domF' || f.kind === 'domI') domainStep(f, dt);
        if (f.t >= f.life) FX.splice(i, 1); }
      // marks: dropped with the monster, and once nothing of Raziel's is left
      for (const m of MARK) if (m.dead || (!(m.rzDefT > g.t) && !(m.rzF > g.t - CFG.shock.win) && !(m.rzI > g.t - CFG.shock.win) && !(m.rzTS > g.t))) MARK.delete(m);
      if (!L.length && !ulOn() && !FIN) { if (!released && !FX.length) { released = true; clearMarks(); const G = GLR(); if (G) try { G.free(); } catch (e) {} } }
      if (me.dead) for (const a of L) interrupt(a);
    }
    function clearMarks() { for (const m of MARK) { m.rzF = 0; m.rzI = 0; m.rzTS = 0; m.rzDefT = 0; } MARK.clear(); }
    /* the footfalls the model reports: molten fractures and embers on Lux's side, frost patterns on Umbra's (passing, never the floor's own) */
    function footfalls(a) { const o = a.rzOut, ab = a.rz; if (!o || !o.feet || !o.steps || !o.steps.length || o === ab.stepsOf) return; ab.stepsOf = o; const Tz = T();
      for (const i of o.steps) { const f = o.feet[i]; if (!f) continue; const wx = a.x + (f.x - sx(a.x)) / Tz, wy = a.y + (f.y - sy(a.y)) / Tz; FX.push({ kind: f.side === 'R' ? 'footI' : 'footF', x: wx, y: wy, t: 0, life: 1.1, seed: Math.random() * 40 }); } }
    function stop() { for (const a of S.list) if (a.id === 'gemini') { interrupt(a); a.hold = false; a.judg = false; a.jA = 1; a.dropZ = 0; }
      if (UL) try { UL.stop(); } catch (e) {} FIN = null; FX.length = 0; PEND.length = 0; clearMarks(); const G = GLR(); if (G) try { G.free(); } catch (e) {} released = true; }
    /* how Raziel tilts the fight (20g's outK, every allied blow): the Thermal Shock's defence break, the Revelation Circuit's allied offence */
    const outK = m => { let k = 1; if (m && m.rzDefT > g.t) k *= 1 + (m.boss ? CFG.shock.defBoss : CFG.shock.def); for (const a of S.list) if (a.id === 'gemini' && buffOn(a)) { k *= 1 + CFG.circuit.ally[a.rz.buffK - 1]; break; } return k; };

    /* ---- the entrance: two Gemini seals over the field, the cores descending and orbiting, the body assembling round them, Lux in an
       eruption of golden flame, Umbra in a blizzard, the crowns, the wings' two shockwaves meeting in steam, the roar; then combat-ready ---- */
    function descent(a) { const ab = stOf(a); ab.en = 0; ab.ready = false; ab.beats = {}; a.feet = true; a.dropZ = 0; a.scale = 1; a.life = CFG.life;
      FX.push({ kind: 'seals', a, x: a.x, y: a.y, t: 0, life: 3.4, cine: 1 }); FX.push({ kind: 'cores', a, x: a.x, y: a.y, t: 0, life: 1.6, cine: 1 });
      for (let i = 0; i < 4; i++) X.after(i * 0.3, () => X.shake(1.2 + i * 0.5, 0.15)); X.light(a.x, a.y, 4, 1); sfx('hum'); }
    function entranceBeats(a) { const ab = a.rz, e = ab.en, B = ab.beats || (ab.beats = {}), once = (n, at, f) => { if (!B[n] && e >= at) { B[n] = 1; f(); } };
      once('land', 1.5, () => { X.shake(6, 0.25); sfx('thud'); });
      once('lux', 2.3, () => { FX.push({ kind: 'burstF', a, t: 0, life: 1.1, cine: 1 }); sfx('whoosh'); });
      once('umbra', 2.55, () => { FX.push({ kind: 'burstI', a, t: 0, life: 1.2, cine: 1 }); sfx('sparkle'); });
      once('crowns', 2.9, () => sfx('chirp'));
      once('wings', 3.3, () => { const px = luxSide(a), py = 0, R = 4.5, r = a.rzOut, Tz = T(), tipX = (tip, s) => tip && isFinite(tip.x) ? a.x + (tip.x - sx(a.x)) / Tz * 0.6 : a.x + s * 1.2;   // (under each wing tip: the model's own anchors, so they follow its span)
        const fxL = tipX(r && r.wingTipL, px), fxR = tipX(r && r.wingTipR, -px); FX.push({ kind: 'ringF', x: fxL, y: a.y + py * 0.9, R, t: 0, life: 0.85, seed: 3, cine: 1 }); FX.push({ kind: 'ringI', x: fxR, y: a.y - py * 0.9, R, t: 0, life: 0.75, seed: 5, cine: 1 }); X.shake(8, 0.3); sfx('crash');
        if (!gpu()) { X.ring(fxL, a.y, 0.3, R, 0.5, '#FF7A2E', 0.25); X.ring(fxR, a.y, 0.3, R, 0.5, '#9FE4FF', 0.25); } });
      once('steam', 3.72, () => { const f = ab.face, r = a.rzOut, Tz = T(), x = r && r.body && isFinite(r.body.x) ? a.x + (r.body.x - sx(a.x)) / Tz + Math.cos(f) * 1.2 : a.x + Math.cos(f) * 1.5, y = a.y + Math.sin(f) * 1.2; FX.push({ kind: 'shock', x, y, R: 2.4, t: 0, life: 0.8, seed: 9, big: true, cine: 1 }); steamAt(x, y, 2.2, 1.8, 6); X.flash(0.15, '#F4FBFF'); X.light(x, y, 5, 0.5); });
      once('roar', 3.85, () => { X.shake(10, 0.45); sfx('crash'); g.zoomP = 0.96; g.zoomT = 0.8; }); }
    function entrance(a) { stOf(a); }   // (the landing the Anima cycle reports comes first: the beats are laid by update)

    /* ================= drawing ================= */
    const anc = a => a.rzOut || null;
    /* which side of the screen Lux is on (+1 right, -1 left): the model's own crowns, else its heading */
    const luxSide = a => { const r = a.rzOut; if (r && r.crownL && r.crownR && Math.abs(r.crownL.x - r.crownR.x) > 1) return r.crownL.x > r.crownR.x ? 1 : -1; return Math.sin(a.rz ? a.rz.face : Math.PI / 2) >= 0 ? 1 : -1; };
    function groundOne(Q, f, Tz, parts) {
      const X0 = f.x != null ? sx(f.x) : 0, Y0 = f.y != null ? sy(f.y) : 0, u = f.t / f.life;
      if (f.kind === 'domF' || f.kind === 'domI') { const R = (f.rad || 0.01) * Tz, fade = 1 - sstep(f.life - 0.45, f.life, f.t), grow = sstep(0, 0.6, f.t); if (R < 2) return;
        if (f.kind === 'domF') { FXP.fireField(Q, X0, Y0, R * 1.05, grow, fade, f.seed, FSY, f.pulse); Q.glow(X0, Y0, R * 1.2, '#FF5A1E', 0.16 * fade, FSY); if (!lowFx()) Q.shimmer(X0, Y0 - R * 0.25, R * 0.8, 0.2 * fade, 0.7, '#FFA640'); }
        else { FXP.iceField(Q, X0, Y0, R * 1.05, grow, fade, f.seed, FSY); Q.glow(X0, Y0, R * 1.15, '#3FA8FF', 0.13 * fade, FSY); } }
      else if (f.kind === 'ringF') FXP.fireRing(Q, X0, Y0, f.R * Tz, eout(u) * 0.92, 1.2 * (1 - u * 0.5), f.seed, FSY);
      else if (f.kind === 'ringI') FXP.frostRing(Q, X0, Y0, f.R * Tz, eout(cl(u * 1.15)) * 0.92, 1.2 * (1 - u * 0.5), f.seed, FSY);
      else if (f.kind === 'footF') { const k2 = 1 - u; FXP.fireField(Q, X0, Y0, Tz * 0.55, 1, 0.7 * k2, f.seed, FSY, 0.3 * k2); }
      else if (f.kind === 'footI') { const k2 = 1 - sstep(0.4, 1, u); FXP.iceField(Q, X0, Y0, Tz * 0.6, eout(u * 3), 0.75 * k2, f.seed, FSY); }
      else if (f.kind === 'cboom') { const R = f.R * Tz, k2 = 1 - sstep(0.5, 1, u); FXP.fireField(Q, X0, Y0, R * 0.8, 1, 0.8 * k2, f.seed, FSY, 0.6 * (1 - u)); FXP.iceField(Q, X0, Y0, R * 1.05, eout(u * 2), 0.6 * k2, f.seed + 3, FSY); }
      else if (f.kind === 'pillar') { const k2 = 1 - sstep(0.6, 1, u); FXP.fireField(Q, X0, Y0, Tz * 1.0, 1, 0.8 * k2, f.seed, FSY, 1 - u); }
      else if (f.kind === 'spire') { const k2 = 1 - sstep(0.7, 1, u); FXP.iceField(Q, X0, Y0, Tz * 1.1, eout(u * 3), 0.8 * k2, f.seed, FSY); if (glOn()) parts.push({ m: 'spire', X: X0, Y: Y0, s: Tz * 0.42 * f.s, yaw: f.seed, tilt: 0, a: k2, side: 'R', g: 0.6, h: eout(cl(f.t / 0.3)) * (1 - sstep(0.8, 1, u) * 0.6), z: Y0 }); }
      else if (f.kind === 'gust') { const R = Tz * (f.big ? 2.6 : 1.8), k2 = 1 - u; FXP.fireRing(Q, X0 - R * 0.15, Y0, R, eout(u) * 0.9, 0.7 * k2, f.seed, FSY); FXP.frostRing(Q, X0 + R * 0.15, Y0, R * 1.05, eout(u) * 0.9, 0.7 * k2, f.seed + 2, FSY); }   // (v465 RZ-A: a lift-off's, a landing's or a swoop's downdraft)
      else if (f.kind === 'pulse') { const R = CFG.circuit.pulseR * Tz; FXP.fireRing(Q, X0, Y0, R, eout(u) * 0.9, 1 - u, f.seed, FSY); FXP.frostRing(Q, X0, Y0, R * 1.1, eout(u) * 0.9, 1 - u, f.seed + 2, FSY); }
    }
    function drawGround(c) {
      const L = list(); if (!FX.length && !L.length && !ulOn()) return;
      const Tz = T(); if (gpu()) {
        const Q = fgOpen(c), parts = [];
        for (const a of L) { const al = (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1); if (!(al > 0.02)) continue; const sh = a.rzOut && a.rzOut.shadow, fh = a.rzOut && a.rzOut.flyH != null ? a.rzOut.flyH : (a.rzS.fly || 0), gx = sh ? sh.x : sx(a.x), gy = sh ? sh.y : sy(a.y), r = sh && sh.r ? sh.r / 0.46 : sizeT(a) * Tz;   // (v465 RZ-A: the model's own ground point and height)
          Q.sshadow(gx, gy, r * 0.46 * (1 - 0.3 * fh), r * 0.46 * 0.42 * (1 - 0.3 * fh), 0.42 * al * (1 - 0.55 * fh), '#06040A');
          Q.glow(gx - r * 0.18, gy, r * 0.5, '#FF6A1E', 0.08 * al, FSY); Q.glow(gx + r * 0.18, gy, r * 0.5, '#3FA8FF', 0.07 * al, FSY); }
        for (const f of FX) groundOne(Q, f, Tz, parts);
        fgClose(c);
        if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); c.save(); GLR().drawParts(c, parts); c.restore(); }
      }
      if (UL) try { UL.drawGround(c); } catch (e) {}
    }
    /* the air layer: breaths, spheres, bursts, steam, the entrance */
    function airOne(Q, f, Tz, parts) {
      const u = f.t / f.life;
      if (f.kind === 'gust') { const X0 = sx(f.x), Y0 = sy(f.y), R = Tz * (f.big ? 2.4 : 1.6); FXP.embers(Q, X0 - R * 0.3, Y0 - R * 0.3, R, u, 0.8, f.seed, 0.6); FXP.snow(Q, X0 + R * 0.3, Y0 - R * 0.3, R, u, 0.8, f.seed + 3, 0.6, 0.85); if (f.land) FXP.steam(Q, X0, Y0 - Tz * 0.3, R * 0.6, 0.35 * (1 - u), f.seed); }   // (v465 RZ-A)
      else if (f.kind === 'shock') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * 0.6, R = f.R * Tz * 1.3; FXP.shock(Q, X0, Y0, R, u, 1.2, f.seed, 0.8); if (f.t < 0.15) Q.glow(X0, Y0, R * 0.6, '#FFFFFF', 0.5 * (1 - f.t / 0.15)); }
      else if (f.kind === 'steam') { const X0 = sx(f.x), Y0 = sy(f.y) - f.z * Tz, r = f.r * Tz * (0.7 + 0.8 * eout(u)), a2 = 0.55 * sstep(0, 0.12, f.t) * (1 - sstep(0.45, 1, u)); FXP.steam(Q, X0, Y0, r, a2, f.seed); }
      else if (f.kind === 'frag') { const X1 = sx(f.x), Y1 = sy(f.y) - f.z * Tz, fade = 1 - sstep(0.7, 1, u); if (glOn()) parts.push({ m: 'shard', X: X1, Y: Y1, z: sy(f.y), s: f.s * Tz * 1.4, yaw: f.rot + f.t * 7, tilt: f.t * 5 + f.seed, a: fade, side: 'R', g: 0.8 }); else Q.star(X1, Y1, f.s * Tz * 2.2, 0.8 * fade, '#DDF6FF'); Q.glow(X1, Y1, f.s * Tz * 2.5, '#7FD8FF', 0.25 * fade); }
      else if (f.kind === 'ember') { const X1 = sx(f.x), Y1 = sy(f.y) - f.z * Tz, fade = 1 - sstep(0.6, 1, u); if (glOn()) parts.push({ m: 'ember', X: X1, Y: Y1, z: sy(f.y), s: f.s * Tz * 1.2, yaw: f.rot + f.t * 6, tilt: f.t * 4 + f.seed, a: fade, side: 'L', g: 1.4 * fade }); Q.glow(X1, Y1, f.s * Tz * 3, '#FF7A2E', 0.45 * fade); Q.star(X1, Y1, f.s * Tz * 1.4, 0.6 * fade, '#FFD9A0'); }
      else if (f.kind === 'pillar') { const X0 = sx(f.x), Y0 = sy(f.y), h = Tz * (2.4 + 1.2 * f.s) * eout(cl(f.t / 0.2)) * (1 - sstep(0.55, 1, u)), w = Tz * 0.45 * (0.8 + f.s);
        if (h > 2) { Q.tongue(X0, Y0, w, h, 0, 0.9, 0.9 * (1 - u * 0.5), f.seed); Q.tongue(X0 - w * 0.4, Y0, w * 0.6, h * 0.7, -0.15, 0.8, 0.7 * (1 - u), f.seed + 1); Q.tongue(X0 + w * 0.4, Y0, w * 0.6, h * 0.75, 0.15, 0.8, 0.7 * (1 - u), f.seed + 2); }
        FXP.embers(Q, X0, Y0 - h * 0.6, Tz * 1.3, u, 0.9, f.seed, 0.8); if (f.t < 0.25) Q.glow(X0, Y0, Tz * 1.2, '#FFB070', 0.5 * (1 - f.t / 0.25), FSY); }
      else if (f.kind === 'spire') { const X0 = sx(f.x), Y0 = sy(f.y); FXP.snow(Q, X0, Y0 - Tz * 0.8, Tz * 1.2, u, 0.8, f.seed, 0.7, 0.8); if (f.t < 0.25) Q.glow(X0, Y0 - Tz * 0.4, Tz * 1.0, '#BFEFFF', 0.45 * (1 - f.t / 0.25)); if (!glOn()) for (let i = 0; i < 3; i++) Q.star(X0 + (i - 1) * Tz * 0.3, Y0 - Tz * (0.3 + 0.35 * (i % 2)) * eout(cl(f.t / 0.3)), Tz * 0.35, 0.8 * (1 - u), '#DDF6FF'); }
      else if (f.kind === 'domF') { const fade = sstep(0, 0.4, f.t) * (1 - sstep(f.life - 0.5, f.life, f.t)), R = (f.rad || 0) * Tz; if (R > 4) FXP.embers(Q, sx(f.x), sy(f.y) - R * 0.35, R * 0.9, 0, 0.75 * fade, f.seed, lowFx() ? 0.5 : 0.85); }
      else if (f.kind === 'domI') { const fade = sstep(0, 0.4, f.t) * (1 - sstep(f.life - 0.5, f.life, f.t)), R = (f.rad || 0) * Tz; if (R > 4) FXP.snow(Q, sx(f.x), sy(f.y) - R * 0.3, R * 0.95, 0, 0.75 * fade, f.seed, lowFx() ? 0.5 : 0.85, 0.85); }
      else if (f.kind === 'cboom') { const X0 = sx(f.x), Y0 = sy(f.y) - Tz * 0.8, R = f.R * Tz, sw = bump(f.t, 0, 0.06, 0.12, 0.35);
        FXP.sun(Q, X0 - R * 0.05, Y0, R * (0.25 + 0.35 * sw), 1.1 * sw, f.seed, 2, 2); FXP.shock(Q, X0, Y0, R * 1.25, u, 1.3, f.seed + 2, 0.75); FXP.embers(Q, X0, Y0 - R * 0.2, R * 1.1, u, 1, f.seed, 1); FXP.snow(Q, X0, Y0, R * 1.2, u, 1, f.seed + 4, 1, 0.9); if (f.t < 0.2) Q.glow(X0, Y0, R * (0.8 + f.t * 3), '#FFFFFF', 0.85 * (1 - f.t / 0.2)); }
      else if (f.kind === 'fade') { const a = f.a; if (!S.list.includes(a)) return; const hp = heads(a), k2 = 1 - u; drawStreams(Q, a, hp, f.sL * k2, f.sR * k2, f.aL, f.aR, Tz); }
      else if (f.kind === 'modeFx') { const r = anc(f.a); if (!r || !r.coreL) return; const k2 = bump(f.t, 0, 0.1, 0.4, f.life); FXP.steam(Q, (r.coreL.x + r.coreR.x) / 2, (r.coreL.y + r.coreR.y) / 2 - r.coreL.r, r.coreL.r * 2.2, 0.45 * k2, 7); FXP.bridge(Q, r.coreL.x, r.coreL.y, r.coreR.x, r.coreR.y, r.coreL.r * 1.2, 0.8 * k2, 3, f.m === 'concord' ? 2 : 4); }
      else if (f.kind === 'bridge') { const r = anc(f.a); if (!r || !r.coreL) return; const k2 = sstep(0, 0.25, f.t) * (1 - sstep(f.life - 0.3, f.life, f.t)); FXP.bridge(Q, r.coreL.x, r.coreL.y, r.coreR.x, r.coreR.y, r.coreL.r * 1.6, 1.2 * k2, 5, 3); FXP.steam(Q, (r.coreL.x + r.coreR.x) / 2, (r.coreL.y + r.coreR.y) / 2 - r.coreL.r * 1.5, r.coreL.r * 2.5, 0.35 * k2, 11); }
      else if (f.kind === 'pulse') { const r = anc(f.a); if (!r || !r.coreL) return; const cx = (r.coreL.x + r.coreR.x) / 2, cy = (r.coreL.y + r.coreR.y) / 2; FXP.shock(Q, cx, cy, Tz * 2.4, 0.15 + 0.85 * u, 0.55, f.seed, 0.8); }
      else if (f.kind === 'crownFx') { const r = anc(f.a); if (!r || !r.crownL) return; const k2 = bump(f.t, 0, 0.3, f.life - 0.3, f.life); Q.glow(r.crownL.x, r.crownL.y, r.crownL.r * 1.3, '#FF9A3A', 0.3 * k2); Q.glow(r.crownR.x, r.crownR.y, r.crownR.r * 1.3, '#7FD8FF', 0.3 * k2);
        FXP.embers(Q, r.crownL.x, r.crownL.y, r.crownL.r * 1.4, 0, 0.8 * k2, 2, 0.6); FXP.snow(Q, r.crownR.x, r.crownR.y, r.crownR.r * 1.4, 0, 0.8 * k2, 4, 0.6, 0.2); }
      else if (f.kind === 'seals') entranceAir(Q, f, Tz);
      else if (f.kind === 'cores') coresAir(Q, f, Tz);
      else if (f.kind === 'burstF') { const r = anc(f.a); const hx = r && r.headL ? r.headL.x : sx(f.a.x) - Tz, hy = r && r.headL ? r.headL.y : sy(f.a.y) - Tz * 2.4, k2 = 1 - sstep(0.5, 1, u);
        for (let i = 0; i < 5; i++) Q.tongue(hx + (i - 2) * Tz * 0.25, hy + Tz * 0.6, Tz * 0.35, Tz * (1.0 + 0.6 * (2 - Math.abs(i - 2)) / 2) * eout(cl(f.t / 0.2)) * k2, (i - 2) * 0.18, 0.95, 0.9 * k2, i * 3);
        FXP.embers(Q, hx, hy - Tz * 0.4, Tz * 1.8, u, 1, 5, 1); if (f.t < 0.2) Q.glow(hx, hy, Tz * 1.6, '#FFD9A0', 0.6 * (1 - f.t / 0.2)); }
      else if (f.kind === 'burstI') { const r = anc(f.a); const hx = r && r.headR ? r.headR.x : sx(f.a.x) + Tz, hy = r && r.headR ? r.headR.y : sy(f.a.y) - Tz * 2.4, k2 = 1 - sstep(0.5, 1, u);
        FXP.snow(Q, hx, hy, Tz * 2.0, u, 1.1, 7, 1, 0.95); FXP.frostRing(Q, hx, hy, Tz * 1.6, eout(u) * 0.9, k2, 8, 1); FXP.charge(Q, hx, hy, Tz * 0.9, 'R', 1 - u, k2, 2); }
    }
    /* the two breaths, from the real mouths to their aims; a heat shimmer over the fire, steam where they cross */
    function drawStreams(Q, a, hp, sL, sR, aL, aR, Tz) {
      const k = kOf(a), sc = sizeT(a) / 2.6, hot = buffOn(a) ? 1 : 0.75, ev = 0.85 + 0.12 * k, t = a.at || 0;
      if (sL > 0.01) { const x1 = sx(aL.x), y1 = sy(aL.y) - Tz * 0.25, w = Tz * 0.82 * ev * sc * (0.8 + 0.2 * sL); FXP.fireStream(Q, hp.L.x, hp.L.y, x1, y1, w, hot, Math.min(1.2, sL), 3.1, 0.12 * Math.sin(t * 1.7));
        FXP.charge(Q, hp.L.x, hp.L.y, Tz * 0.55 * sc, 'L', 1, 0.9 * Math.min(1, sL), 1); if (!lowFx()) Q.shimmer((hp.L.x + x1 * 2) / 3, (hp.L.y + y1 * 2) / 3 - Tz * 0.4, Tz * 1.2, 0.22 * sL, 0.8, '#FFA640'); Q.glow(x1, sy(aL.y), Tz * 1.1, '#FF6A1E', 0.35 * Math.min(1, sL), FSY); }
      if (sR > 0.01) { const x1 = sx(aR.x), y1 = sy(aR.y) - Tz * 0.2, w = Tz * 0.72 * ev * sc * (0.8 + 0.2 * sR); FXP.iceStream(Q, hp.R.x, hp.R.y, x1, y1, w, Math.min(1.2, sR), 5.7, -0.1 * Math.sin(t * 1.3));
        FXP.charge(Q, hp.R.x, hp.R.y, Tz * 0.55 * sc, 'R', 1, 0.9 * Math.min(1, sR), 2); Q.glow(x1, sy(aR.y), Tz * 1.1, '#3FA8FF', 0.3 * Math.min(1, sR), FSY); FXP.snow(Q, x1, y1 - Tz * 0.3, Tz * 1.0, 0, 0.6 * Math.min(1, sR), 9, 0.7, 0.9); }
    }
    function cataAir(Q, a, A, Tz, parts) {
      const hp = heads(a), sc = sizeT(a) / 2.6, C = CFG.cata;
      for (const p of A.pairs) {
        if (p.st === 1) { const gk = p.g || 0, rL = Tz * 0.55 * sc * (0.2 + 0.8 * gk), wob = Math.sin((a.at || 0) * 9) * 0.04;
          FXP.sun(Q, hp.L.x + hp.L.dx * rL * 1.2, hp.L.y + hp.L.dy * rL * 0.6, rL * (1 + wob), Math.min(1, gk * 1.5), 1 + p.i, 0.8, 1); FXP.planet(Q, hp.R.x + hp.R.dx * rL * 1.2, hp.R.y + hp.R.dy * rL * 0.6, rL, Math.min(1, gk * 1.5), 2 + p.i, 0.6, 0);
          FXP.charge(Q, hp.L.x, hp.L.y, Tz * 0.6 * sc, 'L', gk, 0.8, 1); FXP.charge(Q, hp.R.x, hp.R.y, Tz * 0.6 * sc, 'R', gk, 0.8, 2); }
        else if (p.st === 2) { const qL = p.qL, qR = p.qR; if (!qL) continue; const rS = Tz * 0.55 * sc * (1 + 0.25 * (p.last ? 1 : 0)), cr = sstep(0.82, 1, p.u), H6 = p.hist;
          // the trails: molten plasma behind the sun, frost and fragments behind the planet (from the recorded path)
          if (H6.length >= 12) { const n = H6.length / 6, j0 = Math.max(0, n - 9); const ox = sx(H6[j0 * 6]), oy = sy(H6[j0 * 6 + 1]) - H6[j0 * 6 + 2] * Tz, ix = sx(H6[j0 * 6 + 3]), iy = sy(H6[j0 * 6 + 4]) - H6[j0 * 6 + 5] * Tz;
            const LX = sx(qL.x), LY = sy(qL.y) - qL.z * Tz, RX = sx(qR.x), RY = sy(qR.y) - qR.z * Tz, jm = Math.max(j0, n - 5), mx = sx(H6[jm * 6]), my = sy(H6[jm * 6 + 1]) - H6[jm * 6 + 2] * Tz, nx = sx(H6[jm * 6 + 3]), ny = sy(H6[jm * 6 + 4]) - H6[jm * 6 + 5] * Tz;
            FXP.trailFire(Q, ox, oy, mx, my, rS * 0.7, 0.9, 1 + p.i); FXP.trailFire(Q, mx, my, LX, LY, rS * 0.9, 1, 2 + p.i); FXP.trailIce(Q, ix, iy, nx, ny, rS * 0.7, 0.9, 3 + p.i); FXP.trailIce(Q, nx, ny, RX, RY, rS * 0.9, 1, 4 + p.i); }
          const LX = sx(qL.x), LY = sy(qL.y) - qL.z * Tz, RX = sx(qR.x), RY = sy(qR.y) - qR.z * Tz;
          Q.sshadow(sx(qL.x), sy(qL.y), rS * 0.8, rS * 0.3, 0.25, '#0A0604'); Q.sshadow(sx(qR.x), sy(qR.y), rS * 0.8, rS * 0.3, 0.25, '#04060A');
          FXP.sun(Q, LX, LY, rS * (1 + 0.35 * cr), 1, 1 + p.i, 1.2, 1 + cr); FXP.planet(Q, RX, RY, rS, 1, 2 + p.i, 0.9, cr * 1.5);
          if (glOn()) { parts.push({ m: 'ringL', X: LX, Y: LY, z: 9e3, s: rS * 0.9, yaw: (a.at || 0) * 2, tilt: 1.1, a: 1, g: 0.6, t: a.at || 0 }); parts.push({ m: 'ringR', X: RX, Y: RY, z: 9e3, s: rS * 0.95, yaw: -(a.at || 0) * 1.6, tilt: 1.3, a: 1, g: 0.4, t: a.at || 0 }); }
          if (cr > 0.05) { Q.glow((LX + RX) / 2, (LY + RY) / 2, rS * 1.5 * cr, '#FFFFFF', 0.4 * cr); FXP.steam(Q, (LX + RX) / 2, (LY + RY) / 2, rS * 1.2 * cr, 0.3 * cr, 13); } }
      }
      void C;
    }
    function entranceAir(Q, f, Tz) {
      const a = f.a, t = f.t, px = luxSide(a), X0 = sx(a.x), Y0 = sy(a.y) - Tz * 3.6, R = Tz * 1.35, out = 1 - sstep(f.life - 0.6, f.life, t), dr = sstep(0, 0.8, t) + 0.5 * sstep(1.0, 1.4, t);
      const lx = X0 + (px >= 0 ? 1 : -1) * Tz * 1.55, rx = X0 - (px >= 0 ? 1 : -1) * Tz * 1.55;
      FXP.seal(Q, lx, Y0, R, 'L', dr, t * 0.9, out, 0.75); FXP.seal(Q, rx, Y0, R, 'R', dr, -t * 0.9, out, 0.75);
      Q.glow(lx, Y0, R * 1.3, '#FF7A2E', 0.22 * out * sstep(0, 0.5, t)); Q.glow(rx, Y0, R * 1.3, '#5FB8FF', 0.2 * out * sstep(0, 0.5, t));
      FXP.embers(Q, lx, Y0 + R * 0.2, R * 1.2, 0, 0.6 * out, 3, 0.6); FXP.snow(Q, rx, Y0 + R * 0.2, R * 1.2, 0, 0.6 * out, 5, 0.6, 0.85);
    }
    function coresAir(Q, f, Tz) {
      const a = f.a, t = f.t, r = anc(a), px = luxSide(a), X0 = sx(a.x), Y0 = sy(a.y), top = Y0 - Tz * 3.6;
      const ex = r && r.coreL ? (r.coreL.x + r.coreR.x) / 2 : X0, ey = r && r.coreL ? (r.coreL.y + r.coreR.y) / 2 : Y0 - Tz * 1.3, u = sstep(0.3, 1.4, t), orb = (1 - u) * Tz * 1.8 + Tz * 0.35, an = t * 7, fade = 1 - sstep(1.35, 1.6, t), grow = sstep(0.2, 0.5, t);
      const cx = lerp(X0, ex, u), cy = lerp(top, ey, u), lx = lerp(X0 + px * Tz * 1.55, cx + Math.cos(an) * orb, sstep(0.2, 0.6, t)), ly = lerp(top, cy + Math.sin(an) * orb * 0.45, sstep(0.2, 0.6, t)), rx = lerp(X0 - px * Tz * 1.55, cx - Math.cos(an) * orb, sstep(0.2, 0.6, t)), ry = lerp(top, cy - Math.sin(an) * orb * 0.45, sstep(0.2, 0.6, t));
      FXP.sun(Q, lx, ly, Tz * 0.3 * grow, fade, 1, 1.5, 1); FXP.planet(Q, rx, ry, Tz * 0.3 * grow, fade, 2, 1.2, 0); Q.glow(lx, ly, Tz * 0.9, '#FF8A2A', 0.4 * fade * grow); Q.glow(rx, ry, Tz * 0.9, '#5FB8FF', 0.4 * fade * grow);
      if (t > 1.2) FXP.bridge(Q, lx, ly, rx, ry, Tz * 0.25, 0.8 * fade, 1, 2);
    }
    /* the light over the body: the eyes, the cores' glow, the heads gathering, the Circuit's flowing energy, the last 5 s instability */
    function bodyLight(c, a) {
      const r = anc(a); if (!r || !gpu()) return; const Sx = a.rzS || {}, al = (a.alpha == null ? 1 : a.alpha) * (a.judg ? a.jA : 1); if (!(al > 0.02)) return; const Q = fgOpen(c), u = r.unit || T() * 0.1, t = a.at || 0;
      if (r.coreL && r.coreR) { const bl = buffOn(a) ? 1 : 0, h = 0.75 + 0.25 * Math.sin(t * 3); Q.glow(r.coreL.x, r.coreL.y, r.coreL.r * (3 + bl), '#FF8A2A', (0.32 + 0.2 * bl) * al * h); Q.glow(r.coreR.x, r.coreR.y, r.coreR.r * (3 + bl), '#3FA8FF', (0.3 + 0.2 * bl) * al * (1.5 - h * 0.5));
        // the Revelation Circuit: the white bridge between the cores, fire and frost running out over the body (to the throats and the wing roots)
        const A0 = a.rz && a.rz.act, cast = A0 && A0.kind === 'circuit' ? sstep(0.3, 0.9, A0.t) : 0, fl = Math.max(cast, bl ? 0.5 : 0);
        if (fl > 0.02) { const mx = (r.coreL.x + r.coreR.x) / 2, my = (r.coreL.y + r.coreR.y) / 2, ex = (r.coreR.x - r.coreL.x) * 0.45, ey = (r.coreR.y - r.coreL.y) * 0.45;
          FXP.bridge(Q, r.coreL.x - ex, r.coreL.y - ey, r.coreR.x + ex, r.coreR.y + ey, r.coreL.r * (1.1 + 0.8 * cast), (0.5 + 0.7 * cast) * al, 2, 3); Q.glow(mx, my, r.coreL.r * (2 + 2 * cast), '#FFFFFF', 0.25 * fl * al);
          const w = u * (0.9 + 0.6 * cast), ka = fl * al;
          if (r.throatL) FXP.trailFire(Q, r.coreL.x, r.coreL.y, r.throatL.x, r.throatL.y, w, 0.9 * ka, 3); if (r.wingRootL) FXP.trailFire(Q, r.coreL.x, r.coreL.y, r.wingRootL.x, r.wingRootL.y, w * 0.8, 0.7 * ka, 4);
          if (r.throatR) FXP.trailIce(Q, r.coreR.x, r.coreR.y, r.throatR.x, r.throatR.y, w, 0.9 * ka, 5); if (r.wingRootR) FXP.trailIce(Q, r.coreR.x, r.coreR.y, r.wingRootR.x, r.wingRootR.y, w * 0.8, 0.7 * ka, 6); }
        if (bl) { if (r.body) { FXP.embers(Q, r.body.x - r.body.r * 0.35, r.body.y, r.body.r * 0.9, 0, 0.45 * al, 6, 0.5); FXP.snow(Q, r.body.x + r.body.r * 0.35, r.body.y, r.body.r * 0.9, 0, 0.45 * al, 8, 0.5, 0.8); } } }
      if (r.eyesL) for (const e of r.eyesL) Q.glow(e[0], e[1], u * 0.4, '#FFB040', 0.5 * al); if (r.eyesR) for (const e of r.eyesR) Q.glow(e[0], e[1], u * 0.4, '#7FE0FF', 0.5 * al);
      const cL = Sx.chargeL || 0, cR = Sx.chargeR || 0, A = a.rz && a.rz.act, streaming = A && A.kind === 'fang' && (A.sL > 0.05 || A.sR > 0.05);
      if (!streaming && r.mouthL && cL > 0.05) FXP.charge(Q, r.mouthL.x, r.mouthL.y, u * (1.6 + 1.6 * cL), 'L', cL, al, 1);
      if (!streaming && r.mouthR && cR > 0.05) FXP.charge(Q, r.mouthR.x, r.mouthR.y, u * (1.6 + 1.6 * cR), 'R', cR, al, 2);
      if (r.throatL && cL > 0.2) Q.glow(r.throatL.x, r.throatL.y, u * 1.6, '#FFD9A0', 0.35 * cL * al);
      const fin = Sx.final || 0; if (fin > 0.02) { if (r.headL) { Q.tongue(r.headL.x, r.headL.y + u * 0.6, u * 1.2, u * (2 + 2 * fin) * (0.7 + 0.3 * Math.sin(t * 17)), Math.sin(t * 5) * 0.4, 0.9, 0.6 * fin * al, 4); FXP.embers(Q, r.headL.x, r.headL.y - u * 1.5, u * 4, 0, 0.7 * fin * al, 3, 0.8); }
        if (r.headR) { FXP.snow(Q, r.headR.x, r.headR.y, u * 4, 0, 0.7 * fin * al, 6, 0.8, 0.9); Q.glow(r.headR.x, r.headR.y, u * 3, '#BFEFFF', 0.25 * fin * al); } }
      fgClose(c);
    }
    function drawBodyFx(c, a) { bodyLight(c, a); }
    function drawFx(c) {
      const Tz = T(), on = gpu(), L = list();
      if (on && (FX.length || L.length)) {
        const Q = fgOpen(c), parts = [];
        for (const f of FX) airOne(Q, f, Tz, parts);
        for (const a of L) { const A = a.rz && a.rz.act; if (!A) continue; if (A.kind === 'fang') { const hp = heads(a); drawStreams(Q, a, hp, A.sL, A.sR, a.rz.aL, a.rz.aR, Tz); if (A.cross && (A.sL > 0.2)) { const X1 = sx(A.cross.x), Y1 = sy(A.cross.y) - Tz * 0.4; Q.glow(X1, Y1, Tz * 1.3, '#FFFFFF', 0.35); FXP.shock(Q, X1, Y1, Tz * 1.2, ((a.at || 0) * 2.2) % 1, 0.6, 3, 0.8); } }
          else if (A.kind === 'cata') cataAir(Q, a, A, Tz, parts); }
        fgClose(c);
        if (parts.length && glOn()) { parts.sort((p, q) => p.z - q.z); c.save(); GLR().drawParts(c, parts); c.restore(); }
      }
      if (UL) try { UL.drawFx(c); } catch (e) {}
    }
    /* screen-space: a little darkness for the entrance; the ultimate's own */
    function drawCine(c, W, Hh) {
      let dim = 0; for (const a of list()) if (a.rz && a.rz.en >= 0 && !a.rz.ready) dim = Math.max(dim, 0.32 * (1 - sstep(3.6, CFG.enter, Math.max(0, a.rz.en))));
      if (FIN) dim = Math.max(dim, 0.45 * bump(FIN.t, 0, 0.6, CFG.fin.hit, CFG.fin.hit + 0.6));
      if (dim > 0.005) { c.save(); const gr = c.createRadialGradient(W / 2, Hh * 0.45, Math.min(W, Hh) * 0.2, W / 2, Hh * 0.45, Math.max(W, Hh) * 0.75); gr.addColorStop(0, `rgba(10,6,14,${dim * 0.1})`); gr.addColorStop(0.5, `rgba(8,6,16,${dim * 0.6})`); gr.addColorStop(1, `rgba(4,3,10,${Math.min(0.9, dim * 1.1)})`); c.fillStyle = gr; c.fillRect(0, 0, W, Hh); c.restore(); }
      if (UL) try { UL.drawCine(c, W, Hh); } catch (e) {}
    }
    /* the summon button: the time left (a gold arc) and the alignment (Concord: the two halves joined; Dissonance: apart) */
    function drawBtn(c, b) {
      const a = list().find(q => q.st === 'fight' || q.st === 'awaken'); if (!a || !a.rz) return; const R = b.r + 6, life = cl(a.life / CFG.life), dis = a.rz.mode === 'dissonance', gp = dis ? 0.35 : 0.06, bl = buffOn(a);
      c.save(); c.lineCap = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(10,14,30,.75)'; c.beginPath(); c.arc(b.x, b.y, R, 0, TAU); c.stroke();
      c.strokeStyle = '#FF8A3A'; c.beginPath(); c.arc(b.x, b.y, R, Math.PI / 2 + gp, Math.PI * 1.5 - gp); c.stroke(); c.strokeStyle = '#7FD8FF'; c.beginPath(); c.arc(b.x, b.y, R, -Math.PI / 2 + gp, Math.PI / 2 - gp); c.stroke();
      if (bl) { c.lineWidth = 1.5; c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(b.x, b.y, R, 0, TAU); c.stroke(); }
      c.lineWidth = 2; c.strokeStyle = '#FFC24D'; c.beginPath(); c.arc(b.x, b.y, R + 5, -Math.PI / 2, -Math.PI / 2 + TAU * life); c.stroke();
      c.font = '800 7px sans-serif'; c.textAlign = 'center'; c.fillStyle = dis ? '#CFEFFF' : '#FFE2C0'; c.fillText(dis ? 'DISSONANCE' : 'CONCORD', b.x, b.y - R - 9); c.restore();
    }
    // (a power on demand, aimed as the mind would aim it: for showcases and tests)
    function cast(a, kind, o) { stOf(a); a.rz.ready = true; a.rz.first = true; if (a.rz.act) endAct(a); if (!H.near(a.x, a.y, 11).length && kind !== 'circuit') return false; start(a, kind, o); return true; }
    return { tick, fin, cast, choose, update, stop, outK, descent, entrance, interrupt, drawGround, drawFx, drawBodyFx, drawCine, drawBtn, thermalShock, fireHit, iceHit, setMode, evalMode, CFG,
      get ul() { return UL; }, get fin2() { return FIN; }, get fx() { return FX; }, get marks() { return MARK; }, get pend() { return PEND; }, seed: v => { RS = (Math.abs(v | 0) % 2147483646) + 1; } };
  }
  return { create, CFG, BIG, FXP, EVO };
})();
if (typeof self !== 'undefined') self.RAZIEL_MOVES = RAZIEL_MOVES;
