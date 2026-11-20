// (v435 AN) Abaddon's and Belial's summoned minds without cooldowns: what each picks in set situations (tallied over 40 asks of choose),
// that a shield / carapace is refreshed rather than stacked, that a power never starts when it cannot finish in the time left, and a
// free-running 30 s summon's picks (variety: no power more than ~60% of picks, never idle long with monsters about).
// usage: HTML=test-an.html node tests/_an-picks.js [form 1|2|3]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const K = +(process.argv[2] || 3);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(() => { window.__NG_GL = 0; window.__BL_GL = 0; window.__AB_GL = 0; });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-an.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(({ K }) => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = K); P.st.animas.res = null; }, { K });
  const fails = [], ok = (c, msg) => { if (!c) fails.push(msg); };
  async function stage(id) {
    await page.evaluate(({ id }) => { const P = window.__pp; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} P.st.energy = 100; P.st.animas.eq = id; P.openMap(); }, { id });
    await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    return page.evaluate(({ id, K }) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
      for (let k = 0; k < 30; k++) G.update(1 / 30);
      AN.kit.main.id = id; AN.kit.main.k = K; AN.kit.res = null; AN.kit.resonance = null; D.SKIP.fog = true; D.g.intro = 0;
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
      for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -8; dx <= 9 && ok; dx++) for (let dy = -6; dy <= 6 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
      if (best) { me.x = best.x - 2.5; me.y = best.y + 1.5; }
      const live = D.mons.filter(m => !m.boss).slice(0, 8);
      D.mons.forEach(m => { if (!live.includes(m)) Object.assign(m, { dead: true, x: me.x + 300, y: me.y + 300 }); });
      live.forEach(m => Object.assign(m, { dead: false, hp: 1e9, maxhp: 1e9, still: true, spd: 0, atkCd: 99, dmg: 0, aggro: true }));
      me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); AN.summon();
      window.__AN = { G, D, P, AN, live, step(sec) { const n = Math.round(sec * 30); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (const m of D.mons) m.atkCd = 99; me.hp = Math.max(me.hp, 1); G.update(1 / 30); } } };
      window.__AN.step(4.5); const a = AN.S.list[0]; return { st: a && a.st, life: a && a.life };
    }, { id, K });
  }
  const out = {};
  /* ---- Abaddon ---- */
  out.abSetup = await stage('cancer');
  out.ab = await page.evaluate(() => { const { D, AN, live } = window.__AN, me = D.me, a = AN.S.list[0], M = AN.ab, hp = D.ST.hp, r = {};
    const park = () => live.forEach((m, i) => Object.assign(m, { x: me.x - 40 - i, y: me.y - 40 }));
    const tally = () => { const c = {}; for (let i = 0; i < 40; i++) { const q = M.choose(a); const k = q ? q.kind : 'none'; c[k] = (c[k] || 0) + 1; } return c; };
    const reset = (o) => { a.ab.act = null; a.ab.last = null; a.ab.streak = 0; a.ab.hist = []; a.ab.store = 0; me.hp = hp; a.life = 20; a.x = me.x - 1.5; a.y = me.y - 1.7; if (M.shield) { M.shield.pool = M.shield.max; M.shield.t = 0; } Object.assign(a.ab, o || {}); };
    // the opening carapace has put a shield on the pet
    r.shieldAfterOpen = !!M.shield;
    reset(); park(); r.none = tally();
    reset(); park(); Object.assign(live[0], { x: me.x + 6, y: me.y + 0.5 }); r.far = tally();
    reset(); park(); [[3, 0], [3.5, 0.7], [3.2, -0.6], [3.9, 0.2]].forEach(([dx, dy], i) => Object.assign(live[i], { x: me.x + dx, y: me.y + dy })); r.crowd = tally();
    reset({ last: 'reavers', streak: 2, hist: ['reavers', 'tide', 'reavers'] }); park(); Object.assign(live[0], { x: a.x + 1.2, y: a.y + 0.6 }); r.closeAfterReavers = tally();
    reset(); park(); [[0.8, 0.5], [-0.6, 0.7], [0.4, -0.8]].forEach(([dx, dy], i) => Object.assign(live[i], { x: me.x + dx, y: me.y + dy })); me.hp = hp * 0.35; if (M.shield) M.shield.pool = 0; r.petHurtNoShield = tally();
    reset(); park(); [[0.8, 0.5], [-0.6, 0.7], [0.4, -0.8]].forEach(([dx, dy], i) => Object.assign(live[i], { x: me.x + dx, y: me.y + dy })); me.hp = hp * 0.35; r.petHurtShieldFull = tally();
    reset({ store: hp * 0.6 }); park(); [[1.5, 0.5], [2, -0.5], [1, 1]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); r.storeHigh = tally();
    reset(); park(); [[3, 0], [3.5, 0.7], [3.2, -0.6], [3.9, 0.2]].forEach(([dx, dy], i) => Object.assign(live[i], { x: me.x + dx, y: me.y + dy })); a.life = 1.2; r.endLife12 = tally(); a.life = 0.5; r.endLife05 = tally();
    // the carapace refreshes: cast it twice; the second resets the pool to its max, never more
    reset(); if (M.shield) M.shield.pool = M.shield.max * 0.1; AN.ab.cast(a, 'carapace'); window.__AN.step(0.6); const m1 = M.shield && M.shield.max, p1 = M.shield && M.shield.pool; AN.ab.cast(a, 'carapace'); window.__AN.step(0.6);
    r.refresh = { max1: Math.round(m1), pool1: Math.round(p1), max2: Math.round(M.shield && M.shield.max), pool2: Math.round(M.shield && M.shield.pool), cap: Math.round(hp * AN.ab.CFG.carapace.pool[a.k - 1]) };
    // free run: 30 s with the eight monsters round the pet (two of them right by Abaddon), the pet hurt now and then
    reset(); a.ab.act = null; live.forEach((m, i) => Object.assign(m, { x: me.x + 2 + (i % 4) * 0.9, y: me.y - 1 + Math.floor(i / 4) * 1.6 })); a.life = 30;
    const seen = [], cnt = {}; let idle = 0, maxIdle = 0, cur = 0;
    for (let i = 0; i < 30 * 28; i++) { if (i % 150 === 0) { me.inv = 0; D.X.hurtPet(hp * 0.12, live[0]); } window.__AN.step(1 / 30); if (a.st !== 'fight') break; const k = a.ab.act && a.ab.act.kind; if (k) { if (seen[seen.length - 1] !== k || cur === 0) { seen.push(k); cnt[k] = (cnt[k] || 0) + 1; } cur = 1; idle = 0; } else { cur = 0; idle += 1 / 30; maxIdle = Math.max(maxIdle, idle); } }
    r.free = { picks: seen.join(','), cnt, maxIdle: +maxIdle.toFixed(2) };
    return r; });
  /* ---- Belial ---- */
  out.blSetup = await stage('taurus');
  out.bl = await page.evaluate(() => { const { D, AN, live } = window.__AN, me = D.me, a = AN.S.list[0], M = AN.bl, hp = D.ST.hp, r = {};
    const park = () => live.forEach((m, i) => Object.assign(m, { x: me.x - 40 - i, y: me.y - 40 }));
    const tally = () => { const c = {}; for (let i = 0; i < 40; i++) { const q = M.choose(a); const k = q ? q.kind : 'none'; c[k] = (c[k] || 0) + 1; } return c; };
    const reset = () => { if (a.bl.act) a.bl.act = null; a.bl.last = null; a.bl.hurt = 0; me.hp = hp; a.life = 20; a.x = me.x + 1; a.y = me.y; };
    reset(); park(); Object.assign(live[0], { x: a.x + 6, y: a.y }); r.far = tally();
    reset(); park(); [[4.5, 0], [5, 0.6], [4.6, -0.6], [5.4, 0.2]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); r.crowd = tally();
    reset(); park(); me.hp = hp * 0.4; a.bl.hurt = hp * 0.15; [[0.8, 0.5], [-0.6, 0.7], [0.4, -0.8]].forEach(([dx, dy], i) => Object.assign(live[i], { x: me.x + dx, y: me.y + dy })); a.x = me.x + 7; r.petHurt = tally();
    reset(); park(); [[1.2, 0], [1.4, 0.8], [1.0, -0.9], [2.0, 0.3]].forEach(([dx, dy], i) => Object.assign(live[i], { x: a.x + dx, y: a.y + dy })); r.packed = tally();
    a.life = 2.0; r.packedEnd20 = tally(); a.life = 1.0; r.packedEnd10 = tally();
    reset(); live.forEach((m, i) => Object.assign(m, { x: me.x + 2 + (i % 4) * 1.2, y: me.y - 1.5 + Math.floor(i / 4) * 2.4 })); a.life = 30;
    const seen = [], cnt = {}; let idle = 0, maxIdle = 0;
    for (let i = 0; i < 30 * 28; i++) { if (i % 150 === 0) { me.inv = 0; D.X.hurtPet(hp * 0.12, live[0]); } window.__AN.step(1 / 30); if (a.st !== 'fight') break; const k = a.bl.act && a.bl.act.kind; if (k) { if (seen[seen.length - 1] !== k || idle > 0) { seen.push(k); cnt[k] = (cnt[k] || 0) + 1; } idle = 0; } else { idle += 1 / 30; maxIdle = Math.max(maxIdle, idle); } }
    r.free = { picks: seen.join(','), cnt, maxIdle: +maxIdle.toFixed(2) };
    return r; });
  console.log(JSON.stringify(out, null, 1));
  const A = out.ab, B = out.bl, top = c => Object.entries(c).sort((p, q) => q[1] - p[1])[0][0], n = c => Object.values(c).reduce((s, v) => s + v, 0);
  ok(A.shieldAfterOpen, 'Abaddon: the opening carapace shields the pet');
  ok(top(A.none) === 'none', 'Abaddon: nothing picked with no monsters about');
  ok(top(A.far) === 'reavers', 'Abaddon: a far lone monster -> Crescent Reavers');
  ok(['tide', 'reavers'].includes(top(A.crowd)) && (A.crowd.tide || 0) > 0, 'Abaddon: a crowd -> Gravitational Tide (or Reavers)');
  ok((A.closeAfterReavers.swipe || 0) > 0, 'Abaddon: after Reavers twice, a monster by it -> a swipe sometimes (variety)');
  ok(top(A.petHurtNoShield) === 'carapace', 'Abaddon: pet hurt and swarmed with no shield -> Lunar Carapace');
  ok(!A.petHurtShieldFull.carapace, 'Abaddon: no carapace recast while a full one holds (it refreshes only when spent / lapsing)');
  ok(top(A.storeHigh) === 'eclipse', 'Abaddon: much stored -> Eclipse Requiem');
  ok(!A.endLife12.tide && !A.endLife12.reavers && !A.endLife12.eclipse, 'Abaddon: nothing long starts in the last 1.2 s');
  ok(top(A.endLife05) === 'none', 'Abaddon: nothing starts in the last half second');
  ok(A.refresh.max2 === A.refresh.cap && A.refresh.pool2 <= A.refresh.cap, 'Abaddon: the carapace refreshes to its cap, never stacks');
  ok(Object.keys(A.free.cnt).length >= 3 && Math.max(...Object.values(A.free.cnt)) <= 0.65 * n(A.free.cnt), 'Abaddon: 30 s free run uses 3+ powers, none above 65%');
  ok(A.free.maxIdle < 0.6, 'Abaddon: never idle more than 0.6 s with monsters about');
  ok(top(B.far) === 'rush', 'Belial: a far monster -> Thronebreaker Rush');
  ok(top(B.crowd) === 'crown', 'Belial: a crowd -> Crown of Burdens');
  ok(top(B.petHurt) === 'carapace', 'Belial: the pet hurt and swarmed -> Citadel Carapace');
  ok(top(B.packed) === 'stamp', 'Belial: packed round it -> Graviton Stampede');
  ok(!B.packedEnd20.stamp && !B.packedEnd20.crown, 'Belial: no long power starts in the last 2 s');
  ok(Object.keys(B.free.cnt).length >= 2 && Math.max(...Object.values(B.free.cnt)) <= 0.7 * n(B.free.cnt), 'Belial: 30 s free run uses 2+ powers, none above 70%');
  ok(B.free.maxIdle < 1.0, 'Belial: never idle more than 1 s with monsters about');
  console.log('fails', fails.length, JSON.stringify(fails));
  console.log('errors', errors.length, JSON.stringify(errors.slice(0, 6)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
