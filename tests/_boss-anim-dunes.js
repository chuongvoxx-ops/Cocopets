// The Mouth Beneath the Dunes' bosses, animated: each fight run through its wake, a full act cycle, a hit, its stun
// mechanic, phase two and its minions, and the kill (the third boss's kill seals the rift), with no page errors;
// screenshots (SHOTS=1) into shots/anim-dunes-<boss>*.png.
// usage: node tests/_boss-anim-dunes.js [sarrukh|oneira|thulammon ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { sarrukh: ['wake', 'breach', 'spit'], oneira: ['echo', 'beam', 'chorus', 'slam'], thulammon: ['sweep', 'slam', 'ink', 'grasp', 'sandfall'] };
const NAMES = { sarrukh: 'Sarrukh', oneira: 'Oneira', thulammon: 'Thul-Ammon' };
const MINIONS = { sarrukh: ['skitter'], oneira: ['grub', 'manta'], thulammon: ['grub'] };
const WEAK = { sarrukh: 'throat', oneira: 'mantle', thulammon: 'eye' };
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['sarrukh', 'oneira', 'thulammon'];
  const T = await open({ lvl: 32, seals: ['belfry', 'garden'] }); const { page, errors, start, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-dunes-${name}.png`) }); };
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.dunes ? R.dunes.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx >= 0, `${id}: stage ${idx}`); if (idx < 0) continue;
    await start('dunes', idx);
    // the fiend: its definition, name and bars
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id] }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    // the wake and the intro (the boss sits at the centre; the pet walks to it)
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 4; });
    await run(1.5); await shot(id + '-intro');
    await run(4.5);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // an act cycle: the pet kept close
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(), ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (Math.hypot(D.me.x - b.x, D.me.y - b.y) > 5.5) { const p = { x: b.x + 3.5, y: b.y + 2.5 }; const dx = p.x - D.FD.FX.C.x, dy = p.y - D.FD.FX.C.y, d = Math.hypot(dx, dy); if (d > D.FD.FX.C.R - 2) { p.x = D.FD.FX.C.x + dx / d * (D.FD.FX.C.R - 2); p.y = D.FD.FX.C.y + dy / d * (D.FD.FX.C.R - 2); } D.me.x = p.x; D.me.y = p.y; } seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 75]);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    // two shots 0.4 s apart while it idles (the pose should change between them)
    const IDLE = { sarrukh: 'hunt', oneira: 'circle', thulammon: 'idle' }[id];
    await page.evaluate(async idle => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 6; const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(b.act === idle && b.actT > 0.8 && performance.now() - t0 > 2500)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) b.actT = Math.min(b.actT, 1.0); } }, IDLE);
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 3.2; D.me.vx = D.me.vy = 0; });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    // a wind-up: the first telegraphed act, caught in its wait
    const wind = await page.evaluate(async idle => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.act = idle; b.actT = 9; const t0 = performance.now(); while (performance.now() - t0 < 6000 && (b.act === idle || b.actT > 0.6)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) b.actT = 9; } await new Promise(r => setTimeout(r, 350)); return b.act; }, IDLE);
    console.log('  wind-up', wind); await shot(id + '-windup');
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.15); await shot(id + '-hit'); await run(1.2);
    // the stun: a Resonator Spire broken while the worm is under; four Echo Stones cracked; three Anchors broken
    const stun = await page.evaluate(async ([id, weak, idle]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; let out = {};
      const wait = ms => new Promise(r => setTimeout(r, ms)), weakOn = () => !!(D.FD.S.weak[weak] && !D.FD.S.weak[weak].dead);
      if (id === 'sarrukh') { let t0 = performance.now(); while (performance.now() - t0 < 10000 && !(M.mode === 'under' && b.act === idle)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const o = D.mons.find(m => m.fobj && m.kind === 'spire' && !m.dead); if (o) D.hitMon(o, 1e12, { flat: true }); await wait(900); out = { mode: M.mode, stun: b.stunT, lie: M.lie, weak: weakOn() }; }
      else if (id === 'oneira') { for (const o of D.mons.filter(m => m.fobj && m.kind === 'stone' && !m.dead)) { o.invuln = false; o.lit = 5; D.hitMon(o, 1e12, { flat: true }); } await wait(1200); out = { stun: b.stunT, slump: M.slump, cracked: M.cracked, weak: weakOn() }; }
      else { let t0 = performance.now(); while (performance.now() - t0 < 10000 && D.mons.filter(m => m.fobj && m.kind === 'anchor' && !m.dead).length < 3) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } for (const o of D.mons.filter(m => m.fobj && m.kind === 'anchor' && !m.dead).slice(0, 3)) { o.invuln = false; D.hitMon(o, 1e12, { flat: true }); } await wait(1200); out = { stun: b.stunT, sink: M.sink, broken: M.broken, weak: weakOn() }; }
      return out; }, [id, WEAK[id], IDLE]);
    console.log('  stun', JSON.stringify(stun)); ok(stun.stun > 0 && stun.weak, `${id}: the stun and its weak point (${WEAK[id]})`);
    await shot(id + '-stun'); await run(1.5);
    // the phase change, and its minions
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase }; });
    ok(p2.phase === 2, `${id}: phase two`); await run(0.3); await shot(id + '-phase');
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 16000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: phase-two minions (${mins.join(', ')})`);
    await run(2);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill (and, for the last boss, the sealing)
    const kill = await page.evaluate(async id => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.dunes }; }, id);
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`);
    if (id === 'thulammon') ok(kill.banners.includes('THE JAW CLOSES') && kill.banners.includes('THE ECHO SIGIL') && kill.sealed, `${id}: the sealing (THE JAW CLOSES … THE ECHO SIGIL)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
