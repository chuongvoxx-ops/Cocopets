/* ---------- the gift box shop and its opening ceremony ---------- */
function giftSVG() { return treasureSVG(); }
/* the treasure chest: an open chest brimming with crystals, gemstones, coins and pearls */
function treasureSVG(opts) {
  const L = 'stroke="#2B2433" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"', closed = opts && opts.closed;
  const crystal = (x, y, h, c1, c2, rot) => `<g transform="translate(${x} ${y}) rotate(${rot || 0})"><path d="M0 ${-h}L7 ${-h * 0.55}L7 0L-7 0L-7 ${-h * 0.55}Z" fill="${c1}" ${L}/><path d="M0 ${-h}L7 ${-h * 0.55}L2 ${-h * 0.5}Z" fill="#FFFFFF" opacity=".55"/><path d="M-7 ${-h * 0.55}L-2 ${-h * 0.5}L-2 0L-7 0Z" fill="${c2}" opacity=".6"/></g>`;
  const gem = (x, y, r, c) => `<g transform="translate(${x} ${y})"><path d="M${-r} ${-r * 0.2}L${-r * 0.5} ${-r}L${r * 0.5} ${-r}L${r} ${-r * 0.2}L0 ${r}Z" fill="${c}" ${L}/><path d="M${-r * 0.5} ${-r}L${r * 0.5} ${-r}L0 ${-r * 0.2}Z" fill="#FFFFFF" opacity=".5"/></g>`;
  const coin = (x, y) => `<g transform="translate(${x} ${y})"><ellipse cx="0" cy="0" rx="9" ry="6" fill="#FFD447" ${L}/><ellipse cx="0" cy="-1" rx="5.5" ry="3.2" fill="none" stroke="#C98A12" stroke-width="2"/></g>`;
  const pearl = (x, y) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#F4F0FF" ${L}/><circle cx="${x - 1.5}" cy="${y - 1.5}" r="1.4" fill="#FFFFFF"/>`;
  const loot = closed ? '' : `<g class="loot">
      ${coin(44, 60)}${coin(52, 56)}${coin(60, 60)}${coin(92, 59)}${coin(100, 56)}${coin(84, 62)}
      ${crystal(58, 58, 30, '#B983F5', '#7A4FC2', -14)}${crystal(70, 54, 40, '#D2A4FF', '#9A64DE', 0)}${crystal(84, 57, 28, '#B983F5', '#7A4FC2', 16)}
      ${gem(40, 50, 7, '#FF6F59')}${gem(100, 48, 7, '#4FA8F0')}${gem(70, 66, 7, '#8FE0A6')}${gem(52, 66, 6, '#FFD447')}${gem(90, 68, 6, '#FF9BD2')}
      ${pearl(34, 62)}${pearl(106, 64)}${pearl(64, 72)}
      <path d="${starPath(26, 34, 4)}" fill="#FFF3B0"/><path d="${starPath(116, 30, 5)}" fill="#FFF3B0"/><path d="${starPath(70, 18, 3.5)}" fill="#FFFFFF"/><circle cx="36" cy="22" r="2" fill="#FFF3B0"/><circle cx="104" cy="16" r="2.2" fill="#FFF3B0"/>
    </g>`;
  return `<svg class="giftsvg treasure" viewBox="0 0 140 120" aria-hidden="true">
    <g class="gift-lid"><path d="M22 ${closed ? 56 : 46}C22 ${closed ? 30 : 22} 40 ${closed ? 20 : 8} 70 ${closed ? 20 : 8}C100 ${closed ? 20 : 8} 118 ${closed ? 30 : 22} 118 ${closed ? 56 : 46}Z" fill="#A8743F" ${L}/><path d="M30 ${closed ? 56 : 46}C30 ${closed ? 36 : 28} 44 ${closed ? 27 : 15} 70 ${closed ? 27 : 15}C96 ${closed ? 27 : 15} 110 ${closed ? 36 : 28} 110 ${closed ? 56 : 46}" fill="none" stroke="#5E4630" stroke-width="2"/><rect x="62" y="${closed ? 20 : 8}" width="16" height="${closed ? 36 : 38}" fill="#FFD447" ${L}/></g>
    <g class="gift-body"><rect x="20" y="54" width="100" height="56" rx="7" fill="#C98A5E" ${L}/><rect x="20" y="54" width="100" height="10" fill="#8C5A32" stroke="#2B2433" stroke-width="3"/><path d="M20 86h100" stroke="#5E4630" stroke-width="3"/><rect x="62" y="54" width="16" height="56" fill="#FFD447" ${L}/><rect x="64" y="74" width="12" height="12" rx="3" fill="#2B2433"/><circle cx="70" cy="80" r="2.5" fill="#FFD447"/>
      <rect x="20" y="62" width="100" height="6" fill="#2B2433" opacity=".25"/>${loot}</g>
  </svg>`;
}
function giftOddsHTML() {
  const per = r => CARDS_BY_R[r].length;
  return `<details class="odds"><summary>Drop rates</summary>
    <table><thead><tr><th>Card rarity</th><th>Cards 1 and 2</th><th>Card 3</th></tr></thead><tbody>
      <tr><td>Common</td><td>60%</td><td>none</td></tr><tr><td>Rare</td><td>28%</td><td>75%</td></tr><tr><td>Epic</td><td>10%</td><td>20%</td></tr><tr><td>Legendary</td><td>2%</td><td>5%</td></tr></tbody></table>
    <p>Within a rarity every card is equally likely (${per('common')} Common, ${per('rare')} Rare, ${per('epic')} Epic, ${per('legend')} Legendary). If ${GIFT_PITY - 1} boxes in a row have no Legendary, the next box's third card is Legendary. Counting that guarantee, about 1 box in 7 holds a Legendary card.</p>
    <p>Gemstones: Rose Quartz 26%, Amethyst 22%, Citrine 18%, Emerald 15%, Sapphire 12%, Starstone 7%.</p>
    <p>Every box holds ${fmtNum(GIFT_CRYSTALS)} crystals. Bundle: coins 50% (300 to 700), pearls 25% (20 to 50), farm food 25%. Energy drink: Star soda 70% (+40 energy), Comet tea 30% (+100 energy). Ambrosia (a third of a pet level, for any pet): 35% of boxes. Bond treat, in every box: Heart tart 72% (+2 bond levels), Kindred sundae 28% (+3 bond levels). Level food: Moon honeycomb 25% of boxes (half a pet level), Grand feast 5% (twenty pet levels).</p>
    <p>A card you already have gains a level, up to Lv ${CARD_MAX_LV}. After that it turns into coins.</p></details>`;
}
function openGiftShop() {
  const left = GIFT_PITY - (st.dun.pity || 0);
  openSheet('gift', `
    <p class="eyebrow">Shop</p><h2 class="title" id="sheetTitle">Treasure box</h2>
    <div class="gift-hero">${treasureSVG()}</div>
    <ul class="gift-list">
      <li>${ICON.crystal}<span><b>${fmtNum(GIFT_CRYSTALS)} crystals</b>In every box. Summon eggs, evolve pets and forge Fusion Stones.</span></li>
      <li>${ICON.cards}<span><b>3 ability cards</b>For your pets' Normal, Strong and Ult slots. The third is always Rare or better.</span></li>
      <li>${gemSVG('amethyst')}<span><b>3 gemstones</b>For evolving your pets.</span></li>
      <li>${ICON.coin}<span><b>A bundle</b>Coins, pearls or farm food.</span></li>
      <li>${SNACK_SVG.soda}<span><b>An energy drink</b>Refills energy for more adventures.</span></li>
      <li>${SNACK_SVG.ambrosia}<span><b>Ambrosia</b>Sometimes. Feeds any pet a third of the way to its next level.</span></li>
      <li>${SNACK_SVG.hearttart}<span><b>A bond treat</b>In every box: a heart tart (two bond levels) or a kindred sundae (three).</span></li>
      <li>${SNACK_SVG.honeycomb}<span><b>Level food</b>Often moon honeycomb (half a pet level), rarely a grand feast (twenty pet levels).</span></li>
    </ul>
    <div class="packs egg-buy">
      <button class="pack" type="button" data-go="gift-buy">${ICON.gift}<b>Treasure box</b><span class="mono">${GIFT_PRICE}</span></button>
      <button class="pack" type="button" data-go="gift-pearls"${st.pearls < GIFT_PEARLS ? ' aria-disabled="true"' : ''}>${ICON.pearl}<b>${GIFT_PEARLS} pearls</b><span class="mono">You have ${fmtNum(st.pearls)}</span></button>
    </div>
    <p class="note">${left <= 1 ? 'Your next box is guaranteed a Legendary card.' : `A Legendary card is guaranteed within ${left} boxes.`} Boxes opened: ${st.dun.boxes || 0}.</p>
    ${giftOddsHTML()}
    <p class="demo-note">Prototype: the ${GIFT_PRICE} button is a test purchase and nothing is charged. In the real app it opens the App Store or Google Play payment sheet.</p>`);
}
function confirmGiftBuy() {
  openSheet('gift', `
    <p class="eyebrow">Test purchase</p><h2 class="title" id="sheetTitle">Buy a treasure box?</h2>
    <div class="gift-hero small">${treasureSVG()}</div>
    <p class="note">In the store version this charges <b>${GIFT_PRICE}</b> through the App Store or Google Play. This prototype charges nothing.</p>
    <div class="evo-actions"><button class="btn primary" type="button" data-go="gift-confirm">Open the box</button><button class="btn" type="button" data-go="gift">Back</button></div>`);
}
function buyGift(how) {
  if (!st) return;
  if (how === 'pearls') {
    if (st.pearls < GIFT_PEARLS) { openPearlShop(GIFT_PEARLS - st.pearls); return; }
    st.pearls -= GIFT_PEARLS;
  }
  closeSheet();
  const items = applyGiftBox(rollGiftBox(Math.random, st.dun.pity || 0));
  saveLocalNow(); updateHud();
  playGiftCeremony(items);
}

/* the ceremony: the box shakes, bursts, and the rewards flip over one by one */
const giftWrap = $('#giftWrap'), gwBox = $('#gwBox'), gwItems = $('#gwItems'), gwActions = $('#gwActions');
let giftItems = null, giftStage = 0, giftT = 0;
const PET_STAR_R = { 3: 'common', 4: 'epic', 5: 'legend', 6: 'legend' };
const giftBest = items => items.map(i => i.kind === 'card' ? CARDS[i.id].r : i.kind === 'pet' ? PET_STAR_R[i.stars] : 'common').sort((a, b) => R_ORDER.indexOf(b) - R_ORDER.indexOf(a))[0] || 'common';
let giftMode = 'box';
function playGiftCeremony(items, o) {
  o = o || {}; giftItems = items; giftStage = 1; giftMode = o.mode || 'box';
  const best = giftBest(items);
  giftWrap.dataset.best = best; giftWrap.dataset.mode = giftMode; giftWrap.dataset.gold = items.some(i => i.kind === 'pet' && i.stars >= 6) ? '1' : ''; giftWrap.style.setProperty('--gc', CARD_R[best].c);
  $('#gwTitle').textContent = o.title || 'Tap the box!';
  $('#gwSub').textContent = o.sub || `${fmtNum(GIFT_CRYSTALS)} crystals, 3 cards, 3 gemstones, a bundle and an energy drink`;
  gwBox.innerHTML = o.box || treasureSVG({ closed: true }); gwBox.hidden = false; gwBox.className = 'gw-box idle';
  gwItems.innerHTML = ''; gwItems.hidden = true; gwActions.hidden = true;
  giftWrap.hidden = false;
  sfx.hum();
  clearTimeout(giftT); giftT = setTimeout(openGiftBox, 6000);
  setTimeout(() => { try { gwBox.focus({ preventScroll: true }); } catch (e) {} }, 60);
}
function giftConfetti(n, big) {
  const box = $('#gwConfetti');
  const cols = ['#FF9BD2', '#FFE37A', '#7FD3F2', '#8FE0A6', '#B983F5', '#FFFFFF', getComputedStyle(giftWrap).getPropertyValue('--gc').trim() || '#FFD447'];
  let html = '';
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, d = (big ? 160 : 110) + Math.random() * (big ? 220 : 140); html += `<i style="--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d - 60).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--c:${cols[i % cols.length]};--dl:${(Math.random() * 0.12).toFixed(2)}s"></i>`; }
  box.insertAdjacentHTML('beforeend', html);
  setTimeout(() => { box.innerHTML = ''; }, 1700);
}
function openGiftBox() {
  if (giftStage !== 1) return;
  giftStage = 2; clearTimeout(giftT);
  gwBox.className = 'gw-box shake';
  sfx.twang(); buzz(20);
  setTimeout(() => {
    gwBox.className = 'gw-box pop';
    const fl = $('#gwFlash'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    sfx.crash(); sfx.sparkle(); buzz(50);
    giftConfetti(46, giftBest(giftItems) === 'legend');
    setTimeout(revealGifts, 420);
  }, reduceMotion ? 50 : 800);
}
function giftTile(it) {
  if (it.kind === 'card') return { r: CARDS[it.id].r, html: abilityCardHTML(cardAbility(it.id, it.lv), { isNew: it.isNew, up: it.up, maxed: it.maxed }), sub: it.maxed ? `Max level: +${it.coins} coins` : it.isNew ? 'New card!' : `Level up to Lv ${it.lv}` };
  if (it.kind === 'crystals') return { r: 'crystals', html: `<span class="gw-item gw-crystals">${ICON.crystal}<b>+${fmtNum(it.n)}</b></span>`, sub: 'Crystals' };
  if (it.kind === 'pet') return { r: PET_STAR_R[it.stars], html: `<span class="gw-item gw-pet s${it.stars}">${petSVG(it.form, { frame: 'fit', eyes: 'happy', mouth: 'smile' })}${starsHTML(it.stars)}</span>`, sub: it.name };
  if (it.kind === 'gem') return { r: 'gem', html: `<span class="gw-item" style="--gcol:${GEMS[it.gem].color}">${gemSVG(it.gem)}<b>${GEMS[it.gem].name}</b></span>`, sub: 'Gemstone' };
  if (it.kind === 'stones') return { r: 'item', html: `<span class="gw-item">${ICON.fusion}<b>×${it.n}</b></span>`, sub: it.n > 1 ? 'Fusion Stones' : 'Fusion Stone' };
  if (it.kind === 'coins') return { r: 'item', html: `<span class="gw-item">${ICON.coin}<b>+${fmtNum(it.n)}</b></span>`, sub: 'Coins' };
  if (it.kind === 'pearls') return { r: 'item', html: `<span class="gw-item">${ICON.pearl}<b>+${it.n}</b></span>`, sub: 'Pearls' };
  if (it.kind === 'food') return { r: 'item', html: `<span class="gw-item">${SNACK_SVG[it.crop]}<b>×${it.n}</b></span>`, sub: SNACKS[it.crop].name };
  return { r: 'item', html: `<span class="gw-item">${SNACK_SVG[it.id]}<b>+${DRINKS[it.id].energy}</b></span>`, sub: DRINKS[it.id].name };
}
function revealGifts() {
  gwBox.hidden = true;
  const best = giftBest(giftItems);
  const pets = giftMode === 'summon';
  const gold = giftItems.some(i => i.kind === 'pet' && i.stars >= 6);
  $('#gwTitle').textContent = pets ? (gold ? 'A SIX-STAR LEGENDARY!' : best === 'legend' ? 'A FIVE-STAR PET!' : best === 'epic' ? 'A four-star pet!' : 'New pets!') : best === 'legend' ? 'LEGENDARY!' : best === 'epic' ? 'An epic haul!' : 'Your treasure!';
  $('#gwSub').textContent = pets ? 'They have moved into your house' : 'Tap Collect to keep them all';
  const step = reduceMotion ? 0.02 : 0.2;
  gwItems.innerHTML = giftItems.map((it, i) => { const t = giftTile(it); return `<div class="gw-tile k-${it.kind} r-${t.r}" style="--d:${(i * step).toFixed(2)}s"><div class="gw-flip"><div class="gw-back">${it.kind === 'pet' ? ICON.egg : ICON.gift}</div><div class="gw-front">${t.html}</div></div><small>${esc(t.sub)}</small></div>`; }).join('');
  gwItems.hidden = false;
  giftItems.forEach((it, i) => setTimeout(() => {
    if (giftStage < 2) return;
    const r = it.kind === 'card' ? CARDS[it.id].r : it.kind === 'pet' ? PET_STAR_R[it.stars] : '';
    if (it.kind === 'pet' && it.stars >= 6) { sfx.fanfare(); setTimeout(() => sfx.fanfare(), 380); giftConfetti(80, true); buzz([60, 40, 90]); }
    else if (r === 'legend') { sfx.fanfare(); giftConfetti(40, true); buzz(60); }
    else if (r === 'epic') sfx.sparkle();
    else sfx.blip();
  }, (i * step + 0.3) * 1000));
  setTimeout(() => { if (giftStage >= 2) { gwActions.hidden = false; giftStage = 3; try { $('[data-gw="done"]', gwActions).focus({ preventScroll: true }); } catch (e) {} } }, (giftItems.length * step + 0.6) * 1000);
}
function closeGift(toCards) {
  giftWrap.hidden = true; giftStage = 0; clearTimeout(giftT);
  $('#gwConfetti').innerHTML = '';
  updateHud();
  if (mapOpen && mapTab === 'dungeon') renderDungeon();
  if (toCards) openCards(cardsSlot);
}
gwBox.addEventListener('click', () => { sfx.unlock(); openGiftBox(); });
giftWrap.addEventListener('click', e => {
  const b = e.target.closest('[data-gw]');
  if (b) { if (b.dataset.gw === 'cards') closeGift(true); else closeGift(false); return; }
  if (giftStage === 2 && e.target.closest('#gwItems')) { // skip the wait
    $$('.gw-flip', gwItems).forEach(x => { x.style.animationDelay = '0s'; });
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !giftWrap.hidden) { e.stopImmediatePropagation(); if (giftStage === 1) openGiftBox(); else if (giftStage === 3) closeGift(false); } }, true);

/* ---------- summoning: crystals become eggs, eggs become pets. 84% three-star, 10% four-star, 5% five-star, 1% six-star ---------- */
const SUMMON_COST = 1000, SUMMON_N = 10, SUMMON_ONE = 120;
function eggsSVG() {
  const egg = (x, y, sc, s) => `<g transform="translate(${x} ${y}) scale(${sc})"><path d="M0 -34C13 -34 22 -14 22 1C22 14 12 21 0 21C-12 21 -22 14 -22 1C-22 -14 -13 -34 0 -34Z" fill="${s[0]}" stroke="#2B2433" stroke-width="3"/><ellipse cx="-8" cy="-14" rx="4" ry="5" fill="${s[1]}" opacity=".85"/><circle cx="8" cy="-4" r="4" fill="${s[2]}" opacity=".85"/><circle cx="-4" cy="8" r="3" fill="${s[1]}" opacity=".7"/></g>`;
  return `<svg class="giftsvg eggs" viewBox="0 0 140 120" aria-hidden="true"><g class="gift-lid"><path d="${starPath(22, 30, 4)}" fill="#FFF3B0"/><path d="${starPath(118, 26, 5)}" fill="#FFF3B0"/><path d="${starPath(70, 12, 3.5)}" fill="#FFFFFF"/></g>
    <g class="gift-body"><ellipse cx="70" cy="104" rx="56" ry="10" fill="#2B2433" opacity=".2"/>${egg(34, 78, 0.9, EGG_SHELLS[0])}${egg(106, 78, 0.9, EGG_SHELLS[2])}${egg(52, 60, 0.95, EGG_SHELLS[1])}${egg(88, 60, 0.95, EGG_SHELLS[3])}${egg(70, 84, 1.15, EGG_SHELLS[1])}</g></svg>`;
}
function pityLeft() { return Math.max(0, PITY_N - (st && st.pity10 || 0)); }
function pityHTML() {
  const n = st && st.pity10 || 0, left = pityLeft();
  return `<div class="pity${left ? '' : ' ready'}"><div class="pity-top"><b>${left ? `Six-star guarantee` : `Six-star guaranteed!`}</b><span class="mono">${Math.min(n, PITY_N)}/${PITY_N}</span></div>
    <div class="pity-bar" role="progressbar" aria-label="10-egg summons toward a guaranteed six-star" aria-valuemin="0" aria-valuemax="${PITY_N}" aria-valuenow="${Math.min(n, PITY_N)}"><i style="width:${Math.min(100, n / PITY_N * 100)}%"></i></div>
    <small>${left ? `${left} more 10-egg summon${left === 1 ? '' : 's'} without a ${starsHTML(6)} and the one after brings a six-star Legendary for certain.` : `Your next 10-egg summon brings a ${starsHTML(6)} six-star Legendary for certain.`}</small></div>`;
}
function summonOddsHTML() {
  return `<details class="odds"><summary>Summon rates</summary>
    <table><thead><tr><th>Pet</th><th>Chance per egg</th></tr></thead><tbody>
      <tr><td>${starsHTML(3)} Three-star</td><td>84%</td></tr><tr><td>${starsHTML(4)} Four-star</td><td>10%</td></tr><tr><td>${starsHTML(5)} Five-star</td><td>5%</td></tr><tr class="odds-gold"><td>${starsHTML(6)} Six-star Legendary</td><td>1%</td></tr></tbody></table>
    <p>Every egg is rolled on its own. After ${PITY_N} 10-egg summons in a row with no six-star, the next 10-egg summon always holds one; single eggs don't count toward it. Four- and five-star pets carry their own signature Strong attack and Ultimate. Six-star Legendaries hatch with small angel or dragon wings that grow as they evolve, a radiant aura and golden signature moves stronger than any other. Fusing can also raise a pet's star rank (see the fusion screen). Your house holds up to ${MAX_PETS} pets.</p></details>`;
}
function openSummon() {
  const room = MAX_PETS - petCount(), cr = st.crystals || 0, free = (st.freeTen || 0) > 0;
  openSheet('summon', `
    <p class="eyebrow">Summon</p><h2 class="title" id="sheetTitle">Egg summon</h2>
    <div class="gift-hero">${eggsSVG()}</div>
    <p class="note">Spend crystals on mystery eggs. Each hatches a one-of-a-kind pet with its own star rank, element and abilities. You have <b>${fmtNum(cr)}</b> crystals and room for <b>${room}</b> more pet${room === 1 ? '' : 's'}.</p>
    <div class="packs egg-buy">
      <button class="pack${free ? ' free' : ''}" type="button" data-go="summon-10"${free ? (room < SUMMON_N ? ' aria-disabled="true"' : '') : cr < SUMMON_COST || room < 1 ? ' aria-disabled="true"' : ''}>${ICON.egg}<b>${SUMMON_N} eggs</b><span class="mono">${free ? `Free${st.freeTen > 1 ? ` ×${st.freeTen}` : ''}` : `${fmtNum(SUMMON_COST)} crystals`}</span></button>
      <button class="pack" type="button" data-go="summon-1"${cr < SUMMON_ONE || room < 1 ? ' aria-disabled="true"' : ''}>${ICON.egg}<b>1 egg</b><span class="mono">${SUMMON_ONE} crystals</span></button>
    </div>
    ${st.dev6 ? `<p class="note gold-note"><b>Developer test:</b> every egg hatches a six-star Legendary. Turn it off in the developer tools.</p>` : ''}${pityHTML()}
    ${free ? `<p class="note gold-note"><b>A free 10-egg summon is yours!</b> ${room < SUMMON_N ? `Make room for ${SUMMON_N} pets to use it.` : 'Tap 10 eggs to hatch them.'}</p>` : ''}
    ${room < 1 ? `<p class="note"><b>Your house is full.</b> Fuse two pets to make room.</p>` : ''}
    <div class="evo-actions"><button class="btn" type="button" data-go="crystals">${ICON.crystal}Get crystals</button><button class="btn" type="button" data-go="gift">${ICON.gift}Treasure box</button></div>
    ${summonOddsHTML()}`);
}
function doSummon(n) {
  if (!st) return;
  const free = n >= SUMMON_N && (st.freeTen || 0) > 0, cost = free ? 0 : n >= SUMMON_N ? SUMMON_COST : SUMMON_ONE, room = MAX_PETS - petCount();
  if (room < (free ? SUMMON_N : 1)) { openSummon(); return; }
  if ((st.crystals || 0) < cost) { openCrystalShop(cost - (st.crystals || 0)); return; }
  st.crystals -= cost; if (free) st.freeTen--;
  const count = Math.min(n, room), items = [], ten = n >= SUMMON_N, sure = ten && pityLeft() === 0;
  // (developer tools can make every egg a six-star, to try them out)
  const rolls = []; for (let i = 0; i < count; i++) rolls.push(st.dev6 ? 6 : rollStars());
  if (sure && !rolls.includes(6)) rolls[Math.floor(Math.random() * count)] = 6;
  for (let i = 0; i < count; i++) {
    const stars = rolls[i], g = summonGenome(stars), name = speciesName(g.form).split(' ').pop();
    const f = newPetFields(name, g);
    st.others.push(f);
    items.push({ kind: 'pet', stars, form: g.form, name, uid: f.uid });
  }
  if (ten) st.pity10 = rolls.includes(6) ? 0 : Math.min(PITY_N, (st.pity10 || 0) + 1);
  st.summons = (st.summons || 0) + count;
  if (count < n) st.crystals += Math.round(cost * (n - count) / n);
  closeSheet(); buildCompanions();
  saveLocalNow(); updateHud();
  playGiftCeremony(items, { mode: 'summon', title: count > 1 ? 'Tap the eggs!' : 'Tap the egg!', sub: st.dev6 ? `${count} egg${count > 1 ? 's' : ''} · developer test: every egg a ★6` : free ? `${count} free eggs: the welcome gift · 84% ★3 · 10% ★4 · 5% ★5 · 1% ★6` : sure ? `${count} eggs · a ★6 Legendary is guaranteed!` : `${count} egg${count > 1 ? 's' : ''} · 84% ★3 · 10% ★4 · 5% ★5 · 1% ★6`, box: eggsSVG() });
}

/* ---------- the level-10 gift: three eggs, each a three- to five-star pet (never a six-star), the first time the pet you
   play reaches level 10. Shown at home once nothing else is open; eggs the house has no room for wait (st.lv10Owed)
   and hatch as soon as a place frees up ---------- */
const LV10_EGGS = 3, LV10_RATES = [[3, 50], [4, 35], [5, 15]];
function lv10Stars() { let r = Math.random() * 100; for (const [s, w] of LV10_RATES) { r -= w; if (r < 0) return s; } return 3; }
function lv10Check() {
  if (!st || !running || adopting || (typeof arc !== 'undefined' && arc.open) || sheetKind || !giftWrap.hidden || mapOpen || !introEl.hidden) return;
  if (!st.lv10Eggs && (st.dlv || 1) >= 10) { st.lv10Eggs = 1; st.lv10Owed = LV10_EGGS; saveSoon(); }
  const owed = st.lv10Owed || 0, room = MAX_PETS - petCount(); if (!owed || room < 1) return;
  const count = Math.min(owed, room), items = [];
  for (let i = 0; i < count; i++) {
    const stars = lv10Stars(), g = summonGenome(stars), name = speciesName(g.form).split(' ').pop(), f = newPetFields(name, g);
    st.others.push(f); items.push({ kind: 'pet', stars, form: g.form, name, uid: f.uid });
  }
  st.lv10Owed = owed - count; buildCompanions(); saveLocalNow(); updateHud();
  playGiftCeremony(items, { mode: 'summon', title: 'Level 10! Tap the eggs!', sub: `A gift for reaching level 10: ${count} egg${count > 1 ? 's' : ''}, each a ★3 to ★5 pet${st.lv10Owed ? ` · ${st.lv10Owed} more when your house has room` : ''}`, box: eggsSVG() });
}
setInterval(lv10Check, 1500);
