// (v417 BR) Ball Crusher and Rapid Fire: the rules, checked in the real game with the clock driven by hand.
//   Ball Crusher: boulders and sizes per tier (1 / 4 / 7), the six-second roll, rebounds that stay in the encounter and never
//   stick, one hit per distinct pass with >= 0.75 s between hits, separate records for the two Celestial boulders, bosses hit
//   but never pushed, damage only from hits, the same hits with long frames, crumbling on defeat, cleanup.
//   Rapid Fire: exactly 6 / 8 / 10 shards with a quicker cadence per tier, aim at the selected monster, retargeting inside the
//   cone when it dies (never outside it), one hit per shard, every shard on a lone boss, swept collision with long frames,
//   recoil, damage only from impacts, defeat ending the barrage, cleanup.
// usage: HTML=test-br.html node tests/_earth-strong-br.js        (GPU=1: also draws frames on the forced GPU path)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /BR|GLM|GFX|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  const GPU = !!process.env.GPU; await page.addInitScript(g => { window.__NG_GL = g ? 1 : 0; }, GPU);
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Rock'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 900000 });
  // the helpers, in the page: an open place, a scene of monsters round the pet, a cast, the clock
  await page.evaluate(() => {
    const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false;
    const G = P.arc.game, D = G._dbg, me = D.me, g = D.g; for (let k = 0; k < 120; k++) G.update(1 / 60);
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let s0 = 777; const rnd = () => { s0 = (s0 * 16807) % 2147483647; return (s0 - 1) / 2147483646; };
    let best = null; void rnd; for (let y = 0.5; y < 160; y += 1) for (let x = 0.5; x < 160; x += 1) { if (!W(x, y)) continue; let L = 0; while (L < 10 && W(x + L, y) && W(x - L, y) && W(x, y - L) && W(x, y + L) && W(x + L * 0.7, y + L * 0.7) && W(x - L * 0.7, y - L * 0.7) && W(x + L * 0.7, y - L * 0.7) && W(x - L * 0.7, y + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x, y, L }; }   // (the most open place of the floor)
    const pool = D.mons.filter(m => !m.boss).slice(0, 8);
    window.__BR = {
      P, G, D, me, g, best, pool,
      scene(spec, px, py) { D.ELEM.fx.length = 0; me.dead = false; me.hp = D.ST.hp; me.mp = 999; g.won = false; g.cdS = 0; g.intro = 0; g.bossIntro = 0; me.x = best.x + (px || 0); me.y = best.y + (py || 0); me.leap = me.dash = null; me.inv = 99;
        for (const m of D.mons) if (!pool.includes(m)) Object.assign(m, { dead: true, x: me.x + 200, y: me.y + 200 });
        return pool.map((m, i) => { const s = spec[i]; if (!s) { Object.assign(m, { dead: true, x: me.x + 200 + i, y: me.y + 200 }); return null; }
          Object.assign(m, { dead: false, under: false, falling: false, boss: !!s.boss, x: me.x + s.dx, y: me.y + s.dy, hp: s.hp || 1e9, maxhp: s.hp || 1e9, still: s.still !== false, spd: 0, atkCd: 99, dmg: 0, aggro: true, kbx: 0, kby: 0, stun: 0, act: s.boss ? 'fight' : m.act }); m._tag = i; return m; }).filter(Boolean); },
      cast(key, evo, ax, ay) { const mv = P.ELEM_LIST.earth['ex_' + key]; D.setKit('strong', Object.assign(P.elemAbility(mv, 'strong', P.st), { star: 5, mult: 1.2, cost: 0, cd: 0, tier: 1, evo, sig: false })); me.ax = ax == null ? 1 : ax; me.ay = ay || 0; g.cdS = 0; me.mp = 999;
        const n0 = D.ELEM.fx.length; D.useStrong('strong'); return D.ELEM.fx.slice(n0).filter(f => f.key === key); },
      // the effects only (the monsters stand still), dt at a time, a check after each step
      run(secs, dt, each) { let t = 0; while (t < secs - 1e-9) { const h = Math.min(dt, secs - t); D.ELEM.update(h); g.t += h; t += h; for (const m of pool) m.mark = null; if (D.RX && D.RX.zones) D.RX.zones.length = 0; if (each) each(t); } },   // (the game's element reactions kept out: a mark left by one hit would turn the next into a reaction with its own damage)
      hp: list => list.map(m => m.maxhp - m.hp),
      draw() { G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); },
    };
    return !!best;
  });

  /* ================= Ball Crusher ================= */
  const tiers = await page.evaluate(() => { const B = window.__BR, out = [];
    for (const evo of [1, 4, 7]) { B.scene([{ dx: 4, dy: 0 }]); const F = B.cast('ballcrusher', evo); const bs = F.map(f => f.b); out.push({ evo, n: F.length, R: bs.map(b => b.R), ang: bs.map(b => Math.atan2(b.vy, b.vx)), cd: B.D.KITR.strong.cd, cost: B.D.KITR.strong.cost }); }
    return out; });
  ok(tiers[0].n === 1 && tiers[1].n === 1 && tiers[2].n === 2, 'Ball Crusher: one boulder at Base and Adept, two at Celestial', tiers.map(t => t.n));
  ok(Math.abs(tiers[1].R[0] / tiers[0].R[0] - 1.25) < 0.02 && tiers[2].R.every(r => r === tiers[1].R[0]), 'Ball Crusher: Adept about 25% larger; Celestial two of the Adept size', tiers.map(t => t.R));
  { const d = Math.abs(tiers[2].ang[0] - tiers[2].ang[1]); ok(d > 0.1 && d < 0.5, 'Ball Crusher: the two Celestial boulders on slightly diverging paths', d); }

  // the whole life at Base: six seconds of rolling, inside the encounter, never stuck, then gone
  const life = await page.evaluate(() => { const B = window.__BR, ms = B.scene([{ dx: 3, dy: 0.3 }, { dx: -2, dy: 2.5 }, { dx: 1, dy: -3 }]), F = B.cast('ballcrusher', 1)[0], b = F.b, o = { x: B.me.x, y: B.me.y }; const hp0 = B.hp(ms);
    let rollT = 0, inWall = 0, outLeash = 0, minStep = 1e9, last = null, win = [], crumbleHits = null, gone = null, maxD = 0;
    B.run(9, 1 / 120, t => { if (b.ph === 'roll') { rollT += 1 / 120; if (B.D.blocked(b.x, b.y, b.rw - 0.02, 0)) inWall++; const d = Math.hypot(b.x - o.x, b.y - o.y); maxD = Math.max(maxD, d); if (d > 9.5 + 0.2) outLeash++; win.push([t, b.x, b.y]); }
      if (b.ph !== 'roll' && crumbleHits == null && b.ph !== 'rise') crumbleHits = F.dmgEvents.length; if (gone == null && B.D.ELEM.fx.indexOf(F) < 0) gone = t; });
    // never trapped: in every 1.5 s of the roll it covered ground (the box round its places over the window is over 2 tiles across)
    for (let i = 0; i < win.length; i += 6) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, k = i; for (; k < win.length && win[k][0] - win[i][0] < 1.5; k++) { x0 = Math.min(x0, win[k][1]); x1 = Math.max(x1, win[k][1]); y0 = Math.min(y0, win[k][2]); y1 = Math.max(y1, win[k][2]); } if (k < win.length) minStep = Math.min(minStep, Math.hypot(x1 - x0, y1 - y0)); }
    const lost = B.hp(ms).reduce((a, v) => a + v, 0), ev = F.dmgEvents.reduce((a, e) => a + e.dmg, 0);
    return { rollT: +rollT.toFixed(3), inWall, outLeash, maxD: +maxD.toFixed(2), minStep: +minStep.toFixed(2), bounces: b.bounces, escapes: b.escapes, hits: F.dmgEvents.length, crumbleHits, afterCrumble: F.dmgEvents.length - crumbleHits, gone, lost: Math.round(lost), ev: Math.round(ev), fx: B.D.ELEM.fx.length }; });
  ok(Math.abs(life.rollT - 6) < 0.02, 'Ball Crusher: rolls for six seconds', life.rollT);
  ok(life.inWall === 0 && life.outLeash === 0, 'Ball Crusher: never inside a wall, never outside the encounter', life);
  ok(life.bounces >= 2 && life.minStep > 1.5 && life.escapes === 0, 'Ball Crusher: rebounds and keeps crossing the field (never trapped)', life);
  ok(life.hits > 0 && life.afterCrumble === 0, 'Ball Crusher: it hits, and the crumbling deals nothing', life);
  ok(Math.abs(life.lost - life.ev) <= 1, 'Ball Crusher: the damage is exactly its hit events (dust, gravel and chunks deal none)', [life.lost, life.ev]);
  ok(life.gone != null && life.gone < 9 && life.fx === 0, 'Ball Crusher: the effect is gone after it crumbles', life);

  // the pass rule, in a tight box where it rebounds often (a monster in its way again and again), Adept
  const pass = await page.evaluate(() => { const B = window.__BR, ms = B.scene([{ dx: 2.2, dy: 0 }, { dx: 2.2, dy: 2.2 }, { dx: -1.5, dy: -2 }]); const T = window.EARTH_STRONG_TUNE.ballcrusher, L0 = T.leash; T.leash = 3.2;
    const F = B.cast('ballcrusher', 4)[0], b = F.b, D = [], viol = []; let inside = new Map();
    // (the distance from the boulder to each monster, sampled finely, to see the passes from outside)
    B.run(8, 1 / 240, t => { if (b.ph !== 'roll') return; for (const m of ms) { const d = Math.hypot(m.x - b.x, m.y - b.y), rr = b.R + m.r; let s = inside.get(m) || { out: true, sinceHit: true }; if (d > rr + T.exitPad * 0.99) s.out = true; inside.set(m, s); } const n = F.dmgEvents.length; if (n > D.length) for (let i = D.length; i < n; i++) { const e = F.dmgEvents[i], s = inside.get(e.m); D.push(e); if (s && !s.out) viol.push({ i, t: e.t }); if (s) s.out = false; } });
    T.leash = L0; const per = new Map(); for (const e of D) { const a = per.get(e.m) || []; a.push(e.t); per.set(e.m, a); }
    let minGap = 9; for (const a of per.values()) for (let i = 1; i < a.length; i++) minGap = Math.min(minGap, a[i] - a[i - 1]);
    return { hits: D.length, perMon: [...per.values()].map(a => a.length), minGap: +minGap.toFixed(3), viol: viol.length, bounces: b.bounces }; });
  ok(pass.hits >= 3 && pass.perMon.some(n => n >= 2), 'Ball Crusher: in a small field it passes the same monsters again and again', pass);
  ok(pass.minGap >= 0.75 - 1e-6, 'Ball Crusher: at least 0.75 s between two hits of one boulder on one monster', pass.minGap);
  ok(pass.viol === 0, 'Ball Crusher: a new hit only after the boulder left the monster and came back (a new pass)', pass);

  // the same with long frames: the same hits (the motion is stepped in slices)
  const frames = await page.evaluate(() => { const B = window.__BR, T = window.EARTH_STRONG_TUNE.ballcrusher, L0 = T.leash, res = [];
    for (const dt of [1 / 120, 1 / 20, 0.25]) { T.leash = 3.4; const ms = B.scene([{ dx: 2.4, dy: 0.2 }, { dx: 2, dy: 2.3 }, { dx: -1.4, dy: -2.1 }]), F = B.cast('ballcrusher', 1)[0]; B.run(7, dt); res.push({ dt, n: F.dmgEvents.length, t: F.dmgEvents.map(e => +e.t.toFixed(3)), who: F.dmgEvents.map(e => e.m._tag) }); }
    T.leash = L0; return res; });
  { const [a, b, c] = frames, same = (p, q) => p.n === q.n && p.who.join() === q.who.join() && p.t.every((t, i) => Math.abs(t - q.t[i]) < 0.03);
    ok(a.n > 0 && same(a, b) && same(a, c), 'Ball Crusher: frame-rate independent (1/120 s, 1/20 s and 0.25 s frames land the same hits at the same times)', frames.map(f => [f.dt, f.n, f.who.join('')])); }

  // Celestial: the two boulders keep separate records; a boss takes the hits but is never moved; other monsters are shoved
  const cel = await page.evaluate(() => { const B = window.__BR, ms = B.scene([{ dx: 2.6, dy: 0, boss: true, still: false }, { dx: 3.2, dy: -2, still: false }]), F = B.cast('ballcrusher', 7), boss = ms[0], mon = ms[1], b0 = { x: boss.x, y: boss.y }, m0 = { x: mon.x, y: mon.y };
    let bossMoved = 0; B.run(3, 1 / 120, () => { bossMoved = Math.max(bossMoved, Math.hypot(boss.x - b0.x, boss.y - b0.y)); });
    const evB = F.map(f => f.dmgEvents.filter(e => e.m === boss).map(e => +e.t.toFixed(3))), evM = F.map(f => f.dmgEvents.filter(e => e.m === mon).length);
    return { n: F.length, evB, evM, bossHurt: Math.round(boss.maxhp - boss.hp), bossMoved, monMoved: +Math.hypot(mon.x - m0.x, mon.y - m0.y).toFixed(2), recs: F.map(f => f.b.rec.size), sep: F[0].b.rec !== F[1].b.rec }; });
  ok(cel.n === 2 && cel.sep && cel.evB[0].length >= 1 && cel.evB[1].length >= 1, 'Ball Crusher: Celestial boulders each record their own hits (both strike the boss on the same pass)', cel);
  ok(cel.bossHurt > 0 && cel.bossMoved < 1e-9, 'Ball Crusher: a boss takes the damage and is never pushed', { hurt: cel.bossHurt, moved: cel.bossMoved });
  ok(cel.evM.some(n => n > 0) ? cel.monMoved > 0.2 : true, 'Ball Crusher: an ordinary monster it strikes is shoved aside', cel);

  // defeat: the pet goes down mid-roll, the boulders crumble at once and hit nothing more; the effect ends
  const dead = await page.evaluate(() => { const B = window.__BR, ms = B.scene([{ dx: 3, dy: 0 }, { dx: 5, dy: 1 }]), F = B.cast('ballcrusher', 7); B.run(0.8, 1 / 60); const n0 = F.reduce((a, f) => a + f.dmgEvents.length, 0), hp0 = B.hp(ms).join();
    B.me.dead = true; B.run(0.05, 1 / 60); const ph = F.map(f => f.b.ph); B.run(4, 1 / 60); B.me.dead = false;
    return { ph, more: F.reduce((a, f) => a + f.dmgEvents.length, 0) - n0, hpSame: hp0 === B.hp(ms).join(), fx: B.D.ELEM.fx.length }; });
  ok(dead.ph.every(p => p === 'crumble') && dead.more === 0 && dead.hpSame && dead.fx === 0, 'Ball Crusher: on defeat it crumbles at once, harmlessly, and is cleaned up', dead);
  const won = await page.evaluate(() => { const B = window.__BR; B.scene([{ dx: 3, dy: 0 }]); const F = B.cast('ballcrusher', 1); B.run(0.6, 1 / 60); B.g.won = true; B.run(0.05, 1 / 60); const ph = F[0].b.ph; B.run(4, 1 / 60); B.g.won = false; return { ph, fx: B.D.ELEM.fx.length }; });
  ok(won.ph === 'crumble' && won.fx === 0, 'Ball Crusher: a won stage ends it too (encounter over)', won);

  /* ================= Rapid Fire ================= */
  const rf = await page.evaluate(() => { const B = window.__BR, out = [];
    for (const evo of [1, 4, 7]) { const ms0 = B.scene([{ dx: 3.2, dy: 0.3 }]); const F = B.cast('rapidfire', evo)[0]; const times = []; let n = 0; B.run(2.5, 1 / 240, t => { if (F.shots.length > n) { n = F.shots.length; times.push(t); } });
      const gaps = []; for (let i = 1; i < times.length; i++) gaps.push(times[i] - times[i - 1]); out.push({ evo, lost: Math.round(B.hp(ms0)[0]), ev: Math.round(F.dmgEvents.reduce((a, e) => a + e.dmg, 0)), n: F.shots.length, gap: +(gaps.reduce((a, v) => a + v, 0) / Math.max(1, gaps.length)).toFixed(3), span: +(times[times.length - 1] - times[0]).toFixed(3), hits: F.dmgEvents.length, perShot: Math.max(...Object.values(F.dmgEvents.reduce((a, e) => (a[e.i] = (a[e.i] || 0) + 1, a), {}))), cd: B.D.KITR.strong.cd, fx: B.D.ELEM.fx.length }); }
    return out; });
  ok(rf[0].n === 6 && rf[1].n === 8 && rf[2].n === 10, 'Rapid Fire: exactly 6 / 8 / 10 projectiles', rf.map(r => r.n));
  ok(rf[0].gap > rf[1].gap && rf[1].gap > rf[2].gap && rf.every(r => r.span < 1.0), 'Rapid Fire: a quicker cadence at higher tiers, a short barrage', rf.map(r => [r.gap, r.span]));
  ok(rf.every(r => r.hits === r.n && r.perShot === 1), 'Rapid Fire: every shard hits the selected monster, each once', rf.map(r => [r.hits, r.perShot]));
  ok(rf.every(r => r.fx === 0), 'Rapid Fire: cleaned up after the barrage', rf.map(r => r.fx));

  // retargeting: the selected monster dies early; the rest go to another monster near it in the cone, never to one outside it
  const rt = await page.evaluate(() => { const B = window.__BR, ms = B.scene([{ dx: 2.2, dy: 0, hp: 1 }, { dx: 3.2, dy: 0.9 }, { dx: -2.8, dy: 0.2 }, { dx: 0.3, dy: 3.3 }]), F = B.cast('rapidfire', 7)[0];
    const first = F.first && F.first._tag; B.run(2.5, 1 / 120); const by = {}; for (const e of F.dmgEvents) by[e.m._tag] = (by[e.m._tag] || 0) + 1;
    const lost = B.hp(ms.slice(1)).reduce((a, v) => a + v, 0), ev = F.dmgEvents.filter(e => e.m !== ms[0]).reduce((a, e) => a + e.dmg, 0);   // (the first one: an overkill)
    return { first, by, out: Math.round(B.hp(ms.slice(2)).reduce((a, v) => a + v, 0)), retargets: F.retargets, n: F.shots.length, killed: !!ms[0].dead, lost: Math.round(lost), ev: Math.round(ev) }; });
  ok(rt.first === 0 && rt.killed && rt.by[0] === 1 && rt.by[1] === 9 && !rt.by[2] && !rt.by[3] && rt.retargets >= 1, 'Rapid Fire: the target dies; the remaining shots go to the next monster in the aiming cone, none outside it', rt);
  ok(rf.every(r => Math.abs(r.lost - r.ev) <= 1), 'Rapid Fire: the damage is exactly its impacts (muzzle, trails and chips deal none)', rf.map(r => [r.lost, r.ev]));
  ok(rt.out === 0, 'Rapid Fire: the monsters outside the cone take nothing', rt.out);

  // a lone boss takes every shard; with long frames (the shards then cross 4.8 tiles a frame) the same
  const boss = await page.evaluate(() => { const B = window.__BR, res = [];
    for (const dt of [1 / 120, 0.2]) { const ms = B.scene([{ dx: 3.2, dy: 0.4, boss: true }]), F = B.cast('rapidfire', 4)[0]; B.run(2.5, dt); res.push({ dt, n: F.shots.length, hits: F.dmgEvents.length, boss: F.dmgEvents.every(e => e.boss), hurt: Math.round(ms[0].maxhp - ms[0].hp) }); }
    return res; });
  ok(boss.every(r => r.n === 8 && r.hits === 8 && r.boss && r.hurt > 0), 'Rapid Fire: a lone boss takes all the projectiles, with short and long frames (swept collision)', boss);

  // recoil: each shot nudges the pet back, the last more
  const rc = await page.evaluate(() => { const B = window.__BR; B.scene([{ dx: 4, dy: 0 }]); const x0 = B.me.x, y0 = B.me.y, F = B.cast('rapidfire', 1)[0]; const xs = []; let n = 0; B.run(1.5, 1 / 240, () => { if (F.shots.length > n) { n = F.shots.length; xs.push(B.me.x); } });
    const steps = xs.map((x, i) => +((i ? xs[i - 1] : x0) - x).toFixed(3)); return { steps, total: +(x0 - B.me.x).toFixed(3), dy: +(B.me.y - y0).toFixed(3) }; });
  ok(rc.steps.length === 6 && rc.steps.slice(0, 5).every(s => s > 0.03 && s < 0.08) && rc.steps[5] > rc.steps[0] * 1.8, 'Rapid Fire: a small recoil each shot, a stronger one on the last', rc);

  // defeat mid-barrage: the shots left are not fired, those in flight shatter harmlessly, the effect ends
  const rd = await page.evaluate(() => { const B = window.__BR, ms = B.scene([{ dx: 5, dy: 0 }]), F = B.cast('rapidfire', 7)[0]; B.run(0.42, 1 / 120); const n = F.shots.length, h = F.dmgEvents.length; B.me.dead = true; B.run(0.02, 1 / 120); const fly = F.shots.filter(s => s.ph === 'fly').length; B.run(2, 1 / 60); B.me.dead = false;
    return { fired: n, cancelled: F.cancelled, shots: F.shots.length, fly, more: F.dmgEvents.length - h, fx: B.D.ELEM.fx.length }; });
  ok(rd.fired > 0 && rd.fired < 10 && rd.shots === rd.fired && rd.cancelled === 10 - rd.fired && rd.fly === 0 && rd.more === 0 && rd.fx === 0, 'Rapid Fire: on defeat the barrage stops, flying shards shatter harmlessly, cleaned up', rd);

  // nothing else in the cone: the target dies at once, the rest fly on along the aim and never turn to the monster behind the pet
  const nc = await page.evaluate(() => { const B = window.__BR, ms = B.scene([{ dx: 2.2, dy: 0, hp: 1 }, { dx: -2.6, dy: 0.1 }]), F = B.cast('rapidfire', 1)[0]; B.run(2, 1 / 120); return { n: F.shots.length, hits: F.dmgEvents.length, behind: F.dmgEvents.filter(e => e.m === ms[1]).length, hurt: Math.round(ms[1].maxhp - ms[1].hp), fx: B.D.ELEM.fx.length }; });
  ok(nc.n === 6 && nc.hits === 1 && nc.behind === 0 && nc.hurt === 0 && nc.fx === 0, 'Rapid Fire: no other monster in the aiming cone: the rest fly along the aim and never hit the one behind', nc);

  /* ================= the GPU path draws (GPU=1) ================= */
  if (GPU) { const gd = await page.evaluate(() => { const B = window.__BR, out = {}; for (const key of ['ballcrusher', 'rapidfire']) { B.scene([{ dx: 3, dy: 0.4 }, { dx: 4.5, dy: -1.5 }]); B.cast(key, 7); let k = 0; for (let i = 0; i < 6; i++) { B.run(0.18, 1 / 60); B.draw(); k++; } out[key] = { frames: k, br: window.EARTH_BR_GPU.STATS.n, usable: window.EARTH_BR_GPU.usable() }; B.run(8, 1 / 30); } return out; });
    ok(gd.ballcrusher.usable && gd.rapidfire.br > 0, 'the GPU path draws both moves (GLM meshes)', gd); }

  // map exit: the arcade closes; a new floor starts with no effects
  const ex = await page.evaluate(async () => { const B = window.__BR; B.scene([{ dx: 3, dy: 0 }]); B.cast('ballcrusher', 7); B.cast('rapidfire', 7); const n = B.D.ELEM.fx.length; const P = B.P; P.closeArcade(); P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); return { n }; });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 900000 });
  const ex2 = await page.evaluate(() => ({ fx: window.__pp.arc.game._dbg.ELEM.fx.length }));
  ok(ex.n >= 3 && ex2.fx === 0, 'map exit: the effects go with the floor (a new one starts clean)', [ex.n, ex2.fx]);

  ok(!errors.length, 'no page errors', errors.slice(0, 6));
  console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
