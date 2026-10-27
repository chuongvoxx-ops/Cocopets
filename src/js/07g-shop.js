/* ---------- the Shop: the merchant's room every house has. Everything that can be bought is here in one place: crystals,
   treasure boxes and eggs (test purchases), Fusion Stones, the special foods that level pets and deepen their bond, the
   farm's food and energy drinks, and the way to the furniture catalogue. Bought food goes to the pantry, where any pet
   can have it: the one you play from the Feed tray, any other from Team ---------- */
// c: coins each, cr: crystals each
const SHOP_FOOD = {
  levels: [{ k: 'ambrosia', c: 150 }, { k: 'honeycomb', c: 250 }, { k: 'feast', cr: 600 }],
  bond: [{ k: 'hearttart', c: 400 }, { k: 'sundae', c: 600 }],
  pantry: [{ k: 'sunberry', c: 20 }, { k: 'carrot', c: 40 }, { k: 'pumpkin', c: 80 }, { k: 'starfruit', c: 220 }, { k: 'soda', c: 60 }, { k: 'tea', c: 150 }],
};
const SHOP_ITEMS = [].concat(SHOP_FOOD.levels, SHOP_FOOD.bond, SHOP_FOOD.pantry);
const SHOP_WHAT = {
  ambrosia: 'A third of the way to your pet\'s next level, at any level',
  honeycomb: 'Half of the way to your pet\'s next level, at any level',
  feast: 'Twenty pet levels at once, progress kept',
  hearttart: 'Two whole bond levels, progress kept',
  sundae: 'Three whole bond levels, progress kept',
  sunberry: 'Food and a little bond', carrot: 'Food and bond', pumpkin: 'A big meal and bond', starfruit: 'Joy and a lot of bond',
  soda: '+40 energy for adventures', tea: '+100 energy for adventures',
};
function openShop(section) {
  labCtx = false; crysFrom = null;
  openSheet('shop', ''); renderShop();
  if (section) setTimeout(() => { try { const el = $(`[data-shop-sec="${section}"]`, sheetEl); if (el) el.scrollIntoView({ block: 'start' }); } catch (e) {} }, 40);
}
function shopPrice(it, n) { const v = (it.cr || it.c) * (n || 1); return `${it.cr ? ICON.crystal : ICON.coin}${fmtNum(v)}`; }
function shopRowHTML(it) {
  const s = SNACKS[it.k], have = st.pantry[it.k] || 0, cur = it.cr ? (st.crystals || 0) : st.coins;
  const btn = n => `<button class="btn small" type="button" data-go="shop-buy" data-k="${it.k}" data-n="${n}"${cur < (it.cr || it.c) * n ? ' aria-disabled="true"' : ''} aria-label="Buy ${n} ${esc(s.name)} for ${(it.cr || it.c) * n} ${it.cr ? 'crystals' : 'coins'}">×${n} ${shopPrice(it, n)}</button>`;
  return `<div class="shop-row"><span class="shop-ic">${SNACK_SVG[it.k] || ''}</span><span class="shop-copy"><b>${esc(s.name)}</b><small>${SHOP_WHAT[it.k] || ''}</small><small class="shop-have">${have ? `In the pantry: ${have}` : 'None in the pantry'}</small></span><span class="shop-buy">${btn(1)}${btn(5)}</span></div>`;
}
function renderShop() {
  if (sheetKind !== 'shop' || !st) return;
  const cr = st.crystals || 0, stones = st.fusionStones || 0;
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    <p class="eyebrow">Merchant Hall</p><h2 class="title" id="sheetTitle">Shop</h2>
    <div class="shop-wallet"><span>${ICON.coin}${fmtNum(st.coins)}</span><span>${ICON.crystal}${fmtNum(cr)}</span><span>${ICON.pearl}${fmtNum(st.pearls || 0)}</span><span>${ICON.fusion}${stones} stone${stones === 1 ? '' : 's'}</span></div>
    <h3 class="sec" data-shop-sec="crystals">Crystals, boxes and eggs</h3>
    <div class="packs">
      <button class="pack" type="button" data-go="crystal-buy">${ICON.crystal}<b>${fmtNum(CRYSTAL_PACK)} crystals</b><span class="mono">${CRYSTAL_PRICE} · test purchase</span></button>
      <button class="pack" type="button" data-go="gift" data-shop-sec="treasure">${ICON.gift}<b>Treasure box</b><span class="mono">${GIFT_PRICE} · test purchase, or ${GIFT_PEARLS} pearls</span></button>
      <button class="pack" type="button" data-go="egg">${ICON.egg}<b>Mystery egg</b><span class="mono">$4.00 · test purchase, or ${EGG_PEARLS} pearls</span></button>
    </div>
    <h3 class="sec" data-shop-sec="stones">Fusion Stones</h3>
    <div class="packs">
      <button class="pack" type="button" data-go="stone-buy"${cr < FUSION_COST ? ' aria-disabled="true"' : ''}>${ICON.fusion}<b>Fusion Stone</b><span class="mono">${FUSION_COST} crystals</span></button>
    </div>
    <p class="note">One stone fuses two pets. Merging a whole group of the same kind takes two stones for three to six pets, three for seven or more.</p>
    <h3 class="sec" data-shop-sec="levels">Food for pet levels</h3>
    <div class="shop-list">${SHOP_FOOD.levels.map(shopRowHTML).join('')}</div>
    <h3 class="sec" data-shop-sec="bond">Food for bond</h3>
    <div class="shop-list">${SHOP_FOOD.bond.map(shopRowHTML).join('')}</div>
    <h3 class="sec" data-shop-sec="pantry">Pantry and energy</h3>
    <div class="shop-list">${SHOP_FOOD.pantry.map(shopRowHTML).join('')}</div>
    <p class="note">Food goes to the pantry. Feed the pet you play from the Feed tray, and any other pet from <b>Team</b>: pick it and feed it there.</p>
    <div class="evo-actions"><button class="btn" type="button" data-go="team">${ICON.paw || ICON.star}Team</button><button class="btn" type="button" data-go="shop-decor">${ICON.brush}Furniture and decor</button></div>
    <p class="demo-note">Prototype: the ${CRYSTAL_PRICE}, ${GIFT_PRICE} and $4.00 buttons are test purchases and nothing is charged. In the real app they open the App Store or Google Play payment sheet.</p>`;
}
function shopBuy(k, n) {
  const it = SHOP_ITEMS.find(x => x.k === k); if (!it || !st) return;
  n = Math.max(1, Math.min(99, n | 0 || 1));
  const cost = (it.cr || it.c) * n, key = it.cr ? 'crystals' : 'coins', have = st[key] || 0, name = SNACKS[k].name;
  if (have < cost) { sfx.wrong(); toast(`${n} ${name} cost${n > 1 ? '' : 's'} ${fmtNum(cost)} ${key}. You have ${fmtNum(have)}.`); return; }
  st[key] = have - cost; st.pantry[k] = Math.min(999, (st.pantry[k] || 0) + n);
  sfx.coin(); toast(`${n} ${name} put in the pantry`); updateHud(); saveSoon(); renderShop();
}
$('#shopBtnIc').innerHTML = ICON.gift;
$('#shopBtn').addEventListener('click', () => { sfx.unlock(); openShop(); });
