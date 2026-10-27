// The composited layers the page keeps (each a picture in memory on a phone), in the room and during a Tower floor,
// with a team of Celestial six-stars or ordinary pets. usage: node tests/_layers.js   env: HTML, LEG=1, DPR
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
(async () => {
  const dpr = +(process.env.DPR || 3);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr, hasTouch: true });
  await page.goto('file://' + path.resolve(__dirname, '..', process.env.HTML || 'test.html'));
  await page.waitForFunction(() => window.__pp, null, { timeout: 15000 }); await page.waitForTimeout(300);
  await page.evaluate(leg => {
    const P = window.__pp; P.quickStart('Bot'); P.st.unlockAll = true; P.st.dun.god = true; P.st.energy = 100; P.st.dun.best = 60; P.st.dlv = 60;
    const mk = (sd) => { const g = leg ? P.summonGenome(6, P.mulberry32(sd)) : P.summonGenome(4, P.mulberry32(sd)), line = P.evolveLine(g.form, 7, P.mulberry32(sd * 7)), p = P.newPetFields('L' + sd, g); p.forms = line; p.stage = 7; for (let n = 2; n <= 7; n++) p.paid[n] = true; if (leg) p.rarity = 5; p.dlv = 40; return p; };
    P.st.others = [mk(11), mk(23), mk(47)]; P.switchPet(0);
  }, !!process.env.LEG);
  await page.waitForTimeout(1000);
  const cdp = await page.context().newCDPSession(page);
  let last = null; cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) last = e.layers; });
  await cdp.send('LayerTree.enable');
  const report = async label => {
    last = null; await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))); await page.waitForTimeout(600);
    const L = last || [], dc = L.filter(l => l.drawsContent);
    const mb = dc.reduce((s, l) => s + l.width * l.height * dpr * dpr * 4, 0) / 1048576;
    const top = dc.slice().sort((a, b) => b.width * b.height - a.width * a.height).slice(0, 6).map(l => `${Math.round(l.width)}x${Math.round(l.height)}`).join(' ');
    console.log(label.padEnd(10), 'layers', L.length, 'drawing', dc.length, 'about', mb.toFixed(1), 'MB', '| biggest', top);
  };
  await report('room');
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('dungeon', true); P.dun.startDungeon(8, 1008); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 30000 });
  await page.evaluate(() => window.__pp.beginPlay());
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  await report('floor 8');
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
