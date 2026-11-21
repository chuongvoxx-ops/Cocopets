// v443 SB: the painter's passes in one frame (dev only): who began each, its quads, whether it was laid
const { open } = require('./_sbx-lib');
(async () => { const T = await open({ dpr: 2 }); const { page, errors } = T;
  for (const sp of (process.env.SPECS || 'tower:5').split(',')) { const [spec, what] = sp.split('@'); const info = await T.go(spec); const f = await T.focus(what || 'saw', 0); await T.copies(2);
    const r = await page.evaluate(() => { const F = self.NIDHOGG_MOVES.FGFX, out = []; const b0 = F.begin, f0 = F.flush; let cur = null;
      F.begin = function (c) { const L = (new Error().stack || '').split('\n').slice(2, 4).map(s => (s.match(/at (\S+)/) || [])[1]).join('<'); const Q = b0.apply(this, arguments); cur = { who: L, Q }; return Q; };
      F.flush = function (c) { if (cur) out.push(cur.who + ' nl=' + cur.Q.nl + ' ns=' + cur.Q.ns + (c && c.canvas && c.canvas.id === 'arcCanvas' ? '' : ' (other canvas)')); cur = null; return f0.apply(this, arguments); };
      const P = window.__pp, G = P.arc.game, c = document.getElementById('arcCanvas').getContext('2d'); G.update(1 / 60); c.save(); G.draw(c); c.restore(); F.frameEnd(); F.begin = b0; F.flush = f0; return out; });
    console.log('==', spec, what, JSON.stringify(info.traps), f && f.kind); r.forEach(x => console.log('   ', x)); }
  console.log('errors', errors.length); await T.browser.close(); })();
