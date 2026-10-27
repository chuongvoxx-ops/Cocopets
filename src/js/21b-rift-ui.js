/* ---------- the Rifts tab on the Adventure screen: thirteen rift dungeons across Gaia and twelve Anima gates ----------
   Each rift is fourteen stages (two sections of dungeon, puzzle, dungeon, puzzle, boss, then dungeon, puzzle, dungeon, boss); its seal opens the next rift and its gate. The twelve seals reveal R'lyeh. */
const RIFT_PLAN = [
  { id: 'belfry', n: 1, name: 'The Drowned Belfry', lvl: 10, region: 'The coast', sigil: 'Tide', gate: { anima: 'cancer', name: 'The Oracle Shell', what: 'Answer the great clam\'s three riddles', mins: '1–3' }, icon: 'bell' },
  { id: 'garden', n: 2, name: 'The Garden of Unborn Stars', lvl: 20, region: 'The forest', sigil: 'Bloom', gate: { anima: 'taurus', name: 'The Unbroken Constellation', what: 'Trace every line of three constellations without lifting the thread', mins: '3–6' }, icon: 'blossom' },
  { id: 'dunes', n: 3, name: 'The Mouth Beneath the Dunes', lvl: 30, region: 'The desert', sigil: 'Echo', gate: { anima: 'scorpio', name: 'The Amber Vigil', what: 'Stealth retrieval', mins: '2–3' }, icon: 'maw' },
  { id: 'sepulchre', n: 4, name: 'The Sepulchre of Borrowed Hours', lvl: 40, region: 'The temporal ruins', sigil: 'Memory', gate: { anima: 'gemini', name: 'The Twin Reflection', what: 'Fight a giant reflection of your own pet', mins: '3–5' }, icon: 'hourglass' },
  { id: 'aurora', n: 5, name: 'The Pale Aurora', lvl: 50, region: 'The polar mountains', sigil: 'Shelter', gate: { anima: 'capricorn', name: 'The Crownstep Ascent', what: 'Climb a crumbling ice cliff to the crown', mins: '3–4' }, icon: 'arch' },
  { id: 'yuggoth', n: 6, name: 'The Yuggoth Engine', lvl: 60, region: 'The crash site', sigil: 'Charge', gate: { anima: 'aquarius', name: 'The Raincatcher Array', what: 'Catch and deliver falling stars', mins: '3–4' }, icon: 'vessel' },
  { id: 'library', n: 7, name: 'The Library of Unwritten Lives', lvl: 70, region: 'The dream archive', sigil: 'Truth', gate: { anima: 'virgo', name: 'The Starseed Conservatory', what: 'A planting logic puzzle', mins: '3–5' }, icon: 'book' },
  { id: 'moon', n: 8, name: 'The Hollow Moon', lvl: 80, region: 'The lunar islands', sigil: 'Weight', gate: { anima: 'pisces', name: 'The Silverline Basin', what: 'Constellation fishing', mins: '3–5' }, icon: 'moon' },
  { id: 'basilica', n: 9, name: 'The Basilica of the Veiled Eye', lvl: 85, region: 'The petrified sanctuary', sigil: 'Veil', gate: { anima: 'libra', name: 'The Suspended Garden', what: 'Guide a pearl by balancing a board', mins: '3–5' }, icon: 'eye' },
  { id: 'colours', n: 10, name: 'The Sea of Fallen Colours', lvl: 90, region: 'The stellar sea', sigil: 'Balance', gate: { anima: 'sagittarius', name: "The Archer's Horizon", what: 'Reflected trick shots', mins: '3–5' }, icon: 'pool' },
  { id: 'choir', n: 11, name: 'The Choir Before Creation', lvl: 95, region: 'The primordial heights', sigil: 'Note', gate: { anima: 'leo', name: 'The Crown Chase', what: 'Cooperative tag', mins: '3–5' }, icon: 'spire' },
  { id: 'threshold', n: 12, name: 'The Threshold of All Doors', lvl: 100, region: 'The final threshold', sigil: 'Key', gate: { anima: 'aries', name: "The Ram's Switchyard", what: 'Route a moving astral cart', mins: '3–5' }, icon: 'doors' },
  { id: 'rlyeh', n: 13, name: "R'lyeh Above the World", lvl: 100, region: 'The sky wound', sigil: null, gate: null, icon: 'city', final: true },
];
const riftState = () => (st.rift || (st.rift = { seals: {}, prog: {}, gates: {}, rlyeh: 0 }));
const riftSealed = id => !!riftState().seals[id], sealCount = () => RIFT_PLAN.filter(r => !r.final && riftSealed(r.id)).length;
const riftBuilt = id => !!RIFT_BY_ID[id];
/* the path through the game: the Tower's first ten floors are open from the start; beating floor 10n (its Super Fiend)
   opens Rift n; sealing Rift n opens floors 10n+1 to 10n+10. A rift not built yet is stepped over (the floors after it
   open on the last built one's seal). Nothing already reached is ever closed again: a sealed rift, a rift with a
   checkpoint in it, a floor at or below the best. R'lyeh when all twelve seals are set */
function towerCap() { let cap = 10; for (const r of RIFT_PLAN) { if (r.final || cap >= TOWER_TOP) break; if (!riftBuilt(r.id) || riftSealed(r.id)) cap += 10; else break; } return Math.min(TOWER_TOP, cap); }
function riftOpen(id) { const r = RIFT_PLAN.find(q => q.id === id); if (!r) return false; if (r.final) return sealCount() >= 12; if (st.unlockAll || riftSealed(id) || (riftState().prog[id] || 0) > 0) return true; return (st.dun.best || 0) >= r.n * 10; }
// why a rift, or a floor, is shut, in a line
function riftLockText(r) { return r.final ? `Revealed when all twelve seals are set (${sealCount()}/12).` : `Beat the boss of Tower floor ${r.n * 10} to open it.`; }
function floorLockText(n) { if (n > TOWER_TOP) return `The Tower ends at floor ${TOWER_TOP}.`; if (n > (st.dun.best || 0) + 1) return `Clear floor ${n - 1} first.`; const b = Math.ceil(n / 10) - 1; let r = RIFT_PLAN.find(q => q.n === b); while (r && !riftBuilt(r.id) && r.n > 1) r = RIFT_PLAN.find(q => q.n === r.n - 1); return r ? `Seal Rift ${r.n}, ${r.name}, to open floors ${b * 10 + 1} to ${b * 10 + 10}.` : `Clear floor ${n - 1} first.`; }
const gateOpen = id => riftSealed(id) || !!st.unlockAll, gateDone = id => !!riftState().gates[id];
let riftSel = 'belfry';
const riftScroll = $('#riftScroll'), riftInner = $('#riftInner');
/* the landmark silhouettes */
function riftIconSVG(icon, sealed, big) {
  const c = sealed ? '#D9B35F' : '#B983F5', k = sealed ? '#7A5A14' : '#4A2D7A';
  const body = {
    bell: `<path d="M20 44l6-20 4-8 4 8 6 20z" fill="${c}" stroke="#2B2433" stroke-width="2.5" stroke-linejoin="round" transform="rotate(-8 30 30)"/><path d="M24 36h14" stroke="${k}" stroke-width="2"/>`,
    blossom: `<circle cx="30" cy="30" r="7" fill="#FFE9A8" stroke="#2B2433" stroke-width="2.5"/>${[0, 60, 120, 180, 240, 300].map(a => `<ellipse cx="30" cy="16" rx="5" ry="9" fill="${c}" stroke="#2B2433" stroke-width="2.5" transform="rotate(${a} 30 30)"/>`).join('')}`,
    maw: `<path d="M8 40q22-30 44 0z" fill="${c}" stroke="#2B2433" stroke-width="2.5"/><path d="M14 36l4-8 4 8 4-8 4 8 4-8 4 8 4-8 4 8" fill="#FFF4D0" stroke="#2B2433" stroke-width="2"/>`,
    hourglass: `<path d="M18 12h24l-10 18 10 18H18l10-18z" fill="${c}" stroke="#2B2433" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 12h32M14 48h32" stroke="#2B2433" stroke-width="3"/>`,
    arch: `<path d="M12 48V30a18 18 0 0 1 36 0v18h-8V30a10 10 0 0 0-20 0v18z" fill="${c}" stroke="#2B2433" stroke-width="2.5" stroke-linejoin="round"/>`,
    vessel: `<ellipse cx="30" cy="34" rx="22" ry="9" fill="${c}" stroke="#2B2433" stroke-width="2.5" transform="rotate(-15 30 34)"/><circle cx="30" cy="30" r="6" fill="${k}" stroke="#2B2433" stroke-width="2"/>`,
    book: `<path d="M10 16h18v30H10zM32 16h18v30H32z" fill="${c}" stroke="#2B2433" stroke-width="2.5" stroke-linejoin="round"/><path d="M14 24h10M14 30h10M36 24h10M36 30h10" stroke="${k}" stroke-width="2"/>`,
    moon: `<circle cx="30" cy="30" r="18" fill="${c}" stroke="#2B2433" stroke-width="2.5"/><circle cx="30" cy="30" r="8" fill="#1C1636" stroke="#2B2433" stroke-width="2"/>`,
    eye: `<path d="M8 30q22-22 44 0q-22 22-44 0z" fill="${c}" stroke="#2B2433" stroke-width="2.5"/><circle cx="30" cy="30" r="6" fill="${k}" stroke="#2B2433" stroke-width="2"/><path d="M12 24q18 10 36 0" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".7"/>`,
    pool: `<ellipse cx="30" cy="36" rx="22" ry="9" fill="${c}" stroke="#2B2433" stroke-width="2.5"/><path d="M22 28l2-8 2 8M36 30l2-10 2 10" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>`,
    spire: `<path d="M24 48l6-36 6 36z" fill="${c}" stroke="#2B2433" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 40h8M27 32h6M28 24h4" stroke="${k}" stroke-width="2"/>`,
    doors: `${[0, 1, 2].map(i => `<rect x="${10 + i * 15}" y="18" width="10" height="28" rx="5" fill="${c}" stroke="#2B2433" stroke-width="2.5"/>`).join('')}`,
    city: `<path d="M8 48l8-22 6 10 8-28 8 30 6-12 8 22z" fill="#1C3A2E" stroke="#2B2433" stroke-width="2.5" stroke-linejoin="round"/><circle cx="30" cy="14" r="4" fill="#7FFFD4"/>`,
  }[icon] || '';
  return `<svg viewBox="0 0 60 60" width="${big ? 60 : 44}" height="${big ? 60 : 44}" aria-hidden="true">${body}</svg>`;
}
function renderRift() {
  if (!mapOpen || !st) return;
  const RS = riftState(), seals = sealCount();
  const sel = RIFT_PLAN.find(r => r.id === riftSel) || RIFT_PLAN[0], open = riftOpen(sel.id), sealed = riftSealed(sel.id), prog = RS.prog[sel.id] || 0, built = riftBuilt(sel.id);
  const Rf = RIFT_BY_ID[sel.id], stageName = Rf ? Rf.stages[Math.min(prog, Rf.stages.length - 1)].name : '';
  const hero = `<div class="ar-card rf-hero" style="--acc:${sealed ? '#D9B35F' : '#B983F5'}"><div class="rf-top">${riftIconSVG(sel.icon, sealed, true)}<div><p class="eyebrow">Rift ${sel.n} · ${esc(sel.region)} · level ${sel.lvl}</p><h2>${esc(sel.name)}</h2>
    <p class="note">${sealed ? `Sealed · the ${sel.sigil} Sigil is yours` : open ? (built ? (prog ? `Checkpoint: stage ${prog + 1} of ${(RIFT_BY_ID[sel.id] || { stages: [] }).stages.length} · ${esc(stageName)}` : `${(RIFT_BY_ID[sel.id] || { stages: [] }).stages.length} stages in three sections: dungeons full of brood with a Rift-touched Cocopet for a mini boss, puzzles and games between them, and a Super Fiend-class boss closing each section. Some dungeons deal a hand of boons and curses. The third boss seals the rift.`) : 'This rift is not built yet: the expansion is arriving in stages.') : riftLockText(sel)}</p></div></div>
    ${Rf ? `<div class="rf-stages">${Rf.stages.map((S2, i) => `<span class="rf-st${i < prog || sealed ? ' done' : i === prog && !sealed ? ' now' : ''}${S2.kind === 'boss' ? ' boss' : ''}" title="${esc(S2.name)}">${S2.kind === 'boss' ? ICON.sword : ICON.door}</span>`).join('')}</div>` : ''}
    <div class="ar-row">${open && built ? `<button class="btn primary" type="button" data-rift="enter">${ICON.play}${sealed ? 'Enter again' : prog ? 'Continue' : 'Enter'}</button>` : ''}${sealed && Rf ? `<button class="btn" type="button" data-rift="restart">Start over</button>` : ''}</div></div>`;
  // (the Tower, ten floors at a time, between the rifts, in the order they are played)
  const best = st.dun.best || 0, TOWER_ICO = '<svg viewBox="0 0 60 60" width="44" height="44" aria-hidden="true"><path d="M24 52l2-30 4-12 4 12 2 30z" fill="#6B5BB8" stroke="#2B2433" stroke-width="2.5" stroke-linejoin="round"/><path d="M27 30h6M26.5 40h7" stroke="#FFE37A" stroke-width="2.2"/><circle cx="30" cy="9" r="2.6" fill="#FFE37A"/></svg>';
  const towerCard = b => { const lo = b * 10 + 1, hi = Math.min(TOWER_TOP, b * 10 + 10), o = dunFloorOpen(lo), done = best >= hi, n = Math.max(0, Math.min(10, best - lo + 1));
    return `<button class="rf-card rf-tower${done ? ' sealed' : o ? '' : ' locked'}" type="button" data-rift="tower" data-n="${b}">${TOWER_ICO}<b>Tower floors ${lo}–${hi}</b><small>${done ? 'Cleared' : o ? `Open · ${n}/10 cleared` : 'Locked'}</small></button>`; };
  const list = RIFT_PLAN.map(r => { const o = riftOpen(r.id), s = riftSealed(r.id), hidden = r.final && !o;
    return `<button class="rf-card${r.id === riftSel ? ' sel' : ''}${s ? ' sealed' : o ? '' : ' locked'}" type="button" data-rift="sel" data-id="${r.id}">${hidden ? `<span class="rf-ico">?</span>` : riftIconSVG(r.icon, s)}<b>${hidden ? '???' : esc(r.name)}</b><small>${hidden ? 'The sky wound' : `Lv ${r.lvl} · ${s ? 'Sealed' : o ? (riftBuilt(r.id) ? 'Open' : 'Not yet built') : 'Locked'}`}</small></button>`; }), path = [];
  list.forEach((card, i) => { const r = RIFT_PLAN[i]; if (!r.final && r.n <= 12) path.push(towerCard(r.n - 1)); path.push(card); });
  const gates = RIFT_PLAN.filter(r => r.gate).map(r => { const A = ANIMAS[r.gate.anima], o = gateOpen(r.id), d = gateDone(r.id), built = !!RIFT_GATES[r.id];
    return `<div class="rf-gate${d ? ' done' : o ? ' open' : ''}"><span class="rg-ring" style="--gc:${A ? A.color : '#FFE37A'}"><i></i></span><div><b>${esc(r.gate.name)}</b><small>${esc(A ? A.sign + ' · ' + A.name : r.gate.anima)} · ${esc(r.gate.what)} · ${r.gate.mins} min</small><small>${d ? 'Anima unlocked' : o ? (built ? 'Trial available' : 'Trial not yet built') : `Clear ${esc(r.name)}`}</small></div>${o && !d && built ? `<button class="btn small primary" type="button" data-rift="gate" data-id="${r.id}">Trial</button>` : d && built ? `<button class="btn small" type="button" data-rift="gate" data-id="${r.id}">Replay</button>` : ''}</div>`; }).join('');
  riftInner.innerHTML = `${hero}<p class="tray-sub">Your path · the Tower and the twelve rifts · ${seals}/12 sealed</p><div class="rf-grid">${path.join('')}</div><p class="tray-sub">Anima gates · ${RIFT_PLAN.filter(r => r.gate && gateDone(r.id)).length}/12 unlocked</p><div class="rf-gates">${gates}</div>
    <p class="note">Gaia's sky has split along the Great Rift. Twelve smaller rifts stitch pieces of other worlds into the land; a bonded Cocopet can seal each one. Every seal adds a sigil to the lattice around Gaia and opens that rift's Anima gate.</p>`;
}
riftInner.addEventListener('click', e => {
  const b = e.target.closest('[data-rift]'); if (!b) return; sfx.unlock();
  const k = b.dataset.rift;
  if (k === 'sel') { riftSel = b.dataset.id; sfx.boop(); renderRift(); }
  else if (k === 'tower') { const lo = +b.dataset.n * 10 + 1; if (!dunFloorOpen(lo)) { toast(floorLockText(lo)); sfx.wrong(); return; } dunSel = Math.min(Math.max(lo, (st.dun.best || 0) + 1), lo + 9, TOWER_TOP); if (!dunFloorOpen(dunSel)) dunSel = lo; sfx.boop(); setMapTab('dungeon'); }
  else if (k === 'enter') startRift(riftSel);
  else if (k === 'restart') { riftState().prog[riftSel] = 0; sfx.boop(); renderRift(); }
  else if (k === 'gate') startGate(b.dataset.id);
});
/* into a rift: its next stage */
function startRift(id, stage) {
  if (!riftOpen(id) || !riftBuilt(id)) return;
  if (!st.unlockAll && st.energy < 8) { tiredToast(); return; }
  const RS = riftState(), Rf = RIFT_BY_ID[id]; if (stage == null) stage = Math.min(RS.prog[id] || 0, Rf.stages.length - 1);
  const S = riftDef(id, stage);
  S.party = partyPets().map(p => { const k = petKit(p); k.name = p.name; return { p, kit: k }; });
  S.pet = S.party[0].kit; const teamAnima = animaKitFor(partyPets()); S.party.forEach(m => { m.kit.anima = teamAnima; });
  riftSel = id;
  launchArc(DUN_W, S, 0, 1000 + stage, 'dungeon', Rf.name, `${riftStageLabel(Rf, stage)} · ${Rf.stages[stage].name}`);
}
function riftReadyHTML(S) {
  const K = S.pet, st2 = K.stats, R = S.rift, Rf = RIFT_BY_ID[R.id], S2 = Rf.stages[R.stage], B = BIOMES[S.biome];
  return `<div class="ar-card dun-ready" style="--acc:${B.accent}"><p class="eyebrow">${esc(Rf.name)} · stage ${R.stage + 1} of ${Rf.stages.length} · ${riftStageLabel(Rf, R.stage)}</p><h2>${esc(S2.name)}</h2>
    <p class="ar-goal">${esc(S2.kind === 'boss' ? `${S.bossName} waits ahead: a fight of ${S.fiend ? S.fiend.bars : '?'} health bars, as hard as the Tower's Super Fiend of floor ${S.n}. Read the marks on the ground.` : S2.goal || '')}</p>${S2.how ? `<p class="note" style="text-align:left">${esc(S2.how)}</p>` : ''}
    <p class="note dr-facts">Recommended level ${Rf.lvl} · ${esc(Rf.aff.map(a => E8[a] ? E8[a].name : a).join(' and '))}${S2.kind === 'puzzle' ? ' · stand beside a wheel or lever for a moment to use it' : S2.kind === 'fight' ? ' · a floor of the rift: packs of its brood and a mini boss' : ''}</p>
    <div class="dr-stats"><span>Level <b>${st2.L}</b></span><span class="hp">HP <b>${st2.hp}</b></span><span class="mp">MP <b>${st2.mp}</b></span></div>
    <button class="btn primary" type="button">${ICON.play}Start</button></div>`;
}
/* the end of a stage: rewards, the checkpoint, the seal */
function riftFinish(win, msg, data) {
  const S = arc.api.def, R = S.rift, Rf = RIFT_BY_ID[R.id], RS = riftState(), lv0 = (st.dlv || 1) - (data.lvls || 0), last = R.stage === Rf.stages.length - 1;
  st.dun.runs = (st.dun.runs || 0) + 1; st.dun.kills = (st.dun.kills || 0) + (data.kills || 0);
  const lines = [], coins = Math.round(((data.coins || 0) + (win ? 20 + 3 * Rf.lvl : 0)) * coinMul());
  st.coins += coins; lines.push([ICON.coin, `+${coins} coins`]);
  let xp = data.xp || 0; if (win) { const bonus = 25 + 4 * Rf.lvl * (R.kind === 'boss' ? 2 : 1); dunAddXP(bonus); xp += bonus; }
  if (xp) lines.push([ICON.sparkle, `+${fmtNum(xp)} experience`]);
  if ((st.dlv || 1) > lv0) lines.push([ICON.star, `Level up! ${st.name} is level ${st.dlv}`]);
  const accs = (data.accs || []).slice(); if (accs.length) { const got = accBank(accs); got.kept.slice(0, 4).forEach(a => lines.push([accSVG(a), `${ACC_R[a.r].name} ${accName(a)}`])); }
  let sealedNow = false;
  if (win) {
    if (!riftSealed(R.id)) RS.prog[R.id] = Math.min(Rf.stages.length - 1, R.stage + 1);
    if (last) {
      if (!riftSealed(R.id)) { sealedNow = true; RS.seals[R.id] = 1; RS.prog[R.id] = 0; st.crystals = (st.crystals || 0) + 300; st.pearls = (st.pearls || 0) + 30; lines.push([ICON.crystal, '+300 crystals for the seal']); lines.push([ICON.pearl, '+30 pearls']);
        const SPECIAL = { colours: 'orbit' }[R.id], acc = SPECIAL ? rollAccessory(Math.round(Rf.lvl / 2), { bonus: 30, min: 4, t: ACC_SPECIAL[SPECIAL].t }) : rollAccessory(Math.round(Rf.lvl / 2), { bonus: 20, min: 2 }); if (SPECIAL) acc.sp = SPECIAL; acc.n = `${Rf.sigil} ${acc.n || ''}`.trim(); const got = accBank([acc]); got.kept.forEach(a => lines.push([accSVG(a), a.sp ? `${ACC_R[a.r].name} ${accName(a)}: ${ACC_SPECIAL[a.sp].what}` : `A ${Rf.sigil}-themed accessory: ${ACC_R[a.r].name} ${accName(a)}`]));
        lines.push([ICON.trophy, `The ${Rf.sigil} Sigil joins the lattice (${sealCount()}/12)`]); lines.push([ICON.door, `${RIFT_PLAN.find(r => r.id === R.id).gate.name} is open: a trial for the ${ANIMAS[RIFT_PLAN.find(r => r.id === R.id).gate.anima].name}`]);
        const nx = RIFT_PLAN[Rf.n]; if (nx) lines.push([ICON.map, `${nx.name} is open on the map`]); if (sealCount() >= 12) { RS.rlyeh = 1; lines.push([ICON.star, "R'lyeh rises above the world"]); } }
      else { st.crystals = (st.crystals || 0) + 60; lines.push([ICON.crystal, '+60 crystals (the rift is already sealed)']); }
    }
    const team = partyPets(); team.forEach(p => addBondTo(p, Math.round(bondLevelOf(p) / 6))); lines.push([ICON.heart, '+1/6 bond level for the party']);
  } else { addXP(3); lines.push([ICON.heart, '+3 bond for trying']); }
  saveSoon(); updateHud();
  const nextStage = win && !last ? R.stage + 1 : null;
  setTimeout(() => {
    if (!arc.open) return;
    arcPanel.innerHTML = `<div class="ar-card end dun-end"><p class="eyebrow">${esc(Rf.name)} · ${riftStageLabel(Rf, R.stage)}</p><h2>${win ? (last ? (sealedNow ? 'The rift is sealed!' : 'Sealed again') : R.kind === 'boss' ? `${esc(S.bossName)} defeated!` : R.kind === 'fight' ? 'Dungeon cleared!' : 'Puzzle solved!') : 'The party fell'}</h2>
      ${win ? '' : `<p class="ar-goal">${esc(msg || 'The stage restarts from its start; the earlier stages stay done.')}</p>`}
      <div class="dr-stats"><span>Monsters <b>${data.kills || 0}</b></span><span>Best combo <b>${data.combo || 0}</b></span><span>Level <b>${st.dlv}</b></span></div>
      <ul class="rewards">${lines.map(l => `<li>${l[0] || ''}<span>${esc(l[1])}</span></li>`).join('')}</ul>
      <div class="ar-row"><button class="btn" type="button" data-arc="map">${ICON.door}Lobby</button><button class="btn" type="button" data-arc="retry">${win ? 'Replay stage' : 'Retry'}</button>${nextStage != null ? `<button class="btn primary" type="button" data-arc="next">${esc(Rf.stages[nextStage].name)}${ICON.play}</button>` : ''}</div></div>`;
    arcPanel.hidden = false; if (win) sfx.fanfare();
  }, win ? 450 : 650);
}

/* ---- the Anima gates: short pet activities, one beside each rift ---- */
function startGate(id) {
  const G = RIFT_GATES[id]; if (!G || !gateOpen(id)) return;
  if (!st.unlockAll && st.energy < 8) { tiredToast(); return; }
  const S = riftDef(id, 0); S.rift = { id, stage: -1, kind: 'gate', name: G.name, total: 1, gate: true }; S.bossKind = BOSSES[0]; S.bossName = ''; S.boss = false; S.biome = G.biome || S.biome; S.band = null; S.rules = null; Object.assign(S, { rooms: 1, pack: 0, packsPer: 0, maxMons: 60, types: [], nests: 0, elite: 0, gremlin: 0, shrines: 0, hazards: false, traps: 0, stones: 0, events: false });   // (a gate is a trial: no floor rules, no rolled packs)
  S.party = partyPets().map(p => { const k = petKit(p); k.name = p.name; return { p, kit: k }; });
  S.pet = S.party[0].kit; const teamAnima = animaKitFor(partyPets()); S.party.forEach(m => { m.kit.anima = teamAnima; });
  riftSel = id;
  launchArc(DUN_W, S, 0, 2000, 'dungeon', G.name, `Anima gate · ${ANIMAS[RIFT_PLAN.find(r => r.id === id).gate.anima].name}`);
}
function gateReadyHTML(S) {
  const G = RIFT_GATES[S.rift.id], P = RIFT_PLAN.find(r => r.id === S.rift.id), A = ANIMAS[P.gate.anima];
  return `<div class="ar-card dun-ready" style="--acc:${A.color}"><p class="eyebrow">Anima gate · ${esc(A.sign)} · ${esc(A.name)}</p><h2>${esc(G.name)}</h2><p class="ar-goal">${esc(G.goal)}</p><p class="note dr-facts">${esc(G.how)}</p><button class="btn primary" type="button">${ICON.play}Begin</button></div>`;
}
/* a trial done: the Anima unlocked once, through the existing collection; the bond scene */
function gateFinish(win, msg, data) {
  const S = arc.api.def, id = S.rift.id, P = RIFT_PLAN.find(r => r.id === id), A = ANIMAS[P.gate.anima], RS = riftState(), lines = [];
  let firstTime = false;
  if (win) { if (!RS.gates[id]) { RS.gates[id] = 1; firstTime = true; st.animas.have[A.id] = Math.max(st.animas.have[A.id] || 0, 1); if (!st.animas.eq) st.animas.eq = A.id; lines.push([ICON.star, `${A.name} answers: the ${A.sign} Anima is unlocked`]); lines.push([ICON.sparkle, `Summon it in the Tower with the sigil button`]); }
    else lines.push([ICON.trophy, 'Trial completed again']); st.crystals = (st.crystals || 0) + (firstTime ? 150 : 30); lines.push([ICON.crystal, `+${firstTime ? 150 : 30} crystals`]); }
  else lines.push([ICON.heart, 'Retry any time: nothing is lost']);
  saveSoon(); updateHud();
  setTimeout(() => {
    if (!arc.open) return;
    arcPanel.innerHTML = `<div class="ar-card end dun-end"><p class="eyebrow">${esc(RIFT_GATES[id].name)}</p><h2>${win ? (firstTime ? 'The constellation joins!' : 'Trial complete') : 'Not this time'}</h2>${win ? '' : `<p class="ar-goal">${esc(msg || '')}</p>`}<ul class="rewards">${lines.map(l => `<li>${l[0] || ''}<span>${esc(l[1])}</span></li>`).join('')}</ul>
      <div class="ar-row"><button class="btn" type="button" data-arc="map">${ICON.door}Lobby</button><button class="btn${win ? '' : ' primary'}" type="button" data-arc="retry">${win ? 'Replay' : 'Retry'}</button></div></div>`;
    arcPanel.hidden = false; if (win) { sfx.fanfare(); if (firstTime) setTimeout(() => ascendCinematic(A.id, 1, () => {}), 300); }
  }, win ? 450 : 650);
}
