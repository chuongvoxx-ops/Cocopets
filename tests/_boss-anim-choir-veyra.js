// The Choir's second boss, animated: Veyra the Throat of Night (stage 5, The Pipe Bridge). Its wake (it unfolds from the
// arch), the act cycle (Antiphon, Stolen Note, the drop between phrases and the climb back), ANTIPHON (numbered horn lanes
// fire in order; a pet behind THAT horn's wedge takes no hit, one in the open does, one that steps into the lane that has
// just sung is safe), STOLEN NOTE (a hush moth comes out of the throat, perches on the first horn and steals the third
// note: that horn's symbol changes and the third lane's preview jumps to it at least 4 s before it fires), the throat
// weak point (x1.5 while it glows), the drop's landing window (x1.75), half health (THE THROAT DESCENDS: it drops into the
// arena for good, a long landing window), the WING CONE (in front: struck; behind: not), the art poses (a sheet and each
// pose large, SHOTS=1), and the kill (a section boss: the stage ends, no sealing), with no page errors.
// Screenshots into shots/anim-choir-veyra-*.png.
// usage: HTML=test-veyra.html node tests/_boss-anim-choir-veyra.js   env: SHOTS=1, POSES=1 (only the art poses)
const { open } = require('./_rift-lib');
const path = require('path'), fs = require('fs');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const id = 'veyra', STAGE = 5;
const PRE = `const D = window.__pp.arc.game._dbg, b = D.g.boss, FX = D.FD.FX, M = FX.mem, me = D.me, C = FX.C, W = () => D.FD.S.weak, mod = D.RIFT.self.mod, CHO = D.RIFT.self.amb.CHO;
  const frame = () => new Promise(r => requestAnimationFrame(r));
  const clock = secs => { const g0 = D.g.t, w0 = performance.now(); return () => D.g.t - g0 < secs && performance.now() - w0 < secs * 4000; };
  const hold = () => { me.hp = D.ST.hp; me.mp = 999; };
  const pin = (x, y) => { me.x = x; me.y = y; me.vx = me.vy = 0; me.dodge = null; me.push = null; };
  const live = o => !!(o && !o.dead);
  const shelterSpot = i => { const w = mod.wedges[i]; return { x: w.x, y: w.y + 4 }; };
  const openSpot = i => { const h = mod.horns[i], w = mod.wedges[i]; return { x: h.x + 3.2, y: w.y + 4 }; };`;
(async () => {
  const T = await open({ lvl: 98, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth', 'library', 'moon', 'basilica', 'colours'] }); const { page, errors } = T;
  fs.mkdirSync(path.resolve(__dirname, '../shots'), { recursive: true });
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/anim-choir-veyra-${name}.png`) }); };
  const ev = (body, arg) => page.evaluate(([body, arg]) => (new Function('arg', 'return (async () => {' + body + '})()'))(arg), [PRE + body, arg]);
  const run = secs => ev(`const go = clock(arg); while (go()) { await frame(); if (me && !me.dead) hold(); }`, secs);
  const until = (cond, secs) => ev(`const f = new Function('D', 'b', 'M', 'me', 'mod', 'return ' + arg[0]); const go = clock(arg[1]); while (go()) { if (f(D, b, M, me, mod)) return true; await frame(); hold(); } return false;`, [cond, secs]);
  // force the next act (taken when it rests: on the arch in phase one, stalking in phase two)
  const force = (act, secs) => ev(`const want = arg[0] === 'stolen' ? 'antiphon' : arg[0] === 'swoop' ? 'leap' : arg[0]; let go = clock(arg[1] || 20); while (go() && b.act !== want) { await frame(); hold(); if ((b.act === 'hang' || b.act === 'stalk') && !(b.stunT > 0)) { M.nextAct = arg[0]; M.wait = 0; } } return b.act;`, [act, secs]);
  const rest = (secs) => ev(`const go = clock(arg || 25); while (go() && (!(b.act === 'hang' || b.act === 'stalk') || b.stunT > 0 || M.P || M.Cn || M.Lp || M.Dr)) { await frame(); hold(); } return b.act;`, secs);

  const idx = await page.evaluate(() => window.__pp.RIFT_BY_ID.choir.stages.findIndex(s => s.boss === 'veyra'));
  ok(idx === STAGE, `${id}: stage ${idx}`);
  await T.start('choir', idx);

  // ---- the art poses: a sheet with the arch behind the hanging ones, and each pose large ----
  if (process.env.SHOTS) { const sheet = await page.evaluate(PT => { const P = window.__pp, D = P.FIEND_DEFS.veyra, K = P.DunFiend.KIT, G = P.arc.game._dbg, CHO = G.RIFT.self.amb.CHO, poses = D.artPoses, errs = [], out = [];
      const paint = (c, ps, i, x, y, cw, ch, T) => { const g = c.createLinearGradient(0, y, 0, y + ch); g.addColorStop(0, '#4A2A40'); g.addColorStop(1, '#2E1828'); c.fillStyle = g; c.fillRect(x, y, cw, ch);
        c.strokeStyle = 'rgba(165,138,78,.35)'; c.lineWidth = 1; for (let gx = x; gx < x + cw; gx += T * 2) { c.beginPath(); c.moveTo(gx, y); c.lineTo(gx, y + ch); c.stroke(); } for (let gy = y; gy < y + ch; gy += T * 2) { c.beginPath(); c.moveTo(x, gy); c.lineTo(x + cw, gy); c.stroke(); }
        const mem = Object.assign({ bt: 1.3 + i * 0.7 }, JSON.parse(JSON.stringify(ps.mem || {}))), m = { x: 0, y: 0, r: 2.2, t: 1, dmg: 10, act: 'hang', hitSq: 0, stunT: (ps.m && ps.m.stunT) || 0 };
        const FX = { K, mem, m, S: { phase: 1, lv: 1, fast: 1, m, props: [], tele: [], hz: [], objs: [], weak: {} }, H: { part() {} }, me: { x: 1.5, y: 6 }, C: { x: 0, y: 0, R: 16 }, sx: v => v * T, sy: v => v * T, Tz: () => T, rnd: (a, b) => a + Math.random() * (b - a) };
        const X0 = x + cw / 2, Y0 = y + ch * D.artY; if ((mem.g || 0) < 0.5) { c.save(); CHO.archArt(c, X0, Y0 - T * 0.12, T, 9); c.restore(); }
        c.save(); try { D.draw(c, FX, m, X0, Y0, T, 1.3); } catch (e) { errs.push(ps.name + ': ' + e.message); } c.restore();
        c.fillStyle = '#FFE8DE'; c.font = `700 ${Math.round(T * 0.32)}px sans-serif`; c.fillText(ps.name, x + 8, y + T * 0.45); };
      { const T = 34, cw = T * 11, ch = T * 7, cols = 3, rows = Math.ceil(poses.length / cols), cv = document.createElement('canvas'); cv.width = cw * cols; cv.height = ch * rows; const c = cv.getContext('2d'); poses.forEach((ps, i) => paint(c, ps, i, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch, T)); out.push(cv.toDataURL('image/png')); }
      poses.forEach((ps, i) => { const T = PT, cw = T * 11, ch = T * 6.6, cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const c = cv.getContext('2d'); paint(c, ps, i, 0, 0, cw, ch, T); out.push(cv.toDataURL('image/png')); });
      window.__artErrs = errs; return out; }, +process.env.POSE_T || 64);
    fs.writeFileSync(path.resolve(__dirname, '../shots/anim-choir-veyra-poses.png'), Buffer.from(sheet[0].split(',')[1], 'base64'));
    sheet.slice(1).forEach((u, i) => fs.writeFileSync(path.resolve(__dirname, `../shots/anim-choir-veyra-pose-${i}.png`), Buffer.from(u.split(',')[1], 'base64')));
    const ae = await page.evaluate(() => window.__artErrs); ok(!ae.length, `${id}: every art pose paints (${ae.join('; ')})`);
    if (process.env.POSES) { console.log('errors', errors.length, errors.slice(0, 4)); await T.browser.close(); process.exit(fails ? 1 : 0); } }

  let r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { fd: !!D.FD, name: D.F.fiend && D.F.fiend.name, bars: D.F.fiend && D.F.fiend.bars, phases: D.F.fiend && D.F.fiend.phases, seal: D.F.rift && D.F.rift.seal, R: D.FD && D.FD.S.C.R, horns: D.RIFT.self.mod.horns.length, wedges: D.RIFT.self.mod.wedges.length }; });
  console.log('  fiend', JSON.stringify(r)); ok(r.fd && r.name === 'Veyra' && r.phases === 2 && r.R === 16 && r.horns === 3 && r.wedges === 3 && !r.seal, `${id}: a fiend fight (${r.bars} bars, ${r.phases} phases) on the pipe bridge with its three horns and wedges`);
  // the wake: it unfolds from the arch
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss || D.M.bossAt; D.me.x = b.x + 1; D.me.y = b.y + 5; });
  await until('D.g.boss && D.g.boss.act === "enter" && M.s > 0.3', 15); await shot('intro-unfold'); await until('b.act !== "enter" || M.inf > 0.7', 15); await shot('intro-scream'); await until('b.act !== "enter"', 15); await run(1.0);
  r = await ev(`return { act: b.act, wrap: +M.wrap.toFixed(2), g: +M.g.toFixed(2), hx: +(b.x - mod.arch.hang.x).toFixed(2) };`); console.log('  wake', JSON.stringify(r)); ok(r.act === 'hang' && r.wrap < 0.2 && r.g < 0.1 && Math.abs(r.hx) < 0.2, `${id}: awake, clinging to the arch (${r.act})`);
  await ev(`pin(b.x + 1.2, b.y + 3.2);`); await run(0.2); await shot('idle'); await run(0.5); await shot('idle-b');

  // the act cycle (phase one): the phrases and the drop between them
  let acts = await ev(`const seen = new Set(), ban = new Set(); const go = clock(60); while (go()) { await frame(); hold(); if (b.hp < b.maxhp * 0.6) b.hp = b.maxhp * 0.9; seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (M.P) { const s = M.P.steps.find(q => !q.done); if (s) { const p = shelterSpot(s.i); pin(p.x, p.y); } } else pin(mod.arch.hang.x + 2, mod.arch.hang.y + 4); if (['antiphon', 'drop', 'climb', 'hang'].every(a => seen.has(a)) && M.stat.stolenPhrases) break; } return { acts: [...seen], banners: [...ban], st: { phrases: M.stat.phrases, stolen: M.stat.stolenPhrases, drops: M.stat.drops, climbs: M.stat.climbs } };`);
  console.log('  acts', JSON.stringify(acts)); ok(['antiphon', 'drop', 'climb', 'hang'].every(a => acts.acts.includes(a)), `${id}: the act cycle (${acts.acts.join(', ')})`);
  ok(acts.banners.includes('ANTIPHON') && acts.banners.includes('STOLEN NOTE') && acts.banners.includes('IT DROPS'), `${id}: the attacks are named in banners`);
  await rest();

  // ---- ANTIPHON: behind the right wedge, in the open, in the lane that has just sung ----
  const phrase = mode => ev(`const mode = arg; let go = clock(6); while (go() && !(M.P && M.P.t > 0.05)) { await frame(); hold(); } const P = M.P; if (!P) return { started: false };
    const s0 = M.stat.steps.length, order = P.steps.map(s => s.i), lit = []; let shelterOK = true, beatsN = 0;
    go = clock(14); while (go() && M.P === P) { await frame(); hold(); const next = P.steps.find(s => !s.done), last = P.steps.filter(s => s.done).pop();
      if (P.t < 1.2) { const ls = mod.horns.map(h => +(h.lit > 0.5)); lit.push(ls.join('')); beatsN = Math.max(beatsN, CHO.beats({ g: D.g }).filter(p => p.shape === 'lane' && !p.fired).length); }
      let spot = null; if (next) { if (mode === 'shelter') { spot = shelterSpot(next.i); shelterOK = shelterOK && mod.sheltered(spot.x, spot.y, next.i) && mod.inLane(spot.x, spot.y, next.i); } else if (mode === 'open') spot = openSpot(next.i); else if (mode === 'last') { const lane = last ? last.i : P.steps[2].i; spot = openSpot(lane); } }
      if (spot) pin(spot.x, spot.y); }
    const st = M.stat.steps.slice(s0); return { started: true, order, fired: st.map(s => s.i), nums: st.map(s => s.n), res: st.map(s => s.res), lit: lit.slice(-1)[0], beatsN, shelterOK };`, mode);
  await force('antiphon'); let ph = phrase('open'); await until('M.P && M.P.t > 1.4', 5); await shot('antiphon-lit'); await until('M.P && M.P.steps[0].done', 6); await run(0.1); await shot('antiphon-fire'); ph = await ph;
  console.log('  antiphon open', JSON.stringify(ph));
  ok(ph.started && ph.beatsN === 3 && ph.lit === '111', `${id}: Antiphon: all three horns light, three numbered lane previews (${ph.beatsN})`);
  ok(JSON.stringify(ph.fired) === JSON.stringify(ph.order) && JSON.stringify(ph.nums) === '[1,2,3]', `${id}: the lanes fire in their numbered order (${ph.fired.join(' > ')})`);
  ok(ph.res.every(x => x === 'hit'), `${id}: a pet in the open in each lane is struck (${ph.res.join(',')})`);
  await rest(); await force('antiphon'); ph = phrase('shelter'); await until('M.P && M.P.steps[0].done', 8); await run(0.1); await shot('antiphon-shelter'); ph = await ph; console.log('  antiphon shelter', JSON.stringify(ph));
  ok(ph.started && ph.shelterOK && ph.res.every(x => x === 'shelter'), `${id}: behind THAT horn's wedge the pet takes no hit (${ph.res.join(',')})`);
  await rest(); await force('antiphon'); ph = await phrase('last'); console.log('  antiphon last lane', JSON.stringify(ph));
  ok(ph.started && ph.res.every(x => x === 'clear'), `${id}: stepping into the lane that has just sung is always safe (${ph.res.join(',')})`);
  await rest();

  // ---- the throat: a weak point (x1.5) while it glows ----
  await force('antiphon');
  let wk = await ev(`let go = clock(5); while (go() && !live(W().throat)) { await frame(); hold(); const s = M.P && M.P.steps.find(q => !q.done); if (s) { const p = shelterSpot(s.i); pin(p.x, p.y); } }
    const out = { inf: +M.inf.toFixed(2) }; let h0 = b.hp; if (live(W().throat)) { D.hitMon(W().throat, 1000, { flat: true }); out.throat = Math.round(h0 - b.hp); } h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); out.body = Math.round(h0 - b.hp); return out;`);
  console.log('  throat', JSON.stringify(wk)); ok(wk.throat >= wk.body * 1.45 && wk.body > 0, `${id}: the glowing throat takes ${wk.throat} to the body's ${wk.body} (x1.5)`);
  await shot('throat'); await ev(`let go = clock(12); while (go() && M.P) { await frame(); hold(); const s = M.P && M.P.steps.find(q => !q.done); if (s) { const p = shelterSpot(s.i); pin(p.x, p.y); } }`);
  r = await ev(`await frame(); return { throat: live(W().throat), inf: +M.inf.toFixed(2) };`); await run(1.2); r = await ev(`return { throat: live(W().throat), inf: +M.inf.toFixed(2) };`); ok(!r.throat, `${id}: the throat is no weak point once the song ends (${JSON.stringify(r)})`);
  await rest();

  // ---- STOLEN NOTE: a moth steals the third note; the third lane jumps horns at least 4 s before it fires ----
  await force('stolen');
  const stolen = ev(`let go = clock(4); while (go() && !(M.P && M.P.steal)) { await frame(); hold(); } const P = M.P; if (!P || !P.steal) return { started: false };
    const moths0 = D.mons.filter(m => m.type === 'hushmoth' && !m.dead).length, syms0 = mod.horns.map(h => h.sym), s3 = P.steps[2], from = s3.i; let mothSeen = 0, changeT = null, changed = null, previewX = null, hushedFired = false, perched = false;
    go = clock(16); while (go() && M.P === P) { await frame(); hold(); const mo = D.mons.filter(m => m.type === 'hushmoth' && !m.dead); mothSeen = Math.max(mothSeen, mo.length); if (M.moth && M.moth.veyCtl && M.moth.veyCtl.st === 'perch') perched = true;
      mod.horns.forEach((h, i) => { if (h.sym !== syms0[i] && changeT == null) { changeT = D.g.t; changed = i; previewX = s3.p ? s3.p.x : null; } });
      const s = P.steps.find(q => !q.done); if (s) { const p = shelterSpot(s.i); pin(p.x, p.y); } }
    const steal = M.stat.steals[M.stat.steals.length - 1], st = M.stat.steps.slice(-3), fire = st.find(s => s.stolen);
    return { started: true, moths0, mothSeen, perched, from, to: steal && steal.to, changed, newSym: changed != null ? mod.horns[changed].sym : null, sym3: s3.sym, previewMoved: previewX != null && Math.abs(previewX - mod.horns[steal ? steal.to : 0].x) < 0.01, changeT, fireT: fire && fire.t, lead: fire && changeT != null ? +(fire.t - changeT).toFixed(2) : null, fired: st.map(s => s.i), res: st.map(s => s.res), stealLead: steal && +steal.lead.toFixed(2) };`);
  await until('M.moth && M.moth.veyCtl && M.moth.veyCtl.st === "fly"', 4); await shot('stolen-moth'); await until('M.P && M.P.stolen', 6); await run(0.4); await shot('stolen-swap'); let sn = await stolen;
  console.log('  stolen', JSON.stringify(sn));
  ok(sn.started && sn.mothSeen >= 1 && sn.perched, `${id}: Stolen Note: a hush moth comes out of the throat and perches on a horn`);
  ok(sn.changed === sn.to && sn.to !== sn.from && sn.previewMoved, `${id}: the moth's horn takes the stolen symbol and the third lane's preview jumps to it (horn ${sn.from} > ${sn.to})`);
  ok(sn.lead != null && sn.lead >= 4.0, `${id}: the changed preview shows ${sn.lead} s before it fires (>= 4 s)`);
  ok(sn.fired[2] === sn.to && !sn.fired.slice(1).includes(sn.from) && sn.res.every(x => x === 'shelter'), `${id}: the stolen note fires from the new horn; behind its wedge the pet is safe (${sn.fired.join(' > ')}: ${sn.res.join(',')})`);
  await rest();

  // ---- between phrases: the drop and its landing window (x1.75) ----
  const bodyHit = () => ev(`const h0 = b.hp; D.hitMon(b, 1000, { flat: true, viaProxy: true }); return Math.round(h0 - b.hp);`);
  const base = await bodyHit();
  await force('drop'); await until('b.act === "drop" && M.Dr && M.Dr.st === "fall"', 4); await shot('drop-fall');
  r = await ev(`let go = clock(4); while (go() && !(b.stunT > 0 && M.stunKind === 'land')) { await frame(); hold(); } return { stun: +b.stunT.toFixed(2), kind: M.stunKind, g: +M.g.toFixed(2) };`);
  await ev(`pin(b.x + 0.6, b.y + 2.2);`); await run(0.3); await shot('drop-landed');
  const landed = await bodyHit(); console.log('  drop', JSON.stringify(r), 'base', base, 'landed', landed);
  ok(r.kind === 'land' && r.stun > 1.4, `${id}: it drops to the floor between phrases and lies there (${r.stun} s)`); ok(landed >= base * 1.7, `${id}: the landing window: ${landed} against ${base} (x1.75)`);
  r = await ev(`let go = clock(8); const seen = new Set(); while (go() && b.act !== 'hang') { await frame(); hold(); seen.add(b.act); if (b.act === 'climb' && M.Dr && M.Dr.t > 0.5 && !window.__climbShot) window.__climbShot = 1; } return { acts: [...seen], act: b.act };`);
  ok(r.act === 'hang' && r.acts.includes('climb'), `${id}: it climbs back to the arch (${r.acts.join(',')})`);
  await rest();

  // ---- half health: THE THROAT DESCENDS ----
  r = await ev(`const ban = new Set(); b.stunT = 0; b.hp = b.maxhp * 0.45; pin(C.x + 4, C.y + 6); const go = clock(6); while (go() && D.FD.S.phase < 2) { await frame(); hold(); } const g2 = clock(9); let big = null; while (g2()) { await frame(); hold(); D.banners.forEach(x => ban.add(x.s)); if (!big && M.stat.bigLands && b.stunT > 0) { big = { stun: +b.stunT.toFixed(2), kind: M.stunKind }; break; } } return { phase: D.FD.S.phase, banners: [...ban], big, act: b.act, g: +M.g.toFixed(2) };`);
  console.log('  phase 2', JSON.stringify(r)); ok(r.phase === 2 && r.banners.includes('THE THROAT DESCENDS'), `${id}: half health: THE THROAT DESCENDS`);
  ok(r.big && r.big.kind === 'land' && r.big.stun > 2.5, `${id}: it crashes down into the arena: a long landing window (${r.big && r.big.stun} s)`);
  await ev(`pin(b.x + 0.5, b.y + 2.4);`); await run(0.2); await shot('descend-landed'); const big = await bodyHit(); ok(big >= base * 1.7, `${id}: its landing in the arena takes ${big} (x1.75)`);
  await rest();
  // ---- the WING CONE: in front, struck; behind, safe ----
  const cone = mode => ev(`let go = clock(4); while (go() && !(M.Cn && M.Cn.st === 'wind')) { await frame(); hold(); } const Cn = M.Cn; if (!Cn) return { started: false }; const s0 = { h: M.stat.coneHit, m: M.stat.coneMiss }; const a = Cn.a, k = arg === 'front' ? 3 : -3, x = b.x + Math.cos(a) * k, y = b.y + Math.sin(a) * k;
    go = clock(4); while (go() && M.Cn === Cn && Cn.st === 'wind') { await frame(); hold(); pin(x, y); } const g2 = clock(0.3); while (g2()) { await frame(); hold(); } return { started: true, hit: M.stat.coneHit - s0.h, miss: M.stat.coneMiss - s0.m };`, mode);
  await force('cone'); let cn = cone('front'); await until('M.Cn && M.Cn.st === "wind" && M.Cn.t > 0.9', 4); await shot('cone-wind'); await until('M.Cn && M.Cn.st === "strike"', 3); await shot('cone-strike'); cn = await cn; console.log('  cone front', JSON.stringify(cn));
  ok(cn.started && cn.hit === 1, `${id}: the WING CONE strikes a pet in front of it`);
  await rest(); await force('cone'); cn = await cone('behind'); console.log('  cone behind', JSON.stringify(cn)); ok(cn.started && cn.hit === 0 && cn.miss === 1, `${id}: behind it the pet is safe`);
  await rest();
  // phase two's cycle: horn phrases sung from the floor, the cone between them, leaps with their landings
  acts = await ev(`const seen = new Set(); const s0 = { ...M.stat }; const go = clock(60); while (go()) { await frame(); hold(); if (b.hp < b.maxhp * 0.2) b.hp = b.maxhp * 0.4; seen.add(b.act); if (M.P) { const s = M.P.steps.find(q => !q.done); if (s) { const p = shelterSpot(s.i); pin(p.x, p.y); } } else if (Math.hypot(me.x - b.x, me.y - b.y) > 9) pin(b.x + 3, b.y + 3); if (seen.has('antiphon') && seen.has('cone') && seen.has('leap') && M.stat.phrases > s0.phrases) break; } return { acts: [...seen], g: +M.g.toFixed(2), phrases: M.stat.phrases - s0.phrases, cones: M.stat.cones - s0.cones, leaps: M.stat.leaps - s0.leaps };`);
  console.log('  acts p2', JSON.stringify(acts)); ok(['antiphon', 'cone', 'leap'].every(a => acts.acts.includes(a)) && !acts.acts.includes('hang'), `${id}: phase two on the floor: horn phrases, the wing cone between them, leaps (${acts.acts.join(', ')})`);
  await rest(); await force('antiphon'); await until('M.P && M.P.t > 1.6', 5); await shot('floor-antiphon'); await rest();
  await force('leap'); await until('M.Lp && M.Lp.st === "fly" && M.Lp.t > 0.35', 4); await shot('leap'); await rest();

  const e1 = errors.length; ok(e1 === 0, `${id}: no page errors (${e1})`); if (e1) console.log(errors.slice(0, 6).join('\n'));
  // the kill (a section boss: it ends the stage without sealing the rift)
  await ev(`pin(mod.arch.hang.x + 2.5, mod.arch.hang.y + 5);`);
  const kill = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, ban = new Set(); D.g.boss.under = false; D.hitMon(D.g.boss, 1e12, { pierce: true }); const t0 = performance.now(); let st = []; while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); D.banners.forEach(x => ban.add(x.s)); const E = D.FD.FX.mem.end; if (E && st[st.length - 1] !== E.st) st.push(E.st); if (E && E.st === 'fall' && E.t0 > 0.25) break; } return { banners: [...ban], end: !!D.FD.FX.mem.end, st }; });
  await shot('death-fall');
  const k2 = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg, P = window.__pp, t0 = performance.now(); while (performance.now() - t0 < 30000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); const E = D.FD.FX.mem.end; if (E && E.st === 'fold' && E.t0 > 1.6) break; } const M = D.FD.FX.mem; return { st: M.end && M.end.st, shroud: +(M.shroud || 0).toFixed(2), dead: +(M.dead || 0).toFixed(2) }; });
  await shot('death-shroud');
  const fin = await page.evaluate(async () => { const P = window.__pp, D = P.arc.game._dbg, ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < 60000 && P.arc.state !== 'end') { await new Promise(r => requestAnimationFrame(r)); if (D && D.banners) D.banners.forEach(x => ban.add(x.s)); } return { state: P.arc.state, banners: [...ban], sealed: !!P.riftState().seals.choir }; });
  console.log('  kill', JSON.stringify(kill), JSON.stringify(k2), JSON.stringify(fin));
  ok(kill.end && kill.st.includes('return') && kill.st.includes('fall'), `${id}: the kill: it claws back to its arch, loses its grip and falls (${kill.st.join(' > ')})`);
  ok(k2.shroud > 0.8, `${id}: its wings fold over it (${k2.shroud})`);
  ok(fin.state === 'end', `${id}: the stage ends`); ok(!fin.sealed, `${id}: no sealing (a section boss)`);
  await page.waitForTimeout(400);
  console.log('errors', errors.length, errors.slice(0, 4)); ok(errors.length === 0, 'no page errors');
  console.log(fails ? fails + ' FAILED' : 'all passed'); await T.browser.close(); process.exit(fails ? 1 : 0);
})();
