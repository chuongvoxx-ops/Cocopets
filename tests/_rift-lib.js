// shared helpers for the rift tests: a page with the hook, a rift stage started and played by the hook
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
async function open(opts) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: process.env.SHOTS ? 2 : 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(o => { const P = window.__pp; P.quickStart('Bot'); P.st.dun.god = true; P.st.energy = 100; P.st.dlv = o.lvl || 12; if (o.unlockAll) P.st.unlockAll = true; if (o.seals) for (const id of o.seals) P.riftState().seals[id] = 1; P.openMap(); P.dun.setMapTab('rift', true); }, opts || {});
  const shot = async name => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/rift-${name}.png`) }); };
  const start = async (id, stage) => { await page.evaluate(([id, stage]) => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); if (stage === 'gate') P.startGate(id); else P.startRift(id, stage); }, [id, stage]); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 }); await page.evaluate(() => window.__pp.beginPlay()); await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 }); await page.waitForTimeout(400); };
  const run = secs => page.evaluate(async secs => { const D = window.__pp.arc.game._dbg; const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); if (D && D.me && !D.me.dead) { D.me.hp = D.ST.hp; D.me.mp = 999; } } }, secs);
  const goTo = (x, y) => page.evaluate(([x, y]) => { const D = window.__pp.arc.game._dbg; D.me.x = x; D.me.y = y; D.me.vx = D.me.vy = 0; }, [x, y]);
  // stand beside an object (by kind and index, or a label fragment) long enough to use it
  const useObj = async (kind, which, secs) => { const o = await page.evaluate(([kind, which]) => { const D = window.__pp.arc.game._dbg, list = D.RIFT.objs.filter(o => o.kind === kind); const o = typeof which === 'number' ? list[which] : list.find(o => (typeof o.label === 'function' ? o.label(o) : o.label).includes(which)); if (!o) return null; D.me.x = o.x + 0.6; D.me.y = o.y + 0.3; D.me.vx = D.me.vy = 0; o.used = false; o.ch = 0; return { x: o.x, y: o.y }; }, [kind, which]); await run(secs || 1.1); return o; };
  const killAll = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg; for (let k = 0; k < 3; k++) { for (const m of D.mons) if (!m.dead && !m.boss) { m.guardFn = null; D.hitMon(m, 1e9, { flat: true }); } await new Promise(r => setTimeout(r, 200)); } });
  const goal = () => page.evaluate(() => document.getElementById('arcGoal').textContent);
  const state = () => page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { goal: document.getElementById('arcGoal').textContent, done: D.RIFT.done, won: D.g.won, mons: D.mons.filter(m => !m.dead && !m.boss).length, state: window.__pp.arc.state, banners: D.banners.map(b => b.s) }; });
  const exitStage = async () => { await page.evaluate(() => { const D = window.__pp.arc.game._dbg, e = D.RIFT.exit; D.me.x = e.x; D.me.y = e.y; }); await run(0.5); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 20000 }); await page.waitForTimeout(600); };
  const bossWake = async () => { await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss); D.me.x = b.x; D.me.y = b.y + 3.5; }); await run(5); };
  const watchActs = (secs, want, hpK) => page.evaluate(async ([secs, want, hpK]) => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss), seen = new Set(), ban = new Set(); const t0 = performance.now(); while (performance.now() - t0 < secs * 1000) { await new Promise(r => requestAnimationFrame(r)); D.me.hp = D.ST.hp; D.me.mp = 999; seen.add(b.act); D.banners.forEach(x => ban.add(x.s)); if (hpK != null && b.hp > b.maxhp * hpK) b.hp = b.maxhp * hpK; if (want.every(w => seen.has(w))) break; } return { acts: [...seen], banners: [...ban] }; }, [secs, want, hpK]);
  const killBoss = async () => { await page.evaluate(() => { const D = window.__pp.arc.game._dbg, b = D.mons.find(m => m.boss); b.under = false; b.locked = false; b.guardA = null; D.hitMon(b, 1e12, { flat: true }); }); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 30000 }); await page.waitForTimeout(600); };
  const rs = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__pp.riftState())));
  return { browser, page, errors, shot, start, run, goTo, useObj, killAll, goal, state, exitStage, bossWake, watchActs, killBoss, rs };
}
module.exports = { open };
