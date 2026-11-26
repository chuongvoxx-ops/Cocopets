// (v463 SK) Khyros's numbers, measured: its bar (maxhp), a flat blow of 1000 on its body and on its bared slits (effective health =
// maxhp / the share a blow takes), the phase cuts (where phases two and three begin, as a share of the bar), its m.dmg and the pet's loss
// from each of its attacks (god mode off, the pet's defences as a fresh level-42 pet). Run on a before build and an after build.
// env: HTML (test-sk.html)
const { openSK } = require('./_sk-lib');
(async () => {
  const G = await openSK({ gl: false }); const { ev } = G; await ev(`P.st.dun.god = false;`); await G.start();
  let r = await ev(`const bb = b || D.M.bossAt; me.x = bb.x + 1; me.y = bb.y + 5; let i = 0; while (!b && i++ < 200) adv(0.05); adv(5); until('prowl', 10);
    const K = D.F.rift && D.F.rift.foeK, fd = D.F.fiend; const out = { maxhp: Math.round(b.maxhp), mdmg: +b.dmg.toFixed(2), fdDmgK: fd.dmgK || 1, foeK: K || null };
    M.fade = M.fadeTo = 0; b.under = false; let h0 = b.hp; D.hitMon(b, 1000, { flat: true }); out.body = +(h0 - b.hp).toFixed(1);
    // stuck: the slits bared
    b.stunT = 3; M.stuck = 1; adv(0.1); const w = FX.S.weak.slits; h0 = b.hp; if (w) D.hitMon(w, 1000, { flat: true }); out.slits = +(h0 - b.hp).toFixed(1); out.effHp = Math.round(b.maxhp * 1000 / out.body); b.stunT = 0; adv(0.1);
    b.hp = b.maxhp * 0.71; adv(0.2); out.p71 = FX.S.phase; b.hp = b.maxhp * 0.69; adv(0.4); out.p69 = FX.S.phase; adv(3); b.hp = b.maxhp * 0.36; adv(0.2); out.p36 = FX.S.phase; b.hp = b.maxhp * 0.34; adv(0.4); out.p34 = FX.S.phase; adv(3);
    return out;`);
  console.log('numbers', JSON.stringify(r));
  // the pet's loss from each attack: god off, full health, the act forced, the pet standing in its way
  const loss = await ev(`P.st.dun.god = false; const res = {}; const hit = (fn, name, n) => { me.hp = 1e7; const h0 = me.hp; let dl = 0; me.inv = 0; me.invT = 0; for (let i = 0; i < (n || 80); i++) { if (fn) fn(i); U.update(0.05); dl = Math.max(dl, h0 - me.hp); if (dl > 0) break; } res[name] = Math.round(dl); me.hp = D.ST.hp; me.inv = 0; };
    // the lunge: a lane at the pet, the pet held on it
    b.stunT = 0; until('angle'); let L = null; hit(() => { const s = FX.S.tele.find(s => (s.geo || s.shape) === 'line'); if (s) L = s; if (L && !M.lg) { me.x = L.x + Math.cos(L.a) * (L.len * 0.7); me.y = L.y + Math.sin(L.a) * (L.len * 0.7); } else if (M.lg) { me.x = b.x + M.lg.L.dx * 2; me.y = b.y + M.lg.L.dy * 2; } me.vx = me.vy = 0; }, 'lunge', 120); adv(2);
    // the jaw: the pet in the cone
    M.fade = M.fadeTo = 0; let okS = false; for (let k = 0; k < 40 && !okS; k++) { me.x = b.x + Math.cos(M.hd) * 3.2; me.y = b.y + Math.sin(M.hd) * 3.2; okS = until('snap', 200); } const cs = FX.S.tele.find(s => (s.geo || s.shape) === 'cone'); hit(() => { if (cs) { me.x = cs.x + Math.cos(cs.a) * 2.5; me.y = cs.y + Math.sin(cs.a) * 2.5; } }, 'snap', 60); adv(2);
    // the spears: the pet on the first ring
    let okP = false; for (let k = 0; k < 40 && !okP; k++) { me.x = b.x + 5; me.y = b.y + 2; okP = until('spears', 300); } const s0 = FX.S.tele.find(s => (s.geo || s.shape) === 'circle'); res.spearAct = okP; res.spearRing = !!s0; hit(() => { if (s0 && !s0.done) { me.x = s0.x; me.y = s0.y; } }, 'spear', 60); adv(2);
    P.st.dun.god = true; return res;`);
  console.log('blows', JSON.stringify(loss));
  console.log('errors', G.errors.length, G.errors.slice(0, 3)); await G.browser.close();
})();
