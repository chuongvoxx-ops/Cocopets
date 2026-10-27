// The Sepulchre of Borrowed Hours' bosses, animated: each fight run through its wake, a full act cycle, a hit, its stun
// mechanic, phase two (and its additions) and its minions, and the kill (a section boss's kill ends its stage; only the
// last seals the rift), with no page errors; screenshots (SHOTS=1) into shots/anim-sepulchre-<boss>*.png.
// usage: node tests/_boss-anim-sepulchre.js [vaul ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { vaul: ['record', 'mirror', 'rush', 'volley', 'lash'] };
const NAMES = { vaul: 'Vaul' };
const MINIONS = { vaul: ['mourndisc', 'seceater'] };
const WEAK = { vaul: 'eye' };
const IDLE = { vaul: 'stalk' };
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['vaul'];
  const T = await open({ lvl: 42, seals: ['belfry', 'garden', 'dunes'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-sepulchre-${name}.png`) }); };
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.sepulchre ? R.sepulchre.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx >= 0, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('sepulchre', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 4; });
    await run(1.2); await shot(id + '-intro');
    await run(4.8);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // an act cycle: the pet kept close-ish, wandering (so the mirror has a route to walk); recorded blasts checked for their three numbered marks
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C, seen = new Set(), ban = new Set(), labels = new Set(); let ghosts = 0; const t0 = performance.now(); let a = 0;
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; a += 0.01; D.me.x = C.x + Math.cos(a) * 7; D.me.y = C.y + Math.sin(a) * 7;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); D.FD.S.tele.forEach(s => s.label && labels.add(s.label)); if (b.act === 'record') ghosts = Math.max(ghosts, D.zones.filter(z => z.kind === 'ghost').length); if (want.every(w => seen.has(w)) && labels.size >= 3) break; }
      return { acts: [...seen], banners: [...ban], labels: [...labels], ghosts }; }, [WANT[id], 90]);
    console.log('  acts', JSON.stringify(acts)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    ok(['1', '2', '3'].every(l => acts.labels.includes(l)) && acts.ghosts >= 1, `${id}: recorded blasts: three numbered marks and ghosts of the pet (${acts.labels}, ghosts ${acts.ghosts})`);
    // let any mirror lapse, then two shots 0.4 s apart while it paces (the pose should change between them)
    await page.evaluate(async idle => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; if (M.copy) { M.copy.age = 99; } D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 6; const t0 = performance.now(); while (performance.now() - t0 < 9000 && !(b.act === idle && b.actT > 0.8 && performance.now() - t0 > 2500)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; M.mirrorCd = 99; if (b.act === idle) b.actT = Math.min(b.actT, 1.0); } }, IDLE[id]);
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 3.2; D.me.vx = D.me.vy = 0; });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    // a wind-up: the first telegraphed act, caught in its wait
    const wind = await page.evaluate(async idle => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.act = idle; b.actT = 9; const t0 = performance.now(); while (performance.now() - t0 < 6000 && (b.act === idle || b.actT > 0.7)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) b.actT = 9; } await new Promise(r => setTimeout(r, 350)); return b.act; }, IDLE[id]);
    console.log('  wind-up', wind); await shot(id + '-windup');
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.15); await shot(id + '-hit'); await run(1.5);
    // the stun: Mirror Pursuit, the mirror led over a snare plate, then the weave at the Memory Loom
    const mir = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, b = D.g.boss, FX = D.FD.FX, M = FX.mem, C = FX.C, Def = P.FIEND_DEFS.vaul; const wait = ms => new Promise(r => setTimeout(r, ms)), frames = async n => { for (let i = 0; i < n; i++) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } };
      let t0 = performance.now(); while (performance.now() - t0 < 8000 && b.act !== 'stalk') await frames(1);
      M.copy = null; M.mirrorCd = 0; b.actT = 9; D.me.x = C.x + 4; D.me.y = C.y + 4;
      t0 = performance.now(); while (performance.now() - t0 < 8000 && !M.copy) { await frames(1); D.me.x = C.x + 4 + Math.sin(performance.now() / 300) * 2; }
      const out = { copy: !!M.copy, shielded: Def.dmgK(FX), zone: !!(M.copy && D.zones.includes(M.copy.zone)) };
      // the mirror walks the pet's route: the pet strides away, the mirror follows
      const k = M.copy; if (!k) return out; const x0 = k.x, y0 = k.y; for (let i = 0; i < 60; i++) { D.me.x = C.x + 4 - i * 0.05; D.me.y = C.y + 2; await frames(1); } out.walked = Math.hypot(k.x - x0, k.y - y0);
      // a plate under its road: the pet's route crosses the plate, the mirror walks onto it
      const pl = [C.x + Math.cos(Math.PI / 2 - 1.2) * 7.4, C.y + Math.sin(Math.PI / 2 - 1.2) * 7.4]; k.q = [{ x: pl[0], y: pl[1] }]; k.x = pl[0] - 1.6; k.y = pl[1]; D.me.x = C.x - 6; D.me.y = C.y - 6;
      t0 = performance.now(); while (performance.now() - t0 < 4000 && !(k.snare > 0)) await frames(1); out.snared = k.snare > 0; out.stillShielded = Def.dmgK(FX);
      return out; });
    console.log('  mirror', JSON.stringify(mir)); ok(mir.copy && mir.zone && mir.shielded < 0.5, `${id}: Mirror Pursuit raises a mirror and shields it (×${mir.shielded})`); ok(mir.walked > 0.5, `${id}: the mirror walks the recorded route (${(mir.walked || 0).toFixed(2)})`); ok(mir.snared && mir.stillShielded < 0.5, `${id}: a snare plate catches it`);
    await run(0.2); await shot(id + '-snared');
    const stun = await page.evaluate(async weak => { const P = window.__pp, D = P.arc.game._dbg, b = D.g.boss, FX = D.FD.FX, M = FX.mem, C = FX.C, Def = P.FIEND_DEFS.vaul; const L = [C.x, C.y + C.R - 1.8];
      D.me.x = L[0]; D.me.y = L[1] - 0.6; D.me.vx = D.me.vy = 0; let mid = null; const t0 = performance.now(); while (performance.now() - t0 < 2500 && !(b.stunT > 0)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = L[0]; D.me.y = L[1] - 0.6; if (M.chan > 0.2 && mid == null) mid = M.chan; }
      await new Promise(r => setTimeout(r, 700)); const w = D.FD.S.weak[weak]; return { chan: mid, stun: b.stunT, held: !!(M.copy && M.copy.held), k: Def.dmgK(FX), weak: !!(w && !w.dead), slump: M.slump }; }, WEAK[id]);
    console.log('  stun', JSON.stringify(stun)); ok(stun.chan > 0 && stun.held && stun.stun > 0 && stun.weak && stun.k === 1, `${id}: the weave at the Loom holds the mirror: shield down, stunned, the ${WEAK[id]} bared`);
    await shot(id + '-stun');
    // a hit on the bared eye lands in full
    const wh = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, w = D.FD.S.weak.eye; const h0 = b.hp; if (w) D.hitMon(w, 1000, { flat: true }); return h0 - b.hp; }); ok(wh > 500, `${id}: a blow to the eye passes through (${Math.round(wh)})`);
    await run(6.5);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { stun: D.g.boss.stunT, copy: !!M.copy }; }); ok(!(r.stun > 0) && !r.copy, `${id}: it rises and the mirror shatters`);
    // the phase change, its sweep between the replays, and its minions
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`); await run(0.3); await shot(id + '-phase');
    const sw = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; let t0 = performance.now(); while (performance.now() - t0 < 6000 && b.act !== 'stalk') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      b.act = 'record'; b.actT = 0; M.rec = { k: 0, sweep: false, sa: null }; const res = {}; let a = 0, shotAt = null; t0 = performance.now();
      while (performance.now() - t0 < 10000 && b.act === 'record') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; a += 0.012; D.me.x = C.x + Math.cos(a) * 10; D.me.y = C.y + Math.sin(a) * 10; for (const s of D.FD.S.tele) { const k = s.label || (s.shape === 'cone' ? 'cone' : null); if (k && !res[k]) res[k] = b.actT + (s.t - s.age); } if (res.cone && shotAt == null) shotAt = b.actT; if (shotAt != null && b.actT > shotAt + 0.6 && !res.shot) { res.shot = true; window.__shotNow = true; break; } }
      return res; });
    await shot(id + '-sweep');
    console.log('  sweep', JSON.stringify(sw)); ok(sw.cone > sw['1'] && sw.cone < sw['2'], `${id}: phase two: the sweep resolves between the first and second bursts`);
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 20000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: phase-two minions (${mins.join(', ')})`);
    await run(2); await shot(id + '-late');
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill: a section boss ends its stage, and does not seal the rift
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.sepulchre }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); ok(!kill.sealed, `${id}: a section boss does not seal the rift`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
