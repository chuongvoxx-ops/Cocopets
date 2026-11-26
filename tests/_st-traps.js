// v463 ST: the Sepulchre traps' rules, stepped synchronously on a real stage of each land: each kind hits only in its own area and
// only after its tell, a dodge roll passes, the first of a kind is a harmless demo, the blow is the floor's own (no source: traps
// are not foes), monsters caught take twice it where the stage allows, mini bosses never; the pendulum strikes once a pass and
// only in its lane, the clock's hand only what it sweeps, the column only along its lane, the hands hold, the pool slows
// harmlessly; the Statues and the Rolling Hour never touch their monsters; lowFx draws; everything is let go when the stage closes.
// HTML=<test build> node tests/_st-traps.js
const L = require('./_st-lib.js'); const { results, ok } = L.reporter();
(async () => { const { browser, page, errors } = await L.open();
  const LAND = { 0: ['pend', 'clock', 'stall'], 4: ['swap', 'column', 'lance'], 7: ['glass', 'vhand', 'rift'] };
  for (const st of [0, 4, 7]) {
    await L.stage(page, st, 11);
    const r = await page.evaluate((kinds) => { const D = window.__pp.arc.game._dbg, XH = window.__XH, X = XH.X, F = XH.self.septraps, ST = self.SEP_TRAPS, me = D.me, g = D.g, out = {};
      D.mons.length = 0; if (g.reserve) g.reserve.length = 0; F.freeze = true; F.teach = false; g.intro = 0; window.__pp.st.dun.god = false;
      const fk = X.F.rift.foeK; out.foeK = fk ? fk.dmg : null;
      const reset = () => { for (const q of F.traps) { q.st = 'idle'; q.t = 0; q.n = 0; q.demo = false; q.stuck = 0; if (q.kind === 'pend') { q.pcd = 0; q.hm.clear(); } } F.hold = 0; if (g.mvMods) for (const k in g.mvMods) if (/^sep/.test(k)) delete g.mvMods[k]; me.hp = X.ST().hp; me.inv = 0; me.dodge = null; me.dead = false; me.push = null; };
      const run = (s, dt) => { for (let t = 0; t < s; t += dt || 1 / 60) { me.inv = 0; F.tick(dt || 1 / 60); } };
      const far = () => { me.x = -500; me.y = -500; };
      for (const kd of kinds) { const tp = F.traps.find(q => q.kind === kd && !q.bridge) || F.traps.find(q => q.kind === kd); const R = { have: !!tp }; out[kd] = R; if (!tp) continue; const K = tp.K, ALL = F.traps; F.traps = [tp]; reset();   // (this one alone on the floor while it is tried)
        const cx = tp.x1 != null ? (tp.x + tp.x1) / 2 : tp.x, cy = tp.y1 != null ? (tp.y + tp.y1) / 2 : tp.y;
        const hitAt = () => { if (kd === 'rift') return [tp.x + 1.5, tp.y]; if (kd === 'column') return [tp.x + tp.dir * 1.3, tp.y]; if (kd === 'clock') return [tp.x + 0.75, tp.y]; return [cx, cy]; };
        const safeAt = () => { if (kd === 'rift') return [tp.x + 3.7, tp.y]; if (kd === 'column') return [tp.x + tp.dir * 1.3, tp.y + 1.5]; if (kd === 'clock') return [tp.x + 2.0, tp.y]; if (kd === 'pend') return tp.o === 'v' ? [cx + 1.3, cy] : [cx, cy + 1.3]; if (kd === 'swap' || kd === 'glass') return [cx + 1.75, cy]; return [cx + (tp.R || 1) + 0.9, cy]; };
        const arm = () => { tp.on = true; if (K.per) tp.t = tp.period - K.warn - K.burst - 0.05; else { tp.st = 'warn'; tp.t = 0; } };
        const spawnMon = (x, y) => { const m = X.spawnMon('cornerpup', x, y, { pack: 990 }); m.hp = m.maxhp = 1e6; m.inv = 0; return m; };
        if (kd === 'pend') {
          // the blade's path: struck once a pass (its cooldown), never while it is far along the slot; a roll passes; off the lane nothing
          const [hx, hy] = hitAt(); me.x = hx; me.y = hy; tp.on = true; const hp0 = me.hp; run(tp.period * 0.5); R.loss = hp0 - me.hp; R.dmg = ST.dmg(F, kd); R.hits = F.stat.byKind.pend ? F.stat.byKind.pend.hits : 0;
          reset(); me.x = hx; me.y = hy; tp.on = true; me.dodge = { t: 99 }; run(tp.period); R.dodgeLoss = X.ST().hp - me.hp; me.dodge = null;
          reset(); { const [sx, sy] = safeAt(); me.x = sx; me.y = sy; } tp.on = true; run(tp.period); R.safeLoss = X.ST().hp - me.hp;
          // the end of its swing: standing just past the slot's end is safe
          reset(); me.x = cx + tp.ax * (K.L + 0.95); me.y = cy + tp.ay * (K.L + 0.95); tp.on = true; run(tp.period); R.endLoss = X.ST().hp - me.hp;
          reset(); me.x = hx; me.y = hy; tp.on = true; tp.demo = true; run(tp.period); R.demoLoss = X.ST().hp - me.hp;
          reset(); { const [sx, sy] = safeAt(); me.x = sx; me.y = sy + 0.2; } const m = spawnMon(hx, hy); tp.on = true; for (let t = 0; t < tp.period * 0.5; t += 1 / 60) { m.x = hx; m.y = hy; m.vx = m.vy = 0; F.tick(1 / 60); } R.monLoss = 1e6 - m.hp; D.mons.length = 0; R.idle = tp.period / 2;
        } else if (K.per || K.trig || kd === 'clock' || kd === 'glass') {
          // 1. it tells before it strikes: no harm in its warn; the blow in its burst
          const [hx, hy] = hitAt(); me.x = hx; me.y = hy; const hp0 = me.hp; tp.on = true;
          if (K.per) { tp.t = tp.period - K.warn - K.burst - 0.05; } run(0.1); R.warned = tp.st === 'warn'; const hpWarn = me.hp;
          run(K.warn); run(K.burst + 0.05); R.loss = hp0 - me.hp; R.noHarmInWarn = hpWarn === hp0; R.dmg = ST.dmg(F, kd); R.hold = !!(g.mvMods && g.mvMods.sephold) || F.hold > 0;
          // 2. a dodge roll passes through it
          reset(); me.x = hx; me.y = hy; arm(); run(0.1); run(K.warn - 0.15); me.dodge = { t: 0.3 }; run(K.burst + 0.25); R.dodgeLoss = X.ST().hp - me.hp; me.dodge = null;
          // 3. off its area: no harm (it is set off by hand)
          reset(); { const [sx, sy] = safeAt(); me.x = sx; me.y = sy; } arm(); run(K.warn + K.burst + 0.2); R.safeLoss = X.ST().hp - me.hp; R.fired = tp.n;
          // 4. the demo: harmless
          reset(); me.x = hx; me.y = hy; arm(); tp.demo = true; run(K.warn + K.burst + 0.2); R.demoLoss = X.ST().hp - me.hp;
          // 5. a monster caught takes twice the blow; a mini boss none
          reset(); { const [sx, sy] = safeAt(); me.x = sx; me.y = sy + 0.2; } const m = spawnMon(hx, hy); const mb = { x: hx, y: hy, r: 0.5, hp: 1e6, maxhp: 1e6, lesser: true, boss: true, type: 'cornerpup' }; D.mons.push(mb);
          arm(); for (let t = 0; t < K.warn + K.burst + 0.1; t += 1 / 60) { m.x = hx; m.y = hy; m.vx = m.vy = 0; mb.x = hx; mb.y = hy; F.tick(1 / 60); }
          R.monLoss = 1e6 - m.hp; R.miniLoss = 1e6 - mb.hp; D.mons.length = 0; R.idle = K.per ? tp.period - K.warn - K.burst : K.rest;
          // 6. what is not set off: a pane or a dial with nobody on it stays still
          if (K.trig || kd === 'clock' || kd === 'glass') { reset(); far(); tp.on = true; run(1.0); R.still = tp.st === 'idle'; }
        } else {
          // the pool: walking across is slowed and unharmed; out of it, the slow lets go
          me.x = cx; me.y = cy; tp.on = true; run(0.3); R.slow = g.mvMods && g.mvMods.sepzone; const hp0 = me.hp; run(2.0); R.crossLoss = hp0 - me.hp;
          reset(); far(); run(0.1); R.slowGone = !(g.mvMods && g.mvMods.sepzone); }
        F.traps = ALL; }
      // lowFx: the drawing runs (no throw)
      try { window.__pp.st.lowFx = true; F.traps.forEach(q => { if (q.kind !== 'pend') { q.st = 'warn'; q.t = 0.5; } }); const c = document.createElement('canvas').getContext('2d'); F.drawGround(c); F.drawOver(c); out.lowFxOk = true; } catch (e) { out.lowFxOk = String(e); } window.__pp.st.lowFx = false; reset();
      out.monHit = F.monHit; out.cached = ST.stats.cached; return out; }, LAND[st]);
    console.log(JSON.stringify(r));
    for (const kd of LAND[st]) { const R = r[kd]; if (!R.have) { ok(`${kd}: on the floor`, false); continue; }
      if (kd === 'pend') {
        ok(`pend: struck once on its pass (the floor's own: ${R.dmg.toFixed(1)}), not every frame`, R.loss > 0 && R.loss < R.dmg * 1.6 && R.hits === 1, { loss: R.loss, dmg: R.dmg, hits: R.hits });
        ok('pend: a roll passes; beside the lane and past the slot\'s end no harm; its demo is harmless', R.dodgeLoss === 0 && R.safeLoss === 0 && R.endLoss === 0 && R.demoLoss === 0, R);
        ok('pend: a monster in its lane takes twice the blow', R.monLoss > R.dmg * 1.2 && Math.abs(R.monLoss - 2 * R.dmg) < 1 + R.dmg * 0.6, { mon: R.monLoss, dmg: R.dmg });
        ok(`pend: a fair window between passes (${R.idle.toFixed(2)} s)`, R.idle >= 1.2, {}); }
      else if (R.dmg != null && R.loss != null) {
        ok(`${kd}: no harm while it tells; its blow in its burst (the floor's own: ${R.dmg.toFixed(1)})`, R.noHarmInWarn && R.loss > 0 && R.warned, { loss: R.loss, dmg: R.dmg });
        ok(`${kd}: a dodge roll passes; off its area no harm though it fired; its demo is harmless`, R.dodgeLoss === 0 && R.safeLoss === 0 && R.fired > 0 && R.demoLoss === 0, { dodge: R.dodgeLoss, safe: R.safeLoss, fired: R.fired, demo: R.demoLoss });
        ok(`${kd}: a monster caught takes twice the blow; a mini boss none`, Math.abs(R.monLoss - 2 * R.dmg) < 1 + R.dmg * 0.6 && R.monLoss > R.dmg * 1.2 && R.miniLoss === 0, { mon: R.monLoss, dmg: R.dmg, mini: R.miniLoss });
        ok(`${kd}: a fair window between blows (${R.idle.toFixed(1)} s)`, R.idle >= 2.0, {});
        if (R.still != null) ok(`${kd}: with nobody near it stays still`, R.still === true, {});
        if (kd === 'vhand') ok('vhand: their grab holds the pet a moment', R.hold === true, {}); }
      else { ok(`${kd}: slows inside (x${R.slow}), lets go outside, harmless`, R.slow > 0 && R.slow < 1 && R.slowGone && R.crossLoss === 0, R); } }
    ok(`stage ${st}: lowFx draws`, r.lowFxOk === true, r.lowFxOk);
  }
  // the Statues and the Rolling Hour: their traps never touch the monsters (the mob's numbers and the kills as they were)
  for (const st of [5, 9]) { await L.stage(page, st, 11);
    const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, XH = window.__XH, X = XH.X, F = XH.self.septraps, me = D.me; F.freeze = true; F.teach = false; me.x = -500; me.y = -500; const res = { monHit: F.monHit, n: F.traps.length, loss: 0 };
      for (const tp of F.traps) { const m = X.spawnMon('cornerpup', tp.x + (tp.dir ? tp.dir * 1.2 : 0), tp.y, { pack: 991 }); m.hp = m.maxhp = 1e6; tp.on = true; if (tp.K.per) tp.t = tp.period - tp.K.warn - tp.K.burst - 0.05; else { tp.st = 'warn'; tp.t = 0; }
        for (let t = 0; t < 3; t += 1 / 60) { m.x = tp.x + (tp.dir ? tp.dir * 1.2 : 0); m.y = tp.y; F.tick(1 / 60); } res.loss += 1e6 - m.hp; m.dead = true; } return res; });
    ok(`stage ${st}: its traps never touch the monsters`, r.monHit === false && r.loss === 0 && r.n > 0, r); }
  // the stage closed: the field and the pictures let go
  await page.evaluate(() => { try { window.__pp.closeArcade(); } catch (e) {} }); await page.waitForTimeout(1500);
  const rel = await page.evaluate(() => { const s = self.SEP_TRAPS.stats; return { cached: s.cached, live: s.live, released: s.released, bytes: s.bytes }; });
  ok('the stage closed: its traps and pictures let go', rel.cached === 0 && rel.live === 0 && rel.released > 0 && rel.bytes === 0, rel);
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
