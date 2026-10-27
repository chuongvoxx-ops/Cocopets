// Contact sheets of the dungeon art (monsters, bosses, props) plus a screenshot of every land.
// usage: node tests/art-sheet.js [lands|sheets|all]
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const what = process.argv[2] || 'all';
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(__dirname, '../test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.evaluate(() => { const P = window.__pp; if (!P.st) P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 99; });
  const out = path.resolve(__dirname, '../shots');
  fs.mkdirSync(out, { recursive: true });
  const save = (name, dataUrl) => fs.writeFileSync(path.join(out, name), Buffer.from(dataUrl.split(',')[1], 'base64'));
  if (what === 'sheets' || what === 'all') {
    const mons = await page.evaluate(() => {
      const P = window.__pp, types = Object.keys(P.MON), cols = 7, cell = 96, cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = Math.ceil(types.length / cols) * cell;
      const c = cv.getContext('2d'); c.fillStyle = '#3A3F66'; c.fillRect(0, 0, cv.width, cv.height);
      types.forEach((t, i) => { const s = P.DunArt.monSprite(t, 22, 0.15, P.MON[t].color, '', false), x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * cell + cell / 2; const k = Math.min(1, 80 / (s.half * 2)); c.drawImage(s.cv, x - s.half * k, y - s.half * k + 4, s.half * 2 * k, s.half * 2 * k); c.fillStyle = '#FFF'; c.font = '800 10px sans-serif'; c.textAlign = 'center'; c.fillText(t, x, y + cell / 2 - 6); });
      return cv.toDataURL();
    });
    save('sheet-monsters.png', mons);
    const bosses = await page.evaluate(() => {
      const P = window.__pp, list = P.BOSSES, cols = 5, cell = 150, cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = Math.ceil(list.length / cols) * cell;
      const c = cv.getContext('2d'); c.fillStyle = '#2A2541'; c.fillRect(0, 0, cv.width, cv.height);
      const TS = 40, sx = x => x, sy = y => y;
      list.forEach((B, i) => { const x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * cell + cell / 2 + 10, r = 34; const m = { bk: B, color: B.color, glow: B.glow, x: x / TS, y: y / TS, phase: 1, act: 'move', t: 1, boss: B.id, r: r / TS, hp: 1, maxhp: 1 }; try { window.DunBoss ? null : null; P.arc.game; } catch (e) {} try { (window.__dunBossDraw || P.__extra && P.__extra.DunBoss || null); } catch (e) {} c.fillStyle = '#FFF'; c.font = '800 10px sans-serif'; c.textAlign = 'center'; c.fillText(B.name, x, y + cell / 2 - 14); window.__bossList = window.__bossList || []; window.__bossList.push([m, x, y, r]); });
      return { w: cv.width, h: cv.height };
    });
    // DunBoss isn't on the hook; draw through a tiny eval that reaches it via the running bundle scope
    const bossUrl = await page.evaluate(() => {
      const P = window.__pp, list = P.BOSSES, cols = 5, cell = 150, cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = Math.ceil(list.length / cols) * cell;
      const c = cv.getContext('2d'); c.fillStyle = '#2A2541'; c.fillRect(0, 0, cv.width, cv.height);
      const DB = P.DunBoss; if (!DB) return null;
      list.forEach((B, i) => { const x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * cell + cell / 2 + 10, r = 32; const m = { bk: B, color: B.color, glow: B.glow, x: x / 40, y: y / 40, phase: 1, act: 'move', t: 1, boss: B.id, r: r / 40, hp: 1, maxhp: 1, z: 0 }; try { DB.draw(c, m, x, y, r, 1.3, { x: x / 40 + 2, y: y / 40 }, v => v * 40, v => v * 40, 40); } catch (e) { c.fillStyle = '#F00'; c.fillText('ERR ' + e.message, x, y); } c.fillStyle = '#FFF'; c.font = '800 10px sans-serif'; c.textAlign = 'center'; c.fillText(B.name, x, y + cell / 2 - 14); });
      return cv.toDataURL();
    });
    if (bossUrl) save('sheet-bosses.png', bossUrl); else console.log('no DunBoss on hook');
    const props = await page.evaluate(() => {
      const P = window.__pp, kinds = Object.keys(P.DunWorld.PROPS), cols = 8, cell = 96, cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = Math.ceil(kinds.length / cols) * cell;
      const c = cv.getContext('2d'); c.fillStyle = '#4F703C'; c.fillRect(0, 0, cv.width, cv.height);
      kinds.forEach((k, i) => { const x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * cell + cell - 14; const biome = { cactus: 'desert', server: 'techno', gear: 'steampunk', oak: 'forest', bigflower: 'bloom', iceblock: 'frost' }[k] || 'halls'; try { const s = P.DunWorld.propSprite(k, 30, 1, 1, biome, '#FFE37A'); c.drawImage(s.cv, x - s.ax, y - s.ay); } catch (e) { c.fillStyle = '#F00'; c.fillText('ERR', x, y); } c.fillStyle = '#FFF'; c.font = '800 9px sans-serif'; c.textAlign = 'center'; c.fillText(k, x, y + 11); });
      return cv.toDataURL();
    });
    save('sheet-props.png', props);
    console.log('sheets saved');
  }
  if (what === 'high') {
    // the high tower: the ten new creatures on one sheet, then a screenshot of every high land
    const hi = await page.evaluate(() => {
      const P = window.__pp, types = P.HIGH_MON, cols = 5, cell = 120, cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = Math.ceil(types.length / cols) * cell;
      const c = cv.getContext('2d'); c.fillStyle = '#2E2A48'; c.fillRect(0, 0, cv.width, cv.height);
      types.forEach((t, i) => { const s = P.DunArt.monSprite(t, 26, 0.15, P.MON[t].color, '', false), x = (i % cols) * cell + cell / 2, y = Math.floor(i / cols) * cell + cell / 2; const k = Math.min(1, 104 / (s.half * 2)); c.drawImage(s.cv, x - s.half * k, y - s.half * k + 4, s.half * 2 * k, s.half * 2 * k); c.fillStyle = '#FFF'; c.font = '800 11px sans-serif'; c.textAlign = 'center'; c.fillText(P.MON[t].name, x, y + cell / 2 - 6); });
      return cv.toDataURL();
    });
    save('sheet-high-monsters.png', hi);
    const hiOrder = await page.evaluate(() => window.__pp.HIGH_ACT_ORDER);
    for (const b of (process.argv[3] ? [process.argv[3]] : hiOrder)) {
      let n = 101 + hiOrder.indexOf(b) * 4 + 1; if (n % 10 === 0) n++;
      await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); P.st.dun.best = 199; P.st.dlv = 200; });
      await page.evaluate(() => { const P = window.__pp; P.openMap && P.openMap(); P.dun.setMapTab('dungeon', true); });
      await page.evaluate(({ n }) => window.__pp.dun.startDungeon(n, 1234 + n), { n });
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
      await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.SKIP.fog = true; D.g.intro = 0.4; });
      await page.waitForTimeout(2600);
      const info = await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; let best = null, bd = 1e9; for (const m of D.mons) { const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } } if (best) { const p = D.X.walkPoint(best.x + 2, best.y + 1, me); me.x = p.x; me.y = p.y; } const tally = {}; D.mons.forEach(m => { tally[m.type] = (tally[m.type] || 0) + 1; }); return { F: D.F.biome, boss: D.F.bossKind && D.F.bossKind.name, tally }; });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(out, `land-${b}.png`) });
      console.log('land', b, 'floor', n, JSON.stringify(info));
    }
  }
  if (what === 'lands' || what === 'all') {
    const order = await page.evaluate(() => window.__pp.BIOME_ORDER);
    const actOrder = ['halls', 'swamp', 'caves', 'desert', 'high', 'forest', 'frost', 'icefield', 'hell', 'volcano', 'heaven', 'bloom', 'keep', 'mountain', 'steampunk', 'techno'];
    for (const b of (process.argv[3] ? [process.argv[3]] : actOrder)) {
      const n = actOrder.indexOf(b) * 4 + 2;
      await page.evaluate(() => { const P = window.__pp; if (P.arc.open) P.closeArcade(true); });
      await page.evaluate(() => { const P = window.__pp; P.openMap && P.openMap(); P.dun.setMapTab('dungeon', true); });
      await page.evaluate(({ n }) => window.__pp.dun.startDungeon(n, 1234 + n), { n });
      await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 15000 });
      await page.evaluate(() => { window.__pp.beginPlay(); const D = window.__pp.arc.game._dbg; D.SKIP.fog = true; D.g.intro = 0.4; });
      await page.waitForTimeout(2600);
      // walk a little toward the nearest pack so monsters are in view
      await page.evaluate(() => { const D = window.__pp.arc.game._dbg, me = D.me; let best = null, bd = 1e9; for (const m of D.mons) { const d = Math.hypot(m.x - me.x, m.y - me.y); if (d < bd) { bd = d; best = m; } } if (best) { const p = D.X.walkPoint(best.x + 2.5, best.y + 1, { r: 0.3, mv: 0 }); me.x = p.x; me.y = p.y; } });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: path.join(out, `land-${b}.png`) });
      console.log('land', b, 'floor', n);
    }
  }
  console.log('errors:', errors.length, errors.slice(0, 6));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
