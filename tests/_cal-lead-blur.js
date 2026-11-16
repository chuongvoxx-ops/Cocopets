// lead check (v388): the lava below the ledges blurred and set back (HTML=test-lead.html node tests/_cal-lead-blur.js)
// shots/cal-blur-<stage>-<off|on>.png: the old sharp lava, then the new far lava, from the same spot
process.env.HTML = process.env.HTML || 'test.html';
const path = require('path');
const { open } = require('./_rift-lib');
(async () => { const T = await open({ lvl: 12 }); const { page, start, run } = T;
  for (const st of (process.env.ST || '1,3,6').split(',').map(Number)) { await start('caldera', st); await run(3);
    // stand by the nearest stretch of lava so it fills part of the screen
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.M, G = M.G || D.G, MW = M.MW, me = D.me; let best = null, bd = 1e9;
      for (let i = 0; i < G.length; i++) if (G[i] === 0) { const x = i % MW, y = (i / MW) | 0, d = Math.hypot(x - me.x, y - me.y); if (d > 3 && d < bd) { bd = d; best = { x, y }; } }
      for (const m of D.mons) m.dead = true; window.__gap = best; });
    for (const off of [true, false]) { await page.evaluate(o => { window.__pp.arc.game._dbg.RIFT.self.amb.CAL.FAR.off = o; }, off); await run(0.6);
      await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-blur-${st}-${off ? 'off' : 'on'}.png`) }); }
    console.log(st, await page.evaluate(() => JSON.stringify({ gap: window.__gap, here: window.__pp.arc.game._dbg.RIFT.self.amb.CAL.FAR.here, name: window.__pp.arc.game._dbg.RIFT.self.S.name }))); }
  console.log('errors', T.errors.slice(0, 3)); await T.browser.close(); })();
