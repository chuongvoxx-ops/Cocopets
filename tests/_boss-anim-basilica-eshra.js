// The Basilica's first boss, animated: Eshra the Many-Lidded run through its wake, its act cycle (Witness Ray, Claw
// Crush, Scuttle), a hit, its mechanics (the ray's tether: in the open the ray strikes, behind a pillar the tether breaks,
// the ray scorches the pillar instead and the eye reels; the eye a weak point while open and reeling, none while shut;
// Claw Crush: in the frontal wedge crushed, on the flank missed), half health (the eye marks a pillar; the next ray
// cracks it; it stands one more cycle, then falls; another is marked; the last pillar is never marked), and the kill
// (a section boss: it ends the stage without sealing the rift), with no page errors.
// Screenshots (SHOTS=1): shots/anim-basilica-eshra-*.png, and every art pose as shots/anim-basilica-eshra-pose-N.png.
// usage: HTML=test-eshra.html node tests/_boss-anim-basilica-eshra.js   env: HTML, SHOTS=1
process.env.HTML = process.env.HTML || 'test.html';
const { open } = require('./_rift-lib');
const path = require('path'), fs = require('fs');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'eshra';
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, FX = D.FD.FX, M = FX.mem, me = D.me, C = FX.C, PL = D.RIFT.self.mod.pillars;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; me.leap = null; };
  const segBox = (x0, y0, x1, y1, cx, cy, h) => { let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0; for (const [p, d, lo, hi] of [[x0, dx, cx - h, cx + h], [y0, dy, cy - h, cy + h]]) { if (Math.abs(d) < 1e-9) { if (p < lo || p > hi) return false; continue; } let a = (lo - p) / d, bb = (hi - p) / d; if (a > bb) [a, bb] = [bb, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, bb); if (t0 > t1) return false; } return true; };
  const clear = (x, y) => !PL.some(P => !P.gone && segBox(M.E[0], M.E[1], x, y, P.x, P.y, 1.5)) && Math.hypot(x - C.x, y - C.y) < C.R - 1.5 && !PL.some(P => !P.gone && Math.hypot(P.x - x, P.y - y) < 2.2);
  const openSpot = () => { for (let k = 0; k < 48; k++) { const a = k * 0.6, d = 4.5 + (k % 4) * 0.8, x = M.E[0] + Math.cos(a) * d, y = M.E[1] + Math.sin(a) * d; if (clear(x, y)) return [x, y]; } return [b.x, b.y + 5]; };
  const behind = () => { const st = PL.map((P, i) => [P, i]).filter(([P]) => !P.gone).sort((p, q) => Math.hypot(p[0].x - M.E[0], p[0].y - M.E[1]) - Math.hypot(q[0].x - M.E[0], q[0].y - M.E[1])); for (const [P, i] of st) { const dx = P.x - M.E[0], dy = P.y - M.E[1], d = Math.hypot(dx, dy) || 1; for (const k of [2.3, 1.9, 2.8]) { const x = P.x + dx / d * k, y = P.y + dy / d * k; if (Math.hypot(x - C.x, y - C.y) < C.R - 1.0) return [x, y, i]; } } return null; };`;
(async () => {
  const T = await open({ lvl: 88, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon'] }); const { page, errors } = T;
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-basilica-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); if (me && !me.dead) { me.hp = D.ST.hp; me.mp = 999; } }`, secs);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M)) return true; await frame(); me.hp = D.ST.hp; } return false;`, [cond, secs]);
  // let the current act (and any mark or fall it leaves) finish, back at rest
  const settle = () => ev(`const go = clock(14); while (go() && (b.act !== 'prowl' || M.ry || M.cr || M.sc || M.mkA || M.fall || M.nextAct === 'mark' || b.stunT > 0)) { await frame(); me.hp = D.ST.hp; if (b.stunT > 0 && !arg) b.stunT = 0; } return b.act;`);
  const force = act => ev(`const go = clock(10); M.nextAct = arg; b.actT = 99; while (go() && b.act !== arg) { await frame(); me.hp = D.ST.hp; b.stunT = 0; if (b.act === 'prowl' && !M.fall) { M.nextAct = arg; b.actT = 99; } } return b.act;`, act);
  const ratio = key => ev(`const wk = D.FD.S.weak[arg], out = { weak: !!(wk && !wk.dead) }; if (out.weak) { let h0 = b.hp; D.hitMon(wk, 1000, { flat: true }); out.viaW = Math.round(h0 - b.hp); h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); } return out;`, key);
  // a Witness Ray with the pet held in the open (where) or behind a pillar ('behind'); returns what it did
  const ray = (where, snap) => ev(`const where = arg; let go = clock(8); while (go() && !(M.ry && M.ry.st === 'tether')) { await frame(); me.hp = D.ST.hp; }
    const R = M.ry; if (!R) return { started: false }; const s0 = { ...M.stat }; let spot = where === 'behind' ? behind() : openSpot(), weakT = null, fired = false, cutI = -1, stun = 0, kind = null, gone0 = PL.map(P => P.gone), crackedAtFire = null;
    go = clock(8); while (go() && (M.ry === R)) { await frame(); me.hp = D.ST.hp; if (spot) hold(spot[0], spot[1]);
      if (R.st === 'tether' && R.age - R.t1 > 1.0 && !weakT) { const wk = D.FD.S.weak.eye; weakT = !!(wk && !wk.dead); }
      if (R.st === 'fire' && !fired) { fired = true; cutI = R.cutI; crackedAtFire = PL.map(P => +P.cracked.toFixed(2)); } }
    stun = +b.stunT.toFixed(2); kind = M.stunKind;
    return { started: true, broken: R.broken, bi: R.bi, cutI, hit: M.stat.rayHit - s0.rayHit, miss: M.stat.rayMiss - s0.rayMiss, scorched: M.stat.scorched - s0.scorched, reels: M.stat.reels - s0.reels, weakT, stun, kind, spot: spot && spot[2], crackedAtFire, gone: PL.map(P => P.gone) };`, where);

  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.basilica.stages.findIndex(s => s.boss === 'eshra'));
  ok(idx === 2, `${id}: stage ${idx}`); if (idx < 0) { await T.browser.close(); process.exit(1); }
  const stg = await page.evaluate(i => { const s = window.__pp.RIFT_BY_ID.basilica.stages[i]; return { bossName: s.goal, bossRoom: s.name }; }, idx);
  console.log('  stage', JSON.stringify(stg));
  await T.start('basilica', idx);
  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, P = window.__pp; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, seal: D.F.rift && D.F.rift.seal, R: D.FD && D.FD.S.C.R, pillars: (D.RIFT.self.mod.pillars || []).length, solid: (D.RIFT.self.mod.pillars || []).map(p => p.tiles.length) }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.name === 'Eshra' && r.bars > 10 && r.phases === 2, `${id}: a Super Fiend-class fight (${r.name}, ${r.bars} bars, ${r.phases} phases)`);
  ok(!r.seal, `${id}: a section boss (its kill does not seal the rift)`); ok(r.R === 14 && r.pillars === 3, `${id}: the 28 m ossuary with three pillars`);
  // the wake: it rises from its crouch and its lids open one by one
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x + 1; D.me.y = b.y + 7; });
  await run(1.2); await shot('eshra-intro'); await run(1.7); await shot('eshra-intro-lids'); await until("b.act !== 'enter'", 10); await run(0.5);
  r = await ev(`return { act: b.act, mod: M.mod === D.RIFT.self.mod, lids: M.lidK.map(v => +v.toFixed(2)) };`);
  console.log('  wake', JSON.stringify(r)); ok(r.act && r.act !== 'enter', `${id}: awake and acting (${r.act})`); ok(r.mod, `${id}: it reaches the stage's pillars`);

  // the act cycle (40 s, the pet kept near)
  const acts = await ev(`const seen = new Set(), ban = new Set(), tail = []; const go = clock(40); while (go()) { await frame(); me.hp = D.ST.hp; me.mp = 999; if (b.hp < b.maxhp * 0.6) b.hp = b.maxhp * 0.8;
      if (Math.hypot(me.x - b.x, me.y - b.y) > 8) { const p = openSpot(); hold(p[0], p[1]); } seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); tail.push(+(M.tailA - M.hd).toFixed(2));
      if (['ray', 'crush', 'scuttle'].every(w => seen.has(w))) break; }
    const sp = Math.max(...tail) - Math.min(...tail); return { acts: [...seen], banners: [...ban], tailSpread: +sp.toFixed(2) };`);
  console.log('  acts', JSON.stringify(acts)); ok(['ray', 'crush', 'scuttle'].every(w => acts.acts.includes(w)), `${id}: the act cycle (${acts.acts.join(', ')})`);
  ok(acts.banners.includes('WITNESS RAY') && acts.banners.includes('CLAW CRUSH'), `${id}: the attacks are named in banners`);
  ok(acts.tailSpread > 0.8, `${id}: the tail moves apart from the body (spread ${acts.tailSpread} rad)`);
  await settle();
  // at rest: two shots (the pose should change), and no weak eye while its lids are shut to rays
  await ev(`const p = openSpot(); hold(p[0], p[1]); b.actT = -6;`); await run(0.3); await shot('eshra-prowl'); await run(0.4); await shot('eshra-prowl-b');
  r = await ev(`b.actT = -6; return { act: b.act, weak: !!(D.FD.S.weak.eye && !D.FD.S.weak.eye.dead) };`); ok(r.act === 'prowl' && !r.weak, `${id}: at rest the eye is no weak point`);
  // a hit
  r = await ev(`const r0 = M.recoil; D.hitMon(b, 1000, { flat: true, viaProxy: true }); await frame(); return { r0: +r0.toFixed(2), recoil: +M.recoil.toFixed(2), flinch: +M.flinch.toFixed(2) };`); await shot('eshra-hit');
  ok(r.recoil > 0.2 && r.flinch > 0.3, `${id}: it rocks back and its lids flinch when struck (${r.recoil}, ${r.flinch})`); await run(0.8);

  // ---- Witness Ray in the open: the tether holds and the ray strikes; the eye is a weak point while open ----
  await settle(); let w = await force('ray'); console.log('  wind-up', w);
  await until("M.ry && M.ry.st === 'turn' && M.ry.age > 0.35", 3); await shot('eshra-ray-windup');
  await until("M.ry && M.ry.st === 'tether'", 3); await ev(`const p = openSpot(); hold(p[0], p[1]);`); await until("M.ry && M.ry.st === 'tether' && M.ry.age - M.ry.t1 > 1.2", 3);
  let rt = await ratio('eye'); console.log('  eye open', JSON.stringify(rt)); ok(rt.weak && rt.viaW >= rt.body * 1.5, `${id}: open for the ray, the eye is a weak point (${rt.viaW} vs ${rt.body})`);
  await shot('eshra-ray-tether');
  let ry = ray('open'); await until("M.ry && M.ry.st === 'fire'", 4); await run(0.08); await shot('eshra-ray-fire'); ry = await ry; console.log('  ray open', JSON.stringify(ry));
  ok(ry.started && !ry.broken && ry.hit === 1 && ry.reels === 0, `${id}: Witness Ray: in the open, the tether holds and the ray strikes`);
  // ---- behind a pillar: the tether breaks, the ray scorches the pillar, the eye reels and is struck harder ----
  await settle(); w = await force('ray');
  ry = ray('behind'); await until("M.ry && M.ry.broken", 5); await run(0.3); await shot('eshra-ray-broken'); ry = await ry; console.log('  ray behind', JSON.stringify(ry));
  ok(ry.started && ry.broken && ry.hit === 0 && ry.scorched === 1 && ry.cutI === ry.bi, `${id}: behind a pillar the tether breaks: no ray damage, the pillar's face is scorched`);
  ok(ry.reels === 1 && ry.kind === 'reel' && ry.stun > 1.0, `${id}: the eye reels (${ry.stun} s left)`);
  await run(0.2); await shot('eshra-reel');
  rt = await ratio('eye'); console.log('  eye reel', JSON.stringify(rt)); ok(rt.weak && rt.viaW >= rt.body * 1.5 && rt.body >= 1200, `${id}: reeling, the eye takes ${rt.viaW} where the body takes ${rt.body} (body x1.25 too)`);
  await settle();

  // ---- Claw Crush: the frontal wedge crushes; the flank is safe ----
  const crush = where => ev(`const where = arg; let go = clock(6); while (go() && !(M.cr && M.cr.st === 'wind')) { await frame(); me.hp = D.ST.hp; if (M.cr && M.cr.st === 'close') hold(b.x + Math.cos(FX.angPet(b.x, b.y)) * 3.2, b.y + Math.sin(FX.angPet(b.x, b.y)) * 3.2); }
    const Cr = M.cr; if (!Cr) return { started: false }; const s0 = { ...M.stat }; const a = Cr.a + (where === 'front' ? 0 : Math.PI / 2), x = b.x + Math.cos(a) * 3.0, y = b.y + Math.sin(a) * 3.0; let raise = 0;
    go = clock(5); while (go() && M.cr === Cr) { await frame(); me.hp = D.ST.hp; if (Cr.st === 'wind' || Cr.st === 'close') hold(x, y); raise = Math.max(raise, M.raise); }
    return { started: true, hit: M.stat.crushHit - s0.crushHit, miss: M.stat.crushMiss - s0.crushMiss, raise: +raise.toFixed(2), spread: Cr.spread };`, where);
  await ev(`hold(b.x, b.y + 3.2);`); w = await force('crush'); const crShot = until("M.cr && M.cr.st === 'wind' && M.cr.age - M.cr.t0 > 0.6", 5);
  let cr = crush('front'); await crShot; await shot('eshra-crush-wind'); await until("M.cr && M.cr.st === 'stuck'", 3); await shot('eshra-crush-slam'); cr = await cr; console.log('  crush front', JSON.stringify(cr));
  ok(cr.started && cr.hit === 1 && cr.raise > 0.8, `${id}: Claw Crush: in the frontal wedge, crushed (shields raised to ${cr.raise})`);
  await settle(); await ev(`hold(b.x, b.y + 3.2);`); w = await force('crush'); cr = await crush('flank'); console.log('  crush flank', JSON.stringify(cr));
  ok(cr.started && cr.hit === 0 && cr.miss === 1, `${id}: on its flank, the crush misses`);
  await settle();
  ok(errors.length === 0, `${id}: no page errors so far (${errors.length})`); if (errors.length) console.log(errors.slice(0, 5).join('\n'));

  // ---- half health: the eye marks a pillar; the next ray cracks it; it stands one more cycle; then falls ----
  r = await ev(`const ban = new Set(); b.hp = b.maxhp * 0.45; const go = clock(12); while (go() && !(M.mk && M.mk.st === 'marked')) { await frame(); me.hp = D.ST.hp; D.banners.forEach(x => ban.add(x.s)); } return { phase: D.FD.S.phase, mk: M.mk && { ...M.mk }, banners: [...ban], marks: M.stat.marks };`);
  console.log('  mark', JSON.stringify(r)); ok(r.phase === 2 && r.mk && r.mk.st === 'marked' && r.banners.includes('THE MARKED PILLAR'), `${id}: half health: the eye MARKS a pillar (${r.mk && r.mk.i})`);
  await run(0.4); await shot('eshra-marked');
  const cycle = async tag => { await settle(); await force('ray'); const x = await ray('open'); await settle(); const st = await ev(`return { mk: M.mk && { ...M.mk }, cracked: PL.map(P => +P.cracked.toFixed(2)), gone: PL.map(P => P.gone), destroyed: M.stat.destroyed, marks: M.stat.marks };`); console.log('  ' + tag, JSON.stringify(x.crackedAtFire), JSON.stringify(st)); return st; };
  const mi = r.mk.i;
  let s1 = await cycle('ray 1'); ok(s1.cracked[mi] > 0.4 && !s1.gone[mi] && s1.mk && s1.mk.st === 'cracked', `${id}: the next ray CRACKS the marked pillar (${s1.cracked[mi]}); it still stands`);
  await shot('eshra-cracked');
  // the second ray: the cracked pillar stands through it (one more cycle), and falls after
  const fallShot = until('M.fall', 25).then(ok2 => ok2 && run(0.7).then(() => shot('eshra-falling')));
  let s2 = await cycle('ray 2'); await fallShot;
  ok(s2.gone[mi] && s2.destroyed === 1, `${id}: a cycle later the cracked pillar falls`);
  ok(s2.mk && s2.mk.i !== mi && s2.mk.st === 'marked' && s2.marks === 2, `${id}: another pillar is marked (${s2.mk && s2.mk.i})`);
  await shot('eshra-after-fall');
  let s3 = await cycle('ray 3'), s4 = await cycle('ray 4');
  ok(s4.destroyed === 2 && s4.gone.filter(g => !g).length === 1, `${id}: the second marked pillar falls in its turn; one still stands`);
  let s5 = await cycle('ray 5'); await run(2);
  r = await ev(`return { mk: M.mk, standing: PL.filter(P => !P.gone).length, marks: M.stat.marks };`);
  ok(!r.mk && r.standing === 1 && r.marks === 2 && s5.destroyed === 2, `${id}: the last pillar is never marked`);
  void s3;
  ok(errors.length === 0, `${id}: no page errors (${errors.length})`); if (errors.length) console.log(errors.slice(0, 6).join('\n'));

  // the art poses, each painted on its own
  if (process.env.SHOTS) { const urls = await page.evaluate(() => { const P = window.__pp, D = P.FIEND_DEFS.eshra, K = P.DunFiend.KIT, T = 36, cw = T * 13, ch = T * 10, out = [];
      for (const ps of D.artPoses) { const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d'); const g = c.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, '#2A2824'); g.addColorStop(1, '#BDB59E'); c.fillStyle = g; c.fillRect(0, 0, cw, ch);
        const mem = Object.assign({}, ps.mem || {}), m = Object.assign({ x: 0, y: 0, r: 2.6, t: 1, dmg: 10, act: 'prowl' }, ps.m || {});
        const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 0, y: 6 }, C: { x: 0, y: 0, R: 14 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
        D.draw(c, FX, m, cw / 2, ch * D.artY, T, 1.3); c.fillStyle = '#FFE37A'; c.font = '700 15px sans-serif'; c.fillText(ps.name, 10, 22); out.push(cv.toDataURL('image/png')); } return out; });
    urls.forEach((u, i) => fs.writeFileSync(path.resolve(__dirname, `../shots/anim-basilica-eshra-pose-${i}.png`), Buffer.from(u.split(',')[1], 'base64'))); console.log('  poses', urls.length); }

  // the kill: the lids close one by one, it settles into calcite; the stage ends without sealing
  const kp = page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.basilica }; });
  await page.waitForTimeout(1200); await shot('eshra-death-lids'); await page.waitForTimeout(1800); await shot('eshra-death-calcite');
  const kill = await kp; console.log('  kill', JSON.stringify(kill)); ok(kill.state === 'end' && kill.banners.includes('THE LIDS CLOSE'), `${id}: the kill: the lids close, the stage ends`); ok(!kill.sealed, `${id}: no sealing (a section boss)`);
  await page.waitForTimeout(400);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
