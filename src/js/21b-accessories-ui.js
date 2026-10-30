/* ---------- wearing accessories: the three slots in the Tower lobby, and the sheet where a pet puts pieces on, takes
   them off, compares them and salvages what it does not need ---------- */
// the sheet dresses one pet: the one you play, unless another is picked (accFor); accFrom 'team' shows the way back
let accTab = 'ring', accSel = null, accArm = null, accFor = null, accFrom = null;
const accPet = () => accFor ? petByUid(accFor) : st;
/* a pet's row of slots: what it wears, one tile per slot, and what it all adds up to. o.go makes the tiles sheet
   buttons (data-go) instead of the lobby's (data-dun) */
function accRowHTML(p, o) {
  o = o || {}; const act = o.go ? `data-go="${o.go}"` : 'data-dun="acc"';
  const on = {}; accItemsOf(p).forEach(a => { on[a.t] = a; });
  const fresh = t => (st.accs || []).filter(a => a.t === t && a.nw).length, sum = accSummary(p);
  const tiles = ACC_TYPES.map(t => { const a = on[t], n = fresh(t);
    return a ? `<button class="aslot r${a.r}" type="button" ${act} data-t="${t}" style="--rc:${ACC_R[a.r].c};--rd:${ACC_R[a.r].d}" aria-label="${ACC_TYPE[t].name}: ${esc(accName(a))}, ${esc(accMainText(a))}"><span class="as-art">${accSVG(a)}</span><small>${ACC_TYPE[t].name}</small><b>${esc(accMainText(a))}</b>${n ? `<i class="as-new">${n}</i>` : ''}</button>`
      : `<button class="aslot empty" type="button" ${act} data-t="${t}" aria-label="${ACC_TYPE[t].name}: empty"><span class="as-art">${accSVG({ t, r: 0 }, { cls: 'acc-ghost' })}</span><small>${ACC_TYPE[t].name}</small><b>${(st.accs || []).some(x => x.t === t && !accWearer(x.u)) ? 'Tap to wear' : 'Empty'}</b>${n ? `<i class="as-new">${n}</i>` : ''}</button>`; }).join('');
  return `<div class="mb-top dp-acc-top"><h3 class="sec">Accessories</h3><span class="dp-acc-n"><b>${(st.accs || []).length}/${ACC_BAG}</b> in the bag</span></div><div class="dp-acc">${tiles}</div>${sum.length ? `<p class="note dp-accsum">${esc(sum.join(' · '))}</p>` : '<p class="note dp-accsum">Rings, bracelets and necklaces drop in the Tower, rarer the higher you climb. Each one makes the pet that wears it stronger.</p>'}`;
}
function openAccs(t, uid, from) { accTab = ACC_TYPES.includes(t) ? t : 'ring'; accSel = null; accArm = null; accFor = uid || null; accFrom = from || null; openSheet('accs', ''); renderAccs(); }
const accRank = a => a.r * 10 + (a.s[ACC_TYPE[a.t].main] || 0);
function renderAccs() {
  if (sheetKind !== 'accs' || !st) return;
  if (!st.accs) st.accs = [];
  const P = accPet();
  P.acc = cleanAccSlots(P.acc);
  const t = accTab, T = ACC_TYPE[t], all = st.accs, mine = all.filter(a => a.t === t).sort((a, b) => accRank(b) - accRank(a));
  const worn = P.acc[t] ? all.find(a => a.u === P.acc[t]) : null;
  const sel = (accSel && all.find(a => a.u === accSel && a.t === t)) || worn || mine[0] || null;
  let detail;
  if (sel) {
    const R = ACC_R[sel.r], who = accWearer(sel.u), mineOn = who === P;
    // what wearing it would do to the pet's numbers
    let cmp = '';
    if (!mineOn) { const now = petCombat(P), keep = P.acc[t]; P.acc[t] = sel.u; const then = petCombat(P); P.acc[t] = keep;
      const row = (label, a, b) => a === b ? '' : `<li><span>${label}</span><b>${fmtNum(a)}</b><i>→</i><b class="${b > a ? 'up' : 'down'}">${fmtNum(b)}</b></li>`;
      cmp = `<ul class="ad-cmp">${row('HP', now.hp, then.hp)}${row('MP', now.mp, then.mp)}${row('Power', Math.round(now.atk), Math.round(then.atk))}</ul>`; }
    const armed = accArm === sel.u;
    detail = `<div class="acc-detail r${sel.r}" style="--rc:${R.c};--rd:${R.d}">
      <span class="ad-art">${accSVG(sel, { cls: 'big' })}</span>
      <div class="cd-copy"><p class="eyebrow"><span class="ad-r">${R.name}</span> ${T.name} · floor ${sel.f}</p><h3>${esc(accName(sel))}</h3>
        <ul class="ad-lines">${accLines(sel).map((l, i) => `<li${i ? '' : ' class="main"'}>${esc(l)}</li>`).join('')}</ul>
        ${cmp}
        <p class="cd-nums">${who ? `Worn by ${esc(who.name)}` : 'In the bag'}</p>
        <div class="ad-btns">${mineOn ? `<span class="cd-eq">${ICON.star}Wearing</span><button class="btn small" type="button" data-go="acc-off" data-t="${t}">Take off</button>` : `<button class="btn primary small" type="button" data-go="acc-eq" data-u="${sel.u}">${who ? `Wear it (from ${esc(who.name)})` : 'Wear it'}</button>`}${who ? '' : `<button class="btn small${armed ? ' danger' : ''}" type="button" data-go="acc-scrap" data-u="${sel.u}">${ICON.coin}${armed ? 'Tap again to salvage' : `Salvage +${R.scrap}`}</button>`}${sel.sp === 'bell' ? `<button class="btn small" type="button" data-go="acc-bell" aria-pressed="${!st.bellMute}">${st.bellMute ? 'Chime: muted' : 'Chime: on'}</button>` : ''}</div>
      </div></div>`;
  } else detail = `<div class="acc-detail empty"><span class="ad-art">${accSVG({ t, r: 0 }, { cls: 'big acc-ghost' })}</span><p>No ${T.name.toLowerCase()}s yet. They drop from monsters, treasure chests and bosses in the Tower, and the higher the floor, the rarer they run. Super Fiends always leave two or three.</p></div>`;
  const grid = mine.map(a => { const w = accWearer(a.u), R = ACC_R[a.r]; return `<button class="acc-tile r${a.r}${sel && a.u === sel.u ? ' cur' : ''}" type="button" data-go="acc-pick" data-u="${a.u}" style="--rc:${R.c};--rd:${R.d}" aria-pressed="${!!(sel && a.u === sel.u)}" aria-label="${R.name} ${esc(accName(a))}, ${esc(accMainText(a))}${w ? `, worn by ${esc(w.name)}` : ''}"><span class="at-art">${accSVG(a)}</span><b>${esc(accMainText(a).replace(/ (Power|HP|MP)$/, ''))}</b><small>${R.name}</small>${w ? `<i class="at-who${w === P ? ' me' : ''}">${w === P ? 'ON' : esc(w.name.slice(0, 7))}</i>` : a.nw ? '<i class="at-new">NEW</i>' : ''}</button>`; }).join('');
  const low = all.filter(a => a.r <= 1 && !accWearer(a.u)), lowC = low.reduce((n, a) => n + ACC_R[a.r].scrap, 0);
  // every pet can be dressed from here, without changing which one you play: the party first, then the rest
  const party = partyPets(), pets = party.concat(st.others.filter(p => !party.includes(p)));
  const strip = pets.length > 1 ? `<div class="acc-pets">${pets.map(p => { const n = accItemsOf(p).length, on = p === P; return `<button class="acc-pet${on ? ' on' : ''}${party.includes(p) ? ' party' : ''}" type="button" ${on ? 'aria-current="true"' : `data-go="acc-who" data-uid="${p.uid}"`} aria-label="Dress ${esc(p.name)}${n ? `, wearing ${n}` : ''}"><span>${petSVG(formOf(p), { frame: 'fit' })}</span><small>${esc(p.name)}</small>${n ? `<i class="ap-n">${n}</i>` : ''}</button>`; }).join('')}</div>` : '';
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    ${accFrom === 'team' ? `<button class="btn small team-back" type="button" data-go="team">${ICON.back || ''}Team</button>` : ''}
    <p class="eyebrow">${esc(P.name)}'s accessories · ${all.length}/${ACC_BAG} in the bag</p><h2 class="title" id="sheetTitle">Accessories</h2>
    ${strip}
    <div class="ctabs" role="tablist">${ACC_TYPES.map(k => { const a = P.acc[k] ? all.find(x => x.u === P.acc[k]) : null; return `<button class="ctab" role="tab" type="button" data-go="acc-tab" data-t="${k}" aria-selected="${k === t}"><small>${ACC_TYPE[k].name}</small><b>${a ? esc(accMainText(a)) : 'Empty'}</b></button>`; }).join('')}</div>
    <p class="note acc-note">${T.desc} The rarer the piece, the bigger the bonus, and from Uncommon up each one carries extra bonuses too. Every pet wears one of each kind, and its own pieces work for it whenever it fights.</p>
    ${detail}
    <div class="acc-grid">${grid}</div>
    ${low.length ? `<button class="btn small acc-low" type="button" data-go="acc-scrap-low">${ICON.coin}Salvage ${low.length} spare Common/Uncommon: +${fmtNum(lowC)} coins</button>` : ''}
    <ul class="acc-rar" aria-label="Rarities, from the most common">${ACC_R.map(R => `<li style="--rc:${R.c};--rd:${R.d}">${R.name}</li>`).join('')}</ul>
    <p class="note">Found pieces come home after every run, won or lost. Legendary pieces begin to drop past floor 18 or so, Mythic ones past floor 54, and bosses and Super Fiends drop rarer ones.</p>`;
  // what has been looked at is no longer new
  let seen = false; mine.forEach(a => { if (a.nw) { a.nw = 0; seen = true; } }); if (seen) saveSoon();
}
function accEquip(u) {
  const a = (st.accs || []).find(x => x.u === u); if (!a) return;
  const P = accPet(), w = accWearer(u); if (w && w !== P) w.acc[a.t] = null;
  P.acc = cleanAccSlots(P.acc); P.acc[a.t] = u; accSel = u; accArm = null;
  sfx.sparkle(); toast(`${P.name} wears the ${accName(a)}: ${accMainText(a)}`); saveSoon(); renderAccs(); renderDungeon();
}
function accTakeOff(t) { const P = accPet(); if (!P.acc) return; P.acc[t] = null; accArm = null; sfx.boop(); saveSoon(); renderAccs(); renderDungeon(); }
function accScrap(u) {
  const i = (st.accs || []).findIndex(x => x.u === u); if (i < 0 || accWearer(u)) return;
  const a = st.accs[i];
  // anything Epic or rarer asks twice
  if (a.r >= 3 && accArm !== u) { accArm = u; sfx.boop(); renderAccs(); return; }
  st.accs.splice(i, 1); st.coins += ACC_R[a.r].scrap; accSel = null; accArm = null;
  toast(`Salvaged the ${accName(a)}: +${ACC_R[a.r].scrap} coins`); sfx.coin(); saveSoon(); updateHud(); renderAccs(); renderDungeon();
}
function accScrapLow() {
  const low = (st.accs || []).filter(a => a.r <= 1 && !accWearer(a.u)); if (!low.length) return;
  const c = low.reduce((n, a) => n + ACC_R[a.r].scrap, 0), gone = new Set(low.map(a => a.u));
  st.accs = st.accs.filter(a => !gone.has(a.u)); st.coins += c; accSel = null; accArm = null;
  toast(`Salvaged ${low.length} pieces: +${fmtNum(c)} coins`); sfx.coin(); saveSoon(); updateHud(); renderAccs(); renderDungeon();
}
