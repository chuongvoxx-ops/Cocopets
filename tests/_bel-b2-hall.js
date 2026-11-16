// The Drowned Belfry · the Hall of Three Tides (worker B2): gate orders, the three trials, crystals, recovery, the door.
// (the logic is stepped directly, arc.game.update(1/30) without drawing, so long trials run in seconds on the slow headless page)
// HTML=test-belB2.html node tests/_bel-b2-hall.js [smoke|orders|east|west|north|reload|dup|door|shots|perf]   (SHOTS=1 for pictures)
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const { open } = require('./_rift-lib');
const want = process.argv.slice(2), on = k => !want.length || want.includes(k);
const results = [];
// (the shared helper's page, with patient timeouts: the headless page is very slow when the machine is loaded)
async function openLong(o) { const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: process.env.SHOTS ? 2 : 1, hasTouch: true }); page.setDefaultTimeout(240000);
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML), { timeout: 240000 }); await page.waitForFunction(() => window.__pp, null, { timeout: 240000 });
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = o.lvl; P.st.dun.best = Math.max(P.st.dun.best || 0, 10); P.openMap(); P.dun.setMapTab('rift', true); }, o);
  const start = async (id, stage) => { await page.evaluate(([id, stage]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(id, stage); }, [id, stage]); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 240000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 240000 }); };
  return { browser, page, errors, start }; }
const ok = (name, pass, info) => { results.push([name, pass]); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' · ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''}`); };
(async () => {
  const T = await openLong({ lvl: 10 }); const { page, errors } = T;
  // make sure the hall is the rift's first stage (B1 puts it there; a build without it gets it inserted for the test)
  const idx = await page.evaluate(() => { const Rf = window.__pp.RIFT_BY_ID.belfry; let i = Rf.stages.findIndex(s => s && s.name === 'The Hall of Three Tides' && s.make === self.BELFRY_HALL.stage.make); if (i < 0) { Rf.stages.unshift(Object.assign({ biome: Rf.biome }, self.BELFRY_HALL.stage, { kind: 'puzzle', trial: true })); i = 0; } return i; });
  const fresh = () => page.evaluate(() => { window.__pp.st.dun.god = false; const RS = window.__pp.riftState(); if (RS.hall) delete RS.hall.belfry; RS.prog.belfry = 0; });
  const start = async () => { for (let k = 0; ; k++) { try { await T.start('belfry', idx); break; } catch (e) { if (k >= 3) throw e; } } await page.evaluate(() => { window.__pp.st.dun.god = false; }); };
  const D = () => 'window.__pp.arc.game._dbg';
  const runG = (secs, o) => page.evaluate(async ([secs, o]) => { const D = window.__pp.arc.game._dbg, t0 = D.g.t; while (D.g.t - t0 < secs) { window.__pp.arc.game.update(1 / 30); if (!D.RIFT) break; if (o && o.heal && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (o && o.stay) { D.me.x = o.stay[0]; D.me.y = o.stay[1]; D.me.vx = D.me.vy = 0; } if (o && o.attack) { D.g.tapBuf = 0.3; D.g.taps = 9; } if (o && o.until && eval(o.until)) break; } return D.g.t - t0; }, [secs, o || null]);
  const hall = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.RIFT.self.mod, PS = M.PS(); return { PS: Object.assign({}, PS), goal: M.goal ? document.getElementById('arcGoal').textContent : '', states: Object.fromEntries(Object.entries(M.trials).map(([k, t]) => [k, t.state])), done: D.RIFT.self.done, lock: !!D.g.trialLock, dodgeK: D.g.dodgeK, me: { x: +D.me.x.toFixed(1), y: +D.me.y.toFixed(1), hp: Math.round(D.me.hp) } }; });
  const goTo = (x, y) => page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; }, [x, y]);
  const use = async (kind, B) => { await page.evaluate(([kind, B]) => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === kind && o.B === B); D.me.x = o.x + 0.3; D.me.y = o.y + 0.25; D.me.vx = D.me.vy = 0; o.used = false; o.ch = 0; }, [kind, B]); await runG(1.0); };
  const shot = async n => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-b2-${n}.png`) }); };
  // fast paths: win a chosen trial by script (the real rules run: boundary, cue, the trial's own counters)
  const enter = async B => { const p = { E: [70, 54.5], W: [33.5, 54.5], N: [52.5, 35.5] }[B]; await goTo(p[0], p[1]); await runG(B === 'E' ? 1.6 : 3.4); };
  const winFast = async B => page.evaluate(async B => { const D = window.__pp.arc.game._dbg, M = D.RIFT.self.mod, T = M.trials[B];
    if (B === 'E') { for (let k = 0; k < 400 && T.bossState !== 'fight'; k++) { for (const m of T.list) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); window.__pp.arc.game.update(1 / 30); } for (let k = 0; k < 300 && T.state !== 'won'; k++) { if (T.V && !T.V.m.dead && T.V.V.act !== 'emerge') D.hitMon(T.V.m, 1e9, { flat: true }); window.__pp.arc.game.update(1 / 30); } }
    if (B === 'W') { T.deadline = D.g.t + 0.05; for (let k = 0; k < 60 && T.state !== 'won'; k++) window.__pp.arc.game.update(1 / 30); }
    if (B === 'N') { for (let k = 0; k < 200 && T.state !== 'won'; k++) { const live = T.rol.filter(r => r.alive); for (let i = 0; i + 1 < live.length; i += 2) { const a = live[i], b = live[i + 1]; b.x = a.x + 0.5; b.y = a.y; a.s = 'roll'; a.dx = 1; a.dy = 0; } window.__pp.arc.game.update(1 / 30); } }
    return T.state; }, B);
  const collectBack = async B => { await page.evaluate(B => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'belcrystal' && o.B === B); D.me.x = o.x + 0.3; D.me.y = o.y + 0.6; o.used = false; o.ch = 0; }, B); await runG(1.0); await use('belsocket', B); };

  if (on('smoke')) { await fresh(); await start(); await runG(2); const h = await hall(); ok('smoke: the hall opens', !!h && h.PS.dep === '', h); await shot('hall'); }
  if (on('orders')) {
    const perms = ['EWN', 'ENW', 'WEN', 'WNE', 'NEW', 'NWE'];
    for (const ord of perms) { await fresh(); await start(); let good = true; const log = [];
      for (const B of ord) { await use('belgate', B); let h = await hall(); if (h.PS.sel !== B) { good = false; log.push('sel ' + B + ' ' + h.PS.sel); }
        // the other unfinished gates refuse while one is chosen
        const other = ord.split('').find(k => k !== B && !h.PS.dep.includes(k)); if (other) { await use('belgate', other); const h2 = await hall(); if (h2.PS.sel !== B) { good = false; log.push('other opened'); } }
        await enter(B); const st = await winFast(B); if (st !== 'won') { good = false; log.push('win ' + B + ' ' + st); }
        h = await hall(); if (!h.PS.earn.includes(B)) { good = false; log.push('earn'); }
        await collectBack(B); h = await hall(); if (!h.PS.dep.includes(B) || h.PS.carry) { good = false; log.push('dep ' + JSON.stringify(h.PS)); } }
      await runG(7.5); const h = await hall(); if (!(h.done && h.PS.door === 1)) { good = false; log.push('door ' + JSON.stringify(h)); }
      ok(`order ${ord.split('').join(' > ')}`, good, log.join('; ') || 'three deposited, the door is open'); }
  }
  if (on('east')) { await fresh(); await start(); await use('belgate', 'E'); await enter('E');
    // the muster: fight by killing whatever is alive; count groups and kills, Varkul excluded
    const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.E, seen = []; let maxAlive = 0;
      for (let k = 0; k < 3000 && T.bossState === 'pending'; k++) { const alive = T.list.filter(m => !m.dead); maxAlive = Math.max(maxAlive, alive.length); if (!seen[T.group]) seen[T.group] = { crawler: T.list.slice((T.group - 1) * 10).filter(m => m.type === 'crawler').length, leech: T.list.slice((T.group - 1) * 10).filter(m => m.type === 'leech').length }; const m = alive[0]; if (m) D.hitMon(m, 1e9, { flat: true }); D.me.hp = D.ST.hp; window.__pp.arc.game.update(1 / 30); }
      return { kills: T.kills, spawned: T.list.length, groups: T.group, perGroup: seen.filter(Boolean), maxAlive, boss: T.bossState, varkulInList: T.list.some(m => m.varkul) }; });
    ok('east: exactly 50 ordinary monsters in 5 groups of 10 (8 crawlers + 2 leeches)', r.kills === 50 && r.spawned === 50 && r.groups === 5 && r.perGroup.every(g => g.crawler === 8 && g.leech === 2) && r.maxAlive <= 10 && !r.varkulInList, r);
    await runG(3.2, { heal: true }); const v = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.E; return T.V ? { name: T.V.m.bname, hp: Math.round(T.V.m.maxhp), act: T.V.V.act, inMuster: T.list.includes(T.V.m), kills: T.kills } : null; });
    ok('east: the bell rings and Varkul is released, not counted in the 50', !!v && v.name === 'Varkul, the Chainbound' && !v.inMuster && v.kills === 50, v);
    // his moves: breath and sweep, with recovery windows between them
    const acts = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.E, V = T.V.V, seen = new Set(), order = []; const t0 = D.g.t; while (D.g.t - t0 < 22 && T.V && !T.V.m.dead) { window.__pp.arc.game.update(1 / 30); D.me.hp = D.ST.hp; D.me.x = T.V.m.x + Math.cos(V.hd) * 2.6; D.me.y = T.V.m.y + Math.sin(V.hd) * 2.6; if (order[order.length - 1] !== V.act) order.push(V.act); seen.add(V.act); if (window.__SHOTK && (V.act === 'breath' || V.act === 'sweepW')) { window.__SHOTK = 0; window.__SHOTAT = V.act; break; } } return { order: order.slice(0, 14), stats: V.stats }; });
    ok('east: Varkul alternates Brine Breath and Clapper Sweep with recovery', acts.order.includes('breath') && acts.order.includes('sweep') && acts.order.filter(a => a === 'rec').length >= 2, acts);
    // the time a level-10 pet's ordinary attacks take to bring him down (the tuning check)
    const ttk = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.E, m = T.V.m; m.hp = m.maxhp; const t0 = D.g.t; while (D.g.t - t0 < 90 && !m.dead) { window.__pp.arc.game.update(1 / 30); D.me.hp = D.ST.hp; D.me.mp = 999; D.me.x = m.x - 2.4; D.me.y = m.y + 0.5; D.g.tapBuf = 0.3; D.g.taps = 9; D.g.tapAim = { x: 1, y: 0, a: 0, t: m }; D.me.face = 1; if (D.g.cdS <= 0) D.useStrong('strong'); if (D.g.cdU <= 0) D.useUlt(); } return { secs: +(D.g.t - t0).toFixed(1), dead: m.dead, hp: Math.round(m.maxhp), atk: Math.round(D.ST.atk), lvl: window.__pp.st.dlv }; });
    ok('east: Varkul at level 10 (a quarter of Kharrox) falls in about 20-40 s of attacks and skills', ttk.dead && ttk.secs > 15 && ttk.secs < 45, ttk);
    await runG(2.5); const w = await hall(); ok('east: the coral cage falls only after the 50 and Varkul', w.states.E === 'won' && w.PS.earn.includes('E'), w.states);
    // a wipe resets the branch only: restart, deposit E, then fail W and check E stays
  }
  if (on('west')) { await fresh(); await start(); await use('belgate', 'W'); await enter('W');
    const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.W; await new Promise(r => setTimeout(r, 50)); const w1 = T.log[0]; const left0 = T.deadline - D.g.t;
      for (const m of T.all) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); for (let k = 0; k < 20; k++) window.__pp.arc.game.update(1 / 30); const w2 = T.log[1];
      return { w1, w2, left0: +left0.toFixed(1), leftAfter: +(T.deadline - D.g.t).toFixed(1), wave: T.wave }; });
    ok('west: 60 per wave (20 per approach), a new full wave on clear, the one timer never reset', r.w1 && r.w1.n === 60 && r.w1.per.every(n => n === 20) && r.w2 && r.w2.n === 60 && r.wave === 2 && r.leftAfter <= r.left0 && r.left0 <= 30.01, r);
    // the strike places: at most six attacking, with wind-ups
    const q = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.W; let maxWind = 0, maxSlot = 0; const t0 = D.g.t; while (D.g.t - t0 < 7 && T.state === 'run') { window.__pp.arc.game.update(1 / 30); D.me.x = 33; D.me.y = 54.5; D.me.hp = D.ST.hp; const att = T.all.filter(m => !m.dead && m.gn && (m.gn.s === 'wind' || m.gn.s === 'rec' || m.gn.s === 'slot')); maxSlot = Math.max(maxSlot, att.length); maxWind = Math.max(maxWind, T.all.filter(m => !m.dead && m.gn && m.gn.s === 'wind').length); if (maxWind >= 4 && window.__SH) break; } return { maxWind, maxSlot, integ: T.integ, bites: T.bites }; });
    ok('west: at most six attackers at the pedestal, each with a visible wind-up', q.maxSlot <= 6 && q.maxWind >= 1, q);
    // ignoring the assault fails within the timer
    const ig = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.RIFT.self.mod, T = M.trials.W; const t0 = D.g.t; while (D.g.t - t0 < 32 && T.state === 'run') { window.__pp.arc.game.update(1 / 30); D.me.x = 33; D.me.y = 54.5; D.me.hp = D.ST.hp; } return { state: T.state, sel: M.PS().sel, at: +(D.g.t - t0).toFixed(1) }; });
    ok('west: ignored, the crystal breaks before the deadline; the branch resets to the hall', ig.state === 'idle' && ig.sel === '', ig);
    // deadline versus break, resolved by timestamps: a bite at the deadline that empties it fails; one after it is cancelled
    await use('belgate', 'W'); await enter('W');
    const dv = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.RIFT.self.mod, T = M.trials.W; T.integ = 3; const dl = T.deadline; T.ev.push({ t: dl + 0.001, d: 99, m: null }); D.g.t = dl + 0.01; window.__pp.arc.game.update(1 / 30); window.__pp.arc.game.update(1 / 30); const a = { state: T.state, integ: T.integ };
      M.useGate('W'); return a; });
    await page.evaluate(() => {}); const h0 = await hall();
    ok('west: a bite after the deadline is cancelled; the crystal survives (success)', dv.state === 'won' && dv.integ === 3, dv);
    await fresh(); await start(); await use('belgate', 'W'); await enter('W');
    const dv2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.RIFT.self.mod, T = M.trials.W; T.integ = 3; const dl = T.deadline; T.ev.push({ t: dl - 0.001, d: 3, m: null }); D.g.t = dl + 0.01; window.__pp.arc.game.update(1 / 30); window.__pp.arc.game.update(1 / 30); return { state: T.state, sel: M.PS().sel, earn: M.PS().earn }; });
    ok('west: a bite at/before the deadline that breaks it wins over the deadline (failure)', dv2.state === 'idle' && dv2.earn === '' && dv2.sel === '', dv2);
    // a responsive pet (it attacks the nearest gnawer at the pedestal) protects the crystal
    await use('belgate', 'W'); await enter('W');
    const bot = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.W, cx = T.crystalAt.x, cy = T.crystalAt.y; const t0 = D.g.t; let n = 0;
      while (D.g.t - t0 < 34 && T.state === 'run') { window.__pp.arc.game.update(1 / 30); D.me.hp = D.ST.hp; D.me.mp = 999;
        const att = T.all.filter(m => !m.dead).sort((a, b) => ((a.gn && a.gn.s === 'wind' ? -9 : 0) + Math.hypot(a.x - cx, a.y - cy)) - ((b.gn && b.gn.s === 'wind' ? -9 : 0) + Math.hypot(b.x - cx, b.y - cy)))[0];
        if (att) { const dx = D.me.x - att.x, dy = D.me.y - att.y, d = Math.hypot(dx, dy); if (d > 2.2) { D.me.x -= dx / d * 5 * 0.016; D.me.y -= dy / d * 5 * 0.016; } const a = Math.atan2(att.y - D.me.y, att.x - D.me.x); D.g.tapBuf = 0.3; D.g.taps = 9; D.g.tapAim = { x: Math.cos(a), y: Math.sin(a), a, t: att }; } }
      return { state: T.state, integ: Math.round(T.integ), waves: T.wave, bites: T.bites, foamed: T.foamed }; });
    ok('west: a responsive level-10 pet holds for 30 s; the rest dissolve to foam', bot.state === 'won', bot);
    await shot('west-won');
  }
  if (on('north')) { await fresh(); await start(); await use('belgate', 'N');
    const h0 = await hall(); await goTo(52.5, 36); await runG(0.6); const h1 = await hall();
    ok('north: abilities lock at the boundary (cue)', !h0.lock && h1.lock && h1.dodgeK < 1, { before: h0.lock, after: h1.lock, dodgeK: h1.dodgeK });
    await runG(3.0);
    const cnt = await page.evaluate(() => { const T = window.__pp.arc.game._dbg.RIFT.self.mod.trials.N; return { n: T.rol.length, alive: T.rol.filter(r => r.alive).length, left: T.left, state: T.state }; });
    ok('north: exactly 100 rollers, "Enemies remaining: 100"', cnt.n === 100 && cnt.alive === 100 && cnt.left === 100 && cnt.state === 'run', cnt);
    // try to attack: nothing happens, rollers untouched; the pet is visible and targetable
    const lk = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, sh0 = D.shots ? D.shots.length : 0; D.g.tapBuf = 0.3; D.g.taps = 9; window.__pp.arc.game.update(1 / 30); window.__pp.arc.game.update(1 / 30); return { shots: (D.shots ? D.shots.length : 0) - sh0, lock: D.g.trialLock }; });
    ok('north: a tap attack does nothing while locked', lk.shots <= 0 && lk.lock, lk);
    // the bot: dodge-roll away from every launch (the rollers must destroy each other)
    const bot = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.N, C = { x: 52.5, y: 22.5 }; const t0 = D.g.t; let rolls = 0, minLeft = 100, odd = false, prev = 100, under = false;
      while (D.g.t - t0 < 150 && T.state === 'run') { window.__pp.arc.game.update(1 / 30); D.me.hp = D.ST.hp;
        // drift toward the cistern's middle, and roll sideways out of any line about to launch
        const spin = T.rol.filter(r => r.alive && r.s === 'spin' && r.spinT - r.t < 0.35); const k = D.keys || window.__pp.arc.api && window.__pp.arc.api.keys;
        const dx = C.x - D.me.x, dy = C.y - D.me.y, d = Math.hypot(dx, dy); if (d > 3) { D.me.x += dx / d * 0.05; D.me.y += dy / d * 0.05; }
        if (spin.length && !D.me.dodge && D.g.dodgeCd <= 0) { const r = spin[0], px = -r.dy, py = r.dx; D.me.dodge = { t: 0, dur: 0.3, vx: px * 12.5, vy: py * 12.5, perf: false }; D.me.inv = Math.max(D.me.inv, 0.06); D.g.dodgeCd = 0.85 * (D.g.dodgeK || 1); rolls++; }
        if (T.left % 2) odd = true; if (T.left < 0) under = true; minLeft = Math.min(minLeft, T.left); }
      return { state: T.state, left: T.left, rolls, pairs: T.pairs, petHits: T.hits, walls: T.walls, maxCommit: T.maxCommit, secs: +(D.g.t - t0).toFixed(1), odd, under, cost: +T.cost.toFixed(2), lock: D.g.trialLock, dodgeK: D.g.dodgeK }; });
    ok('north: all 100 eliminated only by collisions, in pairs, never odd or below zero', bot.state === 'won' && bot.left === 0 && !bot.odd && !bot.under, bot);
    ok('north: 8-12 committed rolls at a time at most', bot.maxCommit <= 12 && bot.maxCommit >= 6, { maxCommit: bot.maxCommit });
    ok('north: abilities restored on success', bot.lock === false && (bot.dodgeK === undefined || bot.dodgeK === 1), { lock: bot.lock, dodgeK: bot.dodgeK });
    // restoration on the other exits: failure (knockout), leaving, reload
    await collectBack('N');
    for (const how of ['ko', 'leave', 'reload']) { await fresh(); await start(); await use('belgate', 'N'); await goTo(52.5, 36); await runG(3.6); const a = await hall();
      if (how === 'ko') await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.inv = 0; D.me.dodge = null; D.hurtPet ? D.hurtPet(1e9) : (D.me.hp = 0); });
      if (how === 'ko') await page.evaluate(() => { const D = window.__pp.arc.game._dbg; if (D.me.hp > 0 && D.RIFT.self.mod) { D.g.koHook && (D.me.hp = 0, D.g.koHook()); } });
      if (how === 'leave') { await goTo(52.5, 50); }
      if (how === 'reload') { await start(); }
      await runG(0.5); const b = await hall();
      ok(`north: abilities restored after ${how}`, a.lock && !b.lock && (b.dodgeK === undefined || b.dodgeK === 1) && b.states.N === 'idle' && b.PS.sel === '' + (how === 'reload' ? 'N' : ''), { locked: a.lock, after: b.lock, dodgeK: b.dodgeK, N: b.states.N, sel: b.PS.sel }); }
  }
  if (on('reload')) { await fresh(); await start(); await use('belgate', 'E'); await enter('E'); await winFast('E');
    // earned but not collected: a reload exposes it again
    await start(); let h = await hall(); ok('reload: an earned crystal is waiting again after a reload', h.PS.sel === 'E' && h.PS.earn === 'E' && h.states.E === 'won' && !h.PS.carry, h.PS);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, o = D.RIFT.objs.find(o => o.kind === 'belcrystal' && o.B === 'E'); D.me.x = o.x + 0.3; D.me.y = o.y + 0.6; o.used = false; }); await runG(1.0);
    h = await hall(); const carried = h.PS.carry === 'E';
    await start(); h = await hall(); const bub = await page.evaluate(async () => { for (let k = 0; k < 5; k++) window.__pp.arc.game.update(1 / 30); const M = window.__pp.arc.game._dbg.RIFT.self.mod; return !!M.S.bub; });
    ok('reload: a carried crystal is still carried (bubble restored), no duplicate', carried && h.PS.carry === 'E' && h.PS.dep === '' && bub, { PS: h.PS, bub });
    // and the save survives a serialise / load round trip
    const rt = await page.evaluate(() => { const P = window.__pp; const s = JSON.parse(JSON.stringify(P.st)); return s.rift && s.rift.hall && s.rift.hall.belfry; });
    ok('reload: the hall state is in the save', !!rt && rt.carry === 'E', rt);
  }
  if (on('dup')) { await fresh(); await start(); await use('belgate', 'W'); await enter('W'); await winFast('W'); await collectBack('W');
    const r = await page.evaluate(() => { const M = window.__pp.arc.game._dbg.RIFT.self.mod, a = M.deposit('W'), b = M.deposit('W'), c = M.deposit('E'), d = M.collect('W'); return { a, b, c, d, PS: Object.assign({}, M.PS()) }; });
    ok('dup: repeated or stray deposits and pickups change nothing', !r.a && !r.b && !r.c && !r.d && r.PS.dep === 'W' && r.PS.carry === '', r);
    // a completed branch cannot be farmed: its gate refuses
    await use('belgate', 'W'); const h = await hall(); ok('dup: a completed branch cannot be chosen again', h.PS.sel === '', h.PS);
  }
  if (on('door')) { await fresh(); await page.evaluate(() => { const RS = window.__pp.riftState(); RS.hall = RS.hall || {}; RS.hall.belfry = { sel: 'N', earn: 'EWN', carry: 'N', dep: 'EW', door: 0 }; }); await start();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, s = D.RIFT.objs.find(o => o.kind === 'belsocket' && o.B === 'N'); D.me.x = s.x; D.me.y = s.y + 0.5; }); await use('belsocket', 'N');
    const seq = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.RIFT.self.mod, S = M.S, out = []; let moved = null; const t0 = D.g.t; while (D.g.t - t0 < 9) { window.__pp.arc.game.update(1 / 30); out.push([+S.door.rise.toFixed(2), +S.door.part.toFixed(2)]); const f = { x0: 49.8, x1: 55.2, y0: 53.65, y1: 55.65 }; if (S.door.rise > 0 && D.me.x > f.x0 && D.me.x < f.x1 && D.me.y > f.y0 && D.me.y < f.y1) moved = 'inside'; if (window.__DOORSHOT && S.door.rise > 0.5 && S.door.rise < 0.8) { window.__DOORSHOT = 0; break; } } return { rise: S.door.rise, part: S.door.part, open: S.door.open, exit: !!D.RIFT.exit, moved, prog: window.__pp.riftState().prog.belfry, cine: D.g.cineT }; });
    ok('door: three deposits raise the doorway, the pet is moved clear, the way opens and the checkpoint moves on', seq.rise === 1 && seq.part === 1 && seq.exit && !seq.moved && seq.prog >= 1 && !seq.cine, seq);
  }
  if (on('shots')) {
    await page.setViewportSize({ width: 390, height: 844 });
    page.setDefaultTimeout(240000);
    const GPUFX = new Set(['north-roll']);   // (the GPU light layer too: on the software rasteriser a frame of it costs many seconds)
    const snap = async n => { const vg = !!process.env.VGL && /^varkul/.test(n); await page.evaluate(([g, vg]) => { window.__VARKUL_GL = vg ? 1 : 0; window.__NG_GL = g ? 1 : 0; }, [GPUFX.has(n), vg]); await page.waitForTimeout(GPUFX.has(n) || vg ? 45000 : 4000); const r = await page.screenshot({ path: path.resolve(__dirname, `../shots/bel-b2-${n}.png`) }); await page.evaluate(() => { window.__VARKUL_GL = 0; window.__NG_GL = 0; }); return r; };
    const fs = require('fs'), have = n => process.env.KEEP && fs.existsSync(path.resolve(__dirname, `../shots/bel-b2-${n}.png`));
    await fresh(); await start(); await goTo(52.5, 60); await runG(1.2); if (!have('hall')) await snap('hall');
    await goTo(52.5, 47); await runG(0.4); if (!have('gates')) await snap('gates');
    // east mid-fight
    await use('belgate', 'E'); await enter('E'); await runG(2.5, { heal: true, stay: [78, 55] }); await snap('east-muster');
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.E; for (let k = 0; k < 600 && T.bossState !== 'fight'; k++) { for (const m of T.list) if (!m.dead) D.hitMon(m, 1e9, { flat: true }); window.__pp.arc.game.update(1 / 30); } });
    await runG(2.2, { heal: true, stay: [82, 52] });
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.E, V = T.V.V; const t0 = D.g.t; while (D.g.t - t0 < 15 && !(V.act === 'breathW' && V.t > 1.2)) { window.__pp.arc.game.update(1 / 30); D.me.hp = D.ST.hp; D.me.x = T.V.m.x + Math.cos(V.hd) * 3.2; D.me.y = T.V.m.y + Math.sin(V.hd) * 3.2 + 0.3; } });
    await snap('varkul-breath');
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, T = D.RIFT.self.mod.trials.E, V = T.V.V; const t0 = D.g.t; while (D.g.t - t0 < 15 && !(V.act === 'sweepW' && V.t > 1.2)) { window.__pp.arc.game.update(1 / 30); D.me.hp = D.ST.hp; D.me.x = T.V.m.x - Math.cos(V.hd) * 3.0; D.me.y = T.V.m.y - Math.sin(V.hd) * 3.0 + 0.3; } });
    await snap('varkul-sweep');
    const gl = await page.evaluate(() => { const V = self.BELFRY_VARKUL; return V.MODEL.__dbg.glStats; }); console.log('varkul GL', JSON.stringify(gl));
    // west mid-defence
    await fresh(); await start(); await use('belgate', 'W'); await enter('W'); await runG(6.5, { heal: true, stay: [27.5, 55.5], attack: true }); await snap('west-defence');
    // north mid-roll
    await fresh(); await start(); await use('belgate', 'N'); await goTo(52.5, 36); await runG(3.4); await runG(5, { heal: true, stay: [52.5, 24] }); await snap('north-roll');
    // collect + carry, the door rising
    await fresh(); await page.evaluate(() => { const RS = window.__pp.riftState(); RS.hall = RS.hall || {}; RS.hall.belfry = { sel: 'N', earn: 'EWN', carry: 'N', dep: 'EW', door: 0 }; }); await start(); await goTo(52.5, 50); await runG(1.0); await snap('carry');
    await use('belsocket', 'N'); await page.evaluate(() => { window.__DOORSHOT = 1; });
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; const t0 = D.g.t; while (D.g.t - t0 < 9 && !(S.door.rise > 0.55)) window.__pp.arc.game.update(1 / 30); }); await snap('door-rising');
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, S = D.RIFT.self.mod.S; const t0 = D.g.t; while (D.g.t - t0 < 9 && !(S.door.open >= 1)) window.__pp.arc.game.update(1 / 30); }); await runG(0.3); await snap('door-open');
  }
  if (on('perf')) {   // phone size (390 x 844): the logic's cost per step and the drawing's per frame, with 100 rollers and 60 gnawers out
    const meas = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg, G = window.__pp.arc.game; const w0 = performance.now(); for (let i = 0; i < 60; i++) { G.update(1 / 60); D.me.hp = D.ST.hp; } const upd = (performance.now() - w0) / 60;
      for (let i = 0; i < 2; i++) await new Promise(r => requestAnimationFrame(r)); D.g.prof = {}; const f0 = performance.now(); for (let i = 0; i < 6; i++) await new Promise(r => requestAnimationFrame(r)); const P = D.g.prof; D.g.prof = null; const o = {}; for (const k of ['world', 'ents', 'parts', 'fx', 'hud']) o[k] = +((P[k] || 0) / 6).toFixed(1); return { updateMs: +upd.toFixed(2), frameMs: +((performance.now() - f0) / 6).toFixed(0), draw: o, mons: D.mons.filter(m => !m.dead).length }; });
    await fresh(); await start(); await goTo(52.5, 36); await runG(0.5); const base = await page.evaluate(() => 0); await use('belgate', 'N'); await goTo(52.5, 34); await runG(3.6); await runG(2, { heal: true, stay: [52.5, 24] }); await goTo(52.5, 24);
    const n = await meas(); const nT = await page.evaluate(() => +window.__pp.arc.game._dbg.RIFT.self.mod.trials.N.cost.toFixed(3));
    await fresh(); await start(); await use('belgate', 'W'); await enter('W'); await runG(3, { heal: true, stay: [27, 54.5] }); const w = await meas();
    await fresh(); await start(); await goTo(52.5, 56); await runG(0.3); const h = await meas();
    console.log('perf (headless swiftshader, shared CPU: relative numbers) · hall', JSON.stringify(h), '· north 100 rollers', JSON.stringify(n), 'trial logic ms', nT, '· west 60 gnawers', JSON.stringify(w));
    ok('perf: measured at phone size', true); }
  console.log(`\n${results.filter(r => r[1]).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 8).join('\n'));
  await T.browser.close(); process.exit(errors.length || results.some(r => !r[1]) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
