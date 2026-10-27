/* ---------- DOM ---------- */
const appEl = $('#app'), stageEl = $('#stage'), roomEl = $('#room'), worldEl = $('#world'), wallItemsEl = $('#wallItems'), fxEl = $('#fx');
const sunEl = $('#sun'), nightEl = $('#night'), windowEl = $('#window'), petEl = $('#pet');
const hudEl = $('#hud'), dockEl = $('#dock'), toastEl = $('#toast'), hintEl = $('#hint'), bannerEl = $('#banner');
const trayEl = $('#tray'), trayInner = $('#trayInner');
const sheetWrap = $('#sheetWrap'), sheetEl = $('#sheet');
const introEl = $('#intro'), splashEl = $('#splash');
const homeEl = $('#home'), homeTopEl = $('#homeTop'), homeDockEl = $('#homeDock');
const insetProbe = $('#insetProbe'), selTools = $('#selTools');

/* ---------- layout ---------- */
const ROOM_ZOOM = 1.5;
let W = 0, H = 0, ps = 110, pb = 138, stageRect = { left: 0, top: 0 };
let wallH = 280, hudB = 120, dockT = 700;
const B = { x0: 0, x1: 0, y0: 0, y1: 0 };   // where the pet's feet can go
const F = { x0: 0, x1: 0, y0: 0, y1: 0 };   // floor range for furniture bases
const WR = { x0: 0, x1: 0, y0: 0, y1: 0 };  // wall range for wall decor
const ins = { l: 0, r: 0 };
const win = { x: 0, y: 0, w: 120, h: 90 };
const clampXY = (x, y) => [clamp(x, B.x0, B.x1), clamp(y, B.y0, B.y1)];
let homeMode = false, decorating = false;

function layout() {
  const r = stageEl.getBoundingClientRect();
  W = r.width; H = r.height; stageRect = r;
  const cs = getComputedStyle(insetProbe);
  ins.l = parseFloat(cs.paddingLeft) || 0; ins.r = parseFloat(cs.paddingRight) || 0;
  // (the rooms are drawn at 1.5 times their old size: the pets, the furniture and the floor's pattern a third smaller in
  // them, so a full party has room to spread out)
  ps = Math.round(clamp(Math.min(W, H * 0.9) * 0.27 / ROOM_ZOOM, 50, 110));
  pb = Math.round(ps * 1.25);
  appEl.style.setProperty('--pb', pb + 'px');
  if (!decorating && !homeMode && appEl.classList.contains('playing')) {
    hudB = hudEl.getBoundingClientRect().bottom - r.top;
    dockT = dockEl.getBoundingClientRect().top - r.top;
  } else if (!appEl.classList.contains('playing')) {
    hudB = 120; dockT = H - 80;
  }
  let bot = dockT;
  if (homeMode) bot = homeDockEl.getBoundingClientRect().top - r.top;
  wallH = Math.round(clamp(H * 0.36, Math.min(hudB + 96, H * 0.5), H * 0.5));
  roomEl.style.setProperty('--wall-h', wallH + 'px');
  B.x0 = ins.l + 14 + ps * 0.36; B.x1 = W - ins.r - 14 - ps * 0.36;
  B.y0 = wallH + 16; B.y1 = Math.max(B.y0 + 40, bot - 14);
  if (B.x1 < B.x0) B.x0 = B.x1 = W / 2;
  F.x0 = ins.l + 10; F.x1 = W - ins.r - 10; F.y0 = wallH + 8; F.y1 = Math.max(F.y0 + 40, dockT - 4);
  WR.x0 = ins.l + 10; WR.x1 = W - ins.r - 10; WR.y0 = hudB + 8; WR.y1 = wallH - 18;
  layoutWindow();
  positionDecor();
  positionPlots();
  if (st && running) {
    const p = clampXY(pet.x, pet.y); pet.x = p[0]; pet.y = p[1];
    relayoutPlay();
  }
  let top = (homeMode ? homeTopEl.getBoundingClientRect().bottom - r.top : hudB) + 10;
  const rbTop = decorating ? $('#decoBar').getBoundingClientRect().bottom - r.top + 6 : hudB + 6;
  roomBar.style.top = rbTop.toFixed(0) + 'px';
  if (!homeMode) top = rbTop + (roomBar.offsetHeight || 34) + 8;
  toastEl.style.top = top + 'px'; hintEl.style.top = top + 'px'; bannerEl.style.top = top + 'px';
  placeGlow();
  updateSky();
  if (selected) showSelTools(selected);
}
function layoutWindow() {
  let ww = clamp(W * 0.3 / ROOM_ZOOM * 1.2, 72, 136), wh = ww * 0.74;
  const bottom = wallH - 26;
  if (bottom - wh < hudB + 14) { wh = Math.max(44, bottom - hudB - 14); ww = wh / 0.74; }
  const cx = F.x0 + (F.x1 - F.x0) * 0.72;
  win.x = cx; win.y = bottom; win.w = ww; win.h = wh;
  windowEl.style.width = ww.toFixed(0) + 'px'; windowEl.style.height = wh.toFixed(0) + 'px';
  windowEl.style.transform = `translate(${(cx - ww / 2).toFixed(0)}px, ${(bottom - wh).toFixed(0)}px)`;
}

/* window sky and the light it throws on the floor */
let sunOn = false;
const sun = { cx: 0, cy: 0 };
function updateSky() {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  const sky = h >= 5.5 && h < 7.5 ? 'dawn' : h >= 7.5 && h < 17.5 ? 'day' : h >= 17.5 && h < 19.5 ? 'dusk' : 'night';
  windowEl.dataset.sky = sky; roomEl.dataset.sky = sky;
  const night = sky === 'night';
  const sb = $('#sunball'), mb = $('#moonball');
  sb.hidden = night; mb.hidden = !night;
  const p = clamp((h - 6) / 13, 0, 1);
  sb.style.left = (12 + 76 * p).toFixed(0) + '%';
  sb.style.top = (78 - Math.sin(p * Math.PI) * 52).toFixed(0) + '%';
  sunEl.classList.toggle('moon', night);
  sunEl.classList.toggle('dusk', sky === 'dusk' || sky === 'dawn');
  const w = clamp(win.w * 1.3, 120, 230), hh = w * 0.56;
  const q = night ? 0.5 : clamp((h - 6) / 14, 0, 1);
  const cx = clamp(win.x + lerp(-W * 0.14, W * 0.14, q), w / 2, W - w / 2);
  const cy = wallH + (B.y1 - wallH) * 0.3;
  sunEl.style.width = w.toFixed(0) + 'px'; sunEl.style.height = hh.toFixed(0) + 'px';
  sunEl.style.transform = `translate(${(cx - w / 2).toFixed(0)}px, ${(cy - hh / 2).toFixed(0)}px) skewX(${lerp(30, -30, q).toFixed(1)}deg)`;
  sun.cx = cx; sun.cy = clamp(cy + hh * 0.25, B.y0, B.y1);
  sunOn = !night;
}

/* ---------- decor in the room ---------- */
let decor = [];
let selected = null;
function framePet() {
  return st ? petSVG(curForm(), { cls: 'pet-emb', frame: 'fit' }).replace('<svg ', '<svg x="15" y="20" width="42" height="52" preserveAspectRatio="xMidYMax meet" ') : '';
}
const STATUE_PAL = { id: 'statue', name: 'Gold', base: '#F2C94C', dk: '#B8891C', lt: '#FFE79A', belly: '#FFE8A3', sec: '#D9A229', grad: ['#FFE48A', '#D49A22'], shine: true, cheek: '#EDB13A', inner: '#FFD98A', iris: '#A87512' };
function statuePet() {
  if (!st) return '';
  const f = Object.assign({}, curForm(), { pal: STATUE_PAL });
  return petSVG(f, { cls: 'pet-emb', frame: 'fit', eyes: 'closed', mouth: 'smile' }).replace('<svg ', '<svg x="8" y="0" width="84" height="99" preserveAspectRatio="xMidYMax meet" ');
}
/* item art, with the pet drawn into portraits and statues */
function itemArt(id) { return itemSVG(id, id === 'frame_pet' ? framePet() : id === 'pet_statue' ? statuePet() : ''); }
function renderDecor() {
  decor.forEach(d => d.el.remove());
  decor = [];
  cozyCache = -1;
  applyRoomLook();
  for (const it of st.room.items) addDecorEl(it);
  positionDecor();
  updateClocks();
  placeGlow();
}
function addDecorEl(it) {
  const def = ITEMS[it.id];
  const el = document.createElement('div');
  el.className = 'decor pl-' + (def.place || 'floor') + (def.lamp ? ' lamp' : '') + (it.flip ? ' flip' : '');
  el.dataset.u = it.u;
  el.innerHTML = `<div class="d-in">${itemArt(it.id)}</div>`;
  (def.place === 'wall' ? wallItemsEl : worldEl).appendChild(el);
  const d = { it, def, el, x: 0, y: 0, w: 0, h: 0 };
  decor.push(d);
  bindDecor(d);
  return d;
}
function decorGeom(d) {
  const def = d.def, it = d.it;
  if (def.place === 'wall') {
    const w = def.w * ps, h = w * def.vb[1] / def.vb[0];
    const x = clamp(WR.x0 + it.fx * (WR.x1 - WR.x0), WR.x0 + w / 2, WR.x1 - w / 2);
    const topMax = Math.max(WR.y0, WR.y1 - h);
    const top = WR.y0 + it.fy * (topMax - WR.y0);
    return { x, y: top + h, w, h };
  }
  const ds = 0.86 + 0.14 * it.fy;
  const w = def.w * ps * ds, h = w * def.vb[1] / def.vb[0];
  const x = clamp(F.x0 + it.fx * (F.x1 - F.x0), F.x0 + w * 0.42, F.x1 - w * 0.42);
  const y = F.y0 + it.fy * (F.y1 - F.y0);
  return { x, y, w, h };
}
function placeDecor(d) {
  const g = decorGeom(d);
  d.x = g.x; d.y = g.y; d.w = g.w; d.h = g.h;
  d.el.style.width = g.w.toFixed(1) + 'px'; d.el.style.height = g.h.toFixed(1) + 'px';
  d.el.style.transform = `translate3d(${(g.x - g.w / 2).toFixed(1)}px, ${(g.y - g.h).toFixed(1)}px, 0)`;
  d.el.style.zIndex = d.def.place === 'floor' ? String(Math.round(g.y)) : '1';
}
function positionDecor() { for (const d of decor) placeDecor(d); }
function decorAt(x, y, withRugs) {
  let best = null, bz = -1;
  for (const d of decor) {
    if (d.def.place === 'rug' && !withRugs) continue;
    if (x < d.x - d.w / 2 || x > d.x + d.w / 2 || y < d.y - d.h || y > d.y) continue;
    const z = d.def.place === 'floor' ? d.y + 10 : d.def.place === 'wall' ? 5 : 1;
    if (z > bz) { bz = z; best = d; }
  }
  return best;
}
const decorOf = act => decor.filter(d => d.def.act === act);
function bestBed() {
  let b = null;
  for (const d of decor) if (d.def.act === 'sleep' && (!b || d.def.cozy > b.def.cozy)) b = d;
  return b;
}
const bowlDecor = () => decor.find(d => d.it.id === 'bowl');
function updateClocks() {
  const t = new Date(), m = t.getMinutes(), h = (t.getHours() % 12) + m / 60;
  $$('.decor', wallItemsEl).forEach(el => {
    const hh = $('.hand-h', el), mm = $('.hand-m', el);
    if (hh) hh.setAttribute('transform', `rotate(${(h * 30).toFixed(1)} 35 35)`);
    if (mm) mm.setAttribute('transform', `rotate(${(m * 6).toFixed(1)} 35 35)`);
  });
}
function placeGlow() {
  const lamp = decor.find(d => d.def.lamp && d.def.place === 'floor') || bestBed();
  const gx = lamp ? lamp.x : W * 0.2, gy = lamp ? lamp.y - lamp.h * 0.6 : H * 0.7;
  nightEl.style.setProperty('--gx', (stageRect.left + gx).toFixed(0) + 'px');
  nightEl.style.setProperty('--gy', (stageRect.top + gy).toFixed(0) + 'px');
}

/* ---------- decorate mode: drag, flip, store, shop ---------- */
let drawerTab = 'shop', drawerCat = 'all';
function bindDecor(d) {
  if (d.def.lab || d.def.shop) d.el.classList.add('labtap');
  d.el.addEventListener('pointerdown', e => {
    if (!decorating) { if (d.def.lab) { e.stopPropagation(); sfx.unlock(); openLaboratory(); } else if (d.def.shop) { e.stopPropagation(); sfx.unlock(); if (d.def.shop === 'gift') openGiftShop(); else if (d.def.shop === 'stone') openStoneShop(); else openShop(d.def.shop === 'main' ? null : d.def.shop); } return; }
    e.stopPropagation(); e.preventDefault();
    sfx.unlock();
    const start = { x: e.clientX, y: e.clientY, fx: d.it.fx, fy: d.it.fy, moved: false };
    selectDecor(d);
    try { d.el.setPointerCapture(e.pointerId); } catch (_) {}
    const move = ev => {
      const dx = ev.clientX - start.x, dy = ev.clientY - start.y;
      if (!start.moved && hyp(dx, dy) < 6) return;
      if (!start.moved) { start.moved = true; d.el.classList.add('dragging'); selTools.hidden = true; }
      if (d.def.place === 'wall') {
        const ry = Math.max(1, Math.max(WR.y0, WR.y1 - d.h) - WR.y0);
        d.it.fx = clamp(start.fx + dx / Math.max(1, WR.x1 - WR.x0), 0, 1);
        d.it.fy = clamp(start.fy + dy / ry, 0, 1);
      } else {
        d.it.fx = clamp(start.fx + dx / Math.max(1, F.x1 - F.x0), 0, 1);
        d.it.fy = clamp(start.fy + dy / Math.max(1, F.y1 - F.y0), 0, 1);
      }
      placeDecor(d);
    };
    const up = () => {
      d.el.removeEventListener('pointermove', move);
      d.el.removeEventListener('pointerup', up);
      d.el.removeEventListener('pointercancel', up);
      d.el.classList.remove('dragging');
      showSelTools(d);
      if (start.moved) { sfx.pop(); placeGlow(); saveSoon(); }
    };
    d.el.addEventListener('pointermove', move);
    d.el.addEventListener('pointerup', up);
    d.el.addEventListener('pointercancel', up);
  });
}
function selectDecor(d) {
  if (selected) selected.el.classList.remove('selected');
  selected = d;
  if (d) { d.el.classList.add('selected'); showSelTools(d); }
  else selTools.hidden = true;
}
function showSelTools(d) {
  if (!decorating || !d) { selTools.hidden = true; return; }
  selTools.hidden = false;
  $('#selStore').hidden = !!d.def.fixed;
  const x = clamp(d.x, 80, W - 80);
  selTools.style.left = x.toFixed(0) + 'px';
  selTools.style.top = Math.max(selTools.offsetHeight + 12, d.y - d.h).toFixed(0) + 'px';
}
function enterDecor() {
  if (!running) return;
  if (act) endActivity(true);
  closeTray();
  if (ball) removeBall();
  decorating = true;
  document.body.classList.add('decorating');
  setDrawerMin(false);
  renderDrawer(); updateCozy();
  layout();
}
function exitDecor() {
  decorating = false;
  document.body.classList.remove('decorating');
  selectDecor(null);
  layout();
  updateHint(); saveSoon();
}
function setDrawerMin(min) {
  $('#drawer').classList.toggle('min', min);
  const b = $('#drawerToggle');
  b.innerHTML = min ? ICON.up : ICON.down;
  b.setAttribute('aria-label', min ? 'Show the shop' : 'Hide the shop');
}
function countOwned(id) { return st.room.items.filter(i => i.id === id).length + (st.inv[id] || 0); }
function updateCozy() {
  const c = cozyScore();
  $('#cozyText').innerHTML = `<b>Cozy ${c}</b> · happiness drops ${Math.min(40, c)}% slower`;
}
function catMatch(id) { return drawerCat === 'all' || (drawerCat === 'excl' ? !!ITEMS[id].excl : ITEMS[id].cat === drawerCat); }
function renderDrawer() {
  $$('.tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === drawerTab)));
  const chips = $('#catChips'), grid = $('#drawerGrid');
  chips.hidden = drawerTab === 'rooms';
  if (drawerTab !== 'rooms') chips.innerHTML = ITEM_CATS.map(c => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${c.id === drawerCat}">${c.name}</button>`).join('');
  let html = '';
  if (drawerTab === 'shop') {
    const ids = Object.keys(ITEMS).filter(id => ITEMS[id].cat !== 'none' && catMatch(id));
    html = ids.map(id => {
      const it = ITEMS[id], own = countOwned(id);
      return `<button class="card-item${it.excl ? ' excl' : ''}" type="button" data-buy="${id}"><span class="thumb">${itemArt(id)}</span><b>${it.name}</b><span class="cz">Cozy +${it.cozy}</span>${it.excl ? `<span class="price reward">${ICON.planet}${own ? 'Won' : 'Map reward'}</span>` : priceHTML(it.price)}${own ? `<span class="own">×${own}</span>` : ''}</button>`;
    }).join('');
  } else if (drawerTab === 'mine') {
    const ids = Object.keys(st.inv).filter(id => st.inv[id] > 0 && ITEMS[id] && catMatch(id));
    html = ids.length
      ? ids.map(id => `<button class="card-item" type="button" data-place="${id}"><span class="thumb">${itemArt(id)}</span><b>${ITEMS[id].name}</b><span class="cz">Tap to place</span><span class="own">×${st.inv[id]}</span></button>`).join('')
      : '<p class="empty">Everything you own is in the room. Tap something in the room and choose Put away to keep it here.</p>';
  } else if (isOutdoor()) {
    html = `<p class="empty">${esc(st.room.name)} is outdoors, under the open sky. Walls and floors are for indoor rooms.</p>`;
  } else {
    html = THEMES.map(t => {
      const owned = !t.price || st.themes.includes(t.id), on = st.room.theme === t.id;
      return `<button class="card-item${on ? ' applied' : ''}" type="button" data-theme="${t.id}"><span class="theme-swatch"><i style="background:${t.wall}"></i><u style="background:${t.floor}"></u></span><b>${t.name}</b>${on ? '<span class="cz">In use</span>' : owned ? '<span class="cz">Owned</span>' : priceHTML(t.price)}</button>`;
    }).join('');
  }
  grid.innerHTML = html;
}
function addRoomItem(id) {
  const def = ITEMS[id];
  const item = { u: uidGen(), id, fx: def.place === 'wall' ? rand(0.25, 0.75) : rand(0.35, 0.65), fy: def.place === 'wall' ? 0.45 : rand(0.3, 0.6), flip: false };
  st.room.items.push(item);
  const d = addDecorEl(item);
  placeDecor(d);
  cozyCache = -1;
  selectDecor(d);
  setDrawerMin(true);
  updateCozy(); renderDrawer(); placeGlow();
  for (let i = 0; i < 5; i++) spawnFx('sparkle', d.x + rand(-d.w / 2, d.w / 2), d.y - rand(0, d.h), { dx: rand(-20, 20), dy: rand(-40, -10) });
  saveSoon();
  return d;
}
function buyItem(id) {
  const it = ITEMS[id];
  if (it.place === 'wall' && isOutdoor()) { toast('Wall pieces need an indoor room.'); sfx.wrong(); return; }
  if (it.excl) {
    if (st.inv[id]) { placeFromInv(id); return; }
    toast(countOwned(id) ? `Your ${it.name} is already in the room.` : exclSource(id)); sfx.boop(); return;
  }
  if (it.price && it.price.p && st.pearls < it.price.p) { openPearlShop(it.price.p - st.pearls); return; }
  if (!spend(it.price)) { toast(`You need ${it.price.c - st.coins} more coins. Activities earn coins.`); sfx.wrong(); return; }
  sfx.coin();
  addRoomItem(id);
  toast(`${it.name} is in the room. Drag it where you like.`);
}
function placeFromInv(id) {
  if (!st.inv[id]) return;
  if (ITEMS[id].place === 'wall' && isOutdoor()) { toast('Wall pieces need an indoor room.'); sfx.wrong(); return; }
  st.inv[id]--;
  if (!st.inv[id]) delete st.inv[id];
  sfx.pop();
  addRoomItem(id);
}
function storeSelected() {
  const d = selected;
  if (!d || d.def.fixed) return;
  st.room.items = st.room.items.filter(i => i !== d.it);
  st.inv[d.it.id] = (st.inv[d.it.id] || 0) + 1;
  d.el.remove();
  decor = decor.filter(x => x !== d);
  if (pet.use && pet.use.d === d) endUse();
  selectDecor(null);
  cozyCache = -1; updateCozy(); renderDrawer(); placeGlow();
  sfx.pop(); toast(`${d.def.name} put away in My items`);
  saveSoon();
}
function themeTap(id) {
  const t = THEMES.find(x => x.id === id);
  if (t.price && !st.themes.includes(id)) {
    if (t.price.p && st.pearls < t.price.p) { openPearlShop(t.price.p - st.pearls); return; }
    if (!spend(t.price)) { toast(`You need ${t.price.c - st.coins} more coins.`); sfx.wrong(); return; }
    st.themes.push(id); sfx.coin();
  }
  st.room.theme = id;
  applyRoomLook();
  renderDrawer(); saveSoon();
  toast(`Welcome to ${t.name}`);
}
$('#decoDone').addEventListener('click', exitDecor);
$('#drawerToggle').addEventListener('click', () => setDrawerMin(!$('#drawer').classList.contains('min')));
$('#drawer').addEventListener('click', e => {
  const tab = e.target.closest('[data-tab]');
  if (tab) { drawerTab = tab.dataset.tab; drawerCat = 'all'; setDrawerMin(false); renderDrawer(); return; }
  const cat = e.target.closest('[data-cat]');
  if (cat) { drawerCat = cat.dataset.cat; renderDrawer(); return; }
  const b = e.target.closest('[data-buy]');
  if (b) { buyItem(b.dataset.buy); return; }
  const p = e.target.closest('[data-place]');
  if (p) { placeFromInv(p.dataset.place); return; }
  const th = e.target.closest('[data-theme]');
  if (th) themeTap(th.dataset.theme);
});
$('#selFlip').addEventListener('click', () => {
  if (!selected) return;
  selected.it.flip = !selected.it.flip;
  selected.el.classList.toggle('flip', selected.it.flip);
  sfx.pop(); saveSoon();
});
$('#selStore').addEventListener('click', storeSelected);
