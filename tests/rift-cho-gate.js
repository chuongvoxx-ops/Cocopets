// The Crown Chase (Leo gate): tag the crown-bearer cub three times; it flees, stays on the court, throws decoys, sheds gold dust
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 95, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'colours', 'basilica', 'choir'] }); const { page, errors, shot, start } = T;
  const M = (f, a) => page.evaluate(f, a);
  // game-time waits (the headless page runs slowly): keep the pet whole while game time passes
  const runG = secs => M(async secs => { const D = window.__pp.arc.game._dbg, t0 = D.g.t, w0 = performance.now(); while (D.g.t - t0 < secs && performance.now() - w0 < secs * 1000 * 12 + 4000) { await new Promise(r => requestAnimationFrame(r)); if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } return D.g.t - t0; }, secs);
  await start('choir', 'gate'); await runG(2.5);
  let r = await M(() => { const mod = window.__pp.arc.game._dbg.RIFT.self.mod; return { intro: mod.S.intro, tags: mod.S.tags, cub: [mod.cub.x, mod.cub.y], court: [mod.X0, mod.Y0, mod.X1, mod.Y1], goal: document.getElementById('arcGoal').textContent }; });
  ok(!r.intro && r.tags === 0 && /Tags 0\/3 · catch the crown-bearer/.test(r.goal), 'the chase begins ' + JSON.stringify(r)); await shot('cho-gate-a');
  // chase it about for a while without touching it: it runs, it stays on the court and out of the pillars and hedges
  const chase = (secs, keep, want) => M(async ([secs, keep, want]) => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, cub = mod.cub, me = D.me, raf = () => new Promise(r => requestAnimationFrame(r));
    const t0 = D.g.t, w0 = performance.now(); let last = t0, out = 0, inside = 0, frames = 0, runs = 0, maxD = 0, sawRest = 0, decoys = 0, crownless = true, dust = 0, minA = 1;
    const n0 = S.tags; let caught = null, prev = null;
    while (D.g.t - t0 < secs && performance.now() - w0 < secs * 15000) { await raf(); const dt = Math.min(0.25, D.g.t - last); last = D.g.t; me.hp = D.ST.hp; frames++;
      if (S.tags !== n0) { caught = { prev, same: D.me === me, me: [+me.x.toFixed(2), +me.y.toFixed(2)] }; break; } prev = { st: cub.st, juke: !!cub.juke, vault: !!cub.vault, cub: [+cub.x.toFixed(2), +cub.y.toFixed(2)], me: [+me.x.toFixed(2), +me.y.toFixed(2)], dest: cub.dest && [+cub.dest.x.toFixed(1), +cub.dest.y.toFixed(1)], dt: +dt.toFixed(2) };
      // step the pet toward the cub, but stop short of it (keep a gap) so it is never tagged
      if (Math.hypot(cub.x - me.x, cub.y - me.y) > 3.2) { const a = Math.hypot(cub.x - me.x, cub.y - me.y), qx = cub.x - (cub.x - me.x) / a * 3.0, qy = cub.y - (cub.y - me.y) / a * 3.0; if (!mod.blockedAt(qx, qy, 0.3)) { me.x = qx; me.y = qy; } } /* (held within reach, whatever the hedges) */
      const dx = cub.x - me.x, dy = cub.y - me.y, d = Math.hypot(dx, dy); if (d > keep) { const st = Math.min(d - keep, 6.0 * dt); /* (a little quicker than a pet, to keep the pressure on) */ const nx = me.x + dx / d * st, ny = me.y + dy / d * st; if (!mod.blockedAt(nx, ny, 0.3)) { me.x = nx; me.y = ny; } else { const px = me.x + (-dy / d) * st, py = me.y + (dx / d) * st; if (!mod.blockedAt(px, py, 0.3)) { me.x = px; me.y = py; } } } me.vx = me.vy = 0;
      if (cub.x < mod.X0 || cub.x > mod.X1 || cub.y < mod.Y0 || cub.y > mod.Y1) out++; if (!cub.vault && mod.blockedAt(cub.x, cub.y, 0.3)) inside++;
      if (cub.st === 'run') runs++; if (cub.st === 'rest') sawRest++; maxD = Math.max(maxD, Math.hypot(cub.x - me.x, cub.y - me.y)); minA = Math.min(minA, cub.a);
      const live = S.decoys.filter(Boolean); decoys = Math.max(decoys, live.length); dust = Math.max(dust, S.dust.length);
      if (want === 'decoys' && live.length) break; if (want === 'dust' && S.dust.length > 8 && live.length) break; }
    return { caught, gt: +(D.g.t - t0).toFixed(1), frames, out, inside, runs, sawRest, decoys, dust, minA: +minA.toFixed(2), tags: S.tags, rests: S.rests, jukes: S.jukes, vaults: S.vaults, outside: S.outside, round: S.round }; }, [secs, keep, want]);
  // first: the pet steps close (but not onto it): the cub bolts away
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, cub = mod.cub, me = D.me; me.x = cub.x + (cub.x > mod.CX ? -2.2 : 2.2); me.y = cub.y; if (mod.blockedAt(me.x, me.y, 0.3)) me.y += 1; me.vx = me.vy = 0; const d0 = Math.hypot(cub.x - me.x, cub.y - me.y), t0 = D.g.t; let st = new Set(); const w0 = performance.now(); while (D.g.t - t0 < 1.5 && performance.now() - w0 < 30000) { await new Promise(r => requestAnimationFrame(r)); st.add(cub.st); } return { d0, d1: Math.hypot(cub.x - me.x, cub.y - me.y), st: [...st], tags: mod.S.tags }; });
  ok(r.st.includes('run') && r.d1 > r.d0 + 0.8 && r.tags === 0, 'the cub flees when the pet comes near ' + JSON.stringify(r));
  r = await chase(20, 1.6);
  ok(r.out === 0 && r.inside === 0 && r.outside === 0 && r.runs > 0 && r.tags === 0, 'chased for 20 s of game time it stays on the court, clear of pillars and hedges ' + JSON.stringify(r));
  ok(r.rests > 0, 'it stops to puff after a dash (the catch window) ' + JSON.stringify({ rests: r.rests, jukes: r.jukes, vaults: r.vaults })); await shot('cho-gate-chase');
  // tag 1: the pet onto the cub
  const tagIt = () => M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, cub = mod.cub, me = D.me, n0 = S.tags, t0 = D.g.t; let cer = false;
    const w0 = performance.now(); while (D.g.t - t0 < 2 && S.tags === n0 && performance.now() - w0 < 30000) { me.x = cub.x; me.y = cub.y; me.vx = me.vy = 0; await new Promise(r => requestAnimationFrame(r)); }
    cer = !!S.cer; const flash = cub.flash, goal = document.getElementById('arcGoal').textContent;
    return { tags: S.tags, cer, flash, goal, st: cub.st }; });
  const awaitRound = () => M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, t0 = D.g.t; const me = D.me; me.x = mod.CX; me.y = mod.Y1 - 1.0; const w0 = performance.now(); while (D.g.t - t0 < 4 && (S.cer || mod.cub.st !== 'idle') && performance.now() - w0 < 60000) { me.x = mod.CX; me.y = mod.Y1 - 1.0; await new Promise(r => requestAnimationFrame(r)); } return { round: S.round, st: mod.cub.st, cer: !!S.cer, cub: [mod.cub.x, mod.cub.y], banners: D.banners.map(b => b.s) }; });
  r = await tagIt(); ok(r.tags === 1 && r.cer && /Tags 1\/3/.test(r.goal), 'tag 1: the pet touches the cub and the catch ceremony plays ' + JSON.stringify(r)); await runG(0.6); await shot('cho-gate-tag');
  r = await awaitRound(); await runG(3.6); ok(r.round === 1 && !r.cer && r.st === 'idle', 'the cub resets and round 2 begins ' + JSON.stringify(r));
  // round 2: the cub throws decoy afterimages; touching a decoy is not a tag
  r = await chase(25, 1.3, 'decoys'); ok(r.decoys >= 2 && r.tags === 1 && r.out === 0 && r.inside === 0, 'round 2: decoy afterimages appear ' + JSON.stringify(r)); await shot('cho-gate-decoys');
  r = await M(async () => { const D = window.__pp.arc.game._dbg, mod = D.RIFT.self.mod, S = mod.S, cub = mod.cub, me = D.me, t0 = D.g.t, p0 = S.pops, n0 = S.tags;
    const w0 = performance.now(); while (D.g.t - t0 < 0.5 && performance.now() - w0 < 10000) await new Promise(r => requestAnimationFrame(r));
    // (wait for a decoy to run well clear of the real cub, the pet standing off meanwhile)
    const far0 = () => S.decoys.filter(Boolean).sort((a, b) => Math.hypot(b.x - cub.x, b.y - cub.y) - Math.hypot(a.x - cub.x, a.y - cub.y))[0];
    while (performance.now() - w0 < 20000) { const q = far0(); if (!q || Math.hypot(q.x - cub.x, q.y - cub.y) > 2.5) break; await new Promise(r => requestAnimationFrame(r)); }
    const dc = far0(); if (!dc) return { none: true };
    const far = Math.hypot(dc.x - cub.x, dc.y - cub.y); const t1 = D.g.t; while (D.g.t - t1 < 0.6 && S.pops === p0 && performance.now() - w0 < 30000) { me.x = dc.x; me.y = dc.y; me.vx = me.vy = 0; await new Promise(r => requestAnimationFrame(r)); }
    return { far: +far.toFixed(2), pops: S.pops - p0, tags: S.tags - n0, left: S.decoys.filter(Boolean).length }; });
  ok(r.pops >= 1 && r.tags === 0 && r.far > 2, 'touching a decoy only pops it: no tag ' + JSON.stringify(r));
  r = await tagIt(); ok(r.tags === 2 && r.cer, 'tag 2 ' + JSON.stringify(r));
  r = await awaitRound(); await runG(3.6); ok(r.round === 2, 'round 3 begins ' + JSON.stringify(r));
  // round 3: it fades as it runs and sheds gold dust (and still throws decoys)
  r = await chase(25, 1.3, 'dust'); ok(r.dust > 8 && r.tags === 2 && r.decoys >= 1 && r.minA < 0.6 && r.out === 0 && r.inside === 0, 'round 3: the cub fades and leaves gold dust; decoys too ' + JSON.stringify(r)); await shot('cho-gate-dust');
  r = await tagIt(); ok(r.tags === 3, 'tag 3 ' + JSON.stringify(r)); await runG(1.7); await shot('cho-gate-win');
  r = await M(() => { const D = window.__pp.arc.game._dbg; return { won: D.RIFT.self.mod.S.won, banners: D.banners.map(b => b.s) }; }); ok(r.won && r.banners.includes('LEO WAKES'), 'LEO WAKES ' + JSON.stringify(r));
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 60000 }); ok(true, 'the gate is won');
  r = await T.rs(); ok(r.gates && r.gates.choir === 1, 'the Leo gate is recorded ' + JSON.stringify(r.gates));
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'ALL OK'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
