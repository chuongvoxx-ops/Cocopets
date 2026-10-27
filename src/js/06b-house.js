/* ---------- the house: rooms with their own jobs, built and decorated by you ---------- */
const sitem = (id, fx, fy) => ({ u: uidGen(), id, fx, fy, flip: false });
const ROOM_TYPES = {
  living: { name: 'Living room', icon: 'sofa', theme: 'meadow', price: { c: 500 }, fn: 'Home base. Everything works here.', starter: () => starterItems() },
  bedroom: { name: 'Bedroom', icon: 'moon', theme: 'cloud', price: { c: 400 }, fn: 'Every pet sleeps 20% better, and beds here count extra.', starter: () => [sitem('rug_round', 0.5, 0.55), sitem('bed_basic', 0.28, 0.62), sitem('lamp_floor', 0.88, 0.25)] },
  kitchen: { name: 'Kitchen', icon: 'bowl', theme: 'tiles', price: { c: 450 }, fn: 'Meals eaten here fill 25% more and give extra bond.', starter: () => [sitem('fridge', 0.1, 0.18), sitem('stove', 0.42, 0.12), sitem('bowl', 0.82, 0.86)] },
  bathroom: { name: 'Bathroom', icon: 'bath', theme: 'spa', price: { c: 450 }, fn: 'Baths here bring a big happiness boost and extra bond.', starter: () => [sitem('bathtub', 0.5, 0.3), sitem('towel_rack', 0.25, 0.5), sitem('rubber_duck', 0.78, 0.82)] },
  playroom: { name: 'Playroom', icon: 'ball', theme: 'play', price: { c: 600 }, fn: 'Games here pay 25% more coins, and happiness drops slower.', starter: () => [sitem('rug_rainbow', 0.5, 0.62), sitem('yarn', 0.2, 0.72), sitem('toybox', 0.8, 0.28)] },
  garden: { name: 'Garden', icon: 'leaf', outdoor: true, price: { c: 800 }, fn: 'Fresh air: happiness drops 40% slower, butterflies to chase, and digs find more coins.', starter: () => [sitem('garden_tree', 0.13, 0.22), sitem('flower_bed', 0.62, 0.16), sitem('bird_bath', 0.88, 0.72)] },
  lab: { name: 'Laboratory', icon: 'flask', theme: 'lab', price: { c: 650 }, fn: 'Fuse pets, buy crystals and Fusion Stones, and restyle your pet in the cosmetic studio.', starter: () => [sitem('lab_bench', 0.2, 0.42), sitem('fusion_pod', 0.55, 0.18), sitem('crystal_case', 0.88, 0.3)] },
  shop: { name: 'Shop', icon: 'gift', theme: 'shop', price: null, fixed: true, fn: 'Everything for sale: crystals, treasure boxes, eggs, Fusion Stones and food that levels pets up and deepens their bond. Every house has one.', starter: () => [sitem('shop_lamp', 0.12, 0.12), sitem('shop_sign', 0.3, 0.56), sitem('shop_shelf', 0.64, 0.3), sitem('shop_lamp', 0.5, 0.08), sitem('shop_counter', 0.5, 0.2), sitem('shop_crystals', 0.14, 0.4), sitem('shop_treasure', 0.5, 0.46), sitem('shop_stones', 0.86, 0.46), sitem('shop_rug', 0.5, 0.74), sitem('shop_barrels', 0.1, 0.86), sitem('shop_plant', 0.9, 0.9)] },
  farm: { name: 'Farm', icon: 'sprout', outdoor: true, price: { c: 700 }, fn: 'Plant seeds, water them and harvest food that makes your pets grow.', starter: () => [] },
};
const ROOM_ORDER = ['bedroom', 'kitchen', 'bathroom', 'playroom', 'lab', 'garden', 'farm', 'living'];
const roomType = () => (st && st.room ? st.room.type : 'living');
const isOutdoor = () => !!(ROOM_TYPES[roomType()] || {}).outdoor;

/* ---------- moving between rooms ---------- */
const roomBar = $('#roomBar'), roomNameBtn = $('#roomName');
$('#roomPrev').innerHTML = ICON.back; $('#roomNext').innerHTML = ICON.next; $('#roomDeco').innerHTML = ICON.brush;
$('#roomDeco').addEventListener('click', () => { sfx.unlock(); doneTip('decor'); if (!decorating) enterDecor(); });
function updateRoomBar() {
  if (!st) return;
  const T = ROOM_TYPES[st.room.type], n = st.house.rooms.length;
  $('.rb-ic', roomNameBtn).innerHTML = ICON[T.icon] || ICON.house;
  $('b', roomNameBtn).textContent = st.room.name;
  roomNameBtn.setAttribute('aria-label', `${st.room.name}, room ${st.house.cur + 1} of ${n}. Open the house`);
  $('#roomPrev').disabled = n < 2; $('#roomNext').disabled = n < 2;
}
function applyRoomLook() {
  const T = ROOM_TYPES[st.room.type];
  roomEl.dataset.theme = st.room.theme;
  roomEl.dataset.kind = T.outdoor ? st.room.type : 'indoor';
  $('#labBtn').hidden = st.room.type !== 'lab';
  $('#shopBtn').hidden = st.room.type !== 'shop';
}
function switchRoom(i, dir) {
  if (!st || !running) return;
  const n = st.house.rooms.length;
  i = ((i % n) + n) % n;
  if (i === st.house.cur) return;
  if (act) endActivity(true);
  if (ball) removeBall();
  foods.slice().forEach(removeFood);
  clearMarker(false); hideBubble();
  if (selected) selectDecor(null);
  st.house.cur = i; st.room = st.house.rooms[i];
  roomEl.classList.remove('switching'); void roomEl.offsetWidth; roomEl.classList.add('switching');
  applyRoomLook(); renderDecor(); renderPlots(); resetButterflies();
  const side = (dir || 1) > 0 ? -1 : 1;
  unperch(); pet.use = null; pet.zOver = 0; pet.goal = null; pet.lift = 0; pet.liftV = 0;
  pet.x = side < 0 ? B.x0 : B.x1; pet.y = B.y0 + (B.y1 - B.y0) * 0.62;
  if (st.asleep) {
    const bed = bestBed();
    if (bed) { const sp = useSpot(bed); pet.x = sp.x; pet.y = clamp(sp.y, B.y0, B.y1); pet.perch = sp.perch; pet.perchZ = sp.z; }
    setMode('sleep');
  } else {
    setMode('idle');
    const p = clampXY(pet.x - side * W * 0.28, pet.y);
    setGoal('tap', p[0], p[1], false);
  }
  enterCompanions(side);
  updateRoomBar(); updateHint(); layout();
  if (decorating) { renderDrawer(); updateCozy(); }
  sfx.pop(); doneTip('rooms'); saveSoon();
  if (mansionOpen) renderMansion();
}
$('#roomPrev').addEventListener('click', () => { sfx.unlock(); switchRoom(st.house.cur - 1, -1); });
$('#roomNext').addEventListener('click', () => { sfx.unlock(); switchRoom(st.house.cur + 1, 1); });
roomNameBtn.addEventListener('click', () => { sfx.unlock(); openMansion(); });

/* ---------- the house sheet: go, decorate, build, rename, reorder, remove ---------- */
function roomCozy(r) { let c = 0; for (const i of r.items) c += ITEMS[i.id].cozy || 0; return c; }
function roomArt(r) {
  const T = ROOM_TYPES[r.type], th = THEMES.find(t => t.id === r.theme) || THEMES[0];
  const wall = T.outdoor ? '#9DD6F7' : th.wall, floor = T.outdoor ? (r.type === 'farm' ? '#B98A57' : '#8FD07D') : th.floor;
  return `<span class="rc-art" style="--w:${wall};--f:${floor}">${ICON[T.icon] || ICON.house}</span>`;
}
function openHouse() {
  if (!st) return;
  openSheet('house', '');
  renderHouse();
}
function renderHouse() {
  if (sheetKind !== 'house' || !st) return;
  const rooms = st.house.rooms, cur = st.house.cur, r = st.room, T = ROOM_TYPES[r.type];
  const kind = T.outdoor ? 'outdoor' : 'indoor';
  const prev = rooms.slice(0, cur).reverse().find(x => !!ROOM_TYPES[x.type].outdoor === !!T.outdoor), next = rooms.slice(cur + 1).find(x => !!ROOM_TYPES[x.type].outdoor === !!T.outdoor);
  sheetEl.innerHTML = `<div class="sheet-grab" aria-hidden="true"></div><button class="icon-btn sheet-close" type="button" data-sheet-close aria-label="Close">${ICON.close}</button>
    <p class="eyebrow">${esc(T.name)} · room ${cur + 1} of ${rooms.length}</p><h2 class="title" id="sheetTitle">${esc(r.name)}</h2>
    <div class="room-card here">${roomArt(r)}<div class="rc-txt"><b>${esc(T.fn)}</b><small>Cozy ${roomCozy(r)} · ${r.items.length} piece${r.items.length === 1 ? '' : 's'}${r.plots ? ` · ${r.plots.filter(p => p.crop).length}/6 planted` : ''}</small></div></div>
    <div class="evo-actions"><button class="btn primary" type="button" data-go="room-go" data-i="${cur}">${ICON.next}Walk in</button><button class="btn" type="button" data-go="room-deco" data-i="${cur}">${ICON.brush}Decorate</button></div>
    <form class="setting rename" id="roomRenameForm"><label for="roomRenameInput">Room name</label><div class="row"><input id="roomRenameInput" type="text" maxlength="18" autocomplete="off" spellcheck="false" value="${esc(r.name)}"><button class="btn" type="submit">Save</button></div></form>
    <h3 class="sec">Place in the mansion</h3>
    <p class="note">${T.outdoor ? 'Gardens and farms sit on the ground beside the house, in order.' : 'Indoor rooms fill the floors two at a time, from the ground up.'} Swap this room with its ${kind} neighbours to move it.</p>
    <div class="evo-actions"><button class="btn small" type="button" data-go="room-move" data-d="-1"${prev ? '' : ' disabled'}>${ICON.back}Swap with ${prev ? esc(prev.name) : 'earlier'}</button><button class="btn small" type="button" data-go="room-move" data-d="1"${next ? '' : ' disabled'}>Swap with ${next ? esc(next.name) : 'later'}${ICON.next}</button></div>
    <div class="evo-actions"><button class="btn small" type="button" data-go="room-remove" id="roomRemoveBtn"${rooms.length < 2 ? ' disabled' : ''}>Remove room</button>${mansionOpen ? '' : `<button class="btn small" type="button" data-go="mansion">${ICON.mansion}See the mansion</button>`}</div>
    <p class="note">Removing a room puts its furniture in My items${r.plots ? ' and clears its crops' : ''}.</p>`;
}
function buildRoom(type) {
  const T = ROOM_TYPES[type];
  if (!T || T.fixed || st.house.rooms.length >= MAX_ROOMS) return;
  if (T.price && T.price.p && st.pearls < T.price.p) { openPearlShop(T.price.p - st.pearls); return; }
  if (!spend(T.price)) { toast(`A ${T.name.toLowerCase()} costs ${T.price.c} coins. Play games and adventures to earn more.`, 3400); sfx.wrong(); return; }
  st.house.n = (st.house.n || st.house.rooms.length) + 1;
  const r = newRoom(type, st.house.n);
  const same = st.house.rooms.filter(x => x.type === type).length;
  if (same) r.name = `${T.name} ${same + 1}`;
  st.house.rooms.push(r);
  sfx.fanfare();
  closeSheet();
  if (mansionOpen) {
    // built from the mansion view: the new room pops into place and you can walk in when you like
    mnNew = r.id; mnSel = st.house.rooms.length - 1; renderMansion();
    toast(`${r.name} built! Tap it to walk in.`, 3600);
  } else {
    switchRoom(st.house.rooms.length - 1, 1);
    sparkles(10);
    toast(`${r.name} built! ${T.fn}`, 4200);
  }
  saveSoon();
}
let roomRemoveArmed = 0;
function removeRoom(btn) {
  if (st.house.rooms.length < 2 || (ROOM_TYPES[st.room.type] || {}).fixed) { if ((ROOM_TYPES[st.room.type] || {}).fixed) toast('The shop is part of every house.'); return; }
  if (!btn.classList.contains('armed')) { btn.classList.add('armed'); btn.textContent = 'Tap again to remove'; clearTimeout(roomRemoveArmed); roomRemoveArmed = setTimeout(() => { if (btn.isConnected) { btn.classList.remove('armed'); btn.textContent = 'Remove room'; } }, 4000); return; }
  const r = st.room, i = st.house.cur;
  r.items.forEach(it => { if (it.id !== 'bowl') st.inv[it.id] = (st.inv[it.id] || 0) + 1; });
  if (r.items.some(it => it.id === 'bowl') && !st.house.rooms.some((x, j) => j !== i && x.items.some(it => it.id === 'bowl'))) {
    const home = st.house.rooms.find((x, j) => j !== i && !ROOM_TYPES[x.type].outdoor) || st.house.rooms.find((x, j) => j !== i);
    home.items.push(sitem('bowl', 0.9, 0.9));
  }
  st.house.rooms.splice(i, 1);
  st.house.cur = Math.max(0, i - 1); st.room = st.house.rooms[st.house.cur];
  closeSheet();
  if (act) endActivity(true);
  if (ball) removeBall();
  foods.slice().forEach(removeFood);
  applyRoomLook(); renderDecor(); renderPlots(); resetButterflies(); enterCompanions(1); updateRoomBar(); layout();
  if (st.asleep) setMode('sleep'); else { setMode('idle'); pet.goal = null; unperch(); }
  toast(`${r.name} removed. Its furniture is in Decor, My items.`, 3400);
  saveSoon();
  if (mansionOpen) renderMansion();
}
function moveRoom(d) {
  const i = st.house.cur, rooms = st.house.rooms, out = !!ROOM_TYPES[rooms[i].type].outdoor;
  let j = i + d;
  while (j >= 0 && j < rooms.length && !!ROOM_TYPES[rooms[j].type].outdoor !== out) j += d;
  if (j < 0 || j >= rooms.length) return;
  [rooms[i], rooms[j]] = [rooms[j], rooms[i]];
  st.house.cur = j;
  updateRoomBar(); renderHouse(); saveSoon(); sfx.pop();
  if (mansionOpen) renderMansion();
}
sheetWrap.addEventListener('submit', e => {
  if (e.target.id !== 'roomRenameForm') return;
  e.preventDefault();
  const v = $('#roomRenameInput').value.replace(/[<>]/g, '').trim().slice(0, 18);
  if (!v || v === st.room.name) return;
  st.room.name = v; $('#roomRenameInput').blur();
  updateRoomBar(); renderHouse(); saveSoon();
  if (mansionOpen) renderMansion();
  toast(`Room renamed to ${v}`);
});

/* ---------- outdoors: butterflies in the garden ---------- */
const BFLY_SVG = c => `<svg viewBox="-12 -10 24 20" aria-hidden="true"><g class="bw"><path d="M0 0C-4 -9 -12 -9 -11 -3C-10 1 -5 2 0 0Z" fill="${c}" stroke="#2B2433" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 0C-3 5 -9 8 -9 4C-9 1 -5 0 0 0Z" fill="${c}" stroke="#2B2433" stroke-width="1.4" stroke-linejoin="round"/></g><g class="bw r"><path d="M0 0C4 -9 12 -9 11 -3C10 1 5 2 0 0Z" fill="${c}" stroke="#2B2433" stroke-width="1.4" stroke-linejoin="round"/><path d="M0 0C3 5 9 8 9 4C9 1 5 0 0 0Z" fill="${c}" stroke="#2B2433" stroke-width="1.4" stroke-linejoin="round"/></g><path d="M0 -5V5" stroke="#2B2433" stroke-width="2.2" stroke-linecap="round"/></svg>`;
let bflies = [];
function resetButterflies() {
  bflies.forEach(b => b.el.remove()); bflies = [];
  if (!st || roomType() !== 'garden') return;
  ['#FFB3C8', '#FFE37A', '#B8E1FF'].forEach((c, i) => {
    const el = document.createElement('div'); el.className = 'bfly'; el.innerHTML = BFLY_SVG(c);
    worldEl.appendChild(el);
    bflies.push({ el, x: rand(B.x0, B.x1), base: rand(wallH * 0.55, B.y1 - ps * 0.6), t: rand(0, 6), vx: (i % 2 ? 1 : -1) * rand(26, 46), y: 0, flee: 0 });
  });
}
function updateButterflies(dt) {
  for (const b of bflies) {
    b.t += dt;
    const sp = b.flee > 0 ? 4 : 1;
    b.flee = Math.max(0, b.flee - dt);
    b.x += b.vx * dt * sp;
    if (b.x < -20) { b.x = -20; b.vx = Math.abs(b.vx); } else if (b.x > W + 20) { b.x = W + 20; b.vx = -Math.abs(b.vx); }
    if (Math.random() < dt * 0.25) b.vx = -b.vx;
    b.y = b.base + Math.sin(b.t * 1.7) * 26 + Math.sin(b.t * 5.3) * 6 - (b.flee > 0 ? (1 - b.flee) * 40 : 0);
    b.el.style.transform = `translate3d(${(b.x - 13).toFixed(1)}px, ${(b.y - 11).toFixed(1)}px, 0) scaleX(${b.vx > 0 ? -1 : 1})`;
    b.el.style.zIndex = String(Math.round(Math.max(b.y + 60, wallH)));
  }
}
const butterflyAt = (x, y) => bflies.find(b => hyp(b.x - x, b.y - y) < 30);
function tapButterfly(b) {
  b.flee = 1; b.vx = (b.x < pet.x ? -1 : 1) * 60;
  sfx.chirp();
  if (canCommand() && !st.lightsOff) { const p = clampXY(b.x, Math.max(b.y + ps * 0.5, B.y0)); setGoal('bfly', p[0], p[1], true); }
}
function chaseButterfly() {
  const b = bflies.length ? pick(bflies) : null;
  if (!b) return false;
  const p = clampXY(b.x, Math.max(b.y + ps * 0.5, B.y0));
  setGoal('bfly', p[0], p[1], true);
  return true;
}
