// Rift 6's war machines, mecha mini bosses, engine eggs and the biomechanical Engine Heart
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, shot, start, run } = T;
  await start('yuggoth', 0); await run(1.5);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, mini = D.mons.find(m => m.boss); return { mech: D.mons.filter(m => m.type === 'warmech').length, hound: D.mons.filter(m => m.type === 'mechhound').length, mini: mini && mini.bname, mecha: !!(mini && mini.evil && mini.evil.mecha) }; });
  console.log('  ', JSON.stringify(r)); ok(r.mech >= 3 && r.hound >= 3, 'war mechs and mech hounds stalk the Torn Hull'); ok(r.mecha, 'the Rift-touched mini boss is a giant mecha: ' + r.mini);
  // the mini boss up close
  await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss); for (const m of D.mons) if (!m.boss && !m.dead && Math.hypot(m.x - b.x, m.y - b.y) < 10) m.freeze = 99; const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(b.evil && b.evil.ready)) await new Promise(r => requestAnimationFrame(r)); D.me.x = b.x; D.me.y = b.y + 4.5; b.aggro = true; });
  await run(2.5); await shot('yug-mecha-mini');
  // a war mech: watch it fire
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, w = D.mons.find(m => m.type === 'warmech' && !m.dead), seen = new Set(); w.freeze = 0; w.aggro = true; for (const m of D.mons) if (m !== w && !m.dead && Math.hypot(m.x - w.x, m.y - w.y) < 9) m.freeze = 99; const t0 = performance.now(); while (performance.now() - t0 < 12000 && seen.size < 2) { D.me.x = w.x + 5; D.me.y = w.y + 0.5; D.me.hp = D.ST.hp; await new Promise(r => requestAnimationFrame(r)); if (w.aimT > 0) seen.add('cannon'); if (w.mode === 'fire' && !(w.aimT > 0)) seen.add('fire'); } return [...seen]; });
  ok(r.length >= 1, 'a war mech fires its cannon or a missile salvo: ' + r.join()); await shot('yug-warmech');
  // the Engine Heart: eggs hatch into egglings
  await start('yuggoth', 7); await run(1.5);
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, eggs = D.mons.filter(m => m.type === 'mechegg'), e = eggs[0]; for (const m of D.mons) if (m.type !== 'mechegg' && !m.dead && Math.hypot(m.x - e.x, m.y - e.y) < 10) m.freeze = 99; const n0 = D.mons.filter(m => m.type === 'eggling').length; D.me.x = e.x + 2.6; D.me.y = e.y + 0.5; await new Promise(r => setTimeout(r, 2000)); return { eggs: eggs.length, egglings: D.mons.filter(m => m.type === 'eggling' && !m.dead).length - n0, opened: !!e.opened }; });
  console.log('  ', JSON.stringify(r)); ok(r.eggs >= 8 && r.opened && r.egglings >= 4, 'engine eggs crack open as you come near: egglings pour out');
  await shot('yug-eggs');
  r = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, e = D.mons.find(m => m.type === 'mechegg' && !m.dead && !m.crackT); const n0 = D.mons.filter(m => m.type === 'eggling').length; D.hitMon(e, 1e9, { flat: true }); await new Promise(r => setTimeout(r, 300)); return D.mons.filter(m => m.type === 'eggling').length - n0; });
  ok(r === 2, 'an egg broken before it opens lets only two out ' + r);
  r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, P = D.RIFT ? null : null; const kinds = {}; for (const k of [...(D.M.props || new Map()).values()]) kinds[k] = (kinds[k] || 0) + 1; return kinds; });
  console.log('  props', JSON.stringify(r)); ok((r.biotube || 0) + (r.xenospire || 0) + (r.vertebra || 0) >= 10, 'great ribbed tubes, spires and vertebra columns all over the Engine Heart');
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg; for (const [k, kind] of D.M.props) if (kind === 'biotube') { D.me.x = (k % D.M.MW) + 0.5; D.me.y = Math.floor(k / D.M.MW) + 2.5; break; } for (const m of D.mons) m.freeze = 99; }); await run(1.5); await shot('yug-biotube');
  ok(errors.length === 0, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} failed` : 'all passed'); process.exit(fails ? 1 : 0);
})();
