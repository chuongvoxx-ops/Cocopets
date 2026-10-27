// The Yuggoth Engine's bosses, animated: each fight run through its wake, a full act cycle, a hit, its mechanics (for
// Kh'aal: the plate shield turning frontal blows; a charge cell broken beside it staggers it and bares its brain-lobe, a
// far one does not), phase two (the wings unfold; the wing dive; DEVOUR: a cell eaten overcharges it, a cell popped in
// its claws denies it and staggers it) and its minions, and the kill (a section boss's kill ends its stage; only the
// last seals the rift), with no page errors; screenshots (SHOTS=1) into shots/anim-yuggoth-<boss>*.png.
// usage: node tests/_boss-anim-yuggoth.js [khaal ...]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { khaal: ['plate', 'slam', 'sweep', 'spit', 'hop', 'devour'] };
const WANT_A = { khaal: ['plate', 'slam', 'sweep', 'spit'] }, WANT_B = { khaal: ['hop', 'devour', 'slam', 'spit'] };
const NAMES = { khaal: 'Kh\'aal' };
const MINIONS = { khaal: ['sparkmite', 'hullwing'] };
const WEAK = { khaal: 'brain' };
const IDLE = { khaal: 'stalk' };
const LAST = null;   // (the boss whose kill seals the rift; none of these yet)
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(WANT);
  const T = await open({ lvl: 62, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-yuggoth-${name}.png`) }); };
  // every empty socket given a fresh cell, risen
  const refill = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, b = D.g.boss; for (let k = 0; k < 3; k++) { M.slots.forEach(s => { if (!s.cell || s.cell.dead) { s.cell = null; s.t = 0; } }); const bx = b.x, by = b.y; b.x = D.FD.FX.C.x; b.y = D.FD.FX.C.y - 9; const px = D.me.x, py = D.me.y; D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 10; await new Promise(r => requestAnimationFrame(r)); await new Promise(r => requestAnimationFrame(r)); b.x = bx; b.y = by; D.me.x = px; D.me.y = py; M.slots.forEach(s => { if (s.cell) { s.rise = 1; s.cell.invuln = false; } }); } return M.slots.filter(s => s.cell && !s.cell.dead).length; });
  // force the next act: it is taken at the stalk's next choice
  const force = (act, idle, waitAct, extraMs) => page.evaluate(async ([act, idle, waitAct, extraMs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; M.nextAct = act; b.stunT = 0; b.act = idle; b.actT = 9; const t0 = performance.now(); while (performance.now() - t0 < 8000 && b.act !== waitAct) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; b.stunT = 0; if (b.act === idle) { M.nextAct = act; b.actT = 9; } } const t1 = performance.now(); while (performance.now() - t1 < extraMs) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return b.act; }, [act, idle, waitAct, extraMs]);
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.yuggoth ? R.yuggoth.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 2, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('yuggoth', idx);
    // the fiend: its definition, name and bars
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
    ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`);
    // the wake and the intro
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 6; });
    await run(0.9); await shot(id + '-intro'); await run(0.9); await shot(id + '-intro-land');
    await run(4.4);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`);
    // the arena: four charge cells in their sockets
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { slots: M.slots.length, cells: M.slots.filter(s => s.cell && !s.cell.dead && s.cell.fobj && s.cell.kind === 'cell').length }; });
    console.log('  arena', JSON.stringify(r)); ok(r.slots === 4 && r.cells === 4, `${id}: four charge cells stand on the deck`);
    // the act cycle: the pet kept close
    const cycle = (want, secs) => page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, seen = new Set(), ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; if (b.stunT > 0) b.stunT = 0; if (b.hp < b.maxhp * 0.55 && D.FD.S.phase < 2) b.hp = b.maxhp * 0.8; if (Math.hypot(D.me.x - b.x, D.me.y - b.y) > 5.5) { const p = { x: b.x + 3.0, y: b.y + 2.6 }; const dx = p.x - D.FD.FX.C.x, dy = p.y - D.FD.FX.C.y, d = Math.hypot(dx, dy); if (d > D.FD.FX.C.R - 2) { p.x = D.FD.FX.C.x + dx / d * (D.FD.FX.C.R - 2); p.y = D.FD.FX.C.y + dy / d * (D.FD.FX.C.R - 2); } D.me.x = p.x; D.me.y = p.y; } seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [want, secs]);
    let acts = await cycle(WANT_A[id], 75);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT_A[id].every(w => acts.acts.includes(w)), `${id}: the act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners`);
    // two shots 0.4 s apart while it stalks (the pose should change between them)
    const idleShots = async (idle, tag) => { await page.evaluate(async idle => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = D.FD.FX.C.x; D.me.y = D.FD.FX.C.y + 6; const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(b.act === idle && b.actT > 0.8 && performance.now() - t0 > 2500)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (b.act === idle) b.actT = Math.min(b.actT, 1.0); } }, idle);
      const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 4.6; D.me.vx = D.me.vy = 0; });
      await near(); await run(0.05); await shot(id + tag); await run(0.35); await near(); await run(0.05); await shot(id + tag + '-b'); };
    await idleShots(IDLE[id], '');
    // the wind-ups: the slam's circle with the hammer raised, the sweep's cone, the spit's lanes and their pools
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; if (M.shield) { M.shield.age = 99; } D.me.x = b.x + 0.5; D.me.y = b.y + 4.2; });
    let w = await force('slam', IDLE[id], 'slam', 700); console.log('  wind-up', w); await shot(id + '-slam'); await run(0.45); await shot(id + '-slam-hit'); await run(1.6);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1.5; D.me.y = b.y + 3.6; });
    w = await force('sweep', IDLE[id], 'sweep', 600); console.log('  wind-up', w); await shot(id + '-sweep'); await run(0.4); await shot(id + '-sweep-b'); await run(1);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 0.5; D.me.y = b.y + 6; });
    w = await force('spit', IDLE[id], 'spit', 750); console.log('  wind-up', w); await shot(id + '-spit'); await run(0.6); await shot(id + '-spit-pools');
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { pools: D.FD.S.hz.filter(z => z.shape === 'line' && z.dps > 0).length }; }); console.log('  slag', JSON.stringify(r)); ok(r.pools >= 3, `${id}: Slag Spit leaves burning lanes (${r.pools})`);
    await run(1.5);
    // a hit
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x; D.me.y = b.y + 4.4; D.hitMon(b, 1000, { flat: true, viaProxy: true }); }); await run(0.12); await shot(id + '-hit'); await run(1.0);
    // the plate shield: torn up; blows from the front glance off, from behind they land
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 0.5; D.me.y = b.y + 5; });
    w = await force('plate', IDLE[id], 'plate', 700); console.log('  wind-up', w); await shot(id + '-plate-tear');
    const sh = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now(); while (performance.now() - t0 < 6000 && !(M.shield && M.shieldK > 0.95)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; b.stunT = 0; }
      const a = M.hd, put = k => { D.me.x = b.x + Math.cos(a + k) * 4; D.me.y = b.y + Math.sin(a + k) * 4; };
      put(0.3); let h0 = b.hp; D.hitMon(b, 1000, { flat: true }); const front = h0 - b.hp; put(Math.PI); h0 = b.hp; D.hitMon(b, 1000, { flat: true }); const back = h0 - b.hp; put(0); return { shield: !!M.shield, front: Math.round(front), back: Math.round(back) }; });
    console.log('  shield', JSON.stringify(sh)); ok(sh.shield && sh.front > 0 && sh.front < sh.back * 0.3, `${id}: the plate shield turns frontal blows (${sh.front} from the front, ${sh.back} from behind)`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.act = 'stalk'; b.actT = -2; D.me.x = b.x + 1; D.me.y = b.y + 5.2; }); await run(0.5); await shot(id + '-shield');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; M.hd = -Math.PI / 2 + 0.3; M.hdTo = M.hd; b.actT = -2; D.me.x = b.x - 1; D.me.y = b.y + 4.8; }); await run(0.08); await shot(id + '-shield-back');
    // the charge cells: one broken far from it does nothing to it; one broken in its blast staggers it, plate dropped,
    // the brain-lobe bare
    let n = await refill(); ok(n === 4, `${id}: the sockets refill (${n} cells)`);
    const stag = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(), wait = ms => new Promise(r => setTimeout(r, ms));
      if (!M.shield) { M.shield = { age: 0, life: 30 }; M.shieldK = 1; } b.stunT = 0; b.act = 'stalk'; b.actT = -3;
      // far: the boss at the north rim, the south-west cell broken
      b.x = C.x; b.y = C.y - 8; D.me.x = C.x; D.me.y = C.y + 2; const far = M.slots[2].cell; D.hitMon(far, 1e12, { flat: true }); const farStun = b.stunT > 0; await wait(300);
      // near: beside the north-west cell
      const s0 = M.slots[0], cell = s0.cell; b.x = s0.x + 2.8; b.y = s0.y - 1.2; b.act = 'stalk'; b.actT = -3; D.me.x = s0.x + 2.5; D.me.y = s0.y + 5; const hpA = b.hp; D.hitMon(cell, 1e12, { flat: true });
      const t0 = performance.now(); while (performance.now() - t0 < 600) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      const wk = D.FD.S.weak[weak], out = { farStun, stun: b.stunT, kind: M.stunKind, shield: !!M.shield, weak: !!(wk && !wk.dead), jolt: Math.round(hpA - b.hp), banners: [...ban] };
      // the weak point: the brain-lobe takes over twice what the shell does
      if (wk && !wk.dead) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); const viaW = h0 - b.hp; h0 = b.hp; D.hitMon(b, 1000, { flat: true }); const body = h0 - b.hp; out.viaW = Math.round(viaW); out.body = Math.round(body); }
      return out; }, WEAK[id]);
    console.log('  stagger', JSON.stringify(stag)); ok(!stag.farStun, `${id}: a cell broken far from it does not stagger it`);
    ok(stag.stun > 3 && stag.kind === 'jolt' && !stag.shield && stag.weak, `${id}: a cell broken in its blast: STAGGERED, plate dropped, its ${WEAK[id]} bare`);
    ok(stag.banners.includes('STAGGERED!'), `${id}: the stagger is taught in a banner`);
    ok(stag.viaW >= stag.body * 2, `${id}: the brain-lobe takes ${stag.viaW} where the shell takes ${stag.body}`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x - 1; D.me.y = b.y + 4.6; }); await run(0.9); await shot(id + '-stagger'); await run(1.2); await shot(id + '-stagger-b');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; }); await run(1.2);
    // the phase change: the wings unfold
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, ban = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.45; const t0 = performance.now(); while (performance.now() - t0 < 5000 && !(D.FD.S.phase >= 2 && M.wingK > 0.95)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } const t1 = performance.now(); while (performance.now() - t1 < 1200) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } return { phase: D.FD.S.phase, wing: M.wingK, banners: [...ban] }; });
    console.log('  phase', JSON.stringify(p2)); ok(p2.phase === 2 && p2.wing > 0.9 && p2.banners.includes('THE WINGS UNFOLD'), `${id}: phase two: the wings unfold`);
    await idleShots(IDLE[id], '-winged');
    acts = await cycle(WANT_B[id], 90);
    console.log('  acts', JSON.stringify(acts.acts), 'banners', JSON.stringify(acts.banners)); ok(WANT_B[id].every(w => acts.acts.includes(w)), `${id}: phase two's act cycle (${acts.acts.join(', ')})`);
    // the wing dive: crouch, leap, the circle, the plunge
    // (the cells held fast for the pictures, so a stray blow doesn't stagger it mid-dive)
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C, M = D.FD.FX.mem, b = D.g.boss; M.overT = 0; D.g.taps = 0; b.x = C.x; b.y = C.y - 2; D.me.x = C.x; D.me.y = C.y + 4; M.slots.forEach(s => { if (s.cell) s.cell.invuln = true; }); });
    w = await force('hop', IDLE[id], 'hop', 200); console.log('  wind-up', w); await shot(id + '-hop-crouch');
    // (each picture taken at a state of the dive, not after a time: a picture takes time of its own)
    const hopAt = (cond) => page.evaluate(async cond => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, f = new Function('M', 'H', 'return ' + cond); const t0 = performance.now(); while (performance.now() - t0 < 5000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; if (f(M, M.hop)) return { alt: +(M.alt || 0).toFixed(1) }; } return null; }, cond);
    r = await hopAt('H && H.leapt && M.alt > 4'); console.log('  hop air', JSON.stringify(r)); ok(r && r.alt > 4, `${id}: the wing dive lifts it high`); await shot(id + '-hop-air');
    r = await hopAt('H && H.marked && !H.hit'); await shot(id + '-hop-mark');
    r = await hopAt('!H || H.hit'); await run(0.1); await shot(id + '-hop-land'); await run(1.2);
    await page.evaluate(() => { const M = window.__pp.arc.game._dbg.FD.FX.mem; M.slots.forEach(s => { if (s.cell) s.cell.invuln = false; }); });
    // DEVOUR: left alone, it eats the cell and overcharges
    n = await refill(); ok(n === 4, `${id}: the sockets refill (${n} cells)`);
    const dv = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); M.overT = 0; b.stunT = 0; b.x = C.x; b.y = C.y + 1.5; D.me.x = C.x; D.me.y = C.y + 9.5; M.nextAct = 'devour'; b.act = 'stalk'; b.actT = 9; let cell = null, shotAt = 0, ate = false;
      const t0 = performance.now(); while (performance.now() - t0 < 16000 && !(M.overT > 0)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x; D.me.y = C.y + 9.5; b.stunT = 0; if (b.act === 'stalk' && !M.dv) { M.nextAct = 'devour'; b.actT = 9; } if (M.dv) cell = M.dv.cell; D.banners.forEach(x => ban.add(x.s)); if (M.dv && M.dv.eating && M.dv.eat > 0.5 && !shotAt) { shotAt = 1; window.__khaalEat = 1; break; } }
      return { started: !!cell }; });
    await shot(id + '-devour');
    const ov = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); const cell = M.dv && M.dv.cell; const t0 = performance.now(); while (performance.now() - t0 < 8000 && !(M.overT > 0)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x; D.me.y = C.y + 9.5; b.stunT = 0; D.banners.forEach(x => ban.add(x.s)); } const t1 = performance.now(); while (performance.now() - t1 < 400) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      return { over: +M.overT.toFixed(1), eaten: !!(cell && cell.dead && cell.eaten), banners: [...ban], fast: +(D.FD.S.fast * (M.overT > 0 ? 1.4 : 1)).toFixed(2) }; });
    console.log('  devour', JSON.stringify(dv), JSON.stringify(ov)); ok(dv.started && ov.over > 5 && ov.eaten && ov.banners.includes('OVERCHARGED!'), `${id}: a cell devoured: OVERCHARGED (${ov.over} s, speed ×${ov.fast})`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1; D.me.y = b.y + 5; }); await run(0.4); await shot(id + '-overcharged');
    // DENIED: the cell popped in its claws staggers it and it gets nothing
    n = await refill(); ok(n === 4, `${id}: the sockets refill (${n} cells)`);
    const dn = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem, C = D.FD.FX.C, ban = new Set(); M.overT = 0; b.stunT = 0; b.x = C.x; b.y = C.y + 1.5; D.me.x = C.x; D.me.y = C.y + 9.5; M.nextAct = 'devour'; b.act = 'stalk'; b.actT = 9; let popped = false, eat = 0, info = null;
      const t0 = performance.now(); while (performance.now() - t0 < 16000 && !popped) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.x = C.x; D.me.y = C.y + 9.5; b.stunT = 0; if (b.act === 'stalk' && !M.dv) { M.nextAct = 'devour'; b.actT = 9; } if (M.dv && M.dv.eating && M.dv.eat > 0.3) { eat = M.dv.eat; popped = true; const o = M.dv.cell; info = { inv: o.invuln, hp: Math.round(o.hp), d: +Math.hypot(o.x - b.x, o.y - b.y).toFixed(2), alt: +(M.alt || 0).toFixed(2), roll: !!D.g.rollOnly }; D.hitMon(o, 1e12, { flat: true }); info.dead = o.dead; info.stun = b.stunT; } }
      const t1 = performance.now(); while (performance.now() - t1 < 500) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); }
      return { popped, eat: +eat.toFixed(2), stun: +b.stunT.toFixed(1), over: M.overT, act: b.act, banners: [...ban], info }; });
    console.log('  denied', JSON.stringify(dn)); ok(dn.popped && dn.stun > 3 && dn.over === 0 && dn.banners.includes('DENIED!'), `${id}: the cell popped in its claws: DENIED, staggered, no overcharge`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1; D.me.y = b.y + 4.8; }); await run(0.3); await shot(id + '-denied');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.g.boss.stunT = 0; });
    // minions
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 25000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; D.g.boss.stunT = 0; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size >= types.length) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length === MINIONS[id].length, `${id}: minions (${mins.join(', ')})`);
    await shot(id + '-brood');
    await run(2);
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill (for a section boss, it ends the stage without sealing the rift)
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.yuggoth }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); if (id !== LAST) ok(!kill.sealed, `${id}: no sealing (a section boss)`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
