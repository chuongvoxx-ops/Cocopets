/* ---------- the Animas menu: the twelve of the Astral Covenant, and the thirteenth ---------- */
let animaSel = null;
const animaK = id => (st && st.animas && st.animas.have[id]) || 0;
/* an Anima recognises you once you clear its floor in the Tower */
function animaRecognise() {
  if (!st) return [];
  const got = [];
  ANIMA_ORDER.forEach(id => { if (!animaK(id) && (st.dun.best || 0) >= ANIMAS[id].floor) { st.animas.have[id] = 1; got.push(id); } });
  if (!st.animas.eq) { const first = ANIMA_ORDER.find(id => animaK(id)); if (first) st.animas.eq = first; }
  if (got.length) saveSoon();
  return got;
}
/* what a pet takes into the Tower: its Anima, and from Guardian (stage 5) a second one that resonates with it */
function animaKitFor(p) {
  const A = st && st.animas; if (!A || !A.eq || !animaK(A.eq)) return null;
  const main = { id: A.eq, k: animaK(A.eq) };
  // the second Anima answers only a party whose every member is a Guardian or beyond
  const stage = Array.isArray(p) ? Math.min(...p.map(q => q.stage || 1)) : (p.stage || 1);
  const res = A.res && A.res !== A.eq && animaK(A.res) && stage >= RESONANCE_STAGE ? { id: A.res, k: animaK(A.res) } : null;
  return { main, res, resonance: res ? pairResonance(main.id, res.id) : null };
}
/* the round button in the house is now the egg summon shortcut; Animas are managed from the Tower tab */
function updateAnimaBtn() {
  const b = $('#animaBtn'); if (!b || !st) return;
  b.hidden = false;
  const cr = st.crystals || 0, can = cr >= SUMMON_ONE;
  b.innerHTML = `<span class="ab-egg">${eggSVG()}</span><span class="ab-sig ab-cr">${ICON.crystal}</span>`;
  b.classList.toggle('new', can);
  b.setAttribute('aria-label', `Egg summon. You have ${fmtNum(cr)} crystals`);
}
function openAnimas(sel) {
  if (!st) return;
  animaRecognise();
  animaSel = sel || animaSel || st.animas.eq || 'aries';
  openSheet('animas', '');
  renderAnimas();
}
const gemsHave = g => (st.gems && st.gems[g]) || 0;
function ascendCost(id) { const k = animaK(id); return k >= 1 && k < 3 ? ASCEND[k + 1] : null; }
function canAscend(id) { const C = ascendCost(id), A = ANIMAS[id]; return !!C && gemsHave(A.gem) >= C.gems && gemsHave('starstone') >= C.star && (st.crystals || 0) >= C.crystals; }
function renderAnimas() {
  if (sheetKind !== 'animas' || !st) return;
  const id = animaSel, A = ANIMAS[id], k = animaK(id), eq = st.animas.eq, opp = A.opp ? ANIMAS[A.opp] : null, R = A.opp ? resonanceOf(id, A.opp) : null, hid = A.secret && !k;
  st.animas.seen[id] = true;
  const realm = A.realm === 'heaven' ? 'Descended from the heavens' : 'Risen from the primordial void';
  const forms = [1, 2, 3].map(n => `<div class="an-form${n === k ? ' cur' : ''}${n > k ? ' dim' : ''}${hid ? ' hid' : ''}"><img alt="" src="${AnimaPortrait.portrait(id, n, 104, 132)}"><small>${n > k ? `${ICON.lock || ''}` : ''}${hid ? '???' : esc(A.forms[n - 1])}</small></div>`).join('');
  const C = ascendCost(id);
  let actions = '';
  if (!k && A.secret) actions = `<p class="note an-seal">Sealed beyond the summit of the Tower. No crystals can break this seal: bring Bahamut, the Infinite, peace on floor <b>${A.floor}</b> and the thirteenth sign will answer your call.</p>`;
  else if (!k) actions = `<p class="note an-seal">Sealed in the stars. Clear Tower floor <b>${A.floor}</b> to earn ${esc(A.name)}'s recognition, or break the seal now.</p><div class="evo-actions"><button class="btn primary" type="button" data-go="an-unseal" data-id="${id}"${(st.crystals || 0) < ANIMA_SIGIL ? ' aria-disabled="true"' : ''}>${ICON.crystal}Unseal for ${ANIMA_SIGIL} crystals</button></div>`;
  else {
    actions = `<div class="evo-actions">${eq === id ? `<span class="cd-eq">${ICON.star}Bound to summon</span>` : `<button class="btn primary" type="button" data-go="an-eq" data-id="${id}">${AnimaArt.sigilSVG(id)}Bind ${esc(A.name)}</button>`}</div>`;
    if (C) { const GM = GEMS[A.gem]; actions += `<div class="box an-asc"><div class="box-top"><span>Ascension ${k} → ${k + 1}</span><span class="mono">${esc(A.forms[k])}</span></div>
      <p class="note">${gemsHave(A.gem) >= C.gems ? '' : '<b>Need more:</b> '}${C.gems} ${esc(GM.name)} (you have ${gemsHave(A.gem)})${C.star ? ` · ${C.star} Starstone (you have ${gemsHave('starstone')})` : ''} · ${fmtNum(C.crystals)} crystals (you have ${fmtNum(st.crystals || 0)})</p>
      <div class="evo-actions"><button class="btn${canAscend(id) ? ' primary' : ''}" type="button" data-go="an-asc" data-id="${id}"${canAscend(id) ? '' : ' aria-disabled="true"'}>${ICON.sparkle}Ascend</button></div></div>`; }
    else actions += `<p class="note">Fully ascended: ${esc(A.forms[2])}.</p>`;
  }
  // the resonance slot
  let res = '';
  const sec = animaSecond(), ic = a => `<span class="an-res-ic${a ? '' : ' empty'}">${a ? `<img alt="${esc(ANIMAS[a].name)}" src="${AnimaArt.picture(a, animaK(a), 48)}">` : '+'}</span>`;
  if (partyStage() < RESONANCE_STAGE) res = `<div class="an-res locked"><span class="an-res-ic">${AnimaArt.sigilSVG(A.opp || id)}</span><div><b>Second Anima · Resonance</b><small>Opens when every pet in your party has evolved to Guardian (stage ${RESONANCE_STAGE}) or beyond. The Animas are bound to the party, not to one pet. Bind two Animas to summon them together: opposite signs unleash a Zodiac Resonance, any other pair awakens in Astral Harmony.</small></div></div>`;
  else if (eq) {
    const eo = ANIMAS[eq].opp, RR = sec ? pairResonance(eq, sec) : null, oppR = eo ? resonanceOf(eq, eo) : null;
    // the thirteenth has no opposite: any partner awakens with it in Astral Harmony
    const hint = eo && oppR ? ` Pair ${esc(ANIMAS[eq].name)} with ${esc(ANIMAS[eo].name)} for ${esc(oppR.name)}.` : ` No sign opposes ${esc(ANIMAS[eq].sign)}: every partner awakens with it in Astral Harmony.`;
    const info = RR ? `<b>${RR.generic ? 'Astral Harmony' : `Zodiac Resonance · ${esc(RR.name)}`}</b><small>${esc(ANIMAS[eq].name)} + ${esc(ANIMAS[sec].name)}. ${esc(RR.desc)}${RR.generic ? hint : ''}</small>`
      : `<b>Second Anima</b><small>Choose an Anima below and bind it as the second. Both are summoned together.${eo && oppR ? ` ${esc(ANIMAS[eo].name)} of ${esc(ANIMAS[eo].sign)}, the opposite sign, unlocks the Zodiac Resonance ${esc(oppR.name)}.` : hint}</small>`;
    // (the second can be let go from the first's page as well as its own; another Anima's page offers to take its place)
    const btn = !k ? '' : id === eq ? (sec ? `<button class="btn small" type="button" data-go="an-res" data-id="${sec}">Unbind ${esc(ANIMAS[sec].name)}</button>` : '')
      : id === sec ? `<button class="btn small" type="button" data-go="an-res" data-id="${id}">Unbind ${esc(A.name)}</button>` : `<button class="btn small primary" type="button" data-go="an-res" data-id="${id}">Bind ${esc(A.name)} as second</button>`;
    res = `<div class="an-res${RR ? ' on' : ''}${RR && !RR.generic ? ' zodiac' : ''}">${ic(eq)}<span class="an-plus">+</span>${ic(sec)}<div>${info}</div>${btn}</div>`; }
  const tiles = ANIMA_ORDER.map(a => { const B = ANIMAS[a], kk = animaK(a), sh = B.secret && !kk; return `<button class="an-tile${a === id ? ' cur' : ''}${kk ? '' : ' sealed'}${sh ? ' hid' : ''}${B.secret ? ' thirteenth' : ''}${a === eq ? ' eq' : ''}${a === sec ? ' sec' : ''}" type="button" data-go="an-pick" data-id="${a}" style="--ac:${B.color}"><img alt="" src="${AnimaPortrait.portrait(a, Math.max(1, kk), 74, 74, { zoom: 1.3 })}"><span class="an-tsig">${AnimaArt.sigilSVG(a)}</span><b>${sh ? '???' : esc(B.name)}</b><small>${kk ? '★'.repeat(kk) : B.secret ? `The thirteenth sign · beyond floor ${B.floor}` : `Floor ${B.floor}`}</small></button>`; }).join('');
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    <p class="eyebrow">The Astral Covenant</p><h2 class="title" id="sheetTitle">Animas</h2>
    <details class="an-lore"><summary>The legend</summary>${COVENANT_LORE.map(l => `<p>${esc(l)}</p>`).join('')}</details>
    <div class="an-hero ${A.realm}" style="--ac:${A.color};--ag:${A.glow}">
      <div class="an-splash${k ? '' : ' sealed'}${hid ? ' hid' : ''}"><img alt="${hid ? 'A sealed sign' : `${esc(A.name)}, ${esc(A.forms[Math.max(1, k) - 1])}`}" src="${AnimaPortrait.portrait(id, Math.max(1, k), 340, 220)}"><span class="an-stars">${k ? '★'.repeat(k) + '<i>' + '★'.repeat(3 - k) + '</i>' : hid ? 'Beyond the summit' : 'Sealed in the stars'}</span>
        <div class="an-cap"><p class="an-sign">${AnimaArt.sigilSVG(id)}${esc(A.sign)} · ${A.secret ? 'The thirteenth sign' : A.realm === 'heaven' ? 'Heaven' : 'Void'}</p><h3>${hid ? '???' : esc(A.name)} <span>${hid ? 'Who judges the twelve' : `${esc(A.title)} · ${esc(A.forms[Math.max(1, k) - 1])}`}</span></h3></div></div>
      <div class="an-copy"><p class="an-role">${esc(A.role)}</p><p class="an-skill">${hid ? 'Waits at the summit of the Tower of Oblivion.' : esc(A.skill)}</p><p class="an-fin"><b>Astral Awakening · ${hid ? '???' : esc(A.finisher)}.</b> ${hid ? 'The strongest power in the Covenant, held by the one who judges the twelve.' : esc(A.finDesc)}</p><p class="an-realm">${opp ? `${realm}. Opposes ${esc(opp.name)} of ${esc(opp.sign)}${R ? ` · resonance: ${esc(R.name)}` : ''}.` : 'Stands outside the twelve: no sign opposes it, and any partner awakens with it in Astral Harmony.'}</p></div>
    </div>
    <div class="an-forms">${forms}</div>
    ${actions}
    ${res}
    <div class="an-grid">${tiles}</div>
    <p class="note">The Anima is bound to your whole party, not one pet. In the Tower the summon gauge fills when your pets take hits, and fills at once in critical condition. It can be called once per floor, and once per Super Fiend fight. When it glows, tap the sigil to summon. Once per floor. Each Anima arrives in its own way, fights with its own theme, and finishes with its Astral Awakening.</p>`;
  updateAnimaBtn();
}
/* the second Anima, if the pet is old enough to call two */
const partyStage = () => Math.min(...partyPets().map(q => q.stage || 1));
function animaSecond() { const A = st.animas, r = A.res; return r && r !== A.eq && animaK(r) && partyStage() >= RESONANCE_STAGE ? r : null; }
function equipAnima(id) { if (!animaK(id)) return; const was = st.animas.eq; st.animas.eq = id; if (st.animas.res === id) st.animas.res = was && was !== id ? was : null; sfx.sparkle(); saveSoon(); renderAnimas(); toast(`${ANIMAS[id].name} ${ANIMAS[id].title} will answer your call`); }
function toggleResonance(id) {
  const eq = st.animas.eq; id = id || (eq && ANIMAS[eq].opp);
  if (!eq || !id || id === eq || !animaK(id) || partyStage() < RESONANCE_STAGE) return;
  if (st.animas.res === id) { st.animas.res = null; sfx.chirp(); saveSoon(); renderAnimas(); toast(`${ANIMAS[id].name} unbound`); return; }
  st.animas.res = id; const R = pairResonance(eq, id); sfx.sparkle(); saveSoon(); renderAnimas();
  toast(R.generic ? `${ANIMAS[eq].name} and ${ANIMAS[id].name} will awaken in Astral Harmony` : `Zodiac Resonance: ${R.name}!`);
}
function ascendAnima(id) {
  const C = ascendCost(id), A = ANIMAS[id];
  if (!C || ascending) return;
  if (!canAscend(id)) { sfx.wrong(); toast(`Ascension needs ${C.gems} ${GEMS[A.gem].name}${C.star ? `, ${C.star} Starstone` : ''} and ${fmtNum(C.crystals)} crystals`); return; }
  st.gems[A.gem] -= C.gems; if (C.star) st.gems.starstone -= C.star; st.crystals -= C.crystals;
  const nk = animaK(id) + 1; st.animas.have[id] = nk;
  updateHud(); saveSoon(); renderAnimas();
  ascendCinematic(id, nk, () => { renderAnimas(); toast(`${A.name} ascended: ${A.forms[nk - 1]}!`); });
}
function unsealAnima(id) {
  if (animaK(id) || ascending || ANIMAS[id].secret) return;
  if ((st.crystals || 0) < ANIMA_SIGIL) { sfx.wrong(); toast(`Unsealing costs ${ANIMA_SIGIL} crystals. You have ${fmtNum(st.crystals || 0)}.`); return; }
  st.crystals -= ANIMA_SIGIL; st.animas.have[id] = 1; if (!st.animas.eq) st.animas.eq = id;
  updateHud(); saveSoon(); renderAnimas();
  ascendCinematic(id, 1, () => { renderAnimas(); toast(`${ANIMAS[id].name} ${ANIMAS[id].title} is freed from the stars`); });
}
$('#animaBtn').addEventListener('click', () => { sfx.unlock(); openSummon(); });
