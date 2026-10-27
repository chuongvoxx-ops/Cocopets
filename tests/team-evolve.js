// Evolving any pet from the Team sheet: a party member from the pause in the middle of a run (the ceremony shows over the
// paused run; the gemstone and crystals are spent; the run carries on with the evolved pet), a missing need explained,
// and the pet you play evolving from Team at home
const { open } = require('./_rift-lib');
let fails = 0; const ok = (c, s) => { console.log((c ? 'ok   ' : 'FAIL ') + s); if (!c) fails++; };
(async () => {
  const T = await open({ lvl: 72, seals: ['belfry', 'garden', 'dunes', 'sepulchre', 'aurora', 'yuggoth'] }); const { page, errors, start, run } = T;
  const M = (f, a) => page.evaluate(f, a);
  const S0 = await M(() => { const P = window.__pp, st = P.st; for (let i = 0; i < 3; i++) { const f = P.newPetFields('Mate' + i, P.makeGenome(P.mulberry32(i * 77 + 5))); f.dlv = 70; f.xp = 999999; st.others.push(f); } st.party = null; P.partyPets();
    const m = st.others[0], nx = P.STAGES[m.stage + 1]; st.gems[nx.gem] = 1; st.crystals = 2000; return { uid: m.uid, stage: m.stage, gem: nx.gem }; });
  await start('library', 1); await run(2);
  await M(() => window.__pp.openRunTeam()); await page.waitForTimeout(400);
  await M(uid => document.querySelector(`.team-panel [data-go="team-pick"][data-uid="${uid}"]`).click(), S0.uid); await page.waitForTimeout(300);
  let r = await M(() => { const b = document.querySelector('.tm-evo [data-go="team-evolve"]'); return b ? { txt: b.textContent, dis: b.getAttribute('aria-disabled'), box: document.querySelector('.tm-evo').textContent } : null; });
  ok(r && !r.dis && /Evolve/.test(r.txt), 'the Team sheet (run paused) shows an Evolution box with a ready Evolve button ' + JSON.stringify(r && r.box));
  await page.screenshot({ path: require('path').resolve(__dirname, '../shots/team-evolve-a.png') });
  await M(() => document.querySelector('.tm-evo [data-go="team-evolve"]').click()); await page.waitForTimeout(800);
  r = await M(() => { const w = document.querySelector('#evoWrap'), cs = getComputedStyle(w), sh = getComputedStyle(document.querySelector('.sheet-wrap')); return { shown: !w.hidden, z: +cs.zIndex, zs: +sh.zIndex, paused: window.__pp.arc.paused }; });
  ok(r.shown && r.z > r.zs && r.paused, 'the ceremony shows over the Team sheet, the run still paused ' + JSON.stringify(r));
  await page.waitForTimeout(3600); await page.screenshot({ path: require('path').resolve(__dirname, '../shots/team-evolve-b.png') });
  r = await M(uid => { const st = window.__pp.st, m = st.others.find(o => o.uid === uid); return { stage: m.stage, forms: m.forms.length, gems: st.gems, crystals: st.crystals, title: document.querySelector('#evoTitle').textContent }; }, S0.uid);
  ok(r.stage === S0.stage + 1 && r.forms === r.stage && !(r.gems[S0.gem] > 0) && r.crystals === 1500 && /evolved/.test(r.title), 'the party member evolves: a new stage and form; the gemstone and 500 crystals spent ' + JSON.stringify(r));
  await M(() => document.querySelector('#evoDone').click()); await page.waitForTimeout(400);
  r = await M(() => ({ kind: window.__pp.sheetKind, box: (document.querySelector('.tm-evo') || {}).textContent || '' }));
  ok(r.kind === 'team' && /needs a|bond|crystals|final/.test(r.box), 'back on the Team sheet, the box shows the next stage\'s needs ' + JSON.stringify(r.box));
  // not ready: the button explains instead
  await M(() => document.querySelector('.tm-evo [data-go="team-evolve"]') && document.querySelector('.tm-evo [data-go="team-evolve"]').click()); await page.waitForTimeout(300);
  r = await M(() => ({ toast: (document.querySelector('.toast') || {}).textContent || '', shown: !document.querySelector('#evoWrap').hidden }));
  ok(!r.shown && /needs|crystals/.test(r.toast), 'not ready: no ceremony, a toast says what is missing ' + JSON.stringify(r.toast));
  // close: the run carries on
  await M(() => document.querySelector('[data-sheet-close]').click()); await page.waitForTimeout(500);
  r = await M(() => ({ paused: window.__pp.arc.paused, state: window.__pp.arc.state })); ok(!r.paused && r.state === 'play', 'closing the sheet: the run carries on');
  ok(!errors.length, 'no page errors ' + errors.slice(0, 3).join(' | '));
  console.log(fails ? `${fails} FAILED` : 'all passed'); process.exit(fails ? 1 : 0);
})();
