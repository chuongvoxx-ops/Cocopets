// How long each caldera trial takes a level-1 starter that knows the way (a "practiced" run), played by a bot through the real
// controls (the stick, taps on monsters, the ult when ready), the game stepped at 60 fps. It knows the answers (the causeway's
// right turns, the rings' plan) but walks, fights and waits for vents like a player. Health is never refilled; the lowest
// health seen and any knock-outs are reported. HTML=test-calS.html node tests/_cal-s-time.js [stage]
const { openCal } = require('./_cal-s-lib');
(async () => {
  const T = await openCal(); const { page, errors } = T; const out = {}; if (process.env.NOULT) await page.evaluate(() => { window.__noUlt = true; }); if (process.env.TRACE) await page.evaluate(() => { window.__trace = []; }); if (process.env.MAXT) await page.evaluate(m => { window.__maxT = m; }, process.env.MAXT);
  for (const stage of (process.argv[2] ? [process.argv[2]] : ['HOLLOWS', 'FOUNDRY', 'DESCENT'])) {
    await T.startTrial(stage);
    const r = await page.evaluate(async stage => {
      const P = window.__pp, A = P.arc, G = A.game, D = G._dbg, g = D.g, me = D.me, run = G.update, mod = D.RIFT.self.mod, W = A.W, H = A.H; G.update = () => {};
      const tapW = (wx, wy) => { const X = Math.max(10, Math.min(W - 10, (wx - me.x) * 40 * g.zoom + W / 2)), Y = Math.max(10, Math.min(H - 10, (wy - me.y) * 40 * g.zoom + H / 2)); G.down(X, Y, 77); G.up(X, Y, 77); };
      const hx = 72, hy = H - 100, stop = () => { if (D.stick.id === 88) G.up(hx, hy, 88); };
      const steer = (tx, ty, keep) => { const d = Math.hypot(tx - me.x, ty - me.y), sv = d > keep ? D.steerTo(tx, ty) : null; if (!sv) { stop(); return true; } if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx + sv[0] * 44, hy + sv[1] * 44, 88); return false; };
      let lastTap = -9, minHp = 1, kos = 0, away = null, lastCount = -1;
      const objs = k => D.RIFT.objs.filter(o => o.kind === k);
      const fight = (range, filt) => { let best = null, bd = 1e9; for (const m of D.mons) { if (m.dead || (filt && !filt(m))) continue; if (m.cal && (m.cal.st === 'red' || m.cal.st === 'hover' || m.cal.st === 'land')) continue; const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } } if (!best || bd > range) return false;
        steer(best.x, best.y, 1.6); if (g.t - lastTap > 0.26) { lastTap = g.t; tapW(best.x, best.y); } if (!window.__noUlt && me.mp >= D.KIT.ult.cost && g.cdU <= 0 && D.useUlt) D.useUlt(); return true; };
      // stand at an object until a counter changes; then step away (so it can be used again)
      const useAt = (o, count, side) => { if (away) { if (steer(away.x, away.y, 0.3) || Math.hypot(me.x - away.x, me.y - away.y) < 0.4) away = null; return; }
        if (lastCount >= 0 && count !== lastCount) { lastCount = -1; away = { x: o.x + (side || 0) * 0 + 0, y: o.y + 2.4 }; return; }
        const tx = o.x + (side || 0), ty = o.y + (side ? 0 : 0.2); if (steer(tx, ty, 0.25)) { me.vx = me.vy = 0; if (lastCount < 0) lastCount = count; } };
      let bot;
      const B = mod.brood, roomGo = () => { const R = B.room(); if (!R) return false; const p = R.spots[2]; return steer(p.x, (R.y0 + R.y1) / 2, 1); };
      // hold back from a live vent just ahead that is hissing or erupting (or about to)
      const ventWait = () => { for (const v of mod.vents || []) { if (!v.live) continue; const ahead = v.y < me.y && v.y > me.y - 2.6 && Math.abs(v.x - me.x) < 2.2, inside = Math.hypot(v.x - me.x, v.y - me.y) < 1.9; if (ahead && !inside && (v.ph === 'warn' || v.ph === 'erupt' || (v.ph === 'idle' && v.t > 1.0))) { stop(); return true; } } return false; };
      const shrineThenExit = () => { const st = objs('calspring')[0] || objs('calshrine')[0]; if (st && !mod.shrine.used) return useAt(st, 0, 1.2); const e = D.RIFT.exit; if (e) steer(e.x, e.y, 0); };
      if (stage === 'HOLLOWS') bot = () => { const S = mod.S; if (!B.done) { if (fight(30)) return; return roomGo(); }
        if (!S.latched) { if (!S.entered) return steer(16.5, 18.5, 0.5); if (S.surge > 0) return stop(); if (S.primed) return useAt(objs('calreservoir')[0], S.surge > 0 ? 1 : 0, 1.3); const pc = mod.missing(); if (pc) return useAt(pc.obj, S.turns); return steer(16.5, 16, 0.5); }
        shrineThenExit(); };
      if (stage === 'FOUNDRY') bot = () => { const S = mod.S, Bm = mod.bomb; if (Bm.m && Bm.safe()) { steer(Bm.m.x, Bm.m.y, 1.2); if (g.t - lastTap > 0.26) { lastTap = g.t; tapW(Bm.m.x, Bm.m.y); } return; }
        if (!B.done) { if (fight(30)) return; return roomGo(); }
        if (!S.solved) { const plan = mod.ringsPlan(S.rings); const L = mod.levers.find(l => l.id === plan[0]); return useAt(L.obj, S.pulls); }
        if (!S.opened) return stop(); shrineThenExit(); };
      if (stage === 'DESCENT') bot = () => { const S = mod.S; if (S.demo < 2) return stop();
        if (!B.done) { if (B.wave >= 0 && fight(30)) return; if (fight(2.5)) return; if (ventWait()) return; return roomGo(); }
        const Cc = mod.court; if (!Cc.done) { // the Ember Court: stand near the middle; side-step a lobbed ball's circle; roll through a ball as it arrives
          if (!Cc.on) return steer(16.5, 26, 0.5);
          if (Cc.phase === 'wake' || Cc.phase === 'fight') { // the idols: stand between the two awake ones; roll as a charge reaches the pet
            const Aw = mod.awake(); for (const t of Aw) if (t.st === 'charge' && !t.passed && !me.dodge && Math.hypot(me.x - t.x, me.y - t.y) < 1.7) { stop(); G.key('dodge', true); return; }
            if (Aw.some(t => t.st === 'charge' || (t.st === 'wind' && t.lockd))) return stop();
            if (Aw.length === 2) return steer((Aw[0].x + Aw[1].x) / 2, (Aw[0].y + Aw[1].y) / 2, 0.35); return stop(); }
          for (const b of Cc.balls) { if (b.res) continue; if (b.kind === 'lob') { const dd = Math.hypot(me.x - b.tx, me.y - b.ty); if (dd < b.R + 0.6) { const a = Math.atan2(me.y - b.ty, me.x - b.tx); return steer(b.tx + Math.cos(a) * (b.R + 1.2), b.ty + Math.sin(a) * (b.R + 1.2), 0.1); } continue; }
            const dd = Math.hypot(me.x - b.x, me.y - b.y); if (dd < b.r + 1.0 && !me.dodge) { const v = Math.hypot(b.vx, b.vy) || 1; if (D.stick.id !== 88) G.down(hx, hy, 88); G.move(hx - b.vy / v * 44, hy + b.vx / v * 44, 88); G.key('dodge', true); return; } }
          return steer(16.5, 25.5, 1.2); }
        if (ventWait()) return; shrineThenExit(); };
      const t0 = g.t; let win = -1; const marks = {}, mark = (k, c) => { if (c && marks[k] == null) marks[k] = +(g.t - t0).toFixed(1); };
      const ms = () => { const S = mod.S; mark('brood', mod.brood.done); if (stage === 'HOLLOWS') { mark('primed', S.primed); mark('latched', S.latched); }
        if (stage === 'FOUNDRY') { mark('bomb', mod.bomb.returned > 0); mark('solved', S.solved); }
        if (stage === 'DESCENT') { mark('demo', S.demo === 2); mark('court', S.court.on); mark('dodged6', S.court.phase !== 'dodge' && S.court.on); mark('shattered6', S.court.done); }
        mark('done', D.RIFT.done); };
      for (let i = 0; i < 60 * (+window.__maxT || 900) && A.state === 'play'; i++) { bot(); run(1 / 60); ms(); if (window.__trace && i % 60 === 0 && D.RIFT.done) window.__trace.push([+(g.t - t0).toFixed(0), +me.x.toFixed(1), +me.y.toFixed(1), D.stick.id, +(me.vx || 0).toFixed(1), +(me.vy || 0).toFixed(1)]); if (me.hp > 0) minHp = Math.min(minHp, me.hp / D.ST.hp); if (me.hp < D.ST.hp * 0.15) { kos++; me.hp = D.ST.hp; } if (g.won && win < 0) { win = g.t - t0; break; } if (i % 600 === 0) await new Promise(r => setTimeout(r, 0)); }
      stop(); G.update = run; const C = D.RIFT.self.amb && D.RIFT.self.amb.C;
      return { stage, secs: +(win > 0 ? win : g.t - t0).toFixed(1), pos: [+me.x.toFixed(1), +me.y.toFixed(1)], trace: (window.__trace || []).slice(0, 12), won: win > 0, minHp: +minHp.toFixed(2), rescued: kos, kills: g.kills, marks, ult: !!(D.KIT && D.KIT.ult), level: D.ST.L, falls: mod.S.falls, court: mod.S.court && { hits: mod.S.court.hits, attacks: mod.S.court.attacks, voids: mod.S.court.voids, far: mod.S.court.far, charges: mod.S.court.charges, crashes: mod.S.court.crashes, perfects: mod.S.court.perfects, chargeHits: mod.S.court.chargeHits }, brood: mod.brood.total, killedBrood: mod.brood.killed(), stat: C && C.stat, goal: document.getElementById('arcGoal').textContent }; }, stage);
    console.log(JSON.stringify(r)); out[stage] = r;
  }
  console.log('errors', errors.slice(0, 3)); await T.browser.close();
})();
