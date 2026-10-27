/* ---------- NHALEX, THE UNWRITTEN MIND ----------
   The Library of Unwritten Lives' last boss, in the Final Archive: an octagon of pale gilded parchment some thirty-four
   metres across, adrift in the ink-dark void of the dream, its floor left almost bare so that dark ink reads on it, and
   eight enormous books standing upright round its rim. Far overhead hangs the black moon.
   Nhalex is the mind that writes in the margins: a giant brain floating over the archive's northern half, held up on a
   tapering plume of black ink. Five broad ivory lobes with burgundy grooves; three mismatched gold eyes, each in a lobe
   of its own; six thick ink tendrils curling beneath it, each ending in a flattened quill nib. Behind it turns a broken
   ring of four enormous open pages, each with one great black symbol, and behind those a little model of Gaia turns in a
   glassless gilded frame. It rolls slightly as it thinks; its eyes close one by one before a projection appears; struck,
   it flinches back and squints.
   Quill Stabs (all fight, between the big mechanics): tendrils rear over shown circles and stab down, or lash along a
   shown line; a nib left stuck in the floor can be struck for more.
   Quill Sentence (above 70%, and later now and then): a quill writes three lines on the floor, each with a big number;
   they become dangerous in their NUMBERED order (not the order they were written in).
   Unwritten Ending (70-35%): three of the eight books open and each projects a version of it. The real projection casts
   a GOLD shadow; the copies are hollow dashed violet outlines. Break the real one's tether before the ending is written
   and it reels (its golden core bared); fail and the ending lands on the whole archive.
   The Unwritten (once, half way down): its pages spill two hundred and forty of the rift's brood (fifty at a time) onto
   the floor; it cannot be struck meanwhile and only stabs now and then. When the last is gone it sags, its core bared.
   False Salvation (below 35%): an arena-wide cast and two shelters. The genuine one has a double solid gold boundary and
   a gold shadow; the decoy is a dashed violet ring. Reach the real one while minding a numbered quill line.
   The Last Page (once, at about 18%): it stops, its ink plume boils and it begins to unmake itself: a huge countdown and
   a ward of damage to break. Its other attacks thin to a light stab and its golden core is bared. Break the ward in time
   and the page tears: it collapses (a long stagger), nearly spent. Fail and it detonates, knocking out every pet in the
   party: the run ends like any wipe.
   The three big mechanics are sequenced, never stacked. Its fall hands over to the rift's sealing: the black moon opens
   into a circular skylight and the model of Gaia lights seven points. */
RiftFiend.define({ id: 'nhalex', name: 'Nhalex', title: 'The Unwritten Mind', color: '#F0E6CE', glow: '#F2DC9A', accent: '#FFE9A8', biome: 'archive', r: 3.2, els: ['dark', 'light'], phases: 3, cuts: [1, 0.7, 0.35] }, (() => {
  const { TAU, TN } = RiftFiend, K = DunFiend.KIT, { PARCH, PARCH_D, PARCH_HI, BURG, GOLD, GOLD_HI, VIOLET, VIOLET_HI } = LIB;
  const decay = (v, dt, k) => Math.max(0, (v || 0) - dt * k), toward = (v, w, dt, k) => (v || 0) + (w - (v || 0)) * Math.min(1, dt * k), lerp = (a, b, u) => a + (b - a) * u, smooth = u => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const IVORY = '#F0E6CE', IVORY_SH = '#D2BC96', IVORY_DK = '#AA8F6C', IVORY_HI = '#FFFAEE', GROOVE = '#7C2F50', GROOVE_DK = '#4E1A33', INK2 = '#14101C', ROSE = '#E2456C', ROSE_HI = '#FF9DB6', TEL = '#24101E', IRIS = '#E9B23C', PLUME = '#1E1A2A';
  /* the archive (all about the arena's centre C): an octagon with flat sides north, south, east and west (apothem AP) */
  const AP = 17, RV = AP / Math.cos(Math.PI / 8);
  const inOct = (dx, dy, pad) => { const r = AP - (pad || 0); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; if (Math.abs(dx * Math.cos(a) + dy * Math.sin(a)) > r) return false; } return true; };
  const octPts = pad => { const r = (AP - (pad || 0)) / Math.cos(Math.PI / 8), out = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; out.push([Math.cos(a) * r, Math.sin(a) * r]); } return out; };
  // the eight books round the rim, one at each corner of the octagon
  const BOOK_R = 15.3, BOOK_COL = ['#6B324F', '#2F3A5A', '#3E5A44', '#5A2A3A', '#4A3A6A', '#7A5A2A', '#4A2236', '#2A4A4A'];
  const BOOKS = Array.from({ length: 8 }, (_, k) => { const a = -Math.PI / 2 + Math.PI / 8 + k * Math.PI / 4; return { k, a, x: Math.cos(a) * BOOK_R, y: Math.sin(a) * BOOK_R }; });
  /* the mind: the body's sorting point far north (so the pet is always drawn in front of it), the ink plume's foot, the
     brain's centre and its half-sizes, where it sinks when spent, the page ring behind it */
  const BOSS_Y = -13.6, FOOT_Y = -9.4, BR_Y = -10.8, BR_Z = 8.0, SAG_Y = -8.4, SAG_Z = 4.3, BW = 4.1, BH = 2.7, BD = 2.9, RING_R = 6.7, RING_DY = -3.4;
  // the five lobes, in the brain's own facing plane (u right, w up, metres), back to front
  const LOBES = [{ u: -1.8, w: 0.85, ru: 2.25, rw: 1.75, rot: 0.22, ph: 0.4 }, { u: 1.8, w: 0.85, ru: 2.25, rw: 1.75, rot: -0.22, ph: 1.9 }, { u: -2.6, w: -0.95, ru: 1.6, rw: 1.25, rot: -0.3, ph: 2.7 }, { u: 2.6, w: -0.95, ru: 1.6, rw: 1.25, rot: 0.3, ph: 3.6 }, { u: 0, w: -1.25, ru: 1.85, rw: 1.3, rot: 0, ph: 5.1 }];
  const G_CROWN = [[[-0.8, 0.05], [-0.25, 0.64], [0.45, 0.44]], [[-0.62, -0.42], [-0.05, 0.02], [0.64, -0.1]], [[0.0, -0.8], [0.4, -0.46], [0.84, -0.44]]], G_TEMP = [[[-0.72, 0.3], [-0.05, 0.54], [0.56, 0.14]], [[-0.56, -0.4], [0.05, -0.12], [0.64, -0.44]]], G_BROW = [[[-0.74, 0.2], [0, 0.5], [0.74, 0.2]], [[-0.5, -0.38], [0, -0.12], [0.5, -0.38]]];
  const mirror = G => G.map(g => g.map(([x, y]) => [-x, y]));
  const GROOVES = [G_CROWN, mirror(G_CROWN), G_TEMP, mirror(G_TEMP), G_BROW];
  // three mismatched eyes: [lobe, u, w in the lobe (-1..1), radius, squash, slit, roll]
  const EYES = [[0, -0.12, 0.02, 0.88, 0.88, false, 0.1], [3, 0.06, 0.1, 0.56, 0.6, true, -0.25], [1, 0.42, 0.3, 0.4, 1.0, false, 0.2]];
  const TEND = Array.from({ length: 6 }, (_, k) => ({ k, ph: k * TAU / 6 + 0.26 }));
  const CYC1 = ['stab', 'sentence', 'stab', 'stab', 'sentence'], CYC2 = ['stab', 'ending', 'stab', 'sentence', 'stab', 'ending'], CYC3 = ['stab', 'salvation', 'stab', 'sentence', 'stab', 'salvation'];
  /* the Last Page: when it begins, how long the page runs, and its ward (the damage needed) in bars of the fight's health */
  const LP_AT = 0.18, LP_T = 18, WARD_K = 0.36;
  const TETH_K = 0.035, HORDE = 240, HORDE_CAP = 50, HORDE_MIX = [['marginworm', 45], ['inkstalker', 35], ['falsefolio', 20]];
  // the seven points the model of Gaia lights when it falls: [longitude, latitude]
  const GAIA_PTS = [[0.3, 0.35], [1.2, -0.2], [2.1, 0.5], [2.9, -0.45], [3.8, 0.1], [4.7, 0.62], [5.6, -0.3]];
  const GAIA_LAND = [[0.4, 0.3, 0.42, 0.3], [1.5, -0.25, 0.5, 0.36], [2.6, 0.45, 0.32, 0.22], [3.6, -0.1, 0.55, 0.4], [4.8, 0.35, 0.36, 0.28], [5.7, -0.45, 0.3, 0.2]];
  let vigCv = null;
  return {
    arenaR: 18.8, firstAct: 'think', ambient: 'motes',
    // (the Last Page's numbers, for the record and the tests)
    lastPage: { at: LP_AT, T: LP_T, wardK: WARD_K },
    artPoses: [{ name: 'thinking', mem: { demo: 1 } }, { name: 'its core bared', mem: { demo: 1, demoSag: 1 } }, { name: 'the last page', mem: { demo: 1, demoSag: 1, demoBoil: 1 } }],
    phaseNames: ['Quill Sentence', 'Unwritten Ending', 'False Salvation'],
    start(C) { return { x: C.x + 0.5, y: C.y + 7 }; },
    // the walkable ground is the octagon, less the feet of the eight books
    carve(set, C) { const RR = Math.ceil(C.R) + 2; for (let y = -RR; y <= RR; y++) for (let x = -RR; x <= RR; x++) { const wx = Math.floor(C.x) + x, wy = Math.floor(C.y) + y, cx = wx + 0.5 - C.x, cy = wy + 0.5 - C.y;
        if (!inOct(cx, cy, 0.2) || BOOKS.some(B => Math.hypot(cx - B.x, cy - B.y) < 1.25)) set(wx, wy, T_SOLID); } },
    props(C) { return BOOKS.map(B => ({ kind: 'book', i: B.k, x: C.x + B.x, y: C.y + B.y + 0.3 })); },
    drawProp(c, FX, p, X, Y, T, t) { if (p.kind === 'book') drawBook(c, FX, p, X, Y, T, t); },
    propKeep: { every: 4, box: () => [-4.2, -5.6, 2.6, 1.0], sig: (FX, p) => { const b = FX.mem && FX.mem.books ? FX.mem.books[p.i] : null; return b ? `${Math.round(b.open * 14)}|${b.lit ? 1 : 0}` : '0'; } },
    paintGround(c, A) { paintFloor(c, A); },
    sky(c, W, H, t, cam, T, FX) { paintSky(c, W, H, T, !!(FX && FX.m && FX.m.dead)); },
    skyKey(FX) { return FX.m && FX.m.dead ? 'open' : 'moon'; },
    overlay(c, FX, t, T) { drawOverlay(c, FX, t, T); },
    camFocus(FX, m) { const C = FX.C, M = FX.mem; if (!M.P) return null; if (m.dead) return M.deadT != null && M.deadT < 3 ? { x: C.x, y: C.y - 15, k: 0.6, zoom: 0.46 } : null;
      if (m.act === 'enter') return { x: C.x, y: C.y - 19, k: 0.62, zoom: 0.42 };
      if (M.lp) return { x: C.x, y: C.y - 12, k: 0.85, zoom: 0.5 };
      if (m.stunT > 0) return { x: C.x, y: C.y - 9, k: 0.4, zoom: 0.5 };
      if (m.act === 'ending' || m.act === 'salvation') return { x: C.x, y: C.y - 4, k: 0.7, zoom: 0.36 };
      return { x: C.x, y: C.y - 19, k: 0.58, zoom: 0.43 }; },
    /* ---- the fight ---- */
    init(FX) { const M = FX.mem, m = FX.m, C = FX.C; m.act = 'enter'; m.noTouch = true; m.touchK = 0;
      Object.assign(M, { bt: 0, q: [], qt: 0, seen: {}, picks: 0, nextSig: null, recoil: 0, roll: 0, ringA: 0.3, fx: C.x, dx: 0, why: null, wasStun: false, roared: false, end: null, salv: null, lp: null, lpDone: false, hd: null, hdDone: false, drops: [], splats: [], look: [0, 0.3],
        eyes: EYES.map((e, i) => ({ i, b: 1, shut: 0, bl: 0, bt: 1 + i * 0.7 })),
        books: BOOKS.map(() => ({ open: 0, lit: 0 })),
        tend: TEND.map(T0 => ({ k: T0.k, mode: 'rest', t: 0, tip: [C.x + Math.cos(T0.ph) * 5.4, C.y + BR_Y + Math.sin(T0.ph) * 3 + 1, 2.2], lift: 0, pts: null, px: null })),
        stat: { stabs: 0, stabHit: 0, slashes: 0, slashHit: 0, sents: 0, sentOrder: [], sentHit: 0, sentSafe: 0, endings: 0, endingsBroken: 0, falseKnots: 0, majors: 0, majorHit: 0, salvs: 0, salvSafe: 0, salvDecoy: 0, salvHit: 0, salvLine: 0, poured: 0, lpStarts: 0, lpPassed: 0, lpFailed: 0, wiped: 0, bared: 0 } });
      M.P = { sag: 0, open: 0, boil: 0, wake: 0, dk: 0, rec: 0, alpha: 1 }; m.x = C.x; m.y = C.y + BOSS_Y; },
    phase(FX, p, lv) { const M = FX.mem, m = FX.m; resetAll(FX, m); M.recoil = 1; FX.H.shake(10, 0.5); FX.H.flash(0.2, GOLD_HI); FX.H.sfx.hum();
      if (lv === 2) { M.nextSig = 'ending'; M.picks = 0; minions(FX, ['marginworm', 'inkstalker']); FX.H.banner('UNWRITTEN ENDING', 'It projects versions of itself: the real one casts a GOLD shadow', GOLD_HI, 2.8, true); }
      if (lv >= 3) { M.nextSig = 'salvation'; M.picks = 0; minions(FX, ['falsefolio', 'inkstalker']); FX.H.banner('FALSE SALVATION', 'Only the shelter with the double gold ring and gold shadow is real', GOLD_HI, 2.8, true); } },
    ai(FX, m, dt) {
      const M = FX.mem, lv = FX.S.lv; m.actT += dt; m.noTouch = true;
      M.qt += dt; while (M.q.length && M.q[0].at <= M.qt) M.q.shift().fn();
      // the unwritten pour out once, half way down; the last page once, near the end
      if (!M.hdDone && !M.hd && lv >= 2 && m.act === 'think' && m.hp <= m.maxhp * 0.52) startHorde(FX, m);
      else if (!M.lpDone && !M.lp && lv >= 3 && m.act === 'think' && m.hp <= m.maxhp * LP_AT) startLastPage(FX, m);
      switch (m.act) {
        case 'think': if (m.actT > (lv >= 3 ? 1.2 : lv >= 2 ? 1.45 : 1.7) / FX.S.fast) choose(FX, m); break;
        case 'stab': if (!M.q.length && m.actT > M.actEnd) endAct(m); break;
        case 'sentence': if (!M.q.length && m.actT > 1 && !FX.S.tele.some(s => s.ink === 'line')) endAct(m); break;
        case 'ending': endingTick(FX, m, dt); break;
        case 'salvation': if (M.salv) { M.salv.t += dt; if (M.salv.t > M.salv.CAST + 1.3) { M.salv = null; endAct(m); } } else endAct(m); break;
        case 'horde': hordeTick(FX, m, dt); break;
        case 'lastpage': lastPageTick(FX, m, dt); break;
      }
      if (!m.under) FX.parts(partsList(FX, m));
    },
    stunned(FX, m, dt) { const M = FX.mem; m.noTouch = true; const cp = coreAt(FX); FX.weak('core', cp[0], cp[1] - cp[2], 2.4, M.why === 'torn' ? 3 : 2.5, m.stunT > 0.05);
      M.shT = (M.shT || 0) - dt; if (M.shT <= 0) { M.shT = 0.35; FX.H.sparks(cp[0] + FX.rnd(-1.2, 1.2), cp[1] - cp[2] + FX.rnd(-0.8, 0.8), GOLD_HI, 4, 3); } if (!m.under) FX.parts(partsList(FX, m)); },
    update(FX, dt) { const M = FX.mem, m = FX.m, C = FX.C, me = FX.me; if (!m || !M.P) return; M.bt += dt;
      M.recoil = decay(M.recoil, dt, 2.2);
      if (m.dead) { deadTick(FX, m, dt); return; }
      // the Last Page's ward: every blow while the page runs goes into the ward, not its health
      if (M.lp && M.lp.st !== 'done') { const d = M.lp.hp0 - m.hp; if (d > 0) { if (M.lp.st === 'cast' || M.lp.st === 'sink') { M.lp.ward = Math.max(0, M.lp.ward - d); M.lp.dealt += d; } m.hp = M.lp.hp0; } }
      // (it cannot be beaten past the unwritten, or past the last page, before they have been answered)
      else { if (!M.hdDone && m.hp < m.maxhp * 0.37) m.hp = m.maxhp * 0.37; if (!M.lpDone && m.hp < m.maxhp * 0.15) m.hp = m.maxhp * 0.15; }
      if (!(m.stunT > 0)) { if (FX.S.weak.core && !(M.lp && M.lp.st === 'cast')) FX.weak('core', 0, 0, 0, 0, false); if (M.wasStun) { M.wasStun = false; M.why = null; M.recoil = 1; FX.H.text(m.x, C.y - 9, 'It gathers its thoughts again', GOLD_HI, 13); FX.H.sfx.hum(); } } else M.wasStun = true;
      if (m.act === 'enter' && (FX.S.enterT || 0) > 1.6 && !M.roared) { M.roared = true; M.recoil = 1; FX.H.shake(10, 0.7); FX.H.flash(0.25, GOLD_HI); FX.H.sfx.hum(); }
      // it rolls slightly as it thinks; the page ring turns (faster while it spills the unwritten)
      M.roll = Math.sin(M.bt * 0.45) * 0.06 + (m.act === 'think' ? Math.sin(M.bt * 1.3) * 0.035 : 0) + (M.P.boil ? Math.sin(M.bt * 7) * 0.03 * M.P.boil : 0);
      M.ringA += dt * (0.11 + (M.hd ? 0.5 : 0) + M.P.boil * 0.3) * (1 - M.P.dk);
      easePose(FX, m, dt);
      const B = brainAt(FX); m.x = B[0]; M.fx = toward(M.fx, B[0], dt, 0.9);
      // the eyes: they follow the pet, blink now and then, close one by one for its projections, squint when struck
      M.look[0] = toward(M.look[0], clamp((me.x - B[0]) / 12, -1, 1), dt, 6); M.look[1] = toward(M.look[1], clamp((me.y - B[1]) / 14, -0.4, 1), dt, 6);
      for (const e of M.eyes) { e.bt -= dt; if (e.bt <= 0) { e.bt = 2.2 + Math.random() * 3.5; e.bl = 1; } e.bl = decay(e.bl, dt, 5);
        const wakeShut = 1 - clamp((M.P.wake - 0.25 - e.i * 0.22) / 0.2, 0, 1), blink = e.bl > 0 ? Math.sin(e.bl * Math.PI) : 0;
        e.b = toward(e.b, Math.max(e.shut, wakeShut, blink, M.recoil * 0.45, M.P.dk), dt, 14); }
      // the books: those of an ending open
      for (const bk of M.books) bk.tgt = 0; if (M.end) for (const L of M.end.list) if (M.end.t > L.appear - 0.25 && !L.gone) { M.books[L.b].tgt = 1; M.books[L.b].lit = 1; }
      for (const bk of M.books) { bk.open = toward(bk.open, bk.tgt, dt, bk.tgt ? 3 : 1.6); if (bk.open < 0.02) bk.lit = 0; }
      // pages falling from the ring onto the floor, each becoming one of the unwritten
      for (let i = M.drops.length - 1; i >= 0; i--) { const d = M.drops[i]; d.t += dt; if (d.t >= d.dur) { M.drops.splice(i, 1); landDrop(FX, m, d); } }
      for (const s of M.splats) s.t += dt; while (M.splats.length && M.splats[0].t > 3.5) M.splats.shift();
      tendrils(FX, m, dt);
      // the Last Page: its plume boils, ink spitting from it
      if (M.P.boil > 0.3 && Math.random() < dt * 5) { const u = Math.random(), sd = Math.random() < 0.5 ? -1 : 1; FX.H.part({ kind: 'spark', x: lerp(M.fx, B[0], u) + sd * FX.rnd(0.8, 1.6), y: lerp(C.y + FOOT_Y, B[1], u) - lerp(0, B[2] - BH, u), vx: sd * FX.rnd(1, 3), vy: FX.rnd(-5, -2), g: 9, life: 0.7, max: 0.7, size: 3, color: Math.random() < 0.3 ? ROSE_HI : '#1A1626' }); }
      if (M.blast) M.blast.t += dt; },
    dmgK(FX, m) { const M = FX.mem; M.recoil = Math.max(M.recoil || 0, 0.45); return M.lp ? 0.3 : 0.85; },
    onWeakHit(FX) { FX.mem.recoil = 1; },
    // (it cannot fall while its last page runs, nor before the last page has been answered)
    holdOn(FX, m) { const M = FX.mem; return !!(M.lp && M.lp.st !== 'done') || !M.lpDone; },
    keep: { every: 2, pad: 2 },
    draw(c, FX, m, X, Y, T, t) { if (!(FX.S && FX.S.started)) { demoPaint(c, FX, m, X, Y, T, t); return; } const P3 = TN.cam(X, Y, T, m); paintAll(c, FX, m, P3, T); },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'knot') drawKnot(c, FX, o, X, Y, T, t); },
    drawFx(c, FX, T, t) { drawFx(c, FX, T, t); },
  };

  /* ---------- the fight's pieces ---------- */
  function say(FX, key, s, sub, col) { const M = FX.mem, first = !M.seen[key]; M.seen[key] = true; FX.H.banner(s, sub, col, first ? 2.2 : 1.2, true); }
  function at(M, dt, fn) { M.q.push({ at: M.qt + dt, fn }); M.q.sort((a, b) => a.at - b.at); }
  function endAct(m) { m.act = 'think'; m.actT = 0; }
  function inside(C, x, y, pad) { let dx = x - C.x, dy = y - C.y; for (let i = 0; i < 30 && !inOct(dx, dy, pad); i++) { dx *= 0.93; dy *= 0.93; } return { x: C.x + dx, y: C.y + dy }; }
  function minions(FX, types) { const C = FX.C, me = FX.me, alive = FX.H.mons.filter(q => !q.dead && q.fminion && !q.horde).length; types.slice(0, Math.max(0, 3 - alive)).forEach((ty, i) => { const a = Math.atan2(me.y - C.y, me.x - C.x) + Math.PI + (i - 0.5) * 1.1, p = inside(C, C.x + Math.cos(a) * 9, C.y + Math.sin(a) * 7, 2); FX.H.ring(p.x, p.y, 0.2, 1.6, 0.4, VIOLET_HI, 0.4); FX.H.sparks(p.x, p.y, VIOLET_HI, 10, 5); const q = FX.minion(ty, p.x, p.y); if (q) q.cd = 1.5; }); }
  function resetAll(FX, m) { const M = FX.mem; M.q.length = 0; FX.S.tele.length = 0; M.salv = null; if (M.end) finishEnding(FX); for (const tn of M.tend) { relTend(tn); tn.mode = 'rest'; tn.t = 0; } FX.untarget(false); m.act = 'think'; m.actT = 0; }
  function choose(FX, m) { const M = FX.mem, lv = FX.S.lv; m.actT = 0; let a = M.nextSig; M.nextSig = null;
    if (!a) { const cyc = lv >= 3 ? CYC3 : lv >= 2 ? CYC2 : CYC1; a = cyc[M.picks++ % cyc.length]; }
    if (a === 'sentence') return startSentence(FX, m); if (a === 'ending') return startEnding(FX, m); if (a === 'salvation') return startSalvation(FX, m); return startStab(FX, m); }
  /* where its brain is now: it drifts and bobs; spent, it sinks low over its plume and comes forward */
  function brainAt(FX) { const M = FX.mem, C = FX.C, P = M.P, k = 1 - P.sag; return [C.x + Math.sin(M.bt * 0.23) * 2.0 * k, C.y + lerp(BR_Y, SAG_Y, P.sag), lerp(BR_Z, SAG_Z, P.sag) + Math.sin(M.bt * 0.8) * 0.35 * k + (P.rec || 0) * 0.35 - (1 - P.wake) * 2.5]; }
  // its golden core, bared in the front lobe when it is spent
  function coreAt(FX) { const B = brainAt(FX); return [B[0], B[1] + BD * 0.85, B[2] - BH * 0.45]; }
  function easePose(FX, m, dt) { const M = FX.mem, P = M.P, e = FX.S.enterT || 0, low = m.stunT > 0 || !!M.lp;
    P.sag = toward(P.sag, low ? 1 : 0, dt, low ? 2.4 : 1.6); P.open = toward(P.open, m.stunT > 0 || (M.lp && M.lp.st === 'cast') ? 1 : 0, dt, 3); P.boil = toward(P.boil, M.lp ? 1 : 0, dt, 2);
    P.wake = toward(P.wake, m.act === 'enter' ? clamp((e - 0.3) / 1.6, 0, 1) : 1, dt, 3); P.rec = M.recoil; }
  /* the hit proxies on its body: the brain (high over the floor), its plume and the tendrils resting near the floor */
  function partsList(FX, m) { const M = FX.mem, C = FX.C, B = brainAt(FX), hit = (key, p, r) => ({ key, dx: p[0] - m.x, dy: p[1] - p[2] - m.y, r });
    const out = [hit('brain', B, 3.2), hit('lobeW', [B[0] - 2.7, B[1], B[2] - 0.8], 2.0), hit('lobeE', [B[0] + 2.7, B[1], B[2] - 0.8], 2.0), hit('foot', [M.fx, C.y + FOOT_Y, 0.6], 1.5), hit('plume', [lerp(M.fx, B[0], 0.45), lerp(C.y + FOOT_Y, B[1], 0.45), 2.6], 1.4)];
    M.tend.forEach((tn, k) => { const ok = tn.mode === 'rest' && tn.lift < 0.3; out.push(ok ? hit('t' + k, tn.tip, 1.0) : hit('t' + k, [M.fx, C.y + FOOT_Y, 0.6], 1.0)); });
    return out; }

  /* ---- the tendrils: where each tip goes for what it is doing, and its points from its root under the brain ---- */
  function freeTend(M, x, y) { return M.tend.filter(tn => tn.mode === 'rest').sort((a, b) => Math.hypot(a.tip[0] - x, a.tip[1] - y) - Math.hypot(b.tip[0] - x, b.tip[1] - y))[0] || null; }
  function relTend(tn) { if (tn.px) { tn.px.dead = true; tn.px = null; } }
  function stickTend(FX, tn, x, y, hold, light) { relTend(tn); tn.mode = 'stuck'; tn.t = 0; tn.hold = hold; tn.tip = [x, y, 0.3]; if (!light) tn.px = FX.obj({ kind: 'part', x, y, r: 1.0, hp: 1e12, forward: 1.4, front: true }); }
  function tendrils(FX, m, dt) { const M = FX.mem, B = brainAt(FX), bt = M.bt, P = M.P;
    for (const tn of M.tend) { const ph = TEND[tn.k].ph, co = Math.cos(ph), si = Math.sin(ph); tn.t += dt; let tgt = null, rate = 3, lift = 0;
      if (tn.mode === 'rest' || m.dead) { const sw = m.dead ? 0 : 1; tgt = [B[0] + co * (5.5 - P.sag * 1.4) + Math.sin(bt * 0.7 + tn.k * 1.3) * 0.5 * sw, B[1] + si * 3.0 + 1.0 + Math.cos(bt * 0.55 + tn.k) * 0.4 * sw, Math.max(0.45, 2.3 + 0.6 * Math.sin(bt * 0.9 + tn.k * 2) * sw - P.sag * 1.3 + P.boil * Math.sin(bt * 6 + tn.k) * 0.7)]; rate = m.dead ? 0.8 : 1.8; }
      else if (tn.mode === 'rear') { tgt = [tn.tx, tn.ty + 0.5, 6.3 + Math.sin(bt * 6 + tn.k) * 0.25]; lift = 1; rate = 5; }
      else if (tn.mode === 'stuck') { tgt = [tn.tip[0], tn.tip[1], 0.3]; lift = 0.25; rate = 20; if (tn.t > tn.hold) { relTend(tn); tn.mode = 'rest'; tn.t = 0; } }
      else if (tn.mode === 'write' || tn.mode === 'lash') { const u = clamp(tn.t / tn.dur, 0, 1); tgt = [lerp(tn.ax, tn.bx, u), lerp(tn.ay, tn.by, u), tn.mode === 'lash' ? 0.5 : 0.35]; lift = 0.55; rate = tn.t < 0 ? 7 : 26;
        if (tn.t > tn.dur + 0.15) { if (tn.mode === 'lash') stickTend(FX, tn, tn.bx, tn.by, 1.6); else { tn.mode = 'rest'; tn.t = 0; } } }
      if (tgt) for (let i = 0; i < 3; i++) tn.tip[i] = toward(tn.tip[i], tgt[i], dt, rate);
      tn.lift = toward(tn.lift, lift, dt, 6);
      const tw = (M.recoil * 0.5 + P.boil * 0.4) * (m.dead ? 0 : 1);
      const R0 = [B[0] + co * 1.8, B[1] + si * 1.2, B[2] - BH * 0.78], T3 = [tn.tip[0], tn.tip[1], tn.tip[2] + tw * 0.3];
      const P1 = [R0[0] + co * 2.5, R0[1] + si * 1.4, R0[2] - 0.9 + tn.lift * 1.4], P2 = [T3[0] + co * (1.7 - tn.lift * 0.9), T3[1] + si * 0.9, T3[2] + 2.3 + tn.lift * 1.8], n = 16, pts = [];
      for (let i = 0; i <= n; i++) { const u = i / n, a = (1 - u) ** 3, b = 3 * (1 - u) ** 2 * u, c2 = 3 * (1 - u) * u * u, d = u ** 3, wob = Math.sin(bt * 1.6 - u * 6 + tn.k * 2) * 0.22 * u * (1 - u) * 4 * (m.dead ? 0 : 1);
        pts.push([a * R0[0] + b * P1[0] + c2 * P2[0] + d * T3[0] - si * wob, a * R0[1] + b * P1[1] + c2 * P2[1] + d * T3[1] + co * wob, Math.max(0.2, a * R0[2] + b * P1[2] + c2 * P2[2] + d * T3[2])]); }
      tn.pts = pts; if (tn.px && !tn.px.dead) { tn.px.x = tn.tip[0]; tn.px.y = tn.tip[1] - tn.tip[2]; } } }
  function splat(FX, x, y, r) { const M = FX.mem; M.splats.push({ x, y, r, t: 0, seed: Math.random() * 99 }); if (M.splats.length > 14) M.splats.shift(); for (let i = 0; i < 8; i++) FX.H.part({ kind: 'spark', x: x + FX.rnd(-r, r) * 0.5, y: y - 0.2, vx: FX.rnd(-4, 4), vy: FX.rnd(-5, -2), g: 9, life: 0.6, max: 0.6, size: 3, color: '#1A1626' }); }

  /* ---- Quill Stabs: tendrils rear over shown circles and stab down; a lash along a shown line from its foot ---- */
  function startStab(FX, m) { const M = FX.mem, lv = FX.S.lv, n = lv >= 2 ? 3 : 2, lines = lv - 1, step = 0.5 / FX.S.fast; m.act = 'stab'; m.actT = 0; M.q.length = 0;
    for (let i = 0; i < n; i++) at(M, i * step, () => { if (m.act === 'stab') stabOne(FX, m, false); });
    for (let j = 0; j < lines; j++) at(M, n * step + 0.35 + j * 0.75, () => { if (m.act === 'stab') slashOne(FX, m); });
    M.actEnd = n * step + lines * 0.75 + 1.3 / FX.S.fast + 1.4; say(FX, 'stab', 'QUILL STABS', 'Its quills stab down on the shown circles: step out, then strike a stuck nib', ROSE_HI); }
  function stabOne(FX, m, light) { const M = FX.mem, me = FX.me, C = FX.C, tn = freeTend(M, me.x, me.y); if (!tn) return;
    const p = inside(C, me.x + (me.vx || 0) * 0.3, me.y + (me.vy || 0) * 0.3, 1.6), r = light ? 1.5 : 1.9, Wt = (light ? 1.3 : 1.1) / FX.S.fast;
    relTend(tn); Object.assign(tn, { mode: 'rear', t: 0, tx: p.x, ty: p.y }); FX.H.sfx.whoosh();
    FX.tele({ shape: 'circle', x: p.x, y: p.y, r, t: Wt, dmg: m.dmg * (light ? 0.55 : 1.35), col: TEL, ink: 'stab', fn: s => { M.stat.stabs++; if (FX.inShape(s, me.x, me.y, me.r)) M.stat.stabHit++; stickTend(FX, tn, s.x, s.y, light ? 1.2 : 1.9, light); splat(FX, s.x, s.y, r); FX.H.shake(5, 0.15); FX.H.sfx.thud();
      if (!M.seen.nib && !light) { M.seen.nib = true; FX.H.text(s.x, s.y - 1.8, 'The nib is stuck: strike it!', GOLD_HI, 13); } } }); }
  function slashOne(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, tn = freeTend(M, me.x, me.y); if (!tn) return;
    const O = [M.fx, C.y + FOOT_Y + 1.4], a = Math.atan2(me.y - O[1], me.x - O[0]) + FX.rnd(-0.1, 0.1), len = 34, w = 2.2, Wt = 1.3 / FX.S.fast;
    let e = 4; while (e < len && inOct(O[0] + Math.cos(a) * (e + 0.5) - C.x, O[1] + Math.sin(a) * (e + 0.5) - C.y, 1)) e += 0.5;
    relTend(tn); Object.assign(tn, { mode: 'rear', t: 0, tx: O[0] + Math.cos(a) * 3, ty: O[1] + Math.sin(a) * 3 }); FX.H.sfx.whoosh();
    FX.tele({ shape: 'line', x: O[0], y: O[1], a, len, w, t: Wt, dmg: m.dmg * 1.45, col: TEL, ink: 'slash', fn: s => { M.stat.slashes++; if (FX.inShape(s, me.x, me.y, me.r)) M.stat.slashHit++; Object.assign(tn, { mode: 'lash', t: 0, dur: 0.2, ax: O[0], ay: O[1], bx: O[0] + Math.cos(a) * e, by: O[1] + Math.sin(a) * e }); FX.H.shake(8, 0.25); FX.H.sfx.crash(); for (let k = 2; k < e; k += 3) splat(FX, O[0] + Math.cos(a) * k, O[1] + Math.sin(a) * k, 0.8); } }); }

  /* ---- Quill Sentence: three numbered lines written on the floor (in a shuffled order), striking 1, 2, 3 ---- */
  function startSentence(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, lv = FX.S.lv, f = FX.S.fast * (lv >= 3 ? 1.12 : 1); m.act = 'sentence'; m.actT = 0; M.q.length = 0; M.stat.sents++;
    // line 1 through the pet; 2 and 3 crossing the floor at other angles, a little off
    const a0 = Math.random() * Math.PI, defs = [[a0, me.x, me.y], [a0 + FX.rnd(0.85, 1.25), me.x + Math.cos(a0) * FX.rnd(3, 5), me.y + Math.sin(a0) * FX.rnd(3, 5)], [a0 - FX.rnd(0.85, 1.25), me.x - Math.cos(a0) * FX.rnd(3, 5), me.y - Math.sin(a0) * FX.rnd(3, 5)]];
    const order = [[1, 2, 0], [2, 0, 1], [1, 0, 2], [2, 1, 0]][Math.floor(Math.random() * 4)], T0 = 2.7 / f, gap = 1.05 / f, wr = 0.55 / f;
    defs.forEach(([a, px, py], k) => { const p = inside(C, px, py, 2), x = p.x - Math.cos(a) * 20, y = p.y - Math.sin(a) * 20, num = k + 1, wi = order.indexOf(k);
      // where the quill writes it: the part of it over the floor
      let u0 = 0, u1 = 40; while (u0 < 40 && !inOct(x + Math.cos(a) * u0 - C.x, y + Math.sin(a) * u0 - C.y, 0.6)) u0 += 0.5; u1 = u0; while (u1 < 40 && inOct(x + Math.cos(a) * u1 - C.x, y + Math.sin(a) * u1 - C.y, 0.6)) u1 += 0.5;
      const s = FX.tele({ shape: 'line', x, y, a, len: 40, w: 2.6, t: T0 + k * gap, dmg: m.dmg * 1.5, col: TEL, ink: 'line', num, wr: 0, u0, u1, fn: s2 => { M.stat.sentOrder.push(s2.num); if (FX.inShape(s2, me.x, me.y, me.r)) M.stat.sentHit++; else M.stat.sentSafe++; FX.H.shake(7, 0.2); FX.H.sfx.crash(); for (let q = u0 + 1; q < u1; q += 2.6) splat(FX, x + Math.cos(a) * q, y + Math.sin(a) * q, 0.9); } });
      at(M, wi * wr, () => { const tn = freeTend(M, x + Math.cos(a) * u0, y + Math.sin(a) * u0); if (tn) { relTend(tn); Object.assign(tn, { mode: 'write', t: -0.12, dur: wr * 0.9, ax: x + Math.cos(a) * u0, ay: y + Math.sin(a) * u0, bx: x + Math.cos(a) * u1, by: y + Math.sin(a) * u1 }); } s.writeAt = FX.S.t; s.writeDur = wr * 0.9; FX.H.sfx.whoosh(); }); });
    say(FX, 'sentence', 'QUILL SENTENCE', 'Three lines strike in their NUMBERED order: 1, then 2, then 3', GOLD_HI); }

  /* ---- Unwritten Ending: three books open, each projecting a version of it; break the real one's tether ---- */
  function startEnding(FX, m) { const M = FX.mem, C = FX.C, f = FX.S.fast; m.act = 'ending'; m.actT = 0; M.q.length = 0;
    const s = Math.floor(Math.random() * 8), idx = [s, (s + 3) % 8, (s + 5) % 8], ri = Math.floor(Math.random() * 3), kIn = (BOOK_R - 4.6) / BOOK_R, kK = (BOOK_R - 2.4) / BOOK_R;
    M.end = { st: 'open', t: 0, W: 12.5 / f, list: idx.map((b, i) => ({ b, i, real: i === ri, on: false, gone: false, a: 0, appear: 0.7 + i * 0.75, px: C.x + BOOKS[b].x * kIn, py: C.y + BOOKS[b].y * kIn, pz: 3.4, kx: C.x + BOOKS[b].x * kK, ky: C.y + BOOKS[b].y * kK, knot: null })) };
    M.stat.endings++; FX.H.sfx.hum();
    say(FX, 'ending', 'UNWRITTEN ENDING', 'Three books open, each with a version of it: break the tether of the one with the GOLD shadow', GOLD_HI); }
  function endingTick(FX, m, dt) { const M = FX.mem, E = M.end; if (!E) { endAct(m); return; } E.t += dt;
    for (const L of E.list) { if (E.st === 'open' && E.t > L.appear - 0.45) M.eyes[L.i].shut = 1;
      if (!L.on && E.t >= L.appear && E.st === 'open') { L.on = true; L.knot = FX.obj({ kind: 'knot', x: L.kx, y: L.ky, r: 0.95, hp: FX.S.barHP * TETH_K, real: L.real, onKill: () => knotBroken(FX, m, L) }); FX.H.ring(L.px, L.py, 0.3, 2.4, 0.45, L.real ? GOLD_HI : VIOLET_HI, 0.35); FX.H.sfx.whoosh(); }
      if (L.on) L.a = Math.min(1, L.a + dt * 2.2); }
    if (E.st === 'open' && E.t >= E.W) { E.st = 'strike'; E.t2 = 0; const me = FX.me, C = FX.C;
      FX.H.banner('THE ENDING IS WRITTEN', 'Too late: it lands on the whole archive', ROSE_HI, 2.2, true);
      FX.tele({ shape: 'fn', test: () => true, x: C.x, y: C.y, t: 1.4, dmg: m.dmg * 2.8, col: TEL, ink: 'major', fn: () => { M.stat.majors++; if (!me.dodge) M.stat.majorHit++; FX.H.boom(me.x, me.y, 3.2, ROSE, '#FFFFFF', { n: 30, shake: 16, smoke: 8 }); FX.H.flash(0.4, ROSE); FX.H.sfx.crash(); } }); }
    if (E.st === 'strike') { E.t2 += dt; for (const L of E.list) L.a = Math.max(0, L.a - dt * 0.8); if (E.t2 > 2.3) { finishEnding(FX); endAct(m); } } }
  function knotBroken(FX, m, L) { const M = FX.mem, E = M.end; if (!E || E.st !== 'open' || m.dead) return; L.knot = null;
    if (!L.real) { L.gone = true; M.stat.falseKnots++; FX.H.text(L.kx, L.ky - 1.6, 'A FALSE ENDING: find the gold shadow', VIOLET_HI, 13); FX.H.sparks(L.px, L.py - L.pz, VIOLET_HI, 14, 5); FX.H.sfx.wrong(); return; }
    M.stat.endingsBroken++; E.st = 'broken'; FX.H.boom(L.px, L.py - L.pz, 2.2, GOLD_HI, '#FFFFFF', { n: 26, shake: 12, smoke: 4 }); FX.H.sfx.crack();
    FX.H.banner('THE ENDING IS UNWRITTEN', 'Its tether cut, it reels: strike its golden core!', GOLD_HI, 2.4, true, true); finishEnding(FX); bare(FX, m, 'ending'); }
  function finishEnding(FX) { const M = FX.mem, E = M.end; if (!E) return; for (const L of E.list) { if (L.knot && !L.knot.dead) L.knot.dead = true; L.knot = null; } for (const e of M.eyes) e.shut = 0; M.end = null; }
  // a projection's place now: it drifts out of its book as it appears
  function projAt(FX, L) { const C = FX.C, B = BOOKS[L.b], u = smooth(L.a), bob = Math.sin(FX.mem.bt * 1.6 + L.i * 2) * 0.25; return [lerp(C.x + B.x, L.px, u), lerp(C.y + B.y, L.py, u), lerp(2.0, L.pz, u) + bob]; }

  /* ---- False Salvation: two shelters, one real (double gold ring, gold shadow), one decoy (dashed violet); a numbered line between ---- */
  function startSalvation(FX, m) { const M = FX.mem, me = FX.me, C = FX.C, f = FX.S.fast; m.act = 'salvation'; m.actT = 0; M.q.length = 0;
    const pick = (ok) => { for (let i = 0; i < 60; i++) { const a = Math.random() * TAU, d = 2 + Math.random() * 12, x = C.x + Math.cos(a) * d, y = C.y + Math.sin(a) * d; if (inOct(x - C.x, y - C.y, 3.4) && ok(x, y)) return { x, y }; } return null; };
    const R = pick((x, y) => { const d = Math.hypot(x - me.x, y - me.y); return d > 7 && d < 11; }) || inside(C, me.x + 8, me.y, 3.4);
    const CAST = 7.4 / f, a = Math.atan2(R.y - me.y, R.x - me.x) + Math.PI / 2, mx = (me.x + R.x) / 2, my = (me.y + R.y) / 2, x = mx - Math.cos(a) * 20, y = my - Math.sin(a) * 20;
    // (the decoy well away from the real one, from the pet, and off the numbered line)
    const offLine = (px, py) => Math.abs(-(px - mx) * Math.sin(a) + (py - my) * Math.cos(a)) > 4;
    const D = pick((px, py) => Math.hypot(px - R.x, py - R.y) > 9 && Math.hypot(px - me.x, py - me.y) > 5.5 && offLine(px, py)) || pick((px, py) => Math.hypot(px - R.x, py - R.y) > 8) || inside(C, 2 * C.x - R.x, 2 * C.y - R.y, 3.4);
    let u0 = 0; while (u0 < 40 && !inOct(x + Math.cos(a) * u0 - C.x, y + Math.sin(a) * u0 - C.y, 0.6)) u0 += 0.5; let u1 = u0; while (u1 < 40 && inOct(x + Math.cos(a) * u1 - C.x, y + Math.sin(a) * u1 - C.y, 0.6)) u1 += 0.5;
    M.salv = { t: 0, CAST, real: { x: R.x, y: R.y, r: 2.6 }, decoy: { x: D.x, y: D.y, r: 2.6 } }; M.stat.salvs++;
    const line = FX.tele({ shape: 'line', x, y, a, len: 40, w: 2.6, t: 3.0 / f, dmg: m.dmg * 1.5, col: TEL, ink: 'line', num: 1, wr: 0, u0, u1, salvLine: true, fn: s => { if (FX.inShape(s, me.x, me.y, me.r)) M.stat.salvLine++; FX.H.shake(7, 0.2); FX.H.sfx.crash(); for (let q = u0 + 1; q < u1; q += 2.6) splat(FX, x + Math.cos(a) * q, y + Math.sin(a) * q, 0.9); } });
    { const tn = freeTend(M, x, y); if (tn) { relTend(tn); Object.assign(tn, { mode: 'write', t: -0.12, dur: 0.5, ax: x + Math.cos(a) * u0, ay: y + Math.sin(a) * u0, bx: x + Math.cos(a) * u1, by: y + Math.sin(a) * u1 }); } line.writeAt = FX.S.t; line.writeDur = 0.5; }
    const Rs = M.salv.real, Ds = M.salv.decoy;
    FX.tele({ shape: 'fn', test: (px, py, rr) => Math.hypot(px - Rs.x, py - Rs.y) > Rs.r - (rr || 0) * 0.3, x: C.x, y: C.y, t: CAST, dmg: m.dmg * 2.5, col: TEL, ink: 'salv', fn: () => { const inR = Math.hypot(me.x - Rs.x, me.y - Rs.y) <= Rs.r - me.r * 0.3, inD = Math.hypot(me.x - Ds.x, me.y - Ds.y) <= Ds.r;
      if (inR) M.stat.salvSafe++; else if (inD) M.stat.salvDecoy++; else M.stat.salvHit++; FX.H.flash(0.35, VIOLET_HI); FX.H.shake(14, 0.5); FX.H.sfx.crash(); FX.H.boom(Ds.x, Ds.y, 2.6, VIOLET_HI, '#FFFFFF', { n: 24, shake: 0, smoke: 6 });
      FX.H.text(Rs.x, Rs.y - 2.2, inR ? 'The true shelter holds' : 'A false salvation!', inR ? GOLD_HI : ROSE_HI, 14); } });
    say(FX, 'salvation', 'FALSE SALVATION', 'Reach the shelter with the DOUBLE GOLD ring and gold shadow; the dashed violet one is a lie. Mind line 1!', GOLD_HI); }

  /* ---- The Unwritten: its pages spill the rift's brood onto the floor; it cannot be struck until they are gone ---- */
  function startHorde(FX, m) { const M = FX.mem; resetAll(FX, m); m.act = 'horde'; m.actT = 0; FX.untarget(true); M.recoil = 1; FX.H.shake(12, 0.8); FX.H.flash(0.3, VIOLET_HI); FX.H.sfx.hum();
    M.hd = { left: HORDE, list: [], pending: 0, acc: 0, n: 0, stabT: 3.2 };
    FX.H.banner('THE UNWRITTEN POUR OUT', 'Its pages spill everything it never wrote: clear them all', VIOLET_HI, 3, true, true); }
  function pageAt(FX, k) { const M = FX.mem, B = brainAt(FX), th = M.ringA + k * TAU / 4; return [B[0] + Math.cos(th) * RING_R, B[1] + RING_DY, B[2] + 0.3 + Math.sin(th) * RING_R]; }
  function pourOne(FX, m) { const M = FX.mem, H2 = M.hd, C = FX.C, me = FX.me; let x = C.x, y = C.y;
    for (let k = 0; k < 12; k++) { const a = Math.random() * TAU, d = Math.sqrt(Math.random()) * 14; x = C.x + Math.cos(a) * d; y = C.y + Math.sin(a) * d; if (inOct(x - C.x, y - C.y, 1.6) && Math.hypot(x - me.x, y - me.y) > 3.2 && y - C.y > -11) break; }
    let r = Math.random() * 100, type = HORDE_MIX[0][0]; for (const [ty, w] of HORDE_MIX) { if (r < w) { type = ty; break; } r -= w; }
    const P0 = pageAt(FX, Math.floor(Math.random() * 4)); M.drops.push({ x0: P0[0], y0: P0[1], z0: P0[2], x1: x, y1: y, t: 0, dur: 0.75 + Math.random() * 0.35, h: 2 + Math.random() * 3, type, rot: Math.random() * TAU }); H2.pending++; H2.left--; }
  function landDrop(FX, m, d) { const M = FX.mem, H2 = M.hd; if (!H2) return; H2.pending--; if (m.dead) return; FX.H.ring(d.x1, d.y1, 0.1, 1.0, 0.25, VIOLET_HI, 0.3);
    const q = FX.minion(d.type, d.x1, d.y1); if (!q) return; q.horde = true; q.hp = q.maxhp = Math.max(30, Math.round(q.maxhp * 0.28)); q.xp = Math.max(1, Math.round((q.xp || 3) * 0.3)); q.coin = 0; q.cd = 1.0 + Math.random(); H2.list.push(q); H2.n++; M.stat.poured++; }
  function hordeTick(FX, m, dt) { const M = FX.mem, H2 = M.hd; if (!H2) { endAct(m); return; } m.noTouch = true; m.under = true;
    H2.list = H2.list.filter(q => !q.dead);
    H2.acc = Math.min(4, H2.acc + dt * (H2.n < 30 ? 14 : 8));
    while (H2.acc >= 1 && H2.left > 0 && H2.list.length + H2.pending < HORDE_CAP) { H2.acc -= 1; pourOne(FX, m); }
    H2.stabT -= dt; if (H2.stabT <= 0) { H2.stabT = 3.4; stabOne(FX, m, true); }
    if (H2.left === 0 && H2.pending === 0 && H2.list.length === 0) { M.hd = null; M.hdDone = true; FX.untarget(false); FX.S.tele.length = 0; FX.H.sfx.fanfare && FX.H.sfx.fanfare(); bare(FX, m, 'horde'); } }
  function bare(FX, m, why) { const M = FX.mem; m.act = 'think'; m.actT = 0; M.q.length = 0; m.stunT = why === 'torn' ? 9 : why === 'horde' ? 7 : 5.5; M.why = why; M.stat.bared++; FX.untarget(false); M.recoil = 0;
    for (const tn of M.tend) { relTend(tn); tn.mode = 'rest'; } FX.H.shake(14, 0.6); FX.H.flash(0.3, GOLD_HI); FX.H.sfx.crash();
    if (why === 'horde') FX.H.banner('IT IS EMPTIED', 'Its pages spent, it sags low: strike its golden core!', GOLD_HI, 2.4, true, true); }

  /* ---- The Last Page: it stops and begins to unmake itself; break its ward before the countdown ends, or every pet falls ---- */
  function startLastPage(FX, m) { const M = FX.mem; resetAll(FX, m); m.act = 'lastpage'; m.actT = 0; M.stat.lpStarts++;
    M.lp = { st: 'sink', t: 0, T: LP_T, ward: FX.S.barHP * WARD_K, max: FX.S.barHP * WARD_K, hp0: m.hp, dealt: 0, stabT: 3, tick: LP_T };
    FX.H.shake(16, 1.0); FX.H.flash(0.4, ROSE); FX.H.sfx.hum();
    FX.H.banner('THE LAST PAGE', 'It is unmaking itself, and you with it: break its ward before the page ends!', ROSE_HI, 3.2, true, true); }
  function lastPageTick(FX, m, dt) { const M = FX.mem, L = M.lp; if (!L) { endAct(m); return; } L.t += dt; m.noTouch = true;
    if (L.st === 'sink') { if (L.t > 1.6) { L.st = 'cast'; L.t = 0; FX.H.sfx.crack(); } return; }
    if (L.st === 'cast') { const cp = coreAt(FX); FX.weak('core', cp[0], cp[1] - cp[2], 2.5, 2.5, true);
      const left = L.T - L.t; if (Math.ceil(left) < L.tick) { L.tick = Math.ceil(left); FX.H.sfx.blip && FX.H.sfx.blip(); if (L.tick <= 5) FX.H.shake(3 + (5 - L.tick), 0.15); }
      L.stabT -= dt; if (L.stabT <= 0) { L.stabT = 3.2; stabOne(FX, m, true); }
      if (L.ward <= 0) return tearPage(FX, m);
      if (L.t >= L.T) { L.st = 'blow'; L.t = 0; FX.weak('core', 0, 0, 0, 0, false); FX.S.tele.length = 0; M.stat.lpFailed++; FX.H.banner('THE LAST PAGE IS WRITTEN', 'Its ward held: it detonates', ROSE_HI, 2, true, true); FX.H.sfx.hum(); }
      return; }
    if (L.st === 'blow') { FX.H.shake(4 + L.t * 8, 0.1); if (Math.random() < dt * 20) { const B = brainAt(FX); FX.H.sparks(B[0] + FX.rnd(-4, 4), B[1] - B[2] + FX.rnd(-3, 3), ROSE_HI, 4, 6); }
      if (L.t >= 1.7) { L.st = 'done'; const C = FX.C, B = brainAt(FX); FX.H.flash(1, '#FFFFFF'); FX.H.shake(30, 1.2); FX.H.sfx.crash();
        for (let i = 0; i < 10; i++) FX.H.after(i * 0.08, () => FX.H.boom(C.x + FX.rnd(-12, 12), C.y + FX.rnd(-12, 10), 3.5, i % 2 ? ROSE : '#1A1626', '#FFFFFF', { n: 30, shake: 18, smoke: 10 }));
        FX.H.boom(B[0], B[1] - B[2], 7, '#FFFFFF', ROSE_HI, { n: 60, shake: 30, smoke: 16 });
        M.blast = { t: 0, x: B[0], y: B[1] - B[2] }; M.stat.wiped++; if (FX.H.wipeParty) FX.H.wipeParty('The Last Page detonated: every pet is knocked out'); } } }
  function tearPage(FX, m) { const M = FX.mem, L = M.lp; L.st = 'done'; M.lp = null; M.lpDone = true; M.stat.lpPassed++; FX.weak('core', 0, 0, 0, 0, false);
    m.hp = Math.min(L.hp0, m.maxhp * 0.06); const B = brainAt(FX); FX.H.boom(B[0], B[1] - B[2], 5, GOLD_HI, '#FFFFFF', { n: 50, shake: 22, smoke: 10 }); FX.H.flash(0.6, GOLD_HI);
    for (let i = 0; i < 24; i++) FX.H.part({ kind: 'spark', x: B[0] + FX.rnd(-3, 3), y: B[1] - B[2] + FX.rnd(-2, 2), vx: FX.rnd(-6, 6), vy: FX.rnd(-7, -1), g: 6, life: 1.4, max: 1.4, size: 5, color: Math.random() < 0.5 ? PARCH_HI : GOLD_HI });
    FX.H.banner('THE LAST PAGE IS TORN', 'Its ward broken, it collapses: finish it!', GOLD_HI, 2.8, true, true); bare(FX, m, 'torn'); }

  /* ---- fallen: its eyes close, it sinks and comes apart into ink and pages; the model of Gaia lights seven points ---- */
  function deadTick(FX, m, dt) { const M = FX.mem, P = M.P, C = FX.C;
    if (M.deadT == null) { M.deadT = 0; M.end = null; M.salv = null; M.lp = null; M.hd = null; M.q.length = 0; M.drops.length = 0; for (const tn of M.tend) { relTend(tn); tn.mode = 'rest'; } }
    M.deadT += dt; P.sag = toward(P.sag, 1, dt, 0.9); P.open = toward(P.open, 0, dt, 2); P.boil = toward(P.boil, 0, dt, 2); P.dk = toward(P.dk, 1, dt, 0.8); P.alpha = clamp(1 - (M.deadT - 0.8) / 2.6, 0, 1);
    for (const e of M.eyes) e.b = toward(e.b, 1, dt, 4);
    const B = brainAt(FX); if (P.alpha > 0.05 && Math.random() < dt * 30) { const a = Math.random() * TAU; FX.H.part({ kind: Math.random() < 0.5 ? 'smoke' : 'spark', x: B[0] + Math.cos(a) * BW * 0.8, y: B[1] - B[2] + Math.sin(a) * BH * 0.8, vx: FX.rnd(-1, 1), vy: FX.rnd(-2, 0.5), g: 2, drag: 0.6, life: 1.2, max: 1.2, size: 2 + Math.random() * 2, color: Math.random() < 0.5 ? '#1A1626' : PARCH_HI }); }
    const lit = Math.min(7, Math.floor(Math.max(0, M.deadT - 1.4) / 0.35)); if (lit > (M.lit || 0)) { M.lit = lit; const G = gaiaAt(FX); FX.H.sparks(G[0], G[1] - G[2], GOLD_HI, 8, 3); FX.H.sfx.chime && FX.H.sfx.chime(); }
    tendrils(FX, m, dt); void C; }

  /* ---------- the painting ---------- */
  function gaiaAt(FX) { const B = brainAt(FX), M = FX.mem; return [B[0], B[1] - 2.2, Math.max(4, B[2]) + 3.75 + Math.sin(M.bt * 0.5) * 0.15]; }
  function paintAll(c, FX, m, P3, T) { const M = FX.mem, C = FX.C, P = M.P, lw = Math.max(1.2, T * 0.075), B = brainAt(FX);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    paintGaia(c, FX, P3, T, lw);
    c.globalAlpha = P.alpha;
    paintRing(c, FX, P3, T, lw, B);
    const back = [], front = []; M.tend.forEach(tn => { if (tn.lift >= 0.15 && !m.dead) return; (Math.sin(TEND[tn.k].ph) < 0 ? back : front).push(tn); });
    for (const tn of back) paintTendril(c, P3, T, tn, lw, P);
    paintPlume(c, FX, P3, T, lw, B);
    for (const tn of front) paintTendril(c, P3, T, tn, lw, P);
    const Bs = P3(B[0], B[1], B[2]), sq = 1 - (M.recoil || 0) * 0.05;
    paintBrain(c, Bs[0], Bs[1], T, { roll: M.roll, kx: 1 + (M.recoil || 0) * 0.02 + P.boil * Math.sin(M.bt * 9) * 0.015, kw: sq, eyes: M.eyes, look: M.look, open: P.open, boil: P.boil, lw, bt: M.bt, dk: P.dk });
    // its projections, out of the books
    if (M.end && !m.dead) for (const L of M.end.list) if (L.on && !L.gone && L.a > 0.02) paintProjection(c, FX, P3, T, L, lw);
    c.restore(); }
  /* the brain: five lobes (back to front), their grooves, the three eyes; when spent its front lobe parts on the core */
  function lobePts(L, Q, k) { const pts = [], co = Math.cos(L.rot), si = Math.sin(L.rot); for (let i = 0; i < 18; i++) { const th = i / 18 * TAU, rr = (1 + 0.045 * Math.sin(3 * th + L.ph) + 0.03 * Math.sin(5 * th + L.ph * 2)) * (k || 1), lu = Math.cos(th) * L.ru * rr, lw = Math.sin(th) * L.rw * rr; pts.push(Q(L.u + lu * co - lw * si, L.w + lu * si + lw * co)); } return pts; }
  function lobeAt(L, nx, ny, Q) { const co = Math.cos(L.rot), si = Math.sin(L.rot), lu = nx * L.ru, lw = ny * L.rw; return Q(L.u + lu * co - lw * si, L.w + lu * si + lw * co); }
  function paintBrain(c, cx, cy, s, o) { const roll = o.roll || 0, cr = Math.cos(roll), sr = Math.sin(roll), kx = o.kx || 1, kw = o.kw || 1, lw = o.lw || Math.max(1.2, s * 0.075), open = o.open || 0;
    const Q = (u, w) => { const a = u * kx, b = w * kw; return [cx + (a * cr - b * sr) * s, cy - (a * sr + b * cr) * s]; };
    const dk = o.dk || 0, tint = col => dk > 0.01 ? K.mixC(col, '#3A3448', dk * 0.55) : col;
    if (o.ghost) { c.save(); c.setLineDash([s * 0.32, s * 0.22]); c.lineDashOffset = -(o.bt || 0) * s * 0.8; c.lineWidth = Math.max(1.5, s * 0.1); c.strokeStyle = VIOLET_HI; c.fillStyle = 'rgba(205,180,255,.08)';
      LOBES.forEach(L => { const pts = lobePts(L, Q); c.beginPath(); TN.blob(pts)(c); c.fill(); c.stroke(); });
      EYES.forEach(E => { const p = lobeAt(LOBES[E[0]], E[1], E[2], Q); c.beginPath(); c.ellipse(p[0], p[1], E[3] * s, E[3] * s * E[4], E[6], 0, TAU); c.stroke(); }); c.restore(); return; }
    // a soft gold-violet aura behind it
    K.glow(c, cx, cy, s * 6.5, o.boil > 0.3 ? ROSE : '#B89CFF', (0.18 + (o.boil || 0) * 0.25) * (1 - dk));
    LOBES.forEach((L, li) => {
      const paintLobe = () => { const pts = lobePts(L, Q), r = Math.min(L.ru, L.rw) * s;
        TN.shape(c, TN.blob(pts), { col: tint(IVORY), shade: tint(IVORY_SH), shade2: tint(IVORY_DK), hi: tint(IVORY_HI), line: INK2, lw, r, d1: 0.12, d2: 0.2, force: true, spec: 0.55 * (1 - dk), specAt: lobeAt(L, -0.42, 0.5, Q), specR: 0.28,
          inner: c2 => { for (const g of GROOVES[li]) { const p = g.map(([x, y]) => lobeAt(L, x, y, Q)); c2.lineCap = 'round'; c2.strokeStyle = tint(GROOVE_DK); c2.lineWidth = s * 0.24; c2.beginPath(); c2.moveTo(p[0][0], p[0][1]); c2.quadraticCurveTo(p[1][0], p[1][1], p[2][0], p[2][1]); c2.stroke(); c2.strokeStyle = tint(GROOVE); c2.lineWidth = s * 0.15; c2.stroke();
              c2.strokeStyle = 'rgba(255,250,236,.75)'; c2.lineWidth = s * 0.05; c2.beginPath(); c2.moveTo(p[0][0] - s * 0.08, p[0][1] - s * 0.12); c2.quadraticCurveTo(p[1][0] - s * 0.08, p[1][1] - s * 0.12, p[2][0] - s * 0.08, p[2][1] - s * 0.12); c2.stroke(); } } }); };
      if (li === 4 && open > 0.02) {
        // the front lobe parts: its golden core, bared
        const cc = Q(L.u, L.w - 0.05), rC = 1.3 * s * (0.6 + 0.4 * open), pu = 0.5 + 0.5 * Math.sin((o.bt || 0) * 7);
        K.glow(c, cc[0], cc[1], rC * 3.2, GOLD_HI, 0.55 * open);
        TN.shape(c, TN.ell(cc[0], cc[1], rC, rC * 0.9), { col: '#F6C452', shade: '#D49A2E', shade2: '#A8701E', hi: '#FFF2B8', line: '#5A3A10', lw, r: rC, force: true, spec: 0.9, specAt: [cc[0] - rC * 0.35, cc[1] - rC * 0.4] });
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.4 * pu; K.glow(c, cc[0], cc[1], rC * 1.3, '#FFFFFF', 0.6); c.restore();
        c.strokeStyle = INK2; c.lineWidth = Math.max(2, s * 0.14); c.beginPath(); c.moveTo(cc[0] - rC * 0.45, cc[1] + rC * 0.35); c.quadraticCurveTo(cc[0], cc[1] - rC * 0.55, cc[0] + rC * 0.42, cc[1] + rC * 0.3); c.moveTo(cc[0], cc[1] - rC * 0.1); c.lineTo(cc[0], cc[1] + rC * 0.45); c.stroke();
        for (const sd of [-1, 1]) { c.save(); c.translate(sd * s * 1.45 * open, s * 0.3 * open); c.beginPath(); const mid = Q(L.u, L.w); c.rect(sd < 0 ? mid[0] - s * 5 : mid[0], mid[1] - s * 5, s * 5, s * 10); c.clip(); paintLobe();
          c.strokeStyle = '#8A2E52'; c.lineWidth = s * 0.16; c.beginPath(); const a = Q(L.u, L.w + L.rw * 0.95), b = Q(L.u, L.w - L.rw * 0.95); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); c.restore(); }
      } else paintLobe();
      // the deep fissure between the two crown lobes
      if (li === 1) { const a = Q(0, 2.45), b = Q(0.05, 1.1), d = Q(0, 0.1); c.strokeStyle = INK2; c.lineWidth = s * 0.2; c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(b[0], b[1], d[0], d[1]); c.stroke(); c.strokeStyle = tint(GROOVE); c.lineWidth = s * 0.09; c.stroke(); }
    });
    // the three mismatched gold eyes
    EYES.forEach((E, i) => { const e = o.eyes ? o.eyes[i] : { b: 0 }, p = lobeAt(LOBES[E[0]], E[1], E[2], Q), r = E[3] * s;
      c.fillStyle = tint(GROOVE_DK); c.beginPath(); c.ellipse(p[0], p[1] + r * 0.05, r * 1.22, r * E[4] * 1.3, E[6], 0, TAU); c.fill();
      K.glow(c, p[0], p[1], r * 2.4, IRIS, 0.35 * (1 - e.b) * (1 - dk));
      TN.eye(c, p[0], p[1], r, { iris: dk > 0.5 ? '#8A7A5A' : IRIS, look: o.look || [0, 0], blink: e.b, lid: tint(IVORY_SH), line: INK2, white: '#FFF4DA', squash: E[4], slit: E[5], rot: E[6], irisR: i === 2 ? 0.74 : 0.62, pupilR: i === 0 ? 0.42 : 0.5 }); }); }
  /* the ink plume: from under the brain tapering to the floor, where it pools; it boils on the last page */
  function paintPlume(c, FX, P3, T, lw, B) { const M = FX.mem, C = FX.C, P = M.P, bt = M.bt, n = 14, pts = [], top = [B[0], B[1] + 0.3, B[2] - BH * 0.7], foot = [M.fx, C.y + FOOT_Y, 0];
    const F = P3(foot[0], foot[1], 0);
    // the pool at its foot
    { const rx = (2.6 + P.boil * 0.8) * T, ry = rx * 0.42; c.fillStyle = '#0E0B16'; c.beginPath(); c.ellipse(F[0], F[1], rx, ry, 0, 0, TAU); c.fill(); c.strokeStyle = 'rgba(140,110,210,.35)'; c.lineWidth = Math.max(1, T * 0.06); for (let k = 0; k < 2; k++) { const u = ((bt * 0.5 + k * 0.5) % 1); c.globalAlpha = (1 - u) * P.alpha; c.beginPath(); c.ellipse(F[0], F[1], rx * (0.5 + u * 0.7), ry * (0.5 + u * 0.7), 0, 0, TAU); c.stroke(); } c.globalAlpha = P.alpha;
      c.fillStyle = 'rgba(200,180,255,.22)'; c.beginPath(); c.ellipse(F[0] - rx * 0.3, F[1] - ry * 0.25, rx * 0.35, ry * 0.25, 0, 0, TAU); c.fill(); }
    if (P.dk > 0.6) return;
    for (let i = 0; i <= n; i++) { const u = i / n, x = lerp(top[0], foot[0], u) + Math.sin(bt * 1.8 - u * 5) * 0.28 * u + P.boil * Math.sin(bt * 11 + u * 9) * 0.25, y = lerp(top[1], foot[1], u), z = lerp(top[2], 0, u); pts.push(P3(x, y, z)); }
    const wf = u => T * ((u < 0.86 ? lerp(3.3, 0.95, Math.pow(u / 0.86, 0.7)) : lerp(0.95, 2.4, (u - 0.86) / 0.14)) * (1 + P.boil * 0.22 * Math.sin(bt * 9 + u * 7)) * (1 - P.dk * 0.6));
    TN.tube(c, pts, wf, { col: PLUME, shade: '#13101C', shade2: '#0A0812', hi: '#5C4A86', line: '#05040A', lw, r: T * 1.3, force: true, glowCol: P.boil > 0.05 ? ROSE : null, glowA: 0.45 * P.boil,
      inner: c2 => { c2.lineCap = 'round'; for (let k = 0; k < 5; k++) { const ph = ((bt * (0.35 + k * 0.07) + k * 0.23) % 1), i0 = Math.floor(ph * (n - 3)), p0 = pts[i0], p1 = pts[Math.min(n, i0 + 3)], off = (k - 2) * T * 0.42 * (1 - ph * 0.6); c2.strokeStyle = `rgba(170,140,240,${0.32 * Math.sin(ph * Math.PI)})`; c2.lineWidth = T * 0.14; c2.beginPath(); c2.moveTo(p0[0] + off, p0[1]); c2.quadraticCurveTo((p0[0] + p1[0]) / 2 + off * 1.2, (p0[1] + p1[1]) / 2, p1[0] + off * 0.8, p1[1]); c2.stroke(); } } });
    // bubbles boiling off its sides
    if (P.boil > 0.05) for (let k = 0; k < 10; k++) { const u = ((bt * 0.6 + k * 0.137) % 1), i0 = Math.floor(u * n), p = pts[i0], sd = k % 2 ? 1 : -1, w = wf(i0 / n) * 0.5, r = T * (0.18 + (k % 3) * 0.1) * P.boil; c.fillStyle = '#1A1626'; c.beginPath(); c.arc(p[0] + sd * w, p[1], r, 0, TAU); c.fill(); c.strokeStyle = ROSE_HI; c.lineWidth = Math.max(1, T * 0.04); c.stroke(); } }
  /* a tendril: a thick ink tube, curling, ending in a flattened quill nib */
  function paintTendril(c, P3, T, tn, lw, P) { if (!tn.pts) return; const sp = tn.pts.map(p => P3(p[0], p[1], p[2])), n = sp.length - 1, w0 = 1.0 * T * (1 - (P ? P.dk : 0) * 0.3);
    TN.tubeLite(c, sp, u => w0 * (1 - u * 0.58), { col: PLUME, shade: '#13101C', shade2: '#0A0812', hi: '#5A4A84', line: '#05040A', lw, r: w0 * 0.8, force: true });
    // a few gold rings along it
    for (const u of [0.45, 0.62]) { const i = Math.round(u * n), p = sp[i], q = sp[Math.min(n, i + 1)], a = Math.atan2(q[1] - p[1], q[0] - p[0]), w = w0 * (1 - u * 0.58); c.save(); c.translate(p[0], p[1]); c.rotate(a); c.fillStyle = GOLD; c.strokeStyle = INK2; c.lineWidth = lw * 0.7; c.beginPath(); c.rect(-T * 0.08, -w / 2, T * 0.16, w); c.fill(); c.stroke(); c.restore(); }
    nib(c, sp[n - 1], sp[n], T, lw); }
  function nib(c, a, b, T, lw) { const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = T * 1.25, W = T * 0.62; c.save(); c.translate(b[0], b[1]); c.rotate(ang);
    const path = cc => { cc.moveTo(-T * 0.1, -W * 0.5); cc.quadraticCurveTo(L * 0.25, -W * 0.62, L * 0.62, -W * 0.22); cc.lineTo(L, 0); cc.lineTo(L * 0.62, W * 0.22); cc.quadraticCurveTo(L * 0.25, W * 0.62, -T * 0.1, W * 0.5); cc.quadraticCurveTo(-T * 0.32, 0, -T * 0.1, -W * 0.5); };
    TN.shape(c, path, { col: GOLD, shade: '#A07A32', shade2: '#7A5A22', hi: GOLD_HI, line: INK2, lw, r: W * 0.6, force: true });
    c.fillStyle = INK2; c.beginPath(); c.moveTo(L * 0.72, -W * 0.16); c.lineTo(L, 0); c.lineTo(L * 0.72, W * 0.16); c.closePath(); c.fill();
    c.strokeStyle = INK2; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(L * 0.3, 0); c.lineTo(L * 0.95, 0); c.stroke(); c.fillStyle = INK2; c.beginPath(); c.arc(L * 0.28, 0, T * 0.07, 0, TAU); c.fill(); c.restore(); }
  /* the broken ring of four enormous pages behind it, each with one great black symbol */
  function paintRing(c, FX, P3, T, lw, B) { const M = FX.mem, P = M.P, bt = M.bt, Rc = P3(B[0], B[1] + RING_DY, B[2] + 0.3), R = RING_R * T;
    const scr = th => [Rc[0] + Math.cos(th) * R, Rc[1] - Math.sin(th) * R];
    // the ring's band: gold arcs between the pages, two of them broken
    for (let k = 0; k < 4; k++) { const a0 = M.ringA + k * TAU / 4 + 0.42, a1 = M.ringA + (k + 1) * TAU / 4 - 0.42, segs = k % 2 ? [[a0, (a0 + a1) / 2 - 0.1], [(a0 + a1) / 2 + 0.13, a1]] : [[a0, a1]];
      for (const [s0, s1] of segs) { c.beginPath(); c.arc(Rc[0], Rc[1], R, -s1, -s0); c.strokeStyle = INK2; c.lineWidth = T * 0.5; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.32; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.08; c.beginPath(); c.arc(Rc[0], Rc[1], R - T * 0.08, -s1, -s0); c.stroke(); }
      if (k % 2) { const m0 = (a0 + a1) / 2; for (const [aa, sd] of [[m0 - 0.1, 1], [m0 + 0.13, -1]]) { const p = scr(aa); c.fillStyle = GOLD; c.strokeStyle = INK2; c.lineWidth = lw * 0.7; c.beginPath(); c.moveTo(p[0] - T * 0.2, p[1] - T * 0.2); c.lineTo(p[0] + sd * T * 0.25, p[1] + T * 0.05); c.lineTo(p[0] + T * 0.15, p[1] + T * 0.25); c.closePath(); c.fill(); c.stroke(); } } }
    // the pages
    const glowK = (M.hd ? 1 : 0) + P.boil * 0.6;
    for (let k = 0; k < 4; k++) { const th = M.ringA + k * TAU / 4, p0 = scr(th), p = [p0[0], p0[1] + P.dk * P.dk * T * (3 + k * 1.5)], rot = Math.PI / 2 - th + P.dk * (k % 2 ? 0.6 : -0.5), flut = 0.86 + 0.14 * Math.cos(bt * 0.9 + k * 1.7), w = 3.0 * T * flut, h = 3.9 * T;
      c.save(); c.translate(p[0], p[1]); c.rotate(rot);
      if (glowK > 0) K.glow(c, 0, 0, h * 0.9, VIOLET_HI, 0.35 * glowK);
      const path = cc => { cc.moveTo(-w / 2, -h / 2 + T * 0.15); cc.quadraticCurveTo(0, -h / 2 - T * 0.25, w / 2, -h / 2 + T * 0.1); cc.lineTo(w / 2 - T * 0.05, h / 2 - T * 0.6); cc.lineTo(w / 2 - T * 0.55, h / 2); cc.quadraticCurveTo(0, h / 2 + T * 0.2, -w / 2, h / 2 - T * 0.1); cc.closePath(); };
      TN.shape(c, path, { col: PARCH, shade: PARCH_D, shade2: '#B09A72', hi: PARCH_HI, line: INK2, lw, r: w * 0.4, force: true, d1: 0.08, d2: 0.12,
        inner: c2 => { c2.strokeStyle = 'rgba(207,173,98,.85)'; c2.lineWidth = Math.max(1, T * 0.07); c2.strokeRect(-w / 2 + T * 0.28, -h / 2 + T * 0.32, w - T * 0.56, h - T * 0.7); c2.strokeStyle = 'rgba(40,30,40,.22)'; c2.lineWidth = Math.max(1, T * 0.05); c2.beginPath(); for (let i = 0; i < 4; i++) { const y = h / 2 - T * (0.65 + i * 0.22); c2.moveTo(-w / 2 + T * 0.5, y); c2.lineTo(w / 2 - T * (0.6 + (i % 2) * 0.5), y); } c2.stroke(); } });
      // the folded corner
      c.fillStyle = PARCH_D; c.strokeStyle = INK2; c.lineWidth = lw * 0.8; c.beginPath(); c.moveTo(w / 2 - T * 0.05, h / 2 - T * 0.6); c.lineTo(w / 2 - T * 0.6, h / 2 - T * 0.5); c.lineTo(w / 2 - T * 0.55, h / 2); c.closePath(); c.fill(); c.stroke();
      symbol(c, k, 0, -T * 0.2, T * 1.0, M.hd ? VIOLET : INK2, T);
      c.restore(); } }
  function symbol(c, k, x, y, s, col, T) { c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = Math.max(2, s * 0.22);
    if (k === 0) { c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * 0.85, s, 0); c.quadraticCurveTo(0, s * 0.85, -s, 0); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill(); for (const a of [-0.9, -1.57, -2.2]) { c.beginPath(); c.moveTo(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62); c.lineTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.95); c.stroke(); } }
    else if (k === 1) { c.beginPath(); for (let i = 0; i <= 40; i++) { const u = i / 40, a = u * TAU * 2.4, r = s * (0.08 + u * 0.9); i ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r) : c.moveTo(Math.cos(a) * r, Math.sin(a) * r); } c.stroke(); }
    else if (k === 2) { c.beginPath(); for (const xx of [-0.55, 0, 0.55]) { c.moveTo(xx * s, -s * (xx ? 0.7 : 0.95)); c.lineTo(xx * s, s * 0.15); } c.moveTo(-s * 0.55, s * 0.15); c.quadraticCurveTo(0, s * 0.95, s * 0.55, s * 0.15); c.stroke(); c.beginPath(); c.arc(0, s * 0.5, s * 0.14, 0, TAU); c.fill(); }
    else { c.beginPath(); c.arc(0, -s * 0.48, s * 0.36, 0, TAU); c.moveTo(0, -s * 0.12); c.lineTo(0, s * 0.95); c.moveTo(-s * 0.55, s * 0.22); c.lineTo(s * 0.55, s * 0.22); c.moveTo(0, s * 0.62); c.lineTo(s * 0.3, s * 0.62); c.stroke(); }
    c.restore(); void T; }
  /* the model of Gaia in its glassless gilded frame */
  function paintGaia(c, FX, P3, T, lw) { const M = FX.mem, G = gaiaAt(FX), p = P3(G[0], G[1], G[2]), r = 1.05 * T, rot = M.bt * 0.35;
    // the frame: a gilded ring on a little stand, and a tilted meridian
    c.strokeStyle = INK2; c.lineWidth = T * 0.34; c.beginPath(); c.moveTo(p[0], p[1] + r * 1.45); c.lineTo(p[0], p[1] + r * 2.1); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.18; c.stroke();
    c.fillStyle = GOLD; c.strokeStyle = INK2; c.lineWidth = lw * 0.8; c.beginPath(); c.ellipse(p[0], p[1] + r * 2.15, r * 0.55, r * 0.18, 0, 0, TAU); c.fill(); c.stroke();
    c.beginPath(); c.arc(p[0], p[1], r * 1.42, 0, TAU); c.strokeStyle = INK2; c.lineWidth = T * 0.3; c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.17; c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.05; c.beginPath(); c.arc(p[0], p[1], r * 1.42, Math.PI * 1.05, Math.PI * 1.6); c.stroke();
    TN.shape(c, TN.ell(p[0], p[1], r, r), { col: '#4F86B8', shade: '#365F8A', shade2: '#244468', hi: '#8EC1E8', line: INK2, lw, r, force: true, spec: 0.7, specAt: [p[0] - r * 0.35, p[1] - r * 0.4],
      inner: c2 => { for (const [lon, lat, w, h] of GAIA_LAND) { const a = lon + rot, cz = Math.cos(a); if (cz < -0.1) continue; const x = p[0] + Math.sin(a) * r * Math.cos(lat), y = p[1] - lat * r * 0.9; c2.fillStyle = '#6FA86A'; c2.beginPath(); c2.ellipse(x, y, w * r * Math.max(0.15, cz), h * r, 0, 0, TAU); c2.fill(); c2.fillStyle = 'rgba(30,60,30,.35)'; c2.beginPath(); c2.ellipse(x + w * r * 0.25 * cz, y + h * r * 0.3, w * r * 0.5 * Math.max(0.15, cz), h * r * 0.4, 0, 0, TAU); c2.fill(); } } });
    // the seven lit points (once it has fallen)
    const lit = M.lit || 0; for (let i = 0; i < lit; i++) { const [lon, lat] = GAIA_PTS[i], a = lon + rot, cz = Math.cos(a); if (cz < 0) continue; const x = p[0] + Math.sin(a) * r * Math.cos(lat), y = p[1] - lat * r * 0.9; K.glow(c, x, y, T * 0.9, GOLD_HI, 0.9 * cz); TN.twinkle(c, x, y, T * 0.32, '#FFFFFF', 0.95); }
    c.strokeStyle = INK2; c.lineWidth = T * 0.24; c.beginPath(); c.ellipse(p[0], p[1], r * 1.18, r * 0.36, -0.35, 0, Math.PI); c.stroke(); c.strokeStyle = GOLD; c.lineWidth = T * 0.12; c.stroke(); }
  /* a projection of it, out of a book: the real one painted whole (with a gold rim); a copy only a hollow dashed violet outline */
  function paintProjection(c, FX, P3, T, L, lw) { const M = FX.mem, P = projAt(FX, L), p = P3(P[0], P[1], P[2]), B = BOOKS[L.b], bk = P3(FX.C.x + B.x, FX.C.y + B.y + 0.3, 2.3), kn = P3(L.kx, L.ky, 0.35), s = T * 0.44 * smooth(L.a), bt = M.bt;
    // its tether: from the book's pages down to the knot on the floor and up into it
    c.save(); c.lineCap = 'round'; const tpath = () => { c.beginPath(); c.moveTo(bk[0], bk[1]); c.quadraticCurveTo((bk[0] + kn[0]) / 2, kn[1] + T * 0.3, kn[0], kn[1]); c.quadraticCurveTo((kn[0] + p[0]) / 2, kn[1] + T * 0.2, p[0], p[1] + s * 2.4); };
    if (L.real) { tpath(); c.strokeStyle = INK2; c.lineWidth = T * 0.32; c.stroke(); c.strokeStyle = '#3A2A48'; c.lineWidth = T * 0.2; c.stroke(); c.setLineDash([T * 0.12, T * 0.5]); c.lineDashOffset = -bt * T * 2; c.strokeStyle = GOLD_HI; c.lineWidth = T * 0.1; c.stroke(); }
    else { tpath(); c.setLineDash([T * 0.4, T * 0.3]); c.lineDashOffset = -bt * T * 1.5; c.strokeStyle = VIOLET_HI; c.lineWidth = T * 0.14; c.stroke(); }
    c.restore();
    if (s < 1) return;
    // a wisp of ink under it
    if (L.real) { c.fillStyle = PLUME; c.beginPath(); c.moveTo(p[0] - s * 1.6, p[1] + s * 1.6); c.quadraticCurveTo(p[0], p[1] + s * 4.5, p[0] + s * 1.6, p[1] + s * 1.6); c.closePath(); c.fill(); }
    paintBrain(c, p[0], p[1], s, { roll: Math.sin(bt * 0.7 + L.i) * 0.08, eyes: [{ b: 0 }, { b: 0 }, { b: 0 }], look: M.look, lw: Math.max(1, lw * 0.6), bt, ghost: !L.real }); }
  function demoPaint(c, FX, m, X, Y, T, t) { const M = FX.mem || {}, C = FX.C || { x: m.x, y: m.y - BOSS_Y };
    if (!M.P) { M.P = { sag: M.demoSag ? 1 : 0, open: M.demoSag ? 1 : 0, boil: M.demoBoil ? 1 : 0, wake: 1, dk: 0, rec: 0, alpha: 1 }; M.bt = M.bt || 2; M.ringA = 0.4; M.roll = 0.04; M.recoil = 0; M.fx = C.x; M.look = [0.1, 0.4]; M.eyes = EYES.map((e, i) => ({ i, b: 0 })); M.tend = TEND.map(T0 => ({ k: T0.k, mode: 'rest', t: 0, tip: [C.x + Math.cos(T0.ph) * 5.4, C.y + BR_Y + Math.sin(T0.ph) * 3 + 1, 2.2], lift: 0 })); }
    const F2 = { C, mem: M, m, S: { enterT: 9 }, obj: () => null }; tendrils(F2, m, 0); const P3 = TN.cam(X, Y, T, m); paintAll(c, F2, m, P3, T); }

  /* ---------- a book of the rim: a giant upright tome; opening, its cover swings back on its spine and its pages light ---------- */
  function drawBook(c, FX, p, X, Y, T, t) { const M = FX.mem, bk = M && M.books ? M.books[p.i] : { open: 0 }, o = smooth(bk.open || 0), lw = Math.max(1.2, T * 0.07), w = 2.4 * T, h = 3.7 * T, d = 0.55 * T, col = BOOK_COL[p.i], x0 = X - w / 2, y0 = Y - h;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    c.fillStyle = 'rgba(30,20,40,.3)'; c.beginPath(); c.ellipse(X + d * 0.5, Y + T * 0.05, w * 0.75, T * 0.45, 0, 0, TAU); c.fill();
    // the back cover's edge and the block of pages: its thickness, up and to the right
    const blk = [[x0 + w, Y], [x0 + w + d, Y - d * 0.6], [x0 + w + d, y0 - d * 0.6], [x0 + w, y0]];
    c.beginPath(); blk.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = PARCH_D; c.fill(); c.strokeStyle = INK2; c.lineWidth = lw; c.stroke();
    c.strokeStyle = 'rgba(120,96,60,.45)'; c.lineWidth = 1; c.beginPath(); for (let i = 1; i < 6; i++) { const u = i / 6; c.moveTo(x0 + w + d * u, Y - d * 0.6 * u - T * 0.12); c.lineTo(x0 + w + d * u, y0 - d * 0.6 * u + T * 0.12); } c.stroke();
    const top = [[x0, y0], [x0 + w, y0], [x0 + w + d, y0 - d * 0.6], [x0 + d, y0 - d * 0.6]]; c.beginPath(); top.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fillStyle = shadeC(col, -0.25); c.fill(); c.stroke();
    // the face: closed, the front cover; opening, the lit pages behind a cover swinging back on its spine
    if (o > 0.02) { c.beginPath(); c.rect(x0 + T * 0.06, y0 + T * 0.08, w - T * 0.08, h - T * 0.12); c.fillStyle = PARCH_HI; c.fill(); c.strokeStyle = INK2; c.lineWidth = lw; c.stroke();
      c.strokeStyle = 'rgba(40,30,50,.3)'; c.lineWidth = Math.max(1, T * 0.05); c.beginPath(); for (let i = 0; i < 9; i++) { const y = y0 + T * (0.5 + i * 0.34); c.moveTo(x0 + T * 0.35, y); c.lineTo(x0 + w - T * (0.35 + (i % 3) * 0.3), y); } c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = o; blitSized(c, glowSprite(VIOLET_HI), X - w, y0 - h * 0.2, w * 2, h * 1.3); c.globalAlpha = o * 0.7; blitSized(c, glowSprite('#FFFFFF'), X - w * 0.5, y0 + h * 0.15, w, h * 0.7); c.restore();
      symbol(c, p.i % 4, X, y0 + h * 0.45, T * 0.55, 'rgba(40,24,60,.75)', T); }
    const ang = o * Math.PI * 0.85, cw = w * Math.cos(ang), lean = Math.sin(ang) * T * 0.35, xe = x0 + cw;
    const face = [[x0, Y], [xe, Y + lean], [xe, y0 - lean], [x0, y0]], inside = cw < 0;
    c.beginPath(); face.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
    const g = c.createLinearGradient(x0, 0, x0 + Math.max(4, Math.abs(cw)) * Math.sign(cw || 1), 0); g.addColorStop(0, shadeC(col, inside ? -0.1 : 0.22)); g.addColorStop(0.5, inside ? shadeC(col, 0.15) : col); g.addColorStop(1, shadeC(col, -0.3)); c.fillStyle = g; c.fill(); c.strokeStyle = INK2; c.lineWidth = lw; c.stroke();
    if (!inside && cw > w * 0.25) { c.save(); c.beginPath(); face.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip(); const k = cw / w;
      // gold tooling: a border, corner pieces, a sigil at the heart, bands on the spine
      c.strokeStyle = GOLD; c.lineWidth = Math.max(1.2, T * 0.07); c.strokeRect(x0 + T * 0.3 * k, y0 + T * 0.3, cw - T * 0.6 * k, h - T * 0.6);
      for (const [cx2, cy2] of [[x0 + T * 0.3 * k, y0 + T * 0.3], [xe - T * 0.3 * k, y0 + T * 0.3], [x0 + T * 0.3 * k, Y - T * 0.3], [xe - T * 0.3 * k, Y - T * 0.3]]) { c.fillStyle = GOLD; c.beginPath(); c.ellipse(cx2, cy2, T * 0.2 * k, T * 0.2, 0, 0, TAU); c.fill(); }
      c.beginPath(); c.ellipse(x0 + cw / 2, y0 + h * 0.45, T * 0.6 * k, T * 0.6, 0, 0, TAU); c.stroke(); symbol(c, (p.i + 1) % 4, x0 + cw / 2, y0 + h * 0.45, T * 0.32, GOLD_HI, T);
      c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x0, y0, T * 0.32 * k, h); c.fillStyle = GOLD; for (const v of [0.15, 0.32, 0.68, 0.85]) c.fillRect(x0, y0 + h * v, T * 0.32 * k, T * 0.08);
      c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(x0 + T * 0.34 * k, y0 + T * 0.1, Math.max(1, cw * 0.06), h - T * 0.2); c.restore(); }
    else if (inside) { c.save(); c.beginPath(); face.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.clip(); c.fillStyle = 'rgba(232,212,170,.55)'; c.fillRect(xe + T * 0.15, y0 + T * 0.1, -cw - T * 0.3, h - T * 0.2); c.restore(); }
    c.restore(); }
  function drawKnot(c, FX, o, X, Y, T, t) { const real = o.real, col = real ? GOLD_HI : VIOLET_HI, pu = 0.5 + 0.5 * Math.sin(t * 6), r = T * 0.75;
    c.save(); c.fillStyle = 'rgba(20,12,30,.35)'; c.beginPath(); c.ellipse(X, Y + T * 0.15, r * 1.3, r * 0.45, 0, 0, TAU); c.fill();
    c.fillStyle = real ? '#2A2036' : 'rgba(205,180,255,.12)'; c.strokeStyle = col; c.lineWidth = Math.max(1.5, T * 0.1); if (!real) c.setLineDash([T * 0.22, T * 0.16]);
    for (const [dx, dy, rr] of [[-0.35, -0.55, 0.5], [0.35, -0.6, 0.48], [0, -0.95, 0.42]]) { c.beginPath(); c.ellipse(X + dx * T, Y + dy * T, rr * T, rr * T * 0.8, dx, 0, TAU); c.fill(); c.stroke(); }
    c.setLineDash([]); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.3 + 0.3 * pu; blitSized(c, glowSprite(col), X - r * 1.6, Y - T * 0.7 - r * 1.6, r * 3.2, r * 3.2); c.restore();
    label(c, 'TETHER', X, Y - T * 2.0, T * 0.75, real ? '#FFFFFF' : VIOLET_HI); }
  function label(c, s, X, Y, T, col, sz) { c.save(); c.font = `900 ${Math.max(10, Math.round(sz || T * 0.46))}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = 'rgba(10,6,16,.75)'; c.strokeText(s, X, Y); c.fillStyle = col; c.fillText(s, X, Y); c.restore(); }

  /* ---------- the floor's living layer: ink telegraphs, numbered lines, shelters, shadows, splashes ---------- */
  function octScreen(c, FX, pad) { const C = FX.C; c.beginPath(); octPts(pad).forEach(([x, y], i) => { const X = FX.sx(C.x + x), Y = FX.sy(C.y + y); i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); }
  function drawOverlay(c, FX, t, T) { const M = FX.mem, C = FX.C, m = FX.m; if (!M || !M.P || !m) return;
    c.save();
    // ink splashes where its quills struck
    for (const s of M.splats) { const a = clamp(1 - (s.t - 2.5), 0, 1) * 0.62, X = FX.sx(s.x), Y = FX.sy(s.y), R2 = mulberry32(Math.floor(s.seed * 1000)), pts = [];
      for (let i = 0; i < 10; i++) { const an = i / 10 * TAU, rr = s.r * T * (0.62 + R2() * 0.45); pts.push([X + Math.cos(an) * rr, Y + Math.sin(an) * rr * 0.55]); }
      c.fillStyle = `rgba(22,18,34,${a})`; c.beginPath(); TN.blob(pts)(c); c.fill();
      for (let i = 0; i < 4; i++) { const an = R2() * TAU, d = s.r * T * (1.0 + R2() * 0.6); c.beginPath(); c.ellipse(X + Math.cos(an) * d, Y + Math.sin(an) * d * 0.55, s.r * T * 0.12, s.r * T * 0.08, 0, 0, TAU); c.fill(); }
      c.fillStyle = `rgba(190,170,255,${a * 0.35})`; c.beginPath(); c.ellipse(X - s.r * T * 0.25, Y - s.r * T * 0.15, s.r * T * 0.3, s.r * T * 0.1, -0.2, 0, TAU); c.fill(); }
    // the projections' shadows: the real one's gold, the copies' hollow dashed violet
    if (M.end) for (const L of M.end.list) { if (!L.on || L.gone || L.a < 0.05) continue; const P = projAt(FX, L), X = FX.sx(P[0]), Y = FX.sy(P[1]), rx = 1.7 * T * L.a, ry = rx * 0.45;
      if (L.real) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; blitSized(c, glowSprite(GOLD), X - rx * 1.6, Y - ry * 2.2, rx * 3.2, ry * 4.4); c.restore(); c.fillStyle = 'rgba(207,160,60,.75)'; c.beginPath(); c.ellipse(X, Y, rx, ry, 0, 0, TAU); c.fill(); c.strokeStyle = '#8A6420'; c.lineWidth = Math.max(1.5, T * 0.08); c.stroke(); }
      else { c.save(); c.setLineDash([T * 0.35, T * 0.25]); c.lineDashOffset = -t * T; c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(1.5, T * 0.1); c.beginPath(); c.ellipse(X, Y, rx, ry, 0, 0, TAU); c.stroke(); c.restore(); } }
    // the arena-wide casts: ink rising over the floor (cut round the shelters)
    for (const s of FX.S.tele) { if (s.done || (s.ink !== 'salv' && s.ink !== 'major')) continue; const u = clamp(s.age / s.t, 0, 1);
      c.save(); octScreen(c, FX, 0); if (s.ink === 'salv' && M.salv) for (const S2 of [M.salv.real, M.salv.decoy]) { c.moveTo(FX.sx(S2.x) + S2.r * T, FX.sy(S2.y)); c.ellipse(FX.sx(S2.x), FX.sy(S2.y), S2.r * T, S2.r * T, 0, 0, TAU, true); }
      c.fillStyle = `rgba(18,12,28,${0.12 + u * 0.48})`; c.fill('evenodd'); c.restore();
      if (u > 0.6) { c.save(); octScreen(c, FX, 0.4); c.strokeStyle = ROSE; c.globalAlpha = (u - 0.6) * 2 * (0.5 + 0.5 * Math.sin(t * 16)); c.lineWidth = Math.max(2, T * 0.25); c.stroke(); c.restore(); } }
    // the shelters of False Salvation
    if (M.salv) { const S2 = M.salv, R = S2.real, D = S2.decoy, pu = 0.5 + 0.5 * Math.sin(t * 4);
      { const X = FX.sx(R.x), Y = FX.sy(R.y), r = R.r * T; c.fillStyle = 'rgba(190,140,40,.55)'; c.beginPath(); c.ellipse(X + T * 0.4, Y + T * 0.55, r * 1.02, r * 0.98, 0, 0, TAU); c.fill();
        c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.35 + 0.2 * pu; blitSized(c, glowSprite(GOLD_HI), X - r * 1.2, Y - r * 1.2, r * 2.4, r * 2.4); c.restore();
        for (const rr of [r, r - T * 0.42]) { c.strokeStyle = INK2; c.lineWidth = Math.max(3, T * 0.24); c.beginPath(); c.arc(X, Y, rr, 0, TAU); c.stroke(); c.strokeStyle = GOLD_HI; c.lineWidth = Math.max(2, T * 0.14); c.stroke(); } }
      { const X = FX.sx(D.x), Y = FX.sy(D.y), r = D.r * T; c.fillStyle = 'rgba(205,180,255,.1)'; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); c.save(); c.setLineDash([T * 0.5, T * 0.35]); c.lineDashOffset = -t * T * 1.2; c.strokeStyle = VIOLET_HI; c.lineWidth = Math.max(2, T * 0.14); c.stroke(); c.restore(); } }
    // the ink telegraphs: circles and lines of dark ink spreading on the pale floor; the numbered lines' big numbers
    const lines = FX.S.tele.filter(s => !s.done && s.shape === 'line' && s.ink), next = lines.filter(s => s.num).sort((a, b) => (a.t - a.age) - (b.t - b.age))[0];
    for (const s of FX.S.tele) { if (s.done || !s.ink) continue; const u = clamp(s.age / s.t, 0, 1), X = FX.sx(s.x), Y = FX.sy(s.y);
      if (s.shape === 'circle') { const r = s.r * T; c.fillStyle = `rgba(18,14,28,${0.14 + u * 0.46})`; c.beginPath(); c.arc(X, Y, r, 0, TAU); c.fill(); c.strokeStyle = 'rgba(14,10,22,.9)'; c.lineWidth = Math.max(2, T * 0.12); c.stroke();
        c.strokeStyle = u > 0.7 ? ROSE_HI : ROSE; c.globalAlpha = 0.6 + 0.4 * u; c.lineWidth = Math.max(2, T * 0.1); c.beginPath(); c.arc(X, Y, Math.max(1, r * (1 - u)), 0, TAU); c.stroke(); c.globalAlpha = 1; }
      else if (s.shape === 'line') { const isNext = !s.num || s === next, wr = s.writeAt != null ? clamp((FX.S.t - s.writeAt) / s.writeDur, 0, 1) : s.num ? 0 : 1;
        c.save(); octScreen(c, FX, 0); c.clip(); c.translate(X, Y); c.rotate(s.a);
        c.fillStyle = `rgba(18,14,28,${isNext ? 0.12 + u * 0.4 : 0.08 + u * 0.12})`; c.fillRect(0, -s.w / 2 * T, s.len * T, s.w * T);
        c.strokeStyle = 'rgba(14,10,22,.85)'; c.lineWidth = Math.max(2, T * 0.1); if (!isNext) c.setLineDash([T * 0.6, T * 0.4]); c.strokeRect(0, -s.w / 2 * T, s.len * T, s.w * T); c.setLineDash([]);
        if (isNext && (u > 0.55 || !s.num)) { c.strokeStyle = ROSE; c.globalAlpha = 0.5 + 0.5 * Math.sin(t * 18); c.lineWidth = Math.max(2, T * 0.12); c.strokeRect(T * 0.1, -s.w / 2 * T + T * 0.15, s.len * T - T * 0.2, s.w * T - T * 0.3); c.globalAlpha = 1; }
        // the stroke the quill wrote along it
        if (s.u0 != null && wr > 0) { const a0 = s.u0 * T, a1 = lerp(s.u0, s.u1, wr) * T; c.strokeStyle = '#0E0A16'; c.lineCap = 'round'; c.lineWidth = T * 0.34; c.beginPath(); c.moveTo(a0, 0); for (let q = a0; q <= a1; q += T * 0.8) c.lineTo(q, Math.sin(q / T * 0.9) * T * 0.12); c.stroke(); }
        c.restore();
        // the numbers, big, along the part over the floor
        if (s.num && s.u0 != null) { const sz = isNext ? T * 2.2 : T * 1.6, ca = Math.cos(s.a), sa = Math.sin(s.a), span = s.u1 - s.u0, spots = span > 20 ? [0.22, 0.5, 0.78] : [0.3, 0.7];
          for (const f of spots) { const q = s.u0 + span * f, Xn = FX.sx(s.x + ca * q), Yn = FX.sy(s.y + sa * q); if (wr < f) continue; c.save(); c.font = `900 ${Math.round(sz)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = Math.max(4, sz * 0.16); c.strokeStyle = isNext ? '#3A0E1E' : '#1A1426'; c.strokeText(String(s.num), Xn, Yn); c.fillStyle = isNext ? '#FFFFFF' : '#E6DCCB'; c.fillText(String(s.num), Xn, Yn); c.restore(); } } } }
    c.restore();
    // fallen, it is no longer among the living things on the field: its remains are laid down here, under them all
    if (m.dead) { const P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T]; paintAll(c, FX, m, P3, T); } }

  /* ---------- over everything: raised quills, falling pages, the core's mark, the countdown and the ward ---------- */
  function drawFx(c, FX, T, t) { const M = FX.mem, m = FX.m, C = FX.C; if (!m || !M.P) return; const P = M.P, P3 = (x, y, z) => [FX.sx(x), FX.sy(y) - z * T], lw = Math.max(1.2, T * 0.075);
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    if (!m.dead) for (const tn of M.tend) if (tn.lift >= 0.15) paintTendril(c, P3, T, tn, lw, P);
    // pages falling from the ring, each one of the unwritten
    for (const d of M.drops) { const u = clamp(d.t / d.dur, 0, 1), x = lerp(d.x0, d.x1, u), y = lerp(d.y0, d.y1, u), z = lerp(d.z0, 0, u) + Math.sin(u * Math.PI) * d.h, p = P3(x, y, z), ro = d.rot + u * 6;
      c.save(); c.translate(p[0], p[1]); c.rotate(ro); c.scale(1, 0.5 + 0.5 * Math.abs(Math.cos(u * 9))); c.fillStyle = PARCH_HI; c.strokeStyle = INK2; c.lineWidth = Math.max(1, T * 0.05); c.fillRect(-T * 0.35, -T * 0.45, T * 0.7, T * 0.9); c.strokeRect(-T * 0.35, -T * 0.45, T * 0.7, T * 0.9); c.fillStyle = VIOLET; c.fillRect(-T * 0.18, -T * 0.15, T * 0.36, T * 0.3); c.restore();
      const g = [FX.sx(d.x1), FX.sy(d.y1)]; c.save(); c.globalAlpha = 0.5 * u; c.strokeStyle = VIOLET_HI; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.ellipse(g[0], g[1], T * 0.7, T * 0.35, 0, 0, TAU); c.stroke(); c.restore(); }
    // the bared core: a target ring on it
    const wk = FX.S.weak.core; if (wk && !wk.dead) { const cp = coreAt(FX), p = P3(cp[0], cp[1], cp[2]), pu = 0.5 + 0.5 * Math.sin(t * 7); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GOLD_HI; c.globalAlpha = 0.55 + 0.4 * pu; c.lineWidth = Math.max(2, T * 0.14); c.beginPath(); c.arc(p[0], p[1], T * (2.0 + pu * 0.3), 0, TAU); c.stroke(); c.restore(); label(c, 'CORE', p[0], p[1] + T * 2.6, T, GOLD_HI, T * 0.62); }
    // the unwritten: how many are left, over the pet
    if (M.hd) { const left = M.hd.left + M.hd.list.length + M.hd.pending; label(c, `THE UNWRITTEN · ${left} left`, FX.sx(FX.me.x), FX.sy(FX.me.y) - T * 2.3, T, VIOLET_HI, T * 0.62); }
    // the ending being written, and the shelter's cast: their time over the pet
    if (M.end && M.end.st === 'open') { const left = Math.max(0, M.end.W - M.end.t); label(c, `THE ENDING IS WRITTEN IN ${left.toFixed(1)}`, FX.sx(FX.me.x), FX.sy(FX.me.y) - T * 2.3, T, left < 3 ? ROSE_HI : GOLD_HI, T * 0.62); }
    if (M.salv) { const left = Math.max(0, M.salv.CAST - M.salv.t); if (left > 0) label(c, `SHELTER IN ${left.toFixed(1)}`, FX.sx(FX.me.x), FX.sy(FX.me.y) - T * 2.3, T, left < 2 ? ROSE_HI : GOLD_HI, T * 0.62); }
    // the Last Page: a huge countdown and the ward still to break, and the white of its detonation
    if (M.lp && M.lp.st !== 'done') drawLastPage(c, FX, T, t);
    if (M.blast && M.blast.t < 2.6) drawBlast(c, FX, T, t);
    c.restore(); }
  function drawLastPage(c, FX, T, t) { const M = FX.mem, L = M.lp, V = K.viewBox(c, 0), W = V[2] - V[0], H = V[3] - V[1], cx = (V[0] + V[2]) / 2, y0 = V[1] + Math.min(236, H * 0.28);
    // the screen's edge darkening to the ink of the page
    { const a = L.st === 'blow' ? 0.5 + L.t * 0.3 : 0.28 + 0.08 * Math.sin(t * 4); if (!vigCv) { vigCv = document.createElement('canvas'); vigCv.width = 96; vigCv.height = 192; const g = vigCv.getContext('2d'), gr = g.createRadialGradient(48, 96, 26, 48, 96, 110); gr.addColorStop(0, 'rgba(60,10,30,0)'); gr.addColorStop(0.55, 'rgba(60,10,30,.2)'); gr.addColorStop(1, 'rgba(30,6,20,1)'); g.fillStyle = gr; g.fillRect(0, 0, 96, 192); }
      c.save(); c.globalAlpha = Math.min(1, a); c.drawImage(vigCv, V[0], V[1], W, H); c.restore(); }
    if (L.st === 'blow') { c.save(); c.fillStyle = `rgba(255,240,240,${clamp(L.t / 1.7, 0, 1) * 0.85})`; c.fillRect(V[0], V[1], W, H); c.restore(); }
    const left = L.st === 'cast' ? Math.max(0, L.T - L.t) : L.st === 'sink' ? L.T : 0, n = Math.ceil(left - 1e-6), frac = left - Math.floor(left), hot = left <= 5;
    label(c, 'THE LAST PAGE', cx, y0 - 46, T, ROSE_HI, 16);
    // the countdown: a great number, punching on each second
    c.save(); const sz = 64 * (1 + (L.st === 'cast' ? Math.max(0, frac - 0.8) * 1.2 : 0)); c.font = `900 ${Math.round(sz)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 10; c.strokeStyle = 'rgba(20,4,12,.85)'; c.strokeText(String(n), cx, y0); c.fillStyle = hot ? (Math.sin(t * 14) > 0 ? '#FF6A8A' : '#FFFFFF') : '#FFFFFF'; c.fillText(String(n), cx, y0); c.restore();
    // the ward: the damage still needed
    const bw = Math.min(330, W * 0.84), bh = 16, bx = cx - bw / 2, by = y0 + 48, k = clamp(L.ward / L.max, 0, 1);
    label(c, 'ITS WARD · DAMAGE NEEDED', cx, by - 13, T, GOLD_HI, 12);
    c.save(); c.fillStyle = 'rgba(10,6,16,.8)'; GFX.rr(c, bx - 3, by - 3, bw + 6, bh + 6, 8); c.fill(); c.strokeStyle = GOLD; c.lineWidth = 2; GFX.rr(c, bx - 3, by - 3, bw + 6, bh + 6, 8); c.stroke();
    if (k > 0) { const gr = c.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#8A5BD0'); gr.addColorStop(1, '#F2DC9A'); c.fillStyle = gr; GFX.rr(c, bx, by, Math.max(8, bw * k), bh, 6); c.fill(); c.fillStyle = 'rgba(255,255,255,.35)'; GFX.rr(c, bx, by, Math.max(8, bw * k), bh * 0.4, 4); c.fill(); }
    c.fillStyle = 'rgba(0,0,0,.35)'; for (let i = 1; i < 10; i++) c.fillRect(bx + bw * i / 10, by + 2, 1, bh - 4); c.restore();
    label(c, `${fmtNum(Math.ceil(L.ward))} · ${Math.ceil(k * 100)}%`, cx, by + bh / 2, T, '#FFFFFF', 12);
    label(c, L.st === 'blow' ? 'IT DETONATES' : 'STRIKE ITS GOLDEN CORE', cx, by + bh + 16, T, L.st === 'blow' ? ROSE_HI : '#FFFFFF', 13); }

  // the detonation: a wall of ink and rose light rolling out over the whole archive
  function drawBlast(c, FX, T, t) { const B = FX.mem.blast, u = B.t / 2.6, X = FX.sx(B.x), Y = FX.sy(B.y), R = T * (2 + 46 * Math.pow(Math.min(1, B.t / 1.1), 0.6)), a = Math.max(0, 1 - u);
    c.save(); c.fillStyle = `rgba(18,10,24,${0.55 * a})`; c.beginPath(); c.arc(X, Y, R, 0, TAU); c.fill();
    c.globalCompositeOperation = 'lighter'; c.strokeStyle = ROSE_HI; c.globalAlpha = a; c.lineWidth = T * 1.4 * a + 2; c.beginPath(); c.arc(X, Y, R, 0, TAU); c.stroke(); c.strokeStyle = '#FFFFFF'; c.lineWidth = T * 0.4 * a + 1; c.stroke();
    c.globalAlpha = a * 0.9; blitSized(c, glowSprite('#FFFFFF'), X - R * 0.5, Y - R * 0.5, R, R); c.restore();
    const V = K.viewBox(c, 0); if (B.t < 0.5) { c.save(); c.fillStyle = `rgba(255,236,240,${(0.5 - B.t) * 1.8})`; c.fillRect(V[0], V[1], V[2] - V[0], V[3] - V[1]); c.restore(); } }
  /* ---------- the ground: the Final Archive, a pale gilded octagon over the ink void ---------- */
  function paintFloor(c, A) { const rnd = A.rnd, E = A.R + 1.5, oct = pad => { c.beginPath(); octPts(pad).forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };
    // the void round it: ink, faint script, motes, fading at the picture's edge
    { const g = c.createRadialGradient(0, 0, AP * 0.7, 0, 0, E); g.addColorStop(0, '#120E24'); g.addColorStop(0.85, '#0E0B1E'); g.addColorStop(1, 'rgba(14,12,30,0)'); c.fillStyle = g; c.fillRect(-E, -E, E * 2, E * 2);
      c.save(); c.lineCap = 'round'; for (let i = 0; i < 26; i++) { const a = rnd() * TAU, d = RV + 0.5 + rnd() * 1.6, x = Math.cos(a) * d, y = Math.sin(a) * d, w = 1 + rnd() * 2; c.strokeStyle = `rgba(150,120,220,${0.1 + rnd() * 0.12})`; c.lineWidth = 0.07; c.beginPath(); c.moveTo(x - w, y); for (let j = 1; j <= 6; j++) c.quadraticCurveTo(x - w + (j - 0.5) * w / 3, y + (j % 2 ? -0.15 : 0.15), x - w + j * w / 3, y); c.stroke(); }
      c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 30; i++) { const a = rnd() * TAU, d = RV + rnd() * 2; c.globalAlpha = 0.2 + rnd() * 0.3; blitSized(c, glowSprite(rnd() < 0.7 ? VIOLET : GOLD), Math.cos(a) * d - 0.4, Math.sin(a) * d - 0.4, 0.8, 0.8); } c.restore(); }
    // the floor's thickness under its southern edges, falling away into the void
    { const P = octPts(0); for (let i = 0; i < 8; i++) { const a = P[i], b = P[(i + 1) % 8]; if (a[1] + b[1] < 0.5) continue; const g = c.createLinearGradient(0, Math.min(a[1], b[1]), 0, Math.max(a[1], b[1]) + 2.2); g.addColorStop(0, '#B8A27C'); g.addColorStop(0.4, '#8A7656'); g.addColorStop(1, 'rgba(40,30,40,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(b[0], b[1] + 2.2); c.lineTo(a[0], a[1] + 2.2); c.closePath(); c.fill();
        c.strokeStyle = 'rgba(60,44,30,.5)'; c.lineWidth = 0.05; for (let k = 1; k < 7; k++) { const y = k * 0.22; c.beginPath(); c.moveTo(a[0], a[1] + y); c.lineTo(b[0], b[1] + y); c.stroke(); } } }
    c.save(); oct(0); c.clip();
    { const g = c.createRadialGradient(0, 3, 1, 0, 0, RV); g.addColorStop(0, '#F4EBD2'); g.addColorStop(0.6, '#EADFC3'); g.addColorStop(1, '#D8CDBE'); c.fillStyle = g; c.fillRect(-RV, -RV, RV * 2, RV * 2);
      // the light going cold and violet towards the north and the rim
      const v = c.createLinearGradient(0, -AP, 0, 4); v.addColorStop(0, 'rgba(150,128,215,.3)'); v.addColorStop(1, 'rgba(150,128,215,0)'); c.fillStyle = v; c.fillRect(-RV, -RV, RV * 2, RV + 4); }
    // parchment slabs: octagonal rings and radial seams, faint
    c.strokeStyle = 'rgba(140,112,72,.22)'; c.lineWidth = 0.07; for (const r of [3.4, 7.4, 11.2, 14.4]) { oct(AP - r); c.stroke(); }
    for (let ri = 0; ri < 4; ri++) { const r0 = [0, 3.4, 7.4, 11.2][ri], r1 = [3.4, 7.4, 11.2, 14.4][ri], n = [8, 16, 16, 24][ri]; for (let i = 0; i < n; i++) { const a = i / n * TAU + (ri % 2 ? TAU / n / 2 : 0); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); } }
    for (let i = 0; i < 40; i++) { const x = (rnd() * 2 - 1) * AP, y = (rnd() * 2 - 1) * AP, r = 0.6 + rnd() * 1.6; c.fillStyle = `rgba(170,140,95,${0.04 + rnd() * 0.05})`; c.beginPath(); c.ellipse(x, y, r, r * 0.7, rnd() * 3, 0, TAU); c.fill(); }
    // a faint gold compass at the heart, gold leaf letters here and there
    c.strokeStyle = 'rgba(190,150,70,.32)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.moveTo(3.4, 0); c.arc(0, 0, 3.4, 0, TAU); c.stroke();
    c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, r = i % 2 ? 2.2 : 4.2, a1 = a + TAU / 16, a2 = a - TAU / 16; c.moveTo(Math.cos(a2) * 0.9, Math.sin(a2) * 0.9); c.lineTo(Math.cos(a) * r, Math.sin(a) * r); c.lineTo(Math.cos(a1) * 0.9, Math.sin(a1) * 0.9); } c.stroke();
    c.lineCap = 'round'; for (let i = 0; i < 14; i++) { const a = rnd() * TAU, d = 5 + rnd() * 9, x = Math.cos(a) * d, y = Math.sin(a) * d, s = 0.25 + rnd() * 0.2; c.strokeStyle = 'rgba(207,173,98,.35)'; c.lineWidth = 0.06; c.beginPath(); const g = Math.floor(rnd() * 4); if (g === 0) { c.arc(x, y, s, 0, TAU); } else if (g === 1) { c.moveTo(x - s, y + s); c.lineTo(x, y - s); c.lineTo(x + s, y + s); } else if (g === 2) { c.ellipse(x, y, s, s * 0.45, 0, 0, TAU); } else { c.moveTo(x - s, y - s * 0.6); c.lineTo(x + s, y - s * 0.6); c.moveTo(x, y - s * 0.6); c.lineTo(x, y + s); } c.stroke(); }
    // the gold inlay band inside the rim
    c.strokeStyle = 'rgba(207,173,98,.85)'; c.lineWidth = 0.12; oct(1.0); c.stroke(); c.lineWidth = 0.05; oct(1.35); c.stroke();
    for (const [x, y] of octPts(1.18)) { c.fillStyle = GOLD; c.beginPath(); c.arc(x, y, 0.22, 0, TAU); c.fill(); }
    c.restore();
    // the rim
    c.strokeStyle = '#2A2236'; c.lineWidth = 0.32; oct(0); c.stroke(); c.strokeStyle = 'rgba(255,248,226,.6)'; c.lineWidth = 0.06; oct(0.22); c.stroke(); }
  /* the backdrop: the dream's ink void, distant shelves adrift, loose pages, and the black moon (opened into a skylight once it falls) */
  function paintSky(c, W, H, T, open) { const R = mulberry32(707), g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#08061A'); g.addColorStop(0.45, '#151032'); g.addColorStop(1, '#0B091C'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.4; blitSized(c, glowSprite('#6A4AA8'), -W * 0.4, -H * 0.1, W * 1.8, H * 0.7); c.restore();
    // shelves adrift far off, at angles
    for (let i = 0; i < 6; i++) { const x = (i / 6 + R() * 0.1) * W, y = H * (0.08 + R() * 0.5), w = T * (1.5 + R() * 1.5), h = T * (5 + R() * 4), a = (R() - 0.5) * 0.7; c.save(); c.translate(x, y); c.rotate(a); c.fillStyle = '#1C1636'; c.fillRect(-w / 2, -h / 2, w, h); c.fillStyle = '#251E44'; for (let k = 1; k < 5; k++) c.fillRect(-w / 2, -h / 2 + h * k / 5, w, T * 0.12); c.strokeStyle = 'rgba(207,173,98,.25)'; c.lineWidth = 1.5; c.strokeRect(-w / 2, -h / 2, w, h); c.restore(); }
    c.save(); c.lineCap = 'round'; for (let i = 0; i < 14; i++) { const y = R() * H, x = R() * W, w = W * (0.1 + R() * 0.2); c.strokeStyle = `rgba(140,110,210,${0.08 + R() * 0.1})`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); for (let j = 1; j <= 8; j++) c.quadraticCurveTo(x + (j - 0.5) * w / 8, y + (j % 2 ? -4 : 4), x + j * w / 8, y); c.stroke(); } c.restore();
    for (let i = 0; i < 9; i++) { const x = R() * W, y = R() * H, a = R() * 3; c.save(); c.translate(x, y); c.rotate(a); c.globalAlpha = 0.3; c.fillStyle = PARCH_HI; c.fillRect(-6, -8, 12, 16); c.restore(); }
    for (let i = 0; i < 60; i++) { c.globalAlpha = 0.2 + R() * 0.5; c.fillStyle = R() < 0.6 ? '#E8DCFF' : GOLD_HI; c.beginPath(); c.arc(R() * W, R() * H, 0.6 + R() * R() * 1.8, 0, TAU); c.fill(); } c.globalAlpha = 1;
    const mx = W * 0.76, my = H * 0.11, mr = Math.min(W, H) * 0.11;
    if (!open) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45; blitSized(c, glowSprite(GOLD), mx - mr * 2.4, my - mr * 2.4, mr * 4.8, mr * 4.8); c.restore(); c.fillStyle = '#05040A'; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill(); c.strokeStyle = 'rgba(242,220,154,.85)'; c.lineWidth = 2; c.stroke(); c.strokeStyle = 'rgba(242,220,154,.25)'; c.lineWidth = 6; c.beginPath(); c.arc(mx, my, mr + 4, 0, TAU); c.stroke(); }
    else { // a circular skylight: warm daylight through gilded glazing, falling in shafts across the void
      // (soft shafts: a long stretched glow turned along each, so no edge is hard)
      c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16; for (let k = 0; k < 4; k++) { const a = 1.9 + k * 0.12; c.save(); c.translate(mx, my); c.rotate(a - Math.PI / 2); blitSized(c, glowSprite('#FFF3C8'), -mr * 1.4, -mr * 0.6, mr * 2.8, H * 1.3); c.restore(); }
      c.globalAlpha = 0.7; blitSized(c, glowSprite('#FFF1C0'), mx - mr * 3, my - mr * 3, mr * 6, mr * 6); c.restore();
      const gg = c.createRadialGradient(mx - mr * 0.2, my - mr * 0.2, 1, mx, my, mr); gg.addColorStop(0, '#FFFFFF'); gg.addColorStop(0.6, '#FFF3C8'); gg.addColorStop(1, GOLD_HI); c.fillStyle = gg; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 2.2; c.beginPath(); c.arc(mx, my, mr, 0, TAU); c.moveTo(mx + mr * 0.55, my); c.arc(mx, my, mr * 0.55, 0, TAU); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; c.moveTo(mx + Math.cos(a) * mr * 0.55, my + Math.sin(a) * mr * 0.55); c.lineTo(mx + Math.cos(a) * mr, my + Math.sin(a) * mr); } c.stroke(); c.strokeStyle = 'rgba(242,220,154,.5)'; c.lineWidth = 6; c.beginPath(); c.arc(mx, my, mr + 4, 0, TAU); c.stroke(); } }
})());
