/* ---------- Rift 0, the Blackfire Caldera: its three trial dungeons ----------
   CAL_STAGES.HOLLOWS   The Ashen Hollows: a sheltered basalt ledge looks out over lava streams and black fire crystals; a
                        ramp descends through four hollows (lava runnels: touching one burns a little and puts you back
                        on the last safe ground) into the cooler maintenance cavern. About forty brood rise in waves,
                        hollow by hollow: cinder slugs alone, basalt crawlers alone, ember wisps alone, then all of them;
                        a slag barricade lifts from each way on as its hollow clears (the last is the cavern's hatch).
                        The Frozen Causeway: a lava channel blocks the far door; a frost reservoir (north) feeds a
                        T-junction, elbows west and east of it, a straight south of each, a cooling basin south of each
                        straight. Five pieces turn 90 degrees a use (random starting turns, the fixed solvable layout);
                        frost flows visibly through every joined piece, a disconnected outlet only mists. Both basins
                        flowing at once: the reservoir's valve lights; the pet releases the frost, and both halves of
                        the obsidian bridge latch for good. No monsters in the cavern; after a while a hint traces the
                        missing connection. Beyond: a frost shrine (heal, checkpoint) and the door to Fire Flan.
   CAL_STAGES.FOUNDRY   The Runebound Foundry: grated walkways over lava through four halls of an ancient forge (suspended
                        rings, broken chains, pressure vessels, runic machinery), each shut by a portcullis until its
                        waves are down: about forty brood. Furnace imps alone; runic sentinels alone; the bomb lesson
                        inside an ordinary pack (a bomb larva lands: hit the grounded bomb while it is safe and it flies
                        into a monster; it never hurts the pet); then all of them. The Three Rune Rings: three rings
                        (left, middle, right) each cycle Eye, Chain, Crown; the inscription reads EYE, CHAIN, CROWN; lever
                        A turns left+middle, B middle+right, C left+right, each joined to its two rings by drawn lines;
                        nearing a lever lights its rings. A reset lever, and a lectern that shows the next move
                        (breadth-first from the CURRENT state over the 27). Solved: the rings align into an iris, the
                        pressure door opens, a bass heartbeat sounds from beyond.
   CAL_STAGES.DESCENT   The Heartward Descent: a vertical cathedral of basalt columns, hanging obsidian slabs, lava
                        pouring down the walls and black crystals growing toward a throne. Three short causeways with
                        vents (each glows and hisses before it erupts; the first shows itself once, harmlessly); an
                        eruption throws you off the causeway: you land back on the last ledge, a little hurt. On the
                        three broad cooling ledges between them about forty brood rise in waves (ashen knights, crystal
                        wisps, the hollows' kin); a slag barricade lifts from the next causeway when a ledge is clear.
                        Then THE EMBER COURT: a round basalt platform ringed by six furnace idols on pillars in the lava.
                        First they throw: each idol glows and winds up (an aim line, or a landing circle for a lob), then
                        hurls a molten ball. Six DODGED throws (rolled through with the dodge button, or side-stepped close):
                        two slow teaching throws from the front (TAP DODGE!), a crossfire, a lob, a short volley. At six the
                        idols wake: they crack free of their pillars and stomp down onto the court two at a time (W and E,
                        then NW and SE, then NE and SW). Each winds up a charge at the pet (a red-orange lane, about a
                        second, locked 0.35 s before it goes); dodge as it reaches you (PERFECT DODGE!) or step aside, and
                        it carries on; if another idol is behind you it smashes into it: CRASH!, both crack. Two crashes
                        shatter an idol. Blows barely scratch them (never past a crack). The last two charge together. A
                        charge that hits only chips (8%), never the last point of health. All six shattered: the gate
                        opens on the overlook: Ifrit seated far off, and the frost shrine.
   Between rooms of brood the pet gets a breath of cool air (a quarter of its health back). HP_K scales the brood's health.
   Every trial ends at its door with a frost shrine (stand at it: full health, the checkpoint) before the boss.
   (CAL, the core of 20zz5, loads after this file: every CAL use is inside make(), which only runs once a stage starts, and
   each one is guarded: a missing helper, brood type or biome falls back to this file's own drawing and the Tower's brood) */
const CAL_STAGES = { HP_K: 1.5, DMG_K: { HOLLOWS: 0.55, FOUNDRY: 0.72, DESCENT: 0.88 } };   // (QA v386: DMG_K, the trials' brood blows by trial, ramping between the dungeons' 0.5 / 0.65 / 0.8 (they hit at full before))   // (HP_K: a balance knob on the trials' own brood health, for the lead's tuning pass)
(() => {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rgba = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${clamp(a, 0, 1)})`; };
  const ell = (c, x, y, rx, ry, a) => { c.beginPath(); c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), a || 0, 0, TAU); };
  const label = (c, s, x, y, size, col) => { if (!s) return; size = Math.max(10, size * 1.25); c.save(); c.font = `800 ${Math.round(size)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.7)'; c.fillStyle = col || '#FFFFFF'; c.strokeText(s, x, y); c.fillText(s, x, y); c.restore(); };
  const grid = (W, H, ch) => Array.from({ length: H }, () => Array(W).fill(ch));
  const alive = list => list.filter(m => !m.dead);
  const lwOf = T => Math.max(1.3, Math.min(3, T * 0.06));
  const poly = (c, pts) => { c.beginPath(); pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]))); };
  const tilesOf = (M, ch) => (M.marks[ch] || []).map(p => ({ tx: p.tx, ty: p.ty, x: p.x, y: p.y }));
  if (!DunWorld.PROPS.blank) DunWorld.PROPS.blank = () => {};
  const block = (X, tx, ty) => { X.M.props.set(ty * X.M.MW + tx, 'blank'); X.setTile(tx, ty, T_SOLID); };
  const unblock = (X, tx, ty, t) => { X.M.props.delete(ty * X.M.MW + tx); X.setTile(tx, ty, t == null ? T_FLOOR : t); };
  // (CAL is a const of the core file; reading it here, inside make(), is after it exists. A build without it yet: null)
  const CALR = () => { try { return typeof CAL !== 'undefined' ? CAL : null; } catch (e) { return null; } };
  const lowFx = () => { const C = CALR(); if (C && typeof C.lowFx === 'function') return !!C.lowFx(); return typeof st !== 'undefined' && st && !!st.lowFx; };
  /* the brood: the core's types where they exist, else the Tower's nearest kin (so a build without the core still plays) */
  const KIN = { cinderslug: 'magmite', basaltcrawler: 'golem', emberwisp: 'imp', furnaceimp: 'imp', runicsentinel: 'knight', bomblarva: 'bomb', ashenknight: 'knight', crystalwisp: 'wisp' };
  const MT = id => (MON[id] ? id : MON[KIN[id]] ? KIN[id] : 'blob');
  function spawnAt(X, type, p, list, pack, aggro) { const q = X.freeSpot(p.x, p.y, 0.5) || p; const m = X.spawnMon(MT(type), q.x, q.y, { pack, rift: true, aggro: !!aggro }); if (aggro) m.aggro = true; m.calType = type; const hk = CAL_STAGES.HP_K || 1; if (hk !== 1) { m.maxhp = (m.maxhp || m.hp) * hk; m.hp = m.maxhp; } X.g.total++; if (list) list.push(m); return m; }
  const chime = (X, f, k) => { if (X.sfx.chime) X.sfx.chime(f, k); };
  const FROST_CHIME = X => { chime(X, 1318, 0.7); X.after(0.09, () => chime(X, 1760, 0.5)); X.after(0.18, () => chime(X, 2093, 0.35)); };
  // the GPU painter (Nidhogg's, 20k6h): real fire and light where a real GPU draws; window.__CAL_GL = 0 keeps the 2D
  const fgx = () => { try { if (typeof window !== 'undefined' && (window.__CAL_GL === 0 || window.__DUN_GL === 0)) return null; const F = self.NIDHOGG_MOVES && self.NIDHOGG_MOVES.FGFX; return F && F.usable() ? F : null; } catch (e) { return null; } };
  function gpu(c, fn) { const F = fgx(); if (!F) return false; try { const Q = F.begin(c, null); fn(Q); F.flush(c); } catch (e) { return false; } return true; }
  /* a soft additive glow (no hard rim) */
  function glow(c, x, y, r, col, a) { if (!(r > 0.5) || !(a > 0.01)) return; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = clamp(a, 0, 1); blitSized(c, glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); }
  // a legend prop drawn by the core's props where they exist (looked up when the floor is made), else a Tower prop
  const PROP = (name, alt) => ({ get prop() { return DunWorld.PROPS[name] ? name : alt || 'volrok'; } });
  // (a layout tile's centre in the world: genRift frames the layout with one wall row and column)
  const Wp = (x, y) => ({ x: x + 1.5, y: y + 1.5 });

  /* ---- the palette (the core's where it has one) ---- */
  const PAL = { BASALT: '#2B2321', BASALT_HI: '#4E4440', BASALT_D: '#171211', ASH: '#7A6F69', LAVA: '#FF5A1A', LAVA_HI: '#FFC25A', LAVA_D: '#A8250C', FROST: '#A8E4FF', FROST_HI: '#F2FCFF', FROST_D: '#4E8FC4', IRON: '#3A383D', IRON_HI: '#77727A', IRON_D: '#1C1B1F', RUST: '#8E4B2B', RUNE: '#FFB347', RUNE_HI: '#FFE9B0', CRYS: '#1B1026', CRYS_HI: '#4A2C62', FRACT: '#FF5A2A', WARN: '#FF4D6D', INK: '#140E0D', GOLD: '#C99A4A' };
  const PAL_ALIAS = { CRYS: 'CRYSTAL', CRYS_HI: 'CRYSTAL_HI', FRACT: 'FRACTURE' };
  const pal = () => { const C = CALR(), o = Object.assign({}, PAL); if (C) for (const k in PAL) { const v = C[PAL_ALIAS[k] || k]; if (typeof v === 'string' && v[0] === '#' && k !== 'INK') o[k] = v; } return o; };

  /* ======================= shared art ======================= */
  /* the snowflake emblem of the frost machinery: six arms, each with two pairs of short branches */
  function snowflake(c, x, y, s, col, lw) { const C = CALR(); if (C && typeof C.snowflake === 'function') { C.snowflake(c, x, y, s * 2, col, lw); return; } c.save(); c.translate(x, y); c.strokeStyle = col; c.lineWidth = lw || Math.max(1.5, s * 0.1); c.lineCap = 'round'; c.beginPath();
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU - Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); c.moveTo(0, 0); c.lineTo(ca * s, sa * s);
      for (const k of [0.45, 0.72]) { const bx = ca * s * k, by = sa * s * k, b = s * (k < 0.5 ? 0.26 : 0.18); for (const sd of [-1, 1]) { const a2 = a + sd * 0.75; c.moveTo(bx, by); c.lineTo(bx + Math.cos(a2) * b, by + Math.sin(a2) * b); } } }
    c.stroke(); c.restore(); }
  /* a black fire crystal cluster: glossy black / deep violet shards, smouldering red-orange fractures, light circling inside,
     and now and then a pulse climbing toward the tips (they feed the heart) */
  function crystalArt(c, Xs, Ys, s, t, ph, P, k) { k = k == null ? 1 : k; { const C = CALR(); if (C && typeof C.crystalArt === 'function') { C.crystalArt(c, Xs, Ys, s, { ph: (t * 0.12 + ph) % 1, k: 0.4 * k, v: Math.floor(ph * 7), lw: lwOf(s / 1.5) }); return; } } const shards = [[-0.42, 0.55, -0.32], [0.38, 0.62, 0.28], [0, 1, 0.04], [-0.18, 0.72, -0.12], [0.2, 0.45, 0.5]];
    c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; ell(c, Xs, Ys, s * 0.62, s * 0.18); c.fill();
    const pulse = ((t * 0.35 + ph) % 1);
    for (const [ox, h, lean] of shards) { const bx = Xs + ox * s * 0.6, by = Ys, w = s * 0.17 * (0.7 + h * 0.5), H = s * h * 1.25, tx = bx + Math.sin(lean) * H, ty = by - Math.cos(lean) * H;
      const L = [bx - w, by], R = [bx + w, by], Lm = [bx - w * 0.9 + (tx - bx) * 0.62, by + (ty - by) * 0.62], Rm = [bx + w * 0.9 + (tx - bx) * 0.62, by + (ty - by) * 0.62];
      poly(c, [L, Lm, [tx, ty], Rm, R]); c.closePath(); const g = c.createLinearGradient(bx - w, 0, bx + w, 0); g.addColorStop(0, P.CRYS_HI); g.addColorStop(0.45, P.CRYS); g.addColorStop(1, '#07040A'); c.fillStyle = g; c.fill(); c.strokeStyle = '#05030A'; c.lineWidth = Math.max(1, s * 0.035); c.stroke();
      // the glossy edge highlight
      c.strokeStyle = 'rgba(210,180,255,.45)'; c.lineWidth = Math.max(1, s * 0.02); c.beginPath(); c.moveTo(Lm[0] + w * 0.25, Lm[1]); c.lineTo(tx, ty); c.stroke();
      // the fracture inside, smouldering, with a pulse climbing it
      const fx = (u, j) => [bx + (tx - bx) * u + Math.sin(u * 9 + ox * 7) * w * 0.35, by + (ty - by) * u];
      c.strokeStyle = rgba(P.FRACT, 0.55 + 0.25 * k); c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); for (let i = 0; i <= 6; i++) { const q = fx(0.08 + i / 6 * 0.8); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); } c.stroke();
      if (k > 0.05) { const q = fx(0.08 + pulse * 0.8); glow(c, q[0], q[1], s * 0.28, P.FRACT, 0.55 * k * Math.sin(pulse * Math.PI)); } }
    c.restore(); }
  /* a frost shrine: the recovery station before each boss (a basalt cup, a white-blue frost crystal, the snowflake) */
  function shrineArt(c, Xs, Ys, T, P, k, t) { const lw = lwOf(T); c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; ell(c, Xs, Ys + T * 0.05, T * 0.85, T * 0.3); c.fill();
    // the plinth
    poly(c, [[Xs - T * 0.7, Ys], [Xs - T * 0.55, Ys - T * 0.75], [Xs + T * 0.55, Ys - T * 0.75], [Xs + T * 0.7, Ys]]); c.closePath(); const g = c.createLinearGradient(Xs - T * 0.7, 0, Xs + T * 0.7, 0); g.addColorStop(0, P.BASALT_HI); g.addColorStop(1, P.BASALT_D); c.fillStyle = g; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
    ell(c, Xs, Ys - T * 0.75, T * 0.58, T * 0.2); c.fillStyle = '#3A3230'; c.fill(); c.stroke();
    // the crystal
    const cy = Ys - T * 0.8, h = T * 1.25 * (1 + 0.03 * Math.sin(t * 2)); poly(c, [[Xs - T * 0.28, cy], [Xs - T * 0.2, cy - h * 0.7], [Xs, cy - h], [Xs + T * 0.22, cy - h * 0.66], [Xs + T * 0.28, cy]]); c.closePath();
    const cg = c.createLinearGradient(Xs - T * 0.3, cy - h, Xs + T * 0.3, cy); cg.addColorStop(0, P.FROST_HI); cg.addColorStop(0.5, P.FROST); cg.addColorStop(1, P.FROST_D); c.fillStyle = cg; c.fill(); c.strokeStyle = '#21486B'; c.lineWidth = lw * 0.8; c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(Xs, cy - h); c.lineTo(Xs - T * 0.04, cy - T * 0.1); c.stroke();
    snowflake(c, Xs, Ys - T * 0.38, T * 0.2, P.FROST_HI, Math.max(1.2, T * 0.035));
    c.restore(); glow(c, Xs, cy - h * 0.5, T * (1.1 + 0.3 * k), P.FROST, 0.25 + 0.35 * k); }
  /* the recovery station: stand at it for full health; it marks the checkpoint before the boss */
  function station(X, H, p, P, boss) { const C = CALR();
    if (C && typeof C.recoveryStation === 'function') { const R = C.recoveryStation(X, H, p.x, p.y, { label: 'Frost spring: stand still to recover' }), u0 = R.obj.use; R.k = 0;
      R.obj.use = o => { const was = R.used; u0(o); if (!was && R.used) X.banner('CHECKPOINT', `Your pet is restored. ${boss} waits beyond the door`, P.FROST_HI, 2.6, true); }; R.tick = () => {}; return R; }
    const S = { used: 0, k: 0 }; S.obj = H.obj({ x: p.x, y: p.y, kind: 'calshrine', r: 0.8, h: 2.6, label: () => S.used ? 'FROST SHRINE · RESTORED' : 'FROST SHRINE: REST HERE',
      draw(c, Xs, Ys, T) { shrineArt(c, Xs, Ys, T, P, S.k, X.g.t); },
      use() { const ST = X.ST(); X.heal(ST.hp, false); if (X.gainMP) X.gainMP(50); S.used++; S.k = 1; FROST_CHIME(X); X.ring(p.x, p.y, 0.3, 2.2, 0.5, P.FROST_HI, 0.4);
        X.banner('CHECKPOINT', `Your pet is restored. ${boss} waits beyond the door`, P.FROST_HI, 2.6, true); } });
    S.tick = dt => { S.k = Math.max(0, S.k - dt * 0.6); }; return S; }

  /* ---- (v389 S) fire vents everywhere: fifteen trap vents in each trial (most where the brood is fought) and fifteen in the
     Glass Heart dungeon (20zz5's dungeonExtra calls CAL_STAGES.dungeonVents). They are the core's own vents (CAL.vent: the
     crusted mouth with radial cracks that glows and hisses, then a tall jet of flame; a hit is 8% and a shove, a dodge roll
     passes through), with staggered periods and phases so they never fire together. Only those near the pet run (within 13
     tiles; a far one finishes its cycle and parks), so no hiss or shake comes from off the screen. The first one met shows
     itself once, harmlessly ("SAFE TO WATCH"), with a banner ---- */
  function ventField(X, pts, o) { o = o || {}; const C = CALR(); if (!C || typeof C.vent !== 'function' || !pts.length) return { vents: [], tick() {} };
    const me = X.me, dmg = Math.max(1, Math.round(X.ST().hp * 0.08)), F = { vents: [], taught: !o.teach, demo: null, said: false };
    pts.forEach((p, i) => { const h = ((i * 2654435761) >>> 0) / 4294967296, period = 4.6 + h * 2.2, v = C.vent(X, { x: p.x, y: p.y, r: 1.0, period, warn: 1.6, erupt: 0.9, dmg, phase: (i * 0.618 % 1) * period }); v.calS = true; v.on = false; F.vents.push(v); });
    F.tick = dt => { if (me.dead) return; for (const v of F.vents) v.on = Math.hypot(me.x - v.x, me.y - v.y) < 13;
      if (!F.taught) { if (!F.demo) { let b = null, bd = 7.5; for (const v of F.vents) { const d = Math.hypot(me.x - v.x, me.y - v.y); if (d < bd && d > 2.2) { bd = d; b = v; } } if (b) { F.demo = b; b.demo = true; b.st = 'idle'; b.t = Math.max(0, b.period - b.warn - 0.6); b.n0 = b.n; } }
        else { const v = F.demo; if (v.st === 'warn' && !F.said) { F.said = true; X.banner('FIRE VENTS', 'Each one glows and hisses before it erupts: step off it, or roll through the blast', P_LAVA_HI, 3, true); X.text(v.x, v.y - 1.8, 'Watch the vent…', P_LAVA_HI, 15); }
          if (v.n > v.n0 && v.st === 'idle') { v.demo = false; F.taught = true; } } } };
    return F; }
  const P_LAVA_HI = '#FFC25A';
  /* where a trial's vents go: plain floor (the tile and its eight neighbours all '.'), in the given layout rows, `n` per region,
     at least 3.5 tiles apart, never within the given keep-out circles (spawn, doors, shrines, respawn spots). Deterministic */
  function pickVents(layout, regions, avoid) { const out = [], ok = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const r = layout[y + dy]; if (!r || r[x + dx] !== '.') return false; } return true; };
    for (const R of regions) { const cand = []; for (let y = R.y0; y <= R.y1; y++) for (let x = R.x0 || 1; x <= (R.x1 || layout[0].length - 2); x++) if (ok(x, y)) cand.push([x, y, ((x * 73856093) ^ (y * 19349663)) >>> 0]);
      // (spread out: each next is the candidate farthest (up to 5.5 tiles; then the first in a fixed scrambled order) from those placed)
      cand.sort((a, b) => a[2] - b[2]); const pool = cand.map(([x, y]) => Wp(x, y)).filter(w => !avoid.some(([ax, ay, ar]) => Math.hypot(w.x - ax, w.y - ay) < ar));
      for (let n = 0; n < R.n && pool.length; n++) { let bi = -1, bd = -1; for (let i = 0; i < pool.length; i++) { const w = pool[i], d0 = out.length ? Math.min(...out.map(q => Math.hypot(q.x - w.x, q.y - w.y))) : 99, d = Math.min(d0, 5.5); if (d0 >= 3.5 && d > bd) { bd = d; bi = i; } } if (bi < 0) break; out.push(pool.splice(bi, 1)[0]); } }
    return out; }
  /* the Glass Heart's vents: spread through the generated dungeon's rooms, round-robin, on plain floor away from the start,
     the exit's room centre and every prop */
  CAL_STAGES.dungeonVents = function (X, n) { try { const M = X.M, MW = M.MW, G = M.G, out = [], props = X.props || [], st = M.start;
      let ex = null, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = Math.hypot(cx - st.x, cy - st.y); if (d > best) { best = d; ex = { x: cx, y: cy }; } }
      const floor = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = (y + dy) * MW + x + dx; if (G[k] !== T_FLOOR || M.props.has(k)) return false; } return true; };
      const lists = M.rooms.map(r => { const c = []; for (let y = r.y + 1; y < r.y + r.h - 1; y++) for (let x = r.x + 1; x < r.x + r.w - 1; x++) if (floor(x, y)) c.push([x + 0.5, y + 0.5, ((x * 73856093) ^ (y * 19349663)) >>> 0]); c.sort((a, b) => a[2] - b[2]); return c; });
      const good = (x, y) => Math.hypot(x - st.x, y - st.y) > 4.5 && (!ex || Math.hypot(x - ex.x, y - ex.y) > 3.5) && !props.some(p => Math.abs(p.x - x) < 1.6 && Math.abs(p.y - y) < 1.8) && !out.some(q => Math.hypot(q.x - x, q.y - y) < 4);
      for (let pass = 0; pass < 6 && out.length < n; pass++) for (const c of lists) { if (out.length >= n) break; const i = c.findIndex(([x, y]) => good(x, y)); if (i >= 0) { const [x, y] = c.splice(i, 1)[0]; out.push({ x, y }); } }
      return ventField(X, out, { teach: true }); } catch (e) { return { vents: [], tick() {} }; } };
  CAL_STAGES.ventField = ventField;

  /* ---- lava runnels: narrow molten streams on the floor (walkable tiles drawn as lava). Touching one: a modest burn and back
     to the last safe ground (never death). The core's own rule is used where it has one (CAL.lavaContact(X, back)) ---- */
  function runnels(X, tiles, P) { const me = X.me, set = new Set(tiles.map(t => t.ty * X.M.MW + t.tx)); let safe = { x: me.x, y: me.y }, hurtT = 0, burns = 0;
    { const C = CALR(); if (C && typeof C.lavaTiles === 'function' && typeof C.ctx === 'function') { const pool = C.lavaTiles(X, tiles), st0 = C.ctx(X).stat; return { set, pool, core: true, get burns() { return st0.lavaTouches; }, tick() {}, drawGround() {}, drawOver() {} }; } }
    const onLava = (x, y, r) => { for (const [dx, dy] of [[0, 0], [r, 0], [-r, 0], [0, r * 0.6], [0, -r * 0.6]]) if (set.has(Math.floor(y + dy) * X.M.MW + Math.floor(x + dx))) return true; return false; };
    const nearLava = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (set.has((Math.floor(y) + dy) * X.M.MW + Math.floor(x) + dx)) return true; return false; };
    // the runs (for drawing): horizontal and vertical stretches of runnel tiles
    const runs = []; { const seen = new Set(); for (const t of tiles.slice().sort((a, b) => a.ty - b.ty || a.tx - b.tx)) { const k = t.ty * X.M.MW + t.tx; if (seen.has(k)) continue; let n = 0; while (set.has(k + n)) { seen.add(k + n); n++; }
        if (n > 1) runs.push({ x0: t.tx, x1: t.tx + n, y: t.ty + 0.5, h: true }); else { let m = 0; while (set.has(k + m * X.M.MW)) { seen.add(k + m * X.M.MW); m++; } runs.push({ x: t.tx + 0.5, y0: t.ty, y1: t.ty + m, h: false }); } } }
    return { set, runs, get burns() { return burns; }, get safe() { return safe; },
      tick(dt) { hurtT = Math.max(0, hurtT - dt); if (me.dead) return;
        if (!onLava(me.x, me.y, (me.r || 0.35) * 0.55)) { if (!nearLava(me.x, me.y)) safe = { x: me.x, y: me.y }; return; }
        if (hurtT > 0) return; hurtT = 0.8; burns++;
        const C = CALR(); if (C && typeof C.lavaContact === 'function') { try { C.lavaContact(X, safe); return; } catch (e) {} }
        X.hurtPet(X.ST().hp * 0.08, null, { lava: true }); me.x = safe.x; me.y = safe.y; me.vx = me.vy = 0; me.inv = Math.max(me.inv || 0, 0.6);
        X.text(me.x, me.y - 1.3, 'Too hot! Back to safe ground', P.LAVA_HI, 14); X.boom(me.x, me.y, 0.8, P.LAVA, P.LAVA_HI, { n: 8, shake: 2 }); if (X.sfx.hiss) X.sfx.hiss(0.35, 0.18, 900); },
      drawGround(c) { const T = X.Tz(), t = X.g.t, vis = r => { const a = X.sx(r.h ? r.x0 : r.x - 0.5), b = X.sy(r.h ? r.y - 0.5 : r.y0); return a < X.W() + T * 30 && b < X.H() + T * 30; };
        for (const r of runs) { if (!vis(r)) continue; const x0 = X.sx(r.h ? r.x0 : r.x - 0.5), y0 = X.sy(r.h ? r.y - 0.5 : r.y0), w = (r.h ? r.x1 - r.x0 : 1) * T, h = (r.h ? 1 : r.y1 - r.y0) * T;
          c.save(); c.fillStyle = P.BASALT_D; c.fillRect(x0, y0, w, h);
          // the molten core between crusted banks
          const inset = T * 0.18; const g = r.h ? c.createLinearGradient(0, y0, 0, y0 + h) : c.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, P.LAVA_D); g.addColorStop(0.5, P.LAVA_HI); g.addColorStop(1, P.LAVA_D); c.fillStyle = g;
          c.beginPath(); if (r.h) c.rect(x0, y0 + inset, w, h - inset * 2); else c.rect(x0 + inset, y0, w - inset * 2, h); c.fill();
          // flowing bright skins on it
          c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,230,160,.5)'; const L = r.h ? w : h; for (let i = 0; i < L / T * 1.6; i++) { const u = ((i * 0.618 + t * 0.22) % 1), s = T * (0.25 + 0.2 * ((i * 0.37) % 1)); if (r.h) { ell(c, x0 + u * w, y0 + h / 2 + Math.sin(i * 2.3) * h * 0.12, s, h * 0.1); } else { ell(c, x0 + w / 2 + Math.sin(i * 2.3) * w * 0.12, y0 + u * h, w * 0.1, s); } c.fill(); }
          c.globalCompositeOperation = 'source-over';
          // crust bits on the banks
          c.fillStyle = 'rgba(40,24,20,.85)'; for (let i = 0; i < L / T * 2; i++) { const u = (i * 0.391) % 1, s = T * 0.09; if (r.h) ell(c, x0 + u * w, y0 + (i % 2 ? inset * 0.9 : h - inset * 0.9), s * 1.6, s); else ell(c, x0 + (i % 2 ? inset * 0.9 : w - inset * 0.9), y0 + u * h, s, s * 1.6); c.fill(); }
          c.restore(); }
        gpu(c, Q => { for (const r of runs) { const ax = X.sx(r.h ? r.x0 : r.x), ay = X.sy(r.h ? r.y : r.y0), bx = X.sx(r.h ? r.x1 : r.x), by = X.sy(r.h ? r.y : r.y1); Q.firebeam(ax, ay, bx, by, T * 0.32, 0.72, 0.7, (r.x0 || r.x) * 0.37, 1.2); } }); },
      drawOver(c) { const T = X.Tz(); if (lowFx()) return; for (const r of runs) { const n = Math.ceil(r.h ? r.x1 - r.x0 : r.y1 - r.y0); for (let i = 0; i < n; i += 2) { const x = r.h ? r.x0 + i + 0.5 : r.x, y = r.h ? r.y : r.y0 + i + 0.5; glow(c, X.sx(x), X.sy(y), T * 1.1, P.LAVA, 0.18); } } } };
  }

  /* ---- a heavy door across a run of tiles: shut, it blocks them; open1() sinks it into the floor ---- */
  /* (v388: the door glitch. open1 used to call X.retile(), which throws away every painted ground chunk; the engine repaints
     at most three a frame, so for several frames whole squares of the floor were missing round an opening door. A shut door's
     tiles are solid under a blank prop, which the ground painter already draws as plain floor, so nothing on the ground changes
     when they open: no repaint is needed. The door's own art carries the opening (o.dur seconds, eased), with dust and sparks) */
  function doorway(X, H, tiles, art, o) { o = o || {}; const x0 = Math.min(...tiles.map(t => t.tx)), x1 = Math.max(...tiles.map(t => t.tx)) + 1, y0 = Math.min(...tiles.map(t => t.ty)), y1 = Math.max(...tiles.map(t => t.ty)) + 1, D = { k: 0, u: 0, open: false, tiles, x0, x1, y0, y1 };
    D.obj = H.obj({ x: (x0 + x1) / 2, y: y1 + 0.02, kind: o.kind || 'caldoor', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { art(c, Xs, Ys, T, D); } });
    D.open1 = () => { if (D.open) return; D.open = true; tiles.forEach(t => unblock(X, t.tx, t.ty, o.tile)); X.shake(lowFx() ? 1.5 : 3, 0.35); if (X.sfx.crash) X.sfx.crash(); if (o.onOpen) o.onOpen(D); };
    D.tick = dt => { if (!D.open || D.u >= 1) return; D.u = Math.min(1, D.u + dt / (o.dur || 1.4)); D.k = D.u * D.u * (3 - 2 * D.u); if (o.fx && !lowFx()) o.fx(D, dt); };
    tiles.forEach(t => block(X, t.tx, t.ty)); return D; }
  /* the camera. Fights and walking keep the dungeons' own close zoom (1); while the pet is actually solving a puzzle (in its
     area, unsolved) it eases out to a frame of the whole puzzle, and back in when it leaves or the puzzle is done. The engine
     eases the zoom itself (about 0.7 s); the pull toward the frame (k) is eased here over the same time, so nothing snaps.
     want: null (close) or { zoom, x, y, k } */
  function camRig() { const R = { k: 0, x: 0, y: 0, zoom: 1, want: null };
    R.tick = (dt, want) => { R.want = want; if (want) { R.x = want.x; R.y = want.y; } const tk = want ? want.k : 0, step = dt / 0.7; R.k = tk > R.k ? Math.min(tk, R.k + step) : Math.max(tk, R.k - step); R.zoom = want ? want.zoom : 1; };
    R.cam = () => ({ x: R.x, y: R.y, k: R.k * R.k * (3 - 2 * R.k), zoom: R.zoom }); return R; }
  /* small arrows at the screen's edge toward puzzle pieces that are off it: [{ x, y, col, label, warn }] (the core draws the
     one hint arrow; these are the rest, smaller) */
  function edgeMarks(X, c, list) { const W = X.W(), Hh = X.H(), cx = W / 2, cy = Hh / 2 - 20, t = X.g.t;
    for (const q of list) { const Xs = X.sx(q.x), Ys = X.sy(q.y); if (Xs > 24 && Xs < W - 24 && Ys > 110 && Ys < Hh - 170) continue;
      const dx = Xs - cx, dy = Ys - cy, a = Math.atan2(dy, dx), bx = W / 2 - 26, by = Hh / 2 - 150, k = Math.min(Math.abs(bx / (dx || 1e-6)), Math.abs(by / (dy || 1e-6))), ex = cx + dx * k, ey = cy + dy * k, pul = q.warn ? 1 + 0.18 * Math.sin(t * 14) : 1;
      c.save(); c.translate(ex, ey); c.globalAlpha = 0.92; c.fillStyle = q.col; c.strokeStyle = '#1A1218'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 11 * pul, 0, TAU); c.fill(); c.stroke(); c.rotate(a); c.fillStyle = '#1A1218'; c.beginPath(); c.moveTo(7, 0); c.lineTo(-3, -5.5); c.lineTo(-3, 5.5); c.closePath(); c.fill(); c.restore();
      if (q.label) label(c, q.label, ex, ey + (ey > Hh / 2 ? -17 : 25), 8.5, q.warn ? '#FFD0B0' : '#FFFFFF'); } }

  /* ---- a gate across a corridor between two rooms of brood: a barricade of cooling slag (style 'slag') or an iron
     portcullis (style 'iron'), lifted once its room's waves are down ---- */
  function gateArt(c, Xs, Ys, T, D, P, style, word, t) { const w = (D.x1 - D.x0) * T, L = Xs - w / 2; t = t || 0; if (D.k >= 1) return; c.save();
    if (style === 'iron') { const hgt = T * 2.3, lift = D.k * T * 2.6; c.fillStyle = P.IRON_D; c.fillRect(L - T * 0.3, Ys - T * 3.0, T * 0.3, T * 3.0); c.fillRect(L + w, Ys - T * 3.0, T * 0.3, T * 3.0);
      c.beginPath(); c.rect(L, Ys - T * 3.2, w, T * 3.2); c.clip(); const top = Ys - hgt - lift, bot = Ys - lift;
      c.strokeStyle = P.INK; c.lineWidth = Math.max(4, T * 0.16); for (let i = 0; i <= Math.round(w / (T * 0.5)); i++) { const x = L + i * w / Math.round(w / (T * 0.5)); c.beginPath(); c.moveTo(x, top); c.lineTo(x, bot); c.stroke(); }
      c.strokeStyle = P.IRON_HI; c.lineWidth = Math.max(2, T * 0.08); for (let i = 0; i <= Math.round(w / (T * 0.5)); i++) { const x = L + i * w / Math.round(w / (T * 0.5)); c.beginPath(); c.moveTo(x, top); c.lineTo(x, bot - T * 0.1); c.stroke(); }
      for (const u of [0.2, 0.62]) { c.fillStyle = P.IRON; c.fillRect(L, top + hgt * u, w, T * 0.18); c.strokeStyle = P.INK; c.lineWidth = 1.5; c.strokeRect(L, top + hgt * u, w, T * 0.18); c.fillStyle = rgba(P.RUNE, 0.65 + 0.3 * Math.sin(t * 2)); for (let i = 0; i < 4; i++) c.fillRect(L + w * (0.15 + i * 0.22), top + hgt * u + T * 0.06, T * 0.12, T * 0.06); } }
    else { const hgt = T * 1.6 * (1 - D.k); for (let i = 0; i < Math.ceil(w / (T * 0.7)); i++) { const x = L + (i + 0.5) * T * 0.7, r = T * (0.45 + 0.12 * Math.sin(i * 2.7)), y = Ys - r * 0.6 - (i % 2) * T * 0.25; ell(c, x, y, r, r * 0.8 * (hgt / (T * 1.6))); const sg = c.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r); sg.addColorStop(0, '#5A4A44'); sg.addColorStop(1, '#1A1210'); c.fillStyle = sg; c.fill(); c.strokeStyle = P.INK; c.lineWidth = 1.5; c.stroke();
        c.strokeStyle = rgba(P.LAVA, 0.6 + 0.3 * Math.sin(t * 2 + i)); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - r * 0.5, y); c.lineTo(x, y - r * 0.3); c.lineTo(x + r * 0.4, y + r * 0.1); c.stroke(); } }
    c.restore(); if (!D.open && word) label(c, word, Xs, Ys - T * (style === 'iron' ? 3.3 : 2.0), T * 0.2, '#FFD9B0'); }
  /* while a gate opens: slag hisses and drips embers as it melts down; a portcullis throws sparks from its grooves as it rises */
  function gateFx(X, P, style) { return (D, dt) => { const n = Math.random() < dt * (style === 'iron' ? 10 : 16) ? 1 : 0; if (!n || D.u > 0.92) return; const x = D.x0 + Math.random() * (D.x1 - D.x0), y = D.y1 - 0.1;
      if (style === 'iron') { const sd = Math.random() < 0.5 ? D.x0 : D.x1; X.part({ kind: 'spark', x: sd, y: y - 1.2 - D.k * 1.6, vx: (sd === D.x0 ? 1 : -1) * (0.5 + Math.random()), vy: -1 - Math.random() * 1.5, life: 0.4, max: 0.4, size: 3, color: P.RUNE_HI }); }
      else { X.part({ kind: 'ember', x, y: y - 0.3, vx: (Math.random() - 0.5) * 0.8, vy: -1.2 - Math.random() * 1.4, life: 0.6, max: 0.6, size: 4, color: P.LAVA_HI }); if (Math.random() < 0.4) X.part({ kind: 'smoke', x, y: y - 0.4, vx: 0, vy: -0.6, life: 0.9, max: 0.9, size: 0.5, color: '#6A5E58' }); } }; }
  const roomGate = (X, H, tiles, P, style, word) => tiles.length ? doorway(X, H, tiles, (c, Xs, Ys, T, D) => gateArt(c, Xs, Ys, T, D, P, style, word, X.g.t), { kind: 'calgate', dur: style === 'iron' ? 1.5 : 1.3, fx: gateFx(X, P, style), onOpen() { if (style !== 'iron' && X.sfx.hiss) X.sfx.hiss(0.9, 0.1, 1200); } }) : null;
  /* ---- the wave director: rooms of brood in order. A room's first wave rises when the pet walks in, the next when the last
     is down (a breath between), and its gate lifts when its last wave falls. rooms: [{ name, y0, y1 (world rows the pet
     must be inside), spots: [{ x, y }], waves: [[type, ...]], gate (a doorway, lifted on clear), teach: ['banner sub' per
     wave], special(type, p) (makes a non-brood entry, e.g. the tutorial bomb) }] ---- */
  function director(X, P, rooms, o) { o = o || {}; const me = X.me, D = { rooms, i: 0, wave: -1, live: [], all: [], gapT: 0, done: !rooms.length, total: 0, waves: 0 };
    for (const R of rooms) for (const w of R.waves) D.total += w.length;
    function spawnWave(R, w) { const types = R.waves[w]; D.live = []; D.waves++; const pack = 940 + D.i * 10 + w;
      types.forEach((ty, j) => { const p = R.spots[(j + w * 3) % R.spots.length], a = j * 2.4 + w, q = { x: p.x + Math.cos(a) * 0.6 * (j >= R.spots.length ? 1 : 0), y: p.y + Math.sin(a) * 0.6 * (j >= R.spots.length ? 1 : 0) };
        const m = R.special && R.special(ty, q, pack) || spawnAt(X, ty, q, null, pack, true); if (!m) return; if (o.dmgK && !m.calTutorial) m.dmg *= o.dmgK; m.calRoom = D.i; D.live.push(m); D.all.push(m);
        if (!m.calTutorial) { X.boom(m.x, m.y, 0.8, o.col || P.LAVA, P.ASH, { n: 8, shake: 1 }); for (let k = 0; k < 4; k++) X.part({ kind: 'ember', x: m.x + (Math.random() - 0.5) * 0.6, y: m.y - 0.1, vx: (Math.random() - 0.5) * 1.5, vy: -2 - Math.random() * 2, life: 0.6, max: 0.6, size: 4, color: P.LAVA_HI }); } });
      const t = R.teach && R.teach[w]; X.banner(w === 0 ? R.name.toUpperCase() : `WAVE ${w + 1} OF ${R.waves.length}`, t || `${types.length} more rise from the rock`, o.col || P.LAVA_HI, 2.6, true); if (X.sfx.crash) X.sfx.crash(); }
    D.room = () => rooms[D.i] || null;
    D.left = () => { let n = alive(D.all).length; for (let i = D.i; i < rooms.length; i++) rooms[i].waves.forEach((w, k) => { if (i > D.i || k > D.wave) n += w.length; }); return n; };
    D.killed = () => D.all.filter(m => m.dead).length;
    D.tick = dt => { if (D.done) return; const R = rooms[D.i]; if (D.wave < 0) { if (me.y >= R.y0 && me.y <= R.y1 && !me.dead) { D.wave = 0; D.gapT = 0; spawnWave(R, 0); } return; }
      // (a flier that drifts out over the lava or the drop, beyond the pet's reach, is drawn back over the room)
      for (const m of D.live) { if (m.dead) continue; const tl = X.tileAt(Math.floor(m.x), Math.floor(m.y)); if (tl === T_GAP || tl === T_SOLID || m.y < R.y0 - 1.5 || m.y > R.y1 + 1.5) { m.offT = (m.offT || 0) + dt; if (m.offT > 1.0) { const c = R.spots[2], dx = c.x - m.x, dy = (R.y0 + R.y1) / 2 - m.y, d = Math.hypot(dx, dy) || 1; m.x += dx / d * 4.5 * dt; m.y += dy / d * 4.5 * dt; } /* (QA v386: 1.5 s, 3/s -> 1 s, 4.5/s: back over the floor within about 3 s) */ } else m.offT = 0; }
      if (alive(D.live).length) return; D.gapT += dt; if (D.gapT < (o.gap || 1.4)) return; D.gapT = 0; D.wave++;
      if (D.wave < R.waves.length) { spawnWave(R, D.wave); return; }
      if (R.gate) R.gate.open1(); X.banner(`${R.name.toUpperCase()} IS CLEAR`, R.clear || 'The way on opens', P.FROST_HI, 2.2, true);
      // (a breather between rooms: forty brood is a long fight for a level-1 pet)
      if (!me.dead && o.heal !== 0) { const hp = X.ST().hp, n = hp * (o.heal || 0.25); if (me.hp < hp - 1) { X.heal(n, true); X.text(me.x, me.y - 1.5, `A breath of cool air: +${Math.round(Math.min(n, hp - me.hp))}`, P.FROST_HI, 14); X.ring(me.x, me.y, 0.2, 1.2, 0.35, P.FROST, 0.3); } } if (o.onRoom) o.onRoom(R, D.i); D.i++; D.wave = -1; if (D.i >= rooms.length) { D.done = true; if (o.onDone) o.onDone(); } };
    D.goal = () => { const R = rooms[D.i]; if (!R) return ''; if (D.wave < 0) return `On to ${R.name} · ${D.left()} of the brood left`; return `${R.name} · wave ${Math.min(D.wave + 1, R.waves.length)}/${R.waves.length} · ${alive(D.live).length} here · ${D.left()} left`; };
    D.hint = () => { const R = rooms[D.i]; if (!R) return null; if (D.wave < 0) { const p = R.spots[0]; return Math.hypot(p.x - me.x, p.y - me.y) > 6 ? { x: p.x, y: (R.y0 + R.y1) / 2, h: 1.2, label: R.name.toUpperCase() } : null; }
      const m = alive(D.live).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; return m && Math.hypot(m.x - me.x, m.y - me.y) > 8 ? { x: m.x, y: m.y, h: 1.3, label: 'THE BROOD' } : null; };
    return D; }
  /* the walls round the rooms dressed with the core's props: every so often, a wall tile beside open floor (never by a gate,
     a door or a narrow corridor) takes the next prop of the cycle */
  function dress(g, cycle, every, seed) { const H = g.length, W = g[0].length, isF = ch => ch !== '#' && ch !== '~' && !(ch >= '0' && ch <= '9'), bad = ch => (ch >= '0' && ch <= '9') || ch === 'h' || ch === 'E' || ch === 'D' || ch === 'S'; let n = 0;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { if (g[y][x] !== '#') continue; let f = 0, b = false; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const r = g[y + dy]; const ch = r && r[x + dx]; if (ch == null) continue; if (isF(ch)) f++; if (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && bad(ch)) b = true; }
      const adj = isF(g[y - 1][x]) || isF(g[y + 1][x]) || isF(g[y][x - 1]) || isF(g[y][x + 1]); if (!adj || b || f < 9) continue; const hsh = ((x * 73856093) ^ (y * 19349663) ^ seed) >>> 0; if (hsh % every) continue; g[y][x] = cycle[n++ % cycle.length]; } }

  /* ======================= THE ASHEN HOLLOWS ======================= */
  /* rows from the top: the far landing (door, shrine) · the lava channel and the obsidian bridge · the maintenance cavern with
     the causeway's pieces · the hatch · chamber 2 · a corridor · chamber 1 (a lava runnel across it) · the ramp · the start
     ledge in a lava field with crystal islands */
  const HO_W = 31, HO_H = 98, HO_CX = 15;
  // the four hollows (layout rows, top to bottom of each) and their brood's places; the gates between them
  const HO_ROOMS = [{ name: 'The First Hollow', r0: 73, r1: 84, spots: [[10, 76], [20, 76], [15, 75], [9, 81], [21, 81]] },
    { name: 'The Crawler Den', r0: 57, r1: 68, spots: [[9, 61], [21, 61], [15, 59], [10, 65], [20, 65], [15, 63]] },
    { name: 'The Ember Gallery', r0: 41, r1: 52, spots: [[9, 44], [21, 44], [15, 43], [10, 49], [20, 49]] },
    { name: 'The Great Hollow', r0: 23, r1: 36, spots: [[7, 26], [24, 26], [10, 25], [20, 25], [15, 24], [9, 32], [21, 32], [15, 30]] }];
  const HO_LAYOUT = (() => { const g = grid(HO_W, HO_H, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    const oval = (cx, cy, rx, ry, ch) => { for (let y = 0; y < HO_H; y++) for (let x = 0; x < HO_W; x++) if (Math.pow((x + 0.5 - cx) / rx, 2) + Math.pow((y + 0.5 - cy) / ry, 2) < 1) g[y][x] = ch || '.'; };
    // the lava field round the start ledge (the panorama), with crystal islands
    oval(15.5, 92, 15, 9, '~'); rect(1, 86, 29, 97, '~'); oval(15.5, 92.5, 7.6, 4.6); rect(13, 83, 17, 89);
    rect(12, 94, 18, 96); g[94][15] = 'S';
    for (const [x, y] of [[3, 89], [26, 88], [22, 97], [8, 97]]) g[y][x] = 'C'; for (const [x, y] of [[5, 95], [26, 94], [11, 97]]) g[y][x] = 'G'; for (const [x, y] of [[7, 87], [23, 85], [6, 93], [25, 91]]) g[y][x] = 'Y';
    // the four hollows, their runnels and streams, the corridors and gates between them
    oval(15.5, 78.5, 9.5, 5.6); for (let x = 6; x <= 25; x++) if (g[79][x] === '.') g[79][x] = 'r'; for (const x of [14, 15, 16]) g[79][x] = '.'; for (let y = 75; y <= 78; y++) if (g[y][24] === '.' && g[y][23] === '.') g[y][24] = 'r';
    rect(13, 68, 17, 73); for (const x of [14, 15, 16]) g[70][x] = '1'; g[70][13] = '#'; g[70][17] = '#';
    oval(15.5, 62.5, 11, 5.6); for (let y = 60; y <= 65; y++) { if (g[y][6] === '.') g[y][6] = 'r'; if (g[y][25] === '.') g[y][25] = 'r'; }
    rect(13, 52, 17, 57); for (const x of [14, 15, 16]) g[54][x] = '2'; g[54][13] = '#'; g[54][17] = '#';
    oval(15.5, 46.5, 10.5, 5.8); for (let x = 3; x <= 28; x++) if (g[46][x] === '.' && (x < 8 || x > 23)) g[46][x] = 'r';
    rect(13, 36, 17, 41); for (const x of [14, 15, 16]) g[38][x] = '3'; g[38][13] = '#'; g[38][17] = '#';
    oval(15.5, 29.5, 13, 7); for (let x = 2; x <= 29; x++) if (g[29][x] === '.' && (x < 7 || x > 24)) g[29][x] = 'r';
    // the hatch, and the maintenance cavern
    rect(13, 20, 17, 22); for (const x of [14, 15, 16]) g[21][x] = 'h'; g[21][13] = '#'; g[21][17] = '#';
    rect(5, 7, 25, 19); for (const [x, y] of [[5, 7], [25, 7], [5, 19], [25, 19], [6, 19], [24, 19]]) g[y][x] = '#';
    // the lava channel across the cavern's north, the bridge's tiles, the far landing
    rect(1, 3, 29, 6, '~'); for (let y = 3; y <= 6; y++) for (let x = 12; x <= 17; x++) g[y][x] = 'b'; rect(9, 0, 21, 2); g[1][15] = 'E'; g[1][11] = 'F';
    // the causeway (reservoir, T, elbows, straights, basins), three tiles apart
    g[8][15] = 'Q'; g[11][15] = 'J'; g[11][12] = 'K'; g[11][18] = 'k'; g[14][12] = 'I'; g[14][18] = 'V'; g[17][12] = 'U'; g[17][18] = 'u';
    // frost machinery in the cavern; black crystals, columns, glass and ash round the hollows
    for (const [x, y] of [[4, 15], [26, 15]]) g[y][x] = 'P'; g[10][4] = 'W'; g[10][26] = 'W'; g[19][9] = 'W'; g[19][21] = 'W';
    for (let y = 22; y < 86; y++) for (let x = 0; x < HO_W; x++) if (g[y][x] === '#') g[y][x] = '#';
    { const sub = g.slice(22, 86); dress(sub, ['C', 'O', 'Z', 'C', 'Y', 'O', 'G'], 5, 7); for (let i = 0; i < sub.length; i++) g[22 + i] = sub[i]; }
    return g.map(r => r.join('')); })();
  // the causeway's pieces: N E S W = 0 1 2 3; each piece's ports at turn 0 (a bit per side), turned clockwise by its rot
  const CW_BASE = { T: 0b1011, L: 0b0011, I: 0b0101 };
  const DIR = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const portsOf = (kind, rot) => { const m = CW_BASE[kind]; let o = 0; for (let d = 0; d < 4; d++) if (m & (1 << d)) o |= 1 << ((d + rot) % 4); return o; };
  // the cells (col, row) of the authored layout, and the connections each piece needs
  const CW_CELLS = { J: { col: 1, row: 1, kind: 'T', need: 0b1011, name: 'the T-junction' }, K: { col: 0, row: 1, kind: 'L', need: 0b0110, name: 'the west elbow' }, k: { col: 2, row: 1, kind: 'L', need: 0b1100, name: 'the east elbow' },
    I: { col: 0, row: 2, kind: 'I', need: 0b0101, name: 'the west straight' }, V: { col: 2, row: 2, kind: 'I', need: 0b0101, name: 'the east straight' } };
  const CW_ORDER = ['J', 'K', 'I', 'k', 'V'];
  /* where the frost goes from the reservoir with these turns: { fed: Set of piece ids, links: [[a, b]], mist: [{ id, d }],
     basins: [west, east] } (pure: the tests and the hint use it too) */
  function causewayFlow(rot) { const at = {}; at['1,0'] = { id: 'Q', ports: 0b0100 }; at['0,3'] = { id: 'U', ports: 0b0001, basin: 0 }; at['2,3'] = { id: 'u', ports: 0b0001, basin: 1 };
    for (const id in CW_CELLS) { const C = CW_CELLS[id]; at[`${C.col},${C.row}`] = { id, ports: portsOf(C.kind, rot[id] || 0) }; }
    const out = { fed: new Set(), links: [], mist: [], basins: [false, false] }; const posOf = id => { for (const k in at) if (at[k].id === id) return k.split(',').map(Number); };
    const visit = (id, from) => { const [cx, cy] = posOf(id), cell = at[`${cx},${cy}`]; out.fed.add(id); if (cell.basin != null) { out.basins[cell.basin] = true; return; }
      for (let d = 0; d < 4; d++) { if (!(cell.ports & (1 << d)) || d === from) continue; const nb = at[`${cx + DIR[d][0]},${cy + DIR[d][1]}`], back = (d + 2) % 4;
        if (nb && nb.ports & (1 << back)) { out.links.push([id, nb.id, d]); visit(nb.id, back); } else out.mist.push({ id, d, open: !nb }); } };
    visit('Q', -1); return out; }
  const cwSolved = rot => { const f = causewayFlow(rot); return f.basins[0] && f.basins[1]; };
  const cwRight = (rot, id) => portsOf(CW_CELLS[id].kind, rot[id] || 0) === CW_CELLS[id].need;
  /* random starting turns on the fixed layout: never already solved, at least three pieces turned wrong */
  function cwScramble(rnd) { rnd = rnd || Math.random; for (let n = 0; n < 200; n++) { const rot = {}; for (const id in CW_CELLS) rot[id] = Math.floor(rnd() * 4); if (cwSolved(rot)) continue; if (CW_ORDER.filter(id => !cwRight(rot, id)).length < 3) continue; return rot; } return { J: 2, K: 0, k: 3, I: 1, V: 1 }; }
  const HO_HINT_AFTER = 40;

  function makeHollows(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, P = pal(), E = mk.E[0];
    const lava = runnels(X, tilesOf(M, 'r'), P);
    const S = { intro: true, phase: 'combat', rot: cwScramble(), turns: 0, fill: [0, 0], primed: false, surge: 0, solid: 0, latched: false, done: false, cavT: 0, hint: false, hintShown: 0, mist: 0, flow: null, packs: 0, step2: 0, entered: false };
    S.flow = causewayFlow(S.rot);
    // the brood, about forty, room by room: each kind alone first, then mixed (the hatch is the last room's gate)
    const hatch = doorway(X, H, tilesOf(M, 'h'), (c, Xs, Ys, T, D) => hatchArt(c, Xs, Ys, T, D), { kind: 'calhatch', dur: 1.6, fx(D, dt) { if (Math.random() < dt * 14) X.part({ kind: 'spark', x: D.x0 + Math.random() * (D.x1 - D.x0), y: D.y1 - 0.1, vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random(), life: 0.35, max: 0.35, size: 3, color: P.FROST_HI }); } });
    const SL = 'cinderslug', CR = 'basaltcrawler', EW = 'emberwisp';
    const WAVES = [[[SL, SL, SL], [SL, SL, SL, SL]], [[CR, CR], [CR, CR, SL, SL]], [[EW, EW, EW], [EW, EW, SL, SL, CR]], [[SL, SL, CR, EW, EW, CR], [SL, SL, SL, CR, EW, EW], [CR, CR, SL, SL, EW, EW, SL]]];
    const TEACH = [['Cinder slugs: one rears and its mouth glows before a short fire spit. Step aside, then strike', 'More slugs: keep out of their spit cones'],
      ['Basalt crawlers: plates on the front shrug off blows. Dodge the ram, strike the glowing rear', 'Crawlers and slugs together: crawlers first, from behind'],
      ['Ember wisps: one slow ember each, then a long rest. Strike while they burn low', 'Wisps among the others: step off their shown lines'],
      ['The whole brood together: crawlers from behind, wisps between their embers', 'They keep coming: slugs first, they are slow', 'The last of the hollows\' brood']];
    const gates = ['1', '2', '3'].map(ch => roomGate(X, H, tilesOf(M, ch), P, 'slag', 'COOLING SLAG')).concat([hatch]);
    const rooms = HO_ROOMS.map((R, i) => ({ name: R.name, y0: R.r0 + 1, y1: R.r1 + 1, spots: R.spots.map(([x, y]) => Wp(x, y)), waves: WAVES[i], teach: TEACH[i], gate: gates[i], clear: i === 3 ? 'The maintenance hatch grinds open: the cool cavern lies below' : 'The slag cracks and falls away: on to the next hollow' }));
    const brood = director(X, P, rooms, { dmgK: CAL_STAGES.DMG_K.HOLLOWS, onDone() { FROST_CHIME(X); } });
    // (v389) fifteen fire vents: four, four, three and three in the hollows, one on the start ledge (none in the cavern)
    const traps = ventField(X, pickVents(HO_LAYOUT, [{ y0: 88, y1: 97, n: 1 }, { y0: 73, y1: 84, n: 4 }, { y0: 57, y1: 68, n: 4 }, { y0: 41, y1: 52, n: 3 }, { y0: 23, y1: 36, n: 3 }],
      [[HO_CX + 1.5, 95.5, 3.5], [16.5, 71.5, 3], [16.5, 55.5, 3], [16.5, 39.5, 3], [16.5, 22.5, 3.5], [16.5, 86, 2.5]]), { teach: true });
    // the causeway: the reservoir, five pieces, two basins, the bridge halves
    const cell = id => mk[id][0];
    const pieces = CW_ORDER.map(id => { const p = cell(id), pc = { id, x: p.x, y: p.y, ang: (S.rot[id] || 0) * Math.PI / 2, flash: 0 };
      pc.obj = H.obj({ x: p.x, y: p.y, kind: 'calconduit', r: 0.85, h: 1.3, label: () => S.latched || S.surge > 0 || !S.entered ? '' : nearest() === pc ? 'TURN 90°' : '', use() { turn(pc); } }); return pc; });
    const byId = {}; for (const pc of pieces) byId[pc.id] = pc;
    const nearest = () => { let b = null, bd = 1e9; for (const pc of pieces) { const d = Math.hypot(me.x - pc.x, me.y - pc.y); if (d < bd) { bd = d; b = pc; } } return bd < 2.2 ? b : null; };
    const R0 = cell('Q'), BW = cell('U'), BE = cell('u'), F0 = mk.F[0];
    const bridgeT = tilesOf(M, 'b'), bx0 = Math.min(...bridgeT.map(t => t.tx)), bx1 = Math.max(...bridgeT.map(t => t.tx)) + 1, by0 = Math.min(...bridgeT.map(t => t.ty)), by1 = Math.max(...bridgeT.map(t => t.ty)) + 1, bmid = (bx0 + bx1) / 2;
    // the conduits from each basin round the cavern's side to its half of the bridge (world points)
    const PIPE = [[{ x: BW.x - 1, y: BW.y }, { x: 8.5, y: BW.y }, { x: 8.5, y: by1 + 0.7 }, { x: bx0 + 0.9, y: by1 + 0.7 }, { x: bx0 + 0.9, y: by1 - 0.2 }],
      [{ x: BE.x + 1, y: BE.y }, { x: 22.5, y: BE.y }, { x: 22.5, y: by1 + 0.7 }, { x: bx1 - 0.9, y: by1 + 0.7 }, { x: bx1 - 0.9, y: by1 - 0.2 }]];
    /* (v389: "the RELEASE valve is not responsive sometimes". Three causes: the valve's wheel is drawn 1.3 tiles east of the
       well, outside its 1.0-tile use radius, so standing at the wheel did nothing; standing south of the well, the T-junction
       three tiles below was as close, so the closest-use rule picked it and the valve's use returned silently; and using it
       needed the pet to stand quite still for 0.75 s. Now, once primed: the valve (well or wheel) always wins the closest-use
       pick within 2.4 tiles, walking onto it releases after 0.3 s (moving or not), and tapping the well or the wheel releases) */
    const WHEEL = { x: R0.x + 1.3, y: R0.y + 0.2 }, valveD = () => Math.min(Math.hypot(me.x - R0.x, me.y - R0.y), Math.hypot(me.x - WHEEL.x, me.y - WHEEL.y));
    const closestUse = () => { if (S.primed && valveD() < 2.4) return { id: 'Q', x: R0.x, y: R0.y }; let b = null, bd = 1e9; for (const q of pieces.concat([{ id: 'Q', x: R0.x, y: R0.y }])) { const d = Math.hypot(me.x - q.x, me.y - q.y); if (d < bd) { bd = d; b = q; } } return b; };
    function turn(pc) { if (S.latched || S.surge > 0 || closestUse() !== pc) return; S.rot[pc.id] = ((S.rot[pc.id] || 0) + 1) % 4; S.turns++; pc.flash = 0.4; S.flow = causewayFlow(S.rot);
      if (X.sfx.thud) X.sfx.thud(); if (X.sfx.hiss) X.sfx.hiss(0.15, 0.06, 2400);
      if (S.flow.fed.has(pc.id)) chime(X, 1046 + 120 * S.flow.fed.size, 0.25); }
    // the valve: lit when both basins have filled; the pet releases the frost
    const valve = H.obj({ x: R0.x, y: R0.y, kind: 'calreservoir', r: 1.5, h: 3.2, label: () => S.latched ? '' : S.primed ? 'RELEASE THE FROST' : S.entered ? 'FROST RESERVOIR' : '',
      draw(c, Xs, Ys, T) { reservoirArt(c, Xs, Ys, T); }, use() { const cq = closestUse(); if (cq && cq.id !== 'Q') return; if (!S.primed || S.surge > 0 || S.latched) { if (!S.latched && S.entered) X.text(R0.x, R0.y - 2.6, 'Both basins must flow first', P.FROST_HI, 13); return; } release(); } });
    function release() { if (S.surge > 0 || S.latched) return; S.surge = 0.001; S.valveT = 0; me.sq = 1; X.ring(R0.x, R0.y, 0.3, 3.2, 0.6, P.FROST_HI, 0.55); X.flash(0.2, '#E8F8FF'); FROST_CHIME(X); if (X.sfx.whoosh) X.sfx.whoosh();
      X.text(me.x, me.y - 1.5, 'Frost released!', P.FROST_HI, 16); for (let i = 0; i < 12; i++) X.part({ kind: 'glow', x: R0.x + (Math.random() - 0.5) * 1.6, y: R0.y - 0.5 - Math.random(), vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 2, life: 0.8, max: 0.8, size: 6, color: P.FROST_HI }); }
    function latch() { if (S.latched) return; S.latched = true; S.done = true; self.done = true; bridgeT.forEach(t => X.setTile(t.tx, t.ty, T_BRIDGE)); /* (no X.retile(): it blanks the ground chunks for frames; the set obsidian is drawn by bridgeArt) */ X.shake(lowFx() ? 2 : 5, 0.5); if (X.sfx.crash) X.sfx.crash();
      H.setExit(E.x, E.y, 'To Fire Flan'); X.banner('THE FROZEN CAUSEWAY HOLDS', 'Both halves of the obsidian bridge have set for good: Fire Flan\'s chamber lies beyond', P.FROST_HI, 3.2, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); }
    const shrine = station(X, H, F0, P, 'Fire Flan');
    // the islands' crystal clusters, the cavern's frost machinery
    for (const p of tilesOf(M, 'P')) H.obj({ x: p.x, y: p.y + 0.45, kind: 'calfrostpipe', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { frostMachineArt(c, Xs, Ys, T, p.x < HO_CX); } });
    X.after(1.0, () => { S.intro = false; X.banner('THE ASHEN HOLLOWS', 'Down from the ledge: through four hollows of brood to the cooler cavern below', P.LAVA_HI, 3.2, true, true); });
    const cavern = () => me.y < 21 && me.y > 7;
    const missing = () => { // the first piece along the routes that is turned wrong
      for (const id of CW_ORDER) if (!cwRight(S.rot, id)) return byId[id]; return null; };
    const routePts = side => { const ids = side ? ['Q', 'J', 'k', 'V', 'u'] : ['Q', 'J', 'K', 'I', 'U']; return ids.map(id => cell(id)); };
    // the camera: close through the hollows; in the cavern, while the causeway is unsolved (and a moment after the bridge
    // sets), out to the reservoir, the pieces, both basins and the bridge
    const rig = camRig();
    const camWant = () => S.entered && cavern() && !(S.latched && S.latchT > 1.2) ? { zoom: 0.56, x: HO_CX + 1.5, y: 12.6, k: 0.55 } : null;
    return { S, pieces, rig, camWant, traps, hatch, lava, shrine, brood, rooms, gates, causewayFlow, cwSolved, cwRight, missing, release, turn, CW_CELLS,
      cam: rig.cam,
      // (a tap on the well or its wheel while primed releases the frost, from anywhere on the screen near the pet)
      valveScreen: () => [X.sx(WHEEL.x), X.sy(R0.y - 1.0)],
      tap(x, y) { if (!S.primed || S.surge > 0 || S.latched || me.dead || Math.hypot(me.x - R0.x, me.y - R0.y) > 7) return false; const T = X.Tz(); for (const q of [{ x: R0.x, y: R0.y - 0.8 }, { x: WHEEL.x, y: R0.y - 1.0 }]) if (Math.hypot(x - X.sx(q.x), y - X.sy(q.y)) < T * 1.3) { release(); return true; } return false; },
      update(dt) { lava.tick(dt); shrine.tick(dt); traps.tick(dt); if (S.latched) S.latchT = (S.latchT || 0) + dt; rig.tick(dt, camWant()); for (const pc of pieces) { pc.flash = Math.max(0, pc.flash - dt); const want = (S.rot[pc.id] || 0) * Math.PI / 2; let d = want - pc.ang; while (d < -Math.PI) d += TAU; while (d > Math.PI) d -= TAU; pc.ang += d * Math.min(1, dt * 10); }
        S.mist += dt; if (S.intro) return;
        // the brood's order
        brood.tick(dt); for (const q of gates) if (q) q.tick(dt);
        if (!S.entered && hatch.open && me.y < 19.5) { S.entered = true; S.cavT = 0; X.banner('THE FROZEN CAUSEWAY', 'Turn the conduits so the reservoir\'s frost reaches BOTH basins at once', P.FROST_HI, 3.6, true, true); FROST_CHIME(X); }
        if (S.entered && !S.latched) { S.cavT += dt; if (!S.hint && S.cavT > HO_HINT_AFTER) { S.hint = true; S.hintShown = g.t; X.banner('A HINT', 'The traced line shows the piece that breaks the flow', P.FROST_HI, 2.4, true); } }
        // the basins fill while their branch flows, and drain when it stops
        const f = S.flow; for (let i = 0; i < 2; i++) S.fill[i] = clamp(S.fill[i] + (f.basins[i] ? dt / 1.2 : -dt / 2.5), 0, 1);
        const prim = S.fill[0] >= 1 && S.fill[1] >= 1 && f.basins[0] && f.basins[1]; if (prim && !S.primed && !S.latched) { S.primed = true; FROST_CHIME(X); X.banner('BOTH BASINS ARE COLD', 'Now release the frost at the reservoir', P.FROST_HI, 2.4, true); } else if (!prim && S.surge <= 0) S.primed = false;
        if (S.primed && S.surge <= 0 && !S.latched && !me.dead && valveD() < 1.7) { S.valveT = (S.valveT || 0) + dt; if (S.valveT >= 0.3) { S.valveT = 0; release(); } } else S.valveT = 0;
        if (S.surge > 0 && !S.latched) { S.surge += dt / 1.3; if (S.surge >= 1) { S.solid = Math.min(1, S.solid + dt / 1.0); if (S.solid >= 1) latch(); } }
        if (S.latched) S.solid = 1; },
      goal() { if (S.latched) return 'To Fire Flan'; if (S.intro) return 'The Ashen Hollows';
        if (!hatch.open) return brood.goal();
        if (!S.entered) return 'Down to the maintenance cavern';
        if (S.surge > 0) return 'The frost surges: the bridge is setting';
        if (S.primed) return 'Both basins are cold · release the frost at the reservoir';
        const nb = S.flow.basins.filter(Boolean).length; return `Frost to both basins · ${nb}/2 flowing · stand at a conduit to turn it`; },
      hint() { if (S.latched || S.intro) return null; if (!hatch.open) return brood.hint();
        if (!S.entered) return { x: HO_CX + 0.5, y: 19.5, h: 1.2, label: 'THE CAVERN' };
        if (S.primed) return { x: R0.x, y: R0.y, h: 3.3, label: 'RELEASE' }; if (S.hint) { const pc = missing(); if (pc) return { x: pc.x, y: pc.y, h: 1.2, label: 'TURN THIS' }; } return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, lw = lwOf(T), sp = p => [X.sx(p.x), X.sy(p.y)];
        // the cavern's cooler air: a faint blue wash over its floor
        { const x0 = X.sx(6), y0 = X.sy(8), x1 = X.sx(27), y1 = X.sy(21); if (y1 > 0 && y0 < X.H()) { c.save(); const gg = c.createRadialGradient((x0 + x1) / 2, (y0 + y1) / 2, T, (x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.6); gg.addColorStop(0, 'rgba(150,210,255,.13)'); gg.addColorStop(1, 'rgba(150,210,255,0)'); c.fillStyle = gg; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore(); } }
        lava.drawGround(c);
        // the bridge's two halves over the channel: lava, crusting while their basin is cold, obsidian once set
        bridgeArt(c, T);
        // the basins' conduits round the cavern
        for (let i = 0; i < 2; i++) { const pts = PIPE[i].map(sp); conduit(c, pts, T * 0.42, P, lw); }
        // the fixed channels between the cells, then the pieces
        const links = [['Q', 'J'], ['J', 'K'], ['J', 'k'], ['K', 'I'], ['k', 'V'], ['I', 'U'], ['V', 'u']];
        for (const [a, b] of links) { const A = cell(a), B = cell(b), dx = Math.sign(B.x - A.x), dy = Math.sign(B.y - A.y); conduit(c, [[X.sx(A.x + dx * 1.0), X.sy(A.y + dy * 1.0)], [X.sx(B.x - dx * 1.0), X.sy(B.y - dy * 1.0)]], T * 0.42, P, lw); }
        for (const b of [BW, BE]) basinArt(c, X.sx(b.x), X.sy(b.y), T, S.fill[b === BW ? 0 : 1], S.flow.basins[b === BW ? 0 : 1]);
        for (const pc of pieces) pieceArt(c, pc, T, lw);
        // the frost flowing: through every joined link and piece, and the conduits to the bridge from a fed basin
        flowArt(c, T);
        // the hint: the traced route through the wrong piece, its right turn ghosted on it
        if (S.hint && !S.latched && S.surge <= 0) { const pc = missing(); if (pc) { const side = ['k', 'V'].includes(pc.id) ? 1 : 0, pts = routePts(side).map(sp); c.save(); c.setLineDash([T * 0.2, T * 0.16]); c.lineDashOffset = -t * T * 0.8; c.strokeStyle = 'rgba(255,240,140,.85)'; c.lineWidth = Math.max(2, T * 0.07); poly(c, pts); c.stroke(); c.setLineDash([]);
            const need = CW_CELLS[pc.id].need, Xs = X.sx(pc.x), Ys = X.sy(pc.y); c.strokeStyle = 'rgba(255,240,140,.95)'; c.lineWidth = Math.max(3, T * 0.12); c.lineCap = 'round'; c.beginPath(); for (let d = 0; d < 4; d++) if (need & (1 << d)) { c.moveTo(Xs, Ys); c.lineTo(Xs + DIR[d][0] * T * 0.95, Ys + DIR[d][1] * T * 0.95); } c.stroke();
            let n = 0, r = S.rot[pc.id]; while (portsOf(CW_CELLS[pc.id].kind, r) !== need && n < 4) { r = (r + 1) % 4; n++; } label(c, n === 1 ? 'TURN ONCE' : `TURN ${n} TIMES`, Xs, Ys + T * 1.65, T * 0.24, '#FFF08C'); c.restore(); } } },
      drawOver(c) { const T = X.Tz(), t = g.t; lava.drawOver(c);
        // the mist where a branch stops: harmless white-blue puffs streaming out of the open outlet
        if (!S.latched) for (const q of S.flow.mist) { const A = cell(q.id), ox = A.x + DIR[q.d][0] * (q.open ? 1.0 : 2.0), oy = A.y + DIR[q.d][1] * (q.open ? 1.0 : 2.0), Xs = X.sx(ox), Ys = X.sy(oy); c.save(); for (let i = 0; i < 4; i++) { const u = ((S.mist * 0.7 + i / 4) % 1), r = T * (0.25 + u * 0.7), px = Xs + DIR[q.d][0] * u * T * 0.9 + Math.sin(i * 2 + t) * T * 0.1, py = Ys + DIR[q.d][1] * u * T * 0.9 - u * T * 0.6; const gg = c.createRadialGradient(px, py, 0, px, py, r); gg.addColorStop(0, `rgba(235,248,255,${0.55 * (1 - u)})`); gg.addColorStop(1, 'rgba(235,248,255,0)'); c.fillStyle = gg; c.beginPath(); c.arc(px, py, r, 0, TAU); c.fill(); } c.restore(); if (S.entered && Math.hypot(me.x - ox, me.y - oy) < 5) label(c, 'MIST', Xs, Ys - T * 0.9, T * 0.2, P.FROST_HI); }
        // the frost's own light, over the cavern's dark
        if (S.entered || S.latched) { for (const id of S.flow.fed) { const p = cell(id); glow(c, X.sx(p.x), X.sy(p.y), T * 1.4, P.FROST, 0.22); } for (let i = 0; i < 2; i++) if (S.fill[i] > 0.05) { const b = i ? BE : BW; glow(c, X.sx(b.x), X.sy(b.y), T * 1.6, P.FROST, 0.3 * S.fill[i]); } }
        if (S.surge > 0 && S.surge < 1.6) glow(c, X.sx(R0.x), X.sy(R0.y) - T, T * 4 * (1 - Math.abs(S.surge - 0.5)), '#E8F8FF', 0.5);
        if (S.entered && !S.latched) edgeMarks(X, c, [{ x: R0.x, y: R0.y - 1, col: P.FROST_HI, label: S.primed ? 'RELEASE' : 'RESERVOIR', warn: S.primed }, { x: BW.x, y: BW.y, col: S.fill[0] >= 1 ? P.FROST_HI : '#8FA2B0', label: 'BASIN' }, { x: BE.x, y: BE.y, col: S.fill[1] >= 1 ? P.FROST_HI : '#8FA2B0', label: 'BASIN' }].concat(pieces.filter(pc => !cwRight(S.rot, pc.id) && S.hint).map(pc => ({ x: pc.x, y: pc.y, col: '#FFF08C', label: 'TURN' })))); },
    };
    /* ---- the causeway's art ---- */
    // a stone conduit: a dark grated channel with a cut-stone lip (the frost runs in it)
    function conduit(c, pts, w, P, lw) { c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; poly(c, pts); c.strokeStyle = P.INK; c.lineWidth = w + lw * 2; c.stroke(); c.strokeStyle = '#5B6670'; c.lineWidth = w; c.stroke(); c.strokeStyle = '#1D262E'; c.lineWidth = w * 0.55; c.stroke(); c.restore(); }
    function pieceArt(c, pc, T, lw) { const Xs = X.sx(pc.x), Ys = X.sy(pc.y), s = T * 1.02, fed = S.flow.fed.has(pc.id), near = nearest() === pc && S.entered && !S.latched;
      c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; c.fillRect(Xs - s + T * 0.1, Ys - s + T * 0.22, s * 2, s * 2);
      // its plinth: the cut-stone side we see below the plate, rimed where the frost runs
      const dep = T * 0.18; c.fillStyle = '#3A4048'; c.fillRect(Xs - s, Ys + s - 1, s * 2, dep + 1); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - s, Ys + s - 1, s * 2, dep + 1); if (fed) { c.fillStyle = rgba(P.FROST, 0.5); c.fillRect(Xs - s + 2, Ys + s + dep * 0.25, s * 2 - 4, dep * 0.25); }
      // the turning plate: a square of pale cut stone with a bronze rim, a snowflake boss at its heart
      c.translate(Xs, Ys); const pg = c.createLinearGradient(-s, -s, s, s); pg.addColorStop(0, '#9AA4AE'); pg.addColorStop(1, '#5E6670'); c.fillStyle = pg; c.fillRect(-s, -s, s * 2, s * 2); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(-s, -s, s * 2, s * 2);
      c.strokeStyle = near ? '#FFF08C' : P.GOLD; c.lineWidth = Math.max(1.5, T * (near ? 0.08 : 0.05)); c.strokeRect(-s + T * 0.1, -s + T * 0.1, s * 2 - T * 0.2, s * 2 - T * 0.2);
      // the channel (turning with the plate)
      c.rotate(pc.ang); const m = CW_BASE[CW_CELLS[pc.id].kind]; c.lineCap = 'butt';
      for (const [col, wk] of [[P.INK, 0.5], ['#2A3440', 0.36]]) { c.strokeStyle = col; c.lineWidth = T * wk; c.beginPath(); for (let d = 0; d < 4; d++) if (m & (1 << d)) { c.moveTo(0, 0); c.lineTo(DIR[d][0] * s, DIR[d][1] * s); } c.stroke(); }
      c.fillStyle = '#2A3440'; c.beginPath(); c.arc(0, 0, T * 0.18, 0, TAU); c.fill();
      if (fed) { c.strokeStyle = rgba(P.FROST, 0.85); c.lineWidth = T * 0.2; c.beginPath(); for (let d = 0; d < 4; d++) if (m & (1 << d)) { c.moveTo(0, 0); c.lineTo(DIR[d][0] * s, DIR[d][1] * s); } c.stroke(); }
      c.rotate(-pc.ang); snowflake(c, 0, 0, T * 0.16, fed ? '#FFFFFF' : '#C8D4DE', Math.max(1, T * 0.03));
      if (pc.flash > 0) { c.strokeStyle = `rgba(255,255,255,${pc.flash * 2})`; c.lineWidth = 3; c.strokeRect(-s, -s, s * 2, s * 2); }
      c.restore(); }
    function basinArt(c, Xs, Ys, T, k, fed) { const lw = lwOf(T), R = T * 1.05; c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; ell(c, Xs + T * 0.06, Ys + T * 0.14, R * 1.05, R * 0.75); c.fill();
      ell(c, Xs, Ys, R, R * 0.72); const g = c.createLinearGradient(Xs - R, 0, Xs + R, 0); g.addColorStop(0, '#8E98A2'); g.addColorStop(1, '#4E5660'); c.fillStyle = g; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      ell(c, Xs, Ys + T * 0.04, R * 0.78, R * 0.52); c.fillStyle = '#1A2128'; c.fill();
      if (k > 0) { ell(c, Xs, Ys + T * 0.04, R * 0.78 * (0.4 + 0.6 * k), R * 0.52 * (0.4 + 0.6 * k)); const fg2 = c.createRadialGradient(Xs, Ys, 0, Xs, Ys, R * 0.8); fg2.addColorStop(0, P.FROST_HI); fg2.addColorStop(1, P.FROST_D); c.fillStyle = fg2; c.fill(); if (fed && !lowFx()) { c.strokeStyle = 'rgba(255,255,255,.6)'; c.lineWidth = 1.5; const u = (g.t * 0.8) % 1; ell(c, Xs, Ys + T * 0.04, R * 0.7 * u, R * 0.46 * u); c.stroke(); } }
      snowflake(c, Xs, Ys + T * 0.04, R * 0.3, k > 0.5 ? '#FFFFFF' : 'rgba(200,220,235,.6)', Math.max(1.2, T * 0.04));
      c.restore(); label(c, k >= 1 ? 'COLD' : fed ? 'FILLING' : 'BASIN', Xs, Ys + R * 0.72 + T * 0.45, T * 0.22, k >= 1 ? P.FROST_HI : '#C8D4DE'); }
    function flowArt(c, T) { const t = g.t, f = S.flow, segs = [];
      const pt = (id, d, k) => { const p = cell(id); return [X.sx(p.x + DIR[d][0] * k), X.sy(p.y + DIR[d][1] * k)]; };
      // a joined link: from the centre of a to the centre of b (through both pieces' ports)
      let dist = { Q: 0 }; for (const [a, b, d] of f.links) { const A = cell(a), B = cell(b), L = Math.hypot(B.x - A.x, B.y - A.y); segs.push({ a: [X.sx(A.x), X.sy(A.y)], b: [X.sx(B.x), X.sy(B.y)], d0: dist[a] || 0 }); dist[b] = (dist[a] || 0) + L; }
      for (let i = 0; i < 2; i++) if (f.basins[i] || S.surge > 0) { const pts = PIPE[i]; let d0 = dist[i ? 'u' : 'U'] || 9; for (let j = 1; j < pts.length; j++) { const L = Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y); if (f.basins[i]) segs.push({ a: [X.sx(pts[j - 1].x), X.sy(pts[j - 1].y)], b: [X.sx(pts[j].x), X.sy(pts[j].y)], d0 }); d0 += L; } }
      const hot = S.surge > 0 ? 1 : 0;
      const usedGpu = gpu(c, Q => { for (const s of segs) { Q.ebeam(s.a[0], s.a[1], s.b[0], s.b[1], T * (0.16 + 0.08 * hot), P.FROST, 0.55 + 0.35 * hot, 0.85, s.d0 * 0.3, -3); Q.beam(s.a[0], s.a[1], s.b[0], s.b[1], T * 0.08, '#FFFFFF', 0.35 + 0.4 * hot); } });
      c.save(); c.lineCap = 'round'; for (const s of segs) { { c.strokeStyle = rgba('#5FB4E8', usedGpu ? 0.75 : 0.9); c.lineWidth = T * 0.22; c.beginPath(); c.moveTo(s.a[0], s.a[1]); c.lineTo(s.b[0], s.b[1]); c.stroke(); }
        // the moving packets of frost, in the direction it flows
        c.setLineDash([T * 0.22, T * 0.5]); c.lineDashOffset = -(t * T * (2.2 + 3 * hot)) + s.d0 * T; c.strokeStyle = 'rgba(255,255,255,.95)'; c.lineWidth = Math.max(2, T * 0.09); c.beginPath(); c.moveTo(s.a[0], s.a[1]); c.lineTo(s.b[0], s.b[1]); c.stroke(); c.setLineDash([]); }
      c.restore();
      // the surge: a bright front running out from the reservoir along both routes
      if (S.surge > 0 && S.surge < 1.05) for (let i = 0; i < 2; i++) { const pts = routePts(i).concat(PIPE[i].slice(1)); let L = 0; for (let j = 1; j < pts.length; j++) L += Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y); let d = S.surge * L; for (let j = 1; j < pts.length; j++) { const l = Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y); if (d <= l) { const u = d / l, x = pts[j - 1].x + (pts[j].x - pts[j - 1].x) * u, y = pts[j - 1].y + (pts[j].y - pts[j - 1].y) * u; glow(c, X.sx(x), X.sy(y), T * 1.4, '#FFFFFF', 0.9); break; } d -= l; } } }
    function bridgeArt(c, T) { const t = g.t; for (let h = 0; h < 2; h++) { const x0 = h ? bmid : bx0, x1 = h ? bx1 : bmid, Xa = X.sx(x0), Ya = X.sy(by0), w = (x1 - x0) * T, hh = (by1 - by0) * T, k = S.latched ? 1 : Math.max(S.solid, S.fill[h] * 0.45);
        if (k <= 0.01) continue; c.save(); c.beginPath(); c.rect(Xa + 1, Ya, w - 2, hh); c.clip();
        // obsidian plates growing in from the banks as it cools
        const n = 4; for (let j = 0; j < n; j++) { const yy = Ya + j * hh / n, kk = clamp(k * 1.25 - (j % 2 ? 0.1 : 0) - (j === 0 || j === n - 1 ? 0 : 0.08), 0, 1); if (kk <= 0) continue; c.globalAlpha = kk;
          const gg = c.createLinearGradient(Xa, yy, Xa + w, yy + hh / n); gg.addColorStop(0, '#2E2836'); gg.addColorStop(0.5, '#16121C'); gg.addColorStop(1, '#0A080E'); c.fillStyle = gg; c.fillRect(Xa + 1, yy + 1, w - 2, hh / n - 2); c.strokeStyle = '#05040A'; c.lineWidth = 2; c.strokeRect(Xa + 1, yy + 1, w - 2, hh / n - 2);
          c.strokeStyle = rgba('#BFD8FF', 0.35 * kk); c.lineWidth = 1.5; c.beginPath(); c.moveTo(Xa + w * 0.15, yy + hh / n * 0.3); c.lineTo(Xa + w * 0.55, yy + hh / n * 0.2); c.stroke();
          if (!S.latched && S.solid < 1) { c.strokeStyle = rgba(P.LAVA_HI, 0.75 * (1 - kk * 0.7)); c.lineWidth = 1.5; c.beginPath(); c.moveTo(Xa + w * 0.1, yy + hh / n * 0.6); c.lineTo(Xa + w * 0.4, yy + hh / n * 0.45); c.lineTo(Xa + w * 0.8, yy + hh / n * 0.7); c.stroke(); } }
        c.globalAlpha = 1; if (S.latched || S.solid > 0) { c.strokeStyle = rgba(P.FROST_HI, 0.5 * (S.latched ? 0.6 + 0.2 * Math.sin(t * 2 + h) : S.solid)); c.lineWidth = 2; c.strokeRect(Xa + 2, Ya + 2, w - 4, hh - 4); }
        c.restore(); }
      // the seam between the halves
      if (S.latched || S.solid > 0) { c.save(); c.strokeStyle = '#05040A'; c.lineWidth = 3; c.beginPath(); c.moveTo(X.sx(bmid), X.sy(by0)); c.lineTo(X.sx(bmid), X.sy(by1)); c.stroke(); c.restore(); }
      if (!S.latched) { label(c, 'WEST HALF', X.sx((bx0 + bmid) / 2), X.sy((by0 + by1) / 2), T * 0.2, S.fill[0] >= 1 ? P.FROST_HI : '#FFD9B0'); label(c, 'EAST HALF', X.sx((bmid + bx1) / 2), X.sy((by0 + by1) / 2), T * 0.2, S.fill[1] >= 1 ? P.FROST_HI : '#FFD9B0'); } }
    function reservoirArt(c, Xs, Ys, T) { const lw = lwOf(T), t = g.t, R = T * 1.15, on = S.primed || S.surge > 0, k = on ? 0.7 + 0.3 * Math.sin(t * 5) : 0.35;
      const CA = CALR(); if (CA && typeof CA.frostWellArt === 'function') { CA.frostWellArt(c, Xs, Ys, T, { k: on ? 0.6 + 0.4 * k : 0.25 + 0.15 * Math.sin(t * 1.5), scale: 1.2, v: 2 });
        // the great valve wheel on its iron post, which the pet turns to release the frost
        const vx = Xs + R * 1.25, vy = Ys - T * 1.0, va = S.surge > 0 ? S.surge * 6 : 0; c.save(); c.strokeStyle = P.INK; c.lineWidth = Math.max(3, T * 0.12); c.beginPath(); c.moveTo(vx, vy + T * 0.32); c.lineTo(vx, Ys + T * 0.2); c.stroke(); c.strokeStyle = P.IRON_HI; c.lineWidth = Math.max(1.5, T * 0.06); c.stroke();
        c.strokeStyle = P.INK; c.lineWidth = Math.max(4, T * 0.13); c.beginPath(); c.arc(vx, vy, T * 0.34, 0, TAU); c.stroke(); c.strokeStyle = on ? '#FFF08C' : P.GOLD; c.lineWidth = Math.max(2, T * 0.07); c.stroke(); c.beginPath(); for (let i = 0; i < 4; i++) { const a = va + i / 4 * TAU + 0.4; c.moveTo(vx, vy); c.lineTo(vx + Math.cos(a) * T * 0.34, vy + Math.sin(a) * T * 0.34); } c.stroke();
        c.beginPath(); c.arc(vx, vy, T * 0.08, 0, TAU); c.fillStyle = P.FROST; c.fill(); c.restore(); if (on && !S.latched) { glow(c, vx, vy, T * 1.0, '#FFF08C', 0.5 * k); label(c, 'RELEASE', vx, vy - T * 0.6, T * 0.2, '#FFF08C'); } return; }
      c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; ell(c, Xs, Ys + T * 0.1, R * 1.2, R * 0.5); c.fill();
      // the well: an octagonal ring of basalt blocks, bronze-banded, the frost pool within
      const oct = (r, ry, yo) => { const pts = []; for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; pts.push([Xs + Math.cos(a) * r, Ys + yo + Math.sin(a) * ry]); } return pts; };
      poly(c, oct(R, R * 0.55, 0)); c.closePath(); c.fillStyle = '#3B3532'; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      c.fillStyle = '#4E4642'; c.fillRect(Xs - R, Ys - T * 0.45, R * 2, T * 0.45); c.strokeRect(Xs - R, Ys - T * 0.45, R * 2, T * 0.45); c.fillStyle = P.GOLD; c.fillRect(Xs - R, Ys - T * 0.3, R * 2, T * 0.07);
      poly(c, oct(R, R * 0.55, -T * 0.45)); c.closePath(); c.fillStyle = '#5A524E'; c.fill(); c.stroke();
      poly(c, oct(R * 0.74, R * 0.4, -T * 0.45)); c.closePath(); const pg = c.createRadialGradient(Xs, Ys - T * 0.45, 0, Xs, Ys - T * 0.45, R * 0.8); pg.addColorStop(0, P.FROST_HI); pg.addColorStop(1, P.FROST_D); c.fillStyle = pg; c.fill();
      // the frost crystal rising from it
      const cy = Ys - T * 0.5, h = T * 2.1; poly(c, [[Xs - T * 0.38, cy], [Xs - T * 0.3, cy - h * 0.65], [Xs - T * 0.05, cy - h], [Xs + T * 0.2, cy - h * 0.85], [Xs + T * 0.36, cy - h * 0.45], [Xs + T * 0.38, cy]]); c.closePath();
      const cg = c.createLinearGradient(Xs - T * 0.4, cy - h, Xs + T * 0.4, cy); cg.addColorStop(0, '#FFFFFF'); cg.addColorStop(0.45, P.FROST); cg.addColorStop(1, P.FROST_D); c.fillStyle = cg; c.fill(); c.strokeStyle = '#21486B'; c.lineWidth = lw * 0.8; c.stroke();
      c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = Math.max(1, T * 0.035); c.beginPath(); c.moveTo(Xs - T * 0.05, cy - h); c.lineTo(Xs - T * 0.12, cy - T * 0.2); c.moveTo(Xs + T * 0.2, cy - h * 0.85); c.lineTo(Xs + T * 0.08, cy - T * 0.3); c.stroke();
      // its snowflake plaque, and the valve wheel the pet turns
      c.beginPath(); c.arc(Xs, Ys - T * 0.22, T * 0.3, 0, TAU); c.fillStyle = '#20303E'; c.fill(); c.strokeStyle = P.GOLD; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke(); snowflake(c, Xs, Ys - T * 0.22, T * 0.22, '#FFFFFF', Math.max(1.2, T * 0.04));
      const vx = Xs + R * 0.95, vy = Ys - T * 0.95, va = S.surge > 0 ? S.surge * 6 : 0; c.strokeStyle = on ? '#FFF08C' : P.GOLD; c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.arc(vx, vy, T * 0.3, 0, TAU); c.stroke(); c.beginPath(); for (let i = 0; i < 3; i++) { const a = va + i / 3 * TAU; c.moveTo(vx, vy); c.lineTo(vx + Math.cos(a) * T * 0.3, vy + Math.sin(a) * T * 0.3); } c.stroke();
      c.strokeStyle = P.INK; c.lineWidth = Math.max(2, T * 0.06); c.beginPath(); c.moveTo(vx, vy + T * 0.3); c.lineTo(vx, Ys - T * 0.3); c.stroke();
      c.restore(); glow(c, Xs, cy - h * 0.5, T * 2.1, P.FROST, 0.18 + 0.35 * k * (on ? 1 : 0.5)); if (on && !S.latched) glow(c, vx, vy, T * 0.9, '#FFF08C', 0.5 * k); }
    function hatchArt(c, Xs, Ys, T, D) { const lw = lwOf(T), w = (D.x1 - D.x0) * T, L = Xs - w / 2, hgt = T * 2.4 * (1 - D.k); c.save();
      c.fillStyle = P.BASALT_D; c.fillRect(L - T * 0.5, Ys - T * 3.0, T * 0.5, T * 3.0); c.fillRect(L + w, Ys - T * 3.0, T * 0.5, T * 3.0); c.fillStyle = P.BASALT_HI; c.fillRect(L - T * 0.5, Ys - T * 3.15, w + T, T * 0.35); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(L - T * 0.5, Ys - T * 3.15, w + T, T * 0.35);
      if (hgt > 1) { c.beginPath(); c.rect(L, Ys - T * 3, w, T * 3); c.clip(); const top = Ys - hgt; const ig = c.createLinearGradient(L, 0, L + w, 0); ig.addColorStop(0, P.IRON_HI); ig.addColorStop(0.5, P.IRON); ig.addColorStop(1, P.IRON_D); c.fillStyle = ig; c.fillRect(L, top, w, hgt); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(L, top, w, hgt);
        for (let i = 1; i < 3; i++) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(L, top + hgt * i / 3 - 2, w, 3); } for (let i = 0; i < 6; i++) { c.fillStyle = P.IRON_HI; c.beginPath(); c.arc(L + w * (0.1 + i * 0.16), top + T * 0.18, Math.max(1.5, T * 0.05), 0, TAU); c.fill(); }
        c.beginPath(); c.arc(Xs, top + hgt * 0.5, T * 0.45, 0, TAU); c.fillStyle = '#20303E'; c.fill(); c.strokeStyle = P.FROST; c.lineWidth = Math.max(1.5, T * 0.05); c.stroke(); snowflake(c, Xs, top + hgt * 0.5, T * 0.32, D.open ? '#FFFFFF' : P.FROST, Math.max(1.2, T * 0.045)); }
      c.restore(); if (!D.open) label(c, 'MAINTENANCE HATCH', Xs, Ys - T * 3.4, T * 0.22, P.FROST_HI); }
    function frostMachineArt(c, Xs, Ys, T, west) { const lw = lwOf(T), t = g.t; c.save(); c.fillStyle = 'rgba(0,0,0,.35)'; ell(c, Xs, Ys, T * 0.7, T * 0.22); c.fill();
      // a squat frost condenser: an iron drum with bronze bands, a frosted gauge window, pipes running into the wall
      const w = T * 1.0, h = T * 1.5, top = Ys - h; const ig = c.createLinearGradient(Xs - w / 2, 0, Xs + w / 2, 0); ig.addColorStop(0, P.IRON_HI); ig.addColorStop(0.55, P.IRON); ig.addColorStop(1, P.IRON_D); c.fillStyle = ig; c.beginPath(); c.rect(Xs - w / 2, top, w, h); c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      ell(c, Xs, top, w / 2, T * 0.15); c.fillStyle = '#8A949E'; c.fill(); c.stroke(); for (const u of [0.25, 0.75]) { c.fillStyle = P.GOLD; c.fillRect(Xs - w / 2, top + h * u, w, T * 0.08); }
      c.beginPath(); c.arc(Xs, top + h * 0.5, T * 0.22, 0, TAU); c.fillStyle = rgba(P.FROST, 0.6 + 0.2 * Math.sin(t * 1.5 + Xs)); c.fill(); c.strokeStyle = P.INK; c.stroke(); snowflake(c, Xs, top + h * 0.5, T * 0.15, '#FFFFFF', 1.2);
      c.strokeStyle = P.IRON; c.lineWidth = T * 0.2; c.beginPath(); c.moveTo(Xs + (west ? -1 : 1) * w / 2, top + h * 0.3); c.lineTo(Xs + (west ? -1 : 1) * w * 1.1, top + h * 0.3); c.stroke();
      // frost breath at its vent
      if (!lowFx()) { const u = (t * 0.4 + (west ? 0 : 0.5)) % 1; glow(c, Xs, top - u * T * 0.8, T * (0.4 + u * 0.5), '#E8F8FF', 0.35 * (1 - u)); }
      c.restore(); }
  }
  CAL_STAGES.HOLLOWS = { name: 'The Ashen Hollows', goal: 'Through four hollows of brood, then cool the causeway', how: 'From a sheltered ledge over the lava, down through four hollows. In each the brood rises from the rock in waves, about forty in all: cinder slugs first (they rear and glow before a short spit), then basalt crawlers (strike the glowing rear, not the plates), then ember wisps (one slow ember, then a long rest), then all of them together. A barricade of cooling slag blocks each way on until its hollow is clear. Lava runnels cross the floor: touching one burns a little and puts you back on safe ground. Below, the cool maintenance cavern (no monsters): a lava channel blocks the door to Fire Flan. Stand at a conduit for a moment to turn it 90 degrees: the frost runs from the reservoir through a T-junction, two elbows and two straights to two cooling basins (a broken branch only mists). Fill BOTH basins at once, then stand at the reservoir to release the frost: both halves of the obsidian bridge set for good. A hint traces the missing connection after a while. A frost shrine beyond restores your pet.',
    layout: HO_LAYOUT, legend: { E: {}, F: {}, b: { tile: T_GAP }, r: {}, h: {}, Q: {}, J: {}, K: {}, k: {}, I: {}, V: {}, U: {}, u: {}, 1: {}, 2: {}, 3: {}, P: { tile: T_SOLID },
      C: PROP('blackcrystal', 'obsidian'), G: PROP('bigcrystal', 'obsidian'), Y: PROP('glassspire', 'obsidian'), O: PROP('basaltcol', 'volrok'), Z: PROP('ashmound', 'volrok'), W: PROP('frostwell', 'iceblok') }, make: makeHollows,
    // (pure helpers for the tests: the causeway's flow, its scramble, what each piece needs)
    flow: causewayFlow, scramble: cwScramble, cells: CW_CELLS, portsOf };

  /* ---- grated walkways: iron grating over the lava (walkable), the lava's light showing through the slots ---- */
  function grates(X, tiles, P) { const set = new Set(tiles.map(t => t.ty * X.M.MW + t.tx));
    return { drawGround(c) { const T = X.Tz(), t = X.g.t, W = X.W(), Hh = X.H(); const vis = []; for (const p of tiles) { const Xs = X.sx(p.tx), Ys = X.sy(p.ty); if (Xs > -T && Xs < W + T && Ys > -T && Ys < Hh + T) vis.push([p, Xs, Ys]); }
        c.save(); for (const [p, Xs, Ys] of vis) { // the lava below, seen through
          const k = 0.75 + 0.25 * Math.sin(t * 1.3 + p.tx * 0.9 + p.ty * 0.6); c.fillStyle = P.LAVA_D; c.fillRect(Xs, Ys, T + 0.5, T + 0.5); c.fillStyle = rgba(P.LAVA, 0.35 + 0.45 * k); c.fillRect(Xs + T * 0.12, Ys + T * 0.12, T * 0.76, T * 0.76); }   // (flat fills: no gradient per tile per frame)
        // the grating: iron bars across, a frame where the walkway meets the lava
        for (const [p, Xs, Ys] of vis) { c.fillStyle = P.IRON_D; for (let i = 0; i < 4; i++) c.fillRect(Xs, Ys + i * T / 4, T + 0.5, T * 0.11); c.fillStyle = P.IRON; for (let i = 0; i < 4; i++) c.fillRect(Xs + i * T / 4, Ys, T * 0.09, T + 0.5); c.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 4; i++) c.fillRect(Xs, Ys + i * T / 4, T, T * 0.03);
          const k0 = p.ty * X.M.MW + p.tx; c.fillStyle = P.IRON_HI; if (!set.has(k0 - 1)) c.fillRect(Xs, Ys, T * 0.12, T + 0.5); if (!set.has(k0 + 1)) c.fillRect(Xs + T * 0.88, Ys, T * 0.12, T + 0.5); }
        c.restore();
        gpu(c, Q => { for (const [p, Xs, Ys] of vis) if ((p.tx + p.ty) % 2 === 0) Q.ground(Xs + T * 0.5, Ys + T * 0.5, T * 0.9, 0.55, 0.45, p.tx * 0.31 + p.ty * 0.17, 0.7, 0.4); }); } }; }

  /* ======================= THE RUNEBOUND FOUNDRY ======================= */
  const FO_W = 33, FO_H = 96, FO_CX = 16;
  // the four forge halls (layout rows) and their brood's places; each hall's gate is the walkway north of it
  const FO_ROOMS = [{ name: 'The Bellows Hall', r0: 71, r1: 81, spots: [[10, 74], [22, 74], [16, 73], [9, 79], [23, 79]] },
    { name: 'The Sentinel Hall', r0: 54, r1: 65, spots: [[10, 57], [22, 57], [16, 56], [9, 62], [23, 62], [16, 60]] },
    { name: 'The Bomb Hall', r0: 37, r1: 48, spots: [[11, 40], [21, 40], [16, 39], [10, 45], [22, 45]] },
    { name: 'The Great Forge', r0: 18, r1: 31, spots: [[8, 21], [24, 21], [12, 20], [20, 20], [16, 22], [8, 28], [24, 28], [16, 27]] }];
  const FO_LAYOUT = (() => { const g = grid(FO_W, FO_H, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    // lava under everything between the halls (the forge's floor far below the walkways)
    rect(1, 15, 31, 95, '~');
    // the entry gallery (start), then hall by hall north, each joined by a grated walkway with a portcullis
    rect(9, 87, 23, 94); g[91][16] = 'S'; rect(14, 82, 18, 86, 'g');
    const hall = (y0, y1, x0, x1) => { rect(x0, y0, x1, y1); for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) g[y][x] = '~'; };
    hall(71, 81, 4, 28); rect(14, 66, 18, 70, 'g'); for (let x = 14; x <= 18; x++) g[68][x] = '1';
    hall(54, 65, 4, 28); rect(14, 49, 18, 53, 'g'); for (let x = 14; x <= 18; x++) g[51][x] = '2';
    hall(37, 48, 4, 28); rect(14, 32, 18, 36, 'g'); for (let x = 14; x <= 18; x++) g[34][x] = '3';
    hall(18, 31, 3, 29); rect(14, 15, 18, 17, 'g'); for (let x = 14; x <= 18; x++) g[16][x] = '4';
    // grated bays over lava inside the halls (the floor's own grates)
    for (const [x0, y0] of [[7, 75], [22, 75], [7, 58], [22, 58], [7, 42], [22, 42], [7, 23], [22, 23], [11, 27], [18, 27]]) rect(x0, y0, x0 + 3, y0 + 2, 'g');
    // the ring hall, the pressure door (three rings on it), the landing beyond
    // (the frost shrine stands in the ring hall, beside the door: beyond it the dark passage, the exit just inside)
    rect(4, 5, 28, 14); rect(12, 3, 20, 4, 'D'); rect(10, 0, 22, 2); g[1][16] = 'E'; g[9][6] = 'F';
    g[11][10] = 'A'; g[11][16] = 'B'; g[11][22] = 'C'; g[13][6] = 'Z'; g[13][26] = 'L';
    // the forge's furniture: pressure vessels in the halls, furnaces and chains over the lava, rings beside the walkways
    for (const [x, y] of [[5, 72], [27, 80], [5, 55], [27, 55], [5, 64], [27, 64], [6, 38], [26, 47], [4, 19], [28, 19], [4, 30], [28, 30], [7, 6], [25, 6]]) g[y][x] = 'V';
    for (const [x, y] of [[2, 76], [30, 60], [2, 43], [30, 40], [2, 24], [30, 25]]) g[y][x] = 'K'; g[4][8] = 'K'; g[4][24] = 'K';
    for (const [x, y] of [[9, 68], [23, 69], [8, 51], [24, 50], [9, 34], [23, 35], [10, 84], [22, 85]]) g[y][x] = 'H';
    for (const [x, y] of [[3, 6], [29, 6], [3, 13], [29, 13]]) g[y][x] = 'R'; for (const [x, y] of [[26, 76], [6, 61], [25, 44], [24, 29]]) g[y][x] = 'N';
    for (const [x, y] of [[10, 84], [22, 83], [10, 67], [22, 67], [10, 50], [22, 52], [10, 33], [22, 33]]) if (g[y][x] === '~') g[y][x] = 'O';
    return g.map(r => r.join('')); })();
  const RUNE_NAMES = ['EYE', 'CHAIN', 'CROWN'], RR_TARGET = [0, 1, 2], RR_LEVERS = { A: [1, 1, 0], B: [0, 1, 1], C: [1, 0, 1] };
  /* the shortest way from a state to the inscription: breadth-first over the 27 states. -> [lever, ...] ([] when solved) */
  function ringsPlan(state) { const key = s => s.join(''), goal = key(RR_TARGET), q = [state.slice()], prev = new Map([[key(state), null]]);
    while (q.length) { const s = q.shift(), k = key(s); if (k === goal) { const out = []; let c = k; while (prev.get(c)) { const [p, l] = prev.get(c); out.unshift(l); c = p; } return out; }
      for (const l of ['A', 'B', 'C']) { const n = s.map((v, i) => (v + RR_LEVERS[l][i]) % 3), nk = key(n); if (!prev.has(nk)) { prev.set(nk, [k, l]); q.push(n); } } }
    return null; }
  const RR_COL = { A: '#FFC857', B: '#7FD3F2', C: '#E58BF2' };
  /* a rune glyph, distinct by shape: 0 the Eye (an almond and its pupil), 1 the Chain (two linked ovals), 2 the Crown (three points) */
  function glyph(c, x, y, s, which, col, lw) { c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round';
    if (which === 0) { c.beginPath(); c.moveTo(-s, 0); c.quadraticCurveTo(0, -s * 0.95, s, 0); c.quadraticCurveTo(0, s * 0.95, -s, 0); c.closePath(); c.stroke(); c.beginPath(); c.arc(0, 0, s * 0.3, 0, TAU); c.fill(); }
    else if (which === 1) { c.beginPath(); c.ellipse(-s * 0.38, 0, s * 0.5, s * 0.3, -0.5, 0, TAU); c.stroke(); c.beginPath(); c.ellipse(s * 0.38, 0, s * 0.5, s * 0.3, -0.5, 0, TAU); c.stroke(); }
    else { c.beginPath(); c.moveTo(-s * 0.85, s * 0.5); c.lineTo(-s * 0.85, -s * 0.25); c.lineTo(-s * 0.42, s * 0.08); c.lineTo(0, -s * 0.6); c.lineTo(s * 0.42, s * 0.08); c.lineTo(s * 0.85, -s * 0.25); c.lineTo(s * 0.85, s * 0.5); c.closePath(); c.stroke(); for (const u of [-0.85, 0, 0.85]) { c.beginPath(); c.arc(s * u, u ? -s * 0.32 : -s * 0.68, s * 0.1, 0, TAU); c.fill(); } }
    c.restore(); }
  /* the bomb lesson. Where the core's bomb larva has its own landing and return (CAL.larvaState), it is only watched and
     prompted; otherwise this drives a practice bomb itself: it drifts down by the pet, lands, and sits with a 6 s fuse, the
     first 3 s safe (hit it: it flies, aim-assisted, into the nearest monster and bursts there; it never hurts the pet),
     the last 3 s flashing red (a dodge cue and a shown circle); a weak burst if left */
  function bombLesson(X, P) { const me = X.me, B = { m: null, st: 'none', fuse: 0, thrown: null, returned: 0, burst: 0, own: false, landAt: null };
    const C = CALR(), core = !!(C && typeof C.larvaState === 'function' && typeof C.dropBomb === 'function' && MON.bomblarva);
    B.spawn = (p, pack) => { if (core) { const a = Math.atan2(p.y - me.y, p.x - me.x), q = X.freeSpot(me.x + Math.cos(a) * 2.2, me.y + Math.sin(a) * 2.2, 0.5) || p; const m = C.dropBomb(X, q.x, q.y, { tut: true });
        if (m) { m.calTutorial = true; m.calType = 'bomblarva'; B.m = m; B.own = false; B.st = 'fly'; X.after(0.75, () => { if (B.st === 'ground' || B.st === 'fly') X.banner('RETURN THE BOMB', 'It has landed: hit it while its ring is green (any attack) and it flies back into a foe', P.RUNE_HI, 2.8, true); }); return m; } }
      const m = spawnAt(X, 'bomblarva', p, null, pack, true); m.calTutorial = true; m.dmg *= 0.3; B.m = m; B.own = true;
      if (B.own) { m.stun = 1e6; m.calHold = true; m.optional = false; B.st = 'fly'; const a = Math.atan2(me.y - m.y, me.x - m.x); const q = X.freeSpot(me.x - Math.cos(a) * 2.2, me.y - Math.sin(a) * 2.2, 0.5) || { x: me.x, y: me.y - 2 }; B.landAt = q; B.from = { x: m.x, y: m.y }; B.t = 0;
        m.guardFn = (mm, o) => { if (B.st === 'ground' && B.fuse > 3) throwIt(); return 0; }; }
      return m; };
    function target() { let b = null, bd = 1e9; for (const q of X.mons) if (!q.dead && q !== B.m && !q.calTutorial) { const d = Math.hypot(q.x - B.m.x, q.y - B.m.y); if (d < bd) { bd = d; b = q; } } return b; }
    function throwIt() { const tg = target(); B.st = 'thrown'; B.t = 0; B.from = { x: B.m.x, y: B.m.y }; B.tg = tg; B.to = tg ? { x: tg.x, y: tg.y } : { x: B.m.x, y: B.m.y - 4 }; B.returned++;
      X.text(B.m.x, B.m.y - 1.2, 'Returned!', P.RUNE_HI, 16); if (X.sfx.whoosh) X.sfx.whoosh(); X.ring(B.m.x, B.m.y, 0.2, 1.4, 0.3, P.RUNE_HI, 0.4); }
    function burstAt(x, y, hurt) { X.boom(x, y, 1.6, P.LAVA, P.LAVA_HI, { n: 22, shake: 6 }); if (X.sfx.crash) X.sfx.crash(); B.burst++;
      if (hurt && Math.hypot(me.x - x, me.y - y) < 1.6) X.hurtPet(X.ST().hp * 0.06, null, { bomb: true });
      if (!hurt) for (const q of X.mons) if (!q.dead && q !== B.m && Math.hypot(q.x - x, q.y - y) < 1.8 + q.r) X.hitMon(q, Math.max(q.maxhp * 0.65, 1), { flat: true, src: 'bomb' }); }
    B.tick = dt => { const m = B.m; if (!m) return; B.t = (B.t || 0) + dt;
      if (!B.own) { let v = null; try { v = C.larvaState(m); } catch (e) {} B.cst = v;
        if (v === 'returned') { if (!B.counted) { B.counted = true; B.returned++; B.t = 0; } B.st = B.t < 0.9 ? 'thrown' : 'done'; return; }
        B.st = m.dead || !v || v === 'boom' ? 'done' : v === 'safe' || v === 'red' ? 'ground' : 'fly'; return; }
      if (m.dead && B.st !== 'done') { B.st = 'done'; return; }
      if (B.st === 'fly') { const u = clamp(B.t / 1.3, 0, 1), e = 1 - Math.pow(1 - u, 2); m.x = B.from.x + (B.landAt.x - B.from.x) * e; m.y = B.from.y + (B.landAt.y - B.from.y) * e; m.z = (1 - u) * 2.5; m.vx = m.vy = 0; if (u >= 1) { B.st = 'ground'; B.fuse = 6; m.z = 0; if (X.sfx.thud) X.sfx.thud(); X.ring(m.x, m.y, 0.2, 1.2, 0.3, P.ASH, 0.3);
          X.banner('RETURN THE BOMB', 'It has landed: hit it NOW (any attack) and it flies back into a monster', P.RUNE_HI, 2.6, true); } }
      else if (B.st === 'ground') { m.x = B.landAt.x; m.y = B.landAt.y; m.vx = m.vy = 0; const f0 = B.fuse; B.fuse -= dt; if (f0 > 3 && B.fuse <= 3) { X.warn({ x: m.x, y: m.y, r: 1.6, life: 3, max: 3, color: P.WARN }); X.text(m.x, m.y - 1.3, 'Too late: get clear!', P.WARN, 14); }
        if (B.fuse <= 0) { B.st = 'done'; burstAt(m.x, m.y, true); X.killMon(m, false); } }
      else if (B.st === 'thrown') { const u = clamp(B.t / 0.6, 0, 1); if (B.tg && !B.tg.dead) B.to = { x: B.tg.x, y: B.tg.y }; m.x = B.from.x + (B.to.x - B.from.x) * u; m.y = B.from.y + (B.to.y - B.from.y) * u; m.z = Math.sin(u * Math.PI) * 2; if (Math.random() < 0.6) X.part({ kind: 'ember', x: m.x, y: m.y - m.z, vx: 0, vy: -1, life: 0.4, max: 0.4, size: 4, color: P.LAVA_HI });
        if (u >= 1) { B.st = 'done'; m.z = 0; burstAt(m.x, m.y, false); X.killMon(m, false); } } };
    B.safe = () => B.st === 'ground' && (B.own ? B.fuse > 3 : B.cst === 'safe');
    B.drawGround = c => { const m = B.m; if (!m || m.dead || B.st !== 'ground' || !B.own) return; const T = X.Tz(), Xs = X.sx(m.x), Ys = X.sy(m.y), safe = B.safe(), k = B.own ? clamp((B.fuse - (safe ? 3 : 0)) / 3, 0, 1) : 1, t = X.g.t;
      c.save(); c.lineWidth = Math.max(3, T * 0.1); c.strokeStyle = 'rgba(0,0,0,.45)'; c.beginPath(); c.arc(Xs, Ys, T * 0.85, 0, TAU); c.stroke();
      c.strokeStyle = safe ? P.RUNE_HI : (Math.sin(t * 18) > 0 ? P.WARN : '#FFFFFF'); c.beginPath(); c.arc(Xs, Ys, T * 0.85, -Math.PI / 2, -Math.PI / 2 + TAU * k); c.stroke(); c.restore();
      if (safe) { // the aim guide: a dotted arc to where it will fly
        const tg = target(); if (tg) { c.save(); c.setLineDash([T * 0.15, T * 0.15]); c.lineDashOffset = -t * T; c.strokeStyle = rgba(P.RUNE_HI, 0.8); c.lineWidth = 2; const x1 = X.sx(tg.x), y1 = X.sy(tg.y); c.beginPath(); c.moveTo(Xs, Ys - T * 0.4); c.quadraticCurveTo((Xs + x1) / 2, Math.min(Ys, y1) - T * 2, x1, y1 - T * 0.4); c.stroke(); c.restore(); }
        label(c, 'HIT IT: RETURN!', Xs, Ys - T * 1.5, T * 0.26, P.RUNE_HI); } else label(c, 'GET CLEAR', Xs, Ys - T * 1.5, T * 0.26, P.WARN); };
    return B; }

  function makeFoundry(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, P = pal(), E = mk.E[0];
    const S = { intro: true, rings: [0, 0, 0], ang: [0, 0, 0], pulls: 0, resets: 0, hints: 0, hintMove: null, hintState: null, solved: false, iris: 0, opened: false, beat: 0, beatT: 0, step: 0, lesson: false, near: null, flash: [0, 0, 0], lever: {} };
    const gr = grates(X, tilesOf(M, 'g').concat(...['1', '2', '3', '4'].map(ch => tilesOf(M, ch))), P);
    // the brood, about forty, hall by hall: imps; sentinels; the bomb lesson inside an ordinary pack; then all of them
    const bomb = bombLesson(X, P);
    const IM = 'furnaceimp', SE = 'runicsentinel', LA = 'bomblarva';
    const WAVES = [[[IM, IM, IM], [IM, IM, IM, IM]], [[SE, SE], [SE, SE, IM, IM]], [[IM, SE, 'tutor'], [LA, LA, IM, IM]], [[IM, IM, IM, SE, LA, SE], [IM, IM, IM, IM, SE, SE], [IM, IM, IM, SE, SE, LA, LA, IM]]];
    const TEACH = [['Furnace imps: each winds back and lobs a slow ember at a shown circle, then hops away', 'More imps: step out of the circles, then chase them down'],
      ['Runic sentinels: their shields shrug off blows from the front. After a shield bash the chest rune glows: strike then', 'Sentinels and imps together'],
      ['An imp, a sentinel and a bomb larva: when the bomb lands, hit it while its ring is green and it flies back into a foe', 'Two bomb larvae: return them into the others'],
      ['The whole forge wakes: imps, sentinels and bombs', 'Keep returning the bombs into the sentinels', 'The last of the forge\'s guardians']];
    const gates = ['1', '2', '3', '4'].map(ch => roomGate(X, H, tilesOf(M, ch), P, 'iron', 'PORTCULLIS'));
    const rooms = FO_ROOMS.map((R, i) => ({ name: R.name, y0: R.r0 + 1, y1: R.r1 + 1, spots: R.spots.map(([x, y]) => Wp(x, y)), waves: WAVES[i], teach: TEACH[i], gate: gates[i], clear: i === 3 ? 'The last portcullis rises: the hall of the pressure door' : 'The portcullis rises: on to the next hall',
      special: (ty, q) => { if (ty !== 'tutor') return null; S.lesson = true; return bomb.spawn(q, 913); } }));
    const brood = director(X, P, rooms, { dmgK: CAL_STAGES.DMG_K.FOUNDRY, col: P.RUNE_HI });
    // (v389) fifteen fire vents: four, four, three and three in the halls, one in the entry gallery (none in the ring hall)
    const traps = ventField(X, pickVents(FO_LAYOUT, [{ y0: 87, y1: 94, n: 1 }, { y0: 71, y1: 81, n: 4 }, { y0: 54, y1: 65, n: 4 }, { y0: 37, y1: 48, n: 3 }, { y0: 18, y1: 31, n: 3 }],
      [[FO_CX + 1.5, 92.5, 3.5], [17.5, 87, 2.5]]), { teach: true });
    // the pressure door, its three rings and inscription
    const door = doorway(X, H, tilesOf(M, 'D'), (c, Xs, Ys, T, D) => doorArt(c, Xs, Ys, T, D), { kind: 'calringdoor', dur: 2.2 });
    const ringX = i => (door.x0 + door.x1) / 2 + (i - 1) * 2.9, ringY = door.y1 - 2.1;   // (world: on the door's face)
    const levers = ['A', 'B', 'C'].map((id, i) => { const p = mk[id][0], L = { id, x: p.x, y: p.y, k: 0, flash: 0 };
      L.obj = H.obj({ x: p.x, y: p.y, kind: 'callever', r: 0.75, h: 2.4, label: () => S.solved ? '' : `LEVER ${id}: ${RR_LEVERS[id].map((v, j) => v ? ['LEFT', 'MIDDLE', 'RIGHT'][j] : '').filter(Boolean).join(' + ')}`, draw(c, Xs, Ys, T) { leverArt(c, Xs, Ys, T, L); }, use() { pull(id); } }); S.lever[id] = L; return L; });
    const zp = mk.Z[0], lp = mk.L[0];
    const resetL = { id: 'R', x: zp.x, y: zp.y, k: 0, flash: 0 }; resetL.obj = H.obj({ x: zp.x, y: zp.y, kind: 'calreset', r: 0.75, h: 2.4, label: () => S.solved ? '' : 'RESET: ALL RINGS TO EYE', draw(c, Xs, Ys, T) { leverArt(c, Xs, Ys, T, resetL); }, use() { reset(); } });
    const lectern = H.obj({ x: lp.x, y: lp.y, kind: 'callectern', r: 0.75, h: 2.4, label: () => S.solved ? '' : 'SHOW NEXT MOVE', draw(c, Xs, Ys, T) { lecternArt(c, Xs, Ys, T); }, use() { showNext(); } });
    function turnRings(v) { for (let i = 0; i < 3; i++) if (v[i]) { S.rings[i] = (S.rings[i] + v[i]) % 3; S.flash[i] = 0.6; } }
    function pull(id) { if (S.solved) return; const L = S.lever[id]; L.k = 1; L.flash = 0.6; S.pulls++; turnRings(RR_LEVERS[id]); if (X.sfx.thud) X.sfx.thud(); if (X.sfx.crack) X.sfx.crack(); chime(X, 392 + ['A', 'B', 'C'].indexOf(id) * 98, 0.35);
      X.text(L.x, L.y - 2.6, S.rings.map(r => RUNE_NAMES[r]).join(' · '), RR_COL[id], 14); check(); }
    function reset() { if (S.solved) return; resetL.k = 1; resetL.flash = 0.6; S.resets++; for (let i = 0; i < 3; i++) if (S.rings[i]) { S.rings[i] = 0; S.flash[i] = 0.6; } if (X.sfx.thud) X.sfx.thud(); X.text(resetL.x, resetL.y - 2.6, 'All rings back to EYE', P.RUNE_HI, 14); }
    function showNext() { if (S.solved) return; const plan = ringsPlan(S.rings); S.hints++; S.hintState = S.rings.join(''); S.hintMove = plan && plan[0] || null; chime(X, 660, 0.4);
      X.text(lp.x, lp.y - 2.6, S.hintMove ? `Next: lever ${S.hintMove} (${plan.length} move${plan.length === 1 ? '' : 's'} to go)` : 'Already aligned', P.RUNE_HI, 14); }
    function check() { if (S.rings.join() !== RR_TARGET.join()) return; S.solved = true; S.hintMove = null; X.banner('THE RINGS ALIGN', 'Eye, Chain, Crown: the three rings close into one great iris', P.RUNE_HI, 3, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); X.shake(3, 0.5); }
    function open() { S.opened = true; door.open1(); X.banner('THE PRESSURE DOOR OPENS', 'From the chamber beyond comes a slow, heavy heartbeat', P.RUNE_HI, 3, true, true); S.beatT = 0.6; }
    const shrine = station(X, H, mk.F[0], P, 'Bomb King');
    // (the forge's furniture: the core's props where it has them, else this file's own vessels and rings)
    const coreProps = !!DunWorld.PROPS.vessel;
    if (!coreProps) for (const p of tilesOf(M, 'V')) H.obj({ x: p.x, y: p.y + 0.5, kind: 'calvessel', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { vesselArt(c, Xs, Ys, T, p.tx * 0.7 + p.ty * 0.3); } });
    for (const p of tilesOf(M, 'O')) H.obj({ x: p.x, y: p.y + 0.5, kind: 'calforgering', r: 0.1, h: 6, label: '', draw(c, Xs, Ys, T) { forgeRingArt(c, Xs, Ys, T, p.tx * 0.5 + p.ty * 0.13); } });
    X.after(1.0, () => { S.intro = false; X.banner('THE RUNEBOUND FOUNDRY', 'An ancient forge, older than the rift: cross its grated walkways to the sealed pressure door', P.RUNE_HI, 3.2, true, true); });
    const wantHint = () => S.hintMove && S.hintState === S.rings.join('') ? S.hintMove : null;
    // the camera: close in the halls; in the ring hall, while the rings are unsolved (and until the door has opened), out to
    // the door, its rings, the three levers and their lines
    const rig = camRig(); S.openT = 0;
    const camWant = () => brood.done && me.y < 16.8 && !(S.opened && S.openT > 1.6) ? { zoom: 0.52, x: FO_CX + 1.5, y: 8.6, k: 0.6 } : null;
    return { S, levers, rig, camWant, traps, door, bomb, shrine, brood, rooms, gates, ringsPlan, pull, reset, showNext, RR_LEVERS,
      cam: rig.cam,
      update(dt) { door.tick(dt); shrine.tick(dt); bomb.tick(dt); traps.tick(dt); if (S.opened) S.openT += dt; rig.tick(dt, camWant());
        for (const L of levers.concat([resetL])) { L.k = Math.max(0, L.k - dt * 1.6); L.flash = Math.max(0, L.flash - dt); }
        for (let i = 0; i < 3; i++) { S.flash[i] = Math.max(0, S.flash[i] - dt); const want = S.rings[i] * TAU / 3; let d = want - S.ang[i]; while (d < -Math.PI) d += TAU; while (d > Math.PI) d -= TAU; S.ang[i] += d * Math.min(1, dt * 7); }
        // nearing a lever lights the two rings it turns
        S.near = null; let bd = 2.6; for (const L of levers) { const d = Math.hypot(me.x - L.x, me.y - L.y); if (d < bd) { bd = d; S.near = L.id; } }
        if (S.solved && !S.opened) { S.iris = Math.min(1, S.iris + dt / 2.2); if (S.iris >= 1) open(); }
        if (S.opened) { S.beatT -= dt; if (S.beatT <= 0) { S.beatT = 1.35; S.beat = 1; if (X.sfx.note) { X.sfx.note(52, 0.22, 'sine', 0.55, 38); X.sfx.note(48, 0.2, 'sine', 0.4, 34, 0.24); } } S.beat = Math.max(0, S.beat - dt * 2.2); }
        if (S.intro) return;
        brood.tick(dt); for (const q of gates) if (q) q.tick(dt);
        if (S.solved && S.opened && !self.done && brood.done) { self.done = true; H.setExit((door.x0 + door.x1) / 2, door.y1 + 0.25, 'To the Bomb King');   /* (at the threshold: the engine walks the pet in) */ X.banner('THE FOUNDRY IS YOURS', 'The door stands open: the frost shrine beyond, then the Bomb King', P.RUNE_HI, 2.6, true); } },
      goal() { if (self.done) return 'To the Bomb King'; if (S.intro) return 'The Runebound Foundry';
        if (bomb.st === 'ground' && bomb.safe()) return `Return the bomb · hit it while its ring is ${bomb.own ? 'gold' : 'green'}`;
        if (!brood.done) return brood.goal();
        if (S.solved && !S.opened) return 'The rings align…';
        if (S.solved) return 'Through the door';
        const h = wantHint(); return `Set the rings to EYE · CHAIN · CROWN${h ? ` · next: lever ${h}` : ''}`; },
      hint() { if (self.done || S.intro) return null; if (bomb.st === 'ground' && bomb.safe() && bomb.m) return { x: bomb.m.x, y: bomb.m.y, h: 1.6, label: 'RETURN IT' };
        if (!brood.done) return brood.hint();
        const h = wantHint(); if (h) { const L = S.lever[h]; return { x: L.x, y: L.y, h: 2.5, label: `LEVER ${h}` }; }
        if (!S.solved && me.y > 17) return { x: FO_CX + 1.5, y: 12, h: 1.2, label: 'THE DOOR' }; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, lw = lwOf(T); gr.drawGround(c); bomb.drawGround(c); passageArt(c, T);
        // the physical lines: from each lever across the floor to the door's foot under each of its two rings (and up the door, drawn with it)
        for (const L of levers) { const v = RR_LEVERS[L.id], on = S.near === L.id || wantHint() === L.id, col = RR_COL[L.id];
          for (let i = 0; i < 3; i++) if (v[i]) { const li = ['A', 'B', 'C'].indexOf(L.id), off = (li - 1) * 0.28, x1 = ringX(i) + off, y1 = door.y1 + 0.3, yr = L.y - 1.4 - li * 0.6, pts = [[X.sx(L.x + off), X.sy(L.y - 0.3)], [X.sx(L.x + off), X.sy(yr)], [X.sx(x1), X.sy(yr)], [X.sx(x1), X.sy(y1)]];
            c.save(); c.lineJoin = 'round'; poly(c, pts); c.strokeStyle = P.INK; c.lineWidth = T * 0.2 + lw; c.stroke(); c.strokeStyle = P.IRON; c.lineWidth = T * 0.2; c.stroke(); c.strokeStyle = rgba(col, on ? 1 : 0.55); c.lineWidth = Math.max(2, T * (on ? 0.09 : 0.06)); c.stroke();
            if (on && !lowFx()) { c.setLineDash([T * 0.14, T * 0.3]); c.lineDashOffset = -t * T * 2; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(2, T * 0.05); c.stroke(); c.setLineDash([]); } c.restore(); } } },
      drawOver(c) { const T = X.Tz(), t = g.t;
        // the forge's rune light and the lava's glow, over the dark
        if (!lowFx()) for (const L of levers) if (S.near === L.id || wantHint() === L.id) glow(c, X.sx(L.x), X.sy(L.y) - T * 1.2, T * 1.4, RR_COL[L.id], 0.35);
        if (S.opened) { const k = S.beat; glow(c, X.sx(door.x0 + (door.x1 - door.x0) / 2), X.sy(door.y1) + T * 0.1, T * (1.2 + k * 0.5), P.LAVA_D, 0.12 + 0.18 * k); }   // (only a low red pulse on the sill: the passage stays dark)
        if (camWant() && !S.solved) edgeMarks(X, c, levers.map(L => ({ x: L.x, y: L.y - 1, col: RR_COL[L.id], label: 'LEVER ' + L.id, warn: wantHint() === L.id })).concat([{ x: resetL.x, y: resetL.y - 1, col: '#B8AEA8', label: 'RESET' }, { x: lp.x, y: lp.y - 1, col: P.RUNE_HI, label: 'NEXT MOVE?' }])); } };
    /* ---- the foundry's art ---- */
    function leverArt(c, Xs, Ys, T, L) { const lw = lwOf(T), col = L.id === 'R' ? P.ASH : RR_COL[L.id], on = S.near === L.id || wantHint() === L.id; c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; ell(c, Xs, Ys + T * 0.05, T * 0.75, T * 0.25); c.fill();
      // the iron housing, its rune plate (the letter and which rings), the arm
      const w = T * 1.0, h = T * 1.0, top = Ys - h; const ig = c.createLinearGradient(Xs - w / 2, 0, Xs + w / 2, 0); ig.addColorStop(0, P.IRON_HI); ig.addColorStop(0.5, P.IRON); ig.addColorStop(1, P.IRON_D); c.fillStyle = ig; c.fillRect(Xs - w / 2, top, w, h); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - w / 2, top, w, h);
      c.fillStyle = P.RUST; c.fillRect(Xs - w / 2, top, w, T * 0.12); for (const sx of [-1, 1]) { c.fillStyle = P.IRON_HI; c.beginPath(); c.arc(Xs + sx * w * 0.36, top + T * 0.25, Math.max(1.5, T * 0.045), 0, TAU); c.fill(); }
      const a = -Math.PI / 2 + 0.75 - L.k * 1.5, px = Xs, py = top + T * 0.15; c.strokeStyle = P.INK; c.lineWidth = Math.max(3, T * 0.14); c.lineCap = 'round'; c.beginPath(); c.moveTo(px, py); c.lineTo(px + Math.cos(a) * T * 0.9, py + Math.sin(a) * T * 0.9); c.stroke(); c.strokeStyle = P.IRON_HI; c.lineWidth = Math.max(1.5, T * 0.07); c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(px + Math.cos(a) * T * 0.9, py + Math.sin(a) * T * 0.9, Math.max(3, T * 0.14), 0, TAU); c.fill(); c.strokeStyle = P.INK; c.lineWidth = 1.5; c.stroke();
      if (L.id === 'R') { c.strokeStyle = P.RUNE_HI; c.lineWidth = Math.max(1.5, T * 0.05); c.beginPath(); c.arc(Xs, top + h * 0.6, T * 0.18, -2.4, 2.0); c.stroke(); c.beginPath(); c.moveTo(Xs - T * 0.2, top + h * 0.38); c.lineTo(Xs - T * 0.12, top + h * 0.56); c.lineTo(Xs - T * 0.3, top + h * 0.55); c.fillStyle = P.RUNE_HI; c.fill(); }
      else { label(c, L.id, Xs, top + h * 0.62, T * 0.32, col); const v = RR_LEVERS[L.id]; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(Xs + (i - 1) * T * 0.26, top + h * 0.86, T * 0.08, 0, TAU); if (v[i]) { c.fillStyle = col; c.fill(); } else { c.strokeStyle = 'rgba(255,255,255,.5)'; c.lineWidth = 1.2; c.stroke(); } } }
      if (on || L.flash > 0) { c.strokeStyle = rgba(col, 0.9); c.lineWidth = Math.max(2, T * 0.06); c.strokeRect(Xs - w / 2 - 3, top - 3, w + 6, h + 6); }
      c.restore(); }
    function lecternArt(c, Xs, Ys, T) { const lw = lwOf(T), t = g.t; c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; ell(c, Xs, Ys + T * 0.05, T * 0.7, T * 0.22); c.fill();
      c.fillStyle = P.BASALT_HI; c.fillRect(Xs - T * 0.18, Ys - T * 0.9, T * 0.36, T * 0.9); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(Xs - T * 0.18, Ys - T * 0.9, T * 0.36, T * 0.9);
      poly(c, [[Xs - T * 0.6, Ys - T * 0.95], [Xs + T * 0.6, Ys - T * 0.95], [Xs + T * 0.48, Ys - T * 1.45], [Xs - T * 0.48, Ys - T * 1.45]]); c.closePath(); c.fillStyle = P.IRON; c.fill(); c.stroke();
      // a tablet of the three rings, the inscription's order, and an arrow: the next move
      for (let i = 0; i < 3; i++) glyph(c, Xs + (i - 1) * T * 0.34, Ys - T * 1.2, T * 0.12, RR_TARGET[i], P.RUNE_HI, Math.max(1.2, T * 0.035));
      c.restore(); label(c, '?', Xs, Ys - T * 1.6, T * 0.3, P.RUNE_HI); glow(c, Xs, Ys - T * 1.2, T * 0.9, P.RUNE, 0.25 + 0.1 * Math.sin(t * 2)); }
    function ringArt(c, x, y, R, i, lw, hi) { const t = g.t, col = hi ? (RR_COL[hi] || P.RUNE_HI) : P.RUNE;
      // a heavy iron ring, rivets and three glyph windows round it; the current glyph in the window at the top, large in the middle
      c.save(); c.beginPath(); c.arc(x, y, R, 0, TAU); c.fillStyle = '#16120F'; c.fill();
      c.beginPath(); c.arc(x, y, R, 0, TAU); c.arc(x, y, R * 0.66, 0, TAU, true); const rg = c.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.2, x, y, R); rg.addColorStop(0, P.IRON_HI); rg.addColorStop(1, P.IRON_D); c.fillStyle = rg; c.fill('evenodd'); c.strokeStyle = P.INK; c.lineWidth = lw; c.beginPath(); c.arc(x, y, R, 0, TAU); c.stroke(); c.beginPath(); c.arc(x, y, R * 0.66, 0, TAU); c.stroke();
      for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + S.ang[i]; c.fillStyle = P.IRON_HI; c.beginPath(); c.arc(x + Math.cos(a) * R * 0.92, y + Math.sin(a) * R * 0.92, Math.max(1.2, R * 0.04), 0, TAU); c.fill(); }
      for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * TAU / 3 - S.ang[i], gx = x + Math.cos(a) * R * 0.83, gy = y + Math.sin(a) * R * 0.83; c.beginPath(); c.arc(gx, gy, R * 0.15, 0, TAU); c.fillStyle = '#100C0A'; c.fill(); glyph(c, gx, gy, R * 0.1, k, rgba(P.RUNE, 0.75), Math.max(1, R * 0.025)); }
      const cur = S.rings[i], k = S.flash[i]; c.beginPath(); c.arc(x, y, R * 0.6, 0, TAU); c.fillStyle = '#1E1612'; c.fill(); glyph(c, x, y, R * 0.38, cur, k > 0 ? '#FFFFFF' : P.RUNE_HI, Math.max(2, R * 0.08));
      if (hi) { c.strokeStyle = col; c.lineWidth = Math.max(3, R * 0.08); c.beginPath(); c.arc(x, y, R * 1.08, 0, TAU); c.stroke(); }
      c.restore(); glow(c, x, y, R * 1.2, cur === RR_TARGET[i] ? P.RUNE : P.LAVA, 0.2 + 0.4 * k + (hi ? 0.2 : 0));
      label(c, RUNE_NAMES[cur], x, y + R + R * 0.38, R * 0.22, cur === RR_TARGET[i] ? P.RUNE_HI : '#E8D6C0'); }
    /* the open door's dark passage (on the ground layer, under the pet): the dark deepens away from the sill, the passage's
       walls recede, the faint red of the heartbeat far inside; a shadow spills onto the floor in front (it also keeps the
       exit's own gate light, under it, from showing: the doorway reads dark, not lit) */
    function passageArt(c, T) { const open = door.k; if (!door.open || open <= 0) return; const Xs = X.sx(door.obj.x), Ys = X.sy(door.obj.y), w = (door.x1 - door.x0) * T, L = Xs - w / 2, H0 = T * 4.6, top = Ys - H0; if (Ys < -T || top > X.H() + T) return;
      c.save(); const sg = c.createRadialGradient(Xs, Ys + T * 0.2, T * 0.3, Xs, Ys + T * 0.2, w * 0.62); sg.addColorStop(0, `rgba(6,3,3,${0.9 * open})`); sg.addColorStop(0.55, `rgba(6,3,3,${0.6 * open})`); sg.addColorStop(1, 'rgba(6,3,3,0)'); c.fillStyle = sg; ell(c, Xs, Ys + T * 0.2, w * 0.62, T * 1.3); c.fill();
      // (an opaque dark: the exit's gate, under it, never shows through), then the passage floor just inside, faint and fading
      const dg = c.createLinearGradient(0, Ys, 0, top); dg.addColorStop(0, '#120B09'); dg.addColorStop(0.3, '#080404'); dg.addColorStop(1, '#030101'); c.fillStyle = dg; c.fillRect(L, top, w, H0);
      const fg = c.createLinearGradient(0, Ys, 0, Ys - H0 * 0.4); fg.addColorStop(0, `rgba(70,52,46,${0.55 * open})`); fg.addColorStop(1, 'rgba(70,52,46,0)'); c.fillStyle = fg; poly(c, [[L, Ys], [L + w, Ys], [L + w * 0.8, Ys - H0 * 0.4], [L + w * 0.2, Ys - H0 * 0.4]]); c.closePath(); c.fill();
      c.strokeStyle = `rgba(20,12,10,${0.6 * open})`; c.lineWidth = 1.2; for (let i = 1; i < 4; i++) { const y = Ys - H0 * 0.4 * (1 - Math.pow(1 - i / 4, 1.6)), k = (Ys - y) / (H0 * 0.4) * 0.2; c.beginPath(); c.moveTo(L + w * k, y); c.lineTo(L + w * (1 - k), y); c.stroke(); }
      c.fillStyle = `rgba(30,22,20,${0.75 * open})`; for (const sd of [-1, 1]) { const ox = sd < 0 ? L : L + w; poly(c, [[ox, Ys], [ox + sd * -w * 0.2, top + H0 * 0.38], [ox + sd * -w * 0.2, top], [ox, top]]); c.closePath(); c.fill(); }
      c.strokeStyle = `rgba(90,60,50,${0.35 * open})`; c.lineWidth = 1.2; for (const sd of [-1, 1]) { const ox = sd < 0 ? L : L + w; c.beginPath(); c.moveTo(ox, Ys); c.lineTo(ox + sd * -w * 0.2, top + H0 * 0.38); c.stroke(); }
      c.restore(); glow(c, Xs, top + H0 * 0.2, w * (0.16 + 0.05 * S.beat), P.LAVA_D, (0.2 + 0.3 * S.beat) * open); }
    function doorArt(c, Xs, Ys, T, D) { const lw = lwOf(T), t = g.t, w = (D.x1 - D.x0) * T, L = Xs - w / 2, H0 = T * 4.6, top = Ys - H0, open = D.k;
      c.save();
      // the frame: basalt jambs and a lintel carved with the inscription
      c.fillStyle = P.BASALT_D; c.fillRect(L - T * 0.9, top - T * 1.2, T * 0.9, H0 + T * 1.2); c.fillRect(L + w, top - T * 1.2, T * 0.9, H0 + T * 1.2); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(L - T * 0.9, top - T * 1.2, T * 0.9, H0 + T * 1.2); c.strokeRect(L + w, top - T * 1.2, T * 0.9, H0 + T * 1.2);
      c.fillStyle = P.BASALT_HI; c.fillRect(L - T * 0.9, top - T * 1.25, w + T * 1.8, T * 1.05); c.strokeRect(L - T * 0.9, top - T * 1.25, w + T * 1.8, T * 1.05);
      for (let i = 0; i < 3; i++) { const gx = Xs + (i - 1) * T * 2.4; glyph(c, gx - T * 0.45, top - T * 0.72, T * 0.26, RR_TARGET[i], P.RUNE_HI, Math.max(1.5, T * 0.05)); label(c, RUNE_NAMES[RR_TARGET[i]], gx + T * 0.4, top - T * 0.62, T * 0.2, P.RUNE_HI); if (i < 2) label(c, '—', gx + T * 1.2, top - T * 0.62, T * 0.2, P.RUNE_HI); }
      // beyond the door: shut, flat black. Once it opens, the dark passage is drawn on the ground instead (passageArt), under the
      // pet, so the engine's own walk-in (the pet walked in, silhouetted and erased from the feet up) plays over it and nothing
      // of this file darkens the pet a second time
      if (open <= 0) { c.fillStyle = '#0B0605'; c.fillRect(L, top, w, H0); }
      // the two door leaves, sliding apart
      for (const sd of [-1, 1]) { const lw2 = w / 2 * (1 - open * 0.92), x0 = sd < 0 ? L : Xs + w / 2 * open * 0.92; if (lw2 < 1) continue; const ig = c.createLinearGradient(x0, 0, x0 + lw2, 0); ig.addColorStop(0, sd < 0 ? P.IRON_HI : P.IRON); ig.addColorStop(1, sd < 0 ? P.IRON : P.IRON_D); c.fillStyle = ig; c.fillRect(x0, top, lw2, H0); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(x0, top, lw2, H0);
        c.fillStyle = 'rgba(0,0,0,.3)'; for (let r = 1; r < 5; r++) c.fillRect(x0, top + H0 * r / 5, lw2, 2); c.fillStyle = P.IRON_HI; for (let r = 0; r < 6; r++) for (let q = 0; q < 2; q++) { c.beginPath(); c.arc(x0 + lw2 * (0.15 + q * 0.7), top + H0 * (0.08 + r * 0.17), Math.max(1.2, T * 0.04), 0, TAU); c.fill(); }
        c.strokeStyle = rgba(P.RUNE, 0.45); c.lineWidth = Math.max(1, T * 0.03); for (let r = 0; r < 4; r++) { const yy = top + H0 * (0.7 + r * 0.06); c.beginPath(); c.moveTo(x0 + lw2 * 0.1, yy); c.lineTo(x0 + lw2 * 0.9, yy); c.stroke(); } }
      c.restore();
      // the rings: on the leaves while shut; then sliding together and swelling into one great iris
      const R = T * 1.15, cy = top + H0 * 0.42; const nearL = S.near && !S.solved ? S.near : wantHint();
      if (S.iris < 0.02 || !S.solved) { for (let i = 0; i < 3; i++) { const hiL = nearL && RR_LEVERS[nearL][i] ? nearL : null; ringArt(c, Xs + (i - 1) * T * 2.9, cy, R, i, lw, hiL);
          // the line up the door from its foot to the ring, in each lever's colour
          for (const id of ['A', 'B', 'C']) if (RR_LEVERS[id][i]) { const off = (['A', 'B', 'C'].indexOf(id) - 1) * 0.28, x = Xs + (i - 1) * T * 2.9 + off * T, on = nearL === id; c.save(); c.strokeStyle = rgba(RR_COL[id], on ? 1 : 0.5); c.lineWidth = Math.max(2, T * (on ? 0.09 : 0.05)); c.beginPath(); c.moveTo(x, Ys); c.lineTo(x, cy + R); c.stroke(); c.restore(); } } }
      else if (open < 1) { const u = S.iris, e = u * u * (3 - 2 * u), RR = R * (1 + e * 0.9); c.save(); c.globalAlpha = 1 - open; for (let i = 0; i < 3; i++) { const x = Xs + (i - 1) * T * 2.9 * (1 - e); ringArt(c, x, cy, RR * (1 - i * 0.12 * e), i, lw, null); }
        // the iris: rings of glyph light closing round a molten pupil
        c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + t * 0.6; c.strokeStyle = rgba(P.RUNE_HI, 0.5 * e); c.lineWidth = Math.max(2, T * 0.06); c.beginPath(); c.arc(Xs, cy, RR * (0.35 + k * 0.1), a, a + 2.2); c.stroke(); } c.restore(); glow(c, Xs, cy, RR * 1.5 * e, P.LAVA_HI, 0.6 * e * (1 - open)); }
      if (!D.open && !S.solved) label(c, 'THE PRESSURE DOOR', Xs, top - T * 1.55, T * 0.24, P.RUNE_HI); else if (D.open && self.done) label(c, 'TO THE BOMB KING', Xs, top - T * 1.55, T * 0.24, '#8FE0A6'); }   // (the one caption: the exit gate's own label is under the dark passage)
    function vesselArt(c, Xs, Ys, T, ph) { const lw = lwOf(T), t = g.t, w = T * 1.3, h = T * 2.0, top = Ys - h; c.save(); c.fillStyle = 'rgba(0,0,0,.4)'; ell(c, Xs, Ys, w * 0.6, T * 0.25); c.fill();
      // a riveted pressure vessel: a domed iron tank, engraved runes glowing faintly, a gauge, a hissing valve
      c.beginPath(); c.moveTo(Xs - w / 2, Ys - T * 0.1); c.lineTo(Xs - w / 2, top + w * 0.3); c.quadraticCurveTo(Xs - w / 2, top - w * 0.15, Xs, top - w * 0.2); c.quadraticCurveTo(Xs + w / 2, top - w * 0.15, Xs + w / 2, top + w * 0.3); c.lineTo(Xs + w / 2, Ys - T * 0.1); c.closePath();
      const ig = c.createLinearGradient(Xs - w / 2, 0, Xs + w / 2, 0); ig.addColorStop(0, P.IRON_HI); ig.addColorStop(0.4, P.IRON); ig.addColorStop(1, P.IRON_D); c.fillStyle = ig; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      for (const u of [0.25, 0.6, 0.88]) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(Xs - w / 2, top + h * u, w, T * 0.06); c.fillStyle = P.IRON_HI; for (let q = 0; q < 5; q++) { c.beginPath(); c.arc(Xs - w / 2 + w * (0.1 + q * 0.2), top + h * u - T * 0.06, Math.max(1, T * 0.035), 0, TAU); c.fill(); } }
      c.strokeStyle = rgba(P.RUNE, 0.5 + 0.3 * Math.sin(t * 1.4 + ph)); c.lineWidth = Math.max(1.2, T * 0.04); c.beginPath(); c.moveTo(Xs - w * 0.25, top + h * 0.38); c.lineTo(Xs - w * 0.1, top + h * 0.5); c.lineTo(Xs - w * 0.25, top + h * 0.55); c.moveTo(Xs + w * 0.05, top + h * 0.36); c.lineTo(Xs + w * 0.05, top + h * 0.56); c.moveTo(Xs + w * 0.05, top + h * 0.46); c.lineTo(Xs + w * 0.25, top + h * 0.4); c.stroke();
      c.beginPath(); c.arc(Xs + w * 0.18, top + h * 0.74, T * 0.16, 0, TAU); c.fillStyle = '#E8DCC6'; c.fill(); c.strokeStyle = P.INK; c.lineWidth = 1.2; c.stroke(); const na = -2.4 + 1.6 * (0.5 + 0.5 * Math.sin(t * 0.7 + ph)); c.beginPath(); c.moveTo(Xs + w * 0.18, top + h * 0.74); c.lineTo(Xs + w * 0.18 + Math.cos(na) * T * 0.13, top + h * 0.74 + Math.sin(na) * T * 0.13); c.strokeStyle = '#B3260E'; c.stroke();
      if (!lowFx()) { const u = (t * 0.5 + ph) % 1; glow(c, Xs + w * 0.3, top - u * T * 0.9, T * (0.3 + u * 0.4), '#FFE8D0', 0.3 * (1 - u)); }
      c.restore(); }
    /* the giant suspended rings of the old forge: iron armillary rings on broken chains, slowly turning, runes on their bands */
    function forgeRingArt(c, Xs, Ys, T, ph) { const t = g.t, R = T * 2.3, cy = Ys - T * 3.2, k = Math.cos(t * 0.25 + ph); c.save();
      // the chains, up and out of sight; one broken and dangling
      c.strokeStyle = 'rgba(30,24,22,.9)'; c.lineWidth = Math.max(2, T * 0.08); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(Xs + sd * R * 0.55, cy - R * 0.85); c.lineTo(Xs + sd * R * 0.9, cy - T * 9); c.stroke(); }
      c.strokeStyle = P.IRON_HI; c.lineWidth = Math.max(1, T * 0.035); for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const u = i / 9, x = Xs + sd * (R * 0.55 + (R * 0.35) * u), y = cy - R * 0.85 - (T * 9 - R * 0.85) * u; ell(c, x, y, T * 0.05, T * 0.1, sd * 0.2); c.stroke(); }
      c.strokeStyle = 'rgba(30,24,22,.9)'; c.lineWidth = Math.max(2, T * 0.07); c.beginPath(); c.moveTo(Xs, cy + R * 0.95); c.lineTo(Xs + Math.sin(t * 0.8 + ph) * T * 0.3, cy + R * 0.95 + T * 1.4); c.stroke();
      // two rings at right angles, turning
      for (const [rx, ry, rot] of [[R * Math.abs(k) + R * 0.08, R, 0], [R, R * 0.32, Math.sin(t * 0.18 + ph) * 0.3]]) { c.save(); c.translate(Xs, cy); c.rotate(rot); c.strokeStyle = P.INK; c.lineWidth = T * 0.36; ell(c, 0, 0, rx, ry); c.stroke(); c.strokeStyle = P.IRON; c.lineWidth = T * 0.26; c.stroke(); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = T * 0.06; ell(c, -T * 0.04, -T * 0.05, rx, ry); c.stroke();
        c.setLineDash([T * 0.12, T * 0.3]); c.lineDashOffset = t * T * 0.2 + ph * 10; c.strokeStyle = rgba(P.RUNE, 0.7); c.lineWidth = Math.max(1.5, T * 0.06); ell(c, 0, 0, rx, ry); c.stroke(); c.restore(); }
      c.restore(); glow(c, Xs, cy, R * 1.1, P.RUNE, 0.12); }
  }
  CAL_STAGES.FOUNDRY = { name: 'The Runebound Foundry', goal: 'Cross the forge and open the pressure door', how: 'Grated walkways cross the lava through four forge halls, each shut by a portcullis until its brood is down: about forty in all, in waves. Furnace imps throw slow embers at shown circles and back off; runic sentinels guard behind their shields until they attack, then show a glowing rune (strike that). In the third hall a bomb larva lands with a ring round it: while the ring is green, hit the grounded bomb with any attack and it flies back into a monster (it never hurts your pet); once it flashes red, get clear. Then every kind together. Beyond the last hall, the pressure door has three rings, each showing Eye, Chain or Crown; the inscription above reads EYE, CHAIN, CROWN. Lever A turns the left and middle rings one step, B the middle and right, C the left and right (stand beside a lever to pull it: its two rings light as you near it). The reset lever sets every ring back to Eye; the lectern shows the next move from wherever the rings are now. No penalty for wrong turns. Solved, the rings close into an iris and the door opens.',
    layout: FO_LAYOUT, legend: { E: {}, F: {}, g: {}, D: {}, A: {}, B: {}, C: {}, Z: {}, L: {}, 1: {}, 2: {}, 3: {}, 4: {}, O: { tile: T_GAP },
      V: { tile: T_SOLID, get prop() { return DunWorld.PROPS.vessel ? 'vessel' : undefined; } }, K: PROP('forge', 'boiler'), H: PROP('chains', 'pipe'), R: PROP('metalring', 'gear'), N: PROP('anvil', 'drum') }, make: makeFoundry, plan: ringsPlan, levers: RR_LEVERS, target: RR_TARGET };

  /* ======================= THE HEARTWARD DESCENT ======================= */
  /* rows from the top: the lava lake round Ifrit's throne · the overlook (door, shrine) · the approach (its slag gate) ·
     ledge 3 · causeway 3 · ledge 2 · causeway 2 · ledge 1 · causeway 1 · ledge 0 (start). The causeways cross the cathedral's
     drop; on the three broad, cool ledges the brood rises in waves (about forty in all) */
  const DE_W = 31, DE_H = 105, DE_CX = 15;
  const DE_LEDGES = [{ y0: 97, y1: 103, back: [15, 99] }, { y0: 76, y1: 85, back: [15, 83] }, { y0: 56, y1: 65, back: [15, 63] }, { y0: 35, y1: 45, back: [15, 43] }];
  const DE_LANES = [[86, 96], [66, 75], [46, 55]];
  const DE_VENT = { idle: 1.6, warn: 1.9, erupt: 0.8, cool: 0.9 }, DE_VENT_R = 1.3;
  const DE_ROOMS = [{ name: 'The First Ledge', li: 1 }, { name: 'The Crystal Ledge', li: 2 }, { name: 'The High Ledge', li: 3 }];
  /* THE EMBER COURT: a round basalt platform (layout centre 15.5, 23.5) over the lava below the overlook, ringed by six furnace
     idols on pillars in the lava. First they hurl molten balls: six DODGED throws (rolled through, or side-stepped close).
     Then they wake, crack free and stomp down onto the platform, two at a time, and charge the pet: dodge at the last moment and
     the charge carries on into another idol (both crack; two crashes shatter one). Blows barely scratch them. Hits only chip */
  const EC_C = [15.5, 23.5], EC_RX = 9, EC_RY = 6.5, EC_NEED = 6;
  const EC_IDOLS = { NW: [8, 18], NE: [22, 18], W: [5, 23], E: [25, 23], SW: [8, 29], SE: [22, 29] };
  const EC_PAIRS = [['W', 'E'], ['NW', 'SE'], ['NE', 'SW']];   // (the order they wake in: each pair faces each other across the court)
  const EC_CHIP = 0.08, EC_SLAM = 0.06, EC_HP = 100, EC_SCRATCH = [90, 40];   // (a blow scratches; it never takes an idol below these)
  /* the shatter: a big burst of basalt debris, embers and smoke, a shockwave. THE SEAM: another worker's shared destruction
     helper replaces this one assignment (or CAL_STAGES.shatterFx = theirs); it is called once per idol, as
     shatterFx(X, { x, y, h, r, col, hot, kind: 'idol', debris }) where debris is the stage's own list of flying chunks */
  CAL_STAGES.shatterFx = function (X, o) { const lf = lowFx(), n = lf ? 8 : 22;
    for (let i = 0; i < n; i++) { const a = Math.random() * TAU, sp = 2 + Math.random() * 5; o.debris.push({ x: o.x + Math.cos(a) * 0.3, y: o.y + Math.sin(a) * 0.2, z: 0.4 + Math.random() * o.h, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 2 + Math.random() * 5, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 14, s: 0.12 + Math.random() * 0.22, life: 1.4 + Math.random() * 0.6, hot: Math.random() < 0.45 }); }
    X.boom(o.x, o.y - 0.4, 2.2, o.col, o.hot || '#FFE9B0', { n: lf ? 10 : 30, shake: 0 }); X.ring(o.x, o.y, 0.3, 3.6, 0.55, '#FFE0C0', 0.6);
    if (!lf) for (let i = 0; i < 8; i++) X.part({ kind: 'smoke', x: o.x + (Math.random() - 0.5) * 1.4, y: o.y - 0.3 - Math.random(), vx: (Math.random() - 0.5), vy: -0.8 - Math.random(), life: 1.4, max: 1.4, size: 0.8 + Math.random() * 0.5, color: '#4A403C' });
    X.shake(lf ? 3 : 10, 0.6); if (!lf) X.flash(0.22, '#FFE0C0'); if (X.sfx.crash) X.sfx.crash(); if (X.sfx.thud) X.sfx.thud(); };
  const DE_LAYOUT = (() => { const g = grid(DE_W, DE_H, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    rect(1, 0, 29, 9, '~'); rect(3, 10, 27, 96, '~');
    // the overlook; the court's north gate (its idols cool at twelve); the court; the gate up from the high ledge
    rect(7, 10, 23, 14); g[11][15] = 'E'; g[12][10] = 'F'; rect(13, 15, 17, 17); for (let x = 13; x <= 17; x++) g[15][x] = 'Y';
    for (let y = 16; y <= 31; y++) for (let x = 3; x <= 27; x++) if (Math.pow((x + 0.5 - EC_C[0]) / EC_RX, 2) + Math.pow((y + 0.5 - EC_C[1]) / EC_RY, 2) < 1) g[y][x] = '.';
    for (const k in EC_IDOLS) { const [x, y] = EC_IDOLS[k]; g[y][x] = 'T'; }
    rect(13, 30, 17, 34); for (let x = 13; x <= 17; x++) g[33][x] = 'W';
    // the ledges (their corners broken off into the drop) and the causeways between them
    for (const L of DE_LEDGES) { const x0 = L.y0 === 97 ? 6 : 4, x1 = L.y0 === 97 ? 24 : 26; rect(x0, L.y0, x1, L.y1); for (const [x, y] of [[x0, L.y0], [x1, L.y0], [x0, L.y1], [x1, L.y1]]) g[y][x] = '~'; }
    for (const [a, b] of DE_LANES) rect(13, a, 17, b);
    g[101][15] = 'S';
    // the vents (each lane: centre at its foot, then west, then east), the slag barricades at the second and third lanes' feet
    for (const [a, b] of DE_LANES) for (const [x, dy] of [[15, 2], [14, 5], [16, 8]]) g[b - dy][x] = 'v';
    for (let x = 13; x <= 17; x++) { g[75][x] = 'X'; g[55][x] = 'U'; }
    // basalt columns and black crystals on the ledges, hanging slabs over the drop, lavafalls in the walls
    for (const L of DE_LEDGES) { const y0 = L.y0; if (y0 !== 97) { g[y0 + 2][5] = 'H'; g[y0 + 2][25] = 'H'; g[y0 + 7][6] = 'C'; g[y0 + 6][24] = 'C'; g[y0 + 4][2] = 'L'; g[y0 + 5][28] = 'L'; } }
    g[99][7] = 'H'; g[99][23] = 'H'; g[102][8] = 'C'; g[102][22] = 'C';
    for (const [a] of DE_LANES) { g[a + 4][8] = 'O'; g[a + 7][22] = 'O'; }
    for (const [x, y] of [[6, 12], [24, 13], [5, 35], [25, 42], [3, 17], [27, 17], [3, 29], [27, 30]]) g[y][x] = 'G';
    return g.map(r => r.join('')); })();
  function makeDescent(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, P = pal(), E = mk.E[0];
    const S = { intro: true, ledge: 0, demo: 0, falls: 0, hits: 0, done: false, breath: 0 };
    const ledgeOf = y => { for (let i = 0; i < DE_LEDGES.length; i++) { const L = DE_LEDGES[i]; if (y >= L.y0 + 1 && y <= L.y1 + 2) return i; } return -1; };
    const backOf = i => Wp(DE_LEDGES[i].back[0], DE_LEDGES[i].back[1]);
    // the vents: each runs idle -> warn (glow and hiss) -> erupt -> cool; a lane's vents roll from its foot to its head
    const vents = tilesOf(M, 'v').sort((a, b) => b.y - a.y).map((p, i) => ({ i, x: p.x, y: p.y, lane: Math.floor(i / 3), ph: 'idle', t: 0, off: (i % 3) * 1.45, hitDone: false, erupts: 0, live: false, demo: false }));
    function ventTick(v, dt) { if (!v.live && !v.demo) { v.ph = 'idle'; return; } v.t += dt; const L = v.demo ? { idle: 0.6, warn: 2.4, erupt: 0.9, cool: 1 } : DE_VENT, a = L.idle, b = a + L.warn, c2 = b + L.erupt, d = c2 + L.cool;
      const ph0 = v.ph; v.ph = v.t < a ? 'idle' : v.t < b ? 'warn' : v.t < c2 ? 'erupt' : 'cool'; v.k = v.ph === 'warn' ? (v.t - a) / L.warn : v.ph === 'erupt' ? (v.t - b) / L.erupt : 0;
      if (v.ph === 'warn' && ph0 !== 'warn') { if (Math.hypot(me.x - v.x, me.y - v.y) < 11 && X.sfx.hiss) X.sfx.hiss(L.warn * 0.9, 0.12, 1800); X.warn({ x: v.x, y: v.y, r: DE_VENT_R, life: L.warn, max: L.warn, color: P.WARN }); }
      if (v.ph === 'erupt' && ph0 !== 'erupt') { v.erupts++; v.hitDone = false; if (Math.hypot(me.x - v.x, me.y - v.y) < 12) { X.shake(3, 0.25); if (X.sfx.crash) X.sfx.crash(); } X.boom(v.x, v.y - 0.3, 1.0, P.LAVA, P.LAVA_HI, { n: 14, shake: 0 }); }
      if (v.ph === 'erupt' && v.k < 0.45 && !v.demo) { if (!v.hitDone && !me.dead && Math.hypot(me.x - v.x, me.y - v.y) < DE_VENT_R + (me.r || 0.35) * 0.5) { v.hitDone = true; S.hits++; const C = CALR();
          if (C && typeof C.fall === 'function') { if (!me.dodge && !(me.inv > 0) && !me.dash) { X.boom(me.x, me.y, 1.0, P.LAVA, '#FFFFFF', { n: 10, shake: 4 }); X.text(me.x, me.y - 1.3, 'Thrown off the causeway!', P.WARN, 15); S.falls++; C.fall(X, { k: 0.1, text: 'Back on the ledge' }); me.inv = Math.max(me.inv || 0, 1.2); } }
          else if (X.hurtPet(X.ST().hp * 0.1, null, { vent: true })) fall(v); }
        for (const m of X.mons) if (!m.dead && !m.vented && Math.hypot(m.x - v.x, m.y - v.y) < DE_VENT_R + m.r * 0.5) { m.vented = true; X.hitMon(m, m.maxhp * 0.3, { flat: true, src: 'hazard' }); X.after(1, () => { m.vented = false; }); } }
      if (v.t >= d) { v.t = 0; if (v.demo) { v.demo = false; S.demo = 2; X.banner('VENTS ERUPT', 'Each one glows and hisses first: cross when it is dark, or right behind its blast', P.LAVA_HI, 3, true); liveLane(0); } } }
    const liveLane = n => { for (const q of vents) if (q.lane === n && !q.live) { q.live = true; q.t = -q.off * 0.9; } };
    // an eruption throws you off the causeway: you land back on the last ledge (its damage the penalty)
    function fall(v) { S.falls++; const b = backOf(S.ledge); X.text(me.x, me.y - 1.3, 'Thrown off the causeway!', P.WARN, 15); X.boom(me.x, me.y, 1.0, P.LAVA, '#FFFFFF', { n: 10, shake: 4 });
      me.x = b.x; me.y = b.y; me.vx = me.vy = 0; me.inv = Math.max(me.inv || 0, 1.2); X.ring(b.x, b.y, 0.2, 1.6, 0.4, P.ASH, 0.4); X.text(b.x, b.y - 1.3, 'Back on the ledge', '#FFFFFF', 13); }
    // the brood, about forty, ledge by ledge: knights, crystal wisps, then all of them with the hollows' kin
    const KN = 'ashenknight', CW = 'crystalwisp', SL = 'cinderslug', CR = 'basaltcrawler', EW = 'emberwisp', IM = 'furnaceimp';
    const WAVES = [[[KN, KN], [KN, KN, CR, SL], [KN, SL, CR, SL, KN]], [[CW, CW, CW], [CW, CW, KN, KN], [CW, KN, EW, EW, SL, CR]], [[KN, KN, CW, CW, CR], [KN, KN, KN, CW, CW], [KN, KN, CW, CW, CR, IM]]];
    const TEACH = [['Ashen knights: one slow three-blow combo each. Wait it out, then strike', 'Knights with the hollows\' kin', 'The last of the first ledge'],
      ['Crystal wisps: each marks one line, then fires a beam along it. Step off the line, then strike', 'Wisps and knights together: watch the marked lines', 'Wisps, knights and embers'],
      ['The high ledge: knights and wisps together', 'More knights: keep moving between their combos', 'The last guardians before the throne']];
    const gates = ['X', 'U', 'W'].map(ch => roomGate(X, H, tilesOf(M, ch), P, 'slag', 'COOLING SLAG'));
    const rooms = DE_ROOMS.map((R, i) => { const L = DE_LEDGES[R.li], y0 = L.y0; return { name: R.name, y0: L.y0 + 1, y1: L.y1 + 0.8, spots: [[8, y0 + 2], [22, y0 + 2], [15, y0 + 1], [8, y0 + 6], [22, y0 + 6], [15, y0 + 4]].map(([x, y]) => Wp(x, y)), waves: WAVES[i], teach: TEACH[i], gate: gates[i],
      clear: i === 2 ? 'The slag gives way: the Ember Court lies above' : 'The slag gives way: the next causeway is open' }; });
    const brood = director(X, P, rooms, { dmgK: CAL_STAGES.DMG_K.DESCENT, onRoom(R, i) { if (i < 2) liveLane(i + 1); } });
    // (v389) fifteen fire vents on the ledges: three on the start ledge, four on each ledge of brood (never on the causeways,
    //  where the lane vents are, nor at a ledge's respawn spot or a lane's ends; none in the Ember Court)
    const traps = ventField(X, pickVents(DE_LAYOUT, [{ y0: 97, y1: 103, n: 3 }, { y0: 76, y1: 85, n: 4 }, { y0: 56, y1: 65, n: 4 }, { y0: 35, y1: 45, n: 4 }],
      [[16.5, 102.5, 3.5]].concat(DE_LEDGES.map(L => [L.back[0] + 1.5, L.back[1] + 1.5, 2.6]), DE_LANES.flatMap(([a, b]) => [[16.5, a + 1.5, 2.6], [16.5, b + 1.5, 2.6]]), [[16.5, 34.5, 3]])), { teach: false });
    const shrine = station(X, H, mk.F[0], P, 'Ifrit');
    // (columns, crystals and slabs: the core's props where it has them, else this file's own)
    const coreProps = !!DunWorld.PROPS.basaltcol;
    if (!coreProps) { for (const p of tilesOf(M, 'H')) H.obj({ x: p.x, y: p.y + 0.5, kind: 'calcolumn', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { columnArt(c, Xs, Ys, T, p.tx * 0.3 + p.ty * 0.7); } });
      for (const p of tilesOf(M, 'O')) H.obj({ x: p.x, y: p.y + 0.5, kind: 'calslab', r: 0.1, h: 4, label: '', draw(c, Xs, Ys, T) { slabArt(c, Xs, Ys, T, p.tx * 0.41 + p.ty * 0.07); } }); }
    for (const p of tilesOf(M, 'C')) { const ph = (p.tx * 0.37 + p.ty * 0.11) % 1, big = 1.4 + (DE_H - p.ty) / DE_H * 1.1; block(X, p.tx, p.ty); H.obj({ x: p.x, y: p.y + 0.4, kind: 'calcrystal', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { crystalArt(c, Xs, Ys, T * big, g.t, ph, P); } }); }
    /* ---- THE EMBER COURT: six dodged throws; then the idols wake, and are shattered by luring them into each other ---- */
    const ctr = Wp(EC_C[0] - 0.5, EC_C[1] - 0.5), ecIn = (x, y, pad) => Math.pow((x - ctr.x) / (EC_RX + (pad || 0)), 2) + Math.pow((y - ctr.y) / (EC_RY + (pad || 0)), 2) < 1;
    const touchUI = (() => { try { return matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0; } catch (e) { return true; } })();
    const C = { on: false, phase: 'idle', count: 0, t: 0, next: 2.2, winds: [], balls: [], hits: 0, voids: 0, far: 0, streak: 0, slow: false, prompt: 0, promptWord: '', done: false, cool: 0, pop: 0, popWord: '', attacks: 0, log: [],
      wt: 0, pair: -1, shattered: 0, crashes: 0, perfects: 0, chargeHits: 0, charges: 0, atkCd: 0, turn: 0, debris: [], scratches: 0, joinT: 0, doneT: 0, hitRow: 0, closes: 0 };
    S.court = C;
    const onFloor = th => th.st === 'leap' || th.st === 'hunt' || th.st === 'wind' || th.st === 'charge' || th.st === 'stun';
    const idols = {}; for (const k in EC_IDOLS) { const [x, y] = EC_IDOLS[k], w = Wp(x, y), th = { id: k, x: w.x, y: w.y, px: w.x, py: w.y, wind: 0, flash: 0, cool: 0, st: 'pillar', t: 0, dur: 1, cracks: 0, hp: EC_HP, z: 0, ax: 0, ay: 1, m: null, stun: 0, scr: 0, lockd: false, lure: null, travel: 0, maxT: 0, spd: 0, minD: 99, passed: false };
      idols[k] = th; H.obj({ x: w.x, y: w.y + 0.5, kind: 'calidol', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { idolArt(c, Xs, Ys, T, th); } });
      th.body = H.obj({ x: w.x, y: w.y + 0.5, kind: 'calidolbody', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { if (onFloor(th)) idolFloorArt(c, Xs, Ys, T, th); } }); }
    const all = () => Object.values(idols), awake = () => all().filter(th => th.st === 'hunt' || th.st === 'wind' || th.st === 'charge' || th.st === 'stun'), busy = () => all().some(th => th.st === 'wind' || th.st === 'charge');
    const courtGate = doorway(X, H, tilesOf(M, 'Y'), (c, Xs, Ys, T, D) => { gateArt(c, Xs, Ys, T, D, P, 'slag', C.done ? '' : C.phase === 'wake' || C.phase === 'fight' ? 'SHATTER THE IDOLS' : `DODGE ${EC_NEED} THROWS`, g.t); }, { kind: 'calcourtgate', dur: 1.3, fx: gateFx(X, P, 'slag') });
    const mouth = th => ({ x: th.x, y: th.y - 0.2 });
    /* -- part one: the throws. The idol glows and winds up (its aim line or landing circle shown), then lets fly -- */
    function windUp(id, kind, o) { o = o || {}; const th = idols[id], slow = C.slow; C.slow = false; const w = { th, kind, t: 0, dur: (o.wind || 1.1) + (slow ? 0.6 : 0), speed: (o.speed || 6.5) * (slow ? 0.75 : 1), tx: me.x, ty: me.y, teach: !!o.teach || slow, lob: (o.lob || 1.15) * (slow ? 1.3 : 1) }; C.winds.push(w); C.attacks++;
      if (w.teach) { C.prompt = w.dur + 1.2; C.promptWord = ''; } if (X.sfx.hiss) X.sfx.hiss(w.dur * 0.8, 0.08, 900); return w; }
    function release(w) { const m = mouth(w.th); w.th.flash = 0.4; if (X.sfx.whoosh) X.sfx.whoosh();
      if (w.kind === 'lob') { C.balls.push({ kind: 'lob', x0: m.x, y0: m.y, tx: w.tx, ty: w.ty, x: m.x, y: m.y, z: 2.3, t: 0, dur: w.lob, R: 1.15, res: null, minD: 9 }); return; }
      const dx = w.tx - m.x, dy = w.ty - m.y, d = Math.hypot(dx, dy) || 1, r = w.kind === 'roll' ? 0.55 : 0.36;
      C.balls.push({ kind: w.kind, x: m.x, y: m.y, vx: dx / d * w.speed, vy: dy / d * w.speed, r, z: w.kind === 'roll' ? 0 : 2.3, zs: w.kind === 'roll' ? 0 : 2.3, len: d + 9, went: 0, res: null, minD: 9, spin: 0 }); }
    function counted(b, how) { if (b.res) return; b.res = 'dodge'; if (C.phase !== 'dodge') return; C.count = Math.min(EC_NEED, C.count + 1); C.streak = 0; C.pop = 1; C.popWord = how === 'roll' ? 'DODGE!' : 'CLOSE ONE!';
      chime(X, 523 * Math.pow(2, C.count / EC_NEED), 0.7); X.ring(me.x, me.y, 0.3, 1.5, 0.3, P.FROST_HI, 0.35); X.text(me.x, me.y - 1.6, `${C.popWord} ${C.count}/${EC_NEED}`, '#FFF08C', 18); C.log.push(how);
      if (C.count >= EC_NEED) dodgesDone(); }
    function hitBy(b) { if (b.res) return; if (me.inv > 0 || me.dead) { b.res = 'void'; C.voids++; return; } b.res = 'hit'; const hp = X.ST().hp, d = Math.max(1, Math.min(hp * 0.07, me.hp - 1)); if (me.hp > 1) X.hurtPet(d, null, { court: true }); C.hits++; C.streak++; C.log.push('hit');
      X.text(me.x, me.y - 1.6, 'Hit: that one does not count', P.WARN, 14); if (C.streak >= 2) { C.slow = true; C.streak = 0; X.banner(touchUI ? 'TAP DODGE!' : 'PRESS SHIFT TO DODGE!', 'Roll through a ball as it reaches you, or step aside just before it arrives', P.FROST_HI, 2.4, true); } }
    // the order of throws: two slow teaching throws from the front, a crossfire, a lobbed ball, then a short volley
    function schedule() { const n = C.count;
      // (v389: "the golems should fire much faster": about twice the ball speed and a shorter wind-up than v388 (4.6-6.8 tiles/s,
      //  0.95-1.5 s); the tell stays: the idol raises its arms, the ball gathers, the aim line shows and locks 0.3 s before the throw)
      if (n < 2) { windUp('NE', 'ball', { wind: 1.25, speed: 7.5, teach: true }); C.next = 2.0; }
      else if (n === 2) { windUp('W', 'ball', { wind: 0.85, speed: 10.5 }); X.after(0.35, () => { if (C.phase === 'dodge') windUp('E', 'ball', { wind: 0.85, speed: 10.5 }); }); C.next = 1.6; if (!C.saidX) { C.saidX = true; X.banner('CROSSFIRE', 'Two throwers at once: roll through one, step past the other', P.LAVA_HI, 2.2, true); } }
      else if (n === 3) { windUp('SE', 'ball', { wind: 0.8, speed: 11 }); C.next = 1.3; }
      else if (n === 4) { windUp('NW', 'lob', { wind: 0.95, lob: 0.8 }); C.next = 1.6; if (!C.saidL) { C.saidL = true; X.banner('A LOBBED BALL', 'Leave the landing circle before it comes down', P.LAVA_HI, 2.2, true); } }
      else { ['NE', 'E'].forEach((id, i) => X.after(i * 0.6, () => { if (C.phase === 'dodge') windUp(id, 'ball', { wind: 0.7, speed: 12 }); })); C.next = 2.2; if (!C.saidV) { C.saidV = true; X.banner('THE LAST VOLLEY', 'Two quick throws: keep moving, roll at the last moment', P.LAVA_HI, 2.2, true); } } }
    function dodgeTick(dt) {
      for (const w of C.winds) { w.t += dt; w.th.wind = Math.max(w.th.wind, w.t / w.dur); if (w.t < w.dur - 0.3) { w.tx = me.x; w.ty = me.y; } if (w.t >= w.dur) { w.fired = true; release(w); } } C.winds = C.winds.filter(w => !w.fired);
      for (const b of C.balls) { if (b.res && b.res !== 'dodge' && b.kind !== 'lob' && b.gone) continue;
        if (b.kind === 'lob') { b.t += dt; const u = Math.min(1, b.t / b.dur); b.x = b.x0 + (b.tx - b.x0) * u; b.y = b.y0 + (b.ty - b.y0) * u; b.z = Math.sin(u * Math.PI) * 3.2 + (1 - u) * 2.3;
          const dd = Math.hypot(me.x - b.tx, me.y - b.ty); b.minD = Math.min(b.minD, dd);
          if (u >= 1 && !b.landed) { b.landed = true; b.gone = true; X.boom(b.tx, b.ty, b.R, P.LAVA, P.LAVA_HI, { n: 16, shake: 3 }); if (X.sfx.crash) X.sfx.crash();
            if (dd < b.R + (me.r || 0.3) * 0.5) { if (me.dodge) counted(b, 'roll'); else hitBy(b); } else if (dd < b.R + 2.4) counted(b, 'step'); else { b.res = 'far'; C.far++; X.text(me.x, me.y - 1.4, 'Too far off: let it come close', '#FFD9B0', 13); } }
          continue; }
        b.x += b.vx * dt; b.y += b.vy * dt; b.went += Math.hypot(b.vx, b.vy) * dt; b.spin += dt * 9; if (b.zs) b.z = 0.7 + (b.zs - 0.7) * Math.max(0, 1 - b.went / 2.2);  /* (from the idol's raised fists down to a low, readable arc) */ const dd = Math.hypot(me.x - b.x, me.y - b.y); b.minD = Math.min(b.minD, dd);
        if (!b.res && dd < b.r + (me.r || 0.3) * 0.8) { if (me.dodge) counted(b, 'roll'); else hitBy(b); }
        if (!b.res && b.minD < 1.6 && dd > b.minD + 0.6) counted(b, 'step');   // (it has passed close by: a side-step)
        if (b.went > b.len || !ecIn(b.x, b.y, 4)) { b.gone = true; if (!b.res) { if (b.minD < 1.6) counted(b, 'step'); else { b.res = 'far'; C.far++; X.text(me.x, me.y - 1.4, 'Too far off: let it come close', '#FFD9B0', 13); } } } }
      C.balls = C.balls.filter(b => !b.gone || (b.kind === 'lob' && !b.landed));
      if (C.phase !== 'dodge') return; C.next -= dt; if (C.next <= 0 && !C.winds.length && !C.balls.length) schedule(); }
    /* -- the waking: at six the throwing stops; the idols crack, and the first two leap down onto the court -- */
    function dodgesDone() { C.phase = 'wake'; C.wt = 0; C.winds.length = 0; for (const b of C.balls) X.boom(b.kind === 'lob' ? b.tx : b.x, b.kind === 'lob' ? b.ty : b.y, 0.8, P.LAVA, P.LAVA_HI, { n: 8, shake: 0 }); C.balls.length = 0; C.prompt = 0;
      if (X.sfx.fanfare) X.sfx.fanfare(); X.banner('SIX DODGED!', 'The furnace idols fall silent… then their stone begins to crack', P.FROST_HI, 2.0, true); }
    function chips(x, y, n, z) { if (lowFx()) n = Math.ceil(n / 2); for (let i = 0; i < n; i++) { const a = Math.random() * TAU, sp = 1 + Math.random() * 2.5; C.debris.push({ x, y, z: (z || 1) + Math.random(), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6, vz: 2 + Math.random() * 3, rot: Math.random() * TAU, vr: (Math.random() - 0.5) * 10, s: 0.08 + Math.random() * 0.12, life: 1.0, hot: Math.random() < 0.4 }); } }
    function wakeTick(dt) { const w0 = C.wt; C.wt += dt; const at = s => w0 < s && C.wt >= s;
      if (at(1.0)) { X.banner('THE IDOLS AWAKEN', 'They crack free of their pillars', P.LAVA_HI, 1.15, true, true);   // (short: the leap that follows is behind where it sits) X.shake(lowFx() ? 2 : 7, 0.8); if (X.sfx.crack) X.sfx.crack(); if (X.sfx.crash) X.sfx.crash();
        for (const th of all()) { th.st = 'crack'; th.flash = 0.5; chips(th.x, th.y, 4, 1.5); } }
      if (at(2.25)) wakePair(0);
      if (C.wt >= 3.75) { C.phase = 'fight'; C.atkCd = 0.6; X.banner('LURE THEM INTO EACH OTHER', 'Dodge at the last moment: let them smash into each other!', P.FROST_HI, 3.4, true, true); } }
    function wakePair(i) { C.pair = i; for (const id of EC_PAIRS[i]) { const th = idols[id], dx = ctr.x - th.px, dy = ctr.y - th.py, d = Math.hypot(dx, dy) || 1; th.st = 'leap'; th.t = 0; th.lx = th.px + dx / d * 2.8; th.ly = th.py + dy / d * 2.8; th.x = th.px; th.y = th.py; th.cracks = 0; th.hp = EC_HP; chips(th.x, th.y, 5, 1.2); }
      if (X.sfx.whoosh) X.sfx.whoosh(); if (i === 1) X.banner('TWO MORE WAKE', 'The same trick: stand between them, dodge late', P.LAVA_HI, 2.4, true); if (i === 2) X.banner('THE LAST TWO', 'They charge together: dodge as they come and let them crash', P.LAVA_HI, 2.8, true, true); }
    function newMon(th) { const m = X.spawnMon(MT('runicsentinel'), th.x, th.y, { pack: 990, rift: true, aggro: false }); m.fobj = true; m.forward = 1; m.calIdol = th.id; m.calType = 'furnaceidol'; m.r = 0.85; m.onHit = (mm, dmg) => scratch(th, dmg); th.m = m; return m; }
    // (it lands: a stomp, a shockwave, the pet shoved aside but not hurt; from now on it is a target, a monster the engine
    //  never moves or draws (fobj, its blows forwarded to scratch()))
    function land(th) { th.st = 'hunt'; th.z = 0; th.x = th.lx; th.y = th.ly; th.t = 0; th.stun = 0.5;
      X.boom(th.x, th.y, 1.6, P.ASH, P.LAVA_HI, { n: lowFx() ? 6 : 16, shake: 0 }); X.ring(th.x, th.y, 0.3, 2.6, 0.45, '#E8D0C0', 0.5); X.shake(lowFx() ? 2 : 7, 0.4); if (X.sfx.thud) X.sfx.thud(); if (X.sfx.crash) X.sfx.crash(); chips(th.x, th.y, 6, 0.3);
      const d = Math.hypot(me.x - th.x, me.y - th.y); if (d < 1.8 && d > 0.01) { const q = { x: th.x + (me.x - th.x) / d * 1.9, y: th.y + (me.y - th.y) / d * 1.9 }; if (ecIn(q.x, q.y, -0.6)) { me.x = q.x; me.y = q.y; } }
      newMon(th); }
    // a blow barely scratches the stone, and never cracks it
    function scratch(th, dmg) { if (!onFloor(th) || th.st === 'leap') return; const fl = EC_SCRATCH[Math.min(1, th.cracks)]; th.hp = Math.max(fl, th.hp - 1.5); th.scr = 0.15; C.scratches++;
      if (g.t - (C.scrT || -9) > 2.2) { C.scrT = g.t; X.text(th.x, th.y - 2.7, th.hp <= fl ? 'Not even a dent!' : 'Barely a scratch!', '#E8D6C0', 13); }
      if (C.scratches >= 10 && !C.saidScratch && C.crashes === 0) { C.saidScratch = true; X.banner('STONE SHRUGS OFF BLOWS', 'Lure one\'s charge into another: stand between them and dodge at the last moment', P.FROST_HI, 3, true); } }
    /* -- part two: the charges. One idol at a time winds up (a red-orange lane shown for about a second, aimed at the pet,
       locked 0.35 s before it goes), then charges along it and carries on to the court's edge. An idol lying roughly behind the
       pet pulls the locked aim onto itself (the lure). Dodge as it reaches you and it smashes into the one behind -- */
    function aimAt(th, x, y) { const dx = x - th.x, dy = y - th.y, d = Math.hypot(dx, dy) || 1; th.ax = dx / d; th.ay = dy / d; }
    function rayLen(x, y, dx, dy) { const a = EC_RX - 1.0, b = EC_RY - 1.0, px = (x - ctr.x) / a, py = (y - ctr.y) / b, qx = dx / a, qy = dy / b, A2 = qx * qx + qy * qy, B2 = 2 * (px * qx + py * qy), C2 = px * px + py * py - 1, D2 = B2 * B2 - 4 * A2 * C2; return D2 < 0 ? 0 : Math.max(0, (-B2 + Math.sqrt(D2)) / (2 * A2)); }
    function lockAim(th) { aimAt(th, me.x, me.y); const dp = Math.hypot(me.x - th.x, me.y - th.y); let best = null, ba = 0.42;
      if (!C.noLure) for (const o of awake()) { if (o === th) continue; const dx = o.x - th.x, dy = o.y - th.y, d = Math.hypot(dx, dy); if (d < dp - 0.3) continue; const ang = Math.acos(clamp((dx * th.ax + dy * th.ay) / (d || 1), -1, 1)); if (ang < ba) { ba = ang; best = o; } }
      if (best) aimAt(th, best.x, best.y); th.lure = best ? best.id : null; th.lockd = true; th.travel = 0; th.maxT = rayLen(th.x, th.y, th.ax, th.ay); if (X.sfx.blip) X.sfx.blip(); }
    function startCharge(th, o) { const first = C.charges === 0, slow = first || C.hitRow >= 2; C.charges++; th.st = 'wind'; th.t = -(o.delay || 0); th.dur = slow ? 1.8 : o.together ? 1.35 : 1.1; th.spd = first ? 7 : slow ? 8 : o.together ? 9.5 : 10.5; th.passed = false; th.minD = 99; th.lockd = false; th.lure = null; th.teach = slow; aimAt(th, me.x, me.y);
      if (slow) { C.prompt = th.dur + 1.0; C.promptWord = first ? 'DODGE AT THE LAST MOMENT!' : 'WAIT FOR IT… THEN DODGE!'; C.hitRow = 0; }
      if (first) X.banner('IT WINDS UP A CHARGE', 'Dodge at the last moment: let them smash into each other!', P.LAVA_HI, 2.6, true);
      if (X.sfx.hiss) X.sfx.hiss(th.dur * 0.8, 0.1, 700); }
    function shove(th, dx, dy) { const x = th.x + dx, y = th.y + dy; if (ecIn(x, y, -1.0)) { th.x = x; th.y = y; } }
    function perfect(th) { C.perfects++; C.hitRow = 0; C.pop = 1; C.popWord = 'PERFECT DODGE!'; X.text(me.x, me.y - 1.8, 'PERFECT DODGE!', '#FFF08C', 20); chime(X, 988, 0.6); X.after(0.07, () => chime(X, 1319, 0.45)); X.ring(me.x, me.y, 0.3, 1.8, 0.35, '#FFF08C', 0.5); }
    function hitPet(th) { C.chargeHits++; C.hitRow++; const hp = X.ST().hp, d = Math.max(1, Math.min(hp * EC_CHIP, me.hp - 1)); if (me.hp > 1) X.hurtPet(d, null, { court: true });
      const sd = Math.sign(th.ax * (me.y - th.y) - th.ay * (me.x - th.x)) || 1, q = { x: me.x - th.ay * sd * 1.3, y: me.y + th.ax * sd * 1.3 }; if (ecIn(q.x, q.y, -0.6)) { me.x = q.x; me.y = q.y; } me.inv = Math.max(me.inv || 0, 0.8);
      X.text(me.x, me.y - 1.6, 'Hit! Dodge just as it reaches you', P.WARN, 14); }
    function crash(A, B) { C.crashes++; const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1;
      for (const th of [A, B]) { th.cracks++; th.hp = th.cracks >= 2 ? 0 : Math.min(th.hp, 50); th.st = 'stun'; th.stun = 1.7; th.t = 0; th.flash = 0.5; th.lockd = false; }
      shove(B, dx / d * 1.1, dy / d * 1.1); shove(A, -dx / d * 0.5, -dy / d * 0.5);
      X.text(mx, my - 2.5, 'CRASH!', '#FFB070', 26); C.pop = 1; C.popWord = 'CRASH!';
      X.boom(mx, my - 0.6, 1.6, P.LAVA, '#FFE9B0', { n: lowFx() ? 8 : 22, shake: 0 }); X.ring(mx, my, 0.3, 3.2, 0.5, '#FFE0C0', 0.65); chips(mx, my, 10, 1.2);
      X.shake(lowFx() ? 3 : 10, 0.5); if (!lowFx()) X.flash(0.14, '#FFE0C0'); if (X.sfx.crash) X.sfx.crash(); if (X.sfx.thud) X.sfx.thud();
      C.atkCd = 1.6; for (const th of [A, B]) if (th.cracks >= 2) X.after(0.4, () => shatter(th)); }
    function shatter(th) { if (th.st === 'dead') return; th.st = 'dead'; C.shattered++; if (th.m && !th.m.dead) X.killMon(th.m, false); th.m = null;
      // (THE SEAM: the shared destruction effect (BREAK_FX, 20b2) where the build has it, the idol's own picture cut into its
      //  pieces; else this file's own burst, CAL_STAGES.shatterFx)
      let shared = false; try { if (typeof BREAK_FX !== 'undefined' && BREAK_FX && typeof BREAK_FX.burst === 'function') { shared = !!BREAK_FX.burst(X, th.x, th.y + 0.5, { kind: 'furnaceidol', mat: 'basalt', hot: '#FF6A1F', size: 2.8, w: 2.4, h: 3.4, key: 'calidol', paint(c, Pp) { const G = idolGeom(0, 0, Pp, th, 0); bodyArt(c, G, Pp, th); crackArt(c, G, Pp, 1); } }); } } catch (e) { shared = false; }
      if (!shared) CAL_STAGES.shatterFx(X, { x: th.x, y: th.y, h: 2.2, r: 1, col: P.LAVA, hot: '#FFE9B0', kind: 'idol', debris: C.debris }); else chips(th.x, th.y, 6, 1.2);
      X.text(th.x, th.y - 2.8, 'SHATTERED!', '#FFF08C', 22);
      if (C.shattered >= 6) { X.after(1.0, courtDone); return; }
      if (C.pair < 2 && EC_PAIRS[C.pair].every(id => idols[id].st === 'dead')) C.joinT = 2.0; }
    function courtDone() { if (C.done) return; C.done = true; C.phase = 'done'; C.doneT = 0; C.prompt = 0;
      X.banner('THE EMBER COURT FALLS', 'Six idols shattered: the gate to the overlook opens', P.FROST_HI, 3.4, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); FROST_CHIME(X);
      const hp = X.ST().hp; if (!me.dead && me.hp < hp) { X.heal(hp * 0.3, true); X.text(me.x, me.y - 1.6, 'A breath of cool air', P.FROST_HI, 14); X.ring(me.x, me.y, 0.2, 1.2, 0.35, P.FROST, 0.3); }
      X.after(0.8, () => { courtGate.open1(); self.done = true; H.setExit(E.x, E.y, 'To Ifrit\'s Throne'); }); }
    function fightTick(dt) {
      if (C.joinT > 0) { C.joinT -= dt; if (C.joinT <= 0 && C.pair < 2) wakePair(C.pair + 1); }
      for (const th of all()) { th.scr = Math.max(0, th.scr - dt);
        if (th.st === 'leap') { th.t += dt; const u = Math.min(1, th.t / 0.8), e = u * (2 - u); th.x = th.px + (th.lx - th.px) * e; th.y = th.py + (th.ly - th.py) * e; th.z = Math.sin(u * Math.PI) * 2.4 + (1 - u) * 0.95; if (u >= 1) land(th); continue; }
        if (th.stun > 0) { th.stun -= dt; if (th.stun <= 0 && th.st === 'stun') th.st = 'hunt'; }
        if (th.st === 'hunt' && th.stun <= 0 && !busy()) { const dx = me.x - th.x, dy = me.y - th.y, d = Math.hypot(dx, dy) || 1, want = 4.0; if (Math.abs(d - want) > 0.4) { const v = (d > want ? 1.1 : -0.7) * dt, nx = th.x + dx / d * v, ny = th.y + dy / d * v; if (ecIn(nx, ny, -1.0)) { th.x = nx; th.y = ny; } } }
        else if (th.st === 'wind') { th.t += dt; if (th.t >= 0) { if (!th.lockd) { aimAt(th, me.x, me.y); if (th.t >= th.dur - 0.35) lockAim(th); } th.wind = clamp(th.t / th.dur, 0, 1); if (th.t >= th.dur) { th.st = 'charge'; th.t = 0; th.wind = 0; if (X.sfx.whoosh) X.sfx.whoosh(); } } }
        else if (th.st === 'charge') chargeTick(th, dt); }
      const A = awake();
      // (they keep apart while walking: only a charge cracks them)
      for (let i = 0; i < A.length; i++) for (let j = i + 1; j < A.length; j++) { const a = A[i], b = A[j]; if (a.st === 'charge' || b.st === 'charge' || a.st === 'wind' || b.st === 'wind') continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01; if (d < 2.2) { const p = (2.2 - d) * 0.5 * Math.min(1, dt * 6); a.x -= dx / d * p; a.y -= dy / d * p; b.x += dx / d * p; b.y += dy / d * p; } }
      // the next charge: one at a time with a breath between (the last pair together)
      if (C.phase === 'fight' && !busy() && C.joinT <= 0 && A.length) { C.atkCd -= dt; if (C.atkCd <= 0) { const ready = A.filter(th => th.st === 'hunt' && th.stun <= 0);
          if (C.pair === 2 && A.length === 2) { if (ready.length === 2) { ready.forEach((th, i) => startCharge(th, { together: true, delay: i * 0.15 })); C.atkCd = 1.2; } }
          else if (ready.length) { const pick = ready[C.turn++ % ready.length]; startCharge(pick, {}); C.atkCd = 1.2; } } } }
    function chargeTick(th, dt) { const st = th.spd * dt; th.x += th.ax * st; th.y += th.ay * st; th.travel += st;
      if (!lowFx() && Math.random() < dt * 24) X.part({ kind: 'smoke', x: th.x - th.ax * 0.6, y: th.y + 0.3, vx: -th.ax, vy: -0.4, life: 0.6, max: 0.6, size: 0.45, color: '#5A4E48' });
      const dx = me.x - th.x, dy = me.y - th.y, d = Math.hypot(dx, dy); th.minD = Math.min(th.minD, d);
      if (!th.passed && d < 1.05 && !me.dead) { th.passed = true; if (me.dodge) perfect(th); else if (!(me.inv > 0)) hitPet(th); }
      if (!th.passed && dx * th.ax + dy * th.ay < -0.6) { th.passed = true; if (th.minD < 2.0) { C.closes++; X.text(me.x, me.y - 1.6, 'CLOSE ONE!', '#FFE9B0', 15); } }
      for (const o of awake()) { if (o === th) continue; if (Math.hypot(o.x - th.x, o.y - th.y) < 1.55) { crash(th, o); return; } }
      if (th.travel >= th.maxT) { th.st = 'stun'; th.stun = 0.9; th.t = 0; X.boom(th.x + th.ax * 0.6, th.y + th.ay * 0.6, 0.9, P.ASH, P.ASH, { n: 8, shake: 2 }); if (X.sfx.thud) X.sfx.thud(); } }
    function courtTick(dt) { for (const th of all()) { th.flash = Math.max(0, th.flash - dt); if (C.phase === 'dodge' || C.phase === 'idle') th.wind = 0; if (th.cool > 0) th.cool = Math.min(1, th.cool + dt / 2); }
      C.pop = Math.max(0, C.pop - dt * 1.5); C.prompt = Math.max(0, C.prompt - dt);
      for (const q of C.debris) { q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vz -= 16 * dt; q.z += q.vz * dt; q.rot += q.vr * dt; if (q.z < 0) { q.z = 0; q.vz *= -0.3; q.vx *= 0.5; q.vy *= 0.5; q.vr *= 0.5; } } if (C.debris.length) C.debris = C.debris.filter(q => q.life > 0);
      if (!C.on) { if (brood.done && ecIn(me.x, me.y, -0.5)) { C.on = true; C.phase = 'dodge'; C.t = 0; X.banner('THE EMBER COURT', `Furnace idols ring the court. DODGE ${EC_NEED} of their throws: roll through them (${touchUI ? 'the DODGE button' : 'Shift'}) or step aside just in time. A hit only stings, and never counts`, P.FROST_HI, 4.2, true, true); FROST_CHIME(X); } return; }
      if (C.done) { C.doneT += dt; return; } C.t += dt;
      if (C.phase === 'dodge' || C.balls.length) dodgeTick(dt);
      if (C.phase === 'wake') wakeTick(dt);
      if (C.phase === 'wake' || C.phase === 'fight') fightTick(dt);
      // (the idols' targets follow their bodies; one lost to some odd blow is quietly made again)
      for (const th of all()) { if (onFloor(th) && th.st !== 'leap') { if (!th.m || th.m.dead) newMon(th); th.m.x = th.x; th.m.y = th.y; th.m.vx = th.m.vy = 0; } th.body.x = th.x; th.body.y = th.y + 0.5; } }
    /* a furnace idol: a squat basalt idol on a hexagonal pillar in the lava. Its chest is an arched furnace mouth behind an iron
       grille; rune cuts and cracks score its plates. Winding up a throw, its arms rise overhead and a molten ball gathers between
       its fists; on the throw it rocks back, arms flung forward. Awake, it cracks free and walks the court; winding a charge it
       lifts its arms and its furnace roars; charging it leans in; a crash leaves bright fissures; two shatter it. (Its light,
       shimmer and steam are added in one GPU pass for all six: courtOver) */
    function idolPose(th) { if (C.phase === 'dodge' || C.phase === 'idle') { const k = th.wind, rec = th.flash / 0.4; return { k, rec, lift: Math.max(k, rec * 0.6), dark: th.cool > 0 ? th.cool : 0, hot: Math.max(k, rec) }; }
      const k = th.st === 'wind' ? th.wind : 0, rec = th.st === 'charge' ? 0.8 : clamp(th.flash / 0.5, 0, 1), lift = th.st === 'crack' ? 0.12 + 0.08 * Math.sin(g.t * 11 + th.px) : th.st === 'stun' ? 0 : th.st === 'leap' ? 0.7 : Math.max(k, rec * 0.6);
      const hot = th.st === 'charge' ? 1 : th.st === 'wind' ? 0.3 + 0.7 * k : th.st === 'stun' ? 0.12 : th.st === 'crack' ? 0.45 + 0.3 * Math.sin(g.t * 7 + th.py) : 0.35; return { k: th.st === 'wind' ? k : 0, rec, lift, dark: 0, hot }; }
    function idolGeom(Xs, Ys, T, th, lift) { const s = T * 1.45, ps = idolPose(th), base = Ys - (lift == null ? T * 0.95 : lift), back = Math.min(1, ps.rec) * T * 0.18; return { s, ps, base, cx: Xs, cy: base - back, mouth: [Xs, base - back - s * 0.78], ball: [Xs, base - back - s * (1.95 + 0.25 * ps.k)] }; }
    const geomOf = (th, T) => idolGeom(X.sx(th.x), X.sy(th.y + 0.5), T, th, onFloor(th) ? th.z * T : T * 0.95);
    function pillarArt(c, Xs, Ys, T, th, broken) { const lw = lwOf(T), pr = T * 0.72, pry = pr * 0.42, ptop = Ys - T * (broken ? 0.55 : 0.95), hexP = (a, y) => [Xs + Math.cos(a) * pr, y + Math.sin(a) * pry];
      c.fillStyle = 'rgba(0,0,0,.45)'; ell(c, Xs, Ys + T * 0.05, T * 0.85, T * 0.28); c.fill();
      for (const [i, j, col] of [[3, 4, '#5A5153'], [4, 5, '#3B3335'], [5, 0, '#221C1E']]) { const a0 = Math.PI + (i - 3) * Math.PI / 3, a1 = Math.PI + (j - 3) * Math.PI / 3, A = hexP(a0, ptop), B = hexP(a1, ptop); poly(c, [A, B, [B[0], Ys], [A[0], Ys]]); c.closePath(); const gg = c.createLinearGradient(0, ptop, 0, Ys); gg.addColorStop(0, col); gg.addColorStop(1, '#120C0C'); c.fillStyle = gg; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw * 0.8; c.stroke(); }
      c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = Math.max(1, lw * 0.6); for (const u of [0.35, 0.7]) { const yy = ptop + (Ys - ptop) * u; c.beginPath(); c.moveTo(Xs - pr, yy); c.lineTo(Xs + pr, yy + T * 0.04); c.stroke(); }
      const lg = c.createLinearGradient(0, Ys - T * 0.35, 0, Ys); lg.addColorStop(0, 'rgba(255,90,26,0)'); lg.addColorStop(1, rgba(P.LAVA, 0.55)); c.fillStyle = lg; c.fillRect(Xs - pr, Ys - T * 0.35, pr * 2, T * 0.35);
      if (broken) { // the stump it tore itself from: a jagged top, still hot in its cracks
        poly(c, [[Xs - pr, ptop], [Xs - pr * 0.6, ptop - T * 0.22], [Xs - pr * 0.2, ptop - T * 0.05], [Xs + pr * 0.15, ptop - T * 0.28], [Xs + pr * 0.55, ptop - T * 0.08], [Xs + pr, ptop], [Xs + pr * 0.5, ptop + pry * 0.6], [Xs - pr * 0.5, ptop + pry * 0.6]]); c.closePath(); c.fillStyle = '#2A2224'; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw * 0.8; c.stroke();
        c.strokeStyle = rgba(P.LAVA, 0.7); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(Xs - pr * 0.4, ptop + pry * 0.2); c.lineTo(Xs, ptop - T * 0.02); c.lineTo(Xs + pr * 0.3, ptop + pry * 0.3); c.stroke(); } }
    function idolArt(c, Xs, Ys, T, th) { const off = onFloor(th) || th.st === 'dead'; c.save(); pillarArt(c, Xs, Ys, T, th, off); c.restore(); if (off) return;
      const G = idolGeom(Xs + (th.st === 'crack' ? Math.sin(g.t * 47 + th.px) * T * 0.03 : 0), Ys, T, th, T * 0.95); bodyArt(c, G, T, th); if (th.st === 'crack') crackArt(c, G, T, 0.5 + 0.5 * Math.sin(g.t * 6 + th.py)); }
    function idolFloorArt(c, Xs, Ys, T, th) { const G = idolGeom(Xs, Ys, T, th, th.z * T), lw = lwOf(T), t = g.t;
      c.save(); c.fillStyle = 'rgba(0,0,0,.42)'; ell(c, Xs, Ys, T * (0.9 - Math.min(0.4, th.z * 0.15)), T * 0.3); c.fill(); c.restore();
      c.save(); if (th.st === 'charge') { c.translate(Xs, Ys); c.rotate(clamp(th.ax, -1, 1) * 0.22); c.translate(-Xs, -Ys); }
      bodyArt(c, G, T, th); if (th.cracks > 0) crackArt(c, G, T, 1); c.restore();
      if (th.scr > 0) glow(c, G.cx, G.cy - G.s * 0.7, T * 1.1, '#FFFFFF', th.scr * 2);
      if (th.st === 'stun') for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.09; c.fillStyle = '#FFE9B0'; c.beginPath(); c.arc(G.cx + Math.cos(a) * G.s * 0.45, G.cy - G.s * 1.75 + Math.sin(a) * G.s * 0.12, Math.max(2, T * 0.07), 0, TAU); c.fill(); }
      // its stone's integrity (a blow only scratches it) and its two crack pips
      if (th.st !== 'leap') { const bw = T * 1.2, by = G.cy - G.s * 2.05, bx = Xs - bw / 2; c.save(); c.fillStyle = 'rgba(10,6,8,.75)'; c.fillRect(bx - 2, by - 2, bw + 4, 8); c.fillStyle = th.cracks ? '#FF8A3A' : '#D8C8B8'; c.fillRect(bx, by, bw * th.hp / EC_HP, 4);
        for (let i = 0; i < 2; i++) { const px = Xs + (i - 0.5) * T * 0.42, py = by - T * 0.24; c.beginPath(); c.moveTo(px, py - T * 0.11); c.lineTo(px + T * 0.09, py); c.lineTo(px, py + T * 0.11); c.lineTo(px - T * 0.09, py); c.closePath(); c.fillStyle = i < th.cracks ? '#FFB070' : 'rgba(255,255,255,.2)'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.7)'; c.lineWidth = 1.2; c.stroke(); } c.restore(); } }
    // the fissures a crash leaves: wide, bright, smoking
    function crackArt(c, G, T, k) { const { s, cx, cy } = G; c.save(); c.lineCap = 'round'; c.lineJoin = 'round'; const path = () => { c.beginPath(); c.moveTo(cx - s * 0.55, cy - s * 1.25); c.lineTo(cx - s * 0.2, cy - s * 0.9); c.lineTo(cx - s * 0.32, cy - s * 0.55); c.lineTo(cx + s * 0.05, cy - s * 0.3); c.lineTo(cx - s * 0.1, cy - s * 0.02); c.moveTo(cx + s * 0.62, cy - s * 1.0); c.lineTo(cx + s * 0.3, cy - s * 0.8); c.lineTo(cx + s * 0.42, cy - s * 0.5); };
      path(); c.strokeStyle = '#1A0E0C'; c.lineWidth = Math.max(2.5, s * 0.09); c.stroke(); path(); c.strokeStyle = rgba(P.LAVA_HI, 0.55 + 0.4 * k); c.lineWidth = Math.max(1.2, s * 0.04); c.stroke(); c.restore(); }
    function bodyArt(c, G, T, th) { const lw = lwOf(T), t = g.t, { s, ps, cx, cy } = G, { k, rec, lift, dark } = ps, hot = C.done ? 0 : ps.hot, ph = th.id.charCodeAt(0) * 0.37 + th.id.length;
      c.save();
      // the arms: shoulder to fist, hanging at rest, raised overhead in the wind-up, flung forward in the recoil
      const arm = sd => { const sh = [cx + sd * s * 0.5, cy - s * 1.15], up = lift, fwd = Math.min(1, rec) * 0.6, el = [sh[0] + sd * s * (0.42 - 0.12 * up), sh[1] + s * (0.42 - 0.95 * up) - fwd * s * 0.2], fi = [sh[0] + sd * s * (0.34 - 0.36 * up), sh[1] + s * (0.85 - 1.85 * up) + fwd * s * 0.35];
        c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = P.INK; c.lineWidth = s * 0.34 + lw * 2; c.beginPath(); c.moveTo(sh[0], sh[1]); c.lineTo(el[0], el[1]); c.lineTo(fi[0], fi[1]); c.stroke(); c.strokeStyle = sd < 0 ? '#4A4044' : '#2E2629'; c.lineWidth = s * 0.34; c.stroke();
        c.strokeStyle = 'rgba(255,255,255,.08)'; c.lineWidth = s * 0.1; c.beginPath(); c.moveTo(sh[0] - s * 0.05, sh[1] - s * 0.05); c.lineTo(el[0] - s * 0.05, el[1] - s * 0.05); c.stroke();
        poly(c, [[fi[0] - s * 0.2, fi[1] - s * 0.16], [fi[0] + s * 0.2, fi[1] - s * 0.18], [fi[0] + s * 0.22, fi[1] + s * 0.14], [fi[0] - s * 0.18, fi[1] + s * 0.18]]); c.closePath(); c.fillStyle = '#3A3034'; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
        if (hot > 0.2) { c.strokeStyle = rgba(P.LAVA_HI, 0.7 * hot); c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(fi[0] - s * 0.1, fi[1]); c.lineTo(fi[0] + s * 0.1, fi[1] - s * 0.04); c.stroke(); } };
      arm(-1);
      // the body: broad faceted basalt plates, lit on the left, a shadow to the right
      const tor = [[cx - s * 0.62, cy], [cx - s * 0.7, cy - s * 0.95], [cx - s * 0.5, cy - s * 1.32], [cx + s * 0.5, cy - s * 1.32], [cx + s * 0.7, cy - s * 0.95], [cx + s * 0.62, cy]];
      poly(c, tor); c.closePath(); const bg = c.createLinearGradient(cx - s * 0.7, 0, cx + s * 0.7, 0); bg.addColorStop(0, dark ? '#4A4246' : '#5E5256'); bg.addColorStop(0.45, dark ? '#302A2C' : '#3A3034'); bg.addColorStop(1, '#171214'); c.fillStyle = bg; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = Math.max(1, lw * 0.7); c.beginPath(); c.moveTo(cx - s * 0.66, cy - s * 0.5); c.lineTo(cx - s * 0.36, cy - s * 0.46); c.moveTo(cx + s * 0.36, cy - s * 0.48); c.lineTo(cx + s * 0.66, cy - s * 0.52); c.moveTo(cx - s * 0.5, cy - s * 1.32); c.lineTo(cx - s * 0.4, cy - s * 1.1); c.lineTo(cx + s * 0.42, cy - s * 1.1); c.lineTo(cx + s * 0.5, cy - s * 1.32); c.stroke();
      // the rune cuts on its shoulders and belly: they smoulder with the furnace (cold once it is dark)
      const runeCol = dark ? rgba('#8FB8D8', 0.35) : rgba(P.RUNE, 0.35 + 0.55 * hot + 0.1 * Math.sin(t * 2 + ph)); const CA = CALR();
      [[-0.45, -1.2, 0], [0.45, -1.2, 3], [-0.42, -0.25, 5], [0.42, -0.25, 6]].forEach(([u, v, i]) => { if (CA && typeof CA.rune === 'function') CA.rune(c, cx + u * s, cy + v * s, s * 0.16, i, runeCol, Math.max(1, lw * 0.6)); else { c.strokeStyle = runeCol; c.lineWidth = Math.max(1, lw * 0.6); c.beginPath(); c.moveTo(cx + u * s - s * 0.07, cy + v * s - s * 0.07); c.lineTo(cx + u * s + s * 0.06, cy + v * s); c.lineTo(cx + u * s - s * 0.05, cy + v * s + s * 0.08); c.stroke(); } });
      // hairline cracks across the plates: heat while it burns; wide and dark once it has gone out
      c.strokeStyle = dark ? 'rgba(10,6,8,.85)' : rgba(P.LAVA, 0.25 + 0.5 * hot); c.lineWidth = Math.max(1, lw * (dark ? 1 : 0.5) * (1 + dark)); c.beginPath(); c.moveTo(cx - s * 0.2, cy - s * 1.3); c.lineTo(cx - s * 0.28, cy - s * 1.12); c.lineTo(cx - s * 0.18, cy - s * 1.02); c.moveTo(cx + s * 0.6, cy - s * 0.8); c.lineTo(cx + s * 0.44, cy - s * 0.66); c.lineTo(cx + s * 0.5, cy - s * 0.42); c.stroke();
      // the furnace mouth: an arch in the chest, an iron grille, the fire behind it (white-hot at the throw or the charge)
      const [mx, my] = G.mouth, mw = s * 0.34, mh = s * 0.42; c.beginPath(); c.moveTo(mx - mw, my + mh * 0.6); c.lineTo(mx - mw, my - mh * 0.15); c.quadraticCurveTo(mx - mw, my - mh, mx, my - mh); c.quadraticCurveTo(mx + mw, my - mh, mx + mw, my - mh * 0.15); c.lineTo(mx + mw, my + mh * 0.6); c.closePath();
      const mg = c.createRadialGradient(mx, my + mh * 0.2, mw * 0.1, mx, my, mh * 1.1); if (dark) { mg.addColorStop(0, '#2A2226'); mg.addColorStop(1, '#0E0A0C'); } else { mg.addColorStop(0, hot > 0.6 ? '#FFFFFF' : '#FFF2C0'); mg.addColorStop(0.35 - 0.15 * Math.min(1, hot), P.LAVA_HI); mg.addColorStop(0.8, P.LAVA); mg.addColorStop(1, P.LAVA_D); } c.fillStyle = mg; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw * 1.2; c.stroke();
      if (!dark) { c.save(); c.clip(); for (let i = 0; i < 3; i++) { const fx = mx + (i - 1) * mw * 0.55, fh = mh * (0.5 + 0.35 * hot + 0.15 * Math.sin(t * 9 + i * 2 + ph)); c.fillStyle = rgba('#FFE9B0', 0.55 + 0.4 * Math.min(1, hot)); c.beginPath(); c.moveTo(fx - mw * 0.22, my + mh * 0.6); c.quadraticCurveTo(fx - mw * 0.1, my + mh * 0.6 - fh * 0.6, fx, my + mh * 0.6 - fh); c.quadraticCurveTo(fx + mw * 0.12, my + mh * 0.6 - fh * 0.6, fx + mw * 0.22, my + mh * 0.6); c.fill(); } c.restore(); }
      c.strokeStyle = '#1A1214'; c.lineWidth = Math.max(1.5, s * 0.06); for (const u of [-0.5, 0, 0.5]) { c.beginPath(); c.moveTo(mx + u * mw, my - mh * 0.85 * (1 - Math.abs(u) * 0.3)); c.lineTo(mx + u * mw, my + mh * 0.6); c.stroke(); } c.beginPath(); c.moveTo(mx - mw, my + mh * 0.1); c.lineTo(mx + mw, my + mh * 0.1); c.stroke();
      // the head: a low heavy brow sunk between the shoulders, two ember slits (cold once it has gone out)
      const hy = cy - s * 1.32; poly(c, [[cx - s * 0.3, hy + s * 0.08], [cx - s * 0.26, hy - s * 0.3], [cx + s * 0.26, hy - s * 0.3], [cx + s * 0.3, hy + s * 0.08]]); c.closePath(); c.fillStyle = '#2E2629'; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.1)'; c.fillRect(cx - s * 0.26, hy - s * 0.3, s * 0.52, s * 0.06);
      c.fillStyle = dark ? '#3A3034' : rgba(hot > 0.3 ? '#FFF2C0' : P.LAVA_HI, 0.75 + 0.25 * Math.min(1, hot)); c.fillRect(cx - s * 0.2, hy - s * 0.16, s * 0.13, s * 0.05); c.fillRect(cx + s * 0.07, hy - s * 0.16, s * 0.13, s * 0.05);
      arm(1);
      // the molten ball it gathers between its raised fists (the throws only)
      if (k > 0.15 && !C.done && (C.phase === 'dodge' || C.phase === 'idle')) { const [bx, by] = G.ball, br = s * (0.08 + 0.2 * k); const bgr = c.createRadialGradient(bx - br * 0.3, by - br * 0.3, br * 0.1, bx, by, br); bgr.addColorStop(0, '#FFF6D0'); bgr.addColorStop(0.5, P.LAVA_HI); bgr.addColorStop(1, P.LAVA); c.fillStyle = bgr; c.beginPath(); c.arc(bx, by, br, 0, TAU); c.fill(); c.strokeStyle = '#3A1408'; c.lineWidth = 1.2; c.stroke(); }
      c.restore();
      if (!fgx()) { if (!dark) { glow(c, mx, my, T * (0.9 + 1.2 * Math.min(1, hot)), P.LAVA, 0.25 + 0.6 * Math.min(1, hot)); if (k > 0.15 && C.phase === 'dodge') glow(c, G.ball[0], G.ball[1], T * (0.5 + 0.8 * k), P.LAVA_HI, 0.5 * k); }
        else if (!lowFx()) for (let i = 0; i < 2; i++) { const u = ((t * 0.35 + i * 0.5 + ph) % 1); glow(c, mx + Math.sin(t + i * 3) * T * 0.2, my - s * 0.8 - u * T * 1.6, T * (0.35 + u * 0.5), '#E8E0DC', 0.35 * (1 - u)); } } }
    /* the idols' light in one GPU pass: the furnace glow, the gathering ball's fire, heat shimmer in the wind-up, steam when dark */
    function idolsGpu(Q, T) { const t = g.t; for (const th of all()) { if (th.st === 'dead') continue; const G = geomOf(th, T), { k, rec, dark } = G.ps, hot = C.done ? 0 : Math.min(1, G.ps.hot), [mx, my] = G.mouth; if (my < -T * 4 || my > X.H() + T * 4) continue;
        if (!dark) { Q.glow(mx, my, T * (1.0 + 1.3 * hot), P.LAVA, 0.35 + 0.55 * hot); Q.fire(mx, my + T * 0.05, T * (0.28 + 0.25 * hot), 0.7 + 0.4 * hot, 0.55 + 0.4 * hot, th.px); if (k > 0.15 && C.phase === 'dodge') { Q.fire(G.ball[0], G.ball[1], T * (0.2 + 0.45 * k), 1.0, 0.9, th.py); Q.glow(G.ball[0], G.ball[1], T * (0.6 + k), P.LAVA_HI, 0.5 * k); }
          if (k > 0.3 && !lowFx()) Q.shimmer(mx, my - T * 1.4, T * (0.9 + 0.6 * k), 0.35 * k, 1.2); if (rec > 0.05 && th.st !== 'charge') Q.glow(mx, my - T * 0.4, T * 2.2 * Math.min(1, rec), '#FFE9B0', 0.5 * Math.min(1, rec));
          if (th.cracks > 0 && !lowFx()) Q.smoke(mx, my - T * 1.2, T * 0.6, 0.3, th.px, '#8A7E78', 0.3); }
        else if (!lowFx()) for (let i = 0; i < 3; i++) { const u = ((t * 0.3 + i / 3 + th.px * 0.1) % 1); Q.smoke(mx + Math.sin(t * 0.8 + i * 2) * T * 0.25, my - T * 0.9 - u * T * 1.8, T * (0.35 + u * 0.55), 0.45 * (1 - u) * (0.6 + 0.4 * dark), th.px + i, '#BDB4AE', 0.3); } } }
    // the camera: close on the approach; out over the whole court for the throws; for the waking, wider still, on all six; in the fight a
    // middle zoom that follows the pet with a light pull to the court's centre (the charge lanes stay readable), a little wider
    // for the last pair; close again once the court has fallen
    const rig = camRig();
    const camWant = () => { if (!C.on || (C.done && C.doneT > 1.4)) return null; if (C.phase === 'dodge') return { zoom: 0.46, x: ctr.x, y: ctr.y, k: 0.6 }; if (C.phase === 'wake') return { zoom: 0.4, x: ctr.x, y: ctr.y - 0.5, k: 1 }; return { zoom: C.pair >= 2 ? 0.58 : 0.64, x: ctr.x, y: ctr.y, k: 0.3 }; };
    // (where to stand: between the two awake idols, on the line from one to the other, until the first crash has shown it)
    const lureSpot = () => { const A = awake(); if (A.length !== 2 || C.crashes > 0 || C.phase !== 'fight') return null; return { x: (A[0].x + A[1].x) / 2, y: (A[0].y + A[1].y) / 2 }; };
    X.after(1.0, () => { S.intro = false; X.banner('THE HEARTWARD DESCENT', 'Down the cathedral of the volcano\'s heart: three causeways, three ledges of brood, then the throne', P.LAVA_HI, 3.2, true, true); });
    // the falls of lava down the cathedral: from under each ledge into the drop
    const FALLS = [[9.5, 87.5, 97.5], [22.5, 87.5, 97.5], [8.5, 67.5, 76.5], [23.5, 67.5, 76.5], [9.5, 47.5, 56.5], [22.5, 47.5, 56.5]];
    return { S, vents, traps, gates, brood, rooms, shrine, fall, ledgeOf, court: C, idols, courtGate, ecIn, schedule, wakePair, startCharge, crash, shatter, scratch, awake, lureSpot, rig, camWant, EC_PAIRS,
      cam: rig.cam,
      update(dt) { rig.tick(dt, camWant()); shrine.tick(dt); traps.tick(dt); for (const q of gates) if (q) q.tick(dt); S.breath += dt; const L = ledgeOf(me.y); if (L >= 0 && (L !== S.ledge || !S.ledgeSet)) { S.ledge = L; S.ledgeSet = true; const C = CALR(), b = backOf(L); if (C && typeof C.setLedge === 'function') C.setLedge(X, b.x, b.y); }
        for (const v of vents) ventTick(v, dt);
        if (S.intro) return;
        // the safe demonstration: the first vent shows itself once, before anything else, while you are still on the ledge
        if (S.demo === 0 && (me.y < 100.5 || g.t > 4.5)) { S.demo = 1; const v = vents[0]; v.demo = true; v.t = 0; X.text(v.x, v.y - 1.6, 'Watch the vent…', P.LAVA_HI, 15); }
        brood.tick(dt); courtGate.tick(dt); courtTick(dt); },
      goal() { if (self.done) return me.y < 15.5 ? 'To Ifrit\'s throne · rest at the shrine first' : 'Up to the overlook'; if (S.intro) return 'The Heartward Descent';
        if (S.demo < 2) return 'Watch the vent: it glows and hisses, then erupts';
        if (brood.done) { if (!C.on) return 'Up to the Ember Court'; if (C.phase === 'dodge') return `Dodged ${C.count}/${EC_NEED} · roll through the throws (${touchUI ? 'DODGE' : 'Shift'}) or step aside close`; if (C.phase === 'wake') return 'The idols awaken!'; return `Lure their charges into each other, dodge late · ${C.shattered}/6 shattered`; }
        if (S.ledge === 0 || brood.wave < 0) return `Cross the causeway: pass each vent while it is dark · ${brood.left()} of the brood left`; return brood.goal(); },
      hint() { if (self.done || S.intro) return null; if (brood.done) { if (!C.on) return { x: ctr.x, y: ctr.y + 3, h: 1.2, label: 'THE EMBER COURT' }; const q = lureSpot(); return q && Math.hypot(me.x - q.x, me.y - q.y) > 1.6 ? { x: q.x, y: q.y, h: 0.4, label: 'STAND BETWEEN THEM' } : null; } return brood.hint(); },
      drawGround(c) { const T = X.Tz(), t = g.t, Wd = X.W(), Hh = X.H();
        throneArt(c, T, t);
        for (const [x, y0, y1] of FALLS) lavafall(c, x, y0, y1, T, t);
        // the causeways' edges: cracked obsidian lips over the drop
        for (const [y0, y1] of DE_LANES) { const x0 = X.sx(14), x1 = X.sx(19), Y0 = X.sy(y0 + 1), Y1 = X.sy(y1 + 2); if (Y1 < 0 || Y0 > Hh) continue; c.save(); c.fillStyle = 'rgba(10,6,8,.55)'; c.fillRect(x0 - T * 0.25, Y0, T * 0.25, Y1 - Y0); c.fillRect(x1, Y0, T * 0.25, Y1 - Y0); c.strokeStyle = rgba(P.LAVA, 0.45); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 - T * 0.25, Y0); c.lineTo(x0 - T * 0.25, Y1); c.moveTo(x1 + T * 0.25, Y0); c.lineTo(x1 + T * 0.25, Y1); c.stroke(); c.restore(); }
        for (const v of vents) ventArt(c, v, T, t);
        courtGround(c, T, t);
        gpu(c, Q => { for (const v of vents) { const Xs = X.sx(v.x), Ys = X.sy(v.y); if (Ys < -T * 6 || Ys > Hh + T * 2) continue; if (v.ph === 'warn') Q.ground(Xs, Ys, T * DE_VENT_R * (0.6 + 0.5 * v.k), 0.5 + 0.5 * v.k, 0.5 + 0.5 * v.k, v.i * 1.7, 0.55, 1); } }); },
      drawOver(c) { const T = X.Tz(), t = g.t, Hh = X.H();
        // the eruptions: columns of fire (GPU tongues and fire balls where it can; a 2D column otherwise), drawn over everything
        const er = vents.filter(v => v.ph === 'erupt'); const used = er.length && gpu(c, Q => { for (const v of er) { const Xs = X.sx(v.x), Ys = X.sy(v.y), u = v.k, hgt = T * (2.4 + 2.6 * Math.sin(Math.min(1, u * 1.6) * Math.PI / 2)) * (1 - Math.max(0, u - 0.7) / 0.3 * 0.6);
            Q.tongue(Xs, Ys, T * 0.75, hgt, 0, 1.0, 0.95, v.i * 3.1); Q.tongue(Xs - T * 0.3, Ys, T * 0.45, hgt * 0.7, -0.15, 0.85, 0.8, v.i * 1.3); Q.tongue(Xs + T * 0.3, Ys, T * 0.45, hgt * 0.75, 0.15, 0.85, 0.8, v.i * 2.2); Q.fire(Xs, Ys - T * 0.3, T * 1.2, 1.0, 0.8 * (1 - u * 0.6), v.i); Q.glow(Xs, Ys, T * 2.6, P.LAVA, 0.6); } });
        if (!used) for (const v of er) { const Xs = X.sx(v.x), Ys = X.sy(v.y), u = v.k, hgt = T * (2.4 + 2.6 * Math.sin(Math.min(1, u * 1.6) * Math.PI / 2)) * (1 - Math.max(0, u - 0.7) / 0.3 * 0.6); c.save(); const gg = c.createLinearGradient(0, Ys - hgt, 0, Ys); gg.addColorStop(0, 'rgba(255,90,26,0)'); gg.addColorStop(0.3, 'rgba(255,140,40,.85)'); gg.addColorStop(1, 'rgba(255,240,190,.95)'); c.fillStyle = gg;
            c.beginPath(); c.moveTo(Xs - T * 0.7, Ys); for (let i = 0; i <= 8; i++) { const yy = Ys - hgt * i / 8, w = T * 0.7 * (1 - i / 9) * (0.85 + 0.25 * Math.sin(t * 20 + i * 1.7)); c.lineTo(Xs - w, yy); } for (let i = 8; i >= 0; i--) { const yy = Ys - hgt * i / 8, w = T * 0.7 * (1 - i / 9) * (0.85 + 0.25 * Math.sin(t * 17 + i * 2.1)); c.lineTo(Xs + w, yy); } c.closePath(); c.fill(); c.restore(); glow(c, Xs, Ys - hgt * 0.4, T * 2.2, P.LAVA, 0.6); }
        for (const v of vents) if (v.ph === 'warn') { const Xs = X.sx(v.x), Ys = X.sy(v.y); glow(c, Xs, Ys, T * (0.8 + v.k * 0.9), P.LAVA, 0.25 + 0.45 * v.k); if (Math.hypot(me.x - v.x, me.y - v.y) < 9) label(c, v.demo ? 'SAFE TO WATCH: IT GLOWS AND HISSES' : 'HISS', Xs, Ys - T * (1.2 + v.k * 0.5), T * 0.22, P.WARN); }
        if (!lowFx()) for (const [x, y0, y1] of FALLS) { const Y0 = X.sy(y0), Y1 = X.sy(y1); if (Y1 < 0 || Y0 > Hh) continue; glow(c, X.sx(x), (Y0 + Y1) / 2, T * 2.2, P.LAVA, 0.12); }
        courtOver(c, T, t); } };
    /* ---- the Ember Court's drawing ---- */
    function courtGround(c, T, t) { if (!C.on && !brood.done) return; const Xc = X.sx(ctr.x), Yc = X.sy(ctr.y); if (Yc > X.H() + T * 8 || Yc < -T * 8) return;
      c.save(); // a ring of rune-cut stones round the court's edge, cold once the idols are dark
      c.strokeStyle = C.done ? rgba(P.FROST, 0.5) : rgba(P.LAVA, 0.35 + 0.15 * Math.sin(t * 2)); c.lineWidth = Math.max(2, T * 0.08); c.setLineDash([T * 0.5, T * 0.3]); ell(c, Xc, Yc, (EC_RX - 0.7) * T, (EC_RY - 0.7) * T); c.stroke(); c.setLineDash([]);
      for (const w of C.winds) { const m = mouth(w.th), u = Math.min(1, w.t / w.dur), lock = w.t >= w.dur - 0.3;
        if (w.kind === 'lob') { const Xs = X.sx(w.tx), Ys = X.sy(w.ty), R = 1.15 * T; c.fillStyle = rgba(P.WARN, 0.12 + 0.2 * u); ell(c, Xs, Ys, R, R * 0.75); c.fill(); c.strokeStyle = rgba(P.WARN, 0.6 + 0.35 * u); c.lineWidth = 2.5; c.stroke(); c.beginPath(); c.ellipse(Xs, Ys, R * u, R * 0.75 * u, 0, 0, TAU); c.stroke(); continue; }
        const x0 = X.sx(m.x), y0 = X.sy(m.y), dx = w.tx - m.x, dy = w.ty - m.y, d = Math.hypot(dx, dy) || 1, L = d + 6, x1 = X.sx(m.x + dx / d * L), y1 = X.sy(m.y + dy / d * L), wd = (w.kind === 'roll' ? 1.1 : 0.72) * T;
        c.strokeStyle = rgba(P.WARN, (lock ? 0.55 : 0.25) + 0.2 * u); c.lineWidth = wd * (0.35 + 0.65 * u); c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.setLineDash([T * 0.25, T * 0.2]); c.lineDashOffset = -t * T * 2; c.strokeStyle = rgba('#FFE0C0', 0.75); c.lineWidth = 2; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.setLineDash([]); }
      for (const b of C.balls) { const Xs = X.sx(b.kind === 'lob' ? b.tx : b.x), Ys = X.sy(b.kind === 'lob' ? b.ty : b.y);
        if (b.kind === 'lob') { const u = Math.min(1, b.t / b.dur), R = b.R * T; c.fillStyle = rgba(P.WARN, 0.18 + 0.3 * u); ell(c, Xs, Ys, R, R * 0.75); c.fill(); c.strokeStyle = rgba(P.WARN, 0.9); c.lineWidth = 3; c.stroke(); c.fillStyle = 'rgba(0,0,0,.35)'; ell(c, Xs, Ys, R * 0.35 * (0.5 + u), R * 0.25 * (0.5 + u)); c.fill(); label(c, 'LANDING', Xs, Ys - R * 0.9, T * 0.2, P.WARN); }
        else { c.fillStyle = 'rgba(0,0,0,.35)'; ell(c, Xs, Ys, b.r * T, b.r * T * 0.45); c.fill(); } }
      // a charge's lane: red-orange, as wide as the idol, from its feet to the court's edge; it brightens and its chevrons race
      // once the aim locks; the idol it will hit (the lure) is ringed
      for (const th of all()) { if (th.st !== 'wind' || th.t < 0) continue; const u = clamp(th.t / th.dur, 0, 1), L = th.lockd ? th.maxT : rayLen(th.x, th.y, th.ax, th.ay), x0 = X.sx(th.x), y0 = X.sy(th.y + 0.2), x1 = X.sx(th.x + th.ax * L), y1 = X.sy(th.y + 0.2 + th.ay * L), wd = T * 1.5;
        c.lineCap = 'butt'; c.strokeStyle = rgba(th.lockd ? '#FF5A2A' : P.WARN, (th.lockd ? 0.5 : 0.18) + 0.25 * u); c.lineWidth = wd * (0.45 + 0.55 * u); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        c.strokeStyle = rgba('#FF8A3A', 0.8); c.lineWidth = 2; for (const sd of [-1, 1]) { const ox = -th.ay * sd * wd * (0.45 + 0.55 * u) / 2, oy = th.ax * sd * wd * (0.45 + 0.55 * u) / 2; c.beginPath(); c.moveTo(x0 + ox, y0 + oy); c.lineTo(x1 + ox, y1 + oy); c.stroke(); }
        const n = Math.floor(L / 1.1), sp = th.lockd ? 5 : 1.6; c.fillStyle = rgba('#FFE0C0', th.lockd ? 0.9 : 0.55); for (let i = 0; i < n; i++) { const f = ((i + t * sp) % n) / n, px = x0 + (x1 - x0) * f, py = y0 + (y1 - y0) * f, a = Math.atan2(y1 - y0, x1 - x0), h = T * 0.32; c.save(); c.translate(px, py); c.rotate(a); c.beginPath(); c.moveTo(h * 0.6, 0); c.lineTo(-h * 0.4, -h * 0.55); c.lineTo(-h * 0.1, 0); c.lineTo(-h * 0.4, h * 0.55); c.closePath(); c.fill(); c.restore(); }
        if (th.lockd && th.lure && idols[th.lure]) { const o = idols[th.lure], k = 0.6 + 0.4 * Math.sin(t * 14); c.strokeStyle = rgba('#FFF08C', 0.6 + 0.4 * k); c.lineWidth = 3; ell(c, X.sx(o.x), X.sy(o.y + 0.5), T * 1.05, T * 0.42); c.stroke(); } }
      // where to stand, until the first crash has shown the trick: a soft ring between the two idols
      { const q = lureSpot(); if (q) { const k = 0.5 + 0.5 * Math.sin(t * 4); c.strokeStyle = rgba('#FFF08C', 0.35 + 0.35 * k); c.lineWidth = 2.5; c.setLineDash([T * 0.2, T * 0.15]); ell(c, X.sx(q.x), X.sy(q.y), T * 0.8, T * 0.35); c.stroke(); c.setLineDash([]); } }
      c.restore(); }
    function ballArt(c, Xs, Ys, R, spin, kind) { const g2 = c.createRadialGradient(Xs - R * 0.3, Ys - R * 0.35, R * 0.1, Xs, Ys, R); g2.addColorStop(0, '#FFF6D0'); g2.addColorStop(0.35, P.LAVA_HI); g2.addColorStop(0.8, P.LAVA); g2.addColorStop(1, P.LAVA_D); c.fillStyle = g2; c.beginPath(); c.arc(Xs, Ys, R, 0, TAU); c.fill(); c.strokeStyle = '#3A1408'; c.lineWidth = Math.max(1.5, R * 0.12); c.stroke();
      // crust plates turning on it (a rolling ball wears more of them)
      c.strokeStyle = 'rgba(40,16,10,.75)'; c.lineWidth = Math.max(1.2, R * 0.12); for (let i = 0; i < (kind === 'roll' ? 4 : 2); i++) { const a = spin + i * 1.7; c.beginPath(); c.arc(Xs, Ys, R * 0.7, a, a + 0.9); c.stroke(); } }
    function courtOver(c, T, t) {
      const used = gpu(c, Q => { idolsGpu(Q, T); for (const b of C.balls) { const Xs = X.sx(b.x), Ys = X.sy(b.y) - (b.z || 0) * T, R = (b.kind === 'roll' ? 0.55 : b.kind === 'lob' ? 0.45 : 0.36) * T; Q.fire(Xs, Ys, R * 1.6, 0.95, 0.75, b.spin || b.t || 0); Q.glow(Xs, Ys, R * 3, P.LAVA, 0.5); if (b.vx) { const k = 0.18; Q.firebeam(Xs - b.vx * k * T, Ys - b.vy * k * T, Xs, Ys, R * 0.9, 0.8, 0.6, b.spin || 0, 4); } } });
      for (const b of C.balls) { const Xs = X.sx(b.x), Ys = X.sy(b.y) - (b.z || 0) * T, R = (b.kind === 'roll' ? 0.55 : b.kind === 'lob' ? 0.45 : 0.36) * T; if (!used && b.vx) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(P.LAVA, 0.5); c.lineWidth = R * 1.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(Xs - b.vx * 0.12 * T, Ys - b.vy * 0.12 * T); c.lineTo(Xs, Ys); c.stroke(); c.restore(); } ballArt(c, Xs, Ys, R, b.spin || b.t * 6 || 0, b.kind); if (!used) glow(c, Xs, Ys, R * 2.6, P.LAVA, 0.45); }
      // the prompt: TAP DODGE! over the pet (and the dodge button pulsing, on a touch screen) while a teaching throw winds up
      const W = X.W(), Hh = X.H();
      // (in the fight: the teaching charges say when; "DODGE NOW!" as the charge is about to reach the pet)
      const soon = all().some(th => th.st === 'charge' && th.teach && !th.passed && (Math.hypot(me.x - th.x, me.y - th.y) - 1.05) / th.spd < 0.45);
      if ((C.prompt > 0 || soon) && !C.done) { const k = 0.6 + 0.4 * Math.sin(t * 9), word = soon ? (touchUI ? 'DODGE NOW!' : 'SHIFT NOW!') : C.promptWord || (touchUI ? 'TAP DODGE!' : 'PRESS SHIFT: DODGE!'); label(c, word, X.sx(me.x), X.sy(me.y) - T * 1.9, T * 0.32 * (1 + 0.08 * k) * (soon ? 1.25 : 1), soon ? '#FFFFFF' : '#FFF08C');
        if (touchUI) { const kit = (X.F.party && X.F.party[0] && X.F.party[0].kit && X.F.party[0].kit.kit) || {}, n3 = ['strong', 'strong2', 'strong3'].filter(q => kit[q]).length >= 3, bx = n3 ? W - 34 : W - 52, by = Hh - 52 - (n3 ? 154 : 138), br = n3 ? 26 : 27;
          c.save(); c.strokeStyle = rgba('#FFF08C', 0.5 + 0.5 * k); c.lineWidth = 4; c.beginPath(); c.arc(bx, by, br + 6 + 6 * k, 0, TAU); c.stroke(); c.restore(); label(c, 'TAP!', bx, by - br - 16, 14, '#FFF08C'); } }
      // the flying debris of cracks, crashes and shatters: chunks of basalt, some still glowing
      if (C.debris.length) { c.save(); for (const q of C.debris) { const Xs = X.sx(q.x), Ys = X.sy(q.y) - q.z * T, r = q.s * T, a = clamp(q.life / 0.4, 0, 1); c.globalAlpha = a; c.save(); c.translate(Xs, Ys); c.rotate(q.rot); poly(c, [[-r, -r * 0.4], [-r * 0.2, -r * 0.9], [r * 0.9, -r * 0.3], [r * 0.6, r * 0.7], [-r * 0.7, r * 0.6]]); c.closePath(); c.fillStyle = '#3A3034'; c.fill(); c.strokeStyle = q.hot ? rgba(P.LAVA_HI, 0.9) : '#120C0E'; c.lineWidth = q.hot ? 1.6 : 1.2; c.stroke(); c.restore(); if (q.hot && !lowFx()) glow(c, Xs, Ys, r * 2.4, P.LAVA, 0.35 * a); } c.restore(); }
      // the awake idols off the screen: an arrow each, red while one winds up a charge
      if (C.phase === 'dodge') edgeMarks(X, c, C.winds.map(w => ({ x: w.th.x, y: w.th.y, col: '#FF5A2A', label: 'THROW!', warn: true })));
      if (C.phase === 'fight') edgeMarks(X, c, awake().map(th => ({ x: th.x, y: th.y, col: th.st === 'wind' || th.st === 'charge' ? '#FF5A2A' : '#C9A88E', label: th.st === 'wind' || th.st === 'charge' ? 'CHARGE!' : 'IDOL', warn: th.st === 'wind' })));
      // the counter: DODGED n / 6 while they throw, then SHATTERED n / 6; a pop on each, gold at the end
      if (C.on) { const cx = W / 2, cy = 132, pop = C.pop, wd = 190, two = C.phase !== 'dodge', n = two ? C.shattered : C.count; c.save(); c.fillStyle = 'rgba(14,8,10,.72)'; c.beginPath(); if (c.roundRect) c.roundRect(cx - wd / 2, cy - 26, wd, 48, 12); else c.rect(cx - wd / 2, cy - 26, wd, 48); c.fill(); c.strokeStyle = C.done ? '#FFF08C' : two ? rgba(P.LAVA, 0.8) : rgba(P.FROST, 0.8); c.lineWidth = 2; c.stroke();
        for (let i = 0; i < 6; i++) { const px = cx - wd / 2 + 22 + i * (wd - 44) / 5, on = i < n; c.beginPath(); c.arc(px, cy + 15, 5, 0, TAU); c.fillStyle = on ? (C.done ? '#FFF08C' : two ? '#FFB070' : P.FROST_HI) : 'rgba(255,255,255,.18)'; c.fill(); }
        c.restore(); label(c, two ? `SHATTERED ${n} / 6` : `DODGED ${n} / ${EC_NEED}`, cx, cy + 2 - pop * 2, 15 + pop * 5, C.done ? '#FFF08C' : '#FFFFFF');
        if (pop > 0.05) label(c, C.popWord, cx, cy + 50 + (1 - pop) * 10, 18 + pop * 10, '#FFF08C'); } }
    /* ---- the descent's art ---- */
    function ventArt(c, v, T, t) { const Xs = X.sx(v.x), Ys = X.sy(v.y); if (Ys < -T * 3 || Ys > X.H() + T * 2) return; const lw = lwOf(T), k = v.ph === 'warn' ? v.k : v.ph === 'erupt' ? 1 : v.ph === 'cool' ? 0.4 : 0;
      c.save(); // a ring of cracked crust round a vent mouth; it glows up through the cracks as it builds
      ell(c, Xs, Ys, T * 0.95, T * 0.6); c.fillStyle = '#231A18'; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + v.i; c.strokeStyle = k > 0 ? rgba(P.LAVA_HI, 0.35 + 0.6 * k) : 'rgba(255,120,60,.25)'; c.lineWidth = Math.max(1.2, T * 0.04); c.beginPath(); c.moveTo(Xs + Math.cos(a) * T * 0.35, Ys + Math.sin(a) * T * 0.22); c.lineTo(Xs + Math.cos(a + 0.2) * T * 0.9, Ys + Math.sin(a + 0.2) * T * 0.56); c.stroke(); }
      ell(c, Xs, Ys, T * 0.38, T * 0.24); const mg = c.createRadialGradient(Xs, Ys, 0, Xs, Ys, T * 0.4); mg.addColorStop(0, k > 0 ? '#FFF0C0' : '#6A2A14'); mg.addColorStop(1, k > 0 ? P.LAVA : '#2A1410'); c.fillStyle = mg; c.fill();
      // steam wisps while it hisses
      if (v.ph === 'warn' && !lowFx()) for (let i = 0; i < 3; i++) { const u = ((t * 1.4 + i / 3) % 1), px = Xs + Math.sin(i * 2.4 + t * 3) * T * 0.3, py = Ys - u * T * 1.6; const gg = c.createRadialGradient(px, py, 0, px, py, T * (0.2 + u * 0.4)); gg.addColorStop(0, `rgba(240,230,225,${0.5 * (1 - u) * v.k})`); gg.addColorStop(1, 'rgba(240,230,225,0)'); c.fillStyle = gg; c.beginPath(); c.arc(px, py, T * (0.2 + u * 0.4), 0, TAU); c.fill(); }
      c.restore(); }
    function lavafall(c, x, y0, y1, T, t) { const Xs = X.sx(x), Y0 = X.sy(y0), Y1 = X.sy(y1), w = T * 0.8; if (Y1 < 0 || Y0 > X.H()) return; c.save();
      const gg = c.createLinearGradient(Xs - w, 0, Xs + w, 0); gg.addColorStop(0, rgba(P.LAVA_D, 0)); gg.addColorStop(0.25, P.LAVA_D); gg.addColorStop(0.5, P.LAVA_HI); gg.addColorStop(0.75, P.LAVA_D); gg.addColorStop(1, rgba(P.LAVA_D, 0)); c.fillStyle = gg; c.fillRect(Xs - w, Y0, w * 2, Y1 - Y0);
      c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,220,150,.4)'; for (let i = 0; i < 10; i++) { const u = ((t * 0.5 + i * 0.137) % 1); ell(c, Xs + Math.sin(i * 3.1) * w * 0.3, Y0 + u * (Y1 - Y0), w * 0.18, T * 0.5); c.fill(); }
      c.restore(); gpu(c, Q => { Q.firebeam(Xs, Y0, Xs, Y1, w * 0.8, 0.75, 0.6, x, -2); }); }
    function columnArt(c, Xs, Ys, T, ph) { const lw = lwOf(T), w = T * 0.9, h = T * 6.5, top = Ys - h; c.save(); c.fillStyle = 'rgba(0,0,0,.45)'; ell(c, Xs + T * 0.2, Ys, w, T * 0.3); c.fill();
      // a basalt column: hexagonal, jointed, a seam of heat in its cracks; it rises out of sight
      const fg = c.createLinearGradient(0, top, 0, Ys); fg.addColorStop(0, 'rgba(43,35,33,0)'); fg.addColorStop(0.25, P.BASALT); fg.addColorStop(1, P.BASALT_HI); c.fillStyle = fg; c.fillRect(Xs - w / 2, top, w, h);
      const sg = c.createLinearGradient(Xs - w / 2, 0, Xs + w / 2, 0); sg.addColorStop(0, 'rgba(255,255,255,.12)'); sg.addColorStop(0.35, 'rgba(255,255,255,0)'); sg.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = sg; c.fillRect(Xs - w / 2, top, w, h);
      c.strokeStyle = 'rgba(10,6,6,.7)'; c.lineWidth = lw * 0.7; for (const u of [-0.17, 0.17]) { c.beginPath(); c.moveTo(Xs + u * w, top + h * 0.2); c.lineTo(Xs + u * w, Ys); c.stroke(); } for (let i = 1; i < 6; i++) { const yy = Ys - h * i / 6.5 + Math.sin(i * 3 + ph) * T * 0.1; c.beginPath(); c.moveTo(Xs - w / 2, yy); c.lineTo(Xs + w / 2, yy + T * 0.06); c.stroke(); }
      c.strokeStyle = rgba(P.LAVA, 0.6); c.lineWidth = Math.max(1, T * 0.03); c.beginPath(); c.moveTo(Xs - w * 0.1, Ys - h * 0.15); c.lineTo(Xs + w * 0.05, Ys - h * 0.35); c.lineTo(Xs - w * 0.05, Ys - h * 0.5); c.stroke();
      c.fillStyle = P.BASALT_HI; ell(c, Xs, Ys, w / 2, T * 0.14); c.fill(); c.restore(); }
    function slabArt(c, Xs, Ys, T, ph) { const t = g.t, cy = Ys - T * 3.4 + Math.sin(t * 0.6 + ph) * T * 0.12, w = T * 2.2, h = T * 0.7, a = Math.sin(t * 0.4 + ph) * 0.05; c.save();
      // a suspended obsidian slab on two chains, its underside lit red by the drop
      c.strokeStyle = 'rgba(25,18,18,.9)'; c.lineWidth = Math.max(1.5, T * 0.06); for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(Xs + sd * w * 0.35, cy - h / 2); c.lineTo(Xs + sd * w * 0.45, cy - T * 9); c.stroke(); }
      c.translate(Xs, cy); c.rotate(a); poly(c, [[-w / 2, -h / 2], [w / 2 - T * 0.2, -h / 2 - T * 0.1], [w / 2, h * 0.1], [w / 2 - T * 0.3, h / 2], [-w / 2 + T * 0.2, h / 2 + T * 0.05]]); c.closePath();
      const og = c.createLinearGradient(0, -h / 2, 0, h / 2); og.addColorStop(0, '#3A3044'); og.addColorStop(0.5, '#120E18'); og.addColorStop(1, '#5A1E10'); c.fillStyle = og; c.fill(); c.strokeStyle = '#05030A'; c.lineWidth = 2; c.stroke();
      c.strokeStyle = 'rgba(200,180,255,.35)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-w * 0.4, -h * 0.3); c.lineTo(w * 0.2, -h * 0.4); c.stroke(); c.restore(); }
    /* far off across the lava lake: Ifrit on his throne in a cracked ring of basalt (dark plates over a molten core, two
       rough obsidian horns with hot edges, clawed stone hands on the arms of the throne); his chest is a distant furnace
       that swells when he breathes */
    function throneArt(c, T, t) { const cx = X.sx(DE_CX + 1.5), by = X.sy(8.2), s = T * 0.95; if (by < -T * 4 || by - s * 9 > X.H()) return; const br = 0.5 - 0.5 * Math.cos(S.breath / 4.6 * TAU), lw = lwOf(T);
      c.save();
      // the cracked ring of basalt round the throne
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, gap = i === 3 || i === 9; if (gap) continue; const x = cx + Math.cos(a) * s * 6.2, y = by - s * 1.6 + Math.sin(a) * s * 2.0, h = s * (0.9 + 0.6 * ((i * 0.37) % 1)) * (Math.sin(a) > 0 ? 1.1 : 0.8);
        poly(c, [[x - s * 0.7, y], [x - s * 0.5, y - h], [x + s * 0.4, y - h * 0.85], [x + s * 0.7, y]]); c.closePath(); c.fillStyle = Math.sin(a) > 0 ? '#2C2322' : '#1C1615'; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw * 0.8; c.stroke(); c.strokeStyle = rgba(P.LAVA, 0.4); c.beginPath(); c.moveTo(x - s * 0.2, y); c.lineTo(x, y - h * 0.6); c.stroke(); }
      // the throne: almost the rock itself
      poly(c, [[cx - s * 2.6, by - s * 0.6], [cx - s * 2.4, by - s * 6.8], [cx - s * 1.2, by - s * 7.6], [cx + s * 1.2, by - s * 7.6], [cx + s * 2.4, by - s * 6.8], [cx + s * 2.6, by - s * 0.6]]); c.closePath(); const tg = c.createLinearGradient(cx - s * 2.6, 0, cx + s * 2.6, 0); tg.addColorStop(0, '#2A2220'); tg.addColorStop(1, '#151010'); c.fillStyle = tg; c.fill(); c.strokeStyle = P.INK; c.lineWidth = lw; c.stroke();
      // him: legs, the plated torso, the shoulders, the head with two rough horns, the arms on the throne's arms
      const plate = (pts, col) => { poly(c, pts); c.closePath(); c.fillStyle = col || '#3A302C'; c.fill(); c.strokeStyle = '#120C0B'; c.lineWidth = lw * 0.8; c.stroke(); };
      const seam = (x0, y0, x1, y1, a) => { c.strokeStyle = rgba(P.LAVA_HI, a); c.lineWidth = Math.max(1.2, s * 0.06); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
      plate([[cx - s * 1.5, by - s * 2.2], [cx - s * 0.3, by - s * 2.4], [cx - s * 0.5, by - s * 0.4], [cx - s * 1.4, by - s * 0.3]]); plate([[cx + s * 1.5, by - s * 2.2], [cx + s * 0.3, by - s * 2.4], [cx + s * 0.5, by - s * 0.4], [cx + s * 1.4, by - s * 0.3]]);
      // the molten core glowing between the chest plates (swelling with each breath)
      const chx = cx, chy = by - s * 3.9; glow(c, chx, chy, s * (1.6 + br * 1.4), P.LAVA, 0.45 + 0.4 * br); const cg = c.createLinearGradient(chx, chy - s * 0.9, chx, chy + s * 0.9); cg.addColorStop(0, rgba(P.LAVA_D, 0.9)); cg.addColorStop(0.5, rgba(P.LAVA_HI, 0.6 + 0.4 * br)); cg.addColorStop(1, rgba(P.LAVA_D, 0.9)); c.fillStyle = cg; ell(c, chx, chy, s * (0.24 + 0.06 * br), s * 0.95); c.fill();
      plate([[cx - s * 1.6, by - s * 5.6], [cx - s * 0.15, by - s * 5.2], [cx - s * 0.25, by - s * 3.6], [cx - s * 1.2, by - s * 2.6], [cx - s * 1.7, by - s * 3.4]], '#423632'); plate([[cx + s * 1.6, by - s * 5.6], [cx + s * 0.15, by - s * 5.2], [cx + s * 0.25, by - s * 3.6], [cx + s * 1.2, by - s * 2.6], [cx + s * 1.7, by - s * 3.4]], '#3A2F2B');
      plate([[cx - s * 1.1, by - s * 2.8], [cx + s * 1.1, by - s * 2.8], [cx + s * 0.8, by - s * 2.1], [cx - s * 0.8, by - s * 2.1]], '#2E2624');
      seam(cx - s * 0.2, by - s * 5.1, cx - s * 0.25, by - s * 3.7, 0.6 + 0.4 * br); seam(cx + s * 0.2, by - s * 5.1, cx + s * 0.25, by - s * 3.7, 0.6 + 0.4 * br); seam(cx - s * 1.1, by - s * 2.75, cx + s * 1.1, by - s * 2.75, 0.4 + 0.3 * br);
      // the shoulders (heat leaking from their joints), the arms down onto the throne's arms, clawed stone hands
      for (const sd of [-1, 1]) { plate([[cx + sd * s * 1.4, by - s * 5.9], [cx + sd * s * 2.6, by - s * 5.6], [cx + sd * s * 2.7, by - s * 4.7], [cx + sd * s * 1.6, by - s * 4.8]], '#4A3E39'); seam(cx + sd * s * 1.55, by - s * 4.85, cx + sd * s * 2.6, by - s * 4.75, 0.5 + 0.4 * br);
        plate([[cx + sd * s * 2.2, by - s * 4.8], [cx + sd * s * 2.8, by - s * 4.7], [cx + sd * s * 2.9, by - s * 2.5], [cx + sd * s * 2.3, by - s * 2.6]], '#352B28');
        plate([[cx + sd * s * 2.1, by - s * 2.6], [cx + sd * s * 3.0, by - s * 2.5], [cx + sd * s * 3.1, by - s * 2.0], [cx + sd * s * 2.0, by - s * 2.0]], '#3E3430');
        for (let f = 0; f < 3; f++) { const fx = cx + sd * s * (2.2 + f * 0.35); poly(c, [[fx - s * 0.1, by - s * 2.0], [fx + s * 0.1, by - s * 2.0], [fx + sd * s * 0.05, by - s * 1.55]]); c.closePath(); c.fillStyle = '#1A1412'; c.fill(); } }
      // the head: a heavy jaw of plates, heat at the jaw, two eyes of ember; the horns: rough black obsidian, red-hot edges
      const hy = by - s * 6.4; plate([[cx - s * 0.75, hy - s * 0.7], [cx + s * 0.75, hy - s * 0.7], [cx + s * 0.85, hy + s * 0.2], [cx + s * 0.45, hy + s * 0.75], [cx - s * 0.45, hy + s * 0.75], [cx - s * 0.85, hy + s * 0.2]], '#3C322E');
      seam(cx - s * 0.45, hy + s * 0.45, cx + s * 0.45, hy + s * 0.45, 0.5 + 0.5 * br); glow(c, cx, hy + s * 0.55, s * 0.9, P.LAVA, 0.3 + 0.3 * br);
      for (const sd of [-1, 1]) { c.fillStyle = rgba(P.LAVA_HI, 0.85); ell(c, cx + sd * s * 0.32, hy - s * 0.1, s * 0.13, s * 0.07); c.fill();
        poly(c, [[cx + sd * s * 0.55, hy - s * 0.55], [cx + sd * s * 1.25, hy - s * 1.25], [cx + sd * s * 1.35, hy - s * 2.2], [cx + sd * s * 1.05, hy - s * 1.45], [cx + sd * s * 0.4, hy - s * 0.75]]); c.closePath(); c.fillStyle = '#0E0A10'; c.fill(); c.strokeStyle = rgba(P.LAVA, 0.85); c.lineWidth = Math.max(1.2, s * 0.06); c.stroke(); }
      c.restore();
      if (!lowFx()) gpu(c, Q => { Q.glow(chx, chy, s * (2.2 + br * 1.6), P.LAVA, 0.5 + 0.4 * br); Q.shimmer(cx, by - s * 5.5, s * 2.5, 0.25 + 0.2 * br, 1.1); }); }
  }
  CAL_STAGES.DESCENT = { name: 'The Heartward Descent', goal: 'Down the cathedral, then the Ember Court', how: 'The forge gives way to a vertical cathedral of basalt columns, hanging obsidian slabs and lava pouring down the walls. Three short causeways cross the drop, each with vents: a vent glows and hisses for about two seconds before it erupts (the first one shows itself once, harmlessly). An eruption throws you off the causeway: you land back on the last ledge, a little hurt. On the three broad, cool ledges between them the brood rises in waves, about forty in all: ashen knights (one slow combo each), crystal wisps (one marked beam each), and the hollows\' kin. A ledge\'s slag barricade gives way once its waves are down. Then the Ember Court: six furnace idols round a basalt platform glow, wind up and hurl molten balls (an aim line, or a landing circle for a lobbed one). Dodge six of them: roll through a ball with the dodge button as it reaches you, or step aside so it passes close by. A hit only stings and never counts. Then the idols wake and stomp down onto the court, two at a time, and charge you along a shown red lane. Your blows barely scratch them: stand between two of them and dodge at the last moment, and the charge carries on into the other idol. Two crashes shatter an idol; the last two charge together. When all six are rubble the way opens to the overlook, where Ifrit sits far off on his throne. A frost shrine there restores your pet before you go in.',
    layout: DE_LAYOUT, legend: { E: {}, F: {}, v: {}, X: {}, U: {}, W: {}, Y: {}, C: {}, T: { tile: T_SOLID },
      H: { tile: T_SOLID, get prop() { return DunWorld.PROPS.basaltcol ? 'basaltcol' : undefined; } }, O: { tile: T_GAP, get prop() { return DunWorld.PROPS.slabhang ? 'slabhang' : undefined; } }, L: PROP('lavafall', 'volrok'), G: PROP('bigcrystal', 'obsidian') }, make: makeDescent };

  try { if (typeof self !== 'undefined') self.__CAL_STAGES = CAL_STAGES; } catch (e) {}
})();
