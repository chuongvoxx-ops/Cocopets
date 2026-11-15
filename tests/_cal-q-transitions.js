// Rift 0 QA (worker Q): the transitions around the rift. A checkpoint deep in the rift survives a save and reload; the seal
// (Ifrit's stage won through the real end flow) gives the Ember Sigil and the Ember Charm once; the map then offers Enter again
// and Start over; Enter again starts at stage 1; a sealed replay of Ifrit gives +60 crystals and no second charm, and leaves
// Rift 1 shut. The world-map card's text. SHOTS=1 for pictures (393x852 @2x, shots/cal-q-tr-*).
// HTML=test-calQ.html node tests/_cal-q-transitions.js
const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
let bad = 0; const ok = (c, m, x) => { console.log((c ? 'ok   ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); if (!c) bad++; };
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 393, height: 852 }, deviceScaleFactor: process.env.SHOTS ? 2 : 1, hasTouch: true });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => { window.__CAL_GL = 0; window.__IFRIT_GL = 0; });
  const url = 'file://' + path.resolve(__dirname, '..', process.env.HTML || 'test-calQ.html');
  await page.goto(url); await page.waitForFunction(() => window.__pp, null, { timeout: 60000 });
  const shot = async n => { if (process.env.SHOTS) await page.screenshot({ path: path.resolve(__dirname, `../shots/cal-q-tr-${n}.png`) }); };
  const clear = () => page.evaluate(() => { const g = document.getElementById('giftWrap'); if (g && !g.hidden) g.hidden = true; });
  await page.evaluate(() => { const P = window.__pp; P.quickStart('Ember'); P.st.energy = 100; });
  // 1. a checkpoint at stage 8 of 9 survives a save and reload
  await page.evaluate(() => { const P = window.__pp; P.riftState().prog.caldera = 7; P.saveLocalNow(); });
  await page.reload(); await page.waitForFunction(() => window.__pp && window.__pp.st, null, { timeout: 60000 }); await page.waitForTimeout(1000);
  const p1 = await page.evaluate(() => window.__pp.riftState().prog.caldera); ok(p1 === 7, 'a checkpoint at stage 8 (The Heartward Descent) survives a save and reload', p1);
  // 2. the map at that checkpoint
  await clear(); await page.evaluate(() => { const P = window.__pp; P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); }); await page.waitForTimeout(500);
  const h1 = await page.evaluate(() => ({ text: document.querySelector('.rf-hero').textContent.replace(/\s+/g, ' ').slice(0, 200), btn: document.querySelector('[data-rift="enter"]').textContent }));
  ok(/Continue/.test(h1.btn) && /stage 8 of 9/.test(h1.text), 'the Rifts tab: Continue, stage 8 of 9', h1); await shot('tab-checkpoint');
  // 3. the seal through the end flow: Ifrit's stage, the boss struck down, the end panel
  await page.evaluate(() => { const P = window.__pp; P.riftState().prog.caldera = 8; P.startRift('caldera'); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await clear(); await page.click('#arcReady button.btn.primary');
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 });
  const killBoss = () => page.evaluate(async () => { const D = window.__pp.arc.game._dbg; for (let i = 0; i < 400 && !(D.g.boss && D.g.boss.act !== 'enter'); i++) { const s = D.M.bossAt; if (s) { D.me.x = s.x; D.me.y = s.y + 5; } await new Promise(r => requestAnimationFrame(r)); }
    const b = D.g.boss; b.under = false; b.locked = false; b.guardA = null; D.hitMon(b, 1e12, { flat: true }); });
  await killBoss(); await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 180000 }); await page.waitForSelector('#arcPanel .dun-end', { timeout: 30000 });
  const e1 = await page.evaluate(() => { const P = window.__pp, p = document.getElementById('arcPanel'); return { h: p.querySelector('h2').textContent, lines: [...p.querySelectorAll('.rewards li')].map(l => l.textContent.trim()), next: !!p.querySelector('[data-arc="next"]'), sealed: !!P.riftState().seals.caldera, ember: (JSON.stringify(P.st.accs).match(/"sp":"ember"/g) || []).length, charm: P.st.accs.find(a => a.sp === 'ember') || null, crystals: P.st.crystals || 0, belfry: P.riftOpen('belfry') }; });
  ok(e1.charm && e1.charm.r <= 2, 'the Ember Charm is a beginner reward: Rare or below', e1.charm);
  ok(e1.sealed && /sealed/i.test(e1.h) && e1.ember === 1 && !e1.next && !e1.belfry, 'the seal: "The rift is sealed!", one Ember Charm, no next stage, Rift 1 still shut', e1); await shot('sealed-panel');
  // 4. the map after the seal: Enter again / Start over; the world map's card
  await page.click('#arcPanel [data-arc="map"]'); await page.waitForTimeout(400); await clear();
  await page.evaluate(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); }); await page.waitForTimeout(500);
  const h2 = await page.evaluate(() => ({ text: document.querySelector('.rf-hero').textContent.replace(/\s+/g, ' ').slice(0, 200), btn: document.querySelector('[data-rift="enter"]').textContent, again: !!document.querySelector('[data-rift="restart"]'), done: document.querySelectorAll('.rf-stages .rf-st.done').length, card: (document.querySelector('.rf-card[data-id="caldera"]') || {}).textContent }));
  ok(/Enter again/.test(h2.btn) && h2.again && h2.done === 9 && /Sealed/.test(h2.card), 'the Rifts tab after the seal: Enter again, Start over, all nine stages done, card Sealed', h2); await shot('tab-sealed');
  // 5. Enter again: stage 1 (the Cinder Galleries)
  await page.click('[data-rift="enter"]'); await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 });
  const r1 = await page.evaluate(() => document.getElementById('arcReady').textContent.replace(/\s+/g, ' ').slice(0, 120)); ok(/stage 1 of 9/.test(r1), 'Enter again on a sealed rift starts at stage 1', r1);
  await page.evaluate(() => window.__pp.closeArcade(true));
  // 6. a sealed replay of Ifrit: +60 crystals, no second charm, still apart from the twelve
  await page.evaluate(() => { const P = window.__pp; P.st.energy = 100; P.openMap(); P.dun.setMapTab('rift', true); P.startRift('caldera', 8); });
  await page.waitForFunction(() => window.__pp.arc.state === 'ready', null, { timeout: 120000 }); await clear(); await page.click('#arcReady button.btn.primary');
  await page.waitForFunction(() => window.__pp.arc.state === 'play', null, { timeout: 60000 }); await killBoss();
  await page.waitForFunction(() => window.__pp.arc.state === 'end', null, { timeout: 180000 }); await page.waitForSelector('#arcPanel .dun-end', { timeout: 30000 });
  const e2 = await page.evaluate(() => { const P = window.__pp, p = document.getElementById('arcPanel'); return { h: p.querySelector('h2').textContent, lines: [...p.querySelectorAll('.rewards li')].map(l => l.textContent.trim()), ember: (JSON.stringify(P.st.accs).match(/"sp":"ember"/g) || []).length, crystals: P.st.crystals || 0, prog: P.riftState().prog.caldera || 0, twelve: P.RIFT_PLAN.filter(r => !r.final && !r.zero && P.riftState().seals[r.id]).length }; });
  ok(/again/i.test(e2.h) && e2.ember === 1 && e2.crystals === e1.crystals + 60 && e2.prog === 0 && e2.twelve === 0, 'a sealed replay: "Sealed again", +60 crystals, still one charm, checkpoint 0, 0/12', e2);
  await page.click('#arcPanel [data-arc="map"]'); await page.waitForTimeout(400); await clear();
  // 7. the world map's card for the caldera
  const wc = await page.evaluate(() => { const P = window.__pp; P.openMap(); try { P.dun.setMapTab('world', true); } catch (e) {} const b = document.querySelector('.wm-spot[data-wm="rift"][data-id="caldera"]'); if (b) b.click(); const c = document.getElementById('mapCard'); return { spot: !!b, text: c && !c.hidden ? c.textContent.replace(/\s+/g, ' ').slice(0, 300) : null }; });
  console.log('world card', JSON.stringify(wc)); await page.waitForTimeout(500); await shot('world-card');
  await page.evaluate(() => { const P = window.__pp; P.riftState().seals = {}; P.riftState().prog.caldera = 3; const b = document.querySelector('.wm-spot[data-wm="rift"][data-id="caldera"]'); if (b) b.click(); });
  const wc2 = await page.evaluate(() => { const c = document.getElementById('mapCard'); return c && !c.hidden ? c.textContent.replace(/\s+/g, ' ').slice(0, 300) : null; });
  console.log('world card at a checkpoint', JSON.stringify(wc2)); await shot('world-card-checkpoint');
  ok(errors.length === 0, 'no page errors', errors.slice(0, 4));
  console.log(bad ? `${bad} FAILED` : 'all ok'); await browser.close(); process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
