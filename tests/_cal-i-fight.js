// Ifrit (Rift 0's last boss, 20zz8): the fight played through by a bot with an ordinary level-1 starter pet that uses
// the mechanics (dodges every marked blow, strikes the chest when it opens, breaks the crystal growths in phase two,
// shelters at a frost well from every Hellfire), on the 2D fallback (the GPU model is shot in _cal-i-shots.js).
// Checks the spec's numbers and reports the fight's length.
// usage: HTML=test-calI.html node tests/_cal-i-fight.js   env: RUNS (default 1), EASE (the rift's ease if it has no
// entry of its own yet), NOSHELTER=1 (the bot ignores the wells: the missed shelter is a heavy hit, never a kill),
// IDLE=1 (the bot only attacks the body: ordinary attacks alone are slow but never a hard lock), CAP (game seconds)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(() => { window.__IFRIT_GL = 0; window.__NG_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calI.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const runs = +(process.env.RUNS || 1);
  for (let run = 0; run < runs; run++) {
    // a fresh level-1 starter, and the rift's boss stage (a test entry when the rift is not built yet)
    const info = await page.evaluate(ease => { const P = window.__pp; P.quickStart('Ember'); P.st.energy = 100;
      let Rf = P.RIFT_BY_ID.caldera, own = false;
      if (!Rf || !Rf.stages.some(s => s.boss === 'califrit')) { own = true; const D = P.FIEND_DEFS.califrit, st = (b, nm) => ({ kind: 'boss', biome: 'volcano', boss: b, name: nm, goal: nm });
        Rf = { id: 'caldera', n: 0, name: 'The Blackfire Caldera (test)', lvl: 1, sigil: 'Ember', biome: 'volcano', aff: ['fire', 'earth'], gate: null, mons: [], ease: ease || 0.01,
          sealing: { fall: 'THE HEART OF THE VOLCANO FALLS', sub: 'test', sigil: 'THE EMBER SIGIL', name: 'The Blackfire Caldera', color: '#FF8A3D' },
          stages: [st('califrit', 'one'), st('califrit', 'two'), Object.assign(st('califrit', 'The Crucible'), { seal: true, make: D.stageMake })] };
        if (P.RIFT_BY_ID.caldera) { const i = P.RIFTS.indexOf(P.RIFT_BY_ID.caldera); if (i >= 0) P.RIFTS.splice(i, 1); } P.RIFTS.push(Rf); P.RIFT_BY_ID.caldera = Rf; }
      if (!own && !Rf.ease && !Rf.scale) { Rf.ease = ease || 0.01; Rf._testEase = true; }   // (the core gives no ease yet: a level-1 rift needs one)
      const idx = Rf.stages.findIndex(s => s.boss === 'califrit' && (s.seal || own)); P.openMap(); P.dun.setMapTab('rift', true); P.startRift('caldera', idx);
      return { own, idx, ease: Rf.ease || null, testEase: !!Rf._testEase }; }, process.env.EASE ? +process.env.EASE : null);
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    const R = await page.evaluate(async o => { const P = window.__pp, G = P.arc.game, D = G._dbg, g = D.g, me = D.me; P.arc.paused = true;
      const FX = D.FD.FX, S = D.FD.S, M = FX.mem, C = FX.C, out = { log: [], hp0: D.ST.hp, lvl: P.st.pets ? null : null, deaths: 0, minHp: 1, hits: [], hellHits: [], hellMinHp: [] };
      out.pet = { hp: D.ST.hp, atk: D.ST.atk, L: D.ST.L, normal: D.KITR.normal && D.KITR.normal.key, strong: D.KITR.strong && D.KITR.strong.key };
      const step = () => G.update(1 / 60);
      for (let k = 0; k < 600 && !(g.boss && g.boss.act !== 'enter'); k++) step();
      const b = g.boss; out.boss = { hp: Math.round(b.maxhp), dmg: +b.dmg.toFixed(1), bars: D.F.fiend.bars, r: b.r };
      const t0 = g.t, SP = 4.3, cap = o.cap || 900; let lastHp = me.hp, phase = 1, hellSeen = 0;
      const free = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.4, 0) && Math.hypot(x - C.x, y - C.y) < C.R - 1.0;
      const pending = () => S.tele.filter(s => !s.done && s.age < s.t);
      const danger = (x, y, pad) => { for (const s of pending()) if (FX.inShape(s, x, y, me.r + (pad || 0.35))) return true; for (const z of S.hz) if (z.dps && FX.inShape(z, x, y, me.r + 0.2)) return true; if (Math.hypot(x - b.x, y - b.y) < 2.3) return true; return false; };
      const moveTo = (x, y, dt) => { const dx = x - me.x, dy = y - me.y, d = Math.hypot(dx, dy); if (d < 0.05) { me.vx = me.vy = 0; return true; } const s = Math.min(d, SP * dt), nx = me.x + dx / d * s, ny = me.y + dy / d * s; if (free(nx, ny)) { me.x = nx; me.y = ny; } else if (free(nx, me.y)) me.x = nx; else if (free(me.x, ny)) me.y = ny; me.vx = dx / d * SP; me.vy = dy / d * SP; me.face = dx >= 0 ? 1 : -1; return false; };
      const escape = () => { let best = null, bd = 1e9; for (const r of [1.2, 2.2, 3.4, 4.6, 6]) for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2, x = me.x + Math.cos(a) * r, y = me.y + Math.sin(a) * r; if (!free(x, y) || danger(x, y, 0.5)) continue; const c2 = r + Math.hypot(x - b.x, y - b.y) * 0.05; if (c2 < bd) { bd = c2; best = { x, y }; } } return best; };
      const attack = t => { if (!t) return; const d = Math.hypot(t.x - me.x, t.y - me.y) || 1; g.tapAim = { t, x: (t.x - me.x) / d, y: (t.y - me.y) / d, a: Math.atan2(t.y - me.y, t.x - me.x), tap: true }; g.tapBuf = 0.35; };
      const melee = (D.KITR.normal && D.KITR.normal.key) === 'shadowclaw';
      let strongT = 0, k = 0, esc = null;
      while (!b.dead && g.t - t0 < cap && !me.dead && k++ < 200000) {
        const dt = 1 / 60;
        if (S.phase !== phase) { out.log.push({ t: +(g.t - t0).toFixed(1), ev: 'phase' + S.phase }); phase = S.phase; }
        const A = M.A, hell = A && A.kind === 'hellfire';
        if (hell && A.phase === 'charge' && hellSeen !== M.stat.hell) { hellSeen = M.stat.hell; out.log.push({ t: +(g.t - t0).toFixed(1), ev: 'hellfire' }); }
        if (!danger(me.x, me.y)) esc = null;
        let target = null;
        const live = (M.crys || []).filter(c => c.alive && c.obj && !c.obj.dead), weak = S.weak.chest && !S.weak.chest.dead ? S.weak.chest : null;
        if (o.idle) target = b; else if (live.length) target = live.sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y))[0].obj; else if (weak) target = weak; else target = b;
        if (hell && !o.noShelter && A.phase !== 'over') {
          const ws = M.wells.slice().sort((p, q) => Math.hypot(p.x - me.x, p.y - me.y) - Math.hypot(q.x - me.x, q.y - me.y)), w = ws.find(w2 => w2.on) || ws[0];
          if (w.on) { if (Math.hypot(me.x - w.x, me.y - w.y) > 1.3) moveTo(w.x + 0.9, w.y - 0.6, dt); else { me.vx = me.vy = 0; } }
          else { const gx = w.x + 0.9, gy = w.y - 0.7; if (moveTo(gx, gy, dt)) { me.vx = me.vy = 0; } }
          if (A.phase === 'charge' && (w.on || Math.hypot(me.x - w.x, me.y - w.y) > 2)) attack(b);   // (it is no use to strike the well; strike him from the shelter)
        } else if (danger(me.x, me.y)) { if (!esc || danger(esc.x, esc.y, 0.5)) esc = escape(); if (esc) moveTo(esc.x, esc.y, dt); }
        else { const want = melee ? 1.6 : (target === b ? 5.2 : 4.0), d = Math.hypot(target.x - me.x, target.y - me.y);
          if (d > want + 0.6) { const a = Math.atan2(target.y - me.y, target.x - me.x), x = target.x - Math.cos(a) * want, y = target.y - Math.sin(a) * want; if (!danger(x, y)) moveTo(x, y, dt); else me.vx = me.vy = 0; }
          else if (d < want - 1.8 && target === b) { const a = Math.atan2(me.y - b.y, me.x - b.x), x = b.x + Math.cos(a) * want, y = b.y + Math.sin(a) * want; if (!danger(x, y)) moveTo(x, y, dt); }
          else me.vx = me.vy = 0;
          attack(target); }
        if (o.dbg && A && A.tele && !A.tele.done && A.tele.t - A.tele.age < 0.05) out.log.push({ t: +(g.t - t0).toFixed(1), dbg: A.kind, me: [+me.x.toFixed(1), +me.y.toFixed(1)], s: [+A.tele.x.toFixed(1), +A.tele.y.toFixed(1)], dang: danger(me.x, me.y), n: pending().length, e: escape(), hell });
        // a strong attack when it is ready (an ordinary starter's one skill)
        strongT -= dt; if (strongT <= 0 && !hell && target && !pending().length && !S.hz.some(z => z.dps)) { const ab = D.KITR.strong; if (ab && !me.dead) { try { const cd0 = g.cdS; D.useStrong('strong'); if (g.cdS !== cd0) out.strongs = (out.strongs || 0) + 1; } catch (e) {} } strongT = 0.5; }
        // the pickups the fight spills: walk over the near ones (hp orbs)
        step();
        if (me.hp < lastHp - 0.5) out.hits.push({ t: +(g.t - t0).toFixed(1), d: Math.round(lastHp - me.hp), act: A ? A.kind + ':' + A.phase : b.act, hell: !!(A && A.kind === 'hellfire') });
        lastHp = me.hp; out.minHp = Math.min(out.minHp, me.hp / D.ST.hp);
      }
      out.t = +(g.t - t0).toFixed(1); out.strongN = out.strongs || 0; out.won = !!b.dead; out.dead = !!me.dead; out.stat = M.stat; out.hpLeft = +(b.hp / b.maxhp).toFixed(3);
      // after the fall: the statue, the calm, the sealing
      if (b.dead) { for (let i = 0; i < 60 * 4; i++) step(); out.after = { statue: !!M.statue, dead: +M.P.dead.toFixed(2), heat: +M.P.heat.toFixed(2), calm: +M.calm.toFixed(2), crysGlow: M.crys.map(c => +c.glow.toFixed(2)), cine: D.RIFT.self.cine && D.RIFT.self.cine.kind }; }
      P.arc.paused = false; return out; }, { cap: +(process.env.CAP || 900), noShelter: !!process.env.NOSHELTER, idle: !!process.env.IDLE, dbg: !!process.env.DBG });
    console.log(`run ${run}: rift ${info.own ? '(test entry)' : '(the core\'s)'} ease ${info.ease}`, JSON.stringify(R.pet), JSON.stringify(R.boss));
    console.log('  log', JSON.stringify(R.log), 'strongs', R.strongN); console.log('  stat', JSON.stringify(R.stat));
    const hellHits = R.hits.filter(h => h.hell);
    console.log(`  length ${R.t} s (${(R.t / 60).toFixed(2)} min), won ${R.won}, pet down ${R.dead}, hp left ${R.hpLeft}, lowest pet hp ${(R.minHp * 100).toFixed(0)}%, hits taken ${R.hits.length} (${R.hits.reduce((a, h) => a + h.d, 0)} dmg), hellfire hits ${hellHits.length}`);
    if (R.after) console.log("  after", JSON.stringify(R.after));
    if (process.env.HITS) console.log("  hits", JSON.stringify(R.hits));
    if (!process.env.NOSHELTER && !process.env.IDLE) { ok(R.won, 'the starter beats Ifrit using the mechanics'); ok(R.t > 150 && R.t < 290, 'the fight lasts about 3.5 minutes (2.5 to 4.8)', R.t); ok(R.stat.walls >= 1 && R.stat.hellSafe === R.stat.walls && R.stat.hellHit === 0, 'every Hellfire wall sheltered at a frost well', { begun: R.stat.hell, walls: R.stat.walls, safe: R.stat.hellSafe, hit: R.stat.hellHit }); ok(R.stat.cryst === 2, 'both crystal growths broken', R.stat.cryst); }
    if (process.env.NOSHELTER) { const ok1 = hellHits.every(h => h.d < R.pet.hp); ok(ok1 && hellHits.length >= 1, 'a missed shelter is a heavy hit, never a full-health kill', hellHits); }
    if (R.after) ok(R.after.statue && R.after.dead > 0.6 && R.after.calm > 0.9 && R.after.crysGlow.every(v => v < 0.1), 'the fall: a dark statue, the lava calm, the crystals dark', R.after);
    if (run < runs - 1) { await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); }); }
  }
  console.log('page errors', errors.length, errors.slice(0, 6));
  console.log(bad ? `${bad} of ${n} FAILED` : `all ${n} ok`);
  await browser.close();
})();
