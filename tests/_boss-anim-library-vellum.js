// The Library's second boss, Vellum the Inkbound, animated: the fight run through its wake, a full act cycle, a hit,
// its mechanics (inkblot pools at the pet's recent positions hurt and slow; false redaction bands are harmless and real
// ones strike; a page carried through a pool cleanses it; two cleansed beside it blind it: staggered, mantle open, heart
// bared; the half-health tether broken by striking the arm staggers it, an unbroken one loses the lectern; the ink flood
// spares the daises and spills its brood), phase two and the kill (a section boss's kill ends its stage and does not seal
// the rift), with no page errors; screenshots (SHOTS=1) into shots/anim-library-<boss>*.png.
// usage: node tests/_boss-anim-library-vellum.js [vellum]   env: HTML, SHOTS=1
const { open } = require('./_rift-lib');
const path = require('path');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const WANT = { vellum: ['inkblot', 'redact', 'swipe', 'jet'] };
const NAMES = { vellum: 'Vellum' };
const MINIONS = { vellum: ['inkstalker', 'marginworm'] };
const WEAK = { vellum: 'heart' };
const IDLE = { vellum: 'hover' };
(async () => {
  const bosses = process.argv.slice(2).length ? process.argv.slice(2) : ['vellum'];
  const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, errors, run } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-library-${name}.png`) }); };
  // force the next act: the hover's choice is taken from the bag at once
  const force = (act, idle) => page.evaluate(async ([act, idle]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; const t0 = performance.now();
    while (performance.now() - t0 < 15000 && !(b.act === idle && !(b.stunT > 0))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
    M.bag = [act]; b.actT = 99; const t1 = performance.now(); while (performance.now() - t1 < 3000 && b.act !== act) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return b.act; }, [act, idle]);
  // every blow the pet would take is logged (the test runs in god mode, so nothing actually lands)
  const logHurts = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, H = D.FD.FX.H; if (!H.__orig) { H.__orig = H.hurtPet; H.hurtPet = (d, s, o) => { (window.__hurts = window.__hurts || []).push({ d, t: performance.now(), dot: !!(o && o.dot) }); return H.__orig(d, s, o); }; } window.__hurts = []; });
  // wait out whatever it is doing, and clear the floor of pools, patches and its brood (not its body proxies)
  const calm = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss; const t0 = performance.now();
    while (performance.now() - t0 < 12000 && !(b.act === 'hover' && !(b.stunT > 0))) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
    M.pools.forEach(q => { q.gone = true; q.hz.life = q.hz.age; }); M.pools.length = 0; M.patches.length = 0; M.carry = null; M.glare = { n: 0, t: 0 }; M.lect.forEach(L => { if (L.st !== 'lost') { L.st = 'page'; L.back = 0; } });
    for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } await new Promise(r => setTimeout(r, 300)); });
  for (const id of bosses) {
    const e0 = errors.length;
    const idx = await page.evaluate(id => { const R = window.__pp.RIFT_BY_ID; return R && R.library ? R.library.stages.findIndex(s => s.boss === id) : -1; }, id);
    ok(idx === 5, `${id}: stage ${idx}`); if (idx < 0) continue;
    await T.start('library', idx);
    let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, def: !!window.__pp.FIEND_DEFS[D.F.fiend.id], seal: D.F.rift && D.F.rift.seal }; });
    console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.def && r.name === NAMES[id] && r.bars > 10 && r.phases === 2 && !r.seal, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases, no seal)`);
    await run(0.4); await shot(id + '-start');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 6; });
    await run(1.0); await shot(id + '-intro');
    await run(5.0);
    r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, fd: !!D.FD, dmg: b && Math.round(b.dmg) }; });
    console.log('  wake', JSON.stringify(r)); ok(r.fd && r.act && r.act !== 'enter', `${id}: awake and acting (${r.act}, blow ${r.dmg})`);
    // the lecterns are solid; outside the square is the void
    const solid = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; return { lect: [[-6.5, -6.5], [6.5, -6.5], [6.5, 6.5], [-6.5, 6.5]].map(([x, y]) => D.blocked(C.x + x, C.y + y, 0.3)), edge: D.blocked(C.x + 13.6, C.y, 0.2), floor: !D.blocked(C.x + 12.4, C.y + 3, 0.2) }; });
    ok(solid.lect.every(Boolean) && solid.edge && solid.floor, `${id}: the four lecterns are solid and the square's edge is the void (${JSON.stringify(solid)})`);
    // an act cycle, the pet kept wandering round the chamber
    const acts = await page.evaluate(async ([want, secs]) => { const D = window.__pp.arc.game._dbg, b = D.g.boss, C = D.FD.FX.C, seen = new Set(), ban = new Set(); const t0 = performance.now(); let a = 0;
      while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; a += 0.01; D.me.x = C.x + Math.cos(a) * 9.5; D.me.y = C.y + Math.sin(a) * 9.5;
        seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (want.every(w => seen.has(w))) break; }
      return { acts: [...seen], banners: [...ban] }; }, [WANT[id], 150]);
    console.log('  acts', JSON.stringify(acts)); ok(WANT[id].every(w => acts.acts.includes(w)), `${id}: a full act cycle (${acts.acts.join(', ')})`);
    ok(acts.banners.length >= 3, `${id}: the attacks are named in banners (${acts.banners.join(' | ')})`);
    await calm();
    // two shots 0.4 s apart while it hovers (the pose should change between them)
    const near = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.g.taps = 4; D.me.x = b.x; D.me.y = b.y + 3.8; D.me.vx = D.me.vy = 0; b.actT = Math.min(b.actT, 0.3); });
    await near(); await run(0.05); await shot(id); await run(0.35); await near(); await run(0.05); await shot(id + '-b');
    const pose = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { tips: M.tips.map(q => q.map(v => +v.toFixed(2))), alt: +M.alt.toFixed(2) }; }); await run(0.4);
    const pose2 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; return { tips: M.tips.map(q => q.map(v => +v.toFixed(2))), alt: +M.alt.toFixed(2) }; });
    ok(JSON.stringify(pose) !== JSON.stringify(pose2), `${id}: never still: its arms sway between frames`);
    // a hit: it recoils
    const rec = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss, M = D.FD.FX.mem; D.hitMon(b, 1000, { flat: true, viaProxy: true }); await new Promise(r => setTimeout(r, 60)); return M.recoil; }); await run(0.06); await shot(id + '-hit');
    ok(rec > 0.2, `${id}: a blow makes it recoil (${rec.toFixed(2)})`); await run(1.0);

    // INKBLOT: three pools at the pet's recent positions; they hurt and slow
    await calm();
    const trail = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, now = FX.S.t; const pts = [[C.x + 5.4, C.y + 7.6], [C.x + 1.2, C.y + 9.6], [C.x - 2.4, C.y + 9.6]]; M.trail = pts.map(([x, y], i) => ({ x, y, t: now - 2 + i * 0.5 })); D.me.x = C.x - 2.4; D.me.y = C.y + 9.6; return pts; });
    ok(await force('inkblot', IDLE[id]) === 'inkblot', `${id}: inkblot forced`); await logHurts();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x - 9; D.me.y = C.y - 1; });
    await run(0.75); await shot(id + '-inkblot');
    const ib = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C; const t0 = performance.now(); while (performance.now() - t0 < 5000 && M.pools.length < 3) { D.me.x = C.x - 9; D.me.y = C.y - 1; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      return { pools: M.pools.map(q => [+q.x.toFixed(2), +q.y.toFixed(2)]), hurts: (window.__hurts || []).length }; });
    console.log('  inkblot', JSON.stringify(ib));
    ok(ib.pools.length === 3 && ib.pools.every(p => trail.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 0.3)) && ib.hurts === 0, `${id}: inkblot drops three pools at the pet's recent positions (and misses a pet that moved away)`);
    await logHurts();
    const inPool = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, q = M.pools[0]; let chill = 0; const t0 = performance.now(); while (performance.now() - t0 < 1500) { D.me.x = q.x; D.me.y = q.y; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; chill = Math.max(chill, D.me.chill || 0); }
      return { dots: (window.__hurts || []).filter(h => h.dot).length, chill }; });
    console.log('  in pool', JSON.stringify(inPool)); ok(inPool.dots >= 2 && inPool.chill > 0, `${id}: standing in a pool hurts (${inPool.dots} ticks) and slows`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, q = M.pools[1]; D.me.x = q.x + 2.6; D.me.y = q.y + 1.2; }); await run(0.3); await shot(id + '-pools');

    // a pool over a lectern drowns its page: it cannot be taken
    const dr = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C; const L = [C.x + 6.5, C.y + 6.5]; const t0 = performance.now(); while (performance.now() - t0 < 800 && !M.carry) { D.me.x = L[0] + 0.9; D.me.y = L[1] - 0.9; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { drown: M.lect[2].drown, carry: !!M.carry, st: M.lect[2].st }; });
    console.log('  drowned', JSON.stringify(dr)); ok(dr.drown && !dr.carry && dr.st === 'page', `${id}: a pool over a lectern drowns its page: it can't be taken`);
    // CLEANSING PAGES: take a lectern's page, carry it through a pool: the pool is cleansed into a patch
    const pick = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C; const L = [C.x - 6.5, C.y + 6.5]; const t0 = performance.now(); while (performance.now() - t0 < 1500 && !M.carry) { D.me.x = L[0] + 0.2; D.me.y = L[1] + 1.1; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } return { carry: M.carry && { i: M.carry.i, n: M.carry.n }, st: M.lect[3].st }; });
    console.log('  pick', JSON.stringify(pick)); ok(pick.carry && pick.carry.i === 3 && pick.carry.n === 2 && pick.st === 'out', `${id}: walking up to a lectern takes its cleansing page`);
    await run(0.2); await shot(id + '-carry');
    await logHurts();
    const cl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss; const q = M.pools.slice().sort((a, c) => Math.hypot(c.x - b.x, c.y - b.y) - Math.hypot(a.x - b.x, a.y - b.y))[0], n0 = M.pools.length;
      const t0 = performance.now(); while (performance.now() - t0 < 1200 && M.pools.includes(q)) { D.me.x = q.x; D.me.y = q.y; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      await new Promise(r => setTimeout(r, 300)); const hz = FX.S.hz.includes(q.hz); return { n0, n1: M.pools.length, patch: M.patches.some(p => Math.hypot(p.x - q.x, p.y - q.y) < 0.1), hz, left: M.carry && M.carry.n, dots: (window.__hurts || []).filter(h => h.dot).length }; });
    console.log('  cleanse', JSON.stringify(cl)); ok(cl.n1 === cl.n0 - 1 && cl.patch && !cl.hz && cl.left === 1 && cl.dots === 0, `${id}: carrying the page through a pool cleanses it into a clean patch, unharmed (page has ${cl.left} left)`);
    await run(0.2); await shot(id + '-cleansed');
    const spent = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss; M.glare = { n: 0, t: 0 }; const q = M.pools[0]; b.x = q.x > FX.C.x ? q.x - 9 : q.x + 9; b.y = q.y; // (far from it: this cleanse should not count toward blinding it)
      const t0 = performance.now(); while (performance.now() - t0 < 1200 && M.pools.includes(q)) { D.me.x = q.x; D.me.y = q.y; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const st0 = M.lect[3].st; M.lect[3].back = 0.2; await new Promise(r => setTimeout(r, 500)); return { carry: !!M.carry, st0, st1: M.lect[3].st, glare: M.glare.n, stun: b.stunT > 0 }; });
    console.log('  spent', JSON.stringify(spent)); ok(!spent.carry && spent.st0 === 'gone' && spent.st1 === 'page' && spent.glare === 0 && !spent.stun, `${id}: the page is spent after two cleanses and comes back to its lectern; cleanses far from it don't blind it`);

    // REDACTION: violet dashed lies do nothing; solid red bands strike
    for (const lie of [true, false]) {
      await calm(); ok(await force('redact', IDLE[id]) === 'redact', `${id}: redaction forced (${lie ? 'standing in a lie' : 'standing in a real band'})`); await logHurts();
      const rd = await page.evaluate(async lie => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss; const W = M.red && M.red.cur; if (!W) return null;
        const kinds = W.bands.map(x => x.kind), band = W.bands.find(x => x.kind === (lie ? 'lie' : 'real')), teles = FX.S.tele.filter(s => s.redact), cols = [...new Set(teles.map(s => s.col))];
        const P = band.ori === 'row' ? [C.x + 9.5, C.y + band.o] : [C.x + band.o, C.y + 9.5]; let shotT = null; const t0 = performance.now();
        while (performance.now() - t0 < 4000 && M.red && M.red.cur === W) { D.me.x = P[0]; D.me.y = P[1]; D.me.vx = D.me.vy = 0; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
        await new Promise(r => setTimeout(r, 250)); const hs = (window.__hurts || []).slice();
        return { kinds, real: teles.length, lies: kinds.filter(k => k === 'lie').length, cols, big: hs.filter(h => !h.dot && h.d > b.dmg * 1.2).length, all: hs.length }; }, lie);
      console.log('  redact', lie ? 'lie' : 'real', JSON.stringify(rd));
      if (lie) { ok(rd && rd.real === 3 && rd.lies >= 2 && rd.cols.length === 1 && rd.cols[0] === '#FF4D6D', `${id}: redaction: three solid red bands (the game's hostile red) and ${rd && rd.lies} violet dashed lies, never two real bands side by side`);
        ok(rd && rd.all === 0, `${id}: a false redaction band is harmless (${rd && rd.all} blows)`); }
      else ok(rd && rd.big >= 1, `${id}: a real redaction band strikes (${rd && rd.big} heavy blow)`);
      if (lie) { await calm(); await force('redact', IDLE[id]); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, W = M.red.cur, band = W.bands.find(x => x.kind === 'lie'); D.me.x = band.ori === 'row' ? C.x + 4 : C.x + band.o; D.me.y = band.ori === 'row' ? C.y + band.o : C.y + 6; }); await run(1.2); await shot(id + '-redact-warn'); await run(1.0); await shot(id + '-redact-slam'); await run(1.0); }
    }
    // TENTACLE SWIPE: a shown arc
    await calm();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1; D.me.y = b.y + 4.5; }); ok(await force('swipe', IDLE[id]) === 'swipe', `${id}: swipe forced`); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 1; D.me.y = b.y + 4.5; });
    const sw = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.FD.S.tele.filter(s => s.shape === 'cone').length; }); ok(sw >= 1, `${id}: the tentacle swipe shows its arc (${sw})`);
    await logHurts(); await run(0.7); await shot(id + '-swipe-windup'); await run(0.45); await shot(id + '-swipe');
    const swh = await page.evaluate(() => (window.__hurts || []).filter(h => !h.dot).length); ok(swh >= 1, `${id}: the swipe strikes a pet left in its arc (${swh})`); await run(1.5);
    // INK JET: a shown line
    await calm();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x - 2; D.me.y = b.y + 6; }); ok(await force('jet', IDLE[id]) === 'jet', `${id}: jet forced`);
    const jt = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, s = D.FD.S.tele.find(s => s.shape === 'line'); return s ? { len: +s.len.toFixed(1), w: s.w } : null; }); ok(jt && jt.len > 4 && jt.w >= 2, `${id}: the ink jet shows its line (${JSON.stringify(jt)})`);
    await logHurts(); await run(0.8); await shot(id + '-jet-windup'); await run(0.5); await shot(id + '-jet');
    const jh = await page.evaluate(() => (window.__hurts || []).filter(h => !h.dot).length); ok(jh >= 1, `${id}: the jet strikes a pet left on its line (${jh})`); await run(1.5);

    // BLINDED: two pools cleansed in a row beside it: it drops, the mantle cracks open, the heart is bared
    await calm();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss, now = FX.S.t; M.trail = [[b.x - 3.5, b.y + 3.5], [b.x + 3.5, b.y + 3.5], [b.x, b.y + 7.5]].map(([x, y], i) => ({ x: Math.max(C.x - 11, Math.min(C.x + 11, x)), y: Math.max(C.y - 11, Math.min(C.y + 11, y)), t: now - 1 + i * 0.3 })); D.me.x = b.x; D.me.y = b.y + 7.5; });
    ok(await force('inkblot', IDLE[id]) === 'inkblot', `${id}: inkblot forced (for the blinding)`);
    await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C; const t0 = performance.now(); while (performance.now() - t0 < 5000 && (M.pools.length < 3 || D.g.boss.act !== 'hover')) { D.me.x = C.x - 9; D.me.y = C.y + 9; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } });
    const bl = await page.evaluate(async weak => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, b = D.g.boss; b.actT = -99; const bx = b.x, by = b.y, hold = () => { b.x = bx; b.y = by; b.actT = -99; }; // (it holds still in the hover for the test)
      let t0 = performance.now(); const L = [C.x - 6.5, C.y + 6.5]; while (performance.now() - t0 < 1500 && !M.carry) { D.me.x = L[0] + 0.2; D.me.y = L[1] + 1.1; hold(); await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const out = { carry: !!M.carry, near: M.pools.filter(q => Math.hypot(q.x - b.x, q.y - b.y) < 7.5).length }; const order = M.pools.filter(q => Math.hypot(q.x - b.x, q.y - b.y) < 7.5).slice(0, 2);
      for (const q of order) { t0 = performance.now(); while (performance.now() - t0 < 1200 && M.pools.includes(q)) { D.me.x = q.x; D.me.y = q.y; hold(); await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } if (q === order[0]) out.glare1 = M.glare.n; }
      await new Promise(r => setTimeout(r, 700)); const w = FX.S.weak[weak]; return Object.assign(out, { stun: b.stunT, weak: !!(w && !w.dead), open: M.open, alt: M.alt, banners: D.banners.map(x => x.s) }); }, WEAK[id]);
    console.log('  blinded', JSON.stringify(bl)); ok(bl.carry && bl.near >= 2 && bl.glare1 === 1 && bl.stun > 0 && bl.weak && bl.open > 0.6 && bl.alt < 1.5 && bl.banners.some(s => /BLINDED/.test(s)), `${id}: two pools cleansed in a row beside it: BLINDED, dropped, the mantle cracked open, the ${WEAK[id]} bared`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 0.5; D.me.y = b.y + 3.6; }); await run(0.1); await shot(id + '-blinded');
    const wh = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, b = D.g.boss, w = D.FD.S.weak[weak]; const h0 = b.hp; if (w) D.hitMon(w, 1000, { flat: true }); return h0 - b.hp; }, WEAK[id]); ok(wh > 2000, `${id}: a blow to the bared heart lands heavy (${Math.round(wh)} of 1000)`);
    await run(6.5);
    r = await page.evaluate(weak => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem; const w = D.FD.S.weak[weak]; return { stun: D.g.boss.stunT, weak: !!(w && !w.dead), open: M.open }; }, WEAK[id]);
    console.log('  after', JSON.stringify(r)); ok(!(r.stun > 0) && !r.weak, `${id}: it recovers, the mantle sealed`);

    // the phase change: the rising ink, its brood
    const p2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; const ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 4000 && D.FD.S.phase < 2) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const t1 = performance.now(); while (performance.now() - t1 < 1800) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } return { phase: D.FD.S.phase, banners: [...ban] }; });
    console.log('  phase', JSON.stringify(p2)); ok(p2.phase === 2 && p2.banners.some(s => /RISING INK/.test(s)), `${id}: phase two, the rising ink, named in a banner`); await shot(id + '-phase');
    const mins = await page.evaluate(async types => { const D = window.__pp.arc.game._dbg, seen = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 20000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; for (const m of D.mons) if (!m.dead && !m.boss && !m.fobj && types.includes(m.type)) seen.add(m.type); if (seen.size >= 2) break; } return [...seen]; }, MINIONS[id]);
    console.log('  minions', JSON.stringify(mins)); ok(mins.length >= 2, `${id}: phase-two minions (${mins.join(', ')})`);

    // STAINING: the tether broken by striking the exposed arm: TETHER BROKEN, staggered, the lectern kept
    await calm(); ok(await force('stain', IDLE[id]) === 'stain', `${id}: stain forced`);
    const st = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss; const S = M.st; if (!S) return null; const out = { i: S.i };
      let t0 = performance.now(); while (performance.now() - t0 < 6000 && M.st === S && !(S.reach >= 1 && S.fill > 0.12)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const w = FX.S.weak.arm; out.fill = S.fill; out.stain = M.lect[S.i].stain; out.weak = !!(w && !w.dead); out.k = w && w.forward; return out; });
    console.log('  stain', JSON.stringify(st)); ok(st && st.fill > 0.1 && st.stain > 0.1 && st.weak && st.k > 1.5, `${id}: it tethers a lectern and stains its page (a bar filling); the arm is an exposed weak point (×${st && st.k})`);
    await page.evaluate(i => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C, L = [[-6.5, -6.5], [6.5, -6.5], [6.5, 6.5], [-6.5, 6.5]][i]; D.me.x = C.x + L[0] * 0.6; D.me.y = C.y + L[1] * 0.6 + 1; }, st ? st.i : 0); await run(0.3); await shot(id + '-stain');
    const tb = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss, S = M.st, w = FX.S.weak.arm; if (!S || !w) return null; const h0 = b.hp; D.hitMon(w, FX.S.barHP * 0.02, { flat: true }); const one = { dmg: S.dmg, hp: h0 - b.hp, still: M.st === S };
      D.hitMon(w, FX.S.barHP * 0.03, { flat: true }); await new Promise(r => setTimeout(r, 500)); const hw = FX.S.weak.heart; return Object.assign(one, { stun: b.stunT, st: !!M.st, lect: M.lect[S.i].st, weakArm: !!(FX.S.weak.arm && !FX.S.weak.arm.dead), heart: !!(hw && !hw.dead), banners: D.banners.map(x => x.s) }); });
    console.log('  tether', JSON.stringify(tb)); ok(tb && tb.still && tb.hp > 0 && tb.stun > 0 && !tb.st && tb.lect !== 'lost' && !tb.weakArm && tb.heart && tb.banners.some(s => /TETHER BROKEN/.test(s)), `${id}: striking the exposed arm breaks the tether: TETHER BROKEN, staggered, the heart bared, the lectern kept`);
    await run(0.3); await shot(id + '-tether-broken'); await run(6.0);
    // STAINING, unanswered: the lectern is lost, it heals and hits harder
    await calm(); ok(await force('stain', IDLE[id]) === 'stain', `${id}: stain forced (to fail)`);
    const sl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, b = D.g.boss, S = M.st; if (!S) return null; let t0 = performance.now(); while (performance.now() - t0 < 6000 && M.st === S && !(S.reach >= 1)) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; }
      const hp0 = b.hp, d0 = b.dmg; S.t = S.dur - 0.2; t0 = performance.now(); while (performance.now() - t0 < 2000 && M.st === S) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } await new Promise(r => setTimeout(r, 300));
      return { lect: M.lect[S.i].st, heal: b.hp - hp0, dmgK: b.dmg / d0, banners: D.banners.map(x => x.s), lost: M.lost }; });
    console.log('  lost', JSON.stringify(sl)); ok(sl && sl.lect === 'lost' && sl.heal > 0 && sl.dmgK > 1.01 && sl.banners.some(s => /STAINED/.test(s)), `${id}: an unbroken tether loses the lectern: it heals and hits harder`);
    await run(0.4); await shot(id + '-lost');

    // INK FLOOD: the floor floods; the daises and cleansed patches stay dry; its brood crawls out
    await calm(); await page.evaluate(() => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, C = D.FD.FX.C; M.patches.push({ x: C.x - 2, y: C.y + 8, r: 1.9, t: 0, life: 30 }); });
    ok(await force('flood', IDLE[id]) === 'flood', `${id}: flood forced`); await logHurts();
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x - 2; D.me.y = C.y + 10.5; }); await run(1.6); await shot(id + '-flood-warn');
    const fl = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, FX = D.FD.FX, M = FX.mem, C = FX.C, F = M.fl; if (!F) return null; let t0 = performance.now(); while (performance.now() - t0 < 5000 && M.fl === F && F.t < F.warn - 0.05) { D.me.x = C.x - 2; D.me.y = C.y + 10.5; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const pre = (window.__hurts || []).length; while (performance.now() - t0 < 6000 && F.t < F.warn + 0.1) { D.me.x = C.x - 2; D.me.y = C.y + 8; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } window.__hurts = [];
      t0 = performance.now(); while (performance.now() - t0 < 1200) { D.me.x = C.x + 3; D.me.y = C.y + 10.5; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const wet = (window.__hurts || []).filter(h => h.dot).length; window.__hurts = [];
      const L = M.lect.findIndex(x => x.st !== 'lost'), P = [C.x + [-6.5, 6.5, 6.5, -6.5][L], C.y + [-6.5, -6.5, 6.5, 6.5][L] + 1.2];
      t0 = performance.now(); while (performance.now() - t0 < 1200) { D.me.x = P[0]; D.me.y = P[1]; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const dais = (window.__hurts || []).filter(h => h.dot).length; window.__hurts = [];
      t0 = performance.now(); while (performance.now() - t0 < 1000) { D.me.x = C.x - 2; D.me.y = C.y + 8; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; } const patch = (window.__hurts || []).filter(h => h.dot).length;
      return { pre, wet, dais, patch }; });
    console.log('  flood', JSON.stringify(fl)); ok(fl && fl.pre === 0 && fl.wet >= 2 && fl.dais === 0 && fl.patch === 0, `${id}: the ink flood: safe while it rises, hurts in the ink, a lectern's dais and a cleansed patch stay dry`);
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, C = D.FD.FX.C; D.me.x = C.x - 2; D.me.y = C.y + 8; }); await run(0.2); await shot(id + '-flood');
    const horde = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, M = D.FD.FX.mem, C = D.FD.FX.C; const seen = new Set(); let n = 0; const t0 = performance.now(); while (performance.now() - t0 < 6000 && (M.fl || n === 0)) { D.me.x = C.x - 2; D.me.y = C.y + 8; await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; n = D.mons.filter(m => !m.dead && !m.boss && !m.fobj && (m.type === 'inkstalker' || m.type === 'marginworm')).length; } return n; });
    ok(horde >= 3, `${id}: the flood spills a horde from the ink (${horde})`); await shot(id + '-horde');
    await run(2); await shot(id + '-late');
    const e1 = errors.length; ok(e1 === e0, `${id}: no page errors (${e1 - e0})`); if (e1 > e0) console.log(errors.slice(e0, e1).join('\n'));
    // the kill: a section boss ends its stage, and does not seal the rift
    const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.library }; });
    console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end', `${id}: the kill ends the stage`); ok(!kill.sealed, `${id}: a section boss does not seal the rift`);
    await page.waitForTimeout(400);
  }
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
