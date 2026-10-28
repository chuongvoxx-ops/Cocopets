/* ---------- the Tower tab on the Adventure screen: floors across eight lands, the pet's abilities, the monster book, cards and gift boxes ---------- */
let mapTab = 'world', dunSel = 0;
const dunScroll = $('#dunScroll'), dunInner = $('#dunInner');
const DUN_W = { key: 'dungeon', name: 'Tower of Oblivion', game: 'Tower', how: 'Drag anywhere to move. Tap a monster (or anywhere) to attack it. Hits earn MP: spend it on Strong and Ult. Tap Dodge to roll through attacks. Beat every monster and the floor\'s boss shows up.' };
const TOWER_TOP = 120;
// (a floor is open once the one below it is cleared, and when the rifts allow it: towerCap, 21b; never shut again once reached)
const dunFloorOpen = n => !!st && n >= 1 && n <= TOWER_TOP && (st.unlockAll || (n <= (st.dun.best || 0) + 1 && (n <= towerCap() || n <= (st.dun.best || 0))));
const GRADE_IDX = { S: 4, A: 3, B: 2, C: 1 };
const gradeName = i => ['', 'C', 'B', 'A', 'S'][i] || '';
function setMapTab(t, quiet) {
  const prev = mapTab;
  mapTab = t === 'dungeon' ? 'dungeon' : t === 'town' ? 'town' : t === 'rift' ? 'rift' : 'world';
  if (st) st.dun.tab = mapTab;
  mapEl.dataset.tab = mapTab;
  $('#mapToWorld').hidden = mapTab === 'world';
  $('#mapPlace').textContent = mapTab === 'dungeon' ? 'Tower of Oblivion' : mapTab === 'town' ? 'Pocket Town' : mapTab === 'rift' ? 'The Great Rift' : '';
  if (prev === 'town' && mapTab !== 'town') closeTown();
  mapCard.hidden = true; mapSel = null;
  if (mapTab === 'dungeon') { renderDungeon(); dunScroll.scrollTop = 0; }
  else if (mapTab === 'rift') { renderRift(); riftScroll.scrollTop = 0; }
  else if (mapTab === 'town') openTown();
  else { renderWorld(); mapScroll.scrollTop = 0; }
  if (!quiet) { sfx.boop(); saveSoon(); }
}
/* re-render whatever view is showing (after a stage, a purchase, a level up) */
function renderMapTab() { if (!mapOpen) return; if (mapTab === 'dungeon') renderDungeon(); else if (mapTab === 'rift') renderRift(); else if (mapTab === 'world') renderWorld(); }
$('#mapToWorld').innerHTML = ICON.map + 'Map';
$('#mapToWorld').addEventListener('click', () => { sfx.unlock(); setMapTab('world'); });

/* the gate to a floor, drawn as the land you're about to enter */
function dunGateSVG(F) {
  const B = BIOMES[F.biome], L = 'stroke="#2B2433" stroke-width="3" stroke-linejoin="round"', l2 = 'stroke="#2B2433" stroke-width="2.2" stroke-linejoin="round"';
  const eyes = F.boss ? '<g class="dg-eyes"><ellipse cx="88" cy="98" rx="7" ry="4" fill="#FF5C5C"/><ellipse cx="112" cy="98" rx="7" ry="4" fill="#FF5C5C"/><path d="M80 90l14 5M120 90l-14 5" stroke="#FF5C5C" stroke-width="2.5" stroke-linecap="round"/></g>'
    : '<g class="dg-eyes"><circle cx="82" cy="104" r="3" fill="#FFE36B"/><circle cx="92" cy="104" r="3" fill="#FFE36B"/><path d="M78 99l6 3M96 99l-6 3" stroke="#FFE36B" stroke-width="1.6" stroke-linecap="round"/><circle cx="112" cy="94" r="2.4" fill="#FF7A8A"/><circle cx="120" cy="94" r="2.4" fill="#FF7A8A"/></g>';
  const crown = F.boss ? `<g transform="translate(100 24)"><path d="M-16 6L-20 -12L-8 -4L0 -18L8 -4L20 -12L16 6Z" fill="#FFD447" ${L}/><circle cy="-1" r="3" fill="#FF5C8A"/></g>` : '';
  const portal = (d, glow) => `<path d="${d}" fill="url(#dgP)" ${L}/><path d="${d}" fill="${glow}" opacity=".18"/>`;
  const defs = `<defs><radialGradient id="dgGlow" cx="50%" cy="62%" r="60%"><stop offset="0" stop-color="${B.accent}" stop-opacity=".5"/><stop offset="1" stop-color="${B.accent}" stop-opacity="0"/></radialGradient><radialGradient id="dgP" cx="50%" cy="70%" r="70%"><stop offset="0" stop-color="#2A1F4A"/><stop offset="1" stop-color="#07040C"/></radialGradient>
    <linearGradient id="dgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${{ high: '#79C3EE', heaven: '#FFD6E8', swamp: '#2E5446', hell: '#4A1410', frost: '#16325A' }[F.biome] || '#1A1338'}"/><stop offset="1" stop-color="${{ high: '#DFF4FF', heaven: '#CFE2FF', swamp: '#0D1C17', hell: '#1A0705', frost: '#060C18' }[F.biome] || '#0B0916'}"/></linearGradient></defs>`;
  let art = '';
  switch (F.biome) {
    case 'swamp': art = `<rect width="200" height="150" fill="url(#dgSky)"/><rect y="118" width="200" height="32" fill="#1E4A47"/><path d="M10 126h40M120 132h50M60 140h30" stroke="#8FD8C4" stroke-width="2" opacity=".5" stroke-linecap="round"/>
      ${portal('M58 150V84Q58 50 100 50T142 84V150Z', B.accent)}
      <path d="M44 150C38 110 50 70 72 46C84 34 96 34 100 40C104 34 116 34 128 46C150 70 162 110 156 150H140C146 112 136 76 118 60C110 54 104 56 100 62C96 56 90 54 82 60C64 76 54 112 60 150Z" fill="#6B5236" ${L}/>
      <g ${l2}><circle cx="62" cy="40" r="22" fill="#3E7A3E"/><circle cx="100" cy="28" r="26" fill="#4E8A45"/><circle cx="140" cy="40" r="22" fill="#3E7A3E"/></g>
      <path d="M64 58q2 14 -2 22M136 58q-2 14 2 22M100 54q1 10 -1 16" stroke="#8CC46A" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <g fill="#7FA35E" ${l2}><path d="M18 150V104l4 -2v48z"/><path d="M28 150V96l4 -2v56z"/><path d="M172 150V100l4 -2v52z"/></g><ellipse cx="22" cy="100" rx="3" ry="8" fill="#8C5A2B"/><ellipse cx="174" cy="96" rx="3" ry="8" fill="#8C5A2B"/>
      <g class="dg-fire" fill="#D8FF8A"><circle cx="40" cy="70" r="2.4"/><circle cx="160" cy="60" r="2"/><circle cx="150" cy="96" r="2.4"/><circle cx="30" cy="40" r="1.8"/></g>`; break;
    case 'caves': art = `<rect width="200" height="150" fill="url(#dgSky)"/>
      <path d="M0 150V40Q40 10 100 14T200 40V150H150Q150 70 100 62Q50 70 50 150Z" fill="#3A3F66" ${L}/>
      ${portal('M50 150Q50 70 100 62Q150 70 150 150Z', B.accent)}
      <g fill="#5A6299" ${l2}><path d="M70 66l6 22 6 -20z"/><path d="M96 62l5 16 5 -16z"/><path d="M122 66l5 18 6 -16z"/></g>
      <g ${l2}><path d="M14 150l8 -46 10 46z" fill="#7FD3F2"/><path d="M28 150l6 -30 8 30z" fill="#B39CFF"/><path d="M166 150l8 -52 10 52z" fill="#FF9BD2"/><path d="M156 150l5 -26 7 26z" fill="#7FD3F2"/></g>`; break;
    case 'high': art = `<rect width="200" height="150" fill="url(#dgSky)"/><g fill="#FFFFFF" opacity=".9"><ellipse cx="34" cy="34" rx="22" ry="9"/><ellipse cx="166" cy="24" rx="26" ry="10"/></g>
      <path d="M0 150V122Q50 112 100 116T200 120V150Z" fill="#6DAA4C" ${L}/>
      ${portal('M60 150V82Q60 46 100 46T140 82V150Z', '#BFEFFF')}
      <path d="M46 150V82Q46 32 100 32T154 82V150H140V82Q140 46 100 46T60 82V150Z" fill="#B9B2CC" ${L}/>
      <path d="M48 70q8 -6 12 4M152 74q-8 -6 -12 2M90 34q6 6 14 0" stroke="#4E8A45" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g ${l2}><path d="M18 122l12 -40 12 40z" fill="#3E8A44"/><path d="M168 120l10 -34 10 34z" fill="#3E8A44"/></g>`; break;
    case 'frost': art = `<rect width="200" height="150" fill="url(#dgSky)"/><g fill="#FFFFFF" opacity=".7"><circle cx="20" cy="30" r="1.6"/><circle cx="60" cy="16" r="1.2"/><circle cx="170" cy="40" r="1.6"/><circle cx="140" cy="12" r="1.2"/><circle cx="186" cy="90" r="1.4"/></g>
      ${portal('M56 150V84Q56 48 100 48T144 84V150Z', B.accent)}
      <path d="M40 150V80Q40 26 100 26T160 80V150H144V84Q144 48 100 48T56 84V150Z" fill="#BFE6FF" ${L}/>
      <path d="M48 76Q52 40 100 36" stroke="#FFFFFF" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
      <g fill="#E8F8FF" ${l2}><path d="M64 56l4 16 4 -14z"/><path d="M84 48l3 14 4 -13z"/><path d="M112 48l4 14 3 -14z"/><path d="M132 56l4 14 4 -16z"/></g>
      <path d="M0 150V132Q50 124 100 130T200 128V150Z" fill="#F4FAFF" ${L}/>`; break;
    case 'hell': art = `<rect width="200" height="150" fill="url(#dgSky)"/><rect y="124" width="200" height="26" fill="#FF6A1F"/><path d="M0 124h200" stroke="#FFE37A" stroke-width="3"/>
      ${portal('M60 150V86Q60 54 100 54T140 86V150Z', B.accent)}
      <path d="M44 150V84Q44 34 100 34T156 84V150H140V86Q140 54 100 54T60 86V150Z" fill="#2A1A24" ${L}/>
      <path d="M54 72l10 6M146 72l-10 6M100 38v10M70 120l6 -14M130 120l-6 -14" stroke="#FF6F3C" stroke-width="2.5" stroke-linecap="round"/>
      <g fill="#2A1A24" ${l2}><path d="M52 46Q40 26 50 14Q56 30 66 38z"/><path d="M148 46Q160 26 150 14Q144 30 134 38z"/></g>
      <g class="dg-fire"><ellipse cx="22" cy="114" rx="9" ry="14" fill="#FF9F43"/><ellipse cx="22" cy="118" rx="4" ry="8" fill="#FFE37A"/><ellipse cx="178" cy="114" rx="9" ry="14" fill="#FF9F43"/><ellipse cx="178" cy="118" rx="4" ry="8" fill="#FFE37A"/></g>`; break;
    case 'heaven': art = `<rect width="200" height="150" fill="url(#dgSky)"/><g opacity=".35" fill="#FFF3B0"><path d="M90 0h20l40 150h-30z"/><path d="M40 0h10l-20 150h-20z"/></g>
      ${portal('M62 150V80Q62 48 100 48T138 80V150Z', '#FFF3B0')}
      <g ${L}><rect x="44" y="60" width="18" height="90" fill="#FFFFFF"/><rect x="138" y="60" width="18" height="90" fill="#FFFFFF"/><path d="M38 60Q38 20 100 20T162 60H138Q138 40 100 40T62 60Z" fill="#F2C94C"/></g>
      <ellipse cx="100" cy="14" rx="18" ry="5" fill="none" stroke="#FFE37A" stroke-width="4"/>
      <g fill="#FFFFFF" ${l2}><circle cx="20" cy="140" r="18"/><circle cx="44" cy="146" r="14"/><circle cx="170" cy="142" r="18"/><circle cx="150" cy="148" r="12"/><circle cx="96" cy="152" r="14"/></g>`; break;
    case 'keep': art = `<rect width="200" height="150" fill="url(#dgSky)"/><circle cx="160" cy="26" r="12" fill="#E8E0FF" opacity=".85"/>
      <path d="M20 150V44h14v-10h14v10h14v-10h14v10h48v-10h14v10h14v-10h14v10h14V150Z" fill="#4A3B63" ${L}/>
      ${portal('M66 150V86Q66 58 100 58T134 86V150Z', B.accent)}
      <g stroke="#8C7BA8" stroke-width="3"><path d="M78 66V150M90 60V150M102 58V150M114 60V150M126 66V150M68 96H132M68 120H132"/></g>
      <g ${l2}><path d="M34 60h18v40l-9 -8 -9 8z" fill="#8C2A4F"/><path d="M148 60h18v40l-9 -8 -9 8z" fill="#8C2A4F"/></g>`; break;
    default: art = `<rect width="200" height="150" fill="url(#dgGlow)"/>
      <path d="M30 150V64Q30 18 100 18T170 64V150Z" fill="${B.top}" ${L}/>
      <path d="M30 64Q30 18 100 18T170 64" fill="none" stroke="${B.face}" stroke-width="10"/>
      ${portal('M52 150V72Q52 40 100 40T148 72V150Z', B.accent)}
      <g fill="${B.face}" ${L}><path d="M40 150h120v-12H40z"/><path d="M48 138h104v-10H48z"/></g>
      <path d="M40 40q10 -8 18 2M150 42q-8 -8 -16 0" stroke="#5E9B5A" stroke-width="4" fill="none" stroke-linecap="round"/>
      <g ${L}><rect x="16" y="66" width="10" height="34" rx="3" fill="#5A4632"/><rect x="174" y="66" width="10" height="34" rx="3" fill="#5A4632"/></g>
      <g class="dg-fire"><ellipse cx="21" cy="58" rx="8" ry="12" fill="#FF9F43"/><ellipse cx="21" cy="61" rx="4" ry="7" fill="#FFE37A"/><ellipse cx="179" cy="58" rx="8" ry="12" fill="#FF9F43"/><ellipse cx="179" cy="61" rx="4" ry="7" fill="#FFE37A"/></g>`;
  }
  return `<svg viewBox="0 0 200 150" aria-hidden="true">${defs}${art}<rect width="200" height="150" fill="url(#dgGlow)" opacity=".5"/>${eyes}${crown}</svg>`;
}
/* little monster portraits for the monster book, painted from the game's own sprites */
const monPortraits = new Map();
function monPortrait(type, seen) {
  const key = type + (seen ? '' : '?');
  if (monPortraits.has(key)) return monPortraits.get(key);
  let url = '';
  try {
    const s = DunArt.monSprite(type, 22, 0.1, MON[type].color, '', false), cv = document.createElement('canvas');
    cv.width = cv.height = 72; const c = cv.getContext('2d'), k = Math.min(1, 64 / (s.half * 2));
    c.drawImage(s.cv, 36 - s.half * k, 38 - s.half * k, s.half * 2 * k, s.half * 2 * k);
    if (!seen) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#3D3270'; c.fillRect(0, 0, 72, 72); }
    url = cv.toDataURL();
  } catch (e) {}
  monPortraits.set(key, url);
  return url;
}
/* boss portraits: the land bosses painted by the boss painter itself, with the fallen in colour and the rest in shadow */
const bossPortraits = new Map();
function bossPortrait(B, seen) {
  const key = B.id + (seen ? '' : '?');
  if (bossPortraits.has(key)) return bossPortraits.get(key);
  let url = '';
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 96; const c = cv.getContext('2d'), r = 15;
    const m = { bk: B, color: B.color, glow: B.glow, x: 1.2, y: 1.45, phase: 1, act: 'move', t: 1, boss: B.id, r: r / 40, hp: 1, maxhp: 1, z: 0, face: 1 };
    DunBoss.draw(c, m, 48, 58, r, 1.3, { x: 3.2, y: 1.45 }, v => v * 40, v => v * 40, 40);
    if (!seen) { c.globalCompositeOperation = 'source-atop'; c.fillStyle = '#3D3270'; c.fillRect(0, 0, 96, 96); }
    url = cv.toDataURL();
  } catch (e) {}
  bossPortraits.set(key, url);
  return url;
}
/* which floor a land's own boss holds first: the finale of its act (the floor before, when a Super Fiend takes the finale) */
function bossFloor(B) {
  const i = ACT_ORDER.indexOf(B.biome), hi = HIGH_ACT_ORDER.indexOf(B.biome);
  let f = i >= 0 ? i * ACT_LEN + ACT_LEN : hi >= 0 ? HIGH_FROM - 1 + hi * ACT_LEN + ACT_LEN : 0;
  if (f && fiendFor(f)) f -= 1; return f;
}
function bossBookHTML(best) {
  const cards = BOSSES.filter(B => !B.rift).sort((a, b) => (bossFloor(a) || 999) - (bossFloor(b) || 999)).map(B => { const n = (st.dun.seen['boss' + B.id] || 0), seen = n > 0, f = bossFloor(B), L = BIOMES[B.biome];
    return `<div class="mb-card${seen ? '' : ' unseen'}"><img src="${bossPortrait(B, seen)}" alt=""><b>${seen ? esc(B.name) : '???'}</b><small>${seen ? `${fmtNum(n)} beaten` : f ? `Floor ${f}` : 'A guardian'}</small>${bookOpen ? `<span>${esc(L ? L.name : '')}${B.extra ? ' · guards floors between finales' : f ? ` · act finale` : ''}${B.titan ? ' · a titan' : ''}</span>` : ''}</div>`; }).join('');
  const fiends = FIENDS.map((FD, i) => { const n = (i + 1) * 10, k = st.dun.seen['fiend' + FD.id] || 0, seen = k > 0 || best >= n;
    return `<div class="mb-card fiend-card${seen ? '' : ' unseen'}" data-dun="tfloor" data-n="${n}" role="button" tabindex="0"><span class="fc-orb" style="--fc:${FD.glow};--fb:${FD.color}"><i></i></span><b>${seen ? esc(FD.name) : '???'}</b><small>Floor ${n}${k ? ` · ${fmtNum(k)} beaten` : seen ? ' · beaten' : ''}</small>${bookOpen && seen ? `<span>${esc(FD.title)}</span>` : ''}</div>`; }).join('');
  return `<p class="tray-sub">Land bosses · ${BOSSES.filter(B => !B.rift && st.dun.seen['boss' + B.id]).length}/${BOSSES.filter(B => !B.rift).length}</p><div class="mb-grid">${cards}</div><p class="tray-sub">Super Fiends · ${FIENDS.filter((FD, i) => st.dun.seen['fiend' + FD.id] || best >= (i + 1) * 10).length}/${FIENDS.length}</p><div class="mb-grid">${fiends}</div>`;
}
const slotChip = (sl, a) => { const E = ELEMENTS[a.el] || ELEMENTS.spark; return `<button class="dslot" type="button" data-dun="slot" data-slot="${sl}"><span class="ds-art" style="--ec:${E.color};--ed:${E.dark}">${glyphSVG(a.glyph)}</span><span class="ds-copy"><small>${SLOT_INFO[sl].name}</small><b>${esc(a.name)}</b><em>${a.own ? (a.star ? `${a.star}★ signature` : 'Own ability') : `${CARD_R[a.r].name} card · Lv ${a.lv}`}${a.cost ? ` · ${a.cost} MP` : ' · tap to fire'}</em></span></button>`; };
const lockChip = sl => `<button class="dslot locked" type="button" data-dun="slot" data-slot="${sl}" aria-disabled="true"><span class="ds-art ds-lock">${ICON.lock || '?'}</span><span class="ds-copy"><small>${SLOT_INFO[sl].name}</small><b>Locked</b><em>Evolve to ${SLOT_INFO[sl].unlock} to unlock</em></span></button>`;
// (attr: what tapping it does, opening the Animas to bind them: the Tower tab's own handler, or a sheet's)
const animaChip = (attr = 'data-dun="animas"') => { animaRecognise(); const K = animaKitFor(st); if (!K) return `<button class="dslot an-slot" type="button" ${attr}><span class="ds-art an-ds">${AnimaArt.sigilSVG('aries')}</span><span class="ds-copy"><small>Anima</small><b>${ANIMA_ORDER.some(a => animaK(a)) ? 'Bind an Anima' : 'Sealed in the stars'}</b><em>${ANIMA_ORDER.some(a => animaK(a)) ? 'Choose who answers your summon' : 'Clear floor 1 to earn the first'}</em></span></button>`; const A = ANIMAS[K.main.id], B2 = K.res && ANIMAS[K.res.id]; return `<button class="dslot an-slot" type="button" ${attr} style="--ac:${A.color}"><span class="ds-art an-ds"><img alt="" src="${AnimaArt.picture(K.main.id, K.main.k, 44)}"></span>${B2 ? `<img class="an-ds2" alt="" src="${AnimaArt.picture(K.res.id, K.res.k, 44)}">` : ''}<span class="ds-copy"><small>${B2 ? `Animas · ${esc(A.sign)} + ${esc(B2.sign)}` : `Anima · ${esc(A.sign)}`}</small><b>${B2 ? `${esc(A.name)} + ${esc(B2.name)}` : `${esc(A.name)} ${esc(A.title)}`}</b><em>${B2 ? (K.resonance.generic ? 'Astral Harmony' : `Zodiac Resonance · ${esc(K.resonance.name)}`) : `${esc(A.role)} · ${'★'.repeat(K.main.k)}`}</em></span></button>`; };
let bookOpen = false;
function renderDungeon() {
  if (!st || !mapOpen || mapTab !== 'dungeon') return;
  $('#mapEnergy b').textContent = Math.round(st.energy) + '%';
  if ((st.dun.best || 0) > TOWER_TOP) st.dun.best = TOWER_TOP;   // saves from the taller tower
  const best = st.dun.best || 0;
  if (!dunSel || !dunFloorOpen(dunSel)) dunSel = Math.min(best + 1, TOWER_TOP);
  const F = floorDef(dunSel), K = petKit(st), S = K.stats, AB = K.AB, B = BIOMES[F.biome];
  const tower = towerSVG(best, dunSel);
  const owned = Object.keys(st.cards).length;
  const drinks = Object.keys(DRINKS).filter(k => st.pantry[k]);
  const seenN = MON_BOOK.filter(t => st.dun.seen[t] != null).length;
  const book = MON_BOOK.map(t => { const seen = st.dun.seen[t] != null, D = MON[t]; return `<div class="mb-card${seen ? '' : ' unseen'}"><img src="${monPortrait(t, seen)}" alt=""><b>${seen ? esc(D.name) : '???'}</b><small>${seen ? `${fmtNum(st.dun.seen[t])} beaten` : `From floor ${D.from < 99 ? D.from : 2}`}</small>${seen && bookOpen ? `<span>${esc(D.tip)}</span>` : ''}</div>`; }).join('');
  const gi = st.dun.grades[F.n] || 0;
  dunInner.innerHTML = `
    <section class="dun-crys" aria-label="Crystals">
      <span class="dc-gem">${ICON.crystal}</span>
      <div class="dc-copy"><b><span class="mono">${fmtNum(st.crystals || 0)}</span> crystals</b><span>For Animas, egg summons, evolving and ascending</span></div>
      <button class="btn dc-buy" type="button" data-dun="crystals">${ICON.crystal}<span>Get ${fmtNum(CRYSTAL_PACK)}<small>${CRYSTAL_PRICE} · test purchase</small></span></button>
    </section>
    <section class="dun-hero b-${F.biome}" style="--acc:${B.accent}">
      <div class="dun-art">${dunGateSVG(F)}</div>
      <p class="eyebrow">${F.fiend ? `Super Fiend · tier ${F.n / 10}${F.high ? ' · the high tower' : ''}` : F.boss ? `Act ${F.act + 1} finale · ${esc(B.name)}${F.high ? ' · the high tower' : ''}` : `Act ${F.act + 1} · ${esc(B.name)}${F.high ? ' · the high tower' : ''}`}</p>
      <h2>Floor ${F.n}${F.fiend ? ` · ${esc(F.fiend.name)}` : F.boss ? ` · ${esc(bossName(F))}` : ''}</h2>
      ${F.fiend ? recLevelHTML(F) : ''}
      <p class="dun-sub">${best ? `Highest floor cleared: ${best}.` : 'Clear a floor to open the next one.'} ${gi ? `Best grade here: ${gradeName(gi)}.` : ''} ${F.fiend ? `<b>${esc(F.fiend.name)}, ${esc(F.fiend.title)}</b>: a single vast arena and one colossal horror with ${F.fiend.bars} health bars and ${F.fiend.phases} phases. Summons once per fight. Read the ground, break what it leans on, and strike when it is bare.` : F.boss ? `${esc(bossName(F))} waits in the arena once the floor is clear. Finale bosses drop ability cards.` : `Every floor ends with a boss. The act finale is floor ${Math.ceil(F.n / ACT_LEN) * ACT_LEN}.`}</p>
      <button class="btn primary dun-go" type="button" data-dun="enter">${ICON.sword}Enter floor ${F.n}${st.unlockAll ? '' : ` <span class="cost">${ICON.bolt}3</span>`}</button>
    </section>
    <section class="dun-box dun-pet">
      ${pocketGridHTML([{ p: st, i: -1 }].concat(st.others.map((p, i) => ({ p, i }))), { cls: "scroll dp-pick", cur: p => p === st, attr: (p, i) => `data-dun="pick" data-i="${i}" aria-pressed="${p === st}"` })}
      <div class="dp-top">
        <span class="dp-portrait">${petSVG(curForm(), { frame: 'fit' })}<i class="dp-lv">${S.L}</i></span>
        <div class="dp-id"><b>${esc(st.name)} ${starsHTML(starsOf(st.rarity))}</b><span>Level ${S.L} · ${STAGES[st.stage].name} · <em class="rx-el small" style="--ec:${E8[petElement(st)].color}"><i></i>${E8[petElement(st)].name}</em></span><span class="dp-xp" role="meter" aria-label="Experience" aria-valuemin="0" aria-valuemax="${S.need}" aria-valuenow="${st.dxp || 0}"><i style="width:${clamp((st.dxp || 0) / S.need * 100, 0, 100).toFixed(1)}%"></i></span><small class="mono">${fmtNum(st.dxp || 0)} / ${fmtNum(S.need)} XP to level ${S.L + 1}</small></div>
      </div>
      <div class="dp-stats"><span class="hp">HP <b>${S.hp}</b></span><span class="mp">MP <b>${S.mp}</b></span><span class="at">Power <b>${S.atk}</b></span><span class="sz">Size <b>${Math.round(dunPetSize(st, curForm()) * 100)}%</b></span></div>
      ${evoBoxHTML()}
      ${feedPanelHTML(st, 'data-dun="feed"')}
      <div class="dp-slots">${SLOTS.map(sl => K.kit[sl] ? slotChip(sl, K.kit[sl]) : lockChip(sl)).join('')}${animaChip()}</div>
      ${accRowHTML(st)}
      <p class="note dp-sig"><b>Signature: ${esc(AB.twistName)}.</b> ${esc(AB.twistDesc)} It comes from ${esc(st.name)}'s DNA, so even with the same cards no other pet fights quite like this.</p>
      <div class="dp-row"><button class="btn" type="button" data-dun="cards">${ICON.cards}Ability cards <span class="mono">${owned}/${CARD_IDS.length}</span></button></div>
    </section>
    <section class="dun-box dun-gift">
      <span class="dg-box">${treasureSVG()}</span>
      <div><b>Treasure box</b><span>${fmtNum(GIFT_CRYSTALS)} crystals, 3 ability cards, 3 gemstones, a bundle and an energy drink.</span></div>
      <button class="btn primary" type="button" data-dun="gift">${ICON.gift}Shop</button>
    </section>
    <section class="dun-box dun-gift dun-summon">
      <span class="dg-box">${eggsSVG()}</span>
      <div><b>Egg summon</b><span>${SUMMON_N} eggs for ${fmtNum(SUMMON_COST)} crystals. ${starsHTML(3)} 84% · ${starsHTML(4)} 10% · ${starsHTML(5)} 5% · ${starsHTML(6)} 1%. ${pityLeft() ? `A six-star is certain after ${pityLeft()} more without one.` : `Your next 10-egg summon holds a six-star for certain.`} You have ${fmtNum(st.crystals || 0)} crystals.</span></div>
      <button class="btn primary" type="button" data-dun="summon">${ICON.egg}Summon</button>
    </section>
    <section class="dun-box dun-drinks">
      <div class="dd-top"><span class="dd-e">${ICON.bolt}Energy <b>${Math.round(st.energy)}%</b></span><small>Each floor uses 3. Energy drinks come in gift boxes.</small></div>
      ${drinks.length ? `<div class="dd-row">${drinks.map(k => `<button class="btn small" type="button" data-dun="drink" data-k="${k}">${SNACK_SVG[k]}${DRINKS[k].name} ×${st.pantry[k]} <span class="mono">+${DRINKS[k].energy}</span></button>`).join('')}</div>` : ''}
    </section>
    <section class="dun-box dun-party">
      <div class="mb-top"><h3 class="sec">Party</h3><span class="mono">${partyPets().length}/${PARTY_MAX}</span></div>
      ${partyHTML()}
      <p class="note">Up to four pets climb together. You play one and tap its portrait (or press Tab) to switch; each keeps its own health and cooldowns, and when one falls the next steps in. Switching is how you set up <b>elemental reactions</b>: one pet's hit leaves its element on a monster, a second pet's element sets it off.</p>
      <div class="rx-grid">${E8_ORDER.map(k => `<span class="rx-el" style="--ec:${E8[k].color}"><i></i>${E8[k].name}</span>`).join('')}</div>
      <button class="btn small" type="button" data-dun="rxbook">${rxOpen ? 'Hide reactions' : 'All 28 reactions'}</button>
      ${rxOpen ? `<ul class="rx-list">${Object.keys(REACTIONS).map(k => { const [a, b2] = k.split('+'), R = REACTIONS[k]; return `<li><span class="rx-pair"><i style="--ec:${E8[a].color}"></i><i style="--ec:${E8[b2].color}"></i></span><b style="color:${R.col}">${R.name}</b><span>${esc(RX_DESC[R.name] || '')}</span></li>`; }).join('')}<li><span class="rx-pair"><i style="--ec:${E8.dark.color}"></i><i style="--ec:${E8.light.color}"></i></span><b>Eclipse Core +</b><span>Fire: Nova, a large fire explosion at once. Thunder: Riftbolt, homing bolts. Earth: Eclipse Ward, a strong shield. Left alone, the core bursts after four seconds (three cores at most).</span></li><li><span class="rx-pair"><i style="--ec:${E8.ice.color}"></i><i style="--ec:${E8.earth.color}"></i></span><b>Shatter</b><span>A Strong or Ult Earth blow on a frozen target: a huge burst and heavy stagger.</span></li><li><span class="rx-pair"><i style="--ec:${E8.earth.color}"></i><i style="--ec:${E8.thunder.color}"></i></span><b>Stormbog</b><span>Thunder into Mire electrifies the mud: less slowing, repeated Thunder damage.</span></li></ul>` : ''}
      <p class="note">Monsters give experience: every level adds HP, MP and power. Evolving makes every ability stronger, and makes ${esc(st.name)} bigger in the Tower too.</p>
    </section>
    <section class="dun-box dun-tower">
      <div class="mb-top"><h3 class="sec">The Tower</h3><span class="mono">${best}/${TOWER_TOP} floors</span></div>
      <div class="tower-wrap" id="towerWrap">${tower}</div>
      <p class="note">A hundred and twenty floors. Every floor is built fresh each time you enter, mixing two or three lands, with traps and power stones in new places. Beat every monster and the floor's boss appears; the 4th floor of each act is the finale against that land's own boss. Every tenth floor is a <b>Super Fiend</b>; from floor 90 they fight in three acts on arenas that fight back, and above floor 100 the <b>high tower</b> begins: storm-torn lands, the creatures of old stories, and at the very top the Dune Sea and the Choir Above the Clouds. Finish fast, take little damage and keep your combo going for an S grade and a gold chest.</p>
      <div class="mb-top"><h3 class="sec">Super Fiends</h3><span class="mono">recommended levels</span></div>
      <ul class="fiend-list">${fiendListHTML(best)}</ul>
    </section>
    <section class="dun-box dun-book">
      <div class="mb-top"><h3 class="sec">Monster book</h3><span class="mono">${seenN}/${MON_BOOK.length}</span></div>
      <div class="mb-grid">${book}</div>
      <h3 class="sec">Bosses</h3>
      ${bossBookHTML(best)}
      <button class="btn small" type="button" data-dun="book">${bookOpen ? 'Hide tips' : 'Show tips'}</button>
    </section>
    <section class="dun-box">
      <h3 class="sec">How to play</h3>
      <ul class="howto">
        <li><b>Move</b><span>Drag anywhere on the screen (or use the arrow keys or WASD).</span></li>
        <li><b>Attack</b><span>Tap a monster, or tap anywhere to attack in that direction (Space or a click on a keyboard). Nothing fires by itself: every hit is yours, and every hit earns MP.</span></li>
        <li><b>Strong and Ult</b><span>Tap the buttons on the right (1 and E on a keyboard). They cost MP. HP and MP never refill on their own: earn MP with hits, and pick up red and blue orbs.</span></li>
        <li><b>Dodge</b><span>Tap Dodge (or Shift) to roll through anything. Red shapes on the ground show where an attack will land. Purple "!!" means a monster is using its ult. Roll just as it hits for a Perfect dodge: time slows and your next hits do +60% damage.</span></li>
        <li><b>Bosses</b><span>Every floor has one. Beat all the monsters and the floor's guardian drops in; on the act finale, the land's own boss waits in its arena. Bosses get faster and meaner at 66% and 33% health.</span></li>
        <li><b>Power stones</b><span>Glowing stones on the floor give you powers for the rest of the floor: orbiting blades, auto lasers, chainsaws, double shots and more. Pick the same one again to level it up.</span></li>
        <li><b>Traps and events</b><span>Arrow launchers, saw blades, mines, flame jets and laser fences hurt monsters as much as you: lure them in. Ambushes, meteor showers, blood moons and coin rain can happen at any moment.</span></li>
        <li><b>Shrines</b><span>Touch a glowing stone for Fury, Haste, Fortune, Arcane or a Guardian shield.</span></li>
        <li><b>Loot gremlin</b><span>If one shows up, chase it down before it escapes with its treasure. It sometimes carries a gemstone.</span></li>
        <li><b>Edges</b><span>Knock monsters off cliffs, into lava or water and they're gone for good.</span></li>
      </ul>
    </section>`;
  const tw = $('#towerWrap'), g2 = tw && tw.querySelector('.tw-fl.sel'); if (tw && g2) { const r = g2.querySelector('rect'), svg = tw.querySelector('svg'), k = svg.getBoundingClientRect().height / svg.viewBox.baseVal.height; tw.scrollTop = Math.max(0, (+r.getAttribute('y')) * k - tw.clientHeight * 0.55); }
}
dunInner.addEventListener('click', e => {
  const b = e.target.closest('[data-dun]');
  if (!b || !st) return;
  sfx.unlock();
  const k = b.dataset.dun;
  if (k === 'enter') startDungeon(dunSel);
  else if (k === 'floor') { const n = +b.dataset.n; if (!dunFloorOpen(n)) { toast(floorLockText(n)); sfx.wrong(); return; } dunSel = n; renderDungeon(); sfx.boop(); }
  else if (k === 'slot') openCards(b.dataset.slot);
  else if (k === 'animas') openAnimas();
  else if (k === 'acc') openAccs(b.dataset.t);
  else if (k === 'cards') openCards(cardsSlot);
  else if (k === 'gift') openGiftShop();
  else if (k === 'crystals') { labCtx = false; confirmCrystalBuy(); crysFrom = 'tower'; }
  else if (k === 'summon') openSummon();
  else if (k === 'drink') drinkNow(b.dataset.k);
  else if (k === 'feed') { if (feedPet(st, b.dataset.k)) renderDungeon(); }
  else if (k === 'swap') openCard();
  else if (k === 'pick') { const i = +b.dataset.i; if (i >= 0) { switchPet(i); renderDungeon(); } }
  else if (k === 'evolve') { const e = evoStatus(); if (e && e.bondOk && e.gemOk && e.crystalOk) { closeMap(); evolve(); } else { openCard(); } }
  else if (k === 'book') { bookOpen = !bookOpen; renderDungeon(); sfx.boop(); }
  else if (k === 'rxbook') { rxOpen = !rxOpen; renderDungeon(); sfx.boop(); }
  else if (k === 'party') { const uid = b.dataset.uid; if (uid === st.uid) { toast('The pet you play is always in the party.'); return; } if (togglePartyPet(uid)) { renderDungeon(); sfx.boop(); } else { toast(`The party is full (${PARTY_MAX}). Take someone out first.`); sfx.wrong(); } }
  else if (k === 'tfloor') { const n = +b.dataset.n; if (!dunFloorOpen(n)) { toast(floorLockText(n)); sfx.wrong(); return; } dunSel = n; renderDungeon(); sfx.boop(); }
});
function drinkNow(k) {
  if (!(st.pantry[k] > 0)) return;
  if (st.energy >= 99) { toast(`${st.name} is already full of energy.`); return; }
  st.pantry[k]--; if (!st.pantry[k]) delete st.pantry[k];
  const before = st.energy; st.energy = Math.min(100, st.energy + DRINKS[k].energy);
  if (st.asleep) { st.asleep = false; pet.awakeUntil = now() + 300; if (pet.mode === 'sleep') setMode('idle'); }
  sfx.yum(); sfx.sparkle();
  toast(`${st.name} drank a ${DRINKS[k].name.toLowerCase()}: energy ${Math.round(before)}% → ${Math.round(st.energy)}%`);
  updateHud(); saveSoon(); renderDungeon();
}

/* ---------- playing a floor ---------- */
function startDungeon(n, seed) {
  if (!dunFloorOpen(n)) return;
  if (!st.unlockAll && st.energy < 8) { tiredToast(); return; }
  const S = floorDef(n);
  if (seed) S.seed = seed;
  S.party = partyPets().map(p => { const k = petKit(p); k.name = p.name; return { p, kit: k }; });
  S.pet = S.party[0].kit; const teamAnima = animaKitFor(partyPets()); S.party.forEach(m => { m.kit.anima = teamAnima; });
  dunSel = n;
  launchArc(DUN_W, S, 0, n, 'dungeon', `Tower of Oblivion · Floor ${n}`, S.fiend ? `Super Fiend · ${S.fiend.name}` : S.boss ? bossName(S) : S.name);
}
function dunReadyHTML(S) {
  const K = S.pet, st2 = K.stats, B = BIOMES[S.biome];
  const facts = [`${esc(B.name)}${S.sec && S.sec !== S.biome ? ` with parts of ${esc(BIOMES[S.sec].name)}` : ''}${S.ter ? ` and ${esc(BIOMES[S.ter].name)}` : ''}`, S.monCount ? `${S.monCount} monsters` : '', S.shrineCount ? `${S.shrineCount} shrine${S.shrineCount > 1 ? 's' : ''}` : '', S.bossName ? `${S.boss ? 'Finale' : 'Guardian'}: ${esc(S.bossName)}` : ''].filter(Boolean).join(' · ');
  return `<div class="ar-card dun-ready b-${S.biome}" style="--acc:${B.accent}"><p class="eyebrow">${S.boss ? `Act ${S.act + 1} finale` : `Act ${S.act + 1}`}</p><h2>Floor ${S.n}${S.boss ? ` · ${esc(bossName(S))}` : ` · ${esc(B.name)}`}</h2>
    <p class="ar-goal">${S.boss ? `Clear the floor, then face ${esc(bossName(S))} in the arena. Step or roll out of the warning zones!` : 'Defeat every monster, then the floor\'s boss.'}</p>
    <p class="note dr-facts">${facts}</p>
    <div class="dr-stats"><span>Level <b>${st2.L}</b></span><span class="hp">HP <b>${st2.hp}</b></span><span class="mp">MP <b>${st2.mp}</b></span></div>
    <div class="dr-kit">${kitSlots(st).map(sl => { const a = K.kit[sl], E = ELEMENTS[a.el] || ELEMENTS.spark; return `<span class="dr-ab"><span class="ds-art" style="--ec:${E.color};--ed:${E.dark}">${glyphSVG(a.glyph)}</span><small>${SLOT_INFO[sl].short}</small><b>${esc(a.name)}</b></span>`; }).join('')}</div>
    ${S.party && S.party.length > 1 ? `<div class="dr-party">${S.party.map((m, i) => { const el = petElement(m.p); return `<span class="dr-pm${i ? '' : ' lead'}" style="--ec:${E8[el].color}"><span class="dr-pa">${petSVG(formOf(m.p), { frame: 'fit' })}</span><b>${esc(m.p.name)}</b><small>${E8[el].name} · Lv ${m.p.dlv || 1}</small></span>`; }).join('')}</div><p class="note">Tap the portrait in the top-left (or Tab) to switch pets. A second element on a marked monster sets off a reaction.</p>` : ''}
    <p class="note">Move with the stick on the left. Tap a monster, or anywhere, to attack that way: nothing fires on its own. Hits earn MP. Tap Strong, Ult and Dodge (on a keyboard: 1, 3 and 4 for Strong, 2 or E for Ult, Shift to dodge, Space attacks, Tab switches pets).</p>
    <button class="btn primary" type="button">${ICON.play}Start</button></div>`;
}
/* experience outside a fight (floor clear bonus): levels up quietly */
function dunAddXP(n, p) {
  p = p || st; let lv = 0;
  p.dxp = (p.dxp || 0) + Math.round(n);
  while (p.dxp >= dunXpNeed(p.dlv || 1) && (p.dlv || 1) < DLV_MAX) { p.dxp -= dunXpNeed(p.dlv || 1); p.dlv = (p.dlv || 1) + 1; lv++; }
  return lv;
}
/* ---- levelling by hand: feed a pet from the pantry and it gains Tower experience on the spot ---- */
const FOOD_KEYS = () => Object.keys(SNACKS).filter(k => (st.pantry[k] || 0) > 0 && !SNACKS[k].drink);
function feedPanelHTML(p, attr) {
  const L = p.dlv || 1, need = dunXpNeed(L), have = p.dxp || 0, keys = FOOD_KEYS(), maxed = L >= DLV_MAX;
  return `<div class="feed-panel" data-feed-uid="${p.uid}"><div class="fp-top"><span><b>Level ${L}</b>${maxed ? ' · max' : ` · ${fmtNum(Math.max(0, need - have))} XP to ${L + 1}`}</span><span class="mono">${fmtNum(have)} / ${fmtNum(need)}</span></div><span class="bar fp-bar"><i style="width:${clamp(have / need * 100, 0, 100).toFixed(1)}%"></i></span>
    ${keys.length ? `<div class="fp-row">${keys.map(k => `<button class="btn small" type="button" ${attr} data-k="${k}"${maxed && !SNACKS[k].bondLv ? ' disabled' : ''}>${SNACK_SVG[k] || ''}${esc(SNACKS[k].name)} <span class="mono">×${st.pantry[k]}</span><small>${foodEffect(k, p)}</small></button>`).join('')}</div>` : '<p class="note">No food in the pantry. Grow it on the farm, pick up what monsters drop, or open a treasure box: its Ambrosia feeds a third of a level at once.</p>'}
    <p class="note fp-note">Feeding levels ${esc(p.name)} up outside the Tower. Every level adds HP, MP and power.</p></div>`;
}
function feedPet(p, k) {
  const s = SNACKS[k];
  if (!p || !s || !(st.pantry[k] > 0)) { sfx.wrong(); return false; }
  // a bond food: whole bond levels, kept progress, for whichever pet eats it
  if (s.bondLv) {
    if (bondInfo(p.xp || 0).level >= 99) { sfx.wrong(); toast(`${p.name}'s bond is already as deep as it goes`); return false; }
    st.pantry[k]--; if (!st.pantry[k]) delete st.pantry[k];
    const b0 = bondInfo(p.xp || 0).level; addBondTo(p, bondFoodXP(p, s.bondLv)); sfx.yum();
    if (p !== st) toast(`${p.name} loved the ${s.name.toLowerCase()}: bond level ${b0} → ${bondInfo(p.xp || 0).level}`);
    saveSoon(); return true;
  }
  if ((p.dlv || 1) >= DLV_MAX) { sfx.wrong(); return false; }
  st.pantry[k]--; if (!st.pantry[k]) delete st.pantry[k];
  const before = p.dlv || 1, fx = foodXP(k, p), lv = dunAddXP(fx, p);
  sfx.yum(); if (lv) { sfx.sparkle(); toast(`${p.name} is level ${p.dlv}! (${before} → ${p.dlv})`); } else toast(`${p.name} ate the ${SNACKS[k].name.toLowerCase()}: +${fmtNum(fx)} XP`);
  saveSoon(); return true;
}
function petByUid(uid) { return st.uid === uid ? st : (st.others || []).find(o => o.uid === uid) || st; }
function bossCardRarity(n) {
  const t = n < 8 ? [['common', 62], ['rare', 32], ['epic', 6]] : n < 16 ? [['common', 38], ['rare', 44], ['epic', 15], ['legend', 3]] : [['rare', 55], ['epic', 35], ['legend', 10]];
  return wkeyR(Math.random, t);
}
function chestSVG(kind) {
  const C = { gold: ['#FFE37A', '#F2B61F', '#A2680A'], silver: ['#F4F7FF', '#B9C4D9', '#6B7A99'], bronze: ['#F2B38A', '#C98A5E', '#7A4A2B'], wood: ['#D2A266', '#A8743F', '#5E4630'] }[kind] || ['#D2A266', '#A8743F', '#5E4630'];
  const L = 'stroke="#2B2433" stroke-width="3" stroke-linejoin="round"';
  return `<svg class="chestsvg" viewBox="0 0 120 100" aria-hidden="true"><g class="ch-body"><rect x="16" y="46" width="88" height="46" rx="6" fill="${C[1]}" ${L}/><path d="M16 60h88" stroke="${C[2]}" stroke-width="4"/><rect x="52" y="52" width="16" height="18" rx="3" fill="#FFD447" ${L}/></g><g class="ch-lid"><path d="M14 48Q14 18 60 18T106 48Z" fill="${C[0]}" ${L}/><path d="M36 24V48M84 24V48" stroke="${C[2]}" stroke-width="5"/></g><g class="ch-shine" fill="#FFFFFF"><path d="M60 0l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"/></g></svg>`;
}
function dunFinish(win, msg, data) {
  if (arc.api && arc.api.def && arc.api.def.rift) return arc.api.def.rift.gate ? gateFinish(win, msg, data) : riftFinish(win, msg, data);
  const n = arc.s, F = floorDef(n), first = win && n > (st.dun.best || 0), lv0 = (st.dlv || 1) - (data.lvls || 0);
  st.dun.runs = (st.dun.runs || 0) + 1; st.dun.kills = (st.dun.kills || 0) + (data.kills || 0);
  const GR = win && data.grade ? GRADES.find(x => x.g === data.grade) : null;
  const lines = [];
  const coins = Math.round(((data.coins || 0) + (win ? 25 + 8 * n : 0)) * (GR ? GR.coinMul : 1) * coinMul());
  st.coins += coins; lines.push([ICON.coin, `+${coins} coins${GR && GR.coinMul > 1 ? ` (×${GR.coinMul} ${GR.chest} chest)` : ''}`]);
  let xp = data.xp || 0;
  if (win) { const bonus = 30 + 8 * n; dunAddXP(bonus); xp += bonus; }
  if (xp) lines.push([ICON.sparkle, `+${fmtNum(xp)} experience`]);
  if ((st.dlv || 1) > lv0) lines.push([ICON.star, `Level up! ${st.name} is level ${st.dlv}`]);
  const gems = (data.gems || []).slice();
  if (GR && Math.random() < GR.gem) gems.push(wkeyR(Math.random, GIFT_GEMS));
  gems.forEach(k => { st.gems[k] = Math.min(99, (st.gems[k] || 0) + 1); });
  if (gems.length) lines.push([gemSVG(gems[0]), gems.length > 1 ? `${gems.length} gemstones: ${gems.map(k => GEMS[k].name).join(', ')}` : `${/^[AEIOU]/.test(GEMS[gems[0]].name) ? 'An' : 'A'} ${GEMS[gems[0]].name}`]);
  // accessories: every piece picked up comes home, win or lose; a cleared floor sometimes leaves one more in its chest
  const accs = (data.accs || []).slice();
  if (win && Math.random() < 0.15 + (GR ? ({ S: 0.35, A: 0.2, B: 0.1 }[GR.g] || 0) : 0)) accs.push(rollAccessory(n, { bonus: F.boss || F.fiend ? 12 : 4 }));
  if (accs.length) { const got = accBank(accs); got.kept.slice().sort((a, b) => b.r - a.r).slice(0, 5).forEach(a => lines.push([accSVG(a), `${ACC_R[a.r].name} ${accName(a)}: ${accLines(a).join(', ')}`])); if (got.kept.length > 5) lines.push([ICON.sparkle, `+${got.kept.length - 5} more accessories`]); if (got.scrapped) lines.push([ICON.coin, `Accessory bag full: ${got.scrapped} salvaged for ${got.coins} coins`]); }
  const food = data.food || {}, fk = PANTRY_KEYS.filter(k => food[k] > 0);
  if (fk.length) lines.push([SNACK_SVG[fk.includes('ambrosia') ? 'ambrosia' : fk[fk.length - 1]], `Food: ${fk.map(k => `${food[k]} ${SNACKS[k].name}`).join(', ')}`]);
  let card = null;
  if (win) {
    // a cleared floor is a third of a bond level for every pet in the party
    const team = partyPets(); team.forEach(p => addBondTo(p, Math.round(bondLevelOf(p) / 3)));
    lines.push([ICON.heart, team.length > 1 ? `+1/3 bond level for each of the ${team.length} pets in the party` : '+1/3 bond level']);
    /* boss crystals are a first-win prize: a boss beaten again pays out food, coins and cards instead */
    const bossFl = F.boss || F.fiend;
    if (!bossFl || first) { st.crystals = (st.crystals || 0) + CRYSTALS_PER_FLOOR; lines.push([ICON.crystal, `+${CRYSTALS_PER_FLOOR} crystals`]); }
    if (first) { st.dun.best = n; const R10 = n % 10 === 0 ? RIFT_PLAN.find(q => q.n === n / 10 && !q.final) : null; if (R10 && riftBuilt(R10.id) && !riftSealed(R10.id)) lines.push([ICON.star, `Rift ${R10.n} is open: ${R10.name}`]); if (n < TOWER_TOP && !dunFloorOpen(n + 1)) lines.push([ICON.door, floorLockText(n + 1)]); else if (n < TOWER_TOP) lines.push([ICON.door, `Floor ${n + 1} is open${fiendFor(n + 1) ? ': a Super Fiend waits!' : (n + 1) % ACT_LEN === 0 ? ': the act finale!' : ''}`]); else lines.push([ICON.trophy, 'The top of the Tower of Oblivion!']); animaRecognise().forEach(a => lines.push([AnimaArt.sigilSVG(a, ANIMAS[a].color), ANIMAS[a].secret ? `${ANIMAS[a].name}, ${ANIMAS[a].title}, is at peace and answers your call: ${ANIMAS[a].sign}, the thirteenth Anima!` : `${ANIMAS[a].name} ${ANIMAS[a].title} recognises you! A new Anima answers your call.`])); }
    if (GR) { const gi = GRADE_IDX[GR.g]; if (gi > (st.dun.grades[n] || 0)) { if (st.dun.grades[n]) lines.push([ICON.trophy, `New best grade on floor ${n}: ${GR.g}`]); st.dun.grades[n] = gi; } }
    if (F.boss) {
      if (first) { st.pearls += 20; lines.push([ICON.pearl, '+20 pearls for your first win']); }
      if (first || Math.random() < 0.25 + (GR ? GR.card : 0)) { const id = rollCardId(Math.random, bossCardRarity(n)); card = Object.assign(grantCard(id), { id }); }
    } else if (Math.random() < 0.08 + (GR ? GR.card : 0)) { const id = rollCardId(Math.random, bossCardRarity(Math.max(1, n - 4))); card = Object.assign(grantCard(id), { id }); }
    if (F.fiend) { const rb = F.fiend.baseBars || F.fiend.bars, cr = 100 * rb, pr = 40 + 10 * rb; if (first) { st.crystals = (st.crystals || 0) + cr; lines.push([ICON.crystal, `+${cr} crystals for the Super Fiend`]); } st.pearls += pr; st.gems.starstone = Math.min(99, (st.gems.starstone || 0) + 1); lines.push([ICON.pearl, `+${pr} pearls`], [gemSVG('starstone'), 'A Starstone']); if (!card) { const id = rollCardId(Math.random, n >= 50 ? 'legend' : 'epic'); card = Object.assign(grantCard(id), { id }); } }
    if (bossFl && !first) lines.push([ICON.crystal, 'Boss crystals were your first-win prize']);
    if (data.bossName) lines.push([ICON.sword, `${data.bossName} defeated`]);
  } else { addXP(3); lines.push([ICON.heart, '+3 bond for trying']); }
  saveSoon(); updateHud();
  const nextOpen = win && dunFloorOpen(n + 1);
  setTimeout(() => {
    if (!arc.open) return;
    const P = data.parts;
    const gradeHTML = GR ? `<div class="dun-grade g-${GR.g}" style="--gc:${GR.color}"><div class="dg-chest">${chestSVG(GR.chest)}</div><div class="dg-stamp"><b>${GR.g}</b><small>${GR.chest === 'wood' ? 'Wooden' : GR.chest[0].toUpperCase() + GR.chest.slice(1)} chest</small></div>${P ? `<ul class="dg-parts"><li><span>Speed</span><b>${P.time}/35</b></li><li><span>Health</span><b>${P.hp}/35</b></li><li><span>${F.boss ? 'Style' : 'Combo'}</span><b>${P.combo}/20</b></li><li><span>Perfect dodges</span><b>${P.dodge}/10</b></li></ul>` : ''}</div>` : '';
    const cardHTML = card ? `<div class="dun-drop"><p class="eyebrow">${F.boss ? 'Boss chest' : 'Chest bonus'}</p>${abilityCardHTML(cardAbility(card.id, st.cards[card.id] || 1), { isNew: card.isNew, up: card.up, maxed: card.maxed })}<small>${card.maxed ? `Already maxed: +${card.coins} coins` : card.isNew ? 'A new ability card!' : `Levelled up to Lv ${card.lv}`}</small></div>` : '';
    arcPanel.innerHTML = `<div class="ar-card end dun-end"><p class="eyebrow">Tower of Oblivion · Floor ${n} · ${esc(F.fiend ? F.fiend.title : BIOMES[F.biome].name)}</p><h2>${win ? (F.fiend ? 'Super Fiend slain!' : F.boss ? 'Finale cleared!' : 'Floor cleared!') : 'Knocked out!'}</h2>
      ${win ? '' : `<p class="ar-goal">${esc(msg || 'So close! Level up or try new cards.')}</p>`}
      ${gradeHTML}
      <div class="dr-stats"><span>Monsters <b>${data.kills || 0}</b></span><span>Best combo <b>${data.combo || 0}</b></span>${data.perfects ? `<span>Perfect dodges <b>${data.perfects}</b></span>` : ''}<span>Level <b>${st.dlv}</b></span></div>
      ${cardHTML}
      <ul class="rewards">${lines.map(l => `<li>${l[0] || ''}<span>${esc(l[1])}</span></li>`).join('')}</ul>
      <div class="ar-row"><button class="btn" type="button" data-arc="map">${ICON.door}Lobby</button><button class="btn" type="button" data-arc="retry">Retry</button>${nextOpen ? `<button class="btn primary" type="button" data-arc="next">Floor ${n + 1}${ICON.play}</button>` : ''}</div></div>`;
    arcPanel.hidden = false;
    if (GR) { if (GR.g === 'S') { sfx.fanfare(); } else sfx.sparkle(); }
    if (card) { sfx.sparkle(); if (card.isNew) setTimeout(() => sfx.fanfare(), 300); }
  }, win ? 450 : 650);
}

/* ---------- the ability card collection ---------- */
// the sheet dresses one pet: the one you play, unless the Team screen opened it for another (cardsUid)
let cardsSlot = 'normal', cardsSel = null, cardsUid = null, cardsFrom = null;
const cardsPet = () => cardsUid ? petByUid(cardsUid) : st;
function openCards(slot, uid, from) { cardsUid = uid || null; cardsFrom = from || null; const P = cardsPet(); cardsSlot = SLOTS.includes(slot) && slotOpen(slot, P.stage) ? slot : 'normal'; cardsSel = null; openSheet('cards', ''); renderCards(); }
function renderCards() {
  if (sheetKind !== 'cards' || !st) return;
  const P = cardsPet();
  if (!slotOpen(cardsSlot, P.stage)) cardsSlot = 'normal';
  const K = petKit(P), deck = cleanDeck(P.deck, P), curId = deck[cardsSlot], curMv = elemParse(curId), cur = curMv ? curId : curId && st.cards[curId] ? curId : null;
  const own = innateAbility(cardsSlot, K.AB, P), elsewhere = id => SLOTS.find(s => s !== cardsSlot && deck[s] === id);
  const ids = CARD_IDS.filter(id => CARDS[id].slot === slotType(cardsSlot)).sort((a, b) => R_ORDER.indexOf(CARDS[a].r) - R_ORDER.indexOf(CARDS[b].r));
  // the pet's elemental moves for this slot (every pet may learn its element's Strongs; only five- and six-stars its Ultimates)
  const e8 = petElement(P), moves = elemMovesFor(P, slotType(cardsSlot)), moveAb = mv => { const lock = elemLock(mv, P); return Object.assign(elemAbility(mv, cardsSlot, P), lock ? { locked: true, lock } : {}); };
  const abOf = id => id === 'own' ? own : elemParse(id) ? moveAb(elemParse(id)) : st.cards[id] ? cardAbility(id, st.cards[id]) : Object.assign(cardAbility(id, 1), { locked: true });
  const sel = abOf(cardsSel || cur || 'own');
  const selId = sel.elem ? sel.id : sel.own ? 'own' : sel.card, equipped = selId === 'own' ? !cur : cur === selId;
  const pw = Math.round(sel.mult * 100);
  const lockText = sel.lock === 'stars' ? `An elemental Ultimate: only five- and six-star pets can learn one.` : sel.lock === 'level' ? `${esc(P.name)} learns it at Dungeon level ${sel.lv} (now ${P.dlv || 1}).` : sel.locked ? `A ${CARD_R[sel.r].name.toLowerCase()} card. Find it in gift boxes or boss chests.` : '';
  const detail = `<div class="cd-detail">${abilityCardHTML(sel, { big: true, locked: sel.locked && !sel.elem })}<div class="cd-copy"><p class="eyebrow">${sel.elem ? `${E8[e8].name} move${sel.slot === 'ult' || slotType(sel.slot) === 'ult' ? ' · Ultimate' : ''}` : SLOT_INFO[cardsSlot].name}</p><h3>${sel.locked && !sel.elem ? 'Not found yet' : esc(sel.name)}</h3><p>${sel.locked && !sel.elem ? esc(lockText) : esc(sel.desc)}</p>
    ${sel.locked && !sel.elem ? '' : `<p class="cd-nums mono">${sel.cost ? `${sel.cost} MP · ${sel.cd.toFixed(1)}s cooldown · ` : 'Tap to fire · free · '}power ${pw}%${sel.own ? '' : ` · Lv ${sel.lv}/${CARD_MAX_LV}`}</p>`}
    ${sel.elem && sel.locked ? `<p class="note">${ICON.lock || '🔒'} ${esc(lockText)}</p>` : sel.locked ? '' : equipped ? `<span class="cd-eq">${ICON.star}Equipped</span>` : `<button class="btn primary" type="button" data-go="card-eq" data-id="${selId}">Equip${selId !== 'own' && elsewhere(selId) ? ` (moves from ${SLOT_INFO[elsewhere(selId)].short})` : ''}</button>`}</div></div>`;
  const grid = [`<button class="cbtn" type="button" data-go="card-pick" data-id="own"${selId === 'own' ? ' aria-current="true"' : ''}>${abilityCardHTML(own, { equipped: !cur })}</button>`]
    .concat(ids.map(id => { const has = st.cards[id], a = has ? cardAbility(id, has) : cardAbility(id, 1); return `<button class="cbtn" type="button" data-go="card-pick" data-id="${id}"${selId === id ? ' aria-current="true"' : ''}>${abilityCardHTML(a, { locked: !has, equipped: cur === id })}</button>`; })).join('');
  const known = moves.filter(mv => !elemLock(mv, P)).length;
  const egrid = moves.map(mv => { const a = moveAb(mv); return `<button class="cbtn${a.locked ? ' elocked' : ''}" type="button" data-go="card-pick" data-id="${a.id}"${selId === a.id ? ' aria-current="true"' : ''}>${abilityCardHTML(a, { equipped: cur === a.id })}${a.locked ? `<span class="elock">${a.lock === 'stars' ? '★5' : `Lv ${mv.lv}`}</span>` : ''}</button>`; }).join('');
  const emoves = `<p class="eyebrow cd-sub">${E8[e8].name} moves · ${known}/${moves.length} learned</p><p class="note">${slotType(cardsSlot) === 'ult' ? `${E8[e8].name} Ultimates. Only five- and six-star pets learn them; each unlocks at a Dungeon level.` : `${E8[e8].name} Strong attacks. Every ${E8[e8].name} pet learns them, one by one, as its Dungeon level rises.`}</p><div class="cgrid">${egrid}</div>`;
  const owned = Object.keys(st.cards).length;
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    ${cardsFrom === 'team' ? `<button class="btn small team-back" type="button" data-go="team">${ICON.back || ''}Team</button>` : ''}
    <p class="eyebrow">${esc(P.name)}'s abilities · ${owned}/${CARD_IDS.length} cards</p><h2 class="title" id="sheetTitle">Ability cards</h2>
    <div class="ctabs" role="tablist">${SLOTS.map(s => { const a = K.kit[s]; return a ? `<button class="ctab" role="tab" type="button" data-go="cards-tab" data-slot="${s}" aria-selected="${s === cardsSlot}"><small>${SLOT_INFO[s].short}</small><b>${esc(a.name)}</b></button>` : `<button class="ctab locked" role="tab" type="button" aria-disabled="true" title="Unlocks at ${SLOT_INFO[s].unlock}"><small>${SLOT_INFO[s].short}</small><b>${ICON.lock || ''}${SLOT_INFO[s].unlock}</b></button>`; }).join('')}</div>
    <p class="note">${SLOT_INFO[cardsSlot].note}${cardsSlot === 'ult' && K.kit.ult.tier ? ` <b>${esc(K.kit.ult.name)}</b> is the Celestial form of ${esc(K.kit.ult.baseName)}.` : cardsSlot === 'ult' ? ' Reach Celestial (stage 7) to upgrade it.' : ''}${slotType(cardsSlot) === 'strong' && strongSlots(P.stage) < 3 ? ` More Strong slots open at ${strongSlots(P.stage) < 2 ? 'Adept and Guardian' : 'Guardian'}.` : ''}</p>
    ${detail}
    ${slotType(cardsSlot) !== 'normal' ? emoves : ''}
    <p class="eyebrow cd-sub">Ability cards</p>
    <div class="cgrid">${grid}</div>
    <p class="note">Ability cards come from gift boxes and boss chests. Every pet in your house can use them. Getting a card again levels it up, to Lv ${CARD_MAX_LV}.</p>
    <button class="btn" type="button" data-go="gift">${ICON.gift}Gift box shop</button>`;
}
function equipCard(id) {
  if (!st) return;
  const P = cardsPet();
  P.deck = cleanDeck(P.deck, P);
  const mv = elemParse(id);
  if (id === 'own') P.deck[cardsSlot] = null;
  else if ((mv ? !elemLock(mv, P) : !!st.cards[id]) && deckFits(id, cardsSlot, P) && slotOpen(cardsSlot, P.stage)) { const prev = P.deck[cardsSlot]; SLOTS.forEach(s => { if (s !== cardsSlot && P.deck[s] === id) P.deck[s] = prev && deckFits(prev, s, P) ? prev : null; }); P.deck[cardsSlot] = id; }
  else return;
  cardsSel = id;
  sfx.sparkle(); saveSoon();
  renderCards(); renderDungeon();
}

/* ---------- the Tower itself: a hundred floors drawn as a tower you climb, every tenth a Super Fiend's tier ---------- */
let rxOpen = false;
const RX_DESC = {
  Vaporise: 'Fire and Water: the hit is amplified in a burst of steam.', Melt: 'Fire and Ice: the hit is amplified and Chill or Freeze is removed.', Overload: 'Fire and Thunder: an explosion with strong knockback and stagger.',
  Freeze: 'Water and Ice: freezes ordinary monsters; builds the stagger meter on bosses.', Electrocute: 'Water and Thunder: repeated Thunder damage that chains to nearby Wet monsters.', Fracture: 'Ice and Thunder: the target turns brittle and takes 30% more damage for a while.',
  Firestorm: 'Wind and Fire: spreads Fire marks and burns everything around the target.', Mist: 'Wind and Water: spreads Wet to nearby monsters, ready for other reactions.', Blizzard: 'Wind and Ice: spreads Chill and deals Ice damage around the target.', Chainstorm: 'Wind and Thunder: branching Thunder strikes into nearby monsters.',
  Sandstorm: 'Wind and Earth: an abrasive cloud that grinds monsters and swallows their shots.', Magma: 'Earth and Fire: a lava patch that burns whatever stands in it.', Mire: 'Earth and Water: mud that slows monsters.', Permafrost: 'Earth and Ice: frost armour shields your pet.', Rupture: 'Earth and Thunder: the ground erupts under the target with high stagger.',
  'Solar Flare': 'Light and Fire: a burst of Light damage around the target.', Purification: 'Light and Water: restorative motes that heal and cleanse one harmful status.', Prism: 'Light and Ice: the next direct hit refracts into weaker bolts at nearby monsters.', Judgement: 'Light and Thunder: the next three direct hits call down extra Light bolts.', Sanctuary: 'Light and Earth: a small protective circle where your pet takes 40% less damage.', Aurora: 'Light and Wind: spreads Light marks and quickens your pet for a moment.',
  Hellfire: 'Dark and Fire: a lingering burning curse that also halves healing received.', Miasma: 'Dark and Water: a corrupted pool that damages monsters and returns a little health to you (capped).', Deathfrost: 'Dark and Ice: a slowing curse that ends in a delayed burst of Dark damage.', Soulshock: 'Dark and Thunder: interrupts and staggers hard.', Gravebind: 'Dark and Earth: shadowed stone roots the target; bosses build stagger instead.', Dreadstorm: 'Dark and Wind: a vortex that pulls smaller monsters in and spreads Dark marks.', Eclipse: 'Dark and Light: an unstable Eclipse Core that collapses into a delayed burst, or reacts to a third element.',
};
function partyHTML() {
  const party = partyPets(), rest = st.others.filter(p => !party.includes(p)).map(p => ({ p, i: st.others.indexOf(p) }));
  const slots = party.map(p => { const el = petElement(p), K = petCombat(p); return `<button class="pt-pet on${p === st ? ' lead' : ''}" type="button" data-dun="party" data-uid="${p.uid}" aria-pressed="true" aria-label="${esc(p.name)}, ${E8[el].name}, level ${K.L}, in the party"><span class="pt-art">${petSVG(formOf(p), { frame: 'fit' })}</span><b>${esc(p.name)}</b><small><em class="rx-el small" style="--ec:${E8[el].color}"><i></i>${E8[el].name}</em> · Lv ${K.L}</small><i class="pt-badge">${p === st ? 'YOU' : party.indexOf(p) + 1}</i></button>`; });
  while (slots.length < PARTY_MAX) slots.push(`<div class="pt-pet empty"><span class="pt-art pt-empty">${ICON.sparkle}</span><b>Empty</b><small>pick below</small></div>`);
  const pocket = rest.length ? `<p class="note pt-note">Pocket dimension · ${rest.length} resting. Tap one to add it to the party${party.length >= PARTY_MAX ? ' (tap a party pet first to make room)' : ''}.</p>${pocketGridHTML(rest, { cls: 'scroll', attr: p => `data-dun="party" data-uid="${p.uid}"` })}` : '';
  return `<div class="party-grid four">${slots.join('')}</div>${pocket}`;
  return `<div class="party-grid">${[].map(p => { const on = party.includes(p), el = petElement(p), K = petCombat(p); return `<button class="pt-pet${on ? ' on' : ''}${p === st ? ' lead' : ''}" type="button" data-dun="party" data-uid="${p.uid}" aria-pressed="${on}" aria-label="${esc(p.name)}, ${E8[el].name}, level ${K.L}${on ? ', in the party' : ''}"><span class="pt-art">${petSVG(formOf(p), { frame: 'fit' })}</span><b>${esc(p.name)}</b><small><em class="rx-el small" style="--ec:${E8[el].color}"><i></i>${E8[el].name}</em> · Lv ${K.L}</small>${on ? `<i class="pt-badge">${p === st ? 'YOU' : party.indexOf(p) + 1}</i>` : ''}</button>`; }).join('')}</div>`;
}
/* the recommended level for a Super Fiend, in plain words, with where you stand */
function recLevelHTML(F) {
  const lv = st.dlv || 1, rec = F.fiend.rec, ok = lv >= rec, near = !ok && lv >= rec * 0.8;
  return `<p class="dun-rec ${ok ? 'ok' : near ? 'near' : 'low'}"><b>Recommended level ${rec}</b><span>${ok ? `${esc(st.name)} is level ${lv}: ready.` : near ? `${esc(st.name)} is level ${lv}: close, but ${rec - lv} short. It will be a hard fight.` : `${esc(st.name)} is level ${lv}: ${rec - lv} levels short. Climb more floors and feed it first.`}</span></p>`;
}
/* every Super Fiend in the Tower with the level it asks for */
function fiendListHTML(best) {
  const lv = st.dlv || 1;
  return FIENDS.map((FD, i) => { const n = (i + 1) * 10, F = fiendFor(n), done = best >= n, open = dunFloorOpen(n), ok = lv >= F.rec;
    return `<li class="${done ? 'done' : open ? 'open' : 'locked'}" data-dun="tfloor" data-n="${n}" role="button" tabindex="0"><i style="--fc:${FD.glow}"></i><span class="fl-n">${n}</span><span class="fl-name"><b>${esc(FD.name)}</b><small>${esc(FD.title)} · ${F.bars} bars · ${F.phases} phases</small></span><span class="fl-rec ${ok ? 'ok' : 'low'}">Lv ${F.rec}${done ? ' · beaten' : ok ? '' : ` · you ${lv}`}</span></li>`; }).join('');
}
function towerSVG(best, sel) {
  const FH = 26, W = 300, N = TOWER_TOP, H = N * FH + 160, bx = 60, bw = 190, out = [];
  // the stone of the tower, narrowing a little toward the top
  const wAt = n => bw - (n / N) * 16, xAt = n => W / 2 - wAt(n) / 2;
  out.push(`<defs><linearGradient id="twSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A0616"/><stop offset="0.5" stop-color="#1E1640"/><stop offset="1" stop-color="#3A2A60"/></linearGradient><linearGradient id="twStone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2A2448"/><stop offset="0.45" stop-color="#4A4078"/><stop offset="1" stop-color="#1E1838"/></linearGradient><radialGradient id="twGlow"><stop offset="0" stop-color="#FFE37A" stop-opacity=".9"/><stop offset="1" stop-color="#FFE37A" stop-opacity="0"/></radialGradient></defs>`);
  out.push(`<rect width="${W}" height="${H}" fill="url(#twSky)"/>`);
  for (let i = 0; i < 90; i++) out.push(`<circle cx="${(i * 97) % W}" cy="${(i * 211) % H}" r="${0.6 + (i % 3) * 0.5}" fill="#FFF" opacity="${0.25 + (i % 4) * 0.15}"/>`);
  // clouds drifting past the upper floors
  for (let i = 0; i < 7; i++) { const y = 200 + i * 300, x = (i * 131) % W; out.push(`<ellipse cx="${x}" cy="${y}" rx="60" ry="14" fill="#FFFFFF" opacity=".06"/><ellipse cx="${x + 30}" cy="${y - 8}" rx="34" ry="12" fill="#FFFFFF" opacity=".05"/>`); }
  const yOf = n => H - 60 - n * FH;   // the bottom edge of floor n's band
  out.push(`<path d="M${xAt(0) - 24} ${H - 40} L${xAt(N) - 12} ${yOf(N) - FH - 4} L${xAt(N) + wAt(N) + 12} ${yOf(N) - FH - 4} L${xAt(0) + wAt(0) + 24} ${H - 40} Z" fill="url(#twStone)" stroke="#120E22" stroke-width="3"/>`);
  for (let n = 1; n <= N; n++) {
    const F = floorDef(n), y = yOf(n), x = xAt(n), w = wAt(n), fiend = F.fiend, open = dunFloorOpen(n), done = n <= best, cur = n === sel, B = BIOMES[F.biome], gi = st.dun.grades[n] || 0;
    const fill = fiend ? (done ? '#2C5637' : '#3A1030') : done ? '#3F7A4D' : open ? '#5A4A8C' : '#241E40';
    out.push(`<g class="tw-fl${done ? ' done' : ''}${open ? '' : ' locked'}${cur ? ' sel' : ''}${fiend ? ' fiend' : ''}" data-dun="tfloor" data-n="${n}" role="button" tabindex="${open ? 0 : -1}" aria-label="Floor ${n}${fiend ? ', Super Fiend ' + fiend.name : F.boss ? ', ' + bossName(F) : ', ' + B.name}${done ? ', cleared' : open ? '' : ', locked'}">`);
    out.push(`<rect x="${x}" y="${y - FH + 1}" width="${w}" height="${FH - 2}" rx="4" fill="${fill}" stroke="${cur ? '#FFE37A' : '#120E22'}" stroke-width="${cur ? 2.5 : 1}"/>`);
    // the biome shows in a band of its colour at the edge, and the windows glow where you have been
    out.push(`<rect x="${x + 3}" y="${y - FH + 4}" width="5" height="${FH - 8}" rx="2" fill="${B.accent}" opacity="${open ? 0.9 : 0.3}"/>`);
    for (let k = 0; k < (fiend ? 1 : 3); k++) out.push(`<rect x="${x + w * (0.3 + k * 0.2)}" y="${y - FH + 8}" width="7" height="10" rx="2" fill="${done ? '#FFE37A' : open ? '#CFB8FF' : '#15102A'}" opacity="${done ? 0.9 : 0.5}"/>`);
    if (fiend) { out.push(`<circle cx="${x + w - 12}" cy="${y - FH / 2}" r="12" fill="url(#twGlow)"/><circle cx="${x + w - 12}" cy="${y - FH / 2}" r="5" fill="${fiend.glow}" stroke="#120E22" stroke-width="1.5"/>`);
      out.push(`<text x="${x + w - 24}" y="${y - FH / 2 - 1}" font-size="${fiend.name.length > 9 ? 8 : 9.5}" font-weight="800" text-anchor="end" fill="${done ? '#8FE0A6' : open ? fiend.glow : '#6F669A'}">${esc(fiend.name.toUpperCase())}</text>`);
      out.push(`<text x="${x + w - 24}" y="${y - FH / 2 + 9}" font-size="7.5" font-weight="800" text-anchor="end" letter-spacing=".5" fill="${(st.dlv || 1) >= fiend.rec ? '#C8F5D2' : open ? '#FFD447' : '#6F669A'}">RECOMMENDED LV ${fiend.rec}</text>`); }
    else if (F.boss) out.push(`<path d="M${x + w - 14} ${y - FH + 6} l4 6 4-6 4 6 4-6v12h-16z" fill="#FFD447" stroke="#120E22" stroke-width="1"/>`);
    out.push(`<text x="${x + 14}" y="${y - FH / 2 + 4}" font-size="11" font-weight="800" fill="${open ? '#FFFDF8' : '#6F669A'}">${n}</text>`);
    if (gi) out.push(`<text x="${x + w - 26}" y="${y - FH / 2 + 4}" font-size="10" font-weight="800" fill="#C8F5D2">${esc(gradeName(gi))}</text>`);
    out.push('</g>');
    if (n % 10 === 0 && n < N) out.push(`<rect x="${x - 10}" y="${y - FH - 3}" width="${w + 20}" height="6" rx="3" fill="#120E22"/>`);   // a ledge between tiers
  }
  // the crown: a spire and a light at the very top
  const xt = xAt(N) + wAt(N) / 2, yt = yOf(N) - FH - 4; out.push(`<path d="M${xt - wAt(N) / 2 - 6} ${yt} L${xt} ${yt - 60} L${xt + wAt(N) / 2 + 6} ${yt} Z" fill="#2A2448" stroke="#120E22" stroke-width="3"/><circle cx="${xt}" cy="${yt - 60}" r="18" fill="url(#twGlow)"/><circle cx="${xt}" cy="${yt - 60}" r="6" fill="#FFF8D0"/>`);
  // where you stand
  const yp = yOf(Math.max(1, Math.min(N, best + 1))) - FH / 2; out.push(`<g transform="translate(${xAt(0) - 34},${yp})"><g class="tw-you"><circle r="14" fill="#FFE37A" stroke="#120E22" stroke-width="2"/><text x="0" y="4" font-size="9" font-weight="900" text-anchor="middle" fill="#2B2433">YOU</text><path d="M16 0 l8 -6 v12z" fill="#FFE37A"/></g></g>`);
  out.push(`<text x="${W / 2}" y="${H - 14}" font-size="12" font-weight="800" text-anchor="middle" fill="#CFB8FF" letter-spacing="2">TOWER OF OBLIVION</text>`);
  return `<svg class="tower" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${out.join('')}</svg>`;
}

/* evolving from the Tower tab, right under the pet's stats: where it stands, what the next stage needs, and the button
   (ready when bond, gemstone and crystals are all there; otherwise it opens the pet's card, which says how to get them) */
function evoBoxHTML() {
  const e = evoStatus(), cur = STAGES[st.stage];
  if (!e) return `<div class="dp-evobox done"><span class="dpe-ic">${ICON.star}</span><div><b>Evolution</b><span>${esc(st.name)} has reached the final stage: ${esc(cur.name)}.</span></div></div>`;
  const ok = e.bondOk && e.gemOk && e.crystalOk;
  const need = [!e.bondOk ? `bond ${e.level}/${e.nx.bond}` : '', !e.gemOk ? `needs a ${GEMS[e.nx.gem].name}` : '', !e.crystalOk ? `${fmtNum(st.crystals || 0)}/${EVO_CRYSTALS} crystals` : ''].filter(Boolean).join(' · ');
  return `<div class="dp-evobox${ok ? ' ready' : ''}"><span class="dpe-ic">${ICON.star}</span><div><b>Evolution</b><span>${esc(cur.name)} → ${esc(e.nx.name)} · stage ${e.nx.n}</span><small>${ok ? 'Ready to evolve' : esc(need)}</small></div>
    <button class="btn small${ok ? ' primary' : ''}" type="button" data-dun="evolve">Evolve <span class="mono">${ICON.crystal}${EVO_CRYSTALS}</span></button></div>`;
}
