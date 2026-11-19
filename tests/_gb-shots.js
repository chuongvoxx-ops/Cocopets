// v423 GB: the garden's second and third bosses in their fight, frame by frame: the intro, each attack's wind-up and strike, a
// hit, the stun, the second phase, the defeat -> <OUT>/<boss>-<tag>-d<DPR>-<moment>.png. Works on the HEAD build too (every
// attack forced through the fight's own pick: Math.random held for one step), so before and after are the same moments.
// The game is stepped between shots (its update called directly, 0.05 s a step), then drawn once.
// usage: HTML=test-gb.html TAG=after DPR=1 node tests/_gb-shots.js ambrel|calyx   env: GL (1: the GPU forced on the software
// rasteriser, 0: the 2D fallback), OUT (shots/v423-GB/raw), ONLY (comma list of moments)
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path'), fs = require('fs');
const boss = process.argv[2] || 'ambrel', DPR = +(process.env.DPR || 1), TAG = process.env.TAG || 'after', GL = process.env.GL !== '0', OUT = path.resolve(__dirname, '..', process.env.OUT || 'shots/v423-GB/raw'), ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null;
const ACTS = { ambrel: [['veil', 0.1, 1.0, 2.5], ['dive', 0.4, 0.75, 1.5], ['beam', 0.6, 0.8, 2.7], ['storm', 0.9, 0.5, 1.3]],
  calyx: [['whips', 0.1, 0.7, 1.35], ['rain', 0.4, 1.0, 2.1], ['bloom', 0.6, 0.6, 1.5], ['constrict', 0.9, 0.8, 1.6]] };
(async () => { fs.mkdirSync(OUT, { recursive: true }); const T0 = Date.now();
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-watchdog'] });
  const page = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: DPR, hasTouch: true }); const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.addInitScript(gl => { window.__GB_GL = gl ? 1 : 0; window.__GB_GLHQ = 1; window.__NG_GL = gl ? 1 : 0; }, GL);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-gb.html')); await page.waitForFunction(() => window.__pp, null, { timeout: 300000 }); await page.waitForTimeout(300);
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 22; P.riftState().seals.belfry = 1; P.st.dun.best = Math.max(P.st.dun.best || 0, 120); P.openMap(); P.dun.setMapTab('rift', true); });
  const idx = await page.evaluate(id => window.__pp.RIFT_BY_ID.garden.stages.findIndex(s => s.boss === id), boss);
  await page.evaluate(([idx]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.startRift('garden', idx); }, [idx]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 600000, polling: 1000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 600000, polling: 1000 });
  // step the game (no drawing), the pet kept alive and its frame-time watch cleared (a slow page must not lower the resolution)
  const step = (secs, keep) => page.evaluate(([secs, keep]) => { const P = window.__pp, D = P.arc.game._dbg; for (let i = 0; i < Math.round(secs / 0.05); i++) { if (D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } if (keep && D.g.boss) { D.me.x = D.g.boss.x + keep[0]; D.me.y = D.g.boss.y + keep[1]; } if (P.arc.state !== 'play' && P.arc.state !== 'end') break; P.arc.game.update(0.05); } P.arc.frames && (P.arc.frames.length = 0); }, [secs, keep || null]);
  const frame = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => { const P = window.__pp; if (P.arc.frames) P.arc.frames.length = 0; r(); }))));
  const shots = [];
  const shot = async name => { if (ONLY && !ONLY.includes(name)) return; await frame(); const f = path.join(OUT, `${boss}-${TAG}-d${DPR}-${name}.png`); await page.screenshot({ path: f }); shots.push(name); console.log('  shot', name, ((Date.now() - T0) / 1000).toFixed(0) + 's'); };
  const st = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; return { act: b && b.act, actT: b && +b.actT.toFixed(2), phase: D.FD && D.FD.S.phase, hp: b && +(b.hp / b.maxhp).toFixed(2), gl: !!(D.FD && D.FD.S.D.GB && D.FD.S.D.GB.gl && D.FD.S.D.GB.gl.on()) }; });
  // the intro: the pet near the sleeping boss
  await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss) || D.M.bossAt; D.me.x = b.x; D.me.y = b.y + 4.5; });
  await page.evaluate(() => { const P = window.__pp, D = P.arc.game._dbg; for (let i = 0; i < 200; i++) { const b = D.g.boss; if (b && b.act === 'enter' && D.FD && D.FD.S.enterT > 1.1) break; if (b && b.act !== 'enter') break; const t = b || D.M.bossAt; if (t) { D.me.x = t.x; D.me.y = t.y + 4.5; } P.arc.game.update(0.05); } });
  await shot('intro'); await step(4.0); console.log('  awake', JSON.stringify(await st()));
  for (const [k, r, tw, ts] of ACTS[boss]) { if (ONLY && !ONLY.some(o => o.startsWith(k))) continue;
    await step(1.6, [0.5, 4.8]);
    const ok = await page.evaluate(([r, k]) => { const P = window.__pp, D = P.arc.game._dbg, b = D.g.boss; b.act = 'circle'; b.actT = 99; b.stunT = 0; const R = Math.random; Math.random = () => r; try { P.arc.game.update(0.05); } finally { Math.random = R; } return b.act; }, [r, k]);
    if (ok !== k) console.log('  (forced', k, 'got', ok, ')');
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; D.me.x = b.x + 0.8; D.me.y = b.y + 4.6; });
    await step(tw - 0.05, [0.8, 4.6]); await shot(k + '-wind'); await step(ts - tw, [0.8, 4.6]); await shot(k + '-strike'); }
  if (!ONLY || ONLY.includes('hit')) { await step(1.5, [0.5, 4.8]); await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.hitMon(D.g.boss, 1000, { flat: true }); }); await step(0.1); await shot('hit'); }
  if (!ONLY || ONLY.includes('stun')) { await step(0.8);
    await page.evaluate(async id => { const D = window.__pp.arc.game._dbg, P = window.__pp, M = D.FD.FX.mem;
      if (id === 'ambrel') { for (const o of D.mons.filter(m => m.fobj && m.kind === 'lantern' && !m.dead)) D.hitMon(o, 1e12, { flat: true }); }
      else { for (let i = 0; i < 200 && M.lit < 0; i++) P.arc.game.update(0.05); const o = D.mons.find(m => m.fobj && m.kind === 'blossom' && m.idx === M.lit && !m.dead); if (o) D.hitMon(o, 1e12, { flat: true }); } }, boss);
    await step(1.4, [0.6, 3.6]); await shot('stun'); }
  if (!ONLY || ONLY.includes('phase2')) { await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.g.boss; b.stunT = 0; b.hp = b.maxhp * 0.45; D.me.x = b.x + 0.5; D.me.y = b.y + 4.8; }); await step(0.6, [0.5, 4.8]); await shot('phase2'); await step(2.4, [0.5, 4.8]); }
  if (!ONLY || ONLY.includes('p2-strike')) { const [k, r, tw, ts] = ACTS[boss][boss === 'ambrel' ? 2 : 1];
    await page.evaluate(([r]) => { const P = window.__pp, D = P.arc.game._dbg, b = D.g.boss; b.act = 'circle'; b.actT = 99; const R = Math.random; Math.random = () => r; try { P.arc.game.update(0.05); } finally { Math.random = R; } D.me.x = b.x + 0.8; D.me.y = b.y + 4.6; }, [r]);
    await step(ts, [0.8, 4.6]); await shot('p2-strike'); }
  if (!ONLY || ONLY.some(o => o.startsWith('defeat'))) { await page.evaluate(() => { const D = window.__pp.arc.game._dbg; const b = D.g.boss; D.me.x = b.x + 0.6; D.me.y = b.y + 4.4; D.hitMon(b, 1e12, { pierce: true }); });
    await step(0.5); await shot('defeat-1'); await step(1.0); await shot('defeat-2'); await step(1.1); await shot('defeat-3'); }
  console.log(boss, TAG, 'd' + DPR, 'GL', GL, 'shots', shots.length, 'state', JSON.stringify(await st()), 'errors', errors.length, ((Date.now() - T0) / 1000).toFixed(0) + 's'); if (errors.length) console.log(errors.slice(0, 5).join('\n'));
  await b.close(); })();
