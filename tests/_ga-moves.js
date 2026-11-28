// (v475 GA) Gabriel's fight: the 30.0 s rule (the entrance not counted), each power at each form against eight dummies (damage x P, heals,
// shields, marks), Grace Hearts and the shield capped, the mind (heals only a hurt pet, shields a pressed one, else attacks), no cooldowns,
// Eden Reborn once (its length, the heal / shield / cleanse, the marks), Gabriel leaving only after it, the clean-up (marks, Grace, shield
// share, ward, GPU buffers 0, repeated summons). GL off by default (GL=1: GABRIEL_GL + FGFX forced on SwiftShader).
// usage: HTML=test-ga.html node tests/_ga-moves.js [steps: life,powers,caps,mind,ult,clean,repeat]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const ONLY = process.argv[2] ? process.argv[2].split(',') : null, want = n => !ONLY || ONLY.includes(n), GL = !!process.env.GL;
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: [...(process.env.NOWEBGL ? ['--disable-3d-apis', '--disable-webgl'] : []), '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--js-flags=--expose-gc'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' ' + (e.stack || '').split('\n').slice(1, 3).join(' '))); page.on('console', m => { if ((m.type() === 'warning' || m.type() === 'error') && /Gabriel|GFX|GLM|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
  await page.addInitScript(gl => { window.__NG_GL = gl ? 1 : 0; window.__GB_GL = gl ? 1 : 0; let sd = 424242; window.__seed = v => { sd = v; }; Math.random = () => { sd = (sd * 16807) % 2147483647; return (sd - 1) / 2147483646; }; }, GL);
  await page.goto('file://' + path.resolve(process.env.HTML || 'test-ga.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { window.__seed(424242); const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = false; P.st.energy = 100; P.st.dun.best = 99; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 3); P.st.animas.eq = 'virgo'; P.st.animas.res = null; });
  await page.evaluate(() => { window.__seed(5151); window.__pp.dun.startDungeon(3, 5); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
  await page.evaluate(() => { window.__seed(6161); window.__pp.beginPlay(); });
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const setup = await page.evaluate(() => {
    const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, AN = D.AN; cancelAnimationFrame(P.arc.raf); window.__seed(7171); P.arc.open = false; P.arc.paused = false;
    for (let k = 0; k < 60; k++) G.update(1 / 60);
    if (!AN.kit) return 'no kit'; AN.kit.main.id = 'virgo'; AN.kit.main.k = 3; AN.kit.res = null; AN.kit.resonance = null; if (!AN.gb) return 'no module';
    D.SKIP.fog = true; D.g.intro = 0;
    const W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0); let best = null;
    for (let k = 0; k < 6000 && !best; k++) { const sx = me.x + (Math.random() - 0.5) * 50, sy = me.y + (Math.random() - 0.5) * 50; let ok = true; for (let dx = -6; dx <= 7 && ok; dx++) for (let dy = -4; dy <= 4 && ok; dy++) if (!W(sx + dx, sy + dy)) ok = false; if (ok) best = { x: sx, y: sy }; }
    if (best) { me.x = best.x - 3; me.y = best.y + 1.5; }
    const LAY = [[4.2, -0.4], [4.9, 0.3], [4.4, 0.9], [5.3, -0.6], [3.8, 0.4], [2.2, -2.4], [6.6, 2.0], [1.6, 2.2]];
    const mons = D.mons.filter(m => !m.boss).slice(0, 8); D.mons.filter(m => !mons.includes(m)).forEach(m => Object.assign(m, { dead: true, x: me.x + 300, y: me.y + 300 }));
    const place = () => mons.forEach((m, i) => Object.assign(m, { dead: false, x: me.x + LAY[i][0], y: me.y + LAY[i][1], hx: me.x + LAY[i][0], hy: me.y + LAY[i][1], hp: 1e7, maxhp: 1e7, still: false, spd: 0, atkCd: 99, dmg: 0, aggro: true, boss: false, gbJ: 0, gbJT: 0, kbx: 0, kby: 0, stunT: 0 }));
    place(); me.hp = D.ST.hp; Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
    const B = window.__GA = { G, D, P, AN, me, mons, place, hold: true, keepHp: true, atk: () => D.ST.atk };
    B.step = (sec, h) => { h = h || 1 / 60; const n = Math.round(sec / h); for (let k = 0; k < n; k++) { D.eshots.length = 0; for (let i = D.zones.length - 1; i >= 0; i--) if (D.zones[i].own === 'enemy') D.zones.splice(i, 1);   /* (the held dummies' own attacks and their zones: off, so only Gabriel's work is measured) */ for (const m of D.mons) m.atkCd = 99; if (B.keepHp) me.hp = D.ST.hp; D.g.normalT = 99; D.g.cdS = D.g.cdS2 = D.g.cdS3 = D.g.cdU = 99; G.update(h); if (B.hold) for (const m of mons) if (m.hx != null) { m.x = m.hx; m.y = m.hy; } } };
    B.dmg = () => mons.reduce((s, m) => s + (1e7 - Math.max(0, m.hp)), 0);
    return { summon: AN.summon(), atk: D.ST.atk, place: !!best };
  });
  console.log('setup', JSON.stringify(setup)); if (!setup || !setup.summon) { console.log(errors); await browser.close(); process.exit(1); }
  const fails = [], ok = (c, m) => { if (!c) fails.push(m); };
  const fresh = () => page.evaluate(() => { const { AN, D, step, place } = window.__GA; AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [], cine: null }); D.g.hitStop = 0; place(); AN.summon(); step(7); });
  if (want('life')) {
    const r = await page.evaluate(() => { const { AN, step, D } = window.__GA, a = AN.S.list[0]; let t = 0; const h = 1 / 60; while (!(a.gb && a.gb.ready) && t < 12) { step(h); t += h; }
      const atReady = +a.life.toFixed(3), entr = +t.toFixed(2); let f = 0; while (a.st === 'fight' && f < 40) { step(h); f += h; }
      return { entrance: entr, lifeAtReady: atReady, activeSec: +(a.gb.fightT || 0).toFixed(3), st: a.st, casts: a.gb.casts, dealtP: +(a.gb.dealt / (D.ST.atk * 3.6)).toFixed(1) }; });
    console.log('life', JSON.stringify(r)); ok(Math.abs(r.activeSec - 30) <= 1 / 60 + 1e-6, 'active not 30 s: ' + r.activeSec); ok(r.lifeAtReady === 30, 'life at ready');
    await fresh();
  } else await fresh();
  const castOne = (kind, k, hp) => page.evaluate(({ kind, k, hp }) => { const { AN, D, me, step, dmg, mons } = window.__GA, a = AN.S.list[0], M = AN.gb; if (!a) return 'no anima';
    a.k = k; a.life = 25; a.x = me.x - 1.2; a.y = me.y - 0.6; M.fx.length = 0; for (const m of mons) { m.gbJ = 0; m.gbJT = 0; } M.marks.clear(); me.gbGrace = 0; D.g.guardHP = 0; if (M.sanc) M.sanc.on = false;
    window.__GA.keepHp = hp == null; me.hp = D.ST.hp * (hp == null ? 1 : hp); me.chill = 6;
    const P = D.ST.atk * [0, 1.6, 2.5, 3.6][k], d0 = dmg(), h0 = me.hp, dealt0 = a.gb.dealt; M.cast(a, kind); const A = a.gb.act; let t = 0, maxSh = 0, end = -1, marks = 0;
    while (t < 12) { step(1 / 60); t += 1 / 60; maxSh = Math.max(maxSh, D.g.guardHP || 0); marks = Math.max(marks, mons.reduce((s, m) => s + (m.gbJ || 0), 0)); if (a.gb.act !== A && end < 0) { end = t; a.gb.gap = 1e9; } if (end >= 0 && t > end + 1.2) break; }
    a.gb.gap = 0; window.__GA.keepHp = true; const home = a.gb.P.every(p => p.mode === 'home');
    return { kind, k, len: +end.toFixed(2), xP: +((dmg() - d0) / P).toFixed(2), healPct: +((me.hp - h0) / D.ST.hp * 100).toFixed(1), shieldPct: +(maxSh / D.ST.hp * 100).toFixed(1), marks, grace: me.gbGrace || 0, chill: +me.chill.toFixed(2), petalsHome: home, sanct: !!(M.sanc && M.sanc.on) }; }, { kind, k, hp });
  if (want('powers')) { const R = {};
    for (const kind of ['bloom', 'harv', 'sanct', 'thr']) { R[kind] = []; for (const k of [1, 2, 3]) R[kind].push(await castOne(kind, k, kind === 'bloom' ? 0.3 : null)); console.log(kind, JSON.stringify(R[kind])); }
    ok(R.bloom.every(r => r.healPct > 10), 'bloom heals'); ok(R.bloom[0].chill > 0 && R.bloom[1].chill === 0, 'bloom cleanses from lv4 only'); ok(R.harv.every(r => r.xP > 0 && r.marks > 0), 'harvest hits and marks');
    ok(R.sanct.every(r => r.shieldPct > 0 && r.shieldPct <= 30.01), 'sanctuary shield within cap'); ok(R.thr[2].xP > R.thr[0].xP, 'thresher grows'); ok([].concat(...Object.values(R)).every(r => r.petalsHome), 'petals home after each power'); }
  if (want('mind') || want('caps')) await page.evaluate(() => { const B = window.__GA; if (!B.AN.S.list.length) console.log('gone'); const a = B.AN.S.list[0]; if (a) a.life = 25; });
  if (want('caps')) { const r = await page.evaluate(() => { const { AN, D, me } = window.__GA, M = AN.gb; for (let i = 0; i < 10; i++) M.addGrace(1); const g1 = me.gbGrace; const a = AN.S.list[0]; D.g.guardHP = 0; for (let i = 0; i < 6; i++) { M.cast(a, 'sanct'); window.__GA.step(1.6); } return { grace: g1, guard: +(D.g.guardHP / D.ST.hp).toFixed(3) }; });
    console.log('caps', JSON.stringify(r)); ok(r.grace === 3, 'grace cap'); ok(r.guard <= 0.301, 'shield cap'); }
  if (want('mind')) { const r = await page.evaluate(() => { const { AN, D, me, step } = window.__GA, a = AN.S.list[0], M = AN.gb, pick = () => { a.gb.act = null; a.gb.gap = 0; const c = M.choose(a); return c ? c.kind : null; }; const out = {};
      window.__GA.keepHp = false; me.hp = D.ST.hp; me.chill = 0; if (M.sanc) M.sanc.on = false; const n = {}; for (let i = 0; i < 40; i++) { const k = pick(); n[k] = (n[k] || 0) + 1; } out.healthy = n;
      me.hp = D.ST.hp * 0.3; out.hurt = pick(); me.hp = D.ST.hp * 0.95; for (let i = 0; i < 6; i++) { me.inv = 0; D.hurtPet(D.ST.hp * 0.04, null); } me.hp = D.ST.hp * 0.9; out.inc = +(M.inc / D.ST.hp).toFixed(3); out.pressed = pick(); out.opts = (a.gb.opts || []).map(o => o.kind + ':' + o.s.toFixed(2)).join(' '); window.__GA.keepHp = true; return out; });
    console.log('mind', JSON.stringify(r)); ok(!r.healthy.bloom && !r.healthy.sanct, 'no heal/shield on a healthy, unpressed pet'); ok(r.hurt === 'bloom', 'hurt pet: bloom'); ok(r.pressed === 'sanct', 'pressed pet: sanctuary'); }
  if (want('ult')) { await fresh(); const r = await page.evaluate(() => { const { AN, D, me, step, mons, dmg } = window.__GA, a = AN.S.list[0], M = AN.gb; a.life = 0.5; for (const m of mons) M.addMark(m, 2);
      let starts = 0; const U = M.ul, s0 = U.start; U.start = x => { starts++; return s0(x); }; window.__GA.keepHp = false; me.hp = D.ST.hp * 0.3; me.chill = 3; D.g.guardHP = 0; const d0 = dmg(); let t = 0, ulT = -1, hp1 = 0, sh = 0, left = -1;
      while (t < 30) { step(1 / 60); t += 1 / 60; if (U.active() && ulT < 0) ulT = t; if (ulT >= 0 && U.active()) { hp1 = Math.max(hp1, me.hp / D.ST.hp); sh = Math.max(sh, D.g.guardHP / D.ST.hp); } if (!AN.S.list.includes(a)) { left = t; break; } }
      window.__GA.keepHp = true; const P = D.ST.atk * 3.6; return { starts, ultAt: +ulT.toFixed(2), leftAt: +left.toFixed(2), ultLen: +(left - ulT).toFixed(2), maxHpPct: +(hp1 * 100).toFixed(0), shieldPct: +(sh * 100).toFixed(1), chill: me.chill, xP: +((dmg() - d0) / P).toFixed(1), cine: D.g.cineT, zoom: D.g.zoomP, marks: M.marks.size }; });
    console.log('ult', JSON.stringify(r)); ok(r.starts === 1, 'ult once'); ok(r.ultLen > 13 && r.ultLen < 16, 'ult length'); ok(r.maxHpPct >= 85, 'ult heal'); ok(r.shieldPct > 15, 'ult shield'); ok(r.cine === 0 && r.zoom === 1, 'camera restored'); }
  if (want('clean')) { const r = await page.evaluate(() => { const { AN, D, me, step } = window.__GA, M = AN.gb; step(2); const G = window.GABRIEL_GL; return { list: AN.S.list.length, fx: M.fx.length, marks: M.marks.size, grace: me.gbGrace || 0, sanc: !!M.sanc, shield: !!M.shield, gpu: G && G.gpuCount ? G.gpuCount() : null }; });
    console.log('clean', JSON.stringify(r)); ok(r.list === 0 && r.marks === 0 && !r.grace && !r.sanc && !r.shield, 'clean-up'); ok(!r.gpu, 'gpu buffers 0'); }
  if (want('repeat')) { const r = await page.evaluate(async () => { const { AN, step } = window.__GA, out = []; for (let i = 0; i < 3; i++) { AN.stop(); Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] }); window.__GA.place(); AN.summon(); step(8); const a = AN.S.list[0]; if (a) a.life = 0.2; step(18); step(2); if (window.gc) window.gc(); out.push({ heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e5) / 10 : null, gpu: window.GABRIEL_GL && window.GABRIEL_GL.gpuCount ? window.GABRIEL_GL.gpuCount() : null, list: AN.S.list.length }); } return out; });
    console.log('repeat', JSON.stringify(r)); }
  console.log('errors', JSON.stringify(errors.slice(0, 5))); console.log(fails.length ? 'FAIL ' + JSON.stringify(fails) : 'PASS'); await browser.close(); process.exit(fails.length || errors.length ? 1 : 0); })();
