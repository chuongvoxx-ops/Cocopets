// Susano O's robot Jump (A, round 5; the scaffolding is H's tests/susanoo.js): one landing hit per monster, never a jump
// in mid-air (a press in the air goes at the touchdown), safe landings, the take-off protection at most every 1.8 s, and no
// Jump button or Jump in the airship.  usage: HTML=test-susA.html EVO=4 node tests/susanoo-jump.js
// (from H's header:) Susano O (Dark's 12th Ultimate): the spec's §14 verify list, as far as logic can check it, on the real game.
// usage: HTML=test-susH.html EVO=4 node tests/susanoo.js          (A's 20k5w core; E's 20k5x moves when present)
// Each scenario starts a fresh floor and casts Susano O from the pet's kit. Visual items (the model, the cockpit's
// readability, the transformation's collision-free paths, the effects' look) are checked by the montages, not here;
// they are listed as 'manual' at the end. Dark Messiah's damage rank is tests/ult-damage-rank.js.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const EVO = +(process.env.EVO || 4);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (m.type() === 'warning' && /Susano|Messiah/.test(m.text())) errors.push('console: ' + m.text()); });
  let bad = 0, n = 0; const ok = (c, m, x) => { n++; console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 90000 }); await page.waitForTimeout(300);
  // ---- the roster (§14: the Dark Ultimate list keeps its earlier entries; Susano O is the 12th) ----
  const ros = await page.evaluate(() => { const P = window.__pp, U = P.ELEM_MOVES.dark.ult; return { n: U.length, i: U.findIndex(r => r[0] === 'susanoo'), keys: U.map(r => r[0]), cd: (U.find(r => r[0] === 'susanoo') || [])[4], impl: typeof P.ELEM_IMPL.dark.ult.susanoo, SM: typeof self.SUSANOO_MOVES === 'object' ? Object.keys(self.SUSANOO_MOVES) : null }; });
  ok(ros.i === 11 && ros.keys[10] === 'dayofthedead', 'Susano O is the 12th Dark Ultimate, after Day of the Dead (earlier entries unchanged)', { i: ros.i, n: ros.n });
  ok(ros.cd === 240, 'its outer cooldown in the roster is 240 s', ros.cd);
  ok(ros.impl === 'function', 'U.susanoo is implemented');
  console.log('E\'s moves:', ros.SM ? ros.SM.join(',') : 'absent (A\'s stubs run)');
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Sus'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
  /* a scenario: a fresh floor, monsters placed round the pet (sturdy, rooted), Susano O cast; fn runs in the page with
     helpers: step(s, each), S (the session), D, ctx hit log */
  async function scen(name, body, arg) {
    await page.evaluate(() => { const P = window.__pp; P.arc.paused = false; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 20000 });
    await page.evaluate(() => window.__pp.beginPlay());
    return page.evaluate(([evo, src, arg]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; P.arc.paused = true;
      for (let k = 0; k < 120; k++) G.update(1 / 60);
      const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
      for (let k = 0; k < 1500; k++) { const sx = me.x + (Math.random() - 0.5) * 34, sy = me.y + (Math.random() - 0.5) * 34; if (!W(sx, sy)) continue; let L = 0; while (L < 7 && W(sx + L, sy) && W(sx - L, sy) && W(sx, sy - L * 0.7) && W(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; }
      if (best) { me.x = best.x; me.y = best.y; }
      const spots = [[2.6, 0], [3.4, 1.2], [3.0, -1.4], [4.6, 0.4], [-2.8, 0.8], [0.6, 3.0]]; let i = 0;
      for (const m of D.mons) { if (m.boss) continue; if (i < spots.length) { let px = me.x + spots[i][0], py = me.y + spots[i][1]; for (let k = 0; k < 40 && !W(px, py); k++) { px = me.x + spots[i][0] * (1 - k / 40) + Math.cos(k) * 0.3; py = me.y + spots[i][1] * (1 - k / 40) + Math.sin(k) * 0.3; } spots[i] = [px - me.x, py - me.y]; } if (i < spots.length) Object.assign(m, { dead: false, x: me.x + spots[i][0], y: me.y + spots[i][1], hp: 1e8, maxhp: 1e8, still: true, spd: 0, atkCd: 99, dmg: 0, stun: 0, freeze: 0, falling: null, under: false, _tag: 'm' + i }); else Object.assign(m, { dead: true, x: me.x + 90 }); i++; }
      me.hp = D.ST.hp; me.mp = 999; me.dead = false; g.intro = 0; g.bossIntro = 0; g.cdU = 0;
      const kit0 = { s: D.KITR.strong && D.KITR.strong.key, s2: D.KITR.strong2 && D.KITR.strong2.key, d: D.KITR.dodge && D.KITR.dodge.key };
      const mv = P.ELEM_LIST.dark.ey_susanoo; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo }));
      const H = { P, G, D, me, g, kit0, log: [], hold: null };
      H.step = (s, each) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 6000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); if (each && each() === true) break; } };
      H.until = (fn, cap) => { const t1 = g.t + (cap || 10); let k = 0; while (!fn() && g.t < t1 && k++ < 9000) { if (!H.mortal) { me.inv = 1; me.hp = Math.max(me.hp, 1); } G.update(1 / 60); } return fn(); };
      H.S = () => g._susanoo;
      H.wrap = () => { const S = H.S(), X = S.X; if (X.__w) return; X.__w = 1; const h0 = X.hitMon; X.hitMon = (m, d, o) => { const r = h0(m, d, o); if (m && !m._tag) m._tag = 'n' + (H.nTag = (H.nTag || 0) + 1); const s2 = H.S(); H.log.push({ m: m && m._tag, d: r, nc: !!(s2 && s2.phase === 'messiah'), ph: s2 ? s2.phase : 'none', t: g.t }); return r; }; };   /* (every hit of the session, A's own Glides and Dive included; Dark Messiah's are the noCharge ones) */
      H.cast = () => { D.useUlt(); H.until(() => H.S() && H.S().phase === 'robot', 8); if (H.S()) H.wrap(); return H.S(); };
      H.labels = () => { const L = [], f0 = window.GFX_LABELS_PATCH; const GF = P.GFX, l0 = GF.labelS; GF.labelS = (c, s) => { L.push(String(s)); }; try { const cv = document.createElement('canvas'); cv.width = 400; cv.height = 900; const c = cv.getContext('2d'); const pic = (k, w, h, paint) => { const q = document.createElement('canvas'); q.width = Math.max(1, w | 0); q.height = Math.max(1, h | 0); try { paint(q.getContext('2d'), q.width, q.height); } catch (e) {} return q; };
        D.VEH.drawBtns(c, { B: D.vehBtns(), blitC: () => {}, hudPic: pic, glowPic: () => pic('', 4, 4, () => {}), touchUI: true }); } finally { GF.labelS = l0; } void f0; return L; };
      H.face = a => { const S = H.S(); S.mx = Math.cos(a); S.my = Math.sin(a); const K = P.arc.keys; if (K) { K.right = Math.cos(a) > 0.5; K.left = Math.cos(a) < -0.5; K.down = Math.sin(a) > 0.5; K.up = Math.sin(a) < -0.5; } H.step(1 / 60); };
      H.release = () => { const K = P.arc.keys; if (K) K.right = K.left = K.up = K.down = false; };
      H.press = k => { if (k === 'ult') D.useUlt(); else if (k === 'dodge') D.dodge(); else D.useStrong(k); };
      return (new Function('H', 'arg', src))(H, arg);
    }, [EVO, body, arg === undefined ? null : arg]);
  }
  const R = async (name, body, arg) => { try { return await scen(name, body, arg); } catch (e) { ok(false, name + ': ' + e.message.split('\n')[0]); return null; } };

  const J = await R('jump', `
    const { D, g, G, me } = H, S = H.cast(); const out = {}; const jump = () => G.key('carjump', true);
    out.lab1 = H.labels();
    // a jump at the line of monsters: one landing shockwave, one hit per monster in reach, it charges the meter
    H.face(0); H.release(); H.step(0.2); const c0 = S.charge, n0 = H.log.length, j0 = S.stats.jump || 0; jump(); out.started = (S.stats.jump || 0) - j0; out.inv0 = S.invT;
    H.until(() => !S.jump, 3); out.land1 = H.log.slice(n0).filter(h => h.ph === 'robot').map(h => h.m); out.chargeUp = S.charge > c0;
    out.safe1 = S.lastLand && D.walkAt(Math.floor(S.lastLand.x), Math.floor(S.lastLand.y)) && !D.blocked(S.lastLand.x, S.lastLand.y, 0.3, 0);
    // a press in mid-air: no jump in the air; it goes at the touchdown
    H.step(0.2); jump(); const invSecond = S.invT; const j1 = S.stats.jump; H.until(() => S.jump && S.jump.air, 1); const zUp = S.V.z; jump(); jump(); out.midAir = { during: S.stats.jump - j1, z: +zUp.toFixed(2) };
    H.until(() => !S.jump, 3); const afterLand = S.stats.jump - j1; H.step(0.05); out.midAir.afterLand = S.stats.jump - j1; out.midAir.atLand = afterLand; out.invChain = { inv0: out.inv0, inv1: invSecond, gap: +(g.t - out.inv0).toFixed(2) };
    H.until(() => !S.jump, 3); out.safe2 = !D.blocked(me.x, me.y, 0.3, 0) && D.walkAt(Math.floor(me.x), Math.floor(me.y));
    // jumps in eight directions from here: every landing on walkable ground, never in a wall or a gap
    const lands = []; for (let k = 0; k < 8; k++) { H.step(0.3); H.face(k * Math.PI / 4); jump(); H.release(); H.until(() => !S.jump, 3); const L = S.lastLand; lands.push(L ? (D.walkAt(Math.floor(L.x), Math.floor(L.y)) && !D.blocked(L.x, L.y, 0.3, 0)) : false); }
    out.lands = lands;
    // Transform, then the airship: no Jump button, and J does nothing
    H.step(0.4); D.useUlt(); H.until(() => S.phase === 'air', 12); H.step(0.5); out.lab2 = H.labels(); const j2 = S.stats.jump; jump(); H.step(0.5); out.air = { jumps: S.stats.jump - j2, jumping: !!S.jump, phase: S.phase };
    return out;`);
  const once = L => new Set(L).size === L.length;
  if (J) {
    ok(J.lab1.includes('JUMP'), 'robot: a JUMP button (above Glides)', J.lab1);
    ok(J.started === 1 && J.land1.length > 0 && once(J.land1) && J.chargeUp, 'a jump lands one dark shockwave: one hit per monster in reach, and it charges the meter', { land: J.land1, chargeUp: J.chargeUp });
    ok(J.safe1 && J.safe2, 'it lands on walkable ground, clear of walls');
    ok(J.midAir.during === 0 && J.midAir.afterLand === 1, 'no jump in mid-air: a press in the air goes at the touchdown', J.midAir);
    ok(J.invChain.inv1 === J.invChain.inv0, 'the take-off protection is not renewed by a second jump within 1.8 s', J.invChain);
    ok(J.lands.every(Boolean), 'jumps in eight directions all land on safe ground (never in a wall or a gap)', J.lands);
    ok(!J.lab2.includes('JUMP') && J.air.jumps === 0 && !J.air.jumping && J.air.phase === 'air', 'airship: no Jump button, and J does nothing', { lab: J.lab2, air: J.air });
  }
  ok(!errors.length, 'no page errors', errors.slice(0, 4));
  console.log(bad ? bad + ' of ' + n + ' FAILED' : 'all ' + n + ' ok'); await browser.close(); process.exit(bad ? 1 : 0);
})();
