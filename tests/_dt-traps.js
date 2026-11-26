// v433 DT: the dune traps' rules, stepped synchronously on a real stage of each land: each kind hits only in its own area and
// only after its tell, a dodge roll passes, the first of a kind is a harmless demo, the blow is the floor's own (the rift's
// foeK does not double it: traps are not foes; a monster's blow is doubled, for contrast), monsters caught take twice it,
// mini bosses never; the sink pulls, the hands hold, the gas chokes, the quicksand swallows a lingerer and lets a walker by,
// the mirage slows harmlessly; lowFx draws; everything is let go when the stage closes.
// HTML=test-dt.html node tests/_dt-traps.js
const L = require('./_dt-lib.js'); const { results, ok } = L.reporter();
(async () => { const { browser, page, errors } = await L.open();
  const LAND = { 0: ['sink', 'tooth', 'res'], 3: ['vent', 'shard', 'mirage'], 6: ['hands', 'quick', 'gas'] };   // v460 R3: the eight-stage route
  for (const st of [0, 3, 6]) {   // v460 R3: the three dungeons (the eight-stage route)
    await L.stage(page, st);
    const r = await page.evaluate((kinds) => { const D = window.__pp.arc.game._dbg, XH = window.__XH, X = XH.X, F = XH.self.dtraps, DT = self.DUNE_TRAPS, me = D.me, g = D.g, out = {};
      D.mons.length = 0; if (g.reserve) g.reserve.length = 0; F.freeze = true; F.teach = false; g.intro = 0; window.__pp.st.dun.god = false;
      const fk = X.F.rift.foeK; out.foeK = fk ? fk.dmg : null;
      const reset = () => { for (const q of F.traps) { q.st = 'idle'; q.t = 0; q.n = 0; q.demo = false; q.stuck = 0; q.sink = 0; } F.hold = F.choke = F.sinkT = F.sinkCd = 0; if (g.mvMods) for (const k in g.mvMods) if (/^dt/.test(k)) delete g.mvMods[k]; me.hp = X.ST().hp; me.inv = 0; me.dodge = null; me.dead = false; me.push = null; };
      const run = (s, dt) => { for (let t = 0; t < s; t += dt || 1 / 60) { me.inv = 0; F.tick(dt || 1 / 60); } };
      const far = () => { me.x = -500; me.y = -500; };
      for (const kd of kinds) { const tp = F.traps.find(q => q.kind === kd && !q.bridge) || F.traps.find(q => q.kind === kd); const K = tp.K, R = { have: !!tp }; out[kd] = R; const ALL = F.traps; F.traps = [tp]; reset();   // (this one alone on the floor while it is tried)
        const cx = tp.x1 != null ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.y1 != null ? (tp.y + tp.y1) / 2 : tp.y;
        // where its blow lands: the middle (the sink's hole, the jaw's line, the ring's path, a shard's line)
        const hitAt = () => { if (kd === 'res') return [tp.x + 1.5, tp.y]; if (kd === 'shard') { const [ex, ey] = tp.rays[0]; return [tp.x + (ex - tp.x) * 0.6, tp.y + (ey - tp.y) * 0.6]; } return [cx, cy]; };
        const safeAt = () => { if (kd === 'res') return [tp.x + 3.6, tp.y]; if (kd === 'shard') { const a0 = Math.atan2((tp.rays[0][1] - tp.y) / 0.7, tp.rays[0][0] - tp.x) + Math.PI / 5; return [tp.x + Math.cos(a0) * 1.4, tp.y + Math.sin(a0) * 1.4 * 0.7]; } if (kd === 'tooth') return tp.o === 'v' ? [cx + 1.4, cy] : [cx, cy + 1.4]; return [cx + (tp.R || 1) + 0.9, cy]; };
        if (K.per || K.trig || kd === 'sink' || kd === 'tooth') {
          // 1. it tells before it strikes: no harm in its warn; the blow in its burst
          const [hx, hy] = hitAt(); me.x = hx; me.y = hy; const hp0 = me.hp; tp.on = true;
          if (K.per) { tp.t = tp.period - K.warn - K.burst - 0.05; } run(0.1); R.warned = tp.st === 'warn'; const hpWarn = me.hp;
          if (kd === 'sink') { me.x = cx + 0.5; me.y = cy; } run(K.warn); if (kd === 'sink') { R.pulled = Math.hypot(me.x - cx, me.y - cy) < 0.5 - 0.05; me.x = cx; me.y = cy; }
          if (kd === 'res') { /* the ring reaches 1.5 tiles part way through its burst */ }
          run(K.burst + 0.05); R.loss = hp0 - me.hp; R.noHarmInWarn = hpWarn === hp0; R.dmg = DT.dmg(F, kd); R.hold = !!(g.mvMods && g.mvMods.dthold) || F.hold > 0; R.choke = F.choke > 0;
          // 2. the same blow with the rift's foe multiplier at 1: the same (not doubled)
          reset(); if (fk) { const was = fk.dmg; fk.dmg = 1; me.x = hx; me.y = hy; tp.on = true; if (K.per) tp.t = tp.period - K.warn - K.burst - 0.05; run(0.1); run(K.warn + K.burst + 0.05); R.lossK1 = X.ST().hp - me.hp; fk.dmg = was; }
          // 3. a dodge roll passes through it
          reset(); me.x = hx; me.y = hy; tp.on = true; if (K.per) tp.t = tp.period - K.warn - K.burst - 0.05; run(0.1); run(K.warn - 0.15); me.dodge = { t: 0.3 }; run(K.burst + 0.25); R.dodgeLoss = X.ST().hp - me.hp; me.dodge = null;
          // 4. off its area: no harm (a periodic one still fires; a triggered one is set off by hand)
          reset(); const [sx, sy] = safeAt(); me.x = sx; me.y = sy; tp.on = true; if (K.per) tp.t = tp.period - K.warn - K.burst - 0.05; else { tp.st = 'warn'; tp.t = 0; } run(K.warn + K.burst + 0.2); R.safeLoss = X.ST().hp - me.hp; R.fired = tp.n;
          // 5. the demo: harmless
          reset(); me.x = hx; me.y = hy; tp.on = true; tp.demo = true; if (K.per) tp.t = tp.period - K.warn - K.burst - 0.05; else { tp.st = 'warn'; tp.t = 0; } run(K.warn + K.burst + 0.2); R.demoLoss = X.ST().hp - me.hp;
          // 6. a monster caught takes twice the blow; a mini boss none
          reset(); { const [sx, sy] = safeAt(); me.x = sx; me.y = sy; } const m = X.spawnMon(window.__pp.RIFT_BY_ID.dunes.mons[0], hx, hy, { pack: 990 }); m.hp = m.maxhp = 1e6; m.inv = 0; const mb = { x: hx, y: hy, r: 0.5, hp: 1e6, maxhp: 1e6, lesser: true, boss: true, type: 'skitter' }; D.mons.push(mb);
          tp.on = true; if (K.per) tp.t = tp.period - K.warn - K.burst - 0.05; else { tp.st = 'warn'; tp.t = 0; } for (let t = 0; t < K.warn + K.burst + 0.1; t += 1 / 60) { m.x = hx; m.y = hy; m.vx = m.vy = 0; mb.x = hx; mb.y = hy; me.inv = 9; F.tick(1 / 60); }
          R.monLoss = 1e6 - m.hp; R.miniLoss = 1e6 - mb.hp; D.mons.length = 0; R.idle = K.per ? tp.period - K.warn - K.burst : K.rest;
        } else {
          // the zones: walking across is slowed (and, for the quicksand, unharmed); lingering in the quicksand swallows a little
          me.x = cx; me.y = cy; tp.on = true; run(0.3); R.slow = g.mvMods && g.mvMods.dtzone; const hp0 = me.hp; run(1.0); R.crossLoss = hp0 - me.hp;
          reset(); me.x = cx; me.y = cy; tp.on = true; run(2.2); R.lingerLoss = X.ST().hp - me.hp; R.pushedOut = !!me.push; R.dmg = DT.dmg(F, kd);
          reset(); far(); run(0.1); R.slowGone = !(g.mvMods && g.mvMods.dtzone); }
        F.traps = ALL; }
      // a monster's own blow, for contrast: doubled by the rift's foeK
      reset(); far(); me.x = 0; me.y = 0; const mm = { x: 0, y: 0, r: 0.4, hp: 10, maxhp: 10, dmg: 10 }; const h0 = me.hp; me.inv = 0; X.hurtPet(20, mm); out.monBlow = h0 - me.hp; reset(); me.inv = 0; const h1 = me.hp; X.hurtPet(20, null); out.trapBlow = h1 - me.hp;
      // lowFx: the drawing runs (no throw) with the motes thinned
      try { window.__pp.st.lowFx = true; F.traps.forEach(q => { q.st = 'warn'; q.t = 0.5; }); const c = document.createElement('canvas').getContext('2d'); F.drawGround(c); F.drawOver(c); out.lowFxOk = true; } catch (e) { out.lowFxOk = String(e); } window.__pp.st.lowFx = false; reset();
      out.cached = DT.stats.cached; return out; }, LAND[st]);
    console.log(JSON.stringify(r));
    for (const kd of LAND[st]) { const R = r[kd]; if (!R.have) { ok(`${kd}: on the floor`, false); continue; }
      if (R.dmg != null && R.loss != null) {
        ok(`${kd}: no harm while it tells; its blow in its burst (the floor's own: ${R.dmg.toFixed(1)})`, R.noHarmInWarn && R.loss > 0 && R.warned, { loss: R.loss, dmg: R.dmg });
        ok(`${kd}: not doubled by the rift's foe multiplier (traps are not foes)`, Math.abs(R.loss - R.lossK1) < 0.01, { foeK: r.foeK, loss: R.loss, lossAtK1: R.lossK1 });
        ok(`${kd}: a dodge roll passes; off its area no harm though it fired; its demo is harmless`, R.dodgeLoss === 0 && R.safeLoss === 0 && R.fired > 0 && R.demoLoss === 0, { dodge: R.dodgeLoss, safe: R.safeLoss, fired: R.fired, demo: R.demoLoss });
        ok(`${kd}: a monster caught takes twice the blow; a mini boss none`, Math.abs(R.monLoss - 2 * R.dmg) < 1 + R.dmg * 0.6 && R.monLoss > R.dmg * 1.2 && R.miniLoss === 0, { mon: R.monLoss, dmg: R.dmg, mini: R.miniLoss });
        ok(`${kd}: a fair window between blows (${R.idle.toFixed(1)} s)`, R.idle >= 2.0, {});
        if (kd === 'sink') ok('sink: its swirl pulls toward its hole', R.pulled === true, {});
        if (kd === 'hands') ok('hands: their grab holds the pet a moment', R.hold === true, {});
        if (kd === 'gas') ok('gas: its cloud leaves the pet choking (slowed)', R.choke === true, {}); }
      else { ok(`${kd}: slows inside (x${R.slow}), lets go outside`, R.slow > 0 && R.slow < 1 && R.slowGone, R);
        if (kd === 'quick') ok('quick: walking across unharmed; lingering swallowed a little and pushed out', R.crossLoss === 0 && R.lingerLoss > 0 && R.lingerLoss < R.dmg * 1.5 && R.pushedOut, R);
        else ok(`${kd}: harmless`, R.crossLoss === 0 && R.lingerLoss === 0, R); } }
    ok(`stage ${st}: a monster's blow is doubled by the rift (${r.monBlow.toFixed(1)} vs ${r.trapBlow.toFixed(1)} from no source)`, r.foeK === 2 && Math.abs(r.monBlow - 2 * r.trapBlow) < 0.6, { foeK: r.foeK });
    ok(`stage ${st}: lowFx draws`, r.lowFxOk === true, r.lowFxOk);
  }
  // the stage closed: the field and the pictures let go
  await page.evaluate(() => { try { window.__pp.closeArcade(); } catch (e) {} }); await page.waitForTimeout(1500);
  const rel = await page.evaluate(() => { const s = self.DUNE_TRAPS.stats; return { cached: s.cached, live: s.live, released: s.released }; });
  ok('the stage closed: its traps and pictures let go', rel.cached === 0 && rel.live === 0 && rel.released > 0, rel);
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
