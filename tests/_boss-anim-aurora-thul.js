// The Pale Aurora's bosses, animated: each fight run through its wake, a full act cycle, a hit, its stun mechanic,
// phase two (for Thul: the windbreak broken and the HATCH, then the wasp's own acts and its stun) and its minions, and
// the kill (a section boss's kill ends its stage; only the last seals the rift), with no page errors;
// screenshots (SHOTS=1) into shots/anim-aurora-<boss>*.png.
// usage: node tests/_boss-anim-aurora.js [thul ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
// the acts: the cocoon's, then the wasp's after the hatch
const WANT = { thul: ['collar', 'hail', 'stomp', 'ram', 'hatch', 'lunge', 'sweep', 'gale', 'dive'] };
const WANT_A = { thul: ['collar', 'hail', 'stomp'] }, WANT_B = { thul: ['lunge', 'sweep', 'gale', 'dive'] };
const NAMES = { thul: 'Thul' };
const MINIONS = { thul: ['rimescuttler', 'veilray'] };
const WEAK = { thul: 'eye' }, WEAK_B = { thul: 'sting' };
const IDLE = { thul: 'shuffle' }, IDLE_B = { thul: 'hover' };
const LAST = null;   // (the boss whose kill seals the rift; none of these yet)
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(WANT);
  const T = await open({ lvl: 52, seals: ['belfry', 'garden', 'dunes', 'sepulchre'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-aurora-${name}.png`) }); };
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.aurora ? R.aurora.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx >= 0, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('aurora', idx);
    // the fiend: its definition, name and bars
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`);
    // the wake and the intro
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 5; });
    await run(1.2); await shot(id + '-intro');
    await run(4.8);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // the arena: two windbreak pillars, solid
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, G = D.FD.FX.H.M; return { wb: M.wb.map(w => w.kind), solid: M.wb.map(w => G.G[Math.floor(w.y) * G.MW + Math.floor(w.x)] === 0), props: D.FD.S.props.length }; });
    console.log('  arena', JSON.stringify(r)); ok(r.wb.length === 2 && r.wb.every(k => k === 'pillar') && r.solid.every(Boolean), `${id}: two solid windbreak pillars`);
    // the cocoon's act cycle: the pet kept close
    const cycle = (want, secs) => page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(), ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.stunT > 0) b.stunT = 0; if (Math.hypot(D.me.x - b.x, D.me.y - b.y) > 5.5) { const p = { x: b.x + 3.0, y: b.y + 2.6 }; const dx = p.x - D.FD.FX.C.x, dy = p.y - D.FD.FX.C.y, d = Math.hypot(dx, dy); if (d > D.FD.FX.C.R - 2) { p.x = D.FD.FX.C.x + dx / d * (D.FD.FX.C.R - 2); p.y = D.FD.FX.C.y + dy / d * (D.FD.FX.C.R - 2); } D.me.x = p.x; D.me.y = p.y; } seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [want, secs]);
    let acts = await cycle(WANT_A[id], 75);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT_A[id].every(w => acts.acts.includes(w)), `${id}: the cocoon's act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    // two shots 0.4 s apart while it idles (the pose should change between them)
    const idleShots = async (idle, tag) => { await page.evaluate(async idle => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 6; const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(b.act === idle && b.actT > 0.8 && performance.now() - t0 > 2500)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) b.actT = Math.min(b.actT, 1.0); } }, idle);
      const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 3.6; D.me.vx = D.me.vy = 0; });
      await near(); await run(0.05); await shot(id + tag); await run(0.35); await near(); await run(0.05); await shot(id + tag + '-b'); };
    await idleShots(IDLE[id], '');
    // the wind-ups: the collar building (scraped on the floor), and the hail's patches with the lees drawn
    const force = (act, idle, waitAct, extraMs) => page.evaluate(async ([act, idle, waitAct, extraMs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; M.nextAct = act; b.act = idle; b.actT = 9; const t0 = performance.now(); while (performance.now() - t0 < 8000 && b.act !== waitAct) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) { M.nextAct = act; b.actT = 9; } } const t1 = performance.now(); while (performance.now() - t1 < extraMs) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return b.act; }, [act, idle, waitAct, extraMs]);
    let w = await force('collar', IDLE[id], 'collar', 1900); console.log('  wind-up', w); await shot(id + '-collar');
    await run(1.0); await shot(id + '-collar-ring');
    await run(1.5);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, w = M.wb[0]; D.me.x = w.x + 1.5; D.me.y = w.y + 2.5; });
    w = await force('hail', IDLE[id], 'hail', 1300); console.log('  wind-up', w); await shot(id + '-hail');
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { hail: !!M.hail, lee: M.leeK, patches: M.hail ? M.hail.patches.length : 0 }; });
    console.log('  hail', JSON.stringify(r)); ok(r.hail && r.patches >= 2 && r.lee > 0.5, `${id}: Cocoon Hail marks its patches and the lees are drawn`);
    await run(0.5); await shot(id + '-hail-fall'); await run(1.2);
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x; D.me.y = b.y + 3.6; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.15); await shot(id + '-hit'); await run(1.2);
    // the stun: the frost collar shattered before it bursts; the cocoon topples, its eye bare
    const stun = await page.evaluate(async ([weak, idle]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; let out = {};
      const wait = ms => new Promise(r => setTimeout(r, ms)), weakOn = () => !!(D.FD.S.weak[weak] && !D.FD.S.weak[weak].dead);
      M.nextAct = 'collar'; b.act = idle; b.actT = 9; let t0 = performance.now(), col = null; while (performance.now() - t0 < 14000 && !col) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) { M.nextAct = 'collar'; b.actT = Math.max(b.actT, 9); } col = D.mons.find(m => m.fobj && m.kind === 'collar' && !m.dead); }
      out.collar = !!col; if (col) { await wait(700); D.hitMon(col, 1e12, { flat: true }); } await wait(900); out = Object.assign(out, { stun: b.stunT, kind: M.stunKind, topple: M.topple, weak: weakOn() }); return out; }, [WEAK[id], IDLE[id]]);
    console.log('  stun', JSON.stringify(stun)); ok(stun.collar && stun.stun > 0 && stun.weak, `${id}: the collar shattered: it topples, its ${WEAK[id]} bare`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x - 1; D.me.y = b.y + 3.8; }); await run(0.3); await shot(id + '-stun'); await run(1.5);
    // the phase change: the windbreak marked and broken, then the HATCH
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; b.stunT = 0; b.hp = b.maxhp * 0.45; const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { phase: D.FD.S.phase, act: b.act, marked: M.wb.filter(w => w.mark).length }; });
    console.log('  phase', JSON.stringify(p2)); ok(p2.phase === 2 && p2.act === 'ram' && p2.marked === 1, `${id}: phase two: one windbreak marked for breaking`);
    // the pet runs to the other pillar's lee
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, s = M.ram && M.ram.safe; if (s) { D.me.x = s.x; D.me.y = s.y + 2.6; } });
    await run(1.6); await shot(id + '-ram');
    const hatch = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, ban = new Set(); let walls = 0, crackShot = false, hp0 = D.me.hp, hurt = 0; const t0 = performance.now(); while (performance.now() - t0 < 16000 && !(M.hatched && b.act === 'hover')) { await new Promise(r => requestAnimationFrame(r)); const s = M.ram && M.ram.safe; if (s) { D.me.x = s.x; D.me.y = s.y + 2.6; } if (D.me.hp < hp0) hurt++; D.me.hp = D.ST.hp; hp0 = D.me.hp; D.banners.forEach(x => ban.add(x.s)); walls = Math.max(walls, M.wb.filter(w => w.kind === 'wall').length); if (b.act === 'hatch' && M.hatch && M.hatch.age > 1.8 && !window.__thulCrack) { window.__thulCrack = 1; break; } } return { banners: [...ban], walls, act: b.act, hurt }; });
    console.log('  break', JSON.stringify(hatch)); ok(hatch.walls === 1, `${id}: the marked pillar broke into a low windbreak`); ok(hatch.hurt === 0, `${id}: the other pillar's lee kept the pet from the great hail`);
    await shot(id + '-cracking');
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 4000 && !M.hatched) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } }); await run(0.12); await shot(id + '-burst');
    await run(0.6); await shot(id + '-emerge');
    const hatched = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 8000 && !(M.hatched && b.act === 'hover')) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } const G = D.FD.FX.H.M; return { hatched: M.hatched, act: b.act, husk: D.FD.S.props.some(p => p.kind === 'husk'), shards: M.shards.length, banners: [...ban], tiles: M.wb.map(w => [w.kind, G.G[Math.floor(w.y) * G.MW + Math.floor(w.x)] === 0]) }; });
    console.log('  hatch', JSON.stringify(hatched)); ok(hatched.hatched && hatched.act === 'hover' && hatched.husk && hatched.shards > 4, `${id}: THE HATCH: the shell flies apart, the husk left, the wasp hovering`);
    ok(hatched.tiles.every(t => t[1]), `${id}: the windbreaks (a pillar and the rubble wall) are solid`);
    await idleShots(IDLE_B[id], '-wasp');
    // the wasp's act cycle
    acts = await cycle(WANT_B[id], 90);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT_B[id].every(w => acts.acts.includes(w)), `${id}: the wasp's act cycle (${acts.acts.join(', ')})`);
    // its wind-ups: the stinger poised over its lane, the gale with its lees, the sweep, the dive
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x; D.me.y = C.y + 4; });
    w = await force('lunge', IDLE_B[id], 'lunge', 900); console.log('  wind-up', w); await shot(id + '-lunge');
    await run(1.8);
    w = await force('gale', IDLE_B[id], 'gale', 2100); console.log('  wind-up', w); await shot(id + '-gale'); await run(1.6);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 2; D.me.y = b.y + 2.5; });
    w = await force('sweep', IDLE_B[id], 'sweep', 650); console.log('  wind-up', w); await shot(id + '-sweep'); await run(0.45); await shot(id + '-sweep-b'); await run(1);
    w = await force('dive', IDLE_B[id], 'dive', 1900); console.log('  wind-up', w); await shot(id + '-dive'); await run(1.5);
    // the wasp's stun: a lunge dodged; the stinger sticks in the ice, the sting-root bare
    const stun2 = await page.evaluate(async ([weak, idle]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C; D.me.x = C.x; D.me.y = C.y + 3; M.nextAct = 'lunge'; b.act = idle; b.actT = 9; let t0 = performance.now(), moved = false;
      while (performance.now() - t0 < 14000 && !(b.stunT > 0.5)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle && !(b.stunT > 0)) { M.nextAct = 'lunge'; b.actT = Math.max(b.actT, 9); }
        const L = M.lg; if (L && L.a != null && !L.go && !moved && L.tele && L.tele.age > L.tele.t * 0.5) { moved = true; const nx = -Math.sin(L.a), ny = Math.cos(L.a); D.me.x += nx * 3; D.me.y += ny * 3; } }
      await new Promise(r => setTimeout(r, 400)); return { stun: b.stunT, kind: M.stunKind, weak: !!(D.FD.S.weak[weak] && !D.FD.S.weak[weak].dead), moved }; }, [WEAK_B[id], IDLE_B[id]]);
    console.log('  stun2', JSON.stringify(stun2)); ok(stun2.stun > 0 && stun2.kind === 'stuck' && stun2.weak, `${id}: a dodged lunge: the stinger stuck in the ice, the ${WEAK_B[id]} bare`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; if (M.stuckAt) { D.me.x = M.stuckAt[0] - 1.5; D.me.y = M.stuckAt[1] + 3; } }); await run(0.3); await shot(id + '-stuck'); await run(1.0); await shot(id + '-stuck-b');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; });
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 20000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size >= types.length) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length > 0, `${id}: minions (${mins.join(', ')})`);
    await run(2);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill (for a section boss, it ends the stage without sealing the rift)
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.aurora }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); if (id !== LAST) ok(!kill.sealed, `${id}: no sealing (a section boss)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
