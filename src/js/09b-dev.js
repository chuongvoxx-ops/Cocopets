/* ---------- developer tools: see and unlock every evolution ---------- */
let devPreview = null;   // a random preview of how the pet could grow from its current form
let devReopen = false;
function makeDevPreview() {
  const R = mulberry32(((Date.now() % 2147483647) ^ Math.floor(Math.random() * 2147483647)) >>> 0);
  const forms = [], changes = [];
  let f = curForm();
  for (let s = st.stage + 1; s <= 7; s++) { const r = evolveForm(f, R, s); forms.push(r.form); changes.push(r.changes); f = r.form; }
  devPreview = { from: st.stage, key: dnaCode(curForm()), forms, changes };
}
function devLine() {
  if (!devPreview || devPreview.from !== st.stage || devPreview.key !== dnaCode(curForm())) makeDevPreview();
  return st.forms.slice(0, st.stage).concat(devPreview.forms);
}
function openDev() {
  openSheet('dev', '');
  renderDev();
}
function renderDev() {
  if (sheetKind !== 'dev' || !st) return;
  const line = devLine();
  const cells = line.map((f, i) => {
    const n = i + 1, real = n <= st.stage;
    return `<button class="dev-cell${real ? ' real' : ''}${n === st.stage ? ' cur' : ''}" type="button" data-go="dev-jump" data-n="${n}" aria-label="Jump to stage ${n}"><span class="dp">${petSVG(f, { frame: 'fit' })}</span><b>${n} · ${STAGES[n].name}</b><small>${esc(speciesName(f))}</small>${real ? '' : '<em>preview</em>'}</button>`;
  }).join('');
  const html = `
    <p class="eyebrow">Testing only</p><h2 class="title" id="sheetTitle">Developer tools</h2>
    <p class="note">These skip the normal rules so you can test the game. A real release would hide this panel.</p>
    <h3 class="sec">Evolution</h3>
    <p class="note">Solid cards are ${esc(st.name)}'s real forms so far. Faded cards are one random way it could grow next. Tap any card to jump to that stage.</p>
    <div class="dev-line">${cells}</div>
    <div class="evo-actions">
      <button class="btn primary" type="button" data-go="dev-evolve"${st.stage >= 7 ? ' disabled' : ''}>Evolve now</button>
      <button class="btn" type="button" data-go="dev-shuffle"${st.stage >= 7 ? ' disabled' : ''}>${ICON.dice}New preview</button>
      <button class="btn" type="button" data-go="dev-reset"${st.stage <= 1 ? ' disabled' : ''}>Reset evolution</button>
    </div>
    <div class="evo-actions">
      <button class="btn small" type="button" data-go="dev-reroll">${ICON.dice}New random look</button>
      <button class="btn small" type="button" data-go="dev-bond">Max bond</button>
      <button class="btn small" type="button" data-go="dev-needs">Fill needs</button>
    </div>
    <h3 class="sec">Adventure</h3>
    <div class="setting"><div><span id="unlockLbl">Unlock all stages and rifts</span><p class="note">Every world, Tower floor, rift and Anima gate is open, and energy is free. On a rift, tap any stage on its strip to play it.</p></div><button class="switch" type="button" role="switch" data-go="dev-unlock" aria-checked="${!!st.unlockAll}" aria-labelledby="unlockLbl"></button></div>
    <h3 class="sec">House and pets</h3>
    <div class="evo-actions">
      <button class="btn small" type="button" data-go="dev-ripen">${ICON.sprout}Ripen all crops</button>
      <button class="btn small" type="button" data-go="dev-food">+3 of each farm food</button>
      <button class="btn small" type="button" data-go="dev-egg"${petCount() >= MAX_PETS ? ' disabled' : ''}>${ICON.egg}Free egg</button>
    </div>
    <div class="setting dev-skills"><div><span id="devMvLbl">Unlock all skills (dev)</span><p class="note"><b>Developer only.</b> Any pet can equip any Strong or Ultimate from every pool (the 1–4★ pool, every element's 5★ and 6★ lists) on its Ability cards screen, to test them. Players never get this: their pets keep the skills they were born with. Turn it off and every pet's own skills come back.</p></div><button class="switch" type="button" role="switch" data-go="dev-moves" aria-checked="${!!st.devMoves}" aria-labelledby="devMvLbl"></button></div>
    <!-- v460 META --><div class="setting"><div><span id="devPayLbl">Mock checkout (development only)</span><p class="note"><b>Developer only.</b> Crystal packs open a clearly labelled mock checkout to test success, cancel, failure and a repeated callback. No money, no provider, not a real purchase. Off, they show that checkout is not set up.</p></div><button class="switch" type="button" role="switch" data-go="dev-pay" aria-checked="${!!st.devPay}" aria-labelledby="devPayLbl"></button></div>
    <div class="setting"><div><span>Six-star twins</span><p class="note">${st.twinGuaranteeUsed ? 'The first-roll twins guarantee has been used.' : 'The first six-star summon roll will be twins.'}</p></div><button class="btn small" type="button" data-go="dev-twinreset">Reset guarantee</button></div>
    <div class="setting"><div><span id="dev6Lbl">Every egg a six-star</span><p class="note">To try the six-star Legendaries: every summoned or hatched egg is one (100%).</p></div><button class="switch" type="button" role="switch" data-go="dev-six" aria-checked="${!!st.dev6}" aria-labelledby="dev6Lbl"></button></div>
    ${devSkillTester()}
    <h3 class="sec">Tower of Oblivion</h3>
    <div class="setting"><div><span id="godLbl">Tower god mode</span><p class="note">Your pet can't be hurt in the Tower.</p></div><button class="switch" type="button" role="switch" data-go="dev-god" aria-checked="${!!st.dun.god}" aria-labelledby="godLbl"></button></div>
    <div class="evo-actions">
      <button class="btn small" type="button" data-go="dev-floors">${ICON.door}Unlock 4 more floors</button>
      <button class="btn small" type="button" data-go="dev-tower">${ICON.sword}Open the whole Tower</button>
      <div class="dev-fiends">${[10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200].map(n => `<button class="btn small" type="button" data-go="dev-fiend" data-n="${n}">${n}</button>`).join('')}</div><p class="note">Super Fiend fights: tap a floor to start it now (free energy, level any not required).</p>
      <button class="btn small" type="button" data-go="dev-dlv">${ICON.star}+5 levels</button>
      <button class="btn small" type="button" data-go="dev-gift">${ICON.gift}Free gift box</button>
      <button class="btn small" type="button" data-go="dev-cards">${ICON.cards}Every card</button>
    </div>
    <h3 class="sec">Resources</h3>
    <div class="evo-actions">
      <button class="btn small" type="button" data-go="dev-coins">${ICON.coin}+1,000 coins</button>
      <button class="btn small" type="button" data-go="dev-pearls">${ICON.pearl}+100 pearls</button>
      <button class="btn small" type="button" data-go="dev-crystals">${ICON.crystal}+1,000 crystals</button>
      <button class="btn small" type="button" data-go="dev-gems">${gemSVG('starstone')}One of each gem</button>
    </div>`;
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>${html}`;
  sheetEl.querySelectorAll('select[data-dev-skill]').forEach(el => el.addEventListener('change', () => devPickSkill(el.dataset.devSkill, el.value)));   // (v451 K)
}
/* (v451 K, the user: "I need a function where I can test out all the skills and ults. Have it in the developer's tool as a
   setting where I can select the skills") the skill tester: pick any Strong attack (both slots) or Ultimate of any pool for the
   pet that leads in the Tower, set its stage (Base / Adept / Celestial: the Ultimates' tiers), free casts, then try it */
const DEV_SLOTS = [['strong', 'Strong attack'], ['strong2', 'Strong attack 2'], ['ult', 'Ultimate']];
function devSkillTester() {
  const P = st, AB = applyAbOv(petAbility(formOf(P), P.dna.seed), P), deck = P.deck || {}, names = {};
  const label = (id, slot) => { const k = slot + '|' + id; if (names[k]) return names[k]; let n = id; try { const a = skillAbility(id, slot, P, AB, { dev: true }); if (a && a.name) n = a.name; } catch (e) {} return (names[k] = n); };
  const sel = (slot, title) => { const open = slotOpen(slot, P.stage || 1), cur = st.devMoves && isSkillId(deck[slot]) ? deck[slot] : '';
    const own = (() => { try { const a = innateAbility(slot, AB, P); return a ? a.name : ''; } catch (e) { return ''; } })();
    const groups = skillGroups(slotType(slot)).map(G => `<optgroup label="${esc(G.name)}">${G.ids.map(id => `<option value="${esc(id)}"${id === cur ? ' selected' : ''}>${esc(label(id, slotType(slot)))}</option>`).join('')}</optgroup>`).join('');
    return `<label class="dev-sk-row"><span>${title}</span><select class="dev-sk-sel" data-dev-skill="${slot}"${open ? '' : ' disabled'}><option value=""${cur ? '' : ' selected'}>${esc(own ? `Own: ${own}` : 'Its own')}</option>${groups}</select>${open ? '' : '<small>opens at Adept (stage 4)</small>'}</label>`; };
  const stg = P.stage || 1, tier = stg >= 7 ? 'Celestial' : stg >= 4 ? 'Adept' : 'Base';
  return `<h3 class="sec">Skill tester</h3>
    <p class="note">Give ${esc(P.name)} (who leads in the Tower) any Strong attack or Ultimate from every pool and element, then try it. Picking one turns on "Unlock all skills (dev)". The Ultimates' Base, Adept and Celestial forms follow the stage: now <b>${tier}</b> (stage ${stg}).</p>
    <div class="evo-actions">${[[1, 'Base'], [4, 'Adept'], [7, 'Celestial']].map(([n, t]) => `<button class="btn small${stg === n ? ' primary' : ''}" type="button" data-go="dev-jump" data-n="${n}"${stg === n ? ' disabled' : ''}>${t} · stage ${n}</button>`).join('')}</div>
    <div class="dev-sk">${DEV_SLOTS.map(([s, t]) => sel(s, t)).join('')}</div>
    <div class="setting"><div><span id="devFreeLbl">Free casts</span><p class="note">In the Tower: no MP cost and no cooldowns, so every move can be cast again at once.</p></div><button class="switch" type="button" role="switch" data-go="dev-free" aria-checked="${!!st.devFree}" aria-labelledby="devFreeLbl"></button></div>
    <div class="evo-actions"><button class="btn primary" type="button" data-go="dev-try">${ICON.sword}Try them in the Tower</button><button class="btn small" type="button" data-go="dev-skclear">Back to its own skills</button></div>`;
}
function devPickSkill(slot, id) {
  if (!st || !DEV_SLOTS.some(d => d[0] === slot)) return;
  if (id && !isSkillId(id)) return;
  if (id && !st.devMoves) st.devMoves = true;
  st.deck = cleanDeck(st.deck, st);
  if (!id) st.deck[slot] = null;
  else { SLOTS.forEach(s => { if (s !== slot && st.deck[s] === id) st.deck[s] = null; }); st.deck[slot] = id; }
  saveSoon(); sfx.pop();
  let n = id; try { const a = petKit(st).kit[slot]; if (a) n = a.name; } catch (e) {}
  toast(id ? `${DEV_SLOTS.find(d => d[0] === slot)[1]}: ${n}` : `${DEV_SLOTS.find(d => d[0] === slot)[1]}: its own again`);
  renderDev();
}
function devAction(k, btn) {
  if (!st) return;
  switch (k) {
    case 'evolve': {
      if (st.stage >= 7) return;
      devLine();
      devReopen = true; closeSheet();
      evolve({ form: devPreview.forms[0], changes: devPreview.changes[0] }, true);
      return;
    }
    case 'shuffle': makeDevPreview(); renderDev(); sfx.pop(); return;
    case 'jump': {
      const n = +btn.dataset.n;
      if (!(n >= 1 && n <= 7) || n === st.stage) return;
      if (n > st.stage) { devLine(); st.forms = st.forms.slice(0, st.stage).concat(devPreview.forms.slice(0, n - st.stage)); }
      else st.forms.length = n;
      st.stage = n;
      Object.keys(st.paid || {}).forEach(s => { if (+s > n) delete st.paid[s]; });
      devPreview = null;
      if (act) endActivity(true);
      buildPet(true); renderDecor(); updateHud(); saveSoon();
      renderDev(); sfx.sparkle();
      toast(`Stage ${n}: ${speciesName(curForm())}`);
      return;
    }
    case 'reset': resetEvolution(); devPreview = null; renderDev(); return;
    case 'reroll': {
      const g = makeGenome();
      st.forms = evolveLine(g.form, st.stage, Math.random);
      st.rarity = rarityOf(g.form);
      devPreview = null;
      buildPet(true); renderDecor(); updateHud(); saveSoon(); renderDev();
      toast(`A brand new look: ${speciesName(curForm())}`);
      return;
    }
    case 'bond': { let guard = 0; while (bondInfo(st.xp).level < 22 && guard++ < 500) st.xp += 200; updateHud(); saveSoon(); toast(`Bond level ${bondInfo(st.xp).level}`); return; }
    case 'needs': st.food = st.joy = st.energy = st.clean = 100; if (st.asleep || pet.mode === 'sleep') wake(false); updateHud(); saveSoon(); toast('All needs filled'); return;
    case 'unlock': st.unlockAll = !st.unlockAll; btn.setAttribute('aria-checked', String(st.unlockAll)); saveSoon(); toast(st.unlockAll ? 'Every stage, rift and gate is open' : 'Stages unlock normally again'); if (mapOpen) { renderMap(); try { renderRift(); } catch (e) {} } return;
    case 'ripen': { let n = 0; st.house.rooms.forEach(r => (r.plots || []).forEach(p => { if (p.crop) { p.g = CROPS[p.crop].hours; n++; } })); refreshPlots(); saveSoon(); toast(n ? `${n} crop${n > 1 ? 's' : ''} ready to harvest` : hasRoom(st.house, 'farm') ? 'Nothing is planted yet. Tap a farm plot to plant a seed.' : 'No farm yet. Build one from the House button.'); return; }
    case 'food': Object.keys(CROPS).forEach(k => { st.pantry[k] = (st.pantry[k] || 0) + 3; }); saveSoon(); toast('+3 of each farm food in the pantry'); return;
    case 'egg': startAdopt('dev'); return;
    case 'moves': st.devMoves = !st.devMoves; btn.setAttribute('aria-checked', String(st.devMoves)); saveSoon(); toast(st.devMoves ? 'Developer: every skill can be equipped on any pet' : 'Skills are back to each pet\'s own'); if (typeof renderDungeon === 'function') try { renderDungeon(); } catch (e) {} return;   // (v391 K)
    case 'free': st.devFree = !st.devFree; btn.setAttribute('aria-checked', String(st.devFree)); saveSoon(); toast(st.devFree ? 'Free casts: no MP cost, no cooldowns in the Tower' : 'Casts cost MP and have cooldowns again'); return;   // (v451 K)
    case 'skclear': st.deck = cleanDeck(st.deck, st); DEV_SLOTS.forEach(([s]) => { if (isSkillId(st.deck[s])) st.deck[s] = null; }); saveSoon(); toast(`${st.name} uses its own skills again`); renderDev(); return;
    case 'try': { const n = Math.max(1, Math.min((st.dun.best || 0) + 1, typeof TOWER_TOP !== 'undefined' ? TOWER_TOP : 999)); st.energy = Math.max(st.energy, 100); closeSheet(); if (!mapOpen) openMap(); setMapTab('dungeon', true); startDungeon(n, Math.floor(Math.random() * 9999)); return; }
    case 'pay': st.devPay = !st.devPay; btn.setAttribute('aria-checked', String(st.devPay)); saveSoon(); toast(st.devPay ? 'Mock checkout on: crystal packs open the development-only mock (no money involved)' : 'Mock checkout off: crystal packs show that checkout is not set up'); return;   // v460 META (07h)
    case 'twinreset': st.twinGuaranteeUsed = 0; st.twinIntro = 0; saveSoon(); toast('The first six-star summon roll will be twins again'); return;   // v460 META (22-gift)
    case 'six': st.dev6 = !st.dev6; btn.setAttribute('aria-checked', String(st.dev6)); saveSoon(); toast(st.dev6 ? 'Every egg is now a six-star Legendary' : 'Eggs roll their usual odds again'); return;
    case 'god': st.dun.god = !st.dun.god; btn.setAttribute('aria-checked', String(st.dun.god)); saveSoon(); toast(st.dun.god ? 'God mode on: nothing can hurt your pet in the Tower' : 'God mode off'); return;
    case 'tower': st.dun.best = TOWER_TOP - 1; st.unlockAll = true; saveSoon(); toast('Every floor is open, energy is free'); renderDungeon(); return;
    case 'fiend': { const n = +btn.dataset.n; st.dun.best = Math.max(st.dun.best || 0, n - 1); st.unlockAll = true; closeSheet(); if (!mapOpen) openMap(); setMapTab('dungeon', true); startDungeon(n, Math.floor(Math.random() * 9999)); return; }
    case 'floors': st.dun.best = (st.dun.best || 0) + 4; saveSoon(); toast(`Floors up to ${st.dun.best + 1} are open`); renderDungeon(); return;
    case 'dlv': st.dlv = Math.min(99, (st.dlv || 1) + 5); st.dxp = 0; saveSoon(); toast(`${st.name} is now level ${st.dlv}`); renderDungeon(); return;
    case 'gift': closeSheet(); playGiftCeremony(applyGiftBox(rollGiftBox(Math.random, st.dun.pity || 0))); saveSoon(); return;
    case 'cards': CARD_IDS.forEach(id => { st.cards[id] = Math.max(st.cards[id] || 0, 1); }); saveSoon(); toast(`All ${CARD_IDS.length} ability cards added`); renderDungeon(); return;
    case 'coins': st.coins += 1000; updateHud(); saveSoon(); sfx.coin(); toast('+1,000 coins'); return;
    case 'crystals': st.crystals = (st.crystals || 0) + 1000; updateHud(); saveSoon(); sfx.coin(); toast('+1,000 crystals'); return;
    case 'pearls': st.pearls += 100; updateHud(); saveSoon(); sfx.coin(); toast('+100 pearls'); return;
    case 'gems': GEM_ORDER.forEach(g => { st.gems[g] = (st.gems[g] || 0) + 1; }); updateHud(); saveSoon(); sfx.sparkle(); toast('One of each gemstone added'); return;
  }
}
