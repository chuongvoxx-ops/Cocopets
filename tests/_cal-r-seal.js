// v388 R: the rift sealing as the party's combined ult. Starts a rift's last stage with a party of four, fells the boss,
// holds the cinematic's clock (window.__SEAL_HOLD) at each moment of HOLDS and takes a picture (393x852 @2x), then lets it
// run to the end panel and checks the banners, the seal and the end panel. Also: a tap after the first second skips.
//   HTML=test-calR.html MODE=gpu|2d node tests/_cal-r-seal.js [riftId] [extra pets]
//   SHOTS=1 for pictures: shots/r-<rift>-<mode>-<t>.png ; HOLDS="0.3,1.6,..." to choose the moments ; SKIP=1 tests the skip ;
//   LOWFX=1 with Settings "Fewer effects" on
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => {
  const id = process.argv[2] || 'caldera', extra = +(process.argv[3] == null ? 3 : process.argv[3]), MODE = process.env.MODE || '2d', SKIP = !!process.env.SKIP;
  const HOLDS = (process.env.HOLDS || (SKIP ? '' : '0.35,0.9,1.9,2.7,3.2,4.1,5.0,5.75,6.05,6.45,7.1,7.7')).split(',').filter(Boolean).map(Number);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: process.env.SHOTS ? 2 : 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  page.on('console', m => { if (/seal fx/.test(m.text())) errors.push(m.text()); });
  await page.addInitScript(([gpu, hold]) => { window.__NG_GL = gpu ? 1 : 0; if (gpu) { window.__SEAL_GL = 0; window.__DUN_GL = 0; window.__CAL_GL = 0; } window.__IFRIT_GL = 0; window.__GLM_WARM = 0; if (hold != null) window.__SEAL_HOLD = hold; }, [MODE === 'gpu', HOLDS.length ? HOLDS[0] : null]);
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calR.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 60000 }); await page.waitForTimeout(300);
  // (GPU mode: software GL draws a frame in tens of seconds at 2x, so the cinematic is run on in 2D and only the held
  // moment is painted on the GPU, and read straight off the game's canvas)
  const shot = async n => { if (!process.env.SHOTS) return; const out = path.resolve(__dirname, `../shots/r-${id}-${MODE}${process.env.LOWFX ? '-low' : ''}-${n}.png`);
    if (MODE !== 'gpu' || n === 'end') { await page.screenshot({ timeout: 180000, path: out }); return; }
    const url = await page.evaluate(async () => { window.__SEAL_GL = 1; for (let i = 0; i < 2; i++) await new Promise(r => requestAnimationFrame(r)); const u = document.getElementById('arcCanvas').toDataURL('image/png'); window.__SEAL_GL = 0; return u; });
    require('fs').writeFileSync(out, Buffer.from(url.split(',')[1], 'base64')); };
  const clear = () => page.evaluate(() => { const g = document.getElementById('giftWrap'); if (g && !g.hidden) g.hidden = true; });
  const stage = await page.evaluate(([id, extra, lowFx]) => { const P = window.__pp; P.quickStart('Bot'); P.st.energy = 100; P.st.dun.god = true; P.st.dlv = 40; P.st.lowFx = lowFx; P.st.unlockAll = true; P.st.dun.best = 130;
    for (let i = 0; i < extra; i++) { const f = P.newPetFields('Mate' + i, P.makeGenome(P.mulberry32(i * 77 + 11))); f.dlv = 40; P.st.others.push(f); } P.st.party = null; P.partyPets();
    for (const r of P.RIFT_PLAN) if (r.id !== id && !r.final) P.riftState().seals[r.id] = 1;
    const Rf = P.RIFT_BY_ID[id], n = Rf.stages.length - 1; P.riftState().prog[id] = n; P.openMap(); P.dun.setMapTab('rift', true); P.startRift(id, n); return n; }, [id, extra, !!process.env.LOWFX]);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready' || window.__pp.arc.state === 'off', null, { timeout: 600000 }); if (await page.evaluate(() => window.__pp.arc.state) === 'off') throw new Error('the stage failed to load'); await clear(); await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 300000 }); await page.waitForTimeout(500);
  const info = await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 400 && !(D.g.boss && D.g.boss.act !== 'enter' && D.g.boss.act !== 'sleep'); i++) { const s = D.M.bossAt; if (s) { D.me.x = s.x; D.me.y = s.y + 5; } await new Promise(r => requestAnimationFrame(r)); }
    const b = D.g.boss || D.mons.find(m => m.boss); if (!b) return { err: 'no boss' }; b.under = false; b.locked = false; b.guardA = null; D.me.x = b.x + 2.5; D.me.y = b.y + 3; D.hitMon(b, 1e12, { flat: true }); return { boss: b.bname || b.type, dead: b.dead, party: D.RIFT && D.RIFT.self ? 1 : 0 }; });
  console.log('stage', stage, JSON.stringify(info));
  const ban = new Set(); const watch = async () => { const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { b: D.banners.map(b => b.s), st: window.__pp.arc.state, C: D.RIFT.self.cine ? { t: D.RIFT.self.cine.t, step: D.RIFT.self.cine.step } : null }; }); r.b.forEach(s => ban.add(s)); return r; };
  // wait for the cinematic
  { const t0 = Date.now(); while (Date.now() - t0 < 300000) { const r = await watch(); if (r.C) break; await page.waitForTimeout(100); } }
  const cineStart = await watch(); ok(!!cineStart.C, 'the sealing cinematic starts after the boss falls', cineStart.C);
  const party = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.RIFT.objs.filter(o => o.kind === 'sealpet').length; });
  for (const h of HOLDS) {
    await page.evaluate(h => { window.__SEAL_HOLD = h; }, h);
    const t0 = Date.now(); let r; while (Date.now() - t0 < 240000) { r = await watch(); if (!r.C || r.C.t >= h - 1e-3) break; await page.waitForTimeout(50); }
    await page.waitForTimeout(MODE === 'gpu' ? 900 : 350); await watch();
    const k = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { zoom: D.g.zoom, T: D.g.zoom }; });
    await shot(String(h).replace('.', '_')); console.log('  held', h, JSON.stringify(r && r.C), 'zoom', k.zoom.toFixed(3));
  }
  ok(party === extra, `the whole party is drawn: ${party} of ${extra} benched pets step out`, party);
  await page.evaluate(() => { window.__SEAL_HOLD = null; });
  if (SKIP) { await page.evaluate(async () => { const D = window.__pp.arc.game._dbg; while (D.RIFT.self.cine.t < 1.3) await new Promise(r => requestAnimationFrame(r)); }); const before = await watch(); await page.evaluate(() => window.__pp.arc.game.key('tap', true)); await page.waitForTimeout(80); const after = await watch(); ok(after.C && after.C.t > 5.8, 'a tap after the first second skips to the flash', { before: before.C, after: after.C }); }
  const tEnd = Date.now(); while (Date.now() - tEnd < 90000) { const r = await watch(); if (r.st === 'end') break; await page.waitForTimeout(120); }
  await page.waitForSelector('#arcPanel .dun-end', { timeout: 30000 }).catch(() => {});
  const end = await page.evaluate(id => { const P = window.__pp, p = document.getElementById('arcPanel'); return { st: P.arc.state, h: p && p.querySelector('h2') ? p.querySelector('h2').textContent : '', sealed: !!P.riftState().seals[id] }; }, id);
  const sig = [...ban].find(s => /SIGIL/.test(s));
  ok(ban.has('SEAL THE RIFT') && !!sig, 'the banners: SEAL THE RIFT, then the sigil', [...ban]);
  ok(end.st === 'end' && end.sealed && /seal/i.test(end.h), 'the end panel: the rift is sealed', end); await shot('end');
  ok(errors.length === 0, 'no page errors', errors.slice(0, 4));
  console.log(bad ? `${bad} FAILED` : 'all ok'); await browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
