// An Astral Awakening shows its banner first, for a second, and only then does the attack begin, so it can be seen whole;
// a pair shows two banners, a second each, one after the other, then attacks. The banners are a quick flash over a band
// of sky faint enough to see through, just above the middle of the screen, clear of the summoning button.
// usage: node tests/astral-banners.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 2).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const fails = []; const check = (ok, what) => { if (!ok) fails.push(what); };
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; P.st.stage = 7; P.ANIMA_ORDER.forEach(a => P.st.animas.have[a] = 2); P.st.animas.eq = 'aries'; P.openMap(); P.dun.setMapTab('dungeon', true); });
  await page.evaluate(() => window.__pp.dun.startDungeon(3, 5));
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.g.intro = 0.2; D.SKIP.fog = true; });
  await page.waitForTimeout(600);
  // every banner raised from here on is written down, with the game's own clock (which runs slower than the wall's when
  // frames are slow, as they are here) and the monsters' health at that moment
  await page.evaluate(() => {
    const D = window.__pp.arc.game._dbg; window.__bans = []; window.__clock = 0;
    const hp = () => D.mons.filter(m => !m.dead && !m.boss).slice(0, 7).reduce((s, m) => s + m.hp, 0);
    window.__hp = hp;
    D.banners.push = function (...a) { a.forEach(b => window.__bans.push({ s: b.s, sub: b.sub, life: b.life, astral: b.astral, big: b.big, at: D.g.t, hp: hp() })); return Array.prototype.push.apply(this, a); };
  });
  const run = async (id, res) => {
    await page.evaluate(([id, res]) => {
      const P = window.__pp, D = P.arc.game._dbg, me = D.me, AN = D.AN; window.__bans.length = 0;
      AN.kit.main.id = id; AN.kit.main.k = 2;
      if (res) { AN.kit.res = { id: res, k: 2 }; AN.kit.resonance = P.pairResonance(id, res); } else { AN.kit.res = null; AN.kit.resonance = null; }
      D.mons.filter(m => !m.dead && !m.boss).slice(0, 7).forEach((m, i) => { const p = D.X.walkPoint(me.x + 2.5 + (i % 3) * 1.3, me.y - 2 + i * 0.8, { r: m.r, mv: 0 }); m.x = p.x; m.y = p.y; m.still = true; m.aggro = true; m.hp = m.maxhp = 1e6; });
      Object.assign(AN.S, { used: false, gauge: 1, resDone: false, list: [], fx: [] });
      AN.summon();
    }, [id, res]);
    // (both Animas of a pair have landed and are fighting before their time is cut short)
    await page.waitForFunction(n => { const L = window.__pp.arc.game._dbg.AN.S.list; return L.length >= n && L.every(a => a.st === 'fight'); }, res ? 2 : 1, { timeout: 8000, polling: 100 }).catch(() => {});
    await page.waitForTimeout(300);
    const landed = await page.evaluate(() => window.__bans.map(b => ({ s: b.s, life: b.life, astral: b.astral })));
    // the fight ends: nothing left burning or poisoned, so what the monsters lose from here is the awakening's own attack
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; window.__bans.length = 0; D.zones.length = 0; D.AN.S.fx.length = 0; D.mons.forEach(m => { m.burn = 0; m.venom = 0; m.dots = []; m.hp = m.maxhp; }); D.AN.S.list.forEach(a => { if (a.st === 'fight') a.life = 0.01; }); });
    // watch: the banners as they come, the most of each that is up at once, and the health lost meanwhile
    const trace = [];
    for (let i = 0; i < 60; i++) {
      const s = await page.evaluate(() => { const D = window.__pp.arc.game._dbg; return { t: D.g.t, hp: window.__hp(), up: D.banners.filter(b => b.astral && b.big).map(b => b.s + '@' + b.t.toFixed(2)) }; });
      trace.push(s); if (i > 25 && !s.up.length && !trace[trace.length - 2].up.length && trace.some(q => q.up.length)) break;
      await page.waitForTimeout(120);
    }
    const bans = await page.evaluate(() => window.__bans.slice());
    // (and a second and a half more on the game's clock, for the blows an attack lands one after another)
    if (bans.length) await page.waitForFunction(t => window.__pp.arc.game._dbg.g.t >= t, bans[bans.length - 1].at + bans[bans.length - 1].life + 1.5, { timeout: 15000, polling: 100 }).catch(() => {});
    const end = await page.evaluate(() => ({ t: window.__pp.arc.game._dbg.g.t, hp: window.__hp() }));
    await page.evaluate(() => { const D = window.__pp.arc.game._dbg; D.parts.length = 0; D.zones.length = 0; });
    return { landed, bans, trace, end };
  };
  const A = await page.evaluate(() => Object.fromEntries(['leo', 'virgo', 'aries', 'libra'].map(k => [k, window.__pp.ANIMAS[k].name])));
  // the health lost from the first banner until a moment before the last banner has gone, and in all
  const lost = (r) => { const b0 = r.bans[0], bl = r.bans[r.bans.length - 1]; if (!b0) return null; const hp0 = b0.hp, cut = bl.at + bl.life * 0.85; let before = 0; for (const s of r.trace) if (s.t <= cut) before = Math.max(before, hp0 - s.hp); return { before, total: hp0 - r.end.hp }; };
  const most = (r) => Math.max(0, ...r.trace.map(s => s.up.length));
  // 1. one Anima: its name flashes as it lands; its awakening flashes a banner for a second, and only then does it attack
  const one = await run('leo', null);
  check(one.landed.some(b => b.s === A.leo.toUpperCase() && b.astral && b.life === 1.5), 'the summoning flashes the Anima\'s name: ' + JSON.stringify(one.landed));
  check(one.bans.length === 1 && one.bans[0].s === 'JUDGEMENT OF THE SUN' && one.bans[0].life === 1 && one.bans[0].sub === `${A.leo} · Astral Awakening`, 'the awakening flashes one banner, for a second: ' + JSON.stringify(one.bans.map(b => [b.s, b.sub, b.life])));
  const l1 = lost(one);
  check(l1 && l1.total > 1000 && l1.before < l1.total * 0.05, 'the attack waits until the banner has gone: ' + JSON.stringify(l1));
  // 2. Harmony: the first Anima's banner, then the second's (the Harmony named under it), a second each, then the attack
  const two = await run('leo', 'virgo');
  const n2 = two.bans.map(b => b.s);
  check(n2.length === 2 && n2[0] === 'JUDGEMENT OF THE SUN' && n2[1] === 'ETERNAL REQUIEM' && two.bans[1].sub === `Astral Harmony · ${A.leo} + ${A.virgo}`, 'a Harmony flashes two banners, one per Anima: ' + JSON.stringify(two.bans.map(b => [b.s, b.sub])));
  check(two.bans.length === 2 && two.bans[1].at - two.bans[0].at >= 0.9 * two.bans[0].life, 'one after the other: ' + JSON.stringify(two.bans.map(b => +b.at.toFixed(2))));
  check(most(two) <= 1, 'never two on screen at once');
  const l2 = lost(two);
  check(l2 && l2.total > 1000 && l2.before < l2.total * 0.05, 'the attack waits until both banners have gone: ' + JSON.stringify(l2));
  // 3. Zodiac Resonance (opposite signs): the resonance, then its name, a second each, then the joined attack
  const three = await run('aries', 'libra');
  const n3 = three.bans.map(b => b.s);
  check(n3.length === 2 && n3[0] === 'ZODIAC RESONANCE' && n3[1] === 'JUDGEMENT PYRE' && three.bans.every(b => b.life === 1), 'a Resonance flashes two banners: ' + JSON.stringify(three.bans.map(b => [b.s, b.sub, b.life])));
  const l3 = lost(three);
  check(l3 && l3.total > 1000 && l3.before < l3.total * 0.05, 'and attacks only after them: ' + JSON.stringify(l3));
  // 4. the band behind an astral banner is faint, and the banner sits just above the middle, clear of the summon button
  const look = await page.evaluate(() => {
    const P = window.__pp, A2 = P.arc, G = A2.game, D = G._dbg, cv = document.getElementById('arcCanvas'), c = cv.getContext('2d'), run2 = G.update;
    G.update = () => {}; D.banners.length = 0; D.parts.length = 0;
    const px = (y) => { const d = c.getImageData(Math.round(cv.width * 0.06), Math.round(y * A2.dpr), 1, 1).data; return d[0] + d[1] + d[2]; };
    c.save(); G.draw(c); c.restore();
    const H = A2.H, y = Math.max(H * 0.3, Math.min(H * 0.45, H - 342)), plain = px(y);
    D.banners.push({ s: 'TEST', sub: '', color: '#FFE37A', t: 0.4, life: 1, big: true, astral: true });
    c.save(); G.draw(c); c.restore(); const withB = px(y);
    D.banners.length = 0; G.update = run2;
    return { plain, withB, y, H, btnTop: H - 272 - 30 };
  });
  check(look.withB >= look.plain * 0.7, `the band darkens the fight behind it only a little (${look.plain} → ${look.withB})`);
  check(look.y >= look.H * 0.3 && look.y <= look.H * 0.5 && look.y + 34 < look.btnTop, `the banner sits just above the middle, clear of the summon button (y ${look.y.toFixed(0)} of ${look.H}, button from ${look.btnTop})`);
  check(errors.length === 0, 'no page errors: ' + errors.slice(0, 3).join(' | '));
  console.log(fails.length ? 'FAIL\n - ' + fails.join('\n - ') : 'astral banners OK');
  console.log('errors', errors.length, errors.slice(0, 3));
  await browser.close();
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
