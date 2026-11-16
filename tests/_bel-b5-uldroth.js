// Uldroth the Drowned Herald (worker B5, src/js/20t5-belfry-uldroth.js): the Belfry's finale, checked in the game.
//   1 loads: the page with no errors, the fiend registered, the stage made (B1's Belfry stage 5 or a test entry); the GPU
//     model (GLM forced on the software rasteriser) builds its meshes and draws a frame; the 2D fallback draws a frame
//   2 bars 9, three phases at 70% / 35%
//   3 Jaw of the Deep: a long frontal cone (tracks, then LOCKED), 2.5-3 s; strikes inside, spares outside
//   4 Undertow: the pull drags a still pet in; a pet running outward early escapes the burst
//   5 the Drowning Bell: one valve lit and its island announced >= 5 s before the sea rises; the valve (stand by it) raises
//     the island; on the island the flood crest spares the pet; off it, a heavy hit that never kills from full
//   6 below 35%: the bell's support broken; leeches hold the next valve (it will not turn); killed, it turns; half-arena
//     waves alternate sides, hit the marked half, spare the other half and the raised island
//   7 level-10 bots (fresh random pets, RUNS, default 3) that use the mechanics win; their median fight about 4 minutes (3 to 5.5), 2D path
//   8 the fall: the sea drains below the rim, the bell sounds, the sun; then the sealing starts; 0 page errors
// usage: HTML=test-belB5.html node tests/_bel-b5-uldroth.js   env: ONLY=1,2,... RUNS (bot runs, default 1), CAP (game s)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); if (/Uldroth/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(n => { window.__ULD_GL = 0; window.__NG_GL = 0; window.__BEL_GL = 0; window.__PETNAME = n; }, process.env.PET || 'Bot');
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-belB5.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const only = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : null, want = k => !only || only.includes(k);
  // a fresh level-10 pet, Uldroth's stage started, the loop stopped: every update and frame from here is ours
  async function begin() {
    const info = await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.quickStart(window.__PETNAME || 'Bot'); P.st.energy = 100; P.st.dlv = 10; P.st.lv10Eggs = 1; P.st.lv10Owed = 0; P.st.unlockAll = true; P.st.retro = false;
      let Rf = P.RIFT_BY_ID.belfry, i = Rf ? Rf.stages.findIndex(s => s.boss === 'beluldroth') : -1, own = false;
      if (i < 0 || !Rf.stages[i].make) { own = true; const D = P.FIEND_DEFS.beluldroth;
        Rf = { id: 'beltest', n: 0, name: 'The Drowned Belfry (test)', lvl: 10, sigil: 'Tide', biome: 'belfry', aff: ['water', 'dark'], gate: null, mons: ['leech'], sealing: { fall: 'THE DROWNED HERALD FALLS', sub: 'test', sigil: 'THE TIDE SIGIL', name: 'The Drowned Belfry', color: '#61D9D2' },
          stages: [{ kind: 'boss', biome: 'belfry', name: 'a', boss: 'beluldroth', goal: 'x' }, { kind: 'boss', biome: 'belfry', name: 'b', boss: 'beluldroth', goal: 'x' }, { kind: 'boss', biome: 'belfry', name: 'The Bell Platform', boss: 'beluldroth', goal: 'Uldroth', seal: true, make: D.stageMake }] };
        const j = P.RIFTS.findIndex(r => r.id === 'beltest'); if (j >= 0) P.RIFTS.splice(j, 1); P.RIFTS.push(Rf); P.RIFT_BY_ID.beltest = Rf; i = 2; }
      P.openMap(); P.dun.setMapTab('rift', true); P.startRift(Rf.id, i); return { own, id: Rf.id, i, sealing: !!Rf.sealing }; });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 });
    await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; window.__H = { P, G: P.arc.game, D: P.arc.game._dbg };
      const { G, D } = window.__H; for (let k = 0; k < 600 && !D.g.boss; k++) G.update(1 / 60); });
    return info;
  }
  const PRE = `const { P, G, D } = window.__H, g = D.g, me = D.me, FX = D.FD.FX, S = D.FD.S, M = FX.mem, C = FX.C, UL = P.FIEND_DEFS.beluldroth.ULDROTH, TU = UL.TUNE, b = g.boss, isl = UL.test.islandsOf(FX);
    const step = (s, f, god) => { const t1 = g.t + s; let k = 0; while (g.t < t1 && k++ < 200000) { if (god !== false) me.hp = D.ST.hp; G.update(1 / 60); if (f && f()) return true; } return false; };
    const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.push = null; me.dodge = null; };
    const force = kind => { UL.test.endAct(FX, b); b.stunT = 0; b.act = 'fight'; UL.test.begin(FX, b, kind); };
    const wakeUp = () => { pin(C.x, C.y + 6); return step(60, () => b.act === 'fight'); };`;
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);

  let info = await begin(); console.log('stage', JSON.stringify(info));
  // ---- 1 loads (2D, then GPU) ----
  if (want(1)) { let r = await ev(`wakeUp(); pin(b.x + 1, b.y + 5); step(0.5); const cv = document.createElement('canvas'); cv.width = 390; cv.height = 844; G.draw(cv.getContext('2d')); return { old2D: UL.test.old2D, fiend: D.F.fiend.id, boss: !!b, mod: !!(D.RIFT && D.RIFT.self.mod && D.RIFT.self.mod.isl), valves: D.RIFT.objs.filter(o => o.kind === 'belvalve').length, gl: UL.MODEL.__dbg.gl };`);
    ok(r.fiend === 'beluldroth' && r.boss && r.mod && r.valves === 3 && r.old2D > 0, 'loads: the fiend, the stage module, three valves; without the GPU the existing 2D Uldroth is drawn', r);
    r = await ev(`window.__ULD_GL = 1; window.__NG_GL = 1; const cv = document.createElement('canvas'); cv.width = 390; cv.height = 844; const t0 = performance.now(); G.draw(cv.getContext('2d')); const st = UL.MODEL.__dbg.glStats; window.__ULD_GL = 0; window.__NG_GL = 0; return { gl: st.frames > 0, frames: st.frames, tris: st.meshTris, meshMs: st.meshMs, ms: Math.round(performance.now() - t0) };`);
    ok(r.gl && r.tris > 5000, 'loads on the GPU: the meshes built, GLM frames drawn (boss, sea, islands, bell)', r); }
  // ---- 2 bars and phases ----
  if (want(2)) { const r = await ev(`return { bars: D.F.fiend.bars, phases: D.F.fiend.phases, cuts: D.F.fiend.cuts, hp: Math.round(b.maxhp), barHP: Math.round(S.barHP), dmg: +b.dmg.toFixed(1), pet: { hp: D.ST.hp, atk: D.ST.atk } };`);
    ok(r.bars === 9 && r.phases === 3 && r.cuts[1] === 0.7 && r.cuts[2] === 0.35 && Math.abs(r.hp - 9 * r.barHP) < r.hp * 0.002, 'nine bars, three phases at 70% and 35%', r);
    const p = await ev(`wakeUp(); b.hp = b.maxhp * 0.69; step(1); const p2 = S.phase; step(4, () => !(S.roarT > 0)); b.hp = b.maxhp * 0.34; step(1); const p3 = S.phase; b.hp = b.maxhp; return { p2, p3, names: P.FIEND_DEFS.beluldroth.phaseNames };`);
    ok(p.p2 === 2 && p.p3 === 3, 'phase II below 70%, phase III below 35%', p);
    info = await begin(); }
  // ---- 3 the cone ----
  if (want(3)) { const r = await ev(`wakeUp(); step(3, () => !M.A); M.idleT = 99; pin(b.x, b.y + 6); force('jaw'); step(0.1); const s = M.A.tele, o = { shape: s.shape, len: s.len, spread: +s.spread.toFixed(2), t: +s.t.toFixed(2), art: s.art };
      step(3, () => M.A && M.A.locked); o.locked = !!s.locked; const h0 = me.hp; const inside = FX.inShape(s, me.x, me.y, me.r); step(1.6, null, false); o.hitInside = inside && me.hp < h0; o.jawHit = M.stat.jawHit;
      step(4, () => !M.A); me.hp = D.ST.hp; pin(b.x, b.y + 6); force('jaw'); step(2.2, () => M.A.locked); const s2 = M.A.tele; pin(b.x + Math.cos(s2.a + Math.PI / 2) * 6, b.y + Math.sin(s2.a + Math.PI / 2) * 6); const h1 = me.hp; step(1.5, () => M.A.phase !== 'wind', false); step(0.3, null, false); o.spared = me.hp >= h1; M.idleT = 0; return o;`);
    ok(r.shape === 'cone' && r.len >= 12 && r.t >= 2.5 && r.t <= 3 && r.art === 'jaw' && r.locked, 'Jaw of the Deep: a long frontal cone, 2.5-3 s, tracks then locks, with its symbol', r);
    ok(r.hitInside && r.spared, 'the cone strikes inside it and spares a pet beside it', r); }
  // ---- 4 the Undertow ----
  if (want(4)) { const r = await ev(`step(4, () => !M.A); M.idleT = 99; pin(b.x, b.y + 4.6); const d0 = Math.hypot(me.x - b.x, me.y - b.y); force('undertow'); step(1.6, () => M.A.phase === 'pull' && M.A.t > 1.2); const d1 = Math.hypot(me.x - b.x, me.y - b.y), s = M.A.tele, o = { r: s.r, t: +s.t.toFixed(2), art: s.art, d0: +d0.toFixed(2), d1: +d1.toFixed(2) };
      const h0 = me.hp; step(3, () => M.A.phase === 'gasp', false); o.stillHit = me.hp < h0; step(0.1); o.weak = !!(S.weak.throat && !S.weak.throat.dead);
      step(4, () => !M.A); me.hp = D.ST.hp; pin(b.x, b.y + 4.0); force('undertow'); const h1 = me.hp; let k = 0; step(4, () => { const dx = me.x - b.x, dy = me.y - b.y, d = Math.hypot(dx, dy) || 1; me.x += dx / d * 4.3 / 60; me.y += dy / d * 4.3 / 60; me.vx = dx / d * 4.3; return M.A && M.A.phase === 'gasp'; }, false); o.ranOut = me.hp >= h1; o.dEnd = +Math.hypot(me.x - b.x, me.y - b.y).toFixed(1); M.idleT = 0; return o;`);
    ok(r.d1 < r.d0 - 0.3 && r.stillHit, 'Undertow: the pull drags a still pet in, the point-blank burst strikes it', r);
    ok(r.ranOut && r.weak, 'a pet running outward early escapes the burst; he gasps, the throat open', r); }
  // ---- 5 the Drowning Bell ----
  if (want(5)) { info = await begin(); const r = await ev(`wakeUp(); b.hp = b.maxhp * 0.69; step(4, () => S.phase === 2 && !(S.roarT > 0)); step(5, () => !M.A); M.bellT = 0; M.idleT = 0; step(14, () => M.A && M.A.kind === 'bell' && M.A.i != null); const s = isl[M.A.i], o = { lit: isl.filter(q => q.litW).length };
      // the island is announced, then 5 s pass before the sea starts to climb
      const tA = g.t; step(8, () => M.A.phase === 'rise'); o.ahead = +(g.t - tA).toFixed(2); o.marked = s.markW; o.upBefore = s.up;
      // the valve: stand by it (the stage's channel: 0.75 s)
      pin(s.vx, s.vy + 0.6); step(2, () => s.want > 0.5); o.turned = s.want > 0.5; step(1.6); o.up = +s.up.toFixed(2);
      pin(s.x, s.y); step(10, () => { pin(s.x, s.y); return M.A.phase === 'crest'; }); o.safe = M.stat.floodSafe; o.hit = M.stat.floodHit; o.lvl = +M.lvl.toFixed(2); o.petZ = +(M.petZ || 0).toFixed(2);
      step(8, () => !M.A || M.A.kind !== 'bell'); step(3); o.down = +s.up.toFixed(2);
      // a second bell: the pet ignores it; the crest hits hard but never kills from full health
      M.bellT = 0; M.idleT = 0; step(14, () => M.A && M.A.kind === 'bell' && M.A.i != null); const s2 = isl[M.A.i], far = isl.find(q => q !== s2); pin(C.x + 2, C.y + 1); me.hp = D.ST.hp; const h0 = me.hp; step(14, () => { pin(C.x + 2, C.y + 1); return M.A.phase === 'crest'; }, false); step(0.1, null, false);
      o.missHit = M.stat.floodHit; o.missDmg = Math.round(h0 - me.hp); o.alive = !me.dead && me.hp > 0; o.petMax = D.ST.hp; return o;`);
    ok(r.lit === 1 && r.marked && r.ahead >= 4.9 && r.upBefore === 0, 'the Drowning Bell: one valve lit, its island announced 5 s before the sea rises', r);
    ok(r.turned && r.up > 0.9, 'the pet turns the lit valve (a short Resonance) and the island rises', r);
    ok(r.safe === 1 && r.hit === 0 && r.lvl > 1 && r.petZ > 1, 'sheltered on the raised island when the flood crests (the pet stands on its top)', r);
    ok(r.down < 0.05, 'the sea ebbs and the island sinks back', r);
    ok(r.missHit === 1 && r.missDmg > r.petMax * 0.3 && r.alive, 'off the island: a heavy hit, never a kill from full health', r); }
  // ---- 6 below 35% ----
  if (want(6)) { info = await begin(); const r = await ev(`wakeUp(); b.hp = b.maxhp * 0.34; step(6, () => S.phase === 3 && !(S.roarT > 0)); pin(C.x + 5, C.y + 4); step(16, () => M.broke && M.A && M.A.kind === 'break' && M.A.phase === 'smash' && M.A.t > 1.6); const o = { broke: M.broke, bell: M.bellState };
      step(6, () => M.surge && !M.A); M.idleT = 99; const s = isl[M.surge.i]; o.leeches = s.leeches.filter(l => !l.dead).length; o.types = s.leeches.map(l => l.type);
      pin(s.vx, s.vy + 0.6); step(1.6); o.blockedTurn = s.want > 0.5; o.blocked = UL.test.blocked(FX, s);
      for (const l of s.leeches) if (!l.dead) D.hitMon(l, 1e9, { flat: true }); step(0.3); pin(s.vx, s.vy + 0.6); step(2, () => s.want > 0.5); o.turned = s.want > 0.5; step(1.8); o.up = +s.up.toFixed(2);
      // the waves: alternate sides; the marked half is hit, the other half spared, the raised island spared
      const res = []; for (let k = 0; k < 3; k++) { step(3, () => !M.A); me.hp = D.ST.hp; force('wave'); step(0.05); const side = M.A.side; const mode = k; // 0: in the marked half, 1: the other half, 2: on the island
        const spot = mode === 0 ? { x: C.x + side * 7, y: C.y + 2 } : mode === 1 ? { x: C.x - side * 7, y: C.y + 2 } : { x: s.x, y: s.y }; pin(spot.x, spot.y); const h0 = me.hp;
        step(6, () => { pin(spot.x, spot.y); return !M.A && !M.waves.length; }, false); res.push({ side, mode, hit: me.hp < h0 - 1, islandSide: Math.sign(s.x - C.x) }); }
      o.waves = res; o.stat = { waves: M.stat.waves, waveHit: M.stat.waveHit, waveSafe: M.stat.waveSafe }; M.idleT = 0; return o;`);
    ok(r.broke && r.bell === 'fall', 'below 35%: he breaks the bell\'s support and the bell falls', r);
    ok(r.leeches >= 2 && r.blocked && !r.blockedTurn, 'leeches hold the next valve: it will not turn', { leeches: r.leeches, types: r.types, blocked: r.blocked, turned: r.blockedTurn });
    ok(r.turned && r.up > 0.9, 'the leeches killed, the valve turns and the refuge rises', { turned: r.turned, up: r.up });
    const w = r.waves; ok(w[0].side === -w[1].side && w[1].side === -w[2].side, 'the half-arena waves alternate sides', w.map(x => x.side));
    ok(w[0].hit && !w[1].hit && !w[2].hit, 'a wave hits the marked half, spares the other half and the raised island', w); }
  // ---- 7 the bot ----
  const times = [];
  if (want(7)) for (let run = 0; run < +(process.env.RUNS || 3); run++) { info = await begin();
    const R = await ev(`const cap = arg.cap, out = { log: [], hits: [], minHp: 1, deaths: 0 }; wakeUp(); const t0 = g.t, SP = 4.3; let phase = 1, esc = null, strongT = 0, kk = 0;
      const melee = !!(D.KITR.normal && /claw|bite|slash|punch|kick|tackle|swipe|strike/i.test(D.KITR.normal.key || ''));
      const free = (x, y) => Math.hypot(x - C.x, y - C.y) < C.R - 1.2;
      const pend = () => S.tele.filter(s => !s.done && s.age < s.t);
      const waveHalf = (x, y) => { for (const w of M.waves) if ((x - C.x) * w.side > -0.6 && (x - C.x) * w.side < w.d + 1 && !UL.test.sheltered(FX, x, y)) return true; return false; };
      const danger = (x, y, pad) => { for (const s of pend()) if (FX.inShape(s, x, y, me.r + (pad || 0.35))) return true; for (const z of S.hz) if (z.dps && FX.inShape(z, x, y, me.r + 0.2)) return true; if (waveHalf(x, y)) return true; return Math.hypot(x - b.x, y - b.y) < 2.6; };
      const moveTo = (x, y) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 0.08) { me.vx = me.vy = 0; return true; } const s = Math.min(d, SP / 60), nx = me.x + dx / d * s, ny = me.y + dy / d * s; if (free(nx, ny)) { me.x = nx; me.y = ny; } me.vx = dx / d * SP; me.vy = dy / d * SP; me.face = dx >= 0 ? 1 : -1; return false; };
      const escape = () => { let best = null, bd = 1e9; for (const r of [1.5, 2.5, 3.5, 5, 7, 9, 12]) for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r; if (!free(x, y) || danger(x, y, 0.6)) continue; const c2 = r + Math.hypot(x - b.x, y - b.y) * 0.04; if (c2 < bd) { bd = c2; best = { x, y }; } } return best; };
      const attack = t => { if (!t) return; const d = Math.hypot(t.x - me.x, t.y - me.y) || 1; g.tapAim = { t, x: (t.x - me.x) / d, y: (t.y - me.y) / d, a: Math.atan2(t.y - me.y, t.x - me.x), tap: true }; g.tapBuf = 0.35; };
      let lastHp = me.hp;
      while (!b.dead && g.t - t0 < cap && kk++ < 400000) {
        if (me.dead) { out.deaths++; me.dead = false; me.hp = D.ST.hp; }
        if (S.phase !== phase) { out.log.push({ t: +(g.t - t0).toFixed(1), ev: 'phase' + S.phase }); phase = S.phase; }
        const A = M.A; let target = null, busy = false;
        const lit = isl.find(s => s.litW);
        if (lit && lit.want < 0.5) { const blk = UL.test.blocked(FX, lit);
          if (blk) { const l = lit.leeches.find(q => !q.dead); target = l; if (!danger(me.x, me.y)) { const d = Math.hypot(l.x - me.x, l.y - me.y); if (d > (melee ? 1.4 : 3.5)) moveTo(l.x, l.y + (melee ? 1.0 : 3.0)); else { me.vx = me.vy = 0; } attack(l); busy = true; } }
          else if (!danger(lit.vx, lit.vy + 0.6) || (A && A.kind === 'bell')) { if (moveTo(lit.vx, lit.vy + 0.6)) { me.vx = me.vy = 0; } busy = true; } }
        else if (lit && (A && A.kind === 'bell' || M.waves.length || (A && A.kind === 'wave'))) { if (!UL.test.onTop(lit, me.x, me.y)) moveTo(lit.x, lit.y); else { me.vx = me.vy = 0; } attack(b); busy = true; }
        if (!busy) { if (!danger(me.x, me.y)) esc = null;
          const weak = S.weak.throat && !S.weak.throat.dead ? S.weak.throat : null; target = weak || b;
          if (danger(me.x, me.y)) { if (!esc || danger(esc.x, esc.y, 0.5)) esc = escape(); if (esc) moveTo(esc.x, esc.y); attack(target); }
          else { const wantD = melee ? 2.9 : 5.0, d = Math.hypot(target.x - me.x, target.y - me.y);
            if (d > wantD + 0.6) { const a = Math.atan2(target.y - me.y, target.x - me.x), x = target.x - Math.cos(a) * wantD, y = target.y - Math.sin(a) * wantD; if (!danger(x, y)) moveTo(x, y); else me.vx = me.vy = 0; }
            else me.vx = me.vy = 0;
            attack(target); } }
        strongT -= 1 / 60; if (strongT <= 0 && !pend().length) { try { D.useStrong('strong'); } catch (e) {} strongT = 0.6; }
        G.update(1 / 60);
        if (me.hp < lastHp - 0.5) out.hits.push({ t: +(g.t - t0).toFixed(1), d: Math.round(lastHp - me.hp), act: A ? A.kind + ':' + A.phase : (M.waves.length ? 'wave' : b.act) });
        lastHp = me.hp; out.minHp = Math.min(out.minHp, me.hp / D.ST.hp);
      }
      out.t = +(g.t - t0).toFixed(1); out.won = !!b.dead; out.hpLeft = +(b.hp / b.maxhp).toFixed(3); out.stat = M.stat; out.melee = melee; out.kit = D.KITR.normal && D.KITR.normal.key; out.pet = { hp: D.ST.hp, atk: D.ST.atk };
      if (b.dead) { const lv0 = M.lvl; step(4.5); out.after = { lvl: +M.lvl.toFixed(2), drain: +M.drain.toFixed(2), sun: +M.sun.toFixed(2), tolled: !!M.tolled, corpse: !!M.corpse, cine: D.RIFT.self.cine && D.RIFT.self.cine.kind, tele: S.tele.length }; }
      return out;`, { cap: +(process.env.CAP || 600) });
    console.log(`run ${run}: ${R.t} s (${(R.t / 60).toFixed(2)} min) won ${R.won} hpLeft ${R.hpLeft} kit ${R.kit} melee ${R.melee} pet ${JSON.stringify(R.pet)} deaths ${R.deaths} minHp ${(R.minHp * 100).toFixed(0)}% hits ${R.hits.length} (${R.hits.reduce((a, h) => a + h.d, 0)} dmg)`);
    console.log('  log', JSON.stringify(R.log)); console.log('  stat', JSON.stringify(R.stat)); if (process.env.HITS) console.log('  hits', JSON.stringify(R.hits));
    times.push(R.won ? R.t : 1e9); ok(R.won && R.t < 600, 'a level-10 bot (a fresh random pet) using the mechanics beats Uldroth', { t: R.t, deaths: R.deaths });
    ok(R.stat.floods >= 1 && R.stat.floodSafe >= 1 && R.stat.surges >= 1 && R.stat.valves >= 2 && R.stat.waves >= 2, 'the bot met the Drowning Bell, a surge with leeches and the waves', { floods: R.stat.floods, safe: R.stat.floodSafe, surges: R.stat.surges, valves: R.stat.valves, waves: R.stat.waves });
    if (R.after) { ok(R.after.lvl < -2 && R.after.drain > 0.95 && R.after.tolled && R.after.sun > 0.5 && R.after.corpse && R.after.tele === 0, 'the fall: the sea drained below the rim, the bell sounded, the sun; nothing left to strike', R.after);
      ok(R.after.cine === 'seal', 'then the rift\'s sealing (Tide) begins', R.after.cine); } }
  if (times.length) { const srt = times.slice().sort((p, q) => p - q), med = srt[Math.floor(srt.length / 2)]; ok(med > 180 && med < 330, 'the bots\' median fight lasts about 4 minutes (3 to 5.5)', { times, median: med }); }
  console.log('page errors', errors.length, errors.slice(0, 6)); ok(errors.length === 0, '0 page errors');
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok`);
  await browser.close(); process.exit(bad ? 1 : 0);
})();
