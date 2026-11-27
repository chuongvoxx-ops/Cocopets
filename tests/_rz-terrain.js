// (v467 RZ-A) Raziel on rough ground: in the rifts' crowded stages (the Garden's islands, bridges and void, the Sepulchre's glass bridges,
// the Belfry's narrow halls, the Caldera's lava gaps, ...) the pet is walked about the stage while Raziel fights its 30 s, the monsters kept
// alive; per frame it counts: position jumps, ground steps that reverse (jitter), time held back by a wall, frames standing on a footprint
// that is not floor (a gap, a prop, a wall), the time in the air, the take-offs and the hops over obstacles; 0 page errors.
// usage: HTML=<test html> node tests/_rz-terrain.js [rift:stage,...]   (default: a crowded stage of each listed rift)   LIST=1 lists stages
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__RZ_GL = 0; window.__NOUL = ''; let sd = 424242; window.__seed = v => { sd = v; }; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; });
  await page.goto('file://' + path.resolve(process.cwd(), process.env.HTML || 'test-rza.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { window.__seed(4242); const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 100; P.st.dun.best = 120;
    for (const r of P.RIFT_PLAN) P.riftState().seals[r.id] = 1; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'gemini'; P.st.animas.res = null; });
  if (process.env.LIST) { console.log(await page.evaluate(() => window.__pp.RIFT_PLAN.filter(r => window.__pp.RIFT_BY_ID[r.id]).map(r => r.id + ": " + window.__pp.RIFT_BY_ID[r.id].stages.map((s, i) => i + '=' + s.kind + '(' + s.name + ')').join(' ')).join('\n'))); await browser.close(); return; }
  const LIST = (process.argv[2] || 'garden:1,sepulchre:1,belfry:1,caldera:1').split(',').map(s => s.split(':'));
  const out = {}; let bad = [];
  for (const [id, stg] of LIST) {
    const ok = await page.evaluate(([id, stg]) => { window.__seed(9000 + stg * 7); const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(id, +stg); return true; }, [id, stg]);
    try { await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 }); } catch (e) { out[id + ':' + stg] = 'no ready'; continue; }
    await page.evaluate(() => { window.__seed(777); window.__pp.beginPlay(); });
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
    const r = await page.evaluate((TLON) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; window.__TL = TLON ? [] : null; cancelAnimationFrame(P.arc.raf); P.arc.paused = false; window.__seed(31337);
      if (!AN || !AN.rz) return { err: 'no Raziel module' };
      D.g.intro = 0; if (D.SKIP) D.SKIP.fog = true; const h = 1 / 60, X = D.X;
      const upd = () => { D.eshots.length = 0; for (const m of D.mons) { m.atkCd = 99; if (!m.boss && !m.dead) m.hp = m.maxhp; } me.hp = D.ST.hp; G.update(h); };
      for (let i = 0; i < 30; i++) upd();
      Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); if (!AN.summon()) return { err: 'no summon' };
      // the pet wanders the stage: a new point on its floor every few seconds, walked to at its pace
      let goal = null, gT = 0; const walk = () => { gT -= h; if (!goal || gT <= 0 || Math.hypot(goal.x - me.x, goal.y - me.y) < 0.4) { const p = X.walkPoint(me.x + (Math.random() - 0.5) * 14, me.y + (Math.random() - 0.5) * 14, { r: 0.4, mv: 0 }); goal = p; gT = 3 + Math.random() * 3; }
        const dx = goal.x - me.x, dy = goal.y - me.y, d = Math.hypot(dx, dy) || 1, v = Math.min(3.2, d * 3); const x0 = me.x, y0 = me.y; X.moveEnt(me, dx / d * v * h, dy / d * v * h, 0); me.vx = (me.x - x0) / h; me.vy = (me.y - y0) / h; };
      let a = null, n = 0, fight = 0, air = 0, lifts = 0, hops = 0, jumps = 0, rev = 0, blockS = 0, offFloor = 0, gap = 0, wasAir = false, hadHop = false, px = 0, py = 0, pdx = 0, pdy = 0, maxStep = 0, pets = 0, worst = null, bobs = 0, pav = 0;
      for (; n < 60 * 48; n++) {
        walk(); const pre = a && Math.hypot(me.x - a.x, me.y - a.y); upd(); a = AN.S.list.find(q => q.id === 'gemini'); if (!a) break; if (a.st !== 'fight') { if (fight > 0 && a.st !== 'enter') break; px = a.x; py = a.y; continue; }
        const ab = a.rz, isAir = ab.alt > 0.12; if (window.__TL && n % 30 === 0) window.__TL.push([+fight.toFixed(1), ab.act ? ab.act.kind + (ab.act.air ? '-air' : '') + (ab.act.go && !ab.act.went ? '>go' : '') : '-', +ab.alt.toFixed(2), ab.hop ? (ab.hop.hi ? 'H' : 'L') + (ab.hop.down ? 'd' : '') + Math.hypot(ab.hop.x - a.x, ab.hop.y - a.y).toFixed(1) : '', +Math.hypot(me.x - a.x, me.y - a.y).toFixed(1)].join(' ')); fight += h; if (isAir) air += h; if (isAir && !wasAir) lifts++; wasAir = isAir; const hop = !!(ab.hop && ab.hop.hi); if (hop && !hadHop) hops++; hadHop = hop;
        const dx = a.x - px, dy = a.y - py, st = Math.hypot(dx, dy), stop = (D.g.hitStop || 0) > 0;
        if (pre > 13.5) pets++; else if (st > 9.5 * h * 1.25 + 0.02) { jumps++; if (!worst || st > worst.st) worst = { st: +st.toFixed(2), t: +fight.toFixed(2), alt: +ab.alt.toFixed(2), act: ab.act && ab.act.kind }; }
        maxStep = Math.max(maxStep, st / h); if (pav < -0.05 && ab.altV > 0.05 && ab.alt < 0.5) bobs++; pav = ab.altV;   // (coming down, then up again before touching down)
        if (ab.alt <= 0.02 && !stop) { const pd = Math.hypot(pdx, pdy); if (st > 0.15 * h && pd > 0.15 * h && dx * pdx + dy * pdy < -0.3 * st * pd) rev++; if ((ab.blockT || 0) > 0) blockS += h; if (X.blocked(a.x, a.y, 0.35, 0)) offFloor++; const tx = Math.floor(a.x), ty = Math.floor(a.y); if (X.blocked(a.x, a.y, 0.05, 0)) gap++; }
        pdx = dx; pdy = dy; px = a.x; py = a.y; }
      return { fight: +fight.toFixed(1), airShare: +(air / Math.max(0.1, fight)).toFixed(2), lifts, hops, jumps, reversals: rev, blockedSec: +blockS.toFixed(2), bobs, offFloorFrames: offFloor, centreOffFloor: gap, maxSpeed: +maxStep.toFixed(1), petTeleports: pets, worst, mons: D.mons.filter(m => !m.dead).length, tl: window.__TL };
    }, !!process.env.TL);
    out[id + ':' + stg] = r; console.log('stage', id + ':' + stg, JSON.stringify(r));
    if (r.err || r.jumps > 0 || r.reversals > 3 || r.offFloorFrames > 0 || r.blockedSec > 1.0) bad.push(id + ':' + stg);
  }
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 3)));
  console.log(bad.length || errors.length ? 'FAILS ' + JSON.stringify(bad) : 'rz-terrain OK');
  await browser.close();
})();
