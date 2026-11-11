// Nidhogg's Ultima (N3, 20k6i) on the real core (N1, 20k6g): the finisher's damage events and its clean ending.
// usage: HTML=test-nid3.html EVO=1|4|7 node tests/nidhogg-ultima.js
// Checks: the press starts it (meter full); the beam ticks exactly 10 times, 0.15 s apart, on the impact ring; exactly ONE
// explosion event with the dome's radius; every Ultima hit is noCharge; nothing hits after done; safeReturn is asked; the
// pet ends on walkable floor, the form is gone and its effects are cleaned up; the 120 s cooldown starts at the exit;
// a pet defeat mid-beam drops everything at once (no hits after it); no page errors.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVO = +(process.env.EVO || 4);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  async function run(kill) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
    await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Elem'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
    await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2000);
    const r = await page.evaluate(([evo, kill]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; P.arc.paused = true;
      let i = 0; for (const m of D.mons) { if (m.boss || m.dead) continue; m.hp = m.maxhp = 1e7; m.still = true; m.spd = 0; m.atkCd = 99; m.dmg = 0; if (i < 8) { m.x = me.x + 2 + (i % 4) * 1.1; m.y = me.y + (i < 4 ? 1.2 : 2.6); } i++; }
      const mv = P.ELEM_LIST.fire.ey_nidhogg; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo })); D.g.cdU = 0; me.mp = 999;
      const step = (s, fn) => { const t1 = D.g.t + s; let n = 0; while (D.g.t < t1 - 1e-6 && n++ < 4000) { if (!kill) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (fn) fn(); } };
      D.useUlt(); step(2); { let w = 0; while (w < 13 && !(D.g._nidhogg && D.g._nidhogg.phase === 'fly')) { step(0.5); w += 0.5; } }   /* (a cold summon hovers until every heading is drawable: wait for flight, up to ~15 s) */
      const S = D.g._nidhogg; if (!S || S.phase !== 'fly') return { err: 'no flight', phase: S && S.phase };
      const c = S.ctx, L = []; let t0 = 0, doneAt = null, asked = 0; const ha = c.hitArea, h0 = c.hit, d0 = c.done, sr = c.safeReturn;
      c.hit = (m, d, o) => { L.push(['hit', +(D.g.t - t0).toFixed(3), 0, !!(o && o.noCharge)]); return h0(m, d, o); };
      c.hitArea = (x, y, rr, d, o) => { L.push(['area', +(D.g.t - t0).toFixed(3), rr, !!(o && o.noCharge)]); return ha(x, y, rr, d, o); };
      c.done = () => { doneAt = +(D.g.t - t0).toFixed(2); return d0(); }; c.safeReturn = () => { asked++; return sr(); };
      S.charge = 1; t0 = D.g.t; D.useUlt(); const started = S.phase === 'ultima';
      if (kill) { step(kill); const n0 = L.length; me.hp = 0; me.dead = true; step(3); return { killed: true, after: L.length - n0, sysOn: !!(c._nmu && c._nmu.on), phase: D.g._nidhogg && D.g._nidhogg.phase, fx: D.ELEM.fx.length }; }
      let exitT = null; step(16, () => { if (exitT == null && (!D.g._nidhogg || D.g._nidhogg.phase === 'gone')) exitT = D.g.t; });
      return { started, L, doneAt, asked, plan: c.ultimaPlan, cdU: D.g.cdU, sinceExit: exitT == null ? null : D.g.t - exitT, walk: !!D.walkAt(Math.floor(me.x), Math.floor(me.y)), blocked: D.blocked(me.x, me.y, 0.3, 0), fx: D.ELEM.fx.map(f => f.key || '?'), sysOn: !!(c._nmu && c._nmu.on), petAlt: !!me.petAlt };
    }, [EVO, kill || 0]);
    await page.close(); return { r, errors };
  }
  const { r, errors } = await run(0);
  if (r.err) { ok(false, 'cast', r); await browser.close(); process.exit(1); }
  ok(r.started, 'the press with a full meter starts the Ultima');
  const ticks = r.L.filter(h => h[0] === 'area' && Math.abs(h[2] - r.plan.beamR) < 1e-6), blasts = r.L.filter(h => h[0] === 'area' && Math.abs(h[2] - r.plan.blastR) < 1e-6);
  ok(ticks.length === 10, 'the beam ticks exactly 10 times', ticks.length);
  const gaps = ticks.slice(1).map((h, i) => +(h[1] - ticks[i][1]).toFixed(3)); ok(gaps.every(g => Math.abs(g - 0.15) < 0.04), 'at a fixed 0.15 s cadence', gaps);
  ok(blasts.length === 1, 'exactly one explosion damage event', blasts.length);
  ok(blasts.length === 1 && blasts[0][1] > ticks[ticks.length - 1][1], 'the explosion follows the beam', blasts[0] && blasts[0][1]);
  ok(r.plan.blastR >= 6 && r.plan.blastR <= 8, 'the dome radius is 6-8 tiles (7 / 7.5 / 8 since the round-2 effects pass)', r.plan.blastR);
  ok(r.L.length === ticks.length + blasts.length, 'no other Ultima damage events', r.L.length);
  ok(r.L.every(h => h[3]), 'every Ultima hit is noCharge');
  ok(r.doneAt != null && r.L.every(h => h[1] <= r.doneAt), 'done is called once the settle ends; nothing hits after it', r.doneAt);
  ok(r.asked === 1, 'safeReturn is asked once', r.asked);
  ok(r.walk && !r.blocked, 'the pet ends on walkable floor');
  ok(!r.sysOn && !r.fx.some(k => /nidhogg/.test(k)) && !r.petAlt, 'the form and its effects are gone', r.fx);
  ok(r.sinceExit != null && Math.abs(120 - r.cdU - r.sinceExit) < 0.6, 'the 120 s cooldown starts at the exit', { cdU: +r.cdU.toFixed(2), sinceExit: r.sinceExit && +r.sinceExit.toFixed(2) });
  ok(!errors.length, 'no page errors', errors.slice(0, 3));
  const k = await run(5.0);
  ok(k.r.after === 0 && !k.r.sysOn, 'a defeat mid-beam drops the Ultima at once (no hits after it)', k.r);
  ok(!k.errors.length, 'no page errors (defeat)', k.errors.slice(0, 3));
  await browser.close();
  console.log(bad ? `${bad} FAILED` : 'all ok'); process.exit(bad ? 1 : 0);
})();
