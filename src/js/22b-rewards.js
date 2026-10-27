/* ---------- the welcome gift and the daily rewards ----------
   Welcome (a new player, once): 1000 crystals, a treasure box, and three gemstones for evolving (the one the pet needs
   next among them). Daily rewards: a calendar for each month; each day the player comes home they claim the next day on
   it: 100 crystals every third day, goodies between (gemstones, the foods that level pets, coins, pearls, drinks, bond
   treats, a Fusion Stone, treasure boxes), and on the month's last day 1000 crystals. A new month starts over.
   st.welcome: 0 waiting, 1 given. st.login: { m: 'YYYY-MM', n: days claimed this month, last: day of the last claim,
   seen: day the calendar last opened by itself } */
const LOGIN_FINAL = 1000, LOGIN_CRYSTALS = 100;
// the goodies between the crystal days, by day of the claim (a crystal day every third)
const LOGIN_GOODS = {
  1: [{ kind: 'coins', n: 200 }], 2: [{ kind: 'gem' }], 4: [{ kind: 'food', crop: 'honeycomb', n: 1 }], 5: [{ kind: 'drink', id: 'soda' }, { kind: 'drink', id: 'tea' }],
  7: [{ kind: 'food', crop: 'ambrosia', n: 2 }], 8: [{ kind: 'pearls', n: 20 }], 10: [{ kind: 'gem' }, { kind: 'gem' }], 11: [{ kind: 'food', crop: 'hearttart', n: 1 }],
  13: [{ kind: 'stones', n: 1 }], 14: [{ kind: 'box' }], 16: [{ kind: 'coins', n: 400 }], 17: [{ kind: 'food', crop: 'honeycomb', n: 2 }],
  19: [{ kind: 'gem' }], 20: [{ kind: 'food', crop: 'sundae', n: 1 }], 22: [{ kind: 'pearls', n: 30 }], 23: [{ kind: 'food', crop: 'feast', n: 1 }],
  25: [{ kind: 'gem' }, { kind: 'gem' }], 26: [{ kind: 'food', crop: 'ambrosia', n: 3 }], 28: [{ kind: 'box' }], 29: [{ kind: 'coins', n: 500 }], 31: [{ kind: 'pearls', n: 50 }],
};
const monthKey = t => dayKey(t).slice(0, 7);
const daysInMonth = t => { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(); };
const lastDayOfMonth = t => new Date(t).getDate() === daysInMonth(t);
/* what day i of the month brings (the last calendar day always brings the month's final reward) */
function loginPlan(i, final) { if (final) return [{ kind: 'crystals', n: LOGIN_FINAL }]; if (i % 3 === 0) return [{ kind: 'crystals', n: LOGIN_CRYSTALS }]; return LOGIN_GOODS[i] || [{ kind: 'coins', n: 150 }]; }
// a gemstone for evolving: the one the pet needs next if it still needs it, otherwise any
function rewardGem() { const e = evoStatus(); if (e && !e.gemOk && Math.random() < 0.6) return e.nx.gem; return wkeyR(Math.random, GIFT_GEMS); }
/* give a planned reward; returns the tiles the gift screen shows */
function grantReward(r) {
  if (r.kind === 'crystals') { st.crystals = (st.crystals || 0) + r.n; return [r]; }
  if (r.kind === 'coins') { st.coins += r.n; return [r]; }
  if (r.kind === 'pearls') { st.pearls += r.n; return [r]; }
  if (r.kind === 'gem') { const g = r.gem || rewardGem(); st.gems[g] = Math.min(99, (st.gems[g] || 0) + 1); return [{ kind: 'gem', gem: g }]; }
  if (r.kind === 'food') { st.pantry[r.crop] = Math.min(999, (st.pantry[r.crop] || 0) + r.n); return [r]; }
  if (r.kind === 'drink') { st.pantry[r.id] = Math.min(999, (st.pantry[r.id] || 0) + 1); return [r]; }
  if (r.kind === 'stones') { st.fusionStones = Math.min(999, (st.fusionStones || 0) + r.n); return [r]; }
  if (r.kind === 'box') return applyGiftBox(rollGiftBox(Math.random, st.dun.pity || 0));
  return [];
}
// the small picture and words for a reward on the calendar
function rewardChip(r) {
  if (r.kind === 'crystals') return [ICON.crystal, `${fmtNum(r.n)}`];
  if (r.kind === 'coins') return [ICON.coin, `${r.n}`];
  if (r.kind === 'pearls') return [ICON.pearl, `${r.n}`];
  if (r.kind === 'gem') return [gemSVG(r.gem || 'quartz'), 'Gem'];
  if (r.kind === 'food') return [SNACK_SVG[r.crop], `×${r.n}`];
  if (r.kind === 'drink') return [SNACK_SVG[r.id], 'Drink'];
  if (r.kind === 'stones') return [ICON.fusion, 'Stone'];
  if (r.kind === 'box') return [ICON.gift, 'Box'];
  return ['', ''];
}
const loginState = () => (st.login || (st.login = { m: '', n: 0, last: '', seen: '' }));
function loginToday() {
  const now = Date.now(), L = loginState(), m = monthKey(now);
  if (L.m !== m) { L.m = m; L.n = 0; }
  return { now, L, today: dayKey(now), can: L.last !== dayKey(now), next: L.n + 1, final: lastDayOfMonth(now), days: daysInMonth(now) };
}
/* the calendar: every day of this month's plan, the claimed ones ticked, today's waiting with Collect */
function openLogin() {
  const T = loginToday(), cells = [];
  for (let i = 1; i <= T.days; i++) {
    const fin = i === T.days, plan = fin ? [{ kind: 'crystals', n: LOGIN_FINAL }] : loginPlan(i, false), [ico, txt] = rewardChip(plan[0]), done = i <= T.L.n, now = T.can && i === T.next;
    cells.push(`<div class="lg-day${done ? ' done' : ''}${now ? ' now' : ''}${fin ? ' fin' : ''}${plan[0].kind === 'crystals' ? ' cr' : ''}"><small>Day ${i}</small><span class="lg-ico">${ico}</span><b>${txt}${plan.length > 1 ? ' +' : ''}</b>${done ? '<i class="lg-tick">✓</i>' : ''}</div>`);
  }
  const todayPlan = T.can ? loginPlan(T.next, T.final) : null;
  openSheet('login', `
    <p class="eyebrow">Daily rewards</p><h2 class="title" id="sheetTitle">${new Date(T.now).toLocaleString(undefined, { month: 'long' })} rewards</h2>
    <p class="note">Come home each day to collect the next reward: ${LOGIN_CRYSTALS} crystals every third day, goodies in between, and <b>${fmtNum(LOGIN_FINAL)} crystals</b> on the last day of the month. Then it starts over.</p>
    <div class="lg-grid">${cells.join('')}</div>
    <div class="evo-actions">${todayPlan ? `<button class="btn primary" type="button" data-go="login-claim">${T.final ? `Collect the month's ${fmtNum(LOGIN_FINAL)} crystals` : `Collect day ${T.next}`}</button>` : `<p class="note">Today's reward is collected. Come back tomorrow for day ${T.L.n + 1}.</p>`}</div>`);
}
function claimLogin() {
  const T = loginToday(); if (!T.can) { openLogin(); return; }
  const plan = loginPlan(T.next, T.final), items = [];
  plan.forEach(r => grantReward(r).forEach(x => items.push(x)));
  T.L.n = T.next; T.L.last = T.today; T.L.seen = T.today;
  closeSheet(); saveLocalNow(); updateHud();
  playGiftCeremony(items, { title: T.final ? 'The month\'s reward!' : `Day ${T.next} reward`, sub: T.final ? `${fmtNum(LOGIN_FINAL)} crystals for the end of the month · a new calendar starts tomorrow` : `Day ${T.next} of ${T.days}${(T.next + 1) % 3 === 0 && T.next + 1 < T.days ? ` · tomorrow: ${LOGIN_CRYSTALS} crystals` : ''}` });
}
/* the welcome gift */
function giveWelcome() {
  st.welcome = 1; const items = [];
  [{ kind: 'crystals', n: 1000 }, { kind: 'gem' }, { kind: 'gem' }, { kind: 'gem' }].forEach(r => grantReward(r).forEach(x => items.push(x)));
  const e = evoStatus(); if (e && !items.some(x => x.kind === 'gem' && x.gem === e.nx.gem)) { const g = items.find(x => x.kind === 'gem'); st.gems[g.gem]--; g.gem = e.nx.gem; st.gems[g.gem] = Math.min(99, (st.gems[g.gem] || 0) + 1); }
  grantReward({ kind: 'box' }).forEach(x => items.push(x));
  saveLocalNow(); updateHud();
  playGiftCeremony(items, { title: 'Welcome to Cocopets!', sub: '1000 crystals, a treasure box and gemstones for evolving: a gift to start you off' });
}
/* at home with nothing else open: the welcome gift first; then, once a day, the calendar */
function rewardsCheck() {
  if (!st || !running || adopting || (typeof arc !== 'undefined' && arc.open) || sheetKind || !giftWrap.hidden || mapOpen || !introEl.hidden) return;
  if (st.welcome === 0) { giveWelcome(); return; }
  const T = loginToday(); if (T.can && T.L.seen !== T.today) { T.L.seen = T.today; saveSoon(); openLogin(); }
}
setInterval(rewardsCheck, 1500);
