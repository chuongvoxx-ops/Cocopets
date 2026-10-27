// the Drowned Belfry's bosses, animated: each fight run ~30 s through its wake, an act cycle, a hit, a stun and a phase
// change, with no page errors; screenshots (SHOTS=1) into shots/anim-<boss>.png and -b.png ~0.4 s later.
// usage: node tests/_boss-anim.js [thalassor|veilwrack|ulvora ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { thalassor: ['sweep', 'toll', 'charge'], veilwrack: ['breath', 'coil', 'swoop'], ulvora: ['undertow', 'choir', 'hymn'] };
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['thalassor', 'veilwrack', 'ulvora'];
  const T = await open({ lvl: 12 }); const { page, errors, start, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-${name}.png`) }); };
  for (const id of bosses) {
    const e0 = errors.length;
    // the stage index, found in the page (stage indices move about)
    let idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.belfry ? R.belfry.stages.findIndex(s => s.boss === id) : -1; }, id);
    if (idx < 0) { for (let i = 0; i < 18 && idx < 0; i++) { await start('belfry', i); const b = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.FD ? D.FD.FX.FD.id : null; }); if (b === id) idx = i; } }
    ok(idx >= 0, `${id}: stage ${idx}`); if (idx < 0) continue;
    await start('belfry', idx);
    // the wake and the intro (the boss sits at the centre; the pet walks to it)
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 4; });
    await run(1.5); await shot(id + '-intro');
    await run(4.5);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, name: D.F.fiend.name, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // an act cycle: the pet kept close, the signature held off
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; D.FD.FX.mem.sigT = 30; if (Math.hypot(D.me.x - b.x, D.me.y - b.y) > 5.5) { D.me.x = b.x + 3.5; D.me.y = b.y + 2.5; } seen.add(b.act); if (want.every(w => seen.has(w))) break; } return [...seen]; }, [WANT[id], 40]);
    console.log('  acts', JSON.stringify(acts)); ok(WANT[id].every(w => acts.includes(w)), `${id}: a full act cycle (${acts.join(', ')})`);
    // two shots 0.4 s apart while it circles (the pose should change between them)
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 6; const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(b.act === 'circle' && b.actT > 1.0 && performance.now() - t0 > 2500)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.FD.FX.mem.sigT = 30; if (b.act === 'circle') b.actT = Math.min(b.actT, 1.2); } });
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 3.2; D.me.vx = D.me.vy = 0; });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true }); }); await run(0.15); await shot(id + '-hit'); await run(0.6);
    // a stun where the fight has one (a chain rung, a wheel struck), else the open state (Ulvora's dome lifting)
    const stun = await page.evaluate(async id => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; let out = {};
      if (id === 'thalassor') { M.sigT = -1; b.act = 'circle'; b.actT = 9; let t0 = performance.now(); while (performance.now() - t0 < 5000 && b.act !== 'hide') { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } await new Promise(r => setTimeout(r, 900)); const ch = D.mons.find(m => m.fobj && m.kind === 'chain' && !m.dead); D.hitMon(ch, 1e12, { flat: true }); await new Promise(r => setTimeout(r, 500)); out = { stun: b.stunT, flip: M.flip }; }
      else if (id === 'veilwrack') { const w = D.mons.find(m => m.fobj && m.kind === 'wheel' && !m.dead); D.hitMon(w, 1e12, { flat: true }); await new Promise(r => setTimeout(r, 1200)); out = { stun: b.stunT, reel: M.reel }; }
      else { M.sigT = -1; b.act = 'circle'; b.actT = 9; let t0 = performance.now(); while (performance.now() - t0 < 6000 && M.lit < 0) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const v = D.mons.find(m => m.fobj && m.kind === 'valve' && m.idx === M.lit); if (v) D.hitMon(v, 100, { flat: true }); t0 = performance.now(); while (performance.now() - t0 < 15000 && !(M.openT > 0)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } await new Promise(r => setTimeout(r, 600)); out = { open: M.open, openT: M.openT }; }
      return out; }, id);
    console.log('  stun', JSON.stringify(stun)); ok(stun.stun > 0 || stun.open > 0, `${id}: the stun / open state`);
    await shot(id + '-stun'); await run(1.5);
    // the phase change
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`); await run(0.3); await shot(id + '-phase'); await run(3);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.hitMon(D.g.boss, 1e12, { pierce: true }); }); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
