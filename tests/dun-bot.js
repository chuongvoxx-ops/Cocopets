// Plays dungeon floors with a simple bot (tap the nearest monster, drag toward it) and reports errors, timings and outcomes.
// usage: node tests/dun-bot.js [floor] [seconds] [seed] [god]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const floor = +(process.argv[2] || 1), secs = +(process.argv[3] || 40), seed = +(process.argv[4] || 7), god = process.argv[5] !== 'nogod';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + (errors.length < 2 ? ' @ ' + (e.stack || '').split('\n').slice(1, 4).join(' / ') : '')));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  // skip onboarding, unlock everything
  await page.evaluate(({ g, an }) => { const P = window.__pp; if (!P.st) P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = g; P.st.energy = 100; P.st.dun.best = 99; window.__noan = an === 'none'; if (an && an !== 'none') { const [id, k, st] = an.split(':'); P.st.animas.have[id] = +k || 1; P.st.animas.eq = id; if (st) { P.st.stage = +st; const o = P.ANIMAS[id].opp; P.st.animas.have[o] = +k || 1; P.st.animas.res = o; } } }, { g: god, an: process.env.ANIMA || '' });
  await page.evaluate(() => { const P = window.__pp; P.openMap && P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(({ floor, seed }) => window.__pp.dun.startDungeon(floor, seed), { floor, seed });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  const ready = await page.evaluate(() => ({ F: (({ n, biome, boss, bossName, monCount, sec, ter }) => ({ n, biome, boss, bossName, monCount, sec, ter }))(window.__pp.arc.game._dbg.F), traps: window.__pp.arc.game._dbg.traps.length, stones: window.__pp.arc.game._dbg.stones.length }));
  console.log('ready', JSON.stringify(ready));
  await page.evaluate(() => { window.__pp.beginPlay(); if (true) { const me = window.__pp.arc.game._dbg.me; ['x', 'y'].forEach(k => { let v = me[k]; Object.defineProperty(me, k, { get() { return v; }, set(n) { if (!Number.isFinite(n) && !window.__nanAt) window.__nanAt = k + ' ' + n + ' ' + new Error().stack.split('\n').slice(1, 5).join(' / '); v = n; } }); }); } });
  const t0 = Date.now();
  let lastLog = 0, frames = 0;
  const stats = [];
  while (Date.now() - t0 < secs * 1000) {
    const r = await page.evaluate(() => {
      const P = window.__pp, A = P.arc, G = A.game; if (!G || A.state !== 'play') return { state: A.state };
      const D = G._dbg, me = D.me, g = D.g, W = A.W, H = A.H;
      const alive = D.mons.filter(m => !m.dead);
      // screen position of the nearest monster
      let best = null, bd = 1e9; for (const m of alive) { if (m.act === 'sleep') continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } }
      const [cx, cy] = [W / 2, H / 2];
      // a bot can't path through rooms: when stuck for a while, hop next to the target (test only)
      if (g._botKills !== g.kills) { g._botKills = g.kills; g._botStuck = g.t; }
      if (best && g.t - (g._botStuck || 0) > 7 && bd > 2.5) { const p = D.X.walkPoint(best.x + 2.5, best.y, { r: 0.3, mv: 0, x: me.x, y: me.y }); me.x = p.x; me.y = p.y; g._botStuck = g.t; }
      const tapW = (wx, wy) => { const sx = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + cx)), sy = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + cy)); G.down(sx, sy, 77); G.up(sx, sy, 77); };
      // two-thumb play: the left stick steers toward the target (by the floor's paths), taps on the right attack it
      const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y), sv = d > keep ? D.steerTo(tx, ty) : null, hx = 72, hy = H - 100;
        if (!sv) { if (D.stick.id === 88) G.up(hx, hy, 88); return; }
        if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + sv[0] * 44, hy + sv[1] * 44, 88); };
      if (best) {
        steer(best.x, best.y, best.boss ? 3.2 : 2.2);
        if (!g._botT || g.t - g._botT > 0.26) { g._botT = g.t; tapW(best.x, best.y); }
        ['strong', 'strong2', 'strong3'].forEach((k, i) => { const ab = D.KIT[k], cd = g[['cdS', 'cdS2', 'cdS3'][i]]; if (ab && me.mp > ab.cost && cd <= 0 && bd < 5) D.useStrong(k); });
        if (me.mp >= D.KIT.ult.cost && g.cdU <= 0 && alive.length > 3) D.useUlt();
        if (Math.random() < 0.05) D.dodge();
        if (D.AN && D.AN.ready() && !window.__noan) { D.AN.summon(); g._summons = (g._summons || 0) + 1; }
      } else if (g.boss && g.boss.act === 'sleep') { steer(g.boss.x, g.boss.y, 2); }
      return { an: D.AN && D.AN.kit ? `${D.AN.kit.main.id}${D.AN.kit.res ? '+' + D.AN.kit.res.id : ''} g${D.AN.S.gauge.toFixed(2)} n${D.AN.S.list.length} x${g._summons || 0}` : 'none', state: A.state, t: g.t.toFixed(1), hp: Math.round(me.hp), mp: Math.round(me.mp), alive: alive.length, kills: g.kills, taps: g.taps, boss: g.boss ? `${g.boss.bname}:${g.boss.act}:${Math.round(g.boss.hp)}/${Math.round(g.boss.maxhp)}:p${g.boss.phase}` : null, cleared: g.cleared, won: g.won, pw: Object.keys(g.pw).join('+'), stones: D.stones.length, ev: g.eventN, parts: D.parts.length, es: D.eshots.length };
    });
    if (r.state !== 'play') { console.log('state', r.state); if (r.state === 'over' || r.state === 'done' || r.state === 'end') break; }
    frames++;
    if (Date.now() - lastLog > 3000) { lastLog = Date.now(); console.log(JSON.stringify(r)); stats.push(r); }
    if (r.state !== 'play') { await page.waitForTimeout(300); const s = await page.evaluate(() => window.__pp.arc.state); if (s !== 'play') { console.log('final state', s); break; } }
    await page.waitForTimeout(60);
  }
  console.log('nanAt:', await page.evaluate(() => window.__nanAt || 'none'));
  const panel = await page.evaluate(() => { const p = document.querySelector('#arcPanel'); return p && !p.hidden ? p.innerText.replace(/\s+/g, ' ').slice(0, 300) : ''; });
  console.log('bad:', await page.evaluate(() => { const D = window.__pp.arc.game && window.__pp.arc.game._dbg; if (!D) return 'nogame'; const bad = o => ['x', 'y', 'z', 'vx', 'vy', 'vz'].filter(k => o[k] !== undefined && !Number.isFinite(o[k])); return JSON.stringify({ picks: D.picks.filter(p => bad(p).length).slice(0, 3).map(p => [p.kind, bad(p), p.x, p.y, p.z, p.t]), mons: D.mons.filter(m => bad(m).length).slice(0, 3).map(m => [m.type, bad(m), m.dead]), me: bad(D.me) }); }));
  console.log('panel:', panel);
  console.log('crystals:', await page.evaluate(() => window.__pp.st.crystals));
  await page.screenshot({ path: path.resolve(__dirname, `../shots/dun-f${floor}-s${seed}.png`) });
  console.log('errors:', errors.length, errors.slice(0, 8));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
