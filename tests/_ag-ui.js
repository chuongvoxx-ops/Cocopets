// v435 AG: the Gate of Aries in the game's own UI: the Rifts tab (the Blackfire Caldera selected: its gate in the Anima gates
// list) and the world map (the gate's spot beside Rift 0 and its card). BEFORE=<a build without the gate> takes the same
// views as "before" shots and skips the checks. Locked (unsealed), open (sealed) and with the developer unlock.
// HTML=test-ag.html node tests/_ag-ui.js   (SHOTS=1 into shots/v435-AG/, DPR=3)
const { open } = require('./_ag-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
const DPR = +(process.env.DPR || 1), SH = !!process.env.SHOTS, tag = DPR === 1 ? 'dpr1' : 'dpr' + DPR, BEFORE = process.env.BEFORE || '';
(async () => {
  const T = await open({ dpr: DPR, seal: false, html: BEFORE || undefined }); const { page, M, errors } = T, pre = BEFORE ? 'before-' : '';
  const shot = async name => { if (SH) await T.shot('v435-AG', `${pre}${name}-${tag}`); };
  const gatesView = async (name) => { await M(() => { const P = window.__pp; P.openMap(); P.dun.setMapTab('rift', true); const b = document.querySelector('[data-rift="sel"][data-id="caldera"]'); if (b) b.click(); const e = document.querySelector('.rf-gates'); if (e) e.scrollIntoView({ block: 'start' }); }); await page.waitForTimeout(400); await shot(name); };
  // locked: the caldera not yet sealed
  await gatesView('ui-locked');
  let r = await M(() => { const g = [...document.querySelectorAll('.rf-gate')].find(e => /Ramforge/.test(e.textContent)); return g ? { txt: g.textContent, btn: !!g.querySelector('button') } : null; });
  if (!BEFORE) ok(r && /Clear The Blackfire Caldera/.test(r.txt) && !r.btn, 'locked: the Ramforge is listed, "Clear The Blackfire Caldera", no Trial button ' + JSON.stringify(r));
  // sealed: open
  await M(() => { window.__pp.riftState().seals.caldera = 1; }); await gatesView('ui-gates');
  r = await M(() => { const g = [...document.querySelectorAll('.rf-gate')]; return { first: g[0] && g[0].textContent, btn: !!document.querySelector('[data-rift="gate"][data-id="caldera"]'), n: g.length }; });
  if (!BEFORE) ok(/Ramforge/.test(r.first) && /Trial available/.test(r.first) && r.btn && r.n === 12, 'sealed: the Ramforge first in the list, "Trial available", its Trial button ' + JSON.stringify(r));
  // the world map: Rift 0's gate beside it, its card
  await M(() => { const P = window.__pp; P.dun.setMapTab('world'); }); await page.waitForTimeout(800);
  r = await M(() => { const s = document.querySelector('[data-wm="gate"][data-id="caldera"]'); const rs = document.querySelector('[data-wm="rift"][data-id="caldera"]'); if (rs) rs.click(); return { spot: !!s, cls: s && s.className }; }); await page.waitForTimeout(600); await shot('map-caldera');
  if (!BEFORE) { ok(r.spot && /open/.test(r.cls), 'the world map has the gate\'s spot beside Rift 0, open ' + JSON.stringify(r));
    await M(() => { const s = document.querySelector('[data-wm="gate"][data-id="caldera"]'); if (s) s.click(); }); await page.waitForTimeout(600); await shot('map-gate');
    r = await M(() => { const c = document.querySelector('.map-card, #mapCard'); return c ? c.textContent : ''; }); ok(/Ramforge/.test(r) && /Begin the trial/.test(r), 'its card names the Ramforge and offers the trial ' + r.slice(0, 160));
    // the developer unlock opens it without the seal
    r = await M(() => { const P = window.__pp; P.riftState().seals.caldera = 0; P.st.unlockAll = true; const o = P.gateOpen('caldera'); P.st.unlockAll = false; const o2 = P.gateOpen('caldera'); return { o, o2 }; }); ok(r.o && !r.o2, 'the developer unlock opens the gate; without it (unsealed) it is shut ' + JSON.stringify(r)); }
  ok(!errors.length, `${BEFORE ? 'before' : 'after'}: no page errors ` + errors.slice(0, 3).join(' | '));
  await T.browser.close(); console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
})();
