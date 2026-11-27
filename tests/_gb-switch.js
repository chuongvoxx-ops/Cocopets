// v468 GB: switching pets mid-encounter keeps everything: a second party member (a copy of the bot), switched in during Celestial
// Pursuit (the phantom keeps its place and hunts the new pet; the timer runs on) and after a failure (the seal stays shattered,
// the counter stays). HTML=test-gb.html node tests/_gb-switch.js
const { open } = require('./_gb-lib');
(async () => {
  const H = await open({ lvl: 40 }); let bad = 0; const chk = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
  try {
    await H.M(() => { const P = window.__pp, st = P.st, o = JSON.parse(JSON.stringify(Object.assign({}, st, { others: [], party: [] }))); o.uid = 'gbtwin'; o.name = 'Twin'; st.others = st.others || []; st.others.push(o); st.party = ['gbtwin']; });
    await H.start(); await H.fight();
    const r = await H.ev(`const n = D.party.length; if (n < 2) return { n };
      const s = T.S; GB.begin(s.X, s.H, s.self, s.A); T.skipIntro(); step(0.3); T.start(1); T.markFail(1, 'test');
      const f0 = T.S.failN; for (let i = 2; i < 4; i++) T.S.res[i] = 'pass'; T.S.res[1] = 'fail'; T.S.mech = null; T.S.mode = 'fight'; T.start(4); step(4.0);
      const Mx = T.S.mech, A = Mx.data.ph[Mx.data.cur], before = { t: +Mx.t.toFixed(2), px: +A.x.toFixed(2), py: +A.y.toFixed(2), st: A.st, cur: D.cur() };
      g.swapCd = 0; const ok = D.switchTo(1 - D.cur()); step(1 / 30);
      const after = { t: +Mx.t.toFixed(2), px: +A.x.toFixed(2), py: +A.y.toFixed(2), st: A.st, cur: D.cur(), same: T.S.mech === Mx };
      step(1.5); const dx = me.x - A.x, dy = me.y - A.y, h = A.h, toward = Math.cos(Math.atan2(dy, dx) - h);
      return { n, ok, f0, failN: T.S.failN, before, after, chasing: +toward.toFixed(2), res1: T.S.res[1] };`);
    console.log(JSON.stringify(r));
    if (r.n < 2) console.log('NOTE: party of one: switching not tested');
    else { chk(r.ok, 'switched'); chk(r.after.same && Math.abs(r.after.t - r.before.t) < 0.1, 'the mechanic and its timer go on'); chk(Math.hypot(r.after.px - r.before.px, r.after.py - r.before.py) < 0.3, 'the phantom keeps its place'); chk(r.chasing > 0.5, 'it hunts the new pet'); chk(r.failN === 1 && r.res1 === 'fail', 'the seal stays shattered'); }
  } catch (e) { bad++; console.log('ERR', e.message); }
  console.log('errors', JSON.stringify(H.errors.slice(0, 6)));
  await H.browser.close(); console.log(bad || H.errors.length ? 'SWITCH FAIL' : 'SWITCH OK');
})();
