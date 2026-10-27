// Props break under fire, leave elemental residue, and a different element touching the patch sets off a reaction.
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message + ' @ ' + (e.stack || '').split('\n').slice(1, 3).join(' ')));
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  const out = {};
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Smasher'); P.st.unlockAll = true; P.st.energy = 100; P.st.dun.best = 40; P.st.dlv = 25; P.openMap(); P.dun.setMapTab('dungeon', true); });
  const floor = +(process.env.FLOOR || 12);
  await page.evaluate(f => window.__pp.dun.startDungeon(f, 7), floor);
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
  await page.evaluate(() => window.__pp.beginPlay()); await page.waitForTimeout(2600);
  // teleport next to the nearest prop and smash it with a strong attack
  out.smash = await page.evaluate(() => {
    const D = window.__pp.arc.game._dbg, me = D.me, props = D.propList.filter(p => !p.broken);
    if (!props.length) return 'no props';
    props.sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y));
    const p = props[0]; me.x = p.x; me.y = p.y + 1.6; D.mons.forEach(m => { if (!m.boss) { m.x = me.x + 30; m.y = me.y + 30; } });
    D.g.cdS = 0; me.mp = 999;
    const before = { kind: p.kind, el: p.el, hp: p.hp, zones: D.RES.zones.length };
    D.hitMon; D.RES.hitProp(p, 'fire', 3);
    return Object.assign(before, { broken: p.broken, zones: D.RES.zones.length, zoneEl: D.RES.zones[0] && D.RES.zones[0].el, tileNow: D.M.G[p.k] });
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/residue-patch.png') });
  // a monster in the patch gets the mark; a shot of another element through the patch reacts
  out.react = await page.evaluate(async () => {
    const P = window.__pp, D = P.arc.game._dbg, me = D.me, z = D.RES.zones[0]; if (!z) return 'no zone';
    const m = D.mons.find(x => !x.dead && !x.boss); if (!m) return 'no monster';
    m.x = z.x; m.y = z.y + 0.2; m.hp = 1e6; m.maxhp = 1e6; m.still = true; m.mv = 1; m.mark = null; m.rxCd = 0;
    await new Promise(r => setTimeout(r, 900));
    const marked = m.mark && m.mark.el;
    const other = { fire: 'frost', frost: 'fire', bubble: 'spark', leaf: 'fire', spark: 'bubble', gold: 'fire', shadow: 'prism', prism: 'shadow' }[z.el];
    const n0 = D.RX.S.count;
    D.shots.push({ x: z.x - 0.1, y: z.y, vx: 0, vy: 0, r: 0.2, dmg: 50, life: 0.2, t: 0, pierce: 0, hits: null, style: 'bolt', el: other, src: 'strong' });
    await new Promise(r => setTimeout(r, 400));
    return { patch: z.el, marked, shotEl: other, reacted: D.RX.S.count > n0, last: D.RX.S.last, zoneLeft: D.RES.zones.length };
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.resolve(__dirname, '../shots/residue-react.png') });
  // every prop kind on every biome maps to an element, and a normal shot breaks a prop in two hits
  out.kinds = await page.evaluate(() => { const P = window.__pp; const miss = []; P.BIOME_ORDER.forEach(b => P.BIOMES[b].props.forEach(k => { if (!P.PROP_EL[k]) miss.push(b + ':' + k); })); return miss.length ? miss : 'all mapped'; });
  out.shotBreak = await page.evaluate(async () => {
    const D = window.__pp.arc.game._dbg, me = D.me, p = D.propList.filter(q => !q.broken && D.M.G[q.k + D.M.MW] === 1 && D.M.G[q.k + 2 * D.M.MW] === 1).sort((a, b) => Math.hypot(a.x - me.x, a.y - me.y) - Math.hypot(b.x - me.x, b.y - me.y))[0]; if (!p) return 'none left';
    me.x = p.x; me.y = p.y + 2.2;
    for (let i = 0; i < 3; i++) { D.shots.push({ x: p.x, y: p.y + 1.2, vx: 0, vy: -8, r: 0.15, dmg: 10, life: 1, t: 0, pierce: 0, hits: null, style: 'bolt', el: 'spark', src: 'normal' }); await new Promise(r => setTimeout(r, 250)); }
    return { kind: p.kind, broken: p.broken, hp: p.hp };
  });
  console.log(JSON.stringify(out, null, 1));
  console.log('errors:', errors.length); errors.slice(0, 8).forEach(e => console.log('  ', e));
  await browser.close();
  process.exit(errors.length ? 1 : 0);
})();
