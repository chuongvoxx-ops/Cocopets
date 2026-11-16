// Dead Scream (Dark Ult 'deadscream', 20k5k + its skull 20k5k2; v391 U4) cast on the GPU path and on the 2D fallback at
// evo 1 / 4 / 7 (7 s / 12 s at Adept / 20 s at Celestial): every scream pulse lands at its game time with its radius,
// damage and 0.32 s stun; the monsters in range are FEARED (they flee) and the one outside is not; the sparks' hits come to
// exactly ns per monster per pulse; the finisher lands at the end (4 x DK, kb 6, stun 0.6); the window and the effect's
// life are as before; the GPU path really draws the 3D skull, its effects and the burst's shards, the 2D one the old
// picture; the effect cleans up; no page errors. The game loop is driven by hand (1/60 s steps), Math.random seeded so
// both paths (and a recording from another build, BASE=) see the same game.
// usage: HTML=test-u4.html node tests/_ult-deadscream.js     env: EVOS=1,4,7  PATHS=gpu,2d  OUT=rec.json  BASE=rec.json
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const EVOS = (process.env.EVOS || '1,4,7').split(',').map(Number), PATHS = (process.env.PATHS || 'gpu,2d').split(',');
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && /Dead Scream|GLM|GFX|shader/i.test(m.text())) errors.push('console: ' + m.text().slice(0, 400)); });
  await page.addInitScript(() => { window.__NG_GL = 0; window.__DS_GL = 0; });
  let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 120000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Scream'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 30; P.st.dlv = 30; });
  async function fresh() {
    await page.evaluate(() => { const P = window.__pp; P.arc.paused = false; try { if (P.arc.state !== 'idle') P.closeArcade(); } catch (e) {} P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(3, 11); });
    await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 400000 });
    await page.evaluate(() => { const P = window.__pp; P.beginPlay(); P.arc.paused = true; const G = P.arc.game; for (let k = 0; k < 150; k++) G.update(1 / 60); });
  }
  async function cast(evo, gpu) {
    await fresh();
    return page.evaluate(([evo, gpu]) => {
      const P = window.__pp, G = P.arc.game, D = G._dbg, me = D.me, g = D.g; P.arc.paused = true;
      window.__NG_GL = gpu ? 1 : 0; window.__DS_GL = gpu ? 1 : 0; window.__DS_GLQ = 0.2; window.__DS_MESHH = 0.07; if (gpu) P.ELEM_IMPL.dark.ult.deadscream.skull.prepare(1e9);   // (the model built beforehand: in the game it builds a few ms a frame while the smoke gathers)   // (a software rasteriser: the skull rendered small, and drawn now and then below)
      for (const f of D.ELEM.fx) f.life = 0; for (let k = 0; k < 10; k++) G.update(1 / 60);
      const Wk = (x, y) => D.walkAt(Math.floor(x), Math.floor(y)) && !D.blocked(x, y, 0.5, 0);
      if (!window.__spot) { let best = null; for (let k = 0; k < 1500; k++) { const sx = me.x + (Math.random() - 0.5) * 34, sy = me.y + (Math.random() - 0.5) * 34; if (!Wk(sx, sy)) continue; let L = 0; while (L < 8 && Wk(sx + L, sy) && Wk(sx - L, sy) && Wk(sx, sy - L * 0.7) && Wk(sx, sy + L * 0.7)) L += 0.25; if (!best || L > best.L) best = { x: sx, y: sy, L }; } window.__spot = best || { x: me.x, y: me.y, L: 0 }; }
      me.x = window.__spot.x; me.y = window.__spot.y; me.hp = D.ST.hp; me.dead = false; me.mp = 999; g.cdU = 0; g.intro = 0; g.bossIntro = 0; me.face = 1;
      const live = D.mons.filter(m => !m.boss); if (live.length < 4) return { err: 'monsters ' + live.length };
      for (const m of D.mons) if (!m.boss) { m.dead = true; m.x = me.x + 80; m.y = me.y + 80; }
      const R = 3.0 + 0.27 * (evo - 1);   // (K = 1: the ability is not upgraded)
      const place = [[1.6, 0.2], [-2.2, 0.8], [0.4, -(R - 0.75)], [R + 2.6, 0.3]], tags = ['near', 'mid', 'edge', 'outside'];
      const M = live.slice(0, 4).map((m, i) => Object.assign(m, { dead: false, type: 'blob', x: me.x + place[i][0], y: me.y + place[i][1], hp: 1e9, maxhp: 1e9, still: false, spd: 0, atkCd: 99, dmg: 0, freeze: 0, stun: 0, chill: 0, burn: 0, venom: 0, falling: null, under: false, z: 0, lifted: false, kbx: 0, kby: 0, shield: 0, block: 0, guardFn: null, elite: false, affixes: null, fearT: 0, _tag: tags[i] }));
      const mv = P.ELEM_LIST.dark.ey_deadscream, ab = Object.assign(P.elemAbility(mv, 'ult', P.st), { star: 6, mult: 1.2, cost: 0, cd: 0, tier: 1, evo, sig: false });
      D.setKit('ult', ab);
      // (seeded: the same game on both paths and in another build)
      const R0 = Math.random; let sd = 12345 + evo; Math.random = () => { sd = (sd * 1664525 + 1013904223) >>> 0; return 0.08 + 0.92 * sd / 4294967296; };
      const X = D.ELEM.H.X, h0 = X.hitArea, m0 = X.hitMon, log = [], spk = []; let t0 = 0, base = null, F = null, lastFt = 0; const ft = () => F ? F.t : -1;   // (times on the effect's own clock: the cast's wind-up and hitstops shift the game clock)
      X.hitArea = (x, y, r, dmg, o) => { const n = h0(x, y, r, dmg, o); log.push({ t: +ft().toFixed(4), r: +r.toFixed(4), dmg, kb: o && o.kb, stun: o && o.stun, el: o && o.el, n }); return n; };
      X.hitMon = (m, dmg, o) => { spk.push({ t: +ft().toFixed(3), tag: m._tag, dmg }); return m0(m, dmg, o); };
      const ctx = P.arc.ctx || document.getElementById('arcCanvas').getContext('2d');
      const fear = {}, stun = {}, fled = {}; for (const m of M) { fear[m._tag] = 0; stun[m._tag] = 0; fled[m._tag] = 0; }
      let switched = 0, frames = 0, drawErr = null, lifeAt = null, dbg = null, maxShards = 0, gpuFrames = 0, d2Frames = 0, skull = null;
      const Wn = [7, 8.5, 10, 12, 14.5, 17, 20][evo - 1], LIFE = 1.1 + Wn + 0.5 + 2.0, every = gpu ? 60 : Wn > 12 ? 5 : 3;
      try {
        t0 = g.t; const nfx = D.ELEM.fx.length; D.useUlt(); F = D.ELEM.fx[nfx] || null;
        for (let k = 0; k < Math.ceil((LIFE + 3) * 60); k++) { if (!F && D.ELEM.fx.length > nfx) F = D.ELEM.fx[nfx]; if (F && D.ELEM.fx.indexOf(F) < 0 && lifeAt == null) { lifeAt = +lastFt.toFixed(3); break; } if (F) lastFt = F.t;
          const px = M.map(m => [m.x, m.y]); me.inv = 1; me.hp = Math.max(me.hp, D.ST.hp * 0.5); me.dead = false;
          G.update(1 / 60);
          // (the GPU lost in the middle of the cast (as a lost context does): the frames go to the original 2D picture, then back)
          if (gpu && F && F.t > 4 && F.t < 4.2 && k % 4 === 0) { window.__DS_GL = 0; try { G.draw(ctx); if (F.dbg && !F.dbg.gpu) switched++; } catch (e) { drawErr = 'fallback: ' + String(e && e.stack || e).slice(0, 400); } window.__DS_GL = 1; }
          for (const m of M) { fear[m._tag] = Math.max(fear[m._tag], m.fearT || 0); if (m.stun > 0) stun[m._tag] = Math.max(stun[m._tag], m.stun); }
          M.forEach((m, i) => { const d0 = Math.hypot(px[i][0] - me.x, px[i][1] - me.y), d1 = Math.hypot(m.x - me.x, m.y - me.y); if (d1 > d0 + 1e-6 && m.fearT > 0) fled[m._tag]++; m.x = px[i][0]; m.y = px[i][1]; });   // (it stepped away while afraid: put back, so the next pulses find it)
          if (k % every === 0 || (F && F.t > Wn + 1.55 && F.t < Wn + 2.6 && k % (gpu ? 15 : 2) === 0)) { try { G.draw(ctx); frames++; if (F && F.dbg) { dbg = F.dbg; if (dbg.gpu) gpuFrames++; else d2Frames++; if (dbg.shards > maxShards) maxShards = dbg.shards; if (dbg.skull) skull = dbg.skull; } } catch (e) { drawErr = String(e && e.stack || e).slice(0, 500); break; } }
        }
        base = (log[0] && log[0].dmg) || 1;
      } finally { Math.random = R0; X.hitArea = h0; X.hitMon = m0; }
      return { switched, evo, gpu, log, spk, fear, stun, fled, frames, gpuFrames, d2Frames, maxShards, skull, drawErr, fxLeft: F && D.ELEM.fx.indexOf(F) >= 0 ? 1 : 0, lifeAt, Wn };
    }, [evo, gpu]);
  }
  const rec = {};
  for (const evo of EVOS) for (const pth of PATHS) {
    const gpu = pth === 'gpu', r = await cast(evo, gpu), k = evo + pth; rec[k] = r;
    if (r.err) { ok(false, k + ' cast', r.err); continue; }
    const ADE = evo >= 4, CEL = evo >= 7, NS = CEL ? 3 : ADE ? 2 : 1, Wn = r.Wn, NP = Math.floor((Wn - 0.3) / 0.5) + 1, TOTk = [14, 16.7, 19.3, 22, 25.3, 28.7, 32][evo - 1];
    const pulses = r.log.filter(h => h.stun === 0.32), finl = r.log.filter(h => h.kb === 6), PD = pulses.length ? pulses[0].dmg : 0, DK = PD * NP / (TOTk * 0.8);
    console.log(k, JSON.stringify({ pulses: pulses.length, first: pulses[0], fin: finl[0], frames: r.frames, gpuFrames: r.gpuFrames, d2: r.d2Frames, shards: r.maxShards, skull: r.skull, life: r.lifeAt, fear: r.fear, fled: r.fled, sparks: r.spk.length }));
    ok(!r.drawErr, k + ': frames drawn without errors', r.drawErr || r.frames);
    ok(pulses.length === NP && pulses.every((h, i) => Math.abs(h.t - (1.4 + 0.5 * i)) < 1 / 60 + 1e-3), `${k}: ${NP} scream pulses, one every 0.5 s from 1.4 s (window ${Wn} s)`, pulses.map(h => h.t).slice(0, 4).concat(['..', (pulses[pulses.length - 1] || {}).t]));
    ok(pulses.every(h => Math.abs(h.r - (3.0 + 0.27 * (evo - 1))) < 1e-3 && Math.abs(h.dmg - PD) < 1e-6 && h.el === 'dark') && pulses.slice(0, 3).every(h => h.n === 3), k + ': each pulse: radius 3 + 0.27 per evo, the same damage, Dark, stun 0.32, the three monsters in range hit', pulses[0]);
    ok(finl.length === 1 && Math.abs(finl[0].t - (1.1 + Wn + 0.5)) < 1 / 60 + 1e-3 && Math.abs(finl[0].dmg / DK - 4) < 1e-6 && finl[0].stun === 0.6 && Math.abs(finl[0].r - (3.0 + 0.27 * (evo - 1)) * 1.15) < 1e-3, k + ': the finisher: once, at the end (' + (1.1 + Wn + 0.5).toFixed(1) + ' s), 4 x DK, kb 6, stun 0.6, radius x 1.15', finl[0]);
    const byTag = t => r.spk.filter(s => s.tag === t), SPK = TOTk * 0.2 * DK / (NP * NS);
    ok(['near', 'mid', 'edge'].every(t => byTag(t).length === NP * NS && byTag(t).every(s => Math.abs(s.dmg - SPK) < 1e-6)) && byTag('outside').length === 0, k + `: the sparks: exactly ${NS} a pulse on each monster in range (${NP * NS} each), none outside; pulses + sparks = ${TOTk} x DK`, ['near', 'mid', 'edge', 'outside'].map(t => byTag(t).length));
    ok(['near', 'mid', 'edge'].every(t => r.fear[t] > 0.9 && r.stun[t] > 0.2) && ['near', 'mid', 'edge'].filter(t => r.fled[t] > 0).length >= 2 && r.fear.outside === 0 && r.stun.outside === 0, k + ': the monsters in range are feared (they flee, where the walls let them) and stunned; the one outside is not', { fear: r.fear, fled: r.fled, stun: r.stun });
    ok(r.fxLeft === 0 && Math.abs(r.lifeAt - (1.1 + Wn + 2.5)) < 0.04, k + ': the effect lasts its life (' + (1.1 + Wn + 2.5).toFixed(1) + ' s) and cleans up', { left: r.fxLeft, at: r.lifeAt });
    if (gpu) ok(r.switched > 0, k + ': with the GPU gone mid-cast, the frames fall back to the original 2D picture without errors', r.switched);
    if (gpu) ok(r.gpuFrames > 0 && r.d2Frames === 0 && r.skull && r.skull.ready && r.skull.tris > 8000 && r.maxShards > 10, k + ': drawn on the GPU: the 3D skull (built; the coarse test mesh), then the burst\'s bone shards', { frames: r.gpuFrames, shards: r.maxShards, skull: r.skull });
    else ok(r.d2Frames > 0 && r.gpuFrames === 0, k + ': drawn by the original 2D picture', { d2: r.d2Frames });
  }
  
  // (the GPU and 2D casts: drawing more or fewer frames draws more or fewer of the game's own random numbers, so the sparks are compared by monster and pulse)
  const sigA = r => { const u = (r.log[0] && r.log[0].dmg) || 1; return JSON.stringify(r.log.map(h => [h.t, h.r, +(h.dmg / u).toFixed(6), h.kb, h.stun, h.el, h.n])); };
  const sigS = r => { const u = (r.log[0] && r.log[0].dmg) || 1, P = {}; for (const x of r.spk) { const k = x.tag + ':' + Math.floor((x.t - 1.4) / 0.5 + 1e-6) + ':' + (+(x.dmg / u).toFixed(6)); P[k] = (P[k] || 0) + 1; } return JSON.stringify(Object.keys(P).sort().map(k => [k, P[k]])); };
  for (const evo of EVOS) { const a = rec[evo + 'gpu'], b = rec[evo + '2d']; if (!a || !b || a.err || b.err) continue; ok(sigA(a) === sigA(b) && sigS(a) === sigS(b), `evo ${evo}: the GPU and 2D casts hit identically (every pulse and the finisher exactly; the same sparks on each monster in each pulse)`); }
  if (process.env.OUT) fs.writeFileSync(process.env.OUT, JSON.stringify(rec));
  if (process.env.BASE) { const B = JSON.parse(fs.readFileSync(process.env.BASE, 'utf8'));
    // (another build: the area hits exactly; the sparks by monster and by pulse (their flight times draw on the game's random stream, which other code shares, so a spark may land a frame or two apart))
    for (const k of Object.keys(rec)) { const b = B[k] || B[k.replace('gpu', '2d')]; if (!b || rec[k].err) continue; ok(sigA(rec[k]) === sigA(b) && sigS(rec[k]) === sigS(b), k + ': hits as the baseline build: every pulse and the finisher exactly (time, radius, damage, kb, stun, element, count); the same sparks on each monster in each pulse window, each the same damage'); } }
  ok(!errors.length, 'no page errors', errors.slice(0, 6)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await browser.close(); process.exit(bad ? 1 : 0);
})();
