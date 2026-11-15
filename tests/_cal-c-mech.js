// Rift 0 core mechanics: each brood monster's attack cycle (with pictures of it idle and winding up), level-1 time to
// kill with ordinary attacks, the crawler's plates and the sentinel's shield, the bomb return (safe hit -> flight ->
// burst on a monster; a red bomb's blast), the lava rule (burn and slide back to safe ground) and a vent.
// HTML=test-calC.html node tests/_cal-c-mech.js [brood|ttk|guard|bomb|lava|vent]
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const { open } = require('./_rift-lib');
const want = process.argv.slice(2), on = k => !want.length || want.includes(k);
(async () => {
  const T = await open({ lvl: 1 }); const { page, start, errors } = T;
  // a clear showcase floor (the core's own ashen placeholder), monsters gone
  await start('caldera', 0);
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; window.__CAL = D.RIFT.self.amb.CAL; window.__S0 = window.__pp.RIFT_BY_ID.caldera.stages[0]; const R = window.__pp.RIFT_BY_ID.caldera; R.stages[0] = Object.assign({ biome: 'ashen' }, window.__CAL.placeholder('ashen', 'Test', 'Test'), { kind: 'puzzle', trial: true }); });
  await start('caldera', 0);
  // game-time helpers (the headless page runs slowly: wait on the game's own clock)
  const runG = (secs, o) => page.evaluate(async ([secs, o]) => { const D = window.__pp.arc.game._dbg, t0 = D.g.t; while (D.g.t - t0 < secs) { await new Promise(r => requestAnimationFrame(r)); if (o && o.heal && !D.me.dead) { D.me.hp = D.ST.hp; } if (o && o.attack) { D.g.tapBuf = 0.3; } if (o && o.stay) { D.me.x = o.stay[0]; D.me.y = o.stay[1]; D.me.vx = D.me.vy = 0; } } }, [secs, o || null]);
  const clear = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const m of D.mons) if (!m.dead && !m.boss) m.dead = true; D.g.reserve && (D.g.reserve.length = 0); });
  const shot = n => page.screenshot({ path: path.resolve(__dirname, `../shots/cal-mech-${n}.png`) });
  const god = v => page.evaluate(v => { window.__pp.st.dun.god = v; }, v);
  await clear(); await runG(0.5);
  const home = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, P = D.M.marks.a[0]; return { x: P.x, y: P.y + 1 }; });
  const spawn = (t, dx, dy) => page.evaluate(([t, x, y]) => { const D = window.__pp.arc.game._dbg, X = D.RIFT.self.amb.C.X; const m = X.spawnMon(t, x, y, { rift: true, pack: 999 }); m.aggro = true; window.__M = m; return { hp: Math.round(m.hp), dmg: +m.dmg.toFixed(1) }; }, [t, home.x + dx, home.y + dy]);
  if (on('brood')) {
    const ATK = { cinderslug: ['w2', 'w3', 'spit'], basaltcrawler: ['wind', 'ram'], emberwisp: ['charge'], furnaceimp: ['wind'], runicsentinel: ['wind', 'open'], bomblarva: ['red', 'red2', 'g0'], ashenknight: ['wind', 's1', 'w2'], crystalwisp: ['aim'] };
    for (const t of Object.keys(ATK)) { await clear(); await god(true);
      await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; }, [home.x, home.y]);
      await page.evaluate(() => { window.__pp.arc.game._dbg.g.taps = 9; }); const st0 = await spawn(t, 2.6, -0.4); await runG(0.6, { stay: [home.x, home.y] }); await shot(t + '-idle');
      const r = await page.evaluate(async ([want, hx, hy]) => { const D = window.__pp.arc.game._dbg, m = window.__M, seen = new Set(), t0 = D.g.t; let shotAt = null;
        while (D.g.t - t0 < 8) { await new Promise(r => requestAnimationFrame(r)); D.me.x = hx; D.me.y = hy; D.me.vx = D.me.vy = 0; if (m.dead) break; seen.add(m.mode || '-'); if (!shotAt && want.includes(m.mode)) { shotAt = m.mode; break; } }
        return { seen: [...seen].join(','), shotAt, counters: ['spits', 'rams', 'shots', 'throws', 'bashes', 'opens', 'combos', 'beams'].filter(k => m[k]).map(k => k + ':' + m[k]).join(' '), st: m.cal ? m.cal.st : null }; }, [ATK[t], home.x, home.y]);
      await shot(t + '-attack');
      await runG(3, { stay: [home.x, home.y] });
      const r2 = await page.evaluate(() => { const m = window.__M; return ['spits', 'rams', 'shots', 'throws', 'bashes', 'opens', 'combos', 'beams'].filter(k => m[k]).map(k => k + ':' + m[k]).join(' '); });
      console.log('brood', t, JSON.stringify(st0), r.shotAt ? 'caught ' + r.shotAt : 'NO ATTACK SEEN', '| modes', r.seen, '| after 3 s more:', r2 || '-');
    }
  }
  if (on('ttk')) {
    for (const t of ['cinderslug', 'basaltcrawler', 'emberwisp', 'furnaceimp', 'runicsentinel', 'ashenknight', 'crystalwisp']) { await clear(); await god(true);
      await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; }, [home.x, home.y]); await spawn(t, 1.4, 0);
      const r = await page.evaluate(async ([hx, hy]) => { const D = window.__pp.arc.game._dbg, m = window.__M, t0 = D.g.t, hp0 = m.hp; m.cd = 99; let taps = 0;
        while (D.g.t - t0 < 25 && !m.dead) { await new Promise(r => requestAnimationFrame(r)); m.cd = 99; m.x = hx + 1.4; m.y = hy; D.me.x = hx; D.me.y = hy; D.me.face = 1; D.g.tapBuf = 0.3; D.g.tapAim = { x: 1, y: 0, a: 0, t: m }; D.g.taps = 9; }
        return { t: +(D.g.t - t0).toFixed(1), dead: m.dead, left: Math.round(Math.max(0, m.hp)), hp0: Math.round(hp0) }; }, [home.x, home.y]);
      console.log('ttk', t, JSON.stringify(r));
    }
  }
  if (on('guard')) {
    for (const t of ['basaltcrawler', 'runicsentinel']) { await clear(); await god(true);
      await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; }, [home.x, home.y]); await spawn(t, 1.5, 0); await runG(0.3);
      const r = await page.evaluate(([hx, hy]) => { const D = window.__pp.arc.game._dbg, m = window.__M; m.cd = 99; m.wT = 0; m.hd = Math.PI; m.face = -1; m.x = hx + 1.5; m.y = hy; m.openT = 0; m.reelT = 0;
        D.me.x = hx; D.me.y = hy; const h0 = m.hp; D.hitMon(m, 100, { src: 'normal' }); const front = h0 - m.hp;
        D.me.x = hx + 3; const h1 = m.hp; D.hitMon(m, 100, { src: 'normal' }); const back = h1 - m.hp;
        let open = null; if (m.type === 'runicsentinel') { D.me.x = hx; m.openT = 2; const h2 = m.hp; D.hitMon(m, 100, { src: 'normal' }); open = h2 - m.hp; }
        if (m.type === 'basaltcrawler') { D.me.x = hx; m.reelT = 1; m.mode = 'reel'; const h2 = m.hp; D.hitMon(m, 100, { src: 'normal' }); open = h2 - m.hp; }
        return { front: Math.round(front), back: Math.round(back), exposed: open && Math.round(open) }; }, [home.x, home.y]);
      console.log('guard', t, JSON.stringify(r), '(100 dealt each; exposed = sentinel open / crawler reeling, from the front)');
    }
  }
  if (on('bomb')) { await clear(); await god(true);
    await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; }, [home.x, home.y]);
    await spawn('cinderslug', 0, -4.5); await page.evaluate(() => { window.__TG = window.__M; window.__TG.cd = 99; });
    await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg, CAL = window.__CAL, X = D.RIFT.self.amb.C.X; window.__B = CAL.dropBomb(X, x + 1.8, y + 0.3, {}); }, [home.x, home.y]);
    await runG(1.2, { stay: [home.x, home.y] }); await shot('bomb-safe');
    const r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, CAL = window.__CAL, b = window.__B, tg = window.__TG, C = D.RIFT.self.amb.C, h0 = tg.hp, st0 = CAL.larvaState(b);
      D.hitMon(b, 10, { src: 'normal' }); const fl = C.flights.length, st1 = b.cal.st; const t0 = D.g.t; while (D.g.t - t0 < 1.4) { tg.cd = 99; await new Promise(r => requestAnimationFrame(r)); }
      return { before: st0, after: st1, flights: fl, targetHit: Math.round(h0 - tg.hp), targetHp: Math.round(h0), stat: C.stat }; });
    console.log('bomb return', JSON.stringify(r));
    // a bomb left alone: its blast with god off
    await god(false); await page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg, CAL = window.__CAL, X = D.RIFT.self.amb.C.X; window.__B = CAL.dropBomb(X, x + 0.6, y + 0.2, {}); D.me.hp = D.ST.hp; }, [home.x, home.y]);
    await runG(4.6, { stay: [home.x, home.y] }); await shot('bomb-red');
    const r2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = window.__B, hp0 = D.me.hp, t0 = D.g.t; while (D.g.t - t0 < 3 && !b.dead) await new Promise(r => requestAnimationFrame(r)); await new Promise(r => setTimeout(r, 100)); return { dead: b.dead, st: b.cal.st, petLost: Math.round(hp0 - D.me.hp), maxhp: Math.round(D.ST.hp) }; });
    console.log('bomb blast', JSON.stringify(r2)); await god(true);
  }
  if (on('lava')) { await clear(); await god(false);
    const r = await page.evaluate(async ([x, y]) => { const D = window.__pp.arc.game._dbg, CAL = window.__CAL, X = D.RIFT.self.amb.C.X, C = D.RIFT.self.amb.C; D.me.x = x; D.me.y = y; D.me.hp = D.ST.hp; const t0 = D.g.t; while (D.g.t - t0 < 0.6) await new Promise(r => requestAnimationFrame(r));
      const p = CAL.lavaPool(X, { x: x + 2.2, y, r: 1.0 }); D.me.x = x + 1.6; D.me.y = y; const hp0 = D.me.hp; const t1 = D.g.t; while (D.g.t - t1 < 0.8) await new Promise(r => requestAnimationFrame(r)); const res = { touches: C.stat.lavaTouches, petLost: Math.round(hp0 - D.me.hp), maxhp: Math.round(D.ST.hp), out: !CAL.inLava(X, D.me.x, D.me.y), at: [+D.me.x.toFixed(1), +D.me.y.toFixed(1)], from: [+(x + 1.6).toFixed(1), y] }; CAL.unlava(X, p); return res; }, [home.x, home.y]);
    console.log('lava', JSON.stringify(r)); await god(true); }
  if (on('vent')) { await clear(); await god(false);
    const r = await page.evaluate(async ([x, y]) => { const D = window.__pp.arc.game._dbg, CAL = window.__CAL, X = D.RIFT.self.amb.C.X; D.me.x = x; D.me.y = y; D.me.hp = D.ST.hp; const v = CAL.vent(X, { x, y, r: 1.0, period: 3, warn: 1.5, erupt: 0.9, phase: 1.4 }); window.__V = v; const hp0 = D.me.hp, sts = new Set(), t0 = D.g.t; let shot = false;
      while (D.g.t - t0 < 2.6) { await new Promise(r => requestAnimationFrame(r)); sts.add(v.st); if (v.st === 'warn' && v.t > 0.9 && !shot) { shot = true; window.__ventWarn = true; } if (v.st !== 'erupt') { D.me.x = x; D.me.y = y; } }
      v.on = false; return { states: [...sts].join(','), petLost: Math.round(hp0 - D.me.hp), pushed: +Math.hypot(D.me.x - x, D.me.y - y).toFixed(2) }; }, [home.x, home.y]);
    console.log('vent', JSON.stringify(r)); await god(true); }
  await page.evaluate(() => { window.__pp.RIFT_BY_ID.caldera.stages[0] = window.__S0; });
  console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})();
