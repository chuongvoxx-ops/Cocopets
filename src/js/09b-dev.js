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
    <div class="setting"><div><span id="unlockLbl">Unlock all stages</span><p class="note">Every world and stage on the map is open.</p></div><button class="switch" type="button" role="switch" data-go="dev-unlock" aria-checked="${!!st.unlockAll}" aria-labelledby="unlockLbl"></button></div>
    <h3 class="sec">House and pets</h3>
    <div class="evo-actions">
      <button class="btn small" type="button" data-go="dev-ripen">${ICON.sprout}Ripen all crops</button>
      <button class="btn small" type="button" data-go="dev-food">+3 of each farm food</button>
      <button class="btn small" type="button" data-go="dev-egg"${petCount() >= MAX_PETS ? ' disabled' : ''}>${ICON.egg}Free egg</button>
    </div>
    <div class="setting"><div><span id="devMvLbl">Every elemental move learned</span><p class="note">To try the elemental Strongs and Ultimates: the level locks are lifted (the five-star rule on Ultimates stays).</p></div><button class="switch" type="button" role="switch" data-go="dev-moves" aria-checked="${!!st.devMoves}" aria-labelledby="devMvLbl"></button></div>
    <div class="setting"><div><span id="dev6Lbl">Every egg a six-star</span><p class="note">To try the six-star Legendaries: every summoned or hatched egg is one (100%).</p></div><button class="switch" type="button" role="switch" data-go="dev-six" aria-checked="${!!st.dev6}" aria-labelledby="dev6Lbl"></button></div>
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
    case 'unlock': st.unlockAll = !st.unlockAll; btn.setAttribute('aria-checked', String(st.unlockAll)); saveSoon(); toast(st.unlockAll ? 'All stages unlocked' : 'Stages unlock normally again'); if (mapOpen) renderMap(); return;
    case 'ripen': { let n = 0; st.house.rooms.forEach(r => (r.plots || []).forEach(p => { if (p.crop) { p.g = CROPS[p.crop].hours; n++; } })); refreshPlots(); saveSoon(); toast(n ? `${n} crop${n > 1 ? 's' : ''} ready to harvest` : hasRoom(st.house, 'farm') ? 'Nothing is planted yet. Tap a farm plot to plant a seed.' : 'No farm yet. Build one from the House button.'); return; }
    case 'food': Object.keys(CROPS).forEach(k => { st.pantry[k] = (st.pantry[k] || 0) + 3; }); saveSoon(); toast('+3 of each farm food in the pantry'); return;
    case 'egg': startAdopt('dev'); return;
    case 'moves': st.devMoves = !st.devMoves; btn.setAttribute('aria-checked', String(st.devMoves)); saveSoon(); toast(st.devMoves ? 'Every elemental move is learned' : 'Elemental moves unlock by level again'); return;
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
