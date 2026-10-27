/* ---------- CHORONZON, the Sovereign of Thorns ----------
   An upright, elongated diamond of smoky violet crystal, thin white fissures running through it, ringed by six huge
   tapered spikes of dark metal with purple edges: an uneven, jagged star. The spikes move between fixed arrangements
   (crown, spear, fan, cage, arrowheads), each with its meaning; slowly and deliberately, then all at once. Its court is a
   round paved yard with six broad stone pillars at the edge, each crowned with a diamond that holds light.
   I, the Pointed Crown: Royal Impalement (three spikes mark the ground under you one after another and plunge; their
   shafts stand a while as obstacles), Needle Decree (all six close into a spear aimed at you; the aim locks before it
   flies: step aside, or put a pillar between you), Fan of Ruin (a fan of five needles down marked paths, with room
   between). Reflected Command: let the Decree strike a pillar whose diamond is lit; it drinks the blow and sends it back,
   and for a while its ward is down. That diamond goes dark, so the next time it must be another pillar.
   II, the Living Prison: it drives all six spikes into the yard and beams join them into a cage, with it inside, and you.
   Contracting Law (three walls close in to lines lit on the floor beforehand), Open Sentence (one beam flickers and goes
   out before the cage discharges: get out through it), Thorn Exchange (two spikes lift and swap, their beam sweeping
   the marked floor). Break the Cage: after each discharge one spike loses its glow; break it and its two beams fail and
   the crystal reels. The cage forms again after, the weak spike somewhere new.
   III, the Perfect Weapon: the spikes come home as two three-pronged arrowheads either side of it, and the pillars
   recharge. Opposing Verdicts (one shot that tracks and locks, one down a fixed lane, in turn), Crownfall (both
   arrowheads open over the yard and six spikes fall, leaving a way to a lit pillar), Piercing Silence (the sound goes,
   the crystal turns on its side, a line of light shows its charge, then a long rest where it stops). The Last Command:
   shielded, it readies two great spears; bait each into a different lit pillar, and the two blows coming back break the
   shield, the spikes fall, and the bare crystal sinks within reach. Beaten, its spikes plant themselves round it like a
   monument; the crystal loses its colour, cracks, and falls to dust. */
FIEND_DEFS.choronzon = (() => {
  const GK = GeoKit, TAU = Math.PI * 2, R = 13.5, PR = 10.2, PILR = 1.2, CZ = 4.2, HTc = 3.4, HBc = 3.0;
  const VIO = '#B07CFF', LILAC = '#E0C8FF', DEEP = '#4A2380', PALE = '#F2EAFF';
  const { lerp, clamp01, ease, snap } = GK;
  /* ---- the solids ---- */
  const CRYSTAL = GK.bipyramid(6, 1.25, HTc, HBc, { jit: 0.22, jitR: 0.24, jitZ: 0.5, seed: 41, tx: 0.12, bx: -0.1 });
  const SPL = [5.6, 6.4, 5.0, 6.0, 5.4, 6.6], SPW = [0.72, 0.62, 0.8, 0.66, 0.74, 0.6];
  const SPIKES = SPL.map((L, i) => GK.shard(4 + (i % 2), SPW[i], L, { seed: 11 + i * 7, flat: 0.75 }));
  const SHAFT = GK.block(1.0, 1.0, 3.0, 0.9), CAP = GK.block(1.28, 1.28, 0.28), BASE = GK.block(1.32, 1.32, 0.32), GEM = GK.bipyramid(4, 0.42, 0.62, 0.62, { a0: Math.PI / 4 });
  const pillarAt = (C, i) => { const a = i / 6 * TAU + Math.PI / 6; return { x: C.x + Math.cos(a) * PR, y: C.y + Math.sin(a) * PR, a, i }; };
  function mats(M) {
    const g = M.grey || 0, tone = (A) => A.map(c => GK.mixC(c, ['#3A383E', '#6A686E', '#A8A6AC'][A.indexOf(c)] || c, g));
    return {
      crystal: [{ c: tone(['#2A1446', '#5A3290', '#A684E0']), tex: 'crystal', texA: 0.9, texS: 2.6, gloss: 0.8, glint: '#F4E8FF', a: 0.9, back: GK.mixC('#1A0A30', '#2A2A2E', g), backA: 0.6, edge: g > 0.6 ? null : '#E8D8FF', edgeA: 0.35 * (1 - g) }],
      spike: [{ c: ['#07060B', '#15121C', '#36304A'], tex: 'metal', texA: 0.8, texS: 2.2, gloss: 0.75, glint: '#C8B0FF', under: '#5A2AB0', edge: VIO, edgeA: 0.55 }],
      dead: [{ c: ['#0B0911', '#1A1720', '#34303E'], tex: 'metal', texA: 0.85, texS: 2.2, gloss: 0.4, glint: '#B0A8C0' }],
      stone: [{ c: ['#2E2934', '#544C5E', '#857C90'], tex: 'stone', texA: 0.95, texS: 3, gloss: 0.05 }],
      gem: [{ c: ['#5A2A9A', '#B07CFF', '#F0E0FF'], tex: 'crystal', texA: 0.6, texS: 1.4, gloss: 0.9, glint: '#FFFFFF' }],
      gemDark: [{ c: ['#141018', '#24202C', '#3A3444'], tex: 'crystal', texA: 0.5, texS: 1.4, gloss: 0.5, glint: '#8A80A0' }],
    };
  }
  const tk = FX => (1 / FX.S.fast) * (FX.S.lv >= 3 ? 0.85 : 1);
  const sfx = FX => FX.H.sfx || {};
  function chime(FX, f, k) { const S = sfx(FX); if (S.chime) S.chime(f, k); }
  /* ---- its pose ---- */
  function ensure(M, m) {
    if (M.sp) return;
    Object.assign(M, { cz: M.cz == null ? CZ : M.cz, cyaw: 0, tilt: M.tilt || 0, tiltA: M.tiltA || 0, ward: M.ward == null ? 1 : M.ward, shield: M.shield || 0, shieldHit: 0, grey: M.grey || 0, crack: M.crack || 0, form: M.form || 'crown', formArg: M.formArg || {}, formT: 1, formDur: 0.6, sg: [0, 0, 0, 0, 0, 0], vfx: [], posts: [], spears: [], pulses: [], walls: [], dust: 0, pil: M.pil || null });
    M.sp = targets(M, m, 0); M.from = M.sp.map(p => Object.assign({}, p));
  }
  function setForm(M, f, arg, dur) { M.from = M.sp.map(p => Object.assign({}, p)); M.form = f; M.formArg = arg || {}; M.formT = 0; M.formDur = dur || 0.6; }
  const SE = GK.SE;
  function targets(M, m, t) {
    const f = M.form || 'crown', A = M.formArg || {}, bx = m.x, by = m.y, cz = M.cz == null ? CZ : M.cz, out = [];
    const P = (px, py, pz, d, u, len) => ({ x: bx + px, y: by + py * SE, z: cz + pz, d: GK.norm(d), u, len: len || 1 });
    const W = (x, y, z, d, u) => ({ x, y, z, d: GK.norm(d), u, len: 1 });   // a pose anchored on the floor itself
    switch (f) {
      case 'crown': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + (M.cyaw || 0) * 0.3 + [0, 0.15, -0.1, 0.12, -0.18, 0.06][i], r = 1.35 + (i % 2) * 0.25, ca = Math.cos(a), sa = Math.sin(a); out.push(P(ca * r, sa * r, HTc * 0.55 + (i % 3) * 0.25 + Math.sin(t * 0.8 + i) * 0.06, [ca * (0.5 + (i % 2) * 0.2), sa * (0.5 + (i % 2) * 0.2), 1], [-sa, ca, 0])); } break;
      case 'spear': { const a = A.a || 0, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca; for (let i = 0; i < 6; i++) { const r = i ? 0.42 : 0, b = (i - 1) / 5 * TAU, ox = nx * Math.cos(b) * r, oz = Math.sin(b) * r, back = i ? 0.9 + (i % 2) * 0.5 : 0; out.push(P(ca * (1.6 - back) + ox, sa * (1.6 - back) + ny * Math.cos(b) * r, oz, [ca, sa, -0.05], [0, 0, 1])); } break; }
      case 'fan': { const a = A.a || 0; for (let i = 0; i < 6; i++) { if (i === 5) { out.push(P(0, 0, HTc + 0.6, [0.1, 0, 1], [1, 0, 0])); continue; } const b = a + (i - 2) * (A.spread || 0.36), cb = Math.cos(b), sb = Math.sin(b); out.push(P(cb * 1.5, sb * 1.5, 0.2, [cb, sb, -0.05], [0, 0, 1])); } break; }
      case 'impale': for (let i = 0; i < 6; i++) { const S2 = A.s && A.s[i]; if (S2) out.push(W(S2.x, S2.y, S2.z, [0, 0, -1], [1, 0, 0])); else { const a = i / 6 * TAU, ca = Math.cos(a), sa = Math.sin(a); out.push(P(ca * 1.4, sa * 1.4, HTc * 0.6, [ca * 0.5, sa * 0.5, 1], [-sa, ca, 0])); } } break;
      case 'cage': case 'planted': for (let i = 0; i < 6; i++) { const S2 = (M.plant && M.plant[i]) || { x: bx, y: by, z: 0 }, ox = S2.x - bx, oy = S2.y - by, L = Math.hypot(ox, oy) || 1; out.push(W(S2.x, S2.y, S2.z == null ? -0.9 : S2.z, S2.d || [ox / L * 0.14, oy / L * 0.14, 1], [-oy / L, ox / L, 0])); } break;
      case 'arrows': { const a = A.a == null ? Math.PI / 2 : A.a, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca; for (let i = 0; i < 6; i++) { const side = i < 3 ? -1 : 1, k = i % 3, spread = (k - 1) * 0.36, cb = Math.cos(a + spread), sbb = Math.sin(a + spread), hx = nx * side * 3.3, hy = ny * side * 3.3; out.push(P(hx - ca * 0.6, hy - sa * 0.6, 0.3 + (k === 1 ? 0.1 : 0), [cb, sbb, -0.04], [0, 0, 1])); } break; }
      case 'open': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + t * 0.2, ca = Math.cos(a), sa = Math.sin(a); out.push(P(ca * 5.5, sa * 5.5, 6.5, [ca * 0.2, sa * 0.2, -1], [-sa, ca, 0])); } break;
      case 'fallen': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.4, ca = Math.cos(a), sa = Math.sin(a); out.push(W(bx + ca * (3 + (i % 2)), by + sa * (3 + (i % 2)), 0.35, [-sa, ca, -0.04], [0, 0, 1])); } break;
      case 'monument': for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.25, ca = Math.cos(a), sa = Math.sin(a); out.push(W(bx + ca * 2.7, by + sa * 2.7, -0.7, [-ca * 0.16, -sa * 0.16, 1], [-sa, ca, 0])); } break;
    }
    return out;
  }
  function blendPose(a, b, u) { let d = GK.lerp3(a.d, b.d, u); if (GK.len(d) < 0.2) d = GK.add(d, [0, 0, 0.3]); let w = GK.lerp3(a.u, b.u, u); if (GK.len(w) < 0.2) w = GK.add(w, [0.3, 0.1, 0]); return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u), d: GK.norm(d), u: GK.norm(w), len: lerp(a.len, b.len, u) }; }
  function stepPose(FX, m, dt) {
    const M = FX.mem, t = FX.S.t;
    M.cyaw += dt * (M.form === 'crown' ? 0.35 : 0.12);
    if (M.mv) { const V = M.mv; V.k = Math.min(1, V.k + dt / V.dur); const u = (V.ease || snap)(V.k); m.x = lerp(V.x0, V.x1, u); m.y = lerp(V.y0, V.y1, u); if (V.k >= 1) M.mv = null; }
    if (M.czTo != null) { const d = M.czTo - M.cz, s = M.czV || 5; M.cz += Math.sign(d) * Math.min(Math.abs(d), s * dt); if (Math.abs(d) < 1e-3) M.czTo = null; }
    M.formT = Math.min(1, M.formT + dt / M.formDur);
    const tg = targets(M, m, t), u = ease(M.formT); M.sp = tg.map((p, i) => M.formT < 1 && M.from[i] ? blendPose(M.from[i], p, u) : p);
    for (let i = 0; i < 6; i++) M.sg[i] = Math.max(0, M.sg[i] - dt * 2);
  }
  function moveBody(M, m, x, y, dur, e) { M.mv = { x0: m.x, y0: m.y, x1: x, y1: y, k: 0, dur: Math.max(0.05, dur), ease: e }; }
  /* ---- the yard: where a straight shot from (x, y) along a stops (a pillar, or the yard's edge) ---- */
  function rayStop(FX, x, y, a) {
    const M = FX.mem, C = FX.C, dx = Math.cos(a), dy = Math.sin(a); let best = null, bt = 1e9;
    (M.pil || []).forEach((p, i) => { const ox = x - p.x, oy = y - p.y, b = ox * dx + oy * dy, cc = ox * ox + oy * oy - PILR * PILR, disc = b * b - cc; if (disc < 0) return; const tt = -b - Math.sqrt(disc); if (tt > 0.3 && tt < bt) { bt = tt; best = i; } });
    const ox = x - C.x, oy = y - C.y, b = ox * dx + oy * dy, cc = ox * ox + oy * oy - (R - 0.6) * (R - 0.6), te = -b + Math.sqrt(Math.max(0, b * b - cc));
    if (best == null || te < bt) return { x: x + dx * te, y: y + dy * te, pillar: -1, t: te };
    return { x: x + dx * bt, y: y + dy * bt, pillar: best, t: bt };
  }
  /* a straight blow from the crystal along a, stopped by the first pillar: if that pillar's diamond is lit (and the blow
     may be turned), it drinks it and sends a pulse back */
  function needle(FX, M, x, y, a, t, dmg, o) {
    o = o || {}; const S0 = rayStop(FX, x, y, a), hw = o.hw || 0.75;
    return GK.warn(FX, { shape: 'band', x0: x, y0: y, x1: S0.x, y1: S0.y, hw, t, dmg, col: o.col || VIO, label: o.label, grow: 'len', upd: o.upd, fn: () => {
      const S1 = rayStop(FX, x, y, a); M.spears.push({ x0: x, y0: y, x1: S1.x, y1: S1.y, t: 0, dur: 0.18, big: !!o.big });
      GK.vfx(M, { kind: 'beam', pts: [[x, y, M.cz], [S1.x, S1.y, 2.2]], w: o.big ? 0.5 : 0.28, col: VIO, life: 0.4 });
      FX.H.shake(o.big ? 14 : 7, 0.3); const S = sfx(FX); if (S.crack) S.crack();
      if (S1.pillar >= 0) { const p = M.pil[S1.pillar]; FX.H.boom(S1.x, S1.y, 1.2, VIO, '#FFFFFF', { n: 16, shake: 6, smoke: 4 }); if (o.reflect && p.lit > 0.5) reflect(FX, M, S1.pillar, o.reflect); else FX.H.sparks(S1.x, S1.y, LILAC, 10, 4); }
      if (o.after) o.after(S1);
    } });
  }
  // the lit pillar drinks the blow and sends a pulse back to the crystal; when it arrives, kind decides what it breaks
  function reflect(FX, M, i, kind) {
    const p = M.pil[i], m = FX.m; p.lit = 0; p.flash = 1; FX.H.text(p.x, p.y - 4, 'The pillar answers!', PALE, 14); chime(FX, 990);
    M.pulses.push({ i, x0: p.x, y0: p.y, z0: 7.6, t: 0, dur: 0.7, kind });
  }
  function stepPulses(FX, M, dt) {
    const m = FX.m;
    M.pulses = M.pulses.filter(q => { q.t += dt; if (q.t < q.dur) return true;
      FX.H.boom(m.x, m.y, 1.8, PALE, VIO, { n: 24, shake: 12, smoke: 4 }); const S = sfx(FX); if (S.crack) S.crack();
      if (q.kind === 'ward') { M.disrupt = 5.5; m.stunT = Math.max(m.stunT || 0, 1.2); FX.H.banner('ITS WARD IS DOWN', 'Strike the crystal', PALE, 1.8); }
      if (q.kind === 'shield') { M.shieldHit = (M.shieldHit || 0) + 1; if (M.shieldHit >= 2) shatter(FX, M); else FX.H.banner('THE SHIELD CRACKS', 'One more: a different lit pillar', PALE, 1.8); }
      return false; });
  }
  /* ---- the attacks ---- */
  // Royal Impalement: three spikes mark the ground under the pet one after another and plunge; their shafts stay a while
  function impalement(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), marks = [0.5, 1.05, 1.6].map(x => x * k), fall = 1.0 * k, stay = 3.2;
    const S = [null, null, null, null, null, null], pick = [0, 2, 4];
    const ev = [[0, () => { setForm(M, 'impale', { s: S }, 0.5); chime(FX, 660); }]];
    marks.forEach((tm, j) => { ev.push([tm, () => { const i = pick[j], x = me.x, y = me.y; S[i] = { x, y, z: 9 }; M.sg[i] = 1; chime(FX, 700 + j * 90, 0.8); setForm(M, 'impale', { s: S }, 0.35);
      GK.warn(FX, { shape: 'circle', x, y, r: 1.5, t: fall, dmg: m.dmg * 1.4, col: VIO, grow: true, upd: (dt, zz) => { const u = (zz.age - (zz.t - 0.14)) / 0.14; if (u > 0) S[i].z = lerp(9, -1.2, Math.min(1, u)); }, fn: () => { S[i].z = -1.2; FX.H.boom(x, y, 1.6, VIO, '#FFFFFF', { n: 16, shake: 10, smoke: 6 }); const S2 = sfx(FX); if (S2.thud) S2.thud(); const post = { x, y, r: 0.6, life: stay, i }; M.posts.push(post); syncProps(FX, M); } }); }]); });
    ev.push([marks[2] + fall + stay, () => { M.posts = []; syncProps(FX, M); setForm(M, 'crown', {}, 0.7); }]);
    return GK.job(ev, marks[2] + fall + stay + 0.8);
  }
  // Needle Decree: a spear aimed at the pet; the aim follows, then locks; a lit pillar turns it back
  function decree(FX, m, o) {
    o = o || {}; const M = FX.mem, me = FX.me, k = tk(FX) * (o.k || 1), aimT = (o.aimT || 1.3) * k, lockT = (o.lockT || 0.6) * k, big = !!o.big;
    return GK.job([[0, (F2, m2, J) => { J.a = Math.atan2(me.y - m.y, me.x - m.x); setForm(M, 'spear', { a: J.a }, 0.45); M.aim = { a: J.a, lock: 0, big }; chime(FX, big ? 330 : 520); if (o.banner) FX.H.banner(o.banner[0], o.banner[1], VIO, 2.4, true); }],
      [aimT, (F2, m2, J) => { M.aim.lock = 1; const S = sfx(FX); if (S.note) S.note(1240, 0.1, 'square', 0.1); needle(FX, M, m.x, m.y, J.a, lockT, m.dmg * (big ? 2.6 : 1.8), { hw: big ? 1.05 : 0.75, big, reflect: o.reflect || 'ward', label: o.label }); }],
      [aimT + lockT + 0.05, () => { M.aim = null; }],
      [aimT + lockT + 0.6, () => { if (!o.keep) setForm(M, FX.S.lv >= 3 ? 'arrows' : FX.S.lv === 2 ? 'cage' : 'crown', {}, 0.6); }]], aimT + lockT + 0.9,
      { tick: (F2, m2, J, dt) => { if (M.aim && !M.aim.lock) { const tg = Math.atan2(me.y - m.y, me.x - m.x); J.a += GK.angTo(J.a, tg) * Math.min(1, dt * 4); M.aim.a = J.a; M.formArg.a = J.a; } } });
  }
  // Fan of Ruin: five needles fanned down marked paths, room between them
  function fan(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), a = Math.atan2(me.y - m.y, me.x - m.x), spread = 0.36, wait = 1.05 * k;
    return GK.job([[0, () => { setForm(M, 'fan', { a, spread }, 0.5); chime(FX, 600); }],
      [0.5, () => { for (let i = 0; i < 5; i++) { const b = a + (i - 2) * spread, S0 = rayStop(FX, m.x, m.y, b); GK.warn(FX, { shape: 'band', x0: m.x, y0: m.y, x1: S0.x, y1: S0.y, hw: 0.42, t: wait, dmg: 0, col: VIO, grow: 'len' }); } }],
      [0.5 + wait, () => { for (let i = 0; i < 5; i++) { const b = a + (i - 2) * spread; FX.bullet(m.x + Math.cos(b) * 1.5, m.y + Math.sin(b) * 1.5, b, 15, { color: VIO, core: '#FFFFFF', r: 0.3, dmg: m.dmg * 0.95, style: 'orb', life: 2 }); M.sg[i] = 1; } const S = sfx(FX); if (S.whoosh) S.whoosh(); }],
      [0.5 + wait + 0.7, () => setForm(M, FX.S.lv === 2 ? 'cage' : 'crown', {}, 0.6)]], 0.5 + wait + 1.2);
  }
  /* ---- the Living Prison ---- */
  // plant the cage round the crystal: six spikes at an uneven hexagon, the pet drawn inside if it stands outside
  function plantCage(FX, M, m, o) {
    o = o || {}; const C = FX.C, me = FX.me, base = Math.max(6.2, Math.min(7.6, Math.hypot(me.x - m.x, me.y - m.y) + 1.6)), V = [];
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.25 + [0, 0.12, -0.08, 0.1, -0.12, 0.05][i], r = base * (0.92 + ((i * 37) % 10) / 60); V.push({ x: m.x + Math.cos(a) * r, y: m.y + Math.sin(a) * r, z: -0.9 }); }
    M.plant = V; M.cage = { order: [0, 1, 2, 3, 4, 5], off: [0, 0, 0, 0, 0, 0], flick: -1, vul: o.vul == null ? -1 : o.vul, k: 0 };
    // a pet left outside is drawn in (the crystal keeps its prisoner)
    const d = Math.hypot(me.x - m.x, me.y - m.y); if (d > base * 0.85) { const a = Math.atan2(me.y - m.y, me.x - m.x); FX.teleportPet(m.x + Math.cos(a) * base * 0.6, m.y + Math.sin(a) * base * 0.6); FX.H.text(me.x, me.y - 1.2, 'Drawn into the cage', LILAC, 13); }
    setForm(M, 'cage', {}, 0.7); syncProps(FX, M);
  }
  const cageWall = (M, k) => { const o = M.cage.order, a = M.plant[o[k]], b = M.plant[o[(k + 1) % 6]]; return { a, b, ia: o[k], ib: o[(k + 1) % 6] }; };
  function cagePoly(M) { return M.cage.order.map(i => [M.plant[i].x, M.plant[i].y]); }
  // Open Sentence: one beam flickers out; then the cage discharges into everything inside it
  function openSentence(FX, m) {
    const M = FX.mem, k = tk(FX), me = FX.me, flickT = 0.9 * k, outT = 1.5 * k, boom = 2.9 * k;
    // the beam that opens: the one nearest the pet, so the way out is fair
    let best = 0, bd = 1e9; for (let w = 0; w < 6; w++) { const W2 = cageWall(M, w), d = GK.segD(me.x, me.y, W2.a.x, W2.a.y, W2.b.x, W2.b.y); if (d < bd && !M.cage.off[w]) { bd = d; best = w; } }
    return GK.job([[0, () => { M.cage.flick = best; FX.H.banner('OPEN SENTENCE', 'One beam fails. Leave the cage through it before it discharges.', VIO, 2.4, true); chime(FX, 440); }],
      [outT, () => { M.cage.off[best] = 1; M.cage.flick = -1; M.cage.exit = best; const S = sfx(FX); if (S.note) S.note(220, 0.4, 'sawtooth', 0.12, 110); }],
      [outT, () => GK.warn(FX, { shape: 'poly', pts: cagePoly(M), t: boom - outT, dmg: m.dmg * 1.8, col: VIO, grow: true, fn: () => { FX.H.flash(0.35, VIO); FX.H.shake(14, 0.5); const S = sfx(FX); if (S.crash) S.crash(); cagePoly(M).forEach((p, i, A) => { const q = A[(i + 1) % A.length]; GK.vfx(M, { kind: 'beam', pts: [[p[0], p[1], 1.2], [q[0], q[1], 1.2]], w: 0.45, col: LILAC, life: 0.5 }); }); } })],
      [boom + 0.3, () => { M.cage.off[best] = 0; M.cage.exit = null; vulnerable(FX, M); }]], boom + 0.8);
  }
  // after a discharge one spike loses its glow: break it, and its two beams fail and the crystal reels
  function vulnerable(FX, M) {
    const m = FX.m, prev = M.cage.vulLast == null ? -1 : M.cage.vulLast; let i; do { i = Math.random() * 6 | 0; } while (i === prev);
    M.cage.vul = i; M.cage.vulLast = i; const p = M.plant[i];
    const o = FX.obj({ kind: 'cspike', x: p.x, y: p.y, r: 0.85, hp: Math.max(60, FX.S.barHP * 0.05), front: true, life: 11, onKill: () => breakSpike(FX, M, i), onExpire: () => { if (M.cage) M.cage.vul = -1; } });
    o.si = i; FX.H.text(p.x, p.y - 3.4, 'Its glow is gone: break it!', PALE, 13); chime(FX, 880, 0.8);
  }
  function breakSpike(FX, M, i) {
    const m = FX.m, p = M.plant[i]; if (!M.cage) return; M.cage.vul = -1; M.cage.broken = i;
    // the two beams that met at it fail
    for (let w = 0; w < 6; w++) { const W2 = cageWall(M, w); if (W2.ia === i || W2.ib === i) M.cage.off[w] = 1; }
    p.z = 0.2; p.d = [Math.cos(i), Math.sin(i), 0.05]; M.plant = M.plant.slice();
    FX.H.boom(p.x, p.y, 2, VIO, '#FFFFFF', { n: 24, shake: 12, smoke: 6 }); FX.H.banner('THE CAGE BREAKS', 'It reels: strike the crystal', PALE, 2, true); const S = sfx(FX); if (S.crash) S.crash();
    m.stunT = 4.5; M.open = 5; M.czTo = 2.6; M.czV = 4; M.reform = 6.2;
  }
  // Contracting Law: three walls close in to the lines lit on the floor, then stop; held, then let go
  function contracting(FX, m) {
    const M = FX.mem, k = tk(FX), show = 1.2 * k, move = 0.9, hold = 3.6, set = [0, 2, 4].map(w => (w + (M.cyc % 2)) % 6), d = 2.5;
    let from = null, to = null;
    return GK.job([[0, () => { from = M.plant.map(p => Object.assign({}, p)); to = from.map(p => Object.assign({}, p)); const cx = m.x, cy = m.y;
        set.forEach(w => { const W2 = cageWall(M, w), mx = (W2.a.x + W2.b.x) / 2 - cx, my = (W2.a.y + W2.b.y) / 2 - cy, L = Math.hypot(mx, my) || 1; [W2.ia, W2.ib].forEach(i => { to[i].x -= mx / L * d; to[i].y -= my / L * d; }); });
        // each moved wall's ends both move in, so the wall itself comes in by about d
        M.law = { set, to: to.map(p => ({ x: p.x, y: p.y })), show: 1 }; FX.H.banner('CONTRACTING LAW', 'Three walls close in to the lit lines', VIO, 2, true); chime(FX, 300); }],
      [show, () => { const S = sfx(FX); if (S.whoosh) S.whoosh(); }],
      [show + move + hold, () => { M.law.back = 1; }]], show + move + hold + move + 0.3,
      { tick: (F2, m2, J, dt) => { if (!from) return; const u = J.t < show ? 0 : J.t < show + move ? ease((J.t - show) / move) : J.t < show + move + hold ? 1 : 1 - ease((J.t - show - move - hold) / move);
        M.plant = from.map((p, i) => Object.assign({}, p, { x: lerp(p.x, to[i].x, u), y: lerp(p.y, to[i].y, u) })); if (J.t > show + move + hold + move) M.law = null; else if (J.t > show) M.law.show = 0; } });
  }
  // Thorn Exchange: two spikes lift and swap, turning about their midpoint; the beam between them sweeps the marked circle
  function exchange(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), prep = 1.3 * k, dur = 1.1 * k;
    let a = Math.random() * 6 | 0; const b = (a + 2 + (Math.random() < 0.5 ? 1 : 0)) % 6;
    let P0, P1, cx, cy, rr, a0;
    return GK.job([[0, (F2, m2, J) => { P0 = Object.assign({}, M.plant[a]); P1 = Object.assign({}, M.plant[b]); cx = (P0.x + P1.x) / 2; cy = (P0.y + P1.y) / 2; rr = Math.hypot(P1.x - P0.x, P1.y - P0.y) / 2; a0 = Math.atan2(P0.y - cy, P0.x - cx); M.swap = { a, b, on: 0 };
        GK.warn(FX, { shape: 'circle', x: cx, y: cy, r: rr + 0.2, t: prep, dmg: 0, col: VIO, label: 'EXCHANGE', grow: true }); chime(FX, 560); FX.H.banner('THORN EXCHANGE', 'Two spikes swap; their beam sweeps the marked circle', VIO, 1.8); }],
      [prep, () => { M.swap.on = 1; const S = sfx(FX); if (S.whoosh) S.whoosh(); }],
      [prep + dur, () => { const o = M.cage.order, ia = o.indexOf(a), ib = o.indexOf(b); o[ia] = b; o[ib] = a; M.swap = null; M.plant[a] = Object.assign({}, P1, { z: -0.9 }); M.plant[b] = Object.assign({}, P0, { z: -0.9 }); FX.H.shake(8, 0.3); }]], prep + dur + 0.5,
      { tick: (F2, m2, J, dt) => { if (!M.swap || !M.swap.on) return; const u = ease(clamp01((J.t - prep) / dur)), th = a0 + u * Math.PI, lift = Math.sin(u * Math.PI) * 1.2;
        const pa = { x: cx + Math.cos(th) * rr, y: cy + Math.sin(th) * rr, z: -0.9 + lift }, pb = { x: cx - Math.cos(th) * rr, y: cy - Math.sin(th) * rr, z: -0.9 + lift }; M.plant[a] = pa; M.plant[b] = pb;
        if (GK.segD(me.x, me.y, pa.x, pa.y, pb.x, pb.y) < 0.45 + me.r && !J.hit) { J.hit = 1; GK.hurt(FX, m.dmg * 1.3); } } });
  }
  /* ---- the Perfect Weapon ---- */
  // Opposing Verdicts: the left arrowhead's shot tracks and locks; the right one's fires down a fixed lane after it
  function verdicts(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), aimT = 1.2 * k, lockT = 0.5 * k, lane = 2.6 * k;
    const L = M.sp[1], Rr = M.sp[4], la = Math.atan2(me.y - Rr.y, me.x - Rr.x);
    return GK.job([[0, (F2, m2, J) => { J.a = Math.atan2(me.y - L.y, me.x - L.x); M.aim = { a: J.a, lock: 0, from: 'L' }; chime(FX, 620); FX.H.text(m.x, m.y - 6.5, 'Opposing Verdicts', LILAC, 13);
        // the fixed lane is marked from the start, and fires second
        const x0 = Rr.x, y0 = Rr.y; needle(FX, M, x0, y0, la, lane, m.dmg * 1.5, { hw: 0.85, label: '2', col: '#D88CFF' }); }],
      [aimT, (F2, m2, J) => { M.aim.lock = 1; const S = sfx(FX); if (S.note) S.note(1240, 0.1, 'square', 0.1); needle(FX, M, L.x, L.y, J.a, lockT, m.dmg * 1.5, { hw: 0.75, label: '1' }); }],
      [aimT + lockT + 0.1, () => { M.aim = null; }]], lane + 0.6,
      { tick: (F2, m2, J, dt) => { if (M.aim && !M.aim.lock) { const tg = Math.atan2(me.y - L.y, me.x - L.x); J.a += GK.angTo(J.a, tg) * Math.min(1, dt * 4); M.aim.a = J.a; } } });
  }
  // Crownfall: both arrowheads open over the yard; six spikes fall on marked ground, leaving a way to a lit pillar
  function crownfall(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), wait = 1.5 * k;
    return GK.job([[0, (F2, m2, J) => { setForm(M, 'open', {}, 0.7); chime(FX, 480); FX.H.banner('CROWNFALL', 'Six spikes fall. A lit pillar is the way clear.', VIO, 2, true);
        const lit = M.pil.filter(p => p.lit > 0.5), tgt = (lit.length ? lit : M.pil).slice().sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0], way = Math.atan2(tgt.y - me.y, tgt.x - me.x);
        J.z = [[0, 0]].concat([1.3, 2.1, Math.PI, -2.1, -1.3].map(o => [Math.cos(way + o) * 3.4, Math.sin(way + o) * 3.4]));
        J.z.forEach(([ox, oy], i) => { const x = me.x + ox, y = me.y + oy; GK.warn(FX, { shape: 'circle', x, y, r: 2.0, t: wait + i * 0.12, dmg: m.dmg * 1.6, col: VIO, grow: true, fn: () => { FX.H.boom(x, y, 1.8, VIO, '#FFFFFF', { n: 14, shake: 8, smoke: 6 }); const S = sfx(FX); if (S.thud) S.thud(); } }); });
        M.way = { x: tgt.x, y: tgt.y, t: wait + 1.2 }; }],
      [wait + 1.4, () => { M.way = null; setForm(M, 'arrows', {}, 0.8); }]], wait + 2.2);
  }
  // Piercing Silence: the sound goes; it turns on its side; a line of light, the charge, and a long rest where it stops
  function silence(FX, m) {
    const M = FX.mem, me = FX.me, k = tk(FX), C = FX.C, aim = 1.6 * k, go = 0.3;
    let a, S0, x0, y0;
    return GK.job([[0, () => { a = Math.atan2(me.y - m.y, me.x - m.x); S0 = rayStop(FX, m.x, m.y, a); x0 = m.x; y0 = m.y; const S = sfx(FX); if (S.duck) S.duck(0.12, aim + go + 0.4); M.tiltTo = 1; M.tiltA = a; FX.H.text(m.x, m.y - 6.5, '. . .', PALE, 16);
        const ex = S0.x - Math.cos(a) * 1.6, ey = S0.y - Math.sin(a) * 1.6; GK.warn(FX, { shape: 'band', x0, y0, x1: ex, y1: ey, hw: 1.25, t: aim + go * 0.6, dmg: m.dmg * 2.2, col: PALE, grow: 'len' }); }],
      [aim, () => { const ex = S0.x - Math.cos(a) * 1.6, ey = S0.y - Math.sin(a) * 1.6; moveBody(M, m, ex, ey, go, u => u); M.czTo = 2.2; M.czV = 12; const S = sfx(FX); if (S.whoosh) S.whoosh(); }],
      [aim + go, () => { FX.H.boom(m.x, m.y, 2.2, PALE, VIO, { n: 26, shake: 16, smoke: 8 }); m.stunT = 3.6; M.open = 3.8; FX.H.banner('IT RESTS', 'Strike while it lies still', PALE, 1.6); }],
      [aim + go + 3.8, () => { M.tiltTo = 0; M.czTo = CZ; M.czV = 4; moveBody(M, m, C.x, C.y - 0.5, 1.0); }]], aim + go + 5);
  }
  // The Last Command: shielded, two great spears; each turned back by a different lit pillar cracks, then breaks, the shield
  function lastCommand(FX, m) {
    const M = FX.mem, k = tk(FX), t2 = 3.1 * k;
    const one = decree(FX, m, { big: true, aimT: 1.6, lockT: 0.7, reflect: 'shield', keep: true, label: '1' });
    return GK.job([[0, () => { M.shield = 1; M.shieldHit = 0; FX.H.banner('THE LAST COMMAND', 'Two great spears: shelter each behind a different lit pillar', PALE, 2.6, true); chime(FX, 260); }],
      [0.01, (F2, m2, J) => { J.sub = one; }],
      [t2, (F2, m2, J) => { J.sub = decree(FX, m, { big: true, aimT: 1.4, lockT: 0.7, reflect: 'shield', keep: true, label: '2' }); }],
      [t2 + 3.0, (F2, m2, J) => { if (!M.shattered) { M.shield = 0; setForm(M, 'arrows', {}, 0.6); FX.H.text(m.x, m.y - 6, 'The command stands', LILAC, 13); } }]], t2 + 3.2,
      { hold: false, tick: (F2, m2, J, dt) => { if (J.sub && GK.stepJob(FX, m, J.sub, dt)) J.sub = null; if (M.shattered) { J.sub = null; J.end = Math.max(J.end, J.t + 0.1); if (M.shattered > 6.2) { M.shattered = 0; J.end = 0; J.i = J.ev.length; M.czTo = CZ; M.czV = 4; setForm(M, 'arrows', {}, 0.9); syncProps(FX, M); FX.H.text(m.x, m.y - 6, 'It gathers its spikes again', LILAC, 13); } } } });
  }
  function shatter(FX, M) {
    const m = FX.m; M.shield = 0; M.shattered = 0.01; FX.H.banner('THE SHIELD SHATTERS', 'Its spikes fall: strike the bare crystal', PALE, 2.2, true); FX.H.flash(0.5, PALE); FX.H.shake(18, 0.6);
    setForm(M, 'fallen', {}, 0.5); syncProps(FX, M); M.czTo = 1.6; M.czV = 6; m.stunT = 6; M.open = 6.2; M.aim = null; const S = sfx(FX); if (S.crash) S.crash();
  }
  /* ---- choosing ---- */
  function pickJob(FX, m, lv) {
    const M = FX.mem, i = M.cyc++, nm = (n, J) => { J.name = n; return J; };
    if (lv === 1) { if (M.sigCd <= 0) { M.sigCd = 14; return nm('reflected', decree(FX, m, { banner: ['REFLECTED COMMAND', 'Put a lit pillar between you and the spear'] })); } return [() => nm('impalement', impalement(FX, m)), () => nm('decree', decree(FX, m)), () => nm('fan', fan(FX, m))][i % 3](); }
    if (lv === 2) { if (M.reform > 0 || !M.cage) return null; return [() => nm('openSentence', openSentence(FX, m)), () => nm('contracting', contracting(FX, m)), () => nm('fan', fan(FX, m)), () => nm('exchange', exchange(FX, m))][i % 4](); }
    if (M.sigCd <= 0) { M.sigCd = 26; return nm('lastCommand', lastCommand(FX, m)); }
    return [() => nm('verdicts', verdicts(FX, m)), () => nm('crownfall', crownfall(FX, m)), () => nm('silence', silence(FX, m))][i % 3]();
  }
  function endJob(FX) { const M = FX.mem, lv = FX.S.lv; M.job = null; M.aim = null; M.gap = lv >= 3 ? 0.9 : lv === 2 ? 1.1 : 1.4; }
  // planted things are drawn as props, so the pet passes properly in front of and behind them
  function syncProps(FX, M) {
    const P = FX.S.props; for (let i = P.length - 1; i >= 0; i--) if (P[i].kind === 'cSpike') P.splice(i, 1);
    const planted = new Set(); if (M.form === 'cage' || M.form === 'planted' || M.form === 'monument' || M.form === 'fallen') for (let i = 0; i < 6; i++) planted.add(i); M.posts.forEach(p => planted.add(p.i));
    planted.forEach(i => P.push({ kind: 'cSpike', i, x: 0, y: 0 })); M.propSet = planted;
  }
  function bodyParts(FX, m) { const M = FX.mem; if (M.end) return; const CE = GK.CE, z = M.cz; FX.parts([{ key: 'c0', dx: 0, dy: -(z + 0.9) * CE, r: 1.5 }, { key: 'c1', dx: 0, dy: -(z - 1.2) * CE, r: 1.3 }]); }
  /* ---- painting ---- */
  function crystalR(M) { const t = M.tilt || 0; if (t < 0.01) return GK.rz(M.cyaw * 0.4); const a = M.tiltA || 0; return GK.mm(GK.rz(a), GK.mm(GK.ry(t * Math.PI / 2), GK.rz(M.cyaw * 0.4))); }
  function drawCrystal(c, P, M, MT, T, t, flash) {
    const m = P.m, cm = GK.cam(P.sx(m.x), P.sy(m.y), T), R0 = crystalR(M), g = M.grey || 0, p = GK.at(P, m.x, m.y, M.cz);
    // the light within, a ward or a shield round it, the crystal itself, and its fissures widening as it dies
    GK.glow(c, p[0], p[1], T * 4.2, g > 0.5 ? '#9A98A0' : VIO, (0.25 + 0.1 * Math.sin(t * 2)) * (1 - g * 0.8));
    GK.solid(c, cm, CRYSTAL, { R: R0, t: [0, 0, M.cz] }, { mats: MT.crystal, back: true, ink: '#120820', lw: 0.065, flash, face: M.crack > 0 ? (c2, i, fr) => { const R2 = mulberry32(i * 13 + 5), n = Math.round(2 + M.crack * 5); c2.strokeStyle = `rgba(255,255,255,${0.5 + 0.4 * M.crack})`; c2.lineWidth = 0.05 + M.crack * 0.04; c2.beginPath(); for (let k = 0; k < n; k++) { let x = fr.u0 + R2() * (fr.u1 - fr.u0), y = fr.v0 + R2() * (fr.v1 - fr.v0); c2.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (R2() - 0.5) * fr.ext * 0.5 * M.crack; y += (R2() - 0.5) * fr.ext * 0.5 * M.crack; c2.lineTo(x, y); } } c2.stroke(); } : null });
    if (g < 0.8) GK.glow(c, p[0], p[1] - T * 0.4, T * 1.6, '#FFFFFF', (0.22 + 0.12 * Math.sin(t * 3.1)) * (1 - g));
    if (M.ward > 0.02 && !M.disrupt) { c.save(); c.globalAlpha = 0.35 * M.ward * (0.7 + 0.3 * Math.sin(t * 4)); GK.solid(c, cm, CRYSTAL, { R: R0, t: [0, 0, M.cz], s: 1.32 }, { mats: [{ c: ['#2A1446', '#5A3290', '#A684E0'], a: 0.12 }], ink: VIO, lw: 0.03, inner: false }); c.restore(); }
    if (M.shield > 0.02) { c.save(); c.globalAlpha = Math.min(1, M.shield); GK.solid(c, cm, CRYSTAL, { R: GK.rz(-t * 0.3), t: [0, 0, M.cz], s: 1.75 }, { mats: [{ c: ['#C8B0FF', '#E8D8FF', '#FFFFFF'], a: 0.18, gloss: 0.6 }], ink: '#FFFFFF', lw: 0.04, inkI: PALE, inkIA: 0.5 + (M.shieldHit ? 0.3 : 0), face: M.shieldHit ? (c2, i, fr) => { c2.strokeStyle = 'rgba(255,255,255,.9)'; c2.lineWidth = 0.06; c2.beginPath(); c2.moveTo(fr.u0, fr.v0); c2.lineTo((fr.u0 + fr.u1) / 2, (fr.v0 + fr.v1) / 2 + 0.3); c2.lineTo(fr.u1, fr.v1 * 0.6); c2.stroke(); } : null }); c.restore(); GK.glow(c, p[0], p[1], T * 3.4, PALE, 0.3); }
  }
  function drawSpike(c, P, M, MT, b, i, T) {
    const cm = GK.cam(P.sx(b.x), P.sy(b.y), T), g = M.sg[i] || 0, vul = M.cage && M.cage.vul === i, dead = M.cage && M.cage.broken === i && M.open > 0;
    GK.solid(c, cm, SPIKES[i], { R: GK.frame(b.d, b.u), t: [0, 0, b.z], s: [b.len, 1, 1] }, { mats: dead || vul ? MT.dead : MT.spike, ink: '#06040A', lw: 0.06, flash: g * 0.5 });
    if (!vul && !dead && (M.grey || 0) < 0.5) { const tip = GK.at(P, b.x + b.d[0] * SPL[i] * b.len, b.y + b.d[1] * SPL[i] * b.len * SE, b.z + b.d[2] * SPL[i] * b.len); GK.glow(c, tip[0], tip[1], T * (0.6 + g * 1.4), VIO, 0.45 + g * 0.4); }
  }
  function spikeDep(b, i) { const L = SPL[i] * b.len * 0.5, cy = b.y + b.d[1] * L * SE, cz = b.z + b.d[2] * L; return cy * GK.CE / SE + cz * SE; }
  function drawChoronzon(c, FX, m, X, Y, T, t) {
    const M = FX.mem; ensure(M, m);
    const P = { sx: x => X + (x - m.x) * T, sy: y => Y + (y - m.y) * T, Tz: () => T, m }, MT = mats(M), flash = FX.K.Q.flash;
    GK.shadow(c, X, Y, T * 2.4, T * 1.1, M.cz, 0.55);
    const items = [{ dep: m.y * GK.CE / SE + M.cz * SE, f: () => drawCrystal(c, P, M, MT, T, t, flash) }];
    M.sp.forEach((b, i) => { if (M.propSet && M.propSet.has(i)) return; items.push({ dep: spikeDep(b, i), f: () => drawSpike(c, P, M, MT, b, i, T) }); });
    items.sort((a, b) => a.dep - b.dep).forEach(it => it.f());
  }
  function drawPillar(c, FX, p, T, t) {
    const M = FX.mem, MT = mats(M), X = FX.sx(p.x), Y = FX.sy(p.y), cm = GK.cam(X, Y, T), R0 = GK.rz(p.a + Math.PI / 4);
    // a pet standing behind a pillar sees through it
    const me = FX.me, mx = FX.sx(me.x), my = FX.sy(me.y), hid = me.y < p.y && Math.abs(mx - X) < T * 1.6 && my > Y - T * 7.6 * GK.CE && my < Y + T * 0.4, al = hid ? 0.38 : 1;
    GK.shadow(c, X, Y + T * 0.2, T * 1.8, T * 0.8, 0, 0.5);
    GK.solid(c, cm, BASE, { R: R0, t: [0, 0, 0.32] }, { mats: MT.stone, ink: '#120E16', lw: 0.05, alpha: al });
    GK.solid(c, cm, SHAFT, { R: R0, t: [0, 0, 0.64 + 3.0] }, { mats: MT.stone, ink: '#120E16', lw: 0.05, alpha: al });
    GK.solid(c, cm, CAP, { R: R0, t: [0, 0, 0.64 + 6.0 * 0.9 + 0.3] }, { mats: MT.stone, ink: '#120E16', lw: 0.05, alpha: al });
  }
  // the diamond on its crown: lit, it holds light and turns slowly; dark, it is only stone-grey glass (kept as a small
  // picture of its own in the fight, repainted every third frame; the stone under it is kept far longer)
  function drawPillarGem(c, FX, p, T, t) {
    const M = FX.mem, st = M.pil ? M.pil[p.i] : { lit: 1 }, lit = st.lit > 0.5, gz = 7.2 + Math.sin(t * 1.6 + p.i) * 0.12, gp = GK.at(FX, p.x, p.y, gz);
    const paint = g => { const MT = mats(M), cm = GK.cam(FX.sx(p.x), FX.sy(p.y), T);
      if (lit) GK.glow(g, gp[0], gp[1], T * (1.8 + (st.flash || 0) * 2), VIO, 0.5 + 0.2 * Math.sin(t * 3 + p.i) + (st.flash || 0) * 0.5);
      GK.solid(g, cm, GEM, { R: GK.rz(t * (lit ? 0.9 : 0.2) + p.i), t: [0, 0, gz] }, { mats: lit ? MT.gem : MT.gemDark, ink: '#120820', lw: 0.04, flash: st.flash || 0 });
      if (lit) GK.glow(g, gp[0], gp[1], T * 0.6, '#FFFFFF', 0.6); };
    const ft = FX.K.fightT ? FX.K.fightT(FX, t) : null, r = T * (1.8 + (st.flash || 0) * 2) + 4;
    if (ft == null) { paint(c); return; }
    FX.K.layer(c, 'choronzon-gem-' + p.i, { t, box: [gp[0] - r, gp[1] - r, gp[0] + r, gp[1] + r], ax: gp[0], ay: gp[1], every: 3, slot: p.i % 3, sig: `${Math.round(T * 8)}|${lit ? 1 : 0}|${Math.round((st.flash || 0) * 6)}|${FX.S.lv}`, noFlash: true }, paint);
  }
  // the ground layer: the cage's beams on the floor, the lines Contracting Law will close to, the way to a pillar
  function drawFloor(c, FX, M, T, t) {
    if (M.cage && M.plant && FX.S.lv === 2 || (M.cage && M.end)) {
      for (let w = 0; w < 6; w++) { const W2 = cageWall(M, w), off = M.cage.off[w], fl = M.cage.flick === w; if (off) continue; const a2 = fl ? 0.4 + 0.6 * (Math.sin(t * 40) > 0 ? 1 : 0) : 1, A = [FX.sx(W2.a.x), FX.sy(W2.a.y)], B = [FX.sx(W2.b.x), FX.sy(W2.b.y)]; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = a2; softRay(c, A[0], A[1], B[0], B[1], T * 0.95, VIO, 0.6); softRay(c, A[0], A[1], B[0], B[1], Math.max(3, T * 0.26), PALE, 0.95); c.restore(); }
    }
    if (M.cage && M.cage.exit != null && M.cage.off[M.cage.exit]) { const W2 = cageWall(M, M.cage.exit), mx = (W2.a.x + W2.b.x) / 2, my = (W2.a.y + W2.b.y) / 2, X = FX.sx(mx), Y = FX.sy(my); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GK.rgba('#B8FFD8', 0.55 + 0.35 * Math.sin(t * 12)); c.lineWidth = 3; c.setLineDash([T * 0.35, T * 0.25]); c.beginPath(); c.moveTo(FX.sx(W2.a.x), FX.sy(W2.a.y)); c.lineTo(FX.sx(W2.b.x), FX.sy(W2.b.y)); c.stroke(); c.setLineDash([]); c.globalCompositeOperation = 'source-over'; c.font = `900 ${Math.round(T * 0.55)}px ${arcFont}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.65)'; c.strokeText('WAY OUT', X, Y); c.fillStyle = '#E8FFF2'; c.fillText('WAY OUT', X, Y); c.restore(); }
    if (M.law && M.law.show) { c.save(); c.globalCompositeOperation = 'lighter'; M.law.set.forEach(w => { const o = M.cage.order, a = M.law.to[o[w]], b = M.law.to[o[(w + 1) % 6]]; c.strokeStyle = GK.rgba('#FFFFFF', 0.6 + 0.3 * Math.sin(t * 10)); c.lineWidth = 3; c.setLineDash([T * 0.4, T * 0.25]); c.beginPath(); c.moveTo(FX.sx(a.x), FX.sy(a.y)); c.lineTo(FX.sx(b.x), FX.sy(b.y)); c.stroke(); }); c.setLineDash([]); c.restore(); }
    if (M.way) { const me = FX.me, X0 = FX.sx(me.x), Y0 = FX.sy(me.y), X1 = FX.sx(M.way.x), Y1 = FX.sy(M.way.y); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GK.rgba('#FFFFFF', 0.35 + 0.2 * Math.sin(t * 8)); c.lineWidth = T * 0.5; c.setLineDash([T * 0.3, T * 0.4]); c.lineDashOffset = -t * T; c.beginPath(); c.moveTo(X0, Y0); c.lineTo(X1, Y1); c.stroke(); c.setLineDash([]); c.restore(); }
    if (M.aim && !M.aim.lock) { const m = FX.m, S0 = rayStop(FX, m.x, m.y, M.aim.a); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = GK.rgba(VIO, 0.35 + 0.35 * (Math.sin(t * 30) > 0 ? 1 : 0)); c.lineWidth = M.aim.big ? 3 : 2; c.setLineDash([T * 0.3, T * 0.2]); c.beginPath(); c.moveTo(FX.sx(m.x), FX.sy(m.y)); c.lineTo(FX.sx(S0.x), FX.sy(S0.y)); c.stroke(); c.setLineDash([]); c.restore(); }
  }
  function drawAir(c, FX, M, T, t) {
    GK.drawVfx(c, FX, M, T);
    // the cage's beams as curtains of light between the spikes
    if (M.cage && M.plant && (FX.S.lv === 2 || M.end)) { c.save(); c.globalCompositeOperation = 'lighter'; for (let w = 0; w < 6; w++) { if (M.cage.off[w]) continue; const W2 = cageWall(M, w), fl = M.cage.flick === w, a2 = (fl ? (Math.sin(t * 40) > 0 ? 0.9 : 0.2) : 1) * (M.end ? Math.max(0, 1 - M.end.t / 1.2) : 1); if (a2 <= 0) continue; for (const z of [0.9, 2.0]) { const A = GK.at(FX, W2.a.x, W2.a.y, z), B = GK.at(FX, W2.b.x, W2.b.y, z); softRay(c, A[0], A[1], B[0], B[1], T * 0.7, VIO, 0.45 * a2); softRay(c, A[0], A[1], B[0], B[1], Math.max(2.5, T * 0.18), PALE, 0.9 * a2); } } c.restore(); }
    if (M.swap && M.swap.on) { const a = M.plant[M.swap.a], b = M.plant[M.swap.b], A = GK.at(FX, a.x, a.y, 1.4), B = GK.at(FX, b.x, b.y, 1.4); c.save(); c.globalCompositeOperation = 'lighter'; softRay(c, A[0], A[1], B[0], B[1], T * 1.0, VIO, 0.7); softRay(c, A[0], A[1], B[0], B[1], Math.max(3, T * 0.26), '#FFFFFF', 1); c.restore(); }
    // spears in flight and pulses going home
    M.spears = M.spears.filter(s => (s.t += 1 / 60) < s.dur + 0.15);
    M.spears.forEach(s => { const u = clamp01(s.t / s.dur), x = lerp(s.x0, s.x1, u), y = lerp(s.y0, s.y1, u), p = GK.at(FX, x, y, 2.2), q = GK.at(FX, lerp(s.x0, s.x1, Math.max(0, u - 0.25)), lerp(s.y0, s.y1, Math.max(0, u - 0.25)), 2.2); c.save(); c.globalCompositeOperation = 'lighter'; softRay(c, q[0], q[1], p[0], p[1], T * (s.big ? 0.8 : 0.5), PALE, 0.95, 0.45); c.restore(); GK.glow(c, p[0], p[1], T * (s.big ? 2 : 1.2), VIO, 0.8); });
    M.pulses.forEach(q => { const m = FX.m, u = q.t / q.dur, x = lerp(q.x0, m.x, u), y = lerp(q.y0, m.y, u), z = lerp(q.z0, M.cz, u) + Math.sin(u * Math.PI) * 2, p = GK.at(FX, x, y, z); GK.glow(c, p[0], p[1], T * 1.6, PALE, 0.9); GK.glow(c, p[0], p[1], T * 0.6, '#FFFFFF', 1); });
    if (M.end) drawEnd(c, FX, M, T, t);
  }
  /* ---- the end: a monument of spikes; the crystal greys, cracks and falls to dust ---- */
  function stepEnd(FX, M, dt) {
    const E = M.end, m = FX.m; E.t += dt;
    if (!E.set) { E.set = 1; setForm(M, 'monument', {}, 1.3); M.czTo = 3.4; M.czV = 1; M.shield = 0; M.ward = 0; M.tiltTo = 0; syncProps(FX, M); }
    M.grey = clamp01((E.t - 1.4) / 1.4); M.crack = clamp01((E.t - 2.4) / 1.2);
    if (E.t > 1.3 && !E.planted) { E.planted = 1; FX.H.shake(8, 0.4); const S = sfx(FX); if (S.thud) S.thud(); }
    if (E.t > 3.7 && !E.dust) { E.dust = 1; const S = sfx(FX); if (S.crash) S.crash(); E.bits = []; for (let i = 0; i < 26; i++) { const a = Math.random() * TAU; E.bits.push({ x: m.x + (Math.random() - 0.5) * 1.6, y: m.y + (Math.random() - 0.5) * 0.8, z: M.cz + (Math.random() - 0.5) * 4, vx: Math.cos(a) * 0.6, vy: Math.sin(a) * 0.6, vz: Math.random() * 0.8, s: 0.12 + Math.random() * 0.3, r: Math.random() * TAU }); } for (let i = 0; i < 40; i++) FX.H.part({ kind: 'smoke', x: m.x + (Math.random() - 0.5) * 2, y: m.y + (Math.random() - 0.5), vx: (Math.random() - 0.5) * 1.5, vy: -Math.random() * 1.2, life: 2.2, max: 2.2, size: 0.4 + Math.random() * 0.5, color: 'rgba(200,196,210,' }); }
    if (E.bits) E.bits.forEach(b => { b.vz -= 6 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.z = Math.max(0.05, b.z + b.vz * dt); if (b.z <= 0.05) { b.vx *= 0.8; b.vy *= 0.8; } });
  }
  function drawEnd(c, FX, M, T, t) {
    const E = M.end, m = FX.m;
    if (!E.dust) { const P = { sx: FX.sx, sy: FX.sy, Tz: FX.Tz, m }, MT = mats(M); const k = E.t > 3.2 ? 1 - clamp01((E.t - 3.2) / 0.5) : 1; c.save(); c.globalAlpha = k; drawCrystal(c, P, M, MT, T, t, 0); c.restore(); }
    if (E.bits) E.bits.forEach(b => { const p = GK.at(FX, b.x, b.y, b.z); c.save(); c.translate(p[0], p[1]); c.rotate(b.r); c.fillStyle = '#8A8890'; c.strokeStyle = '#2A2830'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -b.s * T); c.lineTo(b.s * T * 0.6, 0); c.lineTo(0, b.s * T * 0.8); c.lineTo(-b.s * T * 0.5, 0); c.closePath(); c.fill(); c.stroke(); c.restore(); });
  }

  return {
    arenaR: 14, firstAct: 'float', artY: 0.86, ambient: 'motes',
    _t: { impalement, decree, fan, openSentence, contracting, exchange, verdicts, crownfall, silence, lastCommand, plantCage, R, PR },
    artPoses: [{ name: 'the Pointed Crown', mem: { form: 'crown' } }, { name: 'Needle Decree', mem: { form: 'spear', formArg: { a: 0.6 } } }, { name: 'Fan of Ruin', mem: { form: 'fan', formArg: { a: Math.PI / 2, spread: 0.36 } } },
      { name: 'II · planted in the yard', mem: { form: 'monument' } }, { name: 'III · the Perfect Weapon', mem: { form: 'arrows', formArg: { a: Math.PI / 2 } } }, { name: 'III · Piercing Silence', mem: { form: 'arrows', tilt: 1, tiltA: 0.4 } },
      { name: 'III · The Last Command', mem: { form: 'spear', formArg: { a: Math.PI / 2 }, shield: 1 } }, { name: 'the shield shattered', mem: { form: 'fallen', cz: 1.8 } }, { name: 'the end: grey and cracked', mem: { form: 'monument', grey: 1, crack: 1, ward: 0 } }],
    phaseNames: ['The Pointed Crown', 'The Living Prison', 'The Perfect Weapon'],
    carve(set, C) { for (let i = 0; i < 6; i++) { const p = pillarAt(C, i); for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) { const tx = Math.floor(p.x) + x, ty = Math.floor(p.y) + y; if (Math.hypot(tx + 0.5 - p.x, ty + 0.5 - p.y) < PILR + 0.05) set(tx, ty, T_SOLID); } } },
    props(C) { const out = []; for (let i = 0; i < 6; i++) { const p = pillarAt(C, i); out.push({ kind: 'pillar', x: p.x, y: p.y + 0.6, px: p.x, py: p.y, a: p.a, i }); } return out; },
    /* ---- the yard: rings of flagstones round a dark dais with a six-pointed star, lichen in the joints ---- */
    paintGround(c, A) {
      const rnd = A.rnd, Rr = A.R;
      let g = c.createRadialGradient(0, 0, Rr * 0.2, 0, 0, Rr + 1.2); g.addColorStop(0, '#2C2632'); g.addColorStop(0.85, '#221C28'); g.addColorStop(1, 'rgba(20,14,26,0)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, Rr + 1.2, 0, TAU); c.fill();
      // flagstones, ring by ring
      for (let ring = 0; ring < 6; ring++) { const r0 = 2.6 + ring * 1.85, r1 = r0 + 1.85, n = 8 + ring * 5, off = rnd() * 0.5;
        for (let k = 0; k < n; k++) { const a0 = (k + off) / n * TAU, a1 = (k + 1 + off) / n * TAU - 0.02, tone = 60 + Math.floor(rnd() * 22); c.fillStyle = `rgb(${tone},${tone - 6},${tone + 8})`; c.beginPath(); c.arc(0, 0, r1 - 0.05, a0, a1); c.arc(0, 0, r0 + 0.05, a1, a0, true); c.closePath(); c.fill(); c.save(); c.clip(); c.globalAlpha = 0.95; c.fillStyle = GK.pat('stone', 3.5 / 256, ring * 0.7, k * 0.3); c.fillRect(-Rr, -Rr, Rr * 2, Rr * 2); c.globalAlpha = 0.45; c.fillStyle = GK.pat('stain', 7 / 256, k, ring); c.fillRect(-Rr, -Rr, Rr * 2, Rr * 2); c.restore(); } }
      // joints and the lichen in them
      c.strokeStyle = 'rgba(10,6,14,.8)'; c.lineWidth = 0.1; for (let ring = 0; ring < 7; ring++) { c.beginPath(); c.arc(0, 0, 2.6 + ring * 1.85, 0, TAU); c.stroke(); }
      for (let i = 0; i < 140; i++) { const a = rnd() * TAU, r = 2.6 + rnd() * 11, s = 0.1 + rnd() * 0.25; c.fillStyle = `rgba(${120 + rnd() * 50},${80 + rnd() * 40},${170 + rnd() * 60},${0.25 + rnd() * 0.3})`; c.beginPath(); c.ellipse(Math.cos(a) * r, Math.sin(a) * r, s, s * 0.6, a, 0, TAU); c.fill(); }
      // the dais: dark stone, a six-pointed star cut into it with violet light in the cut
      g = c.createRadialGradient(-0.6, -0.6, 0.2, 0, 0, 2.6); g.addColorStop(0, '#3A3044'); g.addColorStop(1, '#16101C'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 0.14; c.beginPath(); for (let k = 0; k < 7; k++) { const a = k * 2 / 6 * TAU - Math.PI / 2, x = Math.cos(a) * 2.1, y = Math.sin(a) * 2.1; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(176,124,255,.45)'; c.lineWidth = 0.05; c.stroke(); c.beginPath(); for (let k = 0; k < 7; k++) { const a = (k * 2 + 1) / 6 * TAU - Math.PI / 2, x = Math.cos(a) * 2.1, y = Math.sin(a) * 2.1; k ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.globalCompositeOperation = 'source-over';
      // the low wall round the yard
      c.strokeStyle = '#4A4252'; c.lineWidth = 0.5; c.beginPath(); c.arc(0, 0, Rr - 0.25, 0, TAU); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 0.08; c.beginPath(); c.arc(0, 0, Rr - 0.45, 0, TAU); c.stroke();
    },
    /* ---- night over the court: violet dark, a ring of far spires, needles of light drifting ---- */
    sky(c, W2, H2, t, cam, T, FX) {
      const px = cam ? (cam.x - 28) * T : 0, py = cam ? (cam.y - 28) * T : 0;
      let g = c.createLinearGradient(0, 0, 0, H2); g.addColorStop(0, '#05030A'); g.addColorStop(0.55, '#140A24'); g.addColorStop(1, '#2A1446'); c.fillStyle = g; c.fillRect(0, 0, W2, H2);
      c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 3; i++) { const y = H2 * (0.25 + i * 0.12) - py * 0.03, gr = c.createLinearGradient(0, y - 30, 0, y + 30); gr.addColorStop(0, 'rgba(160,100,255,0)'); gr.addColorStop(0.5, `rgba(160,100,255,${0.05 + 0.03 * Math.sin(t * 0.5 + i)})`); gr.addColorStop(1, 'rgba(160,100,255,0)'); c.fillStyle = gr; c.fillRect(0, y - 30, W2, 60); } c.restore();
      // far spires
      // far spires: thin towers, each with a needle on top, the farther row fainter
      [[0.03, '#140C20', 0.72, 0.8], [0.07, '#0A0612', 0.8, 1]].forEach(([par, col, base, hk]) => { c.fillStyle = col; c.fillRect(0, H2 * base, W2, H2); for (let i = 0; i < 16; i++) { const x = ((i * 83 + (par > 0.05 ? 40 : 0) - px * par) % (W2 + 120) + W2 + 120) % (W2 + 120) - 60, w = 8 + (i * 7 % 5) * 4, h = (50 + ((i * 53) % 7) * 22) * hk, y = H2 * base; c.beginPath(); c.moveTo(x - w / 2, y + 2); c.lineTo(x - w / 2, y - h); c.lineTo(x - w * 0.15, y - h - 10); c.lineTo(x, y - h - 26 - (i % 3) * 10); c.lineTo(x + w * 0.15, y - h - 10); c.lineTo(x + w / 2, y - h); c.lineTo(x + w / 2, y + 2); c.closePath(); c.fill(); if (par > 0.05 && i % 3 === 0) { c.fillStyle = 'rgba(190,140,255,.55)'; c.fillRect(x - 1, y - h * 0.6, 2, 3); c.fillStyle = col; } } });
      c.fillStyle = 'rgba(220,190,255,.6)'; for (let i = 0; i < 70; i++) { const x = ((i * 137 - px * 0.1) % W2 + W2) % W2, y = (i * 59) % (H2 * 0.7); c.fillRect(x, y, 1.3, 1.3); }
      c.strokeStyle = 'rgba(200,160,255,.35)'; c.lineWidth = 1; c.beginPath(); for (let i = 0; i < 24; i++) { const x = ((i * 181 + t * 12 - px * 0.12) % (W2 + 40) + W2 + 40) % (W2 + 40) - 20, y = ((i * 73 + t * 20) % (H2 + 40)) - 20; c.moveTo(x, y); c.lineTo(x - 4, y - 14); } c.stroke();
    },
    overlay(c, FX, t, T) { const M = FX.mem; if (!M.sp) return; drawFloor(c, FX, M, T, t); },
    /* ---- the fight ---- */
    init(FX) {
      const M = FX.mem, m = FX.m, C = FX.C; m.x = C.x; m.y = C.y - 0.5; m.noTouch = true; m.r = 2;
      ensure(M, m); M.pil = [0, 1, 2, 3, 4, 5].map(i => Object.assign(pillarAt(C, i), { lit: 1, flash: 0 }));
      Object.assign(M, { cyc: 0, gap: 1.8, sigCd: 9, job: null, open: 0, disrupt: 0, rech: 10 });
    },
    phase(FX, p, lv) {
      const M = FX.mem, m = FX.m; M.job = null; M.aim = null; GK.clearWarns(FX); M.posts = []; M.law = null; M.swap = null; M.way = null; M.mv = null; M.tiltTo = 0; M.czTo = CZ; M.czV = 4; M.cyc = 0; M.gap = 0.8;
      moveBody(M, m, FX.C.x, FX.C.y - 0.5, 0.5);
      if (lv === 2) { M.ward = 0; M.disrupt = 0; M.trans = { k: 'cage', t: 0 }; FX.H.banner('THE LIVING PRISON', 'It drives its spikes into the yard and cages you in with it', VIO, 3, true); }
      if (lv === 3) { M.trans = { k: 'weapon', t: 0 }; M.cage = null; M.plant = null; FX.S.objs.forEach(o => { if (o.kind === 'cspike') o.dead = true; }); M.pil.forEach(q => { q.lit = 1; q.flash = 1; }); M.sigCd = 6; FX.H.banner('THE PERFECT WEAPON', 'Two arrowheads. The pillars are charged again.', PALE, 3, true); }
      syncProps(FX, M);
    },
    ai(FX, m, dt) {
      const M = FX.mem; M.gap -= dt; M.sigCd -= dt;
      if (M.trans) { bodyParts(FX, m); return; }
      if (M.job) { if (GK.stepJob(FX, m, M.job, dt)) endJob(FX); }
      else if (M.gap <= 0) M.job = pickJob(FX, m, FX.S.lv);
      bodyParts(FX, m);
    },
    stunned(FX, m, dt) { bodyParts(FX, m); },
    update(FX, dt) {
      const M = FX.mem, m = FX.m; if (!m) return; ensure(M, m); const lv = FX.S.lv;
      if (M.trans) { const T2 = M.trans; T2.t += dt;
        if (T2.k === 'cage' && !T2.done && T2.t > 0.6) { T2.done = 1; plantCage(FX, M, m); FX.H.shake(14, 0.5); const S = sfx(FX); if (S.crash) S.crash(); }
        if (T2.k === 'weapon' && !T2.done && T2.t > 0.4) { T2.done = 1; setForm(M, 'arrows', {}, 1.0); syncProps(FX, M); }
        if (T2.t > 1.8) M.trans = null; }
      if (M.open > 0) M.open -= dt; if (M.disrupt > 0) M.disrupt -= dt;
      if (M.shattered) M.shattered += dt;
      // the ward is up in the crown's stage whenever it is not broken
      M.ward = lv === 1 ? (M.disrupt > 0 ? 0 : Math.min(1, M.ward + dt)) : Math.max(0, M.ward - dt);
      if (M.tiltTo != null) { M.tilt += GK.clamp01(Math.abs(M.tiltTo - M.tilt)) * Math.sign(M.tiltTo - M.tilt) * Math.min(1, dt * 5); }
      // the cage: it re-forms after a breaking, its weak spike moving on
      if (lv === 2 && M.reform > 0) { M.reform -= dt; if (M.reform <= 0) { M.reform = 0; M.czTo = CZ; M.czV = 4; const prev = M.cage ? M.cage.vulLast : -1; plantCage(FX, M, m); M.cage.vulLast = prev; FX.H.banner('The cage re-forms', 'Its weak spike will be another', VIO, 1.4); } }
      // diamonds come back slowly if the pillars run dark
      M.rech -= dt; if (M.rech <= 0 && M.pil) { M.rech = lv >= 3 ? 8 : 10; const lit = M.pil.filter(q => q.lit > 0.5).length; if (lit < (lv >= 3 ? 3 : 2)) { const d2 = M.pil.filter(q => q.lit < 0.5); if (d2.length) { const q = d2[Math.random() * d2.length | 0]; q.lit = 1; q.flash = 1; } } }
      if (M.pil) M.pil.forEach(q => { q.flash = Math.max(0, (q.flash || 0) - dt * 1.5); });
      stepPose(FX, m, dt); GK.stepVfx(M, dt); stepPulses(FX, M, dt);
      // the props follow what they show: planted spikes and the impalement's shafts
      FX.S.props.forEach(p => { if (p.kind === 'cSpike') { const b = M.sp[p.i]; if (b) { p.x = b.x; p.y = b.y + 0.05; } } });
      M.posts = M.posts.filter(q => (q.life -= dt) > 0); if (M.posts.length !== (M._np || 0)) { M._np = M.posts.length; syncProps(FX, M); }
      const W = M.posts.map(q => ({ x: q.x, y: q.y, r: q.r }));
      if (M.cage && M.plant && lv === 2 && !M.end) for (let w = 0; w < 6; w++) { if (M.cage.off[w]) continue; if (M.swap && M.swap.on && ((cageWall(M, w).ia === M.swap.a || cageWall(M, w).ib === M.swap.a || cageWall(M, w).ia === M.swap.b || cageWall(M, w).ib === M.swap.b))) continue; const W2 = cageWall(M, w); W.push({ x0: W2.a.x, y0: W2.a.y, x1: W2.b.x, y1: W2.b.y, hw: 0.28, sting: m.dmg * 0.5, cd: 0.9 }); }
      M.walls = W; GK.walls(FX, W);
      if (M.end) stepEnd(FX, M, dt);
    },
    camFocus(FX, m) { const M = FX.mem; if (!M.sp) return null; if (M.end) return M.end.t < 8 ? { x: m.x, y: m.y - 2, k: 0.7, zoom: 0.72 } : null; if (m.dead || m.act === 'enter') return null; return { x: m.x, y: m.y - M.cz * GK.CE * 0.8, k: 0.36, zoom: 0.63 }; },
    dmgK(FX, m, o) { const M = FX.mem, lv = FX.S.lv; if (M.end) return 0; if (M.shield > 0.5) return 0.1; if (M.open > 0) return lv >= 3 ? 1.8 : 1.5; if (m.stunT > 0) return 1.2; if (lv === 1) return M.disrupt > 0 ? 1.4 : 0.42; return 0.6; },
    draw(c, FX, m, X, Y, T, t) { if (FX.mem.end) return; drawChoronzon(c, FX, m, X, Y, T, t); },
    // its six pillars' stone is kept as pictures, repainted only when one turns see-through for the pet behind it (or the
    // view changes); the turning diamond on each crown is a small picture of its own, repainted every third frame
    propKeep: { every: 240, only: p => p.kind === 'pillar', box: p => [-1.9, -8.2, 1.9, 1.2], sig: (FX, p) => { const me = FX.me, T = FX.Tz(), X = FX.sx(p.px), Y = FX.sy(p.py), mx = FX.sx(me.x), my = FX.sy(me.y), hid = me.y < p.py && Math.abs(mx - X) < T * 1.6 && my > Y - T * 7.6 * GK.CE && my < Y + T * 0.4; return `${hid ? 1 : 0}|${FX.S.lv}`; } },
    drawPropLive(c, FX, p, X, Y, T, t) { if (p.kind === 'pillar') drawPillarGem(c, FX, { x: p.px, y: p.py, a: p.a, i: p.i }, T, t); },
    drawProp(c, FX, p, X, Y, T, t) {
      const M = FX.mem;
      if (p.kind === 'pillar') return drawPillar(c, FX, { x: p.px, y: p.py, a: p.a, i: p.i }, T, t);
      if (p.kind === 'cSpike' && M.sp && M.sp[p.i]) { const P = { sx: FX.sx, sy: FX.sy, Tz: FX.Tz, m: FX.m }; drawSpike(c, P, M, mats(M), M.sp[p.i], p.i, T); }
    },
    drawObj(c, FX, o, X, Y, T, t) { if (o.kind === 'cspike') FiendBeast.meter(c, X, Y - T * 4.6, T * 2.2, o.hp / o.maxhp, PALE, 'BREAK'); },
    drawFx(c, FX, T, t) { const M = FX.mem; if (!M.sp) return; drawAir(c, FX, M, T, t); },
    ending(FX, m) { const M = FX.mem; ensure(M, m); GK.clearWarns(FX); M.job = null; M.aim = null; M.law = null; M.swap = null; M.way = null; M.posts = []; M.end = { t: 0 }; M.walls = []; FX.S.objs.forEach(o => { if (o.kind === 'cspike') o.dead = true; });
      if (!M.plant) M.plant = null;
      return { title: 'CHORONZON FALLS TO DUST', sub: 'Its thorns stand round where it was, a monument', col: '#E0C8FF', delay: 7.5, bannerAt: 4.2, fanfareAt: 4.2, quiet: true, slow: 0.4 }; },
  };
})();
