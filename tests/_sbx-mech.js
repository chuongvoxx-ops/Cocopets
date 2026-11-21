// v443 SB: gameplay unchanged - the saws hit as before, the spike plates strike as before, the boxes break and drop as
// before. Run on the v442 build and on this one and compare the JSON (the same floor, the same dice):
//   saw: the pet standing across a saw's track and a monster on it, 600 frames: every hit on the pet (frame, damage, push)
//        and on the monster; the saw's path (px, py) sampled
//   spikes: the pet on a plate, 400 frames: every hit (frame, damage), the plate's states
//   boxes: (a) BREAK_FX.burst held to a no-op so the dice are the game's alone: every box of the floor struck until it
//        breaks: the hits each took, the drops (kind, count) in order, the texts; (b) the real break: each kind's hits and
//        drops, 'Treasure!' on chests, no page errors
// usage: HTML=<test html> OUT=<json> node tests/_sbx-mech.js   env: SPEC (tower:5)
const { open } = require('./_sbx-lib');
const fs = require('fs');
(async () => {
  const T = await open({ dpr: 1 }); const { page, errors } = T, out = {};
  const spec = process.env.SPEC || 'tower:5'; await page.evaluate(() => { window.__pp.st.dun.god = false; }); out.info = await T.go(spec);
  out.saw = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; P.st.dun.god = false;
    const t = D.traps.find(q => q.kind === 'saw'); if (!t) return { none: true }; D.traps.splice(0, D.traps.length, t); D.hazards.length = 0; for (const m of D.mons) { if (m === undefined) continue; m.x += 300; m.y += 300; m.spd = 0; m.atkCd = 99; m.aggro = false; } for (const q of D.traps) { q.t = 0; q.hitT = 0; q.spin = 0; q.on = 0; q.st = q.kind === 'mine' ? 'idle' : undefined; } for (const q of D.hazards) { q.t = 0; q.st = 'idle'; q.pop = 0; } D.zones.length = 0; D.eshots.length = 0; D.g.t = 0; let s9 = 4242; Math.random = () => { s9 = (s9 * 16807) % 2147483647; return (s9 - 1) / 2147483646; }; 
    for (const m of D.mons) if (!m.boss) { m.x = t.x + 300; m.y = t.y + 300; m.spd = 0; m.atkCd = 99; m.aggro = false; }
    const mx = D.mons.find(m => !m.boss && !m.fly && !m.ghost); if (mx) { mx.x = (t.x0 + t.x1) / 2 + 0.6; mx.y = (t.y0 + t.y1) / 2 + 0.2; mx.hp = mx.maxhp = 1e9; mx.mv = 0; }
    D.g.intro = 0; const cx = (t.x0 + t.x1) / 2, cy = (t.y0 + t.y1) / 2; const hits = [], mh = [], path = []; let hp0;
    for (let f = 0; f < 1000; f++) { const pass2 = f >= 500; if (f === 500) { t.t = 0; t.hitT = 0; D.zones.length = 0; } me.x = cx - 0.4; me.y = cy + 0.15 + (pass2 ? 3 : 0); me.hp = hp0 = D.ST.hp; me.inv = 0; me.iframe = 0; const mhp = mx ? mx.hp : 0; if (mx) { mx.x = cx + 0.6 + (pass2 ? 0 : 200); mx.y = cy + 0.2; }
      G.update(1 / 60); if (f % 10 === 0) { const c = document.getElementById('arcCanvas').getContext('2d'); c.save(); G.draw(c); c.restore(); }
      if (me.hp < hp0) hits.push([f, +(hp0 - me.hp).toFixed(2), me.push ? +me.push.vx.toFixed(2) : 0, +Math.hypot(me.x - t.px, me.y - t.py).toFixed(2), D.zones.length, D.eshots.length]); if (mx && mx.hp < mhp) mh.push([f, +(mhp - mx.hp).toFixed(2)]); if (f % 25 === 0) path.push([+t.px.toFixed(3), +t.py.toFixed(3)]); }
    return { track: [t.x0, t.y0, t.x1, t.y1, t.spd], hits, monHits: mh, path }; });
  await T.go(spec); out.spikes = await page.evaluate(() => { const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me; const h = D.hazards.find(q => !q.area && (q.fam === 'spikes' || /spikes|thorns/.test(q.kind))); if (!h) return { none: true }; D.traps.length = 0; D.hazards.splice(0, D.hazards.length, h); D.eshots.length = 0; for (const m of D.mons) if (m.boss) { m.x += 300; m.y += 300; } for (const m of D.mons) if (!m.boss) { m.x = h.x + 300; m.y = h.y + 300; m.spd = 0; m.atkCd = 99; m.aggro = false; } h.t = 0; h.st = 'idle'; h.pop = 0; D.zones.length = 0; let s9 = 4242; Math.random = () => { s9 = (s9 * 16807) % 2147483647; return (s9 - 1) / 2147483646; }; 
    const hits = [], sts = []; let hp0, zoneDrawn = null;
    for (let f = 0; f < 400; f++) { me.x = h.x; me.y = h.y; me.hp = hp0 = D.ST.hp; G.update(1 / 60); if (me.hp < hp0) hits.push([f, +(hp0 - me.hp).toFixed(2)]); if (f % 20 === 0) sts.push(h.st + (h.pop > 0 ? '+' : ''));
      const z = D.zones.find(q => q.kind === 'warn' && q.hz === h.kind); if (z && zoneDrawn == null) zoneDrawn = !!(z.drawn && z.drawn()); if (f % 10 === 0) { const c = document.getElementById('arcCanvas').getContext('2d'); c.save(); G.draw(c); c.restore(); } }
    return { kind: h.kind, hits, states: sts.join(' '), circleHidden: zoneDrawn }; });
  const boxes = stub => page.evaluate(stub => { const P = window.__pp, G = P.arc.game, D = G._dbg, X = D.X, BF = self.BREAK_FX, b0 = BF.burst; if (stub) BF.burst = () => true;
    let s = 777; const mr = Math.random; Math.random = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (const m of D.mons) if (!m.boss) { m.x += 300; m.y += 300; m.spd = 0; m.atkCd = 99; m.aggro = false; } const res = []; try { for (const p of D.pots.slice()) { if (p.broken) continue; const k = p.kind, p0 = D.picks.length, t0 = D.texts.length; let n = 0; while (!p.broken && n < 6) { X.smashPots({ x: p.x, y: p.y, r: 0.05 }); n++; }
        const drops = {}; for (const q of D.picks.slice(p0)) drops[q.kind] = (drops[q.kind] || 0) + 1; res.push({ k, hits: n, hp: p.hp, drops, texts: D.texts.slice(t0).map(t => t.s).filter(x => /Treasure/.test(x)) }); } }
    finally { Math.random = mr; BF.burst = b0; } return res; }, stub);
  await T.go(spec); out.boxesStub = await boxes(true);
  await T.go(spec); out.boxesReal = await boxes(false);
  out.errors = errors; if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1));
  const sumB = L => { const o = {}; for (const r of L) { const q = o[r.k] = o[r.k] || { n: 0, hits: 0, coins: 0, hp: 0, mp: 0, treasure: 0 }; q.n++; q.hits += r.hits; q.coins += r.drops.coin || 0; q.hp += r.drops.hp || 0; q.mp += r.drops.mp || 0; q.treasure += r.texts.length; } return o; };
  console.log(spec, JSON.stringify(out.info)); console.log('saw hits', out.saw.hits && out.saw.hits.length, JSON.stringify(out.saw.hits && out.saw.hits.slice(0, 6)), 'mon hits', out.saw.monHits && out.saw.monHits.length);
  console.log('spikes', out.spikes.kind, 'hits', JSON.stringify(out.spikes.hits), 'circle hidden', out.spikes.circleHidden);
  console.log('boxes (dice the game\'s)', JSON.stringify(sumB(out.boxesStub))); console.log('boxes (real break)', JSON.stringify(sumB(out.boxesReal)));
  /* CMP=<the other build's json>: what must match. (The saw's second pass, a monster on the track with the pet 3 tiles off,
     varies from run to run on v442 itself (the pet's own attacks follow the clock), so only its count is shown) */
  if (process.env.CMP) { const B = JSON.parse(fs.readFileSync(process.env.CMP, 'utf8')), eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const rows = [['saw: hits on the pet (frame, damage, push)', eq(out.saw.hits, B.saw.hits)], ['saw: its path (the pet pass)', eq(out.saw.path.slice(0, 20), B.saw.path.slice(0, 20))], ['spikes: hits and states', eq(out.spikes.hits, B.spikes.hits) && out.spikes.states === B.spikes.states],
      ['boxes: hits, drops, texts (the game\'s dice)', eq(out.boxesStub, B.boxesStub)], ['boxes: the same with the real break', eq(out.boxesReal, B.boxesReal)]];
    for (const [k, v] of rows) console.log((v ? 'SAME   ' : 'DIFFER ') + k); console.log('saw on a monster (count, this run / the other):', out.saw.monHits.length, B.saw.monHits.length, '; spike circle hidden:', out.spikes.circleHidden, B.spikes.circleHidden); out.cmp = rows; if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(out, null, 1)); }
  console.log('page errors', errors.length, errors.slice(0, 3)); await T.browser.close(); process.exit(errors.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
