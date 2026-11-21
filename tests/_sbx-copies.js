// v443 SB: GL copies a frame (WebGL -> 2D, the PERF line's "GL copies n/frame") and frame ms with a saw, a loot box and a
// spike plate on the screen, the pet standing still and the monsters away (and the same with the saw art off: __TRAPART = 0).
// usage: HTML=<test html> node tests/_sbx-copies.js   env: SPECS ('tower:5,rift:belfry:3,...'), N (frames, 6), OUT (json)
const { open } = require('./_sbx-lib');
(async () => {
  const T = await open({ dpr: +(process.env.DPR || 2) }); const { page, errors } = T, out = {};
  const specs = (process.env.SPECS || 'tower:5,rift:belfry:3,rift:garden:3').split(',');
  for (const sp of specs) { let info; try { info = await T.go(sp); } catch (e) { console.log(sp, 'start failed', e.message); continue; }
    console.log('==', sp, JSON.stringify(info)); out[sp] = { info };
    const RING = ["(() => { const D = window.__pp.arc.game._dbg; if (!D.rings.length) D.rings.push({ x: D.me.x, y: D.me.y, r0: 0.2, r1: 1.4, life: 0.6, max: 0.6, color: '#FFE37A', w: 0.12 }); })()"];
    for (const w of ['saw', 'pot:chest', 'pot:pot', 'haz:spikes']) { const f = await T.focus(w, 0); if (!f) continue;
      for (const sc of ['idle', 'fight']) { const hold = sc === 'fight' ? RING : [];
        const avg = (r, k) => +(r.reduce((a, x) => a + x[k], 0) / r.length).toFixed(2);
        await T.copies(2, hold); const r = await T.copies(+(process.env.N || 6), hold);
        let off = null; if (process.env.OFF !== '0') { await page.evaluate(() => { window.__TRAPART = 0; }); await T.copies(1, hold); off = avg(await T.copies(+(process.env.N || 6), hold), 'copies'); await page.evaluate(() => { window.__TRAPART = 1; }); }
        const st = await page.evaluate(() => self.TRAP_ART ? (s => ({ gpu: s.laidGPU, d2: s.laid2D }))(TRAP_ART.stats) : null);
        (out[sp][w] = out[sp][w] || {})[sc] = { copies: avg(r, 'copies'), passes: avg(r, 'fg'), ms: avg(r, 'ms'), copiesArtOff: off, each: r.map(x => x.copies).join(' '), lay: st };
        console.log('  ', (w + ' ' + sc).padEnd(17), 'copies', avg(r, 'copies'), '(' + r.map(x => x.copies).join(' ') + ')', 'passes', avg(r, 'fg'), 'ms', avg(r, 'ms'), off != null ? 'art off: ' + off : '', st ? 'lay gpu/2d ' + st.gpu + '/' + st.d2 : ''); } } }
  if (process.env.OUT) require('fs').writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
