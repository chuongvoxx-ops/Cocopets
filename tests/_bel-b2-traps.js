// The Drowned Belfry's floor traps (v394 B2, 20n7-belfry-traps.js): placement (counts, spacing, the avoid list, plain floor),
// a hit (8% and a shove) and a dodge roll passing through, for each kind; pictures of each kind calm, building and bursting.
// HTML=test-belB2.html node tests/_bel-b2-traps.js [place|hit|shots]
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const want = process.argv.slice(2), on = k => !want.length || want.includes(k);
const results = []; const ok = (name, pass, info) => { results.push(pass); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${info ? ' · ' + JSON.stringify(info) : ''}`); };
(async () => { const { chromium } = require('/opt/npm-tools/node_modules/playwright');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true }); page.setDefaultTimeout(240000);
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML), { timeout: 240000 }); await page.waitForFunction(() => window.__pp, null, { timeout: 240000 });
  // a Belfry dungeon floor (the first stage), its X and H caught as it is made
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = false; P.st.energy = 100; P.st.dlv = 10; P.st.dun.best = 10;
    const S = P.RIFT_BY_ID.belfry.stages[0]; if (!S.__wrapped) { const mk = S.make; S.make = function (X, self, H) { window.__XH = { X, H }; return mk.call(this, X, self, H); }; S.__wrapped = true; }
    P.openMap(); P.dun.setMapTab('rift', true); P.startRift('belfry', 0); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready'); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play');
  const G = 'window.__pp.arc.game';
  if (on('place')) {
    const r = await page.evaluate(() => { const { X, H } = window.__XH, D = window.__pp.arc.game._dbg, B = self.BEL_TRAPS, out = [];
      const st = D.M.start || { x: D.me.x, y: D.me.y }, extra = { x: st.x + 6, y: st.y - 8, r: 6 };
      for (const [n, kinds] of [[15, null], [22, ['toll', 'geyser', 'riptide']], [30, ['rod', 'geyser', 'toll', 'riptide']]]) { B.clear(); const F = B.place(X, H, { count: n, kinds, avoid: [{ x: st.x, y: st.y, r: 4.5 }, extra] });
        const T = F.traps, MW = D.M.MW, Gd = D.M.G; let minGap = 99, avoidBad = 0, floorBad = 0; const kc = {};
        for (let i = 0; i < T.length; i++) { kc[T[i].kind] = (kc[T[i].kind] || 0) + 1; for (let j = i + 1; j < T.length; j++) minGap = Math.min(minGap, Math.hypot(T[i].x - T[j].x, T[i].y - T[j].y)); if (Math.hypot(T[i].x - extra.x, T[i].y - extra.y) < extra.r || Math.hypot(T[i].x - st.x, T[i].y - st.y) < 4.5) avoidBad++;
          const tx = Math.floor(T[i].x), ty = Math.floor(T[i].y); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const k = (ty + dy) * MW + tx + dx; if (Gd[k] !== 1 && Gd[k] !== window.__pp.arc.game._dbg.M.G[ty * MW + tx]) floorBad++; if (D.M.props.has(k)) floorBad++; } }
        out.push({ n, got: T.length, minGap: +minGap.toFixed(2), avoidBad, floorBad, kinds: kc }); }
      return { out, map: [D.M.MW, D.M.MH] }; });
    for (const q of r.out) ok(`place ${q.n}: count, at least 3.5 apart, clear of the avoid list, on plain floor`, q.got === q.n && q.minGap >= 3.5 && !q.avoidBad && !q.floorBad, q);
  }
  if (on('hit')) {
    // each kind: the pet on it (the toll: two tiles out, where the wave passes); a hit; then a dodge roll through it
    const r = await page.evaluate(() => { const { X, H } = window.__XH, D = window.__pp.arc.game._dbg, B = self.BEL_TRAPS, Gm = window.__pp.arc.game, out = {};
      B.clear(); const F = B.place(X, H, { count: 8, kinds: ['geyser', 'toll', 'riptide', 'rod'] }); for (const k in B.KINDS) F.taught[k] = true;
      for (const kd of ['geyser', 'toll', 'riptide', 'rod']) { const tp = F.traps.find(q => q.kind === kd); const res = {};
        for (const dodge of [false, true]) { for (const q of F.traps) { q.st = 'idle'; q.t = 0; q.demo = false; } D.me.x = tp.x + (kd === 'toll' ? 2 : 0.1); D.me.y = tp.y; D.me.vx = D.me.vy = 0; D.me.inv = 0; D.me.dodge = null; D.me.push = null; D.me.hp = D.ST.hp; const hp0 = D.me.hp, h0 = F.stat.hits, d0 = F.stat.dodged;
          tp.st = 'warn'; tp.t = tp.K.warn - 0.05; let pulled = 0; const x0 = D.me.x;
          for (let i = 0; i < 40; i++) { if (dodge && tp.st === 'burst' && !D.me.dodge) D.me.dodge = { t: 0, dur: 0.3, vx: 0, vy: 0.001, perf: false }; if (dodge && D.me.dodge) D.me.dodge.t = 0.05; Gm.update(1 / 30); D.me.x = D.me.x; }
          res[dodge ? 'dodge' : 'hit'] = { lost: Math.round(hp0 - D.me.hp), pct: +((hp0 - D.me.hp) / D.ST.hp * 100).toFixed(1), hits: F.stat.hits - h0, dodged: F.stat.dodged - d0, shoved: !!D.me.push || Math.hypot(D.me.x - tp.x, D.me.y - tp.y) > 0.5 }; D.me.dodge = null; }
        out[kd] = res; }
      // the riptide drags the pet while it whirls
      const rp = F.traps.find(q => q.kind === 'riptide'); for (const q of F.traps) { q.st = 'idle'; q.t = 0; } D.me.x = rp.x + 2.2; D.me.y = rp.y; D.me.dodge = null; rp.st = 'warn'; rp.t = 0; for (let i = 0; i < 30; i++) Gm.update(1 / 30); out.pull = +(2.2 - Math.hypot(D.me.x - rp.x, D.me.y - rp.y)).toFixed(2);
      // only those near the pet run; the first of a kind met is a harmless demo
      B.clear(); const F2 = B.place(X, H, { count: 15 }); D.me.x = F2.traps[0].x + 4; D.me.y = F2.traps[0].y; D.me.hp = D.ST.hp; const hpA = D.me.hp; for (let i = 0; i < 200; i++) { Gm.update(1 / 30); D.me.hp = Math.max(D.me.hp, 1); }
      out.farIdle = F2.traps.filter(q => Math.hypot(q.x - D.me.x, q.y - D.me.y) > 13).every(q => q.st === 'idle' && q.n === 0 || q.n <= 1); out.demos = F2.stat.demos; out.taught = Object.keys(F2.taught).length;
      return out; });
    for (const kd of ['geyser', 'toll', 'riptide', 'rod']) ok(`${kd}: a hit costs ~8% and shoves; a dodge roll passes through`, r[kd].hit.hits === 1 && Math.abs(r[kd].hit.pct - 8) < 3 && r[kd].dodge.lost === 0 && r[kd].dodge.hits === 0, r[kd]);
    ok('riptide: it drags the pet toward it while it whirls', r.pull > 0.3, { pull: r.pull });
    ok('only traps within 13 tiles run; the first of a kind is a harmless demo', r.farIdle && r.demos >= 1, { farIdle: r.farIdle, demos: r.demos, taught: r.taught });
  }
  if (on('shots')) { const fs = require('fs'); await page.setViewportSize({ width: 900, height: 560 });
    // an open patch of plain floor (14 x 7 tiles, no props), the four kinds in a row on it, the pet just below
    const at = await page.evaluate(() => { const { X, H } = window.__XH, D = window.__pp.arc.game._dbg, B = self.BEL_TRAPS, M = D.M; B.clear();
      let best = null; for (let y = 4; y < M.MH - 10; y++) for (let x = 4; x < M.MW - 18; x++) { let good = true;
        for (let yy = y; yy < y + 7 && good; yy++) for (let xx = x; xx < x + 14; xx++) { const k = yy * M.MW + xx; if (M.G[k] !== 1 || M.props.has(k)) { good = false; break; } }
        if (good) { const d = Math.hypot(x - D.me.x, y - D.me.y); if (!best || d < best.d) best = { x, y, d }; } }
      if (!best) return null; const F = B.place(X, H, { count: 8, kinds: ['geyser', 'toll', 'riptide', 'rod'] }); window.__F = F; F.freeze = true; for (const k in B.KINDS) F.taught[k] = true;
      const pick = ['geyser', 'toll', 'riptide', 'rod'].map(k => F.traps.find(q => q.kind === k));
      for (const q of F.traps) if (!pick.includes(q)) { q.x = q.y = -99; if (q.obj) { q.obj.x = q.obj.y = -99; } }
      pick.forEach((q, i) => { q.x = best.x + 1.5 + i * 3.6; q.y = best.y + 2.5; if (q.obj) { q.obj.x = q.x; q.obj.y = q.y + 0.05; } });
      D.me.x = best.x + 7; D.me.y = best.y + 3.3; D.me.vx = D.me.vy = 0; D.mons.length = 0; return best; });
    console.log('patch', JSON.stringify(at)); await page.waitForTimeout(6000);
    const shots = [];
    for (const [nm, st, u] of [['calm', 'idle', 0], ['build', 'warn', 0.5], ['bright', 'warn', 0.93], ['burst', 'burst', 0.28]]) {
      await page.evaluate(([st, u]) => { const D = window.__pp.arc.game._dbg; D.mons.length = 0; for (const q of window.__F.traps) { if (q.x < 0) continue; q.st = st; q.t = st === 'warn' ? q.K.warn * u : st === 'burst' ? q.K.burst * u : 0; q.front = st === 'burst' ? 0.4 + (q.K.r - 0.4) * u * 1.6 : 0;
        if (q.kind === 'rod' && st === 'warn') { q.sparks.length = 0; for (let i = 0; i < 14; i++) q.sparks.push({ u: Math.random() * 0.9, t: Math.random() * 0.1, s: Math.random() }); } } }, [st, u]);
      await page.waitForTimeout(4000); const f = path.resolve(__dirname, `../shots/bel-traps-${process.env.SHOT_TAG || ''}${nm}.png`); await page.screenshot({ path: f }); shots.push(f); }
    console.log('shots', shots.join(' ')); ok('trap pictures taken', !!at && shots.every(f => fs.existsSync(f)));
  }
  console.log(`\n${results.filter(Boolean).length}/${results.length} passed · page errors: ${errors.length}`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));
  await browser.close(); process.exit(errors.length || results.some(r => !r) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
