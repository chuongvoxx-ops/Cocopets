/* ---------- Cocopets Town: what every place does (HubFacilities) ----------
   The core (24a) moves the pet about the layout (24-hub-layout) and asks this file three things: where the interactable
   spots are and what their button says (places), what extra things to draw in the depth pass (extraEntities: the farm
   plots with their live crops, the townsfolk at their stalls, the greenhouse once built, the harvest numbers), and what
   to do when the player feeds, pets or plays with the pet in town (onFeed/onPet/onPlay). Everything here works without
   the core too: init() takes any object with the core's API, and whatever is missing falls back to the game's own
   functions (toast, openSheet) or to nothing.
   What each place opens: the cottage door → the house interior (core.openHouse); the shed → seeds and tools; the six farm
   plots → plant / water / harvest in place; the kitchen → cooking (RECIPES, 03-items: crops in, special foods out, real
   time); the dojo → Training (openTeam) and Skills (openCards), the dummies → Skills; the altar → Evolve (openCard) and the
   Laboratory; the left shrine → Fusion, the right shrine → Animas (ascension); stall A Madame Ova (eggs), stall B Marina
   (pearls), stall C Glim (the forge: Fusion Stones and the fusion lab), stall D → the Shop (openShop), Pockets the treasure
   merchant by the kitchen's crates; the workshop → Decorate and the town upgrades (st.hub.up); the Tower gate → the
   dungeon tab (the Sentinel stands by it); the rift gate → the rifts tab; the six mini-game houses → their stage cards
   (core.openStage); Grandpa Moss in the plaza; and the scenic spots: the lookout (a decoration, once), the hidden garden
   (a pearl a day), the reading bench, the dock's end and the hideaway under the big tree (the pets rest beside you).
   Saved in st.hub (04-state sanitizes it): plots, cook, up, found, seeds, pearlDay. */
const HubFacilities = (() => {
  const LIFT = 70;
  const GAME_NAMES = { flappy: 'Cloudpuff Hangar', maze: 'Hedgemaze Garden', shooter: 'Starfall Observatory', blocks: 'Geode Mine', sling: 'Boulder Bluffs Range', platform: 'Hopscotch Gym' };
  /* the townsfolk, ported from Pocket Town (23-town): the same characters, now at the market's stalls, in the plaza and by the gate */
  const NPCS = [
    { id: 'ova', name: 'Madame Ova', role: 'Egg summoner', kind: 'owl', at: 'stallA', lines: ['Every egg is a little universe, dear. Shall we crack one open?', 'Ten eggs for a thousand crystals. The five-star ones glow before they hatch, you know.', 'I once hatched a pet that sneezed snowflakes. Lovely creature.'], act: [['summon', 'Summon eggs'], ['crystals', 'Get crystals']] },
    { id: 'marina', name: 'Marina', role: 'Pearl diver', kind: 'frog', at: 'stallB', lines: ['Ribbit. Pearls from the deep. Earn them by playing, or buy a pouch if you\'re in a hurry.', 'Five hundred pearls buys a treasure box. Three hundred, an egg.', 'The river runs right past my stall now. I dive off the dock when nobody\'s looking.'], act: [['pearls', 'Pearl pouch']] },
    { id: 'glim', name: 'Glim', role: 'Crystal smith', kind: 'mole', at: 'stallC', lines: ['Crystals in, Fusion Stones out. Two pets become one, and the one is stronger.', 'Evolution takes five hundred crystals now. Inflation. Don\'t look at me.', 'I can\'t see much up here, but I can hear a five-star pet from across the plaza.'], act: [['fusion', 'Fusion lab'], ['stones', 'Fusion Stones']] },
    { id: 'pockets', name: 'Pockets', role: 'Treasure merchant', kind: 'raccoon', x: 1585, y: 1498, lines: ['Psst. Treasure boxes. A thousand crystals in every one, plus cards, gems, the works.', 'Found this chest in the Tower. Finders keepers, sellers... also keepers.', 'A legendary card is guaranteed every ten boxes. I keep count so you don\'t have to.'], act: [['gift', 'Treasure box'], ['cards', 'Ability cards']] },
    { id: 'moss', name: 'Grandpa Moss', role: 'Town elder', kind: 'tortoise', x: 1400, y: 985, lines: ['Welcome to Cocopets Town, young one. Your cottage is up the hill to the west, the farm down the lane, the market south of the fountain.', 'Elements, child. Fire melts frost, water quenches fire, and light and dark make an eclipse. Break the scenery and see what it leaves behind.', 'The Tower has a hundred floors. Every tenth one, a Super Fiend. I climbed to floor three once.', 'Grow sunberries, cook them into jam at the kitchen, and your pet grows faster than any shop food could manage.', 'Climb to the lookout some evening. The whole town, and the hills beyond it. Nobody knows what\'s past them yet.'], act: [] },
    { id: 'sentinel', name: 'The Sentinel', role: 'Gate keeper', kind: 'golem', x: 2500, y: 1044, lines: ['Beyond this gate lies the Tower of Oblivion. One hundred floors. Ten fiends. Are you ready?', 'The Tower remembers your best floor. Go back for better grades whenever you like.'], act: [['tower', 'Enter the Tower']] },
  ];
  /* the town upgrades the workshop sells: a flag each in st.hub.up; the greenhouse grows the town's crops half again as
     fast (growFarm, 04-state) and stands on the farm; the others mark their building (the core passes o.flag to its draw) */
  const UPGRADES = [
    { id: 'greenhouse', name: 'Greenhouse', desc: 'A glass house on the farm. The town\'s crops grow half again as fast.', cost: { c: 1500 } },
    { id: 'dojo', name: 'Dojo expansion', desc: 'A bigger courtyard, new targets and banners for the Training Grounds.', cost: { c: 1200 } },
    { id: 'shrine', name: 'Restored shrines', desc: 'The sanctuary\'s shrines regain their carvings and their crystal light.', cost: { cr: 300 } },
    { id: 'porch', name: 'Expanded porch', desc: 'A wider porch with a swing seat and more flower boxes for the cottage.', cost: { c: 800 } },
    { id: 'workshop', name: 'Better workshop', desc: 'A second bench, more tools and a brighter hearth.', cost: { c: 1000 } },
  ];
  const FLAG_OF = { cottage: 'porch', dojo: 'dojo', shrineL: 'shrine', shrineR: 'shrine', workshop: 'workshop' };
  const LOOKOUT_GIFT = 'saturn_lamp';
  let core = null, places = [], plotEnts = [], npcEnts = [], fx = [], rest = null, greenhouse = null, cookTold = '', lastPet = 0, talkIdx = {}, geo = null;

  /* ---- small helpers: the core's API when it is there, the game's own functions otherwise ---- */
  const has = k => !!(core && typeof core[k] === 'function');
  const say = (msg, ms) => { if (has('toast')) core.toast(msg, ms); else if (typeof toast === 'function') toast(msg, ms); };
  const overlay = fn => { if (has('openOverlay')) core.openOverlay(fn); else fn(); };
  const petPos = () => has('pet') ? core.pet() : { x: hub().x, y: hub().y };
  const heartsAt = (x, y) => { if (has('emitHearts')) core.emitHearts(x, y); };
  const hop = () => { if (has('hop')) core.hop(); };
  const snd = n => { try { if (typeof sfx !== 'undefined' && sfx[n]) sfx[n](); } catch (e) {} };
  const save = () => { if (typeof saveSoon === 'function') saveSoon(); };
  const hud = () => { if (typeof updateHud === 'function') updateHud(); };
  const hub = () => { if (!st.hub) st.hub = newHub(); if (!Array.isArray(st.hub.plots) || st.hub.plots.length !== 6) st.hub.plots = newPlots(); if (!st.hub.up) st.hub.up = {}; if (!st.hub.found) st.hub.found = {}; if (!st.hub.seeds) st.hub.seeds = {}; return st.hub; };
  const building = id => HUB.buildings.find(b => b.id === id);
  const doorOf = b => b.door ? { x: b.door[0], y: b.door[1] } : { x: b.x, y: b.y + 12 };
  const fast = () => !!(st && st.fast);
  const pip = (x, y, poly) => { let inside = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside; } return inside; };
  const lvAt = (x, y) => { let lv = 0; for (const T of HUB.terraces) if (pip(x, y, T.poly)) lv = Math.max(lv, T.lv); return lv; };
  const sheet = (kind, html) => { if (typeof openSheet === 'function') overlay(() => openSheet(kind, html)); };
  const kindIs = k => typeof sheetKind !== 'undefined' && sheetKind === k;
  const closeIt = () => { if (typeof closeSheet === 'function') closeSheet(); };
  /* a screen of the game's, if this build has it (a ReferenceError means the function is gone: say so, never throw) */
  const call = fn => { try { return fn(); } catch (e) { if (e instanceof ReferenceError) { say('That is not open yet'); return null; } throw e; } };
  const leftText = secs => secs >= 60 ? `${Math.ceil(secs / 60)} min` : `${Math.max(1, Math.ceil(secs))} s`;
  const num = n => (typeof fmtNum === 'function' ? fmtNum(n) : String(Math.floor(n)));
  const E = s => (typeof esc === 'function' ? esc(s) : String(s));
  const I = k => (typeof ICON !== 'undefined' && ICON[k]) || '';
  const effect = k => (typeof foodEffect === 'function' ? foodEffect(k) : '');

  /* ---- floating numbers and sparkles over a plot or the pet, drawn as depth entities for a second ---- */
  function burst(x, y, lv, text, col) {
    const e = { x, y: y + 0.5, lv: lv || 0, w: 0, d: 0, top: 90, kind: 'fx', age: 0, life: 1.3, text, col: col || '#FFE37A',
      draw(c, X, Y, k) { const u = this.age / this.life, a = u < 0.75 ? 1 : 1 - (u - 0.75) / 0.25; c.save(); c.globalAlpha = Math.max(0, a);
        for (let i = 0; i < 7; i++) { const ang = i * 0.9 + 0.4, r = (12 + 34 * Math.sqrt(u)) * k, px = X + Math.cos(ang) * r * (i % 2 ? 1.2 : 0.8), py = Y - 30 * k - Math.sin(ang) * r * 0.7 - 20 * u * k, s = (3 - 2 * u) * k; c.fillStyle = i % 2 ? '#FFFFFF' : this.col; c.beginPath(); c.moveTo(px, py - s); c.lineTo(px + s * 0.5, py); c.lineTo(px, py + s); c.lineTo(px - s * 0.5, py); c.closePath(); c.fill(); }
        if (this.text) { c.font = `800 ${Math.round(15 * k)}px system-ui, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineWidth = 4 * k; c.lineJoin = 'round'; c.strokeStyle = 'rgba(43,36,51,.85)'; const ty = Y - (46 + 28 * u) * k; c.strokeText(this.text, X, ty); c.fillStyle = '#FFFDF8'; c.fillText(this.text, X, ty); }
        c.restore(); } };
    fx.push(e); if (fx.length > 12) fx.shift();
  }

  /* ---- the farm in town: six plots in st.hub.plots, grown by growFarm (04-state) like the farm room's ---- */
  const stageOf = q => (typeof cropStage === 'function' ? cropStage(q) : (!q.crop ? -1 : q.g >= CROPS[q.crop].hours ? 3 : Math.min(2, Math.floor(q.g / CROPS[q.crop].hours * 3))));
  const waitText = h => (typeof fmtWait === 'function' ? fmtWait(h) : `${Math.ceil(h * 60)} min`);
  function plotPrompt(i) {
    const q = hub().plots[i], sg = stageOf(q);
    if (sg < 0) return 'Plant';
    const c = CROPS[q.crop];
    if (sg === 3) return `Harvest ${c.name.toLowerCase()}`;
    if (!q.water) return `Water the ${c.name.toLowerCase()}`;
    return `${c.name} · ${waitText((c.hours - q.g) / 2)}`;
  }
  function plotOpen(i) {
    const q = hub().plots[i], sg = stageOf(q), [px, py] = HUB.plots[i];
    if (sg < 0) { openSeeds(i); return; }
    const c = CROPS[q.crop];
    if (sg === 3) { harvestPlot(i); return; }
    const left = (c.hours - q.g) / (q.water ? 2 : 1);
    if (!q.water) { q.water = true; snd('splash'); burst(px, py, 0, '', '#7FD3F2'); say(`Watered! ${c.name} grow twice as fast now: ready in ${waitText(left / 2)}.`, 3200); save(); return; }
    say(`${c.name} ready in ${waitText(left)}`);
  }
  function harvestPlot(i) {
    const q = hub().plots[i], c = CROPS[q.crop], k = q.crop, [px, py] = HUB.plots[i];
    st.pantry[k] = Math.min(999, (st.pantry[k] || 0) + c.yield);
    burst(px, py, 0, `+${c.yield}`); snd('sparkle');
    if (typeof addXP === 'function') addXP(3);
    q.crop = null; q.g = 0; q.water = false;
    say(`+${c.yield} ${c.name.toLowerCase()} went to the pantry. ${st.tips && st.tips.hubCook ? '' : 'Cook them at the kitchen, or feed them from the Feed tray.'}`, 3400);
    if (st.tips) st.tips.hubCook = true;
    save(); hud();
  }
  function plantPlot(i, k) {
    const c = CROPS[k], q = hub().plots[i], h = hub(), [px, py] = HUB.plots[i];
    if (!c || !q || q.crop) { closeIt(); return; }
    if (h.seeds[k] > 0) { h.seeds[k]--; if (!h.seeds[k]) delete h.seeds[k]; }
    else if (st.coins < c.seed) { say(`${c.name} seeds cost ${c.seed} coins. Games and adventures earn coins.`); snd('wrong'); return; }
    else { st.coins -= c.seed; hud(); }
    q.crop = k; q.g = 0; q.water = false;
    closeIt(); snd('dig'); burst(px, py, 0, '', '#C48A52');
    if (typeof doneTip === 'function') doneTip('farm');
    say(`${c.name} planted. Water the plot and they grow twice as fast.`);
    save();
  }
  function openSeeds(i) {
    const h = hub();
    const tiles = Object.keys(CROPS).map(k => { const c = CROPS[k], sn = SNACKS[k], own = h.seeds[k] || 0, cant = !own && st.coins < c.seed; return `<button class="tile seed${cant ? ' cant' : ''}" type="button" data-hub="plant" data-i="${i}" data-k="${k}">${SNACK_SVG[k]}<b>${E(c.name)}</b><small>${own ? `${own} seed${own > 1 ? 's' : ''} owned` : `${I('coin')}${c.seed}`} · ${waitText(c.hours)}</small><small>+${sn.xp} bond</small></button>`; }).join('');
    sheet('hub-plot', `<p class="eyebrow">Sunberry Farm · plot ${i + 1}</p><h2 class="title" id="sheetTitle">Plant a seed</h2>
      <p class="note">Crops grow in real time, even while the app is closed. Water them to grow twice as fast${h.up.greenhouse ? ', and the greenhouse adds half again' : ''}. Seeds you own are used first; otherwise one is bought on the spot.</p>
      <div class="tiles four">${tiles}</div>`);
  }
  /* the shed: buy seeds ahead (st.hub.seeds), see what the pantry holds */
  function openShed() {
    const h = hub();
    const rows = Object.keys(CROPS).map(k => { const c = CROPS[k], own = h.seeds[k] || 0; const btn = n => `<button class="btn small" type="button" data-hub="seed" data-k="${k}" data-n="${n}"${st.coins < c.seed * n ? ' aria-disabled="true"' : ''}>×${n} ${I('coin')}${c.seed * n}</button>`; return `<div class="shop-row"><span class="shop-ic">${SNACK_SVG[k]}</span><span class="shop-copy"><b>${E(c.name)} seeds</b><small>Grows in ${waitText(c.hours)} · ${c.yield} per harvest · +${SNACKS[k].xp} bond each</small><small class="shop-have">${own ? `${own} seed${own > 1 ? 's' : ''} in the shed` : 'None in the shed'} · ${st.pantry[k] || 0} in the pantry</small></span><span class="shop-buy">${btn(1)}${btn(5)}</span></div>`; }).join('');
    const planted = h.plots.filter(p => p.crop).length, ready = h.plots.filter(p => stageOf(p) === 3).length;
    sheet('hub-shed', `<p class="eyebrow">Sunberry Farm</p><h2 class="title" id="sheetTitle">Tool shed</h2>
      <div class="shop-wallet"><span>${I('coin')}${num(st.coins)}</span><span>${I('sprout')}${planted}/6 planted</span><span>${I('star')}${ready} ready</span></div>
      <p class="note">Seeds go in the shed and are used when you plant. Walk up to a plot to plant, water or harvest; harvests go to the pantry, and the kitchen turns them into the foods that level pets.${h.up.greenhouse ? ' The greenhouse is up: everything grows half again as fast.' : ' A greenhouse from the workshop would make everything grow half again as fast.'}</p>
      <div class="shop-list">${rows}</div>`);
  }
  function buySeeds(k, n) {
    const c = CROPS[k]; if (!c) return; n = Math.max(1, Math.min(20, n | 0 || 1));
    const cost = c.seed * n;
    if (st.coins < cost) { snd('wrong'); say(`${n} ${c.name.toLowerCase()} seeds cost ${cost} coins. You have ${num(st.coins)}.`); return; }
    st.coins -= cost; const h = hub(); h.seeds[k] = Math.min(99, (h.seeds[k] || 0) + n);
    snd('coin'); say(`${n} ${c.name.toLowerCase()} seed${n > 1 ? 's' : ''} put in the shed`); hud(); save(); if (kindIs('hub-shed')) openShed();
  }

  /* ---- the kitchen: cook a recipe from the pantry, come back for the dish (st.hub.cook = { recipe, at }) ---- */
  const cookSecs = r => r.secs / (fast() ? 10 : 1);
  const cookLeft = () => { const h = hub(); if (!h.cook || !RECIPES[h.cook.recipe]) return 0; return Math.max(0, cookSecs(RECIPES[h.cook.recipe]) - (Date.now() - h.cook.at) / 1000); };
  const canCook = r => Object.keys(r.in).every(k => (st.pantry[k] || 0) >= r.in[k]);
  function kitchenPrompt() {
    const h = hub(); if (!h.cook || !RECIPES[h.cook.recipe]) return 'Cook';
    const left = cookLeft(); return left > 0 ? `Cooking · ${leftText(left)}` : `Collect ${RECIPES[h.cook.recipe].name.toLowerCase()}`;
  }
  function startCook(id) {
    const r = RECIPES[id], h = hub(); if (!r) return;
    if (h.cook) { say('Something is already on the stove. Collect it first.'); snd('wrong'); return; }
    if (!canCook(r)) { say(`Not enough in the pantry for ${r.name.toLowerCase()}. Harvest more or buy crops at the market.`); snd('wrong'); return; }
    for (const k in r.in) { st.pantry[k] -= r.in[k]; if (!st.pantry[k]) delete st.pantry[k]; }
    h.cook = { recipe: id, at: Date.now() }; cookTold = '';
    snd('pop'); say(`${r.name} is cooking: ready in ${leftText(cookSecs(r))}. Walk about and come back.`, 3200);
    save(); if (kindIs('hub-kitchen')) openKitchen();
  }
  function collectCook() {
    const h = hub(), r = h.cook && RECIPES[h.cook.recipe]; if (!r) return false;
    if (cookLeft() > 0) { say(`${r.name} needs ${leftText(cookLeft())} more`); return false; }
    const [k, n] = r.out; st.pantry[k] = Math.min(999, (st.pantry[k] || 0) + n); h.cook = null;
    const d = doorOf(building('kitchen')); burst(d.x, d.y, 0, `+${n}`); snd('sparkle');
    if (typeof addXP === 'function') addXP(4);
    say(`${r.name} done: ${n} ${SNACKS[k].name.toLowerCase()} in the pantry (${effect(k)} each). Feed it from the Feed tray, or to any pet from Team.`, 4200);
    save(); hud(); if (kindIs('hub-kitchen')) openKitchen(); return true;
  }
  function openKitchen() {
    const h = hub(), cur = h.cook && RECIPES[h.cook.recipe];
    let top = '';
    if (cur) { const left = cookLeft(), tot = cookSecs(cur), u = 1 - left / tot; top = `<div class="shop-row hub-cooking"><span class="shop-ic">${SNACK_SVG[cur.out[0]]}</span><span class="shop-copy"><b>${E(cur.name)} ${left > 0 ? 'is cooking' : 'is ready'}</b><small>${E(cur.line)}</small><span class="bar fp-bar"><i style="width:${(u * 100).toFixed(1)}%"></i></span><small class="shop-have hub-cook-left">${left > 0 ? `Ready in ${leftText(left)}` : 'Done'}</small></span><span class="shop-buy">${left > 0 ? '' : `<button class="btn small primary" type="button" data-hub="collect">Collect</button>`}</span></div>`; }
    const rows = RECIPE_ORDER.map(id => { const r = RECIPES[id], ok = canCook(r), [ok0, n0] = r.out; const ing = Object.keys(r.in).map(k => `<i class="hub-ing${(st.pantry[k] || 0) >= r.in[k] ? ' ok' : ''}">${SNACK_SVG[k]}${st.pantry[k] || 0}/${r.in[k]}</i>`).join(''); return `<div class="shop-row"><span class="shop-ic">${SNACK_SVG[ok0]}</span><span class="shop-copy"><b>${E(r.name)}</b><small>${E(r.line)} · makes ${n0} ${E(SNACKS[ok0].name.toLowerCase())}: ${E(effect(ok0))}</small><small class="shop-have hub-ings">${ing} · ${leftText(cookSecs(r))}</small></span><span class="shop-buy"><button class="btn small${ok && !cur ? ' primary' : ''}" type="button" data-hub="cook" data-k="${id}"${ok && !cur ? '' : ' aria-disabled="true"'}>Cook</button></span></div>`; }).join('');
    const have = Object.keys(CROPS).map(k => `<span>${SNACK_SVG[k]}${st.pantry[k] || 0}</span>`).join('');
    sheet('hub-kitchen', `<p class="eyebrow">Market &amp; Kitchen</p><h2 class="title" id="sheetTitle">Kitchen</h2>
      <div class="shop-wallet hub-pantry">${have}</div>
      ${top}
      <p class="note">Each dish turns harvests into the foods that level pets and deepen their bond: start one, walk about town, and collect it when it is done. The pantry's crops come from the farm, the market stall and what Tower monsters drop.</p>
      <div class="shop-list">${rows}</div>`);
    if (typeof sheetTimer !== 'undefined') { clearInterval(sheetTimer); sheetTimer = setInterval(() => { if (!kindIs('hub-kitchen')) { clearInterval(sheetTimer); return; } const el = sheetEl.querySelector('.hub-cook-left'); if (!el) return; const left = cookLeft(); if (left > 0) el.textContent = `Ready in ${leftText(left)}`; else openKitchen(); }, 1000); }
  }

  /* ---- the workshop: decorating, and the town upgrades ---- */
  const costText = c => c.cr ? `${I('crystal')}${c.cr}` : c.p ? `${I('pearl')}${c.p}` : `${I('coin')}${c.c}`;
  const canPay = c => c.cr ? (st.crystals || 0) >= c.cr : c.p ? st.pearls >= c.p : st.coins >= c.c;
  function openWorkshop() {
    const h = hub();
    const rows = UPGRADES.map(u => { const got = !!h.up[u.id]; return `<div class="shop-row"><span class="shop-ic">${I(u.id === 'greenhouse' ? 'sprout' : u.id === 'dojo' ? 'sword' : u.id === 'shrine' ? 'crystal' : u.id === 'porch' ? 'house' : 'wrench')}</span><span class="shop-copy"><b>${E(u.name)}</b><small>${E(u.desc)}</small></span><span class="shop-buy">${got ? '<span class="mc-state done">Built</span>' : `<button class="btn small${canPay(u.cost) ? ' primary' : ''}" type="button" data-hub="up" data-k="${u.id}"${canPay(u.cost) ? '' : ' aria-disabled="true"'}>${costText(u.cost)}</button>`}</span></div>`; }).join('');
    sheet('hub-work', `<p class="eyebrow">Workshop</p><h2 class="title" id="sheetTitle">Workshop</h2>
      <div class="shop-wallet"><span>${I('coin')}${num(st.coins)}</span><span>${I('crystal')}${num(st.crystals || 0)}</span><span>${I('pearl')}${num(st.pearls || 0)}</span></div>
      <div class="evo-actions"><button class="btn primary" type="button" data-hub="decor">${I('brush')}Decorate the house</button><button class="btn" type="button" data-hub="mansion">${I('mansion')}Rooms and building</button></div>
      <h3 class="sec">Town upgrades</h3>
      <p class="note">Built once, kept for good. The greenhouse speeds the farm; the rest change their building.</p>
      <div class="shop-list">${rows}</div>`);
  }
  function buyUpgrade(id) {
    const u = UPGRADES.find(x => x.id === id), h = hub(); if (!u || h.up[id]) return;
    if (!canPay(u.cost)) { snd('wrong'); say(`${u.name} costs ${u.cost.cr ? `${u.cost.cr} crystals` : u.cost.p ? `${u.cost.p} pearls` : `${u.cost.c} coins`}.`); return; }
    if (u.cost.cr) st.crystals -= u.cost.cr; else if (u.cost.p) st.pearls -= u.cost.p; else st.coins -= u.cost.c;
    h.up[id] = 1; snd('sparkle');
    if (id === 'greenhouse') { greenhouse = makeGreenhouse(); say('The greenhouse is up on the farm! The town\'s crops grow half again as fast.', 3600); }
    else say(`${u.name}: built!`, 3000);
    hud(); save(); if (kindIs('hub-work')) openWorkshop();
  }
  function decorate() { overlay(() => { if (has('openHouse')) core.openHouse(); if (typeof enterDecor === 'function') setTimeout(() => { try { enterDecor(); } catch (e) {} }, 60); }); }

  /* ---- the dojo and the sanctuary: small choosers in front of the existing screens ---- */
  function openDojo() {
    const h = hub();
    sheet('hub-dojo', `<p class="eyebrow">Training Grounds${h.up.dojo ? ' · expanded' : ''}</p><h2 class="title" id="sheetTitle">Dojo</h2>
      <p class="note">Train the party: pick who fights, feed them for levels, equip accessories. Skills are the ability cards each pet carries into the Tower.</p>
      <div class="evo-actions"><button class="btn primary" type="button" data-hub="go" data-k="team">${I('team')}Training</button><button class="btn" type="button" data-hub="go" data-k="cards">${I('cards')}Skills</button></div>`);
  }
  function openAltar() {
    sheet('hub-altar', `<p class="eyebrow">Elemental Sanctuary</p><h2 class="title" id="sheetTitle">The altar</h2>
      <p class="note">Where a pet takes its next form. Evolution needs bond, a gemstone and crystals; the Laboratory fuses pets and sells Fusion Stones. The shrines either side hold fusion and the Animas.</p>
      <div class="evo-actions"><button class="btn primary" type="button" data-hub="go" data-k="evolve">${I('sparkle')}Evolve</button><button class="btn" type="button" data-hub="go" data-k="lab">${I('flask')}Laboratory</button></div>`);
  }

  /* ---- the townsfolk's talk, ported from Pocket Town's cards ---- */
  function talk(n) {
    const i = (talkIdx[n.id] || 0) % n.lines.length; talkIdx[n.id] = i + 1;
    const acts = n.act.map(([k, label]) => `<button class="btn${k === 'tower' || k === 'summon' ? ' primary' : ''}" type="button" data-hub="go" data-k="${k}">${label}</button>`).join('');
    sheet('hub-npc', `<div class="mc-head town-head"><canvas class="npc-face" width="96" height="96" data-npc="${n.id}"></canvas><div><p class="eyebrow">${E(n.role)}</p><h2 class="title" id="sheetTitle">${E(n.name)}</h2></div></div>
      <p class="mc-goal town-line">"${E(n.lines[i])}"</p>
      <div class="mc-row town-acts">${acts}<button class="btn" type="button" data-sheet-close>${n.lines.length > 1 ? 'Goodbye' : 'OK'}</button></div>`);
    try { const cv = sheetEl.querySelector('.npc-face'); if (cv && typeof TownArt !== 'undefined') { const c = cv.getContext('2d'), sp = TownArt.npc(n.kind, false); c.drawImage(sp.cv, 0, 0, sp.cv.width, sp.cv.height, -8, 4, 112, 122); } } catch (e) {}
    snd('boop');
  }
  /* what the buttons do (the sheet's own handler forwards data-hub clicks here) */
  function go(k) {
    const run = fn => { closeIt(); overlay(fn); };
    switch (k) {
      case 'summon': run(() => call(() => openSummon())); break;
      case 'crystals': run(() => call(() => openCrystalShop())); break;
      case 'pearls': run(() => call(() => openPearlShop())); break;
      case 'gift': run(() => call(() => openGiftShop())); break;
      case 'cards': run(() => call(() => openCards('normal'))); break;
      case 'fusion': run(() => call(() => openFusion())); break;
      case 'stones': run(() => call(() => openLaboratory('shop'))); break;
      case 'lab': run(() => call(() => openLaboratory('fuse'))); break;
      case 'team': run(() => call(() => openTeam())); break;
      case 'evolve': run(() => call(() => openCard())); break;
      case 'shop': run(() => call(() => openShop())); break;
      case 'animas': run(() => call(() => openAnimas())); break;
      case 'mansion': run(() => call(() => openMansion())); break;
      case 'tower': run(() => { call(() => { openMap(); setMapTab('dungeon'); }); }); break;
      case 'rift': run(() => { call(() => { openMap(); setMapTab('rift'); }); }); break;
      case 'decor': closeIt(); decorate(); break;
      default: break;
    }
  }
  function openGame(key) {
    overlay(() => {
      if (has('openStage')) { core.openStage(key); return; }
      // without the core's stage flow: the Adventure map with Pocket Town's stage list for that house
      call(() => openMap());
      const b = typeof TOWN_BUILDINGS !== 'undefined' && TOWN_BUILDINGS.find(x => x.key === key);
      if (b && typeof townBuildingCard === 'function') townBuildingCard(b);
    });
  }
  const gamePrompt = key => { const W = typeof WORLDS !== 'undefined' && WORLDS.find(w => w.key === key); const name = GAME_NAMES[key] || key; if (W && typeof worldOpen === 'function' && !worldOpen(W.id)) return `${name} · ${W.gate} ★ to open`; return `Enter ${name}`; };

  /* ---- the scenic spots: a find at the lookout, a pearl a day in the hidden garden, resting places where the pets settle ---- */
  function lookout() {
    const h = hub(), p = petPos();
    if (!h.found.lookout) { h.found.lookout = 1; if (ITEMS && ITEMS[LOOKOUT_GIFT]) { st.inv[LOOKOUT_GIFT] = (st.inv[LOOKOUT_GIFT] || 0) + 1; say(`From up here you can see the whole town. Tucked behind the telescope: a ${ITEMS[LOOKOUT_GIFT].name}! It's in your furniture drawer.`, 4200); } else say('From up here you can see the whole town.', 3000); snd('sparkle'); burst(2330, 282, 2, '', '#FFE37A'); heartsAt(p.x, p.y - 40); save(); return; }
    const n = (typeof partyPets === 'function' ? partyPets().length : 1);
    say(n > 1 ? `The whole town below you. ${st.name} and the others line up along the rail to look.` : `The whole town below you. ${st.name} leans on the rail beside you.`, 3200);
    rest = { kind: 'watch', x: 2330, y: 300, lv: 2, until: Date.now() + 8000 };
  }
  function hiddenGarden() {
    const h = hub(), today = (typeof dayKey === 'function' ? dayKey(Date.now()) : String(Math.floor(Date.now() / 864e5))), p = petPos();
    if (h.pearlDay !== today) { h.pearlDay = today; if (typeof addPearls === 'function') addPearls(1); else st.pearls += 1; snd('sparkle'); burst(330, 822, 0, '+1', '#F4F7FF'); say('A pearl glints among the flowers. +1 pearl. Another grows here tomorrow.', 3400); if (!h.found.hidden) h.found.hidden = 1; save(); heartsAt(p.x, p.y - 40); return; }
    say(`The hidden garden hums with bees. ${st.name} sniffs every flower in turn. Come back tomorrow for another pearl.`, 3200);
    rest = { kind: 'sniff', x: 330, y: 836, lv: 0, until: Date.now() + 6000 };
  }
  function restAt(kind, x, y, lv, msg) {
    rest = { kind, x, y, lv: lv || 0, until: Date.now() + 9000 };
    st.joy = Math.min(100, st.joy + 3); const p = petPos(); heartsAt(p.x, p.y - 40); snd('chirp');
    say(msg, 3200); hud();
  }

  /* ---- the entities only this file knows: plots, townsfolk, the greenhouse, the numbers ---- */
  function fallbackPlot(c, X, Y, k, o) {
    const w = 90 * k, d = 70 * k; c.save(); c.globalAlpha = o.fade == null ? 1 : o.fade;
    c.fillStyle = o.wet ? '#5E4027' : '#7E5A3A'; c.strokeStyle = '#2B2433'; c.lineWidth = 2 * k; c.beginPath(); c.moveTo(X - w / 2, Y); c.lineTo(X + w / 2, Y); c.lineTo(X + w / 2 - 8 * k, Y - d); c.lineTo(X - w / 2 + 8 * k, Y - d); c.closePath(); c.fill(); c.stroke();
    c.strokeStyle = o.wet ? '#46301D' : '#664629'; c.lineWidth = 3 * k; for (let r = 1; r <= 3; r++) { const yy = Y - d * r / 4; c.beginPath(); c.moveTo(X - w / 2 + 14 * k, yy); c.lineTo(X + w / 2 - 14 * k, yy); c.stroke(); }
    if (o.stage >= 0) { const h = [8, 16, 24, 26][o.stage] * k; c.strokeStyle = '#4FA35E'; c.lineWidth = 2.5 * k; for (let i = 0; i < 3; i++) { const px = X - 26 * k + i * 26 * k, py = Y - d * 0.5; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py - h); c.stroke(); c.fillStyle = o.stage === 3 ? '#FF9F43' : '#6CC15A'; c.beginPath(); c.ellipse(px, py - h, (5 + o.stage * 2) * k, (4 + o.stage * 2) * k, 0, 0, 6.283); c.fill(); } }
    c.restore();
  }
  function makePlot(i) {
    const [x, y] = HUB.plots[i], inner = geo ? geo.make({ kind: 'plot', x, y, w: 90, d: 70 }) : null;
    return { x, y, w: 90, d: 70, top: inner && inner.top || 60, lv: 0, kind: 'plot', plot: i, door: null,
      draw(c, X, Y, k, t, o) {
        const q = hub().plots[i], sg = stageOf(q), oo = Object.assign({}, o || {}, { stage: sg, wet: !!q.water && sg < 3, crop: q.crop, ready: sg === 3 });
        if (inner) inner.draw(c, X, Y, k, t, oo); else fallbackPlot(c, X, Y, k, oo);
        // the live markers: a bobbing star when ready, a drop when thirsty
        if (sg === 3) { const by = Y - (60 + Math.sin(t * 3 + i) * 4) * k; c.save(); c.fillStyle = '#FFE37A'; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5 * k; c.beginPath(); for (let j = 0; j < 10; j++) { const r = (j % 2 ? 4 : 9) * k, a = -Math.PI / 2 + j * Math.PI / 5; j ? c.lineTo(X + Math.cos(a) * r, by + Math.sin(a) * r) : c.moveTo(X + Math.cos(a) * r, by + Math.sin(a) * r); } c.closePath(); c.fill(); c.stroke(); c.restore(); }
        else if (sg >= 0 && !q.water) { const by = Y - 58 * k; c.save(); c.fillStyle = '#FFFDF8'; c.strokeStyle = '#2B2433'; c.lineWidth = 1.5 * k; c.beginPath(); c.arc(X + 30 * k, by, 9 * k, 0, 6.283); c.fill(); c.stroke(); c.fillStyle = '#6FCBE3'; c.beginPath(); c.moveTo(X + 30 * k, by - 6 * k); c.quadraticCurveTo(X + 35 * k, by + 1 * k, X + 30 * k, by + 5 * k); c.quadraticCurveTo(X + 25 * k, by + 1 * k, X + 30 * k, by - 6 * k); c.fill(); c.restore(); }
      } };
  }
  function npcPos(n) { if (n.x != null) return { x: n.x, y: n.y }; const b = building(n.at); return b ? { x: b.x + b.w / 2 + 26, y: b.y + 2 } : { x: 1300, y: 1000 }; }
  function makeNpc(n) {
    const p = npcPos(n);
    return { id: n.id, x: p.x, y: p.y, w: 28, d: 14, top: 64, lv: lvAt(p.x, p.y), kind: 'npc', npc: n, door: null,   // (id: the core's say() bubbles find the NPC by it)
      draw(c, X, Y, k, t, o) {
        const me = petPos(), face = me.x < p.x ? -1 : 1, bob = Math.sin(t * 2.2 + p.x) * 1.5 * k, blink = ((t * 0.37 + p.x * 0.01) % 3.1) < 0.12;
        c.save(); if (o && o.fade != null && o.fade < 1) c.globalAlpha = o.fade;
        c.fillStyle = 'rgba(0,0,0,.2)'; c.beginPath(); c.ellipse(X, Y + 2 * k, 18 * k, 7 * k, 0, 0, 6.283); c.fill();
        if (typeof TownArt !== 'undefined') { const sp = TownArt.npc(n.kind, blink), s = k / TownArt.K; c.translate(X, Y - bob); c.scale(face, 1); c.drawImage(sp.cv, -sp.ax * s, -sp.ay * s, sp.cv.width * s, sp.cv.height * s); }
        else { c.fillStyle = '#C9B8E8'; c.strokeStyle = '#2B2433'; c.lineWidth = 2 * k; c.beginPath(); c.ellipse(X, Y - 26 * k - bob, 16 * k, 26 * k, 0, 0, 6.283); c.fill(); c.stroke(); }
        c.restore();
      } };
  }
  function makeGreenhouse() {
    const g = HUB.greenhouseSite, inner = geo ? geo.make({ kind: 'greenhouse', x: g.x, y: g.y, w: g.w, d: g.d, face: 's' }) : null;
    return { x: g.x, y: g.y, w: g.w, d: g.d, top: inner && inner.top || 140, lv: 0, kind: 'greenhouse', door: null,
      draw(c, X, Y, k, t, o) { if (inner) { inner.draw(c, X, Y, k, t, o); return; } const w = g.w * k, h = 110 * k; c.save(); c.globalAlpha = (o && o.fade != null ? o.fade : 1) * 0.85; c.fillStyle = '#CFEFF7'; c.strokeStyle = '#2B2433'; c.lineWidth = 2 * k; c.beginPath(); c.moveTo(X - w / 2, Y); c.lineTo(X - w / 2, Y - h * 0.55); c.lineTo(X, Y - h); c.lineTo(X + w / 2, Y - h * 0.55); c.lineTo(X + w / 2, Y); c.closePath(); c.fill(); c.stroke(); c.restore(); } };
  }

  /* ---- the list of places: built once, prompts read live state ---- */
  function buildPlaces() {
    const P = [];
    const door = (id, r, icon, prompt, open) => { const b = building(id); if (!b) return; const d = doorOf(b); P.push({ id, x: d.x, y: d.y, r: r || 60, lv: lvAt(b.x, b.y - 1), icon, prompt, open }); };
    door('cottage', 64, 'door', () => 'Go inside', () => { if (has('openHouse')) core.openHouse(); else call(() => openHouse()); });
    door('shed', 60, 'leaf', () => 'Seeds & tools', openShed);
    door('dojo', 64, 'sword', () => 'Train', openDojo);
    door('altar', 64, 'gem', () => 'Evolve & ascend', openAltar);
    door('shrineL', 60, 'gem', () => 'Fusion shrine', () => overlay(() => call(() => openFusion())));
    door('shrineR', 60, 'gem', () => 'Anima shrine', () => overlay(() => call(() => openAnimas())));
    door('kitchen', 64, 'pot', kitchenPrompt, openKitchen);
    door('stallD', 60, 'coin', () => 'Shop', () => overlay(() => call(() => openShop())));
    door('workshop', 64, 'hammer', () => 'Workshop', openWorkshop);
    door('gate', 70, 'gate', () => 'To the Tower', () => go('tower'));
    door('riftgate', 70, 'gate', () => 'To the Rifts', () => go('rift'));
    HUB.buildings.filter(b => b.game).forEach(b => door(b.id, 60, 'game', () => gamePrompt(b.game), () => openGame(b.game)));
    // the townsfolk: at their stall's door, or where they stand
    NPCS.forEach(n => { const b = n.at && building(n.at), at = b ? doorOf(b) : npcPos(n); P.push({ id: 'npc-' + n.id, x: at.x, y: at.y + (b ? 0 : 10), r: 70, lv: lvAt(at.x, at.y), icon: n.act.length ? (n.act[0][0] === 'tower' ? 'gate' : 'coin') : 'star', prompt: () => `Talk to ${n.name}`, open: () => talk(n) }); });
    // the training dummies: skills
    P.push({ id: 'dummies', x: 2100, y: 1076, r: 56, lv: 1, icon: 'sword', prompt: () => 'Practise skills', open: () => overlay(() => call(() => openCards('normal'))) });
    // the farm plots: the spot is just south of the bed
    HUB.plots.forEach(([x, y], i) => P.push({ id: 'plot' + i, x, y: y + 16, r: 70, lv: 0, icon: 'leaf', prompt: () => plotPrompt(i), open: () => plotOpen(i) }));
    // the scenic spots
    const spot = id => HUB.spots.find(s => s.id === id) || { x: 0, y: 0 };
    const L = spot('lookout'), Hd = spot('hidden'), R = spot('reading'), D = spot('dockend'), T = spot('hideaway');
    P.push({ id: 'lookout', x: L.x, y: L.y + 20, r: 64, lv: 2, icon: 'star', prompt: () => hub().found.lookout ? 'Enjoy the view' : 'Look out', open: lookout });
    P.push({ id: 'hidden', x: Hd.x, y: Hd.y + 20, r: 64, lv: 0, icon: 'star', prompt: () => hub().pearlDay === (typeof dayKey === 'function' ? dayKey(Date.now()) : '') ? 'Smell the flowers' : 'Look among the flowers', open: hiddenGarden });
    P.push({ id: 'reading', x: R.x, y: R.y + 14, r: 60, lv: 0, icon: 'star', prompt: () => 'Sit and read', open: () => restAt('sit', R.x, R.y + 6, 0, `You sit down with a book. ${st.name} hops up beside you and watches the river go by.`) });
    P.push({ id: 'dockend', x: D.x, y: D.y, r: 60, lv: 0, icon: 'star', prompt: () => 'Watch the stream', open: () => restAt('watch', D.x, D.y + 4, 0, `The stream slips under the dock. ${st.name} watches the fish flicker past.`) });
    P.push({ id: 'hideaway', x: T.x, y: T.y + 10, r: 60, lv: 0, icon: 'star', prompt: () => 'Curl up', open: () => restAt('curl', T.x, T.y + 6, 0, `A sleepy curl in the shade of the big tree. ${st.name} yawns and tucks in.`) });
    return P;
  }

  /* ---- the sheets' buttons ---- */
  function onSheetClick(e) {
    const b = e.target.closest('[data-hub]'); if (!b || !st) return;
    const k = b.dataset.hub; if (typeof sfx !== 'undefined' && sfx.unlock) sfx.unlock();
    if (b.getAttribute('aria-disabled') === 'true') { snd('wrong'); return; }
    if (k === 'go') go(b.dataset.k);
    else if (k === 'plant') plantPlot(+b.dataset.i, b.dataset.k);
    else if (k === 'seed') buySeeds(b.dataset.k, +b.dataset.n);
    else if (k === 'cook') startCook(b.dataset.k);
    else if (k === 'collect') collectCook();
    else if (k === 'up') buyUpgrade(b.dataset.k);
    else if (k === 'decor') { closeIt(); decorate(); }
    else if (k === 'mansion') go('mansion');
  }
  if (typeof sheetWrap !== 'undefined' && sheetWrap) sheetWrap.addEventListener('click', onSheetClick);
  /* the few styles these sheets need beyond the shop's (kept here so styles.css stays the core's) */
  try { const css = document.createElement('style'); css.id = 'hubFacCss'; css.textContent = '.hub-ings{display:inline-flex;flex-wrap:wrap;align-items:center;gap:6px}.hub-ing{display:inline-flex;align-items:center;gap:2px;font-style:normal;opacity:.55}.hub-ing.ok{opacity:1}.hub-ing svg{width:16px;height:16px;display:block}.hub-cooking .fp-bar{display:block;height:8px;margin:4px 0 2px;border-radius:999px;background:rgba(0,0,0,.14);overflow:hidden}.hub-cooking .fp-bar i{display:block;height:100%;background:linear-gradient(90deg,#FFD447,#FF9F43);border-radius:999px}.town-head .npc-face{width:64px;height:64px;flex:none;border-radius:50%;background:var(--track);border:2px solid var(--line)}#sheet .town-head{display:flex;align-items:center;gap:12px}#sheet .town-line{font-size:15px;line-height:1.4;margin:10px 0}#sheet .town-acts{display:flex;flex-wrap:wrap;gap:8px}'; document.head.appendChild(css); } catch (e) {}

  /* ---- the contract ---- */
  const api = {
    NPCS, UPGRADES, LOOKOUT_GIFT,
    init(c) {
      core = c || null; geo = typeof HubGeo !== 'undefined' && HubGeo && typeof HubGeo.make === 'function' ? HubGeo : null;
      if (!st) return;
      hub();
      places = buildPlaces();
      plotEnts = HUB.plots.map((_, i) => makePlot(i));
      npcEnts = NPCS.map(makeNpc);
      greenhouse = hub().up.greenhouse ? makeGreenhouse() : null;
      fx = []; rest = null; cookTold = '';
    },
    places() { if (!places.length && st) api.init(core); return places; },
    extraEntities() { if (!plotEnts.length && st) api.init(core); const out = plotEnts.concat(npcEnts); if (greenhouse) out.push(greenhouse); return fx.length ? out.concat(fx) : out; },
    update(dt, t) {
      if (!st) return;
      for (let i = fx.length - 1; i >= 0; i--) { fx[i].age += dt; if (fx[i].age >= fx[i].life) fx.splice(i, 1); }
      if (rest && Date.now() > rest.until) rest = null;
      const h = hub(); if (h.cook && RECIPES[h.cook.recipe] && cookLeft() <= 0 && cookTold !== h.cook.recipe + h.cook.at) { cookTold = h.cook.recipe + h.cook.at; say(`${RECIPES[h.cook.recipe].name} is ready at the kitchen`, 3000); snd('chirp'); }
      if (h.up.greenhouse && !greenhouse) greenhouse = makeGreenhouse();
    },
    petIdle(pet, ctx) {
      if (rest) { const d = Math.hypot((pet.x || 0) - rest.x, (pet.y || 0) - rest.y); if (d < 260) { const i = (ctx && ctx.index) || 0; return { kind: rest.kind, x: rest.x + (i % 2 ? 1 : -1) * (28 + 18 * Math.floor(i / 2)), y: rest.y + 6, dur: 3 + Math.random() * 1.5 }; } }
      const k = ctx && (ctx.kind || ctx.spot || (ctx.entity && ctx.entity.kind));
      if (!k) return null;
      const map = { bench: 'sit', readingbench: 'sit', picnic: 'sit', fountain: 'watch', dock: 'watch', stream: 'watch', river: 'watch', reeds: 'watch', flowerbed: 'sniff', flowerring: 'sniff', trellis: 'sniff', baskets: 'sniff', cookpot: 'sniff', bigtree: 'curl', bed: 'curl', woodpile: 'curl' };
      const kind = map[k]; if (!kind) return null;
      return { kind, x: ctx.x != null ? ctx.x : pet.x, y: ctx.y != null ? ctx.y : pet.y, dur: 2 + Math.random() * 2 };
    },
    /* the Feed tray's pick in town: the same spend and stat rules as the room's bowl (spendSnack/applyMeal, 08-activities) */
    onFeed(k) {
      const s = SNACKS[k]; if (!s || !st) return false;
      if (st.food >= 92 && !s.drink) { say(`${st.name} is full right now. Try again later.`); snd('grumble'); return false; }
      if (typeof spendSnack !== 'function' || !spendSnack(k)) return false;
      const m = applyMeal(k, { kitchen: false }), p = petPos();
      hop(); heartsAt(p.x, p.y - 44); snd('yum'); burst(p.x, p.y, (has('pet') && core.pet().lv) || hub().lv || 0, `+${Math.round(m.food)} food`, '#FFB0C8');
      const parts = [`+${Math.round(m.food)} food`, `+${Math.round(m.joy)} joy`];
      if (s.energy) parts.push(`+${s.energy} energy`); if (m.growth) parts.push(`+${m.growth} growth`); if (m.bondLv) parts.push(`+${m.bondLv} bond levels`);
      parts.push(s.lvAdd ? `+${m.ups} pet levels` : `+${num(m.fx)} level XP`);
      say(`${st.name} ate the ${s.name.toLowerCase()}: ${parts.join(' · ')}`, 3400);
      if (m.ups) setTimeout(() => { if (st) { say(`${st.name} is level ${st.dlv}!`, 2600); snd('fanfare'); } }, 1800);
      if (m.first && typeof streakReward === 'function') setTimeout(() => { if (!st) return; const extra = streakReward(); say(extra || (st.streak > 1 ? `Fed ${st.streak} days in a row` : 'First meal today. Come back tomorrow for day 2'), extra ? 3600 : 2800); snd('sparkle'); }, 3600);
      save(); hud(); return true;
    },
    onPet() {
      if (!st) return; const now = Date.now(), p = petPos();
      heartsAt(p.x, p.y - 44); snd('chirp');
      if (now - lastPet > 2500) { lastPet = now; st.joy = Math.min(100, st.joy + 2); if (typeof addXP === 'function') addXP(1); hud(); if (Math.random() < 0.3) say([`${st.name} leans into your hand.`, `${st.name} purrs.`, `${st.name} wags all over.`][Math.floor(Math.random() * 3)], 1800); }
    },
    onPlay() {
      say('Play inside: the games are in the cottage.', 2200);
      overlay(() => { if (has('openHouse')) core.openHouse(); else call(() => openHouse()); setTimeout(() => { if (typeof openTray === 'function') openTray('play'); }, 120); });
    },
    /* the Feed tray over the hub: a tapped snack goes to onFeed (hubSnackHook, 09-ui) */
    openFeedTray() { if (typeof openTray !== 'function') return; hubSnackHook = k => api.onFeed(k); openTray('feed'); },
    flag(id) { const u = FLAG_OF[id]; return !!(u && st && st.hub && st.hub.up && st.hub.up[u]); },
    resting() { return rest; },
    core() { return core; },   // (tests and the dev menu reach the town through it)
    /* dev and tests: time passes (crop hours; the stove's clock moves the same amount) */
    advance(hours) { if (!st) return; if (typeof growFarm === 'function') growFarm(st, hours); const h = hub(); if (h.cook) h.cook.at -= hours * 36e5; },
    // the pieces, for tests and the dev menu
    _: { plotOpen, plantPlot, harvestPlot, openSeeds, openShed, buySeeds, openKitchen, startCook, collectCook, cookLeft, openWorkshop, buyUpgrade, openDojo, openAltar, talk, go, openGame, lookout, hiddenGarden, restAt, stageOf, lvAt, hub, burst },
  };
  return api;
})();
globalThis.HubFacilities = HubFacilities;
