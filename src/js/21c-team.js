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
/* ---------- v460 META: the Pets & Team hub ----------
   One sheet for what were three: Team (the party, every pet's abilities, accessories, feeding, evolving), the pet card
   (who a pet is: identity, evolution line, bond, traits, its space ability, its record, renaming; and the game's
   settings) and the pocket dimension (the whole collection, Fusion Stones, fusing, eggs). One source of state: the pet
   shown (teamUid, any pet you own) and the area (hubArea); the party strip, the pet's live stage and the collection grid
   are on every area. Tap a pet anywhere to inspect it; double-tap (or double-click) a pet's icon to play as it (hubDbl,
   21e). Every old way in opens its area: Team → 'team', the card (name tag) → 'card', the pocket → 'pets' */
let hubArea = 'team';
const HUB_AREAS = [['team', 'Team'], ['card', 'Pet card'], ['pets', 'Collection']];
function openHub(area, uid) {
  if (!st) return;
  hubArea = HUB_AREAS.some(a => a[0] === area) ? area : 'team';
  if (uid) teamUid = uid;
  if (!teamUid || !(teamUid === st.uid || st.others.some(o => o.uid === teamUid))) teamUid = st.uid;
  openSheet('team', ''); renderTeam();
  clearInterval(sheetTimer); sheetTimer = setInterval(() => { if (sheetKind === 'team' && hubArea === 'card') renderCardLive(); }, 1000);
}
function hubSetArea(area) { if (!HUB_AREAS.some(a => a[0] === area) || area === hubArea) return; hubArea = area; sfx.boop(); renderTeam(); try { const t = $('.hub-tabs', sheetEl); if (t) t.scrollIntoView({ block: 'start' }); } catch (e) {} }
function openTeam(uid, area) { openHub(area || 'team', uid); }
/* (v391 K: a slot holding the pet's own skill says so: "Own skill", its element or star pool; a developer's pick says that) */
const teamSlotHTML = (sl, a) => {
  if (!a) return `<button class="dslot locked" type="button" aria-disabled="true"><span class="ds-art ds-lock">${ICON.lock || '?'}</span><span class="ds-copy"><small>${SLOT_INFO[sl].name}</small><b>Locked</b><em>Evolve to ${SLOT_INFO[sl].unlock} to unlock</em></span></button>`;
  const E = ELEMENTS[a.el] || ELEMENTS.spark;
  return `<button class="dslot" type="button" data-go="team-slot" data-slot="${sl}" aria-label="${SLOT_INFO[sl].name}: ${esc(a.name)}. Change"><span class="ds-art" style="--ec:${E.color};--ed:${E.dark}">${glyphSVG(a.glyph)}</span><span class="ds-copy"><small>${SLOT_INFO[sl].name}</small><b>${esc(a.name)}</b><em>${a.own ? (a.dev ? 'Developer pick' : a.skill ? `Own skill${a.e8 ? ` · ${E8[a.e8].name}` : a.star ? ` · ${a.star}★ move` : ''}` : a.star ? `${a.star}★ signature` : 'Own ability') : `${CARD_R[a.r].name} card · Lv ${a.lv}`}${a.cost ? ` · ${a.cost} MP` : ' · tap to fire'}</em></span><span class="ds-go">${ICON.next || ''}</span></button>`;
};
function renderTeam() {
  if (sheetKind !== 'team' || !st) return;
  const P = teamPet(), party = partyPets(), inP = party.includes(P), lead = P === st, K = petKit(P), S = K.stats, el = petElement(P);
  const full = party.length >= PARTY_MAX, area = hubArea;
  // the party: four places, the pet you play first (v460 META: double-tap one to play as it)
  const slots = party.map((p, i) => `<button class="pt-pet on${p === st ? ' lead' : ''}${p === P ? ' sel' : ''}" type="button" data-go="team-pick" data-uid="${p.uid}" data-dbl="${p.uid}" aria-pressed="${p === P}" aria-label="${esc(p.name)}${p === st ? ', the pet you play' : `, party member ${i}. Double-tap to play as it`}"><span class="pt-art">${petSVG(formOf(p), { frame: 'fit' })}</span><b>${esc(p.name)}</b><small><em class="rx-el small tm-dot" style="--ec:${E8[petElement(p)].color}" title="${E8[petElement(p)].name}"><i></i></em>Lv ${p.dlv || 1}</small><i class="pt-badge">${p === st ? 'YOU' : i}</i></button>`);
  while (slots.length < PARTY_MAX) slots.push(`<div class="pt-pet empty"><span class="pt-art pt-empty">${ICON.sparkle}</span><b>Empty</b><small>add a pet</small></div>`);
  // every pet you have: tap to inspect it, double-tap to play as it (v460 META: data-dbl, 21e)
  const all = [{ p: st, i: -1 }].concat(st.others.map((p, i) => ({ p, i })));
  const grid = pocketGridHTML(all, { cls: 'scroll team-grid' + (area === 'pets' ? ' hub-big' : ''), cur: p => p === P, on: p => party.includes(p), attr: p => `data-go="team-pick" data-uid="${p.uid}" data-dbl="${p.uid}" aria-pressed="${p === P}"`, badge: p => (p === st ? '<em class="pk-badge pk-you">YOU</em>' : party.includes(p) ? `<em class="pk-badge">P${party.indexOf(p)}</em>` : '') });
  // what the chosen pet can do about the party
  const partyBtn = lead ? `<span class="tm-tag">${ICON.star}You play ${esc(P.name)}</span>`
    : inP ? `<button class="btn small" type="button" data-go="team-party" data-uid="${P.uid}">Take out of the party</button>`
    : `<button class="btn small primary" type="button" data-go="team-party" data-uid="${P.uid}"${full ? ' aria-disabled="true"' : ''}>${full ? 'The party is full' : 'Add to the party'}</button>`;
  const leadBtn = lead ? '' : runTeam ? (inP ? `<button class="btn small" type="button" data-go="team-lead" data-uid="${P.uid}">${ICON.paw || ''}Lead the run as ${esc(P.name)}</button>` : '') : `<button class="btn small" type="button" data-go="team-lead" data-uid="${P.uid}">${ICON.paw || ''}Play as ${esc(P.name)}</button>`;
  const status = lead ? 'The pet you play: it leads the party' : inP ? `In the party (P${party.indexOf(P)})` : 'Resting in the pocket';
  const sel = `<div class="tm-sel">
        ${teamStageHTML(P, S.L)}
        <p class="tm-status">${status}</p>
        <div class="dp-stats"><span class="hp">HP <b>${S.hp}</b></span><span class="mp">MP <b>${S.mp}</b></span><span class="at">Power <b>${S.atk}</b></span></div>
        <div class="dp-row tm-acts">${partyBtn}${leadBtn}</div>
        ${teamEvoHTML(P)}
      </div>`;
  const tabs = `<div class="hub-tabs" role="tablist" aria-label="Pets and Team">${HUB_AREAS.map(([k, l]) => `<button class="hub-tab" role="tab" type="button" data-go="hub-tab" data-a="${k}" aria-selected="${area === k}">${k === 'team' ? ICON.team : k === 'card' ? ICON.card : ICON.sparkle}<span>${l}</span></button>`).join('')}</div>`;
  let body = '';
  if (area === 'team') body = `<section class="dun-box team-panel">
      <div class="mb-top"><h3 class="sec">Party</h3><span class="mono">${party.length}/${PARTY_MAX}</span></div>
      <div class="party-grid four">${slots.join('')}</div>
      ${sel}
      <h3 class="sec tm-sec">Abilities</h3>
      <div class="dp-slots">${SLOTS.map(sl => teamSlotHTML(sl, K.kit[sl])).join('')}${animaChip('data-go="team-anima"')}</div>
      <p class="note tm-anote">The Animas answer the whole party, whoever leads: tap to bind them.</p>
      ${accRowHTML(P, { go: 'team-acc' })}
      <p class="note dp-sig"><b>Signature: ${esc(K.AB.twistName)}.</b> ${esc(K.AB.twistDesc)}</p>
      <h3 class="sec tm-sec">Feed ${esc(P.name)}</h3>
      ${teamFeedHTML(P)}
    </section>
    <div class="mb-top tm-all"><h3 class="sec">All pets</h3><span class="mono">tap: inspect · double-tap: play as</span></div>
    ${grid}`;
  else if (area === 'card') body = `<section class="dun-box team-panel">
      <div class="mb-top"><h3 class="sec">Party</h3><span class="mono">${party.length}/${PARTY_MAX}</span></div>
      <div class="party-grid four">${slots.join('')}</div>
      ${sel}
    </section>
    ${hubCardHTML(P)}
    <div class="mb-top tm-all"><h3 class="sec">All pets</h3><span class="mono">tap: inspect · double-tap: play as</span></div>
    ${grid}
    ${typeof cardSettingsHTML === 'function' && !runTeam ? cardSettingsHTML(true) : ''}`;   // (not mid-run: Start over, moving the save and the benchmark are for home)
  else body = `<section class="dun-box team-panel">
      <div class="mb-top"><h3 class="sec">Party</h3><span class="mono">${party.length}/${PARTY_MAX}</span></div>
      <div class="party-grid four">${slots.join('')}</div>
      ${hubPickHTML(P, partyBtn, leadBtn, status)}
    </section>
    ${hubInvHTML()}
    <div class="mb-top tm-all"><h3 class="sec">Collection · ${petCount()} of ${MAX_PETS}</h3><span class="mono">tap: inspect · double-tap: play as</span></div>
    ${grid}`;
  const keepY = sheetEl.scrollTop, gridY = ($('.team-grid', sheetEl) || {}).scrollTop || 0;   // (v460 META: a redraw keeps the sheet and the grid where they were, so a second tap lands on the same pet)
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    <p class="eyebrow">Pets &amp; Team · ${petCount()} pet${petCount() > 1 ? 's' : ''}</p><h2 class="title" id="sheetTitle">Pets &amp; Team</h2>
    ${runTeam ? '<p class="note tm-run"><b>The run is paused.</b> Change the party, abilities and accessories, or feed a pet to level it: close this sheet to carry on with the changes.</p>' : ''}
    ${tabs}
    ${area === 'team' ? '<p class="note">Up to four pets climb the Tower together. Pick any pet to choose its abilities and accessories: what each one wears works for it whenever it fights, leader or not.</p>' : ''}
    ${body}
    <div class="evo-actions"><button class="btn" type="button" data-go="team-anima">${ICON.star}Animas</button><button class="btn" type="button" data-go="team-cards">${ICON.cards || ICON.card}Card collection</button></div>`;
  sheetEl.scrollTop = keepY; { const gq = $('.team-grid', sheetEl); if (gq && gridY) gq.scrollTop = gridY; }
  if (area !== 'pets') teamStageMount(P);   // (the live stage: its canvas moves into this render, 21d)
  else if (typeof tsSleep === 'function') tsSleep();
}
/* the Collection area's inspector: the chosen pet small, with what can be done with it right here */
function hubPickHTML(P, partyBtn, leadBtn, status) {
  const E = E8[petElement(P)], ev = evoReadyOf(P);
  return `<div class="tm-sel hub-pick"><span class="hp-art">${petSVG(formOf(P), { frame: 'fit' })}</span>
    <div class="hp-copy"><b>${esc(P.name)}</b>${starsHTML(starsOf(P.rarity))}<small><em class="rx-el small" style="--ec:${E.color}"><i></i>${E.name}</em> · Lv ${P.dlv || 1} · Stage ${P.stage}${ev ? ' · can evolve' : ''}</small><small>${status}</small></div>
    <div class="dp-row tm-acts hp-acts">${partyBtn}${leadBtn}<button class="btn small" type="button" data-go="hub-tab" data-a="card">${ICON.card}Pet card</button><button class="btn small" type="button" data-go="hub-tab" data-a="team">${ICON.team}Abilities and gear</button>${petCount() >= 2 && !runTeam ? `<button class="btn small" type="button" data-go="hub-fuse" data-uid="${P.uid}">${ICON.fusion}Fuse ${esc(P.name)}</button>` : ''}</div></div>`;
}
/* the inventory: how many pets, stones and crystals; fusing, summoning, eggs (the old pocket dimension's box) */
function hubInvHTML() {
  const stones = st.fusionStones || 0, groups = typeof sameKindGroups === 'function' ? sameKindGroups().length : 0;
  return `<div class="box hub-inv"><div class="box-top"><span>Pets ${petCount()} / ${MAX_PETS}</span><span class="mono">${ICON.fusion}${stones} · ${ICON.crystal}${fmtNum(st.crystals || 0)}</span></div>
    <p class="note">The four party pets live in the house and walk the town; the rest rest in the pocket dimension, safe and happy.${groups ? ` ${groups} group${groups > 1 ? 's' : ''} of the same kind could merge.` : ''}</p>
    <div class="evo-actions hub-inv-acts">${runTeam ? '' : `<button class="btn small primary" type="button" data-go="fusion"${petCount() < 2 ? ' aria-disabled="true"' : ''}>${ICON.fusion}Fuse pets</button><button class="btn small" type="button" data-go="summon">${ICON.egg}Summon eggs</button><button class="btn small" type="button" data-go="stone-buy"${(st.crystals || 0) < FUSION_COST ? ' aria-disabled="true"' : ''}>${ICON.fusion}1 Fusion Stone · ${FUSION_COST}</button><button class="btn small" type="button" data-go="crystals">${ICON.crystal}Stone and crystal packs</button>`}</div></div>`;
}
/* the Pet card area: who the chosen pet is (the old pet card's identity, evolution line, bond, traits, space ability,
   record and tricks), for any pet you own; renaming it; and, for the pet you play, the evolution box with its reset */
function hubCardHTML(P) {
  const f = formOf(P), rr = RARITY[P.rarity] || RARITY[0], PE = persOf(P.dna.personality), b = bondInfo(P.xp || 0), own = P === st;
  const hatched = new Date(P.hatchedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const gems = GEM_ORDER.map(k => `<span class="gem-chip${st.gems[k] ? '' : ' zero'}">${gemSVG(k)}${st.gems[k] || 0}</span>`).join('');
  const traits = traitList(f).map(t => `<span class="trait" style="--rc:${RARITY[t.r].c}"><i></i>${esc(t.label)}</span>`).join('');
  const tStars = id => TRICK_STEPS.filter(n => ((P.tricks || {})[id] || 0) >= n).length;
  const tricks = TRICKS.map(t => `<li><b>${t.name}</b><span>${P.stage < t.stage ? `Unlocks at stage ${t.stage}` : `${t.how} · ${'★'.repeat(tStars(t.id))}${'☆'.repeat(5 - tStars(t.id))}`}</span></li>`).join('');
  let nodes = ''; for (let n = 1; n <= 7; n++) { const done = n <= P.stage, cur = n === P.stage, gk = STAGES[n].gem, fm = done ? P.forms[n - 1] : null; nodes += `<div class="evo-node${done ? ' done' : ''}${cur ? ' cur' : ''}" style="--gc:${gk ? GEMS[gk].color : 'var(--brass-hi)'}"><i>${fm ? petSVG(fm, { frame: 'fit' }) : (n === P.stage + 1 ? gemSVG(gk) : '<b class="q">?</b>')}</i><span>${STAGES[n].name}</span></div>`; }
  const wt = Math.round([0, 90, 160, 260, 380, 520, 680, 860][P.stage] * (P.dna.size || 1) + ((P.food || 0) - 50) * 0.5);
  const fed = dayGap(P.lastFedDay, dayKey(Date.now())) <= 1 ? (P.streak || 0) : 0;
  return `<div class="hub-card">
    <div class="card-head">
      <div class="portrait">${petSVG(f, { frame: 'fit' })}</div>
      <div class="card-id">
        <p class="eyebrow">${esc(speciesName(f))}</p>
        <h3 class="hc-name">${esc(P.name)}</h3>
        <p class="card-sub">${starsHTML(starsOf(P.rarity))}<span class="rarity" style="--rc:${rr.c}">${rr.name}</span><span>${PE.name} · hatched ${hatched}</span></p>
        <p class="dna mono">One of a kind · DNA ${dnaCode(f)}</p>${P.fusedFrom ? `<p class="dna mono">${ICON.fusion} Fused from ${esc(P.fusedFrom[0])} + ${esc(P.fusedFrom[1])} · gen ${P.gen}</p>` : ''}
      </div>
    </div>
    <form class="setting rename" id="renameForm"><label for="renameInput">Name</label><div class="row"><input id="renameInput" type="text" maxlength="14" autocomplete="off" spellcheck="false" value="${esc(P.name)}"><button class="btn" type="submit">Save</button></div></form>
    ${own && !runTeam ? evoSectionHTML() : `<div class="box"><div class="box-top"><span>Evolution · Stage ${P.stage} of 7</span><span class="mono">${STAGES[P.stage].name}</span></div><div class="evo-track">${nodes}</div><p class="note">Evolve ${esc(P.name)} with the Evolution button above: the same bond, gemstone and crystals as any pet.</p></div>`}
    <div class="box"><div class="box-top"><span>Bond level ${b.level}</span><span class="mono"${own ? ' id="cBondXp"' : ''}>${Math.floor(b.into)} / ${b.need}</span></div><span class="bar" style="margin-top:7px"><i${own ? ' id="cBondBar"' : ''} style="width:${(b.into / b.need * 100).toFixed(1)}%;background:var(--joy)"></i></span><p class="note">${esc(PE.desc)}</p></div>
    <h3 class="sec">Gem pouch</h3><div class="gem-pouch">${gems}</div>
    <h3 class="sec">Traits</h3><div class="traits">${traits}</div>
    <h3 class="sec">Space ability</h3><div class="box ab-box">${abilityHTML(applyAbOv(petAbility(f, P.dna.seed), P))}<p class="note">Used in Star Blaster on the Adventure map. It comes from ${esc(P.name)}'s colours and body parts, so evolving can change it.</p></div>
    <dl class="facts">
      <div class="fact"><dt>Age</dt><dd${own ? ' id="fAge"' : ''}>${fmtAge(P.ageH || 0)}</dd></div>
      <div class="fact"><dt>Weight</dt><dd${own ? ' id="fWeight"' : ''}>${own ? weightG() : wt} g</dd></div>
      <div class="fact"><dt>Days fed</dt><dd>${fed} (best ${P.bestStreak || 0})</dd></div>
      <div class="fact"><dt>Meals</dt><dd>${P.meals || 0}</dd></div>
      <div class="fact"><dt>Pats</dt><dd>${P.pats || 0}</dd></div>
      <div class="fact"><dt>Tower level</dt><dd>${P.dlv || 1}</dd></div>
      <div class="fact"><dt>Adventure</dt><dd>${totalStars()} / ${maxStars()} ★</dd></div>
      <div class="fact"><dt>Stages played</dt><dd>${st.map.plays || 0}</dd></div>
    </dl>
    <h3 class="sec">Tricks</h3><ul class="howto">${tricks}</ul>
    ${runTeam ? '' : `<div class="evo-actions"><button class="btn small" type="button" data-go="dungeon">${ICON.sword}Open the Tower</button><button class="btn small" type="button" data-go="gift">${ICON.gift}Gift box</button>${petCount() >= 2 ? `<button class="btn small" type="button" data-go="hub-fuse" data-uid="${P.uid}">${ICON.fusion}Fuse ${esc(P.name)}</button>` : ''}</div>`}
  </div>`;
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
  if (!st) return;
  if (runTeam) { runPlayAs(uid); return; }   // (v460 META: in a paused run, the run's own switch, on closing the sheet)
  if (uid === st.uid) return;
  const i = st.others.findIndex(o => o.uid === uid); if (i < 0) return;
  switchPet(i); teamUid = uid; renderTeam(); renderDungeon();
}
/* ---------- v460 META: double-tap (or double-click) a pet's icon in the Pets & Team hub to play as it ----------
   Both taps on the same pet within HUB_DBL.ms (about 300 ms); a press that moved more than HUB_DBL.slop pixels, or that
   scrolled the sheet or the grid, is a scroll and counts for nothing. The first tap still does what a tap does (inspect:
   team-pick, through the ordinary click), so single-tap inspection is untouched. Only icons marked data-dbl take part:
   the hub's party strip and its collection grid; the fusion pickers have none, so choosing fusion ingredients never
   switches pets. Playing as goes through the normal switch (switchPet: the model, stats, abilities, camera and HUD, and
   the party's swap rules that keep its size); in a paused run it goes through the run's own switch instead (runPlayAs) */
const HUB_DBL = { ms: 300, slop: 10 };
const hubTap = { down: null, last: null, eat: 0 };
const hubScrollOf = el => { const sc = el.closest('.scroll'); return `${Math.round(sheetEl.scrollTop)}|${sc ? Math.round(sc.scrollTop) : 0}`; };
sheetEl.addEventListener('pointerdown', e => {
  const el = sheetKind === 'team' && e.isPrimary !== false ? e.target.closest('[data-dbl]') : null;
  hubTap.down = el ? { uid: el.dataset.dbl, x: e.clientX, y: e.clientY, id: e.pointerId, sc: hubScrollOf(el), el } : null;
}, true);
// (the click that follows the second tap is the double-tap's own: it must not inspect whatever the redraw put there)
sheetEl.addEventListener('click', e => { if (hubTap.eat && performance.now() - hubTap.eat < 600 && e.target.closest('[data-dbl]')) { hubTap.eat = 0; e.stopPropagation(); e.preventDefault(); } }, true);
sheetEl.addEventListener('pointercancel', () => { hubTap.down = null; hubTap.last = null; }, true);   // (the browser took the press for a scroll)
sheetEl.addEventListener('pointerup', e => {
  const d = hubTap.down; hubTap.down = null;
  if (!d || e.pointerId !== d.id || sheetKind !== 'team') return;
  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > HUB_DBL.slop || hubScrollOf(d.el) !== d.sc) { hubTap.last = null; return; }
  const t = e.timeStamp || performance.now(), L = hubTap.last;   // (the input's own time: a busy redraw between the taps does not stretch the window)
  if (L && L.uid === d.uid && t - L.t <= HUB_DBL.ms) { hubTap.last = null; hubTap.eat = performance.now(); hubPlayAs(d.uid); return; }
  hubTap.last = { uid: d.uid, t };
}, true);
/* inspect a pet (a tap on its icon): the hub redraws for it, and the tapped icon is kept exactly where it was on the
   screen (the panels above it can change height), so the second tap of a double-tap lands on the same pet */
function hubPick(el) {
  const uid = el.dataset.uid, box = el.closest('.party-grid') ? '.party-grid' : '.team-grid', y0 = el.getBoundingClientRect().top;
  teamUid = uid; sfx.boop(); renderTeam();
  const n = $(`${box} [data-uid="${uid}"]`, sheetEl); if (!n) return;
  const sc = n.closest('.scroll'), dy = n.getBoundingClientRect().top - y0;
  if (Math.abs(dy) > 0.5) sheetEl.scrollTop += dy;
  const left = n.getBoundingClientRect().top - y0;   // (what the sheet could not take up, e.g. at its very end: the grid's own scroll)
  if (Math.abs(left) > 0.5 && sc && sc.scrollHeight > sc.clientHeight) sc.scrollTop += left;
}
/* play as this pet (the double-tap's action). Returns true when it switched (or, in a run, will switch on closing) */
function hubPlayAs(uid) {
  if (!st) return false;
  const P = uid === st.uid ? st : (st.others || []).find(o => o.uid === uid); if (!P) return false;
  if (runTeam) return runPlayAs(uid);
  if (P === st) { teamUid = uid; toast(`You already play ${st.name}`); renderTeam(); return false; }
  if (evolving || fusing || adopting) { sfx.wrong(); toast(`${P.name} can't take over right now`); return false; }
  teamLead(uid);
  const ok = st.uid === uid;
  if (ok) { const el = $(`[data-dbl="${uid}"]`, sheetEl); if (el) el.classList.add('dbl-on'); }
  return ok;
}
/* in a paused run: the pet leads once the sheet closes (reparty, 20b), if it is in the run's party and not knocked out */
let runLeadUid = null;
const runLeadTake = () => { const u = runLeadUid; runLeadUid = null; return u; };
function runPlayAs(uid) {
  const P = uid === st.uid ? st : (st.others || []).find(o => o.uid === uid); if (!P) return false;
  const S = arc.game && arc.game.partyState ? arc.game.partyState() : [], m = S.find(x => x.uid === uid);
  if (!inParty(uid)) { sfx.wrong(); toast(`${P.name} isn't in the party. Add it to the party first.`); return false; }
  if (m && m.down) { sfx.wrong(); toast(`${P.name} is knocked out and can't lead this run.`); return false; }
  if (m && m.cur && !runLeadUid) { toast(`${P.name} is already leading.`); return false; }
  runLeadUid = uid; teamUid = uid; sfx.boop(); toast(`${P.name} will lead when you close this sheet.`); renderTeam(); return true;
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
