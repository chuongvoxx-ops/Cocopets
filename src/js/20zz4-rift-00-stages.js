/* ---------- Rift 0, the Blackfire Caldera: its three trial dungeons ----------
   CAL_STAGES.HOLLOWS   The Ashen Hollows (stage 1): a sheltered basalt ledge looks out over lava streams and black fire
                        crystals; a ramp descends through two compact chambers (lava runnels: touching one burns a little
                        and puts you back on the last safe ground) into the cooler maintenance cavern. Its brood comes
                        in order: two cinder slugs; a basalt crawler, then a lone ember wisp; then one of each together.
                        The cavern's hatch opens when they are down. The Frozen Causeway: a lava channel blocks the far
                        door; a frost reservoir (north) feeds a T-junction, elbows west and east of it, a straight south
                        of each, a cooling basin south of each straight. Five pieces turn 90 degrees a use (random
                        starting turns, the fixed solvable layout); frost flows visibly through every joined piece, a
                        disconnected outlet only mists. Both basins flowing at once: the reservoir's valve lights; the
                        pet releases the frost, and both halves of the obsidian bridge latch for good. No monsters in
                        the cavern; after a while a hint traces the missing connection. Beyond: a frost shrine (heal,
                        checkpoint) and the door to Fire Flan.
   CAL_STAGES.FOUNDRY   The Runebound Foundry (stage 3): grated walkways over lava into an ancient forge (suspended
                        rings, broken chains, pressure vessels, runic machinery). Two furnace imps; a runic sentinel
                        alone; then an ordinary pack with the bomb lesson: a bomb larva lands, and hitting the grounded
                        bomb while it is safe sends it flying into a monster (it never hurts the pet; this one is weak).
                        The Three Rune Rings: three rings (left, middle, right) each cycle Eye, Chain, Crown; the
                        inscription reads EYE, CHAIN, CROWN; lever A turns left+middle, B middle+right, C left+right, each
                        joined to its two rings by drawn lines; nearing a lever lights its rings. A reset lever, and a
                        lectern that shows the next move (breadth-first from the CURRENT state over the 27). Solved: the
                        rings align into an iris, the pressure door opens, a bass heartbeat sounds from beyond.
   CAL_STAGES.DESCENT   The Heartward Descent (stage 5): a vertical cathedral of basalt columns, hanging obsidian slabs,
                        lava pouring down the walls and black crystals growing toward a throne. Two short causeways
                        with vents (each glows and hisses before it erupts; the first shows itself once, harmlessly);
                        an eruption throws you off the causeway: you land back on the last ledge, a little hurt. Broad
                        cooling ledges between them hold two finite groups (two ashen knights; a knight and two crystal
                        wisps); a slag barricade lifts from the next causeway when a ledge is clear. Last, the overlook:
                        Ifrit seated far off in a cracked basalt ring, his chest a furnace that swells as he breathes.
   Every trial ends at its door with a frost shrine (stand at it: full health, the checkpoint) before the boss.
   (CAL, the core of 20zz5, loads after this file: every CAL use is inside make(), which only runs once a stage starts, and
   each one is guarded: a missing helper, brood type or biome falls back to this file's own drawing and the Tower's brood) */
const CAL_STAGES = { HP_K: 1.7 };   // (HP_K: a balance knob on the trials' own brood health, for the lead's tuning pass)
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
  function doorway(X, H, tiles, art, o) { o = o || {}; const x0 = Math.min(...tiles.map(t => t.tx)), x1 = Math.max(...tiles.map(t => t.tx)) + 1, y0 = Math.min(...tiles.map(t => t.ty)), y1 = Math.max(...tiles.map(t => t.ty)) + 1, D = { k: 0, open: false, tiles, x0, x1, y0, y1 };
    D.obj = H.obj({ x: (x0 + x1) / 2, y: y1 + 0.02, kind: o.kind || 'caldoor', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { art(c, Xs, Ys, T, D); } });
    D.open1 = () => { if (D.open) return; D.open = true; tiles.forEach(t => unblock(X, t.tx, t.ty, o.tile)); X.retile(); X.shake(4, 0.4); if (X.sfx.crash) X.sfx.crash(); };
    D.tick = dt => { if (D.open) D.k = Math.min(1, D.k + dt * 0.7); };
    tiles.forEach(t => block(X, t.tx, t.ty)); return D; }

  /* ======================= THE ASHEN HOLLOWS ======================= */
  /* rows from the top: the far landing (door, shrine) · the lava channel and the obsidian bridge · the maintenance cavern with
     the causeway's pieces · the hatch · chamber 2 · a corridor · chamber 1 (a lava runnel across it) · the ramp · the start
     ledge in a lava field with crystal islands */
  const HO_W = 31, HO_H = 62, HO_CX = 15;
  const HO_LAYOUT = (() => { const g = grid(HO_W, HO_H, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    const oval = (cx, cy, rx, ry, ch) => { for (let y = 0; y < HO_H; y++) for (let x = 0; x < HO_W; x++) if (Math.pow((x + 0.5 - cx) / rx, 2) + Math.pow((y + 0.5 - cy) / ry, 2) < 1) g[y][x] = ch || '.'; };
    // the lava field round the start ledge (the panorama), with crystal islands
    oval(15.5, 55, 15, 9, '~'); rect(1, 49, 29, 61, '~'); oval(15.5, 55.5, 7.6, 4.6); rect(13, 46, 17, 52);
    g[60][15] = '.'; rect(12, 57, 18, 59); g[57][15] = 'S';
    for (const [x, y] of [[3, 52], [26, 51], [22, 60], [8, 61]]) g[y][x] = 'C'; g[58][5] = 'G'; g[57][26] = 'G'; g[50][7] = 'Y'; g[48][23] = 'Y'; g[61][11] = 'G'; g[61][20] = 'C'; g[56][6] = 'Y'; g[54][25] = 'Y';
    // chamber 1 and its runnel; the corridor; chamber 2 and its stream
    oval(15.5, 41.5, 9.5, 5.6); for (let x = 6; x <= 25; x++) if (g[42][x] === '.') g[42][x] = 'r'; for (const x of [14, 15, 16]) g[42][x] = '.';
    for (let y = 38; y <= 41; y++) if (g[y][24] === '.') g[y][24] = g[y][23] === '.' ? 'r' : g[y][24];
    rect(13, 33, 17, 37); oval(15.5, 27.5, 12, 5.4); for (let x = 3; x <= 28; x++) if (g[27][x] === '.' && (x < 8 || x > 23)) g[27][x] = 'r';
    // the hatch, and the maintenance cavern
    rect(13, 20, 17, 22); for (const x of [14, 15, 16]) g[21][x] = 'h'; g[21][13] = '#'; g[21][17] = '#';
    rect(5, 7, 25, 19); for (const [x, y] of [[5, 7], [25, 7], [5, 19], [25, 19], [6, 19], [24, 19]]) g[y][x] = '#';
    // the lava channel across the cavern's north, the bridge's tiles, the far landing
    rect(1, 3, 29, 6, '~'); for (let y = 3; y <= 6; y++) for (let x = 12; x <= 17; x++) g[y][x] = 'b'; rect(9, 0, 21, 2); g[1][15] = 'E'; g[1][11] = 'F';
    // the causeway (reservoir, T, elbows, straights, basins), three tiles apart
    g[8][15] = 'Q'; g[11][15] = 'J'; g[11][12] = 'K'; g[11][18] = 'k'; g[14][12] = 'I'; g[14][18] = 'V'; g[17][12] = 'U'; g[17][18] = 'u';
    // the brood's places
    g[39][11] = 'a'; g[39][20] = 'a'; g[29][15] = 'c'; g[26][7] = 'w'; g[24][11] = 'n'; g[24][20] = 'n'; g[23][15] = 'n';
    // crystals on the chambers' walls, frost machinery in the cavern
    for (const [x, y] of [[6, 39], [25, 44], [3, 25], [27, 30], [9, 47], [21, 47]]) if (g[y][x] === '#') g[y][x] = 'C';
    for (const [x, y] of [[6, 37], [24, 37], [4, 29], [26, 25], [12, 33], [18, 34]]) if (g[y][x] === '#') g[y][x] = 'O';
    for (const [x, y] of [[8, 45], [22, 38], [5, 31], [26, 29]]) if (g[y][x] === '#') g[y][x] = 'Z';
    for (const [x, y] of [[4, 15], [26, 15]]) g[y][x] = 'P'; g[10][4] = 'W'; g[10][26] = 'W'; g[19][9] = 'W'; g[19][21] = 'W';
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
    // the brood, in order: slugs (start); a crawler, then a lone wisp; then one of each together
    const P1 = [], P2 = [], P3 = [];
    for (const p of tilesOf(M, 'a')) spawnAt(X, 'cinderslug', p, P1, 901, false);
    const crawlerAt = mk.c[0], wispAt = mk.w[0];
    function wave2() { S.step2 = 1; spawnAt(X, 'basaltcrawler', crawlerAt, P2, 902, false); }
    function wisp2() { S.step2 = 2; const m = spawnAt(X, 'emberwisp', wispAt, P2, 903, true); X.ring(m.x, m.y, 0.2, 1.6, 0.4, P.LAVA_HI, 0.4); X.banner('AN EMBER WISP', 'One slow ember, then a long rest: strike while it recovers', P.LAVA_HI, 2.4, true); }
    function wave3() { S.step2 = 3; const ts = ['cinderslug', 'basaltcrawler', 'emberwisp']; tilesOf(M, 'n').forEach((p, i) => { const m = spawnAt(X, ts[i % 3], p, P3, 904, true); X.boom(m.x, m.y, 0.9, P.LAVA, P.ASH, { n: 10, shake: 2 }); }); X.banner('THE HOLLOW STIRS', 'All three together now: crawlers first from behind, wisps between their embers', P.LAVA_HI, 2.6, true); }
    wave2();
    const brood = () => P1.concat(P2, P3);
    // the hatch to the maintenance cavern (cool iron, a snowflake): open once the hollows are clear
    const hatch = doorway(X, H, tilesOf(M, 'h'), (c, Xs, Ys, T, D) => hatchArt(c, Xs, Ys, T, D), { kind: 'calhatch' });
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
    const closestUse = () => { let b = null, bd = 1e9; for (const q of pieces.concat([{ id: 'Q', x: R0.x, y: R0.y }])) { const d = Math.hypot(me.x - q.x, me.y - q.y); if (d < bd) { bd = d; b = q; } } return b; };
    function turn(pc) { if (S.latched || S.surge > 0 || closestUse() !== pc) return; S.rot[pc.id] = ((S.rot[pc.id] || 0) + 1) % 4; S.turns++; pc.flash = 0.4; S.flow = causewayFlow(S.rot);
      if (X.sfx.thud) X.sfx.thud(); if (X.sfx.hiss) X.sfx.hiss(0.15, 0.06, 2400);
      if (S.flow.fed.has(pc.id)) chime(X, 1046 + 120 * S.flow.fed.size, 0.25); }
    // the valve: lit when both basins have filled; the pet releases the frost
    const valve = H.obj({ x: R0.x, y: R0.y, kind: 'calreservoir', r: 1.0, h: 3.2, label: () => S.latched ? '' : S.primed ? 'RELEASE THE FROST' : S.entered ? 'FROST RESERVOIR' : '',
      draw(c, Xs, Ys, T) { reservoirArt(c, Xs, Ys, T); }, use() { const cq = closestUse(); if (cq && cq.id !== 'Q') return; if (!S.primed || S.surge > 0 || S.latched) { if (!S.latched && S.entered) X.text(R0.x, R0.y - 2.6, 'Both basins must flow first', P.FROST_HI, 13); return; } release(); } });
    function release() { S.surge = 0.001; me.sq = 1; X.ring(R0.x, R0.y, 0.3, 3.2, 0.6, P.FROST_HI, 0.55); X.flash(0.2, '#E8F8FF'); FROST_CHIME(X); if (X.sfx.whoosh) X.sfx.whoosh();
      X.text(me.x, me.y - 1.5, 'Frost released!', P.FROST_HI, 16); for (let i = 0; i < 12; i++) X.part({ kind: 'glow', x: R0.x + (Math.random() - 0.5) * 1.6, y: R0.y - 0.5 - Math.random(), vx: (Math.random() - 0.5) * 2, vy: -1.5 - Math.random() * 2, life: 0.8, max: 0.8, size: 6, color: P.FROST_HI }); }
    function latch() { if (S.latched) return; S.latched = true; S.done = true; self.done = true; bridgeT.forEach(t => X.setTile(t.tx, t.ty, T_BRIDGE)); X.retile(); X.shake(5, 0.5); if (X.sfx.crash) X.sfx.crash();
      H.setExit(E.x, E.y, 'To Fire Flan'); X.banner('THE FROZEN CAUSEWAY HOLDS', 'Both halves of the obsidian bridge have set for good: Fire Flan\'s chamber lies beyond', P.FROST_HI, 3.2, true, true); if (X.sfx.fanfare) X.sfx.fanfare(); }
    const shrine = station(X, H, F0, P, 'Fire Flan');
    // the islands' crystal clusters, the cavern's frost machinery
    for (const p of tilesOf(M, 'P')) H.obj({ x: p.x, y: p.y + 0.45, kind: 'calfrostpipe', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { frostMachineArt(c, Xs, Ys, T, p.x < HO_CX); } });
    X.after(1.0, () => { S.intro = false; X.banner('THE ASHEN HOLLOWS', 'Down from the ledge: through the hollows to the cooler cavern below', P.LAVA_HI, 3.2, true, true); });
    const cavern = () => me.y < 21 && me.y > 7;
    const missing = () => { // the first piece along the routes that is turned wrong
      for (const id of CW_ORDER) if (!cwRight(S.rot, id)) return byId[id]; return null; };
    const routePts = side => { const ids = side ? ['Q', 'J', 'k', 'V', 'u'] : ['Q', 'J', 'K', 'I', 'U']; return ids.map(id => cell(id)); };
    return { S, pieces, hatch, lava, shrine, P1, P2, P3, brood, causewayFlow, cwSolved, cwRight, missing, release, turn, CW_CELLS,
      cam() { const k = cavern() ? 0.45 : 0.2, fy = cavern() ? 10.5 : me.y - 3; return { x: me.x * (1 - k) + HO_CX * k + 0.5 * k, y: me.y * (1 - k) + fy * k, k: 0, zoom: 0.56 }; },
      update(dt) { lava.tick(dt); hatch.tick(dt); shrine.tick(dt); for (const pc of pieces) { pc.flash = Math.max(0, pc.flash - dt); const want = (S.rot[pc.id] || 0) * Math.PI / 2; let d = want - pc.ang; while (d < -Math.PI) d += TAU; while (d > Math.PI) d -= TAU; pc.ang += d * Math.min(1, dt * 10); }
        S.mist += dt; if (S.intro) return;
        // the brood's order
        if (S.step2 === 1 && !alive(P2).length) wisp2(); else if (S.step2 === 2 && !alive(P2).length) wave3();
        if (S.step2 === 3 && !alive(brood()).length && !hatch.open) { hatch.open1(); X.banner('THE HOLLOWS ARE CLEAR', 'The maintenance hatch grinds open: the cool cavern lies below', P.FROST_HI, 2.6, true); FROST_CHIME(X); }
        if (!S.entered && hatch.open && me.y < 19.5) { S.entered = true; S.cavT = 0; X.banner('THE FROZEN CAUSEWAY', 'Turn the conduits so the reservoir\'s frost reaches BOTH basins at once', P.FROST_HI, 3.6, true, true); FROST_CHIME(X); }
        if (S.entered && !S.latched) { S.cavT += dt; if (!S.hint && S.cavT > HO_HINT_AFTER) { S.hint = true; S.hintShown = g.t; X.banner('A HINT', 'The traced line shows the piece that breaks the flow', P.FROST_HI, 2.4, true); } }
        // the basins fill while their branch flows, and drain when it stops
        const f = S.flow; for (let i = 0; i < 2; i++) S.fill[i] = clamp(S.fill[i] + (f.basins[i] ? dt / 1.2 : -dt / 2.5), 0, 1);
        const prim = S.fill[0] >= 1 && S.fill[1] >= 1 && f.basins[0] && f.basins[1]; if (prim && !S.primed && !S.latched) { S.primed = true; FROST_CHIME(X); X.banner('BOTH BASINS ARE COLD', 'Now release the frost at the reservoir', P.FROST_HI, 2.4, true); } else if (!prim && S.surge <= 0) S.primed = false;
        if (S.surge > 0 && !S.latched) { S.surge += dt / 1.3; if (S.surge >= 1) { S.solid = Math.min(1, S.solid + dt / 1.0); if (S.solid >= 1) latch(); } }
        if (S.latched) S.solid = 1; },
      goal() { if (S.latched) return 'To Fire Flan'; if (S.intro) return 'The Ashen Hollows';
        if (!hatch.open) { const n = alive(brood()).length; return n ? `Clear the hollows · ${n} left` : 'Clear the hollows'; }
        if (!S.entered) return 'Down to the maintenance cavern';
        if (S.surge > 0) return 'The frost surges: the bridge is setting';
        if (S.primed) return 'Both basins are cold · release the frost at the reservoir';
        const nb = S.flow.basins.filter(Boolean).length; return `Frost to both basins · ${nb}/2 flowing · stand at a conduit to turn it`; },
      hint() { if (S.latched || S.intro) return null; if (!hatch.open) { const m = alive(brood())[0]; return m && Math.hypot(m.x - me.x, m.y - me.y) > 9 ? { x: m.x, y: m.y, h: 1.3, label: 'THE BROOD' } : null; }
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
        if (S.surge > 0 && S.surge < 1.6) glow(c, X.sx(R0.x), X.sy(R0.y) - T, T * 4 * (1 - Math.abs(S.surge - 0.5)), '#E8F8FF', 0.5); },
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
  CAL_STAGES.HOLLOWS = { name: 'The Ashen Hollows', goal: 'Through the hollows, then cool the causeway', how: 'From a sheltered ledge over the lava, down through two hollows: two cinder slugs first, then a basalt crawler (strike its glowing rear, not its plates) and a lone ember wisp, then one of each together. Lava runnels cross the floor: touching one burns a little and puts you back on safe ground. Below, the cool maintenance cavern: a lava channel blocks the door to Fire Flan. Stand at a conduit for a moment to turn it 90 degrees: the frost runs from the reservoir through a T-junction, two elbows and two straights to two cooling basins (a broken branch only mists). Fill BOTH basins at once, then stand at the reservoir to release the frost: both halves of the obsidian bridge set for good. A hint traces the missing connection after a while. A frost shrine beyond restores your pet.',
    layout: HO_LAYOUT, legend: { E: {}, F: {}, b: { tile: T_GAP }, r: {}, h: {}, Q: {}, J: {}, K: {}, k: {}, I: {}, V: {}, U: {}, u: {}, a: {}, c: {}, w: {}, n: {}, P: { tile: T_SOLID },
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
  const FO_W = 33, FO_H = 60, FO_CX = 16;
  const FO_LAYOUT = (() => { const g = grid(FO_W, FO_H, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    // lava under everything between the halls (the forge's floor far below the walkways)
    rect(1, 15, 31, 58, '~');
    // the entry gallery (start), the walkways, the two forge halls
    rect(9, 52, 23, 58); g[56][16] = 'S'; rect(14, 46, 18, 51, 'g');
    rect(4, 35, 28, 45); for (const [x, y] of [[4, 35], [28, 35], [4, 45], [28, 45]]) g[y][x] = '~'; rect(14, 30, 18, 34, 'g');
    rect(4, 18, 28, 29); for (const [x, y] of [[4, 18], [28, 18], [4, 29], [28, 29]]) g[y][x] = '~'; rect(14, 15, 18, 17, 'g');
    // grated bays over lava inside the halls (the floor's own grates)
    rect(7, 39, 10, 41, 'g'); rect(22, 39, 25, 41, 'g'); rect(8, 22, 11, 24, 'g'); rect(21, 22, 24, 24, 'g');
    // the ring hall, the pressure door (three rings on it), the landing beyond
    rect(4, 5, 28, 14); rect(12, 3, 20, 4, 'D'); rect(10, 0, 22, 2); g[1][16] = 'E'; g[1][12] = 'F';
    g[11][10] = 'A'; g[11][16] = 'B'; g[11][22] = 'C'; g[13][6] = 'Z'; g[13][26] = 'L';
    // pressure vessels (solid), the brood's places
    for (const [x, y] of [[6, 37], [26, 37], [6, 43], [26, 43], [6, 20], [26, 27]]) g[y][x] = 'V';
    for (const [x, y] of [[3, 40], [29, 40], [3, 23], [29, 24]]) g[y][x] = 'K'; for (const [x, y] of [[8, 34], [24, 34], [9, 17], [23, 17], [11, 46], [21, 47]]) g[y][x] = 'H';
    for (const [x, y] of [[3, 6], [29, 6], [3, 13], [29, 13]]) g[y][x] = 'R'; g[4][8] = 'K'; g[4][24] = 'K'; g[7][6] = 'V'; g[7][26] = 'V'; g[44][9] = 'N'; g[28][23] = 'N';
    g[38][12] = 'a'; g[38][20] = 'a'; g[26][10] = 'c'; g[21][16] = 'n'; g[20][11] = 'n'; g[20][21] = 'n';
    // the giant suspended rings and machinery in the lava beside the walkways
    for (const [x, y] of [[10, 49], [22, 48], [10, 32], [22, 33]]) g[y][x] = 'O';
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
    const gr = grates(X, tilesOf(M, 'g'), P);
    // the brood: two furnace imps; a runic sentinel alone; then the ordinary pack with the bomb lesson
    const P1 = [], P2 = [], P3 = []; for (const p of tilesOf(M, 'a')) spawnAt(X, 'furnaceimp', p, P1, 911, false);
    spawnAt(X, 'runicsentinel', mk.c[0], P2, 912, false);
    const bomb = bombLesson(X, P);
    function wave3() { S.step = 1; const sp = tilesOf(M, 'n').sort((a, b) => a.x - b.x); spawnAt(X, 'furnaceimp', sp[0], P3, 913, true); spawnAt(X, 'runicsentinel', sp[2], P3, 913, true);
      X.banner('A BOMB LARVA', 'It lands and flashes. While its ring is gold, hit it: the bomb flies back at your foes', P.RUNE_HI, 3, true);
      X.after(1.4, () => { S.lesson = true; const m = bomb.spawn({ x: sp[1].x, y: sp[1].y - 1 }, 913); P3.push(m); }); }
    const brood = () => P1.concat(P2, P3);
    // the pressure door, its three rings and inscription
    const door = doorway(X, H, tilesOf(M, 'D'), (c, Xs, Ys, T, D) => doorArt(c, Xs, Ys, T, D), { kind: 'calringdoor' });
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
    return { S, levers, door, bomb, shrine, P1, P2, P3, brood, ringsPlan, pull, reset, showNext, RR_LEVERS,
      cam() { const ring = me.y < 17; const k = ring ? 0.35 : 0.15, fy = ring ? 9 : me.y - 3; return { x: me.x * (1 - k) + (FO_CX + 0.5) * k, y: me.y * (1 - k) + fy * k, k: 0, zoom: 0.56 }; },
      update(dt) { door.tick(dt); shrine.tick(dt); bomb.tick(dt);
        for (const L of levers.concat([resetL])) { L.k = Math.max(0, L.k - dt * 1.6); L.flash = Math.max(0, L.flash - dt); }
        for (let i = 0; i < 3; i++) { S.flash[i] = Math.max(0, S.flash[i] - dt); const want = S.rings[i] * TAU / 3; let d = want - S.ang[i]; while (d < -Math.PI) d += TAU; while (d > Math.PI) d -= TAU; S.ang[i] += d * Math.min(1, dt * 7); }
        // nearing a lever lights the two rings it turns
        S.near = null; let bd = 2.6; for (const L of levers) { const d = Math.hypot(me.x - L.x, me.y - L.y); if (d < bd) { bd = d; S.near = L.id; } }
        if (S.solved && !S.opened) { S.iris = Math.min(1, S.iris + dt / 2.2); if (S.iris >= 1) open(); }
        if (S.opened) { S.beatT -= dt; if (S.beatT <= 0) { S.beatT = 1.35; S.beat = 1; if (X.sfx.note) { X.sfx.note(52, 0.22, 'sine', 0.55, 38); X.sfx.note(48, 0.2, 'sine', 0.4, 34, 0.24); } } S.beat = Math.max(0, S.beat - dt * 2.2); }
        if (S.intro) return;
        if (S.step === 0 && !alive(P2).length) wave3();
        if (S.solved && S.opened && !self.done && !alive(brood()).length && (bomb.st === 'done' || !bomb.m)) { self.done = true; H.setExit(E.x, E.y, 'To the Bomb King'); X.banner('THE FOUNDRY IS YOURS', 'The door stands open: the frost shrine beyond, then the Bomb King', P.RUNE_HI, 2.6, true); } },
      goal() { if (self.done) return 'To the Bomb King'; if (S.intro) return 'The Runebound Foundry'; const n = alive(brood()).length;
        if (bomb.st === 'ground' && bomb.safe()) return `Return the bomb · hit it while its ring is ${bomb.own ? 'gold' : 'green'}`;
        if (S.solved && !S.opened) return 'The rings align…';
        if (S.solved) return n ? `The door is open · defeat the last ${n}` : 'Through the door';
        if (me.y < 17) { const h = wantHint(); return `Set the rings to EYE · CHAIN · CROWN${h ? ` · next: lever ${h}` : ''}${n ? ` · ${n} foes left` : ''}`; }
        return n ? `Cross the foundry · ${n} foes left` : 'On to the pressure door'; },
      hint() { if (self.done || S.intro) return null; if (bomb.st === 'ground' && bomb.safe() && bomb.m) return { x: bomb.m.x, y: bomb.m.y, h: 1.6, label: 'RETURN IT' };
        const h = wantHint(); if (h) { const L = S.lever[h]; return { x: L.x, y: L.y, h: 2.5, label: `LEVER ${h}` }; }
        if (!S.solved && me.y > 17 && !alive(brood()).length) return { x: FO_CX + 1.5, y: 12, h: 1.2, label: 'THE DOOR' }; return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, lw = lwOf(T); gr.drawGround(c); bomb.drawGround(c);
        // the physical lines: from each lever across the floor to the door's foot under each of its two rings (and up the door, drawn with it)
        for (const L of levers) { const v = RR_LEVERS[L.id], on = S.near === L.id || wantHint() === L.id, col = RR_COL[L.id];
          for (let i = 0; i < 3; i++) if (v[i]) { const li = ['A', 'B', 'C'].indexOf(L.id), off = (li - 1) * 0.28, x1 = ringX(i) + off, y1 = door.y1 + 0.3, yr = L.y - 1.4 - li * 0.6, pts = [[X.sx(L.x + off), X.sy(L.y - 0.3)], [X.sx(L.x + off), X.sy(yr)], [X.sx(x1), X.sy(yr)], [X.sx(x1), X.sy(y1)]];
            c.save(); c.lineJoin = 'round'; poly(c, pts); c.strokeStyle = P.INK; c.lineWidth = T * 0.2 + lw; c.stroke(); c.strokeStyle = P.IRON; c.lineWidth = T * 0.2; c.stroke(); c.strokeStyle = rgba(col, on ? 1 : 0.55); c.lineWidth = Math.max(2, T * (on ? 0.09 : 0.06)); c.stroke();
            if (on && !lowFx()) { c.setLineDash([T * 0.14, T * 0.3]); c.lineDashOffset = -t * T * 2; c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(2, T * 0.05); c.stroke(); c.setLineDash([]); } c.restore(); } } },
      drawOver(c) { const T = X.Tz(), t = g.t;
        // the forge's rune light and the lava's glow, over the dark
        if (!lowFx()) for (const L of levers) if (S.near === L.id || wantHint() === L.id) glow(c, X.sx(L.x), X.sy(L.y) - T * 1.2, T * 1.4, RR_COL[L.id], 0.35);
        if (S.opened) { const k = S.beat; glow(c, X.sx(E.x), X.sy(E.y) - T, T * (3 + k * 1.5), P.LAVA, 0.25 + 0.35 * k); } } };
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
    function doorArt(c, Xs, Ys, T, D) { const lw = lwOf(T), t = g.t, w = (D.x1 - D.x0) * T, L = Xs - w / 2, H0 = T * 4.6, top = Ys - H0, open = D.k;
      c.save();
      // the frame: basalt jambs and a lintel carved with the inscription
      c.fillStyle = P.BASALT_D; c.fillRect(L - T * 0.9, top - T * 1.2, T * 0.9, H0 + T * 1.2); c.fillRect(L + w, top - T * 1.2, T * 0.9, H0 + T * 1.2); c.strokeStyle = P.INK; c.lineWidth = lw; c.strokeRect(L - T * 0.9, top - T * 1.2, T * 0.9, H0 + T * 1.2); c.strokeRect(L + w, top - T * 1.2, T * 0.9, H0 + T * 1.2);
      c.fillStyle = P.BASALT_HI; c.fillRect(L - T * 0.9, top - T * 1.25, w + T * 1.8, T * 1.05); c.strokeRect(L - T * 0.9, top - T * 1.25, w + T * 1.8, T * 1.05);
      for (let i = 0; i < 3; i++) { const gx = Xs + (i - 1) * T * 2.4; glyph(c, gx - T * 0.45, top - T * 0.72, T * 0.26, RR_TARGET[i], P.RUNE_HI, Math.max(1.5, T * 0.05)); label(c, RUNE_NAMES[RR_TARGET[i]], gx + T * 0.4, top - T * 0.62, T * 0.2, P.RUNE_HI); if (i < 2) label(c, '—', gx + T * 1.2, top - T * 0.62, T * 0.2, P.RUNE_HI); }
      // beyond the door: the dark, a heartbeat's glow
      c.fillStyle = '#0B0605'; c.fillRect(L, top, w, H0); if (open > 0) { const gg = c.createRadialGradient(Xs, Ys - H0 * 0.4, 0, Xs, Ys - H0 * 0.4, w * 0.6); gg.addColorStop(0, rgba(P.LAVA, 0.5 + 0.4 * S.beat)); gg.addColorStop(1, rgba(P.LAVA_D, 0)); c.fillStyle = gg; c.fillRect(L, top, w, H0); }
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
      if (!D.open && !S.solved) label(c, 'THE PRESSURE DOOR', Xs, top - T * 1.55, T * 0.24, P.RUNE_HI); }
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
  CAL_STAGES.FOUNDRY = { name: 'The Runebound Foundry', goal: 'Cross the forge and open the pressure door', how: 'Grated walkways cross the lava into an ancient forge. Two furnace imps throw slow embers and back off; a runic sentinel guards behind its shield until it attacks, then shows a glowing rune (strike that). Then a bomb larva: it lands with a ring round it. While the ring is gold, hit the grounded bomb with any attack and it flies back into a monster (it never hurts your pet); once it flashes red, get clear. The pressure door has three rings, each showing Eye, Chain or Crown; the inscription above reads EYE, CHAIN, CROWN. Lever A turns the left and middle rings one step, B the middle and right, C the left and right (stand beside a lever to pull it: its two rings light as you near it). The reset lever sets every ring back to Eye; the lectern shows the next move from wherever the rings are now. No penalty for wrong turns. Solved, the rings close into an iris and the door opens.',
    layout: FO_LAYOUT, legend: { E: {}, F: {}, g: {}, D: {}, A: {}, B: {}, C: {}, Z: {}, L: {}, a: {}, c: {}, n: {}, O: { tile: T_GAP },
      V: { tile: T_SOLID, get prop() { return DunWorld.PROPS.vessel ? 'vessel' : undefined; } }, K: PROP('forge', 'boiler'), H: PROP('chains', 'pipe'), R: PROP('metalring', 'gear'), N: PROP('anvil', 'drum') }, make: makeFoundry, plan: ringsPlan, levers: RR_LEVERS, target: RR_TARGET };

  /* ======================= THE HEARTWARD DESCENT ======================= */
  /* rows from the top: the lava lake round Ifrit's throne · the overlook (door, shrine) · the approach · ledge 2 · causeway 2 ·
     ledge 1 · causeway 1 · ledge 0 (start). The causeways cross the cathedral's drop; the ledges are broad and cool */
  const DE_W = 31, DE_H = 72, DE_CX = 15;
  const DE_LEDGES = [{ y0: 64, y1: 70, back: [15, 66] }, { y0: 42, y1: 51, back: [15, 49] }, { y0: 20, y1: 29, back: [15, 27] }];
  const DE_LAYOUT = (() => { const g = grid(DE_W, DE_H, '#'); const rect = (x0, y0, x1, y1, ch) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch || '.'; };
    rect(1, 0, 29, 9, '~'); rect(3, 10, 27, 63, '~');
    // the overlook and the approach; the ledges (their corners broken off into the drop); the causeways
    rect(7, 10, 23, 14); g[11][15] = 'E'; g[12][10] = 'F'; rect(12, 15, 18, 19);
    for (const L of DE_LEDGES) { rect(L.y0 === 64 ? 6 : 4, L.y0, L.y0 === 64 ? 24 : 26, L.y1); }
    for (const [x, y] of [[4, 20], [26, 20], [4, 29], [26, 29], [4, 42], [26, 42], [4, 51], [26, 51], [6, 64], [24, 64], [6, 70], [24, 70]]) g[y][x] = '~';
    rect(13, 52, 17, 63); rect(13, 30, 17, 41); g[68][15] = 'S';
    // the vents (each lane: centre at its foot, then west, then east), the slag barricades, the groups
    for (const [x, y] of [[15, 61], [14, 58], [16, 55], [15, 39], [14, 36], [16, 33]]) g[y][x] = 'v';
    for (let x = 13; x <= 17; x++) g[41][x] = 'X'; for (let x = 12; x <= 18; x++) g[19][x] = 'Y';
    g[45][10] = 'k'; g[45][20] = 'k'; g[23][15] = 'j'; g[22][8] = 'q'; g[22][22] = 'q';
    // basalt columns on the ledges, black crystals growing toward the throne, hanging slabs over the drop
    for (const [x, y] of [[5, 44], [25, 44], [5, 23], [25, 23], [7, 66], [23, 66], [8, 11], [22, 11]]) g[y][x] = 'H';
    for (const [x, y] of [[6, 49], [24, 48], [6, 27], [24, 26], [8, 69], [22, 69], [13, 16], [17, 16]]) if (g[y][x] === '.') g[y][x] = 'C';
    for (const [x, y] of [[8, 57], [22, 59], [9, 35], [21, 33], [7, 16], [23, 17]]) g[y][x] = 'O';
    for (const [x, y] of [[3, 46], [27, 47], [3, 24], [27, 25], [5, 66], [25, 67]]) g[y][x] = 'L'; for (const [x, y] of [[5, 21], [25, 28]]) g[y][x] = 'G';
    return g.map(r => r.join('')); })();
  const DE_VENT = { idle: 1.6, warn: 1.9, erupt: 0.8, cool: 0.9 }, DE_VENT_R = 1.3;
  function makeDescent(X, self, H) {
    const M = X.M, me = X.me, g = X.g, mk = M.marks, P = pal(), E = mk.E[0];
    const S = { intro: true, ledge: 0, demo: 0, lane: [false, false], falls: 0, hits: 0, open: [false, false], awake: [false, false], done: false, breath: 0 };
    const ledgeOf = y => { for (let i = 0; i < DE_LEDGES.length; i++) { const L = DE_LEDGES[i]; if (y >= L.y0 + 1 && y <= L.y1 + 2) return i; } return -1; };
    const backOf = i => Wp(DE_LEDGES[i].back[0], DE_LEDGES[i].back[1]);
    // the vents: each runs idle -> warn (glow and hiss) -> erupt -> cool; a lane's vents roll from its foot to its head
    const vents = tilesOf(M, 'v').sort((a, b) => b.y - a.y).map((p, i) => ({ i, x: p.x, y: p.y, lane: i < 3 ? 0 : 1, ph: 'idle', t: 0, off: (i % 3) * 1.45, hitDone: false, erupts: 0, live: false, demo: false }));
    const ventT = DE_VENT.idle + DE_VENT.warn + DE_VENT.erupt + DE_VENT.cool;
    function ventTick(v, dt) { if (!v.live && !v.demo) { v.ph = 'idle'; return; } v.t += dt; const L = v.demo ? { idle: 0.6, warn: 2.4, erupt: 0.9, cool: 1 } : DE_VENT, a = L.idle, b = a + L.warn, c2 = b + L.erupt, d = c2 + L.cool;
      const ph0 = v.ph; v.ph = v.t < a ? 'idle' : v.t < b ? 'warn' : v.t < c2 ? 'erupt' : 'cool'; v.k = v.ph === 'warn' ? (v.t - a) / L.warn : v.ph === 'erupt' ? (v.t - b) / L.erupt : 0;
      if (v.ph === 'warn' && ph0 !== 'warn') { if (Math.hypot(me.x - v.x, me.y - v.y) < 11 && X.sfx.hiss) X.sfx.hiss(L.warn * 0.9, 0.12, 1800); X.warn({ x: v.x, y: v.y, r: DE_VENT_R, life: L.warn, max: L.warn, color: P.WARN }); }
      if (v.ph === 'erupt' && ph0 !== 'erupt') { v.erupts++; v.hitDone = false; if (Math.hypot(me.x - v.x, me.y - v.y) < 12) { X.shake(3, 0.25); if (X.sfx.crash) X.sfx.crash(); } X.boom(v.x, v.y - 0.3, 1.0, P.LAVA, P.LAVA_HI, { n: 14, shake: 0 }); }
      if (v.ph === 'erupt' && v.k < 0.45 && !v.demo) { if (!v.hitDone && !me.dead && Math.hypot(me.x - v.x, me.y - v.y) < DE_VENT_R + (me.r || 0.35) * 0.5) { v.hitDone = true; S.hits++; const C = CALR();
          if (C && typeof C.fall === 'function') { if (!me.dodge && !(me.inv > 0) && !me.dash) { X.boom(me.x, me.y, 1.0, P.LAVA, '#FFFFFF', { n: 10, shake: 4 }); X.text(me.x, me.y - 1.3, 'Thrown off the causeway!', P.WARN, 15); S.falls++; C.fall(X, { k: 0.1, text: 'Back on the ledge' }); me.inv = Math.max(me.inv || 0, 1.2); } }
          else if (X.hurtPet(X.ST().hp * 0.1, null, { vent: true })) fall(v); }
        for (const m of X.mons) if (!m.dead && !m.vented && Math.hypot(m.x - v.x, m.y - v.y) < DE_VENT_R + m.r * 0.5) { m.vented = true; X.hitMon(m, m.maxhp * 0.3, { flat: true, src: 'hazard' }); X.after(1, () => { m.vented = false; }); } }
      if (v.t >= d) { v.t = 0; if (v.demo) { v.demo = false; S.demo = 2; X.banner('VENTS ERUPT', 'Each one glows and hisses first: cross when it is dark, or right behind its blast', P.LAVA_HI, 3, true); for (const q of vents) if (q.lane === 0) { q.live = true; q.t = -q.off; } } } }
    // an eruption throws you off the causeway: you land back on the last ledge (its damage the penalty)
    function fall(v) { S.falls++; const b = backOf(S.ledge); X.text(me.x, me.y - 1.3, 'Thrown off the causeway!', P.WARN, 15); X.boom(me.x, me.y, 1.0, P.LAVA, '#FFFFFF', { n: 10, shake: 4 });
      me.x = b.x; me.y = b.y; me.vx = me.vy = 0; me.inv = Math.max(me.inv || 0, 1.2); X.ring(b.x, b.y, 0.2, 1.6, 0.4, P.ASH, 0.4); X.text(b.x, b.y - 1.3, 'Back on the ledge', '#FFFFFF', 13); }
    // the barricades of cooling slag across the next causeway's foot, lifted when the ledge is clear
    const bars = [doorway(X, H, tilesOf(M, 'X'), (c, Xs, Ys, T, D) => slagArt(c, Xs, Ys, T, D), { kind: 'calslag' }), doorway(X, H, tilesOf(M, 'Y'), (c, Xs, Ys, T, D) => slagArt(c, Xs, Ys, T, D), { kind: 'calslag' })];
    // the two groups, asleep until you stand on their ledge
    const G1 = [], G2 = []; for (const p of tilesOf(M, 'k')) spawnAt(X, 'ashenknight', p, G1, 921, false);
    spawnAt(X, 'ashenknight', mk.j[0], G2, 922, false); for (const p of tilesOf(M, 'q')) spawnAt(X, 'crystalwisp', p, G2, 922, false);
    const groups = [G1, G2];
    const shrine = station(X, H, mk.F[0], P, 'Ifrit');
    // (columns, crystals and slabs: the core's props where it has them, else this file's own)
    const coreProps = !!DunWorld.PROPS.basaltcol;
    if (!coreProps) { for (const p of tilesOf(M, 'H')) H.obj({ x: p.x, y: p.y + 0.5, kind: 'calcolumn', r: 0.1, h: 3, label: '', draw(c, Xs, Ys, T) { columnArt(c, Xs, Ys, T, p.tx * 0.3 + p.ty * 0.7); } });
      for (const p of tilesOf(M, 'O')) H.obj({ x: p.x, y: p.y + 0.5, kind: 'calslab', r: 0.1, h: 4, label: '', draw(c, Xs, Ys, T) { slabArt(c, Xs, Ys, T, p.tx * 0.41 + p.ty * 0.07); } }); }
    for (const p of tilesOf(M, 'C')) { const ph = (p.tx * 0.37 + p.ty * 0.11) % 1, big = 1.4 + (DE_H - p.ty) / DE_H * 1.1; block(X, p.tx, p.ty); H.obj({ x: p.x, y: p.y + 0.4, kind: 'calcrystal', r: 0.1, h: 2, label: '', draw(c, Xs, Ys, T) { crystalArt(c, Xs, Ys, T * big, g.t, ph, P); } }); }
    X.after(1.0, () => { S.intro = false; X.banner('THE HEARTWARD DESCENT', 'Down the cathedral of the volcano\'s heart: two causeways, two ledges, then the throne', P.LAVA_HI, 3.2, true, true); });
    // the falls of lava down the cathedral: from under each ledge into the drop
    const FALLS = [[9.5, 52.5, 63.5], [22.5, 52.5, 63.5], [8.5, 30.5, 41.5], [23.5, 30.5, 41.5], [5.5, 10.5, 19.5], [25.5, 10.5, 19.5]];
    return { S, vents, bars, groups, G1, G2, shrine, fall, ledgeOf,
      cam() { const k = me.y < 19 ? 0.35 : 0, fy = me.y < 19 ? 9 : me.y; return { x: me.x * 0.75 + (DE_CX + 1.5) * 0.25, y: me.y * (1 - k) + fy * k - 1.5, k: 0, zoom: 0.54 }; },
      update(dt) { shrine.tick(dt); for (const b of bars) b.tick(dt); S.breath += dt; const L = ledgeOf(me.y); if (L >= 0 && (L !== S.ledge || !S.ledgeSet)) { S.ledge = L; S.ledgeSet = true; const C = CALR(), b = backOf(L); if (C && typeof C.setLedge === 'function') C.setLedge(X, b.x, b.y); }
        for (const v of vents) ventTick(v, dt);
        if (S.intro) return;
        // the safe demonstration: the first vent shows itself once, before anything else, while you are still on the ledge
        if (S.demo === 0 && (me.y < 67.5 || g.t > 4.5)) { S.demo = 1; const v = vents[0]; v.demo = true; v.t = 0; X.text(v.x, v.y - 1.6, 'Watch the vent…', P.LAVA_HI, 15); }
        // the groups wake on their ledge (and stay still till then), one at a time
        for (let i = 0; i < 2; i++) { const G = groups[i]; if (!S.awake[i]) { if (S.ledge === i + 1 && me.y < DE_LEDGES[i + 1].y1 + 1) { S.awake[i] = true; for (const m of G) if (!m.dead) m.aggro = true; X.banner(i ? 'A KNIGHT AND TWO CRYSTAL WISPS' : 'TWO ASHEN KNIGHTS', i ? 'The wisps fire one marked beam each: step off its line, then strike' : 'One slow combo each: wait it out, then strike', P.LAVA_HI, 2.6, true); } else for (const m of G) if (!m.dead) { m.aggro = false; m.vx = m.vy = 0; } }
          else if (!S.open[i] && !alive(G).length) { S.open[i] = true; bars[i].open1(); if (i === 0) for (const v of vents) if (v.lane === 1) { v.live = true; v.t = -v.off * 0.8; } X.banner(i ? 'THE LAST LEDGE IS CLEAR' : 'THE LEDGE IS CLEAR', i ? 'The slag gives way: the overlook and the throne lie above' : 'The slag gives way: the second causeway is open', P.LAVA_HI, 2.4, true); } }
        if (S.open[1] && !self.done) { self.done = true; H.setExit(E.x, E.y, 'To Ifrit\'s Throne'); } },
      goal() { if (self.done) return me.y < 15 ? 'To Ifrit\'s throne · rest at the shrine first' : 'Up to the overlook'; if (S.intro) return 'The Heartward Descent';
        const L = S.ledge; if (S.demo < 2) return 'Watch the vent: it glows and hisses, then erupts';
        if (L === 0) return 'Cross the causeway: pass each vent while it is dark';
        const i = L - 1, n = alive(groups[i]).length; if (n) return `Clear the ledge · ${n} left`; return 'Cross the next causeway: pass each vent while it is dark'; },
      hint() { if (self.done || S.intro) return null; const L = S.ledge; if (L >= 1) { const G = alive(groups[L - 1]); if (G.length) { const m = G[0]; return Math.hypot(m.x - me.x, m.y - me.y) > 8 ? { x: m.x, y: m.y, h: 1.4, label: 'FOES' } : null; } } return null; },
      drawGround(c) { const T = X.Tz(), t = g.t, Wd = X.W(), Hh = X.H();
        // the depths under the causeways: a dark shaft with a far red glow (reads as a drop, not as a floor)
        throneArt(c, T, t);
        for (const [x, y0, y1] of FALLS) lavafall(c, x, y0, y1, T, t);
        // the causeways' edges: cracked obsidian lips over the drop
        for (const [y0, y1] of [[52, 63], [30, 41]]) { const x0 = X.sx(14), x1 = X.sx(19), Y0 = X.sy(y0 + 1), Y1 = X.sy(y1 + 2); if (Y1 < 0 || Y0 > Hh) continue; c.save(); c.fillStyle = 'rgba(10,6,8,.55)'; c.fillRect(x0 - T * 0.25, Y0, T * 0.25, Y1 - Y0); c.fillRect(x1, Y0, T * 0.25, Y1 - Y0); c.strokeStyle = rgba(P.LAVA, 0.45); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x0 - T * 0.25, Y0); c.lineTo(x0 - T * 0.25, Y1); c.moveTo(x1 + T * 0.25, Y0); c.lineTo(x1 + T * 0.25, Y1); c.stroke(); c.restore(); }
        for (const v of vents) ventArt(c, v, T, t);
        gpu(c, Q => { for (const v of vents) { const Xs = X.sx(v.x), Ys = X.sy(v.y); if (Ys < -T * 6 || Ys > Hh + T * 2) continue; if (v.ph === 'warn') Q.ground(Xs, Ys, T * DE_VENT_R * (0.6 + 0.5 * v.k), 0.5 + 0.5 * v.k, 0.5 + 0.5 * v.k, v.i * 1.7, 0.55, 1); } }); },
      drawOver(c) { const T = X.Tz(), t = g.t, Hh = X.H();
        // the eruptions: columns of fire (GPU tongues and fire balls where it can; a 2D column otherwise), drawn over everything
        const er = vents.filter(v => v.ph === 'erupt'); const used = er.length && gpu(c, Q => { for (const v of er) { const Xs = X.sx(v.x), Ys = X.sy(v.y), u = v.k, hgt = T * (2.4 + 2.6 * Math.sin(Math.min(1, u * 1.6) * Math.PI / 2)) * (1 - Math.max(0, u - 0.7) / 0.3 * 0.6);
            Q.tongue(Xs, Ys, T * 0.75, hgt, 0, 1.0, 0.95, v.i * 3.1); Q.tongue(Xs - T * 0.3, Ys, T * 0.45, hgt * 0.7, -0.15, 0.85, 0.8, v.i * 1.3); Q.tongue(Xs + T * 0.3, Ys, T * 0.45, hgt * 0.75, 0.15, 0.85, 0.8, v.i * 2.2); Q.fire(Xs, Ys - T * 0.3, T * 1.2, 1.0, 0.8 * (1 - u * 0.6), v.i); Q.glow(Xs, Ys, T * 2.6, P.LAVA, 0.6); } });
        if (!used) for (const v of er) { const Xs = X.sx(v.x), Ys = X.sy(v.y), u = v.k, hgt = T * (2.4 + 2.6 * Math.sin(Math.min(1, u * 1.6) * Math.PI / 2)) * (1 - Math.max(0, u - 0.7) / 0.3 * 0.6); c.save(); const gg = c.createLinearGradient(0, Ys - hgt, 0, Ys); gg.addColorStop(0, 'rgba(255,90,26,0)'); gg.addColorStop(0.3, 'rgba(255,140,40,.85)'); gg.addColorStop(1, 'rgba(255,240,190,.95)'); c.fillStyle = gg;
            c.beginPath(); c.moveTo(Xs - T * 0.7, Ys); for (let i = 0; i <= 8; i++) { const yy = Ys - hgt * i / 8, w = T * 0.7 * (1 - i / 9) * (0.85 + 0.25 * Math.sin(t * 20 + i * 1.7)); c.lineTo(Xs - w, yy); } for (let i = 8; i >= 0; i--) { const yy = Ys - hgt * i / 8, w = T * 0.7 * (1 - i / 9) * (0.85 + 0.25 * Math.sin(t * 17 + i * 2.1)); c.lineTo(Xs + w, yy); } c.closePath(); c.fill(); c.restore(); glow(c, Xs, Ys - hgt * 0.4, T * 2.2, P.LAVA, 0.6); }
        for (const v of vents) if (v.ph === 'warn') { const Xs = X.sx(v.x), Ys = X.sy(v.y); glow(c, Xs, Ys, T * (0.8 + v.k * 0.9), P.LAVA, 0.25 + 0.45 * v.k); if (Math.hypot(me.x - v.x, me.y - v.y) < 9) label(c, v.demo ? 'SAFE TO WATCH: IT GLOWS AND HISSES' : 'HISS', Xs, Ys - T * (1.2 + v.k * 0.5), T * 0.22, P.WARN); }
        if (!lowFx()) for (const [x, y0, y1] of FALLS) { const Y0 = X.sy(y0), Y1 = X.sy(y1); if (Y1 < 0 || Y0 > Hh) continue; glow(c, X.sx(x), (Y0 + Y1) / 2, T * 2.2, P.LAVA, 0.12); } } };
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
    function slagArt(c, Xs, Ys, T, D) { const w = (D.x1 - D.x0) * T, L = Xs - w / 2, hgt = T * 1.6 * (1 - D.k), t = g.t; if (hgt < 1) return; c.save();
      // a barricade of cooling slag: dark lumps, red seams, smoking
      for (let i = 0; i < Math.ceil(w / (T * 0.7)); i++) { const x = L + (i + 0.5) * T * 0.7, r = T * (0.45 + 0.12 * Math.sin(i * 2.7)), y = Ys - r * 0.6 - (1 - D.k) * 0 - (i % 2) * T * 0.25; ell(c, x, y - (T * 1.6 - hgt) * -0.4, r, r * 0.8 * (hgt / (T * 1.6))); const sg = c.createRadialGradient(x - r * 0.3, y - r * 0.4, r * 0.1, x, y, r); sg.addColorStop(0, '#5A4A44'); sg.addColorStop(1, '#1A1210'); c.fillStyle = sg; c.fill(); c.strokeStyle = P.INK; c.lineWidth = 1.5; c.stroke();
        c.strokeStyle = rgba(P.LAVA, 0.6 + 0.3 * Math.sin(t * 2 + i)); c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - r * 0.5, y); c.lineTo(x, y - r * 0.3); c.lineTo(x + r * 0.4, y + r * 0.1); c.stroke(); }
      c.restore(); if (!D.open) label(c, 'COOLING SLAG', Xs, Ys - T * 2.0, T * 0.2, '#FFD9B0'); }
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
  CAL_STAGES.DESCENT = { name: 'The Heartward Descent', goal: 'Down the cathedral to the throne', how: 'The forge gives way to a vertical cathedral of basalt columns, hanging obsidian slabs and lava pouring down the walls. Two short causeways cross the drop, each with vents: a vent glows and hisses for about two seconds before it erupts (the first one shows itself once, harmlessly). An eruption throws you off the causeway: you land back on the last ledge, a little hurt. Broad cool ledges lie between: two ashen knights on the first (one slow combo each), a knight and two crystal wisps on the second (each wisp fires one marked beam). A ledge\'s slag barricade gives way once it is clear. Last, the overlook: Ifrit seated far off on his throne. A frost shrine there restores your pet before you go in.',
    layout: DE_LAYOUT, legend: { E: {}, F: {}, v: {}, X: {}, Y: {}, k: {}, j: {}, q: {}, C: {},
      H: { tile: T_SOLID, get prop() { return DunWorld.PROPS.basaltcol ? 'basaltcol' : undefined; } }, O: { tile: T_GAP, get prop() { return DunWorld.PROPS.slabhang ? 'slabhang' : undefined; } }, L: PROP('lavafall', 'volrok'), G: PROP('bigcrystal', 'obsidian') }, make: makeDescent };

  try { if (typeof self !== 'undefined') self.__CAL_STAGES = CAL_STAGES; } catch (e) {}
})();
