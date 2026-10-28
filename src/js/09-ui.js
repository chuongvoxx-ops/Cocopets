/* ---------- static icons ---------- */
$('#coinIcon').innerHTML = ICON.coin;
$('#pearlIcon').innerHTML = ICON.pearl;
$('#crystalIcon').innerHTML = ICON.crystal;
$('#streakIcon').innerHTML = ICON.cal;
$$('.meter').forEach(m => { $('.mi', m).innerHTML = { food: ICON.bowl, joy: ICON.heart, energy: ICON.bolt, clean: ICON.drop }[m.dataset.k]; });
$('#btnFeed .ti').innerHTML = ICON.bowl;
$('#btnPlay .ti').innerHTML = ICON.ball;
$('#btnMap .ti').innerHTML = ICON.planet;
$('#mapBack .bi').innerHTML = ICON.back;
$('#mapView .mstar').innerHTML = ICON.star;
$('#mapView .mbolt').innerHTML = ICON.bolt;
$('#arcPauseBtn').innerHTML = ICON.pause;
$('#btnHouse .ti').innerHTML = ICON.mansion;
$('#btnCard .ti').innerHTML = ICON.card;
$('#btnTeam .ti').innerHTML = ICON.team;
$$('.paws span').forEach(s => { s.innerHTML = ICON.paw; });
const meters = {};
$$('.meter').forEach(el => { meters[el.dataset.k] = { el, fill: $('.bar i', el), w: -1 }; });

/* ---------- top bar ---------- */
let toastTimer = 0;
function toast(msg, ms) {
  toastEl.textContent = msg; toastEl.hidden = false;
  const base = parseFloat(bannerEl.style.top) || 150;
  toastEl.style.top = (bannerEl.hidden ? base : base + bannerEl.offsetHeight + 8).toFixed(0) + 'px';
  toastEl.classList.remove('show'); void toastEl.offsetWidth; toastEl.classList.add('show');
  hintEl.style.visibility = 'hidden';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; hintEl.style.visibility = ''; }, ms || 2800);
}
function setMeter(k, v) {
  const m = meters[k], w = Math.round(v);
  if (m.w === w) return;
  m.w = w; m.fill.style.width = w + '%';
  m.el.setAttribute('aria-valuenow', String(w));
  m.el.classList.toggle('low', v < 25);
}
function updateHud() {
  if (!st) return;
  if (typeof updateAnimaBtn === 'function') updateAnimaBtn();
  $('#petName').textContent = st.name;
  $('#tagStage').textContent = String(st.stage);
  const g = st.stage >= 2 ? GEMS[STAGE_GEM[st.stage]] : null;
  $('#tagStage').style.background = g ? g.color : '';
  $('#coinNum').textContent = fmtNum(st.coins);
  $('#pearlNum').textContent = fmtNum(st.pearls);
  $('#crystalNum').textContent = fmtNum(st.crystals || 0);
  $('#crystalPill').classList.toggle('ready', (st.crystals || 0) >= FUSION_COST || st.fusionStones > 0);
  setMeter('food', st.food); setMeter('joy', st.joy); setMeter('energy', st.energy); setMeter('clean', st.clean);
  const gap = dayGap(st.lastFedDay, dayKey(Date.now()));
  $('#streakNum').textContent = String(shownStreak());
  $('#streakPill').classList.toggle('due', gap !== 0);
  btnFeed.classList.toggle('due', gap !== 0 && st.food < 60);
  $('#streakPill').setAttribute('aria-label', gap === 0 ? `Fed today. ${shownStreak()} days in a row` : 'Not fed yet today');
  syncEvoBadge();
  const tp = $('#tagPets'), n = st.others.length;
  tp.hidden = !n; if (n) tp.textContent = '+' + n;
  $('#tagBtn').setAttribute('aria-label', n ? `Open ${st.name}'s card and switch between your ${n + 1} pets` : 'Open pet card');
  updateRoomBar();
  if (widgetOpen) refreshWidgets();
}
function syncEvoBadge() {
  const b = $('#evoBadge'), ready = st && evoReady();
  if (ready && b.hidden) { b.innerHTML = gemSVG(STAGES[st.stage + 1].gem); b.hidden = false; }
  else if (!ready) b.hidden = true;
}
const TIPS = [
  { k: 'tap', text: n => `Tap the floor and ${n} walks over.` },
  { k: 'pet', text: n => `Rub ${n} with your finger to give pats.` },
  { k: 'feed', text: n => `Open Feed and give ${n} a snack.` },
  { k: 'item', text: n => `Tap the bed or the plant. ${n} goes to use it.` },
  { k: 'map', text: n => `Tap Adventure to play arcade stages with ${n} and win gemstones.` },
  { k: 'play', text: () => 'Open Play for games in the room.' },
  { k: 'decor', text: () => 'Open House to see your whole mansion, decorate it and build new rooms: a kitchen, a garden, a farm and more.' },
];
function doneTip(k) { if (!st || st.tips[k]) return; st.tips[k] = true; updateHint(); saveSoon(); }
function updateHint() {
  if (!st || homeMode || !running || decorating || act) { hintEl.hidden = true; return; }
  const t = TIPS.find(x => !st.tips[x.k]);
  if (!t) { hintEl.hidden = true; return; }
  const txt = t.text(st.name);
  if (hintEl.textContent !== txt) hintEl.textContent = txt;
  hintEl.hidden = !trayEl.hidden || !sheetWrap.hidden;
}

/* ---------- trays: feed, play, care ---------- */
let trayKind = null;
function syncDock() {
  btnFeed.setAttribute('aria-expanded', String(trayKind === 'feed'));
  btnPlay.setAttribute('aria-expanded', String(trayKind === 'play'));
}
function closeTray() { trayEl.hidden = true; trayKind = null; syncDock(); updateHint(); }
function openTray(kind) {
  if (trayKind === kind) { closeTray(); return; }
  trayKind = kind;
  let html = '';
  if (kind === 'feed') {
    html = `<div class="tray-head"><h2>Feed &amp; care</h2><p>Tap a snack to fill the bowl, or drag one onto the floor</p><button class="icon-btn" type="button" data-close aria-label="Close">${ICON.close}</button></div><div class="tiles four">`;
    html += Object.keys(SNACKS).filter(k => !SNACKS[k].farm && !SNACKS[k].drink && !SNACKS[k].rare).map(k => { const s = SNACKS[k]; return `<button class="tile snack" type="button" data-snack="${k}">${SNACK_SVG[k]}<b>${s.name}</b><small>${s.cost ? `${s.cost} coins` : `+${s.food} food`}</small></button>`; }).join('') + '</div>';
    const grown = Object.keys(SNACKS).filter(k => SNACKS[k].farm), hasFarm = hasRoom(st.house, 'farm');
    if (hasFarm || grown.some(k => st.pantry[k])) {
      html += `<p class="tray-sub">From your farm · extra growth${roomType() === 'kitchen' ? ' · kitchen bonus on' : ''}</p><div class="tiles four">` + grown.map(k => { const s = SNACKS[k], n = st.pantry[k] || 0; return `<button class="tile snack${n ? '' : ' cant'}" type="button" data-snack="${k}"${n ? '' : ' aria-disabled="true"'}>${SNACK_SVG[k]}<b>${s.name}</b><small>${n ? `×${n} · +${s.xp} bond` : 'Grow it'}</small></button>`; }).join('') + '</div>';
    } else if (roomType() === 'kitchen') html += '<p class="tray-sub">Kitchen bonus: meals here fill 25% more</p>';
    const special = SPECIAL_FOODS.filter(k => st.pantry[k]);
    if (special.length) html += `<p class="tray-sub">Special foods · pet levels and bond · any pet can have them from Team</p><div class="tiles four">` + special.map(k => `<button class="tile snack" type="button" data-snack="${k}">${SNACK_SVG[k]}<b>${SNACKS[k].name}</b><small>×${st.pantry[k]} · ${foodEffect(k)}</small></button>`).join('') + '</div>';
    const drinks = Object.keys(DRINKS).filter(k => st.pantry[k]);
    if (drinks.length) html += `<p class="tray-sub">Energy drinks · refill energy for adventures</p><div class="tiles four">` + drinks.map(k => { const s = SNACKS[k]; return `<button class="tile snack" type="button" data-snack="${k}">${SNACK_SVG[k]}<b>${s.name}</b><small>×${st.pantry[k]} · +${s.energy} energy</small></button>`; }).join('') + '</div>';
    html += `<div class="tiles four care-row"><button class="tile" type="button" data-care="bath">${ICON.bath}<b>Bath</b><small>Clean ${Math.round(st.clean)}%</small></button>`;
    html += `<button class="tile" type="button" data-care="brush">${ICON.brush}<b>Brush</b><small>Shiny fur</small></button>`;
    html += `<button class="tile" type="button" data-care="lights">${st.lightsOff ? ICON.sun : ICON.moon}<b>${st.lightsOff ? 'Wake' : 'Sleep'}</b><small>${st.lightsOff ? 'Lights on' : 'Lights off'}</small></button>`;
    html += `<button class="tile" type="button" data-care="map">${ICON.planet}<b>Adventure</b><small>Galaxy map</small></button></div>`;
  } else if (kind === 'play') {
    html = `<div class="tray-head"><h2>Play</h2><p>Activities earn coins and bond</p><button class="icon-btn" type="button" data-close aria-label="Close">${ICON.close}</button></div><div class="tiles">`;
    const icons = { ball: ICON.ball, bubbles: ICON.bubbles, catch: ICON.basket, dig: ICON.shovel, tricks: ICON.star, seek: ICON.eye };
    html += ACTIVITIES.map(a => {
      let sub = a.sub, dis = false;
      if (a.id === 'ball' && ball) sub = 'Tap to put away';
      if (a.id === 'dig' && st.digWait > 0) { sub = `Ready in ${fmtWait(st.digWait)}`; dis = true; }
      return `<button class="tile" type="button" data-act="${a.id}"${dis ? ' aria-disabled="true"' : ''}>${icons[a.id]}<b>${a.name}</b><small>${sub}</small></button>`;
    }).join('') + '</div>';
  } else {
    html = `<div class="tray-head"><h2>Care</h2><p>Keep ${esc(st.name)} clean and rested</p><button class="icon-btn" type="button" data-close aria-label="Close">${ICON.close}</button></div><div class="tiles">`;
    html += `<button class="tile" type="button" data-care="bath">${ICON.bath}<b>Bath</b><small>Clean ${Math.round(st.clean)}%</small></button>`;
    html += `<button class="tile" type="button" data-care="brush">${ICON.brush}<b>Brush</b><small>Shiny fur</small></button>`;
    html += `<button class="tile" type="button" data-care="lights">${st.lightsOff ? ICON.sun : ICON.moon}<b>${st.lightsOff ? 'Wake' : 'Sleep'}</b><small>${st.lightsOff ? 'Lights on' : 'Lights off'}</small></button></div>`;
  }
  trayInner.innerHTML = html;
  trayEl.hidden = false;
  syncDock(); updateHint();
  if (kind === 'feed') bindSnackDrag();
}
trayInner.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) { closeTray(); return; }
  const a = e.target.closest('[data-act]');
  if (a) { doneTip('play'); startActivity(a.dataset.act); return; }
  const c = e.target.closest('[data-care]');
  if (c) {
    const k = c.dataset.care;
    if (k === 'lights') { closeTray(); setLights(!st.lightsOff); }
    else if (k === 'map') { closeTray(); openMap(); }
    else startActivity(k);
  }
});
const btnFeed = $('#btnFeed'), btnPlay = $('#btnPlay');
btnFeed.addEventListener('click', () => { sfx.unlock(); openTray('feed'); });
btnPlay.addEventListener('click', () => { sfx.unlock(); openTray('play'); });
$('#btnMap').addEventListener('click', () => { sfx.unlock(); doneTip('map'); openMap(); });
$('#btnHouse').addEventListener('click', () => { sfx.unlock(); doneTip('decor'); openMansion(); });
$('#btnCard').addEventListener('click', () => { sfx.unlock(); openCard(); });
$('#btnTeam').addEventListener('click', () => { sfx.unlock(); openTeam(); });
$('#tagBtn').addEventListener('click', openCard);
$('#streakPill').addEventListener('click', openCard);
$('#coinPill').addEventListener('click', () => { drawerTab = 'shop'; drawerCat = 'all'; enterDecor(); });
$('#pearlPill').addEventListener('click', () => openPearlShop(0));
$('#crystalPill').addEventListener('click', () => openCrystalShop(0));

let drag = null;
function bindSnackDrag() {
  $$('.tile.snack', trayInner).forEach(btn => {
    btn.addEventListener('pointerdown', e => {
      sfx.unlock();
      if (drag || !running) return;
      drag = { id: e.pointerId, type: btn.dataset.snack, sx: e.clientX, sy: e.clientY, moving: false, ghost: null };
      try { btn.setPointerCapture(e.pointerId); } catch (_) {}
      e.preventDefault();
    });
    btn.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.moving && hyp(e.clientX - drag.sx, e.clientY - drag.sy) > 10) {
        drag.moving = true;
        drag.ghost = document.createElement('div'); drag.ghost.className = 'ghost'; drag.ghost.innerHTML = SNACK_SVG[drag.type];
        document.body.appendChild(drag.ghost);
      }
      if (drag.moving) drag.ghost.style.transform = `translate3d(${e.clientX}px, ${e.clientY - 18}px, 0)`;
    });
    btn.addEventListener('pointerup', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag; drag = null;
      if (d.ghost) d.ghost.remove();
      if (!d.moving) { closeTray(); giveSnack(d.type); return; }
      const tr = trayInner.getBoundingClientRect();
      const over = e.clientX >= tr.left && e.clientX <= tr.right && e.clientY >= tr.top && e.clientY <= tr.bottom;
      if (!over && e.clientY < dockEl.getBoundingClientRect().top - 4) { closeTray(); giveSnack(d.type, { x: e.clientX - stageRect.left, y: e.clientY - stageRect.top - 18 }); }
    });
    btn.addEventListener('pointercancel', e => { if (drag && e.pointerId === drag.id) { if (drag.ghost) drag.ghost.remove(); drag = null; } });
    btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeTray(); giveSnack(btn.dataset.snack); } });
  });
}
function setLights(off, grumpy) {
  st.lightsOff = off;
  document.body.classList.toggle('lights-off', off);
  if (off) {
    if (act) endActivity(true);
    if (pet.mode !== 'sleep') { pet.goal = null; if (pet.mode !== 'carried') setMode('idle'); goToBed(); }
    toast(`Lights off. Night night, ${st.name}`);
    sfx.sleepy();
  } else if (pet.mode === 'sleep' || st.asleep) wake(!!grumpy);
  saveSoon();
}

/* ---------- sheets ---------- */
let sheetTimer = 0, sheetKind = null;
function openSheet(kind, html) {
  closeTray();
  sheetKind = kind;
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>${html}`;
  sheetWrap.hidden = false;
  sheetEl.scrollTop = 0;
  updateHint();
  setTimeout(() => { try { $('[data-sheet-close]', sheetEl).focus({ preventScroll: true }); } catch (e) {} }, 50);
}
function closeSheet() {
  sheetWrap.hidden = true; sheetKind = null;
  clearInterval(sheetTimer); disarmReset(); updateHint();
  // (a sheet opened from a run's Team button: once no sheet follows it, the run carries on)
  if (typeof runTeam !== 'undefined' && runTeam) setTimeout(() => { if (sheetWrap.hidden && runTeam) endRunTeam(); }, 0);
}
sheetWrap.addEventListener('click', e => {
  if (e.target === sheetWrap || e.target.closest('[data-sheet-close]')) { closeSheet(); return; }
  const go = e.target.closest('[data-go]');
  if (go) {
    const k = go.dataset.go;
    if (k === 'evolve') { closeSheet(); evolve(); }
    else if (k === 'dig') { closeSheet(); startActivity('dig'); }
    else if (k === 'map') { closeSheet(); openMap(); if (go.dataset.gem) focusGemStage(go.dataset.gem); }
    else if (k === 'widgets') { closeSheet(); openWidgets(); }
    else if (k === 'lab') { closeSheet(); openLab(); }
    else if (k === 'dev') openDev();
    else if (k === 'evoreset') evoResetTap(go);
    else if (k === 'feed') { if (feedPet(st, go.dataset.k)) renderCard(); }
    else if (k.startsWith('dev-')) devAction(k.slice(4), go);
    else if (k === 'reset') resetTap();
    else if (k === 'login') openLogin();
    else if (k === 'login-claim') claimLogin();
    else if (k === 'save-out') saveOut();
    else if (k === 'save-in') { $('#saveBox').hidden = false; $('#saveLoadBtn').hidden = false; const ta = $('#saveCode'); ta.value = ''; ta.placeholder = 'Paste a save code here'; $('#saveMsg').textContent = ''; ta.focus(); }
    else if (k === 'save-load') saveIn($('#saveCode').value);
    else if (k === 'sound') { st.sound = !st.sound; go.setAttribute('aria-checked', String(st.sound)); sfx.unlock(); if (st.sound) sfx.chirp(); saveSoon(); }
    else if (k === 'lowfx') { st.lowFx = !st.lowFx; go.setAttribute('aria-checked', String(st.lowFx)); saveSoon(); }
    else if (k === 'retro') { st.retro = st.retro === false; go.setAttribute('aria-checked', String(st.retro)); retro.frame(); saveSoon(); }
    else if (k === 'fast') { st.fast = !st.fast; go.setAttribute('aria-checked', String(st.fast)); toast(st.fast ? 'Fast-forward on: 1 minute = 4 pet hours' : 'Back to real time'); saveSoon(); }
    else if (k.startsWith('pack')) buyPearls(+go.dataset.n);
    else if (k === 'room-go') { closeSheet(); if (mansionOpen) closeMansion(); switchRoom(+go.dataset.i, +go.dataset.i > st.house.cur ? 1 : -1); }
    else if (k === 'room-deco') { closeSheet(); if (mansionOpen) closeMansion(); if (+go.dataset.i !== st.house.cur) switchRoom(+go.dataset.i, 1); enterDecor(); }
    else if (k === 'mansion') { closeSheet(); openMansion(); }
    else if (k === 'build') openBuildSheet(go.dataset.kind || 'any');
    else if (k === 'paint' || k === 'roof') setPaint(k, go.dataset.id);
    else if (k === 'room-build') buildRoom(go.dataset.type);
    else if (k === 'room-move') moveRoom(+go.dataset.d);
    else if (k === 'room-remove') removeRoom(go);
    else if (k === 'pet-sw') { switchPet(+go.dataset.i); if (sheetKind === 'card') renderCard(); if (sheetKind === 'accs') renderAccs(); if (sheetKind === 'pocket') openPocket(); if (sheetKind === 'team') renderTeam(); renderDungeon(); }
    else if (k === 'team') openTeam(go.dataset.uid);
    else if (k === 'team-pick') { teamUid = go.dataset.uid; sfx.boop(); renderTeam(); }
    else if (k === 'team-party') teamToggleParty(go.dataset.uid);
    else if (k === 'team-evolve') teamEvolve(go.dataset.uid);
    else if (k === 'team-lead') teamLead(go.dataset.uid);
    else if (k === 'team-slot') { const P = teamPet(); openCards(go.dataset.slot, P.uid === st.uid ? null : P.uid, 'team'); }
    else if (k === 'team-acc') { const P = teamPet(); openAccs(go.dataset.t, P.uid === st.uid ? null : P.uid, 'team'); }
    else if (k === 'team-feed') { if (feedPet(teamPet(), go.dataset.k)) { updateHud(); renderTeam(); } }
    else if (k === 'team-anima') openAnimas();
    else if (k === 'team-cards') { const P = teamPet(); openCards('normal', P.uid === st.uid ? null : P.uid, 'team'); }
    else if (k === 'acc-who') { accFor = go.dataset.uid === st.uid ? null : go.dataset.uid; accSel = null; accArm = null; sfx.boop(); renderAccs(); }
    else if (k === 'acc-tab') { accTab = go.dataset.t; accSel = null; accArm = null; sfx.boop(); renderAccs(); }
    else if (k === 'acc-pick') { accSel = go.dataset.u; accArm = null; sfx.boop(); renderAccs(); }
    else if (k === 'acc-eq') accEquip(go.dataset.u);
    else if (k === 'acc-off') accTakeOff(go.dataset.t);
    else if (k === 'acc-scrap') accScrap(go.dataset.u);
    else if (k === 'acc-scrap-low') accScrapLow();
    else if (k === 'cards-tab') { cardsSlot = go.dataset.slot; cardsSel = null; renderCards(); }
    else if (k === 'card-pick') { const id = go.dataset.id, mv = elemParse(id); if (id === 'own' || (mv ? !elemLock(mv, cardsPet()) : st.cards[id])) equipCard(id); else { cardsSel = id; renderCards(); sfx.boop(); } }
    else if (k === 'card-eq') equipCard(go.dataset.id);
    else if (k === 'gift') openGiftShop();
    else if (k === 'gift-buy') confirmGiftBuy();
    else if (k === 'gift-confirm') buyGift('buy');
    else if (k === 'gift-pearls') buyGift('pearls');
    else if (k === 'dungeon') { closeSheet(); openMap(); setMapTab('dungeon', true); }
    else if (k === 'egg') openEggShop();
    else if (k === 'egg-buy') confirmEggBuy();
    else if (k === 'egg-confirm') startAdopt('buy');
    else if (k === 'summon') openSummon();
    else if (k === 'pocket') openPocket();
    else if (k === 'summon-10') doSummon(SUMMON_N);
    else if (k === 'summon-1') doSummon(1);
    else if (k === 'egg-pearls') startAdopt('pearls');
    else if (k === 'crystals') openCrystalShop();
    else if (k === 'crystal-buy') { crysFrom = sheetKind === 'shop' ? 'shop' : null; confirmCrystalBuy(); }
    else if (k === 'shop') openShop(go.dataset.sec);
    else if (k === 'shop-buy') shopBuy(go.dataset.k, +go.dataset.n);
    else if (k === 'shop-decor') { closeSheet(); drawerTab = 'shop'; drawerCat = 'all'; enterDecor(); }
    else if (k === 'crystal-confirm') buyCrystals();
    else if (k === 'stone-buy') buyFusionStone();
    else if (k === 'fusion') openFusion();
    else if (k === 'fuse-pick') fusePick(go.dataset.slot, +go.dataset.i);
    else if (k === 'fuse-roll') fuseRoll();
    else if (k === 'fuse-ab') fuseAbPick(go.dataset.slot, go.dataset.src);
    else if (k === 'fuse-pair') fusePair(+go.dataset.g);
    else if (k === 'fuse-all') fuseAll(+go.dataset.g);
    else if (k === 'fuse-all-go') fuseAll(+go.dataset.g, true);
    else if (k === 'fuse-go') fusePets();
    else if (k === 'laboratory') openLaboratory(go.dataset.tab);
    else if (k === 'animas') { closeSheet(); openAnimas(go.dataset.id); }
    else if (k === 'an-pick') { animaSel = go.dataset.id; sfx.boop(); renderAnimas(); }
    else if (k === 'an-eq') equipAnima(go.dataset.id);
    else if (k === 'an-res') toggleResonance(go.dataset.id);
    else if (k === 'an-asc') ascendAnima(go.dataset.id);
    else if (k === 'an-unseal') unsealAnima(go.dataset.id);
    else if (k === 'cos') applyCosmetic(go.dataset.id);
    return;
  }
});
sheetWrap.addEventListener('submit', e => {
  if (e.target.id !== 'renameForm') return;
  e.preventDefault();
  const v = $('#renameInput').value.trim().slice(0, 14);
  if (!v || v === st.name) return;
  st.name = v; $('#renameInput').blur();
  updateHud(); updateHint(); saveSoon();
  toast(`Renamed to ${v}`);
  renderCard();
});

/* pet card: identity, evolution, settings */
function openCard() {
  if (!st) return;
  openSheet('card', '');
  renderCard();
  clearInterval(sheetTimer);
  sheetTimer = setInterval(() => { if (sheetKind === 'card') renderCardLive(); }, 1000);
}
function evoSectionHTML() {
  const e = evoStatus();
  let nodes = '';
  for (let n = 1; n <= 7; n++) {
    const done = n <= st.stage, cur = n === st.stage, gk = STAGES[n].gem;
    const f = done ? st.forms[n - 1] : null;
    const inner = f ? petSVG(f, { frame: 'fit' }) : (n === st.stage + 1 ? gemSVG(gk) : '<b class="q">?</b>');
    nodes += `<div class="evo-node${done ? ' done' : ''}${cur ? ' cur' : ''}" style="--gc:${gk ? GEMS[gk].color : 'var(--brass-hi)'}"><i>${inner}</i><span>${STAGES[n].name}</span></div>`;
  }
  let body = '';
  if (!e) body = `<p class="note">${esc(st.name)} has reached the final stage. Every day it finds a pearl for you.</p>`;
  else {
    const g = GEMS[e.nx.gem], have = st.gems[e.nx.gem] || 0;
    body = `<ul class="reqs"><li><span class="ck${e.bondOk ? ' ok' : ''}">${e.bondOk ? '✓' : ''}</span>Bond level ${e.nx.bond} <span class="mono" id="cBond">(now ${e.level})</span></li><li><span class="ck${e.gemOk ? ' ok' : ''}">${e.gemOk ? '✓' : ''}</span>${gemSVG(e.nx.gem)} ${g.name} ${have ? `<span class="mono">×${have}</span>` : ''}</li></ul>`;
    body += `<p class="note">${e.gemOk ? 'You have the gemstone.' : `Clear ${gemStageText(e.nx.gem)} on the adventure map: it gives a ${g.name} every time, even if you've cleared it before. You can also find one in Treasure dig, or feed 3 days in a row.`} ${e.bondOk ? '' : 'Bond grows with time together: feeding, pats, play and care.'}</p>`;
    body += `<p class="note"><span class="ck${e.crystalOk ? ' ok' : ''}">${e.crystalOk ? '✓' : ''}</span> <i class="ic-sm">${ICON.crystal}</i> ${EVO_CRYSTALS} crystals <span class="mono">(you have ${fmtNum(st.crystals || 0)})</span>${e.crystalOk ? '' : ' · crystals come from Tower floors and the crystal shop'}</p>`;
    body += `<div class="evo-actions"><button class="btn primary" type="button" data-go="evolve"${e.bondOk && e.gemOk && e.crystalOk ? '' : ' disabled'}>Evolve into ${e.nx.name}</button>${e.gemOk ? '' : `<button class="btn" type="button" data-go="map" data-gem="${e.nx.gem}">${ICON.map}Adventure</button>`}</div>`;
    body += `<p class="note">Next: ${esc(e.nx.perk)} Every evolution reshapes its features at random, so no two pets grow up alike.</p>`;
  }
  if (st.stage > 1) {
    const paid = Object.keys(st.paid || {}).length;
    body += `<div class="evo-actions"><button class="btn small" type="button" data-go="evoreset" id="evoResetBtn">Reset evolution</button></div><p class="note">Turns ${esc(st.name)} back into its Hatchling form${paid ? ` and gives back ${paid} gemstone${paid > 1 ? 's' : ''}` : ''}. Bond level stays. Evolving again grows it in a new random way.</p>`;
  }
  return `<div class="box"><div class="box-top"><span>Evolution · Stage ${st.stage} of 7</span><span class="mono">${STAGES[st.stage].name}</span></div><div class="evo-track">${nodes}</div>${body}</div>`;
}
function renderCard() {
  if (!st || sheetKind !== 'card') return;
  const rr = RARITY[st.rarity], P = persOf(st.dna.personality), f = curForm();
  const hatched = new Date(st.hatchedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const b = bondInfo(st.xp);
  const gems = GEM_ORDER.map(k => `<span class="gem-chip${st.gems[k] ? '' : ' zero'}">${gemSVG(k)}${st.gems[k] || 0}</span>`).join('');
  const traits = traitList(f).map(t => `<span class="trait" style="--rc:${RARITY[t.r].c}"><i></i>${esc(t.label)}</span>`).join('');
  const tricks = TRICKS.map(t => `<li><b>${t.name}</b><span>${st.stage < t.stage ? `Unlocks at stage ${t.stage}` : `${t.how} · ${'★'.repeat(trickStars(t.id))}${'☆'.repeat(5 - trickStars(t.id))}`}</span></li>`).join('');
  const html = `
    ${petStripHTML()}
    <div class="card-head">
      <div class="portrait">${petSVG(f, { frame: 'fit' })}</div>
      <div class="card-id">
        <p class="eyebrow">${esc(speciesName(f))}</p>
        <h2 id="sheetTitle">${esc(st.name)}</h2>
        <p class="card-sub">${starsHTML(starsOf(st.rarity))}<span class="rarity" style="--rc:${rr.c}">${rr.name}</span><span>${P.name} · hatched ${hatched}</span></p>
        <p class="dna mono">One of a kind · DNA ${dnaCode(f)}</p>${st.fusedFrom ? `<p class="dna mono">${ICON.fusion} Fused from ${esc(st.fusedFrom[0])} + ${esc(st.fusedFrom[1])} · gen ${st.gen}</p>` : ''}
      </div>
    </div>
    ${evoSectionHTML()}
    <div class="box"><div class="box-top"><span>Bond level ${b.level}</span><span class="mono" id="cBondXp">${Math.floor(b.into)} / ${b.need}</span></div><span class="bar" style="margin-top:7px"><i id="cBondBar" style="width:${(b.into / b.need * 100).toFixed(1)}%;background:var(--joy)"></i></span><p class="note">${esc(P.desc)}</p></div>
    <h3 class="sec">Gem pouch</h3><div class="gem-pouch">${gems}</div>
    <h3 class="sec">Traits</h3><div class="traits">${traits}</div>
    ${dunCardBox()}
    <h3 class="sec">Space ability</h3><div class="box ab-box">${abilityHTML(applyAbOv(petAbility(f, st.dna.seed), st))}<p class="note">Used in Star Blaster on the Adventure map. It comes from ${esc(st.name)}'s colours and body parts, so evolving can change it.</p></div>
    <dl class="facts">
      <div class="fact"><dt>Age</dt><dd id="fAge">${fmtAge(st.ageH)}</dd></div>
      <div class="fact"><dt>Weight</dt><dd id="fWeight">${weightG()} g</dd></div>
      <div class="fact"><dt>Days fed</dt><dd>${shownStreak()} (best ${st.bestStreak})</dd></div>
      <div class="fact"><dt>Meals</dt><dd>${st.meals}</dd></div>
      <div class="fact"><dt>Pats</dt><dd>${st.pats}</dd></div>
      <div class="fact"><dt>Cozy room</dt><dd>${cozyScore()}</dd></div>
      <div class="fact"><dt>Adventure</dt><dd>${totalStars()} / ${maxStars()} ★</dd></div>
      <div class="fact"><dt>Stages played</dt><dd>${st.map.plays || 0}</dd></div>
    </dl>
    <h3 class="sec">Tricks</h3><ul class="howto">${tricks}</ul>
    <h3 class="sec">How to play</h3>
    <ul class="howto">
      <li><b>Tap the floor</b><span>Your pet walks there. Hold and drag and it chases your finger.</span></li>
      <li><b>Tap furniture</b><span>It goes to use it: sleeps in the bed, plays with toys, sniffs plants.</span></li>
      <li><b>Tap your pet</b><span>A boop. Tap fast to tickle, but not too much.</span></li>
      <li><b>Rub or hold</b><span>Rub for pats. Press and hold to pick it up.</span></li>
      <li><b>Every day</b><span>It gets hungry, tired and messy over real time. Feed it daily for streak rewards.</span></li>
      <li><b>Adventure</b><span>Play arcade stages on the galaxy map with your pet to win gemstones, pearls and rare decor.</span></li>
      <li><b>Evolve</b><span>Build bond, find the stage's gemstone, then evolve from this card. Each evolution reshapes it at random.</span></li>
      <li><b>Tower of Oblivion</b><span>Adventure, then the Tower tab: fight monsters with your pet's own Normal, Strong and Ult abilities, level up, and beat a boss every 4th floor.</span></li>
    </ul>
    <h3 class="sec">Settings</h3>
    <form class="setting rename" id="renameForm"><label for="renameInput">Name</label><div class="row"><input id="renameInput" type="text" maxlength="14" autocomplete="off" spellcheck="false" value="${esc(st.name)}"><button class="btn" type="submit">Save</button></div></form>
    <div class="setting"><div><span id="soundLbl">Sound</span></div><button class="switch" type="button" role="switch" data-go="sound" aria-checked="${st.sound}" aria-labelledby="soundLbl"></button></div>
    <div class="setting"><div><span id="retroLbl">Old film look</span><p class="note">A warm, grainy, flickering picture, like an old cartoon.</p></div><button class="switch" type="button" role="switch" data-go="retro" aria-checked="${st.retro !== false}" aria-labelledby="retroLbl"></button></div>
    <div class="setting"><div><span id="lowFxLbl">Fewer effects</span><p class="note">Thinner particles in the Tower and rifts, for an older phone. Attack shapes and warnings stay.</p></div><button class="switch" type="button" role="switch" data-go="lowfx" aria-checked="${!!st.lowFx}" aria-labelledby="lowFxLbl"></button></div>
    <div class="setting"><div><span id="fastLbl">Fast-forward time</span><p class="note">1 minute becomes 4 pet hours, to test hunger, bond and growth quickly.</p></div><button class="switch" type="button" role="switch" data-go="fast" aria-checked="${st.fast}" aria-labelledby="fastLbl"></button></div>
    <div class="setting"><div><span>Widgets</span><p class="note">How the pet stays on your home and lock screen.</p></div><button class="btn" type="button" data-go="widgets">${ICON.widget}Preview</button></div>
    <div class="setting"><div><span>Design lab</span><p class="note">Random pets and full evolution lines, to see the variety.</p></div><button class="btn" type="button" data-go="lab">${ICON.dice}Open</button></div>
    <div class="setting"><div><span>Developer tools</span><p class="note">Preview and unlock every evolution, unlock stages and floors, free gift boxes, ripen crops, hatch free eggs, add coins and gems. For testing only.</p></div><button class="btn" type="button" data-go="dev">${ICON.wrench}Open</button></div>
    <div class="setting"><div><span>Daily rewards</span><p class="note">This month's calendar: ${LOGIN_CRYSTALS} crystals every third day, goodies between, ${fmtNum(LOGIN_FINAL)} crystals at the month's end.</p></div><button class="btn" type="button" data-go="login">Open</button></div>
    <div class="setting"><div><span>Move your save</span><p class="note">Copy a save code here, then paste it into the game on another device or website to carry your pets, house and progress across.</p></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn" type="button" data-go="save-out">Copy code</button><button class="btn" type="button" data-go="save-in">Paste code</button></div></div>
    <div id="saveBox" hidden style="margin:4px 0 12px"><textarea id="saveCode" rows="4" spellcheck="false" style="width:100%;box-sizing:border-box;font:11px ui-monospace,monospace;border-radius:10px;padding:8px;word-break:break-all"></textarea><div style="display:flex;gap:6px;margin-top:6px"><button class="btn primary" type="button" data-go="save-load" id="saveLoadBtn" hidden>Load this save</button><span class="note" id="saveMsg"></span></div></div>
    <div class="setting"><div><span>Start over</span><p class="note">Say goodbye to every pet and the house, and hatch a new mystery egg.</p></div><button class="btn" type="button" data-go="reset" id="resetBtn">Start over</button></div>
    <p class="note" style="margin-top:12px">${esc(saveNoteText())}</p>`;
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>${html}`;
}
function renderCardLive() {
  const a = $('#fAge'); if (a) a.textContent = fmtAge(st.ageH);
  const w = $('#fWeight'); if (w) w.textContent = weightG() + ' g';
  const b = bondInfo(st.xp), bx = $('#cBondXp'), bb = $('#cBondBar');
  if (bx) bx.textContent = `${Math.floor(b.into)} / ${b.need}`;
  if (bb) bb.style.width = (b.into / b.need * 100).toFixed(1) + '%';
}
let resetTimer = 0;
function disarmReset() {
  clearTimeout(resetTimer);
  const r = $('#resetBtn'); if (r) { r.classList.remove('armed'); r.textContent = 'Start over'; }
  const e = $('#evoResetBtn'); if (e) { e.classList.remove('armed'); e.textContent = 'Reset evolution'; }
}
function evoResetTap(btn) {
  if (!btn.classList.contains('armed')) { disarmReset(); btn.classList.add('armed'); btn.textContent = 'Tap again to reset'; resetTimer = setTimeout(disarmReset, 4000); return; }
  disarmReset(); closeSheet(); resetEvolution();
}
/* back to the hatchling: paid gemstones come back, and the next evolutions roll new features */
function resetEvolution() {
  if (!st || st.stage <= 1) return;
  const back = Object.keys(st.paid || {}).map(n => STAGE_GEM[n]).filter(Boolean);
  back.forEach(k => { st.gems[k] = (st.gems[k] || 0) + 1; });
  st.paid = {};
  st.stage = 1; st.forms.length = 1; st.evoResets = (st.evoResets || 0) + 1;
  if (act) endActivity(true);
  buildPet(true); renderDecor(); updateHud(); saveSoon();
  sparkles(10); sfx.hum(); jump(ps * 0.2);
  toast(`${st.name} is a Hatchling again${back.length ? `. ${back.length} gemstone${back.length > 1 ? 's' : ''} returned` : ''}.`, 3600);
}
/* moving a save between devices or sites: the whole state as a code (base64 of its JSON, behind a short tag) */
const SAVE_TAG = 'COCOPETS1:';
function saveOut() {
  if (!st) return;
  const code = SAVE_TAG + btoa(unescape(encodeURIComponent(JSON.stringify(serialize()))));
  const box = $('#saveBox'), ta = $('#saveCode'); box.hidden = false; $('#saveLoadBtn').hidden = true; ta.value = code; ta.select();
  const done = ok => { $('#saveMsg').textContent = ok ? 'Copied. Paste it with "Paste code" on the other device.' : 'Select the code above and copy it.'; };
  try { navigator.clipboard.writeText(code).then(() => done(true), () => done(false)); } catch (e) { done(false); }
}
function saveIn(text) {
  const msg = $('#saveMsg'), t = String(text || '').trim();
  let r = null; try { if (t.startsWith(SAVE_TAG)) r = sanitize(JSON.parse(decodeURIComponent(escape(atob(t.slice(SAVE_TAG.length)))))); } catch (e) { r = null; }
  if (!r) { msg.textContent = "That isn't a save code. Copy the whole code, starting COCOPETS1:"; return; }
  r.savedAt = Date.now(); hatchedThisSession = false; closeSheet(); adoptState(r); loadedSavedAt = r.savedAt; saveLocalNow(); Store.touch(); Store.flush();
  toast(`${r.name} is here`);
}
function resetTap() {
  const r = $('#resetBtn');
  if (!r.classList.contains('armed')) { r.classList.add('armed'); r.textContent = 'Tap again to confirm'; resetTimer = setTimeout(disarmReset, 4000); return; }
  disarmReset(); closeSheet(); doReset();
}

/* pearls: the premium currency, simulated in this prototype */
function openPearlShop(short) {
  const packs = [[60, '$1.99'], [150, '$4.99'], [400, '$9.99']];
  openSheet('pearls', `
    <p class="eyebrow">Shop</p><h2 class="title" id="sheetTitle">Get pearls</h2>
    <p class="note">${short ? `You need ${short} more pearls. ` : ''}Pearls buy premium decor, mystery eggs and gift boxes. Everything else can be won by playing.</p>
    <div class="packs">${packs.map(p => `<button class="pack" type="button" data-go="pack" data-n="${p[0]}">${ICON.pearl}<b>${p[0]} pearls</b><span class="mono">${p[1]}</span></button>`).join('')}</div>
    <div class="packs"><button class="pack" type="button" data-go="gift">${ICON.gift}<b>Gift box</b><span class="mono">${GIFT_PRICE} or ${GIFT_PEARLS} pearls</span></button></div>
    <p class="demo-note">Prototype: tapping a pack adds the pearls for free so you can try the shop. In the real app this opens the App Store or Google Play payment sheet. Prices are examples.</p>`);
}
function buyPearls(n) {
  st.pearls += n; updateHud(); saveSoon(); sfx.coin();
  closeSheet();
  toast(`Added ${n} pearls (prototype, nothing was charged)`);
  if (decorating) renderDrawer();
}

/* ---------- evolution ceremony ---------- */
let evolving = false;
const evoView = (f, o) => petSVG(f, Object.assign({ scale: 0.62 + 0.36 * ((f.stage || 1) - 1) / 6 }, o || {}));
/* evolve(next) — next is an optional {form, changes} from the dev preview; free = skip the requirements */
let evoFrom = null;   // (the other pet evolving, when it isn't the one you play)
function evolve(next, free, P) {
  P = P || st; const own = P === st;   // (any pet can evolve: another one from the Team sheet, the run paused or not)
  const e = evoStatusOf(P);
  if (!e || evolving) return;
  if (!free && (!e.bondOk || !e.gemOk || !e.crystalOk)) return;
  evolving = true;
  if (act && own) endActivity(true); evoFrom = own ? null : P;
  const wrap = $('#evoWrap'), petBox = $('#evoPet'), gemBox = $('#evoGem');
  const oldStage = P.stage, nx = e.nx, oldForm = formOf(P);
  const res = next && next.form && next.form.stage === nx.n ? next : evolveForm(oldForm, mulberry32(((Date.now() % 2147483647) ^ Math.floor(Math.random() * 2147483647)) >>> 0), nx.n);
  petBox.className = 'evo-pet';
  petBox.innerHTML = evoView(oldForm);
  $('#evoEyebrow').textContent = `Stage ${oldStage} → ${nx.n}`;
  $('#evoTitle').textContent = `${P.name} is evolving!`;
  $('#evoText').textContent = free && !e.gemOk ? 'Developer evolve: no gemstone needed' : `${P.name} takes the ${GEMS[nx.gem].name}…`;
  $('#evoPerk').hidden = true; $('#evoDone').hidden = true;
  gemBox.innerHTML = gemSVG(nx.gem); gemBox.hidden = false;
  gemBox.style.animation = 'none'; void gemBox.offsetWidth; gemBox.style.animation = '';
  wrap.hidden = false;
  sfx.hum();
  setTimeout(() => { petBox.classList.add('glowing'); gemBox.hidden = true; }, 1300);
  setTimeout(() => {
    if (st.gems[nx.gem] > 0 && (!free || e.gemOk)) { st.gems[nx.gem]--; if (!st.gems[nx.gem]) delete st.gems[nx.gem]; P.paid = P.paid || {}; P.paid[nx.n] = true; }
    if (!free || e.crystalOk) st.crystals = Math.max(0, (st.crystals || 0) - EVO_CRYSTALS);
    P.stage = nx.n;
    P.forms.length = nx.n - 1; P.forms.push(res.form);
    $('#evoFlash').classList.remove('go'); void $('#evoFlash').offsetWidth; $('#evoFlash').classList.add('go');
    petBox.className = 'evo-pet reveal';
    petBox.innerHTML = evoView(res.form, { eyes: 'happy', mouth: 'open' });
    sfx.fanfare();
    $('#evoTitle').textContent = `${P.name} evolved into ${/^[AEIOU]/.test(speciesName(res.form)) ? 'an' : 'a'} ${speciesName(res.form)}!`;
    $('#evoText').textContent = `Stage ${nx.n} of 7 · ${nx.name}`;
    const perk = $('#evoPerk');
    perk.innerHTML = `<ul class="changes">${res.changes.slice(0, 4).map(c => `<li>${esc(c)}</li>`).join('')}</ul><span>${esc(nx.perk)}</span>`;
    perk.hidden = false;
    $('#evoDone').hidden = false;
    if (own) { buildPet(true); renderDecor(); updateHud(); addXP(30); } else { P.xp = (P.xp || 0) + 30; if (typeof buildCompanions === 'function') buildCompanions(); updateHud(); }
    saveSoon();
    devPreview = null;
  }, 3600);
}
$('#evoDone').addEventListener('click', () => {
  $('#evoWrap').hidden = true; evolving = false;
  const other = evoFrom; evoFrom = null;
  if (!other) { sparkles(12); hearts(3); jump(ps * 0.3); if (st.stage === 5) toast('New: wings! Happy pets float now and then.'); }
  if (sheetKind === 'team') renderTeam();
  if (devReopen) { devReopen = false; setTimeout(openDev, 400); }
});

/* ---------- widget preview ---------- */
let widgetOpen = false;
function widgetPet(o) { return petSVG(curForm(), Object.assign({ dirt: dirtLevel(), frame: 'fit' }, o || {})); }
function widgetMood() {
  const n = currentNeed(), m = mood();
  if (m === 'asleep') return ['Sleeping', { eyes: 'closed', mouth: 'o' }];
  if (n === 'food') return ['Hungry', { eyes: 'normal', mouth: 'frown', brows: 'sad' }];
  if (n === 'moon') return ['Sleepy', { eyes: 'half', mouth: 'flat' }];
  if (n === 'bath') return ['Needs a bath', { eyes: 'half', mouth: 'pout', brows: 'sad' }];
  if (n === 'ball') return ['Bored', { eyes: 'normal', mouth: 'frown' }];
  return [m === 'joyful' ? 'Very happy' : 'Happy', { eyes: 'normal', mouth: 'smile' }];
}
function openWidgets(tab) {
  widgetOpen = true;
  const o = $('#widgetOvl');
  o.innerHTML = `<div class="ovl-inner">
    <div class="ovl-head"><h2>Widgets</h2><button class="btn small" type="button" id="wgClose">Done</button></div>
    <div class="tabs" role="tablist"><button class="tab" role="tab" type="button" data-wtab="home" aria-selected="true">Home screen</button><button class="tab" role="tab" type="button" data-wtab="lock" aria-selected="false">Lock screen</button><button class="tab" role="tab" type="button" data-wtab="live" aria-selected="false">Live wallpaper</button></div>
    <div id="wgBody"></div>
    <ul class="facts-list">
      <li>Widgets keep ${esc(st.name)} on your home and lock screen all day, on iPhone and Android, while the app is closed.</li>
      <li>Feed and Pat work right from the widget. On iPhone that needs iOS 17 or later, and the phone must be unlocked.</li>
      <li>Widgets show the pet's latest mood but can't run live animation. The phone refreshes them about every 15 to 60 minutes.</li>
      <li>Only Android can make the room your live wallpaper, with the pet walking behind your apps. Try it in the third tab.</li>
    </ul>
  </div>`;
  o.hidden = false;
  renderWidgetTab(tab || 'home');
}
let wtab = 'home';
function renderWidgetTab(t) {
  wtab = t;
  $$('[data-wtab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.wtab === t)));
  const body = $('#wgBody');
  if (t === 'live') {
    body.innerHTML = `<div class="box" style="background:var(--paper)"><p class="note" style="margin:0 0 10px">The room becomes your Android wallpaper. Your pet lives behind your app icons and walks to wherever you tap empty space.</p><button class="btn primary" type="button" id="wgLive">Show me</button></div>`;
    return;
  }
  const [label, face] = widgetMood();
  const time = new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const bars = [['food', ICON.bowl], ['joy', ICON.heart], ['energy', ICON.bolt], ['clean', ICON.drop]].map(([k, ic]) => `<div class="wbar">${ic}<span class="bar"><i style="width:${Math.round(st[k])}%;background:var(--${k === 'food' ? 'food' : k === 'joy' ? 'joy' : k === 'energy' ? 'zap' : 'soap'})"></i></span></div>`).join('');
  if (t === 'home') {
    body.innerHTML = `<div class="phone"><div class="ph-time">${time}</div><div class="ph-grid">
      <div class="wg"><div class="wpet">${widgetPet(face)}</div><b>${esc(st.name)}</b></div>
      ${appIcon('camera')}${appIcon('photos')}${appIcon('maps')}${appIcon('mail')}
      <div class="wg md"><div class="wpet">${widgetPet(face)}</div><div class="wbody"><div><b>${esc(st.name)}</b><div class="wstatus">${label} · Stage ${st.stage}</div></div><div class="wbars">${bars}</div><div class="wbtns"><button type="button" data-wfeed>Feed</button><button type="button" data-wpat>Pat</button></div></div></div>
      ${appIcon('music')}${appIcon('weather')}${appIcon('notes')}${appIcon('clock')}
    </div></div>`;
  } else {
    const ring = v => `<svg class="ring" viewBox="0 0 36 36"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,.25)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="#FFFDF8" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(94.2 * v / 100).toFixed(1)} 94.2"/></svg>`;
    body.innerHTML = `<div class="phone lock"><div class="island"><div class="ipet">${widgetPet(face)}</div><i></i></div><div class="ph-time">${time}</div><div class="ph-date">${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      <div class="lock-row"><div class="lk-round">${ring(st.food)}${ICON.bowl.replace('<svg ', '<svg width="20" height="20" ')}</div><div class="lk-rect"><div class="lkpet">${widgetPet(face)}</div><div><b>${esc(st.name)}</b><span>${label}</span></div></div><div class="lk-round">${ring(st.joy)}${ICON.heart.replace('<svg ', '<svg width="20" height="20" ')}</div></div>
      <p class="note" style="color:#E6E0FF;text-align:center;margin-top:18px">On iPhone the pet can also sit in the Dynamic Island while you use other apps, for up to 8 hours at a time.</p>
    </div>`;
  }
}
function refreshWidgets() { if (widgetOpen && wtab !== 'live') renderWidgetTab(wtab); }
$('#widgetOvl').addEventListener('click', e => {
  if (e.target.closest('#wgClose')) { $('#widgetOvl').hidden = true; widgetOpen = false; return; }
  const t = e.target.closest('[data-wtab]');
  if (t) { renderWidgetTab(t.dataset.wtab); return; }
  if (e.target.closest('#wgLive')) { $('#widgetOvl').hidden = true; widgetOpen = false; setHomeMode(true); return; }
  if (e.target.closest('[data-wfeed]')) {
    sfx.unlock();
    if (st.asleep) { toast(`${st.name} is asleep`); return; }
    giveSnack('berries'); toast(`Fed from the widget. ${st.name} is eating.`); setTimeout(refreshWidgets, 300);
  }
  if (e.target.closest('[data-wpat]')) { sfx.unlock(); st.joy = Math.min(100, st.joy + 4); st.pats++; sfx.purr(); toast(`${st.name} loved that`); refreshWidgets(); saveSoon(); }
});

/* android live wallpaper preview */
let homeBuilt = false, clockTimer = 0;
function setHomeMode(on) {
  homeMode = on;
  document.body.classList.toggle('home-mode', on);
  homeEl.hidden = !on;
  closeTray();
  if (on) {
    if (act) endActivity(true);
    if (!homeBuilt) {
      homeBuilt = true;
      $('#homeGrid').innerHTML = ['camera', 'photos', 'maps', 'mail', 'notes', 'calendar', 'clock', 'weather', 'music', 'games', 'chat', 'browser'].map(k => appIcon(k, 'button')).join('');
      homeDockEl.innerHTML = ['phone', 'chat', 'browser', 'settings'].map(k => appIcon(k, 'button')).join('');
      $$('.app-ic', homeEl).forEach(b => b.addEventListener('click', () => { b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce'); toast('The apps are pretend in this preview'); }));
    }
    const tick = () => { const d = new Date(); $('#homeClock').textContent = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); $('#homeDate').textContent = d.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }); };
    tick(); clockTimer = setInterval(tick, 10000);
  } else clearInterval(clockTimer);
  layout(); updateHint();
  if (on) toast(`Tap empty space and ${st.name} walks over`);
}
$('#homeExit').addEventListener('click', () => setHomeMode(false));

/* ---------- design lab ---------- */
function openLab() {
  const o = $('#labOvl');
  o.innerHTML = `<div class="ovl-inner">
    <div class="ovl-head"><h2>Design lab</h2><button class="btn small" type="button" data-lab="shuffle">${ICON.dice}Shuffle</button><button class="btn small" type="button" data-lab="close">Done</button></div>
    <p class="note" style="margin:0">Every egg rolls its own body shape, fur, pattern, colours, eyes, mouth, nose, cheeks, ears, arms, legs and tail. Each evolution then reshapes those parts at random and adds new ones, so no two pets look the same.</p>
    <div class="lab-grid" id="labGrid"></div>
    <h3 class="sec" style="margin:4px 0 0">Evolution lines</h3>
    <p class="note" style="margin:0">Two hatchlings grown through all 7 stages.</p>
    <div id="labEvo" class="lab-evos"></div>
  </div>`;
  o.hidden = false;
  renderLab();
}
function renderLab() {
  const cards = [];
  for (let i = 0; i < 12; i++) {
    const R = Math.random, gnm = makeGenome(R), r = rarityOf(gnm.form);
    const line = evolveLine(gnm.form, 1 + Math.floor(R() * 7), R), f = line[line.length - 1];
    cards.push(`<div class="lab-card" style="--rc:${RARITY[r].c}"><div class="lp">${petSVG(f, { frame: 'fit' })}</div><span class="rarity" style="--rc:${RARITY[r].c}">${RARITY[r].name}</span><b class="lab-name">${esc(speciesName(f))}</b><small>Stage ${f.stage} · ${esc(traitList(f).slice(1, 4).map(t => t.label).join(' · '))}</small></div>`);
  }
  $('#labGrid').innerHTML = cards.join('');
  $('#labEvo').innerHTML = [0, 1].map(() => {
    const line = evolveLine(makeGenome().form, 7, Math.random);
    return `<div class="evo-line">${line.map(f => `<div>${evoView(f)}<span>${esc(speciesName(f).replace(/^(Astral|Celestial|Starborn|Eternal) /, ''))}</span></div>`).join('')}</div>`;
  }).join('');
}
$('#labOvl').addEventListener('click', e => {
  const b = e.target.closest('[data-lab]');
  if (!b) return;
  if (b.dataset.lab === 'close') $('#labOvl').hidden = true;
  else { renderLab(); sfx.pop(); }
});

/* ---------- egg and hatching ---------- */
let eggTaps = 0, hatching = false, eggGenome = null;
const EGG_SHELLS = [['#FFF6E6', '#FF6F59', '#86C8F2'], ['#F0F7FF', '#B8A3F2', '#FFD447'], ['#FFF0F5', '#8FD9B6', '#F4A1C6'], ['#FDF7E1', '#4F7BD6', '#FF9F43']];
function eggSVG() {
  const s = pick(EGG_SHELLS);
  return `<svg viewBox="-50 -75 100 122" aria-hidden="true"><path d="M0 -70C26 -70 44 -28 44 2C44 28 24 43 0 43C-24 43 -44 28 -44 2C-44 -28 -26 -70 0 -70Z" fill="${s[0]}" stroke="var(--pet-line)" stroke-width="3.5"/><g fill="${s[1]}" opacity=".85"><ellipse cx="-17" cy="-30" rx="7" ry="9"/><ellipse cx="18" cy="-8" rx="9" ry="7"/><ellipse cx="-6" cy="22" rx="8" ry="6"/></g><g fill="${s[2]}"><circle cx="13" cy="-42" r="5"/><circle cx="-25" cy="3" r="5"/><circle cx="23" cy="22" r="4"/></g><path d="M-30 -8Q-26 -14 -20 -10" fill="none" stroke="${s[2]}" stroke-width="3" stroke-linecap="round"/><ellipse cx="-17" cy="-46" rx="6" ry="10" fill="#FFFFFF" opacity=".75" transform="rotate(25 -17 -46)"/><g class="cracks" fill="none" stroke="var(--pet-line)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path data-c="1" d="M-31 -20L-21 -13L-25 -5"/><path data-c="2" d="M31 -27L23 -19L29 -11L21 -5"/><path data-c="3" d="M-44 1L-31 -7L-20 3L-8 -5"/><path data-c="4" d="M-8 -5L4 5L16 -5L28 3L44 -3"/></g></svg>`;
}
const eggBtn = $('#egg');
function updateEggDots() { $$('#eggDots i').forEach((d, i) => d.classList.toggle('on', i < eggTaps)); }
function showIntro() {
  running = false;
  appEl.classList.remove('playing');
  introEl.hidden = false;
  $('#nameForm').hidden = true; $('#baby').hidden = true; $('#reveal').hidden = true; $('#hatchRays').hidden = true;
  eggBtn.hidden = false; eggBtn.innerHTML = eggSVG();
  $('#eggDots').hidden = false;
  eggBtn.classList.remove('hatching', 'tap'); eggBtn.classList.add('idle');
  eggTaps = 0; hatching = false; updateEggDots();
  eggGenome = summonGenome(st && st.dev6 ? 6 : rollStars());
  $('#introEyebrow').textContent = 'Cocopets · Series 1';
  $('#introTitle').textContent = 'A mystery egg!';
  $('#introSub').textContent = 'Every egg hatches a different Cocopet. Tap it to crack it open.';
}
function burstIn(container, n) {
  for (let i = 0; i < (n || 8); i++) {
    const a = (i / (n || 8)) * Math.PI * 2, el = document.createElement('div');
    el.className = 'burst'; el.innerHTML = ICON.sparkle;
    el.style.setProperty('--dx', (Math.cos(a) * 100).toFixed(0) + 'px');
    el.style.setProperty('--dy', (Math.sin(a) * 90 - 20).toFixed(0) + 'px');
    container.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
}
eggBtn.addEventListener('click', () => {
  sfx.unlock();
  if (hatching) return;
  eggTaps++; updateEggDots(); sfx.crack(); buzz(12);
  eggBtn.classList.remove('idle', 'tap'); void eggBtn.offsetWidth; eggBtn.classList.add('tap');
  const c = $(`[data-c="${eggTaps}"]`, eggBtn);
  if (c) c.style.opacity = '1';
  if (eggTaps >= 5) hatch();
});
function hatch() {
  hatching = true;
  const ef = eggGenome.form, r = rarityOf(ef), rr = RARITY[r];
  eggBtn.classList.remove('tap'); eggBtn.classList.add('hatching');
  sfx.giggle();
  const rays = $('#hatchRays');
  rays.style.setProperty('--ray', r >= 4 ? 'rgba(255,214,90,.75)' : r >= 3 ? 'rgba(200,160,255,.6)' : r >= 2 ? 'rgba(140,195,255,.55)' : 'rgba(255,255,255,.5)');
  setTimeout(() => {
    eggBtn.hidden = true; $('#eggDots').hidden = true; rays.hidden = false;
    const baby = $('#baby');
    baby.innerHTML = petSVG(ef, { eyes: 'happy', mouth: 'open' }); baby.hidden = false;
    burstIn($('#nest'), r >= 3 ? 14 : 8);
    if (r >= 3) sfx.fanfare(); else sfx.sparkle();
    $('#introTitle').textContent = r >= 4 ? 'A Secret Cocopet!' : r >= 3 ? 'An Epic find!' : r >= 2 ? 'A Rare one!' : 'It hatched!';
    $('#introSub').textContent = 'Meet your new Cocopet.';
    const rv = $('#reveal');
    rv.innerHTML = `<span class="rarity" style="--rc:${rr.c}">${rr.name}</span><b class="species">${esc(speciesName(ef))}</b><div class="traits">${traitList(ef).map(t => `<span class="trait" style="--rc:${RARITY[t.r].c}"><i></i>${esc(t.label)}</span>`).join('')}</div>`;
    rv.hidden = false;
    setTimeout(() => {
      const ni = $('#nameInput');
      ni.value = ''; ni.placeholder = pick(['Mochi', 'Pip', 'Biscuit', 'Nugget', 'Taro', 'Pudding', 'Bean', 'Sprout', 'Momo', 'Tofu', 'Waffle', 'Pebble', 'Dumpling', 'Kiwi', 'Luma', 'Bobo']);
      $('#nameForm').hidden = false;
    }, 700);
  }, 750);
}
$('#nameForm').addEventListener('submit', e => {
  e.preventDefault();
  sfx.unlock();
  const ni = $('#nameInput');
  const name = (ni.value.trim() || ni.placeholder || 'Pip').replace(/[<>]/g, '').slice(0, 14) || 'Pip';
  if (adopting && st) { ni.blur(); adoptPet(name, eggGenome); return; }
  adopting = false;
  st = newState(name, eggGenome);
  cozyCache = -1;
  hatchedThisSession = true; awayMs = 0; loadedSavedAt = st.savedAt;
  st.lastGiftDay = dayKey(Date.now());
  ni.blur();
  startGame(true);
});

/* the pet card's Dungeon box: level, health, magic and the three abilities */
function dunCardBox() {
  const K = petKit(st), S = K.stats;
  const chip = sl => { const a = K.kit[sl], E = ELEMENTS[a.el] || ELEMENTS.spark; return `<span class="dc-ab"><span class="ds-art" style="--ec:${E.color};--ed:${E.dark}">${glyphSVG(a.glyph)}</span><small>${SLOT_INFO[sl].short}</small><b>${esc(a.name)}</b></span>`; };
  return `<h3 class="sec">Tower of Oblivion</h3><div class="box dun-cardbox"><div class="box-top"><span>Level ${S.L}</span><span class="mono">${fmtNum(st.dxp || 0)} / ${fmtNum(S.need)} XP</span></div><p class="mono dc-stats">HP ${S.hp} · MP ${S.mp} · Power ${S.atk}</p>
    ${feedPanelHTML(st, 'data-go="feed"')}
    <div class="dc-abs">${kitSlots(st).map(chip).join('')}</div>
    <p class="note"><b>Signature: ${esc(K.AB.twistName)}.</b> ${esc(K.AB.twistDesc)} Every pet's abilities come from its own body and DNA, and evolving makes them stronger.</p>
    <div class="evo-actions"><button class="btn small primary" type="button" data-go="team" data-uid="${st.uid}">${ICON.team}Team and gear</button><button class="btn small" type="button" data-go="dungeon">${ICON.sword}Open the Tower</button><button class="btn small" type="button" data-go="gift">${ICON.gift}Gift box</button></div></div>`;
}
