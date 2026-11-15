// How long each caldera trial takes a level-1 starter that knows the way (a "practiced" run), played by a bot through the real
// controls (the stick, taps on monsters, the ult when ready), the game stepped at 60 fps. It knows the answers (the causeway's
// right turns, the rings' plan) but walks, fights and waits for vents like a player. Health is never refilled; the lowest
// health seen and any knock-outs are reported. HTML=test-calS.html node tests/_cal-s-time.js [stage]
const { openCal } = require('./_cal-s-lib');
(async () => {
  const T = await openCal(); const { page, errors } = T; const out = {}; if (process.env.NOULT) await page.evaluate(() => { window.__noUlt = true; });
  for (const stage of (process.argv[2] ? [+process.argv[2]] : [0, 2, 4])) {
    await T.start('caldera', stage);
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
      if (stage === 0) bot = () => { const S = mod.S; if (fight(S.entered ? 0 : 30)) return;
        if (!mod.hatch.open) return steer(16.5, 24, 1);
        if (!S.latched) { if (S.surge > 0) return stop(); if (S.primed) return useAt(objs('calreservoir')[0], S.surge > 0 ? 1 : 0, 1.3); const pc = mod.missing(); if (pc) return useAt(pc.obj, S.turns); return steer(16.5, 16, 0.5); }
        const st = objs('calspring')[0] || objs('calshrine')[0]; if (st && !(mod.shrine.used)) return useAt(st, mod.shrine.used ? 1 : 0, 1.2); const e = D.RIFT.exit; if (e) steer(e.x, e.y, 0); };
      if (stage === 2) bot = () => { const S = mod.S, B = mod.bomb; if (B.m && B.safe()) { steer(B.m.x, B.m.y, 1.2); if (g.t - lastTap > 0.26) { lastTap = g.t; tapW(B.m.x, B.m.y); } return; } if (fight(30)) return;
        if (!S.solved) { const plan = mod.ringsPlan(S.rings); const L = mod.levers.find(l => l.id === plan[0]); return useAt(L.obj, S.pulls); }
        if (!S.opened) return stop(); const st = objs('calspring')[0] || objs('calshrine')[0]; if (st && !mod.shrine.used) return useAt(st, 0, 1.2); const e = D.RIFT.exit; if (e) steer(e.x, e.y, 0); };
      if (stage === 4) { const path = [[16.5, 66], [16.5, 52], [16.5, 44], [16.5, 30], [16.5, 22], [16.5, 16], [16.5, 13]]; let wi = 0;
        bot = () => { const S = mod.S; if (S.demo < 2) return stop(); const L = S.ledge; if (L >= 1 && S.awake[L - 1] && fight(30, m => mod.groups[L - 1].includes(m))) return;
          if (fight(3)) return;
          // the next vent ahead: hold back while it hisses or erupts (or is about to)
          for (const v of mod.vents) { if (!v.live) continue; const ahead = v.y < me.y && v.y > me.y - 2.6 && Math.abs(v.x - me.x) < 2.2, inside = Math.hypot(v.x - me.x, v.y - me.y) < 1.9; if (ahead && !inside && (v.ph === 'warn' || v.ph === 'erupt' || (v.ph === 'idle' && v.t > 1.0))) return stop(); }
          const p = path[wi]; if (!p) { const st = objs('calspring')[0] || objs('calshrine')[0]; if (st && !mod.shrine.used) return useAt(st, 0, 1.2); const e = D.RIFT.exit; if (e) steer(e.x, e.y, 0); return; }
          if (L >= 1 && !S.open[L - 1] && p[1] < [44, 22][L - 1] - 2) return steer(16.5, [46, 24][L - 1], 1);
          if (steer(p[0], p[1], 0.6)) wi++; if (me.y > path[Math.max(0, wi - 1)][1] + 3 && wi > 0 && S.falls) wi = Math.max(0, path.findIndex(q => q[1] < me.y)); }; }
      const t0 = g.t; let win = -1; const marks = {}, mark = (k, c) => { if (c && marks[k] == null) marks[k] = +(g.t - t0).toFixed(1); };
      const ms = () => { const S = mod.S; if (stage === 0) { mark('hatch', mod.hatch.open); mark('cavern', S.entered); mark('primed', S.primed); mark('latched', S.latched); }
        if (stage === 2) { mark('packs12', !mod.P1.concat(mod.P2).some(m => !m.dead)); mark('bomb', mod.bomb.returned > 0); mark('solved', S.solved); mark('opened', S.opened); }
        if (stage === 4) { mark('demo', S.demo === 2); mark('ledge1', S.ledge >= 1); mark('clear1', S.open[0]); mark('ledge2', S.ledge >= 2); mark('clear2', S.open[1]); }
        mark('done', D.RIFT.done); };
      for (let i = 0; i < 60 * 420 && A.state === 'play'; i++) { bot(); run(1 / 60); ms(); if (me.hp > 0) minHp = Math.min(minHp, me.hp / D.ST.hp); if (me.hp < D.ST.hp * 0.15) { kos++; me.hp = D.ST.hp; } if (g.won && win < 0) { win = g.t - t0; break; } if (i % 600 === 0) await new Promise(r => setTimeout(r, 0)); }
      stop(); G.update = run; const C = D.RIFT.self.amb && D.RIFT.self.amb.C;
      return { stage, secs: +(win > 0 ? win : g.t - t0).toFixed(1), won: win > 0, minHp: +minHp.toFixed(2), rescued: kos, kills: g.kills, marks, ult: !!(D.KIT && D.KIT.ult), level: D.ST.L, falls: mod.S.falls, stat: C && C.stat, goal: document.getElementById('arcGoal').textContent }; }, stage);
    console.log(JSON.stringify(r)); out[stage] = r;
  }
  console.log('errors', errors.slice(0, 3)); await T.browser.close();
})();
