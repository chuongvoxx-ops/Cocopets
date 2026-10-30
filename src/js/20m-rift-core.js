/* ---------- the Gaia rifts: hand-built dungeons across the world, each fourteen stages long ----------
   A rift is played as fourteen stages in a row in three sections (RIFT_SECTIONS below); the last boss seals the rift. Each stage is a floor of its own in the Tower's engine (20b), built from a drawn layout instead of rolled
   (genRift), with the stage's puzzle, objects and monsters run by a module of the rift's own (DunRift.create). Progress
   is a checkpoint: st.rift.prog[id] is the next stage to play, so a wipe restarts the stage, never the dungeon; the
   seal (st.rift.seals[id]) is kept for good and opens the rift's Anima gate (st.rift.gates[id]).
   RIFTS: the registry, each entry { id, n, name, lvl, sigil, biome, aff, gate: { anima, name }, stages: [six] }.
   A stage: { kind: 'section'|'boss', name, layout: [rows], legend: { ch: kind }, make(X) -> the stage's module }.
   Layout characters: # wall  . floor  ~ water (a gap)  = bridge  m shallows (mud)  S start  then any letter the
   legend names (an object standing on floor, or a monster pack) */
const RIFTS = [], RIFT_BY_ID = {};
function defRift(r) { RIFTS.push(r); RIFT_BY_ID[r.id] = r; return r; }
/* the Anima gates (the constellation trials), one per rift: RIFT_GATES[riftId] = { name, biome, goal, how, layout, legend, make } */
const RIFT_GATES = {};
function defGate(id, g) { RIFT_GATES[id] = g; }
/* a rift's fourteen stages, in three sections:
     1  dungeon > puzzle > dungeon > puzzle > boss
     2  dungeon > puzzle > dungeon > puzzle > boss
     3  dungeon (a boon on the monsters) > puzzle > dungeon (a curse on the party) > boss
   A dungeon stage is a floor of the Tower's engine: many packs of the rift's brood and a mini boss (one of the rift's
   lesser horrors). A boss stage is a Super Fiend-class fight */
const RIFT_SECTIONS = [['fight', 'puzzle', 'fight', 'puzzle', 'boss'], ['fight', 'puzzle', 'fight', 'puzzle', 'boss'], ['fight', 'puzzle', 'fight', 'boss']];
/* where stage i sits: { sec (1-based), n (its number among its kind in the section, 1-based) } */
function riftStagePos(Rf, i) { let sec = 1, fights = 0, puzzles = 0; for (let k = 0; k <= i; k++) { const S = Rf.stages[k]; const dun = S.kind === 'fight' || S.trial; if (k === i) return { sec, n: S.kind === 'boss' ? sec : dun ? fights + 1 : puzzles + 1 }; if (S.kind === 'boss') { sec++; fights = 0; puzzles = 0; } else if (dun) fights++; else puzzles++; } return { sec, n: 1 }; }
function riftStageLabel(Rf, i) { const S = Rf.stages[i], P = riftStagePos(Rf, i); return `Section ${P.sec} · ${S.kind === 'boss' ? 'Boss' : S.kind === 'fight' || S.trial ? 'Dungeon' : 'Puzzle'} ${P.n}`; }
/* riftSections(sections): sections = [{ fights: [name, name], minis: [bossId, ...], puzzles: [P, P], boss: fiendId, bossName, bossRoom, mobs, miniHp }]
   -> the fourteen stage entries. Section 3's two dungeons carry a rolled boon on the monsters and a rolled curse on the
   party (mod: 'boon' | 'curse', played by the Tower's floor rules) */
function riftSections(sections) {
  const out = [];
  sections.forEach((sec, si) => { const pat = sec.pattern || RIFT_SECTIONS[si] || RIFT_SECTIONS[0]; let fi = 0, pi = 0, ti = 0; for (const kind of pat) {
    if (kind === 'fight') { const mods = sec.mods || (si === 2 ? ['boon', 'curse'] : []); out.push({ kind: 'fight', biome: sec.biome, extra: sec.extra, name: sec.fights[fi] || `Section ${si + 1} dungeon ${fi + 1}`, mini: sec.minis ? sec.minis[fi % sec.minis.length] : null, goal: 'Clear the dungeon: every monster and its mini boss', mobs: sec.mobs, hpK: sec.miniHp, mod: mods[fi] || null }); fi++; }
    else if (kind === 'puzzle') { const P = sec.puzzles[pi] || sec.puzzles[0]; out.push(Object.assign({ biome: sec.biome }, P, { kind: 'puzzle' })); pi++; }
    // (a dungeon with a challenge of its own: drawn like a puzzle, fought like a dungeon, counted as one)
    else if (kind === 'trial') { const P = sec.trials[ti] || sec.trials[0]; out.push(Object.assign({ biome: sec.biome }, P, { kind: 'puzzle', trial: true })); ti++; }
    else out.push({ kind: 'boss', biome: sec.biome, name: sec.bossRoom || `Section ${si + 1} boss`, boss: sec.boss, goal: sec.bossName || sec.boss, seal: si === 2 }); } });
  return out;
}
/* which rift bosses (fiend-class: as the Tower's Super Fiends are) exist: RIFT_FIENDS[id] = the roster entry (as FIENDS) */
const RIFT_FIENDS = {};
function riftFiend(id, n) {
  const B = RIFT_FIENDS[id]; if (!B) return null;
  const lo = n < 50 ? Math.min(1, Math.max(0, (n - 10) / 30)) : -1, hk = n >= 50 ? Math.min(1, (n - 50) / Math.max(10, TOWER_TOP - 50)) : -1;
  const more = hk >= 0 ? Math.round(30 + 20 * hk) : Math.round(10 + 15 * lo), hit = hk >= 0 ? 1.5 + 0.5 * hk : 1.3;
  return Object.assign({}, B, { rift: true, bars: Math.round((Math.round(n / 5) + 2 + (B.extraBars || 0) + more) * (B.hpK || 1)),   // (B.hpK: a fiend tougher than its floor)
    baseBars: Math.round(n / 5) + 2, hardBars: more, hardK: hit, dmgK: (B.dmgK || 1) * hit, phases: B.phases || (n >= 90 ? 3 : n >= 60 ? 4 : 2), cycle: 0, rec: Math.min(DLV_MAX, n <= 50 ? 2 * n : Math.round(100 + (n - 50) / (TOWER_TOP - 50) * (DLV_MAX - 100))), lvK: 1 + (n / 10 - 1) * 0.06 });
}
/* the floor definition a stage plays as: the Tower's floorDef for the rift's level, with the rift's own land, brood and
   rules (no band rules, no Tower boss). Boss stages are Super Fiend floors: the same bars and blows as the Tower's
   fiend of that floor (the second boss three floors up, the third six) */
function riftDef(id, stage) {
  const Rf = RIFT_BY_ID[id], S = Rf.stages[stage], L = Rf.lvl, off = S.kind === 'boss' ? (riftStagePos(Rf, stage).sec - 1) * 3 : 0, n = Math.max(1, L + off);
  const F = Object.assign(floorDef(n), { act: 0, boss: S.kind === 'boss', biome: S.biome || Rf.biome, loop: 0, fiend: null, high: false, band: null, name: Rf.name, bossKind: BOSSES[0], bossName: S.goal || '', events: false, dark: BIOMES[S.biome || Rf.biome].dark || 0,
    rift: { id, stage, kind: S.kind, name: S.name, total: Rf.stages.length, seal: !!S.seal, mini: S.mini || null, miniHp: S.hpK || 2 } });
  // (a rift may be eased: its monsters', mini bosses' and fiends' health and blows scaled by Rf.ease)
  if (Rf.ease) { F.hpMul *= Rf.ease; F.dmgMul *= Rf.ease; F.monHp *= Rf.ease; F.monDmg *= Rf.ease; }
  // (Rf.scale: everything here, monsters, mini bosses and bosses, at that share of its health and blows, exactly once:
  // hpMul and dmgMul feed all of them, the monsters' monHp and monDmg on top of them, so those are left be)
  if (Rf.scale) { F.hpMul *= Rf.scale; F.dmgMul *= Rf.scale; }
  if (Rf.liveCap) F.liveCap = Rf.liveCap;
  if (Rf.typeShare) F.typeShare = Rf.typeShare;   // (types held to a share of the rolled monsters, at most three to a pack)   // (at most this many monsters on the field at once: the rest wait, unseen)
  // (and its ordinary monsters alone may be eased further: Rf.monEase scales their health and blows, not the bosses')
  if (Rf.monEase) { F.monHp *= Rf.monEase; F.monDmg *= Rf.monEase; }
  if (S.kind === 'fight') { const mobs = S.mobs || Rf.mons || []; Object.assign(F, { types: mobs.concat(mobs, F.types.filter(t => !mobs.includes(t) && !MON[t].still).slice(-3)), rooms: 7, pack: Math.max(F.pack, 10), packsPer: 3, maxMons: Math.max(F.maxMons, 90), elite: Rf.ease ? Math.min(F.elite, 0.3) : Math.max(F.elite, 0.45), nests: 0, gremlin: 0.3, shrines: 1, events: true }); if (S.mod === 'boon') F.band = 'rboon'; else if (S.mod === 'curse') F.band = 'rcurse'; else if (S.mod === 'random') F.band = 'rrand'; }
  else if (S.kind === 'boss') { const fd = riftFiend(S.boss, n); F.fiend = fd; F.boss = false; F.bossName = fd ? fd.name : S.goal; F.name = fd ? fd.name : Rf.name; F.events = false; F.dark = 0; }
  else { Object.assign(F, { rooms: 1, pack: 0, packsPer: 0, maxMons: 60, types: [], nests: 0, elite: 0, gremlin: 0, shrines: 0, hazards: false, traps: 0, stones: 0 }); }
  if (S.kind === 'fight' && Rf.monCount) { F.pack = Math.max(4, Math.round(F.pack * Rf.monCount)); F.maxMons = Math.round(F.maxMons * Rf.monCount); }   // (a rift's fight floors thinned: fewer to a pack, fewer in all)   // (kept OUT of the if/else chain above: inside it, every rift without monCount fell to the empty-floor branch)
  return F;
}
/* the map from a stage's drawn layout */
function genRift(F) {
  const Rf = RIFT_BY_ID[F.rift.id], S = F.rift.gate ? RIFT_GATES[F.rift.id] : Rf.stages[F.rift.stage], rows = S.layout, H0 = rows.length, W0 = Math.max(...rows.map(r => r.length));
  const MW = W0 + 2, MH = H0 + 2, N = MW * MH, bi = Math.max(0, BIOME_ORDER.indexOf(!F.rift.gate && S.biome || Rf.biome));
  const G = new Uint8Array(N).fill(T_SOLID), BI = new Uint8Array(N).fill(bi), RM = new Int16Array(N).fill(-1), marks = {}, props = new Map();
  let start = { x: 2.5, y: 2.5 };
  const T_OF = { '#': T_SOLID, '.': T_FLOOR, '~': T_GAP, '=': T_BRIDGE, m: T_MUD, i: T_ICE };
  for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
    const ch = rows[y][x] || '#', X = x + 1, Y = y + 1, i = Y * MW + X;
    if (ch in T_OF) { G[i] = T_OF[ch]; if (ch !== '#') RM[i] = 0; continue; }
    if (ch === 'S') { G[i] = T_FLOOR; RM[i] = 0; start = { x: X + 0.5, y: Y + 0.5 }; continue; }
    const L = S.legend && S.legend[ch];
    if (L && L.prop) { props.set(i, L.prop); continue; }   // (a prop stands on a wall tile)
    G[i] = L && L.tile != null ? L.tile : T_FLOOR; RM[i] = 0;
    (marks[ch] || (marks[ch] = [])).push({ x: X + 0.5, y: Y + 0.5, i, tx: X, ty: Y });
  }
  const room = { x: 1, y: 1, w: W0, h: H0, biome: !F.rift.gate && S.biome || Rf.biome, shape: 'rect', arena: F.rift.kind === 'boss', tiles: N, cells: [], from: -1, lq: 0, dir: 0 };
  const bossAt = marks.B && marks.B[0] ? { x: marks.B[0].x, y: marks.B[0].y } : { x: start.x, y: start.y - 4 };
  return { MW, MH, G, BI, RM, props, rooms: [room], start, bossAt, arena: 0, lights: (S.lights || []).map(l => Object.assign({ ph: 0 }, l)), decals: [], pots: [], packs: [], hazards: [], shrines: [], nests: [], gremlin: null, traps: [], stones: [], sec: Rf.biome, ter: Rf.biome, marks, rift: true };
}

/* ---- the stage's runtime: objects the pet uses, the puzzle, the monsters, the way on ---- */
const DunRift = (() => {
  function create(X) {
    const { F, M, me, g, mons } = X, Rf = RIFT_BY_ID[F.rift.id], S = F.rift.gate ? RIFT_GATES[F.rift.id] : Rf.stages[F.rift.stage], objs = [], R = X.R;
    const self = { Rf, S, objs, done: false, goalText: S.goal || '', cine: null, flags: {}, timers: [], t: 0 };
    /* an object on the floor: { x, y, kind, r, draw(c, X2, Y2, T), use(o) or none, label, ch (channel progress) }
       The pet uses one by standing beside it for a moment (channel 0.75 s, broken by moving away) */
    function obj(o) { o = Object.assign({ r: 0.9, ch: 0, on: false, label: '', busy: false }, o); objs.push(o); return o; }
    function channelTick(o, dt) {
      if (!o.use || o.busy || me.dead) { o.ch = 0; return; }
      const d = Math.hypot(me.x - o.x, me.y - o.y), moving = Math.abs(me.vx || 0) + Math.abs(me.vy || 0) > 0.3, near = d < o.r + me.r + 0.25;
      if (o.used) { if (!near) o.used = false; o.ch = 0; return; }   // (used once per visit: step away to use it again)
      if (near && !moving) { o.ch += dt; if (o.ch >= 0.75) { o.ch = 0; o.used = true; o.use(o); } }
      else o.ch = 0;
    }
    /* monsters from the layout: each pack letter spawns its types at the marks; aggro when seen */
    function spawnPacks() {
      const L = S.legend || {};
      for (const ch in L) { const P = L[ch]; if (!P.mons || !M.marks[ch]) continue;
        M.marks[ch].forEach((p, pi) => { const types = typeof P.mons === 'function' ? P.mons(pi) : P.mons; types.forEach((t, j) => { const a = j / types.length * 6.283, q = X.freeSpot(p.x + Math.cos(a) * 0.9, p.y + Math.sin(a) * 0.9, 0.4) || p; const m = X.spawnMon(t, q.x, q.y, { pack: 300 + pi, room: 0, flank: a, rift: true, rmark: ch }); if (P.elite && j === 0) m.elite = true; }); }); }
      g.total = mons.length;
    }
    /* the exit: a doorway the pet walks into once the stage is done */
    let exit = null;
    function setExit(x, y, label) { exit = { x, y, r: 1.1, label: label || 'Onward' }; }
    function monstersLeft() { return mons.filter(m => !m.dead && !m.boss && !m.optional).length + ((g.reserve && g.reserve.length) || 0); }
    const mod = S.kind === 'fight' ? riftFight(X, self, { obj, setExit, spawnPacks, channelTick, monstersLeft }) : S.make ? S.make(X, self, { obj, setExit, spawnPacks, channelTick, monstersLeft }) : {};
    self.mod = mod;
    // (a rift may lay something over every one of its stages: Rf.everyStage(X, self, H) -> { update, drawGround, drawOver })
    const amb = !F.rift.gate && Rf.everyStage ? Rf.everyStage(X, self, { obj, setExit, spawnPacks, channelTick, monstersLeft, exit: () => exit }) || {} : {}; self.amb = amb;
    if (S.kind === 'boss' && S.seal && Rf.sealing) riftSealing(X, self, mod, Object.assign({ wound: M.FC ? { x: M.FC.x, y: M.FC.y - M.FC.R + 3 } : { x: M.MW / 2, y: 3.5 } }, Rf.sealing));
    function update(dt) {
      self.t += dt;
      if (self.cine) { self.cine.t += dt; if (mod.cine) mod.cine(dt, self.cine); return; }
      for (const o of objs) channelTick(o, dt);
      if (mod.update) mod.update(dt);
      if (amb.update) amb.update(dt);
      if (exit && !g.won && !me.dead && self.done && Math.hypot(me.x - exit.x, me.y - exit.y) < exit.r) X.winStage();
    }
    function finish() { self.done = true; }
    const hintObj = () => (mod.hint ? mod.hint() : null) || (self.done && exit ? exit : null);
    /* a pointer over something to go to: a bobbing arrow and a glow */
    function pointer(c, wx, wy, col, lift) { const T = X.Tz(), Xs = X.sx(wx), Ys = X.sy(wy) - T * (lift || 1.4) - Math.abs(Math.sin(self.t * 4)) * T * 0.25; c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.45 + 0.25 * Math.sin(self.t * 5); blitSized(c, glowSprite(col), X.sx(wx) - T * 1.1, X.sy(wy) - T * 0.9, T * 2.2, T * 1.6); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.fillStyle = col; c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.lineJoin = 'round'; c.beginPath(); c.moveTo(Xs, Ys); c.lineTo(Xs - T * 0.34, Ys - T * 0.42); c.lineTo(Xs - T * 0.14, Ys - T * 0.42); c.lineTo(Xs - T * 0.14, Ys - T * 0.9); c.lineTo(Xs + T * 0.14, Ys - T * 0.9); c.lineTo(Xs + T * 0.14, Ys - T * 0.42); c.lineTo(Xs + T * 0.34, Ys - T * 0.42); c.closePath(); c.fill(); c.stroke(); c.restore(); }
    /* an arrow at the screen's edge toward something off it */
    function edgeArrow(c, wx, wy, col, label) { const W = X.W(), Hh = X.H(), Xs = X.sx(wx), Ys = X.sy(wy); if (Xs > 30 && Xs < W - 30 && Ys > 90 && Ys < Hh - 150) return; const cx = W / 2, cy = Hh / 2, dx = Xs - cx, dy = Ys - cy, a = Math.atan2(dy, dx); let k = 1; const bx = W / 2 - 34, by = Hh / 2 - 130; k = Math.min(Math.abs(bx / (dx || 1e-6)), Math.abs(by / (dy || 1e-6))); const ex = cx + dx * k, ey = cy + dy * k;
      c.save(); c.translate(ex, ey); c.globalAlpha = 0.85 + 0.15 * Math.sin(self.t * 6); c.fillStyle = col; c.strokeStyle = '#2B2433'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 16, 0, Math.PI * 2); c.fill(); c.stroke(); c.rotate(a); c.fillStyle = '#2B2433'; c.beginPath(); c.moveTo(9, 0); c.lineTo(-4, -7); c.lineTo(-4, 7); c.closePath(); c.fill(); c.rotate(-a); if (label) { c.font = `800 11px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText(label, 0, 30); c.fillText(label, 0, 30); } c.restore(); }
    function drawGround(c) {
      const T = X.Tz();
      if (exit) riftGate(c, X.sx(exit.x), X.sy(exit.y), T, self.done, self.t, exit.label);
      if (mod.drawGround) mod.drawGround(c);
      if (amb.drawGround) amb.drawGround(c);
      const hp = hintObj(); if (hp && !self.cine) pointer(c, hp.x, hp.y, hp === exit ? '#8FE0A6' : '#FFE37A', hp === exit ? 2.6 : (hp.h || 1.2) + 0.5);
      // the channel ring over an object being used
      for (const o of objs) if (o.ch > 0) { const Xs = X.sx(o.x), Ys = X.sy(o.y) - T * 0.9; c.save(); c.lineWidth = 4; c.strokeStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.arc(Xs, Ys, T * 0.3, 0, 6.283); c.stroke(); c.strokeStyle = '#FFFFFF'; c.beginPath(); c.arc(Xs, Ys, T * 0.3, -Math.PI / 2, -Math.PI / 2 + 6.283 * Math.min(1, o.ch / 0.75)); c.stroke(); c.restore(); }
    }
    function drawObj(c, o) { const T = X.Tz(), Xs = X.sx(o.x), Ys = X.sy(o.y); if (o.draw) o.draw(c, Xs, Ys, T, o);
      if (o.label && Math.hypot(me.x - o.x, me.y - o.y) < 4) { c.save(); c.font = `800 ${Math.round(T * 0.24)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.55)'; c.fillStyle = '#FFFFFF'; const s = typeof o.label === 'function' ? o.label(o) : o.label; c.strokeText(s, Xs, Ys - T * (o.h || 1.1)); c.fillText(s, Xs, Ys - T * (o.h || 1.1)); c.restore(); } }
    function drawOver(c) { if (mod.drawOver) mod.drawOver(c); if (amb.drawOver) amb.drawOver(c); const hp = hintObj(); if (hp && !self.cine && !me.dead) edgeArrow(c, hp.x, hp.y, hp === exit ? '#8FE0A6' : '#FFE37A', hp === exit ? exit.label : (typeof hp.label === 'function' ? hp.label(hp) : hp.label) || ''); if (self.cine && mod.drawCine) mod.drawCine(c, self.cine); }
    const goal = () => (mod.goal ? mod.goal() : self.goalText) + (self.done ? ' · go on' : '');
    function onBossDeath(m) { return mod.onBossDeath ? mod.onBossDeath(m) : false; }
    function startCine(kind) { self.cine = { kind, t: 0, step: 0 }; }
    return { self, objs, update, drawGround, drawObj, drawOver, goal, finish, onBossDeath, startCine, hintObj, tap: (x, y) => !!(mod.tap && mod.tap(x, y)), cam: () => (mod.cam ? mod.cam() : null), hud: () => (mod.hud ? mod.hud() : null), act: () => !!(mod.act && mod.act()), ents: () => objs.map(o => [o.y + (o.dy || 0), o]), get exit() { return exit; }, get done() { return self.done; } };
  }
  return { create };
})();

/* ---- the sealing, shared by every rift: the last boss falls, the stage's monsters die, the pet walks to the wound in
   the air, its markings shine, a thread of light joins it to its handler, and the rift's sigil closes the tear.
   riftSealing(X, self, mod, { fall, sub, sigil, name, color, glow, wound }) installs onBossDeath, cine and drawCine */
function riftSealing(X, self, mod, o) {
  const TAU = Math.PI * 2, me = X.me, col = o.color || '#61D9D2', gold = '#FFE37A', wound = o.wound || { x: X.M.MW / 2, y: 3.5 };
  const hexA = (h, a) => { const n = parseInt(String(h).slice(1, 7), 16) || 0; return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${Math.max(0, Math.min(1, a))})`; };
  mod.onBossDeath = m => { X.g.won = true; X.g.slowT = 1.2; X.flash(0.9, '#FFFFFF'); X.banner(o.fall, o.sub || '', gold, 2.6, true); X.sfx.fanfare();
    for (let i = 0; i < 8; i++) X.after(i * 0.13, () => X.boom(m.x + (Math.random() - 0.5) * m.r * 2, m.y + (Math.random() - 0.5) * m.r * 2, 1.4, i % 2 ? col : gold, '#FFFFFF', { n: 18, shake: 10 }));
    for (const q of X.mons) if (!q.dead && q !== m) X.killMon(q);
    if (o.onFall) o.onFall(m);
    X.after(2.6, () => { X.rift.startCine('seal'); X.sfx.hum(); }); return true; };
  mod.cine = (dt, C) => { if (C.step === 0) { C.step = 1; X.banner('SEAL THE RIFT', 'Your pet goes to the wound', col, 2.4, true); }
    const dx = wound.x - me.x, dy = wound.y + 2.2 - me.y, d = Math.hypot(dx, dy);
    if (C.step === 1) { if (d > 0.3) { me.x += dx / d * 2.6 * dt; me.y += dy / d * 2.6 * dt; me.vx = dx / d * 2.6; me.vy = dy / d * 2.6; me.face = dx >= 0 ? 1 : -1; me.bob += dt * 9; } else { C.step = 2; C.t = 0; me.vx = me.vy = 0; X.banner('RESONANCE', 'Its markings shine; a thread of light joins you', gold, 3, true, true); } }
    if (C.step === 2) { if (Math.random() < 0.5) X.part({ kind: 'star', x: me.x + (Math.random() - 0.5), y: me.y - 0.8 - Math.random(), vx: 0, vy: -1, life: 0.8, max: 0.8, size: 2, color: '#F4E8FF' }); if (C.t > 3.2) { C.step = 3; C.t = 0; X.flash(1, '#FFFFFF'); X.boom(wound.x, wound.y - 1.5, 1.6, '#F4E8FF', '#FFFFFF', { n: 24, shake: 6 }); X.banner(o.sigil, `${o.name} is sealed`, gold, 3.2, true, true); X.sfx.fanfare(); } }
    if (C.step === 3 && C.t > 3.4) { C.step = 4; X.finishWin(); } };
  /* the wound: a fracture in space itself, like a pane of glass struck from behind. Light pours through the cracks
     between the panes; a few panes are missing near the heart, the brightest light there. As the pet seals it the
     panes slide back together, the light in the cracks dims, and the fracture shrinks away to nothing. */
  const FR = (() => { let sd = 917; const R = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
    const n = 11, rings = [0, 0.2, 0.42, 0.68, 1.0], ang = []; for (let i = 0; i < n; i++) ang.push(i / n * TAU + (R() - 0.5) * 0.35);
    const P = ang.map(a => rings.map((r, j) => { const aa = a + (j ? (R() - 0.5) * 0.22 : 0), rr = r * (j === rings.length - 1 ? 0.8 + R() * 0.4 : 0.9 + R() * 0.2); return [Math.cos(aa) * rr, Math.sin(aa) * rr * 1.15]; }));
    const panes = []; for (let i = 0; i < n; i++) for (let j = 0; j < rings.length - 1; j++) { const i2 = (i + 1) % n, pts = [P[i][j], P[i][j + 1], P[i2][j + 1], P[i2][j]], cx = pts.reduce((a, p) => a + p[0], 0) / 4, cy = pts.reduce((a, p) => a + p[1], 0) / 4; panes.push({ pts, cx, cy, j, gone: j === 0 && R() < 0.5 || j === 1 && R() < 0.18, tint: R(), ph: R() * TAU }); }
    const tails = ang.map((a, i) => { const e = P[i][rings.length - 1], pts = [e]; let x = e[0], y = e[1]; for (let k = 0; k < 3; k++) { x += Math.cos(a + (R() - 0.5) * 0.6) * (0.18 + R() * 0.15); y += Math.sin(a + (R() - 0.5) * 0.6) * (0.2 + R() * 0.15); pts.push([x, y]); } return pts; });
    return { P, panes, tails, n }; })();
  mod.drawCine = (c, C) => { const T = X.Tz(), Xs = X.sx(wound.x), Ys = X.sy(wound.y) - T * 1.5, t = X.g.t;
    // how open the fracture stands: open while the pet comes and resonates, closing once it is sealed
    const close = C.step >= 3 ? Math.min(1, C.t / 1.3) : 0, open = (1 - close) * (C.step === 2 ? 1 + Math.min(1, C.t / 3) * 0.25 : 1), S = T * 2.7 * Math.max(0, 1 - Math.max(0, close - 0.55) / 0.45);
    if (S < 1) return;
    const gap = 0.055 * open, X0 = Xs, Y0 = Ys, pt = p => [X0 + p[0] * S, Y0 + p[1] * S];
    c.save();
    // the light leaking round it
    c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.55 * open; blitSized(c, glowSprite(col), X0 - S * 1.6, Y0 - S * 1.6, S * 3.2, S * 3.2); c.globalAlpha = 0.5 * open; blitSized(c, glowSprite('#E8C8FF'), X0 - S, Y0 - S, S * 2, S * 2);
    // the light behind the glass: white at the heart, the rift's colour toward the edge
    const outline = () => { c.beginPath(); FR.P.forEach((r, i) => { const q = pt(r[r.length - 1]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.closePath(); };
    const lg = c.createRadialGradient(X0, Y0, 0, X0, Y0, S * 1.05); lg.addColorStop(0, 'rgba(255,255,255,1)'); lg.addColorStop(0.3, 'rgba(240,225,255,.95)'); lg.addColorStop(0.7, hexA(col, 0.85)); lg.addColorStop(1, hexA(col, 0.2));
    c.globalAlpha = Math.min(1, 0.25 + open * 0.85); c.fillStyle = lg; outline(); c.fill();
    // the panes of fractured space: dark glass, each pulled back from its neighbours so the light shows between them
    c.globalCompositeOperation = 'source-over';
    for (const pn of FR.panes) { if (pn.gone && open > 0.3) continue; const k = 1 - gap * (2.2 - pn.j * 0.35) - 0.012 * Math.sin(t * 2 + pn.ph) * open, push = gap * 0.35 * open;
      const q = pn.pts.map(p => pt([pn.cx + (p[0] - pn.cx) * k + pn.cx * push, pn.cy + (p[1] - pn.cy) * k + pn.cy * push]));
      c.beginPath(); q.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath();
      const gg = c.createLinearGradient(q[0][0], q[0][1], q[2][0], q[2][1]); const a = 0.34 + pn.tint * 0.22 + pn.j * 0.06; gg.addColorStop(0, `rgba(60,34,110,${a})`); gg.addColorStop(0.55, `rgba(22,10,52,${a + 0.12})`); gg.addColorStop(1, `rgba(96,64,160,${a})`); c.fillStyle = gg; c.globalAlpha = 1; c.fill();
      // stars seen through the glass, and a sheen sliding across it
      c.save(); c.clip(); c.globalCompositeOperation = 'lighter'; const sx = (q[0][0] + q[2][0]) / 2, sy = (q[0][1] + q[2][1]) / 2; c.fillStyle = 'rgba(255,255,255,.7)'; for (let s2 = 0; s2 < 3; s2++) { c.beginPath(); c.arc(sx + Math.cos(pn.ph + s2 * 2.1) * S * 0.06, sy + Math.sin(pn.ph * 1.7 + s2) * S * 0.05, 1 + (s2 === 0 ? 0.6 : 0), 0, TAU); c.fill(); }
      const sh = ((t * 0.25 + pn.tint) % 1) * 2 - 0.5; c.globalAlpha = 0.25; c.strokeStyle = '#FFFFFF'; c.lineWidth = S * 0.05; c.beginPath(); c.moveTo(X0 - S + sh * S * 2, Y0 - S); c.lineTo(X0 - S * 0.6 + sh * S * 2, Y0 + S); c.stroke(); c.restore();
      // the bright cut edge of the glass on its lit side
      c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(q[0][0], q[0][1]); c.lineTo(q[1][0], q[1][1]); c.stroke(); c.strokeStyle = 'rgba(200,170,255,.5)'; c.beginPath(); c.moveTo(q[1][0], q[1][1]); c.lineTo(q[2][0], q[2][1]); c.stroke(); }
    // hairline cracks running on out into the world, and light spilling from their ends
    c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    FR.tails.forEach((tl, i) => { c.globalAlpha = 0.85 * open; c.strokeStyle = '#F4E8FF'; c.lineWidth = 1.6; c.beginPath(); tl.forEach((p, k) => { const q = pt(p); k ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); const e = pt(tl[tl.length - 1]); c.globalAlpha = (0.3 + 0.3 * Math.sin(t * 3 + i)) * open; blitSized(c, glowSprite('#E8C8FF'), e[0] - S * 0.12, e[1] - S * 0.12, S * 0.24, S * 0.24); });
    // glints of light breaking through, flickering at the heart
    for (let i = 0; i < 6; i++) { const a = i * 1.9 + t * 0.6, r = S * (0.1 + ((i * 0.37 + t * 0.15) % 1) * 0.6), x = X0 + Math.cos(a) * r, y = Y0 + Math.sin(a) * r * 1.1, f = Math.max(0, Math.sin(t * 4 + i * 2)); if (f < 0.2) continue; c.globalAlpha = f * open; c.fillStyle = '#FFFFFF'; c.beginPath(); c.moveTo(x, y - S * 0.09); c.lineTo(x + S * 0.02, y); c.lineTo(x, y + S * 0.09); c.lineTo(x - S * 0.02, y); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x - S * 0.09, y); c.lineTo(x, y + S * 0.02); c.lineTo(x + S * 0.09, y); c.lineTo(x, y - S * 0.02); c.closePath(); c.fill(); }
    c.restore();
    // the pet's resonance: a thin thread of the rift's own light from the pet into the heart of the fracture
    if (C.step === 2) { const px = X.sx(me.x), py = X.sy(me.y) - T * 0.8, u = Math.min(1, C.t / 1.5); c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = hexA('#F4E8FF', 0.9); c.lineWidth = 2 + Math.sin(t * 20) * 0.6; c.beginPath(); c.moveTo(px, py); const ex = px + (X0 - px) * u, ey = py + (Y0 - py) * u; for (let k = 1; k <= 6; k++) { const f = k / 6; c.lineTo(px + (ex - px) * f + (k < 6 ? (Math.random() - 0.5) * T * 0.12 : 0), py + (ey - py) * f); } c.stroke(); c.restore(); }
  };
  return mod;
}

/* the way on: a stone gate standing on the floor, drawn in depth (front faces, side faces, cut blocks, a keystone).
   Shut, its opening is dark with a faint stir. Open, it is filled with real light: a bright core that pours out,
   slow swirling currents, motes drawn into it, the light falling on the inner faces of the stones and across the floor. */
function riftGate(c, Xs, Ys, T, on, t, label) {
  T *= 1.4;
  const TAU = Math.PI * 2, W = T * 0.95, H = T * 1.55, pw = T * 0.34, dep = T * 0.2, ink = '#24202E';
  const stone = ['#7A7686', '#6E6A7C', '#837F90'], side = '#4E4A5C', top = '#A29EB0';
  c.save();
  // light on the floor in front of it
  if (on) { c.globalCompositeOperation = 'lighter'; const fg = c.createRadialGradient(Xs, Ys + T * 0.15, 0, Xs, Ys + T * 0.15, T * 2.2); fg.addColorStop(0, 'rgba(210,255,235,.55)'); fg.addColorStop(0.5, 'rgba(143,224,166,.2)'); fg.addColorStop(1, 'rgba(143,224,166,0)'); c.fillStyle = fg; c.beginPath(); c.ellipse(Xs, Ys + T * 0.2, T * 2.2, T * 0.8, 0, 0, TAU); c.fill(); c.globalCompositeOperation = 'source-over'; }
  c.fillStyle = 'rgba(0,0,0,.32)'; c.beginPath(); c.ellipse(Xs + dep * 0.6, Ys + T * 0.12, W + pw + T * 0.2, T * 0.32, 0, 0, TAU); c.fill();
  // the opening (an arch shape) and what fills it
  const iw = W - pw, ih = H - T * 0.1, archPath = (k) => { c.beginPath(); c.moveTo(Xs - iw * k, Ys); c.lineTo(Xs - iw * k, Ys - ih * 0.62); c.quadraticCurveTo(Xs - iw * k, Ys - ih * (1.02), Xs, Ys - ih * 1.04); c.quadraticCurveTo(Xs + iw * k, Ys - ih * 1.02, Xs + iw * k, Ys - ih * 0.62); c.lineTo(Xs + iw * k, Ys); c.closePath(); };
  archPath(1); c.save(); c.clip();
  if (on) {
    const cx = Xs, cy = Ys - ih * 0.5, g = c.createRadialGradient(cx, cy, 0, cx, cy, ih * 0.9); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.25, '#EFFFF6'); g.addColorStop(0.6, '#A8F0C4'); g.addColorStop(1, '#4FB08A'); c.fillStyle = g; c.fillRect(Xs - iw, Ys - ih * 1.1, iw * 2, ih * 1.1);
    // slow swirling currents of light
    c.globalCompositeOperation = 'lighter'; for (let k = 0; k < 5; k++) { const r = ih * (0.18 + k * 0.13), a0 = t * (0.8 - k * 0.1) * (k % 2 ? -1 : 1) + k; c.strokeStyle = `rgba(255,255,255,${0.32 - k * 0.04})`; c.lineWidth = T * (0.09 - k * 0.01); c.beginPath(); c.ellipse(cx, cy, r * 0.75, r, 0, a0, a0 + 2.2); c.stroke(); c.beginPath(); c.ellipse(cx, cy, r * 0.75, r, 0, a0 + Math.PI, a0 + Math.PI + 1.6); c.stroke(); }
    // motes drawn inward to the core
    for (let i = 0; i < 14; i++) { const u = (t * 0.35 + i / 14) % 1, a = i * 2.4, r = ih * 0.75 * (1 - u); c.globalAlpha = u * 0.9; c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(cx + Math.cos(a + u * 2) * r * 0.7, cy + Math.sin(a + u * 2) * r, T * 0.03 + u * T * 0.02, 0, TAU); c.fill(); }
    c.globalAlpha = 0.55 + 0.25 * Math.sin(t * 3); blitSized(c, glowSprite('#FFFFFF'), cx - ih * 0.45, cy - ih * 0.45, ih * 0.9, ih * 0.9);
  } else { const g = c.createLinearGradient(Xs, Ys - ih, Xs, Ys); g.addColorStop(0, '#07070F'); g.addColorStop(1, '#1A1A2A'); c.fillStyle = g; c.fillRect(Xs - iw, Ys - ih * 1.1, iw * 2, ih * 1.1); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(127,211,242,.18)'; c.lineWidth = 2; for (let k = 0; k < 3; k++) { const r = ih * (0.2 + k * 0.15), a0 = t * 0.4 + k * 2; c.beginPath(); c.ellipse(Xs, Ys - ih * 0.5, r * 0.7, r, 0, a0, a0 + 1.5); c.stroke(); } }
  c.restore();
  // the stones: two pillars of cut blocks, each with a lit front face, a shaded side face and a pale top
  const block = (x, y, w, h, i, litIn) => { c.fillStyle = side; c.beginPath(); c.moveTo(x + w, y); c.lineTo(x + w + dep, y - dep * 0.6); c.lineTo(x + w + dep, y + h - dep * 0.6); c.lineTo(x + w, y + h); c.closePath(); c.fill(); c.strokeStyle = ink; c.lineWidth = 1.5; c.stroke();
    c.fillStyle = stone[i % 3]; c.fillRect(x, y, w, h); c.strokeRect(x, y, w, h);
    // texture: chips, a crack, frost in the joints
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x + 1, y + 1, w - 2, h * 0.18); c.fillStyle = 'rgba(0,0,0,.14)'; c.beginPath(); c.arc(x + w * (0.25 + (i * 0.37) % 0.5), y + h * 0.6, h * 0.08, 0, TAU); c.fill(); if (i % 2) { c.strokeStyle = 'rgba(0,0,0,.3)'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + w * 0.6, y + 2); c.lineTo(x + w * 0.5, y + h * 0.5); c.lineTo(x + w * 0.65, y + h - 2); c.stroke(); }
    if (litIn) { c.save(); c.globalCompositeOperation = 'lighter'; const lg = c.createLinearGradient(litIn > 0 ? x + w : x, 0, litIn > 0 ? x : x + w, 0); lg.addColorStop(0, 'rgba(180,255,215,.55)'); lg.addColorStop(1, 'rgba(180,255,215,0)'); c.fillStyle = lg; c.fillRect(x, y, w, h); c.restore(); } };
  const rows = 4, bh = (H * 0.66) / rows;
  for (const sd of [-1, 1]) { const x0 = sd < 0 ? Xs - W - pw * 0.0 : Xs + iw; for (let r = 0; r < rows; r++) block(x0 - (sd < 0 ? 0 : 0), Ys - (r + 1) * bh, pw + (sd < 0 ? W - iw - pw : 0), bh, r + (sd > 0 ? 2 : 0), on ? -sd : 0); }
  // the arch over them: voussoirs round the curve, a keystone at the crown
  const n = 7, R0 = iw, R1 = iw + pw, cy = Ys - H * 0.66;
  for (let i = 0; i < n; i++) { const a0 = Math.PI + i / n * Math.PI, a1 = Math.PI + (i + 1) / n * Math.PI, key = i === 3, r1 = R1 + (key ? T * 0.12 : 0); const pts = [[Math.cos(a0) * R0, Math.sin(a0) * R0 * 0.95], [Math.cos(a0) * r1, Math.sin(a0) * r1 * 0.95], [Math.cos(a1) * r1, Math.sin(a1) * r1 * 0.95], [Math.cos(a1) * R0, Math.sin(a1) * R0 * 0.95]].map(([x, y]) => [Xs + x, cy + y]);
    c.fillStyle = side; c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x + dep, y - dep * 0.6) : c.moveTo(x + dep, y - dep * 0.6))); c.closePath(); c.fill();
    c.beginPath(); pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fillStyle = key ? '#9A96AA' : stone[i % 3]; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.5; c.stroke();
    if (on) { c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(190,255,220,.6)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); c.lineTo(pts[3][0], pts[3][1]); c.stroke(); c.restore(); }
    if (key) { c.fillStyle = on ? '#C8FFE0' : '#5A6A80'; c.beginPath(); const kx = (pts[1][0] + pts[2][0] + pts[0][0] + pts[3][0]) / 4, ky = (pts[1][1] + pts[2][1] + pts[0][1] + pts[3][1]) / 4; c.moveTo(kx, ky - T * 0.1); c.lineTo(kx + T * 0.07, ky); c.lineTo(kx, ky + T * 0.1); c.lineTo(kx - T * 0.07, ky); c.closePath(); c.fill(); c.stroke(); if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.7; blitSized(c, glowSprite('#8FE0A6'), kx - T * 0.35, ky - T * 0.35, T * 0.7, T * 0.7); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; } } }
  // the step at its foot
  c.fillStyle = '#5E5A6C'; c.strokeStyle = ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(Xs - W - T * 0.1, Ys); c.lineTo(Xs + W + T * 0.1, Ys); c.lineTo(Xs + W + T * 0.1 + dep, Ys - dep * 0.6); c.lineTo(Xs - W - T * 0.1 + dep, Ys - dep * 0.6); c.closePath(); c.fill(); c.stroke(); c.fillStyle = '#4A4658'; c.fillRect(Xs - W - T * 0.1, Ys, W * 2 + T * 0.2, T * 0.12); c.strokeRect(Xs - W - T * 0.1, Ys, W * 2 + T * 0.2, T * 0.12);
  // the light pouring out of it, softly, over everything in front
  if (on) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.5 + 0.15 * Math.sin(t * 2.5); blitSized(c, glowSprite('#B8FFD8'), Xs - T * 1.9, Ys - H * 1.15, T * 3.8, H * 1.5); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    c.font = `800 ${Math.round(T * 0.3)}px ${arcFont}`; c.textAlign = 'center'; c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = '#FFFFFF'; c.strokeText(label, Xs, Ys - H - T * 0.7); c.fillText(label, Xs, Ys - H - T * 0.7); }
  c.restore();
}

/* ---- a dungeon stage: the floor the engine rolled, its packs already loose; a mini boss waits in the farthest room;
   the way on opens when the floor is clear ---- */
function riftFight(X, self, H) {
  const { M, me, g, mons, F } = X, Rf = RIFT_BY_ID[F.rift.id], miniId = F.rift.mini;
  // the farthest room from the start holds the mini boss and the way on
  let far = M.bossAt || M.start, best = -1; for (const r of M.rooms) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2, d = Math.hypot(cx - M.start.x, cy - M.start.y); if (d > best) { best = d; far = X.freeSpot(cx, cy, 0.8) || { x: cx, y: cy }; } }
  let mini = null;
  if (miniId && BOSS_BY_ID[miniId] || BOSSES.find(b => b.id === miniId)) { const B2 = BOSS_BY_ID[miniId] || BOSSES.find(b => b.id === miniId); mini = X.lesserBoss ? X.lesserBoss(far.x, far.y, F.rift.miniHp, '', B2) : null; if (mini) { if (Rf.miniDmg) mini.dmg *= Rf.miniDmg; const E = RiftEvil.make(((F.seed || 1) * 7919 + F.rift.stage * 104729) >>> 0, Rf.mechaMinis ? { mecha: true } : null); mini.evil = E; mini.bname = E.name; mini.glow = E.acc; mini.aggro = false; } }
  H.setExit(far.x, far.y, 'The way on');
  // (a dungeon may have something of its own in it: Rf.stages[i].extra(X, self, H) -> { update, drawGround, drawOver })
  const SX = Rf.stages[F.rift.stage], xm = SX && SX.extra ? SX.extra(X, self, H) || {} : {};
  X.after(2.2, () => X.banner(F.rift.name.toUpperCase(), `Clear every monster${mini ? ` and ${mini.bname}` : ''}`, (BIOMES[F.biome] || BIOMES[Rf.biome]).accent || '#FFE37A', 2.6, true, true));
  return {
    drawGround: c => { if (xm.drawGround) xm.drawGround(c); }, drawOver: c => { if (xm.drawOver) xm.drawOver(c); }, xm,
    update(dt) { if (xm.update) xm.update(dt); if (!self.done && H.monstersLeft() === 0 && (!mini || mini.dead)) { self.done = true; X.banner('THE FLOOR IS CLEAR', 'The door opens: follow the green arrow', '#8FE0A6', 2.4, true); X.flash(0.3, '#FFFFFF'); X.sfx.fanfare(); } },
    goal() { const left = H.monstersLeft() + (mini && !mini.dead ? 1 : 0); if (self.monTotal == null || left > self.monTotal) self.monTotal = left; return self.done ? 'The far door is open' : `${left} of ${self.monTotal} left${mini && !mini.dead ? ` · ${mini.bname} ${Math.max(0, Math.ceil(mini.hp / mini.maxhp * 100))}%` : ''}`; },
  };
}
