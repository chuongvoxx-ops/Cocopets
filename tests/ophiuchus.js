// Ophiuchus, the thirteenth Anima: sealed until Bahamut is beaten (no crystals open it), then granted with the Tower's
// top floor; shown in the Animas menu; summoned in the Tower it fights, and its Final Judgement hits everything in sight
// harder than any other Awakening. usage: node tests/ophiuchus.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  // 1. sealed below the summit, whatever you pay
  const s1 = await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.crystals = 9000; P.st.dun.best = 119; P.anima.animaRecognise(); P.anima.unsealAnima('ophiuchus');
    return { order: P.ANIMA_ORDER.length, last: P.ANIMA_ORDER[12], k: P.anima.animaK('ophiuchus'), crystals: P.st.crystals }; });
  check(s1.order === 13 && s1.last === 'ophiuchus', 'Ophiuchus is the thirteenth sign');
  check(s1.k === 0 && s1.crystals === 9000, 'it cannot be unsealed for crystals before Bahamut is beaten');
  await page.evaluate(() => window.__pp.openAnimas('ophiuchus')); await page.waitForTimeout(500);
  const m1 = await page.evaluate(() => ({ txt: document.querySelector('.an-hero').textContent.replace(/\s+/g, ' '), hid: !!document.querySelector('.an-splash.hid'), unseal: !!document.querySelector('[data-go="an-unseal"]'), tile: !!document.querySelector('.an-tile.thirteenth.hid') }));
  check(m1.hid && m1.tile && !m1.unseal && /\?\?\?/.test(m1.txt), 'sealed, it is a silhouette with no unseal button');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/oph-sealed.png') });
  // 2. Bahamut beaten: it answers
  const s2 = await page.evaluate(() => { const P = window.__pp; P.st.dun.best = 120; const got = P.anima.animaRecognise(); P.anima.equipAnima('ophiuchus'); P.anima.renderAnimas(); return { got, k: P.anima.animaK('ophiuchus'), eq: P.st.animas.eq }; });
  check(s2.got.includes('ophiuchus') && s2.k === 1 && s2.eq === 'ophiuchus', 'clearing floor 120 grants it, and it can be bound');
  await page.waitForTimeout(500);
  const m2 = await page.evaluate(() => ({ txt: document.querySelector('.an-hero').textContent.replace(/\s+/g, ' '), hid: !!document.querySelector('.an-splash.hid') }));
  check(!m2.hid && /Bahamut/.test(m2.txt) && /Final Judgement/.test(m2.txt), 'unlocked, the menu shows Bahamut and its Final Judgement');
  await page.screenshot({ path: path.resolve(__dirname, '../shots/oph-menu.png') });
  await page.evaluate(() => { const s = document.querySelector('.sheet'); s.scrollTop = s.scrollHeight; }); await page.waitForTimeout(200);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/oph-grid.png') });
  // 3. in the Tower: summoned at its full form, it fights, then judges
  await page.evaluate(() => { const P = window.__pp; P.closeSheet(); P.st.animas.have.ophiuchus = 3; P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dlv = 60; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(13, 5); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  const f1 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; D.AN.S.gauge = 1; // bring a crowd close
    D.mons.filter(m => !m.dead && !m.boss).slice(0, 7).forEach((m, i) => { const p = D.X.walkPoint(me.x + Math.cos(i) * (2.5 + i * 0.4), me.y + Math.sin(i) * (2 + i * 0.3), m); m.x = p.x; m.y = p.y; m.aggro = true; });
    const ok = D.AN.summon(); return { ok, kit: D.AN.kit && D.AN.kit.main.id }; });
  check(f1.ok && f1.kit === 'ophiuchus', 'the gauge summons Ophiuchus');
  // its entrance runs on game time, which a busy machine slows: wait for it to land rather than for a fixed while
  await page.waitForFunction(() => window.__pp.arc.game._dbg.AN.S.list.some(a => a.id === 'ophiuchus' && a.st === 'fight'), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(300);
  const f2 = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return D.AN.S.list.map(a => a.id + ':' + a.st); });
  check(f2.includes('ophiuchus:fight'), 'it lands and fights: ' + f2.join(','));
  await page.screenshot({ path: path.resolve(__dirname, '../shots/oph-fight.png') });
  // its life runs out: the awakening, and the judgement
  const pre = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me, a = D.AN.S.list[0]; D.mons.filter(m => !m.dead && !m.boss).slice(0, 7).forEach((m, i) => { const p = D.X.walkPoint(me.x + Math.cos(i * 0.9) * (2.2 + i * 0.5), me.y + Math.sin(i * 0.9) * (1.8 + i * 0.4), m); m.x = p.x; m.y = p.y; m.maxhp = Math.max(m.maxhp, 5e6); m.hp = m.maxhp; });
    window.__hp = new Map(D.mons.filter(m => !m.dead).map(m => [m, m.hp])); a.life = 0; return { atk: D.ST.atk, k: a.k }; });
  // (its banner flashes for a second first, and only then does the night fall)
  const shots = [[1700, 'oph-j1'], [600, 'oph-j2'], [450, 'oph-j3'], [500, 'oph-j4']];
  let judg = null;
  for (const [ms, name] of shots) { await page.waitForTimeout(ms); const r = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, J = D.AN.S.judg; if (J && !window.__tg) window.__tg = J.tg.slice(); return J ? { t: +J.t.toFixed(2), tg: J.tg.length, done: J.done, cine: D.g.cineT } : null; }); if (r && !judg) judg = r; console.log(name, JSON.stringify(r)); await page.screenshot({ path: path.resolve(__dirname, `../shots/${name}.png`) }); }
  // (then until the night has lifted, on the game's own clock, which runs slower than the wall's when frames are slow)
  await page.waitForFunction(() => { const D = window.__pp.arc.game._dbg; return !D.AN.S.judg && D.g.cineT === 0; }, null, { timeout: 12000, polling: 100 }).catch(() => {});
  await page.waitForTimeout(300);
  const post = await page.evaluate(atk => { const D = window.__pp.arc.game._dbg; let n = 0, killed = 0, weak = 0, big = 0; const W = []; for (const m of window.__tg || []) { const hp0 = window.__hp.get(m); if (hp0 == null) continue; const d = hp0 - Math.max(0, m.hp); if (d <= 0) continue; n++; if (m.dead || m.hp <= 0 || m.type === 'skull') killed++; /* Rattlebones get back up after they fall */ else if (d >= atk * 3.6 * 10 * 0.45) big++; else { weak++; W.push({ type: m.type, d: Math.round(d), hp: Math.round(m.hp), max: Math.round(m.maxhp), sh: m.shield || 0, bl: m.block || 0 }); } } return { hitN: n, killed, big, weak, W, list: D.AN.S.list.map(a => a.id + ':' + a.st), judg: !!D.AN.S.judg, cine: D.g.cineT }; }, pre.atk);
  check(judg && judg.tg >= 5, 'Final Judgement picks out every monster in sight');
  check(post.hitN >= judg.tg && post.weak === 0 && post.killed + post.big >= 5, 'it kills what it hits or takes more than ten times its Awakening power off it');
  check(!post.judg && post.cine === 0, 'the night lifts and the fight goes on');
  console.log(JSON.stringify({ s1, s2, f1, f2, pre, post }));
  console.log(fails.length ? 'ophiuchus FAIL: ' + fails.join('; ') : 'ophiuchus OK');
  console.log('errors', errors.length, errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
