// the Tower and rifts on a keyboard: D strong, S strong 2, A ult, F normal attack, W switch pet, E summon; arrows move
const { chromium } = require('/opt/npm-tools/node_modules/playwright'); const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }); const p = await b.newPage({ viewport: { width: 1280, height: 800 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '..', 'test.html')); await p.waitForFunction(() => window.__pp);
  await p.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 5; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await p.evaluate(() => window.__pp.dun.startDungeon(3, 5)); await p.waitForFunction(() => window.__pp.arc.state === 'ready'); await p.keyboard.press('Space'); await p.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 5000 }).catch(() => {});
  ok(await p.evaluate(() => window.__pp.arc.state) === 'play', 'Space starts the floor');
  await p.evaluate(() => { const G = window.__pp.arc.game, k0 = G.key.bind(G); window.__got = []; G.key = (k, on) => { if (on) window.__got.push(k); return k0(k, on); }; });
  const want = { KeyD: 'ab1', KeyS: 'ab3', KeyA: 'ab2', KeyF: 'tap', KeyW: 'swap', KeyE: 'ab5', ShiftLeft: 'dodge' };
  for (const [code, k] of Object.entries(want)) { await p.evaluate(() => { window.__got = []; }); await p.keyboard.press(code); await p.waitForTimeout(80); const got = await p.evaluate(() => window.__got); ok(got.includes(k) && !got.some(x => ['left', 'right', 'up', 'down'].includes(x)), `${code} -> ${k}`, got); }
  const x0 = await p.evaluate(() => window.__pp.arc.game._dbg.me.x); await p.keyboard.down('ArrowRight'); await p.waitForTimeout(700); await p.keyboard.up('ArrowRight'); const x1 = await p.evaluate(() => window.__pp.arc.game._dbg.me.x);
  ok(x1 > x0 + 0.5, 'the right arrow walks right', { x0: +x0.toFixed(2), x1: +x1.toFixed(2) });
  const y0 = await p.evaluate(() => window.__pp.arc.game._dbg.me.y); await p.keyboard.down('KeyS'); await p.waitForTimeout(500); await p.keyboard.up('KeyS'); const y1 = await p.evaluate(() => window.__pp.arc.game._dbg.me.y);
  ok(Math.abs(y1 - y0) < 0.3, 'S no longer walks (it is Strong 2 now)', { y0: +y0.toFixed(2), y1: +y1.toFixed(2) });
  await p.waitForTimeout(600); const mp0 = await p.evaluate(() => { const D = window.__pp.arc.game._dbg; D.me.mp = 999; D.g.cdS = 0; return D.me.mp; }); await p.keyboard.press('KeyD'); await p.waitForTimeout(400); const mp1 = await p.evaluate(() => window.__pp.arc.game._dbg.me.mp);
  ok(mp1 < mp0, 'D really uses the Strong attack (MP spent)', { mp0, mp1: Math.round(mp1) });
  ok(!errs.length, 'no page errors', errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'all passed'); await b.close(); process.exit(bad ? 1 : 0); })();
