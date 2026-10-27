/* ---------- Team: from home, choose who climbs the Tower together and dress every pet (its abilities and its
   accessories) without changing which one you play. Every pet's own cards and pieces work for it in the Tower ---------- */
let teamUid = null;
/* the Team sheet opened in the middle of a run (the Team button by the health bars, in the Tower and the rifts): the run
   waits; on closing, the party it plays is rebuilt from what was changed */
let runTeam = false;
function openRunTeam() {
  if (!st || !arc.open || arc.state !== 'play' || !arc.game || !arc.game.reparty) return;
  runTeam = true; arc.paused = true; document.body.classList.add('run-team'); sfx.boop();
  Object.keys(arc.keys).forEach(k => { arc.keys[k] = false; });
  openTeam(st.uid);
}
function endRunTeam() {
  if (!runTeam) return; runTeam = false; document.body.classList.remove('run-team');
  try { if (arc.game && arc.game.reparty) arc.game.reparty(); } catch (e) { console.error(e); }
  if (arc.open && arc.state === 'play' && arcPanel.hidden) { arc.paused = false; arc.last = performance.now(); }
}
function teamPet() {
  if (!st) return null;
  const p = teamUid ? (teamUid === st.uid ? st : (st.others || []).find(o => o.uid === teamUid)) : null;
  return p || st;
}
function openTeam(uid) {
  if (!st) return;
  if (uid) teamUid = uid;
  if (!teamUid || !(teamUid === st.uid || st.others.some(o => o.uid === teamUid))) teamUid = st.uid;
  openSheet('team', ''); renderTeam();
}
const teamSlotHTML = (sl, a) => {
  if (!a) return `<button class="dslot locked" type="button" aria-disabled="true"><span class="ds-art ds-lock">${ICON.lock || '?'}</span><span class="ds-copy"><small>${SLOT_INFO[sl].name}</small><b>Locked</b><em>Evolve to ${SLOT_INFO[sl].unlock} to unlock</em></span></button>`;
  const E = ELEMENTS[a.el] || ELEMENTS.spark;
  return `<button class="dslot" type="button" data-go="team-slot" data-slot="${sl}" aria-label="${SLOT_INFO[sl].name}: ${esc(a.name)}. Change"><span class="ds-art" style="--ec:${E.color};--ed:${E.dark}">${glyphSVG(a.glyph)}</span><span class="ds-copy"><small>${SLOT_INFO[sl].name}</small><b>${esc(a.name)}</b><em>${a.own ? (a.star ? `${a.star}★ signature` : 'Own ability') : `${CARD_R[a.r].name} card · Lv ${a.lv}`}${a.cost ? ` · ${a.cost} MP` : ' · tap to fire'}</em></span><span class="ds-go">${ICON.next || ''}</span></button>`;
};
function renderTeam() {
  if (sheetKind !== 'team' || !st) return;
  const P = teamPet(), party = partyPets(), inP = party.includes(P), lead = P === st, K = petKit(P), S = K.stats, el = petElement(P);
  const full = party.length >= PARTY_MAX;
  // the party: four places, the pet you play first
  const slots = party.map((p, i) => `<button class="pt-pet on${p === st ? ' lead' : ''}${p === P ? ' sel' : ''}" type="button" data-go="team-pick" data-uid="${p.uid}" aria-pressed="${p === P}" aria-label="${esc(p.name)}${p === st ? ', the pet you play' : `, party member ${i}`}"><span class="pt-art">${petSVG(formOf(p), { frame: 'fit' })}</span><b>${esc(p.name)}</b><small><em class="rx-el small tm-dot" style="--ec:${E8[petElement(p)].color}" title="${E8[petElement(p)].name}"><i></i></em>Lv ${p.dlv || 1}</small><i class="pt-badge">${p === st ? 'YOU' : i}</i></button>`);
  while (slots.length < PARTY_MAX) slots.push(`<div class="pt-pet empty"><span class="pt-art pt-empty">${ICON.sparkle}</span><b>Empty</b><small>add a pet</small></div>`);
  // every pet you have, to pick the one to dress
  const all = [{ p: st, i: -1 }].concat(st.others.map((p, i) => ({ p, i })));
  const grid = pocketGridHTML(all, { cls: 'scroll team-grid', cur: p => p === P, on: p => party.includes(p), attr: p => `data-go="team-pick" data-uid="${p.uid}" aria-pressed="${p === P}"`, badge: p => party.includes(p) ? `<em class="pk-badge">${p === st ? 'YOU' : 'P' + party.indexOf(p)}</em>` : '' });
  // what the chosen pet can do about the party
  const partyBtn = lead ? `<span class="tm-tag">${ICON.star}You play ${esc(P.name)}</span>`
    : inP ? `<button class="btn small" type="button" data-go="team-party" data-uid="${P.uid}">Take out of the party</button>`
    : `<button class="btn small primary" type="button" data-go="team-party" data-uid="${P.uid}"${full ? ' aria-disabled="true"' : ''}>${full ? 'The party is full' : 'Add to the party'}</button>`;
  const leadBtn = lead || runTeam ? '' : `<button class="btn small" type="button" data-go="team-lead" data-uid="${P.uid}">${ICON.paw || ''}Play as ${esc(P.name)}</button>`;
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    <p class="eyebrow">Party and loadout · ${petCount()} pet${petCount() > 1 ? 's' : ''}</p><h2 class="title" id="sheetTitle">Team</h2>
    ${runTeam ? '<p class="note tm-run"><b>The run is paused.</b> Change the party, abilities and accessories, or feed a pet to level it: close this sheet to carry on with the changes.</p>' : ''}<p class="note">Up to four pets climb the Tower together. Pick any pet to choose its abilities and accessories: what each one wears works for it whenever it fights, leader or not.</p>
    <section class="dun-box team-panel">
      <div class="mb-top"><h3 class="sec">Party</h3><span class="mono">${party.length}/${PARTY_MAX}</span></div>
      <div class="party-grid four">${slots.join('')}</div>
      <div class="tm-sel">
        <div class="dp-top">
          <span class="dp-portrait">${petSVG(formOf(P), { frame: 'fit' })}<i class="dp-lv">${S.L}</i></span>
          <div class="dp-id"><b>${esc(P.name)} ${starsHTML(starsOf(P.rarity))}</b><span>Level ${S.L} · ${STAGES[P.stage].name} · <em class="rx-el small" style="--ec:${E8[el].color}"><i></i>${E8[el].name}</em></span><span>${lead ? 'The pet you play: it leads the party' : inP ? `In the party (P${party.indexOf(P)})` : 'Resting in the pocket'}</span></div>
        </div>
        <div class="dp-stats"><span class="hp">HP <b>${S.hp}</b></span><span class="mp">MP <b>${S.mp}</b></span><span class="at">Power <b>${S.atk}</b></span></div>
        <div class="dp-row tm-acts">${partyBtn}${leadBtn}</div>
        ${teamEvoHTML(P)}
      </div>
      <h3 class="sec tm-sec">Abilities</h3>
      <div class="dp-slots">${SLOTS.map(sl => teamSlotHTML(sl, K.kit[sl])).join('')}${animaChip('data-go="team-anima"')}</div>
      <p class="note tm-anote">The Animas answer the whole party, whoever leads: tap to bind them.</p>
      ${accRowHTML(P, { go: 'team-acc' })}
      <p class="note dp-sig"><b>Signature: ${esc(K.AB.twistName)}.</b> ${esc(K.AB.twistDesc)}</p>
      <h3 class="sec tm-sec">Feed ${esc(P.name)}</h3>
      ${teamFeedHTML(P)}
    </section>
    <div class="mb-top tm-all"><h3 class="sec">All pets</h3><span class="mono">tap one to dress it</span></div>
    ${grid}
    <div class="evo-actions"><button class="btn" type="button" data-go="team-anima">${ICON.star}Animas</button><button class="btn" type="button" data-go="team-cards">${ICON.cards || ICON.card}Card collection</button></div>`;
}
/* feeding any pet from the pantry: its level and its bond, with every food that does either, and the Shop for more */
function teamFeedHTML(P) {
  const L = P.dlv || 1, need = dunXpNeed(L), have = P.dxp || 0, maxed = L >= DLV_MAX, B = bondInfo(P.xp || 0);
  const keys = Object.keys(SNACKS).filter(k => (st.pantry[k] || 0) > 0 && !SNACKS[k].drink);
  return `<div class="feed-panel tm-feed"><div class="fp-top"><span><b>Level ${L}</b>${maxed ? ' · max' : ` · ${fmtNum(Math.max(0, need - have))} XP to ${L + 1}`}</span><span><b>Bond ${B.level}</b> · ${fmtNum(B.into)} / ${fmtNum(B.need)}</span></div>
    <span class="bar fp-bar"><i style="width:${clamp(have / need * 100, 0, 100).toFixed(1)}%"></i></span>
    ${keys.length ? `<div class="fp-row">${keys.map(k => `<button class="btn small" type="button" data-go="team-feed" data-k="${k}"${maxed && !SNACKS[k].bondLv ? ' disabled' : ''}>${SNACK_SVG[k] || ''}${esc(SNACKS[k].name)} <span class="mono">×${st.pantry[k]}</span><small>${foodEffect(k, P)}</small></button>`).join('')}</div>` : '<p class="note">Nothing in the pantry yet.</p>'}
    <div class="dp-row"><button class="btn small" type="button" data-go="shop">${ICON.gift}Shop for food</button></div></div>`;
}
/* in or out of the party; the pet you play is always in */
function teamToggleParty(uid) {
  if (!st || uid === st.uid) return;
  if (togglePartyPet(uid)) { sfx.boop(); if (typeof buildCompanions === 'function') buildCompanions(); renderTeam(); renderDungeon(); }
  else { sfx.wrong(); toast(`The party is full (${PARTY_MAX}). Take someone out first.`); }
}
/* play as another pet: it leads the party from now on */
function teamLead(uid) {
  if (!st || uid === st.uid) return;
  const i = st.others.findIndex(o => o.uid === uid); if (i < 0) return;
  switchPet(i); teamUid = uid; renderTeam(); renderDungeon();
}
/* evolving any pet from the Team sheet (also in the middle of a run, from the pause): where it stands, what the next
   stage needs (bond, its gemstone, crystals) and the button, the same ceremony as evolving from its card */
const aOr = w => (/^[AEIOU]/i.test(w) ? 'an ' : 'a ') + w;
function teamEvoHTML(P) {
  const e = evoStatusOf(P), cur = STAGES[P.stage];
  if (!e) return `<div class="dp-evobox done tm-evo"><span class="dpe-ic">${ICON.star}</span><div><b>Evolution</b><span>${esc(P.name)} has reached the final stage: ${esc(cur.name)}.</span></div></div>`;
  const ok = e.bondOk && e.gemOk && e.crystalOk, g = GEMS[e.nx.gem];
  const need = [!e.bondOk ? `bond ${e.level}/${e.nx.bond}` : '', !e.gemOk ? `needs ${aOr(g.name)}` : '', !e.crystalOk ? `${fmtNum(st.crystals || 0)}/${EVO_CRYSTALS} crystals` : ''].filter(Boolean).join(' · ');
  return `<div class="dp-evobox tm-evo${ok ? ' ready' : ''}"><span class="dpe-ic">${gemSVG(e.nx.gem)}</span><div><b>Evolution</b><span>${esc(cur.name)} → ${esc(e.nx.name)} · stage ${e.nx.n} of 7</span><small>${ok ? `Ready: uses ${esc(aOr(g.name))} and ${EVO_CRYSTALS} crystals` : esc(need)}</small></div>
    <button class="btn small${ok ? ' primary' : ''}" type="button" data-go="team-evolve" data-uid="${P.uid}"${ok ? '' : ' aria-disabled="true"'}>Evolve <span class="mono">${ICON.crystal}${EVO_CRYSTALS}</span></button></div>`;
}
function teamEvolve(uid) {
  if (!st || evolving) return;
  const P = uid === st.uid ? st : (st.others || []).find(o => o.uid === uid); if (!P) return;
  const e = evoStatusOf(P); if (!e) return;
  if (!(e.bondOk && e.gemOk && e.crystalOk)) { sfx.wrong(); const g = GEMS[e.nx.gem]; toast(!e.gemOk ? `${P.name} needs ${aOr(g.name)}: clear ${gemStageText(e.nx.gem)} on the adventure map` : !e.bondOk ? `${P.name} needs bond ${e.nx.bond} (now ${e.level}): feed it and play together` : `Evolving needs ${EVO_CRYSTALS} crystals (you have ${fmtNum(st.crystals || 0)})`); return; }
  evolve(null, false, P);
}
