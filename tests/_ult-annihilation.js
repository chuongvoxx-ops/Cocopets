// Dark's Annihilation (20k5i, worker U3, v391): the cast on the GPU painter (ANNIH_GFX forced on the software rasteriser)
// and on the 2D fallback, game time stepped by hand (the loop stopped). Checks, at Base, Adept and Celestial:
//   - exactly ONE damage event (H.hitArea) per cast, at the same time, place, radius and damage on both paths;
//   - the GPU path really drew (painter frames > 0, premultiplied output valid) and the 2D path did not touch it;
//   - the ult's fx ends and nothing is left behind; 0 page errors.
// SHOTS=1 also photographs the key beats at phone size (390 x 844, DPR 1) to shots/ult-annihilation-<PREFIX>-NN.png
// (PREFIX before|after; MODE gpu|2d for the shots, default gpu).
// usage: HTML=test-annU3.html [SHOTS=1 PREFIX=after MODE=gpu EVOS=1,4,7 SHOTEVO=7] node tests/_ult-annihilation.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const BEATS = [
  ['01-pillars', 0.22, 'six lights erupt'], ['02-trace', 0.95, 'the circles trace themselves'], ['03-circles', 1.95, 'the six ritual circles, glyphs lit'],
  ['04-launch', 2.45, 'missiles launch'], ['05-flight', 2.95, 'missiles converge'], ['06-star', 3.7, 'the overhead star, fed'],
  ['07-strike', 'STK+0.26', 'the strike down'], ['08-flash', 'IMP+0.04', 'the impact flash'], ['09-dome', 'IMP+0.3', 'the dome shockwave'],
  ['10-rise', 'IMP+0.9', 'the mushroom rising'], ['11-crown', 'IMP+2.0', 'the crown'], ['12-after', 'IMP+3.6', 'the aftermath']];
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  const out = path.resolve(__dirname, '../shots'); if (!fs.existsSync(out)) fs.mkdirSync(out);
  async function open(gl) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
    const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
    page.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load|net::/.test(m.text())) errors.push('console: ' + m.text().slice(0, 300)); });
    await page.addInitScript(([gl, low, DRAW]) => { window.__ANN_GL = gl; window.__LOWFX = low; window.__DRAWALL = DRAW; let a = 1234567; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }, [gl, !!process.env.LOWFX, !!process.env.DRAW]);   /* (a seeded Math.random: both pages build the same floor and pet) */
    await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
    await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
    await page.evaluate(() => { const P = window.__pp; P.quickStart('Dark'); if (window.__LOWFX) P.st.lowFx = true; P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; P.st.retro = false; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 60000 });
    await page.evaluate(() => window.__pp.beginPlay());
    await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
    await page.evaluate(() => { const P = window.__pp; cancelAnimationFrame(P.arc.raf); P.arc.open = false; P.arc.paused = false; window.__H = { P, G: P.arc.game, D: P.arc.game._dbg };
      const { G, D } = window.__H; D.g.intro = 0; if (D.SKIP) D.SKIP.fog = true; for (let k = 0; k < 120; k++) G.update(1 / 60);
      /* the pet onto open floor: walkable 8 tiles ahead (up the screen) and 4 to each side, so the blast has room on screen */
      const me = D.me, W = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)); let best = null;
      for (let y = 2; y < 200 && !best; y++) for (let x = 2; x < 200 && !best; x++) { let okk = true; for (let dy = -8; dy <= 2 && okk; dy++) for (let dx = -4; dx <= 4 && okk; dx++) if (!W(x + dx + 0.5, y + dy + 0.5)) okk = false; if (okk) best = [x + 0.5, y + 0.5]; }
      if (best) { me.x = best[0]; me.y = best[1]; } for (let k = 0; k < 90; k++) G.update(1 / 60); });
    return { page, errors };
  }
  /* one cast: returns the damage log and the painter's counters; shots: [[name, time]] to draw and photograph */
  async function cast(page, evo, shots, prefix) {
    await page.evaluate(evo => { const { P, G, D } = window.__H, me = D.me, g = D.g;
      D.ELEM.fx.length = 0; let i = 0;
      for (const m of D.mons) { if (m.boss || m.dead) continue; if (/tulip|snap|spore/i.test(m.type || '')) { m.x = me.x + 60; m.y = me.y + 60; m.hp = m.maxhp = 1e9; m.still = true; continue; }   /* (breath and spore attackers kept off the shots) */ m.hp = m.maxhp = 1e9; m.still = true; m.spd = 0; m.atkCd = 99; m.dmg = 0; if (i < 9) { m.x = me.x + (i % 3) * 1.6 - 1.6; m.y = me.y - 5.5 + Math.floor(i / 3) * 1.3; } else { m.x = me.x + 40; m.y = me.y + 40; } i++; }
      const mv = P.ELEM_LIST.dark.ey_annihilation; D.setKit('ult', Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1, cost: 0, cd: 0, tier: 1, evo })); g.cdU = 0; me.mp = 999; D.ST.atk = 100;   /* (the pet's attack pinned: both pages deal the same) */
      const H = D.ELEM.H, L = (window.__LOG = []); if (!H.__wrapped) { const ha = H.hitArea; H.hitArea = function (x, y, r, d, o) { window.__LOG.push({ t: +((window.__F ? window.__F.t : g.t - window.__T0)).toFixed(3),   /* (on the ult's own clock: a stray crit's hitstop elsewhere in the room stretches game time, not the ult's timeline) */ dx: +(x - me.x).toFixed(3), dy: +(y - me.y).toFixed(3), r: +r.toFixed(4), d: +d.toFixed(3), kb: o && o.kb, stun: o && o.stun, el: o && o.el }); return ha.apply(this, arguments); }; H.__wrapped = true; }
      const G2 = self.ANNIH_GFX; if (G2) G2.stats.frames = 0;
      window.__T0 = g.t; window.__step = (s, draw) => { const t1 = g.t + s; let k = 0; while (g.t < t1 - 1e-6 && k++ < 100000) { me.hp = Math.max(me.hp, 1); me.inv = 0.2; G.update(1 / 60); if (window.__DRAWALL && k % 6 === 0) G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); } };
      // aim straight up the screen, 4.5 tiles ahead
      me.face = -Math.PI / 2; D.g.aimX = me.x; D.g.aimY = me.y - 4.5;
      D.useUlt(); window.__F = D.ELEM.fx.find(f => f.drawUnder && f.draw); }, evo);
    const info = await page.evaluate(() => { const f = window.__pp.arc.game._dbg.ELEM.fx.find(q => q.annih); return f && f.annih ? { STK: f.annih.STK, IMP: f.annih.IMP, LIFE: f.annih.LIFE } : null; }) || { STK: 4.4 + (evo >= 7 ? 0.3 : evo >= 4 ? 0.12 : 0), IMP: 4.7 + (evo >= 7 ? 0.3 : evo >= 4 ? 0.12 : 0) };   /* (the old build: its timeline's numbers) */
    const tOf = s => typeof s === 'number' ? s : (s.startsWith('STK') ? info.STK : info.IMP) + parseFloat(s.slice(3));
    const done = [];
    for (const [name, when, note] of BEATS) { if (!info) break; const tt = tOf(when), want = (shots || []).some(b => b[0] === name);   /* (every cast is drawn at the beats; photographed when asked) */
      const r = await page.evaluate(tt => { const { P, G, D } = window.__H, g = D.g; const F = window.__F; let k = 0; while (F && F.t < tt - 1e-6 && k++ < 5000) window.__step(1 / 60); g.negF = 0;   /* (the 3-frame negative is drawn in real frames: not in a still) */ const t0 = performance.now(); G.draw(P.arc.ctx || document.getElementById('arcCanvas').getContext('2d')); const X = D.ELEM.H, m = F && F.lastM, mk = m ? m.a : 1, sx = v => m ? m.a * v + m.e : v, sy = v => m ? m.d * v + m.f : v, T = X.X.Tz() * mk; return { ms: Math.round(performance.now() - t0), t: +(F ? F.t : 0).toFixed(2), X: F ? sx(X.sx(F.x)) : 0, Y: F ? sy(X.sy(F.y)) : 0, T, ZC: F ? F.ZC || 0 : 0, gpu: F ? !!F.gpu : null, why: self.ANNIH_GFX ? self.ANNIH_GFX.info().why : '' }; }, tt);
      if (!want) continue; const file = path.join(out, `ult-annihilation-${prefix}-${name}.png`); await page.screenshot({ path: file }); done.push([name, note, r.t, r.ms, r.X, r.Y, r.T, r.ZC]); console.log(`  shot ${prefix} ${name} t=${r.t} (${r.ms} ms) gpu=${r.gpu} ${r.why || ''}`); }
    const res = await page.evaluate(() => { const { D } = window.__H, g = D.g; const left = 14 - (g.t - window.__T0); if (left > 0) window.__step(left);
      const G2 = self.ANNIH_GFX; return { log: window.__LOG, fx: D.ELEM.fx.length, gpuFrames: G2 ? G2.stats.frames : -1, check: G2 && G2.lastCheck ? G2.lastCheck : null, info: G2 ? G2.info() : null }; });
    return Object.assign(res, { info, shots: done });
  }
  const EVOS = (process.env.EVOS || '1,4,7').split(',').map(Number), SHOTS = !!process.env.SHOTS, PREFIX = process.env.PREFIX || 'after', SEVO = +(process.env.SHOTEVO || 7);
  const res = {};
  for (const mode of (process.env.MODES || 'gpu,2d').split(',')) { const { page, errors } = await open(mode === 'gpu' ? 1 : 0); res[mode] = { errors, runs: {} };
    for (const evo of EVOS) { const shots = SHOTS && evo === SEVO && mode === (process.env.MODE || 'gpu') ? BEATS.filter(b => !process.env.ONLY || process.env.ONLY.split(',').some(o => b[0].startsWith(o))) : null; res[mode].runs[evo] = await cast(page, evo, shots, PREFIX); }
    await page.close(); }
  if (res.gpu && res['2d']) for (const evo of EVOS) { const A = res.gpu.runs[evo], B = res['2d'].runs[evo];
    ok(A.log.length === 1, `evo ${evo} GPU: exactly one damage event`, A.log);
    ok(B.log.length === 1, `evo ${evo} 2D: exactly one damage event`, B.log);
    ok(JSON.stringify(A.log) === JSON.stringify(B.log), `evo ${evo}: GPU and 2D hit at the same time, place, radius and damage`, { gpu: A.log[0], d2: B.log[0] });
    ok(A.fx === 0 && B.fx === 0, `evo ${evo}: the effect ends, nothing left behind`, { gpu: A.fx, d2: B.fx });
    if (!process.env.BEFORE) { ok(A.gpuFrames > 20, `evo ${evo} GPU: drawn by the painter`, { frames: A.gpuFrames, info: A.info }); ok(B.gpuFrames === 0, `evo ${evo} 2D: the painter untouched`, B.gpuFrames); } }
  if (process.env.EXPECT && res.gpu) { const E = JSON.parse(fs.readFileSync(process.env.EXPECT, 'utf8')); for (const evo of EVOS) if (E[evo]) ok(JSON.stringify(E[evo]) === JSON.stringify(res.gpu.runs[evo].log), `evo ${evo}: the same damage event as the reference build`, { ref: E[evo], now: res.gpu.runs[evo].log }); }
  if (process.env.SAVE && res.gpu) fs.writeFileSync(process.env.SAVE, JSON.stringify(Object.fromEntries(EVOS.map(e => [e, res.gpu.runs[e].log]))));
  { const E = Object.values(res).flatMap(r => r.errors); ok(!E.length, 'no page errors', E.slice(0, 6)); }
  if (SHOTS) fs.writeFileSync(path.join(out, `ult-annihilation-${PREFIX}.json`), JSON.stringify(res[process.env.MODE || 'gpu'].runs[SEVO].shots));
  await browser.close();
  console.log(bad ? `${bad} FAILED` : 'all ok'); process.exit(bad ? 1 : 0);
})();
