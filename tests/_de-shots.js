// v433 DE: shots of the dunes' lands, props and puzzle pieces -> shots/v433-DE/<TAG>-<scene>.png
// env: HTML (test-de.html), TAG (after), DPR (1), ONLY (comma list of scene names), LOWFX, NOGL
const { open } = require('./_de-lib');
const SCENES = [
  ['road-rock', 0, ['dunerock']], ['road-bones', 0, ['bones']], ['road-wide', 0, null],
  ['glide', 2, 'glide'],
  ['echo', 4, 'echo'], ['flats-mesa', 5, ['mesarock']], ['flats-crystal', 5, ['pinkcrystal']], ['flats-wide', 6, null],
  ['night-rock', 8, ['nightrock']], ['night-skull', 8, ['skullpile', 'deadshrub']], ['night-wide', 10, null],
  ['mounds', 9, 'mounds'],
];
(async () => {
  const tag = process.env.TAG || 'after', only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const T = await open({ dpr: +(process.env.DPR || 1), lowFx: !!process.env.LOWFX, noGL: !!process.env.NOGL, gpu: process.env.GPU !== '0', off: process.env.OFF === '1' });
  let last = -1;
  for (const [name, si, what] of SCENES) { if (only && !only.includes(name)) continue;
    const t0 = Date.now();
    try {
      if (si !== last || what === null) { await T.stage(si); last = si; }
      if (Array.isArray(what)) { const r = await T.toProp(what); console.log(name, JSON.stringify(r)); await T.run(0.6, 8); }
      else if (what === null) { await T.move(5, 3); await T.run(0.6, 8); }
      else if (what === 'glide') { await T.run(4.2, 10); await T.M(() => { const D = window.__pp.arc.game._dbg; D.me.y = 5.5; }); await T.run(0.8, 10); }
      else if (what === 'echo') { await T.run(5.5, 10); }
      else if (what === 'mounds') { await T.run(5, 10); await T.M(() => { const D = window.__pp.arc.game._dbg, mo = D.RIFT && D.RIFT.self && D.RIFT.self.mod && D.RIFT.self.mod.mounds; if (!mo) return; const me = D.me; const L = mo.slice().sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y)); [['up', 'grub'], ['up', 'manta'], ['tremble', 'grub'], ['tremble', 'manta']].forEach(([st, k], i) => { const m = L[i]; if (m) { m.state = st; m.kind = k; m.t = st === 'up' ? 0.35 : 0.1; m.up = 3; } }); }); await T.run(0.2, 10); }
      await T.shot('v433-DE', `${tag}-${name}`);
    } catch (e) { console.log(name, 'ERR', String(e).slice(0, 200)); }
    console.log(name, ((Date.now() - t0) / 1000).toFixed(1) + 's');
  }
  console.log('errors', JSON.stringify(T.errors.slice(0, 6)));
  await T.browser.close();
})();
