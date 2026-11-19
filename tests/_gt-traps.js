// v423 GT: the Garden of Unborn Stars' traps (20p4-garden-traps.js), each kind on a Section 3 floor (The Thorn Walks): it
// triggers; its tell (warn, the build-up) runs before it hits; a hit costs the expected blow (12 x the floor's dmgMul x the
// kind's share, held to 4..14% of health); a dodge roll passes through; stepping away during the tell passes; monsters are
// caught; the sap slows (no harm); the geyser's drowsiness; the first of a kind is a harmless demo; everything is let go.
// HTML=test-gt.html node tests/_gt-traps.js
const L = require('./_gt-lib.js'); const { results, ok } = L.reporter();
(async () => { const { browser, page, errors } = await L.open();
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); window.__gtBoot = 1; P.st.unlockAll = true; });
  await L.stage(page, 9);
  const r = await page.evaluate(() => { const { X, H } = window.__XH, D = window.__pp.arc.game._dbg, GT = self.GARDEN_TRAPS, me = D.me, g = D.g, out = { kinds: {} };
    GT.clear(); D.mons.length = 0; if (g.reserve) g.reserve.length = 0;
    const F = GT.place(X, H, { sec: 3, n: 2, teach: false }); const all = F.traps.slice();
    const pick = kd => all.find(q => q.kind === kd && !q.bridge) || all.find(q => q.kind === kd);
    const spot = tp => tp.kind === 'whip' ? { x: (tp.x + tp.ex) / 2, y: (tp.y + tp.ey) / 2 } : tp.kind === 'trip' ? { x: (tp.x + tp.x1) / 2, y: (tp.y + tp.y1) / 2 } : { x: tp.x + 0.1, y: tp.y };
    const away = tp => { const s = spot(tp); if (tp.kind === 'whip') return { x: s.x - tp.dy * 2.2, y: s.y + tp.dx * 2.2 }; if (tp.kind === 'trip') { const ax = tp.x1 - tp.x, ay = tp.y1 - tp.y, l = Math.hypot(ax, ay); return { x: s.x - ay / l * 2.2, y: s.y + ax / l * 2.2 }; } return { x: tp.x + 2.6, y: tp.y }; };
    const fresh = () => { me.hp = D.ST.hp; me.inv = 0; me.dodge = null; me.push = null; me.dead = false; g.shieldT = 0; g.guardHP = 0; };
    const reset = tp => { F.traps = [tp]; tp.st = 'idle'; tp.t = 0; tp.hit = false; tp.demo = false; tp.hm = null; F.drowsy = 0; if (g.mvMods) { delete g.mvMods.gtsap; delete g.mvMods.gtpollen; } };
    const prime = tp => { if (tp.K.per) tp.t = tp.period - tp.K.warn - tp.K.burst - (tp.K.rec || 0) - 0.02; };
    const lvl = tp => tp.st === 'warn' ? tp.t / tp.K.warn : tp.st === 'burst' ? 1 : 0;
    for (const kd of ['pod', 'whip', 'gey', 'star', 'trip']) { const tp = pick(kd); if (!tp) { out.kinds[kd] = null; continue; } const res = { bridge: !!tp.bridge, expect: +F.dmg(kd).toFixed(1), pct: +(F.dmg(kd) / D.ST.hp * 100).toFixed(1) };
      // (1) a hit: the pet stands on it; the tell runs its full length first
      reset(tp); fresh(); const s = spot(tp); me.x = s.x; me.y = s.y; prime(tp); let tWarn = -1, tHit = -1, lv = [], hp0 = me.hp, t = 0, h0 = F.stat.hits;
      for (let i = 0; i < 150 && tHit < 0; i++) { F.tick(1 / 30); t += 1 / 30; if (tp.st === 'warn' && tWarn < 0) tWarn = t; if (tp.st === 'warn') lv.push(lvl(tp)); if (F.stat.hits > h0) tHit = t; me.x = s.x; me.y = s.y; me.inv = 0; }
      res.hit = { lost: +(hp0 - me.hp).toFixed(1), ratio: +((hp0 - me.hp) / F.dmg(kd)).toFixed(3), tell: +(tHit - tWarn).toFixed(2), warn: tp.K.warn, rising: lv.length > 3 && lv.every((v, j) => !j || v >= lv[j - 1]) && lv[lv.length - 1] > 0.85, shoved: !!me.push, drowsy: kd === 'gey' ? (g.mvMods && g.mvMods.gtpollen) || 0 : null };
      if (kd === 'gey') { for (let i = 0; i < 45; i++) F.tick(1 / 30); res.hit.drowsyAfter = (g.mvMods && g.mvMods.gtpollen) || 0; }
      // (2) a dodge roll through its strike
      reset(tp); fresh(); me.x = s.x; me.y = s.y; prime(tp); hp0 = me.hp; const d0 = F.stat.dodged; let rolled = false;
      for (let i = 0; i < 150; i++) { if (tp.st === 'burst') { me.dodge = { t: 0.05, dur: 0.3, vx: 0, vy: 0.001, perf: false }; rolled = true; } F.tick(1 / 30); me.x = s.x; me.y = s.y; if (rolled && tp.st !== 'burst') break; }
      res.roll = { lost: +(hp0 - me.hp).toFixed(1), dodged: F.stat.dodged - d0 }; me.dodge = null;
      // (3) stepping away once the tell starts
      reset(tp); fresh(); me.x = s.x; me.y = s.y; prime(tp); hp0 = me.hp; const a = away(tp), h1 = F.stat.hits;
      for (let i = 0; i < 150; i++) { F.tick(1 / 30); if (tp.st === 'warn' && tp.t > 0.1) { me.x = a.x; me.y = a.y; } if (tp.n > 0 && tp.st !== 'warn' && tp.st !== 'burst') break; }
      res.step = { lost: +(hp0 - me.hp).toFixed(1), hits: F.stat.hits - h1, fired: tp.n };
      // (4) a monster caught (the pet a little way off, within 13 tiles: the trap runs)
      reset(tp); fresh(); D.mons.length = 0; const m = X.spawnMon('thornling', s.x, s.y, { pack: 990, room: 0 }); m.aggro = false; me.x = s.x + 6; me.y = s.y; const mh0 = m.hp, mc0 = F.stat.monHits; prime(tp);
      for (let i = 0; i < 150; i++) { m.x = s.x; m.y = s.y; F.tick(1 / 30); if (F.stat.monHits > mc0) break; }
      res.mon = { caught: F.stat.monHits - mc0, lost: Math.round(mh0 - m.hp), triggered: kd === 'pod' || kd === 'trip' ? tp.n > 0 : null }; D.mons.length = 0;
      out.kinds[kd] = res; }
    // the sap: a slow while in it, none outside; monsters slowed; no harm
    { const tp = pick('sap'); reset(tp); fresh(); me.x = tp.x; me.y = tp.y + 0.2; const hp0 = me.hp; F.tick(1 / 30); const inK = g.mvMods && g.mvMods.gtsap; me.x = tp.x + 3; F.tick(1 / 30); const outK = g.mvMods && g.mvMods.gtsap;
      const m = X.spawnMon('thornling', tp.x, tp.y, { pack: 991, room: 0 }); me.x = tp.x + 5; m.sandT = 0; F.tick(1 / 30); out.sap = { inside: inK, outside: outK == null ? null : outK, lost: hp0 - me.hp, monSlow: m.sandT > 0, dmg: F.dmg('sap') }; D.mons.length = 0; }
    // the first of a kind met plays harmlessly, with its banner
    { GT.clear(); for (const k in GT.TAUGHT) delete GT.TAUGHT[k]; const F2 = GT.place(X, H, { sec: 3, n: 2 }), tp = F2.traps.find(q => q.kind === 'pod' && !q.bridge); F2.traps = [tp]; fresh(); me.x = tp.x + 4; me.y = tp.y; const gt0 = g.t; g.t = Math.max(g.t, 6); const hp0 = me.hp;
      for (let i = 0; i < 40; i++) { F2.tick(1 / 30); me.x = tp.x + (i < 20 ? 4 : 0.2); me.y = tp.y; me.inv = 0; }
      for (let i = 0; i < 60; i++) { F2.tick(1 / 30); me.inv = 0; } out.demo = { demos: F2.stat.demos, lost: hp0 - me.hp, taught: !!GT.TAUGHT.pod, fired: tp.n }; g.t = gt0; }
    // only the traps within 13 tiles run
    { GT.clear(); const F3 = GT.place(X, H, { sec: 3, n: 2, teach: false }); const tp = F3.traps.find(q => q.kind === 'gey'); me.x = tp.x + 20; me.y = tp.y; tp.t = 0; for (let i = 0; i < 300; i++) F3.tick(1 / 30); out.far = { st: tp.st, n: tp.n }; }
    return out; });
  for (const kd of ['pod', 'whip', 'gey', 'star', 'trip']) { const q = r.kinds[kd]; if (!q) { ok(`${kd}: placed`, false); continue; }
    ok(`${kd}: triggers, its tell runs first (>= ${q.hit.warn}s, the light rising), then it hits for the expected blow (${q.expect} = ${q.pct}% of health)`, q.hit.tell >= q.hit.warn - 0.05 && q.hit.rising && Math.abs(q.hit.ratio - 1) < 0.2, q.hit);
    ok(`${kd}: a dodge roll passes through`, q.roll.lost === 0 && q.roll.dodged >= 1, q.roll);
    ok(`${kd}: stepping away during the tell passes`, q.step.lost === 0 && q.step.hits === 0 && q.step.fired >= 1, q.step);
    ok(`${kd}: a monster in it is caught`, q.mon.caught >= 1 && q.mon.lost > 0, q.mon); }
  ok('gey: the pollen leaves the pet drowsy (slowed to 70%) for a moment', r.kinds.gey && r.kinds.gey.hit.drowsy === 0.7 && !r.kinds.gey.hit.drowsyAfter, r.kinds.gey && r.kinds.gey.hit);
  ok('sap: wading slows the pet to 55% (none outside), monsters too, no harm', r.sap.inside === 0.55 && r.sap.outside == null && r.sap.monSlow && r.sap.lost === 0 && r.sap.dmg === 0, r.sap);
  ok('the first pod met plays harmlessly with its banner', r.demo.demos === 1 && r.demo.lost === 0 && r.demo.taught && r.demo.fired >= 1, r.demo);
  ok('a trap more than 13 tiles off waits', r.far.st === 'idle' && r.far.n === 0, r.far);
  // let go: a new stage (any) stops the old field and frees the pictures; leaving a stage frees them too
  const rel = await page.evaluate(() => { const GT = self.GARDEN_TRAPS, before = GT.stats; const old = GT.fields().slice(); return { before: { live: before.live, cached: before.cached }, old: old.length, oldRefs: old.map(F => F.live) }; });
  await page.evaluate(() => { window.__gtOld = self.GARDEN_TRAPS.fields().slice(); });
  await L.stage(page, 10);
  const rel2 = await page.evaluate(() => { const GT = self.GARDEN_TRAPS, D = window.__pp.arc.game._dbg; return { live: GT.stats.live, cached: GT.stats.cached, released: GT.stats.released, oldLive: window.__gtOld.filter(F => F.live).length, oldTraps: window.__gtOld.every(F => F.traps.every(t => !t.obj)), newLive: GT.fields().filter(F => F.live).length, mv: Object.keys(D.g.mvMods || {}).filter(k => /^gt/.test(k)) }; });
  // st.lowFx: the stage keeps drawing with the thinner light (and nothing breaks)
  await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg, F = self.GARDEN_TRAPS.fields()[0]; P.st.lowFx = true; if (F) for (const t of F.traps) { t.st = 'warn'; t.t = 0.2; } D.me.x = F ? F.traps[0].x + 1 : D.me.x; });
  await page.waitForTimeout(2500); const lowErr = errors.length; await page.evaluate(() => { window.__pp.st.lowFx = false; });
  ok('st.lowFx: the traps draw on with the thinner light, no errors', lowErr === 0, { errors: lowErr });
  await page.evaluate(() => { window.__pp.arc.game.destroy(); });
  const rel3 = await page.evaluate(() => { const GT = self.GARDEN_TRAPS; return { live: GT.stats.live, cached: GT.stats.cached }; });
  ok('a new stage lets the old field go (one live field, the old ones stopped)', rel2.oldLive === 0 && rel2.oldTraps && rel2.live === 1 && rel2.newLive === 1, { rel, rel2 });
  ok('closing the stage frees the field and every picture', rel3.live === 0 && rel3.cached === 0, rel3);
  console.log(JSON.stringify(r.kinds, null, 0));
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
