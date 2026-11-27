// v469 GB: switching pets mid-fight keeps everything: a second party member (a copy of the bot), switched in during Opposing
// Heavens: the judgement, its wave and its timer run on. HTML=test-gb.html node tests/_gb-switch.js
const { open } = require('./_gb-lib');
(async () => {
  const H = await open({ lvl: 40 }); let bad = 0; const chk = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  try {
    await H.M(() => { const P = window.__pp, st = P.st, o = JSON.parse(JSON.stringify(Object.assign({}, st, { others: [], party: [] }))); o.uid = 'gbtwin'; o.name = 'Twin'; st.others = st.others || []; st.others.push(o); st.party = ['gbtwin']; });
    await H.start(); await H.fight();
    const r = await H.ev(`const n = D.party.length; if (n < 2) return { n };
      const s = T.S; GB.begin(s.X, s.H, s.self, s.A); T.skipIntro(); step(0.3); T.noBig(true); T.start(1); step(4.0);
      const Mx = T.S.mech, before = { t: +Mx.t.toFixed(2), wave: Mx.data.wi, cur: D.cur() };
      g.swapCd = 0; const ok = D.switchTo(1 - D.cur()); step(1 / 30);
      const after = { t: +Mx.t.toFixed(2), wave: Mx.data.wi, cur: D.cur(), same: T.S.mech === Mx };
      step(20); return { n, ok, before, after, ended: T.S.mech !== Mx, mode: T.S.mode };`);
    console.log(JSON.stringify(r));
    if (r.n < 2) console.log('NOTE: party of one: switching not tested');
    else { chk(r.ok, 'switched'); chk(r.after.same && Math.abs(r.after.t - r.before.t) < 0.1 && r.after.wave === r.before.wave, 'the judgement and its timer go on'); chk(r.ended && r.mode !== 'intro', 'it ends normally'); }
  } catch (e) { bad++; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(bad || H.errors.length ? 'SWITCH FAIL' : 'SWITCH OK');
})();
